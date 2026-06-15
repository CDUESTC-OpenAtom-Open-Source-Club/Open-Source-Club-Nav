#!/usr/bin/env bash
# deploy/cleanup-containers.sh
# 清理无用的 Docker 容器
set -Eeuo pipefail

echo "=== 当前容器状态 ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo ""
echo "=== 需要清理的容器 ==="

# 定义需要保留的容器（正在运行的服务）
KEEP_CONTAINERS=(
  "openatom-club-nav-redis"
  "openatom-club-nav-mysql"
  "1Panel-openresty-q1s9"
)

# 定义需要清理的容器
CLEANUP_CONTAINERS=(
  "open-source-club-nav-web-1"
  "open-source-club-nav-backend-1"
  "nav-web-1"
  "nav-backend-1"
)

for container in "${CLEANUP_CONTAINERS[@]}"; do
  if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
    status=$(docker ps -a --filter "name=${container}" --format "{{.Status}}")
    echo "容器 ${container} 状态: ${status}"

    # 确认是否要删除
    echo "  - 停止容器..."
    docker stop "${container}" 2>/dev/null || true

    echo "  - 删除容器..."
    docker rm "${container}" 2>/dev/null || true

    echo "  ✓ 已清理"
  else
    echo "容器 ${container} 不存在"
  fi
done

echo ""
echo "=== 清理后容器状态 ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo ""
echo "=== 清理无用镜像 ==="
docker image prune -f 2>/dev/null || true

echo ""
echo "✓ 清理完成"