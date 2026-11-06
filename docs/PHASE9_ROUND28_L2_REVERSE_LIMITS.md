# Phase 9 đợt 28, luồng L2 — Phát ngược mượt hơn + harness phát ngược cho ramp/nested (nợ đợt 27 §3.2) — LIMITS

Ngày: 31/10/2026. KHÔNG push, KHÔNG release/tag, KHÔNG code giả.
Parent lo file paths-loop và build-loop-log; luồng này KHÔNG tự ghi
2 file đó. Không chạm App.tsx, LoadReportPanel, i18n. Phím J và hành
vi mute khi phát ngược giữ nguyên như K4 (không đổi nghĩa, không đổi
hành vi).

## 1. Việc làm (tóm tắt)

- **(§2) Giải thích 54 hold ở pass xuôi GOP thưa bằng số đo** — không
  còn là "nghi ngờ" như K4: chuỗi syncDbg từng tick + 2 thí nghiệm
  đối chứng trong Chromium thuần + phát hiện thêm 1 nguyên nhân gốc
  ở playhead (xem §2.3, CHƯA SỬA — ghi rõ là nợ follow-up).
- **(§3) Harness test phát ngược cho ramp + nested** (mới,
  `reversePlaybackRound28L2.test.ts`, 17 test): mô phỏng đúng vòng
  lặp preview (reverseStep/reversePlayhead + rampSourceTimeAt) trên
  clip ramp, clip reverse (cả 2 chiều playhead) và lá nested đã làm
  phẳng qua buildPreviewSpec.
- **(§4) Cải thiện tốc độ phát ngược, có đo trước/sau trên cùng
  fixture:** 3 biện pháp nối tiếp, mỗi biện pháp đo riêng —
  (a) pacing seek (không phát chồng khi seeking),
  (b) nới lỏng guard vẽ stepping (lag ≤ 2 s khi seek đã xong),
  (c) cửa sổ vẽ ở tick seek vừa hoàn tất (không phát seek mới ở
  tick đó). Kết quả cuối: GOP thưa 1.36 → 7.79 fps hiển thị, hết
  kẹt 8.5 s, verdict PARTIAL → PASS; GOP dày 16.6 → 23.2 fps.
- **(§5) Đánh giá WebCodecs:** đo thật availability +
  isConfigSupported trên Chromium thật; latency decode 1 GOP bằng
  chunk CHƯA đo (không có demuxer trong phạm vi) — ghi rõ, không
  claim 30 fps.

## 2. Giải thích 54 hold ở pass xuôi GOP thưa (nợ K4 §3)

Video đo: sparse-gop-flat.mp4 (1280×720, 30 s, 30 fps, x264, GOP 300,
không B-frame, phẳng theo giây) và dense-gop-flat.mp4 (GOP 30), cùng
harness `clicktest-reverse-hold-pipe.mjs` của K4. Số K4 gốc: pass
xuôi GOP thưa draw 248 / hold 54 / skip 2 / tuổi giữ max 0.67 s;
pass xuôi GOP dày draw 352 / hold 7.

### 2.1 Chuỗi đo được (không đoán mò)

Lượt đo lại baseline đợt này (cùng harness, code K4 chưa sửa):
pass xuôi GOP thưa draw 282 / hold 40 / skip 2 / tuổi giữ max
0.30 s — hold tụ thành cụm, KHÔNG rải đều, KHÔNG chỉ ở đầu pass:

| Cửa sổ mẫu 0.5 s (playhead) | hold tăng thêm |
|---|---|
| 0.3–1.6 s | 0 |
| ~2.3 s | +4 |
| ~3.6 s | +6 |
| ~4.8 s | +9 |
| ~6.0 s | +9 |
| ~7.3 s | +12 |

Lượt đo có instrumentation từng tick (`syncDbg`, bản đo tạm thời,
đã gỡ sạch khỏi cây sau khi đo — xem §6) khóa chặt cơ chế, trên
pass xuôi GOP thưa (327 tick):

