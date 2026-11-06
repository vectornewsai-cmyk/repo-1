# Phase 9 đợt 32, luồng O2 — Cập nhật baseline harness K6 + bền vững snapshot CDP — LIMITS

Ngày: 2026-11-01 (lượt cron 08:03 Asia/Saigon). KHÔNG push, KHÔNG chạy
push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release, KHÔNG
binary vào repo, KHÔNG sửa i18n, KHÔNG sửa preview.tsx hay store.ts,
KHÔNG sửa code sản phẩm. Chỉ sửa harness script dưới `apps/web/scripts/`
+ thêm 1 probe + 1 LIMITS này + 3 JSON kết quả (parent quyết stage).
KHÔNG tự tạo file paths-loop (parent gộp batch).

Đóng nợ docs/PHASE9_ROUND31_LIMITS.md §3.5 (K6 K1) và
docs/PHASE9_ROUND31_N5_CDP_SNAPSHOT_LIMITS.md §8 (snapshot /tmp kém bền,
3 harness chưa nối).

## 0. Kết luận ngắn (không vượt số đo)

1. **K6 guard 8/8** (trước: 7/8, K1 fail). Nguyên nhân đúng như nợ đợt 31:
   kỳ vọng baseline lỗi thời — harness mặc định đòi OutOfRange cho ô
   trống, trong khi message thật đã sửa có chủ đích ở đợt 27 (K6) là
   "Chưa nhập mốc ngoài (ô đang trống) — không tách." Sửa duy nhất:
   mặc định `EMPTY_MODE` từ `"baseline"` sang `"guard"` ở 2 file
   (k6diag + round27 pipe). K1 pass với message thật đó, 0 toast;
   K2/K3/K4 vẫn đòi OutOfRange đúng cho giá trị ngoài miền thật
   (99, 9.9) — baseline được sửa có chọn lọc, KHÔNG nới lỏng
   assertion sản phẩm. Không case nào khác fail, nên không có hồi
   quy thật nào cần phân biệt thêm.
2. **Snapshot bền hơn:** 13 harness không có SCRATCH đã chuyển outDir
   từ `/tmp/vcut-cdp-hang-<tên>/` sang
   `~/workspace/vcut-cdp-hang-snapshots/<tên>/` (ngoài repo nên không
   lọt batch push, ngoài /tmp nên không mất khi dọn /tmp, tồn tại qua
   restart VM). Module `cdp-snapshot.mjs` có thêm default outDir bền
   (`.../_unspecified/`) khi harness quên truyền outDir, thay vì throw.
   Probe treo giả lập chứng minh snapshot vẫn ghi được sau đổi.
3. **3 harness chưa nối ở đợt 31, kết luận cuối:** 2 harness WebSocket
   (bench-preview-fps, check-proxy-auto) ĐÃ NỐI ĐƯỢC — cả hai đều tự
   spawn Chrome nên `proc` có sẵn; module snapshot không phụ thuộc
   transport, chỉ cần ChildProcess. mobile-touch-check KHÔNG NỐI —
   lý do kỹ thuật ở §4, không ép nối sai kiến trúc.
4. **Hồi quy:** J6 **17/17** trên bundle `index-D3yYXWHm.js`
   sha256[:16] = `7450c68feb9e4ac4` (cùng bundle với lần chạy K6),
   0 timeout CDP trong cả 2 lần chạy (0 dòng CDP-HANG).

## 1. K6 baseline: trước / sau

### 1.1 Trước (đợt 31 N5, 7/8)

`clicktest-l5-round29-k6diag.mjs` dòng `EMPTY_MODE` mặc định
`"baseline"` → nhánh K1 đòi msg + toast chứa OutOfRange cho ô trống.
Bundle thật (đợt 27 K6 đổi có chủ đích, i18n key `splitOffsetEmpty`)
trả msg "Chưa nhập mốc ngoài (ô đang trống) — không tách." và 0 toast
→ K1 fail. N5 đã xác nhận fail này không liên quan đến nối snapshot
(k6diag không bị N5 đụng, 0 dòng CDP-HANG, 0 exception).

### 1.2 Sửa (đợt này, 2 file, mỗi file 1 dòng mặc định + comment)

- `apps/web/scripts/clicktest-l5-round29-k6diag.mjs`:
  `process.env.K6_EMPTY_MODE || "baseline"` → `|| "guard"`.
- `apps/web/scripts/clicktest-k6-round27-pipe.mjs`: cùng đổi đó.
- Quét toàn `apps/web/scripts/`: sau đổi, cả 5 file có `EMPTY_MODE`
  đều mặc định `"guard"` (k6diag, round27 pipe, round28 pipe, round29
  pipe, round29 spinnerprobe — 3 file sau đã là guard từ trước, không
  cần sửa). Không còn harness nào mặc định đòi OutOfRange cho ô trống.
