# LIMITS — Phase 9 đợt 63: GỘP PARENT (merge + kiểm chứng + stage)

Đợt 63: 10 luồng R1–R10, chạy cron 09:35 08/11/2026. Handoff của lượt chạy báo
"5 xong, 5 chưa xong (R3/R5/R6/R8/R10)" là **STALE** — kiểm chứng trên đĩa:
cả 10 batch + LIMITS + log đều đã có. Parent gộp ngay, không chờ gì thêm.

## 0. Kết quả gộp — số thật

| Hạng mục | Số |
|---|---|
| Dict i18n sau gộp | **vi = en = 2275 key lá, 0 lệch tập key, 0 orphan** (trước gộp 2146) |
| Fragment gộp | r1 5 + r5 123 + r7 2 + r9 1 + r10 **0** = **131 key** → 2277, rồi −2 key (xem §2) → **2275** |
| Key vi==en giống hệt nhau | **51** (48 sau đợt 60, +2 mẫu gop.cache đợt 61, +1 `validation.detail` đợt 63 — format template `'[{where}] {detail}'`) |
| Batch luồng (sau sửa R10) | **131 entry** (r1 9, r2 4, r3 10, r4 6, r5 27, r6 5, r7 17, r8 9, r9 34, r10 10 — R10 từ 11→10 vì gỡ workflow, xem §3) |
| Batch closing (parent) | **19 entry** (`phase9-round63-closing.txt`) |
| Tổng chờ push sau đợt 63 | **1180 entry / 127 file** (trước đợt 63: 1030 / 116; +131 luồng +19 closing). Đếm trực tiếp thư mục paths-loop; các file đợt 1–50 đã push vẫn nằm trong thư mục nên KHÔNG lấy tổng thư mục (179 file / 3074 entry) làm số chờ push. |
| GitHub HEAD | vẫn **e2cb35e1** (đợt 50). KHÔNG push (lệnh đứng). |

## 1. Tóm tắt từng luồng (số của luồng, parent kiểm chứng lại ở §5)

- **R1 — headed modal/mobile (16/16 PASS lượt 4):** SilenceModal / TemplatePicker /
  ExportPanel đều bấm được thật; fragment `caption.phase.*` (5 key) đọc qua bảng
  `captionPhase63R1.ts` (key theo phase lúc chạy, không xuất hiện chuỗi đầy đủ
  trong src — xem §4.1). Test mới: captionPhase63R1 **10/10**, modalSheet63R1 pass.
- **R2 — chi phí render enhance còn lại + ghosting + metric jitter:** harness mới
  `test_round63_r2_render_cost.js` **49/49**, `..._cpu.js` **28/28**,
  `..._motion_metric.js` **11/11** (theo LIMITS R2). Kết luận: 720p 5s = 28,81s CPU
  (detect 46% + tiến trình chính 52% + residual 1%) — "phần còn lại" 5–6s của đợt
  61 là tạo tác phép trừ, không còn. **Parent chưa chạy lại được 3 test này trong
  đợt gộp** (lượt chạy đầu bị mất session do service restart giữa chừng; lượt
  chạy lại đang chạy nền lúc viết LIMITS này — xem §5.4). Số R2 trích theo LIMITS
  của luồng, theo tiền lệ các đợt trước.

- **R3 — FPS blend + thang blend preview enhance (piecewise):** `denoiseBlendAlpha`
  từ tuyến tính sang piecewise qua 4 knot khớp hqdn3d (0.3→0.195, 0.5→0.486,
  0.8→0.806, 1→0.981). Test: 63R3 **8/8**, 62R3 **10/10**, 61R3 **7/7**, 60Q1
  **16/16** (parent chạy lại, xanh hết). Headed Q1 7/7, combo 9/9 (theo LIMITS R3).
- **R4 — keyframe worker nền:** công thức timeout mới **1,2 ms/KiB, trần 45s**
  (cũ 1,0 ms/KiB, trần 30s); decode worker 1,5× tải trung bình. Keyframe 37–42 MB
  ở tải nặng vẫn VƯỢT trần 45s — fail-open có lý do; kéo trần 60–70s cũng không
  cứu được (xem LIMITS R4). Test gopTrialDecode63R4 + 62R4 pass (parent chạy lại).
  **Safari vẫn chưa đo được** (không có máy).
