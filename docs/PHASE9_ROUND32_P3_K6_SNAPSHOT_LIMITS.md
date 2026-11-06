# Phase 9 đợt 32, luồng P3 — Xác minh độc lập K6 8/8 + nối snapshot cho harness mới — LIMITS

Ngày: 2026-11-01 (lượt cron 14:03 Asia/Saigon). Luồng này thực chất
thuộc đợt 33 (parent sẽ stage dưới tên đợt 33) vì đợt 32 đã có luồng
O2 làm đúng mảng này trước đó (sáng 01/11). KHÔNG push, KHÔNG chạy
push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release,
KHÔNG binary vào repo, KHÔNG sửa code sản phẩm, KHÔNG sửa baseline
K6 hay wiring cdp-snapshot của O2 (không đo được bằng chứng O2 sai —
ngược lại, P3 xác minh O2 đúng, xem §1). KHÔNG tự tạo file
paths-loop (parent gộp batch). Chỉ sửa 2 harness mới + thêm 1 probe
+ 1 LIMITS này + 3 JSON kết quả (parent quyết stage).

## 0. Kết luận ngắn (không vượt số đo)

1. **O2 đã làm đúng, P3 xác minh độc lập đúng:** K6 guard chạy lại
   **8/8** trên bundle mới (không phải bundle của O2 — dist đã bị
   luồng khác build lại giữa chừng, xem §1.1); J6 **17/17** trên
   một bundle còn mới hơn nữa. 0 dòng CDP-HANG, 0 exception cả 2
   lần chạy. Kỳ vọng baseline K6 không cần sửa thêm: K1 pass với
   message thật đợt 27, K2/K3/K4 vẫn đòi OutOfRange đúng cho giá
   trị ngoài miền thật — không nới lỏng assertion nào.
2. **Phần genuinely mới của P3:** kiểm kê toàn bộ harness CDP phát
   hiện 2 harness mới xuất hiện SAU O2 mà chưa nối snapshot —
   `probe-round32-o5-webcodecs-pipe.mjs` (pipe, luồng O5) và
   `seek-o3-browser-probe.mjs` (WebSocket, luồng O3) — và đã nối
   cả 2 theo đúng mẫu N5/O2, chứng minh động bằng probe P3
   **3/3 target PASS** (pipe O5, WS O3, module default). Snapshot
   của 2 harness mới ghi ra thư mục bền của O2, không vào /tmp.
3. **Không đụng 2 file của luồng đang chạy cùng đợt:** P2
   (`seek-p2-underload-probe.mjs`, sửa lần cuối 14:11) và P5
   (`probe-round32-p5-webcodecs-pipe.mjs`, tạo 14:18) đều là file
   của luồng song song đang hoạt động trong cùng lượt cron — P3
   cố tình không nối để tránh ghi đè/ghi chéo (xem §4).
4. **Nợ vẫn còn, ghi rõ không mạo nhận:** lần treo THẬT có
   snapshot vẫn chưa xảy ra; tọa độ spinner tuyệt đối trên máy
   user vẫn chưa đo; mobile-touch-check vẫn chưa nối (lý do kỹ
   thuật giữ nguyên từ O2); snapshot bền vẫn chỉ nằm trên đĩa VM,
   không backup ra ngoài VM (giới hạn của O2, P3 không sửa).

## 1. O2 đã làm gì — và P3 xác minh được gì

### 1.1 O2 đã làm (tóm tắt từ LIMITS O2, P3 không nhận công)

- Đổi mặc định `EMPTY_MODE` từ `"baseline"` sang `"guard"` ở
  `clicktest-l5-round29-k6diag.mjs` + `clicktest-k6-round27-pipe.mjs`
  → K6 8/8 trên bundle `index-D3yYXWHm.js` (`7450c68feb9e4ac4`).
- Chuyển outDir snapshot của 13 harness không-SCRATCH từ
  `/tmp/vcut-cdp-hang-<tên>/` sang
  `~/workspace/vcut-cdp-hang-snapshots/<tên>/`; thêm default outDir
  `.../_unspecified/` vào `cdp-snapshot.mjs`.
