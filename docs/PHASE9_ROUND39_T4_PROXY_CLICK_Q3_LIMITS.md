# Phase 9 đợt 39, luồng T4 — Click-test full-app proxy lớn + quyết định re-gate toggle Q3 — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa file của luồng khác ngoài phần mình được giao, KHÔNG ghi
paths-loop hay build-loop-log (parent gộp).
Luồng này đóng nợ §5.4–5.5 của `docs/PHASE9_ROUND38_LIMITS.md`
("Click-test full-app cho clip proxy có proxySizeBytes" của U2 và
"Toggle Q3: chưa quyết re-gate liên tục hay giữ luật T2; badge hợp lý
do nhiều controller có thể gây hiểu nhầm" của U1).

Đọc trước khi đổi: `docs/PHASE9_ROUND38_U1_Q3_TOGGLE_LIMITS.md` (đặc biệt
§2.3, §5.1–5.4), `docs/PHASE9_ROUND38_U2_PROXY_SIZE_RANGE_LIMITS.md`
(§5.3–5.4), `docs/PHASE9_ROUND38_LIMITS.md` §5.4–5.5.

## 0. Kết luận ngắn (không vượt số đo)

1. **QUYẾT ĐỊNH RE-GATE: GIỮ LUẬT T2 — cổng S3 chỉ xét lúc BẬT, KHÔNG
   re-gate liên tục khi đang chạy.** Lý do có số đo (xem §1.1): số đo
   decode cửa sổ trên cùng fixture dao động 10–383 fps theo tải (U1
   §2.3) nên re-gate theo từng cửa sổ sẽ quyết định bằng nhiễu tải;
   hysteresis đủ rộng để hết flapping (≈ 3 cửa sổ ≈ 7,5 s) thì phản
   ứng quá chậm, lợi ích ≈ 0; prefetch chỉ là việc nền best-effort
   tối đa 1 cửa sổ đang bay. Luật được khóa bằng test
   (`shouldAutoApplyDecodeAhead`: chỉ thử lại khi wanted mà chưa bật)
   và bằng chứng browser: lượt click-test 2 cho thấy controller đang
   chạy vẫn chạy khi số đo mới nhất tụt còn 33,43 fps < ngưỡng 60
   (xem §3.4) — đúng luật giữ, không phải bug.
2. **Tắt giữa chừng nay có nghĩa đầy đủ:** không prefetch mới +
   aheadRange về null ngay (kế thừa U1) + prefetch đang bay bị DỌN
   khỏi cache khi settle (mới, §1.2) — trừ khi đã bật lại hoặc đang
   có decode cửa sổ bay (khi đó chờ decode xong rồi dọn, tránh evict
   nhầm frame cửa sổ đang decode dở). Trên browser lượt 3, lúc đọc
   trạng thái sau khi tắt thì `inFlight=0`, `settledDropped=0` nên
   settle-drop KHÔNG bắt được bằng chứng browser lần này (prefetch
   đã settle trước lúc tắt) — ghi rõ, không mạo nhận; luật dọn được
   khóa bằng test thuần + đường code (xem §5.2).
3. **Badge nhiều controller không còn hợp nhầm:** mỗi controller mang
   decision RIÊNG của nó; badge bị chặn nhiều clip hiện
   `badgeBlockedMulti` + title liệt kê từng clip (clip chưa từng thử
   cổng hiện "lý do chưa rõ", không bịa lý do). Click-test lượt 3:
   badge "BỊ CHẶN — 4 clip, lý do khác nhau" với đúng dòng từng clip
   (proxy: chưa rõ; clip1: dưới ngưỡng; 2 clip mẫu: chưa rõ).
4. **Click-test full-app proxy THẬT > 128 MiB (không phải ngưỡng giả):
   PASS 6/6 ở lượt 3.** Proxy 720p thật qua bridge POST:
   203.093.266 byte = sidecar = kích thước file trên đĩa, vượt ngưỡng
   S4 134.217.728. Cửa sổ scoped trong clip proxy (time 59,6 → 47,5 s
   đang chạy ngược): delta controllerFetches = 0, hits không đổi,
   misses +356, largeFileLocked = true → controller KHÔNG phát request
   nào cho proxy > 128 MiB. KHÔNG claim 0 request mạng tổng: `<video>`
   element ở đường fallback vẫn tải file bình thường (xem §3.3).

## 1. Đã làm (code)

### 1.1 Quyết định re-gate + khóa bằng test (`reverseDecodeAheadToggle.ts`)

- `shouldAutoApplyDecodeAhead(wanted, enabled) = wanted && !enabled`:
  nhánh auto-apply trong `ensureWindowForTime` nay gọi đúng hàm này
  (thay cho điều kiện viết tay `decodeAheadWanted &&
  !this.decodeAheadEnabled`). Hành vi không đổi cho đường cũ, nhưng
  luật "đang bật thì số đo cửa sổ mới không re-gate" nay có tên, có
  test, có ghi chú quyết định — ai đó vô tình đổi nhánh này thành
  re-gate mỗi cửa sổ sẽ làm vỡ test `re-gate: chỉ tự thử lại khi
  wanted mà CHƯA bật`.
- Căn cứ số (không phải cảm tính):
  - U1 §2.3: cùng fixture 360p đo được 10,45 → 382,82 fps tùy tải và
    tùy cửa sổ. Ngưỡng cổng là 60 fps (2× phát 30 fps): một luật
    re-gate 1 cửa sổ sẽ lật trạng thái ở hầu hết các cửa sổ chỉ vì
    tải thay đổi, không vì footage đổi.
  - Hysteresis 3 cửa sổ chậm liên tiếp mới tắt ≈ 3 × 75 frame @30fps
    = 7,5 s mới phản ứng — tới lúc đó tải thường đã đổi, badge vẫn
    nhấp nháy mà lợi ích ≈ 0.
  - Prefetch là việc nền fire-and-forget, tối đa 1 cửa sổ đang bay:
    giữ bật trong cửa sổ chậm chỉ tốn đúng 1 cửa sổ đó (frame thừa bị
    evict ở lần decode cửa sổ sau), không chặn đường decode chính
    (cửa sổ chính đã decode xong trước khi tính prefetch).
  - User vẫn luôn tắt tay được ngay (toggle off có hiệu lực tức thời
    cho prefetch mới + dọn prefetch dở, §1.2).
- Luật còn lại giữ nguyên từ U1: cổng xét lại khi (a) user bật toggle,
  (b) wanted=true mà controller chưa bật thì cửa sổ decode mới tự thử
  lại bằng số đo mới của chính nó. "Thử lại khi chưa bật" KHÔNG phải
  re-gate của controller đang chạy — phân biệt này được ghi rõ trong
  comment quyết định để luồng sau không nhầm.

### 1.2 Dọn prefetch đang bay khi tắt (`reverseWebcodecs.ts`, hunk T4)

- `ReverseDecodeAhead.inFlightCount` (mới, chỉ quan sát): số cửa sổ
  prefetch đang bay, để status phơi cho harness.
- Controller thêm `lastGateDecision` (decision RIÊNG từng controller,
  ghi ở `enableDecodeAheadFromGate`, xóa ở `disableDecodeAhead` và
  `dispose`) + `settledPrefetchDropped` (cộng dồn frame đã dọn).
- `dropSettledPrefetchIfOff()` (mới, private): khi prefetch settle mà
  controller đang tắt thì evict đoạn prefetch khỏi cache, chỉ giữ cửa
  sổ hiện tại (`keepIndicesForWindow(lastDecodeRange)`). Điều kiện
  qua `shouldDropSettledPrefetch(enabled, disposed, decodeInFlight)`:
  đang tắt + không dispose + không có decode cửa sổ bay. Nếu lúc
  settle mà đang có decode cửa sổ bay thì CHỜ decode đó xong rồi thử
  lại (chain vào `decodePromise`, cả nhánh resolve lẫn reject) — để
  đóng khe frame prefetch đáp sau lần evict của cửa sổ đó mà không
  còn lần decode nào sau nữa để dọn, đồng thời không evict nhầm frame
  của cửa sổ đang decode dở. Nếu lúc chờ mà user bật lại / dispose
  thì thôi, không dọn nữa. Guard `lastDecodeRange` null thì không
  evict (không xóa mù; trên đường thật không xảy ra vì prefetch chỉ
  bắt đầu sau một lần decode cửa sổ đã ghi range).
- Prefetch không hủy được giữa chừng (VideoDecoder không có cancel):
  "dọn khi settle" là xử lý mạnh nhất có thể mà không viết lại tầng
  decoder — ghi rõ, không claim "hủy prefetch đang bay".

### 1.3 Trạng thái per-controller + quan sát khóa S4 (`reverseWebcodecs.ts`)

- `reverseDecodeAheadStatus()` thêm 3 trường (các trường cũ giữ nguyên
  để test U1 và harness cũ không vỡ):
  - `controllers: DecodeAheadPerControllerStatus[]` — mỗi entry:
    label (basename URL, cắt 40 ký tự, fallback "clip N"),
    active, prefetchFrames, measurementFps/Resolution, reasons của
    decision RIÊNG controller đó (rỗng = chưa từng thử cổng).
  - `inFlightPrefetchWindows`: tổng prefetch đang bay mọi controller.
  - `settledPrefetchDroppedFrames`: tổng frame đã dọn sau khi tắt.
- `reasons` gộp (cho toast chặn) nay là HỢP lý do của mọi controller
  đã thử cổng (giữ thứ tự registry, không trùng) thay vì decision
  toàn cục "controller decode sau cùng thắng" — đó chính là chỗ badge
  U1 có thể hiện nhầm lý do khi nhiều controller. Khi không controller
  nào có decision thì rơi về decision toàn cục (đường toggle bật khi
  chưa có controller, U1) để không mất lý do "chưa đo". Khi đang chạy
  thì reasons vẫn rỗng như cũ (toast không bắn trong lúc chạy; lý do
  clip bị chặn còn lại đọc ở `controllers`).
- Quan sát khóa S4 cho click-test (không đổi luật S4):
  - `reverseControllerFetchStats.fetches`: đếm mỗi lần controller thật
    sự phát fetch (HEAD ở `probeFileSize` + GET ở `load`). Controller
    bị khóa từ constructor (known size vượt ngưỡng → unsupported)
    thì `load()` trả false trước cả HEAD nên counter đứng yên.
  - Mirror `window.__vcutReverseWc` thêm `controllerFetches` và
    `largeFileLocked` (có controller nào đang bị khóa fallback không).
    Counter này KHÔNG đếm request của `<video>` element ở đường
    fallback — click-test khẳng định "0 request từ controller", cấm
    đọc thành "0 request mạng tổng".

### 1.4 Badge/title nhiều controller (`preview.tsx`, đúng hunk U1/T4)

- `refreshDecodeAheadUi` tính `blockedLines` (dòng từng clip bị chặn:
  `label: lý do; ...`, clip chưa thử cổng → câu unknown) và dùng ở cả
  title nút toggle lẫn title badge:
  - Đang chạy + có clip khác bị chặn (trạng thái hỗn hợp): title =
    warnings + dòng từng clip bị chặn (không giấu clip bị chặn sau
    badge "đang chạy" chung).
  - Bị chặn, nhiều controller, lý do khác nhau
    (`blockedReasonsDiffer`): badge text = `badgeBlockedMulti`
    ("BỊ CHẶN — {n} clip, lý do khác nhau"), title = dòng từng clip.
  - 1 clip, hoặc nhiều clip cùng lý do: giữ nguyên text/title U1 cũ
    (không đổi hành vi đã click-test 6/6 ở U1).
- Comment ở `onDecodeAheadToggleClick` cập nhật: tắt giữa chừng nay
  dọn prefetch đang bay khi settle; cổng không re-gate khi đang chạy.

### 1.5 i18n (`i18n/vi.json`, `i18n/en.json`, section `decodeahead`)

- Thêm key `badgeBlockedMulti` (vi=en, chứa `{n}`, khác rỗng).
- Đổi wording 2 key cũ (không thêm/bớt key): `toggleHint` thêm câu
  luật giữ T2 (cổng chỉ xét lúc bật; đang chạy không tự tắt) và câu
  dọn prefetch khi tắt; `toastOffNote` thêm "prefetch đang bay (nếu
  có) sẽ bị dọn khi hoàn tất". `node apps/web/scripts/r6-i18n-check.cjs`
  PASS (vi=en 959 key).
