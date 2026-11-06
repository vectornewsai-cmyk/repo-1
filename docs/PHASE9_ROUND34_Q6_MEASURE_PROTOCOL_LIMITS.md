# Phase 9 đợt 34, luồng Q6 — GOP dày clip mẫu seek + probe đo fps ngược chuẩn — LIMITS

Ngày: 01/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG
binary vào repo, KHÔNG code giả/mock. KHÔNG sửa code sản phẩm
(`apps/web/src`, i18n, bridge) và KHÔNG sửa script của luồng khác —
chỉ thêm 2 script probe mới của riêng Q6 + file này + 2 JSON kết quả
dạng text. Đọc trước khi làm: `docs/PHASE9_ROUND33_LIMITS.md` §3
mục 2 (quy tắc đo fps ngược) và mục 8 (nợ đứng: GOP dày cho seek
chưa đo). File này đóng đúng 2 mục đó: nợ GOP dày (§1) và hiện thực
hoá quy tắc đo (§2–§3).

## 0. Kết quả nói trước

1. **GOP dày của clip mẫu seek ĐÃ ĐO THẬT: 30 frame chính xác**
   (keyframe ở frame 0, 30, 60 trên cả 2 clip dày; khung thời gian
   1,13–1,77 s vì timestamp gốc không đều — xem §1). Clip dày là
   re-encode từ đúng blob mẫu đã trích, lệnh ffmpeg ghi đầy đủ để
   tái tạo; nó KHÔNG phải output gốc của MediaRecorder (Chrome
   không cho đặt keyframe interval qua MediaRecorder).
2. **Phát hiện phụ (trung thực, sửa hiểu biết cũ): clip mẫu gốc
   trích lần này chỉ có ĐÚNG 1 keyframe** (ở 0) — GOP = toàn bộ
   clip ~4 s, thưa hơn cả số ~3,4 s của P2. Lý do nhất quán với dữ
   liệu: clip lần này chỉ có 81/89 frame (ghi dưới tải, rAF đói)
   trong khi clip P2 có 119/120 frame và keyframe thứ 2 ở frame
   ~102. Suy luận: ngưỡng keyframe của MediaRecorder/VP9 theo SỐ
   FRAME (~100), không phải mốc thời gian 3,4 s cố định — suy luận
   từ 2 mẫu, chưa phải spec encoder, ghi rõ để khỏi trích dẫn
   thành luật.
3. **Probe đo chuẩn đã chạy thật và đã chứng minh tác dụng:**
   7 lượt qua probe, chỉ 1 lượt được gắn `quiet` (dense-1, 16,07
   fps) — còn lại đều `under-load` với đủ lý do, kể cả 2 lượt sát
   ngưỡng (sparse-2, dense-2). Probe KHÔNG cho phép số dưới tải
   mạo nhận baseline quiet, và cũng không cho phép gộp 1 lượt
   quiet lẻ thành "baseline". **Baseline quiet 3+3 lượt KHÔNG đạt
   được trong đợt này** (0 lượt quiet thưa, 1 lượt quiet dày, lại
   khác bundle với baseline đợt 33) — xem §3. Đây là kết quả trung
   thực, không phải thất bại của probe: probe làm đúng việc nó
   sinh ra để làm.

## 1. GOP dày thật của clip mẫu seek (đóng nợ Round 33 §3.8)

### 1.1 Clip nào dùng (ghi rõ, không mập mờ)

Clip mẫu seek KHÔNG phải file trên đĩa: `apps/web/src/sample.ts`
tự sinh bằng Canvas + MediaRecorder trong trình duyệt (VP9
640×360, 4 s/clip, tên `mau-1.webm`/`mau-2.webm`, 2 variant màu).
File trích của P2 chỉ nằm ở /tmp nên đã mất; Q6 trích lại bằng
probe mới `apps/web/scripts/probe-round34-q6-sample-gop-extract.mjs`
(profile Chrome mới → app tự `loadSample()` → chặn
`document.createElement` để giữ video pool off-DOM vì
`querySelectorAll("video")` trả rỗng → fetch blob: URL → ghi
`.webm`). Bundle snapshot lúc trích: `index-Cao1Pxfd.js` (dist đã
bị luồng khác build lại giữa đợt — số GOP là thuộc tính nội dung
nên không phụ thuộc bundle, khác với số fps).

