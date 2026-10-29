# Phase 9 đợt 14 — R1: Sửa hướng P của custom transition ở phía render (LIMITS)

Ngày: 2026-10-27, luồng R1 đợt 14. KHÔNG push, KHÔNG tag/release,
KHÔNG binary. Chỉ sửa file của mảng này (`server/render/src/transitions.js`,
`server/render/src/test_v13_hd_parity.js` + LIMITS này). KHÔNG đụng
`apps/web/src/lib/transitionPreview.ts` (preview thuộc luồng khác trong
cùng đợt — các nợ phía preview phát hiện ở đây chỉ ghi lại, không sửa).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Nợ hướng P của đợt 13 C6 ĐÃ ĐÓNG ở tầng render.** Trước sửa, cả 23
  type custom đều chạy ngược thời gian so với preview: probe lavfi
  đỏ/xanh (duration=0.4, offset=1, fps=30) cho B% GIẢM đơn điệu
  100→0% qua frame 30..42, trong khi built-in wipeleft TĂNG 0→99.5%.
  Sau sửa, cả 23 type đều TĂNG đơn điệu 0→100% — frame đầu gần như
  toàn cảnh cũ, frame cuối toàn cảnh mới, đúng như preview.
- **Cách sửa (2 điểm, không đảo preview):**
  1. `buildXfadeFilter` dịch mọi token P độc lập trong expr custom
     thành `(1-P)` trước khi đưa cho FFmpeg (catalog giữ nguyên literal
     viết theo p-preview tăng dần — xem §2).
  2. `circle-soft` là trường hợp đặc biệt: literal gốc mô tả B ở
     NGOÀI vòng tròn (đổi hệ số A/B trong catalog — xem §2.2).
- **Đo lại toàn bộ:** V13 HD 1920x1080: 48/48 KHỚP (14 V3 + wipeleft +
  diamond), số MAD trùng khớp bảng post-fix của C6 — chứng tỏ sửa giữ
  nguyên hình học tại cùng một giá trị P, chỉ sửa chiều thời gian.
  V13 nhỏ 192x108 cho đủ 23 custom + wipeleft: 55/72 KHỚP; 17 case còn
  lại đều có nguyên nhân đã xác định, KHÔNG phải lỗi hướng (§3.3):
  `grid` (mô hình preview sai), `bars-fade` (preview bỏ qua nền
  crossfade), `circle-soft` (viền mềm vs preview biên cứng),
  `blinds-h`/`checker`/`plus` (lệch biên 1 hàng do quy ước lấy mẫu,
  về KHỚP ở HD đối với blinds-h).
- **Không hồi quy type native:** V11: 19/20 transition KHỚP (chỉ FAIL
  `dissolve` built-in — nợ cũ, không liên quan, xem §5); V12: 32 case,
  chỉ FAIL `circleopen` built-in (rasterizer V12 cũ trước mô hình
  preview mới — V11 cùng module thì PASS, xem §5). Cả hai type FAIL
  đều KHÔNG có expr nên filter trước/sau sửa giống hệt nhau theo code.

## 1. Bằng chứng trước sửa (đo thật, FFmpeg 8.1.2)

### 1.1 Đường cong B% theo frame — 23 custom đều ngược, built-in đúng

Thiết lập như V13: lavfi `color` đỏ (A) / xanh (B), duration=0.4,
offset=1, fps=30, frame transition 30..42, đếm pixel xanh trội
(B>150 và B>R+100). Trước sửa:

| Nhóm | Frame 30 → frame 42 (B%) |
|---|---|
| wipeleft, slideright (built-in, đối chứng) | 0.0% → 99.5% / 100.0% (tăng) |
| 22 custom kiểu thường (blinds-h, bars-v, checker, diamond, plus, grid, clock, bars-fade, 14 V3) | 100.0% → 0.0% (giảm; chi tiết từng type ở log probe, vd squareopen 100→92.2→…→0.0, diamondclose 100→98.5→…→0.0) |
| circle-soft (ngoại lệ — xem §1.3) | 0.0% → 98.0% (tăng, nhưng hình học ngược) |
| checker / checker-alt (ngưỡng rời rạc) | bậc thang giảm 100→75→50→25→0% / 100→50→0% |

