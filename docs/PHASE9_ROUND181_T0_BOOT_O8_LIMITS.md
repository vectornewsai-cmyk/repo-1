# PHASE9_ROUND181_T0_BOOT_O8_LIMITS.md

Đợt 181 — T0 (boot survey + xác minh reboot mới + O8). Mở ~23:54Z 23/11, đóng ~00:22Z 24/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #98 — XÁC NHẬN 9 nguồn**: boot_id `e62eef3f-9a53-4d67-8a8b-7077ee917156`
  (khác #97 `9e440707`); btime **23:12:23Z** (epoch 1795475543; uptime bracket ×3 khớp cùng giây,
  boot_est 1795475543.776/.777/.773 = btime +0,77 s; /proc/1 start_ticks 1106 = btime +11,06 s,
  stat mtime 23:12:34.842Z = btime +11,842 s; journal idx 0 duy nhất, first 23:12:35Z =
  btime +12 s; wtmp begins 23:12:35Z; last reboot 23:12 still running; Cloudflare ×4
  (CF nhanh hơn local +0,457…+1,134 s — cùng chiều các đợt trước); DB: run 180/181 boot_gen MỚI
  473f9460, requeue #98 = 1 (xem dưới); marker mtime không đổi). T7-180 xác minh 9 nguồn trong
  ~40 s: KHỚP T0-181 từng số qua đối chiếu (xem dưới).
- Gap #97→#98 = **576 s (9m36s) — NGẮN BẤT THƯỜNG** (lần đầu gap <1.000 s trong chuỗi #93–#98;
  gap #96→#97 = 6.111 s; gap #95→#96 = 7.834 s). #98 xảy ra TRONG phiên đợt 180 (23:12:23Z),
  TRƯỚC khi đợt 181 mở (23:35:51Z); T7-180 phát hiện trong ~40 s. Nguyên nhân gap ngắn
  CHƯA XÁC ĐỊNH — không tìm thấy dấu hiệu host-side trong log truy cập được (xem F-181-T0-4).
- **#96/#97 — ĐỐI CHIẾU (T7-180 xác minh 9 nguồn trong phiên; xem F-181-T0-1)**: #96 boot
  `8d2a69df`, btime 21:20:56Z, gap 7.834 s (T7 xác minh trong ~47 s; T4/T8/T9 xác nhận độc lập
  btime + gap); #97 boot `9e440707`, btime 23:02:47Z, gap 6.111 s (T7 xác minh trong ~42 s;
  watcher-180 poll cuối 23:03:16Z boot 8d2a69df xác nhận độc lập — xem F-181-T0-2).
