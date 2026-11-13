# LIMITS — Phase 9 đợt 67, luồng U8: bump Pillow/rembg (bgremove 66 → 0) + TTS 39 không bump được + README

Ngày: 08/11/2026 (lượt cron 21:35 +07). Đóng nợ đợt 66 §8 mục 8 (T10):
pip-audit tts 39 + bgremove 66 lỗ hổng (Pillow/rembg), `npm audit` local bị
chặn, README.md stale từ Phase 8. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Luồng này BỊ CRON TIMEOUT trước khi stage batch, viết LIMITS doc, cập nhật
> build-loop-log và tổng chờ push. Doc này do parent đợt 67 (main chat) viết
> từ `hidden_files/round67-u8.md` + file trên đĩa; batch u8
> (`server/bgremove/requirements.txt`, `README.md`, doc này) stage trong
> đợt 69 W1 (cùng batch verify — xem docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md).
> **CẬP NHẬT 09/11 (đợt 69 W1): pipeline bgremove đã verify PASS end-to-end
> trên venv mới; backup `.venv-py310-bak` đã xóa; OSV npm vẫn timeout
> (xem §4/§5/§8 dưới). Mọi số dưới đây là số đo thật từ log
> luồng U8; chỗ nào chưa có kết quả cuối ghi rõ.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| bgremove pip-audit sau bump | **SẠCH: 66 → 0** ("No known vulnerabilities found", exit 0) |
| TTS pip-audit | **39, KHÔNG BUMP ĐƯỢC** (gradio kẹp `pillow<13` — đã chứng minh ResolutionImpossible; xem §2) |
| Tổng 2 file | 105 → 39 |
| Venv bgremove | Rebuild **Python 3.10 → 3.12** xong, `import rembg` OK; venv cũ giữ làm backup `.venv-py310-bak` (706M) tới khi verify pipeline xong |
| TTS verify (không bump) | PASS: 25 giọng, "Hải Đăng" 86 ký tự → WAV 422.444 B, 4,40 s audio, 48 kHz, watermark false; synth **0,543× realtime** (trong baseline 0,12–0,75×) |
| npm audit local | **BỊ CHẶN ở tầng egress proxy** (403 `policy_denied` trên POST `/-/npm/v1/security/audits/quick`); không phải lỗi config local; audit thay thế qua OSV API **vẫn timeout sau 3 lượt thử (U8, V1, W1)** — chưa có số CVE npm (xem §5) |
| bgremove pipeline test (u2net, video 3 s) | **✅ PASS (verify đợt 69 W1, 09/11)** — mask 90 frame fg 18,8%/bg 79,7%, temporal diff 0,00; alpha rgba transparent 79,8%/opaque 18,9%; fallback 7/7; smooth 4/4; wall 490,6 s → 0,37 fps gộp |
| Backup venv cũ `.venv-py310-bak` (706M) | **ĐÃ XÓA 09/11** (sau khi pipeline PASS + kiểm tra venv mới tự đứng được) |
| README.md | Viết lại (VCut Studio, badges, số liệu đúng kho hiện tại) |

## 1. Baseline pip-audit (chạy lại 08/11, pip-audit 2.10.1, venv /tmp mới)

- tts: **39 dòng**, toàn Pillow 12.3.0, fix 13.0.0. Exit 1.
- bgremove: **66 dòng** — Pillow 10.2.0: 2 fix 10.3.0 / 4 fix 12.2.0 /
  23 fix 12.3.0 / 33 fix 13.0.0; rembg 2.0.60: 3 fix 2.0.75 / 1
  (CVE-2026-115924) fix 2.0.82. Exit 1. Khớp hoàn toàn số đợt 66 T10.
- File: `hidden_files/round67-u8-audit-{tts,bgremove}-baseline.txt`.

## 2. Blocker 1 — bgremove: Python 3.10 chặn MỌI bản vá rembg + Pillow 13

- rembg 2.0.75 VÀ 2.0.82 đều `requires_python >=3.11` (2.0.60 là
  `>=3.8,<3.13`). Venv bgremove đang Python 3.10.22 → không cài được
  bản vá nào của rembg. Pillow 13.0.0 cũng `requires_python >=3.11`.
