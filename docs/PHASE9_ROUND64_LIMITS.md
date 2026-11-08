# LIMITS — Phase 9 đợt 64: GỘP PARENT (merge + kiểm chứng + stage)

Đợt 64: 10 luồng R1–R10, chạy cron 12:35 08/11/2026, chủ đề "đóng nợ đợt 63 +
đo enhance vòng 2". Cả 10 luồng đều xong, batch + LIMITS + log đầy đủ trên đĩa
(kiểm chứng trực tiếp, không tin handoff). Parent gộp ngay, không chờ.

## 0. Kết quả gộp — số thật

| Hạng mục | Số |
|---|---|
| Dict i18n sau gộp | **vi = en = 2283 key lá, 0 lệch tập key, 0 orphan** (trước gộp 2275) |
| Fragment gộp | r2 6 + r8 1 + parent 1 = **8 key**, 0 collision |
| Key vi==en giống hệt nhau | **51** (không đổi so với đợt 63) |
| Batch luồng | **55 entry** (r1 4, r2 7, r3 5, r4 2, r5 2, r6 11, r7 5, r8 10, r9 2, r10 7) |
| Batch closing (parent) | xem `phase9-round64-closing.txt` (dict + snapshot + LIMITS gộp) |
| Tổng chờ push sau đợt 64 | **1255 entry / 138 file batch** (đếm trực tiếp, xem §6) |
| GitHub HEAD | vẫn **e2cb35e1** (đợt 50). KHÔNG push (lệnh đứng). |

## 1. Tóm tắt từng luồng (số của luồng, parent kiểm chứng lại ở §5)

- **R1 — cache đĩa probe GPU:** `probeGpuEncoderCached()` (`server/render/src/gpuencode.js`):
  cache process → cache đĩa `~/.cache/vcut/gpu-probe.json`, TTL 30 ngày,
  fingerprint ffmpeg (path + size + mtime), ghi tạm + rename, best-effort.
  Probe riêng: COLD median **1,21s → WARM 0,004s** (~1,2s/render). Full render
  720p 5s COLD 48,17s vs WARM 54,58s là nhiễu tải, không claim. Test mới
  **30/30**, hồi quy P2 **33 pass**. Nợ: tháo GPU trong TTL → render fail
  (chưa fallback libx264 ở bước encode chính); chưa có nút "Probe lại GPU" trong UI.
- **R2 — detector chuyển động nhanh + cảnh báo denoise ≥0,7:** metric mean |Δ|
  2 frame kề 30fps, downscale 160×90 gray + mờ nhẹ; server `fastMotion.js` +
  web `fastMotion.ts`, ngưỡng FAST=6,0/MEDIUM=4,0. Hiệu chuẩn 7 clip: phân loại
  đúng **7/7** (pan chậm 6px/f 2,834 → slow; pan nhanh 24px/f 9,186 → fast).
  Chuẩn hoá tuyến tính theo gap BỊ BÁC BỎ (lệch 58,7–86,7%). Cảnh báo hiện thật
  trong EnhancePanel kèm score. Server harness **35/35**, web unit **14/14**,
  headed **17/17**, tsc 0, vite build pass. Nợ: ngưỡng chưa hiệu chuẩn trên
  footage thật; chưa đo pan 12px/f; nhánh unknown chưa kiểm chứng headed qua UI.
- **R3 — đo lại FPS blend + spread FPS enhance clip dài:** thang piecewise R63
  **KHỚP** (maxErr 1,5 vs 1,3 đợt 63) — không sửa code/thang. FPS preview enhance
  clip 20s ×3 lặp (tỉ lệ drift-corrected): denoise 720p **0,46x** (0,34–0,61),
  1080p **0,433x**; stabilize 0,743x/0,78x; combo 0,457x/0,37x. Decode rVFC:
  720p 15,54 fps, 1080p 24,15 fps (chênh do tải VM lúc đo, không phải độ phân
  giải). Denoise làm encode nhanh hơn +11,7%/+10,7% (khớp R63 R2). Unit **85/85**,
  tsc 0, vite build pass. Nợ: đo lại decode 720p lúc lặng; presented-frame rate
  qua getVideoPlaybackQuality; FPS máy GPU thật chưa đo.