- **Mỗi cụm hold bắt đầu NGAY SAU 1 lần drift-seek của syncMedia:**
  seek ở tick 70 → cụm rs<2 tick 71–74; seek 122 → cụm 123–125;
  seek 227 → cụm 228–238 (11 tick); seek 254 → cụm 255–263
  (9 tick); seek 294 → cụm 295–323 (29 tick, trong đó có thêm 1
  seek ở tick 311 khi seek trước chưa xong). Tổng cộng 7 seek
  trong pass, 6 lần là drift-seek (|currentTime − target| > 0.35 s),
  1 lần là forceSeek lúc bấm phát.
- **Trong cụm hold, readyState = 1 và element đang seeking,**
  currentTime đứng yên ở target vừa seek; ngoài cụm, readyState = 4
  và currentTime tiến đều. Tức hold = "decoder đang giải mã lại từ
  keyframe sau seek", không phải decoder đói ngẫu nhiên.
- **Vì sao seek trên GOP thưa đắt:** keyframe duy nhất trong 10 s
  đầu là frame 0, nên seek tới t ≈ 6.5 s bắt decoder giải mã ~195
  frame P liên tiếp mới có frame tại target; trong lúc đó mỗi tick
  vẽ đều rơi vào hold. Trên GOP dày (keyframe mỗi 30 frame) cùng
  1 seek chỉ giải mã ≤ 30 frame nên cụm hold chỉ ~1 tick —
  pass xuôi GOP dày chỉ 5 hold rải rác, mỗi cụm 1 tick.
- **Thí nghiệm đối chứng 1 (Chromium thuần, không code VCut):**
  phát cùng file GOP thưa, chỉ play + drawImage mỗi tick, 8 s →
  **0 tick readyState < 2, 0 seek**; thêm logic drift-seek kiểu
  syncMedia (seek khi lệch > 0.35 s) → vẫn 0 seek (drift không
  bao giờ vượt ngưỡng trong môi trường thuần). Kết luận: cụm hold
  KHÔNG đến từ bản thân file/Chromium, mà từ vòng lặp VCut (seek
  + playhead, xem §2.3).
- **Thí nghiệm đối chứng 2:** blob URL + Web Audio routing +
  drawImage 1280×720 mỗi tick, 8 s → currentTime chạy đúng 0.98×
  wall, chỉ 5 tick rs<2. Loại trừ blob/WebAudio/canvas khỏi danh
  sách nghi phạm.

### 2.2 Chuỗi nhân quả đầy đủ (đã đo từng mắt xích)

1. Playhead của store chạy NHANH hơn wall clock trong harness
   (1.16×, xem §2.3), trong khi currentTime của element chạy đúng
   1.00× wall ở đoạn sạch (đo: +0.800 s currentTime / 0.799 s wall).
2. Độ lệch (playhead − currentTime) tích lũy ~0.25 s mỗi giây
   wall → chạm ngưỡng drift-seek 0.35 s sau mỗi ~1.2–1.4 s phát.
3. Mỗi drift-seek trên GOP thưa làm readyState tụt xuống 1 trong
   3–29 tick (càng về sau càng dài vì khoảng giải mã từ keyframe 0
   càng lớn; seek ở 6.5 s gây cụm 29 tick và kéo theo 1 seek chồng
   ở tick 311 làm cụm kéo dài thêm).
4. Trong các tick đó drawVideoClip rơi vào hold (đã có frame tốt
   cũ) → cộng dồn thành ~40–54 hold mỗi pass 6–7 s. Tuổi giữ max
   0.30–0.67 s = đúng độ dài cụm hold dài nhất theo playhead.
5. Trên GOP dày, cùng chu trình xảy ra nhưng mỗi seek chỉ gây
   ~1 tick hold nên tổng chỉ 5–7 hold.

### 2.3 Phát hiện thêm: playhead chạy nhanh do snap làm tròn nửa frame (CHƯA SỬA)

