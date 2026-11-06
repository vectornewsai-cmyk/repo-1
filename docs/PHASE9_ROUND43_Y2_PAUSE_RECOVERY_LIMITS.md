# Phase 9 đợt 43, luồng Y2 — Phục hồi sau cạn cap pause (nợ đợt 42 §5.3) — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp, theo mẫu X2). Chỉ sửa file thuộc phạm vi Y2; file
dùng chung chỉ thêm hunk có marker `ROUND43-Y2`. Mọi số dưới đây đều
đo/chạy thật; chỗ nào chưa đo được thì ghi rõ, không mạo nhận. Mọi số
timing đều under-load (nhiều luồng đợt 43 + nhiều tab Chrome cùng
chạy) — cấm dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn

1. **Kind `"error"` (ok=false) KHÔNG có bằng chứng browser — và nay đã
   rõ vì sao.** Mọi fixture lỗi media thật đều KHÔNG đi nhánh này:
   chúng đi đường W2 (vẽ → skip), không phải đường cap seek. Nhánh
   `"error"` chỉ tới được khi executor của Seeker reject — mà
   `seekAll` không bao giờ reject (bắt lỗi từng element), còn
   `collectActives` ném đồng bộ thì treo luôn entry của Seeker (không
   settle, không đi nhánh error — hazard mới, xem §5). Vì vậy kind
   `"error"` vẫn chỉ khóa bằng unit test, chưa có bằng chứng browser;
   đừng claim đã đo nó.
2. **Phục hồi sau cạn cap ĐÃ CÀI + ĐÃ CHỨNG MINH trước–sau trên
   browser thật.** Đúng lúc cạn cap, drop actives khỏi MediaPool để
   lần seek sau tạo element mới. Fixture quyết định là
   `broken-gap.mp4` (GOP giữa bị zero, GOP đầu/cuối nguyên):
   trước sửa, scrub từ 1,5 (hỏng) sang 0,5 (nguyên) vẫn timeout đủ 10
   lần rồi cạn lại; sau sửa, cùng luồng đó vẽ được frame 0,5 sau
   0,51 s. Clip lành không bị drop oan (control valid: recreated 0).
3. **Đính chính đợt 42 §3.4 (quan trọng, đọc kỹ).** X2 ghi "scrub về
   0,5 s (vùng dữ liệu còn nguyên)" cho `broken-trunc.mp4` là SAI:
   ffprobe cho thấy file đó chỉ còn frame tới ~0,233 s, nên thất bại
   ở 0,5 giải thích được bằng thiếu dữ liệu, không cần giả thuyết
   element kẹt. Hiện tượng element kẹt LÀ THẬT (xem §3), nhưng phải
   dùng fixture `broken-gap` mới chứng minh được — không phải
   `broken-trunc`.

## 1. Việc 1 — Kind `"error"`: đã thử những fixture nào, kết quả gì

### 1.1 Probe element độc lập (không qua app, trang probe.html)

| Fixture | Sự kiện element | error.code | Gán currentTime | seeked |
|---|---|---|---|---|
| `mpeg4-unsupported.mp4` (MPEG-4 Part 2, Chrome không decode) | `error` | 4 `DEMUXER_ERROR_NO_SUPPORTED_STREAMS` | không ném | không bao giờ |
| `empty.mp4` (0 byte) | `error` | 4 `DEMUXER_ERROR_COULD_NOT_OPEN` | không ném | không bao giờ |
| `garbage.mp4` (rác, không moov) | `error` | 4 `DEMUXER_ERROR_COULD_NOT_OPEN` | không ném | không bao giờ |
| `valid.mp4` (đối chứng) | `loadedmetadata` | — | không ném | có |

Đọc: cả ba fixture lỗi đều báo error event THẬT ở tầng element
(code 4), nhưng gán `currentTime` không ném và `seeked` không bao
giờ bắn. Vì vậy `seekElement` không đi nhánh `failed` (chỉ khi gán
ném) mà đi nhánh chờ timeout — hoặc, như §1.2 cho thấy, đi nhánh vẽ
qua lối tắt `needsSeek`.

### 1.2 App-level: fixture lỗi đi đường W2, không đi cap seek

Chạy headed (dist-before, scrub tới 1,5 s, poll tới 90 s):

