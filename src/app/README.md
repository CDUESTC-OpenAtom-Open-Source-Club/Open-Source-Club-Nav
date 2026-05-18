# src/app 目录说明

这里是页面与 API 的总入口，使用 App Router 路由组组织代码。

## 1. 页面职责

- `(site)/page.tsx`：首页入口
- `(site)/HomePageClient.tsx`：首页交互层
- `(site)/home/page.tsx`：资源分类页
- `(site)/games/page.tsx`：独立游戏页
- `(admin)/admin/page.tsx`：后台主页面
- `(admin)/admin/login/page.tsx`：后台登录页
- `layout.tsx`：全局布局
- `globals.css`：全局样式
- `api/`：所有 Route Handlers

## 2. 开发约定

- 页面优先保持“页面负责组装，组件负责细节”
- 复杂逻辑优先下沉到 `src/components/`
- 接口字段变化后，要同步检查前端渲染和 mock 数据
- 需要浏览器能力的逻辑放在 Client Component 内

## 3. 常见修改路径

- 首页视觉：`(site)/page.tsx`、`components/home/*`
- 后台功能：`(admin)/admin/page.tsx`、`api/admin/*`
- 登录流程：`(admin)/admin/login/page.tsx`、`api/admin/login/route.ts`
- 全局样式：`globals.css`
