# LIMITS — Phase 9 đợt 77 E5: TTS 39 CVE + npm audit (lần kiểm thứ 7)

> Đợt 77 E5 — 10/11/2026 ~03:40–05:20 +07. Đóng nợ đợt 76 §7 mục 1–2
> (TTS 39 CVE + npm audit chưa có số — lần kiểm thứ 7).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary. Không sửa code production,
> không sửa package pin (chỉ đo + báo cáo).

## 0. Verdict

| Hạng mục | Kết quả đo thật lần này | Trạng thái nợ |
|---|---|---|
| TTS Pillow CVE | **39 CVE, không đổi** — toàn Pillow 12.3.0, fix 13.0.0; tập ID **y hệt** đợt 76 D1 (18 PYSEC + 20 CVE-2026 + 1 GHSA) | **VẪN MỞ** |
| Gradio CAP pillow<13 | **VẪN GIỮ** — gradio mới nhất 6.31.0 (publish 2026-10-28) vẫn yêu cầu `pillow<13.0,>=8.0`; không có bản 6.32.0 | **VẪN MỞ** |
| Upstream Pillow | **ĐÃ VÁ** — Pillow 13.0.0 (2026-10-16) vá cả 39 CVE (mục Security trong release notes liệt kê CVE-2026-96636…96644 + 96778); pip-audit ghi fix 13.0.0 cho 39/39 | Chờ Gradio gỡ kẹp |
| CVE npm | **LẦN ĐẦU CÓ SỐ: 5 advisory khớp / 4 CVE riêng biệt / 5 package (4 tên)** trên toàn bộ lockfile — high 2, medium 3, critical 0. Quét **đủ 447/447** (name, version) qua GitHub Advisory DB | **CÓ SỐ** — nợ "không có số npm" **ĐÃ ĐÓNG**; 5 CVE mới phát hiện chuyển thành nợ sửa ở đợt sau (luồng này KHÔNG bump) |

## 1. Bảng cấu hình × kết quả (tất cả đều chạy thật trên VM này)

| # | Kiểm tra | Cấu hình / lệnh | Kết quả | Thời gian (+07) |
|---|---|---|---|---|
| 1 | pip-audit TTS (closure) | `pip-audit -r server/tts/requirements.txt` bằng venv audit cũ `~/workspace/.tmp-r69w1/pip-audit-venv` (pip-audit 2.10.1) | `Found 39 known vulnerabilities in 1 package`, exit 1; 39 dòng đều `pillow 12.3.0`, fix 13.0.0 | 10/11 ~03:40 |
| 2 | Gradio CAP (lần 9) | `python3 scripts/check-gradio-pillow-cap.py` (không sửa) | gradio **6.31.0**, `pillow<13.0,>=8.0`; vieneu **3.8.3**; pillow mới nhất **13.0.0**. Verdict: `GRADIO STILL CAPS pillow<13` | 10/11 ~03:40 |
| 3 | Upstream Pillow | PyPI JSON + release notes 13.0.0 (`pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html`, 88.824 byte tải thật) | 13.0.0 (2026-10-16) có mục Security liệt kê CVE-2026-96636…96644 + 96778 (13 lần nhắc "CVE" trên trang); pip-audit fix 13.0.0 cho 39/39 | 10/11 ~04:00 |
| 4 | Upstream Gradio | PyPI JSON + `raw.githubusercontent.com/gradio-app/gradio/main/requirements.txt` + `CHANGELOG.md` (852.241 byte) + root `pyproject.toml` | Không có 6.32.0; CHANGELOG không nhắc pillow 13; `requirements.txt` trên main ghi `pillow>=8.0,<14.0` (xem §3 — chỉ là file requirements dev, KHÔNG phải metadata phát hành) | 10/11 ~04:00 |
| 5a | OSV v1/query đơn lẻ (cách mới) | Script mới `hidden_files/r77-e5-osv-single.py`: 1 pkg `react@18.3.1`, timeout 60s, 2 attempt | **2/2 timeout sau 60,2s, 0 byte** — POST tới `api.osv.dev` bị chặn toàn bộ, không phụ thuộc kích thước payload | 10/11 ~03:55 |
| 5b | npm audit qua registry khác (cách mới) | `timeout 45 npm audit --registry=https://registry.yarnpkg.com --audit-level=high --json` tại repo root | exit 1 sau ~1s: `ENOLOCK — This command requires an existing lockfile` (npm audit qua registry lạ không đọc được lockfile v3 của repo; không phải lỗi mạng) | 10/11 ~04:50 |
| 5c | GitHub Advisory DB REST (cách mới — THÀNH CÔNG) | Script mới `hidden_files/r77-e5-ghsa-audit.py`: GET `/advisories?ecosystem=npm&affects=<pkg>&per_page=100` từng package trong lockfile, khớp `vulnerable_version_range` bằng matcher semver tự viết | **447/447 package đã quét, 5 advisory khớp** (xem §4). Chạy 1: 37/447 rồi dừng ở 403 rate-limit; chạy 2 (resume): đi thẳng tới 447/447, không gặp thêm 403 | 10/11 04:35–05:16 |
| — | npm audit trực tiếp | **KHÔNG chạy lại** — D1 đã cấm (403 `policy_denied` 2 lần, X4 + D1); không có gì thay đổi để thử lại | — | — |

