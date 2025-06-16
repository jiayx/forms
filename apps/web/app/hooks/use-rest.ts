import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { SWRConfiguration } from 'swr'

type Method = 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'GET'

type Options<B = any> = {
  path?: Record<string, any>
  query?: Record<string, any>
  body?: B
  headers?: Record<string, string>
}

type FetchMiddleware = (next: typeof fetch, url: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function composeFetch(...middlewares: FetchMiddleware[]): typeof fetch {
  return middlewares.reverse().reduce(
    (next, mw) => (url, init) => mw(next, url, init), // 洋葱模型
    fetch // 最里层
  )
}

const withToken: FetchMiddleware = async (next, url, init = {}) => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    return next(url, init)
  }
  return next(url, {
    ...init,
    headers: { ...(init.headers || {}), 'X-Api-Key': `${token}` },
  })
}

const withErrorHandler: FetchMiddleware = async (next, url, init = {}) => {
  const resp = await next(url, init)
  if (!resp.ok) {
    if (resp.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      return resp
    }
    const json = await resp.json()
    const err = json.error || 'An error occurred while fetching the data.'
    const error = new Error(err + ' ' + resp.status)
    throw error
  }
  return resp
}

export const fetcher = composeFetch(withToken, withErrorHandler)

export function useQuery<R>(url: string | undefined, params?: any, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    url ? [url, params] : undefined,
    async ([key, params]) => {
      const url = params ? `${key}?${new URLSearchParams(params).toString()}` : key
      const resp = await fetcher(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return resp.json() as Promise<R>
    },
    options
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

function fillPath(pathTemplate: string, params: Record<string, any>) {
  return pathTemplate.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    if (params[key] == null) {
      throw new Error(`Missing value for path param: ${key}`)
    }
    return encodeURIComponent(params[key])
  })
}

export function useMutation<B = any, R = any>(url: string, method: Method) {
  const { trigger, isMutating, error } = useSWRMutation(
    [url, method],
    async ([key, method], { arg }: { arg: Options<B> }) => {
      const urlWithPathParams = arg.path ? fillPath(key, arg.path) : key
      const url = arg.query ? `${urlWithPathParams}?${new URLSearchParams(arg.query).toString()}` : urlWithPathParams

      const token = localStorage.getItem('accessToken')

      const resp = await fetcher(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'X-Api-Key': `${token}` }),
          ...arg?.headers,
        },
        ...(arg?.body && { body: JSON.stringify(arg.body) }),
      })
      return (await resp.json()) as Promise<R>
    }
  )

  const wrappedTrigger = (options?: Options<B>) => {
    return trigger(options || {})
  }

  return {
    trigger: wrappedTrigger,
    isMutating,
    error,
  }
}
