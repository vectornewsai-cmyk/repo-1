# Phase 9 đợt 99 — A1: 2 MiB basesrc — GHI LẠI ĐƯỢC BOGUS CÓ LOG basesrc (GIÁ TRỊ MỚI 541230788); GHI ĐĨA BỊ LOẠI LÀ YẾU TỐ ỨC CHẾ; THÀNH PHẦN ĐẶT RA 2 MiB ĐÃ XÁC ĐỊNH: `SMALL_MEDIA_RESOURCE_MAX_SIZE` CỦA webkitwebsrc

**Nợ gốc:** LIMITS gộp đợt 98 §4 mục 2: cần 1 run bogus CÓ `basesrc`
log để phân biệt logging nặng vs basesrc:5 là yếu tố ức chế; stall
thầm 0 frame; 2 pipeline blob; thành phần nào đặt ra con số 2 MiB.
**Ngày:** 2026-11-12 (lượt cron 00:35 +07; A1 đo 17:44–18:02Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push, KHÔNG commit).
Không sửa code production (`apps/web/src/media.ts` sha trước/sau đo
y hệt `809bd3db…`). Không đụng TTS 39, birefnet, không đụng
`.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐIỀU TRA XONG — 2 RUN BOGUS CÓ LOG basesrc ĐÃ THU ĐƯỢC
(GIÁ TRỊ MỚI); GHI ĐĨA BỊ LOẠI; 2 MiB ĐÃ CÓ TÊN THÀNH PHẦN + BẰNG
CHỨNG BINARY; CƠ CHẾ TRÁO BUFFER VẪN CHƯA CHỨNG MINH ĐƯỢC ĐIỂM NỐI.**

## 0. Thiết kế + môi trường

- **Boot:** 99338d31 (reboot ~17:26Z), xác minh bằng `boot_id` trước
  và sau đo; không reboot trong lúc đo; uptime 15 min lúc bắt đầu,
  41 min lúc kết thúc. Không có `round-in-progress.md` (chốt chặn
  qua). RAM: MemAvailable 1011–3453 MB theo từng case (đủ cho probe,
  xa ngưỡng birefnet 6 GB — không thử birefnet).
- **Hai run, cùng matrix, chỉ đổi chỗ ghi log GST** (copy y nguyên
  probe Z1 `webkit_blob_flaky_98z1_basesrc.mjs`, MATRIXFS c2/c8 × 6
  run blob+prog = 24 case/run, GST nhẹ W1 + `basesrc:5`):
  - **Run 1 ("a1", port 8904):** log GST ghi ra đĩa như Z1
    (`hidden_files/round99-a1/a-basesrc/gst/`, tổng ~27 MB).
  - **Run 2 ("a1d", port 8905):** log GST ghi ra tmpfs
    (`/dev/shm/round99-a1/gst/`, tổng ~41 MB, 0 byte ghi đĩa) —
    cùng chi phí format/debug-call, chỉ khác đường ghi. Sau run đã
    copy toàn bộ 12 log về đĩa (`a-devnull/gst/`, đối chiếu size
    từng file khớp 12/12) vì /dev/shm mất khi reboot; JSON giữ
    nguyên đường dẫn `/dev/shm/...` gốc (không sửa số liệu đã đo).
- **Watchdog ngoài (mới, probe-only):** `watchdog.py` theo dõi JSON
  từng 20 s; nếu 240 s không có case mới thì kill CHỈ process
  MiniBrowser/WebProcess/NetworkProcess là hậu duệ của launcher PID
  (không pkill theo tên — an toàn cho luồng song song). Cả 2 run:
  **0 lần kill, 0 deadlock** (khác Z1: 1 deadlock 10 phút). Bug
  `withTimeout` họ probe (timeout không bao giờ bắn) VẪN CHƯA SỬA
  trong bản copy này — giữ nguyên để so sánh được sạch; watchdog
  là lớp bù bên ngoài, không đụng probe.
- **Clip:** `~/workspace/round96-x1/clips-faststart/` (c2 2.139.973 B,
  c8 8.182.985 B; sha256 `f13d9176…` / `f6ceff58…`, y hệt Z1).
- **Cửa sổ đo:** nhiều luồng đợt 99 khác chạy song song; load1 lúc
  đo 0,58–16,60 — tải dao động mạnh giữa 2 run (run 1 c2: 4,35–
  10,64; run 2 c2: 0,58–2,23) nhưng theo Y1/Z1 tải không ức chế
  bogus nên không phải biến gây nhiễu cho kết luận ức chế.

## 1. Kết quả — 2 run, 24 case blob

| Lượt | Blob strict | Blob loose (frames > 0) | Prog | Log blob có bogus | Stall-timeout |
|---|---|---|---|---|---|
| **A1-run1 (ghi đĩa), 12 blob** | **12/12** | **12/12** | 12/12 | **0/12** | **0/12** |
| **A1-run2 (tmpfs), 12 blob** | **10/12** | **12/12** | 12/12 | **2/12** | **0/12** |
| Z1 (ghi đĩa) | 11/12 | 11/12 | 12/12 | 2/12 | 0/12 |
| Y1a (nhẹ, cùng matrix) | 2/12 | 7/12 | 12/12 | 10/12 | 4/12 |
| X1 (nặng) | 17/18 | 18/18 | 18/18 | 0/18 | — |

- **2 log bogus mới (run 2, cả 2 đều c2, CÙNG giá trị
  `541230788`):** `Lc2-a1d-blobA-run1` và `Lc2-a1d-blobA-run5`.
  Giá trị này CHƯA TỪNG xuất hiện trước đây (Z1/X1 chỉ thấy
  `2854668610` và `2991868683`). Đã verify bằng đọc trực tiếp file
  clip: `541230788 = 0x204286c4` = 4 byte tại **2 MiB+0** của c2
  (xem §3). Cả 2 run đều **FAIL error-event** (khác 2 run bogus của
  Z1 đều pass-có-bogus) — xem §4.
- **Fail⇒bogus gộp toàn lịch sử: 58/66 = 88%** (trước A1: 56/64;
  A1 thêm 2/2 — run 1: 0 fail; run 2: 2 fail đều có bogus). Tỉ lệ
  này ổn định qua 3 lượt basesrc:5.
- **Kích thước log 2 run cùng cỡ:** run 1: 872 KB–3,4 MB/run
  (tổng ~27 MB); run 2: 1,7–7,1 MB/run (tổng ~41 MB, log c8-run3
  7,1 MB là lớn nhất từng thấy ở họ probe này — do playback dài,
  218 frame). Thể tích log không đổi bản chất giữa 2 run.
- **Tải theo band (run 2):** load1<3: n=6, bogus 2/6; load1>=3:
  n=6, bogus 0/6 — NGƯỢC chiều Z1 (cả 2 bogus của Z1 ở load>=3).
  n=6/band nên chỉ ghi là quan sát, không kết luận; gộp Z1+A1 thì
  bogus xuất hiện ở mọi band tải — tải không phải yếu tố ức chế
  (khẳng định lại Y1/Z1).

## 2. Verdict: GHI ĐĨA BỊ LOẠI — ỨC CHẾ NẰM Ở CHI PHÍ DEBUG-CALL / NHIỄU THỜI GIAN, KHÔNG PHẢI GHI ĐĨA

- **Kết luận phân biệt:** run tmpfs (0 byte ghi đĩa, cùng format
  cost) cho bogus **2/12 — y hệt Z1 ghi đĩa (2/12)**. Nếu ghi đĩa
  (writeback I/O) là yếu tố ức chế thì tmpfs phải khôi phục tỉ lệ
  bogus về gần mức nhẹ (~70–83%); nó không khôi phục. **Ghi đĩa
  BỊ LOẠI làm cơ chế ức chế.** (Lưu ý: điều này cũng hợp lý a
  priori — 27–41 MB log qua page cache là I/O không đáng kể.)
- **Gộp 3 run basesrc:5 độc lập (cùng matrix, cùng chuỗi GST):**
  Z1 2/12 + A1-run1 0/12 + A1-run2 2/12 = **4/36 = 11%**, so với
  nhẹ Y1a 10/12 (83%) và X1b 8/12 (67%). Ức chế bởi logging nặng
  được khẳng định lại lần 3; run 1 cho 0/12 cũng nằm trong nhiễu
  nhị thức của p≈11–17% (P(0/12) ≈ 11–23%), không phải mâu thuẫn
  với Z1.
- **Còn lại chưa tách được:** "thể tích/format cost của debug
  call" vs "nhiễu thời gian do debug call làm chậm streaming
  thread" — cả hai cùng đi với việc bật GST_DEBUG và không tách
  được bằng 2 run này. Đó là distinction cuối cùng còn mở ở tầng
  đo lường (xem §7 mục 2). Không có cách nào vừa bật `basesrc:5`
  vừa đo tỉ lệ bogus thật — mâu thuẫn đo lường Y1 §5 mục 1 vẫn
  đứng, nay đã thu hẹp thành "không phải ghi đĩa".

## 3. Cơ chế — THÀNH PHẦN ĐẶT RA 2 MiB ĐÃ XÁC ĐỊNH

### 3.1 Hằng số 2 MiB trong source: `SMALL_MEDIA_RESOURCE_MAX_SIZE`

Đọc source WebKit (không tốn runtime, không ức chế): file
`Source/WebCore/platform/graphics/gstreamer/WebKitWebSourceGStreamer.cpp`
— changeset r248257 (bug 199998, 2019-08-03, "WebKitWebSrc's
internal queue can exhaust the WebProcess memory"):

```c
// Never pause download of media resources smaller than 2MiB.
#define SMALL_MEDIA_RESOURCE_MAX_SIZE 2 * 1024 * 1024
// Keep at most 2% of the full, non-small, media resource buffered. ...
#define HIGH_QUEUE_FACTOR_THRESHOLD 0.02
// Keep at least 20% of maximum queue size buffered. ...
#define LOW_QUEUE_FACTOR_THRESHOLD 0.2
```

Vai trò: cổng pause/resume download của `webkitwebsrc`. Trong
`dataReceived` (mỗi chunk mạng được wrap thành GstBuffer rồi push
vào `GstAdapter` nội bộ): nếu `size > 2MiB && queueSize > size ×
2% && !isDownloadSuspended && isSeekable` thì dừng loader
(`resource->stop()`). Trong `webKitWebSrcCreate` (phục vụ pull-range):
nếu `size > 2MiB && queueSize < size × 2% × 20% && PLAYING &&
isDownloadSuspended` thì resume (`webKitWebSrcMakeRequest`).
Cả 2 clip đều > 2 MiB (c2 2.139.973 B, c8 8.182.985 B) nên heuristic
này ĐANG BẬT trong mọi run của họ probe này.

**Bằng chứng binary (bản WebKit ĐÚNG của probe):** `strings` trên
`~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/lib/libwebkitgtk-6.0.so.4`
(libwebkitgtk-6.0.so.4.20.0) còn chứa `"doesHaveEOS: %s,
isDownloadSuspended: %s"` (đúng format string của patch r248257)
và `"queue size above low watermark, not restarting download"` —
máy móc pause/resume + `isDownloadSuspended` VẪN HIỆN DIỆN trong
bản build đang chạy (log string "Stopping resource loader" của
2019 không còn — code đã refactor, nhưng cơ chế còn).

