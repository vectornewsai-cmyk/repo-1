# PHASE9_ROUND176_T0_BOOT_O8_LIMITS.md

Đợt 176 — T0 (boot survey + xác minh reboot mới + O8). Mở ~05:41Z, đóng ~05:50Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #89 — XÁC NHẬN 9 nguồn**: boot_id `15618ce8-2ec6-477e-b0b0-2f7e7c3ba4da`
  (khác #88 `9131fbc6`); btime **05:26:26Z** (epoch 1795411586; uptime bracket ×3 khớp cùng giây,
  boot_est 1795411586.078/.074/.070 = btime +0,078 s; /proc/1 start_ticks 1096 = btime +10,96 s,
  stat mtime 05:26:37.030Z = btime +11,030 s; journal idx 0 duy nhất, first 05:26:37.449Z =
  btime +11,449 s; wtmp begins 05:26:37Z; last reboot 05:26 still running; Cloudflare ×2
  (CF nhanh hơn local ~1,95 s / ~1,51 s — cùng chiều các đợt trước); DB: run 176 boot_gen MỚI
  82890fac, 0 requeue trong cửa hẹp lẫn cửa rộng #89; marker mtime không đổi).
- Gap #88→#89 = **1.329 s (22m09s) — NGẮN bất thường so với mẫu ~7,1–7,5 nghìn giây (~2 giờ)**
  của các gap gần đây (#85→#86 7.321 s, #86→#87 7.468 s, #87→#88 7.092 s — dấu chấm là
  phân cách hàng nghìn kiểu Việt Nam, tức 7.321 giây chứ không phải ~7 giây). #89 xảy ra
  SAU khi T10-175 đóng sổ (~05:1xZ) và TRƯỚC khi đợt 176 mở (05:35:51Z) — trong khoảng mù
  giữa hai đợt.
- **#87 + #88 XÁC NHẬN 9 nguồn (nợ đợt 175)**: #87 boot `ca31fac1`, btime 03:06:05Z,
  gap #86→#87 = **7.468 s** — KHỚP T7-175; #88 boot `9131fbc6`, btime 05:04:17Z,
  gap #87→#88 = **7.092 s** — KHỚP T7-175. Xác minh theo chuẩn đứng: bản ghi 9 nguồn tươi của
  T7-175 (cả hai) + T2-175 (6 nguồn #87) + DB đọc tươi (chuỗi boot_gen
  0762915d → 7f2165b9 → 1f908a9c; requeue eid 10282 +39,864 s / eid 10309 +33,431 s) +
  bằng chứng phụ độc lập (watcher-175 poll cuối 03:06:12Z boot=70b7f7ee = btime87 +7 s;
  T9-175 sampler dòng ca31fac1 đầu 03:07:00Z; T4-175 poll-wait log ghi boot ca31fac1 đầy đủ).
  Hạn chế: journal/wtmp hiện tại chỉ còn boot #89 (xem F-176-T0-2).
- **Marker sống qua 41 reboot (#49–#89)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (38 qua #86 + #87 + #88 + #89).
- **Run 175 SUCCEEDED (DB đọc tươi ~05:41Z — kết cục thuộc T7-176)**: finished 05:24:21Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen 1f908a9c (#88); wall sched→finished
  10.110 s (hạn ngân sách 05:35:51Z — finished TRƯỚC hạn 690 s); succeeded event eid 10315
  05:24:21.712Z; đúng 8 event, đúng 2 lần viết lại (#87 + #88), không timeout.
  **Claimed_at DB hiện tại 05:22:53Z — KHÁC T7-175 ghi 02:35:52Z** (không đổi qua 8 lần đọc
  tới ~05:05Z) → claimed→finished = **88 s ≥ 60 s** (xem F-176-T0-3 — ứng viên ca ≥60 s thứ
  chín theo định nghĩa thống nhất; phân loại cuối thuộc T7-176 + parent 176).
  Run 176 2b4a5671: sched = started 05:35:51Z — **jitter 0 s** (chuỗi jitter 0 s tiếp tục từ
  run 175); claimed 05:35:51Z, boot_gen 82890fac (#89) — RUNNING lúc T0 đọc.
- **(m) #88 — ĐẾM CUỐI CỬA HẸP (phân loại cuối thuộc T2-176 + parent 176)**:
  requeue eid 10309 `requeued_after_restart` **btime88 +33,431 s**, NẰM TRONG band [33; 49,8] —
  **cách biên DƯỚI 0,431 s (sát biên nhất từng ghi ở biên dưới — sát hơn #81 0,477 s)**,
  cách biên trên 16,369 s; run 175 SỐNG tại btime88; 1 requeue duy nhất cửa hẹp lẫn cửa rộng
  (cửa hẹp đã khép hẳn lúc T0 đọc). Caveat phân số: offset thật ∈ (32,431 s, 33,431 s] —
  nếu boot_est lệch +0,5 s trở lên, offset thật DƯỚI 33 s (xem F-176-T0-4).
- **(m) #89 — KHÔNG CÓ ỨNG VIÊN**: 0 requeue cửa hẹp lẫn cửa rộng (cửa rộng khép 05:41:26Z,
  trước lúc T0 đọc); 0 run sống tại btime89 (run 175 finish trước #89 125 s; run 176 dispatch
  sau #89 565 s). Phân loại cuối thuộc T2-176 + parent 176.
- **O8 trên boot #89 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (05:43:33–05:47:10Z):**
  WebKit attempt1 pid27289 exit=0, **21/21 PASS** (S1 PASS 05:43:59.039Z, Playwright mouse click
  lần 2), JSON 21 results, 21 ok=true, md5 `c5cb621a…`, bản copy khớp JSON stamped theo lượt.
  WebKit attempt2 pid47727 exit=0, **21/21 PASS** (S1 PASS 05:45:09.818Z), JSON 21 results,
  21 ok=true, md5 `943e3caf…`, bản copy khớp JSON stamped theo lượt.
  Chromium pid53755 exit=0, **21/21 PASS** (S1 PASS 05:46:35.153Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `16671297…`, bản copy khớp JSON stamped theo lượt.
  Đếm lại từ JSON gốc bằng python (xem NOTES.md). **Cả ba bộ đều chạy SAU POSTBOOT_PASS #89
  (05:42:19Z)** — cờ replay-đầy-đủ, poll=0, không repair tay (cùng mẫu #86).
- **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z** (T5-176, mode replay-day-du, poll=0, dpkg 1.545 dòng)
  — viết TRƯỚC khi O8 bắt đầu 74 s. Chi tiết thuộc T5-176.
- DR 06:00Z: 0 dòng lúc T0 kiểm ~05:42Z — NHƯNG slot CHƯA TỚI GIỜ (kiểm trước giờ hẹn 18 phút);
  0 dòng là đúng vì slot chưa xảy ra, KHÔNG kết luận được. Kết luận cuối thuộc T7-176.
- X11: /tmp/.X11-unix TRỐNG lúc O8 đóng (05:47Z), 0 Xvfb — NHƯNG 3 socket X193/X194/X195
  (cùng bộ ba đợt 174/175, mtime 05:50Z) lại xuất hiện lúc kiểm cuối 05:50:49Z, sau khi O8
  xong; 0 Xvfb, 0 process sót của T0. Giao T8-176 dọn (mẫu F-175-T1-1, lần thứ 5 liên tiếp).
  Boot lúc T0 đóng vẫn 15618ce8 (kiểm cuối 05:50:49Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-176-T0-*)

- **F-176-T0-1 — Gap #88→#89 = 1.329 s, NGẮN bất thường so với mẫu ~7,1–7,5 nghìn giây
  (~2 giờ).** Bốn gap gần nhất trước đó đều ~7,1–7,5 nghìn giây (#84→#85 7.101 s, #85→#86
  7.321 s, #86→#87 7.468 s, #87→#88 7.092 s); gap mới 1.329 s chỉ bằng ~18,3% trung bình
  mẫu (7.245,5 s), ngắn hơn ~5,45 lần. Btime #89 được xác minh 9 nguồn độc lập (uptime
  bracket ×3 chênh nhau <0,01 s; /proc/1 +10,96 s; journal first +11,449 s — cùng họ các
  đợt trước), nên gap 1.329 s là số đo thật, không phải lỗi đọc. T0 không suy đoán nguyên
  nhân (host-side hay lịch reboot đổi); giao T2-176/T5-176 đối chiếu (FULL/INSIDE #89,
  replay #89). Hệ quả trực tiếp: #88 sống 1.329 s (22m09s) thay vì ~7,1–7,5 nghìn giây
  (~2 giờ) — cửa sổ quan sát trên #88 NGẮN hơn hẳn.
- **F-176-T0-2 — Xác minh #87/#88: 2/9 nguồn không đọc lại trực tiếp được.** Journal và wtmp
  hiện tại chỉ còn boot #89 (reset theo reboot — cùng mẫu #81–#88); boot_id #87/#88 không đọc
  lại trực tiếp từ /proc hay journal. Xác minh dựa vào: bản ghi 9 nguồn tươi của T7-175 (cả
  hai, phát hiện trong 44–45 s sau btime) + T2-175 xác minh trực tiếp 6 nguồn #87 + DB đọc
  tươi (chuỗi boot_gen + requeue eid 10282/10309 khớp từng số) + bằng chứng phụ độc lập
  (watcher-175 overlap +7 s; T9-175 sampler; T4-175 poll-wait log). **0 dòng 9131fbc6 trong
  log T9-175** (sampler dừng ghi 04:51:02Z, trước #88 795 s — ghi rõ, không giấu). T0 ghi rõ
  phần nào là đọc tươi, phần nào là thừa hưởng — không giấu. Cùng tiền lệ F-175-T0-2 (#85).
- **F-176-T0-3 — claimed_at run 175 DB hiện tại khác ghi nhận của T7-175.** DB đọc tươi lúc
  ~05:41Z: worker_claimed_at_utc = 1795411373 (05:22:53Z) → claimed→finished 88 s.
  T7-175 ghi claimed_at = 1795401352 (02:35:52Z, KHÔNG đổi qua 8 lần đọc tới ~05:05Z).
  Có thể claimed_at được cập nhật khi worker claim pha cuối / khi finish
  (05:05Z–05:24:21Z); T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế.
  Giao T7-176 đối chiếu. Hệ quả nếu 88 s là số đúng: run 175 LÀ ca claimed→finished ≥60 s
  thứ chín (theo định nghĩa thống nhất parent đã chọn ở quyết (p) đợt 174 — run 172 = ca thứ
  8); T0 không phán số thứ tự ca. Cùng mẫu run 171/172/173/174 (claimed đổi lúc cuối).
- **F-176-T0-4 — Caveat phân số cho (m) #88 (cùng họ caveat #71/#81/#85/#86).** Btime #88 là
  số nguyên từ /proc/stat (quy ước đứng). Boot thật ∈ [btime, btime+1 s) → offset requeue
  thật ∈ (32,431 s, 33,431 s]. Nếu dùng boot_est phân số lệch +0,5 s trở lên thì offset thật
  DƯỚI 33 s → verdict DƯƠNG KHÔNG bền với neo phân số (ngược hướng #86, nơi phân số làm
  offset nhỏ đi nhưng vẫn trong dải). Caveat này KHÔNG lật verdict theo quy ước đứng
  (btime nguyên), nhưng làm (m) #88 nhạy với quy ước estimator hơn #87 (margin 6,864 s).
  Phân loại cuối thuộc T2-176 + parent 176.
- **F-176-T0-5 — Tên thread lock vite ĐÃ SỬA thành t0-round176 (F-175-T0-5 ĐÃ HẾT).**
  Driver O8-176 adapt bằng sed từ 175t0, lock giữ dưới tên đúng (owner_pid 27202, ticket
  1-1795412613266597698, giữ 217 s, nhả sạch 05:47:10Z). T4-176 poll log ghi nhận đúng blocker
  này (pid 27202, port 5560, poll #2–#5). Không ảnh hưởng verdict O8.
- **F-176-T0-6 — O8 chồng pha (a) poll của T4-176, KHÔNG chồng attempt.** T4-176 poller bắt
  đầu 05:43:26Z (poll #1, 7 s TRƯỚC khi O8 acquire lock); poll #1–#5 (tới 05:46:28Z) đều
  poll, gate0=T5, 0 attempt trong suốt O8; vite lock của T0 là blocker trong poll #2–#5, đã
  nhả trước poll #6 (05:47:14Z lock=không). T0 KHÔNG chạy script nặng / KHÔNG probe dpkg
  trong cửa sổ attempt (T4 chưa vào attempt; quy tắc đứng sau vi phạm F-174-T2-5/F-175-T4-2
  được tuân thủ). Load1 trong cửa sổ O8 theo poll log T4: 6,97–10,16 (poll #2–#5) — thuộc
  T9-176 quy B2, T0 chỉ ghi nhận.
- **F-176-T0-7 — Cloudflare nhanh hơn local ~1,5–2 s (lớn hơn mẫu ~1 s).** Try1 CF − local
  ≈ +1,95 s; try2 ≈ +1,51 s (CF Date chỉ chính xác tới giây). Các đợt trước CF nhanh hơn
  ~0,9–1 s. Chênh lệch vẫn trong ~2 s, đồng hồ boot mới vẫn giờ thật; T0 ghi số đo thô,
  không hiệu chỉnh. Giao T5/T7-176 đối chiếu nếu chênh lệch tăng tiếp.
- **F-176-T0-8 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #89 thuộc T5-176
  (T0 chỉ đọc trạng thái + mốc thời gian); (m) #88/#89 + INSIDE #88/#89 phân loại cuối thuộc
  T2-176 + parent; kết cục run 175 thuộc T7-176; lượt yên #45 (T4-176); harness + O8 bộ thứ
  hai (T8-176); #87/#88/#89 có giết holder không + prune lần 51 (T6-176); headroom + ENOSPC
  + balloon (T9-176).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #88/#89 phân loại cuối (T2-176 + parent); INSIDE #88/#89 (T2-176; FULL134/FULL135);
  kết cục run 175 (T7-176; F-176-T0-3 claimed_at); DR 06:00Z kết luận cuối (T7-176);
  POSTBOOT_PASS #89 chi tiết (T5-176); lượt yên #45 (T4-176); harness + O8 bộ thứ hai
  (T8-176); #87/#88/#89 có giết holder không + prune lần 51 (T6-176); headroom + ENOSPC +
  balloon (T9-176).
- Không kiểm lại dải FULL125–FULL134; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #89; không kiểm lại nguyên nhân gap 1.329 s (xem F-176-T0-1).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t0/appendix176.py` + `appendix176.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t0/boot-survey-176t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t0/o8-driver-176t0.sh` +
  `o8-176t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-verify-176t0.txt`
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round176-t0/o8-s1-probe-176t0.mjs` +
  `eperm-retry.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
