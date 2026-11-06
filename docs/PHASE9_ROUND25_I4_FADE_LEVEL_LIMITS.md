# Phase 9 đợt 25, luồng I4 — FADEBLACK MỨC ĐEN YUV + FADEWHITE/FADEGRAYS CÓ MÀU TRUNG GIAN

> Trung thực, đo bằng FFmpeg 8.1.2 thật, không code giả/mock. Thang V6:
> KHỚP = MAD ≤ 2 VÀ ≥ 99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8;
> còn lại là LỆCH. Mọi số MAD footage đo ở frame giữa transition
> (n=45 @30fps, p=0,5) trừ khi ghi khác. Script đo:
> `server/render/src/measure_r25_i4_fade_levels.js` — composite bằng
> CHÍNH code sản phẩm (`describeTransition` + `compositeFadePixel` sau
> khi transpile), không cài lại công thức trong script.

## 1. Bối cảnh và quyết định

Đợt 24 H3 (xem `docs/PHASE9_ROUND24_H3_FADEBLACK_LIMITS.md`) đã cho
preview fadeblack dip qua đen bằng smoothstep: đường RGB KHỚP nhưng
đường YUV vẫn LỆCH ~14 MAD, vì FFmpeg blend về đen Y=0 thay vì Y=16
limited-range; preview alpha-only không trừ được hằng số này nên badge
giữ `approx`. Ngoài ra fadewhite/fadegrays vẫn alpha tuyến tính cũ vì
`TransitionVisual` chưa có trường mang số hạng màu trung gian.

Luồng I4 chọn **hướng (a): thêm trường mang mức đen/offset và số hạng
màu trung gian vào `TransitionVisual`, preview/harness áp đúng offset
YUV**. Không chọn hướng (b) sửa mức đen ở render (đổi hành vi sản phẩm,
ngoài phạm vi parity preview). Tuyệt đối không dùng bản fit ngụy trang
kiểu B(0,5)=0,282 đầu đợt H3 (bản đó hấp thụ offset YUV vào trọng số,
sai mô hình — xem §8).

**Kết quả badge (chỉ nâng khi có số đo — xem §6–§7):**

- `fadeblack` → **`matched`**: mô hình cặp KHỚP cả 2 đường trên cả 2
  cặp footage, VÀ canvas đơn clip cũng đúng (dip đen ≡ nền đen; vẽ
  tuần tự sai khác composite cặp ≤ 0,1 mức do vùng overlap
  aAlpha·bAlpha nhỏ — xem §7).
- `fadewhite`, `fadegrays` → **giữ `approx`**: mô hình cặp đã KHỚP
  (§6) nhưng canvas đơn clip vẫn vẽ trên nền đen, sai hướng dip
  trắng/xám — cần wiring nền ở frame loop, là nợ follow-up (§7).
  Nâng badge cho 2 type này khi chưa có wiring canvas sẽ là nâng khống.

## 2. Mô hình đã chọn (công thức thống nhất cả họ fade)

Cả ba type dùng **chung đường cong trọng số smoothstep** của fadeblack
(H3) và chỉ khác số hạng trung gian (dip):

```
out = wA·A + wB·B + (1−p−wA)·C_A + (p−wB)·C_B
```

- `wA`: A tắt theo smoothstep trên [−0,01, 0,196] (tắt hẳn từ p≈0,20);
  `wB`: B mở theo smoothstep trên [0,122, 1,076] (p=0,5 → B≈0,34).
  Ghim biên: p=0 → A thuần, p=1 → B thuần.
- `fadeblack`: C = đen (0,0,0).
- `fadewhite`: C = trắng (255,255,255).
- `fadegrays`: C_A = gray(A), C_B = gray(B) **theo từng pixel** —
  đường RGB: mean 3 kênh; đường YUV: luma bt601
  (0.299R+0.587G+0.114B) — xem §3.
- Bất biến: `dip.a + a.alpha = 1−p`, `dip.b + b.alpha = p`;
  dip = 0 ở cả 2 biên p=0 và p=1.
