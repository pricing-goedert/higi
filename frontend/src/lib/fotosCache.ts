/**
 * Pré-carrega as fotos do catálogo no Cache Storage do navegador enquanto
 * online, para que fiquem disponíveis offline mesmo em produtos que o rep
 * nunca abriu durante o evento — sem isso, a foto só sobreviveria offline se
 * o cache HTTP comum do navegador ainda tivesse ela por acaso (nada
 * garantido). Mesmo nome de cache usado no runtimeCaching do vite.config.ts,
 * que serve como rede de segurança para qualquer foto que passe por aqui
 * sem ter sido pré-carregada (ex.: produto criado no meio do evento).
 */
const CACHE_FOTOS = 'produto-fotos'
const CONCORRENCIA = 6

export async function precarregarFotosProdutos(produtos: { foto: string | null }[]): Promise<void> {
  if (!('caches' in window)) return

  const cache = await caches.open(CACHE_FOTOS)
  const urls = [...new Set(produtos.map((produto) => produto.foto).filter((url): url is string => Boolean(url)))]

  let indice = 0
  async function processarProxima(): Promise<void> {
    const minhaVez = indice++
    if (minhaVez >= urls.length) return
    const url = urls[minhaVez]

    try {
      const jaEmCache = await cache.match(url)
      if (!jaEmCache) {
        // no-cors: a maioria dos hosts de imagem do ERP não expõe CORS: a
        // resposta vem "opaca" (sem acesso ao status/corpo pelo JS), mas
        // ainda assim cacheável e renderizável depois num <img src>.
        const resposta = await fetch(url, { mode: 'no-cors' })
        await cache.put(url, resposta)
      }
    } catch {
      // Uma foto individual falhando (link quebrado, rede caiu no meio do
      // aquecimento) não deve interromper o resto do catálogo.
    }

    await processarProxima()
  }

  await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, urls.length) }, processarProxima))
}
