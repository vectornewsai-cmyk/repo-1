# LIMITS — Phase 9 đợt 86, luồng N1: WebKit clip D kẹt loop — cơ chế gốc

Ngày: 11/11/2026 (lượt cron 09:35 +07). Repo local `~/workspace/repo-1`,
HEAD `5f548ef8`. **CHỈ stage, KHÔNG push, KHÔNG release/tag, KHÔNG binary
vào batch, KHÔNG file workflow.** Không sửa file production nào (lý do:
§6 — cách sửa ứng viên đã A/B và THẤT BẠI).

## 0. Kết luận (đọc trước)

**Cơ chế gốc của kẹt D đã tách xong ở mức hành vi (behavioral root cause),
không phải ở mức code C của GStreamer — xem §1.**

1. **Kẹt D không phải do code giả, file hỏng, hay setup element.** D decode
   sạch bằng ffmpeg (96 frame, 0 lỗi). Kẹt là **race khởi động/preroll của
   pipeline GStreamer với nguồn HTTP progressive trên WebKitGTK 27.2**:
   khi `play()` bắt đầu trước khi pipeline preroll/negotiate xong (mất
   hàng giây với 720p bitrate cao trên VM này), video sink đứng yên trong
   ~1 s đầu phát (ct 0,08–0,96 tùy lần chạy — KHÔNG cố định ở 0,176 như
   M4 từng nghi), `readyState` 4→3→2, event `stalled` 1 + `waiting` 2,
   `error` null, trong khi **toàn bộ file đã buffered [0,4] ngay từ mẫu
   đầu tiên (t=0,64 s)** — pháp y P9 chứng minh kẹt xảy ra dù dữ liệu đã
   đủ 100%, nên KHÔNG phải đói buffer mạng.
2. **Đã loại trừ bằng A/B có số đo (§2):** `playsInline`, listener
   `ended`, viewport, kích thước element, fps (24 vs 30), GOP (250 vs
   24), vị trí moov (cuối vs faststart), codec (H.264 vs VP9), duration
   (4 s vs 2 s), đói buffer progressive, đường sự kiện `ended`.
3. **Yếu tố phân biệt thật (§3):** độ phức tạp/bitrate + độ phân giải +
   nguồn dữ liệu. 720p CRF 28 (~1,35 Mbps) loop **5/5**; 320×180 loop
   **5/5** ở cả 24 và 30 fps; blob URL (toàn bộ file trong bộ nhớ) loop
   **5/5** với đúng file D 2,64 Mbps; chờ 8 s trước lần play đầu thì phát
   thường **3/3** tới `ended`; `canplaythrough` (bắn sau ~0,3 s) KHÔNG
   đủ — chờ nó rồi phát vẫn kẹt **0/3**. Mỗi lần restart loop mở lại
   race mới (chờ 8 s rồi loop vẫn chỉ **3/5**).
4. **Cách sửa ứng viên (watchdog seek-cứu) đã A/B và THẤT BẠI (§6) nên
   KHÔNG sửa production.** Seek +0,2 s và +0,02 s khi ct đứng yên ≥2 s
   đều cho **0/5 cả 4 lần chạy watchdog**, trong khi baseline tự nó cũng
   dao động mạnh (2/5, 5/5, 0/5, 0/5) — seek chỉ đẩy ct tiến từng bước
   nhỏ mà decoder vẫn đứng yên; P8 (seek 0,2 hồi được 1 lần) nay được
   hiểu là trùng với tự hồi ngẫu nhiên (P6 blob cũng tự hồi sau 2,01 s
   không cần seek), không phải bằng chứng cho fix.
5. **Hướng sửa còn lại (chưa làm, cho đợt sau):** (a) chờ preroll thật
   trước lần play đầu (đo tiêu chí sẵn sàng mạnh hơn `canplaythrough` —
   vd chờ `buffered` đầy + một khoảng lặng decode, hoặc thử play–pause–
   play thăm dò); (b) dùng blob URL / fetch trước cho clip loop trong
   preview khi clip nhỏ (đổi đường dữ liệu, cần cân nhắc bộ nhớ); (c)
   encode lại kho clip 720p ở CRF cao hơn (giảm bitrate) — đổi nội dung,
   không đổi code. Cả ba đều chưa có A/B trên đường phát chính của app
   nên KHÔNG tự ý làm trong luồng này.
