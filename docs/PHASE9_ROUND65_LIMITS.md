# LIMITS — Phase 9 đợt 65: GỘP PARENT (merge + kiểm chứng + stage)

Đợt 65: 10 luồng S1–S10, chạy cron 15:35 08/11/2026, chủ đề "đóng 10 nợ mở
của đợt 64" (docs/PHASE9_ROUND64_LIMITS.md §8). Cả 10 luồng đều xong, batch
+ LIMITS + log đầy đủ trên đĩa (kiểm chứng trực tiếp, không tin handoff).
Parent gộp ngay, không chờ.

## 0. Kết quả gộp — số thật

| Hạng mục | Số |
|---|---|
| Dict i18n sau gộp | **vi = en = 2297 key lá, 0 lệch tập key, 0 orphan** (trước gộp 2283) |
| Fragment gộp | S2 1 + S4 10 + S6 1 + S8 2 = **14 key**, 0 collision |
| Key vi==en giống hệt nhau | **51** (không đổi so với đợt 64) |
| Batch luồng | **63 entry** (s1 2, s2 8, s3 2, s4 12, s5 6, s6 8, s7 6, s8 11, s9 5, s10 3) |
| Batch closing (parent) | xem `phase9-round65-closing.txt` (dict + 13 snapshot + 2 test sửa + LIMITS gộp) |
| Tổng chờ push sau đợt 65 | **1336 entry / 149 file batch** (đếm trực tiếp, xem §6) |
| GitHub HEAD | vẫn **e2cb35e1** (đợt 50). KHÔNG push (lệnh đứng). |

## 1. Tóm tắt từng luồng (số của luồng, parent kiểm chứng lại ở §5)

- **S1 — Farneback vào harness motion-metric:** harness mới
  `server/render/src/test_round65_s1_motion_metric.js` (MAD + F1/F2/F3_V5
  + F2_V2 cross-check + J2c tham chiếu lịch sử + max/p99 frame tệ nhất +
  wild8). F5 bỏ, V0 cấm ở mức code. Tái lập R5 tới 4 chữ số (MAD đối chứng
  11,8789; F2_V5 13,4624). **Phát hiện lớn: `vidstabdetect` không phải
  nguồn spread** (.trf khác byte nhưng nội dung giống hệt, 149/149 dòng
  chỉ khác thứ tự LM); **`vidstabtransform` mới là nguồn** — không xác định
  ngay cả với cùng file .trf byte-identical (MAD 7,85 vs 5,45, spread
  36,1%). Harness **27/27**. Nợ: mọi đo stabilize sau này phải chạy ≥3 lần
  và báo spread; footage thật: hiệu ứng stabilize nhỏ hơn nhiễu run-to-run
  của transform.
- **S2 — hiệu chuẩn detector R2 + thống nhất cảnh báo denoise:** cổng cảnh
  báo cũ (chỉ clip nhanh) bỏ sót **4/6** clip footage thật ghost-positive;
  **quy tắc mới: cảnh báo ở denoise ≥0,7 với mọi mức đo được** (FN=0, FP=1
  clip tĩnh tổng hợp có chủ ý). Detector score không đo tốc độ pan (cùng
  12 px/f: mặt nước 2,1 slow vs đường phố 9,7 fast). Ngưỡng FAST=6,0/
  MEDIUM=4,0 giữ nguyên, level nay chỉ là thông tin hiển thị. Nhảy ghost
  0,5→0,7 ổn định 0,057–0,083 tới 13,6 px/f. 1 key mới
  `enhance.fastMotionWarningSlow`. Harness mới **87/87**, R2 chạy lại
  36/36, web unit 14/14, headed 29/29. Nợ: whip-pan thật >14 px/f chưa có
  số; b_flat > 1 trên mặt nước pan cần theo dõi.
- **S3 — whip-pan >8 px/f + giả thuyết bề mặt phẳng:** pan tổng hợp trên
  footage thật (slovenska.webm CC BY), 14/26/49 px/f × 2 bề mặt, 24 render
  thật. **Ghost KHÔNG tăng theo tốc độ 14→49 px/f** (b_small vượt sàn ở
  0,7: 0,42–0,63 trên toàn dải 0,6→49 px/f). Giả thuyết bề mặt phẳng: **hỗ
  trợ một phần, yếu, không nhất quán** (chênh flat−tex TB +0,039, 7/9 ô
  dương; b_large tách phẳng vs chi tiết ~3× là ứng viên metric tốt hơn).
  Hệ quả: cảnh báo denoise ≥0,7 không cần điều chỉnh theo tốc độ, mở rộng
  tới ~49 px/f. Harness **96/96**. Nợ: chưa có pan thật bằng camera
  (motion blur quang học); clip 48 px/f chỉ dài 2s.
