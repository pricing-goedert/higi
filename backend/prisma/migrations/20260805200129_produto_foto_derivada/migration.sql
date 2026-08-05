-- CreateTable
CREATE TABLE "produto_fotos" (
    "produto_id" TEXT NOT NULL,
    "origem_url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_fotos_pkey" PRIMARY KEY ("produto_id")
);

-- AddForeignKey
ALTER TABLE "produto_fotos" ADD CONSTRAINT "produto_fotos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
