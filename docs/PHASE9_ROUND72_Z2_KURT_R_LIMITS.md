# PHASE 9 ĐỢT 72 — LUỒNG Z2: KHỚP BƯỚC 1920→1280 VỚI BỘ LỌC VIDEO-PATH THẬT + ĐO LẠI

**Ngày:** 09/11/2026 · **Nợ đóng:** đợt 71 §5 mục 2 (w1920 noise10
testsrc2 Δkurt R 0,38 + ocean w1440 LỆCH thật).
**Kết quả tóm tắt — đọc trước:**

1. **(a) w1920 noise10 testsrc2 — KHỚP (như artifact mô hình), nợ ĐÓNG
   ở mức câu hỏi parity.** Trilinear tái lập đúng **0,38** (sanity
   pipeline); 1-kernel viewport cho **Δkurt R 0,06 KHỚP**. Testsrc2
   KHÔNG có bước 1920→1280 (test-pattern.mp4 gốc chỉ 1280×720 — phát
   hiện khi kiểm đĩa); 0,38 là sai số của mô hình trilinear ở thang
   viewport s=0,632 (blend 16% mip L1 trong khi Chrome ở thang đó gần
   như chỉ dùng triangle thuần — probe Y2 §3: 1-kernel MAD 0,0084 vs
   trilinear 0,0255). Không phải lỗi sản phẩm; không sửa code production
   (mô hình trilinear chỉ dùng cho harness đo, không có trong src/).
2. **(b1) Ocean w1440 noise10 — KHỚP, nợ ĐÓNG** nhờ điều kiện hoá
   delta0 (không nhờ khớp filter): luôn-d0 vẫn đọc **0,37** như Y2;
   không-d0 cho **0,22 KHỚP** (Δcorr [0,102, 0,04, 0,056]). Method F
   (nhiễu ffmpeg fresh) xác nhận độc lập: 0,20 KHỚP. Lưu ý biên mỏng:
   Δcorr R-G 0,102 so với ngưỡng 0,12.
3. **(b2) Ocean w1440 noise05 — LỆCH THẬT, nợ CÒN.** Δkurt G **1,11**,
   Δcorr R-G **0,242**, stdRatio G **1,20** (cả 3 chỉ số đều trượt).
   Sống sót qua MỌI biến đã thử: filter 1920→1280 (1,12→1,11), delta0
   (như nhau có/không), viewport trilinear/1-kernel/2-stage (1,11 /
   1,36 / 1,10), nhiễu transfer/fresh (1,11 / 1,13), plain 2-bước/
   1-bước (1,11→0,91, vẫn lệch). Phân rã bin GIẾT giả thuyết kẹp rail:
   Δkurt G 0,71–1,19 đều khắp mid-tone, railG = 0,0%.
4. **Điều kiện hoá delta0 theo plain absMAD — ĐỀ XUẤT CÓ SỐ, ổn định
   trên ngưỡng 2,0–3,0.** Ngưỡng 2,5 nằm trong khe dữ liệu (max
   phi-ocean 2,08 vs min ocean 2,68); mọi verdict không đổi khi quét
   ngưỡng 2,0/2,5/3,0. Chỉ áp dụng cho harness đo, chưa đụng production.
5. **Khớp bước 1920→1280 giúp plain absMAD nhưng không đủ:** ocean
   4,07→2,99 (trung bình 2 cửa sổ); basgo 2,22→1,66; slovenska
   1,90→1,85. Tách biến cho thấy thắng của C2 trên ocean đến phần lớn
   từ convert YUV→RGB nearest-chroma, không phải từ filter scale
   (C2b: 3,89/3,18 ≈ C1/C3, thua C2 3,31/2,68). Dư plain còn lại
   (~1,0–3,1) là hỗn hợp: ~50% tương quan gradient (dư resample 2D)
   + offset hệ thống theo kênh (B +2,28 ở ocean; −0,7 đều 3 kênh ở
   slovenska) — gợi ý khác biệt convert YUV→RGB giữa đường video
   Chrome và ffmpeg bt709, chưa đo trực tiếp.
