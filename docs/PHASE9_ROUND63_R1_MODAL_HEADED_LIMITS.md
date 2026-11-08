# Phase 9 đợt 63, luồng R1 — LIMITS: kiểm chứng headed toàn diện modal/mobile

Ngày: 08/11/2026. Mục tiêu: đóng nợ đợt 62 §4 mục 1 + một phần mục 10 —
đo headed từng modal khác (ngoài CaptionModal đã đo ở đợt 62 R1/R10) ở
viewport 390px, toast+tour cùng lúc modal mở, click thật nút chính khi panel
FPS mở, Escape lúc translate, lỗi timeout pack dưới fold, phase text caption
chưa localize.

## Kết quả headed cuối cùng: 16/16 PASS (lần chạy 4, EXIT=0)

Harness: `apps/web/scripts/clicktest-63r1-modal-headed.mjs` — vite dev (config
riêng, HMR tắt) + Chromium 1254 headed qua Xvfb + CDP Node thuần (mẫu R1/R10),
bridge thật (`node server/bridge/src/index.js`, cổng tự chọn, TTS
`server/tts/.venv2/bin/python`, caption `server/caption/.venv/bin/python`).
Tiêu chí verdict: **elementFromPoint**, không phải diện tích giao nhau hình
học — pill/panel nằm DƯỚI backdrop thì giao hình học còn nguyên nhưng không
che/không nhận click. Evidence lần chạy 4:
`workspace/goals/capcut-clone-video-editor/hidden_files/round63-r1/headed/`
(`r1-harness-run4.log`, `r1-headed-report.json`, `r1-measure-*.json`,
`r1-*.png`, `r1-bridge.log`, `r1-vite.log`, `r1-chrome.log`).

| Case | Kết quả (lần 4) |
|---|---|
| M0 setup | PASS — 3 clip, media bin 2 item, locale vi |
| M1 SilenceModal | PASS — nút "🔍 Phân tích khoảng lặng" 184.5×44 tại (174.5, 783); giao pill 1996.8px² hình học nhưng hit trong dialog (pill dưới backdrop) |
| M2 TemplatePicker (bước 2) | PASS — nút "Tạo project từ mẫu" 143.1×44 tại (195.9, 765); giao pill 655.2px² hình học, hit = nút |
| M3 ExportPanel | PASS — nút "🎬 Xuất MP4 (1920×1080)" 190.4×44, cần scrollIntoView (nằm dưới fold lúc mở) |
| M4 WelcomeModal | PASS — nút "▶ Xem project mẫu" 147.7×44 tại (43, 592) |
| M5 TemplatePackModal (pack đầu + cuối) | PASS — 2 nút "Tạo ngay" 83.3×44, pack cuối cần scrollIntoView |
| M6 SceneModal | PASS **sau sửa sheet** — nút "Quét chuyển cảnh" 140.5×44 tại (184.9, 783); giao pill 682.5px² hình học, hit = nút; hit tại tâm pill cũ giờ là nút "Huỷ" trong dialog |
| M7 BeatSyncModal | PASS **sau sửa sheet** — nút "Phân tích beat" 114×44 tại (184.3, 783); giao pill 0px², hit = nút |
| M8 StorageCleanupPanel | PASS **sau sửa sheet** — nút "Xóa đã chọn (0)" 112.7×44 tại (268.6, 673.5); giao pill 0px², hit = nút |
| M9 toast + tour cùng lúc modal mở | PASS (đo đầy đủ) — tour-card 340×281 tại (34, 547) z=450, giao tour-nút = **6776px² = TRỌN nút chính** "🎙 Bắt đầu tạo phụ đề" (154×44); toast 351×66 z=500, giao toast-nút cũng 6776px²; hit tại tâm nút = TOAST lúc đo; sau khi toast tự tắt (~4.5s), hit = nút "Tiếp →Bỏ qua" của tour-card (ngoài dialog) — xem "Phát hiện chưa sửa" |
| M10 click thật nút chính khi panel FPS mở | PASS — click tại tâm vùng giao nhau panel∩nút (266.8, 805.0), giao 8118px²; modal sang running "Đang phân tích…"; panel FPS vẫn mở phía dưới (fpsPanelOpen=true), click không rơi vào panel |
| M11 Escape lúc translate | PASS lần 1 — Start → caption chạy 39s → phase "Translating to English (long videos may take a few minutes)…" → Escape → modal đóng trong 1.5s; các phase đã thấy: "File received, preparing…" \| "Extracting audio…" \| "Recognizing speech (long videos may take a few minutes)…" \| "Grouping caption lines…" \| "Translating to English (long videos may take a few minutes)…" |
| M12 lỗi timeout pack | PASS — lỗi hiện sau 20504ms (kỳ vọng ~20000ms); thấy TRỌN 100% (top 761–825 trong modal 48–844); `.modal-body` tự cuộn 0 → 153 (scrollHeight 917, clientHeight 677); Escape đóng được modal |
| M13 phase text caption locale en | PASS — 65s, kết thúc ở bước review; 4 chuỗi en hợp lệ ("File received, preparing…" \| "Extracting audio…" \| "Recognizing speech (long videos may take a few minutes)…" \| "Grouping caption lines…"), 0 chuỗi vi bridge, 0 key thô |
| H9 0 lỗi trang | PASS — không có window.onerror/unhandledrejection trong cả phiên |

