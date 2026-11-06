# Phase 9 đợt 36, luồng S6 — Snapshot bền + đóng băng dist WS + bench wiring — LIMITS

Ngày: 2026-11-02 (lượt cron 08:03 Asia/Saigon). KHÔNG push, KHÔNG
chạy push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release,
KHÔNG binary vào repo, KHÔNG sửa code sản phẩm (`apps/web/src`,
i18n, bridge), KHÔNG sửa file paths-loop hay build-loop-log (parent
gộp batch), KHÔNG sửa script đo của luồng khác ngoài 2 harness WS
được giao (bench + seek-o3 — xem §4 để biết vì sao 2 file này được
đụng tới và mobile/check-proxy thì không).

Nguồn: `docs/PHASE9_ROUND35_LIMITS.md` §3 mục 6 (nợ snapshot) +
`docs/PHASE9_ROUND35_R5_REAL_HANG_SNAPSHOT_LIMITS.md` +
`docs/PHASE9_ROUND34_Q5_SNAPSHOT_LIMITS.md` +
`docs/PHASE9_ROUND35_R2_FROZEN_DIST_LIMITS.md` (mẫu đóng băng pipe).

## 0. Kết luận ngắn (không vượt số đo)

1. **Backup snapshot bền ĐÃ CHẠY THẬT (a):** 6 file snapshot treo
   cũ trong `~/workspace/vcut-cdp-hang-snapshots/` đã được copy sang
   vị trí bền trong workspace goal
   `~/workspace/goals/capcut-clone-video-editor/hidden_files/cdp-hang-snapshots-backup/20261102-012334/`
   kèm `manifest.json` (sha256 từng file) + `index.json` ở gốc;
   `--verify` trên backup thật trả OK (6 file khớp manifest).
   Script `cdp-snapshot-backup.mjs` có đủ 3 chế độ backup / verify /
   restore; restore đã kiểm chứng trên thư mục giả (tmp), KHÔNG
   chạy restore lên thư mục snapshot thật để khỏi đụng bằng chứng.
2. **Đóng băng dist cho harness WS ĐÃ LÀM XONG (b):** module mới
   `cdp-dist-freeze.mjs` (manifest sha256 toàn dist, format khớp
   Q6/R2 để so sánh xuyên harness) đã nối vào bench (manifest
   trước/sau + bản sao copy kiểu pipe tùy chọn + vi phạm → INVALID
   + exit 3) và seek-o3 (manifest SNAP trước/sau + vi phạm →
   INVALID + error + exit 2 theo quy ước sẵn có của probe đó).
   Cả hai nhánh VALID và INVALID đều đã kích hoạt THẬT bằng chạy
   live (xem §2).
3. **Bench đã nối cdp-bundle.mjs (c):** bench nay ghi bundle thật
   vào snapshot treo (thay vì null → "not-captured") khi chạy với
   `--dist-dir`/`BENCH_DIST_DIR`; lần bench live qua vite preview
   ghi đúng bundle `index-B3uq-AN2.js` sha `c7eae59af10f8778` +
   frozenDist VALID. Caveat bắt buộc (xem §3): bundle này chỉ là
   "bundle đang đo" khi PAGE_URL serve đúng distDir đó.
4. **Dạng treo thứ hai ĐÃ THÊM (d):** probe S6 chứng minh treo thật
   thứ hai — page kẹt vòng lặp vô hạn đồng bộ `while(true){}` —
   khác promise không settle ở dấu hiệu hành vi: sau H1 (promise)
   evaluate khác vẫn resolve (renderer rảnh), sau H2 (vòng lặp)
   evaluate khác cũng timeout (renderer kẹt), dù lệnh mức browser
   vẫn resolve ở cả hai. Probe 31/31 check, allPass=true, exit 0.
   KHÔNG mạo nhận đây là deadlock đa tài nguyên hay Chrome đơ
   toàn bộ (xem §5).

