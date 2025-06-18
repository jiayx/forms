import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { SWRConfiguration } from 'swr'
import { decodeJwt } from 'jose'
import { createLock } from '@/lib/utils'

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
  const token = await getToken()
  if (!token) {
    return next(url, init)
  }
  return next(url, {
    ...init,
    headers: { ...(init.headers || {}), 'X-Api-Key': `${token}` },
  })
}

const lock = createLock<string>()

const getToken = async (): Promise<string> => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    return ''
  }

  let needRefresh = false
  try {
    const { exp } = decodeJwt(token)
    if (typeof exp !== 'number') {
      needRefresh = true
    } else {
      const now = Math.floor(Date.now() / 1000)
      // 提前 90s 刷新
      needRefresh = now + 90 >= exp
    }
  } catch (err) {
    // 解析失败也当作过期/无效处理
    needRefresh = true
  }

  if (!needRefresh) {
    return token
  }

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return token
  }

  // 刷新 token
  try {
    return await lock.acquire(async () => {
      const resp = await fetch('/api/admin/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
      if (!resp.ok) {
        throw new Error(`Failed to refresh token ${resp.status}`, { cause: resp })
      }
      const { accessToken }: { accessToken: string } = await resp.json()
      localStorage.setItem('accessToken', accessToken)
      return accessToken
    })
  } catch (err) {
    console.error('Failed to refresh token:', err)
    if (err instanceof Error && err.cause instanceof Response) {
      if (err.cause.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    throw err
  }
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

      const resp = await fetcher(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
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
