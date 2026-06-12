# 生产环境部署指南

## 架构概览

```
GitHub Actions (Git Tag push)
  ├─ 在 GitHub runner 上测试、构建后端 Linux 二进制
  ├─ 在 GitHub runner 上构建前端 standalone bundle
  ├─ 打包部署脚本、PM2 配置、数据库迁移、backend/bin、frontend/apps/web/dist
  └─ SSH 上传 artifact 到服务器并执行 deploy/update.sh --tag <tag>
       ├─ 解压 GitHub Actions 上传的 artifact
       ├─ 复用 GitHub Actions 上传的预构建产物
       ├─ PM2 重启 openatom-backend / openatom-web
       └─ 健康检查 + 失败回滚
```

部署模式：**PM2 + 裸二进制**（不再使用 Docker）。

当前测试部署触发以 **Git Tag** 为准，普通 push 到 main 不部署。测试服自动部署 tag 格式为 `v*-test`，例如 `v0.2.0-test`。生产部署接入后建议使用正式 tag，例如 `v1.2.3`，并配置独立的生产 secrets 与环境保护规则。

低内存服务器不现场构建。GitHub Actions 上传预构建产物后，用 `SKIP_BACKEND_BUILD=1` 和 `SKIP_FRONTEND_BUILD=1` 让脚本只 checkout tag、重启服务和做健康检查。

## GitHub Actions Secrets

测试服需要在仓库 Actions secrets 中配置：

| Secret | 说明 | 示例 |
|---|---|---|
| `TEST_DEPLOY_HOST` | 测试服务器 IP | `47.108.249.115` |
| `TEST_DEPLOY_PORT` | SSH 端口 | `22` |
| `TEST_DEPLOY_USER` | SSH 用户 | `root` |
| `TEST_DEPLOY_PATH` | 项目目录 | `/opt/openatom-club` |
| `TEST_DEPLOY_SSH_KEY` | GitHub Actions 使用的 SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `TEST_SSH_KNOWN_HOSTS` | 测试服务器 host key | `ssh-keyscan -p 22 47.108.249.115` |

运行时敏感配置不放 GitHub secrets，放服务器本地 `${DEPLOY_PATH}/.deploy-env`：

```bash
SERVER_ADDR=:18080
BACKEND_API_URL=http://127.0.0.1:18080
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:18080
MYSQL_PASSWORD=...
JWT_SECRET=...
HEALTH_RETRIES=24
HEALTH_INTERVAL=3
```

## 远程仓库访问

GitHub Actions 会把运行所需文件打包上传到服务器，部署时服务器不需要访问 GitHub。若要在服务器上手动排查版本，仍建议保留可读取的 `origin`：

```bash
cd /opt/openatom-club
git ls-remote --tags --refs origin
git fetch --tags --force origin
```

公开仓库可使用 HTTPS origin。私有仓库手动排查时建议给服务器配置只读 deploy key，并将 `origin` 设置为 SSH 地址。

## 服务器目录结构

```
/opt/openatom-club/
├── deploy/
│   ├── update.sh                  # Tag 更新脚本
│   ├── deploy.sh                  # 旧版 CI 部署脚本（保留兼容）
│   ├── ecosystem.config.js        # PM2 进程配置
│   └── env/
│       └── web.env                # 前端环境变量
├── backend/
│   ├── config.yaml                # 配置文件（敏感信息通过环境变量覆盖）
│   ├── bin/
│   │   └── openatom-backend-linux-amd64
│   └── ...
├── frontend/apps/web/
│   └── dist/                      # Next.js standalone 产物
│       ├── server.js
│       ├── .next/
│       └── public/
├── backups/mysql/                 # MySQL 备份（保留最近 30 个）
└── .env.rollback                  # 回滚用
```

## 服务器初始化

### 1. 安装依赖

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# MySQL 8.0 和 Redis 7（确保已安装并运行）
sudo systemctl status mysql redis
```

### 2. 创建部署用户

```bash
sudo useradd -m -s /bin/bash deploy
```

### 3. Clone 仓库

```bash
sudo -u deploy git clone <repo-url> /opt/openatom-club
sudo -u deploy git -C /opt/openatom-club remote set-url origin git@github.com:CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav.git
```

### 4. 配置后端

**方式一：环境变量覆盖（推荐）**

通过环境变量覆盖敏感字段，无需修改配置文件：
```bash
export MYSQL_PASSWORD="your-mysql-root-password"
export JWT_SECRET="your-jwt-secret"  # openssl rand -hex 32
export CORS_ALLOWED_ORIGINS="https://your-domain.com"
```

**方式二：修改配置文件**

编辑 `/opt/openatom-club/backend/config.yaml`：
```yaml
mysql:
  host: 127.0.0.1
  port: 3306
  user: root
  password: "your-mysql-root-password"
  database: test_db
