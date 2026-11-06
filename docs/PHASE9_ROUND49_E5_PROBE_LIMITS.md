# Phase 9 đợt 49, luồng E5 — Probe: FILMSTRIP + FINGERPRINT + TRẦN 1000 TRÊN B-FRAME — LIMITS

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ C6/Z5/A5/B5/D5).

Đọc trước: `docs/PHASE9_ROUND48_D5_PROBE_LIMITS.md` (đợt 48 §4 nợ 6
+ §6 nợ 2/3/5) và `docs/PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md`
(đợt 48 §4 nợ 6). Nợ đóng ở đây: D5 §6.2 (trần 1000 trên footage
B-frame), D5 §6.3 (filmstrip không chạy trong lượt sync C6), D5
§6.5 (endPool sau drop chưa có fingerprint elementId trực tiếp).

## 0. Kết luận ngắn

1. **Filmstrip trong lượt sync — ĐÃ CHẠY THẬT, 10/10 entry.**
   Nhả callback IO đúng lúc episode bắt đầu → filmstrip Timeline
   chạy qua `captureFrame` với đủ 10 mốc 1.5–28.5 (không mốc nào = 0),
   stack qua đúng call site `QT` 58:45553 C6 đã ghim. Filmstrip làm
   chậm tốc độ mẫu của entry sync trong cửa sổ ~4 s của nó (~19,8/s
   so với ~23,9/s kề sau ≈ 16 mẫu) nhưng **không làm tăng dropped
   (0) và không gây chạm trần** — trần còn hụt 36 mẫu (964/1000),
   và cộng lại 16 mẫu filmstrip thì vẫn hụt. Xem §1.
2. **Fingerprint elementId cho endPool sau drop — ĐÃ CÓ, KHỚP.**
   Probe vá `elementIdOf(el)`; pool key giữ nguyên nhưng id đổi
   0 → 11; entry sau drop (k=13, target 10) mang đúng id 11, khác
   id 0 đã drop; `fingerprintOk = true`. Test Node 9/9 khóa cơ chế
   bằng code probe thật. Xem §2–§3.
3. **Trần 1000 trên footage B-frame — KHÔNG ĐO ĐƯỢC bằng flow này
   (2/2 lượt hoàn tất tái hiện).** Seek B-frame "xong" ở tầng
   demuxer trong ~1 s (seeked/fallback) trong khi frame thật không
   bao giờ tới (`readyState` kẹt 1); vòng lặp ngủ vì cạn cap
   thử-vẽ-lại với `lastDrawn = null`; scrub 5 không tạo entry mới
   (N1) rồi cạn cap → drop (fingerprint 0 → 1 chứng minh). Tiền đề
   episode không thành lập nên không có số trần/dropped trên B-frame
   — cần flow khác. Xem §4.
4. **Trần 1000 trên đường sync, footage không B-frame — HẸN GIỚI,
   KHÔNG ĐẢM BẢO.** Lượt noise E5 (có filmstrip): 964 mẫu giữ + 0
   dropped, `capHit = false` — hụt 36 mẫu so với D5 (1000 + 88,
   `capHit = true`). Trần là cuộc đua giữa thời gian seeking (~38 s,
   do drip giao đủ dữ liệu) và tốc độ rAF (~25–31/s, dao động theo
   lượt): ở ~25/s thì hụt, ở ~30/s thì chạm. Trần vẫn đứng như lưới
   an toàn, nhưng không phải giới hạn vận hành chắc chắn.
5. **KHÔNG đo WebCodecs/Safari/máy thật** — không có binary, ghi rõ
   là chưa đo, không claim. Baseline quiet vẫn chờ cửa sổ yên từ
   main chat — không ép đo.

## 1. Filmstrip trong lượt sync — ĐÃ CHẠY THẬT, 10/10 entry

Lượt noise (`~/workspace/tmp-round49-e5/sync-noise/`, evidence
`sync-cap-evidence.json` + `sync-cap-entries.json`).

### 1.1 Filmstrip chạy được nhờ bọc IO lúc chạy — và đó là đường Timeline thật

