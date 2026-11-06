# Phase 9 đợt 37, luồng T4 — Snapshot timeout của chính bench kích hoạt live + đóng băng mobile/check-proxy + chữ ký CPU /proc tick-delta — LIMITS

Ngày: 2026-11-02 (lượt cron 14:03 Asia/Saigon). KHÔNG push, KHÔNG
chạy push-files, KHÔNG ghi qua GitHub connector, KHÔNG tag/release,
KHÔNG binary vào repo, KHÔNG dist vào batch, KHÔNG sửa file của
luồng khác, KHÔNG sửa file paths-loop hay build-loop-log (parent
gộp batch).

Nguồn: `docs/PHASE9_ROUND36_LIMITS.md` §3 mục 6 (nợ snapshot của
S6) + `docs/PHASE9_ROUND36_S6_SNAPSHOT_BACKUP_LIMITS.md` §5.
Dist trên đĩa lúc chạy các lượt live: bundle `index-DAS3nyo_.js`
sha256[:16] `e02b786973edd1c3`, manifest đóng băng
`1124df9835c3a3db9b0be87a08236621b60712e7683fc415c9d696265beccd83`,
254 file — cùng một manifest ở cả 3 lượt live (bench, mobile,
check-proxy), nên các lượt này đo cùng một dist.

## 0. Kết luận ngắn (không vượt số đo)

1. **Đường timeout snapshot của CHÍNH bench ĐÃ KÍCH HOẠT LIVE (a):**
   cờ mới `--cdp-hang-probe` (hoặc `BENCH_CDP_HANG_PROBE=1`).
   Lượt live qua vite preview cổng 5195 serve đúng dist:
   exit 0, `hangProbe.ok=true`, wall 5066ms (đặt timeout 5000ms),
   đúng 1 snapshot mới, snapshot ghi bundle captured
   (`index-DAS3nyo_.js`, sha `e02b786973edd1c3`), pid snapshot =
   pid Chrome của bench (3351), frozenDist VALID (trước = sau).
   Snapshot này KHÔNG xóa sau lượt chạy — nó là bằng chứng bền
   theo kỷ luật đợt 30/32.
2. **Đóng băng dist cho mobile + check-proxy ĐÃ NỐI XONG (b):**
   - Mobile: manifest lúc khởi động + đối chiếu lúc kết thúc;
     lượt live trên vite preview 4173 cho frozenDist VALID
     (trước = sau = `1124df98…`, 254 file). NHƯNG lượt live đó
     có TRUSTED SCRUB FAIL + TRUSTED PINCH FAIL (xem §2c) nên
     chỉ claim "đóng băng mobile chạy live và VALID", KHÔNG
     claim "mobile-touch-check pass".
   - Check-proxy: chế độ mới `--preview-dist` (spawn vite
     preview serve `apps/web/dist` thay vì vite dev, bắt buộc
     `CHECK_PROXY_DIST_DIR` resolve đúng `apps/web/dist` nếu
     không từ chối exit 2); lượt live end-to-end cho
     `PROXY 720p OK` + frozenDist VALID, exit 0. Nhánh từ chối
     dist lệch cũng kích hoạt live: exit 2.
3. **Chữ ký CPU /proc tick-delta ĐÃ PHÂN BIỆT ĐƯỢC H1/H2 (c):**
   module mới `cdp-cpu-sample.mjs` + probe 27/27. Tầng Node
   thuần: busy-loop 95,9% vs idle 0,0% (chênh 95,9 điểm).
   Tầng CDP thật: H1 (promise không settle) 2,7% vs H2
   (while(true)) 99,9% (chênh 97,2 điểm), vượt ngưỡng ghi trước
   (H2 > 50 và chênh > 30). Cùng lần đó, ps lifetime-average
   trong snapshot lại đảo ngược (H1 max 11% vs H2 max 6,5%) —
   tái xác nhận kết luận của S6 rằng ps lifetime-average mù
   trước 2 dạng treo này.
