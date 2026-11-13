# Phase 9 đợt 68 — luồng V8: Electron exportDest persist theo jobId + kiểm tra download trước khi hiện nút tải

**Ngày:** 09/11/2026 (luồng chạy 00:45 → ~19:30 +07). **Trạng thái:** xong, kiểm chứng xanh.
**Đóng nợ:** đợt 67 U7 / `docs/PHASE9_ROUND67_U7_JOB_HISTORY_LIMITS.md` §5 mục 1–2.
**KHÔNG push trong luồng này** — batch chỉ stage tại
`~/workspace/repo-1-push/paths-loop/phase9-round68-v8-export-dest.txt`, chờ user nhắn
"push đi" từ main chat. Không release/tag (release gate vẫn giữ).

## 1. Vấn đề

1. **Desktop Electron: đích `.mp4` không bền qua reopen.** `exportDest` chỉ là state
   của `ExportPanel`; đóng panel/app là mất. Mở lại job done từ lịch sử trong Electron
   thì "Tải MP4" rớt về anchor download thay vì ghi thẳng ra đích đã chọn.
2. **Job `done` mà file output đã mất.** Nút tải MP4 vẫn mở anchor download và trình
   duyệt nhận JSON lỗi 409 `JOB_NOT_DONE`; chưa kiểm tra trước khi tải.

## 2. Thiết kế

### 2.1 Persist đích export theo jobId (mục 1)

Không phát minh store mới — thêm field `exportDest: string | null` vào
`JobHistoryEntry` trong kho lịch sử job đã có (`apps/web/src/lib/jobHistory67U7.ts`,
key localStorage `vcut.jobHistory.v1`, tối đa 20 mục). Trong Electron, localStorage
của origin `app://vcut` bền qua restart app (như `vcut-lang` của G5).

- `historyEntryFromJob(job, projectName, presetLabel, exportDest?)` — tham số thứ 4,
  rỗng → null.
- `startRender` ghi đích cùng jobId lúc POST xong, dùng biến cục bộ `pickedDest`
  (không tin state chưa flush).
- `upsertHistoryEntry` **GIỮ đích cũ** khi mục mới từ bridge không mang đích, và
  chuẩn hoá mục mới (`exportDest: entry.exportDest ?? null`) để round-trip
  `recordJobHistory` → `loadJobHistory` deepEqual được.
- `openHistoryEntry` khôi phục đích ngay sau `recordHistoryFromJob(job)` (mọi nhánh);
  mount resume khôi phục ở cả 3 đường nối lại (candidate + chờ upload done + chờ
  upload running/error) qua helper `restoreExportDest(id)`.
- Web thường: `exportDest` null → hành vi anchor download không đổi.
- `downloadMp4` giữ nguyên 2 nhánh: native `saveExportFile(jobId, exportDest)` khi
  có đích (Electron), anchor web khi không.

### 2.2 Kiểm tra download được trước khi hiện nút tải (mục 2)

Bridge thêm handler HEAD tường minh (mới, tối thiểu):

```
HEAD /api/render/:id/download   (server/bridge/src/index.js, operationId: checkRenderDownload)
  404 JOB_NOT_FOUND   — không có job
  409 JOB_NOT_DONE    — status ≠ done HOẶC !fs.existsSync(job.outPath)
  200 + Content-Type: video/mp4 + Content-Length  — còn file
```

Handler HEAD riêng là bắt buộc: Express tự map HEAD sang handler GET sẽ stream MP4
vô ích. `openapi.yaml` thêm khối `head:` cho `/api/render/{id}/download` (cùng mã lỗi
với GET). HEAD không trả body (Express strip body theo chuẩn HTTP) nên test chỉ
assert status cho HEAD.

Panel HEAD khi job về done (effect theo `[renderStatus, jobId]`), qua lib mới
`apps/web/src/lib/exportDest68V8.ts` (`checkDownloadAvailable` → `"available" |
"missing" | "unknown"`, không bao giờ throw; jobId được `encodeURIComponent`):

- `200` → `"available"`: hiện nút tải như cũ.
- `404/409` → `"missing"`: **KHÔNG** hiện nút tải (cả nút chia sẻ cũng ẩn vì cần
  file), báo chuỗi `exportDest.missing`, cho nút `exportDest.deleteFromHistory`
  (xoá khỏi kho lịch sử đã persist qua `removeJobHistory(jobId)` rồi về idle).
- Lỗi mạng khác / thiếu tham số → `"unknown"`: UI **giữ hành vi cũ (hiện nút)** để
  lỗi thoáng qua không khoá hẳn nút tải.
