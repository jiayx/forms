import type { Context, Next } from 'hono'
import { AdminEnv } from './types'
import { jwtVerify } from 'jose'

export async function requireLogin(c: Context<AdminEnv>, next: Next) {
  const tokenHeader = c.req.header('Authorization') || ''
  if (!tokenHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  }
  const token = tokenHeader.slice(7)
  const payload = await verifyAccess(token, c.env.JWT_SECRET)
  if (!payload || !payload.sub) {
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  }

  let targetId: string | undefined
  if (payload.role === 'admin') {
    const impersonateUserId = c.req.header('X-Impersonate-User')
    if (impersonateUserId) {
      targetId = impersonateUserId
    }
  } else {
    targetId = payload.sub
  }

  const user = { id: payload.sub, targetId, role: payload.role as 'admin' | 'user' }
  console.log('current user: ', user)
  c.set('user', user)
  await next()
}

export async function requireAdmin(c: Context<AdminEnv>, next: Next) {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, message: 'Forbidden' }, 403)
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
