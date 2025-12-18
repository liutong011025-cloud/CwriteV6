# Vercel Postgres 数据库设置步骤

## ✅ 步骤 1: 在 Vercel 中获取 DATABASE_URL

### 方法 A: 从数据库设置页面获取（推荐）

1. 在 Vercel 项目设置中，进入 **Storage** → 你的数据库
2. 找到 **Connection String** 或 **.env** 部分
3. 复制 `DATABASE_URL` 的值
4. 或者点击 **"Add to Project"** 按钮，Vercel 会自动添加到环境变量

### 方法 B: 手动添加到环境变量

1. 在 Vercel 项目设置中，进入 **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 名称: `DATABASE_URL`
4. 值: 从数据库设置页面复制的连接字符串
5. 环境: 选择所有（Production, Preview, Development）
6. 点击 **Save**

## ✅ 步骤 2: 运行数据库迁移（创建表结构）

数据库创建后是空的，需要创建表结构。有两种方式：

### 方式 A: 在 Vercel 中运行（如果支持）

1. 在数据库设置页面，查看是否有 **"Run Migration"** 或 **"Initialize Schema"** 按钮
2. 如果有，点击运行

### 方式 B: 在本地运行迁移（推荐）

由于你的项目已经有 `prisma/schema.prisma` 文件，可以在本地运行：

```bash
# 1. 确保在项目目录
cd C:\Users\liut\Downloads\code

# 2. 拉取环境变量到本地（如果使用 Vercel CLI）
# 如果没有安装 Vercel CLI，可以手动创建 .env.local 文件

# 3. 运行数据库迁移
npx prisma db push
```

或者使用迁移：

```bash
npx prisma migrate dev --name init
```

### 方式 C: 使用 SQL 脚本（如果之前有）

如果你之前有创建表的 SQL 脚本（如 `scripts/create-tables.sql`），可以：

1. 在数据库设置页面找到 **SQL Editor** 或 **Query** 功能
2. 复制 SQL 脚本内容
3. 执行 SQL 脚本

## ✅ 步骤 3: 初始化用户数据（可选）

如果需要初始化用户数据，可以：

1. 使用 Prisma Studio:
```bash
npx prisma studio
```

2. 或者运行初始化脚本（如果有）:
```bash
npm run db:init
```

3. 或者手动在数据库中插入用户数据

## ✅ 步骤 4: 重新部署应用

1. 在 Vercel 项目页面，进入 **Deployments**
2. 找到最新部署，点击 **"..."** → **"Redeploy"**
3. 或者推送新代码到 GitHub，Vercel 会自动部署

## 🔍 验证步骤

部署完成后：

1. 访问你的应用
2. 尝试登录
3. 如果仍有错误，查看 Vercel 的 **Function Logs**

## 📋 检查清单

- [ ] `DATABASE_URL` 环境变量已在 Vercel 中配置
- [ ] 数据库表结构已创建（运行了迁移）
- [ ] 用户数据已初始化（如果需要）
- [ ] 应用已重新部署
- [ ] 登录功能正常工作

