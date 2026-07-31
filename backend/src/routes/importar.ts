import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import { bulkImportRouter, type CacheImportacao, type ConfigImportacao, type LinhaImportacao, type ModelDelegate } from '../lib/bulkImportRouter'

// Prisma's generated delegate types are far more specific than the generic
// ModelDelegate shape bulkImportRouter needs (same trade-off crudRouter.ts
// makes) — this cast is the deliberate boundary between the two.
function comoDelegate(model: unknown): ModelDelegate {
  return model as unknown as ModelDelegate
}

function paraBooleano(valor: unknown): boolean {
  return valor === true || valor === 'true' || valor === '1' || valor === 'sim'
}

function paraNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  return Number.isNaN(numero) ? null : numero
}

const usuarios: ConfigImportacao = {
  nome: 'usuarios',
  model: comoDelegate(prisma.usuario),
  chaveUnica: 'email',
  colunas: [
    { chave: 'nome', obrigatorio: true },
    { chave: 'email', obrigatorio: true },
    // Senha em texto puro só existe neste CSV — é convertida em hash antes
    // de tocar o banco (abaixo) e nunca é lida de volta em lugar nenhum.
    { chave: 'senha' },
    { chave: 'isAdmin' },
    { chave: 'cnpj' },
    { chave: 'tipoRepresentante' },
    { chave: 'cidade' },
    { chave: 'uf' },
    { chave: 'pais' },
    { chave: 'telefone' },
    { chave: 'whatsapp' },
    { chave: 'endereco' },
    // Chave natural (e-mail), não o superiorId real — resolvida abaixo.
    { chave: 'superiorEmail' },
  ],
  async resolverFks(linha) {
    const resolvida: LinhaImportacao = { ...linha }
    if (resolvida.superiorEmail) {
      const superior = await prisma.usuario.findUnique({ where: { email: resolvida.superiorEmail as string } })
      if (!superior) throw new Error(`Superior não encontrado: e-mail "${resolvida.superiorEmail}"`)
      resolvida.superiorId = superior.id
    }
    delete resolvida.superiorEmail
    resolvida.isAdmin = paraBooleano(resolvida.isAdmin)
    return resolvida
  },
  async antesDeSalvar(linha, existente) {
    const { senha, ...resto } = linha
    if (!senha && !existente) {
      throw new Error('Campo "senha" é obrigatório para um usuário novo')
    }
    if (senha) {
      resto.passwordHash = await bcrypt.hash(senha as string, 12)
    }
    return resto
  },
}

const clientes: ConfigImportacao = {
  nome: 'clientes',
  model: comoDelegate(prisma.cliente),
  chaveUnica: 'cnpj',
  colunas: [
    { chave: 'cnpj', obrigatorio: true },
    { chave: 'razaoSocial', obrigatorio: true },
    { chave: 'nomeFantasia' },
    { chave: 'contato' },
    { chave: 'telefone' },
    { chave: 'whatsapp' },
    { chave: 'email' },
    { chave: 'endereco' },
    { chave: 'cidade' },
    { chave: 'uf' },
    // Chave natural (e-mail do representante), não o representanteId real.
    { chave: 'representanteEmail' },
  ],
  async resolverFks(linha) {
    const resolvida: LinhaImportacao = { ...linha }
    if (resolvida.representanteEmail) {
      const representante = await prisma.usuario.findUnique({ where: { email: resolvida.representanteEmail as string } })
      if (!representante) throw new Error(`Representante não encontrado: e-mail "${resolvida.representanteEmail}"`)
      resolvida.representanteId = representante.id
    }
    delete resolvida.representanteEmail
    return resolvida
  },
}

// O export real do ERP já trocou o separador decimal uma vez (de "." para
// "," entre uma amostra e o arquivo de verdade) — aceita os dois em vez de
// confiar em qual formato o próximo export vai usar.
function paraNumeroLocalizado(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const texto = String(valor).trim()
  const normalizado = texto.includes(',') && !texto.includes('.') ? texto.replace(',', '.') : texto
  const numero = Number(normalizado)
  return Number.isNaN(numero) ? null : numero
}

// O catálogo tem até 3 níveis (Categoria -> Grupo opcional -> Tipo) e o
// export do ERP traz exatamente essa hierarquia como desc_n1/desc_n2/desc_n3
// por linha. Diferente de Cliente/Usuario (onde uma referência ausente é
// erro), aqui o objetivo é justamente popular o catálogo do zero — então
// categoria/grupo/tipo que ainda não existem são criados, não rejeitados.
// Na pré-visualização (confirmar=false) nada é criado: um nível ausente só
// significa "linha válida, seria criado junto" — sinalizado com um
// placeholder que nunca chega a ser usado num write de verdade.
const TIPO_ID_PENDENTE = 'pendente-sera-criado-na-confirmacao'

