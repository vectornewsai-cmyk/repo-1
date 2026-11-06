# Phase 9 đợt 47, luồng C6 — Probe qua vòng sync preview thật + compat app thật — LIMITS

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ Z5/A5/B5).

Đọc trước: `docs/PHASE9_ROUND46_B5_PROBE_LIMITS.md` §5 (nợ seek qua
vòng sync + nguồn gốc k=0–3), `docs/PHASE9_ROUND46_B6_COMPAT_LIMITS.md`
§3/§5 (nợ compat mức app đầy đủ + badge từng track),
`docs/PHASE9_ROUND46_LIMITS.md` §4 mục 7–8.

Lượt chạy trước của chính luồng này đã bị daemon restart giết giữa
chừng, KHÔNG có báo cáo cuối. Việc đã làm vẫn còn trên đĩa và được
TIẾP TỤC, không làm lại từ đầu: script sync-cap
(`apps/web/scripts/per-seek-probe-sync-cap-run.mjs`, 568 dòng) +
dist `~/workspace/tmp-round47-c6/app-dist` (bundle
`index-D4oCKuDp.js`, đã build với `VITE_BRIDGE_URL` trỏ fake bridge
4296) đã có sẵn; lần chạy origin đầu tiên chết ở 07:13 chưa kịp ghi
evidence (chỉ còn `origin1/chrome-stderr.log` + chrome-profile).
Luồng này chạy lại origin, chạy sync, sửa 1 lỗi script do restart
để lại, rồi viết thêm script compat app thật + chạy 2 lần.

## 0. Kết luận ngắn

1. **Seek qua VÒNG SYNC PREVIEW THẬT đã đo được (sync2).** Project
   có clip + scrub qua timeline UI thật + asset HTTP qua nút Proxy
   thật: 3 entry. Trần 1000 KHÔNG chạm: tối đa **369 mẫu, dropped 0**,
   capHit false. Không phải vì seek nhanh — seek k=1 (scrub 5, drip)
   seeking thật ~13 s — mà vì **vòng lặp tự abort trước khi đủ 1000
   mẫu**: mỗi lần seek thử timeout 1,2 s (`DEFAULT_SEEK_TIMEOUT_MS`,
   seek.ts), đủ 10 lần fail thì cạn cap → drop element cũ, tạo
   element mới; một episode seeking liên tục trong vòng sync tối đa
   ~12–13 s wall, tức tối đa lý thuyết < 780 mẫu ngay cả ở rAF 60/s.
   Trần 1000 vì vậy là lưới an toàn cho đường gán trực tiếp (B5) chứ
   không phải giới hạn vận hành của đường sync — đo được, có bound
   bằng code, xem §1.
2. **CẢNH BÁO phương pháp — số "seekLatency 263 ms" của k=0 là
   artifact, KHÔNG phải seek nhanh.** Entry k=0 (scrub 25, drip)
   chốt `completed` sau 263,6 ms với 0 mẫu, nhưng frame đầu tiên chỉ
   decode sau **+24,9 s** và vẽ sau **+46,0 s** (lastDrawn 25). Probe
   chốt bằng rAF-fallback (`seeking==false` + `currentTime` đã đọc
   25) trong khi seek thật còn đang chờ dữ liệu — `seeking` không
   bao giờ quan sát được true ở tick rAF nào (seek hoãn trước khi có
   metadata + rAF thưa dưới tải). Ai trích "seek 263 ms" từ entry
   này là trích sai; số thật là draw sau 46 s, xem §1.3.
3. **Số mẫu đếm theo tick rAF, KHÔNG theo giây wall — nay có bằng
   chứng trong cùng một lượt chạy.** Tốc độ tick rAF của probe dao
   động **~3,7/s (k=0, 170 tick / 46 s) tới ~60/s (k=1, 814 tick /
   13,4 s)** trong cùng phiên sync2; k=1 giữ 369 mẫu trong ~13 s
   seeking (~28 mẫu/s trung bình, thưa ~2/s trong 0,5 s đầu rồi dày
   lên). Trích số mẫu mà không kèm tốc độ tick/tải của lượt đó là
   sai phương pháp.
