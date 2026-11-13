# LIMITS — G6 đợt 105: 2 MiB — truy nguyên 2097152 + probe phân biệt blob-direct

> Luồng G6, Phase 9 đợt 105 (VCut Studio). Nợ LIMITS gộp đợt 104 §4
> (vì sao đúng 2.097.152; F2 đã xác định refill = dataReceived của Range
> cuối trước pull đầu + cache push-phase của typefind, shim không ức
> chế bogus 10/12).
> Đo: 13/11/2026 ~11:38–12:05Z (18:38–19:05 +07). Boot
> `3e4f237a-adf1-47c6-af18-9debf7436cd0` (reboot #30 lúc 11:26Z; KHÔNG
> reboot trong lúc đo). Repo local `~/workspace/repo-1`, branch main.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ
> main chat.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu),
> Playwright webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B, md5 `4dfaad520330453d516e14f551580cdd`) + c8 cùng thư mục
> (8.182.985 B). **Cấm:** TTS 39, birefnet, `.github/workflows/*`.
> RAM khả dụng lúc đo: 548 MB lúc bắt đầu (11:38Z) → 1.154–2.214 MB
> trong lúc chạy probe live (buff/cache được giải phóng); loadavg
> 1,5–6,1 (8–9 luồng đợt 105 chạy song song). Probe live CHẠY ĐƯỢC
> (8 run, 0 crash/OOM) — khác dự kiến xấu lúc đầu.

## Kết luận chính (TL;DR)

1. **2097152 KHÔNG phải ranh giới cấu trúc file** (đo mới, bằng parse
   moov đầy đủ): chunk 3 bắt đầu 2094129 (sample 187, size 8959);
   2097152 nằm **giữa sample 187** (delta +3023), không phải đầu
   chunk/sample/atom nào. 4 byte tại đó `204286c4` không phải độ dài
   sample hợp lệ. Các Range-start khác (450560, 512000, 1064960,
   1044480) cũng không phải ranh giới sample/chunk.
2. **Seek/Range tới 2097152 KHÔNG phải điều kiện cần của splice
   (bằng chứng mới, 8 run): 0/8 run G6 có DoSeek hay Range tới
   2097152** — nhưng 5/5 run bogus vẫn splice đúng tại file[2097152].
   Gộp với F2: seek 2097152 chỉ xuất hiện 3/12 run, Range chỉ 1/12
   run, trong khi splice ở 2097152 xuất hiện 15–16/20 run bogus.
   Con số 2097152 là **vị trí tuyệt đối của nội dung bị splice**,
   không phải vị trí được seek tới.
3. **Biện pháp giảm nhẹ blob-direct KHÔNG hiệu quả** (probe phân biệt
   G6AB, xen kẽ, cùng shim, cùng định nghĩa bogus — xem §2):
   first-atom E 2/3 vs A 2/3 (Fisher hai phía p=1,0); any-splice
   E 2/3 vs A 3/3 (p=1,0); E vs A gộp (F2+G6A) p=0,31 / p=1,0.
   **Swap http→blob KHÔNG phải điều kiện cần** — lỗi sống trong
   chính pipeline blob (scan typefind không có extension + đường
   refill Range của webkitwebsrc). Không đổi định nghĩa bogus để
   "sửa": cả hai định nghĩa đều cho kết quả không có ý nghĩa.
4. **Cơ chế scan đã tái hiện được offline, không cần WebKit** (§4):
   khi URI không có extension (blob: URL), hàm typefind MP4 quét
   nhiều vùng — peek 0, đuôi file (EOF−32, EOF−128), quét tuyến
   tính đầu file theo bước 4032, rồi vùng giữa file (size//2 +
   bước 2048) — tổng 40 lần đọc trước khi tìm ra caps, so với
   **1 lần đọc 4096 B** khi URI có đuôi `.mp4`. Mỗi lần peek nhảy
   offset xa đều ép webkitwebsrc seek + phát Range request mới +
   reset/refill adapter — đó là đường tạo ra refill cuối trước
   pull đầu. Trong 8/8 run G6, scan đều peek đuôi file + size//2
   (1069986 với c2, 4091492 với c8) + 2 probe giữa file trên lưới
   4096 (mỗi run một cặp khác nhau: 98304/679936, 86016/208896…).
