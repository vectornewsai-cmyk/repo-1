# Phase 9 đợt 46, luồng B1 — Settle-drop: W2 mốc 32,4667 s + tab ẩn 300 s + click-test ProjectMenu — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code nào, KHÔNG tự stage batch push (parent gộp).
Mọi số timing đều under-load (các luồng đợt 46 khác chạy song song) —
cấm dùng làm baseline quiet hay claim fps.

Đóng nợ: docs/PHASE9_ROUND45_LIMITS.md §4.2 +
docs/PHASE9_ROUND45_A1_SETTLE_LIMITS.md §6 (SUCCESS trên đường
`asset:` vẫn mở; mốc headed sau là 32,4667 s; mirror W2 + chooseCorruptWindow
đã có; tab ẩn ≥ 5 phút thật chưa đo; click-test thật vỏ UI `.vcut.json`
qua ProjectMenu chưa làm).

## 0. Kết luận ngắn (không vượt số đo)

1. **Giả thuyết "tràn GOP lành" của Z1: SAI cho cửa sổ W2 mốc
   32,4667 s — trên cả hai đường.** Bằng chứng headed thật:
   đường GOP (pha hidden): W2 809,4 ms `ok=false` sau đúng delay
   800 ms của range GOP hỏng (fetch range hỏng thật rồi mới fail);
   đường asset (probe sạch + rerun có cổng chống coalescing): W2
   159,5–180,7 ms `ok=false`, controller latch `failed=true`.
   Cửa sổ W2 KHÔNG decode được frame lành nào trước GOP hỏng —
   nhất quán với GOP-align dừng ở keyframe 900 (stss còn nguyên:
   probe đọc `samples[900].isKey=true`), tức cửa sổ nằm trọn GOP
   hỏng như mirror A1 dự đoán, không vắt qua GOP lành. Lưu ý trung
   thực: `decodeFrom=900` là suy ra từ chuỗi (stss + fail + luật
   GOP-align + `buildGopSegment` không validate nội dung), KHÔNG
   phải đọc trực tiếp từ `lastDecodeRange` (đường fail không gán
   range mới — xem §2.3). `decodeTo` cũng không được ghi trực tiếp;
   mirror dự đoán 974.
2. **W2 `ok=true` của Z1 (2/2 ultra-tight) nay có lời giải thích
   tốt hơn nhiều: harness coalescing, không phải decode GOP hỏng.**
   B1 tái hiện đúng dạng đó ở lần chạy 1 (W2 409,4/132,2 ms
   `ok=true`, range [12240,12360] = cửa sổ prefetch 412 s, decoded
   proxy 121 = "full") và chứng minh cơ chế: poll `inFlight>=1`
   nhìn nhầm prefetch của cửa sổ setup nên thoát ngay khi decode
   cửa sổ 412 s vẫn đang bay; W2 sau đó coalesce vào decode 412 s
   đó (`ensureWindowForTime` trả promise đang bay). Con số
   `drawn-after-W2 = 121` không đổi ở mọi attempt của Z1 cũng chính
   là kích thước cửa sổ 412 s — khớp cơ chế này. Đây là DIỄN GIẢI
   LẠI số Z1 (không chạy lại Z1), không phải đo lại Z1; nhãn
   SUCCESS/PARTIAL/INVALID của Z1 theo tiêu chí Y1 vẫn giữ nguyên
   như đã ghi, chỉ câu chuyện cơ chế "W2 ok=true vì tràn GOP lành"
   là bị thay thế. W2 `ok=false` 8/8 của Y1 vẫn nhất quán với W2
   hỏng thật (B1 xác nhận lại bằng probe sạch + rerun).
