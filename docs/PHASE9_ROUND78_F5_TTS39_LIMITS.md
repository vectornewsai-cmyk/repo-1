# LIMITS — Phase 9 đợt 78 F5: TTS 39 CVE Pillow (lần kiểm thứ 8)

> Đợt 78 F5 — 10/11/2026 ~06:35–07:20 +07. Đóng nợ đợt 77 §4.5
> (TTS 39 CVE Pillow vẫn kẹp Gradio).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary. Không sửa pin production,
> không sửa `server/tts/requirements.txt`.

## 0. Verdict

| Hạng mục | Kết quả đo thật lần này | Trạng thái nợ |
|---|---|---|
| TTS Pillow CVE (production) | **39 CVE, không đổi** — toàn Pillow 12.3.0, fix 13.0.0; tập ID **y hệt 39/39** so với đợt 77 E5 (18 PYSEC + 20 CVE-2026 + 1 GHSA) — lần thứ **5 liên tiếp** y hệt (74 B6 = 75 C5 = 76 D1 = 77 E5 = 78 F5) | **VẪN MỞ (production)** |
| Gradio stable | **VẪN KẸP** — mới nhất vẫn **6.31.0** (publish 2026-10-28), `requires_dist` vẫn `pillow<13.0,>=8.0`. Không có 6.32.0, không có stable mới hơn | **VẪN MỞ** |
| Gradio dev channel — **MỚI** | **`7.0.0.dev0` (upload 2026-11-09T22:31:11) đã gỡ kẹp: `pillow<14.0,>=8.0`** — lần đầu tiên upstream nới cap. Chỉ là bản dev (pre-release), chưa phải stable | Tín hiệu mở khóa — chưa dùng được cho production |
| Nâng thử Pillow 13 trong venv test riêng | **THÀNH CÔNG, KHÔNG HỒI QUY**: venv test `gradio==7.0.0.dev0 + pillow==13.0.0 + vieneu==3.8.3 + numpy==2.5.4` resolve được, import OK, **pip-audit closure 80 package = 0 vulnerability** (39 CVE Pillow → 0), suite TTS **7/7**, E2E tổng hợp thật OK, timing ngang production (50,0s vs 51,2s) | **Đường nâng đã chứng minh xong — chỉ chờ Gradio 7.0 stable** |
| Suite TTS | **7/7 cả 2 venv** sau khi sửa kỳ vọng stale trong `test-tts.sh` (xem §5) | Nợ phụ đã đóng trong luồng này |

**Kết luận một câu:** production vẫn kẹt 39 CVE vì Gradio stable chưa gỡ kẹp,
nhưng lần đầu tiên có bằng chứng thật rằng bản nâng (Pillow 13 + Gradio 7 dev)
chạy được toàn bộ pipeline TTS không hồi quy — khi Gradio 7.0 stable ra,
chỉ việc bump theo lộ trình §6, không còn gì phải chứng minh thêm.

## 1. Bảng cấu hình × kết quả (tất cả đều chạy thật trên VM này)

