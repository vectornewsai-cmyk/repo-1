# LIMITS — T4 đợt 125: leg TRUNG GIAN (band GAP) dò ranh giới chuyển chế độ chậm + DEF PSI v0.2

**Ngày:** 17/11/2026 (đo 16/11/2026, 21:15–21:24Z). **Luồng:** T4, đợt 125
vòng lặp Phase 9 (lượt cron 03:35 +07 17/11/2026). **Trạng thái:**
**DEF v0.2 XONG + leg GAP XONG 6/6 VALID.**
**Prereg:** `hidden_files/round125-t4/prereg-leg-trung-gian.md`
(đăng ký trước mọi phép đo, kèm sửa đổi §0.3 sau reboot).
**DEF:** `docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md` (v0.2, CHUẨN hiện hành).
**Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — leg này không xét lại verdict,
không gộp số với bộ verdict (cây H3f, boot đã chết).

## 0. Tóm tắt (đọc trước)

- **DEF v0.2 ĐÃ VIẾT XONG** (280 dòng, §§1–11, 18.176 B, 20:49Z):
  giữ ngưỡng 3 band; tickRate = chỉ báo đói 2 mức; ranh giới chuyển
  CHƯA xác định, khoảng trống avg60 13–66%; tương quan gộp n=18.
  Đọc lại, xác nhận đầy đủ — không viết lại.
