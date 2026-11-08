# PHASE9 ROUND 55 L2 — I18N AUDIT LIMITS

Đợt 55, luồng L2: audit literal tiếng Việt cứng toàn app web
(`apps/web/src`) + i18n hoá nhóm còn lại (ngoài ProjectMenu/TopBar —
luồng L1 làm). Ngày 2026-11-07. **KHÔNG push, KHÔNG release/tag.**

## 1. Kiểm kê (quét Sat 2026-11-07, sau khi sửa)

Scanner tự viết (`hidden_files/round55-l2/scan55c.py`, tokenizer
string/template literal + JSX text, thay HTML entity trước khi check,
cắt segment tại `//`/`/*`). Coverage đã kiểm chứng: **0 dòng bị sót
trong .tsx**, **0 JSX literal đáng ngờ**.

| Nhóm | Số lượng | Ghi chú |
|---|---:|---|
| **Tổng literal chứa ký tự Việt** | **2362** | Không tính dòng comment |
| Dòng comment chứa tiếng Việt (loại trừ) | 14193 | — |
| UI-needs-key (cần key mới) | 617 | 30 file, xem §2 |
| UI-done-ot (đã i18n qua `ot()`) | 43 | `lib/onboardingCopy.ts`, chờ gộp key vào vi/en.json |
| DATA-content (nội dung template/sample) | 643 | `lib/templates.ts` 622+ (file ghi "TỰ ĐỘNG SINH — đừng sửa tay"), `sample.ts`, `sample-nested.ts`, `lib/sampleMedia.ts` — cần thiết kế localize nội dung riêng, không dùng `t()` |
| NON-UI-internal (diagnostic/reason/error nội bộ) | 527 | Đã rà mẫu |
| UNVERIFIED-lib (chưa xác minh được sink) | 396 | Mặc định coi là nội bộ theo mẫu đã rà — **nợ cần thread follow-up** |
| NON-UI-error-swallowed | 120 | `components/nested/nestUtils.ts` — error trả về nhưng store nuốt (`return false`, không toast; đã xác minh tại `store.ts:2383`) |
| NON-UI-symbol (`×`/`÷` trung tính) | 12 | Không phải tiếng Việt |
| NON-UI-log (`console.*`) | 3 | — |
| NON-UI-artifact | 1 | `lib/sharePage.ts:137` — đuôi template literal + code kề sau, scanner artifact |
| **Kiểm chứng tổng** | 617+43+643+527+396+120+12+3+1 = **2362 ✓** | |

### UI-needs-key theo file (617, số dòng sau sửa)

| File | Số literal | File | Số literal |
|---|---:|---|---:|
| `store.ts` | 76 | `lib/twoLevelCurve.ts` | 18 |
| `ExportPanel.tsx` | 78 | `TemplatePicker.tsx` | 15 |
| `CaptionModal.tsx` | 61 | `lib/curveFix.ts` | 14 |
| `lib/nestedPreview.ts` | 61 | `lib/projectRepo.ts` | 14 |
| `BeatSyncModal.tsx` | 28 | `PerfOverlay.tsx` | 12 |
| `SilenceModal.tsx` | 27 | `App.tsx` | 11 |
| `preview.tsx` | 26 | `TrackPanel.tsx` | 11 |
| `MediaBin.tsx` | 24 | `lib/captions.ts` | 8 |
| `HistoryPanel.tsx` | 24 | `TtsButton.tsx` | 7 |
| `EnhancePanel.tsx` | 22 | `TemplatePackModal.tsx` | 6 |
| `lib/exportPresets.ts` | 21 | `lib/sharePage.ts` | 7 |
| `lib/archive.ts` | 18 | `media.ts` | 4 |
| `lib/relink.ts` | 2 | `lib/openProjectFlow.ts` | 2 |
| `Inspector.tsx` | 2 | `desktop.ts` | 1 |
| `components/RelinkPanel.tsx` | 16 | `Toasts.tsx` | 1 |

## 2. Đã sửa trực tiếp: 37 điểm / 9 file (chỉ dùng lại key có sẵn)

| File | Điểm | Key tái dùng |
|---|---:|---|
| `store.ts` | 9 | `timeline.histMove`, `histTrim` (×5), `fxMove`, `fxTrim` + 1 điểm ternary ở `:1327` (xem §5) |
| `ExportPanel.tsx` | 5 | `errorDetail.summary.unknown`, `common.close` (×2), `inspector.duration`, `bgremove.cancel` |
| `BeatSyncModal.tsx` | 3 | `common.close`, `bgremove.cancel` (×2) |
| `CaptionModal.tsx` | 6 | `common.close` (×3), `bgremove.cancel`, `bgremove.bridgeHttp`, `common.bridgeConn` |
| `SilenceModal.tsx` | 7 | `common.close` (×3), `bgremove.cancel` (×2), `bgremove.bridgeHttp`, `common.bridgeConn` |
| `TemplatePicker.tsx` | 3 | `common.cancel`, `common.close`, `sticker.allTab` |
| `EnhancePanel.tsx` | 1 | `keyframe.tipGone` |
| `HistoryPanel.tsx` | 1 | `topbar.deleteShort` |
| `TemplatePackModal.tsx` | 2 | `tts.bridgeEmpty`, `common.bridgeConn` |

