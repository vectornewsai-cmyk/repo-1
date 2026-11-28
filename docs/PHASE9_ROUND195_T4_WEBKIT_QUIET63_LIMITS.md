# PHASE9_ROUND195_T4_WEBKIT_QUIET63_LIMITS.md

**Đợt:** 195. **Luồng:** T4 — đo lượt yên WebKit #63 trên 1 boot
+ **#63 CÓ LƯỢT HỢP LỆ — attempt3 HỢP LỆ (chuỗi lượt yên hợp lệ 0 → 1
  — lượt hợp lệ ĐẦU TIÊN kể từ #59 đợt 191; các đợt 192/193/194 đều
  0/3).** Attempt3: 20/20 + lớp B ĐẠT 5/5 + tickCost median 53,0 ms
  ≤ 60. Attempt1: 20/20 + B 5/5 nhưng median 78,0 ms > 60. Attempt2:
  20/20 pass trong partial JSON nhưng PAGE-WEDGED (cả 3 writePartial
  TIMEOUT sau pass 20, exit=2) — không tính verdict.
+ **BOOT ĐO: MỘT boot — 8c4aa907 (btime 08:22:05Z; SỐ HIỆU #121 ỨNG
  VIÊN — T01-195 xác minh). 0 reboot TRONG phiên đo; boot mới xảy ra
  TRƯỚC khi đợt mở ~14 phút.**
+ **P3' CỘNG DỒN MỚI (51 lượt hợp lệ): P1 227/231, P2 222/222,
  P3-A1 192/231, P3' 189/203 occurrence = 143/146 distinct-seq, P7
  125/125.** Sổ distinct-seq THĂNG CẤP as-of-195, md5 `b99babc5`
  (seq MỚI 473; 306/330 đã thấy).
+ **Labellag (b) — CHUỖI TRƯỚC #63 = 0 (ghi rõ theo quyết (m)-192):
  tính theo LƯỢT HỢP LỆ, không theo attempt.** Lượt hợp lệ attempt3
  có 6 occ / 2 events (b) nên chuỗi 0 occ GIỮ 0 (không phải lượt
  0 occ); attempt1 (không hợp lệ) 2 occ ≥5f, attempt2 0 occ — đều
  KHÔNG tính vào chuỗi.
+ **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 14: ĐẠT** (xem §3,
  F-195-T4-6): áp ĐÚNG định nghĩa (p)-192 — live-check CHỈ đối chiếu
  trên cửa sổ attempt HỢP LỆ; cửa sổ hợp lệ duy nhất W3 có 0 spike
  B2 + 0 file analyzer ghi trong cửa sổ + autotrigger 3 mẫu watch/
  consec=0, 0 FIRE. Chuỗi live ĐẠT 9 → 10.
+ **B2 DỮ KIỆN THỨ 7 — LẪN LỘN, CHỈ BÁO SỐ** (xem §3, F-195-T4-5):
  attempt1 0 spike (lạ-tải nhẹ); attempt2 tự-tải là chính (84 spike,
  đỉnh ~105% CPU là probe); attempt3 sạch (0 spike). Lần lẫn lộn
  thứ 4 liên tiếp. T4 KHÔNG tự đổi luật KHÔNG TÁCH.
+ **FULL PASS: PHỤ THUỘC HARNESS T8 (T10/parent quyết cuối).** Chân
  (b) CÓ (lượt yên #63 hợp lệ); gate (a) #121 CÓ cờ (POSTBOOT_PASS,
  replay-day-du); O8 T01 3/3 trên cùng boot (21/21 ×2 WebKit +
  Chromium); live-check #14 ĐẠT; harness T8 CHƯA CÓ lúc T4 đóng
  (T8-195 chưa đóng cờ).
**Ngày:** 26/11/2026 (lượt cron 15:35 +07 26/11 = 08:35:51Z).
**Boot đo:** 8c4aa907 (40 poll: 2 test + 38 poller).

## 0. Verdict tổng

- **#63 CÓ LƯỢT HỢP LỆ — attempt3 HỢP LỆ, ngân sách 3/3 đã dùng.**
  Attempt1: 20/20 + lớp B ĐẠT 5/5 NHƯNG tickCost median 78,0 ms >
  60 — KHÔNG hợp lệ. Attempt2: 20/20 pass trong partial JSON NHƯNG
  PAGE-WEDGED (cả 3 writePartial TIMEOUT sau pass 20, probe_exit=2)
  — KHÔNG tính verdict. Attempt3: 20/20 + lớp B ĐẠT 5/5 + tickCost
  median **53,0 ms ≤ 60 — HỢP LỆ**. **Chuỗi lượt yên hợp lệ: 0 → 1
  (lượt hợp lệ đầu tiên kể từ #59 đợt 191 — ĐỀ XUẤT — parent quyết
  cuối).**
- **Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này** (attempt3 hợp
  lệ #63) — FULL PASS phụ thuộc harness T8 (chưa có lúc T4 đóng);
  parent quyết cuối.
- **(c2) attempt3 = 4 occ [306, 330, 330, 473]** → P1 ĐÚNG 4/4
  (p=0,000789); P2 ĐÚNG 4/4 (lag 1, 6, 3, 1 — đều ≥ +1f); P3-A1
  SAI (2/4, p=0,28); **P3' 2/3 distinct ĐẠT [306, 473], 330 KHÔNG
  ĐẠT (stall 1)**; P7 ĐÚNG. Labellag (b) lượt hợp lệ: **6 occ /
  2 events** (lag max +8f) — chuỗi 0 occ GIỮ 0.
- **0 VI PHẠM PHÍA T4** (không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; check-only postboot
  mỗi 4 poll là dự phòng được quyết, không phải vi phạm; xem §3).
  T56 chunk2 chồng ~11 s đầu pha (b) attempt1 NHƯNG bị monitor kill
  trước khi pass 1 ghi partial (F-195-T4-7) — 0 bằng chứng ảnh hưởng;
  giao T2 phán.
- **Cây lúc đóng:** `apps/web/src/preview.tsx` md5 `591f9655` (ỔN
  ĐỊNH suốt phiên — 0 lần đổi, khác đợt 194 churn 3 md5).
- **Cờ:** `hidden_files/round195-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~11:00Z. **Boot lúc viết cờ là 8c4aa907 — CÙNG
  boot đo.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (08:44–08:47Z),
ghi vào `hidden_files/round195-t4/preflight-195.txt` — **PASS PHẦN
TĨNH** (1 comment stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; tree-md5 khớp đọc trực tiếp — xem F-195-T4-1). Tóm tắt:

- **md5 khớp hệt bản đợt 194:** b.json `078938cf…`, probe
  `4291e539…`, vite T4 `e3e874e1…`, sổ as-of-191 md5 `b7ed5791…`
  (occ 187/199, distinct 142/145, valid_rounds_p3 38, non_dat_in_union
  [260, 364, 498]). **Tree:** preview.tsx lúc mở poller là
  `591f9655` (đọc trực tiếp 08:44Z; tree-md5.txt ghi đúng; GIỐNG md5
  cuối đợt 194 — cây ổn định từ 03:05:49Z đợt 194).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-26
  10:30:00 UTC` → **1795689000** = 10:30Z (hạn cờ ~11:00Z =
  1795690800, hạn cứng 11:35:51Z = 1795692951); grep lần 2 sạch
  (chỉ còn hit `round195-t56/` + glob `round194-*` CỐ Ý);
  sửa 1 chuỗi stale: comment gate0 trong `poll-wait-t4-195.sh`
  (`round194-t56/round193-t56/` → `round195-t56/round194-t56/`)
  — xem F-195-T4-1.
- **Copy-forward 194 → 195 (script python thay thế có neo,
  KHÔNG sed global):** deadline `04:30Z` → `10:30Z 26/11`;
  hạn cờ/cứng → `11:00Z`/`11:35Z`; T5FLAG chính `round195-t56/` +
  fallback `round194-t56/` (FIX F-192-T56-1); `T4-194a` →
  `T4-195a`; `WebKit #62` → `#63`; glob `round193-*` →
  `round194-*`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 194).