- **Marker sống qua 50 reboot (#49–#98)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (47 qua #95 + #96/#97/#98).
- **Run 180 TIMEOUT (DB đọc tươi ~23:58Z — kết cục thuộc T7-181)**: finished 23:39:30Z,
  status `timeout`, timed_out true, attempt 1, boot_gen 473f9460 (#98); SAU hạn ngân sách
  23:35:51Z **219 s** (margin −219 s — lớn hơn nhiều run 179: −28 s; run 178: −38 s);
  timeout event eid 10557 23:39:30.758Z; tổng 11 event (10 tới lúc T7-180 đóng + timeout);
  viết lại ×3 tại #96/#97/#98. **claimed_at ĐÃ ĐỔI sau khi T7-180 đóng cờ** (T7 ghi claimed
  20:36:19Z không đổi tới 23:34Z; DB hiện tại claimed 23:38:04Z) → **claimed→finished = 86 s**
  (dùng claimed hiện tại). Run 181 c5bcb54f (sched 23:35:51Z): started 23:39:30Z
  (= run 180 finished), **jitter +219 s**, RUNNING lúc đọc, boot_gen 473f9460 (#98).
- **(m) #96/#97/#98 — KHỚP T7-180 (phân loại cuối thuộc T2-181 + parent 181)**: truy vấn
  requeued_after_restart [21:20:56Z, 23:27:23Z] mọi job = ĐÚNG 3 dòng, tất cả run 180;
  #96 eid 10523 **+41,129 s**, #97 eid 10547 **+39,441 s**, #98 eid 10550 **+37,030 s** —
  đều TRONG dải [33; 49,8], KHÔNG sát biên (cách biên dưới 8,129 / 6,441 / 4,030 s);
  spanning = ĐÚNG 1 run (run 180, kiểm DB phương pháp T7); caveat phân số KHÔNG lật được.
  Caveat #97: cửa hẹp bị #98 cắt ngang ở +576 s — đếm trong phần cửa quan sát được
  [23:02:47Z, 23:12:23Z) = đúng 1 dòng (eid 10547); eid 10550 thuộc #98.
- **F-180-T9-3 — LỆCH ĐỒNG HỒ trước #96: XÁC NHẬN độc lập, delta ∈ [18, 27] s** (xem §F-181-T0-2
  dưới): ba dấu độc lập trước reboot đều đọc sau btime (sampler cuối #95 21:21:14Z +18 s;
  watcher-180 poll cuối 21:21:20Z +24 s; T4 analyzers done 21:21:23Z +27 s); boot mới đúng giờ
  (CF ~1 s + boot_est +0,77 s cho #98 cùng họ). Hạn chế: sampler/watcher không cho thấy bước
  nhảy +delta trong cadence — mâu thuẫn bề mặt chưa giải quyết được, giao T2-181/T10-181.
- **F-181-T0-2 (mới) — LỆCH ĐỒNG HỒ trước #97: delta ≥ 29 s** (1 nguồn độc lập): watcher-180
  poll cuối cùng 23:03:16Z, boot 8d2a69df (dòng cuối log) = btime97 +29 s. Lệch nhanh ~18–29 s
  đã tái diễn ở cả 3 reboot #95/#96/#97 — mẫu hệ thống, không phải ca lẻ.
- **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z 24/11** (T5-181, mode **repair-sớm-quyết-h, poll=1**,
  dpkg 804, cache 111, lists 75 — CÙNG profile #96; watcher-181 START 23:59:08Z,
  EARLY-REPAIR TRIGGER boot_age 2.805 s). Chi tiết thuộc T5-181. **#97 CHƯA CÓ cờ** —
  T5-181 lo; tổng boot không cờ GIỮ 20 sau #93 (không đổi — #97 chưa xác nhận vắng; #98 ĐÃ CÓ cờ).
- **O8 trên boot #98 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (00:17:24–00:20:11Z):**
  WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 00:17:40.027Z, Playwright mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `84207ad2…`, bản copy attempt1.
  WebKit attempt2 exit=0, **21/21 PASS** (S1 PASS 00:18:36.170Z), JSON 21 results,
  21 ok=true, md5 `5214b6f5…`, bản stamped theo lượt khớp md5.
  Chromium exit=0, **21/21 PASS** (S1 PASS, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `19b9d258…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #98 (00:16:31Z)
  53 s** — O8 bắt đầu khi T4 poll #29 (00:17:09Z) đã thấy gate0=T5.
- **0 attempt chồng:** T4 poll #30–#32 trong cửa sổ O8 đều ghi lock=co thread=t0-round181
  (RAM 707–1.243 MB) → cửa yên KHÔNG mở; poll #33 (00:20:12Z, 1 s SAU khi O8 nhả lock)
  lock=không, RAM 1.910 MB → T4 vào attempt SAU O8 — bàn giao sạch, 0 chồng (xem F-181-T0-5).
  O8 chỉ chồng pha poll của T4, 0 attempt.
- X11: display O8 (:188/:197) đã dọn sạch (chỉ còn :193 của T4), 0 process sót của T0
  (kiểm 00:20:36Z). Boot lúc T0 đóng vẫn e62eef3f (kiểm cuối 00:20:36Z).
  Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-181-T0-*)

- **F-181-T0-1 — #96/#97 xác minh gián tiếp (hạn chế phương pháp, cùng mẫu F-180-T0-4).**
  Journal/wtmp/utmp hiện tại chỉ còn #98 (journal --list-boots 1 boot) — T0-181 KHÔNG đọc
  lại trực tiếp 9 nguồn địa phương của #96/#97. #96/#97 đứng trên bản ghi 9 nguồn của T7-180
  (trong phiên, phát hiện trong 47 s / 42 s) + xác nhận độc lập T4/T8/T9 (btime + gap #96) +
  watcher log (poll cuối #96) + đối chiếu DB (boot_gen + 3 requeue duy nhất + spanning = 1).
  Số hiệu #96/#97 đã được parent 180 CHẤP NHẬN chờ T0-181 (§12.3(e)) — T0 chỉ ghi rõ hạn chế này.
- **F-181-T0-2 — F-180-T9-3: đồng hồ cell nhanh ~18–27 s trước reboot #96 — XÁC NHẬN độc lập
  + F-181-T0-2: delta ≥ 29 s trước #97 (mới).**
  Bằng chứng #96: (a) sampler T9 mẫu cuối #95 21:21:14Z (+18 s, boot 95b483a2, dòng 24
  ram-sampler-FROZEN.log), mẫu đầu #96 21:22:06Z (dòng 25), gap mẫu 52 s (danh nghĩa 60 s);
  (b) watcher-180 poll cuối #95 21:21:20Z (+24 s, boot 95b483a2, dòng 49 replay-watch-180.log);
  (c) T4 chain-t4.log analyzers done 21:21:23Z (+27 s, dòng 525–527), lock release 21:20:58Z
  (+2 s, phù hợp) — cả ba là hoạt động cuối cùng của tiến trình trên boot #95, không thể xảy
  ra sau btime96 nếu đồng hồ đúng. Bằng chứng #97: watcher-180 poll cuối cùng 23:03:16Z
  (+29 s, boot 8d2a69df, dòng 168 CUỐI CÙNG replay-watch-180.log), poll trước 23:02:45Z,
  cadence 31 s — watcher chết theo #97, không poll nào sau. Boot mới đúng giờ: CF ×4
  +0,457…+1,134 s (#98), boot_est − btime = +0,77 s. Hệ quả: lệch nhanh ~18–29 s tái diễn
  ở cả 3 reboot #95/#96/#97 — mẫu hệ thống. HẠN CHẾ (ghi rõ, chưa giải quyết được): sampler
  60 s / watcher 30 s KHÔNG cho thấy bước nhảy +delta trong cadence (mọi gap 60/61 s /
  30/31 s) — mâu thuẫn bề mặt với kết luận trên; muốn khớp cả hai cần hoặc monotonic của VM
  chạy nhanh ~0,5% hoặc cơ chế khác — CHƯA kiểm chứng được (không có timedatectl/chrony
  trong cell: no systemd bus, chronyc không có). T0 KHÔNG đổi btime; mọi số đếm dùng btime
  theo quy ước đứng. #98: KHÔNG có dấu trước-reboot nào sau btime (sampler T9 dừng 22:53:08Z;
  watcher-180 chết theo #97; T8/T4 đóng trước #97) — không ước lượng được delta #98.
  Giao T2-181/T10-181 ghi nhận hạn chế này.
- **F-181-T0-3 — Run 180 TIMEOUT (margin −219 s; claimed→finished 86 s dùng claimed hiện tại;
  claimed_at ĐÃ ĐỔI sau khi T7-180 đóng cờ) — 3 run timeout liên tiếp (178 + 179 + 180).**
  Run 180 finished 23:39:30Z TIMEOUT (sau hạn 219 s; 11 event; viết lại ×3). Run 181 started
  23:39:30Z — trễ 219 s so với sched, đúng bằng run 180 finished (cùng mẫu run 180 trễ 28 s
  ở đợt 180); **chuỗi jitter 0 s run đợt đã đứt tại run 180, run 181 nối tiếp +219 s**.
  claimed_at: T7-180 ghi 20:36:19Z (1795466179) không đổi qua mọi lần đọc tới 23:34Z; DB đọc
  tươi ~23:58Z ghi 23:38:04Z (1795477084) — claimed ĐÃ ĐỔI trong khoảng 23:34–23:58Z
  (sau khi T7-180 đóng cờ, trước khi run 180 timeout 86 s). T0 chỉ ghi số DB đọc tươi +
  thời điểm đọc, KHÔNG phán "ca ≥60 s thứ mười" (số ca GIỮ 9 theo quyết (n) đợt 180) hay cơ
  chế trễ timeout — kết cục run 180 + run 181 thuộc T7-181.
- **F-181-T0-4 — Gap #97→#98 = 576 s ngắn bất thường: KHÔNG tìm thấy dấu hiệu host-side
  trong các log truy cập được.** dmesg: `read kernel buffer failed: Operation not permitted`
  (EPERM — như mọi đợt, không đọc được kernel buffer); journal -k boot #98: `-- No entries --`
  (kernel log không có trong journal của VM này); không có file /var/log/syslog; journal hiện
  tại chỉ còn boot #98 — nhật ký boot #97 đã mất, không đối chiếu được dòng cuối #97.
  Boot #98 bình thường: journald start +12 s, dpkg.log reset 23:13:00Z (+37 s, 94 B).
  (m) #98 +37,030 s bình thường; run 180 viết lại lần 3 bình thường; T7-180 ghi 0 slot
  thiếu/muộn do #98. Nguyên nhân gap ngắn VẪN chưa xác định (đứng như T7-180 ghi) — giao
  parent/T2-181 theo dõi tiếp; T0 KHÔNG suy đoán cơ chế host-side từ dữ liệu không có.
- **F-181-T0-5 — O8 bắt đầu khi GATE_OPEN=0 (PB=1, RAM <1.024 MB), lock giữ cửa đóng suốt O8
  — 0 attempt chồng (cùng cơ chế F-180-T0-5).** Lúc O8 acquire lock (00:17:24Z): T4 poll #29
  (00:17:09Z) gate0=T5 (POSTBOOT_PASS #98, poll=1, caveat repair) nhưng RAM 500 MB
  (< 1.024 MB) → cửa chưa mở; T4 chưa vào attempt. Lock t0-round181 là blocker trong poll
  #30–#32 (lock=co, blockers 5/5/1) → cửa KHÔNG mở suốt O8; poll #33 (00:20:12Z, 1 s sau
  khi O8 nhả lock) lock=không, postboot_exit=0, RAM 1.910 MB → T4 vào attempt SAU O8.
  O8 chạy SAU cờ #98 53 s (khác #95: 816 s — cờ #98 ghi muộn boot+3h04m08s vì không watcher
  nào sống trên #98 trước 23:59:08Z; repair bản thân xong ~00:16:31Z). T0 KHÔNG chạy script
  nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt suốt O8; quy tắc đứng
  sau vi phạm F-175-T4-2/F-178-T2-8 được tuân thủ — chuỗi 0 vi phạm 1 → 2 ở đợt 180, tiếp tục
  ở đợt 181). Load1 trong cửa sổ O8 theo poll log T4: 1,47–2,19 (poll #30–#32) — thuộc
  T9-181 quy B2, T0 chỉ ghi nhận.
- **F-181-T0-6 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #98 thuộc T5-181
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #96/#97/#98 + INSIDE #96/#97/#98 phân
  loại cuối thuộc T2-181 + parent; kết cục run 180 (TIMEOUT) + run 181 (T7-181); lượt yên
  #50 (T4-181, attempt bắt đầu sau khi O8 nhả lock); harness + O8 bộ thứ hai (T8-181,
  driver hb128 + Plan B B1 theo quyết (j) đợt 180 — O8 của T0 vẫn dùng script 87o8 gốc,
  không đổi); #96/#97/#98 có giết holder không + prune lần 56 (T6-181); headroom + ENOSPC
  + balloon + E-208 kết cục (T9-181).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #96/#97/#98 phân loại cuối (T2-181 + parent); INSIDE #96 (FULL142) + #97 (FULL143)
  + #98 (FULL144) (T2-181); kết cục run 180 (TIMEOUT) + run 181 (T7-181); HB 23:50:50Z +
  DR 00:00Z (T7-181); POSTBOOT_PASS #98 chi tiết + mode repair-sớm-quyết-h (T5-181);
  POSTBOOT_PASS #97 (T5-181); lượt yên #50 (T4-181, attempt bắt đầu sau khi O8 nhả lock
  00:20:11Z); harness + O8 bộ thứ hai (T8-181, hb128 + Plan B B1); #96/#97/#98 có giết
  holder không + prune lần 56 (T6-181); headroom + ENOSPC + balloon + E-208 (T9-181).
- Không kiểm lại dải FULL125–FULL144; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của replay #98; không kiểm lại nguyên nhân clock nhanh ~18–29 s (xem F-181-T0-2) hay
  trigger daemon restart; không chạy `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6
  — T0 đợt này chỉ đọc file trực tiếp theo đường dẫn đã biết).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t0/appendix181.py` + `appendix181.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t0/boot-survey-181t0.txt`
  (output thô 9 nguồn; lưu ý: `bc` vắng trong cell — boot_est tính bằng python trong appendix)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t0/o8-driver-181t0.sh` +
  `o8-181t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-181t0.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
