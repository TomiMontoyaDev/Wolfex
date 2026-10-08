-- AlterTable
ALTER TABLE "Order" ADD COLUMN "tracking" JSONB,
ADD COLUMN "metaPurchaseSentAt" TIMESTAMP(3);