| Fixture | seekFailureCount / kind | pauseRetrySkipped | Trạng thái cuối |
|---|---|---|---|
| `mpeg4-unsupported` | 0 / null | 285 (đang leo) | chưa ngủ sau 90 s |
| `empty` | 0 / null | 459 (đang leo) | chưa ngủ sau 90 s |
| `garbage` | 0 / null | 600 (chạm cap) | NGỦ kiểu W2 (`pauseRetryExhausted`, `lastDrawn` null) |

Giải thích đúng (đọc code, khớp số đo): lần seek đầu timeout 1 lần
rồi retry — nhưng element lỗi vẫn báo `currentTime` = target đã gán
(probe §1.1: `currentTimeAfter` = 1,5) nên `needsSeek` ở attempt sau
trả false → `seekElement` resolve thành công giả → nhánh VẼ →
`decideVideoFrame` skip (readyState < 2) → đếm vào cap W2. Tức
"media error" trong codebase này thuộc về W2, không thuộc cap seek
X2 — đúng bảng phân loại X2 §1 (failed-only đi nhánh vẽ), chỉ là
trước đây chưa có bằng chứng browser cho nó.

### 1.3 Vì sao nhánh `"error"` gần như không tới được (đọc code)

- `seekAll` bắt lỗi từng element (`.catch` mỗi `seekElement`) nên
  promise của nó không bao giờ reject → Seeker không bao giờ resolve
  `ok: false, cancelled: false` qua đường này.
- Nếu `collectActives` ném ĐỒNG BỘ trong executor của Seeker, lỗi đó
  thoát khỏi callback `setTimeout` của Seeker mà không qua `.then`
  rejection handler → entry treo vĩnh viễn (không settle). Test unit
  khóa hành vi này (race 300 ms: promise vẫn pending, lỗi bị
  `uncaughtException` bắt được) — xem §5.1, đây là hazard, không
  phải đường error.
- Unit test khóa chiều ngược lại: Seeker với run trả rejected promise
  THẬT → outcome `{ok: false, cancelled: false}` →
  `classifySeekOutcome` = `"error"`, và chuỗi error cũng cạn cap ở
  10 như timeout. Tức dây phân loại + đếm đã đúng; chỉ thiếu một
  đường production nào đó reject thật.

**Kết luận việc 1 (trung thực): chưa có bằng chứng browser cho kind
`"error"`.** Không bịa fixture, không sửa Seeker để "tạo" bằng chứng
(việc đó đổi ngữ nghĩa shared code ngoài phạm vi Y2). Nợ này vẫn mở.

## 2. Việc 2 — Thiết kế và cài phục hồi sau cạn cap

### 2.1 Cơ chế (marker `ROUND43-Y2`)

Đúng thời điểm chuyển sang cạn cap (false → true, chỉ một lần cho
mỗi lần cạn — guard `wasExhausted`), nhánh else trong `preview.tsx`
lấy lại actives ở t hiện tại qua `collectActives`, lập kế hoạch bằng
`planSeekRecovery` (dedup theo identity + đếm số đang seeking), rồi
`MediaPool.dropElement` từng element. Lần seek sau (scrub t mới,
phát, redraw) gọi `videoFor`/`audioFor` sẽ tạo element MỚI với cùng
src — trạng thái seeking kẹt và bộ giải mã hỏng (nếu có) bị bỏ cùng
element cũ. `PreviewIdleDebug` thêm 2 trường để harness đọc:
`seekElementRecreated` (số element đã drop ở lần cạn gần nhất) và
`seekRecreatedSeeking` (trong đó bao nhiêu cái đang seeking). Cả hai
reset cùng mọi chỗ reset cap X2 (justPaused, redrawFlag, request-seek
t mới, nhánh vẽ thành công).

### 2.2 Vì sao drop TOÀN BỘ actives, không chỉ element đang seeking

- Kết quả seek là tổng hợp (`seekAll` chỉ trả done/timedOut/failed,
  không cho biết element nào hỏng) nên không quy lỗi cho một element
  cụ thể khi nhiều clip cùng active ở t.
