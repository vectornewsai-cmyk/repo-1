# Phase 9 đợt 84 — L10: WebKit loop — kiểm chứng ĐẦY ĐỦ workaround W1

Ngày: 11/11/2026, lượt cron 03:35 +07 (chạy 03:44–05:06 +07).
Repo `~/workspace/repo-1`. Đóng nợ đợt 80 §4.5 / đợt 81 I7
("W1 đầy đủ không chứng minh được trên VM" — I7 §7.1 + đợt 81 §4.7).

**Kết luận ngắn — W1 ĐÃ CHỨNG MINH ĐƯỢC ĐẦY ĐỦ trên WebKitGTK headed
(nợ I7 đóng):**
1. **Workaround `ended → seek(0) + play()` loop 10/10 vòng trên cả 6 clip**
   (H.264 2 s / 3 s / 4 s 720p / 10 s, VP9 2 s, 10 s CÓ audio) trên
   WebKitGTK headed — 0 vòng kẹt, 0 stall > 1,5 s. Độ trễ resume sau
   mỗi lần `ended`: trung vị **0,57–2,34 s** theo clip (đối chứng
   Chromium: 0,12–0,29 s — WebKitGTK chậm hơn ~5–10×, nhưng không kẹt).
   Clip 720p (D) trước đây không ổn định (H5 §1.4) nay loop 10/10.
2. **Đường nối production ĐÃ CHỨNG MINH bằng counter riêng** (thay đổi
   nhỏ đợt này, xem §4): ép `ended` 3 lần liên tiếp trong app thật,
   `__vcutSyncRestartEndedVideo` tăng đúng +1 mỗi lần, `currentTime`
   hạ cánh đúng target timeline, phát tiếp tục bình thường — **3/3 PASS
   trên cả WebKitGTK lẫn Chromium**. Một lần restart TỰ NHIÊN cũng bắt
   được trong lúc phát 30 s trên WebKitGTK (W2): element chạy tới cuối
   nguồn trong khi playhead còn ở 19,6 (playhead chậm hơn wall-clock
   dưới tải) và restart cứu đúng lúc.
3. **Trường hợp biên đều PASS trên WebKitGTK:** seek giữa vòng loop,
   pause/resume giữa loop, dừng ở cuối (không restart giả sau khi dừng),
   clip 4 s = cuối timeline (restart không tăng thêm sau khi hết).
4. **MediaRecorder VẪN VẮNG trên WebKitGTK 27.2** (xác nhận lần 5) —
   hệ quả: sinh video mẫu template-pack lỗi rõ ràng (không giả video
   bằng ảnh tĩnh), xem §7.
5. **Phát hiện mới W7 (§5):** đúng +1 lần restart DƯ sau mỗi tương tác
   test (gỡ ghi đè `ended` / reset playhead về 0), cả 2 engine; đã cô
   lập được (không tự phát trong lúc phát thường — 20 s ổn định, 0 lần
   tăng thêm), tác động lành (seek về đúng target, không sai frame,
   không lặp vô hạn), cơ chế kích hoạt ở mức tick CHƯA xác định được.
   Không sửa production vì chưa có bằng chứng thắng — ghi bound + hướng
   điều tra.
6. **W6 đo thêm (§6):** seek trên WebKitGTK đóng băng `currentTime`
   5–9 s mỗi lần dưới tải (element chỉ phát ~0,5–1 s rồi lại seek),
   nhưng vòng loop vẫn hoàn thành 10/10 vì workaround không phụ thuộc
   vào seek nhanh.

**Không sửa production ngoài bộ đếm riêng (§4).** Không push, không
release/tag, không binary, không workflow. WebKitGTK ≠ Safari thật —
mọi kết luận WebKit dưới đây vẫn là WebKitGTK.

## 0. Máy đo lúc này (11/11/2026)

| Mục | Giá trị |
|---|---|
| CPU | AMD EPYC 9D25, **4 vCPU** (`nproc` = 4) |
| RAM | 7.934 MiB |
| Kernel | 7.0.0-44-generic |
| OS | Ubuntu 24.04.5 LTS |
| FFmpeg | 8.1.2 |
| Chromium | 158.0.8127.18 full build (`chromium-1254`), headed dưới `xvfb-run` |
| WebKit | 27.2 (`webkit-2388`), headed dưới `xvfb-run` |
| Playwright | `playwright-core 1.65.0` (`/home/hatch/scratch-round63-r4/node_modules/`) |
| **Load lúc đo** | **Biến động mạnh: 0,7–20** — các luồng đợt 84 khác chạy song song (L1/L3/L4/L7); mọi số timing tuyệt đối mang caveat đó; so sánh trong cùng một lượt đo vẫn có ý nghĩa tương đối. Riêng đuôi dài của clip E chỉ xuất hiện khi load 12–15 (xem §1.2) |
| VM | **Reboot trước lượt này** (uptime lúc bắt đầu ~27 phút) — nhưng lần này dep apt cho WebKit CÒN ĐỦ (160 `.deb` trong `/var/cache/apt/archives/`, libgtk-4-1 / libgstreamer1.0-0 / gstreamer1.0-plugins-good đều installed); WebKit launch được ngay, không cần cài lại (khác H5/I7). Ghi đính chính nợ đợt 83 K9 "WebKitGTK KHÔNG KHỞI ĐỘNG ĐƯỢC": tại thời điểm đo đợt này WebKitGTK 27.2 khởi động và chạy headed bình thường — hồi quy đó đã hết (hoặc chỉ đúng lúc K9 đo, trước khi os-intent replay cài lại dep) |

