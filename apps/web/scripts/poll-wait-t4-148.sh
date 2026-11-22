#!/bin/bash
# poll-wait-t4-148.sh — T4 dot 148: poll gate 0 + gate A DAY (45s) cho luot yen WebKit #21.
# VA DOT 145 (quyet parent dot 144 §12.3(b) — giao T4-145, lam TRUOC khi do):
#  (P1) NGAN SACH RETRY THEO DOT: toi da 3 attempt/DT, attempt bi reboot giet
#      KHONG TINH. Bo dem nam tren dia (file attempt-done-*) — reboot khong reset
#      duoc (sua F-144-T4-6: dot 144 chay 5 attempt vi bo dem nam trong process).
#      run-attempt-148.sh ghi attempt-done-$TAG khi ket thuc (trap EXIT); attempt
#      chet giua chung do reboot (SIGKILL) khong ghi duoc -> khong tinh.
#  (P2) ATTEMPT-TAGGING: TAG = attempt<N>-<boot_id 8 ky tu> (vd attempt1-e146ca67)
#      — file JSON/classb/sampler/analyzer moi attempt mang boot rieng, poller chay
#      lai sau reboot KHONG GHI DE artifact boot cu (sua F-144-T4-4).
#  (P3) B4 + sampler: xem check-classb-t4.sh / t4-attempt-inner.sh (pgrep -x,
#      dpkg.log delta, sampler cat file + tag boot moi dong).
#  (P4) TESTMODE: POLL_TEST=1 -> chay dung 1 poll roi thoat 7 (kiem tra vong poll
#      sau khi va, truoc khi do that).
# CO CHE CHO RAM MOI (quyet parent dot 132 §12.3(a)): GIU nguong gate A RAM >=1024 MB,
# KHONG HA; poll RAM day 45s/lan; chop cua so vang ngay khi RAM>=1024 + gate 0 dat.
# Gate 0 (TAT CA, theo brief dot 144 + QUYET PARENT dot 143 §12.2(j)):
#  (0a) POSTBOOT_PASS cua T5 ton tai (uu tien round148-t5/, du phong round147-t5/
#       cung boot), chua boot_id KHOP boot dang chay, mtime>=boot. Co T5 VAN LA CHINH.
#       Co chi co mtime moi nhung KHONG ghi boot_id: GHI LOG, KHONG tinh dat.
#  (0b) DU PHONG (quyet (j)): neu KHONG co co T5 khop boot hien tai, ket qua kiem
#       postboot check-only CUA CHINH T4 (vcut-webkit-postboot-check.sh) PASS + tuoi
#       <=3 poll (~2 phut) DUOC TINH LA gate0 dat, ghi gate0src=T4-check-only.
#       Khong thay the co T5; chi lap khoang trong khi T5 da xong truoc reboot.
#  (0c) check-only postboot chay moi 4 poll (~3 phut).
#  (0d) apt-get/dpkg = 0 (pgrep -x).  (0e) cay md5 preview.tsx == tree-md5.txt (530e10a7).
# Gate A (TAT CA): load1<2, load5<2, RAM>=1024, lock trong hoac stale-boot,
#   blockers=0, cay YES.
# QUYET PARENT dot 137 §12.3(i) — BAT BUOC dot 139 (khac F-137-T4-1): CHUP ps snapshot
#   TRUOC roi moi DEM blockers TU snapshot do (1 lan ps duy nhat moi poll); khong
#   dem tu pipe ps roi moi chup sau nua.
# FIX F-138-T4-2 (dot 139): loai tru vcut-webkit-postboot-check.sh khoi grep blockers
#   (tranh dem nham tien trinh --repair cua T5 lam blocker; ca 2 pipeline dem + luu list).
# Reboot giua luot: boot_id doi -> ghi khung chet (last-seen cu, first-seen moi),
#   reset gate 0 + PB (check-only chay lai ngay tren boot moi; gate0 du phong T4
#   ap dung cho boot moi nhu cu — khong cho co T5 vo han).
# Han cat 19:30Z 19/11/2026 (brief dot 148: han co 20:00Z, han cung 20:30Z;
#   poller dung 19:30Z de T4 kip dong co truoc han co — bai hoc dot 143
#   T4 dong muon 11 phut sau han co) -> dung cho, dong 0 attempt (exit 5).
# Khi cua mo: chay run-attempt-148.sh attempt<N>-<boot8> (lock v2 + inner + classb + analyzer),
#   roi exit 0 (attempt da chay — verdict do LIMITS quyet).
# Dung: nohup bash poll-wait-t4-148.sh > poll-t4.nohup.log 2>&1 &
set -u
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round148-t4
H=~/workspace/goals/capcut-clone-video-editor/hidden_files
T5FLAG="$H/round148-t5/POSTBOOT_PASS"
T5FLAG_FALLBACK="$H/round147-t5/POSTBOOT_PASS"
POSTBOOT=~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
DEADLINE_S=$(date -d '2026-11-19 19:30:00 UTC' +%s)
BOOT_START=$(uptime -s 2>/dev/null || echo ?)
CURBOOTID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)
echo "== poll-wait-t4-148 start $(date -u +%FT%TZ) boot=$BOOT_START boot_id=$CURBOOTID deadline=2026-11-19T19:30:00Z poll=45s gateA_RAM>=1024 (KHONG HA) gate0=T5-chinh/T4-check-only-du-phong(quyet-143-j) ngan-sach=3-attempt/dot(tren-dia)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
PREV_BOOTID="$CURBOOTID"
PREV_SEEN="$(date -u +%FT%TZ)"
PB="chua-chay"
PB_AGE="?"
i=0
while true; do
  i=$((i+1))
  NOW_S=$(date -u +%s)
  NOW_ISO=$(date -u +%FT%TZ)
  if [ "$NOW_S" -ge "$DEADLINE_S" ]; then
    # FIX F-143-T4-3 (dot 144): ghi ro GATE NAO DO luc het han (theo poll cuoi #((i-1))),
    # khong ghi chung "gate A khong mo" nhu ban cu.
    _RED=""
    [ "${T5S:-?}" != "PASS" ] && [ "${PB:-?}" != "0" ] && _RED="$_RED gate0(co-T5=${T5S:-?},postboot_exit=${PB:-?})"
    [ "${RAM:-0}" -lt 1024 ] 2>/dev/null && _RED="$_RED gateA-RAM(${RAM:-?}MB<1024)"
    _L1OK=$(awk -v a="${L1:-9}" 'BEGIN{print (a<2)?1:0}'); [ "$_L1OK" = 0 ] && _RED="$_RED load1(${L1:-?})"
    _L5OK=$(awk -v a="${L5:-9}" 'BEGIN{print (a<2)?1:0}'); [ "$_L5OK" = 0 ] && _RED="$_RED load5(${L5:-?})"
    [ -n "${BLOCKERS:-}" ] && [ "${BLOCKERS:-0}" != "0" ] && _RED="$_RED blockers(${BLOCKERS})"
    case "${LOCK:-khong}" in co:*) _RED="$_RED lock-co";; esac
    case "${TREE:-?}" in YES*) ;; *) _RED="$_RED cay(${TREE:-?})";; esac
    [ -z "$_RED" ] && _RED=" (khong xac dinh — poll cuoi toan xanh nhung cua khong mo?)"
    echo "HET HAN CHO 19:30Z 19/11 — 0 attempt — GATE DO LUC HET HAN (poll cuoi #$((i-1))):$_RED — dong theo brief dot 148 (han co 20:00Z)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    exit 5
  fi
  BOOTID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || echo ?)
  BTIME_S=$(grep btime /proc/stat | awk '{print $2}')
  BTIME_ISO=$(date -d "@$BTIME_S" -u +%FT%TZ 2>/dev/null || echo ?)
  if [ "$BOOTID" != "$PREV_BOOTID" ]; then
    echo "REBOOT PHAT HIEN poll #$i $NOW_ISO — boot cu ${PREV_BOOTID:0:8} chet trong khung ($PREV_SEEN, $NOW_ISO]; boot moi ${BOOTID:0:8} btime=$BTIME_ISO — reset gate 0 + PB, check-only chay lai ngay (gate0 du phong T4 ap dung cho boot moi; co T5 moi trong round148-t5/ van la chinh neu co)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
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
    if [ -n "$OWNPID" ] && ! kill -0 "$OWNPID" 2>/dev/null && [ -n "$OWNBOOT" ] && [ "$OWNBOOT" != "$CURB" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://localhost:${OWNPORT:-0}/" 2>/dev/null || echo 000)" = "000" ]; then
      LOCK="stale-boot:$(cat "$H/vite.lock/owner" 2>/dev/null | head -c 60 | tr '\n' ' ')"
    else
      LOCK="co:$(cat "$H/vite.lock/owner" 2>/dev/null | head -c 60 | tr '\n' ' ')"
    fi
  fi
  # QUYET PARENT dot 137 §12.3(i) — BAT BUOC dot 139 (khac F-137-T4-1):
  # CHUP ps snapshot TRUOC (1 lan ps duy nhat), roi DEM blockers TU snapshot do.
  # Thu tu: snapshot -> dem tren file da chup. File tam chi giu lai khi blockers>0.
  # FIX F-145-T4-2 (dot 146, giao theo quyet parent dot 145 (o)): dem blocker
  # theo TEN PROCESS thay vi chuoi con tren cmdline. Dot 145, grep [v]ite
  # dem nham shell T2 chay `md5sum ... vite.config.ts` (chi nhac ten file lam
  # doi so, khong phai tien trinh vite). Luat moi:
  #  - vite/probe/webkit: chi dem khi argv0 (token dau cua args) la node/vite
  #    (vite/probe/clicktest chay duoi node) VA args chua vite|probe116t5|
  #    probe115r5|probe114q5|webkit|WebProcess|MiniBrowser;
  #  - MiniBrowser/WebProcess/webkit: comm khop ten (webkit khong phan biet
  #    hoa/thuong) hoac argv0 chua MiniBrowser/WebKit;
  #  - LUU Y: comm cua node la "MainThread" (node dat ten thread), KHONG phai
  #    "node" — nen phai khop argv0 chu khong khop comm cho node (bai hoc tu
  #    test poll 11:39Z dot 146: luat comm-only bo sot vite that cua T8);
  #  - loai tru rieng: dong co 'md5sum ... vite.config.ts' (doi so file) hoac
  #    comm == md5sum — khong bao gio dem, du args co chua 'vite';
  #  - giu cac loai tru pipeline cu (run-t4/poll-/t4-attempt/postboot-check/
  #    poll-t3/sleep). Snapshot co them cot comm.
  #  So dem chuoi con cu van ghi lam THAM CHIEU (giong B4 dot 145).
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
    echo "poll #$i $NOW_ISO blockers=$BLOCKERS (comm-based, F-145-T4-2) legacy-chuoi-con=$BLOCKERS_LEGACY — snapshot da luu blockers-ps-$i.txt + blockers-list-$i.txt" >> "$W/poll-t4.log"
  else
    rm -f "$W/ps-snap-tmp.txt" "$W/blockers-matched-tmp.txt"
  fi
  MD5NOW=$(md5sum ~/workspace/repo-1/apps/web/src/preview.tsx | cut -c1-8)
  EXPECTED=$(cat "$W/tree-md5.txt" 2>/dev/null || echo "")
  if [ -z "$EXPECTED" ]; then TREE="CHUA-CO-MD5"; elif [ "$MD5NOW" = "$EXPECTED" ]; then TREE="YES:md5=$MD5NOW"; else TREE="MD5-KHAC:$MD5NOW(kyd=$EXPECTED)"; fi
  # --- gate 0: co T5 (uu tien round148-t5, du phong round147-t5 cung boot) ---
  T5S="chua-co"; T5SRC=""
  for _CAND in "$T5FLAG" "$T5FLAG_FALLBACK"; do
    if [ -f "$_CAND" ]; then
      _FMTIME=$(stat -c %Y "$_CAND" 2>/dev/null || echo 0)
      if [ "$_FMTIME" -ge "$BTIME_S" ] && grep -q "$BOOTID" "$_CAND" 2>/dev/null; then T5S="PASS"; T5SRC="$_CAND"; break
      elif [ "$_FMTIME" -ge "$BTIME_S" ]; then T5S="mtime-moi-khong-ghi-boot_id(KHONG-TINH)"; T5SRC="$_CAND"
      else T5S="cu(mtime-cu)"; T5SRC="$_CAND"; fi
    fi
  done
  # --- gate 0: check-only moi 4 poll ---
  if [ $((i % 4)) = 1 ] || [ "$PB" = "chua-chay" ]; then
    if bash "$POSTBOOT" > "$W/postboot-t4-148-gate0wait-$i.log" 2>&1; then PB=0; else PB=$?; fi
    PB_AGE=0
  else PB_AGE=$((PB_AGE+1)); fi
  APTX=$(pgrep -x apt-get | wc -l); DPKX=$(pgrep -x dpkg | wc -l); APTN=$((APTX + DPKX))
  DPKGLINES=$(wc -l < /var/log/dpkg.log 2>/dev/null || echo "?")
  # --- gate0 QUYET PARENT dot 143 §12.2(j) (dot 144): co T5 la CHINH; neu khong co co
  # T5 khop boot hien tai thi check-only CUA CHINH T4 PASS + tuoi <=3 poll la DU PHONG.
  GATE0OK=0; GATE0SRC="khong-dat"
  if [ "$T5S" = "PASS" ]; then GATE0OK=1; GATE0SRC="T5($T5SRC)"
  elif [ "$PB" = 0 ] && [ "$PB_AGE" -le 3 ]; then GATE0OK=1; GATE0SRC="T4-check-only(pb_age=${PB_AGE})"
  fi
  echo "poll #$i $NOW_ISO boot=${BOOTID:0:8} btime=$BTIME_ISO load1=$L1 load5=$L5 lock=$LOCK blockers=$BLOCKERS(comm-based,legacy=$BLOCKERS_LEGACY) RAMavail=${RAM}MB tree=$TREE t5flag=$T5S(t5src=${T5SRC##*round}) postboot_exit=$PB(pb_age=${PB_AGE}x45s) gate0=$GATE0SRC apt=$APTN(aptx=$APTX,dpkgx=$DPKX) dpkg_lines=$DPKGLINES" >> "$W/poll-t4.log"
  OK1=$(awk -v a="$L1" 'BEGIN{print (a<2)?1:0}')
  OK5=$(awk -v a="$L5" 'BEGIN{print (a<2)?1:0}')
  OKR=$(awk -v a="$RAM" 'BEGIN{print (a>=1024)?1:0}')
  LOCKOK=0; { [ ! -d "$H/vite.lock" ] || [ "${LOCK#stale-boot}" != "$LOCK" ]; } && LOCKOK=1
  TREEOK=0; [ "${TREE#YES}" != "$TREE" ] && TREEOK=1
  if [ "$GATE0OK" = 1 ] && [ "$PB" = 0 ] && [ "$APTN" = 0 ] && [ "$TREEOK" = 1 ] && [ "$OK1" = 1 ] && [ "$OK5" = 1 ] && [ "$OKR" = 1 ] && [ "$LOCKOK" = 1 ] && [ "$BLOCKERS" = 0 ]; then
    # VA DOT 145 (P1/P2): NGAN SACH THEO DOT — dem attempt DA XONG tren dia
    # (file attempt-done-* do run-attempt-148.sh ghi qua trap EXIT); attempt bi
    # reboot giet (SIGKILL) khong ghi duoc done -> KHONG TINH. TAG mang boot_id
    # 8 ky tu lay tuoi luc chay attempt (chong ghi de artifact boot cu, F-144-T4-4).
    count_done() { ls "$W"/attempt-done-* 2>/dev/null | wc -l; }
    USED=$(count_done)
    if [ "$USED" -ge 3 ]; then
      echo "NGAN SACH 3 ATTEMPT/DT DA HET (tren dia: $USED) — khong chay attempt moi, thoat poller" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 12
    fi
    ATT=$((USED+1))
    echo "CUA YEN MO poll #$i $NOW_ISO - gate0 $GATE0SRC + gateA du (RAM=${RAM}MB) - CHAY attempt$ATT NGAY (da dung $USED/3)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    # QUYET PARENT dot 139 (h) + dot 144 (b): toi da 3 attempt/DT. Ly do retry ghi ro:
    #   - "setup": khong co JSON (probe khong ghi duoc file / vite khong len / lock loi).
    #   - "partial": co JSON nhung <20 pass (wedged/timeout) - ghi partial, KHONG tinh verdict.
    #   - exit 10 (COVERAGE 0/N): DUNG, khong retry tu dong - cho agent quyet.
    #   - exit 0 (20/20): DUNG, thoat (chi khi lop B DAT 5/5).
    #   - attempt bi reboot giet: poller chet theo, agent chay lai poller; attempt do
    #     KHONG co attempt-done -> khong tinh vao ngan sach, ATT tiep tuc tu USED+1.
    while [ "$ATT" -le 3 ]; do
      BOOTSHORT=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null | cut -c1-8)
      TAG="attempt${ATT}-${BOOTSHORT}"
      bash "$W/run-attempt-148.sh" "$TAG" 2>&1 | tee -a "$W/chain-t4.log"
      RC=${PIPESTATUS[0]}
      USED=$(count_done)
      echo "== poll-wait-t4-148: $TAG chay xong, run-attempt exit=$RC, da-dung-ngan-sach=$USED/3 $(date -u +%FT%TZ)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
      if [ "$RC" = 0 ]; then
        # FIX F-142-T4-4 (no dot 142): poller phai kiem verdict LOP B truoc khi thoat.
        # exit 0 chi noi probe 20/20; neu lop B VI PHAM thi luot NHIEM TAI, retry nhu
        # tien le dot 128 (toi da 3 attempt/DT). Chi thoat khi B DAT 5/5.
        # VA DOT 147 (quyet parent dot 146 §12.3(j), sua F-146-T4-1): CONG tickCost
        # <=60 ms — poller CHI tuyen bo "LUOT HOP LE" khi ca lop B DAT 5/5 VA
        # tickCost median <=60 ms. Doc median tu analyze-t4-$TAG-tickcost.txt
        # (dong "tickCost total n=... median=..."). Median >60 hoac khong doc
        # duoc -> retry nhu lop-B-vi-pham (fail-closed).
        WHY_TC=""
        if grep -q "LOP-B-TONG: DAT 5/5" "$W/classb-t4-$TAG.txt" 2>/dev/null; then
          TC_MED=$(grep -oE 'tickCost total n=[0-9]+ median=[0-9.]+' "$W/analyze-t4-$TAG-tickcost.txt" 2>/dev/null | grep -oE 'median=[0-9.]+' | cut -d= -f2 | head -1)
          TC_OK=$(awk -v m="${TC_MED:-999}" 'BEGIN{print (m<=60)?1:0}')
          if [ -n "$TC_MED" ] && [ "$TC_OK" = 1 ]; then
            echo "$TAG 20/20 + LOP B DAT 5/5 + tickCost median=${TC_MED}ms <=60 - LUOT HOP LE, thoat poller" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 0
          fi
          if [ -z "$TC_MED" ]; then WHY_TC="tickCost KHONG DOC DUOC tu analyze-t4-$TAG-tickcost.txt (fail-closed, retry nhu vi pham)"; else WHY_TC="tickCost median=${TC_MED}ms >60 (cong F-146-T4-1)"; fi
          echo "$TAG 20/20 + LOP B DAT 5/5 NHUNG $WHY_TC - luot KHONG hop le, KHONG dung verdict" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
        else
          WHY_TC="lop-B-vi-pham (nhiem tai)"
          echo "$TAG 20/20 NHUNG LOP B VI PHAM - luot nhiem tai, KHONG dung verdict (xem classb-t4-$TAG.txt)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
        fi
        if [ "$USED" -ge 3 ]; then echo "$TAG khong hop le - DA HET 3 ATTEMPT/DT, khong co luot hop le - thoat poller (agent xem xet)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 11; fi
        echo "RETRY $ATT -> $((ATT+1)): ly do: $WHY_TC - con $((3-USED)) luot retry" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
        ATT=$((ATT+1)); sleep 10; continue
      fi
      if [ "$RC" = 10 ]; then echo "$TAG COVERAGE 0/N (exit 10) - DUNG retry tu dong, cho agent quyet (da dung $USED/3)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit 10; fi
      if [ "$USED" -ge 3 ]; then echo "$TAG loi (exit=$RC) - DA HET NGAN SACH 3 ATTEMPT/DT - thoat poller (agent xem xet)" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"; exit "$RC"; fi
      J="$W/preview-b-f3-flip-webkit-t4-$TAG.json"
      if [ -f "$J" ]; then WHY="partial (co JSON $(stat -c%s "$J")B, exit=$RC - wedged/timeout, KHONG tinh verdict)"; else WHY="setup (KHONG CO JSON, exit=$RC)"; fi
      echo "RETRY $ATT -> $((ATT+1)): ly do: $WHY - con $((3-USED)) luot retry" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
      ATT=$((ATT+1))
      sleep 10
    done
    echo "VONG ATTEMPT KET THUC MA KHONG CO LUOT HOP LE (ATT vuot 3) - thoat poller exit 11" | tee -a "$W/poll-t4.log" "$W/chain-t4.log"
    exit 11
  fi
  # VA DOT 145 (P4) TESTMODE: POLL_TEST=1 -> chay dung 1 poll roi thoat 7.
  if [ "${POLL_TEST:-0}" = "1" ]; then echo "TEST-POLL-OK poll #$i $NOW_ISO boot=${BOOTID:0:8} RAM=${RAM}MB load1=$L1 load5=$L5 gate0=$GATE0SRC t5flag=$T5S postboot_exit=$PB apt=$APTN dpkg_lines=$DPKGLINES" | tee -a "$W/poll-t4.log"; exit 7; fi
  sleep 45
done
