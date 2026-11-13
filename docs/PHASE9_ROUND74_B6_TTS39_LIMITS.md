# LIMITS — Phase 9 đợt 74, luồng B6: kiểm tra lại TTS 39 CVE (nợ đợt 73 §4 mục 3)

Ngày: 09/11/2026 (lượt cron 18:35 +07; kiểm tra CAP + pip-audit chạy
~18:39–18:45 +07, đọc venv production 21:03 +07 — phiên bị gián đoạn
nhiều lần do service restart, xem §5).
Đóng nợ đợt 73 §4 mục 3 (A4: TTS 39 CVE còn nguyên, chờ upstream).
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa requirements
production, KHÔNG chạm venv TTS production (.venv2) ngoài đọc version,
KHÔNG thử bump (kẹp vẫn còn — xem §1).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| gradio mới nhất trên PyPI (kiểm tra lại) | **6.31.0** (publish 2026-10-28T03:41:37Z) — **không có bản mới hơn** kể từ A4 (~15:40); kẹp `pillow<13.0,>=8.0` **VẪN CÒN NGUYÊN** |
| vieneu mới nhất trên PyPI | **3.8.3** — không đổi; vẫn phụ thuộc gradio |
| pillow mới nhất trên PyPI | **13.0.0** — không đổi |
| pip-audit TTS (chạy lại) | **39, không đổi** — toàn Pillow 12.3.0, fix 13.0.0 (18 PYSEC-2026 + 20 CVE-2026 + 1 GHSA, cùng danh sách ID với A4/Z8) |
| pip-audit 4 requirements Python còn lại | **0 lỗ hổng mỗi file** — caption, reframe, bgremove, tracking đều `No known vulnerabilities found` (pip-audit exit 0) |
| npm audit apps/web | **KHÔNG CHẠY ĐƯỢC — bị chặn, không có số** (xem §3): registry trả 403 `policy_denied` cho endpoint audit; không có package-lock.json, không có node_modules → không có cây локal để audit; OSV fallback thử 3 lần đều chết do service restart, chưa lấy được kết quả |
| Bump trong venv thử nghiệm | **KHÔNG THỬ** — kẹp chưa gỡ nên điều kiện tiên quyết của brief chưa thỏa; thử lại sẽ chỉ tái hiện `ResolutionImpossible` đã chứng minh ở W7/U8 |
| requirements production | **KHÔNG SỬA** — `server/tts/requirements.txt` vẫn `vieneu==3.8.3`, `numpy==2.5.4` |
| Verdict | **VẪN CHỜ UPSTREAM — nợ vẫn mở.** Không có gì thay đổi kể từ A4 (~5,5 giờ trước). Đây là **lần kiểm tra thứ 6 trong ngày 09/11** (W7 ~03:50, X5 ~06:41, Y9 ~09:40, Z8 ~12:40, A4 ~15:40, B6 này ~18:40) đều ra cùng một kết quả — gradio không có release nào sau 28/10 (12 ngày) |

## 1. Kiểm tra upstream — nguồn thật, không đoán

### 1.1 Script kiểm tra (chạy lại, không sửa)

```
python3 scripts/check-gradio-pillow-cap.py
gradio latest on PyPI : 6.31.0 (published 2026-10-28T03:41:37)
gradio 6.31.0 pillow requirement: ['pillow<13.0,>=8.0']
vieneu latest on PyPI : 3.8.3
pillow latest on PyPI : 13.0.0
VERDICT: GRADIO STILL CAPS pillow<13 — TTS Pillow bump still
impossible (ResolutionImpossible). Debt stays open.
(exit 1)
```

Khớp đúng output A4 (~15:40 +07), Z8 (~12:40), Y9 (~09:40), X5 (~06:41).
Script chỉ đọc metadata PyPI (stdlib urllib), không tải wheel, không
chạm venv. Kẹp `pillow<13.0,>=8.0` còn nguyên nên điều kiện `CAP LIFTED`
không thỏa → không thử bump, đúng brief.

### 1.2 Venv TTS production đọc version (chỉ đọc, không cài/xóa)

`server/tts/.venv2` (đọc qua `importlib.metadata`, không import package):
gradio **6.30.0**, Pillow **12.3.0**, vieneu **3.8.3**, numpy **2.5.4** —
khớp requirements đã pin, không đổi kể từ A4.

Lưu ý nhỏ (không ảnh hưởng kết quả): `import gradio` trực tiếp trong
venv này hiện văng `ValueError` ở `httpx/_urlparse.py` lúc import
(`invalid literal for int() ... ':1]'` — có vẻ do biến môi trường proxy
của shell hiện tại, không phải do package hỏng). Đọc version bằng
`importlib.metadata` né được lỗi đó; A4 cũng chỉ đọc version, không
import. Không sửa gì thêm — ngoài phạm vi luồng này, ghi lại để đợt sau
khỏi mất công tra lại.

