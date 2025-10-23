/*
  Warnings:

  - You are about to drop the `AdiminTeam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Admins` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "public"."Admins" DROP CONSTRAINT "Admins_teamId_fkey";

-- DropTable
DROP TABLE "public"."AdiminTeam";

-- DropTable
DROP TABLE "public"."Admins";

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_id_fkey" FOREIGN KEY ("id") REFERENCES "Employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