- Trước lượt này (C6 §1.5): filmstrip chết ở IO race lúc mount —
  `ClipThumb` đăng ký `IntersectionObserver` trước khi rehydrate nạp
  xong media bin, `doCapture` tìm không thấy media rồi disconnect.
  Script E5 bọc `IntersectionObserver` bằng `addScriptToEvaluateOnNewDocument`
  (như probe vá prototype): giữ mọi callback IO tới khi harness gọi
  `window.__e5ReleaseIO()`. Không sửa app, không sửa hành vi capture.
- Lượt này: `releasedCallbacks = 1`, `ioWrapped = true`, nhả đúng lúc
  episode bắt đầu (sau S2a xác nhận seeking, `releasePerfMs =
  61070,4`). 1 callback = IO của ClipThumb (clip seed duy nhất).
- Bằng chứng là đường Timeline thật, không phải gọi tay
  `captureFrame`: 10 entry k=2–11, elementId 1–10 (element riêng,
  khác pool el 0), target đúng 10 mốc `filmstripTimestamps(0, 30)` =
  **1.5, 4.5, 7.5, 10.5, 13.5, 16.5, 19.5, 22.5, 25.5, 28.5** (đủ
  10/10, không mốc nào = 0 — đối chứng với C6 origin: target 0 vì
  webm mẫu có duration Infinity; ở đây blob flat 30 s có duration
  hữu hạn nên target là số thật). Stack của cả 10 đều qua call site
  `QT` tại `index-D4oCKuDp.js:58:45553` — đúng vị trí C6 §2.1 đã ghim
  là `captureFrame` (bundle minified nên tên hàm là QT, không phải
  chuỗi "captureFrame" — bản đầu của script kiểm tra sai chuỗi này
  nên báo false; đã sửa thành kiểm tra call site 58:45553 trước lượt
  B-frame, và 10 stack lượt noise đã đối chiếu lại bằng tay từ
  `sync-cap-entries.json`).
- Trạng thái 10 entry filmstrip: 1 completed, 6 seeked-no-draw, 3
  unresolved; seek latency (khi có seeked) 299,5–1293,4 ms; mẫu
  seeking mỗi entry 5–32 (dropped 0 cả 10). Seek trên file flat local
  45 KB vẫn mất 0,3–1,3 s — vì lúc đó vòng sync + scrub đang chiếm
  main thread, không phải vì file chậm. `rafTicksWhileWaiting` của các
  entry unresolved lên tới ~1500 là định nghĩa của probe (đếm tới lúc
  read(), không phải lỗi) — không dùng làm metric.
- S1 vẫn artifact rAF-fallback như C6/D5 (k=0: latency 30,2 ms,
  `seekedEvent: false`, vẽ thật sau đó) — không trích "seek 30 ms"
  làm seek nhanh.

### 1.2 Filmstrip có làm tăng dropped / chạm trần không? — KHÔNG, nhưng có làm chậm mẫu

Entry sync k=1 (target 5, el 0): **964 mẫu giữ + 0 dropped,
capHit = false** — KHÔNG chạm trần 1000 (D5 không filmstrip:
1000 giữ + 88 dropped, capHit = true). Phân tích tốc độ mẫu theo
bin 1 s (từ `decodedSamplesWhileSeeking[].tMs`, mốc release):

| Cửa sổ (so với lúc nhả) | Mẫu/s | Ghi chú |
|---|---|---|
| +0–+4 s (filmstrip + 5 bước scrub đầu) | ~19,8 | filmstrip seek ở +0,2–+3,4 s, seeked xong ở +4,7 s |
| +5–+17 s (chỉ scrub, hết filmstrip) | ~23,9 | baseline giữa episode |
| +18–+30 s (scrub tiếp) | ~26,9 | — |
| +31–+37 s (hết scrub, chỉ chờ) | ~30,1 | không còn việc scrub |

- Filmstrip làm chậm mẫu thật trong cửa sổ của nó: ~19,8/s so với
  ~23,9/s ở cửa sổ kề sau (chỉ scrub) → tốn ~4 mẫu/s × ~4 s ≈
  **~16 mẫu**. Nhưng trần hụt **36 mẫu** (964 so với 1000) nên
  filmstrip chỉ giải thích được chưa tới một nửa phần hụt; phần còn
  lại là tốc độ rAF chung của lượt này (~25,2/s trung bình, thấp hơn
  ~30,6/s của D5) + chi phí scrub (~6 mẫu/s so với lúc không scrub).
  Đối chứng: nếu cộng lại 16 mẫu filmstrip thì vẫn chỉ ~980 < 1000.