- **Reboot giữa đợt:** boot đăng ký ở prereg §0 (b69, boot_id
  `670c07f6-2299-43f6-951c-0cf1116afd6d`, btime 20:35:11Z) **ĐÃ CHẾT**,
  reboot lúc **20:54:19Z** (phát hiện 20:58:10Z khi gatewaiter đọc
  uptime -s). Boot mới **b70** (số tạm, chờ T6 recount mù #37):
  boot_id `310f07e4-f789-427a-bee8-a9aefd5a1f02`, btime
  `2026-11-16 20:54:19Z`. **Chưa có phép đo nào trên boot cũ**
  (validate §0.2 chỉ là kiểm tra công cụ, không phụ thuộc boot) —
  không có dữ liệu nào bị ảnh hưởng. Leg chạy toàn bộ trên b70.
- **Leg GAP: 6/6 VALID, 0 VOID, 0 attempt thừa.** 2 hog, dial
  TARGET-MISS (25,98% < 30%), run means **52,75–53,99%** (mean
  53,19%). T_startup median **1,2635 s**, p90 **1,421 s**,
  **chậm (>1,2 s) 4/6, nhanh 2/6 → TRỘN** → ranh giới chuyển
  **NẰM NGAY QUANH ~53%** (xem §7). Pha (a) bar (tham khảo):
  CHƯA ĐẠT (median 1,2635 > 1,0; p90 1,421 > 1,2). Pha (b):
  **ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **Phát hiện mới cho DEF v0.3:** tickRate ở ~53% là **28,07–29,47
  (mean 28,52)** — một mức TRUNG GIAN, tách rõ khỏi cả nhàn ~71,5
  lẫn đói ~15–20. Quy tắc "tickRate 2 mức" của v0.2 **KHÔNG còn
  đúng** — cần sửa thành ≥3 mức (xem §8).
- **Bài học dial:** dial đọc 25,98% (chưa có browser chạy) nhưng
  run means ~53% — tải của chính browser/vite cộng thêm ~27 điểm
  avg60. Dial không có browser **đánh giá thấp** avg60 lúc chạy
  ~27 điểm (xem §5).

## 1. Bối cảnh + boot + cây (verify trước/sau leg)

- Cây BASELINE, không đổi trong leg: preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b`, media.ts md5
  `2c384ed13703809d5e999311147745e7` — verify lúc mở driver
  (21:15:57Z) và sau leg (21:24:35Z), khớp nhau.
- Boot b70 (310f07e4, btime 20:54:19Z) không đổi trong suốt leg
  (uptime -s kiểm trước mỗi run + cuối driver).
- Cờ POSTBOOT_PASS của **T5 đợt 125** (khớp b70, KHÔNG dùng cờ
  đợt 124 — luật STALE): `boot_id=310f07e4-f789-427a-bee8-a9aefd5a1f02
  btime=2026-11-16T20:54:19Z pass_at=2026-11-16T20:59:21Z poll=3`
  (PASS NHỜ REPLAY; dpkg 2→1509 dòng — replay lần này chạy thật,
  khác b69 bị kẹt 19' không replay). Lưu ý định dạng cờ b70 dùng
  dấu `=` (`boot_id=...`) khác đợt 124 (dấu `:`) — mẫu grep cũ
  của gatewaiter đã sửa thành `boot_id[:=] *` trước khi đo (poll
  #1–2 sau sửa mới thấy t5flag=PASS-co; xem prereg §0.3).
- H3f GIỮ GỠ. Không sửa production. Không push. Không release/tag.
- Không đụng TTS 39. Không đụng birefnet (chờ available ≥ 6 GB
  theo quyết parent). Không binary vào batch.

## 2. DEF v0.2 — xác nhận đã xong (không viết lại)

File `docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`, 280 dòng, 18.176 B,
viết 20:49Z, đọc lại xác nhận đầy đủ trước khi viết LIMITS này:
§1 vì sao PSI; §2 trục chính/phụ/chỉ báo; §3 3 band (Yên <30%,
Vừa 30–80%, Nặng >80%) + tickRate theo band; §4 protocol đo
(hold ≥90 s, dial vòng kín theo PSI, mẫu 5 s, bracket, leg dò
ranh giới với cửa sổ mục tiêu vs cửa sổ hợp lệ); §5 luật VOID
(+ luật riêng band GAP); §6 trả lời 3 câu hỏi hiệu chỉnh của
v0.1 §6 bằng leg tải đợt 124; §7 tương quan gộp n=18 (không kết
luận nhân quả); §8 load1 vô hiệu; §9 caveat; §10 verdict đợt 120
vẫn đứng; §11 lịch sử phiên bản (v0.3 dự kiến sau leg này).
File v0.1 (`docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`) giữ nguyên
làm lịch sử — không sửa, không xóa.

## 3. Validate công cụ TRƯỚC khi đo (prereg §0.2 — ĐẠT, 20:52–20:55Z)

- Analyzer 125t4 `S9_BAND=GAP` trên dữ liệu đợt 124: **0 case**
  (12/12 SKIP — lọc GAP không ăn nhầm case cũ).
- Analyzer 125t4 `S9_BAND=MEDIUM` trên cùng dữ liệu: tái hiện đúng
  **6/6 VALID**, median T_startup 1,8425 s (≈1,843 s LIMITS 124t4
  §2.1), p90 2,992 s, slow 6/6 — hồi quy path MEDIUM OK.
- check-valid-125t4.py `S9_BAND=GAP`: **VALID_COUNT=0, TOTAL=0**;
  `S9_BAND=MEDIUM`: **VALID_COUNT=6, TOTAL=6** (shim=UNKNOWN trong
  test vì pull log nằm ở round124-t4/pull — đúng kỳ vọng).
- `psi_avg60()` (mẫu sửa đợt 123 phụ lục A): đọc được 17,61%,
  khớp dòng `some` trong /proc/pressure/cpu lúc test.
- `bracket-125t4.py` entry TEST-bracket: ghi đúng avg60=17,61%,
  band=GAP, hogs_target=2; đã xóa brackets-125t4.json về `{}` sau
  test. File OUT tạm (copy dữ liệu 124 để validate) đã XÓA sau test.
- `node --check` runner 125t4 OK; `bash -n` driver/gatewaiter/
  watcher OK; `python3 -m py_compile` analyzer/check-valid/bracket OK.
- Lock script copy md5 = `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp
  baseline đóng băng). Diff probe 125t4 vs 124t4: chỉ 8 dòng khác
  (header, PORT 8965→8975, S9_DIR, OUT, round string, Xvfb
  :197→:198) — không đổi flow đo.
- Runner COPY `f2_startup_probe_124t4.mjs` →
  `f2_startup_probe_125t4.mjs` (PORT **8975**, S9_DIR round125-t4,
  OUT `webkit-blob-flaky-125t4-f2startup-legtrunggian.json`,
  Xvfb **:198**, round string phase9-round125-t4-legtrunggian).
  Analyzer COPY tương tự + thêm BAND **GAP** {lo:13, hi:66,
  a_lo:3, a_hi:76, label "TRUNG-GIAN (gap 13–66%)"}.
  Cấu hình MSB4RB8 giữ nguyên đợt 118–124
  (`J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
  `L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size UNSET),
  Q8SEEKFAST c8, fresh-element, wall 30 s, seekImmediate 16,
  shim `l2_queue2_probe.so` md5 `b208e8de1780f432062f03ca5eea4a66`.

