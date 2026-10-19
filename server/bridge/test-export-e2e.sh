#!/usr/bin/env bash
# test-export-e2e.sh — E2E export test: spec JSON → bridge → MP4 (R1-044).
#
# Kịch bản: tạo media test → start bridge → POST /api/render (multipart) →
# poll job → download MP4 → verify bằng ffprobe.
#
# Cách dùng: bash test-export-e2e.sh [--port 18787] [--keep]
#   --keep: giữ lại thư mục output (/tmp/vcut-e2e-*) để xem tay
#
# Yêu cầu: node, npm, curl, ffmpeg, ffprobe, python3.
set -u

PORT=18787
KEEP=0
for a in "$@"; do
  case "$a" in
    --port) shift; PORT="${1:-18787}"; shift || true ;;
    --port=*) PORT="${a#--port=}" ;;
    --keep) KEEP=1 ;;
  esac
done

BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="http://127.0.0.1:${PORT}"
WORKDIR="$(mktemp -d /tmp/vcut-e2e-XXXXXX)"
MEDIA_DIR="$WORKDIR/media"
OUT_DIR="$WORKDIR/out"
mkdir -p "$MEDIA_DIR" "$OUT_DIR"

BRIDGE_PID=""
PASS=0
FAIL=0

# ---------------------------------------------------------------------------
log()  { echo "$1"; }
ok()   { echo "   ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "   ❌ $1"; FAIL=$((FAIL+1)); }

cleanup() {
  if [ -n "$BRIDGE_PID" ] && kill -0 "$BRIDGE_PID" 2>/dev/null; then
    log "== Dọn dẹp: tắt bridge (pid $BRIDGE_PID) =="
    kill "$BRIDGE_PID" 2>/dev/null || true
    wait "$BRIDGE_PID" 2>/dev/null || true
  fi
  if [ "$KEEP" -eq 0 ]; then
    rm -rf "$WORKDIR"
  else
    log "   (giữ lại $WORKDIR do --keep)"
  fi
}
trap cleanup EXIT

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ Thiếu công cụ: $1"; exit 1; }
}
for t in node npm curl ffmpeg ffprobe python3; do need "$t"; done

jget() { # jget <json> <key> — đọc 1 field JSON bằng python3
  echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('$2',''))" 2>/dev/null
}

