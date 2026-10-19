# AUDIOFX_LIMITS.md — Giới hạn trung thực của Audio Effects (R1-076)

## Tổng quan

`audioEffects` trên AudioClip và VideoClip (tiếng kế thừa) hỗ trợ 5 hiệu ứng,
render bằng FFmpeg filter chain:
`atrim → asetpts(+speed) → aresample → aformat → [bass] → [treble] → [afftdn] → [acompressor] → [aecho] → volume → afade → adelay → amix`

## 1. Reverb không phải convolution reverb thật

Dùng `aecho` 3 taps (30|60|120ms) — tạo cảm giác không gian (spaciousness),
không phải reverb phòng thu bằng impulse response. Với delay đơn (1 tap),
hiện tượng **comb filtering** có thể triệt tiêu hoàn toàn một tần số
(đã đo: delay 45ms triệt tiêu sine 100Hz do lệch pha 180°); 3 taps phân tán
notch nên ổn định hơn nhưng vẫn là vật lý của echo, không tránh được hoàn toàn.

## 2. Noise reduction cần tín hiệu phù hợp

`afftdn` khử nhiễu ổn định (stationary noise). Ánh xạ: `nr = 4 + 20v`,
`nf = -50 + 25v` (v = 0..1). Với nhạc/tiếng đã sạch, bật 100% gần như không
đổi gì (đúng hành vi — không có nhiễu để khử). Không phải AI denoise;
tiếng ồn không ổn định (tiếng gõ phím, tiếng xe) khử kém.

## 3. Compressor: threshold nhập bằng dB, FFmpeg dùng linear

UI nhận `thresholdDb` (-60..0 dB) và đổi sang linear (`10^(dB/20)`) vì
`acompressor` dùng threshold linear (0.000976..1). Ngưỡng mặc định -20dB.

## 4. Preview chỉ áp dụng 1 phần

Web Audio có node tương đương native cho:
- bass/treble → BiquadFilter lowshelf ~100Hz / highshelf ~3000Hz
  (khớp tần số mặc định của filter `bass`/`treble` trong FFmpeg)
- compressor → DynamicsCompressorNode

**Render-only** (không có node Web Audio tương đương):
- reverb (`aecho`) — preview không nghe được reverb
- noiseReduction (`afftdn`) — preview không nghe được khử nhiễu

Preview EQ là xấp xỉ (đường cong Biquad ≠ đường cong `bass`/`treble` của FFmpeg),
không pixel-perfect về âm thanh.

## 5. Thứ tự cố định, không keyframe được

Thứ tự FX cố định: bass → treble → noiseReduction → compressor → reverb.
Không hỗ trợ automation/keyframe cho tham số FX (chỉ volume có keyframes).
Muốn đổi FX giữa chừng → split clip thành 2 clip với FX khác nhau.

## 6. Video clip: FX chỉ áp vào tiếng kế thừa

`audioEffects` trên VideoClip chỉ ảnh hưởng audio khi `sourceAudioMode="inherit"`.
Nếu `"mute"` → không có tiếng để áp FX. `"detach"` chưa hỗ trợ.

## 7. Cùng 1 file media trên 2 clip → FX của clip active đầu tiên thắng (preview)

Giới hạn kiến trúc MediaPool (đã ghi trong AUDIOPREVIEW_LIMITS.md): 2 clip
dùng chung 1 file media chia sẻ 1 HTMLMediaElement → filter params của clip
active đầu tiên được áp. Render không bị (mỗi clip render độc lập).

## 8. Chưa có

- Voice effects kiểu CapCut (chipmunk/robot/deep) — cần pitch-shift (`asetrate`
  + `aresample`), chưa làm
- Equalizer nhiều band (chỉ có bass/treble 2 band)
- Limiter/normalize theo LUFS
- Solo track, pan/balance
