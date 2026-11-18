# LIMITS — T3 đợt 127: LEG KIỂM TRA XEN KẼ cho trục PSI (dial vùng chuyển + Yên xen kẽ)

**Ngày:** 17/11/2026 (đo 17/11/2026, 03:47–04:11Z). **Luồng:** T3, đợt 127
vòng lặp Phase 9 (lượt cron 09:35 +07 17/11/2026). **Trạng thái:**
**LEG XEN KẼ XONG 12/12 VALID (6 dial + 6 Yên), 0 run bù, 0 VOID.**
**Prereg:** `hidden_files/round127-t3/prereg-interleave.md`
(đăng ký trước mọi phép đo, kể cả warm-up attempt; thứ tự xen kẽ
seed 1273).
**Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — leg này không xét lại verdict,
không gộp số với bộ verdict (cây H3f, boot đã chết).

## 0. Tóm tắt (đọc trước)

- **XEN KẼ KHÔNG LẶP LẠI — câu hỏi chính của leg ĐÃ CÓ ĐÁP ÁN.**
  Dãy con dial theo thứ tự thực hiện (run 1, 2, 4, 6, 7, 9):
  **chậm–nhanh–nhanh–chậm–nhanh–chậm (S-F-F-S-F-S)** — KHÔNG xen kẽ
  hoàn hảo (run 2 nhanh → run 4 nhanh, hai run nhanh liên tiếp).
  Mẫu hình S-F-S-F-S-F của đợt 126 phù hợp với ngẫu nhiên (p ≈ 3%
  cho một lần xen kẽ hoàn hảo không phải không thể xảy ra);
  **không có bằng chứng yếu tố xen kẽ hệ thống.** Kết luận này
  BỀN với biên ngưỡng: run 4 nhanh chỉ dưới ngưỡng 5 ms (1,195 s);
  nếu tính run 4 là chậm thì dãy thành S-F-S-S-F-S — vẫn không xen
  kẽ hoàn hảo (hai chậm liên tiếp).
- **Tỉ lệ chậm: nhóm dial 3/6 (như đợt 126), nhóm Yên 0/6.**
  Nhóm dial TRỘN ở run means **30,83–41,48% (mean 35,99%)** —
  THẤP HƠN hẳn cửa sổ mục tiêu 45–55% (xem §5: W chỉ 32,36% trên
  boot mới, TARGET-MISS-LOW). Vùng trộn quan sát được **MỞ RỘNG
  xuống ~31–53%** (trước đây ~46–53%): run 6 CHẬM (1,702 s) ở
  31,52% trong khi run 4 NHANH (1,195 s) ở 31,67% — tải gần như
  bằng nhau, kết quả ngược nhau; run 1 CHẬM (1,322 s) ở 41,40%
  trong khi run 2 NHANH (1,082 s) ở 41,48% — lặp lại đúng mẫu hình
  "dải ngẫu nhiên" của đợt 126.
- **Ngưỡng Yên <30% ĐỨNG:** run chậm thấp nhất ở 30,83% (run 9) —
  ngay trên 30%; không có run chậm nào dưới 30%. Nhóm Yên means
  4,09–14,13%, toàn nhanh (median T_startup 0,672 s).
- **Dial ấm:** W = 32,36% vs mean 6 run means dial 35,99% → **sai
  số dial ấm 3,63 điểm (tiêu chí ≤5 — ĐẠT)**, nhưng biến thể chỉ
  tính run ổn định (run 2, 7: mean 40,28%) cho sai số **7,92 điểm
  — KHÔNG ĐẠT** (xem §5: W dự báo đúng mean cả leg gồm run leo
  dốc, nhưng đánh giá thấp run ổn định ~8 điểm — phụ thuộc
  ambient thấp trên boot mới).
- **Hold 30 s sau warm-up CÓ TÁC DỤNG:** run 1 mean 41,40% —
  KHÔNG còn là run leo dốc (cao hơn cả mean run ổn định 40,28%),
  khác hẳn đợt 126 (hold 90 s → run 1 chỉ 39,47%, thấp hơn hẳn
  các run sau 45,48–48,00%). Bài học hold ngắn ĐÃ ĐƯỢC CHỨNG MINH.
- **tickRate mức trung gian TÁI HIỆN:** nhóm dial **31,68–33,01
  (mean 32,44)** — nằm trong khoảng ~28–33; nhóm Yên **70,54–72,80
  (mean 71,57)** — khớp nhàn ~71,5. Đường cong 6 điểm (n=36):
  71,6 @ ~7% → 32,4 @ ~36% → 32,0 @ ~46% → 28,5 @ ~53% → 18,5 @
  ~70% → 16,8 @ ~91%.
- **Pha (b) T_seek MIỄN NHIỄM với tải — giữ ở n=42:** max 0,001 s
  trên cả 12 run (30 run trước cũng ≤0,001 s).
