# PHASE9_ROUND98_Z4_WATCHDOG_FREEZE_LIMITS — freeze-kill chứng minh in vivo lần đầu bằng deepstub

> Luồng Z4, lượt cron 21:35 +07 12/11/2026. Nợ mở LIMITS gộp đợt 97 §4 mục 4
> (watchdog freeze chưa chứng minh in vivo).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Z4 KHÔNG sửa file production nào** (`preview.tsx` md5 đầu lượt `a0a078e1`,
> cuối lượt `41b05c8e` — toàn bộ thay đổi là của các luồng khác trong đợt 98;
> Z4 chỉ thêm probe + tài liệu này). Mọi số đo dưới đây là trên cây có code
> watchdog Y5 nguyên vẹn (không luồng nào đụng vùng watchdog đợt 98).

## 0. Verdict ngắn

- **Freeze-kill (`"no-callback-frozen"`) ĐÃ BẮN in vivo — 2 lần, cả 2 lần bằng
  phương pháp deepstub mới, 0 kill oan.** Nợ mở đợt 97 §4 mục 4 **ĐÓNG**.
  - r3: kill ở pausedAt+1333 ms; trueCt đứng yên tuyệt đối 0,267 suốt 2600 ms
    (trueCtRange=0), trueRate=0, caps=0, ring lấp đúng frame đóng băng
    (lastFrame=7).
  - r5: kill ở pausedAt+606 ms; đồng hồ đóng băng đã tích lũy từ stall tự
    nhiên bắt đầu ~2200 ms TRƯỚC pause (ph giữ 3,433 suốt 5914 ms,
    ctRange=0,004) — ca này gần như là freeze-kill trên stall tự nhiên, chỉ
    được injection giữ hộ (xem §3.3).
- **Phương pháp giữ pause đáng tin cậy đã tìm ra: "deepstub"** — shadow
  `currentTime` (setter no-op, getter trả frozenCt) + `playbackRate`
  (setter no-op, getter 0) ở tầng instance của element, kèm pause() +
  re-pause + stub `play()`. Không phụ thuộc timer nên miễn nhiễm throttle
  dưới tải. 2/2 lần trigger bắn đều giữ được ct đứng yên tuyệt đối
  (trueCtRange=0) và cho freeze-kill bắn.
- **Re-pause đơn thuần (timer 5 ms) THẤT BẠI** (r2): timer bị throttle thành
  ~107 ms dưới tải 10–12, 1 lần lật "xui" rò ~100 ms phát (~3 frame) là đủ
  cho advance-path bắn ở +299 ms. Cơ chế lật đã xác định thêm: **21 lần
  lật/tick mà không qua `play()` nào (playBlocks=0) và không seek nào
  (seeking=0 cả 26 mẫu state100)** — pipeline WebKitGTK tự lật `paused`
  (chuyển trạng thái async), không phải app resume.
- **Săn đóng băng cứng tự nhiên:** 10 clip có pump / 5 lượt, **1 ca stall
  tự nhiên tiền-pause** (r5 c1, xem trên) — tỉ lệ ~1/10 clip lần này, gộp
  với Y5 (1/32) thành ~2/42 clip có pump (~5%). Các stall còn lại đều là
  creeping (ct nhích đúng 1 frame, advance-path xử lý trước).
- **Không kill oan nào** trong 5 lượt (pageErrs=0 tất cả; các kill khác đều
  là `"no-callback"` advance-path đúng lúc hoặc `"clip-change"`/memo).
- **Tiết kiệm ước tính:** r3 kill ở +1333 ms thay vì chờ hết cửa sổ freeze
  2500 ms + advance-path sau resume (~+2700 ms) → **tiết kiệm ~1,4 s** so
  với counterfactual không có freeze-path (xem §3.4 — counterfactual, nêu
  rõ biên).
- **Harness:** probe mới `probe98z4-frame-parity.mjs` (+ `--freeze-mode`,
  freezeTrace 10 ms, evaluate timeout 30 s + nhịp tim — bài học lượt mất
  wk-freeze-r9; cap draws/mainDraws 400→2000 theo Y9). Analyzer mới tách
  hard-freeze khỏi creeping và chỉ tính "cơ hội cho freeze-kill" khi pump
  còn sống. 2 lần trigger không bắn (r1: luật steady cũ; r4: watcher thưa)
  đã chẩn đoán được nguyên nhân và sửa/ghi lại (xem §4).

