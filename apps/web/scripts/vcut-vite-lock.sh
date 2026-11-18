#!/bin/bash
# vcut-vite-lock.sh — protocol vite lock chuẩn cho VCut (đợt 111 M8).
#
# BỐI CẢNH (xem docs/PHASE9_ROUND111_M8_INFRA_LIMITS.md):
# - Trần inotify 63747, headroom thật chỉ ~1657 (boot #40) do ~62k watch
#   bị giữ ngoài cell; 1 vite thường giữ ~1585 watch nên vite thứ hai
#   chết chắc -> VITE NỐI TIẾP BẮT BUỘC, tối đa 1 vite tại một thời điểm.
# - Đợt 110 có 2 vụ vite mồ côi (L8 §3.4 kill vỏ npx không giết được node
#   con; L7 pid 21711 do L9 dọn) + lock dir L4 có lúc trống không có file
#   owner -> cần chuẩn hóa protocol này, mọi luồng dùng CHUNG một script.
#
# SPEC (bắt buộc với mọi luồng giữ vite):
# 1. ACQUIRE: mkdir nguyên tử + GHI FILE owner NGAY trong cùng lệnh gọi
#    (không được mkdir rồi để dir trống như L4). Owner BẮT BUỘC có đủ:
#      thread=<tên luồng, vd m8 / l5-run31>
#      pid=<pid của tiến trình driver/shell giữ lock — TRUYỀN VÀO qua tham
#        số owner_pid (mặc định $PPID của lệnh acquire); KHÔNG dùng pid của
#        chính script helper vì nó thoát ngay sau acquire. Nếu driver là
#        script dài, truyền $$ của driver đó.
#      port=<cổng vite sẽ dùng>
#      started=<ISO UTC lúc acquire>
#      boot=<boot_id lúc acquire>
#    Owner ghi qua file tmp + mv (nguyên tử trong cùng dir).
# 2. STALE-LOCK RECOVERY: lock chỉ được coi là stale khi ĐỦ cả 3 điều kiện
#    kiểm tra trực tiếp (ps + curl), không đoán theo tuổi một mình:
#      (a) pid trong owner đã chết (kill -0 thất bại), VÀ
#      (b) không còn tiến trình vite node nào trên cổng owner
#          (vite_node_pid trống), VÀ
#      (c) curl cổng owner trả về 000 (không còn phục vụ).
#    Ngoài ra: lock dir KHÔNG có owner file mà tuổi dir > 5 phút VÀ không
#    còn vite nào chạy (ps) VÀ mọi cổng vite đã biết đều 000 -> cũng stale.
#    Tuổi tối thiểu để xét stale: STALE_MIN phút (mặc định 30, như L5).
#    Khi stale: xóa lock (rm -rf dir), ghi log, rồi mkdir lại.
# 3. RELEASE: chỉ luồng có thread trùng owner mới được nhả (xóa owner
#    rồi rmdir). Không bao giờ rm -rf lock của luồng khác khi chưa qua
#    bước stale-recovery ở mục 2.
# 4. KILL VITE: kill theo PID NODE THẬT (tiến trình node chạy .bin/vite),
#    KHÔNG kill vỏ npx, KHÔNG pkill theo pattern "vite --port" trần
#    (pattern đó bỏ sót dạng "-c <config> --port"). Sau kill phải kiểm
#    ps + curl cổng về 000; nếu vẫn sống sau TERM 10s thì KILL, kiểm lại.
# 5. Vite tạm của luồng đo DÙNG server.watch.ignored ["**/**"] (0 watch,
#    đo L8) để không ăn headroom inotify.
# 6. CÔNG BẰNG HÀNG ĐỢI: luồng vừa nhả lock mà định giữ lại ngay (vd chạy
#    nhiều lượt đo nối tiếp) nên chờ ≥15 s sau khi nhả trước khi giữ lại —
#    vì luồng đang chờ thăm lock mỗi VITE_LOCK_POLL_S giây (mặc định 10 s)
#    và sẽ bỏ lỡ cửa nhả-giữ lại ngắn hơn chu kỳ thăm. M7 đợt 111 đã làm
#    M8 bỏ lỡ 2 cửa (~8 s) theo đúng mẫu này.
#
# CÁCH DÙNG:
#   bash apps/web/scripts/vcut-vite-lock.sh acquire <thread> <port> [timeout_s] [stale_min] [owner_pid]
#   bash apps/web/scripts/vcut-vite-lock.sh release <thread>
#   bash apps/web/scripts/vcut-vite-lock.sh status
#   bash apps/web/scripts/vcut-vite-lock.sh kill-vite <port>
#   bash apps/web/scripts/vcut-vite-lock.sh vite-node-pid <port>
# Biến môi trường: VITE_LOCK_DIR (mặc định
#   ~/workspace/goals/capcut-clone-video-editor/hidden_files/vite.lock).
#   Dùng VITE_LOCK_DIR khác để test stale-recovery mà không đụng lock thật.
# Exit: 0 = thành công / lock đang giữ bởi luồng khác còn tươi (status in
#   rõ); 1 = acquire timeout / kill-vite vẫn còn vite sống sau KILL.
# KHÔNG push/tag. Không sửa production. Không reboot máy.
set -u
LOCKDIR="${VITE_LOCK_DIR:-$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/vite.lock}"
KNOWN_PORTS="5173 5560 5590 5599 5580 5581 5184 8861"

