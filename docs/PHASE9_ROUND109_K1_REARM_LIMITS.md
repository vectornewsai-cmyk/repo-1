# PHASE9_ROUND109_K1_REARM_LIMITS — Re-arm A/B TẮT E4, lặp 4+4 lượt: E4 CÓ ĐÓNG GÓP (theo tiêu chí đăng ký trước, kèm caveat Fisher)

> Đợt 109, luồng K1. Chạy live 2026-11-13T23:47:50Z–2026-11-14T01:18:18Z
> (lượt cron 06:35 +07 14/11/2026). KHÔNG push. KHÔNG release/tag.
> Không sửa production code ngoài toggle tạm thời 1 dòng (đã khôi phục sau
> MỖI lượt off, md5 về đúng `ced42efd…`). Không đo TTS/birefnet, không
> đụng workflows/cloud/collab.

## 1. Kết quả — 4+4 lượt hợp lệ; nhánh off 0 CAP (0/159 ticks) so với nhánh on 6 CAP (6/284 ticks) → E4 CÓ ĐÓNG GÓP theo prereg

### 1.1 Từng lượt hợp lệ (đủ 4+4 theo prereg)

| lượt | nhánh | gop | tầng | RAM đầu (kB) | load1 | CAP | ages (ms) | C40 | rate | wall (ms) | frzMax | tails | stopped | kết thúc lượt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| k1on | on | 250 | H | 2.681.268 | 0,67 | 4 | 5201, 5014, 5035, 5016 | 1 | 0,103 | 43.604 | 4.993 | 4 | false | HẾT 40 s |
| k2on | on | 30 | L | 1.004.616 | 1,68 | 0 | — | 0 | 0,108 | 49.016 | 20.115 | 0 | true | đóng băng ≥2,5 s |
| k3on | on | 250 | J | 1.720.120 | 27,34 | 1 | 5107 | 1 | 0,267 | 16.884 | 6.201 | 1 | true | đóng băng ≥2,5 s |
| k4on | on | 30 | J | 1.577.800 | 0,28 | 1 | 5123 | 1 | 0,194 | 23.204 | 8.766 | 1 | true | đóng băng ≥2,5 s |
| k1off | off | 250 | H | 3.247.712 | 2,84 | 0 | — | 0 | 0,438 | 11.639 | 2.625 | 1 | true | đạt ph 5,0 (bình thường) |
| k2off | off | 30 | L | 912.692 | 0,41 | 0 | — | 0 | 0,443 | 10.990 | 3.106 | 2 | true | đạt ph 5,0 (bình thường) |
| k3off | off | 250 | L | 1.241.196 | 0,89 | 0 | — | 0 | 0,410 | 12.182 | 3.594 | 1 | true | đạt ph 5,0 (bình thường) |
| k4off | off | 30 | J | 1.514.940 | 1,43 | 0 | — | 0 | 0,384 | 12.596 | 2.599 | 3 | true | đạt ph 5,0 (bình thường) |

Tất cả 8 lượt: exit 0, verdict PASS/PASS, mtime + md5 `preview.tsx` không
đổi trong lượt, RAM đầu lượt trong tầng hợp lệ, md5-trước đúng md5 kỳ vọng
của nhánh (on: `ced42efd…`; off: `8cb31223…` — file đã toggle, xem §2).
Cột "kết thúc lượt" lấy từ log probe (`dừng sớm: playhead đóng băng ≥2,5s`
vs `chờ phát tới localPh>=5.0: đạt` vs `HẾT 40s`).

### 1.2 Tổng hợp theo nhánh

| chỉ số | E4-bật (on) | E4-tắt (off) | J1 (2+2) | baseline f1–f5 |
|---|---|---|---|---|
| CAP/lượt | **1,50** (6/4) | **0,00** (0/4) | 2,00 vs 0,50 | 2,80 |
| **CAP/tick (chỉ số chính)** | 6/284 = **0,0211** | 0/159 = **0,0000** | 0,0165 vs 0,0135 | 0,0200 |
| CAP/40-ticks đầu | **3/149** | **0/154** | — | — |
| Fisher exact 2 phía (CAP/tick) | **p = 0,0924** (bảng [[6, 278], [0, 159]]) | | p = 1,0 | — |
| Fisher exact 2 phía (CAP/40) | **p = 0,1177** (bảng [[3, 146], [0, 154]]) | | — | — |
| Poisson P(0 CAP ở off \| rate on) | **0,0335** (kỳ vọng 3,36 CAP) | | — | — |
| freeze-max (ms) | 4.993 / 20.115 / 6.201 / 8.766 | 2.625 / 3.106 / 3.594 / 2.599 | 5,1/5,0 vs 2,1/2,5 | — |
| freeze-trong-đuôi-mở trung vị (ms) | 4.520 | 316 | 2.660 vs 366 | 4.900 |
| rate trung vị | 0,151 | 0,424 | 0,145 vs 0,430 | 0,110 |
| RAM đầu lượt trung vị (MB) | 1.610 | 1.346 | 1.802 vs 1.848 | 1.917 |
| tổng ticks | 284 | 159 | 242 vs 74 | 700 |
| dừng do đóng băng ≥2,5 s | **3/4 lượt** (k2on/k3on/k4on) | **0/4 lượt** | — | — |
| đạt ph 5,0 bình thường | 0/4 lượt | **4/4 lượt** | — | — |