- Test U1 khóa key section: thêm `decodeahead.badgeBlockedMulti` vào
  danh sách kỳ vọng (1 dòng duy nhất sửa ở file test U1 — bắt buộc vì
  test khóa đủ key không thừa/thiếu; không đổi assertion nào khác).

## 2. Kiểm chứng unit/hồi quy (số thật)

- **Mới** `reverseDecodeAheadToggle39T4.test.ts`: **11/11 pass**
  (esbuild bundle ra scratch ngoài repo):
  re-gate predicate 4 tổ hợp; settle-drop predicate 5 tổ hợp;
  keepIndicesForWindow (null/rỗng/1 frame/đoạn); controllerLabel
  (basename, cắt 40 ký tự + "…", fallback "clip N", blob UUID);
  blockedReasonsDiffer (0–1 clip, cùng lý do, khác lý do, thứ tự
  không làm khác, clip đang chạy không tính); i18n badgeBlockedMulti
  vi+en chứa `{n}`; status 2 controller (clip dễ active, clip chậm
  mang đúng lý do dưới ngưỡng — không bị decision clip dễ ghi đè);
  reasons gộp giữ thứ tự registry không trùng; toggle bật khi 2
  controller chưa có số đo → cả 2 bị chặn (không mượn số lần bật
  trực tiếp trước đó — hành vi này ban đầu làm test viết sai, đã sửa
  test theo hành vi thật, xem §4.3); S4 khóa từ constructor với
  150 MiB (largeFileFallback=true, 0 fetch khi chỉ tạo controller);
  disable xóa decision riêng + dispose reset counter.
