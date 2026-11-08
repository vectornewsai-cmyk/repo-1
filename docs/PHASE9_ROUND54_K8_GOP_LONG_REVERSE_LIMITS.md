# Phase 9 — Đợt 54, luồng K8: GOP/seek — phiên lùi dài 180 s + seek lùi + siết moov giả (bố cục sample)

Ngày: 07/11/2026 (lượt cron 06:35 +07; làm việc ~23:35–01:30 UTC). Đóng 2 nợ
mở ở `docs/PHASE9_ROUND53_LIMITS.md` §4.8 (gốc: J4 đợt 52 §5.3 / H4 §5.3):
(1) phiên lùi dài > 60 s; (2) tail streaming còn rủi ro file chế tác moov giả.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới đây
đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Phiên lùi dài 180 s — ĐÃ ĐO SẠCH (chạy 2, §1.2).** File encode thật
   180 s / 97.526.780 byte (5.400 frame, 720p30, `-g 30`, moov cuối):
   phát ngược 180 → 0 trong ~180 s tường (~0,94× realtime, đều ~9,4 s
   mỗi bucket 10 s), `gopActive=true` suốt, `gopFallbackReasons=[]`,
   wc hits +2547 / misses +2400, canvas 285 frame khác nhau, 0 frame đen,
   0 uncaught exception, 0 console error. Blob chính 408 GET Range +
   0 GET không Range (cổng thu hẹp kiểu J6 PASS; toàn cục 417 Range +
   2 không Range trên blob phụ). Cache GOP ghim đúng trần 16 MiB
   (30–31 seg) từ ~40 s, eviction bắt đầu ~40–50 s, tổng evicted
   74.696.473 byte cuối phiên — trần 16 MiB "cắn" đúng như dự đoán trên
   phiên dài. Heap baseline 5,56 → đỉnh 56,25 → settled 23,58 MiB
   (bản build tĩnh, không overhead vite dev).
2. **Seek lùi rời rạc — ĐÃ ĐO, 5/5 PASS (chạy 2, §1.2).** Sau khi phát
   ngược xong, 5 bước ArrowLeft ×150 (5 s/bước, 30 fps): 180→175→170→
   165→160→155, đáp đúng kỳ vọng tới từng giây, canvas đổi frame mỗi
   bước, phát ngược xác nhận đã tắt (`aria-pressed=false`) trong cả 5
   bước, mỗi bước 2,2–3,3 s.
3. **Moov giả — SIẾT THÊM 1 LỚP Ở TẦNG T3 (§2, §3).** Lớp mới (c) sau
   demux, trước khi chia mode (áp cả stream + all): (a) bố cục sample —
   offset phải tăng dần và các khoảng `[offset, offset+size)` không
   chồng lấn (`validateSampleLayout`); (b) tổng ctts phải bằng đúng stsz;
   (c) entry stss phải nằm trong `[1, sampleCount]`. Test mới 18/18
   (đỏ-trước 13/18: đúng 5 test T3-level fail khi gỡ lớp này, trả
   `gop-range` cho moov giả). File thật không đổi hành vi (hồi quy GOP
   đầy đủ xanh, chạy headed 2 lần `gopActive=true`, 0 fallback oan).
4. **VideoDecoder trial-decode — ĐÃ ĐÁNH GIÁ BẰNG ĐO THẬT (§3.1):**
   decode thử sample đầu trong Chromium headed thật (2 lần): sample thật
   decode OK, ra frame, 15,5 ms (lần 1: 17,1 ms); mẫu AVCC-đúng-cấu-trúc
   nhưng H.264-rác thì AVCC qua nhưng VideoDecoder lỗi trong 0,5 ms —
   chứng minh decoder bắt được lớp mà AVCC không bắt được. KHÔNG nối
   vào T3 trong luồng này (lý do §3.2: cần decode bất đồng bộ trong
   đường fetch + không test được trong Node; decoder + controller
   fallback vẫn là cửa cuối như cũ).
5. **Chạy 1 bị nhiễu — GHI RÕ, KHÔNG DÙNG LÀM KẾT LUẬN (§1.1, §1.4).**
   Chạy 1 (vite dev, máy tải nặng loadavg ~10,5, 51 lỗi console HMR do
   các luồng song song đang sửa file): playhead đóng băng ở 163,8 s
   suốt ~190 s rồi nhảy về 0; cổng seek lùi fail 0/5 do BUG HARNESS
   (cú bấm "dừng" bật lại phát ngược thay vì dừng — đã sửa, xem §1.3).
   Chạy 3 (vite dev, máy yên, 0 lỗi HMR) chạy sạch 18/18 — đóng băng
   KHÔNG phải do vite dev; cơ chế gốc vẫn chưa xác định dứt điểm
   (xem §1.4): 2 biến (tải máy vs HMR churn) còn lẫn nhau, cần thêm
   bằng chứng (ghi navigation timing) mới kết luận được.

