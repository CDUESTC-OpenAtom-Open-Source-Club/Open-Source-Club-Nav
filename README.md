# OpenAtom Club Nav

基于 Next.js App Router 的社团导航站与后台管理项目，包含门户首页、资源导航、作品展示、GitHub 动态聚合，以及后台内容管理能力。

## 快速开始

### 运行环境
- Node.js 18+
- npm 9+
- MySQL 8.x（仅真实数据模式需要）

### 安装依赖
```bash
npm install
```

### 启动开发环境
```bash
npm run dev
```

默认访问地址：`http://localhost:4000`

### 常用脚本
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:init
```

## 项目功能

### 前台
- 社团门户首页
- 资源导航与分类展示
- 项目/作品展示
- GitHub 动态与组织统计
- 链接点击与访问统计

### 后台
- 单页式管理控制台
- 友情链接管理
- 热门分类统计
- 链接健康检测
- 操作日志查看
- 用户管理（仅 `super`）

## 技术栈
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- MySQL (`mysql2`)

## 环境变量

项目使用根目录下的 `.env`。

```env
USE_MOCK_DATA=true
GITHUB_TOKEN=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=kcos_nav
ADMIN_BYPASS_LOGIN=true
```

### 关键变量说明
- `USE_MOCK_DATA=true`：优先返回 mock 数据，适合本地开发和演示。
- `USE_MOCK_DATA=false`：按接口实现切换到 GitHub API / MySQL。
- `GITHUB_TOKEN`：调用 GitHub API 时使用，避免频率限制。
- `ADMIN_BYPASS_LOGIN=true`：开发阶段可简化后台登录流程。

## 数据模式

### 模拟数据模式
适合本地 UI 开发、联调前开发、演示环境。

特点：
- 不依赖 MySQL
- 部分接口直接返回静态/mock 数据
- 后台核心统计接口也可工作

### 真实数据模式
适合接近生产或真实联调场景。

需要保证：
- MySQL 已启动
- `.env` 中数据库配置正确
- 必要表结构已初始化
- GitHub Token 可用（如果依赖 GitHub 数据）

初始化数据库：
```bash
npm run db:init
```

## 目录结构

```text
OpenAtom-Club-Nav/
├─ database/               数据库结构说明与 SQL
├─ docs/                   项目文档
├─ public/                 浏览器可直接访问的静态资源
│  └─ images/              图片资源（头像、背景、品牌图）
├─ scripts/                数据库初始化等脚本
├─ src/
│  ├─ app/                 App Router 页面与 API 路由入口
│  │  ├─ (admin)/          后台页面路由组，不影响 URL
│  │  ├─ (site)/           前台页面路由组，不影响 URL
│  │  ├─ api/              Route Handlers
│  │  ├─ layout.tsx        全局布局
│  │  └─ globals.css       全局样式
│  ├─ components/
│  │  └─ home/             首页与作品展示组件
│  ├─ constants/           常量配置
│  ├─ data/                静态数据与 mock 数据
│  └─ lib/                 数据库、鉴权、后台服务层
├─ .env              本地环境变量
└─ package.json            脚本与依赖
```

## 页面入口

### 前台入口
- `src/app/(site)/page.tsx`：默认首页，承担门户首页主交互、弹层、主题状态等逻辑。
- `src/app/(site)/home/page.tsx`：资源/分类页，可作为独立资料导航页面维护。
- `src/app/(site)/games/page.tsx`：小游戏与排行榜说明页。

### 后台入口
- `src/app/(admin)/admin/page.tsx`：单页模块切换式后台。
- `src/app/(admin)/admin/login/page.tsx`：后台登录入口。

## 关键数据流

### 前台数据流
1. 页面组件在客户端请求 `/api/*`。
2. Route Handler 根据 `USE_MOCK_DATA` 决定 mock / GitHub / MySQL 分支。
3. 数据统一整理后返回给前台组件渲染。

### 后台数据流
1. 后台页面先请求 `/api/admin/me` 校验登录状态。
2. 进入后台后并行拉取链接、统计、系统信息、日志等接口。
3. 写操作通过 `/api/admin/*` 完成，并在前端重新拉取最新数据。

## 开发时先看哪里

### 要改首页视觉或交互
优先阅读：
- `src/app/(site)/page.tsx`
- `src/components/home/CentralHub.tsx`
- `src/components/home/WorksCarousel.tsx`
- `src/app/globals.css`

### 要改后台功能
优先阅读：
- `src/app/(admin)/admin/page.tsx`
- `src/app/api/admin/links/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-db.ts`

### 要改数据库或鉴权
优先阅读：
- `src/lib/db.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-db.ts`
- `database/schema.sql`
- `scripts/db-init.ts`

## 文档导航
- `docs/ARCHITECTURE.md`：系统结构与数据流。
- `docs/DEVELOPMENT.md`：开发流程与常见修改入口。
- `docs/API.md`：接口索引与行为说明。
- `src/app/README.md`：页面目录说明。
- `src/components/README.md`：组件目录说明。
- `src/lib/README.md`：服务层说明。
- `database/README.md`：数据库目录说明。

## 当前维护建议
- `src/app/(site)/page.tsx` 体量较大，新增首页功能优先拆组件，不建议继续堆逻辑。
- `src/app/(admin)/admin/page.tsx` 已改为单页模块切换模式，新增后台模块建议沿用 `activeSection` 结构。
- 新接口若需要支持本地联调，优先补齐 mock 分支，避免开发依赖真实库。
- 新增中文文件统一使用 UTF-8 编码，避免再次出现乱码问题。