- Banner done mang `data-download-state` (`checking|missing|available|unknown`);
  đang kiểm tra thì hiện chuỗi `exportDest.checking`, chưa hiện nút.
- Electron + có đích → hiện `exportDest.savedTo` với `{path}` thay bằng đích, kèm
  `data-export-dest={exportDest}`.

### 2.3 Chuỗi i18n mới

Fragment `apps/web/src/i18n/fragments/round68-v8.json`, namespace `exportDest.*`,
4 key (`checking`, `missing`, `deleteFromHistory`, `savedTo` — `{path}` ở cả vi+en).
Đọc trực tiếp như mẫu U7/T8; **KHÔNG** sửa `vi.json`/`en.json` — parent gộp sau.
Dict hiện tại **vi = en = 2369 key lá** (đo 09/11, chưa gồm 4 key V8); sau khi parent
gộp fragment → **2373 key**. Các test khóa số key dict không tự sửa (xem §5).

## 3. Kiểm chứng (số thật, VM 2 vCPU/8 GB)

| Kiểm tra | Kết quả |
|---|---|
| Bridge HEAD test `server/bridge/test/test-download-head-68v8.cjs` | **19/19 pass** (19:16, 11,8s): HEAD job lạ 404 + body rỗng, jobId sai 400, POST render thật 201, HEAD lúc chưa xong 409, job done → HEAD 200 + Content-Type video/mp4 + Content-Length khớp outputSize + không body, GET 200 hồi quy, xoá output.mp4 → HEAD 409 + GET 409 |
| Unit V8 `exportDest68V8.test.ts` | **20/20 pass** |
| Unit U7 `jobHistory67U7.test.ts` (hồi quy) | **30/31** — 1 đỏ có từ trước, xem §5 |
| T8 `resumeRenderJob66T8.test.ts` | **26/26 pass** |
| S10 `jobNote65S10.test.ts` | **13/13 pass** |
| R8 `jobNote64R8.test.ts` | **19/19 pass** |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** |
| `node apps/web/scripts/r6-i18n-check.cjs` | **PASS** |
| `tsc` apps/web | 0 lỗi ở file luồng này; 1 lỗi ở file luồng khác, xem §5 |
| `vite build --configLoader runner` | **✓ built in 5.85s** (chunk >500kB warning có từ trước) |
| Audit persist `test-bridge-persist-audit.cjs` | **83 pass, 1 fail** — fail là file luồng khác, xem §5 |
| Headed Chrome `clicktest-68v8-export-dest-headed.mjs` | **9/9 pass** (run 4, 19:23–19:24, loadavg lúc bắt đầu 2.32): H0 mẫu 3 clip/2 media, H1 render thật 1080p 8s → job done outputSize 2030616 + lịch sử persist exportDest đúng đích, H2 HEAD 200 Content-Length khớp, H3 reload → "Xem kết quả" → stub `saveExportFile` gọi đúng {jobId, destPath} 2030616 byte + **0 anchor download**, H4 xoá output → HEAD 409 → reopen → banner missing, không nút tải, xoá khỏi lịch sử → count 0, H5 0 lỗi trang |
| Headed Electron `clicktest-68v8-export-dest-electron.mjs` | **7/7 pass** (run 2, 19:26–19:27, loadavg lúc bắt đầu 0.26): E0 app Electron thật, `window.vcutDesktop` frozen=true, bridge app :8787; E1 render thật qua bridge app (job done 2s, outputSize 8192) → seed lịch sử → reload → "Xem kết quả" → bấm tải → **file thật 8192 byte ghi ra đích trên đĩa** (khớp outputSize) + 0 anchor; E2 xoá output → HEAD 409 → reopen → banner missing + xoá khỏi lịch sử → count 0; E3 0 lỗi trang |

Ảnh chụp headed: `hidden_files/round68-v8/headed/v8-{done,reopen-download,output-missing}.png`
và `hidden_files/round68-v8/electron/v8e-{reopen-download,output-missing}.png`.
Log chạy: `hidden_files/round68-v8/headed/v8-headed-run4.log`,
`hidden_files/round68-v8/electron/v8e-run2.log`.

## 4. Giới hạn (trung thực)

1. **Upload-tab-đóng là giới hạn trình duyệt, không sửa trong luồng này.**
   Đóng tab giữa lúc upload thì upload dừng (không service worker/background
   upload); U7 chỉ resume được khi panel đóng mà tab còn mở (session
   `vcut.uploadSession.v1`).