## 1. Loop 10 vòng trên element video thô (probe mới)

Harness: `benchmarks/render/webkit_loop_full_84l10.mjs` (server HTTP đa
luồng trong script, port 8898; element GẮN DOM để tránh W5). Clip tự
encode (`testsrc2`, ffmpeg 8.1.2) ở `/tmp/l10/clips` (tạo lại bằng
ffmpeg khi cần — KHÔNG stage binary). Chế độ workaround: handler
`ended → currentTime = 0 + play()` (đúng H5); đếm vòng bằng số lần
`ended`; độ trễ resume đo bằng rAF (thời gian từ `ended` tới mẫu đầu
tiên có `currentTime > 0,1`); kẹt = `currentTime` đứng yên > 1,5 s
trong lúc `!paused && !ended && !seeking`. Kết quả thô:
`benchmarks/results/webkit-loop-full-84l10.json` (96.548 byte).

### 1.1 WebKitGTK headed — workaround, 10 vòng

| Clip | Vòng (ended) | Resume trung vị / max | resume > 5 s | Khoảng giữa 2 lần ended (trung vị) | Stall > 1,5 s | totalFrames / dropped |
|---|---|---|---|---|---|---|
| A H.264 320×180 2 s, không audio | **10/10** | **569 ms / 1.095 ms** | 0 | 2,4 s (clip 2 s) | 0 | 447 / 4 |
| B H.264 640×360 3 s, không audio | **10/10** | **1.139 ms / 1.625 ms** | 0 | 4,0 s (clip 3 s) | 0 | 363 / 37 |
| C VP9 320×180 2 s, không audio | **10/10** | **1.027 ms / 1.275 ms** | 0 | 2,9 s (clip 2 s) | 0 | 318 / 20 |
| D H.264 1280×720 4 s, không audio | **10/10** | **2.075 ms / 2.852 ms** | 0 | 5,8 s (clip 4 s) | 0 | 300 / 54 |
| E H.264 640×360 10 s, **CÓ audio** (sine 440 Hz AAC) | **10/10** | **2.342 ms / 5.236 ms** | **3** | 12,6 s (clip 10 s) | 0 | 677 / 138 |
| F H.264 320×180 10 s, không audio | **10/10** | **1.496 ms / 2.210 ms** | 0 | 11,4 s (clip 10 s) | 0 | 1.110 / 116 |

Đọc đúng:
- **Không vòng nào kẹt/dừng** trên cả 6 clip — workaround W1 hoàn
  thành 10 vòng liên tiếp, kể cả clip 720p (D) mà H5 ghi "không ổn
  định" và clip có audio (E). Đây là lần đầu W1 được đo tới 10 vòng
  (H5 chỉ 2–3 vòng).
- Độ trễ resume tăng theo độ nặng clip: 2 s ≈ 0,57 s → 3 s ≈ 1,14 s
  → 720p 4 s ≈ 2,08 s → 10 s có audio ≈ 2,34 s. Khoảng giữa 2 lần
  `ended` = duration + resume + thời gian seek/decode — loop không
  mượt như native (có khoảng lặng ~0,5–2,3 s ở đầu mỗi vòng), nhưng
  chấp nhận được cho preview (app seek thẳng tới target nên không chịu
  độ trễ này theo cùng cách — xem H5 §4).
- `totalFrames` thấp hơn số frame lý thuyết (vd A: 447 thay vì ~600)
  vì decode tụt dưới tải (dropped > 0 ở mọi clip) — đó là đói decode,
  không phải kẹt loop; số vòng vẫn đếm bằng `ended`, không đọc
  `totalVideoFrames` như "đã phát được bấy nhiêu vòng" (H5 §1).

### 1.2 Clip E (có audio): đuôi dài dưới tải cao + chạy lại

Lượt chính clip E (load 12–15): 3/10 lần resume > 5 s
(`resumeMsAll` = [2089, 2305, 2457, null, null, 5236, null, 2271,
2342, 2494] ms — `null` = không resume trong 5 s), 1 khoảng giữa 2
lần `ended` dài **41,59 s** (các khoảng còn lại 11,9–18,8 s), wall
172,27 s thay vì ~120 s kỳ vọng. Nhưng `ended` vẫn đủ 10/10 và
`stalls` = [] (detector không bắt được vì trong lúc chậm element ở
trạng thái `seeking`, không phải "đứng yên mà không seeking").