5. **Hằng số 2 MiB duy nhất tìm thấy trong stack là
   `queue2.max-size-bytes = 2097152`** (mặc định, đo bằng
   gst-inspect + giải mã binary — xem §1.5). Nhưng **chưa có bằng
   chứng queue2 nằm trong chuỗi pull webkitwebsrc→typefind→qtdemux**
   (typefind chạy pull-mode, queue2 là push-mode; log GST không có
   element queue2 nào; playbin offline với filesrc không splice).
   Nên đây vẫn là **ứng viên, chưa phải nguyên nhân đã chứng minh**.
6. **Phát hiện phương pháp (quan trọng cho các đợt sau): shim F2
   KHÔNG ghi được pull của chính typefind** (§5): hook
   `gst_pad_pull_range` lọc theo parent của pad đối số — pull do
   typefind khởi xướng có parent là webkitwebsrc nên bị loại; log
   PULL chỉ chứa pull do qtdemux khởi xướng (parent=typefind).
   Các peek của typefind trong phase scan chỉ đọc được qua dòng
   DoSeek trong log GST, không có trong pull log. F2 không sai ở
   kết luận refill, nhưng "tổng take trước pull" của F2 là take
   của adapter, không phải lượng byte typefind đã tiêu thụ trong
   store — hai con số khác nhau, không được đồng nhất.

## 1. Truy nguyên 2097152 — từng ứng viên, đo nào bác/chưa bác

### 1.1 Cấu trúc file c2.mp4 (parse moov đầy đủ, script offline)

```
ftyp 0/32 | moov 32/3131 | free 3163/8 | mdat 3171/2136802 (hết 2139973)
stco: 3 chunk @ 3179, 1049719, 2094129 (cỡ 1046540, 1044410, 45844)
stsc: chunk1=87 sample, chunk2=100 sample, chunk3=5 sample; stsz 192 sample
```

| Offset | Là gì? | Kết luận |
|---|---|---|
| 2097152 | trong sample 187 (chunk 3, bắt đầu 2094129, size 8959), delta +3023 | **KHÔNG phải ranh giới** |
| 2094129 | đầu chunk 3 / đầu sample 187 | ranh giới thật, nhưng splice không ở đây |
| 1064960 / 1044480 / 512000 / 450560 | trong sample 88 / 86 / 37 / 31 (delta 3878 / 3486 / 1195 / 6518) | không phải ranh giới |
| 2139973−2097152 = 42821 | = phần còn lại của chunk 3 (45844−3023) — trùng hợp số học, không phải nguyên nhân | ghi chú, không dùng làm giải thích |
| bytes tại 2097152: `204286c4 26836340…` | qtdemux đọc thành "atom length 0x204286c4, type `&.c@`" → "atom has bogus size 541230788" (log GST run7 F2, qtdemux.c:3163/558) | khớp từng byte với pull splice |

### 1.2 Seek/Range tới 2097152 — không cần thiết

- G6: 0/8 run có `DoSeek (2097152-` hay `Range: bytes=2097152-`
  (đếm từ 8 log GST), trong khi splice tại file[2097152] ở 5/5
  run bogus (hex đầu pull `204286c4…` hoặc sample-data
  `4b4c400e…`/`24ae39de…` = file[2100331]/file[2138818], đã đối
  chiếu từng byte với file gốc).
- Gộp F2 (12 run): seek 2097152 chỉ 3 run (4, 6, 7), Range chỉ
  run4; splice 2097152 ở 10/12 (first-atom) / 11/12 (any-splice).
