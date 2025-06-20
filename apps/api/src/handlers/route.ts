import { Hono } from 'hono'
import { authApi } from './auth'
import { formsApi } from './forms'
import { submissionsApi } from './submissions'
import { usersApi } from './users'
import { submitApi } from './submit'

export const router = new Hono()

router.route('/auth', authApi)
router.route('/forms', formsApi)
router.route('/forms/:id', submissionsApi)
router.route('/users', usersApi)
router.route('/', submitApi)
