# Đợt 65 S2 — Hiệu chuẩn detector R2 trên footage thật + pan 12px/f; thống nhất cảnh báo denoise ≥0,7: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt ~15:35–17:30, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264, Chromium headless 1254).
Đóng nợ đợt 64 §8 mục 2 (LIMITS gộp §4 + §8 mục 2): hiệu chuẩn ngưỡng detector
R2 (fastMotion) trên footage thật + pan 12px/f; thống nhất cảnh báo denoise
≥0,7 với kết luận R4 — mâu thuẫn R2↔R4 ĐÃ GIẢI QUYẾT BẰNG SỐ ĐO (xem §1).
Harness mới: `server/render/src/test_round65_s2_fast_motion_real.js`
(**87/87 pass, exit 0** — run 2; run 1 bị giết giữa chừng ở B3 do phiên nền
mất, xem §7). Self-test `fastMotion.js`: pass. Web unit
`apps/web/src/components/enhance/fastMotion64R2.test.ts`: **14/14 pass**.
Headed Playwright `headed-fast-motion-s2.mjs`: xem §5.
Log đầy đủ tại `~/workspace/.scratch-r65s2/` (`harness-run1.log`,
`harness-run2.log`, `r2-harness-rerun.log`, `summary.json`, `ghost-*.json`).
Không sửa code production ngoài fastMotion (server+web) + EnhancePanel +
fragment mới; không đụng vi.json/en.json trực tiếp (chỉ thêm fragment
`round65-s2.json` để parent gộp).

## 1. Kết luận ngắn — mâu thuẫn R2↔R4 đã giải quyết

- **Cổng cảnh báo cũ (chỉ clip nhanh mới cảnh báo) BỊ BÁC BỎ bằng số đo.**
  Trên 6 clip footage thật ghost-positive (nhảy b_small 0,5→0,7 ≥ 0,05),
  cổng cũ bỏ sót **4/6** (FN=4, FP=0): ocean-slow (0,6 px/f),
  basgo-mid (2,5 px/f), basgo-fast (6,0 px/f) và ocean-pan12 (12,7 px/f)
  đều ghost như clip nhanh nhưng detector nói slow nên UI cũ im lặng.
- **Quy tắc mới (đã sửa code): cảnh báo ở denoise ≥0,7 với MỌI mức chuyển
  động đo được (slow/medium/fast).** FN mới = **0/6**, FP mới = **1**
  (chỉ clip tĩnh tổng hợp static-clean — xem §5 về cái giá này).
  Unknown vẫn cảnh báo chung riêng (không đổi).
- **Ngưỡng phân loại FAST=6,0/MEDIUM=4,0 GIỮ NGUYÊN.** Không có ngưỡng nào
  phân tách được tốc độ pan trên footage thật: cùng 12 px/f, mặt nước
  phẳng cho score **2,1 (slow)** trong khi đường phố cho **9,7 (fast)**;
  pan 6 px/f trên núi (2,909) còn cho score CAO HƠN pan 12 px/f trên mặt
  nước (2,056). Score đo lượng thay đổi pixel (phụ thuộc nội dung), không
  đo tốc độ pan. Level nay chỉ còn là thông tin hiển thị trong câu cảnh
  báo, không còn là cổng quyết định.
- **Nhảy ghost 0,5→0,7 gần như không đổi theo tốc độ tới 13,6 px/f:**
  0,057–0,083 trên 6 clip thật (0,6 / 2,5 / 6,0 / 7,9 / 12,7 / 13,6 px/f),
  mở rộng dải của R4 (0,057–0,077 ở 0,6–7,9 px/f). Ở 13,6 px/f nhảy
  0,0831 — hơi cao hơn dải R4 (+0,006 so với max cũ) nhưng cùng bậc độ
  lớn; không đủ để giữ cổng theo tốc độ. Whip-pan >14 px/f vẫn chưa có số.

## 2. Hiệu chuẩn detector trên footage thật (server, 30fps cố định)

Footage: 3 clip gốc đợt 64 R4 (SHA256 kiểm lại trong harness, khớp R4:
ocean `4b9e690d…`, basgo `7ed32bc7…`, slovenska `ae8f684c…`; CC0/CC BY 3.0,
Wikimedia Commons). 4 đoạn 5s 720p CRF18 tái dùng nguyên từ R4; pan 12px/f
dựng từ footage thật (xem §2.2).

