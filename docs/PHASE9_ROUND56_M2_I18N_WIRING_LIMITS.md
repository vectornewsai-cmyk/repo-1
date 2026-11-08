# Phase 9 — Đợt 56, luồng M2: nối key i18n cho 4 file modal/export — LIMITS

Luồng M2 (đợt 56): nối key i18n cho `components/BeatSyncModal.tsx`,
`components/CaptionModal.tsx`, `components/SilenceModal.tsx`, `ExportPanel.tsx`
(từ 153 proposal trong `hidden_files/round55-l2-keys.json` có site nằm trong
4 file này). KHÔNG push, KHÔNG tag/release, KHÔNG sửa `vi.json`/`en.json`
trực tiếp, KHÔNG binary.

## 1. Đã làm (số thật)

- **156 key** trong fragment mới `apps/web/src/i18n/fragments/round56-m2.json`
  (vi == en == 156 key; placeholder `{var}` khớp 100% vi/en; không trùng
  1011 key hiện có trong `vi.json`/`en.json`):
  - `beatsync.*`: 24 key — BeatSyncModal, 20 điểm thay.
  - `caption.*`: 45 key — CaptionModal, 42 điểm thay.
  - `silence.*`: 21 key — SilenceModal, 19 điểm thay.
  - `exportPanel.*`: 66 key — ExportPanel (+ ReframeSection trong cùng file),
    58 điểm thay.
  - Tổng: **139 điểm thay** trong 4 file (đếm bằng script thay thế, mỗi
    điểm assert đúng 1 lần xuất hiện trước khi thay).
- **Test mới** `apps/web/src/lib/i18nAudit56M2.test.ts`: **14/14 pass**
  (bundle esbuild `--format=cjs` rồi chạy node — ESM ném
  "Dynamic require of stream" từ react-dom/server, như mẫu L1/L2):
  - Fragment: đủ 156 key, đúng số lượng từng prefix, parity vi/en,
    placeholder khớp, không trùng key cũ, vi khác en.
  - Source: mọi key trong fragment đều có `t("key")` trong đúng file của
    nó; hết literal VI cũ của các key không-placeholder (quét source đã bỏ
    comment).
  - Render thật EN (react-dom/server, trạng thái mặc định): BeatSyncModal
    nhánh no-clip, CaptionModal config, SilenceModal config, ExportPanel —
    không còn literal VI nào trong danh sách kiểm tra.
- **Regression L2**: `i18nAudit55L2.test.ts` chạy lại **20/20 pass**.
- **tsc** (`apps/web`, `tsc --noEmit`): 0 lỗi trong file của luồng. Lần chạy
  cuối repo-wide hiện 13 lỗi, tất cả nằm ở
  `src/lib/gopTrialDecode56M10.test.ts` (file test của luồng M10 đang sửa
  dở song song, KHÔNG phải file của M2, M2 không đụng vào). Lần chạy tsc
  trước đó (khi file M10 chưa xuất hiện) là 0 lỗi toàn repo.
- **Literal VI còn sót trong 4 file: 0 literal có dấu** (quét string literal
  + JSX text đã bỏ comment). Còn 4 literal UI không dấu / chưa có proposal
  (xem §3).

## 2. Hiệu chỉnh proposal theo source (đã verify từng chữ)

Proposal là gợi ý; 6 chỗ vi trong fragment KHÁC proposal gốc vì proposal
sai so với source (đã đối chiếu byte):

| Key | Proposal | Fragment (theo source) |
|---|---|---|
| `exportPanel.quality` | `Chất lư��ng:` (mojibake) | `Chất lượng:` |
| `silence.thresholdHint` | `(càng gần 0 càng khó tính)` | `(càng gần 0 càng "khó tính")` |
| `exportPanel.userLutMissing` | `LUT user “{name}” …` (ngoặc kép cong) | `LUT user "{name}" …` (ngoặc thẳng, như source) |
| `exportPanel.reframeAdded` | `✅ Đã thêm “{name}” …` (cong) | `✅ Đã thêm "{name}" …` (thẳng) |
| `exportPanel.shareLinked` | `… hãy bấm “Tải xuống MP4” …` (cong) | `… hãy bấm "Tải xuống MP4" …` (thẳng) |
| `exportPanel.jsonNote` | `… là “ngôn ngữ chung”: …` (cong) | `… là "ngôn ngữ chung": …` (thẳng) |