## 1. Phần mới của S6, theo từng mảnh

### (a) Backup bền — script + lần backup thật

`apps/web/scripts/cdp-snapshot-backup.mjs` (3 chế độ, xem header
file để biết đầy đủ cách dùng và biến môi trường):

- **Backup (mặc định):** duyệt đệ quy nguồn
  `~/workspace/vcut-cdp-hang-snapshots/` lấy mọi `*.json`, copy giữ
  nguyên đường dẫn tương đối sang
  `<BACKUP_ROOT>/<YYYYMMDD-HHMMSS>/`, ghi `manifest.json` trong
  chính thư mục backup đó (createdAt, sourceDir, fileCount,
  totalBytes, danh sách `{ rel, sha256, size }`) và thêm 1 entry
  vào `<BACKUP_ROOT>/index.json`. KHÔNG xóa file nguồn, không ghi
  đè backup cùng tên (thư mục đã tồn tại → exit 2).
- **Verify:** `--verify <thư-mục-backup>` — hash lại từng file theo
  manifest, báo missing/mismatch/extra; exit 0 khi khớp, exit 1
  khi lệch.
- **Restore:** `--restore <thư-mục-backup> [--force]` — copy về
  thư mục nguồn (hoặc `CDP_SNAP_RESTORE_TARGET`); file đích đã có
  và hash khớp thì bỏ qua; file đích khác hash mà không có
  `--force` thì DỪNG, không ghi đè; sau copy kiểm tra lại hash.
- **Lần backup thật (02/11, 01:23 UTC):**
  đích `.../hidden_files/cdp-hang-snapshots-backup/20261102-012334/`,
  files=6, totalBytes=25926,
  manifestSha256=`fbd6e95084123335a38dae4745e93ef59cf12c2f5eb121ebb2a2af01bdde4f45`,
  verify OK. 6 file này là snapshot treo GIẢ LẬP thời Q5 (01/11)
  còn sót lại — snapshot treo THẬT của R5 đã bị chính probe R5 xóa
  sau khi nhúng vào JSON (kỷ luật R5), nên backup này KHÔNG hồi
  sinh được file snapshot R5; nội dung snapshot R5 vẫn còn trong
  `benchmarks/results/v35-r5-real-hang-probe.json` (trong repo).
  Backup bảo vệ bằng chứng HIỆN CÓ khỏi bị xóa/dọn thư mục nguồn,
  không phải cỗ máy thời gian cho file đã xóa trước đó — ghi rõ để
  khỏi hiểu nhầm.
- **Giới hạn của chữ "ngoài VM" (trung thực):** theo đúng định
  nghĩa của brief S6, "bền ra ngoài VM" ở đây là vị trí bền trong
  workspace goal + manifest/index + script khôi phục/kiểm tra —
  KHÔNG phải đẩy lên dịch vụ ngoài nào khác (không có dịch vụ nào
  được cấp cho luồng này). Vì workspace goal vẫn nằm trên cùng đĩa
  VM, backup này chống mất do dọn/xóa thư mục nguồn và cho một bản
  sao thứ hai có manifest đối chiếu được, nhưng KHÔNG chống được
  trường hợp toàn bộ đĩa VM bị thay thế. Muốn chống trường hợp đó
  thì phải có đích ngoài máy thật (repo GitHub chỉ chứa JSON kết
  quả probe, không chứa thư mục snapshot) — việc đó vẫn mở (§5).

### (b) Đóng băng dist cho harness WS — module + 2 harness đã nối

`apps/web/scripts/cdp-dist-freeze.mjs` (chỉ đọc + hash + copy,
không build, không sửa dist nguồn):

- `distManifest(dir)`: liệt kê đệ quy mọi file, sắp xếp theo
  đường dẫn tương đối, mỗi dòng `${sha256}  ${rel}`, manifestSha256
  = sha256 của các dòng nối bằng `"\n"` (không newline cuối) —
  CỐ TÌNH khớp format probe Q6 đợt 34 / R2 đợt 35 nên hash của cùng
  một dist so sánh được xuyên harness. File đọc lỗi ghi
  `"unreadable"` như Q6 thay vì lặng lẽ bỏ file.
