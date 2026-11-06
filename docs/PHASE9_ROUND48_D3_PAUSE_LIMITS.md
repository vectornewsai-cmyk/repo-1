# Phase 9 đợt 48, luồng D3 — kind "error" qua spec dị dạng + sửa mock Z2 releaseElement + loại trừ cờ/binary Chrome cho fail-fast seek-landing-0 — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Kind `"error"` qua spec dị dạng — KHÔNG TẠO ĐƯỢC, và nay đã có
   bằng chứng vì sao nó KHÔNG THỂ tạo được qua đường app thật
   (§3).** 11 spec dị dạng đã thử qua đường load thật (autosave
   JSON → `parseProjectText` → vòng lặp preview): 6 spec bị cổng
   load từ chối (rơi về project mẫu), 4 spec qua load nhưng không
   ném (đối chứng), và đúng 1 spec ném — `volumeKeyframes:
   {keyframes: [null]}` trên clip audio — nhưng nó GIẾT tick vòng
   lặp ở `syncMedia` (stack đã xác minh từng hàm trong bundle:
   loop → `syncMedia` → `collectActives` → `computeClipGain` →
   `interpolateKeyframes` → `TypeError` tại `ks[0].v`) TRƯỚC KHI
   nhánh pause kịp phát seek request, nên executor Seeker không bao
   giờ chạy và kind `"error"` không bao giờ xuất hiện
   (`kindsSeen: []`, `seekFailureCount` giữ 0, ticks đóng băng ở 4,
   scrub cũng không cứu vì `wake()` no-op khi `sleeping=false`).
   Đây là kết quả âm tính có cơ chế, không phải chưa thử đủ.
2. **Mock Z2 releaseElement — ĐÃ SỬA, đỏ-trước / xanh-sau (§2).**
   Mock nay ném `InvalidStateError` khi gọi lại
   `createMediaElementSource` cho cùng element (khớp Chrome thật
   C3 R16); test sửa theo hành vi thật: sau release, update lại
   KHÔNG tạo source mới, gain rơi về `el.volume = 0,5`, release lần
   nữa → false; element mới vẫn tạo source bình thường. Suite
   audioEngine44Z2: 6/6 xanh (trước sửa: 2 test mới đỏ).
3. **Fail-fast seek-landing-0: loại trừ 3 cờ, binary vẫn mở (§4).**
   DSF, autoplay, GPU đều KHÔNG phải biến quyết định (v2/v3/v4
   cho cùng chữ ký như C3: broken-1,5 → error 3, kẹt seeking rs 1;
   broken-2,5 → `seeked@2.500`; seekElement → 1 landing @2,5).
   Binary khác duy nhất trên máy (Hatch Chromium 155) không dùng
   được: khởi động đòi policy WebGL (đã giải bằng validator),
   nhưng sau đó chặn mọi navigation tới http://127.0.0.1 bằng
   `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS` (data: URL
   vẫn load bình thường; `--no-proxy-server`,
   `--disable-features=LocalNetworkAccessChecks`,
   `--local-network-access-allowed-for-urls=*` đều không gỡ;
   đường managed policy /etc KHÔNG thử vì là thay đổi bảo mật bền
   vững ngoài phạm vi). Fail-fast seek-landing-0 headed VẪN
   NOT_MEASURED.
4. **Quirk đáp sai frame khác 0: 2 hướng mới đều không đáp sai
   (§5).** Điền 0xFF vào keyframe hỏng → cùng chữ ký hỏng pipeline
   error 3 như điền 0x00; thêm track audio AAC → đáp đúng 2,5.
   Quirk VẪN NOT_MEASURED.
5. **Hồi quy pause 111/111 + tsc 0 lỗi (§6).** Tổng 117 test xanh
   (111 pause + 6 audioEngine44Z2), `vite build` pass.

## 1. Phân tích code trước khi đo (đọc code, chưa phải bằng chứng chạy)

### 1.1 Đường duy nhất tới kind `"error"` ở tầng Seeker

- `Seeker.request` (seek.ts, ROUND46-B2) bọc executor ném đồng bộ
  thành outcome `{ok:false, cancelled:false}` →
  `classifySeekOutcome = "error"` → cap X2 đếm. Nguồn ném đồng bộ
  duy nhất trong executor preview.tsx (~2877) là `collectActives`
  ném (`seekAll` bắt lỗi từng element, không bao giờ reject).
