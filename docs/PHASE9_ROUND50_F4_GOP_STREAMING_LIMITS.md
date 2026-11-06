# Phase 9 đợt 50, luồng F4 — T3 streaming: giảm đỉnh heap transient GOP — LIMITS

Ngày: 06/11/2026 (giờ +07). Đóng nợ E2 §7.1 (đỉnh JS-heap transient
GOP +81,5 MiB > tải toàn file +37,7 MiB) + §3 mục 6 của LIMITS đợt
49. KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào
batch. Không tự stage paths-loop hay ghi build-loop-log (parent gộp,
như tiền lệ B4/C5/D4/E2). Trần 128 MiB, ngưỡng 32 MiB, mặc định GOP
TẮT, cổng gate U2 GIỮ NGUYÊN (không nới lỏng).

## 0. Kết luận ngắn (không vượt số đo)

1. **T3 streaming đã cài + nối vào controller (đường production).**
   T3 với `streamGops: true` chỉ demux + trả meta mọi GOP, KHÔNG
   fetch byte GOP nào lượt đầu; controller fetch đúng GOP giao cửa
   sổ decode khi cần (pre-resolve trong `ensureWindowViaGop` qua
   `fetchSingleGopRange` + cache LRU 32 MiB/32 GOP hiện có), các GOP
   khác fetch khi cửa sổ dịch tới. Mặc định T3 (`streamGops` vắng)
   giữ nguyên hành vi cũ (fetch mọi GOP) — test hồi quy T3 10/10
   không đổi ý nghĩa.
2. **Đỉnh heap transient GOP ĐÃ GIẢM (đo headed thật, §4):** đường
   GOP cũ (E2, 2 lần chạy yên): đỉnh **+81,56 / +81,12 MiB** lúc
   t≈4 s (cửa sổ tải T3). Sau streaming, 3 lần chạy headed app thật:
   đỉnh **+18,20 / +34,77 / −11,69 MiB** — lần 1 bắt đúng cửa sổ T3
   (t=4,6 s, +18,20); lần 2–3 đỉnh tới muộn hơn (tích lũy cache +
   frame, không phải transient T3). Cả 3 delta sau đều thấp hơn mọi
   delta trước (+81,6/+81,1/+61,8/+38,3). Delta âm ở lần 3 là artifact
   baseline (baseline chứa rác được gc trong lúc quan sát — xem §4.2),
   không phải "dùng bộ nhớ âm". Settled heap KHÔNG giảm rõ
   (28–30 MiB sau vs 39,6/39,1 E2 và 26,1 trước-trong-phiên) — đúng
   dự đoán §2.4: streaming cắt đỉnh transient, retention do cache LRU
   + frame cache quyết định.
3. **Hồi quy GOP đủ bộ xanh + tsc 0 + vite build pass** (xem §6).
   Ba test cũ khóa số request "probe + prefix + 6 GOP" (V2, W4 ×2,
   X4) đã cập nhật sang bất biến streaming mới — đó là thay đổi kỳ
   vọng của đợt này, không phải hồi quy vỡ (xem §6.1).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopStreaming50F4.test.ts` — test khóa streaming
  bằng code thật (ffmpeg + server HTTP Range thật). 6/6 pass (xem §3).
- `docs/PHASE9_ROUND50_F4_GOP_STREAMING_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND50-F4 / "Đợt 50 F4")

- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm option
  `streamGops?: boolean` + type `GopRangeMeta` + trường `gopMeta`
  trong outcome `gop-range` (có ở cả 2 mode); mode stream trả ngay
  sau demux với `gops: []`, totals 0, không request GOP nào.
- `apps/web/src/lib/reverseWebcodecs.ts` — controller truyền
  `streamGops: true` khi gọi T3; `this.gopMeta = outcome.gopMeta`
  (thay cho `gopMetaFor(outcome.gops)`); bỏ import `gopMetaFor`
  không còn dùng. Không đổi wiring, gate, ngưỡng, cache, decode-ahead.
- `apps/web/src/lib/gopCache40V2.ts` — chỉ comment header: streaming
  nay là đường chính (T3 không fetch GOP lượt đầu nữa); không đổi
  logic cache/fetch bù.
