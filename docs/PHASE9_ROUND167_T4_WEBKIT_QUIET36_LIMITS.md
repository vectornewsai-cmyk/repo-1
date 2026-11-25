# PHASE9_ROUND167_T4_WEBKIT_QUIET36_LIMITS.md

**Đợt:** 167. **Luồng:** T4 — đo lượt yên WebKit #36 trên 2 boot
+ **#36 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ BẮT ĐẦU LẠI**
  (sau khi đứt tại #35 đợt 166; attempt1-194efd93 HỢP LỆ
  ngay lần thử đầu trên boot mới).
+ **REBOOT GIỮA PHIÊN (~04:05:29Z) GIẾT POLLER instance 1**
  (113 poll trên boot cũ b643911f, 0 lần cửa mở — gate0
  KHÔNG ĐẠT lần nào vì replay chưa xong); T4 restart poller
  04:08:34Z theo tiền lệ đợt 164 — instance 2 mở cửa ngay
  poll #5 (04:11:35Z, cờ T5 PASS 04:10:23Z).
**Ngày:** 22/11/2026 (lượt cron 09:35 +07 22/11 = 02:35:51Z).
**Boot đo:** HAI boot — b643911f (btime 02:28:01Z, boot lúc mở,
chết theo reboot ~04:05:29Z; số hiệu reboot do T0-167 xác
nhận — sau #72) và 194efd93 (btime 04:05:29Z, boot đo lượt
hợp lệ, ổn định từ lúc restart poller tới lúc đóng).
**Trạng thái:
#36 CÓ LƯỢT HỢP LỆ (attempt1-194efd93: 20/20, lớp B 5/5,
tickCost median 59,0 ≤ 60 — LUOT HOP LE, poller thoát
04:15:44Z vì ĐẠT, trước hạn cắt poller 04:30Z 14m16s, trước
hạn cờ ~05:00Z ~44m). Ngân sách dùng 1/3. Cộng dồn LÊN 31
lượt hợp lệ: P1 118/121, P2 112/112, P3-A1 101/121, P3'
85/93 occurrence = 78/81 distinct-seq, P7 65/65. Sổ
distinct-seq THĂNG CẤP as-of-167 (78/81 distinct, occ 85/93,
seq 392 đã có trong sổ — 0 seq mới). RAM <500 MB: 38/119
poll (toàn instance 2 trên boot cũ; chuỗi dài nhất 16 poll).
POSTBOOT_PASS cho boot mới 194efd93 ĐÃ CÓ (04:10:23Z,
T5-167 sở hữu); POSTBOOT_PASS cho boot cũ b643911f KHÔNG
CÓ (replay chưa xong lúc reboot); watcher-167 ĐANG CHẠY
lúc đóng.**

## 0. Verdict tổng

- **#36 CÓ LƯỢT HỢP LỆ (attempt1-194efd93).**
  Poller thoát 04:15:44Z vì LUOT HOP LE — KHÔNG phải hết
  hạn (hạn cắt 04:30Z còn 14m16s, hạn cờ ~05:00Z còn ~44m).
- **Attempt1-194efd93 (04:11:36–04:15:44Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 59,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  3096–3981 ms/pass): tickCost n=527, blendTick n=423
  (tBlend gap n=422 — xem F-167-T4-2), c2DrawLog n=1014.
  **tickCost total median= 59,0 ms (p90 82,0, max 178, min 30)**
  — SÁT NGƯỠNG (chỉ dưới 60 đúng 1,0 ms — xem F-167-T4-7);
  hậu flip+2000 ms median 59,0. Per-pass median 50,0–67,0 ms
  (pass 6: 67,0; pass 8: 67,0; pass 17: 66,0; pass 7: 50,0).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,32 ≤2,5; B2 load1
  max 2,09 ≤4 — sampler n=104 dòng gồm 1 header + 103 mẫu,
  xem F-167-T4-8; B3 không reboot; B4 pgrep -x=0, ps
  exact-comm=0, dpkg delta=0 (1545→1545); B5 RAM min 892 MB,
  0 mẫu <500 MB, 6/104 mẫu <1024 MB — chỉ ghi nhận).
  **(c2)=1** (seq 392, COVERED, delta −23 ms) — ĐÃ CỘNG DỒN.
  P3' 1/1 DAT (stall 6). lag≥+5f (b) = 0 occurrence — sạch.
  p1p3p7 chạy TAY (F-148-T4-1): **P1 YẾU** (1/1 gần run-end,
  p=0,202, n=1 <3 — nhưng đóng góp occurrence 1/1 vào cộng
  dồn); **P2 ĐÚNG 1/1** (lag +1f, 0 lag âm); **P3-A1 YẾU**
  (0/1 đóng băng-tại-tick, p=1); **P7 ĐÚNG** (0/8 entry trễ
  ≥+1f; đối chứng 0/385).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 2.918.475 B (md5
  `4b9ef99e536169444c5465a931f6dd4e`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=68 tick).
- **Poller instance 1 — boot cũ b643911f, 113 poll, 0 lần cửa
  mở, CHẾT THEO REBOOT.** Gate0 KHÔNG ĐẠT 113/113 poll
  (postboot check-only exit 1 suốt phiên — replay OS-intent
  chưa xong trên boot rootfs-trống; xem §3). RAM <500 MB:
  38/113 poll (chuỗi dài nhất 16 poll). dpkg 2→1751.
  Poll cuối #113 04:05:32Z vẫn ghi boot cũ — poller KHÔNG
  thấy reboot (0 dòng REBOOT PHAT HIEN).
