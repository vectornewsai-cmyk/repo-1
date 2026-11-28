# PHASE9_ROUND196_T4_WEBKIT_QUIET64_LIMITS.md

**Đợt:** 196. **Luồng:** T4 — đo lượt yên WebKit #64 trên 1 boot
+ **#64 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ (chuỗi lượt yên hợp
  lệ 1 → 0 — ĐỨT sau 1 lượt).** Cả 3 attempt đều 20/20 probe NHƯNG
  lớp B VI PHẠM (B2 load1_max 6,55 / 5,06 / 5,42 — đều > 4) VÀ
  tickCost median 84,0 / 67,0 / 67,0 ms — đều > 60. Không attempt
  nào đạt cả hai điều kiện. Đây là đợt đầu tiên kể từ #59–#62 (đợt
  192/193/194 đều 0/3) mà cả 3 attempt đều vi phạm B2.
+ **BOOT ĐO: MỘT boot — bc09b26e (btime 14:30:16Z; SỐ HIỆU #123 ỨNG
  VIÊN — T01-196 xác minh 9 nguồn tươi). 0 reboot TRONG phiên đo;
  boot mới xảy ra TRƯỚC khi đợt mở ~5 phút.**
+ **P3' CỘNG DỒN GIỮ NGUYÊN (51 lượt hợp lệ): P1 227/231, P2 222/222,
  P3-A1 192/231, P3' 189/203 occurrence = 143/146 distinct-seq, P7
  125/125.** Không có lượt hợp lệ nên sổ distinct-seq GIỮ NGUYÊN
  as-of-195, md5 `b99babc5`. Seq (c2) attempt1 [66] / attempt2 [347]
  KHÔNG cộng sổ (attempt không hợp lệ).
+ **Labellag (b) — CHUỖI TRƯỚC #64 = 0 (ghi rõ theo quyết (m)-192):
  tính theo LƯỢT HỢP LỆ, không theo attempt.** Không có lượt hợp lệ
  nên chuỗi 0 occ GIỮ 0. Cả 3 attempt (không hợp lệ) đều 0 occurrence
  ≥5f — đều KHÔNG tính vào chuỗi.
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 15: KHÔNG ĐẠT** (xem §3,
  F-196-T4-6): áp ĐÚNG định nghĩa (p)-192 — live-check CHỈ đối chiếu
  trên cửa sổ attempt HỢP LỆ; đợt này KHÔNG CÓ cửa sổ hợp lệ nào nên
  không có gì để đối chiếu — kiểm chứng thất bại do vắng cửa sổ.
  Chuỗi live ĐẠT 10 → 0. Autotrigger 0 FIRE trong cả 3 cửa sổ (11 mẫu
  trong cửa sổ, tất cả watch/consec=0) — chỉ ghi nhận làm dữ kiện,
  không dùng làm verdict.
+ **B2 DỮ KIỆN THỨ 8 — CẢ 3 CỬA SỔ ĐỀU SPIKE TỰ-TẢI (xem §3,
  F-196-T4-5):** W1 27 spike (đỉnh 6,55, WebKit 63,2% + MiniBrowser
  26,0%); W2 21 spike (đỉnh 5,06); W3 20 spike (đỉnh 5,42, WebKit
  70,8% + MiniBrowser 29,6%). Khác dữ kiện thứ 7 (lẫn lộn 0 / 84 /
  0): lần này cả 3 cửa sổ đều spike, đều tự-tải là chính. T4 CHỈ BÁO
  SỐ — KHÔNG tự đổi luật KHÔNG TÁCH.
