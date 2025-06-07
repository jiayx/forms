import type { Context, Next } from 'hono'
import { verifyAccess } from './auth'
import { EnvBindings } from '../../db'

export async function requireAdmin(c: Context<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>, next: Next) {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const payload = await verifyAccess(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', payload)
  await next()
}
