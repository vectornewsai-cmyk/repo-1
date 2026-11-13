# LIMITS — Phase 9 đợt 69, luồng W1: verify pipeline bgremove sau bump Pillow/rembg + stage batch U8

Ngày: 09/11/2026 (lượt cron 03:35 +07). Đóng nợ đợt 67 §8 mục 1–2 và
đợt 68 §4 (V1/U8 ưu tiên): verify end-to-end pipeline bgremove trên venv
mới (rembg 2.0.87 + Pillow 13.0.0, Python 3.12), chạy lại pip-audit +
OSV npm, xóa backup venv cũ, stage batch U8. KHÔNG push, KHÔNG release/tag,
KHÔNG binary. Mọi số dưới đây là số đo thật, chạy lại trong luồng này.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Pipeline bgremove end-to-end (venv 3.12 mới) | **PASS toàn bộ**: `test_bgremove.py` ✅ TẤT CẢ TEST PASS (exit 0); fallback 7/7; smooth 4/4 |
| u2net mask (video 3 s, 90 frame, max-side 480) | fg(>200)=18,8%, bg(<55)=79,7%, temporal diff 0,00 — PASS |
| u2net alpha | pix_fmt rgba, transparent 79,8%, opaque 18,9% — PASS |
| Tốc độ u2net gộp (mask+alpha, 180 frame) | wall 490,6 s → **0,37 fps** (khớp baseline ~0,43 fps đợt trước, chậm hơn một chút do tải máy lúc chạy) |
| Ảnh đơn 640×640 (kiểm tra trước) | session load 2,7 s; remove 4,02 s/frame; alpha mean 49,6, >200 = 19,0%, <55 = 79,9% |
| pip-audit bgremove (chạy lại) | **0 lỗ hổng** ("No known vulnerabilities found", exit 0) — khớp U8 |
| pip-audit TTS (chạy lại) | **39, không đổi** — toàn Pillow 12.3.0, fix 13.0.0 (gradio kẹp pillow<13; KHÔNG thử bump lại, xem §3) |
| Backup venv cũ `.venv-py310-bak` (706M) | **ĐÃ XÓA** sau khi verify PASS + kiểm tra venv mới tự đứng được (xem §4) |
| OSV npm audit (3 lockfile, 490 name@version) | **CHƯA CÓ SỐ — vẫn timeout** (xem §5): batch 1–2/20 fail 3/3 attempt mỗi batch (ReadTimeout 300 s); tiến trình chết theo runtime restart, không chạy tiếp |
| Stage batch U8+W1 (KHÔNG push) | `paths-loop/phase9-round69-w1-bgremove-verify.txt` — 4 entry, verify read-back 4/4 |

## 1. Verify pipeline bgremove — PASS

Lệnh (venv mới, Python 3.12.3):

```
server/bgremove/.venv/bin/python -u test_bgremove.py \
  --person ~/workspace/scratch-bgremove/person.jpg --keep
```

- Ảnh mẫu: ảnh đã có sẵn trên đĩa `scratch-bgremove/person.jpg`
  (picsum, JPEG thật 640×640, 43.409 byte, magic `ffd8ffe1`) — KHÔNG tải
  lại từ mạng, tránh đúng bẫy Wikimedia HTML 400 của U8. `validate_image`
  trong test đã xác nhận magic bytes trước khi chạy ffmpeg.
- Mask: 90 frame, foreground(>200)=18,8%, background(<55)=79,7%
  (đúng ngưỡng test: cả hai >10% — không toàn đen/toàn trắng);
  temporal coherence mean inter-frame diff = 0,00 (< 5,0).
- Alpha: `pix_fmt=rgba`; frame RGBA đọc qua pipe: transparent(<55)=79,8%,
  opaque(>200)=18,9% (đúng ngưỡng test: cả hai >5%).
- File output giữ lại (`--keep`, `~/.tmp-r69w1/bgremove-test-7c2c_9t9/`):
  test3s.mp4 54.877 byte, mask.mp4 11.921 byte, alpha.mov 26.853.688 byte.
