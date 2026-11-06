# Phase 9 đợt 44, luồng Z1 — Settle-drop đường asset: + tab ẩn — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code nào (xem §1.3), KHÔNG tự stage batch push
(parent gộp). Mọi số timing đều under-load (loadavg lúc bắt đầu
headed 9,18 / 6,84 / 3,86 — các luồng đợt 44 khác đang chạy song
song) — cấm dùng làm baseline quiet hay claim fps.

Đóng nợ đợt 43 Y1 §5.2–§5.4 (`docs/PHASE9_ROUND43_Y1_SETTLE_LIMITS.md`):
(2) nhánh thử lại riêng trên đường `asset:` (Y1: 8/8 attempt chỉ bắt
được nhánh dọn-ngay), (3) tab ẩn kéo dài (Y1: chỉ 1 lần SUCCESS,
chưa đo ẩn lâu), và vỏ UI `.vcut.json` + vòng draw/toggle cho clip
`asset:` (Y1 §5.3: chưa click-test).

## 0. Kết luận ngắn (không vượt số đo)

1. **Ý tưởng mới đã làm được một nửa — và nửa còn lại đổi dạng:**
   aim SIÊU CHẶT (tắt khi cache tới setupCache + prefetchFrames − 3,
   không ngắt sớm do stall) ĐÃ đưa settle vào trong lúc W2 bay trên
   đường `asset:` — 2/2 attempt đạt aim siêu chặt có
   `deferredHere = true` (mẫu settle: winInFlight=true, counter
   chưa tăng, cache không sụt), so với 0/8 của Y1. Nhánh thử lại
   vì vậy LẦN ĐẦU TIÊN được vào trên đường `asset:` (không còn là
   "chưa bắt được nhánh thử lại" như Y1).
2. **Nhưng SUCCESS vẫn chưa bắt được trên đường `asset:`** (0/4
   attempt). Ở cả 2 attempt vào được nhánh hoãn, W2 lại trả
   `ok = true` (khác Y1: W2 `ok = false` 8/8) và tự evict trước
   khi lần thử lại chạy, nên counter cuối vẫn 0 (cache sụt
   148/150 frame nhưng không qua counter settle-drop) → phân loại
   `INVALID-final-mismatch` theo đúng tiêu chí Y1 (không nới).
   Đây là dạng suy biến "bình thường" của X1 (W2 evict trước khi
   resolve → thử lại dọn 0), nay xuất hiện trên đường `asset:` —
   câu hỏi mở đã chuyển từ "settle quá muộn" sang "vì sao W2
   `ok = true` lần này" (xem §3.1, giả thuyết + bước tiếp theo,
   KHÔNG kết luận).
3. **Probe asset: trước race PASS, loại trừ nguyên nhân
   asset-chưa-sẵn:** ingest IDB thật + rehydrate thật cho cùng
   assetId Y1 (`a_e40641880f8e75dc`): blob size == manifest size
   (69.861.131 byte), restored 1, failed 0. Mọi attempt asset: sau
   đó đều chạy trên asset đã chứng minh là sẵn — PARTIAL/INVALID
   ở đây không thể đổ cho "asset: chưa sẵn".
4. **Tab ẩn kéo dài 60 s: settle-drop VẪN DỌN ĐÚNG, qua nhánh
   dọn-ngay (2/2 attempt PARTIAL-immediate-drop, không SUCCESS).**
   Dwell 60 s được chứng minh bằng 12 poll visibility đều hidden
   (mỗi attempt). Timer 100 ms sau dwell: attempt 1 nổ sau
   290,5 ms (~2,9×), attempt 2 nổ sau 1.049,9 ms (~10,5×, gần clamp
   1000 ms) — throttle lúc ẩn dài biến thiên mạnh, không lấy 1 mẫu
   làm chuẩn. rAF không chạy lúc ẩn (2/2). Counter/cache khớp
   đúng 90 = 90 ở cả 2 attempt (settle sau W2: +980 ms / +1601 ms;
   W2 hỏng 824,2 / 925,7 ms, ok=false).
5. **Vỏ UI `.vcut.json` + vòng draw/toggle cho clip `asset:`:
   CHƯA click-test thật** (giữ nguyên trạng thái nợ mở, không
   claim). Đã kiểm tra code thật của chuỗi + khóa ở mức logic
   tương đương bằng test Node (xem §4). Phần còn thiếu vẫn là
   click mở file qua ProjectMenu trên browser thật + vòng draw
   của preview.tsx.

