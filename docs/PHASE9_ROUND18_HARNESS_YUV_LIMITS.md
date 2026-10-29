# Phase 9 đợt 18, luồng harness-YUV — LIMITS (trung thực)

> Đợt 18, luồng harness-YUV. Repo làm việc: `~/workspace/repo-1`,
> KHÔNG push GitHub, KHÔNG release/tag, KHÔNG code giả.
> FFmpeg đo: 8.1.2. Khung 1280×720, xfade duration=1 offset=1,
> frame giữa n=45 @30fps, p=0,5.
> **KHÔNG sửa code sản phẩm render/preview, KHÔNG đổi ngưỡng,
> KHÔNG đổi logic sản phẩm để vừa số đo.** Chỉ sửa phương pháp đo
> của harness + thêm script đo mới.
>
> Nguồn đo: đúng cặp file repo
> `server/render/examples/media/clip1.mp4` / `clip2.mp4` (test pattern
> tổng hợp — smptebars/testsrc2 + drawtext — KHÔNG phải footage máy
> quay thật). Thang V6 (KHỚP = MAD ≤ 2 và ≥ 99% ≤ 8; XẤP XỈ =
> MAD ≤ 20 và ≥ 90% ≤ 8; còn lại LỆCH) được định nghĩa cho MAD RGB;
> mọi số MAD miền YUV dưới đây in kèm phân loại V6 CHỈ để tham
> chiếu, không phải chuẩn badge mới.

## 1. Kết luận trước hết — không có một chế độ đo nào "thắng hết"

Nợ đợt 17: "sửa phương pháp đo của harness cho nguồn mp4 yuv, rồi đo
lại clip1/clip2 + yuv420p e2e". Kết quả đo tách từng bước cho thấy
hai chế độ đo trả lời hai câu hỏi KHÁC nhau, và không chế độ nào
biến ô yuv420p e2e của dissolve thành KHỚP:

| Chế độ đo | Câu hỏi nó trả lời | dissolve | circleopen |
|---|---|---|---|
| (a) Ép rgb24 TRƯỚC xfade, so RGB (pipe, không encode) | Mô hình transition có đúng không? | **KHỚP 0,0057 / 100,00%** | **KHỚP 0,3820 / 100,00%** |
| (b) So trong miền YUV, cả 2 phía qua CÙNG bộ chuyển FFmpeg (S5b) | Tổn thất encode thật là bao nhiêu? | XẤP XỈ 2,8985 / 96,72% | **KHỚP 0,4291 / 99,90%** |
| So RGB sau decode yuv420p e2e (S4, cách đo cũ của ô e2e) | (Không còn dùng để kết luận mô hình) | LỆCH 58,2054 / 25,06% | XẤP XỈ 1,6648 / 98,59% |

**Chế độ (a) thắng cho câu hỏi "mô hình đúng hay sai"** — nó tái tạo
đúng số N5 và đóng lại cặp clip1/clip2 ở mức mô hình. **Chế độ (b)
thắng cho câu hỏi "e2e mất bao nhiêu"** — nhưng chỉ khi cả 2 phía
đều qua cùng bộ chuyển FFmpeg; bản (b) dùng hàm JS
(`harnessShared.rgbToYuv420`) cho dissolve đọc LỆCH 4,3437, tức
sai thêm do bộ lọc chroma khác nhau, không phải do encode (xem §4).
**Ngay cả chế độ (b) sạch nhất, dissolve e2e vẫn chỉ XẤP XỈ, không
KHỚP** — vì khung dissolve ở crf18 tự nó đã khó nén (xem §3).

## 2. Bảng số đầy đủ — thang đối chứng trên clip1/clip2 (script mới)

Script: `server/render/src/test_v18_harness_yuv.js` (chạy 30,6 giây,
exit 0). Cùng 1 preview cho mọi ô trong 1 type.

