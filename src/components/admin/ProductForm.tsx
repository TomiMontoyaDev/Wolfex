"use client";

import { ImagePlus, X } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { minPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { ActionState } from "@/server/admin/actions";
import { buttonClass, inputClass } from "./ui";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export interface ProductFormValues {
  id?: string;
  name: string;
  brand: string | null;
  category: string | null;
  sku: string | null;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number | null;
  fulfillment: "STOCK" | "DROP" | null;
  sortOrder: number | null;
  active: boolean;
  lowPriority: boolean;
  image: string | null;
}

const MAX_SIDE = 1600;

/**
 * Reduce la foto en el navegador (máx. 1600 px, WebP o JPEG) antes de subirla:
 * sube más rápido, no choca con el límite de 4 MB y la tienda carga liviana.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    // Safari no codifica WebP: si devuelve otro formato, se usa JPEG.
    let blob = await toBlob("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}

const formatKb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

export function ProductForm({ action, values, categories, submitLabel }: { action: Action; values: ProductFormValues; categories: string[]; submitLabel: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(values.image);
  const [removeImage, setRemoveImage] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [link, setLink] = useState("");
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Al guardar con éxito, la imagen ya está en el servidor: se limpia lo pendiente.
  useEffect(() => {
    if (state.ok) {
      setFile(null);
      setLink("");
    }
  }, [state]);

  async function pick(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) return;
    setCompressing(true);
    const compressed = await compressImage(selected);
    setCompressing(false);
    setFile(compressed);
    setLink("");
    setRemoveImage(false);
    setPreview(URL.createObjectURL(compressed));
  }

  function applyLink(value: string) {
    setLink(value);
    const trimmed = value.trim();
    if (/^https:\/\/\S+$/i.test(trimmed)) {
      setFile(null);
      setRemoveImage(false);
      setPreview(trimmed);
      if (fileInput.current) fileInput.current.value = "";
    } else if (!trimmed) {
      setPreview(file ? preview : values.image);
    }
  }

  // Resolución real de lo que se ve en la vista previa (para detectar fotos pixeladas).
  const lowRes = size !== null && Math.max(size.width, size.height) < 800;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Reemplaza el archivo original por la versión comprimida (sin archivo nuevo, va vacío y se ignora).
    if (file) {
      formData.set("image", file);
      formData.delete("imageUrl");
    }
    if (removeImage) formData.set("removeImage", "on");
    startTransition(() => formAction(formData));
  }

  const field = "mt-2 " + inputClass;

  return (
    // `action` permite enviar sin JavaScript (sin compresión); con JS, onSubmit comprime la imagen primero.
    <form action={formAction} onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      {values.id && <input type="hidden" name="productId" value={values.id} />}

      <div className="space-y-5 rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
        <label className="block">
          <span className="type-label text-steel">Nombre *</span>
          <input name="name" required minLength={3} maxLength={160} defaultValue={values.name} className={field} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="type-label text-steel">Marca</span>
            <input name="brand" maxLength={80} defaultValue={values.brand ?? ""} className={field} />
          </label>
          <label className="block">
            <span className="type-label text-steel">Categoría *</span>
            <input name="category" required list="product-categories" maxLength={80} defaultValue={values.category ?? ""} placeholder="Elige o escribe una" className={field} />
            <datalist id="product-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="type-label text-steel">Precio de venta (COP) *</span>
            <input name="price" required inputMode="numeric" defaultValue={values.price ?? ""} placeholder="79900" className={field} />
            {values.costPrice !== null && (
              <span className="mt-1.5 block text-xs text-steel">
                Mínimo con 15% neto real (pasarela{values.fulfillment === "STOCK" ? ", recargo de stock" : ", envío"}):{" "}
                {formatPrice(minPrice({ wholesale: values.costPrice, fulfillment: values.fulfillment, name: values.name, category: values.category }))}
              </span>
            )}
          </label>
          <label className="block">
            <span className="type-label text-steel">Costo (COP)</span>
            <input name="costPrice" inputMode="numeric" defaultValue={values.costPrice ?? ""} placeholder="Opcional" className={field} />
          </label>
          <label className="block">
            <span className="type-label text-steel">Stock</span>
            <input name="stock" inputMode="numeric" defaultValue={values.stock ?? ""} placeholder="Vacío = sin control" className={field} />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="type-label text-steel">Precio antes (tachado)</span>
            <input name="compareAtPrice" inputMode="numeric" defaultValue={values.compareAtPrice ?? ""} placeholder="Opcional" className={field} />
            <span className="mt-1.5 block text-xs text-steel">Precio público del proveedor. Se muestra tachado (con -X%) solo si el descuento es de 5% o más.</span>
          </label>
          <label className="block">
            <span className="type-label text-steel">Entrega</span>
            <select name="fulfillment" defaultValue={values.fulfillment ?? ""} className={`${field} appearance-none`}>
              <option value="">Sin etiqueta</option>
              <option value="STOCK">Entrega HOY en Pereira (stock)</option>
              <option value="DROP">Envío nacional (dropshipping)</option>
            </select>
          </label>
          <label className="block">
            <span className="type-label text-steel">Posición en la tienda</span>
            <input name="sortOrder" inputMode="numeric" defaultValue={values.sortOrder ?? ""} placeholder="Vacío = al final" className={field} />
            <span className="mt-1.5 block text-xs text-steel">1 = primero. Los 12 primeros salen destacados en el inicio.</span>
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="type-label text-steel">SKU</span>
            <input name="sku" maxLength={40} defaultValue={values.sku ?? ""} placeholder={values.id ? "" : "Se genera solo si lo dejas vacío"} className={field} />
          </label>
          <label className="flex items-end gap-3 pb-3">
            <input type="checkbox" name="active" defaultChecked={values.active} className="h-5 w-5 accent-[#0066ff]" />
            <span className="text-sm text-bone">Visible en la tienda</span>
          </label>
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="lowPriority" defaultChecked={values.lowPriority} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0066ff]" />
          <span className="text-sm text-bone">
            Baja prioridad
            <span className="mt-0.5 block text-xs text-steel">No compites en precio con este producto: nunca sale en los destacados del inicio. Sirve para filtrarlo cuando reduzcas el catálogo.</span>
          </span>
        </label>
        <label className="block">
          <span className="type-label text-steel">Descripción</span>
          <textarea name="description" rows={4} maxLength={2000} defaultValue={values.description ?? ""} className={`${field} h-auto py-3`} />
        </label>
      </div>

      <div className="space-y-4">
        <div className="rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
          <p className="type-label text-steel">Imagen del producto</p>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && fileInput.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              pick(event.dataTransfer.files[0]);
            }}
            className={`relative mt-3 flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed transition-colors ${
              dragging ? "border-arc bg-volt/10" : "border-line-strong bg-void hover:border-arc"
            }`}
          >
            {preview && !removeImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) o remota
              <img
                key={preview}
                src={preview}
                alt="Vista previa"
                className="h-full w-full object-contain"
                onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                onError={() => setSize(null)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <ImagePlus className="h-8 w-8 text-arc" strokeWidth={1.25} />
                <p className="text-sm text-bone">Haz clic o arrastra una imagen</p>
                <p className="type-label text-steel">JPG, PNG o WebP · se optimiza sola</p>
              </div>
            )}
            {compressing && <div className="absolute inset-0 flex items-center justify-center bg-void/80 type-label text-arc">Optimizando…</div>}
          </div>
          <input ref={fileInput} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => pick(event.target.files?.[0])} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {file ? (
              <span className="type-label text-emerald-300">Nueva imagen lista · {formatKb(file.size)} (se sube al guardar)</span>
            ) : link.trim() ? (
              <span className="type-label text-emerald-300">Se importará desde el link al guardar</span>
            ) : (
              <span className="type-label text-steel">{preview && !removeImage ? "Imagen actual" : "Sin imagen"}</span>
            )}
            {(preview || file) && !removeImage && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setLink("");
                  setPreview(null);
                  setSize(null);
                  setRemoveImage(Boolean(values.image));
                  if (fileInput.current) fileInput.current.value = "";
                }}
                className="inline-flex items-center gap-1 type-label text-steel hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" /> Quitar
              </button>
            )}
          </div>

          {preview && !removeImage && size && (
            <p className={`mt-2 type-label ${lowRes ? "text-amber-200" : "text-steel"}`}>
              {size.width}×{size.height} px · {lowRes ? "baja resolución, se verá pixelada en la tienda" : "buena resolución"}
            </p>
          )}

          <label className="mt-5 block border-t border-line pt-4">
            <span className="type-label text-steel">O importa desde un link</span>
            <input
              name="imageUrl"
              type="url"
              inputMode="url"
              value={link}
              onChange={(event) => applyLink(event.target.value)}
              placeholder="https://… (clic derecho en la foto → Copiar dirección de la imagen)"
              className={`mt-2 ${inputClass}`}
            />
            <span className="mt-2 block text-xs leading-5 text-steel">
              Usa fotos del fabricante o de tu proveedor, de al menos 800 px. Se descargan, se optimizan y se guardan en tu almacenamiento.
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <button disabled={pending || compressing} className={`${buttonClass} h-14 w-full justify-between`}>
            <span>{pending ? (file ? "Subiendo imagen y guardando…" : link.trim() ? "Importando imagen y guardando…" : "Guardando…") : submitLabel}</span>
            <span aria-hidden="true">→</span>
          </button>
          {state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
          {state.ok && <p role="status" className="text-sm text-emerald-300">{state.message}</p>}
        </div>
      </div>
    </form>
  );
}