## 1. Thay đổi code

### 1.1 Mới

- `apps/web/src/lib/settleAsset44Z1.ts` — module thuần (không
  browser API): `classifySettleDrop` (phân biệt nhánh dọn +
  diagnostic asset-not-ready — XEM GHI CHÚ QUAN TRỌNG bên dưới),
  `ultraTightAimTarget` + `y1AimRemainingFrames` (toán aim),
  `probeAssetReadiness` (probe asset: trước race),
  `classifyTraceAttempt` (khóa tiêu chí SUCCESS / PARTIAL /
  INVALID y hệt driver Y1 ở tầng thuần).
- `apps/web/src/lib/settleAsset44Z1.test.ts` (19/19, esbuild
  --format=esm — xem §5).
- `apps/web/scripts/settle-headed-44z1.mjs` — harness headed 2 pha
  (asset-ultra + hidden-long). Biến duy nhất đổi so với Y1 ở pha
  asset là aim (siêu chặt thay chặt/lỏng) + probe trước race;
  pha hidden giữ nguyên aim Y1 để biến duy nhất là thời gian ẩn.
  KHÔNG dùng delay server cho pha asset (delayMs = 0: blob: nội
  bộ, không có request server nào để delay — đặt 800 ở đó sẽ là
  mạo nhận).
- `docs/PHASE9_ROUND44_Z1_SETTLE_LIMITS.md` (file này).

### 1.2 Sửa

- `apps/web/tsconfig.json`: chỉ thêm 1 dòng exclude cho test mới
  (tiền lệ Y1/X1).

### 1.3 Không sửa (ghi rõ) + ghi chú về "retry do asset chưa sẵn"

- KHÔNG sửa `reverseWebcodecs.ts`, `preview.tsx`,
  `reverseDecodeAheadToggle.ts`, cổng/gate, toggle registry, i18n,
  `gopCache40V2.ts`, `assetStore.ts`, `rehydrate36S5.ts`. Không có
  hunk marker `ROUND44-Z1` nào trong file dùng chung.
- GHI CHÚ QUAN TRỌNG (để không ai đọc nhầm module mới thành luật
  production): production KHÔNG có nhánh "retry do asset: chưa
  sẵn". Prefetch chỉ bắt đầu sau khi track đã load xong nên settle
  lúc asset-load bay là không thể xảy ra trên cùng controller;
  `classifySettleDrop` gắn diagnostic `asset-not-ready` chỉ để
  cổng hợp lệ của phép đo: attempt nào probe fail thì KHÔNG được
  tính là PARTIAL hay SUCCESS, và probe PASS (như ở đây) thì loại
  trừ được nguyên nhân asset-chưa-sẵn. Nhánh production duy nhất
  vẫn là: dọn-ngay (T4) / hoãn-do-decode-bay → thử lại (W1).

### 1.4 Fixture (tái dùng của Y1, không vào repo)

- `~/workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4`
  (69.861.131 byte = 66,62 MiB; GOP hỏng [30,33), IDR pos
  5378169). Scratch Z1 nằm ngoài repo
  (`~/workspace/tmp-round44-z1/`: bundle, entry, trace JSON, log
  chrome, log headed) — KHÔNG vào batch.

## 2. Phương pháp harness (đọc trước khi trích số)

Harness Z1 = harness Y1 đổi đúng 3 chỗ (còn lại giữ nguyên, kể cả
tiêu chí phân loại SUCCESS/PARTIAL/INVALID và chuỗi race setup →
cổng → prefetch → aim → tắt + W2 hỏng 32,7 s → trace ~5 ms):

1. **Aim siêu chặt (pha asset):** target = setupCache +
   prefetchFrames − 3 (tối đa 3 frame còn lại, thay vì −20 của Y1
   chặt và ~50% của Y1 lỏng); BỎ stall-break (Y1 ngắt ở stall
   25 ms — decoder output theo burst nên đứng yên 25 ms không có
   nghĩa là sắp settle); timeout aim 15 s (thay 8 s). Harness ghi
   thêm `preToggle` (cache thật lúc tắt so với target) để chứng
   minh aim có siêu chặt thật không, không chỉ target lý thuyết.
2. **Probe asset: trước race (pha asset):** assetSetup (ingest
   IDB thật + rehydrate thật) xong mới kiểm tra: blob size ==
   manifest size, restored == 1, failed == 0 — PASS mới chạy
   attempt; FAIL thì pha dừng ở INVALID-asset-not-ready (không
   xảy ra ở đây).
