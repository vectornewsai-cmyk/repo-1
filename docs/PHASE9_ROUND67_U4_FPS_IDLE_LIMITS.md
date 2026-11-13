# LIMITS — Phase 9 đợt 67, luồng U4: presented 1080p lúc lặng + mediaRate + headed FPS đầy đủ

Ngày đo: 2026-11-08 (21:37–22:30 +07). VM: 4 vCPU, ~7,9 GB RAM, CPU-only
(SwiftShader), FFmpeg 8.1.2, Chromium headless 158 qua Xvfb + CDP.
Fixture: `long1080.mp4` / `long720.mp4` 20,0 s, 30 fps, testsrc2 + noise
alls=15, libx264 veryfast crf 23 (tái dùng từ R64).

Nợ được giao: đợt 66 T5 §7 (xem docs/PHASE9_ROUND66_T5_FPS_1080P_LIMITS.md
§6–§7 + docs/PHASE9_ROUND66_LIMITS.md §8): (1) presented 1080p lúc lặng
(chưa đo được ở T5), (2) giải thích mediaRate app 1,0x vs tab trắng 0,579x,
(3) chạy lại headed đầy đủ `clicktest-64r3-fps-long.mjs` sau backport bug n=0.
Không có số nào bịa — mọi con số dưới đây đều có log/JSON đối chiếu, và mọi
lần đo thất bại đều ghi rõ nguyên nhân thay vì ghi số rác.

## 0. Kết luận trước (TL;DR)

1. **Presented 1080p lúc lặng: VẪN CHƯA ĐO ĐƯỢC.** 3 lần thử (hết retry theo
   nhiệm vụ) đều chết ở GATE warmup của `measure-65r8-presented-fps.mjs`
   (drawDelta 4 / 2 / 4, cần ≥20), harness exit 2, 0 slot lặng hợp lệ.
   Nhưng xem mục 4: gate của harness presented và gate của clicktest cho
   kết quả TRÁI NGƯỢC ở cùng clip 1080p (2–4 vs 48–50 draws/6 s) — có thể
   gate presented quá nhạy với transient lúc tỉnh ngủ, không phải máy
   không vẽ được. Đây là phát hiện mới, nợ cho đợt sau.
2. **mediaRate đã giải thích được — cơ chế là syncMedia re-seek, CÓ BẰNG
   CHỨNG TRỰC TIẾP trong app:** quỹ đạo `currentTime` trong app là BẬC
   THANG (đứng yên nhiều giây rồi nhảy vọt +0,5…+4,95 s), không phải trôi
   mượt; bộ đếm `__vcutSyncReseeksVideo` tăng +3/+4 mỗi slot 10–16 s.
   Probe tab trắng chứng minh nhân quả: re-anchor kiểu syncMedia ép
   mediaRate-ct về ~1,0x trong khi presented vẫn thấp (D-vis: ct 1,002x
   vs rVFC-meta 0,589x). NHƯNG mặt nạ này chỉ đầy đủ khi seek hoàn thành
   nhanh: dưới tải cực đoan (load 18–21, seek tốn 2–5 s) mediaRate trong
   app cũng chỉ còn 0,65–0,77x (thay vì 1,000x như T5).
3. **Headed đầy đủ sau backport: 720p CHẠY XONG (2/4 pass, đúng mẫu),
   1080p CHẾT Ở REP 2 (exit 2, không JSON).** RAF stats cắt theo
   timestamp: **21/21 slot 720p + 12/12 slot 1080p đều n>0 (n=8–143),
   không còn n=0** — backport đã kiểm chứng trong lần chạy headed thật.
   Tỉ lệ enhance 720p: denoise 0,603x / stabilize 0,873x / combo 0,383x;
   1080p rep 1: 0,33x / 0,63x / 0,35x (combo gần như giống hệt R64:
   0,35 vs 0,37). Baseline tuyệt đối sụp mạnh so với R64 (720p: 28,74 →
   8,07 fps; 1080p: 35,31 → 3,31 fps) vì VM đợt này chậm hơn hẳn
   (swap đã dùng 395 MB, load vọt tới 32).
4. **Không sửa code production.** Chỉ thêm 2 script probe mới + doc này.
   Không push, không tag/release, không binary.

## 1. Presented 1080p lúc lặng — 3 lần thử đều chết ở GATE

Harness: `measure-65r8-presented-fps.mjs` (S8, knob `R8_PRES_RES=1080`
của T5), 3 rep × 10 s. Lệnh chạy lại xem §8.

