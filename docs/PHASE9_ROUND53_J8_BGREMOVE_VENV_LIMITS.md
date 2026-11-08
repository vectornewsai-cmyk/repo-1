# Phase 9 Round 53 — J8: bgremove venv + verify checksum model + kiểm tra đĩa — LIMITS

**Ngày:** 07/11/2026 (đợt 53, luồng J8). **Repo:** `vectornewsai-cmyk/repo-1`, branch main.
**Nợ gốc:** ROUND52 §4.4 + LIMITS I5 §7: bgremove KHÔNG có venv (rembg ≤2.0.54
cần Python <3.11, VM chỉ có 3.12.3); model chưa verify checksum; tốc độ tải
file model lớn chưa đo (chỉ chứng minh 2.370 byte); downloader chưa kiểm tra
dung lượng trống trước khi tải; cần ~4G đĩa cho AI đầy đủ; venv chỉ Linux
x86_64 + Python 3.12. **KHÔNG push trong phiên này — batch chỉ stage, chờ
user nhắn "push đi". KHÔNG binary/model/venv vào batch.**

## 1. Cái gì đã làm xong (tóm tắt)

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| 1 | Python 3.10 song song qua uv + venv bgremove chạy được thật | ✅ xong (Python 3.10.22, rembg 2.0.60) |
| 2 | Model BiRefNet: URL đúng + SHA256 khóa vào manifest + verify md5 chéo | ✅ xong (973 MB, md5 khớp rembg) |
| 3 | Tốc độ tải file model lớn đo thật (2 lần tải, 2 con số) | ✅ xong (5,39 và 23,33 MiB/s) |
| 4 | Downloader kiểm tra dung lượng trống trước khi tải + resume thật qua GitHub | ✅ xong, test 14/14 |
| 5 | Đo fps bgremove thật (u2net xong; BiRefNet không đo ổn định được — xem §5) | ⚠️ một nửa (u2net 0,26 fps; BiRefNet chết giữa chừng) |
| 6 | Slim venv bgremove + --fresh tái tạo được từ requirements.txt | ✅ xong (707 MB / 737 MB, VERIFY OK) |

## 2. bgremove venv — Python 3.10 qua uv (đã chạy thật)

- `uv` 0.13.7 cài bằng `python3 -m pip install --user --break-system-packages uv`.
- `uv python install 3.10` → **CPython 3.10.22** trong 15,39 s (tải 28,0 MiB).
- `uv venv --python 3.10 server/bgremove/.venv` + cài requirements → venv
  **706M** (du; treeBytes 719.381.710, 8.892 file). Bộ đã resolve:
  `rembg==2.0.60, onnxruntime==1.23.2, opencv-python-headless==5.0.0.93,
  numpy==2.2.6, Pillow==10.2.0` + kéo theo `pooch 1.9.0, pymatting 1.1.16,
  numba 0.68.1, scikit-image 0.25.2, scipy 1.15.3`.
- Hai vấp ngã khi cài (đều đã xử lý, ghi lại để đợt sau không lặp lại):
  1. `numpy==2.5.4` (pin cũ) **yêu cầu Python >=3.12** nên uv từ chối giải
     trên 3.10 (`No solution found... numpy==2.5.4 depends on Python>=3.12`).
     Đổi sang `numpy==2.2.6` (bản uv resolve được cho 3.10).
  2. `/tmp` trên VM chỉ là tmpfs 512M — uv giải nén wheel `llvmlite`
     (57M) chết `No space left on device`. Đặt `TMPDIR=~/workspace/j8-tmp`
     (đĩa /home, 131G trống) thì cài được.
- Probe desktop (`pythonServices.probePythonService`, deep): bgremove
  **`available:true`, python `server/bgremove/.venv/bin/python`
  (source `venv`), `import rembg` OK (8,9 s), model OK**. Không cần sửa
  `pythonServices.js` — wiring đã có sẵn, chỉ thiếu venv trên đĩa.

### 2.1 Phát hiện lớn 1: rembg 2.0.38 (pin K4) KHÔNG chạy được BiRefNet

- Kiểm chứng bằng source đã cài + wheel trên PyPI: rembg **2.0.38 không chứa
  session BiRefNet nào** (thư mục `sessions/` không có `birefnet*.py`;
  `grep birefnet` toàn package = 0 kết quả). `new_session('birefnet-general')`
  **lặng lẽ trả về `U2netSession`** (mặc định khi không khớp tên session) —
  tức "birefnet-general" trên pin K4 thực chất chạy u2net, model BiRefNet
  973 MB không bao giờ được nạp. Fallback `birefnet → u2net` trong
  `bgremove.py` vì vậy là no-op trên pin này.
