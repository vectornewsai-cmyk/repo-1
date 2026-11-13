# Đợt 74 B4 — LIMITS: timeout cho mọi spawnSync trong render pipeline

Ngày: 09/11/2026. Luồng B4 — đóng nợ đợt 73 §4 mục 8.
Test: `server/render/src/test_round74_b4_render_timeout.js` — **66/66 pass**.
Hồi quy: A8 gpu-fallback **54/54**, S4 **18/18**, trfCache exit 0,
outputQA self-test **13/13**, self-test 5 module đã đụng đều pass,
`npm run test:unit` pass, tsc web **0**, tsc desktop **0**.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 1. Kết luận chính

**Nợ đã đóng: không còn đường nào trong render pipeline treo vô hạn.**
`render.js` bước encode ffmpeg giờ có timeout tỉ lệ với độ dài output
(120s + 60s/giây video); hết hạn → kill SIGKILL → `ETIMEDOUT` → rơi
vào đúng nhánh fallback GPU→CPU như fail thường (chứng minh S1: treo
1 lần → fallback → MP4 hợp lệ, exit 0). Mọi điểm spawn đồng bộ còn
thiếu khác (5 helper python3, vidstabdetect, probe -filters/-version,
ffprobe, fc-match, proxy encode, measureMotion) đều đã có timeout +
killSignal. Timeout có mã thoát riêng **3** để job cha/bridge/CLI
nhận diện được "chết vì timeout" (xem §3.3 — phát hiện khi test S1b).

## 2. Công thức timeout (mới, nguồn duy nhất: `server/render/src/timeouts.js`)

| Bước | Công thức mặc định | Ghi chú |
|---|---|---|
| Encode ffmpeg chính (bước 7) | `120.000 + D × 60.000` ms (D = thời lượng output, giây) | §2.1 |
| Retry re-exec render.js | encode timeout + 300.000 ms biên | §2.2 |
| Helper python3 (measure/render_text_png/mask_png) | 60.000 ms | rơi về fallback cũ |
| Helper mask_anim | `60.000 + clip.duration × 10.000` ms | vẽ từng frame |
| vidstabdetect | `60.000 + đoạn × 10.000` ms | fail-fast exit 1 |
| Probe nhanh (-filters, -version, fc-match) | 15.000 ms | khớp gpuencode tryEncode |
| ffprobe probe media | 30.000 ms | chỉ đọc header |
| Proxy encode | cùng công thức encode theo độ dài nguồn | qua run() |
| fastMotion measureMotion | 300.000 ms | chỉ test dùng phía server |
| outputQA self-test (tạo media) | 120.000 ms | code test, không phải production |

Cấu hình: `--ffmpeg-timeout <giây>` (5..86400, render.js) + env
`VCUT_ENCODE_TIMEOUT_MS` (tuyệt đối), `VCUT_ENCODE_TIMEOUT_FACTOR`
(giây wall/giây output), `VCUT_ENCODE_TIMEOUT_BASE_MS`,
`VCUT_RETRY_TIMEOUT_MS`, `VCUT_HELPER_TIMEOUT_MS`,
`VCUT_DETECT_TIMEOUT_MS`, `VCUT_PROBE_TIMEOUT_MS`,
`VCUT_FFPROBE_TIMEOUT_MS`, `VCUT_MEASURE_TIMEOUT_MS`. Env không hợp
lệ (không phải số, < 1000ms) → rơi về mặc định, không crash
(kiểm chứng U8–U10).

### 2.1 Vì sao hệ số là 60s/giây, không phải đề xuất "1× thời lượng + đệm" của A8

Đề xuất của A8 quá chặt so với số đo thật trên VM này
(benchmarks/RESULTS.md): 4K 10s tốn **110,5s wall = 11,05s/giây
output** (veryfast/23), 1080p preset mặc định medium/20 tốn 47,9s
cho 10s (4,79s/giây). Hệ số 60 cho ~5,4× biên trên nền 4K đo được
+ 120s cố định cho khởi động/graph/probe — đủ chỗ cho filter nặng
(hqdn3d, vidstabtransform, minterpolate slow-mo). Render nào chậm
hơn thì fail rõ (exit 3 + log timeout + cách nâng hạn) thay vì treo
vô hạn; user nâng bằng `--ffmpeg-timeout` hoặc env.

