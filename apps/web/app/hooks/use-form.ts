import type { FormExt } from '@forms/db/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import type { FormInsertExt, FormUpdateExt } from '@forms/db/zod'

export const FORMS_KEY = ['forms'] as const

export const useForms = () => {
  return useQuery({
    queryKey: FORMS_KEY,
    queryFn: () => fetcher<FormExt[]>('/api/forms'),
    initialData: [],
  })
}

export const formDetailOption = (id: string) => {
  return {
    queryKey: ['forms', id],
    queryFn: () => fetcher<FormExt>('/api/forms/' + id),
    staleTime: 2 * 60 * 1000,
  }
}

export const useFormDetail = (id: string) => {
  return useQuery(formDetailOption(id))
}

export const useUpdateForm = () => {
  return useMutation({
    mutationFn: (body: FormUpdateExt) =>
      fetcher<FormExt>('/api/forms/' + body.id, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  })
}

export const useDeleteForm = () => {
  return useMutation({
    mutationFn: (id: string) => fetcher('/api/forms/' + id, { method: 'DELETE' }),
  })
}

export const useCreateForm = () => {
  return useMutation({
    mutationFn: (body: FormInsertExt) =>
      fetcher<FormExt>('/api/forms', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}