| Lần | Kết quả | Load lúc bắt đầu → lúc mount → lúc gate | drawDelta (cần ≥20) |
|---|---|---|---|
| 1 (21:38) | HARNESS LỖI, exit 2 | 1,22 → 3,80 → 3,29 | 4 (draw 2 → 6) |
| 2 (21:47) | HARNESS LỖI, exit 2 | 1,56 → 7,41 → 9,28 | 2 (draw 2 → 4) |
| 3 (21:56) | HARNESS LỖI, exit 2 | 1,02 → 1,26 → 6,41 | 4 (draw 2 → 6) |

Log: `hidden_files/round67-u4/presented-1080p-idle-run{1,2,3}.log`.
Cả 3 lần element VẪN phát được (ct 5,9–6,7 s sau 6 s warmup, q.total
29–77, dropped 0, hookOk=true) — chỉ vòng VẼ gãy (draw ~0,3–0,7 fps
trong 6 s warmup), đúng mẫu "draw gãy trước, media gãy sau" của S8/T5
nhưng ở mức cực đoan hơn. Harness dừng đúng thiết kế, không ghi số rác.

Nguyên nhân tải từng lần (đọc từ `ps` lúc lỗi): lần 1 — U8 pip-audit/PyPI
+ U3 ffmpeg transcode; lần 2 — U1 ffmpeg decode60 threads=1 (99,8% CPU)
khởi động đúng lúc warmup; lần 3 — trong cùng phút 14:56–14:57 UTC các
luồng khác đồng loạt khởi động việc nặng (2× `tsc --noEmit`, ffmpeg
vidstabdetect của U1, chromium + vite headed của U3); load sau đó lên
11,25–12,66. Đã dùng hết 3 retry theo nhiệm vụ — dừng, không retry thêm.

So với baseline 720p lúc lặng của S8 (draw 47,21 / presented 30,04 /
mediaRate 1,000x, 1 slot): không có số 1080p lúc lặng nào để đặt cạnh —
bảng so sánh 720p↔1080p lúc lặng vẫn trống (xem §6).

## 2. mediaRate app ≈ 1,0x vs tab trắng 0,579x — đã giải thích

### 2.1 Giả thuyết (M1) và thiết kế kiểm chứng

Giả thuyết: preview `syncMedia` (`apps/web/src/preview.tsx:2242/2262/
2286/2323`) phát seek lại `currentTime = target` mỗi khi
`|currentTime − target| > 0,35 s` (`playheadPacing.ts`:
shouldIssueForwardReseek), target = playhead ≈ wall-clock (phRate
~0,99x). Mỗi cú seek kéo currentTime về phía trước theo đồng hồ tường
→ ΔcurrentTime/Δwall ≈ 1,0x BẤT KỂ presented fps thấp bao nhiêu. Tab
trắng phát tự do: currentTime chỉ tiến theo frame thật sự trình chiếu →
decode không kịp thì mediaRate < 1.

Hai probe mới (script xem §8):
- `measure-67u4-mediarate-probe.mjs` — tab trắng, cùng clip long1080,
  6 điều kiện × 10 s trong cùng phiên: A-vis (VISIBLE, tự do, rate 1,0),
  A-det (TÁCH DOM, tự do, 1,0), B-vis (VISIBLE + re-anchor mô phỏng
  syncMedia, 1,0), B-det (TÁCH DOM + re-anchor, 1,0 — sát nhất app),
  C-vis (tự do, rate 0,5 — trình chiếu chậm xác định), D-vis (re-anchor,
  rate 0,5 — kiểm chứng nhân quả). Mỗi điều kiện: rVFC fps, presented
  fps, dropped, mediaRate (2 định nghĩa: từ meta.mediaTime rVFC và từ
  element.currentTime đầu/cuối), số lần re-seek, tổng độ nhảy, trace
  currentTime 50 ms (thêm ở lần chạy lại).
- `measure-67u4-app-rvfc-probe.mjs` — TRONG APP, không dùng gate draw
  (cố tình: vòng vẽ có thể gãy nhưng element vẫn phát): gắn rVFC lên
  element pool (`__vcutMediaEls`) + trace currentTime 50 ms + quality
  đầu/cuối + bộ đếm `__vcutSyncReseeks*` trước/sau, 2 rep × 10 s.

### 2.2 Probe tab trắng — lần 2 (đủ 6 điều kiện, exit 0)

Load 4,72 → 4,19–5,35 trong lúc chạy. JSON:
`hidden_files/round67-u4/mediarate-probe/mediarate-probe.json`.

