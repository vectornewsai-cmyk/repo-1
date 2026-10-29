# Phase 9 đợt 19, luồng G4 — LIMITS: quét crf dissolve e2e + FPS preview editor thật

> Luồng G4 đợt 19. Repo làm việc: `~/workspace/repo-1`, KHÔNG push
> GitHub, KHÔNG release/tag, KHÔNG code giả. Chỉ ĐO — không sửa code
> sản phẩm, không sửa harness V11/V12/V14 của luồng khác, không sửa
> file i18n. Script đo mới + file này là toàn bộ phần việc của luồng.
> FFmpeg đo: 8.1.2, libx264. Chromium đo: Playwright 156.0.8078.4
> headed dưới Xvfb 1920x1080x24, điều khiển qua
> `--remote-debugging-pipe` (hướng đợt 18).

## 0. Kết luận ngắn (không vượt số đo)

**Quét crf — câu hỏi mở đợt 18 đã có đáp án bằng số:**

- Dissolve e2e lên KHỚP ở miền YUV được, nhưng phải hạ crf xuống
  ≤ 12: crf12 cho MAD-YUV 1,4079 (KHỚP theo thang V6-tham-chiếu),
  crf0 cho đúng 0,0000. Ở crf18, KHÔNG preset nào lên KHỚP
  (medium 2,8985 / ultrafast 2,3776 / veryfast 3,7665 / slow 2,9081 —
  tất cả XẤP XỈ). Vậy ở crf18, giới hạn là do lượng tử hoá, không
  phải do preset; muốn KHỚP thì đổi crf, không phải đổi preset.
- Ở miền RGB, dissolve e2e KHÔNG BAO GIỜ lên KHỚP với yuv420p bất
  kể crf/preset: ngay cả crf0 vẫn LỆCH 57,7793 — sàn subsample
  4:2:0 (đợt 18 đã tách: 57,78/58,21 ≈ 99,3%). Đây mới là giới hạn
  cấu trúc thật, và nó chỉ nằm ở miền RGB, không nằm ở miền YUV.
- Circleopen làm đối chứng: miền YUV KHỚP ở mọi crf 0–23
  (0,0000 / 0,2670 / 0,4291 / 0,6465); miền RGB KHỚP ở crf0/12,
  XẤP XỈ ở crf18/23.

**FPS preview editor thật — lần đầu đo được trên project/timeline
thật (không phải trang tối giản tiêm canvas):**

- Khi máy tương đối rảnh: preview project mẫu chạy **~11–15 fps**
  (3 kênh độc lập: đồng hồ PerfOverlay của app ~11, đếm draw thật
  ~14, vòng rAF riêng của trang ~15 Hz), trên canvas 1351×512,
  dpr = 1, không WebGL. Xa mức 30 fps của project và xa mức khóa
  60 Hz — vòng lặp preview chỉ hoàn thành ~14 draw/giây, tức mỗi
  tick tốn ~65 ms trên VM này.
- Khi các luồng đợt 19 khác chạy ffmpeg/test song song làm bão hoà
  2 vCPU: cùng phép đo tụt xuống **~4–6 fps**. Hai nhóm số KHÔNG
  được gộp trung bình — tải máy là biến số, xem §4.
- Đối chứng trang trần cùng điều kiện: rAF 57,36 Hz — môi trường
  (Xvfb/Chrome/pipe) KHÔNG phải thủ phạm; trang editor nặng mới là
  thủ phạm. Số này vẫn KHÔNG phải FPS trên GPU/màn hình thật của
  user (Xvfb, raster phần mềm, dpr = 1).

## 1. Quét crf dissolve e2e — phương pháp

Giữ nguyên phương pháp đợt 18 (không đổi ngưỡng, không đổi logic
sản phẩm để vừa số): cặp file repo
`server/render/examples/media/clip1.mp4` / `clip2.mp4` (test pattern
tổng hợp — smptebars/testsrc2 + drawtext — KHÔNG phải footage thật),
khung 1280×720, xfade duration = 1 offset = 1, frame giữa n = 45
@30fps, p = 0,5. Preview RGB tính bằng module thật của app
(transitionPreview + dissolveFrand, transpile qua tsc) như script v18.