- `apps/web/src/lib/gopWiring40V2.test.ts` — cập nhật 1 assertion đếm
  request cũ (8 → bất biến streaming, xem §6.1).
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` — cập nhật 2 assertion
  đếm request cũ (8 → <8, 9 → <9, xem §6.1).
- `apps/web/src/lib/gopSharedProbe42X4.test.ts` — cập nhật 1 assertion
  đếm request cũ (8 → <8, xem §6.1).
- `apps/web/tsconfig.json` — +1 dòng exclude test mới (mẫu E2).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate U2 — không nới lỏng), `gopTail45A4/
46B4/47C5.ts`, `gopSizeProbe41W4.ts`, `gopSharedProbe42X4.ts`,
`mp4Demux.ts`, `reversePlayback.ts`, `preview.tsx`, `MediaBin.tsx`,
`store.ts`, `server/bridge/src/index.js`, mọi file luồng khác đợt 50
đang chạy song song. Fixture headed tái dùng
`~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa vào batch);
scratch đo của luồng này ở `~/scratch-round50-f4/` (log headed +
bản sao lưu file trước sửa — KHÔNG đưa vào batch).

## 2. Quyết định thiết kế streaming

### 2.1 Vì sao đỉnh heap cũ cao (bằng chứng E2 §4.3, không đoán lại)

Đường GOP cũ: T3 giữ cùng lúc tiền tố 512 KiB + đuôi tail-scan
16,7 MiB + chunk MỌI GOP (~37 MiB cho file 37 MiB) trước khi cửa sổ
đầu tiên xong và transient rơi khỏi scope → đỉnh +81,5 MiB, cao hơn
cả đường tải toàn file (+37,7 MiB — chỉ 1 arrayBuffer). Lợi ích thật
của GOP không phải đỉnh heap thấp hơn mà là không GET toàn file +
retention sau đó có trần (cache GOP ≤ 32 MiB).

### 2.2 Thiết kế F4: meta trước, byte GOP theo cửa sổ

- T3 `streamGops: true`: sau demux (bước 1–5 không đổi — probe,
  tiền tố, gate, tail-scan, moov đều giữ nguyên), T3 tính `gopDefs`
  rồi TRẢ NGAY `gopMeta` (range + vị trí sample mọi GOP, không chunk)
  + `gops: []` + totals 0. Không một request GOP nào lượt đầu.
- Controller đã có sẵn đường fetch từng GOP khi cần:
  `ensureWindowViaGop` pre-resolve mọi GOP giao cửa sổ (cache →
  transient → `fetchSingleGopRange`), decode-ahead prefetch qua
  `gopSampleData` cũng fetch từng GOP. F4 chỉ chuyển lượt fetch đầu
  từ "T3 fetch hết" sang "controller fetch đúng GOP cửa sổ" — không
  viết đường fetch mới, không đổi thứ tự decode, không đổi cache LRU.
- `gopMeta` có ở CẢ 2 mode (kể cả all mặc định) để test khóa meta hai
  mode bằng nhau; `totalGopRangeBytes`/`totalSampleBytes` nay nghĩa
  là byte THỰC đã fetch (0 ở mode stream).
- Fallback không đổi: mọi bước trước demux hỏng (probe 200, gate
  chặn, tail-scan hỏng, demux lỗi) vẫn về `full-file` như cũ — mode
  stream không chạm các bước đó. Fetch bù GOP hỏng (416/200) thì
  `fetchSingleGopRange` trả `{ ok: false }`, cửa sổ đó trả false
  trước khi decode — không chunk nửa vời (luật V2 giữ nguyên).
- Không có trường hợp riêng theo loại URL; không đổi trần 128 MiB,
  ngưỡng 32 MiB, trần cache 32 MiB/32 GOP, mặc định GOP TẮT.

### 2.3 Vì sao không để T3 tự fetch GOP của cửa sổ đầu

Controller mới biết cửa sổ (cần track để tính present-order +
target index), mà track chỉ có sau khi T3 demux xong — để T3 tự
fetch cửa sổ đầu thì phải nhét cả logic cửa sổ (windowFrames, ngân
sách) vào T3, trùng lặp với controller. Thiết kế F4 giữ T3 thuần
fetch/demux, controller giữ hoạch định cửa sổ — đúng ranh giới V2
đã đặt.

### 2.4 Đỉnh heap kỳ vọng (dự đoán trước khi đo, để đối chiếu §4)

