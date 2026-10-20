#!/usr/bin/env bash
# start.sh — Khởi chạy VCut Studio sau khi cài đặt (R1-100).
#
# Mở 2 tiến trình nền:
#   - bridge server : http://127.0.0.1:8787  (render, caption, TTS, xoá nền...)
#   - web UI        : http://localhost:5173  (vite preview phục vụ apps/web/dist)
#
# Dừng: Ctrl+C (script tự kill cả 2 tiến trình con khi thoát).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v node >/dev/null 2>&1 || { echo "LỖI: chưa cài Node.js — chạy bash scripts/install.sh trước." >&2; exit 1; }
[[ -d apps/web/dist ]] || { echo "LỖI: chưa có apps/web/dist — chạy bash scripts/install.sh trước." >&2; exit 1; }
[[ -d node_modules ]] || { echo "LỖI: chưa npm ci — chạy bash scripts/install.sh trước." >&2; exit 1; }

BRIDGE_PORT="${BRIDGE_PORT:-8787}"
WEB_PORT="${WEB_PORT:-5173}"

PIDS=()
cleanup() {
  echo; echo "Đang dừng VCut Studio..."
  for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "== khởi động bridge (port $BRIDGE_PORT) =="
node server/bridge/src/index.js --port "$BRIDGE_PORT" &
PIDS+=($!)

echo "== phục vụ web UI (port $WEB_PORT) =="
(cd apps/web && npx vite preview --port "$WEB_PORT" --host 127.0.0.1 --strictPort) &
PIDS+=($!)

sleep 2
echo
echo "================================================================"
echo " VCut Studio đang chạy:"
echo "   Web UI : http://localhost:${WEB_PORT}"
echo "   Bridge : http://127.0.0.1:${BRIDGE_PORT}/api/health"
echo " Nhấn Ctrl+C để dừng."
echo "================================================================"
wait
