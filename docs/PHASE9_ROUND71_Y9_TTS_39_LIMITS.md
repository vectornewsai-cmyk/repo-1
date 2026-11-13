# LIMITS — Phase 9 đợt 71, luồng Y9: kiểm tra lại TTS 39 CVE (nợ đợt 70 §4 mục 5)

Ngày: 09/11/2026 (lượt cron 09:35 +07; kiểm tra chạy ~09:38–09:45 +07).
Đóng nợ đợt 70 §4 mục 5 (X5/X9: TTS 39 CVE còn nguyên, chờ upstream).
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa requirements
production, KHÔNG chạm venv TTS production (.venv2) ngoài đọc version,
KHÔNG thử bump (kẹp vẫn còn — xem §1).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| gradio mới nhất trên PyPI (kiểm tra lại) | **6.31.0** (publish 2026-10-28T03:41:37Z) — **không có bản mới hơn** kể từ X5 (09/11 ~06:41); kẹp `pillow<13.0,>=8.0` **VẪN CÒN NGUYÊN** |
| vieneu mới nhất trên PyPI | **3.8.3** — không đổi; `requires_dist` vẫn có `gradio>=5.49.1` (không bỏ dep gradio, không kẹp trên) |
| pillow mới nhất trên PyPI | **13.0.0** — không đổi |
| pip-audit TTS (chạy lại) | **39, không đổi** — toàn Pillow 12.3.0, fix 13.0.0 (đếm lại từ output đầy đủ: 39 dòng `pillow`) |
| Bump trong venv thử nghiệm | **KHÔNG THỬ** — kẹp chưa gỡ nên điều kiện tiên quyết của brief chưa thỏa; thử lại sẽ chỉ tái hiện `ResolutionImpossible` đã chứng minh ở W7/U8 |
| requirements production | **KHÔNG SỬA** — `server/tts/requirements.txt` vẫn `vieneu==3.8.3`, `numpy==2.5.4` |
| Verdict | **VẪN CHỜ UPSTREAM — nợ vẫn mở.** Không có gì thay đổi kể từ X5 (~3 giờ trước) |

## 1. Kiểm tra upstream — nguồn thật, không đoán

### 1.1 Script kiểm tra (chạy lại, không sửa)

```
python3 scripts/check-gradio-pillow-cap.py
gradio latest on PyPI : 6.31.0 (published 2026-10-28T03:41:37)
gradio 6.31.0 pillow requirement: ['pillow<13.0,>=8.0']
vieneu latest on PyPI : 3.8.3
pillow latest on PyPI : 13.0.0
VERDICT: GRADIO STILL CAPS pillow<13 — TTS Pillow bump still
impossible (ResolutionImpossible). Debt stays open.
(exit 1)
```

Khớp đúng output X5 (09/11 ~06:41 +07). Script chỉ đọc metadata PyPI
(stdlib urllib), không tải wheel, không chạm venv.

### 1.2 Xác minh thêm bằng metadata trực tiếp (09/11 ~09:40 +07)

- `vieneu 3.8.3 requires_dist` (đọc từ PyPI JSON): vẫn chứa
  `gradio>=5.49.1` — vieneu chưa bỏ dep gradio, chưa kẹp gradio trên.
  Các dep còn lại không đổi (sea-g2p, onnxruntime, numpy, soundfile,
  soxr, kaldi-native-fbank, tokenizers, huggingface_hub, PyYAML,
  librosa, PyMuPDF extra pdf, …).
- Lịch sử release gradio (PyPI JSON, 681 release): mới nhất vẫn
  **6.31.0 — 2026-10-28T03:41:40Z**; trước đó 6.30.0 (08/10),
  6.29.1 (02/10). **Không có release nào sau 28/10** — tức là 12 ngày
  không có bản gradio mới. Đây là lần kiểm tra thứ 3 trong ngày 09/11
  (W7 ~03:50, X5 ~06:41, Y9 này ~09:40) đều ra cùng một kết quả.
- Venv TTS production đọc version (chỉ đọc, không cài/xóa):
  `server/tts/.venv2`: gradio **6.30.0**, pillow **12.3.0**,
  vieneu **3.8.3** — khớp requirements đã pin.

### 1.3 Vì sao KHÔNG thử bump trong venv thử nghiệm

Brief chỉ cho thử bump "nếu upstream đã gỡ kẹp". Kẹp chưa gỡ nên thử
bump chỉ lặp lại kết quả đã chứng minh ở W7/U8 (`ResolutionImpossible`
khi resolve `vieneu + Pillow 13.0.0`), tốn thời gian cài venv mà không
cho thông tin mới. Không có venv thử nghiệm nào được tạo trong luồng
này; không có smoke test TTS nào được chạy (không cần — không có gì
đổi để test).