4. **Nguồn gốc 4 entry k=0–3 của app ĐÃ GHIM (origin2).** Cả 4 đều
   là `captureFrame(url, atSec)` trong
   `apps/web/src/lib/thumbnails.ts` (hàm QT trong bundle
   `index-D4oCKuDp.js:58:45553`, xác định bằng cách đọc code bundle
   quanh cột đó), do filmstrip của Timeline gọi cho 2 clip mẫu
   (`mau-1/mau-2.webm`, mỗi clip 4 s → 2 mốc 1 s và 3 s). Target
   bằng 0 vì duration của webm do MediaRecorder ghi không hữu hạn
   (Infinity — không có metadata duration) nên công thức target của
   captureFrame rơi về 0. Chi tiết + mức tin cậy từng mắt xích ở §2.
5. **Compat APP THẬT đã chứng minh (compat2, 13/13 PASS).**
   (a) Đổi lang qua **nút TopBar thật** trong app đầy đủ: badge
   `◀ NGƯỢC: WEBCODECS` → `◀ REVERSE: WEBCODECS` và ngược lại,
   **ticks đóng băng 8 → 8** (vòng lặp đang ngủ, effect
   `[previewLang]` làm việc một mình) — đóng nợ B6 §5.2 ở mức app.
   (b) Badge failed từ **controller.failed thật** bằng footage hỏng
   (64 KiB byte rác) trong app đầy đủ: bấm Phát clip ngược → badge
   lật sang `◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)`, nền amber,
   title đúng key mới; đổi lang sang en/vi vẫn đúng chuỗi failed —
   đóng nợ B6 §5.2 còn lại. Bài học lần chạy đầu (compat1, 5/12):
   **lúc pause controller không bao giờ fail** vì `drawTransport`
   đặt `playing:false` nên `stepping=false`, `frameAt/load` không
   chạy — muốn controller fail PHẢI PHÁT clip. Xem §3.
6. **Badge từng track: GIỮ NGUYÊN 1 badge toàn cục, không tách.**
   Không viết thêm code tách; lý do B6 §4 vẫn đứng (preview là một
   canvas đã composite, không có làn riêng từng track). Xem §4.
7. Hồi quy: B5 5/5, B6 8/8, A6 12/12, Z6 10/10 — chạy lại được hết,
   fail 0 (§5). Không đụng file `.ts` nào nên không chạy lại tsc
   (như tiền lệ A5/B5).

## 1. Đo seek qua vòng sync preview thật (script sync-cap, mode sync)

Script: `apps/web/scripts/per-seek-probe-sync-cap-run.mjs` (của lượt
chạy trước, luồng này chỉ sửa lỗi socket chết ở §6 + chạy lại).
Lệnh (từ gốc repo; scratch/display/port riêng tránh đụng luồng khác):

```
node apps/web/scripts/per-seek-probe-sync-cap-run.mjs --mode sync \
  --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
  --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
  --dist ~/workspace/tmp-round47-c6/app-dist \
  --scratch ~/workspace/tmp-round47-c6/sync2 \
  --display :93 --port 4295 --bridge-port 4296
```

App thật: dist đóng băng bundle `index-D4oCKuDp.js`, server drip
64 KiB/s + endpoint treo + fast (cùng logic Z5/B5, nhật ký range:
16 request). Tải: loadavg đầu phiên `9.90 21.56 16.27`, cuối phiên
`2.14 15.19 14.55` (under-load — chạy cùng các luồng đợt 47 khác).
**Mọi số dưới đây đều under-load.** Evidence:
`~/workspace/tmp-round47-c6/sync2/sync-cap-evidence.json` +
`sync-cap-entries.json` (ngoài repo, không stage).

### 1.1 Bằng chứng seek do vòng sync tự lái (không gán trực tiếp)

- Seed project có 1 clip 30 s (asset flat 45 KB trong IDB, manifest
  ghi duration 30 — blob stand-in như script đã ghi rõ; mọi byte
  phát ra đều là fixture noise thật qua HTTP). Sau reload: pool
  fiber tìm đúng 1 instance MediaPool (`poolVideosSize: 1`), entry
  sau settle `[]` (không có seek nào trước scrub).
