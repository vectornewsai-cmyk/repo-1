# Phase 9 đợt 30, luồng M2 — Số đo phần cứng pass xuôi sau sửa playhead snap (đợt 29 L2) — LIMITS

Ngày: 31/10/2026. KHÔNG push, KHÔNG release/tag, KHÔNG code giả.
Luồng này KHÔNG sửa code sản phẩm, KHÔNG chạm file của luồng khác,
KHÔNG tự ghi paths-loop hay build-loop-log (parent gộp).
Nhiệm vụ duy nhất: đo lại trên Chromium headed thật xem sửa snap
của đợt 29 L2 có hết 1.158× và hết cụm hold pass xuôi không.

## 0. Kết luận ngắn (không vượt số đo)

1. **1.158× đã hết — không lượt nào còn chạy nhanh hơn wall.**
   Tốc độ playhead nội suy (mẫu 2 → mẫu cuối, trừ độ trễ khởi
   động) ở 4 lượt chạy: ~1.02 (ước lượng, xem §3), 0.838, ~0.86
   (wall thô, xem §3), 0.723. Không lượt nào > 1.00× theo phép đo
   nội suy có wall từng mẫu. Dấu hiệu đặc trưng của bug snap cũ
   (playhead > wall + cụm hold lặp lại mỗi ~1.2–1.4 s) đã biến mất.
2. **Cụm hold do drift-seek đã hết.** Lượt sạch nhất (GOP thưa,
   lượt 1): hold pass xuôi = **0**, so với 54 (K4 gốc) và 40
   (đợt 28 đo lại). Kỳ vọng "về mức GOP dày ~5–7" đã đạt và vượt
   ở lượt sạch. Các lượt dưới tải nặng vẫn có hold dư (8–14)
   nhưng dạng khác hẳn: phẳng hoặc chỉ cụm lúc khởi động, không
   còn cụm lặp lại chu kỳ — đó là đói decoder/renderer khi máy
   nghẽn, không phải chu kỳ drift-seek (xem §3–§4).
3. **Dưới tải nặng, playhead chạy CHẬM (0.72–0.84×), không nhanh.**
   Đây là hành vi mới quan sát được (trước đây chỉ thấy chiều
   nhanh), xuất hiện đúng lúc VM nghẽn nặng (load 7+ trên máy
   2vCPU, nhiều luồng đợt 30 khác đang chạy Chrome + ffmpeg
   render cùng lúc). Cơ chế khả dĩ nhất là clamp dt 0.1 s có sẵn
   trong vòng lặp (xem §4) — nhưng luồng này KHÔNG đo gap rAF
   nên chỉ ghi là "phù hợp với", không claim đã chứng minh.
4. **fps ngược đo được lần này THẤP HƠN đợt 28, nhưng KHÔNG được
   đọc là hồi quy.** Tất cả các lượt đều chạy trong lúc VM nghẽn
   nặng vì luồng khác; số fps ở đây chỉ là cận dưới dưới tải, cần
   chạy lại lúc máy rảnh mới so sánh được với 7.79 / 23.2 fps của
   đợt 28. 30 fps ngược thật vẫn cần WebCodecs + cache frame
   (đợt 28 §5) — luồng này chỉ đo, không triển khai (đúng phạm vi).
5. **Không phát hiện bug sản phẩm mới nào đủ bằng chứng để sửa.**
   Vì vậy không sửa code sản phẩm. Nợ đo lúc máy rảnh + nợ
   WebCodecs + nợ stat maxHoldAgeSec vẫn còn (xem §7).

## 1. Phương pháp đo (harness, fixture, bundle)

- Harness: `apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs`
  — bản sao harness K4 (`clicktest-reverse-hold-pipe.mjs`) chỉ khác:
  (a) SCRATCH qua env `M2_SCRATCH` để không ghi đè scratch K4,
  (b) ghi wall-clock (`Date.now()`) từng mẫu để tính tốc độ
  playhead nội suy trừ độ trễ khởi động, (c) thêm vào
  `result.forward`: `wallSec`, `playheadRate` (thô, click→dừng),
  `holdDelta`/`drawDelta` tính từ stats trước khi bấm phát.
  Mọi bước còn lại (seed autosave rỗng, import qua input file
  thật, bấm nút transport thật, pass xuôi 6 s rồi pass ngược 14 s)
  giữ nguyên K4. `node --check` pass.
