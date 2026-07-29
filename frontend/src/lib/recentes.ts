const CHAVE = 'higiexpo:clientes-recentes'
const LIMITE = 5

export interface BuscaRecente {
  id: string
  cnpj: string
  razaoSocial: string
}

export function obterRecentes(): BuscaRecente[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : []
  } catch {
    return []
  }
}

export function registrarRecente(busca: BuscaRecente) {
  const atuais = obterRecentes().filter((item) => item.id !== busca.id)
  atuais.unshift(busca)
  localStorage.setItem(CHAVE, JSON.stringify(atuais.slice(0, LIMITE)))
}
