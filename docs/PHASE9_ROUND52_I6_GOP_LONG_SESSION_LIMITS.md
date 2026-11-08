# Phase 9 — Đợt 52, luồng I6: GOP streaming — phiên lùi dài + moov giả + settled heap

Ngày đo: 2026-11-07 (khung cron 00:35–~03:35 +07). Nợ đợt 51 §4.4
(`docs/PHASE9_ROUND51_LIMITS.md` §2.4/§4.4, `docs/PHASE9_ROUND51_H4_GOP_HEAP_LIMITS.md`).

Phạm vi: chỉ `gopRangeFetch` / `gopCache` / `reverseWebcodecs` / tail-scan + test + doc này.
Không push, không release/tag. Không code giả — mọi con số dưới đây đều đo thật.

Fixture dùng chung cho mọi phép đo headed: `trailing-real37.mp4` (tái dùng đợt 47 C5):
38.996.431 byte (37,19 MiB), 1280×720 30 fps 72 s, 2.160 frame, `-g 30`, moov ở EOF,
không faststart. Môi trường: VM 4 CPU / 8 GB RAM, Chromium Playwright 1248
(Chrome 156), headed qua Xvfb, `--disable-gpu`, decode phần mềm.

## 1. Phiên lùi dài — trần cache 16 MiB (H4 chốt)

Harness `gopHeaded52I6.mjs` (bản sao harness H4, OBS 150 s, bucket 10 s, mẫu 500 ms).
Chạy `long16a`: vite :5174, bridge :8793, debug :9392, Xvfb :96. Lúc bắt đầu
loadavg 6,99, giữa đợt vọt tới 23 — máy đang tải nặng (các luồng đợt 52 khác chạy song song).

- Playhead 72 → 2,9 s: **lùi 69,1 s trong 150 s tường (0,46× realtime)**, liên tục,
  không về tới 0. `gopActive=true` suốt phiên, `gopFallbackReasons=[]`.
- WebCodecs: hits +71, misses +719 (decode đói vì tải nặng). Canvas 104 frame khác nhau,
  0 frame đen. Hold draw +91 / hold +601 / skip +29. 0 uncaught exception, 0 console error.
- **Cache 16 MiB — eviction CÓ cắn trong phiên dài** (H4 đo 60 s chưa thấy):
  byte 0 → 1,6 MiB (10–20 s) → 4,85 MiB (30–40 s) → 9,2 MiB (40–50 s) →
  13,5 MiB (70–80 s) → 15,17 MiB (80–100 s, 28 seg) → 16,28 MiB (110 s+, 30 seg).
  `evictedBytes` = 0 tới ~110 s, rồi 1.072.547 (110–120 s), 2.678.785 (120–130 s),
  **4.317.300 cuối phiên (140–150 s)**. Trần đoạn (32 seg) không chạm tới (tối đa 30 seg).
- Heap (usedJSHeap): baseline 22,60 MiB (sau gc, trước phát ngược; RSS 1.462,96 MiB)
  → đỉnh 57,54 MiB ở t=114,6 s (delta +34,94; RSS đỉnh 2.074,09, delta +611,13)
  → **settled 40,72 MiB sau gc + dừng** (delta +18,12 so với baseline).
- Stall: **0 mẫu playhead đứng yên** (500 ms, 128 mẫu); khựng dài nhất 0 ms.
  Decode đói nhưng playhead không đóng băng ở tần suất mẫu này.
- Cổng E2E: **16/17 pass**. FAIL duy nhất `e2e-no-full-file-get` (xem §5).

Bảng bucket (long16a): cache tăng đều tới ~15,2 MiB ở 80–100 s rồi ghim ~16,28 MiB;
eviction chỉ bắt đầu sau ~110 s. Tốc độ lùi chậm dần về cuối phiên (1,8–3,9 s/bucket
sau 90 s so với 5–7 s/bucket đầu) — một phần do tải máy, một phần do eviction
buộc fetch lại segment đã đuổi.