- `verifyDistManifest(dir, expectedManifest)`: trả
  `{ valid, problems, manifest }` — lệch là kết quả đo (INVALID),
  không throw; chỉ throw khi dir không đọc được (lỗi hạ tầng).
- `freezeDistCopy(srcDir, destDir)`: copy toàn bộ dist sang đích
  rồi kiểm tra manifest bản sao bằng manifest nguồn (mẫu pipe N2);
  đích đã tồn tại và không rỗng → throw, không tự xóa.
- **Bench** (`bench-preview-fps.mjs`): `--dist-dir` /
  `BENCH_DIST_DIR` bật đóng băng; `--frozen-copy-dir` /
  `BENCH_FROZEN_COPY_DIR` bật thêm bản sao copy kiểu pipe lúc khởi
  động (kiểm tra manifest bản sao ngay lúc copy). distDir thiếu
  index.html → từ chối chạy exit 2 trước khi spawn bất cứ gì (mẫu
  R2). Kết quả JSON luôn có `frozenDist` (validity VALID/INVALID/
  UNVERIFIED khi không đặt dist-dir); INVALID → fps bị loại,
  exit 3 (cả đường đo thành công lẫn đường lỗi — INVALID lấn lỗi
  đo thường như R2).
- **seek-o3** (`seek-o3-browser-probe.mjs`): SNAP vốn đã là bản sao
  copy trước khi chạy (kiểu pipe) nên S6 chỉ thêm lớp kiểm chứng:
  manifest SNAP lúc khởi động + đối chiếu trước khi ghi JSON;
  INVALID → `out.frozenDist.validity = "INVALID"` và (nếu chưa có
  lỗi khác) `out.error` + exit 2 — exit 2 là quy ước lỗi sẵn có của
  probe này, khác số 3 của bench/R2 nhưng cùng ngữ nghĩa "vi phạm
  → kết quả bị loại" (ghi rõ để khỏi tưởng là hai chuẩn mâu thuẫn).
  Logic đo/khám phá của seek-o3 không đụng một chữ; manifest tính
  2 lần mỗi lượt (254 file, chi phí không đáng kể so với lượt đo).
- **Vì sao mobile/check-proxy KHÔNG nối đóng băng ở đợt này:**
  mobile-touch-check chỉ xác định được dist khi đặt
  `MOBILE_TOUCH_DIST_DIR` hoặc khi preview mặc định 4173 (mặc định
  vẫn là vite dev → dist null, đóng băng không có ý nghĩa);
  check-proxy-auto mặc định chạy trên vite dev, dist chỉ tùy chọn
  qua biến môi trường. Nối đóng băng vào 2 harness đó khi chưa có
  dist xác định sẽ chỉ thêm trường UNVERIFIED, không thêm bằng
  chứng. Module `cdp-dist-freeze.mjs` đã sẵn sàng để một luồng sau
  nối chúng khi dist của chúng được cố định (chỉ cần import +
  gọi `distManifest`/`verifyDistManifest` như bench).

### (c) Nối cdp-bundle.mjs cho bench

- Bench nay import `snapshotBundleFromDist` và tính
  `HANG_BUNDLE` từ `BENCH_DIST_DIR` lúc khởi động; timeout handler
  của `Cdp.send()` truyền `bundle: HANG_BUNDLE` (trước đây là
  `bundle: null`) + `extra.distDir` khi có bundle — cùng mẫu
  seek-o3 sau R5. Không đặt `--dist-dir` → HANG_BUNDLE null →
  hành vi cũ giữ nguyên (snapshot "not-captured").
