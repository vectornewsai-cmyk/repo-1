# PHASE9 ROUND117 T2 — Zombie freeze ở chuyển clip: hướng sửa H3e (BỎ)

- Luồng: T2 đợt 117 (cron 15:35 +07 15/11/2026). Nợ #2 đợt 116
  (`docs/PHASE9_ROUND116_LIMITS.md` §10 mục 2): tìm hướng sửa khác cho
  freeze ở chuyển clip sau khi H1 và H2 đều BỎ.
- **VERDICT: H3e ("một lần đọc video mỗi tick") BỎ.** Cặp verdict cùng
  boot #53 (B1 baseline vs F1 fix): longtask ≥200 ms tổng −2,6% (bar
  −30%), số lượng tăng 196→198; draws-gap straddle biên −12,5% (bar
  −30%); seek median tệ hơn 174→205 ms. Cây đã về đúng baseline
  `03bf029f`. Fix giữ dạng patch `h3e-fix.patch` (164 dòng) +
  `apply-h3e.py` (tái tạo đúng md5 `af4d5753`) — xem §5.4.
- Stall ở biên clip VẪN CÒN sau H3e (xem §8 để parent quyết: chấp nhận
  stall hiện tại hay cho làm hướng H3f ở đợt sau).

## 1. Cơ chế đã biết và chẩn đoán tinh chỉnh

### 1.1. Đã chốt từ các đợt trước
- Q2 đợt 114: freeze = cổng bỏ vẽ E4+N3 ở mọi biên + main-thread stall
  (longtask đơn 200–800 ms; ~1/2 khớp pump capture, nửa còn lại chưa rõ).
- H1 (cap snapshot 1280×720 → 640×360, đợt 115 R2): BỎ — capMs median
  chỉ −13,7% (bar −40%), longtask khớp pump/giây TĂNG 65%.
- H2 (throttle capture tối đa 1/250 ms/clip, đợt 116 S2): BỎ — captures
  −86% (238→33) nhưng capMs median +2,1% (bar −40%); cặp A/B chính bị
  nhiễm (holder feedback đi ngược nhau).
- Attribution longtask đã chốt (S2 §9.1 + S10 recount): nửa longtask chưa
  rõ nguồn là hàm `loop` của chính `preview.tsx` (rAF), KHÔNG phải GC —
  100% longtask lớn không khớp pump có LoAF chồng lấn; resid-share median
  0,0/0,0.

### 1.2. Chẩn đoán mới đợt 117 (dữ liệu B0 attempt 1 + attempt 2)
- Trên tick chậm (loopMs ≥ 100 ms): **S_render = tickCost.total /
  loopMs ≈ 0,99** — gần như toàn bộ tick là `drawVideoClip`. Trong
  render: **blend chỉ 0,05–0,10, residual 0,90–0,95** (raw/mask/draw ≈ 0
  ở đường plain-blend); S_pre ≈ 0,36–0,48; S_post ≈ 0,00.
- Residual KHÔNG phải capture (capture đường tick nằm SAU recordTickCost
  ở đường plain nên không nằm trong total) và KHÔNG phải blend. Đọc code
  xác định 2 drawImage full-res trong total ngoài blend: (i)
  `storeHeldFrame` — video→held canvas mỗi tick (dòng ~3988 + hàm 3778);
  (ii) `samplePlainCurrentPixStrip` — vẽ lại video→canvas chẩn đoán mỗi
  tick blend (dòng ~4549/4618). Mỗi tick plain-blend có 4 lần đọc video:
  storeHeldFrame (1) + frame hiện tại vào blend (1) + strip chẩn đoán
  (1) + capture tick-path (1) — giải thích vì sao H1/H2 đều thất bại:
  mỗi cái chỉ chạm 1/4 lần đọc video.
- Nguyên tắc đã đo trong codebase (đợt 79 G1): drawImage từ video đắt gấp
  nhiều lần từ canvas cùng khổ; thay nguồn video bằng held canvas (cùng
  frame, cùng tick) cho pixel ~y hệt (MAD 0,0162, max 1/255).
