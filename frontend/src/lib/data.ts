/**
 * Reads go through Dexie (the local synced copy — see lib/db.ts's syncAll),
 * not `fetch`, so every screen works offline once synced. Leads are the one
 * exception: they're not a synced collection (see docs/ARCHITECTURE.md),
 * they're a write path — see lib/outbox.ts.
 */
import { db } from './db'
import { api } from './api'
import type { Categoria, Grupo, Indicacao, Lead, Orientacao, Produto, Programacao, Tipo, Usuario, Cliente } from '@/types/domain'

async function buscarOuFalhar<T>(promessa: Promise<T | undefined>, nomeEntidade: string): Promise<T> {
  const registro = await promessa
  if (!registro) throw new Error(`${nomeEntidade} não encontrado`)
  return registro
}

export function listUsuarios(): Promise<Usuario[]> {
  return db.usuarios.toArray()
}

export function getUsuario(id: string): Promise<Usuario> {
  return buscarOuFalhar(db.usuarios.get(id), 'Usuário')
}

export function listClientes(): Promise<Cliente[]> {
  return db.clientes.toArray()
}

export function getCliente(id: string): Promise<Cliente> {
  return buscarOuFalhar(db.clientes.get(id), 'Cliente')
}

// Not a synced-offline collection — leads are read live from the server,
// scoped server-side to the caller's own leads unless they're an admin.
// See backend/src/routes/leads.ts and lib/outbox.ts for the write path.
export function listLeads(): Promise<Lead[]> {
  return api.get<Lead[]>('/leads')
}

export function listCategorias(): Promise<Categoria[]> {
  return db.categorias.toArray()
}

export function getCategoria(id: string): Promise<Categoria> {
  return buscarOuFalhar(db.categorias.get(id), 'Categoria')
}

export function listGrupos(): Promise<Grupo[]> {
  return db.grupos.toArray()
}

export function getGrupo(id: string): Promise<Grupo> {
  return buscarOuFalhar(db.grupos.get(id), 'Grupo')
}

export function listTipos(): Promise<Tipo[]> {
  return db.tipos.toArray()
}

export function getTipo(id: string): Promise<Tipo> {
  return buscarOuFalhar(db.tipos.get(id), 'Tipo')
}

export function listProdutos(): Promise<Produto[]> {
  return db.produtos.toArray()
}

export function getProduto(id: string): Promise<Produto> {
  return buscarOuFalhar(db.produtos.get(id), 'Produto')
}

export function listProgramacao(): Promise<Programacao[]> {
  return db.programacao.toArray()
}

export function listIndicacoes(): Promise<Indicacao[]> {
  return db.indicacoes.toArray()
}

export function getIndicacao(id: string): Promise<Indicacao> {
  return buscarOuFalhar(db.indicacoes.get(id), 'Indicação')
}

export function listOrientacoes(): Promise<Orientacao[]> {
  return db.orientacoes.toArray()
}

export function getOrientacao(id: string): Promise<Orientacao> {
  return buscarOuFalhar(db.orientacoes.get(id), 'Orientação')
}
