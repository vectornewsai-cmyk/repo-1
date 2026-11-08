# SECURITY.md — Chính sách bảo mật VCut Studio

> Audit lần đầu: 2026-10-20 (R1-101/R1-103, Batch J).
> Repo: `vectornewsai-cmyk/repo-1`, license MIT.

## 1. Mô hình đe dọa (threat model)

VCut Studio là **ứng dụng desktop-local**: editor web (Vite) + bridge server chạy trên
`127.0.0.1:8787` + render worker FFmpeg + các script Python AI local. Không có
backend cloud, không có tài khoản người dùng, không lưu secret nào.

Kẻ tấn công tiềm năng:
1. **Website độc hại** mà user mở trên trình duyệt — có thể gọi tới bridge server
   local qua `http://127.0.0.1:8787` (xem §3.1).
2. **File media/project độc hại** — user mở file `.vcut.zip`, `.videospec.json`,
   video/ảnh từ nguồn không tin cậy.
3. **Dependency độc hại** — supply-chain attack qua npm/PyPI.

Ngoài phạm vi: bảo mật máy user nói chung, bảo mật mạng LAN (bridge chỉ bind
loopback), lỗ hổng của FFmpeg/Python/Node runtime.

## 2. Kết quả audit (2026-10-20)

### 2.1. Secrets hardcode — ✅ SẠCH

- Quét toàn repo (`api_key`, `secret`, `password`, `token`, `bearer`): không phát hiện
  secret nào. Dự án không dùng API key/cloud nào — mọi AI chạy local.
- Không có file `.env`, `credentials*`, `*.pem` trong source (chỉ có `cacert.pem`
  của certifi bên trong Python venv — không phải secret).
- `.gitignore` chặn `.env`, `.env.*`, `*.pem`, `*.key`.

### 2.2. Command injection — ✅ ĐÃ GUARD

| Bề mặt | Trạng thái |
|---|---|
| Bridge → render worker / Python scripts | `child_process.spawn` với `shell: false` và argv cố định ở mọi nơi (`index.js:394`, `caption.js:210`, `silence.js:147`, `reframe.js:104`, `tts.js:114`). Không có `shell: true` ở đâu. |
| MCP server / CLI → render worker / Python | `spawnSync` với mảng argv, không qua shell. |
| Python scripts → FFmpeg | `subprocess.run(cmd_list)` dạng list, không `shell=True`. |
| `eval()` | Không có trong source của dự án (chỉ có trong thư viện bên thứ ba thuộc venv). |

### 2.3. Path traversal — ✅ ĐÃ GUARD

