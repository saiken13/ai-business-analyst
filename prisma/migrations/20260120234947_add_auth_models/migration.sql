/*
  Warnings:

  - You are about to drop the `Chart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Column` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Insight` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chart" DROP CONSTRAINT "Chart_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "Column" DROP CONSTRAINT "Column_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_datasetId_fkey";

-- DropTable
DROP TABLE "Chart";

-- DropTable
DROP TABLE "Column";

-- DropTable
DROP TABLE "Insight";