- **Freeze check (F-164-T4-1):** `round194-t4` còn **0 file
  làm việc** mtime ≥ 08:35:51Z (đợt 195 mở 15:35:51 +07).
- **GATE0 LÚC MỞ: CHƯA ĐẠT (cờ T5).** round195-t56/ chưa tồn tại
  (T56-195 chưa khởi động lúc 08:44Z); fallback round194-t56/
  POSTBOOT_PASS mtime 02:50:55Z < btime 08:22:05Z nên
  poller đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ
  sai boot. **Check-only postboot chạy tay exit=0 PASS**
  (libs đủ; GST thư mục thật 269 plugin; apt đủ 11 gói — xem
  `preflight-postboot-195.log`). Replay hệ thống ĐÃ XONG trên
  boot mới (dpkg.log 1477 dòng; /var/log/apt TỒN TẠI — khác đợt
  194); 0 process apt/dpkg lúc kiểm. Gate0 dự phòng T4-check-only
  đạt từ poll #1.
- **dpkg.log 1477 DÒNG** (không reset như đợt 194 — replay đã
  cài xong trước 08:44Z; giữ 1477 suốt phiên).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (08:43:33Z): RAM 1604 MB, load1 4,81/load5 2,68, lock=co
  (T01 giữ), blockers=4, gate0=T4-check-only, t5flag=cu(mtime-cu),
  postboot_exit=0, apt=0, dpkg 1477. Lần 2 (cùng giây): RAM 1610 MB,
  blockers=5, còn lại giống lần 1. Cửa chưa mở vì
  load1/load5 >2 VÀ lock T01 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~1610–1638 MB avail; load1 ~2,7 lúc mở.**
- **F-176-T4-2 / F-185-T4-2: KHÔNG TÁI DIỄN.**

## 1. Poller — 40 poll thật (2 test + 38), 3 lần cửa mở, 0 reboot trong phiên

- **Test (POLL_TEST=1), 2 poll, boot 8c4aa907
  (08:43:33Z, 2 lần):** cả 2 đều gate0=T4-check-only,
  load1 ~4,8, load5 ~2,7, RAM 1604–1610 MB, lock=co (T01),
  blockers=5, apt=0, dpkg 1477 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-195.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot 8c4aa907, 38 poll
  (08:43:41Z–09:17:52Z), 3 lần cửa mở:** RAM ≥1024:
  38/38 (min 1507, max 3653 MB); **<500: 0/38**;
  load1<2: 13/38; load5<2: 3/38; gate0:
  **T5 27/38**, T4-check-only 11/38; lock=co 5, khong 33;
  blockers>0: 8 poll; apt>0: 0 poll; dpkg 1477 suốt.
- **Giai đoạn 1 — chờ T01 nhả lock + load5 hạ (poll #1–#11,
  08:43:41–08:51:16Z):** gate0=T4-check-only (T5FLAG chưa
  PASS); T01 giữ lock (thread=t01-round195, pid 7234, port
  5560) polls #1–#5, nhả ở #6 (08:47:30Z); load1 3,90–5,27,
  load5 2,49–3,97; RAM 1517–3653 MB. Cửa KHÔNG MỞ.
  **T5FLAG LẬT PASS ở poll #12** (T56 ghi POSTBOOT_PASS
  08:51:26Z — xem §4; đường chính `round195-t56/` — FIX
  F-192-T56-1 đứng đợt thứ ba liên tiếp).
- **Giai đoạn 2 — gate0 đạt (T5), chờ load5 (poll #12–#35,
  08:52:01–09:09:22Z):** gate0=T5 từ #12; load1 1,31–4,68,
  load5 2,26–3,97 — load5 KHÔNG xuống dưới 2. Cửa KHÔNG MỞ.
  Poll #18 có blockers=1 (1 process lạ, xem
  `blockers-ps-18.txt` — nhẹ, không giữ lock).
- **Giai đoạn 3 — cửa mở 3 lần liên tiếp (poll #36, #37,
  #38):** #36 (09:10:07Z) RAM 1940 MB, load1 1,03, load5
  1,88 → **CỬA YÊN MỞ**, attempt1 chạy; #37 (09:14:16Z)
  RAM 3512 MB, load1 1,21, load5 1,56 → **CỬA MỞ NGAY**
  sau attempt1, attempt2 chạy; #38 (09:17:52Z) RAM 3038 MB,
  load1 0,86, load5 1,54 → **CỬA MỞ NGAY** sau attempt2,
  attempt3 chạy (quyết (h) đợt 149: poll lại gate trước mỗi
  attempt — cả 3 lần đều qua poll mới).
- **0 reboot trong phiên đo.** Poller thoát 09:21:58Z sau
  attempt3 (LUOT HOP LE, exit 0).
- **Phân rã 40 poll thật:** RAM≥1024: 40/40; RAM<500:
  **0/40**. load1<2: 13/40; load5<2: 3/40.
  **"gan-mo" đếm 3 = 3 lần mở cửa thật** (#36, #37, #38).
  gate0: T5=27, T4-check-only=11 (+2 test).
  blockers>0: 8 poll (lúc T01 giữ lock + 1 poll lẻ).
  apt>0: 0 poll. dpkg 1477 suốt phiên.

## 2. Attempts — 3 attempt (ngân sách dùng 3/3), 1 lượt hợp lệ (attempt3)

- **attempt1-8c4aa907: 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median
  78,0 ms > 60 — KHÔNG HỢP LỆ.** Cửa sổ: marker 09:10:07Z →
  attempt-done 09:13:53Z (probe_exit=0; run-attempt exit=0
  09:13:53Z). JSON 2.448.445 B; flip wallMs 31.223 ms; lock vite
  giữ ~3m46s (hold 226 s), nhả 09:13:53Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (108 dòng). **0 writePartial TIMEOUT**
  (không wedged — 20/20 partial save đều OK).
  **tickCost:** tổng n=429 median **78,0** p90 114,0 max 307
  min 29; hậu flip+2000ms n=286 median 85,5. Theo dải
  wallMs median 66,0 → 69,0 → 70,0 → 73,5 → 103,0 → 96,0 —
  TĂNG DẦN XUYÊN SUỐT (pass 1–13 median 58–87; pass 14–20
  median 95–116) trong khi load1 chỉ 1,00–2,08 và RAM
  1399–2987 MB — median TĂNG khi tải GIẢM (r=−0,78).
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 1,55); **B2 ĐẠT
  (load1_max 2,08)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1399 MB, 0 mẫu <500; 0/108 mẫu <1024)**.
  **(c2) = 0 seq** → P1/P3-A1/P7 KHÔNG tính được;
  **P3' 0 đóng góp. Labellag (b): skippedLatest=1: 0 occurrence
  ≥5f** (n=114, max 3f); **skippedLatest=0: 2 occurrence ≥5f**
  (n=344, max 9f) — **KHÔNG tính vào chuỗi** (attempt không
  hợp lệ).
  **Perpass (20 pass):** median 66,5/58,0/62,0/73,0/81,0/70,0/
  75,0/70,5/63,0/78,0/67,5/73,0/87,0/100,5/103,0/96,0/114,0/
  95,0/101,5/116,0; r(median~load1) = −0,78;
  r(median~RAM) = +0,92 (median tăng cùng RAM — tương quan
  theo thời gian, không kết luận nhân quả từ 1 lượt).
