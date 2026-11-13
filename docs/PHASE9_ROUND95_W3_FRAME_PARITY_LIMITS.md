# Phase 9 đợt 95 — W3: harness parity pixel đồng bộ theo frame (rVFC WebKit)

**Nợ gốc:** LIMITS gộp đợt 94 §4 mục 3 — parity pixel không chứng minh được
bằng harness V4 (khớp mediaTime ±16 ms, MAD bị pha sọc chi phối).
**Ngày:** 12/11/2026, lượt cron 12:35 +07 (làm việc 05:39–07:1xZ).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **Không sửa code
production** (chỉ harness + tài liệu). Không đụng TTS 39, birefnet, `.github`.
**Trạng thái:** (a) **Harness frame-sync đã xây xong và đã kiểm chứng**
(2 nguồn gắn nhãn + cổng mainDraw, xem §1); (b) **parity frame SẮC NÉT
ĐÃ CHỨNG MINH** — static chr×wk MAD đúng 1,9 mọi frame, scroll-noblur
chr×wk nằm trong jitter của chính cùng-engine (xem §2); (c) **parity BLUR
KHÔNG kết luận được bằng MAD** — output blur dao động theo cửa sổ ring /
timing ngay trong cùng engine, số cặp windowMatched quá ít (xem §3);
(d) **cửa sổ mù clip 1–2 đo lại: ~1,2–2,0 s thường, tới ~3,6 s khi tick
thưa; từ clip 3 memo, ~0,1 s** (xem §4); (e) **kill oan / memo oan trên
Chromium: 0 lần quan sát** trong 3 lượt (xem §5); (f) **nghi rAF throttle
trên WebKit ĐÃ BÁC** — rAF chạy khỏe, app tick thưa do vòng loop/decoder
(xem §6).

## 1. Harness frame-sync — thiết kế, 3 lần sửa, kiểm chứng

### 1.1 Vấn đề của harness V4
Khớp canvas theo mediaTime ±16 ms: cùng đường vẽ chạy 2 lần cũng MAD
~55–76 (sọc cuộn dịch nửa chu kỳ là lật đen↔trắng). Harness mới khớp đúng
`(clip, frameIdx)` — frameIdx = `floor((mediaTime + 1e-6) * 30)`, cùng công
thức `videoFrameIndex` của production. Capture 96×54 grayscale, first-wins
mỗi key; sampler rAF + setInterval 10 ms.

### 1.2 Hai nguồn gắn nhãn + cổng mainDraw (3 lần sửa trong lượt)
- **(a) Tick record** `__vcutTickCost`: `recordTickCost()` gọi CUỐI
  `drawVideoClip`, sau draw cuối lên canvas chính, ở mọi nhánh blend.
  Đọc trong cùng callback JS với lúc chụp canvas (single-thread) nên
  nhãn/pixels không lệch. Nguồn này chỉ có ở tick blend.
- **(b) drawImage wrapper**: patch `CanvasRenderingContext2D.prototype.
  drawImage`, ghi video draws (kèm ct lúc vẽ) VÀ draws lên canvas preview
  (mốc "canvas chính vừa cập nhật"). Cần vì đường direct (cửa sổ mù + mọi
  tick spec không-blur) KHÔNG gọi `recordTickCost`.
- **Sửa 1 (wrapper mù):** bản đầu chỉ ghi video→preview-canvas → 0 draws
  ở mọi lượt. Đọc code (`preview.tsx` ~2929–3110) mới rõ: drawSrc KHÔNG
  BAO GIỜ còn là video element thô lúc vẽ cuối — `plainNativeSource` (M10)
  / deint intermediate / held-frame đều đổi video thành canvas trước.
  Video chỉ còn được vẽ vào canvas trung gian (cùng tick, cùng frame).