EN giữ nguyên như proposal (dịch, không cần khớp source từng chữ), trừ
`exportPanel.userLutMissing` en giữ ngoặc cong của proposal.

**Key tách nhánh** (proposal gộp 2 nhánh JSX thành 1 chuỗi — không khớp
bất kỳ render thật nào, đã tách theo đúng note trong proposal):

- `silence.found` (proposal: gộp cả 2 nhánh "...(sẽ cắt...) — sẽ cắt tất
  cả...") → **BỎ**, thay bằng `silence.foundPartial` /
  `silence.foundAll`. Test khóa `silence.found` không có trong fragment.
- `caption.found` (proposal = nhánh có dropped) giữ nguyên; thêm
  `caption.foundPlain` cho nhánh dropped == 0.
- `caption.translated` giữ nguyên; thêm `caption.translatedPlain` cho
  nhánh droppedEn == 0.
- Tổng key fragment = 153 proposal − 1 bỏ + 4 thêm = **156**.

**Key dùng chung với file khác** (chỉ nối phía file của M2; file đối tác
do luồng khác / parent xử lý, key đã nằm trong fragment để dùng chung):

- `beatsync.title` — note proposal: dùng chung cho Inspector.tsx:444/446.
- `caption.title` — note proposal: dùng chung cho store.ts:1236 (undo
  label). `caption.translateTo` cũng là historyLabel (undo) trong
  CaptionModal — đã nối.
- `silence.title` — note proposal: dùng chung cho store.ts undo label.

**Đóng 3 mục nợ của M8 §2** (literal cứng "Đã hủy …" trong 3 file này):
`ExportPanel.tsx:908` → `exportPanel.renderCancelled`,
`CaptionModal.tsx:235` → `caption.cancelled`,
`SilenceModal.tsx:149` → `silence.cancelled`. Còn lại 4 chuỗi trong
`vi.json` (`bgremove.cancel`/`bgremove.aborted`/
`projectMenu.renameCancel`/`nativeFiles.exportCancelled`) không thuộc
phạm vi luồng này.

## 3. Literal còn sót trong 4 file (chưa có proposal — KHÔNG tự bịa key)

| # | File:site | Literal | Lý do còn |
|---|---|---|---|
| 1 | BeatSyncModal.tsx:243 | `` ` — ${downbeatTimes.length} downbeat trong clip` `` | Không có trong 514 proposal (grep 0 kết quả "downbeat trong clip"). |
| 2 | CaptionModal.tsx:422 | `<span>File video / audio</span>` | Không có proposal. |
| 3 | ExportPanel.tsx:252 | `"🔍 Auto-reframe"` (nhánh nút khi không working) | Không có proposal (chỉ có `reframeWorking2` cho nhánh working). |
| 4 | ExportPanel.tsx:879 | `✅ Render xong!` | Không có proposal. |
| 5 | ExportPanel.tsx (doExportSharePage) | `"Video VCut"` (title mặc định khi `spec.meta.name` trống) | Fallback code, không có proposal; chỉ hiện khi project không tên. |

Ngoài ra các nhãn đã là tiếng Anh từ trước nên không cần key:
`Video:`, `9:16 (TikTok/Reels)`, `1:1`, `4:5`, `Width/Height/FPS`,
`Audio (kbps)`, `x264 preset`, `Target (LUFS):`, `Track`, `Clip`.
Nhãn ngôn ngữ trong `CAPTION_LANGS`/`TRANSLATE_TARGET_LANGS` và
`translatedTrackLabel()` nằm ở `lib/captions.ts` — ngoài phạm vi file
của luồng.

## 4. Thay đổi hành vi / định dạng (nhỏ, có chủ ý)

- **Mất `<b>`/`<code>` ở 3 câu gộp key**: `beatsync.found` (mất `<strong>`
  quanh BPM), `caption.found` / `caption.translated` (mất `<b>` quanh số
  câu), `exportPanel.renderIntro` (mất ngoặc đơn quanh URL, nhưng giữ
  `<code>` bằng helper `codeToken`), `exportPanel.jsonNote` (mất `<code>`
  quanh `src` — token `src` quá ngắn, tách chuỗi dễ cắt nhầm nên để
  text thường). Nội dung chữ giữ nguyên từng chữ.
- **Giữ `<b>faster-whisper</b>`**: `caption.recognizeWith` /
  `caption.translateWith` dùng helper mới `boldEngine()` (tách chuỗi đã
  dịch theo token `faster-whisper` rồi bọc lại `<b>`). Nếu parent sửa
  chuỗi fragment khiến token biến mất, helper trả về text thường (không
  crash).
- **ExportPanel `deepValidate`**: biến vòng lặp `t` (Track) che mất `t`
  i18n đã import → đổi tên biến vòng lặp thành `tr` (chỉ trong
  `deepValidate`). Đây là lỗi bắt được nhờ `tsc` (9 lỗi TS2349), đã sửa.
- **ExportPanel validation memo**: `useLang()` đổi thành
  `const lang = useLang()` và thêm `lang` vào deps của `useMemo` tính
  `issues` — nếu không, đổi ngôn ngữ sẽ không tính lại chuỗi lỗi (memo
  cũ chỉ phụ thuộc `spec`).
- **ReframeSection** (component con trong ExportPanel.tsx) không gọi
  `useLang()` riêng — nó render lại theo ExportPanel cha nên vẫn đổi
  ngôn ngữ đúng; không cần sửa.
- **Chuỗi lỗi bridge** (`bridgeError`, `bridgeServerDown`,
  `bridgeConnHint`, `shareDownloadFailed`…) là chuỗi UI hiển thị cho user
  qua `setError`/`setMessage` nên đã nối; chuỗi log nội bộ / key phân
  biệt logic không đụng.

## 5. Giới hạn kiểm chứng

- **Chưa merge fragment**: `vi.json`/`en.json` vẫn 1011 key; chuỗi EN
  thật của 156 key chỉ hiện sau khi parent merge fragment. Trước merge,
  locale EN hiện fallback là chính key (vd `beatsync.title`) — test M2
  viết theo kiểu merge-proof (`expectT()`: chưa merge thì assert fallback
  key, đã merge thì assert chuỗi EN) nên vẫn xanh sau merge.
- **Nhánh chưa render-test được bằng SSR** (giới hạn đã biết từ L2, cần
  đo headed trên browser thật): BeatSyncModal nhánh review (cần clip +
  bridge), CaptionModal nhánh running/review (cần bridge + segments),
  SilenceModal step review/done (cần bridge), ExportPanel nhánh
  uploading/rendering/done/error-detail (cần bridge/job). Các nhánh này
  chỉ khóa ở mức source + fragment (test M2 §2).
- **Không đo lại trên browser thật** (click-test): ngoài phạm vi luồng;
  render SSR + tsc + test là toàn bộ kiểm chứng.
- **Chính tả Hủy/Huỷ**: các key mới dùng đúng chính tả của source gốc
  (vd `caption.cancelled` = "Đã hủy…", `exportPanel.renderCancelled` =
  "Đã hủy render."). Việc thống nhất toàn app vẫn thuộc M8/parent (xem §2).
- **Sự cố /tmp**: giữa đợt, file script thay thế đầu tiên
  (`/tmp/round56-m2-edit.py`) biến mất khỏi /tmp — khớp hiện tượng M8
  ghi trong log (service restart làm mất /tmp). Script đã viết lại và
  chạy xong; không mất mát code repo. Lần sau nên để script ở workspace
  thay vì /tmp.

## 6. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round56-m2-i18n-modals.txt`
— 7 entry, NUL-delimited, verify bằng read-back, toàn text:

- `apps/web/src/components/BeatSyncModal.tsx`
- `apps/web/src/components/CaptionModal.tsx`
- `apps/web/src/components/SilenceModal.tsx`
- `apps/web/src/ExportPanel.tsx`
- `apps/web/src/i18n/fragments/round56-m2.json`
- `apps/web/src/lib/i18nAudit56M2.test.ts`
- `docs/PHASE9_ROUND56_M2_I18N_WIRING_LIMITS.md`

Lệnh chạy + kết quả thật:

- `./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M2.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round56-m2/m2.test.cjs && node /tmp/round56-m2/m2.test.cjs` → **14/14 pass**.
- Cùng lệnh cho `i18nAudit55L2.test.ts` (regression) → **20/20 pass**.
- `cd apps/web && ../../node_modules/.bin/tsc --noEmit` → 0 lỗi trong
  file của luồng (13 lỗi repo-wide đều ở file test của luồng M10, xem §1).
