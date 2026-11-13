# Đợt 78 F8 — Keyframe / trial-decode protocol (đóng nợ đợt 77 §4.8)

Ngày: 10/11/2026 (lượt cron 06:35 +07). Luồng F8, đợt 78. Trạng thái: code xong,
kiểm chứng xanh, **chỉ stage — KHÔNG push** (đợt nền, user tự push sau từ main chat).

## §0. Kết luận (đọc trước)

1. **(a) Protocol worker ĐÃ SỬA — lý do `zero-run` về tới T3.** Worker nay kèm
   `reason: "zero-run: ..."` trong message `result`; main thread chuyển thành
   structured failure `{ failed: true, reason }`, `runTrialDecode` giữ nguyên
   văn tới T3. Headed Chromium: z9m/z19m (đường worker) → full-file với reason
   `zero-run: zero-run 1048576 bytes at offset ...` (đợt 77: `decode-failed`
   chung). Tương thích ngược cả 2 chiều (worker cũ không gửi `reason` → vẫn
   `decode-failed` như cũ; main thread cũ bỏ qua trường thừa). Không đổi hành
   vi fallback (vẫn full-file), không thêm i18n, không đổi timeout/cap.
2. **(b) Sample >64 MiB vẫn skip theo thiết kế — đã đo và khóa.** Cap+1
   (67.108.865 B) **có zero-run bên trong** vẫn gop-range, probe 0 lần, chỉ
   1 request prefix 256 KiB (tổng 5439 ms) — chứng minh skip là theo kích
   thước, không theo nội dung. Không nâng cap (chưa có file thật nào có
   sample 0 >64 MiB, chưa có bằng chứng an toàn).
3. **(c) Firefox ĐO ĐƯỢC LẦN ĐẦU (Playwright firefox-1572, Firefox 159.0).**
   VideoDecoder có; `isConfigSupported` true cho avc1 720p và 8K; quét
   zero-run 9,7 MiB → 74 ms, 19,7 MiB → 90 ms (bắt đúng offset như Chromium);
   decode trực tiếp 720p 394 ms / 4K 1207 ms / 4,1 MiB 7313 ms (chậm hơn
   Chromium ~12–39×, single-rep — xem caveat §2.3); T3 z4m + z9m đều
   full-file /zero-run/ (đường worker Firefox cũng mang được reason — xác
   nhận độc lập cho (a)). **Safari vẫn chưa đo được** (không có trên VM này).
4. **(d) Dị thường lossless ĐÃ GIẢI THÍCH ĐƯỢC PHẦN LỚN — bằng số.**
   Tỉ lệ 10–17× tái hiện ở codec-level (không phải riêng Chromium): ffmpeg
   CLI frame-0-only, threads=1: crf3 **utime 10,075 s** vs crf0 **0,855 s**
   = **11,8×**. Cả 2 đều 1 slice IDR duy nhất, CABAC, 7680×4320, yuv420p
   8-bit, cùng content; khác biệt duy nhất đo được ở SPS: crf0 profile 244
   (Hi444PP) với `qpprime_y_zero_transform_bypass_flag=1` (transform bypass
   — không inverse transform/dequant), crf3 profile 100 (High), flag=0.
   Deblocking không đáng kể (`skip_loop_filter all`: crf3 10,258 s vs
   10,075 s). Chromium wall tuyệt đối cao hơn ffmpeg utime ~7–10× ở **cả
   2 file** (không phải bệnh riêng crf3) nên tỉ lệ được bảo toàn. Phần chưa
   tách được: CABAC-bin-decode vs inverse-transform trong 10 s của crf3
   (xem §2.4, §5.5).

## §1. Thiết kế: mang reason qua protocol worker

### 1.1 Vấn đề cũ (đợt 77 §5.1)

`TrialDecodeWorkerResponse` chỉ có `{ type: "result", outcome }` với
`outcome: boolean | "unsupported-config"`. Worker quét zero-run xong chỉ
post `outcome: false` → main thread → `runTrialDecode` → reason
`decode-failed` chung. Hành vi đúng (full-file) nhưng mất chẩn đoán.

### 1.2 Kênh mới (3 file, không đổi chữ ký probe)

