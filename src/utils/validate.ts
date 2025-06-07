import { z, ZodObject, ZodRawShape } from "zod/v4"
import { Field } from "@prisma/client"

export function buildValidator(fields: Field[]): ZodObject<ZodRawShape> {
  const shape = {} as { [key: string]: z.ZodTypeAny }
  for (const f of fields) {
    let schema: z.ZodTypeAny = (() => {
      switch (f.type) {
        case "email":    return z.email()
        case 'number':   return z.coerce.number()
        case "textarea":
        case "text":     return z.string()
        case "select": {
          const values = (f.options as { value: string }[]).map(o => o.value)
          return z.enum(values as [string, ...string[]])
        }
        default:         return z.any()
      }
    })()
    if (!f.required) {
      schema = schema.optional()
    }
    if (f.validationRegex) {
      const regex = new RegExp(f.validationRegex)
      schema = schema.refine((val : any) => {
        return regex.test(val)
      })
    }
    shape[f.name] = schema
  }
  return z.object(shape)
}
