#!/usr/bin/env bash
# test-export-progress.sh — E2E tiến trình export thời gian thực (R1-065).
#
# Kịch bản: tạo video 10s → start bridge → POST /api/render → poll mỗi 1s →
# kiểm tra progress đơn điệu 0→1, có sample trung gian, etaSeconds hợp lệ.
#
# Cách dùng: bash test-export-progress.sh [--port 18797] [--keep]
#
# Yêu cầu: node, npm, curl, ffmpeg, ffprobe, python3.
set -u

PORT=18797
KEEP=0
for a in "$@"; do
  case "$a" in
    --port) shift; PORT="${1:-18797}"; shift || true ;;
    --port=*) PORT="${a#--port=}" ;;
    --keep) KEEP=1 ;;
  esac
done

BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="http://127.0.0.1:${PORT}"
WORKDIR="$(mktemp -d /tmp/vcut-prog-e2e-XXXXXX)"
MEDIA_DIR="$WORKDIR/media"
mkdir -p "$MEDIA_DIR"

BRIDGE_PID=""
PASS=0
FAIL=0

log()  { echo "$1"; }
ok()   { echo "   ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "   ❌ $1"; FAIL=$((FAIL+1)); }

cleanup() {
  if [ -n "$BRIDGE_PID" ] && kill -0 "$BRIDGE_PID" 2>/dev/null; then
    log "== Dọn dẹp: tắt bridge (pid $BRIDGE_PID) =="
    kill "$BRIDGE_PID" 2>/dev/null || true
    wait "$BRIDGE_PID" 2>/dev/null || true
  fi
  if [ "$KEEP" -eq 0 ]; then rm -rf "$WORKDIR"; else log "   (giữ lại $WORKDIR do --keep)"; fi
}
trap cleanup EXIT

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ Thiếu công cụ: $1"; exit 1; }
}
for t in node npm curl ffmpeg ffprobe python3; do need "$t"; done

jget() {
  echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('$2',''))" 2>/dev/null
}

# ---------------------------------------------------------------------------
log "== [1] Chuẩn bị =="
if [ ! -d "$BRIDGE_DIR/node_modules" ]; then
  (cd "$BRIDGE_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1 \
    || { echo "❌ npm install thất bại"; exit 1; }
  ok "npm install xong"
else
  ok "node_modules đã có"
fi

# ---------------------------------------------------------------------------
log "== [2] Tạo video test 10s (1280x720) =="
ffmpeg -y -v error -f lavfi -i "color=c=teal:s=1280x720:d=10:r=30" \
  -c:v libx264 -pix_fmt yuv420p "$MEDIA_DIR/teal10.mp4" \
  || { echo "❌ tạo teal10.mp4 thất bại"; exit 1; }
ok "teal10.mp4 ($(du -h "$MEDIA_DIR/teal10.mp4" | cut -f1))"

# ---------------------------------------------------------------------------
log "== [3] Khởi động bridge (port $PORT) =="
if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then
  echo "❌ Port $PORT đã có bridge khác đang chạy — dùng --port khác"
  exit 1
fi
BRIDGE_PORT="$PORT" BRIDGE_WORK_DIR="$WORKDIR/jobs" BRIDGE_MIN_DISK_FREE=52428800 \
  BRIDGE_RATE_GENERAL=1000 BRIDGE_RATE_RENDER=100 \
  node "$BRIDGE_DIR/src/index.js" >"$WORKDIR/bridge.log" 2>&1 &
BRIDGE_PID=$!
sleep 1
if ! kill -0 "$BRIDGE_PID" 2>/dev/null; then
  echo "❌ Bridge tắt ngay sau khi start — xem $WORKDIR/bridge.log:"
  tail -15 "$WORKDIR/bridge.log" || true
  BRIDGE_PID=""
  exit 1
fi
HEALTH_OK=0
for i in $(seq 1 30); do
  if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then
    HEALTH_OK=1; break
  fi
  sleep 1
done
[ "$HEALTH_OK" -eq 1 ] && ok "bridge OK" || { bad "bridge không lên"; exit 1; }

# ---------------------------------------------------------------------------
log "== [4] Submit job render video 10s =="
cat > "$WORKDIR/spec.json" <<'EOF'
{
  "version": "0.2.0",
  "meta": { "name": "progress-e2e", "width": 1280, "height": 720, "fps": 30 },
  "tracks": [
    { "kind": "video", "id": "v1", "clips": [
      { "kind": "video", "id": "c1", "src": "teal10.mp4",
        "start": 0, "duration": 10, "in": 0, "out": 10, "sourceAudioMode": "mute" }
    ] }
  ]
}
EOF
# preset "slow" để render đủ lâu, poll mới bắt được tiến trình trung gian
PRESET='{"crf":18,"x264Preset":"slow","audioBitrateKbps":128}'
RESP="$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/render" \
  -F "spec=<${WORKDIR}/spec.json" -F "preset=${PRESET}" \
  -F "media=@${MEDIA_DIR}/teal10.mp4;filename=teal10.mp4")"
