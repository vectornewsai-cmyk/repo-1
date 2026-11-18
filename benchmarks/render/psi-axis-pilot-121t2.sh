#!/bin/bash
# PSI load-axis pilot — VCut Studio, Phase 9 đợt 121, luồng T2.
# Mục đích: kiểm chứng PSI cpu.some (avg10/avg60) có phân biệt được các
# mức tải hog hay không — trái với load1 (đã chứng minh VÔ HIỆU đợt 120 T2).
# KHÔNG chạy s79, KHÔNG chạy leg B thật, KHÔNG sửa production, KHÔNG push.
#
# Thiết kế: 4 mức hog nice-19 (lệnh y hệt driver T3): 0 / 2 / 6 / 12 hog,
# mỗi mức giữ 90 s (BASE 60 s) để avg60 kịp hội tụ; lấy mẫu 2 s.
# Kèm ticker proxy: một node setInterval(10 ms) đếm tick — đo main-thread
# đói theo kiểu tickRate (CHỈ LÀ PROXY cho pilot; tickRate thật của leg B
# vẫn lấy từ blendTick trong browser, xem DEF doc).
# Ghi: loadavg (kể cả threadsR + load1 CHỈ để đối chiếu), Rthreads,
# hog utime (CPU cháy thật), /proc/stat, PSI cpu some+full, cgroup
# usage_usec, ticker count. Kill sạch hog + ticker khi xong (trap).
#
# Chạy: bash benchmarks/render/psi-axis-pilot-121t2.sh
# Log:  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t2/psi-axis-pilot.log
# Phân tích: hidden_files/round121-t2/analyze-pilot.py
HDIR="$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t2"
OUT="$HDIR/psi-axis-pilot.log"
TICKER_JS="$HDIR/ticker.mjs"
TICKER_STATE="$HDIR/ticker.state"
HOGPIDS=""
TICKERPID=""

cat > "$TICKER_JS" <<'EOF'
// Pilot ticker: counts 10 ms event-loop ticks; writes cumulative count
// to ticker.state once per second. Proxy for blendTick tickRate only.
import { writeFileSync } from 'node:fs';
const stateFile = process.argv[2];
let n = 0;
setInterval(() => { n++; }, 10);
setInterval(() => {
  try { writeFileSync(stateFile, Date.now() + ' ' + n + '\n'); } catch {}
}, 1000);
EOF

cleanup() {
  for p in $HOGPIDS $TICKERPID; do kill "$p" 2>/dev/null; done
  for p in $HOGPIDS $TICKERPID; do wait "$p" 2>/dev/null; done
  echo "[$(date -u +%FT%TZ)] cleanup: node procs remaining: $(ps -e -o comm= | grep -c '^node$' || true)" >> "$OUT"
}
trap cleanup EXIT

sample() { # $1 = phase
  local rthreads hogalive hogutime tick
  rthreads=$(ps -eLo stat= 2>/dev/null | grep -c '^R')
  hogalive=0; hogutime=0
  for p in $HOGPIDS; do
    if [ -r "/proc/$p/stat" ]; then
      hogalive=$((hogalive+1))
      hogutime=$((hogutime + $(awk '{print $14+$15}' "/proc/$p/stat")))
    fi
  done
  tick="NA"
  [ -r "$TICKER_STATE" ] && tick=$(cat "$TICKER_STATE")
  echo "[$(date -u +%FT%TZ)] $1 loadavg=[$(cat /proc/loadavg)] Rthreads=$rthreads hogsAlive=$hogalive hogUtimeTicks=$hogutime tick=[$tick] stat=[$(head -1 /proc/stat)] psiSome=[$(grep '^some' /proc/pressure/cpu)] psiFull=[$(grep '^full' /proc/pressure/cpu)] cgroup=[$(grep '^usage_usec' /sys/fs/cgroup/cpu.stat)]" >> "$OUT"
}

spawn_hogs() { # $1 = count
  for p in $HOGPIDS; do kill "$p" 2>/dev/null; done
  for p in $HOGPIDS; do wait "$p" 2>/dev/null; done
  HOGPIDS=""
  for i in $(seq 1 "$1"); do
    nice -n 19 node -e "while (true) { Math.sqrt(Math.random()); }" 2>/dev/null &
    HOGPIDS="$HOGPIDS $!"
  done
  echo "[$(date -u +%FT%TZ)] spawned $1 hogs: $HOGPIDS" >> "$OUT"
  sleep 1
}

echo "# psi-axis pilot start $(date -u +%FT%TZ) boot=$(cat /proc/sys/kernel/random/boot_id) uptime=[$(uptime)]" > "$OUT"
node "$TICKER_JS" "$TICKER_STATE" 2>/dev/null &
TICKERPID=$!
echo "[$(date -u +%FT%TZ)] ticker pid $TICKERPID" >> "$OUT"
sleep 2  # let ticker warm up

echo "phase=BASE 60s, 0 hogs" >> "$OUT"
for i in $(seq 1 30); do sample BASE; sleep 2; done

echo "phase=L2 90s, 2 hogs" >> "$OUT"
spawn_hogs 2
for i in $(seq 1 45); do sample L2; sleep 2; done

echo "phase=L6 90s, 6 hogs" >> "$OUT"
spawn_hogs 6
for i in $(seq 1 45); do sample L6; sleep 2; done

echo "phase=L12 90s, 12 hogs" >> "$OUT"
spawn_hogs 12
for i in $(seq 1 45); do sample L12; sleep 2; done

echo "phase=RECOV 30s after kill" >> "$OUT"
cleanup; trap - EXIT; HOGPIDS=""; TICKERPID=""
# restart ticker note: ticker killed too; RECOV tick=NA is expected
for i in $(seq 1 15); do sample RECOV; sleep 2; done
echo "# psi-axis pilot end $(date -u +%FT%TZ)" >> "$OUT"
echo "PILOT DONE — log: $OUT"
