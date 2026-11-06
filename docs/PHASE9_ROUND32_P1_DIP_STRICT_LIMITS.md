# Phase 9 đợt 32, luồng P1 — Xác minh độc lập O1 + quyết định trade-off tier/MAD + cặp màu thứ ba

> LƯU Ý ĐỢT: brief P1 ban đầu viết lúc code còn là nút N6 (đợt 31),
> nhưng khi P1 chạy thì đợt 32 đã có luồng O1 làm đúng mảng này
> (`docs/PHASE9_ROUND32_O1_DIP_STRICT_LIMITS.md`) và đã áp bộ nút B
> mới vào `FADE_DIP_KNOTS_B`. Theo chuyển hướng khẩn của parent,
> lượt này thực chất là đợt 33, file vẫn giữ tên P1 để parent gộp
> (parent stage dưới tên đợt 33).
>
> QUYẾT ĐỊNH CỦA LUỒNG NÀY: **GIỮ NGUYÊN `FADE_DIP_KNOTS_B` của O1,
> KHÔNG đổi nút nào, KHÔNG sửa harness của O1.** Mọi claim của O1
> được kiểm chứng độc lập dưới đây đều khớp; không có bằng chứng
> O1 sai nên theo chuyển hướng thì không được đổi nút. Ứng cử (b)
> tìm được trong luồng này (giảm ô tăng 7 → 1) BỊ BÁC với lý do
> ghi rõ ở §4 — không phải vì nó thua tiêu chí cũ, mà vì nó đổi
> 5 nút để đuổi nhiễu làm tròn 8-bit trên chính dữ liệu fit, làm
> 10 ô khác tệ đi và tổng MAD tăng. KHÔNG push, KHÔNG tag/release,
> KHÔNG binary vào repo, KHÔNG tự ghi file paths-loop hay
> build-loop-log (parent lo). KHÔNG đụng seek.ts, preview.tsx,
> CLI caption/tts, toast, cdp-snapshot, WebCodecs, autosave.

## 0. O1 đã làm gì (tóm tắt để đối chiếu — không phải việc của P1)

- Đổi 10 nút B của `fadeDipWeights` (N6 → O1, giữ nút A và nút B
  tại p = 0,25 / 0,75): 0,2: 0,0288 → 0,0313; 0,35: 0,1427 →
  0,1441; 0,4: 0,2004 → 0,2016; 0,5: 0,3435 → 0,3450; 0,55:
  0,4191 → 0,4216; 0,6: 0,5059 → 0,5016; 0,65: 0,5884 → 0,5934;
  0,8: 0,8007 → 0,7982; 0,9: 0,8989 → 0,9039; 0,95: 0,9476 →
  0,9523.
- Kết quả O1 claim: trên lưới 99 ô (phẳng gốc + phẳng màu mới +
  xfade đơn màu mới + footage, exact-p 120fps): **0 ô tăng MAD so
  với smoothstep cũ (CUR), 0 tier tụt so với CUR, tổng MAD
  60,4732** (N6: 59,8578 nhưng 12 ô tăng; CUR: 100,2741); ô đích
  FW/FG phẳng gốc 0,75 = 1,3333 KHỚP.
- Cái giá O1 đã ghi rõ: so với N6, **1 ô tụt tier: FW/FG phẳng
  gốc 0,6 từ KHỚP (1,33) về XẤP XỈ (2,33)**, và đã chứng minh
  bằng quét 2D là không tránh được trong `fadeDipWeights`
  (vùng cặp-tốt và vùng đơn-tốt tại B@0,6 không giao nhau).
- Sửa harness lưới 30fps cũ: đánh giá model ở p thật của frame
  đã chọn thay vì p danh nghĩa (n = 113 → p thật 0,7667/0,2667),
  nhờ đó cả 21 ô lưới 30fps đều KHỚP, 3 ô XẤP XỈ duy nhất dưới
  danh nghĩa đều là ô 0,75.
- Nợ O1 để lại (§6 của O1): bar strict chưa đạt trên single gốc
  (7 ô tăng); chưa đo cặp màu thứ ba / footage khác; điều kiện
  (b)(c)(d) của M6 vẫn mở.

