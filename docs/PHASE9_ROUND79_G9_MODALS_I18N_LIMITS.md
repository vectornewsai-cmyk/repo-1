# Phase 9 — Đợt 79, luồng G9: Onboarding modals — Escape + i18n còn thiếu

> **Kết luận trước (đọc dòng này là đủ): (a) Escape 3/3 modal và (b) class
> modal đã ĐÓNG từ trước — đợt 59 P2/P4 + đợt 60 Q10, kiểm chứng lại đợt
> 75 C9 (headed 9/9). Luồng G9 KHÔNG sửa code modal nào; công việc là
> KIỂM CHỨNG LẠI độc lập (chạy lại toàn bộ suite tĩnh liên quan, đều xanh)
> + đóng phần (c) CÒN THẬT: 3 câu lịch sử archive + 2 câu lỗi history.json
> trong note load-report + label track phụ đề thường — 6 key i18n mới,
> dict 2419 → 2425. Test mới `i18nModals79G9.test.ts` 9/9. tsc 0, vite
> build pass, r6-i18n-check PASS, i18nOrphans 16/16.**

Ngày: 10/11/2026 (lượt cron 09:35 +07). Repo: `~/workspace/repo-1`.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Đối chiếu nhiệm vụ với trạng thái trên đĩa (kiểm chứng trước khi sửa)

