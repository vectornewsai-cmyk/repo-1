# LIMITS — Phase 9 đợt 67, luồng U7: UI LỊCH SỬ JOB + NHÁNH `interrupted` TRONG POLL + RESUME UPLOAD KHI ĐÓNG PANEL

Ngày: 2026-11-08. Luồng U7, đóng nợ đợt 66 T8 / ROUND66_LIMITS §8.7:
"Job `done` mở lại vẫn idle (cần UI lịch sử job); panel đang mở mà
bridge restart thì poll chưa có nhánh `interrupted`; upload đang bay
thì đóng panel không resume được" (xem docs/PHASE9_ROUND66_T8_RESUME_JOB_LIMITS.md §5 mục 1/3/4).
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG
release/tag.

## 0. Kết luận trước

1. **Lịch sử job: xong.** Section "Lịch sử xuất" trong ExportPanel,
   persist localStorage (key `vcut.jobHistory.v1`, tối đa 20 mục, mới
   nhất trước): job `done` mở lại panel vẫn thấy trong lịch sử, bấm
   "Xem kết quả" hiện đúng banner done + nút tải MP4 (không idle);
   job đang chạy thì "Theo dõi tiếp", job lỗi/gián đoạn thì "Render
   lại", mục nào cũng "Xoá" được (persist ngay). Headed **H5 PASS**
   (xem §4).
2. **Nhánh `interrupted` trong poll: xong.** Panel đang mở mà bridge
   restart thì poll tự chuyển sang trạng thái lỗi (dừng poll, banner
   lỗi + note phục hồi + nút "Render lại", dòng lịch sử
   `interrupted`) — KHÔNG cần đóng/mở lại panel như T8 H5. Headed
   **H3 PASS** (xem §4).
3. **Resume upload khi đóng panel: xong.** Đóng panel giữa lúc upload
   đang bay (POST chưa xong) → mở lại thấy trạng thái uploading +
   ghi chú chờ job → panel tự nối job mới khi upload hoàn tất, bridge
   chỉ có đúng 1 job tạo sau phiên upload (không nhân đôi). Headed
   **H6 PASS** (xem §4).

## 1. Thiết kế

### 1.1. Lịch sử job (lib/jobHistory67U7.ts + ExportPanel.tsx)

- **Kho:** localStorage `vcut.jobHistory.v1`, chỉ metadata (id, trạng
  thái, tên file output, dung lượng, lỗi/note thô) — MP4 vẫn tải từ
  bridge qua `GET /api/render/:id/download`, không copy binary vào
  kho (trần localStorage ~5MB). Tối đa 20 mục; upsert dedupe theo id,
  **giữ createdAt gốc** khi poll cập nhật trạng thái (job cũ không bị
  đẩy lên đầu chỉ vì poll chạm vào nó).
- **Ghi ở đâu:** mọi chuyển trạng thái terminal trong pollStatus
  (done/error/interrupted/cancelled) + POST xong (mục `queued`) + huỷ
  (cancelRender). Ghi qua `recordJobHistory` (đọc lại từ kho mỗi lần
  nên không kẹt state cũ trong closure poll).
- **Hợp nhất lúc mount:** `GET /api/render?limit=10` upsert từng job
  vào lịch sử (trạng thái mới nhất thắng); mục local không còn trên
  bridge thì giữ nguyên — lịch sử là của user, chỉ user xoá.
- **Mở từ lịch sử (`openHistoryEntry`):** GET trạng thái THẬT từ
  bridge trước khi hiện (không tin trạng thái local đã cũ): done →
  banner done + tải MP4; running/queued/error/interrupted → nối tiếp
  qua `applyResumedJob` (T8); cancelled → tip đã huỷ; 404 (job đã bị
  dọn) → xoá khỏi lịch sử + báo "Job này không còn trên máy chủ (đã
  bị dọn)." — không hiện banner done giả.
- **Retry từ lịch sử (`retryHistoryJob`):** POST retry riêng (URL dựng
  bằng nối chuỗi) rồi dùng chung `refreshJobAfterRetry` với retryRender
  T8 — tách ra để giữ nguyên literal `${jobId}` mà test T8 khóa.
- **Chuỗi mới** (fragment `round67-u7.json`, đọc trực tiếp như mẫu T8
  — không chờ gộp dict): namespace `jobHistory.*`, 15 key
  (title/empty/openResult/resume/delete/gone + 7 nhãn trạng thái +
  uploadWaiting/uploadFailed). **Parent gộp sau, KHÔNG tự gộp dict**
  (theo lệnh luồng). Dict vi/en giữ 2326 key (r6-i18n-check PASS).

