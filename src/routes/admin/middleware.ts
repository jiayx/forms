import type { Context, Next } from 'hono'
import { AdminEnv } from '../../types'
import { jwtVerify } from 'jose'
import { getDb } from '../../db'

export async function requireLogin(c: Context<AdminEnv>, next: Next) {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const payload = await verifyAccess(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const user = await getDb(c).adminUser.findUnique({ where: { id: payload.sub } })
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
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

async function verifyAccess(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload
  } catch (_) {
    return null
  }
}