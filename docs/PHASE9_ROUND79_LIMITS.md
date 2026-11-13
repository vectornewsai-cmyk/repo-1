# Phase 9 — Đợt 79: LIMITS gộp (parent merge, 10/11/2026)

> Gộp 9 luồng G1–G9 (đợt 79, lượt cron 09:35 +07). Không push, không
> release/tag. Chi tiết từng luồng: xem LIMITS riêng của từng luồng
> (`docs/PHASE9_ROUND79_G{1..9}_*_LIMITS.md`) và log luồng
> `hidden_files/round79-g{1..9}.md`.

## 1. Kết quả từng luồng

- **G1 — FPS deint-only: G5 ĐÃ ĐÓNG (giữ thay đổi trong production).**
  Intermediate deint đọc từ canvas held-frame đã vẽ cùng tick thay vì
  đọc lại video; số lần đọc video mỗi tick deint-only 2 → 1. Draw-fps
  1,51× / 0,83× / 1,03× trong 3 lần chạy headed độc lập, cả 3 ≥ 0,75×
  (gộp 15 tỉ lệ mean 1,12, median 1,01); code cũ 0,59×/0,58×/0,55×.
  Pixel không lệch: probe MAD B-vs-A 0,0162/0,0133 (max 1/255). Hạn chế:
  gap-mean metric phụ chỉ 0,71× trong 1 lần đo; từng tỉ lệ rải 0–2,9,
  baseline ~1 fps, tải VM 0,7–37,8 — đừng trích "nhanh hơn 12%".
  Kiểm chứng: tsc web 0; vite build pass; unit E1 11/11, D4 10/10,
  C8 14/14; headed E1 10/10 ×2; tick-time 7/8 (chỉ T1 gap FAIL).
- **G2 — Gate re-gate: NỢ ĐÃ ĐÓNG, lần giết thật đầu tiên của luật mới.**
  10/10 phiên chuẩn có JSON (8 exit 0, 2 exit 1 do bị giết). Lần giết
  thật đầu tiên: 2 lần (S2 slot1 1,97 fps FN, re-gate 15 FAIL; S4 slot1
  0,20 fps FN, re-gate 18 FAIL). Trước đợt này: 0 lần trong 9 phiên
  luật mới (E2+F2). Luật mới bắt FN sớm 2/3 (luật cũ cũng 2/3);
  FP kiểm duyệt 0; FP đầy đủ 0 (luật cũ 1 — S3); tha oan 1 (S3, slot1
  2,07 fps). Gộp E2+F2+G2 (19 phiên luật mới): FN 4, bắt FN sớm luật
  mới 2/4 (luật cũ 3/4), FP kiểm duyệt 0, tha oan 2. Ngưỡng 30/20/2
  GIỮ NGUYÊN (delta FN n=8: 2, 15, 17, 18, 18, 21, 30, 75; delta
  khỏe n=27: min 4 — vẫn chồng lấn). Cặp cận ngưỡng S2/S3: cùng
  re-gate delta 15 FAIL, slot1 1,97 (GIẾT) vs 2,07 (THA) — verdict lật
  theo 0,10 fps; cả hai đều sát ngưỡng 2 fps nên chưa kết luận được
  độ sắc của ranh giới.
- **G3 — SPLIT cho vidstabtransform: KHÔNG thay đổi production.**
  Stress 6 arm × n=10 = 60 lần chạy ffmpeg stock 8.1.2: crash 0/60
  (SP 0/30, NC 0/30, Fisher p=1,0). Control 1080p gộp 0/15; gộp
  F3+G3 0/30 vs E3-F 7/10 → Fisher p≈6,4×10⁻⁶ (cửa sổ thiếu power
  cho endpoint crash, lần thứ 2 liên tiếp sau F3). Sha: SPLIT thắng
  tuyệt đối — 30/30 = ground truth cả 3 size; NOCOPY lệch 19/30
  (720p 10/10, 360p 8/10, 1080p 1/10); Fisher sha-lệch 720p
  p≈1,1×10⁻⁵; 360p p≈7,1×10⁻⁴. SPLIT khử biểu hiện race ở mức pixel
  đúng như NEEDS_WRITABLE (F3: p≈1e-8). Runtime SPLIT ≈ NOCOPY
  (1080p 74,9 s vs 78,5 s) — chi phí ~0. Quyết định: giữ `copy`
  trước vidstabtransform (SPLIT không hơn `copy` ở endpoint nào đo
  được); KHÔNG cần ffmpeg tự build (SPLIT đạt đúng hiệu quả sha như
  bản patch mà không tốn build riêng). Crash vẫn chưa chứng minh
  được ở cả hai đường.
