-- CreateTable
CREATE TABLE "_ProdutoUnits" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProdutoUnits_AB_unique" ON "_ProdutoUnits"("A", "B");

-- CreateIndex
CREATE INDEX "_ProdutoUnits_B_index" ON "_ProdutoUnits"("B");

-- AddForeignKey
ALTER TABLE "_ProdutoUnits" ADD CONSTRAINT "_ProdutoUnits_A_fkey" FOREIGN KEY ("A") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProdutoUnits" ADD CONSTRAINT "_ProdutoUnits_B_fkey" FOREIGN KEY ("B") REFERENCES "UnidadeMedida"("id") ON DELETE CASCADE ON UPDATE CASCADE;
