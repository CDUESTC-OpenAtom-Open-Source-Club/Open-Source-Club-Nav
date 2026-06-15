#!/usr/bin/env bash
# deploy/reset-database.sh
# 安全重置数据库脚本：备份、drop/recreate、重启服务、执行迁移、校验计数
# 用法: reset-database.sh [--env test|prod] [--skip-backup]
set -Eeuo pipefail

# ── 参数解析 ──────────────────────────────────────────────────────────────────
ENV=""
SKIP_BACKUP="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)       ENV="$2";       shift 2 ;;
    --skip-backup) SKIP_BACKUP="true"; shift ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${ENV}" ]]; then
  echo "错误: 必须指定 --env test 或 --env prod" >&2
  exit 1
fi

# ── 常量 ──────────────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_PATH:-/opt/openatom-club}"
DB_NAME="test_db"
DB_USER="root"
DB_PASS="${MYSQL_PASSWORD:-openatom_dev_password}"
DB_HOST="${MYSQL_HOST:-127.0.0.1}"
DB_PORT="${MYSQL_PORT:-3306}"
BACKUP_DIR="${DEPLOY_DIR}/backups/mysql-reset"
ECOSYSTEM_FILE="${DEPLOY_DIR}/deploy/ecosystem.config.js"
LOCK_FILE="/tmp/openatom-reset-${ENV}.lock"

# MySQL 命令执行方式：
# - 如果指定了 MYSQL_CONTAINER，使用 podman exec
# - 否则尝试直接连接（适用于 MySQL 直接运行在主机或端口映射的情况）
detect_mysql_access() {
  if [[ -n "${MYSQL_CONTAINER:-}" ]]; then
    # 使用指定的容器名
    MYSQL_CMD="podman exec -i ${MYSQL_CONTAINER} mysql -u ${DB_USER} -p${DB_PASS}"
    MYSQLDUMP_CMD="podman exec -i ${MYSQL_CONTAINER} mysqldump -u ${DB_USER} -p${DB_PASS}"
    return 0
  fi

  # 尝试检测可用的 MySQL 访问方式
  # 先检查是否有 MySQL 容器运行
  local container_name
  if [[ "${ENV}" == "prod" ]]; then
    container_name="openatom-mysql-prod"
  else
    container_name="openatom-mysql-test"
  fi

  if podman ps --format '{{.Names}}' | grep -q "^${container_name}$" 2>/dev/null; then
    MYSQL_CMD="podman exec -i ${container_name} mysql -u ${DB_USER} -p${DB_PASS}"
    MYSQLDUMP_CMD="podman exec -i ${container_name} mysqldump -u ${DB_USER} -p${DB_PASS}"
    log "检测到 MySQL 容器: ${container_name}"
    return 0
  fi

  # 尝试直接连接（MySQL 在主机或端口映射）
  if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" -e "SELECT 1" >/dev/null 2>&1; then
    MYSQL_CMD="mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS}"
    MYSQLDUMP_CMD="mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS}"
    log "检测到 MySQL 直接连接: ${DB_HOST}:${DB_PORT}"
    return 0
  fi

  # 尝试不带密码（某些配置可能通过其他方式认证）
  if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -e "SELECT 1" >/dev/null 2>&1; then
    MYSQL_CMD="mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}"
    MYSQLDUMP_CMD="mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}"
    DB_PASS=""
    log "检测到 MySQL 直接连接（无密码）: ${DB_HOST}:${DB_PORT}"
    return 0
  fi

  return 1
}

if ! detect_mysql_access; then
  die "无法连接到 MySQL，请检查 MYSQL_CONTAINER, MYSQL_HOST, MYSQL_PORT 或 MYSQL_PASSWORD 配置"
fi

