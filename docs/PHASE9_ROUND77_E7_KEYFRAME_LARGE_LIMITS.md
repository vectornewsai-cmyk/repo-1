# Đợt 77 E7 — Keyframe lớn: trial-decode sample >8 MiB + keyframe zero-giữa

Ngày: 2026-11-10 (giờ Sài Gòn). Luồng E7, đợt 77. Trạng thái: code xong,
kiểm chứng xanh, **chỉ stage — KHÔNG push** (đợt nền, user tự push sau từ main chat).

## §0. Kết luận (đọc trước)

1. **Dòng gap-analysis "sample >8 MiB stream-mode vẫn bỏ qua" đã LỖI THỜI.**
   Cap trial-decode hiện tại là **64 MiB** (`MAX_TRIAL_DECODE_SAMPLE_BYTES`,
   `gopRangeFetch39T3.ts:372`), nâng 8→32 MiB ở đợt 59 P6 và 32→64 MiB ở đợt 60 Q5.
   Stream-mode đã trial-decode được sample trong (8, 64] MiB. Lỗ thật còn lại
   là sample **>64 MiB** — vẫn skip fail-open theo thiết kế (xem §5).
2. **Probe (VideoDecoder) BẮT ĐƯỢC keyframe zero-giữa, nhưng chậm và phụ thuộc tải.**
   File thật bị zero 1 MiB giữa sample 0: probe trả `false` 2/2 ở 4,1 / 9,7 /
   19,7 MiB, nhưng mất 1,4–22 s. Ở trần main-thread 2500 ms nó vẫn timeout →
   fail-open. Claim trong gap-analysis rằng "trial-decode không bắt" là **SAI
   với VideoDecoder**; lỗ thật hẹp hơn: độ trễ bắt lỗi tính bằng giây.
3. **Quét zero-run AVCC (mới, đợt này) bắt được zero-giữa nhanh và xác định:**
   main-thread 4,1 MiB → full-file /zero-run/ trong **520 ms**; worker 9,7 MiB
   → **2083 ms**, 19,7 MiB → **2914 ms** — không decode gì cả (so với 5,8–13,6 s
   chỉ để probe báo lỗi). Đã nối vào cả 2 đường (main-thread + trong worker).
4. **Trần 90 s worker KHÔNG ràng buộc** (đợt 73 A7 đã chứng minh) — không đụng,
   không kéo trần. Nhưng dưới tải nặng (loadavg 10–16) worker vẫn timeout:
   decode thật 9,7/19,7 MiB cần ~19–22 s trong khi công thức cho 11,2/23,0 s
   (công thức hiệu chuẩn ở tải trung bình, 0,86–1,03 ms/KiB). Timeout → fail-open
   là đúng thiết kế (U5 giữ ngưỡng).
5. **Dị thường lossless:** Hi444 lossless 8K 50,2 MiB decode chỉ ~4,4–6,4 s,
   nhanh gấp **10–17×** so với lossy High 8K 47,6 MiB (~67–103 s) cùng cỡ.
   Tái hiện 3/3 lần. Chưa giải thích được — ghi nhận, không suy đoán.

## §1. Thiết kế: quét zero-run AVCC

### 1.1 Cơ sở — emulation prevention (H.264)

Trong RBSP payload của một NAL, encoder **bắt buộc** chèn byte `0x03` sau
`00 00` khi byte tiếp theo ≤ `0x03`. Hệ quả: một run ≥3 byte zero **bên trong**
payload là provably invalid — không thể xuất hiện trong bitstream hợp lệ.
Đó là cơ sở để quét mà không cần decode: rẻ, xác định, không false-positive
trên bitstream hợp lệ.

### 1.2 Quy tắc quét (`scanAvccZeroRun`, `gopTrialDecode55L8.ts`)

- Interior run ≥3 zero trong payload NAL → **vi phạm** (bắt zero-giữa).
- Trailing run ở cuối payload được miễn, trừ khi ≥64 byte (heuristic; file thật
  đo được maxTrailing = 0 trên cả 11 sample).
- NAL-walk gãy (length prefix vượt quá cuối sample) → vi phạm chỉ khi ≥64 zero
  bắt đầu **đúng** điểm gãy, còn không thì **inconclusive → fail-open** (quét
  như trước, không chặn).
- Chỉ áp dụng cho codec `avc1*`; codec khác → inconclusive.
- Length-prefix 4 byte (vd `00 00 00 05`) **không bao giờ** bị quét vì walk
  nhảy qua đúng 4 byte length.

### 1.3 Vị trí đặt quét (chia đôi vì hiệu năng)

