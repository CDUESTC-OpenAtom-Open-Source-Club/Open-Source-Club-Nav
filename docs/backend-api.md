# 后端 API 初版文档

本文档用于当前前后端对接的初步约定，内容以 `backend/router/router.go`、`backend/handler/*` 和 `backend/model/*` 的实际代码为准。

## 基础信息

- 后端目录：`backend/`
- 默认端口：`8080`
- Swagger 入口：`GET /swagger/*any`
- 数据库：MySQL，本地连接信息来自 `backend/config.local.yaml`
- 示例配置：`backend/config.example.yaml`
- 返回格式：JSON
- 鉴权方式：受保护接口读取 `Authorization` 请求头中的 JWT 字符串

> 注意：当前 `Authorization` 头直接传 token 字符串，不是 `Bearer <token>` 格式。后续如果要统一为 Bearer，需要同步修改 `AuthMiddleware`。

## 本地运行状态

当前新工作区已按以下端口完成本地联调：

| 服务 | 端口 | 状态 |
| --- | --- | --- |
| 前端 Next.js | `4000` | 已启动 |
| 后端 Gin | `8080` | 已启动 |
| MySQL | `3306` | 已启动 |

本地配置规则：

- `backend/config.local.yaml`：本机真实运行配置，已加入 `.gitignore`，不应提交。
- `backend/config.example.yaml`：可提交的示例配置，不包含真实密码。
- `backend/config.yaml`：旧配置文件已从新工作区删除，避免把本地敏感配置提交到远程。

## 通用响应

成功响应通常为：

```json
{
  "msg": "操作成功"
}
```

或：

```json
{
  "data": []
}
```

失败响应通常为：

```json
{
  "msg": "错误信息"
}
```

导航搜索接口失败时使用：

```json
{
  "error": "错误信息"
}
```

## 接口列表

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/register` | 否 | 用户注册 |
| `POST` | `/login` | 否 | 用户登录并返回 token |
| `GET` | `/nav/search` | 否 | 搜索导航项 |
| `GET` | `/backend/admin/list` | 是 | 获取管理员列表 |
| `GET` | `/swagger/*any` | 否 | Swagger UI |
| `GET` | `/debug/pprof/*any` | 否 | pprof 调试入口 |

## POST /register

用户注册接口。注册成功后默认角色为 `user`。

### 请求体

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "plain-password"
}
```

### 成功响应

```json
{
  "msg": "注册成功"
}
```

### 失败响应

`400`

```json
{
  "msg": "参数错误: ..."
}
```

`500`

```json
{
  "msg": "注册失败: ..."
}
```

## POST /login

账号密码登录，成功后返回 JWT token。

### 请求体

```json
{
  "username": "alice",
  "password": "plain-password"
}
```

### 成功响应

```json
{
  "token": "jwt-token-string"
}
```

### 失败响应

`400`

```json
{
  "msg": "参数错误"
}
```

`401`

```json
{
  "msg": "账号或密码错误"
}
```

`500`

```json
{
  "msg": "登录失败"
}
```

## GET /nav/search

搜索导航标题或内容中包含关键词的导航项。

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 是 | 搜索关键词 |

### 请求示例

```http
GET /nav/search?keyword=github
```

### 成功响应

```json
{
  "data": [
    {
      "ID": 1,
      "Title": "GitHub",
      "Content": "代码托管与开源协作平台",
      "CoverUrl": "",
      "LinkUrl": "https://github.com",
      "CreatedAt": "2026-05-26T00:00:00Z",
      "UpdatedAt": "2026-05-26T00:00:00Z"
    }
  ]
}
```

### 失败响应

`500`

```json
{
  "error": "搜索失败: ..."
}
```

## GET /backend/admin/list

获取管理员用户列表。该接口需要 JWT 鉴权。

### 请求头

```http
Authorization: jwt-token-string
```

### 成功响应

```json
{
  "data": [
    {
      "ID": 1,
      "Email": "admin@example.com",
      "Role": "admin",
      "CreatedAt": "2026-05-26T00:00:00Z",
      "UpdatedAt": "2026-05-26T00:00:00Z",
      "DeletedAt": null,
      "Username": "admin"
    }
  ]
}
```

### 失败响应

`401`

```json
{
  "msg": "缺少token"
}
```

或：

```json
{
  "msg": "token无效"
}
```

`500`

```json
{
  "msg": "查询失败"
}
```

## 数据模型

### User

当前 `model.User` 字段如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ID` | `uint` | 用户 ID |
| `Email` | `string` | 邮箱 |
| `PasswordHash` | `string` | 密码哈希字段 |
| `Role` | `string` | 用户角色，注册默认 `user` |
| `CreatedAt` | `time.Time` | 创建时间 |
| `UpdatedAt` | `time.Time` | 更新时间 |
| `DeletedAt` | `*time.Time` | 软删除时间 |
| `Username` | `string` | 用户名 |
| `Password` | `string` | 明文入参字段，注册时会 bcrypt 加密后写入 |

### NavItem

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ID` | `uint` | 导航项 ID |
| `Title` | `string` | 标题 |
| `Content` | `string` | 内容描述 |
| `CoverUrl` | `string` | 封面图地址 |
| `LinkUrl` | `string` | 目标跳转地址 |
| `CreatedAt` | `time.Time` | 创建时间 |
| `UpdatedAt` | `time.Time` | 更新时间 |

## 前端对接建议

- 登录成功后保存 `token`，访问 `/backend/*` 接口时放入 `Authorization` 请求头。
- 当前后端没有统一 CORS 配置。如果前端和后端分端口部署，需要补 CORS 中间件。
- 当前用户模型同时存在 `password_hash` 和 `password` 字段，注册逻辑实际写入 `password` 字段。后续建议统一为 `password_hash`，避免字段语义混乱。
- 当前 Swagger 文件已存在，但 `docs/swagger.yaml` 中仍有旧的 `/backend/test` 记录；应以 `backend/docs/swagger.json` 或本文档为准，后续重新生成 Swagger。
- 当前 API 还没有完整 CRUD，例如导航项新增、编辑、删除、排序、分类管理等后台功能仍需补充。

## 后续需要补全的后台接口

建议按以下优先级补齐：

1. 导航项管理：新增、编辑、删除、启用/停用、排序。
2. 分类管理：分类列表、新增、编辑、排序。
3. 作品管理：作品列表、新增、编辑、同步 GitHub 数据。
4. 成员动态：活动流查询、刷新、分页。
5. 系统设置：站点配置、社团信息、外链配置。
6. 鉴权增强：Bearer token、角色权限、刷新 token、退出登录。

## 本次实测结果

以下接口已在本机完成真实请求验证：

| 接口 | 结果 |
| --- | --- |
| `POST /register` | `200 OK`，返回 `{"msg":"注册成功"}` |
| `POST /login` | `200 OK`，返回 JWT token |
| `GET /nav/search?keyword=GitHub` | `200 OK`，返回 `GitHub` 导航项 |
| `GET /backend/admin/list` | `200 OK`，携带登录 token 后返回管理员列表 |
