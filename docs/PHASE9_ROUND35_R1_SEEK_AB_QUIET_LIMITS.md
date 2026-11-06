# Phase 9 đợt 35, luồng R1 — A/B `seekElement` quiet 3+3 thật — LIMITS

Ngày: 02/11/2026, lượt browser 02:16–02:29 giờ +07 (UTC 19:16–19:29
01/11). KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo,
KHÔNG code giả. Luồng này KHÔNG sửa code sản phẩm, KHÔNG sửa
harness N2, KHÔNG sửa probe Q6 — chỉ thêm 2 script đo của riêng
R1 + file này + 12 JSON kết quả. Không đụng paths-loop,
build-loop-log (parent gộp batch). Đọc trước khi làm:
`docs/PHASE9_ROUND34_LIMITS.md` §3 mục 1 và
`docs/PHASE9_ROUND34_Q1_SEEK_AB_LIMITS.md` (đặc biệt §5.3:
hiện tượng single-3) + `docs/PHASE9_ROUND34_Q6_MEASURE_PROTOCOL_LIMITS.md`
§2 (chuẩn probe v2).

## 0. Kết luận ngắn (kèm số liệu, không đoán)

**Dư fps ngược thưa ~20% KHÔNG quy kết được cho settle-wait của
retry-loop. KHÔNG revert `seekElement`.** Bằng chứng quiet 3+3
thật trên CÙNG một cây đóng băng (xem §1):

| Tập quiet 3+3 (v2 quiet + decode HEALTHY) | retry-loop | single-shot | Chênh lệch |
|---|---|---|---|
| Trung vị | **8,907** fps | **8,813** fps | single **−1,1%** |
| Trung bình | 8,999 fps | 8,568 fps | single **−4,8%** |
| Khoảng | 8,746–9,345 | 7,324–9,567 | single rộng hơn (30,6% so với 6,9%) |
| Tỉ số từng cặp (theo thứ tự nhận) | — | — | 0,99× / 1,09× / 0,78× — **đổi dấu** |

