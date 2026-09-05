-- CreateEnum
CREATE TYPE "ProposedByType" AS ENUM ('REP', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "NegotiationProposal" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "lineId" TEXT,
    "proposedByType" "ProposedByType" NOT NULL,
    "proposedByUserId" TEXT,
    "proposedByCustomerId" TEXT,
    "proposedChanges" JSONB NOT NULL,
    "snapshotLimits" JSONB NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NegotiationProposal_quotationId_status_idx" ON "NegotiationProposal"("quotationId", "status");

-- AddForeignKey
ALTER TABLE "NegotiationProposal" ADD CONSTRAINT "NegotiationProposal_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationProposal" ADD CONSTRAINT "NegotiationProposal_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "QuotationLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationProposal" ADD CONSTRAINT "NegotiationProposal_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationProposal" ADD CONSTRAINT "NegotiationProposal_proposedByCustomerId_fkey" FOREIGN KEY ("proposedByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