- **Sửa 2 (ghi mọi video draw, chưa cổng):** draws > 0 (chr-blur 137–165,
  chr-noblur 332–352) nhưng **gắn sai ±1 frame**: draw video (vào
  intermediate) xảy ra TRƯỚC khi tick vẽ xong lên canvas chính — poll rơi
  vào giữa chừng chụp canvas frame k rồi gắn nhãn k+1. Bằng chứng:
  tagAgree chỉ 56/113 (chr-blur-r1 chạy bù); cặp windowMatched c1|6
  (cùng cửa sổ [-1,-1,-1], đều direct) mà MAD 80,77 — chỉ có lệch nhãn
  mới giải thích được.
- **Sửa 3 (cổng mainDraw, bản cuối):** nguồn (b) chỉ chụp khi mainDraw gần
  nhất xảy ra SAU video draw gần nhất (`m >= d.t` — tick đã vẽ xong lên
  canvas chính) + `|ctGap| ≤ 0,5 s` (ct khớp vị trí timeline, loại draw
  lạ preload/thumbnail — đã bắt được 1 capture ctGap = 2,8 ở probe cũ).
  Mọi lượt từ wk-static-r1 chạy bù trở đi dùng bản này.
- **Kiểm chứng harness:** static chr×chr 105/105 frame MAD đúng 0,0;
  wk×wk 9/9 MAD 0,0 (xem §2). Khi cửa sổ blend khớp nhau thì MAD đúng 0,0
  (chr×chr c1|43, cửa sổ [42,42,39]) — phương pháp tự chứng minh được.

### 1.3 Những gì harness ghi lại mỗi lượt
mtime+md5 `preview.tsx` trước/sau (hủy lượt nếu đổi giữa chừng),
boot id, uptime, loadavg, RAM, số process luồng khác, `rafCount` /
`intCount` riêng, `visibilityState`, `hasFocus`, cửa sổ blend đã vẽ
(`lastDrawn*`), `ctGap` mỗi capture, pump events, `fbAt` / `ringFirstAt`.

### 1.4 Ma trận chạy (14 lượt, probe gated trừ khi ghi chú)
| Config | Chromium | WebKitGTK 27.2 |
|---|---|---|
| scroll-blur (V4) | r1 75, r2 61 (probe chưa cổng), **r3 144 caps / 143 tick / 187 pump** | r1 22, r2 43, r3 46 caps; pump = 0 cả 3 lượt |
| scroll-noblur | **r1 161, r2 170 caps** | r1 42, r2 45 caps |
| static-noblur | **r1 182, r2 155 caps** | r1 47, r2 46 caps |

VOID (không dùng): smoke chr-blur-r1 (17 caps, load 5,7); wk-blur-r1 lượt
đầu (`mtimeChanged=true` — W5 sửa `preview.tsx` 06:15:41Z đúng giữa lượt);
chr/wk-noblur-r1/r2 + chr-static-r1 lượt đầu (caps=0, probe wrapper mù);
wk-static-r1 lượt đầu (34 caps, probe chưa cổng — chỉ dùng phụ cho static,
MAD vẫn đúng 1,9, xem §2). Mọi lượt đã dùng đều `mtimeChanged=false`,
`pageErrs=0`.
**Lưu ý code đổi giữa lượt:** `preview.tsx` đổi 03:07:45Z (md5 6923f2bc) →
06:15:41Z (md5 a4de40d2) do luồng W5 (marker "Đợt 95 W5", re-arm
grace-tick, vùng syncMedia/playhead ~dòng 3824–5671, KHÔNG đụng vùng
pump/rVFC ~1373–1830 hay drawVideoClip/blend ~3100–3400). Các lượt blur
chạy trên bản cũ, noblur/static trên bản W5 — đường vẽ giống nhau nên so
sánh MAD vẫn hợp lệ; mỗi lượt ghi rõ md5 của nó trong JSON.

## 2. Parity frame sắc nét (không blur) — ĐÃ CHỨNG MINH

