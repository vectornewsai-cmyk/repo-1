# PHASE9_ROUND191_T01_BOOT_VERIFY_LIMITS.md

Đợt 191 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §118).
Mở lượt cron 15:35 +07 25/11/2026 (= 08:35:51Z); survey đo tươi 08:44:31Z, O8
08:48:14–08:51:44Z, đóng ~10:47Z 25/11/2026 (trong hạn cờ ~11:00Z). Chỉ đọc +
ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.
Nguồn đứng: **§12.3 aggregate 189 BẢN PARENT-KIỂM (78.048 B sau đính chính;
parent kiểm đếm KHỚP TỪNG SỐ lần thứ 112, dedup python viết mới
/tmp/count-189-parent.py; nguồn gốc CHƯA NGÃ NGŨ — tổng điền sẵn GIỮ 18)** +
LIMITS T0-189 + LIMITS T1-189 + §117 GAP. T01 KHÔNG khẳng định §12.3-189 do
parent viết trực tiếp (theo hồ sơ đứng AGENTS.md/MEMORY.md: parent kiểm độc
lập trong lượt 12:53 +07 và CHẤP NHẬN với hai đính chính (h)/(q)).

**BỐI CẢNH: đợt 190 VOID, đợt 191 là đợt đầu tiên theo hướng mới của user
(15:03 25/11/2026 — ƯU TIÊN hoàn thiện sản phẩm; Editing Core — parity
preview/render).** 11 luồng: P1–P4 sản phẩm + T01/T2/T4/T56/T7/T8/T9 nền
(gộp T0+T1→T01, T5+T6→T56). T10-191 dời sang lượt cron 18:35 +07 (theo mẫu
188/189 — MEMORY.md ghi nhận ngoài, T01 không sửa MEMORY.md).

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 08:44:31Z)**: boot_id
  `b0aab705-7ef5-47fd-95e0-e97910fbfa88` (khác boot trước `f7632121`); btime
  **08:25:43Z** (epoch 1795595143; uptime bracket khớp cùng giây —
  `uptime -s` 08:25:43Z, /proc/stat btime 1795595143, /proc/uptime 1.127,48 s
  lúc 08:44:31Z → boot_est = btime +0,52 s; /proc/1 start_ticks 1181 = btime
  +11,81 s, stat mtime 08:25:55.382Z = btime +12,38 s; journal idx 0 duy
  nhất, first 08:25:55Z = btime +12 s; wtmp begins 08:25:55Z; `last` reboot
  08:25 still running; `who -b` Nov 25 08:25; Cloudflare đo chặt (local mid
  08:44:31Z vs CF-Date 08:44:33 GMT, chênh +2 s — CF trước local ~1–2 s sau
  khi trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, cùng dấu F-189-T0-2; DB:
  0 requeue quanh btime (xem dưới); marker mtime không đổi).
  Gap #113→#114 = **13.759 s (3h49m19s) — DÀI NHẤT chuỗi gần đây** (vượt
  #111→#112 12.155 s; #112→#113 7.385 s). Boot mới xảy ra SAU khi run 190
  finished (05:01:25Z), TRƯỚC khi đợt 191 mở (08:35:51Z). **Không có reboot
  mới trong phiên T01** (kiểm cuối 10:45:54Z boot vẫn b0aab705).
- **Số hiệu #114 — ỨNG VIÊN (parent quyết (e) ở §12.3-191)**: chuỗi quyết
  (e)-186 cea79500 = #107 → 7ea9d047 = #108, 6f1d9f87 = #109, 912f4a97 =
  #110; (e)-187 257c1eae = #111; (e)-188 boot #112 27e6714f thuộc đợt 189;
  #113 = f7632121 (btime 04:36:24Z — HỒ SƠ, xem dưới; T2-191/T8-191/T56-191
  đều dùng số hiệu này, parent chưa quyết chính thức vì T0-190 không tồn
  tại) → b0aab705 = **#114** theo hệ quả trực tiếp. T01 xác minh 9 nguồn
  tươi cho #114, KHÔNG trình bày hai cách đếm.
