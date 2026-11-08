# PHASE9 ROUND 56 M9 — SSR BRANCHES LIMITS

Đợt 56, luồng M9: đo trên browser thật 4 nhánh SSR mà đợt 55 L2 ghi nợ
"nhánh SSR không đo được". Ngày 2026-11-07. **KHÔNG push, KHÔNG
release/tag, KHÔNG sửa code sản phẩm** (chỉ đọc + harness đo).

## 0. Kết quả tổng (lượt đo cuối, run #5 — xem §6 về các lần chạy trước)

| Nhánh | Verdict | Tóm tắt |
|---|---|---|
| (a) EnhancePanel tipGone | **KHÔNG ĐO ĐƯỢC** | Nhánh không tới được qua UI thật (Inspector chặn trước) — chỉ khóa source + dict |
| (b) SilenceModal step-done | **FAIL** | Nút Close đã EN `"Close"`, nhưng resultMsg cùng step hiện raw key `"✅ silence.cutDone"` |
| (c) HistoryPanel nút Xoá | **PASS** (nút) / **FAIL** (xung quanh) | Nút Xoá đúng EN `"🗑 Delete"`; panel chrome + dialog confirm hiện raw key `history.*` |
| (d) TemplatePackModal bridge-lỗi | **PASS** / **PASS** | `common.bridgeConn` đúng EN từng chữ (bridge sập); `tts.bridgeEmpty` đúng EN từng chữ (qua stub, xem §4) |
| (H) 0 lỗi trang | **PASS** | Không có `window.onerror` / `unhandledrejection` trong phiên |

Tổng: **4 PASS / 3 FAIL / 1 KHÔNG ĐO ĐƯỢC** (8 verdict, gồm cả H).

## 1. Môi trường đo (lượt cuối)

- **Vite dev ĐÓNG BĂNG**: config scratch
  `~/scratch-round56-m9/vite.m9.config.mjs` (kế thừa
  `apps/web/vite.config.ts`, thêm `server.hmr: false` +
  `server.watch.ignored: ["**/*"]`). Lý do: các luồng round-56 khác đang
  sửa file liên tục; vite dev mặc định HMR/full-reload trang giữa chừng
  làm mất state React — đã làm sai 2 phép đo ở lần chạy #2 (xem §6).
- **Browser thật**: Chromium headed qua Xvfb **display :160** (riêng,
  kiểm tra trống trước khi dùng), cửa sổ 1440x900, CDP Node thuần
  (tái dùng pattern `clicktest-55l1` của L1), TMPDIR riêng
  `/tmp/round56-m9/tmp`, profile Chrome mới mỗi lần chạy.
- **Ngôn ngữ**: `localStorage vcut-lang=en` + reload; xác minh TopBar
  hiện `"Get started"`.
- **Bridge thật** cho (b): `server/bridge` chạy bằng `node src/index.js`
  (deps resolve từ `node_modules` gốc — `npm install` riêng trong
  `server/bridge` thất bại nhanh, không rõ nguyên nhân, nhưng bridge
  chạy tốt nhờ hoisting; `/api/health` trả `ok:true`, ffmpeg 8.1.2).
  **Stub bridge** cho (d)-bridgeEmpty: server Node nhỏ ở cổng 8787,
  `POST /api/tts` trả 200 + body rỗng, **có CORS** (xem §4).
- **WAV mẫu cho (b)**: tự sinh trong trang (3s, 16kHz mono 16-bit:
  1s tone 440Hz + 1s im lặng + 1s tone), import qua store thật
  (`importFiles` + `addMediaAtPlayhead`), bridge `/api/silence` trả
  đúng 1 khoảng lặng `[1.0, 2.0]` (đã kiểm chứng riêng bằng curl:
  0.245s).
- **Snapshot code lúc đo** (sha256-16 + mtime, trong
  `m9-headed-report.json`): `HistoryPanel.tsx` ef39573a… 05:43:01,
  `EnhancePanel.tsx` 63ba42f7… 05:43:39, `SilenceModal.tsx`
  e8fae0ff… 05:50:21, `TemplatePackModal.tsx` 9cf250de… 05:43:30,
  `Inspector.tsx` dfbb837a… 05:44:35, `i18n/en.json` 61e2f5f0…
  02:44:04, `i18n/vi.json` 7f61419f… 02:44:04.