vite_node_pid() { # $1 = port -> in pid node thật chạy .bin/vite trên cổng đó
  local port="$1" p cmd
  for p in $(pgrep -f "vite.*--port[ =]${port}([^0-9]|$)" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*) echo "$p"; return 0;; esac
  done
  # fallback: mọi tiến trình node có vite trong cmdline và cổng trong cmdline
  for p in $(pgrep -f "vite" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*"${port}"*) echo "$p"; return 0;; esac
  done
  return 1
}

vite_any_running() { # in 1 dòng mô tả vite node đang chạy (nếu có)
  local p cmd
  for p in $(pgrep -f "vite" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*) echo "pid=$p $cmd"; return 0;; esac
  done
  return 1
}

port_serving() { # $1 = port -> 0 nếu curl trả 2xx/3xx/4xx (đang phục vụ)
  # Lưu ý: KHÔNG dùng `curl ... || echo "000"` — khi curl lỗi, -w đã in
  # "000" rồi, `|| echo` sẽ nối thêm thành "000000" (bug M8 lúc test).
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://127.0.0.1:$1/" 2>/dev/null)
  [ -z "$code" ] && code="000"
  [ "$code" != "000" ]
}

owner_field() { # $1 = key -> value trong $LOCKDIR/owner (hỗ trợ cả 2 định dạng:
  # key=value mỗi dòng (spec M8) và "thread pid=.. start=.. port=.." một dòng (L5/M6 cũ)
  local v
  v=$(grep -E "^$1=" "$LOCKDIR/owner" 2>/dev/null | head -1 | cut -d= -f2-)
  if [ -z "$v" ]; then
    v=$(grep -oE "(^| )$1=[^ ]+" "$LOCKDIR/owner" 2>/dev/null | head -1 | cut -d= -f2-)
  fi
  # Định dạng "pid:tag:timestamp" của M3 (đợt 111): pid là số đầu dòng.
  if [ -z "$v" ] && [ "$1" = "pid" ]; then
    v=$(head -1 "$LOCKDIR/owner" 2>/dev/null | grep -oE "^[0-9]+" | head -1)
  fi
  echo "$v"
}

lock_age_s() {
  local now t
  now=$(date +%s)
  t=$(stat -c %Y "$LOCKDIR" 2>/dev/null || echo 0)
  echo $((now - t))
}