3. **Tab ẩn kéo dài (pha hidden, đường GOP):** sau khi ẩn và xác
   nhận hidden, dwell 60.000 ms với poll visibility mỗi 5 s (phải
   luôn hidden, nếu không attempt INVALID-unhidden-during-dwell);
   timer probe 100 ms khởi động SAU dwell (Y1 khởi động ngay lúc
   mới ẩn); aim giữ nguyên Y1 (target −20 + stall-25ms) để biến
   duy nhất là thời gian ẩn; W2 giữ delay server 800 ms cho range
   GOP hỏng như Y1 (đường GOP qua server thật nên delay này hợp
   lệ, khác pha asset).

Giới hạn của harness (không giấu): như Y1 — không lái UI app đầy
đủ (không click toggle/badge preview.tsx, không click mở
`.vcut.json` qua ProjectMenu), không qua bridge Express thật,
badge DOM không được đọc (chỉ mirror status mà badge đọc).

## 3. Số đo thật từng mục

### 3.1 (A) Đường `asset:` với aim siêu chặt — nhánh hoãn VÀO ĐƯỢC, SUCCESS CHƯA (0/4)

Probe trước race: **PASS** — assetId `a_e40641880f8e75dc` (cùng
id Y1), blobUrl `blob:...`, size = manifestSize = 69.861.131,
restored = [`asset:a_e40641880f8e75dc`], failed = [], skipped = [].
Mọi attempt: controller blob: `gopMode = full-file-fallback`,
fallback = `gate: accept-ranges-unknown: server không gửi
Accept-Ranges, không giả định` (khớp Y1 §3.2); cổng
`allowed-experiment` / `easy-decode-footage`, fps cổng 114,7 /
179,5 / 131,0 / 178,3 (under-load, không phải baseline).

| Attempt | Aim | preToggle cache vs target | W2 | Settle | Cuối | Phân loại |
|---|---|---|---|---|---|---|
| 1 | settled-during-aim (target 224, prefetchFrames 136) | — (settle trước khi tắt) | — | — | — | INVALID-settled-before-toggle |
| 2 | cache-ultra-tight (target 195, prefetchFrames 107) | 204 ≥ 195 | 507,6 ms, ok=true, failed=false | +312 ms: winInFlight=true, settled 0→0, cache 263→269, deferredHere=true | +517 ms: settled=0 (delta=0), cache 121 (sụt 148), ui=off, prefetch=0 | INVALID-final-mismatch |
| 3 | settled-during-aim (target 224, prefetchFrames 136) | — | — | — | — | INVALID-settled-before-toggle |
| 4 | cache-ultra-tight (target 195, prefetchFrames 107) | 205 ≥ 195 | 410,0 ms, ok=true, failed=false | +283 ms: winInFlight=true, settled 0→0, cache 268→271, deferredHere=true | +411 ms: settled=0 (delta=0), cache 121 (sụt 150), ui=off, prefetch=0 | INVALID-final-mismatch |

Đọc đúng:

- **Tiến bộ thật so với Y1:** 2/2 attempt đạt aim siêu chặt đều
  có settle rơi TRONG lúc W2 bay (deferredHere=true) — nhánh
  thử lại đã được vào trên đường `asset:`. Y1 là 0/8 (cả chặt
  lẫn lỏng đều settle sau W2). Aim siêu chặt là biến duy nhất
  đổi, nên tiến bộ này quy được về aim.
- **Vì sao vẫn chưa SUCCESS:** lần thử lại chạy sau khi W2 kết
  thúc nhưng tìm thấy 0 frame để dọn (counter giữ 0), trong khi
  cache vẫn sụt 148/150 frame — tức W2 (ok=true) đã tự evict
  trước khi lần thử lại chạy. Đây đúng là dạng "bình thường" của
  X1 (W2 evict trước khi resolve → thử lại dọn 0), không phải lỗi
  của lần thử lại. Tiêu chí SUCCESS đòi counter tăng ≥ 1 nên 2
  attempt này là INVALID-final-mismatch, KHÔNG được tính là
  SUCCESS hay PARTIAL.