- **rembg 2.0.60 là bản ĐẦU TIÊN có BiRefNet** (wheel chứa 7 file
  `sessions/birefnet_*.py`, gồm `birefnet_general.py` =
  `BiRefNetSessionGeneral`, normalize 1024×1024 + sigmoid) và vẫn cho
  Python 3.10 (`requires_python '>=3.8, <3.13'`). Đã nâng pin
  `rembg 2.0.38 → 2.0.60` trong `requirements.txt` với lý do này.
- **Đính chính I5 §7.1:** câu "mọi bản ≤2.0.54 đều yêu cầu <3.11" là **sai**
  — đọc trực tiếp PyPI JSON: 2.0.54 yêu cầu `>=3.8, <3.12` (Python 3.11
  được), 2.0.55 yêu cầu `>=3.8, <3.13` (Python 3.12 được). Chỉ 2.0.38
  (và các bản cũ hơn) kẹt `<3.11`.

### 2.2 Phát hiện lớn 2: rembg 2.0.60 dời onnxruntime sang extra `cpu`

- Ở 2.0.38, `onnxruntime` là dep lõi. Ở **2.0.60, onnxruntime chỉ còn trong
  extra `cpu`** (`Requires-Dist: onnxruntime; extra == "cpu"`). Cài plain
  `rembg==2.0.60` bằng pip sẽ **thiếu onnxruntime → `import rembg` lỗi ngay**
  (đã gặp thật ở lần --fresh đầu tiên của `build-slim-venv.mjs`, xem §6).
  Venv dev ban đầu chạy được chỉ vì onnxruntime còn sót từ lần cài 2.0.38
  (uv giữ lại khi nâng cấp) — bẫy tiềm ẩn.
- Sửa: `requirements.txt` nay ghi **`rembg[cpu]==2.0.60` + `onnxruntime==1.23.2`
  tường minh** (extra kéo bản mới nhất, pin khóa version). Đã verify lại
  bằng --fresh (xem §6). (Đính chính ghi chú cũ: extra `[cpu]` KHÔNG tồn
  tại ở 2.0.38 — uv từng cảnh báo đúng cho bản đó — nhưng 2.0.60 có extra
  này và nó là bắt buộc.)

## 3. Model BiRefNet — URL cũ 404, SHA256 đã khóa

- **URL trong manifest I5 SAI:** `.../releases/download/v0.0.0/birefnet-general.onnx`
  trả **404** (kiểm chứng bằng curl HEAD + GitHub API: release v0.0.0 có 41
  asset, không có file tên đó). Downloader I5 không bao giờ tải được model
  này dù có checksum — lỗi này nằm trước cả chuyện checksum.
- URL đúng (đọc từ chính `rembg/sessions/birefnet_general.py` của 2.0.60):
  `.../BiRefNet-general-epoch_244.onnx`, rembg tải về rồi lưu lại thành
  `birefnet-general.onnx` trong `~/.u2net`, kèm md5
  `7a35a0141cbbc80de11d9c9a28f52697`.
- File tải về: **972.666.916 byte** (khớp đúng GitHub API), đặt tại
  `~/.u2net/birefnet-general.onnx` (không đưa vào batch — ngoài repo).
- **MD5 khớp đúng** md5 của rembg: `7a35a0141cbbc80de11d9c9a28f52697`.
- **SHA256 khóa vào manifest:** `58f621f00f5d756097615970a88a791584600dcf7c45b18a0a6267535a1ebd3c`.
- `gen-model-manifest.mjs` đã sửa: bgremove lấy hash từ `~/.u2net` khi có
  file (`localDir` + `localOptional`), `fileUrl` ánh xạ tên file đích →
  URL tải thật, `sizeLabel`/`note` đổi theo trạng thái verify. Regen xong
  chạy `--check` **pass**; diff với manifest trước: **chỉ bgremove đổi**
  (sizeLabel `~880 MB (chưa xác minh)` → `~973 MB`, verified false → true,
  totalBytes 0 → 972.666.916); caption/tts/codec không đổi một byte.
- rembg 2.0.60 **không tải lại model** khi file đã có (mtime file không đổi
  qua 4 lần `new_session`).

## 4. Tốc độ tải file model lớn (đo thật, 2 lần tải)

| Lần tải | Công cụ | Byte | Thời gian | Tốc độ |
|---|---|---|---|---|
| Tải đầy đủ lần đầu | curl (theo redirect GitHub → CDN) | 972.666.916 | 172,1 s | **5,39 MiB/s (5,65 MB/s)** |
| Resume 50% `.part` qua downloader thật | `downloadModel('bgremove-birefnet')` | 463.058.980 | 18,9 s | **23,33 MiB/s** |