- Pillow 12.3.0 (`>=3.10`) cài được trên 3.10 (xóa 29/62 dòng Pillow) —
  nhưng không xanh hẳn.
- rembg 2.0.82 còn kẹp `pillow<13.0.0,>=12.1.0` — hai bản vá "khuyên dùng"
  (rembg 2.0.82 + Pillow 13.0.0) MÂU THUẪN nhau; chỉ rembg ≥2.0.87 mới
  cho Pillow 13 (`pillow<14.0.0,>=12.3.0`).
- → Hướng duy nhất để xanh hẳn: rebuild venv bgremove lên Python 3.12
  (system python3.12.3 có sẵn), rembg 2.0.87 + Pillow 13.0.0 + numpy 2.5.4
  + opencv 5.0.0.93 + onnxruntime 1.23.2.
- rembg 2.0.87 VẪN CÓ `BiRefNetSessionGeneral`, model y hệt 2.0.60:
  `BiRefNet-general-epoch_244.onnx`, md5
  `7a35a0141cbbc80de11d9c9a28f52697` (đã có trong `~/.u2net` — không cần
  tải lại).
- Bridge/desktop trỏ venv qua `server/bgremove/.venv/bin/python`
  (pythonServices.js venvRel) → rebuild tại chỗ giữ nguyên đường dẫn,
  không cần sửa code gọi.

### Rebuild đã làm xong (checkpoint 22:2x–22:3x)

- Backup venv cũ: `server/bgremove/.venv` → `.venv-py310-bak` (706M,
  giữ tới khi verify xong mới xóa).
- Venv mới: Python 3.12.3, `uv venv --python 3.12` + `uv pip install -r
  requirements.txt` (mới) → exit 0. Đã cài thật: rembg 2.0.87,
  Pillow 13.0.0, numpy 2.5.4, cv2 5.0.0, onnxruntime 1.23.2;
  transitive: scikit-image 0.26.0, scipy 1.18.1, pymatting 1.1.16,
  numba 0.68.1, pooch 1.9.0. `import rembg` OK.
- `server/bgremove/requirements.txt` đã sửa: pin mới + ghi rõ lý do 3.12
  + lịch sử pin cũ J8 (rembg 2.0.38 → 2.0.60).
- pip-audit sau bump (trên requirements.txt mới, venv Python 3.12):
  **"No known vulnerabilities found", exit 0**. Toàn bộ 66 dòng đã xóa
  (4 rembg + 62 Pillow).

## 3. Blocker 2 — TTS: gradio kẹp Pillow <13, KHÔNG có đường bump

- vieneu 3.8.3 (mới nhất trên PyPI, Apache 2.0) requires gradio>=5.49.1.
- Mọi gradio 5.49.1→6.31.0 (mới nhất) đều kẹp `pillow<13.0`
  (bản cũ <12.0).
- Kiểm chứng thực nghiệm (dry-run pip, scratch venv):
  `vieneu==3.8.3 + Pillow==13.0.0` → `ERROR: ResolutionImpossible`
  (pip liệt kê toàn bộ cây gradio đều đòi `pillow<13.0`). Thêm pin
  `Pillow==13.0.0` vào requirements.txt sẽ làm file KHÔNG CÀI ĐƯỢC
  → không bump.
- vieneu KHÔNG import gradio lúc inference (grep site-packages/vieneu
  rỗng) nhưng đó không phải lối thoát: file requirements phải cài được
  từ đầu.
- → TTS giữ Pillow 12.3.0 (transitive), tồn dư **39 advisory** cho tới
  khi gradio nới cap hoặc vieneu bỏ dep gradio (upstream). Ghi rõ trong
  LIMITS + SECURITY.md (SECURITY.md đã cập nhật — xem §6).

### TTS verify thật (không bump, venv nguyên — checkpoint 22:4x)

- `--list-voices` (cần dummy `--text/--out` do argparse bắt buộc):
  mode v3turbo, **25 giọng** (Hải Đăng, Trúc Ly, Mai Anh, ...).
- Inference thật giọng "Hải Đăng", 86 ký tự → WAV 422.444 byte,
  4,40 s audio, 48 kHz, watermark false, exit 0.
- Tốc độ: synth thuần 8,1 s → **0,543× realtime**; wall (gồm nạp model)
  15,5 s → 0,283×. Cả hai nằm trong baseline 0,12–0,75× (đo 06/11,
  infer thuần sau warmup, chưa tính nạp model ~10–12,5 s).
  TTS không đổi code/dep.