Encode e2e mỗi ô: `[0:v]format=rgb24[a];[1:v]format=rgb24[b];
[a][b]xfade:duration=1:offset=1,format=yuv420p`, libx264, preset ghi
rõ, pix_fmt yuv420p, 2 giây @30fps. Mỗi ô đo 2 miền:

- (i) decode frame 45 ra rgb24, so MAD RGB với preview (thang V6
  thật: KHỚP = MAD ≤ 2 và ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥ 90% ≤ 8);
- (ii) decode frame 45 ra yuv420p raw, so MAD miền YUV với pipe
  render S1 chuyển sang yuv420p bằng FFmpeg (kiểu S5b đợt 18 —
  KHÔNG dùng hàm JS `rgbToYuv420` cho dissolve vì bộ lọc chroma của
  nó khác swscale; xem §4 tài liệu đợt 18). Phân loại YUV in kèm
  chỉ là V6-tham-chiếu, không phải chuẩn badge mới.

Quét crf: 0, 12, 18, 23 ở preset medium (mặc định libx264, ghi rõ).
Quét preset (chỉ dissolve, crf18): ultrafast, veryfast, slow —
medium lấy lại từ quét crf, không encode lại.

Script: `benchmarks/measure_v19_crf_sweep.cjs`, chạy 113 giây,
exit 0. Chạy từ gốc repo:

```
node benchmarks/measure_v19_crf_sweep.cjs
```

## 2. Quét crf — bảng số đầy đủ

S1 (a) rgb24-ép-trước tái tạo đúng đợt 18: dissolve 0,0057 KHỚP,
circleopen 0,3820 KHỚP. Ô crf18/medium tái tạo đúng số đợt 18 tới
4 chữ số thập phân ở cả 2 type (script tự kiểm tra, in OK).

### Dissolve

| Ô encode (libx264) | Kích thước file 2s | MAD RGB (vs preview) | MAD miền YUV (Y / U / V; ≤8) |
|---|---|---|---|
| crf0 / medium | 10 297 610 B | 57,7793 / 24,93% LỆCH | **0,0000** (0 / 0 / 0; 100,00%) V6-tham-chiếu KHỚP |
| crf12 / medium | 10 093 566 B | 57,8721 / 25,02% LỆCH | **1,4079** (1,4652 / 1,2487 / 1,3380; 99,95%) KHỚP |
| crf18 / medium | 6 859 570 B | 58,2054 / 25,06% LỆCH | 2,8985 (2,9825 / 2,6657 / 2,7956; 96,72%) XẤP XỈ |
| crf23 / medium | 4 556 755 B | 58,9549 / 25,09% LỆCH | 5,2106 (5,4901 / 4,6422 / 4,6613; 80,67%) LỆCH |
| crf18 / ultrafast | 10 023 402 B | 58,1194 / 24,87% LỆCH | 2,3776 (2,3459 / 2,4403 / 2,4414; 97,72%) XẤP XỈ |
| crf18 / veryfast | 6 680 986 B | 58,6379 / 24,80% LỆCH | 3,7665 (3,6756 / 3,9668 / 3,9295; 90,98%) XẤP XỈ |
| crf18 / slow | 6 793 543 B | 58,2100 / 25,10% LỆCH | 2,9081 (2,9938 / 2,6743 / 2,7994; 96,68%) XẤP XỈ |

### Circleopen (đối chứng)

| Ô encode (libx264) | Kích thước file 2s | MAD RGB (vs preview) | MAD miền YUV (Y / U / V; ≤8) |
|---|---|---|---|
| crf0 / medium | 2 369 498 B | 1,4866 / 99,60% KHỚP | 0,0000 (0 / 0 / 0; 100,00%) KHỚP |
| crf12 / medium | 702 158 B | 1,5462 / 99,26% KHỚP | 0,2670 (0,2371 / 0,3276 / 0,3260; 100,00%) KHỚP |
| crf18 / medium | 411 148 B | 1,6648 / 98,59% XẤP XỈ | 0,4291 (0,3870 / 0,4991 / 0,5278; 99,90%) KHỚP |
| crf23 / medium | 256 030 B | 1,9456 / 97,28% XẤP XỈ | 0,6465 (0,6059 / 0,7047 / 0,7510; 99,34%) KHỚP |

