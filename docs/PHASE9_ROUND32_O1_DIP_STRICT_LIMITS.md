# Phase 9 đợt 32, luồng O1 — Hiệu chuẩn dip dưới bar nghiêm ngặt + sửa harness chọn frame lưới cũ

> Follow-up nợ §3.1–3.2 của `docs/PHASE9_ROUND31_LIMITS.md` (bar
> nghiêm ngặt "không tăng MAD ở bất kỳ ô nào" + điều kiện (a) của
> M6 trên lưới 30fps cũ). KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo, KHÔNG sửa i18n, KHÔNG sửa preview.tsx. KHÔNG tự
> ghi file paths-loop hay build-loop-log (parent lo).

## 0. Quyết định (đọc trước)

**ÁP bộ nút B hiệu chuẩn strict vào code sản phẩm** (chỉ đổi
`FADE_DIP_KNOTS_B` trong `apps/web/src/lib/transitionPreview.ts`,
10 nút; nút A và nút B tại p = 0,25 / 0,75 giữ nguyên). Trên lưới
99 ô của brief (phẳng gốc + phẳng màu mới + xfade đơn màu mới +
footage, exact-p 120fps), bộ mới đạt **0 ô tăng MAD so với
smoothstep cũ (CUR), 0 tier tụt so với CUR, ô đích FW/FG phẳng
gốc 0,75 giữ KHỚP (MAD 1,33)** — tức làm được cả hai vế mà brief
đòi. Tổng MAD 99 ô: **60,47** (N6: 59,86; CUR: 100,27).

**Cái giá phải ghi rõ (không giấu):** so với N6, bộ mới làm
**1 ô tụt tier: FW/FG phẳng gốc 0,6 từ KHỚP (1,33) về XẤP XỈ
(2,33)** — bằng đúng mức CUR, không tệ hơn baseline. Đây là
trade-off đã chứng minh là không tránh được bằng vặn 2 nút liên
quan (xem §3), không phải do tìm kiếm chưa đủ kỹ. Nếu parent coi
"không tier nào tệ hơn N6" cao hơn "không MAD nào tệ hơn CUR"
thì revert 1 hàm `FADE_DIP_KNOTS_B` về giá trị N6 (§6) — nhưng khi
ấy bar nghiêm ngặt sẽ lại vỡ với 12 ô tăng ở §1.

**KHÔNG đổi mô hình, KHÔNG đổi badge `matched`:** vẫn mô hình
đơn clip như quyết định M6. Điều kiện (a) của M6 nay đóng cả
trên lưới exact-p lẫn lưới 30fps đã sửa harness (§4); điều kiện
(b)(c)(d) vẫn mở.

## 1. Bar nghiêm ngặt tái đo: N6 có đúng 12 ô tăng (không phải 3)

Chạy lại toàn bộ lưới dip trên cùng chuỗi tham chiếu FFmpeg
8.1.2 (không lấy JSON cũ làm chứng duy nhất). Tổng MAD 99 ô:
CUR = 100,2741; N6 = 59,8578; tier tụt so với CUR = 0 — nhưng
**12 ô tăng MAD** (tất cả vẫn KHỚP, mức tăng ≤ 0,67):

| Ô | CUR → N6 |
|---|---|
| phẳng gốc FW/FG 0,9 | 0,3333 → 1,0000 (+0,6667) |
| xfade đơn màu mới fadeblack p = 0,8 | 0 → 0,6667 (+0,6667) |
| xfade đơn màu mới fadewhite p = 0,35 | 0,6667 → 1,0000 (+0,3333) |
| xfade đơn màu mới fadewhite p = 0,55 | 0 → 0,3333 (+0,3333) |
| xfade đơn màu mới fadewhite p = 0,95 | 0 → 0,3333 (+0,3333) |
| xfade đơn màu mới fadegrays p = 0,2 | 1,0000 → 1,3333 (+0,3333) |
| xfade đơn màu mới fadegrays p = 0,5 | 0,6667 → 1,0000 (+0,3333) |
| xfade đơn màu mới fadegrays p = 0,6 | 0,3333 → 1,0000 (+0,6667) |
| xfade đơn màu mới fadegrays p = 0,65 | 0,6667 → 1,0000 (+0,3333) |
| footage FW/FW 0,9 | 0,2482 → 0,3972 (+0,1490) |
| footage FB/FW 0,6 | 1,1566 → 1,2505 (+0,0939) |
| footage FB/FW 0,9 | 0,2482 → 0,3972 (+0,1490) |