- **Reboot giữa đợt:** boot #72 (81464315, btime 02:10:17Z) CHẾT
  03:04:25Z (thọ 54'08"); boot #73 mới (5e522260, btime 03:04:25Z)
  — leg chạy toàn bộ trên boot #73, cây baseline không đổi.
  Gatewaiter + watcher của T3 chết theo reboot, đã khởi động lại
  03:20:43Z (xem §4).
- **Caveat T9 (bắt buộc):** cờ `round127-t9-done` mà gate của T3
  chờ KHÔNG phải "lượt yên #7 hợp lệ" — T9 đợt 127 có **0 lượt yên
  hợp lệ** (3/3 attempt gate A không mở, 0 probe; chi tiết:
  `docs/PHASE9_ROUND127_T9_WEBKIT60MS_LIMITS.md`); cờ được touch
  03:46:18Z khi attempt3 của T9 xong để mở leg tải cho T3. Gate
  của T3 vẫn hợp lệ theo đúng mục đích phối hợp (không hog nào
  chạy khi T9 còn attempt — hog đầu tiên spawn 03:47:19Z, sau cờ
  ~1 phút), nhưng "cửa yên sạch" ở đây nghĩa là "T9 đã xong mọi
  attempt, không còn cửa yên đang chạy", KHÔNG phải "đã có lượt
  yên hợp lệ". Nợ lượt yên #7 chuyển tiếp sang đợt sau.
- **Pha (a) bar — CHỈ THAM KHẢO (không xét verdict):** nhóm dial
  CHƯA ĐẠT (median 1,259 > 1,0; p90 1,702 > 1,2); nhóm Yên ĐẠT
  (median 0,672 ≤ 1,0; p90 0,775 ≤ 1,2). Pha (b): ĐẠT cả hai nhóm.

## 1. Bối cảnh + boot + cây (verify trước/sau leg)

- Cây BASELINE, không đổi trong leg: preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b`, media.ts md5
  `2c384ed13703809d5e999311147745e7` — verify lúc viết prereg
  (02:40Z), lúc mở driver (03:47:15Z) và sau leg (04:08:13Z), khớp nhau.
- **Hai boot trong đợt — prereg viết trên boot #72, leg chạy trên
  boot #73:**
  - Boot #72: boot_id `81464315-ba1a-460d-b370-92a1673accc1`, btime
    02:10:17Z. Prereg ghi boot này (lúc viết prereg gọi là "#71?"
    theo chuỗi thời gian cũ — SỐ SAI, theo T9 boot này là **#72**;
    đính chính tại đây, số #72/#73 lấy theo T9-127).
    Gap #71→#72 = 2h44'36" (#71 btime 23:25:41Z 16/11 → #72
    02:10:17Z).
  - Boot #72 CHẾT ~03:04:25Z (thọ 54'08", cell reboot); boot #73
    mới: boot_id `5e522260-235e-4394-a888-bce604728204`, btime
    03:04:25Z. **Cờ POSTBOOT_PASS đợt 126 KHÔNG dùng được, và cờ
    POSTBOOT_PASS của T5-127 trên boot #72 cũng KHÔNG có** (T5-127
    chờ replay trên #72, postboot FAIL — xem LIMITS T5-127).
  - Leg chạy toàn bộ trên boot #73, không đổi boot trong lúc leg
    (uptime -s kiểm trước mỗi run + cuối driver).
- Cờ POSTBOOT_PASS của **T5 đợt 127** (khớp #73, KHÔNG dùng cờ
  đợt 126 — luật STALE): `boot_id=5e522260-235e-4394-a888-bce604728204
  btime=2026-11-17T03:04:25Z pass_at=2026-11-17T03:11:16Z poll=2`
  (định dạng dấu `=` như đợt 125/126; gatewaiter dùng mẫu
  `boot_id[:=] *` nên khớp ngay poll #1 sau khi khởi động lại).
- H3f GIỮ GỠ. Không sửa production (chỉ docs + script benchmark).
  Không push. Không release/tag.
- Không đụng TTS 39. Không đụng birefnet (RAM avail 331–1119 MB
  trong leg, < guard 6 GB theo quyết parent). Không binary vào batch.

## 2. Validate công cụ TRƯỚC khi đo (prereg §0.2 — ĐẠT, 02:42–02:48Z)

- Analyzer 127t3 `S9_BAND=GAP` trên dữ liệu đợt 124: **0 case**
  (12/12 SKIP — lọc GAP không ăn nhầm case cũ).
- Analyzer 127t3 `S9_BAND=MEDIUM` trên cùng dữ liệu: tái hiện đúng
  **6/6 VALID**, median T_startup 1,8425 s (≈1,843 s LIMITS 124t4
  §2.1), p90 2,992 s, slow 6/6 — hồi quy path MEDIUM OK.
- check-valid-127t3.py `S9_BAND=GAP`: **VALID_COUNT=0, TOTAL=0**;
  `S9_BAND=MEDIUM`: **VALID_COUNT=6, TOTAL=6** (copy tạm OUT 124 →
  OUT 127t3 + brackets 124 → brackets-127t3.json, đã XÓA cả hai sau
  test — verify không còn file 127t3 OUT/brackets lúc validate).
- `psi_avg60()`: đọc được 6,01%, khớp dòng `some` trong
  /proc/pressure/cpu lúc test.
- `bracket-127t3.py` entry TEST-bracket: ghi đúng avg60=6,01%,
  band=GAP, hogs_target=2; đã xóa brackets-127t3.json về `{}` sau
  test.
- `node --check` runner 127t3 OK; `bash -n` driver/gatewaiter/
  watcher OK (02:48Z); `python3 -m py_compile` analyzer/check-valid/
  bracket OK.
- Lock script copy md5 = `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp
  baseline đóng băng). Diff probe 127t3 vs 126t4: chỉ các dòng đổi
  PORT 8985→8987, S9_DIR, OUT leg4555→interleave, round string,
  Xvfb :199→:197, nhãn đợt — không đổi flow đo.
- Không chạy tsc/vite build đợt này: không sửa production (chỉ docs
  + script benchmark; script đã validate bằng node --check +
  py_compile + hồi quy analyzer trên dữ liệu thật đợt 124).

## 3. Thứ tự xen kẽ — ĐÃ CHẠY ĐÚNG PREREG

Thứ tự đăng ký trước (seed 1273, không đổi sau khi đăng ký):

| vị trí j | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| nhóm | **D** | **D** | **Y** | **D** | **Y** | **D** | **D** | **Y** | **D** | **Y** | **Y** | **Y** |

- Vị trí dial: 1, 2, 4, 6, 7, 9. Vị trí Yên: 3, 5, 8, 10, 11, 12.
- Driver chạy đúng 12 vị trí theo thứ tự, 0 run bù (cả hai nhóm
  đủ 6/6 VALID ngay lượt đầu — không kích hoạt nhánh bù vị trí 13).
- Loại tiền lệ từng run (ghi trong driver log): D-sau-D: run 2, 7;
  D-sau-Y (leo dốc): run 4, 6, 9; Y-sau-D: run 3, 5, 8, 10;
  Y-sau-Y: run 11, 12; START: run 1.

## 4. Gate + phối hợp T9 (timeline thật)

- Gatewaiter T3 v1 chạy từ 02:49:26Z trên boot #72 (poll check-only
  riêng, mỗi 2 phút); watcher `t3-watch-gate.sh` khởi động cùng lúc
  bằng setsid + nohup (pid 13789, xác nhận chạy). Poll #1–#8
  (02:49–03:03Z): postboot_exit=1, t5flag=khong-co, t9flag=khong-co
  (T5-127 chờ replay trên #72; T9-127 gate 0 trên #72 không đạt
  sau 12 poll).
