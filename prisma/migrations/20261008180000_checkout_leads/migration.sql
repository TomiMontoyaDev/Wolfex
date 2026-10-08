-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "isLead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "leadToken" TEXT,
ADD COLUMN "leadCart" JSONB,
ADD COLUMN "leadUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_leadToken_key" ON "Customer"("leadToken");

-- CreateIndex
CREATE INDEX "Customer_isLead_idx" ON "Customer"("isLead");
