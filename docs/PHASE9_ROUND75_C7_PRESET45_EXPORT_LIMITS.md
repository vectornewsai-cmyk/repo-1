# Phase 9 đợt 75 C7 — Preset 4:5 nối vào ExportPanel flow chính + export thật end-to-end

> Ngày: 09/11/2026. Luồng C7, đợt 75. Đóng nợ đợt 74 §4.8:
> preset `ig-portrait` 1080×1350 đã có (A9) + đã render MP4 thật qua
> `render.js` trực tiếp (B5), nhưng chưa có bằng chứng đi đúng flow
> ExportPanel chính (chọn preset trong panel → bấm Xuất → bridge →
> MP4 1080×1350).

## 0. Phát hiện đầu tiên: flow đã nối sẵn ở tầng code, thiếu bằng chứng E2E

Kiểm tra code trước khi sửa (grep + đọc `ExportPanel.tsx`,
`exportPresets.ts`, `safeArea.ts`, `exportPresetSelection.ts`):

- Select `#export-preset` render `EXPORT_PRESETS.map(...)` nên đã liệt
  kê `ig-portrait` từ A9 — không thiếu option.
- `startRender` đã clone spec + override `meta` theo `activePreset`
  (width/height/fps) và gửi preset JSON `{crf, x264Preset,
  audioBitrateKbps}` qua bridge (R1-042) — không thiếu đường render.
- `setSelectedExportPreset(presetId)` đã publish preset sang preview để
  overlay safe-area tự đổi nền tảng (A9) — B5 đã click-test 22/22.
- i18n đã có `exportPreset.igPortraitLabel` /
  `exportPreset.igPortraitDesc` (vi + en).

Vì vậy luồng này **không sửa code app** (không đụng `ExportPanel.tsx` /
`preview.tsx` — đang dùng chung với luồng C6 đợt 75): việc còn lại là
chứng minh flow thật chạy được từ UI tới MP4, và để lại script click-test
E2E chạy lại được. Nếu E2E lộ bug thì mới sửa — và nó đã chạy xanh ngay
(không cần sửa gì thêm).

## 1. Đã làm gì

1. **Script click-test E2E mới**
   `apps/web/e2e/preset45-export-e2e-75c7.cdp.mjs` (mẫu CDP của B5,
   Chromium 1254 headless qua WebSocket Node 24, không cần
   `@playwright/test`): load app → đóng welcome modal → bật toggle
   "Vùng an toàn" → mở panel Xuất bản → chọn preset `ig-portrait` →
   bấm nút "🎬 Xuất MP4 (1080×1350)" bằng chuột thật
   (`Input.dispatchMouseEvent`) → chờ khối tiến trình → poll bridge tới
   khi job done → tải MP4 qua `GET /api/render/:id/download` → ffprobe
   verify + kiểm tra nội dung pixel (vùng video giữa vs viền đen trên).
   Chạy với bridge cổng 8787 + `vite preview` cổng 4175 (cổng riêng để
   khỏi đụng B5 4173 / luồng khác), dist đã build sẵn từ lúc parent gộp
   đợt 74 (không build lại trong script để khỏi đua với luồng khác).
2. **Không thêm key i18n nào** (không có chuỗi UI mới — xem §4 về dict).

## 2. Kiểm chứng (số thật)

| Kiểm tra | Kết quả |
|---|---|
| E2E CDP `preset45-export-e2e-75c7.cdp.mjs` (mới) | **20/20 pass** — xem §3 |
| Chạy E2E lần 1 (trước khi sửa bẫy CDP, xem §5) | 9/10 — job render thật **đã done** trên bridge (QA `1080x1350`, 951.768 byte) dù script báo timeout |
| `test_export_preset45_74b5.js` (B5, regression) | **17/17 pass** |
| `safeArea73A9.test.ts` (regression) | **13/13 pass** |
| `tsc` + `vite build` (`npm run build`, apps/web) | **pass** (tsc 0 lỗi, vite build 9,50s) |
| `r6-i18n-check.cjs` | **PASS** — vi==en (xem §4: 2405 lúc bắt đầu, 2413 lúc kết thúc do luồng khác) |
| `ProjectMenu.i18n55L1.test.ts` (snapshot khóa số key) | **5/6 — FAIL 1 assert `2413 !== 2405`** do luồng khác thêm key, xem §4 |