- **Vì sao W2 `ok = true` lần này (CHƯA GIẢI THÍCH ĐƯỢC — ghi rõ,
  không đoán thành kết luận):** Y1 đường asset: W2 `ok = false`
  8/8 (232–304 ms); Z1: 2/2 attempt ultra-tight cho W2 `ok = true`
  (410/507,6 ms — thời gian decode thật, không phải fast-path
  ~0 ms). Giả thuyết mạnh nhất (CHƯA KIỂM CHỨNG, cần luồng sau
  đo): cửa sổ present của W2 không nằm trọn trong GOP hỏng như
  Y1 giả định (75 frame [30,2..32,7]) mà rộng hơn và vắt qua GOP
  lành trước đó, nên decode được một phần (> 0 frame) rồi trả
  true theo luật "decode một phần thì giữ" của nhánh full-file
  (xem `reverseWebcodecs.ts` ~line 1475–1493: decoded > 0 thì đi
  tiếp tới evict + return true; decoded <= 0 mới return false). Bằng chứng gợi ý (không phải
  chứng minh): `drawn-after-W2` = 121 frame ở MỌI attempt (cả
  asset lẫn hidden, cả W2 ok=true lẫn ok=false) nên con số 121
  này không phải cửa sổ W2 — không dùng nó để suy cửa sổ W2.
  Bước tiếp theo cho luồng sau (không làm ở đây để giữ biến duy
  nhất là aim): mirror thêm decodeFrom/decodeTo/key/decoded của
  W2 vào status để phân biệt "W2 decode một phần qua GOP lành"
  với "W2 fast-path trả true".
- **Lỗi nhỏ của harness Z1 (ghi để luồng sau sửa):** vòng aim
  kiểm tra `inFlight < 1` TRƯỚC `cache >= target` trong cùng một
  mẫu, nên mẫu mà prefetch settle đúng lúc cache vừa chạm target
  sẽ bị ghi `settled-during-aim` thay vì ultra-tight (attempt 1,
  3 có thể đã chạm target đúng lúc settle — không phân biệt
  được từ log hiện tại). Ngoài ra target dùng prefetchFrames
  (= số frame aheadRange) nhưng số frame decode thật thường ít
  hơn (attempt 1, 3: target 224 không tới được trước khi settle;
  attempt 2, 4: prefetchFrames chỉ 107 nên target 195 tới được —
  aheadRange thay đổi theo effectiveWindow/budget từng attempt).
  Hai điểm này không làm sai kết luận (attempt 2, 4 đã chứng
  minh deferredHere=true), nhưng luồng sau nên đảo thứ tự kiểm
  tra và/hoặc aim theo "số frame còn lại ước tính từ tốc độ
  decode" thay vì target tuyệt đối.

### 3.2 (B) Tab ẩn kéo dài 60 s — dọn ĐÚNG qua dọn-ngay, 2/2 PARTIAL (không SUCCESS)

Đường GOP Range (gopMode = gop-range, probe head size
69.861.131), cổng `allowed-experiment` / `easy-decode-footage`
(fps 176,6 / 101,7 under-load). Mỗi attempt: ẩn → dwell 60.000 ms
(12 poll, đều hidden) → prefetch → aim Y1 → tắt + W2 hỏng có
delay server 800 ms → đọc timer/rAF TRONG LÚC CÒN ẨN → hiện lại.

| Attempt | W2 | Settle | Cuối | Timer 100 ms sau dwell | rAF lúc ẩn |
|---|---|---|---|---|---|
| 1 | 824,2 ms, ok=false, failed=true | +980 ms: winInFlight=false, settled 0→90, cache 211→121 | settled=90, cache=121, ui=off, prefetch=0 | 290,5 ms (~2,9×) | không chạy |
| 2 | 925,7 ms, ok=false, failed=true | +1601 ms: winInFlight=false, settled 0→90, cache 211→121 | settled=90, cache=121, ui=off, prefetch=0 | 1.049,9 ms (~10,5×) | không chạy |

Đọc đúng:

- **Settle-drop sau 60 s ẩn vẫn dọn đúng tuyệt đối:** counter
  0→90, cache 211→121 (sụt đúng 90), ui off, prefetch 0 — cả 2
  attempt, qua nhánh dọn-ngay (settle sau W2). Không có lệch
  counter nào sau thời gian ẩn dài.