4. **KHÔNG claim:** backup ra khỏi máy, target kẹt/detached,
   deadlock đa tài nguyên thật, Chrome đơ toàn bộ — tất cả vẫn
   là nợ (xem §4). Nhánh INVALID của mobile/check-proxy cũng
   chưa kích hoạt live bằng cách sửa dist thật giữa lượt (cố
   tình không làm vì dist dùng chung với luồng khác — xem §2d).

## 1. Phần mới của T4, theo từng mảnh

### (a) Bench hang-probe — `bench-preview-fps.mjs`

- Cờ `--cdp-hang-probe` / env `BENCH_CDP_HANG_PROBE=1`, chỉ tác
  dụng khi bật; hành vi bench thường không đổi một chữ.
- Khi bật, sau khi editor sẵn sàng (splash mất + nút Phát có),
  bench gửi qua **chính `Cdp.send()` của bench** một evaluate
  `new Promise(()=>{})` với `awaitPromise: true`, timeout
  5000ms. Timeout handler có sẵn của bench (từ đợt 32 O2, nối
  bundle ở đợt 36 S6) ghi snapshot bền rồi reject; probe kiểm
  tra: lỗi đúng `CDP timeout: Runtime.evaluate`, đúng 1 file
  snapshot mới trong thư mục bền của bench, snapshot có
  method/timeoutMs/pid đúng, bundle captured khi đặt
  `--dist-dir` (hoặc not-captured khi không đặt — giữ nguyên
  ngữ nghĩa cũ), rồi ghi `result.hangProbe` + `frozenDist`
  và DỪNG (không đo fps — lượt này không phải lượt đo fps,
  đừng trích fps từ file kết quả của nó; file đó không có
  trường fps).
- Nếu probe không đạt (không timeout / sai số snapshot /
  sai bundle) thì exit 1; nếu frozenDist INVALID thì exit 3
  lấn như bench thường.

### (b) Đóng băng dist cho mobile + check-proxy

**Mobile (`mobile-touch-check.mjs`):**
- Điều kiện nối nay đã đủ (S6 nói "dist không cố định" vì
  mặc định là vite dev): `HANG_DIST_DIR` chỉ khác null khi
  operator đặt `MOBILE_TOUCH_DIST_DIR`, hoặc khi
  `PREVIEW_URL` mặc định 4173 và dist mặc định có index.html
  — tức đúng trường hợp vite preview serve dist đó. Khi đó
  tính `distManifest` lúc khởi động, đối chiếu lúc kết thúc
  (sau khối try/finally, trước `process.exit`, nên mọi đường
  đi kể cả đường lỗi đều được đối chiếu); lệch → in
  `FROZEN INVALID`, `failures++`, exit 1 (quy ước riêng của
  script này; cùng ngữ nghĩa "vi phạm → kết quả bị loại" như
  bench exit 3 / seek-o3 exit 2). Không xác định được dist →
  in `frozenDist UNVERIFIED`, không claim cùng dist, không
  cộng failure vì lý do đóng băng.
- Caveat như bench: manifest chỉ là "dist đang đo" khi
  `PREVIEW_URL` thật sự serve đúng `HANG_DIST_DIR` đó; nếu
  operator đặt `MOBILE_TOUCH_DIST_DIR` trỏ dist khác với thứ
  preview đang serve thì manifest chỉ là "dist trên đĩa lúc
  bắt đầu đo" — chuỗi `servesDistAssumption` trong JSON in ra
  ghi rõ điều này.

**Check-proxy (`check-proxy-auto.mjs`):**
- Lý do S6 chưa nối được vẫn đúng cho chế độ mặc định:
  script tự spawn vite dev trên 5173, không serve dist nào,
  nên `CHECK_PROXY_DIST_DIR` khi đó chỉ cho bundle "trên
  đĩa". Nối manifest vào verdict ở chế độ dev sẽ là claim sai
  — vì vậy chế độ mặc định KHÔNG đổi: vẫn vite dev, in
  `frozenDist UNVERIFIED` khi có đặt dist-dir, verdict giữ
  nguyên.
