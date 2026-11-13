# PHASE9_ROUND99_A4_WATCHDOG_PAUSED_LIMITS — cơ chế lật `paused`: ĐÃ XÁC NHẬN

> Luồng A4, đợt 99. Nợ LIMITS gộp đợt 98 §4 mục 5 ("pipeline tự lật `paused`
> về false cần xác nhận thêm bằng log/strace").
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **A4 KHÔNG sửa file production nào** — chỉ thêm probe + tài liệu này.
> `preview.tsx` md5 lúc r1 bắt đầu `848d21c0`; r2/r3 ghi `mtimeChanged=false`
> (mọi thay đổi md5 trong lượt là của các luồng đợt 99 khác).

## 0. Verdict ngắn

- **Cơ chế lật `paused` ĐÃ XÁC NHẬN: app tự gọi `play()` — nhánh forward của
  `syncMedia` (`preview.tsx:4869,4888`, 2 điểm `void a.el.play()` khi `a.el.paused`),
  đi qua wrapper `play()` TẦNG INSTANCE của MediaPool
  (`media.ts:487-495`), gọi thẳng native `play()` đã bind từ trước nên
  **bypass hoàn toàn stub `HTMLVideoElement.prototype.play` của probe Z4**.
  Giả thuyết "pipeline WebKitGTK/GStreamer tự lật `paused`" của Z4 §4.1
  **BỊ BÁC làm cơ chế** — kết luận "21 lần lật không qua `play()` nào" của Z4
  là sai vì `playBlocks=0` chỉ đếm đường prototype, không thấy đường instance.
- **Bằng chứng ghép cặp 1:1, lặp lại 2 lượt độc lập: r2 17/17 flip, r3 11/11
  flip — mỗi flip đều có đúng 1 lệnh `play()` instance từ `syncMedia` kể từ
  lần re-pause trước; 0 flip không có play-call; 0 lệnh qua stub prototype.**
  Stack mọi lệnh đều là `syncMedia → tickInner → loop`, `pausedBefore=true`
  tuyệt đối.
- **Đối chiếu GST_DEBUG (GST_STATES:5, log 10,6–13,0 MB/lượt):** pipeline media
  (`blob-media-player-6`, playbin) trong cửa sổ freeze chỉ nhận **1 lệnh
  `set_state(PLAYING)` + 0 `PAUSED` (r2)** và **1 `PLAYING` + 1 `PAUSED`
  (r3)** — so với 17+17 / 11+11 lệnh JS `play()`/`pause()` cùng cửa sổ.
  Pipeline KHÔNG tự chuyển trạng thái 17/11 lần; các flip xảy ra ở tầng
  media-element/WebKit, do lệnh JS `play()` điều khiển. (Chi tiết + biên căn
  giờ xem §3.)
- **Nợ đợt 98 §4 mục 5: ĐÓNG** ở mức cơ chế đã xác nhận. Phần còn mở duy nhất:
  vì sao chỉ 1–2/17 lệnh `play()`/`pause()` tới được GStreamer dưới dạng
  `set_state` (WebKit hấp thụ toggle nhanh ở tầng element — chưa đọc code
  WebKit để khẳng định nội bộ; xem §5).
- Hệ quả thực hành: **mọi probe sau này stub `play()`/`pause()` PHẢI kiểm tra
  own-property instance trước** (`el.hasOwnProperty('play')`) — stub prototype
  đơn thuần là mù trước MediaPool. Deepstub của Z4 vẫn đúng như công cụ đo
  (chặn ở tầng property nên miễn nhiễm), nhưng lý do nó cần thiết nay đã rõ:
  không phải pipeline tự lật, mà là app play() lại mỗi tick qua wrapper
  instance.

## 1. Phát hiện then chốt: wrapper instance của MediaPool

`apps/web/src/media.ts:487-495` (`videoFor`, chạy lúc tạo element — tức lúc
seed/import, TRƯỚC khi probe cài stub prototype ở `INSTALL_SAMPLER`):

```ts
const origPlay95W2 = el.play.bind(el);   // bắt native play TRƯỚC stub
const origPause95W2 = el.pause.bind(el);
el.play = () => {
  el!.dataset.playIntended95W2 = "1";
  return origPlay95W2();                  // gọi thẳng native, qua mặt stub prototype
};
el.pause = () => {
  el!.dataset.playIntended95W2 = "";
  origPause95W2();
};
```

Hệ quả: mọi `a.el.play()` trong app (`preview.tsx:4869,4888` — nhánh forward
`syncMedia`: `else if (a.el.paused) void a.el.play()`; và `media.ts:574,694`
retry-play) đều đi qua own-property này. Probe Z4 stub
`HTMLVideoElement.prototype.play` nên `playBlocks` mãi = 0 dù app gọi
`play()` mỗi tick — đó là lý do Z4 kết luận sai "không qua `play()` nào".

Kiểm chứng trên element bị freeze (ghi trong `freezeLog` mỗi lượt):
`ownPlay=true`, `ownPause=true`, `instancePlayIsNative=false`,
`instancePlayIsStub=false`, `playDesc="value-function"` — cả r2 lẫn r3.

## 2. Hai lượt đo — ghép cặp flip ↔ play-call

Harness: copy `probe98z4` → `apps/web/scripts/probe99a4-watchdog-paused.mjs`
(+ instrumentation A4, marker "Đợt 99 A4"): bọc đếm `el.play` tầng instance
(chỉ đếm, không chặn; ghi stack + `pausedBefore` + wall time), ghi flip-event
`paused` true→false kèm số play-call kể từ lần re-pause trước, GST_DEBUG
`GST_STATES:5,playbin:5` ra `gst.log`. Mode `repause`, freeze 2500 ms,
config scroll-blur, WebKit 27.2, `--state-ms 50`. Chạy tuần tự, 1 instance.

| | r2 (`wk-paused-r2`) | r3 (`wk-paused-r3`) |
|---|---|---|
| Load lúc phát | 3,28 (chờ yên 120 s, hết chờ mới phát) | 16,48 (hết 120 s chờ, vẫn phát — nhiễm tải, ghi rõ) |
| Trigger | bắn: pausedAt relPlay 4662, frozenCt 0,500, ph 3,367 | bắn: pausedAt relPlay 15892, frozenCt 0,933, ph 3,867 |
| play-call instance (syncMedia) | **17** | **11** |
| flip `paused` true→false | **17** | **11** |
| flip có ≥1 play-call từ lần re-pause trước | **17/17** | **11/11** |
| flip KHÔNG có play-call | **0** | **0** |
| play qua stub prototype (`playBlocks`) | 0 | 0 |
| `repauseCount` | 17 | 11 |
| Gap flip − play-call gần nhất | 46–180 ms (lag quan sát do timer throttle) | 129–310 ms (tải nặng hơn) |
| Khoảng cách giữa các play-call | 88–399 ms (nhịp tick dưới tải) | 131–312 ms |
| `pausedBefore` của mọi play-call | true (11/11 và 17/17) | true |
| Stack play-call | `syncMedia@preview.tsx:2323:29` (13) / `:2333:25` (4) → `tickInner` → `loop` | `syncMedia@preview.tsx:2343:29` (11/11) → `tickInner` → `loop` |
| `pageErrs` / `mtimeChanged` | 0 / false | 0 / false |

(Số dòng preview.tsx trong stack là của bundle dev đã transform — 2 điểm gọi
`play()` trong source là `preview.tsx:4869` và `:4888`; r2 thấy cả 2 điểm,
r3 chỉ thấy 1 điểm — không có ý nghĩa cơ chế, chỉ là nhánh nào bắn tick đó.)

Đọc đúng: mỗi tick `syncMedia` thấy element đang `paused` (do probe vừa pause)
thì gọi `play()` qua wrapper instance → element lật sang playing → timer giữ
của probe (5 ms danh nghĩa, hiệu dụng ~100–300 ms dưới tải) quan sát thấy và
pause lại. Chu trình lặp đúng nhịp tick — khớp con số 21 lần lật/tick của Z4 r2.
Giả thuyết "task `play()` đã queue từ lúc clip entry chạy muộn" cũng bị bác:
stack là tick `syncMedia` đang chạy, không phải task cũ; các lệnh xảy ra xuyên
suốt cửa sổ freeze, mỗi tick một lệnh.

### 2.1 Cú nhảy ct 0,500 → 1,033 ở r2 là seek, không phải rò phát

`freezeTrace` r2: ct giữ 0,500 ở 3 mẫu đầu, nhảy 1,033 đúng mẫu có
`seeking=1` (t=5249; `seeking=1` kéo dài 5249–5443 rồi về 0), sau đó đứng yên
1,033 tới resume. Đó là **drift re-seek của `syncMedia`** (playhead đã tiến,
target lệch > ngưỡng nên seek element tới ~1,03), không phải element phát rò
0,53 s trong 88 ms. R3 không có cú nhảy nào (ct đứng 0,933 suốt 11 flip).
Ghi rõ để đợt sau không đọc nhầm thành "play-through leak" như Z4 r2 từng
nghi (rò ~3 frame).

### 2.2 Lượt r1: trigger không bắn (đã sửa)

`wk-paused-r1`: `done=false`, `eligibleSeen=0`, `watchChecks=185` — cùng lỗi
như Z4 r4 (watcher thưa ~350 ms/lần dưới tải 10–15, cửa sổ ct<1,0 + playhead
3–6 quá hẹp). **Đã sửa trong probe A4** theo gợi ý Z4 §4.3: nới playhead tới
c2 (3–9) và ct<2,0. Sau sửa: r2 (`eligibleSeen=6`, 44 checks) và r3
(`eligibleSeen=4`, 46 checks) đều bắn ngay. Không dùng r1 cho kết luận cơ chế.

## 3. Đối chiếu GST_DEBUG — pipeline không tự lật

Phương pháp: `GST_DEBUG=GST_STATES:5,playbin:5`, `GST_DEBUG_FILE=<scratch>/gst.log`
(đã kiểm chứng trước bằng `gst-launch-1.0` rằng category `GST_STATES` ghi
`set_state` kèm timestamp tương đối từ lúc init GStreamer trong WebProcess).
Căn giờ GST ↔ wall: lấy lệnh `PLAYING` đầu tiên của pipeline media làm neo
≈ lúc bấm phát (play-start wall trong log driver; pipeline trước đó ở PAUSED
từ lúc tạo). Sai số neo ước ±1–2 s (lag phát dưới tải) — vẫn đủ vì kết luận
dựa trên ĐẾM trong toàn lượt, không dựa vào căn giờ chính xác từng lệnh.

Pipeline media xác định bằng tên: `blob-media-player-6` (playbin) + con
`uridecodebin3`, `playsink`, `vbin`, `webkitvideosink6` (không có element nào
tên `playbin` trong log — WebKit đặt tên riêng).

| | r2 | r3 |
|---|---|---|
| `set_state` của pipeline media, cả lượt | 5 PLAYING, 4 PAUSED (+READY/NULL lúc tạo/hủy) | 6 PLAYING, 5 PAUSED |
| Trong cửa sổ freeze (neo ±2 s) | **1 PLAYING (GST 131,524) + 0 PAUSED** | **1 PLAYING (GST 148,378) + 1 PAUSED (GST 148,855)** |
| Lệnh JS cùng cửa sổ | 17 play() + 17 pause() | 11 play() + 11 pause() |
| GST log | 63.701 dòng / 10,6 MB | 77.889 dòng / 13,0 MB |

Kết luận GST: pipeline chỉ chuyển trạng thái 1–2 lần trong cửa sổ freeze,
không phải 17/11 lần. **Các flip `paused` không phải là chuyển trạng thái
pipeline.** Chúng xảy ra ở tầng media-element (cờ `paused` của element lật
theo lệnh JS `play()`), trong khi pipeline GStreamer phần lớn giữ nguyên
trạng thái / hấp thụ toggle nhanh. Nhiễu nền: pipeline snapshot
`video-frame-converter` (appsrc1/videoscale1/videoconvert1/appsink8 + pipeline
không tên `<>`) ghi ~35 lệnh PAUSED mỗi 2,5 s ĐỀU ĐẶN suốt lượt (124–138 s
GST) — là churn nền của đường snapshot, không liên quan freeze; đừng đọc
nhầm thành flip.

Caveat GST (ghi rõ, không giấu): (a) neo giờ ±1–2 s — nhưng dù dịch cửa sổ
±2 s, số lệnh PLAYING/PAUSED của pipeline media trong vùng vẫn ≤3, xa dưới
17/11; (b) `GST_STATES` chỉ ghi lệnh `set_state` được GỌI, không ghi trạng
thái hoàn tất (lệnh ASYNC có thể hoàn tất muộn) — nhưng chính vì thế mà nó
là bằng chứng đúng cho câu hỏi "pipeline có được RA LỆNH chuyển trạng thái
không": câu trả lời là gần như không; (c) danh tính pipeline suy từ tên
element (`blob-media-player-6`/`uridecodebin3`/`playsink`), không phải từ
WebKit source — đủ cho đối chiếu đếm, chưa đủ cho khẳng định kiến trúc.

## 4. Kiểm chứng

- **Không sửa production.** Chỉ thêm/sửa: probe A4 + tài liệu này. `preview.tsx`
  md5 đầu r1 `848d21c0dbf7055983149cd7c5778def`; r2/r3 `mtimeChanged=false`.
- Probe mới: `node --check` OK. 3 lượt chạy tuần tự, 1 instance/lượt, dọn
  process sau mỗi lượt (không process mồ côi nào còn lại — `psOther` chỉ còn
  tiến trình các luồng đợt 99 khác).
- tsc / vite build / test suite KHÔNG chạy lại: A4 không đụng code production
  hay test (chỉ script probe độc lập + doc); cây đang bị các luồng đợt 99 khác
  sửa song song nên số đo tsc trên cây lúc này không thuộc về A4 — để luồng
  kiểm chứng gộp đợt 99 (Z10-equivalent) đo trên cây đã gộp.
- Analyzer đối chiếu: `hidden_files/round99-a4/analyze99a4.mjs`
  (`node analyze99a4.mjs wk-paused-r2|wk-paused-r3`) — tái tạo toàn bộ số
  §2–§3 từ JSON + gst.log trên đĩa (không nằm trong batch repo).
- Dữ liệu thô: `hidden_files/round99-a4/wk-paused-r1/` (trigger fail),
  `wk-paused-r2/`, `wk-paused-r3/` — mỗi thư mục có `frame-parity-results.json`,
  `frame-parity-log.txt`, `gst.log`, `gst-summary.json`.

## 5. Nợ còn lại cho đợt sau

1. **Vì sao chỉ 1–2/17 lệnh `play()`/`pause()` tới được GStreamer?** Chưa đọc
   code WebKit (`MediaPlayerPrivateGStreamer::play/pause`, `changePipelineState`)
   để khẳng định nội bộ — có thể WebKit chỉ ra lệnh `set_state` khi trạng
   thái hiện tại/đang chờ khác mục tiêu, hoặc toggle nhanh bị gộp. Cần đọc
   source WebKitGTK (phiên bản đúng với Playwright webkit-2388 / WebKit 27.2)
   hoặc debug build mới kết luận — ngoài phạm vi probe page, không ảnh hưởng
   sản phẩm (chỉ ảnh hưởng fault-injection và hiểu biết nội bộ).
2. **Bài học phương pháp (áp dụng cho mọi probe sau):** stub `play()`/`pause()`
   phải kiểm tra own-property instance trước; nếu element có wrapper instance
   thì bọc/đếm ở tầng instance. Các kết luận cũ dựa trên `playBlocks` (stub
   prototype) cần xem lại nếu element đó qua MediaPool — Z4/Y5 đều dính.
3. **Trigger injection còn mỏng dưới tải:** r1 `eligibleSeen=0` dù đã nới;
   watcher 16 ms bị throttle tới ~350 ms. Đợt sau nếu cần trigger chắc hơn thì
   dùng state100 làm nguồn quan sát thay vì watcher tự poll (Z4 §4.3 đã gợi ý).
4. **Không làm gì thêm với freeze-kill:** cơ chế đã rõ, deepstub vẫn là công cụ
   đo đúng; không đưa shadow property vào production; không đụng TTS 39,
   không thử birefnet (theo luật đợt).

## 6. Batch đã stage (KHÔNG push)

- `phase9-round99-a4-watchdog.txt` — 2 entry, read-back OK (NUL-delimited,
  0 binary, 0 workflow):
  - `docs/PHASE9_ROUND99_A4_WATCHDOG_PAUSED_LIMITS.md` (file này)
  - `apps/web/scripts/probe99a4-watchdog-paused.mjs` (probe A4: bọc đếm
    play() tầng instance + flip-event + GST_DEBUG GST_STATES:5 ra file;
    trigger đã nới playhead 3–9 / ct<2,0)
- Analyzer + JSON + gst.log ở `hidden_files/round99-a4/` (không nằm trong
  repo nên không đưa vào batch).
