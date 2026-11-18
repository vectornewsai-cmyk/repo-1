# PHASE9 ROUND121 T7 — Bar F2 pha (a): chẩn đoán vì sao T_startup có chế độ chậm — CHẾ ĐỘ CHẬM KHÔNG TÁI HIỆN trên boot #63 (8/8 run nhanh); nguyên nhân GỐC vẫn CHƯA PHÂN ĐỊNH ĐƯỢC

- **Đợt:** 121, luồng T7. **Lượt cron:** 15:35 +07 16/11/2026.
- **Boot đo:** `#63?` (`725453a2-c8cb-44ba-a6f3-7222d0b2d00b`, btime 08:53:05Z) —
  KHÔNG phải boot #62 lúc mở đợt (`9788ce28`, 08:25:47Z) — xem §5.
  Mọi phép đo chạy trên boot #63 sau khi T5 chạy `--repair` (lần đầu
  luật replay-chết §8.2 chạy sống) và postboot PASS.
- **Cây:** `preview.tsx` md5 `5be5a250a552357c50cc189de9a9c08a` (H3f),
  `media.ts` md5 `2c384ed13703809d5e999311147745e7` — **không đổi
  trước/sau mọi run** (verify lúc mở driver 09:28Z + sau run cuối
  09:40Z). Không có patch production nào từ T7; mọi run đều probe-only.
- **Prereg:** `hidden_files/round121-t7/prereg-t7.md` — viết TRƯỚC mọi
  phép đo (08:45Z). Không có đính chính sau khi đo bắt đầu; chỉ có 2
  điều chỉnh ghi rõ ở §5–§6: (i) đo trên boot #63 thay vì #62 vì #62
  chết giữa chừng (reboot 08:53:05Z); (ii) analyzer sửa lỗi chia
  psiStallRate (÷10 → ÷10000, xem §6).

## 0. Kết luận — chế độ chậm do đâu?

| Hạng mục | Kết quả |
|---|---|
| Chế độ chậm 1,42–2,39 s (verdict đợt 120) | **KHÔNG TÁI HIỆN trên boot #63: 0/8 run.** T_startup (định nghĩa cũ, trộn 2 element) = 0,911/0,421/0,479/0,636/0,564/0,458/0,489/0,751 s (median 0,527; p90 0,799 tuyến tính / 0,911 nearest-rank) — tất cả < 1,2 s. T_startup thuần-blob (el2 loadstart→loadedmetadata) = 0,773/0,421/0,479/0,636/0,564/0,458/0,489/0,751 s (median 0,527; p90 0,758 / 0,773). |
| Pha (b) T_seek | **Vẫn ĐẠT:** 0,000–0,001 s ở 8/8 run (gộp 16/16 đợt 120 + 8/8 đợt này = 24/24 run SEEKFAST có T_seek ≤ 1 ms). |
| H1 — GST registry rescan (lạnh) | **KHÔNG ĐƯỢC ỦNG HỘ bởi dữ liệu mới.** Không có rescan/rebuild nào trong 8/8 run (registry mtime không đổi 06:58:21Z; cache đọc trong ~4 ms; typefind có mặt ở 0,004 s GST-time); run 1 — lần dùng media ĐẦU TIÊN trên boot #63 — chỉ 0,911 s, không vào dải chậm. Caveat: boot này cài GST bằng `--repair` với symlink debroot (file plugin có thể giữ mtime cũ → cache vẫn hợp lệ) — xem §3.1. |
| H2 — Cạnh tranh CPU (PSI) | **KHÔNG TƯƠNG QUAN trong dữ liệu mới.** Mọi hệ số Pearson với T_startup thuần đều \|r\| ≤ 0,23 (startup-window PSI cpu.some r = −0,226; stall rate r = −0,038; PSI cả run r = −0,103/0,049; threadsR r = −0,04) — dù PSI cpu.some duy trì CAO suốt cửa sổ đo (stall rate 16–33%). H2 dạng "tải cao → chậm" bị yếu đi: tải cao mà vẫn nhanh. Không loại trừ hẳn (PSI hệ thống quá thô; xem §3.2). |
| H3 — Blob fetch / page cache lạnh | **BỊ LOẠI.** Fetch c8.mp4 chỉ 70–289 ms, r = −0,057 với T_startup. Độ trễ nằm ở xử lý SAU fetch (videoFor→swap 483–755 ms), không phải fetch. |
| H4 — Decode frame đầu | **BỊ LOẠI khỏi nguyên nhân T_startup.** loadedmetadata→loadeddata/canplay = 0,000–0,001 s ở mọi run. rVFC KHÔNG ĐO ĐƯỢC (null 8/8 — WebKitGTK ở đây không bắn callback) — ghi là chưa đo, không phải 0. |
| H5 — Nhầm element http/blob | **XÁC NHẬN là nhiễu đo có thật, nhưng KHÔNG giải thích được chế độ chậm.** Chỉ run 1 có loadstart đầu thuộc el1 (http): T_startup trộn 0,911 vs thuần-blob 0,773 (chênh 0,138 s). Các run 2–8: loadstart đầu đã là el2 (blob) nên hai định nghĩa trùng nhau. Nhiễu tối đa ~0,14 s — nhỏ hơn nhiều so với dải chậm 1,42–2,39 s. |
| H6 — Giai đoạn thời gian / tuổi boot | **KHÔNG TƯƠNG QUAN:** r(T_startup, tuổi boot) = 0,01; r(T_startup, thứ tự run) = 0,011. |
| Độ trải còn lại trong dải nhanh (0,42–0,91 s, gấp 2,2×) | **CHƯA PHÂN ĐỊNH ĐƯỢC.** Không biến nào đo được giải thích nó (mọi \|r\| < 0,3 trừ wMem 0,56 không có ý nghĩa ở n=8). Dấu vết duy nhất: timestamp dòng registry CUỐI (reg_last) tương quan mạnh với T_startup (r = 0,889) — nhưng đó là đồng-đo của cùng một sự chậm hệ thống, không phải biến độc lập / nguyên nhân (xem §4). |
| Fix production / A/B | **KHÔNG CÓ.** Không tìm ra nguyên nhân → không có fix để đối chứng. Không sửa production. Chỉ có khuyến nghị cho parent ở §7. |

