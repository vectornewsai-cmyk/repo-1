# Phase 9 — Đợt 62: đóng nợ §5 LIMITS đợt 61 (LIMITS tổng hợp)

> Ngày: 2026-11-08. Parent gộp 10 luồng R1–R10, KHÔNG push, KHÔNG release/tag.
> Trước đợt: 926 entry chờ push (Phase 10 + đợt 51–61; các đợt 1–50 đã push
> xong, HEAD e2cb35e1). Sau đợt: **1030 entry** (926 + 89 luồng + 15 closing).
> Chốt chặn `round-in-progress.md` KHÔNG tồn tại → lượt cron 06:35 chạy bình
> thường. (Lưu ý: lượt cron 03:35 cùng ngày không thực thi được — không có
> batch/log mới, không blocker, không guard file; lượt 06:35 này là lượt chạy
> lại, xem MEMORY.md.)

## 0. Chủ đề

Đóng toàn bộ nợ mở §5 của `docs/PHASE9_ROUND61_LIMITS.md` (10 luồng, mỗi
luồng một cụm nợ): FPS pill đè modal, cache `.trf` + chi phí denoise,
thang blur preview, keyframe lớn fail-open, giao thức mã lỗi bridge→web,
pause-seek stall + decoder sticky, sổ tham chiếu liên project, MCP
transition 81 type + parity sharpen/noise, runner test createRequire,
đo headed các gap còn lại.

## 1. Kết quả từng luồng (số thật, có nguồn là LIMITS từng luồng)

- **R1 — FPS pill đè footer modal mobile (nợ 61 §5.1):** nâng
  `.modal-backdrop` z-index 100 → **400** (toasts 500, tour 450, FPS 300 —
  giữ thứ tự cũ). Headed 8/8 sau sửa (trước sửa 4/8: pill đè nút chính
  1996,8 px², panel FPS đè trọn nút 6776 px², click thật mở panel thay vì
  bấm nút). Test tĩnh mới 6/6; hồi quy Q3 23/23, Q10 15/15, P2 26/26;
  tsc 0; vite build pass. Batch 4 entry.
  LIMITS: `docs/PHASE9_ROUND62_R1_FPS_MODAL_LIMITS.md`.
- **R2 — cache `.trf` + tách denoise + chặn SpeedPanel (nợ 61 §5.2):**
  cache `server/render/src/trfCache.js` (key sha256 src/size/mtime/trim/
  tham số + ffmpeg version; 128 entry / 64 MiB, LRU). Resolve COLD median
  **9,10 s → WARM ~0 s** (tiết kiệm 9,10 s/lần render lại); denoise 0.5
  ~**1 s (~2–5% full render)**; chặn speed curve ở SpeedPanel khi clip có
  stabilize (headed 6/6). Harness 35/35; unit speed-block 5/5 vi + 5/5 en;
  tsc 0 ở file R2; vite build pass. Batch 9 entry + fragment 2 key.
  LIMITS: `docs/PHASE9_ROUND62_R2_TRF_CACHE_LIMITS.md`.
- **R3 — thang blur preview + motion blur sau pause (nợ 61 §5.3):**
  denoise preview chuyển từ blur thuần sang blend
  `(1-a)·gốc + a·blur(3,0px)` (downscale-upscale đã thử và loại bằng số:
  f=0,95 đã −37%, đường cong dẹt rồi nhảy bậc). Khớp hqdn3d ở s=0,5
  (−48,4% vs −47%), s=0,8 (−73,6% vs −74%), s=1,0 (−83,7% vs −83%);
  sai đầu thấp còn **+9,9** (cũ +41); hết vùng chết s<~0,27; step-edge
  0 px ở a≤0,5. Motion blur sau pause về **0** (trước 1,39–2,77) nhờ gate
  `drawTransport.playing`. Stabilize+speedKeyframes: **quyết chặn ở
  preview** (đồng bộ 3 lớp; mở ở render đòi vidstabdetect từng đoạn ramp).
  Unit mới 10/10; Q1 16/16 vi+en; headed Q1 7/7, combo 9/9. **FPS preview
  lần này KHÔNG kết luận được** (baseline drift 39–49 fps do 8–10 luồng
  đợt 62 chạy song song; denoise 0,30×/0,53×, combo 0,55×/0,70×) — cần đo
  lại lúc VM yên. Batch 11 entry.
  LIMITS: `docs/PHASE9_ROUND62_R3_BLUR_REWORK_LIMITS.md`.