- **G4 — TTS 39 CVE: KHÔNG ĐỔI, lần thứ 6 liên tiếp y hệt.**
  Gradio stable mới nhất vẫn 6.31.0 (publish 2026-10-28), vẫn kẹp
  pillow<13.0. Quét toàn bộ 682 release Gradio: pre-release mới nhất
  vẫn 7.0.0.dev0 (2026-11-09T22:31:11), không dev1/rc/stable 7.x.
  pip-audit production: 39 CVE Pillow, tập ID y hệt đợt 78 F5
  (18 PYSEC + 20 CVE-2026 + 1 GHSA), 0 ID mới, 0 ID biến mất. Venv
  test đợt 78 vẫn nguyên vẹn (gradio 7.0.0-dev.0, PIL 13.0.0,
  pip-audit 0 CVE). KHÔNG bump, KHÔNG đo lại realtime (điều kiện
  nhiệm vụ chưa thỏa). CẤM kiểm lại pip-audit / check CAP / quét
  release cho tới khi upstream đổi.
- **G5 — Kernel BC sweep: KHÔNG SỬA PRODUCTION, giữ (0,25, 0,375).**
  Sweep ≥6 nội dung mới, nhiều thang: verdict upscale tam giác 32/80
  vs BC 31/80 (hòa); sharp-delta KHỚP BC 15 vs tri 12; noise G12
  KHỚP tri 14 vs BC 12; plain KHỚP tri 6 vs BC 4. Lưới (B,C) không
  có điểm nào vượt trội. Headed capture 4 run: 19/19, 19/19, 15/16
  (FAIL D1 noise640 v1 — đã sửa, xem dưới), 16/16; chụp lại noise
  v2: 4/4 mỗi run. Hai sự cố đo đã sửa: (1) noise v1 temporal chụp
  sai khung → thay bằng 1 khung tĩnh seed 79; (2) render frame 640
  sai ma trận màu (bt709 thay vì bt601) — gradient640 plain MAD
  4,815→1,242, photo640 5,579→1,011 sau sửa. `triangle-old` tái lập
  đúng từng số tri PRE-wiring của E9; E9 chạy lại JSON giống hệt
  từng số bản F6; 67u2 8/8; tsc 0; vite build pass. Step-4 vs
  full-pixel đồng ý 43/44; cổng G12 step-4 vs full-pixel 22/22.
- **G6 — Sweep G1/G2: G1/G2 vẫn chưa phân biệt được; G12 vẫn an toàn.**
  20 case mới: bất đồng cổng 16/20 (toàn Q3), 0 phân biệt được ở mức
  verdict. Case sai duy nhất w2048-testpattern-n10 — cả 4 luật cùng
  sai. ĐÍNH CHÍNH: case phân biệt duy nhất của F7 (w2880-n05) KHÔNG
  còn đứng dưới harness hiện tại (tính lại: noD0 0,12 / fullD0 0,14,
  cả hai KHỚP — do F6 nối kernel BC upscale sau eval F7). Điểm gộp
  cũ tiền-BC (G2 44/44) hết hiệu lực. Điểm gộp harness-hiện-tại
  (73 case): R0 60/67, G1 = G2 = G12 = 66/67, bất đồng cổng 24/73,
  phân biệt verdict 0. Test mới 8/8; hồi quy E6 7/7, F7 7/7,
  chrome-resample-67u2 8/8; tsc 0; vite build pass.
- **G7 — MediaPipe + u2netp: KHÔNG tích hợp cả hai.**
  MediaPipe trên toàn bộ bộ clip chuẩn E4: 1/5 đạt (A@480 0,819,
  A@640 0,8187, B 0,4452, C 0,0425, D 0,9777). B hallucinate 2,2% fg
  trên ảnh không người; C chỉ lấy tay (MAD 0,3548). Tốc độ 13,26 fps
  lúc lặng, RSS 0,202 GiB. u2netp thêm 3 clip G/H/I: G 0,6681 (rớt),
  H 0,9414 (đạt), I 0,9852 (đạt); tổng 9 clip 4/9 đạt (B, D, H, I);
  ~1,9–2,3× u2net, RSS 0,73–0,74 GiB. Discriminator: KHÔNG đặc
  trưng nào trong 7 đặc trưng tách được nhóm đạt/rớt (cặp F-vs-I
  giống hệt mọi đặc trưng mà IoU 0,58 vs 0,99). Quyết định: KHÔNG mở
  opt-in u2netp (lần 2), KHÔNG mở fast-preview MediaPipe. Giữ u2net.
  `bgremove.py` không đổi (md5 khớp F9). Kiểm chứng:
  test_bgremove_fallback.py 7 pass, test_bgremove_smooth.py 4/4.