## Sửa code trong luồng này

1. **Phase caption localize (mục 6)** — mới `apps/web/src/lib/captionPhase63R1.ts`
   + `apps/web/src/i18n/fragments/round63-r1.json` (5 key `caption.phase.*`,
   vi khớp chuỗi bridge cũ, en dịch mới); `CaptionModal.tsx` 1 dòng trong
   `runJob` dùng `resolveCaptionPhaseLabel(phase, message, lang, fallback)`.
   Bridge đã gửi sẵn `{type:"phase", phase:<key>, message:<chuỗi vi>}`.
   Unit test `captionPhase63R1.test.ts`: **10/10**.
2. **Lỗi timeout pack auto-scroll (mục 5)** — `TemplatePackModal.tsx`: `errorRef`
   + `useEffect` trên `[error]` → `scrollIntoView({block:"nearest"})` khi lỗi
   xuất hiện. Lỗi render ở cuối `.modal-body` (sau 6 pack); container cuộn
   thật là `.modal-body` (không phải `.modal` — lần chạy 2 đo nhầm
   `.modal.scrollTop` luôn 0). Đã kiểm chứng M12: body cuộn 0 → 153, lỗi
   thấy trọn 100%.
3. **BUG THẬT phát hiện khi đo (mục 1): modal trong m-sheet bị pill FPS đè**
   — `apps/web/src/mobile.css`: `.m-sheet-backdrop` z-index **80 → 350** (1
   dòng + comment giải thích). Cơ chế: SceneModal/BeatSyncModal/
   StorageCleanupPanel render `.modal-backdrop` (z 400) BÊN TRONG stacking
   context của `.m-sheet-backdrop` (position:fixed + z-index), nên ở root nó
   chỉ cao bằng 80 < pill 300. Đo lần 2–3: M6 pill đè đuôi nút chính
   682.5px², elementFromPoint trúng pill "📈 FPS"; M7/M8 pill là phần tử trên
   cùng tại tâm của nó khi modal mở. Sau sửa (lần 4): `sheetBackdropZ=350`,
   hit tại tâm pill cũ = nội dung dialog, M6/M7/M8 PASS. Thứ tự cuối trên
   mobile: splash 200 < pill/panel 300 < sheet 350 < backdrop 400 < tour 450
   < toasts 500. Hệ quả có chủ đích: pill/panel FPS bị lớp mờ của sheet che
   (không bấm được) trong lúc sheet mở — chấp nhận vì pill là công cụ đo,
   sheet chỉ mở khi user chủ động mở MediaBin/Inspector. Test tĩnh khóa:
   `lib/modalSheet63R1.test.ts` **6/6** (cùng `fpsModal62R1.test.ts` 6/6).

## Lịch sử các lần chạy (trung thực)

- Lần 1: bị giết bởi service restart ~03:03, không có kết quả.
- Lần 2: 10/16. FAIL: M2 (TemplatePicker không có `role="dialog"` — harness
  tìm dialog đầu tiên; xem "Phát hiện chưa sửa"), M6/M7/M8 (bug sheet thật,
  xem trên), M9 (verdict quá cứng — đã nới: PASS khi đo đầy đủ, phát hiện
  tour che nút ghi rõ), M11 (file mặc định mau-1.webm không có track audio
  nên job không tới bước dịch + TopBar Captions disabled do rehydrate IDB
  chưa xong), M13 (chỉ thấy 1 chuỗi en vì job lỗi config trên file không
  audio). M12 PASS nhưng bằng chứng auto-scroll chưa đủ (đo nhầm `.modal`).
