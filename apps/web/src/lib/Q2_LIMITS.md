# Q2_LIMITS.md — Agent Q2, Phase 8 (editor hoàn thiện + click-test thật)

Ngày: 24/10/2026. Phạm vi Q2: chỉ `apps/web/src` (i18n + fix UI), test/docs của Q2.
KHÔNG push (theo lệnh Q2).

## 1. i18n Inspector + Timeline — XONG

- Thêm `inspector.*` (85 keys) + `timeline.*` (28 keys) vào cả `i18n/vi.json`
  và `i18n/en.json`; bản dịch tiếng Anh viết tay cho toàn bộ key mới.
- `Inspector.tsx`: 82 lần thay chuỗi — ProjectInfo, MultiSelectInfo, Inspector
  chính (kind heads, text fields, font size/color/bg, bold/italic/bg toggle,
  animation, X/Y, opacity, source-audio keep/mute, Section titles, scene button,
  volume, fade in/out + 4 fade-curve options × 2 selects, track volume + tip,
  timing fields, delete clip). Mỗi component render độc lập đều có `useLang()`.
- `Timeline.tsx`: 25 lần thay chuỗi — empty-label, track flag titles (mute/lock/
  hide on+off), history labels, toolbar, add-track titles, ripple on/off, zoom,
  timecode title, hint line, gutter head, delete-track title, no-tracks,
  lane-empty, no-tracks hint (tách 2 keys quanh nút ＋ 🎬).
- Kiểm chứng độ phủ key: 113 keys dùng trong 2 file, 0 thiếu ở vi, 0 thiếu ở en,
  0 key namespace mới không dùng. Chuỗi tiếng Việt còn lại trong 2 file chỉ là
  comment code, emoji/ký tự (×, →) và tham chiếu key `t("…")` — không còn chuỗi
  UI hardcode trong JSX của Inspector.tsx/Timeline.tsx.
- Lỗi do Q2 tự gây và đã sửa: param `.map((t) => …)` (Track) trong Timeline
  che khuất hàm i18n `t` → TS2349; sửa bằng alias import
  `import { t as i18nT, useLang }` và 28 lần gọi `i18nT("timeline.…")`.

## 2. Click-test thật — 9/9 PASS (bằng Playwright local, xem §5)

Chạy vite dev server (`apps/web`, port 5173) + bridge (port 8787) rồi bấm thật
bằng Playwright + Chromium trên VM (`~/.cache/ms-playwright/chromium-1248`,
Chrome for Testing 156.0.8078.4). Script: `/tmp/q2-clicktest/click2.js`
(không nằm trong repo, tránh làm bẩn package.json).

| # | Thao tác | Kết quả cuối |
|---|----------|--------------|
| 0 | Không tràn ngang ở viewport 1440px | PASS — scrollW = clientW = 1440 |
| 1 | Project mẫu load đủ clip | PASS — 3 clips (2 video + 1 text) |
| 2 | Click clip → Inspector | PASS — head "🎬 Video" |
| 3 | Bấm play → playhead chạy | PASS — 00:00:00:00 → 00:00:03:12 |
| 4 | Đổi ngôn ngữ vi → en | PASS — hint "Drag clip edges to trim…" |
| 5 | Đổi ngôn ngữ en → vi | PASS — hint "Kéo mép clip để trim…" |
| 6 | Thêm text clip tại playhead | PASS — 3 → 4 clips |
| 7 | Kéo clip trên timeline +120px | PASS — 258px → 378px (sau khi sửa bug §3) |
| 8 | Xuất MP4 thật qua bridge | PASS — outcome "done" |

Lần chạy v1 trước đó (2/8) bị nhiễu timing: project mẫu load chậm (~11s mới
đủ 3 clip) nên đếm clip sớm = 0, và nút language/publish khi đó còn nằm ngoài
màn hình do bug tràn TopBar (§4). Kết quả v1 không dùng làm kết luận, chỉ dùng
v2 (đợi selector tới 40s).

## 3. Bug kéo clip — TÌM RA + SỬA (Timeline.tsx, onMove)

Triệu chứng: kéo thân clip (video hay text, trái hay phải, vào vùng trống)
không di chuyển gì, dù click chọn vẫn chạy và pointer events vẫn tới window
(đã probe: down=1, move=6, up=1; beginBodyDrag chạy, onMove chạy với
drag=move, nhưng không vào nhánh move).

