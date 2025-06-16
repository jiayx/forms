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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Trash2, Plus, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery, useMutation, fetcher } from '@/hooks/use-rest'
import type { FormUpdateExt, FormExt, FieldInsert, FieldTemplateSelect } from '@forms/db/zod'
import { v4 as uuid } from 'uuid'

export type FieldDraft = Omit<FieldInsert, 'id'> & {
  id: string
  _temp?: true
}

export async function clientLoader({ params }: { params: { id: string } }) {
  const resp = await fetcher(`/admin/forms/${params.id}`)
  return (await resp.json()) as { form: FormExt }
}

export default function EditFormPage({
  params,
  loaderData,
}: {
  params: { id: string }
  loaderData: { form: FormExt }
}) {
  const { form } = loaderData

  const navigate = useNavigate()

  const { data: fieldTemplatesData } = useQuery<{ fieldTemplates: FieldTemplateSelect[] }>(`/admin/field-templates`)
  const fieldTemplates = fieldTemplatesData?.fieldTemplates || []

  const { trigger: updateFormTrigger } = useMutation<FormUpdateExt>(`/admin/forms/${params.id}`, 'PATCH')
  const { trigger: deleteFormTrigger } = useMutation(`/admin/forms/${params.id}`, 'DELETE')

  const { toast } = useToast()
  const [formData, setFormData] = useState({
    ...form,
    notifyEmails: form.notifyEmails.join('\n'),
  })

  const [fields, setFields] = useState<FieldDraft[]>(form.fields)

  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    const fieldsToInsert: FieldInsert[] = fields.map(({ id: _omit, _temp, ...rest }) => rest)

    const updatedForm: FormUpdateExt = {
      ...form,
      name: formData.name,
      slug: formData.slug,
      notifyEmails: formData.notifyEmails.split('\n').filter(Boolean),
      fields: fieldsToInsert,
    }

    try {
      await updateFormTrigger({ body: updatedForm })
    } catch (error) {
      console.error(error)
      toast({
        title: '表单更新失败',
        description: `表单 "${updatedForm.name}" 更新失败`,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: '表单已更新',
      description: `表单 "${updatedForm.name}" 已成功更新`,
    })
  }

  const handleDeleteForm = async () => {
    if (confirm(`确定要删除表单 "${form.name}" 吗？此操作不可撤销。`)) {
      try {
        await deleteFormTrigger({ body: form })
      } catch (error) {
        console.error(error)
        toast({
          title: '表单删除失败',
          description: `表单 "${form.name}" 删除失败`,
          variant: 'destructive',
        })
        return
      }
      toast({
        title: '表单已删除',
        description: `表单 "${form.name}" 已成功删除`,
        variant: 'destructive',
      })
      navigate('/forms')
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
      id: uuid(),
      formId: form?.id || '',
      name: `field_${fields.length + 1}`,
      type: 'text',
      label: `字段 ${fields.length + 1}`,
      required: false,
      placeholder: '',
      order: fields.length + 1,
      _temp: true,
    }
    setFields([...fields, newField])
  }

  const addTemplateField = () => {
    if (!selectedTemplate) return

    const template = fieldTemplates.find((t) => t.id === selectedTemplate)
    if (!template) return

    const newField: FieldDraft = {
      id: uuid(),
      formId: form.id,
      name: template.name.toLowerCase().replace(/\s+/g, '-'),
      type: template.type,
      label: template.label,
      required: false,
      placeholder: template.placeholder,
      options: template.options,
      order: fields.length + 1,
      validationRegex: template.validationRegex,
      templateId: template.id,
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

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = fields.findIndex((field) => field.id === fieldId)
    if ((direction === 'up' && fieldIndex === 0) || (direction === 'down' && fieldIndex === fields.length - 1)) {
      return
    }

    const newFields = [...fields]
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    const temp = newFields[targetIndex]
    newFields[targetIndex] = { ...newFields[fieldIndex], order: targetIndex + 1 }
    newFields[fieldIndex] = { ...temp, order: fieldIndex + 1 }
    setFields(newFields)
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
            所属租户: {form.tenant.name} | 表单 ID: {form?.id}
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
                    <Label htmlFor="slug">表单 Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="form-slug"
                    />
                    <p className="text-xs text-muted-foreground">
                      用于 API 调用的唯一标识符，只能包含字母、数字和连字符
                    </p>
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
                    <p className="text-xs text-muted-foreground">多个邮箱用逗号分隔，收到表单提交时会发送通知</p>
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
                      <div className="flex items-center gap-2">
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="选择字段模板" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={addTemplateField}
                          disabled={!selectedTemplate}
                          className="whitespace-nowrap"
                        >
                          插入模板
                        </Button>
                      </div>
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
                      {fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
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
                                    <div className="font-medium">{field.label}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>字段名: {field.name}</span>
                                      <span>•</span>
                                      <span>
                                        类型: {fieldTypeOptions.find((opt) => opt.value === field.type)?.label}
                                      </span>
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
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => moveField(field.id, 'up')}
                                    disabled={field.order === 1}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => moveField(field.id, 'down')}
                                    disabled={field.order === fields.length}
                                  >
                                    <ChevronDown className="h-4 w-4" />
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
                                    <Label htmlFor={`${field.id}-label`}>字段标签</Label>
                                    <Input
                                      id={`${field.id}-label`}
                                      value={field.label}
                                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                      placeholder="字段标签"
                                    />
                                    <p className="text-xs text-muted-foreground">显示在表单中的字段标签文本</p>
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

                                  <div className="space-y-2">
                                    <Label htmlFor={`${field.id}-placeholder`}>占位符文本</Label>
                                    <Input
                                      id={`${field.id}-placeholder`}
                                      value={field.placeholder || ''}
                                      onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                                      placeholder="请输入..."
                                    />
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

              <Link to={`/submissions?form=${form.id}`} className="w-full">
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
                  {`fetch('https://api.example.com/v1/forms/${form.slug}', {
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
