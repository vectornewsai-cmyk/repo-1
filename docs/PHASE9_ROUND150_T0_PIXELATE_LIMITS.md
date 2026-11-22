# Đợt 150 — T0: Cập nhật test V19 pixelate sang cơ chế geq + đo hiệu năng geq riêng

- **Nhiệm vụ:** nợ §11.12 aggregate đợt 149 — cập nhật `test_v19_pixelate_probe.js`
  (vẫn khóa cơ chế scale cũ) sang cơ chế geq TRƯỚC KHI trích dẫn lại khóa V19;
  và ĐO HIỆU NĂNG geq riêng (đợt 149 chưa đo riêng).
- **Ngày:** 20/11/2026 (lượt cron 06:35 +07 = 23:35:51Z 19/11/2026). FFmpeg 8.1.2,
  Node v24.22.1. Hạn cờ ~01:30Z 20/11, dừng cứng 02:00Z.
- **Bối cảnh boot:** REBOOT #40 vừa xảy ra trước lượt cron — boot mới
  `e9295700-bda0-4a9b-8aab-4dd57661212e`, btime 23:32:09Z 19/11 (boot trước
  802f358f; uptime lúc mở phiên ~9 phút). Chốt chặn `round-in-progress.md`
  KHÔNG tồn tại lúc mở phiên.
- **File đổi:** `server/render/src/test_v19_pixelate_probe.js` (viết lại),
  `server/render/bench_pixelate_geq.sh` (mới),
  `server/render/src/EFFECTS_LIMITS.md` (cập nhật § đợt 149 + đính chính),
  `docs/PHASE9_ROUND150_T0_PIXELATE_LIMITS.md` (mới — file này).
- **`effects.js` KHÔNG đổi** trong đợt này (md5 vẫn `fedc0141` như đợt 149).
- **KHÔNG PUSH. KHÔNG release/tag. KHÔNG code giả.**

## 1. Những gì đã làm

1. Đọc `docs/PHASE9_ROUND149_LIMITS.md` §1 + §11.12 và
   `docs/PHASE9_ROUND149_T0_PIXELATE_LIMITS.md`: xác định đúng file test V19,
   cơ chế geq đã sửa (lấy mẫu đầu khối + floor(K/2), chroma khớp lưới luma,
   alpha_expr bắt buộc), và 2 nợ mở (V19 khóa scale cũ; hiệu năng geq chưa đo).
2. Đo scratch (script `/tmp`, không stage) để chọn ngưỡng khóa trung thực:
   MAD canvas-vs-geq trên yuv444p/yuv420p, kích thước ra, runs hàng giữa,
   alpha — rồi viết lại probe theo số đo thật, không theo kỳ vọng.
3. Viết lại `test_v19_pixelate_probe.js` sang geq: dùng CHUỖI FILTER THẬT từ
   `buildEffectFilter` (require `effects.js`), không hardcode bản sao; khóa
   mới 0/A/B/C/D/E (xem §3); các khóa scale cũ (MAD=0 tuyệt đối trên rgb24,
   tách dư downscale/upscale, footprint swscale) BỎ và ghi rõ lý do trong
   header file; hồ sơ cũ giữ nguyên trong
   `docs/PHASE9_ROUND19_G6_HARNESS_YUV_LIMITS.md` §6 (không sửa).
4. Viết `bench_pixelate_geq.sh`: đo geq vs filter scale cũ vs baseline trên
   4 size (640x360, 1280x720, 1920x1080, 3840x2160) × K = 2/9/13/16
   (intensity 0/0.5/0.8/1), nguồn testsrc2, đường yuv420p, `-f null -`,
   fps = frame / thời gian tường; 60 frame ở ≤1080p, 10 frame ở 4K.
5. Chạy probe mới (34/34 assert đạt), `npm test` đầy đủ, bench đầy đủ 36 cấu hình.
6. Cập nhật `EFFECTS_LIMITS.md` (§ đợt 149) + đính chính số yuv444 (xem §2).

## 2. Đính chính quan trọng: số geq-yuv444 trong LIMITS đợt 149 §5 là SAI đối với chuỗi filter thật

LIMITS đợt 149 §5 ghi geq-yuv444 MAD 0,37–0,43 trên ramp (tốt hơn cả scale cũ
0,67). **Đo lại độc lập bằng chuỗi filter THẬT từ `buildEffectFilter` cho
MAD 4,03–7,01 trên cùng các case ramp** (72x45 k=9: 4,03; 72x48 k=6: 7,01;
78x39 k=13: 5,86). Số 0,37–0,43 KHÔNG tái hiện được với chuỗi filter thật.

