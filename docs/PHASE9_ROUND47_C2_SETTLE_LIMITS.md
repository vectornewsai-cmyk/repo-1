# Phase 9 đợt 47, luồng C2 — Settle-drop đường `asset:`: aim chặt hơn + W2 chậm hơn — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code nào, KHÔNG tự stage batch push (parent gộp).
Mọi số timing đều under-load (các luồng đợt 47 khác chạy song song) —
cấm dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (không vượt số đo)

1. **SUCCESS đường `asset:`: VẪN MỞ — 0/9 attempt ultra-tight của
   C2** (3 attempt lượt trước + 6 attempt lượt chạy lại đầy đủ),
   cộng với 0/2 của B1 thành **11/11 PARTIAL-immediate-drop, gap
   settle−W2end luôn dương (36–901 ms)**. Tiêu chí SUCCESS của Y1
   giữ nguyên, không nới.
2. **Aim KHÔNG còn là chỗ nghẽn — đã chứng minh bằng số đo.**
   Aim C2 (gốc sống + khung prefetch đang chạy, khóa test 24/24)
   bắn đúng mốc trong cả 9 attempt: `remainingAtToggle` 0, 1, 2
   (đều ≤ slack 3), trong đó **4 attempt tắt với remaining = 0
   (prefetch đã đủ frame mới) mà settle vẫn trượt sau W2
   208–901 ms**. Siết aim thêm (slack 1) không cứu được — sóng 2
   đã KHÔNG chạy đúng theo luật đăng ký trước, vì điều kiện kích
   hoạt (mọi remaining > slack) không thỏa.
3. **Lever "W2 chậm hơn bằng mốc muộn hơn trong GOP hỏng": BỊ BÁC
   bằng số đo D1.** Probe sạch n = 4/mốc (2 lượt chạy): mốc
   32,4667 s (targetPos 974) durMs [2278, 3901, 3096, 2128], trung
   bình 2850 ms; mốc muộn nhất còn trọn GOP hỏng 32,9667 s
   (targetPos 989) durMs [2794, 2778, 1425, 1389], trung bình
   2096 ms — khoảng chồng nhau hoàn toàn, mốc muộn thậm chí nhanh
   hơn. W2 không dài ra theo vị trí mốc; thời gian W2 do tải chi
   phối (B1 đo 160–180 ms ở loadavg 0,10; C2 đo 1106–3901 ms ở
   loadavg 9,8–23,2).
4. **Cái trễ không phải frame decode mà là đuôi resolve của
   `decodeGop` prefetch.** Tốc độ decode sau toggle (đã sửa cách
   đo, xem §5) chỉ 0–1,3 frame/s: cache lúc toggle đã 209–211/211,
   gần như không còn frame mới nào để decode. Settle (inFlight
   1→0) chỉ xảy ra khi `decodeGop` của prefetch khỏe mạnh chạy
   hết vòng feed 136 chunk + flush + xả output; trong khi W2 hỏng
   được short-circuit: callback `error` của decoder resolve `done`
   ngay không chờ flush (đọc code `reverseWebcodecs.ts`
   `decodeGop`, §4). Đây là lời giải thích có cơ sở code + khớp
   số đo, KHÔNG phải đo trực tiếp từng chunk (chưa có timestamp
   feed/flush) — ghi rõ để đợt sau không đọc thành kết luận đo.
5. **`decoded` trực tiếp của W2: VẪN KHÔNG CÓ.** W2 luôn
   `ok=false` nên `decoded` chỉ suy ra 0 theo luật production
   (`classifyFailedW2`, như B1). Muốn số trực tiếp thì production
   phải thêm getter — thay đổi production cần lý do riêng, không
   làm ở C2. `decodeFrom=900` vẫn là suy luận (stss + fail + luật
   GOP-align), không đọc trực tiếp được.

## 1. Trạng thái tiếp nối sau daemon restart + quyết định đổi biến đo

Lượt chạy trước của luồng này bị daemon restart giết giữa chừng,
không có báo cáo cuối. Kiểm tra đĩa trước khi làm tiếp:

- Đã có đầy đủ trên đĩa và KHÔNG viết lại: `apps/web/src/lib/settle47C2.ts`
  (module số học aim + phân loại gap + kiểm tra mốc W2),
  `apps/web/src/lib/settle47C2.test.ts` (test khóa số học),
  `apps/web/scripts/settle-headed-47c2.mjs` (harness headed đầy đủ).
- Bằng chứng lượt trước còn lại: `~/workspace/tmp-round47-c2/c2-headed.log`
  (D1 probe xong + 3/6 attempt race, dừng đột ngột giữa attempt 4),
  các bundle test `.test.mjs`, `run-tests.mjs`. KHÔNG có
  `c2-result.json` (chỉ ghi cuối lượt) — đó là lý do lượt này thêm
  ghi kết quả từng phần (xem §5).
- Việc tôi làm trong lượt tiếp nối này: (a) chạy lại toàn bộ test
  (C2 + hồi quy A1/Z1/B1/Y1) và `tsc`; (b) đọc production code
  (`reverseWebcodecs.ts` `decodeGop`/`ensureWindowForTime`,
  `reverseDecodeAhead.ts` `prefetchWindow`) để giải thích cơ chế
  trượt; (c) sửa 2 điểm nhỏ của harness (chỉ file harness, không
  production — xem §5); (d) chạy lại harness headed ĐẦY ĐỦ từ đầu
  (D1 + 6 attempt, log `c2-headed-run2.log`); (e) viết LIMITS này.

Quyết định đổi biến đo (đã ghi trong header harness, thực hiện đúng):

1. **AIM CHẶT HƠN VỚI BASELINE ĐÚNG — biến chính của C2.**
   Aim B1 sai 2 chỗ (chứng minh bằng sổ tay từ chính log rerun
   của B1): gốc dùng `setup.cacheSize = 91` trong khi cửa sổ setup
   đã bị evict (gốc sống lúc aim là cửa sổ 412 = 121 frame, lệch
   30); khung dùng `prefetchFrames` của prefetch setup (107)
   trong khi prefetch đang chạy là của cửa sổ 412 (136 frame, 90
   frame mới, lệch 29). Mốc đúng cho slack 3 là cache 208
   (121 + 90 − 3); B1 tắt ở 201–203. C2 tính "còn lại" trực tiếp
   từ `lastDecodeRange` + `aheadRange` hiện tại
   (`remainingNewFrames`, khóa test 24/24), chờ tới khi chỉ còn
   đúng prefetch đó bay mới aim, slack giữ nguyên 3 ở sóng 1
   (chỉ sửa gốc + khung, không đổi 2 biến cùng lúc).
2. **W2 CHẬM HƠN — CHỈ ĐO CHẨN ĐOÁN (pha D1), không áp dụng vào
   race.** Đo durMs W2 ở mốc 32,4667 s vs mốc muộn nhất còn trọn
   GOP hỏng 32,9667 s trên controller sạch, wanted tắt. Kết quả:
   lever này bị bác (xem §0.3 + §3.1) — không có gì để áp dụng.
3. **Timing một đồng hồ:** toggle + khởi động W2 gộp trong 1 eval
   (`toggleAndW2`), trace lấy mẫu bằng `performance.now()` trong
   page nên gap settle−W2 không còn sai số vòng CDP (~2 ms) như B1.

## 2. Thay đổi code (chỉ file hậu tố 47C2 + LIMITS này)

- Mới: `apps/web/src/lib/settle47C2.ts` — module thuần, KHÔNG được
  import bởi production code (đã có từ lượt trước, đã kiểm chứng
  lại, không sửa):
  - `rangeLength` / `overlapFrames` / `prefetchNewFrames`: số
    frame MỚI của prefetch = độ dài aheadRange trừ phần chồng với
    cửa sổ hiện tại (fixture: cả hai prefetch đều 90 frame mới).
  - `aimTargetCache`: mốc cache để tắt = windowSize + newFrames
    − slack, chặn dưới ở windowSize (121 + 90 − 3 = 208).
  - `remainingNewFrames`: frame mới còn lại = (windowSize +
    newFrames) − cacheNow, chặn dưới 0.
  - `operativePrefetchKey`: khóa `"from:to"` của prefetch trong
    Set inFlight của production.
  - `classifySettleGap`: phân loại thời điểm settle so với cửa sổ
    W2 (before-w2 / during-w2 / after-w2) kèm delta ms.
  - `w2WindowInsideCorrupt`: kiểm tra mốc W2 có giữ cửa sổ decode
    nằm trọn GOP hỏng không (dùng mirror A1); mốc 32,9667 s là
    mốc muộn nhất còn trong GOP hỏng [900,990).