### Đọc số — kết luận nào được phép, kết luận nào không

1. **Miền YUV, dissolve: ngưỡng KHỚP nằm giữa crf12 và crf18.**
   crf12 = 1,4079 đã KHỚP (cách ngưỡng 2 một khoảng rõ, 99,95%
   ≤ 8); crf18 = 2,8985 đã vượt ngưỡng. Không đo crf13–17 nên
   KHÔNG claim ngưỡng chính xác nằm ở crf nào trong khoảng đó —
   chỉ claim được "≤ 12 thì KHỚP, 18 thì không".
2. **Ở crf18, preset không cứu được KHỚP.** Preset tốt nhất đo
   được (ultrafast 2,3776) vẫn XẤP XỈ, dù file to hơn medium
   (10,02 MB so với 6,86 MB). Veryfast còn tệ hơn medium (3,7665).
   Hướng "đổi preset" cho câu hỏi mở đợt 18: đã đo, đáp án là
   không lên KHỚP.
3. **Miền RGB, dissolve: giới hạn cấu trúc đã khóa.** MAD RGB
   gần như không đổi theo crf (57,78 → 58,95 từ crf0 đến crf23):
   lượng tử hoá chỉ đóng góp ~0,4–1,2 trên nền subsample 57,78.
   Bất kỳ claim "dissolve e2e KHỚP ở miền RGB với yuv420p" nào
   cũng sai với nội dung frand-switch này, ở mọi crf/preset đã đo.
4. **Số YUV-domain ở crf0 (nợ đợt 18): nay đã đo — đúng 0,0000**
   ở cả 2 type, đúng kỳ vọng lý thuyết (crf0 giữ nguyên mẫu
   yuv420p đã subsample nên decode YUV trùng hệt pipe render
   chuyển qua FFmpeg). Đây là bằng chứng khóa chặt rằng toàn bộ
   MAD-YUV ở crf > 0 là lượng tử hoá, không phải sai số phương
   pháp đo.
5. **Chi phí của KHỚP:** file dissolve 2s ở crf12 (10,09 MB) gần
   bằng crf0 (10,30 MB) và lớn hơn crf18 tới ~47% — nội dung
   frand-switch gần như không nén được, hạ crf mua KHỚP bằng
   dung lượng chứ không rẻ. Con số này chỉ đúng cho test pattern
   này, không suy ra footage thật.
6. **Không suy ra ngoài phạm vi đo:** chỉ 2 type, 1 cặp test
   pattern, 720p, 2 giây, libx264. Không claim cho footage thật,
   1080p/4K, codec khác (x265/VP9/AV1), hay crf13–17 chưa đo.

## 3. FPS preview editor thật — phương pháp (3 kênh + 1 đối chứng)

Đối tượng: build thật `apps/web/dist` chạy bằng `vite preview`
(dist được 1 luồng đợt 19 khác build lại lúc 02:28–02:33 +07 ngày
29/10 trong lúc luồng này đang đo — xem §5; trang đã load giữ
nguyên bundle cũ nên số đo vẫn nhất quán trong từng run).
Project mẫu tự load khi mở app lần đầu (App.tsx: chưa có autosave
thì loadSample — 2 clip webm 640×360 tự ghi bằng MediaRecorder,
mỗi clip 4 s, + 1 clip chữ, meta project 1280×720@30fps, tổng 8 s).
Đây là project/timeline thật, phát bằng vòng lặp preview thật
(preview.tsx: rAF loop + renderFrame khi playing) — khác hẳn vòng
vitePreview tiêm canvas phủ của đợt 18 (đã bị cấm trích vì nhiễu
composite).

Điều khiển bằng đường người dùng thật: click nút "📈 FPS" của app
(chuột CDP) rồi phím Space (Input.dispatchKeyEvent → App keydown
→ togglePlay); fallback nút play TopBar (không cần dùng tới trong
các run thành công — Space phát được ngay, panel xác nhận
"▶ Đang phát").

