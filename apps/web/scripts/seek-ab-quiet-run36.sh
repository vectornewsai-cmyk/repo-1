#!/bin/bash
# Phase 9 đợt 36, luồng S1 — chạy 1 lượt A/B seekElement trong cửa sổ quiet.
# Bọc probe đo chuẩn Q6 (probe-round34-q6-measure-protocol.mjs, không sửa)
# với dist đóng băng qua Q6_DIST (không đụng apps/web/dist trên đĩa, nên
# không đua với luồng khác build lại dist giữa chừng), rồi chạy probe
# decode-side (seek-ab-decode-side-v2-analyze.mjs) trên forward-hold.json
# của chính lượt đó.
#
# Cổng nhận: lượt chỉ được nhận vào thống kê khi CẢ HAI đều đạt:
# loadLabel v2 = quiet (Q6) VÀ decodeLabel v2 = HEALTHY (decode-side v2:
# không STARVED, không STEADY_SLOW — xem seek-ab-decode-side-v2-analyze.mjs).
# Lượt vi phạm cổng nào cũng ghi đầy đủ lý do vào file kết quả và KHÔNG
# tính vào 3+3 (gọi là lượt bị loại, không xóa).
#
# Cách dùng (từ gốc repo):
#   bash apps/web/scripts/seek-ab-quiet-run36.sh <retry|single> <b1..b8>
#     <frozen-dist-dir> <bundle-sha256>
# Kết quả: benchmarks/results/v36-s1-seek-ab-<variant>-<attempt>.json
#   + scratch lượt tại ~/workspace/tmp-round36-s1/runs/<variant>-<attempt>/
set -u
VARIANT="$1"; ATTEMPT="$2"; DIST_DIR="$3"; EXPECT_SHA="$4"
REPO="$HOME/workspace/repo-1"
SCRATCH_BASE="$HOME/workspace/tmp-round36-s1"
RUN_ID="$VARIANT-$ATTEMPT"
SCRATCH="$SCRATCH_BASE/runs/$RUN_ID"
OUT="$REPO/benchmarks/results/v36-s1-seek-ab-$RUN_ID.json"
FIX="$HOME/workspace/tmp-round27-k4/sparse-gop-flat.mp4"

chrome_count() { pgrep -f "chrome-linux64/chrome|meta-chromium/chrome" 2>/dev/null | wc -l | tr -d ' '; }

# --- Cổng tiền kiểm: chờ cửa sổ yên tĩnh tối đa 10 phút (20 x 30s).
# Không phóng browser vào lúc đã biết tải cao: chỉ tốn 1 lượt bị loại.
GATE="timeout"
for i in $(seq 1 20); do
  LOAD1=$(cut -d' ' -f1 /proc/loadavg)
  CHROME_PRE=$(chrome_count)
  if python3 -c "import sys; sys.exit(0 if float('$LOAD1') < 2.0 else 1)" && [ "$CHROME_PRE" = "0" ]; then
    GATE="open"; break
  fi
  echo "[$RUN_ID] cổng chờ: lần $i/20 load1=$LOAD1 chrome=$CHROME_PRE (cần load1<2.0 và chrome=0)"
  sleep 30
done
if [ "$GATE" != "open" ]; then
  echo "[$RUN_ID] CỔNG TIMEOUT sau 10 phút: load1=$(cut -d' ' -f1 /proc/loadavg) chrome=$(chrome_count) — KHÔNG phóng browser, lượt này ghi là bị loại (gate-timeout)."
  node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({run:process.argv[2], variant:process.argv[3], attempt:process.argv[4], accepted:false, exclusionReason:"pre-gate timeout 10 phút: không có cửa sổ load1<2.0 và 0 Chrome", load1AtTimeout:process.argv[5], chromeAtTimeout:process.argv[6]}, null, 2));' \
    "$OUT" "$RUN_ID" "$VARIANT" "$ATTEMPT" "$(cut -d' ' -f1 /proc/loadavg)" "$(chrome_count)"
  exit 0
fi

BUNDLE_FILE="$(ls "$DIST_DIR"/assets/*.js)"
BUNDLE_SHA="$(sha256sum "$BUNDLE_FILE" | cut -d' ' -f1)"
if [ "$BUNDLE_SHA" != "$EXPECT_SHA" ]; then echo "[$RUN_ID] BUNDLE ĐÓNG BĂNG LỆCH trước chạy: $BUNDLE_SHA kỳ vọng $EXPECT_SHA" >&2; exit 2; fi
PRE_LOAD="$(cat /proc/loadavg)"; PRE_TOP="$(ps -eo pid,pcpu,comm,args --sort=-pcpu | head -9 | tail -8)"
PRE_CHROME="$(chrome_count)"
echo "=== RUN $RUN_ID variant=$VARIANT bundle=$(basename "$BUNDLE_FILE") sha=$BUNDLE_SHA pre-load=$PRE_LOAD pre-chrome=$PRE_CHROME ==="