## 2. Đối chứng trần 8 MiB (long8a)

Script `flip-cap8-run.sh`: flip `GOP_CACHE_MAX_BYTES` 16→8 trong
`apps/web/src/lib/gopCache40V2.ts`, chạy headed 150 s, khôi phục về 16 qua trap.
Lần 1 bị `timeout 280` giết ngay trước khi hết phase phát ngược (đã tới baseline);
chạy lại với timeout 420, hoàn thành trong 277 s. **Trần đã khôi phục về 16 MiB,
verify bằng grep + test H4 assert hằng 16 MiB (8/8 pass, xem §7).**
Chạy long8a: vite :5175, bridge :8794, debug :9393. Lúc bắt đầu loadavg 0,74
(máy nhẹ tải hơn long16a rất nhiều — xem lưu ý đối chứng bên dưới).

- Playhead 72 → 0 s: **lùi trọn 72 s trong ~110 s** (0,65×), rồi đỗ ở 0 trong 30 s cuối.
- WebCodecs: hits +114, misses +827. Canvas 115 frame khác nhau, 0 frame đen.
  Hold draw +107 / hold +671 / skip +51. 0 uncaught exception, 0 console error.
- **Eviction cắn sớm và mạnh hơn hẳn:** `evictedBytes` = 0 tới ~30 s, rồi
  2.149.793 (30–40 s), 4.315.744 (40–50 s), 6.469.998 (50–60 s), 8.103.406 (60–70 s),
  10.264.510 (70–80 s), 12.437.376 (80–90 s), 14.605.880 (90–100 s),
  **16.244.324 cuối phiên** — gấp ~3,8× so với trần 16 MiB (4.317.300).
  Cache ghim ~8,11–8,14 MiB / 15 seg từ ~30 s trở đi (trần 8 MiB ràng buộc thật).
- Heap: baseline 22,83 MiB → đỉnh 66,09 MiB (delta +43,26) →
  **settled 35,07 MiB** (delta +12,24). Settled THẤP hơn trần 16 (40,72) —
  khớp với cache giữ ít hơn; đỉnh CAO hơn (66,09 so với 57,54) nhiều khả năng
  là nhiễu do thời điểm GC / buffer decode, không quy cho trần.
- "STALL: 60 mẫu playhead đứng yên, khựng dài nhất 30.000 ms" — **KHÔNG phải khựng thật:**
  playhead đã về 0 ở ~110–115 s và đỗ ở đó 30 s cuối (= 60 mẫu × 500 ms).
  Đây là artefact của phép đo khi phát ngược hoàn thành trước khi hết OBS.
- Cổng E2E: **16/17 pass**, cùng 1 FAIL `e2e-no-full-file-get` (xem §5).

### So sánh 16 MiB vs 8 MiB

| | 16 MiB (long16a) | 8 MiB (long8a) |
|---|---|---|
| Playhead lùi trong 150 s | 69,1 s (72→2,9) | 72 s trọn (72→0, về 0 ở ~110 s) |
| evictedBytes cuối phiên | 4.317.300 | 16.244.324 |
| Eviction bắt đầu | ~110 s | ~30 s |
| Cache cuối | 16.284.050 byte / 30 seg | 8.112.323 byte / 15 seg |
| Heap baseline → đỉnh → settled | 22,60 → 57,54 → 40,72 | 22,83 → 66,09 → 35,07 |
| wc hits / misses | +71 / +719 | +114 / +827 |
| Canvas frame khác nhau | 104 | 115 |
| Cổng E2E | 16/17 | 16/17 |