### 1.3 Phân tầng RAM (PREREG-K1 §3, đính chính #2)

| tầng | on (CAP/ticks, lượt) | off (CAP/ticks, lượt) |
|---|---|---|
| H (2,1M–3,5M] kB | 4/166 (k1on) | 0/40 (k1off) |
| L [600k–1,45M) kB | 0/29 (k2on) | 0/74 (k2off, k3off) |
| J [1,45M–2,1M] kB | 2/89 (k3on, k4on) | 0/45 (k4off) |

Hướng chênh lệch NHẤT QUÁN ở mọi tầng có CAP: off ≤ on ở cả 3 tầng;
không có đảo dấu kiểu Simpson. Tầng L cả 2 nhánh đều 0 CAP (k2on chỉ
29 ticks, lượt thưa — xem §3.2).

### 1.4 Verdict — E4 CÓ ĐÓNG GÓP (theo tiêu chí đăng ký trước)

Đối chiếu tiêu chí đăng ký trước (PREREG-K1 §4):

- (a) "CAP/tick off ≈ 0 (0 CAP trên tổng ticks nhánh off, hoặc Fisher 2
  phía p < 0,05)": quan sát **đúng 0 CAP trên 159 ticks nhánh off** —
  thỏa điều khoản chữ "0 CAP" của (a). Fisher 2 phía p = **0,0924**
  (không đạt < 0,05 theo nhánh Fisher của (a)); bù lại, xác suất Poisson
  để 0 CAP xảy ra nếu giữ nguyên rate on là **0,0335** (kỳ vọng 3,36 CAP).
- (b) "CAP/tick on tái hiện ~0,015–0,020": quan sát **0,0211** — cao hơn
  biên trên 0,020 đúng 5,5%, thực chất bằng rate baseline f1–f5
  (0,0200) và cao hơn J1-on (0,0165). Coi là tái hiện trong substance.
- (minh oan) bị LOẠI dứt khoát: nhánh off có 0 CAP (tiêu chí minh oan
  đòi ≥ 1 CAP ở nhánh off) và CAP/tick off = 0% của on (đòi ≥ 50%).
- **Verdict: E4 CÓ ĐÓNG GÓP.** Khi E4 tắt, CAP biến mất hoàn toàn
  (0/159 ticks, 0/4 lượt) trong khi nhánh on cùng đợt tái hiện đúng
  baseline (6 CAP, 1,50/lượt).

### 1.5 Caveat thống kê — đọc verdict cùng 3 điểm này, không đọc riêng

1. **Fisher 2 phía cho chỉ số chính KHÔNG đạt < 0,05** (p = 0,0924;
   CAP/40-ticks p = 0,1177). Với n nhỏ (6 CAP tổng), Fisher thiếu
   power: kết quả "0 vs 6" có thể là dao động lấy mẫu với xác suất ~9%.
   Verdict "có đóng góp" dựa trên điều khoản "0 CAP" đã đăng ký trước
   (được đặt ra chính vì Fisher thiếu power ở n nhỏ) + xác suất Poisson
   0,0335, KHÔNG dựa trên Fisher p < 0,05. Ai chỉ đọc Fisher sẽ kết luận
   "không kết luận" — sự khác biệt này phải được ghi rõ, không giấu.
2. **Exposure không cân bằng:** nhánh off chỉ có 159 ticks so với on
   284 ticks (các lượt off đều kết thúc bình thường ở ph 5,0 sau ~11–13 s
   vì rate cao ~0,4; lượt on chậm hơn nên sống lâu hơn). Chỉ số CAP/40
   (cửa sổ cố định) vẫn cho 3 vs 0 theo hướng E4, nhưng p = 0,1177.
   Không có lượt off nào bị kiểm duyệt bất thường — cả 4 lượt off đều
   HOÀN THÀNH mục tiêu ph 5,0 (xem §1.1), nên "dừng sớm" ở đây KHÔNG
   phải kiểm duyệt làm sai lệch theo hướng có lợi cho off.
3. **Bằng chứng hội tụ (không phải chỉ số chính, nhưng củng cố):**
   - Span dài (age ≥ 4800 ms): on 6/6 thành CAP, off 0/2 thành CAP —
     cả 2 span dài của nhánh off đều ĐƯỢC CỨU bởi re-arm (k1off 5.209 ms,
     k3off 4.910 ms; rearm tăng ở tick sau). Fisher cho bảng span
     [[6, 0], [0, 2]]: **p = 0,0357**. Gợi ý cơ chế: khi E4 tắt, re-arm
     vẫn kịp kích hoạt và cứu đuôi dài; khi E4 bật, re-arm không kích
     hoạt (6/6 span dài thành CAP). Đây là gợi ý cơ chế, CHƯA phải chứng
     minh cơ chế — xem §7.
   - Dừng do đóng băng ≥ 2,5 s: on 3/4 lượt, off 0/4 lượt.
   - Freeze-max: on 5,0–20,1 s vs off 2,6–3,6 s; rate trung vị on 0,151
     vs off 0,424 (playback nhanh hơn ~2,8× khi E4 tắt).

### 1.6 Hệ quả cho production (khuyến nghị, không tự sửa)

