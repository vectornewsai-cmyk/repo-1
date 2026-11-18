# LIMITS — T4 đợt 126: DEF PSI v0.3 + leg dò thêm quanh ~45–55% (dial bằng browser ẤM)

**Ngày:** 17/11/2026 (đo 17/11/2026, 00:11–00:18Z). **Luồng:** T4, đợt 126
vòng lặp Phase 9 (lượt cron 06:35 +07 17/11/2026). **Trạng thái:**
**DEF v0.3 XONG + leg 45–55% XONG 6/6 VALID.**
**Prereg:** `hidden_files/round126-t4/prereg-def03-leg4555.md`
(đăng ký trước mọi phép đo, kể cả warm-up attempt).
**DEF:** `docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md` (v0.3, CHUẨN hiện hành).
**Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — leg này không xét lại verdict,
không gộp số với bộ verdict (cây H3f, boot đã chết).

## 0. Tóm tắt (đọc trước)

- **DEF v0.3 ĐÃ VIẾT XONG** (23.465 B, 00:0xZ): ranh giới chuyển thành
  DẢI ~45–60% (cận dưới ~45% ghi rõ là giả thuyết chờ leg này kiểm
  chứng); tickRate sửa thành chỉ báo đói ≥3 mức (nhàn ~71,5 / trung
  gian ~28,5 / đói ~15–20); dial bằng browser ấm (§4.7, bài học +27
  điểm đợt 125). File v0.2 giữ nguyên làm lịch sử, không sửa.