- **R5 — server literals + rate limiter:** `validate.js` 108 mã `validation.*` qua
  classifier + fragment round63-r5; `taskErrorPayload` 11 mã `TASK_*` (catalog
  bridge 91→102); SSE scene phase 2 chuỗi qua `scenePhase63R5.ts`; `jobQueue`
  recover note qua `noteCode: JOB_RECOVERED_RESTART` (web chưa tiêu thụ — xem §2).
  Test validationErrors63R5 **8/8** sau khi parent lật pre→post-merge; bridgeErrors
  9/9. **R5 LIMITS §6 nói `scene.phase.*` "không cần prefix" là SAI** — test đỏ
  đã chứng minh (xem §4.1). Server suites: validateCodes **1572/1572**,
  error-detail-structured **170/170**, bridge-error-protocol **142/142**,
  error-detail-ui **52/52** (parent chạy lại).
- **R6 — lỗi decoder trong lúc phát + proxy fallback + hold cache:**
  `decoderPlayback63R6.test.ts` **45/45** (theo LIMITS R6; parent chạy lại file
  pass, không in dòng tổng nội bộ). Hồi quy kèm: skippedAttrib61R8 20/20,
  skippedFlat60Q6 15/15, failsoftSurface58O3 13/13 (theo LIMITS R6).
- **R7 — projectId ổn định + khóa sổ theo id + lock chặn stale:** UUID lúc tạo
  project, sổ khóa theo `id:<uuid>` (2 file trùng tên khác id không ghi đè —
  unit + headed T4); migration file cũ sinh id + `projectIdMigrated`; lock
  generation/OCC, tab 2 đợi thật 3428ms/3796ms (headed 6/6, theo LIMITS R7).
  Test projectId63R7 **27/27** (parent chạy lại).
- **R8 — noise YUV + sharpen viewport + docs:** `addYuvNoise` mô hình yuv420p
  bt709, parity Node KHỚP (std 1.01, Δcorr ≤ 0.007); sharpen delta MAD 0.99→0.50
  ở downscale 2.6× nhưng le8 94–97% < 99% nên chưa KHỚP; noise headed vẫn
  LỆCH-THỐNG-KÊ do codec x264 làm mượt nhiễu render (~2× trên R/B) — nguyên nhân
  đã phân rã (theo LIMITS R8). Test effectCanvas pass (parent chạy lại).
- **R9 — mã lỗi MCP/CLI + i18n preload + runner:** 130 `throw ValidationError` +
  24 `fail()` đều có mã trong catalog 41 mã; CLI 45 `throw CliError` trong catalog
  23 mã; test validateCodes63R9 **53/53**, preload63R9 **6/6**, runner **3/3**,
  webglLut **7/7**, speedcurveTrim **18/18** (parent chạy lại hết, xem §5.3 về
  cách chạy đúng — 2 test này kén runner). Hồi quy MCP: roundtrip **130/130**,
  migrateMotion **8/8**, migrateRender pass, new-tools 5, apply-transition-81
  **19/19**, error-codes wire **6/6**, CLI `test-cli.sh` **24/24** (parent chạy lại).
- **R10 — đóng nợ đợt 62 §4 mục 10+11 (docs/quyết định):** (1) nhánh `warnTooShort`
  chết qua UI — đã xóa nhánh + test hồi quy 5/5; key `speed.warnTooShort` chờ
  parent xóa lúc gộp — **đã xóa** (xem §2). (2) Rà soát 285 chuỗi EN template +
  46 chuỗi EN text preset, sửa 3 câu (fragment r10, test 6/6; N5 10/10, M7 10/10;
  KHÔNG claim "chuẩn bản ngữ"). (3) N6 giữ nguyên quyết định cũ, ghi vào LIMITS
  N6 §8. (4) Docs index + FEATURE_STATUS cập nhật 8 điểm, 0 link hỏng.

## 2. Gộp fragment — chi tiết

- Nguồn: 5 fragment `apps/web/src/i18n/fragments/round63-{r1,r5,r7,r9,r10}.json`.
  Đếm lá độc lập (không tin con số handoff): r1 5, r5 123, r7 2, r9 1, r10 0 gộp
  được. **Không có collision** (không key nào trùng dict cũ với giá trị khác).
- r1: `caption.phase.*` (5 key: extract/group/transcribe/translating/upload).
- r5: `validation.*` 109 (gồm `validation.detail`), `bridgeErrors.TASK_*` 11,
  `scene.phase.*` 2, `jobNote.recoveredRestart` 1.
