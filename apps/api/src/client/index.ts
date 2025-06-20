import { Hono } from 'hono'
import { DBEnv } from '../types'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq } from 'drizzle-orm'
import { FormSelect } from '@forms/db/zod'
import { Resend } from 'resend'

export const apiRoutes = new Hono<DBEnv & { Variables: { form: FormSelect } }>()

// Dynamic CORS (per‑tenant) middleware
apiRoutes.use('/s/:id', async (c, next) => {
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
  const form = c.var.form
  // Basic rate‑limit – demo (real‑world: Durable Objects / Turnstile)
  const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0'
  // TODO: look up KV/do to enforce per‑ip quota

  // Validate payload against dynamic Zod schema
  const data = await c.req.json()
  if (Object.keys(data).length === 0) {
    return c.json({ success: false, message: 'No data' }, 400)
  }

  const fields = Object.keys(data)
  for (const field of fields) {
    if (data[field].length > 10000) {
      return c.json({ success: false, message: 'Data too large' }, 400)
    }
  }

  const db = drizzle(c.env.DB)

  const formFields = await db
    .select({ name: schema.fields.name })
    .from(schema.fields)
    .where(eq(schema.fields.formId, form.id))
    .all()
  const fieldNames = formFields.map((f) => f.name)

  const missingFields = []
  for (const f of fields) {
    if (!fieldNames.includes(f)) {
      missingFields.push({
        formId: form.id,
        name: f,
        type: 'text',
      })
    }
  }

  await db.batch([
    db.insert(schema.submissions).values({
      formId: form.id,
      userId: form.userId,
      ip: ip,
      userAgent: c.req.header('User-Agent') || '-',
      data: data,
    }),
    ...(missingFields.length > 0 ? [db.insert(schema.fields).values(missingFields)] : []),
  ])

  // TODO: Async notify
  // if (form.notifyEmails && form.notifyEmails.length > 0) {
  //   const resend = new Resend(c.env.RESEND_API_KEY)
  //   const { data, error } = await resend.emails.send({
  //     from: 'Acme <onboarding@resend.dev>',
  //     to: form.notifyEmails,
  //     subject: 'hello world',
  //     html: '<strong>it works!</strong>',
  //   })
  //   console.log(data, error)
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
