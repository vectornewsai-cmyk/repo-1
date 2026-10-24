# BGREMOVE_LIMITS.md — AI Background Removal (R1-084)

Tài liệu trung thực về giới hạn của tính năng xoá nền AI trong VCut Studio.
Cập nhật: 2026-10-19.

## 1. Giấy phép — ĐÃ KIỂM CHỨNG TRỰC TIẾP (không tin lời đồn)

| Thành phần | License | Cách verify (2026-10-19) |
|---|---|---|
| **rembg 2.0.38** (code) | **MIT** | PyPI JSON API `pypi.org/pypi/rembg/2.0.38/json` → classifier `"License :: OSI Approved :: MIT License"` |
| **BiRefNet** (gốc của weights `birefnet-general`) | **MIT** | GitHub API `repos/ZhengPeng7/BiRefNet/license` → `"key": "mit"`, `"name": "MIT License"` |
| **File ONNX `BiRefNet-general-epoch_244.onnx`** | Phân phối bởi project rembg (MIT) | Nằm trong GitHub releases của `danielgatis/rembg` (tag v0.0.0) — cùng project MIT |
| Session `u2net` (fallback) | MIT | Cùng project rembg |

**Kết luận: AN TOÀN cho repo MIT, dùng được thương mại.** Model được tải về
máy user lúc chạy (runtime download, ~973MB cho birefnet-general / ~176MB cho
u2net), KHÔNG bundle vào repo — giống cách `server/caption/` xử lý model
faster-whisper 462MB.

### ⚠️ BẪY LICENSE — ĐÃ TRÁNH CHỦ ĐỘNG

- **CẤM TUYỆT ĐỐI** session `bria-rmbg` / `RMBG-2.0` của rembg: weights
  **NON-COMMERCIAL**, dù chất lượng cao. Cả `bgremove.py`
  (`FORBIDDEN_SESSIONS`) và bridge (`validateSession`) đều từ chối chạy
  nếu session thuộc danh sách cấm — fail fast, không im lặng.
- **MatAnyone 2** (chất lượng video matting tốt nhất hiện nay): license
  NTU S-Lab **non-commercial** — chỉ benchmark, KHÔNG bundle, KHÔNG dùng.
- **Robust Video Matting (RVM)**: đã verify là **GPL-3.0** (không phải MIT
  như đồn) — KHÔNG dùng, để tránh xung đột với repo MIT.

## 2. Giới hạn kỹ thuật (đã đo thật)

### 2.1. RAM — birefnet-general OOM trên máy 8GB

- **Đã đo (2026-10-19, VM 7.7GB RAM, CPU 2 core):** cả `birefnet-general`
  (973MB) và `birefnet-general-lite` (214MB) đều bị **OOM-kill (SIGKILL)**
  khi inference ở độ phân giải nội bộ 1024×1024 — kể cả khi giới hạn
  `intra_op_num_threads=1` và tắt onnxruntime memory arena.
- **Hệ quả:** trên máy RAM ≤ 8GB, dùng session `u2net` (176MB, nội bộ
  320×320): **2.2 giây/frame** trên CPU, mask đã kiểm chứng bằng mắt là
  sạch (silhouette người + chai + ly đầy đủ).
- **Phase 7 P6 — fallback tự động (không còn bắt user tự chọn tay):**
  `bgremove.py` mặc định `--session birefnet-general` nhưng khi session
  birefnet lỗi (exception Python) thì tự chạy lại từ đầu bằng `u2net` và
  in marker `[bgremove] FALLBACK ...` + `[bgremove] session_used=u2net`
  ra stderr. Kernel OOM-kill (SIGKILL) không bắt được trong tiến trình
  Python nên bridge (`server/bridge/src/bgremove.js`) và MCP tool
  `remove_background` retry 1 lần bằng u2net khi lần chạy birefnet chết
  (exit != 0 hoặc bị signal; timeout thì KHÔNG retry vì đó là chậm chứ
  không phải OOM). UI BgRemovePanel có picker session (Tự động /
  birefnet-general / u2net) và hiển thị rõ khi đã fallback qua header
  `X-Bgremove-Session-Used` / `X-Bgremove-Fallback-From`. Tắt fallback
  bằng `--no-fallback` (CLI) hoặc chọn thẳng `u2net`.
  Test: `server/bgremove/test_bgremove_fallback.py` (7 test, stub run_once,
  không cần rembg) và `server/bridge/test/test-bgremove-fallback.cjs`
  (19 assert, stub Python — gồm case tự SIGKILL mô phỏng OOM).

### 2.2. Tốc độ CPU

| Session | Tốc độ đo được (CPU 2 core) | Video 3s (90 frames) |
|---|---|---|
| birefnet-general | OOM (không chạy được) | — |
| u2net | ~2.2 s/frame | ~3.5 phút |

Không có temporal smoothing như RVM (từng frame độc lập) — nhưng đã đo
**mean inter-frame diff = 0.45** (thang 0–255), nghĩa là mask ổn định giữa
các frame, không giật.

### 2.3. Định dạng alpha

- Output mode `alpha` là **MOV chứa PNG từng frame** (`-c:v png -pix_fmt rgba`),
  lossless, giữ alpha thật.
- **KHÔNG dùng WebM VP9/VP8 cho alpha:** build FFmpeg hiện tại **lặng lẽ bỏ
  kênh alpha** khi encode VP9 (output ra yuv420p dù input là yuva420p) —
  đã phát hiện khi test, không phải lỗi code.
- Render engine (`server/render`) đã hỗ trợ video có alpha: tự động phát hiện
  qua `pix_fmt` trong ffprobe (R1-084), giữ `yuva420p` xuyên suốt filter chain
  và composite bằng overlay — đã verify bằng render thật + pixel check
  (người trên nền xanh, góc xanh đúng, giữa là người).

### 2.4. Chất lượng mask

- u2net: tốt với chủ thể rõ (người, vật thể lớn); kém chi tiết ở tóc tơ,
  vật trong suốt so với birefnet-general (theo benchmark, chưa tự đo được
  vì OOM).
- Không có refine matting (không feather/guided filter sau inference) —
  viền có thể hơi cứng ở 1 số frame. TODO nếu cần.

## 3. Những gì CHƯA làm

- [x] ~~Cho user chọn session trong UI~~ — xong ở Phase 7 P6 (picker +
      fallback tự động, xem 2.1)
- [ ] Progress bar thời gian thực ở UI (endpoint hiện đồng bộ, UI chỉ hiện
      "đang chạy")
- [ ] Hủy job giữa chừng từ UI (AbortController có ở client nhưng bridge
      không nhận signal hủy — job vẫn chạy nền tới timeout)
- [ ] Cache model trong bridge (mỗi request spawn process mới, load lại model)
- [ ] Hỗ trợ GPU (onnxruntime-gpu) — code hiện CPU-only
