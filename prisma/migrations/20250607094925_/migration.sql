/*
  Warnings:

  - You are about to drop the `BookingStaff` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[staffId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "BookingStaff" DROP CONSTRAINT "BookingStaff_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingStaff" DROP CONSTRAINT "BookingStaff_staffId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "staffId" INTEGER;

-- DropTable
DROP TABLE "BookingStaff";

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "estimatedTime" INTEGER,
    "note" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_bookingId_key" ON "InspectionReport"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_staffId_key" ON "Booking"("staffId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