## 1. P1 xác minh độc lập được gì (chuỗi chạy lại từ đầu, không dùng JSON O1)

### 1.1 Harness frame 30fps — khớp từng ô với JSON sau-áp của O1

Script mới `measure_r32_p1_frame30.js` (công thức chọn frame ghi
ngay trong header script):

```
n       = round((3 + localT) * fps)   // frame đã chọn
t       = n / fps                      // thời gian thật
p1_thật = t - 3                        // xfade thứ nhất
p2_thật = t - 3,5                      // xfade thứ hai
Đánh giá model ở (p1_thật, p2_thật), báo rõ n/t/p_thật từng ô.
Điều kiện frame đúng p danh nghĩa: (3 + localT) * fps là số
nguyên — ở 30fps chỉ 0,6/0,9 thỏa, 0,75 không (112,5 → 113);
ở 120fps cả 3 đều thỏa (432/450/468).
```

Kết quả 21 ô lưới 30fps bằng CHÍNH code sản phẩm hiện tại,
**khớp từng chữ số** với `v32-o1-frame30-after.json`:

| Ô 0,75 | Danh nghĩa (harness cũ) | p thật (harness sửa) |
|---|---|---|
| phẳng FW/FG | 3,3333 XẤP XỈ | **1,3333 KHỚP** |
| footage FW/FW và FB/FW | 2,0579 XẤP XỈ | **0,4614 KHỚP** |
| phẳng 4 combo còn lại | 2,0000 KHỚP | 0,6667 KHỚP |

Chỉ 3 ô đổi verdict giữa 2 cột, cả 3 đều là ô 0,75 — đúng chẩn
đoán lỗi chọn frame. Ô FW/FG 0,6 = 2,3333 XẤP XỈ ở cả 2 cột
(vì 0,6 là bội 1/30 nên danh nghĩa = p thật): đó là trade-off
của O1 (§3), không phải lỗi harness. Spot-check 120fps:
FW/FG phẳng gốc 0,75 tại n = 450 (t = 3,75, exact) = **1,3333
KHỚP**, trùng lưới exact-p. **Kết luận: harness O1 đúng, không
có bằng chứng O1 sai ở đây — không sửa harness.**

### 1.2 Lưới exact-p 162 ô — khớp tổng của O1 trong sai số làm tròn

Script mới `measure_r32_p1_dip_strict.js` chạy lại toàn bộ chuỗi
FFmpeg 120fps (156 ô mean-pixel — chính xác vì khung đồng màu —
+ 6 ô footage full-frame) với 3 cột CUR / N6 / HIỆN TẠI, và kiểm
chứng bằng CHÍNH code sản phẩm transpile trên cả 156 ô:

- 99 ô (trừ single gốc): CUR 94,0000 → HIỆN TẠI **56,0000** (mean)
  + footage CUR 6,2741 → HIỆN TẠI **4,4732** = **60,4732**, khớp
  đúng số O1 (60,4732); 162 ô: CUR 151,2741 → HIỆN TẠI 88,8065
  (O1: 88,8063; chênh 0,0002 do làm tròn 4 chữ số từng ô).
- Tham số-vs-product trên 156 ô: **lệch MAD lớn nhất 0,000000,
  0 ô lệch** — bảng nút trong script P1 trùng code sản phẩm.
- Ô đích FW/FG phẳng gốc 0,75 = **1,3333 KHỚP** (cả tham số lẫn
  product). Test `transitionPreview.test.ts`: **31 pass, 0 fail**.

## 2. Bar nghiêm ngặt với trọng số HIỆN TẠI: liệt kê mọi ô tăng MAD

Thang V6 như M6/N6/O1: KHỚP = MAD ≤ 2 và ≥ 99% ≤ 8; XẤP XỈ =
MAD ≤ 20 và ≥ 90% ≤ 8.

**(a) So với CUR trên lưới 99 ô của O1: 0 ô tăng, 0 tier tụt —
claim bar strict của O1 ĐƯỢC XÁC NHẬN.** Trên footage (6 ô):
0 ô tăng, 0 tier tụt (tổng 6,2741 → 4,4732).

