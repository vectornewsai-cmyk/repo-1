# Phase 9 đợt 38, luồng U1 — Toggle UI decode-ahead Q3 + badge 3 trạng thái — LIMITS

Ngày: 02/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG code giả.
Luồng này đóng nợ §3.3 của `docs/PHASE9_ROUND37_LIMITS.md` ("Q3 trong
preview: chưa có toggle UI để bật decode-ahead; badge chưa click-test
trên app thật; bật giữa chừng chỉ có tác dụng từ lần decode cửa sổ mới")
và nợ §6.2–6.3 của `docs/PHASE9_ROUND37_T2_PACED_Q3_LIMITS.md` (toggle +
luồng đo thuộc luồng store/i18n; badge chưa click-test trên app thật).

Đọc trước khi đổi: `docs/PHASE9_ROUND37_LIMITS.md` §3.3,
`docs/PHASE9_ROUND37_T2_PACED_Q3_LIMITS.md` (đặc biệt §3 nối cổng và §6
nợ), `apps/web/src/lib/reversePreviewGate.ts` (luật cổng S3).

## 0. Kết luận ngắn (không vượt số đo)

1. **Đã có toggle UI thật** trong preview (góc trên-phải, ngay trái nút
   fullscreen, class `preview-decodeahead-toggle`): bấm đảo cờ "muốn bật"
   qua đúng cổng opt-in S3 — không bypass cổng, không đổi mặc định TẮT.
   Khi chưa có số đo, toggle hiện "BỊ CHẶN" kèm lý do cổng (không im
   lặng, không bật lén).
2. **Badge 3 trạng thái đã click-test trên app thật (6/6)**: tắt / bị
   chặn + lý do / đang chạy + số frame prefetch. Bật → prefetch 75
   frame, tắt → prefetch 0 sau khi playhead qua biên cửa sổ, bị chặn →
   badge + toast đúng chuỗi cổng.
3. **"Bật giữa chừng" nay chính xác hơn T2**: toggle đặt cờ wanted
   "dính" (sticky) ở mức registry; cửa sổ decode mới nào đo được số đo
   thật sẽ tự thử lại cổng NGAY sau lần decode đó, TRƯỚC khi tính đoạn
   prefetch — nên chính cửa sổ vừa decode cũng prefetch được đoạn
   trước nó ngay, không phải chờ thêm một cửa sổ nữa. Nếu user bật khi
   đang giữ cửa sổ cũ mà chưa có decode mới thì vẫn chưa có prefetch
   cho tới lần decode cửa sổ mới (giới hạn còn lại, ghi rõ ở §5.1).
4. **Cổng vẫn là người gác cửa, và nó đã chặn đúng trong probe**: clip
   720p 1 GOP duy nhất (clip1.mp4 của repo) đo thật chỉ 29,58 fps →
   chặn với lý do `software-decode-below-easy-threshold` (xem §2). Số
   đo decode dao động cực mạnh theo tải và theo cửa sổ (10–383 fps
   đo được trong đợt này, §2) nên cổng chỉ mở ở những cửa sổ đo
   ≥ 60 fps — đó là hành vi đúng thiết kế, không phải bug.

## 1. Đã làm (code)

### 1.1 Toggle + cờ wanted "dính" (`reverseWebcodecs.ts`, hunk U1)

- `setReverseDecodeAheadWanted(wanted)` / `getReverseDecodeAheadWanted()` /
  `reverseDecodeAheadStatus()` ở mức registry (sống qua dispose/tạo lại
  controller để toggle bật trước khi có footage vẫn có tác dụng ở cửa
  sổ decode đầu tiên đo được). Mặc định `false` — KHÔNG đổi mặc định
  TẮT của T2.
- Bật (`wanted=true`): mỗi controller đã có thử cổng ngay với đúng số
  đo của nó (null = chưa đo → chặn với `hardware-not-measured` +
  `software-decode-not-measured`); không có controller nào thì tính
  thẳng decision "chưa đo" để UI hiện bị chặn đúng lý do thay vì im
  lặng; wanted vẫn giữ để cửa sổ decode đầu tiên sau đó tự thử lại.
- Tắt (`wanted=false`): tắt mọi controller ngay (không prefetch MỚI),
  `aheadRange` về null ngay để badge không còn báo đang chạy, xóa
  decision chặn cũ. Prefetch đang bay (nếu có) vẫn có thể hoàn tất
  tối đa 1 cửa sổ rồi thôi — "tắt" ở đây nghĩa là không khởi động
  prefetch mới nào nữa (xem §5.1).
- `disableDecodeAhead()` mới trên controller (khác với bị cổng chặn:
  không tạo decision, không để lại lý do chặn cũ).
- `reverseDecodeAheadStatus()` gộp cho UI: `{ wanted, active,
  uiStatus: off|blocked|running, prefetchFrames (tổng mọi controller),
  warnings (nguyên văn chuỗi cổng), reasons, decision, measurementFps,
  measurementResolution }`, mirror lên
  `window.__vcutReverseDecodeAheadStatus` theo mẫu các mirror cũ.

### 1.2 Số đo decode thật từ cửa sổ vừa decode (hunk U1, cùng file)

- `ensureWindowForTime` nay đo wall của riêng lần `decodeGop` (không
  tính fetch) và ghi `lastDecodeMeasurement = { decodeFps,
  loadLabel: "under-load", resolution: "WxH" }` cho đúng controller /
  footage đó. Nhãn tải LUÔN là `"under-load"`: app không chứng minh
  được cửa sổ quiet nên không bao giờ ghi `"quiet"` cho số đo này
  (luật cổng S3). Cửa sổ decode 0 frame không ghi số đo.
- Ngay sau khi ghi số đo, nếu `wanted && !enabled` thì thử lại cổng
  bằng số đo mới này, TRƯỚC khối tính `aheadRange` của T2 — nên cửa
  sổ vừa decode cũng prefetch được đoạn trước nó ngay (cải tiến so
  với "chỉ có tác dụng từ cửa sổ mới" của T2: vẫn cần một lần decode
  cửa sổ mới, nhưng không cần thêm một cửa sổ nữa mới thấy prefetch).
- Bằng chứng hardware trong đường app là `null` (chưa đo): đo HW thật
  cần một lần decode probe bằng prefer-hardware như probe R4 ở bench,
  chưa có trong app — nên trên máy không có HW, cổng chỉ mở bằng
  nhánh footage dễ decode (SW ≥ 2× fps phát). Module không bịa proof
  HW để mở cổng. `dispose()` xóa số đo của controller đã dispose
  (controller mới phải đo lại trên footage của nó).

### 1.3 Logic thuần cho UI (`reverseDecodeAheadToggle.ts`, mới)

- `resolveDecodeAheadUiStatus(wanted, active)`: active thắng wanted
  (controller bật bằng đường trực tiếp như probe T2 vẫn hiện "đang
  chạy" dù cờ wanted chưa từng đặt).
- `prefetchFrameCount(range)`: null → 0, đoạn T2 497–579 → 83.
- `decodeAheadGateInputForToggle(wanted, measurement)`: optIn =
  wanted, hardwareProof luôn null, giữ nguyên số đo (không đổi mặc
  định, không bịa số).
- `decodeAheadReasonI18nKey(code)` cho mọi mã lý do cổng (kể cả mã lạ
  → key `unknown` để UI hiện câu chung thay vì mã thô); test khóa
  đủ 8 mã cổng + fallback.
- `aggregateDecodeAheadDecisions(decisions)`: 1 controller được phép
  là coi như được phép (warnings gộp, giữ thứ tự, không trùng); tất
  cả bị chặn thì reasons là hợp các lý do (không trùng).

### 1.4 Toggle + badge trong preview (`preview.tsx`, hunk U1)

- Nút toggle góc trên-phải (ngay trái nút fullscreen), nhãn/title/
  `aria-pressed`/`data-status` cập nhật qua ref trong
  `refreshDecodeAheadUi` (không re-render mỗi frame, mẫu các badge
  khác). Nút luôn nhìn thấy được (tính năng thử nghiệm cần tìm được);
  badge chỉ hiện khi user đã chạm toggle hoặc đang có cảnh báo/đang
  chạy — chưa chạm thì ẩn để khỏi làm phiền (giữ hành vi T2).
- `refreshDecodeAheadUi()` gọi từ vòng lặp mỗi tick VÀ ngay sau khi
  user bấm toggle (vòng lặp có thể đang ngủ khi pause nên không được
  chờ tick) VÀ khi đổi ngôn ngữ (xem §1.5).
- Badge:
  - Đang chạy: `⏩ Decode-ahead: ĐANG CHẠY — prefetch {n} frame`,
    title = đúng chuỗi cảnh báo cổng.
  - Bị chặn: `⛔ Decode-ahead: BỊ CHẶN — {lý do đầu tiên}`,
    title = đủ các lý do (hợp qua mọi controller — xem §5.3 về thứ
    tự lý do).
  - Tắt (sau khi user đã chạm toggle): `⏩ Decode-ahead: TẮT`.
- Toast: giữ đúng hành vi T2 cho cảnh báo cổng (nguyên văn, keyed);
  thêm toast chặn (chuỗi i18n mới + lý do đã dịch, keyed theo
  decision — tắt toggle thì reset key để lần bật sau lại báo, không
  spam mỗi tick) và toast xác nhận khi tắt.
- Chuỗi cổng (warnings) KHÔNG dịch: UI hiển thị nguyên văn đúng chuỗi
  module cổng theo luật T2. Mọi chuỗi MỚI (nhãn toggle/badge, lý do
  chặn, toast chặn/tắt, gợi ý) đều qua i18n (xem §1.5).

### 1.5 i18n (`i18n/vi.json`, `i18n/en.json`, section `decodeahead`)

- 10 key giao diện + 9 key lý do (8 mã cổng + `unknown`), vi=en đủ,
  khác rỗng. `PreviewCanvas` nay gọi `useLang()` (re-render khi đổi
  ngôn ngữ) + `useEffect` refresh lại toggle/badge ngay khi locale
  đổi — vì JSX re-render sẽ reset text DOM về nhãn mặc định
  (toggleOff) nếu không refresh (bug phát hiện ở lượt click-test đầu
  cho S5, đã sửa trước khi chạy cuối).
- Kiểm tra: `node apps/web/scripts/r6-i18n-check.cjs` PASS (vi=en
  950 key); test U1 khóa section `decodeahead` không thừa/thiếu key
  nào ở cả 2 dict (xem §3).

## 2. Số đo thật (probe + click-test, không claim FPS)

### 2.1 Clip 720p 1 GOP: cổng chặn đúng

- Fixture `server/render/examples/media/clip1.mp4` (repo, 1280×720,
  240 frame, 8 s) chỉ có **đúng 1 keyframe** (ffprobe đếm packet K = 1)
  → 1 cửa sổ decode = cả file: decodeGop 240 frame mất 8.113 ms
  ≈ **29,58 fps** → cổng chặn đúng với
  `hardware-not-measured` + `software-decode-below-easy-threshold`
  (probe browser, mirror `__vcutReverseDecodeAheadStatus`).
  Bài học: không được dùng clip1 để chứng minh "bật → prefetch" —
  nó vừa chậm (dưới ngưỡng 60) vừa suy biến (1 cửa sổ duy nhất, không
  có cửa sổ tiền nhiệm để prefetch theo đúng nghĩa).

### 2.2 Fixture dễ decode cho click-test (tạo ở scratch, KHÔNG vào repo)

- `~/workspace/tmp-round38-u1/u1-easy-360p.mp4` (tạo bằng ffmpeg,
  KHÔNG đưa vào batch): testsrc2 640×360, 30 fps, 10 s, 300 frame,
  GOP 30 (10 keyframe). Click-test tự tạo lại file này bằng ffmpeg
  nếu chưa có (biến `U1_FIXTURE` ghi đè) nên lần chạy sau vẫn tái
  hiện được mà không cần binary trong repo.

### 2.3 Số đo decode dao động mạnh theo tải / cửa sổ (ghi đủ, không giấu)

Các cửa sổ decode thật đo được trong đợt này (đơn vị fps, đều nhãn
under-load — luôn có Chrome/vite/tsc của các luồng đợt 38 khác chạy
song song, KHÔNG có số quiet, cấm dùng làm baseline quiet):

| Nguồn | Các cửa sổ đo được |
|---|---|
| clip1 720p, 1 GOP | 29,58 (chặn đúng) |
| fixture 360p, lượt probe S3 | 46,46 → 28,69 → 66,40 (mở cổng ở cửa sổ 66,40) → 48,21 → 32,61 → 33,20 |
| fixture 360p, lượt probe S3b | 32,46 → 42,87 → 26,47 → 32,63 → 55,82 → 37,05 → 99,01 (mở cổng) → 10,45 (tải nặng nhất) |
| fixture 360p, click-test cuối (S2/S4) | 192,55 (mở cổng, prefetch 75) và 382,82 (mở cổng, prefetch 75) — lượt này tải nhẹ hơn hẳn các lượt trước |

Đọc đúng:
- (a) Cổng mở/chặn hoàn toàn theo số đo của đúng cửa sổ đó, không
  theo tên file hay độ phân giải: cùng fixture 360p có cửa sổ 10,45
  fps lẫn 382,82 fps tùy tải. Vì vậy click-test S2/S4 "bật → prefetch"
  chỉ claim được trong điều kiện đo đó (cửa sổ mở cổng), không claim
  "fixture 360p luôn mở cổng".
- (b) Cổng KHÔNG tự đóng lại khi cửa sổ sau đo chậm hơn trong lúc
  đang chạy (thiết kế T2: cổng chỉ xét lúc bật; auto-apply của U1
  cũng chỉ thử lại khi chưa bật). Bằng chứng: lượt click-test đợt 5
  mở cổng ở một cửa sổ nhanh rồi số đo mới nhất tụt còn 35,63 fps
  mà trạng thái vẫn "đang chạy". Đây là hành vi kế thừa từ T2, U1
  không tự ý đổi thành "re-gate mỗi cửa sổ" (đổi đó sẽ gây flapping
  và vượt phạm vi luồng) — ghi rõ để luồng sau quyết định có làm
  re-gate hay không.
- (c) Prefetch 75 frame ở click-test cuối = đúng 1 cửa sổ present
  (75 frame, GOP-align không kéo dài thêm vì cửa sổ này nằm gọn
  trong GOP); prefetch 104 frame ở click-test đợt 5 = 75 frame
  present + 29 frame kéo về đầu GOP. Cả hai đều là số frame thật
  trong `aheadRange`, không phải số ước lượng.

## 3. Kiểm chứng của luồng

- **Unit/integration mới** `reverseDecodeAheadToggle38U1.test.ts`:
  **12/12 pass** (esbuild bundle ra scratch workspace, không ra /tmp
  vì tmpfs 512M từng đầy ở S3): uiStatus 3 trạng thái (active thắng
  wanted), prefetchFrameCount (null=0, 497–579=83, ngược=0), mọi mã
  lý do có key i18n riêng + mã lạ về unknown, section decodeahead
  vi=en đủ key không thừa/thiếu, gate input (optIn=wanted, hardware
  luôn null, giữ số đo), aggregate (1 allowed thắng, warnings gộp
  không trùng, reasons hợp), mặc định registry off, toggle bật khi
  chưa có controller → chặn đúng 2 lý do chưa đo, toggle bật khi
  controller chưa có số đo → chặn không bật lén, cổng mở bằng số T2
  phiên B (124,27 fps, đúng 3 cảnh báo) và chặn bằng số phiên A
  (48,01 fps) — không đổi ngưỡng, disableDecodeAhead xóa warnings +
  aheadRange, tắt toggle tắt mọi controller registry + xóa decision.
- **Hồi quy** (cùng runner esbuild / Node strip-types như các đợt
  trước): wiring T2 12/12, gate 12/12, decodeAhead 12/12, heap S4 6/6,
  cancel T5 6/6 — không vỡ hunk T2/T5 trên cùng file controller.
- **`tsc --noEmit -p apps/web/tsconfig.json` exit 0** (chạy lúc các
  luồng đợt 38 khác vẫn đang sửa file — parent gộp cần chạy lại).
- **`vite build` pass** (lần cuối trên code cuối cùng, sau khi gỡ
  mirror chẩn đoán tạm: built in 5,40 s).
- **i18n**: `node apps/web/scripts/r6-i18n-check.cjs` PASS.
- **Click-test trên app thật** `apps/web/scripts/
  clicktest-round38-u1-decodeahead-pipe.mjs` (Chrome headless qua
  CDP + vite dev :5179, click chuột thật có hit-test, KHÔNG gọi
  store nội bộ): **6/6 pass ở lượt chạy cuối** —
  - T0: app + toggle, modal tự mở đã đóng bằng click backdrop.
  - S1 bị chặn: toggle=blocked, badge "⛔ Decode-ahead: BỊ CHẶN —
    chưa đo hardware decode", mirror reasons đúng
    `[hardware-not-measured, software-decode-not-measured]`, toast
    đúng chuỗi cổng + gợi ý "Sẽ tự thử lại ở lần decode cửa sổ mới".
  - S2 bật → prefetch tăng: prefetch=75, fps cửa sổ mở cổng
    192,55, badge "⏩ Decode-ahead: ĐANG CHẠY — prefetch 75 frame".
  - S3 tắt → dừng: sau khi playhead chạy qua biên cửa sổ,
    status=off, prefetch=0, badge "⏩ Decode-ahead: TẮT", warnings
    rỗng (toast tắt đã tự đóng sau 4,5 s trước lúc ghi record — xem
    probe mini dưới).
  - S4 bật giữa chừng → prefetch lại: prefetch=75, fps 382,82,
    badge đang chạy (bật trong lúc đang phát ngược, có tác dụng từ
    cửa sổ decode mới, đúng §0.3).
  - S5 i18n: đổi ngôn ngữ → toggle "⏩ Decode-ahead: ON" (đúng trạng
    thái running lúc đó).
- **Probe mini toast tắt** (scratch, sau lượt click-test cuối):
  click tắt → toast "Decode-ahead đã tắt: sẽ không prefetch cửa sổ
  mới nữa." xuất hiện ngay (cùng lúc với toast chặn cũ chưa hết hạn),
  toggle + badge đều "⏩ Decode-ahead: TẮT". Đây là bằng chứng toast
  tắt có bắn thật (lượt click-test cuối không bắt được nó vì record
  đọc sau khi toast đã tự đóng 4,5 s).

## 4. Ba lỗi của chính harness đo (ghi đủ, không giấu)

1. **Click rơi vào splash rồi welcome modal (2 lượt chạy đầu).**
   Splash hiện khi `!ready` (z-index 200, phủ toàn màn hình) cho tới
   khi project mẫu tải xong; welcome modal chỉ xuất hiện SAU khi
   splash tắt (`welcomeOpen && ready`) và KHÔNG tự đóng. Thứ tự chờ
   sai (kiểm tra modal trước khi splash tắt → thấy "không có modal"
   rồi kẹt ở hit-test) làm toàn bộ click-test đầu fail oan. Sửa:
   chờ toggle xuất hiện → chờ splash tắt → đóng modal bằng click
   backdrop → chờ hit-test trúng nút. `clickEl` nay kiểm tra hit-test
   trước mọi click và ném lỗi kèm tên lớp che thay vì click mù.
2. **Card media nằm ngoài vùng nhìn thấy của grid scroll.**
   `.media-grid` có `overflow-y: auto` riêng; card clip1/fixture nằm
   dưới vùng nhìn thấy thì rect của nút "＋ Thêm" rơi đúng vào nút
   ghost-btn "↺ Dự án mẫu" bên dưới grid → click sai nút. Sửa:
   `scrollIntoView({ block: "center" })` trước mọi click.
3. **Regex `\d` trong template literal bị nuốt backslash (lỗi nghiêm
   trọng nhất, làm S3 fail oan 2 lượt).** `TIME_JS` viết regex
   `/(\d+):.../` trong template literal: `\d` không phải escape hợp
   lệ nên thành chữ `d`, regex không bao giờ khớp giờ → hàm đo
   chuyển động luôn trả null dù phát ngược vẫn chạy (wc misses vẫn
   tăng đều). Sửa: viết `\\d` / `\\.` trong template literal, kèm
   ghi chú cảnh báo ngay trong script. Đây là lỗi của script đo,
   không phải của code sản phẩm — nhưng nó đã làm S3 báo sai 2 lượt
   nên ghi rõ để không ai "sửa" code sản phẩm theo kết quả sai đó.

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Bật giữa chừng vẫn cần một lần decode cửa sổ mới.** Nếu user
   bật toggle khi đang giữ cửa sổ cũ (chưa đổi cửa sổ), không có
   prefetch nào xuất hiện cho tới khi decode cửa sổ mới — vì buffer
   file của cửa sổ cũ đã nhả (giới hạn kế thừa từ T2). U1 chỉ thu hẹp
   giới hạn này (cửa sổ mới đó prefetch ngay cho chính nó) chứ không
   xóa được nó. Sửa triệt để cần giữ lại buffer file của cửa sổ đang
   giữ (tốn bộ nhớ đúng 1 file, ngoài phạm vi luồng này).
2. **Tắt giữa chừng và prefetch đang bay.** Tắt chỉ chặn prefetch
   MỚI; 1 prefetch đang bay có thể hoàn tất sau khi tắt (frame vào
   cache nhưng `aheadRange` đã null nên badge báo 0 — không mạo nhận
   là đang chạy). Chưa có test browser nào bắt đúng khoảnh khắc này
   (cửa sổ bay ngắn, khó bắt xác định).
3. **Không có re-gate liên tục khi đang chạy** (xem §2.3b): cửa sổ
   sau đo chậm hơn không tự đóng decode-ahead đang chạy. Luồng sau
   cần quyết định có làm re-gate (kèm chống flapping) hay giữ nguyên
   luật T2.
4. **Hợp lý do chặn qua nhiều controller (§5.3).** Badge hiện lý do
   đầu tiên theo thứ tự cổng; title hiện đủ. Khi nhiều controller
   cùng tồn tại (vd clip fixture + clip mẫu webm không decode được),
   reasons là hợp của tất cả — có thể hiện thêm
   `software-decode-not-measured` của clip mẫu dù clip fixture bị
   chặn vì dưới ngưỡng. Đây là hiển thị hợp lệ theo cổng (mỗi lý do
   đều đúng cho ít nhất 1 controller) nhưng có thể gây hiểu nhầm;
   chưa tách hiển thị theo từng controller.
5. **Chưa chứng minh:** đo quiet có điều phối (mọi số đợt này đều
   under-load, các luồng đợt 38 khác chạy song song); máy có GPU thật
   (VM này `prefer-hardware: false`, HW proof luôn null trong app);
   Safari / máy thật / dpr > 1; đường `asset:`; proxy 4K→720p; phiên
   chạy dài / discard / tab ẩn hàng giờ. KHÔNG claim FPS: mọi con số
   trên chỉ là số đo cửa sổ decode để xét cổng, không phải fps hiển
   thị ngược.
6. **Vite dev server đã dừng sau khi đo xong** (cổng 5179 không còn
   nghe); script click-test giả định dev server đang chạy ở 5179
   (xem header script) — chạy lại cần khởi động vite trước.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/lib/reverseWebcodecs.ts` (hunk U1: cờ wanted +
  status registry + ghi số đo + auto-apply trước khối prefetch T2;
  giữ nguyên hunk T2/T5 của các luồng khác trên cùng file).
- Mới: `apps/web/src/lib/reverseDecodeAheadToggle.ts` (logic thuần:
  uiStatus, prefetchFrameCount, gate input, key lý do, aggregate).
- Sửa: `apps/web/src/preview.tsx` (hunk U1: nút toggle + refresh
  toggle/badge + effect đổi ngôn ngữ; khối badge T2 cũ được thay
  bằng lời gọi `refreshDecodeAheadUi()` trong vòng lặp).
- Sửa: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
  (section `decodeahead`, vi=en đủ key).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới;
  file này các luồng đợt 38 khác cũng đang sửa — parent đối chiếu
  khi gộp, hunk U1 chỉ là dòng đó).
- Mới: `apps/web/src/lib/reverseDecodeAheadToggle38U1.test.ts`
  (12/12).
- Mới: `apps/web/scripts/clicktest-round38-u1-decodeahead-pipe.mjs`
  (click-test app thật 6/6; tự tạo fixture 360p bằng ffmpeg nếu chưa
  có — fixture nằm ở scratch ngoài repo, không vào batch).
- Mới: `docs/PHASE9_ROUND38_U1_Q3_TOGGLE_LIMITS.md` (file này).
- Không sửa: `reversePreviewGate.ts` (không đổi ngưỡng 60 fps, không
  đổi chuỗi cổng), `reverseDecodeAhead.ts`, `mp4Demux.ts`,
  `reversePlayback.ts`, store, bridge, paths-loop, build-loop-log.
  Scratch chỉ nằm ngoài repo (`~/workspace/tmp-round38-u1/` — bundle
  test, log vite, fixture 360p, probe debug; `dist/` do `vite build`
  tạo ra cũng KHÔNG đưa vào batch theo tiền lệ các đợt).
- Không còn sót code chẩn đoán tạm: mirror `__vcutU1MeasureDebug`
  thêm trong lúc probe đã gỡ trước khi chạy kiểm chứng cuối
  (grep = 0); mirror chính thức duy nhất còn lại là
  `__vcutReverseDecodeAheadStatus` của `reverseDecodeAheadStatus()`.
