# PHASE9_ROUND56_M4_I18N_WIRING_LIMITS.md

Luồng M4 — Phase 9 đợt 56: nối key i18n cho `store.ts` và
`lib/captions.ts`, `lib/exportPresets.ts`, `lib/sharePage.ts`,
`lib/archive.ts`, `lib/openProjectFlow.ts`, `lib/relink.ts`
(đường dẫn tương đối `apps/web/src/`).

## 1. Đã nối: 126 key (122 key từ round55-l2-keys.json + 4 key mới)

- `store.ts`: 68 key (field patch, kind track, toàn bộ history label,
  toast relink/dedup/alias) — dùng `i18nT` (đã import sẵn từ đợt 55 L2).
- `lib/captions.ts`: 6 key — `captions.langVi/langAuto/langEn`,
  `captions.invalidData/noValidSentences/tooManySentences`.
- `lib/exportPresets.ts`: 22 key — label/desc 7 preset, 7 lỗi validate,
  `sizeSummary`, `sizeEstimateNote`.
- `lib/sharePage.ts`: 8 key — emptyProject, linkedWarn, bigVideoWarn,
  linkedNote, noVideo, durationLine, openHint, timeHeader.
- `lib/archive.ts`: 18 key — toàn bộ chuỗi lỗi export/import archive.
- `lib/openProjectFlow.ts`: 2 key — unsavedConfirm, proxyStaleToast.
- `lib/relink.ts`: 2 key — kindAudio, kindImage.
- Key nằm trong fragment riêng
  `apps/web/src/i18n/fragments/round56-m4.json` (126 key, parity vi/en);
  KHÔNG sửa `vi.json`/`en.json` trực tiếp — parent merge ở cuối đợt.

## 2. Key đề xuất bị BỎ QUA (có lý do, đã khóa bằng test)

### 2.1 `projectMenu.defaultName` — "Dự án mới" (store.ts:799, :2975)
Chuỗi này là **key logic**, không phải chuỗi hiển thị thuần:
- `lib/projectRepo.ts:1228` — `isDirty()` so sánh
  `spec.meta.name !== "Dự án mới"` để biết project trống chưa lưu.
  Dịch tên mặc định sang "New project" sẽ làm project trống bị báo
  dirty ở phiên en → hỏi xác nhận lưu sai, autosave sai.
- Site 2975 (`history.resetWithTransition("Dự án mới", …)`) chung 1 key
  với site 799, và test hiện có `store.undoAfterNew55L5.test.ts:140`
  assert `undoLabel === "Dự án mới"`.
- **Muốn dịch sau này:** refactor `isDirty` so sánh theo flag/ID thay vì
  tên hiển thị, rồi mới nối key.

### 2.2 `captions.trackLabel` + `captions.translatedTrack` — "Phụ đề" / "Phụ đề (EN)"
- `lib/subtitles.ts:202` — `CAPTION_TRACK_LABEL_PREFIX = "Phụ đề"` dùng
  làm **key logic** trong `collectProjectCaptions()`: track được tính là
  track phụ đề khi label bắt đầu bằng "Phụ đề". Dịch nhãn sang
  "Captions N" / "Captions (EN)" sẽ làm rớt cue phụ đề (đặc biệt caption
  nhập tay từ SRT/VTT, không có `captionOf`) khi xuất SRT/VTT ở cấp
  project. `subtitles.ts` KHÔNG thuộc phạm vi luồng này nên không sửa
  được phía nhận diện.
- Test khóa hành vi cũ: `CAPTION_TRACK_LABEL === "Phụ đề"`,
  `translatedTrackLabel("en") === "Phụ đề (EN)"`.
- **Muốn dịch sau này:** làm `collectProjectCaptions` nhận diện track
  phụ đề theo `kind`/`captionOf`/flag thay vì prefix label, rồi mới nối key.

### 2.3 `sharePage.langAttr` — không đưa vào fragment
`<html lang="vi">` không phải chuỗi dịch: code dùng `getLang()` trực
tiếp (`<html lang="${getLang()}">`). Đề xuất gốc vi:"vi"/en:"en" không
phải bản dịch nên không thành key dict.

## 3. Hiệu chỉnh đề xuất theo source thật (đã xác minh từng site)

- **Ngoặc kép:** đề xuất dùng ngoặc kép cong `“ ”`, source dùng ngoặc
  thẳng `"` (hoặc `JSON.stringify(var)` đã kèm ngoặc). Fragment giữ
  đúng source: `histAddAudio/histAddClip`, `store.toastUnsupported`,
  `toastEmptyMeta`, `toastUnusedMedia`, `toastDedupNote`,
  `toastRelinked`, `toastRelinkedMulti` dùng `"` thẳng;
  `archive.unsafeName/unsafeEntry/unknownEntry` bỏ ngoặc trong dict vì
  var truyền vào đã là `JSON.stringify(...)`.
- **`exportPreset.errWidth/errHeight/errFps/errCrf/errAudioBitrate`:**
  đề xuất ghi `"..."` là chỗ cắt ngắn khi quét. Chuỗi thật có range số:
  key dùng `{min}..{max}` (vd: `width phải là số nguyên {min}..{max}.`).
- **`exportPreset.sizeSummary`:** đề xuất sai var — ghi `{vbitrate}` +
  `{abitrate}` nhưng source chỉ có 1 var ở vị trí đó là
  `${p.x264Preset}`. Key đã sửa thành
  `{w}×{h} @{fps}fps · CRF {crf} · {x264} · audio {akbps}k`.
- **`archive.projectJsonInvalid`:** source là mảng
  `["project.json không hợp lệ:", ...parsed.errors]` — không có
  `{error}`. Key bỏ var, chỉ còn `"project.json không hợp lệ:"`.