2. **`unknown` → hiện nút như cũ.** Khi HEAD lỗi mạng/tham số thiếu, panel không
   khoá nút tải (tránh false positive); anchor lúc đó có thể vẫn nhận JSON lỗi
   nếu file thực sự đã mất đúng lúc mạng chập chờn. Đây là lựa chọn cố ý
   (fail-open), ghi rõ để parent/user biết.
3. **Electron test seed lịch sử thay vì bấm dialog GTK thật.** `window.vcutDesktop`
   bị `contextBridge` freeze (E0 đo được `frozen=true`) nên không override được
   `saveVideoDialog` qua CDP; dialog GTK thật không lái được trong harness này.
   Vì vậy: đường "chọn đích bằng dialog" được đo ở headed Chrome (stub dialog trả
   đích cố định → H1/H3 xanh); đường "khôi phục đích từ lịch sử + ghi file thật"
   được đo ở Electron bằng seed entry đúng shape `historyEntryFromJob` trả về
   (E1 ghi file thật 8192 byte ra đĩa). Phần duy nhất chưa đo end-to-end trên
   Electron thật là cú bấm dialog GTK chọn đích — dialog đó đã có harness riêng
   (`apps/desktop/scripts/click-test-gtk-save-53j1.mjs`) và không thuộc nợ này.
4. **Đích persist là metadata text trong localStorage, không phải setting hệ thống.**
   Xoá dữ liệu app / đổi profile Electron thì đích mất theo (đúng semantics của
   lịch sử job U7). Không đồng bộ đích giữa máy khác nhau (local-first).
5. **HEAD check chỉ chạy khi job về done trong panel.** Job done từ phiên trước
   nhưng user không mở "Xem kết quả" thì không HEAD (không tốn request); lúc mở
   mới kiểm tra.
6. **Tình trạng VM (xem §6 chi tiết):** EPERM theo đợt, `/tmp` chỉ còn ~97M,
   quota general 120/phút của bridge, TMPDIR phải ngắn (socket path). Các test
   đã được làm kiên cố với những điều này; các lần chạy fail giữa chừng đều do VM,
   không do code sản phẩm (ghi rõ từng lần trong log luồng).

## 5. Nợ / việc còn lại (không thuộc luồng này — đừng tự sửa)

- **U7 test còn 1 đỏ (có từ trước):** assert "namespace `jobHistory.*` CHƯA có
  trong dict" lỗi thời vì parent đã gộp fragment round67-u7 vào dict (2369 key
  đã chứa `jobHistory`). Luồng này không đụng `vi.json`/`en.json`.
- **Audit persist 1 fail (file luồng khác):**
  `server/bridge/test/test-stab-single-thread-68v2.cjs` (luồng V2 đợt 68) spawn
  bridge mà chưa đăng ký inventory. Không tự sửa file luồng khác.
- **tsc 1 lỗi (file luồng khác):** `src/lib/stabSingleThread68V2.test.ts(63,26):
  Property 'cwd' does not exist...` (luồng V2). File luồng V8 không lỗi tsc.
- **Dict 2369 → 2373:** parent gộp fragment `round68-v8.json` (4 key) rồi cập nhật
  các test khóa số key dict.
- **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền workflows:write);
  repo vẫn không có CI chạy thật (nợ cũ từ đợt 67, không thuộc luồng này).

## 6. Tình trạng VM ngày 09/11 (bằng chứng đo được — quan trọng cho các luồng sau)

1. **Đợt EPERM ghi file (từ ~01:05 09/11, vẫn tiếp diễn tới 19:27):** ghi file thất
   bại `EPERM: operation not permitted, write` theo cửa sổ vài phút, xen kẽ lúc
   ghi được; có lúc nhấp nháy theo giây. Dấu hiệu đặc trưng: file được tạo ra
   nhưng **0 byte** (open thành công, write bị EPERM). Ảnh hưởng: bridge POST
   render 500, ffmpeg `Could not write header`, rate-limit persist lỗi, esbuild
   `--outfile` fail, vite config-bundle fail, `copyFileSync` fail, `tee`/strace
   ghi file fail. **Đối sách đã dùng và hiệu quả:** probe ghi file thật
   `waitForWritableDir` **mỗi 1s** (không 10s — probe 10s dễ trượt cửa sổ),
   tối đa ~3 phút; POST render retry; render CTA retry; vite build
   `--configLoader runner` (tránh ghi file tạm `.vite-temp/*.mjs`); helper
   `hidden_files/round68-v8/run-unit.cjs` (esbuild ra stdout qua pipe, node ghi
   file + retry 60 lần — node ghi file có tỉ lệ thành công cao hơn esbuild/tee
   trong cùng cửa sổ; lưu ý: esbuild phải spawn binary ELF trực tiếp, không qua
   `node`; test chạy với `cwd` = gốc repo vì test resolve path tương đối từ đó).
   Bridge test đã skip phần render 3 lần (2 lần chờ 5 phút, 1 lần chờ 3 phút)
   trước khi pass 19/19 lúc cửa sổ mở (19:16).
