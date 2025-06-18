import { sql, relations } from 'drizzle-orm'
import { integer, index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { v4 as uuidv4 } from 'uuid'

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey().notNull().$default(() => uuidv4()),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  apiKey: text('api_key').notNull().unique().default(''),
  allowedOrigins: text('allowed_origins', { mode: 'json' }).$type<string[]>().notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
})

export const forms = sqliteTable('forms', {
    id: text('id').primaryKey().notNull().$default(() => uuidv4()),
    tenantId: text('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    notifyEmails: text('notify_emails', { mode: 'json' }).$type<string[]>().notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
  },
  (form) => [unique('unique_tenant_slug').on(form.tenantId, form.slug)]
)

export const fields = sqliteTable('fields', {
    id: text('id').primaryKey().notNull().$default(() => uuidv4()),
    formId: text('form_id').notNull(),
    name: text('name').notNull(),
    label: text('label').notNull(),
    type: text('type').notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    options: text('options', { mode: 'json' }).$type<string[]>(),
    placeholder: text('placeholder'),
    order: integer('order').notNull(),
    validationRegex: text('validation_regex'),
    templateId: text('template_id'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
  },
  (field) => [index('idx_field_form_id').on(field.formId)]
)

export const submissions = sqliteTable('submissions', {
    id: text('id').primaryKey().notNull().$default(() => uuidv4()),
    formId: text('form_id').notNull(),
    ip: text('ip').notNull(),
    userAgent: text('user_agent'),
    data: text('data', { mode: 'json' }).$type<Record<string, any>>().notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (submission) => [index('idx_submission_form_id').on(submission.formId)]
)

export const fieldTemplates = sqliteTable('field_templates', {
  id: text('id').primaryKey().notNull().$default(() => uuidv4()),
  name: text('name').notNull(),
  label: text('label').notNull(),
  type: text('type', { enum: ['text', 'email', 'number', 'select', 'textarea', 'checkbox', 'radio'] }).notNull(),
  options: text('options', { mode: 'json' }).$type<string[]>(),
  placeholder: text('placeholder'),
  validationRegex: text('validation_regex'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
})

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey().notNull().$default(() => uuidv4()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  tenantId: text('tenant_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text('last_login_at'),
})

export const adminRefreshTokens = sqliteTable('admin_refresh_tokens', {
  id: text('id').primaryKey().notNull().$default(() => uuidv4()),
  userId: text('user_id').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// relations

export const tenantRelations = relations(tenants, ({ many }) => ({
  forms: many(forms),
}))

export const formRelations = relations(forms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [forms.tenantId],
    references: [tenants.id],
  }),
  fields: many(fields),
  submissions: many(submissions),
}))

export const fieldRelations = relations(fields, ({ one }) => ({
  form: one(forms, {
    fields: [fields.formId],
    references: [forms.id],
  }),
}))

export const submissionRelations = relations(submissions, ({ one }) => ({
  form: one(forms, {
    fields: [submissions.formId],
    references: [forms.id],
  }),
}))