- Nối snapshot WS cho `bench-preview-fps.mjs` +
  `check-proxy-auto.mjs`; kết luận mobile-touch-check không nối
  được (send() không có timeout, không có reject).

### 1.2 P3 xác minh độc lập (chạy lại, không lấy số O2)

**K6 guard 8/8 — bundle MỚI `index-B8uKpTK2.js`
(`6d0a6c00e188d3e4`):** chạy `clicktest-l5-round29-k6diag.mjs`
display :95, cổng 4195, nhãn v32-p3, JSON
`benchmarks/results/v32-p3-k6-guard.json`. K0, K1, K2, K3,
K6-no-crash-vi, K4, K5, K7-no-crash-en đều PASS. K1 ghi rõ:
`mode=guard`, gõ cdp-char "11.4641", xoá cdp-backspace,
msg = "Chưa nhập mốc ngoài (ô đang trống) — không tách.",
toasts = [] — đúng kỳ vọng nhánh guard. K2 ("99"), K3 ("99"),
K4 ("9.9") vẫn pass với msg + toast OutOfRange cho giá trị
ngoài miền thật. 0 dòng CDP-HANG trong log (không timeout nào
kích hoạt snapshot); K6/K7 ghi "0 Runtime.exceptionThrown".

**J6 hồi quy 17/17 — bundle CÒN MỚI HƠN
`index-Cqp7uur1.js` (`a585b7c7172736f7`):** chạy
`clicktest-split-intermediate-pipe.mjs` display :96, cổng 4196,
nhãn v32-p3, JSON `benchmarks/results/v32-p3-regress-j6.json`.
J0–J15 đầy đủ (tách 3 độ sâu + playhead + trung gian sâu +
risky), 0 fail, 0 seed-rejected, 0 dòng CDP-HANG. File gốc
`clicktest-split-intermediate-r26j6.json` đã sao lưu trước,
chạy xong chép kết quả sang tên v32-p3 rồi khôi phục — diff
khôi phục identical (kiểm chứng bằng `diff -q`).

**Vì sao 2 bundle khác nhau là bình thường, không phải lỗi:**
dist bị luồng song song build lại giữa lần chạy K6 (07:06–07:08)
và lần chạy J6 (07:10–07:13); mỗi harness snapshot dist của
riêng nó lúc bắt đầu nên mỗi kết quả gắn đúng với bundle nó đo.
Lúc P3 kết thúc, dist trên đĩa vẫn là `index-Cqp7uur1.js`
(bundle của J6) — nếu luồng sau chạy lại K6 mà ra bundle khác
nữa thì đó vẫn là hành vi đúng của snapshot, không phải hồi quy.

**Kiểm chứng tĩnh độ bền snapshot (không lấy lời O2):**
grep toàn `apps/web/scripts/` còn **0** tham chiếu
`os.tmpdir(), "vcut-cdp-hang` ngoài 2 probe (chỉ là chuỗi kiểm
tra trong code probe, không phải outDir thật); 18 file tham chiếu
`vcut-cdp-hang-snapshots` (17 harness + module); thư mục bền vẫn
chứa file snapshot probe của O2 (bench, check-proxy, nested-ramp,
ngày 01/11) — bằng chứng outDir bền tồn tại qua các lượt chạy.
Module `cdp-snapshot.mjs` KHÔNG bị P3 sửa.

### 1.3 mobile-touch-check: xác minh lại lý do O2 không nối

Đọc lại file thật: `send()` (dòng 49) là WS send thuần, không
timeout; `grep -c reject` = 0; `setTimeout` duy nhất là helper
`sleep` cho polling, không phải timeout lệnh. Kết luận O2 vẫn
đúng: không có handler timeout để nối, muốn nối phải bịa thêm
cơ chế timeout + reject (đổi ngữ nghĩa script). P3 không sửa
file này. Nếu treo thật ở script này, nó vẫn treo vô hạn không
snapshot — nợ mở, cần quyết định timeout trước khi nối.