cd "$REPO" || exit 2
# Sửa lỗi redirect của bản v35: file log Q6 nằm trong runs/ nên phải
# tạo thư mục này TRƯỚC khi shell mở file redirect, nếu không probe
# không bao giờ chạy (q6_exit=1, NO_RESULT) khi runs/ chưa tồn tại.
mkdir -p "$SCRATCH_BASE/runs"
Q6_VIDEO="$FIX" Q6_SCRATCH="$SCRATCH" Q6_DISPLAY=":90" Q6_PORT="4190" \
  Q6_OUT="$SCRATCH/q6-labeled.json" Q6_DIST="$DIST_DIR" \
  node apps/web/scripts/probe-round34-q6-measure-protocol.mjs run > "$SCRATCH_BASE/runs/$RUN_ID.q6.log" 2>&1
Q6_EXIT=$?
echo "--- $RUN_ID q6_exit=$Q6_EXIT ---"
tail -4 "$SCRATCH_BASE/runs/$RUN_ID.q6.log"

POST_LOAD="$(cat /proc/loadavg)"; POST_CHROME="$(chrome_count)"
BUNDLE_SHA_AFTER="$(sha256sum "$BUNDLE_FILE" | cut -d' ' -f1)"
if [ "$BUNDLE_SHA_AFTER" != "$EXPECT_SHA" ]; then echo "[$RUN_ID] BUNDLE ĐÓNG BĂNG ĐỔI giữa chừng (lượt HỦY): $BUNDLE_SHA_AFTER" >&2; exit 3; fi
if [ ! -f "$SCRATCH/forward-hold.json" ]; then echo "[$RUN_ID] NO_RESULT: thiếu forward-hold.json (q6_exit=$Q6_EXIT)" >&2; exit 2; fi

node apps/web/scripts/seek-ab-decode-side-v2-analyze.mjs "$SCRATCH/forward-hold.json" > "$SCRATCH/decode-side.json" 2>&1

node -e '
  const fs = require("fs");
  const q6 = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const dec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const reasons = [];
  if (q6.loadLabel !== "quiet") reasons.push(...q6.labelReasons.map((r) => "v2: " + r));
  if (dec.decodeLabel !== "HEALTHY") reasons.push(...dec.reasons.map((r) => "decode: " + r));
  const combined = {
    run: process.argv[3], variant: process.argv[4], attempt: process.argv[5],
    bundle: q6.bundle, bundleSha256: process.argv[6],
    frozenDist: process.argv[7], frozenShaBefore: process.argv[6], frozenShaAfter: process.argv[8],
    pre: { loadavg: process.argv[9], chromePre: Number(process.argv[10]), top: process.argv[11] },
    post: { loadavg: process.argv[12], chromePost: Number(process.argv[13]) },
    q6Exit: Number(process.argv[14]), n2Verdict: q6.n2Verdict,
    loadLabel: q6.loadLabel, labelReasons: q6.labelReasons,
    decodeSide: dec,
    reverseFps: q6.reverse.fps, reverseDrawDelta: q6.reverse.drawDelta, reverseWallSec: q6.reverse.wallSec,
    forwardInterpRate: q6.forward.interpRate,
    load: q6.load, machine: q6.machine,
    accepted: reasons.length === 0,
    exclusionReasons: reasons,
    q6LabeledPath: process.argv[1],
  };
  fs.writeFileSync(process.argv[15], JSON.stringify(combined, null, 2));
  console.log(JSON.stringify({ run: combined.run, variant: combined.variant, fps: combined.reverseFps, n2Verdict: combined.n2Verdict, loadLabel: combined.loadLabel, decodeLabel: dec.decodeLabel, accepted: combined.accepted, exclusionReasons: reasons }));
' "$SCRATCH/q6-labeled.json" "$SCRATCH/decode-side.json" "$RUN_ID" "$VARIANT" "$ATTEMPT" "$EXPECT_SHA" "$DIST_DIR" "$BUNDLE_SHA_AFTER" "$PRE_LOAD" "$PRE_CHROME" "$PRE_TOP" "$POST_LOAD" "$POST_CHROME" "$Q6_EXIT" "$OUT"