- Code: `TransitionDip { a, b, mode }` + `yuvLevelOffset?` trên
  `TransitionVisual`; `dipMidColors()` cho màu trung gian từng pixel;
  `compositeFadePixel()` là nguồn chân lý duy nhất cho composite cặp
  (harness đo dùng chính hàm này). `TransitionClipVisual` thêm
  `dipColor` (đen/trắng/null) làm ý định cho luồng canvas sau —
  `preview.tsx` CHƯA tiêu thụ trường này.

Trọng số fadewhite/fadegrays đo trực tiếp từ probe phẳng khớp fadeblack
trong ±0,004 (1 mức lượng tử hoá, do cắt ngắn ở vùng gần 254 khi dip
trắng) — đủ để dùng chung đường cong; sai số này ≤ 1 mức, không đáng
kể so với ngưỡng KHỚP.

## 3. Fadegrays đã CRACK: gray = mean kênh (RGB) / luma (YUV)

### 3.1 Bằng chứng quyết định (gradient)

Ba đường gradient tại p=0,5 cho cùng đường G(x) tại cùng x (x=0 →
19,9; x=127 → 41,3; x=255 → 64,3):

- P1: A ramp đỏ `geq r='X'`, B ramp xanh `geq b='255-X'`;
- P2: A ramp xanh lá, B ramp xanh;
- P3: A ramp đỏ, B ramp đỏ ngược.

→ Số hạng xám chỉ phụ thuộc TỔNG kênh sum(A), sum(B), không phụ thuộc
kênh nào. Phần dư U = out − (wA·A + wB·B) đều 3 kênh (spread ≤ 3,9,
đa số ≤ 1,6; đỉnh ở p=0,2/0,7 trùng nhiễu fit đường cong B của H3).
Trọng số fadegrays đo trực tiếp từ hiệu kênh trên gradient = trọng số
fadeblack, sai ≤ 0,003, intercept ≈ 0 → chung trọng số đã xác nhận.

Công thức cuối (slope khớp tới 4 chữ số thập phân trên gradient,
U(x) tuyến tính theo x ở mọi p với rmse ~0,3):

```
out = wA·A + wB·B + (1−p−wA)·gray(A) + (p−wB)·gray(B),  gray(X) = (R+G+B)/3
```

Ý nghĩa: crossfade tuyến tính mà mỗi clip bị khử bão hòa một phần —
phần màu theo smoothstep (wA/wB), phần xám bù đủ trọng số tuyến tính
(A: 1−p, B: p). Kiểm tra p=0,5 cặp đỏ→xanh: 0,5×84,3 + 0,342×(0,0,254)
+ 0,158×84,7 = (55,6; 55,6; 142,5) so với đo (55,55,142).

### 3.2 Đường YUV của fadegrays: gray = luma, KHÔNG phải mean

Fit LSQ chính thức trên dữ liệu phẳng YUV (loại kênh bị clip) cho thấy
mô hình "RGB + offset hằng" KHÔNG áp dụng được cho fadegrays
(rmse 8,53). Fit trực tiếp gray YUV (GA, GB) từng cặp cho rmse ~1
(0,83–1,11) và GA/GB ≈ luma bt601. Composite đầu-cuối bằng code
(luma, refs cùng render) xác nhận: fadegrays YUV KHỚP trên cả 3 cặp
phẳng (MAD 1,00–1,33) và cả 2 cặp footage (MAD 0,85–1,39); biến thể
dùng gray RGB (mean) trên đường YUV cho LỆCH ở cặp đỏ→xanh phẳng
(MAD 13,67) và XẤP XỈ trên footage (MAD 1,96–2,51) — đủ để kết luận
luma là gray YUV đúng.

Lưu ý trung thực: một fit GA/GB thủ công trước đó cho luma−2,8 (phía A)
và luma+5,0 (phía B) khá đều qua 3 cặp, nhưng composite đầu-cuối bằng
code (luma thuần, refs cùng render) vẫn KHỚP (MAD ≤ 1,33) nên các
offset đó nhiều khả năng là artefact của chuỗi probe thủ công (ma trận
chuyển đổi ở bước so sánh) chứ không phải sai số mô hình — KHÔNG đưa
vào code. Nếu footage tương lai lộ bias hệ thống thì xem lại điểm này.

