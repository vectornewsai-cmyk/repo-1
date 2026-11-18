#!/bin/bash
# vcut-vite-lock-v2.sh — vite lock v2: hàng đợi FIFO + ưu tiên lượt dài +
# release-between-attempts (đợt 114 Q4).
#
# VẤN ĐỀ GỐC (v1 — apps/web/scripts/vcut-vite-lock.sh, đóng băng đợt 111):
# - acquire = mkdir đua nhau, ai mkdir thắng thì giữ; KHÔNG có hàng đợi:
#   P7 thắng race mkdir sau khi P3 được nhả tay (đợt 113 §10.5).
# - Holder giữ lock suốt cả chuỗi lượt + cả lúc chờ tải nền (dial-wait):
#   P1 giữ ~35 phút làm P5 mất 2 cửa acquire 900 s (đợt 113 §10.5).
# - Chỉ có khuyến nghị "nhả rồi chờ ≥15 s mới giữ lại" (spec v1 §6), không
#   có cơ chế nào bắt buộc; không có priority cho lượt dài.
#
# V2 GIỮ NGUYÊN từ v1 (tương thích hành vi, không đổi semantics an toàn):
# - Mutex vẫn là mkdir nguyên tử trên LOCKDIR + ghi owner NGAY (tmp+mv).
# - Stale-lock recovery vẫn cần ĐỦ 3 điều kiện trực tiếp (owner pid chết +
#   không còn vite node trên cổng owner + curl cổng 000), cộng thêm đường
#   tắt khi boot_id đổi (reboot chắc chắn giết holder cũ).
# - Release chỉ khi thread trùng owner. Kill vite theo pid node thật.
#
# V2 THÊM:
# 1. HÀNG ĐỢI FIFO BẰNG TICKET: mỗi waiter lấy 1 ticket (mkdir ticket dir
#    `<class>-<nanos>-<pid>-<thread>` trong QUEUEDIR). Chỉ ticket đứng đầu
#    hàng đợi mới được mkdir lock. Ticket chứa thread/pid/port/prio/created/
#    boot để dọn ticket chết (pid chết hoặc boot đổi) — không bao giờ dọn
#    ticket của tiến trình còn sống.
# 2. ƯU TIÊN LƯỢT DÀI: ticket class 0 = LONG-RUN (`--prio long`), class 1 =
#    normal. Class 0 luôn đứng trước class 1. Chống đói ngược (aging):
#    ticket normal chờ quá VITE_LOCK_AGING_S (mặc định 600 s) được nâng
#    lên class 0, nên lượt dài mới tới không chen mãi được lượt ngắn đã chờ lâu.
# 3. RELEASE-BETWEEN-ATTEMPTS BẮT BUỘC QUA WRAPPER: `run-attempt` acquire,
#    chạy đúng 1 attempt, rồi nhả trong trap (kể cả khi attempt fail / bị
#    kill). Muốn chạy attempt tiếp theo phải lấy ticket mới — tức xếp cuối
#    hàng đợi nếu có waiter khác. Dial-wait (chờ tải nền) PHẢI ở ngoài
#    wrapper (xem mẫu driver ở cuối file): giữ lock trong lúc dial là lỗi
#    thiết kế, v2 không cho phép về mặt cấu trúc nữa.
# 4. COOLDOWN SAU NHẢ: sau khi release, cùng thread muốn giữ lại phải chờ
#    đủ VITE_LOCK_REACQUIRE_DELAY_S (mặc định 15 s, theo spec v1 §6) — để
#    waiter đang thăm lock mỗi vài giây có cửa lấy ticket trước khi holder
#    cũ quay lại. Cooldown được ghi vào file trong QUEUEDIR, không chặn
#    thread khác.
# 5. LOGGING ĐẦY ĐỦ: mọi sự kiện TICKET/ACQUIRED/RELEASED/TIMEOUT/STALE/
#    STALE-TICKET/COOLDOWN đều ghi vào VITE_LOCK_LOG (mặc định
#    hidden_files/vite-lock-v2.log) kèm epoch, thread, wait time, vị trí
#    hàng đợi — đợt sau đối chiếu pattern đói lock từ log này.
#
# TRẠNG THÁI TRIỂN KHAI — SPEC CHUẨN TỪ ĐỢT 118 (T1, quyết parent
# 15/11/2026, xem docs/PHASE9_ROUND117_LIMITS.md §13 quyết 4 + doc spec
# docs/VCUT_VITE_LOCK_FREEZE_SPEC.md): v2 là protocol đóng băng duy nhất
# từ đợt 118. Đợt 114 chỉ test standalone; đợt 115 pilot R4; đợt 116
# migration nguyên tử v2-only (aging 600); đợt 117 T4 đo đủ 3 điều kiện
# (44 ticket / 38 giữ / 31 lượt thật; vá C 300 s → 301 s tường; aging
# 600 lật đúng mốc). V1 (apps/web/scripts/vcut-vite-lock.sh, md5
# fd21193c) ĐÓNG BĂNG làm sao lưu — KHÔNG dùng, KHÔNG sửa, KHÔNG xóa.
# KHÔNG sửa file này trong lúc có acquire đang chạy (xem spec §4).
#
# VÁ ĐỢT 115 R4 (sau pilot thí điểm 18:01–18:30Z ngày 14/11, xem
# docs/PHASE9_ROUND115_R4_LOCKV2_LIMITS.md):
# - Cooldown ghi epoch MILI-GIÂY (trước: `date +%s` giây nguyên làm remain
#   hụt tới ~1 s, test T6 flaky 2/6 lần).
# - `waited` tính từ wall-clock thay vì cộng dồn poll-sleep: dưới tải cao
#   timeout danh nghĩa 900 s thực tế chờ ~1205 s (giãn 1,34×).
# - `vite_node_pid`/`vite_any_running` chỉ nhận tiến trình có exe là node:
#   trước đây khớp cả vỏ `timeout` và shell driver (cmdline chứa
#   "node_modules/.bin/vite") nên kill-vite có thể TERM nhầm driver.
# - `status` đếm chỉ thư mục ticket (trước: file cooldown cũng bị đếm).
#
# ĐỔI MẶC ĐỊNH ĐỢT 116 S4 (quyết parent 15/11, xem
# docs/PHASE9_ROUND116_S4_LOCKV2MIGRATION_LIMITS.md):
# - VITE_LOCK_AGING_S mặc định 1800 → 600 s. Lý do: timeout acquire chuẩn
#   của các luồng là 900 s nên aging 1800 không bao giờ có tác dụng (waiter
#   timeout trước khi kịp nâng hạng); 600 s ≈ 1 lượt giữ dài + 300 s đệm
#   trước timeout. Chỉ đổi MẶC ĐỊNH aging — timeout acquire mặc định vẫn
#   1800 s, cooldown 15 s không đổi. Đợt 116 là đợt v2-only (migration
#   nguyên tử, cấm hỗn hợp v1/v2); v1 frozen (md5 fd21193c) không đụng.
#
# ĐỔI THỨ TỰ GHI LOG RELEASED / COOLDOWN ĐỢT 135 T6 (quyết parent đợt 134
# §12.3(b), sửa F-134-T6-2 — xem docs/PHASE9_ROUND135_T6_LOCKHEALTH_LIMITS.md
# §3 + docs/VCUT_VITE_LOCK_FREEZE_SPEC.md §3.1):
# - cmd_release cũ: rmdir → ghi file cooldown → tính hold_s → log RELEASED.
#   Reboot cắt giữa ghi cooldown và ghi log → mất dòng RELEASED, log giữ
#   mãi 1 ACQUIRED không cặp (t4 đợt 134, dòng 869).
# - cmd_release mới: tính hold_s → rmdir → log RELEASED → ghi file
#   cooldown. Cắt ngang giữa hai bước chỉ mất file cooldown (mục prune,
#   mất không hại), không để lại ACQUIRED không cặp. Không đổi logic
#   khác (guard, rc, cooldown 15 s, trap, acquire, stale-recovery).
#
# CÁCH DÙNG:
#   bash vcut-vite-lock-v2.sh acquire <thread> <port> [timeout_s] [stale_min] [owner_pid] [prio]
#     prio: normal (mặc định) | long
#   bash vcut-vite-lock-v2.sh release <thread>
#   bash vcut-vite-lock-v2.sh status
#   bash vcut-vite-lock-v2.sh queue
#   bash vcut-vite-lock-v2.sh kill-vite <port>
#   bash vcut-vite-lock-v2.sh vite-node-pid <port>
#   bash vcut-vite-lock-v2.sh run-attempt <thread> <port> [timeout_s] [stale_min] [prio] -- <cmd...>
#     Chạy 1 attempt rồi tự nhả. Exit: mã của <cmd> (0 = xong); 3 = không
#     lấy được lock (timeout); 2 = sai cú pháp.
# Biến môi trường: VITE_LOCK_DIR (mặc định
#   ~/workspace/goals/capcut-clone-video-editor/hidden_files/vite.lock),
#   VITE_LOCK_QUEUE_DIR (mặc định ${VITE_LOCK_DIR}.queue),
#   VITE_LOCK_LOG (mặc định .../hidden_files/vite-lock-v2.log),
#   VITE_LOCK_POLL_S (mặc định 2), VITE_LOCK_REACQUIRE_DELAY_S (mặc định 15),
#   VITE_LOCK_AGING_S (mặc định 600), VITE_LOCK_BOOT_ID (chỉ để test:
#   ghi đè boot_id đọc từ /proc/sys/kernel/random/boot_id).
# KHÔNG push/tag. Không sửa production. Không reboot máy.
set -u
LOCKDIR="${VITE_LOCK_DIR:-$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/vite.lock}"
QUEUEDIR="${VITE_LOCK_QUEUE_DIR:-${LOCKDIR}.queue}"
LOGFILE="${VITE_LOCK_LOG:-$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/vite-lock-v2.log}"
KNOWN_PORTS="5173 5560 5590 5599 5580 5581 5184 8861"

