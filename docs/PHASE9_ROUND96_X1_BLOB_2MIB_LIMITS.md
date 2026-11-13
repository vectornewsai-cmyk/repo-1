# Phase 9 đợt 96 — X1/X1b: cơ chế 2 MiB đường blob — ĐIỀU TRA XONG, GIẢ THUYẾT 2 MiB CHƯA KẾT LUẬN ĐƯỢC

**Nợ gốc:** LIMITS gộp đợt 95 §4 mục 1 (ƯU TIÊN) — giả thuyết moov đã chết
ở W1 (faststart không đổi gì, bogus vẫn đúng bằng 4 byte tại 2 MiB);
cần cơ chế 2 MiB trong đường blob (không phải vị trí moov) + case fail
không bogus (`failed to find fragment defaults`).
**Ngày:** 2026-11-12 (lượt cron 15:35 +07; X1 đo 09:06–09:15Z, X1b nối
tiếp 10:18–10:23Z sau reboot #18).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không sửa code
production (chỉ probe/script test + LIMITS này). Không đụng TTS 39,
birefnet, không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐIỀU TRA XONG — KHÔNG SỬA PRODUCTION.** Dữ liệu X1 KHÔNG
tái hiện được hiện tượng bogus (0/36 log) nên giả thuyết 2 MiB không
thể kết luận từ đợt này; lượt đo lại X1b bằng đúng probe W1 (xem §7)
quyết định xem bogus còn tái hiện được hay không.

## 0. Luồng nối tiếp sau reboot — ghi rõ nguồn dữ liệu

- **X1 (gốc):** chạy MATRIX96X1 (c1/c2/c8 × 6 run, blob+prog xen kẽ =
  36 case) 09:06–09:15Z, bị **reboot #18 (09:24:17Z, boot mới
  04b83831)** giết giữa chừng — X1 đã đo xong toàn bộ 36 case và ghi
  đủ log, nhưng chưa viết LIMITS, chưa stage batch. Mọi số liệu §1–§6
  là của X1 gốc (đọc từ đĩa, không chạy lại).
- **X1b (luồng này):** phân tích lại toàn bộ log X1 từ đĩa + chạy bổ
  sung tối thiểu 1 lượt đo lại bằng đúng probe W1 (MATRIXFS, xem §7)
  vì dữ liệu X1 không đủ để kết luận (§6). Lượt đo lại chạy 10:18–
  10:23Z, probe exit 0, không reboot trong lúc đo. File X1 gốc không
  ghi đè; mọi file X1b nằm ở `hidden_files/round96-x1b-*` + probe
  `webkit_blob_flaky_96x1b_w1rerun.mjs`.
