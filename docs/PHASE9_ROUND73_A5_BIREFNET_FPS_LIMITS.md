# LIMITS — Phase 9 đợt 73, luồng A5: birefnet fps bằng cách giảm bộ nhớ

Ngày: 09/11/2026 (lượt cron 15:35 +07). Đóng nợ đợt 72 §4 mục 2
("Birefnet fps — vẫn chưa có số", Z4 đo đỉnh RSS 5,63 GiB, trần cell
6,0 GiB gần xác nhận). KHÔNG push, KHÔNG release/tag, KHÔNG binary,
KHÔNG sửa production, KHÔNG chạm venv TTS. Mọi số dưới đây là số đo
thật trên VM này. Ảnh test: `~/workspace/scratch-bgremove/person.jpg`
(JPEG thật 640×640, cùng ảnh W1/X5/Y4/Z4).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Birefnet-general-lite fps | **VẪN KHÔNG CÓ SỐ** — 0/3 predict hoàn thành đợt này (cộng dồn lite 0/6, general 0/5; lần hoàn thành duy nhất từ trước đến nay vẫn chỉ là J8) |
| Input nhỏ 512×512 (cấu hình A) | **KHÔNG KHẢ THI — model ONNX khoá shape cố định** `[1, 3, 1024, 1024]`, ORT từ chối tensor 512×512 bằng `InvalidArgument` (§1). Đây là bằng chứng thực nghiệm, không phải suy đoán từ code |
| Tiling / chia ảnh | **BỊ LOẠI mà không cần chạy** — mỗi tile vẫn phải pad lên 1024×1024 mới đưa được vào model nên tensor đầu vào và activation y hệt chạy nguyên ảnh → tiết kiệm 0 byte, chỉ thêm đường nối (seam). Xem §1.2 |
| 1024×1024 threads=4 arena OFF (cấu hình B) | **Chết exit 137 (OOM-kill)**, HWM quan sát cuối 4,76 GiB, hệ thống còn free 2.153 MB / avail 5.189 MB lúc chết → chữ ký trần cell, khớp Z4 (§2) |
| 1024×1024 threads=4 arena ON (cấu hình C) | **Chết exit 137 (OOM-kill)**, HWM quan sát cuối 4,32 GiB, hệ thống free rơi xuống 165 MB lúc chết → không quy kết sạch được (trần cell và/hoặc OOM hệ thống, §3) |
| fp16 | **Không thử — đã bị loại bằng tài liệu gốc**: docstring của chính `birefnet_general_fp16.py` ghi "does not reduce VRAM, which is dominated by activations at 1024x1024. On CPU it is usually slower" + cần `onnx`/`onnxconverter-common` (chưa cài) + model general đầy đủ (chưa có local, chỉ có lite) |
| Kết luận | **Không có cách giảm RAM nào còn lại trong sandbox này cho birefnet.** Mọi hướng tiết kiệm RAM đã thử hoặc đã bị loại bằng bằng chứng: input nhỏ (shape khoá), tiling (không tiết kiệm), giảm thread (Z4: đỉnh còn cao hơn), arena ON/OFF (cả hai đều chết), fp16 (không giảm VRAM theo tài liệu gốc). **Vẫn cần máy RAM tổng ≥ 12 GB (khuyến nghị 16 GB) ngoài sandbox để có số fps** — giữ nguyên khuyến nghị Y4/Z4 |

## 1. Vì sao "input nhỏ hơn" không chạy được — shape cố định

### 1.1 Kiểm tra shape model (trước mọi lần thử)

`ort.InferenceSession(...).get_inputs()` trên file model lite
(`~/.u2net/models/birefnet-general-lite/birefnet-general-lite.onnx`,
224.005.088 byte):

```
IN  input_image [1, 3, 1024, 1024] tensor(float)
OUT output_image [1, 1, 1024, 1024] tensor(float)
```

Cả 4 chiều đều là số cố định, không có chiều dynamic (`None`).
Trong code rembg, `BiRefNetSessionGeneral.predict` hardcode
`normalize(..., (1024, 1024))`, nhưng đó chỉ là lớp vỏ — **bản thân
đồ thị ONNX đã khoá 1024×1024**, nên bypass `predict` cũng không
cứu được.

