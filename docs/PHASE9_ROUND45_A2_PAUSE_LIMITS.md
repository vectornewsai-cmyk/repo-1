# Phase 9 đợt 45, luồng A2 — Bằng chứng browser headed cho sửa pause Z2 + phân loại quirk đáp sai frame khác 0 — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). CHỈ tạo/sửa file mang hậu tố 45A2 + LIMITS này.
KHÔNG sửa preview.tsx, store.ts, tsconfig.json, bridge, hay file của
luồng khác — đặc biệt lib mới pause45A2.ts CHƯA nối vào preview.tsx
hay seek.ts (A6 đang sửa preview.tsx; nối là việc của luồng sau, xem
§5). Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi
rõ, không mạo nhận. Số timing chỉ đo trên máy đang chạy song song
nhiều luồng đợt 45 — không dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **(a) Guard Z2 — có bằng chứng headed ở mức helper + điều kiện
   ngủ, CHƯA có ở mức vòng lặp preview đầy đủ.** Trong Chromium
   headed thật, với đúng helper thật (`planDrawnPlayheadRecovery`,
   `pauseTickNeedsRetry`, `seekFailureMaySleep`,
   `pauseRetryMaySleep`): trước guard cả 3 đường seek/vẽ/ngủ đều
   đóng (requestSeek false, needsRetry false, normalSleep false,
   seekCapSleep false, w2CapSleep false); sau guard
   (resetSeekFailure true, lastRequested về 0,1) thì normalSleep
   thành true. Đây là bằng chứng browser cho logic guard, KHÔNG
   phải bằng chứng vòng lặp preview.tsx thật đã ngủ — vòng lặp đầy
   đủ cần project state + điều khiển app, ngoài phạm vi luồng này
   (và bị chặn bởi quy tắc không sửa preview.tsx).
2. **(b) Quirk seek-landing-0 — CHƯA tái hiện được trên browser
   trong đợt này, nên fail-fast Z2 CHƯA có bằng chứng headed.**
   Lần chạy 1 của harness cho PASS giả (xem §2.1 — đã HỦY kết quả
   đó vì đối chứng valid cũng đáp 0). Sau khi sửa server Range +
   gắn element vào DOM, đối chứng valid seek 2,5 đúng (1 lần đáp
   2,5), còn broken-gap seek 2,5 trên element MỚI cũng đáp đúng
   2,5 (52 ms) — quirk không tái hiện. Thử thêm giả thuyết "element
   đã hỏng bởi seek 1,5 trước đó" cũng KHÔNG tái hiện: raw gán 2,5
   sau damage không bắn `seeked` nào trong 5 s (không phải
   `seeked@0`), seekElement sau đó timeout 1201 ms vì element còn
   `seeking = true` (luật N1: đang seeking thì chỉ chờ, không gán).
   Bằng chứng Node mock của Z2 (fail nhanh đúng 3 lần gán) vẫn đứng
   nguyên; chỉ là bằng chứng headed vẫn thiếu. Nguyên nhân có thể
   nhất: fixture đợt này khác fixture Y2 (có track audio sine nên vị
   trí packet lệch: 108.574–218.536 so với 101.878–206.286 của Y2),
   và/hoặc điều kiện probe Y2 (element chưa buffer đầy, chuỗi seek
   khác) không được tái tạo đúng. Cần luồng sau tái tạo đúng fixture
   Y2 (video-only, cùng tham số encode) + đúng chuỗi probe v3 rồi
   mới đo lại — không được trích "B PASS" từ lần chạy 1.
3. **(c) Rò AudioEngine — có bằng chứng headed.** Trong Chromium
   headed thật, `releaseElement` trên element đã update: lần 1 true,
   lần 2 false; element MỚI cùng src sau đó update + release true
   (đúng chu trình production: pool drop element cũ → tạo element
   mới). Quan sát thêm: element CŨ sau release + update lại thì
   release tiếp trả false — tức trên Chrome thật, source không được
   tạo lại cho cùng element (Web Audio chỉ cho
   `createMediaElementSource` 1 lần / 1 element / 1 context; lỗi bị
   `nodeFor` bắt và trả null). Khác với test mock Z2 ghi "sau
   release update tạo source mới" — mock cho phép tạo lại, Chrome
   thật không; hành vi production đúng vẫn là dùng element mới, nên
   kết luận Z2 không đổi, chỉ cần đọc test mock đó với chú thích
   này.