- **Hồi quy** (cùng runner như các đợt trước): U1 toggle 12/12,
  S4 6/6, T5 6/6, R3 10/10, gate 12, wiring T2 12/12, range U2 20/20,
  decodeAhead 12 (chạy bằng `node --experimental-strip-types` theo
  header file đó — bundle cjs lỗi top-level await là lỗi runner, không
  phải lỗi code, xem §4.4).
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi ở mọi file của
  luồng này** (reverseWebcodecs, reverseDecodeAheadToggle, preview,
  i18n, test mới). Toàn bộ tsc vẫn còn 7 lỗi ở
  `assetStore.ts` + `relink39T5.test.ts` — thuộc luồng T5 đang sửa
  song song, KHÔNG phải file T4, T4 không đụng vào (parent gộp cần
  chạy lại tsc sau khi T5 xong).
- `vite build` pass (5,36 s; cảnh báo chunk > 500 kB đã có từ trước).
  Dist này (không vào batch) là bản click-test lượt 2–3 chạy bằng
  `vite preview` — grep dist thấy đủ `badgeBlockedMulti` và
  `settledPrefetchDropped`, tức dist khớp code cuối.

## 3. Click-test full-app (Chrome headless qua CDP, click thật)

Script mới `apps/web/scripts/clicktest-round39-t4-proxy-click-q3-pipe.mjs`
(lượt 3: **6/6 pass**; lượt 1–2 và các lỗi harness ghi đủ ở §4).
Thiết lập lượt 3: bridge local (BRIDGE_WORK_DIR scratch, port 8787) +
`vite preview` port 5179 phục vụ dist đóng băng (xem §4.1 vì sao cấm
vite dev ở đây), Chrome headless mới profile mới, click thật có
hit-test, không gọi store nội bộ.