log_event() { # $1 thread, $2 event, $3 detail... -> 1 dòng vào LOGFILE
  local ts
  ts=$(date +%s)
  mkdir -p "$(dirname "$LOGFILE")" 2>/dev/null || true
  printf '%s %s %s %s\n' "$(date -u -d "@$ts" +%FT%TZ 2>/dev/null || date -u +%FT%TZ)" "$1" "$2" "${3:-}" >> "$LOGFILE" 2>/dev/null || true
}

boot_id_now() {
  if [ -n "${VITE_LOCK_BOOT_ID:-}" ]; then echo "$VITE_LOCK_BOOT_ID"; return 0; fi
  cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?
}

vite_node_pid() { # $1 = port -> in pid node thật chạy .bin/vite trên cổng đó
  # Chỉ nhận tiến trình mà /proc/PID/exe là node (vá đợt 115 R4): trước đây
  # chỉ khớp cmdline chứa "node" + ".bin/vite" nên nhầm cả vỏ `timeout` và
  # shell driver (cmdline của chúng chứa "node_modules/.bin/vite") — 3c trả
  # về pid timeout thay vì pid node thật; tệ hơn, kill-vite có thể TERM
  # nhầm driver. Nếu exe không đọc được thì BỎ QUA pid đó (an toàn hơn là
  # đoán): kill-vite sẽ báo không tìm thấy thay vì giết nhầm.
  local port="$1" p cmd
  for p in $(pgrep -f "vite.*--port[ =]${port}([^0-9]|$)" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    case "$(readlink "/proc/$p/exe" 2>/dev/null)" in *node*) ;; *) continue;; esac
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*) echo "$p"; return 0;; esac
  done
  for p in $(pgrep -f "vite" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    case "$(readlink "/proc/$p/exe" 2>/dev/null)" in *node*) ;; *) continue;; esac
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*"${port}"*) echo "$p"; return 0;; esac
  done
  return 1
}

