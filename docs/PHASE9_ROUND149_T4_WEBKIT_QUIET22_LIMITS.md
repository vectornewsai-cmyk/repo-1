# PHASE9_ROUND149_T4_WEBKIT_QUIET22_LIMITS.md

**Đợt:** 149. **Luồng:** T4 — đo lượt yên WebKit #22 trên boot mới
(với probe đã vá đợt 148, không sửa probe đợt này). **Ngày:** 19/11/2026.
**Boot đo:** 70025d3e (btime 20:00:33Z /proc/stat; boot_id đầy đủ
70025d3e-ff1b-4519-aa1e-5459a616930b; `/proc/1` không đối chiếu đợt này —
chuẩn btime theo quyết parent đợt 148 §12.3(b) là /proc/stat).
**Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở poller, lúc
start/end cả 3 attempt, lúc đóng — không đổi). **Trạng thái:
#22 VẪN MỞ — KHÔNG CÓ LƯỢT HỢP LỆ (hết ngân sách 3/3 attempt; poller
thoát exit 11 lúc 21:05:11Z).** Attempt1 wedged ở pass 5 (partial 4/20);
attempt2/3 đủ 20/20 nhưng lớp B VI PHẠM cả hai (nhiễm tải nặng từ các
luồng song song) và median tickCost vượt xa ngưỡng (138,0 / 112,0 ms).

## 0. Verdict tổng

- **Attempt1-70025d3e (20:48:19–20:52:35Z): partial 4/20, probe exit 3
  (pass-timeout).** Pass 5 kẹt rAF/renderer 120 s wall-clock ngay sau
  FLIP; writePartial cả 3 fetch timeout 30 s → đường abort-3-timeout
  mới (vá đợt 148) kích hoạt live LẦN ĐẦU ở attempt thật: partial JSON
  4/20 giữ nguyên, probe thoát 3, KHÔNG kẹt (xem §3). Lớp B VI PHẠM
  (B1 load5 cuối 3,31; B2 load1 max 6,03). (c2)=0 seq. **Không cộng dồn.**
- **Attempt2-70025d3e (20:52:45–20:58:51Z): 20/20 pass, tickCost
  median 138,0 ms (n=305; post-flip 165,0; p90 216,6; max 395; min 32)
  — LỚP B VI PHẠM (B1 load5 cuối 2,72; B2 load1 max 7,23).** Theo luật
  đứng: lượt nhiễm tải, KHÔNG dùng verdict; poller RETRY 2→3. (c2)=1 seq
  (60, lag +1f), coverage 1/1, P1 YẾU, P3-A1 VÔ HIỆU, P3' 0/1 KHÔNG ĐẠT,
  P7 ĐÚNG — ghi nhận ngoài cộng dồn (xem §4). **Không cộng dồn.**
- **Attempt3-70025d3e (20:59:01–21:05:11Z): 20/20 pass, tickCost
  median 112,0 ms (n=327; post-flip 109,0; p90 202,0; max 394; min 31)
  — LỚP B VI PHẠM (B1 load5 cuối 4,73; B2 load1 max 11,10 — nặng nhất
  đợt).** Poller hết ngân sách 3/3, thoát exit 11. (c2)=0 seq; lag5 (b)
  2 occurrence / 1 event (+8f, seq 88/89) — ghi nhận ngoài cộng dồn
  (xem §5). **Không cộng dồn.**
- **Median tái tính độc lập (statistics.median + np.median trên
  trường `total` của JSON): A1 47,0000 (n=117, partial); A2 138,0000
  (n=305); A3 112,0000 (n=327) — khớp đúng analyzer.** A2: 5/305 tick
  ≤60, 0 tick đúng =60; A3: 11/327 tick ≤60, 0 tick đúng =60.
- **Số cộng dồn (c2) — VẪN 18 lượt hợp lệ, không đổi:** P1 52/52,
  P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38 (như cuối đợt 148).
- **Ngân sách dùng 3/3; poller thoát exit 11 lúc 21:05:11Z.**
  0 reboot trong phiên (boot 70025d3e suốt). Không process T4 nào còn
  sống lúc đóng (vite :5187 chết, vite.lock đã nhả, xem §7).
