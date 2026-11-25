#!/bin/bash
# run-attempt-185.sh — chay 1 luot yen WebKit #54 (attempt<N>-<boot8>) KHI cua yen da mo.
#   lock v2 run-attempt + t4-attempt-inner.sh (20 pass). KHONG chay classb /
#   analyzer o day nua (quyet (p) dot 179, F-179-T4-5) — poller goi
#   run-analyzers-185.sh SAU khi script nay thoat (ngoai cua so attempt).
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
#   analyze-t4-c2coverage.py ngay (trong run-analyzers-185.sh, NGOAI cua so);
#   ket qua ghi coverage-check-attempt1.txt.
#   Neu 0/N covered: KHONG tu sua probe (doi agent quyet dieu chinh re-arm
#   theo failure mode thuc te trong log) — ghi marker COVERAGE-0 + exit 10.
# Dung: run-attempt-185.sh attempt1-70b7f7ee  (chi goi tu poll-wait-t4-185.sh)
set -u
TAG="${1:-attempt1}"
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t4
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
# QUYET (p) DOT 179 (F-179-T4-5): check-classb + analyzer KHONG chay trong
# run-attempt nua — cua so attempt DONG khi script nay thoat (trap EXIT ghi
# attempt-done-$TAG). Poller goi run-analyzers-185.sh SAU khi run-attempt
# thoat, ngoai cua so attempt, roi moi eval_attempt. Ly do: analyzer
# analyze-t4-skiplatest.py co outpath mac dinh round109-k7/
# analyze-k7-skiplatest.txt (ghi nhe 18:13:20Z trong cua so attempt dot 179);
# labellag/lag5 cung co outpath mac dinh tuong doi. run-analyzers truyen
# argv[2] tuong minh cho ca 3 analyzer ghi-file nen khong con ghi mac dinh.
exit $RC
