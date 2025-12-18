# 迁移数据到 Vercel Postgres

## 方法 1: 使用 Prisma Studio（推荐，最简单）

### 步骤 1: 从旧数据库导出数据

1. **启动 Docker 数据库**（如果还没运行）：
   ```bash
   docker-compose up -d museaiwrite-db
   ```

2. **临时修改 .env 指向旧数据库**：
   在 `.env` 中确保：
   ```
   DATABASE_URL=postgresql://postgres:museaiwrite123@localhost:5433/museaiwrite?schema=public
   ```

3. **打开 Prisma Studio 查看旧数据**：
   ```bash
   npx prisma studio
   ```
   在浏览器中打开 http://localhost:5555

4. **手动复制数据**：
   - 查看 `User` 表，复制所有用户数据
   - 查看其他表（Story, Review, Letter, Interaction）的数据

### 步骤 2: 导入到新数据库

1. **修改 .env 指向新数据库**：
   在 `.env` 中：
   ```
   DATABASE_URL="postgres://ad197383013bd65c22c08e54d55aa8c23715921ce9db34862b10c924cb1739e1:sk_lsS2QBriO5jAZ3w9kQVcm@db.prisma.io:5432/postgres?sslmode=require"
   ```

2. **打开 Prisma Studio**：
   ```bash
   npx prisma studio
   ```

3. **手动添加数据**：
   - 在 `User` 表中添加用户
   - 添加其他需要的数据

---

## 方法 2: 使用 SQL 导出/导入（适合大量数据）

### 步骤 1: 从 Docker 数据库导出

1. **导出数据**：
   ```bash
   docker exec -i museaiwrite-db pg_dump -U postgres -d museaiwrite --data-only --inserts > backup.sql
   ```

2. **或者只导出用户表**：
   ```bash
   docker exec -i museaiwrite-db psql -U postgres -d museaiwrite -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv
   ```

### 步骤 2: 导入到 Vercel Postgres

由于 Vercel Postgres 可能没有直接的 SQL 执行界面，可以使用：

1. **使用 Prisma Studio** 手动导入
2. **或者使用 psql 命令行工具**（如果已安装）

---

## 方法 3: 使用初始化脚本（如果只需要用户数据）

如果你只需要初始化用户数据，可以运行初始化脚本：

### 步骤 1: 确保连接到新数据库

`.env` 文件应该指向 Vercel Postgres：
```
DATABASE_URL="postgres://ad197383013bd65c22c08e54d55aa8c23715921ce9db34862b10c924cb1739e1:sk_lsS2QBriO5jAZ3w9kQVcm@db.prisma.io:5432/postgres?sslmode=require"
```

### 步骤 2: 运行初始化脚本

```bash
npm run db:init
```

或者直接运行：

```bash
npx tsx scripts/init-db.ts
```

这会创建所有用户。

---

## 方法 4: 使用数据库迁移工具（最专业）

如果你有大量数据需要迁移，可以使用专门的迁移工具或编写迁移脚本。

---

## 推荐流程

### 如果数据不多（推荐方法 1）：

1. 使用 Prisma Studio 从旧数据库查看数据
2. 切换到新数据库
3. 在 Prisma Studio 中手动添加数据

### 如果只需要用户数据（推荐方法 3）：

1. 确保 `.env` 指向 Vercel Postgres
2. 运行 `npm run db:init` 或 `npx tsx scripts/init-db.ts`

### 如果有大量数据：

1. 使用 SQL 导出/导入
2. 或编写迁移脚本

---

## 快速检查

迁移完成后，验证数据：

```bash
npx prisma studio
```

在浏览器中检查：
- `User` 表是否有用户数据
- 其他表是否有需要的数据

