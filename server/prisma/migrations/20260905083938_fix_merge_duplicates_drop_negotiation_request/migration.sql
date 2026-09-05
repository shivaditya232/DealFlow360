/*
  Warnings:

  - You are about to drop the `NegotiationRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NegotiationRequest" DROP CONSTRAINT "NegotiationRequest_lineId_fkey";

-- DropForeignKey
ALTER TABLE "NegotiationRequest" DROP CONSTRAINT "NegotiationRequest_quotationId_fkey";

-- AlterTable
ALTER TABLE "NegotiationProposal" ADD COLUMN     "message" TEXT,
ADD COLUMN     "requestedDeliveryDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "NegotiationRequest";

-- DropEnum
DROP TYPE "NegotiationStatus";

-- DropEnum
DROP TYPE "NegotiationType";