- Nhưng `collectActives` CŨNG được `syncMedia` gọi ở ĐẦU mỗi tick
  pause (preview.tsx ~2775), TRƯỚC nhánh pause phát seek request.
  Tick KHÔNG có try/catch bao ngoài; `scheduleNext()` nằm cuối tick
  nên tick ném thì vòng lặp DỪNG (không rAF tiếp), `ticks` đóng
  băng ở số tick đã tăng đầu tick đó (`idleDebug.ticks++` là dòng
  đầu loop). Hệ quả cần kiểm chứng bằng chạy thật: một spec làm
  `collectActives` ném sẽ GIẾT TICK ở `syncMedia` trước khi seek
  request kịp phát — executor không bao giờ chạy, kind `"error"`
  không bao giờ xuất hiện trong `idleDebug.seekFailureKind`.
- Cổng load chặn trước một lớp nữa: `loadAutosave`/`loadProject`
  đều qua `parseProjectText` → `validateSpecDeep`; lỗi → `fail`
  → `loadAutosave` trả null → App rơi về project mẫu
  (`loadSample`, tên "Dự án mẫu", 2 clip mau-1/mau-2). `isVideoSpec`
  đã đòi `meta` là object + `tracks` là mảng. Các dị dạng cấu trúc
  (tracks null, clips null, track/clip null, kind lạ, duration ≤ 0,
  start thiếu, src rỗng, fps ≤ 0, meta thiếu) đều bị chặn ở đây.
- Các hàm toán trong `collectActives` đều có guard: `rampSpeedAt` /
  `rampSourceTimeAt` try/catch nội bộ (keyframes lỗi → fallback);
  `computeClipGain` chỉ gọi `interpolateKeyframes` khi
  `kfs.length > 0` (hàm này chỉ ném khi mảng rỗng); `pool.videoFor` /
  `audioFor` chỉ `createElement` + gán `src` (không ném theo media);
  `mediaByName.get` miss → `continue`, không ném.
- Ứng viên duy nhất còn lại sau khi đọc code (CẦN ĐO):
  audio clip với `volumeKeyframes.keyframes: [null]` —
  `validateClipDeep` KHÔNG kiểm tra `volumeKeyframes` (chỉ
  `speedKeyframes` qua warning, không thành error), nên spec này
  QUA cổng load; trong loop, `computeClipGain` →
  `interpolateKeyframes([null])` → `normalizeKeyframes` giữ `[null]`
  (sort 1 phần tử không gọi comparator) → `ks[0].v` ném TypeError
  (`Cannot read properties of null`). Với `[null, {...}]` thì
  comparator sort `a.t` ném trước. Đây là ứng viên SỐ 1 cho M1.
  Câu hỏi mở (đo mới biết): tick chết ở `syncMedia` (kind không
  bao giờ hiện) hay executor kịp chạy (kind `"error"` hiện)?

### 1.2 Mock Z2 sai ở đâu (C3 §7)

- Chrome thật (headed, R16): sau `releaseElement(el1)`, `update`
  lại el1 gọi `createMediaElementSource` rồi NÉM `InvalidStateError`
  (nodesSize 0, gain rơi về fallback `el.volume = 0,5`); element
  MỚI (el2) tạo source bình thường. Test mock Z2 hiện tại ghi
  "sau release update lại → sources.length == 2" là SAI: mock
  `createMediaElementSource` không bao giờ ném khi gọi lại cùng
  element. Sửa: mock ghi nhớ element đã source; gọi lại → ném lỗi
  tên `InvalidStateError`; test sửa theo hành vi thật.

### 1.3 Biến cờ/binary còn mở cho fail-fast seek-landing-0 (C3 §3.4)

- C3 đã loại trừ: tab mới riêng mỗi probe, server Range/không-Range,
  thứ tự probe, fixture byte-identical. Còn lại: cờ/binary của phiên
  Chrome Y2 gốc (không còn bản ghi). Máy này có 2 binary khác nhau:
  Playwright chromium-1248 = `Google Chrome for Testing
  156.0.8078.4` (C3 đã dùng) và `/opt/meta-chromium/chrome` =
  `Muse Browser 155.0.8059.91` (binary + version khác). Đợt này thử
  binary 155 + các tổ hợp cờ khác (DSF, autoplay, GPU) trên harness
  C3 (probe R2/R6: raw + seekElement broken-gap 2,5).

## 2. Sửa mock Z2 releaseElement (đỏ-trước / xanh-sau)

- Chạy test đã sửa TRƯỚC khi sửa mock (mock cũ):
  `audioEngine44Z2: 4 passed`, 2 test mới ĐỎ đúng như dự đoán —
  "sau release, update lại KHÔNG tạo source mới": `2 !== 1`
  (`sources.length` vẫn 2 vì mock cũ tạo source mới); "mock ...
  ném InvalidStateError": `Missing expected exception`. 4 test cũ
  vẫn xanh (mock cũ chưa bị đụng).