- **Reboot giữa đợt 125 đóng và lượt này:** boot #70 đợt 125
  (310f07e4, btime 20:54:19Z) **ĐÃ CHẾT**, reboot lúc **23:25:41Z**
  (boot #71 tạm, chờ T6 recount): boot_id
  `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`. Leg chạy toàn bộ trên boot
  #71, cây baseline không đổi.
- **Leg 45–55%: 6/6 VALID, 0 VOID, 0 attempt thừa.** 2 hog, dial ấm
  **TARGET-HIT ngay warm-up #1 (W = 45,74%)** — chỉ cần 1 warm-up.
  Run means **39,47–48,00%** (mean 45,98%). T_startup median
  **1,227 s**, p90 **1,403 s**, **chậm (>1,2 s) 3/6, nhanh 3/6 → TRỘN**
  → dải chuyển thu hẹp thành **vùng trộn quan sát được ~46–53%**
  (xem §7). Pha (a) bar (tham khảo): CHƯA ĐẠT (median 1,227 > 1,0;
  p90 1,403 > 1,2). Pha (b): **ĐẠT** (T_seek max 0,001 s, median
  0,0 s).
- **Dial ấm THÀNH CÔNG VƯỢT TIÊU CHÍ:** sai số dial ấm |W − mean run
  means| = **0,24 điểm** (tiêu chí prereg ≤5; dial lạnh đợt 125 sai
  ~27 điểm). Phương pháp dial ấm ĐÃ ĐƯỢC CHỨNG MINH — ghi vào DEF
  v0.3 §4.7 làm protocol chuẩn cho leg dò ranh giới.
- **tickRate mức trung gian TÁI HIỆN + MỞ RỘNG:** ở ~46% tickRate
  **31,32–33,36 (mean 32,01)** — nằm giữa nhàn ~71,5 và mức ~53%
  28,52, đơn điệu giảm theo tải. Đường cong 5 điểm (n=30): 71,5 @
  ~7% → 32,0 @ ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%.
- **Caveat bắt buộc — xen kẽ hoàn hảo:** chậm/nhanh xen kẽ đúng
  từng run (chậm-nhanh-chậm-nhanh-chậm-nhanh; xác suất xen kẽ hoàn
  hảo do ngẫu nhiên ≈ 3%) — không loại trừ được yếu tố nhiễu xen kẽ
  (xem §7). Tỉ lệ 3/6 KHÔNG được đọc là P(chậm)=0,5 chính xác.
- **Tương quan gộp n=30** (caveat khác boot #67?/#68?/#70/#71?):
  r(avg60,T_startup)=+0,860; r(avg60,tickRate)=−0,944;
  r(tickRate,T_startup)=−0,809; r(avg60,threadsR)=+0,975; trong leg
  phẳng (r(avg60,T_startup)=−0,151).

## 1. Bối cảnh + boot + cây (verify trước/sau leg)

- Cây BASELINE, không đổi trong leg: preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b`, media.ts md5
  `2c384ed13703809d5e999311147745e7` — verify lúc viết prereg
  (23:41Z), lúc mở driver (00:09:40Z) và sau leg (00:18:50Z), khớp nhau.
- Boot #71? (ff7afbbb, btime 23:25:41Z) không đổi trong suốt leg
  (uptime -s kiểm trước mỗi run + cuối driver; gatewaiter reset logic
  không kích hoạt lần nào).
- Cờ POSTBOOT_PASS của **T5 đợt 126** (khớp #71, KHÔNG dùng cờ
  đợt 125 — luật STALE): `boot_id=ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69
  btime=2026-11-16T23:25:41Z pass_at=2026-11-16T23:43:58Z poll=try1`
  (định dạng dấu `=` như đợt 125 b70; gatewaiter dùng mẫu
  `boot_id[:=] *` nên khớp ngay poll #1).
- H3f GIỮ GỠ. Không sửa production (chỉ docs + script benchmark).
  Không push. Không release/tag.
- Không đụng TTS 39. Không đụng birefnet (RAM avail 0,8–1,5 GB
  < guard 6 GB theo quyết parent). Không binary vào batch.

## 2. DEF v0.3 — xác nhận đã xong (không viết lại)

File `docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md`, 23.465 B, viết
00:0xZ, đọc lại xác nhận đầy đủ trước khi viết LIMITS này:
§1 vì sao PSI; §2 trục chính/phụ/chỉ báo (tickRate ≥3 mức);
§3 3 band (Yên <30%, Vừa 30–80%, Nặng >80%) + dải chuyển ~45–60%
(cận dưới ~45% ghi rõ là giả thuyết chờ leg này) + tickRate theo
band; §4 protocol đo (hold ≥90 s, dial vòng kín, mẫu 5 s, bracket,
leg dò ranh giới, **§4.7 dial bằng browser ấm — MỚI**); §5 luật
VOID (+ luật riêng band GAP); §6 trả lời câu hỏi ranh giới bằng
leg GAP đợt 125; §7 tương quan gộp n=24 (không kết luận nhân quả);
§8 load1 vô hiệu; §9 caveat; §10 verdict đợt 120 vẫn đứng; §11 lịch
sử phiên bản (v0.3.1/v0.4 dự kiến sau leg này).
File v0.2 (`docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`, 18.176 B,
md5 `035b912a18db19b9c5b40a2d3e9f429e`) và v0.1 giữ nguyên làm lịch
sử — không sửa, không xóa (verify md5/size sau khi viết v0.3).

## 3. Validate công cụ TRƯỚC khi đo (prereg §0.2 — ĐẠT, 23:5xZ)

- Analyzer 126t4 `S9_BAND=GAP` trên dữ liệu đợt 124: **0 case**
  (12/12 SKIP — lọc GAP không ăn nhầm case cũ). Lưu ý: lần đầu chạy
  thiếu env `S9_BRACKETS` nên mọi case mặc định YEN (brackets 126
  chưa có) — đã chạy lại với `S9_BRACKETS` trỏ brackets-124t4, kết
  quả đúng.
- Analyzer 126t4 `S9_BAND=MEDIUM` trên cùng dữ liệu: tái hiện đúng
  **6/6 VALID**, median T_startup 1,8425 s (≈1,843 s LIMITS 124t4
  §2.1), p90 2,992 s, slow 6/6 — hồi quy path MEDIUM OK.
- check-valid-126t4.py `S9_BAND=GAP`: **VALID_COUNT=0, TOTAL=0**;
  `S9_BAND=MEDIUM`: **VALID_COUNT=6, TOTAL=6** (shim=UNKNOWN trong
  test vì pull log nằm ở round124-t4/pull — đúng kỳ vọng; copy tạm
  OUT 124 → OUT 126t4 + brackets 124 → brackets-126t4.json, đã XÓA
  cả hai sau test — verify không còn file 126t4 OUT lúc validate).
- `psi_avg60()` (mẫu sửa đợt 123 phụ lục A): đọc được 22,05%,
  khớp dòng `some` trong /proc/pressure/cpu lúc test.
- `bracket-126t4.py` entry TEST-bracket: ghi đúng avg60=22,05%,
  band=GAP, hogs_target=2; đã xóa brackets-126t4.json về `{}` sau
  test.
- `node --check` runner 126t4 OK; `bash -n` driver/gatewaiter/
  watcher OK; `python3 -m py_compile` analyzer/check-valid/bracket OK.
- Lock script copy md5 = `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp
  baseline đóng băng). Diff probe 126t4 vs 125t4: chỉ các dòng đổi
  PORT 8975→8985, S9_DIR, OUT legtrunggian→leg4555, round string,
  Xvfb :198→:199, nhãn đợt — không đổi flow đo.
- Không chạy tsc/vite build đợt này: không sửa production (chỉ docs
  + script benchmark; script đã validate bằng node --check +
  py_compile + hồi quy analyzer trên dữ liệu thật đợt 124). Không
  chạy vite build để tránh tranh lock với sibling đang đo (T1/T2 E4
  lượt 9/10 chạy song song trong đợt).

## 4. Gate + phối hợp T9 (timeline thật)

- Gatewaiter T4 (poll check-only riêng, mỗi 2 phút) chạy từ
  23:55:37Z trên #71; watcher `t4-watch-gate.sh` khởi động cùng lúc
  bằng setsid + nohup (pid 17830, xác nhận chạy — rút kinh nghiệm
  đợt 125 watcher khởi động lần đầu thất bại im lặng).
- **T9 chạy lượt yên WebKit #6 TRƯỚC:** attempt1 gate A không mở
  (10 poll); attempt2 mở poll 2 (00:02:14Z), probe 00:02:14–
  00:05:37Z. **Lượt yên HỢP LỆ: attempt2 20/20 pass, lớp B 5/5 ĐẠT,
  tickCost median 44,0 ms (p90 71,6; n=615), ngưỡng ≤60 ms GIỮ**
  (chi tiết: `docs/PHASE9_ROUND126_T9_WEBKIT60MS_LIMITS.md`). Cờ
  `hidden_files/round126-t9-done` (file rỗng, touch) xuất hiện
  **00:09:01Z**. **T4 KHÔNG chạy bất kỳ hog nào trước cờ này** — 0
  phút chồng chéo hog lên cửa yên của T9 (warm-up attempt đầu tiên
  chạy 00:11:13Z, sau cờ ~2 phút).
- **GATE 0 ĐẠT ở poll #8, 00:09:39Z** (trước hạn 01:00Z): 6/6 điều
  kiện — (0a) check-only riêng exit 0; (0b) apt/apt-get/dpkg = 0
  (đếm bằng `pgrep -x`, không grep-ps); (0c) md5 preview 03bf029f;
  (0d) POSTBOOT_PASS T5-126 khớp #71 (pass_at 23:43:58Z, poll=try1);
  (0e) boot không đổi; (0f) cờ round126-t9-done CÓ. RAM avail lúc
  gate ĐẠT 809 MB; dpkg_lines 1509 (replay xong từ 23:37:46Z, T5
  PASS — không kích hoạt repair, không áp dụng luật §8.2 (B)).
- Watcher thấy GATE DAT 00:09:40Z → chạy driver
  `run-126t4-all.sh`. Driver bắt đầu 00:09:40Z, kết thúc 00:18:51Z,
  **exit 0**. Xvfb :199 (pid 21330). Postboot check lúc mở driver
  exit=0. RAM avail lúc mở driver 816 MB. Registry GStreamer mtime
  không đổi (23:46:02 trước = sau leg; gstRegChanged=false mọi run).

## 5. Dial bằng browser ẤM (DEF v0.3 §4.7 — MỚI, thành công vượt tiêu chí)

- Bắt đầu **2 hog** (pids 21346, 21347, nice -n 19), chờ 90 s.
- Warm-up attempt #1, **00:11:13–00:11:58Z, exit 0** (runner thật,
  OUT throwaway `warmup-out.json`, Q6_START=0, qua lock
  `t4-round126-warm`): case `Lc8-f2s-run1` trong file warmup —
  **W = avg60 mean 45,74%** (tickRate 32,5; threadsR 6,8; frames 320;
  dropped 1; seekImm 1383 ms; T_startup 1,285 s — CHẬM, chỉ ghi tham
  khảo, KHÔNG tính vào bộ 6 run theo prereg).