- `gopTrialDecodeWorker62R4.ts` — `TrialDecodeWorkerResponse` thêm trường
  tùy chọn `reason?: string` ở biến thể `result`. Chỉ set khi
  `outcome === false` VÀ worker biết rõ lý do (hôm nay chỉ zero-run).
  Định dạng `zero-run: <scan.reason>` — đúng định dạng T3 tự tổng hợp ở
  đường main-thread (`zero-run: ${scan.reason}`), nên fallback message
  giống hệt nhau ở cả 2 đường.
- `gopTrialDecode55L8.ts` — thêm `GopTrialDecodeProbeFailure`
  `{ failed: true, reason: string }`, mở rộng
  `GopTrialDecodeProbeOutcome = boolean | "unsupported-config" | GopTrialDecodeProbeFailure`.
  `runTrialDecode` gặp structured failure → `{ passed: false, skipped: false,
  reason }` giữ nguyên văn (cắt 200 ký tự; rỗng → về `decode-failed` như
  probe-false thường). Không qua dict i18n — giống `decode-ok` /
  `probe-error`: chuỗi log tiếng Anh, không phải UI (quy ước file, tránh
  lặp lỗi P7 đợt 77 §1.2 — không thêm literal tiếng Việt nào).
- `gopTrialDecodeWorker62R4.worker.ts` — khi quét vi phạm, post
  `{ type: "result", outcome: false, reason: "zero-run: " + scan.reason }`.
  Decode-failed thật từ probe (không phải zero-run) vẫn post `false`
  không reason — browser probe trong worker chỉ trả boolean, không có
  detail để mang (nợ §5.1).
- T3 (`gopRangeFetch39T3.ts`) **không đổi**: nó đã đưa `trial.reason` vào
  fallback `gop.demux.trialDecodeFailed` nguyên văn.

### 1.3 Tương thích ngược (khóa bằng test)

- Worker cũ (bundle cũ / test giả cũ) không gửi `reason` → main thread
  resolve `false` thường → `decode-failed` như cũ (test F8 a7).
- Main thread cũ nhận message có `reason` → bỏ qua trường thừa (runtime
  không lỗi; kiểu cũ không khai báo nhưng postMessage là structural).
- `reason` kèm outcome `true` / `"unsupported-config"` → bỏ qua (test
  F8 a8/a9). `reason` >200 ký tự → cắt 200 (test F8 a10).
- Probe cũ vẫn trả boolean / `"unsupported-config"` — chữ ký
  `GopTrialDecodeProbe` không đổi.

## §2. Số đo thật

Máy: VM 4 vCPU EPYC 9D25 (RESULTS.md còn ghi 2 vCPU 7D13 — số cũ mang nhãn
máy cũ, xem LIMITS đợt 77 §4.9). Loadavg ghi kèm từng lần đo vì VM này
nhiễu tải mạnh (9–10 luồng đợt 78 chạy song song + ffmpeg bench + Chrome
headed cùng lúc).

### 2.1 (a) Headed Chromium — T3 stream, worker thật (runHeaded78F8)

Chromium 1254 headed qua Xvfb :191 + CDP, loadavg đầu 2,07. Bundle probe
+ worker từ code sau fix (worker serve đúng URL tương đối
`./gopTrialDecodeWorker62R4.worker.ts` — bài học E7 run 2).

| case | mode | reason | ms | sample reqs |
|---|---|---|---|---|
| z4m (main-thread) | full-file | `zero-run: zero-run 1048576 bytes at offset 1529449 …` | 2516,9 | 9 |
| z9m (worker) | full-file | `zero-run: zero-run 1048576 bytes at offset 4317235 …` | 3085,1 | 19 |
| z19m (worker) | full-file | `zero-run: zero-run 1048576 bytes at offset 9335724 …` | 6312,2 | 39 |
| s9m thật | gop-range | timeout-11241ms (fail-open) | 14270,4 | 19 |
| s19m thật | gop-range | timeout-23003ms (fail-open) | 29218,2 | 39 |
| s30m thật | gop-range | timeout-35902ms (fail-open) | 42430,7 | 60 |

