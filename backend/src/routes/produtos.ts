import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { ah } from '../lib/asyncHandler'
import { crudRouter } from '../lib/crudRouter'
import { CONTENT_TYPE, derivarFoto, FotoInvalidaError } from '../lib/fotoDerivada'

/**
 * Everything under /api/produtos: the standard CRUD from crudRouter, plus one
 * extra route that serves a product's photo from our own origin.
 *
 * Why the photo can't just be loaded straight from `Produto.foto`: that URL
 * points at the ERP's image host, so the browser can only ever cache it as an
 * opaque cross-origin response — which Chrome pads by ~7MB each against the
 * storage quota. Warming a whole catalog that way quietly hits
 * QuotaExceededError partway through, which is why photos kept vanishing
 * offline (issue #13) despite appearing to be cached. Same-origin responses
 * are measured at their real size and carry a real status code, so both the
 * service worker and the warm-up in frontend/src/lib/fotosCache.ts can tell
 * success from failure.
 *
 * `Produto.foto` stays the source of truth — this route reads it, and
 * ProdutoFoto.origemUrl no longer matching is what invalidates the derivative.
 */

const TIMEOUT_ORIGEM_MS = 15_000
const MAX_IDADE_SEGUNDOS = 60 * 60 * 24

interface FotoArmazenada {
  produtoId: string
  contentType: string
  bytes: Uint8Array
  atualizadoEm: Date
}

function responder(req: Request, res: Response, foto: FotoArmazenada): void {
  const etag = `"${foto.produtoId}-${foto.atualizadoEm.getTime()}"`
  res.setHeader('ETag', etag)
  // `private`: this sits behind the session cookie, so no shared proxy should
  // ever hold a copy. The device-level cache is what matters here anyway.
  res.setHeader('Cache-Control', `private, max-age=${MAX_IDADE_SEGUNDOS}`)

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end()
    return
  }

  res.setHeader('Content-Type', foto.contentType)
  res.send(Buffer.from(foto.bytes))
}

async function baixarOrigem(url: string): Promise<Buffer> {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_ORIGEM_MS) })
  if (!resposta.ok) {
    throw new Error(`Host de imagem respondeu ${resposta.status}`)
  }
  return Buffer.from(await resposta.arrayBuffer())
}

const router = Router()

router.get(
  '/:id/foto',
  requireAuth,
  ah(async (req, res) => {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      select: { id: true, foto: true },
    })

    if (!produto) {
      res.status(404).json({ error: 'Não encontrado' })
      return
    }
    // Distinct from "not found" on purpose: the warm-up records this product
    // as having no photo and stops retrying it, instead of burning three
    // attempts per sync on every product the ERP never had an image for.
    if (!produto.foto) {
      res.status(404).json({ error: 'Produto sem foto' })
      return
    }

    const emCache = await prisma.produtoFoto.findUnique({ where: { produtoId: produto.id } })
    if (emCache && emCache.origemUrl === produto.foto) {
      responder(req, res, emCache)
      return
    }

    let derivada: Buffer
    try {
      derivada = await derivarFoto(await baixarOrigem(produto.foto))
    } catch (erro) {
      // The ERP's image host being unreachable in the middle of the event must
      // not take the photo down with it — a derivative from an older URL is
      // still the right thing to show.
      if (emCache) {
        responder(req, res, emCache)
        return
      }
      res.status(502).json({
        error: erro instanceof FotoInvalidaError ? erro.message : 'Não foi possível obter a foto no ERP',
      })
      return
    }

    const dados = {
      origemUrl: produto.foto,
      contentType: CONTENT_TYPE,
      bytes: derivada,
      tamanho: derivada.length,
    }
    const salva = await prisma.produtoFoto.upsert({
      where: { produtoId: produto.id },
      create: { produtoId: produto.id, ...dados },
      update: dados,
    })

    responder(req, res, salva)
  }),
)

// Registered after the photo route so `/:id/foto` isn't shadowed, though the
// two don't actually collide (different path depths).
router.use(crudRouter('produto'))

export default router
