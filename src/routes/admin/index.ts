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
adminRoutes.route('/', tenants)
adminRoutes.route('/', users)
adminRoutes.route('/', forms)
adminRoutes.route('/', fields)
adminRoutes.route('/', fieldTypes)
adminRoutes.route('/', submissions)
adminRoutes.route('/analytics', analytics)
