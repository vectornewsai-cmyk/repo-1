# PHASE9_ROUND172_T4_WEBKIT_QUIET41_LIMITS.md

**Đợt:** 172. **Luồng:** T4 — đo lượt yên WebKit #41 trên 1 boot
+ **#41 CÓ LƯỢT HỢP LỆ NGAY ATTEMPT1 — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 36**
  (ngân sách dùng 1/3; poller thoát 18:03:19Z vì ĐẠT,
  trước hạn cắt poller 19:30Z 1h26m, trước hạn cờ ~20:00Z
  ~1h56m; không reboot giữa phiên; poller 26 poll thật,
  1 lần cửa mở).
+ **P1 ĐÚNG 7/7 (p=2,9419e-07) + P3-A1 ĐÚNG 5/7 (p=0,00857241)**
  — cả hai phép thử nghiêm ngặt đều ĐÚNG đợt này (P3-A1 sát
  ngưỡng 0,01 — xem F-172-T4-3).
  **4 SEQ MỚI 242, 287, 407, 461** vào sổ distinct-seq
  (189 + 382 đã thấy); **3 DAT MỚI 287, 407, 461** (242 mới
  nhưng KHONG-DAT — stall 1).
+ **BOOT 4b9db449 (btime 17:02:05Z) — ỨNG VIÊN #81**
  (số hiệu giao T0-172 xác minh 9 nguồn); replay host-side
  KHÔNG CHẠY trên boot này — gate mở nhờ REPAIR SỚM của T5
  (POSTBOOT_PASS viết 17:50:32Z, mode repair-sớm-quyết-h,
  poll=1 — KHÔNG phải replay-đầy-đủ, xem F-172-T4-7).
+ **WORDING F-171-T9-9 ĐÃ SỬA (quyết (h) đợt 170):** trong
  LIMITS này T4 dùng đúng câu chữ mới — "không chạy script
  nào trong lúc probe pass chạy" (xem §0b + F-172-T4-5).
**Ngày:** 22/11/2026 (lượt cron 00:35 +07 23/11 = 17:35:51Z).
**Boot đo:** MỘT boot — 4b9db449 (btime 17:02:05Z, boot lúc mở
mới hơn giờ mở 33m46s; số hiệu reboot giao T0-172 xác minh —
ứng viên #81).
**Trạng thái:
#41 CÓ LƯỢT HỢP LỆ (attempt1-4b9db449: 20/20, lớp B 5/5,
tickCost median 46,0 ≤ 60 — LUOT HOP LE, poller thoát
18:03:19Z vì ĐẠT, trước hạn cắt poller 19:30Z 1h26m, trước
hạn cờ ~20:00Z ~1h56m). Ngân sách dùng 1/3. Cộng dồn LÊN 36
lượt hợp lệ: P1 143/146, P2 137/137, P3-A1 123/146, P3'
108/118 occurrence = 96/100 distinct-seq, P7 70/70. Sổ
distinct-seq THĂNG CẤP as-of-172 (96/100 distinct, occ 108/118,
4 seq mới 242 + 287 + 407 + 461, non_dat_in_union [242, 283, 364, 498]).
RAM <500 MB: 0/26 poll — SẠCH (lần thứ năm liên tiếp).
POSTBOOT_PASS cho boot 4b9db449 ĐÃ CÓ (17:50:32Z, T5-172 sở
hữu, mode repair-sớm-quyết-h, poll=1 — KHÔNG phải
replay-đầy-đủ); watcher-172 của T5 ĐANG CHẠY lúc đóng
(pid 17944, `replay-watch-172.sh`).**

## 0. Verdict tổng

- **#41 CÓ LƯỢT HỢP LỆ (attempt1-4b9db449).**
  Poller thoát 18:03:19Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 19:30Z còn 1h26m, hạn cờ ~20:00Z còn
  ~1h56m).
