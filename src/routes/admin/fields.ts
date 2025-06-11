import { Hono } from 'hono'
import { getDb } from '../../db'
import { requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const fields = new Hono<AdminEnv>()

fields.use(requireLogin)

// Create fields
fields.post('/forms/:id/fields', async c => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await getDb(c).field.createMany({ data: Array.isArray(body) ? body.map((f:any)=>({ ...f, formId:id })) : [{ ...body, formId:id }] })
  return c.json({ count: result.count })
})

// Patch field
fields.patch('/fields/:fieldId', async c => {
  const fieldId = c.req.param('fieldId')
  const data = await c.req.json()
  const field = await getDb(c).field.update({ where: { id: fieldId }, data })
  return c.json({ field })
})

// Delete field
fields.delete('/fields/:fieldId', async c => {
  const fieldId = c.req.param('fieldId')
  await getDb(c).field.delete({ where: { id: fieldId } })
  return c.json({})
})
