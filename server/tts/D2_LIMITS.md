# D2_LIMITS.md — Hoàn thiện TTS voice cloning (Phase 9 đợt 4, agent D2)

Đợt R4 để dở 3 việc; D2 đã test xong cả 3 bằng chạy thật, KHÔNG PUSH.
Model duy nhất dùng: VieNeu-TTS v3 Turbo 0.5B, package `vieneu` đã cài,
mode ép `v3turbo` (Apache-2.0, đã verify từ trước). Không thêm model mới.

## 1. Combo clone + chia text dài — PASS, không cần sửa code

- CLI thật: `tts.py --text <859 ký tự> --ref-audio ref.wav` →
  JSON `cloned: true, chunks: 2 (671 + 187 ký tự), watermark: false`,
  WAV 48kHz mono 39.99s, synth 52.3s (~0.76x realtime — nhanh hơn mức
  0.39x của R4 vì lần này VM yên hơn; tốc độ phụ thuộc tải máy, đừng
  trích thành spec).
- Kết luận: đường `voice_dict` truyền cho mọi chunk (R4 viết) hoạt động
  ngay lần đầu, không phát sinh bug. `tts.py` KHÔNG sửa gì trong đợt D2.

## 2. Bridge live đầu-cuối — PASS (lần đầu R4 chỉ mới `node --check`)

- Bridge thật chạy cổng 8791 với `TTS_PYTHON` trỏ venv vieneu
  (python hệ thống không có package vieneu — chạy bridge clone bằng
  python3 mặc định sẽ fail, phải set `TTS_PYTHON` như trên).
- `POST /api/tts/clone` multipart (`text` + `refAudio`): HTTP 200,
  WAV 39.64s 48kHz mono, header `X-TTS-Voice: clone`,
  `X-TTS-Duration: 39.64`, `X-TTS-Chars: 859`, `X-TTS-Chunks: 2`,
  `X-TTS-Cloned: 1`. Thư mục tạm `tts-clone-*` đã dọn sạch sau khi gửi
  (chỉ còn `uploads-tmp` rỗng).
- Trường hợp lỗi đều trả 400 đúng: thiếu `refAudio`, text 5001 ký tự
  (> 5000), file mẫu sai đuôi (.txt). Watermark vẫn TẮT ở cả đường CLI
  và bridge (tts.py luôn `apply_watermark=False`).
- Thay đổi duy nhất trong đợt D2 (thuộc endpoint clone): thêm 2 header
  `X-TTS-Chunks` + `X-TTS-Cloned` vào `server/bridge/src/index.js` để
  client kiểm chứng được đường clone + đa-chunk từ ngoài. Không đụng
  endpoint preset `/api/tts`, không đụng file agent khác.

## 3. Độ giống giọng — số đo trung thực, KHÔNG claim quá

Phương pháp (`server/tts/test_d2_similarity.py`, chạy lại được): lấy
speaker embedding (192,) bằng CHÍNH `encode_reference()` của engine,
cắt mọi file về cùng 20s đầu (file ngắn hơn thì lấy toàn bộ), tính
cosine similarity. Kết quả 25/10/2026:

| Cặp so sánh | Cosine |
|---|---|
| ref x ref (encode 2 lần — tính xác định của encoder) | 1.0000 |
| Cùng giọng khác text: ref (Trúc Ly) x trucly_short2 (Trúc Ly) | 0.9202 |
| Khác giọng: ref (Trúc Ly) x preset_long (Hải Đăng) | 0.3376 |
| **CẦN ĐÁNH GIÁ: ref x clone_long** | **0.9160** |
| Đối chứng: preset_long x clone_long (cùng text, khác giọng gốc) | 0.3435 |

Đọc số đo đúng mức:

- **Ủng hộ:** clone đạt 0.9160, gần như bằng thang "cùng người nói"
  0.9202 và cao hơn hẳn thang "khác người" 0.3376. Đối chứng
  preset x clone chỉ 0.3435 chứng tỏ embedding phản ánh giọng nói chứ
  không phản ánh nội dung text (cùng text mà vẫn thấp). Nói cách khác:
  trên metric embedding của chính engine, clone đã chuyển được đặc trưng
  giọng của mẫu sang audio đầu ra.
- **KHÔNG được claim:** "giống giọng người thật". Toàn bộ test D2 dùng
  giọng mẫu TỔNG HỢP (preset Trúc Ly, 8.32s), không phải giọng người thật
  thu âm. Embedding similarity không phải test nghe chủ quan: tai người
  có thể vẫn nhận ra khác biệt mà cosine không bắt được (ngữ điệu, độ
  tự nhiên, nhiễu). Muốn claim giọng người thật cần: (a) mẫu thu âm thật
  có quyền sử dụng, (b) test nghe mù (blind listening) với nhiều người
  nghe — cả hai đều CHƯA làm.
- Thang số chỉ có ý nghĩa nội bộ với encoder này (192 chiều của
  VieNeu-TTS); không so sánh chéo với số cosine của hệ thống khác.

## 4. UI (TtsButton.tsx) — đọc code, KHÔNG sửa, chưa click-test

- Đường clone trong `TtsButton.tsx` đã đúng: FormData `text` + `refAudio`
  → `POST /api/tts/clone` → blob WAV → `importFiles` → `addMediaAtPlayhead`.
  Bridge E2E ở §2 chính là endpoint mà UI gọi, nên đường UI → bridge đã
  được chứng minh ở tầng HTTP. Click-test qua browser thật CHƯA làm
  (ngoài phạm vi D2; subagent không chạy live browser).
- Gợi ý trong UI vẫn đúng: mẫu 3–30s, một giọng rõ, ít nhiễu. Mẫu test
  D2 là 8.32s, nằm trong khoảng này.

## 5. Giới hạn còn lại (sau D2)

1. Chưa test clone với mẫu giọng NGƯỜI THẬT (thu âm) — mọi số đo D2 đều
   trên mẫu tổng hợp. Chưa có test nghe chủ quan.
2. Chưa test clone + text sát giới hạn 5000 ký tự (D2 test 859 ký tự →
   2 chunk; 5000 ký tự → ~7 chunk, chỉ tốn thời gian hơn, logic không đổi).
3. Chưa test file mẫu dài 120s (giới hạn tts.py) và mẫu nhiễu/nhiều người
   nói — engine không báo lỗi các trường hợp này, chỉ cho giọng kém.
4. Bridge clone chạy bằng `TTS_PYTHON` trỏ venv vieneu; nếu chạy bridge
   bằng python hệ thống thì endpoint clone fail (thiếu package) — cần ghi
   vào hướng dẫn chạy bridge (nợ tài liệu, không phải bug code).
5. Tốc độ tổng hợp phụ thuộc tải VM (D2 đo 0.76x realtime, R4 đo 0.39x
   lúc VM bận) — đừng trích một con số duy nhất làm spec.
6. File test D2 (WAV, log) nằm ở `~/workspace/d2-test/` (ngoài repo) —
   KHÔNG đưa vào batch push. Chỉ stage file code/tài liệu dưới đây.

## File đã tạo/sửa (KHÔNG PUSH)

- Tạo: `server/tts/test_d2_similarity.py` (script đo cosine, chạy lại được),
  `server/tts/D2_LIMITS.md` (file này).
- Sửa: `server/bridge/src/index.js` (chỉ thêm 2 header X-TTS-Chunks /
  X-TTS-Cloned trong endpoint `/api/tts/clone`), `server/tts/TTS_LIMITS.md`
  (thêm mục cập nhật D2, trỏ về file này).
- Không sửa: `server/tts/tts.py` (combo chạy được ngay, không cần sửa),
  `apps/web/src/components/TtsButton.tsx` (đường clone đã đúng),
  và mọi file ngoài phạm vi (đặc biệt không đụng `preview.tsx`, `store.ts`).