3 kênh đo độc lập trong cùng 1 run:

1. **PerfOverlay của chính app** (components/PerfOverlay.tsx):
   đồng hồ rAF của app, chốt cửa sổ 1 s. Đọc text panel mỗi mẫu
   trong khi phát; báo chuỗi 1 s + mean/median/min/max. Giới hạn
   ghi trong file gốc vẫn giữ: đây là rAF của app, KHÔNG phải probe
   trực tiếp draw call, KHÔNG tách được decode video khỏi vẽ canvas.
2. **Probe đếm draw thật** (chỉ wrap runtime, không sửa code sản
   phẩm): renderFrame gọi `ctx.setTransform(1,0,0,1,0,0)` đúng 2
   lần/frame (đầu + cuối hàm, preview.tsx ~1262 và ~1305) trên ctx
   của canvas trong `#vcut-preview-wrap` → draws = số lần identity
   / 2. Đối chứng khi đứng yên: renderFrame KHÔNG chạy nên draws
   phải = 0 — cả 3 run đều ra 0, probe đạt đối chứng.
3. **Vòng rAF riêng của trang**: 1 vòng rAF nhẹ do script cài thêm,
   đếm callback — để tách "rAF trang bị đói" khỏi "đồng hồ
   PerfOverlay sai".
4. **Đối chứng trang trần**: trước các run editor, đếm rAF của
   trang about:blank trong 5 s, cùng binary/display/tải máy kề nhau.

Bằng chứng phát thật mỗi run: pixel canvas đổi ở mọi mẫu
(hash toàn canvas theo stride 16 px), đồng hồ playhead trên TopBar
đổi ở mọi mẫu, panel ở trạng thái "Đang phát". Mỗi run phát 16
giây-phát (2 lượt phát 8 s, Space lại ở giữa).

Script: `apps/web/scripts/measure-v19-real-project-fps-pipe.mjs`
(+ script chẩn đoán `apps/web/scripts/measure-v19-fps-debug.mjs`,
xem §5). Chạy từ gốc repo:

```
V19_FPS_RUNS=3 node apps/web/scripts/measure-v19-real-project-fps-pipe.mjs
```

Mỗi run là 1 tiến trình Chrome mới, profile mới; script tự dọn
Xvfb/vite/Chrome khi xong (kể cả khi exit 2 — bug mồ côi tiến
trình của bản đầu đã sửa, xem §5). Cổng/display mặc định của
script này (vite 4179, Xvfb :98/:97) khác script đợt 18 (4173/:99)
để không tranh chấp với luồng khác.

## 4. FPS preview editor thật — bảng số

Điều kiện chung mọi run thành công: Chromium 156 headed, Xvfb
1920x1080x24, cửa sổ 1920x1080, probe WebGL = `no-webgl` (như đợt
18 — backend raster không xác định được, KHÔNG claim SwiftShader),
canvas preview 1351×512 device px (wrap 1351×512, dpr = 1), project
mẫu load sau ~8,1 s (đúng thời gian ghi 2 clip webm 4 s → suy luận
là video thật, không phải fallback ảnh tĩnh; MediaRecorder +
vp9/vp8 + captureStream đều khả dụng trong trình duyệt đo).

### Nhóm A — máy tương đối rảnh (số dùng được để mô tả preview)

