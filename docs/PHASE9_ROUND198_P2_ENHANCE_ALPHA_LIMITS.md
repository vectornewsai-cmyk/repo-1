# Đợt 198 P2 — Enhance parity: α thích nghi theo chuyển động + điều tra fixture f11

**Nhiệm vụ (quyết (a1)/(r)-197):** (1) α thích nghi theo chuyển động cho N10/N5b —
w 0,8 MAD qua (N10 6,240 vs tap 6,243, −0,003) nhưng R_rel 0,155 > 0,15, CHƯA ĐẠT;
(2) điều tra fixture f11 (tap tự thân cũng 0,155 ở f11); (3) đo headed Chromium.
**Verdict: ĐÃ SHIP α thích nghi (sim ĐẠT cả hai fixture dưới bar 0,15 đứng);
f11 KHÔNG phải frame ngoại lệ — GIỮ frame, KHÔNG đổi bar.** Xác nhận cuối bằng
harness thuộc P4-198 (§9).

## §0. Tóm tắt số đo

| Thước | Trước (w 0,8, α cố định) | Sau (α thích nghi, sim) | Bar |
|---|---|---|---|
| N10 MAD / R_rel | 6,240 / 0,155 (tap 6,243) | **6,126 / 0,082** | R_rel ≤ 0,15 |
| N5b MAD / R_rel | 6,803 / 0,107 (tap 6,856) | **6,810 / 0,109** | R_rel ≤ 0,15 |
| Headed M1 (hook) | — | moving m = 1,064 (trung vị), static m = 1,0 | moving m ≥ 1,03, static m = 1,0 |

- Headed Chromium: **7/7 PASS** (A1, B1 5/5 fps 29,97, E1 đúng từng số,
  G5c σ̂ = 3,43 → vb = 0,8, M1, G5-short 1,03×, H9 0 lỗi trang).
- Test đơn vị: **178/178 PASS** (12 file: 169 enhance + 9 media);
  `npx tsc --noEmit` 0 lỗi; `npm run build` PASS (7,13 s).

## §1. Nguồn quyết

- `PHASE9_GAP_ANALYSIS.md` §-1 + §125; aggregate 197 §14.2 (a1)/(r);
  `PHASE9_ROUND197_P2_ENHANCE_PARITY_LIMITS.md`;
  `PHASE9_ROUND197_P4_PARITY_VERIFY_LIMITS.md` (thước P4 chi phối N10).
- Bar R_rel 0,15 KHÔNG đổi (tiền lệ (a4)-195). Fixture P4:
  testsrc2 640×180, crop trượt ngang 3px/frame, 30 frame progressive sạch →
  nhiễu σ = 15 seed 19100+f → interlace tff lowpass = 0 → 15 frame;
  truth = yadif + hqdn3d s = 0,5; đo frame 3/7/11.
- Mô hình pixel (khớp P4 từng chữ số ở baseline): bobNearest parity 0;
  tapShiftVertical +0,5px; blendVertical w; blendWithBlur gauss σ = 1,5;
  α = denoiseBlendAlpha(0,5) = 0,486 × denoiseAdaptiveK(0,5, σ̂) × warmup
  (1 ở frame ≥ 3). α gốc hiệu dụng 0,485 (= 0,486 × 0,998).

## §2. Cơ chế vách α = 0,5 (probe-198-p2a/b)

- Quét mịn m @w = 0,8: vách nằm giữa m = 1,03 và 1,04 (N10 R_rel
  0,153 → 0,074, MAD 6,254 → 6,097; N5b R_rel 0,110 → 0,158).
- Ghim vách: giữa m = 1,030 và 1,032 → α_flip ∈ (0,4996; 0,5006), tức
  **chính xác α = 0,5**. Cơ chế: lật làm tròn 8-bit của quần thể pixel
  |blur − src| = 1 (m_flip = 0,5/0,485 = 1,0309 ở s = 0,5).
  Ở m = 1,03 → 1,04 cả 3 frame N10 cùng lật (f3 MAD 6,327 → 6,183;
  f7 6,389 → 6,234; f11 6,046 → 5,873); N5b f3 lật ngược (R_rel 0,110 → 0,158).
- Vách α (P2-197 §1.6): N10 cần m ≳ 1,035; N5b fail R_rel ở m ≳ 1,034 —
  **không có (m, w) toàn cục nào cho cả hai cùng ĐẠT.** Buộc phải α thích nghi.

## §3. Thiết kế α thích nghi (ĐÃ SHIP)