## 1. Phiên lùi dài 180 s + seek lùi (nợ 1)

### 1.0 Bối cảnh: nợ này thực chất đã được I6 đo một phần

Ghi trung thực để parent khỏi tưởng nợ còn nguyên: I6 đợt 52 ĐÃ đo phiên
lùi dài trên file 72 s (long16a/long8a, 150 s quan sát, cả 2 trần cache —
xem `docs/PHASE9_ROUND52_LIMITS.md` §2.6: "Phiên lùi dài >60 s — xong cả
2 trần"). Dòng nợ ở ROUND53 §4.8 ("phiên lùi dài > 60 s chưa đo") là
carry-over cũ/mislabel. Luồng này đo PHẦN CHƯA CÓ: (a) file DÀI HƠN NHIỀU
(180 s = 2,5× file I6) — eviction/trần cache cắn mạnh hơn hẳn; (b) seek
lùi RỜI RẠC (I6 chỉ đo phát ngược liên tục, chưa đo seek lùi từng bước).

### 1.1 Chạy 1 — vite dev, máy tải nặng: BỊ NHIỄU, không dùng làm kết luận

Fixture: `trailing-real180.mp4` encode thật (testsrc2 1280×720 30 fps
180 s, libx264 `-g 30 -crf 18 -preset veryfast`, moov cuối, không
faststart). Harness tự encode lại vào `~/scratch-round47-c5/` vì
`E2_FIXTURE` mặc định trỏ đó (harness không tìm thấy file ở đó);
sha256 của file encode lại KHỚP HOÀN TOÀN với file tôi encode trước ở
`~/scratch-round54-k8/` (`8ed2c478…` cả hai) nên cùng một nội dung đo.
Vite :5176, bridge :8796, debug :9396, Xvfb qua `xvfb-run -a`.
Lúc bắt đầu loadavg 10,50 (các luồng đợt 54 khác chạy song song).

- Playhead 180 → 170,8 (0–10 s, ~0,92×) → 163,8 (10–20 s, ~0,62×) rồi
  ĐÓNG BĂNG ở 163,8 suốt ~190 s (bucket 20–210 s: lùi 0,0 s; heap về
  ~28–30 MiB mức idle; `__vcutReverseWc` đóng băng ở hits 25/misses
  142; cache GOP đóng băng 4.867.322 byte/9 seg/evicted 0), rồi NHẢY
  163,8 → 0 trong bucket 210–220 s và đỗ ở 0 tới hết 300 s.
- `gopActive=true` suốt, `gopFallbackReasons=[]`; blob chính 158 Range
  + 0 không Range (toàn cục 247 Range + 0 không Range — cổng cũ cũng
  pass lần này); wc hits +332/misses +2346 (phần lớn decode ở D2, xem
  dưới); canvas 22 frame khác nhau, 0 đen; heap baseline 40,29 → đỉnh
  83,92 (t=17,4 s, transient T3) → settled 52,17 MiB; RSS đỉnh
  2.122,75 (delta +556,14).
- 51 console error — toàn `[vite] Failed to reload /src/App.tsx`,
  `MediaBin.tsx`, `ProjectMenu.tsx`, `ExportPanel.tsx` (HMR fail do các
  luồng đợt 54 khác đang sửa đúng các file này giữa lúc chạy).
- D2 seek lùi FAIL 0/5 — LÀ BUG HARNESS, không phải bug sản phẩm (xem
  §1.3): sau OBS, phát ngược đã tự dừng ở 0 (`playing=false`) nên cú
  bấm nút "Phát ngược" để "dừng" lại rơi vào nhánh `playhead<=0.001`
  của `toggleReversePlayback` (store.ts:868) → bật lại phát ngược từ
  180. Cả 5 bước D2 đều đo "phát ngược đang chạy + ArrowLeft" (mỗi
  bước lùi ~24–29 s trong ~20 s tường, khớp tốc độ phát ngược ~1× +
  5 s từ phím) thay vì seek lùi thuần. Canvas vẫn đổi frame mỗi bước
  (frame thật đang vẽ), nên dữ liệu D2 chạy 1 không chứng minh seek
  lùi hỏng — nó chứng minh harness đo sai thứ cần đo.
- Kết luận chạy 1: KHÔNG dùng số này làm kết luận sản phẩm. Chỉ giữ
  lại 2 bằng chứng phụ: (a) đường GOP không fallback oan dưới tải nặng
  + HMR nhiễu (`gopActive=true`, 0 fallback, 0 GET toàn file trên blob
  chính); (b) có một lần đóng băng chưa giải thích được (xem §1.4).

### 1.2 Chạy 2 — build tĩnh, máy yên: SẠCH, 18/18 cổng

Để loại nhiễu HMR, chạy 2 serve bản BUILD tĩnh (`vite build` từ đúng
source hiện tại, gồm lớp K8) bằng `python3 -m http.server` thay cho vite
dev; máy yên lúc bắt đầu (loadavg 1,14). DIAG import `/src/...` fail
mềm như dự kiến (chỉ mất dòng CACHE-DIAG chi tiết, không ảnh hưởng cổng).

- Phát ngược: playhead 180 → 0 trong ~180 s tường, đều ~9,4 s mỗi
  bucket 10 s (~0,94× realtime) — xem bảng bucket dưới; về 0 ở bucket
  170–180 s rồi đỗ ở 0 (đúng thiết kế: chạm 0 thì dừng, không quấn).
  `gopActive=true` suốt, `gopFallbackReasons=[]`.
- WebCodecs: hits +2547 / misses +2400 / controller fetches +4.
  Canvas 285 frame khác nhau, 0 mẫu đen. Hold draw +309 / hold +2077 /
  skip +21. 0 uncaught exception, 0 console error (đối chứng với 51 lỗi
  HMR ở chạy 1 — hết nhiễu khi không còn vite dev).
- Blob: toàn cục 424 request = 417 Range + 2 không Range + 5 other;
  blob chính `02f25c5e-63ab`: **408 GET Range + 0 GET không Range** —
  cổng thu hẹp kiểu J6 PASS. (2 GET không Range nằm trên blob phụ, đúng
  mẫu I6/J6: probe metadata clip phụ — cổng cũ toàn cục sẽ FAIL oan.)
- Cache GOP: 3 seg/1,6 MB (0–10 s) → 13 seg (10–20 s) → 24 seg
  (20–30 s) → 30–31 seg/~16,27 MB từ ~40 s, GHIM ở trần 16 MiB tới hết
  phiên; eviction bắt đầu bucket 40–50 s (5.382.824 byte), tăng đều,
  **tổng evicted 74.696.473 byte cuối phiên** — gấp ~17× so với I6 trên
  file 72 s (4.317.300). Trần 16 MiB cắn đúng như dự đoán trên phiên
  dài, nhưng phát ngược vẫn hoàn thành trọn 180 s, 0 lỗi trang.
- Heap (usedJSHeap): baseline 5,56 MiB (bản build tĩnh — thấp hơn hẳn
  40,29 của vite dev ở chạy 1, đó là overhead dev server, không phải
  sản phẩm) → đỉnh 56,25 ở t=169,5 s (delta +50,70) → settled 23,58
  MiB sau gc + dừng (delta +18,02). RSS: baseline 1.496,02 → đỉnh
  2.030,27 (delta +534,25) → settled 1.239,32 MiB.
- STALL: 229 mẫu playhead đứng yên / 520 mẫu, khựng dài nhất 114.500 ms
  — KHÔNG phải khựng thật: playhead đã về 0 ở ~t=175 s và đỗ ở đó 115 s
  cuối (= 229 mẫu × 500 ms), cùng artefact như I6 long8a đã ghi.
- Seek lùi D2 (sau khi sửa harness §1.3): playhead 0 → End về 180, rồi
  5 bước ArrowLeft ×150: **180→175→170→165→160→155, đáp đúng kỳ vọng
  tới từng giây, canvas đổi frame mỗi bước, `aria-pressed=false`
  trong cả 5 bước (phát ngược đã tắt thật — seek lùi thuần), mỗi bước
  2,2–3,3 s, syncReseeks +0** (đang tạm dừng nên không có re-seek đồng
  bộ — đúng kỳ vọng). **Cổng `e2e-backward-seeks` PASS 5/5.**
- Tổng cổng chạy 2: **18/18 PASS** (log `headed-long180b.log`).

Bảng bucket chạy 2 (playhead lùi/10 s — đều ~9,4 s; heap median MiB;
cache GOP cuối bucket):

| Bucket | Playhead | Heap med | GOP cache (byte/seg/evicted) |
|---|---|---|---|
| 0–10 s | 180→170,9 (−9,1) | 19,2 | 1.625.257/3/0 |
| 10–20 s | 170,1→160,7 (−9,4) | 20,0 | 7.022.623/13/0 |
| 20–30 s | 160,1→150,2 (−9,9) | 24,9 | 12.993.022/24/0 |
| 30–40 s | 149,6→140,8 (−8,8) | 26,8 | 14.615.758/27/0 |
| 40–50 s | 140,1→130,4 (−9,7) | 28,9 | 16.263.202/30/5.382.824 |
| 50–60 s | 129,7→120,6 (−9,1) | 31,0 | 16.253.720/30/10.267.987 |
| 60–70 s | 120→110,5 (−9,5) | 36,7 | 16.775.623/31/14.615.758 |
| 70–80 s | 110→100,5 (−9,5) | 34,2 | 16.758.413/31/21.106.082 |
| 80–90 s | 99,9→90,4 (−9,5) | 34,3 | 16.773.188/31/25.986.008 |
| 90–100 s | 89,8→80,2 (−9,6) | 34,4 | 16.257.812/30/31.391.381 |
| 100–110 s | 79,6→70,7 (−8,9) | 35,6 | 16.270.331/30/37.334.353 |
| 110–120 s | 70,1→60,5 (−9,6) | 34,1 | 16.249.675/30/42.759.196 |
| 120–130 s | 59,9→50,6 (−9,3) | 34,1 | 16.236.376/30/47.649.193 |
| 130–140 s | 50→40,6 (−9,4) | 32,8 | 16.769.884/31/53.604.684 |
| 140–150 s | 39,9→30,5 (−9,4) | 31,9 | 16.775.819/31/58.473.374 |
| 150–160 s | 29,9→20,6 (−9,3) | 38,4 | 16.248.470/30/63.885.569 |
| 160–170 s | 20→10,5 (−9,5) | 40,6 | 16.259.663/30/70.374.568 |
| 170–180 s | 9,9→0,3 (−9,6) | 37,1 | 16.273.947/30/74.696.473 |
| 180–300 s | 0→0 (đỗ) | ~23,5 | 16.273.947/30/74.696.473 |

### 1.3 Sửa harness trong luồng này (2 lỗi tự tìm được)

1. **Bug D2 (chạy 1):** cú bấm "dừng phát ngược" không kiểm tra trạng
   thái — khi phát ngược đã tự dừng ở 0 thì bấm lại thành bật lại từ
   cuối (nhánh `playhead<=0.001` của `toggleReversePlayback`). Đã sửa:
   chỉ bấm khi `aria-pressed=true`, ghi rõ `aria-pressed` trước/sau;
   D2 tự End về cuối khi playhead ≤ 5; mỗi bước D2 ghi `revPressed`
   để chứng minh bước đó là seek thuần. Chạy 2 chứng minh sửa đúng
   (5/5, `revPressed=false` cả 5 bước).
2. **Chẩn đoán bucket:** lần chạy 1 chưa ghi `revPressed`/`idleTicks`
   vào bucket (đọc nhầm từ `heapSamples` thay vì `samples` — các field
   đó ở lần chạy 1 là `n/a`). Đã sửa: `heapSamples` nay mang
   `revPressed`/`idleTicks`/`idleSleeping`/`vis` — chạy 3 dùng để chẩn
   đoán nếu đóng băng tái hiện.

### 1.4 Lần đóng băng ở chạy 1 — CHƯA GIẢI THÍCH ĐƯỢC (ghi rõ, không bịa)

Bằng chứng gián tiếp cho thấy vòng preview đã NGỦ trong lúc đóng băng:
vòng preview chỉ ngủ khi `!playing` (`previewLoopShouldSleep`,
`apps/web/src/lib/previewLoop50F2.ts:53` — điều kiện đầu tiên là
`!s.playing`); heap về mức idle ~28–30 MiB; `__vcutReverseWc` và cache
GOP đóng băng (không frame nào được decode thêm). Nhưng KHÔNG tìm được
dòng code nào đặt `playing=false` ở playhead 163,8 trong lúc phát ngược:
nhánh duy nhất trong tick là `reachedStart` (playhead chạm 0 —
`preview.tsx:2524`), không áp cho 163,8; `stopPlayback` còn đặt playhead
về 0 (không khớp "đóng băng ở 163,8 trước, nhảy về 0 sau"). Cú nhảy
163,8→0 ở bucket 210–220 s cũng chưa rõ cơ chế (có thể là reload trang
do HMR fail rồi restore session playhead về 0 — App.tsx persist playhead
khi `pagehide`/tab ẩn, `App.tsx:305` — nhưng đây là suy đoán, chưa có
bằng chứng log nào ghi reload).
- Chạy 3 (vite dev, máy yên — xem §1.5) để tách 2 biến: nếu đóng băng
  tái hiện kèm lỗi HMR → nhiễu HMR; nếu chạy sạch → tải máy nặng ở
  chạy 1 (loadavg 10,5) là thủ phạm chính. Kết quả chạy 3: SẠCH 18/18,
  không đóng băng, 0 lỗi HMR — xem §1.5.

### 1.5 Chạy 3 — vite dev, máy yên: SẠCH 18/18 (tách biến)

Cùng giàn vite dev như chạy 1 (không dùng build tĩnh nữa) nhưng máy yên
lúc bắt đầu (loadavg ~1,1) và không còn file-churn mạnh. Kết quả:

- Phát ngược: playhead 180 → 0 trong ~178 s tường, đều ~9,4 s mỗi
  bucket 10 s (~0,95× realtime), về 0 ở bucket 170–180 s rồi đỗ ở 0.
  `revPressed=true→true`, `sleeping=false`, `idleTicks` tăng đều ~300
  mỗi bucket trong suốt lúc phát — vòng preview chạy liên tục, KHÔNG
  đóng băng. Sau khi về 0: `revPressed=false`, `idleTicks` đóng băng ở
  5028, `sleeping=true` — vòng ngủ đúng thiết kế khi đã dừng (đối
  chứng trực tiếp cho chữ ký "đóng băng" ở chạy 1: heap idle + stats
  đóng băng + ticks đứng yên = vòng đã ngủ vì `playing=false`).
- WebCodecs: hits +2614 / misses +2578 / fetches +4. Canvas 297 frame
  khác nhau, 0 mẫu đen. Hold draw +361 / hold +2202 / skip +22.
  0 uncaught exception, **0 console error (0 lỗi HMR)**.
- Blob chính `c07c3f41-718b`: **413 GET Range + 0 GET không Range**;
  toàn cục 429 request = 422 Range + 2 không Range (blob phụ). Cổng
  thu hẹp PASS.
- Cache GOP: 12 seg/6,5 MB (0–10 s) → 30 seg/~16,23 MB từ ~20–30 s,
  ghim trần 16 MiB; eviction bắt đầu bucket 30–40 s (6.486.121 byte),
  **tổng evicted 81.192.566 byte** cuối phiên (cao hơn chạy 2:
  74.696.473 — do decode nhanh hơn nên fetch/evict nhiều hơn trong
  cùng thời gian).
- Heap: baseline 23,24 → đỉnh 87,72 ở t=108,5 s (delta +64,48) →
  settled 41,48 MiB. RSS: baseline 1.600,39 → đỉnh 2.128,89 (delta
  +528,50) → settled 1.153,44 MiB. (Đỉnh heap cao hơn chạy 2 — overhead
  vite dev + decode nhanh hơn; settled vẫn về ~41 MiB.)
- STALL: 228 mẫu / 529 — lại là artefact đỗ ở 0 (114 s cuối), không
  phải khựng thật.
- Seek lùi D2: **5/5 PASS** lần thứ hai liên tiếp (180→175→170→165→
  160→155, mỗi bước 2,1–2,3 s, `revPressed=false` cả 5 bước).
- Tổng cổng chạy 3: **18/18 PASS** (log `headed-long180c.log`).

**Kết luận tách biến:** đóng băng ở chạy 1 KHÔNG phải do vite dev (chạy 3
cùng vite dev thì sạch). Còn lại 2 biến lẫn nhau ở chạy 1: tải máy nặng
(loadavg 10,5 — decode đói, heap dev cao) và HMR churn (51 lỗi reload).
Chưa có bằng chứng log nào ghi navigation/reload trong lúc đóng băng
(harness không bắt `Page.frameNavigated`), nên KHÔNG khẳng định cơ chế
gốc. Việc cần làm ở đợt sau (ghi cho parent/luồng nối tiếp, không làm
trong luồng này): thêm bắt `frameNavigated` + `document.visibilityState`
vào harness, hoặc tái hiện có kiểm soát dưới tải nặng (vd `stress` CPU)
để xem đóng băng có tái hiện không.

## 2. Siết moov giả ở tầng T3 — lớp (c) bố cục sample + nhất quán bảng (nợ 2)

### 2.1 Lớp mới

Sau demux + kiểm tra vượt-ngoài-file của I6 + kiểm stco-khớp-mdat và
AVCC sample đầu của J6, T3 nay kiểm thêm (chung cho cả stream-mode lẫn
all-mode — đặt trước khi chia mode, xem `gopRangeFetch39T3.ts` bước 5):

- **(a) Bố cục sample** — hàm thuần mới `validateSampleLayout` trong
  `mp4Demux.ts`: offset sample phải tăng dần theo thứ tự decode và các
  khoảng `[offset, offset+size)` không chồng lấn. Đây là bất biến của
  file MP4 hợp lệ (ISO 14496-12: stco liệt kê chunk theo thứ tự trong
  file, sample trong chunk nằm liên tiếp nhau, hai sample không chia sẻ
  byte). Khoảng TRỐNG vẫn hợp lệ (track khác xen kẽ trong cùng mdat),
  sample size 0 ở đúng cuối sample trước vẫn hợp lệ. Moov giả trỏ mọi
  sample về cùng offset, đảo thứ tự chunk, hay khai offset ngẫu nhiên
  đều lộ — mà không cần fetch thêm byte nào, không cần VideoDecoder,
  chạy được cả trong test Node.
- **(b) ctts nhất quán** — demux ghi lại `cttsTotal` (tổng số sample mà
  các entry ctts khai; null khi không có ctts) trên `Mp4VideoTrack`;
  T3 fallback khi `cttsTotal !== sampleCount`. Trước đây demux pad/cắt
  lặng lẽ về sampleCount. File hợp lệ luôn khớp đúng theo spec.
- **(c) stss trong khoảng** — demux đếm `stssOutOfRange` (số entry stss
  ngoài `[1, sampleCount]`) trên `Mp4VideoTrack`; T3 fallback khi > 0.
  File hợp lệ luôn bằng 0.
- Cả 3 đều chỉ fallback về `full-file` (vẫn phát được, chỉ chậm hơn),
  không ném lỗi — file lạ vi phạm bất biến thì chậm chứ không hỏng.
  Lý do fallback ghi rõ `demux-moov: … — moov giả?`.

### 2.2 Đo + đỏ-trước/xanh-sau

Test mới `apps/web/src/lib/gopFakeMoov54K8.test.ts` (builder MP4 tối
thiểu tự chứa, server HTTP Range thật, mẫu I6/J6): **18/18 pass**.

- Unit `validateSampleLayout` (9): rỗng ok; 1 sample ok; liên tiếp khít
  ok; khoảng trống (audio xen kẽ) ok; size 0 ở cuối sample trước ok;
  chồng lấn 1 byte → fail `/chồng lấn/`; offset lùi → fail `/lùi/`;
  offset âm → fail; size âm → fail.
- Demux ghi lại (3): control không ctts → `cttsTotal null`,
  `stssOutOfRange 0`; ctts khai 50/60 → `cttsTotal 50` (không ném);
  stss có 999 → `stssOutOfRange 1` (không ném).
- T3 thật qua server Range (6, cả stream + all mode): control 60 sample
  → `gop-range` cả 2 mode; chunk 2 bắt đầu 29032 (chồng 1 sample lên
  chunk 1) → `full-file` lý do `/chồng lấn/`; chunkOffsets `[30032, 32]`
  (đảo thứ tự) → `full-file` lý do `/lùi/`; mọi chunk trỏ về offset 32
  → `full-file` lý do `/lùi/`; ctts khai 50 nhưng stsz có 60 →
  `full-file` lý do `/ctts/`; stss có keyframe 999 → `full-file` lý do
  `/stss/`.
- **Đỏ-trước đã verify:** tạm gỡ khối K8 khỏi T3 (backup ở scratch),
  chạy lại: **13/18** — đúng 5 test T3-level fail, tất cả trả
  `gop-range` cho moov giả (unit + demux + control vẫn pass). Khôi phục
  file từ backup, chạy lại: **18/18**.

### 2.3 Không đổi hành vi file thật

- Hồi quy GOP đầy đủ (§4): tất cả xanh, I6 25/25, T3 10/10, F4 6/6.
- Chạy headed 2 lần trên file thật 180 s: `gopActive=true` suốt,
  `gopFallbackReasons=[]` cả 2 lần — lớp mới không fallback oan.
- File thật encode bằng ffmpeg/libx264: offset tăng dần, không chồng
  lấn, ctts (nếu có) khớp sampleCount, stss trong khoảng — đã kiểm
  chứng qua 2 lần chạy headed + hồi quy.

## 3. VideoDecoder trial-decode — đánh giá + vì sao chưa nối vào T3

### 3.1 Probe đo thật trong Chromium headed

Script `videodecoderProbe54K8.mjs` (+ `vdProbeSrc54K8.ts` bundle bằng
esbuild): serve fixture thật `trailing-real37.mp4` + trang probe, decode
thử bằng VideoDecoder thật với config từ avcC của track (`codec`,
`codedWidth/Height`, `description`). Chạy 2 lần (lần 1 dính 1 bug probe:
`dec.close()` trả undefined, không phải Promise — `.catch` ném lỗi
ngoài decode; đã sửa, lần 2 sạch). Kết quả lần 2 (log `vd-probe2.log`):

| Case | AVCC | VideoDecoder | Thời gian |
|---|---|---|---|
| A: sample 0 thật (keyframe IDR, 29.245 byte) | ok | **OK, ra frame** | **15,5 ms** (lần 1: 17,1 ms) |
| B: AVCC-đúng-cấu-trúc, H.264-rác (NAL type 1, payload ngẫu nhiên) | **ok (qua được!)** | **LỖI** "wasn't a key frame" | 0,5 ms |
| C: byte giữa NAL (moov giả trỏ lệch, kiểu RESIDUAL offset 1000) | fail ("NAL 0 dài 539828328 vượt sample còn lại 996") | LỖI "Unable to determine size of bitstream buffer" | 1,6 ms |

Phụ: demux trên file thật cho `sample0 = {offset 48, size 29245,
isKey true, codec avc1.64001F, samples 2160, cttsTotal 2160 (== đúng
sampleCount), stssOutOfRange 0}` — file thật qua sạch lớp K8 mới (§2).
`VideoDecoder` có sẵn trong Chromium headed (không có trong Node —
xem §3.2).

### 3.2 Kết luận đánh giá: decoder bắt được lớp AVCC không bắt được — nhưng chưa nối vào T3

- **Giá trị đã chứng minh:** case B là đúng lỗ hổng J6 §7.1 nêu: mẫu
  "AVCC-đúng-cấu-trúc nhưng bitstream rác" qua được lớp AVCC (chỉ kiểm
  length-prefix) nhưng VideoDecoder chặn trong 0,5 ms. Trial-decode
  sample đầu (~15–17 ms gồm configure+decode+flush cho frame 720p)
  là rẻ so với 1 lần load file lớn.
- **Vì sao chưa nối vào T3 trong luồng này (quyết định có cân nhắc):**
  1. `fetchVideoTrackByGopRange` là hàm đồng bộ về mặt fetch/luồng dữ
     liệu (trả meta ngay ở stream-mode); nhét một lần decode bất đồng
     bộ (tạo `VideoDecoder`, chờ `flush`) vào giữa đường fetch sẽ đổi
     chữ ký/thời gian của bước 5, và mọi caller + test Node hiện tại
     đều không có VideoDecoder — cần thêm một lớp trừu tượng
     "decode-probe" (inject được, fail-open khi không có decoder) thì
     mới nối an toàn. Đó là một thay đổi kiến trúc nhỏ, không nên làm
     vội trong cùng luồng với lớp thuần (c) đã đủ giá trị.
  2. Decoder + controller fallback VẪN là cửa cuối như cũ: file qua
     được T3 nhưng decode hỏng thì controller fallback về full-file /
     element-seek (đã có từ trước, không phải nợ mới).
  3. Rủi ro false-positive: một số file H.264 hợp lệ nhưng decoder của
     máy người dùng không hỗ trợ profile (vd High 4:4:4) có thể bị chặn
     oan ở T3 nếu nối trial-decode mà không fail-open cẩn thận.
- **Đề xuất cho đợt sau:** nối trial-decode vào T3 sau một interface
  `tryDecodeFirstSample` (inject qua opts, mặc định fail-open khi
  `typeof VideoDecoder === "undefined"`), chỉ chạy ở stream-mode sau
  khi đã fetch sample đầu (tái dùng đúng request `"sample"` của J6,
  không thêm fetch), timeout ~200 ms, lỗi decode → fallback
  `full-file` với lý do rõ ràng; test Node dùng probe giả lập (mock
  trả ok/error) + 1 test headed thật tái dùng probe này.

### 3.3 Rủi ro dư (vẫn còn, ghi rõ)

- Moov giả SAO CHÉP Y NGUYÊN bảng sample thật nhưng sửa timestamp
  (stts) thì qua được TẤT CẢ các lớp T3 hiện có (bounds I6, mdat J6,
  AVCC J6, bố cục K8 — bố cục đúng vì bảng sample là bảng thật). Cửa
  cuối vẫn là decoder (decode ra frame sai thời gian / lỗi) + controller
  fallback. Chặn triệt để cần decode thử frame đầu bằng VideoDecoder
  trong T3 (đã đo khả thi ở §3.1, chưa nối — xem §3.2) hoặc đối chiếu
  hash sample.
- File nhiều mdat mà mdat thứ hai nằm ngoài tiền tố 512 KiB: kiểm
  stco-khớp-mdat (J6) vẫn fallback oan về full-file (nợ J6 §7.2, giữ
  nguyên).
- Sample size 0 nằm GIỮA khoảng của sample trước (không ở đúng cuối):
  `validateSampleLayout` sẽ báo chồng lấn → fallback oan về full-file
  (vẫn phát được). File hợp lệ thực tế không có dạng này (sample rỗng
  nằm ở biên chunk); ghi để đợt sau cân nhắc nới lỏng cho size 0.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round54-k8/run-regression.sh`,
  esbuild bundle + node): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10, E2blob
  8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, **K8 18/18**,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11,
  D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35. **Fail 0.**
- Hồi quy seek (chạy độc lập bằng `node --experimental-strip-types`):
  seek 15/15, seekSeekable53J6 13/13, pauseSeekRecovery43Y2 9/9,
  pause45A2 14/14 — cộng **51/51, fail 0**.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build` (outDir scratch `~/scratch-round54-k8/build`): **pass**
  trong 27,48 s; chỉ cảnh báo chunk > 500 kB có sẵn.
- Headed: chạy 1 (vite dev, tải nặng) 17/18 — FAIL duy nhất là cổng
  seek lùi do bug harness (§1.1/§1.3); chạy 2 (build tĩnh, máy yên)
  **18/18**; chạy 3 (vite dev, máy yên) **18/18** (§1.5).

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/mp4Demux.ts` — thêm `validateSampleLayout` (hàm
  thuần, §2.1a); demux ghi `cttsTotal` / `stssOutOfRange` lên
  `Mp4VideoTrack` (field optional, §2.1b/c); không đổi logic parse cũ,
  không đổi giới hạn MAX_MP4_SAMPLES.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm lớp kiểm tra K8 sau
  demux (trước khi chia mode, áp cả stream + all): layout + ctts +
  stss (§2.1); cập nhật comment bước 5; import thêm
  `validateSampleLayout`. Không đổi gate/probe/prefix/tail-scan,
  không đổi kiểm AVCC/mdat.

ĐỔI (config):

- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền lệ
  J6: test import đuôi `.ts` nên tsc báo TS5097 nếu không exclude).

MỚI:

- `apps/web/src/lib/gopFakeMoov54K8.test.ts` — 18 test lớp chặn mới
  (§2.2).
- `docs/PHASE9_ROUND54_K8_GOP_LONG_REVERSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file production khác, `preview.tsx`, `store.ts`,
`seek.ts`, `reverseWebcodecs.ts`, `gopCache40V2.ts`, i18n. Scratch +
log ở `~/scratch-round54-k8/` (harness, reg/, headed-*.log, build/,
probe) và bằng chứng ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/`.

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Moov giả sao chép y nguyên bảng sample thật nhưng sửa timestamp**
   (§2.3/§3.3): mọi lớp T3 đều qua được; cửa cuối là decoder +
   controller fallback. Nối trial-decode VideoDecoder vào T3 là việc
   của đợt sau (đã đo khả thi, xem §3).
2. **Cơ chế gốc lần đóng băng ở chạy 1 chưa xác định** (§1.4): đã loại
   được bug harness D2 và loại được "do vite dev" (chạy 3 cùng vite dev
   thì sạch); còn lại 2 giả thuyết (tải máy nặng vs HMR churn) lẫn nhau.
   Việc nối tiếp: thêm bắt `Page.frameNavigated` + ghi
   `document.visibilityState` vào harness, hoặc tái hiện có kiểm soát
   dưới tải nặng để xem đóng băng có tái hiện không.
3. **"155 + http chunked" vẫn NOT_MEASURED** (nợ I8 §4, giữ nguyên).
4. **Cutoff `buffered [[0,2.367]]` chưa giải thích** (nợ J6 §4, giữ
   nguyên).
5. **Guard seekable chưa có đo headed trên app thật** (nợ J6 §7.6, giữ
   nguyên).
6. **`e2e-wc-frames` ở chạy 2 PASS (+2547)** — khác J6 (fail 2/2, hits
   +0/+6): ngưỡng hits ≥10 đạt được dễ dàng khi máy yên + file dài
   (cửa sổ quan sát dài hơn). Nợ J6 §7.9 coi như có thêm bằng chứng:
   hits thấp ở J6 là do máy tải nặng + cửa sổ 30 s, không phải bộ đếm
   hỏng — nhưng chưa chạy lại đúng cấu hình J6 (file 72 s, 30 s) nên
   không khẳng định tuyệt đối.
7. **Số đo under-load / build tĩnh**: chạy 2 đo trên bản build tĩnh
   (không phải vite dev như người dùng chạy) và máy yên; tốc độ tuyệt
   đối (~0,94×) chỉ có ý nghĩa tương đối trong cùng lượt. Chạy 3
   (vite dev) là số gần với dev hơn — xem §1.5.
8. **Media-dur trên card hiện "00:04.0"** trong log harness (cả 2 lần
   chạy): selector `.media-card .media-dur` lấy card ĐẦU TIÊN trong
   DOM (clip mẫu của project mẫu) chứ không phải card file 180 s —
   quirk của harness, không phải bug sản phẩm (duration project đọc từ
   `.time-display` vẫn đúng 180 s). Chưa sửa selector.