- **S4 — fallback GPU probe + nút "Probe lại GPU":** encoder GPU từ cache
  lỗi → render lại đúng 1 lần bằng libx264 + xóa cache lỗi; endpoint
  `GET /api/gpu-probe` + `POST /api/gpu-probe/reprobe`; nút trong
  ExportPanel (10 key `export.gpuProbe.*`). Test fallback **18/18**,
  bridge **13/13**, lib UI 9/9, hồi quy R1 30/30. Nợ: chưa test trên GPU
  thật (giả lập bằng wrapper ffmpeg fail `h264_nvenc`); chưa click-test
  nút trên browser thật.
- **S5 — rate limiter: global cap + persist + siết env:** global cap mặc
  định 600/cửa sổ (`BRIDGE_RATE_GLOBAL`, 0 = tắt), header mới
  `X-RateLimit-Global-Remaining`; persist JSON `~/.cache/vcut/rate-limit.json`
  (ghi tạm + rename, lưu 5s khi dirty + flush lúc tắt graceful); 4 env mới
  qua `parseRateLimitInt`. Unit **108/108**, E2E bridge thật **40/40 ×3**,
  hồi quy R7 165/165. **Tác dụng phụ do parent phát hiện (xem §3):**
  persist làm test R7 e2e cũ rò mốc giữa các bridge instance — đã vá ở
  test, không sửa code S5.
- **S6 — keyframe 58–64 MiB + lý do fail-open:** đo trực tiếp 8 fixture
  High-profile 53,1–63,5 MiB: tải thấp decode **11–22 s** (0,17–0,37
  ms/KiB), không chạm trần 60 s; tải nặng 63,54 MiB: 58,5 s (4 hog +
  1 encode) và timeout 60 s (4 hog + 2 encode). **Trần 60 s + tỉ lệ
  1,2 ms/KiB giữ nguyên.** Timeout fail-open nay hiện toast 1 lần cho
  user (`gop.trial.timeoutNote`, đã kiểm chứng headed với timeout thật).
  Safari không đo được (VM Linux, không binary/WebKit). Test mới **15/15**.
  Nợ: 64,0 MiB đầy đủ chưa đo (lớn nhất 63,54 MiB); O6 nhạy tải.
- **S7 — mô phỏng kẹp chroma-rail (noise + sharpen):** chứng minh cơ chế
  lệch là **chiếu gamut** (base YUV native nằm ngoài khối RGB; rail-clip-only
  ZERO tác dụng). Đổi base nhiễu sang chroma native ước lượng theo khối 2×2
  (kCb=1,04 / kCr=1,12): **noise KHỚP-THỐNG-KÊ ở full-res pre-encode (lần
  đầu)** — tỉ lệ std [1,02, 0,99, 1,05] / [1,05, 0,97, 1,05], Δkurt ≤0,31,
  4/4 seed. Noise headed vẫn LỆCH nhưng phần dư nay là resample (w1920/
  lanczos std KHỚP). Sharpen vẫn XẤP XỈ (MAD 0,194→0,161; le8 tốt nhất
  98,3% < 99%). Đính chính phụ: glitch render thật chạy noise trên plane
  RGB (không phải yuv420p như R63 giả định) — đã sửa `applyGlitch`; parity
  test sharpen cũ dùng bt601, đã sửa sang bt709. Unit **14/14**, parity
  **15/15**, headed 7/7 × 3 cỡ. Nợ: khớp phép resample viewport là việc
  riêng; kCb/kCr chưa kiểm trên nội dung tự nhiên thật.
