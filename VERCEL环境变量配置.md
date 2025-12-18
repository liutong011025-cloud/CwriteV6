# Vercel 环境变量配置指南

## ⚠️ 构建错误原因

构建失败是因为 `DATABASE_URL` 环境变量在 Vercel 中未配置。

错误信息：
```
Invalid value undefined for datasource "db" provided to PrismaClient constructor.
It should have this form: { url: "CONNECTION_STRING" }
```

## ✅ 解决方案：在 Vercel 中配置环境变量

### 步骤 1: 进入 Vercel 项目设置

1. 登录 Vercel: https://vercel.com/dashboard
2. 选择你的项目 `MuseAIX9`
3. 点击 **Settings**（设置）
4. 点击 **Environment Variables**（环境变量）

### 步骤 2: 添加必需的环境变量

添加以下环境变量：

#### 1. DATABASE_URL（必须）

- **Name**: `DATABASE_URL`
- **Value**: 你的 PostgreSQL 数据库连接字符串
  - 格式: `postgresql://用户名:密码@主机:端口/数据库名?schema=public`
  - 示例: `postgresql://postgres:password@db.example.com:5432/museaiwrite?schema=public`
- **Environment**: 选择所有环境（Production, Preview, Development）

#### 2. DIFY_API_KEY（必须）

- **Name**: `DIFY_API_KEY`
- **Value**: 你的 Dify 平台 API 密钥
- **Environment**: 选择所有环境（Production, Preview, Development）

### 步骤 3: 保存并重新部署

1. 点击 **Save** 保存所有环境变量
2. 回到项目页面
3. 点击 **Deployments**（部署）
4. 找到最新的部署，点击 **...** → **Redeploy**（重新部署）

## 📋 环境变量清单

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ 是 | PostgreSQL 数据库连接字符串 |
| `DIFY_API_KEY` | ✅ 是 | Dify 平台 API 密钥 |

## 🔍 如何获取 DATABASE_URL

### 如果你使用 Vercel Postgres

1. 在 Vercel 项目设置中，点击 **Storage**（存储）
2. 创建或选择 Postgres 数据库
3. 在数据库设置中，找到 **Connection String**（连接字符串）
4. 复制连接字符串作为 `DATABASE_URL`

### 如果你使用外部 PostgreSQL 数据库

连接字符串格式：
```
postgresql://用户名:密码@主机地址:端口/数据库名?schema=public
```

示例：
```
postgresql://postgres:mypassword@db.example.com:5432/museaiwrite?schema=public
```

## 🔍 如何获取 DIFY_API_KEY

1. 登录 Dify 平台
2. 进入 **Settings**（设置）→ **API Keys**（API 密钥）
3. 创建新的 API Key 或使用现有的
4. 复制 API Key 作为 `DIFY_API_KEY`

## ⚠️ 重要提示

1. **不要**在代码中硬编码这些值
2. **不要**将 `.env` 文件上传到 GitHub
3. 环境变量在 Vercel 中配置后，需要重新部署才能生效
4. 确保所有环境（Production, Preview, Development）都配置了相同的变量

## ✅ 配置完成后

配置完环境变量并重新部署后，构建应该能够成功。

如果还有问题，检查：
- [ ] `DATABASE_URL` 格式是否正确
- [ ] 数据库是否可以从 Vercel 的网络访问
- [ ] `DIFY_API_KEY` 是否有效
- [ ] 是否选择了所有环境（Production, Preview, Development）