3. **SUCCESS trên đường `asset:`: VẪN MỞ (0/4 attempt, trong đó
   2 attempt ultra-tight với W2 thật).** Với harness đã vá, 2
   attempt ultra-tight đều: W2 fail thật (~160–178 ms) rồi
   prefetch settle TRƯỢT SAU W2 chỉ ~36–43 ms → PARTIAL-immediate-drop
   (settled 0→90, cache 211→121, khớp delta). Nhánh thử lại cần
   settle TRONG lúc W2 bay; lần này trượt gang tấc, không phải
   trượt vì W2 `ok=true` như câu chuyện cũ.
4. **Tab ẩn 300 s thật: SUCCESS (lần đầu, n = 1, đường GOP).**
   Dwell 300.000 ms, 60 poll visibility đều hidden; settle +61 ms
   `deferredHere=true`; cuối +810 ms settled 0→90, cache 211→121
   (sụt đúng 90), ui off, prefetch 0 — đúng tiêu chí SUCCESS của
   Y1. Timer 100 ms sau dwell: 894,3 ms (~8,9×) lúc còn ẩn, rAF
   không chạy lúc ẩn. Chỉ 1 attempt nên không lấy làm chuẩn throttle.
5. **Click-test thật vỏ UI `.vcut.json` qua ProjectMenu: 7/7 PASS**
   (sau khi sửa sequencing + kỳ vọng — xem §4). Mở file thật →
   spec chứa clip `asset:` → autosave chứa đúng clip → không panel
   Media thiếu → bin render item restore (tên item = src
   `asset:<id>`).
6. **BUG THẬT mới phát hiện trong lúc click-test (KHÔNG sửa ở B1):
   race `loadSample` async ghi đè project vừa mở.** App mount gọi
   `loadSample()` async; nếu user mở file trong lúc `buildSampleProject`
   còn đang fetch (~10 s trên VM này), lệnh `set` cuối của
   `loadSample` sẽ revert toàn bộ project vừa mở về mẫu (đo được:
   +2..+5 s sau khi mở: duration 10 s + bin có asset; +6 s: revert
   về mẫu 8 s + bin mau; autosave sau đó cũng bị ghi đè bằng mẫu).
   B1 không vá production vì luật luồng đòi test đỏ-trước/xanh-sau
   cho đúng wiring store async — test thuần cho helper rời rạc
   sẽ chỉ là diễn kịch, không chứng minh được wiring. Chi tiết +
   hướng sửa ở §6.2, để đợt sau quyết định.

## 1. Thay đổi code (chỉ file hậu tố 46B1 + LIMITS này)

- Mới: `apps/web/src/lib/settle46B1.ts` — module thuần, KHÔNG được
  import bởi production code:
  - `decideW2DecodedProxy`: khóa quy tắc suy `decoded` của W2 từ
    snapshot trước/sau (lastWindowKey + lastDecodeRange + cacheSize
    thật): ok=true + range đổi → proxy = cacheSize sau evict
    (kèm cross-check drawn); ok=true + range không đổi + key trùng
    + cache>0 → fast-path, decoded null; ok=true + range không đổi
    + khác → dị thường; ok=false → suy ra 0 (ghi rõ inferred);
    ok=null → unknown.
  - `classifyFailedW2`: phân loại W2 fail mà KHÔNG dùng range sau
    W2 (bẫy range cũ, §2.3).
  - `classifyWithRealRange`: bọc `classifyW2` của A1 bằng cửa sổ
    decode thật (chỉ gọi khi ok=true + range đổi).
  - `effectiveWindow`: công thức production
    min(windowFrames, floor((totalBudget − retained)/bytesPerFrame));
    với fixture này (640×360, file 69.861.131 byte, ngân sách 320 MiB)
    = min(75, 422) = 75 — khớp giả định eff 75 của A1.