- Fixture (y nguyên của đợt 28, không tạo mới): `sparse-gop-flat.mp4`
  (1280×720, 30 s, 30 fps, H.264, GOP 300, phẳng theo giây) và
  `dense-gop-flat.mp4` (cùng thông số, GOP 30), trong
  `~/workspace/tmp-round27-k4/`.
- Bundle đo: `index-B1assKz-.js`. Trước khi đo đã chạy lại
  `vite build` và được đúng bundle cũ, byte-identical
  (sha256[:32] = `7659cc3fb1474449679bf5a9fbc2949d`) — tức dist
  trên đĩa đã khớp source hiện tại (gồm sửa đợt 29 L2) trước khi
  đo, không phải bundle lạ. Không có file source nào mới hơn dist
  tại thời điểm build lại. Dist build lại không đưa vào batch
  theo quy ước (parent quyết).
- Chỉ số chính pass xuôi: `holdDelta` (tick hold trong pass),
  `drawDelta`, tốc độ playhead nội suy = (playhead mẫu cuối −
  playhead mẫu 2) / (wall mẫu cuối − wall mẫu 2). Dùng nội suy
  vì `playheadRate` thô (click→dừng) luôn bị độ trễ bấm phát +
  evaluate cuối làm thấp giả (~0.77–0.88 ngay cả lượt tốt).
- Màn hình đo: `.time-display` = `fmtTime(playhead)` trong
  `TopBar.tsx` (store playhead, không phải currentTime của
  element) — nên tốc độ đo được đúng là tốc độ playhead của
  store, đối tượng của sửa đợt 29 L2. Độ phân giải hiển thị
  0.1 s → sai số lượng tử hoá ≈ ±2% trên cửa sổ nội suy ~5 s.

## 2. Baseline để so sánh (viện dẫn, không đo lại ở đây)

| Nguồn | Pass xuôi GOP thưa | Pass xuôi GOP dày |
|---|---|---|
| K4 gốc (đợt 27) | draw 248 / **hold 54** / skip 2 | draw 352 / **hold 7** / skip 0 |
| Đợt 28 L2 đo lại | draw 282 / **hold 40** | hold ~5–7 (cụm 1 tick/seek) |
| Đợt 28 L2, playhead | **1.158×** wall (playhead +7.167 s / 6.189 s wall) | — |

Cơ chế cũ đã rõ (đợt 28 L2 §2): playhead snap `Math.round`
bước nguyên frame ở tick dt ≥ 16.67 ms → lệch tích lũy → chạm
ngưỡng drift-seek 0.35 s mỗi ~1.2–1.4 s → mỗi seek trên GOP thưa
gây cụm hold 3–29 tick.

## 3. Số đo đợt này (4 lượt chạy, cùng bundle)

### 3.1 GOP thưa, lượt 1 — lượt sạch nhất (trước khi tải tăng vọt)

- Pass xuôi: playhead 0 → 5.7, **holdDelta = 0**, drawDelta = 237,
  stats cuối pass `{draw: 237, hold: 0, skip: 2}`.
- Per-sample hold: 0 ở cả 12 mẫu (tăng đều draw 0→9→18→35→49→
  66→95→123→154→179→208→237) — không có cụm nào.
- Tốc độ: không có wall từng mẫu ở lượt này (harness chưa gắn
  timestamp); ước lượng từ bước playhead trung bình 0.518 s /
  khoảng mẫu ~0.51 s ≈ **~1.02×** — ghi rõ là ước lượng, không
  phải số đo wall chính xác. `playheadRate` thô click→dừng =
  0.877 (bị độ trễ khởi động kéo xuống, không dùng làm kết luận).
- Pass ngược cùng lượt (để tham chiếu): drawDelta 88 →
  **6.29 fps**, holdDelta 577, gray giảm đơn điệu 29→15, verdict
  PASS. Thấp hơn 7.79 fps đợt 28 nhưng đã có tải nền lúc đó.