### 3.1 Fixture proxy thật > 128 MiB (không dùng ngưỡng giả)

- Nguồn: `testsrc2` 1920×1080 + filter noise, 60 s, 30 fps, encode
  libx264 veryfast CRF 28 → 568.652.216 byte (tạo bằng ffmpeg ở
  scratch ngoài repo, KHÔNG vào batch).
- Sim đo trước: nhiễu 720p CRF 23 veryfast (đúng tham số proxy của
  bridge) ≈ 3,38 MB/s → 60 s ≈ 203 MB. Thực tế qua bridge POST
  `/api/proxy` (tự động khi import, không bấm tay):
  **proxySize = 203.093.266 byte = đúng kích thước file proxy trên
  đĩa, vượt ngưỡng S4 134.217.728** (sidecar JSON khớp từng byte;
  transcode lặp lại 2 lần cho cùng con số — xác định).
- Đây là proxy 720p THẬT qua đúng đường bridge POST → setMediaProxy
  → preview (không phải fixture tổng hợp đặt tay vào thư mục proxy,
  không phải ngưỡng override trong harness). Giới hạn: proxy thật
  720p thường nhỏ hơn ngưỡng — case này hiếm trong thực tế và chỉ
  đạt được bằng footage nhiễu dài; nhưng cổng S4 nay đã có bằng chứng
  app-thật cho chính case hiếm đó.

