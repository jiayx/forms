import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const fieldTypes = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// List
fieldTypes.get('/', requireAdmin, async c => {
  const list = await getDb(c).fieldTemplate.findMany({})
  return c.json({ field_types: list })
})

// Create
fieldTypes.post('/', requireAdmin, async c => {
  const data = await c.req.json()
  const t = await getDb(c).fieldTemplate.create({ data })
  return c.json({ field_type: t })
})

// Patch
fieldTypes.patch('/:id', requireAdmin, async c => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const t = await getDb(c).fieldTemplate.update({ where: { id }, data })
  return c.json({ field_type: t })
})

// Delete
fieldTypes.delete('/:id', requireAdmin, async c => {
  const id = c.req.param('id')
  await getDb(c).fieldTemplate.delete({ where: { id } })
  return c.json({})
})
