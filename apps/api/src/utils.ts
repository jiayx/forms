import type { Context } from 'hono'
import type { AdminEnv } from './types'
import { z, ZodObject, ZodRawShape } from 'zod/v4'
import type { FieldSelect } from '@forms/db/zod'

export function getTenantId(c: Context<AdminEnv>): string | undefined {
  const tenantId = c.get('user')?.tenantId
  const tenantIdFromQuery = c.req.query('tenantId')
  return tenantId || tenantIdFromQuery
}

export function buildValidator(fields: FieldSelect[]): ZodObject<ZodRawShape> {
  const shape = {} as { [key: string]: z.ZodTypeAny }
  for (const f of fields) {
    let schema: z.ZodTypeAny = (() => {
      switch (f.type) {
        case 'email':
          return z.email()
        case 'number':
          return z.coerce.number()
        case 'textarea':
        case 'text':
          return z.string()
        case 'select': {
          return z.enum(f.options as [string, ...string[]])
        }
        default:
          return z.any()
      }
    })()
    if (!f.required) {
      schema = schema.optional()
    }
    if (f.validationRegex) {
      const regex = new RegExp(f.validationRegex)
      schema = schema.refine((val: any) => {
        return regex.test(val)
      })
    }
    shape[f.name] = schema
  }
  return z.object(shape)
}