Chạy lại riêng clip E (`/tmp/l10/e_rerun_84l10.mjs`, load rơi 10,8 →
3,1 trong lúc chạy, kết quả thô `/tmp/l10/e-rerun.json` — bản sao ở
`hidden_files/round84-l10/e-rerun.json`):
- 10/10 vòng, resume **1.288–2.895 ms, trung vị ~1.908 ms, 0 lần
  null**, các khoảng 11,29–13,92 s, totalFrames 1.234 (gấp ~1,8× lượt
  chính — đói decode giảm khi tải giảm).
- 5 cửa sổ chậm ≥ 2 s, TẤT CẢ đều bắt đầu ở `fromCt = 10` (cuối clip):
  2,34 / 2,87 / 2,22 / 2,96 / 2,10 s — tức là sau mỗi lần `ended`,
  element ngồi ở `currentTime = duration` ~2–3 s rồi mới phát tiếp.
  Không phải seek kẹt giữa chừng, không phải đóng băng giữa vòng.

Kết luận: **đuôi dài của clip E là do tải, không phải do audio**:
dưới tải 12–15 resume có lúc > 5 s (1 lần 41,6 s giữa 2 vòng); khi
tải rơi về ~3 thì resume tối đa 2,9 s. Chi phí resume nội tại của
clip có audio ≈ 1,3–2,9 s (trung vị ~1,9 s) — chậm hơn clip không
audio cùng độ dài (F: trung vị 1,5 s) nhưng cùng bậc độ lớn. Ghi là
bound, không claim "audio làm chậm X lần".

### 1.3 Đối chứng Chromium headed — workaround, 10 vòng

| Clip | Vòng | Resume trung vị / max | Khoảng giữa 2 lần ended (trung vị) |
|---|---|---|---|
| A 2 s | 10/10 | **186 ms / 259 ms** | 2,1 s |
| B 3 s | 10/10 | **120 ms / 193 ms** | 3,0 s |
| C VP9 2 s | 10/10 | **116 ms / 279 ms** | 2,0 s |
| D 720p 4 s | 10/10 | **291 ms / 394 ms** | 4,2 s |
| E 10 s + audio | 10/10 | **229 ms / 577 ms** | 11,8 s |
| F 10 s | 10/10 | **166 ms / 179 ms** | 10,0 s |

Chromium resume nhanh hơn WebKitGTK ~5–10× ở mọi clip (trung vị
0,12–0,29 s so với 0,57–2,34 s) và khoảng giữa các vòng ≈ duration +
~0,1–0,2 s (gần như loop liên tục). `droppedFrames` của Chromium
cũng cao dưới tải (99–1.016) — dropped frame không phải chỉ số loop.

### 1.4 Đối chứng native `loop=true` — W3 VẪN tái hiện trên WebKitGTK

Wall 8 s, clip A–D (kết quả thô trong cùng JSON):

| Clip | WebKitGTK headed native | Chromium headed native |
|---|---|---|
| A 2 s | **Kẹt ở 0** (`stuckAtZero`, total 29 frame, samples 0→1,8→0→0…) | Loop 3 vòng sạch (240 frame) |
| B 3 s | **Giật ở đầu vòng 2** (ct quanh quẩn 0–0,81, không tiến) | Loop 2 vòng sạch (241 frame) |
| C VP9 2 s | **Đóng băng ở cuối** (ct = 2,0 suốt, `ended` KHÔNG bắn, total 60) | Loop 3 vòng sạch (240 frame) |
| D 720p 4 s | Giật + đói decode (total 29 frame / 8 s, wraps 2 nhưng ct reset liên tục) | Loop 1 vòng trong 8 s (192 frame), bình thường |

W3 tái hiện đủ 3 biểu hiện như H5 (kẹt-ở-0 / giật-ở-đầu / đóng-băng-
ở-cuối-không-ended) — workaround vẫn cần thiết; không có gì thay đổi
khiến `loop` bỗng chạy được.

## 2. Trường hợp biên trên WebKitGTK headed (probe thô, clip A 2 s)

| Ca | Thiết kế | Kết quả |
|---|---|---|
| **E1 seek giữa vòng loop** | Sau 3 vòng, lúc ct ≈ 1,0 (giữa vòng 4) seek tới 1,0 (50%), rồi loop tiếp tới 6 vòng | **PASS** — `endedCount` = 6, sau seek ct = 1,167, `seeking=false`, `paused=false`, phát tiếp bình thường |
| **E2 pause/resume giữa loop** | Sau 5 vòng, pause 1,5 s rồi play, loop tiếp tới 8 vòng | **PASS** — `endedCount` = 8, pause giữ ct = 0 (đúng — pause ngay sau 1 lần ended + restart về 0), resume `paused=false`, loop tiếp |
| **E3 dừng ở cuối** | Đủ 10 vòng thì tắt restart, chờ thêm 1 vòng + 2 s | **PASS** — `endedCount` dừng ở 11 (10 vòng + 1 lần ended cuối), `finalCt` = 2, `paused=true`, `ended=true`, không restart giả sau khi dừng |

