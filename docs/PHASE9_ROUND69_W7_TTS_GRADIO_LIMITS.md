# LIMITS — Phase 9 đợt 69, luồng W7: gradio mới có gỡ kẹp pillow<13 không?

Ngày: 09/11/2026 (lượt cron 03:35 +07). Nợ gốc: TTS 39 CVE (đợt 67 U8,
đợt 68 V1) — toàn Pillow 12.3.0, fix 13.0.0; gradio kẹp `pillow<13` nên
không bump được. KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG
chạm venv TTS thật (chỉ đọc metadata).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| gradio mới nhất trên PyPI | **6.31.0** (28/10/2026) — y hệt lúc U8 kiểm tra 08/11, **không có bản mới hơn** |
| Kẹp pillow của gradio 6.31.0 | **`pillow<13.0,>=8.0` — VẪN CÒN NGUYÊN** |
| vieneu mới nhất | **3.8.3** (23/09/2026) — không đổi, vẫn requires `gradio>=5.49.1` |
| pillow mới nhất | **13.0.0** — vẫn là bản fix pip-audit yêu cầu |
| Dry-run `vieneu==3.8.3 + numpy==2.5.4 + Pillow==13.0.0` | **ResolutionImpossible** (pip liệt kê toàn bộ gradio 5.49.1→6.31.0 đều đòi `pillow<13.0`) |
| Dry-run `gradio==6.31.0 + Pillow==13.0.0` | **ResolutionImpossible** — xung đột cô lập đúng ở gradio mới nhất |
| Dry-run baseline `vieneu==3.8.3 + numpy==2.5.4` | **Resolve OK** → gradio-6.31.0 + pillow-12.3.0 (requirements.txt hiện tại vẫn cài được) |
| TTS CVE | **39, không đổi** — nợ đóng lại là "không bump được, chờ gradio gỡ kẹp" |
| Server TTS có dùng gradio không | **Không** — `tts.py` không import gradio; gradio chỉ là dep transitive của vieneu, vieneu cũng không import gradio lúc inference |

## 1. Bằng chứng đã kiểm chứng (09/11/2026 ~03:50 +07)

- **Metadata PyPI** (chỉ đọc JSON API): gradio 6.31.0
  `requires_dist` chứa `pillow<13.0,>=8.0`; đối chiếu thêm 6.30.0 /
  6.29.1 / 6.29.0 / 6.25.0 (cùng kẹp) và 6.0.0 / 5.49.1
  (`pillow<12.0,>=8.0`). Không có release nào sau 6.31.0 trong toàn bộ
  681 release; không có pre-release mới hơn. Release notes GitHub
  `gradio@6.31.0` không nhắc tới "pillow".
- **Dry-run pip trong venv tạm** (`~/scratch-round69-w7/venv-test`,
  Python 3.12.3, pip 24.0, `TMPDIR` sang đĩa lớn): 3 test ở bảng §0 —
  2 thất bại đúng như dự đoán, 1 baseline thành công. Venv TTS thật
  `.venv2` không bị chạm (chỉ đọc `pip list`: gradio 6.30.0, Pillow
  12.3.0, vieneu 3.8.3).
- **Không có ứng viên nào** để làm tiếp bước tương thích API gradio hay
  pip-audit bộ pin mới — vì không tồn tại bộ pin mới resolve được.

## 2. Đánh giá rủi ro (trung thực, không giảm nhẹ)

39 advisory Pillow vẫn tồn tại trong venv TTS. Tuy nhiên Pillow ở đây
là dep transitive **không bao giờ được gọi**: `tts.py` không import
gradio/Pillow, vieneu không import gradio lúc inference; pipeline TTS
chỉ đọc text + model ONNX và ghi WAV, không mở/parse file ảnh nào — nên
bề mặt tấn công của các CVE Pillow (image parsing) không chạm tới dữ
liệu ngoài trong luồng TTS. Đây là đánh giá rủi ro, không phải lý do
xóa nợ: nợ vẫn mở cho tới khi upstream gỡ kẹp.

## 3. Lộ trình khi upstream thay đổi (đợt sau, chưa làm)

1. Chạy `python3 scripts/check-gradio-pillow-cap.py` — chỉ tiếp tục khi
   in `CAP LIFTED` (hiện in `GRADIO STILL CAPS pillow<13`, exit 1).
2. Dry-run trong venv tạm: `vieneu==3.8.3 numpy==2.5.4 Pillow==13.0.0`
   → phải resolve thành công.
3. Smoke-test venv tạm: `import gradio` + `import PIL` +
   `import vieneu` (unset proxy vars nếu httpx báo InvalidURL — quirk
   môi trường, xem §4), rồi verify lại TTS 25 giọng như U8 (0,543×
   realtime).
4. `pip-audit` bộ pin mới trong venv tạm → kỳ vọng 0 CVE, rồi mới sửa
   `server/tts/requirements.txt` (thêm `Pillow==13.0.0`) và rebuild
   `.venv2` trong đợt riêng có quyết định bump.
5. Đường thoát khác nếu gradio mãi không gỡ kẹp: chờ vieneu bỏ dep
   gradio (vieneu đã không dùng gradio lúc inference — chỉ là
   requires_dist thừa). Không khuyến nghị cài vieneu `--no-deps` để né
   gradio: làm requirements.txt mất tính tái lập. Không làm khi chưa có
   quyết định của user/parent.

## 4. Quirk môi trường ghi nhận

- `import gradio` trong `.venv2` chết ở `httpx` với
  `InvalidURL: Invalid port: ':1]'` do biến môi trường proxy của shell
  chứa port lỗi — không phải lỗi gradio, TTS không import gradio nên
  không bị ảnh hưởng.
- `/tmp` tmpfs 512M: dry-run/cài đặt nặng phải đặt TMPDIR sang đĩa lớn
  (đã dùng `~/scratch-round69-w7/tmp`).

## 5. File đổi/thêm (batch phase9-round69-w7-tts-gradio, KHÔNG push)

- `scripts/check-gradio-pillow-cap.py` (mới) — script stdlib kiểm tra
  nhanh gradio mới nhất + kẹp pillow; đã chạy thật, kết luận đúng
  (`GRADIO STILL CAPS pillow<13`, exit 1).
- `docs/PHASE9_ROUND69_W7_TTS_GRADIO_LIMITS.md` (doc này).
- Log chi tiết:
  `workspace/goals/capcut-clone-video-editor/hidden_files/round69-w7-tts-gradio.md`.
- KHÔNG đổi: `server/tts/requirements.txt`, code TTS, venv `.venv2`.
  Scratch venv tạm giữ tại `~/scratch-round69-w7/` để đợt sau dùng lại
  (không nằm trong batch).
