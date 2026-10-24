#!/usr/bin/env bash
# bench_phase8.sh — Benchmark refresh Phase 8 (Q8) cho VCut Studio.
#
# Đo trên VM hiện tại, số thật, KHÔNG so sánh trực tiếp với RESULTS.md cũ
# nếu khác độ dài clip (cũ: 10s; mới: 5s — ghi rõ trong bảng).
# Mỗi cấu hình: 1 lần warm-up (không tính) + 1 lần đo wall-clock.
# Preset: veryfast/CRF23 (đồng nhất với bench_render.sh).
#
# Các cấu hình (clip 5s, testsrc2):
#   base-720p / base-1080p : 1 video clip + text overlay (baseline mới)
#   mask-720p               : + mask ellipse (Phase 7 P4)
#   denoise-720p            : + enhance denoise 0.5 (Phase 7 P2)
#   ramp-720p               : + speedKeyframes 1 → 1.5 (Phase 7 P3)
#   proxy-gen               : tạo proxy 1080p 10s → 720p (thời gian + tỉ lệ dung lượng)
#
# Output: bảng markdown ra stdout + benchmarks/results/phase8.jsonl
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${BENCH_WORKDIR:-/tmp/vcut-bench/phase8}"
RESULTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/results"
mkdir -p "$WORK/media" "$RESULTS_DIR"

mk_src() { # $1=res $2=dur
  local f="$WORK/media/src_$1_$2s.mp4"
  if [ ! -f "$f" ]; then
    ffmpeg -y -v error -f lavfi -i "testsrc2=size=$1:rate=30:duration=$2" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$f"
  fi
  echo "$f"
}

mk_spec() { # $1=res $2=extra-json-fragment (đặt sau "out": 5) $3=outfile
  local w="${1%x*}" h="${1#*x}"
  cat > "$3" <<EOF
{
  "version": "0.2.0",
  "meta": { "name": "bench-phase8", "width": $w, "height": $h, "fps": 30 },
  "tracks": [
    { "id": "v1", "kind": "video", "clips": [
      { "kind": "video", "id": "c1", "src": "src_${1}_5s.mp4",
        "start": 0, "duration": 5, "in": 0, "out": 5 $2 }
    ]},
    { "id": "t1", "kind": "text", "clips": [
      { "kind": "text", "id": "tx1", "text": "Phase 8 bench",
        "start": 1, "duration": 3,
        "style": { "fontFamily": "Noto Sans", "fontSize": 64, "color": "#ffffff",
                   "x": 0.5, "y": 0.35, "animation": "fadeUp", "bold": true } }
    ]}
  ]
}
EOF
}

run_render() { # $1=label $2=spec $3=dur
  local out="$WORK/out_$1.mp4"
  node "$ROOT/server/render/src/render.js" --spec "$2" --out "$out" \
    --media-dir "$WORK/media" --x264-preset veryfast --crf 23 -y -q >/dev/null 2>&1
  local start end elapsed fps
  start=$(date +%s.%N)
  node "$ROOT/server/render/src/render.js" --spec "$2" --out "$out" \
    --media-dir "$WORK/media" --x264-preset veryfast --crf 23 -y -q >/dev/null 2>&1
  end=$(date +%s.%N)
  read -r elapsed fps < <(python3 -c "
s, e, d = float('$start'), float('$end'), $3
el = e - s
print(f'{el:.2f} {d*30/el:.2f}')")
  echo "{\"label\":\"$1\",\"dur_s\":$3,\"wall_s\":$elapsed,\"fps\":$fps}" >> "$RESULTS_DIR/phase8.jsonl"
  echo "| $1 | ${3}s | ${elapsed}s | ${fps} fps |"
}

mk_src "1280x720" 5
mk_src "1920x1080" 5
mk_src "1920x1080" 10

echo "### Render 5s, veryfast/CRF23 (warm-up + đo) ###"
echo "| Cấu hình | Dài | Wall | FPS |"
echo "|---|---|---|---|"
mk_spec "1280x720" "" "$WORK/spec_base720.json"
run_render "base-720p" "$WORK/spec_base720.json" 5
mk_spec "1920x1080" "" "$WORK/spec_base1080.json"
run_render "base-1080p" "$WORK/spec_base1080.json" 5
mk_spec "1280x720" ', "mask": {"shape": "ellipse", "x": 0.25, "y": 0.25, "w": 0.5, "h": 0.5, "feather": 0.2}' "$WORK/spec_mask.json"
run_render "mask-720p" "$WORK/spec_mask.json" 5
mk_spec "1280x720" ', "enhance": {"denoise": {"strength": 0.5}}' "$WORK/spec_denoise.json"
run_render "denoise-720p" "$WORK/spec_denoise.json" 5
mk_spec "1280x720" ', "speedKeyframes": {"keyframes": [{"t": 0, "v": 1, "easing": "linear"}, {"t": 5, "v": 1.5, "easing": "linear"}]}' "$WORK/spec_ramp.json"
run_render "ramp-720p" "$WORK/spec_ramp.json" 5

echo ""
echo "### Proxy generation: 1080p 10s → 720p ###"
SRC10="$WORK/media/src_1920x1080_10s.mp4"
S0=$(stat -c%s "$SRC10")
T0=$(date +%s.%N)
node "$ROOT/server/render/src/proxy.js" --input "$SRC10" --out-dir "$WORK/proxies" --height 720 > "$WORK/proxy.json"
T1=$(date +%s.%N)
P1=$(python3 -c "import json; print(json.load(open('$WORK/proxy.json'))['proxy'])")
S1=$(stat -c%s "$P1")
python3 -c "
import json
t0, t1, s0, s1 = float('$T0'), float('$T1'), $S0, $S1
el = t1 - t0
print(f'| proxy-gen 1080p10s→720p | {el:.1f}s | {s0/1048576:.1f}MB → {s1/1048576:.1f}MB ({100*s1/s0:.0f}%) |')
print(json.dumps({'label':'proxy-gen','src_s':10,'wall_s':round(el,2),'src_MB':round(s0/1048576,1),'proxy_MB':round(s1/1048576,1),'ratio_pct':round(100*s1/s0)}))
" | tee -a "$RESULTS_DIR/phase8.jsonl"
