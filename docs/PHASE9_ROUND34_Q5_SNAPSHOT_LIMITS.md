# Phase 9 đợt 34, luồng Q5 — Nối snapshot cho harness còn sót + timeout mobile-touch-check + sửa bundle null — LIMITS

Ngày: 2026-11-01 (lượt cron 20:03 Asia/Saigon). KHÔNG push, KHÔNG
chạy push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release,
KHÔNG binary vào repo, KHÔNG sửa code sản phẩm (apps/web/src),
KHÔNG sửa i18n, KHÔNG sửa bridge. Chỉ sửa module snapshot + 3
harness nêu dưới (phần wiring snapshot, logic gốc giữ nguyên ngoài
wiring) + thêm 1 probe + LIMITS này + 1 JSON kết quả (parent quyết
stage — luồng này KHÔNG tự tạo file paths-loop, parent gộp batch).

Nguồn: docs/PHASE9_ROUND33_LIMITS.md §3 mục 7 và
docs/PHASE9_ROUND32_P3_K6_SNAPSHOT_LIMITS.md §6 (nợ P3 để lại).

## 0. Kết luận ngắn (không vượt số đo)

1. **Đã nối xong toàn bộ harness CDP còn sót của đợt 33:**
   `seek-p2-underload-probe.mjs` (WS) và
   `probe-round32-p5-webcodecs-pipe.mjs` (pipe) — 2 file P3 cố tình
   chưa nối vì luồng đang chạy, nay các luồng đó đã xong nên nối
   an toàn. Sau đợt này, kiểm kê bằng grep: không còn harness CDP
   nào trong apps/web/scripts có timeout handler mà chưa nối
   snapshot (xem §4).
2. **mobile-touch-check đã có timeout + snapshot:** quyết định
   timeout **60000ms** cho send() (xem §2.1 — bằng mọi harness
   khác, đủ rộng để không false-positive trên VM chậm, hữu hạn
   để treo thật không treo vô hạn nữa).
3. **Bundle null đã sửa ở module:** snapshot mới không bao giờ có
   `bundle: null` nữa — harness không cung cấp bundle thì ghi
   object `{ status: "not-captured", name: null, note }`, nghĩa là
   "bundle đang đo KHÔNG ĐƯỢC GHI LẠI", không phải "không có
   bundle chạy" và không phải "snapshot rỗng" (xem §3).
4. **Probe treo giả lập Q5: 4/4 target PASS** (pipe P5, WS P2,
   WS mobile, module bundle) — mỗi target đều có reject gốc đúng,
   đúng 1 file snapshot mới, pid khớp Chrome thật, snapshot ghi
   vào thư mục bền `~/workspace/vcut-cdp-hang-snapshots/<tên>/`,
   và đường bình thường vẫn resolve sau wiring (xem §5).
5. **Vẫn là treo GIẢ LẬP:** lần treo THẬT có snapshot vẫn chưa
   xảy ra; snapshot bền vẫn chỉ nằm trên đĩa VM, không backup ra
   ngoài (nợ từ O2, Q5 không sửa — xem §6).

## 1. Phạm vi glob — 2 file trong glob KHÔNG có CDP, không nối

Brief ghi `seek-p2-*` và `probe-round32-p5-*`. Glob nở ra 4 file,
nhưng chỉ 2 file có transport CDP để nối:

- `seek-p2-underload-probe.mjs` — có `class Cdp` WS → ĐÃ NỐI (§2.2).
- `seek-p2-retry-probe.ts` — KHÔNG có CDP: chỉ là mock Node của
  `seekElement` (NeverSeekedEl, không spawn Chrome, không WS/pipe).
  Không có send() nào để gắn timeout/snapshot → KHÔNG ĐỔI, không
  phải bỏ sót.
- `probe-round32-p5-webcodecs-pipe.mjs` — có `class PipeCdp` →
  ĐÃ NỐI (§2.3).