## 2. Phần mới của P3: nối snapshot cho 2 harness sau O2

### 2.1 probe-round32-o5-webcodecs-pipe.mjs (pipe, luồng O5)

File này (mtime 08:32, đợt 32 O5) có `class PipeCdp` với timeout
handler one-liner `reject(new Error(`CDP timeout ${method}`))`
nhưng chưa nối snapshot. P3 nối đúng mẫu N5:

- import `captureCdpHangSnapshot` + `let HANG_BUNDLE = null`
  (probe không có snapshotDist nên bundle null — snapshot vẫn
  ghi proc/ps) + hằng outDir bền
  `~/workspace/vcut-cdp-hang-snapshots/probe-round32-o5-webcodecs-pipe/`.
  KHÔNG dùng `<SCRATCH>/cdp-hang-snapshots/` như mẫu N5 cho nhóm
  có SCRATCH, vì SCRATCH của probe này là thư mục tạm
  `tmp-round32-o5` (có thể bị dọn) — outDir bền của O2 an toàn hơn.
- Mở timeout handler thành nhiều dòng, chèn khối snapshot
  try/catch riêng trước reject; câu reject giữ nguyên verbatim
  (kiểm chứng bằng grep sau sửa).
- `node --check` pass.

### 2.2 seek-o3-browser-probe.mjs (WebSocket, luồng O3)

File này (mtime 08:33, đợt 32 O3) có `class Cdp` qua WebSocket,
timeout 60000ms cố định, Chrome do chính probe spawn — cùng
điều kiện O2 đã dùng để nối bench/check-proxy. P3 nối đúng mẫu O2:

- import `captureCdpHangSnapshot` + hằng outDir bền
  `~/workspace/vcut-cdp-hang-snapshots/seek-o3-browser-probe/`.
- `Cdp` thêm trường `this.proc = null`; main() gán
  `cdp.proc = chrome` ngay sau `new Cdp(ws)` (biến `chrome` đã
  khai báo `let ... chrome = null` ở cùng scope main — kiểm
  chứng bằng grep, không phải biến toàn cục lạ).
- Timeout handler chèn snapshot (proc, pend.size, method,
  timeoutMs 60000, outDir, bundle null, extra
  `{ transport: "websocket", port, cdpPort }`) trong try/catch
  riêng, rồi vẫn reject đúng lỗi gốc `cdp timeout <method>`.
- `node --check` pass.

### 2.3 Probe P3: treo giả lập trên class thật đã nối — 3/3 PASS

Probe mới `apps/web/scripts/clicktest-p3-round32-snapshot-probe.mjs`
(display :97, cổng WS 19322, JSON
`benchmarks/results/v32-p3-snapshot-probe.json`, exit 0, allPass
true). Mẫu N5/O2: trích đúng class từ file đã sửa, chạy trên
Chrome thật, dọn outDir trước mỗi target nên "đúng 1 file" là thật.

| Target | Reject gốc | Snapshot | pid khớp | ps có chrome | Sau timeout vẫn dùng được |
|---|---|---|---|---|---|
| pipe, O5 (pid 22009) | `CDP timeout Target.getTargets` | đúng 1, trong `.../probe-round32-o5-webcodecs-pipe/` | PASS | PASS | pipe PASS (Target.getTargets sau đó trả targetInfos) |
| WS, O3 (pid 22168) | `cdp timeout Target.getTargets` | đúng 1, trong `.../seek-o3-browser-probe/`, extra.transport = websocket | PASS | PASS | chỉ tham khảo (send lần 2 vẫn dùng timer rút 1ms nên có thể timeout tiếp — không tính pass/fail) |
| module default (không outDir) | — (gọi trực tiếp) | ghi đúng `.../_unspecified/`, không error; file probe đã dọn sau kiểm chứng (mẫu O2) | — | — | — |