- Mới: `apps/web/src/lib/settle47C2.test.ts` (**24/24 pass**, §5).
- Mới: `apps/web/scripts/settle-headed-47c2.mjs` — harness headed
  (đã có từ lượt trước; lượt này sửa 2 điểm nhỏ, xem §5):
  pha D1 (probe W2 2 mốc), pha C race asset (tối đa 6 attempt,
  dừng khi đủ 2 SUCCESS), sóng 2 slack=1 chỉ chạy khi sóng 1
  chứng minh overshoot là nghẽn. Entry phơi `lastWindowKey` /
  `lastDecodeRange` / `aheadRange` / khóa inFlight thật qua bracket
  access (chỉ harness đọc, như B1). Harness tự tạo thư mục scratch.
- Mới: `docs/PHASE9_ROUND47_C2_SETTLE_LIMITS.md` (file này).
- KHÔNG sửa: mọi production code (`reverseWebcodecs.ts`,
  `reverseDecodeAhead.ts`, `store.ts`, `preview.tsx`, bridge),
  tsconfig.json, mọi file luồng khác.

## 3. Số đo headed thật

Fixture chung: `y1-corrupt-gop30-360p-gop90-420s.mp4` (69.861.131
byte = 66,62 MiB; GOP hỏng [30,33), IDR pos 5378169; fps 30,
12600 sample). Probe asset PASS ở cả 2 lượt chạy (assetId
`a_e40641880f8e75dc`, blob size == manifest size == 69.861.131,
restored 1, failed 0, `gopMode = full-file-fallback`).

### 3.1 Pha D1 — probe W2 chậm hơn (gộp 2 lượt chạy, n = 4/mốc)

Controller sạch, wanted tắt, không prefetch, `w2probe` đo trực
tiếp bằng `performance.now()` trong page. Tất cả `ok=false`,
`failed=true`.

| Mốc | durMs từng lần (ms) | Trung bình |
|---|---|---|
| 32,4667 s (targetPos 974) | 2278,2; 3901,4; 3095,9; 2128,1 | 2849,9 |
| 32,9667 s (targetPos 989) | 2794,0; 2777,9; 1424,8; 1389,1 | 2096,5 |

Đọc đúng: hai khoảng [2128, 3901] và [1389, 2794] chồng nhau
hoàn toàn; mốc muộn không dài ra mà trung bình còn ngắn hơn
(~750 ms). **Lever "W2 chậm hơn bằng mốc muộn hơn" bị bác.**
Cả hai mốc đều chậm hơn hẳn B1 (160–180 ms ở loadavg 0,10) vì
tải: lượt 1 bắt đầu loadavg 9,79; lượt 2 bắt đầu loadavg 15,49
(các luồng đợt 47 khác: TTS drive.py ~66% CPU, harness C3/C6).
Thời gian W2 do tải chi phối, không do vị trí mốc — đặt delay
giả tạo trên đường blob local để kéo dài W2 sẽ là mạo nhận như
B1 đã ghi, không làm.

### 3.2 Pha C — race asset với aim C2 (lượt chạy lại đầy đủ, 6 attempt)

Ports 9486/9038, DISPLAY :96, loadavg đầu 15,49 → cuối 1,87.
Cổng 412 PASS ở cả 6 attempt (lastWindowKey 12240-12360 sau khi
chờ, khác key setup 12420-12510). Cổng prefetch C2 đều
`only-operative` (chỉ đúng prefetch `12150:12285` bay).
Aim đều `remaining-tight`, slack 3, mốc cache đúng 208.