## 1. Bối cảnh + giả thuyết làm việc

Y5 (đợt 97) implement freeze-kill trong `rvfcWatchdogMiss` (`preview.tsx`,
marker "Đợt 97 Y5"): kill `"no-callback-frozen"` khi pump im lặng ≥1000 ms
**và** frame không tiến + currentTime không tiến quá nửa khung trong ≥1000 ms.
17 lượt headed, 0 lần bắn; fault-injection pause() 1 lần + stub play() thất
bại 8/8 (resume ~74–400 ms, playBlocks=0).

Giả thuyết Z4 lúc bắt đầu: task `play()` đã queue TRƯỚC lúc pause (lúc clip
entry) bị main-thread trì hoãn dưới tải rồi lật lại pause; khắc chế bằng
re-pause mỗi 5 ms (ct chỉ nhích ~5 ms < nửa khung 16,7 ms). Kết quả r2 bác
một nửa giả thuyết này (xem §2.2): re-pause giữ được pause **sau** cú nhảy
đầu, nhưng timer bị throttle nên 1 lần lật rò ~3 frame; và 21 lần lật KHÔNG
qua `play()` nào — cơ chế lật là pipeline tự lật, không phải task play()
đã queue (ít nhất không phải là cơ chế duy nhất).

## 2. Các cách giữ pause đã thử — bảng tổng kết

| # | Cách giữ | Lượt | Kết quả |
|---|---|---|---|
| 1 | repause: pause + setInterval 5 ms pause lại | r1 | **Trigger không bắn** (luật steady cũ đòi ct tiến ≥0,1 s/500 ms; element kẹt creeping ct 0,300→0,301 suốt 700 ms nên không bao giờ thỏa) |
| 1b | repause (trigger đã sửa: chờ 500 ms kể từ lần đầu thấy element, bỏ yêu cầu ct tiến) | r2 | Trigger bắn; **THẤT BẠI giữ**: ct nhảy 0,34→0,448 (3 frame) trong ~200 ms đầu → advance-path bắn ở +299 ms; sau đó giữ được (ct đứng yên 2300 ms, 21 lần lật đều pause lại được) |
| 2 | deepstub: pause + re-pause + shadow currentTime/playbackRate tầng instance | r3 | **THÀNH CÔNG — freeze-kill bắn ở +1333 ms** (trueCtRange=0 suốt 2600 ms) |
| 2b | deepstub | r4 | **Trigger không bắn** (eligibleSeen=0; watcher chỉ chạy 90 lần/~34 s — interval bị throttle tới ~400 ms, không mẫu nào rơi vào cửa sổ eligible) |
| 2c | deepstub | r5 | **THÀNH CÔNG — freeze-kill bắn ở +606 ms** (stall tự nhiên đã 2200 ms trước pause; trueCtRange=0) |

Các mode đã lên kế hoạch nhưng KHÔNG cần thử nữa sau khi deepstub thành
công 2/2: `rate0` đơn thuần (bị syncMedia ghi đè rate mỗi tick — đọc code
`preview.tsx:4529` `if (a.el.playbackRate !== rate) a.el.playbackRate = rate`;
chỉ có nghĩa khi kèm shadow), `seekloop` (seek lại cùng ct mỗi 150 ms —
không cần vì deepstub đã chặn được mọi đường; seek-loop còn rủi ro callback
làm reset đồng hồ đóng băng). Ghi lại để đợt sau không thử lại mù.

## 3. Hai lần freeze-kill bắn — bằng chứng chi tiết

Harness: `apps/web/scripts/probe98z4-frame-parity.mjs`, WebKit, scroll-blur
(3 clip × 3 s, motionBlur frames 3), `--state-ms 50`, freeze c1 2500 ms.
Cả 2 lượt: `mtimeChanged=false`, `pageErrs=0`, `silentEngine=true`.

### 3.1 r3 — wk-freeze-deepstub-r3 (load lúc phát 11,49)

