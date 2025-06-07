import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const submissions = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// List submissions with search
submissions.get('/forms/:id/submissions', requireAdmin, async c => {
  const id = c.req.param('id')
  const page = parseInt(c.req.query('page') || '1')
  const take = 20
  const skip = (page - 1) * take
  const subject = c.req.query('subject')
  const where: any = { formId: id }
  if (subject) where.data = { path: ['subject'], equals: subject }
  const list = await getDb(c).submission.findMany({ where, take, skip })
  return c.json({ submissions: list })
})

// Detail
submissions.get('/forms/:id/submissions/:sid', requireAdmin, async c => {
  const sid = c.req.param('sid')
  const sub = await getDb(c).submission.findUnique({ where: { id: sid } })
  return c.json({ submission: sub })
})

// Delete
submissions.delete('/submissions/:sid', requireAdmin, async c => {
  const sid = c.req.param('sid')
  await getDb(c).submission.delete({ where: { id: sid } })
  return c.json({})
})
