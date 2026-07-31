import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import request from 'supertest'

import { app } from '../app'
import { prisma } from '../lib/prisma'

// Same convention as app.test.ts: runs against the local dev Postgres,
// test rows namespaced under a distinctive prefix and cleaned up after.

const PREFIXO = 'importtest'
const emailAdmin = `${PREFIXO}-admin@example.com`
const emailNaoAdmin = `${PREFIXO}-rep@example.com`
const emailRepresentante = `${PREFIXO}-representante@example.com`
const senha = 'senha-teste-123'

let admin: { id: string }
let representante: { id: string }

before(async () => {
  const passwordHash = await bcrypt.hash(senha, 4)
  admin = await prisma.usuario.create({
    data: { nome: 'Import Admin', email: emailAdmin, passwordHash, isAdmin: true },
  })
  await prisma.usuario.create({
    data: { nome: 'Import Rep', email: emailNaoAdmin, passwordHash, isAdmin: false },
  })
  representante = await prisma.usuario.create({
    data: { nome: 'Import Representante', email: emailRepresentante, passwordHash, isAdmin: false },
  })
})

after(async () => {
  await prisma.cliente.deleteMany({ where: { cnpj: { startsWith: PREFIXO } } })
  await prisma.usuario.deleteMany({ where: { email: { startsWith: PREFIXO } } })
  await prisma.produto.deleteMany({ where: { codigo: { startsWith: PREFIXO } } })
  await prisma.tipo.deleteMany({ where: { nome: { startsWith: PREFIXO } } })
  await prisma.grupo.deleteMany({ where: { nome: { startsWith: PREFIXO } } })
  await prisma.categoria.deleteMany({ where: { nome: { startsWith: PREFIXO } } })
  await prisma.$disconnect()
})

async function loginAdmin() {
  const agente = request.agent(app)
  await agente.post('/api/auth/login').send({ email: emailAdmin, password: senha })
  return agente
}

test('bulk import routes reject a logged-in non-admin user', async () => {
  const agenteRep = request.agent(app)
  await agenteRep.post('/api/auth/login').send({ email: emailNaoAdmin, password: senha })

  const res = await agenteRep.post('/api/importar/clientes').send({ linhas: [{ cnpj: 'x', razaoSocial: 'x' }] })
  assert.equal(res.status, 403)
})

test('GET /api/importar/clientes/modelo returns a CSV header matching the configured columns', async () => {
  const agente = await loginAdmin()
  const res = await agente.get('/api/importar/clientes/modelo')
  assert.equal(res.status, 200)
  assert.match(res.headers['content-type'], /text\/csv/)
  assert.equal(res.text.trim(), 'cnpj,razaoSocial,nomeFantasia,contato,telefone,whatsapp,email,endereco,cidade,uf,representanteEmail')
})

test('dry run (confirmar: false) validates and reports without writing to the database', async () => {
  const agente = await loginAdmin()
  const cnpj = `${PREFIXO}-cnpj-dryrun`

  const res = await agente.post('/api/importar/clientes').send({
    confirmar: false,
    linhas: [{ cnpj, razaoSocial: 'Empresa Dry Run' }],
  })

  assert.equal(res.status, 200)
  assert.equal(res.body.confirmado, false)
  assert.deepEqual(res.body.resumo, { criados: 1, atualizados: 0, erros: 0 })

  const naoDeveExistir = await prisma.cliente.findUnique({ where: { cnpj } })
  assert.equal(naoDeveExistir, null)
})

