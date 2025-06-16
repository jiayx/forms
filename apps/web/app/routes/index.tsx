import { redirect } from 'react-router'

export function clientLoader() {
  return redirect('/tenants')
}

export default () => null
