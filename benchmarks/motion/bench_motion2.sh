#!/usr/bin/env bash
# bench_motion2.sh — Benchmark motion đợt 9 M5 (nợ đợt 8).
#
# Đợt 8 (bench_motion.sh) chỉ đo clip tổng hợp testsrc2 thuần 640x360,
# 15fps, 4s. Đợt này đo "thật hơn" trên cùng một máy:
#   - Nguồn MỚI (vẫn là footage TỔNG HỢP, KHÔNG phải quay thật — ghi rõ):
#     testsrc2 (nền chi tiết, nhiều vật thể chuyển động) + overlay một
#     hình vuông đỏ chuyển động chéo (vật thể riêng, cạnh sắc, che khuất
#     nền) — khó hơn cho motion estimation so với testsrc2 thuần.
#   - 720p + 1080p, 25fps -> nội suy 50fps (đúng chain render thật của
#     server/render/src/motion.js: minterpolate mci/aobmc/bidir + fps
#     lấp đuôi; tmix frames=5 sau bước fps).
#   - Clip dài >=30s: CHỈ ngoại suy tuyến tính từ mẫu 4s (ghi rõ
#     EXTRAPOLATED, không phải số đo) + đo thật 1 cấu hình plain 30s
#     ở 720p để kiểm chứng tính tuyến tính của baseline.
#   - Stabilize + interpolation (720p): nguồn rung lắc nhân tạo (crop
#     cửa sổ dao động sin) -> vidstabdetect (pass 1) + vidstabtransform
#     + minterpolate (pass 2). Đây là lần đầu combo này được đo.
#   - 4K: CHỈ chạy khi BENCH4K=1 (mẫu 2s, timeout riêng) vì máy đo chỉ
#     2 vCPU; mặc định ghi SKIPPED chứ không đoán số.
#
# Output: bảng markdown ra stdout + benchmarks/results/motion2.jsonl
# (mỗi lần chạy ghi đè — khớp mẫu motion.jsonl của bench_motion.sh).
# MP4/.trf trung gian nằm trong workdir /tmp, KHÔNG ghi binary vào repo.
# Mỗi cấu hình có timeout riêng (BENCH_TIMEOUT, mặc định 600s): hết
# timeout ghi status=TIMEOUT và chạy tiếp, script không chết giữa chừng.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${BENCH_WORKDIR:-/tmp/vcut-bench/motion2}"
RESULTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/results"
mkdir -p "$WORK" "$RESULTS_DIR"

TIMEOUT="${BENCH_TIMEOUT:-600}"
SRC_FPS=25; SRC_DUR=4; OUT_FPS=50
# Đúng filter render thật (motion.js buildMotionFpsFilter, miMode mci):
INTERP="minterpolate=fps=${OUT_FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=${OUT_FPS}"
TMIX="fps=${SRC_FPS},tmix=frames=5"

FFMPEG_VER="$(ffmpeg -version 2>/dev/null | head -1 | sed 's/"/\\"/g')"
NPROC="$(nproc)"
MEM="$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}')"

# Mặc định ghi đè như bench_motion.sh; BENCH_APPEND_JSONL=1 thì giữ
# lại các dòng cũ (dùng khi chạy 4K riêng sau lượt chạy chính — lượt
# 4K của đợt 9 đã ghi đè file nên phải gộp tay, xem MOTION_BENCH2.md).
if [ "${BENCH_APPEND_JSONL:-0}" != "1" ]; then
  : > "$RESULTS_DIR/motion2.jsonl"
fi

count_frames() {
  ffprobe -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of csv=p=0 "$1" 2>/dev/null || echo "?"
}

# row LABEL RES FILTER WALL FRAMES STATUS NOTE
row() {
  printf '{"label":"%s","res":"%s","filter":"%s","wall_s":%s,"out_frames":%s,"status":"%s","note":"%s","ffmpeg":"%s","nproc":%s,"mem":"%s"}\n' \
    "$1" "$2" "$(printf '%s' "$3" | sed 's/"/\\"/g')" "$4" "$5" "$6" "$7" \
    "$FFMPEG_VER" "$NPROC" "$MEM" >> "$RESULTS_DIR/motion2.jsonl"
  echo "| $1 | $2 | ${3:-(không filter)} | $4 | $5 | $6 | $7 |"
}

