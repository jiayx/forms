import { Context, Hono } from 'hono'
import { requireLogin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq, and, like, desc } from 'drizzle-orm'
import { FormSelect } from '@forms/db/zod'
import { success, error } from '@forms/shared/schema'
import type { Pagination } from '@forms/shared/schema'

export const submissionsApi = new Hono<AdminEnv>()
submissionsApi.use(requireLogin)

const formMiddleware = async (c: Context<AdminEnv & { Variables: { form: FormSelect } }>, next: () => any) => {
  const formId = c.req.param('id')
  if (!formId) {
    return c.json(error('Missing form ID'), 400)
  }
  const form = await drizzle(c.env.DB).select().from(schema.forms).where(eq(schema.forms.id, formId)).get()
  if (!form) {
    return c.json(error('Unknown form'), 404)
  }
  c.set('form', form)

  if (c.var.user.role !== 'admin' && form.userId !== c.var.user.targetId) {
    return c.json(error('Forbidden'), 403)
  }
  await next()
}

submissionsApi.get('/submissions', formMiddleware, async (c) => {
  const form = c.var.form

  const page = parseInt(c.req.query('page') || '1')
  const pageSize = parseInt(c.req.query('pageSize') || '20')
  const offset = ((page < 1 ? 1 : page) - 1) * pageSize

  const keyword = c.req.query('keyword') || ''

  const where = and(
    eq(schema.submissions.formId, form.id),
    keyword ? like(schema.submissions.data, `%${keyword}%`) : undefined
  )
  const submissions = await drizzle(c.env.DB, { schema }).query.submissions.findMany({
    with: {
      form: true,
    },
    where,
    limit: pageSize,
    offset,
    orderBy: [desc(schema.submissions.createdAt)],
  })

  const total = await drizzle(c.env.DB).$count(schema.submissions, where)

  return c.json(
    success({
      list: submissions,
      pagination: { page, pageSize, total } as Pagination,
    })
  )
})

// Detail
submissionsApi.get('/submissions/:sid', formMiddleware, async (c) => {
  const sid = c.req.param('sid')
  const form = c.get('form') as FormSelect
  const sub = await drizzle(c.env.DB, { schema }).query.submissions.findFirst({
    with: {
      form: true,
      user: true,
    },
    where: and(eq(schema.submissions.id, sid), eq(schema.submissions.formId, form.id)),
  })

  return c.json(success(sub))
})

// Delete
submissionsApi.delete('/submissions/:sid', formMiddleware, async (c) => {
  const sid = c.req.param('sid')
  const form = c.get('form') as FormSelect
  await drizzle(c.env.DB)
    .delete(schema.submissions)
    .where(and(eq(schema.submissions.id, sid), eq(schema.submissions.formId, form.id)))
  return c.json(success())
})
