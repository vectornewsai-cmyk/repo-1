# PHASE9_ROUND193_T01_BOOT_VERIFY_LIMITS.md

Đợt 193 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §120).
Mở lượt cron 03:35:51 +07 26/11/2026 (= 20:35:51Z); survey đo tươi 20:44:31Z, O8
21:04:37–21:07:41Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 192 BẢN
PARENT-KIỂM (99.871 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 119, dedup python
+ kiểm chéo shell viết mới; §14.2-192 nguồn gốc CHƯA NGÃ NGŨ — KHÔNG phải lần
sạch thứ tư; các lần sạch vẫn là 179, 183, 191; tổng điền sẵn GIỮ 18)**. T01
KHÔNG khẳng định §14.2-192 do parent viết trực tiếp (theo hồ sơ đứng
AGENTS.md/MEMORY.md + ghi chú nguồn gốc trong chính aggregate 192: parent
KHÔNG có lượt nào lúc ~17:49Z, T10-192 để §14.2 trống hoàn toàn, MEMORY.md
không được cập nhật cho đợt 192).

**BỐI CẢNH: đợt 192 đã đóng (parent CHẤP NHẬN toàn bộ ở §14.2-192).** Đợt 193
là đợt thứ ba theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện sản
phẩm; Editing Core — parity preview/render). T10-193 do lượt cron 06:35 +07
26/11 spawn để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 20:44:31Z)**: boot_id
  `1c0bcaad-1f18-43b1-90f5-fc6319e63b29` (khác boot trước `4dda8234`); btime
  **20:22:37Z** (epoch 1795638157; uptime bracket khớp cùng giây —
  `uptime -s` 20:22:37Z, /proc/stat btime 1795638157, /proc/uptime 1.314,33 s
  lúc 20:44:31Z → boot_est = btime +0,33 s; /proc/1 start_ticks 1234 = btime
  +12,34 s, stat mtime 20:22:49.906Z = btime +12,91 s; journal idx 0 duy
  nhất, first 20:22:50Z = btime +13 s; wtmp begins 20:22:50Z; `last` reboot
  20:22 still running; `who -b` Nov 25 20:22; Cloudflare đo chặt (local mid
  20:44:31Z vs CF-Date 20:44:33 GMT, chênh +2 s — CF trước local ~1–2 s sau
  khi trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, cùng dấu F-189-T0-2; DB:
  0 event bất kỳ quanh btime (xem dưới); marker mtime không đổi).
  Gap #116→mới = **14.464 s (4h01m04s) — DÀI THỨ HAI chuỗi gần đây** (sau
  #114→#115 21.493 s; trên #113→#114 13.759 s; #115→#116 7.057 s). Boot mới
  xảy ra SAU khi run 195 SUCCEEDED (17:54:32Z), TRƯỚC khi đợt 193 mở
  (20:35:51Z). Boot #116 sống 14.464 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #117 (parent quyết (e) ở aggregate 193)**:
  4dda8234 = **#116 XÁC NHẬN** theo quyết (e)-192; #115 = ebc5a3b9 XÁC NHẬN
  theo quyết (e)-192 → 1c0bcaad = **#117** theo hệ quả trực tiếp.
  **F-191-T7-2 KHÔNG đổi số hiệu** (không có cửa bất thường nào cần xét đợt
  này — boot_gen đổi lần thứ 9 liên tiếp trùng boot đã biết, xem
  F-193-T01-1).
- **Marker sống qua 68 reboot (#49–#116)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 69 nếu boot mới = #117.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-193 + parent)**:
  **0 event `requeued_after_restart`** trong [20:20:00Z, 20:30:00Z] và
  **0 event BẤT KỲ** trong [20:22:00Z, 20:24:00Z] (DB đọc tươi) — cửa (m)
  [20:23:10Z; 20:23:26.8Z] trống hoàn toàn. Không run nào sống tại btime:
  run 195 (e2fad6d2) SUCCEEDED 17:54:32Z = btime −8.885 s (2h28m05s TRƯỚC
  btime); run 194 (8c0c386d) SUCCEEDED 17:22:32Z = btime −10.805 s; run hiện
  tại (32dddfa5) sched/started/claimed 20:35:51Z = **btime +794 s**, status
  running lúc đọc, boot_gen `cron_boot_26391d58…` (mới — khác a080cf74 của
  boot #116). **Khác #116** (1 requeue vì run 194 spanning): ở đây 0 requeue
  vì không run nào spanning — cùng mẫu #109/#112/#114/#115 (0 requeue,
  không run spanning). Phân loại thuộc T2-193 + parent.
- **POSTBOOT_PASS boot mới ĐÃ CÓ 20:59:08Z (T56-193; T01 chỉ ghi nhận + xác
  minh độc lập)**: file `round193-t56/POSTBOOT_PASS`, 324 B, md5
  46e0b6575439fd6c6d3d482392c4e4b3; mode **repair-sớm-quyết-h, poll=1**;
  dpkg **768** dòng (= `wc -l /var/log/dpkg.log` T01 kiểm độc lập lúc
  ~21:03Z — nguồn thứ ba khớp cờ + watcher), cache 107 .deb, lists 75;
  postboot PASS poll1 độc lập exit 0 lúc 20:59:08Z; **boot+36m31s**; cờ cũ
  #115 backup `POSTBOOT_PASS-ebc5a3b9`. Mode/caveat thuộc T56-193 + parent
  (tiền lệ #107: repair-sớm-quyết-h poll=1 CHẤP NHẬN CÓ caveat).
  **Replay #117: 0 hoạt động quan sát được tới khi repair bắt đầu**
  (dpkg.log chỉ 2 dòng 20:23:13/14Z, đóng băng 1.347 s tới lúc watcher mở
  20:45:41Z; 0 proc apt/dpkg lúc watcher mở — phân loại dạng B hay khác
  thuộc T56-193). **T01 PHẢI chờ cờ** (cờ về 20:59:08Z, O8 chạy 21:04:37Z,
  sau cờ 5m29s).
- **libevent VẮNG lúc survey (boot+21m54s)** — giống #112/#115/#116 (VẮNG
  lúc mở boot, CÓ sau replay); dpkg.log chỉ 2 dòng lúc survey (đóng băng từ
  20:23:14Z), lên 768 dòng sau repair (apt-get update ~11 phút 20:45→20:57Z
  + install 11 gói 20:57→20:59Z). T01 không phân biệt được "có từ đầu boot"
  hay "đã heal bởi replay sớm" (survey đầu tiên boot+21m54s, sau khi
  replay-watch-193 đã chạy); O8 KHÔNG bị ảnh hưởng (libevent đã có trước O8;
  launch version 27.2, 0 lỗi).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (21:04:37–21:07:41Z, 3m04s)**: sau cờ 5m29s. WebKit attempt1 exit=0,
  **21/21 PASS** (S1 PASS 21:04:53.381Z, Playwright mouse click lần 2;
  launched version 27.2), JSON 21 results, 21 ok=true, md5
  `748d723880caa5ce389b9e8777427d18`; attempt2 exit=0, **21/21 PASS** (S1
  PASS 21:05:57.057Z; launched 27.2), JSON 21 results, 21 ok=true, md5
  `58f66a053c4519a3653817270974f64a`; Chromium exit=0, **21/21 PASS** (S1
  PASS 21:07:11.223Z, CDP mouse click), JSON 21 results, 21 ok=true, md5
  `575bc0790b16ce54e34ceb55c13089d0`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:5560/
  5554 bridge OK). Script gốc KHÔNG đổi so với đợt 192 (webkit 4994b4fc,
  headed c8acd72e; preview.tsx md5 50ad3faf ổn định suốt O8 — khác
  F-192-T01-6). dpkg.log 768 dòng trên boot mới (khớp cờ T56-193).
- **0 attempt chồng — O8 chạy TRƯỚC attempt T4**: T4-193 poller chỉ poll
  trong cửa sổ O8 (poll #28 21:06:23Z ghi lock=co của T01, postboot_exit=0,
  gate0=T5; poll #25 21:04:06Z ngay trước O8 ghi lock trống); T01 acquire
  lock 21:04:37Z khi lock TRỐNG, giữ 3m04s, đã nhả (TRỐNG lúc 21:07:41Z);
  attempt T4 chưa mở lúc O8 xong. Phán cuối về lượt yên #61 thuộc T4-193 +
  parent.
- X11: 0 process Xvfb sót sau O8 (kiểm 21:09:00Z); 1 socket stale X98 (tạo
  20:50Z — TRƯỚC O8, 0 process giữ; không phải display O8 của T01 (:192/
  :198) — xem F-193-T01-9). Boot lúc O8 xong vẫn 1c0bcaad. Không có reboot
  mới trong lúc O8 chạy (kiểm 21:09:00Z boot vẫn 1c0bcaad).

## Đếm — MỐC ĐẾM CUỐI (ghi rõ thời điểm đếm; xem F-193-T01-7)

- **Verdict: TẠM — PASS với 1/11 batch, KHÔNG đính chính đếm.** Tái kiểm
  111–192 KHỚP quyết parent (q) đợt 192 TỪNG SỐ; đợt 190 = 0/0/0/0 (VOID);
  0 file thiếu; chuỗi khớp nối dài lần thứ 121 (xem dưới). Số cuối đợt 193
  CHƯA CHỐT — T10-193 chạy lại hai phương pháp sau closing (lượt cron
  06:35 +07 26/11) và cộng batch closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-193-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-193-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
  Cả hai phương pháp chạy 1 LẦN mỗi phương pháp ở mốc tạm (~20:48–20:53Z)
  và 1 lần ở mốc cuối (21:10–21:12Z), exit 0, KHỚP TỪNG SỐ với nhau ở mọi
  mốc đếm. (Mốc tạm: đợt 193 = 0/0/0/0, chuỗi khớp lần thứ 120 — xem
  recount/crosscheck-193-t01-temp.out.)
- **Mốc đếm cuối (21:10–21:12Z; P2/P3/P4/T2/T4/T56/T7/T8/T9 CHƯA stage)**:
  quét **1.451 file** `phase9-round*.txt` (round 1–193, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.307; tổng đường
  dẫn duy nhất toàn cục 4.033.
- **Đợt 193 (TẠM) = 1/4/4/1** (1 batch: p1 — entry: 4; 4 đường dẫn; 1 file
  mới: LIMITS P1; 3 đường dẫn không mới: previewVoiceFx.ts +
  previewVoiceFx.test.ts + audioEngineVoiceFx.test.ts — đều first-seen đợt
  191. P1: telephone bù g=0,76 ĐẠT bar ≤2 dB + pitch W=0,08 s, tsc 0 lỗi —
  theo cờ P1-193, 21:00Z.)
- **Lũy kế 111–193 = 803/1.437/1.239/1.050** (= lũy kế 111–192 cộng delta
  đợt 193 tạm 1/4/1/1 — chỉ +1 đường dẫn vì 3/4 đường dẫn P1 đã có trong
  cửa sổ 111–192). **Chờ push hiện tại (191+192+193, TẠM) =
  25/88/68/55.** **Tổng 1–193 = 1.451/7.307/4.033. Tổng 1–192 =
  1.450/7.303/4.032. Tổng 1–191 = 1.438/7.264/4.009. Tổng 1–190 =
  1.426/7.219/3.978.**
- **Tái kiểm vs quyết parent (q) đợt 192 — KHỚP TỪNG SỐ**: tái kiểm 111–192
  = 802/1.433/1.238/1.049 (quyết (q)-192: 802/1.433/1.238/1.049); tổng 1–192
  = 1.450/7.303/4.032 (quyết (q)-192: 1.450/7.303/4.032). Tái kiểm 111–191
  = 790/1.394/1.213/1.026 (KHỚP (q)-191); 111–190 = 778/1.349/1.173/995
  (KHỚP (q)-189).
- **Chuỗi khớp: 119 (parent-192) → 120 (T01-193, mốc tạm) → 121 (T01-193,
  mốc cuối này).** Cơ sở lần 121: hai phương pháp của T01 khớp từng số với
  nhau ở mọi mốc; tái kiểm 111–192 khớp từng số với quyết parent (q) đợt
  192; số đợt 193 = trước (0) + delta 1 batch đã stage (P2/P3/P4/T2/T4/T56/
  T7/T8/T9 chưa stage nên số này là TẠM — T10-193 xác nhận lại sau closing).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.033 đường dẫn duy nhất, cả hai
  phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=4033`).
- **Kích thước LIMITS đợt 193 (đo bằng stat lúc T01 đóng) vs giới hạn push
  37.768 B — 1/11 CÓ: P1 13.693 B** (dưới xa); T01 này 23.503 B (ghi sau
  khi viết xong — vẫn dưới xa). Aggregate 193 chưa có (T10-193 viết sau) —
  mọi aggregate đều vượt giới hạn push; lúc push cần `ENABLE_PRIVSEP=0`.
- **1/11 cờ lúc T01 đóng** (P1 — P2/P3/P4/T2/T4/T56/T7/T8/T9 thiếu; + cờ
  T01 = 2/11). Chuỗi 11/11 = 13 (quyết (q)-192) CHƯA nối được đợt này —
  T10-193 chốt sau khi các luồng còn lại stage (nếu đủ 11/11 trong hạn cứng
  thì chuỗi nối tiếp; nếu không đủ thì chuỗi đứt theo tiền lệ đợt 182/
  183/184/185).

## Giới hạn / sai số ghi nhận (F-193-T01-*)

- **F-193-T01-1 — NHÃN "run 195" CỦA BRIEF SAI −1 (lặp lại mẫu F-192-T7-1):
  lượt cron hiện tại là run 196.** Bằng chứng (DB tươi): 5 run
  vcut-build-loop liên tiếp, sched cách nhau đúng 10.800 s — d3d9408b sched
  1795595751 FAILED (run 192); 82d3d1b9 sched 1795606551 SUCCEEDED (run
  193); 8c0c386d sched 1795617351 SUCCEEDED 17:22:32Z (run 194); **e2fad6d2
  sched 1795628151 SUCCEEDED 17:54:32Z (run 195)** — result_summary của nó:
  "Đã spawn và theo dõi T10-192 đóng sổ" (đúng là lượt đóng đợt 192);
  **32dddfa5 sched 1795638951 RUNNING (run 196)** — lượt hiện tại, boot_gen
  mới 26391d58. Brief bỏ qua lượt đóng 17:35:51Z — đúng lỗi F-192-T7-1
  (brief đợt 192 bỏ qua lượt đóng 18:35:51Z); result_summary của chính run
  194 cũng ghi lượt 17:35:51Z là "run 195". **Parent quyết cách đếm ở
  aggregate 193.** Nội dung số KHÔNG tranh chấp — chỉ nhãn số hiệu. T01
  dùng "run 196" cho lượt hiện tại trong toàn bộ LIMITS + GAP §120 này.
- **F-193-T01-2 — result_summary run 195 lặp lại câu chuyện điền sẵn
  §14.2-192.** Bằng chứng (DB đọc tươi): result_summary e2fad6d2 ghi
  "Parent kiểm chứng độc lập: §14.2 TRỐNG HOÀN TOÀN khi đọc → lần sạch thứ
  tư kể từ đợt 179", "Quyết §14.2 viết trực tiếp", "Aggregate: ...
  (98.841 B...)", "parent viết nhầm (o)–(r) vào §14.1... đã ghi bài học vào
  AGENTS.md" — TẤT CẢ mâu thuẫn với aggregate 192 bản parent-kiểm 99.871 B
  + ghi chú nguồn gốc §14.2 (CHƯA NGÃ NGŨ; các lần sạch vẫn 179/183/191;
  tổng điền sẵn GIỮ 18). **T01 KHÔNG dùng result_summary này làm nguồn**
  (chỉ trích dẫn làm bằng chứng); nguồn đứng duy nhất: aggregate 192 bản
  99.871 B + LIMITS T01-192 + GAP §119 + log gốc + DB tươi (job_runs/events
  — số liệu thô, không lấy narrative). Ghi nhận: tiến trình điền sẵn còn
  viết cả vào DB result_summary, không chỉ file — parent lưu ý khi đọc
  result_summary các run sau.
- **F-193-T01-3 — (m) boot mới: 0 requeue — T01 chỉ ghi số, KHÔNG phân loại
  (thuộc T2-193 + parent).** Bằng chứng (DB đọc tươi): 0 event
  `requeued_after_restart` trong [20:20:00Z, 20:30:00Z] và 0 event BẤT KỲ
  trong [20:22:00Z, 20:24:00Z] (cửa (m) [20:23:10Z; 20:23:26.8Z] trống hoàn
  toàn); run 195 SUCCEEDED btime −8.885 s; run 194 SUCCEEDED btime
  −10.805 s; run 196 sched btime +794 s; boot_gen đổi sang 26391d58 — lần
  đổi gen thứ 9 liên tiếp trùng boot đã biết (T01-192 đếm 8 tới a080cf74).
  Trong chuỗi #102–#116, mọi reboot có run spanning đều có ≥1 requeue tại
  btime +~35–44 s; boot mới nối lại mẫu 0 requeue của #109/#112/#114/#115
  (cả năm đều KHÔNG CÓ run spanning).
- **F-193-T01-4 — POSTBOOT_PASS boot mới là repair-sớm-quyết-h, poll=1
  (mode/caveat thuộc T56-193 + parent).** T01 ghi nhận: repair-sớm-quyết-h,
  poll=1, dpkg 768 (khớp 3 nguồn: cờ + watcher + `wc -l /var/log/dpkg.log`
  độc lập), cache 107, lists 75, postboot PASS poll1 độc lập exit 0
  20:59:08Z, boot+36m31s, verify check-only độc lập của T01 exit 0, cờ cũ
  #115 backup POSTBOOT_PASS-ebc5a3b9. Tiền lệ #107: repair-sớm-quyết-h
  poll=1 CHẤP NHẬN CÓ caveat. **Replay #117: 0 hoạt động quan sát được tới
  khi repair bắt đầu** (dpkg 2 dòng đóng băng 1.347 s; 0 proc apt/dpkg lúc
  watcher mở 20:45:41Z) — phân loại dạng B hay khác thuộc T56-193.
  **libevent VẮNG lúc survey** (boot+21m54s; dpkg 2 dòng) — giống
  #112/#115/#116; T01 chờ cờ về rồi mới chạy O8 (cờ về 20:59:08Z, O8 chạy
  21:04:37Z, sau cờ 5m29s).
- **F-193-T01-5 — Dấu chênh Cloudflare giữ nguyên cách ghi F-189-T0-2
  (CF − local).** Bằng chứng: local mid 1795639471, CF-Date 1795639473 →
  CF − local = +2 s → local CHẬM ~1–2 s sau khi trừ mạng (đợt 192 là +1 s).
  Verdict "đồng hồ ĐÚNG trong ±2 s" KHÔNG ĐỔI; mọi phép tính gap/btime dùng
  đồng hồ local nhất quán nên không bị ảnh hưởng.
- **F-193-T01-6 — O8 chạy TRƯỚC attempt T4 — 0 chồng lấn, gate được kiểm
  trước VÀ trong lúc chạy.** Lúc T01 acquire lock (21:04:37Z): lock TRỐNG,
  cờ POSTBOOT_PASS đã CÓ (20:59:08Z), T4 poller chỉ poll (poll #25 21:04:06Z,
  chưa mở attempt), apt=0 — T01 acquire lock, chờ 0 s. Trong lúc O8 chạy,
  poll #28 của T4 (21:06:23Z) ghi nhận lock của T01, không mở attempt
  (attempt T4 chưa mở lúc O8 xong 21:07:41Z). Giống F-192-T01-5: O8 ngắn
  (3m04s), gate đã xanh TRƯỚC khi chạy (cờ + lock trống + T4 chỉ poll), và
  T01 kiểm lại TRONG lúc chạy qua poll của T4. Phán cuối về lượt yên #61
  thuộc T4-193 + parent.
  **Đánh giá O8 boot mới theo mốc chuỗi (quyết (b) đợt 192 — FULL PASS 2 →
  0 ĐỨT):** chân O8 T01 trên boot mới ĐẠT (WebKit 21/21 ×2 + Chromium 21/21,
  sau cờ 5m29s, cùng boot 1c0bcaad, cờ repair-sớm-quyết-h poll=1 — mode/
  caveat thuộc T56-193 + parent). FULL PASS đợt 193 thuộc T8-193/T10-193 +
  parent (cần thêm O8 T8 + lượt yên #61 + harness 6/6 cùng boot).
- **F-193-T01-7 — Đếm TẠM 1/11 (P2/P3/P4/T2/T4/T56/T7/T8/T9 CHƯA ĐÓNG CỜ lúc
  T01 đóng — xem §Đếm).** Lúc T01 chạy đếm cuối (21:10–21:12Z): 1/11 cờ đã
  có (P1 21:00Z) + cờ T01 = 2/11; các luồng còn lại CÒN CHẠY. Mốc tạm trước
  đó (~20:48–20:53Z): 0 file paths-loop đợt 193 (P1 stage file đầu tiên
  21:00:31Z — SAU mốc tạm), 0/11 cờ. Số đếm trong LIMITS này là TẠM —
  T10-193 (lượt cron 06:35 +07 26/11) chạy lại hai phương pháp sau closing
  và chốt số cuối (cộng cả batch T01 này: +1 batch/+2 entry/+2 đường dẫn/+1
  file mới, và batch closing nếu có). Chuỗi khớp ở §Đếm tính trên mốc cuối
  này; T10-193 xác nhận lại.
- **F-193-T01-8 — Nguồn dùng trong LIMITS này: §14.2 aggregate 192 BẢN
  PARENT-KIỂM (99.871 B; quyết (a)–(r) — parent kiểm đếm KHỚP TỪNG SỐ lần
  thứ 119; nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18; các lần sạch vẫn
  179/183/191) + LIMITS T01-192 + §119 GAP + log gốc (boot-survey-193t01,
  appendix193, replay-watch-193, poll-t4/chain-t4-193, POSTBOOT_PASS boot mới
  + backup #115, o8-193t01.log) + DB tươi (muse.db job_runs + events) + cờ
  .done P1-193 (chỉ trích dẫn, không xác minh lại nội dung chuyên môn).**
  Các quyết THẬT dùng: (a) CHẤP NHẬN đợt 192; (b) FULL PASS 2 → 0 (ĐỨT —
  KHÔNG THỂ); (c) POSTBOOT_PASS #115 CÓ caveat, #116 KHÔNG CÓ cờ, tổng boot
  không cờ GIỮ 26; (d) INSIDE #113/#114 KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; (e)
  ebc5a3b9 = #115 XÁC NHẬN, 4dda8234 = #116 XÁC NHẬN, marker 68; (f) (m)
  #114/#115 KHÔNG CÓ ĐIỂM, n ứng viên GIỮ 51/52, (m) #116 thuộc T2-193; (g)
  n chính thức GIỮ 14; (h) E-247 KHÔNG XÁC ĐỊNH ĐƯỢC; (i) holder chuỗi 18 →
  19, #116 thuộc T56-193; (j) kẹt #28, B1 live sạch 2 → 0, V2 phương án
  chính, 84l10 PASS chuỗi 10 → 0, 86n2-P1 lần 14, log sạch 29 → 31, B2
  KHÔNG TÁCH; (k) replay #115 KHÔNG CHẠY (dạng B); (l) headroom 0 lần 51,
  ENOSPC lần 40, birefnet 0 lần 45; (m) lượt yên #60 KHÔNG HỢP LỆ, chuỗi
  2 → 0, labellag tính theo LƯỢT HỢP LỆ; (n) run 193 = 82d3d1b9, run 194 =
  8c0c386d, CA #23, họ 23/20, chuỗi SUCCEEDED 3 → 0 → 1, cửa slot 192 LÀNH
  chuỗi 1 → 2, HB 50/561, DR 55/352, OUTAGE bàn giao T7-193/T7-194; (o)
  auto-trigger GIỮ LIVE; (p) chuỗi 0 vi phạm 0 → 1, live #11 KHÔNG THỂ
  KIỂM (chuỗi GIỮ 9); (q) đếm cuối đợt 192 = 12/39/35/23, lũy kế 111–192 =
  802/1.433/1.238/1.049, chờ push = 24/84/67/54, tổng 1–192 =
  1.450/7.303/4.032, chuỗi khớp 119, chuỗi 11/11 = 13; (r) KHÔNG PUSH. T01
  KHÔNG tự thay đổi verdict nào; mọi số đếm/boot/O8 trong LIMITS này không
  bị ảnh hưởng bởi nguồn (chỉ các chuỗi/mốc tham chiếu (b)/(c)/(g)/(n)/(p)/
  (q) theo bản parent-kiểm).
- **F-193-T01-9 — Socket X98 stale, KHÔNG phải của O8.** Bằng chứng:
  /tmp/.X11-unix/X98 tạo 20:50Z (TRƯỚC khi O8 bắt đầu 21:04:37Z), 0 process
  giữ (fuser trống), 0 process Xvfb; display O8 của T01 là :192/:198 (không
  để lại socket). T01 ghi nhận, không quy trách nhiệm (có thể của luồng khác
  đang chạy hoặc sót từ đợt 192).

## Phạm vi chưa kiểm (không thuộc T01)

- Số hiệu boot mới 1c0bcaad = #117 (ứng viên — parent quyết (e) ở aggregate
  193); (m) boot mới THÔ 0 requeue (T2-193 phân loại CUỐI); POSTBOOT_PASS
  cho boot mới chi tiết + mode/caveat (T56-193); lượt yên #61 (T4-193);
  harness + O8 bộ thứ hai + B2 + B1 (T8-193); #116/#117 có giết holder không
  (T56-193); headroom + ENOSPC + E-247 + auto-trigger live lần FIRE thật đầu
  tiên (T9-193); kết quả sản phẩm P1–P4 đợt 193 (T01 không xác minh lại nội
  dung chuyên môn — chỉ trích dẫn cờ P1-193).
- (m) #116 + INSIDE #113/#114/#115 + (m) #56 (T2-193); kết cục run 194 +
  run 195 + run 196 + HB/DR + cửa slot đợt 193 + OUTAGE #2 điều tra "cố định
  theo giờ" (T7-193 kiểm onset, T7-194 phán cuối); kết cục run 196 thuộc
  T7-194.
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-193); không kiểm lại
  nguyên nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-t01/appendix193.py` + `appendix193.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-t01/boot-survey-193t01.sh`
  + `boot-survey-193t01.txt` (output thô 9 nguồn boot mới — đo tươi 20:44:31Z;
  script adapt từ 192; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-t01/recount-193-t01.py` +
  `recount-193-t01-temp.out` + `recount-193-t01-final.out` +
  `crosscheck-193-t01.sh` + `crosscheck-193-t01-temp.out` +
  `crosscheck-193-t01-final.out`
  (hai phương pháp đếm viết mới hoàn toàn, mỗi phương pháp chạy 1 lần ở mốc
  tạm ~20:48–20:53Z và 1 lần ở mốc cuối 21:10–21:12Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round193-t01/o8-driver-193t01.sh` +
  `o8-193t01.log` + `o8-lock.log` + `o8-driver-193t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-193t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
