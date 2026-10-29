#!/usr/bin/env bash
# bench_motion.sh — Benchmark slow-mo / nội suy frame / motion blur (Phase 9 đợt 8, S6).
#
# Cách đo (theo mẫu benchmarks/render/bench_render.sh):
#   - Media nguồn: ffmpeg testsrc2 (video tổng hợp, có chuyển động thật) —
#     không dùng màu phẳng để số liệu sát thực tế.
#   - 3 cấu hình trên CÙNG nguồn ngắn 640x360, 15fps, 4s (60 frame):
#       plain       : encode thẳng, không filter motion (baseline)
#       minterpolate: minterpolate fps=30 (mci/aobmc/bidir — đúng filter
#                     mà server/render/src/motion.js dựng cho clip.motion)
#       tmix        : tmix frames=5 (motion blur của clip.motion)
#   - Mỗi cấu hình đo bằng bash `date +%s.%N` (wall-clock), preset
#     veryfast/CRF 23 như bench_render.sh. Chỉ ghi thời gian thật —
#     KHÔNG suy ra fps cho máy khác (xem docs/MOTION_ROUND_LIMITS.md).
#   - Số frame output đếm bằng ffprobe -count_frames (xác minh, không
#     chỉ tin duration).
#
# Output: in bảng markdown ra stdout + ghi benchmarks/results/motion.jsonl
# (mỗi lần chạy ghi đè file — khớp mẫu render.jsonl của bench_render.sh).
# MP4/ảnh trung gian nằm trong workdir /tmp, KHÔNG ghi binary vào repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${BENCH_WORKDIR:-/tmp/vcut-bench/motion}"
RESULTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/results"
mkdir -p "$WORK" "$RESULTS_DIR"

W=640; H=360; SRC_FPS=15; SRC_DUR=4
SRC="$WORK/src_${W}x${H}_${SRC_FPS}fps_${SRC_DUR}s.mp4"
INTERP="minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"

echo "### Chuẩn bị nguồn testsrc2 ${W}x${H} ${SRC_FPS}fps ${SRC_DUR}s..." >&2
if [ ! -f "$SRC" ]; then
  ffmpeg -y -v error -f lavfi -i "testsrc2=size=${W}x${H}:rate=${SRC_FPS}:duration=${SRC_DUR}" \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SRC"
fi

count_frames() {
  ffprobe -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of csv=p=0 "$1"
}

run_cfg() {
  # $1=label $2=filter (rỗng = plain)
  local label="$1" vf="$2"
  local out="$WORK/out_${label}.mp4"
  local start end elapsed frames
  start=$(date +%s.%N)
  if [ -z "$vf" ]; then
    ffmpeg -y -v error -i "$SRC" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out"
  else
    ffmpeg -y -v error -i "$SRC" -vf "$vf" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out"
  fi
  end=$(date +%s.%N)
  elapsed=$(python3 -c "print(f'{float('$end') - float('$start'):.3f}')")
  frames=$(count_frames "$out")
  printf '{"label":"%s","src":"%sx%s_%sfps_%ss","filter":"%s","wall_s":%s,"out_frames":%s,"ffmpeg":"%s","nproc":%s}\n' \
    "$label" "$W" "$H" "$SRC_FPS" "$SRC_DUR" "$vf" "$elapsed" "$frames" \
    "$(ffmpeg -version 2>/dev/null | head -1 | sed 's/"/\\"/g')" "$(nproc)" \
    >> "$RESULTS_DIR/motion.jsonl"
  echo "| $label | ${vf:-(không filter)} | ${elapsed}s | $frames frame |" >&2
}

: > "$RESULTS_DIR/motion.jsonl"
echo "| Cấu hình | Filter | Thời gian | Frame output |" >&2
echo "|---|---|---|---|" >&2
run_cfg "plain" ""
run_cfg "minterpolate" "$INTERP"
run_cfg "tmix" "tmix=frames=5"

echo "Xong. Kết quả thô: $RESULTS_DIR/motion.jsonl" >&2
echo "Lưu ý: thời gian chỉ đúng cho máy chạy bench này (xem docs/MOTION_ROUND_LIMITS.md)." >&2
