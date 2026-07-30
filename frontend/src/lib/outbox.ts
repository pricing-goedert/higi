import { db, type LeadPendente } from './db'
import { api } from './api'
import type { Lead, NovoLead } from '@/types/domain'

/**
 * Instant, offline-safe — writes to IndexedDB immediately, no network wait,
 * no spinner. Matches docs/ARCHITECTURE.md's leads-outbox pattern exactly.
 */
export async function salvarLeadPendente(dados: NovoLead): Promise<void> {
  const pendente: LeadPendente = { ...dados, criadoEm: new Date().toISOString() }
  await db.leadsOutbox.put(pendente)
  void enviarPendentes() // best-effort now; queued either way if it fails
}

export function listarPendentes(): Promise<LeadPendente[]> {
  return db.leadsOutbox.toArray()
}

export function contarPendentes(): Promise<number> {
  return db.leadsOutbox.count()
}

let enviando = false

/**
 * Flushes every queued lead to the backend. Safe to call repeatedly/
 * concurrently (e.g. from an `online` listener and a manual "sync now"
 * button at once) — a no-op re-entry if already running.
 */
export async function enviarPendentes(): Promise<void> {
  if (enviando) return
  enviando = true
  try {
    const pendentes = await db.leadsOutbox.toArray()
    for (const { criadoEm: _criadoEm, ...dados } of pendentes) {
      try {
        await api.post<Lead>('/leads', dados)
        await db.leadsOutbox.delete(dados.clientUuid)
      } catch {
        // Almost certainly offline — leave the rest queued and stop this
        // pass rather than retrying each one and failing the same way.
        break
      }
    }
  } finally {
    enviando = false
  }
}
