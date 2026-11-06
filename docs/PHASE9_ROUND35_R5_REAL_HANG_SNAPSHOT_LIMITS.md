# Phase 9 đợt 35, luồng R5 — Lần treo THẬT có snapshot + snapshot WS — LIMITS

Ngày: 2026-11-02 (lượt cron 02:03 Asia/Saigon). KHÔNG push, KHÔNG
chạy push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release,
KHÔNG binary vào repo, KHÔNG sửa file paths-loop hay build-loop-log
(parent gộp batch), KHÔNG sửa code sản phẩm preview/render, KHÔNG
sửa script đo FPS của luồng khác (bench-preview-fps.mjs không đụng
tới — xem §6). Chỉ sửa script harness/snapshot + LIMITS này + JSON
kết quả probe.

Nguồn: docs/PHASE9_ROUND34_LIMITS.md §3 mục 5 và
docs/PHASE9_ROUND34_Q5_SNAPSHOT_LIMITS.md (đợt 34 mới chỉ có treo
giả lập; snapshot bền chỉ nằm trên đĩa VM; mobile-touch-check vòng
fetch /json + chờ ws.onopen chưa có timeout; CDP trả d.error vẫn
resolve với d.result undefined; harness WS chỉ ghi "not-captured").

## 0. Kết luận ngắn (không vượt số đo)

1. **Lần treo THẬT đã xảy ra và có snapshot (a):** probe R5 chạy
   Chrome thật, serve dist thật, navigate thật, xác nhận bundle đã
   nạp qua resource entries, rồi treo thật bằng
   `Runtime.evaluate` với `awaitPromise: true` trên
   `new Promise(()=>{})` — promise không bao giờ settle nên trình
   duyệt thật giữ response (không stub ws, không rút timeout).
   Timeout handler kích hoạt sau đúng 5013ms (đặt 5000ms), ghi
   đúng 1 snapshot bền, reject đúng `cdp timeout Runtime.evaluate`,
   và trình duyệt vẫn sống sau treo (Target.getTargets vẫn
   resolve, pending rỗng) — chứng tỏ chỉ lệnh đó treo, không phải
   Chrome chết.
2. **Snapshot WS nay ghi bundle thật (b):** module mới
   `cdp-bundle.mjs` (`snapshotBundleFromDist`) đọc entry script từ
   index.html của dist đang serve + hash sha256; `cdp-snapshot.mjs`
   passthrough thêm trường `dist`. seek-o3/seek-p2 nối SNAP đang
   serve; mobile nối dist của vite preview; check-proxy-auto nối
   qua biến môi trường tùy chọn. Snapshot treo thật của probe ghi
   `{ name: "index-DgObvvhC.js", sha256_16: "1f4ebcc7ae1ceff7",
   status: "captured", dist: ".../apps/web/dist" }`.
3. **Timeout fetch/open (c):** mobile-touch-check nay có AbortSignal
   từng lần fetch /json (5000ms, giữ nhịp 30 lần × 500ms) và chờ
   ws.onopen có timeout 30000ms + onerror; seek-o3/seek-p2,
   check-proxy-auto, dip-inline cùng được chặn fetch kẹt (và
   ready()/open đã có hoặc nay có timeout). Mọi timeout mới đều
   chỉnh qua biến môi trường; lệnh gọi send() cũ không đổi chữ
   nào (timeoutMs vẫn tùy chọn như đợt 34 Q5).
4. **CDP d.error (d):** mobile-touch-check nay reject với lỗi gốc
   verbatim `JSON.stringify(d.error)` như 4 harness WS còn lại đã
   làm; kiểm kê cuối: 5/5 harness WS đã nối snapshot đều reject
   d.error, 0 harness còn resolve trần. Hồi quy trên Chrome thật:
   lệnh không tồn tại reject `{"code":-32601,...}`, tham số sai
   kiểu reject `{"code":-32602,...}` — không còn resolve undefined.
5. **Probe R5: 29/29 check PASS** (30 dòng PASS in ra gồm 1 check
   bundle tiền điều kiện + 29 check trong JSON), exit 0, JSON
   `benchmarks/results/v35-r5-real-hang-probe.json` (allPass true,
   nhúng toàn bộ nội dung snapshot treo thật).

## 1. Phần mới của R5, theo từng mảnh