| # | Kiểm tra | Cấu hình / lệnh | Kết quả | Thời gian (+07) |
|---|---|---|---|---|
| 1 | pip-audit TTS production (closure) | `pip-audit -r server/tts/requirements.txt` bằng venv audit `~/workspace/.tmp-r69w1/pip-audit-venv` (pip-audit 2.10.1) | `Found 39 known vulnerabilities in 1 package`, exit 1; 39 dòng đều `pillow 12.3.0`, fix 13.0.0 | 10/11 ~06:40 |
| 2 | So tập CVE ID với E5 | `diff` tập ID trích từ `round77-e5-audit-tts.txt` vs `round78-f5-audit-tts.txt` | **y hệt 39/39** — 0 ID mới, 0 ID biến mất | 10/11 ~06:40 |
| 3 | Gradio CAP (lần 10) | `python3 scripts/check-gradio-pillow-cap.py` (không sửa) | gradio **6.31.0**, `pillow<13.0,>=8.0`; vieneu **3.8.3**; pillow mới nhất **13.0.0**. Verdict: `GRADIO STILL CAPS pillow<13` | 10/11 ~06:38 |
| 4 | Upstream Gradio stable | PyPI JSON + `pip index versions gradio` | Mới nhất vẫn 6.31.0 (2026-10-28); không có 6.32.0; không pre-release stable nào mới hơn | 10/11 ~06:37 |
| 5 | Upstream Gradio dev — **MỚI** | PyPI JSON `gradio/7.0.0.dev0` | **7.0.0.dev0** (upload 2026-11-09T22:31:11, 2 file, không yanked), `requires_dist` pillow = `pillow<14.0,>=8.0` — **cap đã gỡ ở nhánh dev**. `requirements.txt` trên main vẫn `pillow>=8.0,<14.0` (nhất quán với dev0) | 10/11 ~06:45 |
| 6 | Cài venv test riêng | `python3 -m venv ~/workspace/.tmp-r78f5/tts13-venv`; `pip install vieneu==3.8.3 numpy==2.5.4 pillow==13.0.0 gradio==7.0.0.dev0` (TMPDIR trỏ về ~/workspace — xem §4.2) | **exit 0** — resolve thành công, không `ResolutionImpossible`; cài đủ: gradio 7.0.0.dev0, gradio-client 2.8.0.dev0, pillow 13.0.0, vieneu 3.8.3, numpy 2.5.4, onnxruntime 1.31.1, librosa 1.0.0 | 10/11 ~06:50–07:03 |
| 7 | pip-audit venv test (closure) | `pip freeze` venv test (80 package) → `pip-audit -r` freeze đó | **exit 0 — `No known vulnerabilities found`** (0 CVE toàn closure, Pillow 13.0.0 sạch 39/39) | 10/11 ~07:05 |
| 8 | Import check venv test | `python -c "import gradio, PIL; import vieneu"` | gradio **7.0.0-dev.0**, PIL **13.0.0**, vieneu import OK | 10/11 ~07:05 |
| 9 | Suite TTS trên venv test | Bản copy `test-tts.sh` đã sửa (xem §5), VENV trỏ venv test | **7/7 PASS** (exit 0) sau khi sửa kỳ vọng stale; trước khi sửa: 5/7 (2 fail đều do kỳ vọng cũ, không phải hồi quy — chứng minh ở §5) | 10/11 ~07:08 |
| 10 | Suite TTS trên venv production (đối chứng) | `bash server/tts/test-tts.sh` gốc với `.venv2` (gradio 6.30.0 + pillow 12.3.0) | **7/7 PASS** (exit 0) — cùng bản script đã sửa | 10/11 ~07:08 |
| 11 | E2E tổng hợp thật, venv test | `tts.py --text "Xin chào các bạn, đây là bài kiểm tra giọng nói tiếng Việt." --out /tmp/r78-f5-e2e-test.wav` (59 ký tự, giọng mặc định) | **exit 0** — WAV 48 kHz mono, **2,72 s**, `synthSec 50,0`, `watermark: false`, `mode: v3turbo`, `chunks: 1` | 10/11 ~07:13 |
| 12 | E2E tổng hợp thật, venv production (đối chứng) | Cùng text, `.venv2` | **exit 0** — WAV 48 kHz mono, **2,88 s**, `synthSec 51,2`, `watermark: false`, `mode: v3turbo` | 10/11 ~07:16 |

## 2. pip-audit production — 39 CVE không đổi (lần thứ 5 liên tiếp y hệt)

Tập ID đầy đủ (39, trích từ `round78-f5-audit-tts.txt`, `diff` y hệt E5):

- **18 PYSEC:** PYSEC-2026-4326…4343 (dải liên tục, đủ 18 ID).
- **20 CVE-2026:** CVE-2026-112390, 112391, 112393, 112395, 112399, 112400,
  112401, 112404, 112406, 112891, 112892, 112893, 112894, 112895, 112897,
  112899, 112900, 96638, 96640, 96778.
- **1 GHSA:** GHSA-78g4-xqwv-q3g8.
- Tất cả: package `pillow 12.3.0`, fix `13.0.0`. Không CVE nào ngoài Pillow
  trong closure `server/tts/requirements.txt`.

Đánh giá rủi ro W7 §2 vẫn đứng: Pillow là dep transitive không được gọi
trong pipeline TTS (`tts.py` không import gradio/Pillow, vieneu không import
gradio lúc inference, không parse file ảnh). 39 CVE đều là lỗi parse ảnh
(Pillow) — không chạm được từ đường TTS.

## 3. Upstream: Gradio stable vẫn kẹp, nhánh dev đã gỡ — tín hiệu mới

