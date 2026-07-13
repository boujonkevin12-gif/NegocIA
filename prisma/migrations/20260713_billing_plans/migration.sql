-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED');

-- CreateTable
CREATE TABLE "UserPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "BillingStatus" NOT NULL DEFAULT 'ACTIVE',
    "mercadopagoPreferId" TEXT,
    "mercadopagoInitPoin" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userPlanId" TEXT NOT NULL,
    "mercadopagoPaymentId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_userId_key" ON "UserPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_mercadopagoPreferId_key" ON "UserPlan"("mercadopagoPreferId");

-- CreateIndex
CREATE INDEX "UserPlan_status_idx" ON "UserPlan"("status");

-- CreateIndex
CREATE INDEX "Payment_userPlanId_createdAt_idx" ON "Payment"("userPlanId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mercadopagoPaymentId_key" ON "Payment"("mercadopagoPaymentId");

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
