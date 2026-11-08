# Phase 9 đợt 61 — TỔNG HỢP GỘP (LIMITS)

Ngày: 2026-11-08. Parent gộp đợt 61 (10 luồng R1–R10) + wiring + kiểm chứng
lại trên cây đã gộp. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

Chủ đề: đóng nợ đợt 60 (§5 LIMITS tổng hợp đợt 60) — M3 đỏ sẵn, chi phí
enhance render, hiệu chuẩn preview enhance, class CSS scoped-only,
CaptionModal + Escape headed, literal server/desktop, GOP timeout,
skippedReasons attribution, UI dọn kho IDB, docs + kho index.

## 0. Kết quả gộp dict — số thật

- Trước gộp: `vi.json` == `en.json` == **1972 key lá** (sau đợt 60).
- Đã gộp 4 fragment (script `/tmp/merge61.py`: cấm ghi đè, cấm key mới trùng
  key cũ — đã verify sau ghi): R2 3 key `enhance.presetSpeedBlocked/
  presetSpeedTitle/stabilizeSpeedTitle`, R5 1 key `pack.recordTimeout`,
  R6 50 key `gop.*`, R9 18 key `storageCleanup.*`.
- Sau gộp: `vi.json` == `en.json` == **2044 key lá** (1972 + 72; vi/en cùng
  tập key, placeholder khớp toàn bộ, không giá trị rỗng).
- Key vi==en (giá trị giống hệt hai bên): **48 → 50** — 2 key mới là mẫu
  định dạng kỹ thuật `gop.cache.belowThreshold` /
  `gop.cache.rangeOk` (`gop-below-threshold: {size} <= {threshold}`),
  hợp lệ theo đúng tiêu chí của test (tên riêng / nhãn emoji / mẫu định
  dạng). Đã cập nhật khóa 48 → 50 ở P7 + Q4 kèm ghi chú.