### (a) Treo thật — probe mới

`apps/web/scripts/clicktest-r5-round35-real-hang-probe.mjs`
(cổng CDP 19435, serve 19436, thư mục snapshot bền
`~/workspace/vcut-cdp-hang-snapshots/r5-round35-real-hang-probe/`):

- **Vì sao đây là treo thật, không phải giả lập:** đợt 34 dùng
  stub ws không gửi + rút timer về 1ms. R5 gửi lệnh thật tới
  Chrome thật; lệnh đó không bao giờ được trả lời vì bản thân
  promise trong trang không settle — không có thành phần nào của
  probe "giả vờ" treo. Timer 5000ms là timeout của send() (mẫu
  mobile sau sửa), không phải timer giả lập treo.
- **Bundle đang chạy là thật:** probe serve đúng apps/web/dist
  trên đĩa qua server tĩnh nội bộ (mẫu seek-o3), navigate tới
  đó, và chỉ treo sau khi resource entries chứa đúng
  `index-DgObvvhC.js`. Snapshot treo vì thế mang bundle thật
  đang chạy, không phải bundle đoán từ tên file.
- **Bằng chứng treo:** wall 5013ms ≈ timeout đặt 5000ms; đúng 1
  file snapshot mới; snapshot có capturedAt, method
  Runtime.evaluate, timeoutMs 5000, proc.pid = chrome pid 5643,
  pendingCount 0 sau xóa, bundle captured + dist + sha (xem §0.2);
  nội dung snapshot đầy đủ nhúng trong JSON kết quả.
- **Dọn dẹp theo kỷ luật Q5:** KHÔNG rm thư mục bền; chỉ xóa đúng
  2 file probe tự tạo (1 snapshot treo + 1 snapshot trực tiếp
  T4) sau khi đã nhúng nội dung vào JSON; thư mục trở lại 0 file
  như trước probe (check t4.snapshotDirBackToBaseline PASS).
  Không còn tiến trình Chrome của probe sau khi chạy (pid 5643
  đã kill; một pid thoáng qua khi kiểm tra sau đó đã tự hết,
  không phải tiến trình probe).

### (b) snapshotDist riêng từng harness WS

Module mới `apps/web/scripts/cdp-bundle.mjs`:

- `snapshotBundleFromDist(distDir)`: null khi thiếu index.html
  (giữ hành vi cũ, không bịa); ngược lại lấy script entry đầu
  tiên trong index.html còn tồn tại trên đĩa, hash sha256 16 ký
  tự đầu của đúng file đó (`source: "index-entry"`); fallback duy
  nhất là file .js lớn nhất dưới assets/ với source ghi rõ
  `"assets-largest"` (không mạo nhận là entry đã xác định).
  Chỉ đọc + hash, không copy/build/sửa dist.
- `cdp-snapshot.mjs`: bundle captured nay passthrough thêm
  `dist` khi harness cung cấp (từ `bundle.dist ?? bundle.dir`);
  harness cũ không truyền thì không thêm trường — hình dạng
  snapshot cũ giữ nguyên.

Nối từng harness (bundle tính MỘT LẦN lúc khởi động, trước khi
serve/đo — xem giới hạn ở §6):

| Harness | Dist dùng làm snapshotDist | Mặc định khi không xác định được |
|---|---|---|
| seek-o3-browser-probe.mjs | SNAP đang serve (`O3_SNAP`) | null → "not-captured" (main vốn throw khi thiếu index) |
| seek-p2-underload-probe.mjs | SNAP đang serve (`P2_SNAP`) | null → "not-captured" |
| mobile-touch-check.mjs | `MOBILE_TOUCH_DIST_DIR`, nếu không đặt và PREVIEW_URL vẫn là mặc định 4173 (vite preview) và apps/web/dist có index.html thì dùng dist đó | null → "not-captured" (vite dev / dist thiếu) |
| check-proxy-auto.mjs | Chỉ khi đặt `CHECK_PROXY_DIST_DIR` (script chạy trên vite dev nên mặc định vẫn null) | null → "not-captured" như cũ |
| bench-preview-fps.mjs | KHÔNG NỐI (xem §6 — cấm sửa script đo FPS của luồng khác) | vẫn null → "not-captured" |

