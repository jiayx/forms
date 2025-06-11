import { Hono } from 'hono'
import { auth } from './auth'
import { tenants } from './tenants'
import { users } from './users'
import { forms } from './forms'
import { fields } from './fields'
import { fieldTypes } from './fieldTypes'
import { submissions } from './submissions'
import { analytics } from './analytics'

export const adminRoutes = new Hono()

adminRoutes.route('/', auth)
adminRoutes.route('/tenants', tenants)
adminRoutes.route('/users', users)
adminRoutes.route('/forms', forms)
adminRoutes.route('/fields', fields)
adminRoutes.route('/field-types', fieldTypes)
adminRoutes.route('/submissions', submissions)
adminRoutes.route('/analytics', analytics)