**Lưu ý đối chứng:** long16a chạy dưới tải nặng (loadavg 6,99→23), long8a chạy lúc máy
nhẹ (loadavg 0,74 lúc bắt đầu). Tốc độ lùi nhanh hơn ở đợt 8 MiB KHÔNG quy được
cho trần cache — gần như chắc chắn do tải máy. Điều quy được cho trần là:
eviction bắt đầu sớm hơn (~30 s so với ~110 s), tổng evicted gấp ~4×, cache ghim
ở đúng trần, settled heap thấp hơn ~5,6 MiB. Trần 8 MiB "cắn" đúng như H4 dự đoán,
nhưng không làm hỏng phiên: phát ngược vẫn hoàn thành trọn 72 s, 0 lỗi trang.

## 3. Tail-streaming moov giả (H4 §5.3)

### Lỗ hổng thật tìm được trước khi sửa (probe ở `~/scratch-round52-i6/`, ~00:50–01:05 +07)

1. **Allocation bomb trong `parseMp4VideoTrack` (`mp4Demux.ts`) — THẬT, cả 3 biến thể OOM:**
   moov chế tác với `stts`/`stsz`/`ctts` count = 0xFFFFFFFF khiến parser push hàng tỉ
   entry trước mọi kiểm tra độ dài. Trong tiến trình con `--max-old-space-size=256`,
   timeout 30 s, cả 3 đều chết `FATAL ERROR: Reached heap limit / JavaScript heap
   out of memory`, exit 134, sau ~9–12 s (B1-stsz-fixed, B2-stts, B3-ctts).
   Tới được qua tail-scan lẫn qua controller load toàn file
   (`reverseWebcodecs.ts:1110` cũng gọi `parseMp4VideoTrack`).
2. **Moov giả lồng nhau (kịch bản H4 §5.3) — THẬT, xác nhận trước sửa:**
   file chế tác 5.061.286 byte; moov thật 5.001.254 byte bắt đầu ~4,77 MiB trước EOF,
   moov giả 619 byte là child cuối cùng, kết thúc đúng tại EOF, stco giả = 100.000.000
   (vượt EOF). Stream mode trả `gop-range` với 10 sample,
   `gopMeta=[{rangeStart:100000000, rangeEnd:100010000}]`, tail request 2×2 MiB.
   Mode all đã fail-closed (`gop-0-out-of-file: rangeEnd 100010000 vượt tổng 5061286`).
3. **Biến thể dư (moov giả trỏ VÀO trong file, offset 1000 trong mdat):**
   stream mode cũng trả `gop-range` (10 sample, firstOffset 1000) — không kiểm tra
   mức byte nào phân biệt được với moov thật nếu không decode; decoder + controller
   fallback là cửa chặn còn lại. KHÔNG sửa được ở tầng T3; ghi là rủi ro dư đã biết.

### Guard đã thêm

- `apps/web/src/lib/mp4Demux.ts`: thêm `MAX_MP4_SAMPLES = 1_000_000` (export;
  ~9,3 giờ ở 30 fps / 4,6 giờ ở 60 fps; fixture thật lớn nhất là 2.160 sample).
  Chặn: stts kiểm tra tổng dồn trước vòng push trong; stsz kiểm tra `sampleCount`
  ngay sau khi đọc; ctts vòng trong chặn ở `sampleCount`.
- `apps/web/src/lib/gopRangeFetch39T3.ts`: kiểm tra sample-bounds sau demux
  (chỉ khi `knownSize !== null`): sample nào có `offset < 0` hoặc
  `offset + size > knownSize` → fallback
  `demux-moov: sample ${si} vượt ngoài file (offset ${offset}+${size} > tổng ${knownSize})`.
  Cập nhật comment bước 5.

### Đo sau sửa (~01:05 +07)

- B1 ném `stsz: số sample 4294967295 vượt giới hạn 1000000` trong 94 ms, heap 7,9 MiB;
  B2 ném `stts: tổng số sample 4294967295 vượt giới hạn 1000000` trong 10 ms;
  B3 parse OK 10 sample trong 3 ms.