# ---------------------------------------------------------------------------
log "== [0] Chuẩn bị =="
if [ ! -d "$BRIDGE_DIR/node_modules" ]; then
  log "   npm install (lần đầu)..."
  (cd "$BRIDGE_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1 \
    || { echo "❌ npm install thất bại"; exit 1; }
  ok "npm install xong"
else
  ok "node_modules đã có"
fi

# ---------------------------------------------------------------------------
log "== [1] Tạo media test =="
ffmpeg -y -v error -f lavfi -i "color=c=red:s=640x360:d=3:r=30" \
  -c:v libx264 -pix_fmt yuv420p "$MEDIA_DIR/red.mp4" \
  || { echo "❌ tạo red.mp4 thất bại"; exit 1; }
ffmpeg -y -v error -f lavfi -i "color=c=blue:s=640x360:d=3:r=30" \
  -c:v libx264 -pix_fmt yuv420p "$MEDIA_DIR/blue.mp4" \
  || { echo "❌ tạo blue.mp4 thất bại"; exit 1; }
# Video CÓ audio (sine 440Hz) cho case inherit
ffmpeg -y -v error -f lavfi -i "color=c=green:s=640x360:d=4:r=30" \
  -f lavfi -i "sine=frequency=440:duration=4" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$MEDIA_DIR/tone.mp4" \
  || { echo "❌ tạo tone.mp4 thất bại"; exit 1; }
ok "red.mp4, blue.mp4 (câm) + tone.mp4 (có audio)"

# ---------------------------------------------------------------------------
log "== [2] Khởi động bridge (port $PORT) =="
# Fail fast nếu port đã có ai dùng (tránh test nhầm bridge khác)
if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then
  echo "❌ Port $PORT đã có bridge khác đang chạy — dừng nó trước hoặc dùng --port khác"
  exit 1
fi
# BRIDGE_MIN_DISK_FREE thấp vì /tmp trên VM test chỉ ~512MB (media test rất nhỏ)
# Rate limit nới rộng cho test (poll mỗi giây)
BRIDGE_PORT="$PORT" BRIDGE_WORK_DIR="$WORKDIR/jobs" BRIDGE_MIN_DISK_FREE=52428800 \
  BRIDGE_RATE_GENERAL=1000 BRIDGE_RATE_RENDER=100 \
  node "$BRIDGE_DIR/src/index.js" >"$WORKDIR/bridge.log" 2>&1 &
BRIDGE_PID=$!
log "   pid=$BRIDGE_PID, log=$WORKDIR/bridge.log"
# Đảm bảo process còn sống sau khi start (bắt EADDRINUSE...)
sleep 1
if ! kill -0 "$BRIDGE_PID" 2>/dev/null; then
  echo "❌ Bridge tắt ngay sau khi start — xem $WORKDIR/bridge.log:"
  tail -15 "$WORKDIR/bridge.log" || true
  BRIDGE_PID=""
  exit 1
fi

log "== [3] Health check =="
HEALTH_OK=0
for i in $(seq 1 30); do
  if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then
    HEALTH_OK=1; break
  fi
  sleep 1
done
if [ "$HEALTH_OK" -eq 1 ]; then
  FFMPEG_OK="$(curl -s "$BASE_URL/api/health" | grep -o '"ffmpeg":true' || true)"
  ok "bridge OK ${FFMPEG_OK:+(ffmpeg sẵn sàng)}"
else
  bad "bridge không lên trong 30s — xem $WORKDIR/bridge.log"
  tail -20 "$WORKDIR/bridge.log" || true
  exit 1
fi

# ---------------------------------------------------------------------------
# Helper: submit 1 job render. $1=spec.json, $2..=media files (đã có filename=src)
# Trả về jobId qua stdout, exit 1 nếu POST lỗi.
submit_job() {
  local spec="$1"; shift
  local args=(-s -w "\n%{http_code}" -X POST "$BASE_URL/api/render" -F "spec=<${spec}")
  for m in "$@"; do
    local base; base="$(basename "$m")"
    args+=(-F "media=@${m};filename=${base}")
  done
  local resp; resp="$(curl "${args[@]}")"
  local code; code="$(echo "$resp" | tail -1)"
  local body; body="$(echo "$resp" | head -n -1)"
  if [ "$code" != "201" ]; then
    echo "POST_FAIL http=$code body=$body" >&2
    return 1
  fi
  jget "$body" "jobId"
}

# Helper: poll job tới khi done/error. $1=jobId, $2=timeout giây
# Trả về status cuối qua stdout (progress in ra stderr để không lẫn).
poll_job() {
  local id="$1" timeout="${2:-180}" elapsed=0
  while [ "$elapsed" -lt "$timeout" ]; do
    local resp; resp="$(curl -s "$BASE_URL/api/render/$id")"
    local status; status="$(jget "$resp" "status")"
    local prog; prog="$(jget "$resp" "progress")"
    if [ "$status" = "done" ] || [ "$status" = "error" ] || [ "$status" = "cancelled" ]; then
      echo "$status" >&2
      printf "%s" "$status"
      return 0
    fi
    printf "\r   ⏳ job %s: status=%s progress=%s" "$id" "$status" "$prog" >&2
    sleep 1
    elapsed=$((elapsed+1))
  done
  printf "\n" >&2
  printf "TIMEOUT"
  return 1
}

# Helper: verify MP4 bằng ffprobe. $1=file, $2=w, $3=h, $4=duration kỳ vọng
verify_mp4() {
  local f="$1" w="$2" h="$3" dur="$4"
  local info; info="$(ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate \
    -show_entries format=duration -of json "$f" 2>/dev/null)" || return 1
  local vcodec vw vh fps fdur
  vcodec="$(echo "$info" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for s in d['streams']:
    if s.get('codec_name') and s.get('width'):
        print(s['codec_name'], s['width'], s['height'], s.get('avg_frame_rate','')); break")"
  fdur="$(echo "$info" | python3 -c "import sys,json; print(json.load(sys.stdin)['format']['duration'])")"
  set -- $vcodec; vcodec="$1"; vw="$2"; vh="$3"
  local okk=1
  [ "$vcodec" = "h264" ] || { echo "codec=$vcodec (muốn h264)"; okk=0; }
  [ "$vw" = "$w" ] && [ "$vh" = "$h" ] || { echo "res=${vw}x${vh} (muốn ${w}x${h})"; okk=0; }
  python3 -c "import sys; sys.exit(0 if abs(float('$fdur')-float('$dur'))<0.6 else 1)" \
    || { echo "duration=${fdur}s (muốn ~${dur}s)"; okk=0; }
  # Giải mã được vài frame = "xem được"
  ffmpeg -v error -i "$f" -frames:v 10 -f null - 2>/dev/null || { echo "không giải mã được"; okk=0; }
  [ "$okk" -eq 1 ]
}

# ---------------------------------------------------------------------------
# CASE 1: video đơn giản, preset 720p
log "== [CASE 1] Video đơn giản — preset 720p =="
cat > "$WORKDIR/spec1.json" <<'EOF'
{
  "version": "0.2.0",
  "meta": { "name": "e2e-case1", "width": 1280, "height": 720, "fps": 30 },
  "tracks": [
    { "kind": "video", "id": "v1", "clips": [
      { "kind": "video", "id": "c1", "src": "red.mp4",
        "start": 0, "duration": 3, "in": 0, "out": 3, "sourceAudioMode": "mute" }
    ] }
  ]
}
EOF
JOB1="$(submit_job "$WORKDIR/spec1.json" "$MEDIA_DIR/red.mp4")" \
  || { bad "CASE 1: POST /api/render thất bại"; }
if [ -n "${JOB1:-}" ]; then
  log "   jobId=$JOB1"
  ST1="$(poll_job "$JOB1")"; echo ""
  if [ "$ST1" = "done" ]; then
    curl -s -o "$OUT_DIR/case1.mp4" "$BASE_URL/api/render/$JOB1/download"
    if verify_mp4 "$OUT_DIR/case1.mp4" 1280 720 3; then
      ok "CASE 1: MP4 h264 1280x720 ~3s, giải mã được ($(du -h "$OUT_DIR/case1.mp4" | cut -f1))"
    else
      bad "CASE 1: MP4 không đạt ($(verify_mp4 "$OUT_DIR/case1.mp4" 1280 720 3 2>&1 || true))"
    fi
  else
    bad "CASE 1: job status=$ST1"
    curl -s "$BASE_URL/api/render/$JOB1" | head -c 500; echo ""
  fi
fi

# ---------------------------------------------------------------------------
# CASE 2: video + text overlay, preset 1080p
log "== [CASE 2] Video + text — preset 1080p =="
cat > "$WORKDIR/spec2.json" <<'EOF'
{
  "version": "0.2.0",
  "meta": { "name": "e2e-case2", "width": 1920, "height": 1080, "fps": 30 },
  "tracks": [
    { "kind": "video", "id": "v1", "clips": [
      { "kind": "video", "id": "c1", "src": "blue.mp4",
        "start": 0, "duration": 3, "in": 0, "out": 3, "sourceAudioMode": "mute" }
    ] },
    { "kind": "text", "id": "t1", "clips": [
      { "kind": "text", "id": "tx1", "text": "Xin chao E2E",
        "start": 0.5, "duration": 2,
        "style": { "fontFamily": "Noto Sans", "fontSize": 72, "color": "#ffffff",
                   "x": 0.5, "y": 0.5, "animation": "fadeUp" } }
    ] }
  ]
}
EOF
JOB2="$(submit_job "$WORKDIR/spec2.json" "$MEDIA_DIR/blue.mp4")" \
  || { bad "CASE 2: POST /api/render thất bại"; }
if [ -n "${JOB2:-}" ]; then
  log "   jobId=$JOB2"
  ST2="$(poll_job "$JOB2")"; echo ""
  if [ "$ST2" = "done" ]; then
    curl -s -o "$OUT_DIR/case2.mp4" "$BASE_URL/api/render/$JOB2/download"
    if verify_mp4 "$OUT_DIR/case2.mp4" 1920 1080 3; then
      ok "CASE 2: MP4 h264 1920x1080 ~3s (text render không lỗi)"
    else
      bad "CASE 2: MP4 không đạt"
    fi
  else
    bad "CASE 2: job status=$ST2"
    curl -s "$BASE_URL/api/render/$JOB2" | head -c 500; echo ""
  fi
fi

# ---------------------------------------------------------------------------
# CASE 3: video có audio (inherit) — audio phải được giữ, không phải track câm
log "== [CASE 3] Video có audio (inherit) =="
cat > "$WORKDIR/spec3.json" <<'EOF'
{
  "version": "0.2.0",
  "meta": { "name": "e2e-case3", "width": 640, "height": 360, "fps": 30 },
  "tracks": [
    { "kind": "video", "id": "v1", "clips": [
      { "kind": "video", "id": "c1", "src": "tone.mp4",
        "start": 0, "duration": 4, "in": 0, "out": 4, "sourceAudioMode": "inherit" }
    ] }
  ]
}
EOF
JOB3="$(submit_job "$WORKDIR/spec3.json" "$MEDIA_DIR/tone.mp4")" \
  || { bad "CASE 3: POST /api/render thất bại"; }
if [ -n "${JOB3:-}" ]; then
  log "   jobId=$JOB3"
  ST3="$(poll_job "$JOB3")"; echo ""
  if [ "$ST3" = "done" ]; then
    curl -s -o "$OUT_DIR/case3.mp4" "$BASE_URL/api/render/$JOB3/download"
    ACODEC="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name \
      -of csv=p=0 "$OUT_DIR/case3.mp4" 2>/dev/null)"
    # mean_volume hữu hạn = có tiếng thật (track câm sẽ là -inf/n/a)
    MVOL="$(ffmpeg -i "$OUT_DIR/case3.mp4" -af volumedetect -f null - 2>&1 \
      | grep "mean_volume" | head -1)"
    if [ "$ACODEC" = "aac" ] && echo "$MVOL" | grep -qv "inf\|n/a" && [ -n "$MVOL" ]; then
      ok "CASE 3: audio aac được giữ, $MVOL"
    else
      bad "CASE 3: audio không đạt (codec=$ACODEC, $MVOL)"
    fi
    verify_mp4 "$OUT_DIR/case3.mp4" 640 360 4 >/dev/null 2>&1 \
      && ok "CASE 3: video 640x360 ~4s OK" \
      || bad "CASE 3: video không đạt"
  else
    bad "CASE 3: job status=$ST3"
  fi
fi

# ---------------------------------------------------------------------------
# CASE 4: spec lỗi → 400 (không tạo job)
log "== [CASE 4] Spec lỗi phải bị từ chối (400) =="
echo '{"version":"0.2.0","tracks":"khong-phai-mang"}' > "$WORKDIR/spec-bad.json"
CODE4="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/render" \
  -F "spec=<${WORKDIR}/spec-bad.json")"