### 2.1 Clip tĩnh (sanity, không nhạy pha)
- chr×chr: **105/105 frame MAD đúng 0,0** (shift 0 hết).
- wk×wk: **9/9 MAD 0,0**.
- chr×wk (4 cặp, 110 frame khớp): **MAD đúng 1,9 ở MỌI frame** (mean =
  median = p90 = max = 1,9; shift 0 hết). Không phải nhiễu — là chênh
  lệch chuyển đổi hệ thống đều đặn ~1,9 mức xám giữa 2 decoder
  (GStreamer vs Chromium: YUV→RGB / resample làm tròn khác nhau).
  Cộng thêm lượt ungated cũ (23 frame) cũng đúng 1,9.

### 2.2 Sọc cuộn, không blur (frame sắc nét, nhạy pha)
MAD thô bị chi phối bởi jitter pha ngang ±1–2 cột (ở 96 px rộng — tức
~13–27 px ở 1280): cùng một engine chạy 2 lần cũng lệch pha như vậy.
Số liệu gộp (pooling mọi cặp cùng config):
| Cặp | Khớp | Exact (MAD<1) | MAD<5 | MAD mean / median | bestShiftMAD mean / median | Shift {-2..2} |
|---|---|---|---|---|---|---|
| chr×chr | 90 | 40 | 40 | 46,5 / 77,9 | 8,5 / 12,4 | 0:40, ±1:47, ±2:3 |
| wk×wk | 10 | 6 | 6 | 46,5 / 0,2 | 7,9 / 0,2 | 0:6, ±1:2, ±2:2 |
| chr×wk (4 cặp, 99 frame) | 22–28/cặp | **0** | 38 | 51–65 / 77,5–77,6 | **10,3–13,4 / 13,1–14,8** | 0:~38, ±1:~55, ±2:~6 |

- `bestShiftMAD` (MAD sau khi dịch nguyên cột tối ưu) của chr×wk
  (10,3–13,4) chỉ nhỉnh hơn chr×chr (8,5) và wk×wk (7,9) — đúng bằng
  phần chênh chuyển đổi ~1,9 cộng thêm vào phần dư sub-pixel.
- `exact=0` ở chr×wk (so với 40/90 ở chr×chr) giải thích trọn bằng
  chênh 1,9 mức xám: frame nào cùng pha cũng chỉ đạt MAD ≈ 1,9 chứ
  không đạt 0,0 — khớp đúng với số static (38/99 frame chr×wk có
  MAD<5, tức cùng pha + chỉ còn chênh chuyển đổi).
- **Verdict:** parity frame sắc nét ĐẠT, trong giới hạn đo được: (1)
  jitter pha ngang ±1–2 cột có ở cả cùng-engine (không phải lỗi riêng
  WebKit — cần điều tra riêng, xem §7 mục 2); (2) chênh chuyển đổi
  decoder ~1,9 mức xám (đều đặn, không phụ thuộc nội dung).

### 2.3 Bằng chứng chéo bằng cửa sổ blend (blur)
Frame duy nhất mà cả 2 engine cùng cửa sổ blend đã vẽ là c0|0 (direct,
ring rỗng, frame đầu): MAD = **1,88 ở cả 3 cặp chr-blur-r3 × wk-blur**
— đúng bằng chênh chuyển đổi 1,9. Cùng cửa sổ + cùng engine thì MAD
đúng 0,0 (c0|0; c1|43 cửa sổ [42,42,39]). Phương pháp window-match tự
chứng minh được; tiếc là chỉ có 1 frame chéo-engine khớp cửa sổ (xem §3).

## 3. Parity BLUR — KHÔNG kết luận được bằng MAD (nói thẳng)

