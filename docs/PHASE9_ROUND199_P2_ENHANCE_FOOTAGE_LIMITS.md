# Đợt 199 P2 — Enhance parity: estimator trên footage thật + m = 0,95 trên tĩnh thật

**Nhiệm vụ (quyết (r)-198):** (1) thêm mẫu estimator C5b_box trên FOOTAGE THẬT
(biên tới vách M ≈ 9,75 mỏng — kiểm xem estimator còn đúng trên nội dung thật
không, hay chỉ đúng trên fixture); (2) xem xét m = 0,95 trên nội dung tĩnh —
HƯỚNG TƯƠNG LAI, CHƯA SHIP; (3) giữ N10/N5b ĐẠT qua bar 0,15 (harness P4-199
xác minh độc lập).
**Verdict: ESTIMATOR ĐÚNG TRÊN FOOTAGE THẬT — pan thật M ≈ 16,0 (cao hơn cả
N10 fixture 13,8), boost kích hoạt đúng; footage nhẹ M ≈ 6,0, xa vách, an
toàn. m = 0,95 KHÔNG SHIP — không tái hiện lợi ích trên footage thật.
N10/N5b GIỮ ĐẠT (sim khớp P4-198 từng số). KHÔNG ĐỔI CODE SẢN PHẨM đợt này.**

## §0. Tóm tắt số đo

| Thước | Số đo | Bar / kỳ vọng |
|---|---|---|
| N10 sim (re-check) MAD / R_rel | **6,126 / 0,082 ĐẠT** (tap 6,243) | R_rel ≤ 0,15 |
| N5b sim (re-check) MAD / R_rel | **6,810 / 0,109 ĐẠT** (tap 6,856) | R_rel ≤ 0,15 |
| BBB 5 cửa sổ, σ=15: M (trung bình) | 5,976–6,011 (min 5,792 / max 6,191) | xa vách 9,75 |
| BBB 5 cửa sổ: verdict luật thích nghi | **ĐẠT cả 5** (MAD 6,517–6,551; R_rel 0,116–0,121) | R_rel ≤ 0,15 |
| Pan thật σ=15: M / verdict | meanM **16,025**; adapt 6,695/0,105 **ĐẠT** | M > 9,75 → m > 1 |
| Pan thật σ=5: M / verdict | meanM **14,748**; adapt 5,814/0,114 **ĐẠT** | — |
| Tĩnh thật m = 0,95 vs m = 1,0 (MAD) | 6,498 vs 6,492 (tĩnh-khung-thật); 6,523 vs 6,517 (w6s) | 0,95 tốt hơn mới xét ship — KHÔNG |
| w0s σ=5: R_rel (phát hiện mới) | **0,245 CHƯA ĐẠT** (cả adapt lẫn fixed; tap cũng 0,246) | xem §5 |
| tsc / test đơn vị | `tsc --noEmit` 0 lỗi; enhance **169/169**, media **59/59** | — |

## §1. Nguồn quyết + phương pháp

- Aggregate 198 §14.2 (a1)/(r) — NGUỒN QUYẾT DUY NHẤT (bản
  `hidden_files/round198-parent-decisions.md` là GIẢ, không dùng);
  `PHASE9_ROUND198_P2_ENHANCE_ALPHA_LIMITS.md` §§3–6;
  `PHASE9_ROUND198_P4_PARITY_VERIFY_LIMITS.md` (thước P4 chi phối N10).
- Footage thật: **Big Buck Bunny 10 s, 1280×720 30fps, CC-BY 3.0 Blender
  Foundation** (`test-videos.co.uk`, 969.201 B, `bbb-10s.mp4`) — license
  sạch, ghi attribution. 5 cửa sổ 1 s (t = 0/2/4/6/8 s) + 1 khung lặp
  tĩnh + 1 pan tổng hợp từ khung thật (xem §3).