6. **Phát hiện môi trường riêng (§7, quan trọng cho mọi luồng WebKit sau
   này):** sau mỗi reboot VM, GStreamer bundle của Playwright (sysroot
   `webkit-2388/minibrowser-gtk/sys/`) chỉ tìm được **1 plugin** (nó có
   lib nhưng KHÔNG có thư mục plugin `sys/lib/gstreamer-1.0/`) → mọi
   video làm WebProcess crash (`appsink not found`, `autoaudiosink not
   found`, NULL instance). Trước reboot, registry cache đầy đủ đã che
   lỗi này; reinstall dep làm mới mtime plugin → registry hết hạn →
   lộ lỗi. Cách khắc phục đã kiểm chứng: chạy probe với
   `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (bundled
   lib tìm đủ 270 plugin, appsink/playbin/avdec_h264/souphttpsrc/
   qtdemux đều OK; MiniBrowser chạy 30 s không crash; registry rebuild
   thành 1.428.975 byte thay vì 76 byte). **Mọi probe WebKit sau reboot
   phải export biến này trước khi chạy.**

## 1. Cơ chế (tổng hợp từ toàn bộ số đo)

- Chữ ký kẹt (mọi ca): element `!paused && !ended && !seeking`, ct đứng
  yên > 1,5 s, `readyState` tụt 4→3→2, `networkState` 2 (idle), event
  `stalled` 1 + `waiting` 2 + `suspend` 1, `canplay` + `canplaythrough`
  đều đã bắn, `error` null, `ended` 0. `totalVideoFrames` chỉ 2–7 khi
  kẹt (so với ~96 frame/vòng khi chạy tốt).
- Điểm kẹt thay đổi theo lần chạy: 0,083 / 0,18 / 0,2 / 0,25 / 0,3 /
  0,486 / 0,583 / 0,833 / 0,963 — phân bố trong ~1 s đầu, không phải
  frame hỏng cố định. M4 ghi ct 0,176–0,19 là một điểm trong phân bố này
  (P8 đợt này kẹt đúng 0,1798).
- `buffered` = [[0,4]] từ mẫu đầu tiên (P9: t=0,64 s, ct=0,001) và giữ
  nguyên suốt 12 s kẹt → dữ liệu đã có đủ trước khi phát; pipeline
  decode/sink mới là chỗ đứng, không phải đường tải.
- Xác suất kẹt theo đoạn phát (mỗi lần play/seek-restart là một lần tung
  đồng xu độc lập): baseline D 5 vòng: 0/10 (P0) / 2-3/5 (P1, P13) /
  5/5 một lần (B-rep2, load thấp) / 0/5 hai lần (B002). Tải VM lúc đo
  dao động 0,95–22 — số lần pass cao hơn khi tải thấp (B-rep2 5/5 lúc
  load ~2,9; B002 0/5 lúc load 9,04) nhưng chưa phải thí nghiệm tải có
  kiểm soát nên chỉ ghi là giả thuyết, không phải claim.
- Vì sao blob URL hết kẹt: dữ liệu có sẵn đồng bộ trong bộ nhớ, pipeline
  preroll tức thì, không còn cửa sổ race. Vì sao chờ 8 s hết kẹt ở lần
  play đầu: download + preroll hoàn tất trước khi play. Vì sao CRF 28
  hết kẹt: ít dữ liệu phải đẩy qua pipeline trong cửa sổ race đầu.
- Giới hạn của kết luận: đây là tách hành vi qua A/B đen-hộp trên
  WebKitGTK 27.2 + GStreamer 1.24.2; chưa có trace C-level (queue2 /
  decodebin / video sink) để chỉ đúng hàm/luồng gây race — cần GST_DEBUG
  hoặc build WebKit có log nếu đợt sau muốn xuống sâu hơn.

## 2. Ma trận tách yếu tố (WebKitGTK 27.2 headed, xvfb)

Probe chính: `benchmarks/render/webkit_loop_d_rootcause_86n1.mjs`
(port 8899, server HTTP có range). Clip tại `/tmp/n1/clips` (encode lại
bằng ffmpeg testsrc2, công thức mặc định libx264 như đợt 85 — KHÔNG stage
binary). Load VM lúc đo 0,95–22 (các luồng đợt 86 chạy song song).

| Ca | Setup | Kết quả D |
|---|---|---|
| P0 baseline | loop workaround 10 vòng, playsInline + listener ended | **0/10**, kẹt ct 0,3 từ t=2,81 s, 76,1 s đứng yên, totalFrames 4 |
| P10 đối chứng | như P0 trên clip A | **10/10**, resume trung vị 1125 ms (chậm do tải VM; M4 lúc tải thấp: 165 ms), totalFrames 299, dropped 24 |
| P1 | loop 5 vòng, playsInline=false | **3/5**, kẹt vòng 4 ct 0,083, resume 1115 ms, 1 resume null |
| P2 | phát thường 6 s, KHÔNG listener, KHÔNG playsInline, play ngay | **KẸT** ct 0,963, rs 4→3→2, totalFrames 7, buffered [0,4] |
| P3 | phát thường 6 s, KHÔNG listener, playsInline=true | **KẸT** ct 0,486, rs 4→3→2, totalFrames 3, buffered [0,4] |
| P4 | loop 5 vòng, viewport 320×240 | **0/5**, kẹt ct 0,083, totalFrames 2 |
| P5 | loop 5 vòng, element CSS 320×180 | **0/5**, kẹt ct 0,25, totalFrames 4 |
| P6 | loop 5 vòng, blob URL (fetch toàn bộ file trước) | **5/5**, resume trung vị 2220 ms, totalFrames 139, dropped 31; có 1 lần đứng 2,01 s ở ct 0,083 rồi TỰ HỒI |
| P7 | loop 5 vòng, restart bằng poll (KHÔNG listener ended) | **0/5**, kẹt ct 0,833, totalFrames 3 |
| P8 | khôi phục sau kẹt: seek(0,2)+play | Kẹt 0,1798 → sau seek ct 3,25 trong 3 s, rs về 4, totalFrames 79, dropped 0 (1 quan sát — xem §6) |
| P9 | pháp y 12 s, mẫu 250 ms kèm buffered/ns | Kẹt ct 0,25 từ t=1,24 s suốt 10,6 s; **buf [[0,4]] từ mẫu đầu (t=0,64 s)**; ev stalled 1, waiting 2, suspend 1, canplaythrough 1, ended 0, error 0; totalFrames 4, dropped 1 |

Kết luận từng ứng viên: playsInline LOẠI (P2 kẹt không có nó, P3 kẹt
có nó, P1 chỉ làm kẹt đến muộn hơn); listener `ended` LOẠI (P2/P3/P7
không listener vẫn kẹt); viewport LOẠI (P4); kích thước element LOẠI
(P5); đói buffer progressive LOẠI (P9: buf đầy từ đầu); đường sự kiện
`ended` LOẠI (P7 poll cũng kẹt).

## 3. Biến thể encode của D (loop 5 vòng, setup baseline)

| Biến thể | Thay đổi so với D | Kết quả |
|---|---|---|
| V-d30fps | 30 fps (thay 24) | **0/5**, kẹt ct 0,2, totalFrames 5 |
| V-d24-faststart | moov lên đầu file (offset 40) | **0/5**, kẹt ct 0,5, totalFrames 4 |
| V-d24-gop24 | keyframe mỗi 1 s (0/1/2/3 s) | **0/5**, kẹt ct 0,324, totalFrames 6 |
| V-d24-crf28 | CRF 28, ~1,35 Mbps (thay 2,64) | **5/5**, không stall, resume 708 ms, totalFrames 363, dropped 3 |
| V-d24-baseline | profile baseline (thay High) | **3/5**, kẹt vòng 4 ct 0,024, resume 614 ms |
| V-a24fps | clip A ở 24 fps (320×180) | **5/5**, resume 376 ms, totalFrames 257 |
| V-d24-vp9 | VP9 720p 24 fps | **0/5**, kẹt ct 0,875, totalFrames 13 |
| V-d2s-duration | D rút còn 2 s | **0/5**, kẹt ct 0,375, totalFrames 6 |

Kết luận: fps LOẠI (30 vẫn kẹt; A 24 fps vẫn 5/5); GOP LOẠI; moov LOẠI;
codec LOẠI (VP9 cũng kẹt); duration LOẠI. Yếu tố phân biệt là **độ phức
tạp/bitrate × độ phân giải**: 720p 2,64 Mbps kẹt, 720p 1,35 Mbps hết,
320×180 hết ở mọi fps. Baseline profile cải thiện một phần (3/5) nhưng
không hết — phù hợp với giả thuyết race theo khối lượng decode đầu
pipeline, không phải một tính năng codec cụ thể.
(ffprobe đối chiếu: D vs A cùng High profile, SAR 1:1, moov ở CUỐI cả
hai, cùng 1 keyframe duy nhất ở t=0; D khác ở 1280×720 level 31,
24 fps, bitrate 2,64 Mbps ≈ 11× A.)

## 4. Yếu tố "chờ trước khi play" (script riêng P11–P13)

Probe: `benchmarks/render/webkit_loop_d_wait_86n1.mjs` (port 8897).

| Ca | Kết quả |
|---|---|
| P11 chờ 8 s rồi phát thường ×3 | **3/3 PASS** — cả 3 lần chạy hết clip tới `ended` (finalCt 4, rs 4, stalled 0, totalFrames 57–87, dropped 0–2). Đây là tái hiện đúng diag M4 (ct 3,03 sau 3 s). |
| P12 chờ `canplaythrough` rồi phát thường ×3 | **0/3** — kẹt maxCt 0,289 / 1,318 / 0,797, rs 2, frozen; `canplaythrough` chỉ mất 287–399 ms để bắn — quá sớm, không phải tín hiệu sẵn sàng |
| P13 chờ 8 s rồi loop 5 vòng ×1 | **3/5** — qua 3 vòng rồi kẹt vòng 4 ct 0,083; chờ chỉ cứu lần play đầu, mỗi restart mở lại race |

## 5. So sánh với đợt 85 (M4) và L10

- M4: D 0/40 vòng + 0 ended/12 s no-poll, ct 0,176–0,19, đã loại trừ chờ
  canplay/canplaythrough + bỏ poll. Đợt này xác nhận lại P0 0/10 (ct 0,3)
  và mở rộng: điểm kẹt không cố định; chờ canplaythrough vẫn kẹt (P12
  0/3); nhưng chờ 8 s thì phát thường hết kẹt (P11 3/3) — M4 chưa tách
  được điểm này vì diag của M4 chỉ chạy 1 lần và không lặp lại.
- L10 (đợt 84): D 10/10. Hồi quy-hoặc-đổi-môi-trường như M4 đã ghi vẫn
  đúng ở mức quan sát; đợt này cho thấy xác suất kẹt theo đoạn phát là
  ngẫu nhiên và nhạy với tải + bitrate, nên một lần 10/10 ở môi trường
  khác không mâu thuẫn với 0/40 ở đây. Không có bằng chứng cho một thay
  đổi code cụ thể nào gây hồi quy (repo không đổi logic media giữa L10
  và M4 ở đường này).

## 6. A/B cách sửa: watchdog seek-cứu — THẤT BẠI, KHÔNG sửa production

Probe: `benchmarks/render/webkit_loop_d_watchdog_86n1.mjs` (port 8894).
Watchdog: poll ct mỗi 100 ms; ct đứng yên ≥2 s trong lúc `!paused &&
!ended && !seeking` thì seek(ct+step) + play, tối đa 3 lần cứu/vòng.

| Nhánh | Kết quả |
|---|---|
| Baseline +0,2 rep1 | 2/5 rồi kẹt ct 0,313 |
| Watchdog +0,2 rep1 | **0/5** — cứu 3 lần (0,392→0,592→0,792→0,992), ct chỉ bò theo từng bước seek, totalFrames 7 |
| Baseline +0,2 rep2 | **5/5** (resume 331–705 ms, totalFrames 450) |
| Watchdog +0,2 rep2 | **0/5** — cứu 3 lần (0,364→0,564→0,764→0,964), totalFrames 5 |
| Baseline +0,02 rep1 | 0/5, kẹt ct 0,184 |
| Watchdog +0,02 rep1 | **0/5** — cứu 3 lần (0,292→0,312→0,332→0,352), totalFrames 4 |
| Baseline +0,02 rep2 | 0/5, kẹt ct 0,583 |
| Watchdog +0,02 rep2 | **0/5** — cứu 3 lần (0,414→0,434→0,454→0,474), totalFrames 2 |

(Biến thể +0,02 chạy bằng bản sao 1 dòng của script watchdog tại
`/tmp/n1/a/b2/watchdog002.mjs`; JSON kết quả đã đưa vào repo:
`benchmarks/results/webkit-loop-d-watchdog002-86n1.json`.)

Đọc A/B: seek-cứu **không khởi động lại decoder** — mỗi lần seek chỉ
dời ct tới vị trí mới rồi đứng yên tiếp; cả 12 lần cứu ở 4 lần chạy
watchdog đều thất bại. P8 (seek 0,2 hồi được 1/1) không tái hiện trong
A/B và được giải thích lại là tự hồi ngẫu nhiên (P6 blob cũng tự hồi
sau 2,01 s không cần seek). **Vì vậy KHÔNG thêm watchdog vào
preview.tsx / syncMedia.** Không sửa file production nào trong luồng
này; không thêm i18n key (không tự bump test khóa số key — không có gì
để bump).

## 7. Nợ môi trường: WebProcess crash sau reboot (đã tìm ra + sửa được)

- Triệu chứng: sau reboot VM lúc 03:25 +07, mọi probe WebKit crash
  page khi video load (`page.evaluate: Target page, context or browser
  has been closed`; MiniBrowser báo `WebProcess CRASHED`). Ban đầu tưởng
  dep apt chưa cài đủ — nhưng dep đã cài đủ (libgstreamer 1.24.2,
  libgtk-4 4.14.5, plugins-good/bad 1.24.2, libav 1.24.1).
- Chẩn đoán: MiniBrowser in `GStreamer element appsink not found` +
  `autoaudiosink not found` + GLib CRITICAL NULL instance. Kiểm chứng
  bằng ctypes: libgstreamer **bundle** của Playwright
  (`webkit-2388/minibrowser-gtk/sys/lib/libgstreamer-1.0.so.0`) chỉ
  tìm được **1 plugin**, mọi factory NOT-FOUND; libgstreamer **hệ thống**
  tìm đủ **270 plugin**, tất cả OK. Nguyên nhân: sysroot bundle có lib
  GStreamer nhưng KHÔNG có thư mục plugin `sys/lib/gstreamer-1.0/`
  (không tồn tại), nên đường quét mặc định của nó trống. Registry cache
  `~/.cache/gstreamer-1.0/registry.x86_64.bin` trước reboot còn đầy đủ
  nên đã che lỗi này; reinstall sau reboot làm mới mtime plugin →
  registry hết hạn → quét lại → 0 plugin → registry 76 byte → crash.
- Sửa (đã kiểm chứng): export
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` trước khi
  chạy probe — bundled lib tìm đủ 270 plugin; MiniBrowser chạy 30 s
  không crash; registry rebuild thành 1.428.975 byte. Tất cả probe
  P8/P9/V/P11–P13/watchdog đợt này đều chạy với biến này.
