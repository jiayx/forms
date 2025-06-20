import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { AdminEnv } from '../types'
import { users, userRefreshTokens } from '@forms/db/schema'
import { UserSelect } from '@forms/db/zod'
import { eq, lt, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { requireLogin } from '../middleware'
import { z } from 'zod/v4'
import { success, error } from '@forms/shared/schema'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 30

export const auth = new Hono<AdminEnv>()

export const loginUserSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
})

// parse name from email
function parseNameFromEmail(email: string) {
  return email.split('@')[0]
}

auth.post('/login', async (c) => {
  const db = drizzle(c.env.DB)
  const parsed = loginUserSchema.parse(await c.req.json())
  const { email, password } = parsed
  let user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) {
    const count = await db.$count(users)
    if (count === 0) {
      // create default admin user
      user = await db
        .insert(users)
        .values({
          email,
          passwordHash: await bcrypt.hash(password, 10),
          name: parseNameFromEmail(email),
          role: 'admin',
          isActive: true,
        })
        .returning()
        .get()
    }
  }

  console.log('user login: ', user)
  if (!user || !user.isActive) {
    return c.json(error('Invalid credentials'), 401)
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return c.json(error('Invalid credentials'), 401)
  }

  const now = new Date()
  await db.update(users).set({ lastLoginAt: now.toISOString() }).where(eq(users.id, user.id))
  const accessToken = await signAccess(user, c.env.JWT_SECRET)
  const refreshToken = crypto.randomUUID()

  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000)
  await db
    .insert(userRefreshTokens)
    .values({ userId: user.id, token: refreshToken, expiresAt: expiresAt.toISOString() })
  // delete old refresh token
  await db
    .delete(userRefreshTokens)
    .where(and(eq(userRefreshTokens.userId, user.id), lt(userRefreshTokens.expiresAt, now.toISOString())))
  return c.json(success({ accessToken, refreshToken }))
})

auth.get('/current', requireLogin, async (c) => {
  const userId = c.var.user.id
  const user = await drizzle(c.env.DB).select().from(users).where(eq(users.id, userId)).get()
  return c.json(
    success({
      ...user,
      passwordHash: undefined,
    })
  )
})

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json()
  if (!refreshToken) {
    return c.json(error('Invalid token'), 401)
  }

  const db = drizzle(c.env.DB)
  const token = await db.select().from(userRefreshTokens).where(eq(userRefreshTokens.token, refreshToken)).get()
  if (!token) {
    return c.json(error('Invalid token'), 401)
  }

  const now = new Date()
  const expiresAt = new Date(token.expiresAt)
  if (expiresAt < now) {
    return c.json(error('Invalid token'), 401)
  }

  const user = await db.select().from(users).where(eq(users.id, token.userId)).get()
  if (!user || !user.isActive) {
    return c.json(error('Invalid token'), 401)
  }

  const accessToken = await signAccess(user, c.env.JWT_SECRET)
  return c.json(success({ accessToken }))
})

auth.post('/logout', async (c) => {
  const { refreshToken } = await c.req.json()
  await drizzle(c.env.DB).delete(userRefreshTokens).where(eq(userRefreshTokens.token, refreshToken))
  return c.json(success())
})

async function signAccess(user: UserSelect, secret: string) {
  const payload: any = {
    sub: user.id,
    role: user.role,
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(new TextEncoder().encode(secret))
}
