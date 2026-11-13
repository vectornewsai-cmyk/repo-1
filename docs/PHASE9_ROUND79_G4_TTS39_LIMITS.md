# LIMITS — Phase 9 đợt 79 G4: TTS 39 CVE Pillow (lần kiểm thứ 9)

> Đợt 79 G4 — 10/11/2026 ~09:37–09:50 +07. Đóng nợ đợt 78 §4.4 / §9.1
> (TTS 39 CVE Pillow vẫn kẹp Gradio; Gradio dev 7.0.0.dev0 đã nới cap).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary. Không sửa pin production,
> không sửa `server/tts/requirements.txt`, không sửa code production nào.

## 0. Verdict

| Hạng mục | Kết quả đo thật lần này | Trạng thái nợ |
|---|---|---|
| Gradio stable | **CHƯA CÓ 7.x** — mới nhất vẫn **6.31.0** (publish 2026-10-28), `requires_dist` vẫn `pillow<13.0,>=8.0`. Không có 6.32.0, không có stable nào mới hơn | **VẪN MỞ** |
| Gradio dev channel | **KHÔNG CÓ DEV MỚI** — `7.0.0.dev0` (upload 2026-11-09T22:31:11) vẫn là pre-release mới nhất; không có dev1/dev2 hay rc nào. Tổng 682 release đã quét | Tín hiệu mở khóa giữ nguyên — chưa dùng được cho production |
| TTS Pillow CVE (production) | **39 CVE, không đổi** — toàn Pillow 12.3.0, fix 13.0.0; tập ID **y hệt 39/39** so với đợt 78 F5 — lần thứ **6 liên tiếp** y hệt (74 B6 = 75 C5 = 76 D1 = 77 E5 = 78 F5 = 79 G4) | **VẪN MỞ (production)** |
| Venv test đợt 78 (gradio 7 dev + Pillow 13) | **VẪN NGUYÊN VẸN**: import OK (gradio 7.0.0-dev.0, PIL 13.0.0, vieneu OK), **pip-audit closure 80 package = 0 vulnerability** (chạy lại trên đúng freeze đợt 78) | Đường nâng đã chứng minh đợt 78 vẫn giữ — không cần chứng minh lại |
| Bump production | **KHÔNG BUMP ĐƯỢC** — stable 7.x chưa ra, cap `pillow<13` vẫn đứng. Không thử bump, không đo lại TTS realtime (theo đúng điều kiện nhiệm vụ: chỉ đo lại khi stable 7.x đã ra) | **VẪN CHỜ** |

**Kết luận một câu:** không có gì thay đổi upstream kể từ hôm qua — Gradio
stable vẫn 6.31.0 kẹp `pillow<13`, production vẫn 39 CVE y hệt lần thứ 6
liên tiếp, venv test Pillow 13 vẫn sạch 0 CVE — tiếp tục chờ Gradio 7.0
stable, không còn gì phải chứng minh thêm cho tới lúc đó.

## 1. Bảng cấu hình × kết quả (tất cả đều chạy thật trên VM này)

