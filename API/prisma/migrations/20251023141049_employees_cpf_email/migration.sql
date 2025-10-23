/*
  Warnings:

  - Made the column `cpf` on table `Employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employees" ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