- W = 45,74% nằm trong cửa sổ mục tiêu [45, 55] với 2 hog →
  **TARGET-HIT ngay warm-up #1** — không cần warm-up #2, không đổi
  số hog. Ghi `dial-GAP.txt` = "TARGET-HIT hogs=2 W=45.74".
- Hold 90 s trước run 1 (hold_s run1 = 90 s).
- **Kiểm phương pháp (đăng ký trước, prereg §3):** W = 45,74% vs
  mean của 6 run means = 45,98% → **sai số dial ấm = 0,24 điểm**
  (tiêu chí ≤5 — ĐẠT, vượt xa). So với sai số dial lạnh đợt 125
  ~27 điểm: dial ấm tốt hơn ~100 lần. **Phương pháp dial ấm ĐÃ ĐƯỢC
  CHỨNG MINH** — từ nay là protocol chuẩn cho leg dò ranh giới
  (DEF v0.3 §4.7).
- **Giải thích run 1 thấp (trung thực, không giấu):** sau warm-up,
  browser thoát; trong 90 s hold (chỉ hog chạy) avg60 tụt về phía
  mức hog-only — bracket trước run 1 chỉ 30,42%, run 1 mean 39,47%.
  Run 1 là run "leo dốc" (avg60 đang leo lại khi browser chạy).
  Các run 2–6 (đã ổn định): means 45,48–48,00% (mean 47,28%).
  Kiểm chéo: sai số dial ấm tính riêng trên runs 2–6 = |45,74 −
  47,28| = **1,54 điểm — vẫn ≤5**. Cả hai cách tính đều ĐẠT tiêu chí.
  Bài học phụ: hold sau warm-up nên ngắn hơn 90 s (hoặc bracket
  trước run 1 nên đọc sau khi browser đã chạy một lúc) để run 1
  không bị leo dốc — ghi nợ mở cho leg sau, không sửa protocol
  giữa leg này.

