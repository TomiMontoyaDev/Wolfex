-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NO_SOLICITADA', 'PENDIENTE', 'EMITIDA');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('NATURAL', 'JURIDICA');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('CC', 'NIT', 'CE', 'PASAPORTE');

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "requiresInvoice" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'NO_SOLICITADA',
  ADD COLUMN "dianInvoiceNumber" TEXT,
  ADD COLUMN "cufe" TEXT,
  ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3),
  ADD COLUMN "receiptNumber" TEXT;

-- CreateTable
CREATE TABLE "InvoiceRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "docType" "DocType" NOT NULL,
    "docNumber" TEXT NOT NULL,
    "dv" TEXT,
    "legalName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceRequest_orderId_key" ON "InvoiceRequest"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_receiptNumber_key" ON "Order"("receiptNumber");

-- CreateIndex
CREATE INDEX "Order_invoiceStatus_idx" ON "Order"("invoiceStatus");

-- AddForeignKey
ALTER TABLE "InvoiceRequest" ADD CONSTRAINT "InvoiceRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Consecutivo de comprobantes de venta (WFX-C-000001, WFX-C-000002…). Una secuencia nunca repite números.
CREATE SEQUENCE "order_receipt_number_seq" START 1;