- Mới: `apps/web/src/lib/settle46B1.test.ts` (19/19, §5).
- Mới: `apps/web/scripts/settle-headed-46b1.mjs` — harness headed
  2 pha (asset ultra-tight + hidden 300 s), từ mẫu Z1 đổi 4 điểm:
  W2 = 32,4667 s; entry phơi lastWindowKey + lastDecodeRange thật
  (trường private của TS nhưng esbuild strip type nên runtime đọc
  được qua bracket access — chỉ harness đọc); vòng aim sửa lỗi thứ
  tự của Z1 (kiểm tra cache >= target TRƯỚC inFlight < 1); sau
  lần chạy 1, thêm cổng chống coalescing (chờ decode cửa sổ
  prefetch xong: lastWindowKey đổi khỏi key setup VÀ không còn
  decode bay; quá 30 s thì attempt INVALID) + guard
  decodeWindowInFlight=false trước W2 + nhánh fail dùng
  classifyFailedW2 + cờ env `B1_SKIP_HIDDEN=1` (đã đo hidden
  xong thì không đo lại 300 s). Harness tự tạo thư mục scratch.
- Mới: `apps/web/scripts/clicktest-46b1-projectmenu-asset.mjs` —
  click-test app thật (vite build ra scratch + static server cùng
  origin + seed AssetStore thật + mở file `.vcut.json` thật), 7/7
  (§4). Harness này KHÔNG dùng `DOM.setFileInputFiles` (không dính
  ở setup websocket CDP này, §4.3) mà dùng DataTransfer + dispatch
  change với File thật.
- Mới: `docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md` (file này).
- KHÔNG sửa: tsconfig.json (test import không đuôi `.ts` như A1
  nên không cần exclude), preview.tsx, store.ts,
  reverseWebcodecs.ts, bridge, mọi file luồng khác, và đặc biệt
  KHÔNG sửa `loadSample` dù phát hiện race (§6.2).

## 2. Luật production + 2 cái bẫy harness (đọc trước khi trích số)

### 2.1 Luật dùng để đọc số

- Full-file path: `decoded <= 0` → `unsupported=true` + return
  false; `decoded > 0` → evict + return true (kể cả decode một
  phần). `lastWindowKey` + `lastDecodeRange` chỉ gán ở đường thành
  công, sau evict. `decodePromise` coalescing: `ensureWindowForTime`
  đang có decode bay thì trả luôn promise đó (không decode mới).
- GOP path (`ensureWindowViaGop`): pre-resolve mọi GOP giao cửa sổ
  trước khi decode; `buildGopSegment` chỉ cắt chunk theo offset,
  KHÔNG validate nội dung chunk (IDR zero vẫn qua pre-resolve bình
  thường) — nên W2 fail trên đường GOP không thể đổ cho pre-resolve
  chặn chunk hỏng: nếu cửa sổ chứa GOP lành, decodeGop sẽ decode
  được frame lành trước khi gặp chunk hỏng và trả true.
- Fast-path: key === lastWindowKey && cache.size > 0 → return true
  ngay, không decode, không gán range mới.
- `autosave()` debounce 5 s (không ghi ngay); `autosaveNow()` mới
  ghi ngay. Đọc autosave ở 2 s sau khi mở sẽ fail oan (§4.3).
- Item rehydrate mang `name = src` của clip (dạng `asset:<id>`),
  không phải tên file — C6 lần đầu tìm tên file nên fail oan (§4.3).

### 2.2 Bẫy coalescing (phát hiện ở lần chạy 1, đã vá ở lần chạy lại)