| # | Kiểm tra | Cấu hình / lệnh | Kết quả | Thời gian (+07) |
|---|---|---|---|---|
| 1 | Gradio CAP (lần 11) | `python3 scripts/check-gradio-pillow-cap.py` (không sửa) | gradio **6.31.0**, `pillow<13.0,>=8.0`; vieneu **3.8.3**; pillow mới nhất **13.0.0**. Verdict: `GRADIO STILL CAPS pillow<13` (exit 1) | 10/11 ~09:38 |
| 2 | Quét toàn bộ release Gradio | PyPI JSON `gradio` — liệt kê toàn bộ 682 release, lọc `7.*` / dev / rc / alpha / beta | Pre-release mới nhất vẫn **7.0.0.dev0** (2026-11-09T22:31:11, 2 file, không yanked); không có dev1, không có rc, không có 7.x stable; 5 release mới nhất theo upload: 7.0.0.dev0, 6.31.0, 6.30.0, 6.29.1, 6.29.0 | 10/11 ~09:39 |
| 3 | PyPI JSON trực tiếp (đối chứng) | `browser.open https://pypi.org/pypi/gradio/json` | `release_url: .../gradio/6.31.0/`, `requires_dist` chứa `pillow<13.0,>=8.0` — khớp script kiểm tra | 10/11 ~09:38 |
| 4 | pip-audit TTS production (closure) | `pip-audit -r server/tts/requirements.txt` bằng venv audit `~/workspace/.tmp-r69w1/pip-audit-venv` (pip-audit 2.10.1) | `Found 39 known vulnerabilities in 1 package`, exit 1; 39 dòng đều `pillow 12.3.0`, fix 13.0.0 | 10/11 ~09:40 |
| 5 | So tập CVE ID với F5 | `diff` tập ID trích từ `round78-f5-audit-tts.txt` vs `round79-g4-audit-tts.txt` | **y hệt 39/39** — 0 ID mới, 0 ID biến mất | 10/11 ~09:40 |
| 6 | Venv test đợt 78 — import check | `env -u NO_PROXY -u no_proxy ~/workspace/.tmp-r78f5/tts13-venv/bin/python -c "import gradio, PIL, vieneu"` | gradio **7.0.0-dev.0**, PIL **13.0.0**, vieneu import OK | 10/11 ~09:42 |
| 7 | Venv test đợt 78 — pip-audit closure | `pip-audit -r` trên đúng freeze đợt 78 (`round78-f5-testvenv-freeze.txt`, 80 package) | **exit 0 — `No known vulnerabilities found`** (0 CVE, Pillow 13.0.0 sạch 39/39) | 10/11 ~09:44 |
| 8 | Venv test đợt 78 — phiên bản đã cài | `tts13-venv/bin/pip list` | gradio 7.0.0.dev0, pillow 13.0.0, vieneu 3.8.3, numpy 2.5.4, onnxruntime 1.31.1, librosa 1.0.0 | 10/11 ~09:44 |

## 2. pip-audit production — 39 CVE không đổi (lần thứ 6 liên tiếp y hệt)

Tập ID đầy đủ (39, trích từ `round79-g4-audit-tts.txt`, `diff` y hệt F5):

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

## 3. Upstream: không có gì mới kể từ đợt 78 (hôm qua)

- **Stable CHƯA gỡ.** PyPI: gradio mới nhất vẫn 6.31.0 (2026-10-28),
  `requires_dist` vẫn `pillow<13.0,>=8.0`. Không có 6.32.0, không có
  stable 7.x.
- **Dev KHÔNG có bản mới.** Quét toàn bộ 682 release: pre-release mới nhất
  vẫn là `7.0.0.dev0` (2026-11-09T22:31:11) — không có dev1, không có rc.
  Cap `pillow<14.0,>=8.0` ở dev0 vẫn là tín hiệu duy nhất.
- **Không kết luận quá đà:** chỉ mới 1 ngày kể từ khi dev0 xuất hiện; chưa
  có dấu hiệu nào cho thấy ngày ra stable 7.0. Lần kiểm này chỉ xác nhận
  "chưa ra", không dự đoán ngày ra.

## 4. Vì sao đợt này KHÔNG thử bump và KHÔNG đo lại TTS realtime

Nhiệm vụ đợt này đặt điều kiện rõ: chỉ thử bump trong venv test riêng và
đo TTS realtime lại **nếu stable 7.x đã ra và nới cap**. Điều kiện đó
**chưa thỏa** (stable vẫn 6.31.0 kẹp `pillow<13`), nên:

- Không tạo venv test mới, không cài lại gradio/pillow — venv test đợt 78
  (`gradio==7.0.0.dev0 + pillow==13.0.0`) đã chứng minh xong đường nâng
  (suite TTS 7/7, E2E ngang production, audit 0 CVE) và đợt này đã kiểm
  lại nó vẫn nguyên vẹn (§1 #6–#8). Tạo venv mới với cùng dev0 sẽ cho
  đúng kết quả cũ, tốn lượt vô ích.
- Không đo lại TTS realtime — số realtime đợt 78 đã đo trong điều kiện VM
  tải cao (50,0s vs 51,2s synth, ~0,05×) không phải số chuẩn; đo lại lúc
  này cũng chỉ lặp lại nhiễu tải, không cho thông tin mới. Số realtime
  chuẩn vẫn là median lịch sử 0,3–0,44× (đợt 49/50, 72 lần đo).
- Không sửa gì ở production: `server/tts/requirements.txt` nguyên vẹn
  (vieneu 3.8.3, numpy 2.5.4), `.venv2` production không đụng tới.

## 5. Lộ trình khi Gradio 7.0 stable ra (giữ nguyên từ F5 §6 — chưa làm)

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

## 6. Cấm thử lại cái gì (giữ nguyên từ F5 §7, cộng thêm)

1. **CẤM bump Pillow 13.0.0 cho production** khi Gradio stable còn kẹp
   (`pillow<13.0`) — `ResolutionImpossible` vẫn đứng với stable 6.31.0.
2. **CẤM dùng gradio 7.0.0.dev0 cho production** — chỉ là venv test chứng
   minh đường nâng; chờ stable.
3. **CẤM chạy lại pip-audit TTS production / check Gradio CAP / quét
   release** cho tới khi có thay đổi upstream (gradio stable > 6.31.0,
   hoặc có dev/rc 7.x mới, hoặc `requires_dist` đổi) — số đã đo 6 đợt
   liên tiếp không đổi. Ngoại lệ duy nhất: khi Gradio 7.0 stable xuất
   hiện thì kiểm tra lại theo lộ trình §5. (Lần kiểm này là ngoại lệ
   theo lệnh trực tiếp của đợt 79 G4 — đã thực hiện xong, không lặp lại
   ở đợt sau nếu upstream không đổi.)
4. **CẤM chạy lại OSV querybatch / v1/query POST và `npm audit`** — vẫn
   như E5 §5.1–5.2 (đường npm làm việc được: GitHub Advisory DB REST).
5. **Cài venv Python lớn trên VM này phải set `TMPDIR` về /home trước**
   (`/tmp` chỉ 512M tmpfs — xem F5 §4.2.1).
6. **Chạy python import vieneu/gradio/httpx trong shell cron phải unset
   `NO_PROXY`/`no_proxy`** (quirk `[::1]` — xem F5 §4.2.2).
7. **CẤM chạy suite TTS với text 2001 ký tự** — đã sửa thành 5001 ở F5 §5;
   text trong khoảng 2001–5000 nay là hợp lệ và sẽ trigger tổng hợp thật
   (nặng RAM, có thể OOM khi VM bận).

## 7. File đổi/thêm (batch phase9-round79-g4-tts39, KHÔNG push)

- `docs/PHASE9_ROUND79_G4_TTS39_LIMITS.md` — file này (mới, file duy nhất).
- KHÔNG đổi: `scripts/check-gradio-pillow-cap.py` (chạy lại, không sửa),
  `server/tts/requirements.txt`, `server/tts/test-tts.sh`, `package.json`,
  `package-lock.json`, code production nào, venv production nào
  (`.venv2` nguyên vẹn: gradio 6.30.0, pillow 12.3.0, vieneu 3.8.3),
  venv test đợt 78 (nguyên vẹn, xem §1 #6–#8).
- Bằng chứng thô (không stage — nằm ngoài repo):
  `hidden_files/round79-g4-audit-tts.txt` (39 dòng Pillow production),
  `hidden_files/round79-g4-audit-testvenv.txt` (`No known vulnerabilities
  found`, closure venv test),
  `hidden_files/round79-g4.md` (log luồng).
  Venv test giữ nguyên tại `~/workspace/.tmp-r78f5/tts13-venv`
  (~800 MB) để dùng ngay khi Gradio 7.0 stable ra — xóa khi nào cũng
  được, rebuild lại theo §5 bước 3.

## 8. Nợ còn lại cho đợt sau

1. **TTS 39 CVE (production): VẪN MỞ** — chờ Gradio stable gỡ kẹp
   (7.0.0 stable hoặc 6.32.0 backport). Khi đó làm theo lộ trình §5;
   đường nâng đã chứng minh xong đợt 78 và kiểm lại vẫn giữ đợt này.
2. **npm 5 CVE (đợt 77 §4.4, đã đóng đợt 78 F4):** không thuộc luồng này.