- Moov giả lồng OOB giờ `full-file` ở CẢ stream và all mode với lý do
  `demux-moov: sample 0 vượt ngoài file (offset 100000000+1000 > tổng 5061286)`.
- Biến thể dư (giả trỏ vào trong file) vẫn `gop-range` — như kỳ vọng, xem §3.3.

### Test mới: `apps/web/src/lib/gopFakeMoov52I6.test.ts` — 17/17 pass

Tự chứa: builder MP4 tối thiểu viết tay (ftyp/mdat/moov với mvhd/trak/avc1/stbl) +
server HTTP Range thật. Bao phủ: file trailing control → gop-range 60 sample/2 GOP;
moov giả lồng OOB → full-file `/vượt ngoài file/`; moov giả nhìn thấy được (pad 1 MiB)
→ moov thật thắng (60 sample); moov giả độc lập OOB → full-file;
RESIDUAL-KNOWN moov giả trỏ vào trong file → vẫn gop-range (khóa hành vi hiện tại,
không phải phê duyệt); bomb stsz/stts → full-file `/vượt giới hạn/` nhanh (<5 s,
heap ~9 MiB); bomb ctts → demux trả 10 sample; 9 unit test `findTrailingMoov`
(size vượt EOF, size < header, size == 0, largesize vượt EOF, size vượt maxMoovBytes
→ `tail-scan-moov-too-large`, children không lát kín, thiếu trak, thiếu mvhd,
hậu tố rác). Lưu ý: file tầng T3 dùng mdat ≥600 KiB để moov nằm ngoài prefix 512 KiB
và đi qua tail-scan thật (file trailing nhỏ bị chặn ở cổng theo thiết kế, theo B4).
**Red-before đã verify:** cùng file test chạy trên source revert máy móc
(đã gỡ guard) trong `~/scratch-round52-i6/redcheck/`: control ✓, moov giả lồng OOB ✗,
moov giả nhìn thấy ✓, moov giả độc lập ✗, residual ✓, rồi tiến trình chết OOM
exit 134 ở test bomb stsz.

### Rủi ro dư (đã biết, chưa sửa)

- Moov giả trỏ vào trong file (offset/size nằm trong giới hạn file) vẫn được chấp nhận
  ở tầng T3; cửa chặn còn lại là decoder + controller fallback. Muốn chặn triệt để
  cần decode thử 1 sample hoặc kiểm tra `stco`/`stsz` khớp vùng mdat — việc của đợt sau.

## 4. Settled heap +37 MiB sau import — điều tra cơ chế

### 4.1 Phép đo trên app thật (idle-decay sau import, cả 2 đợt)

Baseline trước import ~20,7–20,8 MiB (ổn định, drift +0,16). Sau import:
t=0 s 20,74 → t=1,7 s **57,9** → 58,1–58,3 tới t=8,8 s →
**t=9,9 s rơi về 20,8 KHÔNG cần gc() ép** (gc chỉ gọi ở t=0 và t=30) →
giữ 20,8–21,3 tới t=61,6 s (drift chậm +0,5). Đợt long8a tái hiện đúng:
58,8–59,2 (t=1,4–8,6 s) → 21,7 ở t=9,7 s. Baseline trước phát ngược (sau decay +
thêm clip + seek End): 22,60 MiB (long16a) / 22,83 MiB (long8a).

Kết luận từ app: transient +37 MiB **tự rơi ở ~10 s nhờ GC tự nhiên**; cửa sổ 10 s
của H4 kết thúc ngay trước điểm rơi nên H4 báo là nó "giữ". Đây không phải leak.

### 4.2 Đường import trong code (đọc code, ~00:45 +07)

