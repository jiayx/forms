import { type Context, Hono } from 'hono'
import { getDb } from '../../db'
import { requireLogin } from './middleware'
import type { AdminEnv } from '../../types'
import { type Prisma } from '@prisma/client'

export const submissions = new Hono<AdminEnv>()
submissions.use(requireLogin)

submissions.use(async (c, next) => {
  const formId = c.req.param('id')
  const form = await getDb(c).form.findUnique({ where: { id: formId } })
  if (!form) {
    return c.json({ error: 'Unknown form' }, 404)
  }
  const user = c.get('user')
  if (user.tenantId != null && user.tenantId !== form.tenantId) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})

// List submissions with search
submissions.get('/forms/:id/submissions', async c => {
  const id = c.req.param('id')
  const page = parseInt(c.req.query('page') || '1')
  const take = 20
  const skip = (page - 1) * take
  const subject = c.req.query('subject')
  const where: Prisma.SubmissionWhereInput = { formId: id }
  if (subject) where.data = { path: 'subject', equals: subject }
  const list = await getDb(c).submission.findMany({ where, take, skip })
  return c.json({ submissions: list })
})

// Detail
submissions.get('/forms/:id/submissions/:sid', async c => {
  const sid = c.req.param('sid')
  const sub = await getDb(c).submission.findUnique({ where: { id: sid } })
  return c.json({ submission: sub })
})

// Delete
submissions.delete('/forms/:id/submissions/:sid', async c => {
  const sid = c.req.param('sid')
  await getDb(c).submission.delete({ where: { id: sid } })
  return c.json({})
})
