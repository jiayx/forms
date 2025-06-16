import type { Context, Next } from 'hono'
import { AdminEnv } from './types'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import { adminUsers } from '@forms/db/schema'
import { drizzle } from 'drizzle-orm/d1'

export async function requireLogin(c: Context<AdminEnv>, next: Next) {
  const apiKey = c.req.header('X-Api-Key') || ''
  const payload = await verifyAccess(apiKey, c.env.JWT_SECRET)
  if (!payload || !payload.sub) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const user = await drizzle(c.env.DB).select().from(adminUsers).where(eq(adminUsers.id, payload.sub)).get()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  console.log('current user: ', user)
  c.set('user', user)
  await next()
}

export async function requireAdmin(c: Context<AdminEnv>, next: Next) {
  const user = c.get('user')
  if (!user || user.tenantId) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
}

async function verifyAccess(apiKey: string, secret: string) {
  try {
    const { payload } = await jwtVerify(apiKey, new TextEncoder().encode(secret))
    return payload
  } catch (_) {
    return null
  }
}