- **R4 — ghosting trên footage thật:** 4 đoạn CC0/CC-BY (0,6 / 2,5 / 6,0 / 7,9 px/f)
  × denoise 0,5/0,7/0,8 + đối chứng. **KHÔNG cần điều chỉnh ngưỡng cảnh báo
  denoise ≥0,7 theo tốc độ pan trong dải 0,6–7,9 px/f** (bước nhảy b_small
  0,5→0,7 gần như không đổi: +0,058/+0,071/+0,057/+0,077). Sàn encode CRF23 đã
  ghost sẵn (b_small ctrl 0,079–0,126 — của x264, kiểm chứng bằng ffmpeg trực
  tiếp). Claim "không ghost cạnh lớn" của R2 không chuyển nguyên vẹn
  (b_large ở 0,8 lên tới 0,175). Harness mới **59/59**. Nợ: pan >8 px/f
  (whip-pan) chưa có số; giả thuyết "bề mặt phẳng dự báo ghost tốt hơn tốc độ"
  chưa kiểm chứng.
- **R5 — Farneback làm metric jitter:** F2_V5 (thresh-median w25) validate qua bar
  R2 (corr 0,970/1,000; RMSE 1,410px < 1,5px), giảm 85–91% so với đối chứng,
  spread **62,6%/8,4%** so với MAD 69,2%/17,0% — **đồng-chính (co-primary) với
  MAD, KHÔNG thay MAD**. V0 BỊ BÁC BỎ (corr 0,67/0,78; RMSE 7,07px); F5 bị loại;
  J1c/J2c/J3c giáng cấp (marker ground truth chứng minh spread 72–179% là tạo
  tác bộ ước lượng). Hạn chế F2: giá trị tuyệt đối đội ~1,3–2× so với marker;
  tăng ~50% theo denoise trong khi MAD giảm — chỉ so sánh ở denoise cố định.
  Harness mới **27/27**. Nợ: xác nhận F2 trên footage thật + clip dài; metric
  max/p99 frame tệ nhất; frame nhảy hoang đơn lẻ của vidstab.
- **R6 — duplicate project-name registry:** lịch sử version chuyển sang khóa
  projectId envelope (bỏ `rotateProjectId()`, `setProjectIdForFile`); migrate
  chuỗi legacy hội tụ, không nhân đôi; tên trùng hiển thị kèm qualifier (8 ký tự
  đầu projectId hoặc ngày/giờ ghi) trong panel Dọn kho. Unit mới **28/28**,
  headed **7/7** (IndexedDB/localStorage thật), hồi quy projectHistory 15/15,
  projectId63R7 27/27, idbCleanup 16/16, tsc 0, vite build pass. Nợ: nhận nhầm
  khi 2 file khác nhau cùng tên file ở lần nhận đầu; chuỗi `proj-` + `file-`
  phân mảnh cũ chưa tự nhận; autosave-restore/nhập archive không nhận chuỗi legacy.
- **R7 — rate limiter:** đính chính tiền đề brief: quirk Map bucket trong §8 R5
  KHÔNG tồn tại (R5 đã sửa); audit lại tìm được **2 quirk thật**: (A) fixed-window
  boundary burst — 7 request/60s trong khi chính sách 4 (đo bằng bridge thật);
  sửa bằng sliding-window → đúng 4/60s. (B) env NaN (`BRIDGE_RATE_GENERAL=abc`)
  tắt limiter lặng lẽ — 130 request → 130×200; sửa bằng `parseRateLimitInt` +
  cảnh báo khởi động → 119×200 + 11×429. Test mới **58/58**, e2e bridge-error
  **165/165** (gốc 153, +12), hồi quy bridge 142/142 + 170/170 + 52/52 + 64/64
  + 52/52 + validateCodes 1572/1572. Nợ: per-IP socket, không global cap,
  không persist qua restart; `parseInt` vẫn nhận tiền tố số; các env số khác
  chưa siết.
