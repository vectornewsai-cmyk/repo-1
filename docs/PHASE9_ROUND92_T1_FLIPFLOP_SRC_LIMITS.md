# Phase 9 đợt 92 — T1: KHÓA flip-flop src blob↔http trong `videoFor` (ĐÃ ĐÓNG nợ ưu tiên đợt 91 §4 mục 1)

- **Nhiệm vụ:** đóng nợ ưu tiên LIMITS gộp đợt 91 §4 mục 1 (phát hiện S3 §7,
  đã xác nhận S9): trong app thật, `videoFor` đổi src của cùng element
  blob↔http ~10 Hz trong lúc phát (29 lần đổi src trên element id 7,
  run20); phát lại sau pause dùng http dù blob đã cache.
- **Kết luận ngắn:**
  1. **Cơ chế thật (đã chẩn đoán + tái hiện bằng số):** `assigned` trong
     `videoFor` cũ được tính lại mỗi tick từ trạng thái *momentary* của
     element — đang phát → `assigned = want` (http); vừa gán src xong thì
     trình duyệt reset element về paused + ct=0 → `isPristineForBlobSwap`
     đúng → `assigned = blob`. Guard `srcKey` không chặn được vì chính
     `assigned` dao động. Mỗi lần đổi src reset pipeline (currentTime về
     0, play() phải gọi lại) — đo baseline: play() 13–15 lần/lượt, hầu
     hết ở ct=0.
  2. **Sửa — latch src theo item+`want` (`media.ts`, field `srcLatch`):**
     quyết định blob/http chỉ tính MỘT lần cho mỗi `want` rồi giữ nguyên.
     Latch chỉ đổi khi có lý do thật: `want` đổi (proxy mới), error
     handler fallback, blob đã chốt bị thu hồi (revoke/FIFO),
     dropElement, hoặc upgrade http→blob lúc element sạch (scrub về 0 /
     loop restart) — và chỉ upgrade một lần vì latch sau đó giữ blob.
  3. **Đo lại bằng đúng probe appswap của S3 (WebKitGTK 27.2, app thật):
     flip-flop = 0.** Trước sửa: 23 lần gán src/lượt (22 lần đổi kind
     blob↔http). Sau sửa: **2 lần gán src/lượt** (empty→http→blob — lần
     đổi kind duy nhất là upgrade prefetch có chủ đích), **play() 4–5
     lần/lượt, tất cả trên blob, ct tăng đơn điệu**. Phát lại sau pause
     dùng **blob 3/3** (trước: http 3/3) — nợ thứ hai của S3 cũng đóng
     theo.
  4. **Error handler P5 vẫn hoạt động** (không sửa ngữ nghĩa fallback,
     chỉ đồng bộ thêm latch/srcKey): unit test lỗi blob/proxy 2/2 giữ
     file gốc qua nhiều tick, không lật lại.

## 1. Chẩn đoán cơ chế (đọc code + đo)

`videoFor` cũ (`apps/web/src/media.ts`, trước sửa):

```ts
let assigned = want; // http
if (cached blob && (isNewElement || isPristineForBlobSwap(el))) assigned = cached.url;
if (el.dataset.srcKey !== assigned) { el.dataset.srcKey = assigned; el.src = assigned; }
```

- Element đang phát (paused=false) → `assigned = http` → gán http →
  trình duyệt reset element (paused=true, ct=0, đang load) → tick sau
  `isPristineForBlobSwap` đúng → `assigned = blob` → gán blob → reset →
  play() lại → đang phát → gán http… Chu kỳ ~2 tick (~30–50 ms).
- Bằng chứng baseline (probe appswap, xem §3): cùng element id 7,
  chuỗi `http>blob>http>blob…` 23 lần gán trong ~5 s phát; play() gọi
  13–15 lần, 7 lần đầu ở ct=0 (mỗi lần đổi src xóa tiến độ phát).
- Lỗi tiềm ẩn thứ hai trong error handler (phát hiện lúc sửa): handler
  fallback proxy→gốc chỉ gán `el.src`, KHÔNG cập nhật `srcKey` — tick
  `videoFor` sau đó thấy `srcKey` (proxy/blob cũ) ≠ `assigned` thì gán
  lại src, lật ngược fallback. Chưa đo được thành bug trong app thật
  (fallback http thường phát tốt ngay), nhưng là đường ping-pong thật
  trong code — đã khóa bằng cách đồng bộ latch/srcKey trong handler.

## 2. Sửa production (`apps/web/src/media.ts` — chỉ file này + test)

- **Field `srcLatch: Map<itemId, { want, src, blob }>`** — `want` là
  `proxyUrl ?? url` mà latch đang chốt; `src` là src thực tế đang gán;
  `blob=true` nghĩa src là blob URL do prefetch tạo.
- **`videoFor` tính lại quyết định chỉ khi `want` đổi** (element mới,
  proxy mới, lần đầu gặp item): blob nếu cache khớp `want`, không thì
  URL gốc + `startBlobPrefetch`; `proxyFallback` chỉ reset ở đây (proxy
  mới → xóa fallback cũ), không reset mỗi lần gán src như trước.
