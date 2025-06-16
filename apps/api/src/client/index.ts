import { type Context, Hono } from 'hono'
import { buildValidator } from '../utils'
import { DBEnv } from '../types'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@forms/db/schema'
import { eq } from 'drizzle-orm'

export const apiRoutes = new Hono<DBEnv>()

// Dynamic CORS (per‑tenant) middleware
apiRoutes.use(async (c, next) => {
  const origin = c.req.header('Origin')

  let allowed = false
  if (origin) {
    const tenant = await getTenant(c)
    allowed = tenant?.allowedOrigins.find((o) => o.trim() === origin.trim()) !== undefined
  }

  return cors({
    origin: (origin: string) => (allowed ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-API-Key'],
    credentials: true,
  })(c, next)
})

// POST /forms/:id/submit  – main endpoint
apiRoutes.post('/forms/:id/submit', async (c) => {
  const id = c.req.param('id')
  const apiKey = c.req.header('X-API-Key')
  if (!id || !apiKey) {
    return c.json({ error: 'Missing id or API key' }, 400)
  }

  // Basic rate‑limit – demo (real‑world: Durable Objects / Turnstile)
  const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0'
  // TODO: look up KV/do to enforce per‑ip quota

  const form = await getForm(c, id, apiKey)
  if (!form) {
    return c.json({ error: 'Unknown form or invalid key' }, 400)
  }

  // Validate payload against dynamic Zod schema
  const body = await c.req.json()
  const validator = buildValidator(form.fields)
  const parsed = validator.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.format() }, 400)
  }

  await drizzle(c.env.DB)
    .insert(schema.submissions)
    .values({
      formId: form.id,
      ip: ip,
      userAgent: c.req.header('User-Agent') || '-',
      data: parsed.data,
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

  return c.json({}, 201)
})

// GET /api/forms/:id – expose field meta to FE
apiRoutes.get('/forms/:id', async (c) => {
  const form = await getForm(c, c.req.param('id') || '', c.req.header('X-API-Key') || '')
  if (!form) {
    return c.json({ error: 'Unknown form or invalid key' }, 400)
  }
  return c.json({ form })
})

async function getTenant(c: Context<DBEnv>) {
  const apiKey = c.req.header('X-API-Key') || ''
  if (!apiKey) {
    return null
  }
  return await drizzle(c.env.DB).select().from(schema.tenants).where(eq(schema.tenants.apiKey, apiKey)).get()
}

async function getForm(c: Context<DBEnv>, id: string, apiKey: string) {
  if (!id || !apiKey) {
    return null
  }
  return await drizzle(c.env.DB, { schema }).query.forms.findFirst({
    with: {
      fields: true,
      tenant: true,
    },
    where: eq(schema.forms.id, id),
  })
}
