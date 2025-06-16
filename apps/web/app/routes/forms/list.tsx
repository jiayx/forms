import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Database } from 'lucide-react'
import { useQuery } from '@/hooks/use-rest'
import type { FormExt, TenantExt } from '@forms/db/zod'
import { formatDate } from '@/lib/date'
import { useCurrentTenant } from '@/hooks/use-tenants'

export default function FormsPage() {
  const { currentTenant, setCurrentTenantId } = useCurrentTenant()

  const [searchParams] = useSearchParams()
  if (searchParams.get('tenant')) {
    setCurrentTenantId(searchParams.get('tenant') || 'all')
  }

  const { data } = useQuery<{ forms: FormExt[] }>(
    '/admin/forms',
    currentTenant ? { tenantId: currentTenant.id } : undefined
  )
  const forms = data?.forms || []

  const { data: tenantData } = useQuery<{ tenants: TenantExt[] }>('/admin/tenants')
  const tenants = tenantData?.tenants || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">表单管理</h1>
          <p className="text-muted-foreground">管理所有租户的表单配置</p>
        </div>

        <Link to={`/forms/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            新建表单
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>表单列表</CardTitle>
          <CardDescription>
            {currentTenant ? `${currentTenant?.name} 共有 ${forms.length} 个表单` : `共有 ${forms.length} 个表单`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无表单</h3>
              <p className="text-muted-foreground mb-4">
                {currentTenant ? '该租户还没有创建任何表单' : '还没有创建任何表单，点击上方按钮开始创建'}
              </p>
              <Link to="/forms/new">
                <Button>创建第一个表单</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>表单名称</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>所属租户</TableHead>
                  <TableHead>字段数</TableHead>
                  <TableHead>提交数</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{form.slug}</code>
                    </TableCell>
                    <TableCell>{form.tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{form.fields?.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{form.submissionsCount}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(form.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/forms/${form.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            编辑
                          </Button>
                        </Link>
                        <Link to={`/submissions?form=${form.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Database className="h-4 w-4" />
                            查看提交
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
