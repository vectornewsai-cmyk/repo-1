# SPEED CONTROL + REVERSE — Giới hạn & tích hợp (trung thực)

> Module: `src/speed.js` (`buildSpeedFilter`) · Spec: `packages/video-spec/src/speed.ts`
> UI: `apps/web/src/components/speed/` · Demo kiểm chứng: `../speed-demo.js`
> Ngày kiểm chứng: 2026-10-19 — 7/7 case PASS (duration ffprobe khớp kỳ vọng),
> 4 frame timecode xem bằng mắt khớp chính xác.

## Đã kiểm chứng THẬT (không nói suông)

| Case | Filter video | Filter audio | Kỳ vọng | Đo được (ffprobe) |
|---|---|---|---|---|
| slow 0.5x | `setpts=PTS/0.5` | `atempo=0.5` | 8.000s | video 8.000s / audio 7.981s ✅ |
| fast 2x | `setpts=PTS/2` | `atempo=2` | 2.000s | video 2.000s / audio 2.002s ✅ |
| fast 4x | `setpts=PTS/4` | `atempo=2,atempo=2` | 1.000s | video 1.000s / audio 1.002s ✅ |
| slow 0.25x | `setpts=PTS/0.25` | `atempo=0.5,atempo=0.5` | 16.000s | video 16.000s / audio 15.944s ✅ |
| fast 1.5x | `setpts=PTS/1.5` | `atempo=1.5` | 2.667s | video 2.666s / audio 2.669s ✅ |
| reverse | `reverse` | `areverse` | 4.000s | video 4.000s / audio 4.000s ✅ |
| reverse 2x | `reverse,setpts=PTS/2` | `areverse,atempo=2` | 2.000s | video 2.000s / audio 2.002s ✅ |

Kiểm chứng hình ảnh (testsrc2 có timecode nguồn in trên hình):
- slow 0.5x tại output t=1.0s → timecode `00:00:02.500` = 2 + 1.0×0.5 ✅
- fast 2x tại output t=1.0s → timecode `00:00:04.000` = 2 + 1.0×2 ✅
- reverse tại output t=0.3s → `00:00:05.667` (gần CUỐI đoạn nguồn [2,6)) ✅
- reverse tại output t=3.5s → `00:00:02.467` (gần ĐẦU đoạn nguồn) ✅
→ Đảo ngược đếm timecode NGƯỢC đúng như kỳ vọng.

## Giới hạn kỹ thuật (phải đọc trước khi dùng)

### 1. `atempo` chỉ nhận 0.5–2.0 mỗi lần gọi
FFmpeg giới hạn MỘT filter `atempo` trong khoảng 0.5–2.0. Module tự chain
nhiều lần (`atempoFactors`): 4x → `atempo=2,atempo=2`; 0.25x → `atempo=0.5,atempo=0.5`.
Đã kiểm chứng thật cả hai chiều (bảng trên). Tốc độ lẻ (1.37x, 1.5x…) vẫn đúng
duration, chỉ có nhịp frame không đều hoàn hảo — chấp nhận được.

### 2. `reverse` / `areverse` buffer TOÀN BỘ clip trong RAM
Hai filter này phải đọc hết clip mới phát ngược được. Clip 4K dài hàng phút
có thể ngốn hàng GB RAM và OOM. Khuyến nghị production: giới hạn reverse cho
clip ≤ 60s, hoặc tách đoạn dài thành nhiều đoạn ngắn rồi reverse từng đoạn.
Demo 4s/720p chạy nhẹ nhàng.

### 3. Audio GIỮ NGUYÊN CAO ĐỘ khi đổi tốc độ
`atempo` là phase vocoder: đổi tempo, không đổi pitch (giống chế độ mặc định
của CapCut). Muốn hiệu ứng "giọng chipmunk" khi tua nhanh thì phải dùng
`asetrate` + `aresample` thay cho `atempo` — chưa implement (có thể thêm option
`preservePitch` sau).

### 4. Audio của video clip NGUỒN vẫn bị bỏ qua
`render.js` Phase 1 chỉ lấy tiếng từ track `"audio"` riêng. Nếu clip video nguồn
có tiếng và user bật reverse/speed, phần tiếng đó vẫn bị bỏ qua như cũ —
không phải lỗi của module speed.

### 5. Đã tích hợp vào `render.js` / `validate.js` (cập nhật 19/10/2026, commit `1844e2cc`)
`buildSpeedFilter()` được gọi trong `buildFilterGraph` (video tại dòng 222,
audio tại dòng 398). `validate.js` chấp nhận field `speed`/`reverse` và kiểm tra
bất biến duration theo speed.

### 6. `store.ts` (editor) chưa tính speed ở trim/split
- `trimClip` mép phải: công thức đúng là `out = in + duration × speed`
  (hiện tại code `out = in + duration`, chỉ đúng khi speed=1).
- `splitAtPlayhead`: điểm cắt nguồn phải là `in + leftDur × speed`
  (hiện tại `in + leftDur`).
- `SpeedPanel` không can thiệp vào 2 thao tác này; cần chủ sở hữu store cập nhật
  bằng helper `outForDuration()` trong `speed.ts` (đã viết sẵn).

### 7. Text clip không có speed/reverse
Không có nguồn thời gian để tăng/giảm tốc — đúng theo thiết kế (CapCut cũng
không cho "tua nhanh" chữ, chỉ có animation riêng).

### 8. Import tạm bằng đường dẫn tương đối
`SpeedPanel.tsx` import `../../../../../packages/video-spec/src/speed`.
Để dùng `@repo-1/video-spec/speed` gọn gàng, cần thêm 1 dòng vào
`packages/video-spec/package.json` → `exports`: `"./speed": "./src/speed.ts"`
(chờ chủ sở hữu package — build hiện tại vẫn pass).

### 9. Tốc độ render
Slow-motion tăng số frame output (0.25x của 4s = 16s video) → render lâu hơn
tương ứng. Reverse phải decode hết clip trước khi xuất frame đầu → độ trễ
bắt đầu cao với clip dài. Đây là giới hạn cố hữu của FFmpeg, không phải bug.