- **Reboot 03:04:25Z giết cả gatewaiter v1 (pid 13705) lẫn watcher
  (pid 13789)** — phát hiện lúc kiểm tra 03:20Z (`pgrep` không còn
  tiến trình T3 nào; T5 đã PASS trên boot mới 03:11:16Z). Đã khởi
  động lại cả hai 03:20:43Z/03:20:45Z (gatewaiter pid 9896, watcher
  pid 9985) — gatewaiter mới đọc BOOT_START = boot #73 ngay từ đầu,
  không cần reset logic. Không có hog nào chạy trong khoảng trống
  này (driver chưa từng chạy trước gate).
- Gatewaiter v2 trên boot #73: poll #1 03:20:43Z — postboot_exit=0,
  aptx=0, dpkgx=0, dpkg_lines=1509, RAM avail 331 MB (thấp nhất
  đợt), preview_md5=03bf029f, **t5flag=PASS-co**, t9flag=khong-co.
  Poll #2–#13: mọi điều kiện xanh trừ cờ T9. **GATE 0 ĐẠT ở poll
  #14, 03:46:46Z** (trước hạn 04:00Z): 6/6 điều kiện — (0a)
  check-only riêng exit 0; (0b) apt/apt-get/dpkg = 0 (đếm bằng
  `pgrep -x`, không grep-ps); (0c) md5 preview 03bf029f; (0d)
  POSTBOOT_PASS T5-127 khớp #73 (pass_at 03:11:16Z, poll=2); (0e)
  boot không đổi; (0f) cờ round127-t9-done CÓ (touch 03:46:18Z).
  RAM avail lúc gate ĐẠT 925 MB; dpkg_lines 1509 (replay xong,
  T5 PASS — không kích hoạt repair, không áp dụng luật §8.2 (B)).
- Watcher thấy GATE DAT 03:47:15Z → chạy driver
  `run-127t3-all.sh`. Driver bắt đầu 03:47:15Z, kết thúc 04:08:13Z
  (phân tích xong ~04:11Z), **exit 0**. Xvfb :197 (pid 15103).
  Postboot check lúc mở driver exit=0. RAM avail lúc mở driver
  868 MB. Registry GStreamer mtime không đổi (03:12:37 trước = sau
  leg; gstRegChanged=false mọi run).
- **T9 chạy attempt1–3 TRƯỚC, không lượt yên hợp lệ nào:** theo
  LIMITS T9-127, 3/3 attempt gate A không mở (attempt1/2: T8 giữ
  lock vite; attempt3: RAM kẹt 500–684 MB < ngưỡng 1024 MB),
  0 probe, 0 số đo tickCost; ngưỡng WebKit ≤60 ms GIỮ (không đổi);
  nợ lượt yên #7 chuyển tiếp. Cờ `round127-t9-done` được T9 touch
  **03:46:18Z** ngay khi attempt3 xong (trước LIMITS/batch) để mở
  leg tải cho T3. **T3 KHÔNG chạy bất kỳ hog nào trước cờ này** —
  hog đầu tiên spawn 03:47:19Z, sau cờ ~1 phút; 0 phút chồng chéo
  hog lên attempt của T9 (xem caveat §0 về ý nghĩa của cờ).
- **Ghi nhận trung thực:** gate của T3 ĐẠT trước hạn 04:00Z có
  13 phút dự phòng; nếu T9 attempt3 kéo dài thêm ~15 phút thì leg
  đã thành nợ mở theo prereg §0 (không đo vội, không chạy tải đè
  lên T9).

## 5. Dial bằng browser ẤM (DEF v0.3 §4.7) + hold 30 s (MỚI)

- Bắt đầu **2 hog** (pids 15119, 15120, nice -n 19), chờ 90 s.
- Warm-up attempt #1, **03:48:51–03:49:38Z, exit 0** (runner thật,
  OUT throwaway `warmup-out.json`, Q6_START=0, qua lock
  `t3-round127-warm`): case `Lc8-f2s-run0` trong file warmup —
  **W = avg60 mean 32,36%** (tickRate 30,22; frames 320; dropped 0;
  T_startup 1,589 s — CHẬM, chỉ ghi tham khảo, KHÔNG tính vào bộ
  12 run theo prereg).
- W = 32,36% nằm DƯỚI cửa sổ mục tiêu [45, 55] với 2 hog →
  **TARGET-MISS-LOW** (ghi `dial-GAP.txt` = "TARGET-MISS-LOW hogs=2
  W=32.36") — CHẤP NHẬN mức 2 hog theo prereg §3 (không thêm hog
  thứ 3). **Không cần warm-up #2** (luật chỉ warm-up lại khi W >
  55).
- **Vì sao W thấp hơn hẳn đợt 126 (45,74%)?** Cùng 2 hog nice-19,
  nhưng ambient trên boot #73 lúc dial rất thấp (avg60 lúc mở
  driver chỉ 3,94%; RAM avail 868 MB) — hog-only hội tụ quanh
  ~25–30% thay vì ~35–40% như trên boot #71 (nơi sibling E4/T8
  chạy nặng hơn, ambient cao hơn). Browser/vite cộng thêm trong lúc
  chạy warm-up vẫn ~+7–10 điểm (bracket trước run 1: 31,74%), nhưng
  xuất phát thấp hơn nên W chỉ 32,36%. Đây là bằng chứng đo được:
  **mức tải tuyệt đối của "2 hog" KHÔNG cố định giữa các boot** —
  dial ấm đo đúng mức tải thật lúc đó, nhưng đích 45–55% không
  phải lúc nào cũng chạm được với 2 hog (xem §7: đề xuất cho DEF
  v0.3.1 — ghi rõ số hog chỉ là phương tiện, mức tải đo được mới
  là chuẩn).
