import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Cliente } from '@/types/cliente'
import clientesSeed from '@/data/clientes.seed.json'

const DB_NAME = 'higiexpo-db'
const DB_VERSION = 1

interface HigiexpoDB extends DBSchema {
  clientes: {
    key: number
    value: Cliente
    indexes: { razaoSocial: string; cnpj: string }
  }
}

let dbPromise: Promise<IDBPDatabase<HigiexpoDB>> | undefined

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<HigiexpoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('clientes', { keyPath: 'id' })
        store.createIndex('razaoSocial', 'razaoSocial')
        store.createIndex('cnpj', 'cnpj')
      },
    })
  }
  return dbPromise
}

export async function seedClientesSeNecessario() {
  try {
    const db = await getDb()
    const total = await db.count('clientes')
    if (total > 0) return

    const tx = db.transaction('clientes', 'readwrite')
    await Promise.all((clientesSeed as Cliente[]).map((cliente) => tx.store.put(cliente)))
    await tx.done
  } catch (erro) {
    console.error('[db.seedClientesSeNecessario] Falha ao popular clientes a partir de clientes.seed.json:', erro)
    throw erro
  }
}

export async function listarClientes() {
  try {
    const db = await getDb()
    return await db.getAll('clientes')
  } catch (erro) {
    console.error('[db.listarClientes] Falha ao ler clientes do IndexedDB:', erro)
    throw erro
  }
}

/** Filtro em memória por razão social, CNPJ ou cidade — usado tanto aqui quanto na tela de busca. */
export function filtrarClientes(clientes: Cliente[], termo: string) {
  const termoNormalizado = termo.trim().toLowerCase()
  if (!termoNormalizado) return clientes

  return clientes.filter((cliente) =>
    [cliente.razaoSocial, cliente.cnpj, cliente.cidade].some((campo) =>
      campo.toLowerCase().includes(termoNormalizado),
    ),
  )
}

export async function buscarClientes(termo: string) {
  return filtrarClientes(await listarClientes(), termo)
}
