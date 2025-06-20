import { z } from 'zod/v4'
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { users, forms, fields, submissions, userRefreshTokens } from './schema'

export const userSelectSchema = createSelectSchema(users)
export const userInsertSchema = createInsertSchema(users)
export const userUpdateSchema = createUpdateSchema(users)
export type UserSelect = z.infer<typeof userSelectSchema>
export type UserInsert = z.infer<typeof userInsertSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>

export const formSelectSchema = createSelectSchema(forms)
export const formInsertSchema = createInsertSchema(forms)
export const formUpdateSchema = createUpdateSchema(forms)
export type FormSelect = z.infer<typeof formSelectSchema>
export type FormInsert = z.infer<typeof formInsertSchema>
export type FormUpdate = z.infer<typeof formUpdateSchema>

export const fieldSelectSchema = createSelectSchema(fields)
export const fieldInsertSchema = createInsertSchema(fields)
export const fieldUpdateSchema = createUpdateSchema(fields)
export type FieldSelect = z.infer<typeof fieldSelectSchema>
export type FieldInsert = z.infer<typeof fieldInsertSchema>
export type FieldUpdate = z.infer<typeof fieldUpdateSchema>

export const submissionSelectSchema = createSelectSchema(submissions)
export const submissionInsertSchema = createInsertSchema(submissions)
export const submissionUpdateSchema = createUpdateSchema(submissions)
export type SubmissionSelect = z.infer<typeof submissionSelectSchema>
export type SubmissionInsert = z.infer<typeof submissionInsertSchema>
export type SubmissionUpdate = z.infer<typeof submissionUpdateSchema>

export const userRefreshTokenSelectSchema = createSelectSchema(userRefreshTokens)
export const userRefreshTokenInsertSchema = createInsertSchema(userRefreshTokens)
export const userRefreshTokenUpdateSchema = createUpdateSchema(userRefreshTokens)
export type UserRefreshTokenSelect = z.infer<typeof userRefreshTokenSelectSchema>
export type UserRefreshTokenInsert = z.infer<typeof userRefreshTokenInsertSchema>
export type UserRefreshTokenUpdate = z.infer<typeof userRefreshTokenUpdateSchema>

// complex schemas
export const formSelectExtSchema = formSelectSchema.extend({
  fields: z.array(fieldSelectSchema),
  submissionsCount: z.number(),
  user: userSelectSchema,
})
export type FormSelectExt = z.infer<typeof formSelectExtSchema>

export const formInsertExtSchema = formInsertSchema.extend({
  fields: z.array(fieldInsertSchema),
})
export type FormInsertExt = z.infer<typeof formInsertExtSchema>

export const formUpdateExtSchema = formUpdateSchema.extend({
  fields: z.array(fieldInsertSchema),
})
export type FormUpdateExt = z.infer<typeof formUpdateExtSchema>

export const userExtSchema = userSelectSchema.extend({
  forms: z.array(formSelectSchema),
  submissionsCount: z.number(),
})
export type UserExt = z.infer<typeof userExtSchema>

export const formExtSchema = formSelectSchema.extend({
  user: userSelectSchema,
  fields: z.array(fieldSelectSchema),
  submissionsCount: z.number(),
})
export type FormExt = z.infer<typeof formExtSchema>

export const submissionExtSchema = submissionSelectSchema.extend({
  form: formSelectSchema,
  user: userSelectSchema,
})
export type SubmissionExt = z.infer<typeof submissionExtSchema>