**Nguyên nhân đã xác định bằng thực nghiệm:** biểu thức chroma của bản chốt
(`cb(trunc(2*X/K)*K/2+F/2, ...)`) được viết cho chroma NỬA phân giải
(yuv420p — đường pipeline thật): trên yuv420p, X_chroma = X_luma/2 nên mẫu
rơi đúng (bx*K+F)/2, khớp lưới khối luma. Trên yuv444p (chroma full-res),
cùng biểu thức lấy HAI vị trí khác nhau trong một khối (nửa đầu khối lấy một
mẫu, nửa sau lấy mẫu khác) → chroma sai nửa khối → MAD phình. Kiểm chứng:
chạy geq với biến thể chroma full-res (`cb(X-mod(X,K)+F, Y-mod(Y,K)+F)`)
trên yuv444p cho đúng MAD 0,37–0,43, maxd ≤ 2 (72x45 k=9: 0,4333; 72x48 k=6:
0,4028; 78x39 k=13: 0,3704) — khớp đúng số đợt 149 ghi. Tức scratch đợt 149
đã dùng biến thể chroma đã sửa cho cột yuv444, KHÔNG phải chuỗi filter thật.

**Hệ quả:** số yuv444 trong LIMITS đợt 149 §5 không mô tả implementation đã
ship; đã đính chính trong `EFFECTS_LIMITS.md` § đợt 149. Đường pipeline thật
là yuv420p nên KHÔNG ảnh hưởng sản phẩm: trên yuv420p, geq đúng cơ chế
(yMAD 1,37–1,56 trên ramp, chỉ hơn sàn roundtrip ~1,30–1,60 một chút — xem
§3). Bài học: parity phải đo bằng đúng chuỗi filter `buildEffectFilter` trả
về, không đo bằng biến thể viết tay — probe mới khóa đúng nguyên tắc này
(require trực tiếp `effects.js`).

## 3. Khóa V19 mới (bản geq) — 34/34 assert đạt

Chạy: `cd server/render && node src/test_v19_pixelate_probe.js` (~22 s).
Lần chạy đầu RỚT 1 assert do chính test viết sai chuỗi kiểm tra ffprobe
(kỳ vọng `640,360,h264` nhưng ffprobe csv trả `h264,640,360`) — không phải
lỗi implementation; đã sửa chuỗi kiểm tra và chạy lại: **34/34 đạt, exit 0**.

### §0. Chuỗi filter thật (5 assert)

- Pixelate là `geq=`; có `:a='alpha(` (alpha_expr bắt buộc); KHÔNG còn
  `scale=iw`; K theo intensity đúng (0→2, 0.8→13, 1→16); lum lấy mẫu
  `lum(X-mod(X,13)+6, Y-mod(Y,13)+6)` — đầu khối + floor(13/2).

### A. Vị trí lấy mẫu đúng floor(K/2) — khóa theo LUMA (yMAD), 9 assert

Trên posFrame (R=x, G=y) so với canvas `applyPixelate` thật:

| Case | yuv444p yMAD (ngưỡng ≤ 0,5) | yuv420p yMAD (ngưỡng ≤ 1,6) |
|---|---|---|
| 72x48 k=6 | 0,3121 | 1,3682 |
| 72x48 k=8 | 0,2553 | 1,2721 |
| 72x45 k=9 | 0,3101 | 1,2782 |
| 78x39 k=13 | 0,3341 | 1,2983 |

- Nội dung nhiễu thật 640x360 k=8 (yuv420p): geq yMAD 1,3586 vs sàn
  roundtrip (không geq) 1,3005 → chênh 0,0581 (ngưỡng ≤ 0,15). **Kết luận:
  geq không làm lệch luma quá sàn roundtrip** — vị trí lấy mẫu đúng.
- RGB MAD trên posFrame (1,04–1,91) chỉ in, không assert: đó là nhiễu
  roundtrip YUV↔RGB, không phải sai vị trí (luma đã chứng minh vị trí đúng).

### B. Tier KHỚP theo luma trên ramp mịn (3 assert)

Ramp đối kháng (R=(x*4)%256), yuv420p: yMAD 1,3717 (k=6) / 1,3998 (k=13) /
1,5606 (k=9) — đều ≤ 2. RGB MAD 6,13 / 3,75 / 4,03 (maxd tới 173) CHỈ IN,
không assert: đó là sàn subsample chroma + pattern chroma tần số cao, không
phải lỗi lấy mẫu (luma vẫn ≤ 2). Badge KHỚP đứng theo luma như đợt 149 đã
ghi; trên RGB với pattern đối kháng thì vượt — ghi trung thực, không làm
tròn lên thành "khớp".

### C. Kích thước ra == kích thước vào (2 assert)

- 6 size × 6 K (640x360, 641x361, 639x359, 854x480, 1920x1080, 321x241 ×
  K=2/3/7/9/13/16): **36/36 đúng kích thước** (số byte ra == W×H×3).