Giới hạn của chứng minh (trung thực): O3 dùng bản trích rút delay
setTimeout 60000ms → 1ms (chỉ thay đúng mẫu delay
`} }, 60000); }); }`, probe fail nếu không thay đúng 1 chỗ;
timeoutMs 60000 trong lệnh snapshot được giữ nguyên — đó là
timeout thật được ghi vào snapshot, chỉ timer của bản trích bị
rút). O5 dùng pause stream fd4 để ép timeout đơn định (xem §3).

**Hai lỗi probe của chính P3, đã sửa và ghi rõ (không giấu):**

- *Lần chạy 1:* probe chỉ sleep 1500ms sau khi bật Xvfb nên
  Chrome lên trước khi X sẵn sàng — pipe không bao giờ trả lời
  (cả gửi 1ms lẫn gửi 30s đều timeout), dù Chrome vẫn sống và
  snapshot vẫn ghi đúng. Đó là lỗi probe, không phải lỗi wiring:
  đã sửa theo mẫu J6/N5 (chờ socket Xvfb + sleep thêm 2s, profile
  tươi mkdtemp, đủ 5 pipe stdio, arg `--no-first-run`
  `--window-size`). Bài học: lần chạy probe sau đó vẫn dùng Xvfb
  :97 cũ còn sống sót (xem dưới) nên socket hiện true — probe
  không tự chứng minh được Xvfb là do nó bật hay dùng chung.
- *Lần chạy 2:* warm-up làm pipe nhanh nên gửi 1ms thắng đua
  (response <1ms, không timeout, 0 file) — đã sửa bằng cách pause
  stream đọc fd4 trước khi gửi (thao tác của probe lên transport,
  không sửa logic class), rồi resume sau timeout. Target O5
  pass ở lần chạy 3 với đúng 1 file + pipe sống sau timeout.
- *Dọn tiến trình:* `process.exit()` trong nhánh catch của probe
  bỏ qua `finally` nên Xvfb :97 (hình 1440x900, lần chạy 1) sót
  lại — P3 đã kill tay (pid 16966) và đã vá probe: `cleanup()`
  được gọi tường minh trước mọi `process.exit`, finally chỉ là
  lưới thứ hai. Các Chrome còn sống sau lượt P3 (cổng 9324,
  profile `/tmp/p2-gop-*`) là của luồng P2 đang chạy, P3 không
  đụng tới.

## 3. Kiểm kê cuối lượt: harness nào đã nối, chưa nối

- **Pipe (`class PipeCdp`):** toàn bộ đã nối TRỪ
  `probe-round32-p5-webcodecs-pipe.mjs` (xem §4) — kiểm chứng
  bằng vòng grep sau khi P3 nối O5.
- **WebSocket (`class Cdp`):** đã nối: bench-preview-fps,
  check-proxy-auto (O2), seek-o3-browser-probe (P3 mới),
  2 probe snapshot (O2/P3, tự chứa). Chưa nối:
  `seek-p2-underload-probe.mjs` (xem §4) và mobile-touch-check
  (xem §1.3).
- **Snapshot /tmp:** 0 tham chiếu outDir /tmp còn lại (xem §1.2).
  Nhóm 13 harness của O2 + 2 harness mới của P3 đều trỏ thư mục
  bền `~/workspace/vcut-cdp-hang-snapshots/<tên-script>/`.
- Thư mục snapshot của O3 sau probe P3 chứa 2 file (1 từ lần ép
  timeout chính + 1 từ lần gửi thứ 2 cũng timeout 1ms do bản
  trích rút hằng) — cả 2 đều là bằng chứng probe, không phải
  treo thật; parent không nên đọc chúng như treo sản phẩm.

## 4. KHÔNG đụng — file của luồng song song đang chạy cùng đợt

- `apps/web/scripts/seek-p2-underload-probe.mjs` (luồng P2):
  có `class Cdp` WS với timeout 60000ms, tự spawn Chrome — về
  kỹ thuật nối được đúng mẫu O3 (§2.2). Nhưng file sửa lần cuối
  14:11 (trong lúc P3 chạy, lượt cron 14:03) và Chrome của P2
  (cổng 9324) vẫn đang chạy lúc P3 kết thúc → luồng P2 đang hoạt
  động. P3 cố tình không nối để tránh ghi chéo file P2 đang sửa.
  Parent nên giao lại cho P2 (áp mẫu §2.2, 10 phút) hoặc đợt sau.