Lượt tải đầu ở mode stream chỉ giữ: tiền tố 512 KiB + đuôi 16,7 MiB
(transient trong T3) + moov ~1 MiB + GOP của cửa sổ đầu (~0,5 MiB/
GOP × 1–3 GOP). Đỉnh transient kỳ vọng giảm từ +81,5 MiB xuống
khoảng +20–35 MiB. Retention sau đó vẫn do cache LRU 32 MiB quyết
định (cửa sổ dịch → fetch thêm GOP, cache giữ tới trần) nên settled
heap có thể không giảm nhiều như đỉnh — xem §4 đối chiếu số thật.

## 3. Test khóa (code thật, ffmpeg + HTTP Range thật)

Test mới `gopStreaming50F4.test.ts` (6 test, esbuild bundle format
esm — file này import extensionless như mẫu E2).

| Test | Kết quả |
|---|---|
| stream faststart → gop-range, 0 request GOP lượt đầu, gopMeta đủ 6 GOP, totals 0 | PASS |
| stream: chỉ GOP của cửa sổ được fetch (fetchSingleGopRange + buildGopSegment), byte chunk khớp file gốc, GOP ngoài cửa sổ chưa chạm (đối chiếu log Range server) | PASS |
| stream: server phớt lờ Range (200) → full-file ở probe, 0 GOP | PASS |
| stream: fetch bù GOP giữa chừng 416 → { ok: false }, không chunk nửa vời | PASS |
| all (mặc định) không đổi: vẫn fetch đủ 6 GOP, gopMeta khớp mode stream | PASS |
| stream trailing lớn (moov ngoài tiền tố) qua tail-scan → gop-range, 0 GOP lượt đầu | PASS |

**6/6 pass** (lần chạy đầu, không đỏ-trước vì đây là tính năng mới
chứ không phải sửa bug — hành vi cũ được khóa bởi test T3 10/10 +
V2/W4/X4 cập nhật ở §6.1). Fixture: faststart 320×240 2 s
(131.989 byte, 6 GOP) + trailing-big 640×360 10 s -g 30
(1.542.934 byte — đúng kích thước fixture E2) — log đo: stream
requests `head:200:0,probe:206:1024,prefix:206:131989` (faststart) và
`head:200:0,probe:206:1024,prefix:206:524288,tail:206:1542934`
(trailing-big, có tail 206, 0 GOP).

## 4. Headed E2E app thật + đo heap (vite :5173 + bridge :8787)

Harness tái dùng `gopHeaded49E2.mjs` (E2) không sửa — import file
trailing 37 MiB thật → thêm clip → End về cuối → bấm "Phát ngược"
→ quan sát 30 s, lấy mẫu heap (performance.memory + RSS) mỗi 500 ms.
Phương pháp đo: `performance.memory.usedJSHeapSize` với
`--enable-precise-memory-info --js-flags=--expose-gc`, baseline sau
`gc()` trước khi phát ngược, đỉnh = max mẫu trong 30 s quan sát,
settled sau `gc()` khi dừng. Cùng file/fixture E2
(`~/scratch-round47-c5/trailing-real37.mp4`, 38.996.431 byte).
Giàn: Chromium headed + Xvfb + render phần mềm, under-load (xem
§4.2). Setup: đã copy fixture cùng bytes sang tên `trail-d4.mp4`
trong bridge work-dir để cổng bridge-head của harness (HEAD file đó)
qua được — không đổi code harness, không đổi bytes fixture (lần thử
đầu không copy thì bridge HEAD 404 trong 30 s, đúng sự cố E2 §7.7).

### 4.1 Bảng số đo (cùng harness, cùng fixture)

