# Phase 9 đợt 66 — T6: keyframe 64,0 MiB đầy đủ + click-test toast timeout

Ngày đo: 2026-11-08 (UTC). Máy đo: VM Linux 2 vCPU / 8 GB, không GPU.
Đóng nợ `docs/PHASE9_ROUND65_LIMITS.md` §8 mục 5 (keyframe 64,0 MiB — lớn
nhất trước đây 63,54 MiB — đo trực tiếp + click-test toast timeout trong
app thật).

## 1. Fixture: clip đúng 64,0 MiB

- Gốc: `bigkey-8192-sf-crf1-noise100-50.mp4` (đợt 65 S6) — H.264 High,
  8192×4320, 3 frame, 0,1 s, sample0 66.633.949 B = 63,54 MiB.
- Đệm bằng `pad-keyframe.py`: nối filler NAL H.264 type 12, payload 0xFF
  (padding CBR chuẩn, decoder phải bỏ qua theo H.264 §7.4.2.1) vào cuối
  sample 0 → `bigkey-64mib.mp4`: **sample0 đúng 67.108.864 B = 64,0 MiB**
  (xác minh qua hộp `stsz`, không chỉ ffprobe), file 69.921.380 B,
  framemd5 **3/3 frame giống hệt bản gốc**.
- Clip dài 70 s `bigkey-64mib-70s.mp4` = concat (ffmpeg `-c copy`,
  `+faststart`) của clip 0,1 s + `seg2-flat-70s.mp4` (màu phẳng
  0x1a1a1a, crf 1, superfast, `-g 30`, 8192×4320, 70,000 s, 2100 frame).
  **Lưu ý:** ffmpeg concat cộng thêm 41 B vào sample đầu (lần nối đầu
  cho 67.108.905 B) — đã bù bằng cách đệm clip 0,1 s tới 67.108.823 B
  trước khi nối; kết quả cuối **sample0 đúng 67.108.864 B (stsz)**,
  duration 70,100 s, 2103 frame, 72.382.746 B.
- Codec/profile: H.264 High, `avc1.64003C`, 8192×4320, yuv420p.
- Fixture nằm ở `~/scratch-round66-t6/` (không commit, không push).

## 2. Đo trực tiếp keyframe decode ở 64,0 MiB (headed probe, lần 2)

Harness `vdHeaded66T6.ts` + `runHeaded66T6.mjs` (bundle esbuild probe TS +
worker, Xvfb, CDP; endpoint `/hogs` + `/encode`; kết quả
`result-66t6.json`).

- Chờ yên 200 s (`quietReached: true`, loadavg sau chờ 2,48).
- Hiệu chuẩn CPU (vòng 50M): 6.985,4 ms lúc yên → 11.467,2 ms cuối
  (chậm 1,64× dưới tải nặng).

### Phase A — tải thấp

| Đo | Kết quả | loadavg lúc đo |
|---|---|---|
| Direct RTD (worker, timeout 240 s) lần 1 | **40.408,6 ms — 0,617 ms/KiB**, decode OK | 1,15 |
| Direct RTD lần 2 | **50.345,7 ms — 0,768 ms/KiB**, decode OK | 0,79 |
| Capped plan (trần 60 s) | **48.513,6 ms, passed, `decode-ok`** | 3,38 |
| T3 stream (128 chunk 512 KiB) | `gop-range`, không note, 53.705,3 ms | 8,02 |
| Controller tải thấp | `gop-range`, không note, 63.991,1 ms | 11,31 |

Kết luận phase A: **decode 64,0 MiB ở tải thấp mất 40–50 s
(0,62–0,77 ms/KiB), dưới trần 1,2 ms/KiB và dưới trần worker 60 s**
(biên còn ~11,5 s ở capped plan). Không chạm trần, không fail-open —
trial thành công, T3 đi `gop-range`.

**Trung thực:** loadavg tăng dần trong lúc chạy phase A (0,79 → 11,31)
do các luồng khác bắt đầu việc; chỉ hai lần direct decode (số đo thuần
nhất) chạy ở tải thật thấp (0,79–1,15). Capped/T3/controller chạy dưới
tải đang tăng — số của chúng là cận trên, không phải số tải thấp thuần.

