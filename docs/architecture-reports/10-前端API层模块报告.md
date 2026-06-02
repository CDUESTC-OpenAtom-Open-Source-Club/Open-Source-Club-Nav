# 10 - 前端 API 层模块报告

> 模块路径：`frontend/apps/web/src/app/api/`  
> 分析文件：23 个 API Route 文件

---

## 1. 模块职责

API Route 模块是 Next.js 的 BFF（Backend For Frontend）层，负责：
- 将前端请求转发到后端 Go 服务
- 处理认证 Cookie 的读写
- 聚合多个后端接口的响应
- 屏蔽后端 API 的实现细节

---

## 2. 代码质量评估

### 命名规范
- ✅ 使用 Next.js App Router 的 `route.ts` 约定
- ⚠️ 部分路由嵌套过深

### 注释质量
- 🔴 几乎所有 API Route 都没有注释
- 🔴 缺少请求/响应格式说明

---

## 3. 架构合理性评估

### 🔴 高风险问题

1. **大量重复代码**
   - 23 个 API Route 文件中，每个都独立实现：
     - 从 Cookie 读取 Token
     - 构建后端请求 URL
     - 设置请求头
     - 处理错误响应
   - 这段逻辑在 23 个文件中重复出现
   - **建议**：提取公共 `fetchBackend()` 工具函数

2. **缺少统一的错误处理**
   - 每个文件独立处理错误
   - 错误响应格式不一致
   - **建议**：创建统一的错误处理中间件

3. **硬编码后端 URL**
   - 部分文件使用 `process.env.NEXT_PUBLIC_BACKEND_API_URL`
   - 部分文件硬编码 `http://localhost:8080`
   - **建议**：统一使用环境变量

### ⚠️ 中等问题

4. **缺少请求验证**
   - API Route 不验证请求体格式
   - 直接将前端请求转发给后端

5. **缺少缓存策略**
   - GET 请求没有使用 Next.js 的 `revalidate`
   - 每次都实时请求后端

---

## 4. 发现的问题和缺陷

| # | 严重程度 | 问题描述 |
|---|---------|---------|
| 1 | 🔴 高 | 23 个文件重复认证和错误处理逻辑 |
| 2 | 🔴 高 | 部分文件硬编码后端 URL |
| 3 | 🟡 中 | 缺少请求体验证 |
| 4 | 🟡 中 | 缺少缓存策略 |
| 5 | 🟠 低 | 所有文件缺少注释 |

---

## 5. 改进建议

1. **提取公共请求工具**：
   ```typescript
   // lib/backend-proxy.ts（已存在但可能未被充分使用）
   export async function fetchBackend(path: string, options?: RequestInit) {
     const token = cookies().get('admin_token')?.value;
     const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${path}`;
     // 统一处理认证、错误、重试
   }
   ```

2. **添加请求验证**：使用 Zod schema 验证请求体

3. **添加缓存**：对 GET 请求使用 `next: { revalidate: 60 }`

---

## 6. 总结

API 层的核心问题是 **大量重复代码**，23 个文件各自实现认证和错误处理。这是一个典型的 DRY 违反，应优先提取公共逻辑。
