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
