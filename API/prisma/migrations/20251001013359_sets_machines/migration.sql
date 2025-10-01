-- DropForeignKey
ALTER TABLE "public"."Sets" DROP CONSTRAINT "Sets_machineId_fkey";

-- CreateTable
CREATE TABLE "public"."_SetsOnMachine" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SetsOnMachine_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SetsOnMachine_B_index" ON "public"."_SetsOnMachine"("B");

-- AddForeignKey
ALTER TABLE "public"."_SetsOnMachine" ADD CONSTRAINT "_SetsOnMachine_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SetsOnMachine" ADD CONSTRAINT "_SetsOnMachine_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
