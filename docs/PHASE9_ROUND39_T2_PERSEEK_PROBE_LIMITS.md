# Phase 9 đợt 39, luồng T2 — Probe per-seek cho harness N2 — LIMITS

Ngày: 03/11/2026 (giờ +07). KHÔNG push, KHÔNG release/tag, KHÔNG
binary, KHÔNG dist vào batch. Luồng này CHỈ đụng harness N2 + 3 file
mới của chính nó (§7); không sửa preview.tsx, cổng v2/v3, probe Q6,
runner solo, hay file của luồng khác trong đợt 39. Mọi claim dưới đây
đều có test/số đo thật kèm theo; chỗ nào là mô phỏng hoặc chưa đo
thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn

1. **Probe per-seek đã cài thật vào harness N2** theo thiết kế U6 §3.3
   (trước đợt này chỉ là spec trên giấy): ghi đúng 17 trường §3.3 cho
   mỗi lần gán `currentTime` trong phase ngược, kèm summary + nhãn cơ
   chế mô tả. Mặc định TẮT (`N2_PERSEEK` không đặt → không cài gì vào
   trang, đường đo cũ không đổi); bật bằng `N2_PERSEEK=1`.
2. **Phiên headed thật đã chạy với probe bật** (không phải chỉ test VM):
   24 entries, trong đó 8 reverse; 24/24 entry validate sạch qua module
   phân tích. Đây là bằng chứng chức năng, KHÔNG phải baseline quiet
   (phiên này under-load cuối lượt, verdict PARTIAL — xem §4).
3. **Tín hiệu cơ chế đầu tiên (chưa phải kết luận):** 6 seek ngược hoàn
   tất có seekLatency trung vị 1604 ms nhưng drawLatency trung vị chỉ
   7 ms, decoded nhảy 10–29 frame TRONG lúc seek (từ lúc gán tới lúc
   seeked) và đứng yên từ seeked tới firstDraw. Nút thắt nằm bên trong
   quá trình hoàn tất seek, không nằm ở presentation sau seeked — nhưng
   mẫu này KHÔNG khớp sạch dự đoán nào trong §3.3 (xem §4.2), và cần
   probe v2 lấy mẫu decoded TRONG lúc seek mới tách được seek-scheduling
   khỏi decode stall.
4. **Phiên solo T1 CHƯA dùng được probe này ngay** (§5): cần thêm 3 việc
   nhỏ (truyền cờ qua Q6/solo, sửa chuỗi "absent" hardcode trong solo
   runner, chạy phiên quiet thật) + 2 việc probe v2 (elementId, lấy mẫu
   decoded trong lúc seek). Tới khi đó, solo vẫn khóa được A/B nhưng
   claim cơ chế vẫn phải ghi là "chưa đủ bằng chứng".

## 1. Thiết kế §3.3 đối chiếu từng điểm (trung thực: spec thiếu gì)

§3.3 chốt tên trường + 3 dự đoán phân biệt, nhưng THIẾU các điểm sau
— T2 đã phải tự quyết định vận hành, và mọi quyết định đều ghi rõ ở
đây + trong comment đầu file trang, để luồng sau không đọc chúng như
một phần của spec gốc:

| Điểm §3.3 thiếu | Quyết định vận hành của T2 (không phải spec gốc) |
|---|---|
| "Một bước seek" là gì? | Một lần gán `el.currentTime` trong lúc probe bật. Seek bị gán đè không bị ghi đè lặng lẽ: chốt `superseded` (chưa seeked) hoặc `seeked-no-draw` (đã seeked, chưa draw). |
| Hook vào đâu? Harness N2 trước đây chỉ sample 0,5 s, không theo dõi element | Chặn setter `currentTime` trên `HTMLMediaElement.prototype`. Bắt buộc vì pool video của MediaPool tạo element tách khỏi DOM (querySelector không tìm được). |
| `firstDrawAfterSeek` đo bằng gì? | Tick rAF ĐẦU TIÊN sau seeked mà element đủ điều kiện vẽ (readyState>=2 và currentTime vẫn ở frame đã seeked). Đây là "đủ điều kiện vẽ", KHÔNG phải bằng chứng canvas drawImage đã chạy cho element đó — harness không nhìn được drawVideoClip trong preview.tsx. Trường `firstDrawBasis="raf-eligible"` ghi rõ điều này trong từng entry. |
| `seekedAtMs` lấy từ đâu? | Ưu tiên sự kiện `seeked` thật (listener gắn 1 lần/element). Nếu sự kiện không tới mà rAF thấy seeking=false và currentTime đã tới target thì chốt bằng rAF, `seekedEvent=false` — lúc đó seekLatency mang thêm tối đa ~1 khoảng rAF sai số quan sát. |
| Trạng thái đoạn (segment) là gì? | Entry chỉ ghi `targetTime` + `phase`. Module Node nhóm theo đoạn CHỈ khi harness truyền `N2_PERSEEK_GOP_SEC` (GOP đều, vd sparse-gop 300 frame @30fps → 10 s). Với footage GOP không đều, "segment" chỉ là khoảng thời gian mô tả, không phải chỉ số GOP thật. |
| Ngưỡng "phình" là bao nhiêu? | 100 ms (~3 frame @30fps), heuristic mô tả trong `per-seek-probe.mjs`, KHÔNG phải cổng nhận/loại. Nhãn cơ chế chỉ tóm tắt số thô, không thay số thô. |
| Đường WebCodecs reverse? | KHÔNG được probe này thấy (không gán currentTime). Entries rỗng trên đường đó là đúng, không phải lỗi probe. |
| Element nào, khi nhiều element? | **GAP (xem §4.3):** entry chỉ có `elementKind` (video/audio), KHÔNG có elementId. Phiên live đã gặp đúng trường hợp này (entry 16 vs 17). |

Trường mở rộng ngoài §3.3 (ghi rõ để không bị đọc là spec):
`firstDecodedAfterSeekAtMs` (tick rAF đầu tiên decoded tăng sau seeked),
`decodedFramesAtFirstDraw`, `decodedDeltaToFirstDraw`, `phase`, `status`,
`elementKind`, `seekedEvent`, `firstDrawBasis`. Cần `firstDecoded` vì
§3.3 tách decode/presentation bằng "decoded tăng ngay sau seeked" —
không có timestamp decode riêng thì không kiểm tra được dự đoán đó.

## 2. Cái gì đã cài (cách hoạt động + cách bật/tắt)

- `apps/web/scripts/per-seek-probe-page.js` (mới, nguồn sự thật duy
  nhất cho logic ghi trong trang): định nghĩa `window.__n2PerSeek`
  khi được evaluate; `install({fps})` chặn setter prototype + chạy vòng
  rAF riêng; `mark(phase)` gắn nhãn phase (`ready`/`forward`/`reverse`/
  `idle`); `read()` là cuối phiên (flush pending thành `unresolved` /
  `seeked-no-draw`, dừng vòng rAF, trả entries + marks + counts);
  `setEnabled(false|true)` tạm dừng/tiếp tục ghi trong phiên đã install.
  Mọi callback probe đều try/catch riêng để probe không bao giờ phá
  playback thật; setter wrapper LUÔN gọi setter gốc kể cả khi ghi lỗi.
  Giới hạn: tối đa 5000 entry/phiên, vượt thì bỏ seek mới và tăng
  `droppedOverflow` (phiên live: 0).
- `apps/web/scripts/per-seek-probe.mjs` (mới, thuần Node): 17 trường
  spec + validate (`validatePerSeekEntry`, kiểm tra latency = hiệu
  timestamp ±1 ms, đơn điệu requested ≤ seeked ≤ firstDraw),
  `mechanismLabel` (seek-scheduling / decode-stall / presentation-draw
  / fast / mixed / undetermined theo §1), `summarizePerSeek`
  (median/p95/max seek+draw latency, đếm theo status/phase/cơ chế,
  nhóm theo đoạn khi có GOP giây), `gopIndexFor`, `reverseEntries`.
- Harness N2 (`clicktest-round31-n2-reverse-fps-pipe.mjs`, sửa đúng
  các hunk đánh dấu "Phase 9 đợt 39 T2"): import module phân tích;
  `N2_PERSEEK=1` bật, `N2_PERSEEK_GOP_SEC` tuỳ chọn; install probe sau
  probe rAF; mark phase tại ready/forward/idle/reverse/idle; đọc probe
  sau mark idle cuối và ghi vào `forward-hold.json`:
  `perSeekEnabled` (bool) + `perSeek` (null khi tắt; khi bật gồm
  entries thô, marks, counts, `summaryAll`, `summaryReverse`).
  Khi tắt, harness không evaluate code trang của probe — zero overhead
  ngoài 2 field JSON mới (`perSeekEnabled`, `perSeek: null`).