6. **Tổng kết (viewport trilinear + delta0 có điều kiện 2,5): 14/16
   KHỚP** (Y2: 13/16). Với mô hình viewport thích ứng theo thang
   (trilinear w1440 + 1-kernel w1920): **15/16** — chỉ còn ocean w1440
   noise05 lệch. **Không sửa code production trong luồng này.**

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; snapshot headed Y2 tái dùng — đã chứng minh
xác định pixel-identical khi chạy lại, KHÔNG capture lại). Ngưỡng
verdict như T3/X6/Y2: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Probe/log/JSON tại `hidden_files/round72-z2/`, log
luồng `hidden_files/round72-z2.md`.

---

## 1. Phát hiện tiền đề: testsrc2 không có bước 1920→1280

`ffprobe` test-pattern.mp4 (media Y2 dùng cho preview): **1280×720**,
h264, 30 fps. Ba clip tự nhiên đều 1920×1080 (ocean h264 25 fps,
basgo VP8 30 fps, slovenska VP9 25 fps). Hệ quả:

- Nhiệm vụ (a) không thể là "khớp bước 1920→1280 cho testsrc2" — bước
  đó không tồn tại. Preview testsrc2 vẽ 1280→viewport 1 bước ở cả 2
  đường (plain trực tiếp, noise qua effectCanvas 1280×720 1:1), và
  render đối chiếu cũng 1280→viewport 1 bước (frame T3). Phần dư duy
  nhất có thể là mô hình viewport ở thang s=0,632 (w1920) / 0,382
  (w1440). Đo lại (a) = so 2 mô hình viewport trên cùng snapshot Y2.
- Nhiệm vụ (b) giữ nguyên: chỉ 3 nguồn tự nhiên có bước 1920→1280
  (ffmpeg bicubic trong render Y2 vs video-path Chrome trong preview).

## 2. Phương pháp

### 2.1 Tái lập chuỗi render Y2 đúng từng byte (nền móng)

Trước khi đổi filter, phải tái lập được frame plain cũ của Y2 từ clip
gốc — nếu không, mọi so sánh sau đó đều lẫn sai số trích khung. Chuỗi
Y2: decode → `select=eq(n,N)` → `scale 1280:720 bt709` → (noise) →
`format rgb24`. Thử 3 biến thể matrix màu trên ocean f25:

| Biến thể | Mean RGB | MAD vs fullrgb-ocean-plain.raw cũ |
|---|---|---|
| Mặc định (không ép matrix) | 191,7/103,3/74,5 | 5,321 (max 14) |
| `in_color_matrix=bt709:out_color_matrix=bt709` | 198,3/109,5/71,4 | **0,0 (max 0, exact 1,0)** |
| `colorspace=bt709` | — | lỗi filter (primaries unknown) |

Biến thể 2 tái lập **đúng từng byte** cả 3 nguồn (ocean f25, basgo
f30, slovenska f25 — MAD 0,0, exact 1,0). Khung đã chốt: ocean f25,
basgo f30, slovenska f25 (đúng t = 1,0 s theo fps từng clip). Khung
gốc 1920×1080 trích bằng cùng lệnh bt709 (RGB24) + YUV420p thô, lưu
tại `hidden_files/round72-z2/native/`. Lưu ý: trích mặc định (bt601)
lệch mean tới +6/+7/−4 — matrix màu phải ép tường minh, nếu không
mọi số sau đó đều sai.

### 2.2 Ứng viên cho bước 1920→1280 (script r72z2-rebuild.mjs)

Từ khung gốc 1920×1080, build plain 1280×720 theo 4 ứng viên (bước 2
dùng trilinear production 1280→viewport như Y2; so plain absMAD vs
snapshot headed Y2, 2 cửa sổ):

- **C0** baseline: ffmpeg bicubic (file cũ của Y2).
- **C1** 1-kernel RGB: `resampleRgb24` (triangle h=1, s=0,667).
- **C2** 1-kernel YUV: `resampleYuv420p` (từng plane YUV420p, h=1;
  convert YUV→RGB nearest-chroma 2×2).
- **C3** trilinear RGB: `resampleRgb24Trilinear` (LOD-bias −0,5).
- Chẩn đoán 1-bước: native 1920→viewport trực tiếp (trilinear và
  1-kernel) — sàn cấu trúc của plain (preview plain vốn 1 bước).

Frame noise cho ứng viên thắng bằng **chuyển delta RGB (method T)**:
`noiseMới = plainMới + (noiseCũ − plainCũ)`. Delta này là trường
nhiễu thuần ở 1280 (nhiễu ffmpeg cộng SAU scale nên không chứa thành
phần scale) — chuyển sang plain mới là đúng biến cần cô lập. Kiểm tra
toàn vẹn chuyển: đếm pixel kẹp rail + dư chuyển MAD giữa
(noiseMới−noiseCũ) và (plainMới−plainCũ) — xem §2.3.