| Điều kiện | rVFC fps | presented fps | dropped | mediaRate rVFC | mediaRate ct | re-seek | jumpSum |
|---|---|---|---|---|---|---|---|
| A-vis (tự do, 1,0) | 21,83 | 30,40 | 29 | 0,987x | 1,019x | 0 | 0 |
| A-det (tách DOM, tự do, 1,0) | 28,06 | 30,25 | 299 | 0,985x | 1,016x | 0 | 0 |
| B-vis (re-anchor, 1,0) | 22,36 | 30,75 | 17 | 0,988x | 1,019x | 0 | 0 |
| B-det (tách DOM + re-anchor, 1,0) | 27,46 | 30,45 | 300 | 0,988x | 1,015x | 0 | 0 |
| C-vis (tự do, rate 0,5*) | 17,37 | 27,56 | 53 | 0,925x | 0,927x | 0 | 0 |
| D-vis (re-anchor, rate 0,5*) | 2,30 | 15,87 | 13 | 0,589x | 1,002x | 4 | 8,959 s |

\* Ở lần 2, `playbackRate = 0,5` được gán TRƯỚC `src` nên KHÔNG có tác
dụng (C-vis vẫn chạy ~0,93x, presented 27,56 — xem §2.5 mục 4). D-vis
vì thế không phải là "0,5x + re-anchor" sạch, mà là "element chậm do
tải (presented 15,87) + re-anchor": 4 cú seek nhảy tổng 8,959 s, ép
mediaRate-ct lên 1,002x trong khi mediaRate-rVFC vẫn 0,589x. Kết luận
nhân quả vẫn đứng (re-anchor ép ct-mediaRate về 1,0x), nhưng phép thử
sạch phải đợi lần chạy lại (§2.3).

Hai điều rút ra ngay từ lần 2:
- **Tách DOM không đổi presented/mediaRate** (A-vis vs A-det: presented
  30,40 vs 30,25; mediaRate 0,987 vs 0,985) — nhưng **đổi hoàn toàn
  dropped**: 29 vs 299. Element tách DOM mà không ai vẽ thì gần như
  mọi frame đều bị đếm là dropped (299/304), trong khi element VISIBLE
  chỉ drop frame thật sự trễ (29). Trong app (tách DOM + vẽ lên canvas)
  dropped ≈ 0 (T5/S8). **Kết luận: `droppedVideoFrames` không so sánh
  được giữa các kiểu tiêu thụ element khác nhau** (visible / tách DOM
  không vẽ / tách DOM + vẽ canvas) — chỉ có ý nghĩa trong cùng kiểu.
- **rVFC đếm thiếu ở mọi điều kiện**: 21,83 vs 30,40 (0,72×); 28,06 vs
  30,25 (0,93×); 17,37 vs 27,56 (0,63×); 2,30 vs 15,87 (0,14× — khi
  có seek, rVFC gần như ngừng bắn). Khẳng định lại S8/T5, thêm trường
  hợp cực đoan dưới re-anchor.
- **Đối chứng tab trắng KHÔNG ổn định giữa các cửa sổ:** ở load1 ~4,7,
  lần này A-vis cho presented 30,40 / mediaRate 0,987 — trong khi đối
  chứng của T5 ở load 4,14 chỉ được 17,88 / 0,579x. load1 không giải
  thích được: thành phần tải khác nhau (và đối chứng T5 chạy ngay sau
  3 slot app nặng trong cùng browser). Cặp số "app 1,0x vs tab 0,579x"
  của T5 là đúng trong phiên của T5, nhưng phía tab trắng dao động mạnh
  theo cửa sổ — đừng dùng 0,579x như hằng số của tab trắng.

Lần 1 của probe chết vì thiếu header CORS trên HTTP server tự chế
(`crossOrigin="anonymous"` cần `Access-Control-Allow-Origin: *`) —
đã sửa, lần 2 chạy sạch (exit 0, 6/6 điều kiện).

### 2.3 Probe tab trắng — chạy lại C/D (rate 0,5 thật, exit 0)

Sau khi sửa probe (gán `playbackRate` SAU seek/load + đọc lại
`v.playbackRate` + trace 50 ms), chạy lại riêng C-vis/D-vis. Load lúc
này cực đoan: 15,58 → 21,03. JSON:
`hidden_files/round67-u4/mediarate-probe-rerun/mediarate-probe.json`.

| Điều kiện | rVFC | presented | dropped | mediaRate rVFC | mediaRate ct* | rateReadback | re-seek | jumpSum |
|---|---|---|---|---|---|---|---|---|
| C-vis (tự do, 0,5) | 7,08 | 11,16 | 30 | 0,346x | 0,364x | 0,5 ✓ | 0 | 0 |
| D-vis (re-anchor, 0,5) | 0,69 | 10,59 | 0 | 0,673x | 1,269x† | 0,5 ✓ | 5 | 12,633 s |

