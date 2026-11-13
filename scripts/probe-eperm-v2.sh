#!/bin/bash
# probe-eperm-v2.sh — EPERM probe bền hơn (đợt 88 P8).
#
# Vấn đề của probe v1 (K8/L6/M5/N8/O10): MỘT tiến trình nền duy nhất
# (setsid + nohup, spawn từ phiên subagent) là observer duy nhất.
# Nó chết lặng 5 lần liên tiếp (K8 sau #5, L6 sau #10, M5 sau #11,
# N8 sau #5, O10 sau #9 — đều không có dòng "probe end", đều TRƯỚC
# lần reboot kế tiếp 30–70 phút), để lại khoảng mù không có quan sát
# (vd 03:19Z–05:53Z). Không có systemd user bus trong VM này nên
# không làm được user service; không tạo cron mới trong luồng này
# (quyền của parent) — xem LIMITS đợt 88 P8 §5.
#
# Thiết kế v2: KHÔNG phụ thuộc tiến trình nền nào sống giữa các lượt.
# - "once": 1 lần đo, append log + fsync + cập nhật heartbeat (tmp+rename).
#   Mọi lượt vòng lặp (3h/lượt) chạy `once` + `status` => tối thiểu 1 mẫu/lượt,
#   cộng thêm vòng lặp foreground trong lúc lượt đang chạy.
# - "loop N [giây]": chạy "once" N lần, foreground — chạy trong phiên
#   agent đang sống; mẫu đã fsync ngay nên chết giữa chừng cũng không mất mẫu.
# - "status": đọc heartbeat + log cuối, báo ALIVE/STALE/DEAD — cái chết
#   của probe trở thành DỮ LIỆU (dòng "probe DEAD" trong log) thay vì im lặng.
# - Boot marker: boot_id (/proc/sys/kernel/random/boot_id) đổi => ghi
#   "boot changed" — phân biệt chết do reboot với chết do bị dọn phiên.
#
# Cách dùng (từ repo root hoặc bất kỳ đâu):
#   bash scripts/probe-eperm-v2.sh once            # 1 mẫu, exit 0 (kể cả khi fail 1/2 đích — fail là dữ liệu, không phải lỗi chạy)
#   bash scripts/probe-eperm-v2.sh loop 16 600     # 16 lần × 10 phút, foreground
#   bash scripts/probe-eperm-v2.sh status          # exit 0 ALIVE, 1 STALE/DEAD, 2 chưa chạy bao giờ
#
# Biến môi trường (cho test): EPERM_PROBE_LOG, EPERM_PROBE_HEARTBEAT,
# EPERM_PROBE_TMPD, EPERM_PROBE_WSD.
set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HF="$HOME/workspace/goals/capcut-clone-video-editor/hidden_files"
LOG="${EPERM_PROBE_LOG:-$HF/eperm-probe-v2.log}"
HEARTBEAT="${EPERM_PROBE_HEARTBEAT:-$HF/eperm-probe-v2.heartbeat}"
TMPD="${EPERM_PROBE_TMPD:-/tmp/eperm-probe-v2}"
WSD="${EPERM_PROBE_WSD:-$REPO_ROOT/.eperm-probe-v2}"
SIZE=5000
STALE_SEC=900   # heartbeat quá 15 phút => STALE/DEAD

boot_id() { cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo "nobootid"; }
boot_short() { boot_id | cut -c1-8; }