- **Luật chọn tinh chỉnh (prereg §10, thay nhánh 2 của §5): residual ≥
  0,35 → H3e "một lần đọc video mỗi tick"** (giữ storeHeldFrame mỗi tick
  là lần đọc video duy nhất; blend/strip/capture đọc từ held canvas).
  H3c (throttle held refresh) bị loại vì mâu thuẫn H3e (blend/strip/
  capture cần held tươi mỗi tick). Bar (a)(b)(c) §6 không đổi.

### 1.3. Giả thuyết mới sau khi H3e thất bại (chưa chẩn đoán xong — §8)
- H3e KHÔNG làm residual giảm (0,94 vs 0,95 ở baseline cùng boot) và
  KHÔNG giảm longtask tổng. Giả thuyết hàng đầu: tick block chờ decoder
  ở lần đọc video ĐẦU TIÊN trong tick (storeHeldFrame — lần đọc duy nhất
  H3e giữ lại); các lần đọc sau cùng frame đã rẻ vì frame đã sẵn. H1/H2/
  H3e đều giữ ≥1 lần đọc video trong tick nóng nên đều không chạm được
  stall. Hướng tiếp theo (H3f, CHƯA code): loại bỏ lần đọc video block
  khỏi tick nóng — cần chẩn đoán tách riêng thời gian storeHeldFrame
  trước khi thiết kế (xem §9).

## 2. Prereg và bar quyết định (đăng ký trước khi đo)