Đây là mắt xích (1) ở trên, và là phát hiện quan trọng nhất của
đợt về mặt trung thực — nhưng nó nằm NGOÀI phạm vi luồng này
(vòng lặp phát xuôi dùng chung, không phải vùng phát ngược/hold),
nên chỉ ghi lại, không sửa:

- Đo có wall clock: playhead +7.167 s / 6.189 s wall = **1.158×**;
  Σdt của chính vòng lặp = 6.032 s ≈ wall (1.012×) nên dt không
  sai; nhưng playhead/Σdt = 1.227×.
- Nguyên nhân: `setPlayhead` snap bằng `Math.round` về frame gần
  nhất. Ở 30 fps, 1 tick rAF ~16.7 ms = ĐÚNG nửa frame; `Math.round`
  làm tròn nửa lên (0.5 → 1) nên tick nào có dt ≥ 16.67 ms cũng
  bước NGUYÊN 1 frame (33.3 ms), tick nào dt nhỏ hơn thì bước 0.
  Đo được: 63.37% tick có dt ≥ 1/60 s — ĐÚNG BẰNG tỷ lệ tick mà
  playhead bước (63.37%); snap(prev + dt) khớp playhead thực tế
  ở cả 344/344 tick. Tốc độ playhead thực = tỷ lệ tick vượt ngưỡng
  × 1 frame/tick, nhạy với tần suất tick quanh 60 Hz.
- Đã loại trừ: rAF timestamp (trang thuần cho Σdt/wall = 1.0000),
  nhiễu lấy mẫu CDP (trang thuần + evaluate mỗi 500 ms cho
  0.9997), 2 vòng lặp (effect `[]` + cleanup cancelAnimationFrame
  đầy đủ), snap khác (toFrames dùng Math.round, đã đọc code).
- Hệ quả: drift-seek chu kỳ ở §2.2 phần lớn là HỆ QUẢ của bug
  làm tròn này, không phải element chạy chậm. Sửa đúng là tích lũy
  phần dư frame như reverseStep đã làm cho chiều ngược (hoặc snap
  theo kiểu không thiên vị ở biên nửa frame) — việc của luồng
  khác, cần quyết định riêng vì chạm vòng lặp phát xuôi dùng chung
  và mọi phép đo playhead. **Cho đến khi sửa, mọi con số hold ở
  pass xuôi trong harness đều mang thành phần phình playhead này
  và không được đọc như "decoder yếu".**
- Lưu ý đo: maxHoldAgeSec = 22.77 s ở lần chạy sau fix là ARTIFACT
  thống kê, không phải hold run thật: firstHeldT từ cuối pass xuôi
  (~6.73 s) sống sót qua lần nhảy playhead bằng phím End (nhánh
  pause không vẽ lại nên không reset), rồi tick hold đầu tiên của
  pass ngược ở 29.5 s ghi tuổi |29.5 − 6.73| = 22.77 s. Chỉ số đáng
  tin là drawDelta theo cửa sổ mẫu và graySeconds, không phải
  maxHoldAgeSec khi có nhảy playhead. (Không sửa stat trong đợt
  này để khỏi làm lệch so sánh; ghi làm follow-up.)

## 3. Harness test phát ngược cho ramp và nested

File mới `apps/web/src/lib/reversePlaybackRound28L2.test.ts`
(17 test, xem §6): mô phỏng đúng vòng lặp preview — playhead lùi
bằng reverseStep/reversePlayhead (tick 16 ms), target seek bằng
rampSourceTimeAt (đúng hàm collectActives dùng).

- **Ramp (linear 1→2 trên [0,4], clip start 10):** playhead lùi
  14→10 thăm đúng 121 frame, mỗi frame đúng 1 lần; source giảm
  đơn điệu 6→0 trong biên; bước source gần cuối ramp ≈ 2/30 s
  (speed 2) gấp ~2× bước gần đầu ramp ≈ 1/30 s (speed 1) — chứng
  minh mapping ramp được tôn trọng ở chiều ngược, không phải
  mapping tuyến tính trá hình.