- Trigger: pause ở ct 0,233 (ph 3,167), `deepStubOk=true`,
  `deepStubTrueCt=0,233` lúc cài; resume ở +2724 ms.
- Trace 15 mẫu/2604 ms: **ct=0,233 hằng, trueCt=0,267 hằng
  (trueCtRange=0), trueRate=0 hằng, p=1, s=0**. (trueCt 0,267 ≠ frozenCt
  0,233: element rò đúng 1 frame (0,034 s) trong ~100 ms giữa lúc gọi
  pause() và lúc shadow được cài — cùng kiểu rò như r2, nhưng sau khi
  shadow cài xong thì đứng yên tuyệt đối.)
- `repauseCount=14`, `playBlocks=0` — element vẫn lật sang playing 14 lần
  nhưng rate=0 giữ ct đứng yên; `caps=0` suốt cửa sổ (pump 0 callback).
- Kill: `fb` c1 "" ở 20981 → **`"no-callback-frozen"` ở 21113**
  (pausedAt+1333 ms), ring 0→1, `lastFrame=7` (= frame đóng băng
  0,233×30 ≈ 7 — ring lấp đúng frame đóng băng qua tick path ngay tick
  kill). Blind c1 = 2404 ms (entry 18709 → ring 21113).
- Sau resume: phát tiếp bình thường; c2 blind 0 ms (memo, không pump).

### 3.2 r5 — wk-freeze-deepstub-r5 (load lúc phát 8,41)

- **Stall tự nhiên trước pause:** ph giữ 3,433 từ relPlay 14602 tới 20516
  (5914 ms), ctRange=0,004, `livePumpOpportunity=true` — element đã đóng
  băng gần như hoàn toàn ~2200 ms TRƯỚC khi probe pause ở 16802 (ct 0,437).
  Đây là ca đóng băng cứng tự nhiên đầu tiên bắt được kể từ r5 của X5.
- Trigger: pause ở ct 0,437, `deepStubOk=true`,
  `deepStubTrueCt=0,437` — **không rò frame nào** (trueCt == frozenCt).
- Trace 7 mẫu/2398 ms: ct=trueCt=0,437 hằng (trueCtRange=0), trueRate=0,
  p=1, s=0. `repauseCount=7`, `playBlocks=0`, `caps=0`.
- Kill: **`"no-callback-frozen"` ở 17408 = pausedAt+606 ms** — nhanh hơn
  1000 ms vì đồng hồ đóng băng `frozenSinceMs` đã tích lũy từ trước pause:
  frame cuối cùng tiến (12→13, ct 0,433→0,437) vào ~16408, kill =
  ~16408+1000 ms. (Suy ra từ thời điểm kill; không đo trực tiếp được mốc
  frame tiến cuối vì state100 thưa ~200–400 ms/lượt dưới tải — nêu rõ
  giới hạn này.)
- Blind c1 = 3109 ms (entry 14299 → ring 17408). Ring lấp frame 13
  (= frame đóng băng). Sau resume phát tiếp bình thường.
- Đọc đúng: kill này **không phải hoàn toàn do injection tạo ra** — stall
  đã có sẵn tự nhiên; injection chỉ khóa chặt freeze để không frame nào
  tiến thêm. Nếu không có injection, frame có thể đã tiến thêm trước
  17408 (tốc độ creep đo được ~1 frame/2200 ms nên khả năng này thấp,
  nhưng không loại trừ tuyệt đối). Dù vậy, đây là bằng chứng mạnh nhất
  tới nay rằng freeze-path bắn đúng trên stall thật, không chỉ trên
  stall nhân tạo.

### 3.3 Không kill oan

- Cả 5 lượt: mọi kill `"no-callback"` (advance-path) đều bắn khi frame
  thật sự tiến; 2 kill `"no-callback-frozen"` đều bắn khi frame + ct đứng
  yên ≥1000 ms và pump im ≥1000 ms; kill `"clip-change"`/memo không liên
  quan. Không lượt nào có kill trên Chromium khỏe (không chạy Chromium đợt
  này — xem §5).