4. **Kind `"error"` — vẫn CHƯA có bằng chứng production, và nay có
   thêm 3 bằng chứng headed về VÌ SAO.** (i) Executor reject tổng
   hợp trong browser cho đúng outcome `{ok:false, cancelled:false}`
   → `classifySeekOutcome` = `"error"` (chuỗi phân loại chạy đúng
   trên browser). (ii) Không fixture lỗi production nào đi nhánh
   này: empty/garbage → seek timeout (không reject); mpeg4 → seek
   "thành công giả" (seeked true, ct báo 1,5, rs 4 dù không decode
   được — đúng mẫu Y2 §1.2: needsSeek thấy đã đúng target nên kết
   luận xong, rồi nhánh vẽ skip → cap W2). (iii) Hazard sync-throw
   tái hiện
   đúng trên browser: executor ném đồng bộ → promise không settle
   sau 700 ms + uncaught `a2-sync-boom` bắt được — tức đường này
   treo chứ không đi nhánh error. Nợ kind `"error"` vẫn mở, cần một
   đường production reject thật (hoặc sửa hazard Seeker ở luồng
   riêng, ngoài phạm vi A2).
5. **Quirk đáp sai frame khác 0 — đã có lib phân loại thuần +
   test xanh, CHƯA nối vào seek.ts, CHƯA có fixture tái hiện.**
   `pause45A2.ts` mở rộng Z2: mọi đáp sai liên tiếp (0 hay khác 0)
   đều đếm, fail ở lần thứ 3 (ngưỡng mirror Z2 = 2), seek về 0 có
   chủ ý không bao giờ tính là quirk, đổi target reset streak.
   Test 14/14. Trên headed, landings quan sát được ở broken-gap đều
   là đáp đúng (2,5) hoặc không có `seeked` (1,5 timeout) — tức
   chưa có lần đáp sai khác 0 nào ngoài đời thực để phân loại thử;
   phân loại headed chỉ mới chạy trên landings đúng (kind correct).

## 1. Lib mới pause45A2.ts (chưa nối — đọc kỹ trước khi nối)

- `frameIndex45A2(t, fps)` — mirror đúng quy ước `frameIndexOf`
  của seek.ts (Math.round(t × fps), t ≤ 0 → 0), viết lại tại chỗ
  để lib không kéo @repo-1/video-spec, bundle độc lập cho cả test
  Node lẫn trang headed.
- `classifySeekLanding(landedFrame, targetFrame)`:
  target 0 → `"intentional-zero"` (không bao giờ là quirk);
  đáp = target → `"correct"`; đáp 0, target > 0 → `"zero-landing"`;
  còn lại → `"wrong-landing"`.