2. **`/tmp` chỉ còn ~97M trống** (512M tmpfs, dùng 82%) — dưới ngưỡng 256M của
   bridge → POST render trả 507 `DISK_LOW`. Work dir của mọi test đã chuyển sang
   đĩa home (103G trống). **Nhưng TMPDIR cho Chrome/Electron PHẢI NGẮN:**
   Chromium đặt SingletonSocket dưới `$TMPDIR`, giới hạn đường dẫn socket ~108
   ký tự — TMPDIR sâu trong scratch (`hidden_files/...`) làm Chrome chết FATAL
   "Socket path too long", không lấy được page target CDP (headed run2 19:18).
   Cả 2 script headed dùng `/tmp/round68-v8/tmp` (ngắn) cho TMPDIR; dữ liệu thật
   (profile/user-data-dir) vẫn ở đĩa home.
3. **Bridge chết exit 1 khi stdio là fd file** (tái lập chắc chắn qua
   `/tmp/round68-v8/dbg-die3.cjs`): bridge `console.error` ghi ra fd file mà gặp
   EPERM → throw → uncaught → exit 1 trong ~5s sau POST 500. Với pipe stdio
   bridge sống sót qua 3 POST 500 liên tiếp + 30s. **Mọi script spawn bridge/
   headed mới PHẢI dùng pipe stdio + guard WriteStream (`on("error", () => {})`),
   không dùng fd file.** Script U7/T8 cũ dùng fd — điểm yếu có sẵn, không sửa
   trong luồng này.
4. **Quota general 120/phút của bridge** (`app.use("/api/", rateLimit(...))`):
   mọi GET /api/ đều tính quota. Poll `GET /api/render/:id` mỗi 500ms suốt
   render 60s+ đốt hết quota → `GET /api/render?limit=1` sau đó ăn 429
   (headed run3 19:20: job done thật nhưng `latestJob=null`). **Đối sách:** poll
   2s/lần; dùng đúng jobId đã biết thay vì list; `latestJob` retry 1 lần sau 3s
   khi 429. Rate-limit persist tách riêng theo process (`rate-limit-<pid>.json`).
5. **Bridge mồ côi khi kill Electron bằng SIGKILL** (nợ Phase 10, tái hiện ở
   Electron run1 19:24: bridge :8787 + tiến trình Electron con còn chạy sau khi
   script kết thúc). Script Electron đã sửa `killAll`: SIGTERM cho Electron trước
   (app tự tắt bridge khi quit) rồi mới SIGKILL sau 8s nếu còn sống; run2
   19:27 không còn mồ côi (kiểm chứng: :8787 dead, không còn tiến trình
   electron). Lưu ý: `pkill -f <pattern>` tự match chính shell chứa pattern —
   kill theo PID cụ thể thay vì pkill pattern rộng.
6. **`/tmp/round68-v8/run-unit.cjs` biến mất** giữa các lần chạy (tmpfs bị dọn) —
   helper đã chuyển sang đĩa home (`hidden_files/round68-v8/run-unit.cjs`).
   Đừng để file cần dùng lại trong `/tmp`.

## 7. File đổi/thêm (batch đã stage)

```
server/bridge/src/index.js                                  (HEAD handler)
server/bridge/openapi.yaml                                  (head: checkRenderDownload)
server/bridge/test/test-download-head-68v8.cjs              (mới, 19 assert)
server/bridge/test/test-bridge-persist-audit.cjs            (đăng ký inventory)
apps/web/src/lib/jobHistory67U7.ts                          (exportDest + upsert giữ đích)
apps/web/src/lib/exportDest68V8.ts                          (mới)
apps/web/src/lib/exportDest68V8.test.ts                     (mới, 20 case)
apps/web/src/i18n/fragments/round68-v8.json                 (mới, 4 key vi+en)
apps/web/src/ExportPanel.tsx                                (banner + restore + HEAD + xoá)
apps/web/scripts/clicktest-68v8-export-dest-headed.mjs      (mới, 9 case)
apps/web/scripts/clicktest-68v8-export-dest-electron.mjs    (mới, 7 case)
docs/PHASE9_ROUND68_V8_EXPORT_DEST_LIMITS.md                (mới, file này)
```

KHÔNG binary trong batch. Log luồng (không thuộc batch repo):
`workspace/goals/capcut-clone-video-editor/hidden_files/round68-v8.md`.
