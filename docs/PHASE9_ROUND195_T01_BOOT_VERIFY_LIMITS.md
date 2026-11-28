# PHASE9_ROUND195_T01_BOOT_VERIFY_LIMITS.md

Đợt 195 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §122).
Mở lượt cron 15:35:51 +07 26/11/2026 (= 08:35:51Z); survey đo tươi 08:41:23Z,
O8 08:43:23–08:46:54Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 194 BẢN
PARENT-KIỂM (56.089 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 128, dedup python
+ kiểm chéo shell viết mới; §14.2-194 nguồn gốc CHƯA NGÃ NGŨ — KHÔNG phải lần
sạch; các lần sạch vẫn là 179, 183, 191; tổng điền sẵn GIỮ 18)**. T01 KHÔNG
khẳng định §14.2-194 do parent viết trực tiếp (theo hồ sơ đứng AGENTS.md/
MEMORY.md + ghi chú nguồn gốc trong chính aggregate 194: parent KHÔNG có lượt
nào lúc ~06:00Z, T10-194 để §14.2 trống hoàn toàn, MEMORY.md không được cập
nhật cho đợt 194 trước lượt đó).

**BỐI CẢNH: đợt 194 đã đóng (parent CHẤP NHẬN toàn bộ ở §14.2-194).** Đợt 195
là đợt thứ năm theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện sản
phẩm; Editing Core — parity preview/render). T10-195 do lượt cron sau spawn
để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI — XÁC NHẬN 9 nguồn TƯƠI (đo 08:41:23Z)**: boot_id
  `8c4aa907-1329-4e9a-927e-acb2141baf67` (khác boot trước `ac8a88aa`); btime
  **08:22:05Z** (epoch 1795681325; uptime bracket khớp cùng giây —
  `uptime -s` 08:22:05Z, /proc/stat btime 1795681325, /proc/uptime 1.157,64 s
  lúc 08:41:23Z → boot_est = btime −0,36 s; /proc/1 start_ticks 1290 = btime
  +12,90 s, stat mtime 08:22:18.408Z = btime +13,41 s; journal idx 0 duy
  nhất, first 08:22:18Z = btime +13 s; wtmp begins 08:22:18Z; `last` reboot
  08:22 still running; `who -b` Nov 26 08:22; Cloudflare đo chặt (local mid
  08:41:23Z vs CF-Date 08:41:24 GMT, chênh +1 s — CF trước local ~1 s sau
  khi trừ mạng → đồng hồ boot mới ĐÚNG trong ±2 s, cùng dấu F-189-T0-2; DB:
  0 event bất kỳ quanh btime (xem dưới); marker mtime không đổi).
  Gap #120→mới = **14.320 s (3h58m40s)**. Boot mới xảy ra SAU khi run 199
  SUCCEEDED (06:03:00Z), TRƯỚC khi đợt 195 mở (08:35:51Z). Boot #120 sống
  14.320 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #121 (parent quyết (e) ở aggregate 195)**:
  1c0bcaad = **#117 XÁC NHẬN** theo quyết (e)-193; 8a23277a = **#118 XÁC
  NHẬN** theo quyết (e)-193; 55c9e0b7 = **#119 XÁC NHẬN** theo quyết (e)-194;
  ac8a88aa = **#120 ỨNG VIÊN** theo quyết (e)-194 → 8c4aa907 = **#121**
  theo hệ quả trực tiếp.
- **Marker sống qua 72 reboot (#49–#120)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 73 nếu boot mới = #121.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-195 + parent)**:
  **0 event `requeued_after_restart`** trong [08:20:00Z, 08:28:00Z] và
  **0 event BẤT KỲ** trong [08:20:00Z, 08:28:00Z] (DB đọc tươi) — cửa (m)
  [08:22:38Z; 08:22:54.8Z] trống hoàn toàn. Không run nào sống tại btime:
  run 198 (8256daf7) SUCCEEDED 05:08:00Z = btime −11.645 s; run 199 (d35bc461)
  SUCCEEDED 06:03:00Z = btime −2h19m05s; run 200 (c8c827d5) sched/started
  08:35:51Z = **btime +826 s**, status running lúc đọc, boot_gen
  `cron_boot_5b654332…` (mới — chỉ ghi nhận, KHÔNG dùng đếm chuỗi đổi gen,
  xem F-195-T01-5). **Khác #120** (1 requeue vì run 198 spanning, +47,01 s):
  ở đây 0 requeue vì không run nào spanning — cùng mẫu #109/#112/#114/#115/
  #117/#119 (0 requeue, không run spanning). Phân loại thuộc T2-195 + parent.
  (m) #119/#120 phân loại CUỐI ở T2-195: #119 KHÔNG CÓ ĐIỂM, n GIỮ 53/54;
  #120 DƯƠNG +47,008 s, n → 54/55.
- **Khoảng lặng scheduler MỚI 5.739 s BAO TRÙM btime (F-195-T01-2):** 0 event
  scheduler BẤT KỲ (mọi job) trong [07:00:00Z; 08:35:39Z]; event cuối trước
  lặng: succeeded deterministic-doctor 07:00:00.200Z eid 11297; event đầu
  sau lặng: reconciled 08:35:39.311Z eid 11298 (event ID liên tục — 0 event
  bị mất khỏi bảng). Heartbeat due ~07:15/~07:45 + deterministic-doctor due
  08:00 đều VẮNG. T7-195 độc lập phán cùng sự kiện: 3 slot MẤT (HB 07:20:50Z,
  HB 07:50:50Z, DR 08:00Z) + 2 run TRỄ (HB 08:20:50Z +889 s, feed-pulse-14
  +3.225 s); đề xuất parent phân loại OUTAGE MỚI (sự kiện thứ 3, cùng chữ ký
  stall 4.807 s đợt 194, lớn hơn). Phân loại thuộc parent (n).
- **POSTBOOT_PASS #121 CÓ 08:51:26Z (T56-195; T01 kiểm độc lập khớp)**:
  file `round195-t56/POSTBOOT_PASS`, 315 B, md5 theo cờ T56-195; mode
  **replay-day-du, poll=0**; dpkg **1.477** dòng (= `wc -l /var/log/dpkg.log`
  T01 kiểm độc lập — nguồn thứ ba khớp cờ + watcher), cache 171 .deb, lists
  37; postboot PASS poll0 độc lập exit 0 lúc 08:51:26Z; **boot+29m21s**; cờ cũ
  #119 backup `POSTBOOT_PASS-55c9e0b7`. **GST #121 là THƯ MỤC THẬT (269 file
  = debroot 269) — giống #117, KHÁC #119 (symlink)** — caveat cờ #121 NHẸ
  HƠN #119 (T56-195; T01 kiểm độc lập: `ls -la` thư mục thật, `readlink`
  không phải symlink, 269 file). **O8 chạy TRƯỚC khi cờ #121 có** (08:43–
  08:46Z vs cờ 08:51:26Z) — xem F-195-T01-3; hậu quả 0 (cờ sau đó PASS; T4
  gate0 thấy cờ PASS từ poll #12 08:52:01Z trước khi mở attempt1).
  **POSTBOOT_PASS #120 KHÔNG CÓ — KHÔNG VIẾT ĐƯỢC post-hoc** (T56-195 §1.4;
  T01 xác nhận: không file POSTBOOT_PASS-ac8a88aa trên đĩa; watcher-194 chết
  theo reboot 04:23:25Z) — **tổng boot không cờ 28 → 29** nếu parent chấp
  nhận. **Replay #120: xem LIMITS T56-195 (ledger +64 gói @05:04:19Z chỉ
  gợi ý replay đã chạy — KHÔNG đủ để viết cờ).**