- **R8 — hiển thị job.note trong UI:** `ExportPanel.pollStatus` (điểm tiêu thụ
  publicJob duy nhất) hiện `.render-note` khi job có note (recover sau restart).
  Key `jobNote.recoveredRestart` qua `jobNote64R8.ts` + fragment round64-r8.
  Unit **19/19**, headed **6/6** (SIGKILL bridge thật lúc job running → recover
  → note hiện đúng chuỗi vi), tsc 0, vite build pass. Nợ: note chỉ hiện lúc
  render; chưa test đổi locale giữa chừng lúc note đang hiện.
- **R9 — YUV noise headed:** x264 **KHÔNG phải nguyên nhân chính** của lệch
  noise (chỉ ~7–8%): phân rã nhân tử kênh R 2,95 = codec 1,08× × resampler
  bilinear→lanczos 1,44× × kẹp chroma-rail YUV native 1,34× × Chrome-high giữ HF
  1,41×. Kẹp rail: 31,3% mẫu U / 30,9% mẫu V chạm rails ở YUV native, 0% qua
  RGB-roundtrip. **Không combo nào KHỚP-THỐNG-KÊ**, kể cả lossless CRF 0.
  Sharpen viewport tốt nhất **le8 98,6%** (< 99%, không claim KHỚP); giả thuyết
  "sharpen sau downscale" bị bác bỏ dứt khoát (le8 1,2–1,8%). effectCanvas 14/14,
  parity Node 15/15, previewEngine 14/14, tsc 0, vite build pass. Nợ: hướng sửa
  mô hình thật là mô phỏng kẹp chroma-rail (cần nghiên cứu, preview chỉ có RGB).
- **R10 — trần keyframe High-profile:** đo trực tiếp 49,7/51,8/57,9 MB:
  decode trực tiếp 41,7–58,0 ms (0,86–1,03 ms/KiB) — ngoại suy R4 đúng.
  **Trần 45s → 60s, tỉ lệ 1,2 ms/KiB giữ nguyên** (60s là trần tròn nhỏ nhất bao
  được mọi lần đo; max 57,992 ms). Test mới **11/11**, 62R4 19/19, 63R4 13/13,
  hồi quy GOP 37/37, tsc web/desktop 0, vite build pass. Nợ: tải cực nặng vẫn
  vượt 60s; 58–64 MiB chưa đo trực tiếp; headroom top-end mỏng (57,992 vs 60s);
  lý do fail-open timeout chưa hiển thị cho user; Safari chưa đo.

## 2. Gộp fragment — chi tiết

- Nguồn: 2 fragment luồng `round64-r2.json` (6 key `enhance.fastMotion*`),
  `round64-r8.json` (1 key `jobNote.recoveredRestart`) + 1 fragment parent
  `round64-merge.json` (1 key `projectHistory.migrateVersionsNeedsProjectId`,
  do parent thêm để sửa P7 — xem §3). **Không có collision.**
- Sau gộp: vi == en == **2283 lá**, cùng tập key, 0 mismatch, 0 orphan
  (P7 8/8, orphans 16/16). Key vi==en giống hệt: **51** (không đổi).
- `jobNote.recoveredRestart` vào dict lần này vì R8 đã làm UI tiêu thụ thật
  (quyết định parent đợt 63 "chưa có UI thì chưa vào dict" nay đã hết hiệu lực);
  fragment round63-r5 vẫn giữ key với giá trị y hệt (validationErrors63R5
  khóa trùng key phải đồng giá trị).

## 3. Sửa đỏ do gộp (parent làm, đã xanh lại hết)

1. **bridgeErrors62R5 8/9 → 9/9:** R7 chuyển call site `apiError("RATE_LIMITED")`
   sang file mới `server/bridge/src/rateLimit.js`, test quét danh sách file cố
   định nên mất call site. Sửa: thêm `server/bridge/src/rateLimit.js` vào danh
   sách quét (đúng thiết kế test — file triển khai mới, mã vẫn trong catalog).
