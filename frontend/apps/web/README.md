# OpenAtom Club Nav

社团导航站 + 后台管理系统，基于 Next.js App Router、React 19、TypeScript 构建。

## 1. 项目定位

- 前台：首页、资源导航、作品展示、动态信息
- 后台：链接管理、健康检测、统计、日志、用户管理
- 数据：支持 mock / GitHub / MySQL 三种来源

## 2. 快速开始

### 环境要求
- Node.js 18+
- npm 9+
- MySQL 8.x（仅真实数据模式需要）

### 安装与启动
```bash
npm install
npm run dev
```

默认地址：`http://localhost:4000`

### 常用脚本
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:init
```

## 3. 配置说明

根目录 `.env` 示例：

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

### 关键开关
- `USE_MOCK_DATA=true`：优先使用模拟数据，适合本地开发和演示
- `USE_MOCK_DATA=false`：走真实接口 / 数据库
- `GITHUB_TOKEN`：GitHub API 限流缓解
- `ADMIN_BYPASS_LOGIN=true`：开发阶段跳过登录校验

## 4. 数据模式

### Mock 模式
- 不依赖 MySQL
- 适合快速调 UI 和联调接口
- 后台大部分页面可直接预览

### 真实模式
- 需要先初始化数据库
- 需要正确配置 MySQL 和 GitHub Token
- 写操作会落到后端数据层

初始化：
```bash
npm run db:init
```

## 5. 目录总览

```text
OpenAtom-Club-Nav/
├── database/    SQL 与数据库说明
├── docs/        设计、开发、接口文档
├── public/      静态资源
├── scripts/     初始化脚本
├── src/
│   ├── app/     页面与 API 路由
│   ├── components/
│   ├── constants/
│   ├── data/    mock 数据
│   ├── lib/     服务层
│   └── types/   类型定义
└── package.json
```

## 6. 关键入口

- `src/app/(site)/page.tsx`：首页入口
- `src/app/(site)/HomePageClient.tsx`：首页交互层
- `src/app/(site)/home/page.tsx`：资源分类页
- `src/app/(site)/games/page.tsx`：独立游戏页
- `src/app/(admin)/admin/page.tsx`：后台主页面
- `src/app/(admin)/admin/login/page.tsx`：后台登录页

## 7. 开发顺序建议

1. 先确认页面是前台、后台还是 API
2. 再找对应的数据源文件
3. 优先改组件，不要把逻辑继续堆进页面入口
4. 改完后执行 `npm run lint` 和 `npm run build`

## 8. 常见修改点

### 首页
- `src/components/home/CentralHub.tsx`
- `src/components/home/HUDHeader.tsx`
- `src/components/home/RightPanel.tsx`
- `src/components/home/WorksCarousel.tsx`

### 后台
- `src/app/(admin)/admin/page.tsx`
- `src/app/api/admin/*`
- `src/lib/admin-auth.ts`
- `src/lib/admin-db.ts`

### 数据
- `src/data/*`
- `src/types/*`
- `database/schema.sql`
- `scripts/db-init.ts`

## 9. 维护备注

- 首页和后台页面体量都偏大，新增功能建议先拆组件
- mock 数据适合本地联调，真实模式再接数据库
- 中文文件请统一 UTF-8，避免乱码回归
- 如果 lint 报 React purity 错误，优先检查 `Date.now()`、`setState()` 和 effect 里的同步更新