Chuỗi race của harness Y1/Z1/B1-v1: `windowAsync(412)` khởi động
decode cửa sổ prefetch → poll `inFlightPrefetchWindows >= 1` để
biết prefetch đã bay. Nhưng prefetch của cửa sổ SETUP (417 s) đã
bay từ trước, nên poll thoát ngay cả khi decode 412 s chưa xong.
W2 sau đó gọi `ensureWindowForTime` đúng lúc decode 412 s còn bay
→ coalesce → timing/ok/range của W2 thực chất là của decode 412 s.
Dấu hiệu nhận biết: `preW2.lastWindowKey` vẫn là key setup
([12420,12510]) trong khi `postW2` là key 412 s ([12240,12360]);
`drawn-after-W2` = 121 (kích thước cửa sổ 412 s) ở mọi attempt.
Cách vá (đã vào harness B1-v2): sau poll inFlight, chờ thêm tới
khi lastWindowKey đổi khỏi key setup VÀ decodeWindowInFlight =
false (timeout 30 s → INVALID-prefetch-window-not-done); trước W2
ghi `decodeWindowInFlight` và từ chối chạy W2 nếu còn decode bay.
Mọi số W2 của lần chạy 1 ở pha asset (và, theo cùng cơ chế, W2
`ok=true` của Z1) đều KHÔNG được dùng làm bằng chứng về cửa sổ
hỏng — chỉ lần chạy lại + probe sạch mới được dùng.

### 2.3 Bẫy range cũ (phát hiện ở pha hidden lần chạy 1)

Khi W2 fail, `lastDecodeRange` sau W2 vẫn là range của cửa sổ
TRƯỚC (412 s). Đưa range đó vào `classifyW2` của A1 sẽ cho chẩn
đoán `fast-path` (vì key trùng + cache > 0) dù W2 trả false —
fast-path luôn trả true nên đây là mâu thuẫn, và A1 đã gắn cờ
`consistent=false` đúng cho trường hợp này. Lỗi của B1-v1 là đã
in chẩn đoán đó ra như kết luận. Cách sửa: W2 fail thì dùng
`classifyFailedW2` (fail theo luật production), không bao giờ đưa
range sau W2 vào phân loại. Test 46B1 khóa cả hai mặt: fail đúng
là fail, và `classifyW2` thuần với range cũ cho fast-path kèm
`consistent=false` (tín hiệu input không hợp lệ).

## 3. Số đo headed thật

Fixture chung mọi pha: `y1-corrupt-gop30-360p-gop90-420s.mp4`
(69.861.131 byte = 66,62 MiB; GOP hỏng [30,33), IDR pos 5378169;
fps 30, 12600 sample). Probe asset: trước race PASS ở cả 2 lần
chạy (assetId `a_e40641880f8e75dc`, blob size == manifest size ==
69.861.131, restored 1, failed 0, `gopMode = full-file-fallback`).

### 3.1 Lần chạy 1 — asset: W2 BỊ NHIỄM coalescing (không dùng làm bằng chứng cửa sổ hỏng)

Ports 9386/8938, DISPLAY :94, loadavg đầu 0,77.

| Attempt | Aim | W2 (đo được) | Phân loại settle |
|---|---|---|---|
| 1 | settled-during-aim (prefetchFrames 136, target 224) | — (không tới W2) | INVALID-settled-before-toggle |
| 2 | cache-ultra-tight (prefetchFrames 107, target 195, preToggle 203) | 409,4 ms, ok=true, range [12240,12360] = cửa sổ 412 s, proxy 121 "full" | INVALID-not-deferred (settle +479 ms sau W2, counter 0) |
| 3 | settled-during-aim (như attempt 1) | — | INVALID-settled-before-toggle |
| 4 | cache-ultra-tight (preToggle 209) | 132,2 ms, ok=true, range [12240,12360] = cửa sổ 412 s | INVALID-final-mismatch (settle +94 ms deferredHere=true nhưng counter cuối 0, cache sụt 150) |

Đọc đúng: attempt 2/4 KHÔNG PHẢI W2 cửa sổ hỏng — `preW2`
vẫn là key setup, `postW2` là key 412 s, `decodeWindowInFlight`
lúc W2 không được ghi (harness v1 chưa có guard). Mọi claim
"full" ở 2 attempt này đã bị HỦY với tư cách bằng chứng cửa sổ
hỏng; nhãn INVALID của chúng theo tiêu chí Y1 vẫn giữ (đó là
phân loại của trace, không phải của cửa sổ hỏng).