| Cặp | Khớp | MAD mean / median | bestShiftMAD mean | WindowMatched |
|---|---|---|---|---|
| chr×chr (3 cặp) | 20–29 | 43–47 / 44–51 | 23–29 | 1–2/cặp |
| chr×wk (3 cặp, probe gated) | 10–24 | 56–63 / 52–65 | 30–39 | **1/cặp (chỉ c0\|0)** |
| wk×wk (3 cặp) | 2–11 | 40–66 / 40–51 | 6–29 | 1–2/cặp |

- Cùng-engine blur đã dao động MAD 43–47 (bestShift 23–29) — output blur
  phụ thuộc cửa sổ ring (ghost nào được capture trước đó), mà cửa sổ này
  phụ thuộc timing/tải từng lượt. Ví dụ chr×chr c0|75: cùng frame 75,
  cửa sổ [75,73,69] vs [75,74,63] → MAD 49,7; c2|8: một bên direct, một
  bên blend → MAD 78,0.
- chr×wk (56–63) nằm trong cùng bậc với chr×chr (43–47) và wk×wk
  (40–66) — không tách được "khác engine" khỏi "khác lượt". Số cặp
  windowMatched quá ít (1/cặp, toàn frame 0 direct) để verdict theo cửa sổ.
- **Kết luận:** không claim parity pixel cho blur, cũng không claim có
  khác biệt. Parity blur vẫn dựa vào: cùng đường vẽ
  (`compositeMotionBlurLayer` + `updateMotionBlurSnapshots`, không có
  đường vẽ riêng cho fallback) + parity frame sắc nét §2 + O8 21/21
  (V4). Muốn verdict blur thật cần: (a) chạy lúc VM yên để ring ổn định
  (lượt này tick 1–15/s, ring nhảy lung tung), hoặc (b) ép cửa sổ blend
  giống nhau bằng harness (vd chỉ so frame mà cả 2 bên cùng cửa sổ —
  cần nhiều lượt hơn để gom đủ mẫu).

## 4. Cửa sổ mù clip 1–2 sau fix V4 — đo lại (clip-relative)

Tính từ lúc playhead vào cửa sổ clip (nội suy từ capture) tới lúc
fallback `no-callback` / ring đầu tiên > 0 (2 mốc trùng nhau mọi lượt):

| Lượt WebKit | c0 | c1 | c2 (memo) |
|---|---|---|---|
| wk-blur-r1 (23 tick) | 3383 ms | 3595 ms | ring sau 143 ms, KHÔNG fallback |
| wk-blur-r2 (51 tick) | 1282 ms | 1615 ms | ring sau 84 ms, KHÔNG fallback |
| wk-blur-r3 (47 tick) | 1979 ms | 1189 ms | ring sau 122 ms, KHÔNG fallback |
| V4 post3 (đối chiếu) | 1303 ms | ~1400–1500 ms | KHÔNG fallback |

- Đợt này: c0 1282–3383 ms, c1 1189–3595 ms; điển hình ~1,2–2,0 s, khớp
  V4 (1303–1469 ms) khi tick đủ dày. Khi tick thưa (~1/s, r1) thì cửa
  sổ mù dài tới ~3,4–3,6 s — **fast-path 1000 ms chỉ là sàn; kill chỉ
  được KIỂM TRA trên tick nên nhịp tick chi phối cửa sổ mù dưới tải**.
  V4 đo lúc tick dày hơn nên số V4 không chuyển thẳng sang điều kiện này.
- Memo đã xác nhận lại 3/3 lượt: `silentEngine=true`, c2 không fallback,
  ring đầy từ tick đầu của cửa sổ c2 (~0,1 s).
- Pump WebKit = 0 callback ở cả 3 lượt (lần xác nhận thứ 4 độc lập).

## 5. Nguy cơ kill oan / memo oan trên Chromium — 0 lần quan sát

- 3 lượt Chromium blur (74/63/187 callback): **0 fallback, `silentEngine`
  luôn false**, mọi clip `rvfcFallback=""`.