- Probe đợt này cho thấy element ở trạng thái lỗi báo `seeking =
  false` nhưng vẫn không bao giờ bắn `seeked` (readyState 0, §1.1) —
  "chỉ drop element đang seeking" sẽ bỏ sót đúng trường hợp demuxer
  đã hỏng hẳn. Sau 10 lần thất bại liên tiếp, toàn bộ actives đều
  đáng ngờ; tạo lại element chỉ tốn một lần nạp metadata từ nguồn
  local (blob/file), rẻ hơn nhiều so với kẹt vĩnh viễn.
- An toàn: chỉ chạy khi vòng lặp đã ngủ vì cạn cap (`pendingSeek =
  false`, không seek bay) nên không cắt ngang seek đang chạy; clip
  lành không bao giờ cạn cap nên không bao giờ bị drop (control §3.4).

## 3. Việc 2 — Bằng chứng headed trước–sau (fixture broken-gap)

### 3.1 Xây fixture đúng (cái mà broken-trunc không làm được)

`valid-gop.mp4`: testsrc2 640×360 3 s, x264 `-g 30` → keyframe đúng
0 / 1 / 2 s (ffprobe xác nhận). `broken-gap.mp4`: copy y hệt, chỉ
zero 30 packet có pts trong [1,0, 2,0) — đúng 104.408 byte, vị trí
101.878–206.286 (lấy bằng ffprobe JSON, sau một lần làm sai thứ tự
cột CSV đã sửa — xem §6). GOP 0 (0–1 s) và GOP 2 (2–3 s) nguyên vẹn;
ffprobe vẫn decode frame tới 2,966 s.

Probe element độc lập (trang probe2.html, element mới hoàn toàn):

| Seek | Kết quả |
|---|---|
| 1,5 (GOP hỏng) | `error` code 3 `PIPELINE_ERROR_DECODE`, `seeked` false, sau 6 s `seeking = true`, readyState 1 — KẸT SEEKING đúng nghĩa |
| 0,5 (GOP nguyên) | `seeking@0.500` → `seeked@0.500`, currentTime 0,5 |
| 0,1 (GOP nguyên) | `seeking@0.100` → `seeked@0.100`, currentTime 0,1 |
| 2,5 (GOP nguyên) | `seeked@0.000` — Chrome tự về 0, KHÔNG tới 2,5 (quirk, xem §5.3) — nên 2,5 KHÔNG dùng làm target tốt |

### 3.2 Trước sửa (dist-before): element cũ kẹt, target nguyên vẫn hỏng

Scrub tới 1,5 → cạn cap (count 10, kind `"timeout"`, ngủ,
`lastDrawn` 0,1) → scrub tới 0,5 (GOP nguyên, đã chứng minh tốt ở
probe): đếm leo lại 0 → 3 → 7 → 10 ở target 0,5, cạn lại, ngủ,
`lastDrawn` giữ 0,1 suốt 30 s quan sát. **Không phục hồi** — đúng
chữ ký element kẹt: target nguyên vẫn timeout vì element cũ còn
`seeking = true` nên `seekElement` chỉ chờ `seeked` không bao giờ tới.

### 3.3 Sau sửa (dist-after): element mới vẽ được ngay

Cùng luồng, cùng target (mirror chính xác):

| Giai đoạn | Trạng thái đo được |
|---|---|
| Settle ở 0 | `lastDrawn` 0, ngủ |
| Scrub 1,5 | 10 timeout → cạn cap, kind `"timeout"`, ngủ, **`seekElementRecreated = 1`** (drop đã chạy) |
| Scrub 0,5 | **Vẽ được sau 0,51 s**: `sleeping` true, `lastDrawn` 0,5, `lastRequested` 0,5, `seekFailureCount` 0, `holdDraw` 1 → 2 |
| Mirror với target 0,1 | **Vẽ được sau 0,57 s**: `lastDrawn` 0,1, ngủ, đếm 0, `holdDraw` 1 → 2 |

Đối chứng clip lành trên bản sau sửa (scrub 1,5 trên `valid.mp4`):
vẽ được (`lastDrawn` 1,5, ngủ), `seekFailureCount` 0,
`seekElementRecreated` 0 — recovery không chạy oan, không hồi quy
đường seek lành.

### 3.4 Những lần chạy hỏng đã dạy gì (ghi rõ để khỏi lặp lại)

