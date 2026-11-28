# PHASE9_ROUND192_T01_BOOT_VERIFY_LIMITS.md

Đợt 192 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §119).
Mở lượt cron 21:35:51 +07 25/11/2026 (= 14:35:51Z); survey đo tươi 14:40:57Z, O8
14:57:20–15:01:08Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 191 BẢN PARENT
(81.567 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 115, dedup python + kiểm chéo
shell viết mới; §14.2 SẠCH — lần sạch thứ ba kể từ đợt 179 (179, 183, 191);
tổng điền sẵn GIỮ 18)**. T01 KHÔNG khẳng định §14.2-191 do parent viết trực
tiếp (theo hồ sơ đứng AGENTS.md/MEMORY.md: parent kiểm độc lập trong lượt
18:35 +07 và viết quyết trực tiếp).

**BỐI CẢNH: đợt 190 VOID; đợt 191 đã đóng (parent quyết §14.2-191).** Đợt 192
là đợt thứ hai theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện sản
phẩm; Editing Core — parity preview/render). T10-192 do lượt cron 00:35 +07
26/11 spawn để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 14:40:57Z)**: boot_id
  `ebc5a3b9-230f-4ea5-926f-c3a62c96fbf5` (khác boot trước `b0aab705`); btime
  **14:23:56Z** (epoch 1795616636; uptime bracket khớp cùng giây —
  `uptime -s` 14:23:56Z, /proc/stat btime 1795616636, /proc/uptime 1.020,40 s
  lúc 14:40:57Z → boot_est = btime +0,60 s; /proc/1 start_ticks 1697 = btime
  +16,97 s, stat mtime 14:24:13.883Z = btime +17,88 s; journal idx 0 duy
  nhất, first 14:24:14Z = btime +18 s; wtmp begins 14:24:14Z; `last` reboot
  14:24 still running; `who -b` Nov 25 14:24; Cloudflare đo chặt (local mid
  14:40:58Z vs CF-Date 14:40:59 GMT, chênh +1 s — CF trước local ~0–1 s sau
  khi trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, cùng dấu F-189-T0-2; DB:
  0 requeue quanh btime (xem dưới); marker mtime không đổi).
  Gap #114→mới = **21.493 s (5h58m13s) — DÀI NHẤT chuỗi gần đây** (vượt
  #113→#114 13.759 s; #111→#112 12.155 s; #112→#113 7.385 s). Boot mới xảy ra
  SAU khi run 192 FAILED (10:56:00Z) và run đóng-191 SUCCEEDED (11:43:03Z),
  TRƯỚC khi đợt 192 mở (14:35:51Z). **Boot ebc5a3b9 CHẾT 16:21:33Z — có
  reboot thứ hai giữa đợt (xem F-192-T01-9 dưới): boot mới `4dda8234`,
  btime 16:21:33Z, gap 7.057 s, (m) THÔ +43,986 s (requeue run 193 eid
  11103, TRONG [33; 49,8]) — T2-192 phân loại CUỐI. O8 + survey trên vẫn
  thuộc boot ebc5a3b9 (chết sau khi O8 xong 1h20m25s); không có reboot mới
  trong lúc O8 chạy (kiểm 15:01:27Z boot vẫn ebc5a3b9).
- **Số hiệu mới — ỨNG VIÊN #115 (parent quyết (e) ở §14.2-192)**:
  b0aab705 = **#114 XÁC NHẬN** theo quyết (e)-191 (9 nguồn tươi T01-191,
  btime 08:25:43Z); #113 = f7632121 CHẤP NHẬN từ HỒ SƠ (quyết (e)-191) →
  ebc5a3b9 = **#115** theo hệ quả trực tiếp. **F-191-T7-2 KHÔNG đổi số hiệu
  b0aab705** (xem dưới — không xác nhận được boot chưa xác minh).