- **Kết luận:** filmstrip KHÔNG làm tăng `droppedSeekingSamples`
  (0 ở cả entry sync lẫn 10 entry filmstrip — D5 có 88 dropped là
  vì ĐÃ chạm trần nên mới đếm dropped, không phải vì filmstrip),
  KHÔNG gây chạm trần (trần còn hụt 36 mẫu), nhưng CÓ làm chậm tốc
  độ mẫu trong cửa sổ ~4 s của nó (~4 mẫu/s). Cửa sổ tranh chấp ngắn
  (filmstrip chỉ ~1 s decode trên blob local) — không phóng đại
  thành "filmstrip luôn làm chậm sync".

## 2. Fingerprint elementId cho endPool sau drop — ĐÃ CÓ, KHỚP

Lượt noise (`~/workspace/tmp-round49-e5/sync-noise/`).

### 2.1 Cơ chế

- Probe vá lúc chạy thêm `probe.elementIdOf(el)` (qua helper
  `apps/web/scripts/per-seek-probe-patch49e5.mjs`, cùng helper test
  Node dùng — KHÔNG sửa file probe gốc dùng chung). Trả id hiện có
  hoặc gán mới nếu element chưa từng seek (id không tái dùng).
- Snapshot pool cuối phiên (`POOL_SNAPSHOT_JS`) nay ghi
  `probeElementId` cho từng video pool. Pool key giữ nguyên khi tạo
  lại element (gap D5 §4.4) — chỉ `probeElementId` mới phân biệt
  được element cũ/mới.
- Harness ghi lịch sử snapshot pool trong lúc chờ ngủ (mỗi 2 s) để
  bắt đúng thời điểm drop (`seekElementRecreated` 0→1), rồi phase
  S2d scrub sang target mới (10) để ép seek trên element mới.

### 2.2 Số đo lượt noise — fingerprint khớp (`fingerprintOk = true`)

Chuỗi id kể từ đầu phiên (ghi rõ để khỏi ai đọc nhầm id 11 thành lỗi):
pool el 0 nhận id **0** ngay ở snapshot settle (mint-on-peek, chưa
seek lần nào); 10 element filmstrip nhận id **1–10**; element mới
sau drop lần 1 (el 1) nhận id **11**; element sau drop lần 2 (el 2)
nhận id **12**.

| Mốc | Giá trị |
|---|---|
| Drop lần 1 (S2b, `firstDropAtSec = 46,5`) | pool key `rehydrated-a_a4ea20eb67bb6b21-0`: probeElementId **0 → 11** (key giữ nguyên, id đổi) |
| Entry cuối trước drop (k=12, target 23) | elementId **0** (= id element đã drop) |
| Entry sau drop (k=13, target 10, S2d) | elementId **11** (= id element mới el 1) |
| `matchDropFingerprint` | `replacedKeys = [rehydrated-a_a4ea20eb67bb6b21-0]`, `newElementIds = [11]`, `entryMatchesNewPool = true`, `entryDiffersFromDropped = true`, **`fingerprintOk = true`** |
| endPool sau S2d (drop lần 2) | 1 video, cùng pool key, probeElementId **12**, ct 0, readyState 1 — là el 2, khác el 1 (id 11) |

- S2d xác nhận cơ chế phục hồi Y2 hoạt động: sau drop lần 1, scrub
  10 → seek trên el 1 (entry k=13, 386 mẫu trong 13,3 s) → kẹt drip
  → cạn cap lần 2 (count 10, target 10, recreated 1, seeking 1) →
  drop el 1 → el 2 (ct 0). EndIdle S2d khớp đúng mẫu D5.
- Lưu ý trung thực: id 11/12 KHÔNG phải "element thứ 11/12" theo
  nghĩa pool — chúng là id probe toàn cục (filmstrip đã chiếm 1–10).
  Đọc fingerprint phải đối chiếu id với pool key + entry, không đọc
  số id tuyệt đối.

## 3. Test khóa fingerprint (Node, code probe thật)

