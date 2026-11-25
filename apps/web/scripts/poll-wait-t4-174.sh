#!/bin/bash
# poll-wait-t4-174.sh — T4 dot 154: poll gate 0 + gate A (45s) cho luot yen WebKit #31.
# KE THUA DOT 149 (quyet parent dot 144 §12.3(b), dot 143 (j), dot 137 (i),
#   dot 146 (j), dot 145 (o), dot 132 (a)):
#  (P1) NGAN SACH RETRY THEO DOT: toi da 3 attempt/DT, attempt bi reboot giet
#      KHONG TINH. Bo dem nam tren dia (file attempt-done-*) — reboot khong reset
#      duoc. run-attempt-174.sh ghi attempt-done-$TAG khi ket thuc (trap EXIT);
#      attempt chet giua chung do reboot (SIGKILL) khong ghi duoc -> khong tinh.
#  (P2) ATTEMPT-TAGGING: TAG = attempt<N>-<boot_id 8 ky tu> — file JSON/classb/
#      sampler/analyzer moi attempt mang boot rieng, poller chay lai sau reboot
#      KHONG GHI DE artifact boot cu.
#  (P3) B4 + sampler: xem check-classb-t4.sh / t4-attempt-inner.sh (pgrep -x,
#      dpkg.log delta, sampler cat file + tag boot moi dong).
#  (P4) TESTMODE: POLL_TEST=1 -> chay dung 1 poll roi thoat 7.
# CO CHE CHO RAM MOI (quyet parent dot 132 §12.3(a)): GIU nguong gate A RAM >=1024 MB,
# KHONG HA; poll RAM day 45s/lan; chop cua so vang ngay khi RAM>=1024 + gate 0 dat.
# Gate 0 (TAT CA, theo brief dot 144 + QUYET PARENT dot 143 §12.2(j)):
#  (0a) POSTBOOT_PASS cua T5 ton tai (uu tien round174-t5/, du phong round173-t5/
#       cung boot), chua boot_id KHOP boot dang chay, mtime>=boot. Co T5 VAN LA CHINH.
#       Co chi co mtime moi nhung KHONG ghi boot_id: GHI LOG, KHONG tinh dat.
#  (0b) DU PHONG (quyet (j)): neu KHONG co co T5 khop boot hien tai, ket qua kiem
#       postboot check-only CUA CHINH T4 (vcut-webkit-postboot-check.sh) PASS + tuoi
#       <=3 poll (~2 phut) DUOC TINH LA gate0 dat, ghi gate0src=T4-check-only.
#  (0c) check-only postboot chay moi 4 poll (~3 phut).
#  (0d) apt-get/dpkg = 0 (pgrep -x).  (0e) cay md5 preview.tsx == tree-md5.txt (530e10a7).
# Gate A (TAT CA): load1<2, load5<2, RAM>=1024, lock trong hoac stale-boot,
#   blockers=0, cay YES.
# QUYET PARENT dot 137 §12.3(i) — BAT BUOC dot 139: CHUP ps snapshot TRUOC roi moi
#   DEM blockers TU snapshot do (1 lan ps duy nhat moi poll); khong dem tu pipe
#   ps roi moi chup sau nua.
# FIX F-138-T4-2 (dot 139): loai tru vcut-webkit-postboot-check.sh khoi grep blockers.
# Reboot giua luot: boot_id doi -> ghi khung chet (last-seen cu, first-seen moi),
#   reset gate 0 + PB (check-only chay lai ngay tren boot moi; gate0 du phong T4
#   ap dung cho boot moi nhu cu — khong cho co T5 vo han).
# QUYET PARENT dot 149 §12.3(h) — BAT BUOC dot 151 (sua F-149-T4-3): VONG RETRY
#   PHAI POLL LAI GATE TRUOC MOI ATTEMPT. Retry cho gate mo lai thi phai kiem gate
#   co mo khong, thay vi cho mu (sleep 10 roi chay ngay nhu dot 148/149). Ham
#   wait_gate() dung chung cho ca cua mo attempt dau va moi retry; moi attempt
#   chi chay khi 1 poll moi nhat cho GATE_OPEN=1. Huong dan dung: cac job nang
#   tranh cua do T4 khi co the (khong bat buoc cung).
# FIX F-149-T4-2 (dot 150): poll-wait goi DUNG run-attempt-174.sh (dot 149 goi nham
#   run-attempt-148.sh, phai va bang symlink luc chay).
# Han cat 01:30Z 23/11/2026 (brief dot 174: han co ~02:00Z, han cung 02:30Z;
#   poller dung 01:30Z de T4 kip dong co truoc han co — bai hoc dot 143 T4 dong
#   muon 11 phut sau han co) -> dung cho, dong 0 attempt (exit 5); het han trong
#   luc cho gate mo lai giua cac retry -> exit 11 (het ngan sach thoi gian).
# Khi cua mo: chay run-attempt-174.sh attempt<N>-<boot8> (lock v2 + inner + classb
#   + analyzer), danh gia verdict (lop B 5/5 + tickCost median <=60 ms) roi
#   hoac thoat hoac cho gate mo lai cho retry tiep theo.
# Dung: nohup bash poll-wait-t4-174.sh > poll-t4.nohup.log 2>&1 &
set -u
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t4
H=~/workspace/goals/capcut-clone-video-editor/hidden_files
T5FLAG="$H/round174-t5/POSTBOOT_PASS"
T5FLAG_FALLBACK="$H/round173-t5/POSTBOOT_PASS"
POSTBOOT=~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
DEADLINE_S=$(date -d '2026-11-23 01:30:00 UTC' +%s)
BOOT_START=$(uptime -s 2>/dev/null || echo ?)
CURBOOTID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)
# FIX F-150-T4-5 (dot 151): test poll (POLL_TEST=1) ghi LOG RIENG
# poll-test-174.log, KHONG ghi chung poll-t4.log — POLLLOG chon file log.
if [ "${POLL_TEST:-0}" = "1" ]; then POLLLOG="$W/poll-test-174.log"; else POLLLOG="$W/poll-t4.log"; fi
if [ "${POLL_TEST:-0}" = "1" ]; then
  echo "== poll-wait-t4-174 TEST start $(date -u +%FT%TZ) boot=$BOOT_START boot_id=$CURBOOTID deadline=2026-11-23T01:30:00Z poll=45s gateA_RAM>=1024 (KHONG HA) gate0=T5-chinh/T4-check-only-du-phong(quyet-143-j) ngan-sach=3-attempt/dot(tren-dia) RETRY-POLL-LAI-GATE(quyet-149-h)" >> "$POLLLOG"
