import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createLock<T>() {
  let locked = false
  let queue: { resolve: (value: T) => void; reject: (reason?: any) => void }[] = []
  return {
    async acquire(fn: () => Promise<T>): Promise<T> {
      // 如果已经锁住，排队
      if (locked) {
        return await new Promise<T>((resolve, reject) => queue.push({ resolve, reject }))
      }
      locked = true
      try {
        const result = await fn()
        // 成功后通知队列
        queue.forEach(({ resolve }) => resolve(result))
        return result
      } catch (err) {
        // 失败时通知队列
        queue.forEach(({ reject }) => reject(err))
        throw err
      } finally {
        // 清空队列 & 解锁
        queue = []
        locked = false
      }
    },
  }
}

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