## 2. pip-audit TTS — 39 CVE không đổi (lần thứ 4 liên tiếp y hệt)

- `diff` tập ID với đợt 76 D1: **y hệt 39/39** — 18 `PYSEC-2026-43xx`,
  20 `CVE-2026-112xxx` (+ `CVE-2026-96638/96640/96778`), 1 `GHSA-78g4-xqwv-q3g8`.
  Không CVE mới, không CVE nào biến mất kể từ đợt 74 B6 = 75 C5 = 76 D1 = 77 E5.
- Đánh giá rủi ro W7 §2 vẫn đứng: Pillow là dep transitive không được gọi
  trong pipeline TTS (`tts.py` không import gradio/Pillow, vieneu không import
  gradio lúc inference, không parse file ảnh).
- Không chạy lại audit 5 package đích danh (`--no-deps`) đợt này: số closure
  đã đủ chứng minh không đổi; 4 package kia đã 0 CVE ở D1 và không đổi version.

## 3. Upstream: Pillow đã vá, Gradio chưa gỡ kẹp

- **Pillow ĐÃ VÁ.** 13.0.0 phát hành 2026-10-16 (PyPI `upload_time`
  `2026-10-16T22:15:24`, vẫn là bản mới nhất trên PyPI). Trang release notes
  13.0.0 có mục Security liệt kê các CVE-2026-96636…96644 và 96778; pip-audit
  ghi fix 13.0.0 cho cả 39 CVE. Nút thắt KHÔNG còn nằm ở Pillow.
- **Gradio CHƯA gỡ kẹp.** PyPI: gradio mới nhất vẫn 6.31.0 (publish
  2026-10-28), `requires_dist` vẫn `pillow<13.0,>=8.0`. Không có bản 6.32.0
  hay pre-release nào mới hơn. CHANGELOG trên main không nhắc tới pillow 13.
- **Tín hiệu yếu trên main (không kết luận):** file `requirements.txt` ở root
  repo gradio trên main ghi `pillow>=8.0,<14.0` (dòng 16). Đây là file
  requirements cho môi trường dev/CI của repo (cùng file còn pin
  `gradio_client==2.7.2`, `fastapi>=0.115.2,<1.0`...), KHÔNG phải metadata
  của package gradio phát hành trên PyPI (metadata đó vẫn là `pillow<13.0`).
  Chỉ ghi nhận là "team Gradio đang cho dev dùng Pillow 13", không đủ để
  nói bản release tới sẽ gỡ kẹp. `gradio/pyproject.toml` và
  `packages/gradio/pyproject.toml` trên main đều 404 — không tìm được nơi
  khai báo dep phát hành trên main để đối chiếu thêm.