**(b) So với CUR trên toàn 162 ô: 7 ô tăng, tất cả đều là
single gốc red→green, tất cả +0,3333 (đúng 1 mức 8-bit trên
1 kênh), tất cả vẫn KHỚP, 0 tier tụt:**

| Ô | CUR → HIỆN TẠI |
|---|---|
| single-orig fadeblack p = 0,65 | 0 → 0,3333 |
| single-orig fadewhite p = 0,45 | 0,6667 → 1,0000 |
| single-orig fadegrays p = 0,2 | 0,6667 → 1,0000 |
| single-orig fadegrays p = 0,3 | 0,6667 → 1,0000 |
| single-orig fadegrays p = 0,65 | 0,6667 → 1,0000 |
| single-orig fadegrays p = 0,7 | 0,6667 → 1,0000 |
| single-orig fadegrays p = 0,85 | 0,3333 → 0,6667 |

Đây chính là 7 ô O1 đã báo (§3 của O1) — P1 chỉ xác nhận lại
bằng chuỗi chạy mới, không phát hiện thêm ô nào. Phẳng màu mới:
0 ô tăng. So với N6 trên 156 ô: HIỆN TẠI tăng ở 17 ô, tụt tier
ở đúng 1 ô (FW/FG phẳng gốc 0,6, 1,33 → 2,33).

**(c) Quyết định trade-off tier-vs-MAD (nợ O1, P1 chốt): GIỮ O1.**
Lý do: bar strict "0 ô tăng vs CUR" là mandate đã giao cho O1
và đã đạt; ô tụt tier duy nhất so với N6 chỉ vượt ngưỡng KHỚP
(2,0) một chút (2,33, max diff 3, vẫn sâu trong XẤP XỈ) trong
khi revert về N6 sẽ khôi phục 12 ô tăng trên lưới 99 (tổng
99 ô 60,47 → 59,86 là rẻ hơn không đáng kể so với 12 ô tăng).
Đường revert vẫn còn nguyên trong §6 của O1 nếu parent đổi ý:
trả `FADE_DIP_KNOTS_B` về 10 giá trị N6 — khi ấy 12 ô tăng §1
của O1 quay lại. P1 không tự revert.

## 3. Cặp màu thứ ba (mới — đóng một phần nợ phạm vi của O1)

Script mới `measure_r32_p1_third_colors.js`: cyan (0,255,255) →
magenta (254,0,253 sau rgb24) → yellow (253,253,0), 5 combo ×
3 localT = 15 ô, exact-p 120fps, code sản phẩm hiện tại:

- Tổng MAD: CUR 19,6667 → N6 14,0000 → **PRODUCT 13,6667**;
  0 tier tụt so với CUR; ô FW/FG 0,75 = **1,3333 KHỚP** (CUR là
  2,6667 XẤP XỈ) — nút O1 tổng quát hoá tốt sang cặp màu chưa
  từng dùng để fit/chọn.
- Nhưng có **1 ô tăng vs CUR, vẫn KHỚP**: FW/FG 0,9: 0,6667 →
  1,0000 (+0,3333) — cùng ô "cứng đầu" đã thấy ở phẳng gốc
  (FW/FG 0,9: 0,33 → 1,00 từ đợt 31). Mẫu này cho thấy ô tăng
  FW/FG@0,9 không phải đặc thù một cặp màu mà là hành vi hệ
  thống của họ fade tại p cao, ở mức nhiễu làm tròn; không đủ
  căn cứ để vặn nút theo (vặn B@0,9 sẽ đụng single@0,9 và cặp
  khác, xem §4).
- So với N6 trên cặp này, product tệ hơn ở 1 ô nhưng vẫn KHỚP
  và bằng đúng CUR: FG/FW 0,6: 1,3333 → 1,6667 — cùng hướng
  trade-off O1, không phải hồi quy mới.

## 4. Hai ứng cử đã thử — cả hai đều BỊ BÁC, code giữ nguyên

### 4.1 Ứng cử (a): nội suy cubic đơn điệu qua nút O1 — không có bằng chứng

