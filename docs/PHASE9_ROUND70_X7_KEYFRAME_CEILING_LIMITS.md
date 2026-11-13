# Phase 9 đợt 70 — X7: trần keyframe 90 s vs tải nặng ngoại suy 105–137 s + đo WebKit lần đầu

Ngày đo: 2026-11-09 (00:00–00:30 UTC; 07:00–07:30 +07). Máy đo: VM Linux 2 vCPU / 8 GB (chia sẻ 1,5 CPU), không GPU.
Đóng nợ `docs/PHASE9_ROUND69_W2_KEYFRAME_TOAST_LIMITS.md` §4 mục 7 (trần 90 s vs tải nặng ngoại suy 105–137 s; Safari chưa đo).
Fixture: `bigkey-64mib.mp4` tái dùng từ đợt 67 (sample0 đúng 67.108.864 B = 64,0 MiB, High-profile 8192x4320, `avc1.64003C`).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Ngoại suy tải nặng 105–137 s (đợt 62/63) ĐÃ ĐƯỢC XÁC NHẬN BẰNG ĐO TRỰC TIẾP:** decode trực tiếp (không trần) 64,0 MiB dưới tải nặng duy trì cho **103,5 s / 118,4 s / 124,4 s** — 3/7 rep tải nặng vượt timeout công thức 78.536 ms; thêm 1 rep 78,6 s (trượt trần đúng 87 ms).
2. **QUYẾT ĐỊNH: GIỮ NGUYÊN công thức 1,2 ms/KiB + trần 90 s — KHÔNG đổi code.** Lý do chính: (a) **trần 90 s không bao giờ là ràng buộc** — công thức tối đa ở cap 64 MiB là 78.536 ms < 90 s với MỌI sample trong dải, nên "nâng trần lên 150 s" một mình không thay đổi bất kỳ timeout nào; chỉ tăng TỈ LỆ (1,2 → ~2,0 ms/KiB) mới bao được 105–137 s; (b) tăng tỉ lệ làm file mở chậm thêm tới ~52 s đúng trong điều kiện tệ nhất, để đổi lấy chế độ gop-range cho file keyframe ≥50 MiB vốn cực hiếm — trong khi fail-open vẫn mở được file bình thường (local: full-file fetch từ đĩa nhanh, chi phí ≈ 0). Đây là xác nhận bằng số đo cho việc U5 đã loại phương án (C) tăng tỉ lệ.
3. **Tải nặng ỔN ĐỊNH (4 hog + 1/2 encode) vẫn nằm trong trần:** 44,4–60,6 s (biên 18–34 s dưới 78,5 s). Chỉ tải CỰC nặng (6 hog + 2 encode + luồng đợt 70 khác tranh CPU) mới vượt — đó là điều kiện benchmark tổng hợp, không phải máy user bình thường.
4. **WebKit ĐO ĐƯỢC LẦN ĐẦU (Playwright webkit-2388, WebKit 27.2):** VideoDecoder có ở cả main thread lẫn DedicatedWorker; sau khi cài plugin decoder GStreamer, decode 64,0 MiB thật qua worker hết **21,5 s** (0,328 ms/KiB — nhanh hơn Chromium 32,7–38,0 s cùng fixture lúc yên), fallback no-vd chạy đúng. **Safari thật vẫn chưa đo được** (cần máy macOS/iOS thật) — WebKitGTK ≠ Safari.
5. Hồi quy keyframe xanh hết (62R4 19/19, 63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, 67U5 11/11, capThumb 2/2); tsc web 0 lỗi. Không có code sản phẩm đổi trong luồng này (quyết định giữ trần là có chủ ý, dựa trên số đo — xem §2).

## 1. Đo trực tiếp decode 64,0 MiB ở nhiều mức tải (Chromium headed)

Harness mới `~/scratch-round70-x7/vdHeaded70X7.ts` + `runHeaded70X7.mjs` (sao từ đợt 67, rút gọn: chỉ direct RTD qua worker probe, không trần, watchdog 300 s/rep; sample fetch 1 lần rồi tái dùng). Kết quả `result-70x7.json` (log `headed-70x7.log`).

### 1.1 Số đo đầy đủ

| Phase | Tải | Rep | Thời gian | ms/KiB | Ghi chú loadavg |
|---|---|---|---|---|---|
| A tải thấp | 0 hog | 0 | **32,7 s** | 0,499 | 1-phút 2,19 → 1,41 |
| A tải thấp | 0 hog | 1 | **38,0 s** | 0,580 | 1,41 → 0,77 |
| B nặng 1 | 4 hog + 1 enc | 0 | **118,4 s** | 1,807 | 0,71 → 11,41 (đang tăng; chồng apt install — xem §1.2) |
| B nặng 1 | 4 hog + 1 enc | 1 | **56,6 s** | 0,864 | 11,41 → 11,47 (ổn định) |
| C nặng 2 | 4 hog + 2 enc | 0 | **60,6 s** | 0,925 | 11,67 → 12,25 |
| C nặng 2 | 4 hog + 2 enc | 1 | **44,4 s** | 0,678 | 12,25 → 6,81 |
| D cực nặng | 6 hog + 2 enc | 0 | **124,4 s** | 1,898 | 6,42 → 1,06 (sụp giữa chừng — xem §1.3) |

