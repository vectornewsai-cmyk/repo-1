# P3_LIMITS.md — Speed curve + audio mixer (Phase 7 P3)

Tài liệu giới hạn trung thực cho 2 tính năng P3. Mọi khẳng định dưới đây đều
đã được kiểm chứng bằng `server/render/test_p3.js` (68 test, render thật).

## 1. Speed ramp (`clip.speedKeyframes`)

### Đã làm được (đã test thật)
- Easing `linear | ease-in | ease-out | bezier` (cubic-bezier kiểu CSS, giải
  Newton + bisection fallback). Easing của keyframe BẮT ĐẦU đoạn áp cho đoạn đó
  (cùng quy ước `keyframes.ts`).
- Render bằng chia đoạn ~0.2s (tối đa 240 đoạn, clip dài tự giãn đoạn ra):
  mỗi đoạn tốc độ hằng = `speedAt` tại giữa đoạn, video `trim + setpts`,
  audio `atrim + atempo`, rồi `concat`. Tổng thời lượng output = `clip.duration`
  đúng theo thiết kế; A/V lệch < 0.15s (đo bằng ffprobe 2 stream).
- Mapping nguồn đã kiểm chứng bằng màu: nguồn đỏ 0–3.5s + xanh 3.5–7s, curve
  1→2 tuyến tính trên 4s → frame t=2.0 đỏ, t=3.0 xanh (đúng `src(t)=t+t²/8`).
- Ramp + transition xfade: render được, frame giữa xfade blend thật
  (R=134, B=117). Cần `fps` sau `concat` để khôi phục timebase 1/fps, nếu không
  xfade báo `timebase do not match` (đã gặp và đã sửa trong `speedramp.js`).
- Toán đường cong có 3 bản mirror nhau, parity test tự động:
  `packages/video-spec/src/speedcurve.ts` ↔ `speedcurve.js` (ESM mirror) ↔
  `server/render/src/speedramp.js` (CJS). Đổi công thức ở 1 nơi PHẢI đổi cả 3
  (test parity sẽ fail nếu lệch).

### Ngữ nghĩa cần nhớ
- `t` của keyframe = thời gian OUTPUT tính từ đầu clip, `v` = tốc độ tại đó.
- `duration` vẫn là thời lượng OUTPUT. Nguồn tiêu thụ = ∫ speed(t) dt.
  Khi có `speedKeyframes`, `speed` hằng số bị BỎ QUA (validator cảnh báo) và
  `out` KHÔNG còn là biên nguồn — render dùng `in + ∫speed` (validator in
  warn ghi rõ nguồn tiêu thụ).
- Tốc độ từng đoạn là tốc độ tại GIỮA đoạn, không phải tốc độ tức thời từng
  frame: với đường cong dốc, sai số mapping ≈ đạo hàm tốc độ × 0.1s (nhỏ hơn
  1 frame ở 30fps với các curve thông thường; curve bezier cực dốc có thể
  thấy bước nhảy nhẹ ở biên đoạn 0.2s).

### KHÔNG hỗ trợ (validator chặn bằng lỗi, không lặng lẽ bỏ qua)
- `reverse=true` + `speedKeyframes` → lỗi (đảo ngược timeline + ramp chưa
  định nghĩa được thứ tự đoạn).
- `enhance.stabilize` + `speedKeyframes` → lỗi (vidstab detect chạy theo trim
  gốc, không khớp các đoạn ramp; transform sẽ sai toàn bộ đoạn sau đoạn đầu).
  Deinterlace (yadif) và denoise (hqdn3d) vẫn cho phép cùng ramp — chúng là
  filter gần như theo từng frame, chỉ mất ngữ cảnh 1 frame ở biên đoạn.
- Speed keyframe `v` ngoài 0.25–4 → lỗi (giống speed hằng số).
- Clip ramp trong transition: keyframes scale/rotation vẫn bị bỏ qua theo
  luật chung của transition (xem KEYFRAMES_LIMITS.md), không phải luật riêng P3.

### Chưa làm (gap, ghi rõ)
- **Preview speed ramp:** preview vẫn dùng `clip.speed` hằng số cho
  `playbackRate` (xem `preview.tsx`). Ramp chỉ đúng ở render. P1 sở hữu
  preview parity — không sửa ở đây để tránh xung đột.
- **Nguồn không đủ dài:** nếu file nguồn ngắn hơn `in + ∫speed`, render sẽ
  thiếu frame ở cuối clip (concat ngắn hơn duration, timeline pad nền).
  Validator KHÔNG chặn trường hợp này (chỉ warn nguồn tiêu thụ) vì độ dài
  file chỉ biết ở validateMedia; hiện validateMedia chỉ kiểm tra `out`,
  không kiểm tra `in + ∫speed` ở ramp mode. User cần tự đảm bảo nguồn đủ dài.

## 2. Audio mixer

