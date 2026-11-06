#!/usr/bin/env bash
# Phase 9 đợt 49, luồng E5 — encode fixture B-frame cho phép đo trần 1000.
#
# Mục đích: fixture gốc sparse-gop-noise.mp4 đã đo ở D5 có has_b_frames=0
# (không B-frame, GOP 30, 1280x720, 30fps, 30s). File này encode LẠI cùng
# nội dung noise đó, chỉ đổi cấu trúc GOP: 3 B-frame liên tiếp (bf=3),
# giữ keyint 30 + tắt scenecut để GOP đúng 30 như gốc — để phép so trần
# 1000 (E5 §4) chỉ khác nhau ở B-frame, không khác nội dung/độ dài/GOP.
#
# Cách dùng:
#   bash apps/web/scripts/gen-fixture-bframe-49e5.sh [noise.mp4] [out.mp4]
# Mặc định: in=~/workspace/tmp-round27-k4/sparse-gop-noise.mp4
#           out=~/workspace/tmp-round49-e5/bframe-gop30-noise.mp4
# Kiểm tra sau encode: has_b_frames=3 + đếm pict_type có B + GOP 30.
# KHÔNG push, KHÔNG binary vào repo — fixture encode ra scratch ngoài repo.
set -euo pipefail
SRC="${1:-$HOME/workspace/tmp-round27-k4/sparse-gop-noise.mp4}"
OUT="${2:-$HOME/workspace/tmp-round49-e5/bframe-gop30-noise.mp4}"
if [ ! -f "$SRC" ]; then echo "BLOCKER: không thấy nguồn $SRC" >&2; exit 2; fi
mkdir -p "$(dirname "$OUT")"
ffmpeg -y -v error -i "$SRC" -c:v libx264 -preset veryfast -bf 3 -g 30 \
  -keyint_min 30 -sc_threshold 0 -pix_fmt yuv420p -an "$OUT"
echo "--- verify ---"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,has_b_frames \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
echo "--- pict_type counts (full scan) ---"
ffprobe -v error -select_streams v:0 -show_entries frame=pict_type \
  -of csv=p=0 "$OUT" | sort | uniq -c
echo "--- keyframe intervals (first 12) ---"
ffprobe -v error -select_streams v:0 -show_entries frame=key_frame \
  -of csv=p=0 "$OUT" | grep -n '^1$' | head -12
echo "OUT=$OUT"
