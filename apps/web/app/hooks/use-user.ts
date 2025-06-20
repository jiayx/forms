import type { UserExt } from '@forms/db/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { useImpersonateId } from '@/hooks/use-impersonate'
import type { UserInsertReq, UserUpdateReq } from '@forms/shared/schema/user'

export const USERS_KEY = ['users'] as const

export const useUsers = () => {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => fetcher<UserExt[]>('/api/users'),
    initialData: [],
  })
}

export const useCreateUser = () => {
  return useMutation({
    mutationFn: (body: UserInsertReq) =>
      fetcher<UserExt>('/api/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UserUpdateReq }) =>
      fetcher<UserExt>('/api/users/' + id, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  })
}

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: string) => fetcher('/api/users/' + id, { method: 'DELETE' }),
  })
}

export function useImpersonateUser() {
  const { data: impersonateId } = useImpersonateId()
  const { data: users } = useUsers()
  return users?.find((t) => t.id === impersonateId)
}