## 4. bgremove pipeline test — ✅ ĐÃ VERIFY PASS (đợt 69 W1, 09/11)

- Lần 1 (U8) chết do ảnh mẫu tải lỗi — xem dưới; **lần chạy lại đã PASS
  toàn bộ**: `server/bgremove/.venv/bin/python -u test_bgremove.py
  --person ~/workspace/scratch-bgremove/person.jpg --keep` → `✅ TẤT CẢ
  TEST PASS`, exit 0. Chi tiết đầy đủ:
  docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md §1.
- Ảnh mẫu dùng ảnh đã có sẵn trên đĩa (picsum, JPEG thật 640×640,
  43.409 byte, magic `ffd8ffe1`) — không tải lại từ mạng; `validate_image`
  trong test xác nhận magic bytes trước khi chạy ffmpeg.
- Mask: 90 frame, foreground(>200)=18,8%, background(<55)=79,7%,
  temporal diff 0,00. Alpha: pix_fmt rgba, transparent 79,8%,
  opaque 18,9%. Fallback 7/7, smooth 4/4. Wall 490,6 s → 0,37 fps gộp
  (180 frame), khớp baseline ~0,43 fps.
- Lần 1 chết do ảnh mẫu tải lỗi (không phải do bump) — giữ làm bài học:
  **HTTP 400 + trang "Wikimedia Error"** (verify lại 2 lần, cùng
  3279 byte) → file `person.jpg` thực chất là HTML → ffmpeg `-loop 1`
  với input không phải ảnh quay vòng vô hạn (2 tiến trình ffmpeg
  64–129% CPU, 40+ phút, test3s.mp4 0 byte) → test treo rồi chết theo
  daemon restart. Đã kill 2 ffmpeg kẹt.
- Đây là điểm yếu CÓ SẴN của test (không validate ảnh tải về), không
  liên quan tới bump rembg/Pillow. — **Đã có sẵn `validate_image` trong
  test (magic bytes + size ≥10 KB)**; lần verify W1 dùng ảnh trên đĩa nên
  không chạm đường tải Wikimedia.
- **Lần chạy lại ĐÃ CÓ kết quả cuối (đợt 69 W1): PASS — xem đầu §4.**
  Pipeline end-to-end trên venv mới (rembg 2.0.87 + Pillow 13) ĐÃ được
  chứng minh chạy thật. Backup `.venv-py310-bak` đã xóa sau PASS.

## 5. npm audit — nguyên nhân chặn đã tái hiện chính xác

- `npm audit --audit-level=high` (root, 08/11): exit 1 —
  `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick
  - policy_denied`, policy `zz_managed_internal_spaces_package_registries`,
  rule `POST /-/npm/v1/security/audits/quick`.
- Không có .npmrc (root/user), registry = public registry.npmjs.org,
  proxy npm = null; nhưng env có egress proxy (HTTP(S)_PROXY) — GET tới
  registry.npmjs.org và PyPI đều 200, chỉ POST tới endpoint audit bị
  chặn (curl POST trực tiếp: HTTP 000, exit 28 timeout sau 20s).
- Kết luận: chặn ở tầng egress proxy theo policy, không phải do npm hay
  config local; không có cách chạy `npm audit` local nào khác trong môi
  trường này (không đổi registry — registry đã là public). Audit thay thế:
  quét 3 lockfile qua OSV API (cùng nguồn dữ liệu pip-audit dùng) —
  **vẫn timeout sau 3 lượt thử (U8, V1, W1): batch 1–2/20 fail 3/3
  attempt mỗi batch (ReadTimeout 300 s ở api.osv.dev:443); tiến trình W1
  chết theo runtime restart sau batch 2, không chạy lại toàn bộ (fail hết
  ≈ 5 giờ); chưa có số CVE npm.**
  Chi tiết: docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md §5.

## 6. File đổi/thêm (batch u8 — stage trong đợt 69 W1, KHÔNG push)

- `server/bgremove/requirements.txt` — pin mới (rembg[cpu]==2.0.87,
  onnxruntime==1.23.2, opencv-python-headless==5.0.0.93, numpy==2.5.4,
  Pillow==13.0.0) + comment lý do 3.12 + lịch sử pin J8.