## 2. Bối cảnh bắt buộc phải đọc trước kết quả

**Các file đích đã bị luồng round-56 khác viết lại TRƯỚC khi M9 đo,
nhưng dict chưa được gộp.** `HistoryPanel.tsx`, `EnhancePanel.tsx`,
`SilenceModal.tsx`, `TemplatePackModal.tsx` đều đổi sang
`t("history.*")` / `t("enhance.*")` / `t("silence.*")` trong khoảng
05:43–05:50 ngày 07/11, trong khi `apps/web/src/i18n/en.json` và
`vi.json` (sửa lần cuối 02:44) **không có các section `history`,
`silence`, `enhance`**. Hàm `t()` fallback EN → VI → **trả về đúng
key** (`apps/web/src/i18n/index.ts`), nên ở chế độ EN các panel này
hiện **raw key** thay vì chuỗi dịch. Đây KHÔNG phải literal tiếng Việt,
nhưng cũng KHÔNG phải tiếng Anh — verdict FAIL ở dưới tính theo nghĩa
"người dùng EN nhìn thấy thứ không phải tiếng Anh".

Dict snapshot lúc đo (cả `en.json` và `vi.json` giống nhau):

| Key | Có trong dict? |
|---|---|
| `keyframe.tipGone`, `common.close`, `topbar.deleteShort`, `tts.bridgeEmpty`, `common.bridgeConn` | ✅ có (cả 2 dict) |
| `silence.cutDone`, `silence.analyze`, `silence.cut`, `history.snapshot`, `history.title`, `history.deleteConfirm`, `enhance.selectClip` | ❌ không có (cả 2 dict) |

Các fragment `apps/web/src/i18n/fragments/round56-m5.json` /
`round56-m6.json` (của luồng khác) chứa các section `curveErr`,
`nested`, `twoLevel`, `curveFix`, `projectRepo`, `preview`,
`projectHistory`, `subtitles`, `templateEngine`, `templatePack` —
**không chứa** `history` / `silence` / `enhance`. Việc gộp key cho 3
nhóm này (nếu có) chưa diễn ra lúc M9 đo; đo lại sau khi dict được
gộp sẽ đổi verdict của (b) và (c).

## 3. Kết quả từng nhánh

### (a) EnhancePanel tipGone — KHÔNG ĐO ĐƯỢC (nhánh không tới được)

- Control dương (clip video thật từ project mẫu, đã xác minh selection
  đăng ký trong store): Inspector chuyển sang panel clip
  (`"🎬 VIDEO"`, `"OPACITY: 100%"`, `"🔊 ORIGINAL AUDIO"`), có nhắc
  `"enhance"`.
- Ghost selection (`{trackId: "ghost-track-m9", clipId: "ghost-clip-m9"}`,
  đã xác minh đăng ký trong store): Inspector render **ProjectInfo**
  (head `"ℹ️ PROJECT"`), **không có chuỗi tipGone nào trong DOM**
  (cả `"The clip no longer exists."` lẫn `"Clip không còn tồn tại."`),
  `.mask-panel` = 0.
- Nguyên nhân (đọc code): `Inspector.tsx:196`
  `if (!track || !clip) return <ProjectInfo />;` chặn trước khi
  `EnhancePanel` render; `EnhancePanel` chỉ được render ở
  `Inspector.tsx:378`, bên trong nhánh clip-tồn-tại. Nhánh `tipGone`
  (`EnhancePanel.tsx:78`, `t("keyframe.tipGone")`) là **dead branch qua
  UI thật**. Chỉ khóa được ở mức source + dict — đúng như L2 đã ghi;
  M9 bổ sung bằng chứng headed + control dương.
- Lưu ý: toàn bộ `EnhancePanel` ở EN hiện cũng render raw key
  (`enhance.*` chưa có trong dict) — ngoài phạm vi nhánh tipGone
  nhưng cùng nguyên nhân §2.