| Attempt | W2 thật (durMs, ok) | remaining lúc tắt | Gap settle−W2end | Phân loại settle |
|---|---|---|---|---|
| 1 | 1875,6 ms, false | 0 | +515,3 ms | PARTIAL-immediate-drop |
| 2 | 3307,0 ms, false | 2 | +403,9 ms | PARTIAL-immediate-drop |
| 3 | 1106,0 ms, false | 0 | +408,7 ms | PARTIAL-immediate-drop |
| 4 | 2903,7 ms, false | 0 | +208,1 ms | PARTIAL-immediate-drop |
| 5 | 2790,6 ms, false | 0 | +900,5 ms | PARTIAL-immediate-drop |
| 6 | 3009,2 ms, false | 2 | +381,2 ms | PARTIAL-immediate-drop |

Mọi attempt đều: W2 `ok=false`, `failed=true`, `decoded` suy ra
0 (`classifyFailedW2`, diagnostic fail); range sau W2 giữ nguyên
[12240,12360] là range CŨ, không dùng làm cửa sổ W2 (bẫy range cũ
của B1); `drawn-after-W2` count 121 [12240,12360] là cửa sổ 412
còn sót sau fail + settle-drop, KHÔNG phải output của W2;
settle 0→90, cache 211→121 (sụt đúng 90), ui off, prefetch 0 —
đúng dạng PARTIAL-immediate-drop của B1, chỉ trễ hơn. Tốc độ
decode sau toggle (đã sửa, §5): 0,4 / 0,6 / 1,3 / 0 / 0,6 /
0,6 frame/s — cache lúc toggle đã 209–211/211, gần như không còn
frame mới nào để decode trong lúc W2 bay.
Sóng 2: KHÔNG CHẠY — quyết định ghi trong log:
`ultra-tight attempts=6 overshootBinding=false
(remainingAtToggle: 0, 2, 0, 0, 0, 2)`. Đúng luật đăng ký trước.

### 3.3 Lượt trước (khôi phục từ đĩa, 3 attempt — dùng làm bằng chứng phụ)

Ports 9386/8938, DISPLAY :97, loadavg đầu 9,79. D1 lượt này:
974 tb 3089,8 ms; 989 tb 2786,0 ms (đã gộp vào §3.1).

| Attempt | W2 thật | remaining lúc tắt | Gap | Phân loại |
|---|---|---|---|---|
| 1 | 2600,3 ms, false | 0 | +387,4 ms | PARTIAL-immediate-drop |
| 2 | 2180,6 ms, false | 1 | +99,4 ms | PARTIAL-immediate-drop |
| 3 | 1605,0 ms, false | 2 | +109,1 ms | PARTIAL-immediate-drop |

Aim C2 đã bắn đúng ngay từ lượt này (remaining ≤ slack, cache
tắt 208–210, mốc đúng 208). Số `postToggleRate` âm (−30..−51
frame/s) ở lượt này là SAI do công thức cũ dùng cache sau drop —
đã sửa ở lượt chạy lại, cấm trích (xem §5).

### 3.4 Đọc gộp

- **9/9 attempt ultra-tight của C2 đều PARTIAL, gap luôn dương:**
  99–901 ms (trung bình lượt chạy lại 469,6 ms). Cộng 2 attempt
  của B1 (gap 35,7 / 43,5 ms ở tải thấp): **11/11 PARTIAL**.
- Gap không tương quan với độ dài W2: W2 ngắn nhất (1106 ms)
  gap 408,7 ms; W2 dài nhất (3307 ms) gap 403,9 ms; gap nhỏ nhất
  (208,1 ms) đi với W2 2903,7 ms. Gap cũng không tương quan với
  remaining lúc tắt: remaining = 0 vẫn trượt 208–901 ms.
- **Kết luận khóa được:** aim đã đúng mốc (cache tắt 208–211,
  remaining ≤ 3, 4 lần bằng 0) mà settle vẫn sau W2 — chỗ nghẽn
  không còn là aim. Siết aim thêm (slack 0/1) không có cơ sở số
  đo; sóng 2 đã không chạy là đúng.

## 4. Vì sao settle trượt sau W2 — giải thích có cơ sở code

Đọc `reverseWebcodecs.ts` `decodeGop` (dòng ~309–440) và
`reverseDecodeAhead.ts` `prefetchWindow`:

1. **W2 được short-circuit khi gặp GOP hỏng.** `decodeGop` tạo
   `VideoDecoder` mới cho mỗi lần gọi; callback `error` resolve
   promise `done` NGAY (`decoderError = ...; resolve()`) mà
   không chờ flush hay vòng feed còn lại. W2 trên cửa sổ
   [900,974] chạm IDR bị zero → decoder lỗi → `ensureWindowForTime`
   trả false sớm. Thời gian W2 đo được (1,1–3,9 s under-load)
   chủ yếu là `load()` fetch lại blob 69 MB + demux + dựng decoder
   + decode tới lỗi đầu tiên, không phải decode trọn 75 frame.
2. **Prefetch khỏe mạnh phải chạy tới cùng.** `prefetchWindow`
   gọi cùng `decodeGop` trên cửa sổ [12150,12285] (136 chunk,
   decoder riêng, không serialize với decoder của W2 — hai
   decoder độc lập, chỉ tranh CPU/main thread). Promise của nó
   chỉ resolve khi vòng feed chạy hết 136 chunk + `flush()` +
   xả hết output. "Settle" mà harness đếm (inFlight 1→0) chính
   là lúc promise này resolve — không phải lúc frame mới cuối
   cùng vào cache.
3. **Khớp số đo:** cache lúc toggle đã 209–211/211 và tốc độ
   decode sau toggle ≈ 0 frame/s — frame mới đã đủ từ trước;
   cái còn thiếu là đuôi feed+flush của `decodeGop` prefetch.
   W2 short-circuit xong trước, prefetch resolve sau 208–901 ms.
   Ở tải thấp (B1) cùng thứ tự này cho gap chỉ 36–43 ms; tải
   cao kéo cả hai ra nhưng thứ tự không đổi — 11/11 lần.
4. **Giới hạn của giải thích:** chưa có timestamp feed/flush
   từng chunk nên không tách được phần trễ nào là feed, phần nào
   là flush, phần nào là output drain. Đây là diễn giải tốt nhất
   từ code + timing, không phải đo trực tiếp cơ chế. Đợt sau muốn
   khóa thì cần thêm instrumentation ở tầng harness (timestamp
   khi `decoded` chạm mốc / khi feed loop xong — đều là đọc thêm,
   không sửa production) hoặc đo trên máy quiet để xem gap có co
   về ~40 ms như B1 hay giữ nguyên.

## 5. Kiểm chứng + sửa nhỏ của lượt tiếp nối

- Mới `settle47C2.test.ts`: **24/24 pass** (esbuild bundle
  `--format=esm` ra scratch, chạy bằng node — đúng mẫu A1/B1).
  Lưu ý: header harness ghi "24/24" là đúng; đếm tay trước đó
  tưởng 25 là đếm nhầm, runner là chuẩn.
- Hồi quy cùng runner (`run-tests.mjs`, scratch
  `~/workspace/tmp-round47-c2/`): A1 **20/20**, Z1 **19/19**,
  B1 **19/19**, Y1 **14/14** — fail 0. Khớp đúng số báo cáo đợt
  trước.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, 0 lỗi**
  (chạy toàn project; tsconfig không do C2 sửa).
- `vite build` không chạy lại ở C2 (không đụng code build;
  B1 đã build pass trong click-test).
- Không chạy lại: mọi phép đo browser headed của luồng khác,
  Safari/Firefox/máy thật, 720p/1080p, GOP khác, tab ẩn (B1 đã
  SUCCESS n = 1, không đo lại).

**Hai sửa nhỏ ở harness trong lượt tiếp nối (chỉ file harness):**

1. **`postToggleRate` đo sai → đã sửa.** Bản lượt trước tính
   `(ss.cache − preToggle.cache)/ss.t` với `ss.cache` đã trừ 90
   frame của settle-drop nên ra số âm vô nghĩa (−30..−51
   frame/s). Bản chạy lại dùng mẫu TRƯỚC khi drop (`prev.cache`,
   `prev.t`): 0–1,3 frame/s — đúng bản chất (cache đã đủ trước
   toggle). Mọi số `postToggleRate` âm ở log lượt trước đều HỦY,
   cấm trích.