- **Caveat bắt buộc khi trích dẫn:** field `frozenDist` trong JSON
  bench có `servesDistAssumption` ghi rõ: bundle/manifest này chỉ
  là bundle đang đo khi PAGE_URL serve đúng distDir đó (vite
  preview của dist đó). Khi đo vite dev mà vẫn đặt `--dist-dir`
  thì bundle ghi ra chỉ là "dist trên đĩa lúc bắt đầu đo", KHÔNG
  phải bundle dev server đang serve — đừng trích dẫn nó như bundle
  đã đo trong trường hợp đó.

### (d) Dạng treo thứ hai: page kẹt vòng lặp (H2)

Probe mới `apps/web/scripts/clicktest-s6-round36-snapshot-backup-probe.mjs`
(cổng CDP 19447, serve 19448, thư mục snapshot riêng
`s6-round36-snapshot-backup-probe`, dist trên đĩa lúc chạy — bundle
`index-B3uq-AN2.js`, sha `c7eae59af10f8778`, khác bundle đợt 35 vì
một luồng khác đã build lại dist giữa chừng; probe KHÔNG tự build
lại để tránh đua, và KHÔNG claim đây là build của S6):

- **H1 (hồi quy R5):** `Runtime.evaluate` với `awaitPromise: true`
  trên `new Promise(()=>{})` — timeout sau 5018ms (đặt 5000ms),
  đúng 1 snapshot mới, snapshot khớp pid Chrome, bundle captured +
  dist + sha, trình duyệt sống sau treo, và evaluate `1+1` sau đó
  resolve `2` (renderer vẫn rảnh).
- **H2 (mới):** `Runtime.evaluate` với `while(true){}` đồng bộ —
  timeout sau 5021ms (đặt 5000ms), đúng 1 snapshot mới, snapshot
  khớp pid/bundle như H1, trình duyệt vẫn sống ở mức browser
  (`Target.getTargets` resolve), NHƯNG evaluate `1+1` sau đó cũng
  timeout sau 3000ms (đúng 1 snapshot phụ timeoutMs 3000, đã đếm
  và dọn cùng các snapshot treo) — chứng tỏ thread chính của
  renderer vẫn kẹt trong vòng lặp. Đây là dấu hiệu phân biệt H1/H2
  có tính quyết định, không phụ thuộc vào %cpu.
- **Phát hiện phụ (trung thực):** %cpu trong snapshot (ps
  lifetime-average) KHÔNG phân biệt được H1/H2: lần chạy đầu
  H1 maxCpu 26,2 vs H2 24,3; lần chạy xanh H1 15,5 vs H2 9,7 — trung
  bình lifetime bị pha loãng bởi thời gian page load trước đó nên
  không dùng làm chữ ký. Probe giữ số này dưới dạng đo thông tin
  (`h2.cpuSignatureRecorded`), không dùng làm check phân biệt.
  Muốn chữ ký CPU thật thì phải lấy mẫu /proc tick-delta trong
  cửa sổ treo (việc riêng, chưa làm — xem §5).

## 2. Kiểm chứng live (không phải claim suông)

- `node --check` pass cho cả 5 file sửa/mới: cdp-dist-freeze,
  cdp-snapshot-backup, bench-preview-fps, seek-o3-browser-probe,
  probe S6.
- **Probe S6: 31/31 check, allPass=true, exit 0**
  (`benchmarks/results/v36-s6-snapshot-backup-probe.json`): unit
  đóng băng 5/5 (manifest xác định, copy khớp, đích không rỗng →
  throw, sửa file → INVALID, bản sao nguyên vẹn vẫn VALID); backup
  e2e 5/5 trên thư mục giả (backup exit 0, manifest 2 file, verify
  OK, sửa 1 byte trong bản sao → verify exit 1, restore hash
  khớp); wiring tĩnh 4/4; treo thật H1+H2 + dọn dẹp (thư mục
  snapshot probe trở lại 0 file như trước).
