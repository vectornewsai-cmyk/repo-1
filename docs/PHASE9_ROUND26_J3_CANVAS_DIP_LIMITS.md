# Phase 9 đợt 26, luồng J3 — WIRING DIP CANVAS CHO FADEWHITE/FADEGRAYS

> Trung thực, đo bằng FFmpeg 8.1.2 thật, không code giả/mock. Thang V6:
> KHỚP = MAD ≤ 2 VÀ ≥ 99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8;
> còn lại là LỆCH. Script đo:
> `server/render/src/measure_r26_j3_canvas_dip.js` — model đơn clip dùng
> CHÍNH code sản phẩm (`describeTransition` + `singleClipDipPixel` sau
> khi transpile), tham chiếu wiring dùng FFmpeg độc lập (geq + overlay),
> pair dùng xfade FFmpeg thật. Mọi số MAD footage đo ở 720×1280, cửa sổ
> như I4 (K 28–30s, L 24–26s, J 28–30s), trừ khi ghi khác.

## 1. Bối cảnh và quyết định

Đợt 25 I4 đã crack mô hình cặp cho họ fade (dip + offset YUV) và nâng
fadeblack lên matched, nhưng fadewhite/fadegrays giữ badge approx vì
canvas đơn clip trong `preview.tsx` vẽ clip với `globalAlpha` trên nền
đen — đúng cho fadeblack (dip đen ≡ nền đen) nhưng sai hướng dip cho
fadewhite (cần nền trắng) và fadegrays (cần xám theo từng pixel). I4 đã
thêm `dipColor` vào `TransitionClipVisual` làm ý định nhưng
`preview.tsx` CHƯA tiêu thụ, kèm cảnh báo: fill nền trắng/xám cho clip
đơn sẽ xóa clip track khác vẽ trước trong cùng frame.

Luồng J3 đóng nợ đó bằng **wiring có phạm vi pixel** (không fill toàn
khung), và nâng badge cho cả 2 type theo **chuẩn badge đã có của dự án**
(xem §7 — đọc kỹ trước khi tranh luận về badge, vì gap cặp vẫn lớn).

## 2. Thiết kế wiring (preview.tsx, chỉ sửa phẫu thuật vùng transition/dip)

`drawVideoClipWithTransition` mở nhánh mới khi clip KHÔNG có hình học
và `dipMode` là `"white"`/`"gray"` (fadeblack giữ đường alpha cũ;
`drawVideoClip` của các luồng khác KHÔNG bị đụng):

1. Vẽ clip lên canvas offscreen W×H với **bản sao clip đã strip
   transition** (`transitionIn/Out = undefined`) để `drawVideoClip` vẽ
   ở alpha đầy đủ — mọi hiệu ứng/mask/SR/track của clip giữ nguyên vì
   bản sao chỉ khác 2 trường transition. Nhờ đó cả vùng dip ở
   `alpha = 0` (clip ra p ≥ 0,20, clip vào p ≤ 0,12) vẫn có pixel để
   tính xám — vẽ trực tiếp với `tv.alpha` thì offscreen rỗng ở đó.
2. Composite từng pixel bằng **chính hàm thuần mới**
   `singleClipDipPixel(clip, alpha, mode)` trong `transitionPreview.ts`
   (có unit test, harness đo cũng dùng chính hàm này):
   `out = alpha·clip + (1−alpha)·dip`, dip = 255 (white) hoặc mean 3
   kênh của chính pixel đó (gray, đường RGB của canvas).
3. **Phạm vi riêng, trả lời cảnh báo I4:** pixel nào offscreen có
   alpha = 0 (clip không vẽ tới: viền letterbox, góc xoay SR, vùng
   mask/chroma trong suốt) thì BỎ QUA — dip không bao giờ vẽ ra ngoài
   vùng clip đã chiếm, nên track dưới và nền đen khung vẫn hiện ở đó.
   Pixel đã vẽ giữ nguyên alpha (coverage từ opacity/mask), chỉ đổi
   màu thẳng; khi đưa offscreen lên ctx chính bằng source-over, phần
   (1−coverage) vẫn cho thấy nội dung bên dưới — đúng ngữ nghĩa
   opacity/mask cũ, chỉ thêm dip.