Vượt mục tiêu (≥5 component): **9 file**.

### Quyết định tái dùng key cross-panel (ghi rõ để parent rà lại)

- `inspector.duration` cho "Thời lượng" ở ExportPanel; `bgremove.cancel`
  cho "Hủy"; `keyframe.tipGone` cho EnhancePanel; `topbar.deleteShort`
  cho HistoryPanel; `sticker.allTab` cho TemplatePicker.
- **KHÔNG dùng** `transition.duration` cho "Thời gian" ở HistoryPanel
  (en "Duration" ≠ "Time") — đề xuất key riêng `history.colTime`.
- **Chính tả "Hủy" vs "Huỷ":** cả hai đều tồn tại trong dict
  (`bgremove.cancel`="Hủy", `common.cancel`="Huỷ",
  `projectMenu.renameCancel`="Hủy") — khi sửa dùng key có vi khớp từng
  chữ với literal gốc. **Nợ chuẩn hoá chính tả** (chưa thống nhất).
- **"Hải Đăng"** (tên giọng TTS ở TtsButton/TemplatePackModal) là proper
  noun, KHÔNG đề xuất key (3 site, xem §3).
- Giá trị en của 3 key bridge đã xác minh trong đợt này:
  `common.bridgeConn`, `bgremove.bridgeHttp`, `tts.bridgeEmpty`
  (test khóa đúng từng chữ cả 2 ngôn ngữ).

## 3. Đề xuất key mới: 514 key (chưa gộp vào dict)