### 2.1 Bảng score detector (mean |Δ| sau mờ nhẹ, thang 0–255)

| Clip | Tốc độ pan (đo, px/f) | Score | Level | smallBand | Ghi chú |
|---|---|---|---|---|---|
| ocean-slow | 0,60 | 0,714 | slow | 0,0591 | R4: camera gần như đứng yên |
| basgo-mid | 2,48 | 1,649 | slow | 0,1863 | panorama pan vừa |
| basgo-fast | 5,98 | 2,909 | slow | 0,2815 | panorama pan nhanh |
| slov-fast | 7,86 | 6,471 | fast | 0,2260 | đường phố + xe chạy |
| ocean-pan12 | 12,72 | 1,549 | slow | 0,1055 | dựng từ ocean (xem §2.2) |
| slov-pan12 | 13,59 | 9,332 | fast | 0,2820 | dựng từ slovenska t=30 |
| ocean-pan12-native | 12,00 | 2,056 | slow | 0,1807 | đối chứng native, không upscale |
| slov-pan12-native | 12,01 | 9,712 | fast | 0,2863 | đối chứng native, không upscale |
| static-clean (tổng hợp) | 0 | 0,001 | slow | ~0 | texture seed 64 như R2 |

- **Tái hiện xác định:** đo lại 4 đoạn R4 cho score giống hệt số đo tay
  tới 3 chữ số thập phân (0,714 / 1,649 / 2,909 / 6,471); run 2 tái hiện
  đúng mọi score của run 1. Pipeline xác định, không cần đo lặp spread.
- **Cùng tốc độ, 2 level đối nhau:** ở đúng 12,00–12,01 px/f (bản native,
  phase correlation đo chính xác), ocean → slow (2,056) còn slovenska →
  fast (9,712). Bản upscale cũng đối nhau (1,549 slow / 9,332 fast).
  Đây là bằng chứng trực tiếp: score không đo tốc độ pan, nó đo lượng
  thay đổi pixel — mà lượng đó do nội dung quyết định.
- **So với hiệu chuẩn tổng hợp R2:** pan 6px/f tổng hợp 2,834 ≈ pan
  6,0px/f thật trên núi 2,909 (khớp tốt — texture núi giống texture tổng
  hợp). Nhưng pan 12px/f thật trên mặt nước chỉ 1,5–2,1 — THẤP HƠN cả
  pan 6px/f. Ngưỡng FAST=6,0 trên clip tổng hợp tương đương pan ~15–20
  px/f trên nội dung phẳng, nhưng chỉ ~7–8 px/f trên nội dung đường phố
  bận rộn. Không có một ngưỡng tốc độ chung nào.
- **Chi phí đo server:** 187–207ms/giây clip cho đoạn R4 5s; 410–633ms/
  giây clip cho pan12 (file 3,5s — decode chiếm phần lớn, như R2 §2.5).

### 2.2 Cách dựng pan 12px/f từ footage thật (không phải crop ảnh tĩnh)

Đúng gợi ý R4 §8 ("dựng pan nhanh từ footage thật bằng cách quay lại").
Nền tĩnh đã đo: ocean t=0 (0,54 px/f) và slovenska t=30 (0,59 px/f,
resp 0,86 — cửa sổ tĩnh nhất trong scan đợt 64).
- Bản chính (3,5s): crop 960×540 trượt 9px/frame ở 30fps, scale lên
  1280×720 → 12px/frame ở đầu ra (travel 960px = 106 frame).
- Đối chứng native (1,75s): crop 1280×720 trượt 12px/frame trực tiếp,
  không upscale (travel 640px = 53 frame).
- Tốc độ CUỐI đo lại bằng phase correlation (y hệt R4): bản native đúng
  **12,00 / 12,01 px/f** (resp 0,65/0,87) — phương pháp dựng đã kiểm
  chứng; bản upscale đo **12,72 / 13,59 px/f** (cộng thêm chuyển động nền
  của sóng/xe + upscale). Số đo dùng trong mọi kết luận là tốc độ ĐO
  ĐƯỢC, không phải danh nghĩa 12.