- **Stable CHƯA gỡ.** PyPI: gradio mới nhất vẫn 6.31.0 (publish
  2026-10-28), `requires_dist` vẫn `pillow<13.0,>=8.0`. Không có 6.32.0.
  Web search "gradio pillow 13" không cho tín hiệu release stable nào mới
  (chỉ thấy release notes Pillow 13.0.0).
- **Dev ĐÃ gỡ — mới xuất hiện.** `gradio==7.0.0.dev0` lên PyPI
  2026-11-09T22:31:11 (tức hôm qua, sau lần kiểm E5 một ngày), metadata
  `pillow<14.0,>=8.0`. Đây là lần đầu tiên upstream nới cap — khớp với
  tín hiệu yếu E5 ghi nhận (`requirements.txt` trên main đã là
  `pillow>=8.0,<14.0`).
- **Không kết luận quá đà:** dev0 là bản phát triển, API có thể đổi trước
  khi stable; `gradio-client` đi kèm cũng là `2.8.0.dev0`. Production
  KHÔNG được dùng dev0 — chỉ dùng để chứng minh đường nâng (đã chứng minh
  xong ở §4). Chờ bản **7.0.0 stable** (hoặc 6.32.0 nếu team Gradio
  backport cap) mới bump production.

## 4. Nâng thử trong venv test riêng — thành công, không hồi quy

Venv test: `~/workspace/.tmp-r78f5/tts13-venv` (ngoài repo, không stage,
không đụng production `.venv2`).

### 4.1 Resolve + cài đặt

- Lệnh: `pip install vieneu==3.8.3 numpy==2.5.4 pillow==13.0.0
  gradio==7.0.0.dev0` — exit 0, không `ResolutionImpossible` (bằng chứng
  cap đã gỡ ở dev0; với stable 6.31.0 thì resolve này vẫn fail như W7/U8
  đã chứng minh).
- Chuỗi kéo theo: `vieneu 3.8.3` yêu cầu `gradio>=5.49.1` → 7.0.0.dev0 thỏa;
  gradio 7.0.0.dev0 yêu cầu `pillow<14.0,>=8.0` → 13.0.0 thỏa.
- Cài đủ 80 package (freeze tại `round78-f5-testvenv-freeze.txt`).

### 4.2 Hai vấp môi trường (không phải lỗi sản phẩm — ghi để đợt sau khỏi tốn lượt)

1. **`/tmp` chỉ 512M tmpfs → pip fail `ENOSPC`.** Lần cài đầu fail
   `OSError: [Errno 28] No space left on device` dù `/home/hatch` còn
   97G — pip giải nén wheel vào `/tmp` mặc định. Khắc phục: tạo lại venv
   với `TMPDIR=~/workspace/.tmp-r78f5/tmp` rồi cài lại → thành công.
   **Đợt sau cài venv Python lớn phải set TMPDIR về /home trước.**
2. **`httpx` crash khi import vieneu/gradio trong shell này.**
   `no_proxy` của shell chứa IPv6 dạng `[::1]`, httpx parse lỗi
   (`InvalidURL: Invalid port: ':1]'`). Khắc phục: chạy python với
   `env -u NO_PROXY -u no_proxy`. Đây là quirk env của shell cron,
   không phải lỗi vieneu/gradio/Pillow — production `.venv2` cũng gặp
   y hệt và cũng hết khi unset 2 biến đó.

### 4.3 pip-audit closure venv test: 0 vulnerability

- `pip-audit -r` trên freeze 80 package của venv test: **exit 0,
  `No known vulnerabilities found`**. Pillow 13.0.0 sạch cả 39 CVE;
  không CVE mới nào xuất hiện từ các dep khác của gradio 7 dev
  (fastapi 0.162.2, starlette 1.10.0, pydantic 2.14.3, … — đều 0).
- Lưu ý: audit này quét theo freeze đã khóa version (đúng version đã cài),
  cùng phương pháp E5 dùng cho production.

### 4.4 Suite TTS: 7/7 cả 2 venv (sau sửa kỳ vọng stale — xem §5)

- Venv test (gradio 7 dev + Pillow 13): **7/7 PASS, exit 0**.
- Venv production (gradio 6.30.0 + Pillow 12.3.0, đối chứng): **7/7 PASS,
  exit 0**. Cùng một bản script đã sửa → so sánh công bằng.

### 4.5 E2E tổng hợp thật: ngang production