### 2.2 Vì sao killSignal là SIGKILL, không phải SIGTERM mặc định

SIGTERM có thể bị tiến trình treo bỏ qua (vd lời gọi driver GPU
kẹt); SIGKILL đảm bảo tiến trình chết và fallback kích hoạt.
Ngoại lệ: tiến trình ở **D-state** (uninterruptible sleep trong
kernel/driver) thì KHÔNG signal nào giết được — timeout khi đó vẫn
trả về sau khi Node chờ, và tiến trình mồ côi D-state phải được ghi
nhận (không có cách giết từ userspace). Chưa gặp D-state trong test.

## 3. Bằng chứng — test 66/66 (run cuối, loadavg lúc bắt đầu 14,24)

| Kịch bản | Kết quả đo |
|---|---|
| U1–U21 công thức (đơn vị, không render) | 21/21: encode 0s→120s, 2s→240s, 10s→720s, 60s→3720s; override CLI/env thắng; env sai → mặc định; helper 60s/160s; detect 110s; retry 540s; probe 15s; ffprobe 30s; measure 300s; isTimeoutResult đúng/sai; KILL_SIGNAL=SIGKILL |
| S1 ffmpeg treo 1 lần, nvenc, timeout 5s | exit 0, MP4 h264 640×360 2s hợp lệ; log "treo quá timeout 5s" + "thử lại bằng libx264" + "fallback libx264 thành công"; đúng 1 retry; wall **12,7s** (5s timeout + retry); 0 mồ côi (pgrep "sleep 179" + wrapper) |
| S1b treo CẢ 2 lần (nvenc + libx264 retry) | exit **3** (= timeout); log "lần retry libx264 cũng treo quá timeout" + "hạn encode của lần retry: 5s"; wall **14,0s** (~5s + ~5s — con dùng mặc định 240s thì sẽ ~245s, chứng minh override truyền xuống tiến trình retry); 0 mồ côi |
| S2 ffmpeg luôn treo, libx264, timeout 5s | exit **3**; log "treo quá timeout" + gợi ý "--ffmpeg-timeout"; KHÔNG retry (đúng thiết kế); wall **8,5s**; 0 mồ côi |
| S3 render thường (mặc định + cờ) | exit 0, MP4 hợp lệ; log "timeout encode: 240s" (mặc định) và "timeout encode: 600s" + "ghi đè --ffmpeg-timeout" (cờ); render 2s xong trong 4,3s — timeout không cắt render thật |
| S4 python3 treo (render_text_png), timeout 3s | exit 0, MP4 hợp lệ; log fallback drawtext + ETIMEDOUT; wall **7,8s**; 0 mồ côi ("sleep 173") |
| S5 vidstabdetect treo, timeout 5s | exit **1** (fail-fast); log "vidstabdetect treo quá timeout 5s"; wall **7,4s**; 0 mồ côi ("sleep 181") |

Số wall các run trước tương tự (S1 9,6/11,4s; S2 6,5/9,2s; S4 9,4/9,1s;
S5 7,3/9,3s) — dao động theo tải VM (các luồng đợt 74 chạy song song),
không theo timeout (timeout nào cũng đúng ~hạn đặt, sai số do tải).

## 4. Thay đổi code (11 file, xem batch stage)

- **Mới `server/render/src/timeouts.js`** — nguồn duy nhất của mọi con
  số timeout + `KILL_SIGNAL` + `isTimeoutResult` (nhận diện
  `r.error.code === "ETIMEDOUT"`).
- **`server/render/src/render.js`** — encode bước 7: `timeout:
  encodeTimeoutMs(D, args.ffmpegTimeoutMs)` + `killSignal: SIGKILL` +
  log "timeout encode: Xs"; retry re-exec: `timeout: retryTimeoutMs(D)`;
  5 helper python3 có timeout; failDetail phân biệt timeout với
  SIGSEGV/SIGKILL/thoát mã; thông điệp lỗi cuối có 3 dạng theo đúng
  trường hợp (§3.3); cờ mới `--ffmpeg-timeout <giây>` (5..86400, truyền
  xuống retry qua argv); mã thoát timeout riêng **3** (`EXIT_TIMEOUT`,
  help đã cập nhật).
