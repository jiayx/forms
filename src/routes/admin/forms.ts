import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const forms = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// List forms
forms.get('/', requireAdmin, async c => {
  const tenantId = c.req.query('tenant_id') || undefined
  const result = await getDb(c).form.findMany({ where: tenantId ? { tenantId } : undefined })
  return c.json({ forms: result })
})

// Create form
forms.post('/', requireAdmin, async c => {
  const { tenant_id, name, slug, notify_emails } = await c.req.json()
  const form = await getDb(c).form.create({ data: { tenantId: tenant_id, name, slug, notifyEmails: notify_emails } })
  return c.json({ form })
})

// Update form
forms.patch('/:id', requireAdmin, async c => {
  const id = c.req.param('id')
  const { name, notify_emails } = await c.req.json()
  const form = await getDb(c).form.update({ where: { id }, data: { name, notifyEmails: notify_emails } })
  return c.json({ form })
})

// Delete form
forms.delete('/:id', requireAdmin, async c => {
  const id = c.req.param('id')
  await getDb(c).form.delete({ where: { id } })
  return c.json({})
})