- **Vì sao không SUCCESS ở pha hidden:** aim Y1 (stall-25ms)
  ngắt sớm trong lúc ẩn — preToggle cache chỉ 122/121 so với
  target 207 (còn ~85 frame theo công thức target − cache),
  tức prefetch gần như không tiến triển trong lúc ẩn cho tới khi
  W2 chạy xong (settle +980/+1601 ms, sau W2 824/926 ms). Giả
  thuyết (chưa đo tách riêng): decode prefetch bị chững trong
  lúc tab ẩn (khác Y1: prefetch vẫn tiến triển trong lúc ẩn ở
  lần đo ngắn — có thể do tải máy lúc này cao hơn, hoặc do
  dwell 60 s làm Chrome throttle sâu hơn). Luồng sau nên thử
  aim siêu chặt cho pha hidden-long thay vì aim Y1, và/hoặc đo
  tốc độ tiến triển của prefetch trong lúc ẩn theo thời gian.
- **Timer throttle lúc ẩn dài biến thiên mạnh:** 290,5 ms vs
  1.049,9 ms cho cùng timer 100 ms sau dwell — không lấy mẫu nào
  làm chuẩn, và không claim clamp 1000 ms (mẫu 2 gần clamp nhưng
  chỉ là 1 mẫu). rAF không chạy lúc ẩn: 2/2, khớp Y1.
- **Chưa đo:** ẩn lâu hơn 60 s (vd 5 phút — ngưỡng Chrome
  throttle timer về 1/phút), ẩn trong lúc prefetch đang ở giai
  đoạn đầu (pha này ẩn trước prefetch như Y1), Safari/máy thật.

## 4. Vỏ UI `.vcut.json` + vòng draw/toggle cho clip `asset:` — kiểm tra code, CHƯA click-test thật

Chuỗi code thật đã đọc (không sửa):

1. **Mở file:** `ProjectMenu.tsx` nút "Mở file dự án
   (.vcut.json)" → `doOpen` → input file → `onFile` →
   `loadProject(f)` → `replaceProject(spec)` →
   `rehydrateMediaItems` với AssetStore IDB thật (đường mở file,
   đợt 37 T3 — cùng thứ tự với đường autosave ở `App.tsx`) →
   `restoreMediaBin(rehydrated.items)` nếu có item.
2. **Item sau rehydrate** (`rehydrate36S5.ts`): `url =
   makeObjectURL(blob)` (blob: URL), `file = new File([blob],
   originalName, ...)` nên `file.size` == size manifest == size
   blob (đã chứng minh ở probe §3.1: 69.861.131 == 69.861.131).
3. **Vòng draw/toggle** (`preview.tsx` ~1232–1246, nhánh stepping
   + engine webcodecs): `reverseWebcodecsFrameFor(item.proxyUrl
   ?? item.url, rampSourceTimeAt(clip, t),
   knownSizeBytesForPreview(item), { gopRangeEnabled: true })` —
   đúng 3 tham số mà harness Z1 mirror cho controller blob:
   (`proxyUrl ?? url`, `knownSizeBytes` = `file.size` khi không
   có proxy theo `proxy.ts`, `gopRangeEnabled: true`). Toggle
   click (`onDecodeAheadToggleClick` ~2198) đảo cờ qua
   `setReverseDecodeAheadWanted` (cùng registry mà harness dùng),
   tắt → dừng prefetch mới + dọn khi settle (T4).
4. **Khóa ở mức logic tương đương (test Node, KHÔNG phải
   click-test):** `settleAsset44Z1.test.ts` §5 — planRehydrate
   thật cho `asset:<id>` khớp manifest theo id, wiring GOP
   scheme-blind cho size 66,62 MiB (BẬT ở tầng wiring — gate
   blob: ở tầng fetch Accept-Ranges mới loại về
   full-file-fallback, khớp quan sát headed), `previewUrlFor` /
   `knownSizeBytesForPreview` thật cho item rehydrate (blob: URL
   + size 69.861.131). Test này chứng minh wiring tham số đúng,
   KHÔNG chứng minh click mở file / vòng draw thật chạy — hai
   việc đó vẫn là nợ mở, cần browser thật lái app đầy đủ (vượt
   harness lib-only của luồng này).

## 5. Kiểm chứng + sự cố đã gặp

- Mới `settleAsset44Z1.test.ts`: **19/19 pass** (esbuild bundle
  --format=esm ra scratch, chạy bằng node — đúng chỉ dẫn luồng:
  không chạy node --test trực tiếp).
- Hồi quy (cùng runner esbuild): Y1 **14/14**, X1 **7/7**, W1
  **6/6** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: lần 1 có 3 lỗi ở file
  của luồng đợt 44 khác (`gopMoovHeader44Z4.test.ts`, TS5097 —
  không phải file Z1, không sửa thay); lần 2 (sau khi luồng đó
  sửa xong): **0 lỗi, exit 0**. Không có lỗi nào ở file Z1.
