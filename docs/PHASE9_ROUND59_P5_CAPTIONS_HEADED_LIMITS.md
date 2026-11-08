# PHASE9_ROUND59_P5 — Click-test headed nhãn "Subtitles (EN)" + xuất SRT/VTT track dịch

Luồng P5, đợt 59, chạy 2026-11-07. Đóng nợ đợt 58 §6.5 (O5): nhãn track dịch
dưới locale en ("Subtitles (EN)") + xuất SRT/VTT từ track đó mới kiểm chứng
ở tầng lib, chưa click-test headed. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 1. Đã làm

### (a) Test node mới: xuất SRT/VTT byte-exact cho track dịch

`apps/web/src/lib/captionsExport59P5.test.ts` (mới, esbuild bundle cjs + node,
chạy vi + en) — cùng fixture với headed test (2 câu VI import tay + 2 câu EN
dịch, cùng mốc thời gian; track title tự do phải bị loại):

- `translatedTrackLabel("en")` qua module `t()` thật: vi → `"Phụ đề (EN)"`,
  en → `"Subtitles (EN)"` (key đã merge thật vào `vi.json`/`en.json` dòng
  2449, parent gộp fragment round58-o5 — KHÔNG cần deep-merge mô phỏng như O5).
- `collectProjectCaptions` hỗn hợp VI + EN + title: 4 cue, trackLabels đúng
  thứ tự track, title không `captionOf` bị loại, cue sắp theo start (ổn định:
  VI trước EN ở cùng mốc).
- `formatSrt` / `formatVtt`: byte-exact toàn bộ chuỗi (số thứ tự, timestamp
  dấu phẩy/chấm, text EN + VI, `\n` cuối, header `WEBVTT`).
- Round-trip `parseSrt(formatSrt)` + `parseVtt(formatVtt)` giữ nguyên cues.
- Chỉ track EN: SRT chỉ chứa 2 cue EN, không lẫn câu VI.
- Không caption track: cues rỗng, `formatSrt` rỗng, `formatVtt` là `"WEBVTT\n\n"`.

### (b) Harness headed mới

`apps/web/scripts/clicktest-59p5-captions-headed.mjs` (vite dev + Chromium
headed qua Xvfb + CDP, Node thuần, không Playwright — mẫu
clicktest-58o2-autosave-sample-reload.mjs; display :162, cổng dev 5490–5499,
debug 9590–9599, scratch `hidden_files/round59-p5/headed/`):

- **B0** locale en (`vcut-lang=en` + reload) → mẫu tự load (3 clip, bin 2 item),
  nút TopBar `"💬 Captions"`.
- **B1** import thật: mở CaptionModal bằng chuột thật → đưa file SRT VI (2 câu)
  qua file input bằng DataTransfer + dispatch change (mẫu 46b1/47c1 —
  `DOM.setFileInputFiles` từng không dính ở setup này) → bấm Apply
  `"✓ Apply 2 caption sentences"` bằng chuột thật → timeline có track `"Phụ đề 2"`.
- **B2** track dịch: tạo track EN qua đúng hàm store mà `CaptionModal.apply()`
  dùng (`addCaptionTrack` + `translatedTrackLabel("en")`) → timeline hiện nhãn
  `"Subtitles (EN)"`; `collectProjectCaptions` trong trang: 4 cue, trackLabels
  chứa `"Subtitles (EN)"`.
- **B3** xuất thật: mở lại modal bằng chuột thật → dòng exportIncludes chứa
  `"Subtitles (EN)"` → bấm `"⬇ SRT project"` / `"⬇ VTT project"` bằng chuột
  thật → đọc file tải về thật, so byte-exact + tên file đúng.
- **H9** 0 lỗi trang trong phiên.

### (c) Bug thật phát hiện trong quá trình test — ĐÃ SỬA (tối thiểu)

**Bug: file xuất SRT/VTT mất tên, luôn lưu thành `"download"`.**
`exportProject` đặt tên file từ `spec.meta.name` (`"Dự án mẫu.srt"`), nhưng
Chrome trên VM này lưu thành tên chung `"download"` — 6 file `"download*"`
liên tiếp ở các lần chạy headed 1–3, nội dung thì đúng byte-exact.

