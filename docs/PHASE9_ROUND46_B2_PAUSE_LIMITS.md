# Phase 9 đợt 46, luồng B2 — Nối lib phân loại quirk A2 vào seek.ts + quyết định Seeker sync-throw — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng (xem §7).
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận. Số timing chỉ đo trên máy đang chạy song song nhiều
luồng đợt 46 — không dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Nối lib A2 vào seek.ts — XONG, có test khóa, không đổi hành vi
   đáp 0.** `seekElement` nay dùng `WrongLandingTracker` của A2 thay
   cho bộ đếm chỉ-đáp-0 của Z2 (marker Z2 giữ nguyên, thêm marker
   `ROUND46-B2` riêng): đáp đúng / seek về 0 có chủ ý reset streak;
   đáp 0 VÀ đáp sai frame khác 0 đều đếm liên tiếp, fail ở lần sai
   thứ 3 (ngưỡng truyền đúng `SEEK_ZERO_LANDING_MAX_RETRIES = 2`).
   Test mới `pause46B2` 11/11; pha đỏ đã chạy thật trên code cũ:
   6/11 (đúng 5 test hành vi mới đỏ — wrong-landing ×3, seekAll,
   sync-throw). `preview.tsx` KHÔNG cần sửa: vòng lặp đã tiêu thụ
   outcome của `seekAll`, wiring nằm trọn trong `seek.ts`.
2. **Bằng chứng headed cho fail-fast seek-landing-0 — VẪN
   NOT_MEASURED, nhưng lần này giả thuyết fixture đã bị LOẠI TRỪ
   bằng chứng byte-identical.** Fixture B2 lần 2 (video-only +
   faststart) giống hệt file Y2 còn lưu từng byte (`cmp` sạch cho
   cả valid lẫn broken-gap: 313.311 byte, 30 packet GOP1, 104.408
   byte, vị trí 101.878–206.286), đối chứng valid đáp 2,5 đúng, chữ
   ký hỏng 1,5 khớp Y2 từng field (error code 3, kẹt seeking, rs 1)
   — vậy mà seek 2,5 trên broken-gap vẫn đáp đúng 2,5 (raw lẫn
   seekElement, 14–16 ms). Quirk không tái hiện KHÔNG còn đổ được
   cho fixture lệch: khác biệt còn lại phải nằm ở điều kiện chạy
   của phiên Y2 mà tài liệu không ghi lại (xem §3.3). Fail-fast Z2
   + mở rộng B2 vẫn chỉ có bằng chứng Node mock — đừng trích PASS
   headed cho chúng.
3. **Bằng chứng vòng lặp preview ĐẦY ĐỦ cho 3 sửa Z2 — LẦN ĐẦU CÓ
   trong app thật (không chỉ mức helper).** App build từ source
   hiện tại, seed broken-gap (cùng assetId/sha Y2), scrub 1,5 →
   cạn cap seek sau 17,1 s (count 10, kind `"timeout"`, ngủ,
   `seekElementRecreated = 1`, `seekRecreatedSeeking = 1` — phục hồi
   Y2 + hunk gọi `releaseElement` của Z2 đã chạy trong app); scrub
   về đúng lastDrawn 0 → ngủ với `lastRequested = 0`, cap reset
   (guard Z2 trong app, ticks chỉ +1 — không tick mãi như bẫy Y2
   §5.2). Đối chứng valid trong app: scrub 1,5 vẽ được, không cạn
   cap, recreated 0 (không phục hồi oan). Mức element vẫn tái xác
   nhận guard helper + releaseElement (el1 true/false, element mới
   true) như A2.
4. **Seeker sync-throw — QUYẾT ĐỊNH: BỌC thành reject (đã cài +
   đã đo).** Executor ném đồng bộ nay settle thành outcome
   `{ok:false, cancelled:false}` → `classifySeekOutcome = "error"`,
   không treo, không uncaught — chứng minh bằng test Node mới VÀ
   bằng headed trên code mới (A2 đo treo trên code cũ). Đây cũng
   là đường production đầu tiên tới kind `"error"` ở tầng Seeker
   (executor ném); nhưng fixture media thật nào làm
   `collectActives` ném thì vẫn chưa có — đừng claim kind error đã
   có bằng chứng từ file media thật (xem §5).