- **G8 — GPU thật / Safari thật: chỉ đo, không sửa production.**
  Không có GPU thật — xác nhận lần 4 (không /dev/dri, VAAPI/NVENC
  0 frame lỗi -22, Chromium WebGL = SwiftShader). MỚI (W4): nhãn
  WebGL "Apple GPU" trên WebKitGTK là GIẢ (VM Linux không GPU; shader
  chạy đồng bộ bằng CPU: 640×360×30 vòng median 91 ms;
  1280×720×100 vòng median 1.394 ms). MỚI (W3): WebKitGTK phát video
  không-loop tốt (6 s realtime, ended đúng, 0/179 frame drop) nhưng
  phát LOOP kẹt sau đúng 1 vòng (clip 2 s: kẹt ở currentTime 0,
  paused false, readyState 4, totalVideoFrames 60). Chromium loop
  bình thường. Hướng khắc phục chưa kiểm chứng: `ended → seek(0)`
  thay cho `loop`. Canvas 2D WebKitGTK chậm hơn Chromium ~5–6× do
  chi phí vẽ (rAF trống cả hai ~29 fps; rAF + vẽ 1280×720: Chromium
  21,5–30,5 fps, WebKit 4,7–7,9 fps). MediaRecorder vẫn vắng trên
  WebKitGTK (lần 3). Phát lại 5 codec lần 3: WebKit 5/5, Chromium
  4/5 (HEVC fail). WebGPU: Chromium có API nhưng requestAdapter trả
  null cả 3 mức; WebKit navigator.gpu undefined. Playwright
  1.65.0 là mới nhất → webkit-2388 (WebKit 27.2) đã là bản đang đo.
  Safari thật vẫn chưa đo (không có máy macOS/iOS). Đính chính
  phương pháp: probe phải chạy trên http secure context (about:blank
  cho kết quả sai); guard timeout cho vòng rVFC; cấm trích
  gl.finish() timing làm số tốc độ.
- **G9 — Onboarding modals + i18n: Escape/class ĐÃ ĐÓNG từ trước, i18n
  +6 key mới.** (a) Escape 3/3 modal + (b) class modal: ĐÃ ĐÓNG từ
  đợt 59 P2/P4 + 60 Q10, kiểm chứng lại đợt 75 C9 — G9 KHÔNG sửa
  code modal nào, chạy lại suite tĩnh: escapeModals59P2 26/26,
  escapeForms60Q10 15/15, welcomeEscape58O1 9/9, modalClasses59P4
  33/33, cssClasses60Q2 59/59, cssClasses61R4 60/60, modalCard58O4
  24/24, silenceModal57N1 11/11, captionModal60Q3 23/0. (c) i18n —
  phần CÒN THẬT sau quét AST toàn src: 6 key mới (5
  openProject.archiveHistory* + 1 captions.trackLabel), dict 2419 →
  2425. Test mới i18nModals79G9.test.ts 9/9 (động 2 locale + gọi
  store thật). Kiểm chứng gộp: r6-i18n-check PASS, i18nOrphans
  16/16, P7 8/8, tsc 0, vite build pass.

## 2. Kiểm chứng parent (cây đã gộp, đợt 80 chưa bắt đầu)

- tsc web 0, desktop 0; vite build pass (6,05 s); r6-i18n-check PASS.
- css60 59/59, css61 60/60, i18nOrphans 16/16, P7 8/8, i18nModals79G9
  9/9 — chạy bằng esbuild bundle từ gốc repo (mẫu P4/P7; vitest trực
  tiếp FAIL giả vì các test này đọc đường dẫn tương đối từ gốc repo
  và dùng top-level await — G9 test cần --format=esm).
- G6 test_round79_g6_g1g2.mjs: pass 8, fail 0.
- G2: analyzer chạy lại không lỗi; 10/10 session JSON tồn tại trên
  đĩa (không chạy lại 10 phiên headed — tốn ~1h, tin LIMITS G2).
- Không chạy lại: G1/G3/G4/G5/G7/G8 (tin LIMITS từng luồng; G1/G5/G9
  đã build pass riêng).
