# Phase 9 đợt 56 — LIMITS tổng hợp (parent gộp, 07/11/2026)

Đợt 56: 10 luồng song song (M1–M10), lượt cron 12:35 +07 07/11. Chủ đề:
i18n wiring toàn app (nối key dịch cho literal VI cứng) + GOP
trial-decode follow-up. Cả 10 luồng đều hoàn thành có LIMITS + tự stage
batch riêng (70 entry). Handoff đợt 56 báo "M9 còn chạy" là stale — lúc
gộp, batch M9 (1 entry) + LIMITS M9 đã có đủ trên đĩa (06:20 UTC);
parent tin đĩa, không chờ handoff bổ sung. Parent gộp từ main chat qua
2 agent con (wiring + re-probe headed M9) + tự làm phần merge dict:
đối chiếu đĩa, gộp fragment, sửa snapshot, kiểm chứng lại, stage batch
đóng đợt. KHÔNG push — chờ user nhắn "push đi".

## 1. Tóm tắt từng luồng (số thật, xem LIMITS riêng từng luồng)

- **M1 — i18n App/MediaBin/preview/Inspector/TrackPanel/TtsButton/sticker**
  (`..._M1_I18N_WIRING_LIMITS.md`): 78 key / 85 site, 0 site bỏ qua,
  0 literal VI còn sót trong 9 file. Test 14/14.
- **M2 — i18n BeatSync/Caption/Silence/ExportPanel**
  (`..._M2_I18N_WIRING_LIMITS.md`): 156 key, test 14/14, hồi quy L2
  20/20. Đóng 3 literal "Đã hủy…" còn sót.
- **M3 — i18n HistoryPanel/TemplatePicker/TemplatePackModal/EnhancePanel/
  PerfOverlay/RelinkPanel** (`..._M3_I18N_WIRING_LIMITS.md`): 84 key,
  test 13/13. Phát hiện "10 mẫu" cũ sai, TEMPLATES.length = 50.
- **M4 — i18n store.ts + 6 lib** (`..._M4_I18N_WIRING_LIMITS.md`):
  126 key, test 25/25 cả vi/en. Bỏ qua có lý do 3 key logic
  (isDirty sentinel).
- **M5 — i18n lib nested** (`..._M5_I18N_WIRING_LIMITS.md`): 81 key mới
  + 3 key tái dùng (`speedCurve.*`), lookup injection (`trKey(lookup,
  key, vars, fallback)` — không import `t()` trực tiếp vì Node ESM
  chặn JSON import). Test 21/21 (xem §2.4: assertion tiền-gộp đã được
  parent sửa sang dạng hậu-gộp).
- **M6 — audit 396 literal UNVERIFIED-lib**
  (`..._M6_UNVERIFIED_LIB_LIMITS.md`): phân loại xong 396/396, 0 còn
  chưa xác minh. UI-DIRECT 15 key (fragment riêng), UI-PROPOSE 39
  literal → 33 key đề xuất cho parent, WIRED-OWNER 84, NON-UI 256,
  ARTIFACT 2. Test 8/8.
- **M7 — DATA-content template pack** (`..._M7_DATA_CONTENT_LIMITS.md`):
  100 key (50 template × tên+mô tả), helper
  `lib/templateContentLocale.ts` (fallback getLang → vi → gốc).
  Test 10/10.
- **M8 — ot() + chính tả Hủy/Huỷ** (`..._M8_OT_SPELLING_LIMITS.md`):
  ot() 45 key (không phải 43 như nhiệm vụ ghi), test 7/7. Chuẩn
  chính tả "Huỷ" (theo `common.cancel` lâu đời nhất).
- **M9 — headed SSR 4 nhánh** (`..._M9_SSR_BRANCHES_LIMITS.md`): lần đo
  run #5: 4 PASS / 3 FAIL / 1 KHÔNG ĐO ĐƯỢC. 3 FAIL đều là raw key
  (`silence.cutDone`, `history.*`) vì dict chưa gộp. Xem §3: đo lại
  sau gộp → 7 PASS / 0 FAIL / 1 KHÔNG ĐO ĐƯỢC.
- **M10 — GOP trial-decode follow-up**
  (`..._M10_GOP_TRIAL_FOLLOWUP_LIMITS.md`): đóng 3 nợ L8 (stts
  timestamp guard + sample 0 lớn tới 2 MiB + guard unsupported-config).
  Test mới 28/28, hồi quy GOP 27/27 (parent chạy lại: L8 23/23, I6
  25/25, M10 28/28).

## 2. Việc parent gộp đã làm

### 2.1 Gộp fragment vào dict (coordinator, script kiểm chứng)

- 8 fragment (m1–m8) gộp vào `vi.json`/`en.json`: **+683 key mới**
  (không phải 685 như báo cáo pre-merge — chênh 2 do
  `caption.title`/`silence.title` trùng M2=M4, đã dedup đúng).
  Không có xung đột giá trị nào với dict cũ hay giữa các fragment;
  placeholder `{var}` khớp vi/en toàn bộ.