| Run | Tải máy lúc bắt đầu → kết thúc (loadavg 1 phút) | PerfOverlay, chuỗi 1 s | Panel mean / median / min–max | Đếm draw thật | Vòng rAF riêng |
|---|---|---|---|---|---|
| A1 | 3,51 → 2,93 (đang hạ; trung bình 15 phút 0,57 → 0,62) | 11,1 / 11,9 / 12 / 10,1 / 13 / 11,9 / 12 / 12 / 11 / 11 / 10,9 / 10,1 / 12 / 13 / 13 / 11 | 11,63 / 11,9 / 10,1–13 | 13,87 draws/s | 15,27 Hz |
| A2 | 2,93 → 2,83 | 13 / 12 / 10 / 11,9 / 9,1 / 13 / 11 / 10 / 12 / 11 / 12 / 11 / 11 / 11 / 11,9 / 12,1 | 11,38 / 11,9 / 9,1–13 | 14,47 draws/s | 15,07 Hz |
| A3 | 2,83 → 2,19 | 13 / 10,9 / 11,1 / 12 / 11 / 11,8 / 11,2 / 8,6 / 11,5 / 9 / 9 / 11 / 6 / 10 / 12 / 11 | 10,57 / 11 / 6–13 | 13,33 draws/s | 14,00 Hz |

Đọc nhóm A: 3 kênh hội tụ — panel ~11, draw ~14, rAF riêng
~15. Chênh lệch nhỏ giữa các kênh là kỳ vọng được: panel đếm
vòng rAF của chính nó (cạnh tranh main thread với vòng preview +
vòng meter nên hụt tick), vòng rAF riêng nhẹ hơn nên cao hơn
một chút, đếm draw là số frame vẽ thật. Con số trung thực để
trích: **preview project mẫu ~11–15 fps trên VM này**. Vòng lặp
preview chỉ hoàn thành ~14 draw/giây, tức mỗi tick tốn ~65 ms
(đồng bộ media + renderFrame + React cập nhật playhead) — đây
là chi phí tick, không phải khóa nhịp hiển thị: đối chứng trang
trần cùng điều kiện đạt 57,36 Hz (287 callback / 5004 ms).

Đối chứng đứng yên (panel mở, chưa phát, 3 s): draws = 0 ở cả 3
run (đúng — renderFrame không chạy khi pause); panel báo vòng
rAF idle ~11–12 Hz (1 s gần nhất 12,0 / 12,0 / 8,0; tổng frame
48/4 s, 47/4 s, 42/4 s). Tức ngay cả khi đứng yên, các vòng rAF
của trang cũng chỉ tick ~11–12 Hz, thấp xa mức 57 Hz của trang
trần — cơ chế gây nặng khi idle chưa truy nguyên (ngoài phạm vi
đo của luồng này, xem §6), chỉ ghi nhận là số đo.

### Nhóm B — máy bị bão hoà bởi luồng khác (chỉ để thấy độ nhạy tải)

| Run | Điều kiện tải | Panel mean / median / min–max | Vòng rAF riêng | Ghi chú |
|---|---|---|---|---|
| B1 | loadavg 1 phút 1,58 → 4,47 trong run (luồng khác bắt đầu chạy ffmpeg giữa run) | 3,75 / 4 / 2–7 | — (chưa có kênh này) | Probe draw bản đầu bị bug nên số draw hủy (xem §5) |
| B2 | loadavg 1 phút 4,47 → 3,82 | 6,12 / 6 / 4–8 | — | Như trên |
| B3 | loadavg 1 phút 3,83 → 3,77 | 6,37 / 7 / 4–7,8 | — | Như trên |
| Debug | loadavg 1 phút 5,38 cuối phiên (ffmpeg luồng khác) | panel ~3,3 trung bình | ~3,2 Hz | Chẩn đoán, không phải run benchmark |

Đọc nhóm B: cùng phép đo, cùng trang, chỉ khác tải máy nền —
preview tụt từ ~11–15 fps xuống ~4–6 fps. Hai nhóm KHÔNG được
gộp trung bình và KHÔNG được chọn nhóm đẹp để báo. Kết luận vững
duy nhất về tải: FPS preview editor trên VM 2 vCPU này nhạy mạnh
với tải nền; số tuyệt đối chỉ có nghĩa kèm tải máy lúc đo.

### Cấm trích (nhắc lại từ đợt 18 + bổ sung đợt 19)

- Cấm trích "editor 11 fps" từ vòng vitePreview tiêm canvas của
  đợt 18 — đó là nhiễu composite, không phải số này. Số đợt 19
  là preview project thật, phương pháp khác, không liên quan.