2. **P7 7/8 → 8/8:** literal tiếng Việt trong `projectHistory.ts:480` (R6,
   `throw new Error("migrateVersions cần projectId...")`) bị scan tồn đọng bắt.
   Sửa theo đúng mẫu sẵn có trong file (validateImport dùng `trKey`):
   `throw new Error(trKey(this.lookup, "projectHistory.migrateVersionsNeedsProjectId", {}, "..."))`
   + key mới vào dict qua fragment parent round64-merge. Không nới test.
3. **validationErrors63R5:** lật 2 assert jobNote "chưa gộp" → "đã có" + đúng giá
   trị fragment, test đổi tên 122/123 → 123/123 (R8 đã viết sẵn hướng dẫn lật
   trong comment; parent làm đúng hướng dẫn đó).
4. **Orphans/P7 — 6 key `enhance.fastMotion*` bị báo mồ côi:** `fastMotion.ts`
   đọc key trần (`fastMotionWarning`...) từ bảng fragment nên chuỗi key đầy đủ
   `enhance.fastMotion*` không xuất hiện trong src — đúng tiền lệ
   `caption.phase.`/`scene.phase.` đợt 63. Sửa: thêm `"enhance.fastMotion"` vào
   `DYNAMIC_PREFIXES` ở cả P7 và orphans (không nới ngưỡng, không xóa key).
   `jobNote.recoveredRestart` không cần prefix vì `jobNote64R8.ts` chứa đủ chuỗi
   key đầy đủ trong bảng map.
5. **Snapshot số key 2275 → 2283** ở 13 file (12 test web + 1 cjs server);
   comment lịch sử đợt 63 giữ nguyên số 2275 (đã sửa lại sau một lần thay thế
   quá tay — xem §7).

## 4. Căng thẳng chưa giải quyết giữa R2 và R4 (ghi nhận trung thực)

- R2 chỉ cảnh báo denoise ≥0,7 khi detector nói clip **nhanh** (FAST ≥ 6,0).
- R4 đo trên footage thật: bước nhảy ghost 0,5→0,7 gần như **không đổi theo tốc
  độ trong dải 0,6–7,9 px/f**, kể cả khi camera gần như đứng yên — và kết luận
  "nếu có cảnh báo thì áp ở ≥0,7 bất kể tốc độ (trong dải đã đo)".
- Hai kết luận chưa mâu thuẫn trực tiếp (ngưỡng FAST của R2 ≈ pan nhanh hơn dải
  R4 đã đo; R2 hiệu chuẩn trên clip tổng hợp, R4 trên footage thật) nhưng
  **chưa thống nhất**: cảnh báo R2 có thể bỏ sót clip chậm-vừa mà R4 cho thấy
  vẫn ghost. Đợt sau cần hiệu chuẩn ngưỡng R2 trên footage thật (nợ R2) rồi
  quyết định: cảnh báo ≥0,7 luôn luôn, hay giữ cổng theo tốc độ. Không tự ý
  đổi hành vi UI trong đợt gộp này.

## 5. Kiểm chứng parent trên cây đã gộp

- tsc web **0** / desktop **0** (2 lần); vite build **pass** (6,82s).
- P7 **8/8**, orphans **16/16**, validationErrors63R5 **8/8**, bridgeErrors62R5
  **9/9**, structuredNotes32 **12/12**, saveToast31 **15/15** (chạy lại, đúng số),
  errorDetail34Q4 pass, L1 + 4 test reverse + i18nRound57N4 + speedWarn pass.
- Server: error-detail-structured **170/170**, bridge-error-protocol **142/142**,
  error-detail-ui **52/52**.
- Luồng: R1 gpu-probe **30/30** (chạy lại), R2 fastMotion **14/14**,
  R3 blend units **85/85** (chạy lại: 63R3 8/8, 62R3 10/10, 61R3 7/7, 60Q1
  16/16, presets59P8 21/21, previewEngine 14/14; headed FPS dài theo LIMITS
  luồng), R4 ghost **59/59** (chạy lại), R5 farneback **27/27** (chạy lại),
  R6 registry **28/28** + projectHistory **15/15** + projectId63R7 **27/27**,
  R7 rate-limit **58/58** + e2e bridge-error-protocol **165/165** (chạy lại),
  R8 jobNote **19/19**, R9 effectCanvas **14/14** + parity **15/15**,
  R10 gopTrialDecode 64R10 **11/11** + 62R4 **19/19** + 63R4 **13/13**.
