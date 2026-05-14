# src/app 目录说明

这里是项目的页面与接口总入口，对应 Next.js App Router。页面使用路由组归纳，路由组目录名不会出现在 URL 中。

## 目录职责
- `(site)/page.tsx`：默认首页入口，对应 `/`
- `(site)/home/page.tsx`：资料/分类页，对应 `/home`
- `(site)/games/page.tsx`：小游戏页，对应 `/games`
- `(admin)/admin/page.tsx`：后台管理页，对应 `/admin`
- `(admin)/admin/login/page.tsx`：后台登录页，对应 `/admin/login`
- `layout.tsx`：全局布局
- `globals.css`：全局样式
- `api/`：所有 Route Handlers

## 维护建议
- 改页面前先确认目标是前台、资料页还是后台。
- `(site)/page.tsx` 和 `(admin)/admin/page.tsx` 都偏大，新增功能优先拆组件。
- 如果页面依赖接口返回字段，改动时要同步检查 `api/` 对应 route。