Ngoài 4 ô đợt 31 đã ghi (phẳng FW/FG 0,9; fadeblack 0,8;
fadegrays 0,6; footage 0,9), còn **8 ô nữa**: 3 ô fadewhite đơn,
3 ô fadegrays đơn còn lại và footage FB/FW 0,6 — đợt 31 không
liệt kê vì luật hồi quy của họ chỉ flag tăng > 0,5 hoặc tụt
tier. Phẳng màu mới: 0 ô tăng. Số này khớp từng chữ số với
JSON đợt 31 (`v31-n6-pair120*.json`,
`v31-n6-shape-xval-clamp.json`).

## 2. Ứng cử strict: vặn trong `fadeDipWeights`, không đổi mô hình

Phương pháp (`measure_r32_o1_dip_strict.js`): coordinate descent
trên nút B tại p = 0,2 / 0,35 / 0,4 / 0,5 / 0,55 / 0,6 / 0,65 /
0,8 / 0,9 / 0,95 (đóng băng toàn bộ nút A và nút B tại p = 0,25 /
0,75 để giữ ô đích), mục tiêu theo thứ tự: ít ô tăng nhất, ít
tier tụt nhất, tổng MAD thấp nhất; sau đó 1 vòng polish chỉ
nhận giá trị giữ 0 ô tăng mà làm tổng giảm (B@0,4: 0,2028 →
0,2016 kéo tổng 63,70 → 60,47). Giá trị ứng cử làm tròn 4 chữ
số trước khi áp; kiểm chứng bằng chính code sản phẩm sau áp
vẫn đúng 0 ô tăng (§5).

Nút B đổi (N6 → O1): 0,2: 0,0288 → 0,0313; 0,35: 0,1427 →
0,1441; 0,4: 0,2004 → 0,2016; 0,5: 0,3435 → 0,3450; 0,55:
0,4191 → 0,4216; 0,6: 0,5059 → 0,5016; 0,65: 0,5884 → 0,5934;
0,8: 0,8007 → 0,7982; 0,9: 0,8989 → 0,9039; 0,95: 0,9476 →
0,9523. Các nút còn lại giữ nguyên N6. Kiểm tra tay: dãy B vẫn
đơn điệu tăng; các neo test giữ nguyên (b(0,12) = 0, a(0,2) =
0, b(0,5) = 0,345 trong dung sai 0,347 ± 0,01 của test).

Kết quả trên lưới 99 ô (kiểm chứng bằng code sản phẩm, §5):
CUR 100,2741 → **mới 60,4732, 0 ô tăng, 0 tier tụt so với
CUR**; ô đích FW/FG phẳng gốc 0,75 = **1,3333 KHỚP** (CUR là
3,00 XẤP XỈ). Trên toàn 162 ô (cộng single gốc red→green,
xem §3): CUR 151,2741 → mới 88,8063 (N6: 90,8578) — tức bộ mới
thậm chí tốt hơn N6 nếu tính tổng toàn cục.

## 3. Cái giá so với N6 + giới hạn của bar strict (trung thực)

**So với N6 trên lưới 99 ô**, bộ mới tệ hơn ở 10 ô (tất cả vẫn
≤ CUR, nên không vi phạm bar): FW/FG phẳng gốc 0,6 (1,33 →
2,33, **tụt tier KHỚP → XẤP XỈ** — ô duy nhất tụt tier so với
N6); FW/FG phẳng mới 0,6 (1,33 → 2,00, vẫn KHỚP); single mới
fadeblack 0,2 / 0,55 / 0,6 / 0,65 / 0,9 / 0,95 và fadewhite 0,6
(từ 0–1,00 lên 0,67–1,33, vẫn KHỚP); footage FW/FW 0,6 (1,29 →
1,51, vẫn KHỚP). Tổng 99 ô tăng nhẹ 59,86 → 60,47 (+1,0%).

**Xung đột không tránh được (đã quét, không phỏng đoán):**
ô cặp FW/FG 0,6 và ô đơn fadegrays 0,6 dùng chung nút B@0,6
(cặp 0,6 còn dùng p2 = 0,1 nên quét thêm A@0,1). Quét 2D
(`measure_r32_o1_scan06.js`, B@0,6 ∈ [0,5000, 0,5080] bước
0,0005 × A@0,1 ∈ 0,4497 ± 0,02): vùng single-tốt là B@0,6 ≤
0,5025, vùng cặp-tốt là B@0,6 ≥ 0,5045 — **hai vùng không giao
nhau ở bất kỳ A@0,1 nào** (ví dụ A@0,1 = 0,4497: B@0,6 = 0,5025
→ 0 ô tăng nhưng cặp 2,33 XẤP XỈ; B@0,6 = 0,5045 → cặp 1,33
KHỚP nhưng 1 ô tăng). Vì ô đơn chỉ phụ thuộc B@0,6 (aA(0,6) =
0) nên không có cách vặn nào trong `fadeDipWeights` thỏa cả
hai — muốn giữ cả hai phải đổi mô hình hoặc chấp nhận 1 ô
tăng. Luồng này chọn bar strict theo đúng mandate của brief.