### 3.2 Kết quả lượt 3 (6/6, số đo đầy đủ)

- **T0 app + toggle**: modal tự mở, đã đóng bằng click backdrop.
- **P1 proxy lớn qua bridge**: card=true, nút "✓ PROXY 720p",
  sidecar=203.093.266 = file=203.093.266 > 134.217.728,
  manualClicked=false (đường tự động).
- **Q-multi badge nhiều clip lý do khác nhau**: badge
  "⛔ Decode-ahead: BỊ CHẶN — 4 clip, lý do khác nhau", title liệt kê
  đúng từng dòng: proxy `bigsrc-1080p-60s__proxy_720p.mp4: lý do chưa
  rõ` (chưa từng thử cổng vì bị khóa trước cả decode), clip1
  (blob UUID, đo thật 55,55 fps 1280×720):
  "chưa đo hardware decode; decode phần mềm dưới ngưỡng dễ", và 2
  clip mẫu project: "lý do chưa rõ". Số 4 (không phải 2) vì project
  mẫu cũng tạo controller riêng — assertion lượt 2 ép "2 clip" là
  sai, đã sửa thành "N clip, lý do khác nhau" + đủ dòng (xem §4.2).
  Clip1 đo 2 lượt: 39,42 fps (lượt 2) và 55,55 fps (lượt 3) — cả 2 đều
  < 60 nên đều bị chặn đúng: cổng xét theo số đo, không theo tên file.
- **P2 proxy > 128 MiB: 0 fetch từ controller (scoped)**: sau khi seek
  giữa timeline và phát ngược, cửa sổ 12 s đo được time 59,6 → 47,5 s
  (trong [10, 60], đang chạy ngược), **controllerFetches 6 → 6
  (delta 0), hits 127 → 127 (không tăng), misses 2079 → 2435 (+356
  lần consult), largeFileLocked = true**. Đọc đúng: trong cửa sổ đó
  preview consult controller 356 lần, không lần nào được frame (khóa
  S4), và controller không phát thêm fetch nào — đúng "0 request từ
  controller". Không claim 0 request mạng tổng (element fallback vẫn
  tải file). Thuộc tính cửa sổ: clip proxy dài 60 s trên timeline
  ~76 s nên mọi cách xếp clip đều phủ kín đoạn 47–59 s (xem §5.3).
- **Q1 chạy + title hỗn hợp**: prefetch=75 frame, fps cửa sổ mở cổng
  184,99, badge "ĐANG CHẠY — prefetch 75 frame", title = warnings +
  đủ 4 dòng clip bị chặn (proxy, 2 clip mẫu, clip1 dưới ngưỡng) —
  trạng thái hỗn hợp hiển thị đúng, không giấu clip bị chặn.
- **Q2 tắt giữa chừng → TẮT + prefetch 0**: moved=true (phát ngược
  đang chạy khi bấm tắt), status=off, prefetch=0, badge "TẮT",
  `settledDropped=0`, `inFlight=0` (xem §5.2).

### 3.3 Cái gì KHÔNG chứng minh được bằng click-test này

- **Settle-drop trên browser**: lượt 3 đọc `settledDropped=0`,
  `inFlight=0` — prefetch đã settle trước lúc tắt nên không bắt được
  khoảnh khắc dọn. Đây là quan sát không kết luận (không phải bằng
  chứng chống lại luật dọn: luật được khóa bằng test thuần §2 và
  đường code §1.2; muốn bắt được cần căn tắt đúng lúc prefetch đang
  bay — cửa sổ thời gian chỉ vài trăm ms, harness hiện tại không căn
  được xác định).
- **Proxy thật > 128 MiB từ footage thường**: proxy trong test là
  footage nhiễu dài (trường hợp hiếm). Proxy 720p từ footage thường
  vẫn nhỏ hơn ngưỡng — cổng S4 cho case thường đã có bằng chứng từ
  U2 (proxy 167.943 byte đi đường nhỏ bình thường) và S4 (file gốc
  lớn), không cần lặp lại ở đây.
- **Safari / máy thật / GPU thật / đường `asset:`**: chưa đo (như mọi
  đợt trước).

