import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Eye, Edit, Trash2, Users, Shield } from 'lucide-react'
import type { UserSelect } from '@forms/db/zod'
import type { UserInsertReq, UserUpdateReq } from '@forms/shared/schema/user'
import { formatDate } from '@/lib/utils'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-user'
import { toast } from 'sonner'

export default function UsersPage() {
  const { data: users, refetch } = useUsers()

  const { mutate: createUserMutate } = useCreateUser()
  const { mutate: updateUserMutate } = useUpdateUser()
  const { mutate: deleteUserMutate } = useDeleteUser()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSelect | null>(null)

  const handleUpsertUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (selectedUser) {
      // update
      const updatedUser: UserUpdateReq = {
        id: selectedUser.id,
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        password: (formData.get('password') as string) || undefined,
        role: formData.get('role') as 'admin' | 'user',
        isActive: (formData.get('status') as string) == 'active',
      }
      updateUserMutate(
        { id: selectedUser.id, body: updatedUser },
        {
          onSuccess: () => {
            toast('用户更新成功', {
              description: `用户 "${updatedUser.email}" 已成功更新`,
            })
            refetch()
            setIsDialogOpen(false)
          },
        }
      )
      return
    }

    // create
    const newUser: UserInsertReq = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as 'admin' | 'user',
      isActive: (formData.get('status') as string) == 'active',
    }

    createUserMutate(newUser, {
      onSuccess: () => {
        toast('用户创建成功', {
          description: `用户 "${newUser.email}" 已成功创建`,
        })
        refetch()
        setIsDialogOpen(false)
      },
    })
  }

  const handleDeleteUser = async (user: UserSelect) => {
    if (confirm(`确定要删除用户 "${user.email}" 吗？此操作不可撤销。`)) {
      deleteUserMutate(user.id, {
        onSuccess: () => {
          toast('用户已删除', {
            description: `用户 "${user.email}" 已成功删除`,
          })
          refetch()
        },
      })
    }
  }

  const handleUser = (user: UserSelect) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户账户和权限</p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            setSelectedUser(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          新增用户
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-xs text-muted-foreground">总用户数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{users.filter((u) => u.role === 'admin').length}</div>
                <div className="text-xs text-muted-foreground">管理员</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</div>
                <div className="text-xs text-muted-foreground">生效用户</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{users.filter((u) => !u.isActive).length}</div>
                <div className="text-xs text-muted-foreground">禁用用户</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>当前系统共有 {users.length} 个用户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'user' ? 'secondary' : 'default'} className="gap-1">
                      {user.role === 'user' ? '普通用户' : '管理员'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>{user.isActive ? '生效' : '禁用'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleUser(user)}>
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleUser(user)}>
                        <Edit className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user)}
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
        </CardContent>
      </Card>

      {/* 用户信息对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>用户信息</DialogTitle>
            <DialogDescription>用户信息和权限设置</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpsertUser} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">邮箱地址</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedUser?.name}
                  placeholder="请输入用户姓名"
                  required={selectedUser === null}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">密码</Label>
                <Input
                  id="edit-password"
                  name="password"
                  placeholder="请输入用户密码"
                  required={selectedUser === null}
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <div className="p-2 bg-muted rounded-md">
                  <Select name="role" defaultValue="user" required>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="user">普通用户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">账户状态</Label>
                <Select
                  name="status"
                  defaultValue={selectedUser ? (selectedUser.isActive ? 'active' : 'inactive') : 'active'}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择账户状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最后登录时间</Label>
                <Input
                  id="edit-lastLoginAt"
                  name="lastLoginAt"
                  defaultValue={selectedUser?.lastLoginAt || ''}
                  placeholder=""
                />
              </div>
              <div className="space-y-2">
                <Label>创建时间</Label>
                <Input id="edit-created" name="createdAt" defaultValue={selectedUser?.createdAt || ''} placeholder="" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">{selectedUser ? '更新' : '创建'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