- Hạn chế lưu trữ: JSON lượt này đã bị lượt 2 ghi đè cùng
  scratch (xem §6); các số trên lấy từ log chạy lượt 1, không
  còn file JSON riêng. Không bịa thêm số nào ngoài log đó.

### 3.2 GOP thưa, lượt 2 — dưới tải nặng (load ~7.1)

- Pass xuôi: playhead mẫu 0.2 → 5.3, **holdDelta = 8**,
  drawDelta = 217. Per-sample hold: 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  2, 8 — phẳng suốt pass, chỉ nhích ở 2 mẫu cuối khi renderer
  đói hẳn (draw đứng yên 218 ở 2 mẫu cuối).
- Tốc độ nội suy (mẫu 2 → cuối): playhead 4.1 s / wall 4.891 s =
  **0.838×**. Tốc độ toàn mẫu 0.853×, thô click→dừng 0.7725×.
- Pass ngược cùng lượt: drawDelta 38 → **2.71 fps**,
  verdict PARTIAL — nhưng lý do PARTIAL duy nhất là mẫu gray
  đầu tiên = 5 (frame cũ chưa kịp đổi ngay sau khi bấm ngược),
  27 mẫu còn lại giảm đơn điệu 29→17, không có mẫu đen sau
  warmup. Đây là artefact mẫu chuyển tiếp của harness, không
  phải lỗi phát ngược. `maxHoldAgeSec` = 25.03, `stale: true` —
  đúng artefact thống kê đã biết từ đợt 28 (xem §5).
- File: `benchmarks/results/v30-m2-forward-sparse.json` (lượt 2).

### 3.3 GOP dày, lượt 1 — dưới tải vừa

- Pass xuôi: playhead 0.3 → 6.0, **holdDelta = 0**,
  drawDelta = 102. Per-sample hold 0 cả 12 mẫu.
- Tốc độ: chỉ có `playheadRate` thô 0.861 (không có wall từng
  mẫu) — không dùng làm kết luận chính xác, chỉ ghi nhận không
  có dấu hiệu vượt 1.00×.
- Pass ngược cùng lượt: drawDelta 195 → **13.93 fps** (đợt 28:
  23.2 fps), verdict PASS, gray đơn điệu.
- Hạn chế lưu trữ: như §3.1, JSON lượt này đã bị lượt 2 ghi đè;
  số lấy từ log chạy lượt 1.

### 3.4 GOP dày, lượt 2 — dưới tải nặng (load ~7.3, sau khi VM reboot)

- Pass xuôi: playhead mẫu 0 → 4.6, **holdDelta = 14**,
  drawDelta = 41 (renderer đói nặng: chỉ 41 draw trong 6.6 s).
  Per-sample hold: 0, 0, 7, 12, 12, 12, 12, 12, 12, 14, 14, 14 —
  cụm duy nhất ở 2 mẫu đầu (khởi động/decoder warm-up dưới tải),
  sau đó phẳng hoàn toàn, không có cụm lặp lại chu kỳ.
- Tốc độ nội suy (mẫu 2 → cuối): playhead 3.9 s / wall 5.395 s =
  **0.723×**. Tốc độ toàn mẫu 0.696×, thô click→dừng ~0.62×.
- Pass ngược cùng lượt: drawDelta 75 → **5.36 fps**,
  verdict PASS, gray giảm đơn điệu 29→15, holdDelta 235.
- File: `benchmarks/results/v30-m2-forward-dense.json` (lượt 2).

### 3.5 Bảng tổng hợp pass xuôi

| Lượt | GOP | hold | draw | Tốc độ nội suy | Dạng hold |
|---|---|---|---|---|---|
| Baseline K4 | thưa | 54 | 248 | 1.158× | cụm lặp chu kỳ |
| Baseline đợt 28 | thưa | 40 | 282 | 1.158× | cụm lặp chu kỳ |
| M2 lượt 1 | thưa | **0** | 237 | ~1.02 (ước lượng) | không có |
| M2 lượt 2 (tải nặng) | thưa | 8 | 217 | 0.838× | phẳng + nhích cuối |
| Baseline K4 | dày | 7 | 352 | — | rải rác 1 tick |
| M2 lượt 1 | dày | **0** | 102 | — (chỉ có số thô) | không có |
| M2 lượt 2 (tải nặng) | dày | 14 | 41 | 0.723× | cụm khởi động rồi phẳng |