**Caveat (ghi rõ):** giá trị literal `2 * 1024 * 1024` trong source
HIỆN TẠI chưa đọc được verbatim (không fetch được file current qua
URL có sẵn); kết luận "thành phần đặt ra 2 MiB là webkitwebsrc"
dựa trên: (a) patch giới thiệu hằng số trong đúng file này, (b)
máy móc pause/resume còn trong đúng binary đang chạy, (c) không
có hằng số 2 MiB nào khác trong các thành phần lân cận (basesrc
blocksize mặc định 4096; qtdemux không có hằng 2 MiB; typefind
không có). Điểm nối chính xác (dòng code nào tráo buffer) VẪN
CHƯA CHỨNG MINH — xem §7 mục 1.

### 3.2 Giá trị bogus mới 541230788 — dạng atom-1, shift đúng +2 MiB

Đã verify trực tiếp bằng đọc file (python `struct`, không qua
suy diễn từ log):

| Giá trị bogus | Hex | = byte tại | Dạng | Lượt thấy |
|---|---|---|---|---|
| 541230788 | 0x204286c4 | c2: 2 MiB+0 | atom 1 (byte 0–3 sai) | **A1-run2 ×2 (MỚI)** |
| 2854668610 | 0xaa26c942 | c2: 2 MiB+32 | atom 2 (byte 32–35 sai) | Z1 c2-run3 |
| 2991868683 | 0xb2544b0b | c8: 2 MiB+0 | atom 1 | X1, Z1 c8-run5 |

