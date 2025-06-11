import { Context, Hono } from 'hono'
import { getDb } from '../../db'
import { requireAdmin, requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const forms = new Hono<AdminEnv>()
forms.use(requireLogin)
forms.use(requireAdmin)

function getTenantId(c: Context<AdminEnv>): string | undefined {
  let tenantId = c.get('user')?.tenantId || undefined
  const tenantIdFromQuery = c.req.query('tenantId')
  if (!tenantId && tenantIdFromQuery) {
    tenantId = tenantIdFromQuery
  }
  return tenantId
}
// List forms
forms.get('/', async c => {
  const tenantId = getTenantId(c)
  const result = await getDb(c).form.findMany({ where: { tenantId } })
  return c.json({ forms: result })
})

// Create form
forms.post('/', async c => {
  const { tenantId, name, slug, notifyEmails } = await c.req.json()
  const form = await getDb(c).form.create({ data: { tenantId, name, slug, notifyEmails } })
  return c.json({ form })
})

// Update form
forms.patch('/:id', async c => {
  const id = c.req.param('id')
  const { name, notifyEmails } = await c.req.json()
  const form = await getDb(c).form.update({ where: { id }, data: { name, notifyEmails } })
  return c.json({ form })
})

// Delete form
forms.delete('/:id', async c => {
  const id = c.req.param('id')
  await getDb(c).form.delete({ where: { id } })
  return c.json({})
})
