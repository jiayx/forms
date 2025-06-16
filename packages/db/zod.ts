import { z } from 'zod/v4'
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { tenants, forms, fields, submissions, fieldTemplates, adminUsers, adminRefreshTokens } from './schema'

export const tenantSelectSchema = createSelectSchema(tenants)
export const tenantInsertSchema = createInsertSchema(tenants)
export const tenantUpdateSchema = createUpdateSchema(tenants)
export type TenantSelect = z.infer<typeof tenantSelectSchema>
export type TenantInsert = z.infer<typeof tenantInsertSchema>
export type TenantUpdate = z.infer<typeof tenantUpdateSchema>

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

export const fieldTemplateSelectSchema = createSelectSchema(fieldTemplates)
export const fieldTemplateInsertSchema = createInsertSchema(fieldTemplates)
export const fieldTemplateUpdateSchema = createUpdateSchema(fieldTemplates)
export type FieldTemplateSelect = z.infer<typeof fieldTemplateSelectSchema>
export type FieldTemplateInsert = z.infer<typeof fieldTemplateInsertSchema>
export type FieldTemplateUpdate = z.infer<typeof fieldTemplateUpdateSchema>

export const adminUserSelectSchema = createSelectSchema(adminUsers)
export const adminUserInsertSchema = createInsertSchema(adminUsers)
export const adminUserUpdateSchema = createUpdateSchema(adminUsers)
export type AdminUserSelect = z.infer<typeof adminUserSelectSchema>
export type AdminUserInsert = z.infer<typeof adminUserInsertSchema>
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>

export const adminRefreshTokenSelectSchema = createSelectSchema(adminRefreshTokens)
export const adminRefreshTokenInsertSchema = createInsertSchema(adminRefreshTokens)
export const adminRefreshTokenUpdateSchema = createUpdateSchema(adminRefreshTokens)

export type AdminRefreshTokenSelect = z.infer<typeof adminRefreshTokenSelectSchema>
export type AdminRefreshTokenInsert = z.infer<typeof adminRefreshTokenInsertSchema>
export type AdminRefreshTokenUpdate = z.infer<typeof adminRefreshTokenUpdateSchema>

// complex schemas
export const formSelectExtSchema = formSelectSchema.extend({
  fields: z.array(fieldSelectSchema),
  submissionsCount: z.number(),
  tenant: tenantSelectSchema,
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

export const tenantExtSchema = tenantSelectSchema.extend({
  forms: z.array(formSelectSchema),
  submissionsCount: z.number(),
})
export type TenantExt = z.infer<typeof tenantExtSchema>

export const formExtSchema = formSelectSchema.extend({
  tenant: tenantSelectSchema,
  fields: z.array(fieldSelectSchema),
  submissionsCount: z.number(),
})
export type FormExt = z.infer<typeof formExtSchema>
