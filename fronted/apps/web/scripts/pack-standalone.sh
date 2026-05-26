#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DIST_DIR="${1:-$ROOT_DIR/dist}"

cd "$ROOT_DIR"
npm run build
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
cp -R .next/standalone/. "$DIST_DIR/"
mkdir -p "$DIST_DIR/.next"
cp -R .next/static "$DIST_DIR/.next/static"
cp -R public "$DIST_DIR/public"
find "$DIST_DIR" -name "._*" -delete
rm -f "$DIST_DIR"/.env "$DIST_DIR"/.env.local "$DIST_DIR"/.env.*.local

printf 'Standalone bundle created at %s\n' "$DIST_DIR"
