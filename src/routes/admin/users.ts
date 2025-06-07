import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const users = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// List users
users.get('/', requireAdmin, async c => {
  const list = await getDb(c).adminUser.findMany({})
  return c.json({ users: list })
})

// Create user
users.post('/', requireAdmin, async c => {
  const { email, password, tenant_id } = await c.req.json()
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await getDb(c).adminUser.create({ data: { email, passwordHash, tenantId: tenant_id || null, createdAt: Math.floor(Date.now()/1000) } })
  return c.json({ user })
})

// Patch user
users.patch('/:id', requireAdmin, async c => {
  const id = Number(c.req.param('id'))
  const { password, tenant_ids, is_active } = await c.req.json()
  const data: any = {}
  if (typeof is_active === 'boolean') data.isActive = is_active
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  if (tenant_ids) data.tenantId = tenant_ids[0] || null
  const updated = await getDb(c).adminUser.update({ where: { id }, data })
  return c.json({ user: updated })
})

// Delete user
users.delete('/:id', requireAdmin, async c => {
  const id = Number(c.req.param('id'))
  await getDb(c).adminUser.delete({ where: { id } })
  return c.json({})
})