- `probe-round32-p5-page.js` — chạy TRONG TRANG (import module
  demux/WebCodecs, ghi `window.__p5Result`), không có CDP →
  KHÔNG ĐỔI, không phải bỏ sót.

## 2. Phần mới của Q5

### 2.1 mobile-touch-check.mjs — quyết định timeout + nối snapshot

**Hiện trạng trước Q5 (xác minh lại, khớp O2/P3):** `send()` chỉ
trả Promise resolve, không timeout, không reject; `pending` lưu
trực tiếp hàm resolve; `onmessage` gọi `pending.get(id)(d.result)`.
Nếu Chrome treo, script treo vô hạn không snapshot.

**Quyết định timeout: 60000ms.**

- Bằng mọi harness CDP khác (O3/P2/P5/bench/check-proxy đều
  60000ms): một chuẩn duy nhất, dễ đọc snapshot (timeoutMs
  60000 ở đâu cũng cùng nghĩa).
- Lệnh touch/CDP bình thường trả lời <1s; 60s đủ rộng để không
  false-positive trên VM chậm hoặc dưới tải (P2 đã đo seek dưới
  tải 4x `yes` vẫn hội tụ trong ~25s — một lệnh CDP đơn lẻ vượt
  60s gần như chắc chắn là treo, không phải chậm).
- Không chọn timeout ngắn hơn (vd 10s): sẽ ghi snapshot giả khi
  VM đơ tạm thời; không chọn dài hơn: treo thật phải chờ quá lâu
  mới có bằng chứng.
- Tham số mới `timeoutMs = 60000` là tùy chọn nên mọi lệnh gọi cũ
  (`send(method, params)`) không đổi chữ nào.

**Thay đổi (chỉ wiring, không đổi logic đo):**

- import `captureCdpHangSnapshot` + hằng outDir bền
  `~/workspace/vcut-cdp-hang-snapshots/mobile-touch-check/`.
- `pending` lưu `{ resolve, reject }` (wrapper clearTimeout như
  mẫu pipe); `onmessage` đổi thành `entry.resolve(d.result)` —
  đường resolve giữ nguyên ngữ nghĩa, chỉ đổi hình dạng entry.
- Timer timeout: nếu pending còn id thì xóa, ghi snapshot
  try/catch riêng (proc = tiến trình `chrome` của script,
  pendingCount sau xóa, bundle null, extra
  `{ transport: "websocket", port: PORT }`), rồi reject đúng
  `cdp timeout <method>`.
- **Lan truyền lỗi, ghi rõ để không hiểu nhầm:** khối try chính
  của script không có catch — reject timeout thoát qua `finally`
  (đóng ws, kill Chrome) rồi tiến trình kết thúc với mã lỗi
  (unhandled rejection ở top-level module). Đó là hành vi MONG
  MUỐN (treo thành lỗi có snapshot thay vì treo lặng), không
  phải tác dụng phụ vô tình. Q5 cố tình không thêm catch để
  khỏi đổi ngữ nghĩa exit code của script.

**Cố tình KHÔNG đổi (ngoài phạm vi wiring send):** vòng fetch
`/json` chờ Chrome (30×500ms) và `ws.onopen` chờ mở socket vẫn
không có timeout — treo ở 2 chỗ đó vẫn không có snapshot (nợ
§6). CDP trả `d.error` vẫn resolve với `d.result` undefined như
trước (hành vi có từ trước, Q5 không đổi ngữ nghĩa lỗi).

### 2.2 seek-p2-underload-probe.mjs (WS) — nối đúng mẫu O3/P3

- import `captureCdpHangSnapshot` + hằng outDir bền
  `~/workspace/vcut-cdp-hang-snapshots/seek-p2-underload-probe/`.
- `Cdp` thêm trường `this.proc = null`; main() gán
  `cdp.proc = chrome` ngay sau `new Cdp(ws)` (biến `chrome` đã
  được spawn trước đó trong cùng main).
- Timeout handler mở thành nhiều dòng, chèn khối snapshot
  try/catch riêng trước reject; câu reject giữ nguyên verbatim
  `cdp timeout <method>` (kiểm chứng bằng grep sau sửa).