- Hạn chế trung thực: đây vẫn là pan tổng hợp áp lên footage thật (chuyển
  động camera thật ở >8 px/f không tìm thấy trong các clip CC0/CC-BY đã
  khảo sát — R4 đã ghi). Nội dung là thật (texture, nhiễu, motion blur
  của footage), chỉ chuyển động camera là dựng. Pan whip thật >14 px/f
  vẫn chưa có số.

## 3. Ghost ở pan ~12px/f (render thật qua render.js, veryfast/CRF23)

Phương pháp y hệt R4 (frame gray thô, hồi quy b theo dải |dC|; kết luận
trên phần vượt sàn b − b_ctrl). Đoạn 3,5s @30fps (105 frame).

### 3.1 b_small — con số kết luận

| Đoạn (tốc độ đo) | ctrl (sàn) | 0,5 | 0,7 | 0,8 | Nhảy 0,5→0,7 | Nhảy 0,7→0,8 |
|---|---|---|---|---|---|---|
| ocean-slow (0,6 px/f) | 0,1257 | 0,3787 | 0,4370 | 0,4599 | **0,0583** | 0,0229 |
| basgo-mid (2,5 px/f) | 0,1163 | 0,3458 | 0,4168 | 0,4417 | **0,0710** | 0,0249 |
| basgo-fast (6,0 px/f) | 0,1159 | 0,3775 | 0,4345 | 0,4539 | **0,0570** | 0,0194 |
| slov-fast (7,9 px/f) | 0,0792 | 0,5033 | 0,5806 | 0,6097 | **0,0773** | 0,0291 |
| ocean-pan12 (12,7 px/f) | 0,1036 | 0,4774 | 0,5523 | 0,5785 | **0,0749** | 0,0262 |
| slov-pan12 (13,6 px/f) | 0,0558 | 0,4588 | 0,5419 | 0,5713 | **0,0831** | 0,0294 |

- 4 đoạn R4 tính LẠI từ frame đợt 64 (không render lại): nhảy tái hiện
  đúng số R4 (0,0583/0,071/0,057/0,0773 so với 0,058/0,071/0,057/0,077 —
  lệch ≤0,0003). Pipeline xác định.
- Nhảy 0,5→0,7 trên 6 clip thật: **0,057–0,083**, không đơn điệu theo tốc
  độ (điểm 2,5 px/f nhảy mạnh hơn điểm 6,0 px/f; điểm 12,7 px/f nhảy
  0,0749, thấp hơn điểm 13,6 px/f 0,0831 nhưng cao hơn điểm 0,6 px/f
  0,0583 — không có xu hướng sạch). Dải R4 (tới 7,9 px/f) mở rộng lên
  13,6 px/f mà không đổi bản chất.
- Mức tuyệt đối ở 0,7: slov-fast 0,581 vẫn cao nhất (R4 §4.3: mặt đường
  phẳng); slov-pan12 0,542 và ocean-pan12 0,552 cũng cao — pan 12px/f
  đẩy mức tuyệt đối lên gần mức slov-fast. Nội dung + tốc độ cùng góp,
  nhưng BƯỚC NHẢY (thứ cảnh báo nhắm tới) thì không phân biệt tốc độ.

### 3.2 Trail + dải flat (quan sát phụ, không phải kết luận chính)

| Đoạn | trail small ctrl → 0,5 → 0,7 → 0,8 | b_flat 0,5 → 0,7 → 0,8 |
|---|---|---|
| ocean-pan12 | 1,77 → 3,59 → 4,15 → 4,42 | 1,07 → 1,23 → 1,30 |
| slov-pan12 | 1,49 → 3,41 → 4,17 → 4,51 | 0,71 → 0,78 → 0,80 |

- **b_flat > 1 trên mặt nước pan:** ở ocean-pan12, hệ số blend dải flat
  ( |dC| ≤ 2) lên tới 1,07–1,30 — render lệch khỏi frame chuẩn NHIỀU HƠN
  cả độ thay đổi giữa 2 frame chuẩn. Đây là hồi quy trên dải flat (vùng
  nước phẳng, |dC| nhỏ nhưng denoise làm phẳng mạnh + encode CRF23), không
  phải "trễ hơn 1 frame" theo nghĩa đen. Ghi nhận để đợt sau xem xét
  (có thể liên quan giả thuyết "bề mặt phẳng dự báo ghost" của R4 §4.3 —
  luồng khác đợt 65 đang đo riêng); không dùng làm ngưỡng ở đây.