- **broken-trunc 0,5/0,1 đều hỏng cả trước lẫn sau sửa** — không phải
  do cơ chế: ffprobe chứng minh `broken-trunc` chỉ còn frame tới
  ~0,233 s, và probe element cho thấy seek tới 0,1 trên element MỚI
  cũng lỗi decode + kẹt seeking. Fixture này không seek được ở bất
  kỳ t > 0 nào, nên không phân biệt được cũ/mới — phải bỏ, dùng
  broken-gap thay.
- **Lượt after-gap đầu tiên vô hiệu** (không phải do code): tab
  settle sẵn ở 0,5 do localStorage profile dùng chung (tab trước
  persist playhead 0,5), nên scrub "về 0,5" trùng đúng
  `lastDrawn` → nhánh pause không request seek mới (guard
  `t !== lastDrawn`) mà điều kiện ngủ cũng sai (`lastRequested`
  1,5 ≠ playhead 0,5) → vòng lặp tick mãi không ngủ (ticks
  502 → 1699 trong 60 s, không làm việc gì). Đây là bẫy ngủ tiền
  hữu, xem nợ §5.2 — lượt chạy lại với target 0,1 trên profile mới
  mới cho kết quả sạch (§3.3).
- **Seek tới 2,5 trên broken-gap "thành công giả"**: `seeked` bắn
  nhưng ở currentTime 0 (probe v3, đã đối chứng valid cho 2,5 đúng).
  Trong app, `seekElement` sau `seeked@0` sẽ gán lại 2,5 rồi lại
  `seeked@0` — vòng lặp không bao giờ resolve (timer bị xóa mỗi
  lần seeked tới). Đây là quirk Chrome với file này, không phải
  đường Y2; đừng dùng 2,5 làm target tốt cho broken-gap.

## 4. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (3 file):

- `apps/web/src/preview.tsx` — import `planSeekRecovery` + biến
  closure `seekElementRecreated`/`seekRecreatedSeeking` + 2 trường
  `PreviewIdleDebug` + reset ở 4 chỗ reset cap X2 + nhánh else cạn
  cap (drop actives, 1 lần) + phơi idleDebug. Tổng 9 hunk marker
  `// ROUND43-Y2`. Không đụng nhánh playing, cap W2, logic reset X2.
- `apps/web/src/media.ts` — thêm `MediaPool.dropElement(el)` (1 hunk
  marker `// ROUND43-Y2`): pause + gỡ src + `load()` + xóa khỏi map
  videos/audios (+ `videoItems`); trả false nếu element không thuộc
  pool. Không đổi `videoFor`/`audioFor`/`pauseAll`/`eachMedia`.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude
  `src/lib/pauseSeekRecovery43Y2.test.ts` (theo mẫu mọi test file).

MỚI (2 file code + LIMITS này):

- `apps/web/src/lib/pauseSeekRecovery43Y2.ts` — `planSeekRecovery`
  thuần (dedup + đếm seeking) + ghi chú thiết kế/giới hạn.
- `apps/web/src/lib/pauseSeekRecovery43Y2.test.ts` — 9 test (§5).

KHÔNG ĐỔI: mọi code sản phẩm khác, paths-loop, build-loop-log.
Scratch ở `~/workspace/tmp-round43-y2/` (dist build tạm
dist-before/dist-after, clip test, harness `harness43*.mjs`,
`diag43.mjs`, `probe*.mjs/html`, JSON kết quả `results/`) — không
vào batch. Chrome/server tạm đã tắt cuối lượt (trả cổng 8901/9223).

## 5. Kiểm chứng gộp của luồng (số thật) + nợ mở

- Unit mới `pauseSeekRecovery43Y2`: **9/9** (plan 4 + fake-pool 2 +
  mô hình vòng lặp 2 + Seeker reject → error 1 + Seeker sync-throw
  treo 1 — xem §1.3).
- Hồi quy chạy lại bằng `node --experimental-strip-types`:
  `pauseDraw41W2` **13/13**, `pauseDraw40V3` **11/11**, `holdFrame`
  **13/13**, `seek` **15/15**, `reversePlaybackRound39T6` **10/10**,
  `pauseSeekCap42X2` **22/22** — tổng với test mới: **93/93, fail 0**.
- `vite build --outDir` tạm (không đụng `apps/web/dist`): **pass**
  (43,13 s under-load), bundle chứa `seekElementRecreated` +
  `dropElement`; cảnh báo chunk > 500 kB cũ.