- Khoảng cách dài nhất giữa 2 callback rVFC liên tiếp: **213 / 534 /
  546 ms** — đều dưới ngưỡng fast-path 1000 ms (lớn nhất = 55% ngưỡng).
  Fast-path không thể kích trong các lượt đã đo.
- **Chưa có bằng chứng kill oan hay memo oan.** Rủi ro còn lại chỉ là lý
  thuyết: main thread kẹt > 1 s đúng lúc frame tiến, ở 2 clip đầu phiên
  mà cả phiên chưa có callback nào → memo arm → rVFC tắt cả phiên trên
  Chromium. Hậu quả nhẹ (đường tick vẫn cho blur + parity vị trí, §2),
  nhưng chưa có cơ chế tự hồi.
- **Đề xuất cơ chế hồi (KHÔNG triển khai trong lượt này — harness-only,
  chưa có bằng chứng đo cần thiết):** khi `silentEngine` đã arm, cứ mỗi
  clip thứ K (vd K=5) vẫn tạo 1 pump thăm dò; pump nào nhận được BẤT KỲ
  callback nào thì xóa `silentEngine` (và `rvfcSilentKills`) để các clip
  sau dùng lại rVFC. Chi phí: 1 cửa sổ mù ~1 s mỗi K clip trên engine
  im lặng thật (hiếm, chỉ khi memo arm oan). Cần đo riêng trước khi sửa
  production: tỉ lệ arm oan dưới tải có kiểm soát + chi phí thăm dò.

## 6. Vì sao tick WebKit thưa — nghi rAF throttle ĐÃ BÁC

- wk-blur-r1 (lượt chạy bù): sampler rAF chạy **10.845 lần**, setInterval
  14.572 lần trong phiên, page `visible`, `hasFocus=true` — rAF chạy
  khỏe (~54/s). Nhưng app chỉ tick **23 lần** trong ~20 s phát.
- wk-blur-r2: sampler chỉ chạy 252 lần (~5/s) — lượt này page đói CPU
  toàn diện. Hai chế độ đói khác nhau giữa các lượt.
- Kết luận: **rAF không bị throttle** (giả thuyết ở log luồng đã bác).
  Nút thắt nằm trong vòng loop của app (`previewLoopShouldSleep` /
  `pauseRetryExhausted` — loop có cơ chế ngủ khi không vẽ được) và/hoặc
  tốc độ trình chiếu của decoder GStreamer dưới tải. Chưa cô lập được
  trigger ngủ chính xác — cần đọc `idleDebug.sleeping` +
  `__vcutLoopMs` trong lượt harness sau (xem §7 mục 3).

## 7. Giới hạn còn lại + nợ mở

1. **Pre-fix vs post-fix pixel: KHÔNG chạy lại được.** Repo local không
   có git; bản GitHub HEAD 5f548ef8 cũ hơn nhiều, không phải baseline
   pre-V4. Thay bằng: chr×wk post-fix + đối chứng cùng-engine + frame
   windowMatched + blind-vs-steady trong lượt (§2–§4).
2. **Jitter pha ngang ±1–2 cột** (96 px rộng) có ở cả cùng-engine:
   40/90 frame chr×chr MAD đúng 0, còn lại lệch pha. Chưa rõ nguyên nhân
   (đặt vị trí sub-pixel / resample moiré của sọc tần số cao / canvas
   backing size theo layout?). Cần clip tần số thấp hơn để tách jitter
   đặt vị trí khỏi lệch frame thật. Harness đã có sẵn shift histogram.
3. **Trigger ngủ của vòng loop WebKit chưa cô lập** (xem §6).
4. **Blur verdict mở** (xem §3): cần lượt yên hơn hoặc nhiều lượt hơn để
   gom frame windowMatched.