- `nextWrongLandingState(prev, landed, target, maxRetries = 2)` +
  class `WrongLandingTracker`: đếm đáp sai LIÊN TIẾP; đáp đúng
  hoặc intentional-zero reset về 0; đổi target reset streak cũ;
  đáp sai đổi frame mỗi lần vẫn cộng dồn (tiêu chí fail là "không
  tới được target", không phải "đáp đúng một frame sai cố định");
  `shouldFail` khi vượt ngưỡng (lần sai thứ 3 với ngưỡng mặc định).
- Hằng `SEEK_WRONG_LANDING_MAX_RETRIES = 2` mirror đúng
  `SEEK_ZERO_LANDING_MAX_RETRIES` của Z2 (1–2 lần sai thoáng qua
  vẫn được thử lại, không fail vội).
- Giới hạn ghi rõ trong file: tracker không fail seek target frame
  0 đáp lệch sang frame khác (Z2 cũng không xử lý; `attempt()` của
  seek.ts kết thúc sớm khi đã ở đúng frame 0 nên đường này hiếm);
  và lib chỉ phân loại — seek.ts hiện tại vẫn chỉ fail nhanh cho
  đáp 0, chưa fail nhanh cho đáp sai khác 0.

## 2. Harness headed pause45A2-headed.mjs — cách chạy + 3 lần chạy

### 2.1 Lần chạy 1 — PASS GIẢ, ĐÃ HỦY (bài học server Range)

- Kết quả lần 1: A PASS, B PASS (broken 2,5 đáp 0 × 3, fail nhanh
  29 ms), C PASS, E1/E3 PASS — nhưng đối chứng valid cũng đáp 0
  × 3 và fail (484 ms), tức server harness có lỗi: server trả 200
  toàn file dù gắn header `Accept-Ranges` mà không xử lý header
  `Range` của Chrome, nên Chrome không seek được trên cả file lành.
  **Kết quả B lần 1 vô hiệu, không được trích dẫn.** Harness đã
  sửa: server xử lý Range thật (206 + Content-Range) + gắn element
  video vào DOM (kèm debug buffered/seekable/errorAfter cho mỗi
  lần seek). Lần 2 và 3 dưới đây chạy sau sửa này.
- Fixture (tái tạo đúng phương pháp Y2 §3.1, ffprobe JSON có tên
  trường, không dùng CSV): valid testsrc2 640×360 3 s 30 fps GOP
  30 + sine 440 Hz; broken-gap zero đúng 30 packet có pts trong
  [1,0, 2,0): 104.408 byte, vị trí 108.574–218.536, tổng 342.344
  byte — trùng số packet/byte của Y2 nhưng lệch vị trí (Y2:
  101.878–206.286), nhiều khả năng do track audio làm lệch layout
  packet. Đây là ứng viên số 1 cho việc quirk không tái hiện (§0.2).
- Cách chạy: `node apps/web/scripts/pause45A2-headed.mjs` từ gốc
  repo. Script tự bundle source hiện tại ra scratch /tmp (không
  dùng dist đóng băng: dist strip comment nên không đối chiếu được
  hunk marker ROUND44-Z2, và không chứng minh được dist chứa đúng
  code Z2 hiện tại), tự bật Xvfb riêng + Chromium Playwright
  (`chromium-1248`) qua CDP pipe, tự dọn profile khi xong.
  Fixture/scratch ở /tmp, không vào repo, không vào batch.

### 2.2 Lần chạy 3 (lần cuối, số liệu chuẩn) — exit 0, 5 PASS, 1 NOT_MEASURED, 3 OBSERVED

| Kiểm tra | Kết quả | Số thật |
|---|---|---|
| A-guard-drawn-playhead-headed | PASS | Trước guard: requestSeek false, needsRetry false, normalSleep false, seekCapSleep false, w2CapSleep false. Recovery: resetSeekFailure true, lastRequested 0,1. Sau: normalSleep true, needsRetry false |
| CONTROL-valid-seek-2.5 | PASS | loadedmetadata, buffered/seekable [0, 3], 1 landing ct 2,5 rs 4, seeked true, 274 ms |
| B-zero-landing-fail-fast-headed | NOT_MEASURED | Broken element mới seek 2,5: 1 landing ct 2,5, seeked true, 52 ms — quirk không tái hiện nên không đo được fail-fast (xem §0.2) |
| B2-broken-seek-1.5-observed | OBSERVED | seekElement timeout 1200 ms, 0 landing, error code 3 sau seek, ct 1,5 — đúng chữ ký GOP hỏng của Y2 §3.1 nhưng qua đường timeout, không qua đáp sai |
| B-raw-damaged-element-zero-landing | OBSERVED | Trước raw: ct 1,5, seeking true, rs 1, err 3. Raw gán 2,5: 0 seeked trong 5 s, sau đó ct 2,5 nhưng seeking vẫn true, rs 1, err 3. seekElement 2,5 sau đó: timeout 1201 ms, 0 landing — giả thuyết "element đã hỏng thì quirk xuất hiện" KHÔNG đúng trong lần chạy này |
| C-audio-release-headed | PASS | ensure true, isReady true, loads 3× loadedmetadata; releases: el1 lần 1 true, lần 2 false, element mới true, el cũ sau release + update lại false |
| E1-kind-error-synthetic-reject-headed | PASS | Seeker executor reject → outcome ok false, cancelled false → classify "error" |
| E2-kind-error-production-fixtures | OBSERVED | empty/garbage: load error code 4 DEMUXER_ERROR_COULD_NOT_OPEN, seek timeout, không reject, ct sau 1,5, rs 0. mpeg4: loadedmetadata (duration 3), seek "thành công giả" (seeked true, ct sau 1,5, rs 4), không reject — đi nhánh vẽ/W2 như Y2 §1.2, không đi kind error |
| E3-seeker-sync-throw-hang-headed | PASS | Executor ném đồng bộ → promise không settle sau 700 ms + uncaught "a2-sync-boom" bắt được |

Lần chạy 2 cho cùng kết luận B NOT_MEASURED (broken 2,5 đáp đúng
2,5, 113 ms; control 823 ms); lần 3 là lần chuẩn có thêm bước raw
sau damage. Không chạy lại lần 4: 2 lần liên tiếp cùng kết quả đã
đủ để kết luận "quirk không tái hiện trong điều kiện này", chạy
thêm không đổi kết luận mà chỉ tốn lượt.

### 2.3 Vì sao không chạy qua app/dist đóng băng (ghi rõ giới hạn)

- Dist đóng băng không chứng minh được chứa code Z2 (comment
  marker đã strip), nên harness bundle source hiện tại thay thế —
  vẫn là Chromium thật, đúng code thật, nhưng ở mức element/helper
  chứ không phải vòng lặp preview.tsx đầy đủ.
- Vòng lặp preview đầy đủ cần: project có clip broken-gap, scrub
  qua store tới t cạn cap, rồi scrub về t đã vẽ, rồi đọc
  `PreviewIdleDebug` qua nhiều tick. Luồng A2 không làm bước này
  vì (i) cần điều khiển app qua CDP + state store, vượt phạm vi
  "bằng chứng cho 3 sửa" trong một luồng, và (ii) quy tắc luồng
  cấm sửa preview.tsx (A6 đang sửa) — nhưng việc ĐO (không sửa)
  vòng lặp đầy đủ vẫn là nợ mở cho luồng đo riêng (§5.1).

## 3. Thử tái hiện kind "error" — điều kiện đã thử, kết quả, vì sao chưa bắt được

Đã thử (tất cả trên Chromium headed thật, cùng harness §2):

1. **Fixture lỗi thật, qua seekElement trực tiếp:** empty 0 byte,
   garbage 1024 byte, mpeg4-unsupported — không fixture nào làm
   seekElement reject (seekElement bắt lỗi từng element theo thiết
   kế, promise luôn resolve). Empty/garbage đi đường timeout;
   mpeg4 đi đường "thành công giả" (seeked true, ct 1,5 — xem §2.2).
   Không fixture nào chạm tới Seeker executor reject → không chạm
   kind `"error"`.
2. **Executor reject tổng hợp (không phải production):** Seeker
   với run trả rejected promise → outcome đúng
   `{ok:false, cancelled:false}` → classify `"error"`. Chứng minh
   chuỗi phân loại + đếm chạy đúng trên browser; chỉ thiếu đường
   production nào đó reject thật.
3. **Executor ném đồng bộ (hazard Y2 §1.3):** tái hiện đúng trên
   browser — promise treo sau 700 ms, lỗi thành uncaught. Tức
   đường "ném đồng bộ" không phải là đường tới kind `"error"` mà
   là đường treo; sửa nó (bọc try/catch trong Seeker để reject thay
   vì treo) chính là cách tạo ra đường production tới kind error —
   nhưng đó là đổi ngữ nghĩa shared code, cần luồng riêng + đo
   không phá hội tụ seek thường, ngoài phạm vi A2.

Kết luận: kind `"error"` vẫn chỉ khóa bằng unit test + chuỗi phân
loại chạy trên browser; chưa có bằng chứng production nào đi nhánh
này. Đừng claim đã đo nó.

## 4. Kiểm chứng gộp của luồng (số thật)

- Test mới pause45A2 (esbuild bundle --format=esm, theo task):
  **14/14 PASS, fail 0** — pha đỏ trước: bundle lỗi resolve
  `./pause45A2.ts` khi lib chưa tồn tại (ghi rõ để khỏi ngộ nhận
  test viết sau code). Lệnh chạy:
  `node_modules/.bin/esbuild apps/web/src/lib/pause45A2.test.ts
  --bundle --platform=node --format=esm --outfile=/tmp/pause45A2.test.mjs
  && node /tmp/pause45A2.test.mjs`.
- Harness headed lần 3: exit 0, **5 PASS, 0 FAIL, 1 NOT_MEASURED
  (B), 3 OBSERVED (B2, B-raw, E2)** — xem bảng §2.2. Lưu ý: exit 0
  của harness nghĩa là "harness chạy xong, không có kiểm tra FAIL",
  KHÔNG nghĩa là mọi sửa Z2 đã có bằng chứng headed (B vẫn thiếu).
- Hồi quy: KHÔNG chạy lại suite Z2/Y2 trong luồng này (không sửa
  code sản phẩm nào nên không có hồi quy để chạy; test mới chỉ
  import lib mới thuần, không import seek.ts/audioEngine.ts).
- tsc: `tsc --noEmit` ở apps/web, grep riêng file 45A2: đúng 1
  lỗi, chỉ ở file test — `src/lib/pause45A2.test.ts(18,8): error
  TS5097` (import path kết thúc bằng `.ts` khi chưa bật
  allowImportingTsExtensions; cùng họ lỗi với các file test khác
  nên chúng mới nằm trong exclude). Lib `pause45A2.ts`: 0 lỗi
  (kiểm tra độc lập bằng tsc trực tiếp trên file cũng sạch).
  Luồng này KHÔNG sửa tsconfig.json theo quy tắc file, nên parent
  gộp cần thêm 1 dòng exclude cho `src/lib/pause45A2.test.ts`
  (xem §5.4) thì tsc mới sạch hoàn toàn cho đợt này.

## 5. Nợ mở (không mạo nhận đã xong)

1. **Bằng chứng headed cho fail-fast seek-landing-0 (sửa Z2-b) vẫn
   thiếu.** Cần tái tạo đúng fixture Y2 (nghi ngờ chính: bản Y2
   video-only hoặc tham số encode khác — vị trí packet lệch) +
   đúng chuỗi probe v3 của Y2 (thứ tự seek, trạng thái buffer lúc
   seek), rồi đo lại. Cho tới lúc đó, sửa Z2-b chỉ có bằng chứng
   Node mock.
2. **Bằng chứng vòng lặp preview đầy đủ cho cả 3 sửa Z2 vẫn thiếu**
   (guard ngủ thật, fail-fast trong app, số node không tăng qua
   nhiều lần cạn cap trong app). Cần luồng đo riêng điều khiển app
   qua CDP + đọc PreviewIdleDebug; A2 chỉ đo tới mức helper/element.
3. **Quirk đáp sai frame khác 0 chưa có fixture tái hiện + chưa
   nối vào seek.ts.** Lib phân loại đã sẵn sàng (ngưỡng 2, phân
   biệt intentional-zero, reset theo target/đáp đúng); luồng nối
   cần: thay zeroLandingCount trong seek.ts bằng WrongLandingTracker
   (giữ ngưỡng 2), đo seek thường không fail oan, và tìm fixture
   đáp sai khác 0 ổn định để đo headed (hiện mọi landing quan sát
   được đều đúng hoặc vắng seeked, không có đáp sai khác 0).
4. **tsconfig cho file test mới:** A2 không được sửa tsconfig.json
   nên `src/lib/pause45A2.test.ts` chưa có dòng exclude theo mẫu
   các đợt trước — parent gộp thêm 1 dòng exclude khi gộp batch
   (lỗi hiện tại chỉ là TS5097 ở dòng import `.ts` của file test,
   lib thì sạch — xem §4).
5. **Kind `"error"` production + hazard Seeker sync-throw:** vẫn
   mở như §3 — cần luồng riêng quyết định có bọc executor Seeker
   để ném đồng bộ thành reject (tạo đường tới kind error) hay giữ
   nguyên, kèm đo hội tụ seek thường.
6. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed) — cùng giới hạn như các đợt trước.
7. **Chênh lệch mock vs Chrome thật về releaseElement:** test mock
   Z2 ghi "sau release update tạo source mới" nhưng Chrome thật
   không tạo lại source cho cùng element (release sau đó false).
   Hành vi production đúng (dùng element mới) không đổi, nhưng
   luồng nào đọc lại test Z2 cần chú thích này để khỏi hiểu sai.

## 6. File đổi/thêm (text, không binary, không dist — parent gộp batch)

MỚI (3 file code/harness + LIMITS này):

- `apps/web/src/lib/pause45A2.ts` — phân loại quirk đáp sai
  (classifySeekLanding, nextWrongLandingState,
  WrongLandingTracker, SEEK_WRONG_LANDING_MAX_RETRIES).
- `apps/web/src/lib/pause45A2.test.ts` — 14 test (§4).
- `apps/web/scripts/pause45A2-headed.mjs` — harness headed
  (fixture + bundle + Xvfb/CDP + 9 kiểm tra A/CONTROL/B/B2/B-raw/
  C/E1/E2/E3).

KHÔNG ĐỔI: preview.tsx, store.ts, tsconfig.json, bridge, seek.ts,
audioEngine.ts, mọi file của luồng khác, paths-loop,
build-loop-log. Scratch harness + fixture + output JSON ở
`/tmp/pause45a2-headed-<pid>/` và `/tmp/pause45a2-headed-out*.txt`
(không vào repo, không vào batch). Lần chạy 1 (PASS giả do server
thiếu Range) đã hủy kết quả B, chỉ giữ làm bài học §2.1 — không
đưa vào batch hay trích dẫn.
