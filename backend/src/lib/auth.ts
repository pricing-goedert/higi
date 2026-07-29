import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido')
}

// Long expiry + refreshed on every login while online, so a rep logs in
// once (ideally during the pre-expo sync) and isn't prompted again for the
// rest of the event — see docs/SPECS.md's Login section.
const TOKEN_TTL = '30d'

export const COOKIE_NAME = 'higiexpo_session'

export interface TokenPayload {
  id: string
  isAdmin: boolean
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET as string) as TokenPayload
}