- **Clip reverse:** phát xuôi source giảm 6→0 khi playhead tiến;
  phát ngược toàn cục source tăng 0→6 khi playhead lùi (181 frame,
  đơn điệu) — đúng chiều ở cả 2 chế độ.
- **Nested mang ramp:** buildPreviewSpec → 1 lá trên track
  `__nested-video` (start 10, duration 4); ngược đơn điệu, biên
  [0, 6], và tại t = 12 (localT = 2) source = 2.5 khớp đúng clip
  ramp thường — parity nested/ramp ở chiều ngược.
- **Pacing + guard (unit):** shouldIssueStepSeek (seeking → không
  phát; lệch ≤ eps → không phát, đúng biên bằng eps cũng không);
  stepDrawAllowed (khớp nửa frame → vẽ; seek xong + lag ≤ 2 s →
  vẽ; đang seeking mà lệch → không vẽ; lag > 2 s → không vẽ,
  đúng case mới bật ngược mà element còn ở frame cũ xa target);
  justCompletedSeek (chỉ true khi tick trước seeking, tick này
  hết seeking).
- **Simulator pacing (model, không phải số đo phần cứng):**
  GOP thưa luật cũ 588 issue / 578 phát chồng / 10 hoàn tất (chỉ
  gần keyframe); luật mới 69 issue / 0 phát chồng / 69 hoàn tất.
  Model dùng tốc độ giải mã giả định 10 frame/tick chỉ để so sánh
  tương đối 2 luật trên cùng tham số — số đo thật ở §4, không lấy
  số simulator làm fps.

## 4. Cải thiện tốc độ phát ngược (đo trước/sau, cùng fixture, cùng harness)

Fixture và phương pháp: harness K4 (`clicktest-reverse-hold-pipe.mjs`),
pass ngược 14 s, playhead 29.5 → ~15.8, chỉ số chính là drawDelta
(tick vẽ trực tiếp) → fps hiển thị = drawDelta / 14, và graySeconds
(khung hình suy ngược từ mức xám, phải giảm đơn điệu theo playhead).

### 4a. Pacing seek — không phát chồng khi seeking (đo: KHÔNG tăng fps một mình)

- Vấn đề đo được (syncDbg, trước fix): 410/426 seek phát TRONG LÚC
  seek trước còn bay, mỗi lần với target mới (playhead bước 1 frame
  mỗi 2 tick, seek cũ chưa xong đã bị thay thế) → decoder khởi
  động lại từ keyframe liên tục. Trên GOP thưa, seek không bao giờ
  hoàn tất ngoài vùng gần keyframe.
- Sửa (`shouldIssueStepSeek` + 2 nhánh stepping trong syncMedia):
  khi `el.seeking` thì không phát seek mới; khi hết seeking mới
  seek tới target hiện tại.
- Kết quả đo: GOP thưa drawDelta 19 → 20 (1.36 → 1.43 fps, không
  đổi thực chất, vẫn kẹt 8.5 s); GOP dày 233 → 208 (16.6 → 14.9 fps,
  trong biên dao động giữa các lần chạy — K4 đo 201). Kết luận
  trung thực: pacing một mình KHÔNG tăng fps; giá trị của nó là
  dẹp cơn bão restart (410 phát chồng → 0 trong model, 426 issue →
  120 issue đo được) và biến "seek hoàn tất" thành đại lượng có
  giới hạn — tiền đề cho 4b và 4c. Giữ lại vì đúng đắn, không vì
  số fps.

### 4b. Nới lỏng guard vẽ stepping — lag ≤ 2 s khi seek đã xong (đo: vẫn chưa đủ)

- Vấn đề: guard K4 chỉ vẽ khi element khớp target trong nửa frame.
  Trên GOP thưa, 1 seek hoàn tất sau ~0.23–0.32 s (đo: các lần hoàn
  tất cách nhau ~14–19 tick), trong lúc đó playhead đã lùi 7–9
  frame nên guard chặn mọi draw dù seek vẫn hoàn tất đều.
