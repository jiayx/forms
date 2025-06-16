import { Context, Hono } from 'hono'
import { requireAdmin, requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '@forms/db/schema'
import { formInsertSchema, formUpdateExtSchema } from '@forms/db/zod'

export const formsApi = new Hono<AdminEnv>()
formsApi.use(requireLogin, requireAdmin)

function getTenantId(c: Context<AdminEnv>): string | undefined {
  const tenantId = c.get('user')?.tenantId
  const tenantIdFromQuery = c.req.query('tenantId')
  return tenantId || tenantIdFromQuery
}

// List forms
formsApi.get('/', async (c) => {
  const tenantId = getTenantId(c)

  const db = drizzle(c.env.DB, { schema })
  const result = await db.query.forms.findMany({
    with: {
      tenant: true,
      fields: true,
    },
    where: tenantId ? eq(schema.forms.tenantId, tenantId) : undefined,
    extras: {
      submissionsCount: sql<number>`(
        select count(*)
          from ${schema.submissions} as s
         where s.form_id = ${schema.forms.id}
      )`.as('submissionsCount'), // workaround for drizzle bug. see https://github.com/drizzle-team/drizzle-orm/issues/4164
      // submissionsCount: db.$count(schema.submission, eq(schema.submission.formId, schema.form.id)).as("submissionsCount"),
    },
  })

  return c.json({ forms: result })
})

// Create form
formsApi.post('/', async (c) => {
  const parsed = formInsertSchema.parse(await c.req.json())
  const form = await drizzle(c.env.DB).insert(schema.forms).values(parsed).returning().get()
  return c.json({ form })
})

// Get form
formsApi.get('/:id', async (c) => {
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })
  const form = await db.query.forms.findFirst({
    with: {
      tenant: true,
      fields: true,
    },
    where: eq(schema.forms.id, id),
    extras: {
      submissionsCount: sql<number>`(
        select count(*)
          from ${schema.submissions} as s
         where s.form_id = ${schema.forms.id}
      )`.as('submissionsCount'), // workaround for drizzle bug. see https://github.com/drizzle-team/drizzle-orm/issues/4164
    },
  })
  return c.json({ form })
})

// Update form
formsApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = formUpdateExtSchema.parse(await c.req.json())

  parsed.id = undefined
  parsed.fields.forEach((field) => {
    field.formId = id
  })

  const db = drizzle(c.env.DB)

  if (parsed.fields.length > 0) {
    await db.batch([
      db.update(schema.forms).set(parsed).where(eq(schema.forms.id, id)),
      db.delete(schema.fields).where(eq(schema.fields.formId, id)),
      db.insert(schema.fields).values(parsed.fields),
    ])
  } else {
    await db.batch([
      db.update(schema.forms).set(parsed).where(eq(schema.forms.id, id)),
      db.delete(schema.fields).where(eq(schema.fields.formId, id)),
    ])
  }

  return c.json({})
})

// Delete form
formsApi.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const db = drizzle(c.env.DB)
  await db.batch([
    db.delete(schema.forms).where(eq(schema.forms.id, id)),
    db.delete(schema.fields).where(eq(schema.fields.formId, id)),
  ])
  return c.json({})
})