else
  echo "== poll-wait-t4-174 start $(date -u +%FT%TZ) boot=$BOOT_START boot_id=$CURBOOTID deadline=2026-11-23T01:30:00Z poll=45s gateA_RAM>=1024 (KHONG HA) gate0=T5-chinh/T4-check-only-du-phong(quyet-143-j) ngan-sach=3-attempt/dot(tren-dia) RETRY-POLL-LAI-GATE(quyet-149-h)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
fi
PREV_BOOTID="$CURBOOTID"
PREV_SEEN="$(date -u +%FT%TZ)"
PB="chua-chay"
PB_AGE="?"
i=0
GATE_OPEN=0
DEADLINE_HIT=0
GATE0SRC="khong-dat"
T5S="chua-co"
RAM=0; L1=9; L5=9; BLOCKERS=0; LOCK="khong"; TREE="?"

# poll_once — 1 poll day du (giong vong poll dot 149, tach thanh ham de dung chung
# cho cua mo attempt dau VA moi retry — quyet (h) dot 149).
# Dat GATE_OPEN=1 neu gate 0 + gate A deu dat; DEADLINE_HIT=1 neu qua han cat.
# Tra 0 neu cua mo, 1 neu chua mo / het han.
poll_once() {
  i=$((i+1))
  NOW_S=$(date -u +%s)
  NOW_ISO=$(date -u +%FT%TZ)
  if [ "$NOW_S" -ge "$DEADLINE_S" ]; then
    DEADLINE_HIT=1
    _RED=""
    [ "${T5S:-?}" != "PASS" ] && [ "${PB:-?}" != "0" ] && _RED="$_RED gate0(co-T5=${T5S:-?},postboot_exit=${PB:-?})"
    [ "${RAM:-0}" -lt 1024 ] 2>/dev/null && _RED="$_RED gateA-RAM(${RAM:-?}MB<1024)"
    _L1OK=$(awk -v a="${L1:-9}" 'BEGIN{print (a<2)?1:0}'); [ "$_L1OK" = 0 ] && _RED="$_RED load1(${L1:-?})"
    _L5OK=$(awk -v a="${L5:-9}" 'BEGIN{print (a<2)?1:0}'); [ "$_L5OK" = 0 ] && _RED="$_RED load5(${L5:-?})"
    [ -n "${BLOCKERS:-}" ] && [ "${BLOCKERS:-0}" != "0" ] && _RED="$_RED blockers(${BLOCKERS})"
    case "${LOCK:-khong}" in co:*) _RED="$_RED lock-co";; esac
    case "${TREE:-?}" in YES*) ;; *) _RED="$_RED cay(${TREE:-?})";; esac
    [ -z "$_RED" ] && _RED=" (khong xac dinh — poll cuoi toan xanh nhung cua khong mo?)"
    echo "HET HAN CHO 01:30Z 23/11 — GATE DO LUC HET HAN (poll cuoi #$((i-1))):$_RED" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    return 1
  fi
  BOOTID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)
  BTIME_S=$(grep btime /proc/stat | awk '{print $2}')
  BTIME_ISO=$(date -d "@$BTIME_S" -u +%FT%TZ 2>/dev/null || echo ?)
  if [ "$BOOTID" != "$PREV_BOOTID" ]; then
    echo "REBOOT PHAT HIEN poll #$i $NOW_ISO — boot cu ${PREV_BOOTID:0:8} chet trong khung ($PREV_SEEN, $NOW_ISO]; boot moi ${BOOTID:0:8} btime=$BTIME_ISO — reset gate 0 + PB, check-only chay lai ngay (gate0 du phong T4 ap dung cho boot moi; co T5 moi trong round174-t5/ van la chinh neu co)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    PREV_BOOTID="$BOOTID"; PB="chua-chay"; PB_AGE="?"
  fi
  PREV_SEEN="$NOW_ISO"
  RAM=$(free -m | awk 'NR==2{print $7}')
  L1=$(awk '{print $1}' /proc/loadavg); L5=$(awk '{print $2}' /proc/loadavg)
  # --- lock ---
  LOCK="khong"
  if [ -d "$H/vite.lock" ]; then
    OWNPID=$(grep -E "^pid=" "$H/vite.lock/owner" 2>/dev/null | cut -d= -f2)
    OWNPORT=$(grep -E "^port=" "$H/vite.lock/owner" 2>/dev/null | cut -d= -f2)
    OWNBOOT=$(grep -E "^boot=" "$H/vite.lock/owner" 2>/dev/null | cut -d= -f2)
    CURB=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)
    # FIX F-156-T4-3: curl that bai IN "000" ra stdout + exit!=0 nen
    # "$(curl ... || echo 000)" luon = "000000", so sanh = "000" KHONG BAO
    # GIO dung -> nhanh stale-boot la DEAD CODE (lock cu chet theo reboot
    # van hien lock=co, cua khong bao gio mo). Tach ma curl ra bien truoc.
    _CURLCODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://localhost:${OWNPORT:-0}/" 2>/dev/null || true)
    if [ -n "$OWNPID" ] && ! kill -0 "$OWNPID" 2>/dev/null && [ -n "$OWNBOOT" ] && [ "$OWNBOOT" != "$CURB" ] && [ "$_CURLCODE" = "000" ]; then
      LOCK="stale-boot:$(cat "$H/vite.lock/owner" 2>/dev/null | head -c 60 | tr '\n' ' ')"
    else
      LOCK="co:$(cat "$H/vite.lock/owner" 2>/dev/null | head -c 60 | tr '\n' ' ')"
    fi
  fi
  # QUYET PARENT dot 137 §12.3(i): CHUP ps snapshot TRUOC (1 lan ps duy nhat),
  # roi DEM blockers TU snapshot do. Dem theo TEN PROCESS (F-145-T4-2).
  ps -eo pid,ppid,etime,comm,args > "$W/ps-snap-tmp.txt" 2>/dev/null
  awk '{
    comm=$4; argv0=$5
    if ($0 ~ /run-t4|poll-|t4-attempt|postboot-check|poll-t3/) next
    if ($0 ~ /sleep [0-9]/) next
    if (comm == "md5sum") next
    if ($0 ~ /md5sum[[:space:]]+.*vite\.config\.ts/) next
    if ((argv0 ~ /(^|\/)node$/ || argv0 ~ /(^|\/)vite$/ || comm == "vite") && $0 ~ /vite|probe116t5|probe115r5|probe114q5|webkit|WebProcess|MiniBrowser/) print
    else if (comm ~ /^(MiniBrowser|WebProcess)$/ || tolower(comm) ~ /webkit/ || argv0 ~ /MiniBrowser|WebKit/) print
  }' "$W/ps-snap-tmp.txt" > "$W/blockers-matched-tmp.txt" 2>/dev/null
  BLOCKERS=$(wc -l < "$W/blockers-matched-tmp.txt")
  BLOCKERS_LEGACY=$(grep -E "[v]ite|[p]robe116t5|[p]robe115r5|[p]robe114q5|[M]iniBrowser|[w]ebkit|WebProcess" "$W/ps-snap-tmp.txt" | grep -v "run-t4" | grep -v "grep -E" | grep -v "sleep [0-9]" | grep -v "poll-t3" | grep -v "poll-" | grep -v "t4-attempt" | grep -v "postboot-check" | wc -l)
  if [ "$BLOCKERS" != "0" ]; then
    cp "$W/ps-snap-tmp.txt" "$W/blockers-ps-$i.txt" 2>/dev/null
    cp "$W/blockers-matched-tmp.txt" "$W/blockers-list-$i.txt" 2>/dev/null
    echo "poll #$i $NOW_ISO blockers=$BLOCKERS (comm-based, F-145-T4-2) legacy-chuoi-con=$BLOCKERS_LEGACY — snapshot da luu blockers-ps-$i.txt + blockers-list-$i.txt" >> "$POLLLOG"
  else
    rm -f "$W/ps-snap-tmp.txt" "$W/blockers-matched-tmp.txt"
  fi
  MD5NOW=$(md5sum ~/workspace/repo-1/apps/web/src/preview.tsx | cut -c1-8)
  EXPECTED=$(cat "$W/tree-md5.txt" 2>/dev/null || echo "")
  if [ -z "$EXPECTED" ]; then TREE="CHUA-CO-MD5"; elif [ "$MD5NOW" = "$EXPECTED" ]; then TREE="YES:md5=$MD5NOW"; else TREE="MD5-KHAC:$MD5NOW(kyd=$EXPECTED)"; fi
  # --- gate 0: co T5 (uu tien round174-t5, du phong round173-t5 cung boot) ---
  T5S="chua-co"; T5SRC=""
  for _CAND in "$T5FLAG" "$T5FLAG_FALLBACK"; do
    if [ -f "$_CAND" ]; then
      _FMTIME=$(stat -c %Y "$_CAND" 2>/dev/null || echo 0)
      if [ "$_FMTIME" -ge "$BTIME_S" ] && grep -q "$BOOTID" "$_CAND" 2>/dev/null; then T5S="PASS"; T5SRC="$_CAND"; break
      elif [ "$_FMTIME" -ge "$BTIME_S" ]; then T5S="mtime-moi-khong-ghi-boot_id(KHONG-TINH)"; T5SRC="$_CAND"; break
      else T5S="cu(mtime-cu)"; T5SRC="$_CAND"; break; fi
      # FIX F-151-T5-3 (dot 152): moi nhanh deu break — ung vien dau tien TON TAI
      # quyet dinh T5S; fallback cu khong duoc ghi de len trang thai cua co chinh
      # (truoc day elif/else khong break, co round cu co the doi T5S thanh cu).
    fi
  done
  # --- gate 0: check-only moi 4 poll ---
  if [ $((i % 4)) = 1 ] || [ "$PB" = "chua-chay" ]; then
    if bash "$POSTBOOT" > "$W/postboot-t4-174-gate0wait-$i.log" 2>&1; then PB=0; else PB=$?; fi
    PB_AGE=0
  else PB_AGE=$((PB_AGE+1)); fi
  APTX=$(pgrep -x apt-get | wc -l); DPKX=$(pgrep -x dpkg | wc -l); APTN=$((APTX + DPKX))
  DPKGLINES=$(wc -l < /var/log/dpkg.log 2>/dev/null || echo "?")
  # --- gate0 QUYET PARENT dot 143 §12.2(j): co T5 la CHINH; neu khong co co
  # T5 khop boot hien tai thi check-only CUA CHINH T4 PASS + tuoi <=3 poll la DU PHONG.
  GATE0OK=0; GATE0SRC="khong-dat"
  if [ "$T5S" = "PASS" ]; then GATE0OK=1; GATE0SRC="T5($T5SRC)"
  elif [ "$PB" = 0 ] && [ "$PB_AGE" -le 3 ]; then GATE0OK=1; GATE0SRC="T4-check-only(pb_age=${PB_AGE})"
  fi
  echo "poll #$i $NOW_ISO boot=${BOOTID:0:8} btime=$BTIME_ISO load1=$L1 load5=$L5 lock=$LOCK blockers=$BLOCKERS(comm-based,legacy=$BLOCKERS_LEGACY) RAMavail=${RAM}MB tree=$TREE t5flag=$T5S(t5src=${T5SRC##*round}) postboot_exit=$PB(pb_age=${PB_AGE}x45s) gate0=$GATE0SRC apt=$APTN(aptx=$APTX,dpkgx=$DPKX) dpkg_lines=$DPKGLINES" >> "$POLLLOG"
  OK1=$(awk -v a="$L1" 'BEGIN{print (a<2)?1:0}')
  OK5=$(awk -v a="$L5" 'BEGIN{print (a<2)?1:0}')
  OKR=$(awk -v a="$RAM" 'BEGIN{print (a>=1024)?1:0}')
  LOCKOK=0; { [ ! -d "$H/vite.lock" ] || [ "${LOCK#stale-boot}" != "$LOCK" ]; } && LOCKOK=1
  TREEOK=0; [ "${TREE#YES}" != "$TREE" ] && TREEOK=1
  if [ "$GATE0OK" = 1 ] && [ "$PB" = 0 ] && [ "$APTN" = 0 ] && [ "$TREEOK" = 1 ] && [ "$OK1" = 1 ] && [ "$OK5" = 1 ] && [ "$OKR" = 1 ] && [ "$LOCKOK" = 1 ] && [ "$BLOCKERS" = 0 ]; then
    GATE_OPEN=1
    return 0
  fi
  GATE_OPEN=0
  # VA DOT 145 (P4) TESTMODE: POLL_TEST=1 -> chay dung 1 poll roi thoat 7.
  # FIX F-155-T4-1 (dot 156): POLL_TEST chi duoc thoat 7 o poll DAU TIEN
  # (i==1). Dot 155: poll test #1 mo cua -> attempt that chay trong khi
  # POLL_TEST van =1; poll retry-wait #2 cua dong -> roi nhanh TEST-POLL-OK
  # exit 7, GIET poller. Tu nay retry-wait khong bao gio exit 7 nua.
  if [ "${POLL_TEST:-0}" = "1" ] && [ "$i" = 1 ]; then echo "TEST-POLL-OK poll #$i $NOW_ISO boot=${BOOTID:0:8} RAM=${RAM}MB load1=$L1 load5=$L5 gate0=$GATE0SRC t5flag=$T5S postboot_exit=$PB apt=$APTN dpkg_lines=$DPKGLINES" >> "$POLLLOG"; exit 7; fi
  return 1
}

