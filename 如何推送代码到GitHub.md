# 如何推送代码到 GitHub

## ⚠️ 当前状态
系统检测到 Git 未安装。请先安装 Git。

---

## 方法 1: 安装 Git 后使用命令行（推荐）

### 步骤 1: 安装 Git

1. **下载 Git for Windows**
   - 访问: https://git-scm.com/download/win
   - 下载并安装（使用默认设置即可）

2. **验证安装**
   - 重新打开 PowerShell
   - 运行: `git --version`
   - 应该显示 Git 版本号

### 步骤 2: 推送代码

在项目目录 (`C:\Users\liut\Downloads\code`) 打开 PowerShell，运行：

```powershell
.\push-to-github.ps1
```

或者手动执行：

```powershell
# 初始化仓库
git init
git branch -M main

# 添加远程仓库
git remote add origin https://github.com/liutong011025-cloud/MuseAIX9.git

# 添加文件
git add .

# 提交
git commit -m "Update: Fix Prisma build issue and Dify API configuration for Vercel deployment"

# 推送
git push -u origin main
```

---

## 方法 2: 使用 GitHub Desktop（图形界面，更简单）

### 步骤 1: 安装 GitHub Desktop

1. 访问: https://desktop.github.com/
2. 下载并安装 GitHub Desktop
3. 登录你的 GitHub 账户

### 步骤 2: 添加仓库

1. 打开 GitHub Desktop
2. 点击 "File" → "Add Local Repository"
3. 选择项目目录: `C:\Users\liut\Downloads\code`
4. 如果提示不是 Git 仓库，点击 "create a repository"
   - Name: `MuseAIX9`
   - 选择本地路径: `C:\Users\liut\Downloads\code`
   - 点击 "Create Repository"

### 步骤 3: 发布到 GitHub

1. 在 GitHub Desktop 中，点击 "Publish repository"
2. 确保仓库名称是: `MuseAIX9`
   - 如果需要，取消勾选 "Keep this code private"
3. 点击 "Publish Repository"
4. 等待上传完成

---

## 身份验证

如果推送时要求输入用户名和密码：

- **用户名**: 你的 GitHub 用户名
- **密码**: 使用 **Personal Access Token (PAT)**，不是账户密码

### 创建 Personal Access Token:

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称: `Vercel Deployment`
4. 选择权限: 勾选 `repo` (全部仓库权限)
5. 点击 "Generate token"
6. **复制并保存 token**（只显示一次）

---

## 如果远程仓库已有内容

如果 GitHub 仓库已经有一些文件，需要先拉取：

```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 本次更新内容

✅ 修复 Prisma 构建问题（添加 postinstall 脚本）
✅ 修复所有 Dify API 配置（统一使用环境变量）
✅ 添加编辑页面到 Gallery 的跳转功能
✅ 添加 Gallery 返回编辑页面的功能

---

## 推荐方式

**如果你是第一次使用 Git**，推荐使用 **GitHub Desktop**（方法 2），界面更友好，操作更简单。

**如果你熟悉命令行**，推荐使用 **Git 命令行**（方法 1），更灵活。