- Snapshot: proc, pendingCount sau xóa, method, timeoutMs 60000,
  bundle null (→ status "not-captured" theo §3), extra
  `{ transport: "websocket", port: PORT, cdpPort: CDP_PORT }`.
- `node --check` pass. Logic đo (tải 4x `yes`, scrub, phát
  xuôi/ngược) không đụng một chữ.

### 2.3 probe-round32-p5-webcodecs-pipe.mjs (pipe) — nối đúng mẫu O5/P3

- import `captureCdpHangSnapshot` + `HANG_BUNDLE = null` + hằng
  outDir bền
  `~/workspace/vcut-cdp-hang-snapshots/probe-round32-p5-webcodecs-pipe/`.
  KHÔNG dùng SCRATCH (`tmp-round32-p5`) làm nơi ghi snapshot —
  scratch tạm có thể bị dọn (lý do như O5).
- Timeout handler một dòng cũ mở thành khối snapshot try/catch
  riêng; câu reject giữ nguyên verbatim
  `CDP timeout ${method}` (kiểm chứng bằng grep sau sửa).
- Snapshot: proc, pendingCount sau xóa, method, timeoutMs (tham
  số của lệnh), bundle = HANG_BUNDLE (null → "not-captured"
  theo §3), extra
  `{ transport: "pipe", display: DISPLAY, port: PORT }`.
- `node --check` pass. Logic đo WebCodecs không đụng một chữ.

## 3. Sửa bundle null ở cdp-snapshot.mjs (mẫu cho mọi harness WS)

**Vấn đề (nợ P3 §6):** harness WS (bench, check-proxy, O3, nay
thêm P2/mobile) không có snapshotDist nên truyền `bundle: null`
→ file snapshot có trường `bundle: null` trơ trọi. Người đọc sau
không phân biệt được "không có bundle nào chạy" / "snapshot ghi
lỗi" / "bundle không được ghi lại" — và khi treo thật xảy ra thì
không có sẵn bundle đang đo trong file.

**Sửa:** `snapshot.bundle` nay LUÔN là object, không bao giờ null:

- Harness có bundle: `{ name, sha256_16, status: "captured" }`
  (giữ nguyên name/sha cũ, thêm status).
- Harness không cung cấp bundle: `{ name: null, sha256_16: null,
  status: "not-captured", note }`, trong đó note ghi rõ bằng
  tiếng Anh: harness không cung cấp bundle (no snapshotDist) nên
  bundle đang đo KHÔNG ĐƯỢC GHI LẠI trong file này; muốn xác
  định thì đối chiếu `capturedAt` với log của harness / lần build
  dist gần nhất; và "không có nghĩa là không có bundle nào chạy".
- Header module cập nhật định nghĩa này. `node --check` pass.

**Tương thích ngược (đã kiểm chứng trước khi sửa):** grep toàn
`apps/web/scripts/` không có code nào đọc file snapshot JSON rồi
rẽ nhánh theo `bundle === null` — chỉ có các harness ghi
snapshot và probe kiểm tra. Độc giả cũ từng kiểm
`snapshot.bundle == null` nay phải kiểm
`snapshot.bundle.status === "not-captured"`. Các file snapshot
CŨ trên đĩa vẫn giữ dạng `bundle: null` — chỉ snapshot MỚI dùng
dạng object; Q5 không viết lại file cũ (không sửa bằng chứng cũ).

**Giới hạn của sửa này (trung thực):** nó chỉ làm cho "không ghi
lại được" trở nên TƯỜNG MINH, không tự sinh ra bundle cho harness
WS. Muốn bundle thật trong snapshot WS thì harness đó phải tự
snapshot dist như nhóm pipe (snapshotDist) — việc riêng, chưa
làm ở đợt này. Riêng P2: nó phục vụ dist từ `tmp-round32-o3/dist`
nhưng không snapshotDist trong script nên Q5 giữ bundle null
(→ "not-captured") thay vì bịa hash từ thư mục tmp có thể đã bị
build đè sau lần chạy P2.