- Theo PREREG-K1 §4, verdict "có đóng góp" cho phép sửa production kèm
  unit test — NHƯNG luồng đo này KHÔNG tự sửa production (ngoài toggle
  đã khôi phục). Đề xuất cho đợt sau: sửa E4 (bỏ gate skip-render ở tick
  xác nhận drift, hoặc thu hẹp điều kiện skip) + unit test tái hiện CAP
  trên probe104f5, rồi chạy lại A/B xác nhận CAP biến mất ở nhánh đã
  sửa. Vì Fisher chính chưa đạt 0,05, nên kèm theo một lượt A/B xác nhận
  độc lập (vd 2+2 lượt trên cây đã sửa) trước khi coi là đóng hẳn.
- Ghi chú cho người sửa: cơ chế vẫn chưa chứng minh (xem §7); đừng sửa
  dựa trên suy đoán cơ chế "re-arm bị ức chế" khi chưa có bằng chứng
  trực tiếp từ renderTicks/rVFC.

## 2. Phương pháp

### 2.1 Prereg + cây đo + 2 đính chính trước đo

- PREREG viết trước lượt đầu: `hidden_files/round109-k1/PREREG-K1.md`
  (ma trận 4+4, chỉ số chính CAP/tick, chỉ số phụ CAP/40-ticks,
  tiêu chí quyết định §4, tiêu chí lượt hợp lệ §3).
- Cây đo ĐÓNG BĂNG: `apps/web/src/preview.tsx` md5
  `ced42efd785724c8c0d1b16fc32c7341`, mtime 2026-11-13T14:43:56.519Z.
  `playheadHold90R2.ts` `00cce1ac…`, `driftConfirmSkip103E4.ts`
  `2748b6f3…`. Probe `probe104f5.mjs` không sửa (engine webkit, loadN=4).
  Boot #36 `ab33c58f…` (uptime -s 2026-11-13 22:53:56Z) cho nhánh on +
  k1off; boot #37 `a7bdedd2…` (uptime -s 2026-11-14 00:55:42Z) cho
  k2off–k4off (reboot giữa lượt, xem §6.2).
- **Đính chính #1 (23:44Z, trước lượt đầu):** thêm tầng RAM L
  [600k–1,45M) kB vì máy đang ở 0,8–1,1M (dưới dải J1); phân tích phân tầng.
- **Đính chính #2 (00:43Z, trước mọi phân tích CAP K1 và trước mọi lượt
  off):** thêm tầng H (2,1M–3,5M] kB vì waiter hết 20 check không mở cửa
  (vite=0 chỉ khi RAM 2,17–3,20M; khi RAM trong dải thì vite 1–2).
  Cả 2 đính chính chỉ đổi tham số RAM (biến nhiễu), không đổi outcome
  hay tiêu chí verdict; ghi rõ trong PREREG-K1 §3.

### 2.2 Toggle E4 (1 dòng duy nhất, khôi phục sau MỖI lượt off)

- Điểm gọi duy nhất của E4: `preview.tsx:5586`. Toggle: chèn `false && `
  trước điểm gọi — module E4 giữ nguyên, import giữ nguyên, bookkeeping
  giữ nguyên.
- Toggle md5: `8cb3122352a7279078bd16d988d48b42` — TRÙNG md5 toggle của J1
  (xác định: cùng 1 dòng đổi trên cùng cây `ced42efd` cho cùng md5).
  Diff đúng 1 dòng -/+ (2 dòng diff), grep = 1, esbuild parse OK mỗi lần.
- Khác J1: K1 khôi phục sau MỖI lượt off (4 lần toggle + 4 lần restore),
  không chờ hết nhánh — cửa sổ toggle mỗi lần ~35–40 s. Khôi phục bằng
  `cp` bản pristine (`preview.tsx.pristine.ced42efd`); xác minh md5 về
  đúng `ced42efd…` + diff rỗng sau mỗi lượt. **md5 cuối đợt =
  `ced42efd…`, diff rỗng — cây đã về nguyên trạng.**
- Giới hạn xác minh toggle đã biết (như J1): probe104f5 KHÔNG đọc
  `window.__vcut103e4DriftConfirmSkips` nên không có bằng chứng runtime
  trực tiếp rằng gate đã tắt trong trang chạy; bằng chứng là file trên
  đĩa đã toggle (grep + md5 + diff) + probe khởi động vite mới mỗi lượt
  (đọc file từ đĩa lúc load trang) + esbuild parse OK.

### 2.3 Driver + analyzer + kiểm chứng độc lập

- Driver `run-k1.sh` (adapt từ J1): RAM gate 3 tầng L/J/H [600k, 3,5M],
  chờ 60 s × 5 lần rồi chạy-gắn-cờ; `EXPECTED_MD5` bắt buộc; export
  `GST_PLUGIN_PATH`; md5 trước/sau mỗi lượt + copy kết quả về
  `round109-k1/` ngay sau mỗi lượt; backup JSON tốt trước khi xóa để
  chạy lại. Nhánh on chạy 1 lần 4 lượt; nhánh off chạy qua 4 sequence
  riêng (`run-off-sequence-k1.sh`, lock `OFF-SEQUENCE.lock` + trap chỉ
  restore khi chính sequence đó đã toggle — bài học J1 §6.2).
- Waiter `wait-quiet-k1.sh`: poll 60 s × tối đa 20 lần, cửa = vite=0 +
  RAM trong [600k, 3,5M]; dừng ngay nếu STOP hoặc reboot.