- Wall 490,6 s cho 180 frame (mask 90 + alpha 90) → 0,37 fps gộp.
  Baseline đợt trước ~0,43 fps u2net; chênh lệch nhỏ, trong nhiễu tải máy
  (lúc chạy có tiến trình OSV audit chạy song song + load chung của VM).
  Không phải hồi quy do bump: cùng model u2net.onnx, cùng max-side 480.
- Kiểm tra nhanh 1 ảnh trước khi chạy test dài (tránh đốt 8 phút nếu ảnh
  không có người): `rembg new_session("u2net")` load 2,7 s; remove 1 frame
  640×640 mất 4,02 s; alpha mean 49,6, >200 = 19,0%, <55 = 79,9% — ảnh có
  chủ thể rõ, đủ điều kiện làm video mẫu.

Test phụ (pure-Python, không cần model), chạy bằng venv mới:

```
.venv/bin/python -u test_bgremove_fallback.py   → 7 pass, 0 fail
.venv/bin/python -u test_bgremove_smooth.py     → 4/4 PASS
```

- Fallback: decide birefnet→u2net, retry đúng thứ tự, `--no-fallback`
  không retry, cả 2 lỗi báo cả 2 session, session cấm (`bria-rmbg`) vẫn bị chặn.
- Smooth: EMA giảm jitter, cắt cảnh reset (out mean = 1,0), feather tạo
  giá trị trung gian 0,333/0,667 quanh cạnh, radius=0 identity,
  temporal ngoài [0, 0,9] bị từ chối.

Venv đã kiểm chứng (lệnh `.venv/bin/python -c "import rembg, PIL, numpy,
cv2, onnxruntime"`): rembg 2.0.87, Pillow 13.0.0, numpy 2.5.4, cv2 5.0.0,
onnxruntime 1.23.2. `uv pip list` đầy đủ: scikit-image 0.26.0,
scipy 1.18.1, pymatting 1.1.16, numba 0.68.1, pooch 1.9.0 — khớp đúng
bản ghi U8. Lưu ý: venv tạo bằng `uv venv` nên KHÔNG có `pip`
(`.venv/bin/pip list` exit 1) — đó là trạng thái có sẵn từ U8, không phải
lỗi; dùng `uv pip list --python .venv/bin/python`.

## 2. pip-audit chạy lại (pip-audit 2.10.1, venv /tmp mới tạo lại)

`/tmp` tmpfs đã dọn sau restart như U8 ghi — tạo lại venv audit tại
`~/workspace/.tmp-r69w1/pip-audit-venv` (TMPDIR sang đĩa lớn), cài
pip-audit 2.10.1 từ PyPI (GET 200 bình thường).

- bgremove (`server/bgremove/requirements.txt` mới): **"No known
  vulnerabilities found", exit 0**. File:
  `hidden_files/round69-w1-audit-bgremove.txt`.
- TTS (`server/tts/requirements.txt`, không đổi): **"Found 39 known
  vulnerabilities in 1 package", exit 1** — toàn Pillow 12.3.0, fix
  13.0.0 (18 PYSEC-2026-43xx + 17 CVE-2026-112xxx + 3 CVE-2026-966xx +
  1 GHSA-78g4-xqwv-q3g8). Khớp đúng 39 của U8/đợt 66. File:
  `hidden_files/round69-w1-audit-tts.txt`.
- Tổng 2 file: 39 (bgremove 0 + TTS 39). Không thay đổi so với U8.

## 3. TTS 39 CVE — KHÔNG bump, KHÔNG thử lại (đã chứng minh)

- Giữ nguyên quyết định U8: vieneu 3.8.3 requires gradio>=5.49.1; mọi
  gradio 5.49.1→6.31.0 đều kẹp `pillow<13.0`; dry-run pip đã chứng minh
  `ResolutionImpossible` với Pillow 13.0.0. Thêm pin Pillow==13.0.0 sẽ làm
  `requirements.txt` KHÔNG CÀI ĐƯỢC. Luồng này KHÔNG thử bump TTS lại
  (theo lệnh nhiệm vụ) và KHÔNG sửa `server/tts/requirements.txt`.
