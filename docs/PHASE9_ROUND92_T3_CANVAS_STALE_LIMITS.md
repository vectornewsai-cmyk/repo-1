# Phase 9 đợt 92 — T3: Lag đỉnh do canvas stale dưới tải + stall > 1500ms (nợ LIMITS gộp đợt 91 §4 mục 3)

**Nợ gốc:** LIMITS gộp đợt 91 §4 mục 3 — (a) lag đỉnh còn lại 0,55–0,70 s là canvas
stale dưới tải (S2 §5 mục 1); (b) stall > 1500 ms trả về hành vi cũ (drift re-seek);
(c) số đo seek chỉ cho clip GOP 250.
**Ngày:** 2026-11-11/12 (lượt cron 03:35 +07 12/11). **Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ ĐO, ĐÃ TÁCH THÀNH PHẦN, ĐÃ SỬA (giữ-while-frozen tới trần 5000 ms) + ĐO LẠI —
chu kỳ drift re-seek đã hết ở mọi lượt post (0 re-seek / 5 lượt); lag đỉnh còn lại
0,65–0,85 s là frame trình chiếu của WebKitGTK tụt sau currentTime (tầng pipeline
media, không sửa được từ vòng lặp preview — xem §5 mục 1).

## 1. Đo trước sửa — probe92t3 (mượn kịch bản probe91s2 + tách thành phần)

Kịch bản như S2 (pause-seek có xác nhận tới t=5, rồi `setPlayhead(0.5)` + phát;
sampler trong trang 100 ms ghi playhead, element `__vcutMediaEls`, darkCx canvas →
ballTime). MỚI ở probe92t3 (`apps/web/scripts/probe92t3-canvas-stale.mjs`):
- `--gop 250|30|60`: clip bóng cùng hình học (ô đen 60×60, tâm (0.35+0.05t, 0.5),
  1280×720 30fps 6s, H.264 High) với keyframe thưa/mau — 250 = fixture gốc round87-o8
  (1 keyframe ở t=0); 30/60 = clip sinh mới ở `hidden_files/round92-t3/clips/`
  (keyframe verify bằng ffprobe: GOP30 ở 0/1/2/3/4/5 s, GOP60 ở 0/2/4 s; tâm bóng
  đo bằng PIL tại t=1/t=5 khớp kỳ vọng ±0,0008).
- Sampler ghi thêm mỗi mẫu: ticks vòng preview, holdStats draw/hold/skip, tick bỏ vẽ
  N3, mẫu ring render mới nhất (`__vcutRenderFrameTicks92T3`: preMs/renderMs/
  skipped/held — instrumentation CHỈ ĐO thêm vào `preview.tsx`, xem §3).
- Gắn rVFC riêng lên element bóng (nếu hỗ trợ): `metadata.mediaTime` = frame ĐANG
  TRÌNH CHIẾU → đo trực tiếp "decoder trình frame cũ hơn currentTime".
- Cuối lượt kéo `__vcutPreviewRaf.samples` (gap rAF) + ring render + mẫu rVFC về JSON;
  phân tích bằng `apps/web/scripts/analyze92t3-canvas-stale.mjs` (lag ph/elT-ball,
  stall element, re-seek, khoảng canvas stale + quy thành phần theo ticks/rAF gap/
  renderMs/hold/skip/rVFC lag).

### 1.1 Kết quả trước sửa (5 lượt; loadavg lúc bật tải 3×`yes` ghi trong bảng)

| Lượt | loadavg lúc bắt đầu | stall element sau seekDone | stall > 1500 ms | re-seek | lagEl max | lagPh max | steadyLagMean |
|---|---|---|---|---|---|---|---|
| WebKit + tải, GOP 250 | 13,30 | 2109 ms, 2790 ms | 2 | 2 | 1,886 s | 1,886 s | 0,898 s |
| WebKit + tải, GOP 30 | 3,18 | 2829 / 1991 / 2197 ms | 3 | 2 | 1,506 s | 1,506 s | 0,659 s |
| WebKit + tải, GOP 60 | 9,59 | 1024 ms | 0 | 0 | 0,692 s | 0,692 s | 0,340 s |
| Chromium + tải, GOP 250 | 3,38 | — (không có đoạn ≥ 300 ms) | 0 | 0 | 0,219 s | 0,093 s | 0,030 s |
| WebKit yên, GOP 250 | ~2–4 (không `yes`) | 421 ms | 0 | 0 | 0,163 s | 0,097 s | 0,036 s |