## 6. Kết quả 6 run (band GAP đích 45–55%, 2 hog, boot #71, cây baseline)

| run | T_startup (s) | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean (%) | tickRate | threadsR mean | frames | dropped | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1,295 | 0,000 | 30,42 / 40,98 | 39,47 | 31,69 | 7,4 | 289 | 2 | 1203 |
| 2 | 0,915 | 0,001 | 40,21 / 45,88 | 45,48 | 31,60 | 8,2 | 310 | 1 | 776 |
| 3 | 1,403 | 0,000 | 44,45 / 47,74 | 47,74 | 31,32 | 7,6 | 290 | 1 | 1291 |
| 4 | 0,980 | 0,000 | 46,25 / 46,96 | 48,00 | 33,36 | 7,0 | 309 | 0 | 998 |
| 5 | 1,284 | 0,000 | 45,28 / 46,89 | 47,56 | 32,23 | 6,6 | 296 | 0 | 1402 |
| 6 | 1,170 | 0,000 | 45,27 / 47,11 | 47,62 | 31,85 | 7,6 | 302 | 0 | 1090 |

- **VALID 6/6** (check-valid `S9_BAND=GAP`, shim=OK mọi run;
  `def-void: [false, []]` mọi run; finalCt=32, finalSrc=blob,
  errEvents=0 mọi run). Không run nào VOID theo §5 DEF v0.3
  (bracket trong [3, 76]; mean trong [13, 66]; hogs_alive_min=2
  mọi run; PSI full avg10 max = 0 mọi run; đủ mẫu PSI, n=36–37
  mẫu/run; không reboot/cây đổi).
