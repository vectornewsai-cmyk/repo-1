# LIMITS — Phase 9 đợt 67, luồng U9: ci-security.yml — trạng thái quyền + CI local tương đương

Ngày: 08/11/2026 (lượt cron 21:35 +07). Nhiệm vụ: nợ đợt 66 §8 mục 9
(`ci-security.yml` vẫn chờ quyền workflows, từ Phase 6). CHỈ ĐỌC + LOCAL,
KHÔNG push, KHÔNG release/tag, KHÔNG binary. Chỉ sửa file text trong
`~/workspace/repo-1`.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Quyền vẫn 403 — file workflow VẪN CHƯA có trên GitHub, repo VẪN
   CHƯA CÓ lần chạy Actions nào.** Verify 08/11 ~21:37 +07 bằng API công
   khai chỉ đọc: contents `.github/workflows/ci-security.yml` → 404,
   contents `.github/workflows` → 404, root contents → 200 nhưng KHÔNG
   có `.github`, actions runs → `total_count: 0`.
2. **Push #4 đã xong trong lúc đợt 67 bắt đầu** (user nhắn "Push 1 lần
   luôn", gộp Phase 10 + đợt 51–66, 751 file duy nhất, 9 commit, HEAD
   `5f548ef8`, 2026-11-08T14:37:16Z). Push này LOẠI cả 5 file workflow
   (sẽ 403) — không đổi kết luận mục 1. Sau push #4 không còn batch chờ
   push (đợt 67 chưa stage xong lúc 21:37).
3. **`ci-security.yml` KHÔNG lệch — KHÔNG sửa file này.** YAML đúng,
   2 job (npm-audit 5 step + pip-audit 8 step), 3 lockfile + 5
   requirements pin `==` đều khớp repo hiện tại. **Luồng U8 (bump
   Pillow/rembg) chưa có dấu hiệu xong** (không có docs/log/paths-loop
   đợt 67 nào lúc kiểm tra; pins trên đĩa vẫn Pillow 10.2.0 /
   rembg 2.0.60) — workflow không cần sửa theo U8 vì U8 chưa đổi pin.
4. **Script CI-local mới `scripts/ci-local.sh`** mô phỏng đúng workflow
   + thêm 2 bước local-only (YAML parse, pin check, secret scan).
   Chạy thật lần 1 (08/11, pip-audit 2.10.1, venv `/tmp/vcut-ci-local-venv`):
   PASS 5 / FAIL 3 / BLOCKED 3, exit 1. pip-audit: caption/reframe/
   tracking sạch; **tts 39 + bgremove 66** (khớp y hệt đợt 66 T10).
   npm audit ×3 BLOCKED (403 policy_denied — registry nội bộ).
   Secret scan lần 1 FAIL giả do 3 false positive (đã sửa script, xem §3).
5. **Dự đoán lần chạy CI thật đầu tiên trên GitHub: job `pip-audit` ĐỎ**
   (tts 39 + bgremove 66, cho tới khi U8 bump pin xong + verify);
   job `npm-audit` CHƯA ĐO ĐƯỢC local (chỉ đo được trên GitHub).
   Muốn lần chạy đầu xanh: (a) xong U8 bump + verify pipeline,
   (b) chạy lại `scripts/ci-local.sh` cho tới khi pip-audit sạch,
   (c) user thêm file workflow qua web GitHub (§5) rồi theo dõi log Actions.
6. **`ci-security.yml` CÓ trong batch stage lần này** (theo đúng brief
   luồng U9 — chuẩn bị batch để user push sau từ main chat; khác mẫu
   các đợt trước vốn không stage file này vì không sửa. File này KHÔNG
   sửa nội dung trong luồng này; stage để nó đi cùng batch đợt 67).

## 1. Trạng thái quyền / remote (API công khai chỉ đọc, 08/11 ~21:37 +07)