- `K6_EMPTY_MODE=baseline` vẫn giữ được để chạy lại bundle cũ nếu cần;
  chỉ đổi mặc định, không xóa nhánh baseline.

### 1.3 Sau: K6 guard 8/8 (browser thật)

Chạy `clicktest-l5-round29-k6diag.mjs` display :91, cổng 4191, nhãn
v32-o2, JSON `benchmarks/results/v32-o2-k6-guard.json`, bundle
`index-D3yYXWHm.js` (`7450c68feb9e4ac4`):
K0, K1, K2, K3, K6-no-crash-vi, K4, K5, K7-no-crash-en đều PASS.
Log K1 ghi rõ: `mode=guard`, gõ cdp-char "11.4641", xoá cdp-backspace,
msg = "Chưa nhập mốc ngoài (ô đang trống) — không tách.", toasts = []
— đúng kỳ vọng nhánh guard (msg chứa câu mốc rỗng, 0 toast chứa câu đó).
0 dòng CDP-HANG trong log (không timeout nào kích hoạt snapshot).

## 2. Snapshot CDP bền vững hơn

### 2.1 Phương án đã chọn (và phương án đã cân nhắc)

- **Chọn:** `~/workspace/vcut-cdp-hang-snapshots/<tên-script>/` — thư mục
  workspace ngoài repo. Đáp ứng cả 3 ràng buộc: không vào batch push
  (ngoài repo), không bị dọn như /tmp, tồn tại qua restart VM
  (workspace là vùng bền của VM này). Mỗi script một thư mục con để
  tránh va chạm, cùng mẫu với nhóm SCRATCH trước đó.
- **Đã cân nhắc và loại:**
  - Trong repo (vd `benchmarks/cdp-hang-snapshots/`): snapshot treo là
    chẩn đoán, có thể lớn và không phải mã nguồn — đưa vào repo sẽ
    lọt batch push nếu parent stage nhầm, đi ngược kỷ luật "chỉ sửa
    code đường dẫn + tài liệu".
  - Giữ /tmp kèm cảnh báo: rẻ nhất nhưng không sửa được nợ gốc
    (/tmp bị dọn) — chỉ giữ làm fallback cho Chrome profile tạm
    (không phải snapshot), không phải nơi ghi snapshot nữa.
  - Thư mục bền ngoài VM (Drive/remote): vượt phạm vi luồng, cần
    quyền/kết nối mới — không làm.
- **Giới hạn còn lại của phương án đã chọn (trung thực):** thư mục này
  vẫn nằm trên đĩa VM, không được backup ra ngoài VM. Nếu VM bị thay
  thế, snapshot treo cũ mất theo — nhưng đó là chẩn đoán tạm thời,
  không phải dữ liệu sản phẩm; lần treo thật cần giữ thì parent copy
  file ra khỏi VM khi nó xảy ra.

### 2.2 Đổi code (13 file, mỗi file đúng 1 dòng hằng)

`path.join(os.tmpdir(), "vcut-cdp-hang-<slug>")` →
`path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "<slug>")`:

- Measure cũ: measure-headed-fps-pipe, measure-v19-fps-debug,
  measure-v19-real-project-fps-pipe, measure-v20-experiments-pipe,
  measure-v20-preview-profile-pipe, measure-v21-idle-diag-pipe,
  measure-v21-idle-diag2-pipe, measure-v21-idle-sleep-pipe,
  measure-v22-sleep-scrub-pipe, measure-v23-hidden-bfcache-pipe,
  measure-v24-hidden-discard-pixel-pipe.
- Clicktest: clicktest-nested-ramp-pipe, clicktest-vertical-footage-pipe.
- Grep sau đổi: 0 tham chiếu `os.tmpdir(), "vcut-cdp-hang` nào còn lại.
- `cdp-snapshot.mjs`: thêm `DEFAULT_OUT_DIR` =
  `~/workspace/vcut-cdp-hang-snapshots/_unspecified/` và dùng làm
  default khi `outDir` undefined; ghi chú về nơi bền vào header module.
  Hành vi khi có outDir không đổi.

### 2.3 Chứng minh động: probe treo giả lập 4/4 PASS

Probe mới `apps/web/scripts/clicktest-o2-round32-snapshot-probe.mjs`
(display :93, cổng WS 19493, JSON
`benchmarks/results/v32-o2-snapshot-probe.json`, exit 0). Mẫu N5:
trích đúng class từ file đã sửa, chạy trên Chrome thật, timeout 1ms
có chủ đích, dọn outDir trước mỗi target nên "đúng 1 file" là thật.