| Ô | dissolve (MAD RGB / MAD-YUV) | circleopen |
|---|---|---|
| V0: hàm JS `rgbToYuv420` vs FFmpeg chuyển cùng frame clip1@1.5 | MAD-YUV 0,0597 (Y 0,0005 / U 0,2759 / V 0,0805), ≤8 99,96% | (chung 1 frame kiểm chứng) |
| S0: cũ H6 — xfade YUV gốc, pipe, so RGB | 1,2424 / 97,48% XẤP XỈ (= đúng số N5) | 1,5943 / 96,47% XẤP XỈ (= đúng số N5) |
| S1: (a) rgb24 ép trước, pipe, so RGB | **0,0057 / 100,00% KHỚP** (= đúng số N5) | **0,3820 / 100,00% KHỚP** (= đúng số N5) |
| S2: subsample-only — S1 → yuv420p → rgb, KHÔNG encode | 57,7793 / 24,93% LỆCH | 1,4866 / 99,60% KHỚP |
| S3: crf0 (lượng tử ~0), decode RGB | 57,7793 / 24,93% LỆCH (= S2 tới 4 chữ số) | 1,4866 / 99,60% KHỚP (= S2) |
| S4: crf18 e2e, decode RGB | 58,2054 / 25,06% LỆCH | 1,6648 / 98,59% XẤP XỈ |
| S5: (b) crf18 e2e, so YUV, preview qua hàm JS | MAD-YUV 4,3437 (Y 2,9852 / U 7,6970 / V 6,4246), ≤8 87,53% → V6-tham-chiếu LỆCH | MAD-YUV 0,5314 (Y 0,5013 / U 0,5475 / V 0,6353), ≤8 99,83% → KHỚP |
| S5b: (b) crf18 e2e, so YUV, render qua FFmpeg | MAD-YUV 2,8985 (Y 2,9825 / U 2,6657 / V 2,7956), ≤8 96,72% → XẤP XỈ | MAD-YUV 0,4291 (Y 0,3870 / U 0,4991 / V 0,5278), ≤8 99,90% → KHỚP |
| S6: quét lân cận e2e crf18, so RGB (n=43/44/46/47) | 62,92 / 60,86 / 60,88 / 63,11 — cực tiểu vẫn ở n=45 (58,21) | 40,51 / 21,64 / 21,19 / 38,66 — cực tiểu sắc ở n=45 (1,66) |
| C0: không-transition, frame clip1@1.5 qua crf18 | format-only 0,5116 KHỚP; decode RGB 0,5310 KHỚP; decode YUV 0,0937 KHỚP | (chung 1 frame kiểm chứng) |

Đọc thêm từ bảng:

- **S3 = S2 tới 4 chữ số thập phân ở cả 2 type là đúng kỳ vọng,
  không phải bug:** crf0 mã hoá không mất mát các mẫu yuv420p đã
  subsample, nên decode RGB của nó phải trùng hệt RGB của đường
  format-only. Điều này khóa chặt rằng lượng tử hoá KHÔNG đóng góp
  gì ở bước crf0 — mọi chênh S4 − S3 đều là lượng tử crf18.
- **Phân rã ô LỆCH 58,21 của dissolve (miền RGB):** subsample
  57,78 (99,3% tổng) + lượng tử crf18 0,43 (S4 − S3 = 0,4261).
  Circleopen: subsample 1,49 + lượng tử 0,18 (S4 − S3 = 0,1782).
  **Encode không phải thủ phạm của "LỆCH ~50"; subsample mới là.**
- **S6 loại trừ lệch frame trong ô e2e:** n=45 là cực tiểu ở cả 2
  type (dissolve: các lân cận tệ hơn 2,7–4,9; circleopen: tệ hơn
  ~20–39). Số e2e tệ không phải do chọn sai frame khi decode mp4.
- **C0 chứng minh pipeline e2e tự nó lành trên nội dung thường:**
  cùng encode crf18 yuv420p, frame không-transition chỉ mất 0,53
  RGB / 0,09 YUV. Thảm họa 58 chỉ xảy ra với nội dung dissolve.

## 3. Cơ chế: vì sao dissolve nát còn circleopen thì không

Dissolve của xfade KHÔNG phải blend trung bình: mỗi pixel hoặc giữ
nguyên pixel A hoặc pixel B theo ngưỡng nhiễu frand tại p (mô hình
preview dùng `ffmpegDissolveFrand` — N5 đã chứng minh bằng số
0,0057). Hệ quả: khung dissolve là một bức tranh chuyển đổi ngẫu
nhiên từng pixel giữa 2 pattern bão hoà khác nhau — tần số chroma
cao nhất có thể. Khi khung đó đi qua subsample 4:2:0, mỗi mẫu chroma
là trung bình của 4 pixel không liên quan nhau, nên màu tái tạo sai
tới ~58 MAD ở miền RGB — dù các mẫu YUV gốc chỉ sai 2,90 sau encode
(§2, S5b). Circleopen thì khác: mỗi pixel hoặc thuần A hoặc thuần
B theo vùng hình học mịn, nên trong khối 2×2 chroma gần như đồng
nhất — subsample chỉ mất 1,49.

