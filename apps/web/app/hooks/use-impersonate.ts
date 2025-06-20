import { queryClient } from '@/lib/query-client'
import { useQuery } from '@tanstack/react-query'
import { FORMS_KEY } from '@/hooks/use-form'

export const IMP_KEY = ['impersonateUser'] as const
export const ALL_USER = 'ALL'

export const useImpersonateId = () => {
  return useQuery({
    queryKey: IMP_KEY,
    queryFn: () => localStorage.getItem('impersonateId'),
    initialData: localStorage.getItem('impersonateId'),
    staleTime: Infinity,
  })
}

export const getImpersonateId = () => queryClient.getQueryData<string>(IMP_KEY)

export const setImpersonateId = (uid: string) => {
  console.log('setImpersonateId', uid)

  const impersonateId = uid === ALL_USER ? '' : uid

  localStorage.setItem('impersonateId', impersonateId)
  queryClient.setQueryData(IMP_KEY, impersonateId)

  queryClient.invalidateQueries({ queryKey: FORMS_KEY, exact: true })
}
