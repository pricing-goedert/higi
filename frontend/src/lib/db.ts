import Dexie, { type Table } from 'dexie'
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

/** A lead saved locally, not yet confirmed by the backend. */
export interface LeadPendente extends NovoLead {
  criadoEm: string
}

class HigiexpoDB extends Dexie {
  usuarios!: Table<Usuario, string>
  clientes!: Table<Cliente, string>
  categorias!: Table<Categoria, string>
  grupos!: Table<Grupo, string>
  tipos!: Table<Tipo, string>
  produtos!: Table<Produto, string>
  indicacoes!: Table<Indicacao, string>
  orientacoes!: Table<Orientacao, string>
  programacao!: Table<Programacao, string>
  leadsOutbox!: Table<LeadPendente, string>
  leadsSincronizados!: Table<Lead, string>

  constructor() {
    super('higiexpo')
    this.version(1).stores({
      usuarios: 'id',
      clientes: 'id, cnpj',
      categorias: 'id',
      grupos: 'id, categoriaId',
      tipos: 'id, categoriaId, grupoId',
      produtos: 'id, tipoId, codigo',
      indicacoes: 'id, categoria',
      orientacoes: 'id',
      programacao: 'id, dia',
      leadsOutbox: 'clientUuid',
    })
    // Dexie versions aren't diffed — every store from version 1 must be
    // restated here too, or it gets dropped on upgrade.
    this.version(2).stores({
      usuarios: 'id',
      clientes: 'id, cnpj',
      categorias: 'id',
      grupos: 'id, categoriaId',
      tipos: 'id, categoriaId, grupoId',
      produtos: 'id, tipoId, codigo',
      indicacoes: 'id, categoria',
      orientacoes: 'id',
      programacao: 'id, dia',
      leadsOutbox: 'clientUuid',
      leadsSincronizados: 'id, capturadoPorId',
    })
  }
}

export const db = new HigiexpoDB()

/**
 * Cleared on every identity transition (login, logout, and a clean 401 on
 * session restore) — devices are shared between reps, and one rep's leads
 * (or, for an admin session, everyone's) must never leak to whoever logs in
 * next on the same phone. See stores/auth.ts.
 */
export function limparCacheLeads(): Promise<void> {
  return db.leadsSincronizados.clear()
}

/**
 * Pulls every bulk-read collection fresh from the API and overwrites the
 * local copy. No merge/conflict logic — reps never edit these locally, only
 * admins do (always online), so "overwrite with the server's latest" is
 * always correct. See docs/PLAN.md's Phase 5 section.
 */
export async function syncAll(): Promise<void> {
  const [usuarios, clientes, categorias, grupos, tipos, produtos, indicacoes, orientacoes, programacao] =
    await Promise.all([
      api.get<Usuario[]>('/usuarios'),
      api.get<Cliente[]>('/clientes'),
      api.get<Categoria[]>('/categorias'),
      api.get<Grupo[]>('/grupos'),
      api.get<Tipo[]>('/tipos'),
      api.get<Produto[]>('/produtos'),
      api.get<Indicacao[]>('/indicacoes'),
      api.get<Orientacao[]>('/orientacoes'),
      api.get<Programacao[]>('/programacao'),
    ])

  await db.transaction(
    'rw',
    [db.usuarios, db.clientes, db.categorias, db.grupos, db.tipos, db.produtos, db.indicacoes, db.orientacoes, db.programacao],
    async () => {
      await Promise.all([
        db.usuarios.clear().then(() => db.usuarios.bulkAdd(usuarios)),
        db.clientes.clear().then(() => db.clientes.bulkAdd(clientes)),
        db.categorias.clear().then(() => db.categorias.bulkAdd(categorias)),
        db.grupos.clear().then(() => db.grupos.bulkAdd(grupos)),
        db.tipos.clear().then(() => db.tipos.bulkAdd(tipos)),
        db.produtos.clear().then(() => db.produtos.bulkAdd(produtos)),
        db.indicacoes.clear().then(() => db.indicacoes.bulkAdd(indicacoes)),
        db.orientacoes.clear().then(() => db.orientacoes.bulkAdd(orientacoes)),
        db.programacao.clear().then(() => db.programacao.bulkAdd(programacao)),
      ])
    },
  )
}