Đọc đúng bảng: kỳ vọng "hold GOP thưa về mức GOP dày (~5–7)"
đã đạt ở lượt sạch (0 < 5–7) và ở lượt tải nặng vẫn trong cùng
bậc độ lớn (8–14), nhưng bản chất đã đổi: không còn cụm lặp
lại theo chu kỳ drift-seek. Con số 14 ở GOP dày lượt 2 là hold
khởi động dưới tải, không phải hold do seek chu kỳ.

### 3.6 fps ngược hiện tại (chỉ đo, không triển khai WebCodecs)

| Fixture | Đợt 28 (máy tương đối rảnh) | M2 lượt 1 | M2 lượt 2 (tải nặng) |
|---|---|---|---|
| GOP thưa | 7.79 fps | 6.29 fps | 2.71 fps |
| GOP dày | 23.2 fps | 13.93 fps | 5.36 fps |

Tất cả các lượt M2 đều chạy cùng lúc với Chrome + ffmpeg render
của các luồng đợt 30 khác trên VM 2vCPU (load 3.7–7.3 lúc đo).
Vì vậy cột M2 là cận dưới dưới tải, KHÔNG phải bằng chứng hồi
quy so với đợt 28. Muốn kết luận hồi quy hay không, bắt buộc
chạy lại lúc máy rảnh (xem §7). 30 fps ngược thật vẫn cần
WebCodecs + demux MP4 + cache frame như đợt 28 §5 đã kết luận;
luồng này không đụng tới khối đó.

## 4. Vì sao playhead chạy chậm dưới tải (giải thích có giới hạn)

- Vòng lặp phát xuôi trong `preview.tsx` dùng
  `dt = Math.min(0.1, (now - last) / 1000)` — clamp có từ trước
  đợt 29, không phải do sửa snap. Khi renderer đói đến mức gap
  rAF vượt 100 ms, mỗi tick chỉ được tính tối đa 0.1 s nên
  playhead không bắt kịp wall — đúng hướng quan sát được
  (0.72–0.84×) và ngược hướng với bug cũ (1.158×).
- Tuy nhiên: luồng này KHÔNG instrument gap rAF hay số tick
  rAF, và khoảng mẫu CDP (~0.5–0.7 s) không phải gap rAF. Nên
  cơ chế clamp chỉ là "phù hợp với số đo", chưa phải "đã chứng
  minh". Không claim nguyên nhân gốc cho chiều chậm.
- Loại trừ được: (a) snap `Math.round` cũ — đã thay bằng tích
  lũy `forwardStep` từ đợt 29, và không lượt nào vượt 1.00×;
  (b) sai số hiển thị — lượng tử hoá 0.1 s chỉ giải thích ±2%,
  không giải thích 16–28% thiếu; (c) element chạy chậm — số đo
  là store playhead (TopBar), không phải currentTime element.

## 5. Artefact thống kê vẫn còn (không sửa, ngoài phạm vi)

- `maxHoldAgeSec` = 25.03 ở GOP thưa lượt 2 (`stale: true`) là
  đúng artefact đợt 28 L2 §2.3 đã ghi: `firstHeldT` từ cuối pass
  xuôi sống sót qua nhảy playhead bằng phím End rồi bị tính
  tuổi ở pass ngược. Chỉ số đáng tin vẫn là holdDelta theo
  cửa sổ mẫu, không phải maxHoldAgeSec khi có nhảy playhead.
  Luồng này không sửa stat đó (phạm vi chỉ đo; sửa stat sẽ làm
  lệch so sánh với baseline) — ghi làm nợ follow-up như đợt 28.

## 6. Sự cố hạ tầng trong lượt (ghi đầy đủ, không giấu)

