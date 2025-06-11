import { Hono } from 'hono'
import { adminRoutes } from './routes/admin'
import { apiRoutes } from './routes/api'

const app = new Hono()

apiRoutes.use(async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  c.res.headers.set('X-Response-Time', `${end - start}`)
})

app.route('/api', apiRoutes)

app.route('/admin', adminRoutes)

export default app
