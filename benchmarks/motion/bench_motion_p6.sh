#!/usr/bin/env bash
# bench_motion_p6.sh — Benchmark Phase 9 đợt 11 P6 (nợ đợt 9 chưa đo).
#
#   1. tmix ở 4K (M5 chỉ đo tmix tới 1080p, interp tới 4K — tmix 4K chưa đo).
#   2. ramp+motion ở 1080p qua render.js THẬT (spec speedKeyframes +
#      motion minterpolate+blur), kèm đối chứng ramp-only cùng nguồn.
#
# Nguồn: footage TỔNG HỢP (testsrc2 + vuông đỏ chuyển động, theo mẫu M5) —
# KHÔNG phải footage quay thật. Repo không có sẵn footage quay thật nào
# (find assets/ benchmarks/ không thấy .mp4/.mkv/.mov). Mọi số chỉ đúng
# trên máy đo (2 vCPU, CPU-only) và mỗi cấu hình chỉ chạy 1 lần (M5 ghi
# dao động giữa 2 lần chạy ~18% — số P6 cũng chịu dao động đó).
#
# Output: bảng markdown ra stdout + benchmarks/results/motion_p6.jsonl
# (ghi đè mỗi lần chạy). File trung gian trong /tmp, KHÔNG binary vào repo.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${BENCH_WORKDIR:-/tmp/vcut-bench/p6}"
RESULTS_DIR="$ROOT/benchmarks/results"
mkdir -p "$WORK" "$RESULTS_DIR"
: > "$RESULTS_DIR/motion_p6.jsonl"

TIMEOUT="${BENCH_TIMEOUT:-900}"
FFMPEG_VER="$(ffmpeg -version 2>/dev/null | head -1 | sed 's/"/\\"/g')"
NPROC="$(nproc)"
MEM="$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}')"

count_frames() {
  ffprobe -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of csv=p=0 "$1" 2>/dev/null || echo "?"
}
probe_duration() {
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" 2>/dev/null || echo "?"
}

row() {
  # "?" (timeout/fail) không phải JSON hợp lệ — ghi null thay vì ? trần.
  local w="$4" f="$5" d="$6"
  [ "$w" = "?" ] && w=null
  [ "$f" = "?" ] && f=null
  [ "$d" = "?" ] && d=null
  printf '{"label":"%s","res":"%s","filter":"%s","wall_s":%s,"out_frames":%s,"out_duration_s":%s,"status":"%s","note":"%s","ffmpeg":"%s","nproc":%s,"mem":"%s"}\n' \
    "$1" "$2" "$(printf '%s' "$3" | sed 's/"/\\"/g')" "$w" "$f" "$d" "$7" "$8" \
    "$FFMPEG_VER" "$NPROC" "$MEM" >> "$RESULTS_DIR/motion_p6.jsonl"
  echo "| $1 | $2 | ${3:-(không filter)} | $4 | $5 | $6 | $7 | $8 |"
}

run_cfg() {
  local label="$1" res="$2" src="$3" vf="$4" note="$5"
  local out="$WORK/out_${label}_${res}.mp4"
  local start end elapsed frames dur status rc
  start=$(date +%s.%N)
  if [ -z "$vf" ]; then
    timeout "$TIMEOUT" ffmpeg -y -v error -i "$src" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out" 2>"$WORK/err_${label}_${res}.log"
  else
    timeout "$TIMEOUT" ffmpeg -y -v error -i "$src" -vf "$vf" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out" 2>"$WORK/err_${label}_${res}.log"
  fi
  rc=$?
  end=$(date +%s.%N)
  elapsed=$(python3 -c "print(f'{float('$end') - float('$start'):.3f}')")
  if [ "$rc" -eq 124 ]; then status="TIMEOUT"; frames="?"; dur="?"
  elif [ "$rc" -ne 0 ]; then status="FAIL"; frames="?"; dur="?"
  else status="ok"; frames=$(count_frames "$out"); dur=$(probe_duration "$out"); fi
  row "$label" "$res" "$vf" "$elapsed" "$frames" "$dur" "$status" "$note"
}

echo "### Máy đo: nproc=$NPROC RAM=$MEM FFmpeg: $FFMPEG_VER"
echo "| Cấu hình | Độ phân giải | Filter | Thời gian (s) | Frame output | Duration (s) | Trạng thái | Ghi chú |"
echo "|---|---|---|---|---|---|---|---|"

