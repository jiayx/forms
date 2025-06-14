import { D1Database } from '@cloudflare/workers-types'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { Context } from 'hono'
import type { DBEnv } from './types'

export type EnvBindings = { DB: D1Database }

export function getDb(c: Context<DBEnv>): PrismaClient {
  const adapter = new PrismaD1(c.env.DB)
  return new PrismaClient({ adapter })
}