| Clip gốc trích lại | Byte | Frame | Keyframe (ffprobe frames + packets, khớp nhau) | Kết luận |
|---|---|---|---|---|
| `q6-mau-1.webm` (variant 0) | 382.704, sha256 `82433de2…` | 81, pts 0 → 3,973 s, bước trung vị 0,037 s | chỉ [0] | GOP = toàn clip ~4 s |
| `q6-mau-2.webm` (variant 1) | 451.517, sha256 `b59f1086…` | 89, pts 0 → 3,916 s, bước trung vị 0,034 s | chỉ [0] | GOP = toàn clip ~4 s |

Phương pháp ffprobe đã kiểm chứng trước trên fixture GOP đã biết:
`sparse-gop-flat.mp4` cho keyframe [0, 10, 20] (đúng GOP 300) và
`dense-gop-flat.mp4` cho keyframe mỗi 1,0 s (đúng GOP 30) — nên số
trên không phải artefact parse.

### 1.2 Đối chiếu với số thưa của P2 (không mâu thuẫn, mà làm rõ)

P2 đợt 32: 119/120 frame, keyframe ở ~0 s và ~3,4 s (ở 30 fps danh
nghĩa là frame ~102). Q6: 81/89 frame, không có keyframe thứ 2 dù
clip dài tới 3,97 s. Hai quan sát cùng phù hợp với đúng một giả
thuyết: **keyframe thứ 2 xuất hiện theo số frame (~100 frame),
không theo mốc thời gian 3,4 s** — nếu theo thời gian thì clip Q6
đã phải có keyframe ở 3,4 s. Giả thuyết còn lại (scenecut theo nội
dung) yếu hơn vì nội dung 2 lượt cùng generator, cùng dải thời
gian. Hệ quả thực tiễn:

- Số frame clip mẫu PHỤ THUỘC TẢI lúc ghi: dưới tải, rAF đói
  (bước frame đầu 0,193 s — gấp ~6× bước danh nghĩa 0,033 s) nên
  `captureStream(30)` chỉ ghi được 81/89 frame thay vì 119/120.
  Đừng trích dẫn "clip mẫu 120 frame" như hằng số.
- Mọi số seek O3/P2 đều đo trên GOP thưa (P2: ~3,4 s; Q6: cả clip
  1 keyframe). Chưa có số seek nào trên GOP dày của nội dung này.

### 1.3 Clip dày: đo thật, không lấy `-g 30` làm chứng

Lệnh tái tạo (ffmpeg 8.1.2, từ đúng blob đã trích):

```
ffmpeg -v error -y -i q6-mau-<i>.webm -c:v libvpx-vp9 -b:v 2500000 \
  -g 30 -keyint_min 30 -sc_threshold 0 -an -deadline good -cpu-used 2 \
  q6-mau-<i>-dense-gop30.webm
```

(`-sc_threshold 0` tắt keyframe do scenecut để GOP đo được là GOP
do `-g` đặt, không lẫn keyframe nội dung.)

| Clip dày | Byte / sha256 | Frame | Keyframe (frame) | Khoảng frame | Khoảng thời gian |
|---|---|---|---|---|---|
| `q6-mau-1-dense-gop30.webm` | 524.531 / `bd7bf6c9…` | 81 | [0, 30, 60] | [30, 30] | [1,774 s, 1,502 s] |
| `q6-mau-2-dense-gop30.webm` | 677.236 / `d98d24ca…` | 89 | [0, 30, 60] | [30, 30] | [1,388 s, 1,130 s] |

