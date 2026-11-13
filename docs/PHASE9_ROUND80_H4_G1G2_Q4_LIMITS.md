# Phase 9 — Đợt 80, luồng H4: G1/G2 săn case phân biệt Q4 (LIMITS)

Ngày: 10/11/2026 (lượt cron 15:35 +07). Repo: `vectornewsai-cmyk/repo-1`, branch main.
Luồng H4 trong đợt 80 vòng lặp VCut. **Không push** (chỉ stage), không release/tag,
không code giả, không cloud/collab, không AI avatar/video-gen model đóng, không nhạc
có bản quyền. Không đụng code production, không sửa `delta0-harness.mjs`, không sửa
script lịch sử — chỉ thêm script mới tiền tố `r80h4-` và 1 test mới.

## 0. Kết luận tóm tắt — đọc trước

1. **G1 vs G2: CÓ 1 case phân biệt verdict, nhưng CHỈ ở số học không-làm-tròn,
   biên 0,0008.** Case `F7-sweep-w2240-testpattern-n10` [fullD0]: maxKurt chưa làm
   tròn = 0,3508 > 0,35 → LỆCH; G1 áp d0 (d0std_R 1,15 ≤ 2) → sai; G2 từ chối
   (ratio_R 1,16 > 1) → KHỚP, đúng. Harness hiện tại làm tròn kurt 2 chữ số nên
   báo KHỚP cả hai — trong số học của harness, G1 = G2 vẫn chưa phân biệt được.
2. **G2 vs G12: VẪN CHƯA phân biệt được.** Không tìm được case Q4 nào sau 23 frame
   sàng tính toán + 4 case capture thật (blend a65 n05/n10, a85 n05/n10).
3. **Săn Q4 thất bại ở phía resid, không phải phía d0.** Cả 2 blend ứng viên đều
   đạt d0std_R > 2 (a65: 2,01; a85: 2,43–2,45) nhưng residStd_R đo được sụp đổ
   khi blend: a65 = 1,04 (cha slovenska 2,58–2,95 / ocean 1,67–1,82), a85 = 0,69
   (cha slovenska 2,58–2,95 / test-pattern ~1,0) — thấp hơn CẢ HAI cha. ratio_R:
   a65 = 1,93, a85 = 3,55 → G2 từ chối như G1. Nội suy tuyến tính resid từ cha
   (a65 ước ~2,1) đã sai gấp đôi — không dùng nội suy resid nữa.
4. **Khoảng trống d0std_R (1,17; 3,27] đã được lấp bằng nội dung tổng hợp**
   (13/23 frame sàng có d0std_R trong khoảng), nhưng lấp được d0 không đồng
   nghĩa lấp được Q4: Q4 cần CẢ d0std_R > 2 VÀ residStd_R ≥ d0std_R, và hai
   tính chất này chống-correlate trên mọi họ nội dung đã thử.
5. **Kênh G test-pattern ~4,4 là artefact của clamp, không phải tín hiệu độc
   lập.** Shift Cr (kCr=1,12) → d0_G 4,43; output clamp [0,255] dập d0_R/d0_B
   ở sọc bão hoà (R/B chạm ray ~96%) nhưng G không chạm ray (0%) nên d0_G
   sống sót nguyên vẹn. Cổng chỉ dùng kênh R không mù tín hiệu độc lập nào.
6. **Phần dư slovenska post-fix: nguồn là chênh resample preview-canvas vs
   ffmpeg C2 ở vùng chi tiết/cạnh + 1 điểm sáng cục bộ, KHÔNG phải rò plain
   (C1 không chạm được), không phải nhầm nguồn decode, không phải block VP9.**
7. **Độ nhạy ngưỡng Δkurt 0,35: harness làm tròn kurt 2 chữ số gây sai số
   lượng tử hoá tới ±0,01 — đúng bằng bước ngưỡng đang xét — và đã làm đẹp
   điểm lịch sử (R0 +1, G1 +1 so với số không-làm-tròn).** Khuyến nghị (chưa
   làm, cần quyết): bỏ làm tròn kurt trong `channelStats`.

