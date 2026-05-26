# src/app/api 目录说明

这里存放当前前端实际使用的 API 路由实现。

接口定义、请求响应约定、鉴权口径的唯一权威文档已经统一到：

- [docs/backend-api.md](/Users/blackevil/OpenAtom-Club-Nav-main/docs/backend-api.md)

本文件只保留目录说明，不再单独维护接口协议。

## 目录划分

- `activities/`：成员动态
- `org-stats/`：组织统计
- `works/`：作品列表、单项更新、同步
- `links/`：前台友情链接
- `metrics/`：访问与点击埋点
- `admin/`：后台管理接口

## 开发约定

- 新接口按业务分目录，不要把所有 route 都堆在一级目录。
- 变更接口前，先更新 `docs/backend-api.md`。
- 如果接口支持 mock，优先保留清晰的 fallback 逻辑。
- 如果接口涉及后台写操作，优先复用 `src/lib/admin-auth.ts` 和 `src/lib/admin-db.ts` 的权限能力。