- Ring luôn lấp đúng frame đóng băng (lastFrame 7 ở r3, 13 ở r5) — snapshot
  tick của frame đóng băng đúng pixels như Y5 đã lập luận (X5 §2.1).

### 3.4 Tiết kiệm ước tính (counterfactual, nêu rõ biên)

- r3: không có freeze-path, pump sẽ chết dính tới khi resume (+2724 ms)
  rồi advance-path mới bắn ở tick đầu frame tiến sau resume (~+2900 ms).
  Freeze-kill bắn ở +1333 ms → **tiết kiệm ~1,4–1,6 s**. Kỳ vọng cứu
  ~1100 ms của Y5 ở ca r5 (dựa trên blind 2132 ms) nay được thay bằng số
  đo trực tiếp cùng bậc (~1,4 s).
- r5: stall tự nhiên đã 2200 ms tuổi lúc pause; không có freeze-path thì
  blind còn kéo dài tới khi frame creep tiếp (tốc độ ~1 frame/2200 ms) —
  không ước tính được số chắc, chỉ ghi: kill ở +606 ms sau pause, sớm hơn
  mọi đường khác có thể.

## 4. Cơ chế resume không qua play() — bằng chứng mới

### 4.1 Re-pause r2: 21 lần lật, 0 lần play(), 0 lần seeking

- r2 (load 10,21): `repauseCount=21` trong 2576 ms (~1 lần/123 ms = đúng
  nhịp tick dưới tải), `playBlocks=0`, `seeking=1` trong **0/24 mẫu trace
  và 0/26 mẫu state100** trong cửa sổ freeze. Element lật sang playing
  đúng nhịp tick mà không có `play()` nào trên prototype đã stub và không
  có seek nào.
- Loại trừ: syncMedia `play()` mỗi tick (đã stub — `preview.tsx:4605`
  `else if (a.el.paused) void a.el.play()` — nếu đường này chạy thì
  playBlocks > 0); MediaPool retryPlay95W2 (`media.ts:574,694` — cũng gọi
  `el.play()` → stub); drift-seek (seeking=0 tuyệt đối).
- Kết luận: **pipeline WebKitGTK/GStreamer tự lật `paused` về false**
  (chuyển trạng thái async chưa hoàn tất — pause() gọi trong lúc pipeline
  đang chuyển trạng thái sẽ bị mất khi chuyển trạng thái hoàn tất; hoặc
  task `play()` đã queue từ lúc clip entry nhưng chạy muộn hàng trăm ms
  dưới tải — Y5 §3.1 — và lặp lại mỗi tick do syncMedia gọi play() trước
  khi stub được cài? Không — stub cài trước khi phát. Cơ chế chính xác ở
  tầng GStreamer vẫn chưa xác định được từ page; cần đọc code WebKitGTK
  hoặc strace pipeline mới kết luận — ghi là nợ mở, không đoán thêm).
- Hệ quả thực hành: **mọi cách giữ dựa trên timer đều thua throttle**
  (setInterval 5 ms → hiệu dụng ~107 ms ở r2, ~370 ms ở r5; setInterval
  16 ms của watcher → ~400 ms ở r4). Chỉ có chặn ở tầng property (deepstub)
  mới miễn nhiễm vì không phụ thuộc nhịp timer.

### 4.2 Deepstub hoạt động như thế nào (và vì sao an toàn)

- Sau `pause()`: gán `el.playbackRate = 0` (setter thật — rate nội bộ
  thành 0), rồi `Object.defineProperty` shadow `currentTime`
  (getter trả frozenCt, setter no-op) + `playbackRate` (getter 0, setter
  no-op) ở tầng instance. Mọi lần app gán lại (`preview.tsx:4289,4529`)
  đều rơi vào setter no-op → rate nội bộ giữ 0, seek không thực thi.
- Kiểm chứng shadow ngay lúc cài (gán 9,9 / 1 rồi đọc lại): r3 + r5 đều
  `deepStubOk=true`. Trace đọc ct/rate THẬT qua getter gốc của
  `HTMLMediaElement.prototype` (lưu trước khi shadow) để phân biệt shadow
  với pipeline thật — trueCtRange=0 cả 2 lượt chứng minh pipeline thật
  sự đứng yên, không chỉ "app nhìn thấy đứng yên".
