# Phase 9 đợt 42, luồng X1 — Bằng chứng browser headed cho TÁC NHÂN DỌN của lần thử lại trong settle-drop — LIMITS

Ngày: 03–04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG tự stage batch push (parent lo), KHÔNG sửa logic luồng khác.
Luồng này đóng nợ đợt 41 §5.2 (`docs/PHASE9_ROUND41_LIMITS.md` §5.2,
LIMITS W1 §0.2/§3/§5.3): tác nhân dọn của lần thử lại trong settle-drop
chưa có bằng chứng browser — W1 chỉ chứng minh được THỜI ĐIỂM hoãn
(settle trong lúc decode bay thì chưa dọn), còn lần dọn cuối trong phép
đo W1 KHÔNG vào counter vì cửa sổ W2 bình thường tự evict trước khi
decodePromise resolve.

## 0. Kết luận ngắn (không vượt số đo)

1. **Lần thử lại hoãn-dọn ĐÃ CÓ bằng chứng browser headed, và counter
   TĂNG thật: +90 frame.** Trên Chromium headed thật (Xvfb, không cờ
   `--headless`), fixture có 1 GOP hỏng (xem §1): tại mẫu settle
   (+121 ms sau seek) prefetch đã settle nhưng `decodeWindowInFlight`
   vẫn true, `settledPrefetchDroppedFrames` giữ nguyên 0, cache giữ
   nguyên 227 (không sụt) — đúng nhánh hoãn. Khi W2 hỏng kết thúc
   (+190 ms, `winInFlight` về false), counter tăng 0 → 90, cache sụt
   227 → 137 (đúng 90), `uiStatus = off`, `prefetchFrames = 0`,
   badge "⏩ Decode-ahead: TẮT".
2. **Mức tăng này CHỈ có thể tới từ lần thử lại.** Counter
   `settledPrefetchDroppedFrames` chỉ tăng trong
   `dropSettledPrefetchIfOff` (đường evict của chính nó); evict của
   W2 không chạm counter. Trong phép đo này W2 hỏng trả 0 frame và
   return trước khối evict nên không evict gì cả — lần dọn duy nhất
   sau settle là lần thử lại chain vào `decodePromise` của W2. Hơn
   nữa cache sụt đúng bằng delta counter (90 = 90), không lệch.
3. **Phạm vi claim (đọc kỹ trước khi trích):** đây là trường hợp SUY
   BIẾN có chủ đích (GOP hỏng → decode 0 frame), KHÔNG phải đường
   phát ngược bình thường. Nó chứng minh lần thử lại CÓ THỂ dọn và
   counter tăng — tức lưới an toàn này là thật, không phải code chết.
   Nó KHÔNG chứng minh lần thử lại thường dọn trong phát ngược bình
   thường: ở đó evict của W2 đã dọn thay (kết luận W1 vẫn đứng).
   Muốn claim "lần thử lại dọn trong phát ngược bình thường" vẫn là
   SAI với thứ tự code (§3 W1).

## 1. Thay đổi code (không sửa production — chỉ test + script + 1 dòng tsconfig)

- KHÔNG sửa `apps/web/src/lib/reverseWebcodecs.ts`, `preview.tsx`,
  i18n, cổng/gate, toggle registry. Mirror `decodeWindowInFlight` /
  `cacheFrames` của W1 đã đủ; không cần marker mới.
- Mới `apps/web/src/lib/settleDeferred42X1.test.ts` (7/7): khóa phần
  số học thuần giải thích hai đường cho hai kết quả counter khác
  nhau — W2 không evict → lần thử lại dọn hết frame prefetch ngoài
  cửa sổ cũ (15/15 ở ví dụ); W2 đã evict → dọn 0; W2 chứa prefetch →
  dọn 0; điều kiện lần thử lại (tắt + chưa dispose + hết decode bay)
  → dọn; hai ngoại lệ không dọn (dispose trước lần thử lại, bật lại
  trước lần thử lại); prefetch giao cửa sổ cũ chỉ dọn phần ngoài
  (10 trước + 5 sau = 15). Test thuần KHÔNG mạo nhận bằng chứng
  browser (bằng chứng ở §2).