- Hai con số đều thật, cùng VM, cùng file, cách nhau ~10 phút — throughput
  qua GitHub releases biến động rất lớn (tải khác + proxy + các luồng
  round 53 chạy song song). **Không có "một con số" duy nhất**; đừng trích
  một trong hai làm tốc độ chuẩn. Lần resume nhanh hơn ~4,3× lần tải đầu.
- Chứng minh flow downloader với manifest thật (script `dl-proof.cjs`,
  đã xóa sau khi đo): `.part` dở 509.607.936 byte (50%) → `downloadModel`
  resume bằng Range từ GitHub, verify SHA256 khớp, `checkModel` = ready
  (presentBytes 972.666.916); chạy lại lần nữa → skip, 0 byte tải thêm
  (4,5 s để hash-verify 973 MB). File scratch đã xóa sau khi đo; model
  chính giữ ở `~/.u2net`.
- Đĩa lúc đo: /home còn trống 131G (không phải yếu tố giới hạn).

## 5. fps bgremove (đo thật)

### 5.1 u2net — chạy được, test PASS

- `test_bgremove.py --session u2net` (venv 3.10, video mẫu 3 s 90 frame
  640×640 từ ảnh chân dung Fortepan CC BY-SA qua Openverse — xem §7.3):
  **✅ TẤT CẢ TEST PASS** — mask 90 frame, foreground(>200)=34,7%,
  background(<55)=62,4%; temporal coherence mean inter-frame diff = 0,00;
  alpha output pix_fmt `rgba`, transparent=62,5%, opaque=34,7%.
- Wall time **11m37,240s cho 180 frame** (2 lượt mask + alpha, gồm 2 lần
  nạp session + tạo video + kiểm tra) → **~0,26 fps end-to-end** dưới
  loadavg 1–19 (các luồng round 53 khác chạy song song). Con số 0,43 fps
  trong MEMORY đo trên máy yên hơn — 0,26 không phải regression đã chứng
  minh, chỉ là đo dưới tải nặng. Session u2net RSS ~1,1 GB lúc chạy.

### 5.2 BiRefNet — KHÔNG đo được fps ổn định trên VM này

- Session nạp được thật: `BiRefNetSessionGeneral`, init **16,4 s (lúc yên)
/ 22,0 s / 54,8 s (lúc tải nặng)**, RSS ~2,02–2,06 GB sau init.
- Predict 1024×1024: **1 lần hoàn thành** (probe đầu, tổng ~6 phút gồm
  init + 1 predict dưới loadavg ~18 — tiếc là timing từng frame bị mất do
  stdout bị đệm qua pipe), **3 lần chết giữa chừng ngay trong predict #1**
  (RSS quan sát 4,39–4,61 GB, RAM trống lúc đó chỉ 0,9–1,7 GB; tiến trình
  biến mất không exception, không exit code). Không đọc được dmesg để khẳng
  định OOM-kill (không có quyền), nhưng dấu hiệu khớp hoàn toàn + lịch sử
  `BGREMOVE_LIMITS.md` đã ghi birefnet-general từng bị kernel OOM-kill
  (SIGKILL) trên máy 8 GB này.
- **Kết luận trung thực: không có con số fps BiRefNet ổn định trên VM 8 GB
  này khi chạy chung với các luồng khác.** BiRefNet cần ~4,5 GB RSS đỉnh
  (model 973 MB + activation 1024×1024) — chỉ chạy được khi máy yên.
- Hệ quả: fallback `birefnet → u2net` trong `bgremove.py` **không cứu được
  OOM-kill của kernel** (chỉ bắt exception Python; SIGKILL giết cả tiến
  trình). Trên máy user 8 GB, bgremove mặc định birefnet-general có nguy cơ
  chết tương tự khi RAM căng — nên cân nhắc mặc định u2net hoặc
  `birefnet-general-lite` (model 224 MB) cho máy yếu (chưa làm đợt này).

## 6. Downloader kiểm tra đĩa + slim venv

### 6.1 Kiểm tra dung lượng trống (modelDownloader.js)

- Mới: `freeDiskBytes` (statfsSync, leo lên thư mục cha gần nhất nếu đích
  chưa tồn tại; fail-open có cảnh báo khi không đo được), `formatBytes`,
  `estimateRemainingBytes` (trừ file đủ size + phần `.part` đã có),
  `ensureFreeDiskSpace` (ném lỗi nêu rõ cần bao nhiêu / còn bao nhiêu /
  tại đâu). `downloadModel` gọi kiểm tra này **trước khi tải byte nào**.
