# Vercel 500 错误修复指南 - /api/auth

## 🔍 错误分析

错误发生在：`POST /api/auth` 返回 500 Internal Server Error

这通常是因为：
1. **DATABASE_URL 环境变量未配置** - Vercel 项目设置中缺少数据库连接字符串
2. **数据库连接失败** - 数据库服务器无法访问或连接字符串错误
3. **Prisma Client 未正确生成** - 构建时 Prisma Client 生成失败

## ✅ 解决步骤

### 步骤 1: 检查 Vercel 环境变量

1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 选择项目 `c-write-v5-5` (或你的项目名称)
3. 进入 **Settings** → **Environment Variables**
4. 检查是否存在 `DATABASE_URL` 变量

**如果不存在，需要添加：**

#### 选项 A: 使用 Vercel Postgres（推荐）

1. 在项目设置中，点击 **Storage** 标签
2. 点击 **Create Database** → 选择 **Postgres**
3. 创建数据库后，Vercel 会自动添加 `DATABASE_URL` 环境变量
4. 复制连接字符串（如果需要手动添加）

#### 选项 B: 使用外部数据库

如果你已经有数据库（如 Supabase, Railway, Neon），手动添加：

1. 点击 **Add New** 按钮
2. **Key**: `DATABASE_URL`
3. **Value**: 你的数据库连接字符串
   ```
   postgresql://用户名:密码@主机:端口/数据库名?schema=public
   ```
4. **Environment**: 选择所有环境（Production, Preview, Development）
5. 点击 **Save**

### 步骤 2: 运行数据库迁移

在 Vercel 上，数据库迁移需要在构建时运行。检查 `package.json` 中的构建脚本：

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**如果数据库是新创建的，需要推送 schema：**

#### 方法 A: 在本地推送（推荐）

1. 在本地项目目录中，设置环境变量：
   ```powershell
   # 从 Vercel 复制 DATABASE_URL
   $env:DATABASE_URL="你的数据库连接字符串"
   ```

2. 运行迁移：
   ```powershell
   npm run db:push
   ```

3. 初始化用户数据（可选）：
   ```powershell
   npm run db:init
   ```

#### 方法 B: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 运行迁移
npx prisma db push
```

### 步骤 3: 重新部署

1. 在 Vercel Dashboard 中，进入 **Deployments**
2. 点击最新部署右侧的 **⋯** 菜单
3. 选择 **Redeploy**
4. 等待部署完成

### 步骤 4: 查看详细错误日志

1. 在 Vercel Dashboard 中，进入 **Deployments**
2. 选择最新的部署
3. 点击 **View Function Logs** 或 **View Build Logs**
4. 查找以下错误信息：
   - `DATABASE_URL is not configured`
   - `Can't reach database server`
   - `PrismaClientInitializationError`
   - `Connection refused`

## 🔧 快速诊断命令

在本地测试 Vercel 环境变量：

```powershell
# 1. 拉取 Vercel 环境变量到本地
vercel env pull .env.local

# 2. 检查环境变量
Get-Content .env.local | Select-String "DATABASE_URL"

# 3. 测试数据库连接
$env:DATABASE_URL = (Get-Content .env.local | Select-String "DATABASE_URL").ToString().Split("=")[1]
npx prisma db pull

# 4. 如果连接成功，推送 schema
npx prisma db push
```

## 📋 检查清单

- [ ] Vercel 项目设置中有 `DATABASE_URL` 环境变量
- [ ] `DATABASE_URL` 格式正确（postgresql://...）
- [ ] 数据库服务器允许外部连接
- [ ] 数据库表已创建（运行了 `prisma db push`）
- [ ] 用户数据已初始化（运行了 `npm run db:init`）
- [ ] 重新部署了应用
- [ ] 查看了 Vercel 函数日志

## 🚨 常见错误及解决方案

### 错误 1: "Database not configured"

**原因**: `DATABASE_URL` 环境变量未设置

**解决**: 在 Vercel 项目设置中添加 `DATABASE_URL`

### 错误 2: "Can't reach database server"

**原因**: 数据库连接字符串错误或数据库服务器无法访问

**解决**: 
- 检查连接字符串格式
- 确认数据库服务器允许外部连接
- 如果使用 Vercel Postgres，确保数据库已创建

### 错误 3: "relation 'users' does not exist"

**原因**: 数据库表未创建

**解决**: 运行 `npx prisma db push` 创建表结构

### 错误 4: "PrismaClientInitializationError"

**原因**: Prisma Client 初始化失败

**解决**:
- 确保 `package.json` 中有 `postinstall: prisma generate`
- 重新部署应用
- 检查构建日志中的 Prisma 错误

## 📞 获取帮助

如果问题仍然存在：

1. **查看 Vercel 日志**: 在 Dashboard → Deployments → 最新部署 → Function Logs
2. **检查网络连接**: 确认数据库服务器可以从 Vercel 的网络访问
3. **验证环境变量**: 在 Vercel Dashboard 中确认 `DATABASE_URL` 已正确设置
4. **测试本地连接**: 使用相同的 `DATABASE_URL` 在本地测试连接

## 🎯 推荐配置（Vercel Postgres）

1. **创建 Vercel Postgres 数据库**
   - 在项目设置 → Storage → Create Database → Postgres
   - Vercel 会自动配置 `DATABASE_URL`

2. **在本地初始化数据库**
   ```powershell
   # 拉取环境变量
   vercel env pull .env.local
   
   # 推送 schema
   npx prisma db push
   
   # 初始化用户
   npm run db:init
   ```

3. **重新部署**
   - 在 Vercel Dashboard 中触发新的部署

这样配置后，应用应该可以正常工作了！