# Kiểm tra lock hiện tại có stale không; trả 0 nếu stale (kèm lý do ra stdout).
lock_is_stale() { # $1 = stale_min
  local stale_min="$1" age owner_pid owner_port pid_alive vitepid
  age=$(lock_age_s)
  if [ ! -f "$LOCKDIR/owner" ]; then
    # Dir trống như L4: chỉ stale khi đủ già VÀ không còn vite nào VÀ mọi cổng đều chết.
    if [ "$age" -gt 300 ] && ! vite_any_running >/dev/null; then
      local p serving=0
      for p in $KNOWN_PORTS; do port_serving "$p" && serving=1; done
      if [ "$serving" = 0 ]; then echo "stale: dir trống, tuổi ${age}s, không vite, không cổng phục vụ"; return 0; fi
    fi
    echo "chưa stale: dir trống nhưng tuổi ${age}s < 300s hoặc còn vite/cổng sống"; return 1
  fi
  if [ "$age" -lt $((stale_min * 60)) ]; then
    echo "chưa stale: tuổi ${age}s < ${stale_min} phút"; return 1
  fi
  owner_pid=$(owner_field pid)
  owner_port=$(owner_field port)
  pid_alive=0; kill -0 "$owner_pid" 2>/dev/null && pid_alive=1
  vitepid=$(vite_node_pid "${owner_port:-0}" 2>/dev/null || true)
  if [ "$pid_alive" = 0 ] && [ -z "$vitepid" ] && ! port_serving "${owner_port:-0}"; then
    echo "stale: owner pid $owner_pid chết + không vite trên cổng $owner_port + curl 000 (tuổi ${age}s)"
    return 0
  fi
  echo "chưa stale: pid_alive=$pid_alive vitepid=${vitepid:-none} port_serving=$(port_serving "${owner_port:-0}" && echo yes || echo no) (tuổi ${age}s)"
  return 1
}

cmd_acquire() { # $1 thread, $2 port, $3 timeout_s (def 1800), $4 stale_min (def 30), $5 owner_pid (def $PPID)
  local thread="$1" port="$2" timeout="${3:-1800}" stale_min="${4:-30}" owner_pid="${5:-$PPID}"
  local waited=0 reason poll="${VITE_LOCK_POLL_S:-10}"
  # VITE_LOCK_POLL_S: chu kỳ thăm lock (giây). Mặc định 10 s. Luồng chờ
  # nên dùng 2–5 s: M7 đợt 111 nhả rồi giữ lại chỉ sau ~8 s nên thăm 10 s
  # có thể bỏ lỡ cửa (M8 đã bỏ lỡ 2 cửa r65→r66, r66→r67). Ngược lại,
  # luồng vừa nhả lock mà định giữ lại ngay nên chờ ≥15 s sau khi nhả
  # (xem spec mục 6) để luồng đang chờ có cửa công bằng.
  while true; do
    if mkdir "$LOCKDIR" 2>/dev/null; then
      # Ghi owner NGAY, nguyên tử qua tmp+mv — không để dir trống.
      local tmp="$LOCKDIR/.owner.tmp.$$"
      {
        echo "thread=$thread"
        echo "pid=$owner_pid"
        echo "port=$port"
        echo "started=$(date -u +%FT%TZ)"
        echo "boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)"
      } > "$tmp" && mv "$tmp" "$LOCKDIR/owner"
      echo "vite-lock: ĐÃ GIỮ (thread=$thread port=$port owner_pid=$owner_pid)"
      return 0
    fi
    if reason=$(lock_is_stale "$stale_min"); then
      echo "vite-lock: $reason — XÓA lock stale và giữ lại"
      rm -rf "$LOCKDIR"
      continue
    fi
    if [ "$waited" -ge "$timeout" ]; then
      echo "vite-lock: HẾT ${timeout}s vẫn có lock khác (owner: $(cat "$LOCKDIR/owner" 2>/dev/null | tr '\n' ' ' || echo '(dir trống)')) — BỎ"
      return 1
    fi
    if [ $((waited % 60)) = 0 ]; then
      echo "vite-lock: chờ lock khác (owner: $(cat "$LOCKDIR/owner" 2>/dev/null | tr '\n' ' ' || echo '(dir trống)'), đã chờ ${waited}s)"
    fi
    sleep "$poll"; waited=$((waited + poll))
  done
}