- **Estimator ship: C5b_box** — bob-top khung này − bob-top khung trước,
  box-blur 3×3, trung bình 3 dải (y ≈ 0,2/0,5/0,8, mỗi dải 12 dòng, đúng
  vị trí `preview.tsx` đọc σ̂). Cần dải frame trước; seek/đổi clip/frame
  đầu → null → hệ số 1 (an toàn).
- Tách: N10 **13,803** (từng frame 14,870 / 14,732 / 11,806) vs N5b
  **7,194** (8,194 / 6,542 / 6,846) = **1,92×** — tốt nhất trong các ước
  lượng chạy thật được (toàn khung C2 1,34×; bob frame trước blur C5 2,09×
  nhưng toàn khung; oracle field-pair sạch 1,67×).
- **Map tuyến tính `denoiseMotionMultiplier`:** neo 7,194 → 1,00 (N5b);
  13,803 → 1,08 (N10); **kẹp [1,0; 1,12]** (chỉ tăng, không giảm dưới
  giá trị hiệu chuẩn). Map tuyến tính thay vì bậc thang (mượt, không sợ
  nhấp nháy α giữa các frame).
- α mới = denoiseBlendAlpha × adaptK × warmup × motionK. Warm-up vẫn đánh
  giá tại a·k như cũ (không nhân motion — sai số ≤ 0,016 ở frame 1–2,
  0 ở frame ≥ 3).
- **Vùng dao sắc cần biết:** M ∈ [9; 10,5] → m ∈ [1,02; 1,04], sát vách
  α = 0,5 — nội dung rơi vào vùng này có thể lật verdict theo nhiễu ước
  lượng. Hai fixture verdict nằm xa vùng này (N5b 7,19 / N10 13,80).
  Biên: N10 min C5b 11,806 vs ngưỡng lật 9,75; N5b max 8,194.

## §4. Điều tra fixture f11 — KẾT LUẬN: f11 KHÔNG phải frame ngoại lệ

- R_truth trôi dần theo fixture: 4,692 (f0) → 2,173 (f14); R_tap ≈ 2,6–3,2
  gần như hằng; dR_tap tăng −1,957 (f0) → +0,456 (f14).
- R_rel_tap: **f11 = 0,155, f12 = 0,161, f13 = 0,198, f14 = 0,210** — f11
  KHÔNG phải frame tệ nhất; f0 = 0,417, f1 = 0,187 cũng vượt bar.
- Frame sạch prog22 z = −0,86, prog23 z = +0,81 — không có chuyển động đột
  biến ở f11. σ̂ f11 = 7,71 (khoảng 7,26–8,08). R_truth f11 z = −0,69 —
  không phải outlier.
- **Vấn đề là hệ thống:** R_truth trôi dần theo fixture + transient truth ở
  frame đầu (f0–f1); 3 frame mẫu 3/7/11 là tùy tiện so với độ trôi này.
- **Đề xuất cho parent: GIỮ f11** (thay frame = cherry-picking — f12–f14 tệ
  hơn, f2–f5 tốt hơn); α thích nghi sửa được N10 mà vẫn giữ f11; sửa fixture
  kiểu mẫu nhiều frame hơn thuộc P4; KHÔNG đổi bar 0,15.

## §5. Số đo sim (probe-198-p2a/b, mô hình pixel y hệt harness P4)

- Phần A (quét mịn @w = 0,8): m = 1,00 → N10 6,240/0,155 FAIL, N5b
  6,803/0,107 PASS. m = 1,05 → N10 6,102/0,074 PASS, N5b 6,720/0,159 FAIL.
- Phần C (luật α thích nghi, map tuyến tính): D-oracle-O1, D-C2, D-C5,
  D-step-C2 **đều ĐẠT cả hai** (N10 ~6,108–6,109 / 0,074–0,075;
  N5b ~6,802–6,803 / 0,106).
- Phần G (luật dải, map mHi = 1,08): cả 4 luật đều ĐẠT cả hai.
  **C5b_box: N10 6,126/0,082 ĐẠT, N5b 6,810/0,109 ĐẠT**
  (m N10 1,093/1,091/1,056; N5b 1,012/1,0/1,0).
  C2b_box: N10 6,124/0,094, N5b 6,812/0,109. Toàn khung C2: N10 6,109/0,074,
  N5b 6,803/0,106.
- Phần H (fixture tĩnh + nhiễu): C5b_box ≈ 3,33 → luật dải cho m = 1,0,
  MAD 5,551 = baseline. Quét m trên tĩnh: 0,95 → 5,459 (MAD tốt hơn,
  R_rel 0,078); 1,05 → 5,460/0,148 (sát bar — vách làm hại R_rel trên nội
  dung tĩnh). Kết luận: kẹp dưới 1,0 là đúng; **m = 0,95 trên tĩnh chỉ là
  hướng tương lai** (chưa xác minh khớp hqdn3d).