- **Stall > 1500 ms là chuyện thường dưới tải, KHÔNG phải ngoại lệ:** 5/6 stall đo được
  ở GOP 250/30 vượt 1500 ms (tối đa 2829 ms). Stall dài nhất ở GOP 30 (2829 ms) DÀI
  HƠN ở GOP 250 (2109 ms) — **stall do CPU đói, KHÔNG phải do GOP thưa**: keyframe mau
  1 s không rút ngắn stall; pause-seek tElement cũng scale theo tải (GOP 250: 1025 ms
  lúc tải nặng / 241 ms lúc yên; GOP 30: 709 ms; GOP 60: 590 ms) chứ không theo GOP.
  Kết luận S2 "clip GOP dày có thể stall ngắn hơn nhiều" (§5 mục 5) **không đứng** trên
  VM này dưới tải — sửa 1500 ms ít tác dụng không phải vì GOP, mà vì stall vượt ân
  hạn ở mọi GOP.
- **Chu kỳ gây lag đỉnh (GOP 250/30):** stall vượt ân hạn → playhead nhả (grace hết
  giữa stall) → playhead chạy trước media clock +0,57–0,77 s → drift vượt 0,35 s →
  drift re-seek → N3 bỏ vẽ cả chu kỳ re-seek (~1,5–2 s, 14–20/34 tick bị skip) →
  canvas đóng băng trong lúc re-seek → lag đỉnh 1,2–1,9 s. Cả 2 lượt đều 2 re-seek.
- **Canvas stale ở trạng thái ổn định (không churn — rõ nhất ở GOP 60):** 6 khoảng
  stale 200–782 ms, tổng 1901 ms / 4791 ms cửa sổ (40%); trong khoảng stale, tick
  VẪN chạy và VẪN vẽ (draw +1..3, skipN3 = 0, hold = 0) nhưng ballTime không đổi
  trong khi elT tiến 0,2–0,6 s — tức **frame trình chiếu của element tụt sau
  currentTime** (decoder/compositor WebKitGTK không kịp dưới tải), không phải do
  tick không vẽ. rAF gap mean 212 ms, renderMs mean 104 ms, preMs mean 29 ms ở lượt này.
- **Thành phần theo số đo (WebKit + tải):**
  - rAF đói là nền: gap mean 212–459 ms (p50 207–412 ms, max tới 1185 ms) — canvas
    chỉ cập nhật được theo nhịp tick (~2–5 fps dưới tải).
  - preMs (flatten spec + badge + syncMedia trước renderFrame): mean 7 ms lúc yên →
    29–87 ms dưới tải (chủ yếu là trễ scheduling, không phải công việc thật — xem
    lượt yên: preMs mean 7,0 ms, renderMs mean 41,3 ms cho 1 clip plain).
  - renderMs (toàn bộ renderFrame, 1 clip plain): mean 41 ms lúc yên → 104–320 ms
    dưới tải; scale theo tải (Chromium dưới tải: 40 ms) nên phần lớn là descheduling,
    không phải công việc vẽ thật — không có mỡ rõ ràng để cắt ở đây (xem §5 mục 3).
  - N3 skip: 0 ở trạng thái ổn định; 14–20 tick/lượt trong lúc churn re-seek — là
    HỆ QUẢ của stall vượt ân hạn, không phải nguyên nhân gốc.
  - Hold-frame: **0 ở mọi lượt** (holdStats.hold không tăng lần nào) — nhánh hold
    không góp phần vào lag đỉnh trong các lượt đo này.
  - rVFC: **WebKitGTK không bao giờ bắn callback** (0 mẫu / 5 lượt WebKit dù
    `supported=true`) — không dùng được rVFC để đo lag trình chiếu hay để lái vẽ
    lại trên WebKit; cũng là bằng chứng rVFC của S1 không hoạt động trên WebKitGTK
    ở đây. Chromium: 30 mẫu/lượt, lag trình chiếu (ct − mediaTime) mean 0,015 s,
    p95 0,039 s, max 0,067 s — frame trình chiếu gần như trùng currentTime.
