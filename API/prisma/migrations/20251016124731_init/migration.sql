-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Employees" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING_SETUP';
