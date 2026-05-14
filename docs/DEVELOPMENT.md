# 开发指南

## 开发前先确认

开始动手前，先确认三件事：
- 你当前修改的是前台还是后台
- 当前是 mock 模式还是真实数据模式
- 这个改动会影响页面、接口、还是数据库

查看环境变量：
- 根目录 `.env.local`
- 重点关注 `USE_MOCK_DATA` 和 `ADMIN_BYPASS_LOGIN`

## 常见开发任务入口

### 1. 改首页内容或视觉
优先查看：
- `src/app/page.tsx`
- `src/components/CentralHub.tsx`
- `src/components/LeftPanel.tsx`
- `src/components/RightPanel.tsx`
- `src/components/WorksCarousel.tsx`
- `src/app/globals.css`

适合处理：
- 首页布局
- 卡片样式
- 交互动画
- 响应式适配

### 2. 改后台页面
优先查看：
- `src/app/admin/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/globals.css`

适合处理：
- 模块切换
- 表格展示
- KPI 卡片
- 健康检测 / 日志 / 用户管理 UI

### 3. 改后台接口
优先查看：
- `src/app/api/admin/links/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/link-health/route.ts`
- `src/app/api/admin/logs/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-db.ts`

### 4. 改前台接口或数据源
优先查看：
- `src/app/api/activities/route.ts`
- `src/app/api/works/route.ts`
- `src/app/api/links/route.ts`
- `src/app/api/org-stats/route.ts`
- `src/data/`

### 5. 改数据库
优先查看：
- `src/lib/db.ts`
- `src/lib/schema.sql`
- `scripts/db-init.ts`

## 推荐开发流程

### 纯前端开发
1. 把 `USE_MOCK_DATA` 设为 `true`
2. 启动 `npm run dev`
3. 优先确认接口是否已有 mock 返回
4. 改页面后检查桌面端和移动端

### 接口联调开发
1. 确认要改的 route 文件
2. 保持返回结构稳定
3. 如果改字段，前台组件和 fallback 数据一起改
4. 检查后台角色权限是否受影响

### 后台功能开发
1. 先看 `activeSection` 的模块切换方式
2. 新模块要同步更新菜单和内容区域
3. 写操作后尽量复用统一刷新流程
4. 如果有权限差异，先确定 `super` / `editor` 的边界

## 提交改动前建议检查

### 页面改动
- 桌面端是否正常
- 小屏是否布局错位
- 是否误伤首页或后台另一套样式

### 接口改动
- mock 分支是否还能返回可用数据
- 前台依赖字段是否仍存在
- 错误提示是否清晰

### 数据库改动
- 本地库是否已初始化
- 表结构改动是否同步到 `schema.sql`
- 相关脚本是否需要更新

## 已知维护难点

### 大文件
以下文件改动前建议先通读：
- `src/app/page.tsx`
- `src/app/admin/page.tsx`
- `src/components/CentralHub.tsx`

### 样式耦合
- 后台和首页共享 `globals.css`
- 改全局变量或通用类名时，记得同时回看前后台

### 数据源分散
- mock 数据并未完全统一抽离
- 一些 route 文件内部直接带 fallback 数据

## 常见排障

### 后台点击没反应
优先检查：
- `src/app/admin/page.tsx` 是否仍是单页切换逻辑
- 是否有覆盖层挡住按钮
- API 是否报 401/500

### 后台进不去
优先检查：
- `/api/admin/me` 是否返回 200
- `ADMIN_BYPASS_LOGIN` 配置
- Cookie 是否正常写入

### 接口返回乱码
优先检查：
- 文件编码是否是 UTF-8
- 文案是否从旧乱码内容直接复制过来

### 切到真实数据后加载失败
优先检查：
- MySQL 是否启动
- `.env.local` 数据库配置是否正确
- GitHub Token 是否有效

## 建议的后续整理方向
- 将 route 内 fallback 数据逐步迁移到统一 mock 目录
- 给核心接口补请求参数和响应示例
- 把重复类型抽离成共享类型文件