test('confirmed import creates a new row, then a second import with the same key updates it', async () => {
  const agente = await loginAdmin()
  const cnpj = `${PREFIXO}-cnpj-upsert`

  const criacao = await agente.post('/api/importar/clientes').send({
    confirmar: true,
    linhas: [{ cnpj, razaoSocial: 'Empresa Original', representanteEmail: emailRepresentante }],
  })
  assert.equal(criacao.status, 200)
  assert.deepEqual(criacao.body.resumo, { criados: 1, atualizados: 0, erros: 0 })

  const criado = await prisma.cliente.findUnique({ where: { cnpj } })
  assert.equal(criado?.razaoSocial, 'Empresa Original')
  assert.equal(criado?.representanteId, representante.id)

  const atualizacao = await agente.post('/api/importar/clientes').send({
    confirmar: true,
    linhas: [{ cnpj, razaoSocial: 'Empresa Renomeada' }],
  })
  assert.equal(atualizacao.status, 200)
  assert.deepEqual(atualizacao.body.resumo, { criados: 0, atualizados: 1, erros: 0 })

  const atualizado = await prisma.cliente.findUnique({ where: { cnpj } })
  assert.equal(atualizado?.razaoSocial, 'Empresa Renomeada')
})

test('a row with a missing required field reports an error and does not abort the rest of the batch', async () => {
  const agente = await loginAdmin()
  const cnpjValido = `${PREFIXO}-cnpj-valido`

  const res = await agente.post('/api/importar/clientes').send({
    confirmar: true,
    linhas: [{ razaoSocial: 'Sem CNPJ' }, { cnpj: cnpjValido, razaoSocial: 'Empresa Válida' }],
  })

  assert.equal(res.status, 200)
  assert.equal(res.body.resultados[0].status, 'erro')
  assert.match(res.body.resultados[0].mensagem, /cnpj/)
  assert.equal(res.body.resultados[1].status, 'criado')
  assert.deepEqual(res.body.resumo, { criados: 1, atualizados: 0, erros: 1 })
})

test('an unresolvable natural-key FK reports a friendly error instead of a raw Prisma failure', async () => {
  const agente = await loginAdmin()
  const cnpj = `${PREFIXO}-cnpj-fk-invalido`

  const res = await agente.post('/api/importar/clientes').send({
    confirmar: true,
    linhas: [{ cnpj, razaoSocial: 'Empresa X', representanteEmail: 'nao-existe@example.com' }],
  })

  assert.equal(res.status, 200)
  assert.equal(res.body.resultados[0].status, 'erro')
  assert.match(res.body.resultados[0].mensagem, /Representante não encontrado/)
})

test('bulk-creating a Usuario without a senha fails, but omitting it on an update of an existing user is fine', async () => {
  const agente = await loginAdmin()
  const email = `${PREFIXO}-semsenha@example.com`

  const semSenha = await agente.post('/api/importar/usuarios').send({
    confirmar: true,
    linhas: [{ nome: 'Sem Senha', email }],
  })
  assert.equal(semSenha.body.resultados[0].status, 'erro')
  assert.match(semSenha.body.resultados[0].mensagem, /senha/)

  const comSenha = await agente.post('/api/importar/usuarios').send({
    confirmar: true,
    linhas: [{ nome: 'Com Senha', email, senha: 'temporaria123' }],
  })
  assert.equal(comSenha.body.resultados[0].status, 'criado')

  const atualizacaoSemSenha = await agente.post('/api/importar/usuarios').send({
    confirmar: true,
    linhas: [{ nome: 'Renomeado Sem Senha', email }],
  })
  assert.equal(atualizacaoSemSenha.body.resultados[0].status, 'atualizado')

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  assert.equal(usuario?.nome, 'Renomeado Sem Senha')
})

test('GET /api/importar/produtos/modelo reflects the real ERP column names', async () => {
  const agente = await loginAdmin()
  const res = await agente.get('/api/importar/produtos/modelo')
  assert.equal(res.status, 200)
  assert.equal(
    res.text.trim(),
    'subpro_id,subpro_comercial,subpro_qtde_por_embalagem,subpro_peso_liquido,subpro_peso_bruto,imagem,desc_n1,desc_n2,desc_n3',
  )
})

