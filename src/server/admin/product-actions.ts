"use server";

import { randomBytes } from "node:crypto";
import { del, put } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { PRODUCTS_TAG } from "@/lib/commerce";
import { requireAdmin } from "../auth";
import { db } from "../db";
import type { ActionState } from "./actions";
import { ImageImportError, MIN_SHARP_SIDE, importImageFromUrl } from "./image-import";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const pesos = (label: string, { required = false } = {}) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value.replace(/[.\s$,]/g, ""))))
    .refine((value) => (required ? value !== null : true), `Ingresa ${label}.`)
    .refine((value) => value === null || (Number.isInteger(value) && value >= 0 && value < 100_000_000), `${label[0].toUpperCase()}${label.slice(1)} inválido.`);

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const productSchema = z.object({
  name: z.string().trim().min(3, "El nombre es muy corto.").max(160),
  brand: text(80),
  category: z.string().trim().min(1, "Elige una categoría.").max(80),
  sku: text(40),
  description: text(2000),
  price: pesos("el precio", { required: true }),
  compareAtPrice: pesos("el precio anterior"),
  costPrice: pesos("el costo"),
  stock: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value >= 0 && value < 1_000_000), "Stock inválido."),
  fulfillment: z
    .enum(["", "STOCK", "DROP"], { error: "Tipo de entrega inválido." })
    .transform((value) => (value === "" ? null : value)),
  sortOrder: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value >= 0 && value < 100_000), "Posición inválida."),
  active: z.boolean(),
});

function readProductForm(formData: FormData) {
  const field = (key: string) => String(formData.get(key) ?? "");
  return productSchema.safeParse({
    name: field("name"),
    brand: field("brand"),
    category: field("category"),
    sku: field("sku"),
    description: field("description"),
    price: field("price"),
    compareAtPrice: field("compareAtPrice"),
    costPrice: field("costPrice"),
    stock: field("stock"),
    fulfillment: field("fulfillment"),
    sortOrder: field("sortOrder"),
    active: formData.get("active") === "on",
  });
}

/** Prefijo con el que la tienda pide las imágenes al store privado (ver /api/images/[...path]). */
const IMAGE_ROUTE = "/api/images/";

/**
 * Sube la imagen al Blob store privado y devuelve la ruta con que la tienda la muestra.
 * El store es privado: las URLs directas dan 403, por eso se sirven a través de /api/images.
 */
async function uploadImage(file: File, productId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Falta configurar Vercel Blob (BLOB_READ_WRITE_TOKEN) para subir imágenes.");
  }
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Formato no soportado. Usa JPG, PNG, WebP o AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen pesa más de 4 MB.");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`products/${slugify(productId) || "producto"}.${extension}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return `${IMAGE_ROUTE}${blob.pathname}`;
}

/** Borra la imagen anterior si estaba en el Blob store (las de /public no se tocan). */
async function deleteImage(url: string | null | undefined) {
  if (!url?.startsWith(IMAGE_ROUTE)) return;
  try {
    await del(url.slice(IMAGE_ROUTE.length));
  } catch (error) {
    console.warn("[admin] no se pudo borrar la imagen anterior", error);
  }
}

function refreshStorefront(productId?: string) {
  updateTag(PRODUCTS_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
}

function friendlyError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "Ya existe un producto con ese SKU.";
  }
  if (error instanceof ImageImportError) return error.message;
  if (error instanceof Error && /Blob|imagen|Formato/.test(error.message)) return error.message;
  console.error("[admin] producto", error);
  return "No se pudo guardar el producto.";
}

/**
 * Imagen nueva del formulario: un archivo subido o, si no hay, un link para importar.
 * Devuelve la ruta guardada y un aviso si la imagen original es de baja resolución.
 */
async function resolveNewImage(formData: FormData, productId: string) {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return { url: await uploadImage(file, productId), note: "" };

  const link = String(formData.get("imageUrl") ?? "").trim();
  if (!link) return null;
  const imported = await importImageFromUrl(link);
  const { width, height } = imported.original;
  return {
    url: await uploadImage(imported.file, productId),
    note: imported.lowResolution
      ? ` Ojo: la imagen original mide ${width}×${height} px; para que se vea nítida busca una de al menos ${MIN_SHARP_SIDE} px.`
      : ` Imagen importada (${width}×${height} px).`,
  };
}

// ───────────── Crear ─────────────

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = readProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const suffix = randomBytes(3).toString("hex");
  const id = `wfx-${slugify(data.name) || "producto"}-${suffix}`;
  let createdId: string;
  try {
    const imageUrl = (await resolveNewImage(formData, id))?.url ?? null;
    const product = await db.product.create({
      data: {
        id,
        slug: id,
        sku: data.sku ?? `WFX-${suffix.toUpperCase()}`,
        name: data.name,
        brand: data.brand,
        category: data.category,
        description: data.description,
        price: data.price!,
        costPrice: data.costPrice,
        compareAtPrice: data.compareAtPrice,
        fulfillment: data.fulfillment,
        sortOrder: data.sortOrder,
        stock: data.stock,
        active: data.active,
        image: imageUrl,
      },
    });
    createdId = product.id;
  } catch (error) {
    return { error: friendlyError(error) };
  }
  refreshStorefront();
  redirect(`/admin/products/${createdId}?creado=1`);
}

// ───────────── Editar ─────────────

export async function updateProductDetailsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const parsed = readProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const current = await db.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "El producto ya no existe." };

  let note = "";
  try {
    const newImage = await resolveNewImage(formData, productId);
    const removeImage = formData.get("removeImage") === "on";
    let imageUrl = current.image;
    if (newImage) {
      imageUrl = newImage.url;
      note = newImage.note;
    } else if (removeImage) imageUrl = null;

    await db.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        brand: data.brand,
        category: data.category,
        sku: data.sku ?? current.sku,
        description: data.description,
        price: data.price!,
        costPrice: data.costPrice,
        compareAtPrice: data.compareAtPrice,
        fulfillment: data.fulfillment,
        sortOrder: data.sortOrder,
        stock: data.stock,
        active: data.active,
        image: imageUrl,
      },
    });
    if (imageUrl !== current.image) await deleteImage(current.image);
  } catch (error) {
    return { error: friendlyError(error) };
  }
  refreshStorefront(productId);
  return { ok: true, message: `Producto guardado.${note}` };
}

/** Edición rápida desde la lista: precio, costo, stock y estado. */
const quickSchema = z.object({
  productId: z.string().min(1).max(160),
  price: pesos("el precio", { required: true }),
  costPrice: pesos("el costo"),
  stock: productSchema.shape.stock,
  active: z.boolean(),
});

export async function quickUpdateProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = quickSchema.safeParse({
    productId: formData.get("productId"),
    price: String(formData.get("price") ?? ""),
    costPrice: String(formData.get("costPrice") ?? ""),
    stock: String(formData.get("stock") ?? ""),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { productId, price, ...rest } = parsed.data;
  await db.product.update({ where: { id: productId }, data: { price: price!, ...rest } });
  refreshStorefront();
  return { ok: true, message: "Guardado." };
}

// ───────────── Eliminar ─────────────

export async function deleteProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "El producto ya no existe." };
  // Los pedidos históricos conservan nombre, SKU y precio (snapshot); su productId queda en NULL.
  await db.product.delete({ where: { id: productId } });
  await deleteImage(product.image);
  refreshStorefront();
  redirect("/admin/products?eliminado=1");
}