### 1.2 Cấu hình A: predict trực tiếp 512×512 — lỗi shape, ghi verbatim

Probe `probe_a5.py --size 512 --n 1 --threads 1 --arena off`: gọi
thẳng `session.inner_session.run` với tensor do
`session.normalize(img, mean, std, (512, 512))` tạo ra (bypass hoàn
toàn `predict` của rembg). Init 21,6 s, RSS sau init 0,52 GiB,
rồi lỗi ngay khi chạy:

```
onnxruntime.capi.onnxruntime_pybind11_state.InvalidArgument:
[ONNXRuntimeError] : 2 : INVALID_ARGUMENT : Got invalid dimensions
for input: input_image for the following indices
 index: 2 Got: 512 Expected: 1024
 index: 3 Got: 512 Expected: 1024
 Please fix either the inputs/outputs or the model.
```

Kết luận A: **không thể chạy birefnet ở độ phân giải thấp hơn bằng
cách đưa tensor nhỏ vào model ONNX hiện tại.** Muốn chạy 512 phải
xuất lại / phẫu thuật đồ thị ONNX (đổi shape + kiểm tra mọi reshape
cố định trong mạng Swin) — đó là việc sửa model, ngoài phạm vi đo
fps, và không có bằng chứng nó giữ được chất lượng; không làm ở đây.

Tiling cũng chết theo cùng lý do: tile 512×512 muốn chạy qua model
phải pad lên 1024×1024 (zero/reflect), lúc đó tensor đầu vào và mọi
activation trung gian đều là 1024×1024 — **đúng bằng chạy nguyên
ảnh, tiết kiệm 0 byte**, cộng thêm công stitch và nguy cơ seam.
Vì vậy tiling **không được chạy thử** (chạy cũng chỉ lặp lại cái
chết 1024 của Z4/B/C với thêm overhead). Đây là quyết định có lý
do ghi rõ, không phải bỏ sót.

## 2. Cấu hình B: 1024×1024, threads=4, arena OFF — chết, chữ ký trần cell

Lệnh: `probe_a5.py --size 1024 --n 1 --threads 4 --arena off`
(dưới `watch_rss.sh`, sample 1 s). Đây là cấu hình có đỉnh RSS
thấp nhất từng ghi (Y4c arena OFF threads mặc định: 4,49 GiB, vẫn
đang tăng lúc chết) nên là ứng viên tốt nhất còn lại cho một lần
predict hoàn thành.

| | |
|---|---|
| Thời gian (+07) | 08:46–08:48, 09/11/2026 |
| Init | **15,7 s**, RSS sau init **0,61 GiB** |
| Predict | RSS răng cưa 1,2–1,6 GiB tới ~t=81 s, rồi leo dốc: 2,91 → 3,44 → 3,78 → 4,05 → 4,55 → 4,58 → 4,96 GiB (t=84–100); **chết exit 137 sau ~85–90 s trong predict** (tổng ~105 s từ lúc chạy) |
| Runtime báo | `failureKind=subprocess.oom_killed`, `oomKills=1` |
| Đỉnh quan sát cuối | VmRSS 4.964.012 KB = **4,73 GiB**; VmHWM 4.994.880 KB = **4,76 GiB** (t=100, mẫu cuối trước khi chết; vẫn đang tăng ~0,4 GiB/s nên đỉnh thật cao hơn, không biết bao nhiêu) |
| Hệ thống lúc chết | free **2.153 MB**, avail **5.189 MB** (mẫu cuối t=100) — máy còn nhiều RAM |
| Sibling lúc chạy | node r73a3 ~362 MB, node r73a1 ~165 MB, ffmpeg ~69 MB, daemon ~0,29 GiB; Chromium (Playwright) khởi động giữa chừng (~08:47) |

Quy kết: **trần cell 6,0 GiB, không phải OOM hệ thống** — cùng chữ
ký Z4 §3.2 (chết khi máy còn >2 GB free, runtime tự đếm OOM-kill).
Điểm mới so với Z4: **RSS của probe lúc chết (4,76 GiB) thấp hơn
Z4 (5,63 GiB)** — vì cái chết do TỔNG cell chạm 6,0 GiB (probe +
daemon ~0,29 + sibling ~0,6–0,9 + page cache model 224 MB), không
phải do riêng probe chạm ngưỡng cố định. Hệ quả: **đỉnh RSS của
probe lúc chết dao động theo tải sibling, không phải một hằng số
của model** — đừng lấy 4,76 hay 5,63 làm "ngưỡng" của birefnet.
Đỉnh thật của một predict lite 1024 hoàn chỉnh vẫn chưa biết,
plausibly 6–6,5 GiB (Z4 §3.3).

