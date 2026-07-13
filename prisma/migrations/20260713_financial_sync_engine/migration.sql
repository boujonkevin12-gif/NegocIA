-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "FinancialImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "description" TEXT NOT NULL,
    "counterparty" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialImport_userId_source_idx" ON "FinancialImport"("userId", "source");

-- CreateIndex
CREATE INDEX "FinancialImport_userId_createdAt_idx" ON "FinancialImport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialEntry_userId_date_idx" ON "FinancialEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "FinancialEntry_userId_type_idx" ON "FinancialEntry"("userId", "type");

-- CreateIndex
CREATE INDEX "FinancialEntry_userId_category_idx" ON "FinancialEntry"("userId", "category");

-- CreateIndex
CREATE INDEX "FinancialEntry_userId_source_idx" ON "FinancialEntry"("userId", "source");

-- AddForeignKey
ALTER TABLE "FinancialImport" ADD CONSTRAINT "FinancialImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_importId_fkey" FOREIGN KEY ("importId") REFERENCES "FinancialImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