- **Backup thật + verify thật:** 6 file, manifest
  `fbd6e950…`, verify OK (xem §1a).
- **seek-o3 live (DISCOVER, SNAP = bản sao scratch của dist, chạy
  từ thư mục tmp để JSON không ghi đè kết quả repo):** exit 0,
  frozenDist VALID, 254 file, manifest trước = sau =
  `fbface705adf4de12e9f1ff8505ba551b6d9026d9f75b3f05c805289f1b827b0`.
- **Bench live VALID (vite preview cổng 5192 serve dist thật,
  BENCH_DIST_DIR = dist thật, frozen-copy sang scratch):** exit 0,
  frozenDist VALID (trước = sau = `fbface70…`, 254 file), bundle
  `index-B3uq-AN2.js` sha `c7eae59af10f8778`, fpsAvg 2,88
  (11 frame / 3s, playing=true, overlay FPS có). Số fps này THẤP
  và KHÔNG được dùng làm baseline: đo trên VM đang chịu tải của
  các luồng song song khác, project mẫu phát chậm (time-display
  chỉ nhích 00:00.0 → 00:00.2 sau khi bấm Phát); nó chỉ chứng minh
  đường đo + đóng băng chạy được, không phải hiệu năng sản phẩm.
  fpsMin1s/fpsMax1s null vì mỗi bucket 1s có < 5 frame.
- **Bench live INVALID (vite preview cổng 5193 serve dist thật,
  BENCH_DIST_DIR = bản sao scratch, sửa thêm 1 dòng vào bundle của
  bản sao ở giây thứ 12 giữa lượt):** exit 3, frozenDist INVALID
  (trước `fbface70…` ≠ sau `9ab83f6a…`), fpsAvg 11,16 trong JSON
  BỊ LOẠI theo thiết kế (log ghi rõ "fps bị loại, exit 3").
  Đây là lần kích hoạt thật của nhánh INVALID ở bench — khác với
  R2, nơi điều kiện (b)(c) vẫn chưa có lần kích hoạt thật.
- **Dọn dẹp:** sau các lượt live, không còn tiến trình preview
  5192/5193, Chrome probe, hay file snapshot probe nào (thư mục
  probe 0 file); các thư mục scratch chỉ nằm ở
  `~/workspace/tmp-round36-s6/` (không vào batch, không vào repo).

## 3. File S6 đổi/thêm (parent gộp batch — S6 KHÔNG tự tạo paths-loop)

SỬA (2 file):

- `apps/web/scripts/bench-preview-fps.mjs` (nối cdp-bundle +
  cdp-dist-freeze: HANG_BUNDLE, FROZEN_START, bản sao copy tùy
  chọn, `finishFrozenDist` + exit 3; logic đo rAF/khám phá không
  đụng một chữ; hành vi khi không đặt `--dist-dir` giữ nguyên)
- `apps/web/scripts/seek-o3-browser-probe.mjs` (nối cdp-dist-freeze:
  manifest SNAP lúc khởi động + `out.frozenDist` + error khi
  INVALID; logic đo/khám phá không đụng một chữ)

MỚI (3 file script + 1 LIMITS + 3 JSON kết quả):

- `apps/web/scripts/cdp-dist-freeze.mjs` (module đóng băng dùng chung)
- `apps/web/scripts/cdp-snapshot-backup.mjs` (backup/verify/restore)
- `apps/web/scripts/clicktest-s6-round36-snapshot-backup-probe.mjs`
  (probe §2; chạy thật exit 0)
- `docs/PHASE9_ROUND36_S6_SNAPSHOT_BACKUP_LIMITS.md` (file này)
- `benchmarks/results/v36-s6-snapshot-backup-probe.json` (probe 31/31)
- `benchmarks/results/v36-s6-bench-preview-fps.json` (bench VALID)
- `benchmarks/results/v36-s6-bench-preview-fps-invalid.json` (bench
  INVALID, fps bị loại)