## 4. Kiểm kê cuối lượt: harness CDP nào đã nối

- **Pipe (`class PipeCdp`):** toàn bộ đã nối (nhóm J6/N2/O2 +
  O5 (P3) + P5 (Q5 mới)). Grep sau Q5: mọi file có `PipeCdp`
  đều chứa `captureCdpHangSnapshot`.
- **WebSocket (`class Cdp` / hàm send):** đã nối: bench-preview-fps,
  check-proxy-auto (O2), seek-o3-browser-probe (P3),
  seek-p2-underload-probe (Q5 mới), mobile-touch-check (Q5 mới,
  kèm timeout mới).
- **Snapshot /tmp:** 0 tham chiếu outDir /tmp còn lại trong các
  file đã nối (grep `vcut-cdp-hang-snapshots` không trả `/tmp/`
  ở 3 file Q5). Toàn bộ outDir mới đều trỏ thư mục bền
  `~/workspace/vcut-cdp-hang-snapshots/<tên-script>/`.
- 2 probe snapshot cũ của O2/P3 trong `_unspecified/` và các thư
  mục O2/P3 không bị Q5 đụng tới.

## 5. Probe Q5: treo giả lập trên class/hàm thật đã nối — 4/4 PASS

Probe mới `apps/web/scripts/clicktest-q5-round34-snapshot-probe.mjs`
(display :98, cổng WS 19323, JSON
`benchmarks/results/v34-q5-snapshot-probe.json`, exit 0,
allPass true). Cải tiến so với probe P3, ghi rõ để khỏi hiểu
nhầm là làm khác mẫu:

- **Không rm thư mục bền trước target** (xóa sẽ hủy bằng chứng
  treo thật nếu có giữa chừng) — thay bằng đếm delta: số file
  MỚI sau lượt ép timeout phải đúng 1. File probe được dọn sau
  kiểm chứng nên 3 thư mục mới trở lại rỗng như trước probe.
- **Timeout WS đơn định bằng stub ws** (send no-op) thay vì đua
  1ms với Chrome thật như probe P3 cho O3: handler timeout được
  chứng minh không phụ thuộc may rủi thời gian. Bù lại, mỗi
  target WS có thêm lượt resolve trên WS thật với class/hàm
  KHÔNG rút, chứng minh wiring không phá đường bình thường.
- **Warm-up tách bạch hạ tầng và wiring:** P2/mobile warm-up
  bằng round-trip CDP thủ công trên WS thật (không qua class
  trích) trước khi ép timeout; P5 warm-up bằng send thật qua
  pipe trước khi pause fd4.

| Target | Reject gốc | File mới | pid khớp | bundle | Đường thường |
|---|---|---|---|---|---|
| pipe, P5 (pid 2889) | `CDP timeout Target.getTargets` | đúng 1, trong `.../probe-round32-p5-webcodecs-pipe/` | PASS | not-captured | pipe sống sau timeout (Target.getTargets trả targetInfos) |
| WS, P2 (pid 3234) | `cdp timeout Target.getTargets` | đúng 1, trong `.../seek-p2-underload-probe/`, extra.transport = websocket | PASS | not-captured, timeoutMs ghi 60000 thật (chỉ timer bản trích rút 1ms) | class gốc trên WS thật resolve Target.getTargets |
| WS, mobile (pid 3452) | `cdp timeout Target.getTargets` | đúng 1, trong `.../mobile-touch-check/`, extra.transport = websocket | PASS | not-captured | hàm send trích trên WS thật resolve Target.getTargets; pending rỗng sau treo |
| module default + bundle | — (gọi trực tiếp) | đúng 2 file mới trong `.../_unspecified/` (1 null, 1 captured), đã dọn sau kiểm chứng | — | null → not-captured + note; có bundle → captured giữ nguyên tên/sha | — |