- **libevent CÓ lúc survey (boot+19m18s)** — khác #112/#115/#116/#117/#119
  (VẮNG lúc mở boot, CÓ sau replay); dpkg.log 1.477 dòng lúc survey (cao
  hơn 777 của #119 sau repair — replay #121 chạy 08:35:42–08:37:34Z theo
  T56-195). T01 không phân biệt được "có từ đầu boot" hay "đã heal bởi
  replay sớm" (survey đầu tiên boot+19m18s, sau replay); O8 KHÔNG bị ảnh
  hưởng (libevent đã có trước O8; launch version 27.2, 0 lỗi).
- **O8 trên boot mới — WebKit PASS 21/21 ×2 + Chromium PASS 21/21
  (08:43:23–08:46:54Z, 3m31s)**: sau survey, TRƯỚC cờ #121 4m32s (xem
  F-195-T01-3). WebKit attempt1 exit=0, **21/21 PASS** (S1 PASS 08:43:42Z,
  Playwright mouse click lần 2; launched version 27.2), JSON 21 results,
  21 ok=true, md5 `119247a95afd181cab183872606b6f0f`; attempt2 exit=0,
  **21/21 PASS** (S1 PASS 08:44:49Z; launched 27.2), JSON 21 results,
  21 ok=true, md5 `7546bc35dff46f1fd2fb8cc144fb46ec`; Chromium exit=0,
  **21/21 PASS**, JSON 21 results, 21 ok=true, md5
  `39da0643d6d0e6674f2b6c844dd95743`. Đếm lại từ JSON gốc bằng python; JSON
  stamped theo lượt khớp md5 với bản copy. **0 lỗi exit 127 / launch-fail**
  trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1:5560/
  5554 bridge OK). Script gốc KHÔNG đổi so với đợt 194 (webkit 4994b4fc,
  headed c8acd72e); preview.tsx lúc O8 = **591f9655**, media.ts **14baf831**
  (KHÔNG đổi so với đợt 194). dpkg.log 1.477 dòng trên boot mới (khớp cờ
  T56-195). O8 T8 độc lập 3/3 cùng boot/cây (WebKit md5 2bd6cec1/97be0b44,
  Chromium c63d819e — khác md5 T01 vì là lần chạy khác, cùng verdict).