- Prereg: `hidden_files/round117-t2/prereg-t2.md` (§0–§16, gồm các
  addendum: §8 attempt-1 lỗi probe, §10 tinh chỉnh luật chọn → H3e,
  §11 B0 xong + chờ T1-B, §12 cổng T1 mở, §13–§14 H3e applied + reboot
  #53, §15 kết quả F1 + chạy B1, §16 verdict).
- Probe: `apps/web/scripts/probe117t2-frame-parity.mjs` (copy probe116s2
  + drain đầy đủ tickCost/loopMs/rvfcCost; cổng tải load1 [2,8]/120 s;
  68.311 B — >37.768 B, cần `ENABLE_PRIVSEP=0` khi push).
- Driver: `run-t2.sh` — hog CỐ ĐỊNH N=4 python busy-loop (không holder
  feedback — bài học LAI S2), bật sau khi lấy lock, giết khi marker
  play-done; sampler tải 10 s/mẫu; lock v2-only, aging 600 s, port 5590,
  acquire timeout 1500 s.
- Luật LAI §4 (cặp LAI nếu): |load5 median lúc phát| > 2,0 HOẶC |load1
  median lúc phát| > 2,0 HOẶC draws/s chênh > 2× HOẶC boot đổi HOẶC md5
  đổi giữa lượt HOẶC pageerror/crash. Khi LAI: bỏ cặp, chạy lại cặp mới
  1 lần.
- Bar quyết định §6 (B0 baseline vs F1 fix; sau LAI, áp cho cặp chạy lại
  B1/F1 với B1 làm baseline): (a) tổng ms longtask ≥200 ms/lượt của F1
  ≤ −30% so với baseline VÀ số lượng không tăng; (b) số draws-gap
  >300 ms straddle biên của F1 ≤ baseline −30% (nếu baseline = 0 thì (b)
  không đánh giá được); (c) suite xanh trên cây fix (tsc web 0, vite
  build PASS, ghostBlend.probe 15/15, driftConfirmSkip103E4 exit 0,
  playheadHold90R2 93 passed, playheadPacing54K9 19 pass,
  seekSkipRender86N3 9/9, previewEngine 18+27, test-preview-engine.sh
  354 assertions) VÀ draws/s ≥ baseline −10% VÀ tick spacing median ≤
  baseline +10% VÀ seek median không tệ hơn baseline. GIỮ khi (a) VÀ
  (b) VÀ (c) cùng đạt.

## 3. Thiết kế đo và các lượt đã chạy

| Lượt | Tag | Cây (md5) | Boot | Kết quả |
|---|---|---|---|---|
| B0 att1 | chr-mixedalt-t2base-fr4-attempt1-bug | 03bf029f | #52 | Phát xong nhưng probe exit=2, thiếu results.json — lỗi probe T2 (snapshot cuối tham chiếu biến Node trong page.evaluate). Đã sửa probe, không tính vào cặp A/B. Dữ liệu drain giữ lại để chẩn đoán. |
| B0 att2 | chr-mixedalt-t2base-fr4 | 03bf029f | #52 | exit=0, results.json 19.178.529 B. Freeze tái hiện. |
| F1 | chr-mixedalt-t2fix-fr4 | af4d5753 (H3e) | #53 | exit=0, results.json 21.379.115 B. |
| B1 | chr-mixedalt-t2base-b1 | 03bf029f | #53 | exit=0, results.json 20.412.228 B. Cặp verdict (B1, F1). |

- Cấu hình chung: Chromium, `scroll-mixed-alt`, 24 clip, `--freeze-run`,
  `--sysload 0`, 4 hog cố định. TTS 39 không kiểm lại (cấm).
- Sự cố vận hành (xem §9): driver B0-att2 bị SIGKILL ở ~900 s (giới hạn
  wall-clock 15 phút của exec) ngay sau probe exit=0 — analyzer + nhả
  lock + dọn vite phải làm tay (đã làm 09:19Z, lock nhả sau 303 s giữ).
  Reboot #53 (boot 574e3d6b…, up 09:47:08Z) giữa lúc launch F1 — probe T3
  s80 chết theo reboot; F1 chạy hoàn toàn trên boot mới.

## 4. Kết quả đo

### 4.1. B0 attempt 2 — baseline, boot #52 (cửa sổ phát 09:15:42–09:17:12Z)
- **Freeze tái hiện** dưới 4 hog cố định (khác S2 baseline — holder xả
  hog nên không tái hiện): draws-gap >300 ms tổng **118** (29 straddle
  biên; tổng 61.390 ms, biên 15.749 ms); longtask ≥200 ms: **151 cái,
  tổng 54.330 ms** (tất cả longtask 354 cái / 77.482 ms; max 1 cái
  5.351 ms); renderTicks n=353, skipped=94 (26,6%); preMs med 93,8 /
  p90 284,3 / max 5.691,6; renderMs med 14,4 / p90 113,4 / max 615,3;
  draws/s ~5,6 (drawsTotal 559, play ~100 s); pump capMs med 77,7 /
  p90 116,4 / max 283,7 (rVFC med 74); caps 253; tagAgree 251/966
  (26,0%); pageErrs 0; stallBlocks [].
- Phân rã tick chậm (loopMs≥100, n=70/373): S_render 0,99, blend 0,06,
  residual 0,94, S_pre 0,48, S_post 0,00. loopMs p50 17,5 / p90 125,3 /
  max 5.173. BOUNDARY-LOOPMS: biên med 7,2 (n=129) vs giữa-clip med 33,4
  (n=244) — biên nhỏ hơn vì tick biên bị skip nhiều (cổng E4+N3).
- Tải lúc phát: load1 med 3,63 [1,82–7,33] (giảm liên tục 7,33→1,82 dù
  4 hog vẫn chạy — dưới trần CFS quota 1,5 CPU, task bị throttle không
  còn trên runqueue nên /proc/loadavg đo thiếu áp lực thật; draws/s 5,6
  là bằng chứng tải nặng); load5 med 11,48 [9,90–13,29].

### 4.2. F1 — cây fix H3e, boot #53 (cửa sổ phát 09:50:15–09:51:41Z)
- draws-gap >300 ms: tổng **90** (21 straddle biên; tổng 34.948 ms, biên
  7.620 ms); longtask ≥200 ms: **198 cái, tổng 53.999 ms** (tất cả 359 /
  74.619 ms); renderTicks n=350, skipped=54 (15,4%); preMs med 74,9 /
  p90 115,8 / max 790,3; renderMs med 94,6 / p90 136,9 / max 272,1;
  draws/s ~8,1 (drawsTotal 683, play ~85 s); pump capMs med 78,7 /
  p90 100,2 / max 202,2 (rVFC med 77,1); caps 292; tagAgree 125/646
  (19,3%); pageErrs 0; stallBlocks [].
- Phân rã tick chậm (n=135/353): S_render 0,99, blend 0,06, **residual
  0,94**, S_pre 0,41, S_post 0,00. loopMs p50 94,5 / p90 164,3 / max 777.
  BOUNDARY-LOOPMS: biên med 19,4 (n=133) vs giữa-clip med 100,6 (n=220).
- Tải lúc phát: load1 med 7,09 [3,99–7,76]; load5 med 2,86 [1,74–3,56];
  loadBand1AtPlay 2,77 / load5 1,47 (bandWaitedS 25).
- Seek (từ seekTransitions, seeking True→False): n=22, med 205 ms /
  p90 322 / max 683.

### 4.3. B1 — baseline, boot #53 (cửa sổ phát 09:58:38–10:00:04Z)
- draws-gap >300 ms: tổng **95** (24 straddle biên; tổng 39.871 ms, biên
  10.302 ms); longtask ≥200 ms: **196 cái, tổng 55.459 ms** (tất cả 381 /
  76.564 ms); renderTicks n=346, skipped=62 (17,9%); preMs med 73,7 /
  p90 120,9 / max 995; renderMs med 90,0 / p90 164,9 / max 303,3;
  draws/s ~7,4 (drawsTotal 646, play ~87 s); pump capMs med 82,5 /
  p90 108,0 / max 239,9 (rVFC med 79,6); caps 278; tagAgree 150/643
  (23,3%); pageErrs 0; stallBlocks [].
- Phân rã tick chậm (n=126/353): S_render 0,99, blend 0,05, **residual
  0,95**, S_pre 0,36, S_post 0,00. loopMs p50 89,6 / p90 167,9 / max 977,6.
  BOUNDARY-LOOPMS: biên med 13,9 (n=131) vs giữa-clip med 96,8 (n=222).
- Tải lúc phát: load1 med 7,69 [3,26–8,55]; load5 med 3,26 [1,96–4,06];
  loadBand1AtPlay 2,07 / load5 1,70 (bandWaitedS 110).
- Seek: n=23, med 174 ms / p90 415 / max 1.195.

### 4.4. So sánh ba lượt (bảng quyết định)

| Chỉ số | B0 (base #52) | B1 (base #53) | F1 (fix #53) | F1 vs B1 |
|---|---|---|---|---|
| longtask ≥200 ms tổng (ms) | 54.330 | 55.459 | 53.999 | **−2,6%** (bar −30%) |
| longtask ≥200 ms số lượng | 151 | 196 | 198 | **+2** (bar không tăng) |
| draws-gap >300 ms straddle biên | 29 | 24 | 21 | **−12,5%** (bar −30%, ≤16) |
| draws-gap tổng (ms) | 61.390 | 39.871 | 34.948 | −12,3% |
| draws-gap biên (ms) | 15.749 | 10.302 | 7.620 | −26,0% |
| draws/s | 5,6 | 7,4 | 8,1 | +9,5% |
| skipped ticks | 94 (26,6%) | 62 (17,9%) | 54 (15,4%) | −13% |
| loopMs p50 (ms) | 17,5 | 89,6 | 94,5 | +5,5% |
| residual (tick chậm) | 0,90 | 0,95 | 0,94 | ~không đổi |
| pump capMs med (ms) | 77,7 | 82,5 | 78,7 | ~không đổi |
| seek med (ms) | 197 | 174 | 205 | **+18%** (tệ hơn) |
| tagAgree | 251/966 (26,0%) | 150/643 (23,3%) | 125/646 (19,3%) | không cải thiện |

- **Boot tự nó đã đổi phân phối tick:** baseline B0 (#52) loopMs p50
  17,5 ms, renderMs med 14,4 ms → baseline B1 (#53) loopMs p50 89,6 ms,
  renderMs med 90,0 ms, draws/s 5,6→7,4. Đây là bằng chứng độc lập rằng
  điều khoản "boot đổi → LAI" trong §4 là đúng: so B0 với F1 sẽ lẫn hiệu
  ứng boot với hiệu ứng fix. Cặp verdict hợp lệ duy nhất là (B1, F1).

## 5. Fix H3e — nội dung, kiểm chứng, patch

### 5.1. Thiết kế
- Một lần đọc video mỗi tick ở đường plain (không mask): giữ
  `storeHeldFrame` mỗi tick (1 lần đọc video duy nhất); frame hiện tại
  vào blend, strip chẩn đoán, và capture tick-path đều đọc từ held canvas
  (vừa vẽ cùng tick, cùng frame) thay vì đọc lại video. Chỉ áp khi
  drawSrc còn là video thô (đã qua chroma/LUT/effects thì drawSrc đã là
  canvas — giữ nguyên); held không tươi (store thất bại) thì rơi về
  drawSrc như cũ. Đường mask giữ nguyên (đã đọc từ rawUnit canvas).

### 5.2. Thay đổi code (12 điểm + 3 điểm khung)
- `storeHeldFrame`: `: void` → `: boolean` (true khi store thành công);
  call site ghi `heldFreshThisTick = storeHeldFrame(...)`; khai báo
  `let heldFreshThisTick = false;` sau `clipT0`.
- Định nghĩa `currentFrameSrc` trước đoạn plain (điều kiện: held tươi
  && srcEl là video && !pipelineProcessedDrawSrc → held canvas, else
  drawSrc).
- Đoạn plain: 12 điểm `drawSrc` → `currentFrameSrc`: drawFrame callback
  SR (1) + non-SR (2), strip SR (1) + non-SR (1), capture SR-blend (1) +
  SR-direct (1) + non-SR-blend (1) + direct (1), vẽ trực tiếp SR (1) +
  non-SR (2). Comment giữ nguyên.
- Script apply: `hidden_files/round117-t2/apply-h3e.py` (assert md5
  trước 03bf029f + từng anchor đúng 1 lần + đoạn plain đúng 12 điểm);
  script revert: `revert-h3e.py` (assert md5 sau = 03bf029f).

### 5.3. Kiểm chứng trên cây fix (md5 af4d5753, 09:41:40–09:44:17Z)
- **Suite XANH 10/10** (lock giữ 159 s): tsc-web exit 0; vite build
  PASS (built 33,17 s); ghostBlend.probe / driftConfirmSkip103E4 /
  playheadHold90R2 / playheadPacing54K9 / seekSkipRender86N3 /
  previewEngine / previewEngine51H6 — mỗi file exit 0, fail 0 (Node đếm
  1 test top-level/file; số đếm nội bộ — ghostBlend 15, playheadHold90R2
  93, playheadPacing54K9 19, seekSkipRender86N3 9, previewEngine 18+27 —
  không bắt được do script suite chỉ tail -5: ghi nhận là thiếu sót báo
  cáo nhỏ, không ảnh hưởng bar (c) vì bar yêu cầu "suite xanh" = exit 0
  toàn bộ, đã đạt); test-preview-engine.sh 354 assertions pass, exit 0.
  md5 sau suite vẫn af4d5753.

### 5.4. Patch (verdict BỎ — cây đã về baseline)
- `hidden_files/round117-t2/h3e-fix.patch` (164 dòng, unified diff
  baseline → fix; kiểm chứng: apply lên copy baseline cho đúng md5
  af4d5753). `apply-h3e.py` tái tạo fix; `revert-h3e.py` đưa về baseline.
- Cờ cây `hidden_files/round117-tree`: status NO-CHANGE, md5-final
  03bf029f09b8890b285eacc10a02172b (đã verify sau revert).

## 6. Kiểm LAI cặp verdict (B1, F1) — §4
- Play-window load1 med: F1 7,09 vs B1 7,69 → Δ 0,60 ≤ 2,0 ✓.
- Play-window load5 med: F1 2,86 vs B1 3,26 → Δ 0,40 ≤ 2,0 ✓.
- draws/s: 8,1 vs 7,4 (1,09× ≤ 2×) ✓. Boot cùng 574e3d6b (#53) ✓.
  md5 mỗi arm ổn định trước=sau ✓. pageErrs 0 cả hai ✓. Không crash ✓.
- **Cặp (B1, F1) HỢP LỆ, không LAI.** (Cặp B0/F1 thì LAI do boot đổi
  #52→#53 — chỉ dùng tham khảo, xem §4.4.)

## 7. Verdict — H3e BỎ
- (a) longtask ≥200 ms: F1 53.999 vs B1 55.459 (−2,6%, bar ≤ −30%)
  FAIL; số lượng 198 vs 196 (+2, bar không tăng) FAIL.
- (b) draws-gap straddle biên: F1 21 vs B1 24 (−12,5%, bar ≤16) FAIL.
- (c) suite xanh ✓; draws/s +9,5% ✓; tick spacing (loopMs p50) +5,5% ✓;
  NHƯNG seek median 205 vs 174 ms (+18%, tệ hơn) → (c) KHÔNG ĐẠT trọn
  vẹn. (n seek nhỏ 22/23; p90 và max của F1 lại tốt hơn — seek không
  đồng nhất tệ, chỉ median tệ hơn.)
- GIỮ cần (a) VÀ (b) VÀ (c) — cả ba đều không đạt. **H3e BỎ.**
- Ghi nhận trung thực mặt tích cực (không đủ đổi verdict): H3e giúp trang
  giữ nhịp tốt hơn một chút trên cùng boot — skipped 62→54, draws/s
  7,4→8,1, draws-gap biên ms −26,0%, tagDisagree không tăng vọt — nhưng
  stall (longtask) và residual không nhúc nhích, pixel-parity
  (tagAgree 19,3% vs 23,3%) không cải thiện.

## 8. Đề xuất cho parent quyết (không tự quyết)
Nhiệm vụ gốc: nếu không tìm được hướng sửa khả thi thì đưa bằng chứng để
parent quyết chấp nhận stall ~200–800 ms ở biên clip. H3e là hướng thứ ba
thất bại (sau H1, H2). Số liệu để parent quyết:

- **Stall hiện tại (baseline, cùng boot #53, 4 hog cố định, 24 clip):**
  longtask ≥200 ms: 196 cái/lượt, tổng 55.459 ms (~2,3 s stall tích lũy
  mỗi lượt ~87 s phát); draws-gap >300 ms: 95 cái/lượt (24 straddle
  biên, tổng ~40 s gap, biên ~10 s); seek med 174 ms (p90 415, max
  1.195). Trên boot #52 (B0): longtask 151 cái / 54.330 ms; gap biên 29
  cái / 15.749 ms. Mức stall này là hành vi hiện tại của sản phẩm khi
  phát dưới tải — không phải crash (pageErrs 0, stallBlocks [] theo probe).
- **Lựa chọn A — chấp nhận stall:** giữ nguyên hành vi hiện tại (cổng bỏ
  vẽ E4+N3 + stall ~200–800 ms ở biên dưới tải). Không tốn thêm lượt đo;
  stall chỉ xuất hiện rõ dưới tải (S2 baseline không tải gần như không
  tái hiện freeze).
- **Lựa chọn B — cho làm H3f ở đợt sau:** giả thuyết hàng đầu (§1.3):
  tick block chờ decoder ở lần đọc video đầu tiên trong tick
  (storeHeldFrame). H3f cần (1) chẩn đoán tách riêng thời gian
  storeHeldFrame trong tick (instrument tạm, không chạm production) để
  xác nhận/khẳng định giả thuyết; (2) nếu đúng, thiết kế loại bỏ lần đọc
  video block khỏi tick nóng (vd: không vẽ held từ video khi decoder đang
  chậm mà dùng frame cũ / lấy frame từ pump rVFC; hoặc dời storeHeldFrame
  ra khỏi đường tick nóng). Ước tính 1–2 đợt (chẩn đoán + fix + A/B).
- Khuyến nghị của luồng T2: **chọn B nhưng chỉ sau bước chẩn đoán (1)** —
  H3e cho thấy đoán cơ chế mà không tách riêng từng thành phần sẽ lặp lại
  thất bại (H1/H2/H3e đều chạm sai chỗ). Nếu parent chọn A, T2 không còn
  nợ mở về zombie ngoài việc ghi nhận.

## 9. Nợ mở và bài học vận hành
- Nợ mở: (1) Chẩn đoán tách riêng storeHeldFrame (giả thuyết §1.3) —
  chưa làm; (2) H3f — chưa thiết kế; (3) ci-security.yml vẫn 403 chờ
  user (không thuộc luồng này); (4) TTS 39 cấm kiểm lại.
- Bài học vận hành đợt 117 (ghi cho các luồng sau):
  - Exec session bị SIGKILL ở ~900 s wall-clock — mọi driver lượt dài
    PHẢI chạy detached (nohup + disown), chỉ poll log file. B0-att2 bị
    kill sau probe exit=0, phải làm tay analyzer + nhả lock.
  - Load1/load5 trên VM này bị méo bởi trần CFS quota 1,5 CPU (task bị
    throttle không nằm trên runqueue): load1 lúc phát B0 giảm 7,33→1,82
    dù 4 hog vẫn chạy; draws/s + số hog cố định mới là thước so sánh
    đáng tin. LAI nên ưu tiên draws/s + boot + md5.
  - Boot đổi giữa các arm làm LAI cả cặp (B0/F1) — remedy §4 (chạy lại
    cặp B1/F1 liền nhau, cùng boot) đã phát huy: B1 cho thấy boot tự nó
    đổi phân phối tick.
  - Không sửa cây khi probe luồng anh em đang chạy (vite phục vụ module
    theo yêu cầu — sửa giữa lượt nhiễm số đo của họ). T2 đã chờ T3 xong
    probe 250 clip + T1 done mới apply H3e; revert/re-apply cũng chỉ làm
    khi lock trống + không còn probe nào chạy.
  - Cổng T1: T1 đợt 117 đóng với E4 ĐÓNG CÓ ĐIỀU KIỆN (tái hiện stall
    không tái hiện được: 3 lượt VOID + 1 retry DEFER-LOCK 902 s) — xem
    `docs/PHASE9_ROUND117_T1_E4STALL_LIMITS.md`.

## 10. File và dữ liệu
- LIMITS này: `docs/PHASE9_ROUND117_T2_ZOMBIE_LIMITS.md`.
- Prereg + addendum §0–§16: `hidden_files/round117-t2/prereg-t2.md`.
- Probe: `apps/web/scripts/probe117t2-frame-parity.mjs` (67.835 B).
- Driver/analyzer/scripts: `hidden_files/round117-t2/run-t2.sh`,
  `analyze-t2.py`, `apply-h3e.py`, `revert-h3e.py`,
  `run-suites-fix-t2.sh`, `run-f1-detached.sh`, `run-b1-detached.sh`,
  `diag-s2baseline.py`, `diag2-s2baseline.py`, `diag-attempt1.py`,
  `diag-attempt1b.py`, `h3e-fix.patch`, `seek-medians.txt`.
- Dữ liệu lượt: `hidden_files/round117-t2/chr-mixedalt-t2base-fr4/`
  (B0 att2, results.json 19.178.529 B), `chr-mixedalt-t2base-fr4-attempt1-bug/`
  (B0 att1, chỉ drain — không results.json),
  `chr-mixedalt-t2fix-fr4/` (F1, results.json 21.379.115 B),
  `chr-mixedalt-t2base-b1/` (B1, results.json 20.412.228 B); kèm
  `<tag>-analysis.txt`, `<tag>-load.tsv` cho mỗi lượt; `suites-fix.log`
  (suite cây fix), `driver-t2.log` (log driver chung).
- Cờ cây: `hidden_files/round117-tree` (NO-CHANGE, md5-final 03bf029f).
- Cờ done: `hidden_files/round117-t2.done`.
- Không push GitHub trong luồng này; không release/tag. Chỉ stage theo
  file paths-loop (xem §10 của task).