cpuCalib: 4.908,5 ms đầu → 4.917,9 ms cuối (ổn định). Watchdog renderer: 0 lỗi heartbeat. Không treo (khác lần 1 đợt 66).

### 1.2 B0 118,4 s — nhiễu bởi apt install

Rep B0 chạy ~23:57–23:59 UTC, đúng lúc `apt-get install` (cài lib WebKit, §3) đang giải nén gói (tiến trình apt chạy 23:48–23:59). Disk I/O + CPU của dpkg chồng lên decode. Không dùng B0 một mình để kết luận; nhưng rerun D0 (§1.4) tái hiện >100 s KHÔNG có apt, nên hiện tượng vượt trần là thật.

### 1.3 D0 124,4 s — loadavg sụp giữa chừng, đã giải thích được (bài học đo)

Loadavg 1-phút rơi 6,42 → 1,06 trong lúc decode 124 s, dù 6 hog + 2 encode vẫn chạy. Kiểm chứng sau đó bằng `ps`: các hog còn sống, mỗi hog chỉ được ~10–16% một CPU. Nguyên nhân: **VM bị giới hạn CPU theo cgroup (1,5 CPU chia sẻ) — task bị throttle không còn nằm trong runqueue nên loadavg KHÔNG đếm chúng.** Loadavg trên VM này ĐÁNH GIÁ THẤP mức bão hòa CPU thật khi throttle nặng. Hệ quả cho mọi harness sau: đừng chỉ tin loadavg 1-phút; ghi kèm `ps` (số tiến trình hog còn sống + %CPU) hoặc cpuCalib. Không có dòng OOM trong dmesg/journal (journal kernel trống trong container) — không kết luận OOM; giả thuyết throttle đã đủ giải thích số liệu.
Biên tải thấp cập nhật: 78.536 − 50,3 (chậm nhất từng đo lúc yên, đợt 66) = **28,2 s** (không đổi — rep chậm nhất đợt này lúc yên là 38,0 s, biên 40,5 s).

### 1.4 Probe tái kiểm (rerun): tải nặng duy trì + lấy mẫu loadavg mỗi 5 s trong lúc decode

Harness `vdHeaded70X7b.ts` + `runHeaded70X7b.mjs` (chờ tải ổn định 15 s trước mỗi phase; sampler ghi loadavg mỗi 5 s TRONG LÚC decode). Kết quả `result-70x7b.json`:

| Phase | Rep | Thời gian | ms/KiB | Diễn biến tải trong lúc decode |
|---|---|---|---|---|
| D 6 hog + 2 enc | 0 | **103,5 s** | 1,580 | 1-phút decay đều 2,40 → 0,78 (throttle — hogs còn sống, đã kiểm bằng ps) |
| D 6 hog + 2 enc | 1 | **74,2 s** | 1,132 | 0,72 → 0,40 (throttle) |
| B 4 hog + 1 enc | 0 | **78,6 s** | 1,200 | 0,2–0,3 trong 45 s đầu, rồi tăng vọt → 5,76 cuối (luồng khác bắt đầu làm nặng giữa chừng) |

**Kết luận tái kiểm:** vượt trần 78,5 s tái hiện được dưới tải cực nặng duy trì (103,5 s, không còn apt); rep B 78,6 s trượt trần đúng 87 ms khi tải môi trường tăng giữa chừng. Ngoại suy 105–137 s của đợt 62/63 là đúng khoảng.

## 2. Quyết định trần: GIỮ NGUYÊN (không đổi code) — phân tích

### 2.1 Đính chính tiền đề: trần không phải ràng buộc đang cắt

Công thức `trialDecodeTimeoutForSampleSizeWorker`: 200 + ceil((bytes − 256 KiB)/1024 × 1,2 ms/KiB), min với `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` = 90 s.
Ở cap 64 MiB: 78.536 ms. Với MỌI sample ≤ 64 MiB (cap của T3), công thức ≤ 78.536 ms < 90.000 ms — trần KHÔNG BAO GIỜ chạm. **Nâng trần 90 s → 150 s một mình không đổi bất kỳ timeout nào** (kiểm chứng bằng node: `trialDecodeTimeoutForSampleSizeWorker(67108864)` = 78536 ms với cả hai trần). Muốn bao 105–137 s phải tăng TỈ LỆ: 1,5 ms/KiB → 98.120 ms; 2,0 ms/KiB → 130.760 ms (và trần phải ≥ 131 s). Đề xuất "nâng trần (ví dụ 150 s)" trong nhiệm vụ vì vậy là chưa đủ — cần tăng tỉ lệ mới có tác dụng.

