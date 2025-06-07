import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { getDb, EnvBindings } from '../../db'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 14

export const auth = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string } }>()

async function signAccess(user: { id: number; tenantId: string | null }, secret: string) {
  const payload: any = {
    sub: String(user.id),
    role: 'admin',
    tenant_ids: user.tenantId ? [user.tenantId] : []
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(new TextEncoder().encode(secret))
}

export async function verifyAccess(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload
  } catch (_) {
    return null
  }
}

auth.post('/login', async c => {
  const { email, password } = await c.req.json()
  const user = await getDb(c).adminUser.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  const now = Math.floor(Date.now() / 1000)
  await getDb(c).adminUser.update({ where: { id: user.id }, data: { lastLoginAt: now } })
  const access = await signAccess(user, c.env.JWT_SECRET)
  const refreshToken = crypto.randomUUID()
  await getDb(c).adminRefreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: now + REFRESH_TTL, createdAt: now } })
  return c.json({ access, refresh: refreshToken })
})

auth.post('/refresh', async c => {
  const { refresh } = await c.req.json()
  const token = await getDb(c).adminRefreshToken.findUnique({ where: { token: refresh } })
  const now = Math.floor(Date.now() / 1000)
  if (!token || token.expiresAt < now) {
    return c.json({ error: 'Invalid token' }, 401)
  }
  const user = await getDb(c).adminUser.findUnique({ where: { id: token.userId } })
  if (!user || !user.isActive) {
    return c.json({ error: 'Invalid token' }, 401)
  }
  const access = await signAccess(user, c.env.JWT_SECRET)
  return c.json({ access })
})

auth.post('/logout', async c => {
  const { refresh } = await c.req.json()
  await getDb(c).adminRefreshToken.deleteMany({ where: { token: refresh } })
  return c.json({})
})
