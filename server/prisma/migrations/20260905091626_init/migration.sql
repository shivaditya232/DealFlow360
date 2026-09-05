-- AlterTable
ALTER TABLE "NegotiationProposal" ALTER COLUMN "proposedChanges" DROP NOT NULL,
ALTER COLUMN "snapshotLimits" DROP NOT NULL;