- **T_startup:** 0,915–1,403 s; **median 1,227 s; p90
  (nearest-rank) 1,403 s; chậm (>1,2 s) 3/6** (run 1, 3, 5);
  nhanh 3/6 (run 2: 0,915 s; run 4: 0,980 s; run 6: 1,170 s —
  run 6 chỉ dưới ngưỡng 1,2 s có 30 ms).
- **Pha (a) bar — CHỈ THAM KHẢO (không xét verdict): CHƯA ĐẠT**
  (median 1,227 > 1,0; p90 1,403 > 1,2).
- **Pha (b): ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **avg60 mean từng run: 39,47–48,00%** (mean của 6 mean =
  45,98%) — run 1 thấp do leo dốc (§5); runs 2–6 cụm chặt
  45,48–48,00% (mean 47,28%), nằm TRONG cửa sổ mục tiêu [45, 55].
- **tickRate: 31,32–33,36** (mean 32,01) — xem §8.
- **threadsR mean: 6,6–8,2** (mean 7,4 — giữa Yên ~2,0 và Vừa
  ~9,3; khớp vai trò trục phụ; gần mức GAP đợt 125: 7,1–8,9).
- **seekImmMs: 776–1402 ms** (giữa Yên 271–522 ms và Vừa
  1621–2810 ms — trung gian, nhất quán với vị trí ~46%).
  **Mẫu hình trong leg:** run chậm có seekImmMs cao hơn rõ
  (run 1/3/5: 1203/1291/1402 ms, mean 1299) so với run nhanh
  (run 2/4/6: 776/998/1090 ms, mean 955) — seekImmMs đi cùng
  chiều với T_startup trong leg (cùng pha startup/metadata, không
  phải chỉ báo độc lập).
- **totalFrames 289–310; dropped 0–2** (Yên 384/0; GAP-125
  290–324/0–1; Vừa 161–279/2–7; Nặng 163–213/6–11 — frames/dropped
  ở ~46% trung gian, nhất quán).
- **load1 (ĐỐI CHIẾU ONLY):** bracket 0,38–5,58, không mẫu hình
  (run 5: 5,21→5,58 trong khi run 2: 0,88→0,42 ở cùng PSI ~47%) —
  tiếp tục vô hiệu, không dùng trong bất kỳ tiêu chí/kết luận nào.
- **Hog:** utime trước leg 14777 → sau leg 62328 ticks
  (delta 47551 ticks); hogs_alive=2 suốt leg; **kill sạch cuối
  driver bằng PID chính xác, còn sót 0** (không pkill -f,
  không trap EXIT).
- RAM avail min trong run: 618–1131 MB (run 6 min 618 MB — thấp
  nhất leg; hog node nhẹ, không phải nguyên nhân ghim RAM).

## 7. Diễn giải — trả lời prereg §6 (bảng ĐÃ ĐĂNG KÝ TRƯỚC)

- (i) avg60 đo được thực tế: bracket 30,42–47,74%; mean từng
  run 39,47–48,00% (mean 45,98%; runs 2–6: 45,48–48,00%, mean
  47,28%) — nằm TRONG cửa sổ mục tiêu [45, 55] (run 1 thấp do leo
  dốc §5, vẫn trong cửa sổ hợp lệ [13, 66]). **TARGET-HIT** (warm-up
  W=45,74%, §5). Sai số dial ấm 0,24 điểm (1,54 điểm nếu chỉ tính
  runs 2–6) — cả hai đều ≤5.