**Kết luận: GOP dày thật = 30 frame chính xác trên cả 2 clip.**
Cần nói rõ: khoảng THỜI GIAN không phải 1,0 s đều vì timestamp
gốc không đều (hậu quả của ghi dưới tải, §1.2) — GOP của encoder
đếm theo frame. Đợt sau đo seek trên clip dày này phải nhớ điểm
này: seek theo giây sẽ không ứng với đúng 1,0 s/GOP. File `.webm`
nhị phân chỉ nằm ở scratch `~/workspace/tmp-round34-q6/` (không
vào batch); bằng chứng text đầy đủ ở
`benchmarks/results/v34-q6-sample-gop.json`.

## 2. Probe đo chuẩn: hiện thực hoá quy tắc Round 33 §3.2

File: `apps/web/scripts/probe-round34-q6-measure-protocol.mjs`.
Bọc harness N2 nguyên vẹn (`clicktest-round31-n2-reverse-fps-pipe.mjs`,
không sửa 1 dòng), không build lại dist (harness tự snapshot dist
hiện tại; Q6 không build để khỏi đua với luồng khác).

### 2.1 Mỗi lần đo tự ghi những gì (đúng 4 yêu cầu của task)

- **(a) Tải máy:** loadavg 1/5/15 phút trước + trong + sau lượt
  (đọc `/proc/loadavg`; N2 đã ghi load trong lượt, probe ghi thêm
  pre/post), top 8 tiến trình theo %CPU trước/sau, số tiến trình
  Chrome TRƯỚC lượt (đếm bằng pgrep trên cmdline — phát hiện
  browser luồng khác; lưu ý pgrep tự loại chính nó, và cmdline
  của probe không chứa chuỗi pattern nên không tự đếm).
- **(b) Tốc độ phát xuôi cùng bundle:** `forward.interpRate` của
  harness N2 (mẫu 2 → mẫu cuối, trừ độ trễ khởi động). Đây là đối
  chứng rẻ và sạch: phát xuôi decode tuần tự, hold ~0, nên xuôi
  lệch khỏi 1.00 phản ánh tải máy chứ không phản ánh chi phí seek.
- **(c) Gap rAF:** từ probe rAF toàn cục của N2, nhưng chỉ dùng
  phase XUÔI để phân loại (gapP50/P95/max, số gap >100 ms cả
  nguyên lẫn trừ tick biên, predictedRate). Phase ngược KHÔNG dùng
  để phân loại — có chủ ý: phase ngược đi qua seek/decode từng
  frame nên gap dài có thể là chi phí seek thật, không phải tải
  máy; phase xuôi mới là đối chứng sạch.
- **(d) Nhãn chế độ tải + câu cấm so sánh:** mỗi output JSON đều có
  `loadLabel` (`quiet` | `under-load`), `labelReasons` (đủ lý do),
  và trường `comparability` nguyên văn: chỉ so sánh hồi quy giữa
  các lượt CÙNG loadLabel (và cùng bundle, hoặc A/B cùng phiên);
  số under-load KHÔNG được dùng làm baseline quiet.

### 2.2 Ngưỡng QUIET (hiệu chuẩn từ dữ liệu đã đo, không bịa)

QUIET khi và chỉ khi TẤT CẢ cùng đúng; vi phạm 1 điều → under-load:

| Tín hiệu | Ngưỡng QUIET | Cụm quiet đã đo (P5 đợt 33) | Cụm tải đã đo (P5 đợt 32) |
|---|---|---|---|
| load1 trước-xuôi, trước-ngược, cuối lượt | < 2,0 (máy 4 vCPU → < 0,5/core) | 0,81–1,68 | 2,85–8,74 |
| forward interpRate | [0,98, 1,02] | 1,001–1,010 | thấp tới 0,648 |
| gap rAF P50 phase xuôi | ≤ 0,015 s | ~5–8 ms | — |
| predictedRate xuôi (trừ tick biên) | ≥ 0,98 (mất do gap >100 ms < 2% phase) | 0,993–0,999 | 0,624 |
| tiến trình Chrome trước lượt | = 0 | — | — |