**Đọc đúng:** luồng này KHÔNG lật verdict F2 đợt 120 (verdict đứng trên
bộ 6 run đã đăng ký 119+120; bộ 8 run mới khác boot + GST cài bằng
repair — xem §7 mục 2). Nó chỉ chẩn đoán: trên boot #63 sau repair,
chế độ chậm không xuất hiện, và 4 trong 6 giả thuyết đã kiểm được đều
bị yếu đi hoặc loại trừ; nguyên nhân gốc của chế độ chậm 1,42–2,39 s
vẫn chưa rõ.

## 1. 8 run mới (F2STARTUP, boot #63, MSB4RB8, fresh-element, c8)

Cấu hình y hệt leg B T3-120: `J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size unset; shim
`l2_queue2_probe.so` md5 `b208e8de` (không biên dịch lại); Xvfb :194;
lock v2 `run-attempt t7-round121 8953 900 30 normal` mỗi run (nhả giữa
các attempt); wall 30 s; seekImmediate 16. **8/8 VALID** (shim readback
OK 4194304/8388608 cả 8; seekedOk; finalCt 32; finalSrc blob;
errEvents 0). Thời gian chạy 09:28:31–09:34:5xZ (boot 35,5–41,4' tuổi).

| run | T_startup trộn (s) | T_startup thuần-blob (s) | T_seek (s) | swapMs (ms) | fetch c8 (ms) | videoFor→swap (s) | swap→ls blob (s) | frames |
|---|---|---|---|---|---|---|---|---|
| 1 | 0,911 | 0,773 | 0,000 | 619 | 128 | 0,581 | −0,028* | 379 |
| 2 | 0,421 | 0,421 | 0,000 | 576 | 155 | 0,566 | 0,094 | 373 |
| 3 | 0,479 | 0,479 | 0,000 | 545 | 70 | 0,534 | 0,033 | 383 |
| 4 | 0,636 | 0,636 | 0,000 | 647 | 143 | 0,637 | 0,079 | 381 |
| 5 | 0,564 | 0,564 | 0,001 | 775 | 289 | 0,755 | 0,093 | 368 |
| 6 | 0,458 | 0,458 | 0,000 | 526 | 164 | 0,483 | 0,130 | 373 |
| 7 | 0,489 | 0,489 | 0,000 | 663 | 102 | 0,651 | 0,063 | 381 |
| 8 | 0,751 | 0,751 | 0,001 | 624 | 113 | 0,614 | 0,108 | 381 |

\* run 1: loadstart đầu thuộc el1 (http, 0,591 s) nên swap→loadstart
âm (−0,028 s) theo định nghĩa trộn; theo el2 thì swap→ls = 0,729−0,619
= +0,110 s. Chi tiết evs từng run xem `t7-analysis.txt`.

- **Phân phối (trộn):** median 0,527 s; p90 0,799 s (tuyến tính) /
  0,911 s (nearest-rank); min 0,421; max 0,911. **(Thuần-blob):**
  median 0,527 s; p90 0,758 s / 0,773 s. Cả hai cách đọc đều qua ngưỡng
  bar (a) median ≤1,0 s / p90 ≤1,2 s — NHƯNG xem §7 mục 2: bộ này không
  dùng để chấm lại verdict.
- **Không có run nào vào dải chậm** (>1,2 s). Độ trải 0,42–0,91 s là
  trải LIÊN TỤC, không lưỡng phân (khác hẳn dải 0,45 vs 1,42–2,39 s
  của bộ 6 đợt 120).
- **Run 1 chậm nhất** (0,911/0,773) — cũng là lần dùng media đầu tiên
  trên boot (xem §5) — nhưng run 8 (đã ấm) chậm thứ hai (0,751) nên
  không có hiệu ứng "run đầu chậm" sạch (r với thứ tự run = 0,011).
- **totalFrames 368–383** (so với 384 ở đợt 120): thấp hơn vài frame
  ở run 2/5 — khởi động chậm ăn vào thời gian phát trong wall 30 s;
  không phải tiêu chí hợp lệ (đã VALID theo prereg).

### Điều kiện từng run (sampler PSI 1 Hz, xem §2)

| run | PSI cpu.some mean/max (%) | stall rate cả run (%) | stall rate cửa sổ khởi động (~2 s đầu) (%) | PSI mem max (%) | PSI io mean/max (%) | threadsR max | RAM avail min (MB) |
|---|---|---|---|---|---|---|---|
| 1 | 23,05 / 44,37 | 26,75 | 12,84 | 1,29 | 3,78 / 6,44 | 15 | 1176 |
| 2 | 24,90 / 43,02 | 28,61 | 17,37 | 0,04 | 1,24 / 1,68 | 16 | 1130 |
| 3 | 14,85 / 23,27 | 16,26 | 14,52 | 0,32 | 2,97 / 12,53 | 11 | 970 |
| 4 | 25,09 / 42,95 | 29,84 | 13,72 | 1,33 | 20,44 / 21,53 | 14 | 779 |
| 5 | 29,34 / 48,96 | 32,06 | 31,27 | 0,99 | 5,81 / 16,91 | 13 | 1113 |
| 6 | 28,28 / 48,20 | 32,12 | 18,35 | 0,74 | 5,57 / 14,44 | 13 | 1025 |
| 7 | 28,98 / 48,54 | 32,74 | 30,33 | 0,88 | 2,11 / 4,30 | 14 | 905 |
| 8 | 23,38 / 39,60 | 26,49 | 27,88 | 1,67 | 1,01 / 1,44 | 12 | 777 |

- Máy TẢI NẶNG suốt cửa sổ đo (stall rate 16–33%, threadsR 11–16,
  RAM avail chỉ 777–1176 MB) — các luồng vòng 121 khác đang chạy
  (T1 driver, T3, T10 phase-1) — vậy mà T_startup vẫn ở dải nhanh.
- Run 4 có PSI io mean 20,44% (burst I/O) mà T_startup chỉ 0,636 s
  (giữa dải) — I/O burst không đẩy run vào dải chậm.

## 2. Phân rã phase — thời gian nằm ở đâu?

Phân rã trên 8 run (giờ page, t0 = bắt đầu evaluate):

- **Navigation/page load: ~0.** navTiming responseEnd 4–7 ms,
  domContentLoaded 10–43 ms. Bundle JS (fresh-element, 104.679 B)
  fetch 6 ms. Loại trừ.
- **videoFor→swap (blob sẵn): 0,483–0,755 s — phase LỚN NHẤT** (~55–
  65% thời gian từ videoFor tới loadedmetadata). Trong đó fetch mạng
  chỉ 0,070–0,289 s; phần còn lại (~0,35–0,55 s) là xử lý sau-fetch
  trên main thread (arrayBuffer → Blob → createObjectURL → videoFor
  trả element mới + vòng poll 10 ms). Phase này biến thiên nhiều nhất
  giữa các run nhưng không tương quan với fetch (r = −0,06) hay PSI.
- **swap→loadstart (blob): 0,033–0,130 s** (run 1 tính theo el2:
  0,110 s). Nhỏ, ổn định tương đối.
- **loadstart→loadedmetadata (thuần-blob): 0,421–0,773 s.** Bên trong
  cửa sổ này, GST cho thấy: cache đọc xong ở 0,004 s; typefind có mặt
  ở 0,004–0,005 s; qtdemux đầu ở 0,217–0,332 s (GST-time); còn lại
  ~0,2–0,5 s là demux + fill buffer + decode setup trước khi
  loadedmetadata bắn (loadedmetadata/loadeddata/canplay/seeked bắn
  cùng 1 quantum 10 ms ở mọi run — xem evs).
- **loadedmetadata→loadeddata/canplay: 0,000–0,001 s.** H4 bị loại.
- **seeking→seeked: 0,000–0,001 s.** Pha (b) ĐẠT.

### Tương quan Pearson với T_startup thuần-blob (n=8)

| Biến | r | Đọc |
|---|---|---|
| swapMs | 0,294 | yếu |
| fetch c8 duration | −0,057 | không |
| videoFor→swap | 0,259 | yếu |
| PSI cpu.some cửa sổ khởi động (mean 3 mẫu đầu) | −0,226 | không |
| Stall rate cửa sổ khởi động | −0,038 | không |
| PSI mem cửa sổ khởi động | 0,560 | vừa nhưng KHÔNG có ý nghĩa ở n=8 (p > 0,15) và giá trị tuyệt đối nhỏ (0,01–0,40%) — không dùng |
| PSI io cửa sổ khởi động | 0,043 | không |
| PSI cpu.some cả run (mean / max) | −0,103 / 0,049 | không |
| threadsR max | −0,040 | không |
| Tuổi boot | 0,010 | không |
| Thứ tự run | 0,011 | không |
| **Timestamp dòng registry CUỐI (reg_last)** | **0,889** | mạnh — NHƯNG là đồng-đo, không phải nguyên nhân (xem §4) |

Caveat thống kê: n=8 nhỏ; |r| < 0,7 ở n=8 không đạt ý nghĩa 5%.
Chỉ reg_last (0,889, p ≈ 0,003) đạt ý nghĩa — và nó KHÔNG phải biến
độc lập.

## 3. Đánh giá từng giả thuyết

### 3.1 H1 — GST registry rescan: KHÔNG ĐƯỢC ỦNG HỘ (dữ liệu mới)

Bằng chứng trực tiếp từ 8 run trên boot #63:
- **Không có rebuild nào:** registry mtime KHÔNG ĐỔI trong cả 8 run
  (06:58:21Z trước run 1 = sau run 8); `gstRegChanged=false` 8/8.
- **Cache đọc trong ~4 ms:** dòng GST `ensure_current_registry:
  reading registry cache` ở GST t=0,0036 s; typefind đầu ở 0,004 s.
  Pipeline bắt đầu NGAY, không chờ scan.
- **Scan `--gst-plugin-path` chạy ĐỒNG THỜI, không chặn pipeline:**
  scan bắt đầu ở GST t=0,318–0,465 s (SAU khi typefind đã có mặt) và
  kéo tới reg_last 0,914–1,289 s; nó là hệ quả của việc runner set
  `GST_PLUGIN_PATH` (harness bắt buộc — thiếu thì WebProcess crash,
  theo ghi chú J2), xảy ra Ở MỌI RUN (14.040 dòng registry giống nhau
  cả 8 run), nên không giải thích được biến thiên giữa các run.
- **Run 1 = lần dùng media đầu tiên trên boot** (0 log GST của luồng
  sibling nào trước 09:28:31Z; T3 còn đang chờ gate ở 09:29:39Z;
  registry mtime không đổi) mà chỉ 0,911 s — KHÔNG vào dải chậm.
  Dự báo mạnh nhất của H1 ("lần đầu sau boot sẽ chậm") không xảy ra.
- **Caveat quan trọng (không giấu):** boot #63 cài GST bằng `--repair`
  của T5, và script repair làm symlink plugin TRƯỚC khi apt install
  (ngược chữ luật §8.2 — T5 đã ghi rõ): `/usr/lib/x86_64-linux-gnu/
  gstreamer-1.0` hiện là symlink tới
  `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/
  gstreamer-1.0` (269 file). File plugin có thể giữ mtime cũ từ
  debroot → cache registry từ boot #61 vẫn HỢP LỆ → không rescan.
  Trên một boot mà replay cài plugin MỚI (mtime mới) thì cache sẽ mất
  hiệu lực và rescan CÓ THỂ xảy ra — dữ liệu đợt này KHÔNG loại trừ
  được trường hợp đó. H1 chỉ bị yếu đi trong bối cảnh repair-symlink,
  không bị bác tuyệt đối.

### 3.2 H2 — Cạnh tranh CPU: KHÔNG TƯƠNG QUAN (dữ liệu mới)

- Startup-window PSI cpu.some (mean 3 mẫu đầu, ~0–2 s): 4,97–9,84%;
  stall rate cửa sổ: 12,84–31,27% — đều KHÔNG tương quan với T_startup
  (r = −0,226 / −0,038). Run 5 có stall rate cửa sổ cao nhất (31,27%)
  mà T_startup chỉ 0,564 s; run 1 có stall rate thấp nhất (12,84%) mà
  chậm nhất (0,773 s thuần).
- PSI cả run cũng không tương quan (r ≈ −0,10 / 0,05) dù stall rate
  16–33% suốt — tải cao mà vẫn nhanh. Muốn H2 giải thích được dải
  chậm 1,42–2,39 s thì các run chậm phải chịu tải TỆ HƠN NHIỀU so với
  bất cứ thứ gì quan sát được ở đây — không có bằng chứng.
- **Không loại trừ hẳn:** PSI là chỉ số HỆ THỐNG (1 Hz, avg10 trượt
  10 s) — quá thô để bắt một spike 2 s, và không đo được CPU time
  riêng của WebProcess. Cần instrument sắc hơn (xem §7 mục 3) trước
  khi bác H2 hoàn toàn.

### 3.3 H3 — Blob fetch: BỊ LOẠI

Fetch 70–289 ms, r = −0,057. Run 5 fetch lâu nhất (289 ms) nhưng
T_startup giữa dải (0,564 s); run 1 fetch 128 ms nhưng chậm nhất.
Độ trễ nằm ở xử lý sau-fetch trên main thread (videoFor→swap
0,483–0,755 s), không phải mạng/đĩa khi fetch.

### 3.4 H4 — Decode frame đầu: BỊ LOẠI

loadedmetadata→loadeddata/canplay = 0,000–0,001 s mọi run. rVFC không
đo được (null 8/8) — WebKitGTK ở đây không bắn
`requestVideoFrameCallback` (hoặc không kịp trước khi evaluate kết
thúc); ghi là CHƯA ĐO, không tuyên bố 0 ms.

### 3.5 H5 — Nhầm element: XÁC NHẬN là nhiễu đo, KHÔNG phải nguyên nhân

Bằng chứng per-element (mới, chỉ đợt này mới có vì evs cũ không gắn
tag element):
- Run 1: loadstart đầu = el1 http (0,591 s); loadedmetadata đầu = el2
  blob (1,502 s) → T trộn 0,911 s vs thuần-blob 0,773 s (chênh 0,138 s).
- Run 2–8: loadstart đầu ĐÃ LÀ el2 blob → hai định nghĩa trùng nhau.
- Dữ liệu cũ khớp: đợt 120 r1 (ls http 0,14 → lm blob 0,59; trộn
  0,45 vs thuần 0,41). Nhiễu tối đa ~0,14 s — không thể tạo ra dải
  chậm 1,42–2,39 s (trong đó T thuần-blob vẫn 1,3–4,3 s, xem prior).

### 3.6 H6 — Tuổi boot / giai đoạn thời gian: KHÔNG TƯƠNG QUAN

r = 0,01 (tuổi boot 2129–2486 s) và 0,011 (thứ tự run). Chế độ chậm
không xuất hiện ở bất kỳ tuổi boot nào trong cửa sổ 09:28–09:35Z.

### 3.7 Prior từ dữ liệu cũ (phân tích lại bằng analyzer 121t7)

Xem `hidden_files/round121-t7/prior-olddata-analysis.txt` (viết trước
khi có run mới):
- Các run CHẬM cũ (119: 1,42/1,98/2,39 s; 118: 2,30–4,41 s) chậm ở
  CẢ HAI phase: fetch/swap (0,6–1,8 s vs 0,17–0,30 s nhanh) VÀ
  pipeline swap→loadedmetadata (1,3–4,3 s vs 0,30–0,63 s nhanh).
  Chậm đồng đều mọi phase ⇒ yếu tố hệ thống, không phải một bước
  pipeline đơn lẻ.
- GST log cũ: hoạt động GST đầu tiên ở 0,31–0,50 s (chậm) vs
  0,06–0,12 s (nhanh); gap typefind→qtdemux ~0,79 s (chậm) vs ~0,24 s
  (nhanh). Phù hợp cả H1 lẫn H2 — không phân biệt được từ log cũ
  (không bật category gstregistry).
- Dữ liệu mới (mục 3.1–3.2) làm yếu cả hai — nhưng trên boot repair,
  không phải boot replay-sạch.

## 4. Dấu vết duy nhất còn lại: reg_last (r = 0,889)

Timestamp dòng registry CUỐI trong GST log mỗi run: 1,289 / 0,955 /
0,914 / 1,165 / 1,222 / 0,951 / 1,039 / 1,213 s — tương quan Pearson
0,889 với T_startup thuần-blob. Đọc ĐÚNG:
- Đây là **đồng-đo** (co-measurement), không phải nguyên nhân: 14.040
  dòng registry (đọc cache + scan path) rải suốt cửa sổ khởi động;
  dòng cuối xuất hiện muộn khi WebProcess chậm — tức reg_last đo cùng
  một "sự chậm hệ thống" mà T_startup đo. Nó KHÔNG phải biến độc lập.
- Nó củng cố bức tranh "chậm đồng đều mọi thứ" (prior §3.7) hơn là
  chỉ ra một bước cụ thể: khi WebProcess chậm, MỌI timestamp trong
  log của nó đều trễ — fetch-callback, typefind, qtdemux, registry,
  loadedmetadata.
- **Không dùng reg_last để chấm hay void run.** Muốn biến nó thành
  bằng chứng nhân quả cần A/B tắt scan (không làm được trong harness
  hiện tại — thiếu `GST_PLUGIN_PATH` thì WebProcess crash) hoặc đo
  CPU time riêng của WebProcess trong cửa sổ khởi động (xem §7).

## 5. Hạ tầng: boot #62 chết, repair #63, gate

- **Boot #62 (9788ce28, 08:25:47Z) chết:** reboot 08:53:05Z sang boot
  `#63?` (725453a2, gap danh nghĩa 1638 s = 27'18"). Gate poll #2 của
  T7 ĐẠT lúc 08:53:32Z CHO BOOT #62 (postboot PASS, apt im) — nhưng
  boot đã chết nên gate đó BỎ, không dùng. Gate-waiter khởi động lại
  cho boot #63 (poll #1–#17, 08:55–09:27Z). Không mất dữ liệu đo nào
  (0 lượt đo trên #62).
- **Replay #63 chết (dạng B "chạm mà không cài"):** dpkg.log chỉ 2
  dòng `startup packages configure` @08:53:53Z, im 18'30" (tới
  09:12:23Z); 0 process apt-get/dpkg/wrapper (T7 quét /proc độc lập
  09:08Z + T5 điều tra 09:08:52Z đều 0 — cờ wrapper=yes của watcher T5
  là dương tính giả do `pgrep -f` tự khớp cmdline của chính lệnh kiểm
  tra, cùng lớp lỗi như đếm apt bằng grep-ps ở boot #60); lock dpkg
  rảnh; /var/lib/apt/lists trống; mạng tới archive.ubuntu.com vẫn
  thông. Wrapper chết trong khoảng (09:07:48Z, 09:08:48Z] mà không bao
  giờ chạy apt-get update.
- **Repair (T5, không phải T7):** T5 kích hoạt `--repair` MỘT LẦN có
  giám sát lúc 09:14:14Z theo luật replay-chết §8.2 (đủ 5/5 điều kiện,
  ghi trước trong `REPAIR_TRIGGERED`; lần đầu luật chạy sống). apt-get
  update ~09:14–09:25Z, install 11 gói ~09:25–09:27Z (dpkg.log 2→759
  dòng). **Caveat thứ tự script** (T5 đã ghi): symlink GST → debroot
  chạy TRƯỚC apt install, ngược chữ luật ("symlink chỉ khi apt thất
  bại") — hệ quả: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là symlink
  tới debroot, không phải thư mục hệ thống thật; postboot PASS sau
  repair phải đọc kèm caveat này.
- **Gate ĐẠT cho boot #63 ở poll #17, 09:27:51Z** (check-only riêng
  exit 0 + apt/dpkg im + preview md5 5be5a250); T5 ghi `POSTBOOT_PASS`
  ("PASS nhờ repair"). Driver chạy 09:28:28Z. Không reboot nào trong
  lúc đo (uptime -s không đổi 08:53:05Z từ driver tới kiểm cuối
  09:40Z).
- **Run 1 = lần dùng media đầu tiên trên boot #63:** 0 log GST của
  luồng sibling nào trước 09:28:31Z; T3 còn đang chờ gate ở 09:29:39Z
  (poll #18, t7flag=chua-co); registry mtime không đổi. Có 1 process
  webkit tồn tại trước run 1 (driver ghi nhận, chưa xác định danh
  tính — không có bằng chứng media nào từ nó: không log GST, không
  đổi registry; khả năng cao là env-probe browser của luồng khác).

## 6. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-t7.md` 08:45Z (trước mọi đo). 6 giả
  thuyết + phương pháp đăng ký trước. Phân tích dữ liệu cũ (prior
  §3.7) là thêm trước khi có run mới, ghi rõ là prior, không phải run
  đăng ký — nó không đổi bất kỳ verdict nào, chỉ làm sắc giả thuyết.
- **Runner mới** `benchmarks/render/f2_startup_probe_121t7.mjs` (copy
  120t3 + instrumentation: tag per-element, marks, nav/resource
  timing, sampler PSI 1 Hz cpu+mem+io, registry mtime trước/sau;
  PORT 8953; Xvfb :194; `node --check` OK). **Analyzer mới**
  `benchmarks/render/f2_startup_analyze_121t7.py` (copy 120t3 + phân
  rã phase + PSI + GST log). Cả hai validate TRƯỚC khi đo trên dữ
  liệu đợt 120: T_startup tái hiện đúng 0,45/0,49/0,45 s, T_seek 0,00 s.
- **Lỗi analyzer đã sửa giữa chừng (ghi rõ):** `psiStallRate_pct`
  tính sai ÷10 thay vì ÷10000 (total của /proc/pressure tính bằng
  micro-giây) → số cũ 26.747% v.v. đã đính chính thành 26,75% v.v.
  trong bản analysis chạy lại 09:36Z. Các giá trị avg10/max đọc trực
  tiếp từ /proc nên không ảnh hưởng. Lỗi này chỉ nằm trong analyzer
  của T7, không chạm dữ liệu thô (psiSamples trong JSON là số thô).
- **Lỗi driver (ghi rõ):** điều kiện dừng sớm so sánh chuỗi
  `"6 TOTAL"` (do `check-valid-t7.py` in `VALID_COUNT=6 TOTAL=6`)
  nên không dừng ở 6 VALID mà chạy hết 8 attempt. Kết quả 8/8 VALID,
  trong ngân sách tối đa 8 attempt của prereg — không hại, chỉ thừa
  2 run. Đã ghi để luồng sau sửa format check (chỉ in số).
- **Lưu ý an toàn:** trong lúc làm, một lần đọc file cờ/log của luồng
  sibling (T5) bị hệ thống gắn cảnh báo kiểm tra prompt-injection;
  T7 không làm gì theo nội dung đó (không cài/fetch/chạy gì thêm) —
  hướng đi đã định sẵn trong prereg. Mọi hành động apt/repair trong
  đợt này là của T5 theo luật đã duyệt, không phải của T7.
- **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, production
  code, binary vào batch, apt/dpkg/--repair (của T5).
- **Thời gian:** slot cron 08:35–10:45Z; prereg 08:45Z; chờ gate
  08:51–09:27Z (gồm reboot + replay chết + repair); driver
  09:28:28–09:34:5xZ (8 run); analysis + LIMITS xong ~09:5xZ. Còn dư
  thời gian slot nhưng mọi hạng mục đã xong.

## 7. Nợ mở + khuyến nghị (cho parent quyết — T7 không tự quyết)

1. **Không có fix production từ luồng này** (không tìm ra nguyên nhân
   → không có gì để A/B). Nếu parent muốn tiếp tục săn chế độ chậm:
   cần instrument sắc hơn — CPU time RIÊNG của WebProcess trong cửa
   sổ khởi động (vd sample `/proc/<pid>/stat` utime+stime 100 ms,
   hoặc `pidstat`), + disk-read bytes của WebProcess — vì PSI hệ
   thống đã chứng minh quá thô (tương quan ≈ 0 dù stall 16–33%).
2. **Bar F2 (a): KHÔNG chấm lại verdict trong luồng này.** Bộ 8 run
   mới (median 0,53 / p90 ~0,76–0,80) qua ngưỡng (a) — nhưng khác
   boot + GST cài bằng repair-symlink, nên KHÔNG tự động lật verdict
   "KHÔNG ĐẠT — chế độ chậm" của đợt 120 (bộ 6 đã đăng ký). Parent
   chọn một trong: (i) giữ verdict, chờ bộ 6 mới trên boot
   replay-sạch; (ii) chấp nhận bộ 8 này làm cơ sở xem xét lại (ghi rõ
   caveat repair); (iii) đổi định nghĩa pha (a) sang T_startup
   thuần-blob (el2) — loại nhiễu trộn element ~0,14 s (xem mục 3).
3. **Đề xuất đổi định nghĩa pha (a) sang thuần-blob** (loadstart của
   element blob → loadedmetadata của nó): dữ liệu per-element mới
   chứng minh định nghĩa hiện tại trộn 2 element (run 1 chênh 0,138 s).
   Đây là thay đổi ĐỊNH NGHĨA BAR, cần parent quyết — T7 không tự đổi.
4. **GST_PLUGIN_PATH scan:** mọi run đều trả chi phí scan path (14.040
   dòng log, span ~1 s GST-time) vì harness bắt buộc set biến này.
   Muốn tách ảnh hưởng của scan cần WebKit chạy được khi không set
   biến (hiện crash) — không làm trong đợt này.
5. **Watcher T5:** cờ wrapper=yes là dương tính giả (`pgrep -f` tự
   khớp cmdline lệnh kiểm tra) — đề xuất T5 kiểm wrapper bằng file
   script (không qua pgrep -f chuỗi pattern) ở các đợt sau. T7 đã ghi
   phát hiện này vào `t7-progress.md` 09:08Z; T5 sau đó tự xác nhận
   độc lập (t5-wrapper-investigation.md) và watcher đã sửa thành
   wrapper=no từ poll 12.
6. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user
   quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức).
   Xem LIMITS gộp đợt 120 §12.

## 8. File và dữ liệu

- Runner T7: `benchmarks/render/f2_startup_probe_121t7.mjs`
  (~80 KB — **>37.768 B, cần `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T7: `benchmarks/render/f2_startup_analyze_121t7.py`.
- LIMITS này: `docs/PHASE9_ROUND121_T7_F2STARTUP_LIMITS.md`.
- OUT JSON (KHÔNG stage, theo lệ `benchmarks/results/`):
  `webkit-blob-flaky-121t7-f2startup.json` (8 case).
- Dữ liệu thô + prereg + driver + gate-waiter + log (KHÔNG stage):
  `hidden_files/round121-t7/` (`prereg-t7.md`, `run-t7-gatewait.sh`,
  `run-t7-all.sh`, `check-valid-t7.py`, `vcut-vite-lock-v2.frozen.sh`
  md5 cd0c05c1, `t7-progress.md`, `prior-olddata-analysis.txt`,
  `gate0-wait-t7.log`, `postboot-t7-*.log`, `t7-driver.out`,
  `t7-run-*.log`, `t7-analysis.txt`, `gst/` (8 log, ~2,9 MB mỗi log),
  `pull/` (8 log), `bundle/`, `dot/`, `http-access.log`,
  `xvfb-194.log`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round121-t7-f2startup.txt`
  (NUL-delimited; 3 entry: runner T7, analyzer T7, LIMITS này).