Sau sửa, cùng thiết lập, cả 23 custom đều tăng đơn điệu (vd
squareopen 0→1.1→…→100%, diamondclose 0→1.5→…→100%, circle-soft
0.3→3.0→…→100.0%). Hai type ngưỡng vẫn bậc thang nhưng đúng chiều:
checker 0→25→50→75→100%, checker-alt 0% tới frame 33 (p=0.25, ngưỡng
`gt` nghiêm ngặt), 50% ở giữa, 100% từ frame 40.

### 1.2 Loại giả thuyết "A/B bị hoán đổi"

B% giảm có thể giải thích bằng 2 giả thuyết: (H1) P giảm 1→0, mapping
bình thường; (H2) P tăng 0→1 nhưng A/B bị hoán đổi với custom. Probe
phân biệt: expr thăm dò KHÔNG phụ thuộc P,
`if(lt(X,W/2),B,A)`, cho nửa trái = xanh (0,0,255), nửa phải = đỏ
(254,0,0) — đúng mapping bình thường. Vậy H2 bị loại, H1 đứng: FFmpeg
8.1.2 đánh giá P custom giảm 1→0. (Lưu ý: tài liệu web phổ biến mô tả
P custom là 0→1 — số đo thật ở đây mâu thuẫn với mô tả đó; tin số đo.)

### 1.3 circle-soft: B% tăng nhưng hình học ngược — cần sửa khác

Probe pixel trước sửa (192x108):

| Type | Frame 30 | Frame 33 | Frame 36 | Frame 39 | Frame 42 |
|---|---|---|---|---|---|
| circle-soft tâm (96,54) | đỏ | đỏ | đỏ | đỏ | đỏ |
| circle-soft góc (0,0) | đỏ | xanh | xanh | xanh | xanh |
| squareopen tâm / góc (đối chứng) | xanh / xanh | xanh / đỏ | xanh / đỏ | xanh / đỏ | xanh / đỏ |

Tức render circle-soft cũ: B xâm nhập từ ngoài vào, đĩa A co dần về
tâm, tâm KHÔNG BAO GIỜ thành B — ngược hẳn preview (B nở từ tâm ra,
r = p·R). B% tổng tăng chỉ vì vùng B (vành ngoài) lớn dần. Vì vậy
circle-soft không thể sửa bằng đảo P đơn thuần: đảo P của literal cũ
vẫn giữ nguyên cặp hệ số A/B ngược. Nó cần đổi hệ số (xem §2.2).

## 2. Cách sửa

### 2.1 Dịch P→(1-P) trong `buildXfadeFilter` (22 type + circle-soft)

Mọi consumer render đều đi qua `buildXfadeFilter` (render.js bước 2,
các harness V10–V13, demo scripts; grep toàn repo không thấy chỗ nào
đọc `t.expr` trực tiếp ngoài hàm này). Catalog expr giữ nguyên dạng
viết theo p-preview (tăng 0→1 — đúng như `transitionPreview.ts` map),
hàm này dịch `t.expr.replace(/\bP\b/g, "(1-P)")` trước khi bọc quote.
Kiểm chứng regex: 23/23 type, số lần xuất hiện `PI` trước/sau bằng nhau
(không chạm PI/pow/clip), không còn token P độc lập nào ngoài `(1-P)`,
`buildXfadeFilter` chạy được cho cả 81 type.

Tính đơn điệu: cả 22 expr thường đều đơn điệu theo P (tuyến tính,
bình phương như corners, góc như clock/spiral, ngưỡng như checker-alt
— thay P bằng 1−P chỉ đổi chiều, giữ nguyên tập giá trị; checker-alt:
`gt(P,0.25)/gt(P,0.75)` thành `gt(1−P,0.25)/gt(1−P,0.75)` tức ô chẵn
hiện khi thời gian qua 25%, ô lẻ khi qua 75%, đúng preview). Không có
type nào cần mô hình riêng ngoài circle-soft.

