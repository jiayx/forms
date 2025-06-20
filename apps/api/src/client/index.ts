import { Hono } from 'hono'
import { DBEnv } from '../types'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq } from 'drizzle-orm'
import { FormSelect } from '@forms/db/zod'

export const apiRoutes = new Hono<DBEnv & { Variables: { form: FormSelect } }>()

// Dynamic CORS (per‑tenant) middleware
apiRoutes.use('/forms/:id/submit', async (c, next) => {
  const id = c.req.param('id') as string
  const form = await drizzle(c.env.DB).select().from(schema.forms).where(eq(schema.forms.id, id)).get()
  if (!form) {
    return c.json({ success: false, message: 'Unknown form or invalid key' }, 400)
  }
  c.set('form', form)

  const origin = c.req.header('Origin') as string
  if (form.allowedOrigins && form.allowedOrigins.length > 0) {
    const allowed = form.allowedOrigins.find((o) => o.trim() === origin.trim()) !== undefined
    if (!allowed) {
      return c.json({ success: false, message: 'Forbidden' }, 403)
    }
  }

  return cors({
    origin: origin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
  })(c, next)
})

// POST /s/:id  id is form id
apiRoutes.post('/s/:id', async (c) => {
  const id = c.req.param('id')
  const form = c.var.form
  if (!form) {
    return c.json({ success: false, message: 'Unknown form ' + id }, 400)
  }

  // Basic rate‑limit – demo (real‑world: Durable Objects / Turnstile)
  const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0'
  // TODO: look up KV/do to enforce per‑ip quota

  // Validate payload against dynamic Zod schema
  const data = await c.req.json()
  // const validator = buildValidator(form.fields)
  // const parsed = validator.safeParse(body)
  // if (!parsed.success) {
  //   return c.json({ success: false, message: 'Validation failed', details: parsed.error.format() }, 400)
  // }

  await drizzle(c.env.DB)
    .insert(schema.submissions)
    .values({
      formId: form.id,
      userId: form.userId,
      ip: ip,
      userAgent: c.req.header('User-Agent') || '-',
      data: data,
    })

  // TODO Async notify (very simplified – fire‑and‑forget fetch)
  // if (ctx.notify_emails) {
  //   const url = 'https://api.your‑mailer.com/send' // placeholder
  //   fetch(url, {
  //     method: 'POST',
  //     body: JSON.stringify({ to: ctx.notify_emails.split(','), payload: body }),
  //     headers: { 'Content-Type': 'application/json' },
  //   }).catch(() => {})
  // }

  return c.json({ success: true }, 201)
})

// GET /api/forms/:id – expose field meta to FE
apiRoutes.get('/f/:id', async (c) => {
  const id = c.req.param('id') as string
  const form = await drizzle(c.env.DB, { schema }).query.forms.findFirst({
    with: {
      fields: true,
    },
    where: eq(schema.forms.id, id),
  })
  if (!form) {
    return c.json({ success: false, message: 'Unknown form' }, 400)
  }
  return c.json({ success: true, form })
})
