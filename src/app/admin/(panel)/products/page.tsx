import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { money, percent } from "@/components/admin/format";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { Badge, EmptyState, KpiCard, PageHeader, Pagination, Table, Td, Th, buildQuery, buttonClass, ghostButtonClass, inputClass } from "@/components/admin/ui";
import { listProducts } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Productos" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = { q: one(raw.q), status: one(raw.status), category: one(raw.category), page: one(raw.page) };
  const { products, categories, total, page, pages, summary } = await listProducts(filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.category);

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 04 — PRODUCTOS"
        title="Productos"
        description="Lo que cambies aquí se ve en la tienda al instante. Precio, costo y stock se editan desde la lista; nombre, imagen y descripción, entrando al producto."
        actions={
          <Link href="/admin/products/new" className={buttonClass}>
            + Nuevo producto
          </Link>
        }
      />

      {raw.eliminado && <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Producto eliminado.</p>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Visibles" value={summary.active} hint={`${summary.inactive} ocultos`} />
        <KpiCard label="Con costo registrado" value={summary.withCost} hint="Necesario para margen y utilidad" />
        <KpiCard label="Con inventario controlado" value={summary.tracked} hint="El resto se vende sin límite de stock" />
        <KpiCard label="Resultados" value={total} />
      </section>

      <form className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto]" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Nombre, SKU o marca" aria-label="Buscar producto" className={inputClass} />
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Estado" className={`${inputClass} appearance-none`}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="no-cost">Sin costo</option>
          <option value="low-stock">Stock bajo (≤ 5)</option>
        </select>
        <select name="category" defaultValue={filters.category ?? ""} aria-label="Categoría" className={`${inputClass} appearance-none`}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className={ghostButtonClass}>Filtrar</button>
          {hasFilters && <Link href="/admin/products" className="inline-flex h-11 items-center px-2 type-label text-steel hover:text-arc">Limpiar</Link>}
        </div>
      </form>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Ningún producto coincide" : "No hay productos en la base de datos"}
            description={hasFilters ? "Prueba con otros filtros." : "Ejecuta npm run db:sync-catalog para importar el catálogo actual."}
          />
        ) : (
          <Table minWidth={1240}>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>SKU</Th>
                <Th align="right">Margen</Th>
                <Th align="right">Vendidos</Th>
                <Th>Estado</Th>
                <Th>Precio · Costo · Stock</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <Td className="max-w-80">
                    <Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="group flex items-center gap-3">
                      <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-void ring-1 ring-inset ring-line-strong">
                        {product.image ? (
                          <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center type-label text-[0.5rem] text-steel">SIN IMG</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 transition-colors group-hover:text-arc">{product.name}</span>
                        <span className="mt-1 block type-label text-steel">{[product.brand, product.category].filter(Boolean).join(" · ")}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-steel">{product.sku}</Td>
                  <Td align="right" className="font-mono">
                    {product.margin === null ? <span className="text-steel">—</span> : <span className={product.margin < 0.15 ? "text-amber-200" : ""}>{percent(product.margin, 1)}</span>}
                  </Td>
                  <Td align="right" className="font-mono">
                    {product.unitsSold}
                    {product.revenue > 0 && <p className="mt-1 text-xs text-steel">{money(product.revenue)}</p>}
                  </Td>
                  <Td>
                    {product.active ? <Badge tone="good">Visible</Badge> : <Badge tone="muted">Oculto</Badge>}
                    {product.stock !== null && product.stock <= 5 && <div className="mt-2"><Badge tone="warn">{product.stock === 0 ? "Agotado" : `Stock ${product.stock}`}</Badge></div>}
                  </Td>
                  <Td>
                    <ProductEditor key={`${product.id}-${product.price}-${product.costPrice}-${product.stock}-${product.active}`} productId={product.id} price={product.price} costPrice={product.costPrice} stock={product.stock} active={product.active} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} href={(p) => buildQuery("/admin/products", { ...filters, page: p })} />
      </div>
    </>
  );
}