### 3.2 Lần chạy 1 — hidden 300 s: SUCCESS (n = 1, đường GOP)

Dwell 300.000 ms, 60 poll visibility đều hidden, rồi mới chạy
race trong lúc ẩn (aim Y1 cache-near-full, W2 32,4667 s, delay
server 800 ms cho range GOP hỏng). Setup: `gopMode = gop-range`,
probe head size 69.861.131, fps cổng 811,8 (under-load).

- preW2: lastWindowKey 12240-12360, cache 211, failed=false
  (decode 412 s đã xong từ lâu trong dwell — W2 này không bị
  coalescing; bằng chứng: durMs 809,4 ≈ delay 800 ms, chỉ request
  range GOP hỏng mới bị delay).
- W2: 809,4 ms, `ok=false`, `failed=true`, range sau W2 giữ nguyên
  [12240,12360] (range cũ — KHÔNG dùng làm cửa sổ W2, §2.3);
  chẩn đoán đúng: fail (decoded suy ra 0).
- Settle +61 ms: winInFlight=true, settled 0→0, cache 211→211,
  deferredHere=true. Cuối +810 ms: settled 0→90 (delta 90),
  cache 211→121 (sụt đúng 90), ui=off, prefetch=0 → **SUCCESS**
  theo đúng tiêu chí Y1.
- Timer/rAF lúc còn ẩn: timer 100 ms nổ sau 894,3 ms (~8,9×),
  elapsed 1086,5 ms, rAF không chạy, visibility hidden; sau hiện
  lại: visible. Chỉ 1 mẫu — không claim clamp 1000 ms hay chuẩn
  throttle.
- Tab ẩn ≥ 5 phút thật: ĐÃ ĐO (300 s), không còn NOT-MEASURED.

### 3.3 Lần chạy lại — asset với harness đã vá: W2 THẬT, SUCCESS vẫn mở

Ports 9386/8938, DISPLAY :95, loadavg đầu 0,10, pha hidden BỎ
QUA bằng env (đã SUCCESS ở lần chạy 1 — dòng "FAIL B1(B)" trong
log lần chạy lại chỉ là artifact của SKIP, không phải fail thật).
Cổng 412 đều PASS ở cả 4 attempt (lastWindowKey 12240-12360 sau
khi chờ, khác key setup 12420-12510).

| Attempt | Aim | W2 thật (decodeInFlightAtW2Start=false) | Phân loại settle |
|---|---|---|---|
| 1 | settled-during-aim (prefetchFrames 136, target 224) | — | INVALID-settled-before-toggle |
| 2 | cache-ultra-tight (preToggle 203) | 178,3 ms, ok=false, failed=true, decoded suy ra 0, diagnostic fail | PARTIAL-immediate-drop: settle +214 ms (sau W2 ~36 ms), settled 0→90, cache 211→121 |
| 3 | settled-during-aim (như attempt 1) | — | INVALID-settled-before-toggle |
| 4 | cache-ultra-tight (preToggle 201) | 159,5 ms, ok=false, failed=true, decoded suy ra 0, diagnostic fail | PARTIAL-immediate-drop: settle +203 ms (sau W2 ~43 ms), settled 0→90, cache 211→121 |

Đọc đúng: **SUCCESS đường asset: vẫn mở, 0/4 attempt** (2
attempt không tới được W2 vì prefetchFrames 136 → target 224
không tới kịp trước khi prefetch settle — cùng mẫu "xổ số
aheadRange" đã ghi ở Z1; 2 attempt ultra-tight thì W2 fail thật
nhưng prefetch settle trượt sau W2 ~36–43 ms). Khoảng trượt này
là số đo mới và chính xác hơn câu chuyện cũ: nhánh thử lại cần
settle trong cửa sổ W2 chỉ ~160–180 ms (đường blob local, không
có delay server), và prefetch đã settle ngay sau đó.
`drawn-after-W2` [12240,12360] count 121 ở attempt 2/4 là cửa sổ
412 s còn sót sau fail + settle-drop (W2 fail không evict), KHÔNG
phải output của W2 — cấm đọc thành "W2 decode 121 frame".