- `tsc --noEmit` (apps/web): **6 lỗi, tất cả thuộc file của luồng
  khác** (`src/lib/ingestMinDisplay43Y3.test.ts`, chưa được exclude
  — luồng Y3 đang làm dở, không đụng); **0 lỗi ở file Y2**
  (preview.tsx, media.ts, pauseSeekRecovery43Y2.ts đều sạch).

### Nợ mở (không mạo nhận đã xong)

1. **Kind `"error"` trên browser vẫn chưa có bằng chứng** (§1).
   Cần một đường production reject thật từ executor Seeker — hiện
   không có. Hazard kèm theo: `collectActives` ném đồng bộ thì entry
   Seeker treo vĩnh viễn thay vì đi nhánh error (đã khóa bằng unit
   test, chưa sửa — sửa Seeker là đổi ngữ nghĩa shared code, cần
   luồng riêng + đo không phá hội tụ seek thường).
2. **Bẫy ngủ tiền hữu** (phát hiện ở §3.4): playhead == lastDrawn
   nhưng lastRequested ≠ playhead (scrub về đúng t đã vẽ sau khi
   cạn cap ở t khác) → không request seek mới mà cũng không ngủ,
   vòng lặp tick mãi không làm việc gì. Đây là lỗi logic điều kiện
   ngủ/branch guard, ngoài phạm vi Y2 (Y2 chỉ thêm recovery), cần
   luồng riêng sửa + đo.
3. **Quirk Chrome seek-landing-0** (§3.4): seek tới vùng mà chunk
   chứa keyframe bị hỏng một phần thì `seeked` bắn ở currentTime 0,
   khiến `seekElement` lặp gán mãi không resolve. Chỉ quan sát trên
   broken-gap tự chế; chưa rõ có xảy ra với file thật của user
   không — cần đo riêng nếu user báo seek treo (pendingSeek mãi).
4. **Rò rỉ node AudioEngine nhỏ**: element bị drop còn
   MediaElementSource trong `nodes` Map (không có API gỡ) — node cũ
   chỉ xuất im lặng (element đã pause + gỡ src), rò rỉ giới hạn bởi
   số lần cạn cap. Chưa đáng sửa API engine vì một đường hiếm.
5. **Phục hồi chỉ giúp lần seek SAU**: seek lại đúng t đã cạn vẫn
   timeout và cạn lại (đúng — dữ liệu ở t đó hỏng thật, không phải
   lỗi phục hồi). Hành vi sau cạn cap vẫn theo đánh đổi X2 §6.4.
6. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed, DSF=1 ép bằng cờ) — cùng giới hạn như các đợt trước.

## 6. Sự cố harness (ghi rõ để luồng sau khỏi lặp lại)

1. `pkill -f` với pattern trùng command line của chính phiên exec sẽ
   tự kill phiên đó (SIGTERM) — phải kill theo pid lấy từ `ss`/pid
   file, không dùng pattern trùng lệnh.
2. Lần đầu zero GOP1 đã sai: ffprobe CSV in theo thứ tự
   pts,size,pos chứ không phải pts,pos,size như đã giả định — file
   hỏng sai chỗ, phải làm lại bằng JSON có tên trường.
3. Probe v2 cho kết quả `atSeeked = 0` giả trên cả valid lẫn
   broken-gap; probe v3 (thêm listener `seeking` + ghi target) mới
   cho đáp án đúng (valid 2,5 → 2,5; broken-gap 2,5 → 0). Nghi ngờ
   race tab/cache ở v2 nhưng chưa xác định được nguyên nhân chắc
   chắn — luồng sau nên đối chứng valid trước khi tin probe mới.
4. Profile Chrome dùng chung giữa các lượt làm nhiễm playhead
   persist (tab mới settle ở playhead của tab cũ) → lượt chạy sau
   nên dùng profile riêng mỗi thí nghiệm, và target tốt phải khác
   `lastDrawn` lúc settle (nếu không sẽ rơi vào bẫy §5.2).
5. VM/session từng abort giữa chừng làm chết cả Chrome + server tạm
   (như đợt 42) — code repo trong `~/workspace` nguyên vẹn; chỉ cần
   dựng lại server/Chrome là chạy tiếp được.