- r7: `projectRepo.projectIdMigrated`, `structuredNotes.projectIdMigrated` (2 key).
- r9: `desktop.preloadIpcNotBytes` (1 key).
- r10: **gộp 0 key.** 3 chuỗi EN trong fragment là override tầng helper, đã được
  R10 nối qua `templateContentLocale.ts` (thứ tự gộp m7 < n5 < r10):
  `templatePack.album-teaser.description`, `audiobook-promo.description`,
  `tiktok-viral.name`. Gộp vào dict sẽ GHI ĐÈ giá trị dict nên parent dừng lại
  đúng chỗ — không phải thiếu sót. `meta` (12 lá) của r10 chỉ là tài liệu, bỏ qua.
- **Xóa 2 key khỏi dict (quyết định của parent, có lý do):**
  1. `speed.warnTooShort` — nhánh chết, R10 đã xóa code + chứng minh bằng headed
     đo + bất biến `applySpeed` clamp (0 tham chiếu trong src phi-test). Giữ key
     trong dict sẽ làm test orphan đỏ — và key chết không có chỗ trong dict.
  2. `jobNote.recoveredRestart` — R5 LIMITS §6: "web hiện không hiển thị job.note
     ở đâu"; không có điểm tiêu thụ `publicJob` nào trong web. Key chưa có UI thì
     chưa vào dict; fragment (đã stage) giữ key cho đợt UI sau. Object `jobNote`
     rỗng nên xóa cả object.
  → 2146 + 131 − 2 = **2275**. Cả hai key đều KHÔNG bị mất: fragment r5 giữ
  `jobNote.recoveredRestart`; việc xóa `speed.warnTooShort` khỏi dict đi kèm
  test hồi quy 5/5 của R10 khóa nhánh chết.
- Sau gộp: vi == en == 2275 lá, cùng tập key, 0 mismatch, 0 orphan (P7 8/8,
  orphans Q4 16/16).

## 3. ci-security.yml — R10 đổi gì, xử lý thế nào

- R10 thêm bước `pip-audit — tracking` vào `.github/workflows/ci-security.yml`
  (file requirements thứ 5: `server/tracking/requirements.txt`,
  numpy==2.5.4 + opencv-python-headless==5.0.0.93 — motion tracking từ Phase 8 Q5;
  cập nhật header comment 4→5 file + `SECURITY.md` §4.1). Thay đổi có ý nghĩa
  nhưng **LOCAL-ONLY**: GitHub App Muse thiếu quyền workflows:write, trả 403
  "Resource not accessible by integration" từ Phase 6 đến nay; repo vẫn không có
  CI nào chạy thật.
- Parent đã **gỡ entry `.github/workflows/ci-security.yml` khỏi
  `phase9-round63-r10-docs-dead-branch.txt` (11→10 entry, 456→422 byte,
  đọc lại kiểm chứng 10/10 file tồn tại, kết thúc NUL)**. File trên đĩa KHÔNG bị
  xóa, thay đổi của R10 KHÔNG bị revert (3005 byte, bước tracking còn nguyên
  dòng 87–88). User muốn lên GitHub thì tự thêm qua web GitHub (hoặc cấp quyền
  Workflows Read and write cho App rồi cài lại App — vẫn đang chờ user từ 22/10).

## 4. File chung + test đỏ do gộp gây ra (đã sửa hết, không để đỏ)

### 4.1 DYNAMIC_PREFIXES — 3 key/prefix mới (P7 + orphans, cả hai file)

Sau gộp, `i18nAudit59P7.test.ts` và `i18nOrphans60Q4.test.ts` đỏ với cùng danh
sách orphan (9 key, trừ `jobNote.recoveredRestart` — key này đã xóa khỏi dict nên
tự rớt khỏi danh sách khi chạy lại). Nguyên nhân: scanner tĩnh chỉ quét
`apps/web/src` (phi-test) + fragment, không thấy key đọc động:

- `caption.phase.*` / `scene.phase.*`: đọc qua bảng fragment
  (`captionPhase63R1.ts` / `scenePhase63R5.ts`, key theo phase lúc chạy) — chuỗi
  key đầy đủ không bao giờ xuất hiện trong src. R5 LIMITS §6 cho rằng
  `scene.phase` "không cần prefix" là **sai**; test đỏ là bằng chứng.
- `desktop.preloadIpcNotBytes`: dùng trong `apps/desktop/src/preload.ts`
  (preload sandbox, chuỗi inline, khóa bằng test preload63R9 với fragment) —
  ngoài phạm vi quét `apps/web/src` của test. Key `desktop.*` còn lại
  (`desktop.saveError`) vẫn thấy được vì web có dùng.

