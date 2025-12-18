# 数据库配置指南 - 解决 "Database not configured" 错误

## 问题诊断

如果遇到 "Database not configured" 错误，通常是因为：
1. 缺少 `.env` 文件或 `DATABASE_URL` 环境变量未设置
2. 数据库容器未运行
3. 数据库连接字符串配置错误

## 快速修复步骤

### 步骤 1: 创建 .env 文件

在项目根目录（`Cwritev5-main`）创建 `.env` 文件，添加以下内容：

```env
DATABASE_URL="postgresql://postgres:museaiwrite123@localhost:5433/museaiwrite?schema=public"
```

**注意**: 如果使用不同的数据库配置，请相应修改连接字符串。

### 步骤 2: 启动数据库容器

根据 `DATABASE-SETUP-COMPLETE.md`，数据库容器应该已经创建。启动容器：

```powershell
# 启动数据库容器
docker start museaiwrite-db

# 检查容器状态
docker ps | Select-String -Pattern "museaiwrite"
```

如果容器不存在，需要先创建：

```powershell
# 创建并启动 PostgreSQL 容器
docker run --name museaiwrite-db `
  -e POSTGRES_PASSWORD=museaiwrite123 `
  -e POSTGRES_DB=museaiwrite `
  -p 5433:5432 `
  -d postgres:15
```

### 步骤 3: 初始化数据库

```powershell
# 进入项目目录
cd Cwritev5-main

# 生成 Prisma Client
npm run db:generate

# 推送 schema 到数据库（创建表）
npm run db:push

# 初始化用户数据（可选）
npm run db:init
```

### 步骤 4: 验证配置

```powershell
# 打开 Prisma Studio 验证数据库连接
npm run db:studio
```

如果 Prisma Studio 能正常打开并显示表结构，说明配置成功。

## 不同环境的配置

### 本地开发（Docker）

```env
DATABASE_URL="postgresql://postgres:museaiwrite123@localhost:5433/museaiwrite?schema=public"
```

### 本地 PostgreSQL（非 Docker）

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/museaiwrite?schema=public"
```

### Vercel 部署

1. 在 Vercel 项目设置中添加 Postgres 数据库
2. Vercel 会自动设置 `DATABASE_URL` 环境变量
3. 在构建时运行：
   ```bash
   npm run db:generate
   npm run db:push
   ```

### 其他云数据库（Supabase, Railway, Neon）

使用提供的连接字符串：

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

## 常见问题

### 1. Docker Desktop 未运行

**错误**: `error during connect: The system cannot find the file specified`

**解决**: 启动 Docker Desktop 应用程序

### 2. 端口被占用

**错误**: `port is already allocated`

**解决**: 
- 检查是否有其他容器使用相同端口
- 或修改端口映射（如 `-p 5434:5432`）

### 3. 连接被拒绝

**错误**: `connection refused`

**解决**:
- 确认数据库容器正在运行：`docker ps`
- 检查端口是否正确
- 验证连接字符串中的主机和端口

### 4. 认证失败

**错误**: `password authentication failed`

**解决**:
- 检查 `.env` 文件中的密码是否正确
- 确认数据库用户名和密码匹配

## 测试数据库连接

运行以下命令测试连接：

```powershell
# 使用 Prisma 测试连接
npx prisma db pull

# 或使用 Prisma Studio
npm run db:studio
```

## 下一步

配置完成后：
1. 重启开发服务器：`npm run dev`
2. 尝试登录系统
3. 如果仍有问题，检查控制台错误信息