- **Chromium không có vấn đề này ở cùng tải:** 0 stall ≥ 300 ms, 0 re-seek, lag max
  0,22 s, chỉ 1 khoảng stale 204 ms / 3718 ms (5%). Canvas stale + stall dài là
  **đặc tính pipeline media WebKitGTK (GStreamer) trên VM này**, không phải lỗi
  vòng lặp preview. Sửa triệt để trạng thái ổn định cần nguồn frame khác (vd
  WebCodecs decode xuôi — ngoài phạm vi luồng này; xem §5 mục 1).

### 1.2 Sự cố lúc đo baseline (đã xử lý, không phải hồi quy)

- Lượt GOP 60 lần 1 fail ở S0: mẫu không tự load sau 240 s (store null) lúc loadavg
  11,51 — trang không load nổi dưới tải cực đoan; chạy lại ngay sau đó pass
  (S0 3,8 s). Lượt GOP 30 post lần 1 fail ở pause-seek t=5 không xác nhận sau 30 s
  (tElement = tCanvas = null — hiện tượng đã biết R2 §4 / S2 §4); chạy lại pass.
  Cả hai đều ở bước setup, trước kịch bản đo, và đường pause-seek không bị sửa
  trong luồng này (giữ resume-stall chỉ kích khi đang phát).
- So sánh trước/sau không cân tải tuyệt đối: các lượt chạy cách nhau ~5–20 phút,
  luồng sibling đợt 92 đến/đi nên loadavg lúc bắt đầu khác nhau (pre GOP 250:
  13,30; post GOP 250: 3,94 và 2,65). Chỉ tiêu chính (0 re-seek; playhead đóng
  băng trong lúc element stall) là hành vi giữ/không-giữ, không phụ thuộc tải —
  như R2 §5.6. Số lag tuyệt đối chỉ so được theo bậc độ lớn, không so từng
  chữ số thập phân.

## 2. Sửa — giữ playhead miễn là currentTime còn đóng băng, tới trần cứng 5000 ms

**Phương án chọn (B) — giữ-while-frozen + trần cứng — thay cho (A) nới ân hạn cố
định 1500 → 3000 ms.** Lý do chọn B bằng số đo: stall đo được 2,0–2,8 s, rải rác
tới 2829 ms — ân hạn cố định 3000 ms chỉ vừa đủ cho các stall đã thấy và vẫn nhả
giữa stall nếu stall dài hơn; B giữ đúng bằng độ dài stall thật (nhả ngay khi
decoder resume, đã chứng minh bằng test T3-R5) nên không phụ thuộc vào việc đoán
trước stall dài bao nhiêu. Trade-off: playhead có thể đóng băng tới 5 s nếu decoder
kẹt thật (trước đây 1,5 s); audio vẫn pause trong lúc giữ (như S2); quá trần thì
trả về hành vi cũ (drift re-seek lo, rồi chu kỳ R2 lại giữ trong lúc re-seek) nên
timeline không đóng băng vĩnh viễn — mỗi chu kỳ playhead vẫn tiến thêm ≥ 0,35 s
trước khi re-seek.

**`apps/web/src/lib/playheadHold90R2.ts`:**
- Thêm `PLAYHEAD_RESUME_STALL_MAX_MS = 5000` (trên mọi stall đo được 2,0–2,8 s, còn
  biên ~2,2 s; dưới trần R2 15 s cho seeking-hold).
