import { ref } from 'vue'
import { db, type FotoStatus } from './db'
import type { Produto } from '@/types/domain'

/**
 * Downloads the whole catalog's photos while online so they're there offline,
 * including for products the rep never opened.
 *
 * The previous version fetched the ERP's image URLs directly with
 * `mode: 'no-cors'` and wrote them to Cache Storage itself. Every response was
 * opaque, Chrome pads those by ~7MB each against the origin quota, and the
 * resulting QuotaExceededError was swallowed by an empty catch — so warming
 * ~800 photos quietly stopped partway through and the app reported success.
 * That was issue #13.
 *
 * Now the photos come from /api/produtos/:id/foto (same origin, resized), so:
 * responses are real — measurable size, readable status code — and the service
 * worker's CacheFirst rule in vite.config.ts is the single thing that writes
 * to the cache. This module only issues requests and records what happened,
 * in IndexedDB, so a pass survives the app being closed and a photo that
 * failed once actually gets retried.
 */

const CACHE_FOTOS = 'produto-fotos'
// Lower than the old 6: the first request for each photo makes the server
// fetch and re-encode it, and the event's backend runs on a small instance.
const CONCORRENCIA = 4
const MAX_TENTATIVAS = 3
const INTERVALO_PASSE_MS = 24 * 60 * 60 * 1000
const CHAVE_ULTIMO_PASSE = 'higiexpo:fotos-ultimo-passe'
const CHAVE_LIMPEZA_LEGADO = 'higiexpo:fotos-cache-legado-limpo'
// Safety net, not the primary control — the derivatives are a few dozen KB
// each, so the whole catalog lands around 25MB. If something is far off that,
// stop rather than push the browser into evicting the origin (which would
// take the Dexie catalog with it).
const TETO_USO_BYTES = 200 * 1024 * 1024
const ITENS_ENTRE_CHECAGENS_DE_ESPACO = 25

export const fotosBaixadas = ref(0)
export const fotosTotal = ref(0)
export const baixandoFotos = ref(false)

/** Single place the photo URL is built — used by the warm-up and the view. */
export function urlFoto(produtoId: string): string {
  return `/api/produtos/${produtoId}/foto`
}

function gravarStatus(produtoId: string, estado: FotoStatus['estado'], tentativas: number): Promise<unknown> {
  return db.fotosStatus.put({ produtoId, estado, tentativas, atualizadoEm: new Date().toISOString() })
}

function precisaBaixar(produto: Produto, status: FotoStatus | undefined, passeCompleto: boolean): boolean {
  // Record "this product has no photo" once, then stop looking at it — no
  // point spending three attempts per sync on products the ERP never had an
  // image for.
  if (!produto.foto) return status?.estado !== 'sem-foto'
  if (!status) return true
  // It has a photo now but was recorded as having none: re-evaluate.
  if (status.estado === 'sem-foto') return true
  if (status.estado === 'falhou') return status.tentativas < MAX_TENTATIVAS
  // Already cached. Re-requesting on the daily pass is nearly free (CacheFirst
  // answers from the cache without touching the network) and it's what catches
  // an entry the browser evicted behind our back.
  return passeCompleto
}

async function excedeuOrcamento(): Promise<boolean> {
  try {
    const { usage } = await navigator.storage.estimate()
    return (usage ?? 0) > TETO_USO_BYTES
  } catch {
    return false
  }
}

/**
 * Older installs carry entries keyed by the ERP's own URLs — opaque, and each
 * one padded to ~7MB of accounted quota. Left alone they'd keep the origin
 * near its limit forever, since nothing else ever deletes them.
 */
async function limparCacheLegado(): Promise<void> {
  if (localStorage.getItem(CHAVE_LIMPEZA_LEGADO)) return
  try {
    const cache = await caches.open(CACHE_FOTOS)
    const chaves = await cache.keys()
    await Promise.all(
      chaves.filter((req) => new URL(req.url).origin !== location.origin).map((req) => cache.delete(req)),
    )
    localStorage.setItem(CHAVE_LIMPEZA_LEGADO, '1')
  } catch {
    // Best effort — a failure here just means the old entries linger.
  }
}