- Điều kiện nối (nay đã cài): `--preview-dist` (hoặc
  `CHECK_PROXY_PREVIEW_DIST=1`) → spawn `vite preview` thay
  vì vite dev, VÀ `CHECK_PROXY_DIST_DIR` phải resolve đúng
  `apps/web/dist` (vite preview chỉ serve outDir của config;
  dist khác → từ chối chạy exit 2 trước khi spawn bất cứ gì,
  đã kích hoạt live — xem §2d). Khi đó manifest trước/sau
  được đối chiếu lúc kết thúc (cả đường verdict lẫn đường
  lỗi): lệch → verdict bị loại, exit 3 như bench.

### (c) Chữ ký CPU /proc tick-delta — `cdp-cpu-sample.mjs`

- Chỉ đọc `/proc`, không kill, không sửa gì. `readProcStat`
  parse `/proc/<pid>/stat` bằng cách cắt ở dấu `)` cuối cùng
  (comm có thể chứa khoảng trắng/ngoặc), lấy ppid (field 4),
  utime (field 14), stime (field 15). `readTreeTicks` dựng
  cây tiến trình dưới rootPid qua ppid (browser + mọi
  descendant). `sampleCpuTree(rootPid, windowMs)` đọc cây ở
  đầu/cuối cửa sổ, delta tick / CLK_TCK / thời gian cửa sổ
  → `% của một core` (busy-loop một thread cho ~100%).
  CLK_TCK lấy bằng `getconf CLK_TCK`, fallback 100.
  Tiến trình chết giữa chừng → bỏ qua, không throw; pid
  không đọc được → `{ ok: false, reason }`, không bịa số.
- Khác biệt cốt lõi với ps: đây là tốc độ CPU **trong đúng
  cửa sổ treo**, không phải trung bình từ lúc tiến trình
  sinh ra. Probe lấy mẫu trong cửa sổ treo thật: bắt đầu
  +500ms sau khi gửi lệnh treo (để vòng lặp/promise treo bắt
  đầu thật), mẫu 3000ms, kết thúc ~3500ms, trước timeout
  5000ms — nên mẫu đo đúng lúc treo đang diễn ra, không đo
  sau khi timeout đã giải phóng.

## 2. Kiểm chứng live (không phải claim suông)

- `node --check` pass cho cả 5 file sửa/mới: cdp-cpu-sample,
  bench-preview-fps, mobile-touch-check, check-proxy-auto,
  probe T4.
- **Probe T4: 27/27 check, allPass=true, exit 0**
  (`benchmarks/results/v37-t4-cpu-snapshot-probe.json`):
  unit CPU 8/8 (CLK_TCK 100, đọc /proc của chính mình, cây
  chứa chính mình, pid chết → null; busy 95,9% vs idle 0,0%;
  tamper fixture → INVALID), wiring tĩnh 5/5, Chrome thật:
  H1 timeout + đúng 1 snapshot + snapshot đúng field, CPU
  H1 2,7% (delta 8 tick, topPid chỉ 1,0% — cây Chrome lúc
  idle gần như đứng yên), renderer vẫn rảnh sau H1
  (evaluate `1+1` → 2), H2 timeout + đúng 1 snapshot, CPU
  H2 99,9% (delta 300 tick, topPid 3198 đúng 99,9% — chính
  renderer đang spin), ps lifetime H1 max 11% vs H2 max
  6,5% (đảo ngược, chỉ ghi số), browser vẫn sống sau H2
  (`Target.getTargets` resolve), renderer kẹt sau H2
  (evaluate `1+1` timeout 3000ms + đúng 1 snapshot phụ),
  thư mục snapshot probe trở lại baseline 0 file.
- **Bench hang-probe live (vite preview 5195 serve dist thật,
  `--dist-dir apps/web/dist`):** exit 0,
  `benchmarks/results/v37-t4-bench-hang-probe.json`:
  hangProbe ok=true, wall 5066ms, lỗi đúng
  `CDP timeout: Runtime.evaluate`, đúng 1 snapshot mới
  (`cdp-hang-20261102_071228646-Runtime.evaluate-3351.json`,
  còn tồn tại trên đĩa, đã đọc lại nội dung: method
  Runtime.evaluate, timeoutMs 5000, proc pid 3351 = chromePid,
  killed false, bundle captured `index-DAS3nyo_.js` sha
  `e02b786973edd1c3` + dist path), frozenDist VALID
  (trước = sau = `1124df98…`, 254 file). Trước lượt này thư
  mục snapshot của bench có 1 file, sau lượt có 2 file —
  delta đúng 1.