Snapshot treo của các harness trên nay ghi thêm `extra.distDir`
khi có bundle, để đối chiếu nhanh mà không cần mở trường bundle.

### (c) Timeout cho vòng fetch /json + chờ ws.onopen

- **mobile-touch-check.mjs (mảnh bắt buộc):** mỗi lần fetch có
  `AbortController` riêng, cắt sau `CDP_JSON_ATTEMPT_TIMEOUT_MS`
  (mặc định 5000ms) rồi thử lại như lỗi kết nối thường — nhịp
  30 lần × 500ms giữ nguyên. Chờ mở socket nay có timeout
  `CDP_WS_OPEN_TIMEOUT_MS` (mặc định 30000ms) + onerror reject
  lỗi rõ ràng (`ws open timeout ...` / `ws open error: ...`); lỗi
  thoát qua finally (đóng ws, kill Chrome) như hành vi timeout
  send() từ đợt 34 Q5, không treo lặng.
- **Cùng mẫu, đã chặn thêm:** seek-o3/seek-p2 (fetch abort 5000ms,
  nhịp 60 lần × 500ms giữ nguyên; ws.onopen đã có timeout 15s từ
  trước nên giữ nguyên), check-proxy-auto (fetch abort 5000ms +
  `ready()` nay có timeout 30000ms thay vì chờ open vô hạn),
  measure-browser-dip-inline-round31-n6.mjs (fetch abort 5000ms,
  nhịp 50 lần × 200ms giữ nguyên; open timeout 30000ms thay vì
  chờ vô hạn). Dip-inline chỉ kiểm chứng bằng `node --check`,
  không chạy lại phép đo (xem §6).
- **Giữ hành vi cũ:** mọi timeout mới đều qua biến môi trường
  với mặc định bằng hoặc rộng hơn nhịp cũ; `send(method, params)`
  và `send(method, params, timeoutMs)` không đổi chữ ký.

### (d) CDP trả d.error — sửa ở điểm có thể chung nhất

- **Không có class WS dùng chung:** mỗi harness có một bản sao
  Cdp/send riêng nên không có "điểm chung" duy nhất để sửa một
  chỗ (khác với module snapshot dùng chung đã sửa ở (b)). R5 vì
  vậy sửa đúng chỗ lỗi + kiểm kê toàn bộ.
- **mobile-touch-check.mjs là harness duy nhất còn lỗi:** trước
  đây `entry.resolve(d.result)` bất kể d.error nên caller nhận
  undefined lặng (ví dụ `ev()` sau đó đọc `r.exceptionDetails`
  trên undefined và ném TypeError che mất lỗi CDP gốc). Nay:
  `if (d.error) entry.reject(new Error(JSON.stringify(d.error)));
  else entry.resolve(d.result);` — giữ reject gốc verbatim như
  seek-o3/seek-p2/bench/check-proxy đã làm, không ghi thêm vào
  snapshot (lỗi CDP thường không phải treo nên không cần
  snapshot; timeout mới là trường hợp ghi snapshot).
- **Kiểm kê sau sửa (probe T5):** bench, check-proxy-auto,
  seek-o3, seek-p2, mobile đều chứa nhánh reject d.error (5/5);
  pipe Cdp đã reject `msg.error` từ trước (dip-browser-pipe,
  p5-webcodecs-pipe) nên không đổi. Không còn
  `entry.resolve(d.result);` trần trong mobile (probe kiểm tra
  chuỗi cũ đã biến mất).

## 2. Probe R5 — kết quả đầy đủ

`benchmarks/results/v35-r5-real-hang-probe.json`, allPass true,
29 check trong JSON (cộng 1 check bundle tiền điều kiện in ra
ngoài JSON = 30 dòng PASS):

- T1 đường thường: Page/Runtime enable + Target.getTargets
  resolve, pending 0.
- T2 d.error: unknown method reject verbatim
  `{"code":-32601,"message":"'Bogus.noSuchMethod' wasn't found"}`;
  tham số sai kiểu reject
  `{"code":-32602,"message":"Invalid parameters","data":"Failed
  to deserialize params.expression ..."}`.
- T3 treo thật: bundle đã nạp (resource entries chứa bundle);
  reject `cdp timeout Runtime.evaluate` sau 5013ms; đúng 1 file
  snapshot mới; snapshot khớp pid 5643, timeoutMs 5000,
  pendingCount 0, bundle captured + dist + sha; trình duyệt vẫn
  sống sau treo.
