/** Campos que o formulário de cadastro de leads controla. */
export interface LeadFormState {
  nome: string
  empresa: string
  email: string
  telefone: string
  observacoes: string
}

/** Lead montado no envio. `id` vem de `DEFAULT_ID` enquanto não existe banco de dados. */
export interface Lead extends LeadFormState {
  id: number
  criadoEm: string
}

/** Mensagens de erro por campo do formulário. */
export type LeadFormErrors = Partial<Record<keyof LeadFormState, string>>
