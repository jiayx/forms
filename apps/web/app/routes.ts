import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  index('routes/index.tsx'),
  route('login', 'routes/login.tsx'),

  layout('routes/layout.tsx', [
    route('forms', 'routes/forms/list.tsx'),
    route('forms/:id', 'routes/forms/edit.tsx'),
    route('forms/new', 'routes/forms/new.tsx'),

    route('forms/:formId/submissions', 'routes/submissions/list.tsx'),
    route('forms/:formId/submissions/:id', 'routes/submissions/detail.tsx'),

    route('users', 'routes/users/page.tsx'),
  ]),
] satisfies RouteConfig