- **R4 — keyframe lớn fail-open → worker nền (nợ 61 §5.7):** probe
  `VideoDecoder` thật trong DedicatedWorker; chỉ sample mà timeout
  main-thread đã chạm trần 2500 ms (≳7,7 MiB) mới đi worker. Keyframe
  **42,5 MB trước đây fail-open nay decode-ok sau 10,7 s** (trần 30 s);
  abort 500 ms → fail-open đúng 501,4 ms, worker terminate ngay; phí
  spawn ~109 ms lúc yên. Hồi quy GOP 35/35 (T3 10/10, O6 18/18, P6
  16/16, Q5 15/15, R7 6/6, R4 19/19); tsc desktop 0; vite build pass
  (worker chunk 1,50 kB). Batch 6 entry.
  LIMITS: `docs/PHASE9_ROUND62_R4_KEYFRAME_WORKER_LIMITS.md`.
- **R5 — giao thức mã lỗi bridge→web (nợ 61 §5.6):** `{ error,
  errorCode, errorParams? }` chạy thật end-to-end; server giữ chuỗi VI cũ
  cho client cũ; web dịch mã qua dict `bridgeErrors.*`. Kiểm kê lại bằng
  tokenizer: index.js 139 literal, jobQueue.js 26 (số "~109 + ~24" trong
  brief là ước lượng cũ). Nối **91 mã** (rate limit/upload, job, render,
  validator 6 module, 10 route tác vụ, proxy/LUT). Web 9/9; bridge unit
  95/95; bridge e2e HTTP 138/138; error-detail-structured 150/150;
  error-detail-ui 52/52; CLI 21/21; tsc web/desktop/mcp/cli 0; vite build
  pass. Batch 26 entry + fragment 91 key.
  LIMITS: `docs/PHASE9_ROUND62_R5_BRIDGE_ERROR_PROTOCOL_LIMITS.md`.
- **R6 — pause-seek stall + decoder sticky + trùng clipId (nợ 61 §5.8):**
  seek thất bại ở pause nay ghi ngay key instance vào `tickSkippedClipIds`
  (badge ẩn 5/5 mẫu cuối); element `error !== null` bị drop ngay sau seek
  thất bại (scrub phục hồi sau **1,6 ms** thay vì ~13 s chờ cạn cap);
  attribution theo instance `scopedClipId` (`"nA/leaf-1"`). Unit mới
  17/17; hồi quy R8 20/20, Q6 15/15, O3 13/13, N4 14/14; headed PASS.
  Batch 9 entry.
  LIMITS: `docs/PHASE9_ROUND62_R6_PAUSE_STALL_LIMITS.md`.
- **R7 — sổ tham chiếu liên project + click-test Dọn kho (nợ 61 §5.9):**
  store `projectRefs` (DB v1→v2, khóa theo tên project); chặn xóa bytes
  project khác còn dùng (fail-closed khi đọc sổ lỗi); panel liệt kê
  project + nút "Quên"; sync refCount dưới Web Locks + BroadcastChannel.
  Bắt 2 bug thật (lock chỉ bao pha ghi; effect mount ghi bản ghi rỗng).
  Unit mới 28/28; headed 9/9 (en + 390 px, chọn-tất-cả + xóa thật bằng
  chuột); hồi quy idbCleanup 16/16, assetStore 27/27. Batch 10 entry +
  fragment 9 key.
  LIMITS: `docs/PHASE9_ROUND62_R7_IDB_XPROJECT_LIMITS.md`.
- **R8 — MCP apply_transition 81 type + parity sharpen/noise (nợ 61
  §5.10):** gốc rễ là zod schema khai cứng 13 type → đổi thành
  `z.enum(TRANSITION_TYPES)`; apply **82/82** qua tool thật (81 type +
  `"none"`), 8/8 type lạ bị từ chối có mã; MCP test 19/19; roundtrip
  130/130. Parity headed: **sharpen XẤP XỈ** (công thức đúng ở full-res,
  lệch còn lại do resampling viewport); **noise LỆCH-THỐNG-KÊ** trong
  pipeline yuv420p thật (render theo plane YUV, preview theo RGB) —
  đính chính kết luận "KHỚP" cũ của parity test Node (chỉ đúng trong
  RGB24). Batch 6 entry.
  LIMITS: `docs/PHASE9_ROUND62_R8_MCP_TRANSITION_LIMITS.md`.