# Append 1 dòng vào log + fsync + verify log tăng đúng số byte.
# Trả 0 nếu ghi được, 2 nếu ghi log thất bại (bản thân log cũng có thể là nạn nhân EPERM).
log_line() {
  local line="$1" before after expect
  mkdir -p "$(dirname "$LOG")" 2>/dev/null
  # Xoay log khi > 1 MiB (giữ 1 bản .1) — tránh log phình vô hạn qua nhiều tháng.
  if [ -f "$LOG" ] && [ "$(stat -c%s "$LOG" 2>/dev/null || echo 0)" -gt 1048576 ]; then
    mv -f "$LOG" "$LOG.1" 2>/dev/null
    echo "$(date -u +%FT%TZ) log rotated (prev >1MiB, kept .1)" >> "$LOG"
  fi
  before=$(stat -c%s "$LOG" 2>/dev/null || echo 0)
  expect=$((${#line} + 1))
  printf '%s\n' "$line" >> "$LOG" 2>/dev/null || { echo "probe-eperm-v2: cannot append to $LOG" >&2; return 2; }
  sync "$LOG" 2>/dev/null || sync 2>/dev/null
  after=$(stat -c%s "$LOG" 2>/dev/null || echo 0)
  if [ "$after" -lt $((before + expect)) ]; then
    echo "probe-eperm-v2: log append verify FAIL (before=$before after=$after expect+=$expect) — log write may be a silent 0-byte victim" >&2
    return 2
  fi
  return 0
}

# Cập nhật heartbeat nguyên tử (tmp+rename) + fsync file và thư mục chứa.
update_heartbeat() {
  local n="$1" ts="$2" tmp
  mkdir -p "$(dirname "$HEARTBEAT")" 2>/dev/null
  tmp="$HEARTBEAT.tmp.$$"
  printf 'pid=%s\nts=%s\nboot=%s\nn=%s\n' "$$" "$ts" "$(boot_id)" "$n" > "$tmp" 2>/dev/null || return 1
  mv -f "$tmp" "$HEARTBEAT" 2>/dev/null || return 1
  sync "$HEARTBEAT" 2>/dev/null; sync "$(dirname "$HEARTBEAT")" 2>/dev/null || true
  return 0
}

last_n() {
  local n=0
  if [ -f "$HEARTBEAT" ]; then n=$(grep -E '^n=' "$HEARTBEAT" 2>/dev/null | cut -d= -f2 | tr -dc '0-9'); fi
  echo "${n:-0}"
}

cmd_once() {
  local ts n boot prev_boot ok fail detail dest sz
  ts=$(date -u +%FT%TZ)
  n=$(( $(last_n) + 1 ))
  boot=$(boot_short)
  # Phát hiện reboot: boot_id trong heartbeat khác boot hiện tại.
  prev_boot=""
  if [ -f "$HEARTBEAT" ]; then prev_boot=$(grep -E '^boot=' "$HEARTBEAT" 2>/dev/null | cut -d= -f2 | cut -c1-8); fi
  if [ -n "$prev_boot" ] && [ "$prev_boot" != "$boot" ] && [ "$prev_boot" != "nobootid" ]; then
    log_line "=== boot changed $prev_boot -> $boot (reboot detected, uptime since $(uptime -s 2>/dev/null || echo ?) ) ===" || return 2
  fi
  mkdir -p "$TMPD" "$WSD" 2>/dev/null
  ok=0; fail=0; detail=""
  for dest in "$TMPD/p.bin" "$WSD/p.bin"; do
    head -c "$SIZE" /dev/zero > "$dest" 2>/dev/null
    sz=$(stat -c%s "$dest" 2>/dev/null || echo -1)
    if [ "$sz" = "$SIZE" ]; then ok=$((ok+1)); else fail=$((fail+1)); detail="$detail $dest=$sz"; fi
    rm -f "$dest"
  done
  if ! log_line "$ts probe#$n boot=$boot tmp+ws ok=$ok fail=$fail$detail"; then return 2; fi
  update_heartbeat "$n" "$ts" || echo "probe-eperm-v2: heartbeat update failed (probe sample already logged)" >&2
  echo "probe#$n boot=$boot ok=$ok fail=$fail$detail"
  return 0
}

cmd_status() {
  local hb_ts hb_boot hb_n now age last_sample last_start ended
  if [ ! -f "$HEARTBEAT" ]; then echo "NEVER-RUN: no heartbeat file ($HEARTBEAT)"; return 2; fi
  hb_ts=$(grep -E '^ts=' "$HEARTBEAT" 2>/dev/null | cut -d= -f2)
  hb_boot=$(grep -E '^boot=' "$HEARTBEAT" 2>/dev/null | cut -d= -f2 | cut -c1-8)
  hb_n=$(grep -E '^n=' "$HEARTBEAT" 2>/dev/null | cut -d= -f2)
  now=$(date -u +%s)
  age=$(( now - $(date -u -d "$hb_ts" +%s 2>/dev/null || echo "$now") ))
  last_sample=$(grep -E ' probe#' "$LOG" 2>/dev/null | tail -1)
  last_start=$(grep -E '=== probe start' "$LOG" 2>/dev/null | tail -1)
  ended=$(grep -E '=== probe end' "$LOG" 2>/dev/null | tail -1)
  echo "heartbeat: n=$hb_n ts=$hb_ts boot=$hb_boot age=${age}s"
  echo "last sample: ${last_sample:-none}"
  echo "last start: ${last_start:-none} | last end: ${ended:-none}"
  if [ "$age" -le "$STALE_SEC" ]; then
    echo "ALIVE: heartbeat fresh (<= ${STALE_SEC}s)"
    return 0
  fi
  # Heartbeat cũ: ghi dòng DEAD vào log để khoảng trống thành dữ liệu, không còn im lặng.
  # Chỉ ghi 1 lần cho mỗi cái chết (dòng cuối chưa phải DEAD của cùng heartbeat này).
  if ! tail -1 "$LOG" 2>/dev/null | grep -q "probe DEAD detected by status (last #${hb_n} at ${hb_ts}"; then
    log_line "$(date -u +%FT%TZ) probe DEAD detected by status (last #${hb_n} at ${hb_ts}, age ${age}s, no probe end since last start)" 2>/dev/null
  fi
  echo "DEAD/STALE: heartbeat age ${age}s > ${STALE_SEC}s — last probe #${hb_n} at ${hb_ts}; death recorded in log"
  return 1
}

cmd_loop() {
  local count="${1:-16}" interval="${2:-600}" i
  log_line "=== probe start $(date -u +%FT%TZ) pid=$$ count=$count interval=${interval}s ===" || return 2
  for i in $(seq 1 "$count"); do
    cmd_once || echo "probe-eperm-v2: once #$i failed (see stderr), continuing loop" >&2
    [ "$i" -lt "$count" ] && sleep "$interval"
  done
  log_line "=== probe end $(date -u +%FT%TZ) pid=$$ ===" || return 2
  echo "=== probe end $(date -u +%FT%TZ) ==="
  return 0
}

case "${1:-}" in
  once)   cmd_once; exit $? ;;
  status) cmd_status; exit $? ;;
  loop)   cmd_loop "${2:-16}" "${3:-600}"; exit $? ;;
  *) echo "usage: $0 {once|loop [N] [interval-sec]|status}" >&2; exit 2 ;;
esac