- Tỉ lệ pixel: ocean-pan12 flat 73,69% / small 17,47%; slov-pan12 flat
  27,49% / small 24,06% / mid 24,06% / large 24,40% — dải small đủ pixel
  ở cả hai (≥17%) nên b_small đo vững.

## 4. Bảng FP/FN — cổng cũ vs quy tắc mới

Ngưỡng ghost-positive: nhảy b_small 0,5→0,7 ≥ 0,05 (dưới min thực đo
0,057 trên footage thật; trên min này một chút để không kẹp sát số đo).

| Clip | Tốc độ | Score | Level | Nhảy | Ghost+ | Cổng cũ | Quy tắc mới |
|---|---|---|---|---|---|---|---|
| ocean-slow | 0,60 px/f | 0,714 | slow | 0,0583 | CÓ | không | CÓ |
| basgo-mid | 2,48 px/f | 1,649 | slow | 0,0710 | CÓ | không | CÓ |
| basgo-fast | 5,98 px/f | 2,909 | slow | 0,0570 | CÓ | không | CÓ |
| slov-fast | 7,86 px/f | 6,471 | fast | 0,0773 | CÓ | CÓ | CÓ |
| ocean-pan12 | 12,72 px/f | 1,549 | slow | 0,0749 | CÓ | không | CÓ |
| slov-pan12 | 13,59 px/f | 9,332 | fast | 0,0831 | CÓ | CÓ | CÓ |
| static-clean (tổng hợp) | 0 px/f | 0,001 | slow | −0,0054 | không | không | CÓ |

- **Cổng cũ (chỉ fast): FN=4, FP=0** — bỏ sót 4/6 clip thật ghost-positive.
- **Quy tắc mới (mọi mức đo được, ≥0,7): FN=0, FP=1** — FP duy nhất là
  clip tĩnh tổng hợp (xem §5).

## 5. Cái giá của quy tắc mới — false positive trên nội dung tĩnh tuyệt đối

Đối chứng static-clean (ảnh tĩnh loop, texture seed 64 như R2):
- Detector 0,001 slow (tái hiện đúng R2). Dải small suy biến: flat
  99,98% / small 0,02% / mid 0% / large 0% — |dC| ≈ 0 khắp frame nên
  b_small (ctrl 0,5258) chỉ là nhiễu trên ~184 pixel/frame, KHÔNG có ý
  nghĩa đo. Nhảy 0,5→0,7 = **−0,0054 ≈ 0** (trail small 2,58 → 2,63,
  gần như không đổi): không chuyển động thì hqdn3d không thêm ghost.
- Quy tắc mới vẫn cảnh báo trên clip này (score 0,0 — mức chậm) — đó là
  **false positive có chủ ý**: cảnh báo là phòng ngừa, câu cảnh báo kèm
  score đo được (0,0) để user tự thấy clip tĩnh và bỏ qua.
- Footage thật không bao giờ tĩnh tuyệt đối: ngay cả ocean-slow
  (camera gần như đứng yên, 0,6 px/f) vẫn có sóng chuyển động và nhảy
  +0,058. FP này chỉ xảy ra trên nội dung tĩnh tuyệt đối (ảnh tĩnh,
  slide, màn hình đứng yên) — chấp nhận được so với việc bỏ sót 4/6
  clip thật.
- Hạn chế đo: b_small trên clip tĩnh là suy biến (không assert sàn/
  vượt-sàn như clip chuyển động; harness đã sửa assert cho đối chứng
  tĩnh sau run 1 — xem §7). Trail small ở ctrl đã 2,58 (cao hơn cả
  trail ctrl của footage thật 1,49–1,77) vì texture tổng hợp nhiều
  chi tiết cao tần — đừng trích trail tuyệt đối của clip này làm sàn.

## 6. Thay đổi code (quy tắc mới)