\* mediaRate-ct của probe dùng mẫu số CỐ ĐỊNH 10 s (thiết kế script),
nên phóng đại khi có độ trễ khởi động — xem §2.5 mục 5.
† 1,269x là artefact của mẫu số cố định: ct 0→12,694 nhưng span tường
thật ct0→ct1 ≈ 12,85 s → tỉ lệ thật ≈ 0,99x.

Trace 50 ms (phân tích bằng `/tmp/round67-u4/analyze-trace.mjs`):
- C-vis: **trôi mượt, 0 cú nhảy**, trueMediaRateCt = 0,327x trên span
  10,80 s; ct đứng yên ~3,9 s/10,1 s (decode không kịp ngay cả ở 0,5x
  dưới load 16–18). Đây là hình ảnh của phát tự do khi chậm: mượt mà
  nhưng chậm.
- D-vis: **bậc thang**: 4 cú nhảy trong trace (+0,396 @0,4 s; +2,134
  @2,59 s; +2,27 @4,8 s; +2,429 @7,29 s), seeking ~9.750 ms/10.000 ms
  (element dành 97,5% cửa sổ để SEEK, không phát); cú seek thứ 5
  (+5,4 s) kẹt hơn 5 s rồi mới đáp xuống ct 12,694 đúng lúc cửa sổ
  đóng. True rate trên span trace (trước khi cú cuối đáp) là 0,576x;
  tính cả cú đáp cuối thì ≈ 0,99x trên span tường thật.
- **Kết luận nhân quả (sạch):** với cùng độ chậm bên ngoài (rate 0,5 +
  tải nặng), tự do cho mediaRate ~0,33–0,36x, re-anchor cho ~0,99x
  (tính đúng span tường). Cơ chế M1 được chứng minh. Nhưng dưới tải
  cực đoan, re-anchor cũng chỉ vừa đủ: seek kẹt hàng giây, element
  gần như không phát được gì giữa các cú seek (rVFC 0,69 fps,
  presented 10,59 — thấp hơn cả C-vis 11,16).

### 2.4 Probe TRONG APP — bằng chứng trực tiếp (2 rep, exit 0)

Load lúc đo ~0,7–1,0 (load1 thấp nhưng load5/load15 còn 5–6, swap đã
dùng 395 MB — VM vẫn ì sau các việc nặng vừa xong). JSON:
`hidden_files/round67-u4/app-rvfc-probe/app-rvfc-probe.json`.

| Rep | rVFC fps | presented fps | dropped | mediaRate rVFC | mediaRate ct | trace true | re-seek video | drawDelta | ticksDelta |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0,49 (8 frame/14,283 s) | 3,57 (Δtotal 51) | 15 | 0,81x | 0,773x | 0,738x | +3 | 7 | 66 |
| 2 | 0,76 (13 frame/15,849 s) | 10,79 (Δtotal 171) | 45 | 0,677x | 0,653x | 0,619x | +4 | 10 | 86 |

- **Quỹ đạo currentTime trong app là bậc thang re-seek, không trôi
  mượt:** rep1 nhảy +0,868/+4,954/+3,412 (đứng yên nhiều giây giữa
  các cú nhảy: ct 2,30 từ ~1 s tới ~6 s, 8,13 từ ~7 s tới ~9 s);
  rep2 nhảy +2,946/+2,134/+2,905 (+0,541/+0,508 nhỏ). Mỗi cú seek tốn
  2–5 s mới hoàn thành ở 1080p dưới trạng thái VM này. Bộ đếm
  `__vcutSyncReseeksVideo` tăng +3/+4 mỗi rep (audio +0) — syncMedia
  đang re-seek video thật trong lúc phát.
- **mediaRate trong app đợt này chỉ 0,65–0,77x (không phải 1,000x như
  T5)** — vì seek quá chậm: element dành phần lớn thời gian để seek
  (ct đứng yên), re-seek không kịp kéo currentTime theo kịp wall-clock.
  Đối chiếu D-vis tab trắng: cùng một giới hạn — mặt nạ re-anchor chỉ
  đầy đủ khi seek hoàn thành nhanh (như ở T5: load 5,6–10,7, mediaRate
  1,000x). Đây là cập nhật quan trọng cho kết luận của T5: "app 1,0x"
  không phải hằng số, mà là kết quả của re-seek kịp thời; khi seek kẹt
  thì app cũng tụt như tab trắng.
- **rVFC trong app gần như chết:** 0,49–0,76 fps so với presented
  3,57–10,79 (chỉ 7–14% số frame). Tuyệt đối không dùng rVFC làm nguồn
  FPS trong app (FPS meter dùng draw/presented là đúng).