# run_cfg LABEL RES FILTER... (chuỗi filter rỗng = plain; filter đã gồm
# cả fps/tmix, áp trực tiếp qua -vf; out luôn ở cùng res với nguồn)
run_cfg() {
  local label="$1" res="$2" src="$3" vf="$4" note="$5"
  local out="$WORK/out_${label}_${res}.mp4"
  local start end elapsed frames status
  start=$(date +%s.%N)
  if [ -z "$vf" ]; then
    timeout "$TIMEOUT" ffmpeg -y -v error -i "$src" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out" 2>"$WORK/err_${label}_${res}.log"
  else
    timeout "$TIMEOUT" ffmpeg -y -v error -i "$src" -vf "$vf" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$out" 2>"$WORK/err_${label}_${res}.log"
  fi
  local rc=$?
  end=$(date +%s.%N)
  elapsed=$(python3 -c "print(f'{float('$end') - float('$start'):.3f}')")
  if [ "$rc" -eq 124 ]; then status="TIMEOUT"; frames="?"; elapsed="$TIMEOUT"
  elif [ "$rc" -ne 0 ]; then status="FAIL"; frames="?"
  else status="ok"; frames=$(count_frames "$out"); fi
  row "$label" "$res" "$vf" "$elapsed" "$frames" "$status" "$note"
}

gen_src() {
  # $1=W $2=H -> in đường dẫn nguồn (testsrc2 + overlay vuông đỏ động).
  local w="$1"
  local h="$2"
  # NOTE: không gộp vào một lệnh local duy nhất — bash mở rộng mọi đối
  # số trước khi gán nên ${w} trong cùng lệnh sẽ là unbound (set -u).
  local src="$WORK/src_${w}x${h}_${SRC_FPS}fps_${SRC_DUR}s.mp4"
  if [ ! -f "$src" ]; then
    echo "### Tạo nguồn ${w}x${h} ${SRC_FPS}fps ${SRC_DUR}s (testsrc2 + vật thể động)..." >&2
    ffmpeg -y -v error \
      -f lavfi -i "testsrc2=size=${w}x${h}:rate=${SRC_FPS}:duration=${SRC_DUR}" \
      -f lavfi -i "color=c=0xFF3030:s=160x160:rate=${SRC_FPS}:duration=${SRC_DUR},format=yuva420p" \
      -filter_complex "[0:v][1:v]overlay=x='80+500*abs(sin(t))':y='60+300*abs(cos(t))':shortest=1" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$src"
  fi
  printf '%s' "$src"
}

echo "### Máy đo: nproc=$NPROC RAM=$MEM FFmpeg: $FFMPEG_VER" >&2
echo "| Cấu hình | Độ phân giải | Filter | Thời gian (s) | Frame output | Trạng thái | Ghi chú |"
echo "|---|---|---|---|---|---|---|"