- `server/render/src/fastMotion.js` + `apps/web/src/components/enhance/fastMotion.ts`:
  `shouldWarnDenoiseGhosting(strength, level)` nay trả true khi strength
  ≥0,7 VÀ level là slow/medium/fast (đã đo được); unknown/undefined →
  false (caller hiện cảnh báo chung riêng). Ngưỡng FAST=6,0/MEDIUM=4,0
  và DENOISE_WARN_STRENGTH=0,7 giữ nguyên, đồng bộ 2 bên (harness R2
  assert đồng bộ vẫn xanh). Comment đầu file ghi rõ lý do đổi + số đo.
- `apps/web/src/components/enhance/EnhancePanel.tsx` (`DenoiseMotionWarning`):
  slow/medium → cảnh báo riêng (testid mới
  `enhance-denoise-slow-motion-warning`, câu `fastMotionWarningSlow`,
  kèm score + level chậm/vừa — KHÔNG gọi clip là "chuyển động nhanh");
  fast → câu cũ; unknown → câu chung cũ; <0,7 → không đo, không cảnh báo.
- Fragment mới `apps/web/src/i18n/fragments/round65-s2.json` (1 key
  `enhance.fastMotionWarningSlow`, vi+en, placeholder {score}/{pct}/{level}
  khớp nhau). Key nằm dưới tiền tố `enhance.fastMotion` đã có trong
  DYNAMIC_PREFIXES của P7/orphans nên không cần sửa test audit.
  Không sửa vi.json/en.json trực tiếp — parent gộp (dict sẽ 2283 → 2284).
- Test cập nhật theo quy tắc mới (không nới ngưỡng, chỉ đổi kỳ vọng cho
  đúng hành vi mới — hành vi cũ được giữ trong harness S2 dưới tên
  `shouldWarnDenoiseGhostingOld` để tính bảng FP/FN):
  `test_round64_r2_fast_motion.js` (mục Logic cảnh báo),
  `fastMotion64R2.test.ts` (ma trận warn + chuỗi warningSlow).

## 7. Kiểm chứng

- Harness mới `test_round65_s2_fast_motion_real.js`: **87/87 pass, exit 0**
  (run 2; log `harness-run2.log`, `summary.json`). Run 1 bị giết giữa
  chừng ở B3 (phiên nền mất — tiền lệ đợt 63); run 2 tái dùng render/
  frame và tái hiện đúng mọi số run 1 (score detector giống hệt 3 chữ
  số; nhảy ghost ocean-pan12 0,0749 / slov-pan12 0,0831 giống hệt).
  Bản sửa harness sau run 1: assert đối chứng tĩnh sai (áp assert clip
  chuyển động lên clip tĩnh tuyệt đối → fail 3 assert dù số đo đúng);
  đã đổi sang assert đúng (dải small <1%, |nhảy| <0,02) + thêm cache
  `ghost-<tag>.json` để chạy lại không tính lại ghost.
- `fastMotion.js --self-test`: **PASS**.
- Web unit `fastMotion64R2.test.ts` (esbuild+node): **14/14 pass**.
- Harness R2 chạy lại (assert quy tắc mới): **36/36 pass, exit 0**
  (35 cũ + 1 assert unknown mới; log `harness-run2.log` của đợt này
  trong scratch run R2: `.scratch-r64r2m-RY9yjK`).
- `tsc` (apps/web): **0 lỗi**; `vite build`: **pass** (36,05s; cảnh báo
  chunk >500kB có từ trước).
- P7 **8/8**, orphans **16/16** (chạy lại với fragment mới trên đĩa).
- Headed Playwright `headed-fast-motion-s2.mjs` (Chromium 1254, app thật
  qua vite dev, log `headed-run2.log`): **29/29 pass, exit 0** (run 1:
  27/29 — 2 fail do regex harness bắt số 80% thay vì score; đã sửa
  regex lấy số sau "độ chuyển động ", chạy lại xanh hết).
  A: pan-fast24 80% → cảnh báo cụ thể hiện sau 2.133ms, score trình
  duyệt 8,0 (≈ server 9,19 ±2,0), chứa "80%". C: hạ 50% → cả hai cảnh
  báo biến mất. B (MỚI): static-clean 80% → cảnh báo CHẬM hiện, score
  0,0 (≈ server 0,001), cảnh báo fast vắng. E (MỚI): ocean-pan12
  (footage thật 12,7 px/f) 80% → cảnh báo CHẬM hiện, score 1,3
  (≈ server 1,549 ±2,0), text chứa "chậm" + "80%", cảnh báo fast vắng.
  D (sampler bundle): pan-fast24 7,955 fast; static-clean 0,001 slow;
  ocean-pan12 1,316 slow (≈ server 1,549 ±2,0); URL hỏng → throw;
  cache trả cùng promise.