## 4. Gate + phối hợp T9 (timeline thật)

- Gatewaiter T4 (poll check-only riêng, mỗi 2 phút) chạy từ
  20:58:10Z trên b70; watcher `t4-watch-gate.sh` khởi động lại
  21:00:27Z (lần đầu thất bại im lặng — không viết được
  t4-watch.log, không có process; nguyên nhân chưa xác định, có
  thể do exec session bị teardown giữa lúc spawn; đã khởi động
  lại bằng setsid + nohup, pid 8406, xác nhận chạy).
- **T9 chạy lượt yên WebKit #5 TRƯỚC** (quyết parent §12.10):
  attempt1 bắt đầu 21:05:28Z, cửa yên mở poll 4 (21:08:29Z),
  xong 20/20 pass; cờ `hidden_files/round125-t9-done` xuất hiện
  **21:14:15Z** ("1 luot yen hop le: attempt1 20/20, tickCost
  median 47.5ms, lop B 5/5 DAT, nguong <=60ms GIU").
  **T4 KHÔNG chạy bất kỳ hog nào trước cờ này** — 0 phút chồng
  chéo hog lên cửa yên của T9.
- **GATE 0 ĐẠT ở poll #8, 21:15:44Z** (trước hạn 22:15Z): 6/6 điều
  kiện — (0a) check-only riêng exit 0; (0b) apt/apt-get/dpkg = 0
  (đếm bằng `pgrep -x`, không grep-ps); (0c) md5 preview 03bf029f;
  (0d) POSTBOOT_PASS T5-125 khớp b70 (PASS-co); (0e) boot không
  đổi; (0f) cờ round125-t9-done CÓ. RAM avail lúc gate ĐẠT 947 MB;
  dpkg_lines 1509.
- Watcher thấy GATE DAT 21:15:57Z → chạy driver
  `run-125t4-all.sh`. Driver bắt đầu 21:15:57Z, kết thúc
  21:24:35Z, **exit 0**. Xvfb :198 (pid 15516). Postboot check
  lúc mở driver exit=0. PSI lúc mở driver: some avg10=18,61
  avg60=12,67 avg300=10,73. RAM avail lúc mở driver 910 MB.
  Registry GStreamer mtime không đổi (21:15:40 trước = sau leg;
  gstRegChanged=false mọi run).

## 5. Dial (vòng kín theo PSI — prereg §3)

- Bắt đầu **2 hog** (pids 15526, 15527, nice -n 19), chờ 90 s.
- Dial đọc #1, **21:17:31Z: avg60 = 25,98%** với 2 hog (alive=2).
- 25,98% < 30% (dưới cửa sổ mục tiêu [30, 50]) nhưng ≥13%
  (trong cửa sổ hợp lệ [13, 66]) → **TARGET-MISS, CHẤP NHẬN mức
  2 hog** theo đúng prereg (ghi TARGET-MISS vào driver log +
  LIMITS này). **KHÔNG thêm hog thứ 3** (quyết parent phê duyệt
  1–2 hog).
- Hold 90 s trước run 1 (hold_s run1 = 91 s).
- **Chênh lệch dial ↔ run (bài học đo, ghi rõ):** bracket trước
  run 1 đã là 49,12% (từ 25,98% lúc dial) và run means
  52,75–53,99%. Tải của chính browser/vite + WebKit lúc chạy
  cộng thêm **~27 điểm avg60** so với lúc dial (chỉ hog chạy,
  chưa có browser). Dial không có browser **đánh giá thấp**
  avg60 lúc chạy ~27 điểm. Hệ quả: cửa sổ mục tiêu [30, 50]
  bị vượt ở mức run (53% > 50%) dù dial đọc dưới cửa sổ.
  Leg sau dò ranh giới nên dial khi browser/vite đã ấm, hoặc
  chấp nhận run means cao hơn dial ~25–30 điểm khi đặt đích.

## 6. Kết quả 6 run (band GAP, 2 hog, boot b70, cây baseline)

| run | T_startup (s) | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean (%) | tickRate | threadsR mean | frames | dropped | seekImmMs |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1,251 | 0,000 | 49,12 / 53,25 | 53,99 | 28,59 | 8,7 | 298 | 1 | 1204 |
| 2 | 1,197 | 0,001 | 51,39 / 52,24 | 53,07 | 28,29 | 7,7 | 324 | 1 | 1204 |
| 3 | 1,276 | 0,000 | 50,90 / 52,42 | 52,75 | 28,30 | 8,9 | 324 | 0 | 1292 |
| 4 | 1,421 | 0,000 | 50,78 / 52,11 | 53,18 | 28,07 | 7,6 | 291 | 1 | 1318 |
| 5 | 1,397 | 0,000 | 51,14 / 52,55 | 53,22 | 28,37 | 7,1 | 295 | 1 | 1229 |
| 6 | 1,193 | 0,000 | 51,06 / 51,82 | 52,90 | 29,47 | 8,2 | 290 | 1 | 1092 |

- **VALID 6/6** (check-valid `S9_BAND=GAP`, shim=OK mọi run;
  `def-void: [false, []]` mọi run; finalCt=32, finalSrc=blob,
  errEvents=0 mọi run). Không run nào VOID theo §5 DEF v0.2
  (bracket trong [3, 76]; mean trong [13, 66]; hogs_alive_min=2
  mọi run; PSI full avg10 max = 0 mọi run; đủ mẫu PSI, n=37–38
  mẫu/run; không reboot/cây đổi).
- **T_startup:** 1,193–1,421 s; **median 1,2635 s; p90
  (nearest-rank) 1,421 s; chậm (>1,2 s) 4/6** (run 1, 3, 4, 5);
  nhanh 2/6 (run 2: 1,197 s; run 6: 1,193 s — cả hai chỉ dưới
  ngưỡng 1,2 s có **7 ms** và **3 ms**).
- **Pha (a) bar — CHỈ THAM KHẢO (không xét verdict): CHƯA ĐẠT**
  (median 1,2635 > 1,0; p90 1,421 > 1,2).
- **Pha (b): ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **avg60 mean từng run: 52,75–53,99%** (mean của 6 mean =
  53,19%) — cụm rất chặt (±0,6 điểm quanh 53,2%), nằm TRÊN
  cửa sổ mục tiêu [30, 50] nhưng TRONG cửa sổ hợp lệ [13, 66].
- **tickRate: 28,07–29,47** (mean 28,52) — xem §8.
- **threadsR mean: 7,1–8,9** (giữa Yên ~2,0 và Vừa ~9,3 —
  khớp vai trò trục phụ).
- **seekImmMs: 1092–1318 ms** (giữa Yên 271–522 ms và Vừa
  1621–2810 ms — trung gian, nhất quán với vị trí ~53%).
- **totalFrames 290–324; dropped 0–1** (Yên 384/0; Vừa 161–279/
  2–7; Nặng 163–213/6–11 — frames/dropped ở GAP trung gian).
- **load1 (ĐỐI CHIẾU ONLY):** bracket 0,32–5,10, không mẫu hình
  (run 4: 0,32→3,98; run 5: 3,98→5,10) — tiếp tục vô hiệu,
  không dùng trong bất kỳ tiêu chí/kết luận nào.
- **Hog:** utime trước leg 12155 → sau leg 55276 ticks
  (delta 43121 ticks); hogs_alive=2 suốt leg; **kill sạch cuối
  driver bằng PID chính xác, còn sót 0** (không pkill -f,
  không trap EXIT).
- RAM avail min trong run: 642–856 MB (không chạm ngưỡng ghim;
  hog node nhẹ, không phải nguyên nhân ghim RAM).

## 7. Diễn giải — trả lời prereg §6 (bảng ĐÃ ĐĂNG KÝ TRƯỚC)

- (i) avg60 đo được thực tế: bracket 49,12–53,25%; mean từng
  run 52,75–53,99% — nằm ở **phần trên của khoảng trống
  13–66%**, ngay trên cửa sổ mục tiêu [30, 50] (vượt trần 50%
  khoảng 3 điểm ở mức run; dial TARGET-MISS 25,98% — xem §5).
- (ii) Chế độ nhanh/chậm ở ~53%: **TRỘN — 2/6 nhanh, 4/6 chậm.**
  Theo bảng đăng ký trước (§6 prereg): **ranh giới chuyển
  NẰM NGAY QUANH ~53%**. Khoảng trống thu hẹp: ranh giới không
  còn là "đâu đó trong (13%, 66%)" mà đã khoanh được quanh
  ~53%. Caveat bắt buộc: 2 run nhanh chỉ dưới ngưỡng 1,2 s có
  3–7 ms, và T_startup median 1,2635 s nằm sát ngưỡng — vùng
  chuyển là **một dải, không phải một đường sắc**; ở cùng
  avg60 ~53%, kết quả chia 4–2. Không tuyên bố "ngưỡng chuyển
  = 53%" như một số chính xác.
- **Ngưỡng Yên <30% ĐỨNG, KHÔNG cần thu hẹp:** không có run chậm
  nào dưới 30% (Yên max 13,14% vẫn 0/6 chậm; run chậm thấp nhất
  ở ~53%). DEF v0.3 giữ Yên <30% làm band nhanh.
- (iii) tickRate: xem §8. (iv) Pha (b): xem §9.
- **Đề xuất cho DEF v0.3 (chưa viết — do parent/luồng được
  giao viết):** (a) ghi ranh giới chuyển là **dải quanh ~53%**
  (trộn 4 chậm/2 nhanh tại avg60 mean 52,75–53,99%), không phải
  một số; (b) **sửa quy tắc tickRate 2 mức** thành ≥3 mức
  (xem §8); (c) giữ nguyên ngưỡng 3 band Yên/Vừa/Nặng; (d) ghi
  bài học dial §5 (dial không browser đánh giá thấp avg60 lúc
  chạy ~27 điểm).

## 8. tickRate — mức thứ ba (phát hiện mới, sửa DEF v0.2 §3)

- DEF v0.2 §3 quy định tickRate là chỉ báo đói **2 mức** (nhàn
  ~70+ vs đói ~15–20), tách Yên↔Vừa/Nặng nhưng không tách
  Vừa↔Nặng.
- Leg này ở avg60 ~53%: tickRate **28,07–29,47 (mean 28,52)** —
  tách RÕ khỏi cả ba mức cũ: Yên 69,49–72,61 (mean 71,50);
  Vừa 15,28–20,33 (mean 18,54); Nặng 16,54–17,39 (mean 16,77).
  **tickRate có ít nhất 3 mức** (71,5 → 28,5 → 18,5 → 16,8
  theo avg60 tăng), đơn điệu giảm theo band, và bão hòa
  TRONG từng band (trong GAP: r(avg60, tickRate) = −0,089;
  trong GAP: r(avg60, T_startup) = +0,076 — phẳng trong band,
  nhất quán với kết luận "trong-band bão hòa" của v0.2).
- Tương quan gộp **n=24** (18 run đợt 123+124 + 6 run đợt này;
  tính lại từ JSON thô, tái hiện đúng số DEF v0.2 ở n=18):
  r(avg60, tickRate) = **−0,959** (n=18: −0,97);
  r(avg60, T_startup) = **+0,864** (n=18: +0,87);
  r(tickRate, T_startup) = **−0,831** (n=18: −0,87);
  r(avg60, threadsR) = **+0,979** (n=18: +0,98).
  **Caveat khác boot (bắt buộc):** Yên trên boot #67?,
  Vừa/Nặng trên boot #68?, GAP trên boot **#70** — không gộp
  thành một kết luận nhân quả duy nhất; sibling đang chạy song
  song trong mọi leg.
- Bảng 4 mức (số đo thật, n=24):

| Band | avg60 mean (%) | tickRate mean | T_startup median (s) | chậm |
|---|---|---|---|---|
| Yên (n=6) | 7,02 | 71,50 | 0,337 | 0/6 |
| GAP ~53% (n=6) | 53,19 | 28,52 | 1,264 | 4/6 |
| Vừa (n=6) | 69,71 | 18,54 | 1,843 | 6/6 |
| Nặng (n=6) | 90,69 | 16,77 | 2,219 | 6/6 |

## 9. Pha (b) T_seek MIỄN NHIỄM với tải — giữ ở n=24

- T_seek: 0,000 s (5 run) + 0,001 s (run 2) — max 0,001 s,
  median 0,0 s. Gộp 24 run (Yên + GAP + Vừa + Nặng): T_seek
  max **0,001 s**. Caveat phân giải evs 10 ms: 0,000 s nghĩa
  là "<10 ms", không tuyên bố 0 ms. Toàn bộ chậm vẫn nằm ở
  pha startup/metadata; seek tức thì một khi metadata đã load.

## 10. Nhiễu chéo + vệ sinh sau leg

- Hog nice-19 nâng avg60 toàn máy trong lúc leg chạy
  21:16:00–21:24:35Z (~9 phút, gồm dial + 6 run) — các luồng
  sibling đang chạy song song sẽ thấy ambient PSI cao trong
  khung giờ đó (nhiễu CÓ CHỦ Ý theo nhiệm vụ). Xếp lịch lệch
  đã tuân thủ: hog chỉ bắt đầu SAU cờ T9 (21:14:15Z).
- Hog đã kill sạch cuối driver (còn sót 0, verify bằng
  `pgrep -x node` sau leg: không còn hog T4). Xvfb :198 vẫn
  chạy (pid 15516) — tiến trình nền của leg, không phải hog.
- Không đụng script/cờ của T9 hay luồng khác. Không sửa file
  chung với sibling (chỉ ghi trong `hidden_files/round125-t4/`
  và `benchmarks/` riêng của T4).

## 11. Những gì KHÔNG làm + nợ mở

- KHÔNG xét lại verdict đợt 120 (vẫn KHÔNG ĐẠT, quyết parent
  cửa (a) đứng). KHÔNG gộp số leg này với bộ verdict hay bộ Yên
  đợt 123 / bộ tải đợt 124 (khác boot — chỉ so sánh tham khảo,
  kèm caveat §8). KHÔNG tự đổi DEF trong leg này — DEF v0.3 do
  parent/luồng được giao viết (đề xuất ở §7).
- **Nợ mở đợt sau:** (a) leg dò thêm quanh ~45–55% (dial có
  browser ấm, hoặc 1 hog + browser) để xác định dải chuyển hẹp
  hơn — hiện chỉ biết ranh giới quanh ~53% với tỉ lệ trộn 4–2;
  (b) DEF v0.3 (điền ranh giới dải ~53% + sửa tickRate thành
  ≥3 mức + bài học dial §5); (c) TTS 39 cấm kiểm lại; birefnet
  chỉ thử lại khi quan sát được available ≥ 6 GB (u2net là
  fallback chính thức); ci-security.yml vẫn 403 chờ user;
  G1 chờ user quyết (đã hỏi 13:44 16/11, chưa trả lời).
- **Kết quả T9 đợt 125 (ghi để đối chiếu, không phải việc T4):**
  lượt yên WebKit #5 hợp lệ, attempt1 20/20, tickCost median
  47,5 ms, lớp B 5/5 ĐẠT, ngưỡng ≤60 ms giữ.

## 12. File đổi/thêm + stage (không push)

- Repo (text, stage trong `phase9-round125-t4-legtrunggian.txt`):
  - `docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md` (mới, 18.176 B)
  - `docs/PHASE9_ROUND125_T4_LEGTRUNGGIAN_LIMITS.md` (mới, file này)
  - `benchmarks/render/f2_startup_probe_125t4.mjs` (mới, 86.006 B)
  - `benchmarks/render/f2_startup_analyze_125t4.py` (mới, 23.390 B)
- Kết quả đo (giữ trên đĩa, KHÔNG đưa vào paths push theo tiền lệ
  đợt 124 — file 153.488 B vượt trần push-files):
  `benchmarks/results/webkit-blob-flaky-125t4-f2startup-legtrunggian.json`
  (153.488 B, 6 case, 21:24Z).
- Hồ sơ làm việc (ngoài repo, KHÔNG push qua paths-loop theo
  tiền lệ mọi đợt — lưu trong goal workspace):
  `hidden_files/round125-t4/` — prereg-leg-trung-gian.md,
  run-125t4-all.sh, run-125t4-gatewait.sh, t4-watch-gate.sh,
  wait-t9-flag.sh, bracket-125t4.py, check-valid-125t4.py,
  vcut-vite-lock-v2.frozen.sh, gate0-wait-t4.log,
  t4-driver.out, t4-analysis-gap.txt, brackets-125t4.json,
  dial-GAP.txt/hogs, t4-run-{1..6}.log, postboot-t4-driver.log.
- Cờ xong: `hidden_files/round125-t4.done` (touch khi LIMITS +
  stage xong).
