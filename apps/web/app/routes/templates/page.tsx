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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation } from '@/hooks/use-rest'
import type { FieldTemplateInsert, FieldTemplateSelect, FieldTemplateUpdate } from '@forms/db/zod'

const fieldTypeLabels = {
  text: '文本',
  email: '邮箱',
  number: '数字',
  select: '下拉选择',
  textarea: '多行文本',
  checkbox: '复选框',
  radio: '单选框',
}

export default function TemplatesPage() {
  const { data: fieldTemplatesData, mutate } = useQuery<{ fieldTemplates: FieldTemplateSelect[] }>(
    `/api/admin/field-templates`
  )
  const fieldTemplates = fieldTemplatesData?.fieldTemplates || []

  const { trigger: addFieldTemplateTrigger } = useMutation<FieldTemplateInsert>(`/api/admin/field-templates`, 'POST')
  const { trigger: updateFieldTemplateTrigger } = useMutation<FieldTemplateUpdate>(
    `/api/admin/field-templates/:id`,
    'PATCH'
  )
  const { trigger: deleteFieldTemplateTrigger } = useMutation(`/api/admin/field-templates/:id`, 'DELETE')

  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newTemplate: FieldTemplateInsert = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'number' | 'text' | 'email' | 'select' | 'textarea' | 'checkbox' | 'radio',
      label: formData.get('label') as string,
      placeholder: (formData.get('placeholder') as string) || '',
      options: formData.get('options') ? (formData.get('options') as string).split('\n').filter(Boolean) : [],
    }

    await addFieldTemplateTrigger({ body: newTemplate })
    setIsCreateDialogOpen(false)
    toast({
      title: '字段模板创建成功',
      description: `模板 "${newTemplate.name}" 已成功创建`,
    })
    mutate()
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const updatedTemplate: FieldTemplateUpdate = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio',
      label: formData.get('label') as string,
      placeholder: (formData.get('placeholder') as string) || '',
      options: formData.get('options') ? (formData.get('options') as string).split('\n').filter(Boolean) : [],
    }

    await updateFieldTemplateTrigger({
      path: { id: editingTemplate.id },
      body: updatedTemplate,
    })
    setIsEditDialogOpen(false)
    setEditingTemplate(null)
    toast({
      title: '字段模板已更新',
      description: `模板 "${updatedTemplate.name}" 已成功更新`,
    })
    mutate()
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`确定要删除字段模板 "${name}" 吗？`)) {
      await deleteFieldTemplateTrigger({ path: { id } })
      toast({
        title: '字段模板已删除',
        description: `模板 "${name}" 已成功删除`,
      })
      mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">字段模板管理</h1>
          <p className="text-muted-foreground">管理可复用的表单字段模板</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新增模板
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>创建字段模板</DialogTitle>
              <DialogDescription>创建可复用的字段模板，方便在表单中快速添加</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">模板名称</Label>
                <Input id="name" name="name" placeholder="请输入模板名称" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">字段类型</Label>
                <Select name="type" required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="选择字段类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">字段标签</Label>
                <Input id="label" name="label" placeholder="请输入字段标签" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">占位符文本</Label>
                <Input id="placeholder" name="placeholder" placeholder="请输入占位符文本" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="options">选项（适用于下拉/单选/复选）</Label>
                <textarea
                  id="options"
                  name="options"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md"
                  placeholder="选项1&#10;选项2&#10;选项3"
                />
                <p className="text-xs text-muted-foreground">每行一个选项</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">创建模板</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 编辑模板对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>编辑字段模板</DialogTitle>
              <DialogDescription>修改字段模板信息</DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <form onSubmit={handleUpdateTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">模板名称</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingTemplate.name}
                    placeholder="请输入模板名称"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">字段类型</Label>
                  <Select name="edit-type" defaultValue={editingTemplate.type} required>
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="选择字段类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fieldTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-label">字段标签</Label>
                  <Input
                    id="edit-label"
                    name="label"
                    defaultValue={editingTemplate.label}
                    placeholder="请输入字段标签"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-placeholder">占位符文本</Label>
                  <Input
                    id="edit-placeholder"
                    name="placeholder"
                    defaultValue={editingTemplate.placeholder || ''}
                    placeholder="请输入占位符文本"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="edit-required" name="required" defaultChecked={editingTemplate.required} />
                  <Label htmlFor="edit-required">必填字段</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-options">选项（适用于下拉/单选/复选）</Label>
                  <textarea
                    id="edit-options"
                    name="options"
                    className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md"
                    placeholder="选项1&#10;选项2&#10;选项3"
                    defaultValue={editingTemplate.options ? editingTemplate.options.join('\n') : ''}
                  />
                  <p className="text-xs text-muted-foreground">每行一个选项</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">更新模板</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
          <CardDescription>当前共有 {fieldTemplates.length} 个字段模板</CardDescription>
        </CardHeader>
        <CardContent>
          {fieldTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Settings className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无字段模板</h3>
              <p className="text-muted-foreground mb-4">还没有创建任何字段模板，点击上方按钮开始创建</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>创建第一个模板</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模板名称</TableHead>
                  <TableHead>字段类型</TableHead>
                  <TableHead>字段标签</TableHead>
                  <TableHead>占位符</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fieldTypeLabels[template.type]}</Badge>
                    </TableCell>
                    <TableCell>{template.label}</TableCell>
                    <TableCell className="text-muted-foreground">{template.placeholder || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
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