| Bề mặt | Guard |
|---|---|
| MCP `project_id` | Regex `ID_RE` (chữ/số/`-`/`_`, ≤64 ký tự) trong `validate.ts` — không thể chứa `/` hay `..`. |
| MCP `media_dir` / `out_path` | `resolveMediaDir`/`resolveOutPath` kiểm tra `path.relative(...).startsWith("..")` (`store.ts`). |
| Bridge upload filename | `sanitizeFilename()`: `path.basename` so khớp (từ chối `/`, `\`), whitelist ký tự `^[\w\-. ]{1,128}$`, whitelist đuôi file, **kiểm tra magic bytes** (`index.js:167-198`). |
| Archive `.vcut.zip` | Từ chối entry có `..`, đường dẫn tuyệt đối, backslash; giới hạn số entry/kích thước giải nén (chống zip-bomb) — `apps/web/src/lib/archive.ts`. |
| bgremove session | `FORBIDDEN_SESSIONS` chặn weights non-commercial ở cả Python và bridge. |

### 2.4. XSS trong web UI — ✅ SẠCH

- Không có `dangerouslySetInnerHTML` hay `innerHTML` trong `apps/web/src`.
- Text của user render qua canvas/drawtext/ASS — không chèn vào DOM.
- Bridge trả JSON; header `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.

### 2.5. FFmpeg filter injection — ⚠️ GIẢM THIỂU (không loại trừ hoàn toàn)

Text/chữ của user được escape cho drawtext (`escapeDrawtext`: `\`, `'`, `:`, `%{`)
và đường dẫn filter (`escapeFilterPath`). FFmpeg được gọi qua argv (không shell)
nên không thể thoát ra shell. Tuy nhiên, về lý thuyết một chuỗi filter được chế
tác khéo vẫn có thể thay đổi filter-graph (ví dụ chèn filter tốn CPU). Mức độ
nghiêm trọng: thấp (local app, attacker phải là chính user hoặc site gọi được
bridge — xem §3.1).

### 2.6. Dependencies — ✅ Không có GPL trong runtime

Xem chi tiết tại `docs/LICENSES.md`. Tóm tắt:

- **npm (206 packages duy nhất)**: 191 MIT, 7 ISC, 2 BSD-3-Clause, 2 Apache-2.0,
  1 Python-2.0 (`argparse`, permissive), 1 CC-BY-4.0 (`caniuse-lite`, dữ liệu
  build-time, dev-only), 1 `(MIT AND Zlib)` (`pako`), 1 `(MIT OR GPL-3.0-or-later)`
  (`jszip` — dual license, **dự án dùng theo lựa chọn MIT**, không nhiễm GPL).
- **Python**: `faster-whisper` MIT, `vieneu` Apache-2.0, `rembg` MIT,
  `onnxruntime` MIT, `ctranslate2` MIT, `Pillow` HPND (permissive),
  `opencv-python-headless` Apache-2.0, `numpy` BSD-3-Clause, `tqdm` MPL-2.0 AND MIT
  (weak copyleft ở cấp file — dùng nguyên bản, không sửa, tương thích).
- **Model AI**: VieNeu-TTS 0.5B Apache-2.0, BiRefNet MIT — xem `*_LIMITS.md` từng
  module. **RVM bị loại vì GPL-3.0**; bẫy `bria-rmbg`/`RMBG-2.0` (non-commercial)
  bị chặn bằng code.

⚠️ **Lưu ý**: `npm audit` vẫn bị chặn trong môi trường build hiện tại
(verify lại 08/11, đợt 66 T10: 403 `policy_denied` ở endpoint
`/-/npm/v1/security/audits/quick` — policy registry nội bộ), nên quét CVE
npm chưa chạy được local. **OSV API thì KHÔNG bị chặn**: `pip-audit` 2.10.1
chạy local được 08/11 và đã quét cả 5 requirements (xem §3.5 — tts 39 +
bgremove 66 lỗ hổng mới phát hiện). Các phiên bản đã cài (express 4.22.3,
multer 2.4.0, js-yaml 4.3.2, jszip 3.10.2, react 18.3.1…) không có CVE
nghiêm trọng nào được biết tới tại thời điểm audit theo kiến thức hiện có.
**Khuyến nghị**: bật `npm audit` / osv-scanner trong CI (xem §4).

### 2.7. Asset attribution — ✅ ĐẦY ĐỦ 1:1

`assets/SOURCES.md` (527 dòng) đối chiếu với file thực tế:

| Loại | Files | Dòng SOURCES.md |
|---|---|---|
| Stickers PNG | 203 | 203 |
| LUT `.cube` | 104 | 104 |
| Text presets CSS | 56 | 56 |
| Effects GLSL | 7 | 7 |
| Audio OGG | 12 | 13 (12 file + 1 dòng tổng) |
| Templates JSON | 10 | 10 |

Mọi asset bên thứ ba có license permissive (MIT/CC0/CC-BY/Apache-2.0/OFL) đã đọc
trực tiếp file LICENSE gốc. Đã loại: OpenMoji (CC-BY-SA), Sonniss GDC
(license riêng cấm redistribute), RVM (GPL-3.0).

## 3. Vấn đề còn mở (trung thực)

### 3.1. 🔴 CORS mở toàn bộ trên bridge local (MỨC: trung bình) — ✅ ĐÃ SỬA 2026-10-20

`server/bridge/src/index.js:415` dùng `app.use(cors())` không giới hạn origin.
Bridge bind `127.0.0.1` nên chỉ máy local gọi được — nhưng **bất kỳ website nào
user mở trên trình duyệt cũng gọi được** tới `http://127.0.0.1:8787` và đọc
response (CORS `*`). Hậu quả có thể: site lạ kích render job (tốn CPU/disk),
gọi AI endpoints, đọc metadata project.

**Khuyến nghị sửa**: giới hạn CORS theo origin của frontend
(`http://127.0.0.1:5173`, `http://localhost:5173`, và origin của bản build),
hoặc yêu cầu token ngẫu nhiên mỗi phiên (in ra console khi khởi động bridge,
frontend đọc từ env). Chưa sửa trong audit này — ghi nhận để xử lý.

**✅ ĐÃ SỬA (2026-10-20)**: thay `app.use(cors())` bằng cors có callback origin
trong `server/bridge/src/index.js`:
- Chỉ cấp `Access-Control-Allow-Origin` cho origin loopback khớp regex
  `^https?://(localhost|127.0.0.1|[::1])(:\d+)?$` — mọi port local đều qua
  (web UI dev :5173, vite preview, port khác), origin lạ và tên miền giả mạo
  dạng `localhost.evil.com` thì không.
- Request **không có Origin header** (curl, MCP server, CLI — client local
  không phải browser) vẫn được chấp nhận và gọi API bình thường.
- Origin không hợp lệ: server vẫn xử lý request nhưng **không trả header
  ACAO** → trình duyệt tự chặn website đó đọc response (đúng cơ chế CORS).
- Kiểm chứng thật bằng `server/bridge/test/test-cors.sh` (10/10 pass: origin
  local có ACAO, `evil.com`/`localhost.evil.com` không ACAO, không-Origin vẫn
  200, preflight đúng cả hai chiều) + chạy lại các suite bridge hiện có
  (hardening 16/16, jobqueue 52/52, progress 17/17, caption/translate/
  silence/scene/reframe đều pass) — không regression.

### 3.2. 🟡 Multer memoryStorage — nguy cơ DoS RAM (MỨC: thấp–trung bình) — ✅ ĐÃ SỬA 2026-10-21 (K4)

Upload dùng `multer.memoryStorage()` — file nằm trong RAM trước khi ghi disk.
Giới hạn 2GB/file × 200 file về lý thuyết có thể làm cạn RAM nếu attacker gọi
được bridge (kết hợp với §3.1). **Khuyến nghị**: chuyển sang `diskStorage` với
thư mục tạm, hoặc giảm `MAX_UPLOAD_BYTES` mặc định.

**✅ ĐÃ SỬA (2026-10-21)**: `server/bridge/src/index.js` chuyển sang
`multer.diskStorage()` (thư mục tạm `WORK_ROOT/uploads-tmp`, tên file tạm
ngẫu nhiên, không dùng tên client):
- Handler không còn đọc `f.buffer`: magic check chỉ đọc 64 byte đầu
  (`readUploadHead`), lưu file bằng rename cùng filesystem (`moveUploadTo`,
  fallback copy+unlink khi khác device) — không nạp file vào RAM.
- Thêm giới hạn tổng dung lượng 1 request `BRIDGE_MAX_TOTAL_UPLOAD`
  (mặc định 8GB; multer không hỗ trợ cap tổng theo luồng nên cap này kiểm
  tra sau khi upload xong, trước khi handler xử lý file — ghi rõ để không
  ai tưởng là cap streaming).
- Mọi file tạm còn sót được dọn bởi finish-hook trong `uploadMiddleware`
  (áp cho cả 7 endpoint upload, cả đường lỗi sớm) — không còn file mồ côi.
- Kiểm chứng thật bằng `server/bridge/test/test-diskstorage.sh` (7/7 pass:
  render qua diskStorage, file giả bị chặn, cap tổng chặn, tmp sạch cả
  đường thành công lẫn đường lỗi) + đo RSS trong lúc upload file 500MB:
  baseline 76MB → đỉnh 115MB (chỉ +39MB, file KHÔNG nằm trong RAM —
  với memoryStorage cũ đỉnh RSS sẽ tăng ~500MB).
- Toàn bộ suite bridge hiện có chạy lại đều xanh (jobqueue 52/52, progress
  17/17, caption 18, translate 18, silence 17, scene 19, reframe 20, cors
  10/10, bridge-queue 12/12) — không regression.

### 3.3. 🟡 Python requirements không pin version (MỨC: thấp) — ✅ ĐÃ SỬA 2026-10-21 (K4)

`server/*/requirements.txt` dùng `>=` lỏng (ví dụ `rembg[cpu]>=2.0`). Nếu một
bản release độc hại được đẩy lên PyPI, `pip install -r` lần sau sẽ kéo về.
**Khuyến nghị**: pin version chính xác + hash (`pip hash-checking mode`) cho
release pipeline.

**✅ ĐÃ SỬA (2026-10-21)**: cả 5 file chuyển sang `==` (4 file gốc K4 +
`server/tracking/requirements.txt` thêm sau, xem §4.1):
- caption: `faster-whisper==1.2.1` (freeze từ venv đang chạy; kèm
  ctranslate2 4.8.3, onnxruntime 1.31.0, tokenizers 0.23.3, av 19.0.1).
- tts: `vieneu==3.8.3`, `numpy==2.5.4` (freeze từ venv đang chạy).
- reframe: `opencv-python-headless==5.0.0.93`, `numpy==2.5.4` (freeze từ
  venv đang chạy).
- bgremove: `rembg[cpu]==2.0.60`, `onnxruntime==1.23.2`,
  `opencv-python-headless==5.0.0.93`, `numpy==2.2.6`, `Pillow==10.2.0` —
  ĐÍNH CHÍNH 07/11 (ROUND53-J8, xem header file requirements): rembg
  2.0.38 → 2.0.60 vì 2.0.38 không có session BiRefNet thật (gọi
  `birefnet-general` lặng lẽ trả về U2netSession); 2.0.60 là bản đầu tiên
  có BiRefNetSessionGeneral; extra `[cpu]` bắt buộc ở 2.0.60 + pin
  `onnxruntime` tường minh; numpy 2.5.4 → 2.2.6 vì numpy 2.5.4 yêu cầu
  Python ≥3.12 trong khi venv bgremove chạy Python 3.10. Bộ pin này đã
  verify chạy thật trên VM (venv Python 3.10.22, ~706M).
- tracking: `numpy==2.5.4`, `opencv-python-headless==5.0.0.93` (cho
  `track.py`, thêm ở đợt 63 R10).
- Hash-checking mode (`--require-hashes`) chưa bật: cần hashes cho cả cây
  transitive, làm ở bước release pipeline (R1-102) thay vì ở đây — ghi
  nhận để không ai tưởng pin `==` đã là hash-checking.

### 3.4. 🟢 rembg server mode có CVE — không ảnh hưởng

`rembg` có CVE-2025-25301 (SSRF), CVE-2025-25302 (CORS), CVE-2026-40086
(path traversal) — **tất cả chỉ ở chế độ `rembg s` (HTTP server)**. VCut gọi
rembg như library qua `bgremove.py` CLI riêng, không bao giờ bật server tích
hợp. Ghi nhận để không ai expose server này trong tương lai.

### 3.5. 🟡 pip-audit local 08/11/2026: Pillow + rembg có CVE mới — chưa vá

Quét local bằng `pip-audit` 2.10.1 (venv tạm `/tmp`, OSV API — xem
`docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md` §2):

| Requirements | Kết quả |
|---|---|
| caption (`faster-whisper==1.2.1`) | ✅ Sạch — 0 lỗ hổng |
| tts (`vieneu==3.8.3`, `numpy==2.5.4`) | 🔴 **39 lỗ hổng, toàn bộ ở Pillow 12.3.0** (dep transitive qua cây vieneu — không phải pin trực tiếp), fix 13.0.0 |
| reframe (`opencv==5.0.0.93`, `numpy==2.5.4`) | ✅ Sạch — 0 lỗ hổng |
| bgremove (`rembg[cpu]==2.0.60`, `onnxruntime==1.23.2`, `opencv==5.0.0.93`, `numpy==2.2.6`, `Pillow==10.2.0`) | 🔴 **66 lỗ hổng**: rembg 2.0.60 — 4 (PYSEC-2026-2274 ×2, GHSA-55v6-g8pm-pw4c, CVE-2026-115924; fix 2.0.75/2.0.82); Pillow 10.2.0 (pin trực tiếp) — 62, fix 10.3.0/12.2.0/12.3.0/13.0.0 |
| tracking (`numpy==2.5.4`, `opencv==5.0.0.93`) | ✅ Sạch — 0 lỗ hổng |

Mức độ: VCut là app local, Pillow chỉ đọc/ghi ảnh do user tự mở (không
parse ảnh từ mạng), rembg chạy như library — rủi ro thực tế thấp hơn con
số 105 gợi ý, nhưng KHÔNG được coi là "không sao": các CVE Pillow 2026
chủ yếu là lỗi parse ảnh (đọc file ảnh độc hại có thể crash/lộ bộ nhớ).
**Chưa vá trong đợt này** — bump Pillow 10.2.0 → 13.0.0 / rembg 2.0.60 →
2.0.75+ cần đợt riêng verify lại pipeline bgremove (BiRefNet session ở
2.0.60 là lý do pin này tồn tại — xem §3.3) và cây vieneu/TTS. Hệ quả
trước mắt: job `pip-audit` trong `ci-security.yml` (fail khi có BẤT KỲ
lỗ hổng nào) sẽ ĐỎ ở lần chạy CI đầu tiên. `npm audit` local vẫn chưa
chạy được (403 policy registry nội bộ, verify 08/11) nên CVE npm chưa
có số mới.

## 4. Khuyến nghị cho CI/Release

1. ~~Bật quét CVE tự động trong GitHub Actions~~ ✅ đã bật 2026-10-21 (K4):
   `.github/workflows/ci-security.yml` — `npm audit --audit-level=high` cho
   root workspaces + mcp-server + cli (fail ở high/critical), `pip-audit`
   cho cả 5 requirements đã pin (caption, tts, reframe, bgremove,
   tracking — tracking thêm vào workflow ở đợt 63 R10, xem LIMITS R10 §5).
   pip-audit CLI không có cổng severity nên job này fail khi có bất kỳ lỗ
   hổng nào — chặt hơn high/critical, ghi rõ trong workflow. Cộng quét
   định kỳ thứ 2 hàng tuần. YAML đã parse kiểm chứng. LƯU Ý: workflow
   chưa chạy thật trên GitHub (chưa có push nào sau khi thêm file) — lần
   push đầu cần theo dõi log. Rà lại 08/11 (đợt 66 T10, xem
   `docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md`): YAML đúng, 3 lockfile +
   5 requirements khớp, không lệch; quét `pip-audit` local: caption/
   reframe/tracking sạch, tts 39 + bgremove 66 lỗ hổng (xem §3.5) — job
   pip-audit sẽ ĐỎ ở lần chạy CI đầu tiên cho tới khi bump pin.
2. ~~Sửa §3.1 (CORS)~~ ✅ đã sửa 2026-10-20; ~~§3.2 (diskStorage)~~ ✅ đã
   sửa 2026-10-21 — cả hai đều xong trước bản release public đầu tiên.
3. Pin Python dependencies kèm hash cho release pipeline (R1-102) — pin
   `==` đã xong (K4); `--require-hashes` còn lại cho bước release.
4. Chạy lại audit này mỗi khi thêm dependency mới hoặc model AI mới.

## 5. Báo cáo lỗ hổng

Phát hiện lỗ hổng? Mở issue trên GitHub repo với nhãn `security`.
Không gửi PoC khai thác công khai trước khi có bản vá.