+ **FULL PASS: KHÔNG CÓ — chân (b) VẮNG (lượt yên #64 không hợp lệ).**
  Gate (a) #123 CÓ cờ (POSTBOOT_PASS, replay-day-du); O8 T01 3/3
  trên cùng boot (21/21 ×2 WebKit + Chromium); live-check #15 KHÔNG
  ĐẠT; harness T8 thuộc T8-196 báo cáo (T8 chưa đóng lúc T4 đóng).
**Ngày:** 26/11/2026 (lượt cron 21:35 +07 26/11 = 14:35:51Z).
**Boot đo:** bc09b26e (92 poll: 2 test + 90 poller).

## 0. Verdict tổng

- **#64 KHÔNG CÓ LƯỢT HỢP LỆ — 0/3 attempt hợp lệ, ngân sách 3/3 đã
  dùng.** Attempt1: 20/20 NHƯNG B1+B2 vi phạm (load1_max 6,55;
  load5 cuối 2,89) + tickCost median 84,0 ms > 60. Attempt2: 20/20
  NHƯNG B2 vi phạm (load1_max 5,06) + median 67,0 ms > 60.
  Attempt3: 20/20 NHƯNG B2 vi phạm (load1_max 5,42) + median 67,0
  ms > 60. **Chuỗi lượt yên hợp lệ: 1 → 0 (ĐỨT — lượt hợp lệ #63
  đợt 195 chỉ giữ được 1 lượt).**
- **Chân lượt yên cho chuỗi FULL PASS: VẮNG đợt này** — FULL PASS
  không thể có (parent/T10 quyết cuối).
- **(c2) attempt1 [66] / attempt2 [347] / attempt3 0 seq — KHÔNG tính**
  (attempt không hợp lệ; chỉ lượt hợp lệ mới cộng sổ). P3' cộng dồn
  GIỮ NGUYÊN 51 lượt. Labellag (b): cả 3 attempt 0 occ ≥5f — KHÔNG
  tính vào chuỗi (chuỗi 0 occ GIỮ 0).
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only postboot
  mỗi 4 poll là dự phòng được quyết, không phải vi phạm; xem §3).
  P3 .done ghi trong W1 là cờ nhẹ của luồng khác (F-196-T4-7), không
  phải vi phạm phía T4. P2 vite headed chặn gate polls #88/#89 (chậm
  attempt3 ~90 s) — thuộc P2, giao T2 phán.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `b2a2860b` (đổi 4
  md5 trong phiên 14:51:38–15:23:42Z, xem F-196-T4-1; ổn định từ poll
  #70 tới đóng).
- **Cờ:** `hidden_files/round196-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~17:00Z. **Boot lúc viết cờ là bc09b26e — CÙNG
  boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (14:40–14:41Z),
ghi vào `hidden_files/round196-t4/preflight-196.txt` — **PASS PHẦN
TĨNH** (3 chuỗi stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; tree-md5 khớp đọc trực tiếp — xem F-196-T4-1). Tóm tắt:

- **md5 khớp hệt bản đợt 195:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-195 md5 `b99babc5…`
  (occ 189/203, distinct 143/146, valid_rounds_p3 51, non_dat_in_union
  [260, 364, 498]). **Tree:** preview.tsx lúc mở poller là
  `591f9655` (đọc trực tiếp 14:40Z; tree-md5.txt ghi đúng; GIỐNG md5
  cuối đợt 195 — cây ổn định từ 03:05:49Z đợt 194 tới 14:51:38Z đợt
  này).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12+ file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-26
  16:30:00 UTC` → **1795710600** = 16:30Z (hạn cờ ~17:00Z =
  1795712400, hạn cứng 17:35:51Z = 1795714551); grep lần 2 sạch
  (chỉ còn hit `round195-t56/` fallback + glob `round195-*` CỐ Ý);
  sửa 3 chuỗi stale: comment gate0 trong `poll-wait-t4-196.sh`
  (round195-t56/round194-t56/ → round196-t56/round195-t56/),
  comment "het han cat 10:30Z" → 16:30Z, echo retry-wait "han cat
  10:30Z" → 16:30Z — xem F-196-T4-1.
- **Copy-forward 195 → 196 (script python thay thế có neo,
  KHÔNG sed global):** deadline `10:30Z` → `16:30Z 26/11`;
  hạn cờ/cứng → `17:00Z`/`17:35Z`; T5FLAG chính `round196-t56/` +
  fallback `round195-t56/` (FIX F-192-T56-1); `T4-195a` →
  `T4-196a`; `WebKit #63` → `#64`; glob `round194-*` →
  `round195-*`. Lỗi neo 1 lần lúc chạy copy (`'Han cat 10:30Z'`
  đã bị cặp `'10:30Z 26/11'` đổi trước — bỏ cặp thừa, chạy lại OK).
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 195).
- **Freeze check (F-164-T4-1):** `round195-t4` còn **0 file
  làm việc** mtime ≥ 14:35:51Z (đợt 196 mở 21:35:51 +07).
- **GATE0 LÚC MỞ: CHƯA ĐẠT (cờ T5).** round196-t56/ chưa tồn tại
  (T56-196 chưa khởi động lúc 14:40Z); fallback round195-t56/
  POSTBOOT_PASS mtime 08:51:26Z < btime 14:30:16Z nên
  poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ
  sai boot. **Check-only postboot chạy tay exit=0 PASS**
  (libs đủ; GST thư mục thật 269 plugin; apt đủ 11 gói — xem
  `preflight-postboot-196.log`). Replay hệ thống ĐÃ XONG trên
  boot mới (dpkg.log 1477 dòng; /var/log/apt TỒN TẠI — giống đợt
  195); 0 process apt/dpkg lúc kiểm. Gate0 dự phòng T4-check-only
  đạt từ poll #1.
- **dpkg.log 1477 DÒNG** (giữ 1477 suốt phiên — không reset).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (14:41:10Z): RAM 4008 MB, load1 6,08/load5 3,30, lock=khong,
  blockers=0, gate0=T4-check-only, t5flag=cu(mtime-cu),
  postboot_exit=0, apt=0, dpkg 1477. Lần 2 (14:41:11Z): RAM 4026 MB,
  load1 6,07/load5 3,34, còn lại giống lần 1. Cửa chưa mở vì
  load1/load5 >2 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~4008–4132 MB avail; load1 ~5,3–6,1 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 92 poll thật (2 test + 90), 3 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 2 poll, boot bc09b26e
  (14:41:10–14:41:11Z, 2 lần):** cả 2 đều gate0=T4-check-only,
  load1 ~6,1, load5 ~3,3, RAM 4008–4026 MB, lock=khong,
  blockers=0, apt=0, dpkg 1477 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-196.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot bc09b26e, 90 poll
  (14:41:12Z–15:56:35Z), 3 lần cửa mở:** RAM ≥1024:
  90/90 (min 1307, max 5035 MB); **<500: 0/90**;
  load1<2: 31/90; load5<2: 5/90; gate0:
  **T5 88/90**, T4-check-only 2/90; lock=co 7, khong 83;
  blockers>0: 18 poll; apt>0: 0 poll; dpkg 1477 suốt.
- **Giai đoạn 1 — chờ T01 nhả lock + load5 hạ (poll #1–#10,
  14:41:12–14:47:30Z):** gate0=T4-check-only polls #1–#2,
  **T5FLAG LẬT PASS ở poll #3** (T56 ghi POSTBOOT_PASS
  14:41:58Z — xem §4; đường chính `round196-t56/` — FIX
  F-192-T56-1 đứng đợt thứ tư liên tiếp); T01 giữ lock
  (thread=t01-round196, pid 8555, port 5560) polls #4–#10,
  nhả ở #11 (14:48:58Z); load1 6,07–12,19, load5 3,34–7,38;
  RAM 3977–5035 MB. Cửa KHÔNG MỞ.
