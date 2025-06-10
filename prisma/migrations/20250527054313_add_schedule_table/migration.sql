-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('NOT_YET', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "confirmedByCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inspectedAt" TIMESTAMP(3),
ADD COLUMN     "inspectedById" INTEGER,
ADD COLUMN     "inspectionNote" TEXT,
ADD COLUMN     "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'NOT_YET';

-- CreateTable
CREATE TABLE "WorkShiftTemplate" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "day" "WeekDay" NOT NULL,
    "session" "Session" NOT NULL,
    "startTime" VARCHAR(10) NOT NULL,
    "endTime" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffShiftAssignment" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "shiftTemplateId" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "StaffShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProviderConfig" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "maxShiftsPerDay" INTEGER NOT NULL DEFAULT 2,
    "maxShiftsPerWeek" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedService" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposedService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkShiftTemplate_providerId_day_session_key" ON "WorkShiftTemplate"("providerId", "day", "session");

-- CreateIndex
CREATE UNIQUE INDEX "StaffShiftAssignment_staffId_shiftTemplateId_effectiveFrom_key" ON "StaffShiftAssignment"("staffId", "shiftTemplateId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderConfig_providerId_key" ON "ServiceProviderConfig"("providerId");

-- AddForeignKey
ALTER TABLE "WorkShiftTemplate" ADD CONSTRAINT "WorkShiftTemplate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftAssignment" ADD CONSTRAINT "StaffShiftAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftAssignment" ADD CONSTRAINT "StaffShiftAssignment_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "WorkShiftTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderConfig" ADD CONSTRAINT "ServiceProviderConfig_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedService" ADD CONSTRAINT "ProposedService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedService" ADD CONSTRAINT "ProposedService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
