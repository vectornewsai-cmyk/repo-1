# Phase 9 đợt 98 — Z1: blob 2 MiB với basesrc:5 RIÊNG — basesrc:5 ỨC CHẾ MẠNH NHƯ CHUỖI NẶNG; NHẢY +2 MiB KHÔNG NẰM Ở qtdemux

**Nợ gốc:** LIMITS gộp đợt 97 §4 mục 1 + §5 mục 1 (Y1): cần 1 run
bogus CÓ `basesrc` log để đếm byte typefind tiêu thụ và xem vị trí
nhảy xảy ra ở bước nào; mâu thuẫn đo lường: logging nặng ức chế
bogus. Hướng thử: bật RIÊNG `basesrc:5` trên probe nhẹ.
**Ngày:** 2026-11-12 (lượt cron 21:35 +07; Z1 đo 14:39–14:55Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push, KHÔNG commit).
Không sửa code production (`apps/web/src/media.ts` sha trước/sau đo
y hệt `809bd3db…`). Không đụng TTS 39, birefnet, không đụng
`.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐIỀU TRA XONG — GIẢ THUYẾT "basesrc:5 NHẸ" BỊ BÁC;
CƠ CHẾ THU HẸP THÊM MỘT NẤC (qtdemux ĐƯỢC MINH OAN Ở TẦNG
PULL-RANGE); PHÁT HIỆN MỚI: DEADLOCK WEBPROCESS + BUG withTimeout
CỦA HỌ PROBE.**

## 0. Thiết kế + môi trường

- **Boot:** 65bc5fb6 (reboot #20, 13:24:41Z), xác minh bằng `boot_id`
  trước và sau đo; không reboot trong lúc đo; uptime 4499 s lúc bắt
  đầu. Không có `round-in-progress.md` (chốt chặn qua).
- **Một lượt duy nhất:** copy y nguyên probe Y1a
  (`webkit_blob_flaky_98z1_basesrc.mjs`, MATRIXFS c2/c8 × 6 run
  blob+prog = 24 case, port 8903, display :193 qua lock), CHỈ đổi
  chuỗi GST từ nhẹ W1 (`playbin:5,uridecodebin:5,qtdemux:5,
  decodebin:5,avidemux:5`) thành nhẹ + `basesrc:5` (thêm đúng 1
  element, theo đúng hướng thử Y1 §5 mục 1). Tên case `-z1-`.
- **Clip:** `~/workspace/round96-x1/clips-faststart/` (c2 2.139.973 B,
  c8 8.182.985 B; sha256 y hệt X1/X1b/Y1).
- **Cửa sổ đo:** 9 luồng Z khác chạy song song; load1 lúc đo
  2,62–12,50 (c2: 10,21–12,50; c8: 2,62–7,87) — tải NẶNG, nhưng
  theo Y1 §2 tải không ức chế bogus nên không phải biến gây nhiễu
  cho kết luận ức chế (xem §2).

## 1. Kết quả — bogus gần như biến mất dưới basesrc:5

| Lượt | Blob strict | Blob loose (frames > 0) | Prog | Log blob có bogus |
|---|---|---|---|---|
| **Z1 (nhẹ + basesrc:5), 12 blob** | **11/12** | **11/12** | 12/12 | **2/12** |
| Y1a (nhẹ, cùng matrix) | 2/12 | 7/12 | 12/12 | 10/12 |
| X1b (nhẹ, yên) | 3/12 | 11/12 | 12/12 | 8/12 |
| X1 (nặng) | 17/18 | 18/18 | 18/18 | **0/18** |

- **"Fail" duy nhất không phải fail phát lại:** c2-run1 là `runError`
  (deadlock WebProcess, xem §5) — probe phải kill browser mới đi
  tiếp; không có playOk/failKind. Nếu loại run1: strict 11/11.
- **2 log có bogus đều PASS (pass-có-bogus, như Y1a c8-run1):**
  c2-run3 bogus `2854668610` (giá trị atom-2 của Y1a) mà vẫn 95 frame;
  c8-run5 bogus `2991868683` (giá trị cổ điển) mà vẫn 36 frame —
  bogus giết 1 instance, instance retry cứu (xem §3–§4).
- **Fail⇒bogus gộp toàn lịch sử:** 56/64 = 88% (trước Z1: 56/63;
  Z1 thêm 0/1 — mẫu "fail" duy nhất là deadlock không bogus, nên
  không làm thay đổi tỉ lệ theo hướng nào).
- **Kích thước log chứng minh basesrc:5 KHÔNG hề nhẹ:** 2,2–5,1 MB/run
  (tổng 37 MB / 12 log), cùng cỡ chuỗi NẶNG X1 (1–6 MB/run), gấp
  ~10–20× chuỗi nhẹ Y1a (76–370 KB/run). `basesrc:5` một mình đã
  sinh ~5000 dòng `get_range` mỗi run (c2-run1: 4954 dòng) vì nó
  log từng lần đọc 4 KB của nguồn.

## 2. Verdict: basesrc:5 ỨC CHẾ BOGUS — GIẢ THUYẾT "CHỈ THÊM 1 ELEMENT LÀ NHẸ" BỊ BÁC

- **Kết luận:** bật riêng `basesrc:5` trên probe nhẹ đưa bogus từ
  10/12 (Y1a, cùng matrix) xuống 2/12 — gần bằng chuỗi nặng X1
  (0/18). Hướng thử Y1 §5 mục 1 ("chỉ thêm 1 element, nhẹ hơn nhiều
  so với chuỗi X1") là SAI về mặt đo lường: 1 element `basesrc`
  log theo từng lần đọc nên nặng ngang cả chuỗi X1.
- **Dose-response theo thể tích log (3 điểm đo độc lập, cùng matrix
  họ W1/X1):** log ~0,1–0,4 MB/run → bogus 8–10/12 (~70–83%);
  log ~2–5 MB/run (chỉ basesrc:5) → bogus 2/12 (17%); log ~1–6
  MB/run (chuỗi nặng X1, nhiều element hơn) → bogus 0/18 (0%).
  Ức chế đi theo thể tích log, không đi theo tên element nào được
  bật. (Caveat: chưa tách được "thể tích log" khỏi "độ trễ mỗi lần
  đọc do gọi debug" — cả hai cùng là tải ghi log; số liệu chỉ cho
  phép nói "tải ghi log ức chế", với thể tích là proxy đã đo.)
- **Tải hệ thống KHÔNG phải yếu tố ức chế (khẳng định lại Y1 §2):**
  lượt này load1 tới 12,50 mà bogus vẫn 2/12 — nếu tải ức chế thì
  Y1b (load tới 17,62, bogus 8/18) đã phải sạch. Tải cao ở lượt này
  một phần là HỆ QUẢ của chính việc ghi 37 MB log + 9 luồng song
  song, không phải nguyên nhân.
- **Hệ quả phương pháp:** KHÔNG có cách nào vừa bật `basesrc:5` vừa
  đo tỉ lệ bogus thật — mâu thuẫn đo lường Y1 §5 mục 1 vẫn mở, nay
  đã chứng minh là không giải được bằng "bật riêng 1 element".
  Mọi số liệu bogus đo dưới basesrc:5 (kể cả 2/12 của lượt này) phải
  đọc kèm caveat "đo bằng GST nặng nên hiện tượng bị ức chế". Ngược
  lại, số liệu CẤU TRÚC từ log basesrc (§3–§4: offset các lần đọc,
  thứ tự atom, trigger retry) vẫn đứng vì đó là quan sát cấu trúc,
  không phải tỉ lệ hiện tượng — đúng như Y1 đã khẳng định cho X1.

## 3. Cơ chế — PHÁT HIỆN MỚI: qtdemux KHÔNG BAO GIỜ HỎI OFFSET 2 MiB CHO LẦN ĐỌC ATOM

Đây là đóng góp mới của Z1 so với mọi lượt trước: lần đầu có log
`basesrc` của run bogus, và nó cho thấy cú nhảy KHÔNG nằm ở phía
qtdemux.

### 3.1 Dòng thời gian run bogus c2-run3 (bogus 2854668610, atom 2)

| Thời điểm (pipeline) | Sự kiện |
|---|---|
| 0,385 s | `http-src-0` (pipeline preload http): `get_range offset 0 length 4096` |
| 0,472 s | `webkitwebsrc0` (pipeline blob): `get_range offset 0 length 4096` — buffer ĐẦU TIÊN của blob |
| 0,573 s | `offset 4096 length 4` |
| 0,575–0,589 s | Quét đuôi file: `2139941` (= size−32), `2139973` (= size), `2139845` (= size−128), `2139973` |
| 0,595–0,61 s | Đọc tuần tự tiếp: `4096`, `8192`, `12288`, … `45056` (mỗi lần 4096 B, `buffer ok`) |
| 0,690–0,694 s | `qtdemux0` reset → parse `ftyp` ĐÚNG (isom/512/isom/iso2/avc1/mp41) |
| 0,700 s | Đọc atom 2: fourcc rác `.$..` → `atom has bogus size 2854668610` (`0xaa26c942` = 4 byte tại 2 MiB+32) |
| 0,700–0,822 s | `qtdemux0` reset → `qtdemux1` reset → parse `ftyp` ĐÚNG → atom `moov` ĐÚNG → chơi tới 95 frame |

- **Không có lần đọc nào hỏi offset 2097184 (2 MiB+32) hay 2097152
  cho lần đọc atom:** toàn bộ `get_range` của `webkitwebsrc0` trước
  0,700 s là `0`, `4096`, các offset quét đuôi, rồi tuần tự từ
  `4096`. Lần đọc atom 2 (offset 32, nằm trong 8 byte đầu của
  buffer đầu) được phục vụ từ adapter đã chứa buffer `offset 0
  length 4096` lấy lúc 0,472 s — không có `get_range` nào khác xen
  vào. **Kết luận: 4 byte sai đã nằm sẵn trong buffer đầu tiên
  (byte 32–35 của buffer `offset 0`), hoặc bị tráo trong adapter
  typefind giữa nguồn và qtdemux.** Cú nhảy +2 MiB xảy ra ở/below
  `webkitwebsrc.create()` (đường đọc blob của nó) hoặc ở handoff
  typefind/pull-adapter — KHÔNG ở logic pull-range của qtdemux,
  vì qtdemux đã hỏi đúng mọi offset trong suốt lượt.
- **Đối chứng:** `qtdemux1` (retry, cùng nguồn, cùng file) parse
  đúng toàn bộ — buffer đầu của nó không bị tráo. Lỗi chỉ đánh
  trúng MỘT buffer đầu của MỘT instance, đúng như Y1a c8-run1.
- **Đọc tuần tự CÓ đi qua 2 MiB trong lúc phát (bình thường):**
  `calling create offset 2097152 length 4096` xuất hiện 18 lần
  trong 12 log (mỗi log 1–3 lần, ở cả 3 nguồn `webkitwebsrc0/1`,
  `http-src-1`) — đó là đọc streaming mdat khi phát tới giữa file,
  không liên quan tới lần đọc atom. Đừng nhầm hai thứ này với nhau.

### 3.2 Run bogus c8-run5 (bogus 2991868683, atom 1 — dạng cổ điển)

- 1,889 s: atom đầu tiên đọc được fourcc `.7"S` (byte tại
  2 MiB+4..7) + `atom has bogus size 2991868683` (`0xb2544b0b` =
  byte tại 2 MiB+0). Đây là dạng "pull bắt đầu ở 2 MiB" của X1 —
  atom 1 đã sai, khác run3-c2 (atom 1 đúng, atom 2 sai). Cả hai dạng
  cùng giải thích bằng một mô hình: **buffer đầu tiên của instance
  bị tráo nội dung từ offset 2 MiB** (run3: chỉ từ byte 32 trở đi;
  run5-c8: từ byte 0).
