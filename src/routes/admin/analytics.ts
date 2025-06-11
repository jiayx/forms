import { Hono } from 'hono'
import { getDb } from '../../db'
import { requireLogin } from './middleware'
import type { AdminEnv } from '../../types'

export const analytics = new Hono<AdminEnv>()

// Subject counts per form
analytics.get('/forms/:id/subject-counts', requireLogin, async c => {
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
analytics.get('/tenant/:tid/daily', requireLogin, async c => {
  const tid = c.req.param('tid')
  const rows = await getDb(c).submission.groupBy({
    by: ['createdAt'],
    where: { form: { tenantId: tid } },
    _count: { _all: true }
  })
  const result = rows.map(r => ({ date: r.createdAt, count: r._count._all }))
  return c.json({ daily: result })
})