Ngưỡng load1 = 2,0 nằm giữa hai cụm đã quan sát; ngưỡng xuôi
[0,98, 1,02] lấy từ chính cận "rAF khỏe" ≥ 0,98 của P5. Và đúng bài
học P5 §1.1: **không bao giờ phân loại chỉ bằng loadavg** (load
7,47 vẫn có rAF khỏe trong đợt 32) — vì vậy probe bắt buộc cả 5
nhóm tín hiệu, thiếu trường nào cũng thành lý do under-load (trừ
mode classify lượt cũ, xem §2.3).

**Hiệu chuẩn v1 → v2 (ghi rõ, không sửa lén):** bản v1 yêu cầu số
gap >100 ms (trừ tick biên) = 0 tuyệt đối, nhưng kiểm tra lại cụm
quiet đợt 33 của P5 cho thấy 2/6 lượt quiet có đúng 1 gap như vậy
(lost 0,024–0,028 s, predictedRate trừ tick biên 0,993) — ngưỡng v1
quá chặt so với chính dữ liệu quiet đã công nhận. Bản v2 đổi sang
tiêu chí lost-rate (predictedRate trừ tick biên ≥ 0,98): cụm quiet
đợt 33 đạt 0,993–0,999, lượt đói đợt 34 đạt 0,624, lượt dense-1 đợt
34 đạt 0,993 — biên cách xa cả hai phía. Mọi lượt đợt 34 đều được
phân loại lại bằng v2 ở cuối đợt (file kết quả ghi protocol v2 +
trường `relabeled`); số gap và lost vẫn ghi trong `signals` để
đối chiếu, chỉ không còn là tiêu chí tuyệt đối.

### 2.3 Cách dùng + mode classify lại lượt cũ

Đo mới:

```
Q6_VIDEO=<fixture.mp4> Q6_SCRATCH=<scratch lượt> Q6_DISPLAY=:91 \
Q6_PORT=4191 Q6_OUT=<labeled.json> \
  node apps/web/scripts/probe-round34-q6-measure-protocol.mjs run
```

Thoát: 0 = đã gắn nhãn (kể cả under-load — gắn nhãn thành công
cũng là kết quả); 1 = harness PARTIAL nhưng vẫn gắn nhãn được
(fps vẫn dùng được, theo phân tích PARTIAL mẫu chuyển tiếp của P5);
2 = blocker (harness exit 2 hoặc thiếu `forward-hold.json` →
NO_RESULT, không nhãn, không bịa).

Phân loại lại lượt cũ (không chạy browser):

```
node apps/web/scripts/probe-round34-q6-measure-protocol.mjs classify \
  <forward-hold.json> [pre-chrome-count]
```

Lượt cũ thiếu snapshot tiến trình → output ghi rõ
`processSnapshot: "missing"` kèm caveat: nhãn chỉ từ load+fwd+rAF
theo cách P5 đã làm, chưa loại trừ được browser luồng khác. Đừng
dùng mode này để "rửa" số cũ thành quiet chắc chắn.

### 2.4 Kiểm chứng probe (không phải claim suông)

- `node --check` cả 2 script mới: pass.
- Lượt sparse-1 chạy thật qua probe (§3): gắn `under-load` với
  đủ 7 lý do, fps 0,51 — đúng bản chất đói CPU lúc đó, và quan
  trọng nhất: nó KHÔNG thể bị trích dẫn nhầm thành baseline quiet
  vì nhãn nằm ngay trong file kết quả.
- Probe trích GOP (§1) chạy thật: trích đủ 2 clip, `node --check`
  pass, manifest có sha256; 2 phương pháp ffprobe (frames +
  packets) cho cùng số keyframe.

## 3. Baseline quiet đo lại — KẾT QUẢ CUỐI: KHÔNG ĐẠT (1/7 lượt quiet)

Runner nền `~/workspace/tmp-round34-q6/run-q6-baseline-wait.sh`
(scratch, không stage): chờ tới khi load1 < 2,0 và 0 tiến trình
Chrome (cửa sổ mở ra sau ~5 phút chờ: load 6,79 → 1,17, chrome
13 → 0), rồi chạy tuần tự dense-1, sparse-2, dense-2, sparse-3,
dense-3, sparse-4 (thêm sparse-4 vì sparse-1 đã hỏng nhãn). Nhưng
giữa batch, các luồng Q khác bùng tải trở lại (Q1 copy dist, load
lên tới 13–17, 13–16 tiến trình Chrome) nên chỉ lượt đầu giữ được
nhãn quiet. Tất cả lượt dưới đây đã phân loại lại bằng v2 (§2.2);
file kết quả ở `benchmarks/results/v34-q6-reverse-*.json`.

