# Phase 9 đợt 31, luồng N2 — Đo lại fps ngược lúc máy rảnh + instrument gap rAF — LIMITS

Ngày: 01/11/2026 (giờ +07; log harness ghi UTC 31/10 19:13–19:22).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này KHÔNG sửa code sản phẩm, KHÔNG chạm file của luồng khác
(seek.ts, CLI, i18n, script CDP khác, dip đều không đụng), KHÔNG tự
ghi paths-loop hay build-loop-log (parent gộp). Nhiệm vụ duy nhất:
(1) đo lại fps ngược lúc máy rảnh để kết luận có/không hồi quy so
với đợt 28; (2) instrument gap rAF để kiểm chứng giả thuyết clamp
dt 0.1 s gây chạy chậm dưới tải nặng (đợt 30 M2 §4 chỉ ghi "phù hợp
với", chưa chứng minh).

## 0. Kết luận ngắn (không vượt số đo)

1. **KHÔNG hồi quy fps ngược.** Lúc máy rảnh: GOP thưa **8.97 fps**
   (đợt 28: 7.79 — tăng ~15%); GOP dày 2 lượt rảnh **18.42** và
   **24.05 fps** (đợt 28: 23.2 — trung bình 21.2, khoảng dao động
   bao phủ 23.2). Số đợt 30 M2 thấp (2.71 / 5.36 fps) đúng là cận
   dưới dưới tải, không phải hồi quy — đã được xác nhận bằng đo
   lại, không còn là suy luận.
2. **Cơ chế chạy chậm dưới tải đã được CHỨNG MINH, không còn chỉ
   "phù hợp với".** Lượt tải nặng có kiểm soát (4 tiến trình busy
   loop bão hòa 4 CPU, load 5.1–6.7): tốc độ xuôi nội suy đo được
   **0.760×** — nằm trong đúng dải 0.72–0.84× của đợt 30 M2 — và
   probe rAF ghi được **7 gap > 100 ms sustained** trong phase
   xuôi (P50 gap 78.8 ms, P95 119 ms, so với P50 8.3 ms lúc rảnh).
   Mô hình clamp `dt = min(0.1, gap)` dự báo 0.81–0.83×, cùng dải
   với 0.760× đo được; phần chênh ~0.05–0.06 giải thích được ở §4
   (probe đo gap giữa mọi callback rAF toàn trang nên ước lượng
   loss là cận dưới). Không còn cần giả thuyết khác cho chiều chậm.
3. **Lúc rảnh, rAF hoàn toàn khỏe:** 0 gap > 100 ms sustained ở cả
   3 lượt rảnh (sau khi trừ tick biên, xem §2); tốc độ xuôi nội
   suy 0.990–0.997×; dự báo từ gap khớp số đo trong 0.003.
4. **30 fps ngược thật vẫn là nợ, không claim.** GOP thưa 8.97 fps
   và GOP dày ~21 fps đều dưới 30; bottleneck là seek/decode
   (holdDelta ngược 638 / 389–474) chứ không phải rAF — xem §5.
   Vẫn cần WebCodecs + demux + cache frame như đợt 28 §5.
5. **Phát hiện phụ — phương sai đo fps ngược lớn:** 2 lượt GOP dày
   lúc rảnh cho 18.42 và 24.05 fps (±~25% quanh trung bình). Mọi
   so sánh fps ngược bằng 1 lượt đơn đều không đủ kết luận; đợt
   sau muốn khóa số phải chạy lặp ≥ 2 lượt và báo khoảng, không
   báo 1 số.

## 1. Phương pháp đo (harness mới, fixture cũ, bundle cũ)

- Harness mới: `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  — sao từ harness M2 đợt 30, chỉ khác: (a) scratch qua env
  `N2_SCRATCH`, riêng mỗi lượt (không lặp lỗi ghi đè của M2 §6.2);
  (b) display/port mặc định :98 / 4198 để không đụng luồng N1
  chạy song song; (c) probe rAF + ghi loadavg (xem §2); (d) thêm
  `interpRate` (mẫu 2 → cuối, kiểu M2), `fps` ngược = drawDelta /
  wall ngược, và biến thể `exclFirst` cho phân tích gap. Mọi bước
  còn lại (seed autosave rỗng, import qua input file thật, bấm nút
  transport thật, xuôi 6 s rồi ngược 14 s) giữ nguyên M2/K4.
  `node --check` pass.
- Fixture y nguyên đợt 28 (không tạo mới):
  `~/workspace/tmp-round27-k4/sparse-gop-flat.mp4` (GOP 300) và
  `dense-gop-flat.mp4` (GOP 30); cả hai 1280×720, 30 s, 30 fps,
  H.264, đã xác nhận lại bằng ffprobe trước khi đo.
- Bundle đo: `index-C0HfodWe.js` (979512 bytes), sha256[:32] =
  `fda3c753e1dccec122887eddb1d2c68a` — khớp bundle đợt 30, và
  sha KHÔNG đổi sau cả 4 lượt (N1 không build lại dist giữa các
  lượt đo, hoặc build lại byte-identical). Snapshot dist được
  copy về scratch mỗi lượt nên lượt đo không bị ảnh hưởng nếu
  dist trên đĩa đổi giữa chừng.
- 4 lượt chạy: (1) GOP thưa lúc rảnh, (2) GOP dày lúc rảnh,
  (3) GOP thưa dưới tải nặng có kiểm soát (4 busy loop, xem §3),
  (4) GOP dày lúc rảnh lặp lại (kiểm tra phương sai, sau khi đã
  kill hết busy loop; loadavg 1 phút còn dư 4.29→3.85 do trung
  bình trượt nhưng CPU thực tế đã rảnh — chứng cứ là dữ liệu rAF
  của lượt này mang dạng rảnh hoàn toàn, §3).

## 2. Probe gap rAF — thiết kế và giới hạn của chính probe

- Cách làm (phía harness, KHÔNG sửa sản phẩm): sau khi app ready,
  bọc `window.requestAnimationFrame` — vẫn gọi rAF gốc, chỉ ghi
  `performance.now()` mỗi lần callback chạy + gap so với callback
  trước, vào `window.__n2Raf`. Vòng lặp preview gọi
  `requestAnimationFrame(loop)` toàn cục mỗi tick nên sau tick
  đầu tiên post-install mọi tick đều qua wrapper. Đánh dấu phase
  bằng `mark('fwd-start'/'fwd-end'/'rev-start'/'rev-end')` ngay
  trước/sau khi bấm nút transport.
- **Tick biên (boundary tick):** mỗi phase đều có đúng 1 gap lớn
  (~1.4–1.8 s) ở tick đầu tiên của phase, và chỉ ở đó. Đây KHÔNG
  phải đói rAF sustained: vòng lặp preview NGỦ khi tạm dừng
  (`scheduleNext` chỉ đặt lịch khi không đủ điều kiện ngủ; khi
  phát thì không ngủ) và `wake()` đặt lại `last = performance.now()`
  trước khi đặt lịch lại — nên dt thật của tick đầu sau giấc ngủ
  KHÔNG phải gap ngủ đó. Probe ghi gap từ callback trước (trước
  cả mark, lúc còn ngủ) nên gap tick biên phóng đại dt thật.
  Vì vậy mọi phân tích sustained dùng biến thể `exclFirst` (bỏ
  tick đầu phase); số có cả tick biên chỉ để đối chiếu. Sau khi
  trừ tick biên, 3 lượt rảnh có 0 gap > 100 ms (trừ 1 gap ~205 ms
  lẻ ở phase xuôi lượt dense-idle2, lost 0.105 s — không đổi kết
  luận, dự báo 0.98 so với đo 0.990).
- **Giới hạn probe (trung thực):** probe ghi MỌI callback rAF toàn
  trang, không chỉ vòng lặp preview. Bằng chứng có ≥ 2 luồng rAF
  xen kẽ: lúc rảnh ~108–118 callback/s (vượt 60 Hz của 1 vòng).
  Hệ quả: gap probe là CẬN DƯỚI của gap riêng vòng preview (xen
  kẽ chẻ nhỏ gap), nên loss do clamp ước từ probe là CẬN DƯỚI,
  và tốc độ dự báo từ probe là CẬN TRÊN của tốc độ thật. Điều này
  giải thích đúng chiều chênh lệch ở §4 (dự báo 0.81–0.83 cao hơn
  đo 0.760), không phải mâu thuẫn. Muốn đo gap riêng vòng preview
  thì cần hook trong chính vòng lặp — ngoài phạm vi luồng này
  (cấm sửa preview.tsx).
- Probe không làm chậm vòng lặp đáng kể: chỉ 1 lần push số mỗi
  callback (micro-giây); lúc rảnh tốc độ đo được 0.990–0.997× là
  bằng chứng probe không bóp méo hành vi.

## 3. Số đo (4 lượt, cùng bundle)

### 3.1 Bảng tổng hợp

| Lượt | GOP | Load 1 phút lúc đo | Xuôi nội suy | fps ngược (draw/wall) | hold ngược | Verdict |
|---|---|---|---|---|---|---|
| Đợt 28 baseline | thưa | rảnh | 1.158× (bug cũ) | 7.79 | — | — |
| Đợt 28 baseline | dày | rảnh | — | 23.2 | — | — |
| N2 sparse-idle | thưa | 0.54 → 1.17 | 0.990 | **8.97** (123/13.71 s) | 638 | PASS |
| N2 dense-idle | dày | 0.85 → 1.83 | 0.997 | **18.42** (256/13.90 s) | 389 | PASS |
| N2 sparse-loaded | thưa | 5.13 → 5.03, đỉnh 6.70 | **0.760** | 0.93 (15/16.09 s) | 130 | PARTIAL* |
| N2 dense-idle2 | dày | dư trung bình 4.29 → 3.85, CPU thực rảnh | 0.990 | **24.05** (332/13.81 s) | 474 | PASS |

\* PARTIAL ở lượt tải nặng chỉ do artefact mẫu chuyển tiếp (xem §6),
không phải lỗi phát ngược: sau warmup gray giảm đơn điệu 29→19,
không mẫu đen, badge ngược/giữ đều thấy.

### 3.2 Lượt rảnh — chi tiết rAF (sau khi trừ tick biên)

- sparse-idle xuôi: 716 tick / 6.07 s, gap P50 8.3 ms, P95 15.3 ms,
  P99 18 ms, 0 gap > 100 ms, dự báo 0.996–1.014 (tùy có tính tick
  biên), đo 0.990. Ngược: 1528 tick / 14.24 s, P50 6.6 ms,
  P95 35.2 ms, P99 53 ms, 0 gap > 100 ms sustained.
- dense-idle xuôi: 708 tick / 6.13 s, P50 8.3 ms, P95 15.1 ms,
  0 gap > 100 ms sustained, dự báo (exclFirst) 0.996, đo 0.997 —
  khớp trong 0.001. Ngược: P50 8.3 ms, P95 44.5 ms, 0 gap > 100 ms
  sustained, dự báo 0.999.
- dense-idle2 xuôi: P50 8.4 ms, P95 14.2 ms, 1 gap ~205 ms lẻ
  (lost 0.105 s), dự báo 0.980, đo 0.990. Ngược: P50 8.2 ms,
  P95 15.8 ms, 0 gap > 100 ms sustained, dự báo 0.999.
- Xuôi holdDelta = 1 ở cả 3 lượt rảnh (so với 0 ở lượt sạch nhất
  của M2 — 1 tick hold lẻ, không phải cụm; không đáng kể).
- Ngược GOP thưa rảnh: playhead 29.5 → 15.8, gray đơn điệu
  29→16, blackRev = 0, badge ngược/giữ đều thấy, holdDelta 638
  (seek GOP thưa đắt — đúng bản chất, không phải hồi quy).
- Ngược GOP dày rảnh: playhead 29.6 → 15.7 (2 lượt đều ~29.5 →
  15.7), gray đơn điệu 29→15, blackRev = 0.

### 3.3 Lượt tải nặng có kiểm soát — sparse-loaded

- Tải: 4 tiến trình `timeout 900 bash -c 'while :; do :; done'`
  (tự hết hạn, đã kill sạch sau lượt — kiểm tra `ps` = 0 tiến
  trình hog còn lại). Load 1 phút: 5.23 lúc bắt đầu, 5.13 trước
  xuôi, 6.70 trước ngược, 5.03 cuối lượt — nặng hơn cả đợt 30 M2
  (3.7–7.3, tương đương) nhưng lần này CHỦ ĐỘNG và ghi rõ.
- Xuôi: chỉ 109 tick rAF / 7.8 s wall (so với ~710 tick / 6.1 s
  lúc rảnh — tốc độ callback sụp ~7 lần), gap P50 78.8 ms,
  P95 119.2 ms, P99 1.11 s, max 1.43 s; **7 gap > 100 ms sustained**
  (8 tính cả tick biên), lost do clamp (exclFirst) 1.233 s.
  Dự báo từ clamp: 0.814 (exclFirst) / 0.826 (tính cả biên);
  **đo được 0.760×**. Hold xuôi 14, draw 41 — renderer đói nặng,
  cùng dạng với M2 GOP dày lượt 2 (draw 41, hold 14).
- Ngược: 293 tick / 17.42 s, gap P50 70.7 ms, P95 119.6 ms,
  P99 260 ms, max 1.73 s; **44 gap > 100 ms sustained**,
  lost 1.399 s. fps ngược sụp xuống 0.93 (draw 15) — dưới tải
  bão hòa, seek ngược GOP thưa gần như đứng yên; đây là giới hạn
  tải, không phải số để so hồi quy.
- maxHoldAgeSec = 26.67, stale = true — đúng artefact thống kê
  đã biết từ đợt 28/M2 (firstHeldT sống sót qua nhảy End), không
  phải phát hiện mới.

## 4. Chứng minh cơ chế clamp dt 0.1 s (đóng nợ đợt 30 M2 §4)

Chuỗi suy luận, mỗi mắt xích đều có số:

1. Mã nguồn (đọc, không sửa): vòng lặp preview dùng
   `dt = Math.min(0.1, (now - last) / 1000)` — clamp có từ trước
   đợt 29. Khi gap rAF > 100 ms, mỗi tick chỉ tính tối đa 0.1 s
   nên playhead mất (gap − 0.1) s so với wall ở tick đó.
2. Lúc rảnh: gap sustained không vượt 100 ms → không mất gì →
   tốc độ 0.990–0.997×, dự báo từ gap khớp số đo trong 0.003.
3. Dưới tải: gap sustained vượt 100 ms thường xuyên (7 lần ở
   phase xuôi, 44 lần ở phase ngược) → mất 1.233 s / 7.8 s wall
   ở phase xuôi → dự báo 0.814×, đo được 0.760×.
4. Chênh 0.054 giữa dự báo và đo nằm đúng hướng giải thích được:
   probe đo gap xen kẽ toàn trang nên ước loss là cận dưới (§2),
   cộng sai số lượng tử hoá timeText 0.1 s (±~2% trên cửa sổ
   nội suy ~5 s) và phần dư forwardAcc cuối cửa sổ (< 1 frame).
   Không cần thêm cơ chế nào khác; chiều và độ lớn đều khớp dải
   0.72–0.84× của M2.
5. Loại trừ như M2: snap Math.round cũ đã hết (không lượt nào
   vượt 1.00×); sai số hiển thị ±2% không giải thích 24% thiếu;
   số đo là store playhead (TopBar), không phải currentTime
   element.

Kết luận: **giả thuyết clamp đã thành kết luận.** Hành vi chạy
chậm dưới tải là hệ quả trực tiếp, có chủ đích hay không, của
clamp dt 0.1 s khi renderer đói rAF. Sửa (nếu muốn) thuộc về
quyết định sản phẩm — ví dụ nới clamp khi phát xuôi hoặc bù
thời gian đã mất — không làm trong luồng đo này.

## 5. fps ngược: kết luận hồi quy + nợ WebCodecs

- GOP thưa: 8.97 > 7.79 (+15%) — KHÔNG hồi quy, còn nhanh hơn
  baseline đợt 28. (Lưu ý: lượt này chạy bundle mới hơn đợt 28
  nhưng đường phát ngược không đổi bản chất; số cao hơn có thể
  là phương sai máy, không claim "cải thiện" từ code nào.)
- GOP dày: 18.42 và 24.05, trung bình 21.2, khoảng bao phủ 23.2 —
  KHÔNG kết luận hồi quy được. Phương sai lượt-lượt ~±25% là
  phát hiện cần ghi: decode ngược GOP dày nhạy với trạng thái
  ấm của Chrome/máy; đợt sau phải chạy lặp và báo khoảng.
- Số đợt 30 M2 (thưa 2.71–6.29, dày 5.36–13.93) nay đã rõ là cận
  dưới dưới tải, không còn giá trị so sánh hồi quy.
- 30 fps ngược thật vẫn cần WebCodecs + demux MP4 + cache frame
  (đợt 28 §5). Bằng chứng bottleneck là decode/seek, không phải
  rAF: lượt ngược rảnh có rAF khỏe (P99 ≤ 70 ms) nhưng draw chỉ
  123–332 frame trong ~14 s vì mỗi bước ngược trên GOP thưa phải
  seek + giải mã lại cả GOP (holdDelta 638), trên GOP dày cũng
  389–474 hold. Không claim 30 fps bằng cách nào khác.

## 6. Artefact và sự cố trong lượt (ghi đủ, không giấu)

1. **Lượt tải nặng verdict PARTIAL là artefact mẫu chuyển tiếp,**
   cùng họ với PARTIAL của M2 đợt 30:** 3 mẫu gray đầu phase
   ngược = 3 (frame cũ chưa kịp đổi ngay sau khi bấm ngược), 25
   mẫu sau giảm đơn điệu 29→19, không mẫu đen sau warmup.
   Monotonic check của harness fail chỉ vì 3 mẫu đầu đó.
2. **maxHoldAgeSec stale (26.67) ở lượt tải nặng:** artefact đã
   biết (firstHeldT qua nhảy End), không phải bug mới.
3. **Loadavg lượt dense-idle2 mang dư trung bình trượt:** 1 phút
   còn 4.29→3.85 vì hog vừa kill trước đó ~1 phút; nhưng `ps`
   xác nhận 0 hog còn sống và dữ liệu rAF (0 gap > 100 ms
   sustained ở phase ngược, tốc độ 0.990) chứng minh CPU thực
   tế đã rảnh trong lúc đo. Không đọc loadavg đó như "lượt này
   chạy dưới tải".
4. **Tiến trình Chrome/Xvfb lạ trên :90** (profile /tmp/j6-pipe-*)
   xuất hiện trong `ps` lúc kiểm tra cuối — thuộc luồng khác
   đang chạy song song, KHÔNG phải của N2, không đụng tới.
   Tiến trình :98 của N2 đã dọn sạch sau mỗi lượt (cleanup của
   harness).
5. **1 gap ~205 ms lẻ ở phase xuôi dense-idle2:** chưa rõ nguyên
   nhân (có thể 1 longtask decode/GC đơn lẻ); chỉ 1 lần, lost
   0.105 s, không ảnh hưởng kết luận. Không suy diễn thêm.

## 7. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `docs/PHASE9_ROUND31_N2_REVERSE_FPS_LIMITS.md` (file này).
- Mới: `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  (harness đo + probe rAF; bản chạy thực tế ở scratch
  `~/workspace/tmp-round31-n2/` — scratch ngoài repo, không stage).
- Mới: `benchmarks/results/v31-n2-reverse-sparse-idle.json`,
  `benchmarks/results/v31-n2-reverse-dense-idle.json`,
  `benchmarks/results/v31-n2-reverse-sparse-loaded.json`,
  `benchmarks/results/v31-n2-reverse-dense-idle2.json`
  (JSON kết quả 4 lượt, mỗi file ghi đủ load, gap rAF, mẫu
  playhead/gray — bằng chứng kiểm chứng của LIMITS này).
- Không sửa: mọi code sản phẩm (`preview.tsx`, `seek.ts`,
  `store.ts`, ...), mọi file của luồng khác, paths-loop,
  build-loop-log. Dist trên đĩa không đổi sha trong suốt lượt đo.

## 8. Nợ còn lại

1. **30 fps ngược thật:** vẫn cần WebCodecs + demux + cache frame
   (đợt 28 §5); latency decode 1 GOP bằng chunk vẫn chưa đo.
2. **Phương sai fps ngược GOP dày (±~25%):** đợt sau chạy lặp ≥ 2
   lượt/lần đo và báo khoảng thay vì 1 số; cân nhắc warm-up
   Chrome trước lượt đo chính thức.
3. **Gap rAF riêng vòng preview:** probe hiện tại đo toàn trang
   (cận dưới loss); nếu cần số clamp chính xác hơn thì gắn hook
   đo trong chính vòng lặp — nhưng đó là sửa preview.tsx, thuộc
   quyết định của luồng sửa seek (N1), không làm lén ở đây.
4. **Stat `maxHoldAgeSec` qua nhảy playhead:** vẫn artefact như
   đợt 28/M2 (reset `firstHeldT` khi playhead nhảy cóc) — nợ
   follow-up nhỏ cho tầng thống kê.
5. **Quyết định sản phẩm về clamp:** có chấp nhận playhead chạy
   chậm 0.76× dưới tải nặng (hành vi hiện tại, đã chứng minh),
   hay nới/bù clamp — không phải việc của luồng đo.