- 2,359 s: `qtdemux1` parse đúng `ftyp` → `moov` → `free` → `mdat`,
  chơi 36 frame (ct 4,417 — thấp hơn hẳn các run c8 khác 70–154
  frame, do mất ~2,4 s đầu vào instance chết + retry).
- 10,31 s (pipeline time): `qtdemux2` parse lại đúng toàn bộ
  `ftyp/moov/free/mdat` — instance thứ 3 xuất hiện MUỘN, KHÔNG có
  error event nào trong 8 s trước đó (grep `[2,4 s, 10,3 s]` = 0
  error). Trigger chưa rõ — có thể là restart thầm giữa lúc phát
  (cùng họ với "stall thầm", xem §5). Ghi là quan sát, không claim.

### 3.3 Các lần seek cấu trúc — bình thường, hằng số qua mọi run

| Seek | c2 | c8 | Ý nghĩa |
|---|---|---|---|
| Đuôi file | `size−32` = 2139941, `size−128` = 2139845, `size` = 2139973 | `size−32` = 8182953, `size−128`, `size` | qtdemux quét đuôi tìm moov (moov-at-end) — bình thường |
| Giữa file | `size/2` = 1069986 | `size/2` = 4091492 | qtdemux probe giữa file — hằng số mọi run; byte tại đó là mdat ngẫu nhiên (đã verify hex `2394d417fe87cf42` / `009be87a4af0e7fa`) — không liên quan bogus |
| Đầu file | `0`, `4096`, `8192`, … tuần tự 4096 B | tương tự | đọc atom + streaming mdat |

