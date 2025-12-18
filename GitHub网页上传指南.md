# GitHub 网页上传文件指南

## ✅ 需要上传的文件和文件夹

### 📁 核心代码文件
- ✅ `app/` - 所有应用代码
- ✅ `components/` - 所有组件
- ✅ `lib/` - 工具库
- ✅ `prisma/` - 数据库结构（schema.prisma）
- ✅ `public/` - 静态资源（图片等）
- ✅ `scripts/` - 脚本文件
- ✅ `hooks/` - React hooks

### 📄 配置文件
- ✅ `package.json` - **必须上传**（Vercel 需要它来安装依赖）
- ✅ `package-lock.json` - **必须上传**（锁定依赖版本）
- ✅ `next.config.mjs` - Next.js 配置
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `postcss.config.mjs` - PostCSS 配置
- ✅ `components.json` - 组件配置
- ✅ `vercel.json` - Vercel 配置（如果有）

### 📄 文档文件（可选）
- ✅ `README.md`
- ✅ `DIFY_APPS_CONFIG.md`
- ✅ `.gitignore` - **必须上传**（确保忽略不需要的文件）

---

## ❌ 不要上传的文件和文件夹

### 🚫 依赖和构建文件
- ❌ `node_modules/` - **不要上传**（太大，Vercel 会自动安装）
- ❌ `.next/` - Next.js 构建输出
- ❌ `out/` - 构建输出

### 🚫 环境变量和敏感信息
- ❌ `.env` - 环境变量（包含敏感信息）
- ❌ `.env.local`
- ❌ `.env.production`

### 🚫 其他
- ❌ `.vercel/` - Vercel 本地配置
- ❌ `*.log` - 日志文件
- ❌ `.DS_Store` - macOS 系统文件
- ❌ `Thumbs.db` - Windows 系统文件

---

## 📋 上传步骤

### 方法 1: 拖拽整个文件夹（推荐）

1. 打开 GitHub 仓库: https://github.com/liutong011025-cloud/MuseAIX9
2. 点击 "Add file" → "Upload files"
3. **不要直接拖拽整个项目文件夹**（会包含 node_modules）
4. 只拖拽以下文件夹和文件：
   - `app/`
   - `components/`
   - `lib/`
   - `prisma/`
   - `public/`
   - `scripts/`
   - `hooks/`
   - `package.json`
   - `package-lock.json`
   - `next.config.mjs`
   - `tsconfig.json`
   - `postcss.config.mjs`
   - `components.json`
   - `.gitignore`
   - `README.md`（如果有）

### 方法 2: 逐个文件夹上传

如果拖拽整个文件夹会包含 node_modules，可以：

1. 在文件资源管理器中，**复制**项目文件夹到新位置
2. **删除** `node_modules` 文件夹
3. **删除** `.next` 文件夹（如果有）
4. **删除** `.env` 文件（如果有）
5. 然后拖拽这个清理后的文件夹到 GitHub

---

## ⚠️ 重要提示

### 1. 确保上传 `.gitignore`
- 这个文件告诉 GitHub 哪些文件应该被忽略
- 即使你手动上传，`.gitignore` 也会在后续 Git 操作中生效

### 2. 必须上传 `package.json`
- Vercel 需要这个文件来知道安装哪些依赖
- 没有它，Vercel 无法构建项目

### 3. 不要上传 `node_modules`
- 这个文件夹通常有几百 MB 到几 GB
- GitHub 有文件大小限制（100MB 单个文件）
- Vercel 会根据 `package.json` 自动安装依赖

### 4. 环境变量在 Vercel 中配置
- 不要上传 `.env` 文件
- 在 Vercel 项目设置中配置环境变量：
  - `DIFY_API_KEY`
  - `DATABASE_URL`

---

## 🚀 上传后

1. 提交更改（填写提交信息，如："Initial commit"）
2. Vercel 会自动检测到 GitHub 仓库的更新
3. Vercel 会自动开始构建和部署
4. 在 Vercel 控制台查看构建日志

---

## 📝 提交信息建议

```
Initial commit: MuseAIWriteX9 - AI-powered story writing platform

- Fix Prisma build issue for Vercel
- Fix Dify API configuration
- Add edit page to gallery navigation
- Add gallery back to edit functionality
```

---

## ✅ 快速检查清单

上传前确认：
- [ ] 已删除 `node_modules` 文件夹
- [ ] 已删除 `.next` 文件夹（如果有）
- [ ] 已删除 `.env` 文件（如果有）
- [ ] 已上传 `package.json`
- [ ] 已上传 `package-lock.json`
- [ ] 已上传 `.gitignore`
- [ ] 已上传所有源代码文件夹（app, components, lib 等）