- Áp **28/33 key đề xuất M6** (projectRepo.validate* 20 key,
  keyframeFix* 6 key, invalidJson, untitledProject). **Bỏ qua 5 key:**
  `projectRepo.newProject` (sentinel — vừa là tên mặc định vừa là
  điều kiện so sánh trong `isDirty()`, dịch riêng sẽ vỡ project cũ)
  + 4 `reverseGate.*` (verbatim-by-design theo luật T2, test
  `reverseDecodeAheadToggle38U1` khóa chuỗi VI từng chữ).
- **Tổng cuối: vi == en == 1722 key, 0 key mồ côi.**
- Đính chính: worker báo "685 key → 1696" là sai (đếm trùng 2 key +
  chưa trừ đề xuất M6); số đúng là 683 + 28 = 711 key mới, 1011 → 1722.

### 2.2 Chính tả Huỷ/Huỷ — 7 chỗ, đã sửa hết (chuỗi UI)

- 4 key trong `vi.json`: `bgremove.cancel`, `bgremove.aborted`,
  `projectMenu.renameCancel`, `nativeFiles.exportCancelled`.
- 3 giá trị key khác: `exportPanel.renderCancelled`,
  `caption.cancelled`, `silence.cancelled` — phát hiện lúc gộp: 3
  literal `.tsx` M8 liệt kê đã được các luồng i18n khác dời thành key
  từ trước nên không còn literal để sửa; sửa giá trị trong dict thay
  vì sửa literal. Grep cuối: chuỗi UI không còn "Hủy"/"hủy" dạng cũ —
  chỉ còn trong comment (ngoài phạm vi M8, không đụng).

### 2.3 Snapshot test 1011 → 1722 (coordinator)

- 8 file: 7 snapshot (D4, saveToast31, structuredNotes32,
  errorDetail34Q4, B6, Z6, E2) + test L1
  (`ProjectMenu.i18n55L1.test.ts`), giữ nguyên dòng lịch sử cũ + thêm
  dòng đợt 56. Test L2: expected dict `bgremove.cancel` "Hủy" →
  "Huỷ" + cập nhật comment số đếm. Test M2: cập nhật comment 1011 →
  1722.
- **Sửa assertion test M5 sang dạng hậu-gộp:** test
  "fragment: không trùng key đã có trong vi.json/en.json" rớt 20/21
  sau merge (81/81 key M5 đã có trong dict — đúng theo định nghĩa).
  Đổi thành assert mọi key fragment PHẢI có trong dict đúng từng chữ
  giá trị. Chạy lại: **21/21**.

### 2.4 Wiring (agent con, đã báo cáo + parent kiểm chứng lại)

- M5/M6 lib callers: truyền `t()` làm `lookup` tại mọi call site UI
  thật — `preview.tsx` (buildPreviewSpecFailsoft, motionBadgeText),
  `ExportPanel.tsx` (exportCurveBlockers; đã dời `const i18nLookup`
  lên trên 2 useMemo để tránh TDZ ReferenceError — trước đó nó nằm
  sau dòng dùng), `App.tsx` (loadAutosave), `openProjectFlow.ts`
  (loadProject, snapshotHistoryAfterSave), `archive.ts`
  (parseProjectText), `HistoryPanel.tsx` + `projectHistory.ts`
  (saveVersion nhận thêm `lookup?` tùy chọn, forward vào
  summarizeDiff), `CaptionModal.tsx` (collectProjectCaptions),
  `TemplatePicker.tsx` (applyTemplateValues),
  `TemplatePackModal.tsx` (resolvePackSpec). Các hàm private
  (validateCurve/encodeHermite/flattenNested/...) được forward lookup
  nội bộ, không có call site UI ngoài — không còn site nào bị sót.
- M7 DATA: TemplatePackModal dùng `localizeTemplateMeta(tpl)` cho 2
  node text; `create(tpl)` vẫn nhận `tpl` GỐC. TemplatePicker dùng
  `localizeTemplateMeta` cho gallery + form bước 2.
- ot(): `lib/onboardingCopy.ts` viết lại thành `export const ot = t;`
  (đã verify 45/45 key khớp từng chữ fragment trước khi đổi).
- Cố tình KHÔNG nối: 4 key reverseGate + sentinel 'Dự án mới'.

## 3. Kiểm chứng parent (chạy lại trên cây đã gộp, số thật)

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `vite build` apps/web: **pass** (5,25 s).
- Test mới chạy lại: M5 21/21, M6 8/8, M7 10/10, M8 7/7, L1 6/6,
  L2 20/20, M10 28/28, L8 23/23, I6 25/25.
- Snapshot ở mốc 1722: D4 3/3, saveToast31 15/15, structuredNotes32
  12/12, B6 8/8, Z6 10/10, E2 3/3.
- Hồi quy M5 (strip-types): nestedPreview 46, nestedRampPreview 34,
  nestedPreviewR3 21, nestedPreviewFailsoft26J1 6, twoLevelCurve 12,
  curveFixRound27K2 17/17, curveFixKeyframe30 21/21, projectRepo 10,
  projectRepoNested22 7, projectRepoRound26J5 15, projectRepoRound49E4
  13, loadReport 10, loadReportFix28 8, loadReportPerLine29 14.