- **`timeline.histTrimRipple` site store.ts:2883 KHÔNG khớp đề xuất:**
  literal thật là `"Xoá clip (ripple)"` (xóa), không phải
  `"Cắt clip (ripple)"` (trim). Site này dùng key mới
  `timeline.histDeleteRipple` (cùng nhánh đơn ở 2852).
- **4 key mới ngoài đề xuất** (literal đã xác minh theo source):
  `timeline.histPatchMulti` ("Chỉnh thuộc tính clip", nhánh nhiều key
  ở patchClips), `timeline.histDeleteRipple` ("Xoá clip (ripple)"),
  `exportPreset.customLabelPlain` ("Tùy chỉnh" — `defaultCustomPreset`
  không có `…`, khác label ở preset list),
  `sharePage.timeHeader` ("Thời gian" — header `<th>` trong trang chia
  sẻ, đề xuất không liệt kê).

## 4. Lựa chọn t() vs i18nT và giới hạn còn lại

- `store.ts` + `lib/relink.ts`: dùng `i18nT` (alias `t as i18nT`, theo
  pattern đợt 55 L2). Các file lib còn lại dùng `t()` trực tiếp.
- **Chuỗi lấy tại thời điểm gọi là đủ** cho toast/lỗi/history label
  (history label lưu tại lúc thao tác, không re-render khi đổi lang —
  đúng hành vi cũ của history).
- **Const module-load bị đóng băng theo ngôn ngữ lúc import:**
  `CAPTION_LANGS`, `TRANSLATE_TARGET_LANGS` (captions.ts),
  `EXPORT_PRESETS` (exportPresets.ts), `RELINK_KIND_META` (relink.ts)
  gọi `t()` ở top-level nên label đúng với lang đã lưu trong
  localStorage lúc mở app, nhưng đổi lang trong phiên KHÔNG cập nhật
  các dropdown/panel đang dùng const này cho tới khi reload. Muốn live
  update phải đổi các const thành hàm `get…()` và sửa phía component
  dùng chúng (CaptionModal, ExportPanel, RelinkPanel — ngoài phạm vi
  luồng này).
- `timeline.histTypeText` ("Nhập chữ…") là **nội dung clip mặc định**,
  không phải chrome UI: dịch nó đồng nghĩa clip chữ mới tạo mang text
  theo ngôn ngữ hiện tại và text đó được lưu vào project. Đây là hành
  vi mong muốn (placeholder theo ngôn ngữ user), nhưng cần biết nó là
  dữ liệu project, không chỉ hiển thị.
- `timeline.histNest` giữ fallback `"compound clip"` (tiếng Anh) khi
  nested clip không có tên — đó là tên dữ liệu mặc định, không phải
  chuỗi UI.
- `openProject.proxyStaleToast` trùng câu với `app.proxyStaleToast`
  (App.tsx, luồng khác): giữ 2 key riêng theo namespace, parent gộp
  thì 2 key có cùng nội dung — không hợp nhất chéo luồng để tránh
  xung đột file.
- `sharePage.linkedWarn` (video >100MB): chỉ kiểm chứng mức source +
  fragment — không có test hành vi (cần base64 ~134MB để trigger,
  không đáng tạo trong test).
- Literal VI còn sót trong code thực thi của 7 file: **4** — toàn là
  key logic đã bỏ qua có chủ đích ở §2.1–2.2 (2 ở store.ts, 2 ở
  captions.ts). Các file lib còn lại: 0. (Comment/docstring tiếng Việt
  không tính; 2 doc comment vẫn nhắc label cũ — `"Sửa curve tốc độ vi
  phạm"` ở store.ts:580 và `"1080p · Cân bằng"` ở exportPresets.ts:34 —
  là tài liệu, không phải chuỗi chạy.)

## 5. Kiểm chứng (số thật)

- `tsc --noEmit` trong `apps/web`: **exit 0** (0 lỗi).
- `vite build`: **pass** (built in 5.55s).
- Test `apps/web/src/lib/i18nAudit56M4.test.ts` (bundle esbuild
  `--format=cjs`, chạy node):
  - `node /tmp/round56-m4/m4.test.cjs` → **25/25 pass** (lang=vi).
  - `VCUT_TEST_LANG=en node /tmp/round56-m4/m4.test.cjs` → **25/25 pass** (lang=en).
  - Test gồm: fragment 126 key + parity vi/en, nội dung key hiệu
    chỉnh, source 7 file gọi đủ key + hết literal cũ, hành vi thật
    (validate captions, preset summary/validate, share page HTML +
    warnings, importArchive zip thiếu manifest / zip hỏng, relink kind,
    store undoLabel + text mặc định) ở cả 2 ngôn ngữ.
  - Test mô phỏng bước merge của parent bằng deep-merge fragment vào
    đúng object dict `vi.json`/`en.json` trong bundle (không sửa file
    trên đĩa) — xem header test.

## 6. File stage

`~/workspace/repo-1-push/paths-loop/phase9-round56-m4-i18n-store-lib.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, không binary):

- `apps/web/src/store.ts`
- `apps/web/src/lib/captions.ts`
- `apps/web/src/lib/exportPresets.ts`
- `apps/web/src/lib/sharePage.ts`
- `apps/web/src/lib/archive.ts`
- `apps/web/src/lib/openProjectFlow.ts`
- `apps/web/src/lib/relink.ts`
- `apps/web/src/i18n/fragments/round56-m4.json` (mới)
- `apps/web/src/lib/i18nAudit56M4.test.ts` (mới)
- `docs/PHASE9_ROUND56_M4_I18N_WIRING_LIMITS.md` (mới, file này)