- Nút Proxy thật trong MediaBin (`.media-proxy`, label "Tạo proxy
  cho asset:a_a4ea20eb67bb6b21", text "Proxy 720p") bấm 2 lần:
  lần 1 fake bridge trả drip URL, lần 2 trả hang URL — cả 2 đều
  gắn vào pool element trong 1 s (`srcKey` thành
  `http://127.0.0.1:4296/api/proxy/file/c6-drip.mp4` /
  `c6-hang.mp4`, đúng nhánh `proxyUrl ?? url`).
- Scrub qua `.tl-ruler` pointer events thật (x = left + giây×60,
  mẫu B2): S1 scrub 25, S2 scrub 5, S3 scrub 20. Stack của cả 3
  entry đều qua `f`/`rM` ở bundle `84:13111` (Seeker) — không phải
  harness gán `currentTime` trực tiếp như B5.
- Nhật ký range khớp: sau seek 25, Chrome xin moov tail
  (419954688–419967520, 12,8 KB, fast) rồi range 351567872–…
  (~351 MB ≈ vị trí 25 s của file 420 MB/30 s); sau scrub 5 thì
  range 67207168–… (~67 MB ≈ vị trí 5 s). Seek đi đúng đường HTTP.

### 1.2 Kết quả từng entry sync (3 entry, validate: droppedOverflow 0)

| Entry | Seek | Giữ / dropped | Trạng thái | Ghi chú |
|---|---|---|---|---|
| k=0, el 0, target 25 (drip) | S1 | **0 / 0** | `completed` | Xem §1.3: "completed" là artifact fallback; vẽ thật sau 46 s |
| k=1, el 0, target 5 (drip) | S2 | **369 / 0** | `unresolved` | seeking thật ~13 s; loop abort ở 10 fail, drop + tạo element mới |
| k=2, el 1, target 5 (hang) | S2 retry trên element mới | **0 / 0** | `seeked-no-draw` | Element mới (sau recreate) cũng chốt bằng fallback, 522,8 ms |

- **S2 (k=1) là seek chậm thật duy nhất đo được qua vòng sync:**
  seeking quan sát được true, 369 mẫu trong ~13 s (mẫu đầu 4 ms
  sau khi gán, mẫu cuối ~13 s sau; tốc độ ~28 mẫu/s trung bình,
  thưa ~2/s trong 0,5 s đầu rồi dày ~60/s). `decodedFrames` giữ
  nguyên 4 suốt episode (không frame mới nào decode được).
  Vòng lặp đếm `seekFailureCount` lên 10 (`timeout`, target 5) →
  cạn cap (`seekFailureExhausted: true`) → drop element cũ khỏi
  pool (`seekElementRecreated: 1`, `seekRecreatedSeeking: 1`) →
  element mới (el 1) tạo lại qua `videoFor`. Probe chốt k=1
  `unresolved` lúc read (seeking vẫn true lúc đó).
- **S3 (scrub 20, hang): KHÔNG có entry mới.** Vòng lặp ghi
  `seekFailureTarget: 20`, count vẫn 10, exhausted vẫn true,
  recreated vẫn 1 — tức 10 lần thử seek 20 đều timeout mà KHÔNG
  lần nào gán `currentTime` (probe chặn ở prototype nên mọi lần
  gán đều bị ghi — 0 lần gán = không gán). Cơ chế (suy ra từ code
  preview.tsx ~2949–2990 + quan sát, không phải claim đo trực
  tiếp): sau khi cạn cap, vòng lặp giữ `lastRequested` + ngủ ở
  trạng thái lỗi; lần seek sau chỉ tạo element mới chứ không tự
  gán lại khi element mới vẫn kẹt seeking target cũ (k=2) — các
  lần thử timeout trước khi tới bước gán. Ghi rõ đây là suy luận
  từ quan sát + code, chưa có test đơn vị khóa hành vi này.
- Tổng phiên: 3 entry, `maxSamplesPerEntry = 369`,
  `maxDroppedSeekingSamples = 0`, `capHit = false`, app vẫn đáp
  evaluate sau seek kẹt.

### 1.3 Vì sao k=0 "completed trong 263 ms" là artifact (đọc kỹ)

- Probe chốt `seekedAtMs` bằng 2 đường: sự kiện `seeked` thật,
  hoặc rAF-fallback (`seeking==false` + `currentTime` đã tới
  target ở một tick rAF). k=0 dùng fallback: `seekedEvent: false`,
  `seekingSeen: false` (không một tick rAF nào thấy `seeking`
  true), `seekLatencyMs: 263,6`.
- Nhưng số đo độc lập cùng entry nói ngược lại: `decodedFrames`
  0 → 4 chỉ sau **firstDecodedAfterSeekAtMs = +24,9 s**,
  `firstDrawAfterSeekAtMs = +46,0 s` (`drawLatencyMs: 46003`),
  `decodedFramesAtFirstDraw = 4`. Vòng lặp cũng chỉ ghi
  `lastDrawn: 25` sau 49,8 s chờ (S1 `waitSec: 49.8`). Seek tới
  frame 25 trên drip 64 KiB/s thực chất mất ~46 s tới lúc vẽ —
  con số 263 ms chỉ là lúc `currentTime` đọc lại đã bằng 25
  trong khi seek còn đang hoãn (element chưa có metadata lúc gán:
  pool snapshot lúc gắn proxy ghi `duration: null`,
  `readyState: 0` — seek bị hoãn trước khi metadata về, cờ
  `seeking` không bật trong cửa sổ đó; rAF của probe dưới tải
  cũng thưa tới ~3,7 tick/s nên càng dễ trượt).
- Hệ quả phương pháp: **0 mẫu không chứng minh seek nhanh.**
  Entry k=0 là trường hợp probe mù (không thấy seeking) chứ không
  phải seek nhanh. Mọi trích dẫn phải kèm cả `firstDraw` /
  `firstDecoded`, không trích riêng `seekLatencyMs` khi
  `seekedEvent: false`.
- Đối chiếu k=2 (cùng artifact, nhẹ hơn): target 5 trên element
  mới, fallback sau 522,8 ms, 0 mẫu, `seeked-no-draw`,
  `currentTimeAtSeeked: 5` — cũng là chốt bằng fallback khi chưa
  có metadata, không phải seek thật 0,5 s.

### 1.4 Bound: vì sao trần 1000 không chạm được qua vòng sync (hiện tại)

- Mỗi lần seek thử của Seeker timeout sau **1,2 s**
  (`DEFAULT_SEEK_TIMEOUT_MS = 1200`, `apps/web/src/lib/seek.ts`
  L65/L129/L208); vòng lặp cạn cap sau **10 lần fail liên tiếp**
  (preview.tsx, `seekFailureAdvance`) rồi drop + tạo element mới.
  Một episode seeking liên tục trong vòng sync vì vậy tối đa
  ~10 × 1,2 s ≈ 12 s (+ overhead lập lịch; quan sát: ~13 s).
- Tốc độ mẫu tối đa của probe = tốc độ tick rAF ≤ 60/s (refresh
  màn hình). Bound trên: 13 s × 60 mẫu/s ≈ **780 mẫu < 1000** —
  ngay cả ở rAF tối đa, vòng lặp tự abort trước khi đủ 1000 mẫu.
  Quan sát: 369 mẫu ở ~28 mẫu/s dưới tải.
- Kết luận: **trần 1000 giữ đúng như lưới an toàn** (B5 đã đo
  1000/27 dropped trên đường gán trực tiếp), nhưng **qua vòng
  sync nó không phải giới hạn vận hành** — giới hạn vận hành là
  abort 10-fail của vòng lặp. Nếu ai đổi `DEFAULT_SEEK_TIMEOUT_MS`
  hoặc cap 10-fail thì phải đo lại bound này; số 369 không phải
  hằng số, nó phụ thuộc tốc độ rAF/tải của lượt chạy.

### 1.5 Hạn chế của lượt đo sync (ghi rõ)

- Filmstrip không chạy trong lượt sync: sau settle `entries: []`
  và tổng chỉ 3 entry (đều từ Seeker) — Timeline không capture
  thumbnail nào cho clip seed. Lý do (đọc code, chưa đo trực
  tiếp): `doCapture` trong Timeline.tsx tìm media bằng
  `m.name === src`, mà clip seed có `src: "asset:a_…"` trong khi
  item rehydrate mang tên file gốc — không khớp nên bỏ qua.
  Đây là artifact của seed, không phải kết luận về sản phẩm.
  Hệ quả: phép đối chứng "flat có duration hữu hạn thì target
  captureFrame ≠ 0" (dự định ở §2) KHÔNG thu được trong lượt này.
- Seed vẫn dùng blob stand-in flat 45 KB cho IDB (manifest ghi
  duration 30) như script đã ghi rõ từ lượt trước; mọi byte phát
  ra là fixture noise thật qua HTTP. Không giấu.
- Mọi số under-load; baseline quiet vẫn chờ cửa sổ yên từ main
  chat (nợ đứng từ nhiều đợt).

## 2. Nguồn gốc 4 entry k=0–3 của app — ĐÃ GHIM (mode origin)

Lệnh (từ gốc repo; profile mới, không seed):

```
node apps/web/scripts/per-seek-probe-sync-cap-run.mjs --mode origin \
  --dist ~/workspace/tmp-round47-c6/app-dist \
  --scratch ~/workspace/tmp-round47-c6/origin2 \
  --display :99 --port 4295 --bridge-port 4296
```

Kết quả: đúng 4 entry (k=0–3), xuất hiện trong khoảng +10 s →
+15 s sau khi load (đúng lúc `loadSample` xong ~10 s),
`counts: {seeked-no-draw: 4}`, bundle `index-D4oCKuDp.js`,
loadavg đầu `21.15 31.03 16.28`. Evidence:
`~/workspace/tmp-round47-c6/origin2/origin-evidence.json`.

| k | elId | target | latency | src (blob) |
|---|---|---|---|---|
| 0 | 0 | 0 | 92,3 ms | `…/041f7af5-…` |
| 1 | 1 | 0 | 108,8 ms | `…/041f7af5-…` (cùng URL với k=0) |
| 2 | 2 | 0 | 169,0 ms | `…/8db2310a-…` |
| 3 | 3 | 0 | 35,3 ms | `…/8db2310a-…` (cùng URL với k=2) |

Cả 4: `samples: 0`, `dropped: 0`, `seekedEvent: true`,
`currentTimeAtSeek(ed): 0`, `phase: "ready"`,
`flushElementReadyState: 0` (src đã gỡ lúc flush). Stack cả 4
chỉ có 1 frame ngoài probe: `QT` tại
`index-D4oCKuDp.js:58:45553`.

### 2.1 Chuỗi ghim (mức tin cậy từng mắt xích)

1. **QT = `captureFrame(url, atSec)` trong
   `apps/web/src/lib/thumbnails.ts` — CHẮC CHẮN.** Đọc code bundle
   quanh cột 45553 dòng 58: tạo `video`, `preload="auto"`,
   chờ `loadeddata`, seek tới `s = clamp(t, 0, duration-0.05)`,
   canvas 120×68 cover-fit, `toDataURL("image/jpeg", 0.72)` —
   khớp từng chi tiết `captureFrame` (kể cả `0.72` và cache key
   `` `${url}#t=${n.toFixed(1)}` `` ở hàm kề `Kk` =
   `getVideoThumbnail`). Không có hàm nào khác trong bundle khớp
   chuỗi này.
2. **Caller là filmstrip của Timeline — CHẮC CHẮN Ở MỨC CAO.**
   Chỉ Timeline.tsx import `thumbnails` (`getVideoThumbnail`,
   `getFilmstrip`). Project mẫu có 2 clip video, mỗi clip 4 s:
   `filmstripCount(4) = 2`, `filmstripTimestamps(0, 4) = [1, 3]` —
   đúng 2 lần capture mỗi URL, 2 URL (2 asset `mau-1/mau-2.webm`),
   tổng 4 entry; thời điểm +10–15 s khớp sau khi `loadSample`
   xong. Đường thumbnail đơn (`clipIn + duration/2 = 2`) chỉ
   chạy khi `stripCount <= 1`, không phải trường hợp này.
   `captureVideoThumb` trong media.ts (seek tới
   `min(0.5, duration*0.1)`) KHÔNG phải nguồn: project mẫu không
   đi qua `fileToMediaItem`, và target của nó không phải 0.
3. **Target = 0 vì duration không hữu hạn — SUY RA TỪ CODE +
   SỐ ĐO, chưa đọc trực tiếp `v.duration`.** Công thức target
   của captureFrame: duration hữu hạn > 0 thì target =
   `clamp(atSec, 0, dur-0.05)`; ngược lại target = 0. Mọi caller
   đều truyền `atSec > 0` (filmstrip: 1 và 3; thumb đơn: 2) nên
   target 0 ⟺ duration không hữu hạn tại lúc seek. Webm do
   MediaRecorder ghi không mang metadata duration nên Chrome báo
   duration Infinity (hành vi đã biết của Chrome) — đó là cơ chế
   khả dĩ nhất; NaN (metadata lỗi) cũng cho cùng target 0 nhưng
   mâu thuẫn với việc `loadeddata` đã bắn và seek thành công
   (`seekedEvent: true`, latency 35–169 ms).
4. **Không ảnh hưởng kết luận trần 1000** (như B5 đã ghi): 4
   entry này có 0 mẫu seeking, không phải pool element, không
   phải seek của vòng sync.

## 3. Compat app thật (script mới + 2 lần chạy)

Script mới: `apps/web/scripts/clicktest-round47-c6-compat-app-run.mjs`
(CDP pipe mẫu B6; serve dist tĩnh + `/media/flat.mp4` nhanh +
`/media/broken.mp4` 64 KiB byte rác xác định LCG — không có box
ftyp/moov). Hai phase trong một phiên Chrome, mỗi phase seed project
riêng (1 clip video `reverse: true`, 10 s) + reload:

```
node apps/web/scripts/clicktest-round47-c6-compat-app-run.mjs \
  --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
  --dist ~/workspace/tmp-round47-c6/app-dist \
  --scratch ~/workspace/tmp-round47-c6/compat2 \
  --display :94 --port 4297
```

### 3.1 Lần 1 (compat1, 5/12 PASS) — bài học, không giấu

- Phase A: badge `◀ NGƯỢC: WEBCODECS` hiện sau scrub (0,2 s);
  bấm nút lang thật → badge đổi sang en `◀ REVERSE: WEBCODECS`
  và về lại vi — **wiring đã đúng ngay lần 1**. Nhưng 2 check
  no-tick FAIL (ticks 3 → 5, `sleeping: false`) vì lúc bấm lang
  vòng lặp chưa ngủ (frame 5 chưa vẽ xong, `lastDrawn: null`).
- Phase B: poll badge failed **90 s lúc PAUSE, 14 nudge-scrub,
  badge kẹt `◀ NGƯỢC: WEBCODECS`** — FAIL cả 5 check phase B.
  Nguyên nhân (đọc code sau đó, preview.tsx L1120–1122 +
  drawTransport): nhánh pause/seek đặt `playing: false` nên
  `stepping = playing && (… || clip.reverse)` = false trong
  `drawVideoClip` → `reverseWebcodecsFrameFor` không được gọi →
  `controller.load()` không chạy → controller không bao giờ fail.
  Badge block tự nó tính `stepping` theo clip.reverse tại
  playhead (không cần playing) nên vẫn hiện WEBCODECS. **Lúc
  pause, badge failed không thể xuất hiện bằng footage hỏng —
  đây là tính chất của thiết kế, không phải controller khỏe.**
  Muốn controller fail PHẢI PHÁT clip (xem §3.2).

### 3.2 Lần 2 (compat2, 13/13 PASS) — bằng chứng app thật

Chrome thật, headed Xvfb :94, loadavg đầu `1.54 8.34 11.86`
(under-load). Evidence:
`~/workspace/tmp-round47-c6/compat2/compat-app-evidence.json`.

**Phase A — đổi lang qua nút TopBar, vòng lặp đang ngủ:**

| Check | Kết quả |
|---|---|
| A-drawn-and-sleeping | PASS — sau scrub 5, 1,0 s sau: `sleeping: true`, `lastDrawn: 5`, ticks 8 |
| A-badge-webcodecs-vi | PASS — badge `◀ NGƯỢC: WEBCODECS`, display block, nền `rgba(40,120,180,0.92)`, title đúng key `titleWebcodecs` vi |
| A-loop-sleeping-before-lang | PASS — ticks 8, sleeping true |
| A-lang-button-found | PASS — nút aria-label "Ngôn ngữ", text 🇻🇳, visible |
| A-lang-en-badge | PASS — sau 1 bấm nút: `◀ REVERSE: WEBCODECS` + title en đúng từng chữ |
| A-lang-no-tick-needed | PASS — **ticks 8 → 8** (effect `[previewLang]` refresh một mình, không tick nào chạy thêm) |
| A-lang-vi-again | PASS — bấm lại: về `◀ NGƯỢC: WEBCODECS` |

Đây là lần đầu wiring effect được chứng minh ở mức app đầy đủ:
nút TopBar thật → store lang đổi → effect `[previewLang]` trong
preview.tsx chạy → badge DOM đổi chuỗi, trong khi vòng lặp preview
đang ngủ (ticks đóng băng). B6 chỉ chứng minh được ở mức helper.

**Phase B — badge failed từ controller.failed thật:**

| Check | Kết quả |
|---|---|
| B-play-button-found | PASS — nút aria-label "Phát (Space)", pressed false |
| B-badge-failed-vi | PASS — sau khi bấm Phát clip ngược, badge lật sang `◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)` ngay ở lần poll đầu (≤ ~1 s sau khi phát, 0 nudge); nền `rgba(140, 90, 0, 0.92)` (amber) |
| B-badge-title-vi | PASS — title đúng key `titleElementFailed` vi từng chữ |
| B-lang-en-failed | PASS — sau tạm dừng + bấm nút lang: `◀ REVERSE: ELEMENT (WebCodecs decode failed)` + title en đúng từng chữ |
| B-lang-vi-again | PASS — bấm lại: về chuỗi failed vi |
| app-alive-after | PASS — app vẫn đáp sau cả 2 phase |

Ghi rõ: lần poll đầu tiên sau khi bấm Phát đã thấy failed nên
**không ghi được mốc trung gian "hiện WEBCODECS rồi mới lật"** —
flip xảy ra trong ~1 s giữa lúc bấm Phát và lần poll đầu (poll
mỗi 1 s). Không claim thứ tự đó; chỉ claim trạng thái cuối và
thời gian tới lúc quan sát được (≤ ~1 s sau khi phát).
Sau khi tạm dừng, vòng lặp vẫn churn (ticks 644 → 666 trong
1,5 s, `lastDrawn` nhảy 5 → 7,47 theo playhead) vì clip hỏng
không vẽ được — nên ở phase B KHÔNG assert đóng băng ticks
(tiền đề không đứng); wiring đổi lang vẫn được chứng minh bằng
text đổi + helper B6 (zero-tick) + phase A (ticks đóng băng).

## 4. Badge từng track: GIỮ NGUYÊN 1 badge toàn cục

Quyết định: **không tách**. Không viết thêm code, không claim tách.
Lý do B6 §4 vẫn đứng, đã kiểm chứng lại bằng đọc code preview.tsx
dòng ~2609–2680: badge block duyệt `spec.tracks` theo thứ tự và
`break` ở clip stepping đầu tiên có controller failed (hoặc clip
đầu tiên) — 1 badge duy nhất, không có vùng neo/làn riêng từng
track trên khung preview (preview là một canvas đã composite),
không có tên hiển thị cho track. Module thuần
`collectReverseTrackBadges` của B6 vẫn nằm đó, chưa được
preview.tsx gọi (cố tình — gọi mà không đổi render chỉ là code
chết). Khi nào preview có (1) vùng neo riêng, (2) nhãn track,
(3) plumbing pool N badge thì mới tách; trước lúc đó mọi claim
tách đều là mạo nhận.

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check` cho `per-seek-probe-sync-cap-run.mjs` (sau sửa
  socket) và `clicktest-round47-c6-compat-app-run.mjs` → pass.
- Hồi quy probe/compat (esbuild bundle `--format=esm`, chạy từ
  gốc repo, bundle ra `/tmp/c6-reg`):
  - B5 `per-seek-probe-pool-cap-46b5.test.mjs`: **5/5 pass**,
    fail 0.
  - B6 `reverseBadge46B6.test.ts`: **8/8 pass** (dòng tổng
    "B6 compat: 8/8 pass"), fail 0.
  - A6 `reverseBadge45A6.test.ts`: **12/12 pass** (dòng tổng
    "A6 badge: 12/12 pass"), fail 0.
  - Z6 `reverseCompat44Z6.test.ts`: **10/10 pass** (dòng tổng
    "Z6 compat: 10/10 pass"), fail 0.
- `npx tsc` không chạy lại: luồng này không đụng file `.ts` nào
  (chỉ `.mjs` + `.md`, như tiền lệ A5/B5) — không claim tsc cho
  đợt. Các file `reverse*.ts` trên đĩa có timestamp 07:08 là của
  luồng khác/lượt chạy trước — luồng này KHÔNG sửa chúng.
- Headed Chromium thật: origin2 (4 entry, ghim nguồn gốc §2),
  sync2 (§1), compat1 (5/12, bài học §3.1), compat2 (13/13,
  §3.2). App vẫn đáp evaluate sau mọi phiên.

## 6. Việc đã sửa ở file của luồng/lượt trước (ghi rõ)

1. `apps/web/scripts/per-seek-probe-sync-cap-run.mjs` — thêm
   kiểm tra liveness cho display tái dùng: socket X11 còn sót
   KHÔNG chứng minh Xvfb còn sống. Lần chạy sync đầu tiên của
   luồng này chết đúng vì tái dùng socket `:99` đã chết sau
   restart (Chrome báo "Missing X server or $DISPLAY", CDP
   timeout `Target.getTargets` sau 30 s). Nay chỉ tái dùng khi
   có tiến trình `Xvfb :NN` đang chạy; còn lại xóa socket chết
   rồi bật Xvfb mới. Logic đo không đổi (chỉ khúc khởi động
   Xvfb).
2. Lưu ý cho parent: trong lúc dọn socket chết, một lệnh `rm`
   đã xóa cả socket `:96` đang được luồng C2 dùng (Xvfb :96,
   pid 9892, vẫn sống — socket file bị unlink nhưng tiến trình
   + kết nối Chrome hiện tại của C2 không chết theo; chỉ các
   kết nối X11 MỚI tới :96 sẽ thất bại). Nếu C2 báo lỗi display
   thì nguyên nhân là đây, không phải code C2.

## 7. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. **Baseline quiet vẫn chờ** cửa sổ yên từ main chat: mọi số
   đợt này đều under-load (load đầu phiên 9,9–21,2; tốc độ rAF
   3,7–60/s). Không dùng số mẫu/timing này làm baseline quiet
   hay claim ngưỡng vận hành.
2. **Trần 1000 trên đường WebCodecs / Safari / máy thật /
   footage B-frame** vẫn chưa đo (nợ đứng chung từ A5/B5).
3. **Mốc trung gian WEBCODECS → failed** trong phase B chưa ghi
   được (flip ≤ ~1 s sau khi phát, nhanh hơn chu kỳ poll 1 s).
   Muốn ghi cần poll nhanh hơn hoặc hook vào controller.
4. **Cơ chế "10 lần thử seek 20 timeout mà không gán
   currentTime"** (§1.2) chỉ suy ra từ quan sát + code, chưa có
   test đơn vị khóa hành vi này.
5. **Filmstrip không chạy trong lượt sync** (§1.5): phép đối
   chứng target captureFrame trên file có duration hữu hạn chưa
   thu được; nguồn gốc k=0–3 vẫn đứng ở mức suy ra từ code +
   số đo (§2.1 mục 3), chưa đọc trực tiếp `v.duration`.
6. Safari/Firefox/máy thật/màn hình vật lý vẫn CHƯA ĐO (nợ từ
   A6/B6).

## 8. File đổi/thêm (chỉ của C6 — text, không binary, không dist)

Sửa:
1. `apps/web/scripts/per-seek-probe-sync-cap-run.mjs` — chỉ thêm
   kiểm tra liveness display (§6.1); phần còn lại của file là của
   lượt chạy trước cùng luồng (bị restart giết), luồng này chạy
   lại chứ không viết lại.

Mới:
2. `apps/web/scripts/clicktest-round47-c6-compat-app-run.mjs` —
   script compat app thật 2 phase (13/13 PASS ở lần 2; lần 1
   5/12 giữ làm bằng chứng bài học §3.1).
3. `docs/PHASE9_ROUND47_C6_PROBE_COMPAT_LIMITS.md` — tài liệu này.

Không đổi (ghi rõ để parent khỏi tìm): mọi file `.ts`
(`reversePlayback.ts`, `reversePreviewGate.ts`,
`reverseWebcodecs.ts`, `preview.tsx`, `seek.ts`, `store.ts`,
i18n, bridge), mọi file của luồng khác, paths-loop,
build-loop-log. Không push, không tag, không stage batch
(parent gộp).

Scratch ngoài repo (không stage):
`~/workspace/tmp-round47-c6/` — `app-dist/` (dist đóng băng dùng
chung), `origin1/` (lượt chạy trước chết, chỉ còn log),
`origin2/origin-evidence.json`, `sync1/` (lượt sync đầu chết vì
socket :99), `sync2/sync-cap-evidence.json` +
`sync-cap-entries.json`, `compat1/compat-app-evidence.json`
(5/12), `compat2/compat-app-evidence.json` (13/13).
