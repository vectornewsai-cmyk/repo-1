# PHASE9_ROUND194_T01_BOOT_VERIFY_LIMITS.md

Đợt 194 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §121).
Mở lượt cron 09:35:51 +07 26/11/2026 (= 02:35:51Z); survey đo tươi 02:46:33Z,
O8 03:12:26–03:17:31Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 193 BẢN
PARENT-KIỂM (56.830 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 123, dedup python
+ kiểm chéo shell viết mới; §14.2-193 nguồn gốc CHƯA NGÃ NGŨ — KHÔNG phải lần
sạch thứ tư; các lần sạch vẫn là 179, 183, 191; tổng điền sẵn GIỮ 18)**. T01
KHÔNG khẳng định §14.2-193 do parent viết trực tiếp (theo hồ sơ đứng
AGENTS.md/MEMORY.md + ghi chú nguồn gốc trong chính aggregate 193: parent
KHÔNG có lượt nào lúc ~00:08Z, T10-193 để §14.2 trống hoàn toàn, MEMORY.md
không được cập nhật cho đợt 193). Nguồn đúng thứ hai: §14.2 aggregate 192
(99.871 B, bản parent-kiểm).

**BỐI CẢNH: đợt 193 đã đóng (parent CHẤP NHẬN toàn bộ ở §14.2-193).** Đợt 194
là đợt thứ tư theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện sản
phẩm; Editing Core — parity preview/render). T10-194 do lượt cron sau spawn
để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 02:46:33Z)**: boot_id
  `55c9e0b7-2d97-4260-a6ca-45538e24b6c1` (khác boot trước `8a23277a`); btime
  **02:28:08Z** (epoch 1795660088; uptime bracket khớp cùng giây —
  `uptime -s` 02:28:08Z, /proc/stat btime 1795660088, /proc/uptime 1.104,88 s
  lúc 02:46:33Z → boot_est = btime −0,12 s; /proc/1 start_ticks 1784 = btime
  +17,84 s, stat mtime 02:28:26.779Z = btime +18,78 s; journal idx 0 duy
  nhất, first 02:28:27Z = btime +19 s; wtmp begins 02:28:27Z; `last` reboot
  02:28 still running; `who -b` Nov 26 02:28; Cloudflare đo chặt (local mid
  02:46:33Z vs CF-Date 02:46:35 GMT, chênh +2 s — CF trước local ~1–2 s sau
  khi trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, cùng dấu F-189-T0-2; DB:
  0 event bất kỳ quanh btime (xem dưới); marker mtime không đổi).
  Gap #118→mới = **14.773 s (4h06m13s) — DÀI THỨ HAI chuỗi gần đây** (sau
  #114→#115 21.493 s; trên #116→#117 14.464 s; #117→#118 7.158 s). Boot mới
  xảy ra SAU khi run 197 SUCCEEDED (00:10:21Z), TRƯỚC khi đợt 194 mở
  (02:35:51Z). Boot #118 sống 14.773 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #119 (parent quyết (e) ở aggregate 194)**:
  1c0bcaad = **#117 XÁC NHẬN** theo quyết (e)-193; 8a23277a = **#118 XÁC
  NHẬN** theo quyết (e)-193 → 55c9e0b7 = **#119** theo hệ quả trực tiếp.
- **Marker sống qua 70 reboot (#49–#118)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 71 nếu boot mới = #119.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-194 + parent)**:
  **0 event `requeued_after_restart`** trong [02:26:00Z, 02:32:00Z] và
  **0 event BẤT KỲ** trong [02:26:00Z, 02:32:00Z] (DB đọc tươi) — cửa (m)
  [02:28:41Z; 02:28:57.8Z] trống hoàn toàn. Không run nào sống tại btime:
  run 197 (c6cac684) SUCCEEDED 00:10:21Z = btime −8.267 s (2h17m47s TRƯỚC
  btime); run 196 (32dddfa5) SUCCEEDED 23:11:45Z = btime −11.783 s; run 195
  (e2fad6d2) SUCCEEDED 17:54:32Z = btime −30.816 s; run hiện tại (8256daf7)
  sched/started 02:35:51Z = **btime +463 s**, status running lúc đọc, boot_gen
  `cron_boot_84362c6b…` (mới — khác a4315b57 của run 197, đọc tươi cùng 1 truy
  vấn — xem F-194-T01-2 về độ tin cậy boot_gen). **Khác #118** (1 requeue vì
  run 196 spanning, +43,80 s): ở đây 0 requeue vì không run nào spanning —
  cùng mẫu #109/#112/#114/#115/#117 (0 requeue, không run spanning). Phân
  loại thuộc T2-194 + parent. (m) #118 đối chiếu: requeued_after_restart
  22:22:38.802Z = btime #118 +43,80 s, run 32dddfa5 — đúng số THÔ (q)-193.
- **POSTBOOT_PASS boot mới ĐÃ CÓ 02:50:55Z (T56-194; T01 chỉ ghi nhận + xác
  minh độc lập)**: file `round194-t56/POSTBOOT_PASS`, 324 B, md5
  863a6035 (theo cờ T56-194); mode **repair-sớm-quyết-h, poll=1**;
  dpkg **777** dòng (= `wc -l /var/log/dpkg.log` T01 kiểm độc lập lúc
  ~02:53Z — nguồn thứ ba khớp cờ + watcher), cache 108 .deb, lists 75;
  postboot PASS poll1 độc lập exit 0 lúc 02:50:55Z; **boot+22m47s**; cờ cũ
  #117 backup `POSTBOOT_PASS-1c0bcaad`. Mode/caveat thuộc T56-194 + parent
  (tiền lệ #107: repair-sớm-quyết-h poll=1 CHẤP NHẬN CÓ caveat).
  **GST #119 là SYMLINK → debroot (269 file) — giống #115, KHÁC #117
  (thư mục thật)** — caveat cờ #119 NẶNG HƠN #117 (T56-194; T01 kiểm độc
  lập: `ls -la` symlink, 269 file khớp debroot). **POSTBOOT_PASS #118
  KHÔNG CÓ** (T56-194: không watcher trong đời #118, không verify được
  post-hoc) — **tổng boot không cờ 27 → 28**. **Replay #119: KHÔNG CHẠY
  (dạng B)** (T56-194; nguyên nhân dạng B vẫn nợ host-side (k)-174).
  **T01 PHẢI chờ cờ** (cờ về 02:50:55Z, O8 chạy 03:12:26Z, sau cờ 21m31s).
- **libevent VẮNG lúc survey (boot+18m25s)** — giống #112/#115/#116/#117
  (VẮNG lúc mở boot, CÓ sau replay); dpkg.log chỉ 2 dòng lúc survey (đóng
  băng từ 02:35:46Z — 2 dòng `startup packages configure` lúc boot+7m38s),
  lên 777 dòng sau repair (apt-get install 11 gói 02:50:33–02:50:53Z + cờ
  02:50:55Z). T01 không phân biệt được "có từ đầu boot" hay "đã heal bởi
  replay sớm" (survey đầu tiên boot+18m25s, sau khi replay-watch-194 đã
  chạy 02:48:57Z); O8 KHÔNG bị ảnh hưởng (libevent đã có trước O8;
  launch version 27.2, 0 lỗi).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (03:12:26–03:17:31Z, 5m05s)**: sau cờ 21m31s. WebKit attempt1 exit=0,
  **21/21 PASS** (S1 PASS 03:12:49Z, Playwright mouse click lần 2;
  launched version 27.2), JSON 21 results, 21 ok=true, md5
  `57f5b3499ee1e7286178171df02c25f0`; attempt2 exit=0, **21/21 PASS** (S1
  PASS 03:15:21Z; launched 27.2), JSON 21 results, 21 ok=true, md5
  `a795267965ea592dbf4691ee5da8ad66`; Chromium exit=0, **21/21 PASS** (S1
  PASS 03:17:11Z, CDP mouse click), JSON 21 results, 21 ok=true, md5
  `0ceefe1743e616dab0f6c180929f4b14`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:5560/
  5554 bridge OK). Script gốc KHÔNG đổi so với đợt 193 (webkit 4994b4fc,
  headed c8acd72e); preview.tsx lúc O8 = **591f9655** (đổi so với cf331628
  đợt 193 — P-thread sửa giữa đợt; T4 poll #31 xác nhận tree=YES với
  591f9655). dpkg.log 777 dòng trên boot mới (khớp cờ T56-194).