- **Giai đoạn 2 — gate0 đạt (T5), chờ load5 (poll #11–#77,
  14:48:58–15:39:15Z):** gate0=T5 từ #3; load1 0,61–5,76,
  load5 2,03–4,63 — load5 KHÔNG xuống dưới 2 (chỉ chạm 2,00
  ở #84, sau đó mới xuống). Cửa KHÔNG MỞ. **Cây churn 4 md5
  trong giai đoạn này** (591f9655 → 558123e3 poll #17 →
  0e60683b poll #38 → b2a2860b poll #51; T4 cập nhật
  tree-md5.txt 3 lần — xem F-196-T4-1); polls MD5-KHAC: 31.
  Poll #32/#33 + #44 + #88/#89 có blockers=1 (vite headed
  của P2 :5690 — xem F-196-T4-7).
- **Giai đoạn 3 — cửa mở 3 lần (poll #78, #85, #90):** #78
  (15:40:01Z) RAM 2015 MB, load1 0,77, load5 1,90 →
  **CỬA YÊN MỞ**, attempt1 chạy; #85 (15:49:09Z)
  RAM 2229 MB, load1 0,75, load5 1,78 → **CỬA MỞ NGAY**
  sau attempt1, attempt2 chạy; #90 (15:56:35Z)
  RAM 2826 MB, load1 0,74, load5 1,61 → **CỬA MỞ NGAY**
  sau attempt2 (chậm ~90 s vì blocker P2 polls #88/#89),
  attempt3 chạy (quyết (h) đợt 149: poll lại gate trước mỗi
  attempt — cả 3 lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 16:00:57Z sau
  attempt3 (HET 3 ATTEMPT, 0 LUOT HOP LE, exit 11).
- **Phân rã 92 poll thật:** RAM≥1024: 92/92; RAM<500:
  **0/92**. load1<2: 31/92; load5<2: 5/92.
  **"gan-mo" đếm 5 = 3 lần mở cửa thật** (#78, #85, #90)
  + 2 lần đủ load nhưng kẹt blocker (#88, #89).
  gate0: T5=88, T4-check-only=2 (+2 test).
  blockers>0: 18 poll. apt>0: 0 poll. dpkg 1477 suốt phiên.

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 0 lượt hợp lệ

- **attempt1-bc09b26e: 20/20 NHƯNG B1+B2 VI PHẠM + tickCost median
  84,0 ms > 60 — KHÔNG HỢP LỆ.** Cửa sổ: marker 15:40:01Z →
  attempt-done 15:43:51Z (probe_exit=0; run-attempt exit=0
  15:43:51Z; analyzers chạy NGOÀI cửa sổ 15:43:51–15:44:37Z).
  JSON 2.283.822 B; flip wallMs 33.470 ms; lock vite giữ 230 s,
  nhả 15:43:51Z; vite :5187 kill sạch (curl 000); sampler dừng sạch
  (110 dòng). **0 writePartial TIMEOUT** (không wedged).
  **tickCost:** tổng n=384 median **84,0** p90 110,0 max 203
  min 31; hậu flip+2000ms n=292 median 84,0. Theo dải wallMs
  median 75,0 → 81,0 → 93,0 → 88,0 → 85,0 → 84,0 — CAO ĐỀU
  XUYÊN SUỐT (không dải nào ≤60).
  **Lớp B: B1 VI PHẠM** (load5 cuối 2,89); **B2 VI PHẠM
  (load1_max 6,55)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 997 MB, 0 mẫu <500; 1/109 mẫu <1024)**.
  **(c2) = 1 seq [66]** → P3' KHÔNG ĐẠT (stall_truoc=None);
  P1/P2/P3-A1/P7 KHÔNG tính (attempt không hợp lệ).
  **Labellag (b): 0 occurrence ≥5f** (skippedLatest=1: n=132,
  max 1f; skippedLatest=0: n=336, max 4f) — **KHÔNG tính vào
  chuỗi** (attempt không hợp lệ).
  **Perpass (20 pass):** median 78,5/73,0/90,0/86,5/81,0/94,0/
  88,0/100,0/94,5/84,0/88,0/88,0/85,0/83,0/87,0/84,0/79,0/85,0/
  65,0/77,0 — CAO ĐỀU (65–100, không pass nào ≤60); **pass 3
  chỉ n=5 tick, pass 8 chỉ n=3 tick** (các pass khác n=18–24 —
  tick THƯA khi tải leo, xem F-196-T4-4). **Load1 theo pass
  TĂNG DẦN: mean 1,96 → 2,43 → 2,79 → 3,55 → 4,05 → 4,28 →
  4,58 → 4,68 → 5,11 → 5,26 → 5,61 → 5,80 → 6,27 → 6,45 →
  6,21 → 6,08 → 5,83 → 5,71 → 5,62 → 5,69** (xem F-196-T4-3).
- **attempt2-bc09b26e: 20/20 NHƯNG B2 VI PHẠM + tickCost median
  67,0 ms > 60 — KHÔNG HỢP LỆ.** Cửa sổ: marker 15:49:10Z →
  attempt-done 15:52:53Z (probe_exit=0; run-attempt exit=0
  15:52:53Z). JSON 2.756.313 B; flip wallMs 30.969 ms; lock vite
  giữ 223 s, nhả 15:52:53Z; vite :5187 kill sạch (curl 000);
  sampler dừng sạch (106 dòng). **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=503 median **67,0** p90 94,0 max 175
  min 32; hậu flip+2000ms n=369 median 68,0.
  **Lớp B: B1 ĐẠT** (load5 cuối 2,43); **B2 VI PHẠM
  (load1_max 5,06)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1279 MB, 0 mẫu <500; 0/105 mẫu <1024)**.
  **(c2) = 1 seq [347]** → P3' ĐẠT (stall_truoc=3) — NHƯNG
  KHÔNG tính (attempt không hợp lệ). **Labellag (b): 0 occ ≥5f**
  (skippedLatest=1: n=140, max 4f; skippedLatest=0: n=456,
  max 4f). **Perpass:** median 65,0/69,0/70,0/63,0/68,0/64,0/
  63,5/72,0/62,0/65,0/65,0/66,5/65,0/69,0/64,0/71,0/75,0/67,5/
  75,0/84,0 — CAO ĐỀU (62–84). **Load1 theo pass TĂNG DẦN:
  mean 1,80 → 2,08 → 2,04 → 2,25 → 2,82 → 3,05 → 2,96 →
  3,69 → 4,11 → 4,06 → 4,10 → 4,18 → 4,25 → 4,34 → 4,49 →
  4,58 → 4,25 → 4,19 → 4,51 → 4,54.**
- **attempt3-bc09b26e: 20/20 NHƯNG B2 VI PHẠM + tickCost median
  67,0 ms > 60 — KHÔNG HỢP LỆ.** Cửa sổ: marker 15:56:36Z →
  attempt-done 16:00:18Z (probe_exit=0; run-attempt exit=0
  16:00:18Z). JSON 2.670.439 B; flip wallMs 31.552 ms; lock vite
  giữ 222 s, nhả 16:00:18Z; vite :5187 kill sạch (curl 000);
  sampler dừng sạch (107 dòng). **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=485 median **67,0** p90 93,6 max 151
  min 30; hậu flip+2000ms n=364 median 64,5.
  **Lớp B: B1 ĐẠT** (load5 cuối 2,05); **B2 VI PHẠM
  (load1_max 5,42)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1531 MB, 0 mẫu <500; 0/106 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): 0 occ ≥5f**
  (skippedLatest=1: n=148, max 4f; skippedLatest=0: n=446,
  max 4f). **Perpass:** median 82,0/72,0/72,5/69,5/64,0/75,5/
  74,0/73,0/64,0/77,0/58,0/59,0/63,0/64,0/70,0/42,5/59,5/60,0/
  64,0/82,0 — CAO ĐỀU (chỉ pass 16 = 42,5 là thấp).
  **Load1 theo pass TĂNG DẦN: mean 1,53 → 2,40 → 2,67 →
  3,09 → 3,65 → 3,92 → 3,96 → 4,08 → 4,16 → 4,63 → 5,27 →
  5,38 → 5,31 → 5,04 → 5,20 → 5,11 → 5,13 → 5,18 → 4,93 →
  4,85.**
- **Ngân sách 3/3 đã hết; poller thoát 16:00:57Z (exit 11 —
  HET 3 ATTEMPT, 0 LUOT HOP LE).**

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 8 CHO QUYẾT TÁCH: CẢ 3 CỬA SỔ ĐỀU
  SPIKE TỰ-TẢI** (xem F-196-T4-5). Khác dữ kiện thứ 7 (lẫn lộn
  0 / 84 / 0): lần này cả 3 attempt đều spike nhiều, đều tự-tải
  là chính:
  **Attempt1: 27 spike trong cửa sổ** (15:40:01–15:43:51Z),
  đỉnh **6,55** lúc 15:41:19Z (WebKitWebProcess 63,2% +
  MiniBrowser 26,0% — thuần tự-tải; `ps` 33,3% là nhiễu snapshot).
  **Attempt2: 21 spike trong cửa sổ** (15:49:10–15:52:53Z),
  đỉnh **5,06** lúc 15:50:54Z (top tại đỉnh: `hatch` 25,1% +
  `hatch-execd` 9,2% + MainThread 6,8% — runtime agent, không có
  process lạ nặng nào; WebKit không nằm top-3 tại đúng giây đỉnh).
  **Attempt3: 20 spike trong cửa sổ** (15:56:36–16:00:18Z),
  đỉnh **5,42** lúc 15:57:38Z (WebKitWebProcess 70,8% +
  MiniBrowser 29,6% — thuần tự-tải; `ps` 100,0% là nhiễu snapshot).
  **T4 chỉ báo số:** dữ kiện thứ 8 KHÔNG lẫn lộn theo kiểu cũ —
  cả 3 cửa sổ đều spike tự-tải; luật B2 KHÔNG TÁCH vẫn đứng cho
  tới khi parent quyết — T4 KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-196; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ (marker → attempt-done): W1 4 mẫu
  15:40:34–15:43:34Z, W2 4 mẫu 15:49:34–15:52:34Z, W3 3 mẫu
  15:57:35–15:59:35Z — **trigger=watch, consec=0 ở tất cả các
  mẫu: 0 FIRE / 0 WOULD-FIRE / 0 MISSED-WINDOW.** `b2-spikes.log`
  0 hit FIRE (T9-196 phán cuối). Balloon theo autotrigger: W1
  3,24–4,94 GB; W2 4,10–4,66 GB; W3 3,73–4,44 GB. RAM avail thấp
  nhất trong cửa sổ: W1 1.099.876 kB (~1,07 GB) lúc 15:41:34Z.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 15: KHÔNG ĐẠT
  (F-196-T4-6).** Áp ĐÚNG định nghĩa (p)-192: live-check CHỈ
  đối chiếu trên cửa sổ attempt HỢP LỆ — đợt này KHÔNG CÓ cửa
  sổ hợp lệ nào (0/3 attempt hợp lệ) nên KHÔNG CÓ cửa sổ để đối
  chiếu — kiểm chứng thất bại do vắng cửa sổ, không phải do phát
  hiện kẹt. **Chuỗi live ĐẠT 10 → 0.** Dữ kiện ghi nhận (không
  dùng làm verdict): cả 3 cửa sổ đều có spike B2 (27/21/20),
  1 file cờ nhẹ trong W1 (round196-p3.done — không phải file
  analyzer), autotrigger 11 mẫu trong cửa sổ đều watch/consec=0,
  0 FIRE.
- **O8 T01 TRÊN BOOT bc09b26e — 3/3.** O8 T01 21/21 pass ×2
  (WebKit + Chromium), xong 14:48:54Z, nhả lock; poller T4
  thấy lock T01 polls #4–#10, nhả ở #11. O8 chạy trên cây
  591f9655 (trước khi cây đổi sang 558123e3 lúc 14:51:38Z —
  hai bộ O8 đợt này KHÔNG cùng cây với attempt T4). O8 T8 +
  harness thuộc T8-196 báo cáo (T8 chưa đóng lúc T4 đóng).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu; kiểm file round196-* mtime trong cửa sổ, loại
  round196-t4):**
  **W1 (15:40:01–15:43:51Z):** (a) `round196-p3.done`
  (cờ P3 ghi 15:43:45Z, nhẹ — 6 s trước attempt-done); (b)
  T8 waiter (pid 7532, bash exec wrapper `wait-t4-t5-196t8.sh`,
  idle) có mặt trong ps-before; (c) T56 monitor (pid 74162,
  `sleep 600` poll `poll-t4.log` mỗi 600 s) có mặt trong
  ps-before; (d) T9 sampler-autotrigger (pid 8193, chạy liên
  tục, nhẹ) có mặt trong ps-before/after. **0 process nặng lạ**
  (không ffmpeg/tsc/chrome/vite khác trong ps-before/after).
  **W2 (15:49:10–15:52:53Z): 0 file** — cửa sổ sạch nhất đợt
  này (chỉ T8 waiter + T9 sampler trong ps; 0 process nặng lạ).
  **W3 (15:56:36–16:00:18Z): 0 file** (chỉ T8 waiter + T9
  sampler trong ps; 0 process nặng lạ).
  **0 file round195-* nào bị sửa trong cả 3 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh — các luồng đợt
  196 ghi vào round196-*, không ghi round195-*).