- **Attempt1-4b9db449 (17:59:27–18:03:19Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 46,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2940–3376 ms/pass): tickCost n=600, blendTick n=482
  (tBlend gap n=481), c2DrawLog n=1161.
  **tickCost total median= 46,0 ms (p90 76,0, max 134, min 28)**
  — DƯỚI NGƯỠNG 17,0 ms; hậu flip+2000 ms median 45,0.
  Per-pass median 38,0–57,0 ms (pass 6: 57,0 cao nhất;
  pass 1: 38,0 thấp nhất) trong khi load1 mean/pass
  0,89→2,43 và RAM mean/pass GIẢM 1435→1162 MB (tương quan
  Pearson median~load1 r=-0,47, median~RAM r=0,30 — không
  đáng kể, không kết luận nhân quả từ 1 lượt; xem
  F-172-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,46 ≤2,5; B2 load1
  max 2,47 ≤4 — sampler n=101 dòng gồm 1 header + 100 mẫu,
  xem F-168-T4-7; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (795→795); B5 RAM min 1130 MB,
  0 mẫu <500 MB, 0/101 mẫu <1024 MB — sạch hoàn toàn).
  **(c2)=7 occurrence / 6 distinct-seq** (seq 189, 242×2,
  287, 382, 407, 461 — cả 7 COVERED, delta
  +29/−55/−55/−22/−22/−21/+36 ms; blendTick hậu-flip 360/360
  trong ±500 ms của log) — ĐÃ CỘNG DỒN.
  P3' 5/7 DAT (stall 189:4, 287:4, 382:5, 407:3, 461:5;
  242 stall 1 KHONG-DAT ×2). lag≥+5f (b) = 2 occurrence
  (1 event, seq 241–242, max +6f — xem F-172-T4-3).
  p1p3p7 chạy TAY (F-148-T4-1): **P1 ĐÚNG 7/7** (cả 7 gần
  run-end ±1 tick [189, 242×2, 287, 382, 407, 461 trong 14
  run_end seqs], baseline 42/360, p=2,9419e-07 <0,01, n=7);
  **P2 ĐÚNG 7/7** (lag +1f ×5, +3f ×1, +6f ×1; 0 lag âm);
  **P3-A1 ĐÚNG 5/7** (5/7 đóng băng-tại-tick; baseline
  82/359, p=0,00857241 <0,01 — sát ngưỡng);
  **P7 ĐÚNG** (0/76 entry trễ ≥+1f; đối chứng 0/444).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.252.592 B (md5
  `d15263ab8367d9666fe2384fa1976c1f`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=68 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Poller — 1 instance thật + 1 test, 26 poll, 1 lần cửa mở,
  trên 1 boot (không reboot).** Gate0: khong-dat 13 poll,
  T5 12 poll (+1 test khong-dat), T4-check-only 0 poll
  (check-only FAIL cả phiên cho tới poll #17 — xem §4);
  RAM ≥1024: 26/26; RAM <500: **0/26**. load1<2: 13/26;
  load5<2: 8/26; blockers>0: 0 poll; apt>0: 17 poll (repair
  install + apt lẻ sau cờ — xem F-172-T4-8); lock=khong:
  25/25; dpkg 2→795.
- **Chuỗi lượt yên hợp lệ: LÊN 36 (35 → 36).** Cộng dồn MỚI:
  P1 143/146, P2 137/137, P3-A1 123/146, **P3' 108/118
  occurrence = 96/100 distinct-seq**, P7 70/70. Chuỗi median
  tickCost 36 lượt: 39,0–60,0 ms, mean 48,2 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #40 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. **Quyết parent (m)
  đợt 167 đã chốt: median đúng 60,0 mà lớp B sạch thì TÍNH
  ĐẠT (luật ≤60 giữ nguyên)** — poller đã cài `m<=60`;
  đợt này median 46,0 nên không cần áp dụng luật biên.
- **LUẬT CỨNG ĐỢT NÀY — KHÔNG CHẠY SCRIPT NÀO TRONG LÚC
  PROBE PASS CHẠY (wording MỚI theo F-170-T9-9 / quyết (h)
  đợt 170): TUÂN THỦ.** Trong cửa sổ probe pass
  (attempt1 17:59:31–18:02:50Z), T4 không chạy script nào
  (poller đang chạy nền; agent chỉ chờ background delivery);
  T4 cũng KHÔNG có lần kiểm giữa chừng nào trong cửa sổ này
  — mọi phân tích nặng (stats-172.py, helper distinct-seq-172
  back-test + live, p1p3p7 chạy tay, đọc analyzer) đều làm
  SAU khi poller thoát (từ ~18:03:33Z). Pre-flight postboot
  check-only (17:40:5xZ) + test poll (17:41:12Z) chạy TRƯỚC
  khi mở poller, ngoài cửa sổ attempt. Không chạy probe
  chạm dpkg nào trong cả phiên (chỉ đọc `wc -l` dpkg.log +
  `pgrep -x` — đọc, không chạm). Xem §0b + F-172-T4-5.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc đóng — không đổi; mọi
  poll đều tree=YES).
- **Cờ:** `hidden_files/round172-t4.done` viết ~18:1xZ 22/11
  (trong hạn cờ ~20:00Z, sớm hơn ~1h40m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1 + F-171-T4-7)

Chạy **trước mọi attempt, trước khi mở poller** (17:40–17:41Z),
ghi vào `hidden_files/round172-t4/preflight-172.txt` — **PASS**:

- **b.json CÓ trong `round172-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–171 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–171. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 13 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Deadline waiter epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG
  (bài học F-156-T8-3):** chuỗi deadline trong script
  `2026-11-22 19:30:00 UTC` → epoch **1795375800** =
  2026-11-22T19:30:00Z — khớp đúng hạn cắt poller 19:30Z
  (hạn cờ ~20:00Z = 1795377600, hạn cứng 20:30Z =
  1795379400); không còn sót dạng `16:30`/`13:30`/`14:00Z`/
  `14:30Z` nào trong script mới (grep 0 hit); grep `round171`
  trong mọi script làm việc chỉ còn fallback `round171-t5/`
  (có chủ đích, 3 hit trong poll-wait); `round170` 0 hit;
  `WebKit #40` 0 hit; `T4-171a` 0 hit; `default=171` 0 hit.
- **Copy-forward đợt 171 → 172:** deadline poller `16:30Z`
  → `19:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `17:00Z`/`17:30Z` → `20:00Z`/`20:30Z`; `brief dot 171` →
  `brief dot 172`; `poll-test-171`/`stats-171`/
  `distinct-seq-171` → 172; T5FLAG chính `round172-t5/` +
  fallback `round171-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` / `poll-wait-t4-172.sh` /
  `run-attempt-172.sh` ĐÃ LÀ `round172-t4` ngay sau copy**;
  `T4-171a` → `T4-172a` trong `run-attempt-172.sh`;
  `default=171` → `default=172` trong `distinct-seq-172.py`;
  `run-attempt-171.sh` → `run-attempt-172.sh` ở cả poll-wait
  (cả dòng gọi thật, dòng 269) lẫn comment; `WebKit #40` →
  `WebKit #41` trong run-attempt.
  **GREP BẮT ĐƯỢC 4 SÓT** (W trong poll-wait còn `round171-t4`,
  comment `poll-wait-t4-171.sh` trong run-attempt, `stats-171.py`
  trong stats, `distinct-seq-ledger-171-proposed` trong
  distinct-seq — đã sửa hết, grep lại 0 sót ngoài fallback
  T5 có chủ đích). F-168-T4-1 không tái diễn.
- **`cp -a` LẠI BÁO EPERM NHƯNG CLEANUP CHẠY VÔ ĐIỀU KIỆN
  (bài học F-170-T4-1 ĐÃ ÁP DỤNG):** `cp -a round171-t4
  round172-t4` báo `failed to preserve ownership` (EPERM)
  nhưng cleanup `rm` chạy KHÔNG chain `&&` nên vẫn chạy đủ
  (exit 0, thư mục sạch 22 file trước khi đổi tên script).
- **Freeze check (bài học F-164-T4-1):** thư mục `round171-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 17:35:51Z**
  (giờ mở đợt 172); `round170-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ: REPLAY CHƯA CHẠY — KHÁC MỌI MẪU TRƯỚC
  (xem F-172-T4-10):** boot 4b9db449 (btime 17:02:05Z,
  tuổi ~38m lúc mở), dpkg.log CHỈ 2 dòng
  (`startup packages configure` 17:02:37–38Z);
  `/var/log/apt/` KHÔNG TỒN TẠI (không có history.log);
  0 process apt-get/dpkg lúc mở; cờ T5-172 CHƯA CÓ lúc mở
  (thư mục `round172-t5/` chưa tồn tại); cờ T5-171 chỉ ghi
  boot 2acdd1ab, mtime 14:52:09Z < btime 17:02:05Z — KHÔNG
  tính cho boot mới (poller bỏ qua đúng luật: mtime cũ);
  postboot check-only chạy tay **exit 1 FAIL** (thiếu 5 lib
  + GST không tồn tại + 11 gói apt chưa cài — xem
  `preflight-postboot-172.log`); gate0 lúc mở là khong-dat,
  phải chờ cờ T5-172 (repair) hoặc replay xong. Đây là
  TRẠNG THÁI GATE, không phải lỗi setup — pre-flight PASS.
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 1028 MB (≥1024), load1 1,34/load5 1,15,
  gate0=khong-dat (postboot exit 1, pb_age 0), apt=0,
  dpkg 2 (xem `poll-test-172.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`,
  bài học F-171-T4-7).
- **RAM lúc mở DAO ĐỘNG MẠNH (xem F-171-T4-9 — tiếp diễn):**
  avail 663 MB lúc 17:38Z → 1332 MB lúc 17:39Z → 876 MB lúc
  17:40Z → 1028 MB lúc test poll 17:41:12Z — do các luồng
  khác; poller vẫn mở được cửa khi RAM ≥1024 và load hạ.

## 1. Poller — 26 poll thật, 1 lần cửa mở, trên 1 boot (không reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 4b9db449
  (17:41:12Z):** poll #1 RAM=1028 MB (≥1024), load1=1,34
  load5=1,15, blockers=0, gate0=khong-dat → cửa đóng
  (gate0) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll
  này nằm trong `poll-test-172.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 4b9db449, 25 poll (17:41:20–
  17:59:26Z), 1 lần cửa mở:** RAM ≥1024: 25/25 (min 1138,
  max 2504 MB); 500–1023: 0/25; **<500: 0/25**;
  load1<2: 12/25; load5<2: 7/25; gate0: **khong-dat 13,
  T5 12**; lock=khong 25/25; dpkg 2→795;
  blockers>0: 0 poll; apt>0: 17 poll.
- **Giai đoạn 1 — chờ gate0, replay/repair đang chạy (poll #1–#13,
  17:41:20–17:50:24Z):** gate0=khong-dat suốt giai đoạn
  (postboot exit 1 — 11 gói + GST chưa cài); apt=1 từ poll
  #2 (repair install của T5 đang chạy); load1 vọt 4,35
  (#9) — NGOÀI cửa sổ attempt, không tính B2; dpkg 2 dòng
  tới poll #12, nhảy lên 171 ở poll #13 (17:50:24Z,
  apt=2: apt-get + dpkg cùng chạy).
- **Giai đoạn 2 — cờ T5 xuất hiện, chờ gate A (poll #14–#25,
  17:51:09–17:59:26Z):** gate0=T5 từ poll #14 (cờ T5-172
  viết 17:50:32Z, mode repair-sớm-quyết-h, poll=1 — xem §4);
  postboot_exit vẫn =1 ở #14–#16 (check-only chạy mỗi 4 poll,
  lần chạy trước còn FAIL), chuyển =0 từ poll #17
  (17:53:25Z); load5 2,17→1,72 chặn cửa ở #15–#24 (load1
  đã <2 từ #22 nhưng load5 còn 2,12/2,05/1,92); apt=1 ở
  #19–#21 + #23–#24 (xem F-172-T4-8); poll #25 load1 0,90/
  load5 1,72, RAM 1748 MB, apt=0 → **CỬA MỞ, chạy attempt1**
  → HỢP LỆ ngay → poller thoát 18:03:19Z vì LUOT HOP LE.
- **Phân rã 26 poll thật:** RAM≥1024: 26/26; RAM 500–1023:
  0/26; RAM<500: **0/26**. load1<2: 13/26; load5<2: 8/26.
  **Stats "gan-mo" đếm 6 ≠ mở cửa thật 1 (xem F-172-T4-2):**
  heuristic chỉ kiểm load1<2 + load5<2 + RAM≥1024 mà KHÔNG
  kiểm gate0/apt/PB — 5 poll "gan-mo" còn lại đều bị chặn
  bởi gate0 khong-dat (#1 test, #1, #2, #3) hoặc apt=1
  (#24); chỉ #25 mở thật. Lệch gan-mo/mở-cửa LẦN ĐẦU
  (đợt 170/171 đều khớp) — heuristic cần ghi rõ giới hạn,
  poller vẫn đúng (chỉ mở khi đủ mọi điều kiện).
  gate0: T5 12 poll, khong-dat 14 poll (13 instance 2 + 1
  test), T4-check-only 0 poll (check-only FAIL tới #17 nên
  không có poll nào đi qua đường dự phòng). blockers>0: 0 poll.
  apt>0: 17 poll. **RAM <500 MB: 0/26 poll** — SẠCH, lần thứ
  năm liên tiếp (đợt 168: 0/26, đợt 169: 0/13, đợt 170: 0/22,
  đợt 171: 0/18). Ghi nhận để T9-172 đối chiếu headroom/balloon
  trên boot mới.

## 2. Attempt1 HỢP LỆ — lượt yên #41

- **Attempt1-4b9db449 (17:59:27–18:03:19Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 46,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2940–3376 ms/pass): tickCost n=600, blendTick n=482
  (tBlend gap n=481), c2DrawLog n=1161.
  **tickCost total median= 46,0 ms (p90 76,0, max 134, min 28)**
  — DƯỚI NGƯỠNG 17,0 ms; hậu flip+2000 ms median 45,0.
  Per-pass median 38,0–57,0 ms (pass 6: 57,0; pass 1: 38,0)
  trong khi load1 mean/pass 0,89→2,43 và RAM mean/pass
  GIẢM 1435→1162 MB (tương quan Pearson median~load1
  r=-0,47, median~RAM r=0,30 — không đáng kể, không kết
  luận nhân quả từ 1 lượt; xem F-172-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,46 ≤2,5 ĐẠT;
  B2 load1 max 2,47 ≤4 ĐẠT — sampler n=101 dòng (1 header
  + 100 mẫu, xem F-168-T4-7); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (795→795)
  ĐẠT; B5 RAM min 1130 MB, 0 mẫu <500 MB, **0/101 mẫu
  <1024 MB** — sạch hoàn toàn — ĐẠT).
  **(c2)=7 occurrence / 6 distinct-seq** (seq 189, 242×2,
  287, 382, 407, 461 — cả 7 COVERED, delta
  +29/−55/−55/−22/−22/−21/+36 ms; blendTick hậu-flip 360/360
  trong ±500 ms của log) — ĐÃ CỘNG DỒN.
  P3' 5/7 DAT (stall 189:4, 287:4, 382:5, 407:3, 461:5;
  242 stall 1 KHONG-DAT ×2). lag≥+5f (b) = **2 occurrence**
  (1 event, seq 241–242, max +6f — xem F-172-T4-3).
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG 7/7** (cả 7 gần
  run-end ±1 tick [189, 242×2, 287, 382, 407, 461 trong 14
  run_end seqs — 242 cách 241 đúng 1, 382 cách 381 đúng 1],
  baseline 42/360, p=2,9419e-07 <0,01, n=7);
  **P2 ĐÚNG 7/7** (lag +1f ×5, +3f ×1, +6f ×1; 0 lag âm);
  **P3-A1 ĐÚNG 5/7** (5/7 đóng băng-tại-tick; baseline
  82/359, p=0,00857241 <0,01 — sát ngưỡng);
  **P7 ĐÚNG** (0/76 entry trễ ≥+1f cho 7 seq; đối chứng
  toàn bộ drawSrc post: {-1: 297, 0: 147}, 0/444 entry).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.252.592 B (md5
  `d15263ab8367d9666fe2384fa1976c1f`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=68 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) 100%,
  (2) 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý 4/6 seq MỚI (242, 287, 407, 461); 2 seq ĐÃ THẤY
  (189, 382):** 189 đã DAT đợt 163, 382 đã DAT đợt 158 —
  không cộng thêm distinct; 242 + 287 + 407 + 461 mới vào
  sổ (xem §7); **242 mới nhưng KHONG-DAT** (stall 1) nên
  distinct DAT chỉ +3 (287, 407, 461); không seq nào
  KHÔNG DAT cũ chuyển thành DAT đợt này (non_dat_in_union
  cũ [283, 364, 498] giữ nguyên, thêm 242).
- **Ngân sách dùng 1/3.** Không cần retry (attempt1 hợp lệ
  ngay).

## 3. B2 spike trong cửa sổ attempt (theo nhiệm vụ đợt 172)

- **Attempt1 (17:59:27–18:03:19Z) — KHÔNG SPIKE: load1 max
  2,47 (≤4), RAM min 1130 MB.** Trong ps-before/after chỉ có
  vite của chính attempt + 2 lệnh sleep-monitor của luồng
  khác tail log T4 (pid 34426 `sleep 540`, pid 39403
  `sleep 360` — xem F-172-T4-9) + file `.done` của T2/T5
  viết trong cửa sổ (ghi file nhẹ, không phải script phân
  tích). Delta tick max: tBlend gap max 1889 ms; tickCost
  max 134 ms.
  **Đối chiếu sampler T9 (độc lập):** trong cửa sổ attempt,
  sampler T9 (60 s/mẫu, 4 mẫu) load1 max **2,35**, mem min
  1.164.436 kB (1.137 MB) — KHỚP sampler T4 (max 2,47, min
  1130 MB); **0 spike B2**. `b2-spikes.log` của T9 chỉ có
  1 spike 17:39:15Z (load1 3,45) — NGOÀI cửa sổ attempt
  (xem F-172-T4-1).
  **Kết luận: cửa sổ attempt1 hợp lệ sạch — đúng kỳ vọng.**
- **Ngoài cửa sổ attempt:** poll #9 (17:47:23Z) load1 4,35,
  load5 2,95 (repair install đang chạy); poll #6–#8 load1
  3,87–4,05 — KHÔNG tính là B2 spike trong cửa sổ attempt;
  chỉ ghi nhận là tải repair + các luồng khác trong lúc chờ
  gate.

## 4. Replay/postboot trên boot mới — cờ T5-172 ĐÃ CÓ (17:50:32Z, mode repair-sớm); không reboot giữa phiên

- **Boot 4b9db449 (btime 17:02:05Z, số hiệu giao T0-172 xác
  minh — ứng viên #81): replay host-side KHÔNG CHẠY.**
  Lúc T4 mở (17:40Z): dpkg.log 2 dòng, `/var/log/apt/` không
  tồn tại, postboot check-only exit 1 — KHÔNG có replay tự
  nhiên nào trên boot này (khác mọi mẫu trước: #77/#79/#80
  đều có replay tự nhiên). Theo T5-172: tới boot+39m34s vẫn
  0 hoạt động apt; watcher-172 early-repair trigger ngay poll
  đầu, `--repair` exit 0 sau 8m52s (update ~8,5 phút + 1
  transaction install 17:50:20–17:50:32Z — 11 gói thiếu +
  deps, dpkg 2→795). **T5-172: POSTBOOT_PASS mới viết
  17:50:32Z (boot+48m27s; dpkg 795 dòng; cache 110 .deb;
  lists 75; postboot PASS poll=1 độc lập exit 0; mode
  repair-sớm-quyết-h; cờ cũ 2acdd1ab lưu
  POSTBOOT_PASS-2acdd1ab; file marker `repaired-4b9db449`).**
  **CAVEAT (T5-172): cờ repair, KHÔNG phải replay-đầy-đủ**
  — không có receipt; ledger literal 106/170 (64 intent
  không cài, chỉ installable); GST symlink→debroot 269=269.
  Gate0=T5 từ poll #14 (17:51:09Z); attempt1 mở cửa qua
  đường (a) với cờ repair (poll #25, 17:59:27Z); check-only
  của T4 chuyển PASS từ poll #17 (17:53:25Z) nhưng không
  phải đường mở cửa (cờ T5 đã có trước).
  **Watcher-172 của T5 ĐANG CHẠY lúc T4 đóng** (pid 17944,
  `replay-watch-172.sh` — kiểm lúc ~18:1xZ).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 4b9db449 lúc poller khởi động (17:41:20Z), lúc
  attempt1, lúc poller thoát (18:03:19Z) và lúc kiểm cuối
  (~18:1xZ) — btime 17:02:05Z không đổi; 0 dòng REBOOT
  PHAT HIEN trong poll log.
- **Reboot MỚI TRƯỚC KHI MỞ (btime 17:02:05Z, boot 4b9db449):**
  đợt mở 17:35:51Z — boot mới hơn giờ mở 33m46s. Số hiệu
  (#81?) + xác minh 9 nguồn giao T0-172; **lưu ý mốc giờ:**
  aggregate 171 §12.3(d) đã xác minh 5 nguồn lúc đóng
  (btime 1795366925, gap #80→#81 = 9.064 s, marker sống qua
  33 reboot) — T0-172 xác minh đủ 9 nguồn. T4 không thấy
  poll nào trên boot cũ trong phiên này (poller mở sau
  reboot).
  Mù #96?/#95?/#94?/#88?/#77?/#78? giao T2-172 — T4 không tự mở mù.
- **85m4 / 86n2 / 84l10: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Đây là verdict của harness T8, T4 không đo và không suy
  đoán — giao T8-172 báo cáo. (T4 chỉ ghi: 0 kẹt quan sát
  được trong attempt của mình; probe không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND172_T4_WEBKIT_QUIET41_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round172-t4/`):**
  `poll-wait-t4-172.sh` (md5 `3dd95c11cbb9552c8fb17b524d5706aa`;
  deadline 19:30Z 22/11 + cờ T5 round172-t5/ + fallback round171-t5/
  + nhãn T4-172a),
  `run-attempt-172.sh` (md5 `2db1941698937b16e4f9f0db576ca86b`;
  đổi số vòng/đường dẫn/nhãn so với 171, lượt yên #41),
  `distinct-seq-172.py` (md5 `27179a7716e07666d1bc7e83b129d770`;
  đợt này ĐÃ DÙNG LIVE trên attempt hợp lệ — khi chạy từ
  `apps/web/scripts/` phải truyền `--ledger` trỏ tới sổ vì sổ
  không nằm cùng thư mục — nếu không, helper lỗi
  FileNotFoundError thay vì in số sai, xem §7).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–171, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round172-t4/` — theo đúng mẫu 149–171: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round172-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–171).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-172.sh`, `run-attempt-172.sh`,
  `t4-attempt-inner.sh` (W = round172-t4 + glob check nhiễu
  chéo round172-*), `check-classb-t4.sh` (W = round172-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-172.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 36 lượt — P1 143/146, P2
  137/137, P3-A1 123/146, P3' 108/118 = 96/100, P7 70/70;
  chuỗi median n=36 mean 48,2 — xem F-172-T4-5),
  `distinct-seq-172.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-172: 96/100 distinct, occ 108/118, valid_rounds_p3 24,
  non_dat_in_union [242, 283, 364, 498], md5
  `235eaff7a1d1342efe8a88981d34f40e` — nguồn thật cho T4-173),
  `distinct-seq-ledger-172-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-ledger-172-backtest171-proposed.json` (bản
  helper ghi ra trong back-test — nội dung KHỚP HỆT sổ
  as-of-171 gốc, giữ làm audit trail),
  `distinct-seq-172-backtest171.txt` (output helper back-test —
  KHỚP live 171),
  `distinct-seq-172-live.txt` (output helper live trên
  attempt1-4b9db449),
  `preflight-172.txt` + `preflight-postboot-172.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1 + F-168-T4-1 + F-169-T4-1/3/4 + F-170-T4-1
  + F-171-T4-7).