- Hold 30 s trước run 1 (hold_s run1 = 30 s — MỚI, thay 90 s đợt 126).
- **Kiểm phương pháp (đăng ký trước, prereg §3):** W = 32,36% vs
  mean của 6 run means dial = 35,99% → **sai số dial ấm = 3,63
  điểm** (tiêu chí ≤5 — ĐẠT). So với sai số dial lạnh đợt 125
  ~27 điểm: dial ấm vẫn tốt hơn ~7 lần. **NHƯNG biến thể chỉ tính
  run ổn định (run 2, 7: mean 40,28%) cho sai số 7,92 điểm —
  KHÔNG ĐẠT tiêu chí ≤5.** Giải thích (trung thực, không giấu):
  W đo lúc cửa sổ avg60 còn "lạnh" (trước warm-up chỉ có hog +
  ambient thấp), trong khi run ổn định thừa hưởng tải browser của
  run trước trong cửa sổ 60 s nên mean cao hơn ~8 điểm. Trên boot
  #71 (đợt 126) ambient cao hơn nên hiệu ứng này nhỏ (sai số ổn
  định chỉ 1,54 điểm). Kết luận: **phương pháp dial ấm dự báo đúng
  mean CẢ LEG (gồm run leo dốc) trong ±5 điểm, nhưng KHÔNG dự báo
  chính xác run ổn định riêng lẻ khi ambient thấp** — ghi vào DEF
  v0.3.1 như caveat (xem §7).
- **Hold 30 s CÓ TÁC DỤNG (bài học đợt 126 đã được chứng minh):**
  run 1 mean **41,40%** — CAO HƠN cả mean run ổn định (40,28%),
  không còn là run leo dốc (đợt 126 hold 90 s → run 1 chỉ 39,47%,
  thấp hơn hẳn run sau 45,48–48,00%). Bracket trước run 1: 31,74%
  (so với 30,42% đợt 126 — gần bằng, nhưng mean trong run cao hơn
  vì avg60 không kịp tụt sâu trong 30 s hold). Từ nay hold sau
  warm-up giữ **30 s** làm protocol chuẩn cho leg dial ấm.

## 6. Kết quả 12 run (boot #73, cây baseline)

### 6.1 Nhóm dial — band GAP (đích 45–55%, 2 hog), vị trí 1, 2, 4, 6, 7, 9

| run | tiền lệ | T_startup (s) | chậm/nhanh | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean (%) | tickRate | threadsR mean | frames | dropped | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | START | 1,322 | CHẬM | 0,000 | 31,74 / 42,44 | 41,40 | 32,70 | 6,8 | 311 | 1 | 1231 |
| 2 | D-sau-D | 1,082 | nhanh | 0,000 | 34,42 / 42,24 | 41,48 | 33,01 | 7,3 | 329 | 0 | 1121 |
| 4 | D-sau-Y | 1,195 | nhanh* | 0,000 | 18,36 / 35,17 | 31,67 | 32,21 | 6,9 | 297 | 0 | 1195 |
| 6 | D-sau-Y | 1,702 | CHẬM | 0,000 | 16,85 / 34,75 | 31,52 | 32,16 | 6,8 | 327 | 0 | 1534 |
| 7 | D-sau-D | 1,003 | nhanh | 0,000 | 30,10 / 40,14 | 39,07 | 32,89 | 6,7 | 327 | 0 | 1017 |
| 9 | D-sau-Y | 1,395 | CHẬM | 0,001 | 18,12 / 34,72 | 30,83 | 31,68 | 6,8 | 300 | 0 | 1272 |

\* run 4: T_startup chính xác 1,195 s — nhanh nhưng chỉ dưới ngưỡng
1,2 s có **5 ms** (xem §7: kết luận xen kẽ bền với biên này).

- **VALID 6/6** (check-valid `S9_BAND=GAP`, shim=OK mọi run;
  `def-void: [false, []]` mọi run; finalCt=32, finalSrc=blob,
  errEvents=0 mọi run). Không run nào VOID theo §5 DEF v0.3
  (bracket trong [3, 76); mean trong [13, 66]; hogs_alive_min=2
  mọi run; PSI full avg10 max = 0 mọi run; đủ mẫu PSI, n=36–37
  mẫu/run; không reboot/cây đổi).
- **T_startup:** 1,003–1,702 s; **median 1,259 s; p90
  (nearest-rank) 1,702 s; chậm (>1,2 s) 3/6** (run 1, 6, 9);
  nhanh 3/6 (run 2: 1,082 s; run 4: 1,195 s; run 7: 1,003 s).
- **Pha (a) bar — CHỈ THAM KHẢO (không xét verdict): CHƯA ĐẠT**
  (median 1,259 > 1,0; p90 1,702 > 1,2).
- **Pha (b): ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **avg60 mean từng run: 30,83–41,48%** (mean của 6 mean =
  35,99%) — THẤP HƠN cửa sổ mục tiêu [45, 55] (TARGET-MISS-LOW,
  §5). Hai cụm rõ rệt, đúng như prereg §3 dự đoán (nhưng thấp hơn
  dự đoán thô ~39–44%): run ổn định + run 1 (vị trí 1, 2, 7):
  **39,07–41,48% (mean 40,65%)**; run leo dốc (vị trí 4, 6, 9):
  **30,83–31,67% (mean 31,34%)** — chênh ~9,3 điểm. Cơ chế: run
  leo dốc bắt đầu khi avg60 vừa leo lại sau 60 s spawn hog (bracket
  trước chỉ 16,85–18,36%), còn run ổn định thừa hưởng tải browser
  của run trước trong cửa sổ 60 s (bracket trước 30,10–34,42%).
- **tickRate: 31,68–33,01** (mean 32,44) — xem §8.
- **threadsR mean: 6,7–7,3** (mean 6,9 — giữa Yên ~2,0 và Vừa
  ~9,3; khớp vai trò trục phụ; gần mức GAP đợt 125/126: 7,1–8,9 /
  6,6–8,2).
- **seekImmMs: 1017–1534 ms** — run chậm có seekImmMs cao hơn rõ
  (run 1/6/9: 1231/1534/1272 ms, mean 1346) so với run nhanh
  (run 2/4/7: 1121/1195/1017 ms, mean 1111) — seekImmMs đi cùng
  chiều với T_startup trong leg (cùng pha startup/metadata, không
  phải chỉ báo độc lập). Nhất quán với đợt 126 (chậm 1299 vs nhanh
  955 ms).
- **totalFrames 297–329; dropped 0–1** (Yên 384/0; GAP-126
  289–310/0–2; GAP-125 290–324/0–1 — frames/dropped ở ~31–41%
  trung gian, nhất quán).
