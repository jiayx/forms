import { Hono } from 'hono'
import { getDb, EnvBindings } from '../../db'
import { requireAdmin } from './middleware'

export const analytics = new Hono<{ Bindings: EnvBindings & { JWT_SECRET: string }; Variables: { user: any } }>()

// Subject counts per form
analytics.get('/forms/:id/subject-counts', requireAdmin, async c => {
  const id = c.req.param('id')
  const rows = await getDb(c).submission.groupBy({
    by: ['data'],
    where: { formId: id },
    _count: { _all: true }
  })
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const subject = (r as any).data.subject
    counts[subject] = r._count._all
  }
  return c.json(counts)
})

// Tenant daily counts
analytics.get('/tenant/:tid/daily', requireAdmin, async c => {
  const tid = c.req.param('tid')
  const rows = await getDb(c).submission.groupBy({
    by: ['createdAt'],
    where: { form: { tenantId: tid } },
    _count: { _all: true }
  })
  const result = rows.map(r => ({ date: r.createdAt, count: r._count._all }))
  return c.json({ daily: result })
})
