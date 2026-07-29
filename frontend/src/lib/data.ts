/**
 * Thin wrapper around the bulk-read API. Phase 5 (docs/PLAN.md) swaps these
 * internals to read from Dexie instead of `fetch` directly — views call
 * these functions rather than `api.get(...)` so that swap doesn't touch
 * every screen.
 */
import { api } from './api'
import type {
  Categoria,
  Cliente,
  Grupo,
  Indicacao,
  Lead,
  NovoLead,
  Orientacao,
  Produto,
  Programacao,
  Tipo,
  Usuario,
} from '@/types/domain'

export function listUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios')
}

export function getUsuario(id: string): Promise<Usuario> {
  return api.get<Usuario>(`/usuarios/${id}`)
}

export function listClientes(): Promise<Cliente[]> {
  return api.get<Cliente[]>('/clientes')
}

export function getCliente(id: string): Promise<Cliente> {
  return api.get<Cliente>(`/clientes/${id}`)
}

// Scoped server-side to the caller's own leads unless they're an admin —
// see backend/src/routes/leads.ts.
export function listLeads(): Promise<Lead[]> {
  return api.get<Lead[]>('/leads')
}

export function criarLead(dados: NovoLead): Promise<Lead> {
  return api.post<Lead>('/leads', dados)
}

export function listCategorias(): Promise<Categoria[]> {
  return api.get<Categoria[]>('/categorias')
}

export function getCategoria(id: string): Promise<Categoria> {
  return api.get<Categoria>(`/categorias/${id}`)
}

export function listGrupos(): Promise<Grupo[]> {
  return api.get<Grupo[]>('/grupos')
}

export function getGrupo(id: string): Promise<Grupo> {
  return api.get<Grupo>(`/grupos/${id}`)
}

export function listTipos(): Promise<Tipo[]> {
  return api.get<Tipo[]>('/tipos')
}

export function getTipo(id: string): Promise<Tipo> {
  return api.get<Tipo>(`/tipos/${id}`)
}

export function listProdutos(): Promise<Produto[]> {
  return api.get<Produto[]>('/produtos')
}

export function getProduto(id: string): Promise<Produto> {
  return api.get<Produto>(`/produtos/${id}`)
}

export function listProgramacao(): Promise<Programacao[]> {
  return api.get<Programacao[]>('/programacao')
}

export function listIndicacoes(): Promise<Indicacao[]> {
  return api.get<Indicacao[]>('/indicacoes')
}

export function getIndicacao(id: string): Promise<Indicacao> {
  return api.get<Indicacao>(`/indicacoes/${id}`)
}

export function listOrientacoes(): Promise<Orientacao[]> {
  return api.get<Orientacao[]>('/orientacoes')
}

export function getOrientacao(id: string): Promise<Orientacao> {
  return api.get<Orientacao>(`/orientacoes/${id}`)
}