File `apps/web/scripts/pool-element-fingerprint-49e5.test.mjs` — nạp
CODE PROBE THẬT (`per-seek-probe-page.js` + vá E5 qua cùng helper
script đo dùng) vào `node:vm` với `HTMLMediaElement` giả tối thiểu
(descriptor `currentTime` thật để probe vá setter như trên Chrome,
rAF bơm tay, `performance.now` điều khiển được). Không mock logic
probe — chỉ mock DOM/bộ đếm thời gian. Chạy:
`node --test apps/web/scripts/pool-element-fingerprint-49e5.test.mjs`
→ **9/9 pass**, 0 fail.

| Test | Khóa cái gì |
|---|---|
| Vá E5 thêm elementIdOf; probe chưa vá không có nó | đỏ-trước của vá: nguồn gốc không định nghĩa `elementIdOf` |
| Entry sau drop mang đúng elementId của pool element mới, khác element đã drop | elA seek → entry elementId 0; drop elA, elB seek → entry elementId 1 = `elementIdOf(elB)`, ≠ `elementIdOf(elA)` = 0; entry lúc drop vẫn mang id 0 |
| elementIdOf không tái dùng id | element thứ ba chưa từng seek nhận id 2; gọi lại trả cùng id |
| Entry vẫn mang đủ trường D5 sau vá E5 | `stack47C6`/`srcAtSeek47C6`/`wallMs47C6` còn nguyên |
| Mẫu seeking giữ tối đa 1000, vượt thì đếm dropped | 1005 tick → giữ 1000, dropped 5 (trần probe) |
| matchDropFingerprint dương | cùng pool key, id 0→1, entry mang 1 → `fingerprintOk = true` |
| matchDropFingerprint ÂM (entry mang id cũ) | entry sau drop mang 0 → không khớp |
| matchDropFingerprint ÂM (chỉ so pool key) | key giữ nguyên + id giữ nguyên → `replacedKeys = []`, không khớp (gap D5 §4.4) |
| matchDropFingerprint ÂM (entry mang id lạ) | entry mang 7, pool sau drop có 1 → không khớp |

## 4. Trần 1000 trên footage B-frame

**Fixture B-frame đã encode + verify xong (trước lượt chạy browser):**
`~/workspace/tmp-round49-e5/bframe-gop30-noise.mp4` — encode lại từ
` sparse-gop-noise.mp4` bằng
`ffmpeg -i noise -c:v libx264 -preset veryfast -bf 3 -g 30 -keyint_min 30 -sc_threshold 0 -pix_fmt yuv420p -an`
(xem script gen `apps/web/scripts/gen-fixture-bframe-49e5.sh`).
Verify bằng ffprobe: 1280x720, 30fps, 30 s, 387572806 byte;
pict_type: **630 B / 240 P / 29 I** (900 frame); keyframe ở frame
1/31/61 → **GOP đúng 30** như gốc; `has_b_frames=2` (đặt bf=3 nhưng
stream báo reorder depth 2 — vẫn là footage B-frame thật vì 70% frame
là loại B; ghi rõ để khỏi ai trích bf=3 thành số đo). Fixture gốc
không B-frame: `has_b_frames=0`, GOP 30, 419967521 byte.

**Lần thử 1 (THẤT BẠI, không tính):** lượt B-frame đầu tiên
(`~/workspace/tmp-round49-e5/sync-bframe/`, display :93, port 4292)
chết ở S1 với `BLOCKER: CDP timeout Runtime.evaluate` — trang không
đáp evaluate trong 120 s, không ghi được evidence. Nguyên nhân xác
định: **tranh chấp với Chrome của luồng song song khác**, KHÔNG phải
do B-frame — lúc đó trên máy có Chrome lạ (`--remote-debugging-port=9402`,
profile `tmp-round48-d6-overlap/cdprof-d6`, renderer 14,8% CPU) +
Xvfb :93 1440x900 (không phải Xvfb 1280x800 của script này) đang chạy;
load đầu phiên 11,61. `chrome-stderr.log` chỉ có lỗi dbus lành tính +
`X connection error` lúc cleanup kill Chrome (hệ quả, không phải
nguyên nhân). Không có crash, không có evidence. Chạy lại trên
display :91 + port 4290 (scratch `sync-bframe2`).

