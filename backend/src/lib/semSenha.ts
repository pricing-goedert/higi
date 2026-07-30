export function semSenha<T extends { passwordHash: string }>(usuario: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...resto } = usuario
  return resto
}
