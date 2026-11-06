# Phase 9 đợt 41, luồng W5 — Probe per-seek v2 trên phiên headed: tách seek-scheduling khỏi decode stall — LIMITS

Ngày: 03/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo,
KHÔNG tự stage batch paths-loop (parent gộp). Luồng này KHÔNG sửa
code sản phẩm, KHÔNG sửa probe, KHÔNG sửa harness N2, KHÔNG làm
lại việc của V1 (nối runner solo — V1 đã nối xong ở đợt 40).
Việc duy nhất: chạy 1 phiên headed N2 với probe v2 bật, đo
`decodedSamplesWhileSeeking` thật, dùng `analyzeSeekingSamples`
để tách seek-scheduling khỏi decode stall, đối chiếu entry
unresolved bằng `elementId` + `flushElementSrc`, và quyết có cần
nhãn cơ chế mới hay không.

## 0. Kết luận ngắn (không vượt số đo)

1. **Probe v2 chạy thật trên Chrome headed, trạng thái
   `present`.** `perSeekEnabled=true`, `version=per-seek-v2`,
   32 entries, validate 32/32 sạch. Đây là lần đầu probe v2 có
   số Chrome thật (V6 chỉ có số VM mô phỏng).
2. **Tách được, bằng số thật.** 8/9 entry reverse đã hoàn tất
   có mẫu seeking `rising`: decoded tăng dần TRONG lúc seeking
   (delta 4–22 frame), seekLatency 1,5–5,5 s nhưng drawLatency
   ≈ 0 sau seeked — nút thắt ở phía seek, KHÔNG phải decode
   stall sau seeked hay presentation. V1 gắn cả 8 entry này là
   `mixed` vì nó chỉ biết tổng delta từ lúc gán tới seeked,
   không biết decode tiến triển lúc nào trong lúc chờ.
3. **KHÔNG thêm nhãn cơ chế mới trong đợt này.**
   `analyzeSeekingSamples` đã đủ làm lớp bằng chứng; lý do đầy
   đủ ở §4. Nhãn `decode-flat-during-seek` (ví dụ trong lệnh)
   KHÔNG được thêm vì mẫu `flat` xuất hiện 0 lần trong phiên
   này — thêm nhãn cho mẫu chưa từng quan sát được là bịa
   taxonomy. Quy tắc nhãn ứng viên cho phiên quiet ghi ở §4.3,
   chưa cài.
4. **Mọi số trong file này đều là under-load, KHÔNG phải
   baseline quiet, KHÔNG khóa kết luận sản phẩm nào.** Phiên
   N2 verdict PARTIAL (phát ngược tự nó đã không đúng hoàn
   toàn), nên các latency giây ở đây chỉ chứng minh probe tách
   được cơ chế, không đo được tốc độ thật của sản phẩm lúc yên.

## 1. Phiên headed đã chạy (tham số thật)

