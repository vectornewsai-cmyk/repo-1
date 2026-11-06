#!/bin/bash
# Phase 9 đợt 34, luồng Q1 — chạy 1 lượt đo fps ngược A/B seekElement.
# Dùng harness N2 nguyên vẹn (clicktest-round31-n2-reverse-fps-pipe.mjs).
# Trước mỗi lượt: thay apps/web/dist bằng snapshot bundle của biến thể
# cần đo, kiểm tra sha256 bundle TRƯỚC khi chạy và kiểm tra lại
# snapshot dist-snap của harness SAU khi chạy — nếu lệch thì lượt đó
# bị hủy (không tính), tránh nhiễm do luồng khác build lại dist giữa chừng.
#
# Cách dùng:
#   SEEK_AB_REPO=~/workspace/repo-1 \
#   bash apps/web/scripts/seek-ab-run.sh <retry|single> <run-id> \
#     <snapshot-dist-dir> <bundle-sha256> <display> <port>
# Ví dụ:
#   bash seek-ab-run.sh retry retry-1 ~/workspace/tmp-round34-q1/dist-retry-frozen \
#     <sha256> :90 4190
# Kết quả: forward-hold.json trong N2_SCRATCH
#   ~/workspace/tmp-round34-q1/runs/<run-id>/forward-hold.json
# và 1 dòng JSON tóm tắt in ra stdout.
set -u
VARIANT="$1"; RUN_ID="$2"; SNAP_DIR="$3"; EXPECT_SHA="$4"
DISPLAY_NUM="$5"; PORT_NUM="$6"
REPO="${SEEK_AB_REPO:-$HOME/workspace/repo-1}"
FIX="$HOME/workspace/tmp-round27-k4"
SCRATCH="$HOME/workspace/tmp-round34-q1/runs/$RUN_ID"

cd "$REPO" || exit 2
if [ ! -d "$SNAP_DIR" ]; then echo "SNAPSHOT THIẾU: $SNAP_DIR" >&2; exit 2; fi
rm -rf apps/web/dist
cp -r "$SNAP_DIR" apps/web/dist
BUNDLE_FILE="$(ls apps/web/dist/assets/*.js)"
BUNDLE_SHA="$(sha256sum "$BUNDLE_FILE" | cut -d' ' -f1)"
if [ "$BUNDLE_SHA" != "$EXPECT_SHA" ]; then
  echo "BUNDLE TRƯỚC CHẠY LỆCH: dist=$BUNDLE_SHA kỳ vọng=$EXPECT_SHA" >&2
  exit 2
fi
echo "=== RUN $RUN_ID variant=$VARIANT bundle=$(basename "$BUNDLE_FILE") sha=$BUNDLE_SHA load=$(cat /proc/loadavg) ==="
N2_SCRATCH="$SCRATCH" K4_VIDEO="$FIX/sparse-gop-flat.mp4" \
  K4_DISPLAY="$DISPLAY_NUM" K4_PORT="$PORT_NUM" \
  node apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs 2>&1 | tail -8
HARNESS_EXIT="${PIPESTATUS[0]}"
echo "--- $RUN_ID harness_exit=$HARNESS_EXIT ---"
if [ -f "$SCRATCH/dist-snap/assets/$(basename "$BUNDLE_FILE")" ]; then
  SNAP_SHA="$(sha256sum "$SCRATCH/dist-snap/assets/$(basename "$BUNDLE_FILE")" | cut -d' ' -f1)"
  if [ "$SNAP_SHA" != "$EXPECT_SHA" ]; then
    echo "BUNDLE SNAPSHOT LỆCH: snap=$SNAP_SHA kỳ vọng=$EXPECT_SHA (lượt HỦY)" >&2
    exit 3
  fi
  echo "snapshot bundle khớp: $SNAP_SHA"
else
  echo "KHÔNG CÓ dist-snap trong scratch (lượt HỦY)" >&2
  exit 3
fi
if [ -f "$SCRATCH/forward-hold.json" ]; then
  node -e '
    const r = require(process.argv[1]);
    const rafRev = r.raf.reverse || {};
    const rafFwd = r.raf.forward || {};
    console.log(JSON.stringify({
      run: process.argv[2], variant: process.argv[3], bundle: r.bundle,
      fps: r.reverse.fps, draw: r.reverse.drawDelta, hold: r.reverse.holdDelta,
      wall: r.reverse.wallSec, verdict: r.verdict,
      fwdInterp: r.forward.interpRate,
      rafRevGapP50: rafRev.gapP50, rafRevGapP95: rafRev.gapP95,
      rafRevOver100: rafRev.countOver100ms,
      rafRevExclFirstOver100: rafRev.exclFirst ? rafRev.exclFirst.countOver100ms : null,
      rafFwdGapP50: rafFwd.gapP50,
      loadBeforeFwd: r.load.beforeFwd, loadBeforeRev: r.load.beforeRev,
      loadEnd: r.load.atEnd,
    }));
  ' "$SCRATCH/forward-hold.json" "$RUN_ID" "$VARIANT"
else
  echo "$RUN_ID: KHÔNG CÓ forward-hold.json" >&2
  exit 2
fi