- (ii) Chế độ nhanh/chậm ở ~46%: **TRỘN — 3/6 nhanh, 3/6 chậm.**
  Theo bảng đăng ký trước (§6 prereg): ranh giới NẰM NGAY QUANH
  M% (~46%) → dải chuyển = giao của hai vùng trộn (đợt 125 ~53%
  và đợt này ~46%). **Kết luận: dải chuyển (vùng trộn quan sát
  được) là ~46–53%.** Dải làm việc v0.3 ~45–60% được thu hẹp:
  cận trên 60% → ~53% (điểm trộn cao nhất quan sát được; trên
  53% tới 65,75% chưa có dữ liệu — chưa biết trộn hay chậm chắc
  chắn ở đó); **cận dưới ~45% ĐƯỢC KIỂM CHỨNG** — trộn ngay tại
  ~46%, ngay trên 45%, nên 45% nằm trong/ngay sát dải chuyển (không
  còn là giả thuyết chưa đo như lúc viết v0.3). Nhanh chắc chắn
  vẫn ≤13,14%; chậm chắc chắn vẫn ≥65,75%.
- **Bằng chứng vùng chuyển là dải ngẫu nhiên, không phải đường
  sắc:** trong leg, run 3 CHẬM (1,403 s) ở 47,74% trong khi run 4
  NHANH (0,980 s) ở 48,00% — tải gần như bằng nhau, kết quả ngược
  nhau. Trong-leg r(avg60, T_startup) = **−0,151** (phẳng, thậm
  chí hơi âm) — trong dải chuyển, tải KHÔNG dự báo được nhanh/chậm
  từng run. Chỉ có tỉ lệ chậm tăng theo tải giữa các cụm (0/6 @
  ~7% → 3/6 @ ~46% → 4/6 @ ~53% → 6/6 @ ~70%+).
- **Caveat xen kẽ (bắt buộc, không giấu):** chậm/nhanh xen kẽ
  hoàn hảo từng run (run 1 chậm, 2 nhanh, 3 chậm, 4 nhanh, 5 chậm,
  6 nhanh). Xác suất một dãy 6 run xen kẽ hoàn hảo do ngẫu nhiên
  (2/64) ≈ **3%** — thấp nhưng không phải không thể. Không loại trừ
  được yếu tố nhiễu xen kẽ theo run (vd: chu kỳ sibling, trạng thái
  cache vite/browser xen kẽ) — tỉ lệ 3/6 KHÔNG được đọc là
  P(chậm)=0,5 chính xác, và dải ~46–53% là "vùng trộn quan sát
  được", không phải khoảng tin cậy thống kê. Leg dò sau (nếu có)
  nên kiểm tra xem xen kẽ có lặp lại không — ghi nợ mở (§11).
  Ngược lại, tải KHÔNG xen kẽ theo kết quả (run 3 chậm 47,74% vs
  run 4 nhanh 48,00%) nên kết luận "vùng chuyển là dải ngẫu nhiên"
  vẫn đứng.
- **Ngưỡng Yên <30% ĐỨNG, KHÔNG cần thu hẹp:** không có run chậm
  nào dưới 30% (run chậm thấp nhất ở ~39,47% — run 1, vẫn trên 30%
  rõ rệt).
- (iii) tickRate: xem §8. (iv) Pha (b): xem §9.
- **Đề xuất cho DEF v0.3.1/v0.4 (chưa viết — do parent/luồng được
  giao viết):** (a) ghi dải chuyển là **vùng trộn quan sát được
  ~46–53%** (thay dải làm việc ~45–60% của v0.3); (b) tickRate mức
  trung gian mở rộng thành ~28–33 (xem §8); (c) giữ nguyên ngưỡng
  3 band Yên/Vừa/Nặng; (d) ghi bài học hold sau warm-up (§5: run 1
  leo dốc) + caveat xen kẽ (§7).

## 8. tickRate — mức trung gian tái hiện + mở rộng (sửa DEF v0.2 §3, bổ sung v0.3 §3)

- DEF v0.2 §3 quy định tickRate là chỉ báo đói **2 mức**; v0.3 §3
  đã sửa thành ≥3 mức nhờ leg GAP đợt 125 (28,07–29,47 @ ~53%).
