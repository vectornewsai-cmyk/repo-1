# LIMITS — Phase 9 đợt 76 D1: đóng nợ C5 đợt 75 (TTS 39 + npm audit)

> Đợt 76 D1 — 10/11/2026 ~00:44–00:55 +07. Đóng nợ đợt 75 §4 mục 1
> (C5 dở dang: pip-audit 39 CVE Pillow + npm audit chưa có số).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary. Không sửa code production,
> không sửa script đo. Chỉ thêm file LIMITS này.

## 0. Verdict

| Hạng mục | Kết quả đo thật lần này | Trạng thái nợ |
|---|---|---|
| TTS Pillow CVE | **39 CVE, không đổi** — toàn Pillow 12.3.0, fix 13.0.0; tập ID **y hệt** đợt 74 B6 (18 PYSEC + 20 CVE-2026 + 1 GHSA) | **VẪN MỞ** |
| Gradio CAP pillow<13 | **VẪN GIỮ** — gradio mới nhất 6.31.0 (publish 2026-10-28) vẫn yêu cầu `pillow<13.0,>=8.0` | **VẪN MỞ** |
| 4 package Python khác (vieneu, gradio, numpy, soundfile) | **0 CVE** mỗi package (audit `--no-deps` 5 package) | Sạch — khớp C5 |
| CVE npm | **KHÔNG CÓ SỐ** — `npm audit` 403 `policy_denied`; OSV querybatch probe chunk 25 pkg, timeout 90s, **3/3 attempt timeout ~90s, 0 byte** | **KHÔNG CÓ SỐ** (lần fail thứ 6 liên tiếp) |

## 1. Bảng cấu hình × kết quả (tất cả đều chạy thật trên VM này)

| # | Kiểm tra | Cấu hình / lệnh | Kết quả | Thời gian (+07) |
|---|---|---|---|---|
| 1 | Gradio CAP (lần 8) | `python3 scripts/check-gradio-pillow-cap.py` (không sửa) — chỉ đọc metadata PyPI | gradio **6.31.0**, `pillow<13.0,>=8.0`; vieneu **3.8.3**; pillow mới nhất **13.0.0**. Verdict script: `GRADIO STILL CAPS pillow<13`, exit 1 | 10/11 00:44 |
| 2a | pip-audit TTS (closure) | `pip-audit -r server/tts/requirements.txt` bằng venv audit cũ `~/workspace/.tmp-r69w1/pip-audit-venv` (pip-audit 2.10.1) | `Found 39 known vulnerabilities in 1 package`, exit 1; 39 dòng đều `pillow 12.3.0`, fix 13.0.0 | 10/11 00:46 |
| 2b | pip-audit 5 package đích danh | `pip-audit -r <5pkgs> --no-deps` với `pillow==12.3.0, vieneu==3.8.3, gradio==6.30.0, numpy==2.5.4, soundfile==0.14.0` (= đúng version đã cài trong `server/tts/.venv2`) | **39 CVE Pillow; 0 CVE** cho cả 4 package còn lại | 10/11 ~00:47–00:50 |
| 3a | npm audit trực tiếp | `timeout 120 npm audit --audit-level=high --json` tại repo root | exit 1 sau ~13s: **403 Forbidden, `policy_denied`**, policy `zz_managed_internal_spaces_package_registries`, rule `POST /-/npm/v1/security/audits/quick` | 10/11 00:48 |
| 3b | OSV querybatch probe | Script mới `hidden_files/r76-d1-osv.py probe`: chunk **25 pkg** (nhỏ hơn 50 của C5), timeout **90s** (dài hơn 45s của C5), 3 attempt, tái dùng query 480 pkg của C5 | **3/3 attempt timeout** sau 90,7 / 90,4 / 90,4 s, 0 byte; `PROBE FAILED — stop`. Không chạy 19 chunk còn lại | 10/11 ~00:50–00:55 |

## 2. Gradio CAP — chi tiết lần kiểm tra thứ 8

- Script `scripts/check-gradio-pillow-cap.py` **không sửa** (mtime vẫn
  2026-11-08; chỉ chạy lại). Output nguyên văn:
  `gradio latest on PyPI : 6.31.0 (published 2026-10-28T03:41:37)`,
  `gradio 6.31.0 pillow requirement: ['pillow<13.0,>=8.0']`,
  `vieneu latest on PyPI : 3.8.3`, `pillow latest on PyPI : 13.0.0`.
