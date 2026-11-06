# Phase 9 đợt 31, luồng N5 — Nối cdp-snapshot vào các harness pipe còn lại — LIMITS

Ngày: 2026-11-01 (lượt cron 02:03 Asia/Saigon). Luồng N5 trong đợt lớn
round 31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo,
KHÔNG code giả, KHÔNG sửa code sản phẩm, KHÔNG đụng seek/preview sản
phẩm, CLI, i18n, dip weights. KHÔNG tự tạo file paths-loop (parent
gộp batch). Chỉ sửa harness script dưới `apps/web/scripts/` + thêm
1 probe + 1 LIMITS này + 3 JSON kết quả (parent quyết stage).

Đóng nợ docs/PHASE9_ROUND30_LIMITS.md §3 item 5 và
docs/PHASE9_ROUND30_M5_CDP_SNAPSHOT_LIMITS.md §6: đợt 30 M5 mới nối
module `cdp-snapshot.mjs` vào script CDP-DIAG của L5; các harness
pipe còn lại (J6, spinnerprobe, I6, dip…) chưa nối. Luồng này nối
nốt — nhưng xem §6 để biết chính xác cái gì CHƯA nối và vì sao.

## 0. Kết luận ngắn (không vượt số đo)

1. **Đã nối 32 harness pipe** (mọi file `class PipeCdp` còn lại trong
   `apps/web/scripts/`), cộng 2 file đã nối từ đợt 30 → tổng cộng
   **34/34 harness pipe** nay đều gọi `captureCdpHangSnapshot` trong
   timeout handler của `send()`. Mẫu nối y hệt k6diag đợt 30: import
   module + biến module `HANG_BUNDLE` + gọi snapshot đồng bộ trong
   try/catch riêng trước reject + gán `HANG_BUNDLE = snap` sau
   `snapshotDist()` khi harness có snapshot dist. Chuỗi lỗi reject
   gốc được giữ nguyên từng ký tự ở cả 32 file (kiểm chứng bằng
   diff với bản gốc trước khi nối, §3).
2. **Chứng minh động bằng treo giả lập, mạnh hơn probe M5:** probe
   mới không dùng class viết riêng trong probe mà TRÍCH ĐÚNG class
   `PipeCdp` từ file harness đã nối rồi chạy trên pipe Chrome thật
   với timeout 1ms có chủ đích — 4/4 target PASS (J6, spinnerprobe,
   dip, I6): reject đúng lỗi gốc, đúng 1 file snapshot với pid
   khớp Chrome thật, ps chứa chrome, pipe vẫn sống sau timeout;
   target dip còn chứng minh đường bundle (bundle giả lập ghi đúng
   name + sha vào snapshot). Đây vẫn là treo GIẢ LẬP — lần treo
   THẬT có snapshot vẫn chưa xảy ra (nợ cũ, xem §6).
3. **Hồi quy:** J6 (script đã nối) **17/17** trên bundle
   `index-C0HfodWe.js` sha256[:16] = `fda3c753e1dccec1`, 0 timeout
   CDP trong suốt lần chạy. K6 guard **7/8**: case K1 fail là lệch
   kỳ vọng message của harness so với bundle mới (baseline là
   "Chưa nhập mốc ngoài…" thay vì OutOfRange) — KHÔNG liên quan
   đến nối snapshot: script k6diag không bị luồng này đụng tới,
   không timeout CDP nào xảy ra trong lần chạy K6 (0 dòng CDP-HANG
   trong log), 0 exception cả 2 phiên. K1 fail này thuộc về
   harness/bundle, không phải hồi quy do N5, và luồng này không sửa
   (ngoài phạm vi: không sửa logic sản phẩm, không sửa kỳ vọng
   harness của luồng khác).
4. **Nợ vẫn còn, ghi rõ không mạo nhận:** tọa độ spinner tuyệt đối
   trên máy user vẫn chưa đo (chỉ có ghi chú VM từ đợt 30 M5);
   lần treo thật có snapshot vẫn chưa xảy ra; 2 script CDP qua
   WebSocket và 1 script không có timeout không được nối (lý do
   ở §5); snapshot của 13 harness không có SCRATCH nằm ở /tmp
   (mất khi dọn /tmp — xem §2).