- Boot lúc X1 đo: suy từ `uptimeS=3950` lúc spawn (~65,8 phút) → boot
  ~08:00Z (reboot #17, chưa có số hiệu chính thức); X1 không ghi boot
  id trong log — thiếu sót ghi nhận, đợt sau ghi boot id vào đầu log.
  Boot lúc X1b đo lại: **04b83831** (reboot #18, 09:24:17Z), xác minh
  bằng `/proc/sys/kernel/random/boot_id` + `who -b` trước khi đo.

## 1. Kết quả X1 — tỉ lệ pass (MATRIX96X1, clip faststart, bundle có fix W2)

| Clip | blob-A (prod) | prog | Ghi chú |
|---|---|---|---|
| c1 (1.138.750 B < 2 MiB, 4 s) | **6/6** (15–89 frame) | 6/6 | Đối chứng "chỉ 1 chunk" |
| c2 (2.139.973 B, 8 s) | **5/6 strict, 6/6 loose** | 6/6 | Run5 failKind error-event nhưng 80 frame (xem §3) |
| c8 (8.182.985 B, 32 s) | **6/6** (39–176 frame) | 6/6 | |
| **Gộp blob** | **17/18 strict (94%), 18/18 loose (100%)** | **18/18 = 100%** | |

- So với W1 (MATRIXFS, cùng file faststart c2/c8): blob 4/12 = 33%.
  X1 cao hơn hẳn — nhưng X1 dùng bundle **đã có fix retry-play W2**
  (marker `retryPlay95W2` ×6 trong bundle) nên "strict" (playOk) vẫn
  tính fail khi play() reject dù retry đã cứu (run5: 80 frame,
  ct 7,04 s). "Loose" = frames > 0 (tiêu chí W2 AFTER): X1 18/18.
- JSON 36 case đã đối chiếu khớp matrix log:
  `benchmarks/results/webkit-blob-flaky-96x1-2mib.json` (Counter:
  c1 blob ok 6, c1 prog ok 6, c2 blob ok 5 + error-event 1, c2 prog
  ok 6, c8 blob ok 6, c8 prog ok 6).
- Môi trường X1: WebKitGTK 27.2, Xvfb :194 (lock), loadavg lúc đo
  0,25–15,67 (nặng — các luồng đợt 96 khác chạy song song), MemAvailable
  1.352–4.035 MB. Clip tại `~/workspace/round96-x1/clips-faststart/`
  (c2/c8 sha256 y hệt clip W1; c1 mới, sha
  `51c787dd…`).

## 2. Phát hiện trung tâm: bogus = 0/36 log — hiện tượng KHÔNG tái hiện

| Tập log | Số log | Log có `bogus size` |
|---|---|---|
| X1 blob (c1/c2/c8 × 6) | 18 | **0** |
| X1 prog (c1/c2/c8 × 6) | 18 | **0** |
| Đối chứng W1 faststart blob (cùng file c2/c8) | 12 | **9** (c2 6/6, c8 3/6) |
| Đối chứng V3 clip gốc blob | 52 | **30** (fail 24/24 + pass 6/30) |

- Grep giống hệt nhau (`bogus size`, đã kiểm chứng tìm được 1–2× trong
  mọi log c2-fs của W1 và trong log V3) — **không phải artifact
  grep/logging**: log X1 vẫn chứa đầy đủ dòng qtdemux parse atom
  (1517 dòng parse trong Lc2-run1) và cả dòng WARN qtdemux khác, nên
  bogus thực sự không xảy ra.
- Hệ quả trực tiếp: **đối chứng c1 (< 2 MiB) của X1 VÔ HIỆU.** Thiết kế
  là "c1 không bao giờ có bogus, c2/c8 có bogus" — nhưng c2/c8 cũng 0
  bogus nên không so sánh được gì. Không được trích "c1 chứng minh
  ngưỡng 2 MiB" từ đợt này.
- X1 cũng không chứng minh được điều ngược lại: 0 bogus trong 1 cửa sổ
  đo không bác được cơ chế 2 MiB (W1 đã thấy nó 9/12 log chỉ ~3,5 giờ
  trước). Nó chỉ chứng minh hiện tượng **không ổn định theo cửa sổ đo**
  — bogus là hiện tượng theo đua (race), không phải tính chất xác định
  của file/clip. Xem §7 (đo lại X1b) để biết nó còn tái hiện không.

## 3. Giải phẫu fail duy nhất của X1: Lc2-x1-blobA-run5 — KHÔNG phải mode bogus

- Page: swap 779 ms → error event t=1,98 s → fallback http →
  **playing t=2,88 s, 80 frame, ct 7,04 s** (failKind error-event theo
  tiêu chí strict vì play() reject, nhưng người dùng thấy video chạy
  tiếp — chính là **fix retry-play W2 đang cứu**: bundle X1 có marker
  95W2; không có fix này thì run này là 0 frame như V3/W1).
- GST (3 pipeline instance, 2 lần Internal data stream error, 0 bogus):
  - `qtdemux0` (blob #1, reset 1,00 s): parse moov ĐÚNG (loop positions
    0 → 32 → 3163 → 3171 = ftyp/moov/free/mdat), đẩy sample 7–9 từ
    offset đúng (136876, 153929, 166709), rồi `flow return: error`
    lúc 1,313 s ngay sau chùm `reconfigure` trên webkitwebsrc0 →
    Internal data stream error. Đây là lỗi **hạ nguồn (downstream)**
    trong lúc teardown/reconfigure, không phải lỗi parse atom.
  - `qtdemux1` (blob #2, reset 1,679 s): y hệt — parse đúng, đẩy
    sample 7–8, flow error lúc 1,886 s sau chùm reconfigure.
  - `qtdemux2` (fallback http, reset 2,178 s): chạy tốt tới hết.
- Đối chiếu Lc8-x1-blobA-run5 (**PASS, 147 frame**): `qtdemux0` (blob #1)
  cũng Internal data stream error 1 lần (0,889 s) rồi `webkitwebsrc1` +
  `qtdemux1` nối tiếp chơi tới hết — **pipeline blob thứ nhất fail
  thầm lặng, pipeline thứ hai cứu, page không thấy error.** Mẫu này
  xuất hiện ở cả pass lẫn fail: X1 có 2 pipeline blob mỗi case fail
  (run5) và cả ở case pass (c8-run5). Cơ chế tạo pipeline blob thứ hai
  (playbin/uridecodebin tự thử lại nội bộ, không có page event tương
  ứng) chưa xác định được từ log — ghi là nợ (§8).
- Kết luận §3: fail X1 thuộc **mode flow-error sau parse đúng** (mode
  thứ hai, đã thấy thoáng qua ở W1 Lc8-run6), khác hẳn mode bogus của
  V3/W1 (fail ngay atom đầu tiên). "Fail ⇒ bogus" gộp toàn lịch sử nay
  là 31/33 (V3 24/24 + W1 7/8 + X1 0/1).

## 4. Cơ chế cấp dữ liệu blob — lần đầu nhìn thấy được (webkitwebsrc:6)

X1 bật `webkitwebsrc:6, basesrc:5, souphttpsrc:5, queue:5, typefind:5`
(trước đây chỉ có qtdemux:5) nên lần đầu thấy được đường blob:

- **Nguồn blob là `webkitwebsrc`** (`WebKitWebSourceGStreamer.cpp`,
  element `<webkitwebsrc0/1>` cho blob, `<http-src-0/1>` cho http).
  `playbin set uri` luôn là `http://127.0.0.1:8898/cX.mp4` — blob URL
  chỉ xuất hiện trong `webKitWebSrcMakeRequest` /
  typefind (`blob:http://127.0.0.1:8898/<uuid>`, 18 lần trong log run5).
  Đây là lần đầu tiên chuỗi "blob" xuất hiện trong GST log (V3 0/52,
  W1 0/12) — vì trước đây không bật webkitwebsrc logging.
- **Đọc lần đầu = toàn bộ file, một lần.** `dataReceived: Have
  2139973 bytes` rồi `loadFinished: Read position: 2139973` (c2) /
  8182985 (c8) / 1138750 (c1) — WebCore giao hết blob (đã nằm trong
  RAM) trong một chunk duy nhất. `checkUpdateBlocksize: Read: <cỡ
  file>, current blocksize: 4096` — blocksize KHÔNG tăng cho blob
  (giữ 4096 suốt; chỉ pipeline http fallback tăng lên 8192 sau 2 lần
  đọc ~1 MB).
- **Range read kiểu [offset, EOF] mở đầu.** Sau lần đọc đầu, mọi lần
  đọc tiếp theo đều là "từ offset tới hết file": seek 2139941 → đọc 32
  B; seek 2139845 → đọc 128 B; seek 610304 → đọc 1.529.669 B
  (= filesize − 610304); seek 4096 → đọc 2.135.877 B (= filesize −
  4096). Không có chunk 2 MiB nào ở tầng webkitwebsrc.
- **Seek tới EOF−32 / EOF−128 là routine, không liên quan 2 MiB.**
  Mọi run blob (pass + fail, cả c1) đều seek tới `size−32` rồi
  `size−128` trước khi qtdemux reset (c1: 1138718/1138622; c2:
  2139941/2139845; c8: 8182953/8182857); run prog KHÔNG có seek nào
  ngoài seek 0. Đây là bước quét đuôi file tìm moov của typefind /
  qtdemux pull-mode setup (đọc 4096 B từng bước rồi nhảy tới đuôi),
  xảy ra kể cả khi moov đã ở đầu file (faststart). Không được dùng
  2 seek này làm bằng chứng cho cơ chế 2 MiB.
- **qtdemux đi đúng từ offset 0 trong mọi run X1** (pass lẫn fail):
  `loop at position 0 → 32 → 3163 → 3171` (ftyp/moov/free/mdat của
  c2-faststart) rồi mới nhảy tới 2139973 (= EOF) ở state INITIAL/MOVIE
  — bước nhảy tới EOF sau khi parse xong header là routine (đã đọc hết
  file vào adapter từ lần đọc đầu), cũng có ở run pass.
- `webKitWebSrcGetSize: haveSize: false` — nguồn blob báo kích thước
  không biết; qtdemux chỉ biết tổng cỡ sau khi `loadFinished` (basesrc
  log `reading offset 0, length 0, size 2139973`).

## 5. "Failed to find fragment defaults" — NHIỄU NỀN, KHÔNG PHẢI CHỮ KÝ FAIL

- `qtdemux_parse_trex: failed to find fragment defaults for stream 1`
  xuất hiện **đúng 1 lần mỗi qtdemux instance trong 36/36 log X1**
  (blob + prog, pass + fail) — tức là dòng INFO routine khi parse file
  MP4 không phân mảnh (không có box trex), không phải lỗi.
- Chỉ khi đếm theo instance mới có nghĩa: run5 fail có fragdef=3
  (3 instance) + interr=2; c8-run5 pass có fragdef=2 + interr=1
  (instance blob #1 fail thầm, instance #2 cứu). **Đính chính W1
  §4.3:** "đường fail thứ hai không bogus" ở Lc8-fs-run6 không thể
  định danh bằng fragdef (nó có ở mọi run); đặc trưng thật của nó là
  interr mà không có bogus — tức cùng mode flow-error như §3 ở đây.
- Tương tự, `Internal data stream error` cũng xuất hiện trong run pass
  (c8-run5, 1 lần, ở instance bị thay thế) — chỉ có nghĩa khi gắn với
  instance đang phát trên page.

## 6. Giả thuyết range-read / bộ đệm 2 MiB — ĐÁNH GIÁ BẰNG CHỨNG

| Giả thuyết | Bằng chứng X1 | Kết luận |
|---|---|---|
| qtdemux đọc nhầm tại ranh giới 2 MiB vì moov ở cuối (V3 §6) | Đã chết ở W1 (faststart vẫn bogus); X1 không thêm gì | BÁC (từ W1) |
| webkitwebsrc cấp dữ liệu theo khối 2 MiB | Lần đọc đầu = toàn file; các lần sau = [offset, EOF]; blocksize 4096 không đổi; không chunk 2 MiB nào trong 36 log | **KHÔNG ỦNG HỘ** — không thấy khối 2 MiB ở tầng nguồn |
| qtdemux pull-range 2 MiB | Pull của qtdemux đi từ 0 (0→32→3163→3171) trong mọi run X1; không có pull nào bắt đầu/kết thúc ở 2097152 | **KHÔNG TÁI HIỆN** trong cửa sổ X1 — không xác nhận cũng không bác được |
| Typefind/push-mode tiêu thụ 2 MiB trước khi qtdemux pull | Không quan sát trực tiếp được (W1 không bật basesrc/webkitwebsrc logging; X1 bật thì hiện tượng biến mất) | **MỞ** — là ứng viên duy nhất còn lại cho "pull bắt đầu ở 2 MiB" trong log W1, nhưng chưa có bằng chứng trực tiếp |

- Bằng chứng mạnh nhất cho "pull bắt đầu ở 2 MiB" vẫn là log W1:
  `qtdemux0` reset 1,121 s → `extract_initial_length_and_fourcc:
  length 0x204286c4` ngay lần đọc atom đầu tiên (1,124 s), rồi
  `atom has bogus size 541230788` + `no playable streams`; `qtdemux1`
  lặp lại y hệt 1,342 s. Trong khi cùng file đó, X1 cho thấy lần đọc
  atom đầu tiên đi từ offset 0. **Hai cửa sổ đo mâu thuẫn nhau ở đúng
  điểm này** — đó là điều §7 phải giải quyết.
- Các ứng viên gây ra sự khác biệt W1 ↔ X1 (chưa phân biệt được):
  (a) bundle: X1 có thêm fix W2 (diff bundle W1→X1 chỉ đúng 39 dòng
  thêm của retry-play — đã diff trực tiếp; về mặt cơ chế, code retry
  chỉ chạy sau error+canplay, không chạm đường pull ban đầu);
  (b) GST_DEBUG nặng hơn ở X1 (webkitwebsrc:6 + basesrc:5 +
  qtdemux:6, log 1–6 MB/run so với ~1 MB của W1) làm chậm handoff
  push→pull (hiệu ứng Heisenberg — thiết bị đo làm biến mất hiện
  tượng); (c) tải/boot khác nhau (X1 loadavg tới 15,67 với các luồng
  đợt 96 song song; W1 0,81–10,14; boot khác nhau).

## 7. Đo lại X1b — bogus TÁI HIỆN với đúng probe W1 (quyết định)

**Thiết kế:** copy probe W1 (`webkit_blob_flaky_95w1_faststart.mjs`)
thành `webkit_blob_flaky_96x1b_w1rerun.mjs`, chỉ đổi OUT / thư mục
bundle+GST / port 8897→8899 / tên case `-fs`→`-x1b`, GIỮ NGUYÊN chuỗi
GST_DEBUG nhẹ của W1 (`playbin:5,uridecodebin:5,qtdemux:5,decodebin:5,
avidemux:5`) và mode MATRIXFS (c2/c8 × 6 run, blob+prog xen kẽ = 24
case). Bundle build mới từ `media.ts` hiện tại (sha
`809bd3db…`, chứa cả fix W2 và code X3 stall-watchdog/non-proxy retry
— marker 95W2=6, 96X3=22 trong bundle; `media.ts` không đổi trong lúc
đo: sha + mtime 09:56:43Z giống hệt trước/sau). Xvfb :193 qua lock,
boot 04b83831, loadavg 0,69–5,89 (cửa sổ yên), MemAvailable 610–1.768
MB. Probe exit 0, đủ 24 case.

### 7.1 Kết quả — bogus trở lại đúng tỉ lệ W1

| | X1b rerun (probe W1, bundle W2+X3) | W1 (probe W1, bundle pre-W2) | X1 (probe nặng, bundle W2) |
|---|---|---|---|
| c2 blob strict (playOk) | **0/6** | 0/6 | 5/6 |
| c8 blob strict | **3/6** | 4/6 | 6/6 |
| **Gộp blob strict** | **3/12 = 25%** | 4/12 = 33% | 17/18 = 94% |
| **Gộp blob loose (frames > 0)** | **11/12 = 92%** | 4/12 = 33% | 18/18 = 100% |
| Prog | 12/12 = 100% | 12/12 | 18/18 |
| Log blob có bogus | **8/12** (c2 5/6, c8 3/6) | 9/12 | **0/18** |

- Giá trị bogus y hệt W1: c2 **541230788** (5 log), c8 **2991868683**
  (3 log) — đúng bằng 4 byte tại offset 2 MiB của file faststart
  (đã verify lại bằng đọc trực tiếp file, xem §2 của W1).
- **8/9 fail có bogus** (fail⇒bogus trong lượt này). Gộp toàn lịch sử:
  V3 24/24 + W1 7/8 + X1 0/1 + X1b 8/9 = **39/42 = 93%**.
  Pass có bogus: **0/3** trong lượt này (khác V3 6/30, W1 2/4 — trong
  cửa sổ này bogus ⇔ fail là tuyệt đối cả hai chiều ở mức log).
- **Retry-play cứu 8/9 fail error-event:** mọi fail error-event (trừ
  stall run1) đều chơi tới hết clip qua fallback http (93–192 frame,
  ctReached = đúng duration 8 s / 7,6–8,3 s của c8) — bằng chứng độc
  lập lần thứ hai cho fix W2 (+ X3 trong bundle này). Không có retry
  thì 8 case này là 0 frame như W1.
- **Fail thật duy nhất còn lại: Lc2-x1b-blobA-run1, stall-timeout,
  0 frame.** GST log chỉ 13.232 B: `qtdemux0` bogus 0,500 s
  ("This file is invalid", "no playable streams"), `qtdemux1` bogus
  lại 0,580 s — cả hai pipeline blob chết ngay atom đầu trong vòng
  80 ms, KHÔNG có error event nào tới page → không fallback, không
  retry, stall tới timeout 10 s. Đây là dạng fail nguy hiểm nhất của
  mode bogus (chết thầm, không kích được mitigation nào). MemAvailable
  lúc run này chỉ 610 MB (thấp nhất trong lượt) — ghi nhận, n=1 nên
  không claim quan hệ nhân quả.
- **Fail không bogus còn 1: Lc2-x1b-blobA-run3** (error-event, bogus=0):
  `qtdemux0` parse ĐÚNG từng atom (ftyp 0x20, moov 0xc3b, free 0x08,
  mdat 0x209ae2) rồi Internal data stream error 0,212 s (mode
  flow-error, §3); `qtdemux1` là pipeline fallback http, parse đúng
  và chơi tới hết (187 frame). Xác nhận mode flow-error tồn tại độc
  lập với mode bogus trong cùng một lượt đo, cùng một probe.

### 7.2 Verdict: X1 0/36 là hiệu ứng thiết bị đo / cửa sổ, KHÔNG PHẢI bogus biến mất

- Bogus tái hiện ngay khi quay về đúng probe W1 (nhẹ) trong cửa sổ yên:
  8/12 log vs 0/18 log của X1. Bundle bị **loại trừ** khỏi danh sách
  nghi phạm chính: bundle lượt đo lại chứa cả W2 + X3 (nhiều code hơn
  bundle X1) mà bogus vẫn về đúng tỉ lệ W1.
- Hai biến còn lại chưa tách được nhau (đều khác giữa cửa sổ X1 và
  X1b): (a) GST_DEBUG nặng của X1 (webkitwebsrc:6 + basesrc:5 +
  qtdemux:6, log 1–6 MB/run — làm chậm handoff push→pull, hiệu ứng
  Heisenberg); (b) tải nặng trong cửa sổ X1 (loadavg tới 15,67 với
  các luồng đợt 96 song song, so với 0,69–5,89 ở X1b). **Không được
  claim "logging gây ra" hay "tải gây ra" khi chưa đo tách biến** —
  test tách biến sạch (chạy probe NẶNG của X1 trong cửa sổ yên) ghi ở
  §8 mục 1.
- Hệ quả phương pháp (quan trọng, áp dụng cho mọi luồng sau): **đo
  GST nặng làm biến mất chính hiện tượng cần đo.** Từ nay, đo tỉ lệ
  bogus/pass phải dùng probe NHẸ (chuỗi GST của W1); chỉ bật
  webkitwebsrc:6/basesrc:5 khi cần giải phẫu một run cụ thể, và phải
  ghi rõ tỉ lệ đo được lúc đó có thể bị nhiễu bởi logging.
- Về giả thuyết 2 MiB: **vẫn MỞ, chưa kết luận được.** Bằng chứng
  mạnh nhất vẫn là log W1/X1b (lần đọc atom đầu tiên của qtdemux nhận
  đúng 4 byte tại 2 MiB). Ứng viên duy nhất còn đứng là handoff
  push→pull (typefind tiêu thụ đúng 2 MiB ở push-mode trước khi
  qtdemux kích hoạt pull) — chưa có bằng chứng trực tiếp, và dữ liệu
  X1 (pull bắt đầu ở 0 trong 36/36 run) cho thấy handoff này có hai
  chế độ, chưa biết điều gì chọn chế độ nào.

## 8. Nợ mở (cho đợt sau, không thuộc X1/X1b)

1. **Test tách biến (ƯU TIÊN, rẻ, 1 lượt):** chạy lại đúng probe X1
   (GST nặng webkitwebsrc:6/basesrc:5/qtdemux:6) trong cửa sổ YÊN
   (loadavg < 3, không luồng nào khác đo WebKit). Nếu bogus trở lại
   → tải là yếu tố ức chế, logging vô tội. Nếu bogus vẫn 0 → logging
   nặng ức chế hiện tượng (Heisenberg) — và mọi số liệu X1 phải đọc
   kèm caveat này. Chỉ 1 biến thay đổi so với X1 (tải), 1 biến thay
   đổi so với X1b (logging).
2. **Cơ chế "pull bắt đầu ở 2 MiB":** cần quan sát trực tiếp handoff
   push→pull — đếm số byte typefind tiêu thụ ở push-mode trước khi
   qtdemux reset trong run bogus vs run tốt (log W1/X1b không có
   basesrc nên không đếm được; log X1 có basesrc nhưng không có run
   bogus). Cần 1 run bogus CÓ basesrc logging — mâu thuẫn với §7.2
   (logging nặng có thể ức chế bogus); thử bật riêng basesrc:5 (không
   webkitwebsrc:6) để giảm nhiễu.
3. **Hai pipeline blob:** số pipeline blob mỗi case thay đổi 1–2 mà
   không có page event tương ứng (X1 run5: 2 blob + 1 fallback; X1b
   run3: 1 blob + 1 fallback; X1b run1: 2 blob chết cả hai). Chưa rõ
   ai tạo pipeline thứ hai (playbin/uridecodebin tự thử lại nội bộ
   hay pool) và điều gì quyết định có thử lại hay không. Cần đếm số
   instance qtdemux/webkitwebsrc theo từng case trong lượt sau.
4. **Stall thầm do bogus (Lc2-x1b-run1):** cả hai pipeline chết
   không error event → 0 frame, không mitigation nào kích được
   (retry-play cần error; stall-watchdog X3 cần progress). Hướng đo:
   watchdog theo "không có pipeline nào sống sau X ms" thay vì chỉ
   theo progress event — chưa thiết kế, chưa đo.
5. **Đính chính W1 §4.3** (đã làm ở §5 trên): fragdef là nhiễu nền,
   không phải chữ ký fail thứ hai; đặc trưng thật của fail không
   bogus là interr sau parse đúng (mode flow-error).
6. **Thiếu sót ghi chép X1:** X1 không ghi boot id vào log (chỉ suy
   ra ~08:00Z từ uptime); probe các luồng sau ghi boot id + `who -b`
   vào dòng đầu log như X1b đã làm ở LIMITS này.
7. Đứng yên: TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi
   (MemAvailable lượt này 610–1.768 MB, vẫn xa ngưỡng 6 GB; u2net là
   fallback chính thức); `.github/workflows/*.yml` 403; release gate
   không đổi.

## 9. Kiểm chứng + file thay đổi (stage, KHÔNG push)

- Không sửa code production (`src/` không đổi) → không cần tsc/vite
  build. `node --check` probe X1b pass. JSON đủ 36 case (X1) + 24
  case (X1b), đối chiếu Counter khớp matrix log cả hai lượt.
- X1b: media.ts sha + mtime giống hệt trước/sau lượt đo lại
  (809bd3db…, 09:56:43Z — sửa bởi luồng X3 đợt 96 trước đó, không
  phải X1b); boot 04b83831 giữ nguyên suốt lượt; không reboot trong
  lúc đo; Xvfb :193 claim/release qua lock, không lock mồ côi.
- Không process mồ côi của X1b (mọi browser probe đã đóng; Xvfb đã
  kill + release display).

### File thay đổi (5 entry)

- `docs/PHASE9_ROUND96_X1_BLOB_2MIB_LIMITS.md` — tài liệu này (X1 +
  X1b gộp).
- `benchmarks/render/webkit_blob_flaky_96x1_2mib.mjs` — probe X1
  (MATRIX96X1, GST nặng, c1/c2/c8).
- `benchmarks/results/webkit-blob-flaky-96x1-2mib.json` — kết quả X1,
  36 case.
- `benchmarks/render/webkit_blob_flaky_96x1b_w1rerun.mjs` — probe X1b
  (copy probe W1, đổi OUT/bundle/GST/port/tên case).
- `benchmarks/results/webkit-blob-flaky-96x1b-w1rerun.json` — kết quả
  X1b, 24 case.

Batch stage: `phase9-round96-x1-blob-2mib`
(`~/workspace/repo-1-push/paths-loop/phase9-round96-x1-blob-2mib.txt`).
Log luồng: `hidden_files/round96-x1/` (X1 gốc: matrix96x1.log + gst/
36 log + bundle/) và `hidden_files/round96-x1b-rerun/` (X1b:
matrix96x1b.log + gst/ 12 log + bundle/ 4 bundle) +
`hidden_files/round96-x1b-analysis/` (timeline.py, summarize.py).
Clip faststart (binary, ngoài repo, không stage):
`~/workspace/round96-x1/clips-faststart/c1.mp4`, `c2.mp4`, `c8.mp4`
(c2/c8 sha256 y hệt clip W1).
