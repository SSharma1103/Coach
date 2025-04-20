/*
  Warnings:

  - You are about to drop the column `growthRate` on the `IndustryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `marketOutlook` on the `IndustryInsight` table. All the data in the column will be lost.
  - You are about to drop the `CoverLetter` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `FutureInResearch` to the `IndustryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internships` to the `IndustryInsight` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CoverLetter" DROP CONSTRAINT "CoverLetter_userId_fkey";

-- AlterTable
ALTER TABLE "IndustryInsight" DROP COLUMN "growthRate",
DROP COLUMN "marketOutlook",
ADD COLUMN     "FutureInResearch" TEXT NOT NULL,
ADD COLUMN     "internships" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "CoverLetter";
