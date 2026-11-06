# Phase 9 đợt 47, luồng C3 — Bằng chứng headed cho fail-fast seek-landing-0 + quirk đáp sai frame khác 0 + kind "error" + chênh lệch releaseElement — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng (xem §8).
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận. Mọi số timing đều đo trên máy đang chạy song song
nhiều luồng đợt 47 — không dùng làm baseline quiet hay claim fps
(vite build đợt này 55,40 s so với 8,36 s của B2 khi máy vắng hơn).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Fail-fast seek-landing-0 headed — VẪN NOT_MEASURED, nhưng lần
   này đã loại trừ thêm 2 biến mà B2 chưa loại trừ được.** Harness
   tab-mới kiểu probe243 nay chạy ĐÚNG (sau 3 lần sửa lỗi harness,
   xem §2): tab mới riêng cho mỗi probe + server Y2-exact không
   Range + thứ tự gap-15 trước gap-25 — vậy mà seek 2,5 trên
   broken-gap vẫn đáp đúng 2,5 ở cả 2 lần raw (R2, R4) lẫn 2 lần
   seekElement (R6: 302 ms, 1 landing @2,5; R14 qua Range: 28 ms).
   A/B server Range/không-Range cũng không đổi kết quả (R13/R14
   đáp đúng như R2/R6). Biến còn lại duy nhất: cờ/trạng thái của
   phiên Chrome Y2 gốc (không còn bản ghi). Đừng trích PASS headed
   cho fail-fast Z2/B2.
2. **Quirk đáp sai frame khác 0 headed — VẪN NOT_MEASURED.**
   5 fixture biến thể zero-packet (kf20, half2, gop2, half1,
   trunc25) KHÔNG fixture nào đáp sai khác 0: 4 fixture zero đều
   cho element error code 3 (PIPELINE_ERROR_DECODE, kẹt seeking,
   rs 1) thay vì đáp sai; trunc25 đáp đúng 2,5. Không có R15.
   Chrome 156 gặp packet zero thì hỏng pipeline chứ không "đáp
   về keyframe gần nhất" như giả thuyết ban đầu.
3. **Kind `"error"` từ fixture media thật — KHÔNG TÌM THẤY sau
   5 fixture thử trong app thật** (broken-corrupt, broken-trunc,
   empty 0 byte, garbage 50.000 byte, mpeg4-unsupported 195.231
   byte). 2 fixture decode được một phần cho kind `"timeout"`
   (cap 10, phục hồi); 3 fixture không decode được cho kind rỗng
   (seekFailureCount giữ 0, vòng lặp rơi vào cap W2 skip-vẽ 600).
   Lý giải bằng code (§5.2): executor của Seeker chỉ ném khi
   `collectActives` ném; `pool.videoFor/audioFor` không ném theo
   media, `seekAll` bắt lỗi từng element — nên media hỏng chỉ tạo
   timeout/failed, không tạo đường ném đồng bộ. Đây là kết quả âm
   tính thật, không phải chưa thử.
4. **Chênh lệch mock vs Chrome thật về releaseElement — ĐÃ ĐO,
   PASS, khẳng định A2 §5.7 từng con số.** Chrome thật gọi lại
   `createMediaElementSource` cho cùng element sau release và NÉM
   `InvalidStateError` (nodesSize 0, hasEl1 false); gain rơi về
   fallback `el.volume = 0,5` đúng như thiết kế. Test mock Z2 ghi
   "sources.length == 2 sau release + update lại" là SAI so với
   Chrome thật — mock đó vẫn đứng và cần được sửa ở đợt sau (xem
   §9 mục 5); hành vi production (dùng element mới) không đổi.

## 1. Trạng thái trên đĩa khi tiếp quản (daemon restart giết lượt trước)

- Lượt chạy trước của luồng này bị daemon restart giết giữa chừng,
  KHÔNG có báo cáo cuối. Trên đĩa còn: 2 harness
  `apps/web/scripts/pause47C3-headed.mjs` (583 dòng) và
  `pause47C3-apploop.mjs` (296 dòng) — cả hai đã viết XONG, chưa
  từng chạy thành công lần nào.
- Scratch `/tmp/pause47c3-headed-4138` còn nguyên: fixture Y2 md5
  đúng, 5 biến thể đã build, bundle + 3 trang probe đã viết. Nhưng
  KHÔNG có kết quả đo nào được lưu (harness chỉ in JSON cuối lượt).
