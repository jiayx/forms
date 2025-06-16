import { Context, Hono } from 'hono'
import { requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq, and } from 'drizzle-orm'
import { getTenantId } from '../utils'
import { FormSelect } from '@forms/db/zod'

export const submissionsApi = new Hono<AdminEnv>()
submissionsApi.use(requireLogin)

const formMiddleware = async (c: Context<AdminEnv>, next: () => any) => {
  const formId = c.req.param('id')
  if (!formId) {
    return c.json({ error: 'Missing form ID' }, 400)
  }
  const form = await drizzle(c.env.DB).select().from(schema.forms).where(eq(schema.forms.id, formId)).get()
  if (!form) {
    return c.json({ error: 'Unknown form' }, 404)
  }
  c.set('form', form)

  const tenantId = getTenantId(c)
  if (tenantId != null && tenantId !== form.tenantId) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
}

submissionsApi.get('/forms/:id/submissions', formMiddleware, async (c) => {
  const form = c.get('form') as FormSelect

  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('pageSize') || '20')
  const offset = ((page < 1 ? 1 : page) - 1) * limit

  const keyword = c.req.query('keyword') || ''

  const submissions = await drizzle(c.env.DB, { schema }).query.submissions.findMany({
    with: {
      form: true,
    },
    where: and(eq(schema.submissions.formId, form.id), keyword ? eq(schema.submissions.data, keyword) : undefined),
    limit,
    offset,
  })

  const total = await drizzle(c.env.DB).$count(schema.submissions, eq(schema.submissions.formId, form.id))

  return c.json({ submissions, total })
})

// Detail
submissionsApi.get('/forms/:id/submissions/:sid', formMiddleware, async (c) => {
  const sid = c.req.param('sid')
  const form = c.get('form') as FormSelect
  const sub = await drizzle(c.env.DB, { schema }).query.submissions.findFirst({
    with: {
      form: true,
    },
    where: and(eq(schema.submissions.id, sid), eq(schema.submissions.formId, form.id)),
  })

  return c.json({ submission: sub })
})

// Delete
submissionsApi.delete('/forms/:id/submissions/:sid', formMiddleware, async (c) => {
  const sid = c.req.param('sid')
  const form = c.get('form') as FormSelect
  await drizzle(c.env.DB)
    .delete(schema.submissions)
    .where(and(eq(schema.submissions.id, sid), eq(schema.submissions.formId, form.id)))
  return c.json({})
})