- **attempt2-8c4aa907: 20/20 pass trong partial JSON NHƯNG
  PAGE-WEDGED — CẢ 3 writePartial TIMEOUT sau pass 20,
  probe_exit=2 — KHÔNG TÍNH VERDICT.** Cửa sổ: marker
  09:14:16Z → attempt-done 09:17:20Z (run-attempt exit=2
  09:17:20Z). Partial JSON 3.294.708 B (partial, không có
  `results` đầy đủ); flip wallMs 28.125 ms; lock vite giữ
  ~3m04s (hold 184 s), nhả 09:17:20Z; vite :5187 kill sạch
  (curl 000); sampler dừng sạch (88 dòng).
  **Chuỗi TIMEOUT (kênh evaluate chết sau pass 20):**
  writePartial tickCost TIMEOUT 09:16:15Z (30 s); blendTick
  TIMEOUT 09:16:45Z (30 s); c2DrawLog TIMEOUT 09:17:15Z
  (30 s) → "CA 3 FETCH DEU TIMEOUT — trang wedged" →
  PAGE-WEDGED, thoát sau pass 20 (partial JSON đã ghi).
  **tickCost (dữ kiện partial, KHÔNG dùng làm verdict):**
  n=574 median **49,0** p90 75,0 max 111 min 28; hậu
  flip+2000ms n=407 median 51,0. Theo dải wallMs median
  41,5 → 43,0 → 55,0 → 51,0 → 49,0 → 47,0 — PHẲNG.
  **Lớp B theo file classb: ĐẠT 5/5** (load1_max 3,40; RAM
  min 2336 MB; load5 cuối 1,63; dpkg delta 0) — NHƯNG
  **verdict KHÔNG được lấy** (run-attempt exit=2; poller
  retry theo quy tắc đứng).
  **Stall (c2) partial: seq 203 (stall 7), 224 (stall 2),
  414 (stall 3) — đều ĐẠT — KHÔNG tính** (attempt không
  hợp lệ; chỉ lượt hợp lệ mới cộng sổ).
  **Labellag (b): 0 occurrence / 0 event** (skippedLatest=1:
  n=140, max 3f; skippedLatest=0: n=518, max 3f; ≥5f: 0).
  **Perpass (19 pass có dữ liệu):** median 41,0/42,0/41,0/
  43,0/53,0/39,0/56,0/56,5/53,5/53,0/43,0/54,5/55,0/49,0/
  38,0/42,0/50,0/38,0/52,0; r(median~load1) = +0,19;
  r(median~RAM) = +0,05.
- **attempt3-8c4aa907: 20/20 + LỚP B ĐẠT 5/5 + tickCost median
  53,0 ms ≤ 60 — HỢP LỆ (LUOT HOP LE).** Cửa sổ: marker
  09:17:53Z → attempt-done 09:21:32Z (probe_exit=0;
  run-attempt exit=0 09:21:32Z). JSON 3.289.211 B; flip
  wallMs 32.055 ms; lock vite giữ ~3m39s (hold 219 s), nhả
  09:21:32Z; vite :5187 kill sạch (curl 000); sampler dừng
  sạch (104 dòng). **0 writePartial TIMEOUT.**
  **tickCost:** tổng n=607 median **53,0** p90 82,0 max 150
  min 28; hậu flip+2000ms n=441 median 54,0. Theo dải wallMs
  median 54,0 → 41,0 → 59,5 → 52,5 → 57,5 → 53,0 — PHẲNG
  QUANH 50 (pass 1–20 median 41,0–93,0; chỉ pass 6 = 93,0
  là ngoại lệ) trong khi load1 chỉ 0,56–1,89 và RAM
  1718–2962 MB — median KHÔNG theo tải (r=−0,07).
  **Lớp B ĐẠT 5/5: B1 ĐẠT** (load5 cuối 1,35); **B2 ĐẠT
  (load1_max 1,89)**; B3 ĐẠT; B4 ĐẠT (dpkg delta 0);
  **B5 ĐẠT (RAM min 1718 MB, 0 mẫu <500; 0/104 mẫu <1024)**.
  **(c2) = 4 occ [306, 330, 330, 473]** → P1 ĐÚNG 4/4
  (p=0,000789); P2 ĐÚNG 4/4 (lag 1, 6, 3, 1); P3-A1 SAI
  (2/4, p=0,28); **P3' 2/3 distinct ĐẠT [306, 473]** (330
  stall 1 KHÔNG ĐẠT). **Labellag (b): 6 occurrence / 2 events**
  (event 1: 2 occ, M=[18], tBlend 63522–63601, lag max +5f;
  event 2: 4 occ, M=[22], tBlend 63601–63833, lag max +8f)
  — **tính vào lượt hợp lệ; chuỗi 0 occ GIỮ 0**.
  **Perpass:** median 60,0/48,5/41,0/43,0/41,0/93,0/55,0/
  57,0/46,0/49,0/53,5/42,5/63,0/60,0/55,0/49,0/53,0/52,5/
  56,0/52,0; r(median~load1) = −0,07; r(median~RAM) = 0,00.
  **F6' ĐÓNG LẠI:** skippedLatest=1 hậu flip+2000ms n=79 tick
  (cần ≥30): nhãn 100,0%, pixel-verified 100,0%, 0 tick vi
  phạm thật.
- **Ngân sách 3/3 đã hết; poller thoát 09:21:58Z (exit 0 —
  LUOT HOP LE).**

## 3. B2 spike / đối chiếu sampler T9 + kiểm chứng live + chồng lấn

- **KIỂM B2 — DỮ KIỆN THỨ 7 CHO QUYẾT TÁCH: LẪN LỘN**
  (xem F-195-T4-5). Ba attempt cho ba bức tranh khác nhau:
  **Attempt1: LẠ-TẢI NHẸ, 0 spike** — load1_max **2,08**
  (B2 ĐẠT); **0 spike trong cửa sổ** (09:10:07–09:13:53Z).
  P3 probe 70 s + P2 ghi file + chrome lạ idle đều có mặt
  nhưng tải vẫn thấp.
  **Attempt2: TỰ-TẢI LÀ CHÍNH** — load1_max **3,40** (B2 ĐẠT
  theo file classb nhưng verdict không lấy vì exit=2);
  **84 spike trong cửa sổ** (09:14:16–09:17:20Z), thành cao
  nguyên liên tục 3,03 → 3,40 (09:15:17–09:15:37Z). Đỉnh
  3,40 lúc 09:15:27Z thuần tự-tải (WebKitWebProcess 72,3% +
  MiniBrowser 32,9% = ~105% top CPU; hatch 14,6%); spike
  đầu 09:14:52Z cũng vậy. 84 spike là probe tự quay trong
  lúc kênh evaluate chết dần (TIMEOUT bắt đầu 09:16:15Z).
  **Attempt3: SẠCH** — load1_max **1,89** (B2 ĐẠT);
  **0 spike trong cửa sổ** (09:17:52–09:21:32Z).
  **T4 chỉ báo số:** dữ kiện thứ 7 lẫn lộn như dữ kiện thứ
  4/5/6; luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent
  quyết — T4 KHÔNG tự quyết tách.
