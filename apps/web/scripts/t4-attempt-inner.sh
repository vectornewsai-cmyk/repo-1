#!/bin/bash
# t4-attempt-inner.sh — chay BEN TRONG lock v2 run-attempt (da giu lock t9).
# Start vite :5187 (config tam, 0 watch), sampler load+RAM moi 20s, probe 20 pass.
# Kill vite theo pid node that qua kill-vite v2; kiem ps + curl sau kill.
# Thoat voi exit code cua probe (0 = du 20 pass; 2 = target chet; 3 = pass-timeout).
# Đợt 121 T3: them tham so tuy chon $2=PASSES (mac dinh 20), $3=TICKCOST_TIMEOUT_MS
# (mac dinh 30000) — dung cho 2 pass thu test fix (trial0: passes=1, tctimeout=1ms
# ep nhanh timeout; trial1: passes=1, tctimeout=30000 mac dinh).
# Đợt 148 T4: them $4=WALL_TIMEOUT_MS (mac dinh 1200000 = 20 phut) — truyen
# --attempt-wall-timeout-ms cho probe (watchdog F-147-T4-1); dung cho smoke
# test S3 (wall 20000 ms ep nhanh nhanh watchdog) truoc khi do that.
set -u
TAG="${1:-attempt1}"
PASSES="${2:-20}"
TCTO="${3:-30000}"
WALLTO="${4:-1200000}"
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round148-t4
LOCKV2=~/workspace/repo-1/apps/web/scripts/vcut-vite-lock-v2.sh
export VITE_LOCK_AGING_S=600
cd ~/workspace/repo-1/apps/web
echo "lock status: $(bash $LOCKV2 status 2>&1 | head -2 | tr '\n' ' ')"
export GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
export GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
nohup npx vite -c $W/vite.t4-temp.config.mjs --port 5187 --strictPort > "$W/vite-5187-t4-$TAG.log" 2>&1 &
VITE_PID=$!
for i in $(seq 1 30); do
  if curl -sf -o /dev/null http://localhost:5187/ 2>/dev/null; then echo "vite up after ${i}s (pid $VITE_PID)"; break; fi
  sleep 1
done
curl -sf -o /dev/null http://localhost:5187/ || { echo "VITE KHONG LEN"; exit 3; }
# Sampler load1 + RAM giua luot (moi 2s — dot 138, quyet parent dot 137 §12.3(c):
# ghi load1/RAM kem tickCost theo TUNG PASS; pass ~3,3s nen sampler 20s cu
# hau nhu khong co mau trong 1 pass; 2s cho ~1-2 mau/pass.
# VA DOT 145 (quyet parent dot 144 §12.3(b), sua F-144-T4-3): CAT (truncate)
# file load-mid khi attempt bat dau (khong append qua reboot) + TAG MOI DONG
# bang boot_id 8 ky tu (boot=<boot8>) de phat hien tron boot neu co.
# Dinh dang dong log GIU NGUYEN cac token 'load=...' 'RAMavail=...MB' ma
# check-classb-t4.sh doc (chi them tien to 'boot=... ').
STOPFILE="$W/stop-sampler-t4-$TAG"
rm -f "$STOPFILE"
BOOTSHORT=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null | cut -c1-8)
: > "$W/load-mid-t4-$TAG.log"
echo "sampler-start $(date -u +%FT%TZ) boot=$BOOTSHORT (file load-mid-t4-$TAG.log da CAT, tag boot moi dong)" >> "$W/load-mid-t4-$TAG.log"
( while [ ! -f "$STOPFILE" ]; do echo "boot=$BOOTSHORT $(date -u +%FT%TZ) load=$(cat /proc/loadavg) RAMavail=$(free -m | awk 'NR==2{print $7}')MB" >> "$W/load-mid-t4-$TAG.log"; for _s in $(seq 1 2); do [ -f "$STOPFILE" ] && break; sleep 1; done; done ) &
LOADPID=$!
echo "probe-start $(date -u +%FT%TZ) load=$(cat /proc/loadavg) RAMavail=$(free -m | awk 'NR==2{print $7}')MB"
OUT=$W/preview-b-f3-flip-webkit-t4-$TAG.json
# Dong dau thoi gian UTC moi dong log probe (dot 138): can moc tuyet doi cho
# cua so tung pass (dong "partial JSON da ghi: k/20 pass" -> cuoi pass k).
# PIPESTATUS[0] van la exit code cua node.
node $W/probe121t3-ghost-k7.webkit.mjs --spec $W/b.json --media stripes-nonperiodic.mp4 \
  --passes "$PASSES" --tickcost-timeout-ms "$TCTO" --attempt-wall-timeout-ms "$WALLTO" --disable-rvfc --flip-rvfc-after-pass 5 --c2-draw-log --url http://localhost:5187/ \
  --out $OUT 2>&1 | while IFS= read -r _line; do printf '%s %s\n' "$(date -u +%FT%TZ)" "$_line"; done | tee "$W/run-webkit-t4-$TAG.log"
RC=${PIPESTATUS[0]}
# Dung sampler NGAY khi node probe thoat (sua dot 125): marker + kill + kill -9 du phong.
touch "$STOPFILE" 2>/dev/null
kill $LOADPID 2>/dev/null
for _w in 1 2; do kill -0 $LOADPID 2>/dev/null || break; sleep 1; done
kill -9 $LOADPID 2>/dev/null
if kill -0 $LOADPID 2>/dev/null; then SAMPLER_ALIVE=YES; else SAMPLER_ALIVE=NO; fi
LOADPID=""
echo "sampler-stop $(date -u +%FT%TZ) sampler_alive_after_stop=$SAMPLER_ALIVE load-mid-lines=$(wc -l < "$W/load-mid-t4-$TAG.log" 2>/dev/null || echo ?)"
ps -eo pid,args > "$W/ps-after-t4-$TAG.txt"
MD5_BEFORE=$(md5sum ~/workspace/repo-1/apps/web/src/preview.tsx | cut -c1-8)
echo "== T4 $TAG inner-end $(date -u +%FT%TZ) probe_exit=$RC load $(cat /proc/loadavg) RAM $(free -m | awk 'NR==2{print $7}')MB avail preview.tsx $MD5_BEFORE"
bash $LOCKV2 kill-vite 5187 2>&1 | tail -2
sleep 2
echo "vite sau kill: curl :5187 = $(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:5187/ 2>/dev/null || echo 000)"
# File round122 khac sua trong cua so do (danh dau marker luc start)?
echo "-- round147-* files modified after marker-t4-$TAG (excl. round148-t4 itself):"
find ~/workspace/goals/capcut-clone-video-editor/hidden_files -maxdepth 2 -name 'round147-*' -newer "$W/marker-t4-$TAG" -not -path '*round148-t4*' 2>/dev/null
exit $RC
