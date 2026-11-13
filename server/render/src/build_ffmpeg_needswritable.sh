#!/usr/bin/env bash
# build_ffmpeg_needswritable.sh — Phase 9 đợt 78, luồng F3.
#
# Build ffmpeg 8.1.2 từ source với patch NEEDS_WRITABLE cho
# vidstabtransform (1 dòng: server/render/src/vidstabtransform-needswritable.patch).
#
# MỤC ĐÍCH: kiểm chứng thực nghiệm đính chính của đợt 77 E3 §3.2 — flag
# AVFILTERPAD_FLAG_NEEDS_WRITABLE làm MỌI frame (kể cả 0..147) đi qua
# ff_inlink_make_frame_writable trước transform, nên td->src được cấp
# ngay từ frame 0 và mọi lần copy in-place sau đó (kể cả frame 148 lúc
# drain) đều ghi vào buffer riêng của vidstab, không còn alias buffer
# decoder đã bị free. Build này CHỈ để đo tỉ lệ crash, KHÔNG phải để
# triển khai production (quyết định triển khai thuộc về đợt sau/user).
#
# Build tối thiểu (--disable-everything + chỉ bật thành phần cần cho
# stress vidstab: h264 decode, mov demux, framemd5/null mux, các filter
# trim/setpts/vidstabtransform/vidstabdetect/showinfo/scale/format).
# Khác biệt DUY NHẤT có chủ đích so với ffmpeg stock Ubuntu 8.1.2 là
# flag NEEDS_WRITABLE (cùng libvidstab 1.1.0 hệ thống, cùng nasm asm);
# mọi so sánh crash đều chạy cùng LD_PRELOAD tracker + segv handler
# của D3 và cùng 3 hog CPU.
#
# Thư mục build NẰM NGOÀI cây production:
#   SRC_ROOT = $HOME/workspace/.scratch-r78f3/FFmpeg-n8.1.2 (giải nén từ
#              tarball của đợt 77, ~/workspace/.scratch-r77e3/ffmpeg-n8.1.2.tar.gz)
#   PREFIX   = $HOME/workspace/.scratch-r78f3/ffmpeg-nw-install
# KHÔNG đưa binary build vào batch stage, KHÔNG commit binary.
#
# Deps hệ thống (đã cài đợt này bằng apt): libvidstab-dev, nasm,
# gcc, make, pkg-config. Nếu thiếu dep, script dừng ở configure và
# in rõ lỗi — không tự cài thêm ngoài apt install ở trên.
#
# Cách chạy:
#   bash server/render/src/build_ffmpeg_needswritable.sh
#   # hoặc: F3_JOBS=2 bash server/render/src/build_ffmpeg_needswritable.sh
# Kết quả: $PREFIX/bin/ffmpeg  (kiểm tra bằng $PREFIX/bin/ffmpeg -version
# và chạy smoke: NOCOPY 1080p phải ra sha d960996868d3… như stock).
set -euo pipefail

HOME_DIR="${HOME:-/home/hatch}"
SCRATCH="${F3_SCRATCH:-$HOME_DIR/workspace/.scratch-r78f3}"
SRC_TARBALL="${F3_TARBALL:-$HOME_DIR/workspace/.scratch-r77e3/ffmpeg-n8.1.2.tar.gz}"
PATCH_FILE="$(cd "$(dirname "$0")" && pwd)/vidstabtransform-needswritable.patch"
SRC_DIR="$SCRATCH/FFmpeg-n8.1.2"
PREFIX="${F3_PREFIX:-$SCRATCH/ffmpeg-nw-install}"
JOBS="${F3_JOBS:-3}"

echo "== F3 build ffmpeg NEEDS_WRITABLE =="
echo "   tarball : $SRC_TARBALL"
echo "   src     : $SRC_DIR"
echo "   patch   : $PATCH_FILE"
echo "   prefix  : $PREFIX"
echo "   jobs    : $JOBS"

[ -f "$SRC_TARBALL" ] || { echo "❌ thiếu tarball: $SRC_TARBALL"; exit 2; }
[ -f "$PATCH_FILE" ] || { echo "❌ thiếu patch: $PATCH_FILE"; exit 2; }
command -v gcc >/dev/null || { echo "❌ thiếu gcc"; exit 2; }
command -v make >/dev/null || { echo "❌ thiếu make"; exit 2; }
command -v nasm >/dev/null || { echo "❌ thiếu nasm"; exit 2; }
pkg-config --exists vidstab || { echo "❌ thiếu libvidstab-dev (pkg-config vidstab)"; exit 2; }

if [ ! -d "$SRC_DIR" ]; then
  mkdir -p "$SCRATCH"
  echo "   giải nén tarball..."
  tar -xzf "$SRC_TARBALL" -C "$SCRATCH"
fi

# Áp patch (idempotent: bỏ qua nếu đã áp).
if grep -q "AVFILTERPAD_FLAG_NEEDS_WRITABLE" "$SRC_DIR/libavfilter/vf_vidstabtransform.c"; then
  echo "   patch đã áp từ trước — bỏ qua"
else
  echo "   áp patch..."
  (cd "$SRC_DIR" && patch -p1 < "$PATCH_FILE")
  grep -q "AVFILTERPAD_FLAG_NEEDS_WRITABLE" "$SRC_DIR/libavfilter/vf_vidstabtransform.c" \
    || { echo "❌ patch không ăn"; exit 3; }
  echo "   patch đã áp OK"
fi

cd "$SRC_DIR"
echo "   configure (minimal)..."
./configure \
  --prefix="$PREFIX" \
  --enable-gpl \
  --enable-libvidstab \
  --disable-everything \
  --disable-ffplay --disable-ffprobe --disable-doc \
  --enable-decoder=h264,rawvideo \
  --enable-encoder=rawvideo \
  --enable-parser=h264 \
  --enable-demuxer=mov \
  --enable-muxer=framemd5,null \
  --enable-bsf=h264_mp4toannexb \
  --enable-protocol=file,pipe \
  --enable-filter=trim,setpts,vidstabtransform,vidstabdetect,showinfo,scale,format,null,copy,split,nullsink,buffersrc,buffersink \
  --enable-swscale \
  > "$SCRATCH/configure.log" 2>&1 || { echo "❌ configure FAIL — xem $SCRATCH/configure.log"; tail -30 "$SCRATCH/configure.log"; exit 4; }
echo "   configure OK"

echo "   make -j$JOBS (có thể mất vài phút)..."
make -j"$JOBS" > "$SCRATCH/make.log" 2>&1 || { echo "❌ make FAIL — xem $SCRATCH/make.log"; tail -30 "$SCRATCH/make.log"; exit 5; }
echo "   make OK"

echo "   make install..."
make install > "$SCRATCH/install.log" 2>&1 || { echo "❌ make install FAIL — xem $SCRATCH/install.log"; exit 6; }

echo "== build xong: $PREFIX/bin/ffmpeg =="
"$PREFIX/bin/ffmpeg" -version | head -3
"$PREFIX/bin/ffmpeg" -filters 2>/dev/null | grep -E "vidstabtransform|showinfo" || true