- **Hai định nghĩa mediaRate trong app lần này KHỚP nhau** (0,81 vs
  0,773; 0,677 vs 0,653 — lệch ≤0,04x), trái với D-vis tab trắng lần 2
  (0,589 vs 1,002 — lệch 0,41x). Sự phân kỳ phụ thuộc thời điểm callback
  so với cú nhảy, không phải độ lệch cố định — đừng quy đổi giữa hai
  định nghĩa.
- **App đợt này chậm hơn hẳn T5** (presented 3,57/10,79 vs 18,24;
  draw ~0,5 fps vs 2,75; mediaRate 0,65–0,77x vs 1,000x) DÙ load1 lúc
  đo chỉ ~1,0. Nguyên nhân khả dĩ nhất là trạng thái VM (swap 395 MB,
  nhiều tiến trình chromium/vite/tsc/ffmpeg của luồng khác còn resident),
  KHÔNG phải do code: file `preview.tsx` chỉ bị luồng U5 sửa nhẹ lúc
  21:46 +07 (đăng ký toast trial-decode, dòng 108/2582/2683) và lần thử
  idle 1 đã chậm TRƯỚC khi sửa đó; không file render-path nào khác đổi
  sau 19:00 +07 (kiểm tra mtime sau 12:00 UTC). Ticks rAF chỉ 66–86
  trong 14–16 s (~4,6–5,7 Hz thay vì 60 Hz) — vòng preview đói CPU
  toàn diện, không riêng khâu vẽ.

### 2.5 Các phát hiện phụ / đính chính (trung thực, không giấu)

1. **T5/S8 đúng về cơ chế, nhưng "app 1,0x" không phải hằng số** —
   xem §2.4: khi seek kẹt (tải cực đoan / swap), mediaRate app cũng
   tụt xuống 0,65–0,77x. Mặt nạ re-anchor là có điều kiện.
2. **Đối chứng tab trắng của T5 (0,579x) không tái hiện được ở load
   tương đương** (§2.2): lần này A-vis ở load ~5 cho 0,987x. Phía tab
   trắng dao động mạnh theo cửa sổ tải; cặp số T5 chỉ có giá trị trong
   phiên của T5.
3. **`playbackRate` gán trước `src` không có tác dụng** (Chromium
   158 trên VM này): lần 2 C-vis "rate 0,5" thực chất chạy ~0,93x;
   sau khi chuyển sang gán SAU seek/load thì `rateReadback` = 0,5 và
   hành vi khớp 0,5x. Đây là bài học phương pháp cho các probe sau
   (không phải bug của app).
4. **mediaRate-ct của probe tab trắng dùng mẫu số cố định 10 s**
   (thiết kế script, khác với harness presented dùng Δwall thật):
   phóng đại khi có độ trễ khởi động (D-vis chạy lại: 1,269x báo cáo
   vs ~0,99x thật). Các số mediaRate-ct của probe chỉ dùng để so sánh
   tương đối trong cùng lần chạy; số tuyệt đối lấy theo trace (true
   rate) hoặc theo mediaRate-rVFC.
5. **Số FPS tuyệt đối dưới tải nặng dao động 5–10× theo cửa sổ**
   (nhắc lại S8 §6): mọi so sánh chỉ có nghĩa trong cùng cửa sổ tải,
   kèm loadavg — xem bảng §3.

## 3. Headed đầy đủ `clicktest-64r3-fps-long.mjs` sau backport n=0

### 3.1 720p — CHẠY XONG (exit 1 = 2/4 pass, đúng mẫu)

Log `headed-long-720-run1.log`, JSON `headed-long/r3-fps-long-720.json`.
GATE qua: draw 2 → 50 (delta 48) ở load 11,35.

| Cấu hình | Tỉ lệ mean | min | max | std | drawFps mean |
|---|---|---|---|---|---|
| denoise | **0,603x** | 0,34 | 0,83 | 0,202 | 4,28 (2,92–6,82) |
| stabilize | **0,873x** | 0,08 | 1,68 | 0,653 | 6,47 (0,99–10,3) |
| combo | **0,383x** | 0,07 | 0,67 | 0,246 | 3,03 (0,69–4,96) |
| baseline | — | — | — | — | 8,07 (6,04–10,2, std 1,7) |

A-hook PASS (21 slot × 3 rep, alpha 0,486). A FPS FAIL theo thiết kế
(combo 0,383x < ngưỡng 0,75x). H9 PASS (0 lỗi trang). Phase D decode
tab trắng 720p: rVFC mean **4,633 fps** (3,49–5,6, std 0,87),
mediaRate mean 0,384x, dropped 209/449 (47%), load 14,62–17,61 —
FAIL ngưỡng (decode sụp theo tải, xem §3.3).

