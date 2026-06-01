#!/usr/bin/env bash
# deploy/deploy.sh
# 生产环境部署脚本，由 GitHub Actions 通过 SSH 调用。
# 用法: deploy.sh --sha <sha> --frontend-changed <true|false> --backend-changed <true|false> --db-changed <true|false> --web-image <image> --backend-image <image>
set -Eeuo pipefail

# ── 参数解析 ──────────────────────────────────────────────────────────────────
SHA=""
FRONTEND_CHANGED="false"
BACKEND_CHANGED="false"
DB_CHANGED="false"
WEB_IMAGE=""
BACKEND_IMAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sha)              SHA="$2";              shift 2 ;;
    --frontend-changed) FRONTEND_CHANGED="$2"; shift 2 ;;
    --backend-changed)  BACKEND_CHANGED="$2";  shift 2 ;;
    --db-changed)       DB_CHANGED="$2";       shift 2 ;;
    --web-image)        WEB_IMAGE="$2";        shift 2 ;;
    --backend-image)    BACKEND_IMAGE="$2";    shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

# ── 常量 ──────────────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_PATH:-/opt/openatom-club}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
ROLLBACK_FILE="${DEPLOY_DIR}/.env.rollback"
LOCK_FILE="/tmp/openatom-deploy.lock"
HEALTH_RETRIES=12
HEALTH_INTERVAL=5

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
else
  die ".env 文件不存在: ${ENV_FILE}"
fi

# ── SQLite 备份（仅在迁移文件变更时） ─────────────────────────────────────────
# SQLite 是单文件 + WAL 模式，使用 .backup 命令做热备份，无需停服。
# 如果 backend 容器还没启动（首次部署），跳过备份。
if [[ "${DB_CHANGED}" == "true" ]]; then
  BACKUP_DIR="${DEPLOY_DIR}/backups/sqlite"
  mkdir -p "${BACKUP_DIR}"
  BACKUP_FILE="${BACKUP_DIR}/$(date '+%Y%m%d_%H%M%S')-${SHA}.db"

  if docker compose -f "${COMPOSE_FILE}" ps --status running --services 2>/dev/null | grep -qw backend; then
    log "数据库迁移变更 detected，执行 SQLite 热备份..."
    # 容器内执行 .backup 写到挂载的数据目录，再 cp 出来后删除临时文件
    docker compose -f "${COMPOSE_FILE}" exec -T backend \
      sh -c 'cp /app/data/app.db /app/data/.deploy-backup.db' \
      && docker cp "$(docker compose -f "${COMPOSE_FILE}" ps -q backend)":/app/data/.deploy-backup.db "${BACKUP_FILE}" \
      && docker compose -f "${COMPOSE_FILE}" exec -T backend rm -f /app/data/.deploy-backup.db \
      && gzip "${BACKUP_FILE}" \
      && log "SQLite 备份完成: ${BACKUP_FILE}.gz" \
      || log "WARN: SQLite 备份失败，继续部署（建议手动检查）"
  else
    log "backend 容器未运行，跳过 SQLite 备份"
  fi

  # 只保留最近 30 个备份
  ls -1t "${BACKUP_DIR}"/*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
fi

# ── 更新 .env 中的镜像变量 ────────────────────────────────────────────────────
update_env_var() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
  else
    echo "${key}=${value}" >> "${ENV_FILE}"
  fi
}

if [[ "${FRONTEND_CHANGED}" == "true" && -n "${WEB_IMAGE}" ]]; then
  update_env_var "WEB_IMAGE" "${WEB_IMAGE}"
  log "已更新 WEB_IMAGE=${WEB_IMAGE}"
fi

if [[ "${BACKEND_CHANGED}" == "true" && -n "${BACKEND_IMAGE}" ]]; then
  update_env_var "BACKEND_IMAGE" "${BACKEND_IMAGE}"
  log "已更新 BACKEND_IMAGE=${BACKEND_IMAGE}"
fi

# ── 拉取新镜像并重启 ─────────────────────────────────────────────────────────
deploy_service() {
  local service="$1" health_url="$2"
  log "部署 ${service}..."
  docker compose -f "${COMPOSE_FILE}" pull "${service}"
  docker compose -f "${COMPOSE_FILE}" up -d --no-deps "${service}"

  log "等待 ${service} 健康检查..."
  local i
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if curl -fsS "${health_url}" >/dev/null 2>&1; then
      log "${service} 健康检查通过 (第 ${i} 次)"
      return 0
    fi
    log "${service} 健康检查失败 (${i}/${HEALTH_RETRIES})，等待 ${HEALTH_INTERVAL}s..."
    sleep "${HEALTH_INTERVAL}"
  done

  log "ERROR: ${service} 健康检查超时，执行回滚..."
  cp "${ROLLBACK_FILE}" "${ENV_FILE}"
  docker compose -f "${COMPOSE_FILE}" up -d --no-deps "${service}"
  die "${service} 部署失败，已回滚到上一个镜像"
}

if [[ "${FRONTEND_CHANGED}" == "true" ]]; then
  deploy_service "web" "http://127.0.0.1:4000/api/healthz"
fi

if [[ "${BACKEND_CHANGED}" == "true" ]]; then
  deploy_service "backend" "http://127.0.0.1:8080/healthz"
fi

# ── 清理旧镜像 ───────────────────────────────────────────────────────────────
log "清理 7 天前的旧镜像..."
docker image prune -f --filter "until=168h" || true

log "部署完成! SHA=${SHA}"