- Không có bản gradio nào mới hơn 6.31.0 kể từ lần kiểm tra W7 (09/11).
  Upstream chưa gỡ kẹp → bump Pillow 13.0.0 vẫn `ResolutionImpossible`
  (vieneu 3.8.3 requires gradio>=5.49.1). **Không thử bump lại** — đã
  chứng minh ở W7/U8, không có gì thay đổi để thử lại.
- Lộ trình khi CAP được gỡ vẫn như W7 §5: chạy lại script → dry-run
  resolve trong venv TẠM → smoke-test TTS → pip-audit → mới sửa
  `server/tts/requirements.txt`.

## 3. pip-audit TTS — số CVE thật

- **39 CVE, toàn Pillow 12.3.0, fix 13.0.0.** So tập ID với đợt 74 B6:
  `diff` **y hệt 39/39** — 18 `PYSEC-2026-43xx`, 20 `CVE-2026-112xxx`
  (+ `CVE-2026-96638/96640/96778`), 1 `GHSA-78g4-xqwv-q3g8`.
  Không có CVE mới, không CVE nào biến mất kể từ đợt 74.
- Audit 2a (`-r requirements.txt`) quét cả closure phụ thuộc (Pillow
  vào qua gradio transitive) — vẫn chỉ 1 package có CVE.
- Audit 2b (`--no-deps`, 5 package pin đúng version venv `.venv2`):
  vieneu 3.8.3, gradio 6.30.0, numpy 2.5.4, soundfile 0.14.0 đều
  **0 CVE** — khớp đúng claim của C5 ("4 package Python khác = 0 CVE").
- pip-audit chạy được vì service mặc định của nó là PyPI
  (`https://pypi.org`), không dùng đường OSV querybatch POST bị chặn
  (xem §4). pip-audit 2.10.1, venv audit tái dùng từ đợt 69 W1, không
  chạm venv TTS thật `.venv2` (chỉ đọc `pip list` để lấy version).
- Đánh giá rủi ro W7 §2 vẫn đứng (không phải lý do xóa nợ): Pillow là
  dep transitive không được gọi trong pipeline TTS (`tts.py` không
  import gradio/Pillow, vieneu không import gradio lúc inference,
  không parse file ảnh).

## 4. CVE npm — KHÔNG CÓ SỐ (lần fail thứ 6 liên tiếp)

### 4.1 Lịch sử chặn (cả 6 lần, đều có bằng chứng trên đĩa)

| Lần | Đợt | Đường thử | Kết quả |
|---|---|---|---|
| 1 | 67 U8 | OSV querybatch POST, timeout 180s | ReadTimeout, 0 byte |
| 2 | 68 V1 | OSV querybatch POST, timeout 300s | ReadTimeout, batch 1–2/20 fail |
| 3 | 69 W1 | OSV querybatch POST, timeout 300s, 3 attempt/batch | ReadTimeout, batch 1–2/20 fail 3/3 |
| 4 | 70 X4 | OSV 1 batch 3 pkg, timeout 25s + `npm audit` 1 lần | curl 28, HTTP 000, 0 byte; npm audit 403 `policy_denied` |
| 5 | 75 C5 | OSV 10 chunk × 50 pkg, timeout 45s, 3 attempt/chunk | 10/10 chunk timeout, 0 chunk xong |
| 6 | **76 D1** | **OSV probe 1 chunk × 25 pkg, timeout 90s, 3 attempt + `npm audit` trực tiếp** | **3/3 timeout ~90s, 0 byte; npm audit 403 `policy_denied`** |

### 4.2 Bằng chứng lần 6 (đợt này)

- `npm audit --json`: exit 1 sau ~13s, body JSON ghi rõ
  `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick
  - policy_denied`, header `x-hatch-policy:
  zz_managed_internal_spaces_package_registries` — **chính sách registry
  nội bộ của môi trường, không phải lỗi mạng thoáng qua**. Y hệt X4.