| | Venv test (Pillow 13) | Venv production (Pillow 12.3.0) |
|---|---|---|
| Text | 59 ký tự, giọng mặc định | giống hệt |
| Exit | 0 | 0 |
| WAV | 48 kHz mono, 2,72 s, 261.164 byte | 48 kHz mono, 2,88 s |
| synthSec | 50,0 s | 51,2 s |
| watermark / mode | false / v3turbo | false / v3turbo |

- Timing **ngang nhau trong nhiễu đo** (50,0 vs 51,2 s — chênh 2,4%).
  Cả hai đều chậm hơn nhiều so với median lịch sử 0,3–0,44× realtime
  (ở đây ~0,05×) vì VM đang tải rất cao lúc đo (load average ~11 do
  8–10 luồng đợt 78 chạy song song) — **cả hai venv chậm như nhau** nên
  đây là nhiễu tải VM, không phải hồi quy do Pillow 13.
- WAV khác md5 và khác độ dài 0,16 s (2,72 vs 2,88 s) với cùng text/giọng:
  tổng hợp VieNeu có sampling không xác định — khác nhau giữa 2 lần chạy
  là bình thường, không phải hồi quy. Cả hai file đều là WAV hợp lệ
  (ffprobe đọc được, 48 kHz mono).
- Chỉ 1 mẫu E2E mỗi venv (không phải benchmark 72 lần đo như đợt 49/50):
  đủ để kết luận "không hồi quy gãy", không đủ để claim số realtime mới.

## 5. Sửa phụ: `test-tts.sh` kỳ vọng stale (2000 → 5000)

Phát hiện khi chạy suite trên venv test: lần chạy đầu báo **5/7** với 2 fail
([2] "từ chối text dài", [5] "bridge validate"). Điều tra cho thấy **cả 2
đều do script stale, không phải hồi quy**:

- `MAX_TEXT_LEN` đã nâng **2000 → 5000 từ Phase 9 R4** (cả `tts.py:35` và
  `bridge/src/tts.js:56`), nhưng `test-tts.sh` vẫn test text 2001 ký tự
  và expect bị từ chối "quá dài" (dòng 25 và 56).
- Text 2001 ký tự nay là **hợp lệ** → `tts.py` nhận và bắt đầu tổng hợp
  thật (nạp model + synth 2001 ký tự) thay vì từ chối nhanh. Lần chạy đầu
  còn bị **OOM-kill** (VM 6 GB, các luồng đợt 78 chạy song song) đúng ở
  bước này — đó là hậu quả của kỳ vọng stale, không phải lỗi Pillow 13.
- Chứng minh bằng đối chứng, không suy đoán:
  - `tts.py` venv test + venv production đều từ chối **5001 ký tự** giống
    hệt nhau: `[tts] lỗi: text quá dài (5001 > 5000 ký tự)`.
  - Node: `validateText('x'.repeat(2001))` trả về 2001 (được chấp nhận);
    `validateText('x'.repeat(5001))` throw `Text quá dài (5001 > 5000 ký tự)`.
- **Sửa (2 dòng, đã stage):** `server/tts/test-tts.sh` dòng 25
  `print('a'*2001)` → `print('a'*5001)`; dòng 56
  `validateText('x'.repeat(2001))` → `validateText('x'.repeat(5001))`,
  kèm comment ghi lý do. Sau sửa: suite **7/7 cả 2 venv** (§4.4).
- Tên assertion trong script vẫn ghi "từ chối text > 2000 ký tự" (label cũ)
  — chỉ là nhãn, không đổi để giữ diff nhỏ; nội dung test nay là > 5000.

## 6. Lộ trình khi Gradio 7.0 stable ra (cho đợt sau — chưa làm đợt này)

1. Kiểm tra PyPI: gradio stable ≥ 7.0.0 (hoặc 6.32.0 nếu backport cap)
   với `requires_dist` pillow cho phép 13.x.
2. Chạy lại `scripts/check-gradio-pillow-cap.py` → expect verdict gỡ kẹp.
3. Dry-run resolve trong venv TẠM (như F5 đã làm với dev0, nhưng với
   stable): `vieneu==3.8.3 numpy==2.5.4 pillow==13.x gradio==<stable mới>`.
4. Chạy lại suite TTS 7/7 + E2E 1 mẫu + pip-audit closure (expect 0 CVE).
5. Chỉ sau khi 4 bước trên xanh mới sửa `server/tts/requirements.txt`
   (hiện chỉ pin vieneu/numpy; Pillow đến qua gradio — cần quyết định
   pin `pillow>=13.0.0` tường minh hay để gradio kéo) và rebuild `.venv2`
   production. **Không bump production từ bản dev0.**

