# PHASE9_ROUND168_T4_WEBKIT_QUIET37_LIMITS.md

**Đợt:** 168. **Luồng:** T4 — đo lượt yên WebKit #37 trên 1 boot
+ **#37 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 32**
  (attempt1-576ca271 HỢP LỆ ngay lần thử đầu trên boot mới
  576ca271; không reboot giữa phiên; poller chỉ 25 poll).
+ **P1 ĐÚNG 3/3 LẦN ĐẦU VỚI n=3** (p=0,00276) — cả 3 seq (c2)
  đều gần run-end; **P3-A1 SAI 3/3** (p=0,0149 — trượt bar
  p<0,01 dù 3/3 đóng băng-tại-tick; baseline đóng băng cao
  24,6% — xem F-168-T4-2); **2 SEQ MỚI 239, 406** vào sổ
  distinct-seq.
+ **BOOT MỚI 576ca271 (btime 05:32:46Z) LÀ ROOTFS TRỐNG/
  REBUILD** như boot b643911f đợt 167 (dpkg.log 2 dòng lúc
  mở, apt history.log không tồn tại, GST 0 plugin, thiếu
  11 gói apt) — nhưng lần này replay XONG NHANH (POSTBOOT_
  PASS 06:01:38Z, boot+28m52s, dpkg 795) nhờ repair-sớm của
  T5-168, KHÔNG cần reboot giữa phiên như đợt 167.
**Ngày:** 22/11/2026 (lượt cron 12:35 +07 22/11 = 05:35:51Z).
**Boot đo:** MỘT boot — 576ca271 (btime 05:32:46Z, boot lúc mở,
mới hơn giờ mở 3m05s; số hiệu reboot giao T0-168 xác minh —
sau #74).
**Trạng thái:
#37 CÓ LƯỢT HỢP LỆ (attempt1-576ca271: 20/20, lớp B 5/5,
tickCost median 56,0 ≤ 60 — LUOT HOP LE, poller thoát
06:06:06Z vì ĐẠT, trước hạn cắt poller 07:30Z 1h23m54s, trước
hạn cờ ~08:00Z ~1h54m). Ngân sách dùng 1/3. Cộng dồn LÊN 32
lượt hợp lệ: P1 121/124, P2 115/115, P3-A1 104/124, P3'
88/96 occurrence = 80/83 distinct-seq, P7 66/66. Sổ
distinct-seq THĂNG CẤP as-of-168 (80/83 distinct, occ 88/96,
2 seq mới 239 + 406, seq 335 đã có trong sổ — 0 seq không-DAT
cũ chuyển DAT). RAM <500 MB: 0/26 poll — SẠCH (lần đầu kể từ
đợt 165). POSTBOOT_PASS cho boot mới 576ca271 ĐÃ CÓ
(06:01:38Z, T5-168 sở hữu); watcher-168 ĐANG CHẠY lúc đóng.**

## 0. Verdict tổng

- **#37 CÓ LƯỢT HỢP LỆ (attempt1-576ca271).**
  Poller thoát 06:06:06Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 07:30Z còn 1h23m54s, hạn cờ ~08:00Z còn
  ~1h54m).
- **Attempt1-576ca271 (06:02:10–06:06:06Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 56,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2860–3587 ms/pass): tickCost n=584, blendTick n=471
  (tBlend gap n=470 — xem F-167-T4-2, quy ước đếm gaps),
  c2DrawLog n=1129.
  **tickCost total median= 56,0 ms (p90 77,0, max 126, min 28)**
  — DƯỚI NGƯỠNG 4,0 ms (không sát như 59,0 đợt 167);
  hậu flip+2000 ms median 58,0. Per-pass median 36,0–62,5 ms
  (pass 2: 36,0; pass 7: 39,0; pass 17: 62,5; pass 13: 62,0;
  pass 20: 62,0) trong khi load1 mean/pass TĂNG ĐỀU 1,94→3,31
  và RAM mean/pass GIẢM 1445→1116 MB (tương quan Pearson
  median~load1 r=0,63, median~RAM r=-0,66 — vừa, không kết
  luận nhân quả từ 1 lượt; xem F-168-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 2,07 ≤2,5; B2 load1
  max 3,31 ≤4 — sampler n=101 dòng gồm 1 header + 100 mẫu,
  xem F-168-T4-7; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (795→795); B5 RAM min 1115 MB,
  0 mẫu <500 MB, 0/101 mẫu <1024 MB — sạch hoàn toàn).
  **(c2)=3** (seq 239, 335, 406 — cả 3 COVERED, delta +18/−21/
  +29 ms; blendTick hậu-flip 342/342 trong ±500 ms của log)
  — ĐÃ CỘNG DỒN.
  P3' 3/3 DAT (stall 4/3/4). lag≥+5f (b) = 0 occurrence — sạch.
  p1p3p7 chạy TAY (F-148-T4-1): **P1 ĐÚNG 3/3** (cả 3 seq gần
  run-end, baseline 48/342, p=0,00276 <0,01, n=3 — lần đầu
  P1 ĐÚNG với n=3, xem F-168-T4-3); **P2 ĐÚNG 3/3** (lag +1f
  ×3, 0 lag âm); **P3-A1 SAI 3/3** (3/3 đóng băng-tại-tick
  nhưng p=0,0149 ≥0,01 — trượt bar p, xem F-168-T4-2);
  **P7 ĐÚNG** (0/28 entry trễ ≥+1f; đối chứng 0/418).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.208.365 B (md5
  `ab6cfb9dac6cb727b7255e6e675aba90`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=70 tick).