5. **Một test của luồng Y2 đã được sửa theo quyết định này** (không
   giấu): test cũ khóa hành vi treo nay khóa hành vi mới, kèm
   marker `ROUND46-B2`; suite Y2 về 9/9. Chi tiết §5.3.

## 1. Wiring seek.ts (marker ROUND46-B2, marker Z2 giữ nguyên)

- Import: `WrongLandingTracker` từ `./pause45A2.ts` (đuôi `.ts` +
  `// @ts-ignore` có chủ đích theo đúng tiền lệ repo
  `assetStore.ts`/`nestedPreview.ts` — xem §6 vì sao không dùng
  import không đuôi).
- Thay `zeroLandingCount` bằng một `WrongLandingTracker` mỗi lần gọi
  `seekElement`, khởi tạo với `SEEK_ZERO_LANDING_MAX_RETRIES` (2)
  nên ngưỡng fail đáp 0 giữ nguyên từng lần gán; guard
  `assigned && !el.seeking` của Z2 giữ nguyên nên seeked của seek
  cũ đang bay vẫn không bị tính oan.
- Bảng hành vi cũ → mới (listener `seeked`, cùng target, cùng fps):

  | Lần đáp | Cũ (Z2) | Mới (B2, tracker A2) |
  |---|---|---|
  | Đáp đúng target | reset đếm | reset streak (correct) |
  | Đáp 0, target > 0 | đếm, fail lần 3 | đếm, fail lần 3 (giữ nguyên) |
  | Đáp sai frame khác 0 | RESET đếm (lỗi: lặp gán vô hạn) | đếm, fail lần 3 |
  | Đáp sai đổi frame mỗi lần | reset mỗi lần | cộng dồn (tiêu chí "không tới được target") |
  | Đáp 0 xen đáp sai khác 0 | reset khi đáp khác 0 | cùng một streak, cộng dồn |
  | Target 0 (seek về 0 có chủ ý) | không đếm (nhánh target > 0) | intentional-zero, không đếm |

- Giới hạn kế thừa từ A2 (không giấu): tracker không xử lý seek
  target frame 0 đáp lệch sang frame khác (Z2 cũng không xử lý;
  `attempt()` kết thúc sớm khi đã ở đúng frame 0 nên đường này
  hiếm). `preview.tsx` không đổi vì nó đã xử lý outcome
  failed/timeout/cancelled của `seekAll` — wiring không cần thêm
  trường debug mới.

## 2. Test mới pause46B2 (11 test, chạy bằng strip-types)

Lệnh: `node --experimental-strip-types
apps/web/src/lib/pause46B2.test.ts` (từ gốc repo).

| # | Test | Kết quả |
|---|---|---|
| 1 | Seek 2,5 đáp 1,0 mãi → fail nhanh, đúng 3 lần gán | ✓ |
| 2 | Đáp sai đổi frame 1,0 → 0,5 → 1,5 → fail lần 3 | ✓ |
| 3 | Hồi quy Z2: đáp 0 mãi → fail nhanh, đúng 3 lần gán | ✓ |
| 4 | Quirk hỗn hợp 1,0 → 0 → 1,0 → fail lần 3 | ✓ |
| 5 | Đáp sai 2 lần rồi đáp đúng → seeked true, 3 lần gán | ✓ |
| 6 | Sai 1 lần rồi đúng → seeked true, 2 lần gán | ✓ |
| 7 | Target 0 đáp 0 → seeked true, 0 lần gán | ✓ |
| 8 | Qua seekAll: đáp sai khác 0 mãi → failed 1, timedOut 0 | ✓ |
| 9 | Seeker sync-throw → settle outcome error, không uncaught | ✓ |
| 10 | Seeker hồi quy: reject async → error; seek thường → ok | ✓ |
| 11 | Seeker hồi quy: request mới hủy request cũ → cancelled | ✓ |