# wait_gate — cho den khi 1 poll moi nhat cho GATE_OPEN=1 (cua mo) hoac het han.
# Dung CHUNG cho attempt dau va moi retry (quyet (h) dot 149): retry KHONG chay
# ngay sau sleep 10 nua — phai poll lai gate va chi chay khi gate that su mo.
# Tra 0 neu cua mo, 1 neu het han cat 01:30Z.
wait_gate() {
  while true; do
    if poll_once; then
      return 0
    fi
    [ "$DEADLINE_HIT" = 1 ] && return 1
    sleep 45
  done
}

count_done() { ls "$W"/attempt-done-* 2>/dev/null | wc -l; }

# eval_attempt TAG RC — danh gia verdict attempt vua chay.
#   Thoat truc tiep neu: LUOT HOP LE (exit 0), COVERAGE 0/N (exit 10),
#   het ngan sach 3 attempt (exit 11, hoac exit RC neu attempt loi).
#   Tra 1 neu can RETRY (caller se wait_gate lai roi chay attempt ke).
eval_attempt() {
  _TAG="$1"; _RC="$2"
  _USED=$(count_done)
  echo "== poll-wait-t4-174: $_TAG chay xong, run-attempt exit=$_RC, da-dung-ngan-sach=$_USED/3 $(date -u +%FT%TZ)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
  if [ "$_RC" = 0 ]; then
    # FIX F-142-T4-4: poller phai kiem verdict LOP B truoc khi thoat.
    # exit 0 chi noi probe 20/20; neu lop B VI PHAM thi luot NHIEM TAI, retry.
    # CONG tickCost <=60 ms (quyet parent dot 146 §12.3(j), sua F-146-T4-1):
    # poller CHI tuyen bo "LUOT HOP LE" khi ca lop B DAT 5/5 VA tickCost
    # median <=60 ms. Median >60 hoac khong doc duoc -> retry (fail-closed).
    WHY_TC=""
    if grep -q "LOP-B-TONG: DAT 5/5" "$W/classb-t4-$_TAG.txt" 2>/dev/null; then
      TC_MED=$(grep -oE 'tickCost total n=[0-9]+ median=[0-9.]+' "$W/analyze-t4-$_TAG-tickcost.txt" 2>/dev/null | grep -oE 'median=[0-9.]+' | cut -d= -f2 | head -1)
      TC_OK=$(awk -v m="${TC_MED:-999}" 'BEGIN{print (m<=60)?1:0}')
      if [ -n "$TC_MED" ] && [ "$TC_OK" = 1 ]; then
        echo "$_TAG 20/20 + LOP B DAT 5/5 + tickCost median=${TC_MED}ms <=60 - LUOT HOP LE, thoat poller" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 0
      fi
      if [ -z "$TC_MED" ]; then WHY_TC="tickCost KHONG DOC DUOC tu analyze-t4-$_TAG-tickcost.txt (fail-closed, retry nhu vi pham)"; else WHY_TC="tickCost median=${TC_MED}ms >60 (cong F-146-T4-1)"; fi
      echo "$_TAG 20/20 + LOP B DAT 5/5 NHUNG $WHY_TC - luot KHONG hop le, KHONG dung verdict" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    else
      WHY_TC="lop-B-vi-pham (nhiem tai)"
      echo "$_TAG 20/20 NHUNG LOP B VI PHAM - luot nhiem tai, KHONG dung verdict (xem classb-t4-$_TAG.txt)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    fi
    if [ "$_USED" -ge 3 ]; then echo "$_TAG khong hop le - DA HET 3 ATTEMPT/DT, khong co luot hop le - thoat poller (agent xem xet)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 11; fi
    echo "RETRY: ly do: $WHY_TC - con $((3-_USED)) luot retry - POLL LAI GATE truoc attempt ke (quyet-149-h)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    return 1
  fi
  if [ "$_RC" = 10 ]; then echo "$_TAG COVERAGE 0/N (exit 10) - DUNG retry tu dong, cho agent quyet (da dung $_USED/3)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 10; fi
  if [ "$_USED" -ge 3 ]; then echo "$_TAG loi (exit=$_RC) - DA HET NGAN SACH 3 ATTEMPT/DT - thoat poller (agent xem xet)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit "$_RC"; fi
  _J="$W/preview-b-f3-flip-webkit-t4-$_TAG.json"
  if [ -f "$_J" ]; then WHY="partial (co JSON $(stat -c%s "$_J")B, exit=$_RC - wedged/timeout, KHONG tinh verdict)"; else WHY="setup (KHONG CO JSON, exit=$_RC)"; fi
  echo "RETRY: ly do: $WHY - con $((3-_USED)) luot retry - POLL LAI GATE truoc attempt ke (quyet-149-h)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
  return 1
}