- Lần 3: 11/16. M2/M6/M7/M8/M9 đã sửa harness nhưng M2 vẫn fail (đo ở bước 1
  gallery — nút chính chỉ có ở bước 2), M6/M7/M8 vẫn fail (chưa sửa sheet),
  M13 fail do CDP timeout 60s (TTS fetch ~65s trong 1 eval sau reload,
  media rehydrate chưa xong nên tổng hợp lại thay vì reuse).
- Lần 4: 16/16 sau khi sửa: M2 bấm template card sang bước 2 rồi đo;
  `.m-sheet-backdrop` 80→350; SPEECH_FN chờ rehydrate tối đa 30s trước khi
  tổng hợp lại + timeout eval 180s cho lần gọi TTS.

## Kiểm chứng khác (đều xanh)

- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (lỗi `projectRepo.ts`
  của luồng R7 đợt 63 khác đã được luồng đó sửa trong lúc luồng này chạy).
- `vite build` (từ `apps/web`): pass 5.8s, chỉ cảnh báo chunk >500kB có sẵn.
- Hồi quy (esbuild bundle + node, cả 2 locale nếu có): captionModal60Q3
  23/23, escapeForms60Q10 15/15, escapeModals59P2 26/26, fpsModal62R1 6/6,
  silenceModal57N1 11/11, modalClasses59P4 33/33, modalCard58O4 24/24,
  captionsExport59P5 7/7 vi + 7/7 en, captionsTrack58O5 12/12 vi + 12/12 en,
  i18nAudit56M4 25/25 vi + 25/25 en, bridgeErrors62R5 9/9,
  captionPhase63R1 10/10, modalSheet63R1 6/6.

## Phát hiện chưa sửa (nợ mở)

1. **Tour-card che TRỌN nút chính modal (6776px²)** trong lúc tour mở — nút
   không bấm được đến khi đóng tour; toast che trọn nút trong ~4.5s. Theo
   thiết kế z-order đã khóa ở R1 (tour 450 > backdrop 400), không phải lỗi
   z-index — ghi là phát hiện UX, chưa sửa (cần quyết product: tour có nên
   nhường modal không).
2. **TemplatePicker thiếu `role="dialog"`** — duy nhất trong 12 modal đã khảo
   sát (11 modal còn lại đều có ≥1). Phát hiện a11y; sửa là thêm 2 thuộc
   tính vào `TemplatePicker.tsx` (bước 1 + bước 2 đều không có role) —
   ngoài phạm vi đo, để luồng sau/parent quyết.
3. **SceneModal có cùng pattern phase chưa localize** (scene phase
   upload/scan, `server/bridge/src/index.js:1372/1379`) — ngoài phạm vi mục 6
   (chỉ caption), ghi nợ mở.
4. **mau-1.webm (file mẫu mặc định) KHÔNG có track audio** (video ghi từ
   canvas). Caption trên file này lỗi `FFMPEG_ERROR` ("Output file does not
   contain any stream") — là lỗi thiết kế đúng của caption khi file không có
   audio, nhưng user bấm "Bắt đầu tạo phụ đề" trên file mẫu sẽ gặp lỗi này.
   Harness lần 3–4 dùng file TTS thật (`r63-speech.wav`, 3.92s, tạo qua
   bridge `/api/tts`, giọng "Hải Đăng") để đo trọn job.
5. `warnTooShort` nhánh chết và câu `pack.recordTimeout` cho pack dài — nợ cũ
   từ R10, không thuộc luồng này.
6. Chưa đo Safari/Firefox (chỉ Chromium headed qua Xvfb). Toast trong M9
   được kích qua `import /src/lib/toast.ts` + `pushToast` trong trang (không
   có đường UI kích toast trong lúc modal mở vì backdrop chặn click nền) —
   hành vi toast khi modal mở là thật (z-index + tự tắt), chỉ cách kích là
   qua API.

## Lưu ý gộp (cho parent)

- **File chung đã sửa:** `apps/web/src/mobile.css` — 1 giá trị z-index
  (80→350) + comment. Không sửa `styles.css`/`preview.tsx`/dict. Không sửa
  trực tiếp `vi.json`/`en.json` — key mới chỉ trong fragment
  `round63-r1.json` (parent gộp vào dict khi push).
- Harness lần 4 chạy trên code có sửa sheet; các luồng đợt 63 khác đang chạy
  song song (R3/R4/R7/R8/R9/R10) — không thấy LIMITS nào của họ nhắc
  `mobile.css`, nhưng parent nên kiểm tra trùng khi gộp.
- Không push, không release/tag, không binary trong batch này.