- Cách chạy phiên có probe (từ gốc repo, scratch/display/port riêng
  để khỏi đụng luồng khác):
  `N2_SCRATCH=<scratch> K4_VIDEO=<fixture> K4_DISPLAY=:99 K4_PORT=4199
  N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10 node
  apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`

## 3. Kiểm chứng đã chạy (số thật)

- `node --check` pass cả 4 file: probe trang, module phân tích, test
  mới, harness N2 đã sửa.
- Test mới `per-seek-probe.test.mjs`: **10/10 pass, 0 fail**
  (element + rAF + clock giả trong vm, timestamp xác định tới ms):
  chưa install thì không ghi; vòng đời seek đầy đủ đúng 17 trường §3.3
  với latency = hiệu timestamp (seek 16 ms, draw 16 ms, rafTicks 2);
  fallback webkitDecodedFrameCount; seek bị gán đè → superseded;
  read() flush → unresolved (latency null, validate vẫn đạt);
  setEnabled tắt/mở lại; validate bắt latency sửa tay; mechanismLabel
  khớp cả 3 dự đoán U6 + fast + undetermined; gopIndex/summary nhóm
  đúng đoạn GOP 10 s; phiên mẫu MÔ PHỎNG (không phải số Chrome thật)
  3 seek fast ở GOP 20–30 s + 3 seek decode-stall ở GOP 10–20 s →
  summary tách đúng (segment 2: fast 3; segment 1: decode-stall 3).
- Test cũ liên quan: `seek-ab-gate-v3.test.mjs` +
  `seek-ab-solo-run.test.mjs` → **24/24 pass, 0 fail** (harness sửa
  không phá cổng/solo).
- Downstream bỏ qua field mới: copy 1 forward-hold.json cũ (R1
  retry-a1) sang /tmp, gắn thêm `perSeek` giả, chạy Q6 classify và
  gate v3 verify-solo → cả hai exit 0, phân loại như cũ (under-load
  theo load/rAF, không bị field mới làm lệch). File kiểm chứng nằm ở
  /tmp, không đưa vào repo.
- **Phiên headed thật với probe bật** (xem §4): chạy 03/11, display
  :99 / port 4199 / scratch /tmp/vcut-t2-perseek-live, fixture
  sparse-gop-noise.mp4, dist trên đĩa snapshot đầu lượt
  (index-CDz_yNSq.js, đủ dấu K4). Probe install `defined`/`installed`,
  ghi được entries thật; file forward-hold.json của phiên nằm ở
  scratch ngoài repo (không đưa vào batch).

## 4. Phiên headed thật: số đo + đọc trung thực (KHÔNG phải baseline)

Phiên này under-load về cuối (load 0,33 → 7,14; tốc độ xuôi nội suy
0,821; fps ngược 0,27; verdict N2 PARTIAL: reverseOk=false,
holdOk=true) nên mọi số dưới đây chỉ chứng minh probe hoạt động và
gợi ý hướng điều tra, KHÔNG được trích làm baseline quiet hay claim
fps/cơ chế dứt khoát.

### 4.1 Tổng quan entries

- 24 entries: ready 1, forward 15, reverse 8. Trạng thái: completed 8,
  superseded 7, unresolved 9. droppedOverflow 0. 24/24 entry validate
  sạch qua `validatePerSeekEntry` (chạy lại bằng module Node trên
  chính file forward-hold.json của phiên).
- Forward 15 entry là nhiễu ngoài phạm vi: forward phát bằng play()
  nhưng syncMedia vẫn re-seek khi drift, cộng seek của Seeker khi
  pause — chuỗi superseded target tăng dần 2,8 → 5,5 s là đúng dạng
  re-seek dưới tải. Phân tích cơ chế PHẢI lọc `phase === "reverse"`.
- Entry ready duy nhất (target 0,5, unresolved) là seek thumbnail của
  captureVideoThumb: element bị gỡ src trước khi seek hoàn tất nên
  không bao giờ resolve — hành vi đúng của probe, không phải bug.