### 3.4 Probe sạch — đường asset, không prefetch, không race

Script chẩn đoán ở /tmp (không phải deliverable repo): controller
mới, setup 417 s, rồi `windowSync(32,4667)` trực tiếp.

- Track: 12600 sample, timescale 15360.
  `sampleIndexForPresentationTime(track, 32,4667) = 972`
  (presentPos 974 — khớp targetPos A1); present974 → decode 972,
  present900 → decode 900.
- `samples[810].isKey = true`, `samples[900].isKey = true`,
  `samples[974].isKey = false`, `samples[990].isKey = true` —
  stss còn nguyên: keyframe đầu GOP hỏng (900) vẫn là keyframe
  trong bảng sample của app (khác cờ packet của ffprobe: packet
  900 mất cờ K vì IDR bị zero — ffprobe-flags không phải nguồn
  cho GOP-align của production).
- `windowSync(32,4667)`: `ok=false`, 180,7 ms, `failed=true`;
  snap sau W2 giữ nguyên cửa sổ setup ([12420,12510], cache 91);
  gọi lại lần 2: `ok=false` chỉ sau 1,5 ms (latch unsupported —
  fail nhanh, không phải lỗi tải thoáng qua).
- Suy luận decodeFrom = 900 (ghi rõ là suy luận, không phải đọc
  trực tiếp — đường fail không gán range): GOP-align đi ngược từ
  decode-index nhỏ nhất của cửa sổ present tới keyframe gần nhất;
  keyframe trong vùng là 900 (990 đã ngoài cửa sổ); nếu decodeFrom
  là 810 thì 90 frame GOP lành đã decode được → W2 phải trả true
  (trái với quan sát fail, và trái với việc `buildGopSegment`
  không chặn chunk hỏng). decodeTo không ghi trực tiếp; mirror
  dự đoán 974.
- Ghi chú môi trường probe: GET trọn 69 MB đơn từ Chrome probe
  fail "Failed to fetch" trong khi curl + Range 1 MB đều chạy;
  probe đã dùng fetch chunk Range 8 MB (đã chứng minh chạy được)
  để ráp blob. Nguyên nhân GET đơn fail chưa xác định (không
  claim là bug Chrome — có thể do môi trường); không ảnh hưởng
  kết luận vì blob ráp chunk có size đúng 69.861.131 và assetId
  trùng Z1/B1.

## 4. Click-test thật vỏ UI `.vcut.json` qua ProjectMenu: 7/7 PASS

Harness `clicktest-46b1-projectmenu-asset.mjs`: vite build mới ra
scratch + static server cùng origin (app + seed bundle + fixture)
+ seed AssetStore thật trên origin app (fetch fixture bằng Range,
ingest thật → assetId `a_e40641880f8e75dc`, size == blob size ==
69.861.131) + file `.vcut.json` thật (envelope vcut-project, 1 clip
video src `asset:<id>`, duration 10 s) đưa vào input ẩn của
ProjectMenu bằng DataTransfer + dispatch change (handler onFile
của React chạy thật với File thật).