**Lần thử 2 và 3 (HOÀN TẤT, cùng kết quả — 2/2):**
`sync-bframe2` (display :91, load đầu 3,84) và `sync-bframe3`
(display :92, load đầu 0,63 — cửa sổ yên nhất trong cả đợt).
Cả hai đều KHÔNG thành lập được episode, với cùng signature từng
con số:

| Mốc | B-frame (thử 2 / thử 3) | Noise (lượt E5 §1, đối chứng) |
|---|---|---|
| S1 scrub 25: vòng lặp ngủ sau | 23,1 s / 21,1 s, `lastDrawn = null`, `seekFailureCount = 0`, `seekFailureExhausted = false` | 49,3 s, `lastDrawn = 25` (vẽ được, artifact fallback) |
| Entry k=0 (target 25) | `seekLatencyMs` 15,5 / 5,3 ms qua **rAF-fallback** (`seekedEvent = false`), **0 mẫu**, `rafTicksWhileWaiting` 1254 / 1296, trạng thái cuối `seeked-no-draw`, `flushElementReadyState = 0` | latency 30,2 ms fallback, 0 mẫu, rồi vẽ thật sau đó |
| Pool cuối S1 | `seeking = true`, `ct = 25`, `readyState = 1` | `seeking = false`, `ct = 25`, `readyState = 3` |
| S2a scrub 5 (15 s chờ) | **không entry mới nào**; element bị drop + tạo lại (`probeElementId` 0 → 1, `ct = 0`, `seeking = false`, `readyState = 1`); episode bị skip | entry k=1 pending, seeking true, 964 mẫu |
| Kết quả trần | **không đo được** (`capHit = false`, `maxSamples = 0`, `maxDropped = 0`, 1 entry) | 964 giữ + 0 dropped, capHit false (xem §1.2) |

### Cơ chế — suy từ code + số đo (ghi rõ chỗ nào là suy luận)

1. **Seek B-frame "xong" quá nhanh ở tầng demuxer.** `pendingSeek`
   đã false + `seekFailureCount` vẫn 0 từ tail đầu tiên (9,1 s sau
   scrub) — tức lần seek đầu tiên kết thúc KHÔNG-lỗi trong vòng
   ~1,2 s: hoặc sự kiện `seeked` thật đã bắn, hoặc early-exit. Early-exit
   loại được ở lần đầu (`currentTime` 0 ≠ target 25) nên chỉ còn
   `seeked` thật đã bắn — Chrome định vị được qua moov/sample-table
   mà không cần đợi byte frame. Đối chứng noise: `seeked` không bắn
   trong 1,2 s, seek kẹt `seeking = true` ~38 s (D5 k=1 latency
   38203 ms). Nhật ký range giải thích vì sao frame không tới:
   Chrome xin cả dải `324599808–387572805` (~63 MB quanh mốc 25 s)
   nhưng drip 64 KiB/s chỉ giao được ~1,2–1,8 MB; frame B ở 25 s
   cần frame tham chiếu chưa về nên `readyState` kẹt ở 1, không
   frame nào giải mã được.
2. **Vòng lặp ngủ vì cạn cap thử-vẽ-lại, không phải vì seek lỗi.**
   `lastDrawn = null` + `seekFailureCount = 0` + `seekFailureExhausted
   = false` thì trong 3 đường ngủ ở `preview.tsx:3092` chỉ còn đúng
   một đường tới được: `pauseRetryMaySleep(pauseRetryExhausted, …)`
   — vẽ thử rồi skip (không frame) đủ lần thì bỏ cuộc và ngủ, không
   vẽ được gì. Đây là suy luận từ code (đã đối chiếu 3 đường ngủ),
   không phải số đo trực tiếp.
3. **Scrub 5 không tạo entry mới — đúng cơ chế N1 đã khóa ở D5.**
   Element vẫn `seeking = true` nên `seekElement` chỉ chờ `seeked`,
   không gán lại (0 lần gán). 10 lần chờ × 1200 ms ≈ 12 s → cạn cap
   trong cửa sổ S2a 15,1 s → drop el 0 → tạo el 1 — **fingerprint
   chứng minh trực tiếp: `probeElementId` 0 → 1 dưới cùng pool key**
   (đường drop duy nhất trong code là Y2 ở `preview.tsx:2981`).
   Vòng lặp ngủ trong trạng thái cạn cap nên lần seek trên el 1
   không bao giờ được phát (cần một request playhead mới sau lúc
   cạn — scrub 5 đã xảy ra TRƯỚC lúc cạn).