- **Log/evidence (hidden_files/round172-t4/, không stage):**
  `poll-t4.log` (25 poll instance 2 + CUA YEN MO ×1 + LUOT
  HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-172.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`,
  `postboot-t4-172-gate0wait-*.log` (check-only các poll
  #1/#5/#9/#13/#17/#21/#25),
  `stats-172-output.txt` (output stats-172.py),
  `preview-b-f3-flip-webkit-t4-attempt1-4b9db449.json`
  (3.252.592 B, 20/20, md5
  `d15263ab8367d9666fe2384fa1976c1f`)
  + `run-webkit-t4-attempt1-4b9db449.log`
  + `load-mid-t4-attempt1-4b9db449.log`
  + `ps-before/after-t4-attempt1-4b9db449.txt`
  + `classb-t4-attempt1-4b9db449.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-4b9db449-*.txt` (11 file,
  gồm p1p3p7 chạy tay cho attempt1 — xem F-148-T4-1)
  + `coverage-check-attempt1-4b9db449.txt` ((c2) 7/7)
  + `attempt-done-attempt1-4b9db449` (exit 0).
  `vite-5187-t4-attempt1-4b9db449.log` (vite log attempt)
  + `stop-sampler-t4-attempt1-4b9db449` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  attempt) + `marker-t4-attempt1-4b9db449` (marker).
  (`analyze-l7-labellag.txt` + `lag5-detail.txt` là file phụ
  analyzer tự ghi lại trong lúc chạy — có mặt từ các đợt
  trước, không stage.)
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§5); không process T4 nào còn sống lúc đóng
  (poller đã thoát 18:03:19Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000;
  `/tmp/.X11-unix/` còn X194/X195 của suite T1 — X193 của
  attempt đã dọn tay, xem §6 F-172-T4-6).

## 6. Sai số F-172-T4-1..10 (+ nợ cũ)

- **F-172-T4-1 — SPIKE B2-WATCHER 17:39:15Z DO CHÍNH LỆNH TÌM
  AGGREGATE CỦA T4 (lỗi phối hợp — chính T4 gây tải, ngoài
  cửa sổ attempt, 0 thiệt hại).** `b2-spikes.log` của T9 ghi
  1 spike duy nhất trong phiên: 17:39:15Z load1 3,45 — top
  process là `grep -rln 12.3 .../hidden_files/` (pid 5960,
  34,6% CPU) + `find . -maxdepth 2 -name POSTBOOT_PASS*`
  (pid 6478) của chính T4 lúc tìm file aggregate 171 để đọc
  §4 + §12.3 theo nhiệm vụ. Load1 3,45 < 4 nên KHÔNG phải
  vi phạm B2; spike xảy ra TRƯỚC khi poller mở (17:41:20Z)
  và NGOÀI mọi cửa sổ attempt — verdict không ảnh hưởng.
  Bài học: lần tìm file nặng trước giờ mở vẫn gây spike
  quan sát được — T4-173 nên dùng `ls`/`grep` hẹp thay cho
  `grep -r` toàn cây khi poller sắp mở.
- **F-172-T4-2 — STATS "GAN-MO" ĐẾM 6 ≠ MỞ CỬA THẬT 1
  (heuristic đếm thừa — lần đầu lệch, poller vẫn đúng).**
  `stats-172.py` đếm "gan-mo" = load1<2 + load5<2 + RAM≥1024
  đồng thời, KHÔNG kiểm gate0/apt/PB: ra 6 (test #1, #1,
  #2, #3, #24, #25) trong khi chỉ #25 mở cửa thật. 4 poll
  đầu bị chặn bởi gate0 khong-dat (postboot exit 1), #24 bị
  chặn bởi apt=1. Đợt 170/171 heuristic khớp đúng số mở cửa
  (3=3) nên không ai để ý giới hạn này. Poller không sai
  (chỉ mở khi đủ MỌI điều kiện, kể cả gate0 + apt=0 + PB=0).
  Ghi nhận để T10 kiểm: số "gan-mo" trong §A KHÔNG được
  dùng làm số cửa mở — số đúng là 1 (poll #25).
- **F-172-T4-3 — (c2) LAG +6f (seq 242, label 17) + (b) = 2
  OCCURRENCE — 242 MỚI NHƯNG KHONG-DAT (stall 1).**
  Labellag (a)/(b): >=5f: 2 (phân phối lag {'0': 144,
  '<0': 44, '1-2': 334, '3-4': 60, '5-9': 2}); lag5 (b)
  liệt kê 2 occurrence thành 1 event (M=23: seq 241 + 242,
  tBlend 45191–45341, lag max +6f). Trong (c2), seq 242 xuất
  hiện 2 occurrence với 2 label khác nhau (label 17 lag +6f,
  label 20 lag +3f) — cùng strip seq quan sát ở 2 tick khác
  nhau; cả 2 đều stall 1 → KHONG-DAT. **P2 vẫn ĐÚNG 7/7**
  (luật P2 = 0 lag âm; tiền lệ đợt 170: +3f vẫn ĐÚNG).
  **P4 (tiêu chí T3, GAP §1734) KHÔNG ĐÚNG đợt này**
  (thuần +1f = 5/7, lag ≥+5f = 1 occ ≠ 0) — P4 không thuộc
  cộng dồn của T4, chỉ ghi nhận cho T3/T10. **P3-A1 ĐÚNG
  nhưng SÁT NGƯỠNG** (5/7, p=0,00857241 <0,01 — biên chỉ
  0,0014). Lag +6f trong (c2) là lớn nhất trong các lượt
  gần đây (170: +3f; 171: toàn +1f) — ghi nhận theo dõi,
  không mở điều tra (chỉ giám sát thụ động theo quyết
  parent đợt 137).
- **F-172-T4-4 — LOAD1 MEAN/PASS TĂNG 0,89→2,43 + RAM
  MEAN/PASS GIẢM 1435→1162 MB TRONG LÚC ĐO HỢP LỆ (cùng họ
  F-171-T4-4; r không đáng kể).** Per-pass load1 mean: pass 1:
  0,89 → pass 17: 2,43 (tăng gần đơn điệu rồi giữ ~2,3);
  RAM mean/pass giảm 1435→1162 MB (r=-0,47 / 0,30 — không
  đáng kể). `ps-before/after` attempt1 chỉ thấy vite của
  chính attempt + 2 lệnh sleep-monitor tail log (xem
  F-172-T4-9); ngoài cửa sổ có T9 sampler + T2/T5 viết
  `.done` + T8 waiter đang chạy. B2 ĐẠT theo load (max 2,47
  ≤ 4) là chính; tickCost median 46,0 vẫn dưới ngưỡng 17,0
  ms. Ghi nhận, không kết luận nhân quả từ 1 lượt.
- **F-172-T4-5 — WORDING F-170-T9-9 ĐÃ SỬA + TUÂN THỦ LUẬT
  KHÔNG CHẠY SCRIPT TRONG LÚC PROBE PASS CHẠY (ghi rõ để
  T10 kiểm).** Từ đợt này LIMITS T4 dùng đúng câu chữ mới:
  "không chạy script nào trong lúc probe pass chạy" (thay
  cho câu cũ "không chạy script phân tích nặng trong cửa sổ
  attempt" — quyết (h) đợt 170). Tuân thủ đợt này:
  trong cửa sổ probe pass (17:59:31–18:02:50Z), T4 không chạy
  script nào (poller đang chạy nền; agent chỉ chờ background
  delivery — KHÔNG có cả lần kiểm giữa chừng nào). Phân tích
  nặng làm SAU khi poller thoát (từ ~18:03:33Z: stats-172.py,
  helper distinct-seq-172 back-test + live, p1p3p7 chạy tay,
  đọc analyzer). Pre-flight postboot check-only (17:40:5xZ)
  + test poll (17:41:12Z) chạy trước poller, ngoài cửa sổ
  attempt. Không chạy probe chạm dpkg nào trong cả phiên
  (chỉ đọc `wc -l` dpkg.log + `pgrep -x`). Không có vi phạm.
  **Nhắc T2/T5 (theo nhiệm vụ đợt 172):** T2 không chạy script
  phân tích nặng trong cửa sổ attempt của T4; T5 không probe
  chạm dpkg trong cửa sổ attempt của T4 — B4 giữ nguyên
  (delta dpkg trong cửa sổ = 0).
- **F-172-T4-6 — X11 3 SOCKET LÚC ĐÓNG; X193 CỦA T4 ĐÃ DỌN
  TAY, X194/X195 CỦA SUITE T1 ĐỂ T8 DỌN (cùng mẫu F-171-T4-6).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (mtime
  17:59:30Z — đúng lúc attempt1 mở Xvfb :193), X194 + X195
  (mtime 17:45:11Z — của suite T1, khớp F-172-T1-2). 0 Xvfb
  còn chạy. T4 đã dọn tay socket X193 (rm -f); kiểm lại còn
  X194/X195 lúc đóng — giao T8-172 dọn. **Đính chính nhỏ:**
  T5-172 ghi "3 socket X193/X194/X195 mtime 17:45Z" — mốc
  17:45Z là lúc T5 kiểm (trước khi attempt1 tạo lại X193 lúc
  17:59:30Z); X193 lúc đóng là socket của attempt T4, không
  phải của suite T1.
- **F-172-T4-7 — POSTBOOT_PASS #81 Ở MODE REPAIR-SỚM
  (KHÔNG PHẢI REPLAY-ĐẦY-ĐỦ — KHÔNG PHẢI SAI SỐ, CHỈ GHI
  NHẬN + CAVEAT CHO GATE).** Cờ T5-172 viết 17:50:32Z ở mode
  repair-sớm-quyết-h (poll=1, ledger literal 106/170, GST
  symlink) vì replay host-side KHÔNG CHẠY trên boot #81
  (T5-172). Gate attempt1 mở qua đường (a) với cờ repair này.
  Tiền lệ: #75 mode repair đã được chấp nhận cho gate
  (quyết (j)/(b) đợt 168). T4 chỉ ghi dữ kiện, KHÔNG tự kết
  luận giá trị gate repair-mode cho chuỗi FULL PASS — giao
  T10-172 + parent quyết.
- **F-172-T4-8 — apt=1 Ở 5 POLL SAU KHI CỜ T5 ĐÃ CÓ
  (#19–#21, #23–#24), dpkg ỔN ĐỊNH 795 — process apt-get
  KHÔNG XÁC ĐỊNH.** Các poll 17:54:55–17:58:41Z (trừ #22
  apt=0) đều thấy `pgrep -x apt-get` = 1 trong khi dpkg.log
  giữ nguyên 795 dòng (không có install nào chạy — install
  của repair đã kết thúc 17:50:32Z). Poller chỉ đếm process,
  không ghi tên lệnh đầy đủ nên không xác định được là
  apt-get của luồng nào (ứng viên: verify của T5, apt-check
  của luồng khác). NGOÀI cửa sổ attempt nên không ảnh hưởng
  verdict; giao T5-172 đối chiếu.
- **F-172-T4-9 — `.done` CỦA T2 (18:00Z) + T5 (18:02Z) VIẾT
  TRONG CỬA SỔ ATTEMPT CỦA T4 + 2 LỆNH SLEEP-MONITOR TAIL
  LOG T4 (ghi nhận, KHÔNG vi phạm).** Chain-t4.log dòng
  "round172-* files modified after marker": `round172-t2.done`
  + `round172-t5.done` (ghi file nhẹ khi T2/T5 đóng cờ);
  ps-before/after attempt1 thấy 2 lệnh `sleep 540` /
  `sleep 360` tail log T4 (pid 34426/39403 — monitor của
  luồng khác, chỉ sleep + tail, không chạy script phân tích).
  Load1 max trong cửa sổ vẫn 2,47 ≤4, B2 ĐẠT, tickCost median
  46,0 sạch. Ghi nhận để T10 đối chiếu lịch các luồng trong
  cửa sổ 17:59–18:03Z.
- **F-172-T4-10 — REPLAY HOST-SIDE #81 KHÔNG CHẠY — MẪU MỚI
  (KHÔNG PHẢI SAI SỐ, CHỈ GHI NHẬN).** Lần đầu T4 mở poller
  trên boot chưa từng có replay tự nhiên: lúc mở (17:40Z,
  boot+38m) dpkg 2 dòng, không `/var/log/apt`, postboot
  check-only exit 1; gate chỉ mở sau khi watcher-172 của T5
  repair sớm (cờ 17:50:32Z). Khác mẫu #79 (replay chạy trong
  phiên) và #80 (replay xong trước khi mở poller). Không có
  poll nào bị apt chặn sai luật (apt>0 chỉ chặn cửa đúng
  thiết kế); hướng (3) vẫn đứng theo T5-172.
- **F-171-T4-7 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  Kiểm process lúc đóng dùng bracket trick (`pgrep -f
  "poll-wait-t4-172[.]sh"`) — 0 process T4, 0 self-match.
- **F-170-T4-1 — KHÔNG TÁI DIỄN (đã áp dụng bài học).**
  `cp -a` vẫn báo EPERM nhưng cleanup chạy vô điều kiện
  (không chain `&&`) nên thư mục làm việc sạch đúng 22 file
  trước khi đổi tên script.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "189,242,242,287,382,407,461"`, exit 0) — xem §2.
  Nợ đứng ở mức cơ chế (script chưa tự gọi p1p3p7) vẫn còn —
  mỗi đợt có attempt hợp lệ T4 phải chạy tay và ghi rõ.

