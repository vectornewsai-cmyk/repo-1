#!/bin/bash
# test-vite-lock-v2.sh — test độc lập helper vcut-vite-lock-v2.sh (đợt 114 Q4).
#
# KHÔNG cần vite thật, KHÔNG đụng lock thật của luồng khác: mọi test dùng
# VITE_LOCK_DIR / VITE_LOCK_QUEUE_DIR / VITE_LOCK_LOG tạm dưới /tmp, cổng
# 599x (không có gì phục vụ). Chạy: bash test-vite-lock-v2.sh
# In PASS/FAIL từng case; exit 0 khi tất cả xanh, 1 khi có case đỏ.
# KHÔNG push/tag. Không sửa production.
set -u
H="$(cd "$(dirname "$0")" && pwd)/vcut-vite-lock-v2.sh"
POLL="$(cd "$(dirname "$0")" && pwd)/vcut-poll-quiet-v2.sh"
TDIR=$(mktemp -d /tmp/vcut-lock-v2-test.XXXXXX)
export VITE_LOCK_DIR="$TDIR/vite.lock"
export VITE_LOCK_QUEUE_DIR="$TDIR/vite.lock.queue"
export VITE_LOCK_LOG="$TDIR/vite-lock-v2.log"
export VITE_LOCK_POLL_S=1
export VITE_LOCK_REACQUIRE_DELAY_S=0
export VITE_LOCK_AGING_S=3600
export POLL_LOG_DIR="$TDIR"
PASS=0; FAIL=0
trap 'rm -rf "$TDIR"' EXIT

