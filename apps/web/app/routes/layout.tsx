import { Outlet, NavLink, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ModeToggle } from '@/components/mode-toggle'
import { Users, FileText, Settings } from 'lucide-react'
import { useLogout, useUser } from '@/hooks/use-auth'
import { useUsers } from '@/hooks/use-user'
import { useImpersonateId, setImpersonateId, ALL_USER } from '@/hooks/use-impersonate'

const navigation = [
  { name: '表单管理', href: '/forms', icon: FileText },
  { name: '用户管理', href: '/users', icon: Users },
]

export default function Layout() {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()

  const { mutate: logoutMutate } = useLogout()
  const { data: user } = useUser()
  const { data: users } = useUsers()
  const { data: impersonateId } = useImpersonateId()

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-blue-600 text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-semibold text-lg">表单管理系统</span>
            </NavLink>

            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink key={item.name} to={item.href}>
                    <Button
                      variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2 transition-all duration-200 hover:bg-muted"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Select value={impersonateId || ''} onValueChange={setImpersonateId}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_USER}>所有用户</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <ModeToggle />

            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="用户头像" />
                    <AvatarFallback>用户</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{user?.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>个人设置</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-b bg-background">
        <div className="container">
          <nav className="flex overflow-x-auto py-2 gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.name} to={item.href}>
                  <Button
                    variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6">
        <div className="relative">
          <div className="absolute -top-6 -right-6 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