- **Latch còn hiệu lực thì chỉ 2 đường đổi:**
  (a) blob đã chốt bị thu hồi (revoke tay / FIFO vượt cap tổng) → về
  URL gốc + fetch lại (giữ hành vi test cũ "revoke → fetch lại");
  (b) upgrade http→blob khi element sạch (`isPristineForBlobSwap`) và
  chưa fallback proxy (`proxyFallback !== "1"`, `latch.src === want`) —
  upgrade một lần, latch giữ blob nên tick phát sau không lật lại http.
- **Phát lại sau pause ở ct≠0 giữ nguyên src đã chốt.** Đổi src sẽ
  reset currentTime về 0 — đúng cái đang khóa. Blob chỉ được dùng ở lần
  phát sau khi element sạch trở lại (scrub về 0 / loop restart /
  dropElement). Hệ quả đo được: lần phát đầu chốt blob → phát lại sau
  pause dùng blob; lần phát đầu chốt http (blob chưa kịp về lúc bấm
  phát) → phát lại vẫn http cho tới khi scrub về 0. Đây là đánh đổi có
  chủ đích, ghi rõ ở đây thay vì mạo nhận "luôn dùng blob".
- **Prefetch callback** (fetch xong): upgrade chỉ qua latch (đủ điều
  kiện: latch đúng `want`, đang ở URL gốc, chưa fallback, element
  sạch) — không gán src trực tiếp như trước.
- **Error handler:** fallback proxy→gốc nay đồng bộ cả `srcKey` và
  latch (`src = cur.url, blob = false`). Ngữ nghĩa fallback không đổi:
  blob lỗi → thu hồi + skipped + về file gốc; proxy lỗi → về file gốc
  1 lần.
- **`dropElement`:** xóa latch của item — element mới quyết định lại từ
  đầu (blob đã cache thì dùng blob ngay, không fetch lại — giữ hành vi
  test cũ).

## 3. Đo lại bằng probe thật (WebKitGTK 27.2, app thật)

- **Probe:** `benchmarks/render/webkit_clipd_appswap_92t1.mjs` (bản sao
  của probe S3, chỉ đổi tên file kết quả + nhãn đợt) — vite preview
  dist đã build + bridge 8787, import clip 1080p c2h.mp4 (6.411.397 B,
  8 s) → proxy 720p auto → "Thêm vào timeline" → Phát ngay → pause →
  phát lại; vá `HTMLMediaElement.prototype.src` qua addInitScript, log
  theo id element + mẫu canvas preview.
- **Kết quả:** `benchmarks/results/webkit-clipd-appswap-92t1.json`
  (6 case: run30–32 trước sửa, run40–42 sau sửa). Đếm lại từ JSON
  (element chính id 7, vw 1280):

| run | srcOps (gán src) | đổi kind blob↔http | chuỗi src | play() | phát lại sau pause |
|-----|------------------|--------------------|-----------|--------|--------------------|
| 30 (trước) | 23 | 22 | http>blob>http>… (22 lần) | 15×, 7 lần @ct0 | http@ct3.53 |
| 31 (trước) | 23 | 22 | như trên | 14×, 6 lần @ct0 | http@ct3.2 |
| 32 (trước) | 23 | 22 | như trên | 13×, 6 lần @ct0 | http@ct4.8 |
| 40 (sau) | **2** | **1** | http>blob | 4×, toàn blob | **blob@ct2.83** |
| 41 (sau) | **2** | **1** | http>blob | 4×, toàn blob | **blob@ct5.2** |
| 42 (sau) | **2** | **1** | http>blob | 5×, toàn blob | **blob@ct5.5** |

- Lần phát đầu dùng blob **3/3 cả trước và sau** (prefetch thắng vì cửa
  sổ tạo proxy + thêm clip ~1,5–4,9 s > blobReady). Lần đổi kind duy
  nhất sau sửa là upgrade http→blob có chủ đích lúc element còn sạch
  (trước khi bấm Phát).
- Sau sửa ct tăng đơn điệu trên blob (run41: 0 → 0.43 → 4.7 → 5.2;
  run42: 0 → 0.7 → 1.8 → 4.27 → 5.5) thay vì kẹt ở ct=0 như trước.
  **0 error event** cả 6 run; canvas preview đổi hash giữa các mẫu
  (khung hình chạy thật) cả 6 run.
- **Lưu ý tải:** các run sau sửa chậm hơn về wall-clock (proxyReadyMs
  16–33 s vs 10–11 s trước sửa; run40 ct chỉ tới 2.84 sau ~7 s phát)
  vì lượt này VM tải nặng (nhiều luồng đợt 92 song song, loadavg ~3–10,
  RAM khả dụng ~1,3 GB). Đây là nhiễu tải, không phải hồi quy src —
  số lần gán src (mục tiêu của đợt) không phụ thuộc tải: 2/2/2 đều.
  Chưa đo lại trên boot yên; cửa sổ xấu nhất (bấm phát < 400 ms sau
  khi clip hiện) vẫn chưa đo trong app (nợ cũ từ S3 §7 mục 3).

