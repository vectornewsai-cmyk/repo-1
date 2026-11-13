# Phase 9 đợt 94 — V4: rVFC WebKitGTK 0 callback + fallback nhanh + memo engine

**Nợ gốc:** LIMITS gộp đợt 93 §4 mục 10 — requestVideoFrameCallback không bao
giờ bắn callback trên WebKitGTK (MiniBrowser) dù supported=true; U3 khẳng
định lại (đợt 93): phát sạch 20 s, trình 81 frame, vẫn 0 callback. Preview
pipeline dựa vào rVFC (pump snapshot motion-blur, đợt 91 S1) bị mù trên
engine này.
**Ngày:** 2026-11-12 (lượt cron 09:35 +07; làm việc 02:38–03:25Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **Không sửa code
ngoài phạm vi:** chỉ `preview.tsx` (vùng pump rVFC) + 3 script đo/phân tích
mới + tài liệu này. Không đụng TTS 39, không đụng `.github/workflows`.
**Trạng thái:** (a) **ĐÃ XÁC NHẬN LẠI 0 callback** bằng probe tối thiểu
(WebKitGTK 27.2: 0/4 chuỗi, video phát sạch 74 frame trình chiếu; Chromium
158 cùng trang: 281+139 callback); (b) **ĐÃ SỬA — phương án (a): phát hiện
runtime "rVFC im lặng" + fallback về snapshot theo tick** — cửa sổ mù mỗi
clip rút từ ~2–3 s xuống ~1,0–1,5 s, và từ clip thứ 3 trở đi trong phiên
WebKit thì **không còn cửa sổ mù** (memo engine, đã đo); (c) **parity pixel
(MAD) KHÔNG chứng minh được** bằng harness hiện tại — số MAD bị pha sọc
chi phối (xem §4), parity chỉ dựa vào cùng đường vẽ + O8 21/21 cả 2 engine
+ drift nhỏ; (d) **trần stall không bị fallback phá** (drift playhead −
element tối đa 0,10–0,33 s trong mọi lượt đo, dưới ngưỡng drift 0,35 s).

## 1. Đo lại 0 callback (nhiệm vụ 1) — probe tối thiểu ngoài app

Script `apps/web/scripts/probe94v4-rvfc-webkit.mjs` (copy probe93u3, scratch
`hidden_files/round94-v4/rvfc-<engine>/`). Trang tĩnh, 2 video cùng clip
bóng 6 s (1 hiển thị 640×360, 1 ẩn 1×1 opacity:0), attach rVFC trước khi
play (chuỗi A) + attach lại sau 12 s đã phát (chuỗi B), seek tới 3,0 ở 8 s,
sampler currentTime 100 ms, chạy 20 s, server Range 206.

| Engine | vis A | vis B | hid A | hid B | Video có phát không |
|---|---|---|---|---|---|
| WebKitGTK 27.2 (Playwright webkit-2388, UA Safari/605.1.15 Version/27.2) | **0** | **0** | **0** | **0** | vis phát sạch: 74 frame trình chiếu, dropped 20, ctMax 4,905, 0 lỗi trang; hid ct tới 3,0, 0 frame trình chiếu |
| Chromium 158.0.8127.18 (đối chứng) | 281 | 139 | 258 | 123 | cả 2 video phát + loop, ctMax 6/6 |

`protoHas=true`, `instHas=true` ở cả 2 engine. Đây là lần xác nhận độc lập
thứ 3 (T3 đợt 92: 0 mẫu/5 lượt app; U3 đợt 93: 0/4 chuỗi × 2 lần chạy +
0/7 lượt app; V4: 0/4 chuỗi) — tổng **0 callback trong 12+ lượt app +
3 probe tối thiểu trên WebKitGTK 27.2 + GStreamer của VM này**.

## 2. Sửa — phát hiện "rVFC im lặng" + memo engine (`preview.tsx`, marker "Đợt 94 V4")

### 2.1 Vấn đề của watchdog cũ (đo pre-fix)

Watchdog cũ (đợt 92 T2): ân hạn 500 ms + đếm miss theo thời gian (tối đa
1 miss/500 ms không-capture), 3 miss → kill pump + fallback đường tick.
Trên WebKit, pump được tạo lúc clip bắt đầu phát thì **xoá ring + chặn
snapshot theo tick** (khi pump sống, drawVideoClip không snapshot theo
tick nữa) — nên trong lúc chờ watchdog, ring rỗng → motion blur tắt hẳn.
Đo pre-fix bằng probe trong app (xem §3): cửa sổ mù **~2,0–3,0 s/clip**
(không phải 1,5 s danh nghĩa — tick thưa dưới tải + frameIdx tiến chậm
làm miss đếm muộn), và **mỗi clip lặp lại** (rvfcDeadClips chỉ nhớ theo
clip id, clip sau lại tạo pump mù mới).

### 2.2 Thiết kế sửa (2 cơ chế, cùng fallback về đường tick đã có)

1. **Fast-path "rVFC im lặng"** (`rvfcWatchdogMiss`): pump sống ≥1000 ms
   mà chưa có callback nào (`lastCallbackMs` vẫn là lúc tạo pump — trường
   mới trong `RvfcPumpState`, cập nhật ở MỌI lần `rvfcCallback` bắn, kể cả
   duplicate/skip) VÀ video đã chạy qua ≥1 frame mới → kill ngay với lý do
   `"no-callback"`, không chờ đủ 3 miss. Điều kiện "frame đã chạy qua"
   chặn kill oan khi video pause/seek (frameIdx không tiến) và khi decoder
   chưa có dữ liệu. Ngưỡng 1000 ms = ~3× schedLatency dài nhất U1 đo được
   (~300 ms) và dưới rAF gap max 1310 ms U3 đo ở tải 4×yes — vẫn có thể
   kill oan trên Chromium nếu main thread kẹt >1 s đúng lúc frame tiến
   (xem §5 mục 2).
2. **Memo engine** (`rvfcKillPump` + `ensureRvfcPump`): mỗi lần kill
   `"no-callback"` khi cả phiên chưa thấy callback rVFC nào
   (`rvfcCallbacksSeen === 0`, bộ đếm toàn cục tăng ở mọi lần callback)
   thì `rvfcSilentKills++`; đủ **2 clip** thì `rvfcSilentEngine = true`
   (phơi qua `window.__vcutRvfcSilentEngine` cho harness) và
   `ensureRvfcPump` trả `false` ngay — không tạo pump nữa, đường tick nuôi
   snapshot từ tick đầu tiên. Ngưỡng 2 clip (không phải 1) để 1 lần kill
   oan trên Chromium dưới tải cực đoan không tắt rVFC cả phiên.

Không đổi: ngưỡng drift re-seek 0,35 s; trần giữ R2 15 s; trần resume-stall
5000 ms (V2 đợt 94 sửa re-arm ở vùng khác — file `preview.tsx` stage trong
batch này cũng chứa code V2 + V1, xem §7); hành vi seek/phát ngược; không
thêm đường vẽ mới — fallback dùng đúng đường tick của R1/S1.

## 3. Đo trước/sau trong app (nhiệm vụ 3)

Probe `apps/web/scripts/probe94v4-rvfc-fallback.mjs` (vite dev + Playwright
webkit/chromium headed qua Xvfb): seed spec N clip blur liên tiếp (c0/c1/c2,
mỗi clip 3 s, `stripes-scroll.mp4`, motionBlur frames 3, KHÔNG mask — để
MAD/gradient có ý nghĩa), phát hết project, sampler trong trang 100 ms
(playhead/playing, debug motion-blur, số event `__vcutRvfcPump`,
viaRvfc/frameIdx tick cuối, currentTime mọi element, ảnh canvas downsample
96×54 grayscale). Phân tích bằng
`apps/web/scripts/analyze94v4-rvfc-fallback.mjs`.

### 3.1 Cửa sổ mù + captures (chỉ tiêu chính)

| Lượt | Engine | pumpCallbacks | Fallback (ms tính từ lúc phát) | caps cuối | silentEngine |
|---|---|---|---|---|---|
| pre, mask spec (02:47–02:51Z) | WebKit | 0 | c0 **2982**, c1 **7153** (≈3 s/clip) | 0/0 | — (probe cũ chưa có cờ) |
| pre, mask spec | Chromium | 135 | — (0 fallback) | 74/40 | — |
| pre2, no-mask | WebKit | 0 | c0 **2039**, c1 **5625** (≈2,0 s / ≈2,6 s) | 0/0 | false |
| pre2, no-mask | Chromium | 162 | — | 94/62 | false |
| post, no-mask | WebKit | 0 | c0 **1469**, c1 **6359** (≈1,5 s / ≈1,4 s) | 0/0 | (probe chưa có cờ) |
| post, no-mask | Chromium | 111 | — | 51/45 | (probe chưa có cờ) |
| **post3, no-mask, 3 clip** | **WebKit** | **0** | **c0 1303, c1 4786, c2 — KHÔNG fallback** | 0/0/**0** | **true** |
| post3, no-mask, 3 clip | Chromium | **349** | — | 130/127/86 | false |

Đọc số:
- **Fast-path có tác dụng:** cửa sổ mù clip đầu rút từ 2039 ms (pre2)
  xuống 1469 ms (post) và 1303 ms (post3) — đúng ngưỡng 1000 ms + 1 tick
  (tick thưa 150–300 ms dưới tải). Clip 2 cũng rút (5625 → 4786 ms tính
  từ lúc phát; tính theo cửa sổ clip: ≈2,6 s → ≈1,4–1,5 s).
- **Memo có tác dụng (bằng chứng trực tiếp):** ở lượt post3 WebKit, c2
  KHÔNG có fallback nào, `fb=""`, ring=1 ngay mẫu đầu tiên của cửa sổ c2
  (ph 6,133, rel 7337 ms — tức trong ~1 tick sau khi clip bắt đầu),
  ring=2 ở mẫu kế — snapshot theo tick nuôi ring từ tick đầu, **không còn
  cửa sổ mù**. `silentEngine=true` cuối lượt.
- **Chromium không hồi quy:** 111–349 callback/lượt, 0 fallback,
  caps 45–130/clip, `silentEngine=false` — memo không arm oan khi rVFC
  còn bắn. (firstCb 579 ms ở lượt post 2-clip so với 143 ms ở pre2 là dao
  động tải — loadavg lúc chạy post là 8,76 so với 2,87 lúc pre2; số
  callback và caps vẫn đầy đủ.)

### 3.2 Trần stall (proxy drift playhead − element ct, trừ mẫu quanh biên chuyển clip)

| Lượt | \|drift\| mean | median | p90 | max |
|---|---|---|---|---|
| WebKit pre2 | 0,048 | 0,033 | 0,100 | 0,121 |
| WebKit post | 0,165 | 0,200 | 0,291 | 0,307 |
| WebKit post3 | 0,031 | 0,033 | 0,100 | 0,100 |
| Chromium pre2 | 0,059 | 0,054 | 0,112 | 0,118 |
| Chromium post | 0,037 | 0,029 | 0,078 | 0,102 |
| Chromium post3 | 0,042 | 0,045 | 0,064 | 0,077 |

Playhead bám element trong mọi lượt (max ≤0,31 s, dưới ngưỡng drift
0,35 s) — fallback không phá trần giữ. Lưu ý: các lượt V4 không gặp stall
dài >300 ms nên đây chỉ là proxy "không hồi quy", không phải bằng chứng
trần 5000 ms (bằng chứng trần là U3 đợt 93 + V2 đợt 94).

### 3.3 Click-test O8 cả 2 engine (post-fix)

- Chromium: **21/21 PASS** (scratch `round94-v4/o8-chromium`; S7 Δx=0,112,
  kỳ vọng canvas 0,112).
- WebKit: **21/21 PASS** (scratch `round94-v4/o8-webkit`; S7 Δx=0,194,
  kỳ vọng canvas 0,194).
- 0 lỗi JS/pageerror/crash cả 2 engine.

## 4. Parity pixel — KHÔNG chứng minh được bằng harness hiện tại (nói thẳng)

Đã thử 2 metric trên clip sọc cuộn (`stripes-scroll.mp4`, tương phản cao,
cuộn nhanh), khớp mẫu theo mediaTime ±16 ms:

- **MAD (grayscale 96×54, thang 0–255):** WebKit vs Chromium blind
  64,2 (pre2) / 93,5 (post) / 81,7 (post3); steady 52,1 / 56,5 / 46,6.
  Đối chứng Chromium pre vs post (cùng engine, cùng code đường rVFC):
  blind 75,7, steady 55,5 — tức **cùng một đường vẽ, chạy 2 lần khác nhau
  cũng cho MAD ~55–76**. Sọc đen/trắng dịch nửa chu kỳ là lật đen↔trắng
  (MAD ~128) nên sai số khớp pha ±0,5 frame đã át mọi tín hiệu blur.
  Metric này không đo được parity — số chỉ cho thấy phương pháp sai, không
  phải sản phẩm sai.
- **Gradient ngang (proxy độ mờ):** WebKit pre2 blind 65,5 vs steady
  47,9 (blind sắc nét = không blur; steady mờ = có blur sau fallback);
  post3 blind 60,3 vs steady 49,6. Nhưng gradient phụ thuộc tải theo cách
  khó đoán (khoảng cách tick so với tốc độ decoder quyết định cửa sổ blend
  của đường tick — tick thưa mà decoder cũng chậm thì snapshot vẫn gần
  nhau, ít mờ; Chromium post3 blind 82,9 vs steady 85,1 gần như không
  phân biệt được). Không dùng làm bằng chứng định lượng.

**Kết luận parity trung thực:** chưa có bằng chứng pixel nào cho thấy
fallback cho ảnh ĐÚNG bằng rVFC ở cùng mediaTime. Những gì đứng được:
(1) fallback dùng đúng đường tick của R1/S1, đi qua cùng
`compositeMotionBlurLayer` và cùng `updateMotionBlurSnapshots` — không có
đường vẽ mới; (2) O8 21/21 cả 2 engine (vị trí blob/mask đúng tới 0,001);
(3) drift nhỏ (§3.2). Giới hạn đã biết của đường tick vẫn đứng (S1 §5.1):
snapshot cách nhau theo nhịp tick (~200–400 ms dưới tải) nên cửa sổ blend
rộng hơn rVFC (frame liên tiếp) — blur có nhưng kém chính xác hơn Chromium.
Muốn verdict pixel thật cần harness đồng bộ theo frame (chụp canvas trong
tick kèm frameIdx, khớp đúng frameIdx thay vì khớp currentTime ±16 ms) —
nợ đợt sau (xem §5 mục 4).

## 5. Giới hạn còn lại (trung thực)

1. **Clip 1–2 trên WebKit vẫn mù ~1,0–1,5 s mỗi clip.** Fast-path chỉ rút
   ngắn, không xoá được cửa sổ mù đầu phiên — memo chỉ arm sau 2 clip
   chết. Hạ ngưỡng 1000 ms xuống nữa (vd 500 ms) sẽ tăng nguy cơ kill oan
   trên Chromium dưới tải (rAF gap max 1310 ms đã đo ở load4).
2. **Nguy cơ kill oan + memo oan trên Chromium (chưa gặp, chỉ là rủi ro
   lý thuyết):** main thread kẹt >1 s đúng lúc frame tiến, ở 2 clip đầu
   phiên, mà cả phiên chưa có callback nào → memo arm → rVFC tắt cả phiên
   trên Chromium. Hậu quả nhẹ (đường tick vẫn cho blur + parity vị trí),
   nhưng chưa có cơ chế tự hồi (memo không reset khi callback xuất hiện
   trở lại — vì khi memo đã arm thì không còn pump nào để callback bắn).
   Hướng tương lai: chỉ arm memo khi pump chết mà video đã phát qua ≥2
   cửa sổ 1000 ms không-callback, hoặc reset memo khi element đổi
   engine — chưa làm.
3. **Fast-path cần frame tiến:** decoder stall (frameIdx đóng băng) thì
   kill chờ — cửa sổ mù kéo dài qua stall (lượt post WebKit: playhead kẹt
   ở 0,6 trong lúc element stall đầu, kill vẫn tới ở 1469 ms khi frame
   tiến lại). Không phải lỗi, nhưng số 1000 ms không phải trần cứng của
   cửa sổ mù khi có stall.
4. **Parity pixel chưa chứng minh** (xem §4) — cần harness đồng bộ frame.
5. **Nguyên nhân gốc rVFC WebKitGTK vẫn là suy luận** (backend media player
   theo bug WebKit 267324 — bug đó nói backend WebM, không phải GStreamer;
   chưa đo được từ ngoài trình duyệt). Kết luận "không bao giờ bắn" chỉ
   đứng cho WebKitGTK 27.2 + GStreamer trên VM này (3 lần xác nhận độc lập).
6. **Số đo chỉ cho 1 clip sọc 720p, 3 s/clip, 1 lần chạy mỗi tổ hợp** (trừ
   rVFC tối thiểu chạy 2 engine) — dao động giữa các lượt lớn (cửa sổ mù
   pre-fix 2,0–3,0 s tùy tải). Tải lượt đo: loadavg 1,9–8,8 (luồng sibling
   đợt 94 chạy song song).

## 6. Chuyện bên lề khi đo (đã xử lý, không phải hồi quy)

1. **2 lượt probe no-mask đầu (phase `pre`, 02:55–03:00Z) đo phải code
   đang sửa dở của luồng V2** (V2 sửa `playheadHold90R2.ts` 02:52:36Z và
   `preview.tsx` 03:00:12Z — đúng lúc vite dev của probe đang chạy):
   playhead đóng băng ở 0 suốt 90 s, element paused, dbg rỗng, cả 2 engine
   đều kẹt. Chạy lại ngay sau đó với code đã ổn định thì phát bình thường
   (kiểm tra tay: playhead 2,27 sau 3 s). 2 thư mục kết quả đó đã đổi tên
   thành `fallback-*-pre-INVALID` để không ai đọc nhầm; số pre-fix hợp lệ
   là `pre2` (no-mask) + lượt mask-spec đầu (còn trong log luồng). Bài học:
   khi nhiều luồng cùng sửa `preview.tsx`, probe phải kiểm tra mtime file
   trước/sau lượt chạy và hủy kết quả nếu file đổi giữa chừng.
2. **Lượt probe fallback đầu (mask spec) boot fail 1 lần** ("app không
   boot sau 30 s") — chạy lại với timeout boot 120 s thì lên ngay (vite
   transform chậm dưới tải). Không phải hồi quy.
3. **O8 lần đầu fail "thiếu fixture"** — scratch mới chưa có clip/track;
   đã copy fixture từ `round87-o8/headed` (binary, KHÔNG stage) rồi chạy
   lại 21/21 cả 2 engine.
4. **Analyzer MAD in thừa 1 dòng** (so sánh 2 chiều cùng cặp post3) —
   lỗi in, không ảnh hưởng số.

## 7. Kiểm chứng

- tsc web **0 lỗi** (sau sửa cuối).
- vite build **PASS** (11,09 s).
- `playheadHold90R2.test.ts` **41/41** (31 cũ + 10 mới của V2 đợt 94);
  `previewEngine.test.ts` **25**; `seek.test.ts` **20/20**;
  `seekSkipRender86N3.test.ts` **9/9**; `previewLoop50F2.test.ts` **20/20**.
- O8 Chromium **21/21**, WebKit **21/21** (post-fix).
- Không sửa production ngoài vùng pump rVFC; không đụng TTS 39, không đụng
  `.github/workflows`.

## 8. File thay đổi (stage, KHÔNG push)

- `apps/web/src/preview.tsx` — fast-path "rVFC im lặng" (1000 ms) + memo
  engine (2 clip) + `lastCallbackMs`/`rvfcCallbacksSeen` (marker "Đợt 94
  V4", 6 vị trí + comment đầu khối pump). **Lưu ý: file này cũng chứa sửa
  của V1 (pump/scheduling, nối tiếp U1) và V2 (re-arm trần stall) đợt 94 —
  batch stage toàn bộ file ở trạng thái hiện tại; parent gộp/dedupe lúc
  closing như tiền lệ đợt 92 (T2+T3).**
- `apps/web/scripts/probe94v4-rvfc-webkit.mjs` — probe tối thiểu rVFC
  (copy probe93u3, scratch round94-v4).
- `apps/web/scripts/probe94v4-rvfc-fallback.mjs` — probe trong app
  (cửa sổ mù, captures, drift, canvas 96×54; `--clips N`, `--phase`).
- `apps/web/scripts/analyze94v4-rvfc-fallback.mjs` — phân tích (fallback,
  drift trừ biên clip, gradient vùng video, MAD khớp mediaTime).
- `docs/PHASE9_ROUND94_V4_RVFC_WEBKIT_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round94-v4-rvfc-webkit`
(`~/workspace/repo-1-push/paths-loop/phase9-round94-v4-rvfc-webkit.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v4.md`.
Dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v4/`
(`rvfc-{webkit,chromium}/`, `fallback-*-pre2|post|post3/`, `o8-{chromium,webkit}/`;
2 thư mục `fallback-*-pre-INVALID` là lượt đo phải code V2 đang sửa dở —
không dùng).