- Pipeline Y HỆT fixture P4: khung 320×180, 30 khung progressive sạch →
  nhiễu Gauss σ = 15 (seed 19100+f, đúng fixture) → interlace tff
  lowpass = 0 → 15 khung; truth = yadif + hqdn3d s = 0,5; đo khung 3/7/11.
  Thêm nhánh σ = 5 (nhiễu thực tế hơn) ở §3/§5. M = C5b_box (bob-top
  khung này − bob-top khung trước, box-blur 3×3, 3 dải y ≈ 0,2/0,5/0,8);
  m = map tuyến tính ship (neo 7,194 → 1,0; 13,803 → 1,08; kẹp [1,0; 1,12]).
  Vách α = 0,5 ↔ m = 1,0309 ↔ **M ≈ 9,747**.
- Truth thứ hai cho §4: MAD vs khung SẠCH gốc (không nhiễu) — thước trung
  thực cho denoise, vì MAD-vs-truth (hqdn3d) thưởng làm mờ quá mức (§4).

## §2. Fixture re-check + đối chiếu hàm ship thật

- **(A) N10/N5b sim khớp P4-198 TỪNG SỐ:** N10 M = 14,870 / 14,732 /
  11,806 → m = 1,093 / 1,091 / 1,056 → MAD 6,126, tap 6,243, R_rel 0,082
  **ĐẠT**; N5b M = 8,194 / 6,542 / 6,846 → m = 1,012 / 1,0 / 1,0 → MAD
  6,810, tap 6,856, R_rel 0,109 **ĐẠT**. N10/N5b GIỮ ĐẠT ở tầng sim;
  verdict chính thức thuộc harness P4-199.
- **(E) Hàm ship thật (bundle esbuild từ `enhancePreview.ts`):**
  `denoiseMotionMultiplier(7,194) = 1`, `(13,803) = 1,08`,
  `(9,747) = 1,0309`, `(NaN) = 1`; neo đúng 7,194 / 13,803.
  `motionEstimateFromBandLuma` trên khung N10 f3 = **14,87 = đúng probe
  C5b_box (diff 0)** — probe tái tạo đúng code ship, không trôi.

## §3. Estimator trên footage thật — ĐÚNG, và biên vách KHÔNG mỏng như lo ngại

- **(B) BBB 5 cửa sổ, σ=15:** meanM 5,976–6,011, min 5,792, max 6,191
  (70 khung interlaced, **0 khung** rơi vào vùng dao sắc [9; 10,5]).
  M_clean (không nhiễu) chỉ 0,871–1,399 → **~80% của M là sàn nhiễu**,
  chuyển động thật chỉ ~1,2. m = 1,0 mọi khung (M < neo thấp 7,194).
  Verdict luật thích nghi = verdict m = 1 cố định: MAD 6,517–6,551 vs
  tap 6,593–6,626, R_rel 0,116–0,121, **ĐẠT cả 5**. Lo ngại đợt 198
  ("biên tới vách mỏng") KHÔNG xảy ra trên footage nhẹ: M ngồi xa DƯỚI
  vách (6,0 so với 9,75), không phải sát vách — boost không kích hoạt
  nhưng cũng không cần (verdict đã ĐẠT ở m = 1).
- **(F) Pan thật — chuyển động mạnh, texture thật:** 1 khung BBB t = 5 s,
  crop 320×180 trượt ngang 3 px/khung (ĐÚNG chuyển động fixture N10).
  σ=15: meanM **16,025** (15,258–17,280), M_clean 13,901 / 14,028 /
  15,276 — chuyển động CHIẾM ƯU THẾ, estimator THẤY chuyển động thật
  (M cao hơn cả N10 fixture 13,8). m = 1,100 / 1,101 / 1,116 (f11 chạm
  gần kẹp trên 1,12). Adapt: MAD 6,695, R_rel 0,105 **ĐẠT**; fixed m = 1:
  6,767 / 0,080 **ĐẠT**. σ=5: meanM 14,748, adapt 5,814 / 0,114 **ĐẠT**,
  fixed 5,808 / 0,085 **ĐẠT**. Boost giúp MAD chút ít ở σ=15 (6,695 so
  với 6,767) nhưng làm R_rel tệ hơn chút (0,105 so với 0,080); ở σ=5
  MAD adapt nhỉnh hơn fixed không đáng kể (5,814 so với 5,808). **Không
  có verdict nào lật theo hướng nào trên nội dung thật** — khác fixture
  N10, nơi boost là BẮT BUỘC (0,155 → 0,082). Kết luận: N10 fixture
  FAIL ở m = 1 là đặc thù testsrc2 (răng cưa cực mạnh); footage thật
  ĐẠT ngay cả ở m = 1, và estimator vẫn phân biệt đúng khi chuyển động
  mạnh (M 16,0 so với 6,0).