- **Chạy lại:** T4 này là lượt chạy lại sau khi T4 trước chết giữa
  chừng (exec lỗi output_drain_timeout, không có kết quả cuối). Vòng
  poll-wait của T4 cũ (PID 3248 + waiter 3376) VẪN CHẠY và được dùng
  chung, không khởi động poll-wait thứ hai; mọi lệnh dài đều redirect
  ra file rồi đọc theo phần nhỏ (bài học từ cái chết đó).

## 1. Poller — 9 poll, cửa mở poll #9 qua gate0 dự phòng T4-check-only

- **Test (POLL_TEST=1) 20:41:58Z (T4 cũ):** 1 poll, exit 7.
  blockers=0, lock=khong, tree YES 530e10a7, T5 flag cũ (148-t5),
  postboot exit 1, RAM 907 MB, apt=1 (replay T5 đang chạy, dpkg_lines=2).
- **Poll #1–#4 (20:42:17–20:44:32Z):** apt replay đang cài
  (dpkg_lines 2 → 480 → 1265), postboot exit 1 (thiếu libs/GST),
  RAM 789–1181 MB, load1 0,46–3,02. Gate0 chưa đạt, gate A chưa đủ.
- **Poll #5 (20:45:17Z):** apt=0, dpkg_lines=1545 (= 1545/221 như
  đợt 148), postboot check-only PASS lần đầu (pb_age=0) → gate0
  T4-check-only; nhưng load1=2,85 >2 nên gate A chưa đủ. RAM 1078 MB.
- **Poll #6–#8 (20:46:03–20:47:33Z):** gate0 T4-check-only giữ
  (pb_age 1→3), apt=0, dpkg=1545; RAM tụt 968 → 895 → 809 MB
  (<1024) nên cửa vẫn đóng; load1 1,28–1,68.
- **Poll #9 (20:48:18Z): CỬA MỞ:** load1=1,67 load5=1,54 RAM=1157 MB,
  gate0 T4-check-only (pb_age=0, check-only chạy lại), apt=0,
  dpkg=1545, cây YES — chạy attempt1 ngay (đã dùng 0/3).
- **Cờ T5 đến sau cửa 65 giây:** `round149-t5/POSTBOOT_PASS` ghi
  20:49:23Z, boot_id khớp 70025d3e, btime 20:00:33Z, pass_at
  20:49:23Z, poll=2, repair=none/replay-full, dpkg=1545/221 — khớp
  hoàn toàn với kết quả check-only của T4 (cùng dpkg 1545/221).
  Đường dự phòng (quyết (j) đợt 143) đã làm đúng việc nó sinh ra
  để làm; cờ T5 xác nhận độc lập sau đó. Xem F-149-T4-6.
- **Cửa chỉ canh attempt1:** vòng retry của poller chạy attempt2/3
  ngay sau attempt trước (sleep 10 s, KHÔNG poll lại gate). Lúc
  start attempt2 load1 đã 5,91; attempt3 load1 6,74 — cả hai đều
  khởi động trong tải nặng (xem §6, F-149-T4-3). Đây là thiết kế
  đứng (148 cũng vậy, nhưng 148 gặp lúc máy yên); đợt này nó phơi
  ra điểm yếu.

## 2. Script — không sửa probe; 1 lỗi copy tên file đã vá bằng symlink lúc chạy

- Probe `probe121t3-ghost-k7.webkit.mjs` md5 `4291e539ce1d330bd35ec7b3b6764f05`
  — **byte-identical với bản đã vá đợt 148** (watchdog wall-clock
  20 phút + pwEvalTimeout 30 s ở re-arm/flip + abort-3-timeout).
  Không sửa gì thêm đợt này.
- **F-149-T4-2 — poll-wait-t4-149.sh gọi `run-attempt-148.sh`
  (tên cũ sót lại khi copy 148→149), nhưng thư mục chỉ có
  `run-attempt-149.sh`.** T4 chạy lại phát hiện lúc 20:44Z (trước
  khi cửa mở) và tạo symlink `run-attempt-148.sh →
  run-attempt-149.sh`; poller đang chạy resolve được tên qua symlink
  nên cả 3 attempt chạy đúng script 149 (nhãn analyzer T4-149a1/2/3
  đúng cả ba — kiểm chứng trong file analyze). Nếu không vá, attempt
  đầu tiên đã exit 127 ("setup") và đốt 1/3 ngân sách. **Nợ:**
  sửa tên gọi thành run-attempt-149.sh trong poll-wait-150.