- Leg này ở avg60 ~46%: tickRate **31,32–33,36 (mean 32,01)** —
  tách RÕ khỏi nhàn ~71,5 (cách ~40 điểm) và đói ~15–20 (cách
  ~13 điểm khỏi Vừa), và nằm ngay trên mức ~53% (28,52). Đường
  cong tickRate theo tải (n=30, 5 điểm):

| Cụm | avg60 mean (%) | tickRate mean | T_startup median (s) | chậm |
|---|---|---|---|---|
| Yên (n=6) | 7,02 | 71,50 | 0,337 | 0/6 |
| GAP-126 ~46% (n=6) | 45,98 | 32,01 | 1,227 | 3/6 |
| GAP-125 ~53% (n=6) | 53,19 | 28,52 | 1,264 | 4/6 |
| Vừa (n=6) | 69,71 | 18,54 | 1,843 | 6/6 |
| Nặng (n=6) | 90,69 | 16,77 | 2,219 | 6/6 |

- tickRate đơn điệu giảm theo avg60 tăng (71,5 → 32,0 → 28,5 →
  18,5 → 16,8), dốc nhất ở đoạn Yên→46% (71,5→32,0) rồi bẹt dần
  (32,0→28,5→18,5→16,8). **Mức "trung gian" nay là một khoảng
  ~28–33** (46–53% tải), không phải một số đơn. Vừa↔Nặng VẪN
  không tách (chênh mean 1,77 tick/s, khoảng chồng nhau) — gộp
  chung một mức "đói" như v0.3.
- Trong leg này tickRate phẳng theo tải (r(avg60, tickRate) =
  +0,322 — yếu, không âm như gộp; do run 1 thấp tải nhưng tickRate
  vẫn ~31,7) — nhất quán với kết luận "trong-band bão hòa" của
  v0.2/v0.3: tickRate chỉ tách GIỮA các cụm, không dự báo trong
  cụm.
- Tương quan gộp **n=30** (24 đợt 123–125 + 6 đợt này; tính lại
  từ JSON thô bằng chính hàm analyze_phases/analyze_psi của
  analyzer 126t4, tái hiện đúng số DEF v0.3 ở n=24):
  r(avg60, tickRate) = **−0,944** (n=24: −0,959);
  r(avg60, T_startup) = **+0,860** (n=24: +0,864);
  r(tickRate, T_startup) = **−0,809** (n=24: −0,831);
  r(avg60, threadsR) = **+0,975** (n=24: +0,979).
  **Caveat khác boot (bắt buộc):** Yên trên boot #67?, Vừa/Nặng
  trên boot #68?, GAP-125 trên boot #70, GAP-126 trên boot **#71?**
  — không gộp thành một kết luận nhân quả duy nhất; sibling đang
  chạy song song trong mọi leg.

## 9. Pha (b) T_seek MIỄN NHIỄM với tải — giữ ở n=30

- T_seek: 0,000 s (4 run) + 0,001 s (run 2, 6) — max 0,001 s,
  median 0,0 s. Gộp 30 run (Yên + GAP-126 + GAP-125 + Vừa + Nặng):
  T_seek max **0,001 s**. Caveat phân giải evs 10 ms: 0,000 s nghĩa
  là "<10 ms", không tuyên bố 0 ms. Toàn bộ chậm vẫn nằm ở
  pha startup/metadata; seek tức thì một khi metadata đã load.

## 10. Nhiễu chéo + vệ sinh sau leg

- Hog nice-19 nâng avg60 toàn máy trong lúc leg chạy
  00:09:42–00:18:51Z (~9 phút, gồm warm-up + dial + 6 run) — các
  luồng sibling đang chạy song song sẽ thấy ambient PSI cao trong
  khung giờ đó (nhiễu CÓ CHỦ Ý theo nhiệm vụ). Xếp lịch lệch đã
  tuân thủ: hog chỉ bắt đầu SAU cờ T9 (00:09:01Z; warm-up đầu tiên
  00:11:13Z).
