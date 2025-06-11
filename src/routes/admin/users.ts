import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { getDb } from '../../db'
import { requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const users = new Hono<AdminEnv>()
users.use(requireLogin)

users.use(async (c, next) => {
  const user = c.get('user')
  if (user.tenantId) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})

// List users
users.get('/', async c => {
  const list = await getDb(c).adminUser.findMany({})
  return c.json({ users: list })
})

// Create user
users.post('/', async c => {
  const { email, password, tenantId } = await c.req.json()
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await getDb(c).adminUser.create({ data: { email, passwordHash, tenantId, createdAt: new Date() } })
  return c.json({ user })
})

// Patch user
users.patch('/:id', async c => {
  const id = c.req.param('id')
  const { password, tenantId, isActive } = await c.req.json()
  const data: any = {}
  if (typeof isActive === 'boolean') data.isActive = isActive
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  if (tenantId) data.tenantId = tenantId
  const updated = await getDb(c).adminUser.update({ where: { id }, data })
  return c.json({ user: updated })
})

// Delete user
users.delete('/:id', async c => {
  const id = c.req.param('id')
  await getDb(c).adminUser.delete({ where: { id } })
  return c.json({})
})
