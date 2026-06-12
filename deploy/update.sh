#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="${DEPLOY_PATH:-/opt/openatom-club}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-${DEPLOY_DIR}/.deploy-env}"
if [[ -f "${DEPLOY_ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${DEPLOY_ENV_FILE}"
  set +a
fi

DEPLOY_DIR="${DEPLOY_PATH:-${DEPLOY_DIR}}"
ECOSYSTEM_FILE="${DEPLOY_DIR}/deploy/ecosystem.config.js"
LOCK_FILE="/tmp/openatom-tag-update.lock"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
BACKEND_BIN="${DEPLOY_DIR}/backend/bin/openatom-backend-linux-amd64"
FRONTEND_DIST="${DEPLOY_DIR}/frontend/apps/web/dist"
TARGET_TAG="${DEPLOY_TARGET_TAG:-}"
SERVER_ADDR="${SERVER_ADDR:-:8080}"
FRONTEND_HEALTH_URL="${FRONTEND_HEALTH_URL:-http://127.0.0.1:4000/api/healthz}"
DEPLOY_JOB_ID="${DEPLOY_JOB_ID:-manual}"
DEPLOY_STATUS_FILE="${DEPLOY_STATUS_FILE:-/tmp/openatom-tag-update-status.env}"
DEPLOY_LOG_FILE="${DEPLOY_LOG_FILE:-/tmp/openatom-tag-update.log}"
SKIP_BACKEND_BUILD="${SKIP_BACKEND_BUILD:-0}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"
SKIP_GIT_CHECKOUT="${SKIP_GIT_CHECKOUT:-0}"
DEPLOY_STARTED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
DEPLOY_FINALIZED=0
export GOTOOLCHAIN="${GOTOOLCHAIN:-auto}"
export GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"
export GOSUMDB="${GOSUMDB:-sum.golang.org https://goproxy.cn/sumdb/sum.golang.org}"
export GOFLAGS="${GOFLAGS:--p=1}"
export GOMAXPROCS="${GOMAXPROCS:-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TARGET_TAG="$2"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

log() {
  local line="[tag-update $(date '+%Y-%m-%d %H:%M:%S')] $*"
  if [[ -n "${DEPLOY_LOG_FILE}" ]]; then
    echo "${line}" | tee -a "${DEPLOY_LOG_FILE}"
  else
    echo "${line}"
  fi
}
die() { log "ERROR: $*"; exit 1; }

write_state() {
  local phase="$1"
  local error="${2:-}"
  local finished_at=""
  if [[ "${phase}" == "success" || "${phase}" == "failed" ]]; then
    finished_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  fi
  cat >"${DEPLOY_STATUS_FILE}" <<EOF
phase=${phase}
job_id=${DEPLOY_JOB_ID}
latest_tag=${TARGET_TAG}
repo_path=${DEPLOY_DIR}
update_script=${DEPLOY_DIR}/deploy/update.sh
started_at=${DEPLOY_STARTED_AT}
finished_at=${finished_at}
error=${error//$'\n'/ }
log_file=${DEPLOY_LOG_FILE}
EOF
}

finalize_state() {
  DEPLOY_FINALIZED=1
  write_state "$1" "${2:-}"
}

on_exit() {
  local code=$?
  if [[ ${code} -ne 0 && ${DEPLOY_FINALIZED} -eq 0 ]]; then
    write_state "failed" "exit code ${code}"
  fi
}
trap on_exit EXIT

backend_health_url() {
  if [[ -n "${BACKEND_HEALTH_URL:-}" ]]; then
    echo "${BACKEND_HEALTH_URL}"
    return
  fi
  local port="${SERVER_ADDR##*:}"
  if [[ -z "${port}" ]]; then
    port="8080"
  elif [[ "${port}" == "${SERVER_ADDR}" && ! "${port}" =~ ^[0-9]+$ ]]; then
    port="8080"
  fi
  echo "http://127.0.0.1:${port}/healthz"
}

if [[ -z "${TARGET_TAG}" ]]; then
  die "missing --tag"
fi

mkdir -p "$(dirname "${DEPLOY_STATUS_FILE}")" "$(dirname "${DEPLOY_LOG_FILE}")"
: >"${DEPLOY_LOG_FILE}"
write_state "deploying"

exec 200>"${LOCK_FILE}"
flock -n 200 || die "another tag update is already running"

cd "${DEPLOY_DIR}"
if [[ "${SKIP_GIT_CHECKOUT}" != "1" ]]; then
  [[ -d .git ]] || die "${DEPLOY_DIR} is not a Git repository"
  PREVIOUS_REF="$(git rev-parse HEAD)"
  PREVIOUS_LABEL="$(git describe --tags --exact-match HEAD 2>/dev/null || git rev-parse --short HEAD)"
else
  PREVIOUS_REF="$(git rev-parse HEAD 2>/dev/null || true)"
  PREVIOUS_LABEL="$(git describe --tags --exact-match HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "uploaded-artifact")"
fi

health_check() {
  local service="$1" url="$2"
  local i
  log "waiting for ${service}: ${url}"
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      log "${service} health check passed (${i}/${HEALTH_RETRIES})"
      return 0
    fi
    log "${service} health check failed (${i}/${HEALTH_RETRIES}); retry in ${HEALTH_INTERVAL}s"
    sleep "${HEALTH_INTERVAL}"
  done
  return 1
}

build_backend() {
  if [[ "${SKIP_BACKEND_BUILD}" == "1" ]]; then
    [[ -x "${BACKEND_BIN}" ]] || die "prebuilt backend binary not found: ${BACKEND_BIN}"
    log "using prebuilt backend binary"
    return
  fi
  log "building backend"
  cd "${DEPLOY_DIR}/backend"
  bash scripts/build-linux.sh
  chmod +x "${BACKEND_BIN}"
}

build_frontend() {
  if [[ "${SKIP_FRONTEND_BUILD}" == "1" ]]; then
    [[ -f "${FRONTEND_DIST}/server.js" ]] || die "prebuilt frontend standalone not found: ${FRONTEND_DIST}/server.js"
    log "using prebuilt frontend standalone bundle"
    return
  fi
  log "installing frontend dependencies"
  cd "${DEPLOY_DIR}/frontend/apps/web"
  npm ci
  log "building frontend standalone bundle"
  bash scripts/pack-standalone.sh "${FRONTEND_DIST}"
}

restart_services() {
  cd "${DEPLOY_DIR}"
  if ! command -v pm2 >/dev/null 2>&1; then
    log "installing pm2"
    npm install -g pm2
  fi
  pm2 startOrReload "${ECOSYSTEM_FILE}" --only openatom-backend --update-env
  pm2 startOrReload "${ECOSYSTEM_FILE}" --only openatom-web --update-env
  pm2 save --force >/dev/null 2>&1 || true
}

rollback() {
  log "rolling back to ${PREVIOUS_LABEL} (${PREVIOUS_REF})"
  cd "${DEPLOY_DIR}"
  git checkout --quiet "${PREVIOUS_REF}" || true
  build_backend || true
  build_frontend || true
  restart_services || true
}

log "current ref: ${PREVIOUS_LABEL} (${PREVIOUS_REF})"
log "target tag: ${TARGET_TAG}"
if [[ "${SKIP_GIT_CHECKOUT}" == "1" ]]; then
  log "using uploaded artifact; skipping git fetch and checkout"
else
  git fetch --tags --force origin
  git rev-parse -q --verify "refs/tags/${TARGET_TAG}" >/dev/null || die "tag not found: ${TARGET_TAG}"
  git checkout --quiet "refs/tags/${TARGET_TAG}"
  log "checked out $(git rev-parse --short HEAD)"
fi

if ! build_backend; then
  rollback
  die "backend build failed"
fi

if ! build_frontend; then
  rollback
  die "frontend build failed"
fi

if ! restart_services; then
  rollback
  die "service restart failed"
fi

if ! health_check "backend" "$(backend_health_url)"; then
  rollback
  die "backend health check failed"
fi

if ! health_check "frontend" "${FRONTEND_HEALTH_URL}"; then
  rollback
  die "frontend health check failed"
fi

finalize_state "success"
log "tag update completed: ${TARGET_TAG}"