### 3.4 Bằng chứng browser cho quyết định giữ luật T2 (lượt 2)

Lượt click-test 2 (chỉ khác lượt 3 ở assertion harness, cùng code
sản phẩm) ghi được: controller fixture dễ decode đang chạy
(prefetch 75) mà số đo mới nhất đã tụt còn **33,43 fps < ngưỡng 60**
vẫn giữ trạng thái chạy — tức cổng không tự đóng khi cửa sổ sau đo
chậm. Đây là quan sát độc lập ủng hộ quyết định §1.1 (không phải
suy luận từ code): nếu làm re-gate mỗi cửa sổ, chính trường hợp này
đã tắt decode-ahead giữa chừng dù footage không đổi.

## 4. Ba lỗi của chính harness đo (ghi đủ, không giấu)

1. **Vite dev HMR reload trang giữa chừng (lượt 1 hỏng hoàn toàn).**
   Các luồng đợt 39 khác sửa file song song làm vite dev reload trang:
   state React reset, card import biến mất khỏi MediaBin, welcome
   modal hiện lại và che click thêm clip1 (FATAL modal-backdrop).
   Bằng chứng: sidecar proxy đã có (203.093.266) nhưng card biến mất
   (btn=null) và timeline chỉ còn clip mẫu. Sửa: click-test chạy
   bằng `vite preview` phục vụ dist đóng băng (không HMR) + script
   tự đóng modal khi bị che + thoát sớm khi card biến mất 30 s (thay
   vì poll mù 480 s). Header script ghi rõ bắt buộc dùng preview.
2. **Regex TIME_JS thừa backslash (lượt 2: P2 fail oan, Q1/Q2 méo).**
   Script viết `\\\\d` trong template literal (4 backslash) trong khi
   file U1 chỉ có `\\d` (2 backslash): chuỗi đưa vào page thành regex
   tìm ký tự "\" + "d" theo nghĩa đen nên không bao giờ khớp giờ →
   TIME_JS luôn null, playReverseAndWaitForMovement báo moved=false,
   cửa sổ scoped đo phải khoảng chết (fetches/hits/misses đứng yên).
   Sửa: TIME_JS mới không dùng regex nữa (split('/') + split(':')),
   miễn nhiễm bẫy escape. Số P2 của lượt 2 (fetches 6 → 6, misses
   đứng yên) là số của khoảng chết, CẤM trích làm bằng chứng — chỉ
   số lượt 3 (§3.2) mới có giá trị.