- Lưu ý cho đợt sau: **sau mỗi reboot, export GST_PLUGIN_PATH trước mọi
  probe WebKit** (kèm `install-deps webkit` nếu dep apt mất — lần này
  apt-get update hệ thống giữ lock ~16 phút, install-deps fail 2 lần vì
  lock trước khi thành công ở lần 3, exit 0). Đây là vấn đề môi trường
  test, không phải bug sản phẩm.

## 8. Kiểm chứng

- Unit test liên quan (không đổi production nên chỉ chạy lại):
  `webkitLoopRestart80H5` **11/11 xanh**;
  `webkitRestartTrace85M4` **10/10 xanh**.
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build` (apps/web): **PASS** (7,61 s; cảnh báo chunk > 500 kB đã
  có từ trước).
- Harness WebKit smoke trên Chromium (kiểm logic script trước khi chạy
  WebKit): P0 D 10/10, wall 45,51 s, không stall — script đo đúng.
- Không kiểm lại TTS 39 (đúng chỉ đạo).
- MediaRecorder `undefined` trong mọi lần chạy WebKit (ghi nhận
  incidental lần 7, không phải kiểm lại có chủ đích).

## 9. Nợ còn lại / giới hạn

1. **W1 clip D còn MỞ (đã rõ cơ chế, chưa có fix):** race preroll HTTP
   progressive với 720p bitrate cao; watchdog seek-cứu đã A/B thất bại.
   Hướng đợt sau: tiêu chí sẵn sàng mạnh hơn `canplaythrough`, blob URL
   cho clip loop, hoặc encode lại clip 720p ở CRF cao hơn — cả ba đều
   cần A/B trên đường phát chính của app trước khi sửa production.
2. **Chưa tách tới mức C-level:** chưa có trace queue2/decodebin/video
   sink để chỉ đúng hàm gây race; cần GST_DEBUG sâu hoặc build WebKit
   có log nếu muốn xuống nữa.
3. **Tải VM là biến nhiễu chưa kiểm soát:** baseline D dao động 0/5–5/5
   giữa các lần chạy; số timing tuyệt đối (resume 331–2220 ms) mang
   caveat tải 0,95–22. Cần thí nghiệm tải có kiểm soát nếu muốn định
   lượng xác suất kẹt theo tải.
4. **Môi trường sau reboot (§7):** dep apt WebKit + clip /tmp mất sau
   mỗi reboot (lần thứ 4); probe WebKit sau reboot phải cài lại dep +
   export GST_PLUGIN_PATH, nếu không sẽ gặp WebProcess crash giả.
5. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.

## 10. Files (stage, KHÔNG push)

- Mới: `benchmarks/render/webkit_loop_d_rootcause_86n1.mjs` (probe P0–
  P10 + V; lưu ý: luồng EPERM đợt 86 (N8) đã sửa file này sau khi N1
  tạo — thêm import `writeFileEpermRetry` + dùng nó để ghi JSON; đã
  verify chạy tốt, không phải do N1).
- Mới: `benchmarks/render/webkit_loop_d_wait_86n1.mjs` (P11–P13).
- Mới: `benchmarks/render/webkit_loop_d_watchdog_86n1.mjs` (A/B
  watchdog +0,2).
- Mới: `benchmarks/results/webkit-loop-d-rootcause-86n1.json` (19 case:
  P0–P10 + V×8), `benchmarks/results/webkit-loop-d-wait-86n1.json`
  (7 case: P11×3, P12×3, P13), `benchmarks/results/webkit-loop-d-
  watchdog-86n1.json` (4 case), `benchmarks/results/webkit-loop-d-
  watchdog002-86n1.json` (4 case, bước +0,02).
- Mới: `docs/PHASE9_ROUND86_N1_WEBKIT_CLIPD_LOOP_LIMITS.md` (file này).
- Không stage: clip mp4/webm trong /tmp/n1/clips (tạo lại bằng ffmpeg
  khi cần — công thức trong log luồng); script smoke Chromium
  `/tmp/n1/a/b/chromium_smoke_86n1.mjs` + variant watchdog +0,02
  `/tmp/n1/a/b2/watchdog002.mjs` (tạm, đã mô tả đủ trong LIMITS);
  diag `gstprobe.py` / `mini86.mjs` (tạm, đã mô tả đủ trong LIMITS §7).
- Không sửa production, không binary, không workflow, không i18n key mới.