- **O8 chạy TRONG LÚC T4 chỉ poll — 0 chồng lấn**: T4 chưa mở attempt1 lúc
  O8 chạy (attempt1 mở 09:10:07Z, sau O8 23 phút); T01 acquire lock 08:43:24Z
  khi lock TRỐNG, giữ ~3m30s, đã nhả 08:46:54Z. Trong lúc O8 chạy, poll #5
  của T4 (08:46:44Z) ghi lock=co (thread=t01-round195, pid 7234, port 5560)
  và KHÔNG mở attempt; poll #6 (08:47:30Z) lock=khong sau release. Tải do O8
  gây ra (load1 đỉnh ~4,7 lúc poll #8) làm cửa yên mở muộn (attempt1 mở
  09:10:07Z, sau khi load rã về <2/<2) nhưng KHÔNG nhiễm mẫu attempt nào
  (attempt1 mở khi máy đã lặng; gate A: load1<2, load5<2, RAM>=1024).
  Phán cuối về lượt yên #63 thuộc T4-195 + parent: attempt3 HỢP LỆ (20/20 +
  lớp B 5/5 + tickCost median 53,0 ms) — lượt hợp lệ đầu tiên kể từ #59
  đợt 191; chuỗi lượt yên hợp lệ 0 → 1 (đề xuất).
- X11: 0 process Xvfb của T01 sót sau O8 (/tmp/.X11-unix TRỐNG sau O8).
  Boot lúc O8 xong vẫn 8c4aa907. Không có reboot mới trong lúc O8 chạy.

## Đếm — MỐC ĐẾM CUỐI (ghi rõ thời điểm đếm; xem F-195-T01-8)

- **Verdict: CUỐI — PASS với 9/11 batch, KHÔNG đính chính đếm.** Tái kiểm
  111–194 KHỚP quyết parent (q) đợt 194 TỪNG SỐ; đợt 190 = 0/0/0/0 (VOID);
  0 file thiếu; chuỗi khớp nối dài lần thứ 130 (xem dưới). Số cuối đợt 195
  CHƯA CHỐT — T10-195 chạy lại hai phương pháp sau closing (lượt cron sau)
  và cộng batch T9 + batch closing nếu stage kịp.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-195-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-195-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1).
  Cả hai phương pháp chạy ở mốc tạm (python 08:48:43Z + shell 09:22:50–
  09:25:34Z — xem F-195-T01-4) và ở mốc cuối lần 2 (10:06:18–10:08:24Z —
  xem F-195-T01-8), exit 0, KHỚP TỪNG SỐ với nhau ở cả hai mốc.