- **(a) ĐÃ CHỨNG MINH:** z9m/z19m mang đúng reason `zero-run` (so E7 run 3:
  cùng 2 case này mang `decode-failed`). Offset khớp đúng scan Node
  (4317235 / 9335724). Thời gian chứng minh không decode (quét ~2–6 s
  gồm cả fetch chunk, so với 5,8–13,6 s chỉ để probe báo lỗi ở E7 run 1).
- Control s9m/s19m/s30m timeout → fail-open là đúng thiết kế (E7 run 3
  decode-ok được s19m lúc loadavg hạ; lần này loadavg giữ 1,5–6 cả đợt
  nên worker không kịp — không phải hồi quy).

### 2.2 (b) >64 MiB — đo/khóa bằng test Node (suite F8)

- Cap+1 (67.108.865 B) có zero-run 1 KiB ở 512 KiB → **gop-range, probe
  0 lần, 1 request sample / 262.144 B, tổng 5439 ms** (test F8 b). E7 đã
  khóa cap+1 hợp lệ (probe 0 lần) và đúng cap 64 MiB (probe 1 lần,
  129 request); F8 thêm trường hợp zero-run bên trong để khóa "skip theo
  kích thước, không theo nội dung".
- Không nâng cap: chưa có file thật nào có sample 0 >64 MiB; nâng cap
  mù sẽ kéo fetch remainder + decode tới >64 MiB mà không có số nào
  chứng minh an toàn.

### 2.3 (c) Firefox 159.0 — đo lần đầu (runFirefox78F8, Playwright)

Loadavg lúc đo 2,88 → 1,51 (ffmpeg bench v3 chạy song song một phần).

| đo | kết quả |
|---|---|
| `typeof VideoDecoder` | có (`true`) |
| `isConfigSupported` avc1.64001F 720p / avc1.64003C 8K | `true` / `true` |
| scan zero-run z9m (9.683.047 B) | 74 ms, violation, offset 4317235 (khớp Chromium) |
| scan zero-run z19m (19.720.025 B) | 90 ms, violation, offset 9335724 (khớp Chromium) |
| probe decode 720p 29.245 B | outcome `true`, 394 ms |
| probe decode 4K 300.148 B | outcome `true`, 1207 ms |
| probe decode 4K noisy 4.107.475 B | outcome `true`, 7313 ms |
| T3 stream z4m (main-thread) | full-file /zero-run/ offset 1529449, 2673 ms, 9 req |
| T3 stream z9m (worker) | full-file /zero-run/ offset 4317235, 2719 ms, 19 req |

- So với median Chromium (O6 §1: 720p 10,2 ms; 300 KiB 69,5 ms; 4,1 MiB
  622,6 ms): Firefox chậm hơn **38,6× / 17,4× / 11,7×**. CAVEAT: chỉ
  1 rep mỗi cỡ, lần decode đầu tiên trong session (warmup/decoder-init
  chưa tách), tải nền có ffmpeg bench — **chưa kết luận Firefox yếu hơn
  về bản chất**, cần đo lặp + warmup (nợ §5.4). Điều chắc chắn: Firefox
  decode ĐÚNG (outcome true) và trial-decode/zero-run chạy được end-to-end.
- T3 z9m trên Firefox là xác nhận độc lập cho (a): reason `zero-run` đi
  qua worker Firefox về T3 (worker bundle serve đúng URL tương đối như
  Chromium).
- **Safari: vẫn chưa đo được.** Không có Safari/macOS/iOS trên VM này.
  WebKitGTK đợt 77 E8 không phải Safari thật (không có MediaRecorder,
  `canPlayType` lạc quan) — không dùng làm proxy cho Safari ở đây.

### 2.4 (d) Dị thường lossless — đo lại có kiểm soát + giải thích bằng số

Fixture: cùng content `bigkey-8k-noisy100` (3 frame, 0,1 s, 7680×4320):
crf3 (lossy) 50.139.423 B, crf0 (lossless) 53.962.698 B. Sample 0:
crf3 47.608.364 B, crf0 50.246.362 B.

**Bước 1 — cấu trúc stream (ffprobe + parse SPS/PPS + thống kê NAL):**

