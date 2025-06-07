import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const fields = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// Create fields
fields.post('/forms/:id/fields', requireAdmin, async c => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await getDb(c).field.createMany({ data: Array.isArray(body) ? body.map((f:any)=>({ ...f, formId:id })) : [{ ...body, formId:id }] })
  return c.json({ count: result.count })
})

// Patch field
fields.patch('/fields/:field_id', requireAdmin, async c => {
  const fieldId = c.req.param('field_id')
  const data = await c.req.json()
  const field = await getDb(c).field.update({ where: { id: fieldId }, data })
  return c.json({ field })
})

// Delete field
fields.delete('/fields/:field_id', requireAdmin, async c => {
  const fieldId = c.req.param('field_id')
  await getDb(c).field.delete({ where: { id: fieldId } })
  return c.json({})
})
