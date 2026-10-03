-- CreateEnum
CREATE TYPE "Fulfillment" AS ENUM ('STOCK', 'DROP');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fulfillment" "Fulfillment",
ADD COLUMN     "sortOrder" INTEGER;

-- CreateIndex
CREATE INDEX "Product_sortOrder_idx" ON "Product"("sortOrder");
