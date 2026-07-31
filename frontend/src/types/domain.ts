/**
 * Mirrors the backend's API response shapes (backend/src/routes/usuarios.ts,
 * clientes via lib/crudRouter.ts). Hand-duplicated rather than shared via a
 * workspace package — see the Phase 2 discussion in chat: worth revisiting
 * once there are more than a couple of shared shapes to justify the setup.
 */

export interface Usuario {
  id: string
  nome: string
  email: string
  isAdmin: boolean
  superiorId: string | null
  cnpj: string | null
  tipoRepresentante: 'nacional' | 'exportacao' | null
  cidade: string | null
  uf: string | null
  pais: string | null
  telefone: string | null
  whatsapp: string | null
  endereco: string | null
  createdAt: string
  updatedAt: string
}

export interface Cliente {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  contato: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  representanteId: string | null
  createdAt: string
  updatedAt: string
}

export type TipoLead = 'Revenda' | 'Empresas' | 'Fornecedor'

export interface Lead {
  id: string
  clientUuid: string
  tipo: TipoLead
  cnpj: string
  razaoSocial: string
  contato: string
  telefone: string
  cep: string | null
  endereco: string | null
  email: string | null
  observacoes: string | null
  clienteId: string | null
  capturadoPorId: string | null
  createdAt: string
}

export interface NovoLead {
  clientUuid: string
  tipo: TipoLead
  cnpj: string
  razaoSocial: string
  contato: string
  telefone: string
  cep?: string
  endereco?: string
  email?: string
  observacoes?: string
  clienteId?: string | null
}

// Catalog: Categoria -> Grupo (optional, some categorias are flat) -> Tipo -> Produto.
export interface Categoria {
  id: string
  nome: string
  descricao: string | null
}

export interface Grupo {
  id: string
  nome: string
  categoriaId: string
}

export interface Tipo {
  id: string
  nome: string
  categoriaId: string | null // set when flat (no grupo above this tipo)
  grupoId: string | null
}

export interface Produto {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  quantidadeCaixa: number | null
  pesoLiquido: number | null
  pesoBruto: number | null
  dimensoes: string | null
  composicao: string | null
  foto: string | null
  tipoId: string
}

export interface Programacao {
  id: string
  dia: string
  horario: string | null
  titulo: string
  descricao: string | null
}

export type CategoriaIndicacao = 'restaurante' | 'farmacia_mercado' | 'transporte' | 'passeio'

export interface Indicacao {
  id: string
  categoria: CategoriaIndicacao
  subcategoria: string | null
  nome: string
  endereco: string | null
  horario: string | null
  telefone: string | null
  latitude: number | null
  longitude: number | null
  mapaUrl: string | null
  distanciaMetros: number | null
}

export interface OrientacaoSecao {
  id: string
  titulo: string | null
  texto: string
  ordem: number
  orientacaoId: string
}

export interface Orientacao {
  id: string
  titulo: string
  descricao: string | null
  ordem: number
  secoes: OrientacaoSecao[]
}