## 7. P3' cộng dồn (MỚI — 36 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 172 (MỚI): P1 143/146, P2 137/137,
  P3-A1 123/146, P3' 108/118 occurrence = 96/100 distinct-seq,
  P7 70/70** (36 lượt hợp lệ — #41 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 171 §6: "35 lượt hợp lệ" — nay 36).
- **Đóng góp lượt #41 (attempt1-4b9db449, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=7 occurrence / 6 distinct-seq [189, 242×2, 287, 382,
  407, 461], trong đó 4 seq MỚI [242, 287, 407, 461] nhưng
  chỉ 3 DAT MỚI [287, 407, 461] (242 KHONG-DAT).
  - **P1 — ĐÚNG 7/7 occ** (cả 7 gần run-end ±1 tick: trong 14
    run_end seqs; baseline 42/360, p=2,9419e-07 trên distinct
    7 occ — verdict ĐÚNG theo luật DEF §3 vì n=7 ≥3 và p<0,01).
    Cộng dồn 136/139 → **143/146**.
  - **P2 ĐÚNG — 7/7 occ** (lag +1f ×5, +3f ×1, +6f ×1; 0 lag
    âm). Cộng dồn 130/130 → **137/137**.
  - **P3-A1 — ĐÚNG 5/7 occ** (5/7 seq đóng băng-tại-tick;
    baseline 82/359, p=0,00857241 — verdict ĐÚNG theo luật
    DEF §5 vì 5/7 ≥2/3 VÀ p<0,01). Cộng dồn 118/139 →
    **123/146**.
  - **P3' 5/7 occ ĐẠT** (189 stall 4, 287 stall 4, 382 stall 5,
    407 stall 3, 461 stall 5; 242 stall 1 KHONG-DAT ×2).
    Cộng dồn 93/96 → **96/100 distinct** (3 seq DAT MỚI —
    287, 407, 461; 242 mới nhưng KHONG-DAT); occurrence
    103/111 → **108/118**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 40, 0: 36}; đối chứng toàn bộ drawSrc post: {-1: 297,
    0: 147}, 0/444 entry). Cộng dồn 69/69 → **70/70**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–171).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-172.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 171: 93/96 distinct, occ 103/111), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-172-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live:** helper-172 trên
  stall + c2coverage attempt3-171 với sổ as-of-170 (bản
  backtest171-proposed đợt 171 — nội dung bằng sổ as-of-170
  gốc) → ra 93/96 distinct, 103/111 occ — khớp hệt live 171;
  bản proposed của back-test KHỚP HỆT sổ as-of-171 gốc
  (dict bằng nhau, so sánh bằng nhau).
  Helper ĐÃ ĐƯỢC KIỂM CHỨNG trước live.
  **Live đợt 172:** sổ + stall/c2coverage
  attempt1-4b9db449 → **96/100 distinct, 108/118 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 172,
  96/100 distinct, occ 108/118, valid_rounds_p3 24,
  non_dat_in_union [242, 283, 364, 498] (thêm 242 — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `235eaff7a1d1342efe8a88981d34f40e`).
