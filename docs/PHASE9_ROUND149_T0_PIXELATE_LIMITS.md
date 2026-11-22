# Đợt 149 — T0: Sửa bug pixelate (quyết parent đợt 148 §12.3(k), ƯU TIÊN CAO)

- **Nhiệm vụ:** sửa bug `npm test` FAIL ở demo_effects — effect pixelate lỗi render
  xác định; test nốt 5 effect sau pixelate chưa từng được test.
- **Ngày:** 20/11/2026 (lượt cron 03:35 +07 = 20:35:51Z 19/11/2026). FFmpeg 8.1.2,
  Node v24.22.1. Hạn cờ 23:00Z 19/11/2026.
- **File sửa:** `server/render/src/effects.js` (pixelate + self-test),
  `server/render/test_pixelate_render.js` (mới),
  `server/render/test_integration.sh` (nối test mới),
  `server/render/src/EFFECTS_LIMITS.md` (cập nhật hàng pixelate + § đợt 149),
  `server/render/src/test_v19_pixelate_probe.js` (ghi chú đầu file: probe khóa cơ
  chế scale cũ, không còn áp cho bản geq).
- **KHÔNG PUSH. KHÔNG release/tag. KHÔNG code giả.**

## 1. Bug gốc (tái hiện trước khi sửa)

`demo_effects.js` FAIL tại pixelate, exit != 0, libx264:

```
[vost#0:0/libx264] Could not open encoder before EOF
Task finished with error code: -22 (Invalid argument)
```

Nguyên nhân — filter cũ trong `effects.js` (từ Phase 8 Q4):

```
scale=iw/K:ih/K:flags=neighbor,scale=iw*K:ih*K:flags=neighbor   (K = 2+round(t*14))
```

`iw/K` bị cắt ngọn rồi nhân ngược nên kích thước ra SAI:

| K (intensity) | 640x360 → ra | Hậu quả |
|---|---|---|
| 13 (0.8, demo_effects) | **637x351 (lẻ)** | libx264 yuv420p từ chối → FAIL |
| 9 (0.5, test_q4 / T10-148 ghi 639) | **639x360 (lẻ)** | libx264 từ chối → FAIL |
| 3, 7 | lẻ | libx264 từ chối → FAIL |
| 6, 11, 12, 14, 15 | chẵn nhưng sai (630–638) | encode được nhưng **vỡ xfade/mask downstream** (đòi đúng WxH) |
| 2, 4, 5, 8, 10, 16 | đúng (chia hết) | không lỗi — nên parity đợt 17 chọn k=8 không lộ bug |

Chỉ K chia hết W,H mới đúng. Effects chạy SAU scale/pad về đúng WxH trong
`render.js` nên kích thước ra sai là lỗi pipeline, không chỉ lỗi encode.
Vì demo dừng ở pixelate nên 5 effect sau nó (mirror, old-film, invert,
edgedetect, hue-rotate) **chưa từng được test** — đúng như T10-148 ghi.

## 2. Kiểm tra các effect khác có cùng lỗi không

Rà toàn bộ `buildEffectFilter`: chỉ pixelate đổi kích thước khung hình.
- blur/sharpen/grayscale/sepia/vignette/noise/brightness/rgb-shift/glitch/
  old-film/invert/edgedetect/hue-rotate/mirror: không có filter đổi size.
- shake: `crop` iw-24/ih-24 rồi `pad` iw+24 khôi phục đúng kích thước gốc —
  an toàn khi W/H chẵn (điều kiện cả pipeline render vốn đã đòi vì yuv420p).

## 3. Bản sửa: pixelate bằng `geq` (giữ nguyên kích thước)

```js
// K = 2 + round(t*14) (2..16), F = floor(K/2)
geq=lum='lum(X-mod(X,K)+F,Y-mod(Y,K)+F)'
   :cb='cb(trunc(2*X/K)*K/2+F/2,trunc(2*Y/K)*K/2+F/2)'
   :cr='cr(trunc(2*X/K)*K/2+F/2,trunc(2*Y/K)*K/2+F/2)'
   :a='alpha(X-mod(X,K)+F,Y-mod(Y,K)+F)'
```

- Mỗi pixel lấy giá trị điểm mẫu trong khối của nó (đầu khối + floor(K/2)) —
  **đúng vị trí lấy mẫu đợt 19 đã khóa cho scale-neighbor** — nên kích thước
  ra = kích thước vào với MỌI K và MỌI W/H, kể cả lẻ. Không còn `scale`.