jwt:
  secret: "your-jwt-secret"  # openssl rand -hex 32
  expire: 3600
cors:
  allowed_origins: "https://your-domain.com"
redis:
  addr: "127.0.0.1:6379"
  password: ""
  db: 0
server:
  addr: ":8080"
```

测试服如需避开已有 `8080` 服务，可通过环境变量覆盖监听地址：
```bash
export SERVER_ADDR=":18080"
export BACKEND_API_URL="http://127.0.0.1:18080"
export NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:18080"
```

### 5. 配置前端环境变量

编辑 `/opt/openatom-club/deploy/env/web.env`：
```bash
NODE_ENV=production
USE_MOCK_DATA=false
BACKEND_API_URL=http://127.0.0.1:8080
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8080
```

### 6. 配置 PM2 开机自启

```bash
cd /opt/openatom-club
pm2 startup systemd -u deploy --hp /home/deploy
pm2 start deploy/ecosystem.config.js
pm2 save
```

### 7. 设置仓库读取密钥

私有仓库如需服务器手动读取 GitHub，可配置 GitHub deploy key：
```bash
sudo -u deploy ssh -T git@github.com
sudo -u deploy git -C /opt/openatom-club ls-remote --tags --refs origin
```

## Git Tag 更新流程

### 发布 tag

```bash
git tag v1.2.3
git push origin v1.2.3
```

推送 tag 后，GitHub Actions 会自动完成构建、上传和部署。服务器不负责检测更新，也不提供后台更新按钮。

### 健康检查与回滚

部署后自动执行健康检查（12 次，每次间隔 5 秒）：
- 后端：默认 `curl http://127.0.0.1:8080/healthz`，如设置 `SERVER_ADDR=:18080` 则检查 `18080`
- 前端：默认 `curl http://127.0.0.1:4000/api/healthz`

如果健康检查失败：

1. git checkout 回上一个版本
2. 重新构建并 PM2 restart
3. 脚本退出非零，GitHub Actions 标记失败

### 并发控制

使用 GitHub Actions concurrency + 服务器 `flock` 文件锁确保：

- 服务器上同时只能运行一个部署进程
- 连续 tag 部署不会在服务器上并发覆盖

## 安全注意事项

- 私有仓库使用只读 deploy key，不要把个人 SSH 私钥放到服务器
- **推荐使用环境变量配置敏感信息**，避免将密码写入配置文件
- 支持的环境变量：`MYSQL_PASSWORD`、`JWT_SECRET`、`MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_DATABASE`、`REDIS_ADDR`、`REDIS_PASSWORD`、`REDIS_DB`、`CORS_ALLOWED_ORIGINS`、`SERVER_ADDR`
- PM2 进程以 deploy 用户运行，不给 root 权限
- GitHub Actions 只在 tag push 时部署，部署私钥只保存在 Actions secrets
- 部署脚本只 checkout GitHub Actions 传入的 tag

## 手动操作

```bash
# 查看 PM2 进程状态
pm2 list

# 查看日志
pm2 logs openatom-backend
pm2 logs openatom-web

# 重启服务
pm2 restart openatom-backend
pm2 restart openatom-web

# 手动部署（指定 tag；需要服务器能读取 GitHub origin）
cd /opt/openatom-club
./deploy/update.sh --tag v1.2.3

# 测试服避开 8080 的手动部署
SERVER_ADDR=:18080 \
BACKEND_API_URL=http://127.0.0.1:18080 \
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:18080 \
./deploy/update.sh --tag v1.2.3

# 使用预构建产物部署（适合低内存服务器）
SKIP_BACKEND_BUILD=1 \
SKIP_FRONTEND_BUILD=1 \
./deploy/update.sh --tag v1.2.3

# 使用 GitHub Actions 上传的 artifact 部署时会跳过服务器端 git fetch
SKIP_BACKEND_BUILD=1 \
SKIP_FRONTEND_BUILD=1 \
SKIP_GIT_CHECKOUT=1 \
./deploy/update.sh --tag v1.2.3
```
