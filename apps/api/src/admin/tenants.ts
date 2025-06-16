import { Hono } from 'hono'
import { requireAdmin, requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { eq, count, sql } from 'drizzle-orm'
import * as schema from '@forms/db/schema'
import { tenantInsertSchema, tenantUpdateSchema } from '@forms/db/zod'

export const tenantApi = new Hono<AdminEnv>()
tenantApi.use(requireLogin, requireAdmin)

// List tenants
tenantApi.get('/', async (c) => {
  const db = drizzle(c.env.DB, { schema })

  const sub = db
    .select({ value: count(schema.submissions.id) })
    .from(schema.submissions)
    .innerJoin(schema.forms, eq(schema.forms.id, schema.submissions.formId))
    .where(eq(schema.forms.tenantId, schema.tenants.id))

  const tenants = await db.query.tenants.findMany({
    with: { forms: true },
    extras: {
      submissionsCount: sql<number>`(${sub})`.as('submissionsCount'),
      // submissionsCount: sql<number>`(
      //   select count(*)
      //     from ${schema.submission} as s
      //    where s.form_id = ${schema.form.id}
      // )`.as("submissionsCount"),
    },
  })
  return c.json({ tenants })
})

// Create tenant
tenantApi.post('/', async (c) => {
  const parsed = tenantInsertSchema.parse(await c.req.json())
  parsed.apiKey = crypto.randomUUID()
  const tenant = await drizzle(c.env.DB).insert(schema.tenants).values(parsed).returning().get()
  return c.json({ tenant })
})

// Get tenant
tenantApi.get('/:id', async (c) => {
  const id = c.req.param('id')
  const tenant = await drizzle(c.env.DB, { schema }).query.tenants.findFirst({
    with: { forms: true },
    where: eq(schema.tenants.id, id),
  })
  return c.json({ tenant })
})

// Update tenant
tenantApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = tenantUpdateSchema.parse(await c.req.json())
  const updated = await drizzle(c.env.DB)
    .update(schema.tenants)
    .set(parsed)
    .where(eq(schema.tenants.id, id))
    .returning()
    .get()
  return c.json({ tenant: updated })
})

// Delete tenant
tenantApi.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await drizzle(c.env.DB).delete(schema.tenants).where(eq(schema.tenants.id, id))
  return c.json({})
})