## 2. pip-audit TTS chạy lại — 39 còn nguyên

Lệnh (venv audit của W1, `~/workspace/.tmp-r69w1/pip-audit-venv`,
pip-audit 2.10.1 — venv này vẫn tồn tại sau restart, không cần tạo lại):

```
~/workspace/.tmp-r69w1/pip-audit-venv/bin/pip-audit -r server/tts/requirements.txt
→ "Found 39 known vulnerabilities in 1 package", exit 1
```

- Toàn bộ 39 dòng đều `pillow 12.3.0`, Fix Versions `13.0.0` (đếm trực
  tiếp từ output: 18 PYSEC-2026-43xx + 20 CVE-2026-112xxx/CVE-2026-96xxx
  + 1 GHSA-78g4-xqwv-q3g8 = 39; danh sách đầy đủ trong log audit).
- So với X5/W1/U8: **không đổi số lượng, không đổi package, không đổi
  fix version, không có advisory mới, không có advisory nào biến mất.**
- Lưu ý nhỏ: lần chạy đầu dùng `--format text` bị pip-audit 2.10.1 từ
  chối (`invalid OutputFormatChoice value: 'text'`, exit 2) — chạy lại
  không có `--format` (format mặc định, như W1/X5) thì ra đúng 39.
  Không ảnh hưởng kết quả.
- Log đầy đủ: `workspace/goals/capcut-clone-video-editor/hidden_files/round71-y9-audit-tts.txt`
  (bookkeeping của goal, không phải file repo, không stage).

## 3. Đánh giá rủi ro — vẫn đứng (nhắc lại từ W7 §2, không đổi)

Pillow là dep transitive không bao giờ được gọi trong pipeline TTS:
`tts.py` không import gradio/Pillow, vieneu không import gradio lúc
inference, không parse file ảnh. Đây là đánh giá rủi ro, **không phải
lý do xóa nợ** — nợ chỉ đóng khi pip-audit TTS về 0.

## 4. Điều kiện mở lại nợ (khi nào thử lại)

Thử lại bump ngay khi **một trong hai** điều kiện sau thỏa (kiểm tra
bằng `scripts/check-gradio-pillow-cap.py` — script sẽ in `CAP LIFTED`
và exit 0):

1. **gradio ≥ 6.31.1 (hoặc bất kỳ bản nào mới hơn 6.31.0)** mà
   `requires_dist` không còn `pillow<13` — tức là gradio đã nới/gỡ kẹp
   `pillow<13.0,>=8.0`.
2. **vieneu > 3.8.3** mà `requires_dist` không còn dòng `gradio` —
   tức là vieneu đã bỏ dep gradio.

Khi đó làm theo lộ trình W7 §3 (đã có sẵn, không lặp lại ở đây):
dry-run resolve `vieneu + Pillow==13.0.0` trong venv TẠM → smoke-test
giọng mẫu → pip-audit về 0 → **mới** sửa `server/tts/requirements.txt`.
Cho tới lúc đó: **không tự ý sửa requirements thành trạng thái không
cài được, không thử bump lại định kỳ vô ích** — chỉ kiểm tra lại
metadata PyPI (rẻ, vài giây) mỗi đợt.

## 5. File đổi/thêm (batch phase9-round71-y9-tts39, KHÔNG push)

- `docs/PHASE9_ROUND71_Y9_TTS_39_LIMITS.md` — doc này (mới).
- KHÔNG đổi: `server/tts/requirements.txt`, `scripts/check-gradio-pillow-cap.py`,
  code `tts.py`, venv nào.
- Scratch/log không stage: `hidden_files/round71-y9-audit-tts.txt`
  (log pip-audit đầy đủ) — bookkeeping của goal.
- Stage file: `paths-loop/phase9-round71-y9-tts39.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 6. Nợ mở cho đợt sau

1. **TTS 39 CVE — VẪN MỞ, chờ upstream** (gradio gỡ kẹp `pillow<13`
   hoặc vieneu bỏ dep gradio). Lần kiểm tra gần nhất: 09/11/2026
   ~09:40 +07 — gradio mới nhất vẫn 6.31.0 (28/10/2026). Kiểm tra lại
   định kỳ bằng `scripts/check-gradio-pillow-cap.py`; chỉ thử bump khi
   script in `CAP LIFTED`.
2. Đây là lý do duy nhất job `pip-audit` sẽ ĐỎ ở lần chạy CI GitHub
   đầu tiên (xem X9 §5) — không đổi kể từ X9.
