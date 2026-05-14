# OpenAtom Club Blog

一个基于 Next.js App Router 的社团门户与后台管理项目，包含前台展示页、作品与资源导航、GitHub 动态聚合，以及后台内容管理能力。

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

项目使用根目录下的 `.env.local`。

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
- `.env.local` 中数据库配置正确
- 必要表结构已初始化
- GitHub Token 可用（如果依赖 GitHub 数据）

初始化数据库：
```bash
npm run db:init
```

## 目录结构

```text
OpenAtom-Club-Blog/
├─ public/                 静态资源
├─ scripts/                数据库初始化等脚本
├─ docs/                   项目文档
├─ src/
│  ├─ app/                 页面与 API 路由入口
│  │  ├─ admin/            后台页面
│  │  ├─ api/              Route Handlers
│  │  ├─ home/             资料/分类页
│  │  ├─ layout.tsx        全局布局
│  │  ├─ page.tsx          默认首页入口
│  │  └─ globals.css       全局样式
│  ├─ components/          首页与后台复用组件
│  ├─ constants/           常量配置
│  ├─ data/                静态数据与 mock 数据
│  └─ lib/                 数据库、鉴权、后台服务层
├─ .env.local              本地环境变量
└─ package.json            脚本与依赖
```

## 页面入口

### 前台入口
- [src/app/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\page.tsx)
  - 当前默认首页
  - 承担门户首页主交互、弹层、主题状态等逻辑
- [src/app/home/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\home\page.tsx)
  - 资源/分类页
  - 可作为独立资料导航页面维护

### 后台入口
- [src/app/admin/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\admin\page.tsx)
  - 单页模块切换式后台
- [src/app/admin/login/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\admin\login\page.tsx)
  - 后台登录入口

## 关键数据流

### 前台数据流
1. 页面组件在客户端请求 `/api/*`
2. Route Handler 根据 `USE_MOCK_DATA` 决定 mock / GitHub / MySQL 分支
3. 数据统一整理后返回给前台组件渲染

### 后台数据流
1. 后台页面先请求 `/api/admin/me` 校验登录状态
2. 进入后台后并行拉取链接、统计、系统信息、日志等接口
3. 写操作通过 `/api/admin/*` 完成，并在前端重新拉取最新数据

## 开发时先看哪里

### 要改首页视觉或交互
优先阅读：
- [src/app/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\page.tsx)
- [src/components/CentralHub.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\components\CentralHub.tsx)
- [src/components/WorksCarousel.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\components\WorksCarousel.tsx)
- [src/app/globals.css](d:\社团导航站\OpenAtom-Club-Blog\src\app\globals.css)

### 要改后台功能
优先阅读：
- [src/app/admin/page.tsx](d:\社团导航站\OpenAtom-Club-Blog\src\app\admin\page.tsx)
- [src/app/api/admin/links/route.ts](d:\社团导航站\OpenAtom-Club-Blog\src\app\api\admin\links\route.ts)
- [src/app/api/admin/stats/route.ts](d:\社团导航站\OpenAtom-Club-Blog\src\app\api\admin\stats\route.ts)
- [src/lib/admin-auth.ts](d:\社团导航站\OpenAtom-Club-Blog\src\lib\admin-auth.ts)
- [src/lib/admin-db.ts](d:\社团导航站\OpenAtom-Club-Blog\src\lib\admin-db.ts)

### 要改数据库或鉴权
优先阅读：
- [src/lib/db.ts](d:\社团导航站\OpenAtom-Club-Blog\src\lib\db.ts)
- [src/lib/admin-auth.ts](d:\社团导航站\OpenAtom-Club-Blog\src\lib\admin-auth.ts)
- [src/lib/admin-db.ts](d:\社团导航站\OpenAtom-Club-Blog\src\lib\admin-db.ts)
- [src/lib/schema.sql](d:\社团导航站\OpenAtom-Club-Blog\src\lib\schema.sql)

## 文档导航
- [docs/ARCHITECTURE.md](d:\社团导航站\OpenAtom-Club-Blog\docs\ARCHITECTURE.md)：系统结构与数据流
- [docs/DEVELOPMENT.md](d:\社团导航站\OpenAtom-Club-Blog\docs\DEVELOPMENT.md)：开发流程与常见修改入口
- [docs/API.md](d:\社团导航站\OpenAtom-Club-Blog\docs\API.md)：接口索引与行为说明
- [src/app/README.md](d:\社团导航站\OpenAtom-Club-Blog\src\app\README.md)：页面目录说明
- [src/components/README.md](d:\社团导航站\OpenAtom-Club-Blog\src\components\README.md)：组件目录说明
- [src/lib/README.md](d:\社团导航站\OpenAtom-Club-Blog\src\lib\README.md)：服务层说明

## 当前维护建议
- `src/app/page.tsx` 体量较大，新增首页功能优先拆组件，不建议继续堆逻辑。
- `src/app/admin/page.tsx` 已改为单页模块切换模式，新增后台模块建议沿用 `activeSection` 结构。
- 新接口若需要支持本地联调，优先补齐 mock 分支，避免开发依赖真实库。
- 新增中文文件统一使用 UTF-8 编码，避免再次出现乱码问题。

## 新同事接手顺序
1. 先看本文件
2. 再看 [docs/ARCHITECTURE.md](d:\社团导航站\OpenAtom-Club-Blog\docs\ARCHITECTURE.md)
3. 根据任务选择阅读 `src/app`、`src/components`、`src/app/api` 或 `src/lib`
4. 开始改动前先确认当前是 mock 模式还是真实数据模式