- **load1 (ĐỐI CHIẾU ONLY):** bracket 0,35–4,80, không mẫu hình
  (run 1: 4,22→4,80 trong khi run 9: 0,35→1,00 ở cùng PSI ~31–41%)
  — tiếp tục vô hiệu, không dùng trong bất kỳ tiêu chí/kết luận nào.

### 6.2 Nhóm Yên — band YEN (0 hog), vị trí 3, 5, 8, 10, 11, 12

| run | tiền lệ | T_startup (s) | chậm/nhanh | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean (%) | tickRate | threadsR mean | frames | dropped | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | Y-sau-D | 0,652 | nhanh | 0,000 | 15,29 / 11,62 | 14,13 | 70,54 | 2,2 | 384 | 0 | 595 |
| 5 | Y-sau-D | 0,775 | nhanh | 0,000 | 12,77 / 9,40 | 11,61 | 71,69 | 2,4 | 384 | 0 | 743 |
| 8 | Y-sau-D | 0,691 | nhanh | 0,000 | 14,42 / 10,72 | 13,10 | 71,40 | 2,1 | 384 | 0 | 634 |
| 10 | Y-sau-D | 0,537 | nhanh | 0,000 | 12,43 / 9,45 | 11,39 | 71,54 | 1,7 | 384 | 0 | 544 |
| 11 | Y-sau-Y | 0,759 | nhanh | 0,000 | 5,30 / 5,36 | 6,29 | 71,44 | 2,7 | 384 | 0 | 538 |
| 12 | Y-sau-Y | 0,477 | nhanh | 0,001 | 3,03 / 3,69 | 4,09 | 72,80 | 1,6 | 384 | 0 | 434 |

- **VALID 6/6** (check-valid `S9_BAND=YEN`, shim=OK mọi run;
  `def-void: [false, []]` mọi run). Không run nào VOID (bracket
  <40; mean <30; PSI full avg10 max = 0; đủ mẫu PSI).
- **T_startup:** 0,477–0,775 s; **median 0,672 s; p90
  (nearest-rank) 0,775 s; chậm (>1,2 s) 0/6** — toàn nhanh.
- **Pha (a) bar — CHỈ THAM KHẢO: ĐẠT** (median 0,672 ≤ 1,0; p90
  0,775 ≤ 1,2). **Pha (b): ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **avg60 mean: 4,09–14,13%** (mean 10,27%) — run Yên ngay sau run
  dial (Y-sau-D) mean cao hơn (11,39–14,13%) vì cửa sổ avg60 còn
  dư tải hog/browser của run dial trước; run Yên sau Yên (11, 12)
  mean thấp (6,29% / 4,09%) — đúng cơ chế cửa sổ 60 s, không phải
  dị thường. Tất cả đều <30% rõ rệt.
- **tickRate: 70,54–72,80** (mean 71,57) — khớp nhàn ~71,5 (xem §8).
- **threadsR mean: 1,6–2,7** (mean 2,1 — khớp Yên đợt 123 ~2,0).
- **seekImmMs: 434–743 ms; frames 384/0 mọi run** — khớp Yên đợt
  123 (frames 384/0; seekImmMs 271–522 ms đợt 123, đợt này cao hơn
  một chút do dư tải dial trước — run 3/5/8 sau dial: 595–743 ms
  vs run 11/12 sau Yên: 434–538 ms).
- **Hog:** hogs_alive=0 suốt mọi run Yên (bracket-verified);
  hog burn (utime) các thế hệ hog dial: xem §10. Kill sạch cuối
  driver bằng PID chính xác, còn sót 0 (không pkill -f, không trap
  EXIT).

### 6.3 Dãy đầy đủ 12 run (chậm/nhanh theo vị trí)

| vị trí | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| nhóm | D | D | Y | D | Y | D | D | Y | D | Y | Y | Y |
| kết quả | **S** | F | F | F | F | **S** | F | F | **S** | F | F | F |

Chậm ở vị trí 1, 6, 9 — không có mẫu hình xen kẽ nào trong dãy đầy
đủ (như kỳ vọng: Yên toàn nhanh nên dãy đầy đủ bị chi phối bởi vị
trí dial — chỉ mô tả, không suy luận thêm, theo prereg §6(ii)).

## 7. Diễn giải — trả lời prereg §6 (bảng ĐÃ ĐĂNG KÝ TRƯỚC)

- (i) avg60 đo được thực tế: nhóm dial bracket 16,85–42,44%, mean
  từng run 30,83–41,48% (mean 35,99%; run ổn định 39,07–41,48%,
  mean 40,65%; run leo dốc 30,83–31,67%, mean 31,34%) — **KHÔNG
  chạm cửa sổ mục tiêu 45–55%** (TARGET-MISS-LOW, W=32,36%, §5).
  Sai số dial ấm 3,63 điểm (≤5 — ĐẠT); biến thể ổn định 7,92 điểm
  (KHÔNG ĐẠT — xem §5). Nhóm Yên bracket 3,03–15,29%, mean
  4,09–14,13% (mean 10,27%) — giữ <30% rõ rệt. Run dial leo dốc
  (sau Yên) mean thấp hơn run ổn định **~9,3 điểm** (31,34% vs
  40,65%) — hiệu ứng leo dốc LỚN HƠN dự đoán prereg (~39–44%)
  vì W trên boot mới thấp hơn.