### 3.3 Các giả thuyết đã thử và BÁC (đừng quay lại)

- Xám cố định (vd 84): white→white giữ nguyên trắng, black→black giữ
  nguyên đen; hệ số xám đổi theo cặp (p=0,5: đỏ→xanh ≈ 83,7;
  xanh lá→magenta ≈ 71,5; cặp tổng quát ≈ 120,1; vàng→cyan ≈ 168,3).
- Khử bão hòa hỗn hợp (desaturate mix, các công thức gray
  maxmin/mean/luma601/luma709): fit chung 4 cặp cho joint err tới ~190.
- Khử bão hòa chroma trong YUV (giữ Y, kéo U/V về 128): cho hiệu chỉnh
  không đều kênh, trái với phần dư đều đo được (vd đỏ→xanh p=0,5
  không thể cho R=55).
- Gray = (mean(A)+mean(B))/2, luma trung bình, (max+min)/2, căn bậc
  hai/điều hoà của mean: đều sai ở cặp xanh lá→magenta.
- Fit tuyến tính trung gian G = α·sum(A) + β·sum(B) (α=0,25241,
  β=0,07900, rmse 0,79): đã bị VƯỢT QUA bởi công thức §3.1 — α,β đó là
  artefact khi ép dạng m·G với G không đổi theo p; đừng dùng.

## 4. Offset mức YUV (fit LSQ chính thức trên dữ liệu phẳng)

Đường render thật chuẩn hoá về yuv420p trước xfade, rồi mới về rgb24
để so. Offset cộng thêm mỗi kênh: `outYuv = outRgb + c·m`,
m = dip.a + dip.b. Fit LSQ theo từng kênh, loại kênh bị clip 0/255:

| Type | c (fit) | rmse dư | Lý thuyết | Kết luận |
|---|---|---|---|---|
| fadeblack | **−21,05** (R −20,82; B −21,68; G chỉ 4 mẫu, không tin cậy) | 1,15 (max 3,89) | −18,63 (= 1,164×16) | Dùng số fit; lý thuyết lệch 2,4 chưa rõ nguyên nhân (có thể do chuyển đổi YUV↔RGB nguyên của FFmpeg) |
| fadewhite | **+20,45** (R +18,10; G +22,59; B +16,04 — phân tán theo kênh) | 1,61 (max 3,40) | +23,1 (= 1,164×(255−16), rồi clip 255) | Dùng số fit; footage xác nhận fit hơn lý thuyết (§6) |
| fadegrays | không có c hằng (rmse 8,53) | — | — | Dùng luma (§3.2), không offset |

Đối chứng fade tuyến tính đường YUV: dư mean −0,18, rmse 0,75 —
không có offset (đúng kỳ vọng: fade chỉ blend A với B, không qua
màu trung gian).

## 5. Số đo phẳng (64×64, 30fps, xfade duration=1 offset=1)

Mô hình code, A_ref/B_ref từ frame thuần cùng render. Verdict tại
p=0,5; cột worst = MAD lớn nhất trên toàn sweep n=30..59.