if [ "${BENCH_SKIP_HD:-0}" != "1" ]; then
  for res in "1280 720" "1920 1080"; do
    set -- $res; W="$1"; H="$2"; R="${W}x${H}"
    SRC=$(gen_src "$W" "$H")
    run_cfg "plain" "$R" "$SRC" "" "baseline, nguồn vật thể động"
    run_cfg "minterpolate" "$R" "$SRC" "$INTERP" "chain render thật motion.js"
    run_cfg "tmix" "$R" "$SRC" "$TMIX" "motion blur frames=5"
  done

  # --- Clip dài: đo thật plain 30s ở 720p (kiểm chứng tuyến tính) ---
  SRC30="$WORK/src_1280x720_${SRC_FPS}fps_30s.mp4"
  if [ ! -f "$SRC30" ]; then
    echo "### Tạo nguồn 720p 30s cho plain..." >&2
    ffmpeg -y -v error \
      -f lavfi -i "testsrc2=size=1280x720:rate=${SRC_FPS}:duration=30" \
      -f lavfi -i "color=c=0xFF3030:s=160x160:rate=${SRC_FPS}:duration=30,format=yuva420p" \
      -filter_complex "[0:v][1:v]overlay=x='80+500*abs(sin(t))':y='60+300*abs(cos(t))':shortest=1" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SRC30"
  fi
  run_cfg "plain30s" "1280x720" "$SRC30" "" "ĐO THẬT 30s (baseline tuyến tính)"

  # --- Stabilize + interpolation, 720p, nguồn rung lắc nhân tạo ---
  SRC720=$(gen_src 1280 720)
  SHAKY="$WORK/shaky_1280x720.mp4"
  if [ ! -f "$SHAKY" ]; then
    echo "### Tạo nguồn rung lắc 720p (crop cửa sổ dao động sin)..." >&2
    ffmpeg -y -v error -i "$SRC720" -vf \
      "crop=w=1152:h=648:x='64+24*sin(2*PI*t*2.7)':y='36+18*cos(2*PI*t*3.1)',scale=1280:720" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SHAKY"
  fi
  TRF="$WORK/stab.trf"
  echo "### vidstabdetect pass 1 (720p, nguồn rung)..." >&2
  S1=$(date +%s.%N)
  timeout "$TIMEOUT" ffmpeg -y -v error -i "$SHAKY" -vf "vidstabdetect=result=${TRF}" -f null - 2>"$WORK/err_stab_detect.log"
  RC1=$?
  E1=$(date +%s.%N)
  T1=$(python3 -c "print(f'{float('$E1') - float('$S1'):.3f}')")
  if [ "$RC1" -eq 124 ]; then row "stab_detect" "1280x720" "vidstabdetect" "$TIMEOUT" "?" "TIMEOUT" "pass 1 rung lắc"
  elif [ "$RC1" -ne 0 ]; then row "stab_detect" "1280x720" "vidstabdetect" "$T1" "?" "FAIL" "pass 1 rung lắc"
  else
    row "stab_detect" "1280x720" "vidstabdetect" "$T1" "?" "ok" "pass 1 rung lắc"
    # Pass 2: vidstabtransform + minterpolate (thứ tự như render: enhPre
    # stabilize trước, motion sau scale/pad — ở đây gộp trên cùng res).
    run_cfg "stab_plus_interp" "1280x720" "$SHAKY" \
      "vidstabtransform=input=${TRF},${INTERP}" \
      "pass 2: transform + minterpolate (lần đầu đo combo này)"
  fi
fi

# --- 4K: chỉ khi BENCH4K=1, mẫu 2s ---
if [ "${BENCH4K:-0}" = "1" ]; then
  SRC4K="$WORK/src_3840x2160_${SRC_FPS}fps_2s.mp4"
  if [ ! -f "$SRC4K" ]; then
    echo "### Tạo nguồn 4K 2s..." >&2
    ffmpeg -y -v error \
      -f lavfi -i "testsrc2=size=3840x2160:rate=${SRC_FPS}:duration=2" \
      -f lavfi -i "color=c=0xFF3030:s=320x320:rate=${SRC_FPS}:duration=2,format=yuva420p" \
      -filter_complex "[0:v][1:v]overlay=x='80+1000*abs(sin(t))':y='60+600*abs(cos(t))':shortest=1" \
      -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$SRC4K"
  fi
  run_cfg "plain" "3840x2160" "$SRC4K" "" "4K mẫu 2s (BENCH4K=1)"
  run_cfg "minterpolate" "3840x2160" "$SRC4K" "$INTERP" "4K mẫu 2s (BENCH4K=1)"
else
  echo "| 4K | 3840x2160 | — | — | — | SKIPPED | Chỉ chạy khi BENCH4K=1 (máy 2 vCPU) |"
  row "4K" "3840x2160" "" "0" "?" "SKIPPED" "Chi chay khi BENCH4K=1"
fi

echo "Xong. Kết quả thô: $RESULTS_DIR/motion2.jsonl" >&2
echo "Lưu ý: số chỉ đúng máy đo này; ngoại suy clip dài (nếu có trong doc) KHÔNG phải số đo." >&2
