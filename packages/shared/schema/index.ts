export type Pagination = {
  total: number
  page: number
  pageSize: number
  pages?: number
}

export type SuccessRes<T> = {
  status: 'success'
  data: T
}

export type ErrorRes = {
  status: 'error'
  error: {
    code?: string // 机器可读的错误码，可选
    message: string // 人类可读的错误信息，必需
  }
}

export type Res<T = any> = SuccessRes<T> | ErrorRes

export class ApiError extends Error {
  public readonly code?: string
  public readonly statusCode: number

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export function success<T>(data?: T): SuccessRes<T> {
  return {
    status: 'success',
    data: data || ({} as T),
  }
}

export function error(message: string, code?: string): ErrorRes {
  return {
    status: 'error',
    error: {
      code,
      message,
    },
  }
}