**Đối chứng độc lập method F** (r72z2-yuv1280.mjs + ffmpeg): resample
từng plane YUV 1920→1280 triangle h=1 → raw yuv420p → ffmpeg
`noise=alls=28/50:allf=t` → rgb24 bt709. Chuỗi render thật với
realization nhiễu mới cùng phân phối (verdict là thống kê, không cần
cùng realization). Plain tương ứng là **C2b**: yuv1280 1-kernel +
convert ffmpeg (tách biến cho C2 — xem §3.2).

### 2.3 Điều kiện hoá delta0

Quy tắc đề xuất (từ Y2 §5): áp hiệu chỉnh delta0 **chỉ khi plain
render và plain preview khớp nhau**, đo bằng plain absMAD (viewport
trilinear). Ngưỡng chính **2,5** — nằm trong khe dữ liệu mới:
max phi-ocean 2,08 (basgo w1440) vs min ocean 2,68 (w1920). Ngưỡng
được hiệu chuẩn trên tập này, không phải hằng số phổ quát — ghi rõ
để đợt sau không trích sai. Nhạy ngưỡng 2,0/3,0 được báo cáo ở §4.3:
mọi verdict không đổi trong [2,0, 3,0].

---

## 3. Kết quả (a): khớp bước 1920→1280

### 3.1 Plain absMAD theo ứng viên (trilinear viewport, bước 2)

| Nguồn | Cửa sổ | C0 bicubic | C1 1k-RGB | C2 1k-YUV | C3 tri-RGB | 1-bước tri | 1-bước 1k |
|---|---|---|---|---|---|---|---|
| ocean | w1440 | 4,455 | 3,908 | **3,307** | 3,983 | 3,146 | 3,004 |
| ocean | w1920 | 3,681 | 3,114 | **2,678** | 3,087 | 2,349 | 4,091 |
| basgo | w1440 | 2,613 | **2,079** | 1,957 | 2,174 | 1,759 | 1,215 |
| basgo | w1920 | 1,827 | **1,246** | 1,439 | 1,258 | 1,003 | 1,924 |
| slovenska | w1440 | 1,882 | 1,783 | 2,041 | **1,769** | 1,804 | 1,934 |
| slovenska | w1920 | 1,915 | 1,950 | 2,298 | **1,920** | 1,872 | 2,025 |

Trung bình 2 cửa sổ: ocean C0 4,068 → C2 **2,992** (thắng);
basgo C0 2,220 → C1 **1,663** (thắng); slovenska C0 1,898 → C3
**1,845** (thắng sát nút, chênh C0 chỉ 0,05 — thực chất hoà).
Ứng viên thắng theo nguồn được dùng làm frame render mới
(`render-1k/fullrgb-{src}-{plain,noise05,noise10}.raw`).

Đọc: khớp filter giúp rõ rệt cho ocean (−1,08) và basgo (−0,56),
không đáng kể cho slovenska. Nhưng **ngay cả chẩn đoán 1-bước
(trực tiếp 1920→viewport, cùng cấu trúc với preview plain) cũng
chỉ đạt 3,15/2,35 ở ocean** — xa mức ~1,0 của testsrc2. Nghĩa là
dư plain của ocean KHÔNG chủ yếu nằm ở bước 1920→1280 hay ở cấu
trúc 2-bước-vs-1-bước; còn một thành phần khác (xem §3.3).

### 3.2 Tách biến: thắng của C2 đến từ đâu?

C2 gộp 2 thay đổi: (1) filter scale bicubic→1-kernel, (2) convert
YUV→RGB ffmpeg→nearest-chroma. C2b chỉ làm (1) (yuv1280 1-kernel +
convert ffmpeg):

| Nguồn | C2b w1440 / w1920 | C2 (thắng) | C1 | Kết luận |
|---|---|---|---|---|
| ocean | 3,893 / 3,175 | **3,307 / 2,678** | 3,908 / 3,114 | C2b ≈ C1/C3 → thắng của C2 đến chủ yếu từ **convert nearest-chroma**, không phải filter scale. Filter scale một mình chỉ giúp 4,46→3,89 (w1440). |
| basgo | 2,083 / 1,294 | 1,957 / 1,439 | 2,079 / 1,246 | Ba ứng viên hoà nhau (~2,08/1,25–1,44). |
| slovenska | 1,789 / 1,955 | 2,041 / 2,298 | 1,783 / 1,950 | C2 thua rõ — nearest-chroma HẠI ở slovenska (tối, phẳng). |