ok()   { echo "PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "FAIL: $1"; FAIL=$((FAIL+1)); }
# line_no <file> <pattern>: số dòng đầu tiên khớp pattern (0 nếu không có)
line_no() { grep -n -m1 "$2" "$1" 2>/dev/null | cut -d: -f1; }
acq_line() { line_no "$VITE_LOCK_LOG" "^[^ ]* $1 ACQUIRED"; }
rel_line() { line_no "$VITE_LOCK_LOG" "^[^ ]* $1 RELEASED"; }

echo "== test-vite-lock-v2: H=$H TDIR=$TDIR =="
bash -n "$H" || { echo "FAIL: syntax vcut-vite-lock-v2.sh"; exit 1; }
bash -n "$POLL" || { echo "FAIL: syntax vcut-poll-quiet-v2.sh"; exit 1; }
echo "PASS: syntax OK (bash -n cả 2 script)"; PASS=$((PASS+1))

# ---- T1: FIFO — 2 contender, A trước B, B chỉ giữ sau khi A nhả ----
echo "--- T1 FIFO ---"
: > "$VITE_LOCK_LOG"
( bash "$H" acquire tA 5991 60 0 $$ && sleep 3 && bash "$H" release tA ) &
PIDA=$!
sleep 1
( bash "$H" acquire tB 5991 60 0 $$ && sleep 1 && bash "$H" release tB ) &
PIDB=$!
wait $PIDA; RCA=$?
wait $PIDB; RCB=$?
LA=$(acq_line tA); LB=$(acq_line tB); RA=$(rel_line tA)
echo "  tA acquired dòng $LA, tA released dòng $RA, tB acquired dòng $LB (rcA=$RCA rcB=$RCB)"
if [ "$RCA" = 0 ] && [ "$RCB" = 0 ] && [ -n "$LA" ] && [ -n "$LB" ] && [ -n "$RA" ] \
   && [ "$LA" -lt "$RA" ] && [ "$RA" -lt "$LB" ]; then
  ok "T1 FIFO: A giữ trước, B chỉ giữ sau khi A nhả (dòng $LA < $RA < $LB)"
else bad "T1 FIFO: thứ tự sai hoặc acquire lỗi"; fi

# ---- T2: priority — lượt dài (long) tới SAU vẫn vượt lượt ngắn đang chờ ----
echo "--- T2 priority LONG-RUN ---"
: > "$VITE_LOCK_LOG"
( bash "$H" acquire tH2 5992 60 0 $$ && sleep 4 && bash "$H" release tH2 ) &
PIDH=$!
sleep 1
( bash "$H" acquire tN 5992 60 0 $$ normal && sleep 1 && bash "$H" release tN ) &
PIDN=$!
sleep 1
( bash "$H" acquire tL 5992 60 0 $$ long && sleep 1 && bash "$H" release tL ) &
PIDL=$!
wait $PIDH; RCH=$?
wait $PIDN; RCN=$?
wait $PIDL; RCL=$?
LN=$(acq_line tN); LL=$(acq_line tL)
echo "  tL(long, tới sau) acquired dòng $LL, tN(normal, tới trước) acquired dòng $LN (rcH=$RCH rcN=$RCN rcL=$RCL)"
if [ "$RCH" = 0 ] && [ "$RCN" = 0 ] && [ "$RCL" = 0 ] && [ -n "$LN" ] && [ -n "$LL" ] && [ "$LL" -lt "$LN" ]; then
  ok "T2 priority: lượt dài tới sau vẫn giữ trước lượt ngắn (dòng $LL < $LN)"
else bad "T2 priority: lượt dài không vượt được lượt ngắn"; fi

# ---- T3: stale lock — holder chết giả lập (pid không tồn tại, cổng 000, đủ tuổi) ----
echo "--- T3 stale-lock recovery ---"
: > "$VITE_LOCK_LOG"
mkdir -p "$VITE_LOCK_DIR"
{
  echo "thread=ghost"; echo "pid=999999"; echo "port=5993"
  echo "started=2026-01-01T00:00:00Z"; echo "boot=$(cat /proc/sys/kernel/random/boot_id)"
} > "$VITE_LOCK_DIR/owner"
touch -d "40 minutes ago" "$VITE_LOCK_DIR"
S0=$(date +%s%N)
bash "$H" acquire tS 5993 30 30 $$; RCS=$?
S1=$(date +%s%N)
ELAPSED_MS=$(( (S1 - S0) / 1000000 ))
bash "$H" release tS >/dev/null 2>&1 || true
if [ "$RCS" = 0 ] && grep -q "STALE-LOCK" "$VITE_LOCK_LOG" && [ "$ELAPSED_MS" -lt 20000 ]; then
  ok "T3 stale-lock: holder chết được dọn + giữ lại sau ${ELAPSED_MS}ms (log có STALE-LOCK)"
else bad "T3 stale-lock: rc=$RCS elapsed=${ELAPSED_MS}ms, log: $(grep STALE-LOCK "$VITE_LOCK_LOG" || echo '(không có STALE-LOCK)')"; fi

# ---- T4: stale ticket — ticket của tiến trình chết bị dọn, acquire vẫn chạy ----
echo "--- T4 stale-ticket prune ---"
: > "$VITE_LOCK_LOG"
mkdir -p "$VITE_LOCK_QUEUE_DIR"
GT="$VITE_LOCK_QUEUE_DIR/1-1000000000000000000-999999-ghost"
mkdir -p "$GT"
{
  echo "thread=ghost"; echo "pid=999999"; echo "port=5994"
  echo "prio=normal"; echo "created=$(date +%s)"; echo "boot=$(cat /proc/sys/kernel/random/boot_id)"
} > "$GT/ticket"
bash "$H" acquire tT 5994 30 0 $$; RCT=$?
bash "$H" release tT >/dev/null 2>&1 || true
if [ "$RCT" = 0 ] && [ ! -d "$GT" ]; then
  ok "T4 stale-ticket: ticket chết bị dọn, acquire thành công"
else bad "T4 stale-ticket: rc=$RCT ghost còn tồn tại=$([ -d "$GT" ] && echo yes || echo no)"; fi

# ---- T5: release-between-attempts — waiter chen vào giữa 2 attempt ----
echo "--- T5 release-between-attempts ---"
: > "$VITE_LOCK_LOG"
( bash "$H" run-attempt tH 5995 60 0 normal -- sleep 2
  bash "$H" run-attempt tH 5995 60 0 normal -- sleep 1 ) &
PIDH5=$!
sleep 1
( bash "$H" acquire tW 5995 60 0 $$ && sleep 1 && bash "$H" release tW ) &
PIDW=$!
wait $PIDH5; RCH5=$?
wait $PIDW; RCW=$?
# tH acquire 2 lần: dòng ACQUIRED thứ 1 và thứ 2; tW phải xen giữa.
H1=$(grep -n "^[^ ]* tH ACQUIRED" "$VITE_LOCK_LOG" | head -1 | cut -d: -f1)
H2=$(grep -n "^[^ ]* tH ACQUIRED" "$VITE_LOCK_LOG" | tail -1 | cut -d: -f1)
W1=$(acq_line tW)
echo "  tH attempt1 dòng $H1, tW dòng $W1, tH attempt2 dòng $H2 (rcH=$RCH5 rcW=$RCW)"
if [ "$RCH5" = 0 ] && [ "$RCW" = 0 ] && [ -n "$H1" ] && [ -n "$H2" ] && [ -n "$W1" ] \
   && [ "$H1" -lt "$W1" ] && [ "$W1" -lt "$H2" ]; then
  ok "T5 release-between-attempts: waiter giữ lock giữa 2 attempt của holder ($H1 < $W1 < $H2)"
else bad "T5 release-between-attempts: waiter không chen được vào giữa 2 attempt"; fi

# ---- T6: cooldown sau nhả — giữ lại ngay phải chờ đủ delay ----
echo "--- T6 cooldown ---"
: > "$VITE_LOCK_LOG"
export VITE_LOCK_REACQUIRE_DELAY_S=3
bash "$H" acquire tC 5996 30 0 $$ >/dev/null 2>&1
bash "$H" release tC >/dev/null 2>&1
C0=$(date +%s%N)
bash "$H" acquire tC 5996 30 0 $$ >/dev/null 2>&1; RCC=$?
C1=$(date +%s%N)
bash "$H" release tC >/dev/null 2>&1 || true
CELAPSED_MS=$(( (C1 - C0) / 1000000 ))
export VITE_LOCK_REACQUIRE_DELAY_S=0
if [ "$RCC" = 0 ] && [ "$CELAPSED_MS" -ge 2500 ]; then
  ok "T6 cooldown: giữ lại ngay sau nhả bị chờ ${CELAPSED_MS}ms (>= 2500ms, delay=3s)"
else bad "T6 cooldown: rc=$RCC elapsed=${CELAPSED_MS}ms (muốn >= 2500ms)"; fi

# ---- T7: poll đã vá — đếm được WebProcess giả, không tự đếm chính mình ----
echo "--- T7 poll-quiet-v2 (mẫu [W]ebProcess) ---"
bash -c 'exec -a WebProcess-q4test sleep 25' &
FAKEPID=$!
sleep 1
bash "$POLL" 1 --once >/dev/null 2>&1 || true
B1=$(grep -m1 "^poll 1" "$TDIR/poll-quiet-v2.log" | grep -oE "blockers=[0-9]+" | cut -d= -f2)
kill $FAKEPID 2>/dev/null || true; wait $FAKEPID 2>/dev/null || true
sleep 1
bash "$POLL" 1 --once >/dev/null 2>&1 || true
B2=$(grep "^poll 1" "$TDIR/poll-quiet-v2.log" | tail -1 | grep -oE "blockers=[0-9]+" | cut -d= -f2)
echo "  blockers với WebProcess giả: $B1, sau khi kill giả: $B2"
if [ -n "$B1" ] && [ -n "$B2" ] && [ "$B1" -ge 1 ] && [ "$((B1 - B2))" = 1 ]; then
  ok "T7 poll: bắt được +1 WebProcess giả ($B1 -> $B2), không tự đếm"
else bad "T7 poll: B1=$B1 B2=$B2 (muốn B1-B2=1)"; fi

# ---- T8: run-attempt trả đúng exit code lệnh + luôn nhả lock ----
echo "--- T8 run-attempt exit code ---"
: > "$VITE_LOCK_LOG"
bash "$H" run-attempt tE 5997 30 0 normal -- false; RCF=$?
bash "$H" run-attempt tE 5997 30 0 normal -- true; RCT2=$?
ST=$(bash "$H" status)
if [ "$RCF" = 1 ] && [ "$RCT2" = 0 ] && echo "$ST" | grep -q "TRỐNG"; then
  ok "T8 run-attempt: false->1, true->0, lock trống sau cả 2 attempt"
else bad "T8 run-attempt: rc_false=$RCF rc_true=$RCT2 status: $ST"; fi

echo "== KẾT QUẢ: PASS=$PASS FAIL=$FAIL (log: $TDIR/vite-lock-v2.log) =="
[ "$FAIL" = 0 ]