- Chroma lấy đúng vị trí luma `(bx+F)/2` (dạng trunc) để lưới khối chroma
  khớp lưới khối luma. Biến thể chroma khối riêng floor(K/2) đã đo tệ hơn
  hẳn trên ramp đối kháng (xem §5).
- **BẮT BUỘC có `alpha_expr`:** đã đo thực — geq thiếu `alpha_expr` sẽ ép
  alpha về 0 (clip alpha 640x360: alpha unique [0,128,200] → [0], 183.744/
  230.400 px đổi, max diff 200) — tức clip có alpha sẽ thành trong suốt
  hoàn toàn. Với `a='alpha(...)'`, alpha được pixel hoá cùng lưới luma
  (đo: 36 runs hàng y=100 ≈ khối 13px). Trên yuv420p (không có alpha plane),
  `alpha_expr` được bỏ qua, không lỗi (đã đo thực).
- Góc phải/dưới (khối cuối dở dang): điểm mẫu có thể vượt W-1/H-1 — geq
  clamp, không lỗi (đã đo: khối cuối hàng y=100 toàn pixel (0,255,255)).

## 4. Kiểm chứng (số đo thật)

### 4.1 `npm test` ĐẦY ĐỦ — PASS (chạy 2 lần, lần cuối với code chốt)

```
test:unit:       lut / effects / sticker / chroma / textfx / keyframes / mask — 7/7 self-test pass
test:integration: 11 pass, 0 fail (fixture 3 + demo lut/effects/sticker/chroma/transitions/textfx 6
                  + test_pixelate_render 1 + LUT có sẵn 1) — exit 0
```

### 4.2 `test_pixelate_render.js` (mới, đã nối vào `test_integration.sh` §4)

20 case render thật (5 size × 4 intensity) + 1 case alpha:

- Size: 640x360, 854x480, 1280x720, 360x640, 1920x1080.
- Intensity 0 / 0.5 / 0.8 / 1 (K = 2 / 9 / 13 / 16).
- Mọi case: ffmpeg exit 0, output đúng kích thước input, h264, duration
  1.00s (±0.15), file 18–750 KB.
- Frame thật sự pixel hoá: số đoạn màu (dung sai 4 mức/kênh — xem lưu ý dưới)
  trên hàng giữa: vd 640x360 K=13 → 43 runs (≈ 49 khối), K=16 → 10 runs;
  1920x1080 K=13 → 41 runs; 360x640 K=13 → 18 runs.
- Alpha: giữ nguyên tập giá trị alpha (0,129,201 — không bị ép về 0).

Lưu ý đo: đếm runs bằng bằng nhau tuyệt đối **sai** dưới encode libx264 lossy
(CRF 20 làm pixel trong cùng khối lệch nhau vài mức — lần chạy đầu cho
runs=90 thay vì ~49 ở K=13). Đã đổi sang dung sai 4 mức/kênh, có ghi chú
trong test. Đây là bẫy đo, không phải lỗi pixelate.

### 4.3 `demo_effects.js` — 16/16 PASS (lần đầu chạy hết)

Trước đây dừng ở pixelate (effect thứ 11). Nay cả 16 effect pass, 3.00s mỗi
clip: blur, sharpen, grayscale, sepia, vignette, noise, brightness, glitch,
rgb-shift, shake, **pixelate** (geq, 239 KB), **mirror, old-film, invert,
edgedetect, hue-rotate** — 5 effect sau pixelate lần đầu được test thật.

### 4.4 `test_q4_effects.js` (pipeline `render.js` thật, 320x180, 10 job)

Render 10/10 + measure 13/13 checks pass, gồm:
`pixelate khối hóa gradient: số đoạn màu hàng y=150: nguồn 212 → pixelate 71`
(trước đây pixelate ở K=9 ra 315x180 lẻ nên job này fail).

## 5. Parity canvas-vs-FFmpeg cho bản geq (đo bằng script scratch /tmp, không stage)

So với mô hình canvas `applyPixelate` (transpile `effectCanvas.ts` thật, khuôn
đo của `test_v19_pixelate_probe.js`):

| Case | geq yuv444 (không subsample) | geq yuv420 B (bản chốt) | geq yuv420 A (chroma K/2) | scale cũ (rgb24) |
|---|---|---|---|---|
| ramp 72x45, k=9 | MAD **0,43**, maxd 1 | MAD 4,03, maxd 173 | MAD 7,90, maxd 176 | MAD 0,67, maxd 1 |
| ramp 78x39, k=13 | MAD **0,37**, maxd 2 | MAD 3,75, maxd 169 | MAD 13,12, maxd 194 | MAD 0,67, maxd 1 |
| noisy 640x360, k=8 | MAD **0,40**, maxd 2 | MAD 1,64, maxd 129 | MAD 1,64 (= B khi K chẵn) | MAD 0,15, maxd 128 |
| posFrame (R=x,G=y) | — | MAD 1,85–1,92 | MAD 2,47–2,84 | MAD **0,00** |