**Chẩn đoán bằng probe** (`/tmp/round59-p5/probe-download.mjs`, không stage —
bấm 3 nút probe bằng chuột CDP thật trên cùng trang app):

| Biến thể | Kết quả |
|---|---|
| V1: anchor gắn body + `a.click()`, tên `"Dự án mẫu.srt"` (không-ASCII) | `"download (6)"` — MẤT tên |
| V2: anchor gắn body + `a.click()`, tên ASCII `"du-an-mau.srt"` | `"du-an-mau.srt"` — GIỮ tên |
| V3: anchor RỜI + `a.click()`, tên ASCII `"du-an-mau-v3.srt"` | `"du-an-mau-v3.srt"` — GIỮ tên |

Kết luận: nguyên nhân là **tên file chứa dấu tiếng Việt**, KHÔNG phải anchor
rời DOM (V3 rời vẫn giữ tên ASCII). Giả thuyết đầu (anchor rời DOM) đã bị
probe bác bỏ — lần chạy headed 3 sau khi chỉ thêm `appendChild` vẫn ra
`"download (4)"/"download (5)"`.

**Sửa (chỉ `CaptionModal.tsx`, 2 chỗ):**

1. `exportProject`: chuẩn hoá base về ASCII — `NFD` + bỏ dấu kết hợp
   (`\u0300–\u036f`) + `đ→d`, `Đ→D`, rồi mới lược ký tự cấm
   (`[\\/\\?%*:|"<>]`) → `"Dự án mẫu"` → `"Du an mau"` (giữ khoảng trắng
   như các helper tải file khác trong app). Tên review-level `"phu-de.srt"` /
   `"phu-de.vtt"` vốn đã ASCII nên không đổi.
2. `downloadText`: thêm `appendChild(a)` + `a.remove()` — KHÔNG phải để sửa
   tên file (probe đã bác), mà để thống nhất với 5 helper tải file còn lại
   trong app (`ExportPanel`, `projectRepo`, `archive`, `sharePage`,
   `HistoryPanel` đều gắn anchor vào body); vô hại, giữ cho nhất quán.

**Đỏ-trước/xanh-sau của fix:** lần chạy headed 1–3 (trước fix tên):
`"download"`, `"download (1)"` … `"download (5)"`; lần chạy 4 (chỉ có
`appendChild`): vẫn `"download (4)"/"download (5)"`; lần chạy 6 (sau fix
ASCII): `"Du an mau.srt"` + `"Du an mau.vtt"`, nội dung byte-exact, 5/5 pass.

### (d) Cập nhật 2 lock test lỗi thời vì key đã merge (tối thiểu)

Parent đã gộp fragment round58-o5 vào `vi.json`/`en.json` trước lượt này, nên
2 assert khóa hành vi **tiền-merge** (key chưa có → fallback VI) trở nên sai
dưới locale en — phát hiện khi chạy hồi quy (O5 en 11/12, M4 en 24/25):

- `i18nAudit56M4.test.ts` (~dòng 319): `translatedTrackLabel("en")` luôn
  `"Phụ đề (EN)"` → nay theo locale (`VI ? "Phụ đề (EN)" : "Subtitles (EN)"`).
  `CAPTION_TRACK_LABEL` vẫn khóa `"Phụ đề"` như cũ, không đổi.
- `captionsTrack58O5.test.ts`: khối kiểm tra "pre-merge" đổi thành
  "post-merge" (key đã có thật trong dict; `deepMerge` sau đó thành no-op
  với key này), kỳ vọng theo locale. Không sửa các assert khác của O5.

## 2. Kiểm chứng (số thật, chạy 2026-11-07)

### Test node mới P5 — xanh ngay lần đầu (không có đỏ ở tầng lib)