- Watchdog đọc `pump.el.currentTime` → getter shadow trả frozenCt (hằng)
  → `ctFrozen=true` đúng (vì ct thật cũng hằng — đã kiểm bằng trueCt).
- Resume: `delete` 2 own-property (khôi phục accessor gốc) → gán rate=1
  → `play()`. Cả 2 lượt resume xong phát tiếp bình thường (c2 blind 0 ms,
  ph chạy tới 8,8; pageErrs=0). Không phát hiện tác dụng phụ (cần thêm lượt
  mới dám khẳng định hoàn toàn — deepstub chỉ là công cụ đo của probe,
  KHÔNG đưa vào production).

### 4.3 Trigger — 2 lần không bắn (đã chẩn đoán, 1 đã sửa)

- r1: luật steady cũ (Y5 sửa lần 5: ct tiến ≥0,1 s trong 500 ms) không bao
  giờ thỏa vì element kẹt creeping (ct 0,300→0,301 suốt 700 ms). **Đã sửa
  trong probe Z4:** chỉ chờ 500 ms kể từ lần đầu THẤY element (đủ để task
  play() đã queue chạy xong), bỏ yêu cầu ct tiến. r2/r3/r5 trigger bắn
  được nhờ sửa này.
- r4: `eligibleSeen=0`, watcher chỉ chạy 90 lần/~34 s (interval 16 ms bị
  throttle tới ~400 ms dưới tải; state100 50 ms cũng chỉ giao 81 mẫu).
  Không mẫu nào rơi vào cửa sổ eligible (ct<1,0, !seeking, !paused).
  **Chưa sửa:** đợt sau nên nới ct<2,0 và/hoặc cho watcher đọc state100
  (đã có sẵn) thay vì tự quan sát — ghi vào §6.

## 5. Săn đóng băng cứng tự nhiên — tổng kết 5 lượt

- 10 clip có pump (c0+c1 × 5 lượt; c2 là memo, không pump). Stall ph đứng
  ≥1000 ms: 13 cửa sổ; phân loại bằng ctRange (hard = ctRange < 0,017 s):
  - Creeping (ctRange 0,033–1,067 — frame vẫn tiến): 10 cửa sổ. Advance-path
    xử lý trước trong mọi ca (blind c1 dài nhất không-injection: r4 2832 ms
    dưới tải 8–12 — tải kéo dài blind, không phải hồi quy code: cùng build
    Y5, Y5 đo tối đa 1480 ms lúc tải nhẹ hơn).
  - Hard (ctRange < 0,017): 4 cửa sổ, nhưng chỉ **1 là cơ hội cho
    freeze-kill khi pump còn sống** (r5 c1 — xem §3.2); 3 còn lại là sau
    khi pump đã chết (r3 c0 ×2, r4 c0 ×1 — tick path đã làm chủ) hoặc lúc
    khởi động (r3 c0 t0=91 ms, ph=0 — chưa phát thật).
- Tỉ lệ gộp với Y5: đóng băng cứng tự nhiên ~2/42 clip có pump (~5%)
  (Y5: 1/32; Z4: 1/10 — mẫu nhỏ, biên rộng). Với tỉ lệ này, săn thuần túy
  cần ~20 lượt mới kỳ vọng 1 ca — deepstub là cách chứng minh thực tế.
- Blind c1 wk 5 lượt: 1788 / 1489 / 2404 / 2832 / 3109 ms (2 lượt sau có
  injection freeze 2500 ms nên blind dài là đúng; r4 2832 ms không
  injection là dài nhất tự nhiên — tải).

## 6. Kiểm chứng

- **Không sửa production** — chỉ thêm/sửa file probe + tài liệu này.
  `preview.tsx` md5 đầu lượt `a0a078e1`, cuối lượt `41b05c8e` (đổi bởi các
  luồng khác đợt 98, không đụng vùng watchdog — Z4 xác minh bằng grep:
  marker "Đợt 97 Y5" ×4 còn nguyên, `rvfcWatchdogMiss` không đổi).
