/*
  Warnings:

  - You are about to drop the column `email` on the `ServiceProvider` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ServiceProvider` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `ServiceProvider` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('SOLE_PROPRIETORSHIP', 'LIMITED_LIABILITY', 'JOINT_STOCK', 'PARTNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropIndex
DROP INDEX "ServiceProvider_email_key";

-- AlterTable
ALTER TABLE "ServiceProvider" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "companyType" "CompanyType" NOT NULL DEFAULT 'JOINT_STOCK',
ADD COLUMN     "industry" VARCHAR(255),
ADD COLUMN     "licenseNo" VARCHAR(100),
ADD COLUMN     "logo" VARCHAR(1000),
ADD COLUMN     "taxId" VARCHAR(100) NOT NULL DEFAULT '98678822',
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" INTEGER;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
