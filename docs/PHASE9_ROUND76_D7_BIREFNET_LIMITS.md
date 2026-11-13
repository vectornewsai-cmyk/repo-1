# LIMITS — Phase 9 đợt 76, luồng D7: birefnet — chốt phương án khi hết hướng giảm RAM

Ngày: 10/11/2026 (lượt cron 00:35 +07). Đóng nợ đợt 75 §4 mục 7
("Birefnet fps: hết hướng giảm RAM — đo trên máy RAM tổng ≥ 12 GB
hoặc chấp nhận không có số; u2net vẫn là fallback").
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa production.
Mọi số dưới đây là số đo thật trên VM này.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Birefnet fps | **VẪN KHÔNG CÓ SỐ — CHỐT ĐÓNG.** Không thử lại hướng nào của A5 (xem §1). Quyết định: không có số birefnet cho đến khi có máy RAM ≥ 12 GB; u2net là fallback chính thức |
| u2net fallback end-to-end (test_bgremove.py, video người thật 3 s) | **PASS toàn bộ, exit 0** — mask 90f fg=18,8% bg=79,7% diff=0,00; alpha rgba transparent=79,8% opaque=18,9%; **output giống hệt W1 từng byte** (mask.mp4 11.921 byte, alpha.mov 26.853.688 byte — trùng W1) → **không hồi quy** |
| u2net fps đo được lần này | **0,18 fps gộp** (180 frame / 977 s wall; 5,43 s/frame) — CHẬM HƠN baseline 0,37–0,43 fps, nhưng do **tải máy lúc chạy** (load avg 4,2–9,2, 8–10 luồng đợt 76 chạy song song, free RAM 169–567 MB), KHÔNG phải do code/model đổi (output bit-identical, xem §2) |
| u2net đỉnh RSS | **1,12 GiB** (sample 5 s, process bgremove) — vừa thoải mái trong trần cell 6,0 GiB |
| Test phụ | fallback **7/7**, smooth **4/4** — xanh |
| Ứng viên thay thế nhẹ | **CÓ 1 ứng viên khả thi: u2netp** (chạy thật, xem §3). RVM/MODNet bị loại vì license; MediaPipe là ứng viên số 2 (cần runtime mới) |
| u2netp probe (ảnh đơn 640×640) | load 0,7–2,3 s; predict **1,69 s và 3,84 s** (2 lần đo, tải máy khác nhau); alpha mean 32,4, >200=11,9% <55=86,8%; maxrss **0,50–0,51 GiB**; ONNX input cố định [1,3,320,320] |
| File đổi/thêm (batch phase9-round76-d7-birefnet, KHÔNG push) | `docs/PHASE9_ROUND76_D7_BIREFNET_LIMITS.md` (mới), `server/bgremove/probe_session.py` (mới, script đo dùng lại được) |

## 1. Birefnet — không thử lại, chốt đóng

Đọc trước: `docs/PHASE9_ROUND73_A5_BIREFNET_FPS_LIMITS.md` §4
(bảng 7 cấu hình đã chết) và §7 (danh sách cấm thử lại).
**Không chạy bất kỳ lệnh birefnet nào trong luồng này** — đúng lệnh
nhiệm vụ: input 512 (shape khoá 1024), tiling pad→1024 (tiết kiệm
0 byte), fp16 (không giảm VRAM theo docstring gốc), threads/arena
(4 tổ hợp đều chết exit 137) đã chứng minh không chạy được; thử lại
là phí lượt. Tổng cộng birefnet trên VM này vẫn là **lite 0/6,
general 0/5 predict hoàn thành**; lần hoàn thành duy nhất vẫn chỉ
là J8 (general, trước khi trần cell siết).

**Quyết định chốt (ghi vào gap analysis):**
- **Không có số fps birefnet cho đến khi có máy RAM tổng ≥ 12 GB
  (khuyến nghị 16 GB) ngoài sandbox.** Mọi hướng giảm RAM trong
  sandbox đã cạn (A5 §0).
- **u2net là fallback chính thức** — đã kiểm chứng lại đầu-cuối
  trong luồng này (§2), vẫn chạy tốt.
- **Không đổi `bgremove.py`:** mặc định vẫn `birefnet-general` +
  fallback u2net khi lỗi. Trên VM này birefnet chết OOM rồi fallback
  là đường sống duy nhất; trên máy RAM lớn, birefnet vẫn là session
  chất lượng cao nhất. Không có cấu hình fallback nào từ birefnet để
  đề xuất (không cấu hình nào chạy được).
- **Đừng đo birefnet trong sandbox nữa** trừ khi (a) trần cell được
  nâng trên 6,0 GiB, hoặc (b) có model ONNX khác chấp nhận input
  nhỏ/dynamic-shape — mà (b) chính là khảo sát §3, và ứng viên tìm
  được (u2netp) là model khác hẳn, không phải birefnet.

## 2. Kiểm chứng fallback u2net — PASS, không hồi quy

Lệnh (venv bgremove, Python 3.12, rembg 2.0.87 — y hệt W1):

```
.venv/bin/python test_bgremove.py --session u2net \
    --person ~/workspace/scratch-bgremove/person.jpg --keep
```

Ảnh mẫu: `scratch-bgremove/person.jpg` (JPEG thật 640×640,
43.409 byte, magic `ffd8ffe1`) — cùng ảnh W1/X5/Y4/Z4/A5.
Video mẫu 3 s / 90 frame, max-side 480. Chạy 09/11 17:46 → 18:02 +07.

| Hạng mục | Đợt này (D7) | W1 (đợt 69) | Kết luận |
|---|---|---|---|
| test_bgremove.py | **TẤT CẢ TEST PASS, exit 0** | PASS, exit 0 | xanh |
| mask 90 frame | fg(>200)=18,8%, bg(<55)=79,7%, diff=0,00 | 18,8% / 79,7% / 0,00 | **giống hệt** |
| alpha | pix_fmt rgba, transparent=79,8%, opaque=18,9% | rgba, 79,8% / 18,9% | **giống hệt** |
| mask.mp4 | **11.921 byte** | 11.921 byte | bit-identical |
| alpha.mov | **26.853.688 byte** | 26.853.688 byte | bit-identical |
| wall 180 frame | **977 s → 0,18 fps** (5,43 s/frame) | 490,6 s → 0,37 fps | chậm 2× — xem dưới |
| đỉnh RSS process bgremove | **1,12 GiB** | (không đo) | vừa trong trần cell |
| fallback logic | **7/7 pass** | 7/7 | xanh |
| smooth | **4/4 PASS** | 4/4 | xanh |

**Vì sao 0,18 fps lần này KHÔNG phải hồi quy:** cùng lệnh, cùng
model `u2net.onnx` (176 MB, không đổi), cùng ảnh, output giống hệt
từng byte — code và model không đổi thì tốc độ chậm đi chỉ có thể
do môi trường. Bằng chứng tải máy lúc chạy: `free` còn 169 MB lúc
bắt đầu, load average 2,84 → 4,23/9,15/6,32 lúc kết thúc (8–10
luồng đợt 76 chạy song song: build, test, render). Baseline sạch
vẫn là **0,37–0,43 fps** (W1 + các đợt trước); số 0,18 fps là số đo
dưới tải song song nặng, ghi rõ để đợt sau không lấy làm baseline
mới. Per-frame latency u2netp cũng dao động 1,69 → 3,84 s giữa 2
lần đo cùng ảnh (§3) — cùng một nhiễu tải máy, củng cố quy kết này.

## 3. Khảo sát model thay thế nhẹ — có 1 ứng viên khả thi

Phạm vi khảo sát: đọc model card + shape input + kích thước (qua
GitHub API / code rembg đã cài). Chỉ tải 1 model nhẹ duy nhất
(u2netp, 4,57 MB) để probe 1 ảnh; KHÔNG tải model nặng (176 MB
u2net_human_seg không tải), KHÔNG tích hợp gì vào production.

### 3.1 Ứng viên KHẢ THI

**u2netp — ứng viên số 1 (chạy thật trong luồng này).**
- Nguồn: rembg phân phối qua GitHub releases `danielgatis/rembg`
  v0.0.0 (`u2netp.onnx`), cùng họ u2net (MIT) như u2net đang dùng.
- Kích thước: **4.574.861 byte (4,57 MB)** — xác minh qua GitHub
  API (khớp Content-Length). Nhỏ hơn u2net 176 MB ~38 lần.
- Input ONNX đo thật: **[1, 3, 320, 320] cố định** (không dynamic,
  nhưng nhỏ nên RAM không thành vấn đề — điểm khác birefnet là
  320 chứ không phải 1024).
- Probe thật (script mới `server/bgremove/probe_session.py`,
  ảnh person.jpg 640×640, 2 lần chạy):
  - Lần 1 (probe tay): load 2,3 s, predict **1,69 s**, alpha
    mean 32,4, >200=11,9%, <55=86,8%, maxrss **0,51 GiB**.
  - Lần 2 (qua script mới): load 0,7 s, predict **3,84 s**, alpha
    giống hệt (mean 32,4 / 11,9% / 86,8%), maxrss **0,50 GiB**,
    PASS (mask có cả trắng và đen).
  - So với u2net trên cùng ảnh (W1): 4,02 s/frame, alpha mean
    49,6, >200=19,0%, <55=79,9%. **u2netp nhanh hơn ~1,1–2,4×
    nhưng mask mỏng hơn** (foreground 11,9% so với 19,0% — cắt
    hẹp hơn vào người). Đây là trade-off chất lượng, chưa kết luận
    được u2netp tốt hơn hay tệ hơn: cần test video + so mask
    từng frame trước mọi quyết định đổi fallback.
- **Kết luận: u2netp là ứng viên khả thi duy nhất đã chạy thật.
  Đề xuất đợt sau: test video 3 s bằng u2netp (mask+alpha, so
  fg/bg/diff với u2net), rồi mới quyết có đổi fallback mặc định
  hay giữ u2net. KHÔNG tích hợp trong luồng này.**

### 3.2 Ứng viên bị loại vì license (bẫy đã tránh)

- **Robust Video Matting (RVM) mobilenetv3 — LOẠI.** Model 14,5 MB,
  3,749M params, input linh hoạt theo `downsample_ratio`, có bản
  ONNX fp32/fp16, nhanh trên GPU (HD 104 fps trên GTX 1080Ti) —
  nhưng repo `PeterL1n/RobustVideoMatting` ghi rõ
  **License: GPL-3.0** ("Source code and pretrained models are
  published", "re-released under GPL-3.0", 03/09/2021). Copyleft
  GPL-3.0 không dùng được trong repo MIT mà không đổi license.
  Đây là bẫy cùng loại bria-rmbg (non-commercial) mà bgremove.py
  đã cấm — ghi rõ để đợt sau không đề xuất lại.
- **MODNet — LOẠI (weights gốc non-commercial).** Model ~25,9 MB
  (bản export Remotion), input 512×512, 67 fps trên GTX 1080Ti.
  Weights gốc ZHKKKe/MODNet là **CC BY-NC-SA 4.0** (ghi rõ trong
  README của tensorrt_demos). Remotion ghi model `modnet` của họ
  là Apache-2.0, mâu thuẫn với license gốc — chưa xác minh được
  nguồn gốc bản export đó nên **không dùng**; nếu đợt sau muốn
  xem lại thì phải xác minh provenance bằng văn bản trước.
- **BEN2-base — LOẠI (quá nặng).** MIT, nhưng 219,1 MB, tài nguyên
  cao (Remotion ghi "Experimental and higher-resource") — không
  phù hợp hướng nhẹ.

### 3.3 Ứng viên khác

- **MediaPipe SelfieSegmenter — ứng viên số 2 (chưa chạy).**
  Apache-2.0 (Google), model TFLite fp16 input **256×256**
  (bản square) / 144×256 (landscape), ~1 MB class, chạy realtime
  trên mobile. License sạch. Nhược điểm: cần runtime TFLite mới
  (không phải ONNX/rembg — thêm dependency), chỉ tách 1 người
  nổi bật nhất (không phải vật thể chung như u2net). Cần đợt
  riêng nếu muốn thử; không phải việc của luồng này.
- **u2net_human_seg — KHÔNG nhẹ hơn u2net.** Cùng họ MIT,
  normalize 320×320, chuyên chân dung — nhưng file
  `u2net_human_seg.onnx` trên GitHub releases v0.0.0 là
  **175.997.641 byte, đúng bằng u2net.onnx** (xác minh qua API).
  Chỉ khác post-processing (min-max normalize), không tiết kiệm
  RAM/file so với u2net. Không tải, không thử.
- **silueta — không ưu tiên.** 44.173.029 byte, 320×320, license
  chưa xác minh; nặng hơn u2netp ~10× mà không có lợi thế rõ.
- **birefnet-portrait / birefnet-dis / birefnet-massive (rembg)** —
  cùng họ birefnet 1024, cùng chết OOM; không phải hướng thay thế.

### 3.4 Bảng tổng hợp khảo sát

| Model | License | Kích thước | Input ONNX | RAM/CPU đo được | Phán quyết |
|---|---|---|---|---|---|
| **u2net (hiện tại)** | MIT | 176 MB | [1,3,320,320] | 1,12 GiB đỉnh, 0,37–0,43 fps sạch | Fallback chính thức, giữ nguyên |
| **u2netp** | MIT (họ u2net) | **4,57 MB** | [1,3,320,320] | **0,50 GiB, 1,7–3,8 s/frame** | **Ứng viên số 1 — test video đợt sau** |
| u2net_human_seg | MIT | 176 MB | 320 | chưa đo (không tải) | Không nhẹ hơn u2net — bỏ |
| silueta | chưa xác minh | 44,2 MB | 320 | chưa đo | Không ưu tiên |
| RVM mobilenetv3 | **GPL-3.0** | 14,5 MB | linh hoạt | chưa đo | **LOẠI — copyleft** |
| MODNet | **CC BY-NC-SA 4.0** (gốc) | ~25,9 MB | 512 | chưa đo | **LOẠI — non-commercial** |
| MediaPipe Selfie | Apache-2.0 | ~1 MB | 256×256 | chưa đo | Ứng viên số 2 — cần runtime TFLite |
| BEN2-base | MIT | 219 MB | — | chưa đo | LOẠI — quá nặng |
| birefnet-general/lite | MIT | 973 MB / 224 MB | [1,3,1024,1024] cố định | chết exit 137 (0/11) | **ĐÓNG — chờ máy RAM ≥ 12 GB** |

## 4. File đổi/thêm (batch phase9-round76-d7-birefnet, KHÔNG push)

- `docs/PHASE9_ROUND76_D7_BIREFNET_LIMITS.md` — doc này (mới).
- `server/bgremove/probe_session.py` — script probe 1 session trên
  1 ảnh (mới; đo u2netp 2 lần, kết quả khớp nhau về mask, chỉ khác
  latency do tải máy; `py_compile` OK).
- KHÔNG đổi: `bgremove.py`, requirements, venv, test nào, hay bất
  kỳ file production nào.
- Scratch không stage: `~/workspace/.tmp-r76d7/` (run_u2net.sh,
  probe_u2netp.py, u2net_test.log, run_u2net.out),
  `/tmp/bgremove-test-glvc76y7/` (test3s/mask/alpha, `--keep`),
  `~/.rembg/models/u2netp/u2netp.onnx` (model 4,57 MB đã tải để
  probe — binary, ngoài repo, không stage).

## 5. Nợ mở cho đợt sau

1. **u2netp — test video rồi mới quyết:** chạy `test_bgremove.py
   --session u2netp` (mask+alpha 90 frame) + so fg/bg/diff với
   u2net; nếu mask đạt ngưỡng và nhanh hơn thật thì đề xuất đổi
   fallback mặc định (cần sửa `bgremove.py` + test fallback — việc
   của đợt sau, không phải luồng này).
2. **Birefnet — ĐÃ ĐÓNG.** Không đo lại trong sandbox trừ khi trần
   cell > 6,0 GiB hoặc có máy RAM ≥ 12 GB. Khi có máy đó: chạy lại
   full `test_bgremove.py --session birefnet-general` để có fps
   video thật.
3. **MediaPipe SelfieSegmenter** (ứng viên số 2) — chỉ xem xét nếu
   u2netp không đạt; cần đợt riêng vì thêm runtime TFLite.
4. **Baseline fps u2net sạch 0,37–0,43 fps** — số 0,18 fps đợt này
   là dưới tải song song nặng, không dùng làm baseline mới.
5. TTS 39 CVE + các nợ khác của đợt 75/76 vẫn mở, không thuộc
   luồng này.