- **S8 — đo lại decode 720p lúc lặng + presented-frame rate:** presented
  mean **26,23 fps** (rep lặng tốt nhất 29,93), rVFC chỉ 16,02 — số 15,54
  của R64 (chỉ rVFC) đánh giá thấp tốc độ trình chiếu thật. FPS meter đã
  có dòng presented thật. Bác bỏ giả thuyết element tách DOM làm
  totalVideoFrames đứng yên (lúc lặng presented 30,04 fps). Dropped ≈ 0
  nhưng frame vẫn mất do decoder skip. FPS máy GPU thật chưa đo được (VM
  không có GPU; harness đã viết sẵn). Unit **12/12 + 8/8**, headed 4/4.
  Nợ: presented 1080p trong app; bug n=0 trong `clicktest-64r3-fps-long.mjs`
  vẫn còn (nên backport).
- **S9 — registry tên project:** luật nhận chuỗi legacy nay cần bằng chứng
  hash nội dung (tên khớp nhưng hash lệch → từ chối
  `ambiguous-name-only-hash-mismatch`); tự nhận chuỗi phân mảnh
  (`adoptLegacyHistoryChain` quét tối đa 200 chuỗi, chỉ nhận mảnh chắc
  chắn). Test **43/43** (trước sửa 28 pass / 12 fail, tái hiện đúng bug),
  hồi quy projectHistory 15/15, projectId 27/27. Nợ: mảnh mơ hồ chưa có UI
  nhận thủ công; autosave-restore/nhập archive chưa nhận chuỗi legacy.
- **S10 — jobNote đổi locale giữa chừng:** đóng bằng kiểm chứng, không sửa
  code sản phẩm. Note vi→en sau **1027 ms**, en→vi sau **547 ms**, không
  kẹt text cũ, không crash. Unit **12/12**, headed **9/9**. Phát hiện: nút
  ngôn ngữ TopBar không bấm được khi modal Export mở (backdrop z 400 phủ
  TopBar z 30); đường đổi locale thực tế là menu native desktop. Nợ mới:
  mở lại panel không resume job đang chạy (thiếu tính năng resume).

## 2. Gộp fragment — chi tiết

- Nguồn: 4 fragment luồng `round65-s2.json` (1 key
  `enhance.fastMotionWarningSlow`), `round65-s4.json` (10 key
  `export.gpuProbe.*`), `round65-s6.json` (1 key `gop.trial.timeoutNote`),
  `round65-s8.json` (2 key `perf.presentedFps`/`perf.presentedNote`).
  **Không có collision** (key chưa từng có trong dict), vi==en cùng tập
  key từng fragment.
- Sau gộp: vi == en == **2297 lá**, cùng tập key, 0 mismatch, 0 orphan
  (P7 8/8, orphans 16/16). Key vi==en giống hệt: **51** (không đổi).
- Script gộp của parent: `hidden_files/round65-merge-i18n.cjs` (deep-merge
  có assert: key đã tồn tại → fail; vi/en lệch → fail).
- Snapshot số key 2283 → 2297 ở 13 file (12 test web + 1 cjs server);
  comment lịch sử đợt 64 giữ nguyên số 2283 (chỉ dòng assert/tên test/
  mô tả trạng thái hiện tại mới đổi — bài học đợt 64 §7).

## 3. Sửa đỏ do gộp (parent làm, đã xanh lại hết)

1. **R7 e2e bridge-error 165/165 → 128 pass / 27 fail (lần 1), 133/22
   (lần 2) — HỒI QUY THẬT do đợt 65, 2 nguyên nhân:**
   a. **`/tmp` đầy (tmpfs 512M, chỉ còn 214MB < ngưỡng 256MB)** → bridge
      trả 507 DISK_LOW cho mọi request render. Nguyên nhân: 4 file
      `load-*.mp4` của S6 (66MB/file) còn sót trong /tmp. Sửa: xóa 4 file
      đó (đã đo xong, số liệu trong LIMITS S6) → /tmp còn 477MB trống.
      Đây là dọn dẹp, không sửa code.
   b. **Persist của S5 làm rò mốc limiter giữa các bridge instance trong
      cùng test** (mặc định `~/.cache/vcut/rate-limit.json`): bridge B/C/D
      nạp mốc của bridge A (cùng IP 127.0.0.1) nên budget general 4 bị ăn
      trước → "general #3 vẫn 200" nhận 429. Đây là hành vi đúng của
      tính năng persist, nhưng test cũ không cách ly. Sửa (test-only):
      thêm `BRIDGE_RATE_PERSIST_PATH` riêng từng instance trong
      `test-bridge-error-protocol-e2e.cjs` (4 chỗ) + xóa file persist mặc
      định sót lại. Chạy lại: **165/165**.
   - Bài học: từ nay mọi test spawn bridge phải đặt persist path riêng
     (S5 đã ghi nợ này trong LIMITS §6; test R7 cũ là nạn nhân đầu tiên).
