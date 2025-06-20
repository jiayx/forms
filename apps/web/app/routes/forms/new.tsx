import type React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FileText, PlusCircle, Mail } from 'lucide-react'
import { Link } from 'react-router'
import type { FormInsertExt } from '@forms/db/zod'
import { useImpersonateId } from '@/hooks/use-impersonate'
import { toast } from 'sonner'
import { useCreateForm } from '@/hooks/use-form'
import { useUsers } from '@/hooks/use-user'
import { useUser } from '@/hooks/use-auth'

export default function NewFormPage() {
  const navigate = useNavigate()
  const { data: users } = useUsers()
  const { data: user } = useUser()

  const { mutateAsync: createForm } = useCreateForm()

  const { data: impersonateId } = useImpersonateId()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newForm: FormInsertExt = {
      name: formData.get('name') as string,
      allowedOrigins: (formData.get('allowedOrigins') as string).split('\n').filter(Boolean),
      fields: [],
      notifyEmails: (formData.get('notifyEmails') as string).split('\n').filter(Boolean),
    }

    await createForm(newForm)
    toast('表单创建成功', {
      description: `表单 "${newForm.name}" 已成功创建`,
    })
    navigate('/forms')
  }

  return (
    <div>
      <div className="text-center absolute top-4 left-4">
        <Link to="/forms" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Link>
      </div>
      <div className="space-y-8">
        <div className="max-w-2xl mx-auto relative">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/5 rounded-full blur-xl -z-10"></div>

          <Card className="border shadow-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">创建新表单</CardTitle>
              <CardDescription>设置表单的基本配置信息</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {user?.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      所属用户 *
                    </Label>
                    <Select value={impersonateId || user.id} required disabled>
                      <SelectTrigger id="tenant" className="bg-background/50">
                        <SelectValue placeholder="选择用户" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    表单名称 *
                  </Label>
                  <Input id="name" name="name" placeholder="请输入表单名称" required className="bg-background/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedOrigins" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    允许访问的域名
                  </Label>
                  <Textarea
                    id="allowedOrigins"
                    name="allowedOrigins"
                    placeholder="https://example.com, https://example.org"
                    rows={3}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">每行一个域名，列表中的域名将被允许访问表单</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notifyEmails" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    通知邮箱
                  </Label>
                  <Textarea
                    id="notifyEmails"
                    name="notifyEmails"
                    placeholder="admin@example.com, support@example.com"
                    rows={3}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">每行一个邮箱，收到表单提交时会发送通知</p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Link to="/forms">
                    <Button type="button" variant="outline" size="lg">
                      取消
                    </Button>
                  </Link>
                  <Button type="submit" size="lg" className="min-w-[120px]">
                    创建表单
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