Kiểm chứng khác: `node --check` cả 4 file sửa + probe mới đều
pass; grep sau sửa: câu reject 3 harness giữ verbatim; mẫu delay
P2 `} }, 60000); }); }` đúng 1 lần trong class trích (probe fail
nếu khác 1); không còn tiến trình Chrome/Xvfb của probe sau khi
chạy (socket Xvfb :98 mồ côi do SIGKILL đã xóa tay; Xvfb :91 của
luồng khác không đụng tới).

**Giới hạn của chứng minh (trung thực):** P2/mobile dùng bản
trích (class/hàm) chứ không chạy nguyên script — nhưng bản trích
được lấy bằng khớp ngoặc từ file đã sửa và probe fail nếu trong
đó thiếu lệnh snapshot/timeout; đường đo thật của P2/mobile
(scrub/touch trên editor) không được chạy lại ở đợt này, Q5 chỉ
chứng minh wiring snapshot/timeout, không chứng minh lại kết quả
đo của P2/P5. Probe P5 chạy trên Chrome thật qua pipe như P3.

## 6. Nợ còn lại (không mạo nhận đã xong)

- Lần treo THẬT có snapshot vẫn chưa xảy ra — toàn bộ chứng
  minh ở đây (cả O2/P3/Q5) là treo giả lập.
- Snapshot bền vẫn chỉ nằm trên đĩa VM, không backup ra ngoài
  VM (giới hạn của O2) — snapshot treo cũ mất nếu VM bị thay thế.
- mobile-touch-check: vòng fetch `/json` chờ Chrome và chờ
  `ws.onopen` vẫn không timeout (ngoài send); CDP trả `d.error`
  vẫn resolve với `d.result` undefined như trước (hành vi cũ).
- Harness WS vẫn không ghi bundle thật vào snapshot (chỉ ghi
  rõ "not-captured") — muốn bundle thật cần snapshotDist cho
  từng harness WS, việc riêng chưa làm.
- Các file snapshot cũ trên đĩa vẫn giữ dạng `bundle: null`
  (Q5 không viết lại bằng chứng cũ).
- Không đo: Safari / touch thật / dpr > 1 / viewport khác /
  máy thật (toàn bộ đo là Chromium VM như các đợt trước).
- Tọa độ spinner tuyệt đối trên máy user vẫn chưa đo (nợ từ
  đợt 30 M5, không thuộc luồng này).

## 7. File Q5 đổi/thêm (CHỈ file Q5 — parent gộp batch, Q5 không tự tạo paths-loop)

SỬA (4 file; mỗi file chỉ thêm import + hằng outDir + khối
snapshot trong timeout handler (+ gán proc nếu là WS, + timeout
cho send() nếu là mobile); câu reject gốc giữ nguyên verbatim;
`node --check` pass):

- `apps/web/scripts/cdp-snapshot.mjs` (bundle luôn object + status/not-captured + header giải thích)
- `apps/web/scripts/seek-p2-underload-probe.mjs` (nối WS, mẫu O3)
- `apps/web/scripts/probe-round32-p5-webcodecs-pipe.mjs` (nối pipe, mẫu O5)
- `apps/web/scripts/mobile-touch-check.mjs` (timeout 60000ms cho send() + nối WS)

MỚI:

- `apps/web/scripts/clicktest-q5-round34-snapshot-probe.mjs` (probe §5; `node --check` pass)
- `docs/PHASE9_ROUND34_Q5_SNAPSHOT_LIMITS.md` (file này)
- `benchmarks/results/v34-q5-snapshot-probe.json` (probe 4/4, allPass true)

KHÔNG ĐỔI: `apps/web/scripts/seek-p2-retry-probe.ts`,
`apps/web/scripts/probe-round32-p5-page.js` (không có CDP, xem
§1), mọi file code sản phẩm, i18n, bridge, mọi harness O2/P3 đã
nối trước đó, mọi file snapshot cũ trên đĩa.
KHÔNG push, KHÔNG paths-loop (parent gộp batch, stage dưới tên
đợt 34).
