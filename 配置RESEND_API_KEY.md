# 配置 RESEND_API_KEY 用于发送信件

## 问题

信件发送功能需要 `RESEND_API_KEY` 环境变量才能工作。如果没有配置，会显示错误：
```
Email service not configured. Please set RESEND_API_KEY environment variable.
```

## 解决方案

### 步骤 1: 获取 Resend API Key

1. 访问 Resend 官网: https://resend.com/
2. 注册/登录账户
3. 进入 Dashboard → API Keys
4. 创建新的 API Key
5. 复制 API Key（只显示一次，请保存）

### 步骤 2: 在 Vercel 中配置

1. 在 Vercel 项目设置中，进入 **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 配置：
   - **Name**: `RESEND_API_KEY`
   - **Value**: 粘贴你的 Resend API Key
   - **Environments**: 选择所有（Production, Preview, Development）
4. 点击 **Save**

### 步骤 3: 配置发送域名（重要）

Resend 需要验证发送域名才能发送邮件：

1. 在 Resend Dashboard 中，进入 **Domains**
2. 添加你的域名（如 `museaiwrite.com`）
3. 按照说明配置 DNS 记录
4. 验证域名

**或者使用测试模式**：
- Resend 提供测试模式，可以在开发环境中使用
- 但生产环境需要验证域名

### 步骤 4: 更新发送地址

在 `app/api/send-letter-email/route.ts` 中，更新发送地址：

```typescript
from: 'MuseAIWrite <noreply@yourdomain.com>', // 替换为你的验证域名
```

### 步骤 5: 重新部署

配置完成后，重新部署应用：
1. 在 Vercel 项目页面，进入 **Deployments**
2. 找到最新部署，点击 **"..."** → **"Redeploy"**

## 替代方案

如果暂时不想配置 Resend，可以：

1. **禁用邮件发送功能**：在前端隐藏"Send by Email"按钮
2. **使用其他邮件服务**：如 SendGrid、Mailgun 等
3. **仅保存到数据库**：信件已保存到数据库，可以稍后手动发送

## 检查清单

- [ ] 已注册 Resend 账户
- [ ] 已创建 API Key
- [ ] 已在 Vercel 中配置 `RESEND_API_KEY`
- [ ] 已配置发送域名（或使用测试模式）
- [ ] 已更新发送地址
- [ ] 已重新部署应用

## 测试

配置完成后，测试发送功能：
1. 完成一封信件
2. 输入收件人邮箱
3. 点击 "Send Letter"
4. 检查是否成功发送

