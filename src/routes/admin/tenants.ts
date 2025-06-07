import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const tenants = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// List tenants, super admin only
tenants.get('/', requireAdmin, async c => {
  const user = c.get('user') as any
  if (user.tenant_ids && user.tenant_ids.length > 0) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const result = await getDb(c).tenant.findMany({})
  return c.json({ tenants: result })
})

// Create tenant (return api_key)
tenants.post('/', requireAdmin, async c => {
  const user = c.get('user') as any
  if (user.tenant_ids && user.tenant_ids.length > 0) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const { name, domain, allowed_origins } = await c.req.json()
  const apiKey = crypto.randomUUID()
  const tenant = await getDb(c).tenant.create({ data: { name, domain, allowedOrigins: allowed_origins, apiKey } })
  return c.json({ tenant, api_key: apiKey })
})

// Update tenant
tenants.patch('/:id', requireAdmin, async c => {
  const user = c.get('user') as any
  if (user.tenant_ids && user.tenant_ids.length > 0) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const id = c.req.param('id')
  const data = await c.req.json()
  const updated = await getDb(c).tenant.update({ where: { id }, data })
  return c.json({ tenant: updated })
})

// Delete tenant
tenants.delete('/:id', requireAdmin, async c => {
  const user = c.get('user') as any
  if (user.tenant_ids && user.tenant_ids.length > 0) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const id = c.req.param('id')
  await getDb(c).tenant.delete({ where: { id } })
  return c.json({})
})
