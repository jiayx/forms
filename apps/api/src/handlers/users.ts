import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { requireLogin, requireAdmin } from '../middleware'
import type { AdminEnv } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '@forms/db/schema'
import { userInsertSchemaExt, userUpdateSchemaExt } from '@forms/shared/schema/user'
import { eq } from 'drizzle-orm'
import { success } from '@forms/shared/schema'

export const usersApi = new Hono<AdminEnv>()
usersApi.use(requireLogin, requireAdmin)

// List users
usersApi.get('/', async (c) => {
  const list = await drizzle(c.env.DB).select().from(users)
  return c.json(success(list))
})

// Create user
usersApi.post('/', async (c) => {
  const parsed = userInsertSchemaExt.parse(await c.req.json())
  const passwordHash = await bcrypt.hash(parsed.password, 10)
  const user = await drizzle(c.env.DB)
    .insert(users)
    .values({
      ...parsed,
      passwordHash,
    })
    .returning()
    .get()
  return c.json(success(user))
})

// Patch user
usersApi.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = userUpdateSchemaExt.parse(await c.req.json())

  const updated = await drizzle(c.env.DB)
    .update(users)
    .set({
      ...parsed,
      ...(parsed.password ? { passwordHash: await bcrypt.hash(parsed.password, 10) } : {}),
    })
    .where(eq(users.id, id))
    .returning()
    .get()
  return c.json(success(updated))
})

// Delete user
usersApi.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await drizzle(c.env.DB).delete(users).where(eq(users.id, id))
  return c.json(success())
})
