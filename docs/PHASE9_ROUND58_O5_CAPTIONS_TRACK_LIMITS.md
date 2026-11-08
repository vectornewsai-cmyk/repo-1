# PHASE9_ROUND58_O5 — Captions track: recognition song ngữ + key translatedTrack

Luồng O5, đợt 58, chạy 2026-11-07. Đóng nợ đợt 57 §6.6: đề xuất key
`captions.translatedTrack` ("Phụ đề ({code})") của N8 CHƯA merge vì bị chặn
bởi recognition token `startsWith("Phụ đề")` ở `subtitles.ts:248`.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 1. Đã làm

### Recognition: khớp cả hai tiền tố, KHÔNG dùng flag isCaption riêng

`apps/web/src/lib/subtitles.ts` — thêm helper xuất ra ngoài:

- `CAPTION_TRACK_LABEL_PREFIX_EN = "Subtitles"` (hằng cũ `"Phụ đề"` giữ nguyên).
- `isCaptionTrackLabel(label)` — `true` khi label bắt đầu bằng `"Phụ đề"`
  HOẶC `"Subtitles"`; `undefined`/rỗng → `false`.
- `collectProjectCaptions` dùng helper thay cho `startsWith` trực tiếp.

**Lý do chọn khớp hai tiền tố (ghi rõ theo yêu cầu):**
1. Tương thích ngược: project đã lưu (.vcut, autosave IndexedDB) có track
   nhãn "Phụ đề ..." nhưng KHÔNG có flag — flag-only sẽ làm các track cũ
   rơi khỏi export, trừ khi vẫn giữ khớp prefix legacy, tức flag không thay
   thế được prefix matching.
2. `Track` (video-spec) không có field flag/metadata — thêm flag phải đổi
   type video-spec + store + serialize/migration, xâm lấn lớn mà không thêm
   giá trị (vẫn cần prefix match cho legacy, xem (1)).
3. Diff tối thiểu: 1 helper + 1 hằng; false-positive tương đương hành vi cũ
   (track user tự đặt tên "Subtitles ..." bị coi là caption — giống hệt
   "Phụ đề ..." từ D6, không mở rộng thêm).

### Nhãn dịch: `translatedTrackLabel` dùng key mới, fallback VI

`apps/web/src/lib/captions.ts` — `translatedTrackLabel(targetCode, lookup?)`:

- `lookup` tùy chọn (mẫu M5/M6/N8); không truyền thì dùng `t()` của module
  (đã import sẵn trong file, gọi tại thời điểm gọi nên theo locale hiện tại).
- Key `captions.translatedTrack` với var `{code}` (đã upper).
- Key chưa có trong dict (trước lúc parent merge) → fallback đúng từng chữ
  VI cũ `"Phụ đề (EN)"`; lookup trả `undefined` cũng fallback (đã test).
- **Cố tình KHÔNG sửa `CaptionModal.tsx`:** sau khi parent merge fragment,
  nhãn tự theo locale qua module `t()` nên 3 call-site (386, 622, 627) không
  cần truyền `t` thêm. Diff nhỏ hơn, không tranh file với luồng song song.

### Fragment riêng (parent gộp sau, KHÔNG sửa vi.json/en.json)

`apps/web/src/i18n/fragments/round58-o5.json` — đúng 1 key:

- vi: `captions.translatedTrack` = `"Phụ đề ({code})"`.
- en: `captions.translatedTrack` = `"Subtitles ({code})"`.

## 2. Kiểm chứng (số thật, chạy 2026-11-07)

### Đỏ-trước (test tạm `/tmp/red-o5.test.ts`, chỉ dùng API cũ)

Chạy trước khi sửa, esbuild bundle cjs + node → **0 pass, 2 fail**:

- `translatedTrackLabel('en', lookupEn)` trả `"Phụ đề (EN)"`, muốn
  `"Subtitles (EN)"`.
- Track `"Subtitles (EN)"` không `captionOf` xuất **0 cue**, muốn 2 cue.

### Xanh-sau (test mới `apps/web/src/lib/captionsTrack58O5.test.ts`)

esbuild bundle cjs + node, 2 lần chạy → **12/12 pass cả vi và en**
(11 test trong queue + 1 test pre-merge inline):

- Fragment: đúng 1 key, parity vi/en, `{code}` khớp, nội dung đúng từng chữ.
- `translatedTrackLabel`: lookup fragment en/vi ra nhãn đúng; code thường
  `"en"` → `"EN"`; lookup trả key/`undefined` → fallback VI.
