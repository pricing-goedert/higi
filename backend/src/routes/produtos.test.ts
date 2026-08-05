import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import bcrypt from 'bcrypt'
import sharp from 'sharp'
import request from 'supertest'

import { app } from '../app'
import { prisma } from '../lib/prisma'
import { ALTURA, LARGURA } from '../lib/fotoDerivada'

// Same convention as the other route tests: runs against the local dev
// Postgres, rows namespaced under a distinctive prefix and cleaned up after.
//
// The ERP's image host is stood up locally as a throwaway HTTP server rather
// than mocked, so the route exercises its real fetch path. It counts hits,
// which is how "the second request served the cached derivative" is asserted
// without reaching into implementation details.

const PREFIXO = 'fotoproxytest'
const emailAdmin = `${PREFIXO}-admin@example.com`
const emailRep = `${PREFIXO}-rep@example.com`
const senha = 'senha-teste-123'

let servidorOrigem: http.Server
let baseOrigem: string
let acessos: Record<string, number>

let categoria: { id: string }
let tipo: { id: string }

async function imagemPng(cor: string, largura: number, altura: number): Promise<Buffer> {
  return sharp({ create: { width: largura, height: altura, channels: 3, background: cor } })
    .png()
    .toBuffer()
}

before(async () => {
  const [azul, vermelha] = await Promise.all([
    // Deliberately taller than it is wide — the derivative must letterbox it
    // into the card's ratio rather than crop it.
    imagemPng('#3366cc', 900, 1200),
    imagemPng('#cc3333', 1200, 900),
  ])

  acessos = { '/azul.jpg': 0, '/vermelha.jpg': 0, '/quebrada.jpg': 0, '/naoimagem.jpg': 0 }

  servidorOrigem = http.createServer((req, res) => {
    const caminho = req.url ?? ''
    if (caminho in acessos) acessos[caminho] += 1

    if (caminho === '/azul.jpg') {
      res.writeHead(200, { 'Content-Type': 'image/png' }).end(azul)
    } else if (caminho === '/vermelha.jpg') {
      res.writeHead(200, { 'Content-Type': 'image/png' }).end(vermelha)
    } else if (caminho === '/naoimagem.jpg') {
      res.writeHead(200, { 'Content-Type': 'image/png' }).end('isto não é uma imagem')
    } else {
      res.writeHead(500).end('erro no ERP')
    }
  })

  await new Promise<void>((resolve) => servidorOrigem.listen(0, '127.0.0.1', resolve))
  baseOrigem = `http://127.0.0.1:${(servidorOrigem.address() as AddressInfo).port}`

  const passwordHash = await bcrypt.hash(senha, 4)
  await prisma.usuario.create({
    data: { nome: 'Foto Admin', email: emailAdmin, passwordHash, isAdmin: true },
  })
  await prisma.usuario.create({
    data: { nome: 'Foto Rep', email: emailRep, passwordHash, isAdmin: false },
  })

  categoria = await prisma.categoria.create({ data: { nome: `${PREFIXO}-categoria` } })
  tipo = await prisma.tipo.create({ data: { nome: `${PREFIXO}-tipo`, categoriaId: categoria.id } })
})

after(async () => {
  // produto_fotos cascades from produtos, so deleting the products is enough.
  await prisma.produto.deleteMany({ where: { codigo: { startsWith: PREFIXO } } })
  await prisma.tipo.deleteMany({ where: { nome: { startsWith: PREFIXO } } })
  await prisma.categoria.deleteMany({ where: { nome: { startsWith: PREFIXO } } })
  await prisma.usuario.deleteMany({ where: { email: { startsWith: PREFIXO } } })
  await new Promise<void>((resolve) => servidorOrigem.close(() => resolve()))
  await prisma.$disconnect()
})

async function criarProduto(sufixo: string, foto: string | null) {
  return prisma.produto.create({
    data: { codigo: `${PREFIXO}-${sufixo}`, nome: `Produto ${sufixo}`, foto, tipoId: tipo.id },
  })
}

async function logar(email: string) {
  const agente = request.agent(app)
  await agente.post('/api/auth/login').send({ email, password: senha })
  return agente
}