- Kết luận: seek/Range 2097152 là **triệu chứng** (một lần peek
  của scan tình cờ chạm 2 MiB), không phải nguyên nhân.

### 1.3 Tổng take trước pull — đã bác lại bằng số (nhắc lại + bổ sung)

F2 đã bác "scan tiêu thụ đúng 2 MiB" bằng tổng take adapter
(4.249.573 / 2.963.429 / 3.517.320 / 2.148.325 B). Bổ sung G6:
trong run E2, refill cuối là Range bắt đầu 98304, splice ở
2097152 = 98304 + **488×4096**; F2 run7: 1064960 + **252×4096**;
F2 run1: 450560 + **402×4096**. Chỉ số chunk (488/252/402)
**thay đổi theo refill**, chỉ vị trí tuyệt đối 2097152 là hằng.
Mọi refill đều bắt đầu trên lưới 4096 và 2097152 = 512×4096 —
nhưng "512 chunk" không phải hằng số cơ chế (chunk-count đổi),
chỉ là hệ quả của lưới 4096 + vị trí tuyệt đối.

### 1.4 Vì sao scan đi xa tới vậy — đã rõ (§4)

Scan không-extension peek nhiều vùng (đuôi, size//2, giữa file);
mỗi peek nhảy offset → webkitwebsrc seek + Range mới + reset
adapter. Chuỗi refill tạo ra cửa sổ mà ở đó read-position của
cache push-phase typefind lệch đúng 2 MiB so với vị trí logic.
Cái gì đặt đúng 2 MiB thì **vẫn chưa đo được trực tiếp** (cache
đó không quan sát được bằng shim adapter; PUSH cap 40/tên vẫn
che cửa sổ forward của typefind — nợ từ F2 §5.4, chưa làm).

### 1.5 Hằng số 2097152 trong stack đã cài — đo bằng binary

| Nơi | Kết quả đo | Trạng thái |
|---|---|---|
| `queue2` (gst-inspect) | `max-size-bytes` mặc định **2097152**; `max-size-time` 2.000.000.000 ns; `max-size-buffers` 100 | Ứng viên số 1 |
| `libgstcoreelements.so` giải mã (site 0x1641a, hàm @0x163e0) | `g_param_spec_uint("max-size-bytes", "Max. size (kB)", "Max. amount of data to buffer (bytes, 0=disable)", min 0, max −1, default 0x200000)` + property kế `max-size-time` default 0x77359400 (2 s) | **Xác nhận là queue2** (blurb "to buffer" + cặp 2 s) |
| `libgstcoreelements.so` giải mã (site 0x3b2d6, hàm @0x3b1f0) | cùng `max-size-bytes` default 0x200000 nhưng blurb "Max. amount of data in the queue (bytes, 0=disable)" + các property `current-level-*` | **Chủ chưa xác định**: inspect nói `queue`/`multiqueue` mặc định 10485760 — mâu thuẫn chưa giải quyết, ghi nhận mở |
| `libgstcoreelements.so` site 0x16a3e | `movl $0x200000,0x160(%rbx)` — gán field instance = 2097152 | cùng họ queue2, chưa phân biệt hàm |
| `queue` / `multiqueue` (gst-inspect) | `max-size-bytes` mặc định **10485760** (10 MiB) | Đã loại |
| `playbin` / `uridecodebin` (gst-inspect) | `buffer-size` / `buffer-duration` mặc định −1; `use-buffering` false | Đã loại (không phải 2 MiB) |
| `libgstisomp4.so` (qtdemux) | 10 hit `$0x2000000` (= 33.554.432, 32 MiB — KHÔNG phải 2 MiB) + **1 hit exact `$0x200000` tại 0x540ef** (`mov $0x200000,%eax`, hàm chưa xác định) | 32 MiB đã loại; hit 2 MiB duy nhất chưa xác định hàm — nợ mở |
| `libgstreamer-1.0.so.0` | 6 hit exact `$0x200000`, hàm chưa xác định | Chưa xác định — nợ mở |
| `libsoup-3.0.so.0` | 0 hit exact `$0x200000` | Đã loại |
| `libgstplayback-1.0.so.0` | 0 hit | Đã loại |
| `libwebkitgtk-6.0.so.4.20.0` (đường dẫn thực: `~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/lib/`) | **CHƯA kiểm tra** (hết lượt ưu tiên sau khi probe live xong) | Nợ mở |

Cảnh báo trung thực: có hằng số 2 MiB trong stack **không chứng
minh** nó gây splice. Chuỗi pull webkitwebsrc→typefind→qtdemux
không chứa queue2 theo mọi bằng chứng hiện có (typefind pull-mode;
không element queue2 nào trong log GST; playbin offline với
filesrc + cùng typefind/qtdemux không splice). Mối nối queue2→
splice vẫn là giả thuyết chưa có thí nghiệm phân biệt.

## 2. Probe phân biệt G6AB — blob-direct (E) vs prod (A)

### 2.1 Thiết kế

- Biện pháp giảm nhẹ: **blob-direct** — fetch toàn bộ file trước,
  blob làm src ĐẦU TIÊN, không element http preload, không swap
  http→blob (biến thể `directBlob` đã có sẵn trong probe 104f2,
  mode MATRIX2 từng đo nhưng KHÔNG kèm shim nên không phân loại
  được bogus). Nếu swap/preload là điều kiện cần thì E phải sạch.
- Đối chứng: A = prod (http preload + swap) — cùng clip c2, cùng
  shim F2 v2 (`f2_adapter_probe.so`), cùng GST nhẹ
  (`qtdemux:5,typefind:5,webkitwebsrc:5,playbin:2,uridecodebin:2,decodebin:2`),
  xen kẽ E,A từng run để khử nhiễu tải, port 8925, display Xvfb
  claim tự động (:194).
- Định nghĩa bogus (giữ nguyên cả hai, không đổi để "sửa"):
  **first-atom** = ≥1 pull `req_off=0` trả về byte không phải
  file[0..] (hex đầu `204286c4…`); **any-splice** = ≥1 pull bất kỳ
  trả về byte lệch +2 MiB (gồm cả sample-data splice ở 3179/41666).
  Phân loại bằng `analyze-f2.py` (script F2, copy nguyên sang
  `analyze-g6.py`).
- Probe mới: `benchmarks/render/webkit_blob_flaky_105g6_2mib.mjs`
  (bản sao 104f2 + mode `G6AB`/`G6C8`, port 8925).

### 2.2 Kết quả (3 run mỗi biến thể, xen kẽ)

| Run | Biến thể | first-atom | any-splice | Spliced pulls | Frames | ct cuối |
|---|---|---|---|---|---|---|
| E1 | blob-direct | KHÔNG | KHÔNG | 0 | 180 | 8 (fallback http) |
| E2 | blob-direct | CÓ | CÓ | 4 (req_off=0 → `204286c4…`, cả 2 instance) | 192 | 8 |
| E3 | blob-direct | CÓ | CÓ | 4 (req_off=0 → `204286c4…`, cả 2 instance) | 158 | 8 |
| A1 | prod | CÓ | CÓ | 4 (req_off=0 → `204286c4…`) | 189 | 8 |
| A2 | prod | KHÔNG | CÓ | 8 (header đúng; splice ở 3179→file[2100331], 41666→file[2138818]) | 183 | 8 |
| A3 | prod | CÓ | CÓ | 6 (req_off=0 + 3179 + 41666) | 192 | 8 |

- **first-atom: E 2/3 vs A 2/3 — Fisher hai phía p=1,0.**
- **any-splice: E 2/3 vs A 3/3 — Fisher hai phía p=1,0**
  (một phía p=0,5).
- E vs A gộp (F2 11/12 + G6A 3/3 = 14/15 any-splice; F2 10/12 +
  G6A 2/3 = 12/15 first-atom): any-splice p=0,31, first-atom
  p=1,0 — đều không có ý nghĩa.
- Đối chứng nội bộ: G6-A any-splice 3/3 vs F2 11/12 (p=1,0) —
  baseline tái hiện ổn định, ma trận G6 không bị lệch.
- Tất cả 6 run c2 đều `playOk=false` (error-event, `play()` bị
  reject "The operation is not supported") nhưng phát 158–192
  frame, ct tới 8 qua fallback http — cùng mẫu flaky-blob như F2,
  không phải tỉ lệ fail của sản phẩm.
- Refill gây splice ở G6 (theo tái dựng FIFO của analyzer):
  E2 — drain của Range bắt đầu **98304** (probe scan, push #4),
  splice ở 2097152 = 98304 + 488×4096; các pull splice ở
  ms=570/648 **không có event đọc adapter nào trong ±3 ms** (byte
  từ cache nội bộ typefind, như F2). A2 — header đúng, splice ở
  sample-data (kiểu E2W-run2/F2-run7-instance-2).

### 2.3 Kết luận probe

**blob-direct KHÔNG giảm bogus.** Swap http→blob không phải điều
kiện cần; lỗi sống trong pipeline blob: scan typefind không có
extension (§4) + refill Range của webkitwebsrc + cache push-phase
của typefind. E1 sạch (first pull trả đúng ftyp) chứng tỏ hiện
tượng là race theo thời gian, không phải xác định theo biến thể.
Hướng giảm nhẹ này **bị bác bằng số** — không đề xuất đổi kiến
trúc MediaPool sang blob-direct vì lý do này (nó chỉ đổi đường
đi, không đổi tỉ lệ lỗi).

## 3. G6C8 — splice offset có cố định khi file lớn hơn?

- Clip c8 8.182.985 B (ftyp 0/32, moov 32/9891, free 9923/8,
  mdat 9931/8173054), blob-direct + shim, 2 run:
  **run1 CLEAN (playOk=true, 152 frame), run2 CLEAN (0 spliced
  pull, 88 frame)** — không có splice nào để đo offset.
- Kết quả **không kết luận được**: nếu tỉ lệ bogus thật của c8-E
  là 2/3 thì P(0/2 sạch) ≈ 11% — không đủ bác "offset cố định
  2 MiB", cũng không đủ khẳng định. Scan của c8 vẫn peek đuôi
  (EOF−32/EOF−128) + size//2 (4091492) + probe giữa file
  (425984/442368, 4096), tức cùng mẫu scan như c2.
- Ghi chú: c2 chỉ lớn hơn 2 MiB có 42.821 B (2.139.973 −
  2.097.152); c8 lớn hơn 2 MiB tới ~6 MB. Chưa phân biệt được
  "offset cố định" vs "offset suy từ size" — cần run c8 có
  splice (hoặc clip cỡ ~3–4 MiB) ở đợt sau.

## 4. Cơ chế scan — tái hiện offline (không WebKit, không RAM lớn)

`GST_DEBUG=typefind:5,basesrc:5 gst-launch-1.0 filesrc ! typefind ! fakesink`
trên cùng máy, cùng GStreamer 1.24.2:

| File | Đọc trước khi "Found caps" | Kết quả |
|---|---|---|
| c2.mp4 (có đuôi `.mp4`) | 1 lần: offset 0, 4096 B | caps ngay |
| c2_tailmoov.mp4 (moov cuối, có đuôi) | 1 lần: offset 0, 4096 B | caps ngay |
| c8.mp4 (có đuôi) | 1 lần: offset 0, 4096 B | caps ngay |
| **c2_noext** (c2.mp4 đổi tên, không đuôi) | **40 lần đọc**: `0, 0, 2139941, 2139845, 0×4, 4032…64512 (bước 4032), 0×3, 2048, 6144, 1069986 (=size//2), 1072034, 1074082, 1076130, 1078178 (bước 2048)` | caps sau khi quét vùng size//2 |
| playbin `file://c2.mp4` | 1 lần 4096 B @0 → caps; sau đó pull qtdemux 0/32/3163/3171/2139973(EOF probe)/3179/41666… đúng từng byte | **không splice** |

- Kết luận: **thiếu extension trong URI là điều kiện đủ để
  trigger scan nhiều vùng**. Blob URL không có extension → scan
  → nhiều pull_range nhảy offset → nhiều seek/Range/refill.
  Đây là cầu nối giữa "blob" và "refill cuối tạo đoạn sai".
- Lưu ý: scan offline (filesrc) tìm caps sau vùng size//2 mà
  KHÔNG chạm 2097152; scan trong WebKit đi xa hơn (tới 2097152
  trong 3/12 run F2 dưới dạng seek) vì đường đi của scan phụ
  thuộc dữ liệu nó đọc — và dữ liệu đó trong WebKit có thể đã
  bị splice từ refill trước (vòng luẩn quẩn scan↔splice, chưa
  tách được chiều nhân quả).

## 5. Phát hiện phương pháp — shim F2 không thấy pull của typefind

Đọc code `benchmarks/render/f2_adapter_probe.c` (dòng 538–555,
318–330): hook `gst_pad_pull_range` lấy tên element bằng
`parent_name(pad)` = parent của **pad đối số**. Pull do vòng lặp
typefind khởi xướng gọi trên pad peer = src pad của webkitwebsrc
→ parent `webkitwebsrc0` → `want=0` → **không ghi**. Log PULL
chỉ chứa pull do qtdemux khởi xướng (gọi trên src pad của
typefind → parent `typefind`) — mỗi pull thật xuất hiện 2 dòng
(`elem=typefind` + `elem=qtdemuxN`, cùng ms/offset/hex).
Hệ quả:
- Các peek của typefind trong phase scan (40 lần đọc ở §4)
  **không có trong pull log**; phải đọc qua dòng DoSeek trong
  log GST (BaseSrc seek khi pull_range nhảy offset).
- "Tổng take trước pull đầu" của F2 là take của **adapter
  webkitwebsrc**, không phải lượng byte typefind đã tiêu thụ
  trong store của nó — hai con số khác nhau; không được dùng
  tổng take để bác/khẳng định mức tiêu thụ của store.
- Đợt sau nếu muốn ghi pull của typefind: sửa shim để log cả
  khi parent là `webkitwebsrc` (kèm phân biệt caller), hoặc
  log theo pad peer thay vì pad đối số.

## 6. Số đo & dữ liệu thô

- Probe mới: `benchmarks/render/webkit_blob_flaky_105g6_2mib.mjs`
  (G6AB + G6C8, port 8925, `node --check` OK).
- Kết quả: `benchmarks/results/webkit-blob-flaky-105g6-2mib.json`
  (8 case: 6 c2 G6AB + 2 c8 G6C8; round
  `phase9-round105-g6-2mib-discrim`).
- Dump: `hidden_files/round105-g6/f-websrc/pull/*.pull.log`
  (8 file) + `hidden_files/round105-g6/f-websrc/gst/*.log`
  (8 file, 267–320 KB); phân tích: `hidden_files/round105-g6/g6-*-analysis.txt`
  (8 file, chạy `analyze-g6.py` = bản sao `analyze-f2.py`);
  log chạy: `hidden_files/round105-g6/g6-matrix.log`,
  `g6-c8.log`.
- Offline: `hidden_files/round105-g6/g6-noext-full.log`
  (scan filesrc/typefind đầy đủ, 564 lần đọc); file tạm
  `/tmp/c2_noext`, `/tmp/c2_tailmoov.mp4` (không stage).
- Điều kiện từng run: xem JSON (`memAvailMB` 1154–2064,
  `loadavg` 1,5–5,3; boot `3e4f237a…`).
- Tham chiếu: F2 `docs/PHASE9_ROUND104_F2_2MIB_LIMITS.md`; F9
  recount `hidden_files/round104-f9/recounts.log` §1 (first-atom
  10/12, any-splice 11/12 — dùng làm baseline gộp).

## 7. Ghi chú trung thực / giới hạn của luồng này

- Không sửa production (không đổi `apps/`, `media.ts`,
  `preview.tsx`). Không push. Không release/tag. Không đụng TTS
  39, birefnet, `.github/workflows/*`. Không đụng file của luồng
  khác (port riêng 8925, display Xvfb claim :194, thư mục
  `round105-g6` riêng).
- Mẫu probe phân biệt nhỏ (3+3 run): Fisher p=1,0 nghĩa là
  **không phát hiện khác biệt**, không phải chứng minh "bằng
  nhau tuyệt đối" — với n=3, chỉ khác biệt rất lớn mới đo được.
  Kết luận "blob-direct không hiệu quả" là "không giảm ở mức đo
  được trong mẫu này", không phải "chắc chắn bằng 0".
- G6C8 0/2 sạch: không kết luận về offset với file lớn — nợ mở.
- Truy nguyên 2097152: đã loại cấu trúc file, seek/Range,
  tổng take, LOW, scan-2MiB; còn lại ứng viên queue2 (chưa có
  mối nối nhân quả) + 3 hit binary chưa xác định hàm
  (libgstreamer ×6, libgstisomp4 ×1, libwebkitgtk chưa kiểm
  tra) + cache push-phase của typefind chưa quan sát trực tiếp.
- "Refill tạo đoạn sai" (F2) được củng cố thêm 1 trường hợp
  (E2: refill Range 98304), nhưng cơ chế đặt read-position
  đúng 2 MiB trong cache typefind **vẫn mở** — đây là nợ mở
  lớn nhất của chủ đề 2 MiB sau đợt 105.

## 8. Nợ mở (cho đợt sau)

1. **2 MiB — read-position trong cache typefind**: cần đo trực
   tiếp lượng byte typefind forward/tiêu thụ trong phase scan
   (nâng PUSH cap hoặc log đếm/size không log hex; hoặc sửa shim
   theo §5 để thấy pull của typefind) — rồi đối chiếu với 2 MiB.
2. **Kiểm tra queue2 có mặt trong pipeline WebKit không**:
   chạy GST_DEBUG có `queue2:5` (hoặc `GST_DEBUG=*:2` + lọc tên
   element) trên probe live; nếu có queue2 thì thử đổi
   `max-size-bytes` (qua playbin `buffer-size` nếu pipeline
   dùng nó) và xem splice offset có dời theo không — đây là thí
   nghiệm phân biệt quyết định cho ứng viên queue2.
3. **C8 / clip ~3–4 MiB có splice**: chạy thêm run c8 (E và A)
   tới khi có ≥1 run bogus để xem offset có cố định 2097152
   không; hoặc clip tổng hợp cỡ 3 MiB (moov đầu, mdat lớn).
4. **Hit binary chưa xác định**: map 6 hit `0x200000` trong
   libgstreamer-1.0.so + 1 hit trong libgstisomp4.so (0x540ef)
   + kiểm tra libwebkitgtk-6.0.so.4.20.0 xem hàm nào chứa chúng.
5. **Mitigation khác** (vì blob-direct bị bác): (a) ép typefind
   nhận caps sớm bằng cách gán URI có đuôi `.mp4` cho blob
   (nếu WebKit/GStreamer cho phép — cần thử, có thể đổi đường
   scan về 1 lần đọc); (b) flush/reset cache typefind trước pull
   đầu (cần can thiệp pipeline, khó từ JS); (c) tránh refill
   Range cuối bằng cách để scan chạy trên dữ liệu đã fetch đủ
   (preload đầy đủ trước khi playbin seek).