Giải thích trung thực:

- **Cơ chế lấy mẫu của geq là đúng:** trên yuv444p (không subsample chroma),
  geq khớp canvas MAD 0,37–0,43, maxd ≤ 2 — tốt hơn cả scale cũ (0,67).
  Luma MAD ~0,2–0,3.
- **Phần dư lớn trên yuv420p là do subsample chroma, không phải do geq:**
  chỉ riêng roundtrip identity yuv420p (không pixelate gì) đã cho MAD ~1,6,
  yMAD ~1,4 so với canvas RGB. Trên nội dung thực (noisy 640x360, k=8),
  geq yuv420 MAD 1,64 — chỉ hơn sàn roundtrip 1,59 có ~0,05.
- Trên ramp đối kháng (pattern R=(x*4)%256 — chroma đổi từng pixel), chroma
  subsample + lấy mẫu khối khuếch đại sai số: B (chroma khớp lưới luma)
  MAD 3,75–4,03, vẫn tốt hơn hẳn A (7,90–13,12) → **chọn B**. Nhưng B vẫn
  trên sàn 1,6 — đây là giới hạn cố hữu của yuv420p với nội dung chroma tần
  số cao, không sửa được bằng cách chỉnh vị trí lấy mẫu (đã thử cả hai biến
  thể; biến thể căn luma toạ độ tuyệt đối còn tệ hơn: RGB runs 100 vs 90).
- **Hệ quả cho badge parity:** badge cũ (MAD ≤ 2, đo trên đường rgb24 của
  scale) KHÔNG còn áp nguyên văn cho pipeline yuv420p thật — sàn roundtrip
  đã ~1,6. Trên luma, geq giữ yMAD ~1,3–1,5 (≤ 2) nên tier KHỚP vẫn đứng
  theo luma; trên RGB với pattern đối kháng thì vượt. Đây là đo trung thực,
  không làm tròn lên thành "khớp".

## 6. Còn mở / nợ

1. **`test_v19_pixelate_probe.js` khóa cơ chế scale CŨ** (dư downscale trộn
   chroma MAD 0,6667, upscale chính xác...). Các khóa đó mô tả bản scale, không
   còn áp cho bản geq. Probe vẫn chạy được (nó hardcode filter riêng) nhưng
   kết luận của nó không còn là mô tả implementation hiện tại. Đã ghi chú ở
   đầu file probe + EFFECTS_LIMITS.md. **Cần một đợt sau cập nhật probe sang
   filter geq** (khóa lại: vị trí lấy mẫu floor(K/2), alpha không về 0,
   kích thước ra == kích thước vào) trước khi trích dẫn lại các khóa V19.
   Tương tự `test_v14_parity.js` / `test_v17_complex_parity.js` hardcode
   filter scale cũ cho pixelate — là hồ sơ lịch sử, không sửa.
2. Parity badge pixelate trong EFFECTS_LIMITS.md: giữ số đo Q4 cũ (212 → ~83)
   cho đường đo cũ; số đo geq mới ở §5 trên đây. Chưa có đợt nào chạy lại
   harness parity đầy đủ cho geq.
3. Hiệu năng geq chưa đo riêng (per-pixel eval). `demo_effects` 16 clip 3s
   640x360 chạy ~67s tổng (cả 16 effect, gồm noise 9 MB) — không thấy chậm
   bất thường; nếu clip dài/4K thì nên đo lại.
4. Không đụng mô hình preview canvas (`effectCanvas.ts` giữ nguyên — vị trí
   lấy mẫu đã khớp theo thiết kế) và không đụng `packages/video-spec`.

## 7. Tóm tắt file đổi (stage)

```
server/render/src/effects.js                          (sửa pixelate → geq + self-test)
server/render/test_pixelate_render.js                 (mới — render-test 20 case + alpha)
server/render/test_integration.sh                     (nối test mới vào §4)
server/render/src/EFFECTS_LIMITS.md                   (hàng pixelate + § đợt 149)
server/render/src/test_v19_pixelate_probe.js          (ghi chú đầu file)
docs/PHASE9_ROUND149_T0_PIXELATE_LIMITS.md            (mới — file này)
```

md5 (lúc stage): xem cờ `round149-t0.done`.