- Sửa `apps/web/tsconfig.json`: chỉ thêm 1 dòng exclude test mới
  (`settleDeferred42X1.test.ts`). File này các luồng đợt 42 khác cũng
  đang sửa (lúc luồng này chạy đã thấy dòng `gopSharedProbe42X4`,
  `pauseSeekCap42X2`) — parent gộp cần giữ đủ dòng của mọi luồng.
- Mới `apps/web/scripts/clicktest-round42-x1-settle-cleanup-pipe.mjs`
  (click-test app thật 7/7, xem §2). Script TỰ lo Xvfb + Chrome headed
  (công thức headed đã chứng minh của luồng X2: `--disable-gpu` +
  `--no-first-run` + `--force-device-scale-factor=1` — xem §4.1 về lần
  chạy đầu treo vì thiếu `--disable-gpu`); preview phải chạy sẵn
  (script giả định `X1_DEV_URL`, mặc định cổng 5183).
- Mới `docs/PHASE9_ROUND42_X1_SETTLE_CLEANUP_LIMITS.md` (file này).

### 1.1 Fixture suy biến (tạo bằng ffmpeg, không vào repo)

- Gốc: `testsrc2` 640×360, 30 fps, 90 s, x264 `-g 90 -bf 2`,
  8.413.444 byte, `has_b_frames = 2` (giống W1).
- Bản hỏng: copy gốc, zero toàn bộ packet IDR của GOP chứa 60 s
  (ffprobe: keyframe `pts_time = 60.000000`, `pos = 5590859`,
  `size = 9304` byte) — moov nguyên vẹn nên file vẫn parse được,
  ffmpeg decode vùng 60–63 s báo `Invalid NAL unit size (0 > 9300)`
  và `Error submitting packet to decoder` (đã kiểm chứng trước khi
  chạy browser). Vùng setup gần cuối (88,5 s) toàn GOP lành.
- Mục tiêu seek 62,7 s: present slice 75 frame = 2,5 s là
  [60,2 .. 62,7], nằm trọn trong GOP [60,63); decodeFrom = IDR hỏng
  60,0 s → cửa sổ W2 decode 0 frame → `unsupported = true` →
  return false TRƯỚC khối evict. Đây chính là "W2 kết thúc mà KHÔNG
  evict" mà W1 §5.3 nêu ví dụ ("decode trả 0 frame").

## 2. Bằng chứng browser headed (phương pháp + số đo)

### 2.1 Thiết kế bắt (khác W1)

- Setup như W1 nhưng bằng fixture HỎNG: seek 88,5 s, phát ngược tới
  `running + prefetch > 0` (cổng chỉ mở khi decode phần mềm ≥ 2× fps
  phát; số đo cổng ở các trang setup thành công: 68,0 / 85,5 / 144,9 /
  226,7 / 276,1 fps — dao động theo tải máy lúc đó, xem §5).
- Mỗi shot: cuộn mục tiêu hỏng 62,7 s vào viewport TRƯỚC khi poll;
  poll bắt prefetch đang bay (`inFlightPrefetchWindows >= 1`); canh
  cache tăng tới ~60% `prefetchFrames` HOẶC cache đứng yên 250 ms
  (đoạn còn lại toàn frame trùng / decoder đang flush) rồi tắt toggle
  + seek NGAY bằng clickFast (đo được toggle→seek 191 ms ở shot bắt
  được). KHÔNG pause (lý do như W1: giữ mirror tươi).
- Phân loại shot bằng trace (mỗi vòng 1 eval, ~5 ms + trễ CDP):
  SUCCESS chỉ khi mẫu settle có `winInFlight = true` + settled chưa
  tăng + cache không sụt, VÀ mẫu cuối (W2 kết thúc) có settled tăng
  ≥ 1 + `ui = off` + `prefetch = 0`. Các shot vô hiệu được ghi rõ
  (§2.3), không giấu.