- **Marker sống qua 66 reboot (#49–#114)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 67 nếu boot mới = #115.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-192 + parent)**:
  **0 event `requeued_after_restart`** trong [14:20:00Z, 15:00:00Z] và trong
  cả 25/11 00:00–15:00Z chỉ có eid 10947 (#113 — DB đọc tươi). Không run nào
  sống tại btime: run 192 (d3d9408b) FAILED 10:56:00Z = btime −12.476 s
  (3h27m56s TRƯỚC btime; sched→finished 8.409 s, về trước hạn 11:35:51Z
  2.391 s — FAILED, không phải timeout; kết cục thuộc T7-192); run đóng-191
  (82d3d1b9) SUCCEEDED 11:43:03Z = btime −9.653 s; run 193 sched/started/
  claimed 14:35:51Z = **btime +715 s**, status running lúc đọc, boot_gen
  `cron_boot_30d363b8…` (mới — khác cdd48e77 của boot #114). Cửa (m)
  [btime+33; btime+49,8] = [14:24:29Z; 14:24:45Z] trống. **Khác #113**
  (1 requeue vì run 190 spanning): ở đây 0 requeue vì không run nào spanning —
  cùng mẫu #109/#112/#114 (0 requeue, không run spanning). Phân loại thuộc
  T2-192 + parent.
- **POSTBOOT_PASS boot mới ĐÃ CÓ 14:55:05Z (T56-192; T01 chỉ ghi nhận + xác
  minh độc lập)**: file `round192-t56/POSTBOOT_PASS`, 324 B, md5
  734f8e2d3e57f312aadb7b05205739b5; mode **repair-sớm-quyết-h, poll=1**;
  dpkg **768** dòng (= `wc -l /var/log/dpkg.log` T01 kiểm độc lập lúc
  ~14:56Z — nguồn thứ ba khớp cờ + watcher), cache 107 .deb, lists 75;
  postboot PASS poll1 độc lập exit 0 lúc 14:55:04Z; **boot+31m09s**; cờ cũ
  #114 backup `POSTBOOT_PASS-b0aab705`. Mode/caveat thuộc T56-192 + parent
  (tiền lệ #107: repair-sớm-quyết-h poll=1 CHẤP NHẬN CÓ caveat — KHÁC
  #114 replay-đầy-đủ poll=0 KHÔNG caveat). **POSTBOOT_PASS #113 KHÔNG CÓ**
  (tổng boot không cờ 25 → 26 đã quyết (c)-191). T01 xác minh độc lập thêm:
  chạy `vcut-webkit-postboot-check.sh` (check-only) exit=0, KẾT LUẬN "ĐỦ
  ĐIỀU KIỆN chạy WebKit" (GST đủ isomp4+libav, đủ 11 package). **T01 PHẢI
  chờ cờ** (khác T01-191: cờ về trước khi O8; giống T0-189 chờ 25m02s) —
  cờ về 14:55:05Z, O8 chạy 14:57:20Z (sau cờ 2m15s).
- **libevent VẮNG lúc survey (boot+17m01s)** — giống #112 (VẮNG lúc mở boot
  +9m53s, CÓ sau replay); dpkg.log chỉ 2 dòng lúc survey (đóng băng từ
  14:24:38Z), lên 768 dòng sau repair (apt-get update + install xong
  ~14:55Z). T01 không phân biệt được "có từ đầu boot" hay "đã heal bởi
  replay sớm" (survey đầu tiên boot+17m01s, sau khi replay-watch-192 đã
  chạy); O8 KHÔNG bị ảnh hưởng (libevent đã có trước O8; launch version
  27.2, 0 lỗi).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (14:57:20–15:01:08Z, 3m48s)**: sau cờ 2m15s. WebKit attempt1 exit=0,
  **21/21 PASS** (S1 PASS 14:57:42.856Z, Playwright mouse click lần 2;
  launched version 27.2), JSON 21 results, 21 ok=true, md5
  `9df451e1647498c0d4f16d9dcfeb3217`; attempt2 exit=0, **21/21 PASS** (S1
  PASS 14:59:00.819Z; launched 27.2), JSON 21 results, 21 ok=true, md5
  `c3df5c237ba334e60cae20ffddbe56c7`; Chromium exit=0, **21/21 PASS** (S1
  PASS, CDP mouse click), JSON 21 results, 21 ok=true, md5
  `d23ce49573d96da7f4b8b048f208c7e1`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:5560/
  5554 bridge OK). Script gốc KHÔNG đổi so với đợt 191 (webkit 4994b4fc,
  headed c8acd72e; preview.tsx đổi md5 trong lúc O8 — xem F-192-T01-6).
  dpkg.log 768 dòng trên boot mới (khớp cờ T56-192).
- **0 attempt chồng — O8 chạy TRƯỚC attempt T4**: T4-192 poller chỉ poll
  trong cửa sổ O8 (poll #22 15:00:58Z ghi lock=co của T01, postboot_exit=0,
  gate0=T4-check-only); T01 acquire lock 14:57:20Z khi lock TRỐNG, giữ
  3m48s, đã nhả (TRỐNG lúc 15:01:27Z); attempt T4 chưa mở lúc O8 xong.
  T4-192 poller bắt đầu 14:44:49Z (TRƯỚC O8) nhưng chỉ poll, chưa mở
  attempt — khác F-191-T10-2 (harness chồng pha (b)): O8 là script NGẮN
  (3m48s), T01 kiểm gate TRƯỚC khi chạy (cờ CÓ, lock TRỐNG, T4 chỉ poll)
  VÀ TRONG lúc chạy (poll #22 của T4 ghi nhận lock của T01, không mở
  attempt). Phán cuối về lượt yên #60 thuộc T4-192 + parent.
- X11: 0 process Xvfb sót, 0 socket sau O8 (kiểm 15:01:27Z); display O8 của
  T01 (:192/:198) không để lại socket. Boot lúc O8 xong vẫn ebc5a3b9.
  **Reboot thứ hai 16:21:33Z (boot `4dda8234`) xảy ra SAU khi O8 xong —
  xem F-192-T01-9; mọi số O8/survey trên vẫn thuộc boot ebc5a3b9.**

## Đếm — MỐC ĐẾM CUỐI (ghi rõ thời điểm đếm; xem F-192-T01-7)

- **Verdict: TẠM — PASS với 6/11 batch, KHÔNG đính chính đếm.** Tái kiểm
  111–191 KHỚP quyết parent (q) đợt 191 TỪNG SỐ; đợt 190 = 0/0/0/0 (VOID);
  0 file thiếu; chuỗi khớp nối dài lần thứ 117 (xem dưới). Số cuối đợt 192
  CHƯA CHỐT — T10-192 chạy lại hai phương pháp sau closing (lượt cron
  00:35 +07 26/11) và cộng batch closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-192-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-192-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
  Cả hai phương pháp chạy 1 LẦN mỗi phương pháp ở mốc cuối này
  (16:23–16:25Z), exit 0, KHỚP TỪNG SỐ với nhau ở mọi mốc đếm. (Mốc tạm
  trước đó 14:46–14:54Z: đợt 192 = 0/0/0/0, chuỗi khớp lần thứ 116 — xem
  recount/crosscheck-192-t01-temp.out.)
- **Mốc đếm cuối (16:23–16:25Z; T4/T7/T8/T9 CHƯA stage)**: quét **1.444 file**
  `phase9-round*.txt` (round 1–192, round thiếu duy nhất: 190 — VOID);
  purity 0 cảnh báo; tổng entry thô 7.291; tổng đường dẫn duy nhất toàn cục
  4.022.
- **Đợt 192 (TẠM) = 6/27/24/13** (6 batch: p1/p2/p3/p4/t2/t56 —
  entry theo batch: 3+4+12+6+1+1 = 27; 24 đường dẫn; 13 file mới;
  11 đường dẫn duy nhất không mới: i18n/en.json + i18n/vi.json (đợt 1),
  preview.tsx (đợt 1), tsconfig.json (đợt 1), audioEngine.ts (đợt 3),
  reversePlayback.ts (đợt 27), reverseWebcodecs.ts (đợt 33),
  enhancePreview.ts (đợt 60), audioEngineVoiceFx.test.ts (đợt 191),
  enhancePreview91P2.test.ts (đợt 191), reverseAudio.ts (đợt 191).
  13 file mới gồm 6 LIMITS (P1/P2/P3/P4/T2/T56) + 7 file code/script/test
  (parityHarness192.ts, parityHarness192.test.ts, reverseAudio192P3.test.ts,
  reverseAudioWiring.ts, reversePlayback192P3.test.ts,
  scripts/parity192-run.mjs, scripts/parity192-run-test.mjs — xem
  first-seen đầy đủ trong recount-192-t01-final.out).
- **Lũy kế 111–192 = 796/1.421/1.228/1.039** (= lũy kế 111–191 cộng delta
  đợt 192 tạm 6/27/24/13). **Chờ push hiện tại (191+192, TẠM) =
  18/72/57/44.** **Tổng 1–192 = 1.444/7.291/4.022/4.022. Tổng 1–191 =
  1.438/7.264/4.009/4.009. Tổng 1–190 = 1.426/7.219/3.978/3.978.**
- **Tái kiểm vs quyết parent (q) đợt 191 — KHỚP TỪNG SỐ**: tái kiểm 111–191
  = 790/1.394/1.213/1.026 (quyết (q)-191: 790/1.394/1.213/1.026); tổng 1–191 =
  1.438/7.264/4.009 (quyết (q)-191: 1.438/7.264/4.009). Tái kiểm 111–190 =
  778/1.349/1.173/995 (KHỚP (q)-189); 111–189 = 778/1.349/1.173/995.
- **Chuỗi khớp: 115 (parent-191) → 116 (T01-192, mốc tạm) → 117 (T01-192,
  mốc cuối này).** Cơ sở lần 117: hai phương pháp của T01 khớp từng số với
  nhau ở mọi mốc; tái kiểm 111–191 khớp từng số với quyết parent (q) đợt
  191; số đợt 192 = trước (0) + delta 6 batch đã stage (T4/T7/T8/T9 chưa
  stage nên số này là TẠM — T10-192 xác nhận lại sau closing).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.022 đường dẫn duy nhất, cả hai
  phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=4022`).
- **Kích thước 7 LIMITS đợt 192 (đo bằng stat 16:25:39Z) vs giới hạn push
  37.768 B — 0/7 VƯỢT**: P1 13.806 B, P2 15.396 B, P3 22.262 B, P4 17.752 B,
  T2 21.185 B, T56 34.648 B (dư 3.120 B — gần nhất đợt này), T01 22.413 B
  (+~2 KB sau khi điền §Đếm này — vẫn dưới xa). **Lệch nhỏ ghi nhận: file
  T01 này sẽ tăng sau khi điền §Đếm; số 22.413 B là trước khi điền.**
  Aggregate 192 chưa có (T10-192 viết sau) — mọi aggregate đều vượt
  giới hạn push; lúc push cần `ENABLE_PRIVSEP=0`.
- **6/11 cờ lúc T01 đóng** (P1, P2, P3, P4, T2, T56 — T4/T7/T8/T9 thiếu;
  + cờ T01 = 7/11). Chuỗi 11/11 = 12 (quyết (q)-191) CHƯA nối được đợt này
  — T10-192 chốt sau khi T4/T7/T8/T9 stage (nếu đủ 11/11 trong hạn cứng
  thì chuỗi nối tiếp; nếu không đủ thì chuỗi đứt theo tiền lệ đợt 182/
  183/184/185).

## Giới hạn / sai số ghi nhận (F-192-T01-*)

- **F-192-T01-1 — F-191-T7-2: KHÔNG XÁC NHẬN ĐƯỢC boot chưa xác minh →
  GIỮ #114 cho b0aab705 (parent quyết (e)-191 giữ nguyên); boot mới
  ebc5a3b9 là ỨNG VIÊN #115.** Bằng chứng (DB tươi + nhật ký giữ lại):
  (1) boot_gen đổi 7/7 lần trùng boot đã biết (kể cả mới nhất cdd48e77 →
  30d363b8 trùng boot ebc5a3b9 14:23:56Z); các cặp cùng gen không bao giờ
  spanning 1 boot đã biết (a5f49c21 ×2 trên #105; f5bbd5f4 ×2 trên #111;
  cdd48e77 ×2 trên #114) — tương quan boot_gen↔boot MẠNH. (2) Cửa bất
  thường duy nhất (05:01:25Z, 05:35:51Z] (run 190 xong → run 191 dispatch):
  daemon CÒN SỐNG — HB 05:20:50Z start 05:15:34Z ĐÚNG GIỜ, reconciled
  05:15:34Z, run 191 dispatch 05:35:51Z jitter 0, HB 05:50:50Z start
  05:45:34Z ĐÚNG GIỜ; hồi phục sau boot đo được #112 +12m15s, #113 +9m10s,
  #114 +9m54s → boot (nếu có) phải ≤ 05:26:41Z (hồi phục nhanh nhất) để
  dispatch đúng giờ → cửa hẹp (05:15:34Z, 05:26:41Z] chỉ ~11 phút (8 phút
  với hồi phục chậm nhất) — HẸP NHƯNG KHÔNG LOẠI TRỪ ĐƯỢC. (3) Nhật ký giữ
  lại KHÔNG xác minh được: journal CHỈ boot hiện tại (idx 0 duy nhất
  ebc5a3b9); wtmp CHỈ boot hiện tại (384 B); events trong cửa chỉ có 4 dòng
  (succeeded/reconciled/dispatched — không có dấu hiệu reboot). (4) md5/
  sha256 đơn giản của boot_id KHÔNG tái tạo được boot_gen (gen không phải
  hash tầm thường của boot_id — có thể random theo boot hoặc có salt; không
  kết luận được gì từ đây). (5) Heartbeat runs có worker_boot_generation =
  NULL (không có dữ liệu gen mức 30 phút); delivery_outbox chỉ có 2 dòng
  vcut trong cửa (khớp gen 2 run, không thêm gì). **Kết luận: giả thuyết
  boot_gen gắn với boot VẪN ĐỨNG ở mức tương quan nhưng CHƯA CHỨNG MINH
  ĐƯỢC cửa bất thường là 1 boot; cũng KHÔNG bác được daemon-generation
  bằng dữ liệu hiện có.** Theo brief: chỉ đổi số khi XÁC NHẬN ĐƯỢC —
  không xác nhận được nên GIỮ #114, marker 66. Parent quyết cuối (e).
- **F-192-T01-2 — (m) boot mới: 0 requeue — T01 chỉ ghi số, KHÔNG phân loại
  (thuộc T2-192 + parent).** Bằng chứng (DB đọc tươi): 0 event
  `requeued_after_restart` trong [14:20:00Z, 15:00:00Z] và trong cả 25/11
  00:00–15:00Z chỉ có eid 10947 (#113); run 192 FAILED btime −12.476 s;
  run đóng-191 SUCCEEDED btime −9.653 s; run 193 sched btime +715 s; cửa
  [btime+33; btime+49,8] trống. Trong chuỗi #102–#114, mọi reboot có run
  spanning đều có ≥1 requeue tại btime +~35–44 s; boot mới nối lại mẫu 0
  requeue của #109/#112/#114 (cả bốn đều KHÔNG CÓ run spanning).
  **Run 192 FAILED 10:56:00Z (về trước hạn 11:35:51Z 2.391 s — FAILED,
  không phải timeout)** — kết cục thuộc T7-192; T7-191 lúc đóng còn ghi
  run này RUNNING.
- **F-192-T01-3 — POSTBOOT_PASS boot mới là repair-sớm-quyết-h, poll=1
  (mode/caveat thuộc T56-192 + parent).** T01 ghi nhận: repair-sớm-quyết-h,
  poll=1, dpkg 768 (khớp 3 nguồn: cờ + watcher + `wc -l /var/log/dpkg.log`
  độc lập), cache 107, lists 75, postboot PASS poll1 độc lập exit 0
  14:55:04Z, boot+31m09s, verify check-only độc lập của T01 exit 0. Tiền lệ
  #107: repair-sớm-quyết-h poll=1 CHẤP NHẬN CÓ caveat. **POSTBOOT_PASS #113
  KHÔNG CÓ** — tổng boot không cờ 25 → 26 đã quyết (c)-191, không đổi.
  **libevent VẮNG lúc survey** (boot+17m01s; dpkg 2 dòng) — giống #112;
  T01 chờ cờ về rồi mới chạy O8 (khác T01-191 cờ về trước).
- **F-192-T01-4 — Dấu chênh Cloudflare giữ nguyên cách ghi F-189-T0-2
  (CF − local).** Bằng chứng: local mid 1795617658, CF-Date 1795617659 →
  CF − local = +1 s → local CHẬM ~0–1 s sau khi trừ mạng. Verdict "đồng hồ
  ĐÚNG trong ±2 s" KHÔNG ĐỔI; mọi phép tính gap/btime dùng đồng hồ local
  nhất quán nên không bị ảnh hưởng.
- **F-192-T01-5 — O8 chạy TRƯỚC attempt T4 — 0 chồng lấn, gate được kiểm
  trước VÀ trong lúc chạy.** Lúc T01 acquire lock (14:57:20Z): lock TRỐNG,
  cờ POSTBOOT_PASS đã CÓ (14:55:05Z), T4 poller chỉ poll (bắt đầu
  14:44:49Z, chưa mở attempt), apt=0 — T01 acquire lock, chờ 0 s. Trong lúc
  O8 chạy, poll #22 của T4 (15:00:58Z) ghi nhận lock của T01, không mở
  attempt (attempt T4 chưa mở lúc O8 xong 15:01:08Z). Khác F-191-T10-2
  (harness T56 chồng pha (b) 2m35s vì khởi động trước gate xanh và không
  kiểm trong 7 phút): O8 ngắn (3m48s), gate đã xanh TRƯỚC khi chạy (cờ +
  lock trống + T4 chỉ poll), và T01 kiểm lại TRONG lúc chạy qua poll của
  T4. Phán cuối về lượt yên #60 thuộc T4-192 + parent.
  **Đánh giá O8 boot mới theo mốc chuỗi (quyết (b) đợt 191 — FULL PASS 1 →
  2):** chân O8 T01 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium 21/21,
  sau cờ 2m15s, cùng boot ebc5a3b9, cờ repair-sớm-quyết-h poll=1 — mode/
  caveat thuộc T56-192 + parent). FULL PASS đợt 192 thuộc T8-192/T10-192
  + parent (cần thêm O8 T8 + lượt yên #60 + harness 6/6 cùng boot).
- **F-192-T01-6 — preview.tsx đổi md5 3 lần TRONG cửa sổ O8 (luồng sản phẩm
  đang sửa file).** Bằng chứng: 043a0ef5 lúc 14:57:15Z (T01 đo) →
  f1b52338 lúc driver start 14:57:20Z → dc58f1b4 lúc 15:01:27Z (T01 đo);
  T4-192 ghi 549278c8 lúc 15:00:58Z (tree-md5). Cả 3 bộ O8 vẫn 21/21
  (vite serve từ đĩa theo thời điểm request) nên verdict PASS đứng — ghi
  nhận cho T10 biết phiên bản nào O8 thực sự test là phiên bản tại thời
  điểm serve, không phải một md5 cố định. Không phải lỗi của O8.
- **F-192-T01-7 — Đếm TẠM 6/11 (T4/T7/T8/T9 CHƯA ĐÓNG CỜ lúc T01 đóng —
  xem §Đếm).** Lúc T01 chạy đếm cuối (16:23–16:25Z): 6/11 cờ đã có (P1
  14:59Z, P2, P3, T2, T56, P4) + cờ T01 = 7/11; T4 (đang retry attempt2,
  hạn cắt 16:30Z — bị reboot 16:21:33Z giết giữa chừng), T7, T8, T9 CÒN
  CHẠY. Mốc tạm trước đó (14:46–14:54Z): 0 file paths-loop đợt 192 (P1
  stage file đầu tiên 15:01:43Z — SAU mốc tạm), chỉ 1/11 cờ (P1). Số đếm
  trong LIMITS này là TẠM — T10-192 (lượt cron 00:35 +07 26/11) chạy lại
  hai phương pháp sau closing và chốt số cuối (cộng cả batch T01 này:
  +1 batch/+2 entry/+1 đường dẫn/+1 file mới, và batch closing nếu có).
  Chuỗi khớp ở §Đếm tính trên mốc cuối này; T10-192 xác nhận lại.
- **F-192-T01-8 — Nguồn dùng trong LIMITS này: §14.2 aggregate 191 BẢN
  PARENT (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 115;
  nguồn gốc SẠCH, tổng điền sẵn GIỮ 18) + LIMITS T01-191 + §118 GAP +
  log gốc (boot-survey-192t01, appendix192, replay-watch-192, poll-t4/
  chain-t4-192, POSTBOOT_PASS boot mới + backup #114, o8-192t01.log) + DB
  tươi (muse.db job_runs + events + delivery_outbox) + cờ .done P1-192
  (chỉ trích dẫn, không xác minh lại nội dung chuyên môn).** Các quyết
  THẬT dùng: (a) CHẤP NHẬN đợt 191; (b) FULL PASS 1 → 2; (c)
  POSTBOOT_PASS #114 KHÔNG caveat, tổng boot không cờ 25 → 26; (d) INSIDE
  #112/#113 KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; (e) b0aab705 = #114 XÁC NHẬN,
  #113 = f7632121 CHẤP NHẬN từ HỒ SƠ, F-191-T7-2 KHÔNG chấp nhận đổi số
  hiệu; (f) (m) #113 DƯƠNG (CUỐI), (m) #114 KHÔNG CÓ ĐIỂM, n ứng viên
  51/52; (g) n chính thức GIỮ 14; (h) E-247 kết cục KHÔNG XÁC ĐỊNH ĐƯỢC;
  (i) holder chuỗi 16 → 18; (j) harness 6/6, 84l10 PASS chuỗi 10, 86n2-P1
  chuỗi 13, B2 QUYẾT TÁCH: KHÔNG TÁCH; (k) replay #114 KHÔNG ĐÌNH TRỆ;
  (l) headroom 0 lần 50, ENOSPC lần 39, birefnet 0 lần 44; (m) lượt yên #59
  HỢP LỆ, chuỗi 1 → 2; live lần 10 ĐẠT (chuỗi 8 → 9); (n) run 814be71a +
  eb18559f SUCCEEDED (CA #22), cách đếm nối tiếp (eb18559f = run 190,
  814be71a = run 191, d3d9408b = run 192, hiện tại = run 193), cửa slot
  190-VOID KHÔNG LÀNH + 191 LÀNH (chuỗi lành tính lại từ 1), OUTAGE bàn
  giao T7-193/T7-194; (o) auto-trigger GIỮ LIVE; (p) chuỗi 0 vi phạm 5 → 0
  (ĐỨT — F-191-T10-2 LIGHT VIOLATION); (q) đếm cuối đợt 191 = 12/45/42/31,
  lũy kế 111–191 = 790/1.394/1.213/1.026, chờ push = CHỈ đợt 191 =
  12/45/42/31, chuỗi 11/11 = 12; (r) KHÔNG PUSH. T01 KHÔNG tự thay đổi
  verdict nào; mọi số đếm/boot/O8 trong LIMITS này không bị ảnh hưởng bởi
  nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/(q) theo bản
  parent).
- **F-192-T01-9 — REBOOT THỨ HAI GIỮA ĐỢT (boot `4dda8234`, btime 16:21:33Z
  — xác minh 9 nguồn TƯƠI lúc 16:22:46Z, SAU khi O8 xong).** Boot ebc5a3b9
  sống 7.057 s (1h57m37s) rồi chết; boot mới `4dda8234-2f0f-4414-8a51-
  25ab2e7e5d6a`, btime 1795623693 = 16:21:33Z (uptime -s 16:21:33Z; /proc/
  uptime 72,90 s lúc 16:22:46Z → boot_est = btime +0,10 s; /proc/1 ticks
  1262 = btime +12,62 s, stat mtime 16:21:46.028Z = btime +13,03 s; journal
  idx 0 duy nhất, first 16:21:46Z = btime +13 s; wtmp begins 16:21:46Z;
  `last` reboot 16:21 still running; `who -b` Nov 25 16:21; CF local mid
  16:22:46Z vs CF-Date 16:22:47 GMT → CF − local = +1 s; marker mtime
  không đổi; libevent VẮNG, dpkg.log 2 dòng — boot tươi vừa mở). Số hiệu
  ỨNG VIÊN #116 (nếu ebc5a3b9 = #115); marker 67 (ebc5a3b9) → 68 (nếu
  #116). **(m) boot này — SỐ LIỆU THÔ: requeue eid 11103, run 193
  (8c0c386d), 16:22:16.986357Z = btime +43,986 s — TRONG [33; 49,8] thô
  (trên biên dưới 10,986 s); run 193 started_at VIẾT LẠI 16:22:17Z
  (btime +44 s), status running, boot_gen đổi sang `cron_boot_a080cf74…`
  (khác 30d363b8 của boot ebc5a3b9) — lần đổi gen thứ 8 liên tiếp trùng
  boot đã biết (xem F-192-T01-1).** Phân loại CUỐI thuộc T2-192 + parent
  (T2-192 kiểm tra overlap/caveat đồng hồ). Hệ quả: POSTBOOT_PASS cho boot
  mới CHƯA CÓ (T56-192 phải làm lại trên boot mới — replay/watcher cũ chết
  theo reboot); lượt yên #60 của T4 (đang retry attempt2, hạn cắt 16:30Z)
  và harness T8 + sampler T9 đều bị reboot này giết giữa chừng — kết cục
  thuộc T4/T8/T9-192 + T10-192. T01 KHÔNG chạy O8 lại trên boot mới (O8
  của T01 đã xong trên ebc5a3b9; O8 bộ thứ hai thuộc T8-192 — nếu T8 chạy
  lại trên boot mới thì chân O8 đổi boot, parent quyết FULL PASS theo boot
  nào). **Runtime restart:** phiên T01 bị gián đoạn ~16:20Z (runtime
  restart — trùng thời điểm reboot host); T01 khôi phục, kiểm lại boot
  tươi và ghi nhận reboot thứ hai này thay vì coi phiên cũ là liên tục.
  Không có reboot nào khác trong lúc T01 khôi phục (kiểm 16:22:46Z boot
  vẫn 4dda8234).

## Phạm vi chưa kiểm (không thuộc T01)

- Số hiệu boot mới ebc5a3b9 = #115 (ứng viên — parent quyết (e) ở §14.2-192);
  boot `4dda8234` (btime 16:21:33Z) = #116 ứng viên; (m) boot `4dda8234`
  THÔ +43,986 s (T2-192 phân loại CUỐI); POSTBOOT_PASS cho boot `4dda8234`
  CHƯA CÓ (T56-192 làm lại); lượt yên #60 / harness / sampler sau reboot
  16:21:33Z thuộc T4/T8/T9-192.
  (m) boot mới + INSIDE #113/#114 + (m) #56 (T2-192); kết cục run 193 +
  run 192 FAILED + HB/DR + cửa slot đợt 192 + OUTAGE #2 điều tra "cố định
  theo giờ" (T7-192; T7-193 kiểm onset khung 25/11, T7-194 phán cuối);
  POSTBOOT_PASS boot mới chi tiết + mode/caveat (T56-192); lượt yên #60
  (T4-192); harness + O8 bộ thứ hai + B2 + B1 (T8-192); #114/mới có giết
  holder không (T56-192); headroom + ENOSPC + E-247 + auto-trigger live
  lần FIRE thật đầu tiên (T9-192); kết quả sản phẩm P1–P4 đợt 192 (T01
  không xác minh lại nội dung chuyên môn).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-192); không kiểm lại
  nguyên nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round192-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round192-t01/appendix192.py` + `appendix192.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round192-t01/boot-survey-192t01.sh`
  + `boot-survey-192t01.txt` (output thô 9 nguồn boot mới — đo tươi 14:40:57Z;
  script adapt từ 191; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
  + `boot-survey-192t01-newboot.txt` (output thô 9 nguồn boot thứ hai
  4dda8234 — đo tươi 16:22:46Z, sau runtime restart) + `appendix192-newboot.txt`
  (số liệu boot thứ hai + (m) THÔ +43,986 s, tính từ epoch thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round192-t01/recount-192-t01.py` +
  `recount-192-t01-temp.out` + `recount-192-t01-final.out` +
  `crosscheck-192-t01.sh` + `crosscheck-192-t01-temp.out` +
  `crosscheck-192-t01-final.out`
  (hai phương pháp đếm viết mới hoàn toàn, mỗi phương pháp chạy 1 lần ở mốc
  tạm 14:46–14:54Z và 1 lần ở mốc cuối 16:23–16:25Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round192-t01/o8-driver-192t01.sh` +
  `o8-192t01.log` + `o8-lock.log` + `o8-driver-192t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-192t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