Hệ quả: **không có một filter 1920→1280 duy nhất thắng mọi nguồn.**
C2 thắng ocean nhưng thua slovenska; C1/C3 hoà nhau ở basgo/
slovenska. Cơ chế có thể: đường video Chrome upsample chroma gần
nearest (nên C2 khớp ocean — texture HF + chroma mạnh), nhưng trên
nội dung tối/phẳng thì nearest lại tệ hơn convert ffmpeg. Đây là
quan sát thực nghiệm, chưa chứng minh cơ chế — cần probe màu bão
hoà video-vs-img (xem §7.3). Lựa chọn thực hành của luồng này: giữ
ứng viên thắng theo nguồn (C2 ocean, C1 basgo, C3 slovenska) làm
frame render mới — vì mục tiêu là frame đối chiếu khớp nhất, không
phải một filter duy nhất.

### 3.3 Chẩn đoán dư plain còn lại (w1920, plain thắng, trilinear)

| Nguồn | meanSigned diff RGB (preview−render) | meanAbs | corr(\|d\|, gradient) |
|---|---|---|---|
| test-pattern | [0,03, 1,29, −0,07] | 1,03 | 0,602 |
| ocean | [−0,55, −0,41, **2,28**] | 2,68 | 0,494 |
| basgo | [0,04, 0,51, −0,08] | 1,25 | 0,495 |
| slovenska | [−0,72, −0,59, −0,72] | 1,92 | 0,501 |

Dư plain là hỗn hợp hai thành phần: (i) ~50% tương quan với
gradient cục bộ (corr ≈ 0,5 mọi nguồn) — dư resample 2D, đúng nợ
Y8 (mô hình tách trục không bắt hết kernel 2D thật của Chrome);
(ii) offset hệ thống theo kênh: B +2,28 ở ocean, −0,7 đều 3 kênh
ở slovenska, G +1,29 ở testsrc2 — không triệt tiêu trên 368k
pixel nên không phải nhiễu resample; gợi ý khác biệt convert
YUV→RGB giữa đường video Chrome và ffmpeg bt709 (probe video-vs-
img của Y2 dùng mẫu đen/trắng chroma phẳng nên KHÔNG đo được
thành phần này). Offset này không ảnh hưởng trực tiếp verdict
delta (trừ plain triệt tiêu offset hằng), nhưng nó đóng góp vào
plain absMAD — tức là ngưỡng điều kiện hoá delta0 đang đo gộp cả
hai thành phần.

### 3.4 Toàn vẹn chuyển delta nhiễu (method T)

| Nguồn | noise05: pixel kẹp / dư chuyển MAD (max) | noise10 |
|---|---|---|
| ocean | 68.366 px (7,42%) / 0,066 (34) | 138.823 px (15,06%) / 0,137 (36) |
| basgo | 67.989 px (7,38%) / 0,040 (8) | 125.818 px (13,65%) / 0,073 (10) |
| slovenska | 6.348 px (0,69%) / 0,003 (4) | 11.125 px (1,21%) / 0,005 (5) |

Dư chuyển nhỏ so với std nhiễu (~9–17): method T đáng tin cho
verdict; ocean là trường hợp kẹp nhiều nhất (bão hoà, gần rail)
nên mọi kết luận ocean đều được đối chứng thêm bằng method F (§4.2)
— hai method đồng thuận ở cả 4 ô ocean.

---

## 4. Kết quả (b): đo lại verdict

### 4.1 Bảng verdict chính — viewport trilinear + delta0 có điều kiện (2,5)