## 1. Phương pháp nối (để parent kiểm chứng nhanh)

Kiểm kê bằng grep `class PipeCdp` trên toàn `apps/web/scripts/`:
34 file. Trừ 2 file đã nối đợt 30 (k6diag, snapshot-probe), còn 32
file — nối cả 32 bằng một script nối duy nhất (không sửa tay từng
file, tránh lệch mẫu), rồi kiểm chứng lại bằng diff với bản gốc đã
sao lưu trước khi nối (bản sao lưu ở `/tmp/n5-orig/`, ngoài repo).

Mỗi file chỉ đổi đúng 3 chỗ, không chỗ nào khác (diff mỗi file
15–21 dòng, §3):
- (a) import `captureCdpHangSnapshot` từ `./cdp-snapshot.mjs` sau
  dòng import cuối + biến module `let HANG_BUNDLE = null` kèm
  comment đợt 31 N5;
- (b) trong timeout handler của `send()`, trước `reject(...)` gốc,
  thêm khối try/catch gọi `captureCdpHangSnapshot({ proc:
  this.proc, pendingCount: this.pending.size, method, timeoutMs,
  outDir, bundle: HANG_BUNDLE, extra })` và log đường dẫn file
  (hoặc lỗi ghi kèm câu "vẫn reject lỗi timeout gốc"). Dạng
  one-liner cũ (m5-d7, v19-debug, v21-diag/diag2) được mở thành
  dạng nhiều dòng nhưng câu `reject` giữ nguyên verbatim;
- (c) nếu harness có `const snap = snapshotDist();` trong main(),
  thêm ngay sau đó `HANG_BUNDLE = snap;` (đúng 1 vị trí/file;
  script từ chối nếu có != 1 vị trí).

Không đổi thứ tự case, không thêm retry/kill, không đổi timeoutMs,
không đổi ngữ nghĩa test nào khác. Không đụng file nào ngoài
danh sách §2 (kiểm chứng bằng find mtime: các file sửa khác trong
repo cùng khung giờ — `seek.ts`, `preview.tsx`, JSON n6, `cli/dist`
— là của các luồng round 31 khác, không phải của N5).

## 2. Harness nào đã nối (32 file) — outDir và bundle

### 2a. Có snapshotDist → snapshot ghi bundle thật (16 file)

Snapshot ra `<SCRATCH>/cdp-hang-snapshots/`, bundle = snap sau
`snapshotDist()` (name + sha256[:16] như module M5):

- J6: `clicktest-split-intermediate-pipe.mjs` (J6 hiện hành),
  `clicktest-l5-round29-j6.mjs` (biến thể J6 đợt 29).
- spinnerprobe: `clicktest-l5-round29-spinnerprobe.mjs`.
- I6: `clicktest-deep-leaf-ramp-pipe.mjs` (harness đợt 25 I6).
- dip: `clicktest-dip-browser-pipe.mjs`,
  `clicktest-dip-browser-round29-l6.mjs`,
  `clicktest-dip-footage-round29-l1.mjs`,
  `clicktest-dip-blur-complex-round30-m6.mjs`,
  `clicktest-dip-seek-round30-m1.mjs`.
- Khác: `clicktest-footage-baseline-round28-l1.mjs`,
  `clicktest-k6-round27-pipe.mjs`, `clicktest-l4-round29-pipe.mjs`,
  `clicktest-l5-round28-pipe.mjs`, `clicktest-l5-round29-pipe.mjs`,
  `clicktest-m4-round30-pipe.mjs`, `clicktest-m5-round30-d7.mjs`.

### 2b. Không có snapshotDist → snapshot ghi proc/ps, bundle null (16 file)

Vẫn có giá trị chẩn đoán (phân biệt Chrome chết / pipe tắc qua
proc.exitCode/signalCode + ps), chỉ thiếu bundle — đúng giới hạn
module M5 đã nêu (bundle bắt buộc "khi harness có snapshotDist"):

