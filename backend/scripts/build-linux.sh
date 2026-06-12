#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT_DIR="${ROOT_DIR}/bin"

mkdir -p "$OUT_DIR"
cd "$ROOT_DIR"
export GOFLAGS="${GOFLAGS:--p=1}"
export GOMAXPROCS="${GOMAXPROCS:-1}"
export GOTOOLCHAIN="${GOTOOLCHAIN:-auto}"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o "$OUT_DIR/openatom-backend-linux-amd64" .
printf 'Backend binary created at %s\n' "$OUT_DIR/openatom-backend-linux-amd64"