Pha đỏ (chạy thật, không suy diễn): tạm khôi phục code cũ trong
scratch (bộ đếm chỉ-đáp-0 + Seeker không bọc), chạy test → **6/11**
(đúng 5 test hành vi mới đỏ: 1, 2, 4, 8, 9 — các test đỏ treo ở
race-timeout 5 s / 3 s vì vòng lặp gán vô hạn, process chỉ thoát
khi `timeout 120` giết — chính là bản chất bug cũ); khôi phục code
mới bằng `diff` (RESTORED-IDENTICAL) rồi chạy lại → **11/11**.

## 3. Harness headed pause46B2-headed.mjs — fixture Y2 đúng, quirk vẫn không tái hiện

### 3.1 Hai lần chạy, lần 2 loại trừ giả thuyết fixture

| Lần | Fixture valid | Layout packet GOP1 | Kết quả seek 2,5 broken |
|---|---|---|---|
| 1 (không faststart) | video-only, moov cuối | 30 packet, 104.408 byte, 100.050–204.458 | Raw seeked@2,5; seekElement đáp đúng 2,5 (14 ms) |
| 2 (+faststart) | video-only, moov đầu | 30 packet, 104.408 byte, **101.878–206.286** | Raw seeked@2,5; seekElement đáp đúng 2,5 (14 ms) |

Lần 1 lệch Y2 đúng 1.828 byte (moov 1.828 byte nằm cuối thay vì
đầu: packet đầu ở 48 thay vì 1.876, dù 90 packet cùng size từng
packet và cùng tổng 313.311 byte). Sau khi thêm `-movflags
+faststart`, `cmp` file B2 với file Y2 còn lưu
(`tmp-round43-y2/media/`) cho **VALID-IDENTICAL và
BROKEN-IDENTICAL** — tức lần 2 không còn bất kỳ lệch fixture nào
đo được. Quirk vẫn không tái hiện ở cả hai lần.

### 3.2 Bảng kiểm tra headed lần 2 (chuẩn, exit 0, FAIL = 0)

| Kiểm tra | Kết quả | Số thật |
|---|---|---|
| A-guard-drawn-playhead-headed | PASS | Trước guard: requestSeek false, needsRetry false, normalSleep false, seekCapSleep false, w2CapSleep false. Recovery: resetSeekFailure true, lastRequested 0,1. Sau: normalSleep true |
| CONTROL-valid-raw-2.5 (probe v3) | PASS | seeking@2,500 → seeked@2,500, buffered/seekable [0, 3], rs 4, err null |
| CONTROL-valid-seekElement-2.5 | PASS | 1 landing ct 2,5, seeked true, 15–16 ms, rs 4 |
| B-raw-broken-2.5-observed | OBSERVED | seeking@2,500 → seeked@2,500, ct sau 2,5, rs 4, err null — quirk không tái hiện |
| B-raw-broken-1.5-observed | OBSERVED | seeking@1,500 → error:3, sau: seeking true, rs 1, err 3 — **khớp Y2 §3.1 từng field** |
| B-zero-landing-fail-fast-headed | NOT_MEASURED | Quirk không tái hiện nên không đo được fail-fast; seekElement broken 2,5 đáp đúng (classified: 1 landing kind correct, shouldFail false) |
| B-broken-seek-1.5-observed | OBSERVED | seekElement timeout 1.201 ms, 0 landing, errorAfter 3, ct sau 1,5 — đường timeout như A2 |
| C-audio-release-headed | PASS | ensure true, isReady true, loads 3× loadedmetadata; releases el1 lần 1 true, lần 2 false, element mới true |
| E-seeker-sync-throw-settles-error-headed | PASS | Settled, outcome ok false / cancelled false, classify "error", uncaught mới [] — **đảo ngược kết quả A2 (treo)** |
| E-seeker-async-reject-control | PASS | Outcome ok false / cancelled false, classify "error" |

### 3.3 Vì sao vẫn NOT_MEASURED — và cái gì đã loại trừ được