Nhiệm vụ giao ghi nợ từ gap analysis §0 ("TourCard/TemplatePackModal/
TemplatePicker chưa đóng bằng Escape; class caption-modal, modal-x/label/
hint/err chưa định nghĩa; ~15 sub-panel hardcode"). Kiểm tra trực tiếp
trên đĩa ngày 10/11/2026 cho thấy §0 đã lỗi thời ở 2/3 hạng mục — gap
analysis §0.1/§0.2 cùng file đã tự cập nhật điều này (đợt 59 P2 đóng O1,
đợt 59 P4 đóng O4, đợt 75 C9 kiểm chứng lại), nhưng hàng tóm tắt §0 vẫn
ghi "Còn thiếu" nên nhiệm vụ được giao theo hàng đó:

| Hạng mục | Trạng thái trên đĩa lúc bắt đầu G9 |
|---|---|
| TourCard Escape | CÓ — `components/onboarding/TourCard.tsx:48-60` (đợt 59 P2, pattern O1, guard INPUT/TEXTAREA/SELECT, không chặn BUTTON, cleanup `removeEventListener`) |
| TemplatePackModal Escape | CÓ — `components/onboarding/TemplatePackModal.tsx:75-87` (P2 + Q10: chặn đóng khi busy/ttsBusy vì `create()`/`makeTts()` không hủy an toàn) |
| TemplatePicker Escape | CÓ — `components/TemplatePicker.tsx:61-72` (P2 + Q10: ĐÓNG HẲN ở cả 2 bước) |
| `caption-modal` | KHÔNG CÒN trong JSX — CaptionModal dùng class `modal` đã định nghĩa (P4 chọn **đổi sang class đã có**, không định nghĩa class mới) |
| `modal-x`/`modal-label`/`modal-hint`/`modal-err` | KHÔNG CÒN trong JSX — SilenceModal dùng `icon-btn`/`field`/`muted`/`error` đã định nghĩa |
| `<p className="error">` BeatSyncModal | Nằm trong `.modal-body` cả 3 bước nên rule `.modal-body .error` áp dụng được |
| i18n sub-panel (~15 panel, N2 §2.7) | **CÒN THẬT một phần** — xem §2: phần lớn chuỗi còn lại là fallback chết (key đã có trong dict) hoặc dữ liệu chẩn đoán/nội dung; chỉ 3 cụm UI thật còn hardcode, đã đóng ở §1 |

Lựa chọn "định nghĩa class mới hay đổi sang class đã có" (yêu cầu nhiệm vụ):
giữ nguyên quyết định đợt 59 P4 — **đổi sang class đã có**, không định
nghĩa thêm class nào. Lý do như C9 §1: `caption-modal` không có nhu cầu
layout khác `modal` (cùng width 640px, cùng head/body/actions); 4 class
SilenceModal đều là alias của class đã định nghĩa, không style riêng nào
mất khi đổi. 0 selector CSS mới trong đợt này.

## 1. Việc đã làm (chỉ phần c — i18n)

### 1.1. Sáu key mới (vi/en, placeholder khớp)

| Key | vi | en |
|---|---|---|
| `openProject.archiveHistoryProjectMismatch` | Lịch sử trong bản nén thuộc project khác ({detail}) — không nhập. | History in the archive belongs to a different project ({detail}) — skipped. |
| `openProject.archiveHistoryTooMany` | Lịch sử trong bản nén có {detail} phiên bản (tối đa {max}) — không nhập. | History in the archive has {detail} versions (max {max}) — skipped. |
| `openProject.archiveHistoryVersionMismatch` | Một phiên bản lịch sử trong bản nén thuộc project khác ({detail}) — không nhập. | One history version in the archive belongs to a different project ({detail}) — skipped. |
| `openProject.archiveHistoryNotObject` | File history.json trong bản nén không phải JSON object — bỏ qua lịch sử. | history.json in the archive is not a JSON object — history skipped. |
| `openProject.archiveHistoryBadJson` | File history.json trong bản nén không phải JSON hợp lệ — bỏ qua lịch sử. | history.json in the archive is not valid JSON — history skipped. |
| `captions.trackLabel` | Phụ đề {n} | Subtitles {n} |

Dict: **2419 → 2425 key lá mỗi bên**, vi == en, cùng tập key,
placeholder khớp (r6-i18n-check PASS).

### 1.2. Code sửa (3 file sản phẩm)

1. **`apps/web/src/lib/openProjectFlow.ts`** — `archiveHistorySkippedMessage()`
   nay dùng `t("openProject.archiveHistory*")` thay cho 3 template literal
   VI dựng tay. Các câu này hiện trong note load-report (code
   `archiveHistorySkipped`, key `structuredNotes.archiveHistorySkipped`
   đã có sẵn vi/en) qua `params.error` — trước đây `{error}` luôn là
   tiếng Việt dù note ngoài đã dịch. Nhánh `catch` (lỗi từ
   `importArchiveHistory`, đã dịch qua `t` ở tầng store) và note
   `archiveHistoryImported` (key đã có) không đổi. Các `fallback:` VI
   trong note là fallback chết khi key đã có — giữ nguyên theo pattern
   chung của `StructuredNote`.
2. **`apps/web/src/lib/archive.ts`** — `importArchive()` nay trả thêm
   `historyErrorCode?: "notObject" | "badJson"` song hành với
   `historyError` (chuỗi VI cũ giữ nguyên để test A4/A5 khóa nhắc
   "history.json" không vỡ). `openProjectFlow` dùng code để dịch qua key
   mới, fallback về `historyError` khi code vắng (archive cũ).
3. **`apps/web/src/store.ts`** — `addCaptionTrack()` tạo label track phụ
   đề thường qua `i18nT("captions.trackLabel", { n: String(count) })`
   thay cho `` `${CAPTION_TRACK_LABEL} ${count}` `` (hardcode "Phụ đề N"
   mọi locale). Track dịch (đã truyền `label` tường minh qua
   `translatedTrackLabel`) không đổi. Hằng `CAPTION_TRACK_LABEL` giữ
   nguyên (label legacy + khóa test M4); nhận diện track vẫn khớp cả hai
   tiền tố "Phụ đề"/"Subtitles" (`subtitles.ts`). Import hằng đã gỡ khỏi
   `store.ts` (không còn dùng; `noUnusedLocals: true`).

### 1.3. Test khóa số key dict (bump 2419 → 2425)

11 file test khóa tổng key: `i18nAudit59P7`, `i18nOrphans60Q4`,
`codecProbeUi75C6`, `i18nRound57N4`, `reverseBadge46B6`,
`reverseCompat44Z6`, `reversePlaybackI18n49E2`,
`reverseToggleI18n48D4`, `saveToast31`, `structuredNotes32`,
`components/project/ProjectMenu.i18n55L1` — chỉ đổi số 2419 → 2425 (+
chuỗi lịch sử key trong comment). 3 file chỉ cập nhật comment chuỗi
lịch sử: `codecProbeDebts76D8`, `errorDetail34Q4`,
`speedWarnTooShortDead63R10`. Không đổi logic test nào khác.

### 1.4. Test mới: `apps/web/src/lib/i18nModals79G9.test.ts` — 9/9

- Dict 2425/2425, 6 key mới đủ 2 bên, vi ≠ en, placeholder khớp.
- `archiveHistorySkippedMessage` đúng từng chữ cả 3 lý do, cả vi lẫn en
  (en không còn dấu tiếng Việt).
- `importArchive` với history.json JSON lỗi → `historyErrorCode`
  `"badJson"`; không phải object → `"notObject"`; archive tốt →
  `undefined`; `historyError` vẫn nhắc "history.json" (hồi quy A4/A5).
- `store.addCaptionTrack` động: locale en → label `Subtitles N`,
  locale vi → `Phụ đề N` (gọi store thật trong Node, không mock).
- Hồi quy tĩnh: `store.ts`/`openProjectFlow.ts` không còn chuỗi VI cũ.

## 2. Phương pháp quét (c) — vì sao chỉ 6 key, không phải "hết hardcode"

Quét AST toàn `apps/web/src` bằng TypeScript compiler API (script tạm
`/tmp/g9-scan2.mjs`, không stage): 1621 literal bare + 391 fallback
key-động. Phân loại theo "chuỗi có tới mắt user không":

- **Fallback chết (không sửa):** mọi `t()/trKey()/i18nT()/speedT()/
  enhanceT()` mà key đã có trong dict — EnhancePanel (13 dòng),
  SpeedPanel (`speed.curveStabTitle/Blocked`), subtitles.ts
  (`errBadTimestamp`/`errEndNotAfterStart`), projectHistory/projectRepo
  (mọi `warn()` đều mang `messageKey` đã có, vd `speedCurve.*`),
  `loadReport.formatOverflowLine` (key `projectRepo.moreWarnings` đã
  có), fastMotion `pick()` (fragment round64-r2/round65-s2 đủ key en),
  presets.ts `{key, fallback}` (key `enhance.sum*` đã có). Scan thô ban
  đầu đếm cả comment/regex/fallback nên con số 1433 dòng là sai lệch —
  số thật sau AST + đối chiếu dict chỉ còn các cụm ở §1 + nhóm dưới.
- **Dữ liệu nội dung, KHÔNG phải UI chrome (không sửa — dịch chúng là
  đổi nội dung video của user):** `lib/templates.ts` 586 literal (tên/
  mô tả template + text clip mẫu: "Chúc mừng sinh nhật Linh!"…),
  `sample.ts`/`sample-nested.ts`, câu mẫu đo TTS trong
  `ttsEstimate*` (câu đọc mẫu + tên giọng), text khắc lên media mẫu
  (`sampleMedia.ts:65` "VCut Studio · media mẫu tự sinh"), tên giọng
  "Hải Đăng" (proper noun), `CAPTION_TRACK_LABEL_PREFIX` /
  `FALLBACK_PROJECT_NAME` (hằng nhận diện/khóa, không phải text hiển
  thị — đổi theo locale sẽ vỡ khóa).
- **Chẩn đoán/dev-only (không sửa trong luồng này):** `ttsEstimate*`
  (~346), `settle*` (~156), `transitionPreview` (73),
  `gop*/cpuGate*/reverse*/discardRestore/rehydrate/safeArea/
  syncProtocol/waveform/nestedPreview/curveFix*` — chuỗi trong báo cáo
  chẩn đoán, `throw`/`console.*`, mã lý do worker, hoặc message của
  `warn()` đã có `messageKey`. Riêng `nestUtils.ts` (202 chuỗi lỗi):
  panel NestedClipPanel/AdjustmentLayerPanel dịch-tại-điểm-toast bằng
  key `nested.*` (vd `nestedCurveCreateTwoLevelMessage`), không toast
  trực tiếp chuỗi `nestUtils` — cần kiểm chứng thêm trước khi wire
  (xem §5.2).
- **Còn lại nhưng ngoài phạm vi G9 (ghi nợ, xem §5):** `rehydrate36S5`
  (6 lý do rehydrate), `safeArea` (4), `reversePreviewGate` (4 câu giải
  thích cổng), `syncProtocol` (6), `projectRepo` warnings chuỗi trần
  `warnings[]` (blob-URL/missing-media — có `structuredNotes` song hành
  nhưng cần đối chiếu từng code), `curveFix.formatSanitizeSummary`
  (bản không-lookup; bản localized đã có key `curveFix.summary*` và
  đang được UI dùng).

## 3. Kiểm chứng (chạy thật, từ gốc repo)

| Kiểm chứng | Kết quả |
|---|---|
| `escapeModals59P2.test.ts` (a: 3 modal) | **26/26 pass** (chạy lại sau sửa) |
| `escapeForms60Q10.test.ts` (a: Q10) | **15/15 pass** |
| `welcomeEscape58O1.test.ts` (pattern gốc) | **9/9 pass** |
| `modalClasses59P4.test.ts` (b: 5 class) | **33/33 pass** |
| `cssClasses60Q2.test.ts` (css60) | **59/59 pass** |
| `cssClasses61R4.test.ts` (css61) | **60/60 pass** |
| `modalCard58O4.test.ts` (hồi quy modal) | **24/24 pass** |
| `silenceModal57N1.test.ts` | **11/11 pass** |
| `captionModal60Q3.test.ts` | **23 passed, 0 failed** |
| `i18nModals79G9.test.ts` (mới, §1.4) | **9/9 pass** (esbuild esm + node) |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** (0 key mồ côi với 2425 key) |
| `i18nAudit59P7.test.ts` | **8/8 pass** |
| `r6-i18n-check.cjs` | **PASS** (vi=2425 en=2425; literal i18nT 601; R6 458; transition 82; textanim 22) |
| `archiveHistory67U6.test.ts` (hồi quy A1–A6) | **pass** (chạy lại sau sửa) |
| `d6.test.ts`, `captionsTrack58O5.test.ts`, `i18nAudit56M4.test.ts` (hồi quy caption track) | **pass** |
| `codecProbeUi75C6`, `codecProbeDebts76D8`, `i18nRound57N4`, `reverseBadge46B6`, `reverseCompat44Z6`, `reversePlaybackI18n49E2`, `reverseToggleI18n48D4`, `saveToast31`, `structuredNotes32`, `errorDetail34Q4` (bump count) | **pass** |
| `ProjectMenu.i18n55L1.test.ts` (components) | **6/6 pass** |
| `speedWarnTooShortDead63R10.test.ts` (components) | **5/5 pass** |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` (apps/web) | **pass** (xem §3.1) |

### 3.1. Vite build

**pass** — `✓ built in 1m 7s` (10/11/2026). Cảnh báo chunk JS
1,582.34 kB (>500 kB) có sẵn từ trước, không do đợt này gây ra (C9 §4.5
ghi cùng cảnh báo 1,568.72 kB); CSS 68.59 kB, worker 3.56 kB.

## 4. Giới hạn trung thực / nợ còn lại

1. **(a)/(b) không sửa code modal** — Escape + class đã đóng từ đợt
   59/60; G9 chỉ kiểm chứng lại bằng suite tĩnh. Bằng chứng động gần
   nhất là headed 9/9 đợt 75 C9 (09/11, Chromium 1254, 0 lỗi trang);
   G9 không chạy lại headed vì không đổi code modal nào và các luồng
   đợt 79 khác đang chạy headed song song (tránh đụng port/display).
   Nếu parent muốn bằng chứng động mới, chạy lại harness
   `apps/web/scripts/clicktest-75c9-escape-classes.mjs`.
2. **Quét AST không bao phủ `server/`** (Python/bridge) — chỉ quét
   `apps/web/src`. Chuỗi VI trong server log không tới UI web.
3. **Dict 2425 là số tại thời điểm G9 stage.** Các luồng đợt 79 khác
   chạy song song có thể thêm key; parent lúc gộp phải đếm lại và bump
   các test khóa số key nếu tổng khác 2425 (mẫu: §1.3).
4. **`speed.warnTooShort` đã không còn trong dict** (kiểm tra trực tiếp
   10/11: key vắng trong `vi.json`; comment đợt 63 R10 nói "chờ parent
   xóa" đã lỗi thời — parent đã xóa ở một lần gộp trước). Không còn nợ
   nào ở đây; `i18nOrphans` 16/16 pass là sạch thật, không phải nhờ
   allowlist.
5. **Nội dung template/sample vẫn tiếng Việt theo thiết kế** (§2) — nếu
   user muốn template đa ngôn ngữ thì đó là quyết định sản phẩm riêng,
   không phải bug i18n.
6. **Không test headed cho note archive/label caption mới** — bằng chứng
   là test động Node (chuỗi đúng từng chữ 2 locale + gọi store thật).
   Render thật của note trong LoadReport cần click-test headed riêng
   (đường mở `.vcut.zip` có history.json hỏng).

## 5. Nợ mở cho đợt sau (từ §2, có vị trí chính xác)

1. **N2 còn lại (i18n):** wire `nestUtils.ts` sau khi xác minh đường
   toast (202 chuỗi); `rehydrate36S5` (6), `safeArea` (4),
   `reversePreviewGate` (4), `syncProtocol` (6) sau khi xác minh chuỗi
   nào tới UI; `projectRepo` warnings chuỗi trần (blob-URL L231-232,
   missing-media L255-256) sau khi đối chiếu `structuredNotes` song
   hành; `curveFix.formatSanitizeSummary` (bản không-lookup) — kiểm tra
   còn caller nào dùng bản này không, hay đã chuyển hết sang
   `formatSanitizeSummaryLocalized`.
2. **O1/O4 trong gap analysis §0:** hàng tóm tắt §0 vẫn ghi "Còn thiếu"
   trong khi §0.1/§0.2 đã cập nhật là ĐÃ ĐÓNG — đề nghị sửa hàng §0 để
   các luồng sau khỏi làm lại việc đã đóng (mẫu C9 §4.1, G9 §0).
3. **Q2_LIMITS §6 không tìm thấy file** — gap N2 trích "các panel liệt
   kê ở Q2_LIMITS §6" nhưng không có file nào tên đó trong `docs/`
   (chỉ có `PHASE9_ROUND34_Q2_*` và `PHASE9_ROUND60_Q2_*`); G9 thay
   bằng quét AST toàn src (§2). Nếu file Q2_LIMITS nằm ở tên khác, cần
   ghi rõ đường dẫn trong gap analysis.

## 6. File trong batch (stage, không push)

- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` (+6 key mỗi bên)
- `apps/web/src/lib/openProjectFlow.ts`, `apps/web/src/lib/archive.ts`,
  `apps/web/src/store.ts` (code sửa §1.2)
- `apps/web/src/lib/i18nModals79G9.test.ts` (mới)
- 11 file test bump 2419 → 2425 (§1.3) + 3 file comment chuỗi lịch sử
- `docs/PHASE9_ROUND79_G9_MODALS_I18N_LIMITS.md` (mới — file này)

Không sửa CSS, không sửa code modal, không binary, không file
`.github/workflows/*`, không đụng `preview.tsx` (luồng khác đang sửa
lúc 02:48 — G9 không chạm vào file này).
