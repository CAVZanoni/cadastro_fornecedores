-- AlterTable
ALTER TABLE "ItemProposta" ADD COLUMN     "unidadeId" INTEGER;

-- AddForeignKey
ALTER TABLE "ItemProposta" ADD CONSTRAINT "ItemProposta_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "UnidadeMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