Đã loại trừ (có số): track audio (lần 1 video-only vẫn không tái
hiện), vị trí moov/faststart (lần 2 byte-identical vẫn không tái
hiện), seek ngay sau loadedmetadata (harness này chờ 3 s sau src
như probe2 rồi mới gán, buffer [0, 3] đầy), server thiếu Range
(harness này hỗ trợ Range thật 206; và đối chứng valid vẫn đúng).
Còn lại, chưa kiểm chứng được (ghi rõ, không đoán thành kết luận):
điều kiện chạy của phiên Y2 không ghi lại — tab mới riêng cho mỗi
probe qua `/json/new` trên Chrome chạy tay (thay vì element mới
trong cùng tab như harness này), cờ khởi động Chrome của phiên đó,
trạng thái giải mã/GPU của phiên đó, hoặc thứ tự probe trong cùng
phiên trình duyệt (Y2 chạy gap-15 trước gap-25 trong cùng process).
Một thử nghiệm scratch chạy đúng `probe2.html` gốc qua tab mới
(`/tmp/b2-probe-y2exact.mjs`, ngoài repo) đã HỎNG ở tầng harness
(trả `undefined` cho cả đối chứng valid do xử lý sessionId sai)
nên **không dùng** — không được trích nó làm bằng chứng theo hướng
nào. Muốn đóng nợ này cần một harness tab-mới chạy đúng, hoặc một
fixture đáp sai khác 0 ổn định cho B2 (hiện chưa có fixture nào).
Cho tới lúc đó: fail-fast Z2/B2 chỉ có bằng chứng Node mock.

## 4. Bằng chứng vòng lặp preview đầy đủ trong app thật (pause46B2-apploop.mjs)

Dist build từ source hiện tại ra `/tmp/b2-app-dist` (vite build
pass 8,36 s; minify nên không đối chiếu được marker comment —
bằng chứng "đúng code" ở đây là build từ source vừa sửa, không
phải dist đóng băng cũ). Seed broken-gap cho đúng assetId/sha Y2
(`a_506f5ab74860f6fe`, 313.311 byte). Ruler: click offset 90 px =
1,5 s (60 px/s, khớp Y2).

| Giai đoạn (broken-gap) | Số thật |
|---|---|
| Settle | sleeping true, lastDrawn 0, lastRequested 0, ticks 7, holdDraw 1 |
| Scrub 1,5 | lastRequested 1,5, pendingSeek true, ticks 65 |
| Cạn cap seek | Sau 17,1 s: ticks 500, sleeping true, seekFailureCount 10, exhausted true, kind `"timeout"`, target 1,5, **seekElementRecreated 1, seekRecreatedSeeking 1** |
| Guard: scrub về đúng lastDrawn 0 | sleeping true, lastRequested 0, count 0, exhausted false, ticks 501 (chỉ +1 — vòng lặp đã ngủ, không tick mãi như bẫy Y2 §5.2) |
| Scrub 2,5 (chỉ quan sát) | lastDrawn 2,5, sleeping true, holdDraw 2 — app vẽ được 2,5 (nhất quán với quirk vắng mặt ở mức element) |

Đối chứng valid-gop trong app: seed sha khác
(`68ed913e…`, 313.311 byte), settle sleeping lastDrawn 0, scrub
1,5 → lastDrawn 1,5, sleeping true, seekFailureCount 0, recreated
0 — không cạn cap, không phục hồi oan. Kết luận §4: 3 sửa Z2 nay
có bằng chứng app-loop: guard scrub (PASS), cap seek → phục hồi
Y2 + hunk gọi releaseElement (PASS qua recreated, còn bản thân
`releaseElement` đã PASS ở mức element §3.2), và fail-fast
seek-landing-0 trong app thì vẫn là OBSERVED (app vẽ 2,5) vì
quirk vắng mặt — không phải PASS fail-fast.

## 5. Quyết định Seeker sync-throw: BỌC thành reject

### 5.1 Hazard (Y2 §5.1, A2 §3 — đã tái hiện trước khi sửa)

`Seeker.request` chạy executor trong callback `setTimeout`. Nếu
executor ném đồng bộ, lỗi thoát khỏi callback thành uncaught,
entry không bao giờ settle (A2 đo: không settle sau 700 ms +
uncaught `a2-sync-boom`). Đường này không đi nhánh error của X2,
không đếm cap, không phục hồi — treo vĩnh viễn. Production caller
duy nhất là executor trong `preview.tsx` (collectActives +
seekAll): `seekAll` không bao giờ reject (bắt lỗi từng element),
nên nguồn ném đồng bộ duy nhất là `collectActives` ném.