## 1. Săn Q4 — đã quét những gì, kết quả ra sao

### 1.1 Sàng tính toán (không capture): 23 frame, 7 rect mỗi frame

Hàm `estShiftFrame_70x6` trên frame render plain 1280×720 + resample BC
(`chrome-resample.mjs`) — cùng harness G6. Rect: 311×175, 489×275, 667×375,
809×455, 1129×635, 1449×815, 1769×995.

| Họ | Frame | d0std_R theo rect (311→1769) | Trong khoảng (1,17; 3,27]? |
|---|---|---|---|
| A. test-pattern × ocean | a0125, a025 | 10,61 / 11,0 | KHÔNG — vượt trên |
| B. slovenska × ocean | a025 / a0375 / a05 / a0625 / a075 | 0,86–0,91 / 1,21–1,27 / 1,59–1,65 / 1,96–2,05 / 2,33–2,44 | 4/5 (trừ a025) |
| C. basgo × ocean | a025 / a05 / a075 | 0,85–0,92 / 1,49–1,57 / 2,22–2,34 | 2/3 (trừ a025) |
| D. ocean chroma-scale | s02 / s03 / s04 / s05 / s06 / s07 / s08 | ~0,66 / ~0,95 / 1,27–1,33 / 1,57–1,65 / 1,86–1,96 / 2,17–2,28 / 2,46–2,57 | 5/7 (s04–s08) |
| E. test-pattern × slovenska | a025 / a05 / a075 / a085 / a09 / a095 | 9,78–10,01 / 7,7–7,83 / 4,12–4,16 / 2,47–2,50 / 1,64–1,66 / 0,86–0,87 | 2/6 (a085, a09) |

Tổng: **13/23 frame có d0std_R trong khoảng trống.** Họ B nội suy mượt, đơn điệu
theo α. Họ A và E (có test-pattern) VƯỢT khoảng do unmask clamp (§2).

### 1.2 Capture thật: 4 case, cả 4 KHÔNG phải Q4

| Case | d0std_R đã decode | residStd_R | ratio_R | Cổng G1 / G2 | Verdict cả 4 luật |
|---|---|---|---|---|---|
| blend-slov-ocean-a65 n05 | 2,01 | 1,04 | 1,93 | từ chối / từ chối | KHỚP, đúng (KHÔNG-d0) |
| blend-slov-ocean-a65 n10 | 2,01 | 1,04 | 1,93 | từ chối / từ chối | KHỚP, đúng (KHÔNG-d0) |
| blend-tp-slov-a85 n05 | 2,45 | 0,69 | 3,55 | từ chối / từ chối | KHỚP, đúng (KHÔNG-d0) |
| blend-tp-slov-a85 n10 | 2,45 | 0,69 | 3,55 | từ chối / từ chối | KHỚP, đúng (KHÔNG-d0) |

Capture: headed w2880×1620, rect 1769×995, D1/D3/H9 3/3 pass cả 2 blend
(plain 2 lần pixel-identical, cùng-khung hash, 0 lỗi trang). Encode check
(decode frame 30 vs blend RGB gốc): MAD 1,325–1,446, max 12–22 (x264 crf 18).
d0std_R sau encode giảm ~0,02–0,09 so với lý tưởng (a65: 2,04 → 2,01;
a85: 2,47–2,50 → 2,43–2,45) — vẫn trên 2,0.

**Vì sao a65/a85 được chọn:** a65 (slov×ocean, α=0,65) là ứng viên Q4 tốt nhất
từ nội suy (d0 2,04; resid ước ~2,1; ratio ước ~0,96); a85 (tp×slov, α=0,85,
85% slovenska) là ứng viên thứ hai (d0 2,47–2,50; resid ước ~2,5 nếu giữ được
tính chất slovenska). Cả hai đều sụp đổ ở phía resid khi đo thật.