- Hog đã kill sạch cuối driver (còn sót 0, verify bằng
  `hogs_alive` sau leg). Xvfb :199 vẫn chạy (pid 21330) — tiến
  trình nền của leg, không phải hog.
- Không đụng script/cờ của T9 hay luồng khác. Không sửa file
  chung với sibling (chỉ ghi trong `hidden_files/round126-t4/`
  và `benchmarks/` riêng của T4).

## 11. Những gì KHÔNG làm + nợ mở

- KHÔNG xét lại verdict đợt 120 (vẫn KHÔNG ĐẠT, quyết parent
  cửa (a) đứng). KHÔNG gộp số leg này với bộ verdict hay bộ Yên
  đợt 123 / bộ tải đợt 124 / bộ GAP đợt 125 (khác boot — chỉ so
  sánh tham khảo, kèm caveat §8). KHÔNG tự đổi DEF trong leg này
  ngoài việc đã viết v0.3 trước leg — cập nhật dải ~46–53% vào
  v0.3.1/v0.4 do parent/luồng được giao viết (đề xuất ở §7).
- **Nợ mở đợt sau:** (a) DEF v0.3.1/v0.4 (dải chuyển ~46–53% +
  tickRate trung gian ~28–33 + bài học hold sau warm-up + caveat
  xen kẽ); (b) kiểm tra xen kẽ chậm/nhanh có lặp lại ở leg dò sau
  không (nếu lặp lại hoàn hảo lần nữa thì điều tra yếu tố xen kẽ);
  (c) hold sau warm-up nên ngắn hơn 90 s để run 1 không leo dốc
  (hoặc bracket trước run 1 đọc sau khi browser đã chạy một lúc);
  (d) TTS 39 cấm kiểm lại; birefnet chỉ thử lại khi quan sát được
  available ≥ 6 GB (u2net là fallback chính thức); ci-security.yml
  vẫn 403 chờ user; G1 chờ user quyết (đã hỏi 13:44 16/11, chưa
  trả lời).
- **Kết quả T9 đợt 126 (ghi để đối chiếu, không phải việc T4):**
  lượt yên WebKit #6 hợp lệ (attempt2 20/20 pass, tickCost median
  44,0 ms, lớp B 5/5 ĐẠT, ngưỡng ≤60 ms GIỮ); cờ touch 00:09:01Z.

## 12. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round126-t4-leg4555.txt`):
  - `docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md` (mới, 23.465 B)
  - `docs/PHASE9_ROUND126_T4_LEG4555_LIMITS.md` (mới, file này)
  - `benchmarks/render/f2_startup_probe_126t4.mjs` (mới)
  - `benchmarks/render/f2_startup_analyze_126t4.py` (mới)
- Kết quả đo (giữ trên đĩa, KHÔNG đưa vào paths push theo tiền lệ
  đợt 124/125 — file 152.031 B vượt trần push-files):
  `benchmarks/results/webkit-blob-flaky-126t4-f2startup-leg4555.json`
  (152.031 B, 6 case, 00:18Z).
- Hồ sơ làm việc (ngoài repo, KHÔNG push qua paths-loop theo
  tiền lệ mọi đợt — lưu trong goal workspace):
  `hidden_files/round126-t4/` — prereg-def03-leg4555.md,
  run-126t4-all.sh, run-126t4-gatewait.sh, t4-watch-gate.sh,
  wait-t9-flag.sh, bracket-126t4.py, check-valid-126t4.py,
  vcut-vite-lock-v2.frozen.sh, gate0-wait-t4.log,
  gatewait-nohup.log, watch-nohup.log, t4-driver.out,
  t4-analysis-gap.txt, brackets-126t4.json, dial-GAP.txt/hogs,
  warmup-mean.txt, warmup-out.json (25.649 B, 1 case warm-up),
  t4-warmup-1.log, t4-run-{1..6}.log, postboot-t4-driver.log,
  postboot-t4-gatewait-{1..8}.log, hogs.pids, xvfb-199.log.
- Cờ xong: `hidden_files/round126-t4.done` (touch khi LIMITS +
  stage xong).