| Case | Kết quả |
|---|---|
| C1 app load (React render #root) | PASS |
| C2 nút "Mở file dự án (.vcut.json)" tồn tại | PASS |
| C3 đưa file không toast lỗi mở file (delivery assigned 1, filesAfterDispatch 0 = handler đã chạy dòng `e.target.value = ""`) | PASS |
| C4 autosave sau khi mở chứa đúng clip `asset:a_e40641880f8e75dc` (poll lần 9, name "B1 asset project") | PASS |
| C5 không panel "Media thiếu" trước và sau khi mở | PASS |
| C6 body textContent chứa `asset:a_e40641880f8e75dc` (tên item rehydrate = src clip) | PASS |
| C7 0 Runtime.exceptionThrown trong phiên | PASS |

Quan sát thêm (không tính PASS/FAIL): vùng preview có 1 canvas,
0 video. Vòng draw/toggle cho clip `asset:` trên UI app thật vẫn
CHƯA được chứng minh (click-test này chỉ tới mở file + rehydrate
+ bin, không lái preview draw) — vẫn là nợ mở.

### 4.1 Sequencing bắt buộc: chờ sample load xong rồi mới mở file

Lần chạy click-test đầu (mở file ngay sau khi app load) đã lộ
race §6.2: bin có asset ở +2..+5 s sau khi mở nhưng revert về mẫu
ở +6 s, nên C6 đọc ở +10 s fail. Harness cuối chờ sample load
sẵn sàng (bin có mau-1 + duration TopBar 8 s, ~7 s sau khi load)
rồi mới mở file — tức đo đường mở file ở trạng thái app ổn định.
Đây là sửa sequencing của harness, không phải sửa production.

### 4.2 Hai lần chạy đầu fail vì kỳ vọng sai của harness (ghi để không lặp lại)

- Lần 1: `DOM.setFileInputFiles` qua websocket CDP không dính
  (trả {} nhưng `input.files` vẫn [0,0] ngay sau đó và sau 2,5 s,
  cả 2 input) + đọc autosave ở 2 s (trước debounce 5 s) → C4/C6
  fail, C3/C5 pass rỗng (handler chưa chạy). O4 dùng pipe CDP nên
  không gặp lỗi setFileInputFiles này.
- Lần 2 (sau khi chuyển sang DataTransfer): C4/C5 pass nhưng C6
  vẫn fail vì tìm tên file trong khi tên item rehydrate là src
  `asset:<id>` (§2.1). Lần 3 (sửa cả sequencing + kỳ vọng): 7/7.

## 5. Kiểm chứng

- Mới `settle46B1.test.ts`: **19/19 pass** (esbuild bundle
  --format=esm ra /tmp scratch, chạy bằng node — đúng mẫu A1).
- Hồi quy cùng runner: A1 **20/20**, Z1 **19/19** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, 0 lỗi nhắc
  tới 46B1** (chạy toàn project; tsconfig không do B1 sửa).
- `vite build` pass trong click-test (~6 s, outDir scratch).
- Không chạy lại: mọi phép đo browser headed của luồng khác,
  Safari/Firefox/máy thật, 720p/1080p, GOP khác.

## 6. Cái gì chưa làm / chưa chứng minh + bug mới

1. **SUCCESS đường asset: vẫn mở.** 0/4 attempt lần chạy lại
   (2 không tới W2, 2 PARTIAL trượt sau W2 ~40 ms). Hướng cho đợt
   sau (quyết định thiết kế harness, không phải sửa production):
   aim chặt hơn nữa (ít frame còn lại hơn) hoặc W2 chậm hơn để
   cửa sổ hoãn rộng ra — nhưng đổi aim là đổi biến đo, phải ghi
   rõ khi làm. Tiêu chí SUCCESS của Y1 giữ nguyên, không nới.
2. **BUG THẬT — race `loadSample` ghi đè project vừa mở (B1
   KHÔNG sửa, xem §0.6).** Cơ chế: `App.tsx` mount effect gọi
   `void st.loadSample()` khi chưa có autosave; `loadSample`
   (`store.ts`) `await buildSampleProject()` (fetch media mẫu,
   ~10 s trên VM này) rồi `set({spec, media, ...})` vô điều kiện.
   Guard `sampleLoading` chỉ chống gọi trùng, không có kiểm tra
   thế hệ (generation) hay hủy. Nếu user mở file trong lúc đó,
   lệnh `set` cuối sẽ revert toàn bộ project vừa mở về mẫu. Số
   đo: mở file → +0..+1 s duration 10 s, bin chưa có asset;
   +2..+5 s duration 10 s, bin CÓ asset (rehydrate xong);
   +6 s duration 8 s, bin mau (sample đã đáp); autosave sau đó
   bị ghi đè bằng mẫu (đọc ở +8 s còn thấy autosave project
   mới do debounce chưa kịp, đọc ở +15 s đã là mẫu
   ["mau-1.webm","mau-2.webm",null]). Ảnh hưởng: session mất
   project vừa mở (file trên đĩa không hề hấn gì; mở lại file
   thì được, nhưng user không được báo gì). Hướng sửa đề xuất:
   đếm thế hệ project (tăng ở `replaceProject`/`newProject`/khi
   `loadSample` tự set thành công); `loadSample` chụp thế hệ
   trước `await`, sau `await` chỉ `set` khi thế hệ không đổi,
   nếu đổi thì bỏ qua và reset `sampleLoading=false` để nút
   "Dự án mẫu" bấm sau đó vẫn chạy được. Vì sao B1 không vá:
   luật luồng chỉ cho sửa production khi có test đỏ-trước/
   xanh-sau chứng minh đúng wiring; race async cấp store này
   không chạy được bằng test Node thuần mà không mock nặng
   trình duyệt (fetch media mẫu, File, URL.createObjectURL,
   probe video) — test helper rời rạc sẽ không chứng minh được
   wiring thật nên B1 chọn báo cáo thay vì vá diễn kịch.
3. **Tab ẩn:** 300 s SUCCESS mới n = 1 (đường GOP, Chromium
   headed dưới Xvfb). Chưa đo: lặp lại 300 s, ẩn giữa chừng
   prefetch, Safari/máy thật, ẩn > 5 phút.
4. **Vòng draw/toggle cho clip `asset:` trên UI app thật:** chưa
   chứng minh (click-test B1 chỉ tới bin; Z1 §4 vẫn mở).
5. **`decoded` trực tiếp của W2:** controller vẫn không phơi
   trường này — mọi số `decoded` ở đây đều là proxy (cache sau
   evict, khi ok=true + range đổi) hoặc suy ra 0 (khi fail).
   Muốn số trực tiếp thì production phải thêm getter — đó là
   thay đổi production cần lý do riêng, không làm ở B1.
6. **Chỉ chứng minh trên một fixture:** 360p GOP 90, GOP hỏng
   [900,990); chưa mô hình/đo 720p/1080p, GOP khác, file khác.
7. **Không claim gì thêm:** không đổi luật dọn T2/T4, không đổi
   ngưỡng cổng, không đổi ngưỡng GOP 32/128 MiB, không đổi mặc
   định TẮT của GOP, không sửa production code, không nới tiêu
   chí SUCCESS của Y1.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settle46B1.ts`
- Mới: `apps/web/src/lib/settle46B1.test.ts` (19/19)
- Mới: `apps/web/scripts/settle-headed-46b1.mjs`
- Mới: `apps/web/scripts/clicktest-46b1-projectmenu-asset.mjs` (7/7)
- Mới: `docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md` (file này)
- Không sửa: mọi file khác (đặc biệt tsconfig.json, preview.tsx,
  store.ts, reverseWebcodecs.ts, bridge, file luồng khác).
  Scratch đo nằm ngoài repo (không vào batch):
  `~/workspace/tmp-round46-b1/` (lần chạy 1),
  `~/workspace/tmp-round46-b1-rerun/` (lần chạy lại, pha hidden
  SKIP bằng env), `~/workspace/tmp-round46-b1-click/` (click-test:
  dist + kết quả), `/tmp/b1-clean-probe.mjs` +
  `/tmp/b1c-debug*.mjs` (chẩn đoán, không phải deliverable).