- T4 bundle helper: fixture dist cho đúng tên + sha tính lại
  (`fixture-abc.js`, sha b58b7949bdf69801, source index-entry);
  thư mục thiếu → null; thư mục không index.html → null;
  snapshot trực tiếp qua cdp-snapshot.mjs có status captured +
  dist; thư mục snapshot trở lại baseline 0 file.
- T5 wiring tĩnh: mobile (derror, không resolve trần, fetch
  abort, open timeout, bundle), o3/p2 (SNAP bundle + fetch
  abort), check-proxy (dist tùy chọn), cdp-snapshot (dist
  passthrough), kiểm kê 5/5 harness WS reject d.error.

Kiểm chứng khác: `node --check` pass cho cả 8 file sửa/mới
(cdp-bundle, cdp-snapshot, mobile-touch-check, seek-o3,
seek-p2, check-proxy-auto, dip-inline, probe R5). Đường đo thật
của mobile (scrub/pinch trên editor) KHÔNG chạy lại ở đợt này —
R5 chỉ chứng minh wiring timeout/snapshot/d.error, không chứng
minh lại kết quả touch của Q6 (cùng giới hạn như Q5 với P2/P5).

## 3. File R5 đổi/thêm (parent gộp batch — R5 KHÔNG tự tạo paths-loop)

SỬA (6 file):

- `apps/web/scripts/cdp-snapshot.mjs` (bundle captured passthrough
  trường `dist` + cập nhật header; hình dạng snapshot cũ không
  truyền dist thì giữ nguyên)
- `apps/web/scripts/mobile-touch-check.mjs` (bundle HANG_BUNDLE từ
  vite preview dist + fetch AbortSignal + ws open timeout +
  d.error reject verbatim; logic đo touch không đụng một chữ)
- `apps/web/scripts/seek-o3-browser-probe.mjs` (HANG_BUNDLE từ SNAP
  + fetch AbortSignal; logic đo không đụng)
- `apps/web/scripts/seek-p2-underload-probe.mjs` (HANG_BUNDLE từ
  SNAP + fetch AbortSignal; logic đo không đụng)
- `apps/web/scripts/check-proxy-auto.mjs` (HANG_BUNDLE tùy chọn qua
  CHECK_PROXY_DIST_DIR + fetch AbortSignal + ready() timeout;
  logic kiểm chứng proxy không đụng)
- `apps/web/scripts/measure-browser-dip-inline-round31-n6.mjs`
  (fetch AbortSignal + ws open timeout; logic đo dip không đụng,
  chỉ `node --check`, chưa chạy lại)

MỚI (3 file):

- `apps/web/scripts/cdp-bundle.mjs` (module snapshotBundleFromDist)
- `apps/web/scripts/clicktest-r5-round35-real-hang-probe.mjs`
  (probe §2; `node --check` pass, chạy thật exit 0)
- `docs/PHASE9_ROUND35_R5_REAL_HANG_SNAPSHOT_LIMITS.md` (file này)
- `benchmarks/results/v35-r5-real-hang-probe.json` (probe 29/29
  trong JSON, allPass true, nhúng toàn bộ snapshot treo thật)

KHÔNG ĐỔI: mọi file code sản phẩm, i18n, bridge,
bench-preview-fps.mjs (xem §6), mọi file paths-loop,
build-loop-log, mọi file snapshot cũ trên đĩa, mọi thư mục
snapshot bền khác (mobile-touch-check vẫn rỗng — chưa có lần
treo thật nào ở chính harness mobile, xem §6).

## 4. Nợ còn lại (không mạo nhận đã xong)

- Snapshot bền vẫn chỉ nằm trên đĩa VM, không backup ra ngoài VM
  (giới hạn từ O2, R5 không sửa) — snapshot treo cũ mất nếu VM bị
  thay thế. Bằng chứng lần treo thật của R5 còn trong JSON kết
  quả (trong repo, sẽ lên GitHub theo batch) nên không mất cùng
  VM, nhưng file snapshot gốc trong
  `~/workspace/vcut-cdp-hang-snapshots/` thì vẫn chỉ ở VM.
