import { decodeJwt } from 'jose'
import { createLock } from '@/lib/utils'
import type { ErrorRes, SuccessRes, Res } from '@forms/shared/schema'
import { getImpersonateId } from '@/hooks/use-impersonate'

export class ApiError<TInfo = unknown> extends Error {
  /** HTTP status, 0 = network error / aborted */
  status: number
  /** raw response body for UI / debug */
  info?: TInfo

  constructor(message: string, status = 0, info?: TInfo) {
    super(message)
    this.status = status
    this.info = info
  }
}

interface FetcherInit extends RequestInit {
  /** GET 请求的 query 对象，会拼接到 url */
  params?: Record<string, any>
  /** 不带 Authorization 头时设为 true */
  anonymous?: boolean
}

/**
 * fetch 包装：支持 token、AbortSignal、业务错误抛出
 */
export async function fetcher<T = unknown>(
  url: string,
  { params, anonymous = false, signal, headers, ...init }: FetcherInit = {}
): Promise<T> {
  // 拼 query string
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null) as [string, string][]
    )
    url += (url.includes('?') ? '&' : '?') + qs.toString()
  }

  const accessToken = anonymous ? '' : await getToken()

  const impersonateId = getImpersonateId()

  // 真正发请求
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(impersonateId ? { 'X-Impersonate-User': impersonateId } : {}),
      ...(headers || {}),
      ...(anonymous ? {} : { Authorization: `Bearer ${accessToken}` }),
    },
    signal,
  }).catch((e: Error) => {
    // 网络错误 / XHR blocked / Abort
    console.error('network error:', e)
    throw new ApiError(e.message, 0)
  })

  // HTTP 4xx/5xx
  if (!res.ok) {
    const info: ErrorRes = await res.json()
    console.error('fetch error:', info)
    throw new ApiError(res.statusText, res.status, info)
  }

  // 后端统一结构 → 业务错误
  const json = (await res.json()) as Res<T>
  if (json.status !== 'success') {
    throw new ApiError(json.error?.message || 'An error occurred while fetching the data.', res.status, json)
  }

  return json.data
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
      const resp = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
      if (!resp.ok) {
        throw new Error(`Failed to refresh token ${resp.status}`, { cause: resp })
      }
      const json = (await resp.json()) as SuccessRes<{ accessToken: string }>
      const { accessToken } = json.data
      localStorage.setItem('accessToken', accessToken)
      return accessToken
    })
  } catch (err) {
    console.error('Failed to refresh token:', err)
    if (err instanceof Error && err.cause instanceof Response) {
      if (err.cause.status === 401 || err.cause.status === 403) {
        throw new ApiError(`Failed to refresh token`, 401)
      }
    }
    throw err
  }
}
