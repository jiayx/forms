import { Hono } from 'hono'
import { requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, sql } from 'drizzle-orm'
import * as schema from '@forms/db/schema'
import { formInsertSchema, formUpdateExtSchema } from '@forms/db/zod'
import { success, error } from '@forms/shared/schema'

export const formsApi = new Hono<AdminEnv>()
formsApi.use(requireLogin)

// List forms
formsApi.get('/', async (c) => {
  const targetId = c.var.user.targetId
  const scope = c.req.query('scope')

  const db = drizzle(c.env.DB, { schema })
  const forms = await db.query.forms.findMany({
    with: {
      user: true,
    },
    where: targetId ? eq(schema.forms.userId, targetId) : undefined,
    extras: {
      submissionsCount: sql<number>`(
        select count(*)
          from ${schema.submissions} as s
         where s.form_id = ${schema.forms.id}
      )`.as('submissionsCount'), // workaround for drizzle bug. see https://github.com/drizzle-team/drizzle-orm/issues/4164
      // submissionsCount: db.$count(schema.submission, eq(schema.submission.formId, schema.form.id)).as("submissionsCount"),
    },
  })

  return c.json(success(forms))
})

// Create form
formsApi.post('/', async (c) => {
  const { targetId, id: userId } = c.var.user

  const parsed = formInsertSchema.parse(await c.req.json())
  parsed.userId = targetId ?? userId
  const form = await drizzle(c.env.DB).insert(schema.forms).values(parsed).returning().get()
  return c.json(success(form))
})

// Get form
formsApi.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { targetId } = c.var.user

  const db = drizzle(c.env.DB, { schema })
  const form = await db.query.forms.findFirst({
    with: {
      user: true,
      fields: true,
    },
    where: and(targetId ? eq(schema.forms.userId, targetId) : undefined, eq(schema.forms.id, id)),
    extras: {
      submissionsCount: sql<number>`(
        select count(*)
          from ${schema.submissions} as s
         where s.form_id = ${schema.forms.id}
      )`.as('submissionsCount'), // workaround for drizzle bug. see https://github.com/drizzle-team/drizzle-orm/issues/4164
    },
  })
  return c.json(success(form))
})

// Update form
formsApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const { targetId } = c.var.user
  const parsed = formUpdateExtSchema.parse(await c.req.json())
  parsed.id = undefined

  const updated = await drizzle(c.env.DB)
    .update(schema.forms)
    .set(parsed)
    .where(and(targetId ? eq(schema.forms.userId, targetId) : undefined, eq(schema.forms.id, id)))
    .returning()
    .get()
  return c.json(success(updated))
})

// Delete form
formsApi.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const { targetId } = c.var.user

  const db = drizzle(c.env.DB)

  const form = await db
    .select()
    .from(schema.forms)
    .where(and(targetId ? eq(schema.forms.userId, targetId) : undefined, eq(schema.forms.id, id)))
    .get()
  if (!form) {
    return c.json(error('Form not found'), 404)
  }

  await db.batch([
    db.delete(schema.forms).where(eq(schema.forms.id, id)),
    db.delete(schema.fields).where(eq(schema.fields.formId, id)),
    db.delete(schema.submissions).where(eq(schema.submissions.formId, id)),
  ])
  return c.json({})
})
