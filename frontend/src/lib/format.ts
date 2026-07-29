/**
 * CNPJ checksum validation, phone/CEP input masks, and an accent-insensitive
 * search helper. Implemented from the standard public algorithms — the old
 * prototype's source no longer exists in this repo to port from (see
 * docs/PLAN.md Phase 4).
 */

const PESOS_PRIMEIRO_DIGITO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_SEGUNDO_DIGITO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

function calcularDigitoVerificador(digitos: string, pesos: number[]): number {
  const soma = digitos
    .split('')
    .reduce((acumulado, digito, indice) => acumulado + Number(digito) * pesos[indice], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function cnpjValido(valor: string): boolean {
  const cnpj = somenteDigitos(valor)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false // e.g. "00000000000000"

  const primeiroDigito = calcularDigitoVerificador(cnpj.slice(0, 12), PESOS_PRIMEIRO_DIGITO)
  if (primeiroDigito !== Number(cnpj[12])) return false

  const segundoDigito = calcularDigitoVerificador(cnpj.slice(0, 13), PESOS_SEGUNDO_DIGITO)
  return segundoDigito === Number(cnpj[13])
}

export function mascaraCnpj(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 14)
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function mascaraTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 11)
  if (digitos.length <= 10) {
    // (00) 0000-0000 — landline
    return digitos
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  // (00) 00000-0000 — cellphone
  return digitos
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function mascaraCep(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 8)
  return digitos.replace(/^(\d{5})(\d)/, '$1-$2')
}

// \p{Diacritic} (Unicode property escape) matches combining accent marks
// after NFD decomposition — avoids embedding literal combining characters
// in source, which are easy to mis-copy and hard to review.
const DIACRITICOS = /\p{Diacritic}/gu

/** Lowercases and strips diacritics, so "Sao Paulo" matches "São Paulo". */
export function norm(valor: string): string {
  return valor.normalize('NFD').replace(DIACRITICOS, '').toLowerCase().trim()
}

export function correspondeABusca(texto: string, busca: string): boolean {
  if (!busca.trim()) return true
  return norm(texto).includes(norm(busca))
}
