import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { requireLogin, requireAdmin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { adminUsers } from '@forms/db/schema'
import { adminUserInsertSchema, adminUserUpdateSchema } from '@forms/db/zod'
import { eq } from 'drizzle-orm'

export const usersApi = new Hono<AdminEnv>()
usersApi.use(requireLogin, requireAdmin)

// List users
usersApi.get('/', async (c) => {
  const list = await drizzle(c.env.DB).select().from(adminUsers)
  return c.json({ users: list })
})

// Create user
usersApi.post('/', async (c) => {
  const parsed = adminUserInsertSchema.parse(await c.req.json())
  parsed.password = await bcrypt.hash(parsed.password, 10)
  const user = await drizzle(c.env.DB).insert(adminUsers).values(parsed).returning().get()
  return c.json({ user })
})

// Patch user
usersApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = adminUserUpdateSchema.parse(await c.req.json())
  if (parsed.password) parsed.password = await bcrypt.hash(parsed.password, 10)
  const updated = await drizzle(c.env.DB).update(adminUsers).set(parsed).where(eq(adminUsers.id, id)).returning().get()
  return c.json({ user: updated })
})

// Delete user
usersApi.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await drizzle(c.env.DB).delete(adminUsers).where(eq(adminUsers.id, id))
  return c.json({})
})