- Lần treo thật mới chứng minh cho đúng một dạng treo: lệnh CDP
  không bao giờ được trả lời (evaluate promise không settle).
  Chưa chứng minh treo do page deadlock, target kẹt, hay Chrome
  đơ toàn bộ (khi đó snapshot proc/ps sẽ khác — ps trong snapshot
  R5 ghi Chrome vẫn sống, CPU bình thường).
- Lần treo thật xảy ra ở probe R5, chưa xảy ra ở chính harness
  mobile-touch-check hay seek-o3/seek-p2 trong lúc đo thật — các
  harness đó nay đã có wiring đúng (probe T5 kiểm tra chuỗi mẫu)
  nhưng đường đo thật của chúng chưa chạy lại ở đợt này.
- Bundle snapshot chỉ tính lúc khởi động, không đóng băng cả
  thư mục dist như harness pipe (pipe copy dist vào snapDir).
  Nếu dist bị build đè giữa lúc đo thì snapshot giữ hash lúc đầu
  — đúng với thời điểm bắt đầu đo, nhưng không tái hiện được
  bundle lúc treo nếu dist đã đổi. Muốn đóng băng thật thì harness
  WS phải copy dist như pipe (việc riêng, chưa làm).
- Dist dùng trong probe là dist đã có trên đĩa lúc chạy (bundle
  index-DgObvvhC.js, sha 1f4ebcc7ae1ceff7, mtime ghi trong JSON),
  KHÔNG phải build của R5 — probe cố tình không build lại để
  tránh đua với luồng khác đang chạy song song. Vì vậy số này
  chứng minh cơ chế bundle, không chứng minh bundle của đợt 35.
- bench-preview-fps.mjs vẫn ghi "not-captured" (xem §6).
- Timeout mở socket mới (mobile 30000ms, o3/p2 giữ 15s cũ) có
  thể fail trên VM cực chậm nếu Chrome khởi động quá chậm — trước
  đây chờ vô hạn nên không fail dạng này; bù lại nay không treo
  lặng. Cả hai đều chỉnh được qua CDP_WS_OPEN_TIMEOUT_MS.
- Không đo: Safari / touch thật / dpr > 1 / viewport khác / máy
  thật (toàn bộ đo là Chromium VM như các đợt trước).

## 5. Ghi chú cho parent khi gộp batch

- Thứ tự file chung: cdp-snapshot.mjs + cdp-bundle.mjs là nền cho
  cả 5 harness sửa; đừng tách chúng khỏi batch.
- mobile-touch-check có thêm biến môi trường mới
  (MOBILE_TOUCH_DIST_DIR, CDP_JSON_ATTEMPT_TIMEOUT_MS,
  CDP_WS_OPEN_TIMEOUT_MS) — mặc định đã giữ hành vi cũ nên không
  cần đặt gì thêm khi chạy lại.
- Probe R5 dùng cổng 19435/19436 và thư mục snapshot riêng — không
  đụng cổng/thư mục của luồng khác; đã dọn sạch sau khi chạy.

## 6. Quyết định biên (để khỏi hiểu nhầm là bỏ sót)

- **bench-preview-fps.mjs không nối bundle:** brief R5 cấm sửa
  script đo FPS của luồng khác; bench là script đo FPS nên R5
  không đụng tới dù nó là harness WS. Module cdp-bundle.mjs đã
  sẵn sàng để một luồng sau nối bench (chỉ cần import + truyền
  dist dir khi chạy trên preview/dist, hoặc giữ null khi chạy
  trên vite dev).
- **dip-inline chỉ sửa timeout, không nối snapshot:** script này
  chưa từng nối snapshot treo (không có Cdp timeout handler để
  nối) nên ngoài phạm vi (b); R5 chỉ chặn hai chỗ treo vô hạn
  cùng mẫu (fetch/open) vì brief cho phép "harness WS tương tự
  nếu cùng mẫu", và chỉ kiểm chứng bằng `node --check`.
- **Không refactor thành class WS dùng chung:** brief (d) nói
  "sửa ở điểm chung nếu có" — thực tế không có điểm chung (mỗi
  harness một bản sao Cdp), và refactor 5 harness về một class
  trong một luồng snapshot là rủi ro vỡ đường đo; R5 sửa đúng
  chỗ lỗi + kiểm kê toàn bộ thay vì refactor.
