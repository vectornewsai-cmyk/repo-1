# Phase 9 đợt 44, luồng Z2 — Pause recovery: ngủ/branch guard + seek-landing-0 + rò AudioEngine — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). File dùng chung chỉ thêm hunk có marker
`// ROUND44-Z2`, không reformat. Mọi số dưới đây đều đo/chạy thật;
chỗ nào chưa đo được thì ghi rõ, không mạo nhận. Số timing chỉ đo
một lần trên máy đang chạy song song nhiều luồng đợt 44 — không dùng
làm baseline quiet hay claim fps.

## 0. Kết luận ngắn

1. **(a) Lỗi ngủ/branch guard TÁI HIỆN ĐƯỢC + ĐÃ SỬA.** Sau khi cạn
   cap ở t_bad, scrub về đúng t đã vẽ (t_old = lastDrawn) thì cả 3
   đường seek/vẽ/ngủ đều đóng — vòng lặp tick mãi không làm việc gì
   (đúng dấu vết Y2 §3.4: ticks 502 → 1699 trong 60 s). Sửa bằng guard
   khôi phục thuần `planDrawnPlayheadRecovery`: khi playhead đúng bằng
   lastDrawn mà cap còn cạn ở t khác thì reset cap đó + căn
   lastRequested về playhead để đường ngủ thường xét đúng.
2. **(b) Quirk seek-landing-0 TÁI HIỆN ĐƯỢC + ĐÃ SỬA.** Mock element
   đáp `seeked` ở currentTime 0 cho target 2,5 thì `seekElement` cũ
   lặp gán mãi không resolve (test chạm race-timeout 5 s, tiến trình
   test còn treo tới khi bị `timeout` kill — đúng cơ chế treo). Sửa:
   đáp 0 liên tiếp quá 2 lần thử lại thì kết luận failed
   (seeked:false, timedOut:false) để preview đi nhánh vẽ → cap W2
   đếm skip → ngủ có kiểm soát. Seek về 0 có chủ ý không bị ảnh
   hưởng (target frame = 0 thì nhánh này không kích).
3. **(c) Rò AudioEngine là THẬT + ĐÃ SỬA.** Audit cho thấy
   `AudioEngine.nodes` Map giữ element + chuỗi node, còn
   `MediaElementAudioSourceNode` thì không được lưu nên không ngắt
   được; `MediaPool.dropElement` không có đường nào gỡ chúng, và
   `dispose()` toàn cục là nơi duy nhất xóa Map (đóng context thì
   graph mới tan). Mỗi lần cạn cap rò 5 node/clip active. Sửa: lưu
   `src` vào record + thêm `releaseElement(el)` (ngắt cả 5 node, gỡ
   khỏi Map), gọi trong vòng drop của Y2 ở preview.tsx.

## 1. Việc (a) — Tái hiện, sửa, và những gì KHÔNG đổi

### 1.1 Tái hiện (trước sửa)

Mô hình vòng lặp cũ dùng đúng helper thật (`pauseTickNeedsRetry`,
`pauseRetryMaySleep`, `seekFailureMaySleep`) với trạng thái sau cạn
cap seek ở 1,5 (`lastDrawn` 0,1, `lastRequested` 1,5, `pendingSeek`
false, `seekFailureExhausted` true, target 1,5), playhead scrub về
0,1 — kết quả: `requestsSeek` false, `needsRetry` false, `canSleep`
false. Cùng kết quả với trạng thái cạn cap W2 (`pauseRetryExhausted`
true, `seekFailureExhausted` false). Đây là bằng chứng logic, chạy
bằng Node (script tái hiện ở /tmp, không vào repo); bằng chứng
browser cho trạng thái kẹt đã có sẵn ở Y2 §3.4 (không chạy lại
headed trong luồng này — xem §5 nợ mở).

Cơ chế đủ 3 điều kiện đóng cùng lúc (đọc code preview.tsx, không
đoán): nhánh request-seek đòi `t !== lastDrawn` (0,1 === 0,1 nên
trượt, kéo theo cả reset cap nằm trong nhánh đó cũng không chạy);
nhánh vẽ lại `pauseTickNeedsRetry` đòi `t === lastRequested`
(0,1 !== 1,5 nên trượt); `scheduleNext` đòi `lastRequested ===
playhead` ở cả đường ngủ thường lẫn 2 đường ngủ kiểu bỏ cuộc
(1,5 !== 0,1 nên trượt).

