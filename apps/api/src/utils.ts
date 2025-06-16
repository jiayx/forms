import type { Context } from 'hono'
import type { AdminEnv } from './types'

export function getTenantId(c: Context<AdminEnv>): string | undefined {
  const tenantId = c.get('user')?.tenantId
  const tenantIdFromQuery = c.req.query('tenantId')
  return tenantId || tenantIdFromQuery
}