- **Sai lầm probe lần 1 (ghi trung thực, số lần 1 BỎ):** trích khung pan
  bằng `-f image2` chỉ ra 123.169 B (không phải 2.764.800 B raw) → crop
  đọc ngoài biên → 30 khung toàn đen, M_clean = 0, R_rel 0,568–1,125
  vô nghĩa. Đã sửa sang `-f rawvideo` + assert kích thước, chạy lại
  toàn bộ (probe-199-p2b.log lần 2). Số lần 1 KHÔNG dùng ở đâu.

## §4. m = 0,95 trên tĩnh thật — KHÔNG SHIP (không tái hiện lợi ích)

- **(C) Tĩnh-từ-khung-thật** (lặp 1 khung BBB 30×, texture thật,
  chuyển động 0; M mean 5,833, m luật = 1,0): quét m — 0,90 → MAD
  6,559 / R_rel 0,097; **0,95 → 6,498 / 0,112**; 1,0 → **6,492** /
  0,121; 1,05 → 6,455 / 0,134. MAD-vs-khung-sạch: 9,019 / **8,934** /
  **8,903** / 8,838 (tap-sạch 8,838).
- **(D) w6s (cửa sổ tĩnh nhất thật):** 0,90 → 6,586 / 0,094; **0,95 →
  6,523 / 0,109**; 1,0 → **6,517** / 0,118; 1,05 → 6,482 / 0,131.
  MAD-vs-sạch: 9,028 / **8,941** / **8,911** / 8,848 (tap-sạch 8,849).
- Đối chiếu fixture-tĩnh đợt 198: m = 0,95 cho MAD 5,459 so với 5,551
  ở m = 1 (tốt hơn 0,092). **Trên footage thật, m = 0,95 TỆ HƠN m = 1
  ở cả hai thước (MAD-vs-truth +0,006, MAD-vs-sạch +0,03) trên cả hai
  nhóm tĩnh.** Lợi ích đợt 198 là đặc thù nội dung tổng hợp. R_rel có
  cải thiện khi m giảm (0,097 ở 0,9 → 0,134 ở 1,05) nhưng MAD mới là
  thước ràng buộc verdict so với tap — và tap vẫn thắng về MAD-vs-sạch
  ở mọi m (8,838 so với 8,903 ở m = 1). **Đề xuất cho parent: GIỮ kẹp
  dưới 1,0, KHÔNG ship m = 0,95.** (Ghi chú: MAD-vs-truth thưởng làm mờ
  quá mức — m = 1,05 "tốt nhất" vs truth nhưng bằng đúng tap vs sạch;
  thước sạch là thước trung thực hơn cho câu hỏi này.)

## §5. Phát hiện mới: R_rel phụ thuộc σ — bar 0,15 hiệu chuẩn ở σ = 15

- **(G) w0s ở σ=5:** MAD 5,237 < tap 5,333 (tốt hơn σ=15) nhưng R_rel
  **0,245 / 0,216 / 0,213 CHƯA ĐẠT** (cả adapt lẫn fixed — m = 1,0 nên
  hai đường giống hệt nhau). Cơ chế đo trực tiếp: R_truth 7,165 /
  6,877 / 6,830, R_out 5,411 / 5,392 / 5,375, |ΔR| = 1,456–1,754; ở
  σ=15, |ΔR| chỉ 1,031–1,099. Vì σ̂ thấp (8,6 so với 12,9) → α ≈ 0,46
  (so với 0,27) → làm mờ quá mức so với truth hqdn3d → R_out tụt sâu
  dưới R_truth. **Tap cũng FAIL y hệt (R_rel 0,246 / 0,217 / 0,214)**
  → bar 0,15 KHÔNG ĐẠT ĐƯỢC bằng bất kỳ phương pháp nào trên nội dung
  nhẹ ở σ=5. Đây là vấn đề HIỆU CHUẨN THƯỚC (bar gắn với σ=15),
  KHÔNG phải lỗi estimator (m = 1,0 suốt) và KHÔNG đổi verdict N10/N5b
  (harness dùng σ=15). Pan σ=5 vẫn ĐẠT (R_rel 0,098–0,114) — lỗi chỉ
  xuất hiện trên nội dung nhẹ + nhiễu thấp. **Nợ P4/parent:** xem xét
  thước R_rel theo σ (bar động, hoặc |ΔR| tuyệt đối) nếu muốn verdict
  có ý nghĩa trên footage thật ít nhiễu.