- Sửa (`stepDrawAllowed`, `MAX_STEP_DRAW_LAG_SEC = 2`): khớp nửa
  frame → vẽ như cũ; seek đã xong (!seeking, frame đã có qua
  readyState ≥ 2) + lệch ≤ 2 s → vẽ; đang seeking mà lệch → vẫn
  hold; lệch > 2 s (vd mới bật ngược, element còn ở frame cũ cách
  xa) → vẫn hold. Frame vẽ ra luôn mới hơn frame giữ cũ vì target
  stepping đơn điệu (ngược toàn cục: target giảm dần; clip
  reverse: target tăng dần khi playhead lùi — cả 2 đều đơn điệu
  theo chiều phát) và lag bị chặn 2 s — đánh đổi có chủ ý, ghi rõ
  ở đây thay vì giấu: khung hình hiển thị có thể chậm sau playhead
  tới 2 s trong lúc decoder đói, nhưng không bao giờ là frame cũ
  nhiều giây như trước.
- Kết quả đo (pacing + guard, chưa có 4c): GOP thưa drawDelta 16
  (vẫn kẹt, gray 5×18 mẫu rồi nhảy lên 20) — guard nới lỏng KHÔNG
  có tác dụng một mình. Nguyên nhân tìm ra ở §4c.

### 4c. Cửa sổ vẽ ở tick seek vừa hoàn tất (đo: đây mới là mắt xích quyết định)

- Phát hiện từ syncDbg sau 4a+4b: seek HOÀN TẤT đều (103 lần,
  mỗi ~14–19 tick), và ở tick hoàn tất readyState = 4, currentTime
  = target cũ — nhưng đúng tick đó syncMedia (chạy TRƯỚC
  renderFrame mỗi tick) phát ngay seek tiếp theo, làm seeking
  thành true và readyState tụt về 1 trước khi renderFrame kịp vẽ.
  Frame vừa xong không bao giờ được vẽ: 103 lần hoàn tất, 0 lần
  vẽ tương ứng. Đây là lý do 4b không có tác dụng.
- Sửa (`justCompletedSeek` + WeakMap `steppingPrevSeeking` trong
  preview.tsx, cả 2 nhánh stepping): tick mà seeking vừa chuyển
  true → false thì KHÔNG phát seek mới — renderFrame tick đó vẽ
  frame vừa xong (lag ≤ 2 s theo guard 4b); tick sau mới seek tiếp.
  Chi phí 1 tick chờ mỗi chu kỳ seek (~14–19 tick trên GOP thưa,
  ~1–2 tick trên GOP dày) — không đáng kể so với latency seek.
- Kết quả đo cuối (pacing + guard + cửa sổ vẽ):

| Fixture | Trước (K4) | Sau (đợt này) | Verdict harness |
|---|---|---|---|
| GOP thưa (g 300) | draw 19 → **1.36 fps**, gray kẹt 6 suốt 8.5 s rồi nhảy lên 20, PARTIAL | draw 109 → **7.79 fps**, gray giảm đơn điệu 29→15 theo playhead, **PASS** | Hết kẹt 8.5 s |
| GOP dày (g 30) | draw 233 → **16.6 fps**, gray khớp playhead | draw 325 → **23.2 fps**, gray khớp playhead, tuổi giữ max 0.10 s | PASS (như trước, nhanh hơn) |

- Chi tiết GOP thưa sau fix: draw rải đều MỌI cửa sổ mẫu 0.5 s
  (2–11 draw/cửa sổ, nhiều nhất 8–11 khi playhead gần keyframe
  20 s, ít nhất 2–3 khi xa keyframe) — không còn cửa sổ 0 draw nào.
  Frame hiển thị lag sau playhead tối đa ~0.3 s (1 chu kỳ seek)
  trong đoạn đo, dưới ngưỡng 2 s của guard.