### 2.2 Vì sao không tăng tỉ lệ (quyết định giữ)

| Yếu tố | Số đo / lập luận |
|---|---|
| Lợi ích | Chỉ cứu file keyframe 50–64 MiB (cực hiếm — U5) khỏi fail-open, VÀ CHỈ khi máy đang bão hòa cực nặng. Ở tải ổn định 4 hog + 1/2 enc, decode 44–61 s đã nằm trong 78,5 s (biên 18–34 s); lúc yên 33–50 s (biên 28–45 s). |
| Chi phí | Timeout tối đa ở 64 MiB tăng 78,5 s → ~131 s: file mở chậm thêm tới ~52 s đúng lúc máy đã chậm, trước khi fail-open. Cả sample vừa cũng phình theo (30 MB: 36 s → 60 s) — đúng lý do U5 đã loại phương án (C). |
| Fail-open có hại không? | Không đáng kể với file local: file vẫn mở bình thường ở chế độ full-file; fetch toàn bộ 70 MB từ đĩa local nhanh (~1 s), gop-range tiết kiệm được rất ít. Fail-open là hành vi thiết kế cho tải cực nặng, không phải lỗi. |
| Điều kiện đo | Tải cực nặng ở đây là tổng hợp (6 hog + 2 encode 8K + các luồng đợt 70 khác trên 1,5 CPU chia sẻ) — vượt xa máy user bình thường (4–8 nhân, không hog). Trên máy user, decode 64 MiB thực tế 33–50 s. |

**Vì vậy: giữ 1,2 ms/KiB + trần 90 s. Không sửa `gopTrialDecodeWorker62R4.ts`, không sửa test khóa trần, không đổi chuỗi i18n** (chuỗi toast dùng template `{timeout}` nên không hardcode số — W2 đã xác minh).

### 2.3 Phương án toast theo tiến độ thay trần cứng — XÉT VÀ TẠM GÁC

- Một keyframe = MỘT lần `VideoDecoder.decode()` duy nhất → không có tiến độ từng phần để báo cáo. Toast "đang kiểm tra…" theo thời gian chỉ là trạng thái chờ, không phải tiến độ thật.
- Cần thêm plumbing mới trong controller (trạng thái "trial đang chạy lâu") cho một bước kiểm tra nền thường xong trong <60 s; toast timeout đã bắn đúng khi trial thực sự timeout (W2: N +95–97 s, appearances = 1).
- Ghi vào nợ đợt sau nếu muốn làm: toast trạng thái khi trial vượt ~30 s (không chặn, không đổi trần). Không triển khai trong luồng này vì số đo không cho thấy khoảng trống UX (user đã thấy trạng thái loading khi mở file; fail-open vẫn mở được file).

## 3. WebKit — ĐO ĐƯỢC LẦN ĐẦU (Playwright webkit-2388, WebKit 27.2)

Môi trường: cài Playwright webkit (`node node_modules/playwright-core/cli.js install webkit`, 101,2 MiB) + `apt-get install` các lib hệ thống còn thiếu (libgtk-4, libgraphene, libgstreamer, libevent, libavif, libmanette, libenchant, libsecret, libgles2) — VM này chạy root nên apt được; đã ghi vào §5. Probe `vdWebkit70X7.ts` + `runWebkit70X7.mjs` (mẫu Firefox đợt 63), kết quả `result-webkit-70x7.json` (lần 2; lần 1 xem §3.1).

### 3.1 Lần 1: "unsupported-config" cho mọi codec — lỗi môi trường, không phải WebKit

- VideoDecoder: `function` ở page + worker; `isConfigSupported`: `function` cả hai nơi. UA: `Version/27.2 Safari/605.1.15` (Playwright WebKit giả UA Safari).
- Nhưng W1/W3/W4 đều `unsupported-config` (W4: skipped=true, 221 ms, fail-open đúng). Ma trận `isConfigSupported` cho thấy `supported: false` với MỌI codec — H.264 Baseline/Main/High, VP9, AV1, cả AAC. Nguyên nhân: WebKitGTK decode qua GStreamer, mà VM chưa có plugin decoder nào (`gst-inspect-1.0` không có).
- Sửa: `apt-get install gstreamer1.0-libav gstreamer1.0-plugins-good/bad/ugly libopenh264-7` → ma trận lật toàn bộ sang `supported: true`.

### 3.2 Lần 2 (sau khi cài plugin): decode thật, 64,0 MiB hết 21,5 s