- Sửa mock (`apps/web/src/lib/audioEngine44Z2.test.ts`, chỉ file
  test — KHÔNG đổi production `audioEngine.ts`): `mockCtx` thêm
  `sourced: Set<object>`; `createMediaElementSource(el)` gọi lại
  cho cùng element → ném `Error` với `name = "InvalidStateError"`
  (thông điệp khớp Chrome); gọi lần đầu ghi nhớ element rồi mới
  tạo node. `releaseElement` không "quên" element ở tầng context
  — đúng Chrome thật (release chỉ ngắt graph trong engine).
- Sau sửa: `audioEngine44Z2: 6 passed` (6/6, fail 0).
  Test sửa khóa hành vi thật C3 R16: sau release, update lại cùng
  element → `sources.length` giữ 1, `el.volume = 0,5` (fallback
  của `AudioEngine.update` khi `nodeFor` bắt lỗi ném), rồi
  `releaseElement(el)` → false; element MỚI update → sources 2,
  `connects` 1, release → true. Test mới khóa trực tiếp mock ném
  `InvalidStateError` khi gọi lại cùng element.
- Hồi quy đầy đủ xem §6 (chạy sau khi xong các luồng headed để
  tránh CPU contention làm lệch timer test).

## 3. Săn kind `"error"` qua spec dị dạng (harness headed mới)

Harness: `apps/web/scripts/pause48D3-malspec.mjs` (mới, viết theo
mẫu apploop C3: CDP pipe + Xvfb + Chromium-1248, seed qua IDB +
localStorage autosave, scrub qua `.tl-ruler`, poll
`window.__vcutPreviewIdle`). Dist: `/tmp/d3-app-dist` (build mới
từ source hiện tại — xem §6 vì sao không dùng dist C3 cũ).

Ma trận spec (mỗi case 1 lần chạy app thật, seed JSON qua autosave):

| Case | Spec dị dạng | Dự đoán theo code §1 |
|---|---|---|
| M1 | audio clip, `volumeKeyframes.keyframes: [null]` | Qua load; ném ở `collectActives` — đo xem tick chết hay kind `"error"` |
| M2 | audio clip, `volumeKeyframes.keyframes: []` | Đối chứng: guard `length > 0`, không ném |
| M3 | audio clip, `volumeKeyframes.keyframes: [{t:0,v:0.5},{t:3,v:0.5}]` | Đối chứng hợp lệ |
| M4 | video clip, src asset không tồn tại | `mediaByName` miss → `continue`, không ném |
| M5 | video clip, src `""` | Load reject (`thiếu src.`) → project mẫu |
| M6 | `tracks: null` | Load reject (`tracks phải là mảng.`) → project mẫu |
| M7 | track `clips: null` | Load reject (`clips phải là mảng.`) → project mẫu |
| M8 | clip kind `"weird"` | Load reject (`kind không hỗ trợ`) → project mẫu |
| M9 | clip `duration: -1` | Load reject (`duration phải là số > 0.`) → project mẫu |
| M10 | video clip, `speedKeyframes.keyframes: [null]` | Load OK (chỉ warning); ramp try/catch → không ném |
| M11 | spec thiếu `meta` | Load reject (`isVideoSpec` đòi meta object) → project mẫu |

Lưu ý JSON: NaN/Infinity/undefined KHÔNG seed được qua autosave
(JSON.stringify biến NaN → null) — các dị dạng NaN chỉ có thể xuất
hiện do sửa tay in-memory, ngoài phạm vi đường load thật.

### 3.1 Bảng kết quả (11/11 case đã chạy app thật)