- Analyzer `analyze-k1-cap-pattern.py` (adapt từ J1, giữ nguyên logic
  CAP): CAP iff age ≥ 4.800 ms VÀ `rearms` không tăng ở tick ngay sau
  span; thêm chỉ số CAP/40-ticks (CAP có tick cuối trong 40
  velocityTicks đầu). ENV join đọc `run-k1.log` (regex `lượt (k\w+) …
  STRATUM=(\w+)`); chuẩn hoá nhánh bằng `endswith` (lượt đơn K1 đặt tên
  k1on…k4off — bản đầu dùng `startswith` đã nhận sai nhánh, đã sửa và
  kiểm lại, xem §6.4).
- Kiểm chứng độc lập (không qua analyzer):
  - Analyzer kiểm TRƯỚC live trên dữ liệu J1 (j2on) trong /tmp: tái hiện
    đúng CAP 4 [5025, 5165, 5302, 5123], n_vt 161, rate 0,102,
    frzMax 5.014 ms.
  - Kiểm tay CAP k4on: span ended=8710, tick cuối t=13833, age = 5123 ms,
    rearms 0→0 (không tăng) → CAP ✓. Khớp analyzer.
  - Kiểm tay 0 CAP nhánh off: k1off span tuổi lớn nhất 5.209 ms nhưng
    rearm TĂNG ở tick sau → không phải CAP (được cứu); k3off 4.910 ms
    tương tự; k2off max 4.008 ms (< 4.800); k4off max 2.577 ms.
    Khớp analyzer (0 CAP cả 4 lượt off).
  - Fisher exact 2 phía tự tính bằng Python (liệt kê đầy đủ bảng với biên
    cố định): CAP/tick p = 0,0924; CAP/40 p = 0,1177; bảng span
    [[6, 0], [0, 2]] p = 0,0357. Poisson P(0 CAP | rate on) = 0,0335.

## 3. Chi tiết từng lượt hợp lệ

### 3.1 k1on — HỢP LỆ (E4-bật, gop250, CAP 4, tầng H)

- Chạy lại lần 3 (00:43:52–00:45:02Z) sau 2 lần lỗi harness (xem §6.1).
  RAM đầu 2.681.268 kB (H), load1 0,67. md5/mtime không đổi, exit 0.
  166 ticks, 4 tails, **CAP 4 [5201, 5014, 5035, 5016]** (C40 1, tick 38).
  Chạy đủ 43.604 ms (stopped=false — HẾT 40 s, chưa đạt ph 5,0).
  rate 0,103; frzMax 4.993 ms; gap max/med 694/213,0 ms. Verdict probe
  PASS/PASS. RAM lúc tải-nền-bật 1.689 MB (decay 929 MB).

### 3.2 k2on — HỢP LỆ (E4-bật, gop30, CAP 0, tầng L — lượt thưa tick bất thường)

- 23:49:09–23:54:50Z, RAM đầu 1.004.616 kB (L), load1 1,68. md5/mtime
  không đổi, exit 0. **Chỉ 29 ticks trong 49.016 ms** (gapMed 1.606,5 ms,
  gapMax 4.209 ms) — trang gần như đóng băng suốt lượt; frzMax 20.115 ms
  (lớn nhất đợt). **CAP 0.** Dừng do đóng băng ≥ 2,5 s trong lúc seeking.
  rate 0,108. Verdict PASS/PASS. RAM lúc tải-nền-bật 1.171 MB.
  Lượt này HỢP LỆ theo mọi tiêu chí prereg (không có ngưỡng tick tối
  thiểu), nhưng n_vt = 29 làm nó đóng góp ít vào CAP/tick; ghi rõ để
  người đọc không ngạc nhiên khi thấy on-branch có 1 lượt 0 CAP.

### 3.3 k3on — HỢP LỆ (E4-bật, gop250, CAP 1, tầng J)

- 23:55:05–~23:58Z, RAM đầu 1.720.120 kB (J), load1 27,34 (cao — tải nền
  từ luồng khác; không gate load theo prereg). md5/mtime không đổi,
  exit 0. 45 ticks, 1 tail, **CAP 1 [5107]** (tick 26, trong 40 ticks
  đầu). Dừng do đóng băng ≥ 2,5 s (wall 16.884 ms). rate 0,267;
  frzMax 6.201 ms; gap max/med 673/381,0 ms. Verdict PASS/PASS. RAM lúc
  tải-nền-bật 1.991 MB (tăng so với đầu lượt do sibling xả RAM — xem §5).

### 3.4 k4on — HỢP LỆ (E4-bật, gop30, CAP 1, tầng J)

- Chạy lại (00:48:29–~00:50Z) sau lỗi ENOSPC lần 1 (xem §6.1). RAM đầu
  1.577.800 kB (J), load1 0,28. md5/mtime không đổi, exit 0. 44 ticks,
  1 tail, **CAP 1 [5123]** (tick 25, trong 40 ticks đầu). Dừng do đóng
  băng ≥ 2,5 s (wall 23.204 ms). rate 0,194; frzMax 8.766 ms; gap
  max/med 1.583/502,0 ms. Verdict PASS/PASS. RAM lúc tải-nền-bật 664 MB
  (decay 876 MB).

### 3.5 k1off — HỢP LỆ (E4-tắt, gop250, CAP 0, tầng H)

