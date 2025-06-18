import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { AdminEnv } from '../types'
import { adminUsers, adminRefreshTokens } from '@forms/db/schema'
import { AdminUserSelect, adminUserInsertSchema } from '@forms/db/zod'
import { eq, lt, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { requireLogin } from '../middleware'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 30

export const auth = new Hono<AdminEnv>()

auth.post('/login', async (c) => {
  const db = drizzle(c.env.DB)
  const parsed = adminUserInsertSchema.parse(await c.req.json())
  const { email, password } = parsed
  let user = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).get()
  if (!user) {
    const count = await db.$count(adminUsers)
    if (count === 0) {
      // create default admin user
      user = await db
        .insert(adminUsers)
        .values({ email, password: await bcrypt.hash(password, 10), isActive: true })
        .returning()
        .get()
    } else {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
  }

  console.log('user login: ', user)
  if (!user || !user.isActive) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  const now = new Date()
  await db.update(adminUsers).set({ lastLoginAt: now.toISOString() }).where(eq(adminUsers.id, user.id))
  const accessToken = await signAccess(user, c.env.JWT_SECRET)
  const refreshToken = crypto.randomUUID()

  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000)
  await db
    .insert(adminRefreshTokens)
    .values({ userId: user.id, token: refreshToken, expiresAt: expiresAt.toISOString() })
  // delete old refresh token
  await db
    .delete(adminRefreshTokens)
    .where(and(eq(adminRefreshTokens.userId, user.id), lt(adminRefreshTokens.expiresAt, now.toISOString())))
  return c.json({ accessToken, refreshToken })
})

auth.get('/current', requireLogin, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json()
  if (!refreshToken) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const db = drizzle(c.env.DB)
  const token = await db.select().from(adminRefreshTokens).where(eq(adminRefreshTokens.token, refreshToken)).get()
  if (!token) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const now = new Date()
  const expiresAt = new Date(token.expiresAt)
  if (expiresAt < now) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const user = await db.select().from(adminUsers).where(eq(adminUsers.id, token.userId)).get()
  if (!user || !user.isActive) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const accessToken = await signAccess(user, c.env.JWT_SECRET)
  return c.json({ accessToken })
})

auth.post('/logout', async (c) => {
  const { refreshToken } = await c.req.json()
  await drizzle(c.env.DB).delete(adminRefreshTokens).where(eq(adminRefreshTokens.token, refreshToken))
  return c.json({})
})

async function signAccess(user: AdminUserSelect, secret: string) {
  const payload: any = {
    sub: user.id,
    role: user.tenantId ? 'user' : 'admin',
    tenantId: user.tenantId,
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(new TextEncoder().encode(secret))
}
