#!/bin/bash
# vcut-poll-quiet-v2.sh — poll cửa yên trước lượt đo (đợt 114 Q4).
#
# Vá nợ §10.12c đợt 113: poll-p4.sh vẫn mang pattern trần `WebProcess`
# (chỉ được `grep -v "grep -E"` bảo vệ — mong manh: chỉ cần đổi pipeline
# là grep tự đếm chính nó). Mẫu đúng theo M5/L7 đã vá (đợt 113 P7/P8
# verify 0 dòng tự khớp): dùng `[W]ebProcess` — regex khớp chuỗi
# "WebProcess" nhưng dòng lệnh của chính grep chứa "[W]ebProcess" (có
# dấu ngoặc) nên KHÔNG tự khớp — cộng thêm `grep -v` tên script này và
# `grep -v grep` làm lớp phòng ngừa thứ hai.
#
# Gate (lúc BẮT ĐẦU lượt): load1 < 2 VÀ load5 < 2 VÀ không có vite.lock VÀ
# không process vite/probe/browser nào của luồng khác.
# Vá đợt 115 R4: `lock=` lấy từ file owner nhiều dòng — `head -c 60` giữ
# nguyên ký tự xuống dòng làm vỡ dòng log `poll N ...` (blockers rơi xuống
# dòng riêng, test T7 không grep được → B1/B2 rỗng khi có luồng khác đang
# giữ lock; tái hiện 5/5 lúc r2 giữ lock). Nay `tr '\n' ' '` trước khi cắt.
# Poll mỗi 60 s, tối đa MAXPOLL phút (mặc định 30). Exit 0 = có cửa;
# exit 1 = hết giờ. `--once`: chỉ kiểm tra 1 lần (dùng cho test).
# KHÔNG push/tag. Không sửa production.
set -u
SELF="$(basename "$0")"
H=~/workspace/goals/capcut-clone-video-editor/hidden_files
W="${POLL_LOG_DIR:-$H/round114-q4}"
MAXPOLL="${1:-30}"
ONCE=0
[ "${2:-}" = "--once" ] || [ "${1:-}" = "--once" ] && ONCE=1
[ "$ONCE" = 1 ] && MAXPOLL=1
mkdir -p "$W" 2>/dev/null || true
LOG="$W/poll-quiet-v2.log"

count_blockers() {
  # Mẫu đã vá: [v]ite, [p]robe*.mjs, [M]iniBrowser, [w]ebkit, [W]ebProcess —
  # mọi alternative đều bracket chữ đầu nên grep không tự khớp chính nó.
  # Lớp phòng ngừa: loại dòng chứa tên script này + dòng grep.
  ps -eo args \
    | grep -E "[v]ite|[p]robe.*\.mjs|[M]iniBrowser|[w]ebkit|[W]ebProcess" \
    | grep -v "grep" \
    | grep -v "$SELF" \
    | wc -l
}

for i in $(seq 1 "$MAXPOLL"); do
  L1=$(awk '{print $1}' /proc/loadavg); L5=$(awk '{print $2}' /proc/loadavg)
  LOCK="khong"; [ -d "$H/vite.lock" ] && LOCK="co:$(cat "$H/vite.lock/owner" 2>/dev/null | tr '\n' ' ' | head -c 60)"
  BLOCKERS=$(count_blockers)
  echo "poll $i $(date -u +%FT%TZ) load1=$L1 load5=$L5 lock=$LOCK blockers=$BLOCKERS" | tee -a "$LOG"
  OK1=$(awk -v a="$L1" 'BEGIN{print (a<2)?1:0}')
  OK5=$(awk -v a="$L5" 'BEGIN{print (a<2)?1:0}')
  if [ "$OK1" = 1 ] && [ "$OK5" = 1 ] && [ ! -d "$H/vite.lock" ] && [ "$BLOCKERS" = 0 ]; then
    echo "CUA YEN MO poll $i" | tee -a "$LOG"
    exit 0
  fi
  [ "$ONCE" = 1 ] && { echo "KHONG YEN (once): blockers=$BLOCKERS lock=$LOCK" | tee -a "$LOG"; exit 1; }
  sleep 60
done
echo "HET $MAXPOLL PHUT KHONG CO CUA YEN" | tee -a "$LOG"
exit 1
