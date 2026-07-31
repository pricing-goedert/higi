import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import { bulkImportRouter, type ConfigImportacao, type LinhaImportacao, type ModelDelegate } from '../lib/bulkImportRouter'

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

const produtos: ConfigImportacao = {
  nome: 'produtos',
  model: comoDelegate(prisma.produto),
  chaveUnica: 'codigo',
  colunas: [
    { chave: 'codigo', obrigatorio: true },
    { chave: 'nome', obrigatorio: true },
    { chave: 'descricao' },
    { chave: 'quantidadeCaixa' },
    { chave: 'dimensoes' },
    { chave: 'composicao' },
    { chave: 'foto' },
    // O catálogo tem 3 níveis (Categoria -> Grupo/Tipo -> Produto) e "nome"
    // não é único entre eles, então não dá pra resolver por nome sem
    // ambiguidade. Até o formato real do CSV do ERP ser definido (mesma
    // ressalva já registrada em backend/prisma/seed.ts), a importação exige
    // o tipoId de verdade — copiável da tela de catálogo do CMS.
    { chave: 'tipoId', obrigatorio: true },
  ],
  async resolverFks(linha) {
    const resolvida: LinhaImportacao = { ...linha }
    resolvida.quantidadeCaixa = paraNumero(resolvida.quantidadeCaixa)
    return resolvida
  },
}

const router = Router()
router.use('/usuarios', bulkImportRouter(usuarios))
router.use('/clientes', bulkImportRouter(clientes))
router.use('/produtos', bulkImportRouter(produtos))

export default router