- Encode libx264 thật, đúng case demo_effects từng FAIL (640x360, K=13):
  exit 0, ffprobe `h264,640,360`, file 62.866 byte.

### D. Khối hằng trên đường yuv420p (12 assert)

Hàng giữa posFrame 640x360/72x48, tol 0:

| Case | runs (kỳ vọng) | Lệch trong khối | max \|dY| trong khối |
|---|---|---|---|
| 72x48 k=8 (chẵn) | 9 == ceil(72/8)=9 | 0 | 0,00 |
| 640x360 k=16 (chẵn) | 40 == ceil(640/16)=40 | 0 | 0,00 |
| 640x360 k=13 (lẻ) | 75 ≤ 2×50=100 | xem dưới | 0,81 |
| 640x360 k=9 (lẻ) | 107 ≤ 2×72=144 | xem dưới | 0,82 |

- **K chẵn:** khối hằng tuyệt đối (runs đúng ceil(W/K), lệch 0) — chroma K/2
  nguyên nên lưới chroma khớp hoàn toàn lưới luma.
- **K lẻ — giới hạn thật, đã khóa đúng cơ chế:** chroma subsample 2x không
  căn được khối lẻ. Pixel chroma chia sẻ qua biên khối → pixel luma đầu
  khối kề mang chroma khối trước. Đo được: K=13 có 25 pixel lệch > 4 so với
  mẫu khối, K=9 có 32 pixel — **100% nằm tại x % K == 0 (mép khối)**,
  không pixel nào lệch giữa khối (assert khóa đúng điều này). Trên nội dung
  thật (chroma mịn) độ lệch này nhỏ, gần như không thấy; trên pattern
  chroma dốc (R=x) lệch tới 169–174 mức tại đúng các pixel mép khối.
  Đây là giới hạn cố hữu của yuv420p + K lẻ, không sửa được bằng cách chỉnh
  chuỗi filter (trừ khi chuyển sang yuv444p — tốn hiệu năng, xem §4).
- Luma (Y) hằng theo khối với MỌI K (max |dY| ≤ 0,82, ngưỡng ≤ 3) — luma
  full-res nên không chịu lỗi subsample.

### E. Alpha không về 0 (3 assert)

yuva444p 64x48 K=9, alpha vào {0, 128, 200} → alpha ra {0, 129, 201}
(±1 do roundtrip YUV); alpha hằng theo từng khối KxK. Đối chứng: cùng
filter nhưng BỎ `:a='...'` → alpha ra [0] (toàn bộ trong suốt) — chứng minh
trực tiếp alpha_expr là bắt buộc, không phải quy ước.

## 4. Hiệu năng geq — đo riêng (lần đầu)

Script: `server/render/bench_pixelate_geq.sh` (testsrc2, đường `format=yuv420p`
+ filter, `-f null -`, fps = frame / thời gian tường, mỗi cấu hình 1 lần;
60 frame ở ≤1080p, 10 frame ở 4K). Chạy 00:02:30–00:07:32Z 20/11; load
average lúc bắt đầu 1,81 → lúc kết thúc 10,12 (các luồng đợt 150 khác chạy
song song) — geq đơn luồng nên tải đồng thời làm số fps thấp đi trực tiếp;
số dưới đây là cận dưới dưới tải, nhưng bậc độ lớn là đúng (thông lượng
~3,4–4,1 Mpx/s/ luồng là đặc tính đã biết của geq).

| Size | baseline | scale cũ K=2/9/13/16 | **geq K=2/9/13/16** |
|---|---|---|---|
| 640x360 | 400 | 250 / 286 / 300 / 375 | **15,46 / 16,13 / 17,29 / 16,76** |
| 1280x720 | 273 | 214 / 158 / 240 / 300 | **4,54 / 4,48 / 4,72 / 4,23** |
| 1920x1080 | 128 | 87 / 188 / 150 / 154 | **1,97 / 1,82 / 1,80 / 1,85** |
| 3840x2160 (10f) | 40 | 17,9 / 33,3 / 34,5 / 35,7 | **0,43 / 0,41 / 0,40 / 0,40** |

Đơn vị: fps. Lưu ý: fps baseline/scale ở 60 frame bị chi phối bởi thời gian
khởi động (wall 0,15–0,7 s) nên chỉ có ý nghĩa bậc độ lớn; các lần chạy geq
dài (3,5–33 s) nên số geq đáng tin hơn.

**Kết luận hiệu năng:**

- geq KHÔNG phụ thuộc K (cùng chi phí tính biểu thức mỗi pixel với mọi K):
  ~16 fps @ 360p, ~4,5 fps @ 720p, ~1,9 fps @ 1080p, ~0,4 fps @ 4K.