### 1.3 Vì sao KHÔNG thử bump trong venv thử nghiệm

Brief chỉ cho thử bump "khi script in CAP LIFTED". Script in verdict
ngược lại, exit 1. Thử bump chỉ lặp lại `ResolutionImpossible` đã chứng
minh ở W7/U8. Không có venv thử nghiệm nào được tạo trong luồng này;
không có smoke test TTS nào được chạy (không cần — không có gì đổi để
test).

## 2. pip-audit chạy lại — TTS 39 không đổi; 4 file Python còn lại sạch

Lệnh (venv audit của W1, `~/workspace/.tmp-r69w1/pip-audit-venv`,
pip-audit 2.10.1 — venv vẫn tồn tại sau restart):

```
~/workspace/.tmp-r69w1/pip-audit-venv/bin/pip-audit -r server/tts/requirements.txt
→ "Found 39 known vulnerabilities in 1 package", exit 1
~/workspace/.tmp-r69w1/pip-audit-venv/bin/pip-audit -r server/<caption|reframe|bgremove|tracking>/requirements.txt
→ "No known vulnerabilities found", exit 0 (mỗi file)
```

- TTS: toàn bộ 39 dòng đều `pillow 12.3.0`, Fix Versions `13.0.0`
  (đếm trực tiếp từ output: 18 PYSEC-2026-43xx + 20 CVE-2026-112xxx /
  CVE-2026-96xxx + 1 GHSA-78g4-xqwv-q3g8 = 39 — cùng danh sách ID với
  A4, không có advisory mới, không có advisory nào biến mất).
- 4 file còn lại đều sạch, mỗi file chạy 2 lần (lần 1 gộp trong vòng lặp,
  lần 2 chạy lại riêng có header để lưu bằng chứng rõ ràng):
  - `server/caption/requirements.txt` — faster-whisper==1.2.1 (+ transitive
    ctranslate2/onnxruntime/tokenizers/av): 0
  - `server/reframe/requirements.txt` — opencv-python-headless==5.0.0.93,
    numpy==2.5.4: 0
  - `server/bgremove/requirements.txt` — rembg[cpu]==2.0.87,
    onnxruntime==1.23.2, opencv 5.0.0.93, numpy 2.5.4,
    **Pillow==13.0.0** (đã lên 13 ở đợt 67 U8, nên không dính 39 CVE này): 0
  - `server/tracking/requirements.txt` — numpy==2.5.4,
    opencv-python-headless==5.0.0.93: 0
- So với A4: TTS không đổi; 4 file còn lại là lần đầu được quét trong
  chuỗi kiểm tra TTS 39 này (A4 chỉ quét TTS) — kết quả: ngoài TTS ra,
  **không còn CVE nào trong các requirements Python của dự án**.
- Log đầy đủ: `workspace/goals/capcut-clone-video-editor/hidden_files/round74-b6-audit-full.txt`
  (48 dòng lần 1 + phần chạy lại có header; bookkeeping của goal,
  không phải file repo, không stage).

## 3. npm audit apps/web — KHÔNG CÓ SỐ (bị chặn, ghi trung thực)

Đã thử, theo thứ tự:

1. `npm audit --omit=dev` và `npm audit` trong `apps/web` — cả hai đều
   thất bại giống hệt nhau, registry trả:
   `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick - policy_denied`
   (`policy: zz_managed_internal_spaces_package_registries`,
   `POST /-/npm/v1/security/audits/quick not permitted by policy`).
   Đây là chặn ở tầng policy của sandbox, không phải lỗi mạng hay lỗi
   package — endpoint audit bị cấm POST, trong khi GET thường vẫn mở
   (kiểm chứng: `npm view react@^18.3.1 version` → 18.3.1 trả về bình
   thường).
2. Không có `package-lock.json` và không có `node_modules/` trong
   `apps/web` (0 entry) → không có cây dependency đã resolve để audit
   offline; `npm audit` vốn cũng cần lockfile/cây này.
3. Fallback OSV.dev (`api.osv.dev/v1/querybatch` cho 7 dep trực tiếp đã
   resolve: react 18.3.1, react-dom 18.3.1, zustand 5.1.0, jszip 3.10.2,
   vite 6.4.6, typescript 5.6.3, @vitejs/plugin-react 4.7.0) — thử
   **3 lần đều chết giữa chừng do service restart** (session exec biến
   mất, file kết quả `/tmp/osv-result.json` không được tạo lần nào).
   Dừng ở lần thứ 3, không lặp lại thao tác đã bị chặn theo luật vòng lặp.

**Kết luận phần npm: CHƯA ĐO ĐƯỢC — không claim sạch, không claim bẩn.**
Dep trực tiếp của `apps/web/package.json` (prod: react, react-dom,
zustand, jszip + workspace @repo-1/video-spec; dev: @types/react,
@types/react-dom, @vitejs/plugin-react, typescript, vite) được liệt kê
đầy đủ ở trên để đợt sau tra OSV/npx audit tiếp khi có môi trường chạy
được. **KHÔNG sửa bất kỳ dep npm nào** (không có bằng chứng an toàn +
không có test xanh đi kèm, đúng brief).