// Busca (com cache por request) e, se confirmado, cria sob demanda. Sem essa
// memoização, um catálogo de ~800 produtos com só ~230 tipos únicos repetiria
// a mesma consulta centenas de vezes — o que na prática levou uma importação
// de teste de segundos para dezenas de segundos contra um Postgres real.
async function resolverOuCria<T extends { id: string }>(
  chave: string,
  cache: CacheImportacao,
  confirmar: boolean,
  buscar: () => Promise<T | null>,
  criar: () => Promise<T>,
): Promise<string | null> {
  if (cache.has(chave)) return cache.get(chave) as string | null
  let registro = await buscar()
  if (!registro && confirmar) registro = await criar()
  const id = registro?.id ?? null
  cache.set(chave, id)
  return id
}

async function resolverTipoId(
  desc: { n1: string; n2: string | null; n3: string },
  confirmar: boolean,
  cache: CacheImportacao,
): Promise<string> {
  const categoriaId = await resolverOuCria(
    `categoria::${desc.n1}`,
    cache,
    confirmar,
    () => prisma.categoria.findFirst({ where: { nome: desc.n1 } }),
    () => prisma.categoria.create({ data: { nome: desc.n1 } }),
  )
  if (!categoriaId) return TIPO_ID_PENDENTE // pré-visualização: categoria ainda não existe, nada a resolver de verdade

  if (desc.n2) {
    const grupoId = await resolverOuCria(
      `grupo::${categoriaId}::${desc.n2}`,
      cache,
      confirmar,
      () => prisma.grupo.findFirst({ where: { nome: desc.n2 as string, categoriaId } }),
      () => prisma.grupo.create({ data: { nome: desc.n2 as string, categoriaId } }),
    )
    if (!grupoId) return TIPO_ID_PENDENTE

    const tipoId = await resolverOuCria(
      `tipo::grupo::${grupoId}::${desc.n3}`,
      cache,
      confirmar,
      () => prisma.tipo.findFirst({ where: { nome: desc.n3, grupoId } }),
      () => prisma.tipo.create({ data: { nome: desc.n3, grupoId } }),
    )
    return tipoId ?? TIPO_ID_PENDENTE
  }

  // Sem desc_n2: categoria "flat", Tipo pendura direto na Categoria.
  const tipoId = await resolverOuCria(
    `tipo::flat::${categoriaId}::${desc.n3}`,
    cache,
    confirmar,
    () => prisma.tipo.findFirst({ where: { nome: desc.n3, categoriaId, grupoId: null } }),
    () => prisma.tipo.create({ data: { nome: desc.n3, categoriaId } }),
  )
  return tipoId ?? TIPO_ID_PENDENTE
}

const produtos: ConfigImportacao = {
  nome: 'produtos',
  model: comoDelegate(prisma.produto),
  chaveUnica: 'codigo',
  colunas: [
    { chave: 'subpro_id', obrigatorio: true },
    { chave: 'subpro_comercial', obrigatorio: true },
    { chave: 'subpro_qtde_por_embalagem' },
    { chave: 'subpro_peso_liquido' },
    { chave: 'subpro_peso_bruto' },
    { chave: 'imagem' },
    { chave: 'desc_n1', obrigatorio: true },
    { chave: 'desc_n2' },
    { chave: 'desc_n3', obrigatorio: true },
  ],
  async resolverFks(linha, confirmar, cache) {
    const tipoId = await resolverTipoId(
      {
        n1: linha.desc_n1 as string,
        n2: linha.desc_n2 as string | null,
        n3: linha.desc_n3 as string,
      },
      confirmar,
      cache,
    )

    return {
      codigo: String(linha.subpro_id),
      nome: linha.subpro_comercial,
      quantidadeCaixa: paraNumero(linha.subpro_qtde_por_embalagem),
      pesoLiquido: paraNumeroLocalizado(linha.subpro_peso_liquido),
      pesoBruto: paraNumeroLocalizado(linha.subpro_peso_bruto),
      foto: linha.imagem,
      tipoId,
    }
  },
}

const router = Router()
router.use('/usuarios', bulkImportRouter(usuarios))
router.use('/clientes', bulkImportRouter(clientes))
router.use('/produtos', bulkImportRouter(produtos))

export default router
