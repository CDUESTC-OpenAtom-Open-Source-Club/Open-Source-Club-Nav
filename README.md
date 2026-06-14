# KCOS 开放原子开源社团导航

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-backend-00ADD8)](https://go.dev/)
[![Deploy](https://img.shields.io/github/actions/workflow/status/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav/deploy.yml?label=deploy)](https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)

KCOS 开放原子开源社团导航平台，面向高校开源社团的资源导航、作品展示、活动动态和后台治理场景。项目由 Next.js 前端、Go 后端、MySQL、Redis 和 PM2/OnePanel 部署链路组成，生产站点为 [nav.kcos.club](https://nav.kcos.club)。

## 功能概览

- 资源矩阵：按分类聚合开源工具、学习资源、校园服务与开发者工具。
- 社团内容：展示项目作品、GitHub 动态、贡献者与社团信息。
- 管理后台：支持资源、内容、用户、操作日志、访问统计和链接健康检测。
- 运行观测：后台展示前端网关、后端 API、数据库、Redis 和进程资源状态。
- SEO：站点 metadata、搜索引擎验证文件、robots、动态 sitemap 和结构化数据。

## 技术栈

- Frontend：Next.js 16、React 19、TypeScript、Tailwind CSS、Three.js
- Backend：Go、Gin、GORM、MySQL、Redis
- Deployment：GitHub Actions、PM2、OnePanel/OpenResty

## Backend database deployment

后端已经内置版本化数据库迁移和基础种子。

部署流程：

1. 创建 MySQL 数据库
2. 按 [backend/config.example.yaml](/Users/blackevil/OpenAtom-Club-Nav-main/backend/config.example.yaml) 准备配置文件
3. 启动后端服务
4. 服务启动时会自动执行 `backend/db/migrate/migrations/*.sql`

迁移特性：

- 使用 `schema_migrations` 记录已执行版本
- 已执行迁移不会重复跑
- 历史迁移文件如果被篡改，服务会因 checksum 不一致拒绝启动
- `003_seed_core_data.sql` 会初始化最小管理员和基础导航数据

详细说明见 [backend/db/README.md](/Users/blackevil/OpenAtom-Club-Nav-main/backend/db/README.md)。