/**
 * The service worker is what writes to the cache, so a pass that runs before
 * it controls the page would download everything and store none of it.
 */
async function esperarServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return false
  await navigator.serviceWorker.ready
  if (navigator.serviceWorker.controller) return true

  // First load after install: `ready` resolved but this page isn't claimed
  // yet. Give it a moment; if it still isn't, the next sync will pick it up.
  await new Promise<void>((resolve) => {
    const pronto = () => resolve()
    navigator.serviceWorker.addEventListener('controllerchange', pronto, { once: true })
    setTimeout(pronto, 5_000)
  })
  return Boolean(navigator.serviceWorker.controller)
}

async function baixarUma(produto: Produto, anterior: FotoStatus | undefined): Promise<void> {
  if (!produto.foto) {
    await gravarStatus(produto.id, 'sem-foto', 0)
    return
  }

  const tentativas = (anterior?.tentativas ?? 0) + 1
  try {
    const resposta = await fetch(urlFoto(produto.id), { credentials: 'include' })
    // Read it out even though we discard it: the service worker hands back a
    // clone of what it cached, and leaving our copy unread stalls the stream.
    if (resposta.body) await resposta.arrayBuffer()

    if (resposta.ok) {
      await gravarStatus(produto.id, 'ok', 0)
    } else if (resposta.status === 404) {
      // The route says this product has no photo in the database.
      await gravarStatus(produto.id, 'sem-foto', 0)
    } else {
      await gravarStatus(produto.id, 'falhou', tentativas)
    }
  } catch {
    await gravarStatus(produto.id, 'falhou', tentativas)
  }
}

export async function precarregarFotosProdutos(
  produtos: Produto[],
  opcoes: { forcar?: boolean } = {},
): Promise<void> {
  if (baixandoFotos.value) return
  if (!(await esperarServiceWorker())) return

  await limparCacheLegado()

  const agora = Date.now()
  const ultimoPasse = Number(localStorage.getItem(CHAVE_ULTIMO_PASSE) ?? 0)
  // The issue asks for a full pass at least once a day, or whenever the rep
  // asks for one. Outside that window only the gaps and the failures are
  // retried, so a routine reconnect doesn't re-walk the whole catalog.
  const passeCompleto = opcoes.forcar === true || agora - ultimoPasse >= INTERVALO_PASSE_MS

  const registros = await db.fotosStatus.toArray()
  const status = new Map(registros.map((registro) => [registro.produtoId, registro]))

  // Products dropped from the catalog would otherwise keep counting toward the
  // totals shown to the rep.
  const idsAtuais = new Set(produtos.map((produto) => produto.id))
  const orfaos = registros.filter((registro) => !idsAtuais.has(registro.produtoId))
  if (orfaos.length) await db.fotosStatus.bulkDelete(orfaos.map((registro) => registro.produtoId))

  const pendentes = produtos.filter((produto) => precisaBaixar(produto, status.get(produto.id), passeCompleto))

  fotosTotal.value = pendentes.length
  fotosBaixadas.value = 0
  if (!pendentes.length) {
    if (passeCompleto) localStorage.setItem(CHAVE_ULTIMO_PASSE, String(agora))
    return
  }

  baixandoFotos.value = true
  let indice = 0
  let semEspaco = false

  async function trabalhar(): Promise<void> {
    while (!semEspaco) {
      const meu = indice++
      if (meu >= pendentes.length) return

      if (meu % ITENS_ENTRE_CHECAGENS_DE_ESPACO === 0 && (await excedeuOrcamento())) {
        semEspaco = true
        return
      }

      const produto = pendentes[meu]
      await baixarUma(produto, status.get(produto.id))
      fotosBaixadas.value += 1
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, pendentes.length) }, trabalhar))
    // Only restart the daily clock on a pass that actually got all the way
    // through — an interrupted one must not look like a completed one.
    if (passeCompleto && !semEspaco) localStorage.setItem(CHAVE_ULTIMO_PASSE, String(agora))
  } finally {
    baixandoFotos.value = false
  }
}