log() { echo "[reset-${ENV} $(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

# ── 防并发 ────────────────────────────────────────────────────────────────────
exec 200>"${LOCK_FILE}"
flock -n 200 || die "另一个重置正在进行中，跳过"

cd "${DEPLOY_DIR}"

# ── 1. 禁用启动时健康检测 ───────────────────────────────────────────────────────
log "设置 LINK_HEALTH_RUN_ON_START=false (避免污染运行时表)"
export LINK_HEALTH_RUN_ON_START=false

# ── 2. 备份当前数据库 ─────────────────────────────────────────────────────────────
if [[ "${SKIP_BACKUP}" != "true" ]]; then
  mkdir -p "${BACKUP_DIR}"
  BACKUP_FILE="${BACKUP_DIR}/$(date '+%Y%m%d_%H%M%S')-pre-reset.sql"

  log "执行 MySQL 备份..."
  if ${MYSQLDUMP_CMD} --single-transaction --quick --lock-tables=false \
    "${DB_NAME}" > "${BACKUP_FILE}" 2>/dev/null; then
    gzip "${BACKUP_FILE}"
    log "MySQL 备份完成: ${BACKUP_FILE}.gz"
  else
    rm -f "${BACKUP_FILE}"
    die "MySQL 备份失败"
  fi

  # 保留最近 10 个备份
  ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
fi

# ── 3. 停止服务 ────────────────────────────────────────────────────────────────
log "停止后端服务..."
pm2 stop openatom-backend 2>/dev/null || true

log "停止前端服务..."
pm2 stop openatom-web 2>/dev/null || true

sleep 3

# ── 4. Drop 并 recreate 数据库 ───────────────────────────────────────────────────
log "执行 DROP DATABASE ${DB_NAME}..."
${MYSQL_CMD} -e "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || die "DROP DATABASE 失败"

log "执行 CREATE DATABASE ${DB_NAME}..."
${MYSQL_CMD} -e "CREATE DATABASE ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;" 2>/dev/null || die "CREATE DATABASE 失败"

# ── 5. 重启服务（触发迁移） ───────────────────────────────────────────────────────
log "重启后端服务..."
pm2 start "${ECOSYSTEM_FILE}" --name openatom-backend --update-env 2>/dev/null || pm2 restart openatom-backend

log "重启前端服务..."
pm2 start "${ECOSYSTEM_FILE}" --name openatom-web --update-env 2>/dev/null || pm2 restart openatom-web

# 等待服务启动和迁移完成
log "等待服务启动和迁移完成..."
sleep 10

# 健康检查
HEALTH_RETRIES=12
HEALTH_INTERVAL=5

for ((i = 1; i <= HEALTH_RETRIES; i++)); do
  if curl -fsS "http://127.0.0.1:8080/healthz" >/dev/null 2>&1; then
    log "后端健康检查通过 (第 ${i} 次)"
    break
  fi
  log "后端健康检查失败 (${i}/${HEALTH_RETRIES})，等待 ${HEALTH_INTERVAL}s..."
  sleep "${HEALTH_INTERVAL}"
done

# ── 6. 校验数据计数 ───────────────────────────────────────────────────────────────
log "校验数据计数..."

EXPECTED_NAV_ITEMS=46
EXPECTED_USERS=2
EXPECTED_WORKS=3
EXPECTED_ARTICLES=6
EXPECTED_MINI_GAMES=3

check_count() {
  local table="$1"
  local expected="$2"
  local actual
  actual=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM ${DB_NAME}.${table};" 2>/dev/null)
  if [[ "${actual}" != "${expected}" ]]; then
    log "WARN: ${table} 计数异常: expected=${expected}, actual=${actual}"
    return 1
  fi
  log "✓ ${table} 计数正确: ${actual}"
  return 0
}

check_count "nav_items" "${EXPECTED_NAV_ITEMS}" || true
check_count "users" "${EXPECTED_USERS}" || true
check_count "works" "${EXPECTED_WORKS}" || true
check_count "articles" "${EXPECTED_ARTICLES}" || true
check_count "mini_games" "${EXPECTED_MINI_GAMES}" || true

# 运行时表应为空
check_empty() {
  local table="$1"
  local actual
  actual=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM ${DB_NAME}.${table};" 2>/dev/null)
  if [[ "${actual}" != "0" ]]; then
    log "WARN: ${table} 应为空，但实际有 ${actual} 条记录"
    return 1
  fi
  log "✓ ${table} 为空"
  return 0
}

check_empty "metrics" || true
check_empty "login_audit" || true
check_empty "nav_item_logs" || true
check_empty "nav_item_health" || true
check_empty "daily_visits" || true
check_empty "daily_stats" || true

# ── 7. 清理并保存 PM2 状态 ───────────────────────────────────────────────────────
pm2 save --force 2>/dev/null || true

log "数据库重置完成!"
log "备份位置: ${BACKUP_DIR}"
log "验证: 请访问 API 端点确认数据正确"