Lần chạy đầu đã 7/7 cả vi và en — tầng lib O5 đã sửa xong, test mới chỉ khóa
byte-exact xuất (trước đó chưa từng có assert nào cho EN track). Ghi rõ để
không nhận vơ đỏ-trước ở tầng này; đỏ thật nằm ở headed (B3 lần 1) và ở
tên file (xem §1c).

- `captionsExport59P5.test.ts`: **7/7 vi + 7/7 en**.

### Hồi quy (chạy lại sau sửa)

- `captionsTrack58O5.test.ts` (O5): **12/12 vi + 12/12 en** (sau khi cập nhật
  lock post-merge; trước cập nhật en là 11/12 — đúng 1 assert tiền-merge).
- `i18nAudit56M4.test.ts`: **25/25 vi + 25/25 en** (trước cập nhật en 24/25).
- `subtitles.test.ts` (Node type-stripping): **14/14**.
- `d6.test.ts`: **11/11**.
- `i18nAudit57N8.test.ts`: **8/8**. `i18nAudit56M6.test.ts`: **8/8**.
- `tsc --noEmit` trong `apps/web`: **0 lỗi** ở file luồng này đụng
  (lúc chạy giữa chừng có 2 lỗi ở `binPersist59P1.test.ts` của luồng P1 song
  song — không phải file P5, P5 không đụng; lần chạy cuối tsc 0 lỗi toàn bộ).
- `vite build` trong `apps/web`: **pass** (6.20s lần cuối, sau mọi sửa đổi;
  cảnh báo chunk >500kB có sẵn, không liên quan).

### Headed — 6 lần chạy (lịch sử trung thực, không giấu lần lỗi)

| Lần | Kết quả | Ghi chú |
|---|---|---|
| 1 | 4/5 (B3 FAIL) | Lỗi harness của P5 (`BTN_RECT_FN` viết sai IIFE — sửa rồi chạy lại); B3 nhìn sai thư mục tải về. Nhưng file SRT đã tải đúng nội dung (219 byte) vào `~/Downloads/download`. |
| 2 | 5/5 | B3 pass nội dung byte-exact; 2 file đều tên `"download (2)"/"download (3)"` — phát hiện bug mất tên file. |
| 3 | 4/5 (B3 FAIL tên) | Chỉ thêm `appendChild` — vẫn `"download (4)"/"download (5)"` → giả thuyết anchor rời DOM bị bác. |
| 4 | 4/5 (B3 FAIL tên) | Probe V1/V2/V3 xác định nguyên nhân là tên không-ASCII; VTT đã đúng `"Du an mau.vtt"` sau fix ASCII, SRT bị harness nhận nhầm file tạm `.org.chromium.*`. |
| 5 | 4/5 (B3 FAIL tên) | Tên đã đúng nhưng có hậu tố `" (1)"` do file lần 4 còn sót trong `~/Downloads` — assert tên tuyệt đối quá chặt. |
| 6 | **5/5** | Sau khi dọn `~/Downloads`: `"Du an mau.srt"` + `"Du an mau.vtt"`, nội dung byte-exact, 0 lỗi trang. |

Lần 6 (cuối, sau mọi sửa): **B0, B1, B2, B3, H9 — 5/5 pass**.
Bằng chứng: `hidden_files/round59-p5/headed/p5-headed-report.json`,
`p5-b0-sample-en.png`, `p5-b1-after-import-apply.png`,
`p5-b2-subtitles-en-label.png`, `p5-b3-after-export.png`.

Chi tiết lần 6: locale en, boot ổn định, 3 clip mẫu, nút TopBar
`"💬 Captions"` tại (1106, 73); import 2 câu SRT VI → Apply bằng chuột thật
→ track `"Phụ đề 2"` (store + DOM khớp); track dịch `"Subtitles (EN)"`
(track `t12_45pp`), DOM labels
`["Video 1", "Chữ 1", "Phụ đề 2", "Subtitles (EN)"]`;
`collectProjectCaptions`: 4 cue, trackLabels `["Phụ đề 2", "Subtitles (EN)"]`;
modal hiện `"Includes 4 sentences from track: Phụ đề 2, Subtitles (EN)"`;
SRT 208 ký tự khớp byte-exact `EXPECTED_SRT`, VTT 208 ký tự khớp
byte-exact `EXPECTED_VTT` (208 ký tự = 219 byte UTF-8 do có dấu tiếng Việt).

