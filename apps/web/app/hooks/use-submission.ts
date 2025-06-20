import type { SubmissionExt } from '@forms/db/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import type { SubmissionInsert } from '@forms/db/zod'
import type { Pagination } from '@forms/shared/schema'

export const useSubmissions = (formId: string, params: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['submissions', formId, params],
    queryFn: ({ queryKey: [, , params] }) =>
      fetcher<{ list: SubmissionExt[]; pagination: Pagination }>('/api/forms/' + formId + '/submissions', {
        params: params as Record<string, any>,
      }),
    initialData: {
      list: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 10,
      },
    },
    enabled: !!formId,
  })
}

export const submissionDetailOption = (formId: string, id: string) => ({
  queryKey: ['submissions', formId, id],
  queryFn: () => fetcher<SubmissionExt>('/api/forms/' + formId + '/submissions/' + id),
  staleTime: 2 * 60 * 1000,
})

export const useSubmissionDetail = (formId: string, id: string) => {
  return useQuery(submissionDetailOption(formId, id))
}

export const useCreateSubmission = (formId: string) => {
  return useMutation({
    mutationFn: (body: SubmissionInsert) =>
      fetcher<SubmissionExt>('/api/forms/' + formId + '/submissions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}

export const useDeleteSubmission = (formId: string) => {
  return useMutation({
    mutationFn: (id: string) => fetcher('/api/forms/' + formId + '/submissions/' + id, { method: 'DELETE' }),
  })
}