- Tồn dư 39 advisory tới khi gradio nới cap hoặc vieneu bỏ dep gradio
  (upstream). Kiểm tra lại định kỳ.

## 4. Xóa backup venv cũ `.venv-py310-bak` (706M) — ĐÃ XÓA

Chỉ xóa SAU KHI pipeline verify PASS. Kiểm tra lần cuối trước khi xóa:

- `.venv/pyvenv.cfg`: `home = /usr/bin`, CPython 3.12.3 — trỏ system
  Python, không trỏ backup.
- Symlink trong `.venv`: 4 cái (`bin/python`, `bin/python3`,
  `bin/python3.12`, `lib64`) — tất cả trỏ system python, không cái nào
  trỏ backup.
- `grep -r "py310-bak" .venv/` → **0 file**; `grep -r "py310-bak"
  ../tts/.venv2/` → **0 file**.
- Code gọi: `apps/desktop/src/services/pythonServices.js:139`
  `venvRel: ['server/bgremove/.venv/bin/python']` (venv MỚI);
  `server/bridge/src/bgremove.js:43` dùng `env.BGREMOVE_PYTHON ||
  "python3"` (không hardcode đường dẫn venv nào); các file entry
  (`download_model.sh`, `BGREMOVE_LIMITS.md`, `README.md` bgremove,
  `mcp-server/src/index.js`) không chứa `py310-bak`.
- Lưu ý: 2 lần grep toàn cây (`apps/` + `server/`) chạy chậm bất thường
  (>60 s, phải kill — lần 2 timeout 50 s, exit 124, không ra kết quả) do
  tải máy/IO lúc OSV audit đang chạy nền; đã thay bằng grep hẹp trên file
  entry + trong 2 venv (kết quả 0 như trên). Grep toàn cây không phải
  bằng chứng thiếu — pipeline test PASS trên venv mới là bằng chứng
  runtime độc lập quyết định.
- Sau xóa: `rm -rf server/bgremove/.venv-py310-bak` → `ls` không còn
  thư mục backup; `.venv` còn nguyên; `import rembg` trên venv mới vẫn OK
  (rembg 2.0.87). Dung lượng đĩa: trước xóa 48G đã dùng / 103G trống;
  sau xóa 48G/103G (làm tròn GB — 706M không hiện ở mức GB; `du` trước
  xóa xác nhận đúng 706M).

## 5. OSV npm audit — VẪN TIMEOUT, chưa có số (nợ mở, xem §6 mục 3)

- `npm audit` trực tiếp: KHÔNG thử lại (U8 đã chứng minh bị chặn ở egress
  proxy: 403 `policy_denied` trên POST `/-/npm/v1/security/audits/quick`;
  nhiệm vụ dặn không phí thời gian thử lại quá 1 lần — đã có bằng chứng
  chặn, không thử).
- OSV thay thế: script đợt 68 V1 (`.tmp-v1/osv-npm-audit3.py`, batch 25,
  timeout 300 s, retry ×3, checkpoint JSON sau mỗi batch), chạy lại với
  output `hidden_files/round69-w1-osv-npm.{json,txt}` — 3 lockfile,
  431 package, 490 name@version, 20 batch.
- Kết quả cuối: **batch 1/20 fail 3/3 attempt; batch 2/20 fail 3/3
  attempt** (cùng lỗi ReadTimeout 300 s, api.osv.dev:443) → checkpoint
  JSON ghi `done_batches: 2, failed_batches: [1, 2], vuln_pkgs: 0` — 0 ở
  đây chỉ là "chưa quét được batch nào", KHÔNG phải "0 lỗ hổng". Tiến
  trình OSV chết theo runtime restart lúc ~04:4x (sau batch 2, trước batch
  3); log đầy đủ `hidden_files/round69-w1-osv-npm.txt`. **Không chạy lại
  toàn bộ 20 batch**: mỗi batch fail tốn ~15 phút (3×300 s + backoff),
  cả 20 batch ≈ 5 giờ, trong khi mẫu lỗi đã ổn định qua 3 lượt/ngày
  (U8, V1, W1) — xác suất batch sau qua được gần bằng 0 nếu không đổi
  egress policy. Chưa có batch nào quét thành công, chưa có số CVE npm.
