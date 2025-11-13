-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReportStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "ReportStatus" ADD VALUE 'IN_REVIEW';

-- AlterTable
ALTER TABLE "inspection_reports" ADD COLUMN     "maintainerId" INTEGER,
ADD COLUMN     "maintainerName" TEXT,
ADD COLUMN     "materialsUsed" TEXT,
ADD COLUMN     "serviceNotes" TEXT;

-- AddForeignKey
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_maintainerId_fkey" FOREIGN KEY ("maintainerId") REFERENCES "Employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