- **AUTO-TRIGGER LIVE — CHẠY TRONG CẢ 3 CỬA SỔ ATTEMPT,
  0 FIRE.** Live `dry_run=False guard=6291456 consec=2`
  (T9-195; quyết (o) đợt 188: BẬT LIVE từ đợt 189). Mẫu
  autotrigger trong cửa sổ: W1 4 mẫu 09:10:47–09:13:47Z,
  W2 3 mẫu 09:14:47–09:16:47Z, W3 3 mẫu 09:18:47–09:20:47Z
  — **trigger=watch, consec=0 ở tất cả các mẫu: 0 FIRE /
  0 WOULD-FIRE / 0 MISSED-WINDOW.** `b2-spikes.log` 0 hit
  FIRE (T9-195 phán cuối). Balloon theo autotrigger: W1
  2,61–3,45 GB; W2 1,99–2,71 GB; W3 3,19–3,73 GB.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 14: ĐẠT
  (F-195-T4-6).** Áp ĐÚNG định nghĩa (p)-192: live-check CHỈ
  đối chiếu trên cửa sổ attempt HỢP LỆ — cửa sổ hợp lệ duy
  nhất là W3 (attempt3). W3: **0 spike B2** (T9); **0 file
  analyzer ghi trong cửa sổ** (classb sớm nhất +0,12 s sau
  attempt-done 09:21:32Z); autotrigger 3 mẫu trong W3
  trigger=watch, consec=0, **0 FIRE** (đúng — không có kẹt
  trong W3 để bắt). **Chuỗi live ĐẠT 9 → 10.** Dữ kiện ghi
  nhận (không dùng làm verdict): W1 marker 09:10:07Z → done
  09:13:53Z (0 spike, 0 file analyzer trong cửa sổ); W2
  marker 09:14:16Z → done 09:17:20Z (84 spike tự-tải, 0
  file analyzer trong cửa sổ — attempt không hợp lệ nên
  không tính).
- **PHÁN F-194-P3-1 — ẢNH HƯỞNG CỦA LẦN CHỒNG ĐỢT 194 LÊN
  ATTEMPT1-194 (T4 phán theo brief đợt 195; T2-195 ghi vào
  sổ vi phạm theo phán này).** P3-194 tự báo 2 lần chồng:
  (a) vite build 42,94 s ~02:55–02:57Z chồng đầu pha (b)
  attempt1-194 (mở 02:54:11Z); (b) `tsc --noEmit` chạy lại
  03:31:53–03:32:20Z chồng đầu pha (b) attempt2-194 (mở
  03:29:23Z).
  - **(a) Build P3 — CÓ GÓP PHẦN VÀO TẢI NHƯNG KHÔNG ĐỔI
    VERDICT.** Bằng chứng từ `load-mid` + `b2-spikes.log`
    đợt 194: load leo liên tục 1,92 (02:54:23Z) → 8,32
    (02:55:01Z) → 15,11 (02:57:00Z) đúng trong cửa sổ build;
    tại đỉnh 02:57:00Z, `esbuild` (dịch vụ build của vite
    P3) chiếm 6,7% top CPU — build P3 ĐANG CHẠY tại đỉnh.
    Nhưng attempt1-194 đã VÔ HIỆU bất kể P3: B1+B2 vi phạm
    với load1_max 15,11 do NHIỀU tải nặng cùng lúc (T01
    recount PID 8115 + P4 tsc/parity PID 27502 + P1 chrome
    17,8% + probe tự-tải ~44% tại đỉnh); tickCost median
    220,0 ms = 3,7× ngưỡng. Trừ phần ~7% CPU của build P3
    cũng không đưa load về dưới ngưỡng B2, càng không đưa
    median về ≤60. **Verdict attempt1-194 KHÔNG ĐỔI (đã vô
    hiệu).** F-194-T2-9 đã bao toàn bộ vi phạm pha (b)
    attempt1 — T2-195 ghi phần của P3 vào sổ theo phán này,
    KHÔNG tính thêm một vi phạm mới (cùng một sự kiện đã đếm).
  - **(b) tsc chạy lại — KHÔNG CÓ ẢNH HƯỞNG QUAN SÁT ĐƯỢC.**
    Cao nguyên vi phạm của attempt2-194 là 03:29:40–
    03:31:12Z (trước khi tsc chạy lại 03:31:53Z); perpass
    median cuối attempt2 là 39–68 (thấp); attempt2 đã vô
    hiệu từ cao nguyên tự-tải trước đó. **Verdict
    attempt2-194 KHÔNG ĐỔI; không tính vi phạm thêm.**
  - Bài học P3 đã tự rút (kiểm `poll-t4.log` ngay sát lúc
    chạy) được ghi nhận; đợt này P3 vẫn chồng W1 (F-195-P3-1
    dưới đây) — khe đua 2 s chưa khép hẳn.
- **F-195-P3-1 (P3-195 tự báo): probe clip 70 s chồng pha (b)
  attempt1.** P3 kiểm `poll-t4.log` ~09:10:05 (poll #35,
  chưa có "CUA YEN MO"), cửa mở 09:10:07Z — 2 s sau; probe
  70 s chạy 09:11:23–09:11:52Z mà không kiểm lại. Load trong
  pass ~1,0 (Chrome + decode 889 ms, nhẹ). **Phán T4:**
  probe CÓ chồng thật (giữa W1, đúng lúc pass 13–16 đang
  chạy) nhưng ảnh hưởng nhỏ: load1_max cả W1 chỉ 2,08,
  B2 ĐẠT; median attempt1 tăng dần XUYÊN SUỐT (66,5 →
  116,0) — xu hướng bắt đầu TRƯỚC probe (pass 1–12 đã
  58–87) và tiếp tục SAU probe (pass 17–20: 95–116) — probe
  không giải thích được xu hướng này. Attempt1 vô hiệu vì
  median 78,0 > 60 (mẫu probe-level), không vì tải lạ.
  **Verdict attempt1 KHÔNG ĐỔI; giao T2 ghi vào sổ vi phạm
  theo quy tắc đứng** (chồng pha (b) có thật, dù nhẹ).
- **F-195-P3-2 (T4 phát hiện): ffmpeg decode của P3 chồng
  đầu pha (b) attempt3.** Snippet decode P3 (PID 82238,
  `ffmpeg` full-decode + windowed 2 clip 300 s, ~16–25 s)
  CÓ MẶT trong `ps-before` attempt3 (09:17:52Z) và VẮNG
  trong `ps-after` (09:21:32Z) — tức chạy trong những giây
  đầu W3. **Phán T4:** chồng có thật nhưng không thấy ảnh
  hưởng: load1_max W3 chỉ 1,89, B2 ĐẠT; pass 1 median 60,0
  (không phải ngoại lệ so với xu hướng lượt); attempt3 HỢP
  LỆ. **Verdict attempt3 KHÔNG ĐỔI; giao T2 ghi vào sổ.**