- (ii) **XEN KẼ CÓ LẶP LẠI KHÔNG — KHÔNG.** Dãy con dial theo thứ
  tự thực hiện (run 1, 2, 4, 6, 7, 9): **S-F-F-S-F-S** (1,322 /
  1,082 / 1,195 / 1,702 / 1,003 / 1,395 s). Hai run nhanh liên tiếp
  (run 2 → run 4) phá vỡ xen kẽ hoàn hảo. Theo bảng đăng ký trước
  (prereg §6(ii)): **XEN KẼ KHÔNG LẶP LẠI** — mẫu hình đợt 126 phù
  hợp với ngẫu nhiên; **không có bằng chứng yếu tố xen kẽ hệ
  thống.** Tỉ lệ chậm nhóm dial 3/6 được đọc như ước lượng thô của
  P(chậm) tại mức tải đo được (kèm caveat mẫu nhỏ n=6 + hai cụm
  tải khác nhau trong nhóm).
  - **Bền với biên ngưỡng (ghi rõ, không giấu):** run 4 nhanh chỉ
    dưới ngưỡng 5 ms (1,195 s so với 1,2 s). Nếu tính run 4 là
    chậm (ngưỡng 1,19 s) thì dãy thành S-F-S-S-F-S — vẫn KHÔNG xen
    kẽ hoàn hảo (hai chậm liên tiếp run 4 → run 6). Kết luận "không
    lặp lại" đứng trong cả hai cách đọc. Ngược lại, nếu đợt 126
    tính lại với ngưỡng 1,19 s thì run 6 đợt 126 (1,170 s) thành
    chậm → dãy 126 thành S-F-S-F-S-S — cũng không còn xen kẽ hoàn
    hảo. (Chỉ là kiểm tra độ nhạy, KHÔNG sửa lại kết luận đợt 126
    — ngưỡng 1,2 s của DEF giữ nguyên, không đổi giữa các đợt.)
  - Kiểm tra phụ: dãy con Yên **0/6 chậm** (kỳ vọng 0/6 — khớp Yên
    đợt 123). Không có dị thường Yên nào. Dãy đầy đủ 12 run (xem
    §6.3) không có mẫu hình xen kẽ.
  - Hệ quả cho tỉ lệ 3/6 đợt 126: không còn lý do nghi ngờ P(chậm)
    = 0,5 tại ~46% là giả tạo do xen kẽ — tỉ lệ này đứng như ước
    lượng thô (caveat mẫu nhỏ).
- (iii) **Tỉ lệ chậm từng nhóm + dải chuyển ~46–53% — MỞ RỘNG
  THÀNH ~31–53%.** Nhóm dial TRỘN (3 chậm/3 nhanh) ở run means
  30,83–41,48% — THẤP HƠN dải ~46–53% đợt 126. Theo bảng đăng ký
  trước: ranh giới NẰM NGAY QUANH M% → dải chuyển = hợp của các
  vùng trộn đã quan sát:
  - Trộn tại ~31% (run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH
    1,195 s @ 31,67% — tải gần như bằng nhau, kết quả ngược nhau).
  - Trộn tại ~41% (run 1 CHẬM 1,322 s @ 41,40% vs run 2 NHANH
    1,082 s @ 41,48% — tải gần như bằng nhau, kết quả ngược nhau).
  - Trộn tại ~46% (đợt 126: 3/6 @ 39,47–48,00%) và ~53% (đợt 125:
    4/6 @ 52,75–53,99%).
  - **Kết luận: vùng trộn quan sát được là ~31–53%** (mở rộng từ
    ~46–53%). Dải làm việc v0.3 ~45–60% được thu hẹp cả hai đầu:
    cận trên 60% → ~53% (điểm trộn cao nhất quan sát được; trên
    53% tới 65,75% chưa có dữ liệu); **cận dưới ~45% → ~31%**
    (trộn đã quan sát được ngay tại ~31%). Nhanh chắc chắn vẫn
    ≤14,13% (Yên đợt này; run Yên chậm nhất vẫn là 0/6); chậm chắc
    chắn vẫn ≥65,75%.
  - **Ngưỡng Yên <30% ĐỨNG, KHÔNG cần thu hẹp:** không có run chậm
    nào dưới 30% (run chậm thấp nhất ở 30,83% — run 9, ngay trên
    30% rõ rệt nhưng vẫn trên). Lưu ý biên mong manh: chỉ cách
    ngưỡng 0,83 điểm — nếu leg sau quan sát được run chậm ở
    ~28–30% thì ngưỡng Yên phải xét lại (ghi nợ mở).
  - Trong-leg dial r(avg60, T_startup) = **−0,587** (âm — tải cao
    hơn đi cùng T_startup thấp hơn trong nhóm dial; n=6, do hai cụm
    leo dốc/ổn định, KHÔNG phải hiệu ứng thật) — trong dải chuyển,
    tải KHÔNG dự báo được nhanh/chậm từng run (nhất quán đợt 126:
    −0,151). Chỉ có tỉ lệ chậm tăng theo tải giữa các cụm (0/6 @
    ~10% → 3/6 @ ~36% → 3/6 @ ~46% → 4/6 @ ~53% → 6/6 @ ~70%+).
- (iv) tickRate: xem §8. (v) Pha (b): xem §9.
- **Đề xuất cho DEF v0.3.1 (chưa viết — do parent/luồng được giao
  viết, T4 đợt 127):** (a) ghi dải chuyển là **vùng trộn quan sát
  được ~31–53%** (thay ~46–53% của kết luận đợt 126); (b) tickRate
  mức trung gian giữ ~28–33 (xem §8); (c) giữ nguyên ngưỡng 3 band
  Yên/Vừa/Nặng + ngưỡng Yên <30% (kèm lưu ý biên 0,83 điểm); (d)
  ghi bài học hold 30 s sau warm-up (§5: run 1 không còn leo dốc)
  + caveat dial ấm (§5: W dự báo mean cả leg tốt nhưng đánh giá
  thấp run ổn định khi ambient thấp; số hog không cố định mức tải
  giữa các boot — mức tải đo được mới là chuẩn); (e) ghi kết luận
  xen kẽ (§7(ii): mẫu hình đợt 126 là ngẫu nhiên, không cần điều
  tra yếu tố xen kẽ nữa); (f) ghi rõ cờ T9-done đợt 127 không đồng
  nghĩa lượt yên hợp lệ (xem §0/§4).

## 8. tickRate — mức trung gian tái hiện lần thứ ba (sửa DEF v0.2 §3, bổ sung v0.3 §3)

- DEF v0.2 §3 quy định tickRate là chỉ báo đói **2 mức**; v0.3 §3
  đã sửa thành ≥3 mức nhờ leg GAP đợt 125 (28,07–29,47 @ ~53%)
  và leg 45–55% đợt 126 (31,32–33,36 @ ~46%).
