# PHASE9_ROUND156_T4_WEBKIT_QUIET25_LIMITS.md

**Đợt:** 156. **Luồng:** T4 — đo lượt yên WebKit #25 trên 1 boot
+ VÁ F-155-T4-1 (TEST-POLL-OK chỉ exit 7 ở poll đầu — ĐÃ KIỂM CHỨNG)
+ 2 PAGE-WEDGED liên tiếp (attempt2/attempt3).
**Ngày:** 20–21/11/2026 (lượt cron 00:35 +07 21/11 = 17:35:51Z).
**Boot đo:** 5353ed19 (ứng viên #52, btime 17:19:09Z — boot lúc mở,
KHÔNG có reboot mới trong lúc đo; reboot ứng viên #53 (boot
447f0efe, btime 18:29:43Z) xảy ra SAU khi poller thoát, lúc T4 đang
đóng sổ — xem addendum §3, không ảnh hưởng verdict #25).
**Trạng thái:
#25 KHÔNG CÓ LƯỢT HỢP LỆ — 3 attempt chạy, 0 lượt hợp lệ, ngân sách
3/3 DÙNG HẾT (poller thoát 18:13:07Z, trước hạn cắt 19:30Z).
Attempt1-5353ed19 probe 20/20, LỚP B ĐẠT 5/5, NHƯNG tickCost median
67,0 ms >60 (vượt cổng 7 ms) — retry. Attempt2 wedged sau pass
11/20, attempt3 wedged sau pass 9/20 (cả 3 fetch writePartial đều
timeout 30 s — trang ngừng đáp evaluate, môi trường sạch).
Chuỗi lượt yên hợp lệ DỪNG Ở #21 (đợt thứ tư liên tiếp không có lượt
hợp lệ mới: #22/#23/#24/#25). P3' cộng dồn KHÔNG ĐỔI: 39/41
occurrence = 39/40 distinct-seq — attempt1 có (c2) seq 259 ĐẠT
(stall 6) NHƯNG attempt không hợp lệ nên CHỈ GHI NHẬN, KHÔNG TÍNH
(câu hỏi cho parent §7(b)). Điều kiện yên GIỮ NGUYÊN theo quyết
parent (j) đợt 155 (cùng mẫu quyết (p) đợt 154). Cờ T5-156 CÓ cho
boot mới (POSTBOOT_PASS 18:00:10Z, repair-sớm-quyết-h).**

## 0. Verdict tổng

- **#25 KHÔNG CÓ LƯỢT HỢP LỆ (0 lượt hợp lệ, 3 attempt).**
  Ngân sách 3 attempt/đợt dùng **3/3** (cả 3 attempt đều ghi
  attempt-done; không attempt nào bị reboot giết). Poller thoát
  18:13:07Z vì hết ngân sách — KHÔNG phải hết hạn (hạn cắt 19:30Z
  còn 1h17m).
- **Attempt1-5353ed19 (18:02:49–18:06:31Z): probe 20/20, LỚP B
  ĐẠT 5/5** (sạch — khác attempt1 đợt 155 nhiễm tải) NHƯNG
  **tickCost median 67,0 ms >60** (p90 92,0, max 273) — vượt cổng
  7 ms. (c2)=1: seq 259 (presented 44, label 43, lag 1f), COVERED
  1/1, stall_truoc=6 → P3' ĐẠT 1/1 — **chỉ ghi nhận, KHÔNG tính
  vào cộng dồn vì attempt không hợp lệ** (xem §6 + §7(b)).
  lag≥+5f = 0. **KHÔNG dùng verdict, retry.**
- **Attempt2-5353ed19 (18:07:10–18:09:39Z): PAGE-WEDGED sau pass
  11/20** — cả 3 fetch writePartial đều TIMEOUT 30 s (tickCost
  18:08:38Z, blendTick 18:09:08Z, c2DrawLog 18:09:38Z), partial
  JSON 1.595.617 B (`partial=true`, `passesDone=11`), probe
  exit=2. Partial tickCost n=271 median 50,0 ms — chỉ ghi nhận,
  không verdict. Lớp B ĐẠT 5/5. (c2)=0.
- **Attempt3-5353ed19 (18:10:13–18:12:32Z): PAGE-WEDGED sau pass
  9/20** — cùng chữ ký (3 fetch timeout 30 s, 18:11:36–
  18:12:31Z), partial JSON 1.297.805 B (`passesDone=9`), probe
  exit=2. Partial tickCost n=219 median 54,0 ms — chỉ ghi nhận.
  Lớp B ĐẠT 5/5. (c2)=0. **Hết ngân sách → poller thoát.**