### 1.2 Sửa (preview.tsx + lib mới, hunk nhỏ có marker)

- `apps/web/src/lib/pauseLoopGuard44Z2.ts` (mới): hàm thuần
  `planDrawnPlayheadRecovery(state, playhead)` — trả kế hoạch reset
  (cap seek / cap W2 / cả hai + `lastRequested` mới = playhead) hoặc
  null. Điều kiện kích: `playhead === lastDrawn`, không có seek bay
  (`pendingSeek` false), và có cap cạn ở t khác (seek: target cạn
  khác null và khác playhead; W2: `lastRequested` khác null và khác
  playhead). Trả null — giữ nguyên mọi trạng thái — khi: đang ở
  chính t đã cạn (giữ hành vi bỏ cuộc của X2/W2), chưa cạn cap nào,
  đang có seek bay, chưa từng vẽ (`lastDrawn` null), hoặc target cạn
  là null (trạng thái không nhất quán).
- `preview.tsx`: gọi guard ngay trước nhánh request-seek trong nhánh
  pause (sau khối justPaused/redrawFlag), áp kế hoạch: reset đúng
  phần cap tương ứng (+ số đếm phục hồi Y2 khi reset phần seek) và
  gán `lastRequested = playhead`. Sau đó `scheduleNext` xét đường
  ngủ thường đúng (`playhead === lastDrawn && lastRequested ===
  playhead`) nên vòng lặp ngủ yên thay vì tick mãi.
- Hệ quả phụ có lợi, đã khóa bằng test: sau khi ngủ yên ở t_old,
  scrub tiếp về t_bad sẽ đi nhánh request-seek mới (vì
  `lastRequested` đã về t_old) trên element mới mà Y2 đã drop/tạo
  lại — tức t_bad được thử lại có kiểm soát thay vì kẹt vĩnh viễn ở
  đẳng thức `lastRequested === t_bad` cũ. Guard áp xong thì lần xét
  sau trả null (trạng thái đã nhất quán), không dao động.
- KHÔNG đổi: điều kiện ngủ thường, 2 đường ngủ kiểu bỏ cuộc, cap
  X2/W2, logic reset cap trong nhánh request-seek/justPaused/
  redrawFlag/nhánh vẽ, nhánh playing. Đặc biệt: scrub về ĐÚNG t đã
  cạn mà không qua t đã vẽ nào khác (playhead vẫn là t_bad, loop
  đang ngủ ở đó, store không đổi giá trị nên không đánh thức vòng
  lặp) vẫn giữ trạng thái bỏ cuộc như X2 §6.4 đã ghi — đó là hành
  vi đã định, không phải bug này.

## 2. Việc (b) — Quirk seek-landing-0

### 2.1 Tái hiện (trước sửa)

Mock element mô phỏng đúng quirk Y2 §3.4 trên broken-gap: gán
`currentTime = 2,5` nhưng `seeked` bắn khi `currentTime` vẫn 0, lặp
lại mỗi lần gán. `seekElement` cũ: listener `seeked` gọi `attempt()`
→ `needsSeek` (0 vs 2,5) đúng → gán lại 2,5 → `seeked` ở 0 → lặp mãi.
Timer 1200 ms không bao giờ cháy vì `seeked` cứ tới và xóa timer,
nên `seekAll` không bao giờ resolve, `pendingSeek` kẹt true, vòng
lặp không ngủ. Test đỏ trước sửa: 2 test quirk chạm race-timeout
5 s (fail rõ ràng), các test đối chứng vẫn xanh, và tiến trình test
không tự thoát (vòng lặp gán vẫn chạy nền) tới khi bị `timeout`
kill — chính là chữ ký treo, không phải lỗi cách chạy.

### 2.2 Sửa (seek.ts, hunk nhỏ có marker)

