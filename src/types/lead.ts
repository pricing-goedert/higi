/** Classificação do lead, selecionada no formulário de cadastro. */
export type TipoLead = 'revenda' | 'empresa' | 'fornecedor'

/** Campos que o formulário de cadastro de leads controla. */
export interface LeadFormState {
  tipoLead: TipoLead
  cnpj: string
  razaoSocial: string
  cep :string
  contato: string
  endereco: string
  telefone: string
  email: string
  colaborador: string
  observacoes: string
}

/** Lead montado no envio. `id` vem de `DEFAULT_ID` enquanto não existe banco de dados. */
export interface Lead extends LeadFormState {
  id: number
  criadoEm: string
}

/** Mensagens de erro por campo do formulário. */
export type LeadFormErrors = Partial<Record<keyof LeadFormState, string>>