- Tiến trình cũ còn sống: PID 4138 (node harness gốc, 07:10) vẫn
  chạy, Chrome của nó (port 9223) + Xvfb :90 còn sống. Đã dọn:
  kill Chrome-profile-4138 + Xvfb :90 (PID 4333) trước khi chạy
  lại; sau đó kill luôn PID 4138 khi nó chạy với Chrome đã chết
  (probe của nó chỉ còn fetch-fail, không còn giá trị đo). Port
  9223 + display :90 đã trống trước mỗi lần rerun.
- `/tmp/c3-app-dist` CHƯA TỒN TẠI khi tiếp quản (apploop chưa từng
  chạy) — đã build mới từ source hiện tại (§6).
- `round-in-progress.md` KHÔNG tồn tại → lượt chạy bình thường.
- Không có file LIMITS nào của C3 trước lượt này.

## 2. Ba lỗi harness đã sửa trong lượt này (đều là lỗi của harness, không phải của production)

Lượt trước viết harness xong nhưng chưa chạy được lần nào; lượt này
chạy lại đã vấp 3 lỗi liên tiếp, mỗi lỗi đều được cô lập bằng bằng
chứng riêng trước khi sửa:

### 2.1 Chrome 156 bỏ qua URL ở `/json/new` (C3-FIX)

- Triệu chứng rerun 1: R1/R2 timeout 40 s, `window.__c3` là
  `undefined` (probe không load trang).
- Kiểm chứng tay: `curl /json/list` cho thấy tab mới tạo qua PUT
  + JSON body `{"url": ...}` vẫn ở `about:blank`; thử lại PUT +
  `?url=...` cũng ở `about:blank` sau 12 s. Chrome 156 (chromium
  -1248) không navigate tab mới qua `/json/new` nữa — đúng lỗi
  "trả undefined cho cả đối chứng valid" mà B2 §3.3 gặp ở scratch
  probe-y2exact.
- Sửa: tạo tab trống qua `/json/new` rồi navigate bằng CDP
  `Page.navigate` (mẫu đã chứng minh ở apploop B2 /
  `Target.createTarget` + `Page.navigate`).

### 2.2 Giả thuyết "tab nền đóng băng timer" — SAI, đã loại trừ bằng thí nghiệm

- Triệu chứng rerun 2 (sau C3-FIX): R1/R2 vẫn timeout 40 s, nhưng
  lần này `__c3` đọc được: `loadedmetadata` + `canplay` có, còn
  `beforeSet` vắng — tức `setTimeout(3000)` trong trang probe
  không bao giờ chạy.
- Giả thuyết đầu: tab mới mở ở nền nên Chrome đóng băng timer;
  đã thêm `Page.bringToFront` (rerun 3) — vẫn timeout y hệt.
- Thí nghiệm cô lập `/tmp/c3-timer-test.mjs` (ngoài repo): tab mới
  qua `/json/new` + `Page.navigate` tới trang `data:` có
  `setInterval` 500 ms — đếm được `n = 10` sau 6 s (không
  bringToFront) và `n = 11` (có bringToFront),
  `visibilityState = "visible"` cả hai. Timer chạy bình thường
  trong tab mới — giả thuyết tab nền SAI.
- Nguyên nhân thật (§2.3): `raw.html` thiếu thẻ `<body>`.

### 2.3 `raw.html` thiếu `<body>` — lỗi thật

- `raw.html` là classic `<script>` đặt trong `<head>`, không có
  thẻ `<body>` nào trong markup. Script chạy trước khi parser tạo
  body → `document.body` là `null` →
  `document.body.appendChild(v)` ném `TypeError` → dòng
  `setTimeout(..., 3000)` phía sau không bao giờ được đăng ký.
  Khớp chính xác trạng thái quan sát: `__c3` tồn tại (gán trước
  dòng lỗi), listener đã gắn, `v.src` đã gán (media load được),
  nhưng `beforeSet`/`setThrew` không bao giờ xuất hiện.
- `seekel.html` và `release.html` không mắc lỗi này vì đều là
  `<script type="module">` (deferred — chạy sau khi parse xong,
  body đã có).
