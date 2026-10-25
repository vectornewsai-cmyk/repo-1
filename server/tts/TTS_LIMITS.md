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

## Cập nhật Phase 9 R4 (2026-10-24) — voice cloning + chia text dài

- **Voice cloning ĐÃ EXPOSE**: `tts.py --ref-audio PATH` (ghi đè `--voice`),
  bridge `POST /api/tts/clone` (multipart `refAudio` + `text`, cap 20MB,
  audio `.wav/.mp3/.m4a/.ogg/.flac/.webm`), UI checkbox "🎭 Clone giọng từ
  file mẫu" trong `TtsButton.tsx`. API thật của `vieneu` 3.8.3:
  `encode_reference()` trả tuple `(speaker_emb, ref_codes)`; `infer()` nhận
  `voice={"speaker_emb", "codes"}` hoặc `ref_audio=path`. tts.py enroll 1 lần
  rồi truyền dict cho mọi chunk. Mẫu tốt nhất 3–30s, một giọng rõ, ít nhiễu;
  file mẫu tối đa 120s (đo bằng ffprobe nếu có). Cùng model Apache-2.0, không
  cần verify license mới. Watermark vẫn TẮT ở cả 2 đường (preset + clone).
- **Giới hạn nâng 2000 → 5000 ký tự / lần gọi** (đồng bộ tts.py ↔ bridge).
  tts.py tự chia text thành chunk ≤ 800 ký tự theo biên câu (không cắt giữa
  từ; câu đơn quá dài tách ở dấu câu rồi khoảng trắng) và nối bằng crossfade
  20ms. JSON kết quả thêm `chunks` + `cloned`. Mối nối crossfade không nghe
  tiếng tách nhưng không phải sample-perfect (ngữ điệu biên câu vẫn là của 2
  lần infer riêng).
- Test thật 2026-10-24 (xem chi tiết trong `apps/web/src/lib/R4_LIMITS.md`
  §3.5): preset 116 ký tự → WAV 6.32s; clone từ file mẫu tổng hợp → WAV 2.64s,
  `cloned: true`; đa-chunk (text >800 ký tự) → xem §3.5.

## Cập nhật Phase 9 đợt 4 — agent D2 (2026-10-25): 3 việc R4 để dở đã xong

- **Combo clone + đa-chunk:** CLI thật 859 ký tự + `--ref-audio` →
  `cloned: true, chunks: 2, watermark: false`, WAV 39.99s. Không sửa `tts.py`.
- **Bridge live đầu-cuối:** `POST /api/tts/clone` qua HTTP thật → 200,
  WAV 39.64s, header `X-TTS-Chunks: 2`, `X-TTS-Cloned: 1`, thư mục tạm dọn
  sạch; 3 trường hợp lỗi (thiếu mẫu, text >5000, sai đuôi) đều 400 đúng.
  Thêm 2 header trên vào endpoint clone trong `server/bridge/src/index.js`.
- **Độ giống giọng (trung thực):** cosine speaker embedding (chính
  `encode_reference` của engine): ref x clone = **0.9160**, so với cùng
  giọng khác text 0.9202 và khác giọng 0.3376 → clone chuyển được đặc
  trưng giọng trên metric này. NHƯNG mẫu test là giọng TỔNG HỢP, không
  phải giọng người thật, và chưa có test nghe chủ quan — KHÔNG claim
  "giống giọng người thật". Chi tiết + script đo lại:
  `server/tts/D2_LIMITS.md`, `server/tts/test_d2_similarity.py`.
- Lưu ý chạy bridge clone: cần `TTS_PYTHON` trỏ venv có package vieneu
  (python hệ thống không có package này).

## Giới hạn kỹ thuật

1. **25 giọng preset** tiếng Việt (Hải Đăng mặc định, Trúc Ly, Mai Anh...).
   Voice cloning đã expose từ R4 (xem cập nhật trên).
2. **Model tải 1 lần** vào `server/tts/models/` (~2.3GB: backbone 1.8GB +
   codec 0.5GB). Lần đầu tải ~17 phút; các lần sau dùng ngay.
   Model KHÔNG commit (đã có trong .gitignore: `models/`).
3. **Giới hạn 5000 ký tự / lần gọi** (cả tts.py và bridge validate, từ R4).
   Text dài hơn vẫn bị từ chối rõ ràng. tts.py tự chia câu + nối crossfade
   (xem cập nhật R4 trên); model vẫn tự chunk ở tầng phoneme max_chars=256
   bên trong mỗi chunk 800 ký tự.
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