## 4. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build`: **pass**.
- Unit test `apps/web/src/media.blobPrefetch90R3.test.ts` (bundle
  esbuild + node): **25/25 pass** (19 cũ + 6 mới cho T1, xem §5).
- Click-test O8 (Chromium + WebKit, harness
  `apps/web/scripts/clicktest-87o8-mask-track-*.mjs`): _xem §4b_.
- Hồi quy liên quan: không đổi ngữ nghĩa prefetch (ngưỡng 8 MiB, cap
  64 MiB, FIFO, skipped) — 19 test cũ xanh nguyên vẹn; error handler
  P5 giữ nguyên verdict (fallback về file gốc, không retry fetch).

### 4b. Click-test O8

- **Chromium (headed, `clicktest-87o8-mask-track-headed.mjs`, scratch
  `hidden_files/round92-t1-o8/headed/`): 21/21 pass, 0 fail, exit 0**
  (21:00–21:01Z).
- **WebKit (`clicktest-87o8-mask-track-webkit.mjs`, scratch
  `hidden_files/round92-t1-o8/webkit/`): 21/21 pass, 0 fail, exit 0**
  (21:01–21:03Z). S7 WebKit: mask di chuyển Δx=0.194, bóng Δx=0.197
  (kỳ vọng ~0.19); E0: không lỗi JS/pageerror/crash.

## 5. Unit test mới (6 test T1, trong `media.blobPrefetch90R3.test.ts`)

Dùng FakeVideo + đếm số lần gán `el.src` (ghi đè accessor của instance)
để phân biệt code cũ/mới — code cũ fail các test này (tính tay: test 1
cũ gán 3 lần, test 2 cũ gán 2 lần thay vì 1):

1. Blob đã chốt — tick phát + trạng thái pristine momentary (mô phỏng
   trình duyệt reset sau khi gán src) KHÔNG lật src (0 lần gán).
2. Http đã chốt — blob về giữa lúc phát thì KHÔNG swap; về 0 thì
   upgrade ĐÚNG 1 lần rồi giữ (tổng 1 lần gán).
3. Phát lại sau pause ở ct≠0 giữ nguyên blob đã chốt.
4. Lỗi trên blob → fallback về file gốc và latch giữ, không lật lại
   blob/proxy qua nhiều tick (kể cả khi element sạch); fetchCalls = 1.
5. Lỗi trên proxy http → fallback về file gốc, tick sau giữ nguyên.
6. proxyUrl đổi (proxy tạo lại) → quyết định lại 1 lần cho want mới:
   thu hồi blob cũ, fetch lại URL mới, src = http mới rồi blob mới
   (đúng 2 lần gán).

## 6. Giới hạn thật / nợ còn lại

1. **Lần phát đầu chốt http thì phát lại sau pause vẫn http** (xem §2)
   — chỉ đổi khi element sạch trở lại. Chưa đo trong app trường hợp
   user bấm phát < 400 ms sau khi clip hiện (blob chưa về kịp) rồi
   pause/phát lại: kỳ vọng theo code là http, chưa có số thật.
2. **Blob-load flaky của WebKit chưa sửa** (S3 §7 mục 2): fail ~25%
   lượt play đầu dưới tải, 2 dạng (error-event + stall lặng). Khóa
   flip-flop loại bỏ 1 nguồn teardown race (đổi src liên tục trong lúc
   phát) nhưng chưa chứng minh làm giảm tỉ lệ fail blob — cần đo đối
   chứng loop/load-play blob sau sửa (nợ cho vòng sau, không tự nhận).
3. **Chưa đo:** cửa sổ xấu nhất trong app; delay play 250/500 ms;
   loop blob trên boot yên (R3 8/8 vs S3 0/8 dưới tải).
4. **Ngưỡng 8 MiB giữ nguyên.** Không có bằng chứng cliff theo kích
   thước.
5. O8 WebKit/Chromium: xem §4b.

## 7. Files (stage, KHÔNG push)

- `apps/web/src/media.ts` — latch src (`srcLatch`, `videoFor`,
  prefetch callback, error handler, `dropElement`).
- `apps/web/src/media.blobPrefetch90R3.test.ts` — 6 test T1 mới
  (25/25).
- `benchmarks/render/webkit_clipd_appswap_92t1.mjs` — bản sao probe
  appswap của S3, đổi tên output + nhãn đợt.
- `benchmarks/results/webkit-clipd-appswap-92t1.json` — 6 case
  (run30–32 trước sửa, run40–42 sau sửa).
- `docs/PHASE9_ROUND92_T1_FLIPFLOP_SRC_LIMITS.md` — file này.
- Không stage: clip `.mp4` (binary, sinh lại được), `apps/web/dist/`
  (gitignored), log GST (không dùng lượt này), scratch O8
  (`hidden_files/round92-t1-o8/`, ngoài repo).
- **Server scratch do luồng này dựng (để parent quyết):** bridge 8787
  (PID 13992/13994, `node src/index.js`) + vite preview 4173 — vẫn
  đang chạy lúc viết LIMITS (cần cho probe sau sửa); Xvfb :199 vẫn
  chạy (script `~/workspace/round91-s3/xvfb.sh`).