| | crf3 (lossy) | crf0 (lossless) |
|---|---|---|
| profile | High (100), level 60 | High 4:4:4 Predictive (244), level 60 |
| codec string | `avc1.64003C` | `avc1.F4003C` |
| pix_fmt / bit depth | yuv420p / 8-bit | yuv420p / 8-bit |
| NAL trong sample 0 | 2 (1 IDR slice 47.607.671 B + SEI 685 B) | 2 (1 IDR slice 50.245.828 B + SEI 526 B) |
| `qpprime_y_zero_transform_bypass_flag` (SPS) | **0** | **1** |
| `entropy_coding_mode_flag` (PPS) | 1 (CABAC) | 1 (CABAC) |
| byte zero trong sample | 177.852 (0,37%) | 3.762.212 (7,49%) |
| entropy byte (sampled) | 8,000 bits/byte (tối đa) | 7,515 bits/byte |

→ Hai file chỉ khác ở **profile + transform bypass**; cùng 1 slice IDR,
cùng CABAC, cùng kích thước/chroma/bit-depth/content. Không có khác biệt
số slice, không có khác biệt GOP (cả 2 đều 3 frame, frame 0 là IDR duy
nhất chiếm ~95% file).

**Bước 2 — ffmpeg CLI (libavcodec hệ thống 8.1.2), frame 0-only
(`-frames:v 1`), đo utime (CPU) — số sạch, không phụ thuộc tải:**

| run | utime | rtime | wall* |
|---|---|---|---|
| crf3 threads=1 frame 0 | **10,075 s** | 56,018 s | 123,89 s |
| crf3 default threads frame 0 | 10,143 s | 113,989 s | 188,73 s |
| crf0 threads=1 frame 0 | **0,855 s** | 7,702 s | 20,90 s |
| crf0 default threads frame 0 | 0,877 s | 12,068 s | 21,37 s |
| crf3 threads=1 skip_loop_filter=all | 10,258 s | 96,713 s | 173,57 s |
| crf0 threads=1 skip_loop_filter=all | 0,907 s | 10,629 s | 20,87 s |
| crf3 whole file (3 frame) | 9,910 s | 16,595 s | — |
| crf0 whole file (3 frame) | 0,915 s | 3,662 s | — |

\* wall/rtime phồng nặng vì VM chỉ có 1,5 CPU share và bench chạy chồng
lên tsc/vite build + 9 luồng đợt 78 khác (loadavg lúc bench 0,56 → 17,28);
**utime mới là số so sánh được** (công CPU thật). Tỉ lệ utime frame 0:
**10,075 / 0,855 = 11,8×**; whole-file: 9,910 / 0,915 = 10,8×.

**Bước 3 — Chromium VideoDecoder, xen kẽ A-B-A-B trong cùng session
(headed, cùng run với §2.1):**

| rep | crf3 (47,6 MiB) | crf0 (50,2 MiB) | tỉ lệ |
|---|---|---|---|
| 1 (loadavg 11,32 → 24,76) | 147.286 ms | 8.013 ms | 18,4× |
| 2 (loadavg 24,21 → 4,71) | 135.712 ms | 11.008 ms | 12,3× |

Cả 2 rep decode OK (`outcome: true`). E7 đo 67–103 s vs 4,4–6,4 s
(10–17×); lần này tuyệt đối cao hơn vì loadavg 11–25 (so E7 run 2:
loadavg 2,2). Đáng chú ý: rep 1 crf0 chạy lúc loadavg 24,76 vẫn chỉ
8,0 s trong khi crf3 lúc loadavg 11,32 mất 147,3 s — tải không giải
thích được khoảng cách.

**Giải thích (đã có bằng chứng):**

1. Tỉ lệ ~11–18× là **codec-level, không phải riêng Chromium**: ffmpeg
   CLI tái hiện 11,8× bằng utime (không dính tải, không dính Chromium).
2. Cơ chế: với `qpprime_y_zero_transform_bypass_flag=1`, decoder lossless
   **bỏ hẳn inverse transform + dequant** trên ~2,07 triệu block 4×4 luma
   (1920×1080 block/frame 8K) và đi đường residual trực tiếp; đường lossy
   phải CABAC-decode stream gần như ngẫu nhiên (entropy 8,000 bits/byte,
   0,37% byte zero) rồi inverse-transform/dequant từng block. Deblocking
   **không phải** nguyên nhân: skip_loop_filter chỉ đổi utime crf3
   10,075 → 10,258 s (+1,8%, nhiễu).