test('produto dry run does not create the category tree, only reports the row as valid', async () => {
  const agente = await loginAdmin()
  const categoriaNome = `${PREFIXO} Categoria Dry`

  const res = await agente.post('/api/importar/produtos').send({
    confirmar: false,
    linhas: [
      {
        subpro_id: `${PREFIXO}-produto-dryrun`,
        subpro_comercial: 'Produto Dry Run',
        desc_n1: categoriaNome,
        desc_n2: `${PREFIXO} Grupo Dry`,
        desc_n3: `${PREFIXO} Tipo Dry`,
      },
    ],
  })

  assert.equal(res.status, 200)
  assert.equal(res.body.resultados[0].status, 'criado')

  const categoria = await prisma.categoria.findFirst({ where: { nome: categoriaNome } })
  assert.equal(categoria, null)
})

test('confirmed produto import creates the Categoria -> Grupo -> Tipo chain, and a second row reuses it', async () => {
  const agente = await loginAdmin()
  const categoriaNome = `${PREFIXO} Categoria`
  const grupoNome = `${PREFIXO} Grupo`
  const tipoNome = `${PREFIXO} Tipo`

  const primeira = await agente.post('/api/importar/produtos').send({
    confirmar: true,
    linhas: [
      {
        subpro_id: `${PREFIXO}-produto-1`,
        subpro_comercial: 'Produto Um',
        subpro_qtde_por_embalagem: '40',
        subpro_peso_liquido: '0.1963',
        subpro_peso_bruto: '0,2092',
        imagem: 'https://example.com/foto.jpg',
        desc_n1: categoriaNome,
        desc_n2: grupoNome,
        desc_n3: tipoNome,
      },
    ],
  })
  assert.equal(primeira.body.resultados[0].status, 'criado')

  const categorias = await prisma.categoria.findMany({ where: { nome: categoriaNome } })
  assert.equal(categorias.length, 1)
  const grupos = await prisma.grupo.findMany({ where: { nome: grupoNome, categoriaId: categorias[0].id } })
  assert.equal(grupos.length, 1)
  const tipos = await prisma.tipo.findMany({ where: { nome: tipoNome, grupoId: grupos[0].id } })
  assert.equal(tipos.length, 1)

  const produto1 = await prisma.produto.findUnique({ where: { codigo: `${PREFIXO}-produto-1` } })
  assert.equal(produto1?.tipoId, tipos[0].id)
  assert.equal(produto1?.quantidadeCaixa, 40)
  assert.equal(produto1?.pesoLiquido, 0.1963)
  assert.equal(produto1?.pesoBruto, 0.2092) // "0,2092" parsed as comma-decimal

  const segunda = await agente.post('/api/importar/produtos').send({
    confirmar: true,
    linhas: [
      {
        subpro_id: `${PREFIXO}-produto-2`,
        subpro_comercial: 'Produto Dois',
        desc_n1: categoriaNome,
        desc_n2: grupoNome,
        desc_n3: tipoNome,
      },
    ],
  })
  assert.equal(segunda.body.resultados[0].status, 'criado')

  const categoriasDepois = await prisma.categoria.findMany({ where: { nome: categoriaNome } })
  assert.equal(categoriasDepois.length, 1, 'não deve duplicar a categoria já criada pela primeira linha')

  const produto2 = await prisma.produto.findUnique({ where: { codigo: `${PREFIXO}-produto-2` } })
  assert.equal(produto2?.tipoId, tipos[0].id)
})

test('produto import without desc_n2 attaches the Tipo directly to the Categoria (flat catalog case)', async () => {
  const agente = await loginAdmin()
  const categoriaNome = `${PREFIXO} Categoria Flat`
  const tipoNome = `${PREFIXO} Tipo Flat`

  const res = await agente.post('/api/importar/produtos').send({
    confirmar: true,
    linhas: [
      {
        subpro_id: `${PREFIXO}-produto-flat`,
        subpro_comercial: 'Produto Flat',
        desc_n1: categoriaNome,
        desc_n3: tipoNome,
      },
    ],
  })
  assert.equal(res.body.resultados[0].status, 'criado')

  const categoria = await prisma.categoria.findFirst({ where: { nome: categoriaNome } })
  const tipo = await prisma.tipo.findFirst({ where: { nome: tipoNome, categoriaId: categoria?.id, grupoId: null } })
  assert.ok(tipo, 'tipo deveria existir preso direto na categoria, sem grupo')
})