- Pre-merge (trước deepMerge trong test): `translatedTrackLabel("en")`
  fallback `"Phụ đề (EN)"` — cùng assert M4 khóa ở
  `i18nAudit56M4.test.ts:319`.
- Module `t()` sau merge (mô phỏng bước merge của parent, mẫu M4):
  vi → `"Phụ đề (EN)"`, en → `"Subtitles (EN)"`.
- `isCaptionTrackLabel`: nhận `"Phụ đề"`, `"Phụ đề 1"`, `"Phụ đề (EN)"`,
  `"Subtitles"`, `"Subtitles (EN)"`, `"Subtitles 1"`; từ chối `"Title"`,
  `"Tiêu đề"`, `"Subtitle"` (thiếu s), `"Phụ"`, `""`, `undefined`.
- `collectProjectCaptions`: track `"Subtitles (EN)"` không `captionOf` →
  2 cue đúng text/start; hồi quy `"Phụ đề (EN)"` + `"Phụ đề 1"` vẫn xuất;
  track title không `captionOf` bị loại, có `captionOf` vẫn xuất; hỗn hợp
  EN+VI+title gộp cues sắp theo start; round-trip SRT giữ nguyên cue.

### Hồi quy (chạy lại sau sửa)

- `subtitles.test.ts` (Node type-stripping): **14/14**.
- `d6.test.ts`: **11/11**.
- `i18nAudit56M4.test.ts`: **25/25** (vi) + **25/25** (en) — gồm lock
  `translatedTrackLabel("en")` == `"Phụ đề (EN)"` ở dòng 319.
- `i18nAudit57N8.test.ts`: **8/8**.
- `i18nAudit56M6.test.ts`: **8/8**.
- `tsc --noEmit` trong `apps/web`: **0 lỗi** (test mới import không đuôi
  `.ts` theo mẫu M4/M6 nên KHÔNG cần thêm dòng exclude vào tsconfig —
  đã kiểm chứng, không thêm).
- `vite build` trong `apps/web`: **pass, 16.05s** (cảnh báo chunk >500kB
  có sẵn, không liên quan).

## 3. File đã đổi/thêm (stage, KHÔNG push)

- `apps/web/src/i18n/fragments/round58-o5.json` (mới, 1 key)
- `apps/web/src/lib/subtitles.ts` (recognition song ngữ)
- `apps/web/src/lib/captions.ts` (`translatedTrackLabel` dùng key mới)
- `apps/web/src/lib/captionsTrack58O5.test.ts` (mới, 12/12 vi+en)
- `docs/PHASE9_ROUND58_O5_CAPTIONS_TRACK_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round58-o5-captions-track.txt`
(NUL-delimited, verify read-back) — 5 entry, toàn file trong repo.

## 4. Nợ mở / giới hạn trung thực

1. **Key chưa có tác dụng trong app cho tới khi parent merge fragment**
   vào `vi.json`/`en.json`: trước lúc đó `t()` trả key → fallback VI,
   hành vi đúng như cũ (đã khóa bằng test pre-merge), nhưng nhãn EN chỉ
   xuất hiện sau merge. Parent gộp fragment round58-o5 cùng đợt 58.
2. **Chưa click-test headed:** nhãn track dịch dưới locale en
   ("Subtitles (EN)") + xuất SRT/VTT từ track đó mới kiểm chứng ở tầng
   lib (esbuild + Node). Hiển thị thật trên timeline/CaptionModal cần
   probe headed sau khi parent merge — chưa làm trong luồng này.
3. **False-positive có sẵn, không sửa:** track do user tự đặt tên bắt đầu
   bằng "Subtitles" (vd "Subtitles của tôi") vẫn bị coi là caption track
   — cùng giới hạn đã có với "Phụ đề" từ D6. Đổi sang flag riêng sẽ hết
   nhưng phá tương thích ngược (xem §1), nên giữ nguyên có chủ đích.
4. **`CAPTION_TRACK_LABEL` (`captions.ts:100`) vẫn "Phụ đề" theo thiết kế:**
   track caption thường sinh ra từ `store.ts` vẫn mang nhãn VI ở cả hai
   locale; chỉ track *dịch* mới theo locale (key mới). Đây là quyết định
   của N8 (token nhận diện + label mặc định), luồng này không đổi.
5. Test đỏ tạm `/tmp/red-o5.test.ts` nằm ngoài repo, không stage (chỉ là
   bằng chứng đỏ-trước; test xanh chính thức đã vào repo).