- Cập nhật test khóa số key: 10 file assert đã sửa `1972` → `2044` (giữ
  dòng lịch sử đợt 60, thêm dòng parent gộp đợt 61 +72 key); test R2 khối
  pre-merge đổi thành post-merge; test P7 khối R6 `!VI.has(k)` đổi thành
  assert có trong dict đúng giá trị fragment; test diagnostic R6 khối
  "50 key chưa vào dict" đổi thành post-merge tương tự. Không còn assert
  nào khóa 1972 trong `apps/web/src` (chỉ còn dòng lịch sử "1972 sau
  đợt 60").

## 1. Đối chiếu đĩa (10 batch luồng)

- Hợp 10 batch = **73 entry / 71 file duy nhất**, 0 file thiếu trên đĩa,
  0 binary/dist. File đếm trùng: `apps/web/tsconfig.json` ×3 (R4, R7, R9 —
  mỗi luồng thêm 1 dòng exclude khác nhau, kiểm tra: 161 entry, 0 trùng).
- File chung nguyên vẹn (kiểm bằng grep marker): `preview.tsx` chỉ R8 đụng
  (R3 không đụng preview.tsx theo LIMITS R3 §0); `store.ts` chỉ R9;
  `styles.css` chỉ parent gộp thêm rule `.modal.storage-cleanup`.
- Parent sửa thêm: dict đã gộp (vi.json, en.json); 17 file test parent đã
  sửa khi gộp (khóa số key 1972→2044, pre-merge→post-merge R2/P7/R6,
  SCOPED53→54); `styles.css` + `StorageCleanupPanel.tsx` (chuyển width
  720px từ inline style sang rule CSS — xem §4); LIMITS tổng hợp này —
  đều nằm trong batch closing.

## 2. Kiểm chứng lại trên cây đã gộp (số thật, parent chạy lại độc lập)

- `tsc` apps/web: **0 lỗi**; `tsc` apps/desktop: **0 lỗi**;
  `vite build` apps/web: **pass, 5,87 s** (cảnh báo chunk >500 kB có sẵn).
- Chạy lại bằng esbuild bundle + node (file có top-level await phải bundle
  `--format=esm`; file dùng react-dom/server phải bundle `--format=cjs` —
  quirk đã biết từ R1): **lượt 1: 28/33 suite xanh**, 5 fail đều do parent
  gộp (xem §2.1, đã sửa hết, chạy lại xanh); **lượt mở rộng: 78/82 suite
  xanh**, 4 fail đều là artifact runner (xem §2.2, đã xác minh riêng).
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS/render của
  các luồng (R2 render MP4, R3 FPS preview headed, R4/R5 headed,
  R7 decode headed, R8 stall headed, R9 headed) — đó là số đo của luồng,
  đã đối chiếu LIMITS + bằng chứng trên đĩa (cùng tiền lệ đợt 60 §2).

### 2.1 Năm fail lượt 1 — đều do parent gộp, đã sửa

1. M3 (`i18nAudit56M3`): runner dùng `--format=esm` nên react-dom/server
   gãy `Dynamic require of "stream"`. Chạy lại bằng `--format=cjs` như
   R1 đã ghi: **13/13 pass**.
2. R4 (`cssClasses61R4`): `.storage-cleanup` nay có rule
   `.modal.storage-cleanup` nên thành class scoped-only thứ 54 — test
   khóa baseline 53. Đã đổi SCOPED53 → SCOPED54 (kèm ghi chú parent
   gộp), chạy lại xanh. (Lỗi tham chiếu SCOPED53 sót ở §4 đã sửa cùng lúc.)
3. R6 diagnostic (`i18nDiagnostic61R6`): check "50 key chưa vào dict"
   fail đúng 1 check sau khi parent gộp (key nay đã có trong dict).
   Đã đổi thành post-merge (assert có trong dict đúng giá trị fragment),
   chạy lại **22/22**.
4. Q4 (`i18nOrphans60Q4`): khóa `same.length === 48` fail vì +2 key
   vi==en (xem §0). Đã đổi 48 → 50, chạy lại **16/16**.
5. P7 (`i18nAudit59P7`): cùng khóa 48 → 50. Đã đổi, chạy lại xanh.

### 2.2 Bốn fail lượt mở rộng — đều là artifact runner, không phải lỗi sản phẩm

1. M3 (`i18nAudit56M3`): như §2.1.1 — chạy cjs: **13/13**.
2. L2 (`i18nAudit55L2`): cùng lỗi react-dom/server ở ESM. Chạy cjs:
   **20/20**.
3. `splitPatch.store`: ESM bundle gãy `Dynamic require of "child_process"`
   (validate.js). Chạy cjs trong repo: **12 pass, 0 fail**.
4. `speedcurveTrim`: 14/14 check pass rồi crash lúc thoát vì
   `createRequire(import.meta.url)` — `import.meta.url` undefined trong
   bundle CJS (test dùng `createRequire` ở dòng 37). File test + mọi file
   nó import (`packages/video-spec/src/speedcurve.ts`,
   `server/render/src/validate.js`) đều KHÔNG nằm trong batch đợt 61 —
   không phải hồi quy đợt này. Ghi nhận là giới hạn runner (cùng họ với
   webglLut type-stripping đã biết).

## 3. Tóm tắt từng luồng (số đã kiểm chứng lại)

| Luồng | Việc | Test chạy lại |
|---|---|---|
| R1 | M3 xanh 13/13: test fragment assert ngược thời gian + helper so chuỗi mẫu thô `{n}` thay vì chuỗi đã nội suy; `enhance.renderOnly` giữ xóa có chủ đích. Chỉ sửa test, không sửa code/dict | 13/13 + M4 25/25, Q4 16/16, P7 8/8, M5 21, errorDetail 35/35 |
| R2 | Tách chi phí stabilize: detect 32,5% / transform thuần 4,3% (720p, median 3 lần); stabilize giảm inter-frame MAD 76,5%/80,0% nhưng dao động 38%/67,6% giữa lần chạy do `.trf` không xác định (quy tắc mới: đo ≥3 lần + báo spread); ghosting denoise: 0,3/0,5 an toàn, 0,7 ngưỡng, 0,8 (preset Mạnh) vệt mờ 2,88, 1,0 vệt rõ 5,93; UX stabilize+speedKeyframes: CHẶN Ở UI (disable preset Cân bằng/Mạnh + checkbox chống rung khi clip có speed curve) | unit 9/9 vi+en, headed 7/7, harness supplement 18/18 |
| R3 | FPS preview: chỉ blur denoise tốn FPS (59→35 fps, 0,60×; stabilize/deinterlace 1,00×; combo 0,62×, run-3 0,88× với code cũ); thang blur cũ là NO-OP (0,3/0,6px giảm std 0% — lượng tử hóa Chromium: vùng chết 0–0,75px, plateau từ 0,8px) → đổi `ENHANCE_PREVIEW_BLUR_MAX_PX` 1,2→3,0px (s=0,3 vẫn overstate +41 so với hqdn3d, ghi rõ); click-test enhance+mask+SR+motion blur cùng lúc 9/9; deinterlace: decoder không tự khử răng cưa (C/S 1,12 vs 0,69), render yadif làm việc thật | unit 7/7, Q1 16/16 vi+en (chạy lại), combo headed 9/9 |
| R4 | 53 class scoped-only kiểm chứng xong (188/190 covered + 2 ca biên); bắt 1 lỗi thật `.fx-toggle.on` chết (thêm rule, đo headed #cfcfe0→#fff); 5 rule Q2 đo tổng hợp nay đo thật headed 6/6 ở 1280×720 + 390×844; Q2 chạy lại EN 10/10 cả hai viewport | test mới 59/59, P4 33/33, Q2 59/59 (sau gộp §4) |
| R5 | CaptionModal: running headed (spinner + Huỷ đúng), Escape lúc running đóng modal (AbortController), 1280×720 4/4, mobile 3/3; Escape lúc dropdown select mở bị trình duyệt nuốt (đúng Q10); Escape lúc ttsBusy thật bị chặn; timeout `recordPackMedia` làm thật (`max(20s, seconds+15s)` → `RecordPackTimeoutError` → key `pack.recordTimeout`) | test mới 8/8, headed 16/16, Q3 23/23, Q10 15/15, P2 26/26 |
| R6 | Kiểm kê literal bằng tokenizer: 8 file P7 = 247 literal (P7 đếm 253), toàn production 3217 literal/127 file; nối desktop thật 36 key (i18n-desktop 59→95); nối diagnostic 50 key `gop.*` qua 6 file lib | diagnostic 22/22, kiểm kê 4/4, desktop 9/9, P7 8/8, trialDecode 155/155 |
| R7 | Decoder timeout hủy thật qua AbortSignal: probe 42,5 MB settle 182 ms sau abort (cũ ~43 s, ~236×); decode chậm hơn P6 là do tải VM (đo lại lúc yên khớp P6 trong ~4%); ngưỡng timeout 2500 ms ~15–16 MiB lúc yên, ~3–5 MiB lúc tải — không tăng trần, để nợ worker nền | test mới 6/6, GOP xanh (O6 17/18 flake thời gian đã biết) |
| R8 | `skippedReasons` attribution theo clip (`skippedReasonsByClip` + `visibleSkippedReasons`, contract O3/N4 mở rộng kiểu cộng thêm); clip thiếu media vào `tickSkippedClipIds`; stall decoder thật headed: stall → hold (badge hiện đúng) khi đã có frame, chỉ skip khi chưa từng có frame | test mới 20/20, O3 13/13, N4 14/14, P3 16/16, nestedPreview 46, Q6 15/15, headed PASS |
| R9 | UI "Dọn kho" trong MediaBin làm thật (liệt kê asset IDB + dung lượng, khóa mục đang dùng, xóa qua xác nhận); refCount AssetStore duy trì thật — `remove()` từ chối khi clip còn tham chiếu (đỏ-trước tái hiện bug cũ) | lib 16/16, store 4/4, headed 7/7, hồi quy Q7/rehydrate/assetStore xanh |
| R10 | Ma trận FEATURE_STATUS thêm 6 hàng (nested/adjustment/motion/karaoke VERIFIED; ducking + beat sync/downbeat IMPLEMENTED-PARTIAL kèm giới hạn); sounds index 1013→1043; sticker manifest 214→244 (khớp đĩa, sha256 khớp); i18n đính chính 1972 key | test_stickers3 PASS, test_beat/structure PASS |

## 4. Đính chính / lưu ý gộp

- R3 đính chính tiền đề Q1: thang blur denoise 0..1,2px là no-op ở strength
  mặc định (preset Nhẹ 0,3 / mặc định 0,5 không khử nhiễu gì trong preview)
  — thang mới 0..3,0px vẫn overstate ở đầu thấp (s=0,3 hiện −60% trong khi
  render chỉ −19%), ghi rõ trong LIMITS R3 §2.5.
- R2 đính chính phép tách chi phí: phép trừ transform−baseline ra số âm ở
  lượt 1 do tải VM dao động 0,6–22,7 — chỉ số đo trực tiếp từng pass được
  giữ; 1080p vẫn nhiễm xu hướng tải (tổng các phần 145,8% full).
- R5 đính chính: Escape lúc CaptionModal running ĐÓNG modal (khác
  PackModal) vì caption hủy an toàn bằng AbortController.
- R8 đảo quyết định Q6 §5.2: clip thiếu media (`!item`) nay ghi vào
  `tickSkippedClipIds` (kỳ vọng headed Q6 B1 bị thay thế có kiểm soát).
- R4: check 54 của test Q2 kẹt vì `.storage-cleanup` của R9 — parent gộp
  đã đóng hẳn: thêm rule `.modal.storage-cleanup { width: 720px }` vào
  `styles.css`, bỏ inline `style={{ width: 720 }}` khỏi panel (hành vi
  hiển thị giữ nguyên), cập nhật test R4 (§2 + SCOPED53→54). Q2 chạy lại
  **59/59** trên cây đã gộp.
- R6: ghi chú "M3 đỏ sẵn 7/13" trong báo cáo R6 đã lỗi thời — R1 sửa M3
  xanh 13/13 trong cùng đợt này.
- R7: outlier T3-null 4,9 s không lặp lại (đo lại 375–613 ms); quan sát mới:
  decode nhỏ đầu tiên sau trial-decode bị abort mất ~420–480 ms (teardown
  decoder, 1 lần).
- R10: `origin_url` của 30 sticker gốc trỏ về repo root (tự vẽ, không có
  URL fetch gốc).

## 5. Nợ mở (cho đợt 62)

1. **R5:** nút nổi FPS (PerfOverlay, z-index 300) đè lên footer modal
   bottom-sheet ở mobile, che đuôi nút chính (`.modal-backdrop` chỉ
   z-index 100) — bug thật, chưa sửa. Hướng: nâng z-index backdrop lên
   trên 300 hoặc ẩn pill FPS khi modal mở.
2. **R2:** cache `.trf` theo (src, trim, tham số); tách chi phí denoise
   0,5 trong phần còn lại 24,1% của full render; ghosting trên footage
   thật pan nhanh; chặn/cảnh báo ở SpeedPanel khi bật curve trên clip có
   stabilize (hiện chỉ chặn từ phía EnhancePanel); metric jitter bằng ước
   lượng chuyển động thay cho MAD; FPS enhance trên clip dài thật.
3. **R3:** thang blur vẫn overstate ở đầu thấp + làm mềm cạnh (cần cơ chế
   khác blur, vd downscale-upscale — đụng `preview.tsx`); vùng chết
   s < ~0,27; chưa đo trên máy có GPU thật; số combo kém chắc (0,54–0,88×);
   motion blur còn blend sau khi pause (1,39–2,77); stabilize +
   speedKeyframes: preview vẽ cả hai nhưng render chặn (mâu thuẫn có sẵn).
4. **R4:** `.tbtn-label` chưa đo headed trực tiếp ở 1280 vs 1440; speed
   warn mới đo 1/4 đường; sticker warn mới đo 1/2 đường; nút proxy chưa
   bấm thật (cần bridge).
5. **R5:** chưa đo running en/1280/mobile; chưa đo headed timeout
   `recordPackMedia` thật (chỉ unit test mock).
6. **R6:** bridge/server user-facing (~109 bridge + ~24 jobQueue +
   validate/mcp/cli) chưa nối — cần giao thức mã lỗi bridge→web (server
   không có hạ tầng `t()`), ngoài phạm vi một luồng; `preload.ts` 1
   literal cần plumbing lang từ renderer; 3 key gần như không tới được
   (avccNoNal, size-too-small, moov-missing-after-gate) chỉ khóa presence.
7. **R7:** keyframe lớn vẫn fail-open (cần worker nền hoặc quyết tăng
   trần); chi phí một lần ~0,3–0,5 s sau abort; gốc outlier T3-null 4,9 s
   chưa xác định; chưa đo Safari/Firefox.
8. **R8:** pause-seek stall: badge vẫn hiện lý do khi decoder stall ở chế
   độ pause (cần đụng vòng lặp pause-seek, cần quyết parent + đợt riêng);
   lỗi decoder sticky (element `error:3` không hồi phục khi playhead về
   vùng decode được); trùng clipId giữa 2 instance nested → 1 instance
   stall ẩn lý do cả 2.
9. **R9:** xóa bytes ở project này vẫn có thể ảnh hưởng file .vcut khác
   dùng chung bytes (không có sổ tham chiếu liên project); refCount chỉ
   đúng trong một tab; tên thô trùng nhau đếm thừa (cố ý, an toàn theo
   hướng chặn); chưa click-test nút "Chọn tất cả mục mồ côi" và locale
   en/viewport nhỏ.
10. **R10:** MCP `apply_transition` chưa kiểm tra đủ 81 type; effects
    preview sharpen/noise chưa kiểm chứng parity; uisfx 936 file vẫn chưa
    có trên đĩa (fetch-on-demand); nợ trong ghi chú 13–18 FEATURE_STATUS
    (transition qua biên nested, opacity nested, preview/render lệch layer
    chồng LUT, mask bám track, preview ducking, downbeat chưa kiểm chứng
    nhạc thật).
11. **Runner:** `speedcurveTrim` crash lúc thoát do `createRequire(
    import.meta.url)` trong bundle CJS (14/14 check vẫn pass) — cần cách
    chạy chuẩn cho test dùng createRequire + validate.js (cùng họ với
    webglLut type-stripping).
12. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
    nguyên); N5 bản dịch EN template chưa qua người bản ngữ;
    `ci-security.yml` 403 chưa lên GitHub (repo vẫn không có CI chạy thật).

## 6. Stage (KHÔNG push)

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round61-closing.txt`
(NUL-delimited, verify read-back): dict đã gộp (vi.json, en.json); 17 file
test parent đã sửa khi gộp (khóa số key 1972→2044, pre-merge→post-merge,
SCOPED53→54); `styles.css` + `StorageCleanupPanel.tsx` (rule
`.modal.storage-cleanup`); LIMITS tổng hợp này.

Tổng chờ push: **926 entry** (831 cuối đợt 60 + 73 đợt 61 luồng + 22
closing). Các đợt 1–50 đã push xong (HEAD e2cb35e1). Tổng file duy nhất
đợt 61: **87 file** (71 của 10 batch luồng + 16 file chỉ parent đụng).