4. `TransitionClipVisual` thêm `dipMode` (`"black"|"white"|"gray"|null`,
   lấy từ `vis.dip.mode`; cả 2 cửa sổ cùng active thì lấy theo cửa sổ
   vào, alpha là tích 2 lớp — xấp xỉ đã ghi, xem §8). `dipColor` giữ
   nguyên để tương thích.
5. Fallback về đường vẽ thường khi: thiếu media (tránh nhuộm màu
   placeholder "Thiếu media"), `alpha >= 1` (trọng số dip = 0), hoặc
   không lấy được offscreen context.

## 3. Công thức và quan hệ với composite cặp (đọc để hiểu số §4–§6)

Đơn clip (canvas): `single = α·clip + (1−α)·dip(clip)`, α = lớp của
clip đó (`a.alpha` khi ra, `b.alpha` khi vào). Cặp (I4):
`pair = aAlpha·A + bAlpha·B + dipA·midA + dipB·midB`. Suy ra gap
đơn-clip-vs-cặp cùng p (kiểm chứng bằng số §4–§6, không phải phỏng
đoán):

- fadewhite vào: `pair − single = aAlpha·(A − trắng)`. aAlpha = 0 với
  p ≥ ~0,20 nên **vào KHỚP đúng** từ p ≈ 0,27 trở đi; p = 0,1 thì
  aAlpha ≈ 0,45 nên lệch lớn (pair lúc đó còn chủ yếu là A).
- fadewhite ra: `pair − single = bAlpha·(B − trắng)`. bAlpha = 0 với
  p ≤ 0,12 nên ra KHỚP ở p = 0,1; sau đó lệch tăng theo bAlpha
  (p = 0,5: bAlpha ≈ 0,347).
- fadegrays: thêm số hạng `dipA·(grayA − grayB)` (vào) /
  `dipB·(grayB − grayA)` (ra) vì đơn clip chỉ biết xám của chính nó.
  Cặp phẳng đỏ→xanh có gray(A) ≈ gray(B) ≈ 85 nên vào KHỚP; cặp
  xanh lá→magenta (85 vs 170) lệch đúng `dipA×85 ≈ 42,5` (khóa bằng
  unit test); footage lệch theo `mean|grayA − grayB|` từng pixel.
- Đường YUV: canvas là RGB nên không mang offset mức của I4
  (fadewhite +20,45×m). Gap vào trên đường YUV tái lập ĐÚNG số biến
  thể tắt-offset của I4 (14,3665 K→L; 14,5830 J→K) — đối chứng pipeline
  đo nhất quán, không phải lỗi wiring mới.

## 4. Số đo phẳng (64×64, 30fps, xfade duration=1 offset=1)

Ba giao thức riêng (đừng gộp): (B) wiring = model đơn clip vs tham
chiếu FFmpeg độc lập (nền dip geq + overlay alpha nguyên);
(A) gap = model đơn clip vs pair xfade; (O) cũ = nền đen trước J3 vs
pair xfade. Sweep cặp đỏ→xanh dùng p đúng lưới frame
(0,1 / 0,2667 / 0,5 / 0,7333 — p = 0,25/0,75 lệch lưới gây sai số giả
3–6 MAD, đã sửa script và đo lại; bài học ghi ở §8).

### 4.1 Giao thức (B): wiring KHỚP 24/24 ô phẳng

| Type | Cặp | Cửa sổ | p | MAD | ≤8 | Verdict |
|---|---|---|---|---|---|---|
| fadewhite | đỏ→xanh | ra | 0,1 / 0,2667 / 0,5 / 0,7333 | 1,00 / 0 / 0 / 0 | 100% | KHỚP |
| fadewhite | đỏ→xanh | vào | 0,1 / 0,2667 / 0,5 / 0,7333 | 0 / 0,33 / 1,96 / 1,67 | 100% | KHỚP |
| fadegrays | đỏ→xanh | ra | 0,1 / 0,2667 / 0,5 / 0,7333 | 1,00 / 1,00 / 1,00 / 1,00 | 100% | KHỚP |
| fadegrays | đỏ→xanh | vào | 0,1 / 0,2667 / 0,5 / 0,7333 | 2,00 / 1,33 / 0,96 / 0,67 | 100% | KHỚP |
| fadewhite | xanh lá→magenta | ra/vào | 0,5 | 0 / 1,99 | 100% | KHỚP |
| fadegrays | xanh lá→magenta | ra/vào | 0,5 | 1,00 / 1,32 | 100% | KHỚP |
| fadewhite | (199,99,49)→(28,179,219) | ra/vào | 0,5 | 0 / 0,67 | 100% | KHỚP |
| fadegrays | (199,99,49)→(28,179,219) | ra/vào | 0,5 | 1,00 / 1,33 | 100% | KHỚP |

