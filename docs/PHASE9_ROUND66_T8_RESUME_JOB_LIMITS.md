# LIMITS — Phase 9 đợt 66, luồng T8: RESUME JOB KHI MỞ LẠI ExportPanel + NÚT NGÔN NGỮ TopBar KHI MODAL MỞ

Ngày: 2026-11-08. Luồng T8, đóng nợ đợt 65 S10 / ROUND65_LIMITS §8.7:
"Mở lại ExportPanel không resume job đang chạy — thiếu tính năng resume
(panel mount → GET job đang chạy gần nhất → poll tiếp)" và "nút ngôn ngữ
TopBar không bấm được khi modal Export mở".
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG
release/tag.

## 0. Kết luận trước: CẢ 2 NỢ ĐỀU ĐÓNG — CÓ SỬA CODE + KIỂM CHỨNG HEADED

1. **Resume job: xong.** Mở lại ExportPanel nối lại job đang chạy/xếp
   hàng (đúng job id, đúng progress/ETA/queue/note, poll tiếp), job lỗi/
   gián đoạn mới nhất thì hiện trạng thái lỗi + note phục hồi + nút
   "Render lại từ đầu" (retry thật qua endpoint bridge đã có). Headed
   **8/8** (xem §4): resume đúng job, SIGKILL bridge + restart rồi
   retry chạy lại thật (progress 0 → 0,03 sau retry).
2. **Nút ngôn ngữ TopBar: xong.** Gốc rễ là stacking context:
   `.topbar` có `z-index: 30` nên mọi con của nó (kể cả nút cờ) bị kẹt
   dưới `.modal-backdrop` (fixed, inset 0, z 400). Sửa: bỏ z-index của
   `.topbar`, nút cờ mang class riêng `.topbar-lang-btn` với
   `position: relative; z-index: 401` — chỉ nút này thoát lên trên
   backdrop (dưới tour-card 450 / toasts 500, giữ thứ tự z của đợt 62
   R1), phần còn lại của TopBar vẫn nằm dưới backdrop nên modal giữ
   nguyên ngữ nghĩa chặn tương tác nền. Headed chứng minh bằng chuột
   thật + `elementFromPoint`: bấm được khi modal mở, desktop
   1440×900 và mobile 390×844, toggle được cả 2 chiều, modal vẫn mở,
   tiến trình vẫn chạy.

## 1. Thiết kế resume (ExportPanel.tsx + lib/resumeRenderJob66T8.ts)

- **Không thêm endpoint bridge.** Dùng `GET /api/render` đã có
  (mới nhất trước, xem jobQueue.js `list()` sort createdAt desc +
  seq tiebreak) + `GET /api/render/:id?detail=1` (errorDetail chỉ có
  ở đó) + `POST /api/render/:id/retry` (đã có từ trước).
- **Chọn ứng viên** (`pickResumeCandidate`, lib thuần, test khóa):
  ưu tiên job active (`running`/`queued`) mới nhất — dù có job lỗi
  mới hơn; không có active thì job retryable (`error`/`interrupted`)
  mới nhất; còn lại (`done`/`cancelled`/không có job) → panel mở
  idle như cũ (job done không resume — đúng thiết kế R8 §5.2: lịch
  sử job là việc riêng; job đã huỷ thì không có gì để nối).
- **Áp job** (`applyResumedJob`): active → `rendering` + progress/
  ETA/queue/note (resolve theo locale hiện tại bằng `getLang()`,
  mẫu R8/S10) + `pollStatus(job.id)`; error/interrupted → trạng thái
  `error` + error (dịch qua `resolveBridgeApiError` theo errorCode)
  + errorDetail + note, không poll (job đã ở trạng thái cuối).
- **Chống đua resume-vs-startRender:** ref `activeJobIdRef` mirror
  jobId; effect resume bỏ qua nếu ref/poll đã có chủ (user bấm Xuất
  trong lúc fetch danh sách còn bay). `pollStatus` vẫn clear interval
  cũ nên cuối cùng vẫn đúng ngay cả khi đua lọt qua.
- **startRender xoá jobId cũ ngay** (trước mọi early-return) để nút
  "Render lại"/tải MP4 không trỏ nhầm job cũ khi lần render mới lỗi
  trước khi POST (vd thiếu media, curve vi phạm) — đồng thời sửa wart
  cũ: trước đây jobId cũ còn sót thì tải MP4 vẫn tải output job cũ
  trong lúc panel báo lỗi mới.
