# PHASE9_ROUND142_T4_WEBKIT_QUIET18_LIMITS.md

**Đợt:** 142. **Luồng:** T4 — lượt yên WebKit #18 (đo lại, giám sát thụ
động (c2) theo DEF v0.5). **Ngày:** 18–19/11/2026. **Boot đo:**
9afdaa89 (btime 23:54:20Z 18/11) — **không reboot trong lúc đo
attempt1–3** (boot lúc mở cửa = boot lúc đóng). **Boot lúc mở đợt:**
bde599df (btime 22:48:05Z) — **chết trước khi attempt nào chạy**
(xem §2). **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7`
(kiểm lúc mở poller 23:42Z, lúc mở cửa 00:00Z, lúc đóng 00:23Z —
không đổi). **Trạng thái:** LƯỢT YÊN #18 **HỢP LỆ Ở ATTEMPT3**
(20/20 pass, probe_exit=0, lớp B 5/5).

## 0. Verdict tổng (đọc trước)

- **Lượt yên WebKit #18 HỢP LỆ (attempt3, 20/20 pass): tickCost median
  49,0 ms hậu flip+2000 ms (n=451; tổng n=615 median 47,0 ms) ≤60 ms;
  lớp B 5/5 ĐẠT; (c2) = 7 occurrence, toàn bộ lag +1f.**
- **Attempt1 và attempt2 đều 20/20 nhưng LỚP B VI PHẠM (B2) → lượt
  nhiễm tải, KHÔNG dùng cho verdict** (tiền lệ đợt 128: tối đa
  3 attempt; xem §3–§4). Attempt1: load1_max 5,24 (T6 grep nặng
  trong ps-before). Attempt2: load1_max 4,59, 10 mẫu >4 — KHÔNG có
  process luồng khác nào (chính stack đo tự đẩy tải, như attempt2
  đợt 128).
- **P1 ĐÚNG:** 7/7 (c2) gần run-end, baseline 45/368 = 12,2%,
  **p = 0,00000041** (signed đối chiếu: cùng baseline, cùng p).
- **P2 ĐÚNG:** 7/7 lag +1f, 0 lag âm.
- **P3-A1 ĐÚNG:** 7/7 đóng băng-tại-tick, baseline 87/367 = 23,7%,
  **p = 0,000042**.
- **P3' ĐÚNG:** 7/7 seq riêng biệt có stall_truoc ≥ 2 (stall 5, 7, 3,
  7, 6, 3, 3), baseline 23,7%, p ≈ 0,000042. **A1 và P3' KHÔNG lệch
  nhau seq nào ở lượt này** (cả hai 7/7) — câu parent đợt 141 §11
  được trả lời: A1 KHÔNG rớt dưới 2/3, không cần xem lại.
- **P4 ĐÚNG:** thuần +1f 7 (2–8), tổng (c2) skp=0 7 (2–12), skp=1 = 0,
  lag ≥+5f (c2) = 0.
- **P5 ĐÚNG 4/4:** snap-label median 36 ms (34–52), raw-label median 9
  ms (8–10), label-floor +1 71,5% (63–76%), run ≥3 tick 15 (13–22).
- **P6 trong khoảng cả 3 bin:** bin0 36,7% (33–39), +1/+2 42,4%
  (33–53), +3 13,3% (3–19); đuôi âm 7,6%.
- **P7 ĐÚNG (làm yếu desync):** 7/7 seq (c2) được log phủ; drawSrc
  delta floor(ct×30)−frameIdx chỉ −1/0 (75/75), 0 entry trễ ≥+1f;
  rawUnit−drawSrc gần nhất chênh 0 (75/75 cặp); đối chứng toàn cửa sổ
  post: 0/449 entry trễ ≥+1f.
- **F6' ĐÓNG lần thứ 6 liên tiếp:** 73 tick skippedLatest=1, 100%
  không vi phạm (nhãn + pixel-verified).
- **Cộng dồn MỚI (15 lượt yên hợp lệ):** P1 **45/45**, P2 **36/36**
  occurrence lag ≥+1f (0 âm), P3-A1 **40/45**, P3' **17/17 (3 lượt)**,
  P7 **31/31**. Chuỗi median tickCost 15 lượt: 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / **49,0 ms** (trung bình 47,8 ms).
- **KHÔNG có điều kiện nào trong ba điều kiện mở lại điều tra (§13
  DEF v0.5) xảy ra trên lượt hợp lệ #18** (P1 ĐÚNG; 0 lag âm; +2f
  đúng = 0). Điều tra (c2) **vẫn ĐÓNG** — verdict "ghost-freeze
  ĐƯỢC ỦNG HỘ MẠNH" đứng. Các P-verdict SAI ở attempt1/attempt2
  (nhiễm tải) KHÔNG tính vào §13 — §13 chỉ áp dụng cho lượt yên
  hợp lệ.
- **Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI** — median #18 = 49,0 ms,
  dưới ngưỡng; không có lượt hợp lệ nào vượt 60 ms.
- **Balloon xả bền (đợt thứ 2 liên tiếp):** mở đợt đóng băng
  6.443.824 kB, xả–phồng 1 chu kỳ rồi xả bền xuống ~4,60 GB trong
  lúc đo; lúc đóng 5.016.164 kB, RAMavail 1.888 MB. **KHÔNG cần
  can thiệp host ở đợt này.** Gate A ≥1024 MB GIỮ NGUYÊN (quyết
  parent) — và đã đủ: RAM lúc mở cửa attempt1 1.170 MB, attempt2
  1.778 MB, attempt3 2.221 MB.
- **Retry:** 0/2 lượt retry LỖI SETUP đã dùng (không có lỗi setup
  nào). Attempt2/attempt3 là đo lại sau vi phạm lớp B (không phải
  retry setup), tối đa 3 attempt theo tiền lệ đợt 128 — đã dừng
  đúng ở attempt3 khi có lượt hợp lệ.
- **DEF v0.5, fix 530e10a7, ngưỡng tickCost ≤60 ms, gate A: KHÔNG
  ĐỔI.** Không có code nào được viết/sửa trong repo ở lượt này (chỉ
  poll + probe + log); preview.tsx không chạm tới. Không push,
  không release/tag.

## 1. Bối cảnh

- Lượt yên #17 HỢP LỆ ở đợt 141 (attempt1 20/20, median 47,0 ms;
  P1 6/6, P3-A1 5/6, P3' 6/6; lần đầu A1 và P3' lệch nhau ở seq 208
  — chỉ ghi nhận làm mẫu; quyết parent đợt 141 §11: nếu lượt sau
  A1 rớt dưới 2/3 trong khi P3' vẫn đạt thì xem lại). Cộng dồn lúc
  đó 14 lượt hợp lệ: P1 38/38, P2 29/29, P3-A1 33/38, P3' 10/10,
  P7 24/24.
- Đợt 142 mở 23:35:51Z 18/11 trên boot bde599df (btime ~22:48Z, sau
  reboot #25 trong lúc đóng sổ đợt 141). Chốt chặn
  `round-in-progress.md` TỒN TẠI nhưng đó là marker của chính đợt
  142 này ("Đợt 142 đang chạy", mở 23:35:51Z) — không phải đợt
  main-chat đang chạy; T4 tiến hành theo đúng brief parent giao
  (cùng tiền lệ đợt 139/140/141).
- Script `analyze-t4-p1p3p7.py` được kiểm lại TRƯỚC khi chạy: tái tạo
  #17 khớp 100% file T4-141 (`analyze-t4-attempt1-p1p3p7.txt`, diff
  sạch) — chạy bằng script copy sang round142-t4, không sửa logic.
- Poller `poll-wait-t4-142.sh` sao từ 141, đổi deadline 02:30Z 19/11
  + cờ T5 round142-t5 (dự phòng round141-t5 cùng boot) + vòng retry
  bắt đầu lại từ attempt1. `bash -n` OK cả 4 script. Script
  histogram `t4-histogram-with18.py` sao từ with17, đổi RUNS sang
  attempt đợt 142 (xem F-142-T4-2: lần chạy đầu trỏ nhầm attempt1 —
  đã vá sang attempt3 trước khi viết LIMITS này).
- Snapshot-trước-đếm-sau (F-137-T4-1): giữ ở mọi poll — mỗi poll chỉ
  chạy `ps` một lần vào `ps-snap-tmp.txt`, đếm blockers từ file đã
  chụp; file tạm chỉ giữ lại khi blockers>0 (blockers>0 ở poll #6
  đợt cũ: 5 — T6 test lock; poll #8: 1 — T6 grep; cả hai đều là
  luồng khác, thoáng qua).

## 2. Poller — 2 boot, 24 poll, 1 reboot giết poller giữa chừng

### 2.1 Boot bde599df — 16 poll, cửa yên mở hụt vì reboot (23:42:38–23:53:55Z)

Poller pid 10410, script `poll-wait-t4-142.sh`, deadline 02:30Z 19/11.

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 23:42:38Z | 711 MB | 1,22 / 0,49 | ĐỎ | postboot exit 1 (libs/GST chưa đủ — apt replay đang chạy), T5 flag cũ |
| #2 | 23:43:23Z | 1.009 MB | 1,66 / 0,71 | ĐỎ | RAM ≥1024 lần đầu nhưng gate 0 đỏ |
| #3–#4 | 23:44:08–53Z | 1.014 / 947 MB | 1,33–1,53 | ĐỎ | apt=1 (replay đang cài) |
| #5–#6 | 23:45:38–46:23Z | 809 / 793 MB | 1,07 / 0,97 | ĐỎ | blockers=5 ở #6 (T6 test-vite-lock-v2, thoáng qua) |
| #7–#8 | 23:47:08–54Z | 713 / 665 MB | 0,51 / 0,68 | ĐỎ | blockers=1 ở #8 (T6 grep); dpkg_lines vẫn 795 |
| #9 | 23:48:39Z | 580 MB | 0,79 / 0,78 | **XANH** | **T5 flag PASS** (round142-t5, boot bde599df, pass_at 23:48:xxZ) + postboot exit 0 — nhưng RAM 580 <1024 |
| #10–#12 | 23:49:24–50:54Z | 563 / 435 / 734 MB | 1,36 / 0,97 | XANH | RAM rơi xuống 435 MB (balloon phồng lại 6.443.824 kB) |
| #13–#16 | 23:51:39–53:55Z | 709 / 859 / 759 / 715 MB | 1,29–0,60 | XANH | RAM hồi dần; balloon xả lại 6.086.092 kB |

- **Cửa yên trên boot bde599df KHÔNG BAO GIỜ mở đủ cả hai gate cùng
  lúc:** RAM ≥1024 ở poll #2–#3 khi gate 0 còn đỏ; gate 0 xanh từ
  poll #9 khi RAM đã rơi dưới 1024. RAMavail vọt 1.935 MB lúc
  23:54:25Z (balloon xả mạnh 6.086.092 → 4.943.632 kB) — nhưng poll
  #17 (dự kiến ~23:54:40Z) **không bao giờ chạy**: xem §2.2.
- Balloon trên boot cũ: đóng băng 6.443.824 kB lúc mở → xả xuống
  5.731.036 kB (23:43:28Z) → phồng lại 6.443.824 kB (23:50:25Z) →
  xả mạnh xuống 4.943.632 kB (23:54:25Z). Mẫu xả–phồng quen thuộc.

### 2.2 Reboot #26 + poller chết theo service restart (23:53:55–23:54:20Z)

- **Poller pid 10410 CHẾT** cùng đợt service restart (~23:54Z,
  giữa poll #16 23:53:55Z và poll #17 ~23:54:40Z). `kill -0 10410`
  xác nhận DEAD; poll log dừng ở #16; `ps` không còn poller.
- **Cùng lúc đó VM reboot: boot bde599df chết trong khung
  (23:53:55Z, 23:54:20Z]** (last-seen poll #16; btime boot mới
  9afdaa89 23:54:20Z). Reboot này chưa đánh số ở T1-142 (T1 ghi
  reboot sang bde599df "chưa đánh số, giao T2-142"); theo chuỗi
  đợt 141 (#24, #25 trong lượt) thì đây là **reboot #26** — T2-142
  chốt số chính thức (mù #61).
- **Cửa yên trên bde599df (RAM 1.935 MB lúc 23:54:25Z) MẤT** —
  attempt1 chưa chạy. Không mất dữ liệu (poll log còn nguyên tới
  #16). Poller khởi động lại 23:55:39Z (pid 2292) trên boot mới.
- T5 đã xử lý reboot đúng: cờ round142-t5 cũ được đổi tên thành
  `POSTBOOT_PASS.stale-bde599df`, cờ mới cho boot 9afdaa89 được
  post lại (pass_at 00:00:22Z, poll=3). Poller KHÔNG tính cờ cũ
  là PASS (boot_id không khớp) — đúng luật gate 0.

### 2.3 Boot 9afdaa89 — 8 poll, cửa mở ở poll #8 (23:55:39–00:00:55Z)

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 23:55:39Z | 1.728 MB | 2,63 / 0,85 | ĐỎ | apt=2, dpkg_lines=52 (replay boot mới), load1 ≥2 chặn cửa |
| #2–#3 | 23:56:24–57:09Z | 1.551 / 1.623 MB | 2,20 / 1,61 | ĐỎ | dpkg_lines 526 → 1.167 (replay chạy nhanh) |
| #4–#5 | 23:57:54–58:39Z | 1.609 / 1.481 MB | 2,45 / 2,39 | ĐỎ→(0) | postboot exit 0 từ #5 (replay xong); apt vẫn =1 |
| #6 | 23:59:25Z | 1.387 MB | 1,25 / 1,35 | ĐỎ | apt=0, dpkg_lines=1.545 (đủ như boot #74 đợt 128); chỉ thiếu cờ T5 mới |
| #7 | 00:00:10Z | 1.295 MB | 0,93 / 1,28 | ĐỎ | T5 flag vẫn cũ (mtime-cu) |
| #8 | 00:00:55Z | **1.170 MB** | 1,33 / 1,33 | **XANH** | **CỬA YÊN MỞ** — T5 flag PASS (boot 9afdaa89) + postboot 0 + RAM ≥1024 — chạy attempt1 ngay |

- RAMavail 8/8 poll ≥1024 MB. Gate 0 xanh từ poll #8: cờ T5
  `round142-t5/POSTBOOT_PASS` (`boot_id=9afdaa89-... btime=
  2026-11-18T23:54:20Z pass_at=2026-11-19T00:00:22Z poll=3`);
  postboot_exit=0; apt=0; dpkg_lines 1.545; cây YES md5=530e10a7;
  lock=khong; blockers=0 (cả 8 poll).
- Không reboot trong lúc đo attempt1–3 (boot 9afdaa89 từ lúc mở cửa
  tới lúc đóng 00:23Z).

## 3. Balloon đã xả bền — lần thứ 2 liên tiếp

| Thời điểm | Balloon | RAMavail | Ghi chú |
|---|---|---|---|
| 23:40:24Z (T4 bắt đầu) | 6.443.824 kB | 513 MB | Y hệt giá trị đóng băng #15/#17-đợt-140/#18-mở |
| 23:43:28Z | 5.731.036 kB | 1.135 MB | Xả −713 MB, rồi phồng lại |
| 23:50:25Z | 6.443.824 kB | 435 MB | **Phồng lại đúng giá trị đóng băng** (chu kỳ xả–phồng) |
| 23:54:25Z | 4.943.632 kB | 1.935 MB | **Xả mạnh −1,50 GB** (ngay trước reboot #26) |
| 00:00:55Z (mở cửa a1) | ~4.880.044 kB | 1.170 MB | Giữ mức xả sau reboot |
| 00:09:56Z (mở a2) | ~4.860.092 kB | 1.778 MB | Ổn định quanh 4,86 GB |
| 00:17:12Z (mở a3) | 4.597.708 kB | 2.221 MB | Xả tiếp −263 MB |
| 00:23:36Z (đóng) | 5.016.164 kB | 1.888 MB | **Tổng −1.427.660 kB (~−1,36 GiB) so với lúc mở** |

- **Kết luận cho parent: balloon ĐÃ tự xả bền trong đợt 142** (lần
  thứ 2 liên tiếp sau đợt 141); cửa yên mở sau ~18 phút chờ trên
  boot mới (8 poll); **KHÔNG cần can thiệp host ở đợt này.**
  Khác mẫu xả–phồng của #15/#16/#17-đợt-140 (xả rồi phồng lại
  ~1 GB trong vòng 8 phút), lần này sau 1 chu kỳ xả–phồng balloon
  xả mạnh và giữ mức thấp suốt 3 attempt.
- Ngưỡng gate A ≥1024 MB GIỮ NGUYÊN (quyết parent) — và đã đủ:
  RAM lúc mở cửa 3 attempt đều ≥1024 MB; RAM giữa attempt3 min
  1.297 MB (0 mẫu <1024 MB).

## 4. Attempt1 — 20/20 pass, median 47,0 ms — LỚP B VI PHẠM (B2) — nhiễm tải

- 00:00:55Z–00:04:48Z. Vite lên nhanh (port 5187, lock v2 giữ);
  20/20 pass (wall 2.864–3.492 ms/pass); probe_exit=0; JSON
  3.319.838 B (`preview-b-f3-flip-webkit-t4-attempt1.json`,
  passes=20, engine webkit 27.2, pageErrs=[]); flip afterPass=5
  wallMs=27196.
- Lớp B: B1 ĐẠT (load5 cuối 1,75); **B2 VI PHẠM** (load1_max **5,24**
  — sampler n=100, RAM min 892 MB, 0 mẫu <500 MB, 5/100 mẫu
  <1024 MB — ghi nhận, không vi phạm); B3 ĐẠT (không reboot); B4
  ĐẠT (apt/dpkg 0); B5 ĐẠT (RAM min 892 MB).
  **Nguyên nhân B2:** load1 tăng đơn điệu suốt lượt (per-pass mean
  2,11 → 4,91; >4 từ ~00:02:02Z, pass 15–20); ps-before có T6 chạy
  lệnh grep khổng lồ quét toàn bộ `apps/desktop/build/slim-venv`
  (scipy/sympy, pid 8410) chồng lên cửa sổ đo. Lượt nhiễm tải
  theo đúng nghĩa attempt1 đợt 128 (T2 `blind47-sessions.py`).
- Coverage-check ngay: **6/6 (c2) được log phủ** (seq 272/324/395/
  455×2/475); blendTick hậu-flip trong ±500 ms của log: xem
  c2coverage. Không có marker COVERAGE-0.
- Số đo (chỉ ghi nhận, KHÔNG dùng verdict): tickCost total median
  50,0 / p90 73,3 / max 116 / min 28; hậu flip+2000ms median **47,0**
  (n=442); tBlend gap n=490 median 90,0 / p90 114,1 / max 2206.
  (c2) = 6 occurrence (5 seq riêng biệt; seq 455 đóng góp 2
  occurrence — đúng DEF §2, vd seq 145 lượt #14): lags +1, +1, +1,
  +5, +2, +1. P1 (theo occurrence) 6/6, p=2,65e-06 → ĐÚNG (quan
  sát); P2 0 lag âm → ĐÚNG (quan sát); P3-A1 4/6, p=0,0438 → SAI
  (quan sát — 455 là tick bắt kịp sau stall, như seq 208 ở #17);
  P3' 4/5 seq (stall 5,7,2,1,5), p≈0,018 → SAI (quan sát);
  P4: thuần +1f 4, tổng 6, skp=1 0, **lag ≥+5f = 1** → ngoài 1 tiêu
  chí con (quan sát); P5 4/4 (snap 40, raw 9, floor 69,7%, run 14);
  P6 trong khoảng cả 3 bin (34,5 / 43,0 / 8,4); P7 ĐÚNG (quan sát);
  F6' ĐÓNG (79 tick, 100%). Lag5 (b): 10 occurrence ≥+5f gom thành
  **1 event** (seq 450–455, tBlend 74645–75054, M=[31], presented
  19→31, label 16→26, lag max +15f) — event stall thật, đuôi của
  nó là (c2) seq 455 lag +5f.
- **Kết luận attempt1: lượt nhiễm tải — KHÔNG dùng cho verdict
  ngưỡng** (lớp B vi phạm theo DEF §1, dù median 47,0 ≤ 60).
  Poller thoát exit 0 sau attempt1 (run-attempt exit=0) — vòng
  retry của poller chỉ kích hoạt khi exit ≠ 0, nên không tự chạy
  attempt2 (xem F-142-T4-4).

## 5. Attempt2 — 20/20 pass, median 51,0 ms — LỚP B VI PHẠM (B2) — nhiễm tải

- 00:09:56Z–00:13:52Z. Chạy tay bằng `run-attempt-142.sh attempt2`
  sau gate-check đầy đủ (load1 1,33, RAM 1.778 MB, tree YES, lock
  khong, apt 0, blockers 0, postboot exit 0, T5 flag PASS — xem
  §8). 20/20 pass; probe_exit=0; JSON 3.186.428 B; flip afterPass=5
  wallMs=28259.
- Lớp B: B1 ĐẠT (load5 cuối 1,83); **B2 VI PHẠM** (load1_max **4,59**
  — 10 mẫu >4 lúc 00:11:06–24Z, pass 15–19; sampler n=101, RAM min
  1.083 MB, 0 mẫu <500 MB, 0/101 mẫu <1024 MB); B3 ĐẠT; B4 ĐẠT;
  B5 ĐẠT.
  **Nguyên nhân B2:** ps-before/after KHÔNG có process phân tích
  nào của luồng khác (chỉ vite + WebKit của chính T4) — gò tải
  1,54→2,8→4,29→4,59→4,04→1,67 là của **chính stack đo** (vite +
  WebKit + MiniBrowser trên cell 1,5 CPU), đúng như attempt2 đợt
  128 (1 mẫu 4,18, stack đo tự gây). Bar B2 (load1 ≤4 mọi mẫu 2 s)
  đang là điểm nghẽn thực tế: 2/2 lượt hoàn chỉnh đợt này vấp B2,
  trong đó attempt2 chỉ vấp 10 mẫu cuối lượt do stack đo — T4
  KHÔNG tự sửa bar, chỉ ghi nhận để parent quyết (như đợt 128 §6).
- Coverage-check ngay: **4/4 (c2) được log phủ** (seq 153/208/228/
  296). Không có marker COVERAGE-0.
- Số đo (chỉ ghi nhận, KHÔNG dùng verdict): tickCost total median
  48,0 / p90 82,0 / max 108 / min 28; hậu flip+2000ms median **51,0**
  (n=421); tBlend gap n=471 median 93,0 / p90 146,0 / max 2045.
  (c2) = 4 occurrence (4 seq riêng biệt): lags +1, +1, +3, +1.
  P1 3/4, p=0,0254 → SAI (quan sát — 3/4 ≥2/3 nhưng p ≥0,01);
  P2 0 lag âm → ĐÚNG (quan sát); P3-A1 3/4, p=0,0647 → SAI (quan
  sát); P3' 4/4 (stall 7,7,8,4), p≈0,0056 → ĐÚNG (quan sát); P4
  ĐÚNG (quan sát: thuần +1f 3, tổng 4, skp=1 0, lag ≥+5f (c2) 0);
  P5 4/4 (snap 43, raw 8, floor 65,5%, run 22 — biên trên); P6
  trong khoảng cả 3 bin (39,2 / 36,5 / 10,5 — bin0 sát trần 39%);
  P7 ĐÚNG (quan sát); F6' ĐÓNG (78 tick, 100%). Lag5 (b):
  4 occurrence ≥+5f (seq 229–230, chi tiết trong file lag5) —
  không phải (c2) nên không tính vào P4.
- Wallbands: 0–20k median 40,0; 20–32k 46,0; 32–45k 52,0; 45–62k
  45,0; 62–70k 45,0; 70–80k **64,0** (band duy nhất >60 ms).
- Tương quan Pearson (20 pass): median~load1_mean **r = +0,36**;
  median~RAM_mean **r = −0,40** — đổi dấu so với attempt1
  (r = −0,54 / +0,06); không kết luận nhân quả.
- **Kết luận attempt2: lượt nhiễm tải — KHÔNG dùng cho verdict
  ngưỡng.**

## 6. Attempt3 — 20/20 pass, LƯỢT YÊN #18 HỢP LỆ, exit 0

- 00:17:12Z–00:21:01Z. Chạy tay bằng `run-attempt-142.sh attempt3`
  sau gate-check đầy đủ (load1 0,75, RAM 2.221 MB, tree YES, lock
  khong, apt 0, blockers 0, postboot exit 0, T5 flag PASS — xem
  §8). Đây là attempt CUỐI theo tiền lệ đợt 128 (tối đa 3 attempt).
  Vite lên nhanh (port 5187, lock v2 giữ); 20/20 pass (wall
  2.966–3.471 ms/pass); probe_exit=0; JSON 3.355.284 B
  (`preview-b-f3-flip-webkit-t4-attempt3.json`, passes=20, engine
  webkit 27.2, pageErrs=[]); flip afterPass=5 wallMs=26107.
- Lớp B 5/5 ĐẠT (sampler n=100, load1_max **2,00**, RAM min
  1.297 MB, max 2.071 MB, 0 mẫu <500 MB, **0/100 mẫu <1024 MB**,
  load5 cuối 1,24; không reboot; không apt/dpkg).
- Coverage-check ngay: **7/7 (c2) được log phủ** (seq 174/203/225/
  357/431/454/478); blendTick hậu-flip trong ±500 ms của log: xem
  c2coverage. Không có marker COVERAGE-0.

## 7. Load/RAM theo TỪNG PASS — attempt3 (quyết parent đợt 137 §12.3(c))

| Pass | tick n | median | p90 | wall | load1 (mean) | RAM mean |
|---|---|---|---|---|---|---|
| 1 | 27 | 43,0 | 71,2 | 3.054 ms | 1,07 | 1.685 MB |
| 2 | 26 | 40,5 | 65,0 | 3.026 ms | 1,32 | 1.602 MB |
| 3 | 29 | 46,0 | 80,4 | 3.471 ms | 1,52 | 1.618 MB |
| 4 | 30 | 50,5 | 76,7 | 3.189 ms | 1,50 | 1.594 MB |
| 5 | 33 | 41,0 | 74,4 | 3.291 ms | 1,73 | 1.538 MB |
| 6 | 33 | 43,0 | 66,6 | 3.169 ms | 2,00 | 1.544 MB |
| 7 | 30 | 48,5 | 74,2 | 3.302 ms | 1,95 | 1.551 MB |
| 8 | 33 | 39,0 | 65,8 | 3.198 ms | 1,88 | 1.546 MB |
| 9 | 32 | 52,0 | 78,6 | 3.461 ms | 1,84 | 1.500 MB |
| 10 | 31 | 50,0 | 70,0 | 3.100 ms | 1,86 | 1.484 MB |
| 11 | 33 | 52,0 | 76,6 | 3.245 ms | 1,81 | 1.440 MB |
| 12 | 32 | 40,0 | 66,6 | 3.068 ms | 1,75 | 1.451 MB |
| 13 | 29 | 41,0 | 70,2 | 3.177 ms | 1,72 | 1.436 MB |
| 14 | 33 | 55,0 | 81,4 | 3.247 ms | 1,75 | 1.422 MB |
| 15 | 32 | 47,0 | 72,6 | 3.271 ms | 1,77 | 1.378 MB |
| 16 | 30 | 54,0 | 73,7 | 3.258 ms | 1,75 | 1.375 MB |
| 17 | 29 | 40,0 | 71,8 | 3.073 ms | 1,68 | 1.348 MB |
| 18 | 32 | 53,5 | 74,8 | 3.298 ms | 1,65 | 1.340 MB |
| 19 | 30 | 44,5 | 71,0 | 3.114 ms | 1,62 | 1.326 MB |
| 20 | 30 | 50,0 | 70,5 | 2.966 ms | 1,58 | 1.318 MB |

- Tương quan Pearson (20 pass): median~load1_mean **r = +0,15**;
  median~RAM_mean **r = −0,30** — đều YẾU. **Ba attempt đợt này
  đổi dấu liên tục** (a1: −0,54/+0,06; a2: +0,36/−0,40; a3:
  +0,15/−0,30): load1 là trung bình 1 phút nên biến thiên chậm,
  và chỉ 3 lượt — **không kết luận nhân quả**; giả thuyết
  "tải song song gây median cao" vẫn mở, cần thêm lượt.
- Wallbands (attempt3): 0–20k median 44,0; 20–32k 47,0; 32–45k 45,0;
  45–62k 50,0; 62–70k 49,5; 70–80k 51,0 ms — không có band nào vượt
  60 ms.

## 8. P1–P7 + P3' theo DEF v0.5 — attempt3 (lượt hợp lệ #18)

Tick post: n=368 (viaRvfc=0, tBlend ≥ flip+2000ms). (c2) = 7
occurrence, toàn bộ skp=0, lag +1f:

| seq | presented | label | lag | stall_truoc | P3-A1 | P3' |
|---|---|---|---|---|---|---|
| 174 | 13 | 12 | +1f | 5 | ĐẠT | ĐẠT |
| 203 | 16 | 15 | +1f | 7 | ĐẠT | ĐẠT |
| 225 | 15 | 14 | +1f | 3 | ĐẠT | ĐẠT |
| 357 | 13 | 12 | +1f | 7 | ĐẠT | ĐẠT |
| 431 | 16 | 15 | +1f | 6 | ĐẠT | ĐẠT |
| 454 | 16 | 15 | +1f | 3 | ĐẠT | ĐẠT |
| 478 | 14 | 13 | +1f | 3 | ĐẠT | ĐẠT |

| Tiêu chí | Kết quả #18 | Verdict |
|---|---|---|
| Lượt hợp lệ (20/20 + lớp B 5/5 + median ≤60 ms) | 20/20, B 5/5, median 49,0 ms | **HỢP LỆ** |
| P1 (c2) gắn run-end (run ≥3) | 7/7 gần run-end; baseline 45/368 = 12,2%; p = 0,00000041 (signed: cùng baseline, cùng p) | **ĐÚNG** |
| P2 (lag ≥ +1f, 0 lag âm) | 7/7 lag +1f, 0 âm | **ĐÚNG** |
| P3-A1 (đóng băng-tại-tick) | 7/7; baseline 87/367 = 23,7%; p = 0,000042 | **ĐÚNG** |
| P3' stall-based (prereg) | 7/7 seq stall ≥2 (5,7,3,7,6,3,3); baseline 23,7%; p ≈ 0,000034 | **ĐÚNG** |
| P4 (số lượng) | thuần +1f 7 (2–8); tổng 7 (2–12); skp=1 0; lag ≥+5f (c2) 0 | **ĐÚNG** |
| P5 (số phụ) | snap 36 ms (34–52); raw 9 ms (8–10); label-floor +1 71,5% (63–76%); run ≥3: 15 (13–22) | **ĐÚNG 4/4** |
| P6 (histogram) | bin0 36,7% (33–39); +1/+2 42,4% (33–53); +3 13,3% (3–19) | Trong khoảng cả 3 bin |
| P7 (log draw phủ) | 7/7 phủ; drawSrc delta −1/0 (75/75), 0 trễ ≥+1f; rawUnit chênh 0 (75/75) | **ĐÚNG** |
| F6' (skippedLatest) | 73 tick skp=1, 100% không vi phạm | **ĐÓNG lần 6 liên tiếp** |

- Chi tiết P1: 15 run ≥3 tick trong 368 tick post; cả 7 seq (c2)
  đều ở run-end hoặc sát run-end (174, 225, 357, 431, 454, 478
  đúng bằng run-end; 203 cách run-end 202 đúng 1 tick — cùng quy
  ước "gần" như #16/#17).
- Chi tiết P3-A1/P3': **không lệch nhau seq nào** — cả 7 seq đều
  đóng băng-tại-tick (A1 đúng) và đều nằm cuối chuỗi stall ≥2
  (P3' đúng). Trả lời câu parent đợt 141 §11: A1 = 7/7, không rớt
  dưới 2/3; **không cần xem lại** định nghĩa nào. Mẫu lệch ở #17
  (seq 208, tick bắt kịp) không tái hiện.
- Chi tiết P7: log c2DrawLog n=1191 (loop 1–21 đủ, 20 wrap, span
  9.488→79.534 ms); tại 7 seq (c2): 18–26 entry trong ±500 ms
  (drawSrc 9–13, rawUnit 9–13 mỗi seq). Đối chứng toàn cửa sổ
  post: drawSrc delta chỉ −1 (292) / 0 (157), 0/449 trễ ≥+1f.
- Chi tiết P5/P6 (histogram, nGhost=736, nomatch=0, srcKind
  canvas 736): hist chi tiết {-9: 2, -1: 54, 0: 270, +1: 134,
  +2: 178, +3: 98}; đuôi âm 7,6% (56/736) — thấp hơn #17 (10,4%)
  và #14 (13,7%); đuôi +3 13,3% — cao hơn #16 (6,3%), thấp hơn
  #14 (16,2%). Đuôi âm giảm khi median tickCost tăng nhẹ
  (47,0 → 49,0 ms) — ngược chiều quan sát ở DEF §9; chỉ 1 lượt,
  không kết luận.
- **Ba điều kiện mở lại điều tra (DEF §13):** (1) P1 gãy — KHÔNG
  (P1 ĐÚNG); (2) lag âm — KHÔNG (0); (3) +2f ≥3 — KHÔNG (+2f đúng
  = 0). **Không điều kiện nào xảy ra; điều tra (c2) vẫn ĐÓNG.**
- Cộng dồn sau lượt này: P1 45/45, P2 36/36 occurrence, P3-A1
  40/45 (88,9%), P3' 17/17 (3 lượt), P7 31/31 (từng seq), F6' đóng
  6 lần liên tiếp. Tỉ lệ (c2)/tick post #18: 7/368 = 1,90% (trong
  dải các lượt trước: #13 0,33%, #14 2,03%, #16 1,08%, #17 1,73%).

## 9. Sai số F-142-T4-1..5

- **F-142-T4-1 — Poller chết theo service restart + reboot #26
  giết cửa yên trên boot cũ.** Poller pid 10410 chết giữa poll #16
  (23:53:55Z) và #17 (~23:54:40Z) cùng đợt service restart; cùng
  phút đó VM reboot (bde599df → 9afdaa89, btime 23:54:20Z), khung
  chết (23:53:55Z, 23:54:20Z]. Cửa yên trên boot cũ (RAM 1.935 MB
  lúc 23:54:25Z) mất — attempt1 chưa chạy. Poller khởi động lại
  23:55:39Z (pid 2292) trên boot mới; poll log còn nguyên tới #16;
  không mất dữ liệu. Số reboot #26 do T2-142 chốt chính thức.
- **F-142-T4-2 — Histogram RUNS trỏ nhầm attempt1 lần đầu.**
  `t4-histogram-with18.py` sao từ with17, sửa RUNS sang attempt1
  đợt 142 thay vì attempt3 (lượt hợp lệ). Phát hiện nhờ nTicks
  không khớp (357 thay vì 368) TRƯỚC khi viết LIMITS này; đã vá
  RUNS sang `round142-t4/preview-b-f3-flip-webkit-t4-attempt3.json`
  + nhãn `T4-142 (a3)`, chạy lại exit 0. Histogram attempt1/attempt2
  giữ lại làm quan sát (file `t4-histogram-with18.txt` lần đầu đã
  bị ghi đè — số attempt1 còn trong LIMITS này §4; attempt2 trong
  `t4-histogram-a2.txt`). Không ảnh hưởng verdict.
- **F-142-T4-3 — Analyzer P1/P3/P7 gọi với danh sách seq đã dedup
  lần đầu (attempt1).** Lần chạy đầu truyền `"272,324,395,455,475"`
  (5 seq) thay vì danh sách occurrence `"272,324,395,455,455,475"`.
  DEF §2: P1/P3-A1 đếm theo OCCURRENCE (vd seq 145 lượt #14 có 2
  occurrence), chỉ P3' đếm theo seq riêng biệt. Đã chạy lại với
  danh sách occurrence làm bản chuẩn (`analyze-t4-attempt1-p1p3p7.txt`
  = raw6: P1 6/6 p=2,65e-06, P3-A1 4/6 p=0,0438); bản dedup giữ
  lại làm độ nhạy (`...-p1p3p7-dedup5.txt`: P1 5/5, P3-A1 4/5
  p=0,0184 — cùng verdict P3-A1 SAI, khác p). Không ảnh hưởng
  verdict (attempt1 nhiễm tải, chỉ quan sát).
- **F-142-T4-4 — Poller không retry khi attempt 20/20 vi phạm lớp B.**
  Vòng retry của poller (sao từ đợt 141) chỉ kích hoạt khi
  run-attempt exit ≠ 0; attempt 20/20 vi phạm B2 vẫn exit 0 nên
  poller thoát sau attempt1. Attempt2/attempt3 được chạy tay sau
  gate-check đầy đủ từng lượt (load1/RAM/tree/lock/apt/blockers/
  postboot/T5-flag), theo tiền lệ đợt 128 (tối đa 3 attempt). Nợ
  cho đợt sau: poller nên kiểm verdict lớp B trước khi thoát
  (không sửa giữa đợt).
- **F-142-T4-5 — Kiểm tra tiến trình sót: `ps` grep tự khớp (như
  F-141-T4-1).** Lúc kiểm sau attempt3, `ps | grep vite` liệt kê
  cả dòng lệnh exec của chính phép kiểm. Kiểm lại bằng snapshot
  `ps-after-t4-close.txt` + grep lọc: **0 tiến trình T4 còn sống,
  lock vite đã nhả, 0 Xvfb/WebKit/vite-5187 process**. Socket Xvfb
  `:193` sót lại trong `/tmp/.X11-unix/` (SIGKILL không dọn socket
  — như đợt 128 §7.3); T4 đã xóa tay, thư mục trống lúc đóng.
  Chỉ là nhiễu phép kiểm + dọn dẹp thường lệ, không ảnh hưởng dữ
  liệu.

## 10. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND142_T4_WEBKIT_QUIET18_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script/phân tích mới (trong hidden_files, không stage — file làm
  việc nội bộ):** `poll-wait-t4-142.sh` (deadline 02:30Z 19/11, cờ T5
  round142-t5, vòng retry từ attempt1); `run-attempt-142.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`,
  `vite.t4-temp.config.mjs`, `probe121t3-ghost-k7.webkit.mjs`,
  `b.json`, `analyze-t4-p1p3p7.py` (đã kiểm chứng tái tạo #17 100%),
  `t4-histogram-with18.py` (+ output `t4-histogram-with18.txt`,
  đã vá RUNS sang attempt3 — F-142-T4-2; `t4-histogram-a2.txt`
  cho attempt2), `repro-17-p1p3p7.txt` (tái tạo #17, diff sạch).
- **Log/evidence (hidden_files/round142-t4/, không stage):**
  `poll-t4.log` (24 poll: 16 trên bde599df + 8 trên 9afdaa89),
  `chain-t4.log`, `poll-t4.nohup.log`, `poll-t4.nohup2.log`,
  `postboot-t4-142-gate0wait-*.log`,
  `postboot-t4-142-attempt{2,3}-gate0.log` (gate-check tay, exit 0),
  `ps-snap-attempt{2,3}-gate.txt`, `ps-before/after-t4-attempt{1,2,3}.txt`,
  `ps-after-t4-close.txt`, `blockers-ps-6.txt`, `blockers-ps-8.txt`,
  `blockers-list-6.txt`, `blockers-list-8.txt`,
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json` (a1: 20/20 —
  3.319.838 B; a2: 20/20 — 3.186.428 B; a3: 20/20 — 3.355.284 B),
  `run-webkit-t4-attempt{1,2,3}.log`, `run-attempt{2,3}.nohup.log`,
  `vite-5187-t4-attempt{1,2,3}.log`,
  `load-mid-t4-attempt{1,2,3}.log`,
  `classb-t4-attempt{1,2,3}.txt`,
  `analyze-t4-attempt{1,2,3}-*.txt` (c2drawlog, labellag, skiplatest,
  lag5, tickcost, wallbands, perpass, stall, c2coverage, p1p3p7)
  + `analyze-t4-attempt1-p1p3p7-dedup5.txt` (độ nhạy — F-142-T4-3)
  + `coverage-check-attempt{1,2,3}.txt` (6/6, 4/4, 7/7),
  `marker-t4-attempt{1,2,3}`, `tree-md5.txt`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round142-t4-quiet18.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round142-t4.done` (tạo sau khi viết LIMITS
  này).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 142).

## 11. Chờ quyết / nợ đợt 143

1. **P3-A1 vs P3' KHÔNG lệch ở #18** — cả hai 7/7. Câu parent đợt
   141 §11 đã có đáp án: A1 không rớt dưới 2/3; không cần xem lại
   định nghĩa nào. Tiếp tục theo dõi ở các lượt sau.
2. **B2 là điểm nghẽn thực tế đợt này** (2/2 lượt hoàn chỉnh đầu
   đều vấp; attempt2 chỉ vấp 10 mẫu do chính stack đo, không có
   luồng khác — như attempt2 đợt 128). Đợt sau: chạy attempt khi
   các luồng phân tích nặng đã xong (attempt3 chứng minh load1 giữ
   ≤2,00 khi máy yên thật); nếu B2 tiếp tục là điểm nghẽn duy nhất
   trong khi median vẫn ≤60, parent có thể xem xét lại định nghĩa
   B2 (ví dụ: cho phép 1 mẫu vượt nhẹ do stack đo, hoặc đo load1
   bằng sampler dày hơn) — T4 KHÔNG tự sửa bar. **Nợ kỹ thuật:**
   poller nên kiểm verdict lớp B trước khi thoát (F-142-T4-4) —
   mang vào bản poller đợt 143.
3. **Giả thuyết tải–median vẫn mở** (§7): tương quan đổi dấu qua
   3 attempt (a1 −0,54; a2 +0,36; a3 +0,15). Cần thêm lượt mới kết
   luận; T4 đợt sau tiếp tục ghi load1/RAM theo từng pass.
4. **Balloon xả bền lần thứ 2 liên tiếp** (§3) — không cần can
   thiệp host ở đợt này. Tiếp tục theo dõi ở đợt sau (nếu lại
   đóng băng 6.443.824 kB nhiều đợt thì mẫu xả–phồng quay lại).
5. **Event stall seq 450–455 ở attempt1 (lag tới +15f, 1 event)**
   — chỉ xuất hiện ở lượt nhiễm tải, KHÔNG tái hiện ở attempt3
   hợp lệ (lag5 (b) = 0 occurrence). Giữ làm case theo dõi; không
   mở lại điều tra từ lượt nhiễm tải.
6. **Không có gì khác chờ parent ở lượt này** — lượt #18 hợp lệ ở
   attempt3, mọi phép thử P1–P7 + P3' đều ĐÚNG, điều tra (c2) vẫn
   đóng, ngân sách retry setup còn nguyên 2/2.