Hai ô sát ngưỡng (fadegrays vào p = 0,1: 2,00; fadewhite vào p = 0,5:
1,96) là **nhiễu của pipeline tham chiếu, không phải lỗi wiring** —
chứng minh bằng probe trực tiếp (§5): geq cắt ngắn mean 84,67 → 84;
overlay alpha-0 trả 83 thay vì 84 (`>>8` thay vì `/255`); overlay
trắng+xanh cho (166,164,254) thay vì (167,167,255) đúng (roundtrip
YUV nội bộ của overlay). Model của code là giá trị làm tròn đúng;
tham chiếu FFmpeg tự mất ~2 mức. Verdict vẫn KHỚP nhưng biên mỏng —
ghi rõ để không ai tưởng wiring "vừa đủ" một cách bí ẩn.

### 4.2 Giao thức (A): gap đơn-clip-vs-cặp (giới hạn kiến trúc)

p = 0,5, đường RGB:

| Type | Cặp | Ra MAD / ≤8 | Vào MAD / ≤8 |
|---|---|---|---|
| fadewhite | đỏ→xanh | 59,00 / 33,33% LỆCH | 0,33 / 100% KHỚP |
| fadewhite | xanh lá→magenta | 30,00 / 66,67% LỆCH | 0,33 / 100% KHỚP |
| fadewhite | (199,99,49)→(28,179,219) | 39,33 / 0% LỆCH | 0,33 / 100% KHỚP |
| fadegrays | đỏ→xanh | 38,67 / 0% LỆCH | 0,33 / 100% KHỚP |
| fadegrays | xanh lá→magenta | 63,00 / 33,33% LỆCH | 63,67 / 0% LỆCH |
| fadegrays | (199,99,49)→(28,179,219) | 30,00 / 0% LỆCH | 14,00 / 0% LỆCH |

Sweep đỏ→xanh (RGB) đúng §3: ra KHỚP ở p = 0,1 (0,67 cả 2 type),
vào KHỚP ở p = 0,2667 (fadewhite 1,67; fadegrays 0,67) và p = 0,5;
vào p = 0,1 LỆCH lớn (fadewhite 77,67; fadegrays 51,00) vì pair còn
là A; vào p = 0,7333: fadewhite 2,67 XẤP XỈ (≤8 = 100%) — đó là dư số
hiệu chuẩn mô hình cặp của I4 tại p đó (đơn clip ≡ mô hình cặp đúng
khi aAlpha = 0; I4 §5 đã ghi worst-frame 3,33 cùng họ), không phải
lỗi wiring; fadegrays vào p = 0,7333 KHỚP 2,00.

### 4.3 Giao thức (O): trước/sau (nền đen cũ vs wired, p = 0,5, RGB)

fadewhite: cũ 166–243 → wired 0,33–59 (vào KHỚP, ra còn LỆCH nhưng
giảm 3–4×). fadegrays: cũ 46–127 → wired 0,33–64 — cải thiện ở 5/6 ô;
**ngoại lệ: fadegrays vào xanh lá→magenta: cũ 46,33 → wired 63,67**
(cả hai LỆCH): khi gray(A) ≠ gray(B) mạnh, dip xám(B) thay đen tình
cờ xa pair hơn — cơ chế như §6, không phải hồi quy wiring (B của ô
đó vẫn KHỚP 1,32). Wiring là projection đúng mô hình, không phải
tối ưu MAD-vs-cặp từng ô.

## 5. Nhiễu pipeline tham chiếu (probe trực tiếp, không qua code sản phẩm)

- `color=blue` rgb24 cho (0,0,254) (quirk 254-vs-255 đã biết).
- geq mean của (0,0,254): 84,67 → **84** (cắt ngắn, không làm tròn).
- overlay nền xám 84 + top alpha 0 → **83** (chia `>>8`).
- overlay trắng + xanh alpha 88 → (166,164,254) thay vì
  (167,167,255) đúng — R/G lệch khác nhau, dấu hiệu roundtrip YUV
  nội bộ của overlay (cùng họ offset mức của I4).