| Target | Reject gốc | Snapshot | pid khớp | ps có chrome | Sau timeout vẫn dùng được |
|---|---|---|---|---|---|
| pipe, nested-ramp (pid 15496) | `CDP timeout Target.getTargets sau 1ms` | đúng 1, trong `.../vcut-cdp-hang-snapshots/clicktest-nested-ramp-pipe/` | PASS | PASS | pipe PASS |
| WS, bench-preview-fps (pid 15700) | `CDP timeout: Target.getTargets` | đúng 1, trong `.../bench-preview-fps/`, extra.transport = websocket, bundle null | PASS | PASS | WS evaluate 1+1 = 2 PASS |
| WS, check-proxy-auto (pid 15894) | `CDP timeout: Target.getTargets` | đúng 1, trong `.../check-proxy-auto/`, extra.transport = websocket, bundle null | PASS | PASS | WS evaluate 1+1 = 2 PASS |
| module default (không outDir) | — (gọi trực tiếp) | ghi đúng `.../_unspecified/`, không error; file probe đã dọn sau kiểm chứng | — | — | — |

Giới hạn của chứng minh động (trung thực): trong 13 file đổi outDir,
chỉ nested-ramp được chạy động; 12 file còn lại được chứng minh tĩnh
(cùng một phép đổi hằng từng ký tự, `node --check` pass, grep 0 sót
/tmp). Đường bundle thật qua handler đã chứng minh ở N5, không lặp.

## 3. Ba harness chưa nối ở đợt 31 — kết luận từng cái

### 3.1 bench-preview-fps.mjs — ĐÃ NỐI (kết luận N5 đã lỗi thời ở điểm này)

N5 ghi "không có this.proc nên ngoài phạm vi". Kiểm tra lại file thật:
script này TỰ spawn Chrome trong `main()` (`chrome = spawn(...)`) và
class `Cdp` qua WebSocket CÓ timeout handler trong `send()`. Module
snapshot không đọc transport — nó chỉ cần `proc.pid/exitCode` và chạy
`ps` qua shell. Nối đúng kiến trúc, không đổi transport:

- import `captureCdpHangSnapshot` + hằng `CDP_HANG_OUT_DIR` bền
  (`.../vcut-cdp-hang-snapshots/bench-preview-fps/`);
- `Cdp` thêm trường `this.proc = null`, `main()` gán `cdp.proc = chrome`
  ngay sau khi tạo `Cdp`;
- timeout handler gọi snapshot (proc, pendingCount, method, timeoutMs,
  outDir, bundle null, extra `{ transport: "websocket" }`) trong
  try/catch riêng, rồi vẫn reject đúng lỗi gốc `CDP timeout: <method>`.
- Bundle null là giới hạn thật: script đo trên vite dev, không có
  snapshotDist để gắn bundle (cùng lớp giới hạn N5 §2b).

### 3.2 check-proxy-auto.mjs — ĐÃ NỐI (cùng lý do)

Cùng mẫu y hệt §3.1: tự spawn Chrome, `Cdp` WebSocket có timeout
handler, outDir `.../vcut-cdp-hang-snapshots/check-proxy-auto/`,
bundle null (không snapshotDist). Probe WS §2.3 chứng minh cả hai.

### 3.3 mobile-touch-check.mjs — KHÔNG NỐI, lý do kỹ thuật (giữ nguyên file)

- `send()` của file này KHÔNG có timeout nào (chỉ có `sleep` dùng
  setTimeout cho polling, không phải timeout lệnh) và KHÔNG có đường
  reject nào (promise chỉ resolve, grep `reject` = 0 kết quả).
- Kỷ luật snapshot được định nghĩa là "trong đúng callback timeout
  của send(), trước khi reject". Không có callback đó thì không có
  chỗ nối — muốn nối phải bịa thêm cơ chế timeout + reject, tức đổi
  ngữ nghĩa script (một lệnh CDP không trả lời hiện nay chờ vô hạn
  sẽ thành fail sau timeout). Đó là thay đổi hành vi, không phải nối
  chẩn đoán, nên luồng này không làm. Nếu đợt sau muốn nối, quyết
  định cần chốt trước là: thêm timeout bao nhiêu ms cho send() và
  chấp nhận send() có thể reject — rồi mới nối snapshot vào handler đó.
- Hệ quả: nếu mobile-touch-check treo thật ở một lệnh CDP, nó vẫn
  treo vô hạn không snapshot — nợ này ghi rõ, không giấu.

## 4. Hồi quy J6 17/17

Chạy `clicktest-split-intermediate-pipe.mjs` display :90, cổng 4190,
nhãn v32-o2, cùng bundle `index-D3yYXWHm.js` (`7450c68feb9e4ac4`):
J0–J15 đầy đủ (tách thành công 3 độ sâu + playhead + trung gian sâu
+ risky), 0 fail, 0 seed-rejected, 0 timeout CDP. Bằng chứng
`benchmarks/results/v32-o2-regress-j6.json`; file gốc
`clicktest-split-intermediate-r26j6.json` đã sao lưu trước, chạy xong
chép kết quả sang tên v32-o2 rồi khôi phục file gốc — diff khôi phục
identical (kiểm chứng bằng `diff -q`).

