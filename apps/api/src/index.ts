import { Hono } from 'hono'
import { router } from './handlers/route'
import { ZodError } from 'zod/v4'
import { error } from '@forms/shared/schema'

const app = new Hono()

app.use(async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  c.res.headers.set('X-Response-Time', `${end - start}`)
})

app.onError((err, c) => {
  console.error('Uncaught error:', err)
  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    return c.json(error(formatted), 400)
  }
  return c.json(error(err instanceof Error ? err.message : 'Unknown error'), 500)
})

app.route('/api', router)

export default app