### 2.2 Số đo shot bắt được (trang 7, shot 1, 7/7 pass)

- Setup trang 7: `uiStatus = running`, **prefetch = 152 frame**,
  fps cổng **68,0**, độ phân giải **640×360**,
  badge "ĐANG CHẠY — prefetch 152 frame". Aim =
  `cache-stall-250ms`, toggle→seek **191 ms**.
- Trace sau seek (10 mẫu, thời gian tính từ click seek):
  - **+1 / +7 / +21 / +39 / +91 / +107 ms:** `inFlight = 1`,
    `winInFlight = true`, `settled = 0`, cache 227 — W2 hỏng đang bay,
    prefetch vẫn chưa settle.
  - **+121 ms (mẫu settle — bằng chứng hoãn):** `inFlight 1 → 0`
    (prefetch đã settle), `winInFlight = true`,
    **`settled 0 → 0` (chưa tăng)**, **`cache 227 → 227` (không sụt)**.
  - **+137 / +151 ms:** vẫn `winInFlight = true`, `settled = 0`,
    cache 227 — frame prefetch vẫn nằm trong cache trong lúc W2 chưa
    kết thúc, không bị evict giữa chừng.
  - **+190 ms (mẫu cuối — bằng chứng tác nhân dọn):**
    `winInFlight = false` (W2 hỏng kết thúc), **`settled 0 → 90`**,
    **`cache 227 → 137` (sụt đúng 90)**, `uiStatus = off`,
    `prefetchFrames = 0`, badge "⏩ Decode-ahead: TẮT".
- Đọc đúng: khoảng hoãn quan sát được là **~69 ms** (từ settle +121
  tới W2 kết thúc +190); 90 frame prefetch ngoài cửa sổ cũ bị dọn
  bởi đúng lần thử lại — cache sụt khớp chính xác delta counter
  (90 = 90, không lệch). Trace thô 10 mẫu lưu ở scratch ngoài repo
  (`~/workspace/tmp-round42-x1/x1-success-trace.json`) — không vào
  batch.

### 2.3 Toàn bộ lượt chạy (không chỉ shot thành công)

- 7 trang đã thử (trang 1 và 3 setup thất bại do nút ＋ Thêm bị
  `BUTTON.ghost-btn` che — lỗi phủ UI thoáng qua, trang 2/4/5/6/7
  setup lại thành công; xem §5.4 — không liên quan tới settle-drop).
- Các shot hỏng đều cùng một dạng, và dạng này tự nó xác nhận đường
  suy biến: trace chỉ 6–8 mẫu, `w2Seen = true`, W2 kết thúc TRƯỚC khi
  prefetch kịp settle (không thấy settle trong trace) → shot vô hiệu;
  sau đó bật lại toggle + phát ngược KHÔNG đạt lại running — đúng
  như dự kiến vì controller đã về `unsupported` sau decode 0 frame,
  nên script tải lại trang để có controller mới. Cụ thể: trang 2 shot
  1 (7 mẫu), trang 4 shot 1 (6 mẫu), trang 5 shot 1 (8 mẫu), trang 6
  shot 1 (6 mẫu) — tất cả đều W2 hỏng chạy nhưng settle tới muộn hơn
  W2 kết thúc (khi đó lần dọn — nếu có — rơi vào nhánh dọn-ngay, không
  phải lần thử lại, nên không tính).
- Tổng cộng: 5 shot W2 hỏng đã chạy, 1 shot bắt được SUCCESS (trang 7
  shot 1). Tỉ lệ bắt ~1/5 phù hợp với cửa sổ race hẹp (W2 hỏng chỉ
  kéo dài ~70–190 ms từ seek tới kết thúc, trong khi thời điểm settle
  còn lại sau khi canh là ngẫu nhiên hàng trăm ms).

## 3. Vì sao số này chứng minh tác nhân dọn (đã đọc code, không đoán)

