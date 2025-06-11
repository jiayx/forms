import { Hono } from 'hono'
import { getDb } from '../../db'
import { requireAdmin, requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const fieldTypes = new Hono<AdminEnv>()
fieldTypes.use(requireLogin)
fieldTypes.use(requireAdmin)

// List
fieldTypes.get('/', async c => {
  const list = await getDb(c).fieldTemplate.findMany({})
  return c.json({ field_types: list })
})

// Create
fieldTypes.post('/', async c => {
  const data = await c.req.json()
  const t = await getDb(c).fieldTemplate.create({ data })
  return c.json({ field_type: t })
})

// Patch
fieldTypes.patch('/:id', async c => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const t = await getDb(c).fieldTemplate.update({ where: { id }, data })
  return c.json({ field_type: t })
})

// Delete
fieldTypes.delete('/:id', async c => {
  const id = c.req.param('id')
  await getDb(c).fieldTemplate.delete({ where: { id } })
  return c.json({})
})