## 5. Kiểm chứng tĩnh

- `node --check`: **19/19 pass** (18 file sửa: 2 k6 + 13 outDir +
  cdp-snapshot.mjs + 2 WS; cộng probe mới).
- Không file i18n, preview.tsx, store.ts nào bị đụng (luồng không mở
  các file đó).
- Không tiến trình Xvfb/Chrome nào của luồng còn sống sau các lần chạy
  (kiểm tra bằng ps sau cùng).
- Lưu ý môi trường: thư mục làm việc local KHÔNG phải git repo
  (`git status` báo fatal) nên không đối chiếu được bằng git; danh
  sách file dưới đây là danh sách luồng tự ghi theo thao tác đã làm,
  và nội dung các file đã được kiểm chứng trực tiếp bằng grep/probe/
  chạy thật, không qua git.

## 6. File đổi/thêm (đường dẫn tương đối từ repo root)

SỬA:

- `apps/web/scripts/clicktest-l5-round29-k6diag.mjs` (EMPTY_MODE mặc định guard + comment).
- `apps/web/scripts/clicktest-k6-round27-pipe.mjs` (cùng đổi đó).
- `apps/web/scripts/cdp-snapshot.mjs` (default outDir bền + ghi chú header).
- 13 file đổi outDir /tmp → workspace bền (§2.2):
  `apps/web/scripts/measure-headed-fps-pipe.mjs`,
  `apps/web/scripts/measure-v19-fps-debug.mjs`,
  `apps/web/scripts/measure-v19-real-project-fps-pipe.mjs`,
  `apps/web/scripts/measure-v20-experiments-pipe.mjs`,
  `apps/web/scripts/measure-v20-preview-profile-pipe.mjs`,
  `apps/web/scripts/measure-v21-idle-diag-pipe.mjs`,
  `apps/web/scripts/measure-v21-idle-diag2-pipe.mjs`,
  `apps/web/scripts/measure-v21-idle-sleep-pipe.mjs`,
  `apps/web/scripts/measure-v22-sleep-scrub-pipe.mjs`,
  `apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs`,
  `apps/web/scripts/measure-v24-hidden-discard-pixel-pipe.mjs`,
  `apps/web/scripts/clicktest-nested-ramp-pipe.mjs`,
  `apps/web/scripts/clicktest-vertical-footage-pipe.mjs`.
- `apps/web/scripts/bench-preview-fps.mjs` (nối snapshot WS).
- `apps/web/scripts/check-proxy-auto.mjs` (nối snapshot WS).

MỚI:

- `apps/web/scripts/clicktest-o2-round32-snapshot-probe.mjs` (probe §2.3).
- `docs/PHASE9_ROUND32_O2_K6_SNAPSHOT_LIMITS.md` (file này).
- `benchmarks/results/v32-o2-snapshot-probe.json` (probe 4/4 PASS).
- `benchmarks/results/v32-o2-k6-guard.json` (K6 8/8).
- `benchmarks/results/v32-o2-regress-j6.json` (J6 17/17).

KHÔNG ĐỔI: `apps/web/scripts/mobile-touch-check.mjs` (lý do §3.3);
không push, không paths-loop (parent gộp batch).

## 7. Nợ còn lại (không mạo nhận đã xong)

- Lần treo THẬT có snapshot vẫn chưa xảy ra — toàn bộ chứng minh ở
  đây là treo giả lập 1ms. Khi (nếu) một lần treo thật xảy ra, file
  trong `~/workspace/vcut-cdp-hang-snapshots/<tên-script>/` mới là
  bằng chứng cuối cùng.
- Tọa độ spinner tuyệt đối trên máy user vẫn chưa đo (nợ từ đợt 30 M5,
  chỉ có ghi chú VM) — luồng này không đo spinner.
- mobile-touch-check vẫn chưa nối (§3.3): cần quyết định timeout cho
  send() trước khi nối.
- Snapshot của 2 harness WS có bundle null (không snapshotDist) —
  khi treo thật ở 2 harness này, muốn biết bundle đang đo thì phải
  đối chiếu thời điểm với lần build/dist gần nhất, không có sẵn trong
  snapshot.
- Thư mục snapshot bền mới nằm trên đĩa VM, không backup ra ngoài VM
  (§2.1) — snapshot treo cũ mất nếu VM bị thay thế.
- Không đo: Safari / touch / dpr > 1 / viewport khác / máy thật
  (toàn bộ đo là Chromium VM như các đợt trước).