- `README.md` — viết lại: tên VCut Studio, badges (MIT / Node ≥20 /
  FFmpeg 8.x / AI 100% local / MCP 29 tools), quickstart (Python ≥3.12),
  bảng tính năng với số liệu đúng kho hiện tại (59 font, 96 text preset,
  81 chuyển cảnh, 174 LUT, 16 FX, 1043 SFX, 244 sticker, TTS 25 giọng).
- `docs/PHASE9_ROUND67_U8_PILLOW_REMBG_LIMITS.md` — doc này (đã cập nhật
  kết quả verify đợt 69 W1 ở §0/§4/§5/§8).
- `docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md` — LIMITS đợt 69 W1
  (mới, verify pipeline + xóa backup + OSV).
- `SECURITY.md` — đã cập nhật trên đĩa (mục bgremove: pin mới + lý do
  rebuild 3.12); file này nằm trong batch u9 đã stage
  (`phase9-round67-u9-ci-security.txt`, U9 cũng sửa cùng file) — không
  liệt kê trùng trong batch W1.
- KHÔNG đổi: `server/tts/requirements.txt` (không bump được — §3);
  không đụng code Python (bgremove.py/tts.py nguyên vẹn).

## 7. Sự cố hạ tầng trong lúc chạy

- Daemon restart giết 2 exec session + 1 session nền — phải chạy lại
  phần npm/birefnet. Bài học: chỉ chạy lệnh ngắn (<10 s), checkpoint
  sau mỗi bước lớn.
- `/usr/bin/time` không tồn tại trên VM → lần chạy TTS đầu exit 127,
  chưa inference. Đổi sang đo bằng `date +%s.%N` + ffprobe duration.
- `tts.py --list-voices` lỗi argparse (bắt `--text/--out` dù chỉ liệt
  kê) — quirk có sẵn, workaround: truyền dummy `--text/--out`.
- OSV script lần 1 timeout ở batch 500 (urllib timeout 60s) → sửa batch
  100, timeout 120s, retry ×3; lần 2 cũng chết ở khâu CONNECT tunnel
  qua proxy; đang thử lại bằng requests (có retry/backoff) lúc timeout.
- `/tmp` tmpfs 512M — cài đặt nặng phải đặt TMPDIR sang đĩa lớn.
  `/tmp/pip-audit-venv` đã mất (tmpfs dọn sau restart) — cần tạo lại.

## 8. Nợ mở cho đợt 68 — CẬP NHẬT đợt 69 W1

1. **Verify pipeline bgremove end-to-end trên venv 3.12 mới
   (u2net test với ảnh picsum, `python -u`): ✅ ĐÃ ĐÓNG (09/11, W1)** —
   PASS toàn bộ, xem §4 + LIMITS W1.
2. Xóa `.venv-py310-bak` sau khi (1) PASS. **✅ ĐÃ ĐÓNG (09/11, W1)** —
   706M đã xóa, venv mới tự đứng được (pyvenv.cfg → /usr/bin, 0 tham
   chiếu tới backup, `import rembg` vẫn OK sau xóa).
3. Kết quả quét OSV npm 3 lockfile — **VẪN MỞ**: 3 lượt thử (U8, V1, W1)
   đều timeout ở batch 1 (ReadTimeout 300 s, api.osv.dev:443). Script W1
   vẫn chạy nền, checkpoint `hidden_files/round69-w1-osv-npm.json` nếu
   batch nào qua được. Cần egress policy cho POST api.osv.dev.
4. TTS 39 advisory — phụ thuộc upstream (gradio nới cap `pillow<13`
   hoặc vieneu bỏ dep gradio); kiểm tra lại định kỳ, không tự ý sửa
   requirements.txt thành trạng thái không cài được.
5. Sửa `test_bgremove.py`: validate ảnh tải về (magic bytes/size) trước
   khi đưa vào ffmpeg — **ĐÃ CÓ SẴN `validate_image` trong test** (không
   cần làm thêm); W1 dùng ảnh trên đĩa nên không chạm đường tải.
6. Quirk `tts.py --list-voices` bắt `--text/--out` — sửa argparse cho
   đúng (low priority, đã có workaround).
