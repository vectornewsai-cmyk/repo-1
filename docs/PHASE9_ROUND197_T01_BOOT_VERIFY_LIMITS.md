# PHASE9_ROUND197_T01_BOOT_VERIFY_LIMITS.md

Đợt 197 — T01 (gộp T0+T1: boot survey + O8 + verify đếm + GAP §125).
Mở lượt cron 03:35:51 +07 27/11/2026 (= 20:35:51Z 26/11); survey đo tươi 20:41:28Z,
O8 20:43:41–20:50:33Z. Chỉ đọc + ghi file làm việc; không sửa code sản phẩm,
không push, không release/tag. Nguồn đứng: **§14.2 aggregate 196 BẢN
PARENT-KIỂM (84.800 B; parent kiểm đếm KHỚP TỪNG SỐ lần thứ 138, dedup python
+ kiểm chéo shell viết mới `/tmp/count-196-check.py` + `.sh`; §14.2-196 NGUỒN
GỐC CHƯA NGÃ NGŨ — tổng điền sẵn GIỮ 18)**. T01 KHÔNG khẳng định §14.2-196
theo nguồn nào khác. **CẬP NHẬT CUỐI: máy reboot THÊM lần nữa trong phiên —
ứng viên #125 (8304fcd1, btime 20:27:48Z, gap #124→#125 = 14.370 s); T01 đóng
cờ sau reboot này; không luồng nào khác stage lúc T01 đóng (xem dưới).**

**BỐI CẢNH: đợt 196 đã đóng (parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2-196).**
Đợt 197 là đợt thứ bảy theo hướng mới của user (15:03 25/11 — ƯU TIÊN hoàn thiện
sản phẩm; Editing Core — parity preview/render). T10-197 do lượt cron sau spawn
để đóng sổ; T01 KHÔNG đóng sổ.

## Kết quả chính

