# Phase 9 đợt 30, luồng M5 — Kỷ luật snapshot khi treo CDP + đo lại D7 text-style + ghi chú spinner — LIMITS

Ngày: 2026-10-31 (lượt cron 20:03, chạy thực tế buổi chiều theo giờ
Asia/Saigon). Luồng M5 trong đợt lớn round 30. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG sửa code
sản phẩm, KHÔNG đụng file của luồng khác ngoại trừ 2 sửa đã nêu rõ
ở §5 (nối snapshot vào script CDP-DIAG của L5 + 1 comment ghi chú
vào header script spinnerprobe của L5 — cả hai đều không đổi ngữ
nghĩa test). KHÔNG stage batch (parent gộp), KHÔNG tự ghi
build-loop-log.

Đóng nợ docs/PHASE9_ROUND29_L5_CLICKTEST_LIMITS.md §7: (1) treo CDP
gốc thiếu snapshot nên kết luận nhiễu chưa tuyệt đối, (2) tọa độ
spinner đo trên Chromium VM chưa được ghi chú rõ ràng về pixel tuyệt
đối, (3) D7 text-style chưa đo lại.

## 0. Kết luận ngắn (không vượt số đo)

1. **Kỷ luật snapshot — ĐÃ CHỨNG MINH BẰNG TREO GIẢ LẬP, chưa chứng
   minh bằng treo thật:** module dùng chung mới
   `apps/web/scripts/cdp-snapshot.mjs` ghi snapshot RA FILE (không
   chỉ log) ngay lúc timeout, với đủ trường phân biệt Chrome chết /
   pipe tắc / page hang (timestamp, method, timeoutMs, proc pid +
   exitCode/signalCode/killed, pendingCount, danh sách tiến trình
   chrome, bundle name + sha256[:16]). Probe giả lập timeout 1ms có
   chủ đích trên pipe thật: PASS toàn bộ — reject vẫn đúng lỗi
   timeout gốc, đúng 1 file snapshot với mọi trường khớp (pid khớp
   Chrome thật, bundle khớp dist đang đo), pipe vẫn sống sau đó.
   Script CDP-DIAG của L5 đã được nối vào module này (không đổi
   ngữ nghĩa: hồi quy K6 guard vẫn 8/8, xem §4). Nhưng nói rõ:
   snapshot mới chỉ chứng minh được ở treo GIẢ LẬP — chưa có lần
   treo thật nào kích hoạt nó, nên "bắt được treo thật có snapshot"
   vẫn là việc của tương lai, không mạo nhận đã xong.
2. **D7 text-style — ĐÃ ĐO LẠI, PASS, không còn exception:** seed 2
   text clip KHÔNG trường `style` (1 nested đúng hình I6
   `TEXT-BLOCKED-LEAF`, 1 top-level theo câu hỏi mở J6 §6a), load
   bằng autosave trên browser thật, bundle `index-B1assKz-.js`
   sha256[:16] = 7659cc3fb1474449 (cùng bundle hồi quy đợt 29):
   tổng 0 exception sau load, trong đó 0 exception dạng
   animation/style — khác hẳn D7 gốc (5 exception/phiên). Kiểm
   chứng chống kết luận rỗng: leaf nested có thật trong spec sau
   load (`leaf-text-d7`, kind `text`, vẫn không style), canvas
   preview 1352×633 tồn tại. D7 đóng hoàn toàn trên bundle này.
   Lưu ý trung thực: autosave sau load vẫn KHÔNG gắn style vào clip
   top-level (topHasStyle=false) — tức lớp chuẩn hóa lúc load không
   viết lại style vào autosave theo đường này; việc hết exception
   được đo ở tầng browser, không quy kết chắc chắn cho một lớp code
   cụ thể nào (guard drawTextClip đợt 27 K1 hay chuẩn hóa load).
   Text nested vẽ bằng canvas nên không có trong `innerText` của
   DOM — `hasNested=false` ở DOM KHÔNG phải bằng chứng preview bỏ
   qua leaf đó, chỉ là giới hạn của tín hiệu DOM.
3. **Tọa độ spinner — ĐÃ GHI CHÚ, không claim máy thật:** ghi chú
   "đo trên Chromium VM, pixel tuyệt đối có thể khác trên máy user
   (dpr/viewport/font khác)" đã bổ sung vào LIMITS này (§3) và vào
   comment header của script spinnerprobe (không đổi code đo). Cơ
   chế tăng/giảm theo step đã khóa từ đợt 29 vẫn giữ nguyên, không
   đo lại spinner trong luồng này.