**Cơ chế sụp đổ resid (đã đo, chưa giải thích trọn vẹn):** residStd_R của blend
thấp hơn CẢ HAI cha trong cả 2 họ (a65: 1,04 < 1,67; a85: 0,69 < 1,0). Blend
làm giảm năng lượng chi tiết tần số cao (trung bình hai ảnh không tương quan
làm mờ cạnh) — và resid (chênh preview-canvas vs ffmpeg C2) dường như tỉ lệ
với độ sắc cạnh theo cách phi tuyến, nên sụp nhanh hơn nội suy tuyến tính.
Đây là phát hiện thực nghiệm, không phải mô hình đã chứng minh — cơ chế chính
xác còn mở.

**Hệ quả cho Q4:** muốn d0std_R > 2 phải blend thêm đối tác giàu-d0
(ocean/tp), nhưng blend lại phá residStd_R cần cho ratio ≤ 1. Hai tính chất
chống-correlate trên mọi họ đã thử (blend B/C/D/E + nội dung gốc). Q4 có thể
vẫn tồn tại ở một họ chưa thử (vd. nội dung thật đơn lẻ có cả hai tính chất),
nhưng với kho nội dung + họ blend hiện có, **Q4 chưa phân biệt được G2 vs G12**.

### 1.3 Những họ KHÔNG sàng hết (giới hạn)

- Họ E (synth gradient + sinus chroma, amp 10–80) và họ F (test-pattern
  chroma-scale s=0,5/0,7/0,9): sàng v3 bị kill giữa chừng để ưu tiên CPU cho
  capture a65 (quyết định chủ động, không phải lỗi). E/F là thăm dò, không phải
  ứng viên Q4 hứa hẹn (synth mượt → resid nhỏ → Q3; tp chroma-scale → resid
  tp ở rect lớn ~1,0 → Q3). Dữ liệu đã flush trong `r80h4-q4-screen.json`
  (17 frame: A 2, B 5, C 3, D 7) + 6 frame tp×slov.
- Không capture thêm blend nào sau a85: a09 (d0 1,64–1,66 < 2, không phải Q4),
  a095 (0,86–0,87), họ D (resid chroma-scale ocean nhỏ → Q3), họ C (resid
  basgo ~0,7 → Q3).

## 2. Cơ chế unmask clamp (test-pattern × ocean vượt khoảng)

Blend RGB tp×ocean KHÔNG nội suy d0std_R: a0125 → 10,61; a025 → 11,0 (vượt cả
ocean gốc 3,98). Nguyên nhân đã chứng minh bằng script debug:

- `estimateNativeChroma` clamp [16,240] triệt tiêu thành phần tần số thấp của
  ΔCr ở sọc bão hoà của test-pattern (31,8% block bị clamp; ΔCr std pixel-scale
  8,21 nhưng sau resample chỉ còn 0,64).
- Blend với ocean kéo chroma trung bình khối về trong khoảng clamp → unmask
  toàn bộ shift (k−1)·(avg−128) → d0std_R vọt ~10,6.
- Cùng hiệu ứng ở họ E: tp×slov a025 → 9,78–10,01; a05 → 7,7–7,83;
  a075 → 4,12–4,16 (vẫn trên khoảng); chỉ a085 (2,47–2,50) và a09 (1,64–1,66)
  rơi vào khoảng khi tp đã loãng đủ.

## 3. Kênh G test-pattern ~4,4 — cơ chế đã chứng minh

- d0std đầy đủ (rect 1129×635): [R 1,15; **G 4,43**; B 0,67]. ΔCb std 3,07,
  ΔCr std 8,21 (pixel-scale). Chỉ-Cb-shift → [0,63; 0,82; 0,67];
  chỉ-Cr-shift → [1,15; 4,45; 0,44]. **G bất thường do Cr-shift (kCr=1,12),
  không phải Cb.**
- Dự đoán tuyến tính từ std ΔCb/ΔCr: R 14,72 (thực 1,15), G 4,42 (thực 4,43 ✓),
  B 6,48 (thực 0,67) — resample triệt tiêu thành phần pixel-scale ở R/B
  nhưng không ở G.