### Phase B — nặng (4 hog + 1 encode, loadavg ~11,5–11,8)

- Controller: `gop-range`, elapsed 71.535,9 ms.
- **Trial timeout ở 60 s, note đã set:** `timeout-60000ms: trial-decode
  chưa xong, cho qua (fail-open)` — có trong `registryNotes` và
  `toastSeen`. **Fail-open hoạt động đúng ở 64,0 MiB:** controller vẫn
  đi `gop-range` (không fallback full-file), file vẫn mở bình thường.

### Phase C — nặng hơn (4 hog + 2 encode, loadavg ~13,6)

- Controller: `gop-range`, elapsed 72.972,3 ms.
- Cùng note timeout + `registryNotes` + `toastSeen`. Fail-open đúng.

### Probe lần 1 bị treo (ghi lại, không giấu)

Lần chạy probe đầu tiên treo sau phase A: renderer của trang probe
không đáp CDP (kể cả `Runtime.evaluate 1+1` sau 60 s), CPU ~0, thread
chờ ở `futex_do_wait` — trang không chạy gì nữa nhưng cũng không chết.
Đã kill toàn bộ (runner + Chrome + hogs + encodes) và chạy lại lần 2,
lần 2 chạy sạch hết 3 phase. Nguyên nhân chưa xác định (nghi Chrome
renderer bị freeze dưới tải cực nặng); **không phải lỗi sản phẩm**
(trang probe treo, không phải app) và không tái hiện ở lần 2. Runner
đã được vá để ghi partial ra đĩa mỗi phút (`result-66t6-partial.json`)
để lần sau treo cũng không mất số phase A.

## 3. Click-test toast timeout trong app thật (headed, PASS)

Snapshot dist `index-BQTqiuaq.js` (build 13:15 UTC, có fix §4), Xvfb
:209, port 4209. Toast kỳ vọng (đúng từng ký tự):
> "Keyframe đầu (64.0 MiB) chưa kiểm chứng kịp trong 60000 ms — file vẫn
> mở bình thường, chỉ là bước kiểm tra keyframe chưa xong."

| Lượt | Điều kiện | Kết quả |
|---|---|---|
| **H** | clip 70 s, nặng 4 hog + 2 encode, poll 180 s | **toast timeout THẤY ở +85.970 ms** (86,0 s); engine `webcodecs` |
| **C** | clip 70 s, tải thấp, poll 120 s | **không thấy toast timeout** (đúng kỳ vọng) |
| **S** | clip 0,1 s, nặng, poll 90 s rồi bấm toggle decode-ahead | **không thấy toast trong 90 s** (phát ngược dừng ở 0,1 s → loop ngủ); **sau khi bấm toggle, toast THẤY ở +0,6 s** |

Cả 3 lượt PASS (`H=true C=true S=true`, `clicktest-66t6-toast.json`).

Ghi chú:

- H: loadavg 1 phút lúc bấm Phát ngược chỉ 2,00 (hogs mới bật 8 s
  trước, trung bình 1 phút chưa kịp lên) — nhãn "nặng" chỉ 4 hog + 2
  encode đang chạy, không phải loadavg. Toast ở +86 s = T3 fetch 128
  chunk (~20 s dưới tải) + timeout trial 60 s + vài giây chờ tick
  refresh. Thời điểm nằm trong cửa sổ kỳ vọng +55–120 s.
- Toast "Bridge không chạy (http://127.0.0.1:8787) — proxy tự động thất
  bại…" xuất hiện ở +0,7 s (H), +2,6 s (C), +1,2 s (S) là toast khác,
  không liên quan (snapshot không chạy bridge nên auto-proxy fail —
  hành vi đúng, không chặn import).