- **R9 — runner test createRequire (nợ 61 §5.11):** gốc rễ: esbuild
  `--format=cjs` biến `import.meta` thành `{}` nên
  `createRequire(undefined)` ném giữa chừng (14/14 check rồi exit 1 —
  đợt 61 ghi "crash lúc thoát" là chưa chính xác). Sửa theo mẫu O7
  (resolve `validate.js` từ `process.cwd()` + require tuyệt đối) + runner
  chuẩn mới `scripts/run-node-test.mjs` (tự chọn mode theo marker file).
  speedcurveTrim **18/18** (3 cách ×3 lần + runner ×2 + esm 18/18);
  webglLut 7/7; importProgress41W3 4/4 (cùng họ lỗi, sửa kèm). tsc desktop
  0; vite build pass. Batch 5 entry.
  LIMITS: `docs/PHASE9_ROUND62_R9_TEST_RUNNER_LIMITS.md`.
- **R10 — đo headed các gap còn lại (nợ 61 §5.4 + §5.5):** timeout
  `recordPackMedia` thật **20495 ms** (kỳ vọng 20000 ms), modal hiện
  exact chuỗi vi `pack.recordTimeout`; CaptionModal running en ở 1280 và
  mobile; `.tbtn-label` ẩn/hiện đúng biên 1360/1361; nút proxy bấm thật
  tạo proxy 720p sau 2509 ms; speed/sticker warn exact; `warnTooShort`
  chứng minh là **nhánh chết qua UI** (slider kẹp nên newDur không bao giờ
  < 0,2 s). Harness 15/16 (1 FAIL oan do luật không upscale, đo lại 4/4);
  0 window error; vite build pass. Không sửa code sản phẩm. Batch 3 entry.
  LIMITS: `docs/PHASE9_ROUND62_R10_HEADED_GAPS_LIMITS.md`.

## 2. Việc parent gộp

- **Đối chiếu đĩa:** 10 batch = **89 entry, 0 thiếu, 0 binary/dist**,
  NUL cuối đúng. File chung: `apps/web/tsconfig.json` (R4 + R7 — cả 2
  exclude đều có trên đĩa: `gopTrialDecode62R4.test.ts`,
  `projectAssetRefs62R7.test.ts`); `apps/web/src/preview.tsx` (R3 + R6 —
  cả marker `enhancePreviewSource`/`ghostWeights`/`drawTransport.playing`
  lẫn `previewClipKey62R6`/`decoderErrorRecovered` đều có);
  `styles.css` chỉ R1 (backdrop 400 / toasts 500 / tour 450).
- **Gộp fragment i18n:** R2 2 + R5 91 + R7 9 = **102 key** → dict
  **2044 → 2146 key lá** mỗi bên (vi==en, cùng tập key, placeholder khớp,
  vi==en giống nhau vẫn 50). Không collision.
- **Cập nhật test khóa số key:** 10 file assert 2044 → 2146 (ProjectMenu
  L1, reverseToggle/Badge/Compat/PlaybackI18n, N4, saveToast31,
  structuredNotes32, P7, Q4-orphans) + ghi chú lịch sử đợt 62.
- **Đảo assertion pre-merge → post-merge:** test R5
  (`bridgeErrors62R5.test.ts` — 91 key nay assert CÓ trong dict đúng từng
  chữ) và test R2 (`speedCurveBlock62R2.test.ts` — t()/speedT trả chuỗi
  dict theo locale; chạy lại 5/5 vi + 5/5 en).
- **Sửa 2 fail do gộp (không phải lỗi sản phẩm):** P7 7/8 và Q4-orphans
  15/16 đỏ vì 91 key `bridgeErrors.*` truy cập động qua
  `` `bridgeErrors.${code}` `` (`lib/bridgeErrors.ts:168`) nên scan chuỗi
  tĩnh không thấy — đã thêm `"bridgeErrors."` vào `DYNAMIC_PREFIXES` ở cả
  2 test (cùng mẫu `transition.opt.`/`errorDetail.summary.` có sẵn). Sau
  sửa: P7 8/8, Q4 16/16.
- **Kiểm chứng gộp của parent (chạy lại độc lập):** tsc web **0**, tsc
  desktop **0**, vite build pass (6,79 s). P7 8/8, Q4-orphans 16/16, M3
  13/13, L2 pass, saveToast31 15/15, structuredNotes32 12/12,
  bridgeErrors62R5 9/9, R2 speed-block 5/5 vi + 5/5 en, R1 fpsModal 6/6,
  R6 pauseStall 17/17, R7 projectAssetRefs 28/28, R4 gopTrialDecode62R4
  19/19, R3 enhancePreview62R3 + 61R3 + Q1 xanh, R8 MCP 19/19. KHÔNG chạy
  lại ở bước gộp: mọi phép đo headed/FPS/render của các luồng (tiền lệ
  đợt 60 §2, đợt 61).