- **Kiểm chứng seq 189/242/287/382/407/461 đợt 172:**
  helper (đọc sổ) xác nhận **242 + 287 + 407 + 461 MỚI**
  (chưa có trong sổ — seen_c2 96 seq VÀ seen_dat 93 seq đều
  không chứa 4 seq này); **189 + 382 ĐÃ THẤY** (189 DAT đợt
  163, 382 DAT đợt 158). Tính tay: distinct DAT 93 + 3 =
  **96**; distinct tổng 96 + 4 = **100**; occurrence DAT
  103 + 5 = **108**, tổng 111 + 7 = **118**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — và được củng cố:** lượt hợp lệ mới
  (7 occ, 4 seq mới) có P1 ĐÚNG 7/7 (p~2,9e-07) + P3-A1 ĐÚNG
  5/7 (p~8,6e-03) — cả hai phép thử nghiêm ngặt đều ĐÚNG đợt
  này; P3' prereg (stall) DAT 5/7. Wedge không xảy ra đợt
  này (0 wedge — chuỗi 0-wedge tiếp tục từ đợt 169).
- Chuỗi median tickCost 36 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / 56,0 / 53,5 / 40,0 / 43,0 /
  **46,0 ms** (trung bình 48,2 ms; min 39,0, max 60,0; 0 lượt
  vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại (chỉ ghi nhận mẫu
  lag (c2) chủ yếu +1f ở F-172-T4-3 là nhất quán, trừ 242
  +6f/+3f).

## 8. Chờ quyết parent / nợ đợt 173

- **(a) #41 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 36.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** — attempt1-4b9db449 hợp lệ trên boot 4b9db449 (btime
  17:02:05Z, boot đo lúc mở); gate mở 17:59:27Z qua đường (a)
  (cờ T5 repair 17:50:32Z — xem (e)). O8 chạy trên boot nào,
  có qua gate chuẩn hay phải dùng thủ tục (i), là do T8/T10
  quyết; T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (cùng mẫu đợt 171) —
  cờ `.done` viết ~18:1xZ, trong hạn cờ ~20:00Z.