### (b) SilenceModal step-done — FAIL (nút EN, thông báo raw key)

Đường đo thật đầy đủ: WAV mẫu (tone–im lặng–tone) → import →
`POST /api/silence` qua bridge thật → review tìm thấy **1 khoảng lặng**
(`00:00:01:00 → 00:00:02:00`, `1.0s`) → bấm cắt → step done.
`removeSilence` chạy thật (timeline còn 2 clip audio sau khi cắt).

- Nút Close ở step done: **`"Close"`** — đúng EN (`t("common.close")`,
  key đã có trong dict). ✅
- ResultMsg ở cùng step done: **`"✅ silence.cutDone"`** — raw key
  (`t("silence.cutDone")`, key chưa có trong dict). ❌
- Các bước trước cũng toàn raw key ở EN: tiêu đề `"silence.titleIcon"`,
  `"silence.intro"`, `"silence.analyze"`, `"silence.foundAll"`,
  `"silence.cut"`, `"silence.backToParams"`. Không còn literal VI nào
  trong modal (bản rewrite đã thay hết literal VI bằng `t()`), nhưng
  chưa có dict nên hiện key.
- **Phát hiện phụ (layout thật)**: ở viewport 1440x900, `SilenceModal`
  cao hơn viewport — hàng nút (Cancel / Analyze) nằm **dưới fold**.
  Click chuột theo tọa độ đo lúc chưa scroll rơi nhầm vào slider
  (40s poll không có request `/api/silence` nào, modal kẹt ở config,
  0 lỗi trang). Harness đã sửa bằng `scrollIntoView` + hit-test trước
  khi click (xem §5). Người dùng thật vẫn bấm được sau khi cuộn, nhưng
  nút không nhìn thấy ngay là một lỗi UX nên ghi lại.

### (c) HistoryPanel nút Xoá — PASS (nút) / FAIL (xung quanh)

Đường đo thật: mở HistoryPanel → bấm snapshot → version xuất hiện
trong IndexedDB thật → đọc nút Xoá → bấm Xoá thật (dialog auto-accept).

- Nút Xoá trong row: **`"🗑 Delete"`** — đúng EN từng chữ
  (`t("topbar.deleteShort")`, key đã có trong dict). ✅
- Panel chrome ở EN toàn raw key: `"history.title"`,
  `"history.note"`, `"history.snapshot"`, `"history.export"`,
  `"history.import"`, `"history.colTime"`, `"history.colLabel"`,
  `"history.colChanges"`, `"history.restore"`. ❌
- Dialog confirm khi bấm Xoá: **`"history.deleteConfirm"`** — raw key
  (key chưa có trong dict; `window.confirm(t("history.deleteConfirm",
  { time }))`). ❌
- **Literal VI còn sót trong row** (ngoài `HistoryPanel.tsx`):
  summary của version đầu là `"Phiên bản đầu tiên của project."`
  (từ `projectHistory.ts:125`,
  `trKey(lookup, "projectHistory.firstVersion", {}, "Phiên bản đầu tiên
  của project.")` — fallback VI vì key chưa resolve ở runtime; test
  của luồng M6 đã có EN `"First version of the project."` cho key này,
  nên sẽ hết VI sau khi dict/lookup được gộp). Ngoài ra ngày trong row
  dùng `toLocaleDateString("vi-VN")` hardcode (định dạng ngày kiểu VN
  cả ở chế độ EN).

### (d) TemplatePackModal bridge-lỗi — PASS / PASS

- **Bridge sập** (không có gì nghe ở 8787): sau khi tạo pack xong,
  bấm `"🎙 Generate sample voiceover"` → ttsMsg đúng EN từng chữ:
  `"Cannot connect to bridge (http://127.0.0.1:8787). Run: cd
  server/bridge && npm start"` (`t("common.bridgeConn")`). ✅