- Frame shifted chạm ray 0/255: **R 96,6%, G 0,0%, B 95,9%** (plain gốc đã
  96,5%/0%/95,7%). d0std full-res có clamp [1,27; 4,45; 0,77] vs không clamp
  (Int16) [14,68; 4,45; 6,44] — **G giữ nguyên 4,45 cả hai cách; R vọt
  1,27→14,68.**
- Cơ chế: output clamp [0,255] trong `estShiftFrame_70x6` dập d0_R/d0_B ở sọc
  bão hoà (R/B đã ở ray) nhưng G không bao giờ chạm ray nên d0_G sống sót
  nguyên vẹn. **G ~4,4 là artefact của clamp, không phải tín hiệu độc lập** —
  cổng chỉ dùng kênh R không mù tín hiệu độc lập nào (cùng một Cr-shift, R bị
  clamp che). Ocean rail R 22,2% (G 0,1%); basgo/slovenska rail ~0%.

## 4. Phần dư slovenska post-fix — còn lệch bao nhiêu, nguồn nào

- Snapshot F7: w1440 (489×275) perChan MAD [1,62; 1,60; 1,73], std
  [2,578; 2,566; 2,707]; w1920 (809×455) MAD [1,79; 1,76; 1,91], std
  [2,947; 2,937; 3,069] — dư gần như không màu (3 kênh tương đương).
- **Đối chứng nguồn decode** (frame 25 → 1280×720, chuỗi Z2): webm (VP9) vs
  render-1k MAD 1,042 max 6; mp4 (H.264) vs render-1k MAD 8,152 max 76;
  webm vs mp4 MAD 7,475. → Render frame = decode VP9, KHÔNG phải nhầm nguồn
  file; MAD 1,04 còn lại là chênh resampler.
- |resid_R| theo decile luma: đỉnh ở Y≈36 (2,17/2,40) và Y≈72 (2,14/2,36),
  thấp nhất ở Y≈61 (1,26/1,32) — KHÔNG phải nội dung tối.
  corr(|resid_R|, |∇Y|) = 0,39 (w1440) / 0,43 (w1920).
  Block 8×8 biên/trong ratio 0,993 / 1,013 — KHÔNG có dấu vết block VP9.
  Lưới 16×9: hàng 0–5 (2/3 trên khung) cao 1,5–3,5, hotspot (hàng 4, cột 11)
  5,9/6,8; hàng 6–8 (1/3 dưới) thấp đều ~0,8–1,7.
- **Kết luận: dư do chênh resample preview-canvas vs ffmpeg C2 ở vùng chi
  tiết/cạnh + một điểm sáng cục bộ; C1 không chạm được vì dư không phải do rò
  plain.** (C1 là fix rò plain corr 0,993 đã đóng ở đợt 75.)

## 5. Độ nhạy ngưỡng Δkurt 0,35

- **Phát hiện then chốt:** `channelStats` trong `delta0-harness.mjs` làm tròn
  kurt về 2 chữ số thập phân rồi mới tính kurtDiff → kurtDiff mang sai số
  lượng tử hoá tới ±0,01, đúng bằng bước ngưỡng đang xét.
- **Case phân biệt G1/G2 (số không-làm-tròn):** `F7-sweep-w2240-testpattern-n10`
  [fullD0] maxKurt = 0,3508 > 0,35 → LỆCH ở 0,35 trong khi harness làm tròn
  báo KHỚP. G1 áp d0 → LỆCH (sai); G2 từ chối → KHỚP (đúng); ground truth
  KHÔNG-d0. **Biên chỉ 0,0008 — cực mỏng, harness làm tròn hiện tại không thấy
  được.** (Case này là case phân biệt G1/G2 duy nhất, ở mức verdict, trong
  toàn bộ 77 case.)
- `G6-sweep-w2048-testpattern-n10` [fullD0] maxKurt = 0,3603 > 0,36 → KHÔNG
  lật ở 0,36 (trượt 0,0003); [noD0] 0,3452 → LỆCH ở 0,34 (cả hai LỆCH, không
  chấm được ở 0,34).
