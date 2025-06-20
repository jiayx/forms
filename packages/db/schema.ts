import { sql, relations } from 'drizzle-orm'
import { integer, index, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { nanoid } from '@forms/shared'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().notNull().$default(() => nanoid()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
})

export const userRefreshTokens = sqliteTable('user_refresh_tokens', {
  id: text('id').primaryKey().notNull().$default(() => nanoid()),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (token) => [index('idx_user_refresh_token_user_id').on(token.userId, token.expiresAt)])

export const forms = sqliteTable('forms', {
    id: text('id').primaryKey().notNull().$default(() => nanoid()),
    userId: text('user_id').notNull().references(() => users.id).default(""),
    name: text('name').notNull(),
    description: text('description'),
    allowedOrigins: text('allowed_origins', { mode: 'json' }).$type<string[]>(),
    notifyEmails: text('notify_emails', { mode: 'json' }).$type<string[]>().notNull().default([]),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
  },
  (form) => [index('idx_form_user_id').on(form.userId, form.createdAt)]
)

export const fields = sqliteTable('fields', {
    id: text('id').primaryKey().notNull().$default(() => nanoid()),
    formId: text('form_id').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    options: text('options', { mode: 'json' }).$type<string[]>(),
    validationRegex: text('validation_regex'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
  },
  (field) => [index('idx_field_form_id').on(field.formId)]
)

export const submissions = sqliteTable('submissions', {
    id: text('id').primaryKey().notNull().$default(() => nanoid()),
    userId: text('user_id').notNull().references(() => users.id),
    formId: text('form_id').notNull().references(() => forms.id),
    ip: text('ip').notNull(),
    userAgent: text('user_agent'),
    data: text('data', { mode: 'json' }).$type<Record<string, any>>().notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date().toISOString()),
  },
  (submission) => [index('idx_submission_user_id').on(submission.userId, submission.formId)]
)

// relations

export const userRelations = relations(users, ({ many }) => ({
  forms: many(forms),
}))

export const formRelations = relations(forms, ({ one, many }) => ({
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
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
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}))