- Hằng mới `SEEK_ZERO_LANDING_MAX_RETRIES = 2`.
- Trong `seekElement`, closure thêm `zeroLandingCount` +
  `assigned` (đánh dấu lần seek này đã tự gán `currentTime`, để
  `seeked` của seek CŨ đang bay khi vào — chưa gán gì — không bị
  tính oan). Trong listener `seeked`, trước khi gọi `attempt()`:
  nếu đã gán, element không còn seeking, frame đáp = 0 trong khi
  frame target > 0 thì đếm; vượt 2 lần thử lại (tức lần đáp 0 thứ 3)
  thì `finish(false, false)` — failed, không timedOut. Đáp ở frame
  khác 0 thì reset đếm về 0 (chỉ đếm đáp 0 LIÊN TIẾP).
- Phân biệt với seek về 0 có chủ ý bằng 2 lớp: (i) target frame = 0
  thì nhánh này không kích (`targetFrame > 0` mới tính); (ii) seek
  tới 0 khi element đã ở 0 còn finish sớm ở đầu `attempt()` (không
  seeking, không needsSeek) trước khi tới listener. Đáp 0 một lần
  rồi đáp đúng vẫn seek được (test thoáng qua: 2 lần gán, seeked
  true) — ngưỡng 2 lần thử lại là để không fail vội vì thoáng qua.
- Hướng đi sau khi fail: `seekAll` đếm failed 1 (không timedOut) →
  preview đi nhánh vẽ (failed-only, theo phân loại X2) → render
  skip → cap W2 đếm → ngủ kiểu bỏ cuộc W2. Tức quirk này từ nay
  thuộc về W2 (đường đã có cap), không còn treo ở tầng seek.
- KHÔNG đổi: logic attempt/N1 (chỉ chờ khi seeking, kiểm tra lại
  sau seeked), timeout 1200 ms, debounce Seeker, phân loại
  `classifySeekOutcome`. Quirk đáp sai ở frame khác 0 (vd seek 2,5
  đáp 1,0 mãi) KHÔNG thuộc phạm vi này — chưa quan sát được, xem
  §5 nợ mở.

## 3. Việc (c) — Audit AudioEngine node lifecycle quanh dropElement

### 3.1 Audit (đọc code, khớp test mock)

Các node đã kiểm tra, từng cái một:

- `MediaElementAudioSourceNode` (src): tạo trong `nodeFor`, nối
  `src → low`, nhưng KHÔNG được lưu vào record — trước sửa không có
  cách nào ngắt riêng nó. **Rò thật.**
- `BiquadFilterNode` low/high, `DynamicsCompressorNode` comp,
  `GainNode` gain: lưu trong `nodes` Map (key = element) nhưng
  không có API gỡ riêng — chỉ `dispose()` xóa Map (kèm `ctx.close()`
  nên graph toàn cục mới tan). **Rò thật khi drop từng element.**
- `master GainNode`, `AnalyserNode`: thuộc graph toàn cục, không
  gắn với element, không rò theo drop — không đụng.
- `levelBuf`: buffer VU, không gắn element — không rò.
- Đường fallback (chưa `ensure()`): `update()` chỉ gán `el.volume`,
  không tạo node — `releaseElement` trả false, không có gì để gỡ.
- `MediaPool.dropElement`: pause + gỡ src + `load()` + xóa khỏi
  map videos/audios/videoItems — đúng, nhưng không chạm AudioEngine
  (pool không biết engine) nên node cũ còn nguyên. Element cũ còn
  bị giữ bởi key Map (strong ref) + listener `error` proxy-fallback
  gắn trên element video — tức cả element cũng không được GC.
- Số lượng rò: mỗi element bị drop = 5 node (src + low + high +
  comp + gain) + 1 element; giới hạn bởi số lần cạn cap × số clip
  active ở t cạn (đường hiếm, nhưng rò thật và tăng đơn điệu — sau
  nhiều lần cạn cap trên phiên dài, graph tích lũy node im lặng).

### 3.2 Sửa (audioEngine.ts + preview.tsx, hunk nhỏ có marker)

- `audioEngine.ts`: record trong `nodes` Map thêm trường `src`
  (MediaElementAudioSourceNode); thêm `releaseElement(el): boolean`
  — ngắt cả 5 node (`src/low/high/comp/gain`, mỗi lần `disconnect()`
  bọc try/catch) rồi xóa khỏi Map; trả false khi element chưa có
  node hoặc đã release (lần 2 không disconnect thêm). Sau release,
  `update()` lại với element MỚI (khác object, do pool tạo lại)
  tạo source mới — đúng vì Web Audio chỉ cho
  `createMediaElementSource` 1 lần / 1 element / 1 context, và
  element cũ không bao giờ được dùng lại sau drop.