### 1.2. Nhánh `interrupted` trong pollStatus (ExportPanel.tsx)

- Trước đây poll chỉ xử lý done/error/cancelled: job chuyển
  `interrupted` (bridge recover sau restart — jobQueue.js: running →
  interrupted, kèm error/errorCode `JOB_INTERRUPTED_BY_RESTART` +
  note/noteCode `JOB_RECOVERED_RESTART`) thì poll cứ chạy mãi với note
  cũ, progress kẹt. Nay thêm nhánh terminal: dừng poll, về trạng thái
  error, `resolveBridgeApiError` dịch sẵn mã
  `JOB_INTERRUPTED_BY_RESTART` (đã có trong dict `bridgeErrors.*`),
  errorDetail kèm khi poll `?detail=1`, note phục hồi hiện qua
  `.render-note` (R8), nút "Render lại" hiện (endpoint retry nhận
  error/interrupted), ghi lịch sử với status `interrupted`.
- Lưu ý T8 §5.3 đã báo trước: đổi assert H5 của script headed S10?
  KHÔNG — S10 test là unit tĩnh, không assert hành vi poll với
  interrupted (chỉ khóa note + locale + handleClose); S10 vẫn 13/13
  sau đổi (xem §3). Script headed S10 (nếu chạy lại) sẽ thấy progress
  biến mất khi job interrupted — đó là hành vi mới đúng, không phải
  hồi quy.

### 1.3. Resume upload khi đóng panel (lib/jobHistory67U7.ts + ExportPanel.tsx)

- **Phiên upload** (`vcut.uploadSession.v1`): `beginUploadSession`
  ghi TRƯỚC khi POST /api/render (startedAt + tên project + nhãn
  preset + tên file media). POST xong → `clearUploadSession` + ghi
  lịch sử (mục `queued`) — ghi localStorage TRƯỚC setState để kể cả
  khi panel đã đóng giữa lúc upload thì lịch sử vẫn có job (fetch
  không bị huỷ khi unmount — không dùng AbortController). POST lỗi →
  xoá session + ghi mục lỗi kind="upload" (id `upload-<startedAt>`,
  không jobId) để lần mở sau thấy rõ thay vì lặng lẽ về idle.
