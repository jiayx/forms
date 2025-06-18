import { useQuery, useMutation } from '@/hooks/use-rest'
import type { AdminUserInsert } from '@forms/db/zod'

export const useUser = () => {
  return useQuery<{ user: AdminUserInsert }>('/api/admin/current', undefined, {
    dedupingInterval: 600_000, // 10 秒内只发送一次
  })
}

export const useLogin = () => {
  return useMutation<AdminUserInsert, { accessToken: string; refreshToken: string }>('/api/admin/login', 'POST')
}

export const useLogout = () => {
  return useMutation<{ refreshToken: string }>('/api/admin/logout', 'POST')
}

export const useRefresh = () => {
  return useMutation<{ refreshToken: string }, { accessToken: string }>('/api/admin/refresh', 'POST')
}