Nguyên nhân gốc: handler `onMove` window-level của Timeline đóng over biến
`st` — snapshot `useStore.getState()` lúc render đầu tiên, khi spec còn rỗng
(project mẫu load bất đồng bộ sau mount). Lookup
`st.spec.tracks.find(t => t.id === "v1")` luôn ra `undefined` →
`if (!track || !clip) return;` drop lặng lẽ mọi lần kéo. Nói cách khác: kéo
clip trên timeline CHƯA TỪNG chạy được trong build này với project load sau
mount — không phải lỗi do test.

Sửa (1 chỗ, theo đúng convention của file — các handler window-level khác
đều dùng `getState()` tươi bên trong handler):
```ts
const drag = dragRef.current;
if (!drag || drag.mode === "scrub") return;
// Q2 Phase 8: đọc state TƯƠI — `st` ở cuối component là snapshot lúc render đầu
const st = useStore.getState();
```
Kiểm chứng sau sửa: kéo clip video thứ 2 +200px vào vùng trống →
240px → 440px (04.0s → 07.3s, snap đúng frame); bộ click2 9/9 pass.
Probe tạm thời đã gỡ sạch (không còn chuỗi Q2PROBE trong Timeline.tsx).

## 4. Bug tràn TopBar — TÌM RA + SỬA (styles.css)

Triệu chứng: `document.scrollWidth` 2384px vs `clientWidth` 1440px, với
`body { overflow: hidden }` — TopBar (`display:flex`, không wrap, không
overflow) chứa ~25 nút tổng ~2384px nên các nút phía phải (language toggle
x≈2334, nút publish) nằm NGOÀI màn hình, không bấm được, không có scrollbar.

Sửa: `.topbar { overflow-x: auto; scrollbar-width: thin; }` +
`.topbar > * { flex-shrink: 0; }` (kèm comment ghi rõ phát hiện 2384px/1440px).
Kiểm chứng: bước 0 của click2 PASS (scrollW = clientW = 1440) và các nút
language/publish bấm được thật.

## 5. Hạn chế trung thực của click-test

- Subagent generic KHÔNG có browser tool điều khiển live browser. Click-test
  này dùng Playwright local trên VM — là click thật (CDP input events, DOM
  thật, export MP4 thật qua bridge), nhưng KHÔNG phải click qua browser tool
  của parent. Nếu cần xác minh qua live browser, parent cần delegate riêng.
- Splash overlay (`.splash`, z-index 200) chỉ thoáng qua lúc sơn đầu tiên rồi
  biến mất — không phải blocker.
- Chưa click-test: trim mép clip, split (S), delete (Del), box-select nhiều
  clip, undo/redo sau kéo, responsive/mobile, PWA. Ghi nhận làm việc tiếp theo,
  không claim đã test.
- Sample project load chậm (~11s cho 3 clip, do ghi media mẫu bằng
  MediaRecorder/canvas) — test phải đợi selector, không đếm sớm.

## 6. Chưa làm (ngoài phạm vi Q2 hoặc theo dõi)

- Sub-panel trong Inspector vẫn hardcode tiếng Việt: TransitionPanel (~152
  lần xuất hiện VI incl. comment), SpeedPanel, KeyframePanel/KeyframeGraph,
  ChromaPanel, BgRemovePanel, TextAnimPicker, LutPicker, ColorAdjustPanel,
  EffectPanel, StickerPanel, AudioFxPanel, MaskPanel, FontPicker, SceneModal,
  TtsButton. Lý do từ chối drop trong `lib/drop.ts` vẫn tiếng Việt.
- Lỗi tsc còn lại KHÔNG phải của Q2 (do agent song song Phase 8 sửa cùng lúc):
  lúc Q2 kiểm tra lần cuối có lỗi ở `src/lib/projectHistory.ts`,
  `src/lib/syncProtocol.test.ts`, `packages/video-spec/src/sticker.ts`; lần
  kiểm tra sau nữa xuất hiện thêm `src/components/lut/LutPicker.tsx`
  (trùng key `vcut-iced-matcha`) và `src/lib/beatSync.test.ts` (import `.ts`).
  `npx vite build` vẫn pass; `npm run build` (= tsc && vite) fail vì các lỗi
  này. Timeline.tsx của Q2: 0 lỗi tsc. Không sửa file của agent khác để tránh
  xung đột.
- Chưa push bất kỳ file nào (đúng lệnh Q2). Các file Q2 sửa:
  `apps/web/src/Inspector.tsx`, `Timeline.tsx`, `styles.css`,
  `i18n/vi.json`, `i18n/en.json`, `i18n/README.md`, `lib/Q2_LIMITS.md` (file này).
- Backup trước khi sửa Q2 (phòng hồi): `/tmp/vi.json.bak`, `/tmp/en.json.bak`,
  `/tmp/Inspector.tsx.bak`, `/tmp/Timeline.tsx.bak`.