- Leg này ở avg60 ~36% (nhóm dial): tickRate **31,68–33,01 (mean
  32,44)** — tách RÕ khỏi nhàn ~71,5 (cách ~39 điểm) và đói ~15–20
  (cách ~13 điểm khỏi Vừa), và nằm ngay trên mức ~53% (28,52) lẫn
  mức ~46% (32,01). Nhóm Yên: tickRate **70,54–72,80 (mean
  71,57)** — khớp nhàn ~71,5 đợt 123 (71,50). Đường cong tickRate
  theo tải (n=36, 6 điểm):

| Cụm | avg60 mean (%) | tickRate mean | T_startup median (s) | chậm |
|---|---|---|---|---|
| Yên-127 (n=6) | 10,27 | 71,57 | 0,672 | 0/6 |
| GAP-127 ~36% (n=6) | 35,99 | 32,44 | 1,259 | 3/6 |
| GAP-126 ~46% (n=6) | 45,98 | 32,01 | 1,227 | 3/6 |
| GAP-125 ~53% (n=6) | 53,19 | 28,52 | 1,264 | 4/6 |
| Vừa (n=6) | 69,71 | 18,54 | 1,843 | 6/6 |
| Nặng (n=6) | 90,69 | 16,77 | 2,219 | 6/6 |

  (Cụm Yên-127 thay Yên đợt 123 trong bảng này vì cùng phương pháp
  đo trên boot #73 với nhóm dial — so sánh trong-boot; Yên đợt 123
  mean 71,50 @ ~7% gần như trùng khớp, ghi để đối chiếu.)
- tickRate đơn điệu giảm theo avg60 tăng (71,6 → 32,4 → 32,0 →
  28,5 → 18,5 → 16,8), dốc nhất ở đoạn Yên→36% (71,6→32,4) rồi
  bẹt dần. **Mức "trung gian" nay là một khoảng ~28–33** (31–53%
  tải), không phải một số đơn — tái hiện lần thứ ba (28,5 @ 53%;
  32,0 @ 46%; 32,4 @ 36%). Vừa↔Nặng VẪN không tách (chênh mean
  1,77 tick/s, khoảng chồng nhau) — gộp chung một mức "đói" như
  v0.3.
- Trong nhóm dial, tickRate gần như phẳng theo tải
  (r(avg60, tickRate) = **+0,914** — DƯƠNG, ngược dấu gộp; do hai
  cụm leo dốc/ổn định: run ổn định cao cả avg60 lẫn tickRate hơn
  run leo dốc ~1 điểm) — đây là **hiệu ứng cụm (cluster artifact),
  không phải quan hệ thật**; nhất quán với kết luận "trong-band bão
  hòa" của v0.2/v0.3: tickRate chỉ tách GIỮA các cụm, không dự báo
  trong cụm. Tương tự, r(avg60, T_startup) = −0,587 trong nhóm dial
  cũng là hiệu ứng cụm (run leo dốc thấp tải nhưng có cả chậm nhất
  1,702 s lẫn nhanh 1,195 s).
- Tương quan gộp **n=36** (30 đợt 123–126 + 6 dial đợt này; tính
  từ JSON thô bằng hàm analyze_phases/analyze_psi của analyzer
  127t3, cùng phương pháp như 126 — tái hiện đúng số DEF v0.3 ở
  n=24 và số LIMITS 126 ở n=30 trước khi thêm 6 run này):
  r(avg60, tickRate) = **−0,906** (n=30: −0,944; n=24: −0,959);
  r(avg60, T_startup) = **+0,836** (n=30: +0,860; n=24: +0,864);
  r(tickRate, T_startup) = **−0,799** (n=30: −0,809; n=24: −0,831);
  r(avg60, threadsR) = **+0,967** (n=30: +0,975; n=24: +0,979).
  Tương quan gộp giảm nhẹ khi thêm cụm ~36% (vì cụm này trộn
  3/6 ở tải thấp hơn) — nhất quán với dải chuyển mở rộng xuống
  ~31%.
  **Caveat khác boot (bắt buộc):** Yên đợt 123 trên boot #67?,
  Vừa/Nặng trên boot #68?, GAP-125 trên boot #70, GAP-126 trên
  boot #71, Yên-127 + GAP-127 trên boot **#73** — không gộp thành
  một kết luận nhân quả duy nhất; sibling đang chạy song song trong
  mọi leg.

## 9. Pha (b) T_seek MIỄN NHIỄM với tải — giữ ở n=42

- T_seek: nhóm dial 0,000 s (5 run) + 0,001 s (run 9); nhóm Yên
  0,000 s (5 run) + 0,001 s (run 12) — max 0,001 s, median 0,0 s.
  Gộp 42 run (30 đợt 123–126 + 12 đợt này): T_seek max **0,001 s**.
  Caveat phân giải evs 10 ms: 0,000 s nghĩa là "<10 ms", không
  tuyên bố 0 ms. Toàn bộ chậm vẫn nằm ở pha startup/metadata; seek
  tức thì một khi metadata đã load.
- Pha (a) tham khảo theo nhóm: nhóm dial CHƯA ĐẠT (median 1,259;
  p90 1,702); nhóm Yên ĐẠT (median 0,672; p90 0,775) — nhóm Yên
  đợt 123 cũng ĐẠT (median 0,337).

## 10. Nhiễu chéo + vệ sinh sau leg

- Hog nice-19 nâng avg60 toàn máy trong lúc các run dial + warm-up
  chạy 03:47:19–04:08:13Z (~21 phút, gồm dial + 6 run dial + các
  lần spawn lại) — các luồng sibling đang chạy song song sẽ thấy
  ambient PSI cao trong khung giờ đó (nhiễu CÓ CHỦ Ý theo nhiệm
  vụ). Xếp lịch lệch đã tuân thủ: hog chỉ bắt đầu SAU cờ T9
  (03:46:18Z; hog đầu tiên 03:47:19Z). Nhóm Yên (0 hog) không tạo
  thêm tải — các run Yên 03:53–04:08Z xen kẽ làm "cửa yên" ngắn
  cho sibling (avg60 tụt về ~3–15% trong các run Yên).
- Hog đã kill sạch cuối driver (còn sót 0, verify bằng
  `hogs_alive` sau leg). Xvfb :197 vẫn chạy (pid 15103) — tiến
  trình nền của leg, không phải hog.
