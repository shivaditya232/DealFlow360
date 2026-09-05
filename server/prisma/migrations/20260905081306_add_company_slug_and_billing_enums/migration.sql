/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `prorationRule` on the `SubscriptionPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cancellationRefundRule` on the `SubscriptionPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProrationRule" AS ENUM ('DAILY_RATE', 'NO_PRORATION', 'FULL_PERIOD');

-- CreateEnum
CREATE TYPE "CancellationRefundRule" AS ENUM ('NO_REFUND', 'PRORATED', 'FULL_PERIOD_REFUND');

-- AlterEnum
ALTER TYPE "BillingCycle" ADD VALUE 'WEEKLY';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "NegotiationRequest" ADD COLUMN     "requestedDeliveryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "promisedDeliveryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "prorationRule",
ADD COLUMN     "prorationRule" "ProrationRule" NOT NULL,
DROP COLUMN "cancellationRefundRule",
ADD COLUMN     "cancellationRefundRule" "CancellationRefundRule" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
