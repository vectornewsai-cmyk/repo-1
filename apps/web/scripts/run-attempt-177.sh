#!/bin/bash
# run-attempt-177.sh — chay 1 luot yen WebKit #46 (attempt<N>-<boot8>) KHI cua yen da mo.
#   lock v2 run-attempt + t4-attempt-inner.sh (20 pass) + classb + analyzer NGAY.
# VA DOT 145 (quyet parent dot 144 §12.3(b)):
#  (P1) NGAN SACH THEO DOT: trap EXIT ghi attempt-done-$TAG (kem exit code) khi
#      script ket thuc BANG MOI DUONG (exit 0/10/loi). Chi chet bang SIGKILL
#      (reboot giua attempt) moi khong ghi duoc -> attempt do KHONG TINH vao
#      ngan sach 3 attempt/DT; poller dem tren dia (attempt-done-*) khi chay lai.
#  (P2) TAG mang boot_id: TAG=attempt<N>-<boot8> do poller truyen; moi file
#      attempt mang boot rieng, khong ghi de artifact boot cu (F-144-T4-4).
#  (P3) B4 baseline: ghi dpkg.log so dong + apt history tail TRUOC attempt
#      (dpkg-lines-before-$TAG.txt / apt-history-before-$TAG.txt) de check-classb
#      so delta trong cua so (sua B4 gia-duong F-144-T4-2 — xem check-classb-t4.sh).
#   KIEM CUA SO LOG NGAY SAU ATTEMPT DAU (quyet parent dot 131): chay
#   analyze-t4-c2coverage.py ngay; ket qua ghi coverage-check-attempt1.txt.
#   Neu 0/N covered: KHONG tu sua probe (doi agent quyet dieu chinh re-arm
#   theo failure mode thuc te trong log) — ghi marker COVERAGE-0 + exit 10.
# Dung: run-attempt-177.sh attempt1-70b7f7ee  (chi goi tu poll-wait-t4-177.sh)
set -u
TAG="${1:-attempt1}"
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t4
H=~/workspace/goals/capcut-clone-video-editor/hidden_files
LOCKV2=~/workspace/repo-1/apps/web/scripts/vcut-vite-lock-v2.sh
export VITE_LOCK_AGING_S=600
# VA DOT 145 (P1): ghi attempt-done-$TAG khi script ket thuc bang moi duong
# (trap EXIT — chi SIGKILL/reboot moi ngan duoc). Poller dem file nay lam ngan sach.
trap 'echo "attempt=$TAG exit=$? boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null) $(date -u +%FT%TZ)" > "$W/attempt-done-$TAG"' EXIT
BOOT_START=$(uptime -s 2>/dev/null || echo ?)
echo "== T4 $TAG start $(date -u +%FT%TZ) boot=$BOOT_START load $(cat /proc/loadavg) RAMavail=$(free -m | awk 'NR==2{print $7}')MB preview.tsx $(md5sum ~/workspace/repo-1/apps/web/src/preview.tsx | cut -c1-8)"
ps -eo pid,args > "$W/ps-before-t4-$TAG.txt"
# VA DOT 145 (P3): baseline B4 — dpkg.log so dong + apt history tail truoc attempt.
wc -l < /var/log/dpkg.log > "$W/dpkg-lines-before-$TAG.txt" 2>/dev/null || echo "?" > "$W/dpkg-lines-before-$TAG.txt"
tail -20 /var/log/apt/history.log > "$W/apt-history-before-$TAG.txt" 2>/dev/null || echo "(khong doc duoc apt history.log)" > "$W/apt-history-before-$TAG.txt"
echo "B4-baseline $TAG: dpkg_lines_before=$(cat "$W/dpkg-lines-before-$TAG.txt") apt_history_tail_last_start=$(grep -h 'Start-Date' "$W/apt-history-before-$TAG.txt" | tail -1)"
touch "$W/marker-t4-$TAG"
# F-147-T4-2 (dot 150): BO tee o pipe LOCKV2 — poller tee stdout cua
# run-attempt vao chain-t4.log 1 lan duy nhat; tee nay lam moi dong
# inner/probe xuat hien 2 lan trong chain-t4.log. RC lay truc tiep.
bash "$LOCKV2" run-attempt t4 5187 1500 30 normal -- bash "$W/t4-attempt-inner.sh" "$TAG" 20 30000
RC=$?
echo "== T4 $TAG run-attempt exit=$RC $(date -u +%FT%TZ) load $(cat /proc/loadavg) RAM $(free -m | awk 'NR==2{print $7}')MB avail preview.tsx $(md5sum ~/workspace/repo-1/apps/web/src/preview.tsx | cut -c1-8)"
# F-147-T4-2 (tiep): bo tee o pipe check-classb — cung ly do.
bash "$W/check-classb-t4.sh" "$TAG" "$BOOT_START" 2>&1
# F-147-T4-3 (dot 150): nhan analyzer theo attempt that.
ATTNUM=$(echo "$TAG" | sed -E 's/^attempt([0-9]+)-.*/\1/')
JSON="$W/preview-b-f3-flip-webkit-t4-$TAG.json"
if [ -f "$JSON" ]; then
  echo "== analyzer $TAG $(date -u +%FT%TZ) json=$(stat -c%s "$JSON")B"
  python3 "$W/analyze-t4-c2drawlog.py" "$JSON" > "$W/analyze-t4-$TAG-c2drawlog.txt" 2>&1
  python3 "$W/analyze-t4-labellag.py" "$JSON" > "$W/analyze-t4-$TAG-labellag.txt" 2>&1
  python3 "$W/analyze-t4-skiplatest.py" "$JSON" > "$W/analyze-t4-$TAG-skiplatest.txt" 2>&1
  python3 "$W/analyze-t4-lag5.py" "$JSON" > "$W/analyze-t4-$TAG-lag5.txt" 2>&1
  python3 "$W/analyze-t4-tickcost.py" "T4-177a${ATTNUM}=$JSON" > "$W/analyze-t4-$TAG-tickcost.txt" 2>&1
  python3 "$W/analyze-t4-wallbands.py" "T4-177a${ATTNUM}=$JSON" > "$W/analyze-t4-$TAG-wallbands.txt" 2>&1
  # Dot 138 (quyet parent dot 137 §12.3(c)): tickCost + load1/RAM theo tung pass.
  python3 "$W/analyze-t4-perpass.py" "$JSON" "$W/run-webkit-t4-$TAG.log" "$W/load-mid-t4-$TAG.log" > "$W/analyze-t4-$TAG-perpass.txt" 2>&1
  # (c2) seqs tu labellag muc skippedLatest=0, dong "(c2) dang ngo that, tat ca (...)".
  # Trich seq = so dau cua moi tuple (seq, presented, label, lag).
  SEQS=$(grep -o '(c2) dang ngo that, tat ca.*' "$W/analyze-t4-$TAG-labellag.txt" | grep -oE '\([0-9]+,' | tr -d '(,' | paste -sd, -)
  echo "c2seqs=[$SEQS]"
  if [ -n "$SEQS" ]; then
    python3 "$W/analyze-t4-c2coverage.py" "$JSON" "$SEQS" > "$W/analyze-t4-$TAG-c2coverage.txt" 2>&1
    # Dot 138 (DEF v0.5 prereg): kiem P3' stall-based tren cung seq (c2).
    python3 "$W/analyze-t4-stall.py" "$JSON" "$SEQS" > "$W/analyze-t4-$TAG-stall.txt" 2>&1
  else
    echo "(c2)=0 — khong co seq de kiem coverage" > "$W/analyze-t4-$TAG-c2coverage.txt"
    python3 "$W/analyze-t4-stall.py" "$JSON" "" > "$W/analyze-t4-$TAG-stall.txt" 2>&1
  fi
  # Kiem cua so log NGAY (quyet parent dot 131).
  COV=$(grep -oE 'TONG: \(c2\) trong cua so log: [0-9]+/[0-9]+' "$W/analyze-t4-$TAG-c2coverage.txt" | grep -oE '[0-9]+/[0-9]+$' | head -1)
  echo "COVERAGE-CHECK $TAG $(date -u +%FT%TZ): $COV" | tee -a "$W/coverage-check-$TAG.txt"
  cat "$W/analyze-t4-$TAG-c2coverage.txt" >> "$W/coverage-check-$TAG.txt"
  if echo "$COV" | grep -q '^0/'; then
    echo "COVERAGE 0/N — log draw KHONG phu post-flip; KHONG tu sua probe; cho agent quyet dieu chinh re-arm (marker COVERAGE-0)"
    touch "$W/COVERAGE-0-$TAG"
    exit 10
  fi
else
  echo "KHONG CO JSON $JSON — probe khong ghi duoc file (exit=$RC)"
  exit $RC
fi
exit $RC