### 2.2 circle-soft: đổi hệ số A/B trong catalog literal

- Cũ: `A*(1-clip((r−P·R)/(0.15R)))+B*clip((r−P·R)/(0.15R))`
  → B ở ngoài đĩa, A ở trong (ngược mô tả "vòng tròn mở").
- Mới: `A*clip((r−P·R)/(0.15R))+B*(1-clip((r−P·R)/(0.15R)))`
  → B trong đĩa bán kính p·R, viền mềm 0.15R ở ngoài mép đĩa.
- Cùng phép dịch §2.1, render sau sửa: tâm xanh từ frame đầu, góc đỏ
  tới frame cuối (xanh ở frame 42), frame cuối toàn B — đúng preview.
- Viền mềm vẫn là xấp xỉ so với preview biên cứng (preview tự ghi
  "bỏ qua viền mềm 15%"): MAD so với preview biên cứng ở §3.3, và
  kiểm chứng soft-aware ở §3.4.

### 2.3 Những gì KHÔNG sửa (cố ý)

- KHÔNG đảo p của preview, KHÔNG sửa `transitionPreview.ts`: hình học
  preview đã đúng (chỉ trừ các nợ riêng ở §5 thuộc về preview).
- KHÔNG sửa literal của 22 type còn lại: sửa literal theo P-FFmpeg sẽ
  khiến catalog mang 2 quy ước lẫn lộn và đảo ngược 2 lần khi hàm
  dịch chạy. Ghi chú chống sửa nhầm đã thêm vào đầu khối P5 và trong
  `buildXfadeFilter`.
- KHÔNG đổi cách ghép input `[A][B]` của render worker: thứ tự input
  đã đúng (probe §1.2).

### 2.4 Cảnh báo gắn với phiên bản FFmpeg

Phép dịch này gắn với hành vi P giảm của **FFmpeg 8.1.2**. Nếu FFmpeg
đổi chiều P ở bản sau, phải BỎ phép dịch và đo lại toàn bộ 23 type
(trước khi tin bất kỳ bảng MAD nào ở đây). Ghi chú này đã viết trong
code của `buildXfadeFilter`.

## 3. Số đo sau sửa

Thang V6: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8. Nguồn đo: màu phẳng
đỏ/xanh (không phải footage thật), sàn làm tròn yuv như C6 (đỏ render
= 254, MAD có sàn (1−B%)/3).

### 3.1 V13 HD 1920x1080 — 48/48 KHỚP, 0 lỗi render

Ghép frame mới: frame đích = 30 + round(p·12) cho MỌI type (33/36/39).
Ghép cũ của V13 (custom: 39/36/33) chỉ đúng trước khi sửa; giữ lại nó
sẽ cho MAD ~85–124 giả như lần đo HD đầu của C6.

| Type | p=0.25: MAD / ≤8 | p=0.5: MAD / ≤8 | p=0.75: MAD / ≤8 |
|---|---|---|---|
| diamondclose | 0.349 / 99.964% | 0.255 / 99.948% | 0.107 / 99.964% |
| squareopen | 0.296 / 100% | 0.185 / 100% | 0.083 / 100% |
| squareclose | 0.250 / 100% | 0.148 / 100% | 0.037 / 100% |
| checker-alt | 0.333 / 100% | 0.167 / 100% | 0.167 / 100% |
| blinds-diag | 0.249 / 100% | 0.165 / 100% | 0.081 / 100% |
| split-h | 0.250 / 100% | 0.167 / 100% | 0.083 / 100% |
| split-v | 0.250 / 100% | 0.167 / 100% | 0.083 / 100% |
| barn-h | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| barn-v | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| rings | 0.255 / 99.999% | 0.168 / 99.999% | 0.084 / 99.999% |
| corners | 0.296 / 99.999% | 0.181 / 100% | 0.069 / 100% |
| star | 0.498 / 99.837% | 0.321 / 99.849% | 0.180 / 99.901% |
| clock-ccw | 0.329 / 99.954% | 0.324 / 99.907% | 0.206 / 99.928% |
| spiral | 0.795 / 99.678% | 0.721 / 99.674% | 0.629 / 99.678% |
| wipeleft (nợ cũ) | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| diamond (nợ cũ) | 0.350 / 99.964% | 0.255 / 99.948% | 0.106 / 99.964% |

