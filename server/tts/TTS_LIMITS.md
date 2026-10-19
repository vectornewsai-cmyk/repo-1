# TTS_LIMITS.md — Giới hạn trung thực của TTS local (R1-083, Batch H)

## Model đang dùng: VieNeu-TTS v3 Turbo (bản 0.5B)

- Package: `vieneu` trên PyPI (`pip install vieneu`), mode `v3turbo`.
- Engine: ONNX Runtime trên CPU (torch-free), 48kHz output.

## License đã VERIFY (2 nguồn độc lập, đọc trực tiếp 2026-10-19)

1. **PyPI package `vieneu`**: `pip show vieneu` →
   `License: Apache License Version 2.0` (full text Apache 2.0 trong METADATA).
2. **HuggingFace model repo** `pnnbao-ump/VieNeu-TTS-v3-Turbo`
   (model mà mode v3turbo tải): cardData `license: apache-2.0`.

→ **Apache 2.0 = an toàn thương mại.**

## ⚠️ BẪY LICENSE — BẮT BUỘC TRÁNH

- **Bản 0.3B là CC BY-NC 4.0 — CẤM dùng thương mại.** Dù nhanh gấp ~2x cũng
  KHÔNG được dùng.
- `tts.py` ép cứng `TTS_MODE = "v3turbo"` (bản 0.5B); không có CLI flag nào
  cho phép chọn bản khác. Nếu sau này package `vieneu` đổi bản mặc định,
  phải verify lại license trước khi nâng cấp (ghi trong requirements.txt).

## WATERMARK — ĐÃ TẮT

- VieNeu-TTS bật watermark âm thanh **mặc định** (`apply_watermark=True`
  trong `infer()`), dùng Resemble Perth watermarker.
- `tts.py` **luôn** gọi `tts.infer(text, voice=..., apply_watermark=False)`.
- JSON kết quả có field `"watermark": false` để bridge/UI kiểm chứng.
- Cách verify tay: `python tts.py --text "test" --out x.wav` rồi đọc JSON
  in ra — phải thấy `"watermark": false`.

## Đã loại trừ (có lý do)

- **ZeroTTS** (ZeroWeight AI, MIT): đã research kỹ nhưng chuyển sang VieNeu-TTS
  theo chỉ đạo (Apache 2.0 rõ ràng hơn trên PyPI, cộng đồng Việt dùng nhiều).
- **XTTS v2**: không hỗ trợ tiếng Việt tốt + license non-commercial.
- **F5-TTS**: CC-BY-NC — không dùng được cho sản phẩm thương mại.

## Giới hạn kỹ thuật

1. **25 giọng preset** tiếng Việt (Hải Đăng mặc định, Trúc Ly, Mai Anh...).
   Có voice cloning từ 3–5s mẫu audio nhưng **chưa expose qua UI/bridge**
   (chỉ preset).
2. **Model tải 1 lần** vào `server/tts/models/` (~2.3GB: backbone 1.8GB +
   codec 0.5GB). Lần đầu tải ~17 phút; các lần sau dùng ngay.
   Model KHÔNG commit (đã có trong .gitignore: `models/`).
3. **Giới hạn 2000 ký tự / lần gọi** (cả tts.py và bridge validate). Text dài
   hơn → chia nhỏ tay. (Model tự chunk theo câu ở max_chars=256 bên trong.)
4. Chất lượng tiếng Việt tốt, code-switching Việt–Anh được (12k giờ EN trong
   training theo công bố), nhưng tiếng Anh không phải thế mạnh — đừng kỳ vọng
   phát âm Anh chuẩn bản xứ.
5. WAV đầu ra 48kHz mono PCM 16-bit. Bridge xóa file tạm sau khi gửi xong.
6. Tốc độ đo thực tế trên CPU VM: ~0.4x realtime (9.5s synth cho 3.6s audio).
   Chậm hơn công bố (~2x realtime) do CPU VM yếu — trên máy user sẽ nhanh hơn.
7. **Chưa có**: word-level timestamps (không highlight karaoke theo giọng đọc),
   SSML, điều chỉnh tốc độ/cảm xúc qua UI.
8. TTS là tác vụ nặng → rate-limit như render (mặc định 20 req/phút/IP).
9. Chưa test trên Windows/macOS — mới chỉ chạy trên Linux CPU.
10. `tts.py` monkey-patch `OnnxV3LiteEngine._fetch` để codec dùng thư mục
    local (vì V3TurboVieNeuTTS không forward `codec_dir`). Nếu nâng cấp
    package `vieneu` và engine đã hỗ trợ `codec_dir`, bỏ patch này.