Hai dấu vết phụ khớp cơ chế này: (i) file mp4 dissolve e2e nặng
~6,8 MB cho 2 giây trong khi circleopen chỉ ~0,41 MB — khung
frand-switch gần như không nén được ở crf18; (ii) ngay cả plane Y
của dissolve e2e cũng mất 2,98 (so với 0,04 ở C0) — x264 ở crf18
làm mịn nhiễu luma tần số cao của khung switch. Cả hai đều là tính
chất của nội dung + codec, không phải lỗi mô hình transition.

## 4. Cảnh báo về chế độ (b) dùng hàm JS — chỉ đúng với nội dung mịn

`harnessShared.rgbToYuv420` (BT.601 limited, chroma trung bình hộp
2×2) khớp FFmpeg gần tuyệt đối trên nội dung thường: V0 = 0,0597
trên frame clip1, C0-yuv = 0,0937, circleopen S5 = 0,5314 (gần S5b
0,4291). Nhưng trên khung dissolve frand-switch, trung bình hộp
khác hẳn bộ lọc chroma của swscale: S5 (JS) đọc U = 7,6970 /
V = 6,4246 trong khi S5b (FFmpeg) chỉ U = 2,6657 / V = 2,7956 —
chênh đủ để đổi hạng từ XẤP XỈ thành LỆCH. **Kết luận: hàm JS chỉ
được dùng làm đối chứng nhanh cho nội dung mịn; số YUV chính thức
cho dissolve phải lấy bằng cách chuyển cả 2 phía qua FFmpeg (kiểu
S5b).** Không sửa hàm JS để "vừa" số dissolve — bộ lọc swscale
thật không tái tạo được bằng trung bình hộp, và ép vừa sẽ chỉ là
đổi ngưỡng trá hình. Hướng đúng nếu cần hàm JS chính xác hơn là
nghiên cứu bộ lọc swscale (ngoài phạm vi đợt này, xem §6).

Đối chứng ma trận (probe trên frame clip1, đã khóa bằng V0): BT.601
limited cho MAD-YUV tổng 0,0597; BT.709 limited cho 10,9102; BT.601
full-range cho 38,7253. Ma trận trong hàm JS là đúng; phần dư còn
lại là bộ lọc, không phải ma trận.

## 5. Chế độ đo mới gắn vào script v17 cũ (giữ chế độ cũ)

`server/render/src/test_v17_complex_parity.js` thêm flag
`--mode=old|rgb24|yuv` (mặc định `old`), chỉ đổi ô yuv420p e2e cuối
script; mọi ô trên giữ nguyên code và kết quả. Chạy đủ 3 mode
(mỗi lượt ~50 giây, exit 0):

| Mode | X tĩnh yuv420p-e2e dissolve | Các ô còn lại |
|---|---|---|
| old (mặc định) | 18,5792 / 43,95% LỆCH (= đúng số N6) | Không đổi: X tĩnh 0,0027/0,4855/0,0000; M chuyển động 0,0029/0,4937/0,0000; mirror 0,0000; pixelate 0,1293 — tất cả KHỚP |
| rgb24 | 18,5792 / 43,95% LỆCH (= old, đúng kỳ vọng) | Không đổi (chỉ xem đuôi log; nhánh mode chỉ nằm ở ô cuối) |
| yuv | MAD-YUV 3,5201 (Y 3,6170 / U 3,9328 / V 2,7198), ≤8 95,19% → V6-tham-chiếu XẤP XỈ | Không đổi |

Vì sao mode rgb24 trên v17 không đổi số: nguồn X của v17 là ảnh PNG
— đầu vào decode ra đã là RGB, nên ép rgb24 trước xfade là phép
không tác dụng (no-op). Điều này KHẲNG ĐỊNH lại cơ chế N5: mode (a)
chỉ có ý nghĩa với nguồn file mp4 yuv (clip1/clip2), không phải
phép màu chung. Số X-static 18,58 (thấp hơn 58,21 của clip) cũng
khớp cơ chế §3: nội dung X mịn hơn (gradient + nhiễu + khối) nên
subsample phá ít hơn pattern smptebars/testsrc2 bão hoà.

## 6. Đề xuất phạm vi badge — CHỈ ĐỀ XUẤT, KHÔNG tự sửa file badge

Luồng này KHÔNG sửa bất kỳ file badge/previewStatus nào (đó là
phạm vi luồng khác). Đề xuất để parent/luồng badge quyết:

1. **Giữ nguyên badge hiện tại ở mức "mô hình xfade rgb24"** — nay
   có thêm bằng chứng mode (a): clip1/clip2 KHỚP 0,0057 / 0,3820.
   Không dùng số e2e RGB để trừ điểm mô hình.