- `D2-post-fix-w1920-ocean-n05` [fullD0] 0,3625 và
  `F7-post-fix-w1760-ocean-n05` [fullD0] 0,3631 → KHÔNG lật ở 0,36 (bản làm
  tròn tưởng lật).
- `F7-sweep-w1760-testpattern-n10` [noD0] 0,3566 → CÓ lật ở 0,36 (thành
  KHỚP); fullD0 0,3706 vẫn LỆCH → ở 0,36 case thành chấm được (KHÔNG-d0) và
  cả 4 luật đều sai (đều áp d0).
- Ở 0,34 (không-làm-tròn) có 7 mode KHỚP→LỆCH (xem JSON).
- **Điểm luật không-làm-tròn ở 0,35 (khác điểm harness làm tròn): R0 59/67,
  G1 65/67, G2 66/67, G12 66/67** (harness làm tròn báo R0 60/67, G1 66/67 —
  làm tròn làm đẹp R0 và G1 mỗi bên 1 case, do đúng 1 verdict sai: F7 w2240
  tp n10 fullD0). Điểm ở 0,34: R0 58/66, G1 64/66, G2 65/66, G12 65/66.
  Điểm ở 0,36: R0 60/68, G1 66/68, G2 66/68, G12 66/68.
- **Khuyến nghị (CHƯA làm, cần parent quyết):** bỏ làm tròn kurt 2 chữ số
  trong `channelStats` (tính verdict từ số chưa làm tròn) — thay đổi này sẽ
  đổi điểm lịch sử nên không tự ý sửa harness trong luồng này.

## 6. Điểm gộp (77 case: 73 cũ + 4 mới H4)

| Luật | Harness làm tròn (73 cũ → 77) | Không-làm-tròn (73 cũ → 77) |
|---|---|---|
| R0 (không cổng) | 60/67 → **64/71** | 59/67 → **63/71** |
| G1 (chỉ cổng 2) | 66/67 → **70/71** | 65/67 → **69/71** |
| G2 (chỉ cổng 3) | 66/67 → **70/71** | 66/67 → **70/71** |
| G12 (cả hai cổng) | 66/67 → **70/71** | 66/67 → **70/71** |

- Case sai duy nhất của cả 4 luật (không đổi): `G6-sweep-w2048-testpattern-n10`
  (cả hai cổng cùng áp d0 sai).
- Phân biệt verdict: G1 vs G2 = **1** (chỉ số không-làm-tròn, biên 0,0008);
  G2 vs G12 = **0**; G1 vs G12 = **0** (G12 = G2 trên toàn bộ 77 case).

## 7. Kiểm chứng

- Test mới `apps/web/scripts/test_round80_h4_g1g2.mjs`: **10/10 pass**
  (8 yêu cầu + 2 bổ sung cho a65/a85 và điểm gộp 77 case).
- Hồi quy: E6 (`test_round77_e6_g12.mjs`) 7/7, F7 (`test_round78_f7_g1g2.mjs`)
  7/7, G6 (`test_round79_g6_g1g2.mjs`) 8/8 — chạy chung 32/32 pass.
- `npx tsc --noEmit` và `npx vite build`: **không chạy** — luồng này không đụng
  file TS/TSX hay code web (chỉ thêm script `.mjs` đo lường + 1 test `.mjs` +
  docs; `node --check` pass cho mọi script mới).
- Chuỗi build frame Z2 đã kiểm chứng lại bằng test-pattern: decode
  test-pattern.mp4 frame 30 → MAD=0 max=0 so với `fullrgb-plain.raw`
  (byte-identical); noise05 build lại (alls=28): std/kurt khớp gốc.

## 8. Giới hạn trung thực (những gì KHÔNG làm được / còn mở)

1. **G2 vs G12 vẫn chưa phân biệt được.** Q4 chưa tìm thấy; kết luận này dựa
   trên 23 frame sàng + 4 case capture. Không loại trừ Q4 tồn tại ở họ nội
   dung chưa thử, nhưng mọi họ đã thử đều chống-correlate d0 và resid.
