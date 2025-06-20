import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Copy, Trash2, Flag } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useSubmissionDetail, useDeleteSubmission } from '@/hooks/use-submission'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { submissionDetailOption } from '@/hooks/use-submission'

export async function clientLoader({ params }: { params: { id: string; formId: string } }) {
  await queryClient.ensureQueryData(submissionDetailOption(params.formId, params.id))
}

export default function SubmissionDetailPage({ params }: { params: { id: string; formId: string } }) {
  const navigate = useNavigate()

  const { data } = useSubmissionDetail(params.formId, params.id)
  const submission = data!
  const form = submission.form

  const { mutate: deleteSubmissionMutate } = useDeleteSubmission(params.formId)

  const copyData = () => {
    navigator.clipboard.writeText(JSON.stringify(submission.data, null, 2))
    toast('数据已复制', {
      description: '提交数据已复制到剪贴板',
    })
  }

  const deleteSubmission = async () => {
    if (confirm('确定要删除此提交记录吗？此操作不可撤销。')) {
      deleteSubmissionMutate(params.id, {
        onSuccess: () => {
          toast('提交记录已删除', {
            description: '提交记录已成功删除',
          })
          navigate('/submissions')
        },
        onError: () => {
          toast('提交记录删除失败', {
            description: '提交记录删除失败',
          })
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/submissions">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回提交列表
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-heading">提交详情</h1>
          <p className="text-muted-foreground">
            表单: {form.name} | 提交时间: {formatDate(submission.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">提交数据</TabsTrigger>
              <TabsTrigger value="meta">元数据</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4 pt-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>表单数据</span>
                    <Button variant="outline" onClick={copyData} className="gap-2">
                      <Copy className="h-4 w-4" />
                      复制数据
                    </Button>
                  </CardTitle>
                  <CardDescription>用户提交的表单数据</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                    <pre className="text-sm">{JSON.stringify(submission.data, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meta" className="space-y-4 pt-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>提交元数据</CardTitle>
                  <CardDescription>关于此次提交的技术信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">提交 ID</div>
                      <div className="p-2 bg-muted rounded-md">
                        <code className="text-xs">{submission.id}</code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">提交时间</div>
                      <div className="p-2 bg-muted rounded-md">{formatDate(submission.createdAt)}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">IP 地址</div>
                      <div className="p-2 bg-muted rounded-md">{submission.ip}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">表单</div>
                      <div className="p-2 bg-muted rounded-md flex items-center gap-2">
                        <span>{submission.form.name}</span>
                        <Badge variant="outline">{submission.formId}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium">User Agent</div>
                      <div className="p-2 bg-muted rounded-md overflow-x-auto">
                        <code className="text-xs">{submission.userAgent}</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>提交信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">所属用户</div>
                <div className="p-2 bg-muted rounded-md">{submission.user.name}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">表单</div>
                <div className="p-2 bg-muted rounded-md">{form.name}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">提交时间</div>
                <div className="p-2 bg-muted rounded-md">{formatDate(submission.createdAt)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={copyData}>
                <Copy className="h-4 w-4" />
                复制数据
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Flag className="h-4 w-4" />
                标记为重要
              </Button>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={deleteSubmission} className="gap-2">
                <Trash2 className="h-4 w-4" />
                删除记录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
