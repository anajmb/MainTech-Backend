/*
  Warnings:

  - Made the column `qrCode` on table `Machine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Machine" ALTER COLUMN "qrCode" SET NOT NULL;