- **O8 T01 TRÊN BOOT 8c4aa907 — 3/3.** O8 T01 21/21 pass ×2
  (WebKit + Chromium), xong 08:46:54Z, nhả lock; poller T4
  thấy lock T01 polls #1–#5, nhả ở #6. O8 T8 + harness
  thuộc T8-195 báo cáo (T8 chưa đóng lúc T4 đóng 09:31Z).
- **CHỒNG LẤN — LIỆT KÊ ĐẦY ĐỦ THEO CỬA SỔ (brief đợt 192
  yêu cầu; kiểm file round195-* mtime trong cửa sổ, loại
  round195-t4):**
  **W1 (09:10:07–09:13:53Z):** (a) P3 probe 70 s
  09:11:23–09:11:52Z (F-195-P3-1 — tải nhẹ, load ~1,0);
  (b) P2 ghi `probe-195-p2a.mjs` + `parity-195-p2a.json` +
  `headed-195-p2-bob.mjs` + `interlaced640.mp4` +
  `interlaced256.mp4` + `round195-p2.done` (probe headed
  của P2 chạy 09:04Z, TRƯỚC W1; chỉ ghi file trong W1);
  (c) T2 ghi `blind195-*.txt` + `evidence-check195*.log/txt`
  (kiểm chứng nhẹ); (d) T56 chunk2 bị monitor kill
  09:10:16–18Z (xem dưới); (e) chrome lạ `/tmp/
  vf194-chrome-NY0ujz` (đặt tên theo đợt 194) xuất hiện
  trong ps-after, idle `about:blank` (xem F-195-T4-9).
  **W2 (09:14:16–09:17:20Z): 0 file** — cửa sổ sạch nhất
  đợt này (nhưng probe wedged — lỗi kênh evaluate, không
  phải tải ngoài).
  **W3 (09:17:52–09:21:32Z):** (a) T2 ghi
  `hole-recheck195.py` (nhẹ); (b) `round195-p3.done`
  (cờ P3, nhẹ); (c) snippet ffmpeg decode P3 (PID 82238)
  trong ps-before (F-195-P3-2).
  **0 file round194-* nào bị sửa trong cả 3 cửa sổ** (check
  glob đợt trước trong t4-attempt-inner.sh — các luồng đợt
  195 ghi vào round195-*, không ghi round194-*).
- **T56 HARNESS — 1 LẦN CHỒNG NGẮN ĐẦU PHA (b) W1, ĐÃ BỊ
  MONITOR KILL (xem F-195-T4-7).** Suite 09:02:49–09:05:02Z
  + chunk1 09:06:33–09:08:24Z đều TRƯỚC W1; chunk2 bắt đầu
  09:08:36Z, monitor phát hiện cửa mở giữa chunk và kill
  pgid 75510 lúc 09:10:16–18Z (chồng ~11 s đầu W1, trong
  pass 1, trước khi partial 1/20 ghi 09:10:29Z); chunk3
  09:22:27–09:24:17Z + chunk4 09:24:24–09:26:24Z đều SAU W3.
  **0 chồng W2/W3.** Monitor 10 s/chu kỳ hiệu quả (sửa
  F-193-T56-3).
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI QUY
  ĐỊNH.** `run-analyzers-195.sh` chạy NGOÀI cửa sổ cả 3
  lần (sau attempt-done). `round194-*` files modified sau
  marker: 0 file.

## 4. Replay/postboot — POSTBOOT_PASS 8c4aa907 CÓ (T56, poll=0, replay-day-du)

- **Boot 8c4aa907 (btime 08:22:05Z, số hiệu #121 ỨNG
  VIÊN — T01-195 XÁC MINH, parent quyết (e) ở §14.2-195).**
  Gap #120→#121 = 14.320 s (T56-195 xác minh cuối).