### 4.2 Seek ngược: nút thắt nằm trong lúc hoàn tất seek

6 seek ngược hoàn tất (segment 20–30 s, GOP đều 10 s):

| k | target | seekLatency | drawLatency | decoded gán→seeked | delta tới draw |
|---|---|---|---|---|---|
| 17 | 29,2 | 1500,6 ms | 0,9 ms | 55 → 65 | 0 |
| 18 | 27,633 | 1706,8 ms | 8,9 ms | 65 → 88 | 0 |
| 19 | 25,833 | 2302,6 ms | 8,6 ms | 88 → 117 | 0 |
| 20 | 23,5 | 1463,3 ms | 0 ms | 117 → 136 | 0 |
| 21 | 22,033 | 680,4 ms | 12,7 ms | 136 → 141 | 0 |
| 22 | 21,3 | 2675,6 ms | 5,4 ms | 141 → 154 | 0 |

Trung vị: seekLatency 1603,7 ms; drawLatency 7 ms. Nhãn module cho cả
6 là `mixed` — và đó là kết quả ĐÚNG, không phải lỗi nhãn: mẫu này
không khớp sạch dự đoán nào của §3.3. Dự đoán 1 đòi "decoded tăng
ngay SAU seeked", nhưng ở đây decoded tăng TRƯỚC seeked (trong lúc
seek, 10–29 frame mỗi seek — đúng chi phí giải mã lại từ keyframe của
GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa']) và draw gần như tức thì sau seeked. Hệ quả quan trọng cho
mọi luồng sau: **với element seek, sự kiện seeked chỉ bắn khi frame
đã sẵn, nên decode stall và seek-scheduling KHÔNG tách được bằng cặp
seeked/draw** — cần lấy mẫu decodedFrames TRONG lúc seek (mỗi tick
rAF khi seeking=true) thì mới thấy decode tiến triển hay đứng yên
trong lúc chờ seeked. Đây là việc của probe v2, không bịa thêm ở đây.
Presentation/draw sau seeked thì đã loại trừ được trên mẫu này
(drawLatency ≤ 12,7 ms, rAF ngược vẫn đều: gapP50 0,0026 s).

### 4.3 Hai entry ngược chưa hoàn tất — và gap elementId

- Entry 23 (target 18,633): seek đang bay khi phase ngược dừng → flush
  `unresolved` ở read(). Đúng thiết kế (phiên dừng giữa seek).
- Entry 16 (target 28,5, requested 272 ms sau mark reverse, 391 tick
  rAF, KHÔNG bao giờ hoàn tất, KHÔNG bị supersede bởi entry 17):
  entry 17 (target 29,2) hoàn tất bình thường ngay sau đó. Nếu cùng một
  element, entry 17 phải supersede entry 16 (luật recordSeek) — việc nó
  vẫn `unresolved` tới read() chứng tỏ hai entry thuộc HAI element
  video khác nhau (ứng viên: element thumbnail/filmstrip của
  thumbnails.ts cũng tạo video element, hoặc một element bị gỡ src),
  HOẶC seek của entry 16 bị bỏ theo cách probe chưa ghi được. Probe v1
  không có elementId nên KHÔNG phân biệt được hai giả thuyết này —
  đây là gap phải sửa ở v2 (WeakMap đếm id/element + ghi src/readyState
  lúc flush unresolved), và mọi phân tích từ phiên này phải ghi rõ
  entry 16 chưa quy được về element.

## 5. Nợ mở — đặc biệt: phiên solo T1 dùng được probe này chưa?

**Chưa, cần thêm các việc sau (đều nhỏ, nhưng chưa làm trong luồng
này vì nằm ngoài file được giao):**

1. **Truyền cờ:** solo runner spawn Q6 với `env = {...process.env,
   Q6_*}` nên `N2_PERSEEK=1` đặt ở môi trường ngoài sẽ chảy qua Q6
   (Q6 cũng spread process.env khi spawn N2) tới N2 mà không cần sửa
   Q6 — nhưng điều này CHƯA được kiểm chứng bằng một lượt solo thật,
   chỉ đọc code. Cần 1 lượt solo khô xác nhận `forward-hold.json`
   của lượt đó có `perSeekEnabled: true`.