### E2E lần 2 — chi tiết (20 assert)

- App load: brand "VCut Studio", timeline hiện, welcome modal đóng bằng
  nút ✕ thật. Project mẫu: 2 clip video × 4s + text, meta 1280×720.
- Toggle safe-area: preset mặc định 1080p → overlay platform `youtube`.
- Select Xuất bản có đủ 8 option
  (`720p, 1080p, 4k, tiktok, youtube, ig-square, ig-portrait, custom`):
  `ig-portrait` có mặt, không mất preset cũ.
- Chọn `ig-portrait` → mô tả `1080×1350 @30fps · CRF 21 · medium ·
  audio 128k`; nút Xuất đổi nhãn `🎬 Xuất MP4 (1080×1350)`; overlay
  safe-area tự đổi sang `instagram-portrait`.
- Bấm Xuất bằng chuột thật → khối `.render-progress` xuất hiện; poll
  bridge: `running 0% → 99%`, job `161252c1b3851dad` **done sau 28,9s**
  (8s video, 240 frame → ≈ 8,3 fps render trên VM CPU-only);
  panel hiện banner done.
- Tải MP4 về: **913.532 byte**, `GET download` 200; ffprobe:
  **width 1080, height 1350, r_frame_rate 30/1, avg 30/1,
  codec h264, duration 8,000s, nb_read_frames 240** (= 30fps × 8s).
- Nội dung pixel: dải video giữa (crop 1080×810 ở y=270) **YAVG ≈ 36,6**
  (có nội dung thật, không phải khung đen); viền trên (crop 1080×270 ở
  y=0) **YAVG = 0** (đen tuyệt đối) — đúng kiểu letterbox: nguồn mẫu
  640×360 (16:9) được scale vừa chiều rộng 1080 → cao 608, đặt giữa
  khung 1080×1350, chừa viền đen trên/dưới. Bridge QA report của job
  cũng `ok: true` (fileSize / h264 / aac / duration 8 / resolution
  1080x1350).

## 3. Giới hạn trung thực

- **Click-test là Chromium headless qua CDP, KHÔNG phải headed GUI**
  (VM không có màn hình/X): click chuột thật + render thật trong
  browser, nhưng không có cửa sổ hiển thị để mắt người xem trực tiếp.
- **Chỉ kiểm chứng với project mẫu** (video mẫu do canvas +
  MediaRecorder sinh trong browser, 640×360 webm, 2 clip × 4s + text):
  chứng minh preset map đúng kích thước/fps/CRF qua đúng flow UI +
  bridge, chưa export 4:5 với footage thật do user quay/import hay
  project có effect/mask phức tạp — nhưng `render.js` không có nhánh
  riêng theo tỉ lệ khung (B5 đã nêu), rủi ro còn lại là thấp.
- **Xuất 4:5 từ nguồn 16:9 thì letterbox (viền đen trên/dưới), không tự
  crop/reframe**: muốn lấp đầy khung 4:5 thì user dùng Auto-reframe
  (mục riêng trong ExportPanel, hỗ trợ 4:5) hoặc quay dọc từ đầu. Đây
  là hành vi đúng của preset (giữ nguyên tỉ lệ nguồn), không phải bug —
  nhưng user chọn preset 4:5 cho video ngang sẽ thấy viền đen, panel
  không cảnh báo điều này (nợ nhỏ, xem §6).
- **Render đo trên VM CPU-only, project mẫu nhẹ**: 8,3 fps (≈ 28,9s
  cho 8s video 1080×1350) không đại diện cho footage thật
  (benchmark 1080p ~12fps của repo vẫn đúng cho video thật).
- **Không sửa code app nên không cần bump snapshot i18n/CSS**: file duy
  nhất thêm là script e2e + LIMITS này; `vite build` chạy lại chỉ để
  kiểm chứng (dist không stage).