- **O8 chạy TRONG KHE giữa attempt1 và attempt2 của T4 — 0 chồng lấn**:
  T4 attempt1 xong 03:01:51Z (lớp B vi phạm, xem F-194-T01-5), T4 attempt2
  mở 03:29:23Z; T01 acquire lock 03:12:27Z khi lock TRỐNG (chờ 1s), giữ
  5m04s, đã nhả 03:17:31Z (TRỐNG lúc 03:17:58Z — poll #30 của T4). Trong lúc
  O8 chạy, poll #23–#29 của T4 (03:12:30–03:17:10Z) đều ghi lock=co
  (thread=t01-round194, pid 128040, port 5560) và KHÔNG mở attempt — giống
  F-193-T01-6 (đảo thứ tự: đợt 193 O8 chạy TRƯỚC attempt1 T4; đợt này O8
  chạy GIỮA attempt1 và attempt2 — cùng nguyên tắc 0 chồng lấn). Tải do O8
  gây ra (load1 đỉnh 13,07 lúc poll #25) làm cửa yên mở muộn ~12 phút
  (attempt2 mở 03:29:23Z, sau khi load rã về 0,76/1,85) nhưng KHÔNG nhiễm
  mẫu của attempt2 (attempt2 mở khi máy đã lặng; file class-B attempt2
  không nêu process nào của T01 — xem F-194-T01-5). Phán cuối về lượt yên
  #62 thuộc T4-194 + parent.
- X11: 0 process Xvfb của T01 sót sau O8 (display T01 :192/:198, không còn
  socket; Xvfb :196 pid 132589 lúc 03:18Z là của T4 attempt2 — không phải
  của T01); socket stale X98 (tạo 20:50Z đợt 193 — TRƯỚC O8, 0 process giữ;
  xem F-193-T01-9) vẫn còn. Boot lúc O8 xong vẫn 55c9e0b7. Không có reboot
  mới trong lúc O8 chạy (kiểm 03:18:33Z boot vẫn 55c9e0b7).

## Đếm — MỐC ĐẾM CUỐI (ghi rõ thời điểm đếm; xem F-194-T01-6)

- **Verdict: TẠM — PASS với 7/11 batch, KHÔNG đính chính đếm.** Tái kiểm
  111–193 KHỚP quyết parent (q) đợt 193 TỪNG SỐ; đợt 190 = 0/0/0/0 (VOID);
  0 file thiếu; chuỗi khớp nối dài lần thứ 125 (xem dưới). Số cuối đợt 194
  CHƯA CHỐT — T10-194 chạy lại hai phương pháp sau closing (lượt cron sau)
  và cộng batch closing + các batch T2/T8/T9 nếu stage kịp.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-194-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-194-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
  Cả hai phương pháp chạy 1 LẦN mỗi phương pháp ở mốc tạm (~02:51–03:01Z),
  1 lần ở mốc cuối lần 1 (03:43:33–03:47:58Z — xem F-194-T01-6), 1 lần ở
  mốc cuối lần 2 (03:49:12–03:53:06Z — đua với batch T4, xem F-194-T01-6),
  và 1 lần ở mốc cuối lần 3 (03:53:58–04:02:10Z — mốc CHỐT của LIMITS này),
  exit 0, KHỚP TỪNG SỐ với nhau ở mốc cuối lần 3. (Mốc tạm: đợt 194 =
  0/0/0/0, chuỗi khớp lần thứ 124 — xem recount/crosscheck-194-t01-temp.out;
  mốc cuối lần 1: đợt 194 = 6/29/28/15 — trước khi T4 stage; mốc cuối lần 2:
  python 6/29/28/15 (trước T4) vs shell 6/29/28/15 nhưng tổng 1–194
  1.469/7.378 (sau T4) — NỘI BỘ KHÔNG NHẤT QUÁN do đua, xem F-194-T01-6.)
- **Mốc đếm cuối lần 3 (03:53:58–04:02:10Z; T2/T8/T9 CHƯA stage)**:
  quét **1.469 file** `phase9-round*.txt` (round 1–194, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.378; tổng đường
  dẫn duy nhất toàn cục 4.075. Trạng thái paths-loop ổn định: 7 file đợt
  194 lúc bắt đầu VÀ lúc kết thúc đếm.
- **Đợt 194 (TẠM) = 7/34/33/20** (7 batch — P1 1/2/2/2, P2 1/12/12/2, P3
  1/7/7/4, P4 1/6/6/5, T4 1/5/5/5, T56 1/1/1/1, T7 1/1/1/1; 34 entry, 33
  đường dẫn — `apps/web/tsconfig.json` xuất hiện ở cả P3 và P4 nên uniq
  33 < entry 34; 20 file mới). File mới (20): 7 LIMITS (P1/P2/P3/P4/T4/T56/
  T7) + voicefx194-render-sample.mjs (P1) + media.fpsProbe94P2.test.ts (P2)
  + reverseAudio194P3.test.ts + audio-probe-194.mjs + audio-waveform-194-
  chirp-10s.json (P3) + parityHarness194.ts + parityHarness194.test.ts +
  parity194-run.mjs + parity194-run-test.mjs (P4) + 4 script T4
  (poll-wait-t4-194.sh, run-attempt-194.sh, run-analyzers-194.sh,
  distinct-seq-194.py). 13 đường dẫn không mới — đều first-seen đợt ≤193
  (xem first_seen trong recount-194-t01-final3.out).
- **Lũy kế 111–194 = 821/1.508/1.287/1.092** (= lũy kế 111–193 cộng delta
  đợt 194 tạm +7 batch / +34 entry / +25 đường dẫn / +20 file mới — trong
  33 đường dẫn đợt 194, 8 đường dẫn đã có trong hợp của cửa sổ 111–193
  nên chỉ +25 đường dẫn mới cho cửa sổ, và 20/33 là file mới toàn cục.) **Chờ push hiện tại (191+192+193+194, TẠM) =
  43/159/116/97.** **Tổng 1–194 = 1.469/7.378/4.075. Tổng 1–193 =
  1.462/7.344/4.055. Tổng 1–192 = 1.450/7.303/4.032. Tổng 1–191 =
  1.438/7.264/4.009.**
- **Tái kiểm vs quyết parent (q) đợt 193 — KHỚP TỪNG SỐ**: tái kiểm 111–193
  = 814/1.474/1.262/1.072 (quyết (q)-193: 814/1.474/1.262/1.072); tổng 1–193
  = 1.462/7.344/4.055 (quyết (q)-193: 1.462/7.344/4.055). Tái kiểm 111–192
  = 802/1.433/1.238/1.049 (KHỚP (q)-192); 111–191 = 790/1.394/1.213/1.026
  (KHỚP (q)-191); 111–190 = 778/1.349/1.173/995 (KHỚP (q)-189).
- **Chuỗi khớp: 123 (parent-193) → 124 (T01-194, mốc tạm) → 125 (T01-194,
  mốc cuối lần 3 này).** Cơ sở lần 125: hai phương pháp của T01 khớp từng
  số với nhau ở mốc cuối lần 3 (trạng thái ổn định, 7 file trước/sau);
  tái kiểm 111–193 khớp từng số với quyết parent (q) đợt 193; số đợt 194
  = trước (0) + delta 7 batch đã stage (T2/T8/T9 chưa stage nên số này là
  TẠM — T10-194 xác nhận lại sau closing).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.075 đường dẫn duy nhất, cả hai
  phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=4075`).
- **Kích thước LIMITS đợt 194 (đo bằng stat lúc T01 đóng) vs giới hạn push
  37.768 B — 7/11 CÓ: P1 14.902 B, P2 19.403 B, P3 19.092 B, P4 22.958 B,
  T4 37.758 B (dư 10 B — SÁT GIỚI HẠN), T56 36.925 B, T7 19.546 B** (đều
  dưới giới hạn); T01 này (ghi sau khi viết xong — vẫn dưới giới hạn).
  T2 đã có LIMITS trên đĩa (20.266 B) nhưng CHƯA stage (không có paths file
  + không có .done lúc T01 đóng — T10-194 kiểm lại). Aggregate 194 chưa có
  (T10-194 viết sau) — mọi aggregate đều vượt giới hạn push; lúc push cần
  `ENABLE_PRIVSEP=0`.
- **7/11 cờ lúc T01 đóng** (P1/P2/P3/P4/T4/T56/T7 — T2/T8/T9 thiếu; + cờ
  T01 = 8/11). Chuỗi 11/11 = 14 (quyết (q)-193) CHƯA nối được đợt này —
  T10-194 chốt sau khi các luồng còn lại stage (nếu đủ 11/11 trong hạn cứng
  thì chuỗi nối tiếp; nếu không đủ thì chuỗi đứt theo tiền lệ đợt 182/
  183/184/185).

## Giới hạn / sai số ghi nhận (F-194-T01-*)

- **F-194-T01-1 — Brief đợt này ĐÚNG số hiệu run (F-193-T01-1 KHÔNG lặp
  lại).** Bằng chứng (DB tươi): 6 run vcut-build-loop liên tiếp, sched cách
  nhau đúng 10.800 s — 82d3d1b9 sched 1795606551 SUCCEEDED (run 193);
  8c0c386d sched 1795617351 SUCCEEDED (run 194); e2fad6d2 sched 1795628151
  SUCCEEDED (run 195); 32dddfa5 sched 1795638951 SUCCEEDED (run 196);
  **c6cac684 sched 1795649751 SUCCEEDED 00:10:21Z (run 197)** — lượt đóng
  đợt 193 (T10-193); **8256daf7 sched 1795660551 RUNNING (run 198)** — lượt
  hiện tại, mở đợt 194. Brief ghi "lượt này = run 198" là ĐÚNG; T01 dùng
  "run 198" cho lượt hiện tại trong toàn bộ LIMITS + GAP §121 này.
  (F-194-T7-1 của T7-194 — "brief epoch run198 sai −400 s" — thuộc brief
  của T7, KHÔNG thuộc brief T01: brief T01 ghi đúng sched 02:35:51Z =
  1795660551, DB tươi khớp.)
- **F-194-T01-2 — boot_gen KHÔNG ổn định theo run — KHÔNG dùng chuỗi đổi
  gen làm bằng chứng boot nữa.** Bằng chứng (DB đọc tươi, 2 lần độc lập):
  run 196 (32dddfa5) T01-193 đọc lúc chạy là `cron_boot_26391d58…`
  (NOTES.md T01-193 + appendix193.txt — "đổi gen lần thứ 9"), nay đọc lại
  là `cron_boot_17dd01f5…`. Giá trị bị viết lại sau khi worker claim thật
  (started_at của run 196 cũng đổi theo: T01-193 đọc 1795638951 = sched,
  nay là 1795645358 = 22:42:38Z — lúc worker bắt đầu thật). Các giá trị đọc
  từ row của run ĐANG CHẠY (started_at, boot_gen) là TẠM và bị viết lại sau.
  Chuỗi "đổi gen lần thứ N liên tiếp trùng boot đã biết" (F-193-T01-3 đếm
  tới 9) KHÔNG còn đáng tin — T01-194 KHÔNG đếm chuỗi này nữa; gen run 198
  (84362c6b, đọc tươi cùng 1 truy vấn với a4315b57 của run 197) chỉ ghi
  nhận là "mới", không dùng đếm chuỗi. **T7-194 độc lập phát hiện cùng vấn
  đề (F-194-T7-2)** — hai luồng khớp nhau.
- **F-194-T01-3 — result_summary run 197 lặp lại câu chuyện điền sẵn
  §14.2-193 (nối tiếp F-193-T01-2/F-193-T7-2).** Bằng chứng (DB đọc tươi):
  result_summary c6cac684 ghi "§14.2 parent viết trực tiếp, trống hoàn
  toàn khi đọc" + "Aggregate 55.768 B sau quyết parent" — CẢ HAI mâu thuẫn
  với aggregate 193 bản parent-kiểm 56.830 B + ghi chú nguồn gốc CHƯA NGÃ
  NGŨ (parent KHÔNG có lượt nào lúc ~00:08Z). Các số đếm trong summary đó
  khớp (q)-193 (12/41/38/23; 814/1.474/1.262/1.072; 36/125/91/77;
  1.462/7.344/4.055) — chỉ 2 khẳng định nguồn gốc + kích thước aggregate
  là sai. **T01 KHÔNG dùng result_summary này làm nguồn** (chỉ trích dẫn
  làm bằng chứng); nguồn đứng duy nhất: aggregate 193 bản 56.830 B +
  LIMITS T01-193 + GAP §120 + log gốc + DB tươi (job_runs/events — số liệu
  thô, không lấy narrative). Ghi nhận: tiến trình điền sẵn còn viết cả vào
  DB result_summary, không chỉ file — parent lưu ý khi đọc result_summary
  các run sau. **T7-194 độc lập phát hiện cùng vấn đề (F-194-T7-3).**
- **F-194-T01-4 — Khoảng lặng scheduler 01:15:34–02:35:41Z (4.807 s) bao
  trùm btime — (m) trống là nhất quán với khoảng lặng chung, không phải
  bằng chứng riêng về boot.** Bằng chứng (DB đọc tươi): 0 event scheduler
  BẤT KỲ (mọi job) trong [01:15:34Z; 02:35:41Z]; event cuối trước khoảng
  lặng: succeeded 01:15:34Z (job khác); event đầu sau: reconciled
  02:35:41Z ("changed_jobs=3 new_runs=2") + dispatched run 198 02:35:51Z.
  `find /var/log -newermt 01:15:00 ! -newermt 02:28:08` = 0 file (không có
  hoạt động ghi log nào của VM trong khoảng lặng); journal trên đĩa chỉ có
  system.journal của boot mới; sampler T9-193 dừng 22:51:55Z (khi T9-193
  xong) nên không phủ khoảng lặng. **T7-194 phán đây là stall MỚI của
  daemon scheduler** (2 slot mất + 2 run trễ; reboot 02:28:08Z trong khoảng
  lặng) — phân loại thuộc T7-194 + parent; T01 chỉ ghi số liệu thô. Hệ quả
  cho số hiệu boot: boot lặng trong khoảng lặng (không run vcut nào active)
  không để lại requeue — T01 KHÔNG loại trừ được bằng dữ liệu scheduler
  một boot lặng trung gian trong [01:15:34Z; 02:35:41Z]; nhưng KHÔNG có
  bằng chứng VM-side nào ủng hộ nó (marker không đổi, journal/wtmp chỉ có
  boot mới, T10-193 đóng trên #118 lúc 23:58Z, run 197 chạy xong trên #118
  lúc 00:10:21Z) — cùng giới hạn như mọi boot 0-requeue trước (#109/#112/
  #114/#115/#117). Ứng viên #119 giữ nguyên theo hệ quả trực tiếp từ #118
  đã XÁC NHẬN; parent quyết (e).
- **F-194-T01-5 — Đếm TẠM của T01 chồng attempt1 T4 — attempt1 lớp B VI
  PHẠM; attempt2 KHÔNG liên quan T01.** Bằng chứng: exec đếm tạm của T01
  (pid 8115, 02:51:32–03:01:40Z, CPU 251 s) chồng gần trọn attempt1 T4
  (02:54:11–03:00:46Z); file class-B attempt1 nêu tên pid 8115 (lệnh
  `python3 recount-194-t01.py` + `bash crosscheck-194-t01.sh`) CÙNG job
  tsc/parity của P4 (pid 27502) và daemon T9 — attempt1 20/20 NHƯNG B1
  (load5 cuối 5,89) + B2 (load1 max 15,11) VI PHẠM, verdict KHÔNG dùng được,
  T4 retry. T01 KHÔNG khẳng định mình là nguyên nhân duy nhất (3 nguồn
  tải cùng nêu tên; CPU trung bình của đếm tạm ~0,41 core) — chỉ ghi nhận
  sự chồng lấn và tên trong file class-B. **Bài học (áp dụng ngay trong đợt
  này): đếm CUỐI chỉ chạy khi T4 không còn attempt đang chạy** — đếm cuối
  lần 1 (03:43:33Z) và lần 2/3 chạy SAU khi attempt3 T4 xong 03:41:10Z.
  Attempt2 (03:29:23–03:33:20Z): file class-B chỉ nêu daemon T9 + chính
  vite T4 — KHÔNG có process nào của T01 (việc nặng cuối của T01 là O8,
  xong 03:17:31Z; chỉ còn sleep + sửa NOTES 03:22:37Z) — vi phạm attempt2
  KHÔNG liên quan T01. **P3/P4 cũng tự báo chồng lấn** (F-194-P3-1: build
  P3 chồng đầu pha (b) attempt1 + tsc cuối chồng đầu pha (b) attempt2;
  F-194-P4-1: 2 lần harness nặng chồng pha (b) attempt1/attempt2) — phân
  loại vi phạm (p) thuộc T2-194 + parent; T4 ghi "0 vi phạm phía T4".
- **F-194-T01-6 — Hai lần đếm cuối đầu KHÔNG dùng được (lỗi file P3 + đua
  với batch T4); số trong LIMITS này là đếm cuối lần 3 (trạng thái ổn
  định).** (i) File paths P3 thiếu NUL cuối: `phase9-round194-p3-reverse-
  smooth.txt` 294 B, 6 NUL, 7 entry thật — python đếm 29 entry đợt 194,
  shell đếm 28 (đếm theo số NUL). P3 `.done` ghi "7 entry NUL" nhưng file
  thiếu terminator cuối (od xác nhận: kết thúc `...LIMITS.md` không có
  `\0`). **T01 đã vá: append 1 byte NUL** (294 → 295 B, 7 NUL, 7 entry;
  backup `/tmp/p3-paths-before-fix.bak`; không đổi nội dung đường dẫn nào)
  — sau vá, purity warnings = 0 ở mọi lần đếm sau. (ii) Đếm cuối lần 2
  (03:49:12–03:53:06Z) đua với batch T4 (stage 03:51:16Z, giữa lúc đếm):
  python (chạy trước) = 6 batch, shell (chạy sau) thấy 7 batch ở các báo
  cáo sau nhưng union xây từ đầu nên uniq vẫn 4070 — NỘI BỘ KHÔNG NHẤT
  QUÁN, bỏ. (iii) Đếm cuối lần 3 (03:53:58–04:02:10Z): 7 file đợt 194 lúc
  bắt đầu VÀ lúc kết thúc — hai phương pháp KHỚP TỪNG SỐ ở mọi dòng
  (xem recount/crosscheck-194-t01-final3.out). T10-194 chạy lại sau closing
  theo đúng quy trình.
- **F-194-T01-7 — O8 chạy trong khe giữa 2 attempt T4 — 0 chồng lấn, gate
  được kiểm trước VÀ trong lúc chạy.** Lúc T01 acquire lock (03:12:27Z):
  lock TRỐNG (chờ 1s), cờ POSTBOOT_PASS đã CÓ (02:50:55Z), attempt1 T4 đã
  xong 03:01:51Z, attempt2 chưa mở — T01 acquire lock, giữ 5m04s. Trong lúc
  O8 chạy, poll #23–#29 của T4 (03:12:30–03:17:10Z) ghi nhận lock của T01,
  không mở attempt (attempt2 mở 03:29:23Z, sau khi load do O8 gây ra đã
  rã). Giống F-193-T01-6: O8 ngắn (5m05s), gate đã xanh TRƯỚC khi chạy
  (cờ + lock trống + T4 chỉ poll), và T01 kiểm lại TRONG lúc chạy qua poll
  của T4. **Đánh giá O8 boot mới theo mốc chuỗi (quyết (b) đợt 193 — FULL
  PASS GIỮ 0):** chân O8 T01 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium
  21/21, sau cờ 21m31s, cùng boot 55c9e0b7, cờ repair-sớm-quyết-h poll=1 —
  mode/caveat thuộc T56-194 + parent). FULL PASS đợt 194 KHÔNG THỂ (T4-194
  .done: #62 0/3 attempt hợp lệ — chân lượt yên gãy; live-check #13 KHÔNG
  THỂ KIỂM) — thuộc T10-194 + parent.
- **F-194-T01-8 — Nguồn dùng trong LIMITS này: §14.2 aggregate 193 BẢN
  PARENT-KIỂM (56.830 B; quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần
  thứ 123; nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18; các lần sạch vẫn
  179/183/191) + LIMITS T01-193 + §120/§121 GAP + log gốc (boot-survey-
  194t01, appendix194, replay-watch-194, poll-t4/chain-t4-194, POSTBOOT_PASS
  boot mới + backup #117, o8-194t01.log) + DB tươi (muse.db job_runs +
  events) + cờ .done P1/P2/P3/P4/T4/T56/T7-194 (chỉ trích dẫn, không xác
  minh lại nội dung chuyên môn).** Các quyết THẬT dùng: (a) CHẤP NHẬN đợt
  193; (b) FULL PASS GIỮ 0 (KHÔNG THỂ); (c) POSTBOOT_PASS #117 CÓ caveat,
  #116 KHÔNG CÓ cờ, tổng boot không cờ 26 → 27; (d) INSIDE #113/#114 KHÔNG
  TÍNH ĐƯỢC, chuỗi GIỮ 7; (e) 1c0bcaad = #117 XÁC NHẬN, 8a23277a = #118 XÁC
  NHẬN, marker 70; (f) (m) #116 DƯƠNG CUỐI, n ứng viên GIỮ 51/52, (m)
  #117/#118 thuộc T2-194; (g) n chính thức GIỮ 14; (h) E-247 MỞ LẠI; (i)
  holder chuỗi 19 → 20 → 21; (j) harness 6/6, 84l10 PASS chuỗi 0 → 1,
  86n2-P1 lần 15, log sạch 31 → 34, B2 vùng mới sạch lần 7, B1 live sạch
  0 → 1, V2 phương án chính, V4 BẬT LIVE từ đợt 194; (k) replay #117 KHÔNG
  CHẠY (dạng B); (l) headroom chuỗi "0 lần 51" ĐỨT, ENOSPC lần 41, birefnet
  0 lần 46; (m) lượt yên #61 KHÔNG CÓ LƯỢT HỢP LỆ, chuỗi GIỮ 0, P3' GIỮ
  50, labellag 0 occ; (n) run 194 CA #24, họ 24/21, chuỗi SUCCEEDED
  1 → 2 → 3, cửa slot 193 LÀNH chuỗi 2 → 3, HB 50/573, DR 55/358, OUTAGE
  bàn giao T7-194 phán cuối; (o) auto-trigger GIỮ LIVE (481 mẫu, 0 FIRE);
  (p) F-193-T56-3 VI PHẠM NHẸ, chuỗi 0 vi phạm 1 → 0 (ĐỨT), live #12 KHÔNG
  THỂ KIỂM (chuỗi GIỮ 9); (q) đếm cuối đợt 193 = 12/41/38/23, lũy kế 111–193
  = 814/1.474/1.262/1.072, chờ push = 36/125/91/77, tổng 1–193 =
  1.462/7.344/4.055, chuỗi khớp 123, chuỗi 11/11 = 14; (r) KHÔNG PUSH. T01
  KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong LIMITS này không
  bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/
  (q) theo bản parent-kiểm).

## Phạm vi chưa kiểm (không thuộc T01)

- Số hiệu boot mới 55c9e0b7 = #119 (ứng viên — parent quyết (e) ở aggregate
  194); (m) boot mới THÔ 0 requeue (T2-194 phân loại CUỐI); POSTBOOT_PASS
  cho boot mới chi tiết + mode/caveat (T56-194); lượt yên #62 (T4-194);
  harness + O8 bộ thứ hai + B2 + B1 (T8-194); #118/#119 có giết holder không
  (T56-194: cả hai KHÔNG giết, chuỗi 21 → 22 → 23); headroom + ENOSPC +
  E-247 + auto-trigger live lần FIRE thật đầu tiên (T9-194); kết quả sản
  phẩm P1–P4 đợt 194 (T01 không xác minh lại nội dung chuyên môn — chỉ trích
  dẫn cờ P1/P2/P3/P4-194).
- (m) #117/#118 + INSIDE #113/#114/#115 + (m) #56 (T2-194); kết cục run 196
  + run 197 + run 198 + HB/DR + cửa slot đợt 194 + OUTAGE #2 điều tra "cố
  định theo giờ" (T7-194 đã phán cuối: mẫu cũ DỨT + stall daemon lặng MỚI);
  kết cục run 198 thuộc T7-195.
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-194); không kiểm lại
  nguyên nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/appendix194.py` + `appendix194.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/boot-survey-194t01.sh`
  + `boot-survey-194t01.txt` (output thô 9 nguồn boot mới — đo tươi 02:46:33Z;
  script adapt từ 193; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/recount-194-t01.py` +
  `recount-194-t01-temp.out` + `recount-194-t01-final.out` +
  `recount-194-t01-final2.out` + `recount-194-t01-final3.out` +
  `crosscheck-194-t01.sh` + `crosscheck-194-t01-temp.out` +
  `crosscheck-194-t01-final.out` + `crosscheck-194-t01-final2.out` +
  `crosscheck-194-t01-final3.out`
  (hai phương pháp đếm viết mới hoàn toàn; mốc tạm ~02:51–03:01Z, mốc cuối
  lần 1 03:43:33–03:47:58Z, lần 2 03:49:12–03:53:06Z, lần 3 (CHỐT)
  03:53:58–04:02:10Z — xem F-194-T01-6)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/o8-driver-194t01.sh` +
  `o8-194t01.log` + `o8-lock.log` + `o8-driver-194t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-194t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-t01/gap121-draft.md`
  (bản nháp GAP §121 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
