import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMutation } from '@/hooks/use-rest'
import type { TenantInsert } from '@forms/db/zod'
import { Plus, Eye, Edit, Copy, Trash, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router'
import { formatDate } from '@/lib/date'
import { useTenants } from '@/hooks/use-tenants'

export default function TenantsPage() {
  const { data, error, isLoading, mutate } = useTenants()
  const tenants = data?.tenants || []

  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const {
    trigger: createTenantTrigger,
    isMutating: createTenantIsMutating,
    error: createTenantError,
  } = useMutation<TenantInsert>('/admin/tenants', 'POST')
  const {
    trigger: deleteTenantTrigger,
    isMutating: deleteTenantIsMutating,
    error: deleteTenantError,
  } = useMutation('/admin/tenants/:id', 'DELETE')

  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newTenant: TenantInsert = {
      name: formData.get('name') as string,
      domain: formData.get('domain') as string,
      allowedOrigins: (formData.get('allowedOrigins') as string).split('\n').filter(Boolean),
    }

    console.log(newTenant)

    try {
      await createTenantTrigger({ body: newTenant })
    } catch (error) {
      console.error('创建租户失败:', error)
      toast({
        title: '租户创建失败',
        description: `租户 "${newTenant.name}" 创建失败`,
        variant: 'destructive',
      })
      return
    }

    setIsCreateDialogOpen(false)
    mutate()
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: 'API Key 已复制',
      description: 'API Key 已复制到剪贴板',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">租户管理</h1>
          <p className="text-muted-foreground">管理系统中的所有租户账户</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新增租户
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>创建新租户</DialogTitle>
              <DialogDescription>填写租户基本信息，系统将自动生成 API Key</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">租户名称</Label>
                <Input id="name" name="name" placeholder="请输入租户名称" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">域名</Label>
                <Input id="domain" name="domain" placeholder="example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedOrigins">允许的来源域名</Label>
                <Textarea
                  id="allowedOrigins"
                  name="allowedOrigins"
                  placeholder="https://example.com&#10;https://app.example.com"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">每行一个域名</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createTenantIsMutating} onClick={() => handleCreateTenant}>
                  {createTenantIsMutating ? '正在创建...' : '创建租户'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
          <CardDescription>当前系统共有 {tenants.length} 个租户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>域名</TableHead>
                <TableHead>允许的来源域名</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>表单数量</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    loading...
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    error: {error.message}
                  </TableCell>
                </TableRow>
              )}
              {tenants &&
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tenant.domain}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => window.open(`${tenant.domain}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tenant.allowedOrigins.map((origin) => (
                          <span key={origin} className="text-xs bg-muted px-2 py-1 rounded">
                            {origin}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{tenant.apiKey.substring(0, 20)}...</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => copyApiKey(tenant.apiKey)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tenant.forms?.length}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            查看
                          </Button>
                        </Link>
                        <Link to={`/tenants/${tenant.id}`} state={{ isEditing: true }}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            编辑
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            deleteTenantTrigger({ path: { id: tenant.id } })
                            toast({
                              title: '租户删除成功',
                              description: `租户 "${tenant.name}" 已成功删除`,
                            })
                            mutate()
                          }}
                        >
                          <Trash className="h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-gray-500" colSpan={7}>
                    暂无租户
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