- `vite build` tại chỗ: **pass (21,81 s)**, chỉ cảnh báo chunk
  > 500 kB cũ. `dist/` không vào batch theo tiền lệ.
- Click-test headed mới: **2/4 pass** (T0 + probe A0; pha A FAIL
  theo tiêu chí SUCCESS nghiêm ngặt vì chỉ vào được nhánh hoãn
  mà counter không tăng; pha B FAIL theo tiêu chí SUCCESS vì chỉ
  bắt được nhánh dọn-ngay — xem §3; không giấu thành PASS).
- Sự cố harness: lần đầu bundle test bằng đường dẫn
  `--outfile=~/...` đã tạo nhầm thư mục literal `~` trong repo
  (esbuild không expand `~` sau `=`); đã xóa ngay và chạy lại
  bằng đường dẫn tuyệt đối — repo không còn thư mục lạ (đã
  kiểm tra). Bài học: luôn dùng đường dẫn tuyệt đối cho
  --outfile.

## 6. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Nhánh thử lại trên `asset:` cho counter tăng vẫn chưa bắt
   được** (2/2 ultra-tight vào được nhánh hoãn nhưng counter giữ
   0 vì W2 ok=true tự evict trước). Cần luồng sau mirror thêm
   decodeFrom/decodeTo/key/decoded của W2 để phân biệt "W2 decode
   một phần qua GOP lành" với "W2 fast-path", rồi chọn cửa sổ W2
   nằm trọn trong GOP hỏng (vd cửa sổ present nhỏ hơn hoặc GOP
   hỏng ở vị trí khác) để W2 về lại đường suy biến ok=false.
2. **Tab ẩn kéo dài:** chỉ đo dwell 60 s (2 attempt, đều
   PARTIAL-immediate-drop); chưa đo dwell ≥ 5 phút, chưa thử aim
   siêu chặt cho pha hidden, chưa đo Safari/máy thật, chưa đo ẩn
   giữa chừng prefetch (pha này ẩn trước prefetch).
3. **Vỏ UI `.vcut.json`:** chưa click-test thật (chỉ kiểm tra
   code + test logic tương đương, §4).
4. **Chỉ chứng minh trên một đường đo:** fixture 360p GOP 90
   (không 720p/1080p); Chromium headed thật dưới Xvfb (màn hình
   ảo); máy under-load nặng (loadavg đầu 9,18 — các luồng đợt 44
   khác chạy song song); số fps cổng chỉ là số đo cửa sổ mở
   cổng, KHÔNG phải fps hiển thị ngược, KHÔNG phải baseline
   quiet. Số đo timer throttle lúc ẩn dài chỉ có 2 mẫu, biến
   thiên 290,5 → 1.049,9 ms — không lấy làm chuẩn.
5. **Dị thường Y1 §4.3 (W2 ok=true) nay tái hiện có hệ thống**
   trên đường asset: ultra-tight (2/2) thay vì lẻ tẻ như Y1 lượt
   3 — giả thuyết "cửa sổ present vắt qua GOP lành" ở §3.1 vẫn
   CHƯA KIỂM CHỨNG, không được trích làm kết luận.
6. **Không claim gì thêm:** không đổi ngưỡng cổng (60 fps),
   không đổi luật T2/T4, không đổi ngưỡng GOP 32/128 MiB, không
   đổi mặc định TẮT của GOP, không sửa production code, không
   nới tiêu chí SUCCESS (mọi FAIL trên đều theo đúng tiêu chí
   Y1).

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settleAsset44Z1.ts` (module thuần:
  classify + aim + probe + phân loại trace).
- Mới: `apps/web/src/lib/settleAsset44Z1.test.ts` (19/19).
- Mới: `apps/web/scripts/settle-headed-44z1.mjs` (headed 2/4;
  asset PARTIAL-tiến-bộ + hidden PARTIAL — xem §3).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới).
- Mới: `docs/PHASE9_ROUND44_Z1_SETTLE_LIMITS.md` (file này).
- Không sửa: `reverseWebcodecs.ts`, `preview.tsx`,
  `reverseDecodeAheadToggle.ts`, cổng/gate, toggle registry, i18n,
  `apps/web/dist/` (không vào batch), paths-loop, build-loop-log.
  Scratch đo nằm ngoài repo (`~/workspace/tmp-round44-z1/`) —
  KHÔNG vào batch.