Bảng này trùng khớp bảng post-fix của C6 tới 3 chữ số thập phân —
đúng như lý thuyết: sửa chỉ đổi chiều thời gian, hình học tại cùng
một giá trị P không đổi; và frame đích mới (33/36/39) sau sửa cho
cùng hình học mà C6 phải ghép ngược (39/36/33) mới có. Diamond vẫn
còn dư tie-break biên như C6 (749–1080 pixel ở HD khi bán kính
nguyên, tier KHỚP) — không đổi, không sửa thêm.

### 3.2 V13 nhỏ 192x108 — đủ 23 custom + wipeleft: 55/72 KHỚP

Lần đầu tiên 9 type P5 được đo MAD (V11/V12 không cover P5). Toàn bộ
type V3 + bars-v + clock + diamond + wipeleft KHỚP ở cả 3 p (MAD
0.04–1.74, chi tiết ở bảng dưới). 17 case không KHỚP phân tích ở §3.3.

| Type | p=0.25 MAD / ≤8 | p=0.5 MAD / ≤8 | p=0.75 MAD / ≤8 | Tier |
|---|---|---|---|---|
| blinds-h | 12.815 / 92.593% | 12.728 / 92.593% | 12.642 / 92.593% | XẤP XỈ |
| bars-v | 0.250 / 100% | 0.167 / 100% | 0.083 / 100% | KHỚP |
| checker | 3.392 / 98.148% | 3.309 / 98.148% | 3.225 / 98.148% | XẤP XỈ |
| diamond | 0.288 / 100% | 1.050 / 99.479% | 0.045 / 100% | KHỚP |
| plus | 4.224 / 97.637% | 1.683 / 99.079% | 2.290 / 98.679% | XẤP XỈ/KHỚP/XẤP XỈ* |
| grid | 66.751 / 60.764% | 85.204 / 49.826% | 58.797 / 65.355% | LỆCH |
| clock | 0.250 / 100% | 0.167 / 100% | 0.517 / 99.744% | KHỚP |
| circle-soft | 14.418 / 82.518% | 18.405 / 79.470% | 15.547 / 82.798% | LỆCH (xem §3.4) |
| bars-fade | 31.750 / 25.000% | 42.500 / 50.000% | 31.833 / 75.000% | LỆCH (xem §3.3) |
| 14 V3 + wipeleft | 0.04–1.05, ≤8 ≥ 99.537% | 0.04–1.74, ≤8 ≥ 99.074% | 0.04–1.31, ≤8 ≥ 99.277% | KHỚP |

\* plus ở p=0.5: MAD 1.683, le8 99.079% → KHỚP theo thang (MAD ≤ 2
và le8 ≥ 99%); p=0.25/0.75 XẤP XỈ. B% render vs preview khớp tới 0.01%
ở mọi case XẤP XỈ/LỆCH trong bảng này trừ grid (xem §3.3) — tức diện
tích hình học đúng, lệch chỉ ở vị trí biên hoặc thành phần preview
bỏ qua.

### 3.3 Vì sao 17 case nhỏ không KHỚP — và vì sao không phải lỗi hướng