- 00:54:34–00:55:13Z (trước reboot #37), RAM đầu 3.247.712 kB (H),
  load1 2,84. md5-trước/sau = `8cb31223…` (file đã toggle), mtime không
  đổi, exit 0. 40 ticks, 1 tail, **CAP 0** (span dài nhất 5.209 ms nhưng
  rearm tăng → được cứu). Đạt ph 5,0 bình thường (wall 11.639 ms).
  rate 0,438; frzMax 2.625 ms; gap max/med 668/302,0 ms. Verdict
  PASS/PASS. RAM lúc tải-nền-bật 2.193 MB. Khôi phục md5 về `ced42efd`
  ngay sau lượt (00:55:13Z).

### 3.6 k2off — HỢP LỆ (E4-tắt, gop30, CAP 0, tầng L — chạy lại lần 6)

- Lần 6 (01:13:28–01:14:05Z) sau 5 lần lỗi harness do hạ tầng sau reboot
  (xem §6.2–6.3). RAM đầu 912.692 kB (L), load1 0,41. md5-trước/sau =
  `8cb31223…`, mtime không đổi, exit 0. 38 ticks, 2 tails, **CAP 0**
  (span dài nhất 4.008 ms < 4.800). Đạt ph 5,0 bình thường
  (wall 10.990 ms). rate 0,443; frzMax 3.106 ms; gap max/med 500/313,0 ms.
  Verdict PASS/PASS. RAM lúc tải-nền-bật 828 MB. Khôi phục md5 về
  `ced42efd` ngay sau lượt.

### 3.7 k3off — HỢP LỆ (E4-tắt, gop250, CAP 0, tầng L)

- 01:15:39–01:16:13Z, RAM đầu 1.241.196 kB (L), load1 0,89.
  md5-trước/sau = `8cb31223…`, mtime không đổi, exit 0. 36 ticks,
  1 tail, **CAP 0** (span dài nhất 4.910 ms nhưng rearm tăng → được
  cứu). Đạt ph 5,0 bình thường (wall 12.182 ms). rate 0,410;
  frzMax 3.594 ms; gap max/med 713/315,0 ms. Verdict PASS/PASS. RAM lúc
  tải-nền-bật 577 MB. Khôi phục md5 về `ced42efd` ngay sau lượt.

### 3.8 k4off — HỢP LỆ (E4-tắt, gop30, CAP 0, tầng J)

- 01:17:43–01:18:18Z, RAM đầu 1.514.940 kB (J), load1 1,43.
  md5-trước/sau = `8cb31223…`, mtime không đổi, exit 0. 45 ticks,
  3 tails, **CAP 0** (span dài nhất 2.577 ms). Đạt ph 5,0 bình thường
  (wall 12.596 ms). rate 0,384; frzMax 2.599 ms; gap max/med 703/304,0 ms.
  Verdict PASS/PASS. RAM lúc tải-nền-bật 740 MB. Khôi phục md5 về
  `ced42efd` ngay sau lượt.

## 4. So sánh với J1 và baseline

| lượt | gop | nhánh | tầng | RAM đầu (MB) | load1 | n_vt | CAP | ages (ms) | rate | frzMax |
|---|---|---|---|---|---|---|---|---|---|---|
| j1on | 250 | on | L | 1932 | 0,98 | 81 | 0 | — | 0,189 | 5.114 |
| j2on | 30 | on | L | 1673 | 4,85 | 161 | 4 | 5025–5302 | 0,102 | 5.014 |
| j1off | 250 | off | L | 2022 | 0,72 | 39 | 0 | — | 0,397 | 2.113 |
| j2off | 30 | off | L | 1673 | 1,87 | 35 | 1 | 5337 | 0,463 | 2.499 |
| **k1on** | 250 | **on** | **H** | **2618** | 0,67 | 166 | **4** | 5014–5201 | 0,103 | **4.993** |
| **k2on** | 30 | **on** | **L** | **981** | 1,68 | 29 | **0** | — | 0,108 | **20.115** |
| **k3on** | 250 | **on** | **J** | **1679** | 27,34 | 45 | **1** | 5107 | 0,267 | **6.201** |
| **k4on** | 30 | **on** | **J** | **1540** | 0,28 | 44 | **1** | 5123 | 0,194 | **8.766** |
| **k1off** | 250 | **off** | **H** | **3171** | 2,84 | 40 | **0** | — | 0,438 | **2.625** |
| **k2off** | 30 | **off** | **L** | **891** | 0,41 | 38 | **0** | — | 0,443 | **3.106** |
| **k3off** | 250 | **off** | **L** | **1212** | 0,89 | 36 | **0** | — | 0,410 | **3.594** |
| **k4off** | 30 | **off** | **J** | **1479** | 1,43 | 45 | **0** | — | 0,384 | **2.599** |

- Nhánh on K1 (1,50 CAP/lượt; CAP/tick 0,0211) tái hiện đúng hướng J1-on
  (2,00; 0,0165) và baseline f1–f5 (2,80; 0,0200): CAP vẫn xuất hiện đều
  khi E4 bật, trên cả 3 tầng RAM.
- Nhánh off K1 (0 CAP cả 4 lượt) KHÁC HẲN J1-off (1 CAP ở j2off, tuổi
  5.337 ms — CAP dài nhất chuỗi lúc đó). Giải thích có thể: J1-off chỉ
  có 74 ticks (2 lượt dừng sớm ~11 s); K1-off có 159 ticks (4 lượt) nên
  "0 CAP" của K1 có trọng lượng hơn. Không có mâu thuẫn thực chất: 1 CAP
  trong 74 ticks (J1-off) vs 0 CAP trong 159 ticks (K1-off) đều nằm
  trong dao động lấy mẫu của cùng một rate thấp — nhưng hướng chung của
  K1 (0/159 + 2 span dài được cứu) vẫn là bằng chứng E4 có đóng góp.
- Tuổi CAP: dải K1-on 5.014–5.201 ms, nằm trong dải lịch sử
  5.004–5.337 ms (f1–f5/J1). Không có CAP nào vượt 5.337 ms của j2off.
- Rate: off K1 (0,384–0,443) khớp off J1 (0,397–0,463); on K1
  (0,103–0,267) khớp on J1 (0,102–0,189, trừ k3on 0,267 cao hơn do
  load1 đầu lượt 27,34).

## 5. Decay RAM trong lúc đo

| lượt | RAM đầu lượt (MB) | RAM lúc tải-nền-bật (MB) | chênh (MB) |
|---|---|---|---|
| k1on | 2618 | 1689 | −929 |
| k2on | 981 | 1171 | +190 |
| k3on | 1679 | 1991 | +312 |
| k4on | 1540 | 664 | −876 |
| k1off | 3171 | 2193 | −978 |
| k2off | 891 | 828 | −63 |
| k3off | 1212 | 577 | −635 |
| k4off | 1479 | 740 | −739 |

- RAM lúc tải-nền-bật: on trung vị 1.430 MB, off trung vị 784 MB;
  J1: on 1.478 MB, off 1.254 MB; baseline f1–f5 trung vị 1.189 MB.
  Chênh lệch on/off ở K1 lớn hơn J1 — nhưng 2 lượt on (k2on/k3on) có
  RAM TĂNG trong lúc đo (+190/+312 MB) do sibling xả RAM giữa lượt
  (host chia sẻ, không phải do nhánh đo), nên "decay" ở K1 không đơn
  điệu và không tách được khỏi nhiễu host. So sánh RAM ĐẦU lượt
  (on 1.610 vs off 1.346 MB trung vị) sát nhau hơn và là căn cứ chính
  cho tính comparability của A/B. Không có bằng chứng RAM giải thích
  chênh lệch CAP giữa 2 nhánh (k1on ở tầng H cao nhất vẫn 4 CAP;
  k1off ở tầng H cao hơn nữa vẫn 0 CAP).
- Lưu ý: "RAM lúc tải-nền-bật" lấy từ dòng `free` trong log probe (đơn vị
  MB); 2 lượt on tăng RAM là hiện tượng host, đã ghi rõ, không hiệu
  chỉnh số liệu theo đó.

## 6. Sự cố trong đợt (ghi đầy đủ, không giấu)

### 6.1 Nhánh on: 2 lượt chết do hạ tầng, chạy lại thành công

- k1on lần 1 (23:47:52Z): Xvfb không khởi động được sau 3 lần thử
  (sóng EPERM? — probe log `Xvfb :193 chưa lên lần 1/2/3 (exit=1)`).
  Không có probe-results.json. Bằng chứng lưu tại `xvfb-fail-k1on/`.
- k1on lần 2 (00:13:59Z, tầng L): webkit launch OK nhưng "mẫu không tự
  load sau 240s: null" — trang không load sample trong 4 phút (tải nền
  lúc đó rất cao: load1 từng chạm 37,49 trong lúc chờ). Không có JSON.
  Bằng chứng lưu tại `xvfb-fail-k1on/probe-log-k1on-retry1.txt`.