- `settledPrefetchDroppedFrames` chỉ tăng tại một chỗ duy nhất:
  `dropSettledPrefetchIfOff` sau `cache.evictExcept(...)`. Evict của
  W2 (`ensureWindowForTime` / `ensureWindowViaGop`) không chạm
  counter này.
- Tại mẫu settle +121 ms, `dropSettledPrefetchIfOff` đã chạy (prefetch
  settle → `p.then(drop...)`) nhưng đi nhánh hoãn (vì
  `decodePromise != null`) nên counter giữ 0 — đúng như W1.
- Lần thử lại được chain bằng `p.then(...)` lên chính `decodePromise`
  của W2 nên chạy SAU khi W2 kết thúc (+190 ms). W2 hỏng return
  trước khối evict nên cache lúc đó vẫn 227; lần thử lại evict với
  keep = `lastDecodeRange` cũ (W2 hỏng không cập nhật) → dọn đúng 90
  frame prefetch ngoài cửa sổ cũ → counter 90, cache 137.
- Đối chứng âm: 4 shot W2 hỏng nhưng settle tới sau W2 kết thúc đều
  KHÔNG cho SUCCESS (trace kết thúc trước khi settle, không có delta
  counter nào được ghi) — script không nhận vơ nhánh dọn-ngay thành
  bằng chứng lần thử lại.

## 4. Kiểm chứng (số thật, chạy lại độc lập trong luồng)

- **Mới** `settleDeferred42X1.test.ts`: **7/7 pass** (esbuild bundle
  ra scratch ngoài repo, như mẫu W1).
- **Hồi quy** (cùng runner esbuild): T4 settle/toggle **11/11**, V4
  ruler **6/6**, U1 toggle **12/12** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (sau khi thêm
  dòng exclude test mới).
- `vite build`: **pass (4,85 s)** trên snapshot riêng
  `apps/web-snapshot-x1` (copy cùng độ sâu thư mục để import tương
  đối tới `packages/` vẫn đúng; symlink `node_modules` gốc) — cảnh
  báo chunk > 500 kB cũ, không phải lỗi mới. Dist này (không vào
  batch) là bản click-test chạy bằng `vite preview` cổng 5183.
- Click-test mới: **7/7 pass** (T0, S-setup × 5 trang thành công, X1)
  — shot SUCCESS là trang 7 shot 1, không cần dùng hết 8 trang.
- Snapshot + server preview đã xoá sau khi đo xong (không để lại
  trong cây repo); scratch đo nằm ngoài repo
  (`~/workspace/tmp-round42-x1/`: fixture, log vite, bundle test,
  trace SUCCESS, log chrome) — KHÔNG vào batch.

### 4.1 Sự cố đã gặp và cách sửa (ghi để luồng sau khỏi lặp lại)

- **Lần chạy đầu chết oan:** Chrome headed KHÔNG `--disable-gpu`
  bị treo khởi động trên Xvfb (tiến trình sống nhưng `/json/list`
  không trả gì sau 30 s) → script báo "không tìm thấy target
  type=page" rồi treo tiếp vì WebSocket CDP còn mở giữ event loop
  (log FATAL đã in nhưng tiến trình không thoát). Đã sửa script:
  thêm `--disable-gpu --no-first-run --force-device-scale-factor=1`
  (công thức headed của luồng X2), chờ `/json/list` trả JSON có
  target page thật tới 90 s, và thoát dứt khoát (`killAll()` +
  `process.exit(code)` ở cả đường thành công lẫn catch). Lần chạy
  thứ hai với bản sửa này đi tới SUCCESS.