Cubic Fritsch–Carlson qua đúng các nút O1 cho **cùng từng chữ
số** với tuyến tính trên toàn bộ lưới (156 ô: tổng 84,3333,
7 ô tăng, 99 ô: 0 tăng). Lý do: mọi p được đo đều trùng nút
(p = bội 0,05; p2 cặp = 0,1/0,25/0,4 cũng là nút) nên cubic qua
nút = giá trị nút. Cubic chỉ khác tuyến tính ở p GIỮA các nút
— vùng chưa có dữ liệu đo nào. **Không áp dụng:** đổi kiểu nội
suy mà không có lấy một điểm đo giữa nút thì chỉ là đổi mù.

### 4.2 Ứng cử (b): descent trên nút B — giảm ô tăng 7 → 1 nhưng BỊ BÁC

Descent trên B@0,2/0,3/0,45/0,65/0,7/0,85 (giá trị thử: hiện
tại, giá trị CUR, trung điểm, ±0,0025…±0,02), nhận ứng cử theo
tiêu chí cũ (giảm ô tăng vs CUR, 0 tier tụt vs CUR, 0 tier tụt
vs HIỆN TẠI, lưới 99 vẫn 0 tăng, footage kiểm chứng sau cùng
0/0). Kết quả đạt tiêu chí cũ trên giấy: tăng 7 → **1** (chỉ
còn single-orig fadegrays@0,2), 99 ô vẫn 0 tăng, footage 0 tăng
/ 0 tier tụt. Nút ứng cử: B@0,3: 0,0955 → 0,0914 (giá trị CUR,
không làm tròn 4 chữ số); B@0,45: 0,2659 → 0,2696; B@0,65:
0,5934 → 0,5834; B@0,7: 0,6697 → 0,6722; B@0,85: 0,8479 →
0,8557 (sau polish 0,8582 → 0,8557).

**Vì sao bác dù đạt tiêu chí cũ (đọc kỹ trước khi trích):**

1. Theo chuyển hướng, không đổi nút khi O1 không sai — và §1
   chứng minh O1 không sai (mọi claim khớp). Ứng cử này không
   sửa lỗi nào của O1, nó chỉ đuổi nhiễu làm tròn trên chính
   dữ liệu fit.
2. Ứng cử làm **10 ô tệ đi so với HIỆN TẠI** (tiêu chí cũ chỉ
   cấm tụt tier nên không chặn được): single-new fadeblack
   @0,3/0,45/0,7/0,85: 0 → 0,6667; single-new fadewhite@0,65:
   0,6667 → 1,3333; nặng nhất single-orig fadewhite@0,65:
   **0 → 1,6667** (+1,67, gấp 5 lần mức tăng nó sửa). Tổng MAD
   156 ô tăng 84,3333 → **86,6667 (+2,8%)**; tổng 162 ô tăng
   88,8065 → ~91,14. Đổi 6 ô tăng lấy 10 ô tệ hơn và tổng tệ
   hơn không phải cải thiện.
3. Ô tăng còn lại (fadegrays gốc 0,2) bị KHÓA bởi ràng buộc
   lưới 99: descent thử mọi giá trị B@0,2 trong tập thử mà
   không giá trị nào vừa sửa nó vừa giữ lưới 99 ở 0 tăng và
   không tụt tier — vì B@0,2 đồng thời lái 3 ô single-new@0,2
   (hiện 0,6667/0,6667/1,0000, đều tốt hơn CUR). Muốn sửa nốt
   ô này phải phá lưới 99 hoặc đổi mô hình — ngoài phạm vi.
4. Giá trị B@0,3 không làm tròn (0,091448…) là dấu hiệu fit
   nhiễu: nó là giá trị smoothstep CUR "vô tình" làm tròn tốt
   hơn tại đúng 1 ô, không phải đường cong vật lý mới.

**Kết luận §4: không ứng cử nào được áp. `FADE_DIP_KNOTS_B`
giữ nguyên như O1. Mọi số ứng cử trong luồng này chỉ là bằng
chứng đã thử, không phải đề xuất merge.**

## 5. Kiểm chứng và file đổi/thêm (CHỈ file của P1)

Lệnh chạy (từ gốc repo; FFmpeg 8.1.2, Node 24):

- `node --check` cả 3 script mới: pass.
- `node server/render/src/measure_r32_p1_frame30.js --json
  benchmarks/results/v32-p1-frame30.json` (21 ô 30fps + 1 spot
  120fps; khớp từng ô với `v32-o1-frame30-after.json`).
