import { describe, expect, it } from 'vitest'
import { cnpjValido, mascaraCep, mascaraCnpj, mascaraTelefone, norm, correspondeABusca } from './format'

describe('cnpjValido', () => {
  it('accepts a checksum-valid CNPJ, formatted or not', () => {
    expect(cnpjValido('11222333000181')).toBe(true)
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
  })

  it('rejects a wrong checksum', () => {
    expect(cnpjValido('11222333000180')).toBe(false)
  })

  it('rejects the wrong length', () => {
    expect(cnpjValido('112223330001')).toBe(false)
  })

  it('rejects all-repeated-digit sequences', () => {
    expect(cnpjValido('00000000000000')).toBe(false)
    expect(cnpjValido('11111111111111')).toBe(false)
  })
})

describe('mascaraCnpj', () => {
  it('formats progressively as digits are typed', () => {
    expect(mascaraCnpj('11')).toBe('11')
    expect(mascaraCnpj('112223')).toBe('11.222.3')
    expect(mascaraCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('mascaraTelefone', () => {
  it('formats a 10-digit landline number', () => {
    expect(mascaraTelefone('1132224455')).toBe('(11) 3222-4455')
  })

  it('formats an 11-digit cellphone number', () => {
    expect(mascaraTelefone('11992223344')).toBe('(11) 99222-3344')
  })
})

describe('mascaraCep', () => {
  it('formats an 8-digit CEP', () => {
    expect(mascaraCep('01310100')).toBe('01310-100')
  })
})

describe('norm / correspondeABusca', () => {
  it('is accent-insensitive and case-insensitive', () => {
    expect(norm('São Paulo')).toBe('sao paulo')
    expect(correspondeABusca('São Paulo', 'sao paulo')).toBe(true)
    expect(correspondeABusca('São Paulo', 'SAO')).toBe(true)
  })

  it('treats an empty search as matching everything', () => {
    expect(correspondeABusca('qualquer coisa', '')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(correspondeABusca('São Paulo', 'rio de janeiro')).toBe(false)
  })
})
