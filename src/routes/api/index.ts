import { type Context, Hono } from "hono"
import { buildValidator } from "../../utils/validate"
import { getDb } from "../../db"
import { DBEnv } from "../../types"
import { cors } from "hono/cors"

export const apiRoutes = new Hono()

// Dynamic CORS (per‑tenant) middleware
apiRoutes.use(async (c, next) => {
  const origin = c.req.header('Origin')

  let allowed = false
  if (origin) {
    const tenant = await getTenant(c)
    allowed = tenant?.allowedOrigins.split(',').find(o => o.trim() === origin.trim()) !== undefined
  }

  return cors({
    origin: (origin: string) => allowed ? origin : '',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-API-Key'],
    credentials: true,
  })(c, next)
})

// POST /forms/:slug/submit  – main endpoint
apiRoutes.post('/forms/:slug/submit', async c => {
    const slug = c.req.param('slug')
    const apiKey = c.req.header('X-API-Key')
    if (!slug || !apiKey) {
      return c.json({ error: 'Missing slug or API key' }, 400)
    }
  
    // Basic rate‑limit – demo (real‑world: Durable Objects / Turnstile)
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0'
    // TODO: look up KV/do to enforce per‑ip quota
  
    const form = await getForm(c, slug, apiKey)
    if (!form) {
      return c.json({ error: 'Unknown form or invalid key' }, 404)
    }
  
    // Validate payload against dynamic Zod schema
    const body = await c.req.json()
    const schema = buildValidator(form.fields)
    const parse = schema.safeParse(body)
    if (!parse.success) {
      return c.json({ error: 'Validation failed', details: parse.error.format() }, 400)
    }
  
    // 仅记录 form 中存在的字段
    const data = {} as Record<string, any>
    for (const field of form.fields) {
      data[field.name] = body[field.name]
    }
  
    await getDb(c).submission.create({
      data: {
        formId: form.id,
        ip: ip,
        userAgent: c.req.header('User-Agent') || '-',
        data: data,
      },
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

// GET /api/forms/:slug – expose field meta to FE
apiRoutes.get('/forms/:slug', async c => {
  const form = await getForm(c, c.req.param('slug') || '', c.req.header('X-API-Key') || '')
  if (!form) {
    return c.json({ error: 'Unknown form or invalid key' }, 404)
  }
  return c.json({ form })
})

async function getTenant(c: Context<DBEnv>) {
  const apiKey = c.req.header('X-API-Key') || ''
  if (!apiKey) {
      return null
  }
  return await getDb(c).tenant.findUnique({
      where: {
      apiKey: apiKey,
      },
  })
}

async function getForm(c: Context<DBEnv>, slug: string, apiKey: string) {
  if (!slug || !apiKey) {
    return null
  }
  return await getDb(c).form.findFirst({
    where: {
      slug: slug,
      tenant: {
        apiKey: apiKey,
      },
    },
    include: {
      tenant: true,
      fields: true,
    },
  })
}
  