test('serves a resized WebP at the card ratio and caches the derivative for the next request', async () => {
  const produto = await criarProduto('happy', `${baseOrigem}/azul.jpg`)
  const agente = await logar(emailRep)

  const primeira = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(primeira.status, 200)
  assert.match(primeira.headers['content-type'], /image\/webp/)
  assert.ok(primeira.body.length > 0)
  assert.equal(acessos['/azul.jpg'], 1)

  // The source was 900x1200 (portrait); the derivative must come out at the
  // card's own ratio with the whole product still in frame.
  const meta = await sharp(primeira.body).metadata()
  assert.equal(meta.format, 'webp')
  assert.equal(meta.width, LARGURA)
  assert.equal(meta.height, ALTURA)

  const guardada = await prisma.produtoFoto.findUnique({ where: { produtoId: produto.id } })
  assert.equal(guardada?.origemUrl, `${baseOrigem}/azul.jpg`)
  assert.equal(guardada?.contentType, 'image/webp')
  assert.equal(guardada?.tamanho, primeira.body.length)

  const segunda = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(segunda.status, 200)
  // Served from the derivative cache — the ERP was not hit a second time.
  assert.equal(acessos['/azul.jpg'], 1)
  assert.equal(segunda.headers.etag, primeira.headers.etag)

  const naoModificada = await agente
    .get(`/api/produtos/${produto.id}/foto`)
    .set('If-None-Match', primeira.headers.etag)
  assert.equal(naoModificada.status, 304)
})

test('rejects a request with no session, and allows a logged-in non-admin', async () => {
  const produto = await criarProduto('auth', `${baseOrigem}/azul.jpg`)

  const semSessao = await request(app).get(`/api/produtos/${produto.id}/foto`)
  assert.equal(semSessao.status, 401)

  // Deliberately not admin-gated: every rep browses the catalog.
  const agenteRep = await logar(emailRep)
  const comSessao = await agenteRep.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(comSessao.status, 200)
})

test('returns a contained error for an unknown product, a product with no photo, and an unreachable host', async () => {
  const agente = await logar(emailRep)

  const inexistente = await agente.get('/api/produtos/00000000-0000-0000-0000-000000000000/foto')
  assert.equal(inexistente.status, 404)
  assert.equal(inexistente.body.error, 'Não encontrado')

  const semFoto = await criarProduto('semfoto', null)
  const resSemFoto = await agente.get(`/api/produtos/${semFoto.id}/foto`)
  assert.equal(resSemFoto.status, 404)
  assert.equal(resSemFoto.body.error, 'Produto sem foto')

  const comErro = await criarProduto('erro', `${baseOrigem}/quebrada.jpg`)
  const resErro = await agente.get(`/api/produtos/${comErro.id}/foto`)
  assert.equal(resErro.status, 502)
  assert.ok(resErro.body.error)
  assert.doesNotMatch(JSON.stringify(resErro.body), /at .*\.ts:/)

  const naoImagem = await criarProduto('naoimagem', `${baseOrigem}/naoimagem.jpg`)
  const resNaoImagem = await agente.get(`/api/produtos/${naoImagem.id}/foto`)
  assert.equal(resNaoImagem.status, 502)
  assert.ok(resNaoImagem.body.error)
})

test('regenerates the derivative when the product photo URL changes in the database', async () => {
  const produto = await criarProduto('invalidacao', `${baseOrigem}/azul.jpg`)
  const agente = await logar(emailRep)

  const antes = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(antes.status, 200)

  // Produto.foto stays the source of truth: an admin edit or a CSV re-import
  // pointing somewhere else must win over whatever was cached.
  await prisma.produto.update({
    where: { id: produto.id },
    data: { foto: `${baseOrigem}/vermelha.jpg` },
  })

  const depois = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(depois.status, 200)
  assert.equal(acessos['/vermelha.jpg'], 1)
  assert.notDeepEqual(depois.body, antes.body)
  assert.notEqual(depois.headers.etag, antes.headers.etag)

  const guardada = await prisma.produtoFoto.findUnique({ where: { produtoId: produto.id } })
  assert.equal(guardada?.origemUrl, `${baseOrigem}/vermelha.jpg`)
})

test('falls back to a stale derivative when the ERP host stops answering', async () => {
  const produto = await criarProduto('erpcaiu', `${baseOrigem}/azul.jpg`)
  const agente = await logar(emailRep)

  const quenteEmCache = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(quenteEmCache.status, 200)

  // Same situation as the ERP's image host going down mid-event: the URL now
  // resolves to nothing, but reps must still see the photo they already have.
  await prisma.produto.update({
    where: { id: produto.id },
    data: { foto: `${baseOrigem}/quebrada.jpg` },
  })

  const depoisDaQueda = await agente.get(`/api/produtos/${produto.id}/foto`)
  assert.equal(depoisDaQueda.status, 200)
  assert.deepEqual(depoisDaQueda.body, quenteEmCache.body)
})