- Sample đi đường **main-thread** (≤~7,7 MiB, tức dưới ngưỡng timeout 2500 ms):
  quét trên main thread, trước khi gọi probe. Chi phí ≤~25 ms.
- Sample đi đường **worker** (>~7,7 MiB): quét **trong worker**, trước khi tạo
  probe. Lý do: quét 50 MiB lossless trên trình duyệt đo được 2,3–3,6 s,
  64 MiB ~700 ms — chặn main thread từng đó là không chấp nhận được.
- `trialProbe === null` (opt-out, Q5(b)) → **bỏ qua cả quét**. Opt-out là tắt
  hẳn trial-decode, không chỉ tắt probe. (Chi tiết: regression bắt được lỗi
  này ở L8, xem §3.3.)

### 1.4 Không đổi gì khác

- Không nâng cap 64 MiB, không đổi trần 90 s / 2500 ms, không đổi protocol
  worker (hệ quả: lý do quét bị mất ở đường worker, xem §5).
- Không thêm i18n: fallback dùng lại key `gop.demux.trialDecodeFailed` với
  reason `zero-run:...`. `vi/en.json` và `preview.tsx` không đụng.

## §2. Số đo thật (Chromium headed 1254 qua Xvfb + CDP, máy VM 2vCPU/8GB/no-GPU)

Fixture sample-0 thật (kích thước trích bằng demuxer của repo):
720p 29.245 B; 4K 300.148 B; 4K lossless 460.756 B; 4K noisy 4.107.475 B;
4K noisy60 9.683.047 B; 8K 19.720.025 B; 8K noisy60 30.727.296 B;
8K crf3 47.608.364 B; 8K crf0 50.246.362 B; 64 MiB đúng 67.108.864 B
(8192×4320, `avc1.64003C`). File zero-giữa: zero 1 MiB giữa sample 0
(z4m/z9m/z19m), splice lại thành MP4 hợp lệ; ffmpeg cross-check z9m:
báo `cabac decode of qscale diff failed at 211 97` / `error while decoding
MB 211 97` nhưng vẫn exit 0 (error concealment, xuất frame hỏng) — file gốc
decode sạch.

### 2.1 Run 1 — baseline pre-fix (loadavg 6,04 → 16,76)

Decode trực tiếp bằng probe (không timeout), 2 rep nếu có:

| sample 0 | decode |
|---|---|
| 29 KiB | 109 / 91 ms |
| 300 KiB | 588 / 588 ms |
| 461 KiB | 1075 / 1307 ms |
| 4,1 MiB | 4426 / 3382 ms |
| 9,7 MiB | 18624 / 22367 ms |
| 19,7 MiB | 36128 / 16981 ms |
| 30,7 MiB | 40685 / 18502 ms |
| 47,6 MiB | 84100 ms (1 rep) |
| 50,2 MiB lossless | **4397 ms** (1 rep — dị thường, xem §2.4) |
| 64 MiB | 77498 ms |

Zeroed probe (pre-fix): VideoDecoder trả `false` 2/2 ở 4,1 MiB (1681/1414 ms),
9,7 MiB (11026/5787 ms), 19,7 MiB (10815/13582 ms) — **bắt được, nhưng chậm**.
T3 pre-fix: file thật 9,7/19,7/30,7 MiB → gop-range (timeout);
z4m → gop-range (timeout-1327 ms, **fail-open — lỗ đã xác nhận**);
z9m → full-file decode-failed.

### 2.2 Run 2 — post-fix, worker URL CHƯA serve (loadavg 2,20 → 2,30)

- T3 z4m → **full-file /zero-run/ trong 1699,5 ms** (quét main-thread chạy).
- z9m → gop-range timeout-11241 ms; z19m → full-file decode-failed 18323,5 ms
  — quét worker **không chạy**.
- Nguyên nhân: test server không serve URL worker mặc định
  (`./gopTrialDecodeWorker62R4.worker.ts` tương đối với bundle probe; esbuild
  để nguyên URL này) → worker 404 → fallback lặng lẽ về probe main-thread
  (đúng thiết kế R4). **Các số "đường worker" ở run 1–2 thực ra đo probe
  main-thread dưới ngân sách timeout của worker.**
- Bài học harness cho các đợt sau: server test headed **phải serve worker
  bundle đúng đường dẫn tương đối đó**, nếu không mọi đo đạc "đường worker"
  đều vô giá trị. (Trong build Vite thật, Vite xử lý URL worker — production
  không bị.)
- Kiểm tra lại trực tiếp: s50m 6387/5690/4697 ms (3 rep — **dị thường lossless
  TÁI HIỆN**); s47m 102797/66690 ms; s64m 85096 ms.