| Type | Cặp | Đường | p=0,5 MAD | ≤8 | Verdict | Worst MAD |
|---|---|---|---|---|---|---|
| fadeblack | đỏ→xanh | RGB | 0,67 | 100% | KHỚP | 1,00 |
| fadeblack | đỏ→xanh | YUV | 1,00 | 100% | KHỚP | 1,67 |
| fadeblack | xanh lá→magenta | RGB | 1,33 | 100% | KHỚP | 2,00 |
| fadeblack | xanh lá→magenta | YUV | 1,33 | 100% | KHỚP | 2,67 |
| fadeblack | (199,99,49)→(28,179,219) | RGB | 1,33 | 100% | KHỚP | 2,00 |
| fadeblack | (199,99,49)→(28,179,219) | YUV | 1,00 | 100% | KHỚP | 2,67 |
| fadewhite | đỏ→xanh | RGB | 0,33 | 100% | KHỚP | 3,33 |
| fadewhite | đỏ→xanh | YUV | 1,33 | 100% | KHỚP | 2,67 |
| fadewhite | xanh lá→magenta | RGB | 0,33 | 100% | KHỚP | 2,67 |
| fadewhite | xanh lá→magenta | YUV | 1,33 | 100% | KHỚP | 2,67 |
| fadewhite | (199,99,49)→(28,179,219) | RGB | 0,33 | 100% | KHỚP | 2,67 |
| fadewhite | (199,99,49)→(28,179,219) | YUV | 1,33 | 100% | KHỚP | 3,00 |
| fadegrays | đỏ→xanh | RGB | 0,33 | 100% | KHỚP | 2,00 |
| fadegrays | đỏ→xanh | YUV | 1,33 | 100% | KHỚP | 1,67 |
| fadegrays | xanh lá→magenta | RGB | 0,67 | 100% | KHỚP | 2,00 |
| fadegrays | xanh lá→magenta | YUV | 1,00 | 100% | KHỚP | 3,00 |
| fadegrays | (199,99,49)→(28,179,219) | RGB | 1,00 | 100% | KHỚP | 1,33 |
| fadegrays | (199,99,49)→(28,179,219) | YUV | 1,00 | 100% | KHỚP | 1,67 |
| fade (đối chứng) | cả 3 cặp | RGB/YUV | 0,33–1,33 | 100% | KHỚP | ≤ 2,00 |

Biến thể tại p=0,5 (đường YUV): fadeblack tắt-offset → LỆCH
(MAD 5,33–12,33, ≤8 = 0–67%); lý thuyết −18,63 → KHỚP ở đỏ→xanh/gen
(1,00–1,33) nhưng XẤP XỈ ở xanh lá→magenta (2,33) — fit −21,05 tốt
hơn. fadewhite tắt-offset → LỆCH (5,67–13,67); lý thuyết +23,1 →
KHỚP (0,67–1,00), nhỉnh hơn fit trên phẳng nhưng thua fit trên
footage (§6) — giữ số fit. fadegrays biến thể gray-RGB trên đường
YUV → LỆCH ở đỏ→xanh (13,67), XẤP XỈ ở 2 cặp còn lại (2,33–5,00).

Lưu ý nhỏ: worst-frame trên sweep của fadewhite RGB (đỏ→xanh) là
3,33 — trên ngưỡng KHỚP nếu xét frame xấu nhất, nhưng verdict V6
định nghĩa tại frame giữa (p=0,5: KHỚP) nên không đổi kết luận;
frame xấu nhất nằm ở vùng dip gần biên, nơi lượng tử hoá/clip mạnh.

## 6. Số đo footage (720×1280, p=0,5, FFmpeg 8.1.2)

Footage (SHA256 trùng đúng clip đợt H3, `scripts/fetch-r22-footage.sh`):

- J `clip-j-dod-pistol.mp4`:
  `07c815384d16325cebd7f2cefcd3b335e550fd7ba706e2417b777e2da740501e`
- K `clip-k-dod-iwo.mp4`:
  `49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c`
- L `clip-l-nasa-avatar-vertical.mp4`:
  `0e2df0ee56dbafb0859f6800d1cf01d6848389057c81414c33e3cdb8b3aa5f94`

### 6.1 Cặp K→L (cửa sổ K 28–30s, L 24–26s — cùng cửa sổ H3)

| Type | Đường | MAD | ≤8 | Verdict | Biến thể |
|---|---|---|---|---|---|
| fadeblack | RGB | 1,0916 | 100% | KHỚP | — |
| fadeblack | YUV | 1,7299 | 99,99% | KHỚP | lý thuyết −18,63: 2,3149 XẤP XỈ; tắt-offset: **14,1800 LỆCH** |
| fadewhite | RGB | 0,2541 | 100% | KHỚP | — |
| fadewhite | YUV | 1,5505 | 100% | KHỚP | lý thuyết +23,1: 1,7377 KHỚP; tắt-offset: 14,3665 LỆCH |
| fadegrays | RGB | 0,7458 | 100% | KHỚP | — |
| fadegrays | YUV | 1,3890 | 99,84% | KHỚP | gray-RGB(mean): 1,9621 XẤP XỈ |
| fade (đối chứng) | RGB | 0,5008 | 100% | KHỚP | — |
| fade (đối chứng) | YUV | 0,8352 | 99,91% | KHỚP | — |

