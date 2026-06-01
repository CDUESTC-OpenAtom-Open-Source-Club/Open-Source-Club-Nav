# 生产环境部署指南

## 架构概览

```
GitHub Actions (push to main)
  ├─ detect: 识别变更文件
  ├─ test_frontend: lint + build (前端变更时)
  ├─ test_backend: go test (后端变更时)
  ├─ build_web: 构建 + push 镜像 (前端变更时)
  ├─ build_backend: 构建 + push 镜像 (后端变更时)
  └─ deploy: SSH 到服务器执行 deploy.sh
```

镜像推送到 GitHub Container Registry (GHCR)：
- `ghcr.io/<owner>/<repo>-web:<sha>`
- `ghcr.io/<owner>/<repo>-backend:<sha>`

## GitHub Secrets 配置

在仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 | 示例 |
|---|---|---|
| `DEPLOY_HOST` | 服务器 IP 或域名 | `123.45.67.89` |
| `DEPLOY_PORT` | SSH 端口 | `22` |
| `DEPLOY_USER` | 部署专用用户名 | `deploy` |
| `DEPLOY_SSH_KEY` | SSH 私钥 (ed25519 推荐) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | 服务器上项目目录 | `/opt/openatom-club` |
| `SSH_KNOWN_HOSTS` | 服务器 host key | `123.45.67.89 ssh-ed25519 AAAA...` |

获取 `SSH_KNOWN_HOSTS`：
```bash
ssh-keyscan -p <port> <host> 2>/dev/null
```

## 服务器目录结构

```
/opt/openatom-club/
├── docker-compose.prod.yml    # 生产 compose（由仓库 deploy/ 同步）
├── deploy.sh                  # 部署脚本（由仓库 deploy/ 同步）
├── .env                       # 当前运行的镜像 tag（WEB_IMAGE / BACKEND_IMAGE）
├── .env.rollback              # 上一次的 .env（回滚用）
├── env/
│   └── web.env                # 前端环境变量（仅 Next.js 用的公开变量）
├── config/
│   └── backend/
│       └── config.docker.yaml # 后端配置（SQLite path、JWT secret）
└── backups/
    └── sqlite/                # 数据库迁移前自动备份（保留最近 30 个）
```

> SQLite 嵌入式数据库，数据持久化在 docker named volume `backend-data`（无需 mysql 容器）。

## 服务器初始化

### 1. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

### 2. 创建部署用户

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

### 3. 配置 GHCR 登录

```bash
sudo -u deploy docker login ghcr.io
# 使用 GitHub PAT (read:packages 权限)
```

### 4. 创建目录结构

```bash
sudo mkdir -p /opt/openatom-club/{env,config/backend,backups/sqlite}
sudo chown -R deploy:deploy /opt/openatom-club
```

### 5. 创建环境文件

**`/opt/openatom-club/.env`**：
```bash
WEB_IMAGE=ghcr.io/<owner>/<repo>-web:main
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:main
```

**`/opt/openatom-club/env/web.env`**（前端公开 env，目前可为空文件或仅放非敏感变量）：
```bash
# 例如 sentry / analytics 等 NEXT_PUBLIC_* 变量；
# 数据库相关变量已不需要 —— 前端不再直连数据库。
```

**`/opt/openatom-club/config/backend/config.docker.yaml`**：
```yaml
database:
  # 必须指向容器内 /app/data 目录（已挂载到 docker volume backend-data）
  path: "/app/data/app.db"
jwt:
  secret: "your-jwt-secret-here"  # 生产请用 openssl rand -hex 32 生成
  expire: 3600
```

> ⚠️ 文件名必须是 **`config.docker.yaml`**，docker-compose.prod.yml 按这个名字挂载。

### 6. 首次启动

```bash
cd /opt/openatom-club
cp /path/to/repo/deploy/docker-compose.prod.yml .
cp /path/to/repo/deploy/deploy.sh .
chmod +x deploy.sh
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 7. 设置 SSH 密钥

将 GitHub Actions 使用的公钥添加到 `~/.ssh/authorized_keys`：
```bash
echo "ssh-ed25519 AAAA..." >> /home/deploy/.ssh/authorized_keys
```

## 部署行为

### 变更检测

| 变更范围 | 构建 | 部署 |
|---|---|---|
| `frontend/**` | web 镜像 | 重启 web |
| `backend/**` | backend 镜像 | 重启 backend |
| 两者都改 | 两个镜像 | 两个都重启 |
| `backend/db/migrate/**` | backend 镜像 | 部署前备份 SQLite（保留最近 30 个） |
| 仅 `docs/**`、`README.md` | 不构建 | 不部署 |

### 健康检查与回滚

部署后自动执行健康检查（12 次，每次间隔 5 秒）：
- 前端：`curl http://127.0.0.1:4000/api/healthz`
- 后端：`curl http://127.0.0.1:8080/healthz`

如果健康检查失败：
1. 恢复 `.env.rollback`（上一个镜像 tag）
2. 重新启动对应服务
3. 脚本退出非零，GitHub Actions 标红

### 并发控制

使用 `flock` 文件锁 + GitHub Actions `concurrency` 确保：
- 连续 push 到 main 串行执行，不互相覆盖
- 服务器上同时只能运行一个部署进程

## 安全注意事项

- SSH 连接必须验证 host key（通过 `SSH_KNOWN_HOSTS`），禁用 `StrictHostKeyChecking=no`
- 部署用户只加入 `docker` 组，不给 root 权限
- JWT secret 等敏感信息只存在服务器的 `config/backend/config.docker.yaml`
- SQLite 数据库为嵌入式文件，不暴露任何网络端口（更安全）
- 数据库文件位于 docker volume `backend-data`，建议定期 cron 拷贝到对象存储
- GitHub Actions 权限最小化：`contents: read` + `packages: write`