## 8. Giới hạn — đọc trước khi trích số

1. **Chỉ 6 clip thật + 1 đối chứng tĩnh, n=1 mỗi (clip, strength).**
   Mọi kết luận "không đổi theo tốc độ" chỉ vững trong 6 điểm đo này
   (0,6–13,6 px/f). Pipeline xác định (số tái hiện y hệt) bù lại việc
   không lặp, nhưng n=1 vẫn là n=1.
2. **Pan 12px/f là dựng từ footage thật, không phải pan camera thật.**
   Chuyển động camera thật >8 px/f vẫn chưa có số (R4 đã ghi). Kết luận
   mở rộng tới 13,6 px/f dựa trên pan dựng; whip-pan thật >14 px/f chưa
   biết (nhảy 0,0831 ở 13,6 px/f hơi cao hơn dải R4 — có thể nhảy tăng
   dần theo tốc độ ở vùng cao, cần đo thêm trước khi kết luận "không đổi
   tới mọi tốc độ").
3. **Detector score phụ thuộc nội dung mạnh.** Cùng 12 px/f, score dao
   động 2,1–9,7 theo nội dung. Level slow/fast trong câu cảnh báo là
   "lượng thay đổi pixel", không phải tốc độ pan — user đọc "mức chậm"
   không nên hiểu là "camera quay chậm".
4. **b_small là hệ số hồi quy, chưa hiệu chuẩn tri giác** (R4 §6.4 giữ
   nguyên): chưa biết b_small bao nhiêu thì mắt người thấy vệt. Ngưỡng
   ghost-positive 0,05 trong bảng FP/FN là ngưỡng làm việc của harness
   (dưới min thực đo 0,057), không phải ngưỡng tri giác.
5. **Chỉ đo hqdn3d qua enhance.js, CRF23/veryfast, 720p.** Denoiser khác /
   preset encode khác sẽ cho sàn khác (R4 §6.5 giữ nguyên).
6. **Chưa test Safari/Firefox** (sampler trình duyệt — R2 §6.7 giữ nguyên).
   Nhánh unknown ở UI vẫn chưa kiểm chứng headed qua UI thật (R2 §6.6
   giữ nguyên — cần probe `?vcut-probe=enhance-motion-unknown`).
7. **Đo theo đoạn nguồn [in, out], không theo speed curve** (R2 §6.8 giữ
   nguyên): clip có speed keyframes thì cảnh báo có thể thừa/thiếu.
8. **Quy tắc mới cảnh báo cả trên clip tĩnh tuyệt đối** (FP=1, §5) — có
   chủ ý, câu cảnh báo kèm score 0,0 để user tự đánh giá.

## 9. Nợ mở thêm (cho đợt sau)

- **Whip-pan thật >14 px/f:** tìm clip CC0/CC-BY có whip-pan thật hoặc
  dựng pan nhanh hơn từ footage thật (18–24 px/f) để xem nhảy ghost có
  tăng tiếp không (0,0831 ở 13,6 px/f gợi ý có thể tăng dần ở vùng cao).
- **Giả thuyết "bề mặt phẳng dự báo ghost tốt hơn tốc độ" (R4 §4.3):**
  luồng khác đợt 65 đang đo riêng (flat-12/24/48) — không trùng việc này.
  Quan sát b_flat > 1 trên mặt nước pan (§3.2) có thể liên quan.
- **Hiệu chuẩn tri giác b_small:** chưa biết bao nhiêu thì thấy được bằng
  mắt (R4 §8 giữ nguyên).
- **Probe `?vcut-probe=enhance-motion-unknown`** cho nhánh unknown ở UI
  (R2 §6.6 giữ nguyên).
- **Nối speed curve vào detector** (R2 §6.8 giữ nguyên).
- **Endpoint bridge `/api/motion`** cho đo server khi sampler trình duyệt
  không đo được (R2 §8 giữ nguyên).
