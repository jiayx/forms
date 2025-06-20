import type { UserInsert } from '@forms/db/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import type { UserLoginReq } from '@forms/shared/schema/user'

export const useUser = () => {
  return useQuery({
    queryKey: ['users/current'],
    queryFn: () => fetcher<UserInsert>('/api/auth/current'),
  })
}

export const useLogin = () => {
  return useMutation({
    mutationFn: (body: UserLoginReq) =>
      fetcher<{ accessToken: string; refreshToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        anonymous: true,
      }),
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: () =>
      fetcher('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
      }),
  })
}

export const useRefresh = () => {
  return useMutation({
    mutationFn: () =>
      fetcher<{ accessToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
        anonymous: true,
      }),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken)
    },
  })
}