## 3. File đã đổi/thêm (stage, KHÔNG push)

- `apps/web/src/components/CaptionModal.tsx` (fix tên file xuất + appendChild)
- `apps/web/src/lib/captionsExport59P5.test.ts` (mới, 7/7 vi+en)
- `apps/web/src/lib/captionsTrack58O5.test.ts` (lock pre-merge → post-merge)
- `apps/web/src/lib/i18nAudit56M4.test.ts` (lock nhãn dịch theo locale)
- `apps/web/scripts/clicktest-59p5-captions-headed.mjs` (mới, headed 5/5)
- `docs/PHASE9_ROUND59_P5_CAPTIONS_HEADED_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round59-p5-captions-headed.txt`
(NUL-delimited, verify read-back) — 6 entry, toàn file trong repo.

KHÔNG cần fragment i18n mới: đợt này không thêm chuỗi nào (fix chỉ đổi logic
tên file, không thêm text UI) — không tạo
`hidden_files/round59-p5-fragment.json`. Không sửa `vi.json`/`en.json`.

## 4. Nợ mở / giới hạn trung thực

1. **Đường dịch whisper qua bridge KHÔNG chạy headed:** B2 tạo track dịch qua
   đúng hàm store mà `CaptionModal.apply()` dùng, nhưng bước dịch thật
   (`POST /api/caption/translate`, faster-whisper) không chạy vì media mẫu
   (`mau-1.webm`) không có lời thoại để nhận diện/dịch. Nhãn + xuất đã khóa
   headed; engine dịch đã được kiểm chứng ở các đợt trước (caption benchmark),
   không thuộc nợ này.
2. **`Browser.setDownloadBehavior` không có tác dụng trên Chrome này:**
   harness đã đặt downloadPath về thư mục scratch nhưng file vẫn rơi vào
   `~/Downloads` (mặc định của profile). Harness lần 2+ theo dõi cả hai thư
   mục và đối chiếu theo nội dung + mtime nên vẫn verify được; file tải thử
   đã dọn khỏi `~/Downloads` sau mỗi lần chạy (chỉ giữ file N4/O4 có sẵn
   từ trước, không đụng).
3. **Tên file ASCII là đánh đổi có chủ ý:** project tên `"Dự án mẫu"` xuất
   thành `"Du an mau.srt"` (mất dấu nhưng đọc được, giữ khoảng trắng). Trên
   máy user (macOS/Windows) tên có dấu có thể vẫn lưu đúng, nhưng ASCII-safe
   thì đúng ở mọi nơi nên giữ. Các helper tải file khác (`saveProject`,
   `downloadArchive`, `downloadSharePage`, `downloadMp4`) dùng tên project
   thô — chưa kiểm chứng headed xem chúng có mất tên tương tự không; ngoài
   phạm vi luồng này (chỉ sửa đường xuất phụ đề).
4. **False-positive có sẵn, không sửa:** track user tự đặt tên bắt đầu bằng
   `"Subtitles"` vẫn bị coi là caption track — cùng giới hạn đã có với
   `"Phụ đề"` từ D6 (xem O5 LIMITS §4.3).
5. **Modal CaptionModal cao hơn viewport 900px** (nút "Start generating" bị
   cắt nửa ở mép dưới trong screenshot B3) — chỉ là quan sát, không ảnh
   hưởng case (nút export vẫn bấm được); chưa sửa vì ngoài phạm vi.
6. Probe chẩn đoán `/tmp/round59-p5/probe-download.mjs` nằm ngoài repo,
   không stage (chỉ là bằng chứng; kết quả đã ghi ở §1c).
7. Test đỏ tạm `/tmp/round59-p5/*.test.cjs` là bundle esbuild ra scratch,
   không stage.