**RAF stats (cắt theo timestamp): 21/21 slot n>0 (n=32–143), KHÔNG có
n=0.** Đây là kiểm chứng headed đầu tiên của file đã backport (trước
wrap; wrap đã khóa bởi unit test 8/8 của T5).

**Draw stall (phát hiện mới):** 3/21 slot draw ~1 fps trong khi tick
~7–12 fps (rep1 slot4 stabilize draw 0,99/tick 12,21; rep2 slot7
baseline 0,80/7,98; rep3 slot3 baseline 0,99/7,23) — vòng rAF vẫn tick
nhưng canvas gần như không vẽ. Mọi tỉ lệ cực đoan đều dính stall:
stabilize rep1 0,08x (slot stall) và rep3 1,68x (baseline kề stall
0,99 fps); combo rep1 0,07x (slot6 tick cũng chỉ 3,47). **Đừng dùng
các số này làm kết luận.** Đọc robust (bỏ slot stall): denoise
0,34–0,83x; stabilize ~0,86x (rep2 sạch: 10,3 vs baseline kề 11,99);
combo 0,41–0,67x (rep2–3).

**So với R64 720p** (denoise 0,46x / stabilize 0,743x / combo 0,457x /
baseline 28,74): denoise mean cao hơn (0,603x) nhưng spread rộng
(std 0,202, n=3 — chưa kết luận được thay đổi thật); stabilize và
combo cùng ballpark sau khi loại stall; baseline tuyệt đối 28,74 →
8,07 fps (VM chậm hơn hẳn). Không sửa thang blend, không sửa code
(đợt này không đụng production code).

### 3.2 1080p — REP 1 ĐẦY ĐỦ, CHẾT Ở REP 2 SLOT 6 (exit 2, KHÔNG JSON)

Log `headed-long-1080-run1.log`. GATE qua: draw 2 → 52 (delta 50) ở
load 13,99.

Rep 1 đầy đủ: denoise **0,33x** (1,37 vs baseline kề 4,09), stabilize
**0,63x** (2,25 vs 3,58), combo **0,35x** (0,89 vs 2,54), baseline mean
**3,31 fps** (2,42–4,5). RAF n=10–45, không n=0. So R64 1080p
(0,433x / 0,78x / 0,37x / baseline 35,31): tỉ lệ cùng ballpark
(combo 0,35 vs 0,37 — gần như giống hệt); baseline tuyệt đối sụp 10×
do VM.

Rep 2 một phần (slot 1–5): draw 0,2–1,08 fps (draw stall nặng,
tick 0,75–3,07) khi load vọt 18 → 30. Chết ở slot 6 combo:
"HARNESS LỖI: GATE hook rep 2 slot 6 combo KHÔNG khớp sau 10s" —
hook ở baseline (`hasEnhance: false`, blur 0, alpha 0) trong khi cần
combo (blur 3, alpha 0,486, zoom 1,023); click checkbox có lẽ không
ăn vì UI đói CPU ở load 26–30. Phase D không chạy tới. R64 cũng chết
ở 1080p trước khi ghi JSON (decode seek 10) — chạy headed 1080p vốn
mong manh dưới tải. KHÔNG chạy lại: load đang 26–32, chạy lại gần
như chắc chắn chết cùng chỗ; rep 1 đã đủ để so sánh tỉ lệ.

### 3.3 Decode rVFC (tab trắng) — so sánh

| | R64 (load 4,9–7,2) | Đợt này 720p (load 14,6–17,6) | Đợt này 1080p |
|---|---|---|---|
| rVFC fps mean | 720p 15,54 / 1080p 24,15 | **4,633** (3,49–5,6) | chưa đo (chết trước phase D) |
| dropped | 720p 29% / 1080p 0,5% | **47%** (209/449) | — |
| mediaRate mean | — | **0,384x** | — |

Decode sụp theo tải (15,54 → 4,63 fps khi load tăng ~3×), không phải
do code. Lưu ý R64 từng cảnh báo "1080p decode tốt hơn 720p là do
tải lúc đo" — đợt này 720p decode chỉ còn 4,63 fps ở load 14–17, củng
cố rằng mọi số decode tuyệt đối đều là hàm của cửa sổ tải.

## 4. Mâu thuẫn gate — phát hiện mới, chưa giải thích được