2. **r6-i18n-check 2 lỗi: `scene.phase.upload` / `scene.phase.scan` bị
   báo thừa.** Không phải hồi quy đợt 65 (không luồng đợt 65 nào đụng
   code scene phase; key vào dict từ đợt 63). Nguyên nhân: 2 key đọc qua
   bảng fragment (`scenePhase63R5.ts`, key trần upload/scan) nên chuỗi
   key đầy đủ không xuất hiện literal trong src — đúng tiền lệ
   `caption.phase.`/`scene.phase.` mà P7 và orphans đã coi là prefix động.
   Sửa: thêm `"scene.phase."` vào `dynamicPrefixes` của
   `r6-i18n-check.cjs` (kèm comment ghi rõ tiền lệ). Chạy lại: **PASS**.
3. **P7/orphans/i18nRound57N4/reverseBadge/reverseCompat/ProjectMenu chạy
   bằng `node --experimental-strip-types` báo ERR_MODULE_NOT_FOUND**
   (import extensionless). Không phải lỗi code — các test này chạy bằng
   esbuild bundle theo header của file (mẫu M2/N4/N8). Parent chạy lại
   đúng cách: P7 8/8, orphans 16/16, N4 14/14, B6 8/8, Z6 10/10, L1 6/6.

## 4. Căng thẳng đã giải quyết trong đợt (ghi nhận trung thực)

- **R2↔R4 (cảnh báo denoise) đã đóng:** S2 + S3 đo trên footage thật và
  whip-pan tới 49 px/f — cảnh báo ≥0,7 áp với mọi mức đo được, không cổng
  theo tốc độ. Kết luận R4 ("áp ở ≥0,7 bất kể tốc độ trong dải đã đo") nay
  mở rộng từ ~8 px/f lên ~49 px/f; cổng FAST của R2 chỉ còn là thông tin
  hiển thị.
- **R5↔R4 (stabilize hại footage thật?):** S1 đo lại cho thấy hiệu ứng thật
  nhỏ hơn nhiễu run-to-run của `vidstabtransform` (spread 36–38%) — không
  kết luận được stabilize hại hay lợi trên footage thật từ số hiện có; mọi
  đo stabilize sau này phải chạy ≥3 lần và báo spread.

## 5. Kiểm chứng parent trên cây đã gộp

- tsc web **0** / desktop **0**; vite build **pass** (5,92s).
- P7 **8/8**, orphans **16/16**, r6-i18n-check **PASS**, saveToast31
  **15/15**, structuredNotes32 **12/12**, i18nRound57N4 **14/14**,
  reverseToggle **3/3**, reversePlayback **3/3**, reverseBadge **8/8**,
  reverseCompat **10/10**, ProjectMenu i18n **6/6**, errorDetail34Q4
  **35 pass**, validationErrors63R5 **8/8**, error-detail-structured
  **170/170**, bridge-error-protocol unit **142/142**, error-detail-ui
  **52/52**, bridgeErrors62R5 (theo LIMITS R7, không chạy lại — xem §7).
- Luồng (chạy lại bởi parent): S1 harness log trên đĩa **27/27**
  (không chạy lại toàn bộ — render dài; log run3 EXIT=0, xem §7), S2
  harness log trên đĩa **87/87** (log run2 + summary.json, xem §7), S3
  harness log trên đĩa **96/96** (log run2, xem §7), S4 fallback **18/18**
  + bridge **13/13**, S5 rate-limit unit **108/108** + e2e **40/40**,
  S6 gopTrialDecode **15/15**, S7 effectCanvas **14/14** + parity
  **15/15**, S8 presentedFps **12/12** + perfPresented **8/8**, S9 registry
  **43/43**, S10 jobNote **12/12**.
- Hồi quy: jobNote64R8 **19/19**, fastMotion64R2 **14/14**, projectHistory
  **15/15**, gopTrialDecode64R10 **11/11**, gpuencode self-test pass,
  R7 e2e bridge-error **165/165** (sau vá §3).
