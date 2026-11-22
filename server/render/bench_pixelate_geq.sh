#!/usr/bin/env bash
# bench_pixelate_geq.sh — Đo hiệu năng pixelate geq (đợt 150) so với filter
# scale cũ và baseline (không effect) trên VM này. KHÔNG stage kết quả vào
# repo — chỉ in bảng; số đo ghi vào LIMITS đợt 150.
#
# Cách chạy (từ server/render/): bash bench_pixelate_geq.sh
#   Mỗi cấu hình chạy 1 lần (không lặp): 60 frame ở <=1080p, 10 frame ở 4K
#   (geq 4K rất chậm — 150 frame từng chạy >7 phút chưa xong, xem LIMITS).
#   fps = số frame / thời gian tường. Ghi chú: số đo chịu ảnh hưởng tải
#   đồng thời của các luồng vòng lặp khác (xem load average in ra).
set -u
cd "$(dirname "$0")" || exit 1

GEQ2=$(node -e "const {buildEffectFilter}=require('./src/effects.js');console.log(buildEffectFilter({type:'pixelate',intensity:0}))")
GEQ9=$(node -e "const {buildEffectFilter}=require('./src/effects.js');console.log(buildEffectFilter({type:'pixelate',intensity:0.5}))")
GEQ13=$(node -e "const {buildEffectFilter}=require('./src/effects.js');console.log(buildEffectFilter({type:'pixelate',intensity:0.8}))")
GEQ16=$(node -e "const {buildEffectFilter}=require('./src/effects.js');console.log(buildEffectFilter({type:'pixelate',intensity:1}))")
SCALE_FILTER() { # $1 = K
  echo "scale=iw/$1:ih/$1:flags=neighbor,scale=iw*$1:ih*$1:flags=neighbor"
}

echo "== bench pixelate geq (FFmpeg $(ffmpeg -version | head -1)) =="
echo "== bắt đầu: $(date -u +%H:%M:%S)Z | load: $(uptime | sed 's/.*average: //') | nproc: $(nproc) =="
echo "size | filter | K | frames | wall(s) | fps"

run_one() { # $1=size $2=label $3=K $4=vf $5=frames
  local size="$1" label="$2" k="$3" vf="$4" frames="$5"
  local t0 t1 wall fps full_vf
  if [ -n "$vf" ]; then full_vf="format=yuv420p,${vf}"; else full_vf="format=yuv420p"; fi
  t0=$(date +%s%N)
  if ! ffmpeg -v error -y -f lavfi -i "testsrc2=size=${size}:rate=30" \
      -vf "${full_vf}" -frames:v "${frames}" -f null - 2>/tmp/bench-geq-err.txt; then
    echo "${size} | ${label} | ${k} | ${frames} | FAIL | $(head -c 200 /tmp/bench-geq-err.txt)"
    return
  fi
  t1=$(date +%s%N)
  wall=$(awk "BEGIN{printf \"%.2f\", ($t1-$t0)/1000000000}")
  fps=$(awk "BEGIN{printf \"%.2f\", $frames/$wall}")
  echo "${size} | ${label} | ${k} | ${frames} | ${wall} | ${fps}"
}

for size in 640x360 1280x720 1920x1080; do
  frames=60
  run_one "$size" "baseline" "-" "" "$frames"
  for k in 2 9 13 16; do
    run_one "$size" "scale-cu" "$k" "$(SCALE_FILTER "$k")" "$frames"
  done
  run_one "$size" "geq" "2" "$GEQ2" "$frames"
  run_one "$size" "geq" "9" "$GEQ9" "$frames"
  run_one "$size" "geq" "13" "$GEQ13" "$frames"
  run_one "$size" "geq" "16" "$GEQ16" "$frames"
done

# 4K: chỉ 10 frame (geq 4K ~0,35 fps — 60 frame sẽ mất ~3 phút/cấu hình).
size=3840x2160
frames=10
run_one "$size" "baseline" "-" "" "$frames"
for k in 2 9 13 16; do
  run_one "$size" "scale-cu" "$k" "$(SCALE_FILTER "$k")" "$frames"
done
run_one "$size" "geq" "2" "$GEQ2" "$frames"
run_one "$size" "geq" "9" "$GEQ9" "$frames"
run_one "$size" "geq" "13" "$GEQ13" "$frames"
run_one "$size" "geq" "16" "$GEQ16" "$frames"

echo "== kết thúc: $(date -u +%H:%M:%S)Z | load: $(uptime | sed 's/.*average: //') =="
