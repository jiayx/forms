import { Hono } from 'hono'
import { getDb } from '../../db'
import { requireAdmin, requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const tenants = new Hono<AdminEnv>()
tenants.use(requireLogin)
tenants.use(requireAdmin)

// List tenants, super admin only
tenants.get('/', async c => {
  const result = await getDb(c).tenant.findMany({})
  return c.json({ tenants: result })
})

// Create tenant (return api_key)
tenants.post('/', async c => {
  const { name, domain, allowed_origins } = await c.req.json()
  const apiKey = crypto.randomUUID()
  const tenant = await getDb(c).tenant.create({ data: { name, domain, allowedOrigins: allowed_origins, apiKey } })
  return c.json({ tenant })
})

// Update tenant
tenants.patch('/:id', async c => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const updated = await getDb(c).tenant.update({ where: { id }, data })
  return c.json({ tenant: updated })
})

// Delete tenant
tenants.delete('/:id', async c => {
  const id = c.req.param('id')
  await getDb(c).tenant.delete({ where: { id } })
  return c.json({})
})