- **Poller: 32 poll thật** (1 test + 31 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại — khác
  đợt 155: 4 instance/2 boot; fix F-155-T4-1 đã kiểm chứng, xem
  §5 F-156-T4-2). RAM ≥1024: 31/32; 0 poll <500 MB. **9 poll**
  load+RAM cùng đạt — **3 mở cửa** (#29/#30/#31), **6 bị chặn**:
  #1 (blockers=6 job O8 T0 + gate0 chưa đạt), #23/#24/#25 (apt=1
  T5 repair + gate0 chưa đạt), #26/#28 (postboot_exit stale-FAIL
  — F-155-T4-4 tái diễn nhẹ, KHÔNG mất lượt vì RAM tăng lại và
  check-only #29 PASS).
- **Chuỗi lượt yên hợp lệ: DỪNG Ở #21.** Cộng dồn 21 lượt giữ
  nguyên: P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41 occurrence =
  39/40 distinct-seq**, P7 55/55. Chuỗi median tickCost 21 lượt
  giữ nguyên (39,0–60,0 ms, mean ~49,0 ms, 0 lượt vượt 60).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round156-t4.done` viết ~18:2xZ (trong hạn
  cờ ~20:00Z), CÓ NỘI DUNG.

## 1. Poller — 32 poll thật, 3 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot 5353ed19
  (17:41:14Z):** poll #1 RAM=2324 MB, load1=2,08 load5=1,55,
  blockers=3 (job O8 T0-156: clicktest-87o8 + vite :5564 +
  vite build), gate0=khong-dat (cờ T5 là của boot cũ
  12fc68a3 — round155-t5/POSTBOOT_PASS, mtime-cu; check-only
  FAIL: GST thiếu isomp4/libav + apt thiếu 11 gói, xem §3) →
  cửa đóng → **TEST-POLL-OK exit 7 đúng thiết kế** (F-156-T4-2:
  fix i==1 đã kiểm chứng — test poll lần này KHÔNG mở cửa nên
  không chạm nhánh đã vá; nhánh vá chỉ bảo vệ trường hợp test
  poll mở cửa như đợt 155). Poll này nằm trong
  `poll-test-156.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 31 poll, boot 5353ed19
  (17:41:33–18:10:12Z):** RAM ≥1024: 30/31; load1<2: 20/31;
  load5<2: 10/31; gate0: T5=6 (#26–#31), khong-dat=25;
  lock=khong 31/31; dpkg 2→795; blockers>0: 20 poll (đều là job
  O8 của T0-156, polls #1–#20); apt>0: 19 poll (apt-get của T5
  repair, polls #5–#25).
- **Giai đoạn 1 — chờ replay (poll #1–#22, 17:41–17:57Z):**
  blockers 3–6 (job O8 T0), load5 1,5–4,2, RAM 977–3321 MB
  (phần lớn ≥1024), gate0 khong-dat suốt (cờ T5 cũ + check-only
  FAIL mỗi 4 poll: #1/#5/#9/#13/#17/#21 đều CHUA DU).
  **Poll #27 (18:01:18Z) là poll duy nhất RAM <1024 trong phiên
  (977 MB)** — RAM nhúng xuống rồi tăng lại ngay.
- **Giai đoạn 2 — cờ T5 tới (poll #23–#31):** poll #23–#25
  (17:58:17–17:59:47Z): load1<2 + load5<2 + RAM≥1024 + blk=0
  NHƯNG **apt=1 (T5 repair đang chạy) + gate0 khong-dat** (cờ
  T5 chưa viết xong) → chặn. **Poll #26 (18:00:33Z): cờ T5
  PASS** (POSTBOOT_PASS 18:00:10Z, dpkg 795), RAM=1031 MB,
  load1=0,94 load5=1,62, blk=0, apt=0 — mọi điều kiện đạt TRỪ
  **postboot_exit=1 (pb_age=1, stale từ check-only #25)**
  → chặn (F-155-T4-4 tái diễn). **Poll #28 (18:02:03Z):**
  vẫn chặn bởi PB stale (pb_age=3), RAM=1195 MB.
  **Poll #29 (18:02:48Z): check-only chạy lại → PB=0 (PASS)**,
  RAM=1360 MB, load1=1,70 load5=1,69 → **CỬA MỞ, chạy
  attempt1**. Lần này F-155-T4-4 KHÔNG gây mất lượt (khác đợt
  155: RAM tăng lại 1031→1195→1360 trong 2 phút thay vì rơi).
- **Cửa mở liên tiếp:** poll #30 (18:07:10Z, RAM=2965 MB —
  balloon xả mạnh sau attempt1) → attempt2; poll #31
  (18:10:12Z, RAM=3321 MB) → attempt3. Sau attempt3 hết ngân
  sách 3/3 → poller thoát 18:13:07Z (không chờ tới hạn cắt
  19:30Z).
- **Phân rã 32 poll thật:** RAM≥1024: 31/32; RAM 500–1023:
  1/32; RAM<500: 0/32. load1<2: 20/32; load5<2: 11/32. Chỉ 9
  poll mà load + RAM cùng đạt — 3 mở cửa, 6 bị chặn (xem trên).
  gate0: T5 6 poll, khong-dat 26 poll (1 test + 25 instance-2).
  blockers>0: 21 poll (1 test + 20 instance-2 — đều job O8
  T0-156). apt>0: 19 poll (đều apt-get của T5 repair trên boot
  mới). **KHÔNG có reboot trong phiên** (boot 5353ed19 suốt,
  btime 17:19:09Z, kiểm lúc đóng 18:2xZ).
- **RAM sập KHÔNG tái diễn đợt này:** đợt 154: 74/147 poll
  <500 MB; đợt 155: 2/123 poll <500 MB + 64 phút RAM <1024 liên
  tiếp; đợt này: **0/32 poll <500 MB, chỉ 1 poll <1024 (977 MB,
  1 poll duy nhất)** — RAM mở 2324 MB, nhúng 977 MB ở #27 rồi
  vọt 3321 MB ở #31 (balloon xả). Gate A RAM ≥1024 không phải
  nguyên nhân 0 lượt hợp lệ đợt này (khác đợt 154/155).

## 2. Ba attempt — 1 vượt cổng tickCost, 2 wedged; không có JSON hợp lệ

- **Attempt1-5353ed19 (18:02:49–18:06:31Z): probe 20/20, KHÔNG
  DÙNG VERDICT (tickCost 67,0 > 60).** Vite :5187 (giữ lock
  284 s), WebKit 27.2, app boot OK, C2 draw log BẬT. 20 pass
  (wall 3131–4709 ms/pass): tickCost n=518, blendTick n=420,
  c2DrawLog n=997. **tickCost total median= 67,0 ms (p90 92,0,
  max 273, min 32)** — vượt cổng 60 ms đúng 7 ms; hậu
  flip+2000 ms median 66,0. **Lớp B: ĐẠT 5/5** (B1 load5 cuối
  ≤2,5; B2 load1 max ≤4 + ps-before/after chỉ có vite :5187 của
  chính T4; B3 không reboot; B4 pgrep -x=0, ps exact-comm=0,
  dpkg delta=0; B5 RAM min 1245 MB, 0 mẫu <500 MB, 0/109 mẫu
  <1024 MB). Sampler n=109. Per-pass: tickCost median/pass
  53,0–79,5 ms — **chỉ 4/20 pass ≤60** (pass 15: 59,5; 16: 59,0;
  19: 53,0; 20: 57,0); load1 trong attempt 1,86–2,56 (cao hơn
  lúc poll mở cửa 1,70 — tải nền tăng trong lúc đo nhưng không
  vi phạm B2); Pearson r=0,56 median~load1_mean, r=0,69
  median~RAM_mean (chỉ mô tả — load1 là trung bình 1 phút).
  **(c2)=1: seq 259 (presented 44, label 43, lag 1f)**,
  COVERED 1/1, stall_truoc=6 → P3' ĐẠT 1/1 — **chỉ ghi nhận,
  KHÔNG tính vào cộng dồn** (attempt không hợp lệ — xem §6).
  lag≥+5f = 0 occurrence; stall baseline P(stall≥2)=103/309 =
  0,333. **p1p3p7 KHÔNG chạy** (attempt đã bị loại bởi cổng
  tickCost — fail-closed; F-148-T4-1 vẫn mở ở mức cơ chế).
- **Attempt2-5353ed19 (18:07:10–18:09:39Z): PAGE-WEDGED sau
  pass 11/20 — KHÔNG TÍNH VERDICT.** 11 pass xong (wall
  3079–3757 ms/pass), rồi writePartial sau pass: tickCost
  TIMEOUT 30 s (18:08:38Z) → blendTick TIMEOUT 30 s
  (18:09:08Z) → c2DrawLog TIMEOUT 30 s (18:09:38Z) — **cả 3
  fetch đều timeout, trang wedged** → probe tự thoát sau khi
  ghi partial JSON 1.595.617 B (`partial=true`,
  `passesDone=11`, `partialReason="sau pass"`), probe exit=2.
  Partial tickCost n=271 **median 50,0 ms** (p90 80,0, max 150)
  — chỉ ghi nhận, không verdict (dữ liệu dở dang 11/20 pass).
  **Lớp B: ĐẠT 5/5** (B5 RAM min 2007 MB; load1 lúc wedge
  0,78; RAM 2536 MB — môi trường sạch, không nhiễm tải/RAM).
  (c2)=0, lag≥+5f = 0. Không có dòng crash/disconnect/Target
  trong run-webkit log — vite :5187 vẫn sống (ready 412 ms).
- **Attempt3-5353ed19 (18:10:13–18:12:32Z): PAGE-WEDGED sau
  pass 9/20 — CÙNG CHỮ KÝ.** 9 pass xong (wall 3223–3677
  ms/pass), rồi 3 fetch writePartial timeout 30 s liên tiếp
  (18:11:36–18:12:31Z) → partial JSON 1.297.805 B
  (`passesDone=9`), probe exit=2. Partial tickCost n=219
  **median 54,0 ms** — chỉ ghi nhận. **Lớp B: ĐẠT 5/5**
  (RAM min 2007 MB; load1 lúc wedge 1,13; RAM 2644 MB).
  (c2)=0. **Hết ngân sách 3/3 → poller thoát 18:13:07Z.**
- **Lưu ý trường JSON:** `passes=20` trong JSON là số pass
  MỤC TIÊU, không phải số pass đã xong — số pass thật nằm ở
  `passesDone` (11 / 9) với `partial=true` (xem F-156-T4-7).
  Analyzer chạy trên partial JSON vẫn ra số (tickCost n=271 /
  n=219) — các số này chỉ ghi nhận, không dùng làm verdict.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ

- **Boot 5353ed19 (ứng viên #52, btime 17:19:09Z):** replay
  VẮNG lúc mở (dpkg.log 2 dòng — rootfs rebuild). T5-156
  repair-sớm: marker `repaired-5353ed19`, **POSTBOOT_PASS mới
  viết 18:00:10Z (boot+41m01s; dpkg 795 dòng; cache 110 .deb,
  lists 75; postboot PASS độc lập exit 0, poll=1)**; cờ cũ lưu
  `POSTBOOT_PASS-d849728b`. Gate0=T5 từ poll #26 (18:00:33Z).
  T4 check-only: FAIL ở poll #1/#5/#9/#13/#17/#21/#25 (GST
  thiếu isomp4/libav + apt thiếu 11 gói — repair của T5 chưa
  xong), **PASS từ poll #29 (18:02:48Z, đủ 11 package)** —
  xem postboot-t4-156-gate0wait-*.log. Không poll nào cần đường
  dự phòng T4-check-only làm gate0 (cờ T5 tới kịp); đường dự
  phòng chỉ có ý nghĩa khi cờ T5 vắng.
- **KHÔNG có reboot mới trong phiên đo:** boot 5353ed19 lúc mở
  poller (17:41:33Z), lúc attempt1/2/3, và lúc đóng (18:2xZ)
  — btime 17:19:09Z không đổi. Số hiệu #52 vẫn là ỨNG VIÊN
  (T2-156 xác nhận theo đếm chặt; mù #84? nếu có giao T2).
- **ADDENDUM — REBOOT ỨNG VIÊN #53 SAU KHI POLLER THOÁT (ghi
  18:35:44Z, sau khi viết xong LIMITS + paths + cờ):** boot mới
  **447f0efe, btime 18:29:43Z** — phát hiện lúc kiểm cuối
  (18:35:44Z, uptime 6 phút), sau lần kiểm cuối trên boot cũ
  5353ed19 (~18:34Z). Reboot xảy ra **SAU khi poller thoát
  (18:13:07Z) và sau khi mọi phép đo hoàn tất** — mọi poll (32)
  và mọi attempt (3) đều trên boot 5353ed19, **verdict #25
  KHÔNG bị ảnh hưởng**. Tất cả giao phẩm (LIMITS, 2 script
  snapshot, paths file, cờ) đều nguyên vẹn sau reboot (đã kiểm
  lại md5/nội dung). Số hiệu #53 là ỨNG VIÊN; mù #85? (nếu có)
  giao T2-156 — cùng mẫu #51 đợt 155 (reboot trong lúc đóng
  sổ). POSTBOOT_PASS #53 chưa có — giao T5-157 (hướng (3) vẫn
  đứng; watcher-156 sẽ chết theo #53).

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND156_T4_WEBKIT_QUIET25_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round156-t4/`):**
  `poll-wait-t4-156.sh` (md5 `5bc2c9621de9bccf39ed190fde0d0e3d`
  — CÓ fix F-155-T4-1 (TEST-POLL-OK chỉ exit 7 khi i==1) +
  deadline 19:30Z + cờ T5 round156-t5/ + fallback round155-t5/
  + nhãn T4-156a), `run-attempt-156.sh` (md5
  `3c761fb07d73807b83e20de3d5c5fe87` — đổi số vòng/đường dẫn/
  nhãn so với 155). **KHÔNG stage lại probe**
  (`probe121t3-ghost-k7.webkit.mjs` — byte-identical với bản đã
  vá đợt 148–155, 0 lượt hợp lệ) và **KHÔNG ghi đè
  `t4-attempt-inner.sh` / `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round156-t4/` — inner có fix F-156-T4-1
  (round154-* → round156-*), theo đúng mẫu 149–155: chỉ stage
  2 script trên; fix inner theo bản làm việc sang đợt 157).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-156.sh`, `run-attempt-156.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1),
  `check-classb-t4.sh`, 10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-156.py` (thống kê §A — trích từ log gốc, không gõ tay),
  `distinct-seq-156.py` (helper cột distinct-seq — đợt này CÓ
  input mới: attempt1 seq 259, xem §6).
- **Log/evidence (hidden_files/round156-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 31 poll thật + CUA YEN MO
  ×3 + het-ngan-sach), `poll-test-156.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup1.log`,
  `chain-t4.log`, `postboot-t4-156-gate0wait-*.log` (check-only
  mỗi 4 poll: #1/#5/#9/#13/#17/#21/#25 FAIL, #29 PASS),
  `blockers-ps-*.txt` / `blockers-list-*.txt` (job O8 T0-156,
  polls #1–#20), `appendix-156.txt` (output stats-156.py),
  `preview-b-f3-flip-webkit-t4-attempt1-5353ed19.json`
  (2.876.504 B, 20/20) + `attempt2-*.json` (1.595.617 B,
  partial, passesDone=11) + `attempt3-*.json` (1.297.805 B,
  partial, passesDone=9) + `run-webkit-t4-attempt*.log` +
  `load-mid-t4-attempt*.log` + `ps-before/after-t4-attempt*.txt`
  + `classb-t4-attempt*-5353ed19.txt` (cả 3 đều LOP-B-TONG DAT
  5/5) + `analyze-t4-attempt*-5353ed19-*.txt` (9 file/attempt)
  + `coverage-check-attempt*-5353ed19.txt` +
  `attempt-done-attempt*-5353ed19` (3 file: exit 0 / 2 / 2).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng (poller
  đã thoát 18:13:07Z vì hết ngân sách; vite :5187 curl 000 sau
  kill; lock trống).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round156-t4-quiet25.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round156-t4.done` (~18:2xZ — trong hạn
  cờ ~20:00Z, CÓ NỘI DUNG).

## 5. Sai số F-156-T4-1..7 (+ nợ cũ)

- **F-156-T4-1 — MẪU 'round154-*' TRONG t4-attempt-inner.sh LÀ
  TỒN KHO (phát hiện + vá trong phiên, chưa stage).** Dòng kiểm
  "file round khác sửa trong cửa sổ đo" dùng
  `-name 'round154-*'` — copy-forward từ đợt 154 không đổi số
  đợt → kiểm tra nhầm thư mục đợt cũ, không phát hiện được file
  đợt hiện tại bị luồng khác sửa trong cửa sổ attempt. Vá: đổi
  thành `round156-*` (+ chú thích) trong bản làm việc
  `hidden_files/round156-t4/t4-attempt-inner.sh` (md5 `e2e0f32b...`).
  Theo mẫu 149–155 inner KHÔNG stage vào repo nên fix này chưa
  vào `apps/web/scripts/` — sẽ theo bản làm việc sang đợt 157.
  Nợ: T10 kiểm tra xem còn mẫu tên-đợt-cũ tồn kho nào trong
  script luồng khác không.
- **F-156-T4-2 — F-155-T4-1 ĐÃ VÁ + KIỂM CHỨNG, ĐÓNG.**
  TEST-POLL-OK exit 7 chỉ khi `i==1` (poll-wait đã stage là bản
  ĐÃ VÁ). Đợt này: test poll #1 cửa đóng → exit 7 đúng thiết kế;
  poller thật chạy 1 instance duy nhất từ 17:41:33Z tới
  18:13:07Z, không chết/khởi động lại. Nhánh vá chưa chạm thực
  tế đợt này (test poll không mở cửa) — nhưng logic đã đúng:
  retry-wait sau attempt không bao giờ exit 7 nữa.
- **F-156-T4-3 — PAGE-WEDGED ×2 LIÊN TIẾP (attempt2 sau pass
  11/20, attempt3 sau pass 9/20).** Chữ ký giống hệt nhau: cả 3
  fetch writePartial (tickCost, blendTick, c2DrawLog) timeout
  30 s mỗi cái → probe tự thoát sau khi ghi partial JSON
  (exit=2). Không có dòng crash/disconnect/Target trong log;
  vite :5187 vẫn sống; lớp B ĐẠT 5/5 cả hai attempt; load lúc
  wedge 0,78–1,13, RAM 2536–2644 MB — **không phải nhiễm
  tải/RAM**. Trang ngừng đáp `evaluate()` của Playwright giữa
  chừng; attempt1 cùng boot/cùng vite chạy 20/20 bình thường
  nên wedge là gián đoạn, không phải hỏng hẳn. Câu hỏi cho
  T10/parent (§7(c)): 2 wedge này có tính là "kẹt" cho chuỗi
  "P3 không kẹt" (T8) không? T4 không tự quyết — chuỗi T8 giữ
  nguyên cho tới khi parent phán. Nợ điều tra: nguyên nhân page
  ngừng đáp evaluate (WebKit process? rVFC? — cần log sâu hơn
  ở probe khi tái diễn).
- **F-156-T4-4 — F-155-T4-4 TÁI DIỄN NHẸ, KHÔNG GÂY MẤT LƯỢT.**
  Poll #26/#28 bị chặn bởi `postboot_exit=1` stale (check-only
  #25 chạy 17:59:47Z, trước khi repair của T5 xong 18:00:10Z,
  FAIL apt thiếu 11 gói; check-only chỉ chạy mỗi 4 poll nên kết
  quả stale tới 3 poll). Khác đợt 155: RAM tăng lại
  (1031→1195→1360 MB) và check-only #29 PASS kịp → cửa mở ở
  #29, không mất lượt. Câu hỏi cadence check-only (đợt 155
  §7(e)) VẪN MỞ — chờ parent/T10 phán (có nên chạy check-only
  mỗi poll khi RAM đang ≥1024 không).
- **F-156-T4-5 — ATTEMPT1 tickCost 67,0 ms: VƯỢT CỔNG 7 ms DÙ
  LỚP B SẠCH.** Per-pass: load1 trong attempt 1,86–2,56 (cao
  hơn lúc poll mở cửa 1,70) — tải nền tăng trong lúc đo nhưng
  không vi phạm B2 (load1 ≤4) và B1 (load5 cuối ≤2,5). Chỉ 4/20
  pass ≤60 ms; các pass đầu (1–14) 60–79,5 ms, các pass cuối
  (15/16/19/20) 53–59,5 ms — tickCost hạ dần theo thời gian
  (mẫu giống đợt 154/155: median/pass giảm khi load hạ). Ghi để
  parent xem: có nên bàn lại B2 (load1 ≤4 có quá lỏng khi cổng
  tickCost là 60 ms) hay giữ nguyên — T4 KHÔNG đề xuất đổi
  (quyết (j) đợt 155 giữ nguyên điều kiện).
- **F-156-T4-6 — LỆNH KIỂM CURL TAY CỦA T4 IN "000000" (sai số
  in log tay, KHÔNG phải script).** Lệnh kiểm vite :5187 lúc
  đóng dùng mẫu `$(curl ... || echo 000)` chưa vá → in "000"
  (curl) + "000" (echo) = "000000". Script đã vá F-155-T4-3
  (inner in đúng "000"). Không ảnh hưởng đo; ghi để tránh ai
  đọc log tay hiểu nhầm là bug script tái diễn.
- **F-156-T4-7 — TRƯỜNG `passes=20` TRONG JSON LÀ SỐ MỤC TIÊU,
  KHÔNG PHẢI SỐ PASS ĐÃ XONG.** JSON partial attempt2/3 ghi
  `passes=20` nhưng chỉ xong 11/9 pass — số thật nằm ở
  `passesDone` (11 / 9) với `partial=true`. Ai đọc JSON thô mà
  lấy `passes` sẽ đếm sai. T4 đã dùng `passesDone` + run-webkit
  log làm số chính thức. Nợ: probe nên ghi rõ hơn (hoặc analyzer
  cảnh báo khi `partial=true`) — giao T10 xem có cần vá probe
  không (probe byte-identical từ đợt 148, không tự sửa).
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-156 cho boot mới xuất hiện dạng PASS (đủ boot_id); trên
  boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152 vẫn đứng;
  chờ lượt sau có cờ chính non-PASS. Không đánh ĐÓNG vội.
- **F-148-T4-1 — KHÔNG ÁP DỤNG đợt này (0 lượt hợp lệ).** p1p3p7
  không có JSON hợp lệ để chạy (attempt1 vượt cổng tickCost,
  attempt2/3 wedged partial). Nợ đứng vẫn còn ở mức cơ chế
  (script chưa tự gọi p1p3p7); mỗi đợt có attempt hợp lệ T4 phải
  chạy tay và ghi rõ.
- **F-150-T4-5 — ĐÓNG (giữ).** Test poll ghi riêng
  `poll-test-156.log` (exit 7); thống kê §A đã hợp nhất 1 poll
  test-log + 31 poll poll-t4.log = 32 poll thật, không cần tách
  tay.

## 6. P3' cộng dồn (KHÔNG ĐỔI) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 156 (KHÔNG ĐỔI): P1 69/69, P2 60/60,
  P3-A1 61/69, P3' 39/41 occurrence = 39/40 distinct-seq, P7
  55/55** (21 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 154 §6: "21 lượt hợp lệ").
- **Ghi nhận (KHÔNG tính): attempt1-5353ed19 có (c2) seq 259
  ĐẠT** — helper distinct-seq-156.py chạy trên stall analyzer
  output: `distinct-seq P3': 1/1 DAT — seq DAT: [259]; stall
  theo seq: {259: 6}`. Seq 259 KHÔNG thấy trong LIMITS T4 đợt
  151–155 (grep không ra) nên nếu tính thì cộng dồn thành
  **40/42 occurrence = 40/41 distinct-seq** (helper in
  "cong don moi: 40/41"). T4 KHÔNG tự cộng — đây là lần đầu
  tiên một attempt KHÔNG hợp lệ (không bị giết, không nhiễm
  tải — chỉ vượt cổng tickCost 7 ms) sinh ra (c2) seq ĐẠT; các
  đợt trước attempt không hợp lệ đều (c2)=0 nên quy tắc chưa
  từng được thử. **Câu hỏi cho parent/T10 (§7(b)): có tính
  (c2) từ attempt gần-đạt (probe 20/20, lớp B 5/5, chỉ tickCost
  vượt) vào P3' không, hay P3' chỉ tính trên lượt hợp lệ?**
  T4 giữ số chính thức KHÔNG ĐỔI cho tới khi parent phán.
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại. Seq 259 (lag 1f,
  stall_truoc=6, không đóng băng dài trước đó) KHÔNG phải mẫu
  365-style (catch-up lag 3–6f sau đóng băng) — là (c2) thường
  với stall trước đó đủ dài.
- Chuỗi median tickCost 21 lượt giữ nguyên (39,0–60,0 ms, mean
  ~49,0 ms, 0 lượt vượt 60). Attempt1 median 67,0 ms đứng ngoài
  chuỗi (không phải lượt hợp lệ).

## 7. Chờ quyết parent / nợ đợt 157

- **(a) #25 KHÔNG CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ dừng
  ở #21, đợt thứ tư liên tiếp không có lượt hợp lệ mới (#22/#23/
  #24/#25).** Đợt này khác đợt 154/155: RAM KHÔNG sập (0 poll
  <500 MB), cửa mở 3 lần, attempt1 chạy đủ 20/20 lớp B sạch —
  chỉ thiếu 7 ms tickCost; 2 attempt còn lại wedged. Đợt 157 đo
  tiếp với cùng cổng tickCost ≤60 ms + probe đã vá (không đổi
  ngưỡng — quyết (j) đợt 155 giữ nguyên). Câu hỏi cho parent/
  T10: chuỗi #19/#20/#21 có tính là "đứt" không, hay chỉ là
  "gián đoạn do môi trường" (đợt 156: 1 attempt gần-đạt + 2
  wedge — không phải lượt đo thất bại vì điều kiện)?
- **(b) (c2) seq 259 ĐẠT từ attempt1 không hợp lệ: CÓ TÍNH VÀO
  P3' KHÔNG?** Số chính thức giữ 39/41 = 39/40; nếu tính thì
  40/42 = 40/41 (giả định 259 là seq mới). T4 không tự cộng —
  chờ parent/T10 phán (quy tắc này sẽ áp dụng cho mọi attempt
  gần-đạt sau này).
- **(c) PAGE-WEDGED ×2 (F-156-T4-3): có tính là "kẹt" cho chuỗi
  "P3 không kẹt" (T8) không?** T4 ghi dữ kiện: cùng chữ ký (3
  fetch timeout 30 s), môi trường sạch, không crash. Chuỗi T8
  giữ nguyên cho tới khi parent phán; T4 không tự đếm wedge
  vào chuỗi harness.
- **(d) F-155-T4-4 cadence check-only VẪN MỞ (xem §5
  F-156-T4-4):** có nên chạy check-only mỗi poll khi RAM đang
  ≥1024 (hoặc khi cờ T5 vừa PASS) để không lỡ cửa sổ RAM ngắn?
  Đợt này không mất lượt nhờ RAM tăng lại — nhưng cửa sổ 2
  poll (#26/#28) vẫn bị chặn oan. T4 không tự đổi — chờ parent/
  T10 phán.
- **(e) F-156-T4-5 (attempt1 tickCost 67 ms, lớp B sạch):** có
  nên bàn lại B2 (load1 ≤4) khi cổng tickCost là 60 ms không?
  T4 không đề xuất đổi — chỉ ghi để parent xem.
- **(f) F-156-T4-1 (mẫu tên-đợt-cũ tồn kho):** giao T10 grep
  toàn repo scripts xem còn mẫu tương tự không (như F-155-T4-3
  đợt 155 §7(f)).
- **(g) Các nợ đứng khác giữ nguyên từ đợt 155 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#82?/#83? giao T2 (+ mù #84?
  nếu có, đi kèm #52); birefnet 0 thử (lần thứ 10 liên tiếp);
  u2net là fallback chính thức; run 155 kết cục thuộc T7-156;
  reboot #52 (ứng viên, boot 5353ed19) chờ T2 xác nhận số hiệu.
- **(h) Đối chiếu waiter/O8 (T8):** T4 gate mở lần đầu
  18:02:49Z; 3 attempt chạy nhưng 0 lượt hợp lệ → từ phía T4,
  **GATE cho chuỗi FULL PASS KHÔNG ĐẠT** (không có lượt yên hợp
  lệ để O8 chạy sau — cùng mẫu quyết (f) đợt 155). T8 tự quyết
  thủ tục (i) sau waiter hết hạn; T4 chỉ ghi dữ kiện, không tự
  kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-156.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-156.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-20T17:41:14Z - 2026-11-20T17:41:14Z, boot=5353ed19
   RAM min=2324 max=2324 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 1/1 blockers>0: 1 apt>0: 0
   gate0: khong-dat=1
   lock: khong=1
   dpkg 2->2
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 31 poll, 2026-11-20T17:41:33Z - 2026-11-20T18:10:12Z, boot=5353ed19
   RAM min=977 max=3321 >=1024: 30/31 500-1023: 1/31 <500: 0/31
   load1<2: 20/31 load5<2: 10/31 blockers>0: 20 apt>0: 19
   gate0: T5=6, khong-dat=25
   lock: khong=31
   dpkg 2->795
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 32
-- RAM toan phien: min=977 max=3321 >=1024: 31/32 <500: 0/32
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 9/32
   gan-mo? #1 2026-11-20T17:41:33Z boot=5353ed19 RAM=1427 L1=1.68 L5=1.50 blk=6 apt=0 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #23 2026-11-20T17:58:17Z boot=5353ed19 RAM=1365 L1=0.88 L5=1.87 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #24 2026-11-20T17:59:02Z boot=5353ed19 RAM=1301 L1=1.59 L5=1.92 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #25 2026-11-20T17:59:47Z boot=5353ed19 RAM=1169 L1=0.94 L5=1.71 blk=0 apt=1 gate0=khong-dat lock=khong t5=cu(mtime-cu)
   gan-mo? #26 2026-11-20T18:00:33Z boot=5353ed19 RAM=1031 L1=0.94 L5=1.62 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #28 2026-11-20T18:02:03Z boot=5353ed19 RAM=1195 L1=1.67 L5=1.69 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #29 2026-11-20T18:02:48Z boot=5353ed19 RAM=1360 L1=1.70 L5=1.69 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #30 2026-11-20T18:07:10Z boot=5353ed19 RAM=2965 L1=1.21 L5=1.43 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
   gan-mo? #31 2026-11-20T18:10:12Z boot=5353ed19 RAM=3321 L1=0.89 L5=1.49 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot 5353ed19: 32 poll; RAM>=1024 lan cuoi: 2026-11-20T18:10:12Z #31; RAM<1024 lan dau: 2026-11-20T18:01:18Z #27 RAM=977
-- cong don P3' (KHONG DOI, 21 luot hop le): P1 69/69 P2 60/60 P3-A1 61/69 P3' 39/41 occ = 39/40 distinct-seq P7 55/55
-- chuoi median 21 luot (giu nguyen): n=21 mean=49,0 min=39,0 max=60,0 vuot-60: 0
```