2. **Sửa chuỗi hardcode:** `seek-ab-solo-run.mjs` dòng ~520 hiện ghi
   cứng `perSeekProbe: "absent — harness N2 hiện không ghi..."` vào
   JSON mỗi lượt solo. Khi probe bật, chuỗi này thành SAI. Luồng sở
   hữu solo runner cần đổi thành: copy `perSeek`/`summaryReverse` từ
   forward-hold.json của lượt (khi có) và chỉ ghi "absent" khi
   `perSeekEnabled` là false. Tương tự, Q6 labeled hiện chỉ pick field
   cũ nên perSeek không lọt vào labeled — cần copy tường minh nếu
   muốn labeled mang theo bằng chứng cơ chế.
3. **Chạy phiên solo quiet thật:** probe mới chỉ có 1 phiên headed
   under-load (§4). Phiên solo phải chạy khi máy yên (dry-run exit 0,
   đúng protocol T1 §4), với `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10`,
   rồi mới đọc summaryReverse để đối chiếu cơ chế.
4. **Probe v2 (trước hoặc trong phiên solo nếu muốn claim cơ chế):**
   (a) elementId cho mỗi entry + ghi src/readyState lúc flush
   unresolved (đóng gap §4.3); (b) lấy mẫu decodedFrames/droppedFrames
   mỗi tick rAF TRONG lúc seeking (đóng gap §4.2 — tách seek-scheduling
   khỏi decode stall); (c) hook cho đường WebCodecs reverse nếu muốn
   đo cả đường đó (hiện probe mù với nó).
5. **Chưa đo:** đường đo mặc định TẮT chưa có phiên headed riêng (chỉ
   chứng minh bằng code: khi tắt không evaluate code probe; và test cũ
   24/24 vẫn xanh). Rủi ro thấp nhưng nếu cần chặt thì chạy 1 lượt N2
   mặc định và đối chiếu shape JSON cũ trước khi khóa phiên solo.

## 6. Giới hạn khác (trung thực)

- `firstDrawAfterSeekAtMs` là "đủ điều kiện vẽ", không phải bằng chứng
  canvas đã vẽ frame đó (§1). Muốn bằng chứng draw thật cần hook trong
  drawVideoClip của preview.tsx — nằm ngoài phạm vi luồng này và
  thuộc về luồng sở hữu preview.
- `holdCountAtSeek`/`holdCountAtFirstDraw` là bộ đếm toàn cục
  `__vcutHoldStats.hold`, không theo element — chỉ dùng được cho phiên
  1 clip (như N2); phiên nhiều clip không được đọc hold theo element.
- seekedEvent=false (entry 20, rAF fallback) mang sai số quan sát tới
  ~1 khoảng rAF; các entry đó vẫn validate đạt nhưng latency của chúng
  không chính xác bằng entry có seeked event.
- Ngưỡng 100 ms và nhãn cơ chế là heuristic mô tả, không phải cổng.
  Không dùng nhãn `mixed`/`undetermined` để loại lượt hay khóa A/B.

## 7. File đổi/thêm (chỉ của T2 — text, không binary, không dist)

- Mới: `apps/web/scripts/per-seek-probe-page.js` (logic ghi trong
  trang đo: chặn setter currentTime, sự kiện seeked, vòng rAF, mark,
  read, setEnabled).
- Mới: `apps/web/scripts/per-seek-probe.mjs` (phân tích Node thuần:
  validate, mechanismLabel, summarizePerSeek, gopIndexFor).
- Mới: `apps/web/scripts/per-seek-probe.test.mjs` (test 10/10: VM
  sandbox + phân tích Node + phiên mẫu mô phỏng).
- Sửa (chỉ các hunk đánh dấu "Phase 9 đợt 39 T2"):
  `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  (import phân tích; cờ N2_PERSEEK/N2_PERSEEK_GOP_SEC; PAGE
  perSeekInstall/perSeekMark/perSeekRead; install + mark phase +
  đọc probe + ghi perSeek/perSeekEnabled vào forward-hold.json).
- Mới: `docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md` (file này).
- Không sửa: preview.tsx, cổng v2/v3, probe Q6, runner solo, file của
  luồng khác. Không push, không tag. Scratch của phiên live
  (/tmp/vcut-t2-perseek-live, gồm forward-hold.json có perSeek) nằm
  ngoài repo, không đưa vào batch.