- Hồi quy thêm cho file wiring đụng: projectHistory 15/15, subtitles
  14/14, previewEngine 14, previewEngine51H6 15/15,
  archiveNested32P4 7/7.
- **Re-probe headed M9 (sau gộp): 7 PASS / 0 FAIL / 1 KHÔNG ĐO ĐƯỢC.**
  Cả 3 FAIL cũ đều lật thành PASS: (b) SilenceModal resultMsg
  `"✅ Cut 1 silences, shortened by 1.00s (Ctrl+Z to undo)."`; (c)
  HistoryPanel chrome + dialog confirm
  `"Delete version 7/11/2026 06:37? It cannot be restored."` — 0 raw
  key, 0 literal VI ở EN. (a) tipGone vẫn không đo được (nhánh chết,
  Inspector gate — chỉ khóa source + dict). (d) bridgeConn/bridgeEmpty
  PASS, (H) 0 lỗi trang PASS. Bằng chứng:
  `hidden_files/round56-m9/m9-headed-report-RERUN.json` + screenshot
  `-rerun` (file run #5 giữ nguyên).
- KHÔNG chạy lại ở bước gộp: mọi phép đo headed/TTS WAV/heap/smoke
  AppImage của các luồng, phiên solo thật, đo IDB thật, Safari/máy
  thật/GPU thật.

## 4. Nợ mở / chưa làm được (trung thực)

1. **(b) SilenceModal tràn viewport — VẪN ĐÚNG sau re-probe.**
   Viewport thực 1439×699 (cửa sổ 1440×900 trừ chrome browser);
   modal cao 391px (top 394 → bottom 785), nút Cancel/Analyze ở
   y 723–753 **dưới fold, không thấy ở lần vẽ đầu** — cần
   `scrollIntoView` mới bấm được. Lỗi UX thật, chưa sửa.
2. **(c) `HistoryPanel.tsx:30` hardcode `toLocaleDateString("vi-VN")`.**
   Ở EN vẫn hiện ngày kiểu VN (`7/11/2026 06:37`) cả trong row lẫn
   dialog confirm. Chưa sửa.
3. **(a) tipGone là nhánh chết qua UI thật** (Inspector gate ở
   `Inspector.tsx:196`) — chỉ khóa được source + dict, không đo được
   headed. Muốn đo phải render EnhancePanel trực tiếp ngoài Inspector
   (sửa code sản phẩm).
4. M5: 11 chuỗi failsoft `sink.skipped` trong nestedPreview chưa có
   trong proposal round 55 nên chưa nối (không có key).
5. M6: 4 literal VI ngoài inventory trong `nestedPreview.ts`
   (~833, ~2423, ~2590/2596) — không sửa, chỉ ghi lại.
6. M6: 256 NON-UI (đặc biệt 114 literal `settle*`) kết luận dựa trên
   đếm importer + spot-check, không đọc từng dòng.
7. reverseGate verbatim + sentinel 'Dự án mới' CỐ TÌNH không dịch
   (quyết định đứng — xem §2.1).
8. M7: bản dịch en dịch tay một người, chưa review bởi người bản ngữ;
   placeholder `label`/`default` chưa tách (cần follow-up theo
   DESIGN §5).
9. M10: 2 trường hợp moov giả tinh vi vẫn lọt (ghi rõ "NỢ CÒN LẠI"
   trong test M10 — xem LIMITS M10 §4).
10. Comment trong code vẫn lẫn "Hủy"/"hủy" và "phá hủy"/"phá huỷ"
    (ngoài phạm vi M8 — chỉ chuỗi UI được thống nhất đợt này).

## 5. Batch đã stage (KHÔNG push), chờ user push sau

- Đợt 56 (10 file / 70 entry): `phase9-round56-m1-i18n-app.txt` (12),
  `phase9-round56-m2-i18n-modals.txt` (7),
  `phase9-round56-m3-i18n-panels.txt` (9),
  `phase9-round56-m4-i18n-store-lib.txt` (10),
  `phase9-round56-m5-i18n-nested-lib.txt` (7),
  `phase9-round56-m6-unverified-lib.txt` (8),
  `phase9-round56-m7-data-content.txt` (5),
  `phase9-round56-m8-ot-spelling.txt` (4),
  `phase9-round56-m9-ssr-branches.txt` (1),
  `phase9-round56-m10-gop-trial.txt` (7).
- Batch đóng đợt: `phase9-round56-closing.txt` (25 entry — dict đã
  gộp vi/en.json, test M5 đã sửa assertion, 8 file snapshot 1722,
  test L2 + M2 đã cập nhật, 11 file wiring, LIMITS tổng hợp này).
- **Tổng chờ push: 53 file paths / 499 entry** (404 trước đợt 56 + 70
  đợt 56 + 25 đóng đợt). Các đợt 1–50 đã push xong (HEAD e2cb35e1).
