import type { Metadata } from "next";
import Link from "next/link";
import { money, percent } from "@/components/admin/format";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { Badge, EmptyState, KpiCard, PageHeader, Pagination, Table, Td, Th, buildQuery, ghostButtonClass, inputClass } from "@/components/admin/ui";
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
        description="El nombre y el precio vienen del catálogo (npm run db:sync-catalog). Aquí registras costo y stock para calcular margen e inventario."
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Activos" value={summary.active} hint={`${summary.inactive} inactivos`} />
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
          <Table minWidth={1180}>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>SKU</Th>
                <Th align="right">Precio</Th>
                <Th align="right">Margen</Th>
                <Th align="right">Vendidos</Th>
                <Th>Estado</Th>
                <Th>Costo · Stock</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <Td className="max-w-72">
                    <p className="line-clamp-2">{product.name}</p>
                    <p className="mt-1 type-label text-steel">{[product.brand, product.category, product.supplier?.name].filter(Boolean).join(" · ")}</p>
                  </Td>
                  <Td className="font-mono text-xs text-steel">{product.sku}</Td>
                  <Td align="right" className="font-mono">{money(product.price)}</Td>
                  <Td align="right" className="font-mono">
                    {product.margin === null ? <span className="text-steel">—</span> : <span className={product.margin < 0.15 ? "text-amber-200" : ""}>{percent(product.margin, 1)}</span>}
                  </Td>
                  <Td align="right" className="font-mono">
                    {product.unitsSold}
                    {product.revenue > 0 && <p className="mt-1 text-xs text-steel">{money(product.revenue)}</p>}
                  </Td>
                  <Td>
                    {product.active ? <Badge tone="good">Activo</Badge> : <Badge tone="muted">Inactivo</Badge>}
                    {product.stock !== null && product.stock <= 5 && <div className="mt-2"><Badge tone="warn">Stock {product.stock}</Badge></div>}
                  </Td>
                  <Td>
                    <ProductEditor productId={product.id} costPrice={product.costPrice} stock={product.stock} active={product.active} />
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
