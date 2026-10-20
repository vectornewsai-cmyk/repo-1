#!/usr/bin/env bash
# run_all.sh — Chạy toàn bộ benchmark VCut Studio theo thứ tự.
#
# Thứ tự quan trọng: TTS trước (tạo audio giọng nói thật cho caption bench dùng lại).
#   1. render   (bash + node, ~5-15 phút tùy máy)
#   2. tts      (venv server/tts/.venv2, vài phút)
#   3. caption  (venv server/caption/.venv, vài phút)
#   4. bgremove (venv ~/workspace/scratch-bgremove/venv, ~10-30 phút)
# Preview FPS: chạy thủ công bằng benchmarks/preview/bench_preview.js trong browser.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/benchmarks/results"

echo "=== [1/4] Render ==="
bash "$ROOT/benchmarks/render/bench_render.sh"

echo "=== [2/4] TTS ==="
"$ROOT/server/tts/.venv2/bin/python" "$ROOT/benchmarks/tts/bench_tts.py"

echo "=== [3/4] Caption ==="
"$ROOT/server/caption/.venv/bin/python" "$ROOT/benchmarks/caption/bench_caption.py"

echo "=== [4/4] BgRemoval ==="
"$HOME/workspace/scratch-bgremove/venv/bin/python" "$ROOT/benchmarks/bgremove/bench_bgremove.py"

echo ""
echo "Xong toàn bộ. Kết quả thô trong benchmarks/results/."
echo "Preview FPS: chạy thủ công benchmarks/preview/bench_preview.js trong browser."
