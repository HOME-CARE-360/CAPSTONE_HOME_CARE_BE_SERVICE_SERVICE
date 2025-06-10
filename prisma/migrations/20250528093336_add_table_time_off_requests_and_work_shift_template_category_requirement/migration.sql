-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WorkShiftTemplateCategoryRequirement" (
    "id" SERIAL NOT NULL,
    "shiftTemplateId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "requiredStaff" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WorkShiftTemplateCategoryRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkShiftTemplateCategoryRequirement_shiftTemplateId_catego_key" ON "WorkShiftTemplateCategoryRequirement"("shiftTemplateId", "categoryId");

-- CreateIndex
CREATE INDEX "TimeOffRequest_fromDate_toDate_idx" ON "TimeOffRequest"("fromDate", "toDate");

-- AddForeignKey
ALTER TABLE "WorkShiftTemplateCategoryRequirement" ADD CONSTRAINT "WorkShiftTemplateCategoryRequirement_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "WorkShiftTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShiftTemplateCategoryRequirement" ADD CONSTRAINT "WorkShiftTemplateCategoryRequirement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