4. **Hồi quy — K6 guard 8/8, J6 17/17:** K6 guard chạy trên chính
   script đã nối snapshot: 8/8, 0 exception cả 2 phiên, không lần
   nào kích hoạt CDP-DIAG (0 timeout — đúng kỳ vọng, không phải
   bằng chứng chống treo). J6 split-intermediate: 17/17, 0 fail,
   0 seed-rejected.

## 1. Kỷ luật snapshot treo CDP — module dùng chung

File mới: `apps/web/scripts/cdp-snapshot.mjs`, export duy nhất
`captureCdpHangSnapshot({ proc, pendingCount, method, timeoutMs,
outDir, bundle, extra })`. Hàm đồng bộ (spawnSync cho `ps`), ghi
file `cdp-hang-<timestamp>-<method>-<pid>.json`, mỗi lần treo một
file riêng không ghi đè. Nếu ghi lỗi, trả `{ file: null, error }`
để caller vẫn reject đúng lỗi timeout gốc — chẩn đoán không bao
giờ được che lỗi gốc.

Quy trình bắt buộc (ghi trong header module, áp dụng cho mọi
harness pipe CDP từ nay):
- Gọi snapshot TRONG callback timeout của `send()`, TRƯỚC khi
  reject, không await, không retry lệnh, không kill Chrome.
- Snapshot phải ra FILE trong thư mục scratch của harness
  (`<scratch>/cdp-hang-snapshots/`), không chỉ log console — vì
  log mất khi harness bị SIGTERM (đúng kiểu sự cố đã gặp ở các đợt
  push), file thì còn.
- Bắt buộc kèm bundle đang đo (name + sha256[:16]) khi harness có
  snapshotDist — đây chính là mảnh đã thiếu ở lần treo gốc đợt 28.