- **Nút "Render lại"** hiện cho mọi lỗi có jobId (cả lỗi vừa render
  xong — endpoint retry của bridge nhận mọi job error/interrupted),
  chống bấm đúp bằng `retrying`, lỗi retry (vd 409 JOB_GONE khi thư
  mục job đã bị dọn) hiện như lỗi render thường.
- **Nhãn resume + data-job-id:** khối `.render-progress` mang
  `data-job-id` (điểm bám headed) và dòng "Đã nối lại tiến trình xuất
  đang chạy." khi job được nối lại; trạng thái lỗi cũng hiện
  `.render-note` (note phục hồi) + nhãn resume — note không còn chỉ
  hiện trong lúc render như R8.
- **Auto-scroll khi resume:** effect `[resumedJob]` cuộn tới
  `.render-progress` (hoặc `.mp4-export .valid-banner.bad` khi lỗi)
  vì nội dung modal dài, khối này thường nằm dưới fold ở viewport
  thấp — ảnh chụp headed lượt 1 cho thấy panel đã resume nhưng
  progress khuất dưới fold. Chỉ chạy khi resumedJob vừa bật, không
  cuộn lại khi job xong hay khi user tự mở panel lúc idle.
- **Chuỗi mới** (fragment `round66-t8.json`, đọc trực tiếp như mẫu
  S4 — không chờ gộp dict): `exportPanel.resumedJob` ("Đã nối lại
  tiến trình xuất đang chạy." / "Resumed the running export job."),
  `exportPanel.retryRender` ("Render lại từ đầu" / "Render again from
  the start"). **Parent gộp sau, KHÔNG tự gộp dict** (theo lệnh luồng).

## 2. Thiết kế sửa nút ngôn ngữ (TopBar.tsx + styles.css)

- **Gốc rễ (đo, không đoán):** `.modal-backdrop` fixed inset 0 z 400
  phủ toàn màn hình; `.topbar` `position: relative; z-index: 30` tạo
  stacking context nên nút cờ (con của topbar) không thể vượt qua
  backdrop bằng z-index riêng — mọi click vào vùng nút cờ đều rơi
  vào backdrop (đóng modal). Không có focus trap nào liên quan
  (ExportPanel không trap focus; chỉ có backdrop onClick + aria-modal).
- **Vì sao không nâng cả `.topbar` lên 401:** nâng cả thanh sẽ làm
  MỌI nút TopBar (undo, split, caption, ProjectMenu…) bấm được qua
  modal, phá ngữ nghĩa chặn nền của modal; trên mobile modal
  bottom-sheet cao gần full viewport sẽ bị TopBar đè lên cả vùng
  tiêu đề + nút ×. Chỉ nâng đúng nút ngôn ngữ là vết cắt nhỏ nhất.
- **Vì sao phải bỏ z-index của `.topbar`:** con của một stacking
  context không thoát ra được dù z-index riêng cao bao nhiêu; bỏ
  z-index (giữ `position: relative` làm neo cho `.flash-msg`) thì
  nút cờ mới tham gia stacking context gốc. Đã kiểm chứng các phần
  tử dưới TopBar không chồng lên dải topbar (timeline/preview z 1–6
  nằm trong flow phía dưới; `.flash-msg` z 50 vẫn vẽ trên nội dung
  editor; splash 200 / pill FPS 300 / toasts 500 / tour-card 450 đều
  giữ nguyên thứ tự — fpsModal62R1 6/6 vẫn xanh).
- **Mobile 390×844:** đo chồng lấn thật — nút cờ vs nút × của modal
  **0px²** (nút × 1320px² không bị che). Nút cờ nổi trên backdrop
  (z 401) nên bấm được; nút × vẫn bấm được; đóng bằng backdrop vẫn
  được. Không cần chỉnh max-height modal trên mobile.

## 3. Test mới + hồi quy

| Test | Kết quả |
|---|---|
| `apps/web/src/lib/resumeRenderJob66T8.test.ts` (mới) | **26/26 pass** — chọn ứng viên (active/retryable/idle, mới nhất thắng, thiếu createdAt giữ thứ tự list, bỏ job không id), fragment đủ key vi≠en, không trả key thô, nối UI tĩnh (mount fetch, resume, retry, xoá jobId cũ, data-job-id, note ở trạng thái lỗi, auto-scroll, class topbar-lang-btn + z 401 > 400) |
| Headed `apps/web/scripts/clicktest-66t8-resume-job-headed.mjs` (mới) | **8/8 pass** — xem §4 |
| Hồi quy `jobNote65S10.test.ts` (S10, đã cập nhật §3 theo thiết kế mới) | **13/13 pass** (cũ 12/12 + 1 assert mới tách từ assert cũ: lang-btn z 401) |
| Hồi quy `jobNote64R8.test.ts` (R8) | **19/19 pass** |
| Hồi quy `gpuProbe65S4.test.ts` (S4) | **9/9 pass** |
| Hồi quy `fpsModal62R1.test.ts` (thứ tự z) | **6/6 pass** |
| Hồi quy `cssClasses60Q2.test.ts` / `cssClasses61R4.test.ts` | **59/59 + 60/60 pass** |
| Hồi quy `i18nAudit59P7.test.ts` (P7) / `i18nOrphans60Q4.test.ts` | **8/8 + 16/16 pass** |
| `node apps/web/scripts/r6-i18n-check.cjs` | **PASS** (vi=en=2297, không đổi — key mới chỉ ở fragment, parent gộp sau) |
| `tsc` apps/web | **0 lỗi** |
| `vite build` apps/web | **pass** (50,53s; cảnh báo chunk >500kB có từ trước) |

Cách chạy unit (từ gốc repo):
`./node_modules/.bin/esbuild apps/web/src/lib/resumeRenderJob66T8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round66-t8/t8.test.cjs && node /tmp/round66-t8/t8.test.cjs`
Cách chạy headed (từ gốc repo):
`node apps/web/scripts/clicktest-66t8-resume-job-headed.mjs`
(env cổng/display riêng T8: dev 5750–5759, debug 9850–9859 + mobile
9860–9869, bridge 8950–8959, display :226–:235, scratch
hidden_files/round66-t8/headed, TMPDIR /tmp/round66-t8/tmp).

## 4. Kiểm chứng headed (số thật, lượt chạy 5 — cuối cùng, 2026-11-08 12:31 +07, EXIT=0)

| Case | Kết quả |
|---|---|
| H0 setup vi + mẫu tự load | PASS — 3 clip, media bin 2 item đều có file, duration 8s |
| H1 `.render-note` vắng trước render | PASS |
| H2 bấm Xuất MP4 → render thật | PASS — job `f44ee9d7529b1d78` status=running progress=0 |
| **H3 đóng modal → mở lại RESUME đúng job** | **PASS — `data-job-id=f44ee9d7529b1d78` khớp job cũ, nhãn resume vi hiện, progress 0 → 0 (không lùi, job vẫn chạy)** |
| **H4 nút cờ bấm được khi modal mở (desktop 1440×900)** | **PASS — `elementFromPoint` tại tâm nút cờ là chính nút (không bị backdrop che); bấm chuột thật → en ("Export video", "⬇ Publish", modal vẫn mở, progress còn); bấm lại → vi ("Xuất video")** |
| **H5 SIGKILL bridge → restart → resume job lỗi + retry** | **PASS — kill lúc job running progress=0; restart xong job `interrupted` + noteCode `JOB_RECOVERED_RESTART` (bằng chứng server); mở lại panel: note vi + nút "Render lại từ đầu" + nhãn resume hiện; bấm retry bằng chuột thật → status=running, progress 0 → 0,03 (tăng tiếp sau retry)** |
| **H6 mobile 390×844: nút cờ bấm được khi modal mở** | **PASS — `elementFromPoint` là nút cờ; bấm → en, bấm lại → vi, modal vẫn mở; chồng lấn nút cờ vs nút × = 0px²** |
| H7 0 lỗi trang | PASS — không window.onerror / unhandledrejection cả phiên (desktop + mobile) |

Ảnh chụp (hidden_files/round66-t8/headed/): `t8-resumed.png` (khối
progress + nhãn "Đã nối lại…" đã cuộn vào giữa viewport sau resume),
`t8-lang-while-modal-open.png`, `t8-after-retry.png`,
`t8-mobile-lang.png`.

### 4.1. Hai lượt chạy headed hỏng trước khi xanh (ghi trung thực)

- **Lượt 1 (chết ở H4):** `CDP.send timeout 60s: Runtime.evaluate`
  lúc VM load trung bình **31,79** (nhiều luồng round-66 khác đang
  render ffmpeg nặng song song — 1 job 8192×4320 + vidstab T1). Không
  phải lỗi code: renderer bị đói CPU. Sửa harness: timeout CDP
  60s → 240s (ghi trong code). H0–H3 lượt này đã PASS (resume đúng
  job `7b34b86b992ca490`).
- **Lượt 3 (H5 FAIL, 7/8):** bấm nút "Retry" trượt — nút nằm dưới
  fold (`.modal` overflow:hidden, viewport headed chỉ ~685px cao),
  finder đo rect khi chưa cuộn nên click rơi ngoài viewport, job ở
  yên `interrupted` 180s. Đây là lỗi finder, không phải lỗi sản
  phẩm: nội dung modal cuộn được bằng scrollIntoView (S10 đã dùng
  cho CTA). Sửa harness: `RETRY_BTN_FN` scrollIntoView rồi mới đo
  rect + fail nhanh nếu panel không chuyển sang rendering trong 20s
  sau click (thay vì chờ 180s mù). Lượt 4 (8/8) và lượt 5 (8/8) xác
  nhận sửa đúng: nút retry đo được tại (498, 463) sau khi cuộn.

## 5. Nợ mở (mới + còn lại)

1. **Job `done` mở lại panel vẫn về idle** (giữ thiết kế R8 §5.2):
   user không tải lại được MP4 job vừa xong nếu đã đóng panel — cần UI
   "lịch sử job" riêng (không làm trong luồng này).
2. **Desktop Electron: đích `.mp4` không bền qua reopen.** Resume
   chỉ nối theo dõi; `exportDest` (đích đã chọn trước khi render ở
   Phase 10 G4) không được persist theo jobId nên tải MP4 sau resume
   trong Electron rớt về anchor download của trình duyệt thay vì ghi
   thẳng ra đích đã chọn. Cần persist đích theo jobId (localStorage
   hoặc bridge) ở đợt riêng — ngoài phạm vi "theo dõi tiếp" của nợ
   này. (Web thường không ảnh hưởng: anchor download vẫn đúng.)
3. **Panel đang mở mà bridge restart:** job `interrupted` nhưng
   `pollStatus` không có nhánh terminal cho `interrupted` nên vẫn poll
   mãi với note hiện (hành vi cũ từ R8/S10, test S10 khóa) — chỉ
   phiên MỞ LẠI panel mới hiện trạng thái lỗi + nút retry. Muốn nhất
   quán thì thêm nhánh `interrupted` vào pollStatus ở đợt riêng
   (cẩn thận: sẽ đổi assert H5 của script headed S10 — progress bar
   biến mất khi job interrupted).
4. **Upload đang bay thì đóng panel:** job chưa POST lên bridge nên
   không có gì để resume; mở lại panel về idle, upload cũ có thể vẫn
   hoàn tất phía server thành job queued rồi mới resume được ở lần mở
   sau. Hiếm (upload chỉ vài giây), chấp nhận.
5. **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền
   workflows:write) — nợ cũ, không đổi.
6. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/
   hơn CapCut thật.

## 6. File đổi/thêm (stage batch `phase9-round66-t8-resume-job.txt`, 9 file)

Mới (5): `apps/web/src/lib/resumeRenderJob66T8.ts`,
`apps/web/src/lib/resumeRenderJob66T8.test.ts`,
`apps/web/src/i18n/fragments/round66-t8.json`,
`apps/web/scripts/clicktest-66t8-resume-job-headed.mjs`,
`docs/PHASE9_ROUND66_T8_RESUME_JOB_LIMITS.md`.
Sửa (4): `apps/web/src/ExportPanel.tsx` (resume + retry + auto-scroll
+ xoá jobId cũ), `apps/web/src/TopBar.tsx` (class topbar-lang-btn),
`apps/web/src/styles.css` (bỏ z-index .topbar, thêm .topbar-lang-btn
z 401), `apps/web/src/lib/jobNote65S10.test.ts` (§3 cập nhật theo
thiết kế mới: 12/12 → 13/13).
Không đụng: bridge server (không thêm endpoint), dict i18n
(vi.json/en.json giữ 2297 key — fragment chờ parent gộp), không binary,
không dist.