- Kết luận: sàn nhiễu của tham chiếu (B) ≈ 2 mức; các ô (B) ở
  1,96–2,00 là ở sàn này. Nếu luồng sau cần biên dày hơn, phải đổi
  tham chiếu (ví dụ overlay bằng số học nguyên thuần trong script
  thay vì filter overlay) — không sửa model cho khớp tham chiếu
  nhiễu, vì model đã là giá trị làm tròn đúng.

## 6. Số đo footage (720×1280, p = 0,5 và 0,1)

Footage (SHA256 khớp đúng clip đợt I4, `scripts/fetch-r22-footage.sh`):

- J `clip-j-dod-pistol.mp4`:
  `07c815384d16325cebd7f2cefcd3b335e550fd7ba706e2417b777e2da740501e`
- K `clip-k-dod-iwo.mp4`:
  `49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c`
- L `clip-l-nasa-avatar-vertical.mp4`:
  `0e2df0ee56dbafb0859f6800d1cf01d6848389057c81414c33e3cdb8b3aa5f94`

### 6.1 Giao thức (B): wiring KHỚP 16/16 ô footage

| Cặp | Type | Cửa sổ | p | MAD | ≤8 | Verdict |
|---|---|---|---|---|---|---|
| K→L | fadewhite | ra/vào | 0,5 | 0 / 1,02 | 100% | KHỚP |
| K→L | fadewhite | ra/vào | 0,1 | 0,63 / 0 | 100% | KHỚP |
| K→L | fadegrays | ra/vào | 0,5 | 0,91 / 1,40 | 100% | KHỚP |
| K→L | fadegrays | ra/vào | 0,1 | 0,67 / 0,82 | 100% | KHỚP |
| J→K | fadewhite | ra/vào | 0,5 | 0 / 0,51 | 100% | KHỚP |
| J→K | fadewhite | ra/vào | 0,1 | 1,57 / 0 | 99,91% / 100% | KHỚP |
| J→K | fadegrays | ra/vào | 0,5 | 0,82 / 0,68 | 100% | KHỚP |
| J→K | fadegrays | ra/vào | 0,1 | 1,72 / 0,63 | 99,91% / 100% | KHỚP |

Hai ô 99,91% (không phải 100%) là vài pixel cực đoan vượt 8 do
roundtrip overlay (§5) — vẫn KHỚP theo ngưỡng (≥ 99%).

### 6.2 Giao thức (A): gap đơn-clip-vs-cặp trên footage

| Cặp | Type | Cửa sổ | p | Đường | MAD | ≤8 | Verdict | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| K→L | fadewhite | ra | 0,5 | rgb | 46,14 | 0,82% | LỆCH | cũ 208,86 → giảm 4,5× |
| K→L | fadewhite | vào | 0,5 | rgb | 0,25 | 100% | KHỚP | = đúng số mô hình cặp I4 |
| K→L | fadewhite | ra/vào | 0,5 | yuv | 31,63 / 14,37 | 11,18% / 0,91% | LỆCH | vào = số tắt-offset I4 |
| K→L | fadewhite | ra/vào | 0,1 | rgb | 1,17 / 69,89 | 100% / 0,16% | KHỚP / LỆCH | đúng §3 |
| K→L | fadegrays | ra | 0,5 | rgb | 51,13 | 3,23% | LỆCH | cũ 74,63 → cải thiện |
| K→L | fadegrays | vào | 0,5 | rgb | 52,17 | 1,46% | LỆCH | **cũ 32,52 → wired tệ hơn (xem dưới)** |
| K→L | fadegrays | ra/vào | 0,5 | yuv | 51,86 / 51,46 | 3,82% / 1,45% | LỆCH | |
| K→L | fadegrays | ra/vào | 0,1 | rgb | 8,48 / 77,46 | 48,27% / 2,31% | LỆCH | ra = 0,1×mean\|grayA−grayB\| |
| J→K | fadewhite | ra | 0,5 | rgb | 50,25 | 0,17% | LỆCH | cũ 204,75 → giảm 4× |
| J→K | fadewhite | vào | 0,5 | rgb | 0,46 | 100% | KHỚP | = đúng số mô hình cặp I4 |
| J→K | fadewhite | ra/vào | 0,5 | yuv | 35,54 / 14,58 | 39,80% / 0,18% | LỆCH | vào = số tắt-offset I4 |
| J→K | fadewhite | ra/vào | 0,1 | rgb | 1,24 / 53,92 | 100% / 1,54% | KHỚP / LỆCH | đúng §3 |
| J→K | fadegrays | ra | 0,5 | rgb | 41,97 | 12,64% | LỆCH | cũ 123,05 → cải thiện lớn |
| J→K | fadegrays | vào | 0,5 | rgb | 41,93 | 12,58% | LỆCH | cũ 85,23 → cải thiện |
| J→K | fadegrays | ra/vào | 0,5 | yuv | 40,34 / 43,39 | 12,67% / 12,83% | LỆCH | |
| J→K | fadegrays | ra/vào | 0,1 | rgb | 8,46 / 75,82 | 58,29% / 6,07% | LỆCH | |

