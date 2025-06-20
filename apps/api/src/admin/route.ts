import { Hono } from 'hono'
import { auth } from './auth'
import { formsApi } from './forms'
import { submissionsApi } from './submissions'
import { usersApi } from './users'

export const adminRoutes = new Hono()

adminRoutes.route('/auth', auth)
adminRoutes.route('/forms', formsApi)
adminRoutes.route('/forms/:id', submissionsApi)
adminRoutes.route('/users', usersApi)
