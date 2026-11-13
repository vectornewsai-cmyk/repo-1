# Phase 9 Đợt 81 — Luồng I4: G1/G2 số học KHÔNG-làm-tròn + săn Q4 (G2 vs G12)

**Ngày:** 10/11/2026 (18:35–~20:30 +07). **Trạng thái:** HOÀN THÀNH, đã stage, KHÔNG push.
**Phạm vi:** chỉ đo lường + script `.mjs` + doc. Không đổi luật gate, không đụng production.

## 0. Tóm tắt kết quả (đọc phần này là đủ)

| Câu hỏi | Trả lời |
|---|---|
| G1 vs G2 phân biệt được không? | **CÓ — đúng 1 case**, chỉ ở số không-làm-tròn: `F7-sweep-w2240-testpattern-n10`, fullD0 maxKurt 0,3508 > 0,35 (biên 0,0008). G1 áp d0 sai → LỆCH; G2 từ chối đúng → KHỚP. |
| G2 vs G12 phân biệt được không? | **KHÔNG — 0 case** trong sweep không-làm-tròn 75 case + 14 case capture Q4 mới. |
| Q4 (d0std_R > 2 ∧ ratio_R ≤ 1) tìm được không? | **KHÔNG — 0 case.** 4 ứng viên qua screen đều trượt ở resid sau decode. |
| Điểm luật không-làm-tròn (75 case, 69 chấm được) | R0 **61/69**, G1 **67/69**, G2 **68/69**, G12 **68/69**. |
| Test | I4 9/9; hồi quy E6 7/7, F7 7/7, G6 8/8, H4 10/10. |

**Đính chính quan trọng nhất đợt này (đảo ngược kết luận H4 §1.2):** "blend làm sụp
residStd_R" là **sai do so sánh lệch chuẩn** — blend a88 có resid 1,22, khớp gần như
chính xác với dự đoán trung bình-không-tương-quan từ **cha still** (1,24). Không có
hiệu ứng sụp nào ngoài mô hình. Xem §4.3.

**Phát hiện lớn thứ hai:** chroma-scale **giữ nguyên resid** (s20 0,74 = still-gốc 0,74;
s12 0,70 ≈ 0,71). Hướng này thất bại không phải vì resid sụp, mà vì **still re-encode
(x264 crf 18) đã giết resid của slovenska từ 2,95 (video thật) xuống 0,74** — trong khi
test-pattern still giữ nguyên 4,46. Xem §4.4.

---

## 1. Bối cảnh và định nghĩa (giữ nguyên từ E6/F7/G6/H4)

- delta0 là **hiệu chỉnh đo lường trong harness, KHÔNG nằm trong production**.
- Luật cổng (kênh R): R0 = áp d0 iff `plainMad ≤ 2,5`; G1 = R0 + `d0std_R ≤ 2,0`;
  G2 = R0 + `ratio_R = d0std_R / residStd_R ≤ 1,0`; G12 = cả ba.
- Ngưỡng verdict: std ratio [0,85; 1,18], |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12.
- Resample: `chrome-resample.mjs` (C2 M4 + BC(0,25; 0,375) upscale, F6).
- Q4 = góc phần tư G1 từ chối ∧ G2 áp dụng: `d0std_R > 2,0 ∧ ratio_R ≤ 1,0`.
  Q4 là điều kiện CẦN (chưa đủ) để phân biệt G2 vs G12: còn cần áp d0 làm ĐỔI verdict.
- Gốc 77 case: 73 từ G6 (Y2/B1/C1/D2/E6/F7/G6) + 4 blend H4 (a65/a85 × 2 mức noise).

## 2. Phần (a) — Harness không-làm-tròn + sweep lại

### 2.1 Thay đổi harness (CHỈ THÊM, không sửa hàm làm tròn cũ)

File `apps/web/scripts/delta0-harness.mjs` — thêm các hàm song song, số không-làm-tròn:

- `channelStatsRaw`, `corrPerChannelRaw`, `fullDeltaStatsRaw` (tham số `kurtThreshold`, mặc định 0,35),
  `absMadRaw`, `applyDelta0G12Raw/G1Raw/G2Raw/R0Raw`, `evalDelta0CaseRaw`
  (cùng shape trả về với `evalDelta0Case`, mọi số không-làm-tròn).
- Probe trên case then chốt tái lập H4 chính xác: noD0 maxKurt 0,3355, fullD0 0,3508;
  G1 → LỆCH (sai), G2 → KHỚP (đúng); cổng raw: plainMad 0,9707, d0stdR 1,1460,
  residStdR 0,9866, ratioR 1,1615.

### 2.2 Sweep không-làm-tròn (75 case)

Script mới `r81i4-unrounded-sweep.mjs` (loader hợp nhất mọi pattern snapshot Y2/B1/C1/D2/E6/F7/G6/H4;
gradient1920 dựng verbatim, byte-identical với D2; flush tăng dần + resume). Chạy 2 instance
song song theo env `R81I4_ONLY`/`R81I4_OUT` (A: Y2|B1|C1|D2|E6|F7 — 53 case; B: G6|H4 — 22 case),
gộp bằng `r81i4-merge-sweep.mjs` → `hidden_files/round81-i4/r81i4-unrounded-sweep.json`.

- **75/77 case** (thiếu 2 case a65 — snapshot bị capture a85 ghi đè ở đợt 80, H4 §8.5;
  số làm tròn của chúng xa mọi ngưỡng nên không thể lật kurt/corr/gate, chỉ kiểm tra stdRatio
  là không đo được với chúng).
- **Điểm luật ở Δkurt 0,35 (69 chấm được; 6 cả-hai-LỆCH không chấm):**
  R0 61/69, G1 67/69, G2 68/69, G12 68/69.
- **Phân biệt verdict (raw):** G1/G2 = **1** (`F7-sweep-w2240-testpattern-n10`); G2/G12 = **0**;
  G1/G12 = **1** (cùng case). Bất đồng cổng G1/G2: 24/75 case.
- **Cross-check đều pass:** plainMadΔ ≤ 0,0005 so với làm tròn, cổng khớp, `h4Match=true` trên
  cả 13 case H4.
- **2 case sát ngưỡng corr vẫn LỆCH ở số không-làm-tròn** (`Y2-w1440-test-pattern-noise10`,
  `Y2-w1920-test-pattern-noise05`; maxCorrDiff 0,1207 / 0,1208 — chỉ hơn ngưỡng 0,12 có
  0,0007/0,0008; mong manh theo ngưỡng, kurt thì qua).
- **stdRatio:** 0 mode LỆCH chỉ do stdRatio (kurt+corr đều qua). Margin nhỏ nhất trong các
  mode KHỚP là 0,0828 (`G6-sweep-w2400-testpattern-n10` noD0, stdRatio R 0,9328) — gấp ~40 lần
  sai số làm tròn (~0,002) nên kết luận "không lật qua stdRatio" là vững.

### 2.3 Kết luận phần (a) — đọc kỹ trước khi dùng con số 1 case này

G1 vs G2 phân biệt được **theo nghĩa hẹp**: tồn tại đúng 1/75 case mà hai luật cho verdict
khác nhau, và khác nhau theo hướng có lợi cho G2 (G2 đúng, G1 sai). Nhưng:

- Biên chỉ **0,0008** trên ngưỡng kurt 0,35 — nhỏ hơn cả sai số lượng tử hoá kurt làm tròn
  2 chữ số (±0,01). Đây là **bằng chứng cho việc dùng harness không-làm-tròn** nhiều hơn là
  bằng chứng cho "G2 tốt hơn G1" trên thực tế: với 1 case duy nhất ở biên 0,0008, không thể
  kết luận G2 vượt trội G1 một cách có ý nghĩa thống kê.