- Sửa: thêm `<body>` vào chuỗi `raw` ngay trước `<script>`.
  Rerun 4 sau sửa này: 16/16 probe done, 9 kiểm tra, FAIL = 0.

## 3. Harness headed pause47C3-headed.mjs — 16 probe, 9 kiểm tra

Chạy: `node apps/web/scripts/pause47C3-headed.mjs` (rerun 4, log
`/tmp/c3-headed-rerun4.log` — log ở /tmp, không vào repo).
Chrome DevTools: `Chrome/156.0.8078.4 | 1.3`, Xvfb riêng :90,
server scratch `127.0.0.1:34065`. Exit 0, FAIL = 0.
Fixture Y2 md5 đúng (không encode lại): valid-gop
`2c2e4771954fd26e1c377ce5900e377d`, broken-gap
`f0e11b602e714246466f6936e58afcd1`, đều 313.311 byte.

### 3.1 Biến thể zero-packet đã build (ở /tmp, không vào repo)

| Fixture | Khoảng pts zero | Packet | Byte zero | Vị trí |
|---|---|---|---|---|
| var-kf20.mp4 | 2,0–2,0334 | 2 | 13.146 | 206.286–223.687 |
| var-half2.mp4 | 2,0–2,5 | 15 | 58.524 | 206.286–264.810 |
| var-gop2.mp4 | 2,0–3,0 | 30 | 107.025 | 206.286–313.311 |
| var-half1.mp4 | 1,0–1,5 | 15 | 53.095 | 101.878–159.143 |
| var-trunc25.mp4 | cắt sau pts 2,5 | — | còn 271.661 / 313.311 | lastPts 2,5 |

### 3.2 Bảng probe (thứ tự Y2: gap-15 trước gap-25, cùng process)

| # | Probe | Kết quả |
|---|---|---|
| R1 | raw broken-gap 1,5, server Y2-exact | error 3, `PIPELINE_ERROR_DECODE ... timestamp=1133333 size=4779`, sau: seeking true, rs 1, ct 1,5 — **khớp chữ ký hỏng Y2 §3.1** |
| R2 | raw broken-gap 2,5, server Y2-exact | `seeked@2.500`, rs 4 — quirk vắng mặt |
| R3 | raw valid-gop 2,5 | `seeked@2.500` (đối chứng) |
| R4 | raw broken-gap 2,5 lặp lại | `seeked@2.500` — quirk vắng mặt cả lần lặp |
| R5 | raw valid-gop 2,5 lặp lại | `seeked@2.500` (đối chứng) |
| R6 | seekElement broken-gap 2,5 | seeked true, **1 landing @2,5**, 302 ms, classified `correct` frame 75, shouldFail false |
| R7 | seekElement valid-gop 2,5 | seeked true, 1 landing @2,5, 210 ms (đối chứng) |
| R8 | raw var-kf20 2,5 | error 3 `@2066667 size=4255`, sau: seeking true, rs 1, ct 2,5 — **không đáp sai, hỏng pipeline** |
| R9 | raw var-half2 2,5 | error 3 `@2066667 size=4255`, sau: seeking true, rs 1, ct 2,5 |
| R10 | raw var-gop2 2,5 | error 3 `@2066667 size=4255`, sau: seeking true, rs 1, ct 2,5 |
| R11 | raw var-half1 1,5 | error 3 `@1133333 size=4779`, sau: seeking true, rs 1, ct 1,5 |
| R12 | raw var-trunc25 2,5 | `seeked@2.500` — cắt sau 2,5 không ảnh hưởng seek tới 2,5 |
| R13 | raw broken-gap 2,5 qua Range (206) | `seeked@2.500` — giống hệt không-Range |
| R14 | seekElement broken-gap 2,5 qua Range | seeked true, 1 landing @2,5, **28 ms** — giống hệt không-Range |
| R15 | seekElement trên biến thể đáp sai | **BỎ QUA: source null** — không biến thể nào đáp sai khác 0 ở mức raw |
| R16 | releaseElement | xem §7 |

### 3.3 Bảng kiểm tra (9 kiểm tra: 3 PASS, 2 NOT_MEASURED, 4 OBSERVED)