- Các script khác không đổi so với 148 ngoài đổi tên/đường dẫn/hạn:
  poll-wait (cờ T5 round149-t5 + dự phòng round148-t5, hạn cắt
  22:30Z, hạn cờ 23:00Z), run-attempt (nhãn T4-149a), inner
  (đường dẫn round149-t4; kiểm file vòng trước round148-*).
  `bash -n` OK; `node --check` probe OK (md5 khớp 148).
- **F-148-T4-1 vẫn nợ:** p1p3p7 KHÔNG được run-attempt gọi tự động;
  T4-149 chạy tay cho attempt2 (seq 60) sau khi poller thoát
  (xem §4). A1/A3 (c2)=0 → không có gì để chạy.

## 3. Attempt1-70025d3e — partial 4/20, pass 5 wedged, abort-3-timeout kích hoạt live lần đầu

- **20/20? KHÔNG — 4/20 pass** (probe-start 20:48:21Z; pass 4 xong
  ~20:48:4xZ; inner-end 20:52:20Z probe_exit=3; run-attempt exit
  20:52:28Z; poller 20:52:35Z). tickCost partial median **47,0 ms**
  (n=117; p90 73,4; max 109; min 29; 91 tick ≤60, 3 tick đúng =60).
  tBlend gap n=93 median 84,0. BlendTick/pass=23,5. rAF/pass median 38
  (31–49 — cao hơn hẳn A2/A3 ~20, vì 4 pass đầu máy còn khá yên).
  webkit=27,2; pageErrs=[].
- **Per-pass (3 pass đầu, máy còn yên):** pass 1 median 53,0
  (load1 mean 1,54, RAM mean 1024); pass 2 median 49,0 (load1 1,43);
  pass 3 median 43,0 (load1 1,42). Ba pass đầu sạch và nhanh — gần
  mức 148-A3 (60,0) — rồi tải leo lên.
- **Điểm kẹt (mới, khác 147):** `play pass 5 lỗi: pass-timeout: pass 5
  không tiến trong 120000ms wall-clock (kẹt rAF/renderer)`
  20:50:49Z — pass 5 là pass FLIP (`--flip-rvfc-after-pass 5`).
  Sau đó writePartial: tickCost TIMEOUT 30 s (20:51:19Z), blendTick
  TIMEOUT 30 s (20:51:49Z), c2DrawLog TIMEOUT 30 s (20:52:19Z) →
  `CA 3 FETCH DEU TIMEOUT — trang wedged` → partial JSON 4/20 giữ
  nguyên → probe thoát 3 lúc 20:52:19Z. **Toàn bộ đường thoát mới
  đợt 148 (abort-3-timeout) đã chạy đúng live lần đầu ở attempt thật
  (trước đó chỉ có smoke S2 ép bằng tctimeout=1 ms): không kẹt,
  không cần watchdog 20 phút nổ, lock nhả sau ~16 s.**
  Khác 147 ở chỗ: 147 kẹt SAU writePartial (ở re-arm, do pwEval thô);
  149 kẹt TRONG pass 5 (trước writePartial) rồi abort sạch.
- **Lớp B VI PHẠM — B1 + B2:** sampler n=118, load1_max=6,03,
  RAM_min=681 MB, RAM_max=1141 MB, 0 mẫu <500 MB, 84/118 mẫu
  <1024 MB; load5 cuối 3,31; B3/B4/B5 ĐẠT (dpkg delta 0, apt=0).
  Tải leo trong lúc đo: lúc start load1 1,67, lúc inner-end 4,66.
  B2 ps-before/after có job T6 `test-vite-lock-v2.sh` (round149-t6)
  chạy song song — nguồn nhiễm một phần (xem §6).
