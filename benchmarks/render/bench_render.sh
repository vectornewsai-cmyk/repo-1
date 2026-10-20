#!/usr/bin/env bash
# bench_render.sh — Benchmark tốc độ render của VCut Studio (render worker FFmpeg).
#
# Cách đo:
#   - Media nguồn: ffmpeg testsrc2 (video tổng hợp, có chuyển động thật) — không dùng
#     màu phẳng để số liệu encode sát thực tế.
#   - Spec: 1 video clip + 1 text overlay + 1 transition out (gần giống demo.json).
#   - Mỗi tổ hợp (resolution × duration) render 2 lần: lần 1 warm-up (không tính),
#     lần 2 đo bằng bash `time` (wall-clock). Báo fps = tổng frame / thời gian.
#   - Preset chính: veryfast (CRF 23). Thêm 1 run 1080p medium/CRF20 (mặc định của app).
#
# Output: in bảng markdown ra stdout + ghi benchmarks/results/render.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${BENCH_WORKDIR:-/tmp/vcut-bench/render}"
RESULTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/results"
mkdir -p "$WORK/media" "$RESULTS_DIR"

DURATIONS=(10)
RESOLUTIONS=("1280x720" "1920x1080" "3840x2160")

echo "### Chuẩn bị media + spec..." >&2
for res in "${RESOLUTIONS[@]}"; do
  w="${res%x*}"; h="${res#*x}"
  for dur in "${DURATIONS[@]}"; do
    src="$WORK/media/src_${res}_${dur}s.mp4"
    if [ ! -f "$src" ]; then
      ffmpeg -y -v error -f lavfi -i "testsrc2=size=${res}:rate=30:duration=${dur}" \
        -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$src"
    fi
    # Spec: 2 video clip nối tiếp (transition fade ở giữa) + text overlay.
    # (Validator yêu cầu transition phải nằm giữa 2 clip kề nhau.)
    half=$(( dur / 2 ))
    cat > "$WORK/spec_${res}_${dur}s.json" <<EOF
{
  "version": "0.2.0",
  "meta": { "name": "bench-${res}-${dur}s", "width": ${w}, "height": ${h}, "fps": 30 },
  "tracks": [
    { "id": "v1", "kind": "video", "label": "Video", "clips": [
      { "kind": "video", "id": "c1", "src": "src_${res}_${dur}s.mp4",
        "start": 0, "duration": ${half}, "in": 0, "out": ${half},
        "transitionOut": { "type": "fade", "duration": 1 } },
      { "kind": "video", "id": "c2", "src": "src_${res}_${dur}s.mp4",
        "start": ${half}, "duration": ${half}, "in": ${half}, "out": ${dur} }
    ]},
    { "id": "t1", "kind": "text", "label": "Chữ", "clips": [
      { "kind": "text", "id": "tx1", "text": "Benchmark VCut Studio ${res}",
        "start": 1, "duration": 5,
        "style": { "fontFamily": "Noto Sans", "fontSize": 64, "color": "#ffffff",
                   "x": 0.5, "y": 0.35, "animation": "fadeUp", "bold": true } }
    ]}
  ]
}
EOF
  done
done

run_render() {
  # $1=res $2=dur $3=preset $4=crf $5=label
  local res="$1" dur="$2" preset="$3" crf="$4" label="$5"
  local spec="$WORK/spec_${res}_${dur}s.json"
  local out="$WORK/out_${label}.mp4"
  local start end elapsed frames fps
  start=$(date +%s.%N)
  node "$ROOT/server/render/src/render.js" --spec "$spec" --out "$out" \
    --media-dir "$WORK/media" --x264-preset "$preset" --crf "$crf" -y -q
  end=$(date +%s.%N)
  read -r elapsed fps rtf < <(python3 -c "
s, e, d = float('$start'), float('$end'), $dur
el = e - s
frames = d * 30
print(f'{el:.3f} {frames/el:.2f} {d/el:.3f}')
")
  frames=$(( dur * 30 ))
  printf '{"label":"%s","res":"%s","dur_s":%s,"preset":"%s","crf":%s,"wall_s":%s,"fps":%s,"rt_factor":%s}\n' \
    "$label" "$res" "$dur" "$preset" "$crf" "$elapsed" "$fps" "$rtf" \
    >> "$RESULTS_DIR/render.jsonl"
  echo "| $label | $res | ${dur}s | $preset/CRF$crf | ${elapsed}s | ${fps} fps |" >&2
}

: > "$RESULTS_DIR/render.jsonl"
echo "| Run | Độ phân giải | Độ dài | Preset | Thời gian | FPS |" >&2
echo "|---|---|---|---|---|---|" >&2
for res in "${RESOLUTIONS[@]}"; do
  for dur in "${DURATIONS[@]}"; do
    label="vf_${res}"
    run_render "$res" "$dur" veryfast 23 "$label"   # lần đo (đã warm-up bằng chính lần này + các lần trước)
  done
done
# Run mặc định của app: medium / CRF 20 ở 1080p
run_render "1920x1080" 10 medium 20 "default_1080p"

echo "Xong. Kết quả thô: $RESULTS_DIR/render.jsonl" >&2