- **Mốc đếm TẠM (4/11 cờ: P1/P2/P3/T7; 4 file đợt 195 lúc bắt đầu VÀ lúc
  kết thúc đếm)**:
  quét **1.478 file** `phase9-round*.txt` (round 1–195, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.396; tổng đường
  dẫn duy nhất toàn cục 4.089.
- **Đợt 195 (TẠM) = 4/11/11/9** (4 batch — P1 1/1/1/1, P2 1/1/1/1, P3 1/8/8/6,
  T7 1/1/1/1; 11 entry, 11 đường dẫn, 9 file mới). File mới (9): 4 LIMITS
  (P1/P2/P3/T7) + reverseAudio195P3.test.ts + audio-probe-195.mjs +
  audio-waveform-195-chirp-70s.json + audio-waveform-195-longA-300s-gop300-
  720p.json + audio-waveform-195-longB-300s-gop15-360p.json. 2 đường dẫn
  không mới — reverseAudioWiring.ts (first-seen 192), tsconfig.json
  (first-seen 1).
- **Lũy kế 111–195 (TẠM) = 830/1.526/1.301/1.106. Chờ push (TẠM) =
  52/177/130/111. Tổng 1–195 (TẠM) = 1.478/7.396/4.089.**
- **Chuỗi khớp TẠM: 128 (parent-194) → 129 (T01-195, mốc tạm).**
- **Mốc đếm CUỐI lần 2 (CHỐT; 10:06:18–10:08:24Z; 9/11 cờ; T9 CHƯA đóng)**:
  quét **1.483 file** `phase9-round*.txt` (round 1–195, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.410; tổng đường
  dẫn duy nhất toàn cục 4.102. Trạng thái paths-loop ổn định: 9 file đợt
  195 lúc bắt đầu VÀ lúc kết thúc đếm.
- **Đợt 195 (CUỐI) = 9/25/24/22** (9 batch — P1, P2, P3, P4, T2, T4, T56,
  T7, T8; 25 entry, 24 đường dẫn, 22 file mới). File mới (22): 9 LIMITS
  (P1/P2/P3/P4/T2/T4/T56/T7/T8) + distinct-seq-195.py + poll-wait-t4-195.sh
  + run-attempt-195.sh + run-analyzers-195.sh + reverseAudio195P3.test.ts +
  audio-probe-195.mjs + 3 audio-waveform-195-*.json + parityHarness195.ts +
  parityHarness195.test.ts + parity195-run.mjs + parity195-run-test.mjs (xem
  first_seen trong recount-195-t01-final2.out). 2 đường dẫn không mới —
  reverseAudioWiring.ts (first-seen 192), tsconfig.json (first-seen 1).
- **Lũy kế 111–195 (CUỐI) = 835/1.540/1.314/1.119** (= lũy kế 111–194 cộng
  delta đợt 195 cuối +9 batch / +25 entry / +22 đường dẫn / +22 file mới —
  trong 24 đường dẫn đợt 195, 2 đường dẫn đã có trong hợp của cửa sổ
  111–194 nên chỉ +22 đường dẫn mới cho cửa sổ). **Chờ push hiện tại
  (191+192+193+194+195, CUỐI) = 57/191/143/124.** **Tổng 1–195 =
  1.483/7.410/4.102. Tổng 1–194 = 1.474/7.385/4.080. Tổng 1–193 =
  1.462/7.344/4.055. Tổng 1–192 = 1.450/7.303/4.032. Tổng 1–191 =
  1.438/7.264/4.009.**
- **Tái kiểm vs quyết parent (q) đợt 194 — KHỚP TỪNG SỐ**: tái kiểm 111–194
  = 826/1.515/1.292/1.097 (quyết (q)-194: 826/1.515/1.292/1.097); tổng 1–194
  = 1.474/7.385/4.080 (quyết (q)-194: 1.474/7.385/4.080). Tái kiểm 111–193
  = 814/1.474/1.262/1.072 (KHỚP (q)-193); 111–192 = 802/1.433/1.238/1.049
  (KHỚP (q)-192); 111–191 = 790/1.394/1.213/1.026 (KHỚP (q)-191); 111–190
  = 778/1.349/1.173/995 (KHỚP (q)-189).
- **Chuỗi khớp: 128 (parent-194) → 129 (T01-195, mốc tạm) → 130 (T01-195,
  mốc cuối lần 2 này).** Cơ sở lần 130: hai phương pháp của T01 khớp từng
  số với nhau ở mốc cuối lần 2 (trạng thái ổn định, 9 file trước/sau);
  tái kiểm 111–194 khớp từng số với quyết parent (q) đợt 194; số đợt 195
  = trước (0) + delta 9 batch đã stage (T9 chưa stage nên số này là CUỐI
  của T01 — T10-195 xác nhận lại sau closing).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.102 đường dẫn duy nhất, cả hai
  phương pháp; python `missing=0 []`, shell `missing=0 total_uniq=4102`).
- **Kích thước LIMITS đợt 195 (đo bằng stat lúc T01 đóng) vs giới hạn push
  37.768 B — 9/11 CÓ: P1 15.545 B, P2 23.000 B, P3 22.099 B, P4 37.069 B
  (dư 699 B), T2 29.465 B, T4 44.762 B (VƯỢT 6.994 B), T56 42.026 B (VƯỢT
  4.258 B), T7 18.470 B, T8 37.574 B (dư 194 B)**; T01 này 24.594 B (dưới
  giới hạn); T9 chưa có LIMITS lúc T01 đóng. **2/9 LIMITS
  VƯỢT giới hạn push (T4, T56)** — lúc push cần `ENABLE_PRIVSEP=0` cho 2
  file này (aggregate 195 cũng vượt như mọi aggregate).
- **9/11 cờ lúc T01 đóng** (P1/P2/P3/P4/T2/T4/T56/T7/T8 — T9 thiếu; + cờ
  T01 = 10/11). Chuỗi 11/11 = 15 (quyết (q)-194) CHƯA nối được đợt này —
  T10-195 chốt sau khi T9 stage (nếu đủ 11/11 trong hạn cứng thì chuỗi nối
  tiếp; nếu không đủ thì chuỗi đứt theo tiền lệ đợt 182/183/184/185).

## Giới hạn / sai số ghi nhận (F-195-T01-*)

- **F-195-T01-1 — T01 ghi sai số hiệu run hiện tại trong bản nháp appendix
  (199 thay vì 200) — ĐÃ SỬA trước khi ghi LIMITS.** T01 đếm nối tiếp từ run
  198 (lượt mở đợt 194) mà quên lượt parent đóng đợt 194 (d35bc461, sched
  05:35:51Z) là run 199; run hiện tại c8c827d5 (sched 08:35:51Z) là **run
  200**. Epoch/sched/finished đều đúng, chỉ sai nhãn số hiệu. Phát hiện nhờ
  đối chiếu LIMITS T7-195 §4 (run 200 RUNNING; run 199 SUCCEEDED 06:03:00Z
  cf 7 s). Đã sửa appendix195.py + appendix195.txt + NOTES.md + gap122-draft.
  Bài học: số hiệu run phải đối chiếu DB tươi (job_runs theo
  scheduled_for_utc), không đếm nối tiếp bằng tay.
- **F-195-T01-2 — Khoảng lặng scheduler MỚI 5.739 s (07:00:00Z → 08:35:39Z)
  BAO TRÙM btime #121.** 0 event bất kỳ (mọi job) trong khoảng; heartbeat
  due ~07:15/~07:45 + deterministic-doctor due 08:00 đều VẮNG; event ID
  liên tục 11297 → 11298; reboot 08:22:05Z nằm trong khoảng lặng (lặng bắt
  đầu trước reboot 4.925 s). Cùng chữ ký stall 4.807 s đợt 194 (F-194-T01-4).
  T7-195 độc lập phán cùng sự kiện (§7: 3 slot mất + 2 run trễ; đề xuất
  parent phân loại OUTAGE MỚI, sự kiện thứ 3). Phân loại thuộc parent (n).
  (m) trống trong khoảng lặng là nhất quán với khoảng lặng chung, không phải
  bằng chứng riêng về boot.
- **F-195-T01-3 — O8 chạy TRƯỚC khi POSTBOOT_PASS #121 có (lệch quy trình
  đợt 194).** O8 08:43:23–08:46:54Z; cờ #121 viết 08:51:26Z (sau O8 4m32s).
  Đợt 194 T01 chờ cờ rồi mới chạy O8 (sau cờ 21m31s). Lý do đợt này: T56-195
  chưa mở phiên lúc T01 survey (round195-t56 chưa tồn tại 08:41Z); boot
  trông đã lành (libevent CÓ, dpkg 1.477 dòng — khác #119 VẮNG libevent lúc
  survey); T4 chưa mở attempt nên khe O8 hẹp. Hậu quả: 0 — cờ #121 sau đó
  PASS (poll0 exit 0, GST thư mục thật) và T4 gate0 đã thấy cờ PASS từ poll
  #12 (08:52:01Z) trước khi mở attempt1; FULL PASS gate (a) vẫn CÓ cờ theo
  T4-195. Ghi nhận lệch quy trình để đợt sau: O8 nên chờ cờ #121 nếu T56 đã
  mở phiên; nếu T56 chưa mở thì ghi rõ như đợt này.
