# WOLFEX® — Backend: base de datos, pedidos y admin

## Flujo

```
Carrito (cliente) → /checkout → POST /api/orders
  → Zod valida → precios desde Postgres (nunca del navegador)
  → Customer (upsert por email) + Address + Order (snapshot) + OrderItems + OrderEvent
  → Preferencia de Mercado Pago (Checkout Pro) → redirección a Mercado Pago
Mercado Pago → POST /api/mercadopago/webhook
  → firma (si hay MERCADOPAGO_WEBHOOK_SECRET) → GET del pago a la API de MP
  → valida monto/moneda → Payment (upsert idempotente, fila de Order bloqueada) → Order → OrderEvent
/payment/result solo MUESTRA el estado; nunca marca nada como pagado.
```

## Código

| Ruta | Qué hace |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (montos en COP enteros) |
| `prisma/migrations/` | Migraciones SQL versionadas |
| `prisma.config.ts` | Config de Prisma 7 (carga `.env.local`, usa `DIRECT_URL` para migrar) |
| `prisma/sync-catalog.ts` | Copia `src/data/products.ts` → tabla `Product` (no toca costo ni stock) |
| `prisma/seed-demo.ts` | Datos ficticios marcados `DEMO-*` solo para desarrollo |
| `src/server/db.ts` | Cliente Prisma (adapter `pg`), perezoso |
| `src/server/orders.ts` | Creación de pedidos + preferencia de Mercado Pago |
| `src/server/payments.ts` | Procesamiento idempotente de pagos (webhook) |
| `src/server/admin/` | Consultas, Server Actions y zona horaria del admin |
| `src/server/auth.ts`, `session.ts`, `src/proxy.ts` | Sesión del admin (cookie HMAC) |
| `src/app/admin/` | Panel: dashboard, pedidos, clientes, ventas, productos |

## Neon

1. Crear proyecto en https://console.neon.tech (región cercana: `aws-us-east-1` o `sa-east-1`).
2. *Connect* → copiar la cadena **pooled** (host con `-pooler`) en `DATABASE_URL` y la **directa** en `DIRECT_URL`.
3. Desarrollo: crear una *branch* `dev` en Neon y usar sus cadenas en `.env.local`; producción usa la branch `main`.

## Comandos

```bash
npm install                 # también ejecuta prisma generate
npm run db:migrate          # desarrollo: aplica/crea migraciones (prisma migrate dev)
npm run db:sync-catalog     # importa/actualiza el catálogo real (repetir tras cambiar precios)
npm run db:seed:demo        # opcional, datos ficticios
npm run db:seed:demo:clean  # borra los datos ficticios
npm run db:studio           # explorar la base
```

**Producción (Vercel u otro):** nunca `migrate dev`. En el deploy:

```bash
npm run db:migrate:deploy && npm run db:sync-catalog
```

Variables en el hosting: `DATABASE_URL`, `DIRECT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`,
`MERCADOPAGO_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` (https).

## Reglas importantes

- **Los productos viven en la base de datos** y se gestionan en `/admin/products` (crear, editar, precio, imagen,
  stock, ocultar, eliminar). La tienda los lee de ahí (`src/lib/commerce.ts`, caché con la etiqueta `products`
  que el admin invalida al guardar). `src/data/products.ts` solo se usó para la importación inicial:
  `db:sync-catalog` no hace nada si la tabla ya tiene productos y nunca modifica productos existentes.
- Imágenes: se suben a un Blob store **privado** de Vercel (`BLOB_READ_WRITE_TOKEN`), comprimidas en el navegador
  a ≤1600 px, y la tienda las muestra por `/api/images/products/…` (solo expone `products/`; caché de CDN de 1 año).
  Las imágenes antiguas en `public/images/products` siguen funcionando.
- Vercel Analytics (`<Analytics />` en el layout) solo se carga en la tienda, no en `/admin`.
- `active = false` → el producto se oculta de la tienda. `stock = 0` → visible como AGOTADO y no se puede comprar.
- `stock = NULL` → inventario no controlado. Con número, el checkout lo valida y el pago aprobado lo descuenta.
- Eliminar pedidos/clientes desde el admin es definitivo y no toca Mercado Pago.
- Cancelar un pedido pagado NO reembolsa: el reembolso se hace en Mercado Pago y su webhook marca el pedido `REFUNDED`.
- Los costos desconocidos quedan en NULL; la utilidad estimada indica cuándo es parcial.