- **REBOOT MỚI TRONG PHIÊN — XÁC NHẬN 9 nguồn TƯƠI (đo 20:41:28Z)**: boot_id
  `8304fcd1-6390-4f7d-a9fe-814a29dd100d` (khác boot trước `611a02f2` #124 và khác
  `bc09b26e` #123); btime **20:27:48Z** (epoch 1795724868; uptime bracket khớp
  cùng giây — `uptime -s` 20:27:48Z, /proc/stat btime 1795724868, /proc/uptime
  819,46 s lúc 20:41:28Z → boot_est = btime −0,54 s; /proc/1 start_ticks 1302 =
  btime +13,02 s, stat mtime 20:28:01.576Z = btime +13,58 s; journal idx 0 duy
  nhất, first 20:28:01Z = btime +13 s; wtmp begins 20:28:01Z; `last` reboot
  20:28 still running; `who -b` Nov 26 20:28; Cloudflare đo chặt (local mid
  20:41:28Z vs CF-Date 20:41:30 GMT, chênh +2 s — đồng hồ ĐÚNG trong ±2 s;
  marker mtime không đổi).
  Gap #124→mới = **14.370 s (3h59m30s)**. Boot mới xảy ra SAU khi run 202
  SUCCEEDED (17:10:50Z), TRƯỚC khi đợt 197 mở (20:35:51Z). Boot #124 sống
  14.370 s rồi chết.
- **Số hiệu mới — ỨNG VIÊN #125 (parent quyết (e) ở aggregate 197)**:
  8c4aa907 = **#121 XÁC NHẬN** theo quyết (e)-195; 2f268a28 = **#122 XÁC
  NHẬN** theo quyết (e)-196 (parent quan sát trực tiếp lúc còn sống);
  bc09b26e = **#123 XÁC NHẬN** theo quyết (e)-196; 611a02f2 = **#124 ỨNG
  VIÊN** theo quyết (e)-196 (chưa xác minh độc lập — xem F-197-T01-1) →
  8304fcd1 = **#125** theo hệ quả trực tiếp.
- **Marker sống qua 73 reboot đã xác nhận (#49–#121)** — `~/.config/vcut-persistence-marker`
  mtime 2026-11-20 11:39:47.272154981Z không đổi, 239 B (nội dung ghi boot #48,
  2c0a7985, btime 2026-11-20T11:26:05Z). 75 với #122 + #123 đã xác nhận
  (quyết (e)-196); 76 nếu #124 xác nhận; 77 nếu #125 cũng xác nhận.
- **#124 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA (F-197-T01-1 — cùng mẫu
  #122):** journal/wtmp/dpkg chỉ còn boot hiện tại (#125) — #124 đã chết
  20:27:48Z trước khi T01-197 mở phiên. KHÁC #122 ở một điểm quan trọng:
  #124 **ĐÃ ĐƯỢC T01-196 đo tươi 9 nguồn lúc 16:29:48Z**
  (`boot-survey-196t01-b124.txt` còn trên đĩa: boot_id 611a02f2, btime
  16:28:18Z, uptime bracket +0,26 s, CF +2 s) — tồn tại của #124 được củng cố
  bằng (i) survey tươi T01-196, (ii) (m) requeue eid 11383 (T01-197 kiểm lại
  tươi — vẫn chỉ 2 requeue cả ngày 26/11), (iii) run 202 bị viết lại
  started_at + boot_gen sau reboot. Parent quyết (e) cho cả #124 và #125.
- **(m) boot mới — SỐ LIỆU THÔ, KHÔNG tự phân loại (thuộc T2-197 + parent)**:
  **(m) #124 THÔ = 1 requeue (DƯƠNG)** — eid 11383, run 202, 16:29:07.121Z =
  btime +49,121 s, TRONG cửa [16:28:51Z; 16:29:07,8Z] (T01-197 kiểm lại tươi).
  **(m) #125 THÔ = 0 requeue** — 0 event BẤT KỲ trong [20:25:00Z; 20:35:38Z]
  (DB đọc tươi); cửa (m) #125 [20:28:21Z; 20:28:37,8Z] trống hoàn toàn. Không
  run nào spanning btime #125: run 202 SUCCEEDED 17:10:50Z (trước btime
  11.818 s); run 203 bắt đầu 20:35:51Z (sau btime 483 s). (m) #123 THÔ 0
  requeue (T01-196) — phân loại CUỐI cũng thuộc T2-197.
- **Run 202 SUCCEEDED cf 9 s** (sched 14:35:51Z, claimed 17:10:41Z, finished
  17:10:50Z; started_at 1795710547 = btime #124 +49 s — bị VIẾT LẠI sau reboot
  #124, xem F-196-T01-8; boot_gen 7feb76ab) — kết cục thuộc T7-197.
  **Run 203 RUNNING lúc đọc** (sched/started 20:35:51Z = btime #125 +483 s;
  boot_gen 9f8e9e73 — đổi theo reboot; KHÔNG dùng đếm chuỗi đổi gen,
  F-194-T7-2) — run này là chính lượt cron đang chạy đợt 197.
- **KHOẢNG LẶNG SCHEDULER MỚI #C (F-197-T01-2) — BAO TRÙM btime #125:**
  lặng #C **8.404 s (18:15:34.111Z → 20:35:38.103Z)** bao trùm btime #125
  (lặng bắt đầu trước reboot 7.934 s; hồi phục sau reboot 470 s). 0 event
  scheduler BẤT KỲ (mọi job) trong lặng; event ID liên tục qua lặng (11413 →
  11414 — 0 event bị mất khỏi bảng). Hồi phục: feed-pulse-02 due 19:41:54Z
  started 20:35:38Z (trễ 3.224 s); heartbeat due 20:20:50Z started 20:35:38Z
  (trễ 888 s); doctor 19:00Z + 20:00Z VẮNG (không có job_runs trong cửa sổ).
  **8.404 s là lớn thứ hai trong họ — chỉ kém kỷ lục 8.406 s đợt 179 đúng
  2 s** (trên #B 6.826 s, #A 4.974 s, OUTAGE #3 5.739 s, OUTAGE #2 4.807 s).
  Cùng chữ ký #A/#B (heartbeat trễ ~890 s, feed-pulse trễ ~3.226 s, doctor
  VẮNG). Phân loại thuộc T7-197 + parent (n): OUTAGE MỚI (sự kiện thứ 6?)
  hay cùng failure mode? Tổng lặng 26/11 nay = 20.040 s + 8.404 s =
  **28.444 s (7h54m04s)** nếu tính cả #C.
- **POSTBOOT_PASS #124 CHƯA CÓ + POSTBOOT_PASS #125 CHƯA CÓ (T56-197 viết)**:
  round197-t56 chưa tồn tại lúc T01-197 survey 20:41Z; file POSTBOOT_PASS
  trong round196-t56 lúc survey vẫn là cờ #123 (315 B, 14:41:58Z). T01 KHÔNG
  viết cờ thay (tiền lệ #118/#120/#122 — viết cờ không-verify là bịa đặt).
  **Tổng boot không cờ 30 → 31 nếu #124 không cờ, → 32 nếu #125 cũng không
  cờ** (quyết (c) thuộc parent; T56-197 + parent quyết). T56-197 lúc 20:45Z
  đang repair: postboot check-only exit=1, GST hệ thống VẮNG, dpkg.log 2 dòng
  (replay chưa chạy xong — `t5-postboot-verify-8304fcd1.log`).
- **Watcher-196 CHẾT theo reboot #124** (T01-196). **Watcher-197 CHƯA SPAWN**
  (không process watcher lúc survey 20:41Z; ps-check-197.txt của T56-197 lúc
  20:45:05Z ghi "0" — T56-197 spawn, kiểm ps trước theo quy tắc đứng).
- **libevent VẮNG lúc survey (boot+13m40s)** — giống #112/#115/#116/#117/
  #119/#124 (VẮNG lúc mở boot, CÓ sau replay); dpkg.log 2 dòng lúc survey
  (replay chưa chạy — T56-197 viết POSTBOOT_PASS #125).
- **O8 trên boot mới — WebKit attempt1 FAIL, attempt2 PASS 21/21, Chromium
  PASS 21/21 (20:43:41–20:50:33Z, 6m52s)**: WebKit attempt1 exit=2 —
  harness timeout chờ project mẫu tự load (3 clip, media bin 2 item;
  last=null; 0 result — JSON 739 B, md5 67cc5892); attempt2 exit=0,
  **21/21 PASS** (S1 PASS 20:48:30Z; launched 27.2; JSON 21 results, 21
  ok=true, md5 1e0420fa); Chromium exit=0, **21/21 PASS** (JSON 21 results,
  21 ok=true, md5 e84af3fb). Đếm lại từ JSON gốc bằng python. **0 lỗi exit
  127** trong cả 3 bộ (3 dòng chứa "127" trong log đều là http://127.0.0.1
  bridge OK). Script gốc KHÔNG đổi so với đợt 196 (webkit 4994b4fc, headed
  c8acd72e); preview.tsx lúc O8 = **af6c3cc7** (mtime 16:10:49Z, TRƯỚC O8 —
  CHẮC, không đổi suốt O8); media.ts = **ac89aeb2** (mtime 14:43:14.760Z,
  TRƯỚC O8 — CHẮC đợt này, khác F-196-T01-5: mtime không trùng giây driver
  bắt đầu; **cả 3 bộ O8 đợt này CÙNG CÂY**, khác đợt 196). O8 chạy TRONG LÚC
  T4 chỉ poll (poll #4–#8 ghi lock=co t01-round197, KHÔNG mở attempt — 0
  chồng lấn; poll #9 20:50:35Z lock=khong sau release). **Chân FULL PASS "O8
  3/3 ×2 cùng boot cùng cây" KHÔNG ĐẠT đợt này** (chỉ 2/3 bộ pass — attempt1
  fail vì load timeout, không phải assertion S1; xem F-197-T01-3).
  X11: 0 process Xvfb của T01 sót sau O8 (/tmp/.X11-unix TRỐNG sau O8).
  Boot lúc O8 xong vẫn 8304fcd1. Không có reboot mới trong lúc O8 chạy.
- **Cờ các luồng khác lúc T01 đóng (20:53Z) — 0/11 cờ có nội dung; KHÔNG
  luồng nào stage paths/.done lúc T01 đóng**: P1/P2/T2/T4/T56/T7/T9 đang làm
  việc (có thư mục làm việc + file trung gian — P1 exp-m12-197.json, P2 file
  .rgb/.yuv, T7 appendix197, T9 b2-spikes.log, T56 gen-watcher-197.py +
  replay-watch, T4 poll #11 20:52:06Z vẫn chỉ poll, gate0 chưa đạt), nhưng
  chưa luồng nào có LIMITS/paths/.done. T10-197 quyết giao muộn hay rớt đợt.
  T01 chỉ trích dẫn trạng thái thư mục, không xác minh nội dung chuyên môn
  của các luồng chưa đóng.

## Đếm — MỐC ĐẾM CUỐI (hai phương pháp khớp nhau; xem F-197-T01-4)

- **Verdict CUỐI (đếm cuối, hai phương pháp KHỚP TỪNG SỐ): 1/11 batch,
  đợt 197 = 1/2/2/1.**
  Tái kiểm 111–196 KHỚP quyết parent (q) đợt 196 TỪNG SỐ; đợt 190 = 0/0/0/0
  (VOID); 0 file thiếu; chuỗi khớp nối dài lần thứ **140** (T01-197 cuối —
  python + shell khớp nhau). Batch của chính T01 ĐÃ BAO trong đếm cuối
  (stage TRƯỚC khi đếm cuối — cùng tiền lệ đợt 196, khác F-195-T10-1).
  Các batch stage SAU mốc này thuộc đếm lại của T10-197 — T10 chạy lại hai
  phương pháp sau closing.
- **Phương pháp (hai phương pháp độc lập, VIẾT MỚI HOÀN TOÀN)**: phương pháp
  1 (python) `recount-197-t01.py` — quét toàn bộ `phase9-round*.txt`, sắp
  xếp theo SỐ ROUND tăng dần, chuẩn hoá đường dẫn tuyệt đối về tương đối
  trước khi dedup, đếm lại toàn cục (KHÔNG cộng dồn — tiền lệ đợt 126–127),
  kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa; phương pháp 2 (shell)
  `crosscheck-197-t01.sh` — chỉ dùng `tr` / `sort -u` / `comm` / `wc`:
  union theo thứ tự round tăng dần, file mới = union(khoảng) trừ union
  (trước khoảng), kiểm trực tiếp mọi đường dẫn duy nhất trên đĩa (đường
  dẫn tuyệt đối kiểm trực tiếp, không ghép prefix — bài học F-188-T10-1;
  KHÔNG cắt chuỗi e[25:] — bài học lỗi 14 "thiếu" giả đợt 196).
- **Mốc đếm TẠM (0/11 cờ: chưa luồng nào stage; 0 file đợt 197 lúc bắt đầu
  VÀ lúc kết thúc đếm tạm)**:
  quét **1.497 file** `phase9-round*.txt` (round 1–196, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.458; tổng đường
  dẫn duy nhất toàn cục 4.132.
- **Đợt 197 (TẠM) = 0/0/0/0.**
- **Lũy kế 111–197 (TẠM) = 849/1.588/1.345/1.149. Chờ push (TẠM) =
  71/239/174/154 (191+192+193+194+195+196). Tổng 1–197 (TẠM) =
  1.497/7.458/4.132.** (= tổng 1–196 vì chưa có file 197.)
- **Chuỗi khớp TẠM: 138 (parent-196) → 139 (T01-197 tạm, python only —
  shell crosscheck tạm chạy cùng mốc đếm CUỐI, xem F-197-T01-4).**
- **Mốc đếm CUỐI (CHỐT 20:54:37Z python + 20:54:52–21:01:41Z shell, SAU khi stage batch T01 — 1 file
  `phase9-round197-t01-boot-verify.txt`, 1 batch: T01)**:
  quét **1.498 file** `phase9-round*.txt` (round 1–197, round thiếu duy
  nhất: 190 — VOID); purity 0 cảnh báo; tổng entry thô 7.460; tổng đường
  dẫn duy nhất toàn cục 4.133.
- **Đợt 197 (CUỐI) = 1/2/2/1** (1 batch, 2 entry, 2 đường dẫn, 1 file mới).
  1 file mới: LIMITS T01-197 (`docs/PHASE9_ROUND197_T01_BOOT_VERIFY_LIMITS.md`).
  1 đường dẫn không mới: GAP (`PHASE9_GAP_ANALYSIS.md` — đã có từ đợt 1).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 4.133 đường dẫn duy nhất — cả hai
  phương pháp, mốc cuối; shell crosscheck: `missing=0 total_uniq=4133`,
  `SH_EXIT=0`; python: `missing=0 []`, `PY_EXIT=0`).
- **Lũy kế 111–197 (CUỐI) = 850/1.590/1.346/1.150. Chờ push (CUỐI) =
  72/241/175/155 (191+192+193+194+195+196+197). Tổng 1–197 (CUỐI) =
  1.498/7.460/4.133.** Tái kiểm: 111–196 = 849/1.588/1.345/1.149 (KHỚP
  (q)-196); 111–195 = 837/1.544/1.316/1.121 (KHỚP (q)-195); 111–194 =
  826/1.515/1.292/1.097 (KHỚP (q)-194); 111–193 = 814/1.474/1.262/1.072
  (KHỚP (q)-193); 111–192 = 802/1.433/1.238/1.049 (KHỚP (q)-192); 111–191 =
  790/1.394/1.213/1.026 (KHỚP (q)-191); 111–190 = 778/1.349/1.173/995
  (KHỚP (q)-189).

## Giới hạn / sai số ghi nhận (F-197-T01-*)

- **F-197-T01-1 — #124 KHÔNG XÁC MINH ĐƯỢC BẰNG 9 NGUỒN TƯƠI NỮA
  (journal/wtmp chỉ còn boot hiện tại).** KHÁC #122: #124 đã được T01-196 đo
  tươi 9 nguồn lúc 16:29:48Z (file survey còn trên đĩa) + (m) requeue eid
  11383 + run 202 viết lại — 3 nguồn độc lập củng cố tồn tại; btime
  16:28:18Z + boot_id 611a02f2 có trong survey tươi của T01-196 (không chỉ
  trong quyết (e)-196). Parent quyết (e) cho cả #124 và #125. POSTBOOT_PASS
  #124 KHÔNG CÓ (không viết bù được — tiền lệ #118/#120/#122).
- **F-197-T01-2 — KHOẢNG LẶNG SCHEDULER MỚI #C: 8.404 s, BAO TRÙM btime #125.**
  Chỉ kém kỷ lục 8.406 s đợt 179 đúng 2 s — lớn thứ hai trong họ. Cùng chữ
  ký #A/#B (0 event bất kỳ; ID liên tục; reboot nằm trong lặng; run trễ lúc
  hồi phục: heartbeat +888 s, feed-pulse +3.224 s; doctor 19:00Z + 20:00Z
  VẮNG). 5 lặng trong ~19 giờ ngày 26/11 (onset 01:15:34Z, 07:00:00Z,
  10:12:46Z, 12:41:54Z, 18:15:34Z) — failure mode LẶP LẠI, tần suất đang
  tăng. Phân loại thuộc T7-197 + parent (n): OUTAGE MỚI (sự kiện thứ 6?)
  hay cùng failure mode? OUTAGE #1/#2/#3/#4/#5 VẪN MỞ riêng (theo (n)-196).
- **F-197-T01-3 — O8 WebKit attempt1 FAIL (harness timeout, KHÔNG phải
  assertion S1).** Attempt1 (20:43:41–20:48:06Z): vite lên 20:43:47Z, webkit
  launched 27.2 20:43:53Z, rồi chờ project mẫu tự load tới timeout 4m13s
  (last=null, 0 result). Bối cảnh lúc đó: RAM avail chỉ 578–686 MB lúc mở
  boot; một luồng khác chạy `tsc --noEmit` ở 95,5% CPU trong lúc O8 chạy;
  T56-197 chạy `vcut-webkit-postboot-check.sh --repair`; apt replay chưa
  chạy (dpkg.log 2 dòng, libevent VẮNG, GST hệ thống VẮNG). Attempt2 trên
  cùng boot + cùng cây PASS 21/21 hai phút sau — bằng chứng lỗi là đói
  tài nguyên lúc load, không phải hồi quy sản phẩm. Chân FULL PASS "O8 3/3
  ×2 cùng boot cùng cây" KHÔNG ĐẠT đợt này (2/3 bộ pass). T10/parent lưu ý
  khi quyết (b)-197.
- **F-197-T01-4 — Shell crosscheck TẠM HOÃN tới mốc đếm CUỐI (chưa chạy lúc
  đếm tạm).** Đếm tạm python chạy 20:43:32Z trong lúc T4 chỉ poll (0 chồng
  lấn attempt đang chạy); shell crosscheck nặng ~3 phút chạy cùng mốc đếm
  CUỐI sau khi O8 xong, T4 vẫn chỉ poll (poll #11 20:52:06Z, blockers=0,
  gate0 chưa đạt — chưa mở attempt). Tiền lệ F-195-T01-4/F-196-T01-4.
  Chuỗi khớp TẠM 139 tính trên python + tái kiểm khớp (q)-196.
- **F-197-T01-5 — Probe S1 của T01-197 CHƯA BAO GIỜ CHẠY (lỗi setup của
  chính T01).** File probe `o8-s1-probe-197t01.mjs` (copy từ đợt 196 + sed)
  import `./eperm-retry.mjs` — file này chỉ có trong `round196-t01/`, T01
  không copy sang `round197-t01/` nên probe chết ngay bằng
  ERR_MODULE_NOT_FOUND (exit=1, 20:48:06Z). Không ảnh hưởng kết luận: attempt2
  PASS đầy đủ gồm S1 PASS 20:48:30Z trên cùng boot + cùng cây — probe là
  thừa. Bài học: khi copy script probe sang thư mục đợt mới, kiểm tra đủ
  dependency import trước khi chạy driver.
- **F-197-T01-6 — GAP §124 ĐÃ ĐÍNH CHÍNH (giao (r)-196).** §124 bản T01-196
  ghi "LIMITS T2 32.716 B" là SAI — kích thước thật trên đĩa 43.715 B
  (T01-197 đo `wc -c`, khớp quyết (a)-196 của parent: T2 +5.947 B).
  T01-197 đã sửa §124: "LIMITS **43.715 B — VƯỢT trần push 37.768 B
  (+5.947 B)**". 3/11 LIMITS đợt 196 vượt trần (T2 +5.947 B, T56 +5.252 B,
  T9 +1.172 B) — lúc push cần ENABLE_PRIVSEP=0.
- **F-197-T01-9 — Dự đoán đếm cuối của chính T01 SAI 1 đường dẫn (đã sửa
  trước khi đóng cờ).** Bản nháp LIMITS ban đầu ghi lũy kế 1.347 / chờ push
  176 / tổng uniq 4.134 — sai vì T01 cộng +2 cho cả hai entry của batch
  (GAP + LIMITS) trong khi GAP đã có trong union 111–196 (first_seen round
  59) nên union chỉ +1 (LIMITS). Hai phương pháp độc lập đều cho 1.346 /
  175 / 4.133 — đã sửa cả 3 chỗ trong LIMITS trước khi đóng cờ. Bài học:
  đừng cộng tay số "đường dẫn" theo số entry — chỉ tin dedup chạy lại.
- **F-197-T01-7 — ĐÍNH CHÍNH SỐ MỤC GAP: T01-197 viết §125 cho đợt 197.**
  §123 đã có (T10-195 viết cho đợt 195), §124 đã có (T01-196 viết cho đợt
  196) — T01-197 viết **§125** (không ghi đè §123/§124, không tạo § trùng).
  T10-197 + parent lưu ý khi đối chiếu số mục GAP.

## Phạm vi chưa kiểm (không thuộc T01)

- ĐÃ ĐÓNG TRONG PHIÊN (T01 trích dẫn, không xác minh lại nội dung chuyên
  môn): số hiệu #124/#125 (ứng viên — parent quyết (e)); (m) #124 THÔ 1
  requeue DƯƠNG + (m) #125 THÔ 0 requeue (phân loại CUỐI thuộc T2-197);
  POSTBOOT_PASS #124/#125 (T56-197); lượt yên #65 (T4-197: chưa mở attempt
  lúc T01 đóng — gate0 chưa đạt, chờ cờ T5 của T56-197); kết quả sản phẩm
  P1/P2/P3/P4 đợt 197 (chưa luồng nào đóng lúc T01 đóng).
- CHƯA KIỂM / CHUYỂN ĐỢT 198: số hiệu #125 (ứng viên — parent quyết (e));
  (m) #125 THÔ 0 requeue (phân loại CUỐI thuộc T2-197 — cùng (m) #123/#124);
  POSTBOOT_PASS #124/#125 (T56-197); watcher-197 (T56-197 spawn, kiểm ps
  trước); kết cục run 203 (T7-197 — run đang chạy, là chính lượt cron đợt
  197); lặng #C 8.404 s (phân loại thuộc T7-197 + parent (n)); T7/T8/T9/P1/
  P2/P3/P4 đợt 197 — KHÔNG có cờ lúc T01 đóng (T10-197 quyết giao muộn hay
  rớt đợt); khung ban ngày 26/11 (17:05:52Z → 17:35:40Z) giao T7-197 kiểm —
  CHƯA CÓ kết quả lúc T01 đóng (T7 đang làm appendix197).
- (m) #121 + INSIDE + (m) #56 (T2-197 — đã đóng? CHƯA CÓ cờ lúc T01 đóng).
- Không kiểm lại dải FULL125–FULL156; không chạy lại suite T1 ngoài O8;
  không xác minh actor của replay boot mới (thuộc T56-197); không kiểm lại
  nguyên nhân khoảng lặng scheduler #C hay trigger của nó; không chạy
  `grep`/`find` đệ quy lúc mở đợt (bài học F-179-T9-6 — T01 chỉ đọc file trực
  tiếp theo đường dẫn đã biết + grep hẹp trên file log/flag đã liệt kê).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/appendix197.py` + `appendix197.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay — đã sửa 1 lỗi epoch
  của chính T01: c_last 1795718134 → 1795716934, xem F-197-T01-8)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/boot-survey-197t01.sh`
  + `boot-survey-197t01.txt` (output thô 9 nguồn boot mới #125 — đo tươi
  20:41:28Z; script adapt từ 196; đo Cloudflare chặt theo F-188-T0-9; KHÔNG
  grep đệ quy)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/recount-197-t01.py` +
  `recount-197-t01-temp.out` +
  `recount-197-t01-final.out` (đếm cuối, python) +
  `crosscheck-197-t01.sh` + `crosscheck-197-t01-final.out` (đếm cuối, shell;
  temp hoãn tới mốc cuối, xem F-197-T01-4)
  (hai phương pháp đếm viết mới hoàn toàn; mốc tạm python 20:43:32Z)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/o8-driver-197t01.sh` +
  `o8-197t01.log` + `o8-lock.log` + `o8-driver-197t01.nohup.log` + `o8-webkit/` +
  `o8-chromium/` (JSON stamped theo lượt + bản copy attempt khớp md5) +
  `o8-s1-probe-197t01.mjs` (probe CHƯA BAO GIỜ CHẠY — lỗi import
  eperm-retry.mjs, xem F-197-T01-5)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round197-t01/gap125-draft.md`
  (bản nháp GAP §125 trước khi ghi vào PHASE9_GAP_ANALYSIS.md)

## Phụ lục — F-197-T01-8 (lỗi epoch của chính T01, đã sửa)

- Bản đầu `appendix197.py` ghi c_last (event cuối trước lặng #C) =
  1795718134.111 — SAI 1.200 s (20 phút): epoch đúng của 18:15:34.111Z là
  1795716934.111 (kiểm bằng `date -d @1795716934` = 18:15:34Z). Hậu quả:
  lặng #C tính sai 7.204 s thay vì **8.404 s** đúng; onset→btime sai 6.734 s
  thay vì 7.934 s; xếp hạng "lớn thứ hai" vẫn đúng nhưng số sai. T01 phát
  hiện khi đối chiếu `date -d` độc lập, đã sửa script + chạy lại, output
  `appendix197.txt` hiện tại là bản đúng (đã kiểm chéo bằng `date -d` cho cả
  4 mốc: 18:15:34Z, 20:35:38Z, 19:41:54Z, 20:20:50Z). Bài học: mọi epoch
  gõ tay vào appendix PHẢI kiểm bằng `date -d @epoch` trước khi dùng.
