import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ErrorRes } from '@forms/shared/schema'
import { ApiError } from '@/lib/fetcher'

const errorHandler = (e: unknown) => {
  console.error('query error:', e)
  const err = e as ApiError<ErrorRes>
  if (err.status === 401) {
    console.error('query error 401:', e)
    // 跳转到登录页（带返回路径）
    window.location.href = '/login'
  } else {
    toast.error(err.message, {
      description: err.info?.error?.message,
    })
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: errorHandler,
  }),
  mutationCache: new MutationCache({
    onError: errorHandler,
  }),
})
