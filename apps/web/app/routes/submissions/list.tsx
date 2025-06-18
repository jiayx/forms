import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Eye, Filter, Database } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useQuery } from '@/hooks/use-rest'
import type { FormSelectExt, SubmissionSelect } from '@forms/db/zod'
import { formatDate } from '@/lib/utils'
import { useDebounce } from 'use-debounce'
import { useCurrentTenant } from '@/hooks/use-tenants'

export default function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const formId = searchParams.get('form') || ''

  const [selectedForm, setSelectedForm] = useState<string>('')
  useEffect(() => {
    setSelectedForm(formId)
  }, [formId])

  const { currentTenant } = useCurrentTenant()

  const { data: formsData } = useQuery<{ forms: FormSelectExt[]; total: number }>(
    '/api/admin/forms',
    currentTenant?.id
      ? {
          tenantId: currentTenant?.id,
        }
      : undefined
  )
  const forms = formsData?.forms || []

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)

  const { data: submissionsData, error } = useQuery<{ submissions: SubmissionSelect[]; total: number }>(
    selectedForm ? `/api/admin/forms/${selectedForm}/submissions` : undefined,
    {
      page: currentPage,
      pageSize,
      keyword: debouncedSearchTerm,
    }
  )
  const submissions = submissionsData?.submissions || []
  const total = submissionsData?.total || 0
  useEffect(() => {
    if (!formsData?.forms || formsData?.forms.length === 0) return
    if (selectedForm != formsData?.forms[0].id) {
      setSearchParams({ form: formsData.forms[0].id })
    }
  }, [formsData?.forms])

  // 计算分页数据
  const totalPages = Math.ceil(total / pageSize)

  const getFormName = (formId: string) => {
    return forms.find((f) => f.id === formId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">提交记录</h1>
          <p className="text-muted-foreground">查看和管理所有表单提交数据</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">筛选表单:</span>
          {forms.length === 0 ? (
            <span className="text-muted-foreground">暂无表单</span>
          ) : (
            <Select
              value={selectedForm}
              onValueChange={(value) => {
                setSearchParams({ form: value })
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">搜索:</span>
          <Input
            placeholder="搜索提交内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
        </div>

        <div className="flex ml-auto items-center gap-2">
          <Button variant="default" onClick={() => {}}>
            创建
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无提交记录</h3>
              <p className="text-muted-foreground">该表单还没有提交记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>表单</TableHead>
                  <TableHead>租户</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>IP 地址</TableHead>
                  <TableHead>数据摘要</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Load failed: {error}
                    </TableCell>
                  </TableRow>
                )}
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{getFormName(submission.formId)?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getFormName(submission.formId)?.tenant.name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(submission.createdAt)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{submission.ip}</code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {Object.entries(submission.data).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {String(value).substring(0, 20)}
                            {String(value).length > 20 ? '...' : ''}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/submissions/${submission.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {submissions.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page)
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
