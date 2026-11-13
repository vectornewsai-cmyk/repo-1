# Phase 9 đợt 96 — X3: retry-play mở rộng (wall 20 s, stall lặng, blob-lỗi không proxy, pass marginal)

**Nợ gốc:** LIMITS gộp đợt 95 §4 mục 3 — retry-play mở rộng (nối tiếp W2 đợt 95).
**Ngày:** 2026-11-12 (lượt cron 15:35 +07; làm việc ~08:40–10:15Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không đụng TTS 39,
không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐÃ SỬA + ĐÃ ĐO — cả 2 fix đều có tác dụng thật đo được;
stall lặng nay có mitigation (1 ca cứu ngoài đời); "pass marginal" đã có
nguyên nhân (cửa sổ đo, không phải decoder).**

## 1. Kết luận ngắn

| | Trước X3 | Sau X3 |
|---|---|---|
| MATRIX A wall 20 s, loose/strict (n=24 blob) | 21/24, 21/24 (runs 1–3: 10/12; W2 wall 10 s: loose 10/12, strict 8/12) | — (cùng code W2 + fix 96X3; xem §2) |
| Error-event MATRIX A (n=24) | 7 case, **7/7 được cứu** (retry95W2 bắn 7/7) | 0 case fail vì error-event |
| Blob-lỗi KHÔNG proxy, single-shot (n=8) | loose **2/8** (5 error-event, 1 stall) | loose **6/8** — 3/3 error-event được retry96X3 cứu |
| Stall lặng (tất cả mode, n=80 blob) | 8 case, 0 cứu được | **1 ca cứu ngoài đời** bằng watchdog (TICK runs 4–6: 12/12) |
| "Pass marginal" (1–6 frame, ct < 1 s) | 5 case ở wall 10 s (W2) | **0 case ở wall 20 s** (128 case X3) |

- **(1) Wall 20 s cho error đến muộn — KHÔNG tái hiện trực tiếp được.**
  Trong 80 case blob của X3, KHÔNG có error nào đến muộn (0 case có
  errT − playCalled > 3 s; errT lớn nhất 1,19 s sau play — chỉ trong
  subset MATRIX-A; max đo được toàn bộ là 2,16 s). Case muộn duy
  nhất của W2 (error t=7,09 s) không lặp lại trong 36 run MATRIX A wall
  20 s. Nhưng: 7/7 error-event ở wall 20 s đều được cứu (ct 8–19,1 s),
  canplay tới sau error chỉ 0,4–1,0 s; cơ chế retry arm ở error và bắn ở
  canplay bất kể canplay tới lúc nào (không có timeout trong code) — nên
  với ngân sách thời gian của wall 20 s, một error ở 7,09 s + canplay
  ~2–3 s sau đó vẫn nằm trong cửa sổ. Đây là suy luận từ cơ chế + số đo,
  KHÔNG phải xác nhận trực tiếp — ghi thẳng để đợt sau khỏi trích sai.
- **(2) Stall lặng — ĐÃ CÓ ĐẶC ĐIỂM + MITIGATION, 1 CA CỨU NGOÀI ĐỜI.**
  Chữ ký: blob pipeline kẹt pre-metadata (rs=0, ct=0, không error),
  progress cuối lúc 0,5–1,2 s, 1 event `stalled` rồi im luôn; GST log có
  `bogus size` + `no playable streams` như case error-event — cùng gốc
  qtdemux, chỉ khác là error event bị nuốt. Watchdog mới (videoFor tick,
  8 s không tiến triển → fallback http + retry-play) đã cứu 1 ca thật
  (Lc6-blobA20T-run6, §5); TICK runs 4–6 đạt 12/12 (baseline 11/12).
  0 lần bắn oan trong 12 run sau-watchdog.
- **(3) Đường blob-lỗi không proxy — ĐÃ SỬA + ĐÃ ĐO, fail đúng kiểu W2.**
  Baseline single-shot: 2/8, 5 error-event 0 frame, finalSrc kẹt ở blob
  đã revoke (không ai phục hồi src, không retry). Sau fix: 6/8, 3/3
  error-event được cứu (retry96X3 bắn 1 lần, ct 8–18,3 s). 2 fail còn
  lại đều là stall-timeout (ngoài phạm vi retry). App tick tự hồi phục
  được đường này từ trước (NPT 8/8 trước fix) — fix chủ yếu giúp caller
  single-shot + resume xác định hơn, giống kết luận W2 §6.
- **(4) "Pass marginal" — ĐÃ CÓ NGUYÊN NHÂN: cửa sổ đo, không phải decoder.**
  Cả 5 case marginal của W2 đều có canplayT 8,12–12,59 s (tới cuối hoặc
  sau khi wall 10 s đóng). Ở wall 20 s: **0 case marginal trong 128
  case**; mọi case pass đều khỏe (ct 8–19,7 s). Presented-fps ở wall
  20 s là 16–22 fps (gần 24 fps nguồn) ở cả blob lẫn prog — con số
  2–12 fps ở wall 10 s là hệ quả của cửa sổ ngắn + tải, không phải lỗi
  riêng đường blob. Kết luận: đừng dùng totalFrames/finalCt ở wall 10 s
  làm thước đo "phát khỏe"; tiêu chí strict (finalCt ≥ 1 s) của W2 nay
  trùng loose ở wall 20 s.

## 2. Thay đổi code (`apps/web/src/media.ts`, marker "Đợt 96 X3")

### 2a. Retry-play đường blob-lỗi không proxy (nhánh mới trong error handler)
- Khi blob do prefetch tạo lỗi mà item **không có proxyUrl**: phục hồi
  `src`/`srcKey`/latch về URL gốc **ngay trong handler** (trước đây chờ
  tick `videoFor` sau; probe single-shot thì kẹt hẳn) + arm retry-play
  (guard `retryPlay96X3For` chốt theo URL gốc, reset khi `want` đổi;
  kiểm tra lại intent/srcKey/paused lúc bắn; chỉ 1 lần; marker dataset
  `retryPlay96X3Fired`/`At` riêng để phân biệt với guard 95W2).
- Nhánh proxy của W2 **không đụng** (giữ nguyên code + guard 95W2);
  comment cũ "Không áp cho đường blob-lỗi không proxy" đã sửa thành
  trỏ sang nhánh mới. Unit test X3 7/7 (kể cả test "đường proxy vẫn
  dùng guard 95W2, không chạm guard 96X3").

### 2b. Stall-watchdog (mới)
- **Trigger:** trong `videoFor` (mỗi tick app): latch đang blob + caller
  muốn phát (`playIntended95W2`) + chưa pause + `ct=0` + `readyState<2`
  + src là blob + **không tiến triển ≥ 8 s** (`STALL_WATCHDOG_NO_PROGRESS_MS`).
  Tiến triển = event `progress` (listener mới lúc tạo element),
  `readyState` tăng, hoặc `buffered` tăng (đọc đồng bộ mỗi tick).
  Event `stalled` KHÔNG tính là tiến triển (case stall vẫn có 1 stalled
  rồi im). Không áp cho stall giữa chừng (ct>0 — thuộc trần stall V2 /
  re-arm W5).
- **Ngưỡng 8 s — có cơ sở đo:** gap progress dài nhất ở case blob khỏe
  là **5,8 s** (Lc2-run6 W2: progress 4,78 → canplay 10,58); case stall
  không bao giờ có thêm progress (gap ≥15 s ở wall 20 s). 8 s tách hai
  nhóm với biên hai phía; case slow-start hiếm chạm ngưỡng vẫn phát
  được qua http (không phải fail).
- **Hành động khi bắn:** thu hồi blob hỏng + về URL gốc + arm retry-play
  (guard 95W2 cho item có proxy, 96X3 cho item không proxy — qua helper
  chung `armRetryPlay96X3`; nhánh error 96X3 cũng dùng helper này, còn
  nhánh W2 giữ nguyên inline). Ghi `dataset.stallWatchdog96X3Fired="1"`.
  Một lần mỗi episode (sau fallback `latch.blob=false` nên hết watch;
  guard retry chặn arm lại). `dropElement` xóa entry watch.
- **Thí nghiệm thiết kế (trước khi code):** `play-pending-src-switch.mjs`
  — play() đang pending trên src treo rồi đổi src (không play lại) thì
  promise gốc bị **reject**, element về **paused=true**, ct=0 (không tự
  phát tiếp); đối chứng pause + đổi src + play() lại thì phát tốt
  (ct 4,86 s). Kết luận: sau khi watchdog đổi src, element về paused
  nên retry-play kiểu W2 (kiểm tra paused lúc bắn) bắn được — không cần
  cơ chế retry riêng. Trong harness có app tick, tick play lại trước cả
  retry (xem §5) — retry chỉ là dự phòng, guard chống play thừa vẫn giữ.
- Unit test watchdog 9/9 (stall 8 s cả 2 đường proxy/không proxy;
  progress/buffered/rs/pause/ct reset đúng; một lần duy nhất; dropElement
  xóa entry). Đồng hồ giả qua stub `performance.now`.

## 3. Đo — phương pháp

- Probe mới `benchmarks/render/webkit_blob_flaky_96x3.mjs` (copy W2, đổi:
  port 8901; wall mặc định **20 s** (env `WALL_MS`); mode `MATRIXA20`
  (A prod + prog, wall 20 s), `MATRIXA20TICK` (A prod + prog + mô phỏng
  app tick: `videoFor` + `play()` khi paused, mỗi 500 ms),
  `NOPROXY` (item không proxyUrl, single-shot), `NOPROXYTICK` (không
  proxy + app tick); `summarizeLoad` thêm `stalls`/`canplayT`/`playingT`/
  `framesPerCtSec` + giữ nguyên `samples` trong JSON; đọc thêm dataset
  `retryPlay96X3Fired`/`stallWatchdog96X3Fired`).
- Runner `hidden_files/round96-x3/run-probe.mjs` (claim Xvfb qua lock
  W8, port riêng 8901) + `run-one.mjs` (chạy 1 script với Xvfb lock).
- Môi trường: boot a3a13d5a (reboot #17, 08:01Z) cho các lượt đo đầu;
  **reboot #18 ~09:24Z (boot 04b83831)** giết lượt MATRIXA20 runs 4–6
  giữa chừng (7/24 case đã lưu, xem §7); WebKit hỏng sau reboot
  (libevent-2.1.so.7 + nhiều lib hệ thống mất — sửa bằng cách cài
  `libevent-2.1-7` .deb + chạy `install-dependencies.sh` của webkit,
  xem §7). Các lượt sau reboot chạy trên boot 04b83831, RAM khả dụng
  1,0–2,9 GB, loadavg 1-phút 0,5–10,0.
- Mtime `media.ts` kiểm trước/sau mọi lượt đo (xem §7 cho từng lượt).
- **Lưu ý phương pháp:** probe MATRIXA20 single-shot KHÔNG gọi
  `videoFor` lặp nên watchdog không thể bắn ở đó — watchdog chỉ đo
  được bằng mode TICK (đúng như trong app, nơi `syncMedia` tick mỗi
  frame). Ngược lại, NOPROXY single-shot đo đúng đường fix 96X3.

## 4. Số liệu chi tiết

### MATRIX A wall 20 s (n=24 blob, 24 prog; code W2 + fix 96X3)

| Nhóm | loose | strict | failKind |
|---|---|---|---|
| runs 1–3 (trước fix 96X3) | 10/12 | 10/12 | ok 10, stall-timeout 2 |
| runs 4–6 (sau fix 96X3) | 11/12 | 11/12 | ok 11, stall-timeout 1 |
| **Tổng** | **21/24** | **21/24** | ok 21, stall-timeout 3, **error-event 0** |
| prog đối chứng (24) | 24/24 | 24/24 | — |

- Error-event: **7 case, 7/7 được cứu** (`retryPlay95W2Fired` 7/7;
  errT 0,51–1,19 s sau play, canplay sau error 0,4–1,0 s, finalCt
  8–19,1 s). Không case error-event nào fail ở wall 20 s.
- Stall-timeout: 3/24 (Lc2-run2, Lc4-run2, Lc8-run4) — đều 0 frame,
  ct=0, không error, canplay không tới trong 20 s (xem §5).
- So với W2 wall 10 s AFTER (loose 10/12, strict 8/12): strict tăng
  8→10/12 ở runs 1–3 là do marginal biến thành khỏe (wall dài hơn),
  không phải do fix mới (fix 96X3 không đụng đường proxy).
- 7 case runs 4–6 đo trước reboot #18 (đã xóa khỏi JSON để chạy bù
  sạch 1 boot, còn trong backup — cả 7 đều OK, 4/7 error-event được
  retry95 cứu) — không tính vào bảng trên.

### NOPROXY — blob-lỗi không proxy (n=8 mỗi phía)

| | Trước fix (runs 1–2) | Sau fix (runs 3–4) |
|---|---|---|
| Single-shot loose/strict | **2/8** | **6/8** |
| failKind | error-event 5, ok 2, stall-timeout 1 | ok 6, stall-timeout 2, **error-event 0** |
| Error-event được retry96X3 cứu | — (retry96=0) | **3/3** (retry96=1 cả 3; ct 8–18,3 s) |
| App-tick (NPT) loose | 8/8 | 7/8 (1 stall-timeout) |

- Baseline chứng minh đường này fail đúng kiểu W2: error-event,
  0 frame, `finalSrc=blob` (kẹt ở blob đã revoke). Error tới muộn hơn
  đường proxy (errT 1,18–5,21 s so với 0,5–1,0 s) nhưng vẫn trong cửa
  sổ 20 s; 2 case stall-timeout còn lại ngoài phạm vi retry.
- NPT trước fix đã 8/8 (app tick tự hồi phục: tick `videoFor` phục hồi
  src + tick `play()` phát lại) — fix 96X3 không làm NPT tệ đi (7/8,
  1 stall-timeout Lc8-run4, cùng chữ ký stall như mọi mode).

### MATRIXA20TICK — app tick (n=12 mỗi phía)

| | Baseline, chưa watchdog (runs 1–3) | Có watchdog (runs 4–6) |
|---|---|---|
| loose/strict | **11/12** | **12/12** |
| failKind | ok 11, stall-timeout 1 (Lc4-run2) | ok 12 |
| Watchdog bắn | 0 | **1 (Lc6-run6 — cứu thật, §5)** |
| prog | 12/12 | 12/12 |

- Error-event ở TICK: 4 case baseline đều phát được (chỉ 1 có
  `retry95W2Fired=1` — 3 case còn lại tick play lại trước retry, đúng
  như W2 §6 nói: trong app, retry là dự phòng, tick mới là đường cứu
  chính). Runs 4–6: 7 case error-event đều phát được, retry95=0
  (tick luôn nhanh hơn retry).
- **0 lần watchdog bắn oan** trong 12 run sau-watchdog.

### Pass marginal + presented-fps (toàn bộ 128 case X3)
- Marginal (0<frames≤6, ct<1): **0/128** (W2 wall 10 s: 5/24).
- Presented-fps ở wall 20 s: blob 16–22 fps, prog 18–22 fps (nguồn
  24 fps) — hai đường như nhau; con số 2–12 fps ở wall 10 s là do
  cửa sổ ngắn (frame chỉ đếm sau canplay) + tải, không phải lỗi blob.
- GST `bogus size`: có ở cả case pass (vd Lc2-run3/4/5/6 mỗi log 1
  dòng — từ pipeline http preload bị abort lúc swap) lẫn case fail.
  Kết luận W2 "fail ⇒ bogus" vẫn đúng chiều đó, nhưng "bogus ⇒ fail"
  là **sai** — đừng dùng số dòng bogus làm thước đo.

## 5. Case Lc6-blobA20T-run6 — watchdog cứu stall ngoài đời

- Diễn biến (t = giây từ đầu case): blob swap t=0,15; progress cuối
  t=0,5; `stalled` t=3,65; rồi im luôn (0 error event). Watchdog bắn
  t=8,55 (đúng 8,05 s sau progress cuối): srcTrace blob→http lúc 8,55;
  `abort/emptied/loadstart` 8,55–8,56; `progress`/`canplay`/`playing`
  8,82; ct tiến từ 8,96; kết thúc 269 frame, ct=11,21 s (clip 24 s,
  phát muộn ~9 s nên chỉ kịp 11,2 s trong wall 20 s).
- `playErr="The operation was aborted."` — promise play() gốc bị reject
  khi watchdog đổi src, đúng như thí nghiệm §2b. `retryPlay95W2Fired`
  KHÔNG set: lúc canplay (8,82) element vẫn chưa về paused (rejection
  là async) nên guard paused chặn retry; tick app sau đó gọi play()
  lại và phát tiếp. Trong app thật, tick `syncMedia` luôn làm việc
  này — retry chỉ là dự phòng. (Caller single-shot không có tick thì
  watchdog vốn đã không bắn được, nên không có khoảng trống thực tế;
  không thêm timer chỉ để lấp race này — xem §8.)
- GST log case này: `bogus size 3958285619` ×2 (qtdemux0 + qtdemux1)
  + `no playable streams` — cùng gốc qtdemux như case error-event,
  chỉ khác là không có error event lên tới page.
- Đây là ca stall duy nhất trong 12 run sau-watchdog, và nó được cứu.
  Không có ca nào watchdog bắn mà blob vốn sắp phát được (0 false
  positive).

## 6. Kiểm chứng hồi quy

- Unit test mới `media.retryPlay96X3.test.ts`: **7/7** (src về http
  NGAY + canplay → play đúng 1 lần; không play khi chưa có ý định;
  pause hủy retry; http cũng lỗi thì không lặp; app loop đã play thì
  không thừa; tick sau giữ http; đường proxy vẫn guard 95W2).
- Unit test mới `media.stallWatchdog96X3.test.ts`: **9/9** (stall 8 s
  cả 2 đường; progress/buffered/rs/pause/ct reset đúng; một lần duy
  nhất; dropElement xóa entry).
- Unit test cũ: `media.retryPlay95W2.test.ts` **7/7**;
  `media.blobPrefetch90R3.test.ts` **25/25** (chạy lại sau cả 2 lần
  sửa media.ts — lần 2 có refactor nhánh 96X3 sang helper chung, vẫn
  xanh).
- `npx tsc --noEmit` apps/web: **0 lỗi** (sau cả 2 lần sửa).
- `vite build`: **PASS** (10,12 s sau fix 96X3; 6,58 s sau watchdog).
- `seek.test.ts`: **21/21**.
- **O8: Chromium 21/21 (Δx=0,112/0,113), WebKit 21/21 (Δx=0,194/0,197)**
  — khớp số ổn định lịch sử. Lần chạy Chromium đầu fail rõ "thiếu
  fixture" trong scratch mới (đúng fail-fast W8 đã sửa); copy 3 fixture
  từ round87-o8 rồi chạy lại mới 21/21.
- Flip-flop tầng pool: **0** (không case nào quay lại blob sau fallback;
  srcTrace các case rescued chỉ có 1 lần blob→http).

## 7. Sự cố môi trường trong lượt (ghi đầy đủ để đợt sau khỏi đo lại)

- **Reboot #18 ~09:24Z (boot 04b83831, uptime 1' lúc phát hiện 09:25Z).**
  Giết lượt MATRIXA20 runs 4–6 giữa chừng (đã lưu 7/24 case; 17 case
  còn lại chưa chạy). 7 case đã lưu đã xóa khỏi JSON để chạy bù sạch
  1 boot — còn trong backup
  `hidden_files/round96-x3/webkit-blob-flaky-96x3-pre-reboot18-backup.json`
  (cả 7 đều OK). Lượt chạy bù sau đó hoàn tất 24/24.
- **WebKit hỏng sau reboot #18** (lần đầu gặp): MiniBrowser không lên —
  `libevent-2.1.so.7: cannot open shared object file`, rồi tiếp
  `libavif.so.16`, `libgstreamer-1.0.so.0`, … (hệ thống mất nhiều lib
  sau reboot; `dpkg -l` không còn ghi nhận `libevent-core-2.1-7` dù
  file .so vẫn nằm trên đĩa — các lib này dường như không do dpkg quản
  lý). Hai lượt probe đầu sau reboot fail toàn bộ 48 case
  (runError, đã xóa khỏi JSON). Sửa: (1) tải .deb `libevent-2.1-7` +
  `libevent-core-2.1-7` 2.1.12-stable-1build3 từ archive.ubuntu.com,
  `dpkg -i` (core báo dependency problems → `apt-get install -f` gỡ
  core, nhưng umbrella 2.1-7 đã vào ld cache); (2) chạy
  `install-dependencies.sh --autoinstall` của webkit-2388 → 0 gói mới
  (dpkg cho là đủ) nhưng sau đó MiniBrowser lên được
  (WebKitGTK 2.55.0) và mọi lượt probe sau đó 0 runError. Cơ chế chính
  xác khiến lib quay lại chưa rõ (có thể do ldconfig trigger của apt)
  — ghi lại để đợt sau gặp thì làm đúng 2 bước trên, không đoán.
  `apt-get update` (pid 788, chạy từ lúc boot) kẹt 12 phút không tiến
  triển (0 file mới trong `partial/`, không kết nối mạng) — đã định
  kill nhưng nó tự thoát trước khi kill tới; không đụng vào tiến trình
  của luồng khác.
- **Mtime media.ts:** 06:00:02 (31223 B) trước mọi lượt đo baseline;
  09:12:45 (33642 B) sau fix 96X3, không đổi qua các lượt NOPROXY/
  MATRIXA20TICK baseline; 09:56:43 (38940 B) sau patch watchdog,
  không đổi qua lượt TICK sau-watchdog + O8. Không luồng nào khác sửa
  media.ts trong lượt (chỉ X3 sửa file này ở đợt 96).
- **Lỗi probe của chính X3 (đã sửa, không ảnh hưởng số liệu):** lần
  chạy NOPROXY đầu fail nhanh vì `doLoad` map variant `noproxy` sang
  bundle không tồn tại (`media-pool-bundle-noproxy.js`) — đã sửa thành
  chỉ variant probe-only mới có bundle riêng; chạy lại 8/8. Lỗi `tail
  -2 file1 file2` trong lệnh gộp (cú pháp tail sai, không phải probe).
  Lần chạy O8 Chromium đầu fail do thiếu fixture (đã chép đủ rồi chạy
  lại — xem §6).
- Không process/lock mồ côi sau lượt (lock Xvfb đã nhả hết; vite :5173
  còn chạy là của W4 đợt 95, không đụng).

## 8. Nợ mở

1. **Error đến muộn (W2 Lc8-run4) chưa tái hiện trực tiếp:** 0/80 case
   X3 có error muộn > 3 s. Suy luận cơ chế (§1) ủng hộ việc retry cứu
   được, nhưng chưa có số đo trực tiếp. Nếu đợt sau muốn đóng hẳn: chạy
   MATRIX A thêm (mỗi 12 run có ~8% gặp 1 error muộn theo tần suất W2
   — không đảm bảo), hoặc ép error muộn bằng probe-only delay (vd
   server trả blob chậm) — chưa làm.
2. **Stall lặng còn 7/80 case chưa được cứu trong phép đo:** watchdog
   chỉ bắn được khi có app tick (`videoFor` lặp). Các stall ở mode
   single-shot (MATRIXA20: 3, NOPROXY: 3) vẫn 0 frame trong phép đo —
   nhưng trong app thật `syncMedia` tick mỗi frame nên watchdog sẽ bắn;
   mode single-shot của probe không mô phỏng được app ở điểm này (đã
   ghi rõ ở §3). Không có bằng chứng nào cho thấy watchdog bỏ sót stall
   trong môi trường có tick (TICK: 1/1 cứu).
3. **Race retry sau watchdog (§5):** lúc canplay, rejection của play()
   gốc có thể chưa kịp về paused nên guard paused chặn retry; trong app
   tick play lại ngay nên không thành vấn đề ngoài đời. Không thêm timer
   — nếu đợt sau thấy case app thật kẹt ở đây thì mới xem lại.
4. **Ngưỡng watchdog 8 s:** tách được 2 nhóm trên dữ liệu hiện có
   (khỏe max 5,8 s; stall ≥15 s), nhưng mẫu stall còn ít (n=8). Nếu
   tải máy đổi mạnh, gap progress của slow-start có thể dài hơn — theo
   dõi qua `stallWatchdog96X3Fired` ở các lượt sau; 0 false positive
   tới nay (1/1 bắn đúng).
5. **WebKit sau reboot:** lib hệ thống có thể mất lại sau reboot sau
   (chưa rõ cơ chế). Đợt sau nếu MiniBrowser không lên thì làm đúng
   §7 (cài libevent .deb + `install-dependencies.sh`), đừng đo với
   Chromium thay thế cho đường WebKit/GStreamer.
6. **Đứng yên:** TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi
   (RAM khả dụng 1,0–2,9 GB trong lượt; u2net là fallback chính thức);
   `.github/workflows/*.yml` 403; release gate không đổi.

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/src/media.ts` — fix retry blob-lỗi không proxy + stall-watchdog (marker "Đợt 96 X3").
- `apps/web/src/media.retryPlay96X3.test.ts` — unit test mới (7 test).
- `apps/web/src/media.stallWatchdog96X3.test.ts` — unit test mới (9 test).
- `benchmarks/render/webkit_blob_flaky_96x3.mjs` — probe MATRIXA20/TICK/NOPROXY (wall 20 s).
- `benchmarks/results/webkit-blob-flaky-96x3.json` — kết quả 128 case (0 runError).
- `docs/PHASE9_ROUND96_X3_RETRY_PLAY_EXT_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round96-x3-retry-play-ext`
(`~/workspace/repo-1-push/paths-loop/phase9-round96-x3-retry-play-ext.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x3.md`
(+ thư mục `round96-x3/`: probe logs, GST logs, bundle, analysis, O8 logs,
backup JSON pre-reboot18).