Cả 3 ca biên đều không làm workaround kẹt/dừng: seek giữa vòng
không phá vòng tiếp theo, pause/resume không mất vòng, dừng ở cuối
không restart giả.

## 3. MediaRecorder trên WebKitGTK 27.2 — vẫn vắng (xác nhận lần 5)

| Engine | `typeof MediaRecorder` | Phiên bản đo được |
|---|---|---|
| WebKitGTK headed | **`undefined`** | 27.2 (`webkit-2388`), UA `…Version/27.2 Safari/605.1.15` |
| Chromium headed | `function` | 158.0.8127.18 |

Hệ quả (đọc code, không đoán): `MediaRecorder` chỉ dùng để **sinh
media mẫu** — `apps/web/src/lib/sampleMedia.ts` ghi video mẫu từ
canvas qua MediaRecorder; khi vắng thì trả lỗi rõ ràng (`NO_RECORDER`),
KHÔNG dùng ảnh tĩnh giả làm video (theo thiết kế: "preview/render sẽ
vỡ" nếu giả). `loadSample()` có đường rơi về clip ảnh tĩnh PNG (xem
I7 §5). Nghĩa là **trên WebKitGTK, người dùng không sinh được video
mẫu template-pack** (chỉ còn ảnh tĩnh PNG); tính năng phát/xem/xuất
video thật không dùng MediaRecorder nên không bị ảnh hưởng. Không có
gì mới để sửa — ghi rõ để đợt sau khỏi đo lại (đã xác nhận 5 lần:
G8, H5, I7, K9, L10).

## 4. App-level: W1 trong app thật — bộ đếm riêng + 3/3 PASS cả 2 engine

### 4.1 Thay đổi production tối thiểu (quyết định của đợt này)

I7 §2.3 để lại 2 lựa chọn để quy kết chắc chắn restart đã bắn: (a)
counter riêng cho đường restart, hoặc (b) đo trên máy không tải.
Đợt này chọn (a) vì nó làm được ngay, không đổi hành vi, và cho phép
kiểm chứng lặp lại dưới mọi tải. Thay đổi trong
`apps/web/src/preview.tsx` (5 điểm chạm, chỉ cộng thêm):
- 2 biến `syncRestartEndedVideoCount` / `syncRestartEndedAudioCount`
  (cạnh `syncReseek*`, `:2332`).
- Trong nhánh `restartEndedElement` (`:2627`): tăng counter riêng
  song song với counter chung cũ (giữ nguyên hành vi đếm chung vào
  `syncReseek*` — không đổi nghĩa số cũ).
- Khai báo `__vcutSyncRestartEndedVideo?` /
  `__vcutSyncRestartEndedAudio?` trong kiểu `winHook`, gán mỗi tick
  (`:3926`), dọn ở cleanup (`:4515`).
- Không đổi logic `restartEndedElement`, không đổi guard, không đổi
  đường phát. Chỉ `restartEndedElement` mới tăng counter này (grep
  xác nhận: chỉ 1 nơi tăng).

### 4.2 Harness app-level (mới)

`apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` (vite dev HMR
tắt + headed qua Xvfb + Playwright; clip H.264 thật qua `importFiles`;
ép `ended` bằng ghi đè getter trên instance của element thật; gắn
element vào DOM test-only vì W5 — không đổi code production). Env:
`L10_ENGINE` (webkit|chromium|both), `L10_CLIP10` (mặc định clip 30 s
`/tmp/l10/clips/h_h264_320x180_30s.mp4`), `L10_CLIP4` (clip 4 s).
Các ca mỗi engine: **W1** ép `ended` 3 lần liên tiếp (lần 3 có
pause/resume trước khi ép — W1b); **W2** phát tự nhiên trọn clip
30 s; **E4** clip 4 s = cuối timeline, kiểm tra restart không tăng
thêm sau khi hết.

Bài học harness trong lượt này (ghi để đợt sau khỏi mất giờ):
- **Clip 10 s quá ngắn cho W1 trên WebKitGTK** (lượt chạy 3): element
  đồng bộ muộn (playhead 7,5/10 mới sync — W6), cửa sổ ép chỉ còn
  2,5 s, drift seek đang bay + playhead chạm cuối clip làm cửa sổ
  đóng trước khi restart kịp bắn → W1-lần1 FAIL oan, lần2 chờ đồng bộ
  60 s trong vô ích (element đã dừng ở cuối clip). Đổi sang clip
  **30 s** thì 3/3 PASS. Quy tắc: clip W1 phải dài gấp ≥ 3× thời gian
  đồng bộ (WebKitGTK cần ~2–8 s để sync dưới tải).