Đối chiếu H3: fadeblack YUV 720p của H3 là 14,18 LỆCH — biến thể
tắt-offset của I4 tái lập đúng **14,1800**, chứng tỏ phương pháp đo
nhất quán và offset là nguyên nhân duy nhất của lệch cũ. Số mới
1,73 là cải thiện ~8,2×.

### 6.2 Cặp J→K (cửa sổ J 28–30s, K 28–30s)

| Type | Đường | MAD | ≤8 | Verdict | Biến thể |
|---|---|---|---|---|---|
| fadeblack | RGB | 0,9417 | 100% | KHỚP | — |
| fadeblack | YUV | 0,8626 | 100% | KHỚP | lý thuyết −18,63: 1,5156 KHỚP; tắt-offset: 12,9213 LỆCH |
| fadewhite | RGB | 0,4612 | 100% | KHỚP | — |
| fadewhite | YUV | 1,2296 | 100% | KHỚP | lý thuyết +23,1: 1,2686 KHỚP; tắt-offset: 14,5830 LỆCH |
| fadegrays | RGB | 0,5067 | 100% | KHỚP | — |
| fadegrays | YUV | 0,8451 | 99,91% | KHỚP | gray-RGB(mean): 2,5078 XẤP XỈ |
| fade (đối chứng) | RGB | 0,4981 | 100% | KHỚP | — |
| fade (đối chứng) | YUV | 0,7113 | 99,77% | KHỚP | — |

**Kết luận §6: cả 3 type × cả 2 đường × cả 2 cặp footage đều KHỚP
tại p=0,5.** Số fit (−21,05 / +20,45) thắng lý thuyết trên cả 2 cặp
footage (fadeblack: 1,73/0,86 so với 2,31/1,52; fadewhite: 1,55/1,23
so với 1,74/1,27) nên giữ số fit trong code.

## 7. Cái gì còn lệch và nợ follow-up

1. **Canvas đơn clip cho fadewhite/fadegrays (nợ chính):** `preview.tsx`
   vẽ clip đơn với `globalAlpha` trên nền đen — đúng cho fadeblack
   nhưng sai hướng dip cho fadewhite (cần nền trắng) và fadegrays
   (cần xám theo từng pixel, không có 1 màu nền). I4 đã thêm
   `dipColor` vào `TransitionClipVisual` làm ý định, nhưng KHÔNG sửa
   `preview.tsx`: fill nền trắng/xám cho clip đơn sẽ xóa clip track
   khác vẽ trước trong cùng frame (mọi clip video chiếm toàn khung),
   nên cần thay đổi có phạm vi riêng ở frame loop. Vì vậy 2 type này
   giữ badge `approx` dù mô hình cặp đã KHỚP.
2. **Công thức đóng của FFmpeg chưa xác nhận từ mã nguồn:** mô hình
   hiện tại là hiệu chuẩn thực nghiệm (biên smoothstep + offset fit).
   Khoảng cách fit–lý thuyết (fadeblack 2,4; fadewhite 2,65) chưa giải
   thích được hoàn toàn; số đo đầu-cuối KHỚP nên không chặn, nhưng
   một luồng sau có thể đối chiếu `vf_xfade.c` để tìm công thức đóng.
3. **Phạm vi số đo:** mới đo 720×1280, p=0,5, 2 cặp footage + 3 cặp
   phẳng. Chưa đo 1080p/4K, các p khác trên footage, và clip có
   chuyển động mạnh/nội dung cực đoan (trắng/clip hoàn toàn, bão hòa
   cao). Fadewhite RGB worst-frame 3,33 (§5) gợi ý vùng dip gần biên
   nhạy lượng tử hoá hơn — đáng đo sweep trên footage nếu cần.