- Layout box đã verify bằng parser: c2 `ftyp@0 (32) → moov@32
  (3131) → free@3163 (8) → mdat@3171`; c8 `ftyp@0 (32) →
  moov@32 (9891) → free@9923 (8) → mdat@9931`. Khớp đúng các vị
  trí atom mà Y1 đã dùng để định vị giá trị bogus.

### 3.4 Giả thuyết 2 MiB — trạng thái sau Z1

| Giả thuyết | Trạng thái sau Z1 |
|---|---|
| Moov ở cuối gây đọc nhầm | BÁC (từ W1) — không đổi |
| webkitwebsrc cấp theo khối 2 MiB | KHÔNG ỦNG HỘ (từ X1) — không đổi |
| qtdemux pull-range 2 MiB / pull bắt đầu ở 2 MiB | **SỬA THÊM:** qtdemux hỏi ĐÚNG mọi offset (§3.1); "nhảy +2 MiB" không nằm ở phía qtdemux. Dạng tổng quát sau Z1: **buffer đầu tiên của instance bị tráo nội dung từ offset 2 MiB** (từ byte 0 hoặc từ byte 32) |
| Typefind/handoff push→pull tiêu thụ 2 MiB | VẪN MỞ, ứng viên duy nhất — thu hẹp: lỗi ở/below `webkitwebsrc.create()` hoặc handoff typefind/adapter; cần đọc source `webkitwebsrc` + đường pull của typefind (không tốn runtime, không ức chế) |
| Tải ức chế bogus | **BÁC** (Y1 + Z1: load tới 12,50 vẫn có bogus) |
| Logging GST nặng ức chế bogus | **CHỨNG MINH MỞ RỘNG:** cả `basesrc:5` RIÊNG cũng ức chế (2/12 vs 10/12); ức chế đi theo thể tích log |
| "basesrc:5 là nhẹ, thêm 1 element" | **BÁC** (§2: 2,2–5,1 MB/run, ngang chuỗi nặng X1) |