- tsc web **0** (trên cây cuối lượt, md5 `41b05c8e`).
- vite build **PASS** (9,20 s).
- Suite kiểu X9b (`node --experimental-strip-types`):
  previewEngine **25/25**, playheadHold90R2 **56/56** (tăng từ 50/50 đợt
  97 — luồng khác thêm 6 test, đều xanh), seek **21/21**,
  playheadPacing54K9 **19/19**, previewLoop50F2 **20/20**,
  seekSkipRender86N3 **9/9**.
- Headed: 5 lượt WebKit scroll-blur, `pageErrs=0` tất cả, `mtimeChanged`
  chỉ ở r1 (Z2 sửa `preview.tsx` giữa lượt — trang đã load build cũ
  `a0a078e1` lúc boot nên số đo r1 vẫn thuộc build đó; đã ghi rõ).
- `test-preview-engine.sh` không chạy lại (lỗi sẵn `MODULE_NOT_FOUND`
  `./previewClipKey62R6.ts` từ trước đợt 96, không do Z4 — xem LIMITS
  đợt 97 §4 mục 11).
- O8 không chạy lại: Z4 không đụng render hay production; Z10 đợt 98 làm
  verify gộp (bao gồm O8) trên cây đầy đủ.

## 7. Nợ mở cho đợt sau

1. **Cơ chế lật `paused` ở tầng GStreamer chưa xác định chính xác** (§4.1):
   21 lần lật/tick không qua `play()`/seek. Cần đọc code WebKitGTK hoặc
   đo bằng GST_DEBUG — ngoài phạm vi probe page. Không ảnh hưởng sản phẩm
   (chỉ ảnh hưởng fault-injection).
2. **Trigger injection còn mỏng:** r4 `eligibleSeen=0` vì watcher thưa
   (~400 ms/lần dưới tải). Nới ct<2,0 và/hoặc dùng state100 làm nguồn
   quan sát cho watcher.
3. **Deepstub là công cụ đo, không phải fix production** — không đưa
   shadow property vào app. Nếu đợt sau muốn tái hiện freeze nhanh thì
   dùng lại probe này (`--freeze-mode deepstub`).
4. **Chưa chạy Chromium:** freeze-kill trên Chromium (engine có callback)
   chưa đo — pump sống trên Chromium nên freeze-path ít khi cần tới; chỉ
   đo nếu muốn khẳng định không kill oan trên engine khỏe.
5. **Blind c1 dưới tải nặng kéo dài tới ~2,8 s** (r4, không injection) —
   advance-path cũng chậm theo nhịp tick; có phải là vấn đề sản phẩm
   (cửa sổ mù dài khi máy tải) hay chỉ là artifact đo dưới tải 8–12 cần
   luồng riêng đối chiếu với máy yên.

## 8. Kiểm chứng + batch đã stage (KHÔNG push)

- 5 lượt headed WebKit, 0 collision (mỗi lượt vite port + Xvfb display
  riêng qua lock W8; không dọn mồ côi nào).
- 0 lượt mất (evaluate timeout 30 s + nhịp tim vòng chờ đã cài — không lần
  nào phải dùng tới; bài học r9 đã được cài vào probe nhưng chưa được
  kiểm chứng bằng ca treo thật).
- Batch stage: `phase9-round98-z4-watchdog-freeze.txt` — 2 entry, read-back
  OK (NUL-delimited, 0 binary, 0 workflow):
  - `docs/PHASE9_ROUND98_Z4_WATCHDOG_FREEZE_LIMITS.md` (file này)
  - `apps/web/scripts/probe98z4-frame-parity.mjs` (probe Z4: --freeze-mode
    repause|rate0|seekloop|repause-rate0|deepstub, freezeTrace 10 ms +
    trueCt/trueRate qua getter gốc, evaluate timeout 30 s + nhịp tim,
    cap draws/mainDraws 400→2000)
- Analyzer `hidden_files/round98-z4/analyze98z4.mjs` + JSON 5 lượt ở
  `hidden_files/round98-z4/wk-freeze-*/frame-parity-results.json` (không
  nằm trong repo nên không đưa vào batch; xem log luồng
  `hidden_files/round98-z4.md`).
