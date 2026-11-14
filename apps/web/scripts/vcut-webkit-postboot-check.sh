#!/bin/bash
# vcut-webkit-postboot-check.sh — kiểm tra + khôi phục WebKit sau reboot (đợt 110 L8).
#
# Bối cảnh: sau mỗi reboot cell, (a) package GStreamer/libevent hệ thống mất
# (rootfs rebuild) và được cài lại dần bởi apt replay của hệ thống (ledger
# OS-intent, ~170 package — CHẬM: có thể mất >30 phút; lần sau có thể khác); (b) symlink
# /usr/lib/.../gstreamer-1.0 -> debroot của K1 (đợt 109) là ephemeral, mất
# sau reboot; (c) wrapper MiniBrowser của Playwright ghi đè LD_LIBRARY_PATH
# (K1 đã vá 1 dòng, bản vá nằm trong ~/.cache nên sống qua reboot).
#
# Cách dùng (sau mỗi reboot, TRƯỚC khi chạy probe WebKit):
#   bash apps/web/scripts/vcut-webkit-postboot-check.sh [--repair] [--launch-test]
# Không tham số: chỉ kiểm tra, in PASS/FAIL từng mục, exit 0 nếu đủ chạy WebKit
# (launch được; decode video chỉ đủ khi plugin đầy đủ — xem mục GST).
# --repair: vá lại wrapper (nếu bị revert) + tạo lại symlink GST -> debroot
#   (nếu thư mục plugin hệ thống chưa đủ) + cài apt các package còn thiếu
#   (CHỈ khi apt không bị khóa; nếu replay hệ thống đang giữ lock thì BỎ QUA
#   bước apt và báo rõ — không tranh lock).
# --launch-test: launch WebKit tối thiểu qua Playwright (cần Xvfb + DISPLAY
#   hoặc để script tự spawn Xvfb :195).
#
# KHÔNG push/tag. Không sửa production. Không reboot máy.
set -u
REPAIR=0; LAUNCH_TEST=0
for a in "$@"; do case "$a" in --repair) REPAIR=1;; --launch-test) LAUNCH_TEST=1;; *) echo "tham số lạ: $a (chỉ nhận --repair, --launch-test)"; exit 2;; esac; done

BOOT=$(uptime -s 2>/dev/null || echo "?")
WRAP=~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/MiniBrowser
WRAP_ORIG=~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k1/MiniBrowser-wrapper.orig
GST_SYS=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
DEBROOT=/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu
DEBROOT_GST=$DEBROOT/gstreamer-1.0
FAIL=0
say() { echo "[postboot $BOOT] $*"; }

say "boot=$BOOT (reboot #39 = 2026-11-14 02:50:48Z; so với boot hiện tại để biết replay đã chạy bao lâu)"

# 1. Wrapper MiniBrowser: phải giữ lại LD_LIBRARY_PATH truyền vào.
if [ -f "$WRAP" ]; then
  if grep -q 'LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"' "$WRAP"; then
    say "PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)"
  elif grep -q 'LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib"' "$WRAP"; then
    say "FAIL wrapper: bản gốc (ghi đè LD_LIBRARY_PATH)"
    if [ "$REPAIR" = 1 ]; then
      [ -f "$WRAP_ORIG" ] && cp "$WRAP" "$WRAP.pre-l8-repair.$(date -u +%Y%m%dT%H%M%SZ)" || true
      sed -i 's|LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib"|LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"|' "$WRAP"
      grep -q ':${LD_LIBRARY_PATH}"' "$WRAP" && say "REPAIRED wrapper: đã vá lại 1 dòng" || { say "REPAIR-FAIL wrapper"; FAIL=1; }
    else FAIL=1; fi
  else say "WARN wrapper: nội dung lạ, kiểm tra tay"; FAIL=1; fi
else say "FAIL wrapper: không thấy $WRAP"; FAIL=1; fi

# 2. lib hệ thống mà MiniBrowser cần (K1 §6.3: 5 lib từng thiếu sau reboot #37).
MISSING_LIBS=""
for lib in libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2; do
  ldconfig -p 2>/dev/null | grep -q "$lib" || MISSING_LIBS="$MISSING_LIBS $lib"
done
if [ -z "$MISSING_LIBS" ]; then say "PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)"; else say "FAIL libs: thiếu:$MISSING_LIBS"; FAIL=1; fi