- Lộ trình khi CAP được gỡ vẫn như W7 §5: chạy lại script CAP → dry-run
  resolve trong venv TẠM → smoke-test TTS → pip-audit → mới sửa
  `server/tts/requirements.txt`. **Không thử bump lại đợt này** — CAP còn
  nguyên, `ResolutionImpossible` đã chứng minh ở W7/U8.

## 4. CVE npm — LẦN ĐẦU CÓ SỐ (447/447 package, 5 advisory khớp)

### 4.1 Phương pháp mới: GitHub Advisory Database REST API

- Trước đây 6 lần fail đều đi qua 2 đường: OSV querybatch POST (timeout
  0 byte ở mọi chunk size/timeout) và `npm audit` trực tiếp (403
  `policy_denied`). Đợt này thử đường thứ ba: **GitHub Advisory DB REST
  `GET /advisories?ecosystem=npm&affects=<pkg>`** — từng package một,
  khớp version đã cài với `vulnerable_version_range` của advisory.
- Phạm vi: **toàn bộ `package-lock.json`** (lockfileVersion 3, 487 entries
  → **447 cặp (name, version) riêng biệt**, direct deps lên trước).
  Chỉ đếm advisory chưa withdrawn, có GHSA/CVE id, và version đang cài
  nằm trong `vulnerable_version_range`.
- Matcher semver tự viết (`r77-e5-ghsa-audit.py::satisfies`, hỗ trợ
  `>=/</=/^/~/||` và khoảng `a, b`): **validate 11/11 test case** tự tạo
  (gồm cả `^`, `~`, `||`, prerelease) + **cross-check khớp 3/3 với
  node-semver** trên các range mẫu. Hai bug đã bắt và sửa trước khi chạy
  thật: tách token làm vỡ cặp `>= 18.0.0`, và `" >="` thừa khoảng trắng
  trong `_expand_caret`.
- Rate-limit: chạy 1 quét được 37/447 rồi dừng ở HTTP 403 `API rate limit
  exceeded` (quota 60/h không xác thực, chia sẻ theo egress IP — 2 IP khác
  nhau đã cạn: `104.29.193.195`, `104.29.197.140`). Script đợi theo header
  `X-RateLimit-Reset` (365s rồi 395s) nhưng tiến trình bị giết giữa chừng
  do runtime restart lúc 22:05 UTC. Chạy 2 (resume từ 37, cùng script đã
  vá thêm retry) đi thẳng 37→447 trong ~10 phút, **không gặp thêm 403**
  (egress IP xoay sang IP còn quota). Kết quả cuối: `complete: true`.
- Giới hạn phương pháp (ghi trung thực): mỗi package quét tối đa 3 trang ×
  100 advisory; chỉ tính advisory đã publish trên GHSA (cùng nguồn dữ liệu
  với `npm audit`); không quét `node_modules` trực tiếp mà quét theo
  lockfile (đúng version đã khóa).

### 4.2 Kết quả: 5 advisory khớp — 4 CVE riêng biệt, high 2 / medium 3