- Layout box đã verify lại: c2 `ftyp@0 (32) → moov@32 (3131) →
  free@3163 (8) → mdat@3171`; c8 `ftyp@0 (32) → moov@32 (9891) →
  free@9923 (8) → mdat@9931`. Số +32 = đúng kích thước box `ftyp`
  (32 byte): dạng atom-2 = nội dung tại 2 MiB+32 rơi vào vị trí
  atom 2 (offset 32); dạng atom-1 = nội dung tại 2 MiB+0 rơi vào
  vị trí atom 1 (offset 0). **Shift luôn đúng +2.097.152 byte,
  chỉ khác "rơi từ byte nào của buffer đầu".**
- Dòng thời gian run bogus `Lc2-a1d-blobA-run1` (bogus 541230788):
  typefind pull tuần tự từ `webkitwebsrc0` (0, 4096, … + quét đuôi
  + probe size/2 — mẫu chuẩn, xem §3.3) → `qtdemux0` reset lần đầu
  @1,428 s → **ngay lập tức** `pull_atom: atom has bogus size
  541230788` @1,477 s → `Internal data stream error` →
  `qtdemux1` reset @1,699 s → parse `ftyp` ĐÚNG → `moov` ĐÚNG →
  interr @2,785 s → `qtdemux2` reset @3,210 s → parse `ftyp` +
  `moov` ĐÚNG → chơi tới 54 frame. Run5 y hệt (bogus @0,930 s,
  qtdemux1 interr @2,192 s, qtdemux2 parse đúng @2,418 s, 87
  frame). **Không có lần đọc nào hỏi offset 2097152 cho lần đọc
  atom** (lần đọc `offset 2097152` duy nhất trong mỗi log là đọc
  streaming mdat giữa file, sau bogus — `webkitwebsrc1` cũng đọc
  2097152 khi phát tới giữa file; đó là đọc bình thường, đừng
  nhầm). Kết luận Z1 §3.1 đứng thêm 2 mẫu: qtdemux hỏi đúng mọi
  offset; 4 byte sai đã nằm sẵn trong buffer đầu (hoặc bị tráo
  trong adapter/typefind-handoff giữa nguồn và qtdemux).