1. **grid — LỆCH ở mọi size, lỗi mô hình preview (nợ preview).**
   Expr: `max(mod(X,s),mod(Y,s)) ≤ P·s` ⟺ B là ô vuông góc trên-trái
   mỗi ô (cạnh P·s). Preview mô hình thành hình chữ L (dải trên +
   dải trái). B% render vs preview: 192x108: 7.02 vs 45.99 / 27.28 vs
   77.18 / 60.76 vs 95.14; 192x104: 9.62 vs 41.11 / 29.45 vs 71.39 /
   60.10 vs 94.95; HD: 6.64 vs 44.90 / 25.76 vs 75.02 / 57.38 vs 93.76
   (MAD 65.1/83.7/61.8). LỆCH ở mọi size và mọi p → không phải lượng
   tử hoá, không phải hướng (B% render tăng đơn điệu đúng chiều).
   Luồng này không sửa preview (ranh giới đợt); cần một lượt sửa
   mô hình grid phía preview.
2. **bars-fade — LỆCH, preview bỏ qua nền crossfade (đã ghi trong
   preview).** Preview tự ghi: "phần crossfade nền bỏ qua". Render có
   nền `A*(1−P)+B*P` (sau dịch: đúng chiều, B% khớp 25/50/75% chính
   xác). Vùng không phải dải (75%/50%/25% khung) render là màu trộn,
   preview là A thuần → MAD 31.8/42.5/31.8, le8 đúng bằng tỉ lệ dải.
   Hướng và hình học dải đã đúng; muốn MAD về KHỚP phải dạy preview
   vẽ nền crossfade (việc phía preview).
3. **blinds-h / checker / plus — XẤP XỈ ở khung nhỏ, quy ước lấy mẫu.**
   - blinds-h ở 192x108: lệch đúng 8 hàng (1 hàng/dải, 7.407% khung)
     ở mọi p. Ở 192x104: p=0.25/0.5 lệch 1 hàng/dải về SỐ LƯỢNG
     (B% render 30.77 vs preview 23.08; 53.85 vs 46.15) — FFmpeg đánh
     giá tại chỉ số nguyên (`mod(Y,13) < 3.25` cho 4 hàng) còn preview
     lấy mẫu tại tâm pixel (3.25 → 3 hàng). Đây là cùng họ quy ước
     "chỉ số nguyên vs tâm pixel" mà C6 đã sửa cho diamond (+0.5),
     nhưng khối P5 chưa áp dụng cho dải. Ở HD, 1 hàng/dải chỉ còn
     0.74% khung: blinds-h HD KHỚP ở cả 3 p (MAD 0.249/1.425/1.341,
     le8 100%/99.259%/99.259%, B% khớp tới 0.74pp).
   - checker ở 192x104: KHỚP cả 3 p (MAD 0.250/0.167/0.083) — XẤP XỈ
     ở 192x108 chỉ do H/8 = 13.5 không nguyên.
   - plus ở 192x104: KHỚP 2/3 p (chỉ còn XẤP XỈ nhẹ ở p=0.25,
     MAD 2.281, le8 98.783%).
   Kết luận: nhóm này không có lỗi hướng hay lỗi hình học hệ thống;
   còn lại là nợ quy ước lấy mẫu phía preview, ảnh hưởng giảm dần
   theo kích thước khung.
4. **circle-soft — xem §3.4 (không phải LỆCH hình học).**

### 3.4 circle-soft: kiểm chứng soft-aware (thay vì preview biên cứng)

So render với preview biên cứng cho MAD 14.4/18.4/15.5 là đúng như dự
đoán: vành mềm rộng 0.15R (~31% diện tích khung ở p=0.5 nằm trong
vành) bị preview biên cứng tính là A thuần. Kiểm chứng riêng với đĩa
mềm giải tích (w = clip((p·R − r)/(0.15R) + 1, 0, 1), r tại chỉ số
nguyên, A = (254,0,0) theo sàn yuv), cùng frame đích sau sửa:

| p | frame | MAD soft-aware | ≤8 | ≤32 |
|---|---|---|---|---|
| 0.25 | 33 | 0.181 | 100.000% | 100.000% |
| 0.5 | 36 | 0.212 | 100.000% | 100.000% |
| 0.75 | 39 | 0.178 | 100.000% | 100.000% |