### 5.2 Quyết định và lý do (không sửa mù)

**Bọc:** `try { runResult = run(t); } catch { resolve outcome
giống hệt handler rejection }` — tức `ok:false, cancelled =
(gen !== generation)`; với gen hiện tại thì `cancelled:false` →
`classifySeekOutcome = "error"` → cap X2 đếm → cạn cap thì phục
hồi Y2 chạy. Lý do chọn bọc thay vì giữ nguyên:
- Thống nhất ngữ nghĩa với reject bất đồng bộ (Promise constructor
  cũng biến ném đồng bộ thành reject) — không phát minh outcome mới.
- Chỉ đường ném mới đổi: seek thành công / reject async / cancel
  giữ nguyên từng dòng (test hồi quy §2 #10, #11 + suite cũ §8).
- Không dùng `Promise.resolve().then(() => run(t))` để bọc vì sẽ
  đổi thứ tự microtask của mọi seek thường — bọc try/catch giữ
  nguyên thời điểm chạy executor trong cùng callback timer.
- Rủi ro đã xét: một executor ném mà trước đây "treo nhưng app
  vẫn sống nhờ scrub khác hủy request" — nay request đó settle
  thành error và được đếm vào cap; nhưng request bị thay thế sau
  đó vẫn resolve cancelled như cũ (gen khác), và cap chỉ đếm khi
  outcome không bị hủy (nhánh preview kiểm tra `!cancelled`), nên
  không có đường nào đếm oan từ request đã bị thay thế. Scrub
  sang t mới vẫn reset cap như cũ.

### 5.3 Test Y2 cũ đã sửa theo quyết định (ghi rõ để khỏi ngộ nhận)

File `pauseSeekRecovery43Y2.test.ts`: test "Seeker run ném đồng bộ
→ promise KHÔNG settle (hazard)" đã đổi thành "… → settle thành
outcome error (đã sửa ở ROUND46-B2)" với marker giải thích; phần
còn lại của file giữ nguyên. Suite này về **9/9** (trước sửa B2
nó đỏ 1 test — đúng vì hành vi đã đổi có chủ ý). Test khóa đầy
đủ (kèm classify `"error"` + không uncaught) nằm ở `pause46B2`
#9; test headed nằm ở §3.2 hàng E-sync-throw.

## 6. Bài học tsconfig / import đuôi .ts (để luồng sau khỏi lặp lại)

- Import không đuôi (`./pause45A2`) làm **tsc sạch nhưng Node
  strip-types lỗi** `ERR_MODULE_NOT_FOUND` (Node ESM bắt buộc đuôi
  file). Import có đuôi (`./pause45A2.ts`) làm **test Node chạy
  nhưng tsc báo TS5097** cho đúng dòng đó.
- Tiền lệ repo đã giải quyết mâu thuẫn này: `assetStore.ts` và
  `nestedPreview.ts` dùng import đuôi `.ts` kèm `// @ts-ignore`
  có chủ đích + ghi chú giải thích. B2 áp dụng đúng mẫu đó cho
  `seek.ts` — tsc về 0 dòng, test Node vẫn chạy.
- Probe đã chứng minh TS5097 không phải lỗi riêng của seek.ts:
  file probe tạm import đuôi `.ts` cũng báo TS5097 cho mọi dòng
  (kể cả cùng symbol với assetStore) — tức mọi import đuôi `.ts`
  không có `@ts-ignore` đều báo; assetStore/nestedPreview sạch
  nhờ `@ts-ignore`, không nhờ cơ chế nào khác.
- Lưu ý chạy song song: trong lúc B2 chạy, tsconfig.json bị các
  luồng đợt 46 khác sửa cùng lúc (dòng exclude của luồng B4 xuất
  hiện/biến mất giữa các lần chạy tsc) — B2 chỉ thêm đúng 1 dòng
  exclude của mình bằng sửa chính xác 1 dòng, không viết lại file;
  kiểm chứng cuối (§8) xác nhận dòng B2 còn nguyên.

## 7. Kiểm chứng gộp của luồng (số thật)

- Test mới pause46B2: **11/11** (pha đỏ trên code cũ: 6/11).
- Hồi quy (strip-types, trừ pause45A2 chạy esbuild như mẫu A2):
  seek **15/15**, seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2
  **11/11**, pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2
  **9/9** (sau sửa test §5.3), pauseDraw40V3 **11/11**,
  pauseDraw41W2 **13/13**, pause45A2 **14/14** — cộng test mới:
  **111/111, fail 0**.
- `tsc --noEmit` (apps/web): **0 dòng** sau `@ts-ignore` + exclude
  test mới (xem §6; lần chạy giữa chừng từng thấy lỗi của luồng
  khác do sửa song song, kiểm chứng cuối đã sạch).
- `vite build --outDir /tmp/b2-app-dist`: **pass** (8,36 s; cảnh
  báo chunk > 500 kB cũ).
- Headed element lần 2: exit 0, **6 PASS, 0 FAIL, 1 NOT_MEASURED
  (B), 3 OBSERVED** (xem §3.2).
- App-loop broken: **2 PASS** (cap+recovery, guard) + 1 OBSERVED
  (2,5); app-loop valid: **1 PASS** (đối chứng).

## 8. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (3 file):

- `apps/web/src/lib/seek.ts` — nối `WrongLandingTracker` (hunk
  ROUND46-B2: import + thay bộ đếm + bọc Seeker sync-throw; marker
  ROUND44-Z2 giữ nguyên vẹn, ngưỡng 2 giữ nguyên).
- `apps/web/src/lib/pauseSeekRecovery43Y2.test.ts` — 1 test đổi
  theo quyết định §5.3 (marker ROUND46-B2), còn lại giữ nguyên.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude
  `src/lib/pause46B2.test.ts` (theo mẫu các đợt trước).

MỚI (4 file + LIMITS này):

- `apps/web/src/lib/pause46B2.test.ts` — 11 test (§2).
- `apps/web/scripts/pause46B2-headed.mjs` — harness headed
  element (fixture Y2-exact + probe v3 + guard/audio/Seeker).
- `apps/web/scripts/pause46B2-apploop.mjs` — harness app-loop
  (seed + scrub + poll `__vcutPreviewIdle`).
- `docs/PHASE9_ROUND46_B2_PAUSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: preview.tsx, audioEngine.ts, pause45A2.ts,
pauseLoopGuard44Z2.ts, mọi file của luồng khác, paths-loop,
build-loop-log. Scratch harness + fixture + dist tạm ở
`/tmp/pause46b2-headed-*`, `/tmp/b2-app-dist`,
`/tmp/pause46b2-apploop-*` (không vào repo, không vào batch).
Script scratch `/tmp/b2-probe-y2exact.mjs` hỏng ở tầng session
(§3.3) — không vào repo, không dùng làm bằng chứng.

## 9. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed vẫn thiếu** (Z2-b + mở rộng
   B2): fixture nay đã byte-identical với Y2 nhưng quirk vẫn vắng
   mặt trong các phiên Chromium-1248 mới (A2 + B2 ×2). Cần harness
   tab-mới chạy đúng theo probe243 hoặc một fixture đáp sai ổn
   định khác; cho tới lúc đó chỉ trích bằng chứng Node mock.
2. **Quirk đáp sai frame khác 0 headed cũng thiếu** (cùng lý do:
   chưa có fixture nào đáp sai khác 0 ổn định ngoài đời thực;
   mọi landing quan sát được đều đúng hoặc vắng seeked).
3. **Kind `"error"` từ fixture media thật vẫn chưa có**: đường
   Seeker (executor ném → error) nay đã đo headed, nhưng chưa có
   file media thật nào chứng minh làm `collectActives` ném trong
   preview.tsx — đừng claim kind error đã có bằng chứng production
   từ media.
4. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed) — cùng giới hạn như các đợt trước.
5. **Chênh lệch mock vs Chrome thật về releaseElement** (A2 §5.7)
   vẫn đứng: test mock Z2 ghi "sau release update tạo source mới"
   nhưng Chrome thật không tạo lại source cho cùng element; hành
   vi production đúng (dùng element mới) không đổi.