**Trường hợp wired thua cũ (trung thực, không giấu):** fadegrays vào
K→L p = 0,5: wired 52,17 vs cũ 32,52 (cả hai LỆCH). Cơ chế: gap wired
= 0,5×mean\|grayA − grayB\| (cặp này gray 2 clip lệch mạnh từng
pixel), còn gap cũ = mean(0,5·grayA + 0,153·grayB) tình cờ nhỏ hơn
do cộng dồn số dương thay vì hiệu. Đen không phải là mô hình dip —
nó chỉ tình cờ gần pair hơn ở ô này; wiring vẫn là projection đúng
(§3) và (B) vẫn KHỚP. Tương tự ở phẳng: fadegrays vào xanh
lá→magenta (cũ 46,33 → wired 63,67). Ngược lại, J→K fadegrays vào
wired thắng lớn (85,23 → 41,93) — hướng cải thiện phụ thuộc thống kê
xám của cặp, không đơn điệu.

## 7. Quyết định badge (và chuẩn nào được áp)

`fadewhite` + `fadegrays` lên `TRANSITION_MATCHED` trong
`previewStatus.ts`, theo **chuẩn badge đã có của dự án** (xem chú thích
đầu file đó): nhãn matched = mô hình composite vs render xfade KHỚP
(I4: fadewhite/fadegrays RGB MAD 0,25–1,55, YUV KHỚP) + canvas vẽ đúng
projection đơn clip của mô hình đó qua hàm chung (ở đây:
`singleClipDipPixel`, (B) KHỚP 40/40 ô). Tiền lệ trực tiếp: bars-fade
đã matched dù canvas đơn clip "không vẽ được crossfade thật vì chỉ
có 1 clip tại 1 thời điểm", và mọi type matched đều mang giới hạn
chung "preview vẽ từng clip riêng lẻ trên nền đen, khác crossfade 2
clip của render". Gap cặp ở §4.2/§6.2 là chính giới hạn chung đó, chỉ
lớn hơn về độ lớn vì dip phủ toàn khung (không như wipe chỉ lệch
vùng của lớp còn lại) — đã ghi số đầy đủ, không giấu sau nhãn.

**Nếu parent muốn chuẩn chặt hơn** (badge chỉ khi frame canvas đơn
clip cùng p cũng KHỚP pair, cả 2 cửa sổ): cả 2 type phải về approx —
revert là xóa 2 chuỗi khỏi tập trong `previewStatus.ts`, không cần
đổi code wiring. J3 khuyến nghị giữ matched theo chuẩn dự án, vì
chuẩn chặt đó cũng sẽ hạ cả wipe/slide/dissolve (vùng lớp còn lại
của chúng cũng lệch toàn vùng đó so với pair).

## 8. Cái gì còn lệch, chưa đo, và bài học script

1. **Canvas chưa phải crossfade cặp thật:** muốn gap §6.2 về 0 cần
   preview vẽ chồng 2 clip trong cửa sổ transition (đổi mô hình
   timeline kề nhau) — thay đổi kiến trúc ngoài phạm vi J3.
2. **Đường YUV:** canvas RGB không áp offset mức I4; gap yuv của
   fadewhite vào = đúng số tắt-offset (14,37/14,58) — không phải lỗi
   mới, nhưng badge matched hiểu theo đường RGB của canvas.
3. **Chưa đo:** 1080p/4K, sweep p trên footage (mới p = 0,1/0,5),
   nội dung cực đoan (trắng/clip hoàn toàn, bão hòa cao), clip ngắn
   cả 2 cửa sổ cùng active (dip theo cửa sổ vào, alpha tích — chỉ
   lập luận, chưa đo), tổ hợp dip + motion blur / SR / track / mask
   (logic offscreen mang theo các đường đó nhưng chưa đo pixel).