2. **Ghi kết quả từng phần sau mỗi attempt** (`c2-result-partial.json`)
   và sau pha D1 — vì lượt trước mất trắng `c2-result.json` do
   daemon restart giết trước khi ghi cuối. File partial chỉ là
   bằng chứng dự phòng; `c2-result.json` cuối lượt vẫn ghi đủ
   (6 attempt + D1 + wave2=null) và đã đối chiếu khớp log.

## 6. Cái gì chưa làm / chưa chứng minh + hướng cho đợt sau

1. **SUCCESS đường asset: vẫn mở.** 0/9 attempt C2 (0/11 tính
   cả B1). Hướng cho đợt sau — theo thứ tự ưu tiên, KHÔNG phải
   aim chặt hơn hay W2 chậm hơn (cả hai đã bị loại bằng số đo):
   (a) instrumentation tầng harness để tách đuôi feed/flush/
   drain của prefetch (đọc thêm timestamp, không sửa production)
   rồi mới quyết định can thiệp gì; (b) một lượt trên máy quiet
   (loadavg ~0,1) để xem gap có co về ~40 ms như B1 hay giữ
   nguyên vài trăm ms — nếu co về thì SUCCESS chỉ là chuyện
   xổ số tải, nếu giữ nguyên thì thứ tự short-circuit là cấu
   trúc; (c) thiết kế race khác (ví dụ toggle sớm hơn để đuôi
   flush của prefetch chồng lên pha load của W2) — là quyết định
   thiết kế harness mới, không claim trước. Tuyệt đối không sửa
   production `decodeGop` (ví dụ resolve sớm khi đủ frame mới)
   nếu chưa có test đỏ-trước/xanh-sau chứng minh đúng wiring —
   đó là thay đổi hành vi thật, không phải chỉnh harness.
2. **Gate fps nhiễu dưới tải (quan sát phụ, không phải kết luận
   chính).** Lượt chạy lại attempt 2/4/6: gate lần 1 verdict
   `blocked` (fps đo 51–57, dưới ngưỡng easy) rồi cửa sổ thử lại
   412 re-gate thành `allowed` (fps 67–102 trên cùng controller).
   Harness đã hấp thụ bằng vòng thử lại có sẵn; chỉ ghi nhận là
   số đo fps dưới tải không ổn định — không claim gate sai.
3. **`decoded` trực tiếp của W2:** vẫn không có (xem §0.5).
4. **Vòng draw/toggle cho clip `asset:` trên UI app thật:** vẫn
   chưa chứng minh (nợ từ B1 §6.4, click-test B1 chỉ tới bin).
5. **Bug race `loadSample` (B1 §6.2):** vẫn mở, C2 không đụng tới.
6. **Chỉ chứng minh trên một fixture:** 360p GOP 90, GOP hỏng
   [900,990); chưa mô hình/đo 720p/1080p, GOP khác, file khác.
7. **Không claim gì thêm:** không đổi luật dọn T2/T4, không đổi
   ngưỡng cổng, không đổi ngưỡng GOP 32/128 MiB, không đổi mặc
   định TẮT của GOP, không sửa production code, không nới tiêu
   chí SUCCESS của Y1, không chạy sóng 2 slack=1 (đúng luật).

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settle47C2.ts` (đã có từ lượt trước, kiểm
  chứng lại, không sửa)
- Mới: `apps/web/src/lib/settle47C2.test.ts` (24/24)
- Mới: `apps/web/scripts/settle-headed-47c2.mjs` (đã có từ lượt
  trước; lượt này sửa 2 điểm nhỏ §5: `postToggleRate` + ghi
  kết quả từng phần)
- Mới: `docs/PHASE9_ROUND47_C2_SETTLE_LIMITS.md` (file này)
- Không sửa: mọi file khác (đặc biệt mọi production code,
  tsconfig.json, file luồng khác).
  Scratch đo nằm ngoài repo (không vào batch):
  `~/workspace/tmp-round47-c2/` (`c2-headed.log` lượt trước bị
  giết giữa chừng, `c2-headed-run2.log` + `c2-result.json` +
  `c2-result-partial.json` lượt chạy lại đầy đủ, `run-tests.mjs`,
  các bundle `.test.mjs`).