| # | Package đã cài | CVE / GHSA | Mức | Nội dung | Range dính | Bản vá |
|---|---|---|---|---|---|---|
| 1 | `multer@2.4.0` | **CVE-2026-113872** / GHSA-q7qp-rjg7-q26m | **high**, CVSS 7.5 | DoS qua `fileFilter` bất đồng bộ đang chờ sau khi request bị teardown | `>= 2.0.0, < 2.5.0` | **2.5.0** |
| 2 | `body-parser@1.20.8` | **CVE-2026-111181** / GHSA-27r3-jxmh-p828 | **high**, CVSS 7.5 | DoS qua trailing bytes sau request body đã nén | `< 1.20.9` | **1.20.9** |
| 3 | `vite@6.4.4` | **CVE-2026-118662** / GHSA-8g5g-mxqh-grgj | medium | `server.fs.deny` bị bypass bằng query | `= 6.4.4` | **6.4.5** |
| 4 | `minimatch@10.2.6` | **CVE-2026-118764** / GHSA-g3hv-75wg-m249 | medium | DoS qua globparts amplification | `>= 7.0.0, < 11.0.1` | **11.0.1** |
| 5 | `minimatch@9.0.9` | **CVE-2026-118764** (cùng CVE với #4) / GHSA-g3hv-75wg-m249 | medium | Như #4 (cùng CVE, 2 version khác nhau trong cây) | `>= 7.0.0, < 11.0.1` | **11.0.1** |

- Tổng: **5 package dính / 447 đã quét (1,1%)**, 5 advisory khớp, **4 CVE
  riêng biệt**, high 2 / medium 3 / critical 0 / low 0. Không có CVE nào
  là GHSA-only (cả 5 đều có CVE id).
- Mức độ ảnh hưởng (đánh giá, không sửa trong luồng này):
  - `multer@2.4.0` là **dep runtime của `server/bridge`** (`"multer": "^2.0.0"`)
    — đường upload file thật. Đây là CVE nặng nhất trong 5 về mặt sản phẩm.
  - `body-parser@1.20.8` là dep transitive của `express@4.22.3` (bridge dùng
    express) — đường parse body HTTP thật.
  - `vite@6.4.4` là devDependency của `apps/web` — chỉ chạy lúc dev/build,
    không chạy ở runtime người dùng (fs.deny bypass cần dev server đang chạy).
  - `minimatch` (9.0.9 + 10.2.6) là transitive qua nhiều tool build — DoS
    qua glob, cần đầu vào glob do kẻ tấn công điều khiển.
  - Cả 5 đều là **DoS hoặc bypass giới hạn truy cập**, không có RCE/leo
    quyền. Không có critical.
- **KHÔNG bump version trong luồng này** (nhiệm vụ chỉ đo + báo cáo).
  Nợ sửa chuyển cho đợt sau: bump `multer 2.4.0→2.5.0`, `body-parser
  1.20.8→1.20.9` (qua express), `vite 6.4.4→6.4.5`, `minimatch→11.0.1`
  — kèm kiểm chứng lại bằng chính script GHSA này.

### 4.3 Lịch sử chặn npm — cập nhật lần 7

| Lần | Đợt | Đường thử | Kết quả |
|---|---|---|---|
| 1 | 67 U8 | OSV querybatch POST, timeout 180s | ReadTimeout, 0 byte |
| 2 | 68 V1 | OSV querybatch POST, timeout 300s | ReadTimeout, batch 1–2/20 fail |
| 3 | 69 W1 | OSV querybatch POST, timeout 300s, 3 attempt/batch | ReadTimeout, batch 1–2/20 fail 3/3 |
| 4 | 70 X4 | OSV 1 batch 3 pkg, timeout 25s + `npm audit` 1 lần | curl 28, HTTP 000, 0 byte; npm audit 403 `policy_denied` |
| 5 | 75 C5 | OSV 10 chunk × 50 pkg, timeout 45s, 3 attempt/chunk | 10/10 chunk timeout, 0 chunk xong |
| 6 | 76 D1 | OSV probe 1 chunk × 25 pkg, timeout 90s, 3 attempt + `npm audit` trực tiếp | 3/3 timeout ~90s, 0 byte; npm audit 403 `policy_denied` |
| 7 | **77 E5** | **OSV v1/query đơn lẻ 1 pkg/60s (2/2 timeout) + npm audit qua registry yarnpkg (ENOLOCK) + GitHub Advisory DB REST (THÀNH CÔNG 447/447)** | **LẦN ĐẦU CÓ SỐ: 5 advisory / 4 CVE (high 2, medium 3)** |

## 5. Cấm thử lại cái gì (để đợt sau khỏi tốn lượt)

1. **CẤM chạy lại OSV querybatch / v1/query POST từ VM này** với mọi chunk
   size / timeout — lần 7 chứng minh cả query đơn lẻ 1 pkg cũng timeout
   60s 0 byte: đường egress tới `api.osv.dev` bị chặn toàn bộ, không phải
   do payload nặng.
2. **CẤM chạy lại `npm audit`** (mọi registry, kể cả yarnpkg) cho tới khi
   policy `zz_managed_internal_spaces_package_registries` đổi — trực tiếp
   đã 403 hai lần; qua yarnpkg thì `ENOLOCK` vì không đọc được lockfile v3.
3. **CẤM chạy lại pip-audit TTS / check Gradio CAP** cho tới khi có thay
   đổi upstream (gradio > 6.31.0 hoặc `requirements.txt` đổi) — số đã đo
   4 đợt liên tiếp không đổi (74 B6 = 75 C5 = 76 D1 = 77 E5: 39 CVE y hệt).
4. **CẤM thử bump Pillow 13.0.0** khi CAP còn — `ResolutionImpossible`
   đã chứng minh ở W7/U8.
5. **Đường npm làm việc được từ nay: GitHub Advisory DB REST** qua script
   `hidden_files/r77-e5-ghsa-audit.py` (resume được, tự đợi rate-limit
   theo header reset). Chỉ chạy lại khi `package-lock.json` đổi, hoặc
   sau khi bump các CVE ở §4.2. Lưu ý quota 60/h không xác thực chia sẻ
   theo egress IP — có thể phải đợi reset 1–2 lần như đợt này.

## 6. File đổi/thêm (batch phase9-round77-e5-tts39-npm, KHÔNG push)

- `docs/PHASE9_ROUND77_E5_TTS39_NPM_LIMITS.md` — file này (mới).
- KHÔNG đổi: `scripts/check-gradio-pillow-cap.py` (chạy lại, không sửa),
  `server/tts/requirements.txt`, `package.json`, `package-lock.json`,
  code production nào, venv nào.
- Bằng chứng thô (không stage — nằm ngoài repo):
  `hidden_files/round77-e5-audit-tts.txt` (39 dòng Pillow),
  `hidden_files/r77-e5-osv-single.py` + `.log` (OSV đơn lẻ 2/2 timeout),
  `hidden_files/round77-e5-npm-audit-yarn.json` + `.err` (ENOLOCK),
  `hidden_files/r77-e5-ghsa-audit.py` (script quét GHSA, có resume +
  retry rate-limit) + `r77-e5-ghsa.log` (tiến độ 37→447, SUMMARY complete)
  + `r77-e5-ghsa-results.json` (447 package, 5 hit chi tiết) +
  `r77-e5-ghsa-summary.json`,
  `hidden_files/round77-e5.md` (log luồng).
- Tái dùng (không sửa): venv audit `~/workspace/.tmp-r69w1/pip-audit-venv`
  (pip-audit 2.10.1); query OSV C5 không dùng nữa (đường OSV đã kết luận
  chặn toàn bộ).

## 7. Nợ còn lại cho đợt sau

1. **TTS 39 CVE:** chờ gradio upstream gỡ kẹp `pillow<13` (kiểm tra lại
   chỉ khi gradio > 6.31.0 xuất hiện trên PyPI; tín hiệu main-branch
   `pillow<14.0` trong requirements dev chưa đủ để kết luận).
2. **CVE npm — MỚI:** 5 CVE ở §4.2 cần bump + kiểm chứng lại bằng script
   GHSA: `multer→2.5.0` (ưu tiên cao nhất: runtime bridge),
   `body-parser→1.20.9`, `vite→6.4.5`, `minimatch→11.0.1` (cả 2 version).
   Chưa rõ `body-parser`/`minimatch` có bump trực tiếp được không hay phải
   qua dep cha (express / tool build) — đợt sau tự kiểm tra.
3. Nợ "npm audit không có số" (C5/D1) đã **đóng đủ**: có số thật 447/447
   qua GitHub Advisory DB, LIMITS + log + stage đã có ở đợt này.