## 4. Hai pipeline blob — trigger đã xác định được 3/4 loại

Phân bố số instance `qtdemuxN` mỗi case: **1 instance: 6/12;
2 instance: 4/12; 3 instance: 2/12** (run1-c2, run5-c8).
Trigger (đọc từ log, từng case):

| Trigger | Case | Bằng chứng |
|---|---|---|
| Bogus giết instance → instance mới cứu | c2-run3 (2 inst), c8-run5 (3 inst) | §3.1–§3.2; `qtdemux1` parse đúng sau bogus |
| Flow-error (`Internal data stream error`, interr) giết instance → instance mới | c2-run1 (3 inst, interr ×2: qtdemux0 @1,289 s, qtdemux1 @1,776 s), c2-run2 (2 inst, interr @0,602 s sau khi ftyp đúng), c2-run4 (2 inst, interr @0,619 s) | `gst_qtdemux_loop: error: Internal data stream error / streaming stopped, reason error (-5)` |
| Instance pipeline http bị teardown lúc swap trước khi parse | c8-run4 (2 inst, 0 bogus, 0 interr) | `qtdemux0` chỉ reset, KHÔNG có dòng parse `ftyp` nào; `qtdemux1` parse `ftyp` đầu tiên @0,861 s, sau lần đọc đầu của `webkitwebsrc0` @0,753 s → `qtdemux1` = pipeline blob, `qtdemux0` = pipeline http bị bỏ |
| Instance thứ 3 muộn, không error | c8-run5 `qtdemux2` @10,31 s | §3.2 — trigger CHƯA RÕ (nợ mở) |