4. **Chưa chạy browser thật:** luồng này là subagent không có live
   browser; nhánh `drawVideoClipWithDip` (DOM/offscreen/getImageData)
   chưa được pixel-test trên browser thật — công thức của nó
   (singleClipDipPixel) đã khóa bằng unit test + harness (B), nhưng
   đường dây component (strip transition → offscreen → putImageData
   → drawImage) cần click-test/browser-test ở main chat trước khi
   coi là đã kiểm chứng đầu-cuối. Đây là nợ follow-up rõ ràng nhất.
5. **Hiệu năng (mô phỏng Node, không phải browser thật):** vòng lặp
   ImageData qua hàm thuần: 720×1280 white ~51ms / gray ~74ms
   (median 3 lần); 1920×1080 white ~58ms / gray ~66ms — cùng họ chi
   phí mask dissolve (~158ms @1080p đã ghi). Chỉ chạy trong frame
   transition fadewhite/fadegrays (thường ≤ 1s), không phải mọi
   frame. Tối ưu sau (inline số học / bỏ qua pixel alpha = 255 khi
   alpha = 1 đã có) nếu preview giật — chưa làm vì ngoài phạm vi.
6. **Bài học script:** sweep p phải đúng lưới frame (n = 30 + p·30
   nguyên); p = 0,25/0,75 ban đầu cho sai số giả 3–6 MAD do lệch
   0,0167 p giữa model và frame pair — đã sửa thành 0,2667/0,7333
   và đo lại toàn bộ phẳng.

## 9. File đổi/thêm và kiểm chứng

Đổi (đường dẫn tương đối từ repo root):

- `apps/web/src/lib/transitionPreview.ts` — thêm `singleClipDipPixel`
  + `dipMode` trên `TransitionClipVisual` (3 điểm trả + NO_TRANSITION);
  cập nhật comment dip (canvas nay đã áp cho white/gray).
- `apps/web/src/preview.tsx` — nhánh dip trong
  `drawVideoClipWithTransition` + hàm mới `drawVideoClipWithDip`;
  KHÔNG sửa `drawVideoClip`, không reformat file.
- `apps/web/src/lib/transitionPreview.test.ts` — import
  `singleClipDipPixel`, assert `dipMode`, test mới khóa công thức đơn
  clip + quan hệ với composite cặp (gồm gap xanh lá→magenta 42,5).
- `apps/web/src/components/transitions/previewStatus.ts` —
  `fadewhite`, `fadegrays` vào `TRANSITION_MATCHED` kèm lý do + giới
  hạn (§7).
- `server/render/src/measure_r26_j3_canvas_dip.js` — script đo mới
  (3 giao thức B/A/O, phẳng + footage, xoá raw sau mỗi phép đo).
- `docs/PHASE9_ROUND26_J3_CANVAS_DIP_LIMITS.md` — file này.
- `benchmarks/results/v26-j3-canvas-dip-flat.json` — kết quả phẳng.
- `benchmarks/results/v26-j3-canvas-dip-foot-kl.json` — kết quả K→L.
- `benchmarks/results/v26-j3-canvas-dip-foot-jk.json` — kết quả J→K.

Kiểm chứng (số thật):

- `node apps/web/src/lib/transitionPreview.test.ts` → **31 pass,
  0 fail** (30 cũ + 1 mới).
- `tsc --noEmit` (apps/web) → chỉ 1 lỗi ở file của luồng song song
  khác (`src/lib/projectRepoRound26J5.test.ts:23` TS5097 import
  `.ts`) — không thuộc file J3, không sửa (luồng khác sở hữu);
  các file J3 sạch.
- `npx vite build` → **pass** (chunk > 500kB cảnh báo cũ; `npm run
  build` gộp tsc nên dừng ở lỗi J5 trên — không phải lỗi J3).
- Phẳng (B) 24/24 KHỚP; footage (B) 16/16 KHỚP (tổng 40/40);
  pair-gap và trước/sau như §4/§6 (không giấu ô xấu).
- Perf mô phỏng Node: §8.5.

KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG binary vào repo (footage + raw chỉ ở
`~/workspace/tmp-round26-j3/` trên đĩa thật, raw xoá sau mỗi phép đo;
cuối luồng dọn toàn bộ scratch — xem báo cáo cuối cho parent).
KHÔNG tự ghi file paths-loop, KHÔNG ghi build-loop-log (parent lo).