- `apps/web/scripts/probe-round32-p5-webcodecs-pipe.mjs` (luồng
  P5): tạo 14:18 trong lúc P3 chạy, có `class PipeCdp` chưa nối
  (phát hiện ở kiểm kê cuối, sau khi P3 đã nối O5). Cùng lý do:
  file của luồng đang chạy, P3 không đụng. Parent giao cho P5
  (áp mẫu §2.1) hoặc đợt sau.
- Nếu parent gộp batch đợt này mà 2 file trên vẫn chưa nối thì
  đó là quyết định có chủ đích (tránh xung đột luồng song song),
  không phải P3 bỏ sót kiểm kê.

## 5. File P3 đổi/thêm (CHỈ file P3 — không liệt kê file O2)

SỬA (2 file harness, mỗi file chỉ thêm import + hằng outDir +
khối snapshot trong timeout handler + gán proc nếu là WS;
câu reject gốc giữ nguyên verbatim; `node --check` pass):

- `apps/web/scripts/probe-round32-o5-webcodecs-pipe.mjs`
- `apps/web/scripts/seek-o3-browser-probe.mjs`

MỚI:

- `apps/web/scripts/clicktest-p3-round32-snapshot-probe.mjs`
  (probe §2.3; `node --check` pass).
- `docs/PHASE9_ROUND32_P3_K6_SNAPSHOT_LIMITS.md` (file này).
- `benchmarks/results/v32-p3-k6-guard.json` (K6 8/8).
- `benchmarks/results/v32-p3-regress-j6.json` (J6 17/17).
- `benchmarks/results/v32-p3-snapshot-probe.json` (probe 3/3).

KHÔNG ĐỔI: `clicktest-l5-round29-k6diag.mjs`,
`clicktest-k6-round27-pipe.mjs`, `cdp-snapshot.mjs`,
`bench-preview-fps.mjs`, `check-proxy-auto.mjs`,
`mobile-touch-check.mjs`, `seek-p2-underload-probe.mjs`,
`probe-round32-p5-webcodecs-pipe.mjs`, mọi file code sản phẩm.
KHÔNG push, KHÔNG paths-loop (parent gộp batch, stage dưới tên
đợt 33).

## 6. Nợ còn lại (không mạo nhận đã xong)

- Lần treo THẬT có snapshot vẫn chưa xảy ra — toàn bộ chứng
  minh ở đây (cả O2 lẫn P3) là treo giả lập. Khi (nếu) một lần
  treo thật xảy ra, file trong
  `~/workspace/vcut-cdp-hang-snapshots/<tên-script>/` mới là bằng
  chứng cuối cùng.
- Tọa độ spinner tuyệt đối trên máy user vẫn chưa đo (nợ từ đợt
  30 M5, chỉ có ghi chú VM) — luồng này không đo spinner, chỉ
  nối snapshot vào 2 harness mới (O5/O3 không phải spinnerprobe).
- mobile-touch-check vẫn chưa nối (§1.3): cần quyết định timeout
  cho send() trước khi nối.
- seek-p2 + probe-p5 chưa nối (§4): cần giao cho đúng luồng hoặc
  đợt sau, sau khi các luồng đó dừng sửa file.
- Snapshot của các harness WS (bench, check-proxy, O3) có bundle
  null (không snapshotDist) — khi treo thật ở các harness này,
  muốn biết bundle đang đo thì phải đối chiếu thời điểm với lần
  build/dist gần nhất, không có sẵn trong snapshot.
- Thư mục snapshot bền mới nằm trên đĩa VM, không backup ra
  ngoài VM (giới hạn của O2) — snapshot treo cũ mất nếu VM bị
  thay thế.
- Không đo: Safari / touch / dpr > 1 / viewport khác / máy thật
  (toàn bộ đo là Chromium VM như các đợt trước).