- Dict: 2425 key lá vi==en (khóa bởi test G9 + codecProbeUi75C6).
- Không xung đột file chung giữa 9 batch (0 file trùng); 53 entry
  đợt 79 đều tồn tại trên đĩa và là text.

## 3. Batch đã stage (KHÔNG push)

9 file — 53 entry, 53 file duy nhất (không trùng trong đợt):
G1 4, G2 1, G3 2, G4 1, G5 6, G6 8, G7 4, G8 6, G9 21. Cộng closing
batch này: 2 entry (LIMITS gộp + gap analysis).

**Tổng chờ push sau đợt 79: 683 entry / 127 file batch / 437 file duy
nhất** (đợt 67–79; sau đợt 78 là 628/117/403; đợt 79: +53 entry /
+9 batch / +33 unique; closing +2 entry / +1 batch / +1 unique —
gap analysis đã có trong set từ closing đợt 78).
HEAD vẫn 5f548ef8. KHÔNG push.

## 4. Nợ mở cho đợt 80

1. **G1 (deint FPS đã đóng):** G8 1,5817 (cũ 1,4826, +0,099) chưa tách
   nguyên nhân lệch. Gap-mean metric phụ mâu thuẫn (0,71× trong 1 lần
   đo) — đừng trích "nhanh hơn 12%".
2. **Gate:** n giết thật còn nhỏ (2); cần thêm phiên FN có slot1 FN,
   đặc biệt slot1 trong khoảng 1,5–2,5 fps, để kiểm chứng độ sắc
   ngưỡng FN 2 fps. Đối chứng A/B luật cũ (confirm=0) + burner vẫn
   chưa chạy live lần nào (nợ F2 §8).
3. **Vidstab crash:** crash vẫn chưa chứng minh được ở cả hai đường
   (F3+G3 gộp 0/30 vs E3-F 7/10). Setup tái hiện mạnh hơn đề xuất:
   (1) `taskset` pin ffmpeg+hog trên 2 core mô phỏng VM 2 vCPU cũ;
   (2) máy 2 vCPU thật; (3) đo "suýt crash" bằng instrumentation
   thay vì chờ crash. SPLIT và NEEDS_WRITABLE đều đạt hiệu quả sha
   như nhau — không cần ffmpeg tự build.
4. **TTS 39 CVE production VẪN MỞ** — chờ Gradio 7.0 stable (hoặc
   6.32.0 backport cap). CẤM kiểm lại pip-audit / check CAP / quét
   release cho tới khi upstream đổi.
5. **Kernel BC:** probe xung vuông upscale (nợ F6 §7.3); noise LỆCH
   ở project 640 (G std 0,81–0,91, hiệu ứng chroma); lineart 1px
   LỆCH mọi thang (aliasing); D3 có thể PASS giả khi duration NaN
   (đề xuất fail rõ thay vì fallback els[0]); chỉ đo frame 30,
   1 capture/biến thể.
6. **G1/G2:** săn Q4 (phân biệt G2 vs G12) vẫn cần nội dung mới có
   d0std_R trong (1,17; 3,27] — khoảng trống giữa test-pattern và
   ocean. Kênh G test-pattern (~4,4) và phần dư slovenska post-fix
   vẫn chưa rõ nguồn. Ngưỡng Δkurt 0,35 nhạy ±0,01.
7. **WebKitGTK loop (W3):** thử workaround `ended → seek(0)` cho
   loop; kiểm tra W3 có tái hiện trên Safari thật không. W4: không
   trích chuỗi renderer WebGL làm bằng chứng GPU. Đo chi phí WebGL
   thật của Chromium bằng EXT_disjoint_timer_query hoặc FPS workload.
   Safari thật + GPU thật vẫn chưa đo (cần máy thật).
8. **u2netp/MediaPipe ĐÃ ĐÓNG (lần 2):** giữ u2net; không mở lại
   opt-in u2netp hay fast-preview MediaPipe trừ khi có discriminator
   hoặc clip mới chứng minh được. Birefnet vẫn ĐÓNG (chờ RAM ≥ 12 GB).
9. **ci-security 403** (repo vẫn không có CI chạy thật) — workflow
   files vẫn local-only, loại khỏi mọi lần push.
10. **Onboarding modals:** Escape/class đã đóng; i18n modals còn
    phần fallback chết / dữ liệu nội dung / chẩn đoán chưa wire
    (xem LIMITS G9 §5, nợ N2).
