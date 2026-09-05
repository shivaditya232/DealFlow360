/*
  Warnings:

  - Made the column `proposedChanges` on table `NegotiationProposal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `snapshotLimits` on table `NegotiationProposal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "NegotiationProposal" ALTER COLUMN "proposedChanges" SET NOT NULL,
ALTER COLUMN "snapshotLimits" SET NOT NULL;