- **`.find(VIDEO)` lấy nhầm element cũ** (lượt chạy 3–4): `__vcutMediaEls`
  giữ element của project trước sau `replaceProject` (vd E4 thấy cả
  element 30 s cũ lẫn 4 s mới) → harness phải chọn element theo
  `duration` của clip hiện tại (`window.__l10clipDur` + sắp xếp trong
  `STATE_FN` + `PICK_VIDEO_FN`). Đây là nợ nhỏ của hook đo, không phải
  lỗi production (pool giữ element cũ là có chủ ý — xem `MediaPool`).
- **Ghi đè `ended` làm restart bắn lặp** (xem §5): harness phải gỡ ghi
  đè NGAY sau vòng lấy mẫu rồi mới đọc counter, và kết luận theo delta
  counter (≥ +1) thay vì đòi đúng +1 trong vòng lấy mẫu (mẫu trên
  WebKitGTK thưa ~1,5 s/mẫu — lượt chạy 4 lần3 FAIL oan vì restart bắn
  giữa 2 mẫu: counter 2→3 nhưng không mẫu nào bắt được).
- **Throw giữa chừng làm mất dữ liệu từng phần** (lượt chạy 3–4):
  `runEngine` nay gắn `partialOut` vào lỗi, `main` gộp vào report.

### 4.3 Kết quả app-level — lượt chạy cuối (run 5, load ~1,5–4, KHÔNG FAIL)

| Ca | WebKitGTK headed | Chromium headed |
|---|---|---|
| **W1-lần1** (ép ended) | **PASS** — restart 0→2 (delta +2, gồm 1 lần bắn lặp do ghi đè còn bật — xem §5), ct hạ cánh đúng target, phát tiếp, 0 lỗi | **PASS** — restart 0→1 (delta +1), ct = playhead, phát tiếp, 0 lỗi |
| **W1-lần2** | **PASS** — restart 2→3 (delta +1); mẫu cho thấy drift seek bay 1,6 s (`seeking=true`, ct đứng 12,9) rồi restart mới bắn — guard `!seeking` hoạt động đúng | **PASS** — restart 2→3 (delta +1) |
| **W1-lần3** (+ pause/resume trước khi ép, W1b) | **PASS** — restart 3→4 (delta +1), ct = 11,567 = playhead đúng từng ms, phát tiếp, 0 lỗi | **PASS** — restart 4→5 (delta +1) |
| **W2** phát tự nhiên 30 s | **PASS** — playhead tới 30, **restart tự nhiên Δ = 1** (bắn 1 lần thật trong lúc phát — xem §4.4), 0 lỗi | **PASS** — playhead tới 30, restart tự nhiên Δ = 0, 0 lỗi |
| **E4** clip 4 s = cuối timeline | **PASS** — tới cuối, playing dừng, restart 5→5 (không tăng thêm trong 3 s chờ), ct cuối = 3,688 (element tụt — W6), `ended=false`, 0 lỗi | **PASS** — tới cuối, playing dừng, restart 6→6, ct cuối = 4, `ended=true`, 0 lỗi |

Chi tiết đáng chú ý:
- **WebKit W1-lần2** là bằng chứng sống cho guard `!seeking`: sau khi
  ép `ended`, drift seek đang bay 1,6 s (ct đứng yên 12,9 trong khi
  playhead 12,9→14,5), restart CHỜ seek hạ cánh rồi mới bắn (counter
  2→3 ở t = 2,46 s, ct = 14,767 ≈ playhead 15,033). Đúng thiết kế H5
  (chặn seek chồng).
- **Chromium W1** đồng bộ sau 0,5–0,6 s (so với WebKit 1,8–2,0 s ở
  lượt này, 7,3 s ở lượt chạy 3 dưới tải 15–20) và restart bắn trong
  ~0,1 s sau khi ép.
- 0 console error / pageerror trên cả 2 engine, cả 3 lượt chạy cuối
  có report (run 3–5). Report đầy đủ + 6 screenshot:
  `hidden_files/round84-l10/headed/l10-webkit-loop-w1-report.json`.

### 4.4 Restart TỰ NHIÊN trong lúc phát (WebKit W2) — lần đầu bắt được

Trong W2 WebKit (phát tự nhiên 30 s, không ép), restart tự nhiên
tăng 4→5 ở playhead ≈ 19,6, ct ≈ 19,4. Cơ chế: playhead chạy chậm
hơn wall-clock dưới tải (clamp dt 0,1 s khi FPS thấp — xem comment
`syncReseekCount` ở `preview.tsx:2319`), element phát đúng tốc độ
thật nên chạm cuối nguồn (ct = 30) trong khi playhead còn ở ~19,6
→ `ended` thật trong lúc clip còn active → restart seek về target
19,6 → phát tiếp tới cuối clip (playhead 30). Đây chính là trường
hợp production mà `restartEndedElement` được viết ra để cứu, nay đã
quan sát được trực tiếp thay vì chỉ suy luận (H5 §3). Trên Chromium
W2 Δ = 0 (playhead theo kịp wall-clock nên element không chạm ended
trước).