- **Đính chính một đọc sai ban đầu của chính luồng này:** lúc đầu
  tôi tưởng 2 run bogus có "quét tuần tự 0→EOF trước khi parse"
  khác biệt với Z1; đối chiếu với run sạch (a1d-run2/run6:
  seq_prefix 47/36, tổng ranges 792/646) cho thấy quét tuần tự +
  tail/size-2 là MẪU CHUẨN của phase typefind ở mọi run (cả sạch
  lẫn bogus), không phải dấu hiệu bogus. Typefind pull toàn bộ
  file trước khi qtdemux0 được tạo (qtdemux0 reset lần đầu @1,428
  s / @0,928 s, muộn hơn lần đọc đầu ~0,5 s) — đó là hành vi bình
  thường của họ probe này, không phải cơ chế bogus.

### 3.3 Giả thuyết 2 MiB — trạng thái sau A1

| Giả thuyết | Trạng thái sau A1 |
|---|---|
| Moov ở cuối gây đọc nhầm | BÁC (từ W1) — không đổi |
| webkitwebsrc cấp theo khối 2 MiB | KHÔNG ỦNG HỘ (từ X1) — không đổi |
| qtdemux pull-range 2 MiB / pull bắt đầu ở 2 MiB | **BÁC Ở TẦNG PULL-RANGE (Z1 + A1: 4 mẫu bogus có log)** — qtdemux hỏi đúng mọi offset; tráo nằm ở/below `webkitwebsrc.create()` hoặc handoff typefind/adapter |
| Typefind/handoff push→pull tiêu thụ 2 MiB | VẪN MỞ, ứng viên duy nhất — thu hẹp thêm: buffer đầu của instance bị tráo nội dung từ offset 2 MiB (từ byte 0 hoặc byte 32); nghi phạm cụ thể nay là **cơ chế pause/resume download quanh `SMALL_MEDIA_RESOURCE_MAX_SIZE`** (§3.1) — nhưng điểm nối chưa chứng minh |
| Tải ức chế bogus | **BÁC** (Y1 + Z1 + A1) — không đổi |
| Logging GST nặng ức chế bogus | **CHỨNG MINH MỞ RỘNG (3 run độc lập, 4/36 = 11% vs nhẹ 10/12)** — không đổi |
| Ghi đĩa (writeback I/O) ức chế bogus | **BÁC (MỚI, §2)** — tmpfs 2/12 = ghi đĩa 2/12 |
| "basesrc:5 là nhẹ, thêm 1 element" | **BÁC** (Z1) — không đổi |