| Lượt | Bundle | Nhãn v2 | fps ngược | Xuôi | Verdict N2 | Lý do nhãn (tóm tắt) |
|---|---|---|---|---|---|---|
| sparse-1 | `M8MgMXGf` | under-load | 0,51 | 0,596 | PARTIAL | load1 2,33/2,21/3,15; P50 0,079 s; predRate 0,624; 16 Chrome |
| dense-1 | `BboLRS3K` | **quiet** | **16,07** (draw 222/13,82 s) | 0,981 | PASS | — (đủ mọi tiêu chí; predRate 0,993) |
| sparse-2 | `BboLRS3K` | under-load (sát ngưỡng) | 5,72 | 1,007 | PASS | load1 trước-ngược 2,16; predRate 0,955 |
| dense-2 | `BboLRS3K` | under-load (sát ngưỡng) | 5,27 | 0,910 | PASS | xuôi ngoài band; predRate 0,966 |
| sparse-3 | `4i4xoITZ` | under-load | 3,82 | 0,835 | PARTIAL | load1 3,57/4,25; P50 0,021 s; predRate 0,828; 16 Chrome |
| dense-3 | `Bk6WxuML` | under-load | 2,31 | 0,501 | PASS | load1 8,55/10,85/13,34; predRate 0,626; 15 Chrome |
| sparse-4 | `4i4xoITZ` | under-load | 1,36 | 0,608 | PARTIAL | load1 15,25/17,52/15,83; predRate 0,695; 13 Chrome |

**Kết luận, nói thẳng:**

- **Không có baseline quiet đợt 34:** cần 3 lượt quiet/GOP trên
  cùng bundle; thực tế chỉ có 1 lượt quiet dày (dense-1, n=1) và
  0 lượt quiet thưa, lại trên bundle `BboLRS3K` khác bundle
  `Cqp7uur1` của baseline đợt 33. **Baseline quiet mới nhất vẫn
  là số đợt 33 của P5 (thưa tv 7,09; dày tv 22,39).** Lượt dense-1
  (16,07) là 1 điểm dữ liệu quiet, KHÔNG được gọi là baseline và
  KHÔNG được so trực tiếp với tv 22,39 của đợt 33 (khác bundle,
  n=1 so với n=3).
- **Cấm so sánh hồi quy từ bảng này:** mọi lượt under-load (kể cả
  2 lượt sát ngưỡng) đều không dùng để kết luận code nhanh/chậm.
  Đặc biệt KHÔNG được lấy dense-2 (5,27) so với dense-1 (16,07)
  rồi claim hồi quy — 2 lượt cùng bundle `BboLRS3K` nhưng khác
  nhãn tải; chênh lệch này minh hoạ ĐỘ NHẠY THEO TẢI của phép đo
  (cùng bundle mà fps đổi 3× chỉ vì tải), chính là lý do quy tắc
  §2 tồn tại.
- **Vì sao batch không chờ thêm:** sau khi cửa sổ quiet đóng
  (load 13–17), chờ tiếp không có nghĩa — các luồng Q khác đang
  ở cao điểm. Baseline quiet phải đo lại trong một cửa sổ mà
  dist được ĐÓNG BĂNG (xem nợ §5.8): 4 bundle khác nhau trong 7
  lượt cho thấy ngay cả khi máy quiet, dist đổi giữa chừng cũng
  phá điều kiện "cùng bundle" của baseline.

## 4. File đổi/thêm — CHỈ của Q6

- Mới: `apps/web/scripts/probe-round34-q6-sample-gop-extract.mjs`
  — probe trích blob clip mẫu (WS CDP, Xvfb, snapshot dist).