4. **Probe cũng bịt mất cửa sổ mẫu trên B-frame.** Entry k=0 đóng
   `seekedAtMs` sau 5–15 ms bằng rAF-fallback (Chrome báo
   `currentTime = 25` + `seeking = false` ngay tick đầu sau khi gán
   — hành vi đã biết, xem `seek.ts` N1) nên cửa sổ lấy mẫu seeking
   đóng trước cả khi element kịp vào trạng thái seeking quan sát
   được: **0 mẫu** dù pool snapshot sau đó thấy `seeking = true`.
   Đây là hạn chế của probe trên seek B-frame, ghi rõ — không phải
   "element không seek".

### Kết luận B-frame

- **Trần 1000 KHÔNG đo được trên footage B-frame bằng flow
  episode này — không phải "giữ" cũng không phải "vỡ".** Tiền đề
  của phép đo (element kẹt seeking đủ lâu để tích mẫu) không thành
  lập trên B-frame: seek "xong" ở tầng demuxer trong ~1 s trong khi
  frame thật không bao giờ tới, nên giới hạn vận hành chuyển sang
  cap thử-vẽ-lại (pauseRetry), không phải trần 1000 mẫu. Trần 1000
  vẫn đứng như lưới an toàn (code probe không đổi; trần đã khóa bằng
  test Node 9/9 ở §3), nhưng câu hỏi "trần có giữ đúng 1000 không,
  dropped bao nhiêu" trên B-frame **chưa có số đo** — cần flow khác
  (ví dụ: B-frame serve nhanh/local để seek hoàn tất thật rồi mới
  đo mẫu, hoặc drip chậm hơn nữa để demuxer cũng kẹt). Ghi rõ là
  chưa đo được, không claim trần giữ/vỡ trên B-frame.
- Chưa rõ (ghi rõ, không đoán): vì sao pool snapshot cuối S1 thấy
  `seeking = true` trong khi lần seek đã kết thúc không-lỗi trước
  đó — chuyển đổi trạng thái nội bộ này của Chrome không quan sát
  được từ dữ liệu đã lưu, và không ảnh hưởng kết luận trên.

## 5. Hồi quy probe đủ bộ — XANH (chạy sau các lượt browser, không đụng file luồng khác)

- B5 `per-seek-probe-pool-cap-46b5.test.mjs` (`node --test`): **5/5 pass**, fail 0.
- A6 `reverseBadge45A6.test.ts` (esbuild bundle `--format=esm` ra
  `/tmp/e5-reg`, `node --test`): **12/12 test con pass** (node --test
  đếm 1 file), fail 0. Chạy trực tiếp bằng strip-types lỗi
  `ERR_MODULE_NOT_FOUND` (import thiếu đuôi `.ts` — cần bundle như
  D5 đã làm, không phải lỗi code).
- seek `seek.test.ts` (`node --experimental-strip-types`): **15/15 pass**.
- D5 `seekStuckNoAssign48D5.test.ts`: **7/7 pass**.
- E5 mới `pool-element-fingerprint-49e5.test.mjs`: **9/9 pass** (xem §3).
- `npx tsc --noEmit` (từ `apps/web`): **9 lỗi, TẤT CẢ đều ở
  `src/lib/ttsEstimate49E1.test.ts` — file test của luồng E1 đợt 49,
  không phải của E5** (TS6133 biến không dùng ×4, TS2307 thiếu module
  `./ttsEstimate49E1`, TS7006 implicit any ×4). E5 không thêm/sửa file
  `.ts` nào (test + script E5 đều là `.mjs`, ngoài phạm vi tsc) nên
  0 lỗi trong đó thuộc về E5; theo tiền lệ D5 (không sửa file luồng
  khác), E5 KHÔNG sửa file E1 — parent xử lý lúc gộp. Nếu bỏ file
  E1 ra khỏi phạm vi thì tsc sạch (chưa verify bằng exclude vì đó là
  việc của parent, không tự ý đổi tsconfig cho file người khác).