if [ "$CODE4" = "400" ]; then
  ok "CASE 4: spec sai → 400 đúng"
else
  bad "CASE 4: muốn 400, nhận $CODE4"
fi

# ---------------------------------------------------------------------------
# CASE 5: tên file nguy hiểm phải bị chặn (400)
# Lưu ý: busboy/multer đã chuẩn hóa "../x" → "x" trước khi tới handler (đã kiểm
# chứng), nên traversal qua multipart không tới được sanitizeFilename. Case này
# kiểm tra các tên busboy KHÔNG chuẩn hóa nhưng sanitizeFilename phải từ chối:
#   - file ẩn (dấu chấm đầu)
#   - ký tự ngoài whitelist
log "== [CASE 5] Tên file nguy hiểm phải bị chặn (400) =="
cp "$MEDIA_DIR/red.mp4" "$WORKDIR/evil.mp4"
check_bad_name() { # $1 = filename gửi thô
  python3 - "$BASE_URL" "$WORKDIR/spec1.json" "$WORKDIR/evil.mp4" "$1" <<'PYEOF'
import sys, http.client, urllib.parse, uuid
base, spec_path, media_path, evil_name = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
u = urllib.parse.urlparse(base)
boundary = "----E2EBoundary" + uuid.uuid4().hex
with open(spec_path, "rb") as f: spec_data = f.read()
with open(media_path, "rb") as f: media_data = f.read()
body = b""
body += ("--" + boundary + "\r\n").encode()
body += b'Content-Disposition: form-data; name="spec"\r\n\r\n' + spec_data + b"\r\n"
body += ("--" + boundary + "\r\n").encode()
body += ('Content-Disposition: form-data; name="media"; filename="%s"\r\n' % evil_name).encode()
body += b"Content-Type: video/mp4\r\n\r\n" + media_data + b"\r\n"
body += ("--" + boundary + "--\r\n").encode()
conn = http.client.HTTPConnection(u.hostname, u.port, timeout=30)
conn.request("POST", "/api/render", body,
             {"Content-Type": "multipart/form-data; boundary=" + boundary})
print(conn.getresponse().status)
PYEOF
}
C5a="$(check_bad_name ".hidden.mp4")"
C5b="$(check_bad_name 'evil$.mp4')"
if [ "$C5a" = "400" ] && [ "$C5b" = "400" ]; then
  ok "CASE 5: .hidden.mp4 → 400, evil\$.mp4 → 400 (sanitizeFilename chặn đúng)"
else
  bad "CASE 5: muốn 400/400, nhận $C5a/$C5b"
fi

# ---------------------------------------------------------------------------
# CASE 6: hủy job (DELETE)
log "== [CASE 6] Hủy job (DELETE) =="
JOB6="$(submit_job "$WORKDIR/spec1.json" "$MEDIA_DIR/red.mp4")" \
  || { bad "CASE 6: POST thất bại"; }
if [ -n "${JOB6:-}" ]; then
  DEL="$(curl -s -X DELETE "$BASE_URL/api/render/$JOB6")"
  if echo "$DEL" | grep -q '"ok":true'; then
    ok "CASE 6: DELETE trả về ok:true"
  else
    bad "CASE 6: DELETE không ok ($DEL)"
  fi
fi

# ---------------------------------------------------------------------------
log ""
log "=========================================="
if [ "$FAIL" -eq 0 ]; then
  log "🎉 E2E PASS: $PASS/$((PASS+FAIL)) check"
else
  log "💥 E2E FAIL: $PASS pass, $FAIL fail"
fi
log "=========================================="
[ "$FAIL" -eq 0 ]