- Chưa chạy lại trong đợt gộp: R3 headed FPS dài (~10 phút, số đã khớp 2 lượt
  độc lập), R8 headed 6/6 (theo LIMITS luồng). Hồi quy GOP 37/37 theo LIMITS R10.

## 6. Tổng chờ push (đếm trực tiếp)

1180 sau đợt 63 + 55 entry luồng đợt 64 + 20 entry closing = **1255 entry /
138 file batch đang chờ** (đếm trực tiếp: 138 file batch chờ = 53 file đợt 1–50
đã push không tính; union 664 đường dẫn file phân biệt — con số "127 file" của
đợt 63 cũng là số file batch, nay là 138).
Đếm trực tiếp thư mục paths-loop; các file đợt 1–50 đã push vẫn nằm trong thư
mục nên KHÔNG lấy tổng thư mục làm số chờ push. HEAD vẫn e2cb35e1. KHÔNG push.

## 7. Sự cố trong lúc gộp (đã xử lý)

- Script cập nhật snapshot thay `2275` → `2283` bằng replace toàn cục trong 9
  file đã ăn luôn số **lịch sử** 2275 trong comment (vd "→ 2275 mỗi bên" của đợt
  63, "(2275 sau đợt 63, ..."). Phát hiện khi kiểm tra grep sau thay thế; đã
  khôi phục 9 chỗ về 2275 đúng ngữ cảnh lịch sử và kiểm tra lại bằng grep.
- Handoff lượt chạy có thể báo thiếu luồng (tiền lệ đợt 63): parent kiểm chứng
  trên đĩa — cả 10 batch + 10 LIMITS + 10 log luồng đều có đủ mới gộp.
- Chạy lại harness R5 nền: lần đầu log chỉ giữ tail (`tail -3`) nên không thấy
  dòng đếm 27/27 — đã chạy lại riêng và xác nhận exit 0 + đếm pass (ghi §5).

## 8. Nợ mở cho đợt 65 (tổng hợp từ §1 + §4)

1. Gộp Farneback F1/F2/F3_V5 (+F2_V2 cross-check) vào harness motion-metric làm
   đồng-chính với MAD (đề xuất R5); giữ MAD, J2c chỉ tham chiếu lịch sử, bỏ F5,
   cấm V0; thêm metric max/p99 frame tệ nhất; điều tra frame nhảy hoang vidstab.
2. Hiệu chuẩn ngưỡng detector R2 trên footage thật + pan 12px/f; thống nhất
   cảnh báo denoise ≥0,7 với kết luận R4 (§4).
3. Pan thật >8 px/f (whip-pan) chưa có số; giả thuyết "bề mặt phẳng dự báo ghost
   tốt hơn tốc độ" cần đo kiểm chứng (R4).
4. Cache GPU probe: fallback libx264 khi encoder GPU đã cache lỗi; nút "Probe
   lại GPU" trong UI (R1).
5. Rate limiter: global cap, persist qua restart, siết env số còn lại (R7).
6. Keyframe 58–64 MiB chưa đo trực tiếp; lý do fail-open timeout chưa hiển thị
   cho user; Safari chưa đo (R4/R10).
7. Noise headed vẫn LỆCH-THỐNG-KÊ, sharpen vẫn XẤP XỈ (le8 98,6%): hướng sửa là
   mô phỏng kẹp chroma-rail; đo trên frame pre-encode / CRF 0 trong harness (R9).
8. FPS blend: đo lại decode 720p lúc lặng; presented-frame rate qua
   getVideoPlaybackQuality; FPS máy GPU thật (R3).
9. Registry tên project: nhận nhầm 2 file khác nhau cùng tên ở lần nhận đầu;
   chuỗi legacy phân mảnh chưa tự nhận (R6).
10. jobNote: hiện lúc render thôi; chưa test đổi locale giữa chừng lúc note đang
    hiện (R8). ci-security.yml vẫn chờ quyền workflows (từ Phase 6).