- Clicktest, outDir = `<SCRATCH>/cdp-hang-snapshots/` (có SCRATCH
  nhưng không snapshot dist): `clicktest-nested-ramp-pipe.mjs`
  (tmpdir — xem dưới), `clicktest-reverse-hold-pipe.mjs`,
  `clicktest-round30-m2-forward-pipe.mjs`,
  `clicktest-round31-n2-reverse-fps-pipe.mjs`.
  Ngoại lệ: `clicktest-nested-ramp-pipe.mjs` và
  `clicktest-vertical-footage-pipe.mjs` KHÔNG có SCRATCH nên dùng
  outDir tmpdir như nhóm measure.
- Measure cũ (v19–v24, headed-fps) + `clicktest-vertical-footage-pipe.mjs`
  (cũng không có SCRATCH), outDir =
  `/tmp/vcut-cdp-hang-<tên-file>/` (mỗi file một thư mục riêng,
  tránh va chạm): `measure-headed-fps-pipe.mjs`,
  `measure-v19-fps-debug.mjs`,
  `measure-v19-real-project-fps-pipe.mjs`,
  `measure-v20-experiments-pipe.mjs`,
  `measure-v20-preview-profile-pipe.mjs`,
  `measure-v21-idle-diag-pipe.mjs`,
  `measure-v21-idle-diag2-pipe.mjs`,
  `measure-v21-idle-sleep-pipe.mjs`,
  `measure-v22-sleep-scrub-pipe.mjs`,
  `measure-v23-hidden-bfcache-pipe.mjs`,
  `measure-v24-hidden-discard-pixel-pipe.mjs`,
  `clicktest-vertical-footage-pipe.mjs`.

Trường `extra` ghi kèm display/port (hoặc displays + preview port
ở các script measure dùng DISPLAYS) khi hằng đó tồn tại trước
`send()`; các script measure không có DISPLAY đơn thì ghi
`displays`. Trong probe N5, extra.port là 4192 giả lập (probe
không dùng server) — chỉ là giá trị ghi kèm, không ảnh hưởng
kiểm chứng snapshot.

Lưu ý về file `clicktest-round31-n2-reverse-fps-pipe.mjs`: file
này do luồng N2 của round 31 tạo ra trong cùng đợt chạy song
song; luồng N5 chỉ chèn thêm 3 chỗ theo mẫu (không xóa dòng nào
ngoài việc mở rộng đúng dòng timeout one-liner/multiline thành
dạng có snapshot), nhưng parent nên kiểm tra lại file này khi
gộp đề phòng luồng N2 ghi đè sau thời điểm N5 nối.

## 3. Kiểm chứng tĩnh (toàn bộ 32 file, không lấy mẫu)

- `node --check`: **32/32 pass** (cộng probe mới: 33/33).
- Chuỗi `reject(new Error(`CDP timeout …`))` gốc: giữ nguyên ở
  **32/32** file (so sánh tập hợp các dòng reject trước/sau nối).
- Lệnh `captureCdpHangSnapshot` nằm trong vùng `send()`: **32/32**.
- Import module: **32/32**. Gán `HANG_BUNDLE = snap`: đúng 16/16
  file có snapshotDist, 0/16 file không có snapshotDist (không
  gán thừa).
- Diff mỗi file chỉ 15 dòng (multiline) hoặc 21 dòng (one-liner
  mở rộng + hằng outDir tmpdir): không hunk lạ nào ngoài 3 chỗ
  ở §1. File `cdp-snapshot.mjs` không bị sửa.

## 4. Kiểm chứng động: treo giả lập 1ms trên class thật đã nối

Probe mới: `apps/web/scripts/clicktest-n5-round31-snapshot-probe.mjs`
(display :92, Chromium headed dưới Xvfb, pipe thật; JSON
`benchmarks/results/v31-n5-snapshot-probe.json`).

Điểm khác biệt so với probe M5 (ghi rõ để không ngộ nhận): probe
M5 dùng class PipeCdp viết riêng trong probe — chỉ chứng minh
module. Probe N5 đọc file harness thật, trích đúng khối
`class PipeCdp { ... }` (quét brace có xử lý chuỗi/template
literal), rồi chạy chính class đó: nếu khối trích ra không chứa
lệnh snapshot thì probe fail ngay từ bước trích. 4 target chạy
tuần tự, mỗi target một Chrome mới, snapshot dir được dọn trước
mỗi target nên "đúng 1 file" là kiểm chứng thật, không phải đếm
cộng dồn.