- **Poller — 1 instance thật, 25 poll, 1 lần cửa mở, 0 reboot.**
  Gate0: khong-dat 24 poll, T5 1 poll (poll #25, 06:02:10Z).
  RAM ≥1024: 25/25 (min 1267 MB); RAM <500: **0/25**.
  load1<2: 15/25; load5<2: 9/25; blockers>0: 0 poll; apt>0:
  19 poll. dpkg 2→795.
- **Chuỗi lượt yên hợp lệ: LÊN 32 (31 → 32).** Cộng dồn MỚI:
  P1 121/124, P2 115/115, P3-A1 104/124, **P3' 88/96
  occurrence = 80/83 distinct-seq**, P7 66/66. Chuỗi median
  tickCost 32 lượt: 39,0–60,0 ms, mean 48,5 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #36 (quyết (m) đợt 167):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào. **Quyết parent (m)
  đợt 167 đã chốt: median đúng 60,0 mà lớp B sạch thì TÍNH
  ĐẠT (luật ≤60 giữ nguyên)** — poller đã cài `m<=60`;
  đợt này median 56,0 nên không cần áp dụng luật biên.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu, lúc đóng — không đổi; mọi poll
  đều tree=YES).
- **Cờ:** `hidden_files/round168-t4.done` viết ~06:1xZ 22/11
  (trong hạn cờ ~08:00Z, sớm hơn ~1h50m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1 + F-167-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (05:42Z),
ghi vào `hidden_files/round168-t4/preflight-168.txt` — **PASS**:

- **b.json CÓ trong `round168-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–167 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–167. **vite.t4-temp.config.mjs md5
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
  `2026-11-22 07:30:00 UTC` → epoch **1795332600** =
  2026-11-22T07:30:00Z — khớp đúng hạn cắt poller 07:30Z
  (hạn cờ ~08:00Z = 1795334400, hạn cứng 08:30Z =
  1795336200); không còn sót dạng `04:30`/`05:00Z`/`05:30Z`
  nào trong script mới (grep 0 hit — xem F-168-T4-1 về dạng
  `04:30:00Z`); grep `round167` trong mọi script làm việc
  chỉ còn fallback `round167-t5/` (3 chỗ có chủ đích) +
  `t4-167`/`t4-166` 0 hit (xem F-168-T4-1).
- **Copy-forward đợt 167 → 168:** deadline poller `04:30Z`
  → `07:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `05:00Z`/`05:30Z` → `08:00Z`/`08:30Z`; `brief dot 167` →
  `brief dot 168`; `poll-test-167`/`stats-167`/
  `distinct-seq-167` → 168; T5FLAG chính `round168-t5/` +
  fallback `round167-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round168-t4` ngay sau copy**;
  `T4-167a` → `T4-168a` trong `run-attempt-168.sh`;
  `default=167` → `default=168` trong `distinct-seq-168.py`.
  **BẮT ĐƯỢC KHI COPY (F-168-T4-1):** literal
  `run-attempt-167.sh` ở **dòng 269 (lệnh gọi thật)** +
  trong comment dòng 7/41/47 + `poll-test-167.log` (dòng 62)
  + `2026-11-22T04:30:00Z` (dòng 64/66 — dạng này KHÔNG
  chứa `04:30Z` nên replace đầu tiên trượt) +
  `stats-167.py`/`poll-test-167.log` trong `stats-168.py`
  (dòng 39 mở file thật — nếu không sửa, stats sẽ lỗi
  FileNotFoundError) + `distinct-seq-167.py`/
  `distinct-seq-ledger-167-proposed.json` trong docstring
  helper — grep bắt được, ĐÃ SỬA hết sang 168 trước khi
  chạy (nếu không: lệnh gọi run-attempt-167.sh sẽ lỗi vì
  file đã đổi tên; stats-168.py không chạy được).
  **HELPER distinct-seq back-test TRƯỚC LIVE: PASS** — chạy
  helper 168 trên stall + c2coverage attempt1 đợt 167 với sổ
  as-of-165 → ra 78/81 distinct, 85/93 occ — KHỚP hệt live
  167; sổ gốc KHÔNG đổi (md5 `3668db01…` trước/sau như nhau;
  xem `distinct-seq-168-backtest167-proposed.json`).
- **Freeze check (bài học F-164-T4-1):** thư mục `round167-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 05:35:51Z**
  (giờ mở đợt 168); `round166-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ KHÔNG ĐẠT (không phải lỗi setup):**
  boot 576ca271 (btime 05:32:46Z, tuổi ~10m lúc mở),
  dpkg.log CHỈ 2 dòng lúc kiểm đầu; `/var/log/apt/history.log`
  KHÔNG TỒN TẠI; `/var/log` gần như trống — rootfs mới/
  rebuild (cùng mẫu boot b643911f đợt 167); cờ T5-168 CHƯA CÓ
  lúc mở (thư mục `round168-t5/` chưa tồn tại); cờ T5-167
  chỉ ghi boot 194efd93 (#74), mtime 04:10:23Z < btime
  05:32:46Z — KHÔNG tính cho boot mới; postboot check-only
  chạy tay **exit 1** (CHƯA ĐỦ — thiếu 11 gói apt, thư mục
  GST không tồn tại, GST 0 plugin; xem
  `preflight-postboot-168.log`). Lúc mở chưa thấy process
  apt-get/dpkg nào chạy (apt=0 ở test poll) — replay chưa
  bắt đầu lúc T4 mở; T5-168 repair 05:47Z rồi apt-get update
  chạy (T5 sở hữu).
- **Test poll (POLL_TEST=1): TEST-POLL-OK (exit 7 đúng thiết kế)** —
  poll #1 RAM 769 MB (<1024), load1 5,80/load5 2,25,
  gate0=khong-dat (postboot exit 1, cờ T5 cũ), apt=0
  (replay chưa chạy), dpkg 2 (xem `poll-test-168.log`).
  TEST-POLL-OK chỉ in ngay trước `exit 7` trong code nên
  dòng này trong log là bằng chứng exit 7.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**

## 1. Poller — 26 poll thật, 1 lần cửa mở, trên 1 boot (không reboot)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 576ca271
  (05:43:02Z):** poll #1 RAM=769 MB (<1024), load1=5,80
  load5=2,25, blockers=0, gate0=khong-dat → cửa đóng
  (RAM <1024 + gate0 + load) → **TEST-POLL-OK exit 7 đúng
  thiết kế**. Poll này nằm trong `poll-test-168.log`;
  thống kê §A đã hợp nhất.
- **Instance 2 — boot 576ca271, 25 poll (05:44:05–
  06:02:10Z), 1 lần cửa mở:** RAM ≥1024: 25/25 (min 1267,
  max 2781 MB); 500–1023: 0/25; **<500: 0/25**;
  load1<2: 15/25; load5<2: 9/25; gate0: **khong-dat 24,
  T5 1**; lock=khong 25/25; dpkg 2→795; blockers>0: 0
  poll; apt>0: 19 poll.
- **Giai đoạn 1 — chờ replay bắt đầu (poll #1–#10,
  05:44–05:51Z):** RAM 1614–2781 MB (đạt), load1 6,89 lúc
  đầu rồi hạ dần; dpkg KẸT 2 dòng; apt=0 ở 6 poll đầu
  (replay chưa chạy), apt=1 từ poll #11 (apt-get update
  của T5-168 chạy từ ~05:47Z). Poll #1: RAM 1614 MB,
  load1 6,89/load5 3,34 — load chặn.
- **Giai đoạn 2 — cửa sổ load+RAM đạt nhưng gate0 chặn
  (poll #17–#24, 05:56–06:01Z):** 8 poll load+RAM cùng đạt
  (RAM 1267–1914 MB, load1 0,70–1,31, load5 1,32–1,76) —
  tất cả đều gate0=khong-dat + apt=1 (replay đang chạy) nên
  cửa KHÔNG mở. Stats đếm "gan-mo" 9 poll (8 poll này +
  poll #25 mở cửa thật) — chỉ 1 là mở cửa thật (xem
  F-168-T4-5, cùng họ F-167-T4-4).
- **Giai đoạn 3 — CỬA MỞ (poll #25, 06:02:10Z):** load1
  1,89/load5 1,51, RAM 1836 MB, **gate0=T5** (POSTBOOT_PASS
  06:01:38Z), apt=0, dpkg 795 → **CỬA MỞ, chạy attempt1**
  → HỢP LỆ → poller thoát 06:06:06Z vì LUOT HOP LE.
- **Phân rã 26 poll thật:** RAM≥1024: 25/26; RAM 500–1023:
  1/26 (chỉ test poll); RAM<500: **0/26**. load1<2: 15/26;
  load5<2: 9/26. 9 poll mà load + RAM cùng đạt — chỉ 1 là
  poll mở cửa (#25 instance 2); 8 poll còn lại bị
  gate0=khong-dat + apt=1 chặn. gate0: T5 1 poll,
  khong-dat 25 poll. blockers>0: 0 poll. apt>0: 19 poll.
  **RAM <500 MB: 0/26 poll** — SẠCH, lần đầu kể từ đợt 165
  (0/13); đợt 166: 1/16 (chỉ test poll); đợt 167: 38/119
  (toàn boot cũ b643911f). Ghi nhận để T9-168 đối chiếu
  headroom/balloon trên boot mới.

## 2. Attempt1 HỢP LỆ — lượt yên #37

- **Attempt1-576ca271 (06:02:10–06:06:06Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 56,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2860–3587 ms/pass): tickCost n=584, blendTick n=471
  (tBlend gap n=470 — xem F-167-T4-2), c2DrawLog n=1129.
  **tickCost total median= 56,0 ms (p90 77,0, max 126, min 28)**
  — DƯỚI NGƯỠNG 4,0 ms (không sát như 59,0 đợt 167);
  hậu flip+2000 ms median 58,0. Per-pass median 36,0–62,5 ms
  (pass 2: 36,0; pass 7: 39,0; pass 13: 62,0; pass 17: 62,5;
  pass 20: 62,0) trong khi load1 mean/pass TĂNG ĐỀU 1,94→3,31
  và RAM mean/pass GIẢM 1445→1116 MB (tương quan Pearson
  median~load1 r=0,63, median~RAM r=-0,66 — vừa, không kết
  luận nhân quả từ 1 lượt; xem F-168-T4-4).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 2,07 ≤2,5 ĐẠT;
  B2 load1 max 3,31 ≤4 ĐẠT — sampler n=101 dòng (1 header
  + 100 mẫu, xem F-168-T4-7); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (795→795)
  ĐẠT; B5 RAM min 1115 MB, 0 mẫu <500 MB, **0/101 mẫu
  <1024 MB** — sạch hoàn toàn — ĐẠT).
  **(c2)=3** (seq 239, 335, 406 — cả 3 COVERED, delta
  +18/−21/+29 ms; blendTick hậu-flip 342/342 trong ±500 ms
  của log) — ĐÃ CỘNG DỒN.
  P3' 3/3 DAT (stall 4/3/4). lag≥+5f (b) = **0 occurrence** —
  sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 ĐÚNG 3/3** (cả 3 seq gần
  run-end [239, 335, 406 trong 16 run_end seqs], baseline
  48/342, p=0,00276 <0,01, n=3 — lần đầu P1 ĐÚNG với n=3,
  xem F-168-T4-3); **P2 ĐÚNG 3/3** (lag +1f ×3: (239,16,15),
  (335,15,14), (406,15,14); 0 lag âm); **P3-A1 SAI 3/3**
  (3/3 đóng băng-tại-tick nhưng p=0,0149 ≥0,01 — trượt bar
  p, xem F-168-T4-2); **P7 ĐÚNG** (0/28 entry trễ ≥+1f cho
  3 seq; đối chứng toàn bộ drawSrc post 0/418).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 3.208.365 B (md5
  `ab6cfb9dac6cb727b7255e6e675aba90`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=70 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) nhan 100%,
  (2) pixel-verified 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý seq 239/406 MỚI:** 2 seq chưa có trong sổ
  distinct-seq (seen_c2 + seen_dat) nên cộng thêm distinct
  (xem §6); seq 335 ĐÃ CÓ trong sổ. Không seq nào KHÔNG DAT
  cũ chuyển thành DAT đợt này (non_dat_in_union [283, 364, 498]
  không đổi).
- **Caveat B2 attempt1-576ca271 — CÓ 2 process luồng khác
  trong ps (xem F-168-T4-4):** `ps-before/after` liệt kê
  T2 `m56-168.py` (pid 35159) và T5 `t5-stats-168.py`
  (pid 36869) — script phân tích của luồng khác đang chạy
  trong lúc đo; B2 DAT theo load (3,31 ≤ 4) là chính.
  Các process vite liệt kê là của chính attempt.

## 3. Replay/postboot trên boot mới — cờ T5-168 ĐÃ CÓ (06:01:38Z); không reboot giữa phiên

- **Boot 576ca271 (btime 05:32:46Z, số hiệu giao T0-168 xác
  minh — sau #74): replay XONG NHANH (boot+28m52s).**
  Lúc T4 mở (05:42Z): dpkg.log 2 dòng, apt history.log
  không tồn tại, GST 0 plugin, thiếu 11 gói apt — rootfs
  mới/rebuild (cùng mẫu boot b643911f đợt 167). Khác đợt 167:
  lần này T5-168 repair-sớm 05:47Z (`repaired-576ca271`),
  apt-get update chạy từ ~05:47Z; dpkg 2→795 trong ~15 phút
  (06:01Z); **T5-168: POSTBOOT_PASS mới viết 06:01:38Z
  (boot+28m52s; dpkg 795 dòng; cache 110 .deb; lists 75;
  postboot PASS poll=1 độc lập exit 0; replay-đầy-đủ; cờ cũ
  194efd93 lưu POSTBOOT_PASS-194efd93)**. Gate0=T5 từ poll
  #25 (06:02:10Z). T4 chỉ ghi số, không tự kết luận replay
  có "đầy đủ" không (postboot check-only PASS là đủ cho
  gate0 theo quyết (j) đợt 143) — nhưng lần này cờ T5 đã có
  nên gate0 đi đường chính.
  **Watcher-168 của T5 ĐANG CHẠY lúc T4 đóng** (pid 13133,
  replay-watch-168.sh).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:**
  boot 576ca271 lúc poller khởi động (05:44:05Z), lúc
  attempt1, lúc poller thoát (06:06:06Z) và lúc kiểm cuối
  (06:08:56Z) — btime 05:32:46Z không đổi; 0 dòng REBOOT
  PHAT HIEN trong poll log.
- **Reboot MỚI TRƯỚC KHI MỞ (btime 05:32:46Z, boot 576ca271):**
  đợt mở 05:35:51Z — boot mới hơn giờ mở 3m05s. Số hiệu
  (#75?) + xác minh 9 nguồn giao T0-168; dữ kiện overlap
  (nếu có) giao T0/T5 đối chiếu — T4 không thấy poll nào
  trên boot cũ trong phiên này (poller mở sau reboot).
  Mù #96?/#95?/#94?/#88?/#77? giao T2-168 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND168_T4_WEBKIT_QUIET37_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round168-t4/`):**
  `poll-wait-t4-168.sh` (md5 `02bcd9138ab8896705acc5b98d939145`;
  deadline 07:30Z 22/11 + cờ T5 round168-t5/ + fallback
  round167-t5/ + nhãn T4-168a),
  `run-attempt-168.sh` (md5 `c848db9981703b5b8cfe8516a0210d95`;
  đổi số vòng/đường dẫn/nhãn so với 167, lượt yên #37),
  `distinct-seq-168.py` (md5 `a66b92f83a463ad4de31c482e57e9cf1`;
  HELPER đọc sổ distinct-seq-ledger.json; đợt này ĐÃ DÙNG
  LIVE trên attempt hợp lệ — khi chạy từ `apps/web/scripts/`
  phải truyền `--ledger` trỏ tới sổ vì sổ không nằm cùng
  thư mục — nếu không, helper lỗi FileNotFoundError thay vì
  in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–167, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round168-t4/` — theo đúng mẫu 149–167: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round168-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–167).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-168.sh`, `run-attempt-168.sh`,
  `t4-attempt-inner.sh` (W = round168-t4 + glob check nhiễu
  chéo round168-*), `check-classb-t4.sh` (W = round168-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-168.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 32 lượt — P1 121/124, P2
  115/115, P3-A1 104/124, P3' 88/96 = 80/83, P7 66/66;
  chuỗi median n=32 mean 48,5),
  `distinct-seq-168.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-168: 80/83 distinct, occ 88/96, valid_rounds_p3 20,
  non_dat_in_union [283, 364, 498], md5
  `90f71f1363707dc705f60037562ad580` — nguồn thật cho T4-169),
  `distinct-seq-ledger-168-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-ledger-asof165-backtest.json` (bản sao sổ
  as-of-165 dùng cho back-test — md5 `3668db01…`, KHÔNG đổi),
  `distinct-seq-168-backtest167-proposed.json` (bản helper ghi
  ra trong back-test — khớp live 167: 78/81, occ 85/93,
  giữ làm audit trail),
  `distinct-seq-168-backtest167.txt` (output helper back-test),
  `distinct-seq-168-live.txt` (output helper live trên
  attempt1-576ca271),
  `preflight-168.txt` + `preflight-postboot-168.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1
  + F-167-T4-1).
- **Log/evidence (hidden_files/round168-t4/, không stage):**
  `poll-t4.log` (25 poll instance 2 + CUA YEN MO ×1 + LUOT
  HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-168.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `poll-test-168-run.log`, `chain-t4.log`,
  `postboot-t4-168-gate0wait-*.log` (check-only các poll),
  `stats-168-output.txt` (output stats-168.py),
  `preview-b-f3-flip-webkit-t4-attempt1-576ca271.json`
  (3.208.365 B, 20/20, md5
  `ab6cfb9dac6cb727b7255e6e675aba90`)
  + `run-webkit-t4-attempt1-576ca271.log`
  + `load-mid-t4-attempt1-576ca271.log` (sampler 101 dòng =
  1 header + 100 mẫu)
  + `ps-before/after-t4-attempt1-576ca271.txt`
  + `classb-t4-attempt1-576ca271.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-576ca271-*.txt` (11 file, gồm
  p1p3p7 chạy tay — xem F-148-T4-1)
  + `coverage-check-attempt1-576ca271.txt` ((c2)=3/3)
  + `attempt-done-attempt1-576ca271` (exit 0, 06:06:06Z).
  `vite-5187-t4-attempt1-576ca271.log` (vite log attempt) +
  `stop-sampler-t4-attempt1-576ca271` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  attempt) + `marker-t4-attempt1-576ca271` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 06:06:06Z vì LUOT HOP LE;
  vite :5187 + lock trống, curl 000; `/tmp/.X11-unix/` còn
  X194/X195 của suite T8 — X193 của attempt đã dọn tay,
  xem §5 F-168-T4-6).

## 5. Sai số F-168-T4-1..8 (+ nợ cũ)

- **F-168-T4-1 — COPY-FORWARD: literal TÊN SCRIPT CŨ + DẠNG
  DEADLINE `04:30:00Z` KHÔNG ĐƯỢC THAY BỞI REPLACE ĐẦU
  (đã sửa trước khi chạy, 0 thiệt hại — cùng họ F-167-T4-1).**
  Sau khi copy 167→168 và replace `round167`→`round168` +
  `t4-167`→`t4-168`, còn sót: literal `run-attempt-167.sh`
  ở **dòng 269 (lệnh gọi thật)** + comment dòng 7/41/47 +
  `poll-test-167.log` (dòng 62) + **`2026-11-22T04:30:00Z`
  (dòng 64/66 — chuỗi này KHÔNG chứa `04:30Z` nên replace
  `04:30Z`→`07:30Z` trượt)** + `stats-167.py`/
  `poll-test-167.log` trong `stats-168.py` (dòng 39 mở file
  thật — nếu không sửa, stats lỗi FileNotFoundError) +
  `distinct-seq-167.py`/`distinct-seq-ledger-167-proposed.json`
  trong docstring helper. Grep bắt được trước khi chạy; ĐÃ
  SỬA hết sang 168. Nếu không bắt: lệnh gọi
  run-attempt-167.sh sẽ lỗi (file đã đổi tên), deadline in
  log sai (không ảnh hưởng DEADLINE_S thật — dòng 57 đã đúng
  07:30:00 UTC), và stats-168.py không chạy được.
  **Bài học đứng:** sau replace, grep thêm cả dạng giờ đầy đủ
  `HH:MM:00Z` (không chỉ `HH:MMZ`) + tên file `NNN.sh`/
  `NNN.log`/`NNN.py` không chứa `t4-`/`round` — bổ sung vào
  checklist pre-flight đợt 169 (xem §7 (d)).
- **F-168-T4-2 — P3-A1 SAI 3/3 (p=0,0149) — TRƯỢT BAR p<0,01
  DÙ 3/3 ĐÓNG BĂNG-TẠI-TICK.**
  Attempt1-576ca271: (c2) 239/335/406 đều đóng băng-tại-tick
  (3/3); baseline đóng băng 84/341 = 24,6% (cao) → p nhị
  thức = 0,0149 ≥ 0,01 → verdict SAI theo luật DEF §5
  (ĐÚNG cần ≥2/3 VÀ p<0,01; YẾU chỉ khi n<3). Đây là lần
  đầu P3-A1 SAI với n=3 (trước đây SAI ở lượt quyết định #14
  với 3/6, p=0,125; các đợt 165–167 đều YẾU vì n=1).
  **Không phải bằng chứng chống đóng băng:** 3/3 seq đóng
  băng-tại-tick là dữ kiện ủng hộ đóng băng; chỉ là bar p
  nghiêm ngặt không đạt vì baseline cao. P3' prereg (stall)
  vẫn DAT 3/3. Cộng dồn occurrence vẫn +3/3 (104/124).
  Điều tra (c2) VẪN ĐÓNG (chỉ giám sát thụ động theo quyết
  parent đợt 137) — verdict SAI của một phép thử nghiêm
  ngặt không mở lại điều tra (không có tiêu chí mở lại nào
  theo §13 DEF v0.5 xảy ra). Ghi nhận để T10/T2 đối chiếu.
- **F-168-T4-3 — P1 ĐÚNG 3/3 LẦN ĐẦU VỚI n=3 (p=0,00276).**
  Cả 3 seq (c2) đều gần run-end (239, 335, 406 trong 16
  run_end seqs); baseline 48/342 = 14,0%; p nhị thức =
  0,00276 < 0,01; n=3 ≥3 → verdict ĐÚNG theo luật DEF §3
  (P1 signed đối chiếu: cùng 48/342, p=0,00276). Trước đây
  P1 chỉ YẾU (n=1, đợt 167) hoặc ĐÚNG với n lớn hơn ở các
  lượt cũ. Cộng dồn P1 118/121 → **121/124**.
- **F-168-T4-4 — LOAD1 MEAN/PASS TĂNG ĐỀU 1,94→3,31 TRONG
  LÚC ĐO; PS CÓ 2 PROCESS LUỒNG KHÁC (cùng họ F-167-T4-10).**
  Per-pass load1 mean: pass 1: 1,94 → pass 17: 3,31 (tăng
  gần như đơn điệu); RAM mean/pass giảm 1445→1116 MB
  (r=0,63 / -0,66). `ps-before/after` liệt kê T2
  `m56-168.py` (pid 35159) và T5 `t5-stats-168.py` (pid
  36869) đang chạy trong lúc attempt — script phân tích của
  luồng khác, không phải process nặng thường trực. B2 DAT
  theo load (max 3,31 ≤ 4) là chính; load1 max 3,31 là cao
  nhất trong các attempt hợp lệ gần đây (đợt 167: 2,09).
  tickCost median 56,0 vẫn dưới ngưỡng 4,0 ms. Ghi nhận,
  không kết luận nhân quả từ 1 lượt; giao T2/T5 đối chiếu
  lịch chạy script của mình trong cửa sổ 06:02–06:06Z.
- **F-168-T4-5 — STATS "gan-mo" ĐẾM 9, MỞ CỬA THẬT CHỈ 1
  (cùng họ F-166-T4-7/F-167-T4-4).**
  8 poll instance 2 (#17–#24) có load+RAM cùng đạt nhưng
  gate0=khong-dat + apt=1 (replay đang chạy) nên cửa KHÔNG
  mở. Script stats-168.py đếm "gan-mo" theo load+RAM (9 poll)
  mà không trừ gate0/apt/blockers — T10 đừng nhầm 9 poll
  gan-mo thành 9 lần mở cửa; mở cửa thật chỉ 1 (#25,
  06:02:10Z).
- **F-168-T4-6 — X11 3 SOCKET LÚC ĐÓNG; X193 CỦA T4 ĐÃ DỌN
  TAY, X194/X195 CỦA SUITE T8 ĐỂ T8 DỌN (cùng mẫu
  F-167-T1-2/F-167-T4-9).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (mtime
  06:02Z — đúng lúc attempt1 mở Xvfb :193), X194 + X195
  (mtime 05:45Z — trước attempt, của suite T8). 0 Xvfb còn
  chạy. T4 đã dọn tay socket X193 (rm -f); kiểm lại còn
  X194/X195 lúc đóng — giao T8-168 dọn (lần thứ hai liên
  tiếp cùng 3 số display X193/X194/X195).
- **F-168-T4-7 — SAMPLER n: classb GHI 101, perpass GHI 100
  — QUY ƯỚC ĐẾM KHÁC NHAU, KHÔNG PHẢI SAI SỐ (cùng họ
  F-167-T4-8).**
  File load-mid có 101 dòng = 1 dòng header "sampler-start"
  + 100 mẫu dữ liệu (`grep -c 'load='` = 100). classb đếm
  bằng `wc -l` (101, gồm header); perpass đếm mẫu dữ liệu
  (100). Giữ cách ghi của classb như các đợt trước.
  Không ảnh hưởng verdict B2 (load1 max 3,31 tính trên mẫu
  dữ liệu).
- **F-168-T4-8 — F-151-T5-3 VẪN CHƯA kiểm chứng live đường
  elif/else.** Cờ T5-168 cho boot mới xuất hiện dạng PASS
  (đủ boot_id); trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)"
  ở các poll trước khi cờ chính xuất hiện. Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-167-T4-2 — F-165-T4-1 ĐÓNG, KHÔNG TÁI DIỄN:** blendTick
  471 (ticks) vs tBlend gap 470 — 471 tick cho 470 gap,
  ĐÚNG quy ước (xem §2).
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "239,335,406"`, exit 0) — xem §2. Nợ đứng ở mức cơ
  chế (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt có attempt
  hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 32 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 168 (MỚI): P1 121/124, P2 115/115,
  P3-A1 104/124, P3' 88/96 occurrence = 80/83 distinct-seq,
  P7 66/66** (32 lượt hợp lệ — #37 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 167 §6: "31 lượt hợp lệ" — nay 32).
- **Đóng góp lượt #37 (attempt1-576ca271, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=3 occurrence / 3 distinct-seq [239, 335, 406], trong
  đó 2 seq MỚI [239, 406].
  - **P1 — ĐÚNG 3/3 occ** (cả 3 seq gần run-end: trong 16
    run_end seqs; baseline 48/342, p=0,00276 trên distinct
    3/3 — verdict ĐÚNG theo luật DEF §3 vì n=3 ≥3 và p<0,01).
    Cộng dồn 118/121 → **121/124**.
    (P1 signed đối chiếu: baseline 48/342, p=0,00276 — khớp.)
  - **P2 ĐÚNG — 3/3 occ** (lag +1f ×3: (239,16,15),
    (335,15,14), (406,15,14); 0 lag âm). Cộng dồn 112/112 →
    **115/115**.
  - **P3-A1 — SAI 3/3 occ** (cả 3 seq đóng băng-tại-tick;
    baseline 84/341, p=0,0149 — verdict SAI theo luật DEF
    §5 vì p≥0,01; xem F-168-T4-2).
    Cộng dồn 101/121 → **104/124**.
  - **P3' 3/3 occ ĐẠT** (239 stall 4, 335 stall 3, 406 stall
    4). Cộng dồn 78/81 → **80/83 distinct** (2 seq MỚI —
    239, 406); occurrence 85/93 → **88/96**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 14, 0: 14}; đối chứng toàn bộ drawSrc post: {-1: 294,
    0: 124}, 0/418 entry). Cộng dồn 65/65 → **66/66**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–167).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-168.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 167: 78/81 distinct, occ 85/93), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-168-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem §0b):** chạy helper trên stall
  + c2coverage attempt1 đợt 167 với sổ as-of-165 → ra 78/81
  distinct, 85/93 occ — khớp hệt live 167; sổ gốc KHÔNG đổi
  trong back-test (md5 `3668db01…`).
  **Live đợt 168:** sổ + stall/c2coverage
  attempt1-576ca271 → **80/83 distinct, 88/96 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 168,
  80/83 distinct, occ 88/96, valid_rounds_p3 20,
  non_dat_in_union [283, 364, 498] (KHÔNG đổi — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `90f71f1363707dc705f60037562ad580`).
- **Kiểm chứng seq 239/335/406 đợt 168:** helper (đọc sổ)
  xác nhận **335 ĐÃ CÓ trong sổ** (seen_c2 81 seq VÀ seen_dat
  78 seq) — 335 từng DAT trong lượt hợp lệ trước; lần này
  stall 3 → DAT lại; **239 và 406 MỚI** (chưa có trong sổ).
  Tính tay: distinct DAT 78 + 2 = **80**; distinct tổng
  81 + 2 = **83**; occurrence 85 + 3 = **88**,
  93 + 3 = **96**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên:** lượt hợp lệ mới (3 occ, 2 seq mới)
  không có dữ kiện mới làm thay đổi P1/P2/P3-A1/P3'/P7 ngoài
  cộng dồn occurrence; P3-A1 SAI 3/3 (F-168-T4-2) là trượt
  bar p của phép thử nghiêm ngặt, không phải bằng chứng
  chống đóng băng, và không có tiêu chí mở lại nào xảy ra
  theo §13 DEF v0.5. Wedge không xảy ra đợt này (0 wedge —
  chuỗi 0-wedge tiếp tục từ đợt 167).
- Chuỗi median tickCost 32 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / 59,0 / **56,0 ms** (trung bình 48,5 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 169

- **(a) #37 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 32.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT đợt
  này** — attempt1-576ca271 hợp lệ trên boot 576ca271 (btime
  05:32:46Z, boot đo lúc mở); gate mở 06:02:10Z qua đường (a)
  chuẩn (cờ T5 PASS 06:01:38Z). O8 chạy trên boot nào, có qua
  gate chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết;
  T4 chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (cùng mẫu đợt 167) —
  cờ `.done` viết ~06:1xZ, trong hạn cờ ~08:00Z.
- **(b) P3' cộng dồn MỚI 32 lượt: P1 121/124, P2 115/115,
  P3-A1 104/124, P3' 88/96 = 80/83, P7 66/66:** helper đã
  chạy live; sổ distinct-seq-ledger.json đã thăng cấp
  as-of-168 (80/83 distinct, occ 88/96, valid_rounds_p3 20,
  non_dat [283, 364, 498]). **Chờ parent/T10 quyết:** ghi
  nhận cộng dồn mới. T10 kiểm lại phép cộng khi viết
  aggregate (§12).
- **(c) REBOOT MỚI TRƯỚC KHI MỞ (btime 05:32:46Z, boot
  576ca271) — giao T0-168 xác minh số hiệu (#75?) + 9 nguồn;
  giao T7-168/T2-168 kiểm tra run 167 có bị viết lại tại
  reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 05:32:46Z; đợt mở 05:35:51Z (boot mới hơn giờ mở
  3m05s); poller mở sau reboot nên không có poll nào trên
  boot cũ trong phiên này; 0 reboot trong phiên.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1/F-167-T4-1 TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ
  làm quy tắc đứng, BỔ SUNG 1 MỤC:** pre-flight bắt được bẫy
  copy-forward mới F-168-T4-1 (literal tên script cũ + dạng
  deadline `04:30:00Z`) TRƯỚC khi mở poller. T4-169 áp dụng
  y hệt checklist này + grep thêm dạng giờ đầy đủ `HH:MM:00Z`
  và tên file `NNN.sh`/`NNN.log`/`NNN.py` không chứa
  `t4-`/`round` (không chỉ `roundNNN`/`t4-NNN`).
- **(e) POSTBOOT_PASS cho boot mới 576ca271 ĐÃ CÓ (06:01:38Z,
  boot+28m52s, replay đầy đủ, repair-sớm của T5-168): GHI
  NHẬN.** Hướng (3) — replay tự nhiên + cờ T5 — vẫn đứng
  (lần này replay trên boot rootfs-trống xong trong ~29 phút
  nhờ repair-sớm, nhanh hơn nhiều so với 82 phút chưa xong
  của boot #73 đợt 167). Watcher-168 ĐANG CHẠY lúc T4 đóng
  (pid 13133).
- **(f) RAM <500 MB: 0/26 poll — SẠCH.** Lần đầu kể từ đợt 165
  không có poll nào <500 MB; đợt 167: 38/119. Ghi nhận để
  T9-168 đối chiếu headroom/balloon trên boot mới.
- **(g) P3-A1 SAI 3/3 (p=0,0149) + P1 ĐÚNG 3/3 (p=0,00276):
  GHI NHẬN.** P3-A1 SAI là trượt bar p của phép thử nghiêm
  ngặt (baseline đóng băng cao 24,6%), không phải bằng chứng
  chống đóng băng; P3' prereg DAT 3/3; điều tra (c2) vẫn
  ĐÓNG. P1 ĐÚNG lần đầu với n=3.
- **(h) Load1 mean/pass tăng đều 1,94→3,31 trong lúc đo +
  2 process luồng khác trong ps (F-168-T4-4): GHI NHẬN.**
  B2 vẫn DAT theo load (max 3,31 ≤4). Giao T2/T5 đối chiếu
  lịch chạy script trong cửa sổ 06:02–06:06Z.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 06:02:10Z
  (poll #25, gate0 T5) → attempt1 HỢP LỆ 06:06:06Z
  trên boot 576ca271 → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #37, boot đo 576ca271, gate qua
  đường (a) chuẩn). T8 tự quyết O8 trên boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 167 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95?/#96? giao T2
  (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b)
  đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-168
  theo dõi tiếp); birefnet 0 thử (đợt này không thử);
  u2net là fallback chính thức; kết cục run 167 + (m) cho
  reboot mới thuộc T7-168/T2-168; **POSTBOOT_PASS #74 ĐÃ CÓ
  từ đợt 167** (chỉ còn ý nghĩa hồ sơ — boot #74 đã chết);
  **replay tự nhiên ĐÃ XONG trên boot mới 576ca271 lúc T4
  đóng** (dpkg 795 dòng, cache 110 .deb, lists 75, check độc
  lập của T5 PASS).

## A. Phụ lục số liệu (script trích từ log gốc — stats-168.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-168.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T05:43:02Z - 2026-11-22T05:43:02Z, boot=576ca271
   RAM min=769 max=769 >=1024: 0/1 500-1023: 1/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 0
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 25 poll, 2026-11-22T05:44:05Z - 2026-11-22T06:02:10Z, boot=576ca271
   RAM min=1267 max=2781 >=1024: 25/25 500-1023: 0/25 <500: 0/25
   load1<2: 15/25 load5<2: 9/25 blockers>0: 0 apt>0: 19
   gate0: T5=1, khong-dat=24
   lock: khong=25
   dpkg 2->795
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 26
-- RAM toan phien: min=769 max=2781 >=1024: 25/26 <500: 0/26
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 9/26
   gan-mo? #17 2026-11-22T05:56:09Z boot=576ca271 RAM=1914 L1=0.70 L5=1.76 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #18 2026-11-22T05:56:54Z boot=576ca271 RAM=1734 L1=1.10 L5=1.69 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #19 2026-11-22T05:57:40Z boot=576ca271 RAM=1638 L1=1.15 L5=1.61 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #20 2026-11-22T05:58:25Z boot=576ca271 RAM=1458 L1=0.72 L5=1.45 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-22T05:59:10Z boot=576ca271 RAM=1403 L1=1.25 L5=1.44 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #22 2026-11-22T05:59:55Z boot=576ca271 RAM=1267 L1=0.94 L5=1.32 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-22T06:00:40Z boot=576ca271 RAM=1385 L1=1.28 L5=1.35 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-22T06:01:25Z boot=576ca271 RAM=1441 L1=1.31 L5=1.35 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-22T06:02:10Z boot=576ca271 RAM=1836 L1=1.89 L5=1.51 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 576ca271: 26 poll; RAM>=1024 lan cuoi: 2026-11-22T06:02:10Z #25; RAM<1024 lan dau: 2026-11-22T05:43:02Z #1 RAM=769
-- cong don P3' (MOI, 32 luot hop le): P1 121/124 P2 115/115 P3-A1 104/124 P3' 88/96 occ = 80/83 distinct-seq P7 66/66
-- chuoi median 32 luot: n=32 mean=48,5 min=39,0 max=60,0 vuot-60: 0
```