| Lần chạy | Code | Baseline | Đỉnh (delta) | Đỉnh lúc | Settled | Cổng | wc hits | Playhead/30 s | Blob req (Range / không Range) |
|---|---|---|---|---|---|---|---|---|---|
| E2 run C (tham chiếu yên) | cũ | 21,06 MiB | 102,62 (+81,56) | t≈4 s | 39,56 | 16/16 | +477 | ~29,5 s | 194–195 (toàn Range) |
| E2 run D (tham chiếu yên) | cũ | ~21 MiB | 102,28 (+81,12) | t≈4 s | 39,13 | 16/16 | +391 | ~29,5 s | 194–195 (toàn Range) |
| F4 before (máy tải) | cũ | 58,29 MiB | 96,54 (+38,25) | t≈23,0 s | 26,14 | 15/16 | +9 | 20,4 s | 151 (150 / 0) |
| F4 before2 (máy yên hơn) | cũ | 24,87 MiB | 86,69 (+61,82) | t≈21,3 s | 24,75 | 14/17 | +0 | 71,8 s (element) | 142 (138 / 1) |
| **F4 after1** | **mới** | 59,20 MiB | **77,41 (+18,20)** | **t=4,6 s** | 29,17 | **17/17** | +17 | 16,7 s | 77 (76 / 0) |
| **F4 after2** | **mới** | 58,28 MiB | **93,06 (+34,77)** | **t=16,3 s** | 28,20 | **17/17** | +21 | 17,0 s | 75 (74 / 0) |
| **F4 after3** | **mới** | 58,33 MiB | **46,63 (−11,69)** | **t=28,8 s** | 29,85 | **17/17** | +29 | 17,9 s | 84 (83 / 0) |

Đọc số trung thực (không tô hồng streaming):
- **Transient cửa sổ T3 đã giảm thật:** E2 đo đỉnh T3 ở t≈4 s là
  +81,5 MiB. After1 bắt đúng cửa sổ đó (t=4,6 s) chỉ còn **+18,20
  MiB** — khớp dự đoán §2.4 (+20–35 MiB, thực tế hơi thấp hơn biên
  dưới). After2/3 đỉnh tới muộn (t≈16 s / t≈29 s) nên delta của
  chúng đo retention tích lũy (cache GOP dịch cửa sổ + frame), không
  phải transient T3 — nhưng cả 3 delta sau đều thấp hơn mọi delta
  trước, và đỉnh tuyệt đối sau (46,63–93,06 MiB) cũng thấp hơn đỉnh
  tuyệt đối trước ở E2 (102,28–102,62 MiB) dù baseline phiên F4 cao
  hơn ~37 MiB.
- **Delta âm ở after3 (−11,69) là artifact baseline, không phải kết
  quả thật của streaming:** baseline 58,33 MiB (sau `gc()`) chứa
  ~30 MiB rác được thu trong lúc quan sát nên đỉnh mẫu (46,63) thấp
  hơn baseline. Số này KHÔNG được trích là "streaming tiết kiệm
  11,69 MiB" — nó chỉ chứng minh không còn transient nào vượt
  baseline trong lần chạy đó. Xem thêm §4.2 về baseline.
- **Settled KHÔNG giảm:** 29,17 / 28,20 / 29,85 MiB sau vs 39,56 /
  39,13 (E2) và 26,14 (F4 before). Đúng dự đoán §2.4: streaming chỉ
  cắt transient lượt đầu; retention dài hạn do cache LRU 32 MiB +
  frame cache quyết định — muốn giảm settled phải hạ trần cache (nợ
  §5.2, chưa làm).
- **GOP bật thật cả 3 lần sau:** `gopActive=true`,
  `gopFallbackReasons=[]`, **0 GET toàn file** (CDP Network: mọi
  GET blob: đều mang header Range), 24–30 frame canvas khác nhau,
  0 uncaught exception, 0 console error. Số request blob: giảm từ
  194–195 (E2, fetch 72 GOP lượt đầu) xuống 75–84 — chỉ GOP cần
  mới fetch, khớp thiết kế §2.2 (không claim số request là chỉ số
  chính — số này còn phụ thuộc số cửa sổ dịch trong 30 s).
- **F4 before2 là lần chạy flake của code cũ (14/17), KHÔNG dùng làm
  số trước chuẩn:** GOP không bao giờ bật (`gopActive=false`,
  `gopFallbackReasons=[]`, hits +0, 1 GET không Range, playhead lùi
  71,8 s/30 s = tốc độ element) — cùng mẫu flake run B của E2 §7.2
  (decode-window đói tài nguyên dưới tải). Đỉnh +61,82 của nó là
  transient tải toàn file (đường fallback), KHÔNG phải transient T3 —
  số trước chuẩn vẫn là +81,5 của E2 (2 lần chạy yên, 16/16).
  F4 before (15/16, hits +9) cũng là lần chạy tải nặng, đỉnh t≈23 s
  có thể đã bỏ lỡ transient T3 do lấy mẫu 500 ms — ghi rõ để khỏi
  trích sai.