Nối dây vào script CDP-DIAG (`clicktest-l5-round29-k6diag.mjs`,
3 chỗ, đều là harness, không đụng code sản phẩm):
- import module + biến module `HANG_BUNDLE`;
- timeout handler gọi `captureCdpHangSnapshot` sau log CDP-DIAG cũ
  (log cũ giữ nguyên để không mất định dạng quen thuộc) và log
  thêm đường dẫn file snapshot (hoặc lỗi ghi, kèm câu "vẫn reject
  lỗi timeout gốc");
- `main()` gán `HANG_BUNDLE = snap` ngay sau `snapshotDist()`.
Ngữ nghĩa test không đổi: cùng một lỗi reject, cùng một thứ tự
case, không thêm retry/kill. Bằng chứng: K6 guard 8/8 sau khi nối
(§4), và probe §2 chứng minh reject vẫn đúng lỗi gốc.

Các harness pipe CDP khác (J6, spinnerprobe, I6, dip...) CHƯA được
nối vào module này trong luồng này — chỉ script CDP-DIAG là phạm
vi đã giao ("script/harness dùng chung" được hiểu là module dùng
chung + script CDP-DIAG). Việc nối các harness còn lại là nợ mở
cho luồng sau, ghi rõ ở §6, không mạo nhận đã nối hết.

## 2. Kiểm chứng snapshot bằng treo giả lập (probe)

Harness mới: `apps/web/scripts/clicktest-m5-round30-snapshot-probe.mjs`
(cổng 4195, display :95, Chromium headed dưới Xvfb, pipe thật).
Kịch bản: sau khi pipe OK, gửi `Target.getTargets` với timeout
1ms có chủ đích — quá ngắn để phản hồi kịp nên timeout kích hoạt
chắc chắn, nhưng đây là treo GIẢ LẬP, không phải treo thật.

Kết quả (JSON `benchmarks/results/v30-m5-snapshot-probe.json`,
bundle `index-B1assKz-.js` sha256[:16] = 7659cc3fb1474449,
Chrome pid 10940):

| Check | Kết quả |
|---|---|
| Reject đúng lỗi timeout gốc | PASS — `CDP timeout Target.getTargets sau 1ms` |
| Số file snapshot tạo ra | đúng 1 file |
| Snapshot method / timeoutMs | `Target.getTargets` / 1 |
| Snapshot proc pid khớp Chrome thật | PASS (10940) |
| Snapshot proc còn sống (exitCode/signalCode null, killed false) | PASS — đúng trạng thái "treo giả lập, Chrome vẫn sống" |
| Snapshot ps chứa tiến trình chrome | PASS |
| Snapshot bundle khớp dist đang đo | PASS (name + sha256[:16] khớp) |
| Snapshot có timestamp parse được | PASS |
| Pipe vẫn dùng được sau timeout | PASS — `Target.getTargets` 30s sau đó resolve bình thường |

Kết luận đúng mức: cơ chế snapshot ĐÃ chứng minh kích hoạt đúng
lúc timeout với đủ trường. Điều CHƯA chứng minh: snapshot khi
treo THẬT (Chrome chết thật, pipe tắc thật) — các trường exitCode/
signalCode/ps lúc đó sẽ khác, và chỉ lần treo thật tương lai mới
cho thấy chúng. Không claim hơn thế.

## 3. Ghi chú tọa độ spinner (Chromium VM, không phải máy thật)

Nội dung ghi chú (đã bổ sung vào header script spinnerprobe của L5
và ghi lại ở đây để parent khỏi phải mở script):

> Mọi tọa độ spinner đo ở đợt 29 (ô 80×30, nút tăng y 30–45%, nút
> giảm y 55–70%, dải x cách mép phải 10–22px) đo trên Chromium
> headed dưới Xvfb của VM, cửa sổ 1920×1200, dpr = 1, font/UA mặc
> định của VM. Pixel tuyệt đối CÓ THỂ KHÁC trên máy user
> (dpr/viewport/font khác). Chỉ cơ chế tăng/giảm theo step qua
> đường UI thật là đã khóa; đừng copy pixel tuyệt đối sang máy
> thật mà không đo lại.

Không đo lại spinner trong luồng này (nợ đó đã đóng ở đợt 29, chỉ
thiếu ghi chú). Không claim gì về Safari/touch/dpr > 1/viewport
khác — toàn bộ đo của luồng này vẫn là Chromium VM như các đợt
trước.

## 4. Đo lại D7 + hồi quy J6/K6

### 4.1 D7 text-style — PASS, 0 exception

Harness mới: `apps/web/scripts/clicktest-m5-round30-d7.mjs` (cổng
4193, display :93). Seed (ghi rõ để tái hiện): track `t-d7`
chứa `TOP-D7 > MID-D7 > leaf-text-d7` (kind `text`, text
`TEXT-BLOCKED-LEAF`, start 0, duration 4, KHÔNG trường style —
đúng hình I6) + track text top-level `t-d7-top` chứa `D7-TOP`
(text `D7-TOP-NOSTYLE`, start 0, duration 4, KHÔNG style). Load
qua autosave, reload, chờ 10s cho preview vẽ qua nhiều frame
(D7 gốc ném NGAY lúc load nên 10s là dư).

Kết quả (JSON `benchmarks/results/v30-m5-d7.json`, bundle
`index-B1assKz-.js` sha256[:16] = 7659cc3fb1474449, Chrome pid
11711):

| Chỉ số | Giá trị |
|---|---|
| Tổng Runtime.exceptionThrown sau load | 0 |
| Exception dạng animation/style | 0 (D7 gốc: 5/phiên) |
| Leaf nested trong spec sau load | có (`leaf-text-d7`, kind `text`, vẫn không style) |
| Canvas preview | tồn tại, 1352×633 |
| Autosave: top clip có style sau load | không (topHasStyle=false) |
| DOM innerText chứa text top-level | có; chứa text nested | không (dự kiến: text nested vẽ bằng canvas) |

D7 đóng hoàn toàn trên bundle này, cả nested lẫn top-level (câu
hỏi mở J6 §6a nay có đáp án: top-level không style cũng 0
exception). Giới hạn: chỉ đo trên bundle này + Chromium VM; không
đo Safari/touch/dpr > 1; không quy kết chắc chắn lớp code nào đã
sửa (xem §0.2).

### 4.2 Hồi quy

- **K6 guard (script đã nối snapshot): 8/8 PASS** (JSON
  `benchmarks/results/v30-m5-regress-k6-guard.json`, display :91,
  cổng 4191, cùng bundle B1assKz-): K0–K3 vi + K6-no-crash-vi +
  K4/K5 en + K7-no-crash-en, 0 exception cả 2 phiên, 0 lần kích
  hoạt CDP-DIAG (0 timeout CDP trong suốt lần chạy). Việc nối
  snapshot không làm đổi kết quả K6 so với đợt 29.
- **J6 (split-intermediate): 17/17 PASS** (JSON
  `benchmarks/results/v30-m5-regress-j6.json`, display :90, cổng
  4190, cùng bundle B1assKz-): J0–J15 đầy đủ — tách thành công 3
  độ sâu + playhead + trung gian sâu + risky, 0 exception cả 2
  phiên, 0 seed-rejected.
  (Ghi chú sự cố của chính luồng này: lần chạy K6 đầu tiên bị
  dispatch trùng 2 lệnh song song cùng display/cổng do lỗi soạn
  lệnh, cả 2 đều chết khi service restart, không file JSON nào
  được tạo, không tiến trình nào còn sống — đã kiểm tra bằng `ps`
  trước khi chạy lại một lệnh duy nhất với display/cổng khác.
  Không có kết quả nào từ 2 lần chạy lỗi đó được tính.)

## 5. File đổi/thêm (không sửa code sản phẩm)

- MỚI `apps/web/scripts/cdp-snapshot.mjs` — module snapshot dùng
  chung (header ghi quy trình bắt buộc).
- MỚI `apps/web/scripts/clicktest-m5-round30-snapshot-probe.mjs` —
  probe treo giả lập 1ms trên pipe thật.
- MỚI `apps/web/scripts/clicktest-m5-round30-d7.mjs` — đo lại D7
  (nested + top-level, không style).
- SỬA `apps/web/scripts/clicktest-l5-round29-k6diag.mjs` — nối
  snapshot file vào timeout handler + gán HANG_BUNDLE sau
  snapshotDist (harness L5, không đổi ngữ nghĩa test; `node
  --check` pass; K6 guard 8/8 sau nối).
- SỬA `apps/web/scripts/clicktest-l5-round29-spinnerprobe.mjs` —
  CHỈ thêm comment ghi chú tọa độ VM vào header (không đổi code
  đo; `node --check` pass).
- MỚI `docs/PHASE9_ROUND30_M5_CDP_SNAPSHOT_LIMITS.md` — file này.
- Kết quả JSON (parent quyết có stage hay không):
  - `benchmarks/results/v30-m5-snapshot-probe.json` — probe PASS.
  - `benchmarks/results/v30-m5-d7.json` — D7 PASS (0 exception).
  - `benchmarks/results/v30-m5-regress-k6-guard.json` — K6 8/8.
  - `benchmarks/results/v30-m5-regress-j6.json` — J6 17/17.
- `node --check` cả 5 script: pass.
- Scratch của luồng (`~/workspace/tmp-round30-m5-probe/`,
  `tmp-round30-m5-d7/`) giữ lại snapshot probe + dist-snapshot để
  parent kiểm chứng (không dọn vội như các luồng trước, vì file
  snapshot probe chính là bằng chứng); scratch k6diag
  (`tmp-round29-l5-k6diag/`) do script L5 dùng chung, không dọn
  để khỏi đụng bằng chứng của L5.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch).

## 6. Nợ còn lại (không mạo nhận đã xong)

- Snapshot mới chứng minh ở treo GIẢ LẬP; lần treo THẬT có
  snapshot vẫn chưa xảy ra — kết luận "nhiễu hạ tầng" của đợt 29
  vẫn dừng ở tin cậy cao, không tuyệt đối, cho đến khi (nếu có)
  một lần treo thật để lại file trong `cdp-hang-snapshots/`.
- Các harness pipe CDP khác (J6, spinnerprobe, I6, dip...) chưa
  nối vào `cdp-snapshot.mjs` — chỉ script CDP-DIAG đã nối. Luồng
  sau nên nối nốt (mỗi script chỉ cần import + 1 lần gọi trong
  timeout handler + gán bundle sau snapshotDist, theo mẫu k6diag).
- Nhánh `!isFinite` của guard panel/store vẫn không tới được qua
  UI (nợ cũ đợt 28 §3, không thuộc phạm vi M5).
- Không đo: Safari / touch / dpr > 1 / viewport khác / máy thật
  (toàn bộ đo là Chromium headed dưới Xvfb của VM, dpr = 1).
- Tọa độ spinner tuyệt đối trên máy user vẫn chưa đo (chỉ ghi chú
  rõ giới hạn VM).
