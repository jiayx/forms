import type { TenantExt } from '@forms/db/zod'
import { useQuery } from '@/hooks/use-rest'
import useSWR, { mutate } from 'swr'
import { useUser } from './use-auth'

export const useTenants = () => {
  return useQuery<{ tenants: TenantExt[] }>('/admin/tenants', null, {
    dedupingInterval: 600_000,
  })
}

// 当前租户 id 存在 SWR Cache（或 localStorage）里
const CURRENT_TENANT_ID_KEY = 'current-tenant-id'

export function useCurrentTenant() {
  const { data: userData } = useUser()
  const user = userData?.user

  // a) 先取列表
  const { data } = useTenants()
  const tenants = data?.tenants || []

  const useStorage = user && !user.tenantId
  const fallbackData = () => {
    if (useStorage) {
      return localStorage.getItem(CURRENT_TENANT_ID_KEY)
    }
    return user?.tenantId
  }

  // b) 再取选中的 id；fallbackData 让它首屏是 null 而不是 undefined
  const { data: id } = useSWR<string | null>(CURRENT_TENANT_ID_KEY, null, {
    fallbackData: fallbackData(),
  })

  // c) 算出对象
  const current = tenants?.find((t) => t.id === id) ?? null

  // d) 封装 setter：写 SWR 缓存 + 持久化
  const setCurrentTenantId = (nextId: string) => {
    mutate(CURRENT_TENANT_ID_KEY, nextId, { revalidate: false })
    if (useStorage) {
      localStorage.setItem(CURRENT_TENANT_ID_KEY, nextId)
    }
  }

  return { currentTenant: current, setCurrentTenantId }
}