3. Vì sao Chromium wall tuyệt đối cao hơn ffmpeg utime ~7–10× ở **cả 2
   file** (crf3 136–147 s vs utime 10,1 s; crf0 8–11 s vs 0,86 s):
   VideoDecoder của Chromium chậm đều (build FFmpeg kèm Chromium khác
   build hệ thống — và/hoặc tải headed-run), không phải bệnh riêng crf3;
   vì chậm đều nên tỉ lệ được bảo toàn. Đây là suy luận từ tỉ lệ 2 phía,
   không phải đo trực tiếp CPU của Chromium — ghi rõ giới hạn.
4. **Chưa tách được:** trong 10,075 s utime của crf3, bao nhiêu là
   CABAC-bin-decode, bao nhiêu là inverse transform/dequant — không đo
   được bằng flag CLI (cần profile libavcodec, vd perf). Không suy đoán
   tỉ lệ trong đó (nợ §5.5).

## §3. Test + hồi quy

### 3.1 Suite mới F8 — 12/12 pass

`apps/web/src/lib/test_round78_f8_keyframe_protocol.test.ts` (12 test):
runTrialDecode + structured failure (verbatim / rỗng → decode-failed /
false → decode-failed / true + unsupported-config không đổi); worker probe
FakeWorker (reason → structured failure; + runTrialDecode tích hợp;
tương thích ngược không reason → false thường; reason bị bỏ qua khi
outcome true/unsupported-config; reason >200 cắt 200); T3 tích hợp
(probe inject trả structured failure → full-file /zero-run/ đúng offset);
(b) cap+1 có zero-run → gop-range, probe 0 lần, 1 request prefix.

### 3.2 Hồi quy GOP + trial-decode — 46/48 xanh hoàn toàn

Script `~/scratch-round78-f8/run-regression-f8.sh` (bản E7 + thêm F8).
Xanh: U2 20/20, T3 10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18,
B4 13/13, C5 11/11, Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6,
H4 8/8, I6 25/25, K8 18/18, reversePlayback 10/10, reversePreviewGate
12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23, M10 28/28,
N10 17/17, N6 32/32, Q5 15/15, R7 6/6, R4 19/19, R4b 13/13, R10 11/11,
S6 15/15, T6 9/9, U5 11/11, Y5run 6/6, Z5run 6/6, Y5fetch 3/3, Z5fetch
4/4, A7 18/18, F1 11/11, E7 24/24, F8 12/12.

Đỏ — **cả 2 đều là timing flake đã biết (P6 §4.1), không do code đợt
này** (đợt này không đụng timer/timeout nào; branch mới trong
`runTrialDecode` là đồng bộ, sau `Promise.race`, không thêm await):

- **O6 16/18** (regression) → 13/18 → 15/18 qua 3 lần chạy (dao động
  theo tải — E7 cũng thấy 16/18, 17/18, 18/18). Test đỏ đều là assertion
  cửa sổ thời gian (probe-true tức thì nhưng T3 mất 2172 ms; baseline
  tự đo 2698 ms thay vì ~200 ms kỳ vọng).
- **P6 15/16** (ổn định 2 lần chạy): test duy nhất đỏ là "12 MiB +
  probe treo → gop-range sau timeout 2500 ms" — thực tế chờ 6564 ms
  (timer bắn muộn vì event loop kẹt dưới tải; loadavg lúc chạy 10–23).
  P6 từng 16/16 ở E7 (lúc máy yên hơn).

### 3.3 tsc + vite + P7

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `vite build` apps/web: **pass** (1m 23s — chậm vì chạy chồng bench +
  tải nặng; chỉ cảnh báo chunk >500 kB có từ trước).
- P7 i18n audit: **8/8 pass** (dict 2419/2419, scan 524 literal trong
  36 file, 0 tồn đọng — không thêm literal tiếng Việt nào).

### 3.4 Bài học harness (ghi lại để đợt sau không lặp)