- **P2 VITE HEADED CHẶN GATE POLLS #88/#89 (F-196-T4-7).**
  Vite headed của P2 (`/tmp/round196-p2/vite.p2.headed.config.mjs`,
  port 5690, pid 90043) là blocker=1 ở polls #88 (15:55:04Z)
  và #89 (15:55:50Z) — cả hai poll đều đủ load1<2 + load5<2 +
  RAM≥1024 nhưng cửa không mở vì blocker; cửa mở ở #90
  (15:56:35Z) khi P2 vite đã tắt — attempt3 chậm ~90 s so với
  lúc load đủ. Giao T2 phán (vi phạm hay không).
- **T56 HARNESS — 0 CHỒNG TRONG CỬA SỔ.** T56-196 đã đóng cờ
  (.done 15:11:46Z, trước W1); không chunk T56 nào chạy trong
  W1/W2/W3 (kiểm file round196-t56 mtime trong cửa sổ: 0).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-196.sh` chạy NGOÀI cửa sổ cả 3
  lần (sau attempt-done). `round195-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS bc09b26e CÓ (T56, poll=0, replay-day-du)

- **Boot bc09b26e (btime 14:30:16Z, số hiệu #123 ỨNG
  VIÊN — T01-196 XÁC MINH 9 nguồn tươi, parent quyết (e) ở
  §14.2-196).** Gap #122→#123 = 11.556 s (T01-196 xác minh;
  btime #122 = 11:17:40Z theo quyết (e)-195).
