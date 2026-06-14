#!/usr/bin/env bash
# deploy/deploy.sh
# 生产环境部署脚本（PM2 + 裸二进制模式）
# 由 GitHub Actions 通过 SSH 调用。
# 用法: deploy.sh --sha <sha> --frontend-changed <true|false> --backend-changed <true|false> --db-changed <true|false>
set -Eeuo pipefail

# ── 参数解析 ──────────────────────────────────────────────────────────────────
SHA=""
FRONTEND_CHANGED="false"
BACKEND_CHANGED="false"
DB_CHANGED="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sha)              SHA="$2";              shift 2 ;;
    --frontend-changed) FRONTEND_CHANGED="$2"; shift 2 ;;
    --backend-changed)  BACKEND_CHANGED="$2";  shift 2 ;;
    --db-changed)       DB_CHANGED="$2";       shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${SHA}" ]]; then
  echo "错误: 必须指定 --sha 参数" >&2; exit 1
fi

# ── 常量 ──────────────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_PATH:-/opt/openatom-club}"
ECOSYSTEM_FILE="${DEPLOY_DIR}/deploy/ecosystem.config.js"
BACKEND_CONFIG="${DEPLOY_DIR}/backend/config.yaml"
ENV_FILE="${DEPLOY_DIR}/.env"
ROLLBACK_FILE="${DEPLOY_DIR}/.env.rollback"
LOCK_FILE="/tmp/openatom-deploy.lock"
HEALTH_RETRIES=12
HEALTH_INTERVAL=5
BACKEND_BIN="${DEPLOY_DIR}/backend/bin/openatom-backend-linux-amd64"
FRONTEND_DIST="${DEPLOY_DIR}/frontend/apps/web/dist"

log() { echo "[deploy $(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

# ── 防并发 ────────────────────────────────────────────────────────────────────
exec 200>"${LOCK_FILE}"
flock -n 200 || die "另一个部署正在进行中，跳过"

cd "${DEPLOY_DIR}"

# ── 备份当前 .env ─────────────────────────────────────────────────────────────
if [[ -f "${ENV_FILE}" ]]; then
  cp "${ENV_FILE}" "${ROLLBACK_FILE}"
  log "已备份 .env → .env.rollback"
fi

# ── 拉取代码到指定 SHA ──────────────────────────────────────────────────────
log "切换到 ${SHA}..."
git fetch origin --quiet
git checkout "${SHA}" --quiet
log "当前 commit: $(git rev-parse --short HEAD)"

# ── Database backup (仅当迁移文件变更时) ──────────────────────────────────────
if [[ "${DB_CHANGED}" == "true" ]]; then
  BACKUP_DIR="${DEPLOY_DIR}/backups/mysql"
  mkdir -p "${BACKUP_DIR}"
  BACKUP_FILE="${BACKUP_DIR}/$(date '+%Y%m%d_%H%M%S')-${SHA}.sql"

  log "数据库迁移变更 detected，执行 MySQL 备份..."
  if mysqldump -h 127.0.0.1 -P 3306 -uroot \
    --single-transaction --quick --lock-tables=false \
    test_db > "${BACKUP_FILE}" 2>/dev/null; then
    gzip "${BACKUP_FILE}"
    log "MySQL 备份完成: ${BACKUP_FILE}.gz"
  else
    rm -f "${BACKUP_FILE}"
    log "WARN: MySQL 备份失败，继续部署（建议手动检查）"
  fi

  # 保留最近 30 个备份
  ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
fi

# ── 确保 PM2 已安装 ─────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "安装 PM2..."
  npm install -g pm2
fi

# ── 构建后端 ─────────────────────────────────────────────────────────────────
if [[ "${BACKEND_CHANGED}" == "true" ]]; then
  log "构建后端..."
  cd "${DEPLOY_DIR}/backend"
  bash scripts/build-linux.sh
  chmod +x "${BACKEND_BIN}"
  log "后端构建完成: ${BACKEND_BIN}"
fi

# ── 构建前端 ─────────────────────────────────────────────────────────────────
if [[ "${FRONTEND_CHANGED}" == "true" ]]; then
  log "构建前端..."
  cd "${DEPLOY_DIR}/frontend/apps/web"
  bash scripts/pack-standalone.sh "${FRONTEND_DIST}"
  log "前端构建完成: ${FRONTEND_DIST}"
fi

# ── 重启后端 (PM2) ──────────────────────────────────────────────────────────
if [[ "${BACKEND_CHANGED}" == "true" ]]; then
  log "重启后端服务..."
  cd "${DEPLOY_DIR}"
  pm2 delete openatom-backend 2>/dev/null || true
  pm2 start "${ECOSYSTEM_FILE}" --name openatom-backend
  log "后端 PM2 进程已启动"
fi

# ── 重启前端 (PM2) ──────────────────────────────────────────────────────────
if [[ "${FRONTEND_CHANGED}" == "true" ]]; then
  log "重启前端服务..."
  cd "${DEPLOY_DIR}"
  pm2 delete openatom-web 2>/dev/null || true
  pm2 start "${ECOSYSTEM_FILE}" --name openatom-web
  log "前端 PM2 进程已启动"
fi

# ── PM2 持久化（开机自启） ──────────────────────────────────────────────────
pm2 save --force 2>/dev/null || true

# ── 健康检查 ─────────────────────────────────────────────────────────────────
health_check() {
  local service="$1" url="$2"
  log "等待 ${service} 健康检查..."
  local i
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      log "${service} 健康检查通过 (第 ${i} 次)"
      return 0
    fi
    log "${service} 健康检查失败 (${i}/${HEALTH_RETRIES})，等待 ${HEALTH_INTERVAL}s..."
    sleep "${HEALTH_INTERVAL}"
  done
  return 1
}

if [[ "${BACKEND_CHANGED}" == "true" ]]; then
  if ! health_check "backend" "http://127.0.0.1:8080/healthz"; then
    log "ERROR: 后端健康检查超时，回滚..."
    # 回滚: checkout 回上一个版本并重启
    if [[ -f "${ROLLBACK_FILE}" ]]; then
      PREV_SHA=$(head -1 "${ROLLBACK_FILE}" 2>/dev/null || echo "")
    fi
    git checkout HEAD~1 --quiet 2>/dev/null || true
    cd "${DEPLOY_DIR}/backend" && bash scripts/build-linux.sh 2>/dev/null
    chmod +x "${BACKEND_BIN}"
    pm2 restart openatom-backend
    die "后端部署失败，已回滚"
  fi
fi

if [[ "${FRONTEND_CHANGED}" == "true" ]]; then
  if ! health_check "frontend" "http://127.0.0.1:4000/api/healthz"; then
    log "ERROR: 前端健康检查超时，回滚..."
    git checkout HEAD~1 --quiet 2>/dev/null || true
    cd "${DEPLOY_DIR}/frontend/apps/web" && bash scripts/pack-standalone.sh "${FRONTEND_DIST}" 2>/dev/null
    pm2 restart openatom-web
    die "前端部署失败，已回滚"
  fi
fi

# ── 保存 PM2 进程列表 ──────────────────────────────────────────────────────
pm2 save --force 2>/dev/null || true

log "部署完成! SHA=${SHA}"