Một khác biệt nữa: threads=4 kéo dài pha răng cưa (~81 s) so với
threads=1 của Z4 (~28 s) rồi mới leo dốc cuối — nhưng pha leo dốc
cuối (decoder upsample về 1024×1024) vẫn giết process như nhau.
Giảm/tăng thread chỉ đổi hình dạng đường RSS, không đổi kết cục.

## 3. Cấu hình C: 1024×1024, threads=4, arena ON — chết, quy kết không sạch

Lệnh: `probe_a5.py --size 1024 --n 1 --threads 4 --arena on`.
Lý do thử: Y4b arena ON chết ở 4,90 GiB nhưng khi đó hệ thống chỉ
còn free ~130 MB (OOM hệ thống thật) — arena ON trên máy lặng
chưa từng được thử sạch.

| | |
|---|---|
| Thời gian (+07) | 08:48–08:49, 09/11/2026 |
| Init | **13,1 s**, RSS sau init **0,64 GiB** |
| Predict | Plateau ~2,7 GiB (t=43–47), rồi leo dốc: 3,09 → 3,59 → 4,39 → 4,52 GiB (t=48–52); **chết exit 137 sau ~40–45 s trong predict** (tổng ~58 s) |
| Đỉnh quan sát cuối | VmRSS 4.519.332 KB = **4,31 GiB**; VmHWM 4.525.688 KB = **4,32 GiB** (t=52) |
| Hệ thống lúc chết | free **165 MB**, avail **1.002 MB** (t=52) — máy đã cạn; ngay sau khi chết free nhảy lên 5.028 MB (RAM của probe được giải phóng) |
| Sibling lúc chạy | node r73a1 ~250 MB, Chromium ~237 + 149 MB, node vite ~194 MB, daemon ~0,29 GiB |

Quy kết: **không quy kết sạch được.** Probe chỉ 4,32 GiB (thấp
hơn cả B) nhưng hệ thống cũng đã cạn (free 165 MB) — cái chết có
thể là OOM hệ thống, trần cell, hoặc cả hai cùng lúc (tổng cell
ước ~4,32 + 0,29 + ~0,9 ≈ 5,5 GiB + page cache — gần trần nhưng
chưa chắc chạm). Ghi nhận đúng mức độ không chắc chắn này, không
ép vào khuôn "trần cell" như B. Dù nguyên nhân nào, kết cục vẫn
vậy: **arena ON cũng không cứu được predict trên VM này.**

## 4. Bảng tổng hợp mọi cấu hình đã thử (lite, cộng dồn tới đợt 73)

| # | Cấu hình | Kết quả | Đỉnh RSS quan sát | Nguyên nhân chết (mức tin cậy) |
|---|---|---|---|---|
| Y4a | general, threads mặc định | 0/1, exit 137 | plateau 4,37–4,41 GiB | trần cell (cao) |
| Y4b | lite, arena ON | 0/1, exit 137 | 4,90 GiB, đang tăng | OOM hệ thống (free ~130 MB) |
| Y4c | lite, arena OFF | 0/1, exit 137 | 4,49 GiB, đang tăng | (xem Y4) |
| Z4 | lite, threads=1, arena OFF | 0/1, exit 137 | **5,63 GiB**, đang tăng | trần cell (cao — 4 dấu vết) |
| **A5-A** | lite, **512×512 trực tiếp** | **0/1, lỗi shape** (không phải OOM) | 0,52 GiB (sau init) | ORT `InvalidArgument`: shape khoá 1024 |
| **A5-B** | lite, threads=4, arena OFF | 0/1, exit 137 | 4,76 GiB (HWM), đang tăng | trần cell (cao — máy còn 2,1 GB free) |
| **A5-C** | lite, threads=4, arena ON | 0/1, exit 137 | 4,32 GiB (HWM), đang tăng | không rõ (cell và/hoặc hệ thống) |
| — | tiling 512 pad→1024 | **không chạy** | — | bị loại bằng lý luận §1.2 (tiết kiệm 0 byte) |
| — | fp16 | **không chạy** | — | docstring gốc: không giảm VRAM, CPU chậm hơn; thiếu dep + model |