Cùng clip 1080p, cùng cấu trúc gate (setEnh ×3 off → seek 0 → waitIdle
→ draw0 → Space 6 s → yêu cầu drawDelta ≥20), cùng chrome flags,
cách nhau ~20 phút:
- `measure-65r8-presented-fps.mjs` gate **trượt 3/3**: drawDelta 4 / 2 / 4.
- `clicktest-64r3-fps-long.mjs` gate **qua 2/2**: drawDelta 48 (720p) /
  50 (1080p), ở load 11,35 / 13,99 — CAO HƠN cả 3 lần presented trượt.

Điểm khác duy nhất trước gate: clicktest đọc `getImageData` canvas
(mean/std) để chứng minh frame; presented thì không. Giả thuyết chính:
bước đọc canvas "hâm nóng" đường vẽ, hoặc gate presented đo đúng lúc
vòng preview vừa tỉnh ngủ (wake-up transient) nên draw chưa kịp chạy.
CHƯA chứng minh — cần đợt sau thử: thêm bước đọc canvas vào presented
harness rồi đo lại idle 1080p (không cần chờ VM lặng hẳn).

Hệ quả thực tế: app VẪN vẽ được 48–50 frame/6 s ở 1080p ngay cả khi
load 11–14 — số idle 1080p có thể đo được nếu gate bớt nhạy cảm với
transient, không nhất thiết phải chờ VM hoàn toàn lặng (điều gần như
không xảy ra khi 8–10 luồng chạy song song).

## 5. Sự cố trong lúc đo (trung thực, không giấu)

1. **Probe lần 1 chết vì thiếu header CORS** (server HTTP tự chế không
   gửi `Access-Control-Allow-Origin`, element `crossOrigin="anonymous"`
   từ chối load). Đã sửa, lần 2 chạy sạch 6/6.
2. **Probe lần 2 thiết kế rate 0,5 sai vị trí** (gán `playbackRate`
   trước `src` nên không có tác dụng — C-vis chạy 0,93x thay vì 0,5x).
   Phát hiện nhờ `rateReadback`; đã sửa (gán sau seek/load) và chạy
   lại C/D để có phép thử sạch. Số D-vis lần 2 vẫn dùng được cho kết
   luận nhân quả (re-anchor ép ct về 1,0x), nhưng không phải phép thử
   "0,5x sạch".
3. **mediaRate-ct của probe dùng mẫu số cố định 10 s** (khác harness
   presented dùng Δwall thật): phóng đại khi có độ trễ khởi động
   (D-vis chạy lại 1,269x vs ~0,99x thật). Đã đính chính bằng trace.
4. **3 lần idle chết ở gate + 1080p headed chết ở rep 2 slot 6** —
   đều có bằng chứng log, không ghi số rác (xem §1, §3.2).
5. **PIPE_EXIT gây hiểu nhầm (nhắc lại từ T5):** mọi lệnh đo chạy qua
   `> log 2>&1` nên exit của exec là của shell; exit thật của harness
   lấy từ dòng `HARNESS_EXIT=`/`PROBE_EXIT=`/`HEADED*_EXIT=` cuối log.
6. **VM suy kiệt dần trong phiên:** load 0,35 lúc bắt đầu → 32,32 lúc
   cuối; swap đã dùng 395 MB; RAM khả dụng có lúc chỉ 524 MB. Mọi số
   tuyệt đối trong doc này đều mang dấu ấn của cửa sổ tải đó.

## 6. Độ tin cậy & giới hạn

- **Tin được:** re-seek của syncMedia là cơ chế gây ra mediaRate-ct
  ≈ 1,0x trong app (trace bậc thang + bộ đếm +3/+4 video/rep + probe
  tab trắng D-vis); mặt nạ này có điều kiện theo tốc độ seek (§2.4);
  droppedVideoFrames phụ thuộc kiểu tiêu thụ element (§2.2); rVFC đếm
  thiếu hệ thống, tệ nhất trong app dưới tải (7–14%); backport n=0
  hoạt động trong lần chạy headed thật (33/33 slot n>0); tỉ lệ enhance
  720p đầy đủ + 1080p rep 1 khớp ballpark R64; 3 lần gate idle thất bại
  có bằng chứng log.
- **Chưa tin hẳn:** số FPS tuyệt đối dưới tải nặng (dao động 5–10×
  theo cửa sổ — chỉ dùng so sánh tương đối trong cùng cửa sổ, kèm
  loadavg); tỉ lệ enhance 1080p chỉ có n=1 rep (thiếu spread/std);
  nguyên nhân mâu thuẫn gate §4 (chưa chứng minh).
- **Không đo được đợt này:** presented 1080p lúc lặng (3 lần gate
  fail); presented 720p lúc lặng (không đo lại — dùng baseline S8);
  decode 1080p tab trắng đợt này (headed chết trước phase D); FPS máy
  GPU thật (VM không có GPU — nhắc lại).