- k1on lần 3 (00:43:52Z, tầng H): HỢP LỆ (CAP 4).
- k4on lần 1 (23:59:47Z): vite ENOSPC 8/8 attempt
  (`ENOSPC: System limit for number of file watchers reached`, watch
  `apps/web/scripts/r82j4-screen-motion.mjs`). Bằng chứng lưu tại
  `enospc-fail-k4on/` (probe-log + vite-attempt1).
- k4on lần 2 (00:48:29Z, tầng J): HỢP LỆ (CAP 1).
- Waiter k1on lần 2 hết 20 check (~20 phút) không mở cửa (vite=0 chỉ
  khi RAM 2,17–3,20M) — lý do đính chính #2 thêm tầng H (xem §2.1).
  Trong lúc chờ, analyzer được kiểm chứng trên dữ liệu J1 trong /tmp
  (tái hiện đúng j2on).

### 6.2 Reboot #37 cắt giữa k1off và k2off (00:55:42Z)

- Boot #36 `ab33c58f…` → boot #37 `a7bdedd2-1f2f-4eb0-8dc5-3898c2719b99`,
  `uptime -s` 2026-11-14 00:55:42Z. Gap #36→#37 = 2h01'46", trong dải cơ
  học J8 [19'07", 5h43'18"].
- k1off xong 00:55:13Z (trước reboot, HỢP LỆ, md5 đã khôi phục về
  `ced42efd` trước reboot — không có toggle nào kẹt qua reboot).
  Waiter k2off khởi động lại trên boot mới 00:56:28Z (ghi đúng boot mới
  trong log). Không lượt nào đang chạy lúc reboot.

### 6.3 WebKit không launch được sau reboot #37 — chẩn đoán + 2 sửa hạ tầng (01:01Z, 01:13Z)

- k2off lần 1 (00:56:29Z), lần 2 (00:58:55Z), lần 3 (01:00:25Z): đều chết
  sau ~6 s — MiniBrowser WebKit không load được
  `libevent-2.1.so.7: cannot open shared object file`.
  **Nguyên nhân gốc (đã chứng minh):** wrapper
  `~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/MiniBrowser`
  (shell script) GHI ĐÈ `LD_LIBRARY_PATH` thành chỉ `lib:sys/lib`, nuốt
  đường DEBROOT mà probe104f5 đặt (comment đợt 101 C3). Trên boot #36,
  MiniBrowser vẫn chạy nhờ bản apt-install libevent còn trong /usr/lib
  (ngoài ~, ephemeral — mất sau reboot #37). Sau reboot, ldd với path
  của wrapper cho 7 lib thiếu: libEGL.so.1, libavif.so.16, libdw.so.1,
  libevdev.so.2, libevent-2.1.so.7 (+2 trùng). `apt-get install
  libevent-2.1-7` THẤT BẠI ("Unable to locate package" — package lists
  rỗng; `apt-cache` treo). Tái hiện lỗi bằng script launch Playwright
  tối thiểu với đúng env của probe (lỗi y hệt), chạy trực tiếp
  `bin/MiniBrowser` với cùng env thì load lib OK — khoanh đúng wrapper.
- **Sửa #1 (01:01Z):** 1 dòng trong wrapper — đổi thành
  `LD_LIBRARY_PATH="${MYDIR}/lib:${MYDIR}/sys/lib:${LD_LIBRARY_PATH}"`
  (giữ lại path truyền vào thay vì ghi đè). Backup bản gốc tại
  `round109-k1/MiniBrowser-wrapper.orig`. Kiểm chứng: launch Playwright
  tối thiểu với đúng env probe → **LAUNCH OK, version: 27.2**.
  Sửa này nằm ngoài repo/probe/production (chỉ bundle Playwright trong
  ~/.cache, tồn tại qua reboot), và cũng gỡ chặn cho mọi probe webkit
  khác của đợt. Nếu parent không đồng ý, revert bằng bản `.orig`.
- k2off lần 4 (01:07:20Z) và lần 5 (01:09:39Z): webkit launch OK nhưng
  page crash ở `page.setInputFiles` ("Target crashed", sau S0 load OK).
  **Nguyên nhân thứ hai:** toàn bộ stack GStreamer hệ thống đã mất sau
  reboot — `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` không tồn tại
  (0 plugin), không có libgstreamer-1.0.so.0 hệ thống; probe đặt
  `GST_PLUGIN_SYSTEM_PATH` đúng đường đó. Debroot có đủ bộ plugin 1.24.2
  (269 file, gồm libgstplayback/isomp4/typefindfunctions).
- **Sửa #2 (01:13Z):** symlink
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` → thư mục plugin của debroot
  (1 symlink, revert được bằng `rm`, ephemeral — mất sau reboot sau,
  như apt-install). Không sửa probe/production.
- k2off lần 6 (01:13:28Z): **HỢP LỆ** — giả thuyết crash-do-thiếu-plugin
  ĐÚNG. Cả 2 sửa hạ tầng đều được kiểm chứng bằng lượt chạy thành công
  sau đó (k2off/k3off/k4off đều PASS), không chỉ bằng test tay.

### 6.4 Lỗi analyzer (phát hiện trước khi phân tích dữ liệu live, đã sửa)

- Bản analyzer đầu tiên chuẩn hoá nhánh bằng `startswith("on"/"off")`
  nên các lượt đơn k1on/k4on bị nhận nhánh là "k1on"/"k4on" (không gộp
  vào on) — tổng on lúc đó chỉ tính 2 lượt. Phát hiện khi chạy analyzer
  trên nhánh on (trước mọi lượt off); đã sửa thành `endswith`, chạy lại,
  kiểm lại trên dữ liệu J1 (tái hiện đúng j2on) và trên đủ 8 lượt K1.
  Không ảnh hưởng số liệu cuối (phân tích cuối dùng bản đã sửa).

### 6.5 Va chạm với luồng K khác

- K3 (chromium freeze-run, 24 clips) giữ vite từ ~00:24Z; K7 chạy smoke
  test lúc 23:50Z. Waiter K1 chờ vite=0 theo brief (ghi mọi lần chờ vào
  log `wait-quiet-k1.log`). Không có xung đột toggle: mọi sequence off
  đều kiểm tra không còn driver probe109 nào trước khi toggle; lock
  `OFF-SEQUENCE.lock` không bao giờ bị tranh chấp (mỗi sequence chạy
  tuần tự, lock được gỡ sau mỗi lượt).

## 7. Giới hạn — những gì KHÔNG làm được

1. **n = 4+4 vẫn nhỏ; Fisher chính chưa đạt 0,05** (p = 0,0924;
   CAP/40 p = 0,1177) — xem §1.5. Verdict "có đóng góp" dựa trên điều
   khoản "0 CAP" đã đăng ký trước + Poisson 0,0335 + bằng chứng hội tụ,
   không dựa trên Fisher p < 0,05. Cần lượt A/B xác nhận độc lập trên cây
   đã sửa trước khi coi là đóng hẳn.
2. **Cơ chế chưa chứng minh:** E4 chỉ bỏ 1 lần `renderFrame` ở tick xác
   nhận drift — chưa có đường cơ chế chứng minh vì sao việc đó gây freeze
   5 s / CAP. Gợi ý duy nhất: span dài ở nhánh off đều được re-arm cứu
   (2/2) trong khi ở nhánh on đều thành CAP (6/6) — gợi ý E4 ức chế
   re-arm, nhưng chưa có bằng chứng trực tiếp (renderTicks/rVFC chưa
   phân tích sâu). KHÔNG sửa production dựa trên suy đoán cơ chế.
3. **Tầng RAM không cân bằng hoàn toàn giữa 2 nhánh:** on H×1/L×1/J×2,
   off H×1/L×2/J×1 (RAM dao động theo host, không điều khiển được).
   Phân tầng cho hướng nhất quán (§1.3), nhưng mỗi tầng chỉ có 1–2 lượt
   mỗi nhánh — không đủ để kết luận riêng từng tầng.
4. **k2on là lượt thưa tick bất thường** (29 ticks / 49 s, frzMax 20.115 ms)
   — hợp lệ theo prereg nhưng đóng góp ít vào CAP/tick; nếu loại k2on
   thì on còn 6 CAP / 255 ticks = 0,0235 (verdict không đổi).
5. Toggle xác minh ở mức file trên đĩa + esbuild (xem §2.2) — không có
   bằng chứng runtime trực tiếp rằng gate đã tắt trong trang chạy.
6. Load1 đầu lượt không gate: k3on load1 27,34 (cao); k1off RAM đầu
   3.247.712 kB (tầng H, cao nhất đợt). Cả 2 đều ghi rõ ở §3.
7. Hai sửa hạ tầng (§6.3) nằm ngoài repo: wrapper Playwright (tồn tại qua
   reboot, ảnh hưởng mọi probe webkit) + symlink GStreamer (ephemeral,
   mất sau reboot sau). Nếu máy reboot nữa trước khi đợt sau chạy webkit,
   symlink sẽ mất và lỗi "Target crashed" có thể quay lại; wrapper thì
   còn. Ghi rõ để luồng infra (K8) xử lý bền vững.
8. Không đo TTS/birefnet; không đụng workflows/cloud/collab; không push;
   không release/tag. Không sửa production ngoài toggle đã khôi phục.

## 8. Nợ mở / kế hoạch đợt sau

1. **Sửa E4 + unit test** (theo verdict §1.4–1.6): bỏ/thu hẹp gate
   skip-render ở tick xác nhận drift; unit test tái hiện CAP trên
   probe104f5; chạy lại A/B xác nhận độc lập trên cây đã sửa.
2. **Lượt A/B xác nhận** (khuyến nghị trước khi đóng hẳn): 2+2 lượt trên
   cây đã sửa, cùng probe, để Fisher có thêm power.
3. **Sửa bền vững hạ tầng webkit sau reboot** (cho K8/infra): wrapper
   Playwright ghi đè `LD_LIBRARY_PATH` (đã vá tạm 1 dòng — cần quyết
   có giữ vá này hay sửa probe để đặt path theo cách khác) + GStreamer
   hệ thống mất sau reboot (symlink tạm sẽ mất sau reboot sau; cần
   apt-install bền vững hoặc đưa plugin vào debroot path mà probe đọc).
4. ENOSPC (`max_user_watches=63747`) vẫn là nghẽn hạ tầng cho mọi probe
   vite song song (k4on chết 8/8 attempt) — cân nhắc tăng ở cấp hệ thống
   (ngoài phạm vi luồng đo).
5. G1 vẫn mở, chờ user quyết metric (nợ đợt 105/107) — không thuộc K1.
6. ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần
   thành công (RAM < ngưỡng 6 GB).

## 9. File / stage

- LIMITS này: `docs/PHASE9_ROUND109_K1_REARM_LIMITS.md`
- Prereg: `hidden_files/round109-k1/PREREG-K1.md` (viết trước lượt đầu;
  2 đính chính tầng RAM ghi trong file, trước mọi phân tích CAP K1).
- Dữ liệu đợt này: `hidden_files/round109-k1/` (prereg, status
  `round109-k1-status.md`, run log `run-k1.log`, sequence log
  `run-off-sequence.log`, waiter log `wait-quiet-k1.log`, probe log/JSON
  bản copy 8 lượt hợp lệ, `cap-pattern-rows.json`, driver `run-k1.sh`,
  sequence `run-off-sequence-k1.sh`, waiter `wait-quiet-k1.sh`, analyzer
  `analyze-k1-cap-pattern.py`, `toggle.diff` + `toggle-md5.txt` (md5
  `8cb31223…`), `preview.tsx.pristine.ced42efd`,
  `MiniBrowser-wrapper.orig` (backup wrapper trước vá),
  `enospc-fail-k4on/`, `xvfb-fail-k1on/`, `webkit-lib-fail-k2off/`) —
  ngoài repo, không stage qua paths-loop; bản copy probe JSON khớp md5
  với gốc tại `hidden_files/round104-f5/probe-webkit-load4-gop*-k*`.
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round109-k1-rearm.txt`
  — LIMITS-only (theo mẫu H1/I2/J1: driver/watcher/data nằm ngoài repo
  nên không đưa vào paths-loop), NUL-delimited, đã verify read-back.