| Target (file đã nối) | Reject gốc | Snapshot file | pid khớp | ps có chrome | Pipe sống sau timeout | Bundle |
|---|---|---|---|---|---|---|
| J6 `clicktest-split-intermediate-pipe.mjs` (pid 3749) | `CDP timeout Target.getTargets sau 1ms` | đúng 1, method + timeoutMs=1 | PASS | PASS | PASS | null (probe đặt HANG_BUNDLE=null) |
| spinnerprobe (pid 3896) | `CDP timeout Target.getTargets sau 1ms` | đúng 1 | PASS | PASS | PASS | null |
| dip `clicktest-dip-browser-pipe.mjs` (pid 4059) | `CDP timeout Target.getTargets sau 1ms` | đúng 1 | PASS | PASS | PASS | bundle giả lập `index-N5FAKE.js` + sha `0123456789abcdef` ghi đúng cả 2 trường — chứng minh đường bundle qua handler |
| I6 `clicktest-deep-leaf-ramp-pipe.mjs` (pid 4212) | `CDP timeout Target.getTargets sau 1ms` | đúng 1 | PASS | PASS | PASS | null |

Cả 4 target: snapshot proc còn sống đúng trạng thái treo giả lập
(exitCode/signalCode null, killed false). Probe exit 0. Không
tiến trình Xvfb :92 / Chrome probe nào còn sống sau probe.

Giới hạn của chứng minh động (trung thực): 4 target được chạy
động; 28 file còn lại được chứng minh tĩnh (§3) + cùng mẫu nối
byte-tương đương (diff §1). Chạy động cả 32 file trên Chrome
thật là lãng phí (mỗi file một phiên Chrome) mà không thêm thông
tin, vì phần khác nhau duy nhất giữa các file là outDir/extra/
bundle — đều đã kiểm chứng tĩnh. Đường bundle thật (không phải
giả lập) được chứng minh gián tiếp: gán `HANG_BUNDLE = snap` đã
kiểm chứng tĩnh 16/16 + module M5 đã chứng minh ghi bundle khi
được cấp (probe M5) + probe N5 chứng minh handler truyền
HANG_BUNDLE vào module (target dip, bundle giả lập).

## 5. Harness nào CHƯA nối và lý do (không giấu)

- Đã nối từ đợt 30, luồng này không đụng lại:
  `clicktest-l5-round29-k6diag.mjs` (CDP-DIAG),
  `clicktest-m5-round30-snapshot-probe.mjs` (probe M5).
- `bench-preview-fps.mjs`, `check-proxy-auto.mjs`: class `Cdp`
  qua **WebSocket, không phải pipe** — không có `this.proc` nên
  module chỉ ghi được proc=null; ngoài phạm vi "harness pipe"
  của brief. Muốn nối sau này thì cần thêm tham số proc (Chrome
  do script khác spawn) hoặc chấp nhận snapshot proc=null — để
  luồng sau quyết, không tự ý đổi transport.
- `mobile-touch-check.mjs`: hàm `send()` không có timeout nào —
  không có handler timeout để nối; muốn snapshot thì phải thêm
  cơ chế timeout mới (đổi ngữ nghĩa), ngoài phạm vi luồng này.
- Không còn file `class PipeCdp` nào chưa nối: 34/34 pipe đã nối
  (2 đợt 30 + 32 đợt 31).

## 6. Hồi quy liên quan

### 6.1 K6 guard (script k6diag, KHÔNG bị N5 sửa): 7/8