- **(b) P3' cộng dồn MỚI 36 lượt: P1 143/146, P2 137/137,
  P3-A1 123/146, P3' 108/118 = 96/100, P7 70/70:** helper đã
  chạy live (back-test khớp live 171); sổ
  distinct-seq-ledger.json đã thăng cấp as-of-172 (96/100
  distinct, occ 108/118, valid_rounds_p3 24, non_dat [242,
  283, 364, 498]). **Chờ parent/T10 quyết:** ghi nhận cộng
  dồn mới. T10 kiểm lại phép cộng khi viết aggregate (§12).
- **(c) REBOOT MỚI TRƯỚC KHI MỞ (btime 17:02:05Z, boot
  4b9db449 — ứng viên #81) — giao T0-172 xác minh số hiệu +
  9 nguồn; giao T7-172/T2-172 kiểm tra run 171 có bị viết lại
  tại reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 17:02:05Z; đợt mở 17:35:51Z (boot mới hơn giờ mở
  33m46s); poller mở sau reboot nên không có poll nào trên
  boot cũ trong phiên này; 0 reboot trong phiên.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1/F-168-T4-1/F-169-T4-1/3/4/F-170-T4-1/
  F-171-T4-7 TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng, BỔ SUNG 2 MỤC:** stats "gan-mo" KHÔNG được dùng làm
  số cửa mở (F-172-T4-2 — heuristic đếm thừa khi gate0/apt
  chặn); tránh `grep -r` toàn cây trước giờ mở poller
  (F-172-T4-1 — tự gây spike quan sát được). T4-173 áp dụng
  y hệt checklist này + grep thêm số cộng dồn cứng trong
  stats-*.py (F-169-T4-3) + lệnh kiểm chạy ngoài echo
  (F-169-T4-1) + kiểm poller thoát bằng chain log, không dùng
  pgrep -f (F-169-T4-4).
- **(e) POSTBOOT_PASS cho boot mới 4b9db449 ĐÃ CÓ (17:50:32Z,
  boot+48m27s, mode repair-sớm-quyết-h, poll=1): GHI NHẬN +
  CAVEAT.** Đây là cờ REPAIR, KHÔNG phải replay-đầy-đủ
  (T5-172: ledger literal 106/170, GST symlink, không
  receipt). Tiền lệ #75 mode repair đã được chấp nhận cho
  gate (quyết (j)/(b) đợt 168) — T4 ghi dữ kiện, T10/parent
  quyết giá trị gate này cho chuỗi FULL PASS. Watcher-172
  ĐANG CHẠY lúc T4 đóng.
- **(f) RAM <500 MB: 0/26 poll — SẠCH.** Lần thứ năm liên tiếp
  không có poll nào <500 MB; đợt 171: 0/18, đợt 170: 0/22,
  đợt 169: 0/13, đợt 168: 0/26. Ghi nhận để T9-172 đối chiếu
  headroom/balloon trên boot mới.
- **(g) P3-A1 ĐÚNG 5/7 (p=0,00857241, SÁT NGƯỠNG 0,01) +
  P1 ĐÚNG 7/7 (p=2,9419e-07): GHI NHẬN.** Cả hai phép thử
  nghiêm ngặt đều ĐÚNG đợt này; P3' prereg DAT 5/7; điều tra
  (c2) vẫn ĐÓNG. lag≥+5f (b) = 2 occurrence, max +6f
  (F-172-T4-3) — ghi nhận theo dõi, không mở điều tra.
  P4 (tiêu chí T3) KHÔNG ĐÚNG đợt này (lag ≥+5f = 1 occ) —
  ghi nhận cho T3/T10, không thuộc cộng dồn T4.
- **(h) B4 SẠCH (delta=0 trong cửa sổ attempt): GHI NHẬN.**
  dpkg ổn định 795 trong cửa sổ attempt (795→795); replay
  không chạy trong cửa sổ (repair kết thúc 17:50:32Z, trước
  khi attempt mở 17:59:27Z); apt=1 ở 5 poll chờ gate là
  ngoài cửa sổ attempt (F-172-T4-8 — giao T5 đối chiếu).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 17:59:27Z
  (poll #25, gate0 T5) → attempt1 HỢP LỆ 18:03:19Z
  trên boot 4b9db449 → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #41, boot đo 4b9db449, gate qua
  đường (a) với cờ repair — xem (e)). T8 tự quyết O8 trên
  boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 171 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#78?/#88?/#94?/#95?/#96? giao
  T2 (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết
  (b) đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-172
  theo dõi tiếp, hole-recheck lần 16); (m) #81 thuộc
  T2-172 + parent đợt 172; (m) #56 lần 15 thuộc T2-172;
  FULL127/FULL128 thuộc T2-172 (kiểm lại FULL125/FULL126 độc
  lập); birefnet 0 thử (đợt này không thử — lần 26); u2net
  là fallback chính thức; kết cục run 171 thuộc T7-172;
  **POSTBOOT_PASS #80 ĐÃ CÓ từ đợt 171** (chỉ còn ý nghĩa
  hồ sơ — boot #80 đã chết); **điều tra riêng 84l10 đợt đầu
  thuộc T8-172** (quyết (i) đợt 171); **đề xuất sửa (f) của
  (1c') thuộc T8-172** (quyết (i) đợt 171).

## A. Phụ lục số liệu (script trích từ log gốc — stats-172.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-172.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T17:41:12Z - 2026-11-22T17:41:12Z, boot=4b9db449
   RAM min=1028 max=1028 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 0
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 25 poll, 2026-11-22T17:41:20Z - 2026-11-22T17:59:26Z, boot=4b9db449
   RAM min=1138 max=2504 >=1024: 25/25 500-1023: 0/25 <500: 0/25
   load1<2: 12/25 load5<2: 7/25 blockers>0: 0 apt>0: 17
   gate0: T5=12, khong-dat=13
   lock: khong=25
   dpkg 2->795
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 26
-- RAM toan phien: min=1028 max=2504 >=1024: 26/26 <500: 0/26
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 6/26
   gan-mo? #1 2026-11-22T17:41:12Z boot=4b9db449 RAM=1028 L1=1.34 L5=1.15 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #1 2026-11-22T17:41:20Z boot=4b9db449 RAM=1601 L1=1.23 L5=1.13 blk=0 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #2 2026-11-22T17:42:06Z boot=4b9db449 RAM=1499 L1=1.62 L5=1.23 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #3 2026-11-22T17:42:51Z boot=4b9db449 RAM=1420 L1=0.97 L5=1.12 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-22T17:58:41Z boot=4b9db449 RAM=1830 L1=1.38 L5=1.92 blk=0 apt=1 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t5/POSTBOOT_PASS) lock=khong t5=PASS
   gan-mo? #25 2026-11-22T17:59:26Z boot=4b9db449 RAM=1748 L1=0.90 L5=1.72 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 4b9db449: 26 poll; RAM>=1024 lan cuoi: 2026-11-22T17:59:26Z #25; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 36 luot hop le): P1 143/146 P2 137/137 P3-A1 123/146 P3' 108/118 occ = 96/100 distinct-seq P7 70/70
-- chuoi median 36 luot: n=36 mean=48,2 min=39,0 max=60,0 vuot-60: 0
```