- **`server/render/src/validate.js`** — ffprobe `probeFile` timeout
  30s (treo → lỗi validation, exit 1); `fc-match` `resolveFontFile`
  timeout 15s (treo → thử candidate tiếp theo).
- **`server/render/src/enhance.js`** — `runStabilizeDetect` timeout
  theo độ dài đoạn (treo → `{ok:false}` với thông điệp timeout →
  fail-fast exit 1); `probeFilterSupport` timeout 15s + thêm trường
  `timedOut` (render.js báo đúng "probe treo" thay vì nhầm "thiếu filter").
- **`server/render/src/trfCache.js`** — `ffmpegVersionLine` timeout 15s
  (treo → "" như khi không chạy được).
- **`server/render/src/proxy.js`** — `run()` mặc định timeout ffprobe
  30s; encode proxy timeout theo độ dài nguồn (cùng công thức encode).
- **`server/render/src/fastMotion.js`** — `measureMotion` timeout 300s.
- **`server/render/src/gpuencode.js`** — `tryEncode` thêm
  `killSignal: SIGKILL` (timeout 15000 đã có từ đợt 64).
- **`server/bridge/src/outputQA.js`** — self-test tạo media thêm
  timeout 120s (đường production `probeFile` đã có timeout 15000 từ trước).
- **Mới `server/render/src/test_round74_b4_render_timeout.js`** — 66 check.

## 5. Phát hiện phụ trong lúc làm (đều đã xử lý hoặc ghi rõ)

### 5.1 [ĐÃ SỬA TRONG LUỒNG] Edit nuốt mất dòng `if` ở nhánh mask_anim

Lúc thêm timeout cho `mask_anim.py`, edit đã vô tình xoá dòng
`if (pr.error || pr.status !== 0) {` + nửa đầu `console.error` —
phát hiện khi đọc lại vùng vừa sửa trước khi chạy test (file sẽ lỗi
cú pháp/logic). Đã khôi phục ngay + `node --check` pass. Bài học:
sau mỗi edit phải đọc lại đúng vùng đó, không chỉ chạy test.

### 5.2 [ĐÃ SỬA TRONG LUỒNG] `validate.js` còn sót `fc-match` không timeout

Rà lần 2 phát hiện `resolveFontFile` dùng `execFileSync("fc-match")`
không timeout (lần rà đầu chỉ thấy `probeFile`). Đã thêm timeout 15s.
`proxy.js` import `spawnSync` nhưng không dùng (có từ trước) — để
nguyên, không dọn trong luồng này.

### 5.3 [ĐÃ SỬA TRONG LUỒNG] Job cha không biết lần retry chết vì timeout

Tiến trình retry tự timeout thì thoát mã 2 như mọi lỗi render khác;
spawnSync của cha chỉ thấy `status=2, r.error=null` nên thông điệp
cuối của cha in sai số (hạn chờ retry 305s thay vì hạn encode 5s của
con) — test S1b bắt được (2 check fail). Đã sửa bằng **mã thoát
riêng 3 cho timeout** (`EXIT_TIMEOUT`): con tự timeout → thoát 3 →
cha nhận diện qua `r.status === 3` và in đúng hạn encode của con;
cha kill con vì quá hạn chờ → `r.error` ETIMEDOUT → in đúng hạn chờ.
CLI (`WORKER_EXIT` chung) và bridge (`status !== 0`) không switch
theo đúng mã 2 nên an toàn. S1b sau sửa: 66/66.

### 5.4 [BẪY TEST — đã sửa trong test] stdout của tiến trình retry bị ignore

`render.js` spawn retry với stdio `["ignore", "ignore", ...]` cho
stdout (hành vi cũ) nên mọi `log()` của con đều mất, chỉ stderr của
con mới tới log job. Assertion đầu đếm dòng "timeout encode: 5s" ×2
đã fail đúng vì lý do này — không phải lỗi production. Đã thay bằng
kịch bản S1b (treo cả 2 lần, wall ~14s chứng minh override tới được
con) + ghi chú trong test. Đừng đếm log `log()` của tiến trình retry.

## 6. Phạm vi CHƯA kiểm chứng / nợ mở

