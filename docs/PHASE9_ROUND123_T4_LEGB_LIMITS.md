# PHASE9_ROUND123_T4_LEGB_LIMITS.md — Bar F2 leg B theo DEF PSI v0.1: 6/6 VALID trên cây BASELINE, boot #67? — bar F2 ĐẠT trên bộ này; verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG (chờ quyết parent)

**Ngày:** 16/11/2026. **Luồng:** T4 (Phase 9 đợt 123, lượt cron 21:35 +07).
**Nhiệm vụ (quyết parent đợt 122 §12.3):** chạy lại leg B trên cây BASELINE
theo DEF PSI v0.1, 6 attempt còn nguyên từ đợt 122. **Kết quả: CHẠY ĐƯỢC —
6/6 attempt, 6/6 VALID, cả hai pha bar F2 đều ĐẠT trên bộ 6 run này.**
Không sửa production. Không push, không release/tag. Verdict KHÔNG ĐẠT đợt
120 vẫn đứng (xem §3 — bộ này KHÔNG lật verdict vì khác cây với bộ verdict).

**Cây lúc đo:** baseline preview.tsx `03bf029f` / media.ts `2c384ed1`
(verify trước/sau leg, không đổi). **Boot đo:** `#67?` (số tạm — T5-123
đếm, T6 recount mù #37), btime `2026-11-16 14:52:19Z`, boot_id
`94e29be5-a52c-4840-9ca9-4e896482e4a2`. HEAD không đổi (repo-1 không phải
git checkout — quản lý qua push-files; md5 là kiểm chứng cây).

## §0. Kết luận trước mọi chi tiết

1. **Leg B chạy xong trên boot #67? + cây baseline: 6 run, 6 VALID**
   (DEF v0.1, band Yên, 0 hog), driver 14:59:38–15:05:55Z, exit 0.
   T_startup (trộn): 0,656 / 0,295 / 0,265 / 0,312 / 0,367 / 0,362 s —
   **median 0,337 s, p90 0,656 s, 0 run chậm (>1,2 s)** → pha (a) **ĐẠT**
   (median ≤1,0 s và p90 ≤1,2 s, n=6). T_seek: 0 / 0 / 0 / 0 / 0 / 0,001 s
   — **max 0,001 s, median 0,0 s** → pha (b) **ĐẠT** (mọi run ≤100 ms,
   median ≤50 ms). **Bar F2 ĐẠT trên bộ 6 run baseline này.**
2. **Chế độ chậm KHÔNG tái hiện:** 0/6 run >1,2 s trên boot này + cây
   baseline, ở band Yên (avg60 trong run 4,38–13,14%).
3. **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.** Luật lật verdict (i) đòi ≥6 run
   nhanh trên CÙNG MỘT boot + CÙNG cây với bộ verdict (cây H3f). Bộ này
   đo trên cây baseline — là loạt đo MỚI theo định nghĩa PSI, KHÔNG gộp
   với số H3f, KHÔNG lật verdict. Muốn đổi verdict cần quyết parent
   (luật (ii)) hoặc leg mới trên cây H3f (xem §3).
4. **DEF v0.2 có dữ liệu đầu tiên:** PSI avg60 thực tế lúc browser chạy
   ở band Yên 4,38–13,14% (bracket 3,98–15,51%) — ngưỡng Yên <30%
   ĐẠT ĐƯỢC, giữ nguyên; tickRate bão hòa ~70–73 tick/s trong toàn band
   Yên, r(avg60, tickRate) = −0,13 — tickRate không tách mức tải trong
   band hẹp (xem §4).
5. **Đợt này có 1 reboot giữa chừng + 2 lỗi đã sửa trước khi đo lại:**
   boot #66? gate ĐẠT 14:50:01Z nhưng driver bị reboot giết ở dial #2
   (0 run); hàm `psi_avg60()` mẫu grep sai (không bao giờ khớp) và
   gatewaiter chấp nhận cờ T5 cũ sau reboot (nguy cơ PASS SAI) — cả hai
   đã sửa + ghi phụ lục A prereg TRƯỚC khi đo lại (xem §5).

## §1. Hai boot của đợt — gate ĐẠT cả hai, leg chỉ chạy trên boot thứ hai

### 1.1 Boot #66? (btime 14:24:43Z, boot_id `9bbda390…`) — gate ĐẠT, leg chưa chạy đã reboot

- T5-123: postboot try1 FAIL 14:44Z (thiếu 5 lib + GST + 11 gói apt);
  replay chạy thật (wrapper PID 792 + apt-get update PID 813,
  configure 14:35:39Z, installs 14:45:33–14:48:19Z, dpkg.log 2 → 1509
  dòng, gói cuối gstreamer1.0-tools 14:48:19Z) → **PASS NHỜ REPLAY
  (không repair)** 14:48:41Z, check-only exit 0.
- Gatewaiter T4 poll #1–#3 (14:46–14:50Z): postboot_exit 1→0→0, apt
  1→1→0, dpkg_lines 530→1422→1509, RAM avail 2305→3543→4520 MB,
  t5flag FAIL-co→FAIL-co→PASS-co. **GATE 0 ĐẠT poll #3 (14:50:01Z).**
- Watcher kích hoạt driver 14:50:02Z. Driver: postboot exit 0, PSI mở
  avg60 14,05%, Xvfb :196 lên, dial #1 (14:50:04Z) và #2 (14:51:34Z)
  đều đọc avg60 RỖNG (lỗi §5.1) rồi chờ 90 s mỗi lần.
- **Reboot 14:52:19Z** giết driver + watcher + gatewaiter + 2 lệnh chờ
  của T4 (SIGTERM). **0 run, 0 attempt đã dùng, 0 smoke run** trên boot
  này. OUT JSON chưa tồn tại. `brackets-t4.json` = `{}`.

### 1.2 Boot #67? (btime 14:52:19Z, boot_id `94e29be5…`) — gate ĐẠT, leg chạy xong

- Replay boot mới khởi động NHANH (configure 14:52:59Z, boot +40 s;
  wrapper PID 782 + apt-get update PID 808; installs chạy cực nhanh,
  dpkg 2 → 1104 dòng lúc 14:54:45Z → 1509 dòng, gói cuối
  gstreamer1.0-tools 14:55:31Z, boot +3m12) → T5 viết POSTBOOT_PASS
  mới cho boot này (checked 14:59:19Z, boot +7m00s, **PASS NHỜ REPLAY,
  không repair**). T5 tự chạy lại sau reboot (cờ b67-after-replay +
  b67-poll10 trong thư mục round123-t5).
- Gatewaiter T4 (bản đã sửa, phụ lục A) poll #1–#3 (14:55:32–14:59:32Z):
  postboot_exit=0 cả 3 poll, apt 1→0→0, dpkg_lines 1509, RAM avail
  1513→1312→1234 MB, t5flag FAIL-co→FAIL-co→PASS-co (cờ cũ của boot
  #66 KHÔNG được tính — kiểm chứng khớp boot_id, xem §5.2).
  **GATE 0 ĐẠT poll #3 (14:59:32Z).**
- Watcher kích hoạt driver 14:59:38Z; driver xong 15:05:55Z, exit 0.
  Không reboot nào nữa trong lúc đo. Cây không đổi trong lúc đo
  (preview `03bf029f` / media `2c384ed1` trước = sau).

## §2. Kết quả leg B — 6/6 VALID (bảng đầy đủ)

Cấu hình: MSB4RB8 (J2 4194304 + L2 ring 8388608, L2 max-size UNSET),
Q8SEEKFAST c8, fresh-element, wall 30 s, seekImmediate 16, shim
`l2_queue2_probe.so` md5 `b208e8de`, lock v2 `t4-round123` cổng 8955,
Xvfb :196, 0 hog, hold ≥90 s trước run 1 (dial DAT ngay lần #1,
avg60=2,53%).

| Run | T_startup trộn (s) | T_startup thuần-blob (s) | T_seek (s) | avg60 bracket trước/sau (%) | avg60 mean trong run (%) | avg60 mean mẫu con 5 s (%) | full avg10 max (%) | threadsR mean | tickRate (tick/s) | load1 trước/sau (ĐỐI CHIẾU) | hold (s) | Shim |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0,656 | 0,500 | 0,000 | 15,51 / 10,39 | 13,14 | 13,35 | 0 | 1,6 | 71,96 | 3,18 / 2,14 | 90 | OK |
| 2 | 0,295 | 0,295 | 0,000 | 9,91 / 7,62 | 8,77 | 8,70 | 0 | 3,0 | 69,49 | 1,96 / 1,76 | 130 | OK |
| 3 | 0,265 | 0,265 | 0,000 | 7,02 / 5,36 | 6,29 | 6,29 | 0 | 1,7 | 72,61 | 1,70 / 0,91 | 179 | OK |
| 4 | 0,312 | 0,312 | 0,000 | 5,11 / 4,23 | 4,86 | 4,85 | 0 | 1,6 | 72,18 | 0,83 / 0,92 | 228 | OK |
| 5 | 0,367 | 0,367 | 0,000 | 3,98 / 4,13 | 4,38 | 4,31 | 0 | 1,9 | 71,68 | 0,93 / 2,58 | 277 | OK |
| 6 | 0,362 | 0,362 | 0,001 | 3,99 / 4,33 | 4,65 | 4,57 | 0 | 2,1 | 71,06 | 2,45 / 3,36 | 326 | OK |

- **check-valid-t4.py: 6/6 VALID** (seekedOk, finalCt=32, finalSrc=blob,
  errEvents=0, shim readback OK 4194304/8388608, không VOID DEF nào).
  `VALID_COUNT=6`, `TOTAL=6`. Analyzer DEF: `VALID (DEF v0.1): 6/6`.
- **Pha (a):** T_startup trộn median **0,337 s**, p90 (nearest-rank)
  **0,656 s**, slow (>1,2 s) = **0** → **ĐẠT** (median ≤1,0 s, p90
  ≤1,2 s, n=6). Thuần-blob (tham khảo): median 0,337 s, p90 0,500 s —
  cũng đạt ngưỡng nếu dùng làm thước đo (không phải định nghĩa bar).
- **Pha (b):** T_seek max **0,001 s** (run 6; 5 run còn lại 0,000 s),
  median 0,0 s → **ĐẠT** (mọi run ≤100 ms, median ≤50 ms). Caveat phân
  giải evs 10 ms: 0,000 s nghĩa là "<10 ms".
- **PSI trong run:** n mẫu 33–34/run (1 Hz, đủ — không thiếu mẫu);
  avg60 mean 4,38–13,14%, min 3,42–10,39%, max 5,29–15,04%; mean mẫu
  con 5 s khớp mean toàn mẫu trong 0,21 điểm (13,35 vs 13,14 lớn nhất)
  — cách tính trung bình ổn định, không phụ thuộc cửa sổ con.
  Bracket trước/sau mọi run <30% (cao nhất 15,51%), không run nào chạm
  ngưỡng VOID (a) ≥40% hay (b) ≥30%. Full avg10 max = 0 mọi run.
  threadsR mean 1,6–3,0 (thấp — máy thật sự nhàn). Hog burn = 0 (0 hog).
- **Ghi chú trong run:** seekImmMs 522/316/271/336/375/394 ms;
  totalFrames 384 mọi run; runError=None mọi run; gst log OK mọi run
  (registry 14040 dòng, ~2,95 MB/run); pull log OK mọi run (blob push
  ~20 MB, 5 lần/run). Registry mtime đổi 14:50:20 → 15:00:32 **trong
  lúc hold trước run 1** (trước run 1, không trong run) — analyzer
  `gstRegChanged=false` ở cả 6 run (mtime trước/sau mỗi run bằng nhau).
  WebKit process trước run 1: 1 (của luồng sibling, không phải của T4).
  RAM avail min mỗi run giảm dần 1184 → 657 MB (sibling ramp-up trong
  lúc đo) — vẫn không có run chậm nào. Boot age lúc bắt đầu run:
  533–779 s (boot +8'53" đến +12'59").

## §3. Bar F2 + verdict — phân biệt rõ "bar ĐẠT trên bộ này" và "verdict vẫn đứng"

- **Bar F2 ĐẠT trên bộ 6 run baseline này** (cả pha (a) và (b) đều ĐẠT,
  cùng một boot #67? + cùng cây baseline, n=6, 0 VOID, 0 chậm).
- **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.** Lý do: luật lật verdict (i)
  đòi ≥6 run nhanh mới trên CÙNG MỘT boot + CÙNG cây với bộ verdict
  (cây H3f, 6 run của đợt 120). Bộ đợt 123 đo trên cây baseline —
  theo prereg §0.1 đây là loạt đo MỚI, KHÔNG gộp số H3f với số baseline,
  KHÔNG xét lật verdict. T4 không tự đổi luật.
- **Cần quyết parent:** (a) giữ verdict KHÔNG ĐẠT và coi bộ baseline
  này chỉ là dữ liệu hiệu chỉnh DEF (đúng mục đích đăng ký); hoặc
  (b) xét lại verdict theo luật (ii) (quyết lại ngưỡng/định nghĩa pha
  (a)); hoặc (c) ra lệnh leg mới trên cây H3f (apply lại patch từ
  `h3f.patch` còn giữ) để xét luật (i). T4 không đề xuất hướng nào —
  chỉ ghi rõ cả ba cửa đều đang mở.
- **So sánh tham khảo (KHÔNG kết luận nhân quả):** median T_startup
  baseline đợt này 0,337 s so với median bộ 8 run H3f của T7-121
  ~0,484 s — nhưng khác boot, khác tải, khác thời điểm nên KHÔNG được
  đọc là "baseline nhanh hơn H3f". Chỉ ghi số để đối chiếu.

## §4. Đầu vào cho DEF v0.2 (theo DEF §6 — dữ liệu đầu tiên có PSI trong run)

- **(i) PSI avg60 thực tế lúc browser chạy ở band Yên:** mean trong run
  4,38–13,14% (trung bình của 6 mean = 7,02%); bracket 3,98–15,51%.
  So với pilot hog-only (0 hog ~11%): browser chạy ở Yên thực tế
  ~4–13%, khớp pilot. **Ngưỡng Yên <30% ĐẠT ĐƯỢC khi browser chạy**
  (biên lớn: run cao nhất 13,14% vẫn cách ngưỡng 17 điểm). **Đề xuất
  v0.2: GIỮ ngưỡng Yên <30%.** Ghi chú kèm (từ đợt 122 §6): ngưỡng này
  là "máy nhàn" — ambient một mình đã đẩy avg60 lên 45–83% khi sibling
  + replay bận, nên leg Yên phải chạy khi máy nhàn hoặc chờ (dial vòng
  kín), không chạy chui.
- **(ii) T_startup theo band PSI:** leg này chỉ có 1 band (Yên) — 6/6
  nhanh, 0 chậm. **Chế độ chậm KHÔNG xuất hiện trong band Yên ở n=6
  này.** Tương quan trong mẫu r(avg60, T_startup) = **+0,76** (n=6) —
  chủ yếu do run 1 (avg60 cao nhất 13,14% + T_startup cao nhất
  0,656 s); **KHÔNG kết luận nhân quả** (n nhỏ, 1 band, run 1 còn có
  el1 http làm T_startup trộn cao hơn thuần-blob 0,500 s). Không có dữ
  liệu để nói chế độ chậm có tách theo band không — cần leg Vừa/Nặng
  riêng (parent ra lệnh riêng). **Không đề xuất dời ngưỡng pha (a).**
- **(iii) tickRate theo band PSI:** 69,49–72,61 tick/s (mean 71,50),
  gần như phẳng qua toàn bộ band Yên. r(avg60, tickRate) = **−0,13**
  (không tương quan); r(tickRate, T_startup) = **+0,16** (không tương
  quan). **Tương quan +0,90 của T2-120 KHÔNG tái hiện trong band Yên
  hẹp này** — T2-120 so sánh Yên vs Nặng (chênh lệch lớn), còn trong
  1 band hẹp tickRate bão hòa ~70+ tick/s khi không đói. **Đề xuất
  v0.2: tickRate giữ vai trò chỉ báo đói (phân biệt "đói/không đói"),
  KHÔNG dùng để tách mức tải trong một band.** Cần dữ liệu leg tải
  (Vừa/Nặng) mới kiểm tra lại được tương quan này.
- **load1 (đối chiếu ONLY):** run 1 load1 trước 3,18 trong khi PSI
  avg60 15,51%; run 4 load1 trước 0,83 trong khi avg60 5,11% — load1
  lại nói ngược/không đơn điệu so với PSI (thêm một bằng chứng load1
  vô hiệu; không dùng trong bất kỳ tiêu chí nào, đúng DEF).

## §5. Prereg + 2 lỗi đã sửa (đều TRƯỚC mọi phép đo trên boot đo lại)

- **Prereg** `hidden_files/round123-t4/prereg-legb.md` viết 14:4xZ,
  TRƯỚC mọi phép đo. **Phụ lục A** (reboot + 2 lỗi dưới) ghi 14:55Z,
  TRƯỚC mọi phép đo trên boot #67? (leg trên boot #67? bắt đầu
  14:59:38Z). Không có điều chỉnh nào sau khi đo bắt đầu.
- **§5.1 Lỗi `psi_avg60()` (tìm thấy khi driver boot #66? bị giết):**
  mẫu grep `'some avg60=[0-9.]*'` KHÔNG BAO GIỜ khớp vì dòng `some`
  trong `/proc/pressure/cpu` là `some avg10=... avg60=...` ("some" đi
  kèm avg10). Dial #1/#2 trên boot #66? đọc avg60 RỖNG rồi chờ 90 s
  mỗi lần. Đã sửa thành `grep -o 'avg60=[0-9.]*' | head -1` (match
  đầu tiên = dòng "some") — test sau sửa đọc được 11,74%. Runner .mjs
  (dòng 643) và `bracket-t4.py` (dòng 12) KHÔNG sai (dùng mẫu đầy đủ
  `some avg10=... avg60=...`); đã test `bracket-t4.py` (entry
  TEST-bracket: avg60=11,74%, đã xóa về `{}` sau test). Lỗi tồn tại
  từ bản 122t4 nhưng đợt 122 driver không chạy nên chưa lộ — bài học:
  test helper đọc PSI thật trước khi chạy driver, không chỉ `bash -n`.
  Dial trên boot #67? đọc đúng ngay lần #1 (avg60=2,53%).
- **§5.2 Nguy cơ PASS SAI sau reboot (sửa cùng phụ lục A):** gatewaiter
  cũ chỉ kiểm tra sự tồn tại của file POSTBOOT_PASS — sau reboot, cờ
  PASS của boot #66? vẫn nằm trên đĩa và gate cho boot mới sẽ PASS SAI
  (boot thiếu GST). Đã sửa: cờ T5 chỉ tính khi file chứa `boot_id`
  khớp boot HIỆN TẠI; chỉ dừng khi POSTBOOT_FAIL của boot hiện tại
  tuyên bố replay chết; cờ REPAIR_TRIGGERED chỉ tính khi mtime mới hơn
  thời điểm boot. Đã kiểm chứng: POSTBOOT_PASS cũ (boot_id 9bbda390)
  KHÔNG khớp boot mới (94e29be5).
- **Độ lệch nhỏ so với prereg §7 (ghi rõ, không giấu):** prereg đăng ký
  smoke run 1 lần trước leg để kiểm instrumentation mới. Driver thực tế
  KHÔNG chạy smoke run riêng — instrumentation đã được kiểm chứng bằng
  (a) validate analyzer trên dữ liệu đợt 121 trước khi đo (khớp đúng),
  (b) `node --check` runner + test `bracket-t4.py` thật, và (c) chính
  run 1 cho thấy sampler avg60 + rafTickRate ghi đủ số (không null) ở
  cả 6 run. Không run nào bị tính sai vì thiếu smoke run; ghi rõ để đợt
  sau quyết có giữ yêu cầu smoke run riêng không.

## §6. Nợ mở cho đợt sau

1. **Verdict F2 chờ quyết parent** (§3 — ba cửa (a)/(b)/(c) đều mở).
   DEF v0.2 chờ dữ liệu leg tải (Vừa/Nặng) mới hiệu chỉnh tiếp ngưỡng
   Yên/tickRate; ngưỡng v0.1 giữ nguyên tạm thời.
2. **Hạ tầng boot:** reboot 14:52:19Z giữa đợt (boot #66? chỉ sống
   ~27'36") giết mọi tiến trình nền không báo trước — tiền lệ đợt 122
   đã có (reboot #65). Replay boot #67? chạy cực nhanh (PASS sau
   +7m00s) — khác hẳn #64/#65 kẹt; không kích hoạt luật repair dạng (C)
   đợt này (không có tiến trình kẹt). T5 đã tự chạy lại sau reboot và
   viết cờ mới cho boot #67? — mẫu tốt cho các luồng khác.
3. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35/#39 chờ user
   quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức);
   R9 (a) vẫn chờ user.

## §7. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND123_T4_LEGB_LIMITS.md`.
- Runner T4: `benchmarks/render/f2_startup_probe_123t4.mjs`
  (85.927 B — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T4: `benchmarks/render/f2_startup_analyze_123t4.py`
  (21.441 B).
- Dữ liệu thô (KHÔNG stage): `benchmarks/results/webkit-blob-flaky-123t4-f2startup-legb.json`
  (140.896 B, md5 `bbee71076670685f84c7e7dd93af48bd`, 6 case, round
  `phase9-round123-t4-legb`); `hidden_files/round123-t4/` (prereg-legb.md
  + phụ lục A, run-t4-all.sh, run-t4-gatewait.sh, t4-watch-gate.sh,
  bracket-t4.py, check-valid-t4.py, brackets-t4.json (6 bracket),
  vcut-vite-lock-v2.frozen.sh md5 cd0c05c1, gate0-wait-t4.log (2 lần
  gatewaiter: boot #66? 3 poll + boot #67? 3 poll), postboot-t4-gatewait-*.log,
  postboot-t4-driver.log, t4-watch.log, t4-driver.out (2 lần driver:
  boot #66? bị giết ở dial #2 + boot #67? xong 6/6), t4-run-1..6.log,
  t4-analysis.txt, xvfb-196.log, pull/ (6 pull log), gst/ (6 gst log)).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round123-t4-legb.txt`
  (NUL-delimited; **3 entry**: runner 123t4, analyzer 123t4, LIMITS này)
  — đã verify read-back. KHÔNG push.
- Cờ: `hidden_files/round123-t4.done` (tạo sau khi ghi LIMITS + stage
  xong). Log lượt: append `hidden_files/build-loop-log.md`.