Chạy `clicktest-l5-round29-k6diag.mjs` display :91, cổng 4191,
JSON `benchmarks/results/v31-n5-regress-k6-guard.json`, bundle
`index-C0HfodWe.js` sha256[:16] = `fda3c753e1dccec1`:
K0, K2, K3, K6-no-crash-vi, K4, K5, K7-no-crash-en PASS;
**K1-empty-input FAIL** — msg baseline thực tế là "Chưa nhập
mốc ngoài (ô đang trống) — không tách." trong khi harness kỳ
vọng baseline là OutOfRange. Đây là lệch kỳ vọng harness ↔
bundle hiện tại (bundle đã đổi từ B1assKz- đợt 30 sang C0HfodWe
do các luồng round 31 khác build lại dist), không phải hồi quy
do nối snapshot: k6diag không nằm trong 32 file N5 sửa; trong
log K6 có 0 dòng CDP-HANG (không timeout nào kích hoạt snapshot);
0 exception cả 2 phiên. Luồng N5 không sửa K1 (sửa kỳ vọng
harness hay message sản phẩm đều ngoài brief).

### 6.2 J6 (script đã nối): 17/17

Chạy `clicktest-split-intermediate-pipe.mjs` display :90, cổng
4190, cùng bundle C0HfodWe (`fda3c753e1dccec1`): J0–J15 đầy đủ
(tách thành công 3 độ sâu + playhead + trung gian sâu + risky),
0 fail, 0 seed-rejected, 0 timeout CDP (0 dòng CDP-HANG). Bằng
chứng lưu ở `benchmarks/results/v31-n5-regress-j6.json`; file
gốc `clicktest-split-intermediate-r26j6.json` đã được khôi phục
nguyên trạng sau khi chạy (harness này ghi đè đúng tên file đó
nên N5 sao lưu trước, chạy xong chép kết quả sang tên v31 rồi
khôi phục file gốc — parent kiểm chứng bằng diff với bản đợt 26
nếu cần).

## 7. File đổi/thêm (không sửa code sản phẩm)

- SỬA 32 script harness liệt kê ở §2 (mỗi file: import +
  HANG_BUNDLE + khối snapshot trong timeout handler + gán bundle
  nếu có snapshotDist; `node --check` 32/32).
- MỚI `apps/web/scripts/clicktest-n5-round31-snapshot-probe.mjs`
  — probe trích class thật (§4).
- MỚI `docs/PHASE9_ROUND31_N5_CDP_SNAPSHOT_LIMITS.md` — file này.
- MỚI `benchmarks/results/v31-n5-snapshot-probe.json` — probe
  4/4 PASS.
- MỚI `benchmarks/results/v31-n5-regress-k6-guard.json` — K6 7/8
  (K1 fail như §6.1).
- MỚI `benchmarks/results/v31-n5-regress-j6.json` — J6 17/17.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG tự tạo file paths-loop (parent gộp batch).

## 8. Nợ còn lại (không mạo nhận đã xong)

- Lần treo THẬT có snapshot vẫn chưa xảy ra — toàn bộ chứng minh
  ở đây là treo giả lập 1ms. Khi (nếu) một lần treo thật xảy ra,
  file trong `cdp-hang-snapshots/` của harness đó mới là bằng
  chứng cuối cùng, và các trường exitCode/signalCode/ps lúc đó
  mới cho thấy dạng treo thật.
- Tọa độ spinner tuyệt đối trên máy user vẫn chưa đo (nợ từ đợt
  30 M5 §6, chỉ có ghi chú VM) — luồng này không đo spinner, chỉ
  nối snapshot vào script spinnerprobe.
- Snapshot của 13 harness không có SCRATCH nằm ở
  `/tmp/vcut-cdp-hang-<tên-file>/` (nhóm measure + nested-ramp +
  vertical-footage): /tmp có thể bị dọn, nên snapshot treo của
  nhóm này kém bền hơn nhóm SCRATCH trong `~/workspace/`. Nếu
  muốn bền, luồng sau nên cấp SCRATCH riêng cho nhóm này thay vì
  tmpdir.
- WebSocket Cdp (bench/check-proxy) và mobile-touch-check chưa
  nối — lý do ở §5, cần quyết định riêng trước khi nối.
- File N2 của round 31 (§2 cuối): parent kiểm tra lại khi gộp vì
  luồng N2 có thể ghi đè sau thời điểm N5 nối.
- Không đo: Safari / touch / dpr > 1 / viewport khác / máy thật
  (toàn bộ đo là Chromium VM như các đợt trước).