| Kiểm tra | Kết quả |
|---|---|
| `git ls-remote ... HEAD` | `5f548ef837680cdf6069a04fd1f8b436182a34a8` |
| Commit HEAD (contents API) | "Phase 9 rounds 51-66 + Phase 10 Electron desktop (merged, large files 4/4: 4 files)", 2026-11-08T14:37:16Z = PUSH #4 |
| `GET contents/.github/workflows/ci-security.yml` | **HTTP 404 Not Found** (kiểm 2 lần) |
| `GET contents/.github/workflows` | **HTTP 404 Not Found** |
| `GET contents/` (root) | HTTP 200 — KHÔNG có `.github` |
| `GET actions/runs?per_page=5` | HTTP 200, **`total_count: 0`** |
| Rate limit còn lại lúc kiểm tra | 56/60 (unauthenticated) |

Không gặp lỗi 403 nào trong bước đọc này (chỉ 404 = chưa tồn tại — đúng
kỳ vọng, vì push #4 loại workflows). Lỗi 403 workflows:write gốc (Phase 6)
vẫn chưa được kiểm chứng lại bằng cách thử push — và KHÔNG thử, đúng lệnh
đứng (không ghi qua GitHub). Muốn biết quyền đã đủ chưa, cách duy nhất là
user thử thêm file qua web (§5) hoặc thử push từ main chat ở lần push sau.

Local `.github/workflows/` vẫn 5 file, tất cả local-only: ci-build.yml,
ci-e2e.yml, ci-integration.yml, ci-security.yml, release.yml. Push #4 đã
loại ci-build.yml (ghi trong MEMORY.md) — cùng lý do 403.

## 2. Rà soát ci-security.yml local (không sửa)

| Hạng mục kiểm tra | Kết quả |
|---|---|
| YAML parse (`python3 yaml.safe_load`, PyYAML 6.0.1) | ✅ Đúng; jobs `npm-audit` + `pip-audit` |
| npm audit — 3 lockfile | ✅ Khớp: root `package-lock.json`, `mcp-server/package-lock.json`, `cli/package-lock.json` đều tồn tại; không có lockfile thứ 4 |
| pip-audit — 5 requirements | ✅ Khớp: cả 5 file tồn tại, mọi pin đều `==` |
| Pins trên đĩa (đọc trực tiếp) | caption `faster-whisper==1.2.1`; tts `vieneu==3.8.3`, `numpy==2.5.4`; reframe `opencv-python-headless==5.0.0.93`, `numpy==2.5.4`; bgremove `rembg[cpu]==2.0.60`, `onnxruntime==1.23.2`, `opencv-python-headless==5.0.0.93`, `numpy==2.2.6`, `Pillow==10.2.0`; tracking `numpy==2.5.4`, `opencv-python-headless==5.0.0.93` — **y hệt đợt 66 T10, không đổi** |
| U8 bump Pillow/rembg? | ❌ Chưa thấy: không có `docs/PHASE9_ROUND67*`, không có `hidden_files/round67*`, không có `paths-loop/*round67*` lúc kiểm tra (~21:38 +07); pins trên đĩa chưa đổi |
| Requirements/lockfile mới đợt 67 | Không có file mới (find chỉ ra đúng 5 requirements + 3 lockfile cũ) |
| Comment header workflow | Còn đúng: "5 requirements", "3 lockfile", tracking thêm đợt 63 R10 |
| Lệch duy nhất còn lại | Không có lệch nào về coverage |

**Không sửa `ci-security.yml`.** Quan sát (không sửa, quyết định của
parent — như T10 đã ghi): step `pip install pip-audit` không pin version;
các action dùng tag major (`checkout@v4`, `setup-node@v4`,
`setup-python@v5`) — chuẩn chung, không phải lệch. Lưu ý vận hành: venv
tạm `/tmp/pip-audit-venv` của T10 đã mất sau restart (tmpfs bị dọn) —
script mới dùng venv riêng `/tmp/vcut-ci-local-venv` (ngoài repo, không stage).

## 3. Script CI-local — `scripts/ci-local.sh`

Mô phỏng đúng workflow + 2 bước local-only ghi rõ trong header script:
YAML parse (thêm), pin check (thêm), npm audit ×3, pip-audit ×5,
secret scan (thêm — workflow KHÔNG có bước này, workflow ghi rõ quét
secret dùng GitHub secret scanning ở repo settings).

Exit code: 0 = mọi bước chạy được đều PASS; 1 = có bước FAIL;
2 = có bước BLOCKED và không có FAIL.

### 3.1 Chạy lần 1 — 08/11 ~21:42 +07 (log đầy đủ: `/tmp/u9-ci-local-run1.log`)

Tạo venv mới `/tmp/vcut-ci-local-venv`, `pip-audit==2.10.1` (pin theo bản
T10 đã verify). Tổng thời gian ~99 s.

| Bước | Kết quả |
|---|---|
| yaml-parse | ✅ PASS — jobs: npm-audit,pip-audit |
| pin-check | ✅ PASS — 5 requirements toàn pin `==`, 3 lockfile tồn tại |
| npm-audit:root | ⛔ BLOCKED — 403 policy_denied (registry nội bộ chặn endpoint npm audit) |
| npm-audit:mcp-server | ⛔ BLOCKED — 403 policy_denied |
| npm-audit:cli | ⛔ BLOCKED — 403 policy_denied |
| pip-audit:caption | ✅ PASS — sạch |
| pip-audit:tts | 🔴 FAIL — exit 1, **39 advisory, package: pillow** |
| pip-audit:reframe | ✅ PASS — sạch |
| pip-audit:bgremove | 🔴 FAIL — exit 1, **66 advisory, package: pillow,rembg** |
| pip-audit:tracking | ✅ PASS — sạch |
| secret-scan:local-only | 🔴 FAIL (giả — xem 3.2) |
| **Tổng** | **PASS 5 / FAIL 3 / BLOCKED 3, exit 1** |

Số pip-audit khớp y hệt đợt 66 T10 (tts 39 Pillow 12.3.0 transitive;
bgremove 66 = rembg 2.0.60 ×4 + Pillow 10.2.0 ×62) — OSV không đổi
đáng kể trong 3 giờ qua. Chi tiết advisory xem T10 §2.2–2.3.

### 3.2 Secret scan — 3 false positive lần 1, đã sửa script

1. `server/bridge/test/test-error-detail.cjs:48` — file test chứa token
   mẫu `ghp_...` (chuỗi alphabet tuần tự, dùng để test logic redact;
   test ở dòng 86 ghi rõ "không còn ghp_ token mẫu"). Đây là fixture
   có chủ ý, không phải secret thật. Lưu ý: output tool của agent tự
   redact chuỗi này thành `<redacted>` nên lúc đầu soi không thấy —
   đã xác minh bằng `od -c` + `grep -abo`.
   → Sửa: thêm allowlist đúng chuỗi này trong script, có comment giải thích.
2. `apps/desktop/build/slim-venv/tts/.../PIL/ImageFont.py:1267` và
   `.../bgremove/.../ImageFont.py:1066` — dữ liệu base64 trong file
   font của Pillow (thư viện bên thứ ba đã đóng gói) tình cờ chứa chuỗi
   `AKIA...` (16 ký tự hoa/số). Không phải secret.
   → Sửa: loại thư mục `build`, `slim-venv` và mọi đường dẫn
   `site-packages/` khỏi phạm vi quét (đó là artifact đã sinh, không
   phải source của dự án).

Sau sửa: chạy lại lần 2 (08/11 ~21:46 +07, log: `/tmp/u9-ci-local-run2.log`).
Kết quả thật: **secret-scan PASS** ("không thấy token/private-key mẫu
trên; đã bỏ qua 3 dòng allowlist (token mẫu trong test fixture)" — cả 3
dòng đều là chuỗi token mẫu `ghp_abcdefghijklmnopqrstuvwx` trong cùng
file test); các bước khác giữ nguyên. **Tổng lần 2: PASS 6 / FAIL 2 /
BLOCKED 3, exit 1** — chỉ còn FAIL ở pip-audit tts (39) + bgremove (66),
đúng thực trạng CVE. Script đã verify chạy ổn định 2 lần liên tiếp với
cùng số pip-audit (39/66) và cùng 3 BLOCKED npm audit.

## 4. Dự đoán lần chạy CI thật đầu tiên trên GitHub

| Job | Dự đoán | Căn cứ |
|---|---|---|
| `npm-audit` (3 step) | ❓ CHƯA BIẾT — chưa đo được local | `npm audit` bị chặn 403 policy trên VM này (verify lại 08/11, lần 3 liên tiếp kể từ 20/10). CVE npm chưa có số mới kể từ audit 20/10. Chỉ đo được khi chạy trên runner GitHub. |
| `pip-audit` (5 step) | 🔴 ĐỎ — tts 39 + bgremove 66 | pip-audit 2.10.1 qua OSV, số khớp T10. Job fail khi có BẤT KỲ lỗ hổng nào (thiết kế có chủ ý). |
| YAML / checkout / setup | ✅ XANH (dự đoán) | YAML parse đúng; các action tag major chuẩn; không có gì trong workflow phụ thuộc vào file đã đổi ở đợt 67. |

Muốn lần chạy đầu xanh: (1) xong U8 — bump Pillow/rembg + verify lại
pipeline bgremove/TTS (nợ gốc từ T10 §6 mục 1); (2) chạy lại
`bash scripts/ci-local.sh` cho tới khi pip-audit 5/5 sạch;
(3) user thêm file workflow qua web GitHub (§5) rồi theo dõi log Actions
lần chạy đầu (cả 2 job; riêng npm-audit là lần đầu có số CVE npm mới).

## 5. Hướng dẫn user tự thêm file workflow qua web GitHub (khi quyền App vẫn 403)

Áp dụng khi push từ main chat vẫn trả 403 `Resource not accessible by
integration` cho file `.github/workflows/*`. Cách này không cần quyền App —
user tự tạo file bằng tài khoản GitHub của mình trên web.

Chuẩn bị: mở repo `vectornewsai-cmyk/repo-1` trên github.com, đang ở
branch `main`. Nội dung file lấy từ bản local
`~/workspace/repo-1/.github/workflows/ci-security.yml` (đã verify YAML
đúng, xem §2 — copy nguyên văn, không sửa).

Các bước (ghi theo luồng UI chuẩn của GitHub; tên nút có thể đổi nhẹ
theo bản cập nhật của GitHub):

1. Trên trang repo, bấm nút **Add file** (góc phải, trên danh sách file)
   → chọn **Create new file**.
2. Ở ô tên file, gõ đúng đường dẫn: `.github/workflows/ci-security.yml`
   (gõ `.github/` rồi `/` — GitHub tự tạo thư mục; rồi `workflows/`,
   rồi tên file). Nếu GitHub hỏi tạo thư mục, xác nhận.
3. Dán toàn bộ nội dung file local vào ô soạn thảo. Kiểm tra lại đầu
   file có dòng `name: CI Security (CVE scan)` và cuối file có step
   `pip-audit — tracking`.
4. Kéo xuống cuối trang, mục **Commit new file**: giữ nguyên
   "Commit directly to the `main` branch", sửa commit message nếu muốn
   (ví dụ: `Add CI Security workflow (CVE scan)`), rồi bấm nút xanh
   **Commit new file**.
5. Kiểm tra: vào tab **Actions** của repo — lần chạy đầu tiên
   "CI Security (CVE scan)" phải xuất hiện trong vòng 1–2 phút (trigger
   `push` trên `main`). Bấm vào lần chạy đó xem log từng job.
6. Kết quả kỳ vọng (theo §4): job `pip-audit` sẽ ĐỎ cho tới khi xong
   U8; job `npm-audit` cho số CVE npm lần đầu. Nếu lần chạy không xuất
   hiện: kiểm tra lại tên file/đường dẫn (phải đúng
   `.github/workflows/ci-security.yml`, không thừa/thiếu ký tự) rồi
   kiểm tra tab Actions có báo lỗi YAML không.
7. Lặp lại tương tự cho 4 file workflow còn lại nếu muốn bật hết CI
   (ci-build.yml, ci-e2e.yml, ci-integration.yml, release.yml) — lưu ý
   `release.yml` chỉ chạy khi có tag; release gate vẫn giữ (không tạo tag
   cho tới khi sản phẩm ngang/hơn CapCut).
8. Sau khi file đã lên bằng tay: các lần push sau từ main chat sẽ KHÔNG
   đụng tới file workflow này nữa (push-files chỉ đẩy file text trong
   batch stage; nếu batch sau có chứa `.github/workflows/*` thì vẫn có
   thể 403 — khi đó cứ để file đó ở lại, nội dung trên GitHub đã là bản
   mới nhất do user thêm tay).

Không suy đoán thêm về UI: các bước trên chỉ dùng các thành phần chuẩn
(Add file → Create new file → Commit new file → tab Actions) đã tồn tại
ổn định nhiều năm trên github.com.

## 6. Không đụng / không làm

- Không sửa `ci-security.yml` (không lệch, xem §2). Không sửa pin Python
  (thuộc U8 + cần verify pipeline — ngoài phạm vi luồng này).
- Không sửa code sản phẩm — chỉ thêm 1 script + 1 LIMITS này + sửa
  `SECURITY.md` §4.1 (xem §7). Vì vậy không chạy tsc/vite build/test suite
  (không có code nào đổi).
- Không thử push / không ghi qua GitHub connector / không thử đường vòng
  nào khi gặp 403. Không gặp 403 ghi nào trong luồng này (chỉ 404 đọc).
- Không tạo tag/release.

## 7. File đổi trong luồng này

- `scripts/ci-local.sh` (mới) — script CI-local tương đương workflow.
- `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md` (mới — file này).
- `SECURITY.md` (sửa §4.1): cập nhật "push #4 đã loại workflows" +
  trỏ tới `scripts/ci-local.sh` + LIMITS đợt 67 U9 (dòng cũ ghi "chưa có
  push nào sau khi thêm file" đã stale).
- `.github/workflows/ci-security.yml` — KHÔNG sửa nội dung, nhưng CÓ
  trong batch stage (theo brief luồng U9).

## 8. Batch stage (KHÔNG push)

File stage: `~/workspace/repo-1-push/paths-loop/phase9-round67-u9-ci-security.txt`
(NUL-delimited, text only, verify read-back):

- `.github/workflows/ci-security.yml` (không sửa nội dung — stage để user
  push sau từ main chat, theo brief luồng U9)
- `scripts/ci-local.sh` (mới)
- `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md` (mới)
- `SECURITY.md` (sửa)

Tổng chờ push sau đợt 67: parent đếm lại khi gộp (sau push #4 không còn
batch chờ; đợt 67 đang stage song song nhiều luồng).

## 9. Nợ mở

1. **Bump Pillow + rembg + verify pipeline (nợ bảo mật, từ T10 §6.1):**
   Pillow 10.2.0 → 13.0.0, rembg 2.0.60 → 2.0.75+; verify BiRefNet
   session + Python 3.10, cây vieneu/TTS với Pillow 13. Luồng U8 đợt 67
   đang làm (chưa xong lúc luồng này kiểm tra). Sau khi bump + verify
   mới chạy lại pip-audit để job CI xanh.
2. **`ci-security.yml` vẫn chờ quyền workflows** (403 từ Phase 6).
   Khi user thêm tay qua web (§5) hoặc cấp quyền xong: theo dõi log CI
   lần đầu (pip-audit sẽ đỏ tới khi xong nợ 1; npm-audit chưa có số).
3. **`npm audit` local vẫn bị chặn** (403 policy registry nội bộ) — CVE
   npm chưa có số mới kể từ audit 20/10. Cần chạy trên GitHub (khi có CI)
   hoặc môi trường khác.
4. **4 workflow còn lại cũng local-only** (ci-build, ci-e2e,
   ci-integration, release) — push #4 đã loại ci-build.yml; cần user
   thêm tay tương tự nếu muốn bật hết CI (§5 bước 7).
5. Step `pip install pip-audit` trong workflow không pin version (ghi
   nhận từ T10 — quyết định của parent).