| Case | Spec dị dạng | Load | Vòng lặp / kind |
|---|---|---|---|
| M1 | audio clip, `volumeKeyframes.keyframes: [null]` | seeded (1 clip) | **Tick chết** ở `syncMedia` (xem §3.2); ticks 3→4 rồi đóng băng, `sleeping` false, `kindsSeen: []`, count 0; scrub 2,5 không cứu (ticks trước/sau scrub đều 4) |
| M2 | audio clip, `volumeKeyframes.keyframes: []` | seeded | Sống; scrub 2,5 → lastDrawn 2,5, ngủ, kinds `[]`, count 0 |
| M3 | audio clip, `volumeKeyframes.keyframes: [{t:0,v:0.5},{t:3,v:0.5}]` | seeded | Sống; scrub 2,5 → lastDrawn 2,5, ngủ, kinds `[]`, count 0 |
| M4 | video clip, src asset không tồn tại | seeded | Sống; scrub 2,5 → lastDrawn 2,5, ngủ, kinds `[]`, count 0 |
| M5 | video clip, src `""` | **sample** (3 clip mau-1/mau-2/text, tên "Dự án mẫu") | Không vào vòng lặp — cổng load từ chối |
| M6 | `tracks: null` | **sample** | Như M5 |
| M7 | track `clips: null` | **sample** | Như M5 |
| M8 | clip kind `"weird"` | **sample** | Như M5 |
| M9 | clip `duration: -1` | **sample** | Như M5 |
| M10 | video clip, `speedKeyframes.keyframes: [null]` | seeded | Sống; scrub 2,5 → lastDrawn 2,5, ngủ, kinds `[]`, count 0 (ramp try/catch) |
| M11 | spec thiếu `meta` | **sample** | Như M5 |