- **Không thay đổi:** không sửa file production nào (chỉ thêm 2 script
  probe + doc này); thang blend piecewise (không đụng); ngưỡng FPS
  enhance 0,75x (không đụng); không sửa preview.tsx/media.ts/
  previewRafHook.ts; không sửa PerfOverlay/FPS meter; không đụng i18n
  dict chung.

## 7. Nợ mở (chuyển đợt sau)

1. Presented 1080p lúc lặng — đo lại sau khi vá gate presented
   harness (thêm bước đọc canvas như clicktest, §4), hoặc khi VM lặng
   thật (ít luồng chạy). Lệnh chạy lại xem §8.
2. So sánh 720p ↔ 1080p lúc lặng cùng cửa sổ tải (chạy 2 độ phân giải
   liền nhau bằng cùng script).
3. Chạy lại headed 1080p đủ 3 rep khi VM lặng hơn để lấy spread/std
   (nợ §3.2); xác minh gate hook combo slot 6 là artefact tải hay bug
   thật (chạy lại ở load thấp).
4. Điều tra mâu thuẫn gate §4: vì sao presented gate đo được draw
   2–4 trong khi clicktest gate đo được 48–50 cùng clip, cùng code
   gate — giả thuyết wake-up transient / canvas readback warmup.
5. FPS máy GPU thật: chạy `measure-65r8-gpu-harness.mjs` trên máy có
   GPU (nợ S8 §7 mục 1).
6. `ci-security.yml` vẫn chờ quyền workflows (từ Phase 6).
7. Sửa `mediaRate-ct` trong probe tab trắng sang mẫu số Δwall thật
   (như harness presented) để khỏi phóng đại khi khởi động chậm.

## 8. Chạy lại được (harness)

```bash
# Presented 1080p lúc lặng (3 rep × 10 s) + đối chứng tab trắng
cd ~/workspace/repo-1
R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
  R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u4/presented-1080p-idle \
  node apps/web/scripts/measure-65r8-presented-fps.mjs
# Probe mediaRate tab trắng (6 điều kiện × 10 s; chỉ C,D: U4_PROBE_ONLY=C-vis,D-vis)
U4_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u4/mediarate-probe \
  node apps/web/scripts/measure-67u4-mediarate-probe.mjs
# Probe rVFC + re-seek trong app (2 rep × 10 s, không dùng gate draw)
U4_APP_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u4/app-rvfc-probe \
  U4_APP_REPEATS=2 node apps/web/scripts/measure-67u4-app-rvfc-probe.mjs
# Headed đầy đủ sau backport n=0 (720p + 1080p)
R3_LONG_RES=720 R3_LONG_REPEATS=3 \
  R3_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u4/headed-long \
  node apps/web/scripts/clicktest-64r3-fps-long.mjs
R3_LONG_RES=1080 R3_LONG_REPEATS=3 \
  R3_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u4/headed-long \
  node apps/web/scripts/clicktest-64r3-fps-long.mjs
# Phân tích trace currentTime (script phân tích, không phải deliverable)
node /tmp/round67-u4/analyze-trace.mjs hidden_files/round67-u4/mediarate-probe/mediarate-probe.json hidden_files/round67-u4/mediarate-probe-rerun/mediarate-probe.json hidden_files/round67-u4/app-rvfc-probe/app-rvfc-probe.json
```

## 9. Kiểm chứng trong đợt

- `node --check` 2 script probe mới: **đều OK**.
- Probe tab trắng lần 2: **6/6 điều kiện, exit 0**; chạy lại C/D: **2/2, exit 0**.
- Probe trong app: **2/2 rep, exit 0**, markOk=true cả 2 rep, 0 lỗi trang.
- Headed 720p: **2/4 pass** (A-hook + H9 pass; A FPS fail theo thiết kế;
  D decode fail do tải), JSON đầy đủ; RAF stats **21/21 slot n>0**.
- Headed 1080p: gate qua, rep 1 đầy đủ, chết ở rep 2 slot 6 (hook gate,
  load 26–30), exit 2, không JSON; RAF stats **12/12 slot n>0**.
- Idle 1080p: 3 lần thử, **0 slot hợp lệ**, exit 2 cả 3 (gate draw) —
  không ghi số rác.
- Không sửa code production: `node --check` không áp dụng cho production
  (không file nào đổi); tsc/vite build không chạy lại đợt này vì không
  có thay đổi production nào để kiểm chứng (T5 đã chạy tsc 0 + vite
  build pass trên cây gần như tương đương; thay đổi duy nhất sau đó
  trong preview.tsx là đăng ký toast của luồng U5, không thuộc phạm vi
  luồng này).