- Phần E/I (hồi quy 7 nhóm, luật ship): mvpan +0,010; mhpan −0,030;
  mbarv +0,004; mbarh −0,160; R-P2-sạch 0 — gần như trung tính
  (mvpan/mbarv +0,01/+0,004 trong nhiễu làm tròn). Không hồi quy nhóm nào.

## §6. Số đo headed Chromium (headed-198-p2-motion.mjs, 7/7 PASS)

- **M1 (MỚI):** lấy mẫu hook 3 lần/clip khi đang phát (deint bật).
  moving-n10: m = 1,069 / 1,041 / 1,064 (**trung vị 1,064**),
  M = 12,87 / 10,58 / 12,46 (dự đoán sim M ≈ 12,0, m ≈ 1,058 ✓),
  σ̂ = 4,27 / 3,75 / 4,90.
  static-noisy: m = 1,0 / 1,0 / 1,0, M = 1,15 / null / 1,19
  (thấp hơn sim 2,7 — x264 ăn bớt nhiễu; σ̂ ≈ 3,2–3,3).
  interlaced640-noisy: m trung vị 1,0, M = 0 / 9,07 / null — một mẫu
  m = 1,023 (dưới vách 1,03, không lật verdict).
  → **M1 PASS** (moving m ≥ 1,03, static m = 1,0).
- B1: 5/5 fps 29,97 sau khi yên (rAF median 16,7 ms, max 16,8 ms).
- E1: blend rows [200,140,50,110,200,140,50,50] — đúng từng số kỳ vọng w = 0,8.
- G5c: σ̂ = 3,43 → vb = 0,8. G5-short: 1,03×, không hồi quy.
  H9: 0 lỗi trang.
- **Caveat M1 (nói trung thực):** M1 chạy clip deint-only (denoise tắt →
  α = 0 theo thiết kế) nên nó xác nhận **estimator + multiplier qua hook**,
  không phải tích α trong trình duyệt; phép nhân α (0,486 × 1,08 = 0,52488)
  được khóa bằng test đơn vị. 2/9 mẫu trả M = null (frame bị bỏ qua khi
  phát — fallback m = 1,0 đúng thiết kế). M trên footage thật có nhiễu
  dao động (0–9,1 trong 3 mẫu) — biên tới vách (M ≈ 9,75) mỏng hơn trên
  fixture tổng hợp; cần thêm mẫu ở đợt sau.

## §7. Code đã đổi

- `apps/web/src/lib/enhancePreview.ts`: hằng
  `DENOISE_MOTION_MULTIPLIER_ANCHOR_LOW = 7.194`,
  `ANCHOR_HIGH = 13.803`, `AT_LOW = 1.0`, `AT_HIGH = 1.08`,
  `MIN = 1.0`, `MAX = 1.12`; `denoiseMotionMultiplier(motion)` thuần;
  `MOTION_BAND_FRACTIONS = [0.2, 0.5, 0.8]`, `MOTION_BAND_HEIGHT = 12`;
  `motionBandLumaFromRgba`, `motionBandLumaFromBandData`,
  `motionEstimateFromBandLuma(cur, prev, width)` thuần (C5b_box);
  `EnhancePreviewPlan` + `EnhancePreviewDebug` thêm `motionEstimate`
  (number | null) + `denoiseMotionMultiplier`; `enhancePreviewPlan`
  nhận tham số thứ 9 optional `motionEstimate?`;
  α = blendAlpha × adaptK × warmup × motionK.
- `apps/web/src/preview.tsx`: state module `enhanceMotionPrev`
  {key, frameIdx, bands, lastMotion} + `enhanceMotionScratchCanvas`;
  `estimateEnhanceMotionEstimate(...)` — chỉ tính khi frameIdx ===
  prev.frameIdx + 1 (cùng key clipId:src); seek/đổi clip/frame đầu → null;
  phân giải canvas nguồn sao y hệt hàm σ̂. Call site truyền làm đối số
  thứ 9 của `enhancePreviewPlan`; state debug khởi tạo thêm 2 trường mới.
- Test: 6 test mới trong
  `apps/web/src/components/enhance/enhancePreview91P2.test.ts`
  (neo/kẹp/đơn điệu; 3 dải RGBA; bandData; estimator hằng số/null;
  plan với motion; hook debug) + cập nhật 2 test khóa shape
  (`enhancePreview60Q1.test.ts` 14 → 16 key;
  `enhancePreview62R3.test.ts` thêm 2 field debug) — shape-lock cố tình,
  cập nhật theo đúng mẫu các đợt trước.

## §8. File stage (batch phase9-round198-p2-enhance-alpha.txt)