| Kiểm tra | Trạng thái | Số thật |
|---|---|---|
| CONTROL-valid-raw-2.5-x2 | PASS | R3 + R5 đều `seeked@2.500` |
| R1-raw-broken-1.5-observed | OBSERVED | error 3, kẹt seeking, rs 1 (xem §3.2) |
| R2-R4-raw-broken-2.5-observed | OBSERVED | R2 + R4 đều `seeked@2.500` |
| C3-zero-landing-fail-fast-headed | NOT_MEASURED | Quirk `seeked@0` không tái hiện ngay cả với tab-mới + server Y2-exact + thứ tự Y2; R6 đáp đúng 1 landing |
| C3-wrong-nonzero-raw-variants-observed | OBSERVED | 4 biến thể zero đều error 3 kẹt seeking; trunc đáp đúng |
| C3-wrong-nonzero-fail-fast-headed | NOT_MEASURED | Không biến thể nào đáp sai khác 0 ở mức raw nên không có R15 |
| C3-server-range-AB-observed | OBSERVED | Range (R13/R14) = không-Range (R2/R6): server **không phải** biến quyết định |
| C3-releaseElement-headed | PASS | xem §7 |
| CONTROL-valid-seekElement-2.5 | PASS | R7: seeked true, 1 landing @2,5, 210 ms |

### 3.4 Vì sao vẫn NOT_MEASURED — và cái gì đã loại trừ được (cập nhật B2 §3.3)

Đã loại trừ thêm so với B2 (có số): tab mới riêng cho mỗi probe
(R2/R4 vẫn đáp đúng), server không Range kiểu Y2-exact (R2/R4),
server có Range kiểu B2 (R13/R14 đáp đúng y hệt), thứ tự probe
gap-15 trước gap-25 trong cùng process (R1 trước R2), seek sau
`loadedmetadata` + 3 s chờ (buffer `[0, 3]` đầy ở R6/R14),
fixture byte-identical (B2), track audio (B2 lần 1 video-only).
Còn lại, chưa kiểm chứng được: cờ khởi động Chrome của phiên Y2
(không còn bản ghi — harness này dùng xấp xỉ tốt nhất ghi trong
comment §7 của script: chromium-1248 + DSF=1 + autoplay flag),
trạng thái giải mã/GPU của phiên đó. Một khả năng khác chưa thử:
phiên Y2 chạy Chrome "chạy tay" (không phải binary Playwright
chromium-1248) — cờ/binary khác có thể đổi hành vi demuxer.
Muốn đóng nợ này cần hoặc chạy lại đúng binary/cờ của phiên Y2
(nếu tìm lại được), hoặc một fixture đáp sai ổn định khác — 5
biến thể đợt này đều không đáp sai.

## 4. Harness app-loop pause47C3-apploop.mjs — vòng lặp preview trong app thật

Dist build từ source hiện tại ra `/tmp/c3-app-dist` (vite build
pass, 55,40 s — chậm do máy đang chạy song song nhiều luồng đợt
47, xem lưu ý đầu file). Seed broken-gap cho đúng assetId/sha Y2
(`a_506f5ab74860f6fe`, 313.311 byte). Ruler: click offset 90 px =
1,5 s / 150 px = 2,5 s (60 px/s, khớp Y2).

### 4.1 broken-gap — 2 lần chạy (lần 2 sau khi sửa lỗi thiết kế giai đoạn 3)

| Giai đoạn | Lần 1 (07:31) | Lần 2 (07:41) |
|---|---|---|
| Settle | sleeping, lastDrawn 0, ticks 5 | (giống lần 1) |
| Scrub 2,5 trên element pool tươi | lastDrawn 2,5, sleeping, count 0, ticks 8 — quirk vắng mặt trong app | giống lần 1 (ticks 8, holdDraw 2, holdSkip 1) |
| Scrub 1,5 → cạn cap seek | Sau 18,8 s: ticks 413, count 10, kind `"timeout"`, recreated 1, recSeeking 1 — **PASS, tái xác nhận B2 (17,1 s)** | Sau 18,1 s: ticks 504, count 10, kind `"timeout"`, recreated 1, recSeeking 1 — **PASS** |
| Scrub 2,5 lần nữa trên element MỚI sau drop | NOT_MEASURED (lỗi thiết kế harness — xem §4.2) | **OBSERVED: vẽ được 2,5** (xem §4.2) |
| Ticks đứng yên sau lần ngủ cuối | 413 == 413 sau 5 s — **PASS** | 513 == 513 sau 5 s — **PASS** |

