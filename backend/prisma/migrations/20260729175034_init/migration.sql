-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "superior_id" TEXT,
    "cnpj" TEXT,
    "tipo_representante" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "pais" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "endereco" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "representante_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "client_uuid" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cep" TEXT,
    "endereco" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "cliente_id" TEXT,
    "capturado_por_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria_id" TEXT,
    "grupo_id" TEXT,

    CONSTRAINT "tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "quantidade_caixa" INTEGER,
    "dimensoes" TEXT,
    "composicao" TEXT,
    "foto" TEXT,
    "tipo_id" TEXT NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicacoes" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "horario" TEXT,
    "telefone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapa_url" TEXT,

    CONSTRAINT "indicacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orientacoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "orientacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orientacao_secoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "orientacao_id" TEXT NOT NULL,

    CONSTRAINT "orientacao_secoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programacao" (
    "id" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "horario" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "programacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cnpj_key" ON "usuarios"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "leads_client_uuid_key" ON "leads"("client_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_superior_id_fkey" FOREIGN KEY ("superior_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_representante_id_fkey" FOREIGN KEY ("representante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_capturado_por_id_fkey" FOREIGN KEY ("capturado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos" ADD CONSTRAINT "tipos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos" ADD CONSTRAINT "tipos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orientacao_secoes" ADD CONSTRAINT "orientacao_secoes_orientacao_id_fkey" FOREIGN KEY ("orientacao_id") REFERENCES "orientacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