- Đây là lần thứ 3 liên tiếp cùng mẫu lỗi: U8 (urllib, batch 500 timeout
  60 s; lần 2 CONNECT tunnel timeout ×3), V1 (requests, batch 1/20 fail
  ×2 ReadTimeout 300 s), W1 này (batch 1/20 fail ×2 ReadTimeout 300 s).
  Mẫu lỗi ổn định qua 3 lượt/ngày khác nhau → POST tới api.osv.dev bị
  timeout ở tầng egress proxy (cùng họ với chặn POST npm audit), không
  phải lỗi script hay mạng chập chờn nhất thời. Không có cách quét npm
  nào khác trong môi trường này nếu không đổi egress policy (ngoài phạm
  vi luồng này).
- Script vẫn để chạy nền (checkpoint JSON sau mỗi batch nếu batch nào qua
  được); đợt sau kiểm tra file `round69-w1-osv-npm.json` — nếu có batch
  xong thì cộng dồn số, nếu vẫn 0 batch thì nợ vẫn mở.

## 6. File đổi/thêm (batch W1 — stage, KHÔNG push)

- `server/bgremove/requirements.txt` — pin U8 (rembg[cpu]==2.0.87,
  onnxruntime==1.23.2, opencv-python-headless==5.0.0.93, numpy==2.5.4,
  Pillow==13.0.0) + comment lý do 3.12. Không đổi trong luồng này
  (đã đúng, verify PASS trên đúng file này).
- `README.md` — viết lại ở U8 (VCut Studio, badges, quickstart
  Python ≥3.12, số liệu kho). Không đổi trong luồng này.
- `docs/PHASE9_ROUND67_U8_PILLOW_REMBG_LIMITS.md` — cập nhật §0/§4/§5/§8:
  pipeline đã PASS (không còn "chưa có kết quả cuối"), OSV vẫn timeout,
  nợ 1–2 đã đóng.
- `docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md` — doc này.
- KHÔNG đổi: `server/tts/requirements.txt` (§3); không đụng code Python
  (bgremove.py/test nguyên vẹn — test đã có sẵn `validate_image` từ trước,
  không cần sửa thêm); `SECURITY.md` đã nằm trong batch u9 đã stage
  (`phase9-round67-u9-ci-security.txt`), không liệt kê trùng ở đây.
- Stage file: `paths-loop/phase9-round69-w1-bgremove-verify.txt`
  (NUL-delimited, 4 entry, verify read-back 4/4 tồn tại và là text).

## 7. Nợ mở cho đợt sau

1. **OSV npm audit — vẫn chưa có số CVE npm** (§5): 3 lượt thử đều
   timeout ở batch 1. Cần egress policy cho phép POST api.osv.dev (hoặc
   chạy audit trên máy khác / lúc khác) mới có số. Không tự bịa số.
2. TTS 39 advisory — phụ thuộc upstream (gradio nới cap `pillow<13`
   hoặc vieneu bỏ dep gradio); kiểm tra lại định kỳ, không tự ý sửa
   requirements.txt thành trạng thái không cài được.
3. Sửa `test_bgremove.py`: validate ảnh tải về đã CÓ SẴN trong test
   (`validate_image`, magic bytes + size ≥10 KB) — mục này của U8 §8 coi
   như đã có từ trước, không cần làm thêm; lần này dùng ảnh trên đĩa nên
   không chạm đường tải Wikimedia.
4. Quirk `tts.py --list-voices` bắt `--text/--out` — chưa sửa (low
   priority, đã có workaround; không thuộc luồng này).
5. Tốc độ u2net 0,37 fps (CPU-only, VM 2vCPU) — chậm theo thiết kế
   local-first; birefnet còn chậm hơn (chưa đo lại sau bump — model
   `BiRefNet-general-epoch_244.onnx` md5
   `7a35a0141cbbc80de11d9c9a28f52697` vẫn trong `~/.u2net`, rembg 2.0.87
   vẫn có `BiRefNetSessionGeneral`; đợt sau có thể đo birefnet nếu cần).