| Bước | Kết quả (loadavg 1-phút ~2,1) |
|---|---|
| W0 VideoDecoder page + worker | `function` / `function`, `isConfigSupported` = `function` |
| W1 worker probe small (29.245 B) | **true**, 208 ms |
| W2 worker-no-vd → fallback main-thread | **true**, 59 ms, `fallbackCalls = 1` — fallback chạy thật trên WebKit |
| W3 main-thread probe 4,1 MB | **true**, 585 ms |
| W4 worker probe 64,0 MiB (timeout 78.536 ms) | **decode-ok, passed=true, 21.494 ms (0,328 ms/KiB)** — nhanh hơn Chromium 32,7–38,0 s cùng fixture lúc yên (decoder khác nhau: GStreamer/libav vs FFmpeg của Chromium; tải không hoàn toàn giống nhau nên không kết luận head-to-head) |

**Kết luận WebKit:** đường trial-decode (worker probe + fallback + main-thread) hoạt động đầy đủ trên WebKit; công thức hiện tại bao được WebKit thoải mái (21,5 s << 78,5 s). **Safari thật (macOS/iOS, VideoToolbox) VẪN CHƯA ĐO ĐƯỢC — cần máy macOS/iOS thật.** Playwright WebKit là WebKitGTK + GStreamer, không phải Safari; số này chỉ là điểm dữ liệu WebKit, không suy ra Safari.

## 4. Kiểm chứng hồi quy (không đổi code — chứng nhận cây vẫn xanh)

- Suite keyframe (reg đợt 68): 62R4 **19/19**, 63R4 **13/13**, 64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11**, capThumb **2/2**.
- `tsc --noEmit` apps/web: **0 lỗi**. Không build lại vite (không có code đổi; dist không chạm).
- Probe headed Chromium: 0 lỗi heartbeat watchdog cả hai lần chạy; không treo lại (probe chính là lần chạy sạch thứ 3 liên tiếp với cùng fixture + tải nặng sau lần 2 đợt 66 và đợt 67; probe tái kiểm là lần sạch thứ 4).

## 5. Nợ / giới hạn còn lại

- **Safari thật vẫn chưa đo được** — cần máy macOS/iOS thật (VideoToolbox). WebKitGTK lần này chỉ là proxy gần nhất.
- Trần worker 90 s / tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN theo quyết định §2: tải cực nặng (6 hog + 2 enc + luồng khác) vẫn fail-open theo thiết kế; file vẫn mở được.
- **Bài học đo (mới): loadavg 1-phút đánh giá thấp bão hòa CPU trên VM này** khi cgroup throttle (task bị throttle không đếm vào runqueue). Harness sau nên ghi kèm số tiến trình hog sống + %CPU (`ps`) hoặc cpuCalib bên cạnh loadavg.
- Toast trạng thái khi trial chạy lâu (~30 s+) chưa làm — cần đợt riêng đánh giá (xem §2.3); không có tiến độ thật cho 1 keyframe.
- `~/workspace/repo-1` hiện KHÔNG có thư mục `.git` (kiểm tra 09/11: `git status` báo "not a git repository") — staging của luồng này chỉ là file paths (không bị ảnh hưởng), nhưng parent cần biết khi push sau.
- Thay đổi hệ thống ngoài repo trong lượt này (để WebKit chạy được — không thuộc batch): Playwright webkit-2388 đã tải về `~/.cache/ms-playwright/webkit-2388/`; apt đã cài libgtk-4/libgraphene/libgstreamer*/libavif/libmanette/libenchant/libsecret/libgles2 + gstreamer1.0-libav/plugins-good/bad/ugly + libopenh264-7. VM reboot ~23:30 UTC 08/11 giữa lượt W2 (ghi trong log W2) không ảnh hưởng lượt này (probe chạy sau reboot).
- Harness/probe/log click-test ở `~/scratch-round70-x7/` (ngoài repo, theo mẫu scratch — không đưa vào batch): `vdHeaded70X7.ts`, `runHeaded70X7.mjs`, `result-70x7.json`, `headed-70x7.log`, `vdHeaded70X7b.ts`, `runHeaded70X7b.mjs`, `result-70x7b.json`, `headed-70x7b.log`, `vdWebkit70X7.ts`, `runWebkit70X7.mjs`, `result-webkit-70x7.json`, `webkit-70x7.log`, `webkit-70x7-run2.log`, `webkit-sanity70X7.mjs`, `webkit-codecs70X7.mjs`, `webkit-install.log`.

## 6. File stage (KHÔNG push)

- `docs/PHASE9_ROUND70_X7_KEYFRAME_CEILING_LIMITS.md` (file này — deliverable duy nhất của luồng trong repo; không có code sản phẩm đổi, theo quyết định §2).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x7.md`.
- Harness/probe ở `~/scratch-round70-x7/` (ngoài repo — không đưa vào batch).
