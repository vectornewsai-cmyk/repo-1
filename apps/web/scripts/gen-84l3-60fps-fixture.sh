#!/bin/bash
# gen-84l3-60fps-fixture.sh — Phase 9 đợt 84, luồng L3: sinh fixture 60fps
# cho vùng nhanh (nợ J3 §6.5: trần 30fps nén tỉ lệ khi draw-fps lên
# ~40fps — mỗi lần vẽ lặp lại frame đã decode).
#
# Sinh interlaced720-60fps.mp4 từ testsrc2 60fps, cùng khổ/nội dung với
# interlaced720.mp4 (30fps) để so sánh được: 1280x720, 5s, h264 yuv420p.
# "Interlaced" ở đây là combing nướng sẵn trong nội dung testsrc2 (như
# fixture 30fps: ffprobe field_order=progressive cả hai) — deint tap vẫn
# đo được qua R (cần kiểm chứng R khi đo headed, chưa đo ở đợt này).
#
# Chạy: bash apps/web/scripts/gen-84l3-60fps-fixture.sh
# Ra: ~/workspace/.scratch-r61r3-1cOf/media/interlaced720-60fps.mp4
# (binary KHÔNG vào batch push — chỉ script này được stage).
set -euo pipefail
MEDIA_DIR="$HOME/workspace/.scratch-r61r3-1cOf/media"
mkdir -p "$MEDIA_DIR"
ffmpeg -v error -f lavfi -i "testsrc2=size=1280x720:rate=60:duration=5" \
  -c:v libx264 -pix_fmt yuv420p -r 60 -y "$MEDIA_DIR/interlaced720-60fps.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,duration \
  -of default=nw=1 "$MEDIA_DIR/interlaced720-60fps.mp4"
ls -la "$MEDIA_DIR/interlaced720-60fps.mp4"