- Mới: `apps/web/scripts/probe-round34-q6-measure-protocol.mjs`
  — probe đo chuẩn (bọc N2 + gắn nhãn tải + mode classify).
- Mới: `docs/PHASE9_ROUND34_Q6_MEASURE_PROTOCOL_LIMITS.md` — file này.
- Mới: `benchmarks/results/v34-q6-sample-gop.json` — bằng chứng
  GOP dạng text (native + dày + lệnh tái tạo + kiểm chứng phương pháp).
- Mới: `benchmarks/results/v34-q6-reverse-{sparse-1,dense-1,sparse-2,dense-2,sparse-3,dense-3,sparse-4}.json`
  — 7 lượt đo có nhãn v2 (chỉ dense-1 là quiet; còn lại
  under-load — xem §3). File ghi đủ load, tiến trình, xuôi, rAF,
  lý do nhãn và trường `relabeled` (v1 → v2).
- KHÔNG sửa: mọi code sản phẩm, i18n, bridge, script của luồng
  khác, paths-loop, build-loop-log (parent gộp). KHÔNG push, KHÔNG
  tag. Blob `.webm` và snapshot dist chỉ nằm ở scratch
  `~/workspace/tmp-round34-q6/` (không vào batch).

## 5. Cái gì CHƯA chứng minh / nợ còn lại (trung thực)

1. **Baseline quiet 3+3 lượt: KHÔNG ĐẠT trong đợt này** (§3) — chỉ
   1 lượt quiet dày (n=1, bundle khác đợt 33), 0 lượt quiet thưa.
   Baseline quiet mới nhất vẫn là số đợt 33 của P5 (thưa tv 7,09;
   dày tv 22,39, bundle `Cqp7uur1`). Đợt sau muốn đo baseline phải
   có cửa sổ mà cả máy quiet LẪN dist đóng băng (xem §5.8).
2. **Số fps ngược trên clip mẫu VP9 (thưa/dày): CHƯA ĐO.** Đợt này
   chỉ đo GOP của clip mẫu + chuẩn hoá probe; fps ngược vẫn đo
   trên fixture H.264 1280×720 của N2 như mọi đợt trước. Clip dày
   VP9 nay đã có sẵn để đợt sau đo fps ngược trên đúng nội dung
   mẫu (cần harness import webm + đo seek — ngoài phạm vi Q6).
3. **Ngưỡng keyframe ~100 frame của MediaRecorder: SUY LUẬN từ 2
   mẫu, chưa phải spec.** Cần thêm mẫu (clip ghi lúc rảnh với số
   frame khác nhau) mới khẳng định được.
4. **Safari / máy thật / dpr > 1 / viewport khác:** vẫn chưa đo
   (nợ chung từ Round 33 §3.8).
5. **A/B `seekElement` (nợ Round 33 §3.1):** không thuộc Q6, vẫn mở
   cho luồng sở hữu seek.
6. **Nối `ReverseFrameCache` + hook rAF vào preview:** vẫn mở
   (Round 33 §3.3).
7. Dist là tài nguyên chia sẻ: bundle đã đổi `Cqp7uur1` →
   `Cao1Pxfd` (lúc trích GOP) → `M8MgMXGf` (sparse-1) →
   `BboLRS3K` (dense-1/sparse-2/dense-2) → `4i4xoITZ` →
   `Bk6WxuML` trong cùng buổi do luồng khác build; mọi số fps
   phải gắn với bundle ghi trong file của chính lượt đó, không
   gắn với "dist hiện tại" lúc đọc.
8. **Cải tiến probe cho đợt sau (chưa làm, ngoài phạm vi Q6):**
   cho probe nhận 1 dist đóng băng (ví dụ `Q6_DIST`) để cả batch
   6 lượt chạy trên đúng 1 bundle dù dist trên đĩa đổi giữa
   chừng; hiện tại harness N2 snapshot dist tại mỗi lượt nên
   bundle vẫn trôi theo dist. Chỉ làm khi parent đồng ý, vì chạy
   trên dist đóng băng khác với "bundle hiện tại" cần ghi rõ
   trong file kết quả.