- Test mới (3 test): đủ đĩa → pass; thiếu đĩa (size khai 10¹⁵) → ném lỗi
  `Không đủ dung lượng trống...` nêu rõ cần/còn; `estimateRemainingBytes`
  trừ đúng `.part` (200.000 → 80.000 khi `.part` có 120.000) và file đủ
  (→ 0); `downloadModel` từ chối trước khi tải khi thiếu đĩa (0 request
  HTTP). **modelDownloader.test.cjs: 14/14 pass (3 lượt chạy liên tiếp).**
- Giới hạn trung thực: ước tính dùng check size-only (không hash) nên là
  **cận dưới** — file đủ size nhưng sai nội dung sẽ bị `downloadFile`
  tải lại sau khi verify fail; không dự trữ biên an toàn nào (cần đúng số
  byte còn thiếu, chưa tính metadata filesystem).
- Bug bắt được nhờ test: `freeDiskBytes` ban đầu trả null khi thư mục đích
  chưa tồn tại (statfsSync ENOENT) khiến check bị bỏ qua — đã sửa bằng cách
  leo lên thư mục cha (test đỏ-trước đã verify).

### 6.2 Slim venv bgremove (build-slim-venv.mjs)

- Từ venv dev: 719.381.710 byte (8.892 file) → **706.841.766 byte
  (8.349 file), giảm 1,7%** (chủ yếu thư mục `tests` + `__pycache__`);
  DROP của bgremove để trống đúng thiết kế (chưa chứng minh package nào
  thừa); **VERIFY OK** (`sys.prefix` đúng, import rembg/cv2/numpy/PIL).
- `--fresh` từ `requirements.txt` đã sửa (lần 3): 771.341.550 →
  **737.314.344 byte (11.712 file), giảm 4,4%, VERIFY OK**. (pip resolve
  bộ hơi khác uv nên nặng hơn bản slim từ venv dev ~30 MB.)
- `--fresh` lần 2 fail thoáng qua: pip gặp `OSError: [Errno 1] Operation
  not permitted` lúc install — đúng quirk VM đã ghi ở I5 §7.8 (chặn ghi
  file mtime cũ, đến rồi đi); chạy lại thì qua. Ghi nhận là quirk môi
  trường, không phải lỗi sản phẩm.
- Mới: cờ `--python BIN` cho `build-slim-venv.mjs` (dùng khi `--fresh`
  cần Python khác `python3` hệ thống — bgremove cần <3.13 cho rembg 2.0.60).
- Lưu ý đóng gói: symlink `bin/python3` của venv trỏ tới Python của uv
  (`~/.local/share/uv/python/...`, không có trên máy user) — cùng họ giới
  hạn đã ghi ở I5 §7.4 (venv caption/tts trỏ `/usr/bin/python3.12`). Máy
  user thiếu Python tương thích thì venv bundle không chạy, bridge fallback
  về system python3 (chưa kiểm chứng fallback này cho bgremove).

## 7. Kiểm chứng (07/11/2026)

- `tsc -p tsconfig.json --noEmit` (apps/desktop): **0 lỗi**.
- `node --test src/services/modelDownloader.test.cjs`: **14/14 pass**
  (3 lượt; gồm tải thật config.json 2.370 byte từ Hugging Face + verify
  SHA256 với manifest).
- `node --test src/services/serviceManager.test.cjs` (solo): **10/10 pass**
  (107 s).
- `node apps/desktop/scripts/gen-model-manifest.mjs --check`: **CHECK OK**.
- `test_bgremove.py --session u2net`: **PASS** (xem §5.1).
- `probePythonService(bgremove, deep)`: available true, venv, rembg OK,
  model OK (xem §2).
- `build-slim-venv.mjs --service bgremove` (từ venv dev): **OK, VERIFY OK**.
- `build-slim-venv.mjs --service bgremove --fresh --python <uv-3.10>`:
  **OK, VERIFY OK** (lần 3; lần 2 fail EPERM quirk, xem §6.2).
- KHÔNG chạy lại ở bước này: đo fps trên máy yên/GPU/máy thật; click-test
  UI tải model trong app (IPC `desktop:download-model` không đổi logic,
  chỉ thêm bước kiểm tra đĩa trước khi tải — đã cover bằng test).

### 7.1 Vấn đề môi trường gặp trong lượt (không phải lỗi sản phẩm)

- /tmp tmpfs 512M làm uv giải nén llvmlite chết (xem §2); dùng TMPDIR
  sang đĩa /home thì qua.