- **Hog burn (utime) — ghi trung thực, có caveat:** driver ghi
  `hog utime truoc leg=17996 sau leg=0 (delta=-17996 ticks)` — con
  số delta ÂM này là **artifact, không phải số đo**: `hog_utime()`
  đọc từ file hogs.pids, mà file này bị làm rỗng ở lần kill hog
  cuối cùng trước run Yên 10–12 (không còn PID nào để đọc) nên
  utime_after = 0. Tổng burn thật KHÔNG tái tạo được chính xác từ
  log (thiếu utime cuối mỗi thế hệ hog). Số liệu snapshot đã ghi:
  thế hệ 1 (dial+run 1–2): utime 22267 lúc run 1 → 31726 lúc run 2;
  thế hệ 2 (run 4): 8893 lúc run 4; thế hệ 3 (run 6–7): 8832 lúc
  run 6 → 18365 lúc run 7; thế hệ 4 (run 9): 8891 lúc run 9.
  Ước lượng thô từ snapshot (mỗi thế hệ ~17–41k ticks): tổng burn
  **~100k ticks ≈ 1000 CPU-giây ≈ 17 CPU-phút** (ước lượng, không
  phải số đo chính xác — ghi rõ để leg sau không trích dẫn như số
  thật). Hog alive=2 đã verify bằng bracket trước/sau MỌI run dial
  (hogs_alive_min=2) — tính hợp lệ của leg không phụ thuộc vào
  tổng burn.
- RAM avail min trong run: 450–1119 MB (min 450 MB — thấp; hog node
  nhẹ, không phải nguyên nhân ghim RAM; T9 đã kết luận RAM ghim
  không điều tra được từ trong VM — quyết parent: DỪNG).
- Không đụng script/cờ của T9 hay luồng khác. Không sửa file chung
  với sibling (chỉ ghi trong `hidden_files/round127-t3/` và
  `benchmarks/` riêng của T3).

## 11. Những gì KHÔNG làm + nợ mở

- KHÔNG xét lại verdict đợt 120 (vẫn KHÔNG ĐẠT, quyết parent cửa
  (a) đứng). KHÔNG gộp số leg này với bộ verdict hay bộ Yên đợt
  123 / bộ tải đợt 124 / bộ GAP đợt 125 / bộ leg 45–55% đợt 126
  (khác boot — chỉ so sánh tham khảo, kèm caveat §8). KHÔNG tự đổi
  DEF trong leg này — cập nhật dải ~31–53% + tickRate + bài học
  hold 30 s + caveat dial ấm + kết luận xen kẽ vào v0.3.1 do
  parent/luồng được giao viết (T4 đợt 127; đề xuất ở §7).
- **Nợ mở đợt sau:** (a) DEF v0.3.1 (dải chuyển ~31–53% + tickRate
  trung gian ~28–33 + hold 30 s + caveat dial ấm ambient-thấp +
  kết luận xen kẽ + lưu ý biên ngưỡng Yên 0,83 điểm); (b) **KHÔNG
  cần điều tra thêm yếu tố xen kẽ** (đã có đáp án: không lặp lại);
  (c) lượt yên WebKit #7 CHƯA ĐÓNG (T9 0 probe đợt 127 — chuyển
  tiếp); (d) T5 chẩn đoán event lag + (c2) dựa trên dữ liệu các
  đợt trước (không có dữ liệu mới đợt này); (e) TTS 39 cấm kiểm
  lại; birefnet chỉ thử lại khi quan sát được available ≥ 6 GB
  (u2net là fallback chính thức); ci-security.yml vẫn 403 chờ user;
  G1 chờ user quyết (đã hỏi 13:44 16/11, chưa trả lời); (f) nếu leg
  sau quan sát được run chậm ở ~28–30% thì xét lại ngưỡng Yên <30%.
- **Kết quả T9 đợt 127 (ghi để đối chiếu, không phải việc T3):**
  KHÔNG CÓ lượt yên hợp lệ (3/3 attempt gate A không mở, 0 probe;
  ngưỡng ≤60 ms GIỮ); cờ touch 03:46:18Z khi attempt3 xong để mở
  leg tải T3. Chi tiết: `docs/PHASE9_ROUND127_T9_WEBKIT60MS_LIMITS.md`.

## 12. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round127-t3-interleave.txt`):
  - `docs/PHASE9_ROUND127_T3_INTERLEAVE_LIMITS.md` (mới, file này)
  - `benchmarks/render/f2_startup_probe_127t3.mjs` (mới)
  - `benchmarks/render/f2_startup_analyze_127t3.py` (mới)
- Kết quả đo (giữ trên đĩa, KHÔNG đưa vào paths push theo tiền lệ
  đợt 124/125/126 — file 299.918 B vượt trần push-files):
  `benchmarks/results/webkit-blob-flaky-127t3-f2startup-interleave.json`
  (299.918 B, 12 case, 04:08Z; env previewMd5
  03bf029f09b8890b285eacc10a02172b, shimMd5
  b208e8de1780f432062f03ca5eea4a66).
- Hồ sơ làm việc (ngoài repo, KHÔNG push qua paths-loop theo
  tiền lệ mọi đợt — lưu trong goal workspace):
  `hidden_files/round127-t3/` — prereg-interleave.md,
  run-127t3-all.sh, run-127t3-gatewait.sh, t3-watch-gate.sh,
  bracket-127t3.py, check-valid-127t3.py,
  vcut-vite-lock-v2.frozen.sh, gate0-wait-t3.log,
  gatewait-nohup.log, gatewait-nohup2.log, watch-nohup.log,
  watch-nohup2.log, t3-watch.log, t3-driver.out,
  t3-analysis-gap.txt, t3-analysis-yen.txt, brackets-127t3.json,
  dial-GAP.txt/hogs, warmup-mean.txt, warmup-out.json (1 case
  warm-up), t3-warmup-1.log, t3-run-{1..12}.log, t3-driver-watch.log,
  http-access.log, postboot-t3-driver.log,
  postboot-t4-gatewait-{1..14}.log
  (tên file giữ "t4" do sót sed ở gatewaiter — chỉ là tên log,
  không ảnh hưởng nội dung), hogs.pids, xvfb-197.log.
- Cờ xong: `hidden_files/round127-t3.done` (touch khi LIMITS +
  stage xong).