- G2 vs G12 vẫn **hoàn toàn chưa phân biệt được** (0/75 sweep + 0/14 capture mới).
- Không đổi luật gate/production: bằng chứng chưa đủ mạnh.

## 3. Phần (b/c) — Săn Q4: screen, capture, kết quả

### 3.1 Screen (không capture)

- `r81i4-q4-screen2.mjs`: 12 frame — họ **G. chroma-scale slovenska** s ∈ {1,5; 2; 3; 4; 6; 8; 10; 12}
  (hướng MỚI: slovenska resid cao sẵn 2,58–2,95, d0std_R chỉ 0,16–0,21) + họ **H. blend tp×slov**
  α ∈ {0,86; 0,875; 0,88; 0,89} (lưới mịn quanh a85/a09). Họ I/J/K (blend slov×ocean, chroma
  ocean/tp, synth gradient+sinus) **không chạy** — dừng screen sau họ H để dành thời gian
  capture; giá trị thấp theo dữ liệu H4 (I: resid sụp; J: tp bão hoà, ocean resid nhỏ; K: synth
  mịn → resid nhỏ, Q3 chắc chắn).
- `r81i4-q4-screen3.mjs`: nối họ G với s ∈ {14; 16; 20; 24} (sau khi s12 cho thấy d0 sau
  encode thấp hơn screen — cần s cao hơn).
- Chroma gốc (YUV709): tp stdCb/Cr 76,12/76,56, railFrac 0,9746 (97% pixel ở rail RGB — scale
  chroma gần như vô dụng); ocean 9,85/14,45, railFrac 0,1773; **slovenska 1,27/0,69,
  railFrac 0,0022 (gần như ảnh xám — dư địa scale chroma rất lớn)**.

Screen d0std_R (theo rect 311/489/667/809/1129/1449/1769):

| frame | d0std_R (min–max theo rect) | @809×455 (w1920) | Ghi chú |
|---|---|---|---|
| slov-chroma-s6 | 0,87–1,13 | 1,04 | |
| slov-chroma-s8 | 1,11–1,47 | 1,34 | |
| slov-chroma-s10 | 1,39–1,82 | 1,67 | |
| slov-chroma-s12 | 1,59–2,11 | 1,92 | **trong khoảng Q4 ở rect ≥1129** (2,06–2,11) |
| slov-chroma-s14 | 1,91–2,49 | 2,28 | |
| slov-chroma-s16 | 2,11–2,78 | 2,54 | decoded ước ~2,2–2,4 |
| slov-chroma-s20 | 2,62–3,43 | 3,13 | decoded ước ~2,7–3,0 |
| slov-chroma-s24 | 2,95–3,95 | 3,59 | clampFrac 0,0116 (tăng) |
| blend-tp-slov-a86 | 2,32–2,35 | 2,35 | trong khoảng Q4 mọi rect |
| blend-tp-slov-a875 | 2,11–2,13 | 2,13 | trong khoảng Q4 mọi rect |
| blend-tp-slov-a88 | 2,04–2,06 | 2,05 | **thấp nhất mà vẫn > 2** — headroom ratio lớn nhất |
| blend-tp-slov-a89 | 1,84–1,85 | 1,84 | dưới 2 — không Q4 |

### 3.2 Capture (7 phiên headed, D1/D3/H9 đều pass)

Media build bằng `r81i4-media-build.mjs` (chuỗi kiểm chứng test-pattern MAD=0; encode x264
crf 18 MAD 1,32–1,76). Capture bằng `r81i4-headed-capture.mjs` (copy H4, đường dẫn I4),
đánh giá bằng `r81i4-sweep.mjs` (cả hai số học). 14 case, KHÔNG case nào là Q4:

| case (rect) | plainMad | d0std_R | residStd_R | ratio_R | G1 | G2 | verdict noD0 / fullD0 | đúng |
|---|---|---|---|---|---|---|---|---|
| blend-tp-slov-a88 @311×175 | 1,1262 | **2,0846** | 1,2247 | 1,7021 | ✗ | ✗ | KHỚP / KHỚP | KHÔNG-d0 |
| slov-chroma-s12 @1129×635 | 0,7521 | 1,6294 | 0,7027 | 2,3190 | ✓ | ✗ | KHỚP / KHỚP | KHÔNG-d0 |
| slov-chroma-s20 @809×455 | 0,9685 | **2,6365** | 0,7368 | 3,5783 | ✗ | ✗ | KHỚP / KHỚP | KHÔNG-d0 |
| plain-slovenska @311×175 | 0,8484 | 0,1238 | 1,2682 | 0,0976 | ✓ | ✓ | KHỚP / KHỚP | KHÔNG-d0 |
| plain-slovenska @809×455 | 0,6496 | 0,1240 | 0,7404 | 0,1674 | ✓ | ✓ | KHỚP / KHỚP | KHÔNG-d0 |
| plain-slovenska @1129×635 | 0,6062 | 0,1242 | 0,7100 | 0,1749 | ✓ | ✓ | KHỚP / KHỚP | KHÔNG-d0 |
| test-pattern (still) @311×175 | 1,5782 | 0,8995 | 4,4578 | 0,2018 | ✓ | ✓ | n05: LỆCH/LỆCH (cả-hai-LỆCH); n10: LỆCH/KHỚP (CÓ-d0) | — |

(Mỗi dòng = 2 case noise05/noise10; cổng giống nhau cho cả hai. D1/D3/H9 3/3 pass mọi phiên;
test-pattern 5/5 pass — script có thêm check cho nguồn này.)

**Bỏ qua có lý do (không capture):** slov-chroma-s16 (d0 decoded ước ~2,13 vs resid still
0,74 → ratio ~2,9) và blend-tp-slov-a875 (d0 2,11 vs resid blend ~1,2 → ratio ~1,75) —
cả hai đều dự đoán không Q4 từ dữ liệu đã đo, không phải do thiếu thời gian.

## 4. Ba phát hiện làm thay đổi hiểu biết về Q4

### 4.1 Screen d0 (pre-encode) nói quá d0 sau decode với nội dung chroma-scale

| frame @rect | screen (pre-encode) | decoded | hệ số |
|---|---|---|---|
| slov-chroma-s12 @1129×635 | 2,0599 | 1,6294 | 0,79 |
| slov-chroma-s20 @809×455 | 3,1339 | 2,6365 | 0,84 |
| slov-chroma-s12 @311×175 | 1,5866 | 1,6075 | 1,01 |
| blend-tp-slov-a88 @1129×635 | 2,0536 | 2,0984 | 1,02 |
| blend-tp-slov-a88 @311×175 | 2,0388 | 2,0846 | 1,02 |

- Chroma std gần như không đổi sau encode (s12: 10,19/8,17 → 10,07/8,08) — **không phải
  suy giảm biên độ chroma**. d0std_B sụt mạnh nhất (1,93 → 0,71 ở s12@1129).
- Matrix bt601/bt709 **bị loại** làm nguyên nhân: decode lại bằng bt601 cho d0std_R 1,6376
  ≈ bt709 1,6294 (vẫn xa 2,06).
- Giả thuyết làm việc (CHƯA chứng minh đầy đủ): encoder làm mượt cấu trúc chroma **mịn**
  (biến thiên block-to-block mà mô hình shift khuếch đại); downscale mạnh (311×175) trung
  bình hoá khác biệt nên không lộ; blend không bị vì chroma của nó là cấu trúc thật quy mô lớn.
- **Bài học phương pháp:** với nội dung tổng hợp, phải screen trên frame **đã decode**, không
  phải RGB pre-encode. Screen2/3 đã nói quá d0 của chroma-scale 16–21% ở rect lớn.

### 4.2 Chroma-scale GIỮ NGUYÊN resid (đảo ngược nghi ngờ ban đầu)

