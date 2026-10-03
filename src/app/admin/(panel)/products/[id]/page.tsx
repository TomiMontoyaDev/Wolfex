import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DangerAction } from "@/components/admin/DeleteControls";
import { money, percent } from "@/components/admin/format";
import { ProductForm } from "@/components/admin/ProductForm";
import { Badge, KpiCard, PageHeader } from "@/components/admin/ui";
import { deleteProductAction, updateProductDetailsAction } from "@/server/admin/product-actions";
import { getProduct, listCategories } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Producto" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [data, categories] = await Promise.all([getProduct(decodeURIComponent(id)), listCategories()]);
  if (!data) notFound();
  const { product, unitsSold, revenue } = data;
  const margin = product.costPrice !== null && product.price > 0 ? (product.price - product.costPrice) / product.price : null;

  return (
    <>
      <Link href="/admin/products" className="type-label text-steel transition-colors hover:text-arc">← Productos</Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={`PRODUCTO · ${product.sku}`}
          title={product.name}
          actions={
            <>
              {product.active ? <Badge tone="good">Visible</Badge> : <Badge tone="muted">Oculto</Badge>}
              {product.stock === 0 && <Badge tone="warn">Agotado</Badge>}
            </>
          }
        />
      </div>

      {query.creado && <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Producto creado. Ya está en la tienda.</p>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Precio actual" value={money(product.price)} />
        <KpiCard label="Margen" value={percent(margin, 1)} hint={product.costPrice === null ? "Registra el costo para calcularlo" : `Costo ${money(product.costPrice)}`} />
        <KpiCard label="Unidades vendidas" value={unitsSold} hint="Pedidos pagados" />
        <KpiCard label="Ingresos" value={money(revenue)} />
      </section>

      <div className="mt-8">
        <ProductForm
          action={updateProductDetailsAction}
          categories={categories}
          submitLabel="Guardar cambios"
          values={{
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            sku: product.sku,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            costPrice: product.costPrice,
            stock: product.stock,
            fulfillment: product.fulfillment,
            sortOrder: product.sortOrder,
            active: product.active,
            image: product.image,
          }}
        />
      </div>

      <section className="mt-10 rounded-sm border border-red-400/20 p-5 sm:p-6">
        <p className="type-label text-red-300">Zona de peligro</p>
        <p className="mt-2 max-w-2xl text-sm text-steel">
          Eliminar borra el producto de la tienda y su imagen. Los pedidos anteriores conservan el nombre, SKU y precio con que se vendió.
          Si solo quieres ocultarlo temporalmente, desmarca “Visible en la tienda”.
        </p>
        <div className="mt-4">
          <DangerAction
            action={deleteProductAction}
            fields={{ productId: product.id }}
            label="Eliminar producto…"
            title={`¿Eliminar “${product.name}”? No se puede deshacer.`}
            confirmLabel="Sí, eliminar producto"
          />
        </div>
      </section>
    </>
  );
}
