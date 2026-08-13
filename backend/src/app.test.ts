import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import request from 'supertest'

import { app } from './app'
import { prisma } from './lib/prisma'

// Runs against the local dev Postgres (docker compose up postgres) rather
// than a dedicated test database — a deliberate simplification per
// docs/PLAN.md's "deferred: automated testing beyond a minimal set". Test
// data is namespaced under a distinctive email/CNPJ prefix and cleaned up
// in `after`, so it never lingers in the dev database.

const PREFIXO = 'smoketest'
const emailAdmin = `${PREFIXO}-admin@example.com`
const emailNaoAdmin = `${PREFIXO}-rep@example.com`
const senha = 'senha-teste-123'

let admin: { id: string }
let naoAdmin: { id: string }

before(async () => {
  const passwordHash = await bcrypt.hash(senha, 4) // low cost factor: tests only
  admin = await prisma.usuario.create({
    data: { nome: 'Smoke Admin', email: emailAdmin, passwordHash, isAdmin: true },
  })
  naoAdmin = await prisma.usuario.create({
    data: { nome: 'Smoke Rep', email: emailNaoAdmin, passwordHash, isAdmin: false },
  })
})

after(async () => {
  await prisma.lead.deleteMany({ where: { cnpj: { startsWith: PREFIXO } } })
  await prisma.usuario.deleteMany({ where: { email: { startsWith: PREFIXO } } })
  await prisma.$disconnect()
})

test('helmet security headers are set on every response', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
})

test('login rejects wrong password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: emailAdmin, password: 'errada' })
  assert.equal(res.status, 401)
})

test('login accepts correct credentials and sets a session cookie', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: emailAdmin, password: senha })
  assert.equal(res.status, 200)
  assert.ok(res.headers['set-cookie']?.[0]?.includes('higiexpo_session='))
})

test('GET /api/auth/me returns the logged-in user and refreshes the cookie', async () => {
  const agente = request.agent(app)
  await agente.post('/api/auth/login').send({ email: emailAdmin, password: senha })

  const res = await agente.get('/api/auth/me')
  assert.equal(res.status, 200)
  assert.equal(res.body.id, admin.id)
  assert.ok(res.headers['set-cookie']?.[0]?.includes('higiexpo_session='))
})

test('GET /api/auth/me rejects requests with no session', async () => {
  const res = await request(app).get('/api/auth/me')
  assert.equal(res.status, 401)
})

test('bulk-read routes reject requests with no session', async () => {
  const res = await request(app).get('/api/usuarios')
  assert.equal(res.status, 401)
})

test('lead creation attributes capturadoPorId to the logged-in user, and duplicate clientUuid does not create a second row', async () => {
  const agenteAdmin = request.agent(app)
  await agenteAdmin.post('/api/auth/login').send({ email: emailAdmin, password: senha })

  const clientUuid = `${PREFIXO}-uuid-1`
  const corpoLead = {
    clientUuid,
    tipo: 'Revenda',
    cnpj: `${PREFIXO}-cnpj-1`,
    razaoSocial: 'Empresa Teste',
    contato: 'Fulano',
    telefone: '11999999999',
  }

  const primeira = await agenteAdmin.post('/api/leads').send(corpoLead)
  assert.equal(primeira.status, 201)
  assert.equal(primeira.body.capturadoPorId, admin.id)

  const segunda = await agenteAdmin.post('/api/leads').send(corpoLead)
  assert.equal(segunda.status, 200)
  assert.equal(segunda.body.id, primeira.body.id)

  const total = await prisma.lead.count({ where: { clientUuid } })
  assert.equal(total, 1)
})

test('GET /api/leads scopes non-admins to their own leads, and shows admins everything', async () => {
  const agenteAdmin = request.agent(app)
  await agenteAdmin.post('/api/auth/login').send({ email: emailAdmin, password: senha })
  const agenteRep = request.agent(app)
  await agenteRep.post('/api/auth/login').send({ email: emailNaoAdmin, password: senha })

  const leadAdmin = await agenteAdmin.post('/api/leads').send({
    clientUuid: `${PREFIXO}-uuid-admin`,
    tipo: 'Revenda',
    cnpj: `${PREFIXO}-cnpj-admin`,
    razaoSocial: 'Empresa do Admin',
    contato: 'Fulano',
    telefone: '11999999999',
  })
  const leadRep = await agenteRep.post('/api/leads').send({
    clientUuid: `${PREFIXO}-uuid-rep`,
    tipo: 'Revenda',
    cnpj: `${PREFIXO}-cnpj-rep`,
    razaoSocial: 'Empresa do Rep',
    contato: 'Ciclano',
    telefone: '11988888888',
  })

  const listaRep = await agenteRep.get('/api/leads')
  const idsRep = listaRep.body.map((lead: { id: string }) => lead.id)
  assert.ok(idsRep.includes(leadRep.body.id))
  assert.ok(!idsRep.includes(leadAdmin.body.id))

  const listaAdmin = await agenteAdmin.get('/api/leads')
  const idsAdmin = listaAdmin.body.map((lead: { id: string }) => lead.id)
  assert.ok(idsAdmin.includes(leadRep.body.id))
  assert.ok(idsAdmin.includes(leadAdmin.body.id))
})

test('isAdmin-gated write routes reject a logged-in non-admin user', async () => {
  const agenteRep = request.agent(app)
  await agenteRep.post('/api/auth/login').send({ email: emailNaoAdmin, password: senha })

  const res = await agenteRep.post('/api/clientes').send({ cnpj: `${PREFIXO}-cnpj-2`, razaoSocial: 'X' })
  assert.equal(res.status, 403)
})
