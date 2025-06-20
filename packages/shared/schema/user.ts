import z from 'zod/v4'
import { userInsertSchema, userUpdateSchema } from '@forms/db/zod'

export const userLoginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
})
export type UserLoginReq = z.infer<typeof userLoginSchema>

export const userInsertSchemaExt = userInsertSchema
  .omit({
    passwordHash: true,
  })
  .extend({
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  })

export type UserInsertReq = z.infer<typeof userInsertSchemaExt>

export const userUpdateSchemaExt = userUpdateSchema
  .omit({
    passwordHash: true,
  })
  .extend({
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }).optional(),
  })

export type UserUpdateReq = z.infer<typeof userUpdateSchemaExt>