**Bar strict KHÔNG đạt trên dữ liệu fit gốc:** single gốc
red→green (63 ô, báo riêng, không nằm trong 99 ô của brief):
N6 tổng 31,00 với 11 ô tăng; bộ mới tổng **28,33** (tốt hơn
N6) nhưng vẫn còn **7 ô tăng vs CUR** (fadeblack 0,65;
fadewhite 0,45; fadegrays 0,2 / 0,3 / 0,65 / 0,7 / 0,85 — mỗi ô
+0,3333, tất cả vẫn KHỚP, 0 tier tụt). Do đó **chỉ được claim
bar strict trên lưới 99 ô của brief**, không claim toàn cục.
Nút gây 1 ô tăng mới trên single gốc là B@0,2 (fadegrays 0,2:
0,67 → 1,00); 5 ô tăng cũ của N6 đã được sửa (fadeblack 0,8;
fadewhite 0,35 / 0,55 / 0,95; fadegrays 0,8).

## 4. Sửa harness lưới 30fps cũ: đánh giá model ở p thật

Bản chất (đã phân tích đợt 31, nay sửa thành code harness):
ở 30fps **không tồn tại frame tại đúng thời gian 3 + localT**
khi localT không phải bội số 1/30 — frame n = 113 ứng với
t = 3,7667s, p thật 0,7667/0,2667, lệch Δp = +0,0167 so với
0,75/0,25. Vì vậy "chọn frame theo p exact" trên lưới 30fps
chỉ có thể nghĩa là: **đánh giá model ở p thật của frame đã
chọn, và báo rõ p thật kèm mỗi ô** (lưới exact-p 120fps của
đợt 31 là cách còn lại, đã có). `measure_r32_o1_frame30.js`
làm đúng việc này bằng chính code sản phẩm, không vặn trọng
số. Các ô 0,6 / 0,9 không đổi vì chúng là bội số 1/30
(p thật = p danh nghĩa).

Kết quả lưới 30fps (21 ô: phẳng gốc 15 + footage 6), chạy với
nút N6 trước khi áp bộ mới:

| Ô 0,75 | Danh nghĩa (harness cũ) | p thật 0,7667/0,2667 (harness sửa) |
|---|---|---|
| phẳng FW/FG | 3,3333 XẤP XỈ | **1,3333 KHỚP** |
| footage FW/FW | 2,0579 XẤP XỈ | **0,4614 KHỚP** |
| footage FB/FW | 2,0579 XẤP XỈ | **0,4614 KHỚP** |
| phẳng 4 combo còn lại | 2,0000 KHỚP | 0,6667 KHỚP |

Cả 21 ô đều KHỚP dưới p thật; 3 ô XẤP XỈ duy nhất dưới danh
nghĩa đều là ô 0,75 — đúng như chẩn đoán lỗi chọn frame.
**Điều kiện (a) của M6 nay đóng cả trên lưới 30fps đã sửa**,
không cần vặn thêm trọng số. Chạy lại sau khi áp nút mới
(`v32-o1-frame30-after.json`): FW/FG 0,75 true-p vẫn **1,3333
KHỚP**; footage 0,75 true-p vẫn 0,4614 KHỚP; nhưng FW/FG 0,6
thành 2,3333 XẤP XỈ ở cả 2 cột (vì 0,6 là bội 1/30 nên danh
nghĩa = p thật) — cùng trade-off §3, không phải lỗi harness.

## 5. Kiểm chứng và 1 bug tự phát hiện trong harness mới

- `node apps/web/src/lib/transitionPreview.test.ts`: **31 pass,
  0 fail** (sau khi áp nút mới).
- `tsc --noEmit` (apps/web): **0 lỗi** (chạy lúc không có luồng
  khác sửa dở; nếu parent chạy gộp gặp lỗi do luồng khác thì
  đó không phải hồi quy của luồng này — luồng này chỉ đổi 1
  bảng nút + ghi chú trong 1 file).
- `node --check` cả 3 script mới: pass.
- Kiểm chứng bằng chính code sản phẩm sau áp
  (`measure_r32_o1_dip_strict.js --product`): CUR 100,2741 →
  product 60,4732, **0 ô tăng, 0 tier tụt**, ô đích 1,3333 KHỚP
  — khớp từng chữ số với ứng cử tham số (làm tròn 4 chữ số
  không làm mất kết quả).
