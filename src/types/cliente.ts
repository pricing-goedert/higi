/** Placeholder de schema — campos serão ajustados quando a base real (JSON/CSV) chegar. */
export interface Cliente {
  id: number
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  cidade: string
  uf: string
  contato?: string
  telefone?: string
  email?: string
}
