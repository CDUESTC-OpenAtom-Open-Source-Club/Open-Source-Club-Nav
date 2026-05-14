# 系统架构说明

## 项目定位

这个项目同时承载两类场景：
- 对外展示的社团门户与资源导航
- 对内使用的后台内容管理控制台

整体采用 Next.js App Router，页面与接口都放在 `src/app` 下，前后端共享一套仓库。

## 整体结构

### 1. 页面层
位于 `src/app/`。

主要入口：
- `page.tsx`：默认首页
- `home/page.tsx`：资料/分类页
- `admin/page.tsx`：后台控制台
- `admin/login/page.tsx`：后台登录页

职责：
- 组织页面布局
- 发起数据请求
- 管理前端状态
- 渲染交互与视觉表现

### 2. 组件层
位于 `src/components/`。

职责：
- 承担首页和后台的可复用 UI 结构
- 拆分大页面中的局部交互
- 减少 `page.tsx` 中的渲染复杂度

代表文件：
- `CentralHub.tsx`
- `LeftPanel.tsx`
- `RightPanel.tsx`
- `WorksCarousel.tsx`
- `GlobeCanvas.tsx`

### 3. 接口层
位于 `src/app/api/`。

职责：
- 作为前端唯一直接访问的数据入口
- 统一处理 mock / GitHub / MySQL 多种数据源
- 封装后台权限校验与写操作

接口分组：
- `activities/`：成员动态
- `org-stats/`：组织统计
- `works/`：作品列表、更新、同步
- `links/`：前台友情链接
- `metrics/`：访问和点击埋点
- `admin/`：后台管理接口

### 4. 服务层
位于 `src/lib/`。

职责：
- 管理 MySQL 连接
- 处理后台会话与权限逻辑
- 初始化后台表结构和默认管理员

代表文件：
- `db.ts`
- `admin-auth.ts`
- `admin-db.ts`
- `schema.sql`

### 5. 静态数据层
位于 `src/data/` 和部分 route 内。

职责：
- 本地开发时提供 mock 数据
- 作为真实数据源不可用时的降级方案

## 数据流

## 前台页面数据流
1. 页面组件加载后请求 `/api/activities`、`/api/works`、`/api/links` 等接口。
2. 对应 route 根据环境变量判断数据来源。
3. 接口把数据转换为前端需要的结构后返回。
4. 组件拿到数据后渲染卡片、列表、轮播和统计内容。

## 后台页面数据流
1. 后台页面初始化时先请求 `/api/admin/me` 检查登录态。
2. 登录通过后调用 `loadAll()` 并行拉取链接、统计、系统、日志、健康状态等数据。
3. 新增、更新、删除操作走 `/api/admin/*` 接口。
4. 写操作结束后重新请求列表，保证后台单页状态和数据一致。

## mock 与真实数据切换

开关：`.env.local`

```env
USE_MOCK_DATA=true
```

### mock 模式
适合：
- 纯前端开发
- 后台 UI 联调
- 无数据库本地环境

特点：
- 不依赖 MySQL
- 部分接口直接返回 route 内置静态数据
- 管理后台也能展示关键统计模块

### 真实模式
```env
USE_MOCK_DATA=false
```

特点：
- GitHub 相关接口会请求 GitHub API
- 后台与部分前台数据会请求 MySQL
- 更接近真实运行环境

## 权限模型

后台角色目前分为两种：
- `super`：超级管理员，可管理用户和所有后台内容
- `editor`：普通编辑，可管理内容，但不能管理用户

关键逻辑文件：
- `src/lib/admin-auth.ts`
- `src/lib/admin-db.ts`
- `src/app/api/admin/me/route.ts`
- `src/app/api/admin/users/route.ts`

## 关键耦合点

开发时需要特别注意以下耦合关系：
- 首页样式与全局样式耦合较深，改 `globals.css` 时要同时回看首页和后台。
- 后台模块切换依赖 `activeSection`，新增模块时要同步更新菜单与渲染分支。
- 部分 mock 数据散落在 route 文件内，修改接口字段时要同时更新 fallback 数据结构。
- GitHub 数据会先被转换成前台展示结构，直接改接口原始字段通常不会立即反映到 UI。

## 后续推荐演进方向

### 文档层
- 继续补充接口请求示例和响应示例
- 增加数据库表结构说明

### 代码层
- 将首页大文件继续拆分
- 将 route 内 mock 数据提取到单独目录
- 将重复类型抽到共享类型目录

### 运维层
- 区分开发、演示、生产三套环境变量模板
- 为后台关键接口补充更明确的错误日志
