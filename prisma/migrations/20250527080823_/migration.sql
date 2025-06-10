/*
  Warnings:

  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PackageServices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSchedule" DROP CONSTRAINT "StaffSchedule_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSchedule" DROP CONSTRAINT "StaffSchedule_staffId_fkey";

-- DropForeignKey
ALTER TABLE "_PackageServices" DROP CONSTRAINT "_PackageServices_A_fkey";

-- DropForeignKey
ALTER TABLE "_PackageServices" DROP CONSTRAINT "_PackageServices_B_fkey";

-- DropTable
DROP TABLE "Schedule";

-- DropTable
DROP TABLE "StaffSchedule";

-- DropTable
DROP TABLE "_PackageServices";

-- CreateTable
CREATE TABLE "ServicePackageItem" (
    "packageId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discount" DOUBLE PRECISION,
    "note" TEXT,

    CONSTRAINT "ServicePackageItem_pkey" PRIMARY KEY ("packageId","serviceId")
);

-- AddForeignKey
ALTER TABLE "ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