### Đã làm được (đã test thật bằng đo dB/LUFS)
- **Track volume** (`track.volume`, 0..2, mặc định 1): nhân vào gain mọi clip
  audio trên track và audio kế thừa của clip video. Đo thật: 0.5 → −6.02 dB
  (±1.0). UI: slider trong Inspector (section "Âm lượng track", tối đa 200%).
- **Fade theo đường cong** (`fadeInCurve`/`fadeOutCurve`:
  `linear | ease-in | ease-out | sine`, mặc định `linear`): đo thật cửa sổ
  0.4–0.6s của fadeIn 2s — sine to hơn linear ≈ 3.7 dB (±1.5), đúng lý thuyết
  (sin(22.5°) = 0.383 so với 0.25).
- **volumeKeyframes đã nối sang render** (trước đây chỉ preview): render dùng
  1 filter `volume='EXPR':eval=frame` gộp vol × fadeIn × fadeOut × keyframes
  × trackVolume. Đo thật: tone 1→0.25 tuyến tính, chênh 2 cửa sổ ≈ 9.78 dB
  (±1.5), đúng lý thuyết. Cảnh báo cũ "render worker chưa áp dụng" đã được gỡ
  khỏi `validate.js`.
- **Normalize export** (`--normalize loudnorm|dynaudnorm`, qua bridge preset
  whitelist + UI ExportPanel): áp SAU `amix` trên stream đã mix. Đo thật bằng
  ebur128: loudnorm về −14 LUFS, integrated đo được trong ±1.5 LU.
  Dynaudnorm chỉ smoke test (render được, đúng duration) — không đo LUFS vì
  dynaudnorm không có target LUFS cố định.
- **Đường cũ không đổi:** clip không có volumeKeyframes và fade linear vẫn đi
  đường `volume` + `afade` tĩnh như trước (buildGainFilter trả null) — các
  test audiofx/trackcontrols/color/mask cũ vẫn xanh.

### Ngữ nghĩa cần nhớ
- `volumeKeyframes` GHI ĐÈ `volume` tĩnh (giống preview), KHÔNG nhân với nó.
- Gain expression clamp dưới ở 0 (`max(0, ...)`) nhưng KHÔNG clamp trên ở 1:
  track.volume tới 2 cho phép boost thật (+6 dB). Preview cũng clamp [0, 2]
  cho khớp.
- `t` trong expression là thời gian cục bộ từ đầu clip (sau
  `asetpts=PTS-STARTPTS`), không phải thời gian timeline — nên `adelay` đặt
  sau expression vẫn đúng.
- Normalize là tùy chọn EXPORT (panel Xuất MP4), không phải thuộc tính clip
  hay project. Project câm (không có audio segment) thì normalize bị bỏ qua
  — loudnorm không áp lên track `anullsrc` câm.

### KHÔNG hỗ trợ / lưu ý
- Normalize 1-pass loudnorm: FFmpeg tự chọn linear gain + true-peak limiting
  khi có thể; với audio đã quá to, output có thể bị limiter làm méo nhẹ thay
  vì đạt đúng target (bản chất của loudnorm 1-pass, không phải lỗi P3).
  Muốn chính xác tuyệt đối cần 2-pass (đo rồi render lại) — chưa làm.
- Dynaudnorm có thể làm thay đổi cảm nhận động (tự động gain theo cửa sổ):
  chỉ dùng khi muốn "cân bằng" chứ không phải giữ nguyên bản mix.
- Fade cong chỉ áp cho `fadeIn`/`fadeOut` của AudioClip. Video clip không có
  fade audio riêng — tiếng kế thừa dùng fade của... không có (video không có
  field fade); muốn fade tiếng video thì tách audio ra track riêng.

## 3. File thay đổi (P3, không push)

- `packages/video-spec/src/speedcurve.ts` (+ ESM mirror `speedcurve.js`,
  + export `"./speedcurve"` trong `package.json`, + `FadeCurve` trong
  `audio.ts`, + field `speedKeyframes`/`fadeInCurve`/`fadeOutCurve`/`Track.volume`
  trong `index.ts`).
- `server/render/src/speedramp.js`, `audiomix.js` (mới); `render.js` (nối
  ramp/audio/normalize/CLI); `validate.js` (luật ramp + track volume + fade
  curve + gỡ warn volumeKeyframes cũ); `P3_LIMITS.md` (file này).
- `server/bridge/src/index.js` (whitelist preset normalize).
- `apps/web/src/ExportPanel.tsx` (UI normalize), `Inspector.tsx` (fade curve
  + track volume), `store.ts` (`patchTrack`), `lib/audioEngine.ts`
  (`computeClipGain` + fade curve + trackVolume), `preview.tsx` (truyền
  track.volume + curves).
- `server/render/test_p3.js` — 68 test, chạy `node test_p3.js` (parity TS
  chạy được luôn trên Node 24 nhờ type stripping mặc định).
