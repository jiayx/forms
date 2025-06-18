import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, FileText, PlusCircle, Mail, LinkIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useQuery, useMutation } from '@/hooks/use-rest'
import type { TenantExt, FormInsertExt } from '@forms/db/zod'
import { useCurrentTenant } from '@/hooks/use-tenants'

export default function NewFormPage() {
  const navigate = useNavigate()
  const { data } = useQuery<{ tenants: TenantExt[] }>('/api/admin/tenants')
  const tenants = data?.tenants || []

  const { trigger: createForm } = useMutation<FormInsertExt>('/api/admin/forms', 'POST')

  const { toast } = useToast()

  const { currentTenant } = useCurrentTenant()
  const [selectedTenant, setSelectedTenant] = useState(currentTenant?.id || '')
  useEffect(() => {
    if (!selectedTenant && currentTenant?.id) {
      setSelectedTenant(currentTenant.id)
    }
  }, [currentTenant?.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newForm: FormInsertExt = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      tenantId: selectedTenant,
      allowedOrigins: [],
      fields: [],
      notifyEmails: (formData.get('notifyEmails') as string).split('\n').filter(Boolean),
    }

    try {
      await createForm({ body: newForm })
    } catch (error) {
      console.error(error)
      toast({
        title: '表单创建失败',
        description: `表单 "${newForm.name}" 创建失败`,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: '表单创建成功',
      description: `表单 "${newForm.name}" 已成功创建`,
    })
    navigate('/forms')
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
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
                <div className="space-y-2">
                  <Label htmlFor="tenant" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    所属租户 *
                  </Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant} required>
                    <SelectTrigger id="tenant" className="bg-background/50">
                      <SelectValue placeholder="选择租户" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    表单名称 *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="请输入表单名称"
                    required
                    className="bg-background/50"
                    onChange={(e) => {
                      const slugInput = document.getElementById('slug') as HTMLInputElement
                      if (slugInput) {
                        slugInput.value = generateSlug(e.target.value)
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    表单 Slug *
                  </Label>
                  <Input id="slug" name="slug" placeholder="form-slug" required className="bg-background/50" />
                  <p className="text-xs text-muted-foreground">用于 API 调用的唯一标识符，只能包含字母、数字和连字符</p>
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