- s20 @809×455: resid 0,7368 vs still-gốc 0,7404 (sai khác 0,004).
- s12 @1129×635: resid 0,7027 vs still-gốc 0,7100 (sai khác 0,007).
- Chroma-scale không chạm tới resid (resid do luma/cấu trúc quyết định, không phải biên độ
  chroma). Hướng này thất bại **chỉ vì** resid của still ở các rect đó vốn đã thấp (~0,7),
  không phải vì scaling làm sụp resid.

### 4.3 ĐÍNH CHÍNH H4 §1.2: blend KHÔNG làm sụp resid

H4 kết luận blend sụp resid vì so resid của **blend-still** với resid của **cha video-thật**.
So đúng phải dùng **cha still** (cùng chuỗi encode):

- Tại 311×175 (w1280), đo trực tiếp: tp-still residStd_R = **4,4578** (bằng đúng video thật
  4,46 — tái lập Y2); slov-still residStd_R = **1,2682**.
- Dự đoán trung bình-không-tương-quan cho blend a88 (α=0,88 slov):
  √((0,12×4,46)² + (0,88×1,27)²) = √(0,286 + 1,249) = **1,24**.
- Đo thật: blend a88 residStd_R = **1,2247** — khớp dự đoán trong 2%.
- **Kết luận mới:** blend không sụp resid; resid blend đúng bằng mô hình trung bình-không-
  tương-quan của cha still. H4 §1.2 (và các con số a65 1,04 / a85 0,69 "dưới cả hai cha")
  cần đọc lại với lưu ý này: các cha đó chưa bao giờ được đo ở dạng still.

### 4.4 Still re-encode giết resid của slovenska, không giết của test-pattern

| nội dung @rect | resid video thật | resid still (x264 crf 18) | hệ số |
|---|---|---|---|
| slovenska @809×455 | 2,95 (F7) | 0,7404 | **0,25** |
| slovenska @1129×635 | (chưa đo) | 0,7100 | — |
| slovenska @311×175 | (chưa đo; 2,58 @489) | 1,2682 | — |
| test-pattern @311×175 | 4,46 (Y2) | 4,4578 | **1,00** |

- Resid của slovenska do chi tiết **mịn** (texture mềm) — x264 crf 18 làm mượt là mất.
  Resid của test-pattern do sọc **lớn/sắc** — encode giữ nguyên.
- Hai cơ chế ứng viên cho khoảng cách still-vs-thật của slovenska, **CHƯA phân biệt được**:
  (i) làm mượt không gian của x264 (lượng tử hoá DCT giết chi tiết tần số cao);
  (ii) **motion mismatch** làm phồng resid video thật (preview lệch một phần frame so với
  frame tham chiếu khi video chuyển động; still không có chuyển động nên resid chỉ còn
  mismatch resample thuần). D3 kiểm tra cùng-khung giữa các capture, không kiểm tra
  preview-vs-frame-tham-chiếu.
- **Hệ quả cho săn Q4:** mọi nội dung tổng hợp dạng still-loop đều mang resid thấp một cách
  giả tạo ở slovenska-like content. Muốn Q4, nội dung tổng hợp phải giữ được resid như video
  thật (xem §6).

## 5. Ghi chú khác

- **VM:** 4 vCPU EPYC 9D25 (nhãn "2 vCPU" cũ là sai — đã sửa ở đợt 78 F10). Sweep không-làm-tròn
  ~50 phút tường, load spike tới 32,55. Capture headed nhanh bất thường đợt này (30–45 s/phiên)
  vì load VM thấp lúc chạy.
- **Lỗi tooling (đã gặp, đã khôi phục):** `r81i4-sweep.mjs` ghi `r81i4-sweep-<name>.json` không
  kèm window — chạy cùng name ở 3 window ghi đè lẫn nhau, làm mất JSON plain-slovenska w2240/w1920
  (đã chạy lại eval từ snapshot gốc còn trên đĩa, số khớp y hệt lần đầu — tính xác định được
  xác nhận). Đợt sau sửa tên file kèm window.