- **POSTBOOT_PASS 8c4aa907 ĐÃ CÓ 08:51:26Z** (round195-t56/,
  T56-195; T4 chỉ ghi nhận + xác minh độc lập qua check-only
  của mình): "boot 8c4aa907... replay-day-du: dpkg 1477 dong;
  cache 171 .deb; lists 37; postboot PASS poll0 doc lap exit 0
  luc 2026-11-26T08:51:26Z; POSTBOOT_PASS moi ghi
  2026-11-26T08:51:26Z poll=0 (replay-day-du); co cu 55c9e0b7
  luu POSTBOOT_PASS-55c9e0b7". **Check-only của T4 PASS độc
  lập từ pre-flight (08:44Z)** và giữ PASS suốt phiên (gate0
  T5 27/38 poll; T4-check-only 11/38 poll đầu). **Replay
  8c4aa907: ĐÃ XONG trước khi T4 mở poller** (dpkg.log 1477
  dòng lúc pre-flight; /var/log/apt tồn tại — khác đợt 194
  phải chờ replay ~2 phút).
  **GST #121 là THƯ MỤC THẬT** (preflight check-only:
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` thư mục thật,
  269 plugin — khác #119 symlink) — không có caveat symlink.
  **#119/#120 VẪN CÓ** (không kiểm lại mtime/md5 đợt này —
  giao T5-195/T56-195).
- **Tổng boot không cờ GIỮ 27** (theo quyết (c)-193; 8c4aa907
  CÓ cờ thì không đổi — T5-195/parent quyết).
- **REBOOT MỚI 8c4aa907 (btime 08:22:05Z, gap ~14.660 s từ
  #120) — TRƯỚC KHI ĐỢT MỞ ~14 PHÚT (đợt mở 08:35:51Z).**
  0 reboot trong phiên đo (từ mở poller 08:43:41Z tới
  poller thoát 09:21:58Z, boot luôn 8c4aa907). **(m)
  8c4aa907 + INSIDE + run kết cục thuộc T2-195/T7-195;
  POSTBOOT_PASS 8c4aa907 thuộc T56-195.**
- **Scheduler gap / OUTAGE + 84l10 / 85m4 / 86n2: KHÔNG CÓ
  DỮ KIỆN TRONG PHIÊN T4.** OUTAGE phán cuối thuộc T7-195;
  verdict harness thuộc T8-195.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND195_T4_WEBKIT_QUIET63_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round195-t4/`):**
  `poll-wait-t4-195.sh` (deadline 10:30Z 26/11 + cờ T5
  round195-t56/ + fallback round194-t56/),
  `run-attempt-195.sh` (lượt yên #63),
  `run-analyzers-195.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-195.py` (helper đọc sổ — DÙNG LIVE đợt này:
  sổ thăng cấp as-of-195, md5 `b99babc5`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–194, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round195-t4/` — theo đúng mẫu 149–194: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–194).
- **Script làm việc (hidden_files, không stage):** 5 script
  T4 + 10 analyzer `analyze-t4-*.py` + `vite.t4-temp.config.mjs`
  + `b.json` + probe + `tree-md5.txt` (591f9655) +
  `stats-195.py` + `distinct-seq-195.py` (DÙNG LIVE) +
  `distinct-seq-ledger.json` (as-of-195, md5 `b99babc5`) +
  `distinct-seq-ledger-195-proposed.json` (bản đề xuất giữ làm
  audit trail) + `preflight-195.txt` +
  `preflight-postboot-195.log` + `round195-t4-copy.py`.
- **Log/evidence (hidden_files/round195-t4/, không stage):**
  `poll-t4.log` (38 poll + CỬA MỞ #36/#37/#38 + LUOT HOP LE),
  `poll-t4.nohup.log` (1 instance),
  `poll-test-195.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller + 3 lần CỬA MỞ + 3 attempt +
  LUOT HOP LE, poller thoát 09:21:58Z),
  `postboot-t4-195-gate0wait-*.log` (check-only mỗi 4 poll),
  `stats-195-output.txt` (output stats-195.py),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-8c4aa907.json`
  (2.448.445 B / 3.294.708 B partial / 3.289.211 B),
  `load-mid-t4-attempt{1,2,3}-8c4aa907.log` (108/88/104
  dòng), `analyze-t4-attempt{1,2,3}-8c4aa907-*.txt`
  (10 file mỗi attempt + `p1p3p7` riêng attempt3 — chạy tay,
  xem F-195-T4-12),
  `coverage-check-attempt{1,2,3}-8c4aa907.txt` (0/N, 4/4,
  4/4), `classb-t4-attempt{1,2,3}-8c4aa907.txt`,
  `ps-before/after-t4-attempt{1,2,3}-8c4aa907.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-*.txt`
  (B4: dpkg 1477 cả 3 attempt). **3 JSON attempt (1 hợp lệ).
  0 process T4 sống lúc đóng** (poller thoát 09:21:58Z;
  vite :5187 kill, curl 000; 0 Xvfb/MiniBrowser/WebProcess
  T4). **X11 KHÔNG trống — X193 (Xvfb của probe T4, cả 3
  attempt đều :193) + X195/X196/X197 (luồng khác — P1/P3
  headed; T4 chỉ dùng :193).**

## 6. Sai số F-195-T4-1..12 + phán F-194-P3-1 (+ nợ cũ)

- **F-195-T4-1 — COMMENT STALE 1 LẦN, CÂY ỔN ĐỊNH (MỚI —
  NHẸ HƠN F-194-T4-1).** Grep stale lần 2 bắt 1 chuỗi sót:
  comment gate0 trong `poll-wait-t4-195.sh` (round194-t56/
  round193-t56/) → sửa trước pre-flight. Cây preview.tsx
  ỔN ĐỊNH suốt phiên (591f9655, 0 lần đổi — khác đợt 194
  churn 3 md5). Không ảnh hưởng verdict.
- **F-195-T4-2 — T5FLAG ĐƯỜNG CHÍNH round195-t56/ ĐÃ LẬT
  PASS (MỚI — XÁC NHẬN FIX F-192-T56-1 ĐỨNG ĐỢT THỨ BA
  LIÊN TIẾP).** POSTBOOT_PASS 8c4aa907 ghi 08:51:26Z
  (poll=0, replay-day-du); poller thấy T5 PASS từ poll #12
  (08:52:01Z); gate0 T5 27/38 poll. Fallback round194-t56/
  đúng là "cu(mtime-cu)" 11 poll đầu, không tính sai boot.
- **F-195-T4-3 — ATTEMPT1 MEDIAN 78,0 ms DÙ TẢI THẤP
  (MỚI).** 20/20 + B 5/5 (load1_max 2,08) nhưng tickCost
  median 78,0 ms; perpass tăng dần 66,5 → 116,0 trong khi
  load GIẢM (r=−0,78) và RAM TĂNG (r=+0,92 — tương quan theo
  thời gian). P3 probe 70 s + P2 ghi file chồng W1 nhưng
  tải vẫn thấp — median cao là mẫu probe-level (như
  attempt3-194 phẳng ~61), không quy được cho tải lạ.
  Chỉ ghi nhận, không suy đoán nguyên nhân.
- **F-195-T4-4 — ATTEMPT2 PAGE-WEDGED, CẢ 3 FETCH TIMEOUT
  (MỚI — DẠNG F-193-T4-3).** Sau pass 20: writePartial
  tickCost TIMEOUT 09:16:15Z → blendTick TIMEOUT 09:16:45Z
  → c2DrawLog TIMEOUT 09:17:15Z (mỗi lần 30 s); kênh
  evaluate chết; probe_exit=2; 20/20 pass chỉ còn trong
  partial JSON. Khác attempt1-193: lần này wedge xảy ra
  SAU pass cuối (không mất pass nào), nhưng verdict vẫn
  không lấy theo quy tắc đứng.
- **F-195-T4-5 — B2 DỮ KIỆN THỨ 7 LẪN LỘN (MỚI — XEM §3).**
  Attempt1 0 spike (lạ-tải nhẹ); attempt2 tự-tải là chính
  (84 spike, đỉnh ~105% CPU là probe); attempt3 sạch
  (0 spike). Lần lẫn lộn thứ 4 liên tiếp (dữ kiện thứ 4, 5,
  6, 7 đều lẫn).
- **F-195-T4-6 — (p) LIVE LẦN 14 ĐẠT (MỚI — LẦN ĐẠT ĐẦU
  TIÊN KỂ TỪ CHUỖI 9).** Áp đúng định nghĩa (p)-192: chỉ
  xét cửa sổ hợp lệ W3 — 0 spike B2, 0 file analyzer trong
  cửa sổ, autotrigger 3 mẫu watch/consec=0, 0 FIRE.
  Chuỗi live ĐẠT 9 → 10.
- **F-195-T4-7 — T56 CHUNK2 CHỒNG ~11 s ĐẦU W1, MONITOR
  KILL KỊP (MỚI — MONITOR 10 s HIỆU QUẢ, SỬA F-193-T56-3).**
  Chunk2 chạy từ 09:08:36Z; cửa mở 09:10:07Z giữa chunk;
  monitor kill pgid 75510 lúc 09:10:16–18Z (chồng ~11 s đầu
  pha (b), trong pass 1, trước khi partial 1/20 ghi
  09:10:29Z). Load1_max W1 chỉ 2,08, B2 ĐẠT; pass 1 median
  66,5 không phải ngoại lệ — **0 bằng chứng ảnh hưởng**.
  Giao T2 phán (vi phạm hay không — theo quy tắc đứng,
  chồng pha (b) có thật dù đã kill nhanh). Khác F-194-T56-4
  (chồng t01 ~48 s, không kill): lần này monitor đã kill.
  Chunk3/4 chạy SAU W3 (09:22:27Z+), 0 chồng W2/W3.
- **F-195-T4-8 — P3 CHỒNG CẢ W1 LẪN W3 (MỚI — XEM §3).**
  F-195-P3-1 (probe 70 s trong W1, tự báo) + F-195-P3-2
  (ffmpeg decode trong ps-before W3, T4 phát hiện). Cả hai
  đều không đổi verdict (attempt1 vô hiệu vì median; attempt3
  hợp lệ, B2 ĐẠT). Giao T2 ghi sổ.
- **F-195-T4-9 — CHROME LẠ vf194 TRONG PS-AFTER W1 (MỚI).**
  Chrome headless `/tmp/vf194-chrome-NY0ujz` (đặt tên theo
  đợt 194) xuất hiện trong ps-after attempt1, idle
  `about:blank`, VẮNG trong ps-before — khởi động trong W1.
  0 spike W1; load1_max 2,08 — không ảnh hưởng verdict.
  Ghi nhận để T2/T5 đối chiếu nguồn (P1-195 dùng chrome
  headless; thư mục vf194 là của đợt 194).
- **F-195-T4-10 — X193 LÀ XVFB CỦA PROBE T4, CẢ 3 ATTEMPT
  DÙNG :193 (MỚI — KHÁC F-194-T4-8).** Đợt 194 mỗi attempt
  một display (:194/:195/:196); đợt này cả 3 attempt đều
  `:193` (Xvfb :193 đã lên 09:10:10Z / 09:14:21Z /
  09:17:59Z). X195/X196/X197 lúc đóng KHÔNG phải của T4
  (T4 chỉ dùng :193) — thuộc luồng khác (P1/P3 headed).
  0 process Xvfb sống lúc đóng.
- **F-195-T4-11 — CẢNH BÁO pgrep TRONG CLASSB ATTEMPT3
  (MỚI — COSMETIC).** `pgrep: pattern that searches for
  process name longer than 15 characters will result in
  zero matches` — `pgrep -x unattended-upgrade` dài >15 ký
  tự. Verdict B4 không đổi (pgrep -x=0, dpkg delta=0, ps
  exact-comm=0). Ghi nhận để sửa script (dùng `pgrep -f`
  hoặc bỏ pattern dài).
- **F-195-T4-12 — run-analyzers KHÔNG GỌI p1p3p7 (NỢ ĐỨNG
  — GHI NHẬN).** `run-analyzers-*.sh` không gọi
  `analyze-t4-p1p3p7.py` (từ đợt ≤194); T4 chạy tay cho
  attempt hợp lệ (`analyze-t4-attempt3-8c4aa907-p1p3p7.txt`).
  P1/P2/P3-A1/P7 chỉ tính được khi chạy tay. Đề xuất: thêm
  lời gọi p1p3p7 vào run-analyzers khi (c2)>0 (đợt sau).
- **PHÁN F-194-P3-1 (theo brief đợt 195 — xem §3):**
  (a) build P3 đợt 194 CÓ góp phần vào tải attempt1-194
  (esbuild 6,7% tại đỉnh 15,11) nhưng KHÔNG ĐỔI verdict
  (attempt1 đã vô hiệu vì nhiều tải nặng + median 220 ms);
  F-194-T2-9 đã bao toàn bộ vi phạm — T2-195 ghi phần P3
  vào sổ, KHÔNG tính vi phạm mới. (b) tsc chạy lại chồng
  đuôi attempt2-194 — KHÔNG CÓ ảnh hưởng quan sát được
  (cao nguyên vi phạm kết thúc trước khi tsc chạy); không
  tính vi phạm thêm.
- **Nợ cũ:** F-194-T4-1 → F-195-T4-1 (nhẹ hơn: chỉ comment
  stale, cây ổn định); F-194-T4-2 ĐÃ HẾT (dpkg.log không
  reset, 1477 suốt phiên); F-194-T4-3 KHÔNG tái diễn dạng
  cũ (attempt1 tải thấp, không nhiễm tải nặng); F-194-T4-4
  KHÔNG tái diễn (không còn thiếu sát 1,0 ms — attempt1
  thiếu 18,0 ms, attempt3 ĐẠT); F-194-T4-5 → F-195-T4-5;
  F-194-T4-6 → F-195-T4-6 (KHÔNG THỂ KIỂM → ĐẠT);
  F-194-T4-7 → F-195-T4-7 (monitor kill kịp, khác đợt
  trước); F-194-T4-8 → F-195-T4-10 (dạng mới: 1 display
  chung); F-194-T4-9 ĐÃ HẾT (0 poll RAM <500 — đợt 194 có
  1 poll 254 MB); F-194-T4-10 KHÔNG tái diễn (hold dài nhất
  226 s, không phải 394 s). F-193-T4-3 → F-195-T4-4 (wedged
  tái diễn ở attempt2); F-192-T4-1–10, F-191-T4-1/2/3/6/7/8
  tái diễn dạng tương ứng; F-191-T4-4/5 ĐÃ HẾT; F-191-T4-9/10
  KHÔNG tái diễn; F-189-T4-2 ĐÃ HẾT; F-189-T4-4/5 ĐÃ HẾT;
  F-189-T4-6 có dữ kiện mới; F-188-T4-2 ĐÃ HẾT; F-188-T4-8
  KHÔNG tái diễn; F-186/185-T4-2 KHÔNG tái diễn; F-184-T4-2
  ĐÃ HẾT; F-184-T4-4 KHÔNG tái diễn; F-183-T4-4 tái diễn
  (T01 giữ lock polls #1–#5); F-181-T4-6 KHÔNG CÓ SỐ MỚI;
  F-179-T4-5 ĐÃ HẾT; F-176-T4-2 KHÔNG tái diễn; F-175-T4-2
  KHÔNG ÁP DỤNG (0 file analyzer trong cửa sổ).

## 7. P3' cộng dồn (MỚI — 51 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 195 (MỚI): P1 227/231, P2
  222/222, P3-A1 192/231, P3' 189/203 occurrence = 143/146
  distinct-seq, P7 125/125** (51 lượt hợp lệ — #63 CÓ lượt
  hợp lệ nên cộng thêm 4 seq). Cơ sở: cộng dồn chỉ tính trên
  các lượt yên HỢP LỆ.
- **Đóng góp lượt #63 (attempt3): (c2) 4 occ [306, 330, 330,
  473]; P1 ĐÚNG 4/4; P2 ĐÚNG 4/4; P3-A1 2/4 NHƯNG verdict
  SAI (p=0,28); P3' 2/3 distinct ĐẠT [306, 473]; P7 ĐÚNG.**
  Helper `distinct-seq-195.py` DÙNG LIVE (quyết (t) đợt
  162): sổ as-of-191 (142/145 distinct, occ 187/199) +
  stall/c2coverage attempt3-8c4aa907 → **143/146 distinct,
  189/203 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 473** (chưa có trong sổ);
  **306/330 ĐÃ THẤY** (trong sổ; 306 đã ĐẠT trước, 330 đã
  ĐẠT từ đợt 157 — đợt này 330 KHÔNG ĐẠT (stall 1) nhưng
  sổ union GIỮ 330 trong `seen_dat` theo thiết kế).
  T4 kiểm tay lại sổ as-of-191: seq mới 473 vắng thật
  (không có trong `seen_c2` lẫn `seen_dat`); 306/330 có
  trong cả hai; non_dat_in_union [260, 364, 498] KHÔNG ĐỔI
  (không seq nào trong 3 hố này xuất hiện đợt này). Sổ ĐÃ
  THĂNG CẤP thành as-of-195 (md5 `b99babc5`; bản đề xuất giữ
  lại làm audit trail).
- **P1 — ĐÚNG 4/4 occ** (cả 4 seq gần run-end ±1 tick; trong
  20 run_end seqs; baseline 60/358, p=0,000789 — verdict
  ĐÚNG theo luật DEF §3 vì n=4 ≥3 VÀ p<0,01). Cộng dồn
  223/227 → **227/231**.
- **P2 — ĐÚNG 4/4 occ** (cả 4 seq lag ≥ +1f: 1, 6, 3, 1;
  DEF §4 chỉ đòi lag ≥ +1f). Cộng dồn 218/218 →
  **222/222**.
- **P3-A1 — 2/4 occ NHƯNG verdict SAI** (chỉ 2 seq đóng
  băng-tại-tick [306, 473]; baseline 93/357, p=0,28 > 0,01
  — verdict SAI theo luật DEF §5). Cộng dồn 192/227 →
  **192/231** (tử số GIỮ 192 — chỉ cộng occurrence ĐÚNG;
  mẫu số +4).
- **P3' 2/3 distinct ĐẠT** (stall: 306=3, 330=1, 473=3).
  Cộng dồn 142/145 → **143/146 distinct** (1 seq ĐẠT MỚI
  — 473); occurrence 187/199 → **189/203**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 19,
  0: 22}; đối chứng toàn bộ drawSrc post: {-1: 265, 0: 175},
  0/440 entry). Cộng dồn 121/121 → **125/125** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-191 + stall/c2coverage attempt3 → sổ MỚI đề xuất
  (`distinct-seq-ledger-195-proposed.json`); T4 kiểm tay rồi
  mới thăng cấp thành as-of-195 (md5 `b99babc5`). Đợt 196
  copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (thêm 1 lượt hợp lệ 4/4 củng cố; P1/P2
  ĐÚNG, P3' 2/3 ĐẠT; P3-A1 SAI đợt này là do 330 không đóng
  băng (stall 1) + n=4 nhỏ — không phải bằng chứng chống).
- **Labellag (b) — CHUỖI TRƯỚC #63 = 0; #63 (lượt hợp lệ)
  6 occ / 2 events → chuỗi 0 occ GIỮ 0** (lượt hợp lệ có
  occurrence thì không phải lượt 0 occ; chuỗi chỉ đếm các
  lượt hợp lệ LIÊN TIẾP 0 occ — quyết (m)-192). Attempt1
  (không hợp lệ) 2 occ ≥5f + attempt2 0 occ — không tính.
- Chuỗi median tickCost 51 lượt (MỚI — thêm 53,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 / 53,0 ms (tổng 2414,0; trung bình
  47,3 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 196

- **(a) #63 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 0 → 1
  (lượt hợp lệ đầu tiên kể từ #59 đợt 191 — ĐỀ XUẤT —
  parent quyết cuối).** Chân lượt yên cho chuỗi FULL PASS
  **CÓ đợt này** (harness T8 chưa có lúc T4 đóng — parent/
  T10 quyết FULL PASS cuối).
- **(b) P3' cộng dồn MỚI 51 lượt: P1 227/231, P2 222/222,
  P3-A1 192/231, P3' 189/203 = 143/146, P7 125/125:**
  sổ distinct-seq THĂNG CẤP as-of-195 md5 `b99babc5`.
  **Chờ parent/T10 quyết:** ghi nhận thăng cấp.
- **(c) BOOT 8c4aa907 (số hiệu #121 ỨNG VIÊN —
  T01-195 xác minh 9 nguồn tươi, parent quyết (e) ở §14.2-195).**
  **(m) 8c4aa907 + INSIDE + run kết cục thuộc T2-195/T7-195;
  POSTBOOT_PASS 8c4aa907 (T56-195).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 comment sót +
  tree-md5 khớp đọc trực tiếp (F-195-T4-1); T5FLAG chính đã
  sửa sang `round195-t56/` (FIX F-192-T56-1; gate0 T5 PASS
  từ poll #12).
- **(e) POSTBOOT_PASS 8c4aa907 CÓ lúc T4 đóng (T56 08:51:26Z,
  poll=0, replay-day-du). Tổng boot không cờ GIỮ 27
  (nếu 8c4aa907 tính là có cờ). GST #121 là THƯ MỤC THẬT
  (269 plugin) — không có caveat symlink.**
- **(f) RAM 0 poll <500 MB (min 1507 MB) — không có episode
  RAM thấp đợt này; giao T9-195 phán (nếu có).**
- **(g) (m) #120 phán CUỐI (T2-195); (m) #121 THÔ (T2-195);
  INSIDE (T2-195); POSTBOOT_PASS 8c4aa907 (T56-195); số hiệu
  8c4aa907 = #121? (T01-195 xác minh; btime 08:22:05Z); OUTAGE
  phán cuối T7-195; auto-trigger lần FIRE thật đầu tiên —
  VẪN CHƯA XẢY RA (T9-195); B2 dữ kiện thứ 7 lẫn lộn
  (T4-195 — BẢN NÀY); (m) #56 lần 37; mù hole-recheck lần
  38; prune lần 69; headroom (T9-195); ENOSPC lần 43?;
  84l10 PASS chuỗi?; 86n2-P1 chuỗi 17?; B2 live sạch lần 9?;
  E-247 kết cục (T9-195); run kết cục (T7-195).**
- **(h) B2 DỮ KIỆN THỨ 7 LẪN LỘN (F-195-T4-5). Luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết — T4 KHÔNG
  tự quyết tách. Auto-trigger LIVE chạy trong cả 3 cửa sổ
  attempt, 0 FIRE** — lần FIRE thật đầu tiên vẫn chưa xảy
  ra; T9-195 verify end-to-end khi có FIRE.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 3 lần đợt này
  (attempt1/2/3) → **1 lượt yên hợp lệ #63 cho chuỗi FULL
  PASS.** O8 T01 trên 8c4aa907 (21/21 ×2 WebKit + Chromium,
  xong 08:46:54Z — T01 chưa đóng cờ, T10 xác minh cuối);
  O8 T8 + harness thuộc T8-195 báo cáo (T8 chưa đóng lúc
  T4 đóng).
- **(j) F-195-T4-1 (comment stale 1 lần, cây ổn định);
  F-195-T4-2 (T5FLAG đường chính round195-t56/ lật PASS);
  F-195-T4-3 (attempt1 median 78,0 ms dù tải thấp);
  F-195-T4-4 (attempt2 PAGE-WEDGED, 3 fetch TIMEOUT);
  F-195-T4-5 (B2 dữ kiện thứ 7 lẫn lộn, lần 4 liên tiếp);
  F-195-T4-6 ((p) live lần 14 ĐẠT — chuỗi live ĐẠT 9 → 10);
  F-195-T4-7 (T56 chunk2 chồng ~11 s đầu W1, monitor kill
  kịp); F-195-T4-8 (P3 chồng cả W1 lẫn W3); F-195-T4-9
  (chrome lạ vf194 trong ps-after W1); F-195-T4-10 (X193
  của probe T4, cả 3 attempt :193); F-195-T4-11 (cảnh báo
  pgrep >15 ký tự trong classb — cosmetic); F-195-T4-12
  (run-analyzers không gọi p1p3p7 — nợ đứng); PHÁN F-194-P3-1
  (build P3 góp phần nhưng không đổi verdict attempt1-194;
  tsc chạy lại không ảnh hưởng attempt2-194).**

## Phụ lục A — stats-195-output.txt (tóm tắt)

```
test: 2 poll, RAM 1604-1610 >=1024: 2/2, load1<2: 0/2, gate0: T4-check-only=2
poller: 38 poll 08:43:41-09:17:52Z, RAM min=1507 max=3653 >=1024: 38/38
  <500: 0/38, load1<2: 13/38, load5<2: 3/38, gate0: T5=27, T4-check-only=11
  lock: co=5, khong=33, dpkg 1477->1477
TONG: 40 poll; RAM min=1507 max=3653 >=1024: 40/40 <500: 0/40
gan-mo: #36 09:10:07Z RAM=1940 L1=1.03 L5=1.88; #37 09:14:16Z RAM=3512
  L1=1.21 L5=1.56; #38 09:17:52Z RAM=3038 L1=0.86 L5=1.54
P3' (51 luot): P1 227/231 P2 222/222 P3-A1 192/231 P3' 189/203 = 143/146 P7 125/125
median 51 luot: n=51 mean=47,3 min=39,0 max=60,0 vuot-60: 0
```