2. **Nếu muốn thêm một dòng e2e riêng, phải ghi nhãn tách bạch, ví
   dụ:** "yuv420p e2e, so miền YUV, cả 2 phía qua FFmpeg: dissolve
   XẤP XỈ 2,90 / circleopen KHỚP 0,43 (crf18)". Không gộp dòng này
   vào badge matched hiện tại, và không dùng số JS (S5) cho
   dissolve vì §4.
3. **Không đề xuất:** nâng ngưỡng V6; ép rgb24 vào pipeline render
   thật (N5 đã bác: đầu ra cuối vẫn là yuv420p nên chỉ thêm chuyển
   đổi vô ích); claim e2e KHỚP cho dissolve ở bất kỳ miền nào với
   crf18 (số thật cao nhất cũng chỉ là XẤP XỈ 2,90).
4. **Câu hỏi mở cho đợt sau (không mạo nhận đáp án):** muốn dissolve
   e2e lên KHỚP thì phải đổi cái gì — crf thấp hơn, preset khác,
   hay chấp nhận rằng frand-switch + yuv420p + crf18 vốn không lên
   được KHỚP? Cần đo crf quét (chưa đo đợt này) trước khi kết luận.

## 7. Nợ còn lại (trung thực)

- Số YUV-domain ở crf0 chưa đo (chỉ đo RGB ở S3): kỳ vọng ~0 nếu so
  kiểu S5b (vì crf0 giữ nguyên mẫu yuv420p), nhưng chưa đo thì
  không claim.
- Hàm JS `rgbToYuv420` chưa khớp bộ lọc chroma swscale trên nội
  dung switch từng pixel (S5 vs S5b ở dissolve). Dùng được cho nội
  dung mịn; số dissolve chính thức phải qua FFmpeg cả 2 phía.
- Cơ chế nội bộ của xfade-YUV trong FFmpeg 8.1.2 (nợ từ N5) vẫn chưa
  đọc tới source vf_xfade.c — không ảnh hưởng kết luận hay hướng
  sửa đo của đợt này.
- Footage máy quay THẬT vẫn chưa đo (repo không có file nào như
  vậy); mọi số trên chỉ đúng cho test pattern trong repo, không suy
  ra thành claim về footage thật.
- Script v17 giữ thư mục /tmp theo thiết kế gốc (không tự xoá);
  các lượt chạy đợt này đã dọn tay `/tmp/n6-complex-*` sau khi xong
  để giữ /tmp 512MB không đầy.

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `server/render/src/harnessShared.js` (SỬA — thêm `rgbToYuv420`,
  `yuv420Mad` + ghi chú header đợt 18; logic raster/preview cũ
  nguyên vẹn, không đổi 1 dòng ngữ nghĩa nào của chúng).
- `server/render/src/test_v17_complex_parity.js` (SỬA — thêm flag
  `--mode=old|rgb24|yuv` cho ô yuv420p e2e cuối + ghi chú header;
  chế độ `old` tái tạo đúng số N6 tới 4 chữ số thập phân).
- `server/render/src/test_v18_harness_yuv.js` (MỚI — script thang
  đối chứng S0–S6 + C0 + V0 trên clip1/clip2, dissolve + circleopen).
- `docs/PHASE9_ROUND18_HARNESS_YUV_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa `render.js`,
  preview, V11/V12/V13/V14, hay bất kỳ file badge/previewStatus nào.

## 9. Kiểm chứng đã chạy

- `node --check` cho cả 3 file JS: pass; kiểm thử nhanh hàm mới
  (khung 4×2: độ dài yuv đúng, tự so MAD = 0, khung lẻ throw đúng).
- `node src/test_v18_harness_yuv.js` (từ `server/render/`): exit 0,
  30,6 giây, toàn bộ số §2; thư mục /tmp của script tự xoá khi xong.
- `node src/test_v17_complex_parity.js --mode=old|rgb24|yuv`
  (3 lượt, mỗi lượt ~50 giây, exit 0): toàn bộ số §5; mode `old`
  tái tạo đúng số N6.
- KHÔNG chạy tsc/vite build: luồng này không sửa code TS nguồn web
  hay bất kỳ code sản phẩm nào, chỉ thêm/sửa script đo JS + docs —
  không có gì để tsc/build kiểm chứng thêm; không mạo nhận.
- KHÔNG chạy click-test browser thật (nợ mở chung của repo).
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage (parent
  sẽ stage).