Sửa: thêm `"caption.phase."`, `"scene.phase."`,
`"desktop.preloadIpcNotBytes"` vào `DYNAMIC_PREFIXES` ở CẢ HAI file, kèm comment
giải thích (không thêm `jobNote` — key đã xóa). Đồng thời sửa `same.length`
50→51 ở P7 (dòng 328; file orphans đã sửa 50→51 ở vòng trước) + cập nhật comment
"validation" (ghi rõ đã gộp vào dict lúc parent gộp đợt 63, thay cho câu cũ
"hiện dict chưa có key này"). P7 8/8, orphans 16/16 sau sửa.

### 4.2 Lật test pre-merge → post-merge

- `validationErrors63R5.test.ts`: lật thành post-merge — 122/123 key trong dict
  (giá trị khớp fragment từng key), `jobNote.recoveredRestart` khẳng định VẮNG
  (chưa có UI tiêu thụ, xem §2); cập nhật header dòng 6–10. **8/8**.
- `bridgeErrors62R5.test.ts`: lật thành post-merge — 102 key trong dict, giá trị
  khớp fragment. **9/9** (đã 9/9 từ trước khi lật, nay khóa đúng trạng thái).

### 4.3 File chung khác

- `apps/web/tsconfig.json`: cả hai exclude của R4 (dòng 181
  `gopTrialDecode63R4.test.ts`) và R7 (dòng 196 `projectId63R7.test.ts`) đều có,
  165 entry, 0 trùng, JSON hợp lệ.
- `apps/web/src/lib/i18nServerLiterals61R6.test.ts`: cả hai hunk R5 (snapshot
  jobQueue 26→25, tổng 247→246) và R9 (preload API_ERROR 1→0 / OTHER 0→1) đều
  sống, không ghi đè nhau. **4/4**. Header "247 literal" đã sửa → 246.
- Snapshot count 2146→2275 ở TẤT CẢ file khóa số (giữ nguyên comment lịch sử,
  chỉ thêm dòng đợt 63): D4, saveToast31, structuredNotes32, errorDetail34Q4
  (comment-only), B6, Z6, E2, ProjectMenu.i18n55L1, i18nRound57N4, i18nAudit59P7,
  i18nOrphans60Q4, `server/bridge/test/test-error-detail-structured.cjs`,
  speedWarnTooShortDead63R10 (comment).

## 5. Kiểm chứng của parent trên cây đã gộp (chạy lại độc lập)

### 5.1 Build + typecheck

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi** (chạy 2 lần: trước và
  sau khi sửa test — lần 2 vẫn 0/0).
- `vite build` apps/web: **pass** (chạy 2 lần trên cây đã gộp: lần 1 5,95s trước
  khi sửa file test; lần 2 cuối cùng 17,42s, exit 0, sau mọi sửa — chạy từ
  `apps/web`. Chạy từ repo root với `--config apps/web/vite.config.ts` sẽ lỗi
  "Could not resolve entry module index.html" vì vite tìm index.html theo cwd —
  đó là lỗi cách gọi, không phải lỗi code).

### 5.2 i18n / snapshot

- P7 8/8 · orphans Q4 16/16 · validationErrors63R5 8/8 · bridgeErrors62R5 9/9 ·
  i18nServerLiterals61R6 4/4 · D4 3/3 · saveToast31 15/15 · structuredNotes32 12/12 ·
  B6 8/8 · Z6 10/10 · E2 3/3 · L1 6/6 (CJS) · i18nRound57N4 pass · errorDetail34Q4
  35 pass · speedWarnTooShortDead63R10 xanh (runner).
- Dict đếm lại độc lập: vi = en = **2275 lá**, symdiff 0.

### 5.3 Test mới đợt 63 + hồi quy (parent chạy lại)

- R1: captionPhase63R1 10/10 · modalSheet63R1 pass.
- R3: enhancePreview63R3 8/8 · 62R3 10/10 · 61R3 7/7 · 60Q1 16/16.
- R4: gopTrialDecode63R4 pass · 62R4 pass.
- R5: server suites — validateCodes 1572/1572 · error-detail-structured 170/170 ·
  bridge-error-protocol 142/142 · error-detail-ui 52/52.
