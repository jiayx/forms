import { useQuery, useMutation } from '@/hooks/use-rest'
import type { AdminUserInsert } from '@forms/db/zod'

export const useUser = () => {
  return useQuery<{ user: AdminUserInsert }>('/admin/current', undefined, {
    dedupingInterval: 600_000, // 10 秒内只发送一次
  })
}

export const useLogin = () => {
  return useMutation<AdminUserInsert, { accessToken: string; refreshToken: string }>('/admin/login', 'POST')
}

export const useLogout = () => {
  return useMutation<{ refreshToken: string }>('/admin/logout', 'POST')
}

export const useRefresh = () => {
  return useMutation<{ refreshToken: string }, { accessToken: string }>('/admin/refresh', 'POST')
}