- `shouldHoldForResumeStall`: giữ khi đang phát + còn watch + |Δ currentTime| <
  1 frame + chưa quá 5000 ms kể từ lúc seek hoàn tất; nhả ngay khi tăng/lùi ≥
  1 frame hoặc quá trần. `PLAYHEAD_RESUME_STALL_GRACE_MS = 1500` giữ nguyên giá trị
  (pin test S2-R11) nhưng nay chỉ còn là "cửa sổ stall kỳ vọng" trong tài liệu —
  quyết định giữ/nhả dùng trần cứng.
- Test S2-R8 đổi ngữ nghĩa theo (giữ ở 1501 ms khi còn đóng băng; chỉ nhả quá
  5000 ms) — thay đổi có chủ ý, ghi rõ trong tên test.

**`apps/web/src/preview.tsx`:**
- Filter dọn `resumeWatches91S2` dùng trần cứng 5000 ms thay cho ân hạn 1500 ms
  (nếu không watch chết ở 1500 ms trước khi hàm giữ kịp áp dụng trần mới); import
  đổi sang `PLAYHEAD_RESUME_STALL_MAX_MS`; comment khối S2 cập nhật theo.
- Instrumentation CHỈ ĐO (không đổi hành vi): ring `renderFrameTickStats92T3`
  (600 mẫu: t/preMs/renderMs/skipped/held) + hook `window.__vcutRenderFrameTicks92T3`
  — ghi 1 mẫu mỗi tick phát (2 lần `performance.now()` + 1 push). Dùng để tách
  thành phần ở §1; probe đã đọc được ring này ở mọi lượt (21–65 mẫu/lượt).

**Không đổi:** ngưỡng drift re-seek 0,35 s; trần giữ R2 15 s; hành vi seek Q5; phát
ngược; scrub lúc pause; `imageSmoothingQuality` (không có bằng chứng nó là mỡ —
xem §5 mục 3); không thêm đường vẽ rVFC (không bắn callback trên WebKitGTK).

## 3. Kết quả sau sửa (cùng probe, phase post)