1. **VM/service restart giữa lượt chạy GOP dày gắn timestamp:**
   lần chạy đầu của harness timestamped cho GOP dày chết giữa
   chừng, không ghi JSON; sau restart `uptime` về 0 phút, không
   còn process harness/Chrome nào sống. Đã chạy lại sau reboot
   và có số đầy đủ (§3.4). Không có dữ liệu nào bị nhận vơ từ
   lần chạy chết đó.
2. **JSON lượt 1 bị lượt 2 ghi đè:** cả 2 lượt cùng fixture dùng
   chung `M2_SCRATCH` nên file `forward-hold.json` của lượt 1
   đã mất, chỉ còn số trong log chạy (§3.1, §3.3). Lỗi quy trình
   của luồng này (lẽ ra phải đổi scratch mỗi lượt); các file
   `benchmarks/results/v30-m2-*.json` hiện tại là của lượt 2.
   Parent không nên đọc 2 file đó như lượt duy nhất — phải đọc
   kèm bảng §3.5.
3. **Tải nền không kiểm soát được:** suốt lượt đo, các luồng
   đợt 30 khác chạy Chrome headed + ffmpeg render trên cùng VM
   2vCPU (quan sát `ps`: 2 Chrome headed khác + 1 ffmpeg render
   CLI cùng lúc; load 3.66 → 7.12 → 7.27). Đây là lý do mọi số
   fps/tốc độ lượt 2 đều thấp và dao động mạnh giữa các lượt.

## 7. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `docs/PHASE9_ROUND30_M2_FORWARD_HARDWARE_LIMITS.md`
  (file này).
- Mới: `apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs`
  (bản repo của harness đo; bản chạy thực tế nằm ở scratch
  `~/workspace/tmp-round30-m2/`).
- Mới: `benchmarks/results/v30-m2-forward-sparse.json`
  (GOP thưa lượt 2), `benchmarks/results/v30-m2-forward-dense.json`
  (GOP dày lượt 2).
- Build lại: `apps/web/dist/` (byte-identical với dist trước đợt,
  xem §1) — parent quyết có stage hay không, theo quy ước.
- Không sửa: mọi code sản phẩm (`preview.tsx`, `playheadPacing.ts`,
  `store.ts`, `timebase.ts`, vùng phát ngược/hold), mọi file của
  luồng khác, paths-loop, build-loop-log.

## 8. Nợ còn lại — đọc kỹ trước khi coi là xong

1. **Chạy lại lúc máy rảnh (nợ đo quan trọng nhất):** cần 1 lượt
   GOP thưa + 1 lượt GOP dày khi không có luồng khác tranh CPU
   để khóa (a) tốc độ pass xuôi ~1.00× sạch (không còn nhiễu
   tải), (b) fps ngược có còn 7.79 / 23.2 fps như đợt 28 hay đã
   hồi quy thật. Cho đến lúc đó, mọi số fps ngược ở §3.6 chỉ là
   cận dưới dưới tải.
2. **Chứng minh chiều chậm dưới tải (nếu cần):** instrument gap
   rAF + số tick thực tế trong vòng lặp preview để xác nhận hay
   bác bỏ giả thuyết clamp dt 0.1 s ở §4. Không làm trong luồng
   này vì vượt phạm vi "đo".
3. **30 fps ngược thật trên GOP thưa:** vẫn cần WebCodecs +
   demux MP4 + cache frame (đợt 28 §5); latency decode 1 GOP bằng
   chunk vẫn chưa đo; không claim 30 fps.
4. **Stat `maxHoldAgeSec` qua nhảy playhead (§5):** reset
   `firstHeldT` khi playhead nhảy cóc hoặc đo tuổi giữ theo tick
   thay vì theo playhead — follow-up nhỏ cho tầng thống kê.
5. **Quy trình harness:** mỗi lượt chạy phải dùng scratch riêng
   (tránh ghi đè như §6.2); harness M2 đã hỗ trợ qua env
   `M2_SCRATCH` nhưng lượt này đã không dùng khác nhau giữa
   lượt 1 và lượt 2 cùng fixture.
