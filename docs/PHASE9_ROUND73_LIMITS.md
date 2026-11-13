# LIMITS gộp — Phase 9 đợt 73: đóng nợ đợt 72 §4 (9 luồng)

Ngày: 09/11/2026 (lượt cron 15:35 +07 → gộp parent ~17:20 +07).
9 luồng song song A1–A9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 73: **9/9 luồng xong + stage.** Parent gộp: dict 2381 → 2400
> (A9 +19 key), 9 test khóa số key đã bump 2381 → 2400, 2 test khóa
> số key vi==en 52 → 54, css60 preview.tsx 50 → 54 call site.
> Tổng chờ push sau đợt 73: **330 entry / 67 file batch / 215 file
> duy nhất** (khử trùng toàn bộ đợt 67–73; riêng đợt 73 có 53 file,
> trong đó 29 file mới so với đợt 67–72) (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 72 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| A1 | §4.1 resample blend-at-end | **ĐÃ SỬA PRODUCTION.** `resamplePlaneTrilinear` giờ bilinear-sample 2D từng mức mip rồi mới trộn 2 kết quả 2D (bias LOD −0,5 giữ nguyên). Trên dữ liệu headed Z7 (259.584 ô): **maxAbs = 1 mọi thang** (trước: tới 19), RMSE 0,054–0,064. Production bit-identical với module tham chiếu Z7: 20/20 case. Verdict nhiễu w1440 tính lại: **8/8 KHÔNG ĐỔI** (Δkurt R noise05 0,29→0,27, noise10 0,34→0,32). | chrome-resample-67u2 8/8, r72z7-2dblend 4/4, tsc 0 |
| A2 | §4.4 SEGFAULT vidstab | **FRAME LỖI ĐÃ XÁC ĐỊNH.** Lệnh lỗi `vmovdqa64 %zmm17,(%rdi)` trong `__memcpy_avx_unaligned_erms`, qua `vsFrameCopyPlane` fast path (frameinfo.c:137) ← `vsTransformPrepare` (transform.c:150, nhánh in-place) ← `filter_frame` vidstabtransform. Mẫu crash thứ 2 tái hiện đúng stack 8/8 offset. Nguyên nhân khả dĩ nhất: race M1 (W4), triệu chứng thứ hai — dest/length bị corrupt bởi ghi tràn từ warp in-place (tin cậy trung bình; chưa rõ plane/offset). **Không sửa production** (giữ `copy`). Harness preload cải tiến: dump regs + si_code + offsets + `/proc/self/maps` (tra trước `backtrace()`). | trace-regs test 18/18, COPY smoke sha khớp |
| A3 | §4.6 ocean w1440 | **VẪN LỆCH.** Điều kiện hoá delta0 theo absMAD (graded, theo kênh, local 9×9): Δkurt G tốt nhất **1,08** (ngưỡng 0,35) — không cứu được. Render-P (replica `addYuvNoise` verbatim): 1,06–1,10 — giả thuyết est-chroma bị loại. Phát hiện mới: đuôi nặng là **hỗn hợp phương sai** — 11% pixel gradient cao mang preview std G 18,64 thay vì ~9,0; trộn 3 thành phần dự đoán kurt 1,53 (đo 1,35) và std 10,71 (đo 10,69). Giả thuyết trôi khung bị loại (corr thấp, plain==plain2 MAD 0). Không sửa production; quy tắc nhị phân Z2 (ngưỡng 2,5) vẫn đúng cho test-pattern. | 7 ô × 12 biến thể, render-P 6 ô, diag bin + drift |
| A4 | §4.3 TTS 39 | **VẪN MỞ.** pip-audit **39 không đổi** (Pillow 12.3.0, fix 13.0.0; 18 PYSEC + 20 CVE-2026 + 1 GHSA, cùng danh sách ID với Z8). CAP chưa lifted: gradio mới nhất PyPI vẫn 6.31.0, kẹp `pillow<13` còn nguyên. Không bump. Lần kiểm tra thứ 5 trong ngày 09/11, kết quả không đổi. | check-gradio-pillow-cap.py, exit 1 |
| A5 | §4.2 birefnet fps | **VẪN KHÔNG CÓ SỐ — đã hết hướng giảm RAM.** Model ONNX khoá shape cố định `[1,3,1024,1024]` nên input 512×512 bị ORT từ chối (không phải OOM); 1024×1024 chết exit 137 cả arena on/off (HWM 4,32–4,76 GiB, trần cell 6,0 GiB). Tiling/fp16 bị loại có lý do. Cộng dồn VM này: lite 0/6, general 0/5. Không đề xuất fallback birefnet; giữ u2net. | 3 cấu hình đo thật, trace CSV 1 s |
| A6 | §4.5 Gate FN lạnh | **FN LẠNH TÁI HIỆN + RE-GATE BẮT ĐÚNG lần đầu ở ngưỡng thật.** Session1 lạnh thật (VM boot 08:19 UTC, Chrome đầu tiên): slot 1 draw **0,77 fps** dù element phát thật 13,47 fps (cơ chế rAF stall, P50 133,4 ms) → re-gate delta **21 < 30 → phiên chết đúng thiết kế** (ngưỡng cũ 20 đã để lọt). Session2 ấm: gate 32 PASS, re-gate 41 PASS. Thống kê gộp: **FN 6/31 slot (19%), Wilson [9%, 36%]**; re-gate bắt FN **2/2**; FP 0/6 phiên [0%, 39%]. **Giữ ngưỡng 30** (gap mới (21, 41], giữa hình học ≈ 29). | Launcher + analyzer Z3 tái sử dụng; tsc 0 |
| A7 | §4.7 Keyframe/Safari | **TRẦN 90 s KHÔNG RÀNG BUỘC Ở ĐÂU.** `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS = 90_000`: công thức timeout cho tối đa 78.536 ms với sample 64 MiB (biên 11.464 ms); trần chỉ cắt ở sample ≈ 73–74 MiB — ngoài miền cho phép. Không có hằng số 90 s nào trong nội suy keyframe; ràng buộc duy nhất của `keyframe.t` là [0, duration]. **Test keyframe > 90 s: 18/18 PASS** (tới 3600 s). Safari (chưa đo thật): **vá 2 lỗi chắc-chắn-vỡ** — MIME media mẫu hard-code `video/webm` (Safari ghi mp4) và `ctx.roundRect` Safari < 16 (fallback `pathRoundRect`); còn nợ: import VP9/WebM/AV1 không có codec-probe, tên file mẫu vẫn `.webm`. | keyframeBeyond90 18/18, canvasRoundRect 3/3, sampleMime 4/4, tsc 0, vite build pass |
| A8 | §4.8 GPU fallback | **FALLBACK GPU→CPU HOẠT ĐỘNG.** Render thật trên cả 5 đường fallback (nvenc/qsv/vaapi cache + ép tay + GPU chết giữa chừng kill -9 ở frame 84/240): **exit 0, MP4 h264 hợp lệ, đúng 1 retry, cache probe lỗi bị xoá, 0 ffmpeg mồ côi**. GPU path thật không chạy được trên VM (không `/dev/dri`, không `/dev/nvidia*`, probe trả null) — không có số fps GPU. CPU: 720p 5 s 1,37–1,48 s (109,6/101,4 fps lúc yên); overhead fallback fail-nhanh ≈ 0,15 s. Phát hiện: `render.js:1805` dùng `spawnSync` **không timeout** — ffmpeg treo thì job treo theo, fallback không kích hoạt (nợ đợt sau). | gpu-fallback test 54/54, hồi quy S4 18/18, gpuencode self-test pass |
| A9 | Gap §3 S4 | **PRESET XUẤT 4:5 + SAFE-AREA OVERLAY.** Preset `ig-portrait` 1080×1350 @30fps (bộ preset đủ 9:16/1:1/4:5/16:9). Module `lib/safeArea.ts`: 4 nền tảng (TikTok 9:16, YouTube 16:9, IG 1:1/4:5) + `letterboxRect` + validate. Overlay preview: nút toggle `⌖ Vùng an toàn`, zone sọc đỏ + title-safe nét đứt xanh, select đổi nền tảng, nhớ localStorage, mặc định theo preset xuất. i18n **+19 key → dict 2400**. | safeArea 12/12, SSR overlay 4/4, ProjectMenu i18n 6/6, tsc 0, vite build pass |

## 1. Ghi chú parent merge (quan trọng)

1. **A9 thêm 19 key dict nhưng chỉ bump 8/17 test khóa số key — parent đã bump nốt 9 file** (i18nAudit59P7, i18nOrphans60Q4, i18nRound57N4, reverseBadge46B6, reverseCompat44Z6, reversePlaybackI18n49E2, reverseToggleI18n48D4, saveToast31, structuredNotes32) 2381 → 2400, cùng mẫu đợt 67/68/69/71/72. Dict đã xác minh độc lập: vi=en=2400 (r6-i18n-check PASS).
2. **Số key vi==en 52 → 54 là hợp lệ, không phải rò rỉ:** 2 key mới của A9 có giá trị giống hệt hai bên vì là tên riêng — `safeArea.platformTiktok` ("TikTok / Reels 9:16") và `safeArea.platformYoutube` ("YouTube 16:9"). Parent đã bump 52 → 54 ở cả 2 test khóa (i18nAudit59P7, i18nOrphans60Q4) kèm chú thích thành phần. i18nOrphans trước khi sửa đỏ 15/16 đúng 1 check này.
3. **css60 preview.tsx 50 → 54 call site (cùng mẫu đợt 67 U6 / đợt 72 Z5):** A9 thêm 4 call `i18nT("safeArea.toggle*")` vào preview.tsx mà không cập nhật expected list — parent đã thêm 4 key + bump count. Đã đếm trực tiếp: 54 call site trong preview.tsx.
4. **Không xung đột file giữa các luồng** ngoài 3 file chung đã gộp sạch: preview.tsx (A7 pathRoundRect + A9 SafeArea — cả hai đều hiện diện), styles.css (A7 + A9), tsconfig.json (A7 3 test + A9 1 test — cả 4 entry đều có). A7 tự ghi nhận đã nối tiếp sau entry của A9 trong tsconfig.
5. **A1 không chạy lại headed** — dùng dữ liệu headed Z7 (259.584 ô) để verify production mới; chấp nhận được vì cùng fixture + module tham chiếu bit-identical 20/20. Verdict w1920/w2560 chưa tính lại bằng mô hình mới (nợ A1 §7).
6. **A5 đã tự append log riêng vào build-loop-log.md** trước khi parent gộp — parent chỉ append thêm mục gộp, không ghi đè.
7. **Môi trường:** VM reboot 08:19 UTC 09/11 (A6 bắt được phiên lạnh thật); không có EPERM trong lượt này.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy sau mọi sửa của parent).
- vite build **PASS** 5,83 s.
- r6-i18n-check: **PASS** (dict vi=en=2400).
- P7 i18n audit (i18nAudit59P7): file pass; i18nOrphans **16/16** (sau khi parent sửa 52→54); css60 **59/59** (sau khi parent sửa 50→54); css61 **60/60**.
- Suite luồng: chrome-resample-67u2 **8/8**, r72z7-trilinear-2dblend **4/4**, keyframeBeyond90 **18/18**, canvasRoundRect **3/3**, sampleMime **4/4**, safeArea **12/12**, ProjectMenu i18n **6/6**, A2 trace-regs **18/18**, A8 gpu-fallback **54/54**, `npm run test:unit` **7/7**.
- Lưu ý cách chạy test: các test `.test.ts` dùng import không đuôi `.ts` phải chạy qua esbuild bundle (như header từng test ghi); `node --test` trực tiếp FAIL lỗi `ERR_MODULE_NOT_FOUND` (không phải lỗi test). ProjectMenu bắt buộc `--format=cjs` (react-dom/server dùng require động).
- Không chạy lại harness đo nặng nhiều giờ (A3/A5/A6 đã đo trong luồng) và không chạy lại click-test headed A9 (preset 4:5 chưa render MP4 thật end-to-end — nợ A9).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round73-a1-resample-blend.txt` (4), `a2-vidstab-trace.txt` (3),
  `a3-ocean-w1440.txt` (4), `a4-tts39.txt` (1), `a5-birefnet-fps.txt` (1),
  `a6-gate-fn.txt` (1), `a7-keyframe-safari.txt` (13),
  `a8-gpu-fallback.txt` (2), `a9-gap.txt` (14),
  `phase9-round73-closing.txt` (13: LIMITS gộp + 12 file parent sửa —
  9 snapshot test bump 2381→2400 (i18nRound57N4, reverseBadge46B6,
  reverseCompat44Z6, reversePlaybackI18n49E2, reverseToggleI18n48D4,
  saveToast31, structuredNotes32, i18nAudit59P7, i18nOrphans60Q4 — trong
  đó 2 file sau còn bump thêm vi==en 52→54) + cssClasses60Q2
  (preview.tsx 50→54 call site) + 2 file comment errorDetail34Q4 và
  speedWarnTooShortDead63R10).
- Tổng đợt 73: **56 entry / 10 file / 53 file** (29 file mới so với
  đợt 67–72). Tổng chờ push sau đợt 73:
  **330 entry / 67 file batch / 215 file duy nhất** (khử trùng toàn bộ
  đợt 67–73) (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10; đợt 73: 56/10). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 74

1. **Ocean w1440:** cơ chế phương sai thừa ×2 ở 11% pixel gradient cao vẫn mở — hướng đề xuất A3 LIMITS §6: probe tổng hợp (gradient dốc + noise05, w1440), giao thức snapshot khẳng định cùng-khung, quét thang s liên tục trên ocean noise05.
2. **Birefnet fps:** hết hướng giảm RAM trong sandbox — chỉ đo lại khi trần cell được nâng hoặc có model ONNX dynamic-shape; hoặc đo trên máy RAM tổng ≥ 12 GB (khuyến nghị 16 GB).
3. **TTS 39 CVE:** vẫn chờ upstream — kiểm tra định kỳ bằng `scripts/check-gradio-pillow-cap.py`; chỉ thử bump khi in `CAP LIFTED`.
4. **SEGFAULT vidstab:** chờ lần crash tiếp theo dưới handler mới (đã dump regs+maps) để trả lời plane/offset/dest-vs-length; nợ dài hạn `AVFILTERPAD_FLAG_NEEDS_WRITABLE` (build ffmpeg riêng) vẫn còn.
5. **Gate:** giữ ngưỡng 30 (tạm thời); xem lại ngay khi có thêm 1 phiên FN hoặc 1 phiên khỏe delta < 41 (biên khỏe chỉ còn 11 draws).
6. **Resample:** thang khác nhau 2 trục (hình học dẹt) chưa đo headed; verdict w1920/w2560 chưa tính lại bằng mô hình blend-at-end mới; mô hình nhiễu Y8 còn thiếu ~0,05–0,1 Δkurt R.
7. **Safari:** import VP9/WebM/AV1 chưa có codec-probe; tên file media mẫu vẫn `.webm`; Safari thật + GPU thật vẫn chưa đo được.
8. **Render:** `render.js:1805` `spawnSync` không timeout — ffmpeg treo thì job treo theo, fallback không kích hoạt (A8 đề xuất thêm timeout bước 7).
9. **Preset 4:5 (A9):** chưa render MP4 thật end-to-end; số vùng safe-area là xấp xỉ (bố cục UI công khai, không đo pixel-exact); chưa click-test headed.
10. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
11. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.