vite_any_running() { # in 1 dòng mô tả vite node đang chạy (nếu có)
  local p cmd
  for p in $(pgrep -f "vite" 2>/dev/null); do
    [ -r "/proc/$p/cmdline" ] || continue
    case "$(readlink "/proc/$p/exe" 2>/dev/null)" in *node*) ;; *) continue;; esac
    cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)
    case "$cmd" in *node*".bin/vite"*) echo "pid=$p $cmd"; return 0;; esac
  done
  return 1
}

port_serving() { # $1 = port -> 0 nếu curl trả khác 000 (đang phục vụ)
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://127.0.0.1:$1/" 2>/dev/null)
  [ -z "$code" ] && code="000"
  [ "$code" != "000" ]
}

owner_field() { # $1 = key -> value trong $LOCKDIR/owner (2 định dạng như v1)
  local v
  v=$(grep -E "^$1=" "$LOCKDIR/owner" 2>/dev/null | head -1 | cut -d= -f2-)
  if [ -z "$v" ]; then
    v=$(grep -oE "(^| )$1=[^ ]+" "$LOCKDIR/owner" 2>/dev/null | head -1 | cut -d= -f2-)
  fi
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
# Giữ nguyên luật v1 (đủ 3 điều kiện trực tiếp), cộng: boot_id đổi + đủ 3 điều
# kiện thì stale NGAY không cần chờ đủ STALE_MIN (reboot đã giết holder cũ).
lock_is_stale() { # $1 = stale_min
  local stale_min="$1" age owner_pid owner_port owner_boot pid_alive vitepid
  age=$(lock_age_s)
  if [ ! -f "$LOCKDIR/owner" ]; then
    if [ "$age" -gt 300 ] && ! vite_any_running >/dev/null; then
      local p serving=0
      for p in $KNOWN_PORTS; do port_serving "$p" && serving=1; done
      if [ "$serving" = 0 ]; then echo "stale: dir trống, tuổi ${age}s, không vite, không cổng phục vụ"; return 0; fi
    fi
    echo "chưa stale: dir trống nhưng tuổi ${age}s < 300s hoặc còn vite/cổng sống"; return 1
  fi
  owner_pid=$(owner_field pid)
  owner_port=$(owner_field port)
  owner_boot=$(owner_field boot)
  pid_alive=0; kill -0 "$owner_pid" 2>/dev/null && pid_alive=1
  vitepid=$(vite_node_pid "${owner_port:-0}" 2>/dev/null || true)
  if [ "$pid_alive" = 0 ] && [ -z "$vitepid" ] && ! port_serving "${owner_port:-0}"; then
    if [ -n "$owner_boot" ] && [ "$owner_boot" != "$(boot_id_now)" ]; then
      echo "stale: owner pid $owner_pid chết + không vite trên cổng $owner_port + curl 000 + boot đổi (tuổi ${age}s)"
      return 0
    fi
    if [ "$age" -ge $((stale_min * 60)) ]; then
      echo "stale: owner pid $owner_pid chết + không vite trên cổng $owner_port + curl 000 (tuổi ${age}s)"
      return 0
    fi
    echo "chưa stale: holder chết nhưng tuổi ${age}s < ${stale_min} phút (chờ đủ tuổi mới cướp)"
    return 1
  fi
  echo "chưa stale: pid_alive=$pid_alive vitepid=${vitepid:-none} port_serving=$(port_serving "${owner_port:-0}" && echo yes || echo no) (tuổi ${age}s)"
  return 1
}

# ---- Hàng đợi ticket ----
# Tên ticket: <class>-<nanos>-<pid>-<thread>, class 0 = long, 1 = normal.
# Nanos 19 chữ số nên sort từ điển = sort theo thời gian tới.
ticket_field() { # $1 ticketdir, $2 key
  grep -E "^$2=" "$1/ticket" 2>/dev/null | head -1 | cut -d= -f2-
}

ticket_is_stale() { # $1 ticketdir -> 0 nếu ticket chết (chủ đã chết / boot đổi / quá già)
  local tdir="$1" tpid tboot tcreated now
  tpid=$(ticket_field "$tdir" pid)
  tboot=$(ticket_field "$tdir" boot)
  tcreated=$(ticket_field "$tdir" created)
  [ -n "$tpid" ] || { echo "ticket $tdir: không có pid"; return 0; }
  if [ -n "$tboot" ] && [ "$tboot" != "$(boot_id_now)" ]; then
    echo "ticket $tdir: boot đổi ($tboot != hiện tại)"; return 0
  fi
  if ! kill -0 "$tpid" 2>/dev/null; then
    echo "ticket $tdir: pid $tpid chết"; return 0
  fi
  now=$(date +%s)
  if [ -n "$tcreated" ] && [ $((now - tcreated)) -gt "${VITE_LOCK_TICKET_MAX_AGE_S:-7200}" ]; then
    echo "ticket $tdir: quá già ($((now - tcreated))s > max)"
    return 0
  fi
  return 1
}

prune_stale_tickets() { # dọn ticket chết; in lý do ra stdout khi có
  local d reason
  [ -d "$QUEUEDIR" ] || return 0
  for d in "$QUEUEDIR"/*/; do
    [ -d "$d" ] || continue
    if reason=$(ticket_is_stale "$d"); then
      echo "vite-lock-v2: dọn ticket chết ${d%/}: $reason"
      log_event "queue" "STALE-TICKET" "${d%/} $reason"
      rm -rf "$d"
    fi
  done
}

ticket_sort_key() { # $1 ticketdir -> khóa sort: <effclass>-<nanos>-<pid>
  # effclass 0 nếu prio=long hoặc đã chờ quá AGING_S (chống đói ngược).
  local name base cls ts pid rest rest2 prio created now eff
  name=$(basename "$1")
  base="${name#*-}"; cls="${name%%-*}"
  ts="${base%%-*}"; rest="${base#*-}"; pid="${rest%%-*}"
  prio=$(ticket_field "$1" prio)
  created=$(ticket_field "$1" created)
  now=$(date +%s)
  eff="$cls"
  if [ "$prio" = "long" ]; then eff=0; fi
  if [ -n "$created" ] && [ $((now - created)) -gt "${VITE_LOCK_AGING_S:-600}" ]; then eff=0; fi
  printf '%s-%s-%s' "$eff" "$ts" "$pid"
}

front_ticket() { # in tên ticket đứng đầu (sau khi dọn ticket chết), rỗng nếu không có
  local d best="" bestkey="" k
  prune_stale_tickets >/dev/null 2>&1
  [ -d "$QUEUEDIR" ] || return 0
  for d in "$QUEUEDIR"/*/; do
    [ -d "$d" ] || continue
    k=$(ticket_sort_key "$d")
    if [ -z "$best" ] || [ "$k" \< "$bestkey" ]; then best="$d"; bestkey="$k"; fi
  done
  [ -n "$best" ] && basename "$best"
}

queue_position() { # $1 ticketname -> vị trí 1-based trong hàng đợi (sau dọn)
  local d k mykey keys sorted i=1
  mykey=$(ticket_sort_key "$QUEUEDIR/$1" 2>/dev/null) || { echo "?"; return 0; }
  keys=""
  for d in "$QUEUEDIR"/*/; do
    [ -d "$d" ] || continue
    keys="$keys$(ticket_sort_key "$d")"$'\n'
  done
  sorted=$(printf '%s' "$keys" | sort)
  while IFS= read -r k; do
    [ -z "$k" ] && continue
    if [ "$k" = "$mykey" ]; then echo "$i"; return 0; fi
    i=$((i + 1))
  done <<EOF
$sorted
EOF
  echo "?"
}

take_ticket() { # $1 thread, $2 port, $3 prio -> in tên ticket, trả 0
  local thread="$1" port="$2" prio="$3" cls ts name tdir tmp
  case "$prio" in long) cls=0;; *) cls=1; prio="normal";; esac
  mkdir -p "$QUEUEDIR" || return 1
  ts=$(date +%s%N)
  name="${cls}-${ts}-$$-${thread}"
  tdir="$QUEUEDIR/$name"
  if ! mkdir "$tdir" 2>/dev/null; then
    # Trùng tên (cùng nanos + pid — praktisch không xảy ra): thử lại 1 lần.
    sleep 0.01; ts=$(date +%s%N); name="${cls}-${ts}-$$-${thread}"; tdir="$QUEUEDIR/$name"
    mkdir "$tdir" 2>/dev/null || return 1
  fi
  tmp="$tdir/.ticket.tmp.$$"
  {
    echo "thread=$thread"
    echo "pid=$$"
    echo "port=$port"
    echo "prio=$prio"
    echo "created=$(date +%s)"
    echo "boot=$(boot_id_now)"
  } > "$tmp" && mv "$tmp" "$tdir/ticket"
  echo "$name"
  return 0
}

drop_ticket() { # $1 ticketname
  [ -n "${1:-}" ] && rm -rf "$QUEUEDIR/$1"
}

cmd_acquire() { # $1 thread, $2 port, $3 timeout_s (def 1800), $4 stale_min (def 30), $5 owner_pid (def $PPID), $6 prio (def normal)
  local thread="$1" port="$2" timeout="${3:-1800}" stale_min="${4:-30}" owner_pid="${5:-$PPID}" prio="${6:-normal}"
  local waited=0 reason poll="${VITE_LOCK_POLL_S:-2}" ticket t0 pos cdfile last_print
  t0=$(date +%s)
  last_print=-60
  # Cooldown sau nhả (spec v1 §6, nay bắt buộc): thread vừa nhả lock phải chờ
  # đủ VITE_LOCK_REACQUIRE_DELAY_S trước khi giữ lại. Ghi epoch MILI-GIÂY
  # (vá đợt 115 R4: bản cũ ghi `date +%s` giây nguyên — release và acquire
  # lệch nhau qua biên giây làm remain hụt tới ~1 s, test T6 flaky 2/6 lần
  # 2080/2129 ms < 2500 ms; file cũ dạng giây vẫn đọc được nhờ chuẩn hoá dưới).
  cdfile="$QUEUEDIR/cooldown-$thread"
  if [ -f "$cdfile" ]; then
    cd_ms=$(cat "$cdfile" 2>/dev/null || echo 0)
    case "$cd_ms" in ''|*[!0-9]*) cd_ms=0;; esac
    # File cooldown cũ (đợt 114) ghi giây (10 chữ số): đổi sang ms.
    if [ "$cd_ms" -lt 100000000000 ]; then cd_ms=$((cd_ms * 1000)); fi
    remain_ms=$(( ${VITE_LOCK_REACQUIRE_DELAY_S:-15} * 1000 - ($(date +%s%3N) - cd_ms) ))
    if [ "$remain_ms" -gt 0 ]; then
      if [ "$remain_ms" -gt $((timeout * 1000)) ]; then
        echo "vite-lock-v2: cooldown còn ${remain_ms}ms > timeout ${timeout}s — BỎ"
        log_event "$thread" "TIMEOUT" "cooldown ${remain_ms}ms > timeout ${timeout}s port=$port prio=$prio"
        return 1
      fi
      echo "vite-lock-v2: cooldown sau nhả, chờ ${remain_ms}ms trước khi lấy ticket"
      log_event "$thread" "COOLDOWN" "wait ${remain_ms}ms port=$port"
      sleep "$((remain_ms / 1000)).$(printf %03d $((remain_ms % 1000)))"
      # KHÔNG cộng vào `waited`: t0 đặt TRƯỚC khối cooldown nên waited
      # tính từ wall-clock (vá đợt 115 R4, xem dưới) đã bao gồm thời gian này.
    fi
  fi
  ticket=$(take_ticket "$thread" "$port" "$prio") || { echo "vite-lock-v2: KHÔNG lấy được ticket"; return 1; }
  log_event "$thread" "TICKET" "ticket=$ticket port=$port prio=$prio"
  echo "vite-lock-v2: đã lấy ticket $ticket (prio=$prio)"
  # Nếu tiến trình acquire bị kill, ticket sẽ được dọn như stale (pid chết).
  # `waited` tính từ WALL-CLOCK (vá đợt 115 R4): bản cũ cộng dồn poll-sleep
  # (`sleep $poll; waited+=poll`) nên dưới tải cao mỗi vòng lặp tốn thêm
  # ~0,8–1,1 s chạy front_ticket/lock_is_stale mà không được đếm — timeout
  # danh nghĩa 900 s thực tế chờ ~1205 s tường (giãn 1,34×, attempt 1 pilot
  # đợt này: ticket 18:01:32Z, TIMEOUT nổ 18:21:36Z, log ghi waited=900s
  # trong khi tường là 1204 s). Lỗi này KẾ THỪA từ v1 (dòng tương tự trong
  # bản frozen) — v1 đóng băng nên không sửa; v2 sửa tại đây. In trạng thái
  # theo mốc 60 s tường (last_print) thay vì `waited % 60` vì với wall-clock
  # waited có thể nhảy qua bội số của 60 giữa 2 vòng lặp.
  while true; do
    waited=$(( $(date +%s) - t0 ))
    # Chỉ ticket đầu hàng đợi mới được thử mkdir lock.
    if [ "$(front_ticket)" = "$ticket" ] && [ ! -d "$LOCKDIR" ]; then
      if mkdir "$LOCKDIR" 2>/dev/null; then
        local tmp="$LOCKDIR/.owner.tmp.$$"
        {
          echo "thread=$thread"
          echo "pid=$owner_pid"
          echo "port=$port"
          echo "ticket=$ticket"
          echo "started=$(date -u +%FT%TZ)"
          echo "boot=$(boot_id_now)"
        } > "$tmp" && mv "$tmp" "$LOCKDIR/owner"
        drop_ticket "$ticket"
        local wait_s=$(( $(date +%s) - t0 ))
        echo "vite-lock-v2: ĐÃ GIỮ (thread=$thread port=$port owner_pid=$owner_pid, chờ ${wait_s}s, ticket $ticket)"
        log_event "$thread" "ACQUIRED" "port=$port wait_s=$wait_s ticket=$ticket"
        return 0
      fi
      # Thua race mkdir (ai đó vừa mkdir trước — chỉ xảy ra nếu ticket đầu
      # đổi giữa chừng hoặc lock stale vừa bị dọn): vòng sau kiểm tra lại.
    fi
    if [ -d "$LOCKDIR" ] && reason=$(lock_is_stale "$stale_min"); then
      echo "vite-lock-v2: $reason — XÓA lock stale và thử lại"
      log_event "$thread" "STALE-LOCK" "$reason"
      rm -rf "$LOCKDIR"
      continue
    fi
    if [ "$waited" -ge "$timeout" ]; then
      echo "vite-lock-v2: HẾT ${timeout}s vẫn chưa tới lượt (owner: $(cat "$LOCKDIR/owner" 2>/dev/null | tr '\n' ' ' || echo '(trống)'), ticket $ticket) — BỎ, nhả ticket"
      log_event "$thread" "TIMEOUT" "waited=${waited}s port=$port prio=$prio ticket=$ticket"
      drop_ticket "$ticket"
      return 1
    fi
    if [ $((waited - last_print)) -ge 60 ]; then
      pos=$(queue_position "$ticket")
      echo "vite-lock-v2: chờ lượt (vị trí hàng đợi: $pos, owner: $(cat "$LOCKDIR/owner" 2>/dev/null | tr '\n' ' ' || echo '(trống)'), đã chờ ${waited}s)"
      last_print=$waited
    fi
    sleep "$poll"
  done
}

cmd_release() { # $1 thread
  local thread="$1" owner_thread started now hold_s
  owner_thread=$(owner_field thread)
  if [ "$owner_thread" != "$thread" ]; then
    # T6 round120: chỉ đổi TEXT thông báo, KHÔNG đổi logic guard/rc.
    # Phân biệt 2 trường hợp (trước đây chung 1 câu "owner hiện tại là '?'" gây
    # hiểu lầm, xem docs/PHASE9_ROUND119_T9_LOCKV2_LIMITS.md §2):
    # (a) owner rỗng = lock đã trống — release thừa vô hại (cleanup gọi lại
    # sau khi đã nhả); KHÔNG phải lỗi, KHÔNG phải lock kẹt, không cần can thiệp.
    # (b) owner là thread khác thật = từ chối nhả lock của người khác.
    if [ -z "$owner_thread" ]; then
      echo "vite-lock-v2: BỎ QUA release thừa — lock đã trống (không còn owner; '$thread' đã nhả rồi hoặc chưa từng giữ). KHÔNG phải lỗi, KHÔNG phải lock kẹt, không cần can thiệp"
    else
      echo "vite-lock-v2: KHÔNG NHẢ — lock đang do '$owner_thread' giữ, không phải '$thread' (bảo vệ lock của người khác)"
    fi
    return 1
  fi
  started=$(owner_field started)
  # ĐỢT 135 T6 — ĐỔI THỨ TỰ GHI LOG RELEASED / COOLDOWN (quyết parent
  # đợt 134 §12.3(b), sửa F-134-T6-2): log RELEASED TRƯỚC, ghi file
  # cooldown SAU. Thứ tự cũ (cooldown trước, log sau) để lại cửa sổ
  # nhiều bước giữa hai lần ghi — reboot cắt ngang đúng cửa sổ đó
  # (đợt 134, t4 23:50:17Z) làm mất dòng RELEASED, log giữ mãi 1
  # ACQUIRED không cặp dù dir đã sạch. Với thứ tự mới, một lần cắt
  # ngang giữa hai bước chỉ mất file cooldown (mục prune, mất không
  # hại — thread sau tự ghi lại ở lần nhả kế; acquire khác không bị
  # chặn), KHÔNG để lại ACQUIRED không cặp. hold_s tính TRƯỚC khi
  # rmdir để log_event chạy ngay sau rmdir. Cửa sổ còn lại (rmdir →
  # log_event, một lần append duy nhất) không xóa được nếu không có
  # journal — ghi nhận trung thực, xem LIMITS đợt 135 §3.2. Không đổi
  # gì khác trong logic lock (guard, rc, cooldown 15 s, trap).
  now=$(date +%s)
  hold_s="?"
  if [ -n "$started" ]; then
    hold_s=$(( now - $(date -d "$started" +%s 2>/dev/null || echo "$now") ))
  fi
  rm -f "$LOCKDIR/owner" && rmdir "$LOCKDIR" 2>/dev/null
  log_event "$thread" "RELEASED" "hold_s=$hold_s"
  mkdir -p "$QUEUEDIR" 2>/dev/null || true
  date +%s%3N > "$QUEUEDIR/cooldown-$thread" 2>/dev/null || true
  echo "vite-lock-v2: ĐÃ NHẢ (thread=$thread $(date -u +%FT%TZ), giữ ${hold_s}s)"
  return 0
}

cmd_status() {
  if [ ! -d "$LOCKDIR" ]; then echo "vite-lock-v2: TRỐNG (không có lock)"; else
    echo "vite-lock-v2: dir tồn tại, tuổi $(lock_age_s)s"
    if [ -f "$LOCKDIR/owner" ]; then cat "$LOCKDIR/owner"; else echo "owner: (KHÔNG CÓ FILE OWNER — dir trống như vụ L4)"; fi
    local port
    port=$(owner_field port)
    if [ -n "$port" ]; then
      echo "vite node trên cổng $port: $(vite_node_pid "$port" 2>/dev/null || echo none)"
      echo "curl cổng $port: $(port_serving "$port" && echo SERVING || echo 000)"
    fi
    echo "vite bất kỳ đang chạy: $(vite_any_running || echo none)"
  fi
  # Đếm CHỈ thư mục ticket ([01]-*); bản cũ đếm mọi entry trong QUEUEDIR nên
  # file cooldown cũng bị tính là ticket (vá đợt 115 R4: sau pilot, status
  # báo "(1 ticket)" trong khi queue trống — thực ra chỉ có 1 file cooldown).
  local nticket ncd
  nticket=$(( $(ls -d "$QUEUEDIR"/[01]-* 2>/dev/null | wc -l) ))
  ncd=$(( $(ls "$QUEUEDIR"/cooldown-* 2>/dev/null | wc -l) ))
  if [ "$ncd" -gt 0 ]; then
    echo "vite-lock-v2: hàng đợi: $(front_ticket | sed 's/^/đầu=/;s/$//') (${nticket} ticket + ${ncd} cooldown)"
  else
    echo "vite-lock-v2: hàng đợi: $(front_ticket | sed 's/^/đầu=/;s/$//') (${nticket} ticket)"
  fi
  return 0
}

cmd_queue() {
  local d
  [ -d "$QUEUEDIR" ] || { echo "(hàng đợi trống)"; return 0; }
  for d in "$QUEUEDIR"/*/; do
    [ -d "$d" ] || continue
    echo "$(basename "$d") key=$(ticket_sort_key "$d") thread=$(ticket_field "$d" thread) pid=$(ticket_field "$d" pid) prio=$(ticket_field "$d" prio) created=$(ticket_field "$d" created)"
  done
  return 0
}

cmd_kill_vite() { # $1 port — như v1: kill pid node thật, kiểm ps + curl sau kill
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

# run-attempt: acquire -> chạy đúng 1 attempt -> nhả trong trap (luôn luôn,
# kể cả attempt fail hay bị signal). Dial-wait PHẢI ở ngoài lệnh này.
# Dùng: run-attempt <thread> <port> [timeout_s] [stale_min] [prio] -- <cmd...>
cmd_run_attempt() {
  local thread="$1" port="$2" timeout="${3:-1800}" stale_min="${4:-30}" prio="${5:-normal}"
  shift 5
  [ "${1:-}" = "--" ] || { echo "dùng: $0 run-attempt <thread> <port> [timeout_s] [stale_min] [prio] -- <cmd...>"; return 2; }
  shift
  [ $# -ge 1 ] || { echo "run-attempt: thiếu lệnh attempt"; return 2; }
  # owner_pid = $$ của chính helper (còn sống suốt attempt vì nó chạy cmd con).
  if ! cmd_acquire "$thread" "$port" "$timeout" "$stale_min" "$$" "$prio"; then
    echo "run-attempt: KHÔNG lấy được lock — attempt không chạy"
    return 3
  fi
  local rc=0
  # trap nhả lock khi helper thoát vì bất kỳ lý do gì (kể cả SIGTERM/SIGINT).
  trap 'cmd_release "$thread" >/dev/null 2>&1 || true' EXIT TERM INT
  "$@"
  rc=$?
  trap - EXIT TERM INT
  cmd_release "$thread" || true
  return $rc
}

# Có thể source file này để dùng hàm trong script khác.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    acquire)   [ $# -ge 3 ] || { echo "dùng: $0 acquire <thread> <port> [timeout_s] [stale_min] [owner_pid] [prio]"; exit 2; }; cmd_acquire "$2" "$3" "${4:-1800}" "${5:-30}" "${6:-$PPID}" "${7:-normal}";;
    release)   [ $# -ge 2 ] || { echo "dùng: $0 release <thread>"; exit 2; }; cmd_release "$2";;
    status)    cmd_status;;
    queue)     cmd_queue;;
    kill-vite) [ $# -ge 2 ] || { echo "dùng: $0 kill-vite <port>"; exit 2; }; cmd_kill_vite "$2";;
    vite-node-pid) [ $# -ge 2 ] || { echo "dùng: $0 vite-node-pid <port>"; exit 2; }; vite_node_pid "$2";;
    run-attempt) [ $# -ge 3 ] || { echo "dùng: $0 run-attempt <thread> <port> [timeout_s] [stale_min] [prio] -- <cmd...>"; exit 2; }; cmd_run_attempt "$2" "$3" "${4:-1800}" "${5:-30}" "${6:-normal}" "${@:7}";;
    *) echo "dùng: $0 {acquire|release|status|queue|kill-vite|vite-node-pid|run-attempt} ..."; exit 2;;
  esac
fi

# ---- MẪU DRIVER ĐÚNG (dial-wait NGOÀI vùng giữ lock) ----
#   # 1. Dial tải TRƯỚC khi đụng lock (không giữ gì cả):
#   dial_load "$tag" 15 30          # hog + chờ load1 vào [15,30], ~300 s
#   # 2. Mỗi attempt giữ lock đúng lúc chạy probe, nhả ngay sau đó:
#   bash vcut-vite-lock-v2.sh run-attempt p1-long 5591 900 30 long -- \
#     node probe.mjs --engine chromium --tag s76 --nclips 70
#   # 3. Attempt tiếp theo (retry / lượt khác) lấy ticket MỚI — nếu có
#   #    waiter khác đã xếp hàng trước, họ được chạy trước. Muốn chạy
#   #    nhiều attempt nối tiếp mà không chen ngang ai: chỉ gọi run-attempt
#   #    khi `queue` trống, hoặc chấp nhận xếp hàng lại.
#   # SAI (mẫu P1 đợt 113 — đừng lặp lại):
#   #   acquire; dial_load ...; probe f1; probe f2; probe f3; release
#   #   ^ giữ lock ~35 phút trong lúc chờ tải -> waiter khác đói lock.
