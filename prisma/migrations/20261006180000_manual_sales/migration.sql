-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'MANUAL';

-- AlterEnum
ALTER TYPE "OrderEventType" ADD VALUE 'ORDER_EDITED';

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('WEB', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'PRESENCIAL', 'REFERIDO', 'OTRO');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "salesChannel" "SalesChannel" NOT NULL DEFAULT 'WEB';

-- AlterTable: correo opcional para clientes creados a mano (único sigue aplicando a los que lo tienen).
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrderExpense" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderExpense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderExpense_amount_check" CHECK ("amount" >= 0)
);

-- CreateIndex
CREATE INDEX "OrderExpense_orderId_idx" ON "OrderExpense"("orderId");

-- AddForeignKey
ALTER TABLE "OrderExpense" ADD CONSTRAINT "OrderExpense_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
