-- Productos pesados: envío nacional gratis solo desde un mínimo mayor y recargo fijo por debajo.
ALTER TABLE "Product" ADD COLUMN "heavy" BOOLEAN NOT NULL DEFAULT false;