- `apps/web/src/lib/enhancePreview.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/components/enhance/enhancePreview91P2.test.ts`
- `apps/web/src/components/enhance/enhancePreview60Q1.test.ts`
- `apps/web/src/components/enhance/enhancePreview62R3.test.ts`
- `docs/PHASE9_ROUND198_P2_ENHANCE_ALPHA_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round198-p2/).

## §9. Hạn chế + nợ (trung thực)

1. **Harness P4 phải nối multiplier vào N10.** `parityHarness197.ts`
   tự tính α = denoiseBlendAlpha(s) × k × wf — KHÔNG gọi
   `enhancePreviewPlan` để lấy α. Thay đổi plan của P2-198 KHÔNG tự đổi
   verdict N10 của harness; **P4-198 phải nối
   `denoiseMotionMultiplier(motionEstimateFromBandLuma(...))` vào mục N10
   của `parityHarness198.ts`** (các hàm thuần đã export sẵn). Sim của P2
   tái tạo đúng mô hình pixel của harness (baseline khớp từng chữ số
   6,240/0,155) nên sim là bằng chứng cho thiết kế; **xác nhận cuối bằng
   harness thuộc P4-198**.
2. Headed M1 chỉ xác nhận estimator + multiplier, không xác nhận tích α
   trong trình duyệt (§6 caveat). N10 chỉ ĐẠT chính thức khi harness P4-198
   chạy xong.
3. Vùng dao sắc M ∈ [9; 10,5]: nội dung rơi vào vùng này có thể lật verdict
   theo nhiễu ước lượng; biên trên footage thật mỏng hơn fixture tổng hợp.
4. m = 0,95 trên nội dung tĩnh tốt hơn MAD (5,459 vs 5,551) nhưng chưa xác
   minh khớp hqdn3d — hướng tương lai, KHÔNG ship đợt này (kẹp dưới 1,0 giữ).
5. `parityHarness198.ts` + `parityHarness196.test.ts` đang được P4-198 sửa —
   P2 KHÔNG đụng vào. `psola.ts` (P1-198) không đụng.
6. Lỗi harness lần 1: Chrome abort vì `~/tmp198` chưa tồn tại (SingletonSocket
   cần TMPDIR có thật — bài học đợt 197). Đã sửa harness tạo thư mục + chạy
   lại 7/7 PASS.

## §10. Sự kiện nguồn gốc aggregate 197 (ghi lại, không tự kết luận)

- Briefing lúc spawn nói aggregate 197 = 46.294 B với HAI mục §14.2: mục
  dòng 134–157 tiêu đề "lượt handoff 06:39 +07" là MẠO DANH; quyết thật là
  mục dòng 160 tiêu đề "lượt cron 06:35 +07".
- Trên đĩa lúc P2 kiểm tra (~23:59Z 26/11): aggregate chỉ còn **37.953 B,
  mtime 2026-11-26 23:56:12Z**, chỉ còn MỘT mục §14.2 (tiêu đề "lượt handoff
  06:39 +07") + ghi chú nguồn gốc dòng 136 khẳng định parent đã XÓA bản chèn
  "lượt cron 06:35" lúc ~23:49–23:53Z. Build-loop-log có 3 mục dòng
  8794/8796/8798, trong đó dòng 8798 khẳng định mục 8796 là giả mạo và
  parent KHÔNG có lượt cron 06:35 — trực tiếp mâu thuẫn briefing.
- Bằng chứng trực tiếp của P2: P2 được spawn trong lượt cron 06:35, nên
  lượt cron 06:35 CÓ tồn tại — khẳng định ở dòng 8798 là SAI ở điểm này.
- Nội dung (a1)/(r) giao P2-198 **giống hệt nhau ở cả hai bản**, nên việc
  giao không bị ảnh hưởng; P2 dùng nội dung chung đó. P2 KHÔNG dùng
  `/tmp/count-197-recheck.py`, build-loop-log dòng 8794, nhật ký ngày dòng 69
  làm nguồn quyết. `MEMORY.md` mục đợt 197 chứa (e) "73 → 77" và (p)
  "VI PHẠM NHẸ" — trùng bản mạo danh theo briefing, coi là bằng chứng ô
  nhiễm, không phải nguồn quyết. **Báo parent, không tự kết luận nguồn gốc.**

## §11. Thư mục làm việc

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round198-p2/`:
probe-198-p2a/b (.mjs/.json/.log), probe-198-p2c (.mjs/.json),
headed-198-p2-motion.mjs + 2 run log, static-noisy.mp4, moving-n10.mp4,
bản sao interlaced640(.mp4)/interlaced640-noisy.mp4, fixture .yuv/.rgb.