- `preview.tsx`: trong vòng drop của Y2, ngay sau khi
  `pool.dropElement(el)` trả true thì gọi `engine.releaseElement(el)`
  (`engine` là AudioEngine của tick này, cùng instance engineRef
  suốt phiên). Chỉ gọi ở điểm vòng lặp đã ngủ vì cạn cap, không còn
  seek bay — không cắt ngang seek/audio đang chạy. Element video
  cũng có node (audio kế thừa qua engine, xem `collectActives`) nên
  gọi cho mọi element bị drop, không chỉ audio.
- KHÔNG đổi: `dispose()` (đóng context toàn cục vẫn đúng),
  `nodeFor` (chỉ thêm lưu src), `update()`/`setMasterVolume`/
  `pumpLevel`, thứ tự chuỗi FX.

## 4. Kiểm chứng gộp của luồng (số thật)

Chạy từ gốc repo bằng Node type-stripping (không cần browser, không
cần bundler — đúng cách chạy mà task dặn; `node --test` trực tiếp
hay lỗi resolve import không đuôi `.ts` là lỗi cách chạy, không
phải code):

- Test mới Z2 — **21/21, fail 0**:
  - `pauseLoopGuard44Z2`: **11/11** (2 tái hiện mô hình cũ + 7 guard
    thuần + 2 mô hình vòng lặp mới).
  - `seekZeroLanding44Z2`: **5/5** (quirk fail nhanh đúng 3 lần gán
    + quirk qua seekAll failed 1 + thoáng qua đáp đúng + đối chứng
    seek thường + seek về 0 có chủ ý).
  - `audioEngine44Z2`: **5/5** (element lạ → false, trước ensure →
    false, release ngắt 5 node + lần 2 false, sau release update tạo
    source mới, release 1 element không đụng element khác).
- Chạy lại test Y2 cũ: `pauseSeekRecovery43Y2` **9/9**.
- Hồi quy suite liên quan (cùng cách chạy): `pauseDraw41W2`
  **13/13**, `pauseDraw40V3` **11/11**, `holdFrame` **13/13**,
  `seek` **15/15**, `pauseSeekCap42X2` **22/22**,
  `reversePlaybackRound39T6` **10/10** — tổng với test mới + Y2:
  **114/114, fail 0**. (Riêng `seek` 15/15 quan trọng: listener
  seeked đã sửa không phá hành vi seek thường của N1.)
- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file Z2** (preview.tsx,
  seek.ts, audioEngine.ts, pauseLoopGuard44Z2.ts, tsconfig). Toàn
  bộ output chỉ còn lỗi ở file test của luồng khác đang làm dở
  trong đợt 44 (Z3/Z4 — không đụng, parent gộp sau).
- `vite build --outDir` tạm (không đụng `apps/web/dist`):
  **pass** (27,08 s, một lần đo, không làm baseline); cảnh báo chunk
  > 500 kB cũ, không mới.
- Pha đỏ trước sửa (ghi rõ để khỏi ngộ nhận test viết sau code):
  guard test lỗi import (lib chưa tồn tại); audio test 0/5
  (`releaseElement is not a function`); seek test 3/5 với 2 test
  quirk chạm race-timeout 5 s + tiến trình treo tới khi bị kill.
  Một lỗi cú pháp của chính test seek (parameter property, strip-types
  không hỗ trợ — đúng cảnh báo trong seek.ts) đã sửa ở test trước
  khi chạy pha đỏ, không phải lỗi code sản phẩm.

## 5. Nợ mở (không mạo nhận đã xong)

1. **Kind `"error"` trên browser vẫn chưa có bằng chứng** (nợ Y2 §5.1,
   giữ nguyên): nhánh này chỉ tới được khi executor Seeker reject
   thật, mà production hiện không có đường nào reject thật; hazard
   Seeker treo khi run ném đồng bộ vẫn còn (đã khóa bằng test Y2,
   chưa sửa — ngoài phạm vi Z2).