## 4. Hai pipeline blob + fail error-event có frames — trigger đã rõ thêm

- Phân bố instance `qtdemuxN`/case: run 1 **{1: 6, 2: 5, 3: 1}**;
  run 2 **{1: 4, 2: 6, 3: 2}** (Z1: {1: 6, 2: 4, 3: 2}).
- Cả 2 run bogus đều có **3 instance** với cùng kịch bản:
  `qtdemux0` chết bogus→interr → `qtdemux1` parse đúng rồi chết
  interr → `qtdemux2` parse đúng và chơi. Đây là lần đầu ghi
  được đầy đủ chuỗi 3-instance này 2 lần giống hệt nhau.
- **Fail error-event có frames (MỚI so với Z1):** cả 2 run bogus
  đều `playOk=False, failKind=error-event` NHƯNG frames 54/87,
  ct 5,417/6,832. Cơ chế ở tầng page: `play()` reject
  `NotSupportedError` ("The operation is not supported.") khi
  error event nổ (t=2,99 s / 2,40 s, `src=http` — element đã
  fallback về http, `finalSrcKind=http`); pipeline vẫn hồi phục
  qua `qtdemux2`/fallback và chơi tiếp. Tức "fail" ở đây = error
  đã hiện lên tầng page TRƯỚC khi instance thứ 3 hồi phục, không
  phải 0 frame. Đối chiếu: Z1 pass-có-bogus (error không hiện lên
  page); A1 fail-có-bogus (error hiện lên page). Cùng một lỗi
  GStreamer, khác nhau ở thời điểm error event chạm tới page so
  với lúc retry hồi phục — ranh giới này mong manh và chưa có
  biến nào giải thích được (ghi là quan sát).
