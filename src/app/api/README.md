# src/app/api 目录说明

这里存放项目所有接口路由，前台和后台都从这里取数据。

## 目录划分
- `activities/`：成员动态
- `org-stats/`：组织统计
- `works/`：作品列表、单项更新、同步
- `links/`：前台友情链接
- `metrics/`：访问与点击埋点
- `admin/`：后台管理接口

## 开发约定
- 新接口按业务分目录，不要把所有 route 都堆在一级目录。
- 返回结构尽量稳定，避免前台联调频繁改动。
- 如果接口支持 mock，优先在文件中保留清晰的 fallback 逻辑。
- 如果接口涉及后台写操作，优先复用 `src/lib/admin-auth.ts` 和 `src/lib/admin-db.ts` 的权限能力。