## 7. Cấm thử lại cái gì (cập nhật từ E5 §5)

1. **CẤM bump Pillow 13.0.0 cho production** khi Gradio stable còn kẹp
   (`pillow<13.0`) — `ResolutionImpossible` vẫn đứng với stable 6.31.0.
2. **CẤM dùng gradio 7.0.0.dev0 cho production** — chỉ là venv test chứng
   minh đường nâng; chờ stable.
3. **CẤM chạy lại pip-audit TTS production / check Gradio CAP** cho tới
   khi có thay đổi upstream (gradio stable > 6.31.0 hoặc `requires_dist`
   đổi) — số đã đo 5 đợt liên tiếp không đổi. Ngoại lệ duy nhất: khi
   gradio 7.0 stable xuất hiện thì kiểm tra lại theo lộ trình §6.
4. **CẤM chạy lại OSV querybatch / v1/query POST và `npm audit`** — vẫn
   như E5 §5.1–5.2 (đường npm làm việc được: GitHub Advisory DB REST).
5. **Cài venv Python lớn trên VM này phải set `TMPDIR` về /home trước**
   (`/tmp` chỉ 512M tmpfs — xem §4.2.1).
6. **Chạy python import vieneu/gradio/httpx trong shell cron phải unset
   `NO_PROXY`/`no_proxy`** (quirk `[::1]` — xem §4.2.2).
7. **CẤM chạy suite TTS với text 2001 ký tự** — đã sửa thành 5001 (§5);
   text trong khoảng 2001–5000 nay là hợp lệ và sẽ trigger tổng hợp thật
   (nặng RAM, có thể OOM khi VM bận).

## 8. File đổi/thêm (batch phase9-round78-f5-tts39, KHÔNG push)

- `docs/PHASE9_ROUND78_F5_TTS39_LIMITS.md` — file này (mới).
- `server/tts/test-tts.sh` — sửa 2 dòng kỳ vọng stale 2001 → 5001 (§5).
- KHÔNG đổi: `scripts/check-gradio-pillow-cap.py` (chạy lại, không sửa),
  `server/tts/requirements.txt`, `package.json`, `package-lock.json`,
  code production nào, venv production nào (`.venv2` nguyên vẹn:
  gradio 6.30.0, pillow 12.3.0, vieneu 3.8.3).
- Bằng chứng thô (không stage — nằm ngoài repo):
  `hidden_files/round78-f5-audit-tts.txt` (39 dòng Pillow production),
  `hidden_files/round78-f5-testvenv-install.log` (cài venv test, gồm cả
  lần fail ENOSPC đầu),
  `hidden_files/round78-f5-testvenv-freeze.txt` (80 package venv test),
  `hidden_files/round78-f5-audit-testvenv.txt` (`No known vulnerabilities
  found`),
  `hidden_files/round78-f5-test-tts.sh` + `.log` (suite venv test, bản
  trước và sau sửa),
  `hidden_files/round78-f5-test-tts-prod.log` (suite production 7/7),
  `hidden_files/round78-f5-e2e-test.log` + `round78-f5-e2e-prod.log`
  (E2E 2 venv), `hidden_files/round78-f5.md` (log luồng).
  Venv test giữ nguyên tại `~/workspace/.tmp-r78f5/tts13-venv`
  (~800 MB) để đợt sau tái dùng khi Gradio 7.0 stable ra — xóa khi nào
  cũng được, rebuild lại theo §6 bước 3.
- WAV E2E ở `/tmp/r78-f5-e2e-test.wav` (2,72 s) và
  `/tmp/r78-f5-e2e-prod.wav` (2,88 s) — file tạm, không stage.

## 9. Nợ còn lại cho đợt sau

1. **TTS 39 CVE (production): VẪN MỞ** — chờ Gradio stable gỡ kẹp
   (7.0.0 stable hoặc 6.32.0 backport). Khi đó làm theo lộ trình §6;
   đường nâng đã chứng minh xong đợt này nên không còn rủi ro chưa biết.
2. **npm 5 CVE (đợt 77 §4.4):** không thuộc luồng này — chuyển đợt sau
   như đã ghi (multer → 2.5.0, body-parser → 1.20.9, vite → 6.4.5,
   minimatch → 11.0.1).