| Cửa sổ | Nguồn | noise05 | noise10 |
|---|---|---|---|
| w1440 | test-pattern | **KHỚP** Δkurt [0,29, 0,16, 0,28], Δcorr [0,003, 0,017, 0,051] (d0 CÓ) | **KHỚP** Δkurt [0,34, 0,04, 0,26], Δcorr [0,028, 0,011, 0,042] (d0 CÓ) |
| w1440 | ocean | **LỆCH** Δkurt [0,13, **1,11**, 0,08], Δcorr [**0,242**, 0,079, 0,145], stdRatio [1,05, **1,20**, 1,04] (d0 KHÔNG) | **KHỚP** Δkurt [0,22, 0,15, 0,03], Δcorr [0,102, 0,04, 0,056], stdRatio [1,01, 1,07, 1,02] (d0 KHÔNG) |
| w1440 | basgo | **KHỚP** Δkurt [0,15, 0,19, 0,11], Δcorr [0,087, 0,033, 0,056] (d0 CÓ) | **KHỚP** Δkurt [0,12, 0,09, 0,11], Δcorr [0,032, 0,02, 0,02] (d0 CÓ) |
| w1440 | slovenska | **KHỚP** Δkurt [0,14, 0,04, 0,05], Δcorr [0,012, 0,007, 0,001] (d0 CÓ) | **KHỚP** Δkurt [0,24, 0,05, 0,07], Δcorr [0,009, 0,003, 0,005] (d0 CÓ) |
| w1920 | test-pattern | **KHỚP** Δkurt [0,33, 0,17, 0,18], Δcorr [0,005, 0,006, 0,036] (d0 CÓ) | **LỆCH** Δkurt [**0,38**, 0,23, 0,23], Δcorr [0,013, 0,003, 0,03] (d0 CÓ) |
| w1920 | ocean | **KHỚP** Δkurt [0,11, 0,17, 0,04], Δcorr [0,08, 0,032, 0,046] (d0 KHÔNG) | **KHỚP** Δkurt [0,19, 0,06, 0,01], Δcorr [0,041, 0,019, 0,022] (d0 KHÔNG) |
| w1920 | basgo | **KHỚP** Δkurt [0,14, 0,06, 0,08], Δcorr [0,025, 0,012, 0,014] (d0 CÓ) | **KHỚP** Δkurt [0,12, 0,05, 0,09], Δcorr [0,02, 0,012, 0,01] (d0 CÓ) |
| w1920 | slovenska | **KHỚP** Δkurt [0,14, 0,01, 0,04], Δcorr [0,011, 0,007, 0,005] (d0 CÓ) | **KHỚP** Δkurt [0,24, 0, 0,07], Δcorr [0,013, 0,006, 0,006] (d0 CÓ) |

**Tổng: 14/16 KHỚP** (Y2: 13/16). Hai ô còn lệch: ocean w1440
noise05 và test-pattern w1920 noise10 (xem §5, §6).

### 4.2 Đối chứng ocean method F (plain C2b + nhiễu ffmpeg fresh)

| Ô | Method T (điều kiện) | Method F (điều kiện) |
|---|---|---|
| w1440 noise05 | LỆCH Δkurt G 1,11, Δcorr R-G 0,242 | LỆCH Δkurt G **1,13**, Δcorr R-G **0,24** |
| w1440 noise10 | KHỚP Δkurt [0,22, 0,15, 0,03] | KHỚP Δkurt [0,20, 0,16, 0,03], Δcorr [0,10, 0,04, 0,06] |
| w1920 noise05 | KHỚP Δkurt [0,11, 0,17, 0,04] | KHỚP Δkurt [0,10, 0,19, 0,04] |
| w1920 noise10 | KHỚP Δkurt [0,19, 0,06, 0,01] | KHỚP Δkurt [0,19, 0,06, 0,01] |

Hai method độc lập (realization nhiễu khác nhau, chuỗi build khác
nhau) đồng thuận cả 4 ô. Kết luận ocean không phụ thuộc cách build
frame nhiễu.

### 4.3 Nhạy ngưỡng điều kiện hoá delta0

Quét ngưỡng 2,0 / 2,5 / 3,0 — **mọi verdict không đổi** ở cả 8 ô
then chốt (ocean + test-pattern, cả 2 cửa sổ × 2 mức). Lý do: khe
dữ liệu rộng (2,08–2,68) nên không có ô nào nằm gần ngưỡng. Riêng
ocean w1920 (plain 2,678): ở ngưỡng 3,0 thì d0 được áp → noise05
Δkurt R 0,34 (vẫn KHỚP nhưng sát nút) thay vì 0,11 khi không áp —
verdict KHỚP cả hai cách, chỉ biên an toàn khác nhau. Quy tắc điều
kiện hoá vì vậy là ổn định, không phải fitted sát nút.