Số thật M1 (2 lần chạy độc lập, log `/tmp/d3-malspec-m1.log` và
`-m1b.log`): lần 1 ticks đóng băng ở 4, lỗi `Uncaught TypeError:
Cannot read properties of null (reading 'v')` ghi được 1 lần;
lần 2 (collector thêm stack) ticks 3 lúc load → 4 rồi đóng băng,
cùng 1 lỗi, scrub x=302 (2,5 s) không đổi ticks. M2/M3/M4/M10:
ticks lúc load 3–5, sau scrub 2,5 là 6–8, `sleeping: true`,
`lastDrawn: 2,5` — đường seek/executor chạy bình thường nên
`kindsSeen: []` ở các case này là "không ném", không phải "chưa
chạy tới executor". M5–M11 (trừ M10): sau reload + poll tới 20 s
đều hiện 3 clip mẫu (mau-1 0→4 s, mau-2 4→8 s, text "Xin chào!
Đây là VCut Studio") — tức cổng load đã từ chối spec dị dạng.
Harness phát hiện chậm ở lượt đầu (tưởng sample chỉ có 2 clip,
đọc ở +3 s khi sample chưa load xong → "unknown"); đã sửa
detection (sample = clip text chứa `mau-1.webm`, poll tới khi
`tlClipCount != 0`) và chạy lại M5 xác nhận phân loại "sample".

### 3.2 Vì sao M1 giết vòng lặp thay vì cho kind `"error"` (đã chứng minh bằng stack thật)

Lỗi uncaught của M1 kèm stack 5 frame (minified, đã đối chiếu
từng hàm trong bundle `/tmp/d3-app-dist/assets/index-350ToPYF.js`):

- Frame ném `Ys` (dòng 40, cột 68039) = `interpolateKeyframes`:
  code bundle chứa đúng chuỗi `"interpolateKeyframes: mảng
  keyframes rỗng"` và `return n[0].v` — với keyframes `[null]`,
  `normalizeKeyframes` trả `[null]` (sort 1 phần tử không gọi
  comparator), `n.length === 1` nên `return n[0].v` ném
  `TypeError: Cannot read properties of null (reading 'v')`.
- `kM` (dòng 84, cột 15438) = `computeClipGain`: đọc
  `e.volumeKeyframes?.keyframes`, `o.length > 0` → gọi `Ys(o, a)`.
- `hf` (dòng 130, cột 68026) = `collectActives`: nhánh audio gọi
  `kM(c, f, !!o.muted, o.volume ?? 1)`.
- `cv` (dòng 130, cột 68222) = `syncMedia`: dòng đầu
  `const { actives, audioSources } = hf(e, t, n, r)`.
- `Pe` (dòng 140) = thân tick vòng lặp: nhánh pause gọi
  `cv(Et, hn, on, Ze, !1, ds, !1)` TRƯỚC khối phát seek request.

Chuỗi đầy đủ: tick → `syncMedia` → `collectActives` →
`computeClipGain` → `interpolateKeyframes` → ném. Tick không có
try/catch bao ngoài; `scheduleNext()` ở cuối tick không chạy nên
rAF tiếp không được đặt lịch; `sleeping` vẫn false nên `wake()`
(`if (!sleeping) return`) no-op với mọi store change sau đó —
vòng lặp chết hẳn cho tới reload trang. Scrub 2,5 chỉ đổi
playhead trong store, không tick nào chạy nữa (ticks trước/sau
scrub đều 4). Executor của Seeker (cùng `collectActives`, nhưng
chạy trong `setTimeout` 80 ms sau khi request phát) không bao giờ
được phát — request chỉ phát ở nhánh pause SAU `syncMedia` trong
cùng tick.

### 3.3 Kết luận kind `"error"` (đóng nợ C3 §9 mục 3 theo hướng này)

Qua đường app thật, kind `"error"` KHÔNG TẠO ĐƯỢC từ spec dị dạng
và có lý do cấu trúc (không phải do thử thiếu):

1. Mọi dị dạng cấu trúc (tracks/clips null, track/clip null, kind
   lạ, duration ≤ 0, start thiếu, src rỗng, fps ≤ 0, meta thiếu)
   đều bị `validateSpecDeep` chặn ở cổng load → project mẫu.
2. Mọi dị dạng số/luật mà cổng load cho qua (src asset chết,
   `speedKeyframes` null, `volumeKeyframes` rỗng/hợp lệ) đều
   không ném trong `collectActives` (guard `length > 0`,
   try/catch ramp, `mediaByName` miss → `continue`).
3. Dị dạng duy nhất qua load mà ném được (`volumeKeyframes:
   [null]` trên clip audio) giết tick ở `syncMedia` trước khi
   seek request phát — nên đường executor-ném → kind `"error"`
   (B2 đã đo headed với executor ném nhân tạo) không bao giờ tới
   được qua spec này. Muốn kind `"error"` từ production cần một
   executor khác ném, hoặc một spec làm `collectActives` ném Ở
   EXECUTOR mà không ném ở `syncMedia` — hai lời gọi dùng cùng
   spec và cùng t nên không tồn tại trường hợp như vậy trong
   code hiện tại (cả hai đều gọi `collectActives(spec, pool,
   mediaByName, t)`; khác biệt duy nhất là executor còn đọc
   `spec.meta.fps` sau `collectActives`, mà `meta` đã bị
   `isVideoSpec` chặn từ cổng load).
4. Hệ quả thực tế (ghi để đợt sau khỏi đo lại): một project có
   clip audio mang `volumeKeyframes` chứa entry null sẽ làm
   preview chết cứng (canvas đứng yên, không scrub/phát được)
   sau 1 lần load — đây là BUG robustness của vòng lặp (tick
   không có try/catch), không phải đường tới kind `"error"`.
   Chưa sửa trong luồng này (ngoài phạm vi: sửa tick hay validate
   `volumeKeyframes` ở cổng load là quyết định của đợt sau).

## 4. Loại trừ cờ/binary Chrome cho fail-fast seek-landing-0

Harness: `apps/web/scripts/pause48D3-chromevar.mjs` (mới; 9 probe/
lần chạy: R1/R2/R3/R4 raw + R6/R7 seekElement + RA/RB/RC biến
thể mới, thứ tự Y2 gap-15 trước gap-25, server Y2-exact không
Range, tab mới mỗi probe). Baseline so sánh: C3 trên
chromium-1248 + cờ C3 (R2/R4 `seeked@2.500`, R6 1 landing @2,5).

### 4.1 Bảng variant (fail-fast seek-landing-0)

| Variant | Binary / cờ khác | R1 broken-1,5 | R2/R4 broken-2,5 | R6 seekElement broken-2,5 | Kết luận |
|---|---|---|---|---|---|
| C3 baseline | chromium-1248 156.0.8078.4 + DSF=1 + autoplay | error 3, kẹt seeking rs 1 | `seeked@2.500` ×2 | 1 landing @2,5, 302 ms | NOT_MEASURED |
| v2-nodsf | chromium-1248 + cờ C3 TRỪ `--force-device-scale-factor=1` | error 3, kẹt seeking rs 1 | `seeked@2.500` ×2 | 1 landing @2,5, seeked true, 17 ms | NOT_MEASURED — cờ DSF **không phải** biến quyết định |
| v3-noautoplay | chromium-1248 + cờ C3 TRỪ `--autoplay-policy=...` | error 3, kẹt seeking rs 1 | `seeked@2.500` ×2 | 1 landing @2,5, seeked true, 17 ms | NOT_MEASURED — cờ autoplay **không phải** biến quyết định |
| v4-nogpu | chromium-1248 + cờ C3 + `--disable-gpu` | error 3, kẹt seeking rs 1 | `seeked@2.500` ×2 | 1 landing @2,5, seeked true, 16 ms | NOT_MEASURED — đường decode GPU **không phải** biến quyết định |
| v1-meta | meta-chromium 155.0.8059.91 + cờ C3 | — | — | — | **KHÔNG CHẠY ĐƯỢC** (xem §4.2) |
| v1-meta-policy | meta 155 + cờ C3 + policy WebGL all-origins | tất cả 9 probe timeout 40 s (`window.__c3` undefined) | — | — | KHÔNG ĐO ĐƯỢC (xem §4.2) |
| v1-meta-policy-noproxy | như trên + `--no-proxy-server` | tất cả 9 probe timeout 40 s | — | — | KHÔNG ĐO ĐƯỢC (proxy không phải nguyên nhân) |

Mỗi lần chạy v2/v3/v4: 7 kiểm tra, FAIL = 0 (2 control PASS:
valid raw `seeked@2.500`, valid seekElement 1 landing @2,5).
Số R6 elapsedMs 16–17 ms ở v2/v3/v4 so với 302 ms ở C3 — chênh
lệch này là thời gian seekElement hoàn tất khi seeked bắn nhanh
(máy vắng hơn lúc chạy C3, hoặc buffer đã sẵn); không dùng làm
bằng chứng gì về quirk vì landing vẫn đúng 2,5.

### 4.2 Binary khác duy nhất trên máy KHÔNG DÙNG ĐƯỢC cho probe loopback (đã chẩn đoán tới cùng)

Binary `/opt/meta-chromium/chrome` (Muse Browser 155.0.8059.91,
Hatch build: upstream 153 + 10 patch, theo README trong thư mục)
gặp 2 lớp chặn liên tiếp, đều đã chẩn đoán bằng thực nghiệm
(script chẩn đoán 1 lần ở `/tmp/d3-meta-diag.mjs`, không vào repo):

1. **Không khởi động nếu thiếu WebGL domain policy** —
   `ERROR ... Hatch WebGL domain policy is required for browser
   startup` (lần chạy v1-meta: DevTools port không lên sau 30 s,
   exit 2). README ghi: "Normal startup requires the image-owned
   WebGL policy supplied by browser-daemon." ĐÃ GIẢI ĐƯỢC:
   binary có sẵn validator
   (`--hatch-validate-webgl-allowed-domains --version`); file
   policy nội dung đúng `hatch-webgl-all-origins-v1\n` được
   validator chấp nhận (in lại `hatch-webgl-all-origins-v1
   sha256=8097045f...`); thiếu `\n` cuối → "invalid WebGL domain
   policy contract"; file list domain chứa `127.0.0.1` →
   "non-registrable domain" (IP không phải domain đăng ký được).
   Harness tự ghi file policy vào scratch + tính sha256 từ đúng
   bytes đã ghi. Sau bước này binary khởi động được, DevTools lên
   `Chrome/155.0.8059.91 | 1.3`.
2. **Khởi động được nhưng chặn mọi navigation tới loopback** —
   tab đã tới đúng URL đích (`/json/list` thấy URL) nhưng document
   không bao giờ load: `Page.navigate` trả
   `errorText: "net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS"`,
   title kẹt ở host `127.0.0.1`, `window.__c3` mãi undefined →
   cả 9 probe timeout 40 s (2 lần chạy v1-meta-policy và
   v1-meta-policy-noproxy). Đối chứng trong cùng phiên chẩn đoán:
   `data:text/html` load BÌNH THƯỜNG (title đúng,
   `window.__x = 42`) — JS/navigation cơ bản không hỏng; chỉ
   http loopback bị chặn. Server probe trả 200 qua curl nên lỗi
   không phải do server.
3. **Các cách gỡ đã thử, đều không có tác dụng:**
   - `--no-proxy-server` (giả thuyết proxy env: máy có
     `http_proxy/https_proxy → hatch-egress-proxy:3128`,
     `NO_PROXY` có `127.0.0.1`) — vẫn chặn y hệt → proxy
     KHÔNG phải nguyên nhân, giả thuyết bị bác.
   - `--disable-features=LocalNetworkAccessChecks` — vẫn chặn
     (tên feature theo `#local-network-access-check`; có thể
     binary Hatch ép check bất kể cờ, hoặc cơ chế chặn nằm ở
     lớp khác).
   - `--local-network-access-allowed-for-urls=*` — vẫn chặn
     (cờ có thể bị binary bỏ qua, hoặc allowlist này không áp
     cho navigation top-level).
   - Tạo tab kèm URL qua `PUT /json/new + {"url": ...}` — tab
     ở mãi `about:blank` (meta 155 cũng bỏ qua URL ở `/json/new`
     như Chrome 156) nên không kiểm chứng được giả thuyết
     initiator.
4. **Đường còn lại KHÔNG THỬ (ghi rõ, không lén làm):** ghi
   managed policy `LocalNetworkAccessAllowedForUrls` vào
   `/etc/opt/chrome/policies/managed/` (thư mục tồn tại, user
   đang là root). Đây là thay đổi bền vững, liên quan bảo mật,
   vào cấu hình trình duyệt thật của user — ngoài phạm vi luồng
   (task chỉ cho "chạy headed với cờ khác / binary khác nếu có
   sẵn", không cho sửa cấu hình hệ thống) nên KHÔNG thử.

**Kết luận §4:** 3 biến cờ (DSF, autoplay, GPU) đã loại trừ bằng
số — không biến nào tái hiện quirk. Biến binary VẪN MỞ: binary
khác duy nhất trên máy không load được trang probe loopback
trong môi trường này, nên không có phép đo fail-fast nào trên
nó. Fail-fast seek-landing-0 headed VẪN NOT_MEASURED (nối C3
§9 mục 1). Biến còn lại sau đợt này: đúng binary/cờ của phiên
Chrome Y2 gốc (không còn bản ghi), hoặc một fixture đáp sai ổn
định khác — cả hai đều chưa có.

## 5. Quirk đáp sai frame khác 0 — hướng fixture mới

Đã thử đúng 2 hướng mới (time-box, trong cùng các lần chạy
chromevar v2/v3/v4 — mỗi hướng đo ở cả 3 variant, kết quả nhất
quán):

| Hướng | Fixture | Cách làm | Kết quả ở mức raw (seek 2,5) |
|---|---|---|---|
| A. Điền rác thay vì zero | `var-garbage-kf20.mp4` | 2 packet keyframe pts 2,0–2,0334 điền `0xFF` (13.146 byte, pos 206.286–223.687, cùng khoảng với var-kf20 của C3) | error code 3 `PIPELINE_ERROR_DECODE ... timestamp=2066667 size=4255`, sau: seeking true, rs 1, ct 2,5 — **giống hệt biến thể zero** của C3. Decoder không "bỏ NAL hỏng mà tiếp tục" như giả thuyết; 0xFF cũng hỏng pipeline |
| B. Thêm track audio | `var-broken-av.mp4` | broken-gap + track audio AAC im lặng (`ffmpeg -c:v copy`, 316.935 byte, streams h264+aac, duration 3,0) | **`seeked@2.500`** — đáp đúng, audio track không đổi landing. Đối chứng `var-av.mp4` (valid-gop + audio) cũng `seeked@2.500` |

Không hướng nào cho landing sai khác 0 ở mức raw → không có R15
(seekElement trên biến thể đáp sai) ở bất kỳ variant nào.
**Quirk đáp sai frame khác 0 headed VẪN NOT_MEASURED** (nối C3
§9 mục 2). Ghi nhận thêm: Chrome 156 gặp packet keyframe hỏng
(dù zero hay 0xFF) thì hỏng pipeline với cùng chữ ký lỗi
(`timestamp=2066667`, packet không phải keyframe `is_key_frame=0`
— tức lỗi bung ra ở packet P-frame đầu tiên sau keyframe hỏng,
không phải ở chính keyframe), chứ không "đáp về keyframe gần
nhất". Hướng chưa thử (để đợt sau, khôngclaim): cắt GOP nhưng
giữ moov/stss hợp lệ để demuxer không hỏng pipeline, file nhiều
track video, hoặc GOP có keyframe lỗi ở vị trí khác (vd. giữa
GOP thay vì đầu GOP).

## 6. Kiểm chứng gộp của luồng

- Hồi quy pause tổng (chạy lại độc lập, strip-types, trừ pause45A2
  chạy esbuild như mẫu C3): seek **15/15**,
  seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2 **11/11**,
  pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2 **9/9**,
  pauseDraw40V3 **11/11**, pauseDraw41W2 **13/13**,
  pause46B2 **11/11**, pause45A2 **14/14** — cộng lại
  **111/111, fail 0** (khớp C3/đợt 46). Thêm audioEngine44Z2
  (đã sửa mock): **6/6** (trước sửa mock: 4/5 với test cũ; sau
  sửa test + mock: 6/6). Tổng cộng **117 test xanh**.
- `tsc --noEmit` (apps/web): **0 lỗi** (1 file `.ts` test đổi
  trong lượt này; production `.ts`/`.tsx` không đổi).
- `vite build --outDir /tmp/d3-app-dist`: **pass** (39,34 s;
  cảnh báo chunk > 500 kB cũ; chậm do máy chạy song song nhiều
  luồng đợt 48 — không so với 8,36 s của B2 lúc máy vắng).
- Headed malspec: 11/11 case chạy xong (2 lần chạy M1, 1 lần
  chạy lại M5 sau khi sửa detection) — xem §3.
- Headed chromevar: v2/v3/v4 exit 0 (7 kiểm tra, FAIL = 0 mỗi
  lần); v1-meta exit 2 (binary không khởi động); v1-meta-policy
  và v1-meta-policy-noproxy exit 1 (cả 9 probe timeout, 2 control
  FAIL vì probe không load — harness từ chối diễn giải, đúng
  luật) — xem §4.
- `node --check` cả 2 harness mới sau mọi lần sửa: OK.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 48, phiên solo thật, đo IDB thật, Safari / máy thật.

## 7. File đổi/thêm

SỬA (1 file test):

- `apps/web/src/lib/audioEngine44Z2.test.ts` — mock `createMediaElementSource`
  ném `InvalidStateError` khi gọi lại cùng element (khớp Chrome
  thật C3 R16); test "sau release update lại" sửa theo hành vi
  thật + thêm test khóa trực tiếp mock ném (xem §2).

MỚI (2 harness + LIMITS này):

- `apps/web/scripts/pause48D3-malspec.mjs` — harness săn kind
  `"error"` qua spec dị dạng (11 case, seed IDB + autosave,
  scrub `.tl-ruler`, poll `__vcutPreviewIdle`, thu lỗi uncaught
  kèm stack qua `Page.addScriptToEvaluateOnNewDocument`).
- `apps/web/scripts/pause48D3-chromevar.mjs` — harness loại trừ
  cờ/binary Chrome (4 variant chính + 2 variant meta-policy,
  9 probe/lần, fixture biến thể garbage-kf20 + broken-av).
- `docs/PHASE9_ROUND48_D3_PAUSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production (preview.tsx,
audioEngine.ts, seek.ts, media.ts…), tsconfig.json, paths-loop,
build-loop-log (parent ghi log lượt — xem báo cáo). Scratch +
fixture + dist tạm ở `/tmp/d3-app-dist`, `/tmp/d3-media`,
`/tmp/d3-malspec-*`, `/tmp/d3-chromevar-*`,
`/tmp/pause48d3-chromevar-*`, `/tmp/d3-meta-diag.mjs`,
`/tmp/d3-policy-*.txt`, `/tmp/pause45A2.test.mjs` (không vào
repo, không vào batch).

## 8. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed vẫn thiếu** (Z2 + mở rộng
   B2/C3): nay đã loại trừ thêm 3 biến cờ (DSF, autoplay, GPU)
   bằng số; binary khác duy nhất trên máy không dùng được cho
   probe loopback (chặn LNA, xem §4.2). Cần đúng binary/cờ của
   phiên Chrome Y2 gốc (không còn bản ghi), hoặc một fixture đáp
   sai ổn định khác.
2. **Quirk đáp sai frame khác 0 headed cũng thiếu**: 2 hướng
   mới đợt này (điền 0xFF, thêm track audio) đều không đáp sai;
   cộng 5 biến thể zero của C3 thì Chrome 156 luôn hoặc đáp
   đúng, hoặc hỏng pipeline error 3. Cần hướng tạo fixture khác
   (GOP cắt nhưng giữ moov/stss, nhiều track video, keyframe lỗi
   giữa GOP) — chưa thử.
3. **Kind `"error"` qua spec dị dạng đã đóng theo hướng này**
   (§3.3): không tạo được qua đường app thật vì lý do cấu trúc
   (cổng load chặn + tick chết ở `syncMedia` trước executor).
   Bằng chứng duy nhất còn lại cho kind `"error"` là executor
   ném nhân tạo của B2 (đo headed) — đừng claim đã có bằng chứng
   production từ spec/file media thật.
4. **BUG MỚI PHÁT HIỆN (không sửa trong luồng này):** project
   có clip audio mang `volumeKeyframes` chứa entry null làm vòng
   lặp preview chết cứng sau 1 lần load (tick ném TypeError ở
   `syncMedia`, `wake()` no-op vì `sleeping=false`, scrub/phát
   đều không cứu; chỉ reload trang với project khác mới hết).
   Hướng sửa cho đợt sau: hoặc validate `volumeKeyframes` ở cổng
   load (`parseProjectText`), hoặc bọc tick vòng lặp bằng
   try/catch để một tick lỗi không giết cả vòng lặp. Chưa quyết
   định hướng nào trong luồng này.
5. **Vòng lặp preview với footage hoàn toàn không decode được
   quay ~19 tick/s trong ~30–40 s trước khi ngủ** (nợ C3 §9 mục
   4) — chưa đụng tới trong luồng này.
6. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed 156.0.8078.4 + Hatch 155.0.8059.91) — cùng giới hạn
   như các đợt trước.