2. **Case phân biệt G1/G2 duy nhất có biên 0,0008** — mỏng hơn sai số đo của
   chính harness (làm tròn ±0,01). Không nên coi là bằng chứng vững cho G2 >
   G1; nó là bằng chứng cho việc harness cần bỏ làm tròn kurt hơn là bằng
   chứng luật G2 tốt hơn.
3. **Cơ chế sụp đổ resid khi blend chưa được giải thích trọn vẹn** — chỉ là
   phát hiện thực nghiệm trên 2 họ blend (a65, a85). Cần mô hình nếu muốn
   thiết kế nội dung Q4 có chủ đích.
4. **Sàng v3 bị kill giữa chừng** (họ E/F chưa xong) để ưu tiên CPU cho capture.
   Dữ liệu đã flush đủ cho B/C/D + tp×slov; E/F không ảnh hưởng kết luận Q4.
5. **Snapshot a65 bị ghi đè bởi capture a85** (cùng thư mục scratch
   `headed-w2880x1620`, script capture không phân biệt theo tên blend). Số đo
   eval a65 còn nguyên trong `r80h4-sweep-blend-slov-ocean-a65.json`, nhưng
   snapshot thô a65 không còn để chạy lại. Bài học: capture script cần scratch
   riêng theo tên nguồn (chưa sửa — ngoài phạm vi luồng này).
6. **Tên blend a085/a85:** sàng ghi nhãn `a085`, build ghi `a85` (cùng α=0,85).
   Trong doc này dùng `a85` (tên file thật).
7. **VM đông** (nhiều luồng đợt 80 chạy song song): sàng v1/v2 từng bị kill,
   script tính toán chậm (mỗi frame sàng 30–105 s). Số đo không bị ảnh hưởng
   (tính toán xác định), chỉ chậm.
8. Không kiểm lại TTS 39 / pip-audit / Gradio (cấm theo nhiệm vụ).

## 9. File đã thêm / đổi (stage trong paths file)

Script (repo, `apps/web/scripts/`): `r80h4-q4-screen.mjs`, `r80h4-q4-screen2.mjs`,
`r80h4-gchan.mjs`, `r80h4-gchan-rail.mjs`, `r80h4-slovenska.mjs`,
`r80h4-threshold.mjs`, `r80h4-threshold-verify.mjs`, `r80h4-threshold-unrounded.mjs`,
`r80h4-blend-build.mjs`, `r80h4-headed-capture.mjs`, `r80h4-sweep.mjs`,
`test_round80_h4_g1g2.mjs`. Docs: `docs/PHASE9_ROUND80_H4_G1G2_Q4_LIMITS.md`
(file này). KHÔNG stage: JSON/log/snapshot/frame `.raw`/video `.mp4` trong
`hidden_files/round80-h4/` (nội bộ, binary hoặc log), file `/tmp/*`.

## 10. Dữ liệu thô (để kiểm lại)

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h4/`:
  `r80h4-{threshold,threshold-verify,threshold-unrounded,threshold-unrounded-034,threshold-unrounded-034b,threshold-unrounded-034c,gchan,gchan-rail,slovenska,q4-screen}.json`,
  `r80h4-sweep-blend-slov-ocean-a65.json`, `r80h4-sweep-blend-tp-slov-a85.json`,
  `r80h4-q4-screen.log`, `capture-w2880-a65.log`, `capture-w2880-a85.log`,
  `headed-w2880x1620/` (snapshot a85 — a65 đã bị ghi đè, xem §8.5),
  `media/blend-{slov-ocean-a625,slov-ocean-a75,slov-ocean-a65,tp-slov-a85}.mp4`,
  `render/blend-*.raw` (frame render đã decode).
- JSON nguồn G6/F7/E6: `hidden_files/round79-g6/r79g6-{combined,e6-recheck,e6-newcases-recheck,f7-recheck,sweep}.json`.