3. **Assertion sai nhãn và sai số clip (lượt 2).** Ép badge đúng
   "2 clip" trong khi project mẫu cũng tạo controller (thực tế 4
   clip) và ép title chứa "clip1" trong khi controller của clip import
   mang nhãn blob UUID (không phải tên file). Cả 2 đều là lỗi kỳ vọng
   của harness, không phải lỗi sản phẩm: badge multi và title
   per-controller đã đúng ngay ở lượt 2 (badge "4 clip, lý do khác
   nhau", title đủ dòng). Sửa: khẳng định "N clip, lý do khác nhau"
   + title chứa "proxy" và "dưới ngưỡng".
4. **Các lỗi không thuộc luồng này (ghi để parent khỏi nhầm):**
   - Test `reverseDecodeAhead.test.ts` bundle cjs lỗi top-level await:
     lỗi runner, chạy đúng theo header file
     (`node --experimental-strip-types`) thì 12 pass.
   - Test T4 viết sai ở lần đầu (kỳ vọng toggle bật với 2 controller
     cho verdict allowed): setWanted chạy lại cổng với số đo null
     (chưa decode) nên cả 2 phải bị chặn — đã sửa test theo hành vi
     thật, không sửa code cho vừa test.
   - `seekRuler` (click lên ruler để seek) KHÔNG có tác dụng trong
     cả 3 lượt (cur không đổi sau click: 0 → 0): có thể scrub cần
     pointermove/drag chứ không phải click đơn. Cửa sổ scoped lượt 3
     vẫn hợp lệ vì nút Phát ngược tự bắt đầu từ cuối timeline khi
     playhead ở 0 (time đo được 59,6 → 47,5). Harness này không được
     claim "seek bằng click ruler đã chạy" — cần luồng khác sửa
     seekRuler nếu muốn dùng nó làm bước định vị.

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Chưa có re-gate liên tục — theo quyết định, không phải nợ quên.**
   Nếu sau này user đổi ý muốn re-gate thì cần: ngưỡng runtime riêng
   (không dùng lại ngưỡng admission 60 fps), hysteresis ≥ 3 cửa sổ,
   và phép đo quiet có điều phối để tách nhiễu tải khỏi độ khó
   footage. Không làm re-gate 1 cửa sổ trong bất kỳ hoàn cảnh nào
   (xem §1.1).
2. **Settle-drop chưa bắt được bằng chứng browser** (xem §3.3): cần
   harness căn tắt đúng lúc prefetch đang bay (cửa sổ vài trăm ms)
   hoặc mirror thời gian thực của `inFlightPrefetchWindows` trong lúc
   tắt — hiện chỉ đọc sau 3 s nên đã muộn.
3. **Badge multi chưa click-test với đúng 2 clip** (lượt 3 là 4 clip
   vì project mẫu): trường hợp 2 clip đúng nghĩa chỉ có ở unit test
   (`blockedReasonsDiffer` + status 2 controller). Muốn browser đúng
   2 clip cần project mẫu trống hoặc timeline chỉ 2 clip — ngoài
   phạm vi luồng này.
4. **Chưa chứng minh:** đo quiet có điều phối; máy có GPU thật (VM
   này HW proof luôn null trong app); Safari / máy thật / dpr > 1;
   đường `asset:`; proxy trên máy thật; phiên chạy dài / tab ẩn.
   KHÔNG claim FPS: mọi con số trên chỉ là số đo cửa sổ decode để
   xét cổng / đếm prefetch, không phải fps hiển thị ngược.
5. **Server đo đã dừng sau khi đo xong** (bridge 8787 + vite preview
   5179 đã kill sau lượt 3; cổng trống). Script click-test giả định
   cả 2 đang chạy (xem header script) — chạy lại cần khởi động lại
   cả 2. Scratch đo nằm ngoài repo
   (`~/workspace/tmp-round39-t4/`: nguồn 568 MB, proxy 203 MB,
   sidecar, log vite/bridge, 3 log click-test, bundle test) —
   KHÔNG vào batch.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/lib/reverseDecodeAheadToggle.ts` (quyết định
  re-gate + predicate + helper keep/label/differ).
- Sửa: `apps/web/src/lib/reverseWebcodecs.ts` (hunk T4: decision riêng
  từng controller, settle-drop, status controllers, counter fetch +
  mirror largeFileLocked; giữ nguyên hunk T2/T5/U1 trên cùng file).
- Sửa: `apps/web/src/lib/reverseDecodeAhead.ts` (chỉ thêm getter
  `inFlightCount`, không đổi logic cửa sổ/prefetch).
- Sửa: `apps/web/src/preview.tsx` (hunk T4 trong `refreshDecodeAheadUi`
  + comment toggle: badge/title nhiều controller; không sửa logic
  draw hay nhánh nào khác).
- Sửa: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (section `decodeahead`: thêm `badgeBlockedMulti`, đổi wording
  `toggleHint` + `toastOffNote`; file viết lại bằng script giữ nguyên
  thứ tự key, r6-i18n-check PASS).
- Sửa: `apps/web/src/lib/reverseDecodeAheadToggle38U1.test.ts` (chỉ
  thêm 1 key vào danh sách kỳ vọng i18n của U1).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới;
  file này các luồng đợt 39 khác cũng đang sửa — parent đối chiếu
  khi gộp, hunk T4 chỉ là dòng đó).
- Mới: `apps/web/src/lib/reverseDecodeAheadToggle39T4.test.ts` (11/11).
- Mới: `apps/web/scripts/clicktest-round39-t4-proxy-click-q3-pipe.mjs`
  (click-test app thật 6/6 ở lượt 3).
- Mới: `docs/PHASE9_ROUND39_T4_PROXY_CLICK_Q3_LIMITS.md` (file này).
- Không sửa: `reversePreviewGate.ts` (không đổi ngưỡng 60 fps, không
  đổi chuỗi cổng), `reversePlayback.ts`, `mp4Demux.ts`, store,
  bridge, proxy.js, paths-loop, build-loop-log. `apps/web/dist/` do
  `vite build`/`vite preview` dùng cũng KHÔNG đưa vào batch theo tiền
  lệ các đợt.
