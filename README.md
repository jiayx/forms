# Forms 项目

一个基于 Cloudflare Workers 和 React Router 构建的现代化表单管理系统，支持用户认证、表单创建、数据收集和管理。

## 项目架构

这是一个 monorepo 项目，使用 pnpm workspace 管理，包含以下模块：

- **apps/api** - Cloudflare Workers API 后端 (Hono 框架)
- **apps/web** - React Router 前端应用
- **packages/db** - 数据库模式和迁移 (Drizzle ORM + Cloudflare D1)
- **packages/shared** - 共享类型和工具函数

## 技术栈

### 后端 (API)
- **Cloudflare Workers** - 边缘计算平台
- **Hono** - 轻量级 Web 框架
- **Cloudflare D1** - SQLite 数据库
- **Drizzle ORM** - 类型安全的 ORM
- **JWT** - 用户认证 (jose)
- **Resend** - 邮件服务
- **bcryptjs** - 密码加密

### 前端 (Web)
- **React Router v7** - 全栈 React 框架
- **React 19** - UI 库
- **Tailwind CSS** - 样式框架
- **Radix UI** - 无障碍组件库
- **TanStack Query** - 数据获取和缓存
- **Lucide React** - 图标库

### 数据库
- **Cloudflare D1** - 分布式 SQLite
- **Drizzle ORM** - 数据库操作
- **Zod** - 数据验证

## 功能特性

- 🔐 用户注册和登录系统
- 📝 动态表单创建和编辑
- 📊 表单提交数据管理
- 🔒 基于角色的权限控制
- 📧 邮件通知功能
- 🌐 跨域请求支持
- 📱 响应式设计
- ⚡ 边缘计算性能优化

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Cloudflare 账户

### 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

2. 配置 Cloudflare 相关环境变量：
```bash
# .env 文件
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_d1_token

# .dev.vars 文件 (本地开发)
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
```

### 数据库设置

1. 创建 Cloudflare D1 数据库：
```bash
wrangler d1 create forms
```

2. 生成并应用数据库迁移：
```bash
# 本地开发环境
pnpm migrate:local

# 生产环境
pnpm migrate:remote
```

### 开发模式

启动开发服务器：

```bash
# 启动 API 服务 (Cloudflare Workers)
pnpm dev:api

# 启动 Web 应用 (新终端)
pnpm dev:web
```

- API 服务: http://localhost:8787
- Web 应用: http://localhost:5173

## 可用脚本

### 根目录脚本
```bash
pnpm dev:api          # 启动 API 开发服务器
pnpm dev:web          # 启动 Web 开发服务器
pnpm build:web        # 构建 Web 应用
pnpm migrate:gen      # 生成数据库迁移文件
pnpm migrate:local    # 应用本地数据库迁移
pnpm migrate:remote   # 应用远程数据库迁移
pnpm run deploy           # 部署到 Cloudflare
```

### 数据库操作
```bash
# 生成迁移文件
pnpm migrate:gen

# 推送模式到本地数据库
pnpm migrate:local

# 推送模式到远程数据库
pnpm migrate:remote
```

## 项目结构

```
forms/
├── apps/
│   ├── api/                 # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── handlers/    # API 路由处理器
│   │   │   └── index.ts     # 入口文件
│   │   └── package.json
│   └── web/                 # React Router 前端
│       ├── app/             # 应用路由和组件
│       ├── public/          # 静态资源
│       └── package.json
├── packages/
│   ├── db/                  # 数据库模式和迁移
│   │   ├── migrations/      # 数据库迁移文件
│   │   ├── schema.ts        # 数据库模式定义
│   │   └── drizzle.config.ts
│   └── shared/              # 共享代码
├── wrangler.jsonc           # Cloudflare Workers 配置
├── pnpm-workspace.yaml      # pnpm workspace 配置
└── package.json
```

## 数据库模式

系统包含以下主要数据表：

- **users** - 用户信息和认证
- **user_refresh_tokens** - 刷新令牌管理
- **forms** - 表单定义和配置
- **fields** - 表单字段配置
- **submissions** - 表单提交数据

## API 端点

主要 API 路由：

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/forms` - 获取表单列表
- `POST /api/forms` - 创建新表单
- `GET /api/forms/:id` - 获取表单详情
- `POST /api/forms/:id/submit` - 提交表单数据

## 部署

### 生产部署

1. 构建并部署到 Cloudflare：
```bash
pnpm run deploy
```

2. 确保环境变量已在 Cloudflare Workers 中配置

### 环境变量

生产环境需要配置以下变量：
- `JWT_SECRET` - JWT 签名密钥
- `RESEND_API_KEY` - Resend 邮件服务 API 密钥

## 开发指南

### 添加新的 API 路由

1. 在 `apps/api/src/handlers/` 中创建新的处理器
2. 在路由文件中注册新路由
3. 更新共享类型定义

### 添加新的数据库表

1. 在 `packages/db/schema.ts` 中定义新表
2. 生成迁移文件：`pnpm migrate:gen`
3. 应用迁移：`pnpm migrate:local` 或 `pnpm migrate:remote`

### 前端开发

- 使用 React Router 的文件系统路由
- 组件库基于 Radix UI 和 Tailwind CSS
- 使用 TanStack Query 进行数据管理

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 Cloudflare D1 配置
   - 确认环境变量设置正确

2. **认证问题**
   - 检查 JWT_SECRET 配置
   - 确认令牌未过期

3. **CORS 错误**
   - 检查 allowedOrigins 配置
   - 确认请求头设置正确

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