- Cấm trích số nhóm B (~4–6 fps) mà không ghi "khi máy bão hoà".
- Cấm trích số nhóm A thành FPS trên máy user: đây là VM 2 vCPU,
  raster phần mềm, Xvfb, dpr = 1, canvas 1351×512 (frame fit trong
  wrap, không phải fullscreen 1080p), project mẫu nhẹ (2 clip
  640×360 tự sinh + 1 chữ) — không phải timeline nặng của user,
  không phải footage thật, không có GPU thật.

## 5. Sự cố đo trong đợt này — khai trung thực (không giấu)

1. **Bug probe identity của chính luồng này (đã sửa, số cũ hủy).**
   Bản đầu của probe đếm `setTransform` với điều kiện identity
   sai: `d === 0` trong khi ma trận identity là (1,0,0,1,0,0)
   (d = 1). Hệ quả: counter identity luôn 0 trong toàn bộ nhóm B
   dù pixel vẫn đổi — số draw của nhóm B bị hủy, không dùng.
   Bản debug đã bắt quả tang bug này bằng kiểm chứng gọi tay
   (gọi `setTransform(1,0,0,1,0,0)` sau khi wrap mà counter vẫn
   0). Đã sửa thành `d === 1`, chạy lại toàn bộ nhóm A với probe
   đúng + đối chứng đứng yên = 0. File debug cũng đã sửa cùng
   điều kiện để không ai copy lại bug.
2. **Tín hiệu sẵn sàng sai ở bản đầu (đã sửa).** Bản đầu chờ
   `document.querySelectorAll('video')` có phần tử readyState ≥ 2
   — nhưng video/audio element của MediaPool là DETACHED
   (`media.ts`: `document.createElement`, không append vào DOM)
   nên query này luôn rỗng và 3 run đầu đều timeout 90 s vô ích.
   Đã đổi sang tín hiệu đúng: canvas trong `#vcut-preview-wrap` +
   input tên project trên TopBar = "Dự án mẫu". Phát hiện phụ này
   cũng khiến bằng chứng phát phải đổi: không dùng
   `video.currentTime` (không đọc được từ DOM), mà dùng đồng hồ
   TopBar + hash pixel canvas.
3. **Định dạng đồng hồ TopBar (đã sửa).** `fmtTime` (lib.ts) ra
   "MM:SS.d" (ví dụ "00:00.0 / 00:08.0"), không phải "MM:SS" —
   regex bản đầu không khớp nên timeText luôn null. Đã sửa regex
   chấp nhận phần thập phân; nhóm A đọc được đồng hồ đổi 13/13
   mẫu.
4. **Vùng hash pixel bản đầu yếu (đã sửa).** Vùng giữa canvas
   32×32 chứa chữ tĩnh "CLIP MẪU" nên hash hay lặp dù frame vẫn
   đổi (bản debug thấy hash lặp 83968 ở nhiều mẫu liên tiếp).
   Đã đổi sang hash toàn canvas theo stride 16 px; nhóm A đổi
   13/13 mẫu.
5. **Mồ côi tiến trình ở bản đầu (đã sửa).** `process.exit(2)`
   nằm trong `try` nên bỏ qua `finally`, để lại vite preview +
   Xvfb giữ cổng/display sau khi script thoát. Đã chuyển exit
   ra sau `finally`; kiểm chứng sau nhóm A: không còn tiến trình
   vite/Xvfb nào sống sót. (Lần mồ côi đó đã dọn tay bằng kill.)
6. **Dist bị build lại giữa chừng bởi luồng khác (ghi nhận, không
   sửa).** Trong lúc nhóm đo đầu chạy, 1 luồng đợt 19 khác chạy
   `tsc --noEmit` + `vite build`, dist đổi từ bundle
   `index-CFV44ob9.js` (build 28/10) sang `index-BQwvL1tV.js`
   (build 02:33 +07 29/10). Các run trong cùng 1 lần gọi script
   dùng chung vite preview đã khởi động từ đầu nên bundle trong
   trang không đổi giữa chừng; nhưng số FPS nhóm A đo trên bundle
   mới (build 29/10 từ source hiện tại), không phải bundle 28/10.
   Ghi rõ để đối chiếu: `preview.tsx` không đổi từ 27/10 nên logic
   preview đo được là logic đã đọc trong tài liệu này.