- `node server/render/src/measure_r32_p1_dip_strict.js --json
  benchmarks/results/v32-p1-dip-strict.json` (162 ô; ~6 phút,
  chủ yếu FFmpeg; product-vs-tham số 0,000000).
- `node server/render/src/measure_r32_p1_third_colors.js --json
  benchmarks/results/v32-p1-third-colors.json` (15 ô cặp màu
  thứ ba).
- `node apps/web/src/lib/transitionPreview.test.ts`: **31 pass,
  0 fail**.
- `tsc --noEmit` (apps/web): **1 lỗi ngoài phạm vi P1** —
  `src/lib/mp4Demux.ts(95,3): error TS6133: 'view' is declared
  but its value is never read`. File này do luồng khác sửa
  trong đợt (mtime 01/11 07:10 UTC, thuộc mảng WebCodecs mà
  brief P1 cấm đụng), P1 KHÔNG sửa — parent kiểm chứng gộp
  cần xác nhận với luồng đó, đừng quy cho P1. Không chạy
  `vite build` trong luồng này (lý do như N6: dist dùng chung
  với các luồng song song; tsc của riêng file P1 không đổi
  logic nào nên rủi ro bundle là không).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (raw trung gian chỉ ở
  /tmp, đã xoá). KHÔNG tự ghi file paths-loop, KHÔNG ghi
  build-loop-log (parent lo).

File đổi/thêm (text, không binary — parent gộp batch đợt 33;
KHÔNG liệt kê file O1, KHÔNG sửa file O1, KHÔNG sửa code sản
phẩm):

- Mới: `server/render/src/measure_r32_p1_frame30.js` — harness
  30fps chọn frame theo p thật (công thức §1.1) + spot 120fps.
- Mới: `server/render/src/measure_r32_p1_dip_strict.js` — lưới
  strict 162 ô (CUR/N6/HIỆN TẠI/product) + ứng cử cubic +
  descent nút B (cả hai đều bị bác, §4).
- Mới: `server/render/src/measure_r32_p1_third_colors.js` — lưới
  cặp màu thứ ba cyan→magenta→yellow (15 ô, §3).
- Mới: `docs/PHASE9_ROUND32_P1_DIP_STRICT_LIMITS.md` — file này.
- Mới: `benchmarks/results/v32-p1-frame30.json` — lưới 30fps
  danh nghĩa vs p-thật (22 dòng gồm spot 120fps).
- Mới: `benchmarks/results/v32-p1-dip-strict.json` — lưới 162 ô
  (CUR/N6/hiện tại/cubic/ứng cử-b/footage/product-check).
- Mới: `benchmarks/results/v32-p1-third-colors.json` — lưới cặp
  màu thứ ba 15 ô.

## 6. Chưa làm / nợ còn lại (không mạo nhận)

- Điều kiện (b) harness before/after, (c) ngân sách perf ~1,5×,
  (d) phạm vi họ fade của M6 vẫn mở — P1 không đụng; mô hình
  đơn clip + badge `matched` giữ nguyên, không ai được trích
  luồng này như "đã cho phép đổi model".
- Bar strict toàn cục vẫn chưa đạt theo nghĩa chặt nhất: còn
  7 ô tăng +0,3333 trên single gốc (§2b) và 1 ô tăng +0,3333
  trên cặp màu thứ ba (§3) — tất cả vẫn KHỚP, mức nhiễu làm
  tròn 8-bit. Muốn 0 tăng tuyệt đối phải đổi mô hình hoặc chấp
  nhận phá lưới khác (chứng minh khóa ở §4.2 mục 3) — P1 chọn
  giữ O1 thay vì đuổi nhiễu.
- Footage khác (ngoài K→L→J) vẫn chưa đo; Safari / máy thật /
  dpr > 1 / viewport khác cho dip vẫn chưa đo (nợ đứng).
- Blur ở p/mode/weights khác vẫn chưa đo (nợ đứng từ M6).
- `tsc` repo-wide hiện có 1 lỗi ở `mp4Demux.ts` do luồng khác
  (§5) — cần luồng đó sửa, không phải P1.