- OSV probe: log `hidden_files/r76-d1-osv.log` —
  `chunk 0: attempt 1/2/3 failed after 90.7/90.4/90.4s: The read operation
  timed out`, `chunk 0: FAILED after 3 attempts`, `PROBE FAILED — stop`.
  Không có file kết quả (không chunk nào thành công nên không ghi gì).
- Hai lần dispatch probe trùng nhau do service restart giữa chừng: chỉ
  1 probe chạy tới hết (log chỉ có 1 bộ 3 attempt); lần còn lại bị abort
  trước khi ghi — không ảnh hưởng kết luận (probe hoàn chỉnh đã fail 3/3).
- Kết luận: **không có số CVE npm nào từ VM này. Không bịa số.**
  Câu "không có CVE nghiêm trọng nào được biết tới" trong SECURITY.md
  §2.6 vẫn chỉ là đánh giá theo kiến thức hiện có, KHÔNG phải kết quả quét.

## 5. Cấm thử lại cái gì (để đợt sau khỏi tốn lượt)

1. **CẤM chạy lại OSV querybatch POST từ VM này** với mọi chunk size /
   timeout (đã fail 6 lần: 3 pkg/25s, 25 pkg/90s, 50 pkg/45s,
   480 pkg/300s — cùng một lỗi read-timeout 0 byte). Đường egress này
   bị chặn ở tầng proxy; đổi chunk size không đổi được kết quả.
2. **CẤM chạy lại `npm audit`** cho tới khi policy
   `zz_managed_internal_spaces_package_registries` đổi — đã 403 hai lần
   (X4, D1) với cùng rule; đây là chặn có chủ đích, không phải lỗi tạm.
3. **CẤM chạy lại pip-audit TTS / check gradio CAP** cho tới khi có thay
   đổi upstream (gradio > 6.31.0 hoặc `requirements.txt` đổi) — số đã
   đo 3 đợt liên tiếp không đổi (74 B6 = 75 C5 = 76 D1: 39 CVE y hệt).
4. **CẤM thử bump Pillow 13.0.0** khi CAP còn — `ResolutionImpossible`
   đã chứng minh ở W7/U8.
5. **Hướng mở duy nhất còn lại cho số npm:** job `npm audit` trong
   `.github/workflows/ci-security.yml` chạy trên GitHub Actions (không
   qua egress VM này) — nhưng file workflow vẫn local-only vì App thiếu
   quyền `workflows:write` (403); tới khi user tự thêm file qua web
   GitHub và CI chạy lần đầu thì mới có số CVE npm thật. `osv-scanner`
   dùng cùng API OSV nên sẽ gặp cùng lỗi — không thử.

## 6. File đổi/thêm (batch phase9-round76-d1-tts39-npm, KHÔNG push)

- `docs/PHASE9_ROUND76_D1_TTS39_NPM_LIMITS.md` — file này (mới).
- KHÔNG đổi: `scripts/check-gradio-pillow-cap.py` (chạy lại, không sửa),
  `server/tts/requirements.txt`, code production nào, venv nào.
- Bằng chứng thô (không stage — nằm ngoài repo):
  `hidden_files/round76-d1-audit-tts.txt` (39 dòng Pillow),
  `hidden_files/round76-d1-audit-tts-5pkgs.txt` (39 Pillow + 0 × 4 pkg),
  `hidden_files/r76-d1-tts-5pkgs.txt` (file pin 5 package cho audit 2b),
  `hidden_files/round76-d1-npm-audit.json` + `.err` (403 policy_denied),
  `hidden_files/r76-d1-osv.log` (probe 3/3 timeout) +
  `hidden_files/r76-d1-osv.py` (script probe chunk 25/timeout 90),
  `hidden_files/round76-d1.md` (log luồng).
- Tái dùng (không sửa): query OSV C5 `hidden_files/r75-c5-osv-queries.json`
  (480 pkg), venv audit `~/workspace/.tmp-r69w1/pip-audit-venv`.

## 7. Nợ còn lại cho đợt sau

1. **TTS 39 CVE:** chờ gradio upstream gỡ kẹp `pillow<13` (kiểm tra lại
   chỉ khi gradio > 6.31.0 xuất hiện trên PyPI).
2. **CVE npm:** chỉ có số khi CI GitHub chạy (user thêm workflow tay).
3. Nợ C5 đợt 75 đã **đóng đủ**: LIMITS + log + stage đã có ở đợt này.
