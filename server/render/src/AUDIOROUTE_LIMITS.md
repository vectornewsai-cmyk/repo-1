# AUDIOROUTE_LIMITS.md — Giới hạn trung thực: Audio routing cho video nguồn (R1-015)

> Cập nhật: 2026-10-19. Commit kiểm chứng: (pending push)

## Đã làm được (có test thật)

- `sourceAudioMode: "inherit"` (mặc định): trích audio từ video source qua `[idx:a]`,
  áp cùng trim (`atrim`) + speed (`atempo`) + reverse (`areverse`) như audio clip,
  chuẩn hóa 48kHz stereo, mix vào output bằng `amix`.
- `sourceAudioMode: "mute"`: bỏ qua audio của video. Output vẫn có audio stream
  (track câm `anullsrc`) để giữ hợp đồng H.264+AAC.
- Test thật (`demo_audioroute.js`, 6/6 pass):
  - inherit → AAC stream, RMS -23.8dB (tiếng sine 440Hz thật)
  - mute → AAC stream, RMS -inf (câm hoàn toàn)
  - inherit + speed 2x → duration 2.50s (video và audio khớp nhau)
  - validate từ chối mode sai và `detach`.

## Chưa làm / giới hạn

1. **`"detach"` chưa hỗ trợ**: validate báo lỗi rõ ràng. Muốn tách audio thành clip
   riêng cần AssetStore + UI — để cho Batch C.
2. **Không có volume/fade riêng cho audio inherit**: dùng `volume`/`fadeIn`/`fadeOut`
   của VideoClip (nếu có) — hiện tại VideoClip chưa có các field này, nên audio
   inherit luôn phát ở volume gốc.
3. **Không kiểm tra file có audio khi inherit**: nếu file không có audio stream,
   FFmpeg sẽ lỗi `[idx:a]` không tồn tại. Validate có warn nhưng không chặn.
   Cần cải thiện: tự động fallback sang mute khi file không có audio.
4. **Reverse audio**: dùng `areverse` (đảo toàn bộ) — đúng về mặt kỹ thuật nhưng
   nghe không tự nhiên (tiếng nói đảo ngược). Đây là hành vi chuẩn của FFmpeg.
5. **atempo giới hạn**: speed 0.25x–4x dùng chain atempo (mỗi atempo chỉ 0.5–2.0).
   Đã xử lý qua `atempoFactors()` trong speed.js.
6. **Chưa test**: video có nhiều audio stream (chỉ lấy stream đầu tiên `[idx:a]`),
   audio 5.1 surround (downmix stereo qua `aformat`), VFR video + audio sync.

## Quyết định thiết kế

- Dùng chung helper `buildAudioChain()` cho cả audio clip và video inherit
  để đảm bảo trim/speed/fade logic nhất quán (tránh P0-07 tái diễn).
- `detach` báo lỗi thay vì im lặng bỏ qua (nguyên tắc trung thực của master plan).
