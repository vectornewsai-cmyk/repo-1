# LIMITS — Phase 9 đợt 70, luồng X9: ci-security.yml + ci-build.yml vẫn 403 — kiểm tra lại remote + củng cố workaround local

Ngày: 09/11/2026 (lượt cron 06:35 +07). Nhiệm vụ: nợ đợt 69 §4 mục 9
(`ci-security.yml` + `ci-build.yml` vẫn 403). CHỈ ĐỌC remote + LOCAL,
KHÔNG push, KHÔNG release/tag, KHÔNG binary. Chỉ sửa file text trong
`~/workspace/repo-1`. Đọc trước: `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md`
(U9) + `docs/PHASE9_ROUND68_V9_DOCS_CI_LIMITS.md` (V9).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Quyền vẫn 403 — file workflow VẪN CHƯA có trên GitHub, repo VẪN
   CHƯA CÓ lần chạy Actions nào.** Verify 09/11 ~06:40 +07 bằng API công
   khai chỉ đọc: contents `.github/workflows/` → 404, `ci-security.yml`
   → 404, `ci-build.yml` → 404, actions runs → `total_count: 0`.
   HEAD remote vẫn `5f548ef8` (push #4, 2026-11-08T14:37:16Z) — không có
   push nào mới từ sau push #4.
2. **`ci-security.yml` KHÔNG lệch — KHÔNG sửa file này.** YAML parse
   đúng, 2 job (npm-audit 5 step + pip-audit 8 step), 3 lockfile + 5
   requirements toàn pin `==` đều khớp repo hiện tại. `ci-build.yml`
   header đã sửa ở V9 (không còn cảnh báo mcp-server FAIL stale).
3. **CI local chạy lại được — script vẫn quét được (PASS 7 / FAIL 1 /
   BLOCKED 3, exit 1).** Chỉ còn FAIL duy nhất ở pip-audit tts (39
   advisory, toàn Pillow 12.3.0 — gradio kẹp `pillow<13`, W7 đã chứng
   minh không bump được). **bgremove ĐÃ SẠCH (66 → 0)** sau bump U8 —
   verify độc lập lần thứ 3 (U8 → W1 → X9 này). npm audit ×3 vẫn BLOCKED
   403 policy (lần thứ 4 liên tiếp kể từ 20/10).
4. **OSV npm vẫn chưa có số** — W1 thử 3 lần đều ReadTimeout 300 s ở
   api.osv.dev:443; luồng X4 đợt 70 (phối hợp) CHƯA có LIMITS trên đĩa
   lúc X9 kiểm tra (~06:40 +07) nên không chờ, không chạy lại OSV npm
   trong luồng này. Script `ci-local.sh` KHÔNG thêm bước OSV-npm (sẽ
   treo hàng chục phút mà không cho số) — ghi rõ lý do trong header.
5. **`.github/workflows/*.yml` TUYỆT ĐỐI KHÔNG có trong batch stage lần
   này** (khác U9 đợt 67 vốn stage `ci-security.yml` theo brief lúc đó;
   brief X9 cấm rõ + V9 đợt 68 cũng đã loại). User thêm tay qua web
   GitHub khi sẵn sàng (xem `docs/CI_MANUAL_ADD_GUIDE.md`).
6. **Phát hiện + sửa trong luồng này:** `SECURITY.md` còn 2 chỗ stale
   ghi "bgremove 66" (đã sửa + thêm đính chính 09/11); header
   `ci-local.sh` + `CI_MANUAL_ADD_GUIDE.md` §3.1 đã cập nhật trạng thái
   09/11 (bgremove sạch, OSV npm timeout). Không sửa code sản phẩm.

## 1. Trạng thái remote (API công khai chỉ đọc, 09/11 ~06:40 +07)

| Kiểm tra | Kết quả |
|---|---|
| Commit HEAD (commits API, branch main) | `5f548ef837680cdf6069a04fd1f8b436182a34a8` — "Phase 9 rounds 51-66 + Phase 10 Electron desktop (merged, large files 4/4: 4 files)", 2026-11-08T14:37:16Z = PUSH #4, **không đổi so với U9** |
| `GET contents/.github/workflows` | **HTTP 404 Not Found** |
| `GET contents/.github/workflows/ci-security.yml` | **HTTP 404 Not Found** |
| `GET contents/.github/workflows/ci-build.yml` | **HTTP 404 Not Found** |
| `GET actions/runs?per_page=5` | HTTP 200, **`total_count: 0`** |
| Rate limit còn lại lúc kiểm tra | 59/60 (unauthenticated) |

Không gặp lỗi 403 nào trong bước đọc này (chỉ 404 = chưa tồn tại — đúng
kỳ vọng, vì push #4 loại workflows và từ đó chưa có push nào mới).
Lỗi 403 workflows:write gốc (Phase 6) vẫn chưa được kiểm chứng lại
bằng cách thử push — và KHÔNG thử, đúng lệnh đứng (không ghi qua
GitHub). Muốn biết quyền đã đủ chưa, cách duy nhất là user thử thêm
file qua web (`docs/CI_MANUAL_ADD_GUIDE.md`) hoặc thử push từ main
chat ở lần push sau.

Local `.github/workflows/` vẫn 5 file, tất cả local-only:
ci-build.yml, ci-e2e.yml, ci-integration.yml, ci-security.yml,
release.yml. Lưu ý: repo local `~/workspace/repo-1` KHÔNG có thư mục
`.git` (đồng bộ file, không phải git checkout) nên không chạy được
`git log`/`git status` tại chỗ — trạng thái remote lấy qua API công
khai như trên.

## 2. Rà soát workflow local (không sửa nội dung)

### 2.1 `ci-security.yml` — không lệch

| Hạng mục kiểm tra | Kết quả |
|---|---|
| YAML parse (`python3 yaml.safe_load`, PyYAML) | ✅ Đúng; jobs `npm-audit` + `pip-audit`; `name: CI Security (CVE scan)` |
| npm audit — 3 lockfile | ✅ Khớp: root `package-lock.json`, `mcp-server/package-lock.json`, `cli/package-lock.json` đều tồn tại; không có lockfile thứ 4 |
| pip-audit — 5 requirements | ✅ Khớp: cả 5 file tồn tại, mọi pin đều `==` |
| Pins trên đĩa (đọc trực tiếp) | caption `faster-whisper==1.2.1`; tts `vieneu==3.8.3`, `numpy==2.5.4`; reframe `opencv-python-headless==5.0.0.93`, `numpy==2.5.4`; **bgremove `rembg[cpu]==2.0.87`, `onnxruntime==1.23.2`, `opencv-python-headless==5.0.0.93`, `numpy==2.5.4`, `Pillow==13.0.0`** (đã đổi theo U8 — khác U9 lúc còn 2.0.60/10.2.0; workflow không chứa pin nên KHÔNG cần sửa theo); tracking `numpy==2.5.4`, `opencv-python-headless==5.0.0.93` |
| Requirements/lockfile mới đợt 68–70 | Không có file mới (đúng 5 requirements + 3 lockfile) |
| Lệch duy nhất còn lại | Không có lệch nào về coverage |

**Không sửa `ci-security.yml`.** Quan sát cũ còn nguyên (không sửa,
quyết định của parent — như U9 §2): step `pip install pip-audit`
không pin version; các action dùng tag major (`checkout@v4`,
`setup-node@v4`, `setup-python@v5`).

### 2.2 `ci-build.yml` — header đã đúng (V9 sửa, không đụng lại)

Header cũ cảnh báo mcp-server build FAIL đã được V9 sửa; đối chiếu
09/11: file mở đầu bằng `# CI Build — VCut Studio (R1-003)` + mục COVER
đầy đủ, không còn dòng cảnh báo stale. Không sửa thêm. Nội dung job/
step giữ nguyên (matrix Node 20/22, build apps/web + mcp-server,
typecheck video-spec, mirror check).

## 3. Script CI-local — chạy lại thật 09/11 (log: `/tmp/x9-ci-local-run.log`)

Venv cũ `/tmp/vcut-ci-local-venv` đã mất sau restart (tmpfs bị dọn —
verify 09/11); script tự tạo lại venv + cài `pip-audit==2.10.1`.
Tổng thời gian ~8,4 phút (506 s, gồm tạo venv + pip-audit ×5 qua OSV
+ secret scan grep toàn repo). Exit 1.

| Bước | Kết quả 09/11 (X9) | So với U9 (08/11) |
|---|---|---|
| yaml-parse | ✅ PASS — jobs: npm-audit,pip-audit | Không đổi |
| pin-check | ✅ PASS — 5 requirements toàn pin `==`, 3 lockfile tồn tại | Không đổi |
| npm-audit:root | ⛔ BLOCKED — 403 policy_denied | Không đổi (lần 4 liên tiếp kể từ 20/10) |
| npm-audit:mcp-server | ⛔ BLOCKED — 403 policy_denied | Không đổi |
| npm-audit:cli | ⛔ BLOCKED — 403 policy_denied | Không đổi |
| pip-audit:caption | ✅ PASS — sạch | Không đổi |
| pip-audit:tts | 🔴 FAIL — exit 1, **39 advisory, package: pillow** | Không đổi (W7: gradio kẹp `pillow<13`, không bump được) |
| pip-audit:reframe | ✅ PASS — sạch | Không đổi |
| pip-audit:bgremove | ✅ PASS — sạch ("No known vulnerabilities found") | **ĐỔI: 66 → 0** (U8 bump rembg 2.0.87 + Pillow 13.0.0; verify lần 3: U8 → W1 → X9) |
| pip-audit:tracking | ✅ PASS — sạch | Không đổi |
| secret-scan:local-only | ✅ PASS — không thấy token/private-key mẫu; đã bỏ qua **4 dòng allowlist** | PASS, số dòng allowlist 3 → 4 (xem 3.1) |
| **Tổng** | **PASS 7 / FAIL 1 / BLOCKED 3, exit 1** | U9 lần 2: PASS 6 / FAIL 2 / BLOCKED 3 — cải thiện đúng 1 bước (bgremove) |

### 3.1 Secret scan — vì sao allowlist 3 → 4 dòng (không phải secret mới)

4 dòng khớp chuỗi allowlist `ghp_abcdefghijklmnopqrstuvwx` (token mẫu
có chủ ý, đã giải thích ở U9 §3.2), đếm trực tiếp trên đĩa 09/11:

- `server/bridge/test/test-error-detail.cjs:48` — 1 dòng (fixture test
  redact, như U9).
- `scripts/ci-local.sh` — 2 dòng (comment giải thích + gán biến
  `ALLOWLIST`, như U9).
- `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md` — 1 dòng (U9 §3.2 trích
  chuỗi token mẫu để giải thích; file này chưa tồn tại lúc U9 chạy
  script lần 2 nên khi đó chỉ đếm 3).

Tổng 1+2+1 = 4, khớp đúng số script báo. Không có token thật mới nào.
Lưu ý: chuỗi token mẫu bị redact thành `<redacted>` trong output của
một số tool — đã xác minh bằng `grep -c` trên từng file cụ thể, không
dựa vào output đã redact.

### 3.2 Cập nhật script (chỉ comment header — không đổi hành vi)

`scripts/ci-local.sh`: cập nhật khối "Giới hạn đã biết trên VM này"
— bgremove sạch (U8/W1/X9), tts 39 còn nguyên (W7), npm audit BLOCKED
lần 4, OSV npm bulk query timeout (W1, xem §4), venv tmpfs mất sau
restart (script tự tạo lại). Kiểm chứng sau sửa: `bash -n
scripts/ci-local.sh` → SYNTAX OK. Không chạy lại toàn bộ script sau
sửa comment (sửa không chạm logic; lần chạy §3 là bằng chứng chạy được
mới nhất).

## 4. OSV npm — phối hợp X4 (không chờ, không chạy lại)

- Luồng X4 đợt 70 được giao kiểm tra OSV npm sau khi W1 bị chặn —
  **chưa có LIMITS X4 nào trên đĩa** lúc X9 kiểm tra (09/11 ~06:40
  +07: `docs/` không có file `PHASE9_ROUND70*` nào, `hidden_files/`
  không có log `round70*` nào). Theo brief: đọc nếu có, không chờ.
- Trạng thái OSV npm gần nhất (W1, `hidden_files/round69-w1-osv-npm.txt`
  + `docs/PHASE9_ROUND69_W1_BGREMOVE_VERIFY_LIMITS.md` §5): bulk query
  3 lockfile, 490 name@version, 20 batch — batch 1–2/20 fail 3/3 attempt
  mỗi batch (`ReadTimeout` 300 s, api.osv.dev:443); tiến trình chết theo
  runtime restart, không chạy tiếp. Mẫu lỗi ổn định qua 3 lượt/ngày khác
  nhau → POST tới api.osv.dev bị chặn/timeout từ môi trường này.
- Quyết định trong luồng này: **không chạy lại OSV npm, không thêm bước
  OSV-npm vào `ci-local.sh`** — một lần chạy thử tốn hàng chục phút
  (20 batch × 300 s timeout) mà không cho số; CVE npm chỉ đo được trên
  runner GitHub sau khi user thêm workflow tay. Nếu X4 đợt 70 (hoặc đợt
  sau) tìm được cách khác đo CVE npm, cập nhật `CI_MANUAL_ADD_GUIDE.md`
  §3.1 và header `ci-local.sh` theo.
- Đã bổ sung ghi chú OSV npm timeout vào `docs/CI_MANUAL_ADD_GUIDE.md`
  §3.1 (dòng: bulk query 490 name@version, 3 lần ReadTimeout 300 s) để
  user không tưởng CVE npm "chưa ai thử đo".

## 5. Dự đoán lần chạy CI thật đầu tiên trên GitHub (cập nhật từ U9 §4)

| Job | Dự đoán | Căn cứ |
|---|---|---|
| `npm-audit` (3 step) | ❓ CHƯA BIẾT — chưa đo được local | `npm audit` bị chặn 403 policy trên VM này (verify lại 09/11, lần 4 liên tiếp kể từ 20/10); OSV npm bulk cũng timeout (W1). CVE npm chưa có số mới kể từ audit 20/10. Chỉ đo được khi chạy trên runner GitHub. |
| `pip-audit` (5 step) | 🔴 ĐỎ — chỉ còn tts 39 | pip-audit 2.10.1 qua OSV, chạy lại 09/11: caption/reframe/bgremove/tracking sạch, tts 39 (Pillow 12.3.0). Job fail khi có BẤT KỲ lỗ hổng nào (thiết kế có chủ ý). |
| YAML / checkout / setup | ✅ XANH (dự đoán) | YAML parse đúng; các action tag major chuẩn; không có gì trong workflow phụ thuộc vào file đã đổi ở đợt 68–70. |
| `ci-build` (khi thêm tay) | ✅ XANH kỳ vọng | mcp-server build đã pass (V9 verify tsc exit 0, 09/11). |

Muốn lần chạy đầu xanh: (1) xong nợ TTS 39 — chờ gradio gỡ kẹp
`pillow<13` (W7: gradio 6.31.0 mới nhất vẫn kẹp; vieneu 3.8.3 không
đổi) hoặc vieneu bỏ dep gradio; (2) chạy lại `bash scripts/ci-local.sh`
cho tới khi pip-audit 5/5 sạch; (3) user thêm file workflow qua web
GitHub (`docs/CI_MANUAL_ADD_GUIDE.md`) rồi theo dõi log Actions lần
chạy đầu (cả 2 job; riêng npm-audit là lần đầu có số CVE npm mới).

## 6. Hướng dẫn user thêm tay — trạng thái hiện tại

`docs/CI_MANUAL_ADD_GUIDE.md` đã đúng và đủ (V9): luồng click chung
(Add file → Create new file → Commit new file → tab Actions) + bảng 5
file + kỳ vọng lần chạy đầu từng file. Luồng này chỉ bổ sung ghi chú
OSV npm timeout ở §3.1 (xem §4). Không viết lại hướng dẫn — tên nút/
luồng trên github.com không đổi theo những gì kiểm chứng được; nếu user
báo UI GitHub đổi, cập nhật guide theo đúng màn hình user thấy.

Thứ tự khuyên dùng khi thêm tay: `ci-security` → `ci-build` →
`ci-e2e` → `ci-integration` → `release` (release.yml chỉ chạy khi có
tag; release gate vẫn giữ — KHÔNG tạo tag để thử).

## 7. Không đụng / không làm

- Không sửa `ci-security.yml` / `ci-build.yml` nội dung (không lệch —
  chỉ `ci-local.sh` header comment + 2 doc text). Không sửa pin Python
  (TTS 39 thuộc gradio/vieneu — ngoài phạm vi; bgremove đã xong ở U8).
- Không sửa code sản phẩm — chỉ 4 file text (xem §8). Vì vậy không chạy
  tsc/vite build/test suite (không có code nào đổi; chỉ chạy kiểm chứng
  có mục tiêu: `scripts/ci-local.sh` chạy thật + `bash -n` sau sửa).
- Không thử push / không ghi qua GitHub connector / không thử đường vòng
  nào khi gặp 403. Không gặp 403 ghi nào trong luồng này (chỉ 404 đọc).
- Không tạo tag/release. Không đưa workflow vào batch stage.
- Sự cố môi trường trong luồng: lần chạy `ci-local.sh` đầu tiên bị gián
  đoạn do service restart (không để lại log/venv — kiểm tra đĩa xác nhận
  chưa chạy gì rồi mới chạy lại; lần 2 chạy nền xong toàn bộ, exit 1
  đúng dự báo). Grep đệ quy toàn repo để đếm allowlist bị chậm (>3 phút
  chưa xong) nên đã kill — thay bằng grep đích danh từng file (xem §3.1).

## 8. File đổi trong luồng này

- `scripts/ci-local.sh` (sửa — chỉ comment header, §3.2).
- `docs/CI_MANUAL_ADD_GUIDE.md` (sửa — thêm ghi chú OSV npm timeout §3.1).
- `SECURITY.md` (sửa — 2 chỗ stale "bgremove 66" + đính chính 09/11 ở §3.5):
  §2.6 (dòng 86–87) và §4.1 (dòng ~248–252) nay ghi rõ snapshot 08/11 +
  đính chính bgremove sạch 0; bảng §3.5 giữ nguyên là snapshot 08/11 có
  chủ ý (đối chiếu lịch sử) + thêm đoạn đính chính 09/11 ngay dưới bảng.
- `docs/PHASE9_ROUND70_X9_CI_WORKFLOWS_LIMITS.md` (mới — file này).
- `.github/workflows/ci-security.yml`, `ci-build.yml` — KHÔNG sửa nội
  dung, KHÔNG đưa vào batch stage (xem §0 mục 5).

## 9. Batch stage (KHÔNG push)

File stage: `~/workspace/repo-1-push/paths-loop/phase9-round70-x9-ci-workflows.txt`
(NUL-delimited, text only, verify read-back):

- `scripts/ci-local.sh` (sửa — comment header)
- `docs/CI_MANUAL_ADD_GUIDE.md` (sửa — ghi chú OSV npm)
- `SECURITY.md` (sửa — đính chính bgremove 66 → 0)
- `docs/PHASE9_ROUND70_X9_CI_WORKFLOWS_LIMITS.md` (mới)

**KHÔNG có trong batch:** `.github/workflows/*.yml` (cả 5 file —
không sửa nội dung; đưa vào sẽ 403 khi user push). Không binary.

## 10. Nợ mở

1. **TTS 39 CVE vẫn chờ gradio gỡ kẹp `pillow<13`** (W7: gradio 6.31.0
   mới nhất vẫn kẹp; dry-run `vieneu + Pillow 13` =
   `ResolutionImpossible`). Đây là lý do duy nhất job `pip-audit` sẽ
   ĐỎ ở lần chạy CI đầu. Theo dõi: gradio bản mới / vieneu bỏ dep gradio.
2. **5 file workflow vẫn chờ user thêm tay qua web** (403 từ Phase 6,
   user đã cấp quyền 2 lần nhưng vẫn 403 — chưa kiểm chứng lại bằng
   cách thử push, và sẽ không thử từ phiên nền). Sau khi thêm tay: theo
   dõi log Actions lần đầu (pip-audit đỏ vì tts 39; npm-audit lần đầu
   có số CVE npm).
3. **CVE npm vẫn chưa có số mới kể từ audit 20/10** — local 403 policy
   (lần 4) + OSV npm bulk timeout (W1, 3 lần). X4 đợt 70 chưa có LIMITS
   trên đĩa; đợt sau kiểm tra lại xem X4 có cách đo khác không.
4. Step `pip install pip-audit` trong workflow không pin version (ghi
   nhận từ T10/U9 — quyết định của parent).
5. Venv `/tmp/vcut-ci-local-venv` là tmpfs — mất sau mỗi restart, script
   tự tạo lại (đã verify 09/11). Không đưa venv vào batch.