## 5. Phát hiện mới W7 — một lần restart DƯ sau tương tác test

### 5.1 Hiện tượng

Ở mọi lượt chạy harness chính (run 3–5), giữa các vòng ép `ended`,
counter tăng thêm đúng +1 NGOÀI vòng ép: vd Chromium run 5: lần1
0→1, lần2 bắt đầu ở 2 (không phải 1), lần3 bắt đầu ở 4 (không phải
3). WebKit run 5: lần3 bắt đầu ở 3 (sau lần2 kết thúc ở 2 — nhưng
lần1 kết thúc ở 2 do bắn lặp, xem dưới). Hỏi: +1 đó bắn lúc nào, và
có phải restart giả trong production không?

### 5.2 Cô lập (probe riêng, cả 2 engine)

Script `/tmp/l10/isolate-restart-extra-84l10.mjs` (bản sao log +
JSON Chromium ở `hidden_files/round84-l10/`; JSON WebKit bị ghi đè
bởi lượt Chromium sau đó — số WebKit lấy theo log + bảng mẫu đã in
ra trong lúc chạy): ép `ended` 1 lần → gỡ ghi đè → quan sát 20 s
không đụng gì (phase A) → reset `setPlayhead(0)` → quan sát 10 s
(phase B).

| | WebKitGTK | Chromium |
|---|---|---|
| Base → ngay sau gỡ ghi đè | 0 → **1** (đúng +1) | 0 → **5** (bắn lặp 5 lần — xem §5.3) |
| Phase A: 20 s không đụng gì | **1 → 1 (0 lần tăng thêm)** | 5 → **6** (+1 ở t = 0,4 s, ct = 2,485, `seeking=false`), rồi ổn định 19,6 s còn lại |
| Phase B: sau reset `setPlayhead(0)` | 1 → **2** (+1 ở t = 9,3 s sau reset, playhead = 9,4, ct = 8,833) | **6 → 6 (0 lần tăng thêm)** |

Kết luận cô lập:
- **Không tự phát trong lúc phát thường:** WebKit 20 s idle = 0 lần
  tăng thêm; Chromium sau +1 ở t = 0,4 s thì 19,6 s còn lại = 0. Ghi
  đè đã gỡ sạch (`endedNow=false` sau `delete` ở cả 2 engine).
- **+1 gắn với tương tác test:** trên WebKit nó bắn ~9,3 s sau
  `setPlayhead(0)` — đúng lúc một seek kẹt dài (~8,7 s, ct đứng yên
  23,733 trong khi playhead chạy 0→8,8) vừa hạ cánh (ct nhảy về
  8,833); trên Chromium nó bắn 0,4 s sau khi gỡ ghi đè.
- **Tác động lành:** restart seek về đúng target của timeline (vị trí
  đúng), không sai frame, không lỗi trang, không lặp vô hạn (sau +1
  thì ổn định hoàn toàn). Kể cả nếu nó bắn giả trong production thì
  hậu quả cũng chỉ là một lần seek về đúng vị trí — nhưng chưa chứng
  minh được nó có bắn giả trong production hay không (phase A 20 s
  nói không).
- **Cơ chế kích hoạt ở mức tick CHƯA xác định được:** `restartEndedElement`
  chỉ bắn khi `ended && !seeking` (đọc code), mà tại thời điểm +1 thì
  `currentTime` (2,485 / 8,833) còn xa `duration` (30) — không lý giải
  được `ended` từ đâu ra bằng dữ liệu hiện có. Đã loại trừ: ghi đè còn
  sót (đã gỡ, `endedNow=false`), 2 video element (đếm trực tiếp:
  `__vcutMediaEls` chỉ có **1** VIDEO duy nhất ở cả 3 thời điểm —
  probe `/tmp/l10/count-els.mjs`, log ở `hidden_files/round84-l10/`),
  tự phát trong lúc phát thường (phase A ổn định).

### 5.3 Bắn lặp do ghi đè `ended` còn bật (artifact test, đã hiểu rõ)