### 4.2 Nhiễu đo (ghi rõ, không giấu)

- **Baseline JS-heap dao động lớn giữa các lần chạy (21 → 59 MiB)
  mà chưa giải thích dứt điểm:** E2 ~21 MiB, before2 24,87 MiB,
  nhưng F4 before/after1-3 đều 58–59 MiB (chênh ~37 MiB ≈ kích
  thước file — như thể byte file còn nằm trong heap sau import ở
  một số lần chạy rồi được gc trong lúc quan sát, xem delta âm
  after3). Các luồng đợt 50 khác đang sửa file chung trong lúc đo
  (`preview.tsx` 01:36, `loadSampleQueue.ts` 01:26 — giữa các lần
  chạy headed) nên code app khác nhau giữa các lần chạy; đây là
  nhiễu confound, không phải số đo sạch. Delta trong-phiên vẫn so
  được, nhưng so tuyệt đối baseline cross-session thì yếu — vì vậy
  kết luận chính dựa vào delta + thời điểm đỉnh (t≈4 s), không dựa
  vào đỉnh tuyệt đối.
- **Tất cả lần chạy phiên F4 đều decode-đói dưới tải nặng song song:**
  hits chỉ +9/+17/+21/+29 (E2 yên: +477/+391), misses +111–217,
  playhead chỉ lùi ~17–20 s/30 s (E2 yên: ~29,5 s). Nguyên nhân:
  luồng F3 chạy TTS python ~110% CPU / 38% RAM + Chrome của luồng
  khác chạy headed cùng lúc (load average 3,6–16,1 trong lúc đo).
  Đây là nhiễu tải, không phải hồi quy streaming — GOP vẫn bật và
  0 GET toàn file ở cả 3 lần sau.
- **Lấy mẫu heap 500 ms có thể bỏ lỡ transient ngắn:** đỉnh T3 là
  ước lượng dưới của transient thật; số +18,20 ở after1 là số đo
  được, không phải trần lý thuyết.
- **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
  quiet / fps.** Toàn bộ headed là Chromium Linux + Xvfb + render
  phần mềm, under-load. Tốc độ lùi ~0,6× realtime ở các lần chạy
  tải nặng không phải baseline.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Settled heap không giảm + baseline dao động chưa giải thích
   dứt điểm (xem §4.2):** streaming cắt đỉnh transient nhưng
   retention dài hạn vẫn do cache LRU 32 MiB + frame cache quyết
   định; baseline JS-heap dao động 21–59 MiB giữa các lần chạy (chênh
   ~37 MiB ≈ kích thước file sau import) cần điều tra riêng (nghi
   import giữ ArrayBuffer tạm, hoặc code chung bị luồng khác sửa
   giữa các lần chạy) trước khi claim số tuyệt đối. Lần đo sau nên
   chạy khi máy yên + khóa code chung.
2. **Retention sau đó vẫn do cache LRU 32 MiB quyết định** — streaming
   chỉ giảm đỉnh TRANSIENT lượt đầu, không giảm retention dài hạn khi
   phát ngược lâu (cửa sổ dịch → cache giữ tới 32 MiB GOP + frame
   192 MiB). Muốn giảm settled thì phải hạ trần cache — chưa làm, cần
   số đo riêng về tốc độ lùi khi cache nhỏ.
3. **Đuôi tail-scan 16,7 MiB vẫn nằm trong đỉnh transient của T3**
   (file moov-trailing): streaming không chạm bước này. Muốn giảm nữa
   thì phải stream cả tail (đọc moov theo từng mảnh) — chưa làm.
4. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps.** Toàn bộ headed là Chromium Linux + Xvfb + render
   phần mềm, under-load (xem §4).
5. **Harness phụ thuộc fixture ngoài repo** (như E2 §7.4):
   `~/scratch-round47-c5/trailing-real37.mp4` (38.996.431 byte).

## 6. Kiểm chứng + hồi quy

```
# Test mới F4
./node_modules/.bin/esbuild apps/web/src/lib/gopStreaming50F4.test.ts \
  --bundle --platform=node --format=esm --outfile=<scratch>/f4.test.mjs \
  && node <scratch>/f4.test.mjs
# Hồi quy (esbuild bundle; cjs cho U2/T3/V2, esm cho còn lại — mẫu E2)
# Headed E2E app thật
node apps/web/scripts/gopHeaded49E2.mjs
```

