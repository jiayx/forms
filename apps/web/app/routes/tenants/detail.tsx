import type React from 'react'

import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Copy, Save, Trash2, ExternalLink, FileSpreadsheet, CopyIcon, ListIcon } from 'lucide-react'
import { useQuery, useMutation } from '@/hooks/use-rest'
import type { TenantExt, TenantUpdate } from '@forms/db/zod'
import { formatDate } from '@/lib/utils'

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const { state } = useLocation()
  const [isEditing, setIsEditing] = useState(state?.isEditing || false)

  const { data, error, isLoading, mutate } = useQuery<{ tenant: TenantExt }>(`/api/admin/tenants/${params.id}`)

  const { trigger: updateTenantTrigger } = useMutation<TenantUpdate>(`/api/admin/tenants/${params.id}`, 'PATCH')
  const { trigger: deleteTenantTrigger } = useMutation(`/api/admin/tenants/${params.id}`, 'DELETE')

  const navigate = useNavigate()
  const { toast } = useToast()

  const [draft, setDraft] = useState<TenantExt>({
    id: '',
    name: '',
    domain: '',
    apiKey: '',
    allowedOrigins: [],
    createdAt: '',
    updatedAt: '',
    forms: [],
    submissionsCount: 0,
  } as TenantExt)
  useEffect(() => {
    if (isEditing && data?.tenant) {
      setDraft(JSON.parse(JSON.stringify(data.tenant)))
    }
  }, [isEditing, data?.tenant])

  const tenant: TenantExt = isEditing ? draft : data?.tenant || ({} as TenantExt)
  const tenantForms = tenant?.forms || []

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!draft) return

    const parsedValue = name === 'allowedOrigins' ? value.split('\n') : value
    setDraft((prev) => ({ ...prev!, [name]: parsedValue }))
  }

  const handleSave = async () => {
    if (!draft) return
    draft.allowedOrigins = draft.allowedOrigins.filter(Boolean)
    await updateTenantTrigger({ body: draft })
    setIsEditing(false)
    toast({
      title: '租户已更新',
      description: `租户 "${draft.name}" 信息已成功更新`,
    })
    mutate()
  }

  const handleDelete = async () => {
    if (!tenant) return

    if (confirm(`确定要删除租户 "${tenant.name}" 吗？此操作不可撤销。`)) {
      await deleteTenantTrigger({ path: { id: tenant.id } })
      toast({
        title: '租户已删除',
        description: `租户 "${tenant.name}" 已成功删除`,
        variant: 'destructive',
      })
      navigate('/tenants')
    }
  }

  const copyApiKey = () => {
    if (!tenant) return
    navigator.clipboard.writeText(tenant.apiKey)
    toast({
      title: 'API Key 已复制',
      description: 'API Key 已复制到剪贴板',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">加载中...</h2>
          <p className="text-muted-foreground">正在获取租户信息</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-muted-foreground">获取租户信息失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-heading">{tenant.name}</h1>
          <p className="text-muted-foreground">租户 ID: {tenant.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="dashboard-card space-y-4 pt-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>租户详情</span>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>编辑信息</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" />
                      保存
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>查看和编辑租户基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">租户名称</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    name="name"
                    value={tenant.name}
                    onChange={handleInputChange}
                    placeholder="请输入租户名称"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md">{tenant.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">域名</Label>
                {isEditing ? (
                  <Input
                    id="domain"
                    name="domain"
                    value={tenant.domain}
                    onChange={handleInputChange}
                    placeholder="example.com"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md flex items-center justify-between">
                    <span>{tenant.domain}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="p-2 bg-muted rounded-md flex items-center justify-between">
                  <code className="text-sm">{tenant.apiKey}</code>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>创建时间</Label>
                <div className="p-2 bg-muted rounded-md">{formatDate(tenant.createdAt)}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedOrigins">允许的来源域名</Label>
                {isEditing ? (
                  <>
                    <Textarea
                      id="allowedOrigins"
                      name="allowedOrigins"
                      value={tenant.allowedOrigins.join('\n')}
                      onChange={handleInputChange}
                      placeholder="https://example.com&#10;https://app.example.com"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">每行一个域名</p>
                  </>
                ) : (
                  <div className="p-2 bg-muted rounded-md">
                    {tenant.allowedOrigins.length === 0 ? (
                      <span className="text-muted-foreground">未设置允许的来源域名</span>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {tenant.allowedOrigins.map((origin: string, index: number) => (
                          <li key={index}>{origin}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>租户统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <div className="text-2xl font-bold">{tenantForms.length}</div>
                  <div className="text-xs text-muted-foreground">表单数量</div>
                </div>
                <div className="stat-card">
                  <div className="text-2xl font-bold">{tenant.submissionsCount || 0}</div>
                  <div className="text-xs text-muted-foreground">提交总数</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="text-sm font-medium mb-1">最近活动</div>
                <div className="text-xs text-muted-foreground">上次更新: {formatDate(tenant.createdAt)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to={`/forms?tenant=${tenant.id}`}>
                  <FileSpreadsheet className="h-4 w-4" />
                  表单管理
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to={`/submissions?tenant=${tenant.id}`}>
                  <ListIcon className="h-4 w-4" />
                  查看提交记录
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={copyApiKey}>
                <CopyIcon className="h-4 w-4" />
                复制 API Key
              </Button>
              <Button variant="destructive" className="w-full justify-start" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                删除租户
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