- **POSTBOOT_PASS bc09b26e ĐÃ CÓ 14:41:58Z** (round196-t56/,
  T56-196; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "boot bc09b26e... replay-day-du: dpkg 1477 dong;
  cache 171 .deb; lists 37; postboot PASS poll0 doc lap exit 0
  luc 2026-11-26T14:41:58Z; POSTBOOT_PASS moi ghi
  2026-11-26T14:41:58Z poll=0 (replay-day-du); co cu 8c4aa907
  luu POSTBOOT_PASS-8c4aa907". **Check-only của T4 PASS độc
  lập từ pre-flight (14:40Z)** và giữ PASS suốt phiên (gate0
  T5 88/90 poll; T4-check-only 2/90 poll đầu). **Replay
  bc09b26e: ĐÃ XONG trước khi T4 mở poller** (dpkg.log 1477
  dòng lúc pre-flight; /var/log/apt tồn tại — giống đợt 195).
  **GST #123 là THƯ MỤC THẬT** (preflight check-only:
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` thư mục thật,
  269 plugin — giống #117/#121, khác #119 symlink).
  **#122 POSTBOOT_PASS KHÔNG CÓ** (T01-196 — không viết được
  post-hoc; tổng boot không cờ 29 → 30 nếu parent chấp nhận).
- **Tổng boot không cờ 29 → 30 NẾU parent chấp nhận #122
  không cờ** (theo T01-196; T5-196/parent quyết).
- **REBOOT MỚI bc09b26e (btime 14:30:16Z, gap ~11.556 s từ
  #122) — TRƯỚC KHI ĐỢT MỞ ~5 PHÚT (đợt mở 14:35:51Z).**
  0 reboot trong phiên đo (từ mở poller 14:41:12Z tới
  poller thoát 16:00:57Z, boot luôn bc09b26e). **(m)
  #122 + #123 THÔ 0 requeue (T01-196); POSTBOOT_PASS
  bc09b26e (T56-196).**
- **HAI KHOẢNG LẶNG SCHEDULER MỚI (T01-196, F-196-T01-2):
  #A 4.974 s (10:12:46.713Z → 11:35:41.152Z) bao trùm btime
  #122; #B 6.826 s (12:41:54.161Z → 14:35:40.437Z) bao trùm
  btime #123 — lớn thứ hai trong họ (sau 8.406 s đợt 179).**
  Cùng chữ ký OUTAGE #2/#3 (0 event bất kỳ; ID liên tục;
  reboot nằm trong lặng; run trễ lúc hồi phục). 4 lặng trong
  ~11,5 giờ ngày 26/11 — tần suất đang tăng. Phân loại cuối
  thuộc T7-196 + parent (n).
- **Scheduler gap / OUTAGE + 84l10 / 85m4 / 86n2: KHÔNG CÓ
  DỮ KIỆN TRONG PHIÊN T4.** OUTAGE phán cuối thuộc T7-196;
  verdict harness thuộc T8-196.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND196_T4_WEBKIT_QUIET64_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round196-t4/`):**
  `poll-wait-t4-196.sh` (deadline 16:30Z 26/11 + cờ T5
  round196-t56/ + fallback round195-t56/),
  `run-attempt-196.sh` (lượt yên #64),
  `run-analyzers-196.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-196.py` (helper đọc sổ — KHÔNG dùng live đợt
  này: không có lượt hợp lệ nên sổ GIỮ NGUYÊN as-of-195).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–195, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round196-t4/` — theo đúng mẫu 149–195: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–195).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (b2a2860b) +
  `stats-196.py` + `distinct-seq-196.py` (KHÔNG DÙNG LIVE) +
  `distinct-seq-ledger.json` (as-of-195, md5 `b99babc5`) +
  `preflight-196.txt` (+ 3 lần cập nhật tree-md5) +
  `preflight-postboot-196.log` + `round196-t4-copy.py`.
- **Log/evidence (hidden_files/round196-t4/, không stage):**
  `poll-t4.log` (90 poll + CỬA MỞ #78/#85/#90 + HET 3 ATTEMPT),
  `poll-t4.nohup.log` (1 instance),
  `poll-test-196.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CỬA MỞ + 3 attempt +
  HET 3 ATTEMPT, poller thoát 16:00:57Z),
  `postboot-t4-196-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-196-output.txt` (output stats-196.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-bc09b26e.json`
  (2.283.822 B / 2.756.313 B / 2.670.439 B),
  `load-mid-t4-attempt{1,2,3}-bc09b26e.log` (110/106/107
  dòng), `analyze-t4-attempt{1,2,3}-bc09b26e-*.txt`
  (9 file mỗi attempt — KHÔNG có `p1p3p7` vì không có attempt
  hợp lệ, xem F-195-T4-12),
  `coverage-check-attempt{1,2,3}-bc09b26e.txt` (1/1, 1/1,
  0 seq), `classb-t4-attempt{1,2,3}-bc09b26e.txt`,
  `ps-before/after-t4-attempt{1,2,3}-bc09b26e.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 1477 cả 3 attempt). **3 JSON attempt (0 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 16:00:57Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 KHÔNG trống — X193 (Xvfb của probe T4, cả 3
  attempt đều :193) + X196 (luồng khác — P2 headed; T4 chỉ
  dùng :193).**

## 6. Sai số F-196-T4-1..8 + nợ cũ

- **F-196-T4-1 — CÂY CHURN 4 MD5, T4 CẬP NHẬT tree-md5.txt 3 LẦN
  (MỚI — NẶNG HƠN F-194-T4-1/F-195-T4-1).** preview.tsx đổi
  591f9655 → 558123e3 (mtime 14:51:38Z, poll #17) →
  0e60683b (mtime 15:09:20Z, poll #38) → 03b6c941 (poll #51,
  chỉ tồn tại ~4 phút) → b2a2860b (mtime 15:23:42Z, poll #57).
  T4 cập nhật tree-md5.txt 3 lần theo tiền lệ F-194-T4-1 (chờ
  ổn định rồi mới cập nhật): → 558123e3 (ổn định 4 poll #17–
  #20) → 0e60683b (ổn định 8 poll #38–#45) → b2a2860b (ổn
  định 10 poll #57–#66); cây ổn định ở b2a2860b từ poll #70
  tới đóng (24 poll YES). 31 poll MD5-KHAC trong phiên. Grep
  stale lần 2 bắt 3 chuỗi sót trước pre-flight (comment gate0
  + comment deadline + echo retry-wait). Không ảnh hưởng verdict
  (cả 3 attempt đều chạy trên cây b2a2860b đã ổn định).
- **F-196-T4-2 — 0/3 ATTEMPT HỢP LỆ, CHUỖI LƯỢT YÊN HỢP LỆ
  1 → 0 (MỚI — ĐỨT SAU 1 LƯỢT).** Cả 3 attempt đều 20/20
  probe NHƯNG B2 vi phạm (load1_max 6,55/5,06/5,42) VÀ
  tickCost median 84,0/67,0/67,0 ms > 60 — vi phạm KÉP ở cả
  3 attempt (khác đợt 192/193/194: các attempt vô hiệu chủ yếu
  do 1 lý do). Lần đầu kể từ đợt 191 mà cả 3 attempt đều vi
  phạm B2. T4 không tự hạ ngưỡng, không retry ngoài ngân sách.
- **F-196-T4-3 — LOAD1 RAMP XUYÊN SUỐT MỖI ATTEMPT (MỚI —
  MẪU MỚI, KHÁC ĐỢT 195).** Load1 mean theo pass TĂNG ĐƠN ĐIỆU
  trong cả 3 attempt (A1: 1,96 → 6,45; A2: 1,80 → 4,58; A3:
  1,53 → 5,38) rồi hạ sau khi attempt kết thúc — tải leo DẦN
  theo pass, không phải spike đột ngột. ps-before/after KHÔNG
  có process nặng lạ nào; 0 file ghi trong W2/W3 — tải leo
  khóa thời gian với chính probe (vite + WebKit chạy trên cây
  preview.tsx đã sửa 4 lần đợt này). T4 chỉ ghi nhận tương quan
  thời gian, KHÔNG kết luận nhân quả (chưa có bằng chứng phân
  rã CPU theo process trong lúc leo).
- **F-196-T4-4 — ATTEMPT1 PASS 3/8 THƯA TICK (MỚI).** Pass 3
  chỉ n=5 tick (median 90,0), pass 8 chỉ n=3 tick (median
  100,0) — các pass khác n=18–24. Tick thưa đúng lúc load1
  đang leo (pass 3 mean 2,79; pass 8 mean 4,68) — probe bị
  đói CPU giữa chừng. Attempt2/3 không có pass thưa (n≥20 mọi
  pass). Chỉ ghi nhận, không suy đoán nguyên nhân.
- **F-196-T4-5 — B2 DỮ KIỆN THỨ 8: CẢ 3 CỬA SỔ ĐỀU SPIKE
  TỰ-TẢI (MỚI — XEM §3).** W1 27 spike (đỉnh 6,55, WebKit
  63,2%); W2 21 spike (đỉnh 5,06); W3 20 spike (đỉnh 5,42,
  WebKit 70,8%). Khác dữ kiện thứ 7 (lẫn lộn 0/84/0): lần này
  KHÔNG lẫn lộn — cả 3 cửa sổ đều spike, đều tự-tải là chính.
  T4 chỉ báo số, KHÔNG tự quyết tách.
- **F-196-T4-6 — (p) LIVE LẦN 15 KHÔNG ĐẠT (MỚI — CHUỖI
  LIVE ĐẠT 10 → 0).** Không có cửa sổ attempt hợp lệ nào để
  đối chiếu theo định nghĩa (p)-192 — kiểm chứng thất bại do
  vắng cửa sổ. Autotrigger 0 FIRE trong cả 3 cửa sổ (11 mẫu
  trong cửa sổ, watch/consec=0) chỉ là dữ kiện, không cứu được
  verdict (không có cửa sổ hợp lệ thì không có gì để đối
  chiếu). Lần FIRE thật đầu tiên vẫn chưa xảy ra.
- **F-196-T4-7 — P3 .done TRONG W1 + P2 VITE CHẶN GATE #88/#89
  (MỚI — XEM §3).** (a) `round196-p3.done` ghi 15:43:45Z,
  trong W1 (cờ nhẹ, 6 s trước attempt-done — cùng mẫu như
  round195-p3.done trong W3 đợt 195). (b) Vite headed của P2
  (:5690, pid 90043) là blocker=1 ở polls #88/#89 — attempt3
  chậm ~90 s. Cả hai đều không đổi verdict (W1 đã vô hiệu vì
  B2+median; attempt3 chạy ngay khi blocker hết). Giao T2 phán.
- **F-196-T4-8 — T8 WAITER + T56 MONITOR TRONG PS SNAPSHOT
  (MỚI — NHẸ, GHI NHẬN).** T8 waiter (pid 7532,
  `wait-t4-t5-196t8.sh`, idle) có mặt trong ps-before cả 3
  attempt; T56 monitor (pid 74162, `sleep 600` poll
  `poll-t4.log`) có mặt trong ps-before attempt1; T9
  sampler-autotrigger (pid 8193) có mặt trong ps-before/after
  cả 3 attempt (chạy liên tục theo thiết kế, nhẹ). Cả ba đều
  idle/nhẹ — 0 bằng chứng ảnh hưởng verdict. Ghi nhận để T2/T5
  đối chiếu nguồn (đợt 195 đã có mẫu tương tự: chrome lạ
  vf194, F-195-T4-9).
- **Nợ cũ:** F-195-T4-1 → F-196-T4-1 (nặng hơn: 4 md5, 3 lần
  cập nhật); F-195-T4-2 ĐÃ HẾT (T5FLAG chính round196-t56/
  lật PASS từ poll #3); F-195-T4-3 → F-196-T4-2 (dạng nặng
  hơn: median cao cả 3 attempt, không phải 1); F-195-T4-4
  KHÔNG tái diễn (0 writePartial TIMEOUT, không wedged);
  F-195-T4-5 → F-196-T4-5 (dạng mới: đều spike, không lẫn);
  F-195-T4-6 → F-196-T4-6 (ĐẠT → KHÔNG ĐẠT); F-195-T4-7
  KHÔNG tái diễn (T56 0 chồng trong cửa sổ); F-195-T4-8
  KHÔNG tái diễn dạng cũ (P3 chỉ ghi cờ nhẹ trong W1, không
  probe/ffmpeg chồng pha (b)); F-195-T4-9 → F-196-T4-8 (dạng
  mới: waiter/monitor trong ps); F-195-T4-10 tái diễn (X193
  của probe T4, cả 3 attempt :193); F-195-T4-11 ĐÃ HẾT (không
  còn cảnh báo pgrep >15 ký tự); F-195-T4-12 VẪN ĐỨNG
  (run-analyzers không gọi p1p3p7 — đợt này không có attempt
  hợp lệ nên không cần chạy tay; nợ vẫn mở cho đợt sau).

## 7. P3' cộng dồn (GIỮ NGUYÊN — 51 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 196 (GIỮ NGUYÊN): P1 227/231, P2
  222/222, P3-A1 192/231, P3' 189/203 occurrence = 143/146
  distinct-seq, P7 125/125** (51 lượt hợp lệ — #64 KHÔNG CÓ
  lượt hợp lệ nên không cộng thêm). Cơ sở: cộng dồn chỉ tính
  trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #64: KHÔNG CÓ.** (c2) attempt1 [66] P3'
  KHÔNG ĐẠT; attempt2 [347] P3' ĐẠT — cả hai đều KHÔNG tính
  (attempt không hợp lệ); attempt3 (c2)=0. Sổ distinct-seq
  GIỮ NGUYÊN as-of-195 (md5 `b99babc5`); helper
  `distinct-seq-196.py` KHÔNG chạy live đợt này.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có lượt hợp lệ mới để thay đổi;
  P1/P2/P3-A1/P7 không có số mới đợt này).
- **Labellag (b) — CHUỖI TRƯỚC #64 = 0; #64 KHÔNG CÓ lượt hợp
  lệ → chuỗi 0 occ GIỮ 0** (quyết (m)-192: chỉ lượt hợp lệ
  mới tính; cả 3 attempt đều 0 occ ≥5f nhưng đều không hợp
  lệ nên không tính).
- Chuỗi median tickCost 51 lượt (GIỮ NGUYÊN — không thêm số
  mới): 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 ms (tổng 2414,0; trung bình
  47,3 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).
  Median 3 attempt không hợp lệ đợt này (84,0 / 67,0 / 67,0)
  KHÔNG đưa vào chuỗi.

## 8. Chờ quyết parent / nợ đợt 197

- **(a) #64 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 1 → 0
  (ĐỨT; ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên cho chuỗi
  FULL PASS **VẮNG đợt này.**
- **(b) P3' cộng dồn GIỮ NGUYÊN 51 lượt: P1 227/231, P2 222/222,
  P3-A1 192/231, P3' 189/203 = 143/146, P7 125/125:**
  sổ distinct-seq GIỮ NGUYÊN as-of-195 md5 `b99babc5`.
  **Chờ parent/T10 quyết:** ghi nhận không thăng cấp.
- **(c) BOOT bc09b26e (số hiệu #123 ỨNG VIÊN —
  T01-196 xác minh 9 nguồn tươi, parent quyết (e) ở §14.2-196).**
  **(m) #122 + #123 THÔ 0 requeue (T01-196);
  POSTBOOT_PASS bc09b26e (T56-196).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 3 chuỗi sót +
  tree-md5 khớp đọc trực tiếp (F-196-T4-1); T5FLAG chính đã
  sửa sang `round196-t56/` (FIX F-192-T56-1; gate0 T5 PASS
  từ poll #3).
- **(e) POSTBOOT_PASS bc09b26e CÓ lúc T4 đóng (T56 14:41:58Z,
  poll=0, replay-day-du). Tổng boot không cờ 29 → 30 NẾU parent
  chấp nhận #122 không cờ (T01-196). GST #123 là THƯ MỤC THẬT
  (269 plugin) — không có caveat symlink.**
- **(f) RAM 0 poll <500 MB (min 1307 MB) — không có episode
  RAM thấp đợt này; giao T9-196 phán (nếu có).**
- **(g) (m) #122 phán CUỐI (T2-196); (m) #123 THÔ (T2-196);
  INSIDE (T2-196); POSTBOOT_PASS bc09b26e (T56-196); số hiệu
  bc09b26e = #123? (T01-196 xác minh; btime 14:30:16Z); OUTAGE
  phán cuối T7-196 (2 khoảng lặng mới #A 4,974 s / #B 6,826 s
  — T01-196); auto-trigger lần FIRE thật đầu tiên —
  VẪN CHƯA XẢY RA (T9-196); B2 dữ kiện thứ 8 đều spike tự-tải
  (T4-196 — BẢN NÀY); (m) #56 lần 37; mù hole-recheck lần 38;
  prune lần 69; headroom (T9-196); ENOSPC lần 43?;
  84l10 PASS chuỗi?; 86n2-P1 chuỗi 17?; B2 live sạch lần 9?;
  E-247 kết cục (T9-196); run kết cục (T7-196).**
- **(h) B2 DỮ KIỆN THỨ 8 ĐỀU SPIKE TỰ-TẢI (F-196-T4-5). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 3 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-196 verify end-to-end khi có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **0 lượt yên hợp lệ #64 cho chuỗi FULL
  PASS.** O8 T01 trên bc09b26e (21/21 ×2 WebKit + Chromium,
  xong 14:48:54Z — T01 đã đóng cờ, T10 xác minh cuối);
  O8 T8 + harness thuộc T8-196 báo cáo (T8 chưa đóng lúc
  T4 đóng).
- **(j) F-196-T4-1 (cây churn 4 md5, cập nhật tree-md5 3 lần);
  F-196-T4-2 (0/3 hợp lệ, chuỗi lượt yên 1 → 0);
  F-196-T4-3 (load1 ramp xuyên suốt mỗi attempt);
  F-196-T4-4 (attempt1 pass 3/8 thưa tick);
  F-196-T4-5 (B2 dữ kiện thứ 8 đều spike tự-tải);
  F-196-T4-6 ((p) live lần 15 KHÔNG ĐẠT — chuỗi live ĐẠT
  10 → 0); F-196-T4-7 (P3 .done trong W1 + P2 vite chặn gate
  #88/#89); F-196-T4-8 (T8 waiter + T56 monitor trong ps).**

## Phụ lục A — stats-196-output.txt (tóm tắt)

```
test: 2 poll, RAM 4008-4026 >=1024: 2/2, load1<2: 0/2, gate0: T4-check-only=2
poller: 90 poll 14:41:12-15:56:35Z, RAM min=1307 max=5035 >=1024: 90/90
  <500: 0/90, load1<2: 31/90, load5<2: 5/90, gate0: T5=88, T4-check-only=2
  lock: co=7, khong=83, dpkg 1477->1477
TONG: 92 poll; RAM min=1307 max=5035 >=1024: 92/92 <500: 0/92
gan-mo: #78 15:40:01Z RAM=2015 L1=0.77 L5=1.90; #85 15:49:09Z RAM=2229
  L1=0.75 L5=1.78; #88 15:55:04Z RAM=3005 L1=0.84 L5=1.91 blk=1 (P2 vite);
  #89 15:55:50Z RAM=2307 L1=0.91 L5=1.78 blk=1 (P2 vite);
  #90 15:56:35Z RAM=2826 L1=0.74 L5=1.61
P3' (51 luot, GIU NGUYEN): P1 227/231 P2 222/222 P3-A1 192/231 P3' 189/203 = 143/146 P7 125/125
median 51 luot: n=51 mean=47,3 min=39,0 max=60,0 vuot-60: 0
```