- **Bug tự phát hiện (đã sửa, ghi rõ để khỏi tái phạm):** lần
  chạy `--product` đầu tiên cho "0 ô tăng" rỗng vì hàm
  `evaluate()` cũ dùng code sản phẩm cho cả cột baseline CUR
  (CUR tự so với chính nó). Đã sửa thành `evaluateProduct()`
  riêng cho cột product, baseline CUR luôn tính bằng mô hình
  tham số smoothstep; số ở §2/§5 là số sau khi sửa. File JSON
  product cũ đã bị ghi đè bằng lần chạy đúng.
- Lưới strict chạy lại 2 lần cho cùng kết quả N6 (12 ô tăng,
  tổng 59,8578) trước khi áp; frame30 chạy 2 lần (trước/sau áp).

## 6. Chưa làm / nợ còn lại (không mạo nhận)

- Điều kiện (b) harness before/after, (c) ngân sách perf ~1,5×,
  (d) phạm vi họ fade của M6 vẫn mở — mô hình đơn clip giữ
  nguyên, không ai được trích luồng này như "đã cho phép đổi
  model".
- Bar strict chưa đạt trên single gốc (7 ô, §3) và chưa đo
  trên cặp màu thứ ba / footage khác — rủi ro overfit còn lại
  là nhỏ nhưng không bằng 0.
- Nếu parent muốn giữ tier của N6 (FW/FG 0,6 KHỚP) thay vì bar
  strict, revert 1 hàm duy nhất: trả `FADE_DIP_KNOTS_B` về
  [0,2: 0,0288; 0,35: 0,1427; 0,4: 0,2004; 0,5: 0,3435; 0,55:
  0,4191; 0,6: 0,5059; 0,65: 0,5884; 0,8: 0,8007; 0,9: 0,8989;
  0,95: 0,9476] (các nút còn lại đã giống N6) — khi ấy 12 ô
  tăng §1 quay lại.
- Blur ở p/mode/weights khác, Safari / máy thật / dpr > 1 /
  viewport khác cho dip vẫn chưa đo (nợ đứng từ trước).

## 7. Lệnh chạy và file đổi/thêm

Lệnh (từ gốc repo; FFmpeg 8.1.2, Node 24):

- `node server/render/src/measure_r32_o1_dip_strict.js --json
  benchmarks/results/v32-o1-dip-strict.json` (lưới 99 + 63 ô
  single gốc, descent + polish; ~7 phút, chủ yếu là FFmpeg).
- `node server/render/src/measure_r32_o1_dip_strict.js
  --product --json
  benchmarks/results/v32-o1-dip-strict-product.json` (kiểm
  chứng bằng code sản phẩm sau áp).
- `node server/render/src/measure_r32_o1_frame30.js --json
  benchmarks/results/v32-o1-frame30.json` (trước áp) và
  `--json benchmarks/results/v32-o1-frame30-after.json` (sau
  áp).
- `node server/render/src/measure_r32_o1_scan06.js` (quét 2D
  §3; log đầy đủ ở /tmp, không lưu JSON vì chỉ là bằng chứng
  quét, số quyết định nằm ở §3).
- `node apps/web/src/lib/transitionPreview.test.ts` (31/31);
  `tsc --noEmit` trong apps/web (0 lỗi).

File đổi/thêm (text, không binary — parent gộp batch; KHÔNG
stage, KHÔNG push trong luồng này):

- Sửa: `apps/web/src/lib/transitionPreview.ts` —
  `FADE_DIP_KNOTS_B` (10 nút, §2) + ghi chú hiệu chuẩn đợt 32
  O1; không đổi logic nào khác, không đụng preview.tsx hay
  i18n.
- Mới: `server/render/src/measure_r32_o1_dip_strict.js` — lưới
  strict 99 + 63 ô, descent + polish, chế độ `--product`.
- Mới: `server/render/src/measure_r32_o1_frame30.js` — harness
  30fps đánh giá model ở p thật + báo p thật từng ô.
- Mới: `server/render/src/measure_r32_o1_scan06.js` — quét 2D
  B@0,6 × A@0,1 chứng minh xung đột §3.
- Mới: `docs/PHASE9_ROUND32_O1_DIP_STRICT_LIMITS.md` — file này.
- Mới: `benchmarks/results/v32-o1-dip-strict.json` — lưới
  strict (CUR/N6/ứng cử + single gốc riêng).
- Mới: `benchmarks/results/v32-o1-dip-strict-product.json` —
  kiểm chứng bằng code sản phẩm sau áp.
- Mới: `benchmarks/results/v32-o1-frame30.json` và
  `v32-o1-frame30-after.json` — lưới 30fps trước/sau áp.