Trên Chromium isolate, 1 lần ép cho 5 lần restart trước khi gỡ: ghi
đè `ended = true` còn bật trong lúc `waitFor` poll (500 ms) → mỗi
tick của syncMedia (tick nhanh trên Chromium) lại bắn restart một
lần nữa (seek về target — gần như no-op vì ct đã ở target — rồi
`seeking` hết nhanh, tick sau bắn tiếp). Trên WebKit tick thưa nên
chỉ 1–2 lần. Đây là artifact của phương pháp ép (production:
`ended` thật hết ngay sau khi seek + play nên chỉ bắn 1 lần). Harness
chính đã giảm thiểu bằng cách gỡ ghi đè ngay sau vòng lấy mẫu; delta
+2 ở WebKit run 5 lần1 là 1 lần bắn lặp còn sót trong cửa sổ
(giữa mẫu cuối và lúc `delete` chạy). **Không phải lỗi production —
không sửa code vì nó.** Nhưng kết luận "đúng +1" trong W1 phải đọc
là "ít nhất +1, có thể +1 dư do ghi đè" — các vòng trong harness
chính đều có delta +1 sau khi đã gỡ (trừ lần1 WebKit run 5 là +2).

### 5.4 Hướng điều tra tiếp (không làm trong vòng này)

Để xác định cơ chế W7 cần ghi log ở mức tick trong `syncMedia`
(tạm thời): mỗi lần `restartEndedElement` trả true thì log
`ended/seeking/currentTime/duration/playhead/target` + stack ngắn,
hoặc thêm counter ghi lại playhead/ct tại thời điểm bắn. Không làm
trong vòng này vì: (a) cần sửa production để đo (thêm log tạm), (b)
tác động đã chứng minh là lành, (c) không chặn verdict W1. Chuyển
thành nợ đợt sau.

## 6. W6 đo thêm — seek đóng băng 5–9 s trên WebKitGTK

Từ isolate WebKit phase A (phát thường 20 s, clip 30 s, load thấp
~1–3 lúc chạy): element lặp lại chu kỳ "phát ~0,5–1 s → seek đóng
băng 5–7 s (ct đứng yên, `seeking=true`) → seek hạ cánh gần playhead
→ phát tiếp". Cụ thể: ct đứng ở 4,967 (~5,4 s), 13,067 (~6,7 s),
23,733 (~2,5 s tới cuối phase). Sau `setPlayhead(0)`, một seek kẹt
tới ~8,7 s (ct đứng 23,733 trong khi playhead 0→8,8). Đây là W6 ở
dạng nặng nhất từng đo (I7 ghi seek "hàng giây"; nay đo được 5–9 s
cả khi tải thấp). Hệ quả: preview trên WebKitGTK giật theo chu kỳ
seek — nhưng vòng loop vẫn hoàn thành vì workaround không phụ thuộc
vào seek nhanh (nó chỉ cần `ended` bắn rồi seek về target, dù chậm).
Chưa tách được bao nhiêu phần là GStreamer seek chậm intrinsic, bao
nhiêu là do cách app phát seek liên tục (drift > 0,35 s → seek mới
trong khi seek cũ chưa hạ cánh — có thể tự làm nghẽn hàng đợi seek).
Nợ đợt sau: cân nhắc giảm tần suất drift re-seek trên WebKit (I7 §7.3
đã gợi ý) hoặc chờ seek hạ cánh trước khi phát seek mới.

## 7. Kiểm chứng đợt này

| Kiểm chứng | Kết quả |
|---|---|
| Probe loop thô 6 clip × 10 vòng, WebKitGTK headed | **60/60 vòng** (endedCount khớp), 0 stall, resume trung vị 0,57–2,34 s |
| Probe loop thô 6 clip × 10 vòng, Chromium headed (đối chứng) | **60/60 vòng**, resume trung vị 0,12–0,29 s |
| Đối chứng native `loop=true` 4 clip × 2 engine | W3 tái hiện đủ 3 biểu hiện trên WebKitGTK; Chromium loop sạch 12/12 ca |
| Trường hợp biên E1/E2/E3 (WebKitGTK) | **3/3 PASS** (seek giữa vòng, pause/resume, dừng ở cuối) |
| Chạy lại clip E (audio) dưới tải thấp | 10/10 vòng, resume tối đa 2,9 s (đuôi dài là do tải — xem §1.2) |
| Harness app-level W1 3 vòng × 2 engine (run 5) | **6/6 PASS** (counter riêng +1 mỗi lần ép, hạ cánh đúng target, phát tiếp, 0 lỗi) |
| Harness app-level W2 phát tự nhiên 30 s × 2 engine | **2/2 PASS** (WebKit: 1 restart tự nhiên thật; Chromium: Δ = 0) |
| Harness app-level E4 clip cuối timeline × 2 engine | **2/2 PASS** (restart không tăng thêm sau khi hết: 5→5 WebKit, 6→6 Chromium) |
| Cô lập W7 (2 engine) + đếm element (1 VIDEO duy nhất) | Đã cô lập (xem §5); cơ chế tick chưa rõ — nợ đợt sau |
| Unit test `webkitLoopRestart80H5.test.ts` | **11/11 xanh** |
| `tsc --noEmit` (apps/web) | **0 lỗi** (sau khi thêm counter riêng) |
| `vite build` (apps/web) | **Pass** (35,52 s; cảnh báo chunk > 500 kB đã có từ trước) |
| `MediaRecorder` trên WebKitGTK 27.2 | **`undefined`** (xác nhận lần 5); Chromium: `function` |
| WebKitGTK launch sau reboot | Launch được ngay, dep còn đủ (đính chính K9 — xem §0) |