File scratch (nằm NGOÀI repo, KHÔNG đưa vào batch stage):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l2-keys.json`
— builder: `hidden_files/round55-l2/keys_build.py`.

- **514 proposals**, phủ **614/617** literal UI-needs-key. 3 literal chưa
  phủ đều là tên giọng **"Hải Đăng"** (TtsButton `:41`, `:174`;
  TemplatePackModal `:94`) — proper noun, cố ý không đề xuất.
- Validation đã chạy trong builder: không trùng key, không trùng 1011
  key hiện có, vi/en không rỗng, format key đúng. (2 lỗi đã bắt được
  khi validate: `relink.reading` trùng key hiện có — đổi thành
  `relink.readingBtn`; `exportPreset.720pLabel` — format segment bắt
  đầu bằng số, đã nới regex theo convention hyphen của dict.)
- Quy ước: vi = đúng từng chữ literal gốc; `${...}` → `{var}`; câu bị
  chẻ fragment trong JSX gộp thành 1 key cấp câu (ghi note "cần
  restructure JSX"); key trùng chuỗi giữa các file dùng chung 1 key.
- **Nợ xác minh khi gộp:** các key có note "cần xác minh theo source
  tại site" (chủ yếu nhóm `nested.*` / `twoLevel.*` / `curveErr.*` —
  đuôi câu bị cắt trong dump quét, cần đọc lại source tại site trước
  khi gộp; 2 template nối bằng `+` ở twoLevelCurve `:119–120` đã gộp
  thành 1 key `curveErr.kfBezier`).
- **Giới hạn scanner:** chỉ bắt literal CÓ dấu. Từ tiếng Việt không
  dấu (vd label preset `"720p · Nhanh"`) scanner không thấy — phát
  hiện khi đọc tay source, đã đề xuất `exportPreset.720pLabel`.
  Các từ vay mượn ASCII (Video/Sticker/Clip/Track) giữ nguyên ở EN nên
  không cần key.
- **Chưa đề xuất key cho:** 43 literal `ot()` (chờ gộp vào vi/en.json),
  643 literal DATA-content (cần thiết kế localize nội dung),
  396 literal UNVERIFIED-lib (cần thread follow-up xác minh sink).

## 4. Kiểm chứng (đều chạy thật, Sat 2026-11-07)

| Kiểm chứng | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | **0 lỗi** (sau round 1, round 2, và fix `:1327`) |
| `vite build` (apps/web) | **pass** — 5.87s, dist JS 1.17 MB |
| Test mới `lib/i18nAudit55L2.test.ts` (esbuild bundle + node, render SSR thật 5 component) | **20/20 pass** |
| Test L1 `ProjectMenu.i18n55L1.test.ts` | **6/6 pass** |
| Test E2 `lib/reversePlaybackI18n49E2.test.ts` | **3/3 pass** (sau khi cập nhật snapshot count, xem §5) |
| Test D4 `lib/reverseToggleI18n48D4.test.ts` | **3/3 pass** |

### Red-before (đỏ-trước)

Tạm revert 1 fix bằng sed (TemplatePicker `t("common.cancel")` →
`"Huỷ"`), chạy test: **19/20** — test source
("TemplatePicker phải gọi t(common.cancel)") đỏ đúng như kỳ vọng,
rồi khôi phục lại bằng sed, grep xác minh (0 literal `"Huỷ"` còn lại)
và chạy lại test: **20/20**.

Lưu ý trung thực: nút "Huỷ" bị revert nằm ở bước detail của
TemplatePicker (nhánh `confirming`, không render mặc định) nên test
render EN vẫn xanh trong lần đỏ-trước — chỉ test source bắt được
revert. Nhánh này chỉ khóa ở mức source + dict.

## 5. Thay đổi ngoài phạm vi sửa chính (ghi rõ)

1. **Test tự bắt được 1 điểm sửa bị sót (round 1):** test source của
   `store.ts` đỏ vì còn literal `"Di chuyển clip"` ở ternary fallback
   `store.ts:1327` (nhánh multi-move; round 1 chỉ sửa site move-đơn
   ở `:1298`). Đã sửa thêm: nhánh đơn dùng `i18nT("timeline.histMove")`
   (điểm thứ 37). Template `` `Di chuyển ${n} clip` `` vẫn cần key mới
   (`timeline.histMoveMulti`, đã đề xuất trong keys.json).
2. **Cập nhật snapshot count test E2:** `reversePlaybackI18n49E2.test.ts`
   khóa tổng key = 987 (trạng thái đợt 53); L1 đợt 55 thêm 24 key →
   1011. Cập nhật 987 → 1011 theo đúng convention ghi trong chính test
   đó ("Nếu luồng khác cùng đợt cũng thêm key, parent gộp cập nhật số
   này"). Test-only, không chạm dict hay code sản phẩm. Sau cập nhật:
   3/3 pass. L1 vẫn khóa 1011 (6/6 pass).

## 6. Hạn chế (trung thực — chưa đo được / chưa làm)

- **Nhánh không đo được bằng SSR** (renderToStaticMarkup dùng
  getServerSnapshot của zustand nên luôn thấy state lúc khởi tạo):
  - EnhancePanel nhánh tipGone (cần selection trỏ clip không tồn
    tại) — đã chứng minh bằng probe: `setState` trước render không
    đổi HTML. Chỉ khóa source + dict. Cần đo headed trên browser thật.
  - SilenceModal nút Close dạng text chỉ render ở step "done";
    HistoryPanel nút Xoá chỉ render khi có version trong IndexedDB;
    TemplatePackModal 2 chuỗi bridge chỉ hiện khi bridge lỗi;
    ExportPanel nút Hủy / thông báo render-lỗi chỉ hiện khi đang render
    hoặc render lỗi. Tất cả chỉ khóa source + dict.
  - Nhánh dirty ("● Unsaved") của L1 cũng cùng giới hạn này.
- **Undo label giữ ngôn ngữ lúc action chạy:** nhãn lưu trong undo
  stack giữ nguyên ngôn ngữ tại thời điểm action chạy (hành vi có sẵn
  của store, không đổi trong đợt này).
- **TemplatePicker title hardcode "10 mẫu":** `<h3>🎬 Mẫu video (10 mẫu)</h3>`
  — số 10 hardcode, chưa i18n (đã đề xuất key `templatePicker.title`
  với `{count}` trong keys.json; khi gộp cần restructure để đếm thật).
- **UNVERIFIED-lib 396 literal:** chưa xác minh được sink ở cấp
  literal; mặc định coi là nội bộ theo mẫu đã rà — cần thread
  follow-up rà sink từng file lib trước khi kết luận.
- **DATA-content 643 literal:** nội dung template/sample chưa có thiết
  kế localize — không dùng `t()`, cần quyết riêng.
- **43 literal `ot()`** trong `lib/onboardingCopy.ts`: đã i18n qua hệ
  riêng, chờ gộp key vào vi.json/en.json (không phải việc của L2).
- **Không chạm:** `i18n/vi.json`, `en.json`, `index.ts`,
  `ProjectMenu.tsx`, `TopBar.tsx` (L1 là luồng duy nhất sửa 5 file đó
  — đã verify L1 test vẫn 6/6 pass sau khi L2 xong).
- **Không push, không release/tag** (luật cứng của đợt).

## 7. File đã đổi (stage, xem paths-loop)

9 file sửa + 1 test mới + 1 test cập nhật count + LIMITS doc này = **12 file**:

- `apps/web/src/store.ts`
- `apps/web/src/ExportPanel.tsx`
- `apps/web/src/components/BeatSyncModal.tsx`
- `apps/web/src/components/CaptionModal.tsx`
- `apps/web/src/components/SilenceModal.tsx`
- `apps/web/src/components/TemplatePicker.tsx`
- `apps/web/src/components/enhance/EnhancePanel.tsx`
- `apps/web/src/components/project/HistoryPanel.tsx`
- `apps/web/src/components/onboarding/TemplatePackModal.tsx`
- `apps/web/src/lib/i18nAudit55L2.test.ts` (mới)
- `apps/web/src/lib/reversePlaybackI18n49E2.test.ts` (cập nhật snapshot 987→1011)
- `docs/PHASE9_ROUND55_L2_I18N_AUDIT_LIMITS.md` (mới)

File scratch `round55-l2-keys.json` + evidence `hidden_files/round55-l2/`
nằm ngoài repo, KHÔNG đưa vào batch stage.