2. **Chưa có bằng chứng browser cho cả 3 sửa của đợt này.** Toàn bộ
   chứng cứ là test Node thuần + mô hình vòng lặp (điều kiện y hệt
   preview.tsx) + audit code. Cần một lượt headed với fixture
   broken-gap để đo: (a) scrub 1,5 → cạn cap → scrub về 0,1 thì vòng
   lặp ngủ (ticks dừng) thay vì tick mãi; (b) scrub tới vùng đáp 0
   thì seek kết thúc failed thay vì `pendingSeek` kẹt true; (c) số
   node AudioContext không tăng sau mỗi lần cạn cap (đo qua CDP,
   chưa có harness đếm node — harness hiện tại chỉ đọc
   `PreviewIdleDebug`, không đọc graph Web Audio). Chưa đo vì luồng
   này không được giao chạy browser; parent/luồng đo riêng cần làm
   trước khi claim "đã sửa trên browser thật".
3. **Quirk đáp sai ở frame khác 0 chưa xử lý**: seek tới 2,5 mà
   `seeked` đáp mãi ở 1,0 (khác 0) thì vòng lặp gán trong seekElement
   vẫn lặp vô hạn như cũ — chưa quan sát được trên fixture nào nên
   không bịa ngưỡng; nếu user báo seek treo mà không phải đáp 0 thì
   đo riêng rồi mới thêm nhánh.
4. **Safari / máy thật chưa đo** (toàn bộ trên logic Node + code
   Chrome đã biết) — cùng giới hạn như các đợt trước.
5. **Xung đột file chung với luồng đợt 44 khác**: preview.tsx,
   seek.ts, audioEngine.ts, tsconfig.json đều là file chung; hunk
   Z2 gắn marker và đã áp sạch tại thời điểm làm, nhưng parent cần
   gộp theo marker khi hợp nhất các luồng (đặc biệt tsconfig:
   luồng khác cũng có thể đang thêm exclude cùng lúc).
6. **Bẫy ngủ tiền hữu còn lại**: scrub về đúng t đã cạn mà store
   không đổi giá trị (không đánh thức vòng lặp) vẫn giữ trạng thái
   bỏ cuộc — hành vi đã định theo X2 §6.4, không phải bug, ghi lại
   để khỏi mở lại.

## 6. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (4 file):

- `apps/web/src/preview.tsx` — import `planDrawnPlayheadRecovery` +
  hunk guard trước nhánh request-seek + gọi `engine.releaseElement`
  trong vòng drop Y2. Tổng 3 dòng marker `// ROUND44-Z2`. Không đụng
  nhánh playing, cap W2/X2, logic reset cap cũ.
- `apps/web/src/lib/seek.ts` — hằng `SEEK_ZERO_LANDING_MAX_RETRIES`
  + closure `zeroLandingCount`/`assigned` + nhánh nhận diện đáp 0
  trong listener `seeked` + đánh dấu đã gán. Tổng 4 dòng marker
  `// ROUND44-Z2`. Không đổi attempt/N1, timeout, debounce, phân loại.
- `apps/web/src/lib/audioEngine.ts` — record node thêm trường `src`
  + phương thức `releaseElement(el)`. Tổng 2 dòng marker
  `// ROUND44-Z2`. Không đổi dispose/update/setMasterVolume/chuỗi FX.
- `apps/web/tsconfig.json` — thêm 3 dòng exclude cho 3 file test mới
  (theo mẫu mọi test file).

MỚI (4 file code + LIMITS này):

- `apps/web/src/lib/pauseLoopGuard44Z2.ts` — hàm thuần
  `planDrawnPlayheadRecovery` + ghi chú cơ chế kẹt/giới hạn.
- `apps/web/src/lib/pauseLoopGuard44Z2.test.ts` — 11 test (§4).
- `apps/web/src/lib/seekZeroLanding44Z2.test.ts` — 5 test (§4).
- `apps/web/src/lib/audioEngine44Z2.test.ts` — 5 test (§4).

KHÔNG ĐỔI: mọi code sản phẩm khác, paths-loop, build-loop-log.
Scratch tái hiện mô hình cũ ở `/tmp/repro44z2-oldmodel.mts`
(không vào repo, không vào batch); dist build tạm ở
`/tmp/vcut-dist-z2` (không vào repo).