### 4.2 Lỗi thiết kế giai đoạn 3 ở lần 1 và cách sửa

Bản đầu của apploop (viết ở lượt trước) scrub thẳng 2,5 sau khi
cạn cap 1,5 — nhưng `lastDrawn` lúc đó vẫn là 2,5 (đã vẽ ở giai
đoạn 1, 1,5 không bao giờ vẽ được), nên guard Z2 coi scrub-to-2,5
là "đã vẽ" và KHÔNG phát seek mới. Lần 1 ghi NOT_MEASURED đúng
luật (không bịa PASS). Lần 2 sửa: scrub 0,5 trước để vẽ lại
`lastDrawn = 0,5` (vùng GOP0 lành; ticks 509, count reset 0,
recreated reset 0 — cap reset khi scrub sang t mới), rồi mới
scrub 2,5: seek 2,5 phát thật trên element mới sau drop, app vẽ
được 2,5 (ticks 513, count 0, recreated 0). Quirk vắng mặt cả
trên element tươi sau drop — nhất quán với mức element (§3).

### 4.3 valid-gop (đối chứng) — PASS

Settle ticks 6, sleeping, lastDrawn 0. Scrub 2,5 → lastDrawn 2,5,
sleeping, count 0, recreated 0, ticks 9 — vẽ được, không cạn cap,
không phục hồi oan.

## 5. Săn kind `"error"` từ fixture media thật — KHÔNG TÌM THẤY (kết quả âm tính thật)

### 5.1 Phương pháp

Mở rộng apploop thêm luồng HUNT (mới trong lượt này): seed từng
fixture trong `~/workspace/tmp-round43-y2/media/`, scrub 2,5 rồi
1,5, poll tới khi ngủ, ghi toàn bộ quỹ đạo + mọi `seekFailureKind`
từng xuất hiện. PASS = tìm thấy kind `"error"`; không thấy thì
OBSERVED kèm danh sách kind đã thấy (kết quả âm tính, không phải
FAIL của harness). Fixture thử: broken-corrupt (300.336 byte),
broken-trunc (31.844 byte), empty (0 byte, sha256
`e3b0c44298fc1c14...` — đúng sha của file rỗng), garbage
(50.000 byte), mpeg4-unsupported (195.231 byte). Thêm valid-gop +
broken-gap làm nền (đã có kind ở §4).

### 5.2 Bảng kết quả hunt (không fixture nào cho kind `"error"`)

| Fixture | kind từng thấy | max count | Cạn cap? | lastDrawn cuối | Ghi chú |
|---|---|---|---|---|---|
| broken-corrupt | `["timeout"]` | 10 | có (recreated 1) | 0 | Như broken-gap: seek timeout → cap X2 → phục hồi |
| broken-trunc | `["timeout"]` | 10 | có (recreated 1) | 0 | Như trên |
| empty (0 byte) | `[]` | 0 | không | null | Vòng lặp quay ~19 tick/s lúc settle (ticks 530 sau 30 s, sleeping false), rồi cạn cap W2 skip-vẽ 600 (pauseRetrySkipped 600, exhausted true, holdSkip 1725) — seek không đếm |
| garbage (50.000 B) | `[]` | 0 | không | null | Như empty: ticks 578 lúc settle, W2 cạn 600, holdSkip 1774 |
| mpeg4-unsupported | `[]` | 0 | không | null | Như empty: ticks 570 lúc settle, W2 cạn 600, holdSkip 1766 |
| (nền) broken-gap | `["timeout"]` | 10 | có | 2,5 | §4 |
| (nền) valid-gop | `[]` | 0 | không | 2,5 | Vẽ được, không lỗi |

### 5.3 Vì sao media hỏng không tạo được kind `"error"` (lý giải bằng code, đã đọc)

Đường duy nhất tới kind `"error"` ở tầng Seeker là executor ném
đồng bộ (B2 §5: bọc thành reject → classify `"error"`). Executor
trong `preview.tsx` (dòng ~2876) chỉ làm 2 việc:

1. `collectActives(spec, pool, mediaByName, tt)` — các lệnh phụ
   thuộc media là `pool.videoFor(item)` / `pool.audioFor(item)`
   (`media.ts`): chỉ `document.createElement` + gán `src`, không
   ném theo nội dung file; lỗi media chỉ hiện thành sự kiện
   `error` bất đồng bộ trên element. Các lệnh còn lại
   (`rampSourceTimeAt`, `rampSpeedAt`, `computeClipGain`,
   `toPreviewFx`) là toán thuần trên dữ liệu clip, không đọc
   byte media.
2. `seekAll(targets, ...)` — bắt lỗi từng element, không bao giờ
   reject (B2 §5.1).

Nên media hỏng chỉ tạo timeout (seek kẹt quá 1200 ms) hoặc failed
(seekElement fail nhanh, ok:true — đi nhánh vẽ, không đếm cap X2),
không tạo đường ném đồng bộ. Muốn có kind `"error"` từ production
cần hoặc dữ liệu spec dị dạng làm `collectActives` ném (không
phải fixture media), hoặc một executor khác ném — cả hai đều nằm
ngoài nhiệm vụ "fixture media thật" của luồng này. Đừng claim
kind error đã có bằng chứng từ file media thật.

### 5.4 Quan sát phụ (không phải mục tiêu, ghi để đợt sau khỏi đo lại)

Với fixture không decode được (empty/garbage/mpeg4-unsupported),
vòng lặp preview lúc settle KHÔNG ngủ: ticks ~530–578 sau 30 s
(~19 tick/s), `pauseRetrySkipped` leo ~525–574, `lastDrawn`
null. Nó chỉ ngủ sau khi cạn cap W2 (600 lần skip-vẽ,
`pauseRetryExhausted = true`, holdSkip ~1725–1774). Tức app không
treo vĩnh viễn với footage hỏng hoàn toàn, nhưng tốn ~30–40 s
tick liên tục trước khi ngủ — hành vi này chưa có test khóa, để
nợ mở (§9 mục 4).

## 6. Kiểm chứng gộp của luồng (số thật)

- Headed element (rerun 4): 16/16 probe done, 9 kiểm tra,
  **FAIL = 0** (3 PASS, 2 NOT_MEASURED, 4 OBSERVED — xem §3.3).
- App-loop broken-gap ×2: cap-10-timeout PASS cả 2 lần (18,8 s /
  18,1 s); ticks đứng yên PASS cả 2 lần (413 == 413, 513 == 513);
  valid-gop PASS; 2,5 sau drop OBSERVED (vẽ được).
- Hunt kind error: 5/5 fixture chạy xong, 0 fixture cho kind
  `"error"` (§5.2).
- Hồi quy pause tổng (chạy lại độc lập, strip-types, trừ pause45A2
  chạy esbuild như mẫu A2): seek **15/15**,
  seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2 **11/11**,
  pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2 **9/9**,
  pauseDraw40V3 **11/11**, pauseDraw41W2 **13/13**,
  pause46B2 **11/11**, pause45A2 **14/14** — cộng lại
  **111/111, fail 0** (khớp đợt 46).
- `tsc --noEmit` (apps/web): **0 lỗi** (không file `.ts` nào đổi
  trong lượt này nên tsc chỉ xác nhận trạng thái hiện tại).
- `vite build --outDir /tmp/c3-app-dist`: **pass** (55,40 s,
  cảnh báo chunk > 500 kB cũ; chậm do máy chạy song song nhiều
  luồng đợt 47 — không so với 8,36 s của B2).
- `node --check` cả 2 harness sau sửa: OK.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 47, phiên solo thật, đo IDB thật.

## 7. Chênh lệch mock vs Chrome thật về releaseElement (A2 §5.7) — ĐÃ ĐO, PASS

Probe R16 (`release.html`, bundle `audioEngine.mjs` từ source hiện
tại), Chrome 156 headed thật:

| Bước | Số thật |
|---|---|
| `ensure()` | true, `isReady` true, ctx `running`, nodesSize 0 |
| Load 2 video valid-gop | 2× `loadedmetadata` |
| `update` el1 gain 0,5 lần đầu | `createMediaElementSource` +1, nodesSize 1, hasEl1 true, el1.volume 1 |
| `releaseElement(el1)` | trả true, nodesSize 0, hasEl1 false |
| `update` lại el1 gain 0,5 | `createMediaElementSource` gọi lại (+1) nhưng **NÉM `InvalidStateError`**, nodesSize 0, hasEl1 false, **el1.volume = 0,5 (fallback gain đã áp)** |
| `update` el2 mới gain 0,5 | +1 call, không ném, nodesSize 1, hasEl2 true |
| Tổng | 3 lần gọi create, 1 lần ném (`InvalidStateError`) |