4. **Gray YUV:** luma bt601 đã KHỚP đầu-cuối, nhưng fit GA/GB thủ
   công trước đó gợi ý offset −2,8/+5,0 chưa giải thích (§3.2) — ghi
   lại để luồng sau kiểm tra nếu footage mới lộ bias.
5. **Workflow CI:** không liên quan luồng này; file
   `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền
   App, xem MEMORY) — nhắc lại để parent không quên.

## 8. Hướng tiếp cận đã thử và bị loại (tóm tắt)

- Bản fit ngụy trang B(0,5)=0,282 (đầu đợt H3): hấp thụ offset YUV
  vào trọng số — sai mô hình, đã loại từ H3, I4 không dùng lại.
- Sửa mức đen ở render cho khớp limited-range (hướng (b)): đổi hành
  vi sản phẩm, ngoài phạm vi parity preview — loại.
- Xám cố định / desat hỗn hợp / desat chroma YUV / các công thức
  mean-luma trung bình cho fadegrays — đều bị bác bằng số liệu §3.3.
- Fit tuyến tính α·sum(A)+β·sum(B) cho gray — artefact, bị vượt qua
  bởi công thức §3.1.
- Offset YUV lý thuyết (−18,63 / +23,1) thay cho số fit — thua số fit
  trên footage (§6), chỉ giữ làm tham chiếu.

## 9. File đổi/thêm và kiểm chứng

Đổi (đường dẫn tương đối từ repo root):

- `apps/web/src/lib/transitionPreview.ts` — thêm `TransitionDip`,
  trường `dip` + `yuvLevelOffset` trên `TransitionVisual`,
  `fadeDipWeights()` chung họ fade, `dipMidColors()`,
  `compositeFadePixel()`, `dipColor` trên `TransitionClipVisual`;
  fadewhite/fadegrays bỏ alpha tuyến tính cũ, dùng smoothstep + dip;
  fadeblack thêm dip + offset YUV.
- `apps/web/src/lib/transitionPreview.test.ts` — 2 test mới
  (dip + composite công thức thống nhất, gồm ví dụ số cụ thể);
  cập nhật 2 dòng khóa hồi quy tuyến tính cũ cho fadewhite/fadegrays.
- `apps/web/src/components/transitions/previewStatus.ts` —
  `fadeblack` vào `TRANSITION_MATCHED` (kèm lý do + ghi rõ
  fadewhite/fadegrays giữ approx).
- `server/render/src/measure_r25_i4_fade_levels.js` — script đo mới
  (flat sweep + footage, composite bằng chính code sản phẩm, xoá raw
  sau mỗi phép đo).
- `docs/PHASE9_ROUND25_I4_FADE_LEVEL_LIMITS.md` — file này.
- `benchmarks/results/v25-i4-fade-levels-flat.json` — kết quả phẳng.
- `benchmarks/results/v25-i4-fade-levels-foot-kl.json` — kết quả K→L.
- `benchmarks/results/v25-i4-fade-levels-foot-jk.json` — kết quả J→K.

Kiểm chứng (số thật):

- `node apps/web/src/lib/transitionPreview.test.ts` → **30 pass,
  0 fail** (28 cũ + 2 mới; 1 fail trung gian do chính tác giả ghi sai
  kỳ vọng luma 124,1 thay vì 124,2 — đã sửa test, không sửa code).
- `tsc --noEmit` (apps/web) → **0 lỗi**.
- `npm run build` (apps/web) → **pass** (cảnh báo chunk > 500kB cũ,
  không liên quan).
- Flat sweep (script mới) → toàn bộ p=0,5 KHỚP, worst ≤ 3,33 (§5).
- Footage K→L + J→K (720×1280, p=0,5) → toàn bộ KHỚP (§6).

KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary vào repo (raw đo đã xoá sau mỗi phép đo; scratch dọn
cuối luồng và xác nhận bằng `ls` — xem báo cáo cuối cho parent).