- **Orphan bash PID** 17268/17291/17379 từ lần launch sweep lỗi đầu (0% CPU, vô hại).
- **Không capture lại a65 @w2880** để khôi phục 2 case sweep thiếu: ưu tiên thời gian cho Q4;
  2 case đó xa mọi ngưỡng ở số làm tròn (xem §2.2).
- Không đụng production, không đổi luật gate, không push, không release/tag.

## 6. Hướng cho đợt sau (chưa làm, chỉ ghi lại)

1. **Nội dung tổng hợp dạng video chuyển động thật** (blend từng frame theo thời gian, hoặc
   chroma-scale trên video gốc đang chạy) thay vì still-loop — để resid sống sót qua encode
   như video thật. Đây là hướng Q4 hứa hẹn nhất sau §4.4.
2. **Phân biệt cơ chế (i)/(ii) ở §4.4:** encode still slovenska ở crf 0 (lossless) rồi đo lại
   resid; hoặc capture slovenska video thật tại w1280 (tách rect khỏi encode).
3. **Screen trên frame đã decode** cho mọi nội dung tổng hợp (sau §4.1).
4. **Sửa `r81i4-sweep.mjs`:** tên file output kèm window.
5. Nếu Q4 góc cổng tìm được mà verdict không phân biệt (cả hai KHỚP), cần d0std_R cao hơn
   nữa (gần resid, ~2,9–3,0 ở rect 809) để d0 đủ sức lật verdict — chỉ khả thi khi resid
   thật được giữ (hướng 1).
6. **G2 vs G12 vẫn mở:** 0 case phân biệt sau 75 sweep + 14 capture mới. Không có bằng chứng
   nào cho thấy G12 khác G2 trên dữ liệu hiện có.

## 7. File thay đổi (stage, KHÔNG push)

**Sửa:**
- `apps/web/scripts/delta0-harness.mjs` — thêm hàm Raw song song (§2.1).

**Thêm:**
- `apps/web/scripts/r81i4-unrounded-sweep.mjs` — sweep không-làm-tròn 75 case.
- `apps/web/scripts/r81i4-merge-sweep.mjs` — gộp shard A/B.
- `apps/web/scripts/r81i4-q4-screen2.mjs` — screen Q4 v2 (họ G, H).
- `apps/web/scripts/r81i4-q4-screen3.mjs` — screen Q4 bổ sung (họ G s14–s24).
- `apps/web/scripts/r81i4-media-build.mjs` — build media blend/chroma + render frame.
- `apps/web/scripts/r81i4-headed-capture.mjs` — capture headed (copy H4, đường dẫn I4).
- `apps/web/scripts/r81i4-sweep.mjs` — đánh giá capture mới (cả hai số học).
- `apps/web/scripts/test_round81_i4_g1g2.mjs` — test sweep không-làm-tròn (9 test).
- `docs/PHASE9_ROUND81_I4_G1G2_UNROUNDED_LIMITS.md` — tài liệu này.

**Không stage:** binary media/render (mp4/.raw/.rgb/.yuv) trong `hidden_files/round81-i4/`
(tái lập được bằng script), snapshot headed JSON (dữ liệu thô, ở lại hidden_files),
`.github/workflows` (không đụng).

## 8. Dữ liệu (hidden_files/round81-i4/, không stage)

- `r81i4-unrounded-sweep.json` — sweep không-làm-tròn gộp (75 case).
- `r81i4-unrounded-sweep-g6h4.json`, `r81i4-unrounded-sweep-A.log`, `-B.log` — shard + log.
- `r81i4-q4-screen2.json` — screen G+H + screen3 (s14–s24).
- `r81i4-sweep-{blend-tp-slov-a88, slov-chroma-s12, slov-chroma-s20, plain-slovenska-w1280,
  plain-slovenska-w1920, plain-slovenska-w2240, test-pattern}.json` — 14 case capture Q4.
- `round81-i4.md` — log đợt này.
- `media/`, `render/`, `headed-*/` — media + frame render + snapshot headed (binary, không stage).
