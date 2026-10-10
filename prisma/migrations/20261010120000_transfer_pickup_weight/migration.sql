-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'TRANSFER';
ALTER TYPE "PaymentProvider" ADD VALUE 'PICKUP';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "weightKg" DOUBLE PRECISION;