Kết luận: Chrome thật KHÔNG tạo lại source cho cùng element sau
release (đúng A2 §5.7); nó thử tạo lại rồi ném, và gain rơi về
fallback `el.volume`. Test mock Z2 ghi "sources.length == 2 sau
release + update lại" là SAI so với Chrome thật — mock đó cần sửa
ở đợt sau, nhưng hành vi production đúng (dùng element mới sau
drop) không đổi vì `releaseElement` trả true và element mới được
tạo source bình thường (el2).

## 8. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (2 file — cả hai do lượt trước viết, lượt này sửa cho chạy
được + mở rộng):

- `apps/web/scripts/pause47C3-headed.mjs` — C3-FIX: `runProbe`
  navigate bằng CDP `Page.navigate` (Chrome 156 bỏ qua URL ở
  `/json/new`, §2.1) + `Page.bringToFront` (§2.2); `raw.html` thêm
  `<body>` (§2.3); cập nhật comment đầu file.
- `apps/web/scripts/pause47C3-apploop.mjs` — thêm luồng HUNT cho
  mọi fixture trong thư mục media Y2 (§5.1); sửa giai đoạn 3
  broken-gap: scrub 0,5 trước rồi mới scrub 2,5 sau drop (§4.2).

MỚI (1 file + LIMITS này):

- `docs/PHASE9_ROUND47_C3_PAUSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file `.ts`/`.tsx` production và test (seek.ts,
preview.tsx, audioEngine.ts, pause45A2.ts, pause46B2.test.ts…),
tsconfig.json, paths-loop, build-loop-log. Scratch harness +
fixture + dist tạm ở `/tmp/pause47c3-headed-*`,
`/tmp/pause47c3-apploop-*`, `/tmp/c3-app-dist`,
`/tmp/c3-headed-rerun*.log`, `/tmp/c3-apploop-*.log`,
`/tmp/c3-timer-test.mjs` (không vào repo, không vào batch).

## 9. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed vẫn thiếu** (Z2 + mở rộng
   B2): nay đã loại trừ tab-mới, server Range/không-Range, thứ tự
   probe, fixture byte-identical — chỉ còn cờ/binary của phiên
   Chrome Y2 gốc (không còn bản ghi) là biến chưa loại trừ. Cần
   chạy lại đúng binary/cờ của phiên Y2 nếu tìm lại được, hoặc
   một fixture đáp sai ổn định khác.
2. **Quirk đáp sai frame khác 0 headed cũng thiếu**: 5 biến thể
   zero-packet đợt này đều cho error code 3 kẹt seeking thay vì
   đáp sai; Chrome 156 không "đáp về keyframe gần nhất" khi
   packet bị zero. Cần hướng tạo fixture khác (vd. GOP bị cắt
   nhưng còn moov/stss hợp lệ để demuxer không hỏng pipeline, hay
   file có nhiều track) — chưa thử.
3. **Kind `"error"` từ fixture media thật vẫn chưa có** (5 fixture
   đã thử, §5): theo lý giải §5.3 thì media không tạo được đường
   ném này — đợt sau nên đổi hướng: tìm dữ liệu spec dị dạng làm
   `collectActives` ném, hoặc chấp nhận kind `"error"` chỉ có
   bằng chứng từ executor ném nhân tạo (B2 đã đo headed) và đóng
   nợ này bằng quyết định ghi rõ, thay vì săn tiếp fixture.
4. **Vòng lặp preview với footage hoàn toàn không decode được
   quay ~19 tick/s trong ~30–40 s trước khi ngủ** (W2 cạn 600
   skip, §5.4) — chưa có test khóa, chưa đánh giá có cần ngủ sớm
   hơn không.
5. **Test mock Z2 về releaseElement vẫn ghi sai so với Chrome
   thật** ("sources.length == 2 sau release + update lại", §7) —
   cần sửa mock cho khớp hành vi thật (ném `InvalidStateError`,
   không tạo source mới, gain rơi về `el.volume`).
6. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed 156.0.8078.4) — cùng giới hạn như các đợt trước.
