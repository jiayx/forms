import type React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Trash2, Plus, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { FormUpdateExt, FieldInsert } from '@forms/db/zod'
import { nanoid } from '@forms/shared'
import { formDetailOption, useFormDetail, useUpdateForm, useDeleteForm } from '@/hooks/use-form'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'

export type FieldDraft = Omit<FieldInsert, 'id'> & {
  id: string
  _temp?: true
}

export async function clientLoader({ params }: { params: { id: string } }) {
  await queryClient.ensureQueryData(formDetailOption(params.id))
}

export default function EditFormPage({ params }: { params: { id: string } }) {
  const { data } = useFormDetail(params.id)
  const form = data!

  const navigate = useNavigate()

  const { mutate: deleteFormMutate } = useDeleteForm()
  const { mutate: updateFormMutate } = useUpdateForm()

  const [formData, setFormData] = useState({
    ...form,
    notifyEmails: form.notifyEmails?.join('\n'),
    allowedOrigins: (form.allowedOrigins ?? []).join('\n'),
  })

  const [fields, setFields] = useState<FieldDraft[]>(form.fields)

  const [expandedField, setExpandedField] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    const updatedForm: FormUpdateExt = {
      ...form,
      name: formData.name,
      notifyEmails: formData.notifyEmails.split('\n').filter(Boolean),
      allowedOrigins: formData.allowedOrigins.split('\n').filter(Boolean),
    }

    updateFormMutate(updatedForm, {
      onSuccess: () => {
        toast('表单已更新', {
          description: `表单 "${updatedForm.name}" 已成功更新`,
        })
      },
    })
  }

  const handleDeleteForm = async () => {
    if (confirm(`确定要删除表单 "${form.name}" 吗？此操作不可撤销。`)) {
      deleteFormMutate(params.id, {
        onSuccess: () => {
          toast('表单已删除', {
            description: `表单 "${form.name}" 已成功删除`,
          })
          navigate('/forms')
        },
      })
    }
  }

  const toggleFieldExpand = (fieldId: string) => {
    setExpandedField(expandedField === fieldId ? null : fieldId)
  }

  const handleFieldChange = (fieldId: string, key: string, value: any) => {
    setFields((prevFields) => prevFields.map((field) => (field.id === fieldId ? { ...field, [key]: value } : field)))
  }

  const addNewField = () => {
    const newField: FieldDraft = {
      id: nanoid(),
      formId: form?.id || '',
      name: `field_${fields.length + 1}`,
      type: 'text',
      required: false,
      _temp: true,
    }
    setFields([...fields, newField])
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter((field) => field.id !== fieldId))
    if (expandedField === fieldId) {
      setExpandedField(null)
    }
  }

  const fieldTypeOptions = [
    { value: 'text', label: '文本' },
    { value: 'email', label: '邮箱' },
    { value: 'number', label: '数字' },
    { value: 'textarea', label: '多行文本' },
    { value: 'select', label: '下拉选择' },
    { value: 'checkbox', label: '复选框' },
    { value: 'radio', label: '单选框' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/forms">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回表单列表
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-heading">{form?.name}</h1>
          <p className="text-muted-foreground">
            所属用户: {form.user.name} | 表单 ID: {form?.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="fields">字段管理</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>编辑表单的基本配置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">表单名称</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="请输入表单名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allowedOrigins">允许访问的域名</Label>
                    <Textarea
                      id="allowedOrigins"
                      name="allowedOrigins"
                      value={formData.allowedOrigins}
                      onChange={handleInputChange}
                      placeholder="https://example.com, https://example.org"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">每行一个域名，列表中的域名将被允许访问表单</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifyEmails">通知邮箱</Label>
                    <Textarea
                      id="notifyEmails"
                      name="notifyEmails"
                      value={formData.notifyEmails}
                      onChange={handleInputChange}
                      placeholder="admin@example.com, support@example.com"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">每行一个邮箱，收到表单提交时会发送通知</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>字段管理</span>
                    <div className="flex gap-2">
                      <Button onClick={addNewField} className="gap-2">
                        <Plus className="h-4 w-4" />
                        添加字段
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>管理表单字段，支持拖拽排序</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">表单还没有任何字段</p>
                      <Button onClick={addNewField}>添加第一个字段</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <Card key={field.id} className="border shadow-sm">
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div
                                className="flex items-center gap-3 cursor-pointer w-full"
                                onClick={() => toggleFieldExpand(field.id)}
                              >
                                <div className="text-muted-foreground cursor-move">
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{field.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>字段名: {field.name}</span>
                                    <span>•</span>
                                    <span>类型: {fieldTypeOptions.find((opt) => opt.value === field.type)?.label}</span>
                                    {field.required && (
                                      <>
                                        <span>•</span>
                                        <span className="text-destructive">必填</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  {expandedField === field.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {expandedField === field.id && (
                            <CardContent className="border-t pt-4 pb-4 px-4 bg-muted/30">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`${field.id}-name`}>字段名</Label>
                                  <Input
                                    id={`${field.id}-name`}
                                    value={field.name}
                                    onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                                    placeholder="field_name"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    用于表单提交数据的字段名，只能包含字母、数字和下划线
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`${field.id}-type`}>字段类型</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                                  >
                                    <SelectTrigger id={`${field.id}-type`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`${field.id}-options`}>选项</Label>
                                    <Textarea
                                      id={`${field.id}-options`}
                                      value={(field.options || []).join('\n')}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          field.id,
                                          'options',
                                          e.target.value.split('\n').filter(Boolean)
                                        )
                                      }
                                      placeholder="选项1&#10;选项2&#10;选项3"
                                      rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground">每行一个选项</p>
                                  </div>
                                )}

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${field.id}-required`}
                                    checked={field.required}
                                    onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                                  />
                                  <Label htmlFor={`${field.id}-required`}>必填字段</Label>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteField(field.id)}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  删除字段
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>表单操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSave} className="w-full gap-2">
                <Save className="h-4 w-4" />
                保存表单
              </Button>

              <Link to={`/forms/${form.id}/submissions`} className="w-full">
                <Button variant="outline" className="w-full">
                  查看提交记录
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
              <CardDescription>这些操作不可撤销，请谨慎操作</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteForm} className="gap-2">
                <Trash2 className="h-4 w-4" />
                删除表单
              </Button>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>API 调用示例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <pre className="text-xs">
                  {`fetch('https://api.example.com/api/s/${form.id}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // 表单数据
  })
})`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
