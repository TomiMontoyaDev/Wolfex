import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { createProductAction } from "@/server/admin/product-actions";
import { listCategories } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <Link href="/admin/products" className="type-label text-steel transition-colors hover:text-arc">← Productos</Link>
      <div className="mt-4">
        <PageHeader eyebrow="WOLFEX® ADMIN / 04 — PRODUCTOS" title="Nuevo producto" description="Aparece en la tienda apenas lo guardes (si está marcado como visible)." />
      </div>
      <div className="mt-8">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Crear producto"
          values={{ name: "", brand: null, category: null, sku: null, description: null, price: null, compareAtPrice: null, costPrice: null, stock: null, fulfillment: null, sortOrder: null, active: true, lowPriority: false, image: null }}
        />
      </div>
    </>
  );
}