- **Mở lại panel mà còn session:** không có ứng viên resume nào (T8)
  thì kiểm tra session: stale (>10 phút, tab đã đóng giữa lúc upload
  / bridge mất job) → xoá ngay, về idle; còn tươi → hiện trạng thái
  "uploading" + ghi chú `uploadWaiting` ("Đang tải file lên máy chủ —
  đóng panel không làm mất tiến trình…"), poll list 2s tối đa 120s,
  khớp job có createdAt >= startedAt − 5s (`findJobCreatedAfter`,
  mới nhất thắng) rồi nối tiếp: running/queued/error/interrupted →
  `applyResumedJob`; done (upload xong + render xong luôn trong lúc
  chờ) → mở thẳng kết quả; cancelled → ghi lịch sử, về idle. Hết
  120s không thấy job → xoá session, về idle. Nút Xuất bị disable
  trong lúc chờ (renderStatus "uploading") nên không POST lại, không
  nhân đôi upload.
- **Chống đua:** chờ upload chỉ chạy khi không có ứng viên resume và
  không có job/poll đang sở hữu panel (`activeJobIdRef`/`pollRef`);
  nếu ứng viên resume chính là job của phiên upload (POST đã xong
  nhưng panel đóng trước khi handler kịp xoá session) thì dọn session
  ngay khi áp ứng viên.

## 2. File đổi/thêm (stage batch `phase9-round67-u7-job-history.txt`, 7 file)

Mới (5): `apps/web/src/lib/jobHistory67U7.ts`,
`apps/web/src/lib/jobHistory67U7.test.ts`,
`apps/web/src/i18n/fragments/round67-u7.json`,
`apps/web/scripts/clicktest-67u7-job-history-headed.mjs`,
`docs/PHASE9_ROUND67_U7_JOB_HISTORY_LIMITS.md`.
Sửa (2): `apps/web/src/ExportPanel.tsx` (nhánh `interrupted` trong
pollStatus + ghi lịch sử ở mọi terminal + phiên upload trong
startRender + resume phiên upload lúc mount + section `.job-history`
với mở/retry/xoá từ lịch sử), `apps/web/src/styles.css` (rule
`.job-history*`, pill trạng thái).
Không đụng: bridge server (không thêm endpoint), dict i18n
(vi.json/en.json giữ 2326 key — fragment chờ parent gộp), không binary,
không dist. Log luồng ở
`workspace/goals/capcut-clone-video-editor/hidden_files/round67-u7.md`
(không thuộc batch repo).

## 3. Test mới + hồi quy

| Test | Kết quả |
|---|---|
| `apps/web/src/lib/jobHistory67U7.test.ts` (mới) | **31/31 pass** — map job→lịch sử, upsert dedupe/giữ createdAt/trần 20, persist + JSON hỏng, session begin/read/clear/stale 10 phút, findJobCreatedAfter (dung sai 5s), fragment 15 key vi≠en + không collision dict, nhãn 7 trạng thái + "Tải lên thất bại", nối UI tĩnh (nhánh interrupted, section lịch sử, open/retry từ lịch sử, session trong startRender/mount, giữ literal T8) |
| Headed `apps/web/scripts/clicktest-67u7-job-history-headed.mjs` (mới) | **9/9 pass** (EXIT=0, xem §4) |
| Hồi quy `jobNote65S10.test.ts` (S10) | **13/13 pass** |
| Hồi quy `jobNote64R8.test.ts` (R8) | **19/19 pass** |
| Hồi quy `resumeRenderJob66T8.test.ts` (T8) | **26/26 pass** |
| Hồi quy `i18nOrphans60Q4.test.ts` | **16/16 pass** |
| Hồi quy `gpuProbe65S4.test.ts` (S4) | **9/9 pass** |
| Hồi quy `fpsModal62R1.test.ts` (thứ tự z) | **6/6 pass** |
| Hồi quy `cssClasses61R4.test.ts` | **60/60 pass** |
| `node apps/web/scripts/r6-i18n-check.cjs` | **PASS** (vi=en=2326, không đổi — key mới chỉ ở fragment, parent gộp sau) |
| `tsc` apps/web | **0 lỗi** |
| `vite build` apps/web | **pass** (29,42s; cảnh báo chunk >500kB có từ trước) |

Cách chạy unit (từ gốc repo):
`./node_modules/.bin/esbuild apps/web/src/lib/jobHistory67U7.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round67-u7/u7.test.cjs && node /tmp/round67-u7/u7.test.cjs`
Cách chạy headed (từ gốc repo):
`node apps/web/scripts/clicktest-67u7-job-history-headed.mjs`
(env cổng/display riêng U7: dev 5780–5789, debug 9890–9899, bridge
8970–8979, display :246–:255, scratch hidden_files/round67-u7/headed,
TMPDIR /tmp/round67-u7/tmp; BRIDGE_RATE_PERSIST_PATH riêng theo T9).

### 3.1. Hai lần sửa test sai trước khi xanh (ghi trung thực)

- **findJobCreatedAfter (lượt 1):** test dùng mốc ms nhỏ (8000/9500)
  trong khi dung sai là 5000ms nên mọi job đều "khớp" — test sai, lib
  đúng. Sửa test sang mốc thực (1_000_000) + biên đúng 5s (995_000
  khớp, 994_999 không khớp).
- **Nhánh interrupted (lượt 1):** slice assert 900 ký tự quá ngắn do
  comment giải thích trong nhánh dài — test sai, code đúng. Nâng
  slice lên 1600 ký tự.

### 3.2. Hồi quy đỏ KHÔNG do luồng này (ghi trung thực, để parent xử lý)

- **`i18nAudit59P7.test.ts`: 6/8** (trước đây 8/8): 2 assert đỏ đều
  ở `lib/projectHistory.ts` — 3 chuỗi vi mới "Lịch sử trong bản nén…"
  + trKey `projectHistory.archiveHistoryProjectMismatch` chưa có trong
  dict. File này do luồng round-67 khác đang sửa ngay lúc chạy
  (mtime 21:54 +07, sau khi lượt U7 bắt đầu).
- **`cssClasses60Q2.test.ts`: crash ở check cuối** (checkI18n
  `components/project/HistoryPanel.tsx` — 24 key): cùng luồng kia đang
  sửa `HistoryPanel.tsx` (mtime 21:50 +07). Test 1–56 của file vẫn
  pass; chỉ check i18n cuối crash do file đang sửa dở.
- U7 KHÔNG đụng 2 file đó, không đụng dict. Sẽ chạy lại cuối lượt;
  nếu vẫn đỏ thì là nợ của luồng sở hữu file đó, parent gộp xử lý.

## 4. Kiểm chứng headed (số thật, lượt chạy duy nhất, 2026-11-08 ~22:0x +07, EXIT=0)

| Case | Kết quả |
|---|---|
| H0 setup vi + mẫu tự load | PASS — 3 clip, media bin 2 item đều có file, duration 8s |
| H1 `.render-note` vắng + lịch sử rỗng trước render | PASS — note vắng; section "Lịch sử xuất" count=0 ("Chưa có lần xuất nào.") |
| H2 bấm Xuất MP4 → render thật | PASS — job `ec5e79c8d3588fc8` status=running progress=0 |
| **H3 panel ĐANG MỞ + SIGKILL bridge → restart → nhánh `interrupted`** | **PASS — panel tự chuyển lỗi KHÔNG cần mở lại: note vi "Phục hồi sau khi server restart — render lại từ đầu." + nút "Render lại từ đầu" + banner lỗi + progress biến mất; lịch sử có dòng job `ec5e79c8d3588fc8` status=interrupted** |
| **H4 bấm retry bằng chuột thật → job chạy lại → DONE** | **PASS — status=running, progress 0 → 0,88 (tăng tiếp sau retry), rồi DONE** |
| **H5 đóng/mở panel → lịch sử job done → "Xem kết quả"** | **PASS — mở lại thấy dòng lịch sử job `ec5e79c8d3588fc8` status=Xong; bấm "Xem kết quả" → banner done + nút "⬇ Tải xuống MP4" hiện (không idle)** |
| **H6 đóng panel giữa lúc upload → mở lại resume upload** | **PASS — throttle CDP theo tổng byte media thật; đóng panel giữa lúc upload → mở lại thấy uploading + ghi chú "Đang tải file lên máy chủ…"; panel nối job mới `078b7abfd8effb97` (khác job H2); bridge chỉ có 1 job tạo sau phiên upload (không nhân đôi); job chạy tiếp rồi huỷ được bằng nút "Huỷ"** |
| **H7 xoá mục lịch sử** | **PASS — bấm "Xoá" trên dòng job `078b7abfd8effb97` (cancelled) → count 2 → 1, localStorage không còn id đó** |
| H8 0 lỗi trang | PASS — không window.onerror / unhandledrejection cả phiên |

Ảnh chụp (hidden_files/round67-u7/headed/): `u7-interrupted.png`
(panel đang mở tự chuyển lỗi sau restart), `u7-history-done.png`
(banner done sau khi bấm "Xem kết quả"), `u7-upload-resumed.png`
(panel nối lại sau khi đóng giữa lúc upload). Log bridge/vite/chrome:
`u7-bridge-1.log`, `u7-bridge-2.log`, `u7-vite.log`, `u7-chrome.log`;
kết quả JSON: `u7-results.json` (9/9 pass).

Ghi nhận: lượt headed này xanh ngay lần đầu (không cần chạy lại như
T8 — không gặp CDP timeout dù VM đang chạy nhiều luồng round-67 song
song, load trung bình ~15 lúc chạy). Job render 1080p mẫu 8s xong
nhanh hơn dự kiến (retry 0 → 0,88 rồi DONE trong cùng lượt), nên H3
kill kịp lúc job còn running mà không cần chờ lâu.

## 5. Nợ mở (mới + còn lại)

1. **Desktop Electron: đích `.mp4` không bền qua reopen** (nợ cũ T8
   §5.2, chưa làm): resume/history chỉ nối theo dõi; `exportDest`
   không persist theo jobId nên tải MP4 sau khi mở lại từ lịch sử
   trong Electron rớt về anchor download thay vì ghi thẳng ra đích đã
   chọn. Cần persist đích theo jobId ở đợt riêng.
2. **Job `done` mà bridge đã dọn thư mục output:** "Xem kết quả"
   GET job trả 404 → xoá khỏi lịch sử + báo rõ (đã làm); nhưng job
   done còn trên bridge mà file output đã mất (409 JOB_NOT_DONE) thì
   nút tải MP4 vẫn mở anchor download và trình duyệt nhận JSON lỗi —
   chưa kiểm tra trước khi tải. Cần đợt riêng: kiểm tra download được
   trước khi hiện nút (HEAD/GET job), hoặc bridge trả lỗi đẹp hơn.
3. **Upload tab đóng hẳn:** đóng cả tab giữa lúc upload thì fetch bị
   huỷ theo tab — session stale sau 10 phút rồi về idle, job không bao
   giờ xuất hiện. Đây là giới hạn trình duyệt (không có service
   worker/background upload), ghi nhận trung thực, không workaround
   trong luồng này.
4. **Lịch sử chỉ lấy 10 job mới nhất từ bridge lúc mount**
   (`?limit=10`): job cũ hơn mà local chưa có thì không hợp nhất được
   (local chỉ có tối đa 20 mục nên thực tế đủ cho các lần xuất gần
   đây; job rất cũ đã bị bridge dọn thì cũng không mở được nữa).
5. **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền
   workflows:write) — nợ cũ, không đổi.
6. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/
   hơn CapCut thật.