`fileToMediaItem` (`apps/web/src/media.ts`) → `URL.createObjectURL(file)` →
`probeVideo` (video, `preload="metadata"`) → `captureVideoThumb` (video,
`preload="auto"`, seek 0,5 s, drawImage ra canvas 160×90, rồi `v.src=""`) →
store ingest sau khi tên ổn định (`store.ts` → `ingestImportedItemWithProgress` →
`AssetStore.ingestWithProgress` → `sha256Hex(input)` → `await data.arrayBuffer()` —
**toàn bộ file 37 MiB vào một JS ArrayBuffer** để băm SHA-256 (cả 2 đường ingest;
≤64 MiB dùng WebCrypto một lần) → `bStore.put(input, assetId)` (Blob/File vào IDB).
Nghi phạm chính cho transient +37 MiB là `arrayBuffer()` trong `sha256Hex`
(`apps/web/src/lib/assetStore.ts:149`).

### 4.3 Thí nghiệm cô lập 4 arm (page tối giản, Chrome headed, fixture 37 MiB thật)

Page `heapIsoHeaded52I6.mjs`: baseline 6 s → hành động → đo phân rã 30 s, mẫu 1 s/lần
(GC tự nhiên thuần túy — xem §6 về việc `window.gc()` trong page). Kết quả
(base median cả 4 arm đều 0,66 MiB used / total ~1,25–1,5 MiB):

| Arm | Hành động | Heap sau hành động | Diễn biến 30 s | Sau gc() ép từ ngoài (CDP) |
|---|---|---|---|---|
| A control | fetch → ArrayBuffer 37 MiB, bỏ tham chiếu | 37,65 MiB (delta +37,0) | giữ ~37,65 tới t≈29,7 s → **0,46 ở t≈30,7 s** | 0,47 MiB |
| B ingest clone | fetch → Blob → arrayBuffer → SHA-256 → IDB put Blob | **74,88 MiB (delta +74,2 = 2 bản copy)** | giữ ~74,9 tới t≈29,3 s → **37,68 ở t≈30,3 s, giữ nguyên tới hết** | **37,7 MiB — GIỮ LẠI** |
| C thumb clone | fetch → Blob → video preload=auto + seek + drawImage 160×90 | 37,80 MiB (delta +37,1) | giữ ~37,8 tới t≈37,5 s → **0,56 ở t≈38,5 s** | 0,58 MiB |
| D thứ tự import thật | thumb → arrayBuffer → SHA-256 → IDB put | **74,97 MiB (delta +74,3 = 2 bản copy)** | giữ ~75 tới t≈29,2 s → **37,77 ở t≈30,2 s, giữ nguyên tới hết** | **37,8 MiB — GIỮ LẠI** |

Chi tiết B/D: 2 bản copy lúc đầu là (1) buffer nội bộ của Blob tạo từ ArrayBuffer
và (2) ArrayBuffer thứ hai cho `digest`. Một bản được GC tự nhiên thu hồi ở ~t=30 s;
bản còn lại **sống sót qua cả gc() ép từ ngoài** — đó là Blob đã put vào IndexedDB
(IDB giữ bản sao structured-clone trong bộ nhớ renderer).

### 4.4 Kết luận (đã xác định được, có 1 nuance bắt buộc phải nói rõ)

- **Transient +37 MiB sau import của app là ArrayBuffer của `sha256Hex`** (cơ chế arm A):
  tạo 1 bản copy 37 MiB, bỏ tham chiếu sau khi digest, V8 thu hồi bằng GC tự nhiên
  sau ~10 s (app, có hoạt động tạo áp lực heap) tới ~22 s (page idle). Đây là GC lười
  khi không có áp lực heap, không phải leak — khớp chính xác phép đo idle-decay §4.1.
- **Video preload / thumb (arm C) KHÔNG giữ heap:** sau khi `v.src=""` và bỏ element,
  heap về baseline (0,56 MiB). Đường thumb được minh oan.
- **NUANCE — retention ở arm B/D là artefact của clone, KHÔNG áp cho app thật:**
  clone tạo Blob từ ArrayBuffer trong bộ nhớ (`new Blob([arrayBuffer])`) nên IDB giữ
  bản copy 37 MiB trong heap. App thật put **File gốc (disk-backed)** vào IDB
  (`bStore.put(input, assetId)` với `input` là File) — dữ liệu File nằm trên đĩa,
  IDB không cần giữ 37 MiB trong JS heap. Bằng chứng: phép đo idle-decay trên app
  (§4.1) về baseline ~20,8 MiB và ở đó — nếu IDB giữ 37 MiB như arm B/D thì app
  đã không về baseline. Vì vậy: **app không có settled +37 MiB vĩnh viễn sau import;
  settled heap thật của app sau import là ~20,8–22,8 MiB (baseline).**
- Settled heap sau phiên lùi dài (§1/§2: 40,72 ở trần 16 / 35,07 ở trần 8) là chuyện
  khác: đó là frame cache + GOP cache sau 150 s decode, không phải transient import.
  Settled thấp hơn ở trần 8 phù hợp với cache nhỏ hơn.

## 5. Hai GET không Range — đã xác định (đợt long8a)

Cả 2 đợt đều FAIL cổng `e2e-no-full-file-get` với đúng 2 GET không Range
(long16a: 169 blob request = 162 Range + 2 không Range + 5 other;
long8a: 193 = 186 Range + 2 không Range + 5 other).
Đợt long8a có dump đầy đủ (`BLOB-NORANGE` + `BLOB-BYURL`, đã vá vào harness sau long16a):

- Blob chính `b75ca85b-3952`: **177 GET có Range, 0 không Range, 1 other** —
  đây là blob file 37 MiB, toàn bộ traffic GOP đi qua nó, **không bao giờ bị tải toàn file**.
- Blob `f2a7ed39-0ad6`: 4 GET Range, **1 không Range**, 2 other.
- Blob `71f12386-3ec2`: 5 GET Range, **1 không Range**, 2 other.

2 GET không Range nằm trên 2 blob phụ (mỗi cái chỉ 4–5 Range GET — khớp clip mẫu 8 s
được load ở bin + timeline, hoặc artifact thumb/proxy; không xác định được chính xác
từng blob là file nào từ log này), dạng probe metadata ban đầu của `<video>`
khi load lần đầu. **Bản chất cổng đã đạt (file 37 MiB không bị tải toàn bộ);
cổng theo chữ vẫn FAIL** vì nó đếm mọi blob GET không Range. Đề xuất đợt sau:
thu hẹp cổng chỉ áp cho blob video chính (hoặc blob > ngưỡng) thay vì mọi blob.

## 6. Vấn đề harness / môi trường gặp trong đợt này (ghi để đợt sau khỏi mất thời gian)

1. **Headless Chrome 156 treo renderer với page cô lập (3 lần thử):**
   `Runtime.evaluate` không bao giờ trả (WS CDP mở được, `Runtime.enable` /
   `Page.enable` / `Page.navigate` đều trả — chỉ evaluate treo; chờ 60 s vẫn treo).
   Tab about:blank mới evaluate `1+1` trả ngay → CDP sống, renderer của page
   bị kẹt. Page tự chặn sau khi gọi `window.gc()` trong page (3/3 lần thử có gc()
   trong page đều treo, cả headless lẫn headed); sau khi bỏ `window.gc()` trong page
   (gc() thành no-op) thì page chạy được; gc() từ ngoài qua CDP evaluate trả `gc-ok`.
   Nguyên nhân treo **chưa xác định dứt điểm** — tương quan với gc() trong page,
   nhưng các lần headed còn bị nhiễu bởi lỗi Xvfb ở mục 2, nên không kết luận
   gc() là thủ phạm duy nhất. Ghi nhận: đừng gọi `window.gc()` trong page đo nữa;
   gc ép (nếu cần) gọi từ ngoài qua CDP.
2. **Xvfb spawn tay hỏng giữa chừng (phát hiện ~19:00 UTC):** `Xvfb :95` chết ngay
   với lỗi xkbcomp `Cannot close "/var/lib/xkb/server-95.xkm" properly
   (not enough space?)` → `XKB: Failed to compile keymap` →
   `Fatal server error: Failed to activate virtual core keyboard`.
   `/var/lib/xkb/` trống và ghi được, `/` còn 7,2 GB, dữ liệu xkb vẫn có
   (`/usr/share/X11/xkb/keycodes/evdev` …) — nguyên nhân gốc chưa rõ.
   **Cách qua: `xvfb-run -a`** (nó tự chọn display + `-auth`) — chạy được ngay
   (`X OK display=:99`). Mọi lần chạy headed sau đó (iso A–D, long8a) đều dùng
   xvfb-run. Các harness spawn Xvfb tay nên chuyển sang tôn trọng DISPLAY có sẵn
   (đã có sẵn trong code) và chạy dưới xvfb-run.
3. **File `heapIso52I6.mjs` bị truncate về 0 byte** do lỗi EPERM thoáng qua khi ghi
   bằng python (`open(...,"w")` truncate xong rồi write lỗi `Operation not permitted`,
   dù đang chạy root, không có immutable attr, đĩa còn trống). Đã khôi phục bằng cách
   làm việc tiếp trên `heapIsoHeaded52I6.mjs` (bản headed chứa đủ PAGE + server + CDP).
   File nguồn headless coi như mất; không ảnh hưởng kết quả vì bản headed mới là bản
   chạy ra số liệu.
4. **Lần flip 8 MiB đầu bị `timeout 280` giết** ngay trước khi hết phase phát ngược;
   chạy lại với timeout 420 thì xong trong 277 s. Trap khôi phục trần hoạt động cả 2 lần.

## 7. Kiểm chứng

- Hồi quy GOP đầy đủ (script `~/scratch-round52-i6/run-regression.sh`, esbuild bundle +
  node, ~01:15–01:30 +07): **tất cả xanh** — U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3,
  F4 6/6, H4 8/8, **I6 17/17**, reversePlayback 10/10, reversePreviewGate 12/12,
  A6 12/12, Y6 11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build` (outDir `/tmp/vcut-i6-build`): **pass** trong 1m 6s; chỉ warning chunk
  >500 kB đã có từ trước.
- Sau đợt flip 8 MiB + khôi phục: chạy lại H4 **8/8 pass** (test này assert
  `GOP_CACHE_MAX_BYTES === 16 MiB`) và I6 **17/17 pass** — trần 16 đã về đúng vị trí.

## 8. Chưa đo / rủi ro còn lại

- Moov giả trỏ vào trong file (§3.3): vẫn qua được tầng T3; cần decode thử hoặc
  kiểm tra `stco`/`stsz` khớp vùng mdat ở đợt sau.
- Cổng `e2e-no-full-file-get` vẫn FAIL theo chữ (§5): cần thu hẹp cổng cho blob chính.
- Chưa đo: Safari / máy thật / GPU encode / cửa sổ yên tĩnh (mọi phép đo trên VM này,
  CPU-only, decode phần mềm, dưới tải các luồng đợt 52 khác).
- Treo renderer khi gọi `window.gc()` trong page (§6.1): chưa xác định dứt điểm nguyên nhân.
- Xvfb spawn tay hỏng (§6.2): nguyên nhân gốc chưa rõ; workaround xvfb-run đang dùng được.
- Tốc độ lùi 0,46× (trần 16, tải nặng) vs 0,65× (trần 8, tải nhẹ): chênh lệch do tải máy,
  không phải do trần — muốn so tốc độ theo trần cần chạy 2 đợt cùng mức tải.
- Settled heap sau phiên lùi dài còn +12–18 MiB so với baseline (frame cache + GOP cache):
  chưa tách được phần nào là frame cache, phần nào là GOP cache ở đợt này.