- **Poller instance 2 — boot mới 194efd93, 5 poll, 1 lần cửa
  mở (poll #5, 04:11:35Z).** Gate0: T4-check-only 3 poll,
  T5 2 poll. RAM 1323–1679 MB (5/5 ≥1024). dpkg 1167→1545.
  T5-167 viết POSTBOOT_PASS 04:10:23Z (boot+4m54s, replay
  đầy đủ).
- **Chuỗi lượt yên hợp lệ: BẮT ĐẦU LẠI TẠI #36 (sau khi đứt
  tại #35).** Cộng dồn LÊN 31 lượt hợp lệ: P1 118/121, P2
  112/112, P3-A1 101/121, **P3' 85/93 occurrence = 78/81
  distinct-seq**, P7 65/65. Chuỗi median tickCost 31 lượt:
  39,0–60,0 ms, mean 48,3 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #35 (quyết (m) đợt 166):**
  ngưỡng gate A RAM ≥1024 MB, load1<2, load5<2, tickCost
  median ≤60 ms, lớp B 5/5, ngân sách 3 attempt/đợt, poll
  45 s — KHÔNG đổi ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt bắt đầu — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round167-t4.done` viết ~04:25Z 22/11
  (trong hạn cờ ~05:00Z, sớm hơn ~35m), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung F-164-T4-1)

Chạy **trước mọi attempt, trước khi mở poller** (02:41Z),
ghi vào `hidden_files/round167-t4/preflight-167.txt` — **PASS**:

- **b.json CÓ trong `round167-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156–166 (F-158-T4-1/2 KHÔNG lặp lại).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–166. **vite.t4-temp.config.mjs md5
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
  `2026-11-22 04:30:00 UTC` → epoch **1795321800** =
  2026-11-22T04:30:00Z — khớp đúng hạn cắt poller 04:30Z
  (hạn cờ ~05:00Z = 1795323600, hạn cứng 05:30Z =
  1795325400); không còn sót dạng `19:30`/`16:30`/`13:30`/
  `10:30`/`07:30`/`08:00`/`08:30`/`22:30`/`23:00`/`23:30`/
  `01:30` nào trong script mới (grep 0 hit); grep `round16[0-9]`
  trong mọi script làm việc chỉ còn `round167-t4` +
  fallback `round166-t5` (xem F-167-T4-1).
- **Copy-forward đợt 166 → 167:** deadline poller `01:30Z`
  → `04:30Z` ở cả 3 dạng; hạn cờ/cứng trong comment
  `02:00Z`/`02:30Z` → `05:00Z`/`05:30Z`; `brief dot 166` →
  `brief dot 167`; `poll-test-166`/`stats-166`/
  `distinct-seq-166` → 167; T5FLAG chính `round167-t5/` +
  fallback `round166-t5/`; **W trong `t4-attempt-inner.sh` /
  `check-classb-t4.sh` ĐÃ LÀ `round167-t4` ngay sau copy
  (không lặp bẫy F-164-T4-1/F-165-T4-2 — lần này sed đổi tên
  áp cho cả 4 script cùng lúc trước khi kiểm)**; glob nhiễu
  chéo inner.sh `round166-*` → `round167-*`.
  **BẮT ĐƯỢC KHI COPY (F-167-T4-1):** literal
  `poll-wait-t4-166.sh`/`run-attempt-166.sh` trong dòng echo
  + lệnh gọi dòng 269 + `poll-test-166.log` +
  `postboot-t4-166-gate0wait-` KHÔNG được thay bởi replace
  `round166`→`round167` — grep bắt được, ĐÃ SỬA trước khi
  chạy (nếu không: lệnh gọi run-attempt-166.sh sẽ lỗi vì
  file đã đổi tên; stats-167.py không parse được dòng
  `== poll-wait-t4-166 start`).
  **HELPER distinct-seq back-test TRƯỚC LIVE: PASS** — chạy
  helper 167 trên stall + c2coverage attempt2 đợt 165 với sổ
  as-of-165 → ra 78/81 distinct, 0 seq mới, sổ gốc KHÔNG đổi
  (md5 `3668db01…` trước/sau như nhau; xem
  `distinct-seq-167-backtest165-proposed.json`; occ 92/100
  là cộng lặp lại dữ liệu cũ — như dự kiến, cùng mẫu back-test
  đợt 165/166).
- **Freeze check (bài học F-164-T4-1):** thư mục `round166-t4`
  đã đóng băng còn **0 file mtime ≥ 2026-11-22 02:35:51Z**
  (giờ mở đợt 167); `round165-t4` cũng 0 file mtime ≥ giờ mở.
- **GATE0 LÚC MỞ KHÔNG ĐẠT (không phải lỗi setup):**
  boot b643911f (btime 02:28:01Z, tuổi ~13m lúc mở),
  dpkg.log CHỈ 2 dòng lúc kiểm đầu (mtime 02:35:39Z,
  "startup packages configure"); `/var/log/apt/history.log`
  KHÔNG TỒN TẠI; `/var/log` gần như trống — rootfs mới/
  rebuild; cờ T5-167 CHƯA CÓ lúc mở (thư mục trống, tạo
  02:38Z); cờ T5-166 chỉ ghi boot d1ddd946 (#70), mtime
  23:40:45Z < btime 02:28:01Z — KHÔNG tính cho boot mới;
  postboot check-only chạy tay **exit 1** (CHƯA ĐỦ — thiếu
  11 gói apt, thư mục GST không tồn tại, thiếu 5 lib:
  libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1
  libevdev.so.2; xem `preflight-postboot-167.log`).
  OS-intent replay ĐANG CHẠY lúc mở (pid 793 shell từ
  02:35Z, apt-get update pid 814) — replay tự nhiên đang
  tiến hành; T4 KHÔNG tự chạy --repair (thuộc T5).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 933 MB (<1024), load1 1,61/load5 1,28,
  gate0=khong-dat (postboot exit 1, cờ T5 cũ), apt=1
  (replay đang chạy), dpkg 2 (xem `poll-test-167.log`).
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb.**
- **Snapshot 3 script vào repo `apps/web/scripts/` (md5 khớp
  bản làm việc):** `poll-wait-t4-167.sh`,
  `run-attempt-167.sh`, `distinct-seq-167.py` (xem §4).

## 1. Poller — 119 poll thật, 1 lần cửa mở, trên 2 boot (reboot giữa phiên)

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot b643911f
  (02:41:09Z):** poll #1 RAM=933 MB (<1024), load1=1,61
  load5=1,28, blockers=0, gate0=khong-dat → cửa đóng
  (RAM <1024 + gate0) → **TEST-POLL-OK exit 7 đúng thiết kế**.
  Poll này nằm trong `poll-test-167.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot cũ b643911f, 113 poll (02:41:14–
  04:05:32Z), 0 lần cửa mở:** RAM ≥1024: 23/113; 500–1023:
  52/113; **<500: 38/113 (chuỗi dài nhất 16 poll)**;
  load1<2: 99/113; load5<2: 101/113; gate0: **khong-dat
  113/113**; lock=khong 113/113; dpkg 2→1751; blockers>0: 0
  poll; apt>0: 102 poll.
- **Giai đoạn 1 — chờ load hạ + replay bắt đầu (poll #1–#16,
  02:41–02:52Z):** RAM 877–1739 MB, load1 2,84–5,82 lúc đầu
  rồi hạ; dpkg 2→133. Poll #2 (02:41:59Z): RAM 1096 MB,
  load1 0,98/load5 1,14 — load+RAM cùng đạt nhưng gate0
  khong-dat + apt=1 chặn (xem F-167-T4-4).
- **Giai đoạn 2 — cửa sổ load+RAM đạt nhưng gate0 chặn
  (poll #17–#21, #34–#36, 02:53–03:07Z):** 9 poll load+RAM
  cùng đạt (RAM 1051–1463 MB, load1 0,31–1,52, load5
  0,70–1,91) — tất cả đều gate0=khong-dat + apt=1 (replay
  đang chạy) nên cửa KHÔNG mở. Stats đếm "gan-mo" 10 poll
  (9 poll này + poll #5 instance 3) — chỉ 1 là mở cửa thật.
- **Giai đoạn 3 — RAM sụt <500 kéo dài (poll #50–#67,
  03:18–03:30Z):** RAM 364–447 MB, load rất thấp (0,11–0,75)
  nhưng RAM cạn; dpkg KẸT 650 dòng ~12 phút trong lúc apt
  download (apt-get pid 39340 từ 03:19Z, cache .deb tăng
  103→108; gst_sys 31/269 theo watcher-167).
- **Giai đoạn 4 — replay tăng tốc trở lại (poll #67–#105,
  03:30–03:59Z):** dpkg 650→1751 (nhảy 805→1487→1581 trong
  ~10 phút cuối); gst_sys 31→108; RAM hồi dần 447–824 MB
  nhưng vẫn <1024. Poll #102–#105: apt=0 (apt-get dừng),
  dpkg 1751 — nhưng postboot vẫn exit 1 + RAM 523–769 MB
  → cửa vẫn đóng.
- **Giai đoạn 5 — REBOOT GIẾT POLLER (poll #113,
  04:05:32Z):** poll cuối trên boot cũ (RAM 367 MB, load
  0,34/0,43, gate0 khong-dat, apt=1, dpkg 1751). Boot mới
  194efd93 btime 04:05:29Z — SỚM HƠN 3 s so với poll cuối
  boot cũ và 12 s so với watcher-167 poll cuối boot cũ
  (04:05:41Z) — dạng OVERLAP (xem F-167-T4-3). Poller
  KHÔNG thấy reboot (0 dòng REBOOT PHAT HIEN) — chết cùng
  boot cũ. **T4 restart poller 04:08:34Z theo tiền lệ đợt
  164 (2 lần start); ngân sách trên đĩa còn nguyên
  (0 attempt đã dùng) nên restart hợp lệ.**
- **Instance 3 — boot mới 194efd93, 5 poll (04:08:34–
  04:11:35Z), 1 lần cửa mở:** RAM ≥1024: 5/5 (1323–1679
  MB); load1<2: 2/5; load5<2: 1/5; gate0: T4-check-only 3,
  T5 2; lock=khong 5/5; dpkg 1167→1545; blockers>0: 0;
  apt>0: 2.
  - Poll #1 (04:08:34Z): load1 3,70/load5 2,21, RAM 1679 MB,
    gate0=T4-check-only (postboot exit 0 — replay từ cache
    đã cài đủ GST trong ~55 s kể từ lần check tay 04:07:39Z
    còn exit 1), apt=1, dpkg 1167 → cửa đóng (load + apt).
  - Poll #2 (04:09:20Z): load1 3,60/load5 2,41, RAM 1646 MB,
    gate0=T4-check-only, apt=1, dpkg 1471 → đóng.
  - Poll #3 (04:10:05Z): load1 2,67/load5 2,39, RAM 1593 MB,
    gate0=T4-check-only, apt=0, dpkg 1545 → đóng (load).
  - Poll #4 (04:10:50Z): load1 1,35/load5 2,09, RAM 1429 MB,
    **gate0=T5** (POSTBOOT_PASS 04:10:23Z), apt=0, dpkg 1545
    → đóng (load5 2,09 > 2).
  - Poll #5 (04:11:35Z): load1 0,70, load5 1,81 <2, RAM 1323
    MB, **gate0=T5** → **CỬA MỞ, chạy attempt1** → HỢP LỆ
    → poller thoát 04:15:44Z vì LUOT HOP LE.
- **Phân rã 119 poll thật:** RAM≥1024: 28/119; RAM 500–1023:
  53/119; RAM<500: **38/119** (toàn instance 2).
  load1<2: 102/119; load5<2: 103/119. 10 poll mà load + RAM
  cùng đạt — chỉ 1 là poll mở cửa (#5 instance 3); 9 poll
  còn lại bị gate0=khong-dat + apt=1 chặn. gate0: T5 2 poll,
  T4-check-only 3 poll, khong-dat 114 poll. blockers>0: 0
  poll. apt>0: 105 poll.
  **RAM <500 MB: 38/119 poll** — lần đầu instance-2 có poll
  <500 MB kể từ đợt 164 (toàn boot #68); đợt 165: 0/13;
  đợt 166: 1/16 (chỉ test poll); đợt này 38/119, toàn boot
  cũ b643911f trong lúc replay + các luồng khác ép RAM
  (xem F-167-T4-5).

## 2. Attempt1 HỢP LỆ — lượt yên #36

- **Attempt1-194efd93 (04:11:36–04:15:44Z): probe 20/20,
  HỢP LỆ (lớp B ĐẠT 5/5 + tickCost median 59,0 ≤ 60).**
  Vite :5187, WebKit 27.2 (Xvfb :193), app boot OK, C2 draw
  log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  3096–3981 ms/pass): tickCost n=527, blendTick n=423
  (tBlend gap n=422 — xem F-167-T4-2), c2DrawLog n=1014.
  **tickCost total median= 59,0 ms (p90 82,0, max 178, min 30)**
  — SÁT NGƯỠNG 60 (chỉ dưới 1,0 ms — xem F-167-T4-7);
  hậu flip+2000 ms median 59,0. Per-pass median 50,0–67,0 ms
  (pass 1: 53,0; pass 6: 67,0; pass 7: 50,0; pass 8: 67,0;
  pass 13: 60,5; pass 17: 66,0; pass 20: 56,0) trong khi
  load1 mean/pass 1,14–2,09, RAM mean/pass 1071–1328 MB
  (tương quan Pearson median~load1 r=0,27, median~RAM
  r=0,29 — yếu, không kết luận nhân quả từ 1 lượt).
  **Lớp B: ĐẠT 5/5 sạch** (B1 load5 cuối 1,32 ≤2,5 ĐẠT;
  B2 load1 max 2,09 ≤4 ĐẠT — sampler n=104 dòng (1 header
  + 103 mẫu, xem F-167-T4-8); B3 không reboot ĐẠT; B4
  pgrep -x=0, ps exact-comm=0, dpkg delta=0 (1545→1545)
  ĐẠT; B5 RAM min 892 MB, 0 mẫu <500 MB, **6/104 mẫu
  <1024 MB** — chỉ ghi nhận, không vi phạm — ĐẠT).
  **(c2)=1** (seq 392, COVERED, delta −23 ms; blendTick
  hậu-flip 312/312 trong ±500 ms của log) — ĐÃ CỘNG DỒN.
  P3' 1/1 DAT (stall 6). lag≥+5f (b) = **0 occurrence** —
  sạch.
  **p1p3p7 chạy TAY (F-148-T4-1): P1 YẾU** (1/1 gần run-end
  [392 trong 21 run_end seqs], p=0,202, n=1 <3 — verdict
  YẾU theo luật DEF §3 vì n<3, nhưng đóng góp occurrence
  1/1 vào cộng dồn); **P2 ĐÚNG 1/1** (lag +1f, 0 lag âm);
  **P3-A1 YẾU** (0/1 đóng băng-tại-tick, p=1); **P7 ĐÚNG**
  (0/8 entry trễ ≥+1f cho seq 392; đối chứng toàn bộ
  drawSrc post 0/385).
  **KHÔNG PAGE-WEDGED:** 0 fetch timeout, `pageErrs: []`,
  JSON đầy đủ 2.918.475 B (md5
  `4b9ef99e536169444c5465a931f6dd4e`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0, engine
  webkit 27.2, gstPluginPath hệ thống.
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (n=68 tick
  skippedLatest=1 hậu flip+2000ms, bar ≥30; (1) nhan 100%,
  (2) pixel-verified 100%).
  **Attempt này ĐƯỢC CỘNG DỒN** (lượt hợp lệ — theo quy ước
  đứng, chỉ lượt hợp lệ mới tính vào P1/P2/P3-A1/P3'/P7).
- **Lưu ý seq 392:** seq này ĐÃ CÓ trong sổ distinct-seq
  (seen_c2 + seen_dat) nên KHÔNG cộng thêm distinct — chỉ
  cộng occurrence (xem §6). Không seq nào KHÔNG DAT cũ
  chuyển thành DAT đợt này (non_dat_in_union [283, 364, 498]
  không đổi).
- **Caveat B2 attempt1-194efd93 — CÓ 1 process waiter của T8
  trong ps (xem F-167-T4-10):** `ps-before/after` liệt kê 1
  process `/bin/bash ... sleep 300 ...` (waiter của T8 kiểm
  cờ `.done`, pid 11405) — chỉ là waiter chờ, không phải
  process phân tích nặng; B2 DAT theo load (2,09 ≤ 4) là
  chính. Các process vite liệt kê là của chính attempt.

## 3. Replay/postboot trên 2 boot — cờ T5-167 cho boot mới ĐÃ CÓ (04:10:23Z); boot cũ KHÔNG CÓ cờ

- **Boot b643911f (btime 02:28:01Z, số hiệu do T0-167 xác
  nhận — sau #72): replay TỰ NHIÊN KHÔNG XONG trước reboot.**
  Lúc T4 mở (02:41Z): dpkg.log 2 dòng, apt history.log
  không tồn tại, GST 0 plugin, thiếu 11 gói apt + 5 lib —
  rootfs mới/rebuild. Replay OS-intent chạy từ 02:35Z
  (pid 793): dpkg 2→1751 trong 1h30m (kẹt 650 dòng ~12 phút
  lúc download, rồi tăng tốc 650→1751); gst_sys 0→108/269
  theo watcher-167; cache .deb 0→177. **T5-167 repair
  04:04Z** trên boot này (symlink GST lại → debroot 269
  file) nhưng 4 gói apt vẫn thiếu (plugins-bad/ugly/gl/
  libav) → kết luận CHƯA ĐỦ. Postboot check-only của T4
  exit 1 suốt phiên (lúc mở + mọi poll instance 2, 113/113
  khong-dat). **POSTBOOT_PASS cho boot này KHÔNG CÓ**
  (T5 xác nhận chi tiết; theo chuỗi "boot lọt" thì đây là
  boot thứ 10 lọt sau #63/#68 — T5-167 xác nhận số thứ tự).
  Boot chết theo reboot ~04:05:29Z.
- **Boot 194efd93 (btime 04:05:29Z = 1795320329): replay
  TỪ CACHE, XONG NHANH (boot+4m54s).**
  dpkg 449 (04:07:39Z, check tay T4) → 1167 (poll #1
  instance 3, 04:08:34Z) → 1471 (04:09:20Z) → 1545
  (04:10:50Z); gói cuối gstreamer1.0-tools cài 04:09:35Z.
  **T5-167: POSTBOOT_PASS mới viết 04:10:23Z (boot+4m54s;
  dpkg 1545 dòng; cache 178 .deb; lists 37; postboot PASS
  poll=0 độc lập exit 0 lúc 04:10:23Z; replay-đầy-đủ; cờ cũ
  d1ddd946 lưu POSTBOOT_PASS-d1ddd946)**. T5 independent
  check PASS (GST đủ isomp4 + libav; đủ 11 gói apt). Gate0=T5
  từ poll #4 instance 3 (04:10:50Z). T4 chỉ ghi số, không
  tự kết luận replay có "đầy đủ" không (postboot check-only
  PASS là đủ cho gate0 theo quyết (j) đợt 143) — nhưng lần
  này cờ T5 đã có nên gate0 đi đường chính.
  **Watcher-167 của T5 ĐANG CHẠY lúc T4 đóng** (poll đều
  ~30 s, dpkg 1545 md5 `ef7480f9`, gst 269, cache 178,
  lists 37 — xem `replay-watch-167.log` lúc 04:21Z).
- **KHÔNG có reboot mới trong phiên đo sau restart hay lúc
  đóng:** boot 194efd93 lúc poller instance 3 khởi động
  (04:08:34Z), lúc attempt1, lúc poller thoát (04:15:44Z)
  và lúc kiểm cuối (04:22Z) — btime 04:05:29Z không đổi.
  Mù #96?/#95?/#94?/#88?/#77? giao T2-167 — T4 không tự mở mù.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND167_T4_WEBKIT_QUIET36_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round167-t4/`):**
  `poll-wait-t4-167.sh` (md5 `68e3c2b1b816f62759565ecbff3a6754`;
  deadline 04:30Z 22/11 + cờ T5 round167-t5/ + fallback
  round166-t5/ + nhãn T4-167a),
  `run-attempt-167.sh` (md5 `21a74706a9b2d54b13d27a5374dacf41`;
  đổi số vòng/đường dẫn/nhãn so với 166, lượt yên #36),
  `distinct-seq-167.py` (md5 `7fdb3a19a730e7f8e843ea1eb8c917ba`;
  HELPER đọc sổ distinct-seq-ledger.json; đợt này ĐÃ DÙNG
  LIVE trên attempt hợp lệ — khi chạy từ `apps/web/scripts/`
  phải truyền `--ledger` trỏ tới sổ vì sổ không nằm cùng
  thư mục — nếu không, helper lỗi FileNotFoundError thay vì
  in số sai, xem §6).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–166, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round167-t4/` — theo đúng mẫu 149–166: chỉ
  stage 3 script trên). **`b.json` KHÔNG stage** (file spec làm
  việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round167-t4/`, md5 `078938cf...`, giống hệt
  bản đợt 156–166).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-167.sh`, `run-attempt-167.sh`,
  `t4-attempt-inner.sh` (W = round167-t4 + glob check nhiễu
  chéo round167-*), `check-classb-t4.sh` (W = round167-t4),
  10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-167.py` (thống kê §A — trích từ log gốc, không gõ tay;
  footer đã cập nhật cộng dồn 31 lượt — P1 118/121, P2
  112/112, P3-A1 101/121, P3' 85/93 = 78/81, P7 65/65;
  chuỗi median n=31 mean 48,3),
  `distinct-seq-167.py` (helper đọc sổ, xem §6),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-167: 78/81 distinct, occ 85/93, valid_rounds_p3 19,
  non_dat_in_union [283, 364, 498], md5
  `fff8dd1a211c381c998e6b7a62a662fc` — nguồn thật cho T4-168),
  `distinct-seq-ledger-167-proposed.json` (bản helper ghi ra
  trong live — giống hệt sổ đã thăng cấp, giữ làm audit
  trail),
  `distinct-seq-167-backtest165-proposed.json` (bản helper ghi
  ra trong back-test — giống sổ as-of-165 về distinct, occ
  92/100 là cộng lặp dữ liệu cũ, giữ làm audit trail),
  `distinct-seq-167-backtest165.txt` (output helper back-test),
  `distinct-seq-167-live.txt` (output helper live trên
  attempt1-194efd93),
  `preflight-167.txt` + `preflight-postboot-167.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung F-164-T4-1)
  + `preflight-postboot-167-boot2.log` (check-only tay trên
  boot mới 194efd93, exit 1 lúc 04:07:39Z — trước khi replay
  từ cache cài xong).
- **Log/evidence (hidden_files/round167-t4/, không stage):**
  `poll-t4.log` (113 poll instance 2 + 5 poll instance 3 +
  CUA YEN MO ×1 + LUOT HOP LE ×1, 0 REBOOT PHAT HIEN),
  `poll-test-167.log` (test start + 1 poll thật +
  TEST-POLL-OK exit 7), `poll-t4.nohup.log` (instance 2),
  `poll-t4.nohup2.log` (instance 3 — LUOT HOP LE 04:15:44Z),
  `poll-test-167-run.log`, `chain-t4.log`
  (gồm dòng RESTART-POLLER 04:08:34Z),
  `postboot-t4-167-gate0wait-*.log` (check-only poll #1),
  `stats-167-output.txt` (output stats-167.py),
  `preview-b-f3-flip-webkit-t4-attempt1-194efd93.json`
  (2.918.475 B, 20/20, md5
  `4b9ef99e536169444c5465a931f6dd4e`)
  + `run-webkit-t4-attempt1-194efd93.log`
  + `load-mid-t4-attempt1-194efd93.log` (sampler 104 dòng =
  1 header + 103 mẫu)
  + `ps-before/after-t4-attempt1-194efd93.txt`
  + `classb-t4-attempt1-194efd93.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-194efd93-*.txt` (10 file, gồm
  p1p3p7 chạy tay — xem F-148-T4-1)
  + `coverage-check-attempt1-194efd93.txt` ((c2)=1/1)
  + `attempt-done-attempt1-194efd93` (exit 0, 04:15:44Z).
  `vite-5187-t4-attempt1-194efd93.log` (vite log attempt) +
  `stop-sampler-t4-attempt1-194efd93` (marker) +
  `dpkg-lines-before-*` + `apt-history-before-*` (B4 baseline
  attempt) + `marker-t4-attempt1-194efd93` (marker).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 3 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller instance 2 đã thoát 04:15:44Z vì LUOT HOP LE;
  vite :5187 + lock trống, curl 000; `/tmp/.X11-unix/`
  TRỐNG sau khi T4 dọn 1 socket mồ côi X193 — xem §5
  F-167-T4-9).

## 5. Sai số F-167-T4-1..10 (+ nợ cũ)

- **F-167-T4-1 — COPY-FORWARD: literal TÊN SCRIPT CŨ KHÔNG
  ĐƯỢC THAY BỞI REPLACE `round166`→`round167` (đã sửa
  trước khi chạy, 0 thiệt hại).**
  Sau khi copy 166→167 và replace `round166`→`round167`,
  còn sót: literal `poll-wait-t4-166.sh`/`run-attempt-166.sh`
  trong các dòng echo + **lệnh gọi `bash "$W/run-attempt-166.sh"`
  ở dòng 269** + `poll-test-166.log` (dòng 62) +
  `postboot-t4-166-gate0wait-` (dòng 168) — vì các chuỗi này
  chứa `t4-166` chứ không chứa `round166`. Grep bắt được
  trước khi chạy; ĐÃ SỬA hết sang 167. Nếu không bắt:
  lệnh gọi run-attempt-166.sh sẽ lỗi (file đã đổi tên) và
  stats-167.py không parse được dòng
  `== poll-wait-t4-166 start` (instance 2 sẽ mất khỏi thống
  kê). **Bài học đứng:** sau replace `roundNNN`, grep thêm
  cả literal `t4-NNN`/`NNN.sh`/`NNN.log`/`NNN.py` (không
  chỉ `roundNNN`) — bổ sung vào checklist pre-flight đợt
  168 (xem §7 (d)).
- **F-167-T4-2 — F-165-T4-1 ĐÓNG: blendTick ĐẾM 422 vs 423
  KHÔNG PHẢI SAI SỐ — HAI SỐ ĐẾM HAI THỨ KHÁC NHAU.**
  Attempt1-194efd93 (lượt hợp lệ, kiểm được): JSON có
  blendTick n=423; analyzer tickcost in "tBlend gap n=422";
  c2coverage/skiplatest in blendTick n=423. Đọc code
  `analyze-t4-tickcost.py` dòng 30–39: `gaps` = hiệu
  `tBlend` giữa các tick LIÊN TIẾP → 423 tick cho 422 gap —
  ĐÚNG, không phải đếm thiếu. c2coverage đếm tick (423).
  Kết luận: không có sai số đếm; F-165-T4-1 ĐÓNG.
- **F-167-T4-3 — REBOOT GIỮA PHIÊN GIẾT POLLER instance 1;
  BOOT CŨ SỐNG QUÁ BTIME MỚI (DẠNG OVERLAP).**
  Boot mới 194efd93 btime 04:05:29Z (= 1795320329, theo
  /proc/stat + uptime -s). Poll cuối của poller instance 1
  trên boot cũ b643911f: #113 lúc 04:05:32Z — MUỘN HƠN
  btime mới 3 s; watcher-167 poll cuối trên boot cũ lúc
  04:05:41Z — MUỘN HƠN btime mới 12 s. Poller instance 1
  KHÔNG thấy reboot (0 dòng REBOOT PHAT HIEN) — chết cùng
  boot cũ; T4 restart poller 04:08:34Z theo tiền lệ đợt 164
  (round164-t4 có 2 lần start). Số hiệu reboot (#73?) +
  xác minh 9 nguồn giao T0-167; dữ kiện overlap này giao
  T0/T5 đối chiếu (cùng mẫu overlap #62: 824 s, #68: ≥11 s,
  #70: ≥6 s — lần này chỉ 3–12 s, ngắn nhất trong các lần
  quan sát được). Ảnh hưởng tới T4: 0 — ngân sách trên đĩa
  còn nguyên (0 attempt đã dùng), restart hợp lệ, lượt hợp
  lệ sau đó đo trên boot mới 194efd93.
- **F-167-T4-4 — STATS "gan-mo" ĐẾM 10, MỞ CỬA THẬT CHỈ 1
  (cùng họ F-166-T4-7).**
  9 poll instance 2 (#2, #17–#21, #34–#36) có load+RAM cùng
  đạt nhưng gate0=khong-dat + apt=1 (replay đang chạy) nên
  cửa KHÔNG mở. Script stats-167.py đếm "gan-mo" theo
  load+RAM (10 poll) mà không trừ gate0/apt/blockers —
  T10 đừng nhầm 10 poll gan-mo thành 10 lần mở cửa; mở cửa
  thật chỉ 1 (#5 instance 3, 04:11:35Z).
- **F-167-T4-5 — RAM <500 MB: 38/119 POLL (TOÀN BOOT CŨ).**
  Instance 2: 38/113 poll <500 MB, chuỗi dài nhất 16 poll
  (poll #50–#66, RAM 364–447 MB, 03:18–03:30Z). Lần đầu
  instance-2 có poll <500 MB kể từ đợt 164 (toàn boot #68);
  đợt 165: 0/13; đợt 166: 1/16 (chỉ test poll). Nguyên nhân:
  replay apt trên boot rootfs-trống + các luồng khác ép RAM
  (lúc mở RAM avail chỉ 640 MB; lúc 03:18–03:30Z còn
  ~400 MB trong khi load chỉ 0,11–0,75 — RAM cạn không phải
  do tải CPU). Instance 3 (boot mới): 0/5 poll <500 MB.
  Ghi nhận để T9-167 đối chiếu headroom/balloon trên cả
  hai boot.
- **F-167-T4-6 — BOOT MỚI b643911f LÀ ROOTFS TRỐNG/REBUILD;
  REPLAY CHẬM TRÊN BOOT CŨ, NHANH TRÊN BOOT MỚI.**
  Boot cũ lúc mở: /var/log gần như trống, dpkg.log 2 dòng,
  apt history.log không tồn tại, GST 0 plugin, thiếu 11 gói
  apt + 5 lib. Replay OS-intent chạy từ 02:35Z nhưng sau
  1h30m vẫn chưa xong lúc reboot (dpkg 1751, gst_sys
  108/269); T5 repair 04:04Z symlink GST→debroot nhưng 4
  gói apt vẫn thiếu. Trên boot mới 194efd93, replay từ
  cache chạy nhanh: dpkg 449→1545 trong ~3 phút
  (04:07:39–04:10:50Z), POSTBOOT_PASS 04:10:23Z
  (boot+4m54s). Chênh lệch tốc độ replay giữa hai boot liên
  tiếp là dữ kiện cho T5-167 (cache đã ấm sau lần replay
  đầu — 177 .deb trong cache lúc reboot).
- **F-167-T4-7 — tickCost MEDIAN 59,0 — SÁT NGƯỠNG (CHỈ
  DƯỚI 60 ĐÚNG 1,0 ms).**
  Attempt1-194efd93: median 59,0 ms (p90 82,0, max 178).
  Per-pass median 50,0–67,0 ms (3 pass ≥67,0: pass 6, 8,
  17). Đây là lượt hợp lệ sát ngưỡng nhất kể từ khi chuỗi
  median được theo dõi (đợt 166 attempt1 cũng đúng 60,0
  nhưng KHÔNG hợp lệ vì B2). Chuỗi median 31 lượt: mean
  48,3, min 39,0, max 60,0, 0 lượt vượt 60. Ghi nhận để
  T10/T8 đối chiếu: nếu một attempt sau này có median đúng
  60,0 mà lớp B sạch, cần quyết rõ 60,0 có tính là ĐẠT không
  (hiện tại luật ghi ≤60 nên 60,0 là ĐẠT — xem F-166-T4-1).
- **F-167-T4-8 — SAMPLER n: classb GHI 104, perpass GHI 103
  — QUY ƯỚC ĐẾM KHÁC NHAU, KHÔNG PHẢI SAI SỐ.**
  File load-mid có 104 dòng = 1 dòng header "sampler-start"
  + 103 mẫu dữ liệu (`grep -c 'load='` = 103). classb đếm
  bằng `wc -l` (104, gồm header); perpass đếm mẫu dữ liệu
  (103). Giữ cách ghi của classb như các đợt trước
  (đợt 166: n=102/105/127 cũng gồm header). Không ảnh
  hưởng verdict B2 (load1 max 2,09 tính trên mẫu dữ liệu).
- **F-167-T4-9 — X11 1 SOCKET MỒ CÔI SAU ATTEMPT (dọn tay,
  không ảnh hưởng đo — cùng mẫu F-166-T4-9/F-165-T4-4).**
  Sau khi poller thoát, `/tmp/.X11-unix/` còn X193 (mtime
  04:11Z — đúng lúc attempt1 mở Xvfb :193); 0 Xvfb còn
  chạy. T4 đã dọn tay socket này (rm -f), kiểm lại
  `/tmp/.X11-unix/` TRỐNG lúc đóng.
- **F-167-T4-10 — PS-BEFORE/AFTER ATTEMPT1 CÓ 1 PROCESS
  WAITER CỦA T8 (chỉ là waiter chờ, không phải tải ngoài).**
  Process `/bin/bash ... sleep 300 ...` (waiter của T8 kiểm
  cờ `.done`, pid 11405) xuất hiện trong ps-before/after
  attempt1. B2 DAT theo load (max 2,09 ≤ 4) là chính;
  process này chỉ chờ cờ, không phân tích nặng. Các process
  vite liệt kê là của chính attempt.
- **F-166-T4-2 — tickCost KHÔNG phản ánh tải: KHÔNG TÁI
  DIỄN MẠNH đợt này.** Attempt1 tickCost 59,0 trong khi
  load1 mean/pass 1,14–2,09 (tải vừa) — không có tương quan
  rõ (r=0,27). Ghi nhận, không mở điều tra.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-167 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)" ở poll #1–#3
  instance 3. Sửa từ đợt 152 vẫn đứng; chờ lượt sau có cờ
  chính non-PASS. Không đánh ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này (có attempt hợp lệ để
  chạy p1p3p7 tay).** p1p3p7 chạy tay đúng form
  (`$JSON "392"`, exit 0) — xem §2. Nợ đứng ở mức cơ chế
  (script chưa tự gọi p1p3p7) vẫn còn — mỗi đợt có attempt
  hợp lệ T4 phải chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 31 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 167 (MỚI): P1 118/121, P2 112/112,
  P3-A1 101/121, P3' 85/93 occurrence = 78/81 distinct-seq,
  P7 65/65** (31 lượt hợp lệ — #36 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 166 §6: "30 lượt hợp lệ" — nay 31).
- **Đóng góp lượt #36 (attempt1-194efd93, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=1 occurrence / 1 distinct-seq [392].
  - **P1 — 1/1 occ** (392 gần run-end: trong 21 run_end
    seqs; baseline 63/312, p=0,202 trên distinct 1/1 —
    verdict YẾU theo luật DEF §3 vì n=1 <3, nhưng đóng góp
    occurrence 1/1). Cộng dồn 117/120 → **118/121**.
    (P1 signed đối chiếu: baseline 61/312, p=0,196.)
  - **P2 ĐÚNG — 1/1 occ** (lag +1f: presented 64/label 63;
    0 lag âm). Cộng dồn 111/111 → **112/112**.
  - **P3-A1 — 0/1 occ** (392 không đóng băng-tại-tick;
    baseline 82/311, p=1 — verdict YẾU theo luật DEF §5).
    Cộng dồn 101/120 → **101/121**.
  - **P3' 1/1 occ ĐẠT** (392 stall 6). Cộng dồn 76/84 →
    **85/93 occurrence**; distinct 78/81 → **78/81**
    (0 seq MỚI — 392 đã có trong sổ).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 3, 0: 5}; đối chứng toàn bộ drawSrc post: {-1: 240,
    0: 145}, 0/385 entry). Cộng dồn 64/64 → **65/65**
    (P7 +1 mỗi lượt hợp lệ, theo mẫu đợt 157–166).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162 +
  đính chính quyết (i) đợt 163).** Helper
  `distinct-seq-167.py` đọc sổ `distinct-seq-ledger.json`
  (as-of 165: 78/81 distinct, occ 84/92), tính seq MỚI =
  tập hiệu với sổ, in cộng dồn mới distinct + occurrence,
  ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-167-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Back-test trước live (xem §0b):** chạy helper trên stall
  + c2coverage attempt2 đợt 165 với sổ as-of-165 → ra 78/81
  distinct, 0 seq mới — khớp số đã đính chính; sổ gốc
  KHÔNG đổi trong back-test (md5 `3668db01…`).
  **Live đợt 167:** sổ + stall/c2coverage
  attempt1-194efd93 → **78/81 distinct, 85/93 occ** — khớp
  tính tay độc lập dưới đây. Sổ đã thăng cấp: as-of 167,
  78/81 distinct, occ 85/93, valid_rounds_p3 19,
  non_dat_in_union [283, 364, 498] (KHÔNG đổi — không seq
  không-DAT cũ nào DAT thêm đợt này; md5 sổ mới
  `fff8dd1a211c381c998e6b7a62a662fc`).
- **Kiểm chứng seq 392 đợt 167:** helper (đọc sổ) xác nhận
  **392 ĐÃ CÓ trong sổ** (seen_c2 81 seq VÀ seen_dat 78 seq)
  — 392 từng DAT trong lượt hợp lệ trước; lần này stall 6
  → DAT lại. Tính tay: distinct DAT 78 + 0 = **78**;
  distinct tổng 81 + 0 = **81**; occurrence 84 + 1 = **85**,
  92 + 1 = **93**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên:** lượt hợp lệ mới (1 occ, seq 392 đã
  biết) không thêm seq mới, không có dữ kiện mới làm thay
  đổi P1/P2/P3-A1/P3'/P7 ngoài cộng dồn occurrence; không có
  tiêu chí mở lại nào xảy ra theo §13 DEF v0.5. Wedge
  không xảy ra đợt này (0 wedge — chuỗi 0-wedge bắt đầu lại
  từ đợt 167 sau khi đứt ở đợt 166).
- Chuỗi median tickCost 31 lượt (mới): 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 /
  59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 /
  60,0 / 40,0 / 41,0 / 41,0 / 44,5 / 44,0 / 44,0 / 42,0 /
  53,0 / 57,0 / 43,0 / **59,0 ms** (trung bình 48,3 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 168

- **(a) #36 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ BẮT ĐẦU
  LẠI (sau khi đứt tại #35).** Từ phía T4, **chân lượt yên
  cho chuỗi FULL PASS (O8) ĐẠT đợt này** — attempt1-194efd93
  hợp lệ trên boot 194efd93 (btime 04:05:29Z, boot đo sau
  reboot giữa phiên); gate mở 04:11:35Z qua đường (a) chuẩn
  (cờ T5 PASS 04:10:23Z). O8 chạy trên boot nào, có qua gate
  chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết; T4
  chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
  Lưu ý: waiter của T8 đang chờ cờ T4 (sleep 300 loop) —
  cờ `.done` viết ~04:25Z, trong hạn cờ ~05:00Z.
- **(b) P3' cộng dồn MỚI 31 lượt: P1 118/121, P2 112/112,
  P3-A1 101/121, P3' 85/93 = 78/81, P7 65/65:** helper đã
  chạy live; sổ distinct-seq-ledger.json đã thăng cấp
  as-of-167 (78/81 distinct, occ 85/93, valid_rounds_p3 19,
  non_dat [283, 364, 498]). **Chờ parent/T10 quyết:** ghi
  nhận cộng dồn mới. T10 kiểm lại phép cộng khi viết
  aggregate (§12).
- **(c) REBOOT GIỮA PHIÊN (~04:05:29Z, boot mới 194efd93) —
  giao T0-167 xác minh số hiệu (#73?) + 9 nguồn; giao
  T7-167/T2-167 kiểm tra run 166/167 có bị viết lại tại
  reboot này không + (m) cho reboot mới.** Dữ kiện T4:
  btime 04:05:29Z; poll cuối boot cũ 04:05:32Z (+3 s);
  watcher-167 poll cuối boot cũ 04:05:41Z (+12 s) — dạng
  OVERLAP (boot cũ sống quá btime mới); poller instance 1
  chết theo boot cũ, restart 04:08:34Z theo tiền lệ đợt 164.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) + BỔ SUNG
  F-164-T4-1 TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng, BỔ SUNG 1 MỤC:** pre-flight bắt được bẫy copy-forward
  mới F-167-T4-1 (literal tên script cũ) TRƯỚC khi mở poller.
  T4-168 áp dụng y hệt checklist này + grep thêm literal
  `t4-NNN`/`NNN.sh`/`NNN.log`/`NNN.py` sau khi đổi tên
  (không chỉ `roundNNN`).
- **(e) POSTBOOT_PASS cho boot mới 194efd93 ĐÃ CÓ (04:10:23Z,
  replay đầy đủ) + boot cũ b643911f KHÔNG CÓ cờ (replay chưa
  xong lúc reboot; T5 repair 04:04Z chưa đủ): GHI NHẬN.**
  Hướng (3) — replay tự nhiên + cờ T5 — vẫn đứng (lần này
  replay trên boot mới xong chỉ trong boot+4m54s nhờ cache
  ấm). Watcher-167 ĐANG CHẠY lúc T4 đóng (dpkg 1545, gst
  269).
- **(f) RAM <500 MB: 38/119 poll (toàn boot cũ b643911f).**
  Chuỗi "0 poll <500 MB" (đợt 165) đã đứt từ test poll đợt
  166; đợt này 38 poll <500 MB trong instance 2 — lần đầu
  instance-2 có poll <500 kể từ đợt 164. Ghi nhận để T9-167
  đối chiếu headroom/balloon trên cả hai boot.
- **(g) F-165-T4-1 ĐÓNG (F-167-T4-2):** blendTick 422 (gaps)
  vs 423 (ticks) là hai số đếm hai thứ khác nhau, không phải
  sai số — không cần theo dõi thêm.
- **(h) tickCost median 59,0 SÁT NGƯỠNG (F-167-T4-7):**
  chỉ dưới 60 đúng 1,0 ms. Nếu một attempt sau này có median
  đúng 60,0 mà lớp B sạch, cần quyết rõ 60,0 có tính là ĐẠT
  không (luật hiện ghi ≤60 nên 60,0 là ĐẠT — xem F-166-T4-1).
  Ghi nhận, không đổi ngưỡng (quyết (m) đợt 166 giữ nguyên
  điều kiện yên).
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate mở 04:11:35Z
  (poll #5 instance 3, gate0 T5) → attempt1 HỢP LỆ 04:15:44Z
  trên boot 194efd93 → **GATE cho chuỗi FULL PASS ĐẠT từ
  phía T4** (lượt yên hợp lệ #36, boot đo 194efd93, gate qua
  đường (a) chuẩn). T8 tự quyết O8 trên boot này.
- **(j) Các nợ đứng khác giữ nguyên từ đợt 166 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#94?/#95?/#96? giao T2
  (mù #88? MỞ, #94? (#62) MỞ, #95? (#63) MỞ theo quyết (b)
  đợt 163; mù #96? (#64) MỞ sau điều tra đầy đủ — T2-167
  theo dõi tiếp); birefnet 0 thử (đợt này không thử);
  u2net là fallback chính thức; kết cục run 166 + (m) cho
  reboot mới thuộc T7-167/T2-167; **POSTBOOT_PASS #69/#70
  ĐÃ CÓ từ đợt 165/166** (chỉ còn ý nghĩa hồ sơ — cả hai
  boot đã chết); **replay tự nhiên ĐÃ XONG trên boot mới
  194efd93 lúc T4 đóng** (dpkg 1545 dòng, gst 269, check
  độc lập của T5 PASS).

## A. Phụ lục số liệu (script trích từ log gốc — stats-167.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-167.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-22T02:41:09Z - 2026-11-22T02:41:09Z, boot=b643911f
   RAM min=933 max=933 >=1024: 0/1 500-1023: 1/1 <500: 0/1
   load1<2: 1/1 load5<2: 1/1 blockers>0: 0 apt>0: 1
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 113 poll, 2026-11-22T02:41:14Z - 2026-11-22T04:05:32Z, boot=b643911f
   RAM min=364 max=2139 >=1024: 23/113 500-1023: 52/113 <500: 38/113
   load1<2: 99/113 load5<2: 101/113 blockers>0: 0 apt>0: 102
   gate0: khong-dat=113
   lock: khong=113
   dpkg 2->1751
   chuoi RAM<500 dai nhat: 16 poll
-- instance 3: 5 poll, 2026-11-22T04:08:34Z - 2026-11-22T04:11:35Z, boot=194efd93
   RAM min=1323 max=1679 >=1024: 5/5 500-1023: 0/5 <500: 0/5
   load1<2: 2/5 load5<2: 1/5 blockers>0: 0 apt>0: 2
   gate0: T4-check-only=3, T5=2
   lock: khong=5
   dpkg 1167->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 119
-- RAM toan phien: min=364 max=2139 >=1024: 28/119 <500: 38/119
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 10/119
   gan-mo? #2 2026-11-22T02:41:59Z boot=b643911f RAM=1096 L1=0.98 L5=1.14 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #17 2026-11-22T02:53:18Z boot=b643911f RAM=1463 L1=0.58 L5=1.91 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #18 2026-11-22T02:54:03Z boot=b643911f RAM=1360 L1=0.31 L5=1.66 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #19 2026-11-22T02:54:48Z boot=b643911f RAM=1281 L1=0.44 L5=1.50 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #20 2026-11-22T02:55:33Z boot=b643911f RAM=1161 L1=0.62 L5=1.40 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #21 2026-11-22T02:56:18Z boot=b643911f RAM=1051 L1=0.71 L5=1.32 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #34 2026-11-22T03:06:05Z boot=b643911f RAM=1299 L1=1.52 L5=0.88 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #35 2026-11-22T03:06:50Z boot=b643911f RAM=1246 L1=0.92 L5=0.82 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #36 2026-11-22T03:07:35Z boot=b643911f RAM=1104 L1=0.43 L5=0.70 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #5 2026-11-22T04:11:35Z boot=194efd93 RAM=1323 L1=0.70 L5=1.81 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 194efd93: 5 poll; RAM>=1024 lan cuoi: 2026-11-22T04:11:35Z #5; RAM<1024 lan dau: KHONG CO
-- boot b643911f: 114 poll; RAM>=1024 lan cuoi: 2026-11-22T03:07:35Z #36; RAM<1024 lan dau: 2026-11-22T02:41:09Z #1 RAM=933
-- cong don P3' (MOI, 31 luot hop le): P1 118/121 P2 112/112 P3-A1 101/121 P3' 85/93 occ = 78/81 distinct-seq P7 65/65
-- chuoi median 31 luot: n=31 mean=48,3 min=39,0 max=60,0 vuot-60: 0
```
