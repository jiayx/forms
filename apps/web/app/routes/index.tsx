import { redirect } from 'react-router'

export function clientLoader() {
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) {
    return redirect('/login')
  }
  return redirect('/forms')
}

export default () => null