- **Mobile live (vite preview 4173 serve dist thật, dist mặc
  định):** bundle `index-DAS3nyo_.js` sha `e02b786973edd1c3`,
  manifest khởi động `1124df98…` (254 file), kết thúc
  frozenDist VALID (trước = sau). NHƯNG: TRUSTED SCRUB FAIL
  (ph0 = ph1 = `00:00:00:00`) và TRUSTED PINCH FAIL (zoom 60
  → 60), exit 1 do 2 failure này, KHÔNG do đóng băng.
  T4 không kết luận nguyên nhân fail của touch (không thuộc
  phạm vi luồng; code đóng băng chỉ chạy lúc khởi động và
  lúc kết thúc, không đụng đường touch) — nhưng ghi rõ:
  lượt mobile này CHỨNG MINH ĐƯỢC đóng băng, KHÔNG CHỨNG
  MINH ĐƯỢC touch pass trên dist này. Cần một lượt
  mobile-touch-check riêng (hoặc luồng mobile khác) xác định
  vì sao scrub/pinch không đổi trên dist này trước khi dùng
  kết quả mobile làm bằng chứng touch.
- **Check-proxy live (chế độ `--preview-dist`, video test
  1080p 5s tự tạo bằng ffmpeg tại /tmp, không vào repo):**
  checkbox proxy mặc định true, nạp video, kết quả
  `PROXY 720p OK`, frozenDist VALID (trước = sau =
  `1124df98…`, 254 file), exit 0. Đây là lần kích hoạt live
  đầu tiên của đường preview-dist + đóng băng check-proxy.
- **Check-proxy từ chối dist lệch (live):** `--preview-dist`
  với `CHECK_PROXY_DIST_DIR=/tmp` → thông báo yêu cầu dist
  đúng `apps/web/dist`, exit 2, không spawn bridge/vite/
  Chrome nào.
- **Dọn dẹp:** sau các lượt live, không còn preview
  5195/4173, bridge 8787, vite 5173, hay Chrome probe nào
  (đã kiểm tra cổng trống); thư mục snapshot probe T4 trở
  lại 0 file; snapshot của bench giữ lại theo thiết kế.
  Lưu ý sự cố trong lúc dọn: một lệnh `pkill -f` với pattern
  trùng chuỗi lệnh của chính shell đã tự kill shell đó —
  đã chuyển sang kill theo pid file, không dùng `pkill -f`
  nữa; sự cố này không ảnh hưởng kết quả đo (lượt mobile đã
  in xong exit trước khi shell bị kill).

## 3. File T4 đổi/thêm (parent gộp batch — T4 KHÔNG tự tạo paths-loop)

SỬA (3 file):

- `apps/web/scripts/bench-preview-fps.mjs` (cờ
  `--cdp-hang-probe` + `result.hangProbe` + dừng sau probe;
  logic đo fps / đóng băng cũ không đụng một chữ)
- `apps/web/scripts/mobile-touch-check.mjs` (nối
  cdp-dist-freeze: manifest lúc khởi động + đối chiếu lúc
  kết thúc + INVALID cộng failure; logic touch không đụng)
- `apps/web/scripts/check-proxy-auto.mjs` (chế độ
  `--preview-dist`: vite preview thay vite dev + bắt buộc
  dist đúng `apps/web/dist` + đối chiếu manifest + INVALID
  → exit 3; chế độ dev mặc định không đổi)

MỚI (2 file script + 1 LIMITS + 2 JSON kết quả):

- `apps/web/scripts/cdp-cpu-sample.mjs` (module /proc
  tick-delta dùng chung)
