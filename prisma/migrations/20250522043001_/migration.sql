/*
  Warnings:

  - You are about to drop the column `fullName` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `CustomerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomerProfile" DROP COLUMN "fullName",
DROP COLUMN "phone";