- **Bridge trả blob rỗng**: stub bridge trả `POST /api/tts` 200 +
  body rỗng → ttsMsg đúng EN từng chữ:
  `"❌ Bridge returned an empty file."` (`t("tts.bridgeEmpty")`). ✅
  **Giới hạn**: đo qua stub, không phải bridge thật — bridge thật
  không có đường nào tự nhiên trả blob rỗng 200 (TTS thật hoặc trả
  audio, hoặc trả lỗi HTTP → nhánh khác). Code path qua component là
  thật (fetch → `blob.size === 0` → throw → catch → `ttsMsg`).

## 4. Lỗi harness đã bắt được trong lúc đo (ghi để khỏi hiểu nhầm log cũ)

1. **Stub bridge thiếu CORS** (lần chạy #2): `POST /api/tts` dùng
   `Content-Type: application/json` nên trình duyệt preflight OPTIONS;
   stub trả 404 không kèm `Access-Control-Allow-Origin` → fetch bị
   chặn → rơi nhầm vào nhánh `bridgeConn`. Đã sửa stub (OPTIONS 204 +
   ACAO `*` cho mọi response); lần chạy #3 trở đi `bridgeEmpty` PASS.
2. **HMR reload làm mất state** (lần chạy #2): các luồng khác sửa file
   liên tục → vite dev HMR/full-reload giữa chừng → selection và media
   trong store bị reset → control (a) sai và (b) báo nút Cut silence
   disabled. Đã sửa bằng vite config đóng băng (§1); lần chạy #3 trở
   đi ổn định.
3. **Hai verdict PASS sai đã bắt và sửa trước lượt cuối**: lần chạy #2
   `(c) delete-confirm` PASS nhầm vì chỉ check "không có VI" mà bỏ qua
   raw key; lần chạy #4 `(b) done-Close` PASS nhầm vì regex raw key yêu
   cầu toàn chuỗi trong khi `okText` là `"✅ silence.cutDone"` (có tiền
   tố ✅). Logic đã sửa (check "chứa raw key"); **verdict cuối lấy từ
   lần chạy #5**.

## 5. Harness (không đưa vào stage)

- `~/scratch-round56-m9/clicktest-56m9-ssr-branches.mjs` (harness chính,
  tái dùng pattern CDP của `clicktest-55l1`), config đóng băng
  `~/scratch-round56-m9/vite.m9.config.mjs`, 2 probe chẩn đoán
  (`probe-56m9-history2.mjs`, `probe-56m9-silence.mjs`) và probe debug
  (`probe-56m9-debug.mjs`, `probe-56m9-store.mjs`).
- Bằng chứng (log + screenshot) tại
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round56-m9/`:
  `m9-headed-report.json` (8 verdict + dict snapshot + code snapshot),
  `m9-topbar-en.png`, `m9-a-enhance-real-clip.png`,
  `m9-a-enhance-ghost-selection.png`, `m9-b-silence-review.png`,
  `m9-b-silence-done.png`, `m9-c-history-row.png`,
  `m9-c-history-after-delete.png`, `m9-d-tts-bridgeconn.png`,
  `m9-d-tts-bridgeempty.png`, `m9-probe4-silence-modal.png` (modal
  tràn viewport).
- Lệnh chạy (từ gốc repo):
  `node ~/scratch-round56-m9/clicktest-56m9-ssr-branches.mjs`
  (tự chọn cổng dev 5360–5369, debug 9460–9469, display `:160`).

## 6. Hạn chế / nợ

- (a) tipGone: không đo được qua UI thật vì nhánh chết (Inspector gate)
  — muốn đo phải render `EnhancePanel` trực tiếp ngoài Inspector, tức
  là sửa code sản phẩm, không làm.
- (d) bridgeEmpty: chỉ đo qua stub (xem §3).
- Kết quả này là snapshot lúc 06:19 ngày 07/11 (dict chưa gộp
  `history`/`silence`/`enhance`). Sau khi luồng khác gộp dict, (b) và
  (c) cần đo lại — kỳ vọng các raw key thành chuỗi EN.
- Các luồng round-56 khác vẫn đang sửa cây lúc M9 chạy (file mới nhất
  đổi lúc ~06:07); nhờ vite đóng băng nên lần đo cuối không bị nhiễu,
  nhưng code trên đĩa sau đó có thể đã khác snapshot §1.
- Không push, không release/tag (luật cứng của đợt).
