import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { getDb } from '../../db'
import type { AdminEnv } from '../../types'
import { AdminUser } from '@prisma/client'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 14

export const auth = new Hono<AdminEnv>()

async function signAccess(user: AdminUser, secret: string) {
  const payload: any = {
    sub: user.id,
    role: 'admin',
    tenantId: user.tenantId,
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(new TextEncoder().encode(secret))
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
  const now = new Date()
  await getDb(c).adminUser.update({ where: { id: user.id }, data: { lastLoginAt: now } })
  const access = await signAccess(user, c.env.JWT_SECRET)
  const refreshToken = crypto.randomUUID()

  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000)
  await getDb(c).adminRefreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: expiresAt, createdAt: now } })
  return c.json({ access, refresh: refreshToken })
})

auth.post('/refresh', async c => {
  const { refresh } = await c.req.json()
  const token = await getDb(c).adminRefreshToken.findUnique({ where: { token: refresh } })
  const now = new Date()
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