- Chưa chạy lại trong đợt gộp: S2 headed 29/29, S6 headed timeout-note,
  S7 headed 7/7 × 3 cỡ, S8 headed 4/4 + decode-720-idle, S10 headed 9/9
  (theo LIMITS luồng); R4 ghost harness 59/59 (theo LIMITS R4 đợt 64).

## 6. Tổng chờ push (đếm trực tiếp)

1255 sau đợt 64 + 63 entry luồng đợt 65 + 18 entry closing = **1336 entry /
149 file batch đang chờ** (đếm trực tiếp; đợt 65 đóng góp 80 đường dẫn phân
biệt: 62 luồng + 18 closing, không trùng nhau).
Đếm trực tiếp thư mục paths-loop; các file đợt 1–50 đã push vẫn nằm trong thư
mục nên KHÔNG lấy tổng thư mục làm số chờ push. HEAD vẫn e2cb35e1. KHÔNG push.

## 7. Sự cố trong lúc gộp (đã xử lý)

- Handoff lượt chạy có thể báo thiếu luồng (tiền lệ đợt 63/64): parent kiểm
  chứng trên đĩa — cả 10 batch + 10 LIMITS + 10 log luồng đều có đủ mới gộp.
- S1 lượt 2 chết giữa chừng (~09:04, session nền biến mất, không lỗi trong
  log); S1 chạy lại thành lượt 3, xong 27/27 — parent lấy log run3 làm chuẩn.
- S3 lượt harness 1 bị SIGTERM sau 876s khi luồng gọi `nothing_to_do` lúc
  còn tiến trình nền; harness resumable nên lượt 2 chạy nốt, tổng 96/96.
  Bài học vận hành: không kết thúc lượt bằng `nothing_to_do` khi còn tiến
  trình nền đang chạy.
- S5 va chạm S4 08:43–08:51 (file `gpuProbe.js` require sai làm bridge không
  khởi động được); S4 tự sửa xong 08:51:50, S5 chạy lại trên cây thật sau đó.
- `bridgeErrors62R5` chưa chạy lại trong đợt gộp này (chỉ liệt kê theo
  LIMITS R7 đợt 64); các test bridge khác liên quan (error-protocol
  142/142, e2e 165/165, structured 170/170, ui 52/52) đều xanh.
- Lệnh `du` toàn workspace của parent bị backgrounded (chậm) — không ảnh
  hưởng kết quả; dung lượng /tmp đã xử lý trực tiếp ở §3.

## 8. Nợ mở cho đợt 66 (tổng hợp từ §1 + LIMITS các luồng)

1. Vidstabtransform không xác định (spread 36–38%): mọi đo stabilize phải
   chạy ≥3 lần + báo spread; điều tra sâu hơn nguồn không xác định trong
   transform (S1).
2. Whip-pan thật >14 px/f chưa có số (S2); pan thật bằng camera chưa có để
   đối chiếu motion blur quang học (S3); b_large là ứng viên metric ghost
   tốt hơn b_small (S3).
3. Noise headed vẫn LỆCH — cần đợt riêng khớp phép resample viewport (S7);
   sharpen vẫn XẤP XỈ (le8 tốt nhất 98,3%) — cần estimator base native
   chính xác hơn ở vùng bão hoà (S7); kCb/kCr chưa kiểm trên nội dung tự
   nhiên thật (S7).
4. FPS GPU thật chưa đo (cần máy có GPU); presented 1080p trong app; bug
   n=0 trong `clicktest-64r3-fps-long.mjs` nên backport (S8).
5. Keyframe 64,0 MiB đầy đủ chưa đo trực tiếp (lớn nhất 63,54 MiB) (S6);
   toast timeout trong app thật chưa click-test (S6).
6. Mảnh legacy mơ hồ chưa có UI nhận thủ công; autosave-restore/nhập
   archive chưa nhận chuỗi legacy (S9).
7. Mở lại ExportPanel không resume job đang chạy — thiếu tính năng resume
   (S10); nút ngôn ngữ TopBar không bấm được khi modal Export mở (S10).
8. Mọi test spawn bridge phải đặt `BRIDGE_RATE_PERSIST_PATH` riêng (bài học
   §3b) — rà soát các test e2e còn lại dùng bridge mặc định.
9. `ci-security.yml` vẫn chờ quyền workflows (từ Phase 6).