- `apps/web/scripts/clicktest-t4-round37-cpu-snapshot-probe.mjs`
  (probe 27/27)
- `docs/PHASE9_ROUND37_T4_SNAPSHOT_LIMITS.md` (file này)
- `benchmarks/results/v37-t4-cpu-snapshot-probe.json` (probe 27/27)
- `benchmarks/results/v37-t4-bench-hang-probe.json` (bench
  hang-probe live, ok=true, frozenDist VALID)

KHÔNG ĐỔI: mọi file code sản phẩm, i18n, bridge, seek-o3,
seek-p2, mọi file snapshot cũ trên đĩa, mọi file paths-loop,
build-loop-log. KHÔNG push, KHÔNG tag. Video test 1080p chỉ
nằm ở /tmp (không vào repo, không vào batch).

## 4. Nợ còn lại (không mạo nhận đã xong)

- **Nhánh INVALID của mobile/check-proxy chưa kích hoạt live
  bằng dist thật:** hàm `verifyDistManifest` đã chứng minh
  INVALID live ở bench đợt 36 và unit tamper trong probe T4
  (u8), wiring tĩnh của 2 harness đã kiểm chứng (w3/w4), và
  2 nhánh VALID + từ chối dist lệch của check-proxy đã chạy
  live — nhưng chưa có lượt mobile/check-proxy nào sửa dist
  thật giữa lượt để thấy exit 1/3 của chính chúng. Cố tình
  không làm điều đó ở đợt này vì dist dùng chung với các
  luồng khác (sửa dist thật giữa lượt sẽ làm nhiễu đo của
  luồng khác). Muốn kích hoạt thì cần dist riêng cho harness
  đó (ví dụ preview serve bản sao scratch của dist, hoặc
  phiên đo riêng không chạy chung luồng khác).
- **Bench hang-probe mới chứng minh H1 (promise không settle),
  chưa chứng minh H2 (while(true)) qua chính bench:** H2 đã
  chứng minh qua send() của probe T4 (cùng module snapshot,
  cùng kỷ luật) và qua S6, nhưng đường `Cdp.send()` của bench
  với renderer spin chưa chạy live. Muốn đủ thì thêm cờ
  hang-probe-H2 cho bench (đánh đổi: sau H2, renderer kẹt
  nên bench phải dừng ngay, không đo tiếp được).
- **Mobile touch FAIL trên dist này:** xem §2c — cần xác định
  nguyên nhân riêng, không thuộc phạm vi T4.
- **Backup vẫn chưa ra khỏi máy thật:** bản sao bền ở goal
  hidden_files (đợt 36 S6) chống dọn/xóa trên cùng đĩa VM,
  chưa chống thay toàn bộ đĩa VM; T4 không thêm đích ngoài
  máy nào (không có dịch vụ nào được cấp cho luồng này).
- **Dạng treo chưa chứng minh:** target kẹt/detached (target
  đóng giữa lệnh, session detach), deadlock đa tài nguyên
  thật (hai lock chờ nhau), Chrome đơ toàn bộ (khi đó chính
  tiến trình chẩn đoán cũng có thể tắc và snapshot không ghi
  được). H2 của S6/T4 chỉ chứng minh page kẹt busy-loop.
- **Chữ ký CPU mới chỉ chứng minh trên Linux + Chrome
  headless trên VM này:** /proc không có trên macOS/Windows;
  máy nhiều core / renderer đa tiến trình có thể cho tổng
  cây >100% (đơn vị là % một core, đã ghi rõ); ngưỡng
  H2 > 50 và chênh > 30 mới hiệu chuẩn trên 1 lần CDP +
  1 lần Node — cần lặp lại trước khi dùng làm cổng tự động
  khóa/mở kết quả.
- **Không chạy lại:** `tsc --noEmit` / `vite build` ở đợt này
  (không có file nguồn sản phẩm nào bị đụng tới; các script
  .mjs nằm ngoài phạm vi build của app và đã qua
  `node --check` + chạy live). Parent kiểm chứng gộp vẫn nên
  chạy tsc/build như thường lệ trước khi stage.