cmd_release() { # $1 thread
  local thread="$1" owner_thread
  owner_thread=$(owner_field thread)
  if [ "$owner_thread" != "$thread" ]; then
    echo "vite-lock: KHÔNG NHẢ — owner hiện tại là '${owner_thread:-?}', không phải '$thread'"
    return 1
  fi
  rm -f "$LOCKDIR/owner" && rmdir "$LOCKDIR" 2>/dev/null
  echo "vite-lock: ĐÃ NHẢ (thread=$thread $(date -u +%FT%TZ))"
  return 0
}

cmd_status() {
  if [ ! -d "$LOCKDIR" ]; then echo "vite-lock: TRỐNG (không có lock)"; return 0; fi
  echo "vite-lock: dir tồn tại, tuổi $(lock_age_s)s"
  if [ -f "$LOCKDIR/owner" ]; then cat "$LOCKDIR/owner"; else echo "owner: (KHÔNG CÓ FILE OWNER — dir trống như vụ L4)"; fi
  local port
  port=$(owner_field port)
  if [ -n "$port" ]; then
    echo "vite node trên cổng $port: $(vite_node_pid "$port" 2>/dev/null || echo none)"
    echo "curl cổng $port: $(port_serving "$port" && echo SERVING || echo 000)"
  fi
  echo "vite bất kỳ đang chạy: $(vite_any_running || echo none)"
  return 0
}

cmd_kill_vite() { # $1 port
  local port="$1" pid i code
  pid=$(vite_node_pid "$port" 2>/dev/null || true)
  if [ -z "$pid" ]; then
    if port_serving "$port"; then
      echo "kill-vite :$port: không tìm được pid node nhưng cổng vẫn phục vụ — KHÔNG kill mù, kiểm tra tay"
      return 1
    fi
    echo "kill-vite :$port: không có vite node, cổng 000 — đã sạch"
    return 0
  fi
  echo "kill-vite :$port: TERM pid node $pid"
  kill "$pid" 2>/dev/null
  for i in $(seq 1 10); do
    sleep 1
    kill -0 "$pid" 2>/dev/null || break
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "kill-vite :$port: pid $pid còn sống sau TERM 10s — KILL"
    kill -9 "$pid" 2>/dev/null; sleep 2
  fi
  # Kiểm chứng ps + curl sau kill (bắt buộc).
  if vite_node_pid "$port" >/dev/null 2>&1; then
    echo "kill-vite :$port: FAIL — vẫn còn vite node $(vite_node_pid "$port") sau KILL"
    return 1
  fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://127.0.0.1:$port/" 2>/dev/null)
  [ -z "$code" ] && code="000"
  if [ "$code" != "000" ]; then
    echo "kill-vite :$port: FAIL — cổng vẫn trả $code sau khi kill pid"
    return 1
  fi
  echo "kill-vite :$port: OK — pid $pid chết, ps sạch, curl 000"
  return 0
}

# Có thể source file này để dùng hàm trong script khác.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    acquire)   [ $# -ge 3 ] || { echo "dùng: $0 acquire <thread> <port> [timeout_s] [stale_min] [owner_pid]"; exit 2; }; cmd_acquire "$2" "$3" "${4:-1800}" "${5:-30}" "${6:-$PPID}";;
    release)   [ $# -ge 2 ] || { echo "dùng: $0 release <thread>"; exit 2; }; cmd_release "$2";;
    status)    cmd_status;;
    kill-vite) [ $# -ge 2 ] || { echo "dùng: $0 kill-vite <port>"; exit 2; }; cmd_kill_vite "$2";;
    vite-node-pid) [ $# -ge 2 ] || { echo "dùng: $0 vite-node-pid <port>"; exit 2; }; vite_node_pid "$2";;
    *) echo "dùng: $0 {acquire|release|status|kill-vite|vite-node-pid} ..."; exit 2;;
  esac
fi