## 4. Đánh giá rủi ro — vẫn đứng (nhắc lại từ W7 §2 / A4 §3, không đổi)

Pillow là dep transitive không bao giờ được gọi trong pipeline TTS:
`tts.py` không import gradio/Pillow, vieneu không import gradio lúc
inference, không parse file ảnh. Đây là đánh giá rủi ro, **không phải
lý do xóa nợ** — nợ chỉ đóng khi pip-audit TTS về 0.

## 5. Ghi chú môi trường — phiên bị gián đoạn nhiều lần

Trong lượt này, service chạy exec restart nhiều lần: 3 lần gọi OSV
(`curl`/`python urllib`) chết giữa chừng, 1 lần gọi `curl` kiểm tra
connectivity chết, và vòng pip-audit đầu tiên bị background sau 124 s
(nhưng đã hoàn thành — kết quả của nó có trong log). Các lệnh ngắn
(<30 s) chạy bình thường. Không có lệnh nào bị chạy trùng lặp gây tác
dụng phụ (mọi lần thử OSV đều là đọc API, không ghi gì). Thời gian
wall-clock của lượt kéo dài từ ~18:39 tới ~21:03 +07 chủ yếu do các
lần restart này, không phải do khối lượng công việc.

## 6. Điều kiện mở lại nợ (khi nào thử lại)

Thử lại bump ngay khi **một trong hai** điều kiện sau thỏa (kiểm tra
bằng `scripts/check-gradio-pillow-cap.py` — script sẽ in `CAP LIFTED`
và exit 0):

1. **gradio ≥ 6.31.1 (hoặc bất kỳ bản nào mới hơn 6.31.0)** mà
   `requires_dist` không còn `pillow<13` — tức là gradio đã nới/gỡ kẹp
   `pillow<13.0,>=8.0`.
2. **vieneu > 3.8.3** mà `requires_dist` không còn dòng `gradio` —
   tức là vieneu đã bỏ dep gradio.

Khi đó làm theo lộ trình W7 §3 (đã có sẵn, không lặp lại ở đây):
dry-run resolve `vieneu + Pillow==13.0.0` trong venv TẠM → smoke-test
giọng mẫu → pip-audit về 0 → **mới** sửa `server/tts/requirements.txt`.
Cho tới lúc đó: **không tự ý sửa requirements thành trạng thái không
cài được, không thử bump lại định kỳ vô ích** — chỉ kiểm tra lại
metadata PyPI (rẻ, vài giây) mỗi đợt.

## 7. File đổi/thêm (batch phase9-round74-b6-tts39, KHÔNG push)

- `docs/PHASE9_ROUND74_B6_TTS39_LIMITS.md` — doc này (mới).
- KHÔNG đổi: `server/tts/requirements.txt`, `scripts/check-gradio-pillow-cap.py`,
  code `tts.py`, `apps/web/package.json`, venv nào.
- Scratch/log không stage: `hidden_files/round74-b6-audit-full.txt`
  (log pip-audit đầy đủ, 5 file Python) — bookkeeping của goal.
- Stage file: `paths-loop/phase9-round74-b6-tts39.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 8. Nợ mở cho đợt sau

1. **TTS 39 CVE — VẪN MỞ, chờ upstream** (gradio gỡ kẹp `pillow<13`
   hoặc vieneu bỏ dep gradio). Lần kiểm tra gần nhất: 09/11/2026
   ~18:40 +07 — gradio mới nhất vẫn 6.31.0 (28/10/2026). Lần kiểm tra
   thứ 6 trong ngày 09/11. Kiểm tra lại định kỳ bằng
   `scripts/check-gradio-pillow-cap.py`; chỉ thử bump khi script in
   `CAP LIFTED`.
2. **npm audit apps/web — CHƯA ĐO ĐƯỢC** (registry chặn POST endpoint
   audit 403 policy_denied; không lockfile/node_modules; OSV fallback
   chết do service restart). Đợt sau thử lại khi môi trường ổn định hơn,
   hoặc chạy trên máy có lockfile đầy đủ. Đây là nợ mới do luồng này
   phát hiện, không phải nợ cũ.
3. `import gradio` trong venv TTS `.venv2` hiện văng lỗi httpx lúc import
   (do biến môi trường proxy của shell) — chỉ ghi nhận, chưa điều tra;
   không ảnh hưởng pipeline (đọc version bằng importlib.metadata vẫn
   bình thường).
4. Đây là lý do duy nhất job `pip-audit` sẽ ĐỎ ở lần chạy CI GitHub
   đầu tiên (xem X9 §5) — không đổi kể từ X9.