- **Nút ＋ Thêm bị `BUTTON.ghost-btn` che (2/7 trang):** lỗi phủ UI
  thoáng qua, không ổn định — trang sau setup lại thành công. Chưa
  sửa triệt để (không phải phạm vi settle-drop); luồng sau cần độ
  tin cậy setup cao hơn thì thêm chờ "clickable" cho nút Thêm thay
  vì click ngay (xem §5.4).

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Chỉ chứng minh trên một đường đo:** fixture testsrc2 640×360
   GOP 90, 90 s, 8.413.444 byte, `has_b_frames = 2`, decode phần mềm;
   **Chromium headed thật (Xvfb :94, không `--headless`)**; máy
   **under-load** (các luồng đợt 42 khác chạy song song — loadavg
   lúc bắt đầu 0,51 / 1,07 / 0,74, lúc kết thúc 0,93 / 1,50 / 1,21;
   fps cổng dao động 68,0–276,1 giữa các trang setup). Số fps này
   chỉ là số đo cửa sổ mở cổng, KHÔNG phải fps hiển thị ngược, và
   KHÔNG phải baseline quiet — cấm trích làm benchmark.
2. **Đường (a) file GOP thưa > 32 MiB qua GOP Range: CHƯA ĐO.**
   Cần clip qua URL http hỗ trợ Range (đường proxy của bridge,
   `res.sendFile` có hỗ trợ Range) với file proxy > 32 MiB + bridge
   đang chạy + cùng race này — vượt khối lượng luồng X1 và trùng
   phần việc headed GOP của luồng X4 đợt 42 (không làm trùng). Mặc
   định wiring V2 vẫn TẮT (không đổi default nào trong luồng này);
   đường GOP Range chỉ được bật tường minh qua
   `gopRangeEnabled: true` ở preview như cũ.
3. **Đường (b) `asset:` cho settle-drop: CHƯA ĐO.** Clip có src
   `asset:<id>` chỉ xuất hiện qua mở project `.vcut.json` có src
   dạng đó + rehydrate từ IndexedDB (đường import thường KHÔNG đổi
   src clip sang `asset:` — xem importAsset37T3: cố tình giữ src tên
   thô + alias). Đo đường này cần thêm script: đọc manifest id từ
   IndexedDB, viết project `.vcut.json` với clip `asset:<id>`, mở
   qua ProjectMenu, chờ rehydrate, rồi mới chạy cùng race — chưa làm
   trong luồng này.
4. **Tab ẩn: CHƯA ĐO** (theo đúng lệnh: chỉ làm nếu không phá bằng
   chứng chính — luồng này ưu tiên giữ nguyên bằng chứng chính nên
   không thử tab ẩn).
5. **Chưa đo:** Safari / máy thật / GPU thật / máy quiet (số quiet có
   thể làm cửa sổ decode ngắn lại, race hẹp hơn — shot bắt được ở
   đây một phần nhờ under-load; ở fps cổng 276 thì W2 hỏng chỉ kéo
   dài ~70 ms, race hẹp hơn nhiều so với fps 68).
6. **Setup flakiness (§4.1):** 2/7 trang setup thất bại do
   `BUTTON.ghost-btn` che nút Thêm — lần chạy sau nên thêm chờ
   clickable trước khi click nút Thêm.
7. **Server đo đã dừng sau khi đo xong** (vite preview 5183 đã kill;
   snapshot đã xoá; cổng trống). Script giả định preview đang chạy
   (xem header) — chạy lại cần build + preview lại theo header.
8. **Không claim gì thêm:** không đổi ngưỡng cổng, không đổi luật
   T2/T4, không sửa handler ruler hay preview; không sửa production
   code nào trong luồng này.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settleDeferred42X1.test.ts` (7/7).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới;
  xem lưu ý gộp ở §1).
- Mới: `apps/web/scripts/clicktest-round42-x1-settle-cleanup-pipe.mjs`
  (click-test app thật 7/7).
- Mới: `docs/PHASE9_ROUND42_X1_SETTLE_CLEANUP_LIMITS.md` (file này).
- Không sửa: `reverseWebcodecs.ts`, `preview.tsx`, `Timeline.tsx`,
  cổng/gate, toggle registry, i18n (không thêm key),
  `apps/web/dist/` (không vào batch theo tiền lệ), paths-loop,
  build-loop-log. Scratch đo nằm ngoài repo
  (`~/workspace/tmp-round42-x1/`) — KHÔNG vào batch.
