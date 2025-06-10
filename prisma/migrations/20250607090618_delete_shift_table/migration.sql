/*
  Warnings:

  - You are about to drop the `ServiceProviderConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffShiftAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeOffRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkShiftTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkShiftTemplateCategoryRequirement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceProviderConfig" DROP CONSTRAINT "ServiceProviderConfig_providerId_fkey";

-- DropForeignKey
ALTER TABLE "StaffShiftAssignment" DROP CONSTRAINT "StaffShiftAssignment_shiftTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "StaffShiftAssignment" DROP CONSTRAINT "StaffShiftAssignment_staffId_fkey";

-- DropForeignKey
ALTER TABLE "TimeOffRequest" DROP CONSTRAINT "TimeOffRequest_staffId_fkey";

-- DropForeignKey
ALTER TABLE "WorkShiftTemplate" DROP CONSTRAINT "WorkShiftTemplate_providerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkShiftTemplateCategoryRequirement" DROP CONSTRAINT "WorkShiftTemplateCategoryRequirement_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "WorkShiftTemplateCategoryRequirement" DROP CONSTRAINT "WorkShiftTemplateCategoryRequirement_shiftTemplateId_fkey";

-- DropTable
DROP TABLE "ServiceProviderConfig";

-- DropTable
DROP TABLE "StaffShiftAssignment";

-- DropTable
DROP TABLE "TimeOffRequest";

-- DropTable
DROP TABLE "WorkShiftTemplate";

-- DropTable
DROP TABLE "WorkShiftTemplateCategoryRequirement";