# --- LUONG CHINH ---
# Cua mo attempt dau: cho gate (poll 45s/lan) den khi mo hoac het han.
if ! wait_gate; then
  echo "HET HAN CHO 01:30Z 23/11 — 0 attempt — dong theo brief dot 174 (han co ~02:00Z)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
  exit 5
fi
while true; do
  USED=$(count_done)
  if [ "$USED" -ge 3 ]; then
    echo "NGAN SACH 3 ATTEMPT/DT DA HET (tren dia: $USED) — khong chay attempt moi, thoat poller" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 12
  fi
  ATT=$((USED+1))
  BOOTSHORT=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null | cut -c1-8)
  TAG="attempt${ATT}-${BOOTSHORT}"
  echo "CUA YEN MO poll #$i $(date -u +%FT%TZ) - gate0 $GATE0SRC + gateA du (RAM=${RAM}MB) - CHAY attempt$ATT NGAY (da dung $USED/3) [gate vua poll lai, quyet-149-h]" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
  bash "$W/run-attempt-174.sh" "$TAG" 2>&1 | tee -a "$W/chain-t4.log"
  RC=${PIPESTATUS[0]}
  if eval_attempt "$TAG" "$RC"; then
    # eval_attempt chi tra 0 khi... (thuc te no exit truc tiep o moi verdict
    # cuoi; nhanh nay khong toi duoc) — giu phong thu.
    exit 0
  fi
  # Can retry: POLL LAI GATE truoc attempt ke (quyet (h) dot 149) — khong chay mu.
  echo "== poll-wait-t4-174: cho gate mo lai truoc retry attempt$((ATT+1)) (poll 45s/lan, han cat 01:30Z) $(date -u +%FT%TZ)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
  if ! wait_gate; then
    echo "HET HAN CHO GATE MO LAI 01:30Z 23/11 trong luc cho retry - het ngan sach thoi gian, khong co luot hop le - thoat poller exit 11" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    exit 11
  fi
done