CODE="$(echo "$RESP" | tail -1)"
BODY="$(echo "$RESP" | head -n -1)"
if [ "$CODE" != "201" ]; then
  bad "POST /api/render → $CODE ($BODY)"
  exit 1
fi
JOBID="$(jget "$BODY" "jobId")"
ok "jobId=$JOBID"

# ---------------------------------------------------------------------------
log "== [5] Poll tiến trình (mỗi 1s) =="
SAMPLES_FILE="$WORKDIR/samples.txt"
: > "$SAMPLES_FILE"
FINAL=""
ELAPSED=0
TIMEOUT=300
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  RESP="$(curl -s "$BASE_URL/api/render/$JOBID")"
  ST="$(jget "$RESP" "status")"
  PR="$(jget "$RESP" "progress")"
  ETA="$(jget "$RESP" "etaSeconds")"
  QP="$(jget "$RESP" "queuePosition")"
  echo "$ELAPSED $ST $PR $ETA $QP" >> "$SAMPLES_FILE"
  printf "\r   ⏳ t=%ss status=%s progress=%s eta=%ss queue=%s" \
    "$ELAPSED" "$ST" "$PR" "$ETA" "$QP" >&2
  if [ "$ST" = "done" ] || [ "$ST" = "error" ] || [ "$ST" = "cancelled" ]; then
    FINAL="$ST"
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED+1))
done
printf "\n" >&2

# ---------------------------------------------------------------------------
log "== [6] Kiểm chứng =="
python3 - "$SAMPLES_FILE" "$FINAL" <<'PYEOF'
import sys
samples_file, final = sys.argv[1], sys.argv[2]
rows = []
for line in open(samples_file):
    p = line.split()
    if len(p) < 5: continue
    t, st, pr, eta, qp = p[0], p[1], p[2], p[3], p[4]
    try: pr = float(pr)
    except: continue
    try: eta = float(eta) if eta not in ("", "None") else None
    except: eta = None
    rows.append((int(t), st, pr, eta, qp))

fails = []
def check(cond, label):
    print(("  ✅ " if cond else "  ❌ ") + label)
    if not cond: fails.append(label)

check(final == "done", f"job kết thúc done (nhận: {final})")

progs = [r[2] for r in rows]
check(len(progs) > 0, f"thu được {len(progs)} sample progress")
check(all(progs[i] <= progs[i+1] + 1e-9 for i in range(len(progs)-1)),
      "progress đơn điệu không giảm")
check(min(progs) >= 0 and max(progs) <= 1, "progress trong [0, 1]")
mid = [p for p in progs if 0 < p < 1]
check(len(mid) >= 1, f"có sample trung gian 0<p<1 ({len(mid)} sample)")
check(progs[-1] == 1, f"progress cuối = 1 (nhận {progs[-1]})")

etas = [r[3] for r in rows if r[3] is not None]
check(len(etas) >= 1, f"etaSeconds xuất hiện ({len(etas)} sample)")
check(all(e >= 0 for e in etas), "etaSeconds không âm")
# ETA phải giảm dần khi render tiến triển (cho phép nhiễu ±2s)
if len(etas) >= 3:
    check(etas[-1] <= etas[0] + 2, f"ETA giảm dần ({etas[0]} → {etas[-1]})")

sys.exit(1 if fails else 0)
PYEOF
[ $? -eq 0 ] && ok "progress/ETA đạt" || bad "progress/ETA không đạt"

# ---------------------------------------------------------------------------
log ""
log "=========================================="
if [ "$FAIL" -eq 0 ]; then
  log "🎉 PROGRESS E2E PASS: $PASS/$((PASS+FAIL)) check"
else
  log "💥 PROGRESS E2E FAIL: $PASS pass, $FAIL fail"
fi
log "=========================================="
[ "$FAIL" -eq 0 ]