- **(c2): 0 seq** (labellag không có occurrence "dang ngo that" nào;
  P3' không có seq; lag5 (b) 0 occurrence). **Không cộng dồn.**

## 4. Attempt2-70025d3e — 20/20 pass, median 138,0 ms, B VI PHẠM, (c2)=1 seq

- **20/20 pass** (probe-start 20:52:49Z; pass 20 xong 20:55:20Z;
  inner-end 20:57:15Z probe_exit=0; run-attempt exit 20:57:22Z;
  poller 20:58:51Z). tickCost median **138,0 ms** (n=305;
  post-flip 165,0; p90 216,6; max 395; min 32; chỉ 5 tick ≤60,
  0 tick đúng =60). tBlend gap n=233 median 277,0 (p90 624,0;
  max 4680). BlendTick/pass=11,7. rAF/pass median 20 (15–36).
  webkit=27,2; pageErrs=[]. FLIP wallMs=47005 (so với ~30300 đợt 148).
- **Per-pass:** pass 1 median 114,0 (load1 mean 7,00!); pass 2
  median 190,0 (load1 mean 6,42); pass 3 median 109,0 (load1 mean
  5,94) — attempt khởi động đã ở load1 ~7, median tick gấp đôi 148
  ngay từ pass 1. Pearson median~load1 / median~RAM: không tính
  riêng (lượt không hợp lệ; xem §6 cho tương quan gộp).
- **Wallbands:** TOÀN LUOT n=305 median=138,0; HAU FLIP+2000ms n=225
  median=165,0 — chậm hơn sau flip, ngược với 148 (phẳng quanh 60).
- **Lớp B VI PHẠM — B1 + B2:** sampler n=128, load1_max=7,23,
  RAM_min=667 MB, RAM_max=1756 MB, 0 mẫu <500 MB, 40/128 mẫu
  <1024 MB; load5 cuối 2,72; B3/B4/B5 ĐẠT. B2 ps có vòng lặp T6
  `for i in $(seq 1 20); do bash round149-t6/t7-investigate.sh
  loop$i ...` chạy suốt attempt — nhiễm tải trực tiếp, quy được
  tên (xem §6).
- **(c2): 1 seq (60, presented 15, label 14, lag +1f)**, coverage
  1/1 (tBlend=49077, log gần nhất 49100, delta +23 ms); blendTick
  hậu-flip trong ±500 ms của log: 174/174 (100,0%).
  P1 YẾU (0/1 gần run-end, p=1, n=1 <3); P3-A1 VÔ HIỆU (n=0);
  P3' 0/1 KHÔNG ĐẠT (seq 60: labelMs=47715, prev=None,
  stall_truoc=None — tick đầu sau flip, không có stall trước để đo);
  P7 ĐÚNG (tre ≥+1f: 0 entry; đối chứng toàn bộ drawSrc post:
  0/222). lag5 (b) 0 occurrence. skiplatest=1 nTick=65,
  pixel-verified 100%/100% (nhãn: 65/65 tick KHÔNG chứa
  ghost==presented).
- **Ghi nhận ngoài cộng dồn (lượt KHÔNG hợp lệ nên KHÔNG cộng):**
  occurrence (c2) +1f này khớp hướng "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH"
  nhưng không dùng làm bằng chứng cộng dồn — giống cách 148 ghi
  nhận A1/A2 (c2)=0. Số cộng dồn §5 giữ nguyên.

## 5. Attempt3-70025d3e — 20/20 pass, median 112,0 ms, B VI PHẠM nặng nhất, lag +8f

- **20/20 pass** (probe-start 20:59:09Z; pass 20 xong 21:01:36Z;
  inner-end 21:03:31Z probe_exit=0; run-attempt exit 21:03:36Z;
  poller 21:05:11Z, hết ngân sách). tickCost median **112,0 ms**
  (n=327; post-flip 109,0; p90 202,0; max 394; min 31; 11 tick ≤60,
  0 tick đúng =60). tBlend gap n=242 median 216,0 (p90 493,7;
  max 3493). BlendTick/pass=12,2. rAF/pass median 21 (16–35).
  webkit=27,2; pageErrs=[]. FLIP wallMs=51592 (chậm nhất đợt).
- **Per-pass:** pass 1 median 199,5 (load1 mean 8,97); pass 2
  median 196,0 (load1 mean 9,83); pass 3 median 114,0 (load1 mean
  10,03) — tải TĂNG DẦN trong attempt (load1 mean/pass 8,97 →
  9,83 → 10,03), median tick ~200 ms ở 2 pass đầu. Đây là attempt
  nặng nhất trong 3 (cả về load lẫn tick).
- **Wallbands:** TOÀN LUOT n=327 median=112,0; HAU FLIP+2000ms n=250
  median=109,0.
- **Lớp B VI PHẠM — B1 + B2 (nặng nhất):** sampler n=127,
  load1_max=11,10, RAM_min=1245 MB, RAM_max=2326 MB, 0 mẫu <500 MB,
  0/127 mẫu <1024 MB; load5 cuối 4,73; B3/B4/B5 ĐẠT. B2 ps có CẢ
  vòng lặp T6 thứ hai (`for i in $(seq 46 75); do bash
  round149-t6/t7-investigate.sh rel$i ...`) VÀ job render U4
  (`python3 .../server/render/src/mask_anim.py --shape ellipse ...
  --out /tmp/repo1-maskan-34941-1.mkv`) — hai nguồn nhiễm cùng lúc.