- Ảnh mẫu mặc định của `test_bgremove.py` đã **bị xóa khỏi Wikimedia
  Commons** (`File not found` — không phải lỗi mạng): URL thumb trả trang
  lỗi "Use thumbnail sizes listed...". Đợt này dùng ảnh Fortepan CC BY-SA
  qua Openverse API thay thế; script test mặc định cần cập nhật URL ở đợt
  sau (không sửa trong lượt này vì ngoài phạm vi J8).
- VM restart/khởi động lại không gặp trong lượt này; loadavg dao động
  1–19 do các luồng round 53 song song (ảnh hưởng trực tiếp tới fps và
  tốc độ tải đo được).

## 8. File đổi / mới (batch này — text only, KHÔNG venv/model/binary)

**Sửa (7):**
- `apps/desktop/src/services/modelDownloader.js` (+ `freeDiskBytes`,
  `formatBytes`, `estimateRemainingBytes`, `ensureFreeDiskSpace`; nối
  kiểm tra đĩa vào `downloadModel`)
- `apps/desktop/src/services/modelDownloader.d.ts` (khai báo 4 hàm mới +
  `DiskSpaceCheck`)
- `apps/desktop/src/services/modelDownloader.test.cjs` (cập nhật 3 test
  theo manifest mới + 3 test đĩa mới; test "chưa verify" dùng model giả)
- `apps/desktop/src/services/model-manifest.json` (chỉ bgremove đổi:
  URL đúng + SHA256 + size thật + verified true)
- `apps/desktop/scripts/gen-model-manifest.mjs` (bgremove: localDir
  `~/.u2net`, `localOptional`, `fileUrl`, sizeLabel/note theo trạng thái)
- `apps/desktop/scripts/build-slim-venv.mjs` (cờ `--python` cho `--fresh`)
- `server/bgremove/requirements.txt` (rembg 2.0.38 → `rembg[cpu]==2.0.60`,
  thêm `onnxruntime==1.23.2`, numpy 2.5.4 → 2.2.6)

**Mới (1):**
- `docs/PHASE9_ROUND53_J8_BGREMOVE_VENV_LIMITS.md` (file này)

**KHÔNG chạm (ghi rõ theo lệnh):** `pythonServices.js` (wiring đã có sẵn,
không cần sửa), `serviceManager.js`, `main.ts`, `preload.ts`,
`bgremove.py`, `docs/DESKTOP.md`. File chung với I5 (`modelDownloader.js`,
`gen-model-manifest.mjs`, `build-slim-venv.mjs`, `model-manifest.json`) mang
trạng thái mới nhất sau J8.

**Không đưa vào batch:** `server/bgremove/.venv/` (706M, gitignored),
`apps/desktop/build/slim-venv/bgremove/` (694M, gitignored),
`~/.u2net/birefnet-general.onnx` (973M, ngoài repo),
`~/workspace/j8-tmp/` (scratch: ảnh test, video test, log probe — đã xóa
sau khi đo), `apps/desktop/dist/` (không rebuild trong lượt này — cần chạy
`copy-services-js.mjs` trước khi đóng gói để đồng bộ modelDownloader mới).

## 9. Nợ mở cho đợt sau

1. **BiRefNet fps chưa có số ổn định** (§5.2): cần máy yên/RAM trống >5 GB
   để đo 1 frame hoàn chỉnh; cân nhắc `birefnet-general-lite` (model
   224 MB, session đã có trong rembg 2.0.60) làm mặc định cho máy yếu thay
   vì birefnet-general 973 MB.
2. **Mặc định session bgremove.py vẫn là `birefnet-general`** — trên máy
   8 GB có nguy cơ OOM-kill (fallback không cứu được SIGKILL). Cần quyết
   định: giữ mặc định + cảnh báo RAM, hay đổi mặc định sang u2net/lite.
3. `estimateRemainingBytes` là cận dưới (size-only); chưa dự trữ biên đĩa.
4. `test_bgremove.py` mặc định tải ảnh Wikimedia đã bị xóa — cập nhật URL
   ảnh mẫu (vd: ảnh Fortepan qua Openverse đã dùng ở lượt này).
5. `dist/` chưa đồng bộ modelDownloader mới (chạy `copy-services-js.mjs`
   khi build).
6. Venv đóng gói trỏ Python của máy build (uv 3.10 / system 3.12) — máy
   user thiếu Python tương thích thì fallback system python3 chưa kiểm
  chứng cho bgremove.
7. Quirk EPERM của VM vẫn còn (pip --fresh lần 2 fail, lần 3 qua) — retry
   là cách xử lý hiện tại, không có fix gốc.
