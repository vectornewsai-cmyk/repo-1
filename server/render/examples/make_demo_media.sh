#!/usr/bin/env bash
# make_demo_media.sh — Tự tạo media mẫu bằng ffmpeg (testsrc/sine).
# KHÔNG tải file ngoài, KHÔNG commit file media nặng — chạy lại bất cứ lúc nào.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p media

echo "▶ Tạo clip1.mp4 (testsrc 8s)…"
ffmpeg -y -v error \
  -f lavfi -i "testsrc=size=1280x720:rate=30:duration=8" \
  -pix_fmt yuv420p -c:v libx264 -preset veryfast -crf 23 \
  media/clip1.mp4

echo "▶ Tạo clip2.mp4 (testsrc2 8s)…"
ffmpeg -y -v error \
  -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=8" \
  -pix_fmt yuv420p -c:v libx264 -preset veryfast -crf 23 \
  media/clip2.mp4

echo "▶ Tạo music.m4a (sine 12s)…"
ffmpeg -y -v error \
  -f lavfi -i "sine=frequency=660:duration=12" \
  -c:a aac -b:a 128k \
  media/music.m4a

echo "✅ Xong: media/ đã sẵn sàng (clip1.mp4, clip2.mp4, music.m4a)"
