-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_datasetId_fkey";

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