5. **Bẫy ground-truth bằng ffmpeg: KHÔNG dùng được cho clip sọc.** So
   capture với frame nguồn ffmpeg-downsample cho MAD ~74 ở frame khớp
   nhất — không phải do gắn nhãn sai mà do **moiré**: sọc tần số cao,
   downsample 1280→96 bằng 2 bộ lọc khác nhau (ffmpeg vs browser
   drawImage) cho pattern khác nhau (chu kỳ ~3 cột vs ~4,5 cột). Script
   kiểm chứng ở `/tmp/round95-w3/check95w3-groundtruth.py` (giữ làm
   bằng chứng âm tính; đừng dùng lại cho clip sọc).
6. **Chênh chuyển đổi decoder ~1,9 mức xám** (chr×wk static): đều đặn,
   nhỏ, chưa rõ là YUV→RGB hay resample. Không ảnh hưởng verdict (đã
   trừ ra bằng so sánh cùng-engine).
7. **Đo dưới tải:** load5/load15 duy trì ~3–5 suốt lượt (9 luồng đợt 95
   chạy song song + ffmpeg sibling); load1 có lúc < 0,5 nhưng cửa sổ yên
   thật ngắn. Mọi số trong LIMITS này đều kèm điều kiện tải trong JSON
   từng lượt (loadAtPlay, envBefore/After). Các lượt về sau nên đợi
   sibling xong hẳn (psOther ≤ 4, như cuối lượt này: tick Chromium vọt
   40 → 143/lượt).
8. **Harness:** probe ghi `mainDraws` nhưng analyzer chưa dùng để đối
   chiếu chéo (chỉ dùng tick-agreement); `tagAgree` đếm cả poll lặp nên
   không phải tỉ lệ theo frame (56/113, 102/133, 106/253 — đọc như chỉ
   báo pha poll, không phải độ đúng nhãn). Cổng `consumedMainT` thừa đã
   bỏ (điều kiện `m >= d.t` là đủ).

## 8. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **exit 0, 0 lỗi** (trên cây đã gồm sửa
  W5, mtime 06:15:41Z).
- `npx vite build`: **PASS, built in 11,79 s** (chỉ cảnh báo chunk >500kB
  có sẵn từ trước).
- `node --check` cả 2 script probe/analyzer + pool script: pass.
- Probe chạy thật: **14 lượt headed** (vite dev + Playwright
  webkit/chromium qua Xvfb), app boot + phát video thật, 0 `pageErrs`,
  0 crash. Tổng caps dùng được: blur 75+61+144+22+43+46, noblur
  161+170+42+45, static 182+155+47+46.
- Không sửa production → không cần chạy lại test suite unit (cây không
  đổi ngoài script/docs; tsc + build đã đủ). Kiểm chứng độc lập gộp do
  W9 (parent gộp sau).

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/probe95w3-frame-parity.mjs` — probe harness mới
  (frame-sync: tick record + drawImage wrapper + cổng mainDraw + chẩn
  đoán rAF + cổng chờ yên + ghi mtime/md5).
- `apps/web/scripts/analyze95w3-frame-parity.mjs` — analyzer MAD theo
  (clip, frameIdx): loại frameIdx ≥90 + stale-biên + |ctGap|>0,5; tách
  MAD steady/blind, windowMatched/Mismatched, tickOnly/drawInvolved.
- `apps/web/scripts/analyze95w3-frame-parity-pool.py` — pooling mọi cặp
  cùng config: exact/near, shift histogram, bestShiftMAD, windowMatch.
- `docs/PHASE9_ROUND95_W3_FRAME_PARITY_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round95-w3-frame-parity`
(`~/workspace/repo-1-push/paths-loop/phase9-round95-w3-frame-parity.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w3.md`.
Dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w3/`
(14 thư mục lượt dùng được + 8 thư mục `-loadsuspect`/VOID + `driver*.log`
+ `analysis-*.json` + script driver). Script kiểm chứng ground-truth
(âm tính): `/tmp/round95-w3/check95w3-groundtruth.py` + frame nguồn
`/tmp/round95-w3/srcframes/` (scratch, không stage).