7. **Meta-chromium 152 qua pipe vẫn không navigate được**
   (chrome-error://chromewebdata) — giống blocker LNA của đợt 17;
   mọi số FPS đều từ Playwright Chromium 156. Script đã rút ngắn
   vòng chờ navigate khi gặp chrome-error để không tốn 30 s/run.

## 6. Nợ còn lại / câu hỏi mở (trung thực)

- Ngưỡng crf KHỚP chính xác cho dissolve miền YUV nằm trong
  khoảng (12, 18) — chưa đo crf13–17, không đoán.
- Vì sao 1 tick preview tốn ~65 ms và vì sao vòng rAF idle cũng
  chỉ ~11–12 Hz: chưa profiling (long-task / Chrome tracing) —
  ngoài phạm vi đo của luồng này. Đây là câu hỏi hiệu năng quan
  trọng nhất mà số đo đợt này mở ra, không phải kết luận đã có.
- Chưa đo trên GPU thật, màn hình thật, dpr > 1, fullscreen
  1080p, timeline nặng, footage thật, hay project của user.
- Chưa đo preset khác ở crf12 (chỉ quét preset ở crf18) và chưa
  đo codec khác ngoài libx264.
- Probe draw đếm qua identity-setTransform: đã đối chứng đứng
  yên = 0 và khớp panel/rAF riêng trong nhóm A, nhưng nếu
  renderFrame tương lai đổi số lần gọi identity thì probe phải
  hiệu chuẩn lại — probe gắn với code hiện tại, không phải chân
  lý vĩnh viễn.

## 7. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `benchmarks/measure_v19_crf_sweep.cjs` (MỚI — quét crf 0/12/18/23
  + preset ultrafast/veryfast/slow ở crf18, dissolve + circleopen,
  miền RGB + miền YUV, tự kiểm tra tái tạo số đợt 18; 113 s).
- `apps/web/scripts/measure-v19-real-project-fps-pipe.mjs` (MỚI —
  FPS preview project thật qua pipe: baseline trang trần + 3 kênh
  PerfOverlay/probe-draw/rAF-riêng, tự dọn tiến trình).
- `apps/web/scripts/measure-v19-fps-debug.mjs` (MỚI — script chẩn
  đoán 1 lần cho 2 điều lạ của bản đo đầu; đã sửa cùng bug
  identity, giữ lại làm tài liệu chẩn đoán).
- `docs/PHASE9_ROUND19_G4_CRF_FPS_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa code sản phẩm
  web/render/store/spec, không sửa harness V11/V12/V14, không sửa
  file i18n, không sửa script đợt 18.

## 8. Kiểm chứng đã chạy

- `node --check` cho cả 3 script mới: pass.
- `node benchmarks/measure_v19_crf_sweep.cjs` (từ gốc repo):
  exit 0, 113 s, tái tạo crf18/medium đợt 18 lệch 0,0000 cả 2 miền
  cả 2 type; thư mục /tmp của script tự xoá khi xong.
- `node apps/web/scripts/measure-v19-real-project-fps-pipe.mjs`
  bản cuối (V19_FPS_RUNS=3): exit 0, okRuns 3/3, baseline trang
  trần 57,36 Hz; sau khi xong không còn vite/Xvfb/Chrome nào
  sống sót; dist mtime không đổi trong lúc chạy nhóm A.
- `node apps/web/scripts/measure-v19-fps-debug.mjs`: exit 0,
  chẩn đoán xong (chỉ ra bug identity + rAF trang ~3 Hz lúc tải
  cao); không dùng số của nó làm benchmark.
- KHÔNG chạy tsc/vite build cho luồng này: luồng không sửa code
  TS nguồn web hay code sản phẩm nào (chỉ thêm script đo JS/MJS
  + docs) — không có gì để tsc/build kiểm chứng thêm; không mạo
  nhận. (Dist dùng để đo do luồng khác build.)
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage (parent
  sẽ stage).
