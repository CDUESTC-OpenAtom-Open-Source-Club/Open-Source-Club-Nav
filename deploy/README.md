# 生产环境部署指南

## 架构概览

```
GitHub Actions (push to main)
  ├─ detect: 识别变更文件
  ├─ test_frontend: lint + build (前端变更时)
  ├─ test_backend: go test (后端变更时)
  └─ deploy: SSH 到服务器执行 deploy.sh
       ├─ git fetch + checkout
       ├─ 构建后端二进制 / 前端 standalone
       ├─ PM2 重启对应服务
       └─ 健康检查 + 回滚
```

部署模式：**PM2 + 裸二进制**（不再使用 Docker）。

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
├── deploy/
│   ├── deploy.sh                  # 部署脚本
│   ├── ecosystem.config.js        # PM2 进程配置
│   └── env/
│       └── web.env                # 前端环境变量
├── backend/
│   ├── config.prod.yaml           # 生产配置（MySQL/Redis 直连 127.0.0.1）
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

# Go（检查 go.mod 中的版本要求）
sudo apt install -y golang

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
sudo -u deploy git -C /opt/openatom-club remote set-url origin git@github.com:Dirinkbottle/Open-Source-Club-Nav.git
```

### 4. 配置后端

编辑 `/opt/openatom-club/backend/config.prod.yaml`：
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
```

或通过环境变量覆盖敏感字段：
```bash
export JWT_SECRET="your-jwt-secret"
export MYSQL_PASSWORD="your-mysql-root-password"
```

### 5. 配置前端环境变量

编辑 `/opt/openatom-club/deploy/env/web.env`：
```bash
NODE_ENV=production
USE_MOCK_DATA=false
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8080
```

### 6. 配置 PM2 开机自启

```bash
cd /opt/openatom-club
pm2 startup systemd -u deploy --hp /home/deploy
pm2 start deploy/ecosystem.config.js
pm2 save
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
| `frontend/**` | 构建 standalone | PM2 重启 openatom-web |
| `backend/**` | 构建二进制 | PM2 重启 openatom-backend |
| 两者都改 | 都构建 | 都重启 |
| `backend/db/migrate/**` | 构建二进制 | 部署前备份 MySQL（保留最近 30 个） |
| 仅 `docs/**`、`README.md` | 不构建 | 不部署 |

### 健康检查与回滚

部署后自动执行健康检查（12 次，每次间隔 5 秒）：
- 后端：`curl http://127.0.0.1:8080/healthz`
- 前端：`curl http://127.0.0.1:4000/api/healthz`

如果健康检查失败：

1. git checkout 回上一个版本
2. 重新构建并 PM2 restart
3. 脚本退出非零，GitHub Actions 标红

### 并发控制

使用 `flock` 文件锁 + GitHub Actions `concurrency` 确保：

- 连续 push 到 main 串行执行，不互相覆盖
- 服务器上同时只能运行一个部署进程

## 安全注意事项

- SSH 连接必须验证 host key（通过 `SSH_KNOWN_HOSTS`），禁用 `StrictHostKeyChecking=no`
- JWT secret 等敏感信息通过环境变量或 `config.prod.yaml` 配置
- MySQL root 密码建议通过 `MYSQL_PASSWORD` 环境变量传入，不要明文写入配置文件
- GitHub Actions 权限最小化：`contents: read`
- PM2 进程以 deploy 用户运行，不给 root 权限

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

# 手动部署（指定 SHA）
cd /opt/openatom-club
./deploy/deploy.sh --sha <commit-sha> --frontend-changed true --backend-changed true
```
