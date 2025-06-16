import { Hono } from 'hono'
import { requireAdmin, requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq } from 'drizzle-orm'

export const fieldApi = new Hono<AdminEnv>()
fieldApi.use(requireLogin)
fieldApi.use(requireAdmin)

// List
fieldApi.get('/', async (c) => {
  const list = await drizzle(c.env.DB).select().from(schema.fieldTemplates).all()
  return c.json({ fieldTemplates: list })
})

// Create
fieldApi.post('/', async (c) => {
  const data = await c.req.json()
  const t = await drizzle(c.env.DB).insert(schema.fieldTemplates).values(data).returning().get()
  return c.json({ fieldTemplate: t })
})

// Patch
fieldApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const t = await drizzle(c.env.DB)
    .update(schema.fieldTemplates)
    .set(data)
    .where(eq(schema.fieldTemplates.id, id))
    .returning()
    .get()
  return c.json({ fieldTemplate: t })
})

// Delete
fieldApi.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await drizzle(c.env.DB).delete(schema.fieldTemplates).where(eq(schema.fieldTemplates.id, id)).returning().get()
  return c.json({})
})