- **#113 — XÁC MINH TỪ HỒ SƠ (không có 9 nguồn tươi — T0-190 không tồn
  tại)**: f7632121-7352-4543-b6ce-3fab71609e44, btime 1795581384 = 04:36:24Z
  (T7-189 appendix189.py/txt — uptime 0' lúc 04:37:06Z, 11' lúc 04:48:21Z;
  T9-189 ram-sampler.log ghi boot=f7632121 từ 04:38:13Z). DB đọc tươi lại:
  eid 10947 còn trong DB (run 190 eb18559f, 04:36:59.149752Z). wtmp KHÔNG
  dùng được cho #113 (file chỉ giữ boot hiện tại, 384 B). **(m) #113 THÔ:
  +35,150 s** (T7-189 ghi +35,149 s — cùng giá trị, làm tròn khác) — TRONG
  [33; 49,8], trên biên dưới 2,150 s, SÁT BIÊN DƯỚI. **T2-191 đã phán CUỐI
  cấp T2: (m) #113 DƯƠNG** (+35,149752 s; n ứng viên 50/51 → 51/52) —
  phân loại cuối thuộc T2-191 + parent, T01 chỉ ghi số thô + đối chiếu.
- **Marker sống qua 66 reboot (#49–#114)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). Khớp công thức N−48 (T0-189: 64 qua
  #112; T8-191 cũng ghi 66).
- **(m) #114 — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-191 + parent)**:
  **0 event `requeued_after_restart`** trong [08:20:00Z, 08:35:00Z] và trong
  cả 25/11 00:00–09:00Z chỉ có eid 10947 (#113 — DB đọc tươi). Không run nào
  sống tại btime: run 189 (98271fb8) SUCCEEDED 02:19:17Z = btime −21.986 s
  (6h06m26s TRƯỚC btime); run 190 (eb18559f) SUCCEEDED 05:01:25Z = btime
  −12.258 s (3h24m18s TRƯỚC btime; sched→finished 8.734 s, budget 10.800 s
  → margin +2.066 s; claimed→finished 63 s; started_at_utc viết lại
  04:36:59Z sau requeue #113; boot_gen đổi sang cron_boot_9a3a6bd6...);
  run 191 (d3d9408b) sched/started/claimed 08:35:51Z = **btime +608 s**,
  status running lúc đọc, boot_gen cron_boot_cdd48e77... (boot mới). Cửa (m)
  [btime+33; btime+49,8] = [08:26:16Z; 08:26:32Z] trống. **Khác #113**
  (1 requeue vì run 190 spanning): ở đây 0 requeue vì không run nào spanning —
  cùng mẫu #109/#112 (0 requeue, không run spanning). Phân loại thuộc T2-191 +
  parent.
- **POSTBOOT_PASS #114 ĐÃ CÓ 08:45:57Z (T56-191; T01 chỉ ghi nhận + xác minh
  độc lập)**: file `round191-t56/POSTBOOT_PASS`, 315 B, md5
  288f863b3ccc5c126e6a58548d32478b; mode **replay-đầy-đủ, poll=0**; dpkg
  **1.468** dòng (= `wc -l /var/log/dpkg.log` T01 kiểm độc lập lúc ~08:47Z —
  nguồn thứ ba khớp cờ + watcher), cache 170 .deb, lists 37; postboot PASS
  poll0 độc lập exit 0 lúc 08:45:57Z; **boot+20m14s** (NHANH NHẤT chuỗi —
  #112 boot+37m52s, #111 boot+60m52s); cờ cũ #112 backup
  `POSTBOOT_PASS-27e6714f`. Mode/caveat thuộc T56-191 + parent (T56 đề xuất
  KHÔNG caveat; replay #114 KHÔNG ĐÌNH TRỆ). **POSTBOOT_PASS #113 KHÔNG CÓ**
  (T56-191 grep toàn cây: 0 file nhắc f7632121 — tổng boot không cờ 25 → 26
  đề xuất). **T01 KHÔNG phải chờ cờ** (cờ #114 về trước khi T01 chạy O8 —
  khác T0-189 chờ 25m02s). dpkg 1.468 (KHỚP lại mức #109/#110; khác #112:
  1.461 — hơn 7 dòng).
- **libevent CÓ lúc survey (boot+18m48s)** — khác #112 (VẮNG lúc mở boot
  +9m53s, CÓ sau replay — heal). T01 không phân biệt được "có từ đầu boot"
  hay "đã heal bởi replay sớm" (survey đầu tiên của T01 là boot+18m48s, sau
  khi replay-watch đã chạy); O8 KHÔNG bị ảnh hưởng (WebKit dùng DEBROOT +
  libevent đã có trước O8; launch version 27.2, 0 lỗi).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (08:48:14–08:51:44Z, 3m30s)**: sau cờ 2m17s (nhanh hơn đợt 189: 7m19s).
  WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 08:48:28.551Z, Playwright
  mouse click lần 2; launched version 27.2 08:48:20.547Z), JSON 21 results,
  21 ok=true, md5 `eb0d54dd735789a96c3cb23ee0234d5a`; attempt2 exit=0, **21/21
  PASS** (S1 PASS 08:49:28.772Z), JSON 21 results, 21 ok=true, md5
  `1331ea118fe4608dcfb72bc3b25b7483`; Chromium exit=0, **21/21 PASS** (S1
  PASS, CDP mouse click), JSON 21 results, 21 ok=true, md5
  `8f025b46e34ba8759445fd728e5997bb`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:8861/
  8851 bridge OK). Script gốc KHÔNG đổi so với đợt 189 (preview.tsx
  530e10a7, webkit 4994b4fc, headed c8acd72e). dpkg.log 1.468 dòng trên boot
  mới (khớp cờ T56-191).
- **0 attempt chồng — O8 chạy TRƯỚC attempt T4 (đảo thứ tự so với đợt 189,
  như đợt 187/188)**: T4-191 poller thật bắt đầu 08:48:34Z (GIỮA cửa sổ O8),
  chỉ poll, chưa mở attempt; T01 acquire lock 08:48:14Z khi lock TRỐNG,
  giữ 3m30s, đã nhả; attempt1 T4 chạy 09:03:40–09:07:10Z (SAU khi O8 xong
  11m56s), exit=0, 20/20 + class B 5/5 + tickCost median 42,0 ms — LƯỢT
  HỢP LỆ #59 (chuỗi 1 → 2 đề xuất; live lần 10 ĐẠT — theo cờ T4-191).
  Lock TRỐNG sau O8. T8-191 xác nhận độc lập: O8 T01 PASS 3/3 trên #114
  (md5 khớp), O8 T8 3/3 (WebKit md5 7dad1c5b/dd7ddcc2; Chromium 8072df60),
  harness 6/6 — **FULL PASS CÓ, đề xuất chuỗi 1 → 2** (5/5 chân cùng boot
  #114; lần thứ hai liên tiếp — parent quyết cuối).
- X11: 0 process Xvfb sót, 0 socket sau O8 (kiểm 08:52:48Z); display O8 của
  T01 (:191/:198) không để lại socket. (T56-191 ghi nhận 2 socket X193+X93
  của T4-191 lúc 09:09Z — sau O8 của T01, không phải của T01.)
  Boot lúc T01 đóng vẫn b0aab705. Không có reboot mới trong phiên T01.
  LIMITS này ~24 KB.

## Đếm — MỐC ĐẾM TẠM (9/11 cờ; T7/T9 thiếu — xem F-191-T01-7)

- **Verdict: TẠM — PASS với 9/11 batch, KHÔNG đính chính đếm.** Tái kiểm
  111–189 KHỚP quyết parent (q) đợt 189 TỪNG SỐ; đợt 190 = 0/0/0/0 (VOID);
  0 file thiếu; chuỗi khớp nối dài lần thứ 113 (xem dưới). Số cuối đợt 191
  CHƯA CHỐT — T10-191 chạy lại hai phương pháp sau closing (lượt cron
  18:35 +07) và cộng batch closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-191-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-191-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
  Cả hai phương pháp chạy 1 LẦN mỗi phương pháp ở mốc này (10:44–10:45Z),
  exit 0, KHỚP TỪNG SỐ với nhau ở mọi mốc đếm.
- **Mốc đếm (10:44–10:45Z; T7/T9 CHƯA stage)**: quét **1.435 file**
  `phase9-round*.txt` (round 1–191, round thiếu duy nhất: 190 — VOID);
  purity 0 cảnh báo; tổng entry thô 7.260; tổng đường dẫn duy nhất toàn cục
  4.006.
- **Đợt 191 (TẠM) = 9/41/39/28** (9 batch: p1/p2/p3/p4/t01/t2/t4/t56/t8 —
  entry theo batch: 8+6+11+6+2+1+5+1+1 = 41; 39 đường dẫn; 28 file mới;
  11 đường dẫn duy nhất không mới: GAP (first-seen đợt 59) + 10 file nguồn
  đã có mà các luồng sản phẩm sửa (audioEngine.ts đợt 3, enhancePreview.ts
  đợt 60, enhancePreview60Q1.test.ts đợt 60, enhancePreview62R3.test.ts
  đợt 62, reversePlayback.ts đợt 27, reverseWebcodecs.ts đợt 33,
  preview.tsx đợt 1, tsconfig.json đợt 1, audio.js/audio.ts đợt 3).
  28 file mới gồm 9 LIMITS (P1/P2/P3/P4/T01/T2/T4/T56/T8) + 19 file code/
  script/kết quả (4 script T4, 1 script T2 test-audioengine.sh, 2 script
  parity191, 10 file lib/test voice/reverse/parity, 1 test enhance P2, 1
  JSON kết quả P3 — xem first-seen đầy đủ trong recount-191-t01.out).
- **Lũy kế 111–190 = 778/1.349/1.173/995** (= lũy kế 111–189 cộng 0 — đợt
  190 VOID). **Chờ push hiện tại (chỉ đợt 191, sau PUSH #9) = 9/41/39/28.**
  **Tổng 1–191 = 1.435/7.260/4.006/4.006. Tổng 1–190 = 1.426/7.219/3.978/3.978.
  Tổng 1–189 = 1.426/7.219/3.978/3.978.**
- **Tái kiểm vs quyết parent (q) đợt 189 — KHỚP TỪNG SỐ**: tái kiểm 111–189
  = 778/1.349/1.173/995 (quyết (q)-189: 778/1.349/1.173/995); tổng 1–189 =
  1.426/7.219/3.978 (quyết (q)-189: 1.426/7.219/3.978). Tái kiểm 111–188 =
  768/1.333/1.159/981 (KHỚP (q)-188); 111–187 = 758/1.317/1.145/967 (KHỚP
  (q)-187).
- **Chuỗi khớp: 112 (parent-189) → 113 (T01-191, lần này).** Cơ sở lần 113:
  hai phương pháp của T01 khớp từng số với nhau ở mọi mốc; tái kiểm 111–189
  khớp từng số với quyết parent (q) đợt 189; số đợt 191 = trước (0) +
  delta 9 batch đã stage (T7/T9 chưa stage nên số này là TẠM — T10-191 xác
  nhận lại sau closing).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.006 đường dẫn duy nhất, cả hai
  phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=4006`).
- **Kích thước 9 LIMITS đợt 191 (đo bằng stat 10:45:54Z) vs giới hạn push
  37.768 B — 0/9 VƯỢT**: P1 11.749 B, P2 12.617 B, P3 17.824 B, P4 17.610 B,
  T01 18.982 B (+~2,5 KB sau khi điền §Đếm này — vẫn dưới xa), T2 21.752 B,
  T4 37.760 B (dư 8 B), T56 37.762 B (dư 6 B), T8 37.756 B (dư 12 B).
  **CẢNH BÁO: T56 (dư 6 B), T4 (dư 8 B), T8 (dư 12 B) đều nằm trong 12 B
  dưới giới hạn** — bất kỳ lần sửa/gộp muộn nào chạm 3 file này đều vượt
  (tiền lệ đợt 187 T5 đã vượt thật). **Lệch nhỏ ghi nhận: cờ T4-191 ghi
  LIMITS 37.758 B nhưng stat trực tiếp lúc 10:45:54Z = 37.760 B (+2 B —
  có thể file được sửa sau khi cờ viết; vẫn dưới giới hạn, không ảnh hưởng
  đếm).** Aggregate 191 chưa có (T10-191 viết sau) — mọi aggregate đều vượt
  giới hạn push; lúc push cần `ENABLE_PRIVSEP=0`.
- **9/11 cờ lúc T01 đóng** (P1, P2, P3, P4, T01, T2, T4, T56, T8 — T7/T9
  thiếu). Chuỗi 9/9 = 11 (quyết (q)-189) CHƯA nối được đợt này — T10-191
  chốt sau khi T7/T9 stage (nếu đủ 11/11 trong hạn cứng thì chuỗi nối tiếp).

## Giới hạn / sai số ghi nhận (F-191-T01-*)

- **F-191-T01-1 — #113 chỉ xác minh từ HỒ SƠ, không có 9 nguồn tươi
  (không đổi verdict, parent quyết số hiệu).** Bằng chứng: T0-190 không tồn
  tại (đợt 190 VOID — 0 agent, 0 file, 0 cờ); btime #113 04:36:24Z lấy từ
  T7-189 appendix189.py/txt (tính từ uptime 0' lúc 04:37:06Z + 11' lúc
  04:48:21Z) + T9-189 ram-sampler.log (boot=f7632121 từ 04:38:13Z); DB đọc
  tươi lại xác nhận eid 10947 (requeue run 190, 04:36:59.149752Z) còn trong
  DB. journal chỉ giữ boot hiện tại; wtmp chỉ giữ boot hiện tại (384 B) —
  cả hai đều KHÔNG xác minh được #113. Số hiệu #113 (và hệ quả #114) chờ
  parent quyết (e) ở §12.3-191; các luồng T2/T8/T56-191 đã dùng số hiệu này
  trong LIMITS của họ — nếu parent quyết khác, chỉ đổi nhãn, không đổi số
  đo (btime/requeue/gap đều đo từ epoch thô).
- **F-191-T01-2 — Dấu chênh Cloudflare giữ nguyên cách ghi F-189-T0-2
  (CF − local).** Bằng chứng: local mid 1795596271, CF-Date 1795596273 →
  CF − local = +2 s → local CHẬM ~1–2 s sau khi trừ mạng. Verdict "đồng hồ
  ĐÚNG trong ±2 s" KHÔNG ĐỔI; mọi phép tính gap/btime dùng đồng hồ local
  nhất quán nên không bị ảnh hưởng.
- **F-191-T01-3 — libevent CÓ lúc survey không phân biệt được nguồn gốc
  (có từ đầu boot hay heal bởi replay).** Bằng chứng: survey đầu tiên của
  T01 lúc boot+18m48s (sau replay-watch-191 chạy 08:45:57Z); T0-189 survey
  lúc boot+9m53s nên bắt được trạng thái VẮNG. Không ảnh hưởng O8
  (libevent đã có trước O8). Các đợt sau muốn bắt trạng thái mở boot thì
  survey trong 10' đầu sau btime.
- **F-191-T01-4 — (m) #114: 0 requeue — T01 chỉ ghi số, KHÔNG phân loại
  (thuộc T2-191 + parent).** Bằng chứng (DB đọc tươi): 0 event
  `requeued_after_restart` trong [08:20:00Z, 08:35:00Z] và trong cả 25/11
  00:00–09:00Z chỉ có eid 10947 (#113); run 189 finished btime −21.986 s;
  run 190 finished btime −12.258 s; run 191 sched btime +608 s; cửa
  [btime+33; btime+49,8] trống. Trong chuỗi #102–#113, mọi reboot có run
  spanning đều có ≥1 requeue tại btime +~35–44 s; #114 nối lại mẫu 0
  requeue của #109/#112 (cả ba đều KHÔNG CÓ run spanning).
  **(m) #113 đối chiếu thô: +35,150 s** (eid 10947) — T2-191 phán DƯƠNG
  (CUỐI cấp T2), n ứng viên 50/51 → 51/52.
- **F-191-T01-5 — POSTBOOT_PASS #114 là replay-đầy-đủ poll=0 (mode/caveat
  thuộc T56-191 + parent).** T01 ghi nhận: replay-đầy-đủ, poll=0, dpkg
  1.468 (khớp 3 nguồn: cờ + watcher + `wc -l /var/log/dpkg.log` độc lập),
  cache 170, lists 37, postboot PASS poll0 độc lập exit 0 08:45:57Z,
  boot+20m14s (nhanh nhất chuỗi). **POSTBOOT_PASS #113 KHÔNG CÓ** — tổng
  boot không cờ 25 → 26 (đề xuất, parent quyết). **Watcher-189 chết
  04:36:20Z** (trước btime #113 4 s); khoảng không-watcher ~4h09m37s (dài
  nhất, bao 2 boot — theo cờ T56-191).
- **F-191-T01-6 — O8 chạy TRƯỚC attempt T4 — 0 chồng lấn, gate được kiểm
  trước VÀ sau lúc chạy.** Lúc T01 acquire lock (08:48:14Z): lock TRỐNG,
  T4 poller thật chưa bắt đầu (bắt đầu 08:48:34Z, chỉ poll trong cửa sổ O8),
  apt=0 — T01 acquire lock, chờ 0 s. Không còn poll T4 nào trong cửa sổ O8
  mở attempt (attempt1 T4 09:03:40–09:07:10Z, sau O8 11m56s). Khác đợt 189
  (T0 chạy sau khi T4 mở attempt): đợt này T01 chạy trước vì cờ về sớm
  (boot+20m14s) — T01 chạy ngay là hợp lệ, lock là cơ chế serialize duy
  nhất. Phán cuối về lượt yên #59 thuộc T4-191 + parent (T01 chỉ ghi:
  attempt1 20/20 + class B 5/5 + median 42,0 ms ≤ 60).
  **Đánh giá O8 boot mới theo mốc chuỗi (quyết (b) đợt 189 — FULL PASS 0 →
  1):** chân O8 T01 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium 21/21,
  sau cờ 2m17s, cùng boot b0aab705, cờ replay poll=0 — mode/caveat thuộc
  T56-191 + parent). T8-191 đề xuất FULL PASS CÓ, chuỗi 1 → 2 (5/5 chân
  cùng boot #114) — parent quyết cuối ở §12.3-191.
- **F-191-T01-7 — Đếm TẠM 9/11 (T7/T9 CHƯA ĐÓNG CỜ lúc T01 đóng — xem §Đếm).**
  Lúc T01 chạy đếm (10:44–10:45Z): 8/11 cờ đã có (P1 09:5xZ, P2, P3, P4, T2
  10:00Z, T4 09:25Z, T56, T8 10:01Z) + cờ T01 = 9/11; T7 (chỉ có
  appendix191.py 08:56Z, chưa có LIMITS/paths/.done) và T9 (sampler vẫn
  chạy, mẫu cuối 10:43:05Z; chưa có LIMITS/paths/.done) CÒN CHẠY. Số đếm
  trong LIMITS này là TẠM — T10-191 (lượt cron 18:35 +07) chạy lại hai
  phương pháp sau closing và chốt số cuối. Chuỗi khớp ở §Đếm tính trên mốc
  tạm này; T10-191 xác nhận lại.
- **F-191-T01-8 — Nguồn dùng trong LIMITS này: §12.3 aggregate 189 BẢN
  PARENT-KIỂM (quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần thứ 112;
  nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18) + §12.3 aggregate 188 +
  LIMITS T0-189/T1-189 + log gốc (boot-survey-191t01, appendix191,
  replay-watch-191, poll-t4/chain-t4-191, POSTBOOT_PASS #114 + backup #112,
  o8-191t01.log) + DB tươi (muse.db job_runs + events) + cờ .done của 8
  luồng đã đóng (chỉ trích dẫn, không xác minh lại nội dung chuyên môn).**
  Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 189; (b) FULL PASS 0 → 1; (c)
  POSTBOOT_PASS #112 KHÔNG caveat, tổng boot không cờ GIỮ 25; (d) INSIDE
  #107–#111 KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; (e) 257c1eae = #111, boot #112
  27e6714f thuộc đợt 189; (f) (m) #111 DƯƠNG (CUỐI), (m) #112 KHÔNG CÓ
  ĐIỂM, n ứng viên 50/51; (g) n chính thức GIỮ 14; (h) E-245+E-246 GỘP
  (đánh số lại E-247→E-246, E-248→E-247); (i) holder chuỗi 15 → 16; (j)
  84l10 PASS chuỗi 9, 86n2-P1 chuỗi 12, B2 vùng mới sạch lần 4, B1 live
  sạch khởi động lại lần 1, log sạch chuẩn 27; (k) replay #112 KHÔNG ĐÌNH
  TRỆ; (l) headroom 0 lần 49, ENOSPC lần 38, birefnet 0 lần 43; (m) lượt
  yên #58 HỢP LỆ, chuỗi 0 → 1; live lần 9 ĐẠT (chuỗi 7 → 8); (n) run 189
  SUCCEEDED (CA #21), cửa slot LÀNH chuỗi 3, OUTAGE #2 ĐƯỢC ỦNG HỘ MẠNH
  (giao T7-194 phán cuối); (o) auto-trigger GIỮ LIVE; (p) chuỗi 0 vi phạm
  4 → 5; (q) đếm cuối đợt 189 = 10/16/15/14, lũy kế 111–189 =
  778/1.349/1.173/995, chờ push 166–189 = 240/370/335/331, chuỗi 9/9 = 11;
  (r) KHÔNG PUSH. T01 KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8
  trong LIMITS này không bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham
  chiếu (b)/(c)/(g)/(n)/(p)/(q) theo bản parent-kiểm).
- **Ghi nhận ngoài luồng (chỉ quan sát, không phán tác giả):** MEMORY.md bị
  sửa từ bên ngoài trong phiên T01 (hệ thống cập nhật ~08:4xZ: mục "Đợt 190
  — VOID, KHÔNG TỒN TẠI" + mục "Đợt 191 (mở lượt cron 15:35 +07)"); T01
  KHÔNG sửa MEMORY.md/AGENTS.md/build-loop-log.md.

## Phạm vi chưa kiểm (không thuộc T01)

- Số hiệu #114 (ứng viên — parent quyết (e) ở §12.3-191); (m) #114 + INSIDE
  #112/#113 + (m) #56 (T2-191); kết cục run 191 + HB/DR + cửa slot đợt 191 +
  OUTAGE #2 điều tra "cố định theo giờ" (T7-191; T7-193 kiểm onset khung
  25/11, T7-194 phán cuối); POSTBOOT_PASS #114 chi tiết + mode/caveat
  (T56-191); lượt yên #59 (T4-191 — attempt1 hợp lệ, phán cuối thuộc T4-191
  + parent); harness + O8 bộ thứ hai + B2 + B1 điều tra kẹt P5 đợt 188
  (T8-191); #113/#114 có giết holder không (T56-191: KHÔNG giết → chuỗi 16
  → 18 đề xuất); headroom + ENOSPC + E-247 + auto-trigger live lần FIRE thật
  đầu tiên (T9-191); kết quả sản phẩm P1–P4 (voice effects / enhance /
  reverse / parity harness — T01 không xác minh lại nội dung chuyên môn).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-191); không kiểm lại
  nguyên nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round191-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round191-t01/appendix191.py` + `appendix191.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round191-t01/boot-survey-191t01.sh`
  + `boot-survey-191t01.txt` (output thô 9 nguồn boot mới — đo tươi 08:44:31Z;
  script adapt từ 189; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round191-t01/recount-191-t01.py` +
  `recount-191-t01.out` + `crosscheck-191-t01.sh` + `crosscheck-191-t01.out`
  (hai phương pháp đếm viết mới hoàn toàn, mỗi phương pháp chạy 1 lần ở mốc tạm này)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round191-t01/o8-driver-191t01.sh` +
  `o8-191t01.log` + `o8-lock.log` + `o8-driver-191t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-191t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