→ Hình học đĩa mềm đã đúng tới sàn yuv. MAD cao so với preview biên
cứng là khoảng cách giữa tính năng (viền mềm) và mô hình preview
(biên cứng), không phải lỗi hướng hay lỗi hình học. Không sửa preview
ở đây (ranh giới đợt).

### 3.5 Hồi quy V11 / V12 (p=0.5 — điểm bất biến trước đảo chiều)

- **V11 (72x45):** 24 case, transition 19/20 KHỚP: fade MAD 0.67,
  wipeleft 0.00, slideright 0.00, circleopen 0.33, circleclose 0.33,
  14 V3 MAD 0.00–0.52 (rings 0.05, star 0.52, còn lại 0.00). Chỉ FAIL
  `dissolve` MAD 85.00 — xem §5 (không liên quan sửa này).
- **V12 (72x45):** 32 case (A hồi quy 7 + A2 V3 14 + B text 4 + C effect
  7), chỉ FAIL `circleopen` — xem §5 (không liên quan sửa này). 14 V3
  A2 đều KHỚP (MAD 0.00 như trước).
- Lý thuyết: tại p=0.5, (1−0.5) = 0.5 nên expr sau dịch cho cùng hình
  học như trước sửa — V11/V12 không thể phát hiện đảo chiều, và cũng
  không thể hồi quy vì nó. Đúng như quan sát: mọi số V3 ở p=0.5 đều
  giữ nguyên.

## 4. MAD trước/sau — đọc đúng (tránh hiểu nhầm)

- "Trước" theo nghĩa NGƯỜI DÙNG THẤY (ghép frame theo thời gian,
  không bù chiều): C6 đã đo nhầm một lượt HD như vậy và được MAD
  85–124 LỆCH ở p=0.25/0.75 cho V3 — đó chính là mức độ ngược của
  transition custom trước sửa. Sau sửa, cùng cách ghép thời gian đó
  cho MAD ở §3.1 (0.04–0.80).
- "Trước" theo nghĩa HÌNH HỌC TẠI CÙNG P (ghép bù chiều như C6):
  V3 đã KHỚP trước sửa (bảng C6) và vẫn KHỚP sau sửa với cùng số —
  vì sửa không đổi hình học tại cùng P. Hai câu này không mâu thuẫn:
  câu đầu nói về chiều thời gian, câu sau nói về hình học tĩnh.
- P5 (9 type) chưa từng được đo MAD trước đợt này (V11/V12 không
  cover P5), nên không có "MAD trước" cho P5 để so sánh — chỉ có
  đường cong B% trước/sau ở §1.1 làm bằng chứng hướng. Đừng trích
  bảng §3.2 như "trước/sau" cho P5.

## 5. Nợ còn lại (trung thực, không claim quá)

- **grid:** mô hình preview sai (chữ L thay vì ô vuông góc) — nợ phía
  preview, LỆCH ở mọi size kể cả HD (§3.3.1). Cần lượt sửa preview.
- **bars-fade:** preview bỏ qua nền crossfade — muốn MAD KHỚP phải
  dạy preview vẽ nền trộn (việc phía preview).
- **blinds-h / plus (và checker ở khung nhỏ):** lệch biên do quy ước
  lấy mẫu chỉ số nguyên vs tâm pixel (phía preview); ở HD đã về
  KHỚP đối với blinds-h, checker KHỚP từ 192x104.
- **circle-soft vs preview biên cứng:** MAD 14–18 là khoảng cách tính
  năng–mô hình, không phải bug; soft-aware đã KHỚP (§3.4).
- **V11 dissolve FAIL (MAD 85.00, preview B% 0.0 vs render 50.8%):**
  dissolve là built-in, KHÔNG có expr → filter trước/sau sửa giống hệt
  nhau theo code; đây là nợ cũ đợt 12 (MAD 85.52) mà luồng R2 đợt 14
  đang sửa ở phía preview (preview đã đổi sang mô hình
  ffmpegDissolveFrand nhưng rasterizer V11 chưa phản ánh) — không
  thuộc phạm vi R1, không do sửa này gây ra.