**Tổng cộng birefnet trên VM này: lite 0/6, general 0/5 predict
hoàn thành.** Lần hoàn thành duy nhất vẫn là J8 (general, trước
khi trần cell/sibling siết như hiện tại) — không lặp lại được.

## 5. Không có số nào khác

- **Không có fps, không có s/frame, không có mask:** không lần
  predict nào trả về mask nên không có gì để tính, không có gì để
  so chất lượng với u2net (u2net.onnx có sẵn tại
  `~/.u2net/u2net.onnx` nhưng không có mask birefnet để đối chiếu
  — không bịa phép so sánh). Thời gian "chết giữa chừng" (~40–90 s)
  không phải thời gian predict, không được suy fps từ đó.
- **Không sửa production:** không đổi `bgremove.py`, requirements,
  venv, hay bất kỳ file code nào. `bgremove.py` vẫn mặc định
  `birefnet-general` + fallback u2net khi lỗi (đợt 69 W1:
  bgremove pipeline PASS với u2net) — hành vi đó giữ nguyên, vì
  trên VM này birefnet không chạy được nên fallback là đường sống
  duy nhất, và đề xuất "dùng 512 làm fallback" là **không thể**
  (shape khoá, §1).
- **Không đề xuất cấu hình fallback production nào từ birefnet:**
  không cấu hình nào chạy được, nên không có gì để đề xuất. Đề
  xuất duy nhất vẫn là cũ: giữ u2net làm fallback (đã có), đo
  birefnet fps trên máy RAM ≥ 12 GB ngoài sandbox.

## 6. File đổi/thêm (batch phase9-round73-a5-birefnet-fps, KHÔNG push)

- `docs/PHASE9_ROUND73_A5_BIREFNET_FPS_LIMITS.md` — doc này (mới).
- KHÔNG đổi: code, requirements, venv, script nào trong repo.
- Scratch không stage: `~/workspace/.tmp-r73a5/probe_a5.py`,
  `shape_check.py`, `watch_rss.sh` (copy từ Z4),
  `rss_a5_512.csv`, `rss_a5_1024_t4_arenaoff.csv`,
  `rss_a5_1024_t4_arenaon.csv`. Không có file mask nào được lưu
  (mọi lần chạy đều chết trước khi predict trả về).
- Stage file: `paths-loop/phase9-round73-a5-birefnet-fps.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 7. Nợ mở cho đợt sau

1. **Birefnet fps vẫn chưa có số — và đã hết hướng giảm RAM để thử
   trong sandbox.** Đừng đo birefnet trong sandbox nữa trừ khi
   (a) trần cell được nâng trên 6,0 GiB, hoặc (b) có model ONNX
   khác chấp nhận input nhỏ/dynamic-shape (cần xuất lại model, là
   việc riêng, không phải đo fps). Khi nào 1 lần predict đơn hoàn
   thành (trên máy RAM tổng ≥ 12 GB, khuyến nghị 16 GB, ngoài
   sandbox) thì chạy lại full `test_bgremove.py --session
   birefnet-general` để có fps video thật.
2. **Đừng thử lại các cấu hình đã chết:** 512 trực tiếp (lỗi
   shape — thử lại chỉ ra cùng lỗi), tiling pad→1024 (tiết kiệm
   0 byte), threads=1/4, arena ON/OFF (cả 4 tổ hợp đều đã chết),
   fp16 (không giảm VRAM theo tài liệu gốc). Bảng §4 là danh sách
   cấm thử lại, trừ khi có thay đổi về môi trường (trần RAM) hoặc
   model.
3. Giả thuyết trần cell 6,0 GiB: **được củng cố thêm bởi cấu hình
   B** (chết khi máy còn 2,1 GB free) nhưng cấu hình C cho thấy
   khi sibling nặng thì OOM hệ thống cũng nhập cuộc — hai cơ chế
   chết cùng tồn tại, đừng quy mọi cái chết về một nguyên nhân.
4. TTS 39 CVE + các nợ khác vẫn mở, không thuộc luồng này.
