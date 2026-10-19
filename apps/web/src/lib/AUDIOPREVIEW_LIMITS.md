# AUDIOPREVIEW_LIMITS.md — Giới hạn trung thực của audio preview (R1-063)

Ngày: 2026-10-19. Quy tắc: chỉ ghi những gì đã kiểm chứng, không ghi "dự kiến".

## Cái đã làm thật

1. **Web Audio graph**: mỗi `HTMLMediaElement` (audio + video) → `MediaElementAudioSourceNode`
   → `GainNode` riêng → master `GainNode` → `AnalyserNode` → loa.
   Gain áp dụng: `volume × fadeIn × fadeOut × volumeKeyframes × mute`, thứ tự khớp
   render worker (`volume → afade in → afade out`).
2. **Volume keyframes**: spec mới `AudioClip.volumeKeyframes` (ghi đè `volume` tĩnh,
   ngữ nghĩa keyframes.ts). Preview áp dụng qua `interpolateKeyframes` — cùng công
   thức easing với render.
3. **Mute đúng**: track audio muted → bỏ qua; track video muted → gain 0;
   `sourceAudioMode="mute"` → gain 0 (trước đây preview vẫn phát tiếng kế thừa —
   đã sửa cho khớp render).
4. **Sync khi bấm play**: phát hiện cạnh lên của `playing` → seek chính xác mọi
   source trong cùng 1 task rồi mới `play()`. Khi đang phát, chỉ re-seek khi
   drift > 0.35s (tránh giật).
5. **VU meter**: đo sau master gain (đúng cái nghe được), throttle ~12Hz.
6. **Fallback**: không có Web Audio → `el.volume` trực tiếp (hành vi cũ).

## Giới hạn còn lại (đã kiểm chứng là đúng như mô tả)

1. **volumeKeyframes: render worker CHƯA áp dụng.** `validate.js` warn rõ ràng;
   export vẫn dùng volume/fade tĩnh. Parity gap có chủ ý, chờ render hỗ trợ.
2. **Sync ở mức "cùng task", không sample-accurate.** `HTMLMediaElement.play()`
   không đảm bảo khởi động cùng mẫu như `AudioBufferSourceNode.start(when)`.
   Với editor trên trình duyệt, độ lệch khởi động giữa các source thường < 50ms —
   nghe được là "cùng lúc" nhưng không phải đảm bảo toán học.
3. **Reverse audio**: preview vẫn phát XUÔI (giới hạn cũ từ SPEED — HTMLMediaElement
   không phát ngược). Render mới đảo mẫu thật. Đã ghi trong SPEED limits.
4. **2 clip cùng file media chia sẻ 1 element** (MediaPool cache theo item):
   gain của clip active ĐẦU TIÊN thắng; clip thứ hai cùng file không phát đồng
   thời được. Giới hạn kiến trúc cũ, không phải do R1-063.
5. **Video clip không có volume riêng trong spec** — audio kế thừa luôn gain 1
   (trừ mute). Muốn chỉnh riêng phải tách audio (chưa hỗ trợ — "detach" vẫn bị
   validator từ chối).
6. **AudioContext cần user gesture.** Lần bấm play đầu tiên mở context; nếu trình
   duyệt vẫn giữ "suspended", gesture tiếp theo (pointerdown/keydown) sẽ resume.
   Trước khi context mở, preview câm nhưng hình vẫn chạy.
7. **Một element chỉ gắn được 1 AudioContext.** Nếu code khác (hoặc 1 engine cũ
   chưa dispose) đã gọi `createMediaElementSource` cho element đó, `nodeFor`
   bắt lỗi và fallback về `el.volume`.
8. **VU meter là RMS của waveform**, không phải LUFS — chỉ để nhìn tương đối,
   không dùng đo loudness chuẩn.
9. **Chưa có**: solo track, pan/balance stereo, compressor/limiter, normalize,
   fade curve khác linear (render afade mặc định cũng linear — khớp nhau).
10. **Chưa test trên trình duyệt thật** (nợ chung hạ tầng của dự án) — logic gain
    được test bằng mock AudioContext trong Node (test-audioengine.sh).

## Cách chạy test

```bash
bash apps/web/scripts/test-audioengine.sh
```