- **Đính chính nợ X1 §8 mục 3:** "ai tạo instance thứ hai" nay đã
  có đáp án cho 3/4 loại — bogus, interr, và teardown http lúc
  swap. Chỉ còn instance muộn không-error (c8-run5) chưa rõ.
- Tất cả 5 case blob được kiểm tra (`run2/3/4-c2`, `run4/5-c8`):
  `srcAtPlay=blob`, `finalSrcKind=blob`, `errEvents=0` ở tầng page
  — lỗi GStreamer không hiện thành video error event; retry diễn ra
  hoàn toàn trong GStreamer. (Swap: blobReadyMs 245–1106 ms.)

## 5. Stall thầm + deadlock — phát hiện mới (nặng hơn stall-timeout)

- **Stall-timeout cổ điển (play-timeout-10s, 0 frame): 0/12** ở lượt
  này (Y1a 4/12, Y1b 0/18). Tỉ lệ stall dao động mạnh giữa các lượt
  mà không có biến nào giải thích được — vẫn là quan sát, không
  claim nguyên nhân.
- **DEADLOCK WEBPROCESS (mới, nặng hơn): c2-run1.** Probe kẹt ở
  run1 ~10 phút (14:39→14:49) dù mọi timeout lý thuyết đều ≤100 s.
  Bằng chứng lúc kẹt: log GST dừng hẳn sau 10,09 s pipeline time
  (dòng cuối: `appsrc0` stop/flushing + `qos` event từ
  `http-src-1`); mọi process idle (node probe utime ~1,2 s,
  MiniBrowser/WebProcess CPU ~0,7%, thread toàn `futex`/`poll`
  wait); không case nào ghi JSON. Operator kill SIGTERM browser
  (MiniBrowser 17197 + Network 17221 + WebProcess 17241) → probe
  lập tức đi tiếp, run1 ghi `runError: "page.evaluate: Target page,
  context or browser has been closed"`, các case sau chạy bình
  thường (~20 s/case). Diễn biến trước deadlock: `qtdemux0` chết
  interr @1,289 s, `qtdemux1` chết interr @1,776 s (log có 2 interr
  + 3 instance) — deadlock xảy ra sau 2 lần retry interr, trong lúc
  teardown/chuyển instance thứ 3. Nguyên nhân nội bộ (kẹt main
  thread WebProcess? kẹt teardown GStreamer?) CHƯA xác định được
  từ log — cần repro có chủ đích + stack WebProcess (gdb), chưa làm.
- **BUG HARNESS CỦA HỌ PROBE (mới, probe-only, không phải
  production):** hàm `withTimeout` trong probe (copy từ U2 qua
  W1/X1/X1b/Y1 tới Z1) có `finally { clearTimeout(timer); }` chạy
  NGAY khi hàm return promise race — timer bị huỷ trước khi race
  settle nên **timeout KHÔNG BAO GIỜ bắn**. Mọi timeout
  launch/newPage/goto/addScriptTag/page.close/browser.close trong họ
  probe này đều là code chết. Đây là nguyên nhân plausibly khiến
  `page.close()`/`browser.close()` kẹt vĩnh viễn ở run1 (WebProcess
  không phản hồi close). Ngoài ra, Playwright `page.evaluate`
  `{timeout: 100000}` cũng đã không bắn trong 10 phút kẹt — lý do
  chưa xác định được từ bằng chứng hiện có, ghi là quan sát. **Z1
  KHÔNG sửa bug này** (probe đã chạy xong; sửa không kiểm chứng
  trong cửa sổ reboot còn lại thì rủi ro hơn lợi) — để cho đợt sau:
  viết lại `withTimeout` (chỉ clear timer sau khi settle) + thêm
  watchdog kill browser process nếu 1 case quá N giây. File probe
  Z1 giữ nguyên bản sao của Y1a (trừ chuỗi GST/port/tên) để kết quả
  so sánh được sạch.

## 6. Kiểm chứng + file thay đổi (stage, KHÔNG push)

- Không sửa code production (`apps/web/src/media.ts` sha `809bd3db…`
  giống hệt trước/sau). `node --check` probe + launcher pass.
  JSON đủ 24 case (12 blob + 12 prog), đối chiếu Counter khớp
  matrix log; launcher exit 0; display :193 đã release (log
  `Z1: released display :193`); không process mồ côi của Z1 (Xvfb
  :194/:195/:180 còn chạy là của luồng Z khác, không đụng).