# --- 1. tmix 4K: nguồn 3840x2160 25fps 2s (cùng công thức nguồn M5) ---
SRC4K="$WORK/src_3840x2160_25fps_2s.mp4"
if [ ! -f "$SRC4K" ]; then
  echo "### Tạo nguồn 4K 2s (testsrc2 + vật thể động)..." >&2
  ffmpeg -y -v error \
    -f lavfi -i "testsrc2=size=3840x2160:rate=25:duration=2" \
    -f lavfi -i "color=c=0xFF3030:s=320x320:rate=25:duration=2,format=yuva420p" \
    -filter_complex "[0:v][1:v]overlay=x='80+1000*abs(sin(t))':y='60+600*abs(cos(t))':shortest=1" \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SRC4K"
fi
run_cfg "plain" "3840x2160" "$SRC4K" "" "4K baseline 2s, nguồn vật thể động"
# Chain blur đúng motion.js buildMotionBlurChain: fps=25 rồi tmix weights đều.
run_cfg "tmix3" "3840x2160" "$SRC4K" "fps=25,tmix=frames=3:weights=1 1 1" "tmix frames=3 4K"
run_cfg "tmix5" "3840x2160" "$SRC4K" "fps=25,tmix=frames=5:weights=1 1 1 1 1" "tmix frames=5 4K"
run_cfg "tmix8" "3840x2160" "$SRC4K" "fps=25,tmix=frames=8:weights=1 1 1 1 1 1 1 1" "tmix frames=8 4K"

# --- 2. ramp+motion 1080p qua render.js thật ---
# Nguồn 1920x1080 30fps 2s (testsrc2 + vật thể động); spec: 1 clip video,
# speedKeyframes 1 -> 0.5 (như test_motion_ramp.js), project fps 30.
SRC1080="$WORK/src_1920x1080_30fps_2s.mp4"
if [ ! -f "$SRC1080" ]; then
  echo "### Tạo nguồn 1080p 2s cho ramp..." >&2
  ffmpeg -y -v error \
    -f lavfi -i "testsrc2=size=1920x1080:rate=30:duration=2" \
    -f lavfi -i "color=c=0xFF3030:s=240x240:rate=30:duration=2,format=yuva420p" \
    -filter_complex "[0:v][1:v]overlay=x='80+700*abs(sin(t))':y='60+400*abs(cos(t))':shortest=1" \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SRC1080"
fi
MEDIA_DIR="$WORK/ramp_media"
mkdir -p "$MEDIA_DIR"
cp -f "$SRC1080" "$MEDIA_DIR/src.mp4"
python3 - "$WORK" <<'PYEOF'
import json, os, sys
work = sys.argv[1]
curve = {"keyframes": [{"t": 0, "v": 1, "easing": "linear"},
                        {"t": 1, "v": 0.5, "easing": "linear"},
                        {"t": 2, "v": 0.5, "easing": "linear"}]}
def spec(clip):
    return {"version": "0.2.0",
            "meta": {"name": "p6ramp", "width": 1920, "height": 1080, "fps": 30},
            "tracks": [{"id": "v0", "kind": "video", "clips": [clip]}]}
base = {"id": "c0", "kind": "video", "src": "src.mp4", "start": 0,
        "duration": 2, "in": 0, "out": 2, "speedKeyframes": curve}
json.dump(spec(base), open(os.path.join(work, "ramp_only.json"), "w"))
motion = dict(base)
motion["motion"] = {"interpolation": "minterpolate", "targetFps": 30,
                    "motionBlur": {"frames": 3}}
json.dump(spec(motion), open(os.path.join(work, "ramp_motion.json"), "w"))
PYEOF
run_render() {
  local label="$1" spec="$2"
  local out="$WORK/out_${label}_1920x1080.mp4"
  local start end elapsed frames dur status rc
  start=$(date +%s.%N)
  (cd "$ROOT/server/render" && timeout "$TIMEOUT" node src/render.js --spec "$WORK/$spec" \
    --out "$out" --media-dir "$MEDIA_DIR" --x264-preset veryfast --crf 28 -y) \
    >"$WORK/render_${label}.log" 2>&1
  rc=$?
  end=$(date +%s.%N)
  elapsed=$(python3 -c "print(f'{float('$end') - float('$start'):.3f}')")
  if [ "$rc" -eq 124 ]; then status="TIMEOUT"; frames="?"; dur="?"
  elif [ "$rc" -ne 0 ]; then status="FAIL"; frames="?"; dur="?"
  else status="ok"; frames=$(count_frames "$out"); dur=$(probe_duration "$out"); fi
  row "$label" "1920x1080" "render.js spec $spec" "$elapsed" "$frames" "$dur" "$status" "ramp 1->0.5, project fps 30"
}
run_render "ramp_only" "ramp_only.json"
run_render "ramp_motion" "ramp_motion.json"
echo "### XONG bench P6. JSONL: $RESULTS_DIR/motion_p6.jsonl"