- Instance thứ 3 muộn không-error của Z1 (c8-run5 `qtdemux2`
  @10,31 s): ở A1, `qtdemux2` của cả 2 run bogus đều xuất hiện
  NGAY sau interr của `qtdemux1` (3,210 s / 2,418 s), tức trigger
  là interr — không còn trường hợp "muộn không-error" nào trong
  24 case A1. Nợ Z1 §7 mục 3 thu hẹp: dạng muộn-không-error chỉ
  còn 1 mẫu duy nhất trong lịch sử (Z1 c8-run5).

## 5. Stall thầm 0 frame

- **Stall-timeout cổ điển (play-timeout-10s, 0 frame): 0/24** cả 2
  run A1 (Y1a 4/12, Y1b 0/18, Z1 0/12). Gộp 3 lượt basesrc:5:
  0/36 stall-timeout — dưới logging nặng, stall thầm gần như
  không xuất hiện (nhưng chính logging đã ức chế cả bogus nên
  không suy ra được tỉ lệ stall thật ở chế độ nhẹ).
- **Low-frame pass (quan sát, không phải stall):** run 1
  `Lc8-a1-blobA-run3`: 7 frame, ct 0,917, swapMs 2790 (swap chậm
  nhất lượt); `Lc2-a1-blobA-run5`: 28 frame; `Lc8-a1-blobA-run4`:
  27 frame — đều `playErr=null, failKind=ok`, tức phát chậm dưới
  tải chứ không lỗi. Không kết luận gì thêm.

## 6. Kiểm chứng + file thay đổi (stage, KHÔNG push)

- Không sửa code production (`apps/web/src/media.ts` sha
  `809bd3db…` giống hệt trước/sau cả 2 run). `node --check`
  cả 2 probe + launcher pass; `python3 -c ast.parse` summarize
  pass. JSON đủ 24 case/run (12 blob + 12 prog), đối chiếu
  Counter khớp matrix log; launcher exit 0 cả 2 run; display
  :194 đã release cả 2 lần (log `A1: released display :194`);
  watchdog 0 lần kill cả 2 run; không process mồ côi của A1
  (Xvfb :193/:195 còn chạy là của luồng khác, không đụng).
- Phân tích bằng `hidden_files/round99-a1/summarize.py` (đọc JSON +
  grep GST log + trích `get_range` + đếm instance `qtdemuxN`);
  output tại `hidden_files/round99-a1/summary.txt` (run 1) và
  `summary-devnull.txt` (run 2). Mọi con số offset/giá trị bogus
  trong §3 đã đối chiếu trực tiếp bằng grep + đọc file clip bằng
  `struct` (không chỉ dựa vào script). Log tmpfs đã copy về đĩa
  và đối chiếu size 12/12 khớp (xem §0).
- Boot giữ nguyên 99338d31 suốt lượt; không reboot trong lúc đo
  (reboot tiếp theo dự kiến ~19:26Z, lượt kết thúc 18:02Z).
- Caveat: mỗi run chỉ có 12 case blob (n nhỏ); tỉ lệ bogus 0/12
  và 2/12 có nhiễu nhị thức lớn — nhưng gộp 3 run basesrc:5
  (4/36) so với nhẹ (10/12) thì hướng ức chế là vững; con số
  từng run không nên trích như tỉ lệ thật (vốn đã bị ức chế).

### File thay đổi (5 entry)

- `docs/PHASE9_ROUND99_A1_BASESRC_LIMITS.md` — tài liệu này.
- `benchmarks/render/webkit_blob_flaky_99a1_basesrc.mjs` — probe
  run 1, copy y nguyên probe Z1 (đổi OUT/bundle/GST/port/tên
  case; GST = nhẹ W1 + `basesrc:5`).