- geq chậm hơn scale cũ khoảng **15–25 lần @ 360p, 35–60 lần @ 720p,
  45–90 lần @ 1080p, 45–85 lần @ 4K** — cái giá của "giữ đúng kích thước".
- Chi phí render thực tế (clip 30 fps, chỉ tính riêng effect pixelate):
  360p 10 s ≈ 18 s; 720p 10 s ≈ 67 s; **1080p 10 s ≈ 162 s (~2,7 phút)**;
  **4K 10 s ≈ 750 s (~12,5 phút)**. Đối chứng độc lập: lần đo scratch 4K
  K=13 với 150 frame từng chạy > 7,5 phút chưa xong rồi bị cắt (tương đương
  < 0,33 fps) — khớp bench 0,40 fps.
- Preview không bị ảnh hưởng (preview dùng canvas `effectCanvas.ts`, không
  chạy geq); chỉ render export chịu chi phí này. Demo_effects 16 clip 3 s
  640x360 chạy ~67 s tổng ở đợt 149 là nhất quán với ~16 fps của geq.
- Hướng nhanh hơn cho đợt sau (CHƯA làm, CHƯA đo — chỉ ghi hướng): thay
  geq bằng `scale` xuống rồi `scale` TRỞ LẠI đúng W:H (không phải `iw*K`,
  vốn là lỗi cũ) — vẫn nhanh như scale cũ nhưng cần đo parity trước vì vị
  trí lấy mẫu của swscale khi upscale về kích thước không chia hết có thể
  lệch khỏi canvas floor(x/K) ở một số x; hoặc giữ geq nhưng chỉ chạy trên
  vùng cần thiết. Không đổi implementation trong đợt này khi chưa có số đo.

## 5. Kiểm chứng tổng

- `node src/test_v19_pixelate_probe.js`: **34/34 assert KHÓA-ĐẠT, exit 0**
  (chạy lại lần 2 sau khi sửa chuỗi kiểm tra ffprobe — xem §3).
- `npm test` ĐẦY ĐỦ (repo root): **exit 0** — unit 7/7 self-test pass
  (lut/effects/sticker/chroma/textfx/keyframes/mask); integration **11 pass,
  0 fail** (fixture 3 + demo lut/effects/sticker/chroma/transitions/textfx 6
  + test_pixelate_render 1 + LUT có sẵn 1). demo_effects vẫn 16/16 PASS.
  Thời gian chạy ~3m16s.
- `bench_pixelate_geq.sh`: 36/36 cấu hình chạy xong, 0 FAIL.
- `effects.js` không đổi: md5 `fedc0141` (khớp đợt 149).

## 6. Còn mở / nợ

1. **Probe V19 chưa nối vào `test_integration.sh`:** vẫn chạy độc lập như từ
   đợt 19 (quy ước cũ). Nối vào sẽ đổi số đếm integration 11 → 12 — để đợt
   sau / parent quyết, không tự đổi trong đợt này để khỏi lệch đếm chéo
   (T1/T10 đếm suite theo 11 pass).
2. **Fringe chroma K lẻ trên yuv420p** (xem §3 D): ~25–32 pixel/mỗi hàng
   640 px trên pattern đối kháng mang chroma khối kề; nội dung thật gần như
   không thấy. Không sửa được bằng chuỗi filter khi còn ở yuv420p.
3. **geq chậm** (xem §4): 1080p ~1,9 fps, 4K ~0,4 fps. Render clip dài có
   pixelate sẽ rất chậm. Hướng nhanh hơn ở §4 chưa đo — nợ đợt sau.
4. Số bench mỗi cấu hình chỉ chạy 1 lần, dưới tải đồng thời của các luồng
   đợt 150 (load tới 10,12) — số geq là cận dưới; đo lại trên máy nhàn sẽ
   cao hơn một chút nhưng không đổi bậc độ lớn.
5. Nợ đứng giữ nguyên (không đụng trong đợt này): TTS 39 cấm kiểm lại;
   ci-security.yml 403 chờ user; G1/R9 chờ user (để yên, không nhắc lại).

## 7. Tóm tắt file đổi (stage)

```
server/render/src/test_v19_pixelate_probe.js          (viết lại sang geq — khóa mới 0/A/B/C/D/E)
server/render/bench_pixelate_geq.sh                   (mới — bench geq vs scale cũ vs baseline)
server/render/src/EFFECTS_LIMITS.md                   (cập nhật § đợt 149 + đính chính yuv444)
docs/PHASE9_ROUND150_T0_PIXELATE_LIMITS.md            (mới — file này)
```

Cờ: `workspace/goals/capcut-clone-video-editor/hidden_files/round150-t0.done`
(00:15Z 20/11/2026 — trong hạn cờ ~01:30Z).