- `npx vite build` (từ `apps/web`, ra scratch `/tmp/e5-build-check`):
  **pass, built trong 6,06 s** (cảnh báo chunk > 500 kB có sẵn từ
  trước, không do đợt này). Lưu ý: bundle build ra có hash mới
  (`index-BIkH3k4M.js`, khác dist đóng băng C6 `index-D4oCKuDp.js`
  mà các lượt browser dùng) vì cây làm việc nay chứa thêm thay đổi
  của các luồng đợt 49 khác — các lượt đo vẫn dùng đúng dist đóng
  băng C6, không build lại giữa chừng.

## 6. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. Baseline quiet vẫn chờ cửa sổ yên từ main chat (nợ đứng nhiều đợt).
2. Trần 1000 trên đường WebCodecs / Safari / máy thật vẫn chưa đo.
3. Safari/Firefox/máy thật/màn hình vật lý vẫn CHƯA ĐO.
4. Trần 1000 trên footage B-frame vẫn chưa có số đo (flow episode
   không thành lập — xem §4; cần flow khác, ví dụ B-frame serve
   nhanh/local để seek hoàn tất thật rồi mới đo mẫu).
5. Snapshot đếm key i18n 968 của B6/Z6 đã lỗi thời do D4 thêm 3 key
   (971) — nợ từ D5 §6.6, parent cập nhật lúc gộp; E5 không sửa file
   luồng khác, không đụng i18n.
6. Lần thử B-frame 1 chết vì CDP timeout giữa lúc tranh chấp Chrome
   luồng khác — nguyên nhân B-frame không loại trừ được hoàn toàn cho
   lần thử đó (chỉ có 2 lần thử hoàn tất sau đó cho thấy hành vi
   B-frame nhất quán); nếu cần khẳng định thì chạy thêm lượt B-frame
   nữa trên display riêng lúc máy yên.
7. Probe rAF-fallback đóng seek sau 5–15 ms trên B-frame (0 mẫu) —
   hạn chế của probe, không phải của sản phẩm; ai dùng số mẫu để so
   B-frame với không-B-frame phải tính tới điểm này.

## 7. File đổi/thêm (chỉ của E5 — text, không binary, không dist)

Mới:
1. `docs/PHASE9_ROUND49_E5_PROBE_LIMITS.md` — tài liệu này.
2. `apps/web/scripts/per-seek-probe-patch49e5.mjs` — vá probe lúc chạy
   (D5 + `elementIdOf`) + `matchDropFingerprint` thuần (một nguồn
   duy nhất cho script đo và test Node; KHÔNG sửa file probe gốc).
3. `apps/web/scripts/pool-element-fingerprint-49e5.test.mjs` — test
   khóa fingerprint bằng code probe thật trong vm (9/9 pass).
4. `apps/web/scripts/per-seek-probe-sync-cap-run49-e5.mjs` — script đo
   (bản sao D5 + filmstrip release + fingerprint + S2d + fixture
   size động; không sửa file D5 gốc).
5. `apps/web/scripts/gen-fixture-bframe-49e5.sh` — script encode
   fixture B-frame (chỉ script gen, fixture binary ở scratch ngoài
   repo).

Không đổi (ghi rõ để parent khỏi tìm): mọi file `.ts` production
(`seek.ts`, `pauseSeekCap42X2.ts`, `pauseSeekRecovery43Y2.ts`,
`preview.tsx`, `per-seek-probe-page.js`, i18n, bridge), mọi file của
luồng khác, paths-loop, build-loop-log. Không push, không tag, không
stage batch (parent gộp).

Scratch ngoài repo (không stage):
`~/workspace/tmp-round49-e5/` — `bframe-gop30-noise.mp4` (fixture
B-frame 387572806 byte) + `encode-bframe.log`, `sync-noise/`
(sync-cap-evidence.json + sync-cap-entries.json + chrome-stderr.log
+ chrome-profile + run log), `sync-bframe/` (lần thử 1 lỗi CDP —
chỉ chrome-stderr.log + chrome-profile, không evidence),
`sync-bframe2/` + `sync-bframe3/` (2 lần thử B-frame hoàn tất,
evidence + entries + chrome log); `/tmp/e5-reg/` (bundle hồi quy A6).