- Lượt S còn hiện thêm toast cổng decode-ahead ("Decode-ahead bị cổng
  chặn: chưa đo hardware decode…") sau toggle — cũng không liên quan
  tới timeout, chỉ là thông báo cổng.
- **Giới hạn đã chứng minh:** toast timeout chỉ hiện khi phát ngược
  đang chạy (refreshDecodeAheadUi chạy mỗi rAF tick) hoặc khi bấm
  toggle. Clip ngắn hơn ~60 s thì user không thấy toast trong lúc phát
  — phải tới lần refresh tiếp theo (bấm toggle / phát lại) mới thấy.

## 4. Blocker phát hiện khi click-test: import treo vì thumbnail (đã sửa)

Click-test lần đầu kẹt ở import: clip 64 MiB không hiện trong MediaBin
sau 150 s (debug import riêng: **>240 s vẫn "Chưa có file nào"**).
Nguyên nhân: `captureVideoThumb()` trong `apps/web/src/media.ts` chờ
`onloadeddata` của `<video>` **không có timeout** — decode keyframe
64,0 MiB 8K bằng `<video>` trên CPU yếu cực chậm (renderer vẫn decode,
8,3% CPU, 16 s CPU sau 3 phút, chưa xong), nên `fileToMediaItem()` treo
vĩnh viễn và import không bao giờ xong. Trong khi đó
`lib/thumbnails.ts` (pipeline thumbnail của timeline) đã có
`LOAD_TIMEOUT_MS = 5000` cho cùng thao tác.

**Sửa (product, tối thiểu):** thêm timeout 5 s cho `loadeddata` trong
`captureVideoThumb()` (đồng bộ với `thumbnails.ts`); hết hạn thì
`v.src = ""` để dừng decode dở và trả `undefined` (bỏ thumbnail),
import vẫn tiếp tục. Sau sửa: import clip 64 MiB mất **7,9–10,4 s**
(trước đó >240 s / không xong).

**Hệ quả hành vi:** thumbnail của video decode frame đầu chậm hơn 5 s
nay bị bỏ qua (trước đây chờ vô hạn). Timeline thumbnail pipeline đã
dùng cùng mốc 5 s nên đây là hành vi nhất quán, không phải ngoại lệ.

Test mới `apps/web/src/media.captureThumb66T6.test.ts` (**2/2 PASS**,
shim DOM theo mẫu của repo):
- T6a: `loadeddata` không bao giờ bắn → `fileToMediaItem` resolve
  trong ~5 s, duration đúng 70,1, thumbnail `undefined`.
- T6b: `loadeddata` bắn → vẫn có thumbnail (không hồi quy).

## 5. Kiểm chứng

- Keyframe: **63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9**
  (test mới T6: cap đúng 67.108.864 + 128 chunk; routing đúng cap →
  worker/60000 ms; note dict vi/en đúng chuỗi "64.0 MiB … 60000 ms";
  T3 stream đúng cap 129 request sample; cap+1 → probe không gọi).
- Thumbnail timeout: **captureThumb66T6 2/2**.
- Hồi quy đợt 2: tất cả suite xanh, trừ O6 17/18 (1 test nhạy tải —
  baseline đơn mẫu lệch dưới tải). **Chạy lại O6 lúc máy yên: 18/18.**
- `tsc`: web 0, desktop 0 (sau khi sửa `media.ts` + thêm 2 test).

## 6. Nợ / giới hạn còn lại

- **Safari vẫn chưa đo được** (không có binary/WebKit trên VM Linux).
- Trần worker 60 s ở 64,0 MiB chỉ còn biên ~11,5 s ở tải thấp; dưới tải
  nặng trial timeout là hành vi thiết kế (fail-open), không phải lỗi.
- Probe lần 1 treo không rõ nguyên nhân (xem §2); nếu tái hiện thì cần
  điều tra riêng, nhưng lần 2 chạy sạch nên không chặn kết luận.
- O6 nhạy tải theo thiết kế (baseline đơn mẫu); cần chạy lúc máy yên
  để có 18/18.
- Toast timeout chỉ hiện khi phát ngược đang chạy hoặc khi bấm toggle
  (xem §3) — với clip ngắn hơn 60 s, user không thấy toast ngay trong
  lúc phát.
- `dist/` đã build lại lúc 13:15 UTC để snapshot có fix §4 (không
  stage, không push — theo luật stage-only).