**Chưa làm (nợ):** Safari thật vẫn chưa đo (không có máy macOS/iOS);
W7 cơ chế tick chưa rõ (§5.4); W6 chưa tách intrinsic vs seek-chồng
(§6); W5 quyết gắn element pool vào DOM vẫn mở (I7 §7.2 — harness
vòng này vẫn dùng can thiệp test-only); W4 nhãn WebGL "Apple GPU" giả
vẫn mở (không đo lại vòng này).

## 8. Nợ mở cho đợt sau (cập nhật W1/W3/W5/W6 + mới W7)

1. **W1 ĐÃ ĐÓNG trên WebKitGTK** (nợ I7 §7.1 xong): workaround loop
   10/10 vòng + đường nối production 3/3 PASS cả 2 engine. Còn lại:
   Safari thật (WebKitGTK ≠ Safari — media stack GStreamer vs
   VideoToolbox).
2. **W7 (mới):** +1 restart dư sau tương tác test — xác định cơ chế
   ở mức tick bằng log tạm trong `syncMedia` (xem §5.4). Tác động
   hiện tại là lành; không chặn gì.
3. **W6:** seek đóng băng 5–9 s trên WebKitGTK — đo lại khi tải thấp
   ổn định để tách intrinsic vs seek-chồng; nếu intrinsic thì cân
   nhắc giảm tần suất drift re-seek trên WebKit.
4. **W5:** quyết có gắn element pool vào DOM (1×1/2×2 px, ẩn) để
   preview chạy được trên WebKitGTK hay không; đo lại tác động lên
   `presentedFps`/`totalVideoFrames` sau khi gắn.
5. **W3 trên clip D:** đã loop 10/10 bằng workaround — nợ "không ổn
   định" của H5 coi như đóng ở mức workaround; native `loop=true`
   trên D vẫn kẹt (không cần sửa — app không dùng `loop`).
6. **Safari thật vẫn chưa đo** (nợ từ đợt 77): kiểm tra W3/W5/W7 có
   tái hiện trên Safari thật không.
7. **W4 nhãn WebGL "Apple GPU" giả** (nợ G8/H5) — vẫn mở, không đo
   lại trong vòng này; không có GPU thật trên VM.
8. **GPU-time thật vẫn chưa đo được** (nợ H5 §7.3) — timer query vắng
   trên cả hai engine ở VM này; cần máy có GPU thật.

## 9. Files (stage, KHÔNG push)

- Sửa: `apps/web/src/preview.tsx` — bộ đếm riêng cho đường
  `restartEndedElement` (`__vcutSyncRestartEndedVideo/Audio`, xem §4.1).
- Mới: `docs/PHASE9_ROUND84_L10_WEBKIT_LOOP_W1_LIMITS.md` (file này).
- Mới: `benchmarks/render/webkit_loop_full_84l10.mjs` — probe loop
  10 vòng 6 clip + đối chứng native + biên E1/E2/E3 (WebKit + Chromium
  headed).
- Mới: `benchmarks/results/webkit-loop-full-84l10.json` — kết quả thô
  probe loop (96.548 byte).
- Mới: `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` — harness
  app-level W1 (3 lần ép ended) + W1b pause/resume + W2 + E4, cả 2
  engine, counter riêng.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round84-l10-webkit-loop-w1.txt`
  — 5 entry, verify read-back 5/5.
- Bằng chứng headed (không stage, ở hidden_files):
  `hidden_files/round84-l10/headed/l10-webkit-loop-w1-report.json`
  (report lượt cuối run 5, KHÔNG FAIL) + 6 screenshot
  `l10-{webkit,chromium}-{w1,w2,e4}.png` + `l10-run.log` +
  `isolate-webkit.log` + `isolate-chromium.log` +
  `isolate-restart-extra.json` (bản Chromium — bản WebKit bị ghi đè,
  xem §5.2) + `e-rerun.json` + `count-els.log`.
- Không stage: clip mp4 trong `/tmp/l10/clips/` (tạo lại bằng ffmpeg
  khi cần: `testsrc2` 320×180/640×360/1280×720, 2–30 s, libx264/VP9,
  clip E có audio sine 440 Hz AAC — xem §1), script cô lập + đếm
  element trong `/tmp/l10/` (không phải file repo), config vite tạm
  (script tự tạo + tự xóa trong `apps/web/` — đã xác nhận không còn
  file `vite.*.config.mjs` sót lại).
- Không sửa production ngoài `preview.tsx` (5 điểm chạm cộng thêm,
  không đổi logic). Không binary. Không workflow.