| Lượt | loadavg lúc bắt đầu | stall sau seekDone | stall > 1500 ms | re-seek | lagEl max | lagPh max | steadyLagMean |
|---|---|---|---|---|---|---|---|
| WebKit + tải, GOP 250 (#1) | 3,94 | 1285 ms | 0 | **0 (trước 2)** | 0,648 s (trước 1,886) | 0,311 s | 0,104 s (trước 0,898) |
| WebKit + tải, GOP 250 (#2) | 2,65 | 1021 ms | 0 | **0 (trước 2)** | 0,725 s | 0,579 s | 0,268 s |
| WebKit + tải, GOP 30 | 4,99 | 906 ms | 0 | **0 (trước 2)** | 0,647 s (trước 1,506) | 0,383 s | 0,200 s (trước 0,659) |
| WebKit + tải, GOP 60 | 5,45 | 1022 ms | 0 | **0 (trước 0)** | 0,850 s (trước 0,692) | 0,467 s | 0,205 s (trước 0,340) |
| Chromium + tải, GOP 250 | 3,89 | — | 0 | **0 (trước 0)** | 0,166 s (trước 0,219) | 0,070 s | 0,038 s (trước 0,030) |

- **Chu kỳ drift re-seek đã hết ở mọi lượt post (0 re-seek / 5 lượt; trước 2/2/0/0/0).**
  Các khoảng stale còn lại đều là dạng trạng thái ổn định (§1.1): tick vẫn chạy và
  vẫn vẽ (draw +1..3, skipN3 = 0, hold = 0), rAF gap 190–490 ms — tức lag đỉnh còn
  lại là frame trình chiếu WebKit tụt sau currentTime + nhịp tick, không còn là
  playhead chạy trước media clock.
- **GOP 60 pre/post gần như y hệt** (stall 1024 → 1022 ms, 0 re-seek cả hai, lag max
  0,69 → 0,85 s trong biên dao động lượt) — sửa không hồi quy trường hợp vốn đã ổn.
- **Chromium post không hồi quy:** 0 stall, 0 re-seek, 0 khoảng stale ≥ 200 ms
  (trước: 1 khoảng 204 ms); rVFC lag trình chiếu mean 0,004 s (trước 0,015 s).
- **Kiểm chứng:** tsc web **0**; vite build **PASS** (5,91 s);
  `playheadHold90R2.test.ts` **31/31** (25 cũ + 6 mới T3-R1..R6);
  `seek.test.ts` **20/20**; `seekSkipRender86N3` **9/9**;
  `previewLoop50F2.test.ts` **20/20**; click-test O8: Chromium **21/21**,
  WebKit **21/21** (scratch riêng `hidden_files/round92-t3/o8-*`, fixture copy từ
  round87-o8).

## 4. Chuyện bên lề khi đo (đã xử lý trong probe/luồng)

- **JSON lượt GOP 250 post #1 đã bị ghi đè** bởi lượt #2 (cùng phase `post`, cùng
  thư mục scratch — đúng lỗi S2 §4 đã dặn tránh, T3 mắc lại khi kill lượt #2 quá
  muộn: lượt #2 đã chạy xong toàn bộ trong ~23 s vì máy nhẹ đi). Số lượt #1 còn
  trong output analyzer đã in trong log luồng `hidden_files/round92-t3.md`
  (n=24, seekDone 709 ms, stall 1285 ms, 0 re-seek, lagEl max 0,648 s,
  steadyLagMean 0,104 s) + bảng §3 trên; JSON trên đĩa hiện là lượt #2. Bài học
  nhắc lại: phase phải khác nhau cho mỗi lần chạy (vd `post2`), kể cả retry.
- **tsc lúc đầu fail 2 lỗi TS6133** — do luồng T2 đợt 92 đang sửa dở cùng file
  `preview.tsx` (thêm `recordTickCost`/`clipT0` chưa gọi, dòng 882/2189), KHÔNG
  phải do T3. T3 không đụng vùng đó; T2 xong lúc 21:09:59 (recordTickCost đã được
  gọi ở các nhánh mask) thì tsc lại 0. Hai luồng cùng sửa `preview.tsx` ở vùng
  khác nhau, không ghi đè nhau (marker T3 còn đủ 10 match sau khi T2 xong).
- **Lượt GOP 250 post #1 loadavg 3,94 vs pre 13,30** — cải thiện lag tuyệt đối
  (1,886 → 0,648 s) một phần do tải nhẹ đi, không quy hết cho sửa; bằng chứng
  thuộc về sửa là cơ chế (0 re-seek + playhead đóng băng suốt stall ở mọi lượt
  post) và unit test khóa logic giữ tới 5000 ms (T3-R1/R2 ở đúng 2109/2829 ms
  đo được).
- **Chưa bắt được stall > 1500 ms nào ở lượt post** để chứng minh trực tiếp ngoài
  đời rằng watch giữ qua 1500 ms (các lượt post stall dài nhất chỉ 906–1285 ms
  vì tải nhẹ đi cuối lượt). Bằng chứng cho trần 5000 ms là unit test (T3-R1/R2/R5)
  + 0 re-seek ở 5 lượt post; xem §5 mục 2.

## 5. Giới hạn còn lại (trung thực)

1. **Lag đỉnh còn lại 0,65–0,85 s ở trạng thái ổn định là frame trình chiếu của
   WebKitGTK tụt sau currentTime dưới tải** (decoder/compositor không kịp; tick
   vẫn vẽ đều nhưng `drawImage` trả frame cũ). Không có thay đổi nào ở vòng lặp
   preview sửa được điều này — cần nguồn frame khác (WebCodecs decode xuôi, hoặc
   giảm tải decode) và/hoặc giảm nhịp tick. Hướng rVFC không khả thi trên WebKitGTK
   (0 callback dù `supported=true`).
2. **Trần 5000 ms chưa được chứng minh trực tiếp ngoài đời:** chưa có lượt post nào
   gặp stall > 1500 ms (chỉ unit test + 0 re-seek gián tiếp). Nếu lượt sau gặp
   stall 2–3 s mà vẫn re-seek thì trần này có vấn đề — cần đo lại, không mặc định
   là đã xong. Mặt khác, stall > 5000 ms (chưa đo được) vẫn trả về hành vi cũ.
3. **Giữ tới 5 s là đánh đổi có chủ ý:** decoder kẹt thật thì playhead + audio đóng
   băng tới 5 s (trước đây 1,5 s) trước khi drift re-seek cũ lo. Chưa đo trải nghiệm
   người dùng cho trường hợp kẹt thật này (không có clip nào kẹt thật trong các
   lượt đo — mọi stall đều tự resume).
4. **Số đo seek nay bao phủ GOP 30/60/250, nhưng chỉ 1 clip video, 720p, 6 s,**
   1 lần chạy mỗi tổ hợp (trừ GOP 250 post chạy 2 lần) — dao động giữa các lượt
   lớn (stall 906–2829 ms ở cùng GOP 30 tùy tải). Kết luận về GOP (stall không
   phụ thuộc GOP) dựa trên 3 lượt tải, chưa phải phân phối đầy đủ.
5. **Độ phân giải sampler suy giảm dưới tải cực đoan:** `setInterval` 100 ms chỉ
   bắn được 16 mẫu / ~11 s ở lượt GOP 250 pre (loadavg 13,3) — biên khoảng stale
   thô ±~500 ms ở lượt đó; giá trị lag tại thời điểm mẫu vẫn chính xác.
6. **`imageSmoothingQuality="high"` chưa đo chi phí riêng:** renderMs 41 ms lúc yên
   cho 1 clip plain (Chromium dưới tải cũng ~40 ms) là chi phí vẽ thật trên VM
   này; chưa tách được bao nhiêu trong đó là smoothing high vs upload frame.
   Không đổi vì không có bằng chứng nó là mỡ.
7. **Probe tự nó thêm tải:** sampler `getImageData` toàn canvas mỗi ~100–400 ms
   (~10% main-thread) làm nặng thêm staleness nó đo; trước/sau dùng cùng sampler
   nên so sánh tương đối vẫn hợp lệ, số tuyệt đối hơi bi quan.

## 6. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — `PLAYHEAD_RESUME_STALL_MAX_MS = 5000` +
  `shouldHoldForResumeStall` giữ-while-frozen tới trần cứng + tài liệu T3.
- `apps/web/src/lib/playheadHold90R2.test.ts` — S2-R8 đổi ngữ nghĩa + 6 test mới
  T3-R1..R6 (31/31).
- `apps/web/src/preview.tsx` — ring `renderFrameTickStats92T3` + hook đo (chỉ đo);
  filter watch theo trần 5000 ms. (File này cũng chứa sửa của luồng T2 đợt 92 —
  tick-cost instrumentation — ở vùng khác, không xung đột; batch này stage toàn
  bộ file ở trạng thái hiện tại.)
- `apps/web/scripts/probe92t3-canvas-stale.mjs` — probe đo lag canvas stale (mới).
- `apps/web/scripts/analyze92t3-canvas-stale.mjs` — phân tích tách thành phần (mới).
- `docs/PHASE9_ROUND92_T3_CANVAS_STALE_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round92-t3-canvas-stale`
(`~/workspace/repo-1-push/paths-loop/phase9-round92-t3-canvas-stale.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t3.md`.
Probe chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t3/probe-*-pre|post/probe-results.json`
(GOP 250 post #1 đã bị ghi đè bởi #2 — xem §4; số #1 còn trong log luồng + §3).
Clip GOP 30/60: `hidden_files/round92-t3/clips/o8-ball-720p-6s-gop{30,60}.mp4`
(binary, KHÔNG stage — chỉ dùng để đo).