- Phân tích bằng `hidden_files/round98-z1/summarize.py` (đọc JSON +
  grep GST log + trích `get_range` offset/length + đếm instance
  `qtdemuxN`); output tại `hidden_files/round98-z1/summary.txt`.
  Mọi con số offset trong §3 đã đối chiếu trực tiếp bằng grep trên
  log (không chỉ dựa vào script).
- Boot giữ nguyên 65bc5fb6 suốt lượt; không reboot trong lúc đo
  (reboot tiếp theo dự kiến ~15:28Z, lượt kết thúc 14:55Z).
- Caveat: lượt này chỉ có 12 case blob (n nhỏ); tỉ lệ bogus 2/12
  có nhiễu nhị thức lớn — nhưng hướng ức chế (10/12 → 2/12) cùng
  chiều và cùng cỡ với X1 (0/18), và thể tích log giải thích được
  cả ba điểm đo, nên kết luận ức chế là vững; con số 2/12 thì
  không nên trích như tỉ lệ thật (vốn đã bị ức chế).

### File thay đổi (3 entry)

- `docs/PHASE9_ROUND98_Z1_BLOB_BASESRC_LIMITS.md` — tài liệu này.
- `benchmarks/render/webkit_blob_flaky_98z1_basesrc.mjs` — probe Z1,
  copy y nguyên probe Y1a (đổi OUT/bundle/GST/port/tên case;
  GST = nhẹ W1 + `basesrc:5`).
- `benchmarks/results/webkit-blob-flaky-98z1-basesrc.json` — kết quả,
  24 case.

Batch stage: `phase9-round98-z1-blob-basesrc`
(`~/workspace/repo-1-push/paths-loop/phase9-round98-z1-blob-basesrc.txt`).
Log luồng: `hidden_files/round98-z1.md` +
`hidden_files/round98-z1/` (matrix98z1.log, gst/ 12 log blob
37 MB, bundle/, summarize.py, summary.txt, run-98z1.mjs,
media-ts-sha-before.txt). Clip faststart (binary, ngoài repo,
không stage): `~/workspace/round96-x1/clips-faststart/c2.mp4`,
`c8.mp4`.

## 7. Nợ mở (cho đợt sau)

1. **Cơ chế +2 MiB (trọng tâm, đã thu hẹp):** qtdemux được minh oan
   ở tầng pull-range; nghi phạm còn lại là `webkitwebsrc.create()`
   (đường đọc blob) hoặc handoff typefind/adapter. Bước tiếp theo
   KHÔNG tốn runtime: đọc source WebKit `webkitwebsrc` (hàm create,
   quản lý offset nội bộ) + đường pull của typefind, đối chiếu với
   timeline §3.1 (buffer đầu `offset 0` bị tráo từ byte 0 hoặc 32).
   Không bật thêm GST nặng để "đếm byte" nữa — đã chứng minh là
   phản tác dụng (mọi logging nặng đều ức chế hiện tượng).
2. **Deadlock WebProcess (run1):** cần repro có chủ đích (chạy lại
   matrix c2 dưới tải/interr?) + lấy stack WebProcess lúc kẹt (gdb)
   để xác định có phải main thread kẹt trong teardown GStreamer sau
   2 lần interr không.
3. **Instance thứ 3 muộn không-error (c8-run5 @10,31 s):** trigger
   chưa rõ; có thể là restart thầm giữa lúc phát — cần đếm instance
   theo thời gian trong lượt sau và đối chiếu với `ct`/frames.
4. **Sửa bug `withTimeout` họ probe + watchdog kill-browser:**
   viết lại timeout (chỉ clear sau settle), thêm watchdog mỗi case;
   verify bằng fault-injection (treo browser giả) trước khi dùng cho
   lượt sau. Probe-only, không đụng production.
5. **Stall thầm 0 frame:** 0/12 lượt này vs 4/12 Y1a — dao động chưa
   giải thích được; watchdog "không pipeline nào sống sau X ms"
   (nợ X1 §8 mục 4) vẫn chưa thiết kế.
6. Đứng yên: TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi
   (MemAvailable lượt này 1059–2627 MB, vẫn xa ngưỡng 6 GB; u2net
   là fallback chính thức); `.github/workflows/*.yml` 403; release
   gate không đổi.