### 6.1 Ba test cũ cập nhật assertion đếm request (thay đổi kỳ vọng)

V2/W4/X4 khóa số request 206 = "probe + prefix + 6 GOP" (= 8, hoặc 9
khi có thêm probe Range) — con số đó chính là hành vi F4 thay đổi
(T3 không fetch 6 GOP lượt đầu nữa). Đây KHÔNG phải hồi quy vỡ:
khóa chính của các test đó (wiring/threshold, probe HEAD dùng lại 1
lần, fallback) vẫn giữ nguyên và vẫn xanh; chỉ số đếm 206 được nới
thành bất biến streaming mới (`≥ 3 và < 8`, W4 test 2 là `≥ 4 và
< 9` vì có thêm probe Range 206). Số quan sát thật sau đổi:
V2 5 (= probe + prefix + 3 GOP cửa sổ), W4-1 5, W4-2 6, X4 5 —
đều < 8/9 và ≥ ngưỡng dưới, khớp thiết kế "chỉ GOP cửa sổ".

| Nhóm | Kết quả thật |
|---|---|
| F4 mới `gopStreaming50F4` | **6/6** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** |
| Hồi quy V2 `gopWiring40V2` | **16/16** (đã cập nhật 1 assertion đếm, §6.1) |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** (đã cập nhật 2 assertion đếm, §6.1) |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** (đã cập nhật 1 assertion đếm, §6.1) |
| Hồi quy A4 `gopTail45A4` | **18/18** |
| Hồi quy B4 `gopTail46B4` | **13/13** |
| Hồi quy C5 `gopTail47C5` | **11/11** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy E2 `gopBlobUrl49E2` | **8/8** |
| Hồi quy E2 i18n `reversePlaybackI18n49E2` | **3/3** |
| Hồi quy `reversePlayback` | **10/10** |
| Hồi quy `reversePreviewGate` | **12/12** |
| Hồi quy A6 `reverseBadge45A6` | **12/12** |
| Hồi quy Y6 `reverseCompat43Y6` | **11/11** |
| Hồi quy D4 `reverseToggleI18n48D4` | **3/3** |
| Hồi quy B6 `reverseBadge46B6` | **8/8** |
| Hồi quy Z6 `reverseCompat44Z6` | **10/10** |
| Hồi quy `saveToast31` | **15/15** |
| Hồi quy `structuredNotes32` | **12/12** |
| Hồi quy `errorDetail34Q4` | **35/35** |
| Headed E2E `gopHeaded49E2` mode=gop (sau streaming) | **17/17 × 3 lần chạy** (after1/2/3; xem §4) |
| Headed E2E `gopHeaded49E2` mode=gop (trước, code cũ, cùng phiên) | 15/16 (before, tải nặng) + 14/17 (before2, flake GOP không bật — xem §4.1) |
| `tsc --noEmit -p apps/web/tsconfig.json` | **Sạch, exit 0** |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (25,51 s)**, chỉ cảnh báo chunk > 500 kB cũ |

## 7. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopStreaming50F4.test.ts` (mới, 6 test)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: `streamGops` + `GopRangeMeta` + `gopMeta`)
- `apps/web/src/lib/reverseWebcodecs.ts` (sửa: controller `streamGops: true` + `outcome.gopMeta`)
- `apps/web/src/lib/gopCache40V2.ts` (sửa: chỉ comment header streaming)
- `apps/web/src/lib/gopWiring40V2.test.ts` (sửa: 1 assertion đếm request, §6.1)
- `apps/web/src/lib/gopSizeProbe41W4.test.ts` (sửa: 2 assertion đếm request, §6.1)
- `apps/web/src/lib/gopSharedProbe42X4.test.ts` (sửa: 1 assertion đếm request, §6.1)
- `apps/web/tsconfig.json` (sửa: +1 dòng exclude test mới)
- `docs/PHASE9_ROUND50_F4_GOP_STREAMING_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round50-f4/` (log headed +
bản sao lưu file trước sửa — KHÔNG đưa vào batch). Fixture tái dùng:
`~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa vào batch).
