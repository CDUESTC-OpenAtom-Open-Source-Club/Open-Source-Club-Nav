# 生产部署轻量化说明

目标是服务器只运行编译后的精简产物，不在服务器上保留完整开发工具链。

## 前端

前端使用 Next.js standalone 输出：

```bash
cd fronted/apps/web
npm ci
npm run build
```

构建后运行目录来自：

```text
.next/standalone
.next/static
public
```

容器运行时使用 `node:20-alpine`，入口是：

```bash
node server.js
```

不要在生产容器里使用 `next dev` 或 `next start`。

## 后端

后端使用 Go 静态二进制：

```bash
cd backend
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o bin/openatom-backend-linux-amd64 .
```

生产容器只保留二进制和运行配置，不包含 Go SDK。

## MySQL 小内存参数

小型服务器建议从以下参数起步：

```text
--performance-schema=OFF
--innodb-buffer-pool-size=128M
--max-connections=50
--table-open-cache=256
--thread-cache-size=8
```

`1GB RAM` 服务器必须配置 swap。`2GB RAM` 是当前全栈更稳的最低建议。