# 3. Plugin GStreamer: đếm file + kiểm tra element sống còn (isomp4, libav).
if [ -L "$GST_SYS" ]; then say "INFO GST: $GST_SYS là symlink -> $(readlink $GST_SYS) (vá tạm K1, ephemeral)"
elif [ -d "$GST_SYS" ]; then say "INFO GST: $GST_SYS là thư mục thật (apt)"
else say "FAIL GST: $GST_SYS không tồn tại"; FAIL=1; fi
N_SYS=$(ls "$GST_SYS" 2>/dev/null | wc -l)
N_DEB=$(ls "$DEBROOT_GST" 2>/dev/null | wc -l)
say "INFO GST: file plugin hệ thống=$N_SYS, debroot=$N_DEB"
HAS_ISOMP4=0; HAS_LIBAV=0
[ -f "$GST_SYS/libgstisomp4.so" ] && HAS_ISOMP4=1
[ -f "$GST_SYS/libgstlibav.so" ] && HAS_LIBAV=1
if [ "$HAS_ISOMP4" = 1 ] && [ "$HAS_LIBAV" = 1 ]; then
  say "PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)"
else
  say "FAIL GST: thiếu isomp4=$((1-HAS_ISOMP4)) libav=$((1-HAS_LIBAV)) — decode mp4/H.264 qua plugin hệ thống chưa đủ"
  if [ "$REPAIR" = 1 ] && [ -d "$DEBROOT_GST" ]; then
    if [ ! -L "$GST_SYS" ] && [ -d "$GST_SYS" ]; then rm -rf "$GST_SYS"; fi
    ln -sfn "$DEBROOT_GST" "$GST_SYS" && say "REPAIRED GST: symlink lại -> debroot ($N_DEB file)" || { say "REPAIR-FAIL GST symlink"; FAIL=1; }
  else FAIL=1; fi
fi
if [ -n "$(ls $GST_SYS/*.dpkg-new 2>/dev/null)" ]; then say "WARN GST: còn file .dpkg-new trong plugin dir (replay apt đang dở hoặc bị cắt) — $(ls $GST_SYS/*.dpkg-new 2>/dev/null)"; fi

# 4. apt: các package cần có (ledger OS-intent đã ghi — replay sẽ cài lại dần).
NEED="libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0"
MISS_PKGS=""
for p in $NEED; do dpkg-query -W -f '${Status}' "$p" 2>/dev/null | grep -q "install ok installed" || MISS_PKGS="$MISS_PKGS $p"; done
if [ -z "$MISS_PKGS" ]; then say "PASS apt: đủ 10 package WebKit/GST"
else
  say "FAIL apt: chưa cài:$MISS_PKGS (replay hệ thống có thể đang cài dần — kiểm tra ps apt/dpkg)"
  if [ "$REPAIR" = 1 ]; then
    if fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || pgrep -x apt-get >/dev/null || pgrep -x dpkg >/dev/null; then
      say "SKIP apt: lock đang bị giữ (replay hệ thống) — KHÔNG tranh lock, chạy lại script sau"
    else
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $MISS_PKGS >>/tmp/l8-postboot-apt.log 2>&1 \
        && say "REPAIRED apt: đã cài:$MISS_PKGS" || { say "REPAIR-FAIL apt (xem /tmp/l8-postboot-apt.log)"; FAIL=1; }
    fi
  else FAIL=1; fi
fi

# 5. Launch test (tùy chọn).
if [ "$LAUNCH_TEST" = 1 ]; then
  L8=~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l8
  if [ -z "${DISPLAY:-}" ]; then
    (Xvfb :195 -screen 0 1280x800x24 >/tmp/l8-postboot-xvfb.log 2>&1 &) ; sleep 3; export DISPLAY=:195
  fi
  if DISPLAY=$DISPLAY node "$L8/l8-webkit-launch.mjs" o8env "$L8/l8-postboot-launch.json" 2>&1 | tail -1; then
    say "PASS launch: WebKit launch + evaluate OK (xem $L8/l8-postboot-launch.json)"
  else say "FAIL launch: WebKit không launch được"; FAIL=1; fi
fi

if [ "$FAIL" = 0 ]; then say "KET LUAN: DU DIEU KIEN chay WebKit (boot $BOOT)"; exit 0
else say "KET LUAN: CHUA DU — chạy lại với --repair, hoặc chờ apt replay xong rồi chạy lại"; exit 1; fi