- `benchmarks/render/webkit_blob_flaky_99a1_devnull.mjs` — probe
  run 2, như run 1 nhưng GST log ghi ra tmpfs `/dev/shm`
  (không ghi đĩa), port 8905, tên case `-a1d-`.
- `benchmarks/results/webkit-blob-flaky-99a1-basesrc.json` — kết
  quả run 1, 24 case.
- `benchmarks/results/webkit-blob-flaky-99a1-devnull.json` — kết
  quả run 2, 24 case.

Batch stage: `phase9-round99-a1-basesrc`
(`~/workspace/repo-1-push/paths-loop/phase9-round99-a1-basesrc.txt`).
Log luồng: `hidden_files/round99-a1/` (matrix99a1.log,
matrix99a1-devnull.log, watchdog.log, watchdog-devnull.log,
watchdog.py, run-99a1.mjs, summarize.py, summary.txt,
summary-devnull.txt, a-basesrc/{bundle,gst} 12 log ~27 MB,
a-devnull/{bundle,gst} 12 log ~41 MB). Clip faststart (binary,
ngoài repo, không stage): `~/workspace/round96-x1/clips-faststart/c2.mp4`,
`c8.mp4`. Nguồn WebKit đọc qua web (không stage):
changeset r248257 (bug 199998) + binary
`~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/lib/libwebkitgtk-6.0.so.4`.

## 7. Nợ mở (cho đợt sau)

1. **Cơ chế tráo buffer đầu (trọng tâm, đã thu hẹp tới
   webkitwebsrc):** nghi phạm cụ thể nay là pause/resume download
   quanh `SMALL_MEDIA_RESOURCE_MAX_SIZE` (§3.1). Bước tiếp theo
   KHÔNG tốn runtime: đọc source current của
   `WebKitWebSourceGStreamer.cpp` (`create()`, `dataReceived`,
   `webKitWebSrcMakeRequest`, xử lý seek) + đối chiếu timeline
   §3.2 (buffer đầu bị tráo từ byte 0 hoặc 32). Nếu cần bằng chứng
   runtime thì bật thêm category `webkitwebsrc` (dòng
   `[Buffering]` pause/resume) — nhưng đó lại là logging nặng,
   sẽ ức chế hiện tượng như mọi logging khác (mâu thuẫn đo lường
   §2); chỉ làm khi chấp nhận tỉ lệ bogus thấp.
2. **Tách "format cost" khỏi "nhiễu thời gian" của debug call:**
   cần 1 biến thể chỉ giảm format cost mà giữ nguyên debug-call
   (vd: category log rỗng) hoặc ngược lại — chưa thiết kế; đây là
   distinction cuối cùng còn mở ở tầng đo lường.
3. **Fail⇒bogus 58/66 = 88% vẫn đứng; ranh giới pass-có-bogus
   (Z1) vs fail-có-bogus (A1)** — cùng lỗi GStreamer, khác nhau ở
   thời điểm error event chạm page so với retry; chưa có biến giải
   thích — cần đếm error-event theo thời gian trong lượt sau.
4. **Instance thứ 3 muộn không-error (Z1 c8-run5 @10,31 s):** chỉ
   còn 1 mẫu duy nhất trong lịch sử; A1 không tái hiện — để đó,
   không ưu tiên.
5. **Deadlock WebProcess (Z1 run1):** A1 0 lần/48 case (watchdog
   0 kill) — không tái hiện; repro có chủ đích + stack gdb vẫn
   là nợ mở (Z1 §7 mục 2).
6. **Sửa bug `withTimeout` họ probe + watchdog kill-browser:**
   watchdog ngoài của A1 đã chứng minh hiệu quả (0 kill vì không
   kẹt, nhưng cơ chế sẵn sàng); sửa `withTimeout` trong probe vẫn
   để cho đợt sau kèm fault-injection verify (Z1 §7 mục 4).
7. Đứng yên: TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi
   (u2net là fallback chính thức); `.github/workflows/*.yml` 403;
   release gate không đổi.