- **F-195-T01-4 — CPUQuota=15% qua systemd-run --scope KHÔNG có hiệu lực
  trong VM này.** Scope đặt CPUQuotaPerSecUSec=150ms nhưng CPU thực 10,4 s/
  11 s wall (~95% 1 core); load1 giữ ~4,5 trong lúc đếm tạm. T01 đã GIẾT
  shell crosscheck tạm giữa chừng (08:49Z) để bảo vệ pha yên T4 (không lặp
  F-194-T01-5); python tạm đã xong trước đó (chỉ chồng lúc T4 đang poll,
  chưa mở attempt — 0 chồng lấn attempt đang chạy). Crosscheck chạy lại SAU
  khi T4 xong 3 attempt (09:22:50–09:25:34Z), hai phương pháp KHỚP TỪNG SỐ.
  Bài học: đừng tin CPUQuota trên VM này — đếm nặng chỉ chạy khi T4 không
  còn attempt đang chạy.
- **F-195-T01-5 — started_at run 198 BỊ VIẾT LẠI sau reboot #120 (họ
  F-194-T01-2).** T01-194 đọc lúc chạy: 1795660551 (= sched); nay đọc lại:
  1795667052 = 04:24:12Z (btime #120 +47 s, sau requeue eid 11258). T7-195
  độc lập xác nhận cùng hiện tượng (§1: started lúc dispatch = sched, nay =
  1795667052). Row của run đang chạy (started_at, boot_gen) là TẠM và bị
  viết lại sau — KHÔNG dùng boot_gen đếm chuỗi đổi gen (quyết đứng
  F-194-T7-2).
- **F-195-T01-6 — result_summary run 199 lặp lại câu chuyện điền sẵn (cùng
  họ F-193-T7-2/F-194-T7-3; T7-195 ghi F-195-T7-1).** Summary ghi "aggregate
  sau quyết = 54.214 B" + "đã thêm §14.2 quyết parent" — SAI so với aggregate
  194 bản parent-đã-đính-chính (56.089 B, NGUỒN GỐC CHƯA NGÃ NGŨ). T01 KHÔNG
  dùng result_summary làm nguồn narrative (chỉ trích dẫn làm bằng chứng);
  nguồn đứng: aggregate 194 bản 56.089 B + LIMITS T01-194 + GAP §121 + log
  gốc + DB tươi (job_runs/events — số liệu thô).
- **F-195-T01-7 — POSTBOOT_PASS #120 KHÔNG TÌM THẤY trên đĩa lúc survey
  (T56-195 xác nhận §1.4).** Round194-t56 chỉ có POSTBOOT_PASS cho #119 +
  backup #117; không có file POSTBOOT_PASS-ac8a88aa; watcher-194 CHẾT theo
  reboot 04:23:25Z (poll cuối 04:23:48Z). T56-195 kết luận KHÔNG VIẾT ĐƯỢC
  post-hoc (dpkg/journal/apt của #120 đã mất theo reboot 08:22:05Z; viết cờ
  không-verify là bịa đặt — tiền lệ #118). Tổng boot không cờ 28 → 29 nếu
  parent chấp nhận (quyết (c)).
- **F-195-T01-8 — Đếm CUỐI lần 1 ĐUA với batch T8 (BỎ, đếm lại lần 2 ở trạng
  thái ổn định).** Đếm cuối lần 1 bắt đầu lúc 8 file đợt 195 (10:03:45Z),
  T8 stage batch thứ 9 (phase9-round195-t8-viteharness.txt) lúc 10:05Z giữa
  lúc đếm — python + shell vẫn khớp nhau ở trạng thái 8 batch (đợt 195 =
  8/24/23/21), nhưng đó không còn là trạng thái cuối. BỎ lần 1 theo tiền lệ
  F-194-T01-6 (đua với batch T4); đếm cuối lần 2 (CHỐT) chạy 10:06:18–
  10:08:24Z ở trạng thái ổn định 9 file trước/sau — xem §Đếm. Lần 1 KHÔNG
  tính vào chuỗi khớp. Đếm CUỐI lần 2 chạy trong lúc T9 vẫn sampling —
  T4 đã xong hết attempt nên không còn pha yên để bảo vệ; T9 tự ghi nhận
  spike theo nguồn (tiền lệ đợt 194: đếm cuối T01 chạy trong lúc T9 sampling).

## Phạm vi chưa kiểm (không thuộc T01)

- Số hiệu boot mới 8c4aa907 = #121 (ứng viên — parent quyết (e) ở aggregate
  195); (m) boot mới THÔ 0 requeue (T2-195 phân loại CUỐI — (m) #121 thuộc
  T2-196); POSTBOOT_PASS cho boot mới chi tiết + mode/caveat (T56-195:
  replay-day-du, poll=0, GST thư mục thật); lượt yên #63 (T4-195: attempt3
  HỢP LỆ, chuỗi 0 → 1 đề xuất); harness + O8 bộ thứ hai + B2 + B1 (T8-195:
  6/6, 84l10 chuỗi 2 → 3, FULL PASS CÓ THỂ); #120/#121 có giết holder không
  (T56-195: cả hai KHÔNG giết, chuỗi 23 → 24 → 25); headroom + ENOSPC +
  E-247 + auto-trigger live lần FIRE thật đầu tiên (T9-195 — CHƯA đóng lúc
  T01 đóng cờ); kết quả sản phẩm P1–P4 đợt 195 (T01 không xác minh lại nội
  dung chuyên môn — chỉ trích dẫn cờ P1/P2/P3/P4-195).