- **(c2): 0 seq** (labellag không có occurrence "dang ngo that" nào;
  P3' không có seq). **lag5 (b): 2 occurrence / 1 event** —
  seq 88/89, tBlend 67899–68184 (cách 285 ms), presented 34→36,
  label KẸT ở 27, lag max +8f (267 ms), cùng M pixel [35].
  Đây là cụm trễ thật (label đứng yên 2 tick liên tiếp trong lúc
  presented tiến) — xảy ra đúng lúc load1 ~10. Ghi nhận ngoài cộng
  dồn (lượt không hợp lệ); không dùng làm bằng chứng chống hay ủng
  hộ mô hình — nó đo tải, không đo ghost. skiplatest=1 nTick=50,
  pixel-verified 100%/100%.
- **Không cộng dồn.**

## 6. Số cộng dồn (c2) — 18 LƯỢT HỢP LỆ, KHÔNG ĐỔI + RAM/load trong lúc đo

- **P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38** — như cuối
  đợt 148. Không attempt nào đợt này hợp lệ nên tử số/mẫu số đều
  giữ nguyên. Ghi nhận ngoài cộng dồn: A2 (c2) 1 seq +1f (P1 YẾU,
  P3' KHÔNG ĐẠT, P7 ĐÚNG); A3 lag5 (b) 1 event +8f; A1/A2/A3
  skiplatest 62/65/50 tick không vi phạm thật.
- **Tải là câu chuyện của đợt này, không phải probe:** 3 attempt
  chạy dưới load1 max 6,03 / 7,23 / 11,10 (sampler 2 s) — tăng dần
  theo thứ tự attempt. Nguồn quy được tên từ ps-before/after:
  T6 `t7-investigate.sh` (2 vòng lặp: loop 1–20 suốt A1/A2,
  rel 46–75 suốt A3) + job render U4 `mask_anim.py` (A3). Lúc
  poller mở cửa load1 chỉ 1,67 — tải ập đến SAU khi cửa mở, và vòng
  retry không poll lại gate (xem §1). Median tick đi cùng tải:
  A1 (4 pass đầu, load ~1,5) median 47,0; A2 (load ~6–7) median
  138,0; A3 (load ~9–10) median 112,0 — nhưng A2 chậm hơn A3 dù
  load thấp hơn, nên tải không giải thích hết mức tick (cùng bài học
  đợt 148: baseline boot dao động; boot 70025d3e có baseline cao
  hơn d8a11644 khi có tải).
- **RAM:** A1 RAM 681–1141 MB (84/118 mẫu <1024); A2 RAM 667–1756 MB
  (40/128 mẫu <1024); A3 RAM 1245–2326 MB (0/127 mẫu <1024).
  **0 mẫu <500 MB trong cả 3 attempt (373 mẫu)** — hiện tượng RAM
  sập đợt 147 KHÔNG tái diễn trong cửa sổ đo. Balloon vẫn ghìm
  (RAM lúc chờ cửa chỉ 789–1181 MB) nhưng không sập dưới 500.
- **Burst snapshot đóng 21:08Z (sau khi poller thoát):** loadavg
  9,55/5,46/3,85, RAM avail 1776 MB, swap đã dùng 381/1023 MB —
  máy VẪN nặng sau khi T4 xong (các luồng khác tiếp tục). Snapshot
  mở cửa 20:41Z (T4 cũ): apt-get update đang chạy, hatch daemon
  299 MB RSS, T9 sampler/watcher vừa khởi động.

## 7. Bằng chứng + files

- **LIMITS này:** `docs/PHASE9_ROUND149_T4_WEBKIT_QUIET22_LIMITS.md`.
- **Script snapshot để stage (theo mẫu đợt 148), trong repo
  `apps/web/scripts/` (md5 khớp bản làm việc ở
  `hidden_files/round149-t4/`):** `poll-wait-t4-149.sh`
  (`87d38275...`), `run-attempt-149.sh` (`74cc60be...`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs` md5
  `4291e539...` — byte-identical với bản đã stage đợt 148) và
  **KHÔNG ghi đè `t4-attempt-inner.sh`** (cùng tên với bản 148; diff
  duy nhất là đổi số vòng 148→149 trong đường dẫn + kiểm file vòng
  trước — xem §2). Bản làm việc vẫn ở `hidden_files/round149-t4/`.
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-149.sh`, `run-attempt-149.sh`, `t4-attempt-inner.sh`,
  `check-classb-t4.sh`, `wait-t4-149.sh`, `run-attempt-148.sh`
  (symlink → run-attempt-149.sh, xem F-149-T4-2); tái dùng từ đợt 148:
  `vite.t4-temp.config.mjs`, `b.json`, 10 analyzer `analyze-t4-*.py`.
- **Log/evidence (hidden_files/round149-t4/, không stage):**
  `poll-t4.log` (test poll + poll #1–#9 + CUA MO + RETRY 1→2 +
  RETRY 2→3 + hết ngân sách), `poll-t4.nohup.log`,
  `chain-t4.log` (45 dòng "partial JSON đã ghi" = 5 + 20 + 20 —
  A1 có thêm 1 dòng partial cuối sau wedge; mỗi sự kiện 1 dòng,
  HẾT trùng, xem F-147-T4-2), `wait-t4-149.nohup.log`,
  `postboot-t4-149-gate0wait-1.log` (bản check-only lúc 20:42Z),
  `tree-md5.txt` (530e10a7),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}-70025d3e.json`
  (689.298 / 1.865.651 / 1.963.893 B),
  `classb-t4-attempt{1,2,3}-70025d3e.txt`,
  `load-mid-t4-attempt{1,2,3}-70025d3e.log` (118/128/127 mẫu),
  `analyze-t4-attempt{1,2,3}-70025d3e-*.txt` (tickcost/c2coverage/
  stall/labellag/lag5/skiplatest/c2drawlog/wallbands/perpass —
  p1p3p7 chạy tay cho A2, xem F-148-T4-1),
  `ps-before/after-t4-attempt{1,2,3}-70025d3e.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt{1,2,3}-70025d3e.txt`,
  `attempt-done-attempt{1,2,3}-70025d3e` (exit=3, 0, 0),
  `coverage-check-attempt{1,2,3}-70025d3e.txt` ((c2)=0, 1/1, 0),
  `run-webkit-t4-attempt{1,2,3}-70025d3e.log`,
  `vite-5187-t4-attempt{1,2,3}-70025d3e.log`,
  `burst-snapshot-2041Z.txt` (T4 cũ, lúc chờ cửa),
  `burst-snapshot-2108Z.txt` (lúc đóng),
  `median-recheck-149.txt` (tái tính độc lập §0),
  `marker-t4-attempt{1,2,3}-70025d3e`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§7); không process T4 nào còn sống lúc đóng (poller đã
  thoát exit 11 lúc 21:05:11Z, vite.lock đã nhả, :5187 chết, RAM
  avail 1570–1980 MB lúc đóng 21:06–21:08Z).
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round149-t4-quiet22.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round149-t4.done` (21:1xZ — viết SỚM để T8
  chạy O8 SAU cờ T4 theo quyết parent 148 §12.3(c) / quyết (j)).

## 8. Sai số F-149-T4-1..7

- **F-149-T4-1 — Attempt1 wedged ở pass 5 (ngay sau FLIP).** Lần
  wedge thật đầu tiên kể từ khi vá probe đợt 148 — và đường thoát
  mới đã làm đúng việc: abort-3-timeout → partial JSON 4/20 → exit
  3, không kẹt (đối chiếu 147: kẹt 108 phút ở cùng họ lỗi). Chưa rõ
  pass 5 wedged vì FLIP hay vì tải leo đúng lúc đó (load1 lúc
  inner-end 4,66 so với 1,67 lúc start). Không tự sửa probe trong
  lúc đo; ghi nhận để đợt 150 đối chiếu (nếu wedge lặp ở pass 5
  thì nghiêng về FLIP).
- **F-149-T4-2 — poll-wait gọi nhầm `run-attempt-148.sh`.** Đã vá
  lúc chạy bằng symlink (20:44Z, trước khi cửa mở); 3 attempt đều
  chạy đúng script 149 (nhãn T4-149a đúng). **Nợ 150:** sửa tên gọi
  trong poll-wait-150 (và kiểm tra tên file ở mọi chỗ gọi trước khi
  mở poller).
- **F-149-T4-3 — Cả đợt nhiễm tải từ luồng song song; vòng retry
  không poll lại gate.** T6 `t7-investigate.sh` chạy suốt cả 3
  attempt + U4 `mask_anim.py` ở A3; load lúc start A2/A3 đã 5,91 /
  6,74 nhưng poller vẫn chạy retry ngay (thiết kế đứng). Hệ quả:
  hết ngân sách mà không có lượt nào sạch. **Đề xuất cho parent:**
  hoặc poller retry phải chờ gate mở lại, hoặc các job nặng
  (investigate loop, render) tránh cửa đo của T4 — T4 không tự đổi
  luật.
- **F-149-T4-4 — FLIP chậm hẳn dưới tải:** wallMs A2 47005 ms, A3
  51592 ms (đợt 148: ~30300 ms cả 3 attempt). Flip là pha tắt
  rVFC sau pass 5; chậm 55–70% nhưng không lỗi — chỉ ghi nhận.
- **F-149-T4-5 — A3 lag5 (b) 1 event +8f (seq 88/89, label kẹt 27).**
  Cụm trễ thật dưới load1 ~10; lượt không hợp lệ nên không cộng
  dồn, không dùng làm bằng chứng mô hình. Nếu đợt 150 gặp lại
  event tương tự trong lượt HỢP LỆ thì phải xem xét lại.
- **F-149-T4-6 — Cờ T5 đến sau cửa 65 giây.** Không phải lỗi: đường
  dự phòng T4-check-only đã mở cửa đúng luật (j); cờ T5 sau đó khớp
  hoàn toàn (cùng boot, cùng dpkg 1545/221) nên postboot được xác
  nhận độc lập. Chỉ ghi lại thứ tự thời gian để khỏi nhầm là "cửa
  mở không có postboot".
- **F-149-T4-7 — Waiter 3376 của T4 cũ còn chờ đến 22:35Z.**
  Vô hại (chỉ in tóm tắt khi poller thoát); poll-t4.log là nguồn
  chính thống. Không can thiệp.

## 9. Chờ quyết parent / nợ đợt 150

- **(a) #22 VẪN MỞ — đo lại đợt 150?** Không có lượt hợp lệ đợt
  này; T4-150 đo #22 với cùng cổng tickCost ≤60 ms + probe đã vá
  (không đổi ngưỡng — xem (d)).
- **(b) F-149-T4-3: retry có nên chờ gate mở lại không?** Hoặc job
  nặng song song có nên tránh cửa đo T4 không? Parent phán — đây là
  nguyên nhân trực tiếp làm mất cả đợt.
- **(c) F-149-T4-2: sửa tên gọi run-attempt trong poll-wait-150**
  (kiểm tra tên file ở mọi chỗ gọi trước khi mở poller).
- **(d) Ngưỡng 60 ms giữ nguyên?** A2/A3 median 138,0/112,0 ms —
  xa ngưỡng đến mức câu hỏi không còn là "sát nút" như 148-A3
  (60,0 đúng ngưỡng) mà là "máy nhiễm tải". Không đề xuất đổi
  ngưỡng vì số đợt này; chỉ ghi nhận boot 70025d3e dưới tải cho
  baseline cao hơn hẳn d8a11644 lúc yên (60–66 ms).
- **(e) F-148-T4-1 + F-148-T4-6 vẫn nợ:** p1p3p7 chạy tay; các
  pwEval thô pha setup vẫn chỉ có watchdog 20 phút làm backstop.
- **(f) Thứ tự O8: cờ T4 viết SỚM (21:1xZ) — T8 chạy O8 SAU cờ T4
  đợt này**, theo quyết parent 148 §12.3(c) (quyết (j) tuân từ
  đợt 149). Chuỗi WebKit FULL PASS 6 chỉ giữ nếu O8 chạy sau cờ
  và không chồng tải lên phép đo (phép đo đã xong).
- **(g) RAM sập đợt 147:** KHÔNG tái diễn (0 mẫu <500 MB / 373 mẫu)
  — giữ nguyên quyết parent đợt 148 (đóng nợ RAM sập; giữ mở riêng
  cụm C đợt 147).
- Các nợ đứng khác giữ nguyên từ đợt 148 §10, trừ: #22 mở (thay
  #21 đã đóng); mù #68/#69? chờ T2-149; mẫu (m) giao T7-149 điều
  tra; sửa pixelate + `npm test` vào suite T10 (quyết 148);
  G1 chờ user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại.