### 2.3 Run 3 — post-fix, worker URL đã serve (loadavg 12,45 → 3,56)

- RTD qua factory mặc định: s9m viaWorker=true timeout-11241 ms;
  s19m viaWorker=true decode-ok 18371,6 ms (worker thật sự load được).
- **T3: z4m → full-file /zero-run/ 520,1 ms; z9m → full-file 2083 ms;
  z19m → full-file 2913,7 ms.** Cả 3 đều full-file; z9m/z19m mang reason
  `decode-failed` (không phải `zero-run`) vì protocol worker chỉ mang kết quả
  boolean — nhưng thời gian chứng minh không có decode nào xảy ra (chỉ riêng
  độ trễ báo lỗi decode đã 5,8–13,6 s ở run 1).
- File thật: s9m gop-range timeout-11241 ms; s19m gop-range timeout-23003 ms
  (25,5 s); s30m gop-range timeout-35902 ms — thời gian decode dao động mạnh
  theo tải; timeout → fail-open là đúng thiết kế.

### 2.4 Dị thường lossless (chưa giải thích)

Hi444 lossless 8K 50,2 MiB decode ~4,4–6,4 s trong khi lossy High 8K
47,6 MiB cần ~67–103 s — nhanh hơn 10–17× ở cùng cỡ file. Tái hiện 3/3
(4397 ms run 1; 6387/5690/4697 ms run 2). Giả thuyết chưa kiểm chứng:
lossless Hi444 có thể đi đường decode khác của Chromium; **không suy đoán
thêm, ghi nhận là nợ đo**.

### 2.5 Quét zero-run — số đo Node + browser

Node (prototype, median 5 rep): 4,1 MB ~11 ms; 9,7 MB ~28 ms; 19,7 MB ~91 ms;
30,7 MB ~180 ms; 47,6 MB ~192 ms; 50,2 MB lossless (7,49% byte zero so với
0,38% ở lossy) ~1005 ms; 64 MiB ~279 ms. Browser (run 1): 30,7 MB ~127 ms;
50,2 MB ~2,4 s; 64 MiB ~700 ms.
Cả 11 sample-0 thật: **không false positive** (maxInterior luôn đúng 2,
maxTrailing 0). Mọi biến thể zero (1 MiB giữa / 25% / cuối, 3 byte tối thiểu):
bắt đúng offset.

## §3. Test Node + hồi quy

### 3.1 Suite mới E7 — 24/24 pass

`apps/web/src/lib/test_round77_e7_keyframe_large.test.ts` (24 test):
quét unit (hợp lệ / escape / cabac-trailing / length-prefix / non-avc1 /
rỗng / zero 3 byte / zero 1 MiB giữa / 1 MiB cuối / ngưỡng trailing 63 vs 64 /
walk-gãy có/không zero / trailing-bytes / overhead quét 12 MiB); T3 tích hợp
qua MP4 builder kiểu P6 + server Range local (zero 1 MiB ở 512 KiB — ngoài
prefix AVCC 256 KiB — để quét chứ không phải check AVCC bắt; control
probe-true/false; opt-out probe null ở cả stream + all-mode; cap+1
67.108.865 B skip; đúng cap 64 MiB).

### 3.2 tsc + vite

- `tsc --noEmit` apps/web: **0 lỗi** (chạy lại sau fix opt-out); apps/desktop:
  **0 lỗi** (không sửa file desktop).
- `vite build` apps/web: **pass** (chỉ cảnh báo chunk >500 kB có từ trước).

### 3.3 Hồi quy GOP + trial-decode — 47 suite

Script `~/scratch-round77-e7/run-regression-e7.sh` (mẫu P6: cjs cho U2/T3/V2,
esm cho còn lại). Kết quả: **45/47 xanh hoàn toàn** (U2 20/20, T3 10/10,
V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19,
Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11,
D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
errorDetail34Q4 35/35, M10 28/28, N10 17/17, N6 32/32, P6 16/16, Q5 15/15,
R7 6/6, R4 19/19, R4b 13/13, R10 11/11, S6 15/15, T6 9/9, U5 11/11,
Y5run 6/6, Z5run 6/6, Y5fetch 3/3, Z5fetch 4/4, A7 18/18, F1 11/11, E7 24/24).

Hai suite đỏ trong lần chạy đầu — **cả hai đều đã xử lý, không phải do code
mới (trừ L8, xem dưới)**:

- **L8 22/23 → 23/23 sau fix.** Test đỏ: "moov-giả-tinh-vi + probe null →
  gop-range". Nguyên nhân: sample garbage của L8 (LCG `seed % 256`, low-byte
  chu kỳ ngắn) chứa thật một zero-run 17 byte ở offset 459 — quét bắt đúng,
  nhưng đường all-mode của tôi quét **trước khi kiểm tra opt-out probe null**,
  phá hợp đồng Q5(b) (probe null = tắt hẳn trial-decode). Fix: quét all-mode
  chỉ chạy khi `trialProbe !== null` (1 dòng, `gopRangeFetch39T3.ts`).
  Stream-mode đã đúng từ đầu (trialSample chỉ set khi probe non-null).
  Sau fix: L8 23/23, E7 24/24 (đã thêm test khóa opt-out all-mode).
- **O6 16/18 → 18/18 khi chạy lại.** Flake thời gian đã biết (P6 §4.1).
  4 lần chạy sau fix: 16/18, 17/18, 18/18, 18/18. Cả 2 test đỏ đều là
  assertion cửa sổ thời gian của probe treo; lần đo chi tiết cho thấy
  **baseline tự đo đã 1076 ms thay vì ~200 ms kỳ vọng** (máy tải nặng, các
  luồng đợt 77 khác chạy song song) — phép trừ (tổng − baseline) âm 593 ms.
  Quét không phải nguyên nhân: quét 3 MiB ~10 ms, nhỏ hơn nhiều so với dung
  sai ±100 ms của test và so với độ nhiễu tải (~1 s).

## §4. File thay đổi (6 file, text-only, chưa push)

1. `apps/web/src/lib/gopTrialDecode55L8.ts` — `scanAvccZeroRun` +
   `AvccZeroRunScanResult` + 3 hằng (`AVCC_ZERO_RUN_MAX_LEGAL = 2`,
   `AVCC_ZERO_RUN_TRAILING_THRESHOLD = 64`,
   `AVCC_ZERO_RUN_BREAK_CORROBORATION = 64`) + comment dài giải thích.
2. `apps/web/src/lib/gopRangeFetch39T3.ts` — nối quét vào cả 2 call site
   trial-decode (stream-mode sau khi ráp `trialSample`; all-mode trên
   `chunks[0].data`), chỉ khi `!trialPlan.viaWorker` và (all-mode)
   `trialProbe !== null`; vi phạm → synthetic `{passed:false,
   reason:"zero-run:..."}` để fallback hiện có kích hoạt. Sửa 2 dòng comment
   lỗi thời về cap (32 MiB/64 request → 64 MiB/128 request).
3. `apps/web/src/lib/gopTrialDecodeWorker62R4.worker.ts` — quét ở đầu
   `onmessage` trước khi tạo probe; vi phạm → post `{type:"result",
   outcome:false}` ngay.
4. `apps/web/src/lib/test_round77_e7_keyframe_large.test.ts` — mới, 24 test.
5. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho file test mới (theo mẫu).
6. `docs/PHASE9_ROUND77_E7_KEYFRAME_LARGE_LIMITS.md` — file này.

Không sửa: `vi/en.json`, `preview.tsx`, `PHASE9_GAP_ANALYSIS.md`
(gap-analysis để luồng docs cập nhật, xem §5).

## §5. Nợ mở / follow-up

1. **Protocol worker mất lý do quét.** Worker chỉ post boolean outcome nên
   zero-run ở đường worker hiện về T3 thành `decode-failed` chung chung
   (đúng hành vi — full-file — nhưng mất thông tin chẩn đoán). Follow-up:
   thêm trường `reason` vào protocol worker (`gopTrialDecodeWorker62R4`).
2. **Sample >64 MiB vẫn skip fail-open theo thiết kế.** Chưa có file thật
   nào có sample 0 >64 MiB (fixture lớn nhất đúng 64 MiB); nâng cap nữa
   cần file thật + đo lại, không nâng mù.
3. **Safari/Firefox chưa đo.** Mọi số headed ở đây là Chromium 1254.
   VideoDecoder/Safari có thể khác (đợt 73 A7 đã ghi giới hạn Safari).
4. **Gap-analysis cần cập nhật (luồng docs):** dòng "sample >8 MiB
   stream-mode vẫn bỏ qua" (§6.6, nay đã là 64 MiB) và claim "keyframe
   zero-giữa trial-decode không bắt" (probe bắt được, chậm; quét bắt nhanh).
5. **O6 timing flake vẫn còn** (không do đợt này; P6 §4.1 đã ghi).
6. **Dị thường lossless** (§2.4): Hi444 lossless decode nhanh hơn lossy
   10–17× — cần đo riêng, chưa rõ nguyên nhân.