- **Chrome exit 21:** `TMPDIR` trỏ tới thư mục chưa tồn tại
  (`~/scratch-round78-f8/tmp`) → Chrome lỗi `Failed to create socket
  directory` (process_singleton_posix) và thoát 21. Lần đầu tưởng
  display/port xung đột (đổi :190→:191, 9418→9419, 8922→8924 đều vẫn
  lỗi); chạy tay với stderr mới thấy nguyên nhân thật. **Luật: harness
  phải `mkdir -p TMPDIR` trước khi launch Chrome.** Runner F8 đã vá:
  chờ socket X thật + chờ debug port thật (thay vì sleep cố định 2 s /
  5 s — dưới tải nặng Xvfb cũng cần >2 s mới sẵn).
- **ffmpeg bench v1/v3 hỏng:** v1 dùng `/usr/bin/time` (không có trên
  VM) + `-v error` (nuốt luôn dòng `bench:`); v3 đặt `-frames:v` trước
  `-i` (ffmpeg từ chối: output option đặt sai chỗ, rc=234). v4 sửa:
  `-frames:v` sau `-i`, `-threads`/`-skip_loop_filter` trước `-i`,
  bắt full stderr ra file, wall bằng python3. Chỉ số v2/v4 mới dùng được.
- **Firefox fetchTrack:** file có moov ở cuối (không faststart) thì
  prefix 512 KiB parse lỗi `không tìm thấy moov` — cần fallback fetch
  toàn bộ rồi parse (mẫu E7), kèm giữ lại partial result khi fatal.

## §4. File thay đổi (6 file, text-only, chưa push)

1. `apps/web/src/lib/gopTrialDecode55L8.ts` — `GopTrialDecodeProbeFailure`
   + mở rộng `GopTrialDecodeProbeOutcome` + branch structured failure
   trong `runTrialDecode`.
2. `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` — `reason?` trong
   `TrialDecodeWorkerResponse` + chuyển thành structured failure ở
   `createWorkerTrialDecodeProbe`.
3. `apps/web/src/lib/gopTrialDecodeWorker62R4.worker.ts` — post `reason`
   khi quét zero-run vi phạm.
4. `apps/web/src/lib/test_round78_f8_keyframe_protocol.test.ts` — mới,
   12 test (mục §3.1).
5. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho file test mới
   (theo mẫu E7).
6. `docs/PHASE9_ROUND78_F8_KEYFRAME_PROTOCOL_LIMITS.md` — file này.

Không sửa: `gopRangeFetch39T3.ts` (không cần — đã dùng `trial.reason`
nguyên văn), `vi/en.json`, `preview.tsx`, `PHASE9_GAP_ANALYSIS.md`.

## §5. Nợ mở / follow-up

1. **Worker decode-failed thật vẫn không có reason chi tiết.** Browser
   probe trong worker chỉ trả boolean; muốn mang detail (vd message lỗi
   VideoDecoder) phải đổi probe trả structured failure cho cả đường
   decode — đợt sau (không gấp: zero-run là lớp đã có lý do rõ ràng).
2. **O6/P6 timing flake vẫn còn** (không do đợt này; P6 §4.1 đã ghi) —
   cần chạy lại lúc máy yên hoặc nới cửa sổ thời gian của test.
3. **Safari thật vẫn chưa đo** (cần máy macOS/iOS thật); WebKitGTK
   không phải proxy cho Safari.
4. **Firefox decode chậm hơn Chromium ~12–39× (single-rep)** — cần đo
   lặp + warmup để tách warmup/tải khỏi chênh lệch thật; chưa kết luận
   Firefox yếu hơn về bản chất. Nếu Firefox thật sự chậm hơn nhiều ở
   keyframe lớn, trần timeout worker (công thức 1,2 ms/KiB, trần 90 s)
   hiệu chuẩn trên Chromium có thể không bao được Firefox — cần đo lại
   công thức trên Firefox trước khi đụng trần.
5. **(d) chưa tách CABAC vs inverse-transform** trong 10 s utime của
   crf3 — cần profile libavcodec (perf) hoặc build ffmpeg riêng với
   instrument; không ưu tiên (tỉ lệ đã giải thích được ở mức cơ chế).
6. **Cap 64 MiB** giữ nguyên — chưa có file thật sample 0 >64 MiB.