- Caveat kèm theo: σ̂ trên footage thật ≈ 12,9 ở σ=15 (fixture N10
  ~7,7) — texture thật đẩy σ̂ lên, tức α hiệu dụng trên footage thật
  (0,267) thấp hơn nhiều so với fixture cùng σ nhiễu; hiệu chuẩn α
  (bảng adaptive-K) được làm trên fixture, chưa chắc tối ưu trên
  texture thật. Nợ đo, không chặn đợt này.

## §6. Code đã đổi

- **KHÔNG ĐỔI code sản phẩm đợt này** (chỉ đo + báo cáo, đúng brief).
  `enhancePreview.ts`, `preview.tsx`, test giữ nguyên đợt 198.
- Probe + bundle đối chiếu nằm ở `hidden_files/round199-p2/` (không stage).

## §7. Số đo kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- Test đơn vị (bundle esbuild, mẫu P2-198): enhance **169/169 PASS**
  (11 file: 21+16+7+10+8+14+10+11+49+9+14); media **59/59 PASS**
  (6 file: captureThumb 2, blobPrefetch 25, retryPlay95W2 7,
  retryPlay96X3 7, stallWatchdog 9, fpsProbe 9). Lưu ý: vitest 5.1.2
  qua npx KHÔNG chạy được các file này ("No test suite found" — chúng
  dùng harness `ok()/runAll()` riêng, không phải vitest); chạy đúng
  mẫu esbuild trong header file test.
- vite build: KHÔNG chạy (không đụng app — không đổi code).

## §8. File stage (batch phase9-round199-p2-enhance-footage.txt)

- `docs/PHASE9_ROUND199_P2_ENHANCE_FOOTAGE_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round199-p2/).

## §9. Hạn chế + nợ (trung thực)

1. BBB 10 s chỉ có chuyển động nhẹ (M_clean ~1,2) — phủ chuyển động mạnh
   bằng pan tổng hợp từ khung thật, chưa có clip hành động nhanh tự
   nhiên (thể thao, xe chạy). Pan chứng minh estimator thấy chuyển động
   mạnh trên texture thật; clip nhanh tự nhiên vẫn là mẫu thiếu.
2. R_rel phụ thuộc σ (§5) — bar 0,15 chỉ có ý nghĩa ở σ=15; footage
   thật ít nhiễu cần thước khác (nợ P4/parent).
3. m = 0,95 kết luận trên 2 nhóm tĩnh thật (1 lặp khung + 1 cửa sổ);
   hiệu ứng nhỏ (±0,006 MAD) — đủ để KHÔNG ship, chưa đủ để khẳng định
   m < 1 không bao giờ tốt trên mọi nội dung tĩnh.
4. σ̂ trên texture thật cao hơn fixture (§5 caveat) — hiệu chuẩn α có
   thể chưa tối ưu trên footage thật; nợ đo riêng.
5. Verdict N10/N5b chính thức thuộc harness P4-199 (sim P2 chỉ tái tạo
   mô hình pixel; đã khớp P4-198 từng số nên sim đáng tin).
6. Probe p2b lần 1 hỏng do `-f image2` (§3) — số lần 1 đã bỏ, không dùng.

## §10. Thư mục làm việc

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-p2/`:
probe-199-p2a.mjs/.json/.log, probe-199-p2b.mjs/.json/.log (lần 2),
enhancePreview.bundle.mjs (đối chiếu hàm ship), bbb-10s.mp4 (CC-BY),
bbb-*.rgb/.yuv (trung gian, không stage), test-bundle/ (bundle test).