- **Đính chính chéo:** nợ "pill FPS đè footer modal" trong báo cáo R10
  (§5, mục 5) thực ra **R1 đã đóng trong cùng đợt 62** — không còn mở.
  R10 đo trước khi R1 sửa (chạy song song), không phải sót.

## 3. Stage (KHÔNG push)

10 file đợt 62 (89 entry) + `phase9-round62-closing.txt` (15 entry: dict
đã gộp vi.json/en.json; 12 file test parent đã sửa; LIMITS tổng hợp này).

Tổng chờ push: **1030 entry / 551 file duy nhất / 116 file paths**
(Phase 10 + đợt 51–62; 926 trước đợt 62 + 89 luồng + 15 closing).
Các đợt 1–50 đã push xong (HEAD e2cb35e1).

## 4. Nợ mở (cho đợt 63)

1. **R1:** chưa đo headed từng modal khác ở 390 px (cùng class backdrop,
   rủi ro thấp); chưa đo toast/tour cùng lúc modal mở (chỉ test tĩnh
   z-index); chưa click thật nút chính khi panel FPS đang mở.
2. **R2:** tách nốt ~5,6–6,4 s còn lại của full render; ghosting denoise
   0,8/1,0 trên footage thật pan nhanh; metric jitter bằng ước lượng
   chuyển động thay cho MAD.
3. **R3:** FPS blend cần đo lại lúc VM yên; GPU thật chưa đo; blend vẫn
   overstate s=0,3 (+9,9) và trên nhiễu nặng flat40 (−84,7% vs hqdn3d
   −26,7% ở s=1,0); step-edge vẫn 4 px ở a≥0,8; mở stabilize+ramp ở
   render (vidstabdetect từng đoạn) là việc riêng.
4. **R4:** trần worker 30 s có thể không đủ cho keyframe 42–64 MiB lúc tải
   nặng (decode 26–35 s); cân nhắc tăng tỉ lệ 1,0 → 1,2 ms/KiB; chưa đo
   Safari/Firefox; fallback khi không có VideoDecoder chưa đo thật;
   T3-null 4,9 s của R7 vẫn chưa rõ nguyên nhân gốc.
5. **R5:** `preload.ts` 1 literal (cần plumbing lang renderer→preload);
   `render/validate.js` 159 literal; `mcp-server/validate.ts` 89 +
   lỗi CLI (không có hạ tầng i18n); 10 chuỗi fallback taskErrorPayload /
   SSE phase; quirk rate limiter: global + per-route dùng chung 1 Map
   bucket theo IP (1 request qua 2 middleware đếm 2 lần).
6. **R6:** lỗi decoder trong lúc phát cần đợt riêng (syncMedia); giả định
   fallback proxy reset `error` về null chưa đo headed; hold cache vẫn
   key theo leaf id + src.
7. **R7:** sổ chỉ biết project đã mở/lưu trên trình duyệt này; 2 file
   .vcut trùng tên project chung một khóa sổ (ghi sau thắng — lỗ hổng thật
   theo hướng không an toàn, cần projectId ổn định trong envelope);
   lock không chặn stale giữa các lượt sync; chưa đo tranh chấp lock thật
   giữa 2 tab trình duyệt.
8. **R8:** noise preview↔render lệch thống kê — cần noise không gian YUV
   ở đường canvas + cập nhật tiêu chí test Node theo pipeline thật;
   sharpen ở viewport downscale mạnh vẫn XẤP XỈ (thử
   `imageSmoothingQuality="high"`); `FEATURE_STATUS.md` hàng Transitions
   vẫn ghi "chưa kiểm tra lại" (nay đã kiểm xong, cần luồng docs cập
   nhật); uisfx 936 file vẫn chưa có trên đĩa (fetch-on-demand).
9. **R9:** webglLut vẫn chỉ chạy bằng bundle cjs (quyết định O7, đã mã
   hóa trong runner); warning `empty-import-meta` vô hại từ
   `bridgeUrl.ts:17` vẫn hiện khi bundle cjs.
10. **R10:** Escape lúc CaptionModal running ở bước translate chưa đo;
    `warnTooShort` nhánh chết qua UI — cần quyết parent: xóa nhánh + key
    hay giữ làm phòng thủ; phase text caption chưa localize theo locale
    (bridge trả chuỗi vi); lỗi timeout pack nằm dưới fold modal (user
    phải cuộn mới thấy).
11. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
    nguyên); N5 bản dịch EN template chưa qua người bản ngữ;
    `ci-security.yml` 403 chưa lên GitHub (repo vẫn không có CI chạy thật).
