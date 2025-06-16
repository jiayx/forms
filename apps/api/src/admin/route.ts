import { Hono } from 'hono'
import { tenantApi } from './tenants'
import { auth } from './auth'
import { formsApi } from './forms'
import { fieldApi } from './fieldTemplate'
import { submissionsApi } from './submissions'
import { usersApi } from './users'

export const adminRoutes = new Hono()

adminRoutes.route('/', auth)
adminRoutes.route('/tenants', tenantApi)
adminRoutes.route('/forms', formsApi)
adminRoutes.route('/field-templates', fieldApi)
adminRoutes.route('', submissionsApi)
adminRoutes.route('/users', usersApi)