Nếu settle-wait gây ra dư 20% thì single phải cao hơn retry một
cách hệ thống ~20% ở cả trung vị, trung bình và đa số cặp — không
có dấu hiệu nào như vậy; điểm ước lượng còn nghiêng nhẹ về phía
retry. Điều kiện revert mà task đặt ra ("retry-loop thua có ý
nghĩa thống kê") KHÔNG xảy ra.

Dư 20% cũ được giải thích lại như sau: quiet retry đợt 33 tv 7,09
so với 1 điểm N2 8,97 là so sánh XUYÊN cây và xuyên phiên (cây đã
từ 187 module lên 212 module, bundle khác, phiên khác). Trên cây
hiện tại, cả hai phía đều ~8,8–8,9 trung vị, và điểm N2 8,97 nằm
ngay trong phân phối single hiện tại (7,32–9,57) và sát trung vị
retry (8,907). Đây là củng cố trực tiếp cho giả thuyết (b) của
Q1 đợt 34 (phương sai điểm n=1 + trôi cây), nay đo được bằng
quiet 3+3 thay vì chỉ suy luận.

Không được claim: "settle-wait tốn đúng 0%". Độ lệch chuẩn phía
single là 1,141 fps (13%) ở n=3 — một hiệu ứng nhỏ (<~10%) không
phân giải được với cỡ mẫu này. Claim chính xác là: **không có
hiệu ứng lớn ~20% theo hướng single**; hiệu ứng nếu có thì nhỏ
và chìm trong phương sai lượt-lượt.

## 1. Phương pháp (2 cổng, 1 cây đóng băng)

- **Harness y nguyên đợt 31 N2**, bọc bằng probe đo chuẩn Q6
  (`probe-round34-q6-measure-protocol.mjs`, không sửa 1 dòng;
  bản này đã có hỗ trợ `Q6_DIST` của luồng R2 đợt 35 — R1 chỉ
  DÙNG, không sửa). Video y nguyên các đợt trước:
  `~/workspace/tmp-round27-k4/sparse-gop-flat.mp4` (GOP 300,
  1280×720, 30 s, 30 fps, H.264). Display `:90` / port `4190`.
- **Cây đóng băng R1:** copy `apps/`, `packages/`, `package.json`
  từ cây live lúc ~02:09 +07, kiểm tra lại bằng
  `rsync --checksum` lần 2 (không lệch, ngoài symlink `out`
  treo vốn có). `seek.ts` gốc sha256
  `efb0160b93019a3d6d9486ebc84951003889195358e99bdadf9854476b7af11c`
  — khớp đúng sha của đợt 34 Q1, tức code seek live không đổi
  từ đợt 34. Hai bundle build từ cây này, chỉ khác đúng 1 hunk
  callback `seeked` (patch đợt 34 Q1, đổi tên chú thích thành
  "đợt 35 R1", nội dung hunk y nguyên):
  - retry: `index-BqxQgBuf.js`, 1 023,94 kB, 212 module,
    sha256 `f2fb01664045fcac30275d0d2459e38188f28b4413988d33063331d503b4f65d`.
  - single: `index-xfaJXEFE.js`, 212 module,
    sha256 `fffcd2c019461441b16860879841b0c019ef6fb2085815eb1fa3764b1cf8136a`.
  - Cùng số module (212) + build lại retry sau khi khôi phục
    `seek.ts` cho sha đồng nhất — chứng tỏ build xác định và
    khác biệt bundle = khác biệt seek. Cả hai chứa đủ dấu K4
    (`Phát ngược`, `__vcutHoldStats`, `toggleReversePlayback`).
  - Mỗi lượt kiểm tra sha bundle đóng băng trước và sau chạy
    (Q6 kiểm tra manifest dist, runner R1 kiểm tra lại sha file
    bundle): 11/11 lượt khớp — không lượt nào nhiễm bundle.
- **Cổng 1 — nhãn quiet v2 của Q6:** load1 trước-xuôi,
  trước-ngược, cuối lượt đều < 2,0; xuôi trong [0,98, 1,02];
  rAF xuôi P50 ≤ 0,015 s; predictedRate xuôi (trừ tick biên)
  ≥ 0,98; 0 tiến trình Chrome trước lượt. Runner R1 còn có cổng
  tiền kiểm: chờ tối đa 10 phút/lượt cho tới khi load1 < 2,0 và
  0 Chrome rồi mới phóng browser (không phóng vào lúc đã biết
  tải cao). Trong đợt này không lượt nào gate-timeout.
- **Cổng 2 — probe decode-side MỚI**
  (`apps/web/scripts/seek-ab-decode-side-analyze.mjs`):
  phân tích `forward-hold.json` của CHÍNH lượt đó, không sửa
  harness hay code sản phẩm. Từ `reverse.samplesDetail`
  (mỗi mẫu 0,5 s): chuỗi drawDelta theo khoảng, đếm stall
  (khoảng drawDelta = 0, loại khoảng đầu warmup/chuyển tiếp);
  từ `raf.reverse`: tickRate = n / wallSec. HEALTHY khi và
  chỉ khi stall ≤ 1, chuỗi stall dài nhất ≤ 1, tickRate
  ≥ 80/s. Ngưỡng đặt TRƯỚC khi đo đợt 35 và hiệu chuẩn trên
  8 lượt đợt 34 Q1: HEALTHY đúng cho cả 4 lượt fps cao
  (retry-3/4, single-2/4) và STARVED cho cả 4 lượt fps thấp,
  trong đó có single-3 (stall 9, tick 47,0/s) — xem §2.
- **Quy tắc nhận:** chỉ lượt đạt CẢ HAI cổng mới vào thống kê
  3+3. Lượt vi phạm cổng nào cũng giữ lại file kết quả đầy đủ
  với lý do loại, không xóa, không tính vào trung vị.
- **Thứ tự xen kẽ:** retry, single, retry, single… (attempt
  tăng dần mỗi phía). Cặp so sánh ghép theo THỨ TỰ NHẬN
  (lượt accepted thứ i mỗi phía thành cặp i), không ghép theo
  thời gian chạy — vì lượt bị loại xen giữa làm lệch cặp thời
  gian, và ghép theo thứ tự nhận là quy tắc định trước, không
  chọn sau khi thấy số.

## 2. Probe decode-side: phương pháp và giới hạn trung thực

- Probe này đo **đầu ra của decode** (draw delivery: frame mới
  thực sự vẽ được theo từng khoảng 0,5 s + nhịp tick rAF phase
  ngược), đối chứng với proxy xuôi/rAF mà Q1 §5.3 đã chứng
  minh là có thể "khỏe giả". Nó KHÔNG phải đo trực tiếp bên
  trong decoder của Chrome — Chrome không expose tín hiệu đó
  qua CDP pipe của harness — và LIMITS này không claim hơn.
- Bằng chứng cổng decode-side có tác dụng trong đợt này:
  lượt retry-a3 đạt đủ mọi tiêu chí v2 (load 1,43/1,37/1,29;
  xuôi 0,9927; rAF xuôi khỏe) nhưng chỉ vẽ 44 frame/14,51 s
  (3,03 fps) với stall 7, chuỗi stall dài nhất 2, tickRate
  57,9/s — đúng mẫu hình single-3 đợt 34, nay tái hiện ở phía
  retry. Không có cổng decode, 3,03 này đã lọt vào tập quiet
  của retry và làm méo kết luận theo hướng ngược lại.
- Giới hạn của cổng (ghi rõ, không giấu): nó bắt được stall
  (draw = 0 từng khoảng) nhưng KHÔNG bắt được chế độ chậm-đều.
  Lượt single-a4 được nhận (7,32 fps, HEALTHY, tick 93,1/s,
  0 stall) có chuỗi draw 1/khoảng suốt ~4 s cuối phase ngược
  — chậm nhưng đều, không stall. Vì vậy nhãn HEALTHY có nghĩa
  là "không có dấu hiệu đói decode dạng stall", không có nghĩa
  là "nhanh". Phương sai phía single (7,32–9,57) một phần đến
  từ chính các lượt chậm-đều kiểu này, và đó là lý do §0 không
  claim hiệu ứng nhỏ.

## 3. Số đo (11 lượt, 6 accepted, 5 bị loại)

Tất cả 11 lượt N2 đều PASS (exit 0). Giờ UTC 01/11/2026.
Load = load1 trước-xuôi / trước-ngược / cuối lượt.

### 3.1 Lượt được nhận (quiet 3+3)

| Cặp (thứ tự nhận) | Lượt retry | fps | Lượt single | fps | Tỉ số single/retry |
|---|---|---|---|---|---|
| 1 | retry-a4 | 8,907 (122/13,70 s, xuôi 0,9925) | single-a1 | 8,813 (121/13,73 s, xuôi 0,9916) | 0,9895 (−1,1%) |
| 2 | retry-a5 | 8,746 (120/13,72 s, xuôi 0,9905) | single-a2 | 9,567 (131/13,69 s, xuôi 0,9923) | 1,0939 (+9,4%) |
| 3 | retry-a6 | 9,345 (128/13,70 s, xuôi 1,0121) | single-a4 | 7,324 (101/13,79 s, xuôi 0,9858) | 0,7837 (−21,6%) |

Tổng hợp: retry trung vị 8,907, tb 8,999, độ lệch chuẩn 0,310;
single trung vị 8,813, tb 8,568, độ lệch chuẩn 1,141.
Tỉ số trung vị 0,9895; tỉ số trung bình 0,9521.

### 3.2 Lượt bị loại (đủ lý do, không tính vào thống kê)

| Lượt | fps | Nhãn v2 | Decode | Lý do loại đầy đủ |
|---|---|---|---|---|
| retry-a1 | 2,862 | under-load | STARVED | load1 2,76 / 4,00 / 3,87; predictedRate xuôi 0,941 (mất 0,348 s, 2 gap); stall 4, chuỗi 2, tick 60,4/s. Ghi chú: cổng tiền kiểm đã qua (load 1,67, 0 Chrome) nhưng tải bùng giữa lượt — Chrome của luồng khác xuất hiện (chromePost 19). |
| retry-a2 | 8,753 | under-load | HEALTHY | Chỉ hỏng load1 sát ngưỡng: trước-xuôi 2,14, cuối 2,21 (trước-ngược 1,97). Fps và decode đều khỏe nhưng nhãn v2 bắt buộc loại — KHÔNG nới ngưỡng sau khi thấy số. |
| retry-a3 | 3,032 | **quiet** | STARVED | V2 đủ mọi tiêu chí nhưng decode STARVED (stall 7, chuỗi 2, tick 57,9/s) — lượt chứng minh cổng decode (§2). |
| single-a3 | 8,022 | under-load | HEALTHY | Chỉ hỏng xuôi sát ngưỡng: 0,9785 < 0,98. Decode khỏe. |
| single-a5 | 9,561 | under-load | HEALTHY | Chỉ hỏng load1 cuối lượt 2,38. Lượt thừa: single đã đủ 3 accepted trước đó (a1, a2, a4); dù có đạt cũng chỉ là surplus, không thay cặp. |

Tỉ lệ nhận: 6/11 lượt (retry 3/6, single 3/5). Không lượt nào
gate-timeout, không lượt nào nhiễm bundle, không lượt PARTIAL.

## 4. Đọc số (và không đọc quá số)

### 4.1 Vì sao không còn dư 20%

So sánh duy nhất có giá trị là TRONG cùng cây, cùng phiên,
cùng cổng: retry 8,907 vs single 8,813 trung vị. So sánh cũ
(7,09 vs 8,97) vi phạm cả ba điều: khác cây (187 → 212
module), khác phiên, một phía chỉ n=1. Việc cả hai phía trên
cây hiện tại đều ~8,9 — cao hơn hẳn quiet retry đợt 33
(7,09) — còn cho thấy mức tuyệt đối đã trôi lên theo cây,
không phải hiệu ứng seek. Vì vậy KHÔNG được dùng số đợt 33
làm baseline hồi quy cho cây hiện tại nữa; baseline quiet
mới cho fixture này là số §3.1 (cùng bundle đóng băng R1).

### 4.2 Phương sai còn lại — và vì sao n=3 chưa khóa hiệu ứng nhỏ

Phía retry rất ổn định (6,9% spread, độ lệch chuẩn 0,31).
Phía single dao động 30,6% (7,32–9,57) dù cả 3 lượt đều qua
2 cổng — một phần do chế độ chậm-đều mà cổng decode hiện
tại không bắt (§2). Với phương sai này, khoảng tin cậy của
chênh lệch trung bình ở n=3 rộng hơn ±10%, nên đợt này chỉ
loại trừ được hiệu ứng LỚN ~20%, không khóa được hiệu ứng
nhỏ. Nếu parent muốn khóa hiệu ứng <10% thì cần n lớn hơn
(≥6–8 lượt/phía) và/hoặc cổng decode v2 phát hiện chậm-đều
(xem nợ §6).

### 4.3 Nhiễu từ luồng khác — và vì sao số này vẫn sạch

Trong buổi đo, ít nhất 1 luồng round 35 khác (R2) chạy probe
browser song song, và live dist đã đổi giữa chừng
(`index-DgObvvhC.js` đầu buổi → `index-Cwsd35w5.js` cuối
buổi, do luồng khác build). Cả hai đều KHÔNG nhiễm số R1:
mọi lượt chạy trên dist đóng băng qua `Q6_DIST` (harness
snapshot từ thư mục đóng băng, không đọc `apps/web/dist`),
sha bundle kiểm tra trước/sau 11/11 khớp, và mọi lượt chạy
xuyên với Chrome luồng khác đều bị nhãn v2 bắt (chromePre
= 0 là điều kiện bắt buộc; retry-a1 là ví dụ tải bùng giữa
lượt vẫn bị loại dù cổng tiền kiểm đã qua). Live `seek.ts`
cuối buổi vẫn sha `efb0160b…` — R1 không sửa code sản phẩm.

## 5. Trạng thái cây sau lượt (khôi phục sạch)

- `apps/web/src/lib/seek.ts` live: không đổi 1 byte
  (sha256 `efb0160b…` trước = sau).
- `apps/web/dist` live: R1 KHÔNG BAO GIỜ ghi đè (dùng
  `Q6_DIST`); dist live cuối buổi là của luồng khác
  (`index-Cwsd35w5.js`) — đó là việc của luồng đó, R1 không
  khôi phục gì vì R1 không đụng tới nó.
- Cây đóng băng + snapshot dist + scratch lượt:
  `~/workspace/tmp-round35-r1/` (ngoài repo, không stage).
  Bản single-shot của `seek.ts` chỉ tồn tại trong cây đóng
  băng lúc build (đã khôi phục về bản gốc trong đó sau khi
  build single), không có trong repo.

## 6. Nợ còn lại

1. **Khóa hiệu ứng nhỏ (<10%) nếu parent cần:** tăng n lên
   ≥6–8 lượt/phía trong cửa sổ thật sự quiesced (tạm dừng
   probe các luồng khác — đợt này vẫn có R2 chạy song song,
   khiến 5/11 lượt bị loại), kèm cổng decode v2 phát hiện
   chế độ chậm-đều (ví dụ: draw/khoảng trung bình theo nửa
   sau phase, hoặc draw-rate trượt), vì cổng hiện tại chỉ bắt
   stall.
2. **Giải thích chế độ chậm-đều cuối phase ngược**
   (single-a4: draw 1/khoảng suốt ~4 s cuối): có phải seek về
   gần đầu GOP có chi phí khác, hay là artefact của harness
   (mẫu cuối)? Chưa điều tra — ngoài phạm vi A/B này, nhưng
   nó là nguồn phương sai lớn nhất của phía single.
3. **Baseline quiet đóng băng bundle:** số §3.1 là baseline
   quiet mới cho fixture sparse-GOP trên cây R1 (212 module),
   nhưng nó gắn với bundle đóng băng R1, không phải dist live
   hiện tại (đã đổi sang `Cwsd35w5`). Đợt sau muốn so sánh
   hồi quy phải build lại từ cùng cây đóng băng hoặc đo lại
   baseline trên cây mới — không được so số R1 với số đo trên
   dist live khác.
4. **Không làm:** không revert `seekElement`, không sửa
   `reverseWebcodecs.ts` / preview / i18n / bridge, không
   push, không tag.

## 7. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `apps/web/scripts/seek-ab-decode-side-analyze.mjs`
  (probe decode-side: phân tích forward-hold.json → nhãn
  HEALTHY/STARVED; `node --check` pass; mode `calibrate`
  tái tạo bảng hiệu chuẩn 8 lượt đợt 34 Q1).
- Mới: `apps/web/scripts/seek-ab-quiet-run.sh` (runner 1 lượt:
  cổng tiền kiểm 10 phút, chạy probe Q6 với `Q6_DIST` đóng
  băng, kiểm tra sha bundle trước/sau, chạy probe decode-side,
  gộp thành 1 JSON kết quả; `bash -n` pass).
- Mới: `docs/PHASE9_ROUND35_R1_SEEK_AB_QUIET_LIMITS.md`
  (file này).
- Mới: `benchmarks/results/v35-r1-seek-ab-retry-a1.json`,
  `v35-r1-seek-ab-retry-a2.json`,
  `v35-r1-seek-ab-retry-a3.json`,
  `v35-r1-seek-ab-retry-a4.json`,
  `v35-r1-seek-ab-retry-a5.json`,
  `v35-r1-seek-ab-retry-a6.json`,
  `v35-r1-seek-ab-single-a1.json`,
  `v35-r1-seek-ab-single-a2.json`,
  `v35-r1-seek-ab-single-a3.json`,
  `v35-r1-seek-ab-single-a4.json`,
  `v35-r1-seek-ab-single-a5.json` (JSON gộp mỗi lượt: nhãn
  v2 + decode-side + load + sha bundle + lý do loại).
- Mới: `benchmarks/results/v35-r1-seek-ab-summary.json`
  (tổng hợp 3+3, tỉ số từng cặp, bundle, caveat).
- Không sửa: mọi code sản phẩm, harness N2, probe Q6, script
  của luồng khác, paths-loop, build-loop-log. Không push,
  không tag. Scratch `~/workspace/tmp-round35-r1/` ngoài repo.

## 8. Kiểm chứng đã chạy

- `node --check` script decode-side pass; `bash -n` runner pass.
- Hiệu chuẩn decode-side trên 8 lượt đợt 34 Q1: phân loại đúng
  8/8 (HEALTHY cho 4 lượt fps cao, STARVED cho 4 lượt fps thấp,
  gồm single-3) — ngưỡng đặt trước, không chỉnh sau khi thấy
  số đợt 35.
- Build 2 bundle từ cây đóng băng: retry 212 module
  (build lại cho sha đồng nhất), single 212 module; cả hai đủ
  dấu K4; sha bundle kiểm tra trước/sau 11/11 lượt khớp.
- Harness N2 nguyên vẹn qua probe Q6: 11/11 lượt chạy xong,
  11/11 N2 PASS (exit 0), 0 lượt PARTIAL, 0 lượt gate-timeout.
- `seek.ts` live byte-identical sau buổi đo (sha §5);
  `apps/web/dist` live không bị R1 ghi đè (dùng `Q6_DIST`).