### 4.4 Mô hình viewport thích ứng theo thang (nhạy)

Với mô hình viewport theo thang (trilinear w1440 s=0,382 +
1-kernel w1920 s=0,632, đúng đề xuất Y2 §3) + delta0 có điều kiện:
**15/16 KHỚP** — w1920 testsrc2 noise10 đóng (Δkurt R 0,06),
w1920 basgo/slovenska/ocean vẫn KHỚP dưới 1-kernel (Δkurt lớn nhất
0,31 ocean n05, 0,29 ocean n10). Chỉ còn ocean w1440 noise05 lệch
dưới mọi mô hình viewport đã thử (trilinear 1,11 / 1-kernel 1,36 /
2-stage 1,10 — xem §6.2).

---

## 5. Kết luận (a): w1920 noise10 testsrc2

- **Tái lập:** trilinear cho đúng **Δkurt R 0,38** như Y2 (pipeline
  phân tích nhất quán — cùng snapshot, cùng frame T3, cùng hàm).
- **Mô hình đúng theo thang:** 1-kernel viewport cho **Δkurt R 0,06,
  Δcorr [0,061, 0,03, 0,014], stdRatio [1,02, 1, 1,01] — KHỚP** với
  biên an toàn lớn. Ở s=0,632, trilinear blend 16% mip L1
  (λ* = 0,162) trong khi Chrome gần như chỉ dùng triangle thuần
  (probe Y2: 1-kernel MAD 0,0084 vs trilinear 0,0255 tại 809×455).
- **Verdict: KHỚP — nợ ĐÓNG ở mức câu hỏi parity** (preview có khớp
  render không? Có, dưới filter đúng theo thang). Phần dư 0,38 là
  **artifact của mô hình harness trilinear**, không phải lỗi sản
  phẩm: preview dùng drawImage của trình duyệt, không dùng mô hình
  JS này; mô hình chỉ phục vụ đo. Nợ còn lại chuyển thành nợ mô
  hình thích ứng theo thang (Y2 §9.4 — đã biết, chưa làm), không
  phải nợ parity. Không sửa code production.
- Lưu ý trung thực: dưới mô hình trilinear production hiện tại của
  harness, ô này vẫn đọc 0,38 — đừng trích "đã KHỚP" mà không kèm
  điều kiện mô hình. Ô w1440 testsrc2 noise10 (0,34, đúng ngưỡng)
  vẫn không có biên an toàn như Y2 đã ghi.

## 6. Kết luận (b): ocean w1440

### 6.1 noise10 — KHỚP, nợ ĐÓNG

- Luôn-d0 với frame mới vẫn đọc **0,37** — khớp filter 1920→1280
  KHÔNG đổi gì ở ô này (Y2: 0,37 → nay: 0,37). Điều đóng ô này là
  **điều kiện hoá delta0**: plain absMAD 3,31 > 2,5 nên không áp d0
  → Δkurt R **0,37→0,22 KHỚP** (Δcorr [0,102, 0,04, 0,056]).
  Method F xác nhận: 0,20 KHỚP. Đây chính là trường hợp Y2 §5 dự
  báo: delta0 tính từ render là trường sai khi plain đã lệch nhiều,
  trừ nó làm tệ thêm (trước-d0 0,23 → sau-d0 0,37 ở Y2; nay 0,22 →
  0,37).
- Biên mỏng cần ghi rõ: Δcorr R-G 0,102 so với ngưỡng 0,12 (còn
  0,018 biên). Đừng trích ô này như khớp chắc.

### 6.2 noise05 — LỆCH THẬT, nợ CÒN (chưa giải thích xong)

Chữ ký (viewport trilinear, không d0): preview delta kurt G **1,35**
vs render 0,24; std G 10,69 vs 8,94 (ratio 1,20 > 1,18); corr R-G
−0,123 vs −0,356 (Δ 0,242). Đã loại trừ bằng đo thật, lần lượt:

| Giả thuyết | Thí nghiệm | Kết quả |
|---|---|---|
| Filter 1920→1280 sai | Rebuild C1/C2/C3 + C2b | Δkurt G 1,12 → **1,11** (không đổi) |
| Hiệu chỉnh delta0 sai | Có/không d0 | **1,11 cả hai** (d0 không chạm tới G-kurt ô này) |
| Viewport model sai | trilinear / 1-kernel / 2-stage | 1,11 / 1,36 / **1,10** (đều lệch) |
| Realization nhiễu | Method F (fresh ffmpeg) | **1,13** (đồng thuận) |
| Chuyển delta kẹp rail | Method F (không chuyển) | 1,13 — kẹp chuyển không phải nguyên nhân |
| Kẹp rail sau cộng nhiễu | Phân rã bin độ sáng (8 bin) | **CHẾT**: Δkurt G 0,71–1,19 đều khắp bin mid-tone 64–223 (99,5% pixel); railG = **0,0%** mọi bin; bin sáng nhất (nearRail 71,4%) chỉ ΔkurtG 0,08 |
| Cấu trúc plain 2-bước-vs-1-bước | Verdict với render plain 1-bước | Δkurt G 1,11→**0,91**, Δcorr 0,242→**0,13** — cải thiện nhưng vẫn lệch; đối chứng (ocean n10, basgo, slovenska) giữ KHỚP |

**Kết luận: lệch thật, tái lập được, cơ chế chưa đóng.** Đặc điểm
hẹp và lạ: chỉ ocean + w1440 (s=0,382) + noise05. Cùng nội dung ở
noise10 KHỚP (Δkurt G 0,15), cùng mức ở w1920 KHỚP (0,17), cùng
thang ở basgo/slovenska KHỚP. Preview delta G có đuôi nặng hơn
render một cách có hệ thống ở mid-tone (kurt 1,0–1,43 vs 0,15–0,29
mọi bin 64–223) kèm std cao hơn (~10,5 vs ~9,0) — tức nhiễu preview
trên nội dung này vừa nặng đuôi vừa mạnh hơn render, không phải
chỉ lệch đuôi.

Hướng còn lại (chưa chứng minh — nợ đợt sau): tương tác
addYuvNoise/est-chroma trên nội dung bão hoà ở mức nhiễu nhỏ
(preview cộng nhiễu trong YUV với chroma native ước lượng kCb 1,04/
kCr 1,12 hiệu chuẩn trên testsrc2; ocean có mean|d0| 3,70, R-nặng —
trường est-chroma có thể sai đủ để G-noise sau convert YUV→RGB
nặng đuôi; ở noise10 thì nhiễu Gauss khối lấn át hiệu ứng này).
Thí nghiệm quyết định: build render variant cộng nhiễu theo đúng
công thức preview (est-chroma YUV noise) rồi so kurt; hoặc probe
tổng hợp (gradient bão hoà + noise05, w1440) để cô lập phụ thuộc
nội dung. Không làm trong luồng này (vượt phạm vi; cần vòng kiểm
chứng riêng).

---

## 7. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Tái lập frame plain Y2 (3 nguồn, lệnh bt709) | **MAD 0,0, max 0, exact 1,0** cả 3 |
| `node --check` 6 script mới r72z2-*.mjs | OK |
| Rebuild ứng viên (3 nguồn × C1/C2/C3 + C2b + F) | exit 0; JSON `r72z2-rebuild.json` |
| Analyze verdict (2 cửa sổ × 4 nguồn × 2 mức × 2 mô hình viewport × luôn/không/điều kiện d0) | exit 0; JSON `r72z2-analysis.json` (158 KB) |
| Ocean bins (3 ô, 8 bin) | exit 0; railG 0,0% mọi bin mid-tone |
| One-step plain (6 ô) | exit 0; đối chứng giữ KHỚP |
| 2-stage viewport (4 ô w1440) | exit 0; ocean n05 vẫn lệch 1,10; testsrc2 n05 tệ đi (0,42) |
| Tái lập số Y2 (sanity pipeline) | trilinear w1920 testsrc2 n10 = **0,38 đúng số Y2**; 1-kernel = 0,06 đúng số Y2 |
| Không chạy lại | tsc/vite build (không đụng TS/UI/production; chỉ thêm script `.mjs` + LIMITS — parent kiểm chứng gộp đợt sẽ chạy lại nếu cần); capture headed mới (snapshot Y2 đã chứng minh pixel-identical khi chạy lại) |

Điều kiện đo: Node v24.22.1, ffmpeg 8.1.2, VM 4 vCPU. Snapshot
headed Y2 tái dùng nguyên vẹn (không capture lại — đúng phương pháp:
câu hỏi của luồng là frame render đối chiếu, không phải preview).

## 8. Nợ mở (trung thực)

