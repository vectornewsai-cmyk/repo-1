# Phase 9 đợt 97 — Y1: tách biến cơ chế blob 2 MiB — LOGGING NẶNG ỨC CHẾ BOGUS, TẢI VÔ TỘI

**Nợ gốc:** LIMITS gộp đợt 96 §4 mục 1 — test tách biến (ƯU TIÊN):
chạy probe NẶNG của X1 trong cửa sổ yên, hoặc probe nhẹ kiểu W1 trong
cửa sổ yên, để tách hai biến còn lại sau X1/X1b (GST nặng vs tải nặng).
**Ngày:** 2026-11-12 (lượt cron 18:35 +07; Y1 đo 11:38–11:55Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không sửa code
production (`src/` không đổi; `media.ts` sha trước/sau đo y hệt
`809bd3db…`). Không đụng TTS 39, birefnet, không đụng
`.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐIỀU TRA XONG — KẾT LUẬN ĐƯỢC PHẦN TÁCH BIẾN, CƠ CHẾ
ĐÃ THU HẸP.** Logging GST nặng là yếu tố ức chế bogus; tải không phải.
Cơ chế "pull bắt đầu ở 2 MiB" được sửa thành "pull bị nhảy +2 MiB
trong vài atom đầu" (bằng chứng §4). Handoff push→pull vẫn là ứng viên
duy nhất, nhưng vị trí chính xác của lỗi vẫn chưa xác định được.

## 0. Thiết kế + môi trường

- **Boot:** d8dc09fe (reboot #19, 11:30Z), xác minh bằng `boot_id` +
  `who -b` trước khi đo; không reboot trong lúc đo; uptime 7 phút lúc
  bắt đầu lượt (a). Không có `round-in-progress.md` (chốt chặn qua).
- **Hai lượt đo, thứ tự (a) rồi (b):**
  - **(a) W1-light** — copy y nguyên probe X1b
    (`webkit_blob_flaky_97y1_w1light.mjs`, GST nhẹ
    `playbin:5,uridecodebin:5,qtdemux:5,decodebin:5,avidemux:5`,
    MATRIXFS c2/c8 × 6 run blob+prog = 24 case, port 8901), 11:38–
    11:45Z, Xvfb :195 (claim/release qua lock, không mồ côi).
  - **(b) X1-matrix + GST nhẹ** — copy probe X1
    (`webkit_blob_flaky_97y1_x1lightgst.mjs`, MATRIX96X1 c1/c2/c8 ×
    6 run blob+prog = 36 case, port 8902) NHƯNG GST giảm xuống đúng
    chuỗi nhẹ W1 (chỉ `qtdemux:5`; bỏ `webkitwebsrc:6`/`basesrc:5`/
    `souphttpsrc:5`/`queue:5`/`typefind:5`, `qtdemux:6`→`5`),
    11:45–11:55Z, Xvfb :194. Khác X1 gốc chỉ ở logging (+ tải cửa
    sổ); khác (a) chỉ ở matrix (thêm c1, tên case `-y1b-`).
- **Cửa sổ "yên" chỉ yên tương đối — ghi rõ:** lúc bắt đầu lượt (a),
  loadavg 4,70 (luồng Y6 đã chạy probe chromium + vite :5590; các
  luồng Y khác đang khởi động). Trong lúc đo, tải dao động mạnh theo
  từng case (load1 0,88–17,85, ghi theo từng case trong JSON):
  (a) nửa đầu yên (0,88–4,55), 3 case cuối nặng (13,22–17,85);
  (b) xen kẽ (5 case load1 < 3, 13 case load1 ≥ 3, max 17,62).
  Phân tích theo band tải ở §2–§3; **không được trích "cửa sổ yên"
  như một khối đồng nhất.**
- **Clip:** `~/workspace/round96-x1/clips-faststart/` (c1 1.138.750 B,
  c2 2.139.973 B, c8 8.182.985 B; sha256 y hệt X1/X1b).
  4 byte tại offset 2 MiB đã verify lại trực tiếp: c2 `0x204286c4` =
  541230788, c8 `0xb2544b0b` = 2991868683 (khớp đúng giá trị bogus
  cổ điển).
- **Kích thước log GST chứng minh biến logging là thật:** log (a)/(b)
  76–370 KB/run (tổng 2,4 MB / 4,4 MB) — cùng cỡ W1/X1b; log X1 gốc
  1–6 MB/run (tổng ~10×). Biến "logging" trong đợt này khác nhau một
  bậc độ lớn, không phải khác tên gọi.

## 1. Kết quả — bogus trở lại ở cả hai lượt

| Lượt | Blob strict | Blob loose (frames > 0) | Prog | Log blob có bogus |
|---|---|---|---|---|
| (a) W1-light, 12 blob | **2/12** (c2 1/6, c8 1/6) | **7/12** | 12/12 | **10/12** (c2 4/6, c8 6/6) |
| (b) X1-matrix + GST nhẹ, 18 blob | **7/18** (c1 6/6, c2 0/6, c8 1/6) | **18/18** | 18/18 | **8/18** (c1 0/6, c2 3/6, c8 5/6) |
| So sánh: X1b (nhẹ, yên) | 3/12 | 11/12 | 12/12 | 8/12 |
| So sánh: X1 (nặng, tải nặng) | 17/18 | 18/18 | 18/18 | **0/18** |

- **(a) lặp lại X1b trong boot mới:** bogus 10/12 (so với X1b 8/12,
  W1 9/12) — hiện tượng ổn định qua 3 boot (#17 W1, #18 X1b,
  #19 Y1a), không phải may mắn một cửa sổ. Strict 2/12 (X1b 3/12,
  W1 4/12) — cùng bậc, chênh lệch trong nhiễu n nhỏ.
- **(b) là lượt quyết định:** cùng matrix với X1, tải trong lúc đo
  phần lớn NẶNG (13/18 case load1 ≥ 3, max 17,62 — ngang X1 với
  loadavg tới 15,67), chỉ khác logging nhẹ đi — bogus về 8/18
  (c2+c8: 8/12 = 67%, đúng tỉ lệ các lượt nhẹ trước). **Nếu tải là
  yếu tố ức chế thì (b) đã phải 0 bogus như X1; nó không phải.**
- **Đối chứng c1 (< 2 MiB) lần đầu có hiệu lực:** (b) c1 bogus 0/6,
  strict 6/6, trong khi c2 3/6 và c8 5/6 bogus. Ở X1, đối chứng này
  vô hiệu vì c2/c8 cũng 0 bogus; nay c1 sạch / c2+c8 bẩn đúng như
  thiết kế — ủng hộ ngưỡng 2 MiB là có thật (xem §4 về cơ chế).
- **Fail⇒bogus gộp toàn lịch sử:** V3 24/24 + W1 7/8 + X1 0/1 +
  X1b 8/9 + Y1a 9/10 + Y1b 8/11 = **56/63 = 89%** (trước Y1:
  39/42 = 93%; Y1 thêm 17/21).
- **Loose 18/18 ở (b), 0 stall-timeout:** mọi fail ở (b) đều là
  error-event (11/11) và đều được cứu tới frames > 0 (31–164
  frame, ct tới 8 s) — bằng chứng thứ ba cho retry-play W2+X3
  (sau X1b 8/9, X1 1/1). Ở (a), loose chỉ 7/12 vì 4 stall-timeout
  0 frame (c2-run1, c8-run3/4/6) — dạng fail thầm không error event
  nên không mitigation nào kích được (nợ X1 §8 mục 4, vẫn mở).
  (a) vs (b) khác nhau ở tỉ lệ stall-timeout (4/12 vs 0/18) mà
  không có biến nào giải thích được chắc chắn (matrix? thứ tự
  clip c1 chạy trước làm ấm pipeline? tải?) — ghi là quan sát,
  không claim.

## 2. Verdict tách biến: LOGGING NẶNG ỨC CHẾ, TẢI VÔ TỘI

- **Logging nặng là yếu tố ức chế (kết luận):** X1 (GST nặng) 0/18
  log blob có bogus; Y1(b) (cùng matrix, GST nhẹ) 8/18 — cùng một
  matrix, cùng dải tải nặng, chỉ đổi logging. Không còn biến nào
  khác phân biệt hai lượt này ở mức hệ thống (cùng clip, cùng
  bundle build từ `media.ts` không đổi, cùng probe trừ chuỗi GST).
- **Tải không ức chế bogus (kết luận, từ phân tầng trong lượt):**
  - (a): band load1 < 3: bogus 5/6 log; band load1 ≥ 3: bogus 5/6
    log — bằng nhau tuyệt đối. Strict thì tệ hơn khi tải nặng
    (0/6 vs 2/6) nhưng đó là tỉ lệ cứu/fallback, không phải tỉ lệ
    bogus.
  - (b): band load1 < 3: bogus 3/5; band load1 ≥ 3: bogus 5/13 —
    bogus vẫn xuất hiện dày dưới tải nặng (tới 17,62). Nếu tải ức
    chế thì band nặng đã phải sạch.
  - Caveat: phân tầng (b) bị nhiễu theo clip (5 case load1 < 3
    toàn là c2; 6 case c1 toàn load1 ≥ 3 và toàn pass). Phân tầng
    theo clip mới là đọc đúng: c1 0/6 bogus mọi tải; c2 3/6; c8 5/6.
- **Hệ quả phương pháp (khẳng định lại bài học X1 §7.2, nay có
  bằng chứng tách biến):** đo tỉ lệ bogus/pass BẮT BUỘC dùng probe
  nhẹ; mọi số liệu X1 gốc về bogus (0/36) phải đọc kèm caveat
  "đo bằng GST nặng nên hiện tượng bị ức chế" — không được trích
  0/36 như tỉ lệ thật. Ngược lại, số liệu X1 về đường blob
  (webkitwebsrc, range read, seek EOF−32/−128) vẫn đứng vì đó là
  quan sát cấu trúc, không phải tỉ lệ hiện tượng.

## 3. Phân loại fail — hai mode vẫn đứng, thêm pass-có-bogus

| Mode | (a) | (b) | Dấu hiệu |
|---|---|---|---|
| Bogus (atom đầu/giữa sai) | 9/10 fail | 8/11 fail | `bogus size` + `no playable streams` |
| Flow-error (parse đúng rồi interr) | 1/10 fail (c2-run3: parse đủ ftyp/moov/free/mdat, 0 bogus, 127 frame qua fallback) | 3/11 fail (c2-run3/4/6: parse đúng, interr 1–2×, 51–72 frame qua fallback) | parse đúng + `Internal data stream error`, không bogus |
| Stall thầm (không error event) | 4/12 blob (0 frame) | 0/18 | `play-timeout-10s`, GST log chỉ 13–103 KB |
| **Pass nhưng log có bogus** | **1/2 pass** (c8-run1: bogus ở instance #1, 71 frame) | 0/7 pass | bogus kill instance đầu, pipeline fallback cứu |

- **Đính chính X1b §7.1:** "trong cửa sổ này bogus ⇔ fail là
  tuyệt đối cả hai chiều" KHÔNG còn đúng — Y1(a) c8-run1 pass
  strict (71 frame, ct 7,667) dù log có bogus 2991868683 ở
  `qtdemux1` (reset 1,271 s → bogus 1,273 s → `no playable
  streams`, rồi `qtdemux2` reset 1,566 s chơi tới hết). Bogus
  giết MỘT pipeline instance; case chỉ fail khi mọi instance đều
  chết hoặc không có fallback kịp. "Bogus trong log" ≠ "case fail"
  — tỉ lệ bogus-log và tỉ lệ fail là hai số khác nhau, phải báo
  riêng (đợt này: (a) 10/12 log vs 10/12 fail strict — trùng số
  nhưng khác tập hợp 1 case; (b) 8/18 log vs 11/18 fail strict).
- Flow-error vẫn là mode thứ hai độc lập, tồn tại ở cả hai lượt
  (tổng 4/21 fail), khớp X1 §3 / X1b run3.

## 4. Cơ chế — PHÁT HIỆN MỚI: vị trí đọc nhảy +2 MiB, không nhất thiết ở atom đầu

Đây là đóng góp mới của Y1 so với mọi lượt trước (W1/X1/X1b chỉ
thấy bogus ở lần đọc atom ĐẦU TIÊN).

### 4.1 Ba vị trí nhảy, cùng một độ lớn +2097152

| Case | Atom đọc sai | Giá trị bogus | Byte đó nằm ở offset nào trong file (duy nhất) |
|---|---|---|---|
| Cổ điển (mọi lượt trước + Y1a run1/run5, mọi c8) | atom 1 (đáng ra offset 0) | c2 541230788 / c8 2991868683 | đúng 2 MiB + 0 |
| **Y1a c2-run2** | atom 2 (đáng ra offset 32 = moov) | **2854668610** (`0xaa26c942`) | **2097184 = 2 MiB + 32** (chỉ xuất hiện 1 lần trong file) |
| **Y1a c2-run6, `qtdemux1`** | atom 3 (đáng ra offset 3163 = free) | **162705492** (`0x09b2b054`) | **2100315 = 2 MiB + 3163** (chỉ xuất hiện 1 lần trong file) |

- Chuỗi log run2: `ftyp` đọc ĐÚNG (length `0x00000020`,
  0,344 s) → atom tiếp theo nhận `0xaa26c942` (0,344 s) → bogus
  2854668610 → `no playable streams`. Chuỗi run6-qtdemux1: `ftyp`
  đúng → `moov` đúng (`0x00000c3b`) → atom tiếp theo nhận
  `0x09b2b054` → bogus 162705492.
- **Diễn giải:** vị trí đọc của pull bị nhảy đúng +2097152 byte
  tại một thời điểm ngẫu nhiên trong vài atom đầu của quá trình
  pull; trước điểm nhảy, các atom đọc đúng; sau điểm nhảy, mọi
  byte đều lệch +2 MiB so với vị trí qtdemux tưởng. Công thức
  "pull bắt đầu ở 2 MiB" trong X1 LIMITS §6 là TRƯỜNG HỢP RIÊNG
  (nhảy xảy ra trước atom 1); dạng tổng quát là **nhảy +2 MiB
  trong cửa sổ pull ban đầu**.
- Hai giá trị bogus mới (2854668610, 162705492) là bằng chứng độc
  lập cho diễn giải này: chúng KHÔNG phải 4 byte tại 2 MiB, mà là
  4 byte tại (2 MiB + vị trí atom đúng) — khớp chính xác tới từng
  byte, mỗi giá trị chỉ xuất hiện đúng 1 lần trong toàn bộ file.
  Không thể là trùng hợp (xác suất 2 giá trị 32-bit cùng khớp
  offset +2097152 là không đáng kể).

### 4.2 Điều này nói gì về handoff push→pull

- Ứng viên còn lại duy nhất vẫn là handoff push→pull (typefind
  tiêu thụ dữ liệu ở push-mode trước khi qtdemux kích hoạt pull),
  nhưng Y1 thu hẹp nó thêm một nấc: lỗi KHÔNG phải "qtdemux pull
  từ offset sai ngay từ đầu" (vì atom 1–2 vẫn đúng), mà là
  **một lần nhảy vị trí +2 MiB xảy ra giữa chừng trong lúc pull
  ban đầu** — giống như bộ đệm/adapter bị tua thêm đúng một
  "cửa sổ" 2 MiB tại một thời điểm đua nào đó (ví dụ: typefind
  kết thúc push-mode và giải phóng/đẩy 2 MiB đã đệm; hoặc
  webkitwebsrc giao chunk 2 MiB thứ hai và vị trí đọc bị tính
  kép). **Chưa có bằng chứng trực tiếp cho cơ chế nội bộ nào** —
  log nhẹ của Y1 không có `basesrc`/`webkitwebsrc` nên không đếm
  được byte typefind tiêu thụ; log nặng của X1 có `basesrc` nhưng
  hiện tượng bị ức chế nên không có run bogus nào để đếm. Mâu
  thuẫn đo lường này vẫn mở (xem §5 mục 2).
- Số 2 MiB trùng với kích thước mà X1 đã thấy ở tầng nguồn theo
  hướng khác: lần đọc đầu của webkitwebsrc = toàn bộ file, không
  có chunk 2 MiB nào ở tầng nguồn — nên +2 MiB KHÔNG phải chunk
  của nguồn; nó là độ lệch vị trí trong adapter/pull, chưa rõ
  thành phần nào đặt ra con số này (typefind peek? GstAdapter?
  `GstBaseSrc` blocksize? — chưa đo được, không đoán).
- Sau bogus, pipeline thử lại: run2 `qtdemux0` reset 0,347 s và
  một parse đúng toàn bộ atom xuất hiện 0,396 s; `qtdemux1` reset
  0,391 s, lỗi interr 0,560 s, reset 0,562 s; `qtdemux2` reset
  0,659 s parse đúng và chơi tới hết (114 frame). Caveat: địa chỉ
  thread streaming được tái sử dụng giữa các instance nên KHÔNG
  gán chắc parse 0,396 s cho `qtdemux0` hay `qtdemux1` — chỉ chắc
  chắn là pipeline đã thử lại và parse đúng sau bogus. Số pipeline
  blob mỗi case vẫn dao động 1–3 instance không có page event
  tương ứng (nợ X1 §8 mục 3, vẫn mở).

### 4.3 Giả thuyết 2 MiB — trạng thái sau Y1

| Giả thuyết | Trạng thái sau Y1 |
|---|---|
| Moov ở cuối gây đọc nhầm | BÁC (từ W1) — không đổi |
| webkitwebsrc cấp theo khối 2 MiB | KHÔNG ỦNG HỘ (từ X1) — không đổi |
| qtdemux pull-range 2 MiB / pull bắt đầu ở 2 MiB | **SỬA THÀNH:** pull bị nhảy +2 MiB trong vài atom đầu (bằng chứng §4.1); "bắt đầu ở 2 MiB" chỉ là trường hợp riêng |
| Typefind/handoff push→pull tiêu thụ 2 MiB | VẪN MỞ, ứng viên duy nhất — nhưng chưa có bằng chứng trực tiếp; mâu thuẫn đo lường (cần basesrc log của 1 run bogus, mà logging nặng lại ức chế bogus) |
| Tải ức chế bogus | **BÁC** (§2, phân tầng trong lượt) |
| Logging GST nặng ức chế bogus | **CHỨNG MINH** (§2: X1 0/18 vs Y1(b) 8/18 cùng matrix) |

## 5. Nợ mở (cho đợt sau)

1. **Cơ chế +2 MiB (trọng tâm):** cần 1 run bogus CÓ `basesrc`
   logging để đếm byte typefind tiêu thụ trước khi qtdemux reset
   và xem vị trí nhảy xảy ra ở bước nào. Mâu thuẫn: logging nặng
   ức chế bogus (Y1 §2). Hướng thử rẻ: bật RIÊNG `basesrc:5`
   (không `webkitwebsrc:6`, không `souphttpsrc`/`queue`/
   `typefind`) trên probe nhẹ — nhẹ hơn nhiều so với chuỗi X1
   (chỉ thêm 1 element), xem bogus có còn về không; nếu về thì
   đếm được byte. Nếu riêng `basesrc:5` cũng ức chế thì thử
   `GST_DEBUG` mức thấp hơn hoặc đếm gián tiếp qua timing
   reset→bogus.
2. **Stall thầm 0 frame (Y1a 4/12, Y1b 0/18):** vì sao tỉ lệ khác
   nhau giữa hai matrix? Cần thiết kế watchdog "không có pipeline
   nào sống sau X ms" (nợ X1 §8 mục 4) — chưa thiết kế, chưa đo.
3. **Hai pipeline blob (1–3 instance/case):** ai tạo instance thứ
   hai, điều gì quyết định thử lại — cần đếm instance theo từng
   case trong lượt sau (nợ X1 §8 mục 3).
4. **Độ lệch vị trí +2 MiB đến từ thành phần nào:** typefind peek?
   GstAdapter? webkitwebsrc? Cần đọc source WebKitWebSource /
   qtdemux pull path đối chiếu với timing nhảy (atom 1/2/3) —
   chưa làm.
5. Đứng yên: TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi
   (MemAvailable lượt này 1189–3404 MB, vẫn xa ngưỡng 6 GB; u2net
   là fallback chính thức); `.github/workflows/*.yml` 403; release
   gate không đổi.

## 6. Kiểm chứng + file thay đổi (stage, KHÔNG push)

- Không sửa code production (`src/` không đổi; `media.ts` sha
  `809bd3db…` giống hệt trước/sau cả hai lượt). `node --check`
  cả 2 probe pass. JSON đủ 24 case (a) + 36 case (b), đối chiếu
  Counter khớp matrix log cả hai lượt; GST log đủ 12 (a) + 18 (b)
  log blob, grep `bogus size` đếm tay khớp script `summarize.py`.
- Cả hai launcher exit 0; display :195 (a) / :194 (b) đã release
  (lock dir chỉ còn X193/X196 của luồng khác); không process mồ
  côi của Y1 (không Xvfb, không probe Y1 còn chạy); không reboot
  trong lúc đo (boot d8dc09fe giữ nguyên).
- Phân tích số liệu chạy bằng
  `hidden_files/round97-y1/summarize.py` (đọc JSON + grep GST log);
  output tại `hidden_files/round97-y1/summary.txt`.

### File thay đổi (5 entry)

- `docs/PHASE9_ROUND97_Y1_BLOB_2MIB_LIMITS.md` — tài liệu này.
- `benchmarks/render/webkit_blob_flaky_97y1_w1light.mjs` — probe (a),
  copy y nguyên probe X1b (đổi OUT/bundle/GST/port/tên case).
- `benchmarks/render/webkit_blob_flaky_97y1_x1lightgst.mjs` — probe
  (b), copy probe X1 nhưng GST giảm xuống chuỗi nhẹ W1.
- `benchmarks/results/webkit-blob-flaky-97y1-w1light.json` — kết quả
  (a), 24 case.
- `benchmarks/results/webkit-blob-flaky-97y1-x1lightgst.json` — kết
  quả (b), 36 case.

Batch stage: `phase9-round97-y1-blob-2mib`
(`~/workspace/repo-1-push/paths-loop/phase9-round97-y1-blob-2mib.txt`).
Log luồng: `hidden_files/round97-y1/` (matrix97y1a/b.log, gst/ 12 +
18 log, bundle/, summarize.py, summary.txt) +
`hidden_files/round97-y1.md`. Clip faststart (binary, ngoài repo,
không stage): `~/workspace/round96-x1/clips-faststart/c1.mp4`,
`c2.mp4`, `c8.mp4`.