- Lệnh (từ gốc repo, đúng công thức T2, scratch/display/port
  riêng): `N2_SCRATCH=/tmp/round41-w5/n2
  K4_VIDEO=~/workspace/tmp-round27-k4/sparse-gop-noise.mp4
  K4_DISPLAY=:99 K4_PORT=4199 N2_PERSEEK=1
  N2_PERSEEK_GOP_SEC=10 node
  apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
- Thời gian: 03/11/2026 20:06–20:07 +07 (13:06–13:07 UTC).
  Probe install: `defined=defined install=installed
  gopSec=10`. Bundle snapshot: `index-Ddhrenhi.js`
  (1.053.789 byte, đủ dấu K4) từ dist trên đĩa lúc 07:27 UTC
  cùng ngày — W5 KHÔNG build lại dist (probe nạp qua
  Runtime.evaluate nên độ tươi của bundle không ảnh hưởng
  tới probe; hành vi app là của dist đó).
- Fixture: sparse-gop-noise.mp4 (1280×720, 30 s, 30 fps, GOP
  300, xám-ramp + nhiễu — cùng fixture các lượt N2 trước).
  > [Đính chính Z5 04/11/2026 — KHÔNG xoá dòng gốc] Nhãn "GOP 300"
  > trên là SAI về GOP hiệu dụng: file này đặt -g 300 nhưng scenecut
  > chèn keyframe mỗi 30 frame (hộp stss: 30 mục, cách nhau đúng 30
  > frame — đo lại Z5, xem docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md).
  > Số đo perSeek của W5 vẫn đứng; chỉ diễn giải "giải lại GOP thưa"
  > (§ dưới, "GOP thưa trong lúc chờ seeked") phải đọc lại thành
  > giải lại tối đa ~30 frame, không phải cả GOP 300 frame.
- `perSeekProbe.status` thực tế: **`present`** theo đúng 3
  trạng thái V1 đã định nghĩa (`perSeekEnabled=true` và
  `perSeek.entries` là mảng, 32 entry). Không phải `absent`,
  không phải `enabled-but-missing`.
- Điều kiện tải — ghi rõ để khỏi đọc thành quiet:
  loadavg trong phiên: lúc bắt đầu `2.06 1.10 0.49`, trước
  phát xuôi `1.89`, trước phát ngược `1.42`, cuối lượt
  `0.93 0.94 0.48`. Load thấp hơn nhiều so với phiên T2
  (cuối lượt 7,14) NHƯNG phiên này chạy song song với các
  luồng đợt 41 khác trong cùng lượt cron, không phải cửa sổ
  yên có điều phối — vì vậy vẫn xếp loại **under-load**,
  cấm trích làm baseline quiet. (Lưu ý: solo → Q6 → N2 bằng
  runtime vẫn chưa được chạy trong luồng này — W5 chạy N2
  trực tiếp; xác nhận 3 tầng của V1 vẫn chỉ ở mức dry/audit
  code, nợ này còn mở, xem §5.)

## 2. Kết quả phiên N2 (bối cảnh, không phải kết luận sản phẩm)

- N2 exit 1, verdict **PARTIAL**: `reverseOk=false`
  (time ngược chỉ 30 → 18,3, graySeconds nhảy 4 → 26),
  `holdOk=true` (holdDelta 160, drawDelta 9, blackRev 0),
  fps ngược 0,23 (draw 9 / wall 39,46 s), tốc độ xuôi nội suy
  0,317. Rõ ràng đường phát ngược trong phiên này đã suy
  giảm nặng dưới tải (rAF ngược: wall 41,53 s, gapMax 2,01 s,
  lostSec 28,54) — mọi latency seek giây ở §3 phải đọc trong
  bối cảnh đó, không đọc thành "seek ngược của sản phẩm chậm
  X giây".
- Tổng quan perSeek: 32 entries (ready 3, forward 18,
  reverse 11); trạng thái: completed 10, superseded 9,
  seeked-no-draw 1, unresolved 12; `droppedOverflow 0`;
  32/32 entry validate sạch qua `validatePerSeekEntry`.
- Trần mẫu: mẫu nhiều nhất 35 mẫu/entry (k=0), không entry
  nào chạm trần 1000, `droppedSeekingSamples` toàn 0 — trần
  V6 không bị thử thách trong phiên này (seek dài nhất
  ~5,5 s, dưới 16 s tương đương trần ở 60 fps).
- Phân bố theo elementId: element 4 = 21 entry (element phát
  chính), các element 0,1,2,3,5,6,7,8,9,10,11 mỗi element
  đúng 1 entry — elementId đã làm đúng việc nó sinh ra để
  làm (xem §3.3).

## 3. Phân tích trên số thật

### 3.1 Reverse đã hoàn tất: rising trong lúc seeking tách khỏi decode stall

9 entry reverse completed (k=22–30, cùng element 4).
`summaryReverse.byMechanism` của v1: `{undetermined: 2,
mixed: 9}` — tức v1 không tách được entry nào trong số này.

| k | target (s) | seekLat (ms) | drawLat (ms) | mẫu seeking | analyzeSeekingSamples | decoded tới seeked | v1 label |
|---|---|---|---|---|---|---|---|
| 22 | 29,9 | 19,7 | 6700,7 | 0 | unknown (seek quá nhanh, không tick rAF nào trong lúc seeking) | +0 (96→96) | mixed |
| 23 | 27,6 | 5323,6 | 7,7 | 27 | rising, delta +22, span 5289,6 ms | +22 | mixed |
| 24 | 25,63 | 5474,4 | 0,0 | 21 | rising, delta +22, span 5205,1 ms | +23 | mixed |
| 25 | 24,0 | 3412,8 | 0,3 | 10 | rising, delta +4, span 3317,1 ms | +4 | mixed |
| 26 | 23,13 | 2708,7 | 0,0 | 11 | rising, delta +8, span 2609,1 ms | +8 | mixed |
| 27 | 22,23 | 2438,0 | 0,0 | 10 | rising, delta +11, span 2286,8 ms | +11 | mixed |
| 28 | 21,4 | 3804,3 | 0,0 | 13 | rising, delta +16, span 3717,7 ms | +16 | mixed |
| 29 | 20,33 | 4812,3 | 72,7 | 14 | rising, delta +14, span 4772,2 ms | +14 | mixed |
| 30 | 19,03 | 1506,6 | 0,0 | 5 | rising, delta +5, span 1364,9 ms | +5 | mixed |

Đọc tách (chỉ trong phạm vi phiên này):

- **k=23–30 (8 entry): nút thắt ở phía seek, không phải
  decode stall sau seeked.** Bằng chứng đủ 3 mảnh khớp nhau:
  (a) decoded tăng đều TRONG lúc seeking (mẫu phủ gần hết
  cửa sổ seeking: span/seekLat ≈ 0,94–0,99); (b) sau seeked,
  draw gần như tức thì (0–72,7 ms) và decoded không tăng
  thêm tới firstDraw (`decodedDeltaToFirstDraw = 0`,
  `firstDecodedAfterSeekAtMs = null`); (c) chuỗi mẫu tăng
  theo từng đợt (plateau rồi nhảy ~6–10 frame, ví dụ k=23:
  126×5 → 132–133 → 143–147 → 148) — đúng dạng decoder
  giải lại GOP thưa trong lúc chờ seeked, không phải đứng
  yên rồi bật. V1 không tách được vì nó chỉ thấy tổng delta
  5–22 frame mà không biết tăng lúc nào; v2 cho thấy tăng
  xảy ra TRƯỚC seeked, nên seeked bị trễ vì công việc
  decode/seek chưa xong — tức phía seek-scheduling theo
  nghĩa rộng, không phải decode stall sau seeked.
- **k=22 là trường hợp ngược lại, và mẫu seeking không giúp
  gì ở đây — điều này cũng quan trọng.** Seek nhanh
  (19,7 ms, không có tick rAF nào trong lúc seeking nên 0
  mẫu), nhưng draw trễ 6700,7 ms, decoded tăng lần đầu
  1977,1 ms sau seeked và +30 frame tới lúc draw. Đây là
  dạng lag decode SAU seeked. V1 vẫn gắn `mixed` vì quy tắc
  decode-stall của nó đòi `decodedDeltaToFirstDraw === 0`
  (ở đây = 30) — phần dư `mixed` này là **lỗ hổng quy tắc
  v1, không phải lỗ hổng mẫu seeking**. Ghi rõ để luồng sau
  không đổ lỗi cho probe v2.
- **Mẫu `flat`: 0 lần.** Không entry completed nào (reverse
  hay forward) có decoded đứng yên suốt lúc seeking. Vì vậy
  cặp đối chứng rising-vs-flat mà V6 thiết kế để tách cơ
  chế mới chỉ quan sát được một nửa — đây là lý do chính
  không thêm nhãn ở §4.
- Ngoài reverse: entry forward completed duy nhất k=20
  (target 3,9, seekLat 5147,8 ms, drawLat 0, 16 mẫu rising
  65→96) cho cùng mẫu rising — mẫu này nhất quán ngoài
  phase reverse, nhưng phân tích cơ chế chính thức vẫn chỉ
  lấy phase reverse như T2 đã chốt.

### 3.2 Entry unresolved: elementId + flushElementSrc đối chiếu được

12 unresolved, chia đúng 2 nhóm — không còn phải đoán như
T2 §4.3:

- **Nhóm thumbnail-strip: 11 entry** (k=0,1,2,3,6,9,10,15,
  17,19,21), mỗi entry một elementId riêng
  (0,1,2,3,5,6,7,8,9,10,11), target cách đều 3 s
  (0,5 → 28,5), `flushElementSrc` cùng một blob UUID của
  video import, `flushElementReadyState = 0`. Đây là các
  seek thumbnail (captureVideoThumb) chưa từng resolve —
  hành vi đúng của probe, không phải seek phát chính bị bỏ.
  (Kể cả k=21 target 28,5 trong phase reverse: elementId 11
  chứng minh nó không phải element phát chính.)
- **Nhóm phát chính: 1 entry, k=31** (elementId 4, target
  18,53, `flushElementReadyState = 1`, 7 mẫu rising
  229→240, span 1793,9 ms): seek ngược cuối cùng, bị cắt
  bởi mark idle + `read()` cuối phiên của harness — tức
  artifact kết thúc phiên, không phải tín hiệu sản phẩm.
- Các entry còn lại khớp kỳ vọng: superseded toàn element 4
  (9 entry, forward re-seek dưới tải, đúng dạng T2 §4.1);
  seeked-no-draw k=5 (element 4, target 0,3). Entry đã hoàn
  tất trước `read()` giữ `flushElementSrc /
  flushElementReadyState = null` đúng như V6 thiết kế —
  không bịa src cho entry đã xong.

## 4. Quyết định nhãn cơ chế: KHÔNG thêm nhãn mới

### 4.1 Quyết định

**Không thêm nhãn cơ chế mới, không sửa `mechanismLabel`,
không đổi taxonomy.** `analyzeSeekingSamples` + các latency
hiện có đã đủ làm lớp bằng chứng để tách seek-scheduling
khỏi decode stall trên số thật (§3.1 chứng minh: 8 entry
v1-mixed nay đọc được rõ là nút thắt phía seek).

### 4.2 Lý do (cả 3 đều là lý do chặn, không phải trì hoãn)

1. **Một phiên under-load PARTIAL không đủ để khóa
   taxonomy.** Đường phát ngược trong phiên đã suy giảm
   (verdict PARTIAL, fps 0,23); các latency giây có thể là
   artifact tải chứ không phải cơ chế ổn định. Luật cứng của
   luồng: không khóa kết luận nào từ dữ liệu under-load —
   thêm nhãn từ chính dữ liệu này là khóa một kết luận
   phân loại từ dữ liệu under-load.
2. **Cặp đối chứng chưa đủ một nửa: `flat` = 0 lần.**
   Nhãn `decode-flat-during-seek` (ví dụ trong lệnh) mô tả
   mẫu decoded đứng yên trong lúc seeking — mẫu này chưa
   từng xuất hiện trên Chrome thật. Thêm nhãn cho mẫu chưa
   quan sát được là bịa taxonomy, và không có test hồi quy
   nào trên số thật để khóa nó (test VM của V6 đã có flat
   mô phỏng, nhưng đó không phải bằng chứng Chrome).
3. **Phần dư `mixed` còn lại (k=22) không phải do thiếu
   mẫu.** Nó do quy tắc decode-stall v1 đòi
   `decodedDeltaToFirstDraw === 0`. Sửa quy tắc đó là việc
   khác với thêm nhãn từ mẫu seeking — gộp hai việc vào một
   thay đổi sẽ làm mờ nguyên nhân nếu hồi quy đỏ.

### 4.3 Quy tắc ứng viên cho phiên quiet (CHƯA cài, để phiên sau quyết)

- (a) Entry completed, seekLat ≥ 100 ms, drawLat < 100 ms,
  `analyzeSeekingSamples.progress === "rising"` với delta
  > 0 → ứng viên gắn lại `seek-scheduling` (tái dùng nhãn
  cũ, lý do ghi rõ "decoded tăng trong lúc seeking") —
  HOẶC nhãn mới `decode-during-seek` nếu parent muốn taxonomy
  phân biệt bằng chứng trong-lúc-seeking với bằng chứng
  sau-seeked của nhãn cũ. Chọn một trong hai ở phiên quiet,
  không chọn cả hai.
- (b) Entry completed, seekLat < 100 ms,
  firstDecoded sau seeked ≥ 100 ms (dạng k=22) →
  ứng viên sửa quy tắc decode-stall v1 cho phép
  `decodedDeltaToFirstDraw > 0` khi firstDecoded đã trễ rõ.
  Đây là sửa quy tắc v1, tách riêng khỏi (a).
- Cả hai ứng viên chỉ được cài sau khi phiên quiet có điều
  phối tái tạo được mẫu rising, và tốt nhất là quan sát
  được ít nhất một trường hợp flat để cặp đối chứng đủ hai
  phía.

## 5. Kiểm chứng đã chạy + nợ còn lại

- `node --test apps/web/scripts/per-seek-probe.test.mjs` →
  **18/18 pass, 0 fail** (10 cũ + 8 v2 của V6; W5 không sửa
  file này, chỉ chạy lại để khẳng định không lệch).
- `node --check apps/web/scripts/per-seek-probe.mjs` → pass.
- Solo dry-run với cờ bật: `N2_PERSEEK=1
  N2_PERSEEK_GOP_SEC=10 node
  apps/web/scripts/seek-ab-solo-run.mjs --dry-run` →
  **exit 0, ok: true, problems: []**. Nhắc lại caveat V1:
  dry-run không spawn Q6/N2 nên không tiêu thụ cờ — exit 0
  này chỉ là tiền kiểm, không phải bằng chứng cờ chảy qua
  solo → Q6 → N2 bằng runtime.
- Script phân tích (không vào repo): `/tmp/round41-w5/
  analyze-w5.mjs` chạy trên forward-hold.json của phiên, ra
  `/tmp/round41-w5/analysis.txt`; log phiên
  `/tmp/round41-w5/n2.log`; forward-hold.json tại
  `/tmp/round41-w5/n2/forward-hold.json`.

Nợ còn lại (không mạo nhận đã đóng):

1. **Phiên quiet có điều phối** (nợ gốc đợt 40 §5.2, vẫn
   mở): tái tạo mẫu rising, tìm trường hợp flat, rồi mới
   quyết cuối quy tắc nhãn §4.3. Phiên W5 không thay thế
   phiên này.
2. **Bằng chứng runtime solo → Q6 → N2 với cờ bật** (nợ
   V1 §4.2, vẫn mở): W5 chạy N2 trực tiếp, không qua solo;
   phiên solo thật từ main chat vẫn phải kiểm tra
   `perSeekProbe.status == "present"` ở lượt đầu.
3. **Trần 1000 mẫu chưa được thử thách** (seek dài nhất
   5,5 s → tối đa 35 mẫu): seek kẹt > 16 s mới kiểm chứng
   được `droppedSeekingSamples` thật.
4. **Safari / máy thật / footage B-frame / đường
   WebCodecs** (probe mù với WebCodecs như V6 đã ghi) —
   vẫn chưa đo, không thuộc phạm vi luồng này.

## 6. File đổi/thêm (chỉ của W5)

- MỚI (1 file text, không binary, không dist):
  `docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md` (file này).
- KHÔNG ĐỔI: probe trang v2, module phân tích, harness N2,
  solo runner, code sản phẩm, `tsconfig.json` (không có
  test mới nên không cần dòng exclude mới — parent gộp
  không cần làm gì thêm cho luồng này). Không push, không
  tag, không stage batch (theo lệnh luồng).