- Không đạt 30 fps thật trên GOP thưa (7.79 fps): giới hạn còn lại
  là latency 1 seek (~0.23–0.32 s, giải mã tới ~300 frame từ
  keyframe) — mỗi chu kỳ seek chỉ cho 1 frame vẽ. Muốn 30 fps thật
  cần cache frame kiểu WebCodecs (§5), không thể đạt bằng seek
  element. Không claim 30 fps.

## 5. Đánh giá khả thi WebCodecs decode tay cho ngược 30 fps thật

Đo thật trên Chromium thật (cùng VM, headed qua Xvfb):

- `VideoDecoder` có sẵn: **true**.
- `isConfigSupported({codec: "avc1.64001F", 1280×720})` (đúng
  codec fixture: H.264 High, level 3.1): **supported = true**
  (mặc định và prefer-software); **prefer-hardware = false**
  (VM không có GPU decode).
- Tạo decoder + configure thật: state = **"configured"**.
- **Latency decode ngược 1 GOP bằng chunk: CHƯA ĐO.** Để đo cần
  demuxer MP4 → EncodedVideoChunk (avcC) trong trang đo, nằm ngoài
  phạm vi luồng này; không có số đo thì không claim.
- Kết luận trung thực: WebCodecs KHẢ THI về mặt API (decoder có,
  config được, software decode chấp nhận được cho 720p), nhưng
  30 fps ngược thật vẫn cần thêm 2 khối việc lớn chưa làm:
  (1) demux MP4 + gom chunk theo GOP; (2) cache frame đã giải mã
  (decode xuôi 1 lần từ keyframe rồi bước ngược qua cache — đây
  mới là cách phá giới hạn latency-seek của element, vì cache cho
  phép vẽ mọi frame mà không seek lại). Ước lượng: việc lớn, cần
  luồng riêng; không hứa 30 fps cho đến khi đo được latency
  decode + chi phí bộ nhớ cache (300 frame 720p RGBA ≈ 1.1 GB
  nếu cache nguyên — cần cache ở độ phân giải preview hoặc cửa
  sổ trượt, cũng là quyết định sản phẩm chưa có).
- Hướng rẻ hơn nếu chỉ cần "mượt hơn nữa" mà không cần 30 fps
  thật: giữ nguyên đường element + 3 biện pháp §4 (đã đạt 7.8 fps
  GOP thưa / 23.2 fps GOP dày); phần còn thiếu chủ yếu là GOP thưa
  — đúng trường hợp WebCodecs cache phát huy.

## 6. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/lib/reversePlayback.ts` — thêm
  `shouldIssueStepSeek`, `MAX_STEP_DRAW_LAG_SEC = 2`,
  `stepDrawAllowed`, `justCompletedSeek` (chỉ thêm, không đổi hàm
  cũ; 1 lần sửa nhầm làm mất dòng mở comment của seekOnTarget đã
  được phát hiện qua test fail và sửa lại ngay, verify bằng test
  pass + tsc).
- Sửa: `apps/web/src/preview.tsx` — CHỈ vùng phát ngược/hold:
  import thêm 3 helper (+ bỏ import seekOnTarget nay không dùng
  trực tiếp, còn nhắc trong comment đã sửa tên thành
  stepDrawAllowed); guard vẽ stepping dùng stepDrawAllowed thay
  seekOnTarget; WeakMap steppingPrevSeeking; 2 nhánh stepping
  trong syncMedia (ngược toàn cục + clip reverse) dùng pacing +
  cửa sổ vẽ ở tick hoàn tất. Không đụng vùng vẽ transition/dip/
  mask, không đụng App.tsx/LoadReportPanel/i18n. Diff so với
  trước đợt: ~42 dòng thay đổi.
- Mới: `apps/web/src/lib/reversePlaybackRound28L2.test.ts` —
  17 test (ramp, clip reverse 2 chiều, nested phẳng, 3 helper,
  simulator pacing).