1. **Ocean w1440 noise05 — LỆCH THẬT, nợ chính còn lại của luồng
   này** (Δkurt G 1,11, Δcorr R-G 0,242, stdRatio G 1,20). Đã loại:
   filter 1920→1280, delta0, 3 mô hình viewport, realization nhiễu,
   kẹp rail, cấu trúc plain (chỉ cải thiện 1,11→0,91). Hướng tiếp:
   render variant nhiễu theo công thức preview (est-chroma) hoặc
   probe tổng hợp bão hoà + noise05 tại w1440.
2. **Mô hình resample thích ứng theo thang chưa có:** trilinear tốt
   nhất tổng thể và ở s≈0,38, nhưng 1-kernel tốt hơn hẳn ở s≈0,63–
   0,67 (w1920 testsrc2 n10: 0,38→0,06). Harness hiện tại dùng
   trilinear cho mọi thang nên ô đó vẫn đọc lệch. Cần vòng kiểm chứng
   riêng trước khi đổi mô hình mặc định (đề xuất Y2 §3: trilinear
   khi s < ~0,5, 1-kernel khi s ≳ 0,6).
3. **Dư plain còn lại (~1,0–3,1 MAD) chưa giải thích hết:** ~50%
   tương quan gradient (dư resample 2D — nợ Y8) + offset hệ thống
   theo kênh (B +2,28 ocean; −0,7 đều slovenska) gợi ý khác biệt
   convert YUV→RGB đường video Chrome vs ffmpeg bt709. Cần probe
   video-vs-img với mẫu MÀU bão hoà (probe Y2 chỉ dùng đen/trắng
   nên mù với thành phần này).
4. **Không có filter 1920→1280 duy nhất thắng mọi nguồn:** C2 thắng
   ocean nhưng thua slovenska; C1/C3 hoà ở basgo/slovenska. Frame
   render mới của luồng này dùng thắng theo nguồn — thực hành được
   nhưng chưa phải đáp án thống nhất.
5. **Ngưỡng điều kiện hoá delta0 (2,5) hiệu chuẩn trên tập này**
   (khe 2,08–2,68), chưa phải hằng số phổ quát; ổn định trong
   [2,0, 3,0] nhưng cần thêm nội dung để kiểm chứng ngoài mẫu.
6. **Ô khớp sát nút cần đọc đúng:** w1440 testsrc2 n10 Δkurt R 0,34;
   ocean w1440 n10 Δcorr R-G 0,102; ocean w1920 n05 (luôn-d0) Δkurt
   R 0,34 — KHỚP nhưng không có biên an toàn.
7. Nợ kế thừa chưa đụng: w2560 cần xác nhận full-pixel; GPU thật /
   Safari thật chưa đo; `.github/workflows/` vẫn 403 (chờ user).

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r72z2-rebuild.mjs` — build 3 ứng viên plain 1280
  + chọn thắng theo plain absMAD + noise method T (chuyển delta RGB).
- `apps/web/scripts/r72z2-yuv1280.mjs` — resample plane YUV 1920→
  1280 (tách biến C2b + method F).
- `apps/web/scripts/r72z2-analyze.mjs` — verdict full-pixel frame
  mới: trilinear/1-kernel viewport × luôn/không/điều kiện delta0 +
  chẩn đoán dư plain + đối chứng method F.
- `apps/web/scripts/r72z2-ocean-bins.mjs` — phân rã đuôi delta theo
  bin độ sáng (giết giả thuyết kẹp rail).
- `apps/web/scripts/r72z2-onestep-plain.mjs` — verdict với render
  plain 1-bước (kiểm tra cấu trúc plain).
- `apps/web/scripts/r72z2-twostage-viewport.mjs` — verdict viewport
  2-stage w1440.
- `docs/PHASE9_ROUND72_Z2_KURT_R_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / frame
render): `hidden_files/round72-z2/` — `native/` (khung gốc 1920
RGB+YUV + file kiểm chứng v1/v2/val-*), `render-1k/` (frame render
mới + ứng viên), `yuv1280/` (yuv1280 + C2b + noise method F),
`r72z2-rebuild.json`, `r72z2-analysis.json`,
`r72z2-ocean-bins.json`, `r72z2-onestep-plain.json`,
`r72z2-twostage-viewport.json`, log luồng `hidden_files/round72-z2.md`.
Không sửa code production, không binary, không workflow `.yml`.