- R6: decoderPlayback63R6 pass (45/45 theo LIMITS R6).
- R7: projectId63R7 27 pass.
- R8: effectCanvas pass.
- R9: validateCodes63R9 **53/53** · preload63R9 **6/6** · runner 3/3 · webglLut 7/7 ·
  speedcurveTrim 18/18 · MCP roundtrip 130/130 · migrateMotion 8/8 · migrateRender
  pass · new-tools 5 · apply-transition-81 19/19 · error-codes wire 6/6 · CLI
  `test-cli.sh` **24/24**.
- R10: templateEnReview63R10 6/6 · templateContentLocale57N5 10/10.
- Hồi quy: GOP I6 (gopFakeMoov52I6) pass · K8 (gopFakeMoov54K8) pass · L2
  i18nAudit55L2 **20/20**.
- **Ghi chú cách chạy (bài học đợt này, để đợt sau khỏi mất thời gian):**
  preload63R9 BẮT BUỘC `--alias:electron=./apps/desktop/test/electron-stub-63r9.ts`
  (ghi trong header test; bundle không alias sẽ lấy package electron thật và đỏ
  `ipcRenderer undefined` / `Cannot find module install.js`). validateCodes63R9
  và migrateRender BẮT BUỘC bundle ở vị trí sâu 4 cấp dưới repo root (test tính
  ROOT bằng `..` ×4 từ `import.meta.url` / tìm repo root đi lên — bundle ở /tmp
  cho ra `/mcp-server/src` hoặc "không tìm thấy repo root"). Web lib test dùng
  esbuild bundle; test import react-dom/server phải `--format=cjs`; test đọc file
  đường dẫn tương đối phải chạy với cwd = repo root.

### 5.4 Chưa xong / chưa chạy lại được trong đợt gộp

- **R2 (3 test render) — ĐÃ CHẠY LẠI XONG, exit 0:** lượt chạy đầu của parent bị
  mất session do service restart giữa chừng (lúc đó test render_cost.js đã in
  xong JSON summary, test `_cpu.js` đang chạy ffmpeg thật 142% CPU). Parent
  chạy lại `test_round63_r2_render_cost.js` nền (session proc_499615689c49):
  **exit 0 sau ~9,7 phút** — test chính pass trên cây đã gộp (số 49/49 theo
  LIMITS của luồng; output tail chỉ giữ JSON summary, không giữ dòng đếm —
  exit 0 là bằng chứng pass). Hai test phụ (`_cpu.js` 28/28, `_motion_metric.js`
  11/11) vẫn trích theo LIMITS luồng (tiền lệ: test render đo thật, không chạy
  lại khi gộp).

## 6. Nợ mở cho đợt 64 (tổng hợp từ LIMITS các luồng + gộp)

1. R3: đo lại FPS blend khi VM rảnh (số hiện tại đo lúc VM tải).
2. R8: noise preview YUV — mô hình Node KHỚP nhưng headed vẫn lệch do x264 làm
   mượt nhiễu; cần quyết định có chấp nhận "xấp xỉ" hay đào tiếp.
3. R4: keyframe 37–42 MB ở tải nặng vẫn vượt trần worker 45s (fail-open có lý do);
   Safari chưa đo được.
4. R7: registry tên project trùng (duplicate project-name registry) chưa xử lý.
5. R5: rate-limiter dùng chung Map bucket — quirk còn đó (xem LIMITS R5 §6).
6. Cũ chưa đóng: M10 2 case fake-moov khó vẫn pass nhưng chưa chắc; EN template
   M7 do người viết tay, chưa qua người bản ngữ rà soát (R10 chỉ sửa 3 câu sai rõ).
7. `jobNote.recoveredRestart`: fragment đã stage, chờ đợt UI nào hiển thị
   `job.note` thì nối vào dict (lúc đó xóa phần "chưa gộp" trong
   validationErrors63R5.test.ts).
8. A/B seek <10% + CPU gate vẫn chưa mở (cần phiên yên tĩnh ~20–40 phút từ main
   chat — chưa từng xảy ra).
9. ci-security.yml vẫn LOCAL-ONLY (403 workflows) — chờ user (xem §3).

## 7. Stage (parent)

- Closing batch: `~/workspace/repo-1-push/paths-loop/phase9-round63-closing.txt`
  — **19 entry** (vi.json + en.json + 16 file test/cjs parent sửa + LIMITS này),
  text-only, kết thúc NUL, đọc lại kiểm chứng 19/19 file tồn tại.
- Tổng chờ push sau đợt 63: **1180 entry / 127 file** (1030 + 131 + 19).
- KHÔNG push, KHÔNG release/tag (lệnh đứng; user tự push từ main chat khi muốn).