- **Dọn dẹp:** bridge 8787 + preview 4175 đã tắt sau khi test xong
  (kill theo PID, không dùng `pkill -f` — bài học B5); MP4 tải về chỉ
  nằm ở `/tmp/preset45-75c7.mp4` (không stage, không commit); job
  bridge nằm trong `/tmp/vcut-bridge-jobs/` (dọn theo chính sách bridge).

## 4. i18n: luồng này +0 key; dict đổi do luồng khác (cần parent gộp lưu ý)

- Lúc bắt đầu luồng: `r6-i18n-check` vi=**2405** en=**2405**, PASS.
- Luồng này **không thêm/bớt key nào** (không có chuỗi UI mới).
- Lúc kết thúc luồng: vi=**2413** en=**2413** (+8 key), `r6-i18n-check`
  vẫn PASS — `vi.json`/`en.json` bị sửa lúc 14:45 UTC bởi một luồng
  đợt 75 khác (trong lúc luồng này đang chạy E2E; lúc đó đã có
  `round75-c1/c2/c4/c8/c9` và `phase9-round75-c9-*.txt` trên đĩa).
- Hệ quả đo được: test khóa số key `ProjectMenu.i18n55L1.test.ts`
  hiện **5/6, fail assert `2413 !== 2405`** (chạy lại 2 lần, cùng kết
  quả); các file khóa 2405 khác (`i18nAudit59P7`, `i18nRound57N4`,
  `reverseBadge46B6`) cùng chung số cũ nên sẽ fail tương tự.
- **Không tự bump**: key là của luồng khác, luồng đó phải tự bump các
  snapshot theo quy ước (như B3 đợt 74 đã tự bump 12 snapshot, B9 tự
  bump) — C7 bump hộ sẽ xung đột khi luồng kia cũng bump. Parent gộp
  kiểm tra lại sau khi mọi luồng đợt 75 xong: dict phải vi==en và mọi
  snapshot khóa đúng số cuối.

## 5. Bẫy đã gặp khi click-test (ghi lại cho lượt sau)

`Runtime.evaluate` với `returnByValue: true` trả `value: undefined`
khi expression trả về **DOM node** (object subtype node không
serialize được) — `waitFor` nhận falsy mãi dù element đã có. Lần chạy
E2E 1 của luồng này đã timeout ở `document.querySelector(
".render-progress")` trong khi job render thật đã done 1080×1350 trên
bridge (job `75576f38a2606d57`, QA ok, 951.768 byte). Mọi expression chờ
trong `waitFor` **phải trả boolean** (`!!document.querySelector(...)`,
`.length > 0`, `.value === ...`) — B5 đã dùng đúng mẫu này ở mọi chỗ,
luồng này chỉ sót 2 chỗ. Đã sửa trong script + ghi chú trong header
script. Script lần 2 chạy **20/20**.

## 6. Nợ mở / lưu ý cho parent gộp

- Dict i18n + snapshot khóa số key: xem §4 — chờ luồng thêm 8 key bump
  xong, parent gộp chạy lại `r6-i18n-check` + `ProjectMenu.i18n55L1`
  trước khi coi đợt 75 xanh.
- Panel Xuất bản không cảnh báo khi preset 4:5 gặp nguồn 16:9 (xuất ra
  viền đen trên/dưới): gợi ý đợt sau thêm dòng hint (cần key i18n mới
  — để luồng làm i18n gộp chung, tránh thêm key lẻ trong đợt này).
- `timeline .clip` trong DOM trả 0 ở bước [1] của script (chỉ là log
  thông tin, không assert): selector đó không khớp class clip thật —
  ai dùng lại script thì đừng dựa vào số này để đếm clip mẫu.
- Không đụng `ExportPanel.tsx` / `preview.tsx` nên không xung đột với
  luồng C6; không đụng file i18n nên không xung đột với luồng thêm key.

## 7. File stage (batch `phase9-round75-c7-preset45-export.txt`)

2 file text, đường dẫn tương đối từ gốc repo — xem file paths đã stage.
Không binary, không workflow. Không push (theo luật cứng).
