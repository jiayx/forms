import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Database } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useForms } from '@/hooks/use-form'

export default function FormsPage() {
  const { data: forms } = useForms()

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
          <CardDescription>{`共有 ${forms.length} 个表单`}</CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无表单</h3>
              <p className="text-muted-foreground mb-4">未创建任何表单，点击按钮开始创建</p>
              <Link to="/forms/new">
                <Button>创建第一个表单</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>表单名称</TableHead>
                  <TableHead>所属用户</TableHead>
                  <TableHead>字段数</TableHead>
                  <TableHead>允许的来源域名</TableHead>
                  <TableHead>通知邮箱</TableHead>
                  <TableHead>提交数</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">
                      <Link to={`/forms/${form.id}/submissions`}>{form.name}</Link>
                    </TableCell>
                    <TableCell>{form.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{form.fields?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {form.allowedOrigins?.map((origin) => (
                          <span key={origin} className="text-xs bg-muted px-2 py-1 rounded">
                            {origin}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {form.notifyEmails?.map((email) => (
                          <span key={email} className="text-xs bg-muted px-2 py-1 rounded">
                            {email}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{form.submissionsCount || 0}</Badge>
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
                        <Link to={`/forms/${form.id}/submissions`}>
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