- Sửa: `apps/web/tsconfig.json` — thêm file test mới vào exclude
  (đúng quy ước repo: mọi *.test.ts đều exclude).
- Mới: `docs/PHASE9_ROUND28_L2_REVERSE_LIMITS.md` — file này.
- Build output `apps/web/dist/` đã build lại tại chỗ để đo —
  parent quyết có stage hay không. Scratch đo (JSON harness các
  lượt, syncDbg, thí nghiệm Chromium thuần, probe WebCodecs) nằm
  ở `~/workspace/tmp-round28-l2/` và KHÔNG đưa vào repo.

## 7. Kiểm chứng

- `reversePlaybackRound28L2.test.ts`: **17/17 pass** (mới).
- Hồi quy: `reversePlayback.test.ts` 10/10, `holdFrame.test.ts`
  13/13, `previewEngine.test.ts` 14/14, `nestedPreview.test.ts`
  46/46, `nestedRampPreview.test.ts` 34/34,
  `transitionPreview.test.ts` 31/31.
- `tsc --noEmit`: sạch (0 lỗi) tại thời điểm kiểm tra cuối.
- `vite build` pass (bundle sau cùng build lại sau lần sửa
  comment cuối).
- Harness trình duyệt thật (CDP pipe, mẫu K4): bảng §4 — mỗi con
  số đều từ 1 lần chạy harness đầy đủ, không lấy từ simulator hay
  ước lượng. Riêng pacing-only và guard-only cũng chạy harness
  riêng để tách tác dụng từng biện pháp (đo ở §4a/§4b).
- Hành vi giữ nguyên: phím J = phát ngược/dừng ngược, mute toàn
  bộ khi phát ngược toàn cục, mute clip reverse như cũ; nhánh
  pause/scrub không đổi (guard nới lỏng chỉ áp dụng khi stepping);
  phát xuôi không đổi code (chỉ phát hiện bug snap §2.3, chưa sửa).

## 8. Nợ còn lại — đọc kỹ trước khi coi là xong

1. **Bug playhead chạy nhanh do snap nửa frame (§2.3):** nguyên
   nhân gốc của chu kỳ drift-seek ở pass xuôi; cần luồng riêng
   sửa vòng lặp phát xuôi (tích lũy phần dư frame như reverseStep
   hoặc snap không thiên vị ở biên). Chưa sửa trong đợt này theo
   đúng phạm vi luồng.
2. **30 fps ngược thật trên GOP thưa:** đường element dừng ở
   ~7.8 fps (giới hạn latency seek); cần WebCodecs + cache frame
   (§5) mới phá được — việc lớn, chưa làm.
3. **maxHoldAgeSec qua nhảy playhead (§2.3 cuối):** firstHeldT
   không reset khi playhead nhảy (phím End) làm stat này phóng đại;
   nên reset firstHeldT khi playhead nhảy cóc hoặc đo tuổi giữ theo
   tick thay vì theo playhead — follow-up nhỏ cho tầng thống kê.
4. **WebCodecs chunk latency:** chưa đo (cần demuxer); đừng claim
   30 fps WebCodecs cho đến khi có số đo decode 1 GOP thật.
5. **Frame cache / pre-decode cửa sổ lân cận bằng element phụ:**
   đã cân nhắc và KHÔNG làm — element phụ cũng phải seek từ cùng
   keyframe nên không nhanh hơn, lại tranh CPU decoder trên máy
   2vCPU; cache chỉ có ý nghĩa khi đi kèm WebCodecs (§5).
6. **Phát ngược + audio đồng bộ:** vẫn mute như K4 (không đổi).
   Render export vẫn dùng `areverse` nên bản xuất có tiếng ngược
   thật — chỉ preview là im.
7. **Hành vi khi seek cực dài (> 2 s):** guard vẫn hold như cũ;
   trên GOP cực thưa (vd 10 s/keyframe ở 4K) tốc độ hiển thị sẽ
   thấp hơn số đo 720p ở đây — chưa đo 4K.