- **V12 circleopen FAIL (MAD 84.67, preview B% 0.0 vs render 4.2%):**
  circleopen cũng là built-in không expr → cùng lập luận không
  liên quan; V11 với cùng module preview thì circleopen PASS
  (MAD 0.33) nên lỗi nằm ở rasterizer cũ của V12 trước mô hình
  preview gradient mới (đợt 14) — không thuộc phạm vi R1.
- **Phiên bản FFmpeg:** toàn bộ phép dịch gắn với FFmpeg 8.1.2 (§2.4).
- **Chưa đo:** footage thật (chỉ màu phẳng), 4K, clip dài, transition
  custom qua render worker end-to-end MP4 (harness đã đi qua cùng
  `buildXfadeFilter` nên filter là một, nhưng chưa có MP4 nguyên
  vẹn chứng minh riêng cho đợt này); type native còn lại ngoài
  wipeleft/slideright/fade/circleopen/circleclose/dissolve chưa đo
  lại trong đợt này (không đụng tới chúng, filter không đổi).

## 6. File đã đổi/thêm (đường dẫn tương đối repo)

KHÔNG push — parent gộp batch (theo nhiệm vụ, luồng này không tự tạo
file stage paths-loop riêng; danh sách dưới để parent gộp):

- `server/render/src/transitions.js` (SỬA — `buildXfadeFilter` dịch
  P→(1-P) cho custom + ghi chú; entry `circle-soft` đổi hệ số A/B +
  ghi chú; ghi chú đầu khối P5)
- `server/render/src/test_v13_hd_parity.js` (SỬA — ghép frame thống
  nhất 30 + round(p·12) cho mọi type; `--only` nhận đúng danh sách
  type yêu cầu kể cả ngoài V3/EXTRA; cập nhật header §2 + usage)
- `docs/PHASE9_ROUND14_R1_PDIRECTION_LIMITS.md` (MỚI — chính file này)

KHÔNG đổi: `apps/web/src/lib/transitionPreview.ts` và mọi file web
khác; không đụng file workflow, không binary.

## 7. Kiểm chứng đã chạy (số thật)

- Smoke: `buildXfadeFilter` cho cả 81 type OK; 23/23 custom: PI
  nguyên vẹn, không token P lạ; `node --check` sạch cho cả 2 file sửa.
- Probe B% trước sửa: 26 type (23 custom + 3 built-in đối chứng);
  probe B% sau sửa: 24 type; probe tâm/góc circle-soft + squareopen
  trước/sau; probe expr thăm dò loại H2 (mapping bình thường).
- V13 HD 1920x1080 `--extra`: 48 case, 48 KHỚP, 0 FAIL, 0 lỗi render
  (exit 0). V13 HD `--only blinds-h,grid`: 6 case, 3 KHỚP (blinds-h),
  3 FAIL (grid — nợ preview §3.3.1).
- V13 nhỏ 192x108 `--only` đủ 23 custom + wipeleft: 72 case, 55 KHỚP,
  8 XẤP XỈ, 9 FAIL (grid 3 + circle-soft 3 + bars-fade 3), 0 lỗi render.
- V13 192x104 `--only blinds-h,checker,plus,grid,bars-v`: 15 case,
  11 KHỚP, 1 XẤP XỈ (plus p=0.25), 3 FAIL (grid).
- Circle-soft soft-aware: 3/3 p, MAD 0.18–0.21, le8 100%.
- V11: 24 case, FAIL duy nhất transition dissolve (nợ cũ, §5).
- V12: 32 case, FAIL duy nhất transition circleopen (rasterizer V12
  cũ, §5).
- Raw log các lượt chạy nằm ở /tmp (r1_v13_hd.log, r1_v13_small.log,
  r1_v13_104.log, r1_v13_hd_bg.log, r1_v11.log, r1_v12.log,
  r1_before_curves.txt, r1_after_curves.txt) — không đưa vào batch
  stage theo quy định; mọi số cần thiết đã ghi trong LIMITS này.