- (m) #119/#120 + INSIDE #113/#114/#115 + (m) #56 (T2-195: (m) #119 KHÔNG CÓ
  ĐIỂM (CUỐI), (m) #120 DƯƠNG (CUỐI, +47,008 s), n 53/54 → 54/55; INSIDE B
  chuỗi 1 → 0 → 1; (m) #56 lần 37 VẪN CÓ ĐIỀU KIỆN); kết cục run 199 + run
  200 + HB/DR + cửa slot đợt 195 + khoảng lặng 5.739 s (T7-195 đã phán: run
  198 CA #26, họ 26/23, chuỗi SUCCEEDED đề xuất 5 → 7, cửa slot KHÔNG LÀNH,
  HB 53/593, DR 57/368); kết cục run 200 thuộc T7-196.
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-195); không kiểm lại
  nguyên nhân scheduler gap 8.406 s hay trigger của nó; không chạy `grep`/
  `find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực tiếp
  theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/appendix195.py` + `appendix195.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/boot-survey-195t01.sh`
  + `boot-survey-195t01.txt` (output thô 9 nguồn boot mới — đo tươi 08:41:23Z;
  script adapt từ 194; đo Cloudflare chặt theo F-188-T0-9; KHÔNG grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/recount-195-t01.py` +
  `recount-195-t01-temp.out` + `recount-195-t01-temp2.out` +
  `recount-195-t01-final.out` (BỎ — đua với batch T8, xem F-195-T01-8) +
  `recount-195-t01-final2.out` (CHỐT) +
  `crosscheck-195-t01.sh` + `crosscheck-195-t01-temp.out` +
  `crosscheck-195-t01-final.out` (BỎ — đua với batch T8) +
  `crosscheck-195-t01-final2.out` (CHỐT)
  (hai phương pháp đếm viết mới hoàn toàn; mốc tạm python 08:48:43Z + shell
  09:22:50–09:25:34Z, mốc cuối lần 1 10:03:45–10:05:59Z (BỎ), lần 2 (CHỐT)
  10:06:18–10:08:24Z — xem F-195-T01-8)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/o8-driver-195t01.sh` +
  `o8-195t01.log` + `o8-lock.log` + `o8-driver-195t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-195t01.mjs` (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua
  theo driver)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t01/gap122-draft.md`
  (bản nháp GAP §122 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)