KHÔNG ĐỔI: mọi file code sản phẩm, i18n, bridge, mobile-touch-check,
check-proxy-auto, seek-p2, mọi file snapshot cũ trên đĩa, mọi file
paths-loop, build-loop-log. KHÔNG push, KHÔNG tag. Thư mục backup
thật nằm ở goal hidden_files (ngoài repo, không vào batch git —
đúng mục đích: bản sao bền, không phải file repo).

## 4. Ghi chú cho parent khi gộp batch

- Thứ tự file chung: `cdp-dist-freeze.mjs` là nền cho cả bench và
  seek-o3; `cdp-bundle.mjs`/`cdp-snapshot.mjs` đã có từ đợt 35,
  không sửa lại ở đợt này — đừng tách module mới khỏi 2 file sửa.
- Biến môi trường mới của bench: `BENCH_DIST_DIR`,
  `BENCH_FROZEN_COPY_DIR` (hoặc cờ `--dist-dir` /
  `--frozen-copy-dir`); mặc định không đặt gì → hành vi cũ.
- Probe S6 dùng cổng 19447/19448 và thư mục snapshot riêng — không
  đụng cổng/thư mục của luồng khác; đã dọn sạch sau khi chạy.
- Repo local `~/workspace/repo-1` không phải git checkout (lệnh
  git status báo "not a git repository") nên S6 không đối chiếu
  được danh sách file đổi qua git — danh sách §3 là từ chính các
  lần sửa của S6, parent kiểm tra lại khi gộp batch.

## 5. Nợ còn lại (không mạo nhận đã xong)

- **Đường timeout snapshot của CHÍNH bench chưa kích hoạt live:**
  probe S6 kích hoạt snapshot qua `send()` của probe (cùng module
  cdp-snapshot/cdp-bundle) + kiểm chứng tĩnh rằng bench truyền
  `HANG_BUNDLE` vào cùng hàm đó, nhưng bench chỉ ghi snapshot khi
  CDP timeout trong lúc đo thật — trường hợp đó chưa xảy ra ở
  bench trong đợt này. Muốn chứng minh tận cùng thì cần một lượt
  bench gặp timeout CDP thật (ví dụ treo evaluate có chủ đích
  trong lúc đo) — việc riêng, chưa làm.
- **Đóng băng cho mobile/check-proxy:** chưa nối (lý do ở §1b);
  module đã sẵn, chỉ cần dist của chúng được cố định.
- **Backup vẫn chưa ra khỏi máy thật:** xem §1a — chống dọn/xóa
  và cho bản sao thứ hai có manifest, chưa chống thay đĩa VM.
- **Dạng treo chưa chứng minh:** target kẹt/detached (target đóng
  giữa lệnh, session detach), deadlock đa tài nguyên thật (hai
  lock chờ nhau), Chrome đơ toàn bộ (khi đó proc/ps sẽ khác hẳn
  và snapshot có thể không ghi được vì chính tiến trình chẩn đoán
  cũng tắc). H2 của S6 chỉ chứng minh page kẹt busy-loop, là một
  dạng "page kẹt" nhưng không phải mọi dạng kẹt.
- **Chữ ký CPU của treo:** ps lifetime-average không phân biệt
  được (xem §1d); muốn chữ ký CPU thì lấy mẫu /proc tick-delta
  trong cửa sổ treo.
- **Không chạy lại:** `tsc --noEmit` / `vite build` ở đợt này
  (không có file nguồn sản phẩm nào bị đụng tới; các script .mjs
  nằm ngoài phạm vi build của app và đã qua `node --check` +
  chạy live). Parent kiểm chứng gộp vẫn nên chạy tsc/build như
  thường lệ trước khi stage.
- **fps bench VALID 2,88:** chỉ là điểm dữ liệu trên VM tải nặng,
  không phải baseline, không so sánh với số đợt trước (khác dist,
  khác tải, khác fixture đo).