1. **Bridge `spawnJob` không có watchdog riêng** (async `spawn`,
   không có option timeout như spawnSync; `jobQueue.js` không có
   timeout job). Sau đợt này job render luôn tự kết thúc nhờ timeout
   trong worker nên bridge không còn treo vô hạn theo — nhưng nếu
   worker treo ở chỗ timeout chưa phủ (vd D-state, xem §2.2) thì job
   bridge vẫn treo. Watchdog ở tầng bridge là defense-in-depth, để
   đợt sau (cần đọc spec để tính timeout theo độ dài — không làm
   ẩu trong luồng này).
2. **CLI `vcut render` timeout 30 phút CỐ ĐỊNH** (cả 2 đường
   streamed/quiet, `cli/src/commands/render.ts` `WORKER_TIMEOUT_MS`):
   project 4K dài hợp lệ có thể bị cắt ở 30 phút dù worker cho phép
   lâu hơn (công thức theo độ dài). Nợ riêng của CLI, không đụng ở đây.
3. **`beats.js` / `bgremove.js` (bridge)** spawn python AI service
   có timeout riêng theo config (`timeoutMs`, đã kiểm tra — không phải
   nợ); `caption.js` cũng đã có timeout. Không đụng.
4. **Chưa đo timeout trên render thật dài/nặng**: công thức 60s/giây
   dựa trên benchmark 4K 10s (11,05s/giây) + biên 5,4×, chưa đo render
   4K dài + slow-mo minterpolate + denoise cùng lúc (trường hợp chậm
   nhất có thể). Nếu render hợp lệ nào bị cắt ở 60s/giây thì đó là
   bằng chứng để nâng hệ số — log timeout ghi rõ số giây nên dễ thấy.
5. **Tiến trình D-state** (xem §2.2): không có cách giết từ userspace;
   nếu gặp phải thì job vẫn treo ở tầng Node (spawnSync chờ) — chưa
   gặp trong test, chỉ ghi nhận giới hạn.
6. **Không chạy lại click-test headed / harness đo nặng** — đợt này
   chỉ đụng render worker + module phụ, không đụng UI.

## 7. Kiểm chứng đã chạy (09/11/2026, VM tải cao do các luồng đợt 74 song song)

- `node server/render/src/test_round74_b4_render_timeout.js` —
  **66/66 pass** (run cuối; 2 run trước 56/57 và 64/66 — đều là lỗi
  test/thông điệp đã sửa trong luồng, xem §5.3/§5.4 — không phải lỗi
  production sót).
- `node server/render/src/test_round73_a8_gpu_fallback.js` — **54/54 pass**,
  exit 0 (hồi quy A8).
- `node server/render/src/test_round65_s4_gpu_fallback.js` — **18/18 pass**,
  exit 0 (hồi quy S4).
- `node server/render/src/test_round62_r2_trf_cache.js` — **exit 0**
  (fail > 0 thì exit 1 nên exit 0 = pass hết; dòng tổng không lưu lại
  do `tail -3` — lần chạy này tốn ~380s vì VM tải cao).
- Self-test module đã đụng: `enhance.js` pass, `proxy.js` **11/11**,
  `gpuencode.js` pass, `trfCache.js` pass, `fastMotion.js` PASS.
- `node server/bridge/src/outputQA.js --self-test` — **13/13 pass**.
- `npm run test:unit` — pass (exit 0).
- `npx tsc --noEmit` (apps/web) — **0 lỗi**; (apps/desktop) — **0 lỗi**.
- `node --check` cho cả 9 file JS đã đụng + test mới — pass.

## 8. File đổi/thêm (stage, KHÔNG push)

- `server/render/src/timeouts.js` (mới)
- `server/render/src/render.js`
- `server/render/src/validate.js`
- `server/render/src/enhance.js`
- `server/render/src/trfCache.js`
- `server/render/src/proxy.js`
- `server/render/src/fastMotion.js`
- `server/render/src/gpuencode.js`
- `server/bridge/src/outputQA.js`
- `server/render/src/test_round74_b4_render_timeout.js` (mới)
- `docs/PHASE9_ROUND74_B4_RENDER_TIMEOUT_LIMITS.md` (mới, file này)
