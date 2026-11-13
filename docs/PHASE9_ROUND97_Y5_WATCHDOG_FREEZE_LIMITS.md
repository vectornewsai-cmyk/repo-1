# PHASE9_ROUND97_Y5_WATCHDOG_FREEZE_LIMITS — kill theo thời gian khi element đóng băng + blind memo c2

> Luồng Y5, lượt cron 18:35 +07 12/11/2026. Nợ mở LIMITS gộp đợt 96 §4 mục 6–7.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Build đo: `preview.tsx` md5 `a0a078e1` (sau khi bỏ guard seeking; chr-blur-r7
> chạy build trước đó md5 `2740ec30`, chỉ khác guard seeking — xem §1.3).
> `mtimeChanged=false` trong mọi lượt (không có sửa giữa lượt).

## 0. Verdict ngắn

- **Fix đã implement + kiểm chứng offline xanh** (tsc 0, vite build PASS,
  previewEngine 25/25, playheadHold90R2 50/50, seek 21/21, pacing 19/19,
  previewLoop 20/20, seekSkip 9/9). Chỉ sửa vùng watchdog/pump trong
  `preview.tsx`, marker "Đợt 97 Y5" ×4. Không đụng vùng blend của Y2,
  drift/re-seek của Y4, clip-change của Y7.
- **Freeze-kill (`"no-callback-frozen"`) CHƯA BẮN lần nào trong 17 lượt
  headed** (0 lần). Không phải do code sai đường rõ ràng — trace tay cho
  thấy logic tới được (xem §1.4) — mà vì **không có ca đóng băng cứng nào
  xuất hiện**: mọi stall trên clip có pump đều có frame tiến trong <1000 ms
  (đường advance-path cũ bắn trước), và 8 lần fault-injection pause element
  đều bị app resume trong ~74–400 ms nên freeze không thành hình (xem §3).
- **Không kill oan nào**: 0 kill watchdog trên Chromium khỏe (chr-blur-r7:
  fbAt={}); 2 lượt chr còn lại chỉ có kill `"clip-change"` của luồng khác.
- **Memo c2 blind: thường ~0 ms, thỉnh thoảng ~0,5 s** (13/14 lượt wk ≈ 0 ms,
  1/14 = 485 ms) — dao động theo độ trễ khởi động element, không phải do
  watchdog (memo bỏ chờ 1000 ms trong mọi lượt).
- **Kỳ vọng cứu ~1100 ms ở ca r5 vẫn là counterfactual, CHƯA chứng minh
  bằng đo trực tiếp.** Nợ mở này KHÔNG đóng — cần 1 ca đóng băng cứng tự
  nhiên hoặc injection giữ được pause (xem §5). Đây là kết luận trung thực
  chính của luồng.

## 1. Thiết kế fix

### 1.1 Bug gốc (X5 §2.1)

`rvfcWatchdogMiss` fast-path đòi `frameIdx > wd.lastFrameIdx` (frame phải
tiến) mới kill. wk-blur-r5 c1: element đóng băng ở ph=3,033 ~1,6 s → pump
không chết, tick không tiếp quản, blind 2132 ms. Counterfactual tick
cưỡng bức tại created+1000 cứu ~1111 ms.

### 1.2 Phân tích lại dữ liệu r5 trước khi sửa

- c1: fbAt=9616, ringFirstAt=9616, 0 pump event, fb=`"no-callback"`.
- Element c1: ct kẹt 0,033 từ ~7804 tới ~9194 (creep 0,041 → 0,1 lúc ~9400),
  **paused=True lúc cap 8377 trong khi store playing=True** — element bị
  pause ở tầng element trong khi transport vẫn phát.
- Hệ quả thiết kế: **KHÔNG guard bằng `el.paused`** (sẽ chặn đúng ca cần
  cứu). Kill-while-paused của user không xảy ra qua đường này vì
  ghostWeights rỗng lúc pause (đợt 62 R3) nên watchdog không được gọi.

### 1.3 Thay đổi code (`apps/web/src/preview.tsx`, marker "Đợt 97 Y5")

1. `RvfcWatchdogState` thêm `lastCurrentTime` (ct ở tick trước, -1 = chưa
   quan sát) + `frozenSinceMs` (mốc bắt đầu đóng băng, 0 = không đóng băng).
2. `rvfcWatchdogMiss`: fast-path đóng băng mới, song song fast-path cũ —
   kill khi **(a)** pump im lặng ≥1000 ms (`lastCallbackMs`, cùng ngưỡng
   cũ) VÀ **(b)** đóng băng ≥1000 ms: frameIdx không tiến VÀ currentTime
   không tiến quá nửa khung (500/fps ms ≈ 16,7 ms) kể từ tick trước.
   Reset khi: readyState<2 (chưa có dữ liệu — chưa bắt đầu, không phải
   đóng băng), có capture mới, frame/ct tiến.
3. Lý do kill riêng `"no-callback-frozen"` (đo được qua `dbg.rvfcFallback`),
   vẫn đếm vào silent-kills (cùng bằng chứng 0 callback khi đang phát).
4. **Bỏ guard `!el.seeking`** (sửa sau lượt wk r6–r8 — xem §2.3): đo được
   seeking=true SUỐT stall đầu clip trên WebKit (~0,6–1,4 s, seek tới đầu
   clip không hoàn tất trong lúc decoder stall); guard seeking sẽ chặn
   freeze-kill đúng ca cần cứu. Seek thường hoàn tất <1 s và reset đồng hồ
   khi ct nhảy/frame tiến; seek stall >1 s với 0 callback CHÍNH LÀ element
   đóng băng.
5. Ngưỡng nửa khung phân biệt phát chậm: 0,1× vẫn tiến ~20 ms/tick > 16,7 ms
   nên không tính là đóng băng; frameIdx kẹt ≥1000 ms đã hàm ý ct tiến
   <33 ms/1000 ms (<0,033× realtime).

### 1.4 Trace tay: logic tới được trong ca đóng băng cứng

Pump tạo ở T0 (`lastCallbackMs`=T0). Tick watchdog mỗi ~200 ms (draw chạy
trong lúc đóng băng — đã thấy ở r5: loopLen tăng, video draws ~200 ms).
FrameIdx=1 hằng, ct=0,033 hằng → `frameFrozen` ✓, `ctFrozen` ✓ (Δct=0),
readyState=4 → `frozenSinceMs` đặt ở tick đầu sau T0; khi
`now-frozenSinceMs ≥1000` và `now-lastCallbackMs ≥1000` (≈T0+1000–1400)
→ kill `"no-callback-frozen"`, tick lấp ring ngay tick đó. Không có đường
nào khác kill trước trong ca này (advance-path cần frame tiến, slow-path
cần `advanced`).

### 1.5 Rủi ro đã xét (không phát hiện thêm bằng đo)

- **Pause/seek của user:** watchdog chỉ chạy khi ghostWeights>0 (đang phát)
  nên không kill-while-paused; seek hoàn tất <1 s reset đồng hồ.
- **Stall buffering:** kill trong lúc stall >1 s thì tick snapshot frame
  đóng băng vẫn đúng pixels; giá phải trả có giới hạn: pump chết dính theo
  clip → blur mức tick cho phần còn lại của clip đó (hành vi tiền-rVFC).
- **Tốc độ phát cực chậm (<~0,06×):** frame thưa >1 s có thể chạm ngưỡng —
  cùng tính chất với fast-path advance cũ (ngưỡng im lặng 1000 ms chung),
  không phải rủi ro mới của Y5; tốc độ UI thực tế ≥0,25× (callback mỗi
  ≤~130 ms) nên không chạm.
- **Main-thread stall ≥1 s:** watchdog cùng thread nên không chạy trong lúc
  stall; sau stall frame đã tiến (đồng hồ media độc lập) → advance-path
  bắn như cũ (Exp A r1), freeze-path không bắn.

## 2. Lượt chạy headed — blind + kill

Harness: `apps/web/scripts/probe97y5-frame-parity.mjs` (copy probe96x5b +
phCross — mốc playhead qua biên clip ở độ phân giải rAF, entry chính xác
~±16 ms thay vì nội suy state100 ~±600 ms; `--state-ms 50`; els trong
state100/caps gồm readyState + seeking). 17 lượt có kết quả + 1 lượt mất
(wk-freeze-r9, §3.4). `pageErrs=0` mọi lượt. `silentEngine=true` mọi lượt
wk (0 callback), `false` mọi lượt chr.

### 2.1 Blind c1 (clip có pump, entry từ phCross)

| nhóm | n | min | median | max | fb |
|---|---|---|---|---|---|
| wk thường r6–r11 | 6 | 1092 | ~1150 | 1480 | `"no-callback"` (advance) ×6 |
| wk freeze-attempt r1–r8 | 8 | 1018 | ~1114 | 1336 | `"no-callback"` (advance) ×8 |
| chr r7/r8/freeze-r1 | 3 | 45 | 101 | 288 | `""` / `"clip-change"` (luồng khác) |

- wk blind c1 ≈ 1000–1500 ms trong MỌI lượt — đúng cửa sổ chờ
  created+1000 ms của fast-path (advance). Không lượt nào vượt 1500 ms
  (so với 2132 ms của r5).
- Stall dài nhất trên clip có pump mà KHÔNG bắn freeze-kill: r11 c2 ph kẹt
  994 ms nhưng c2 là clip memo (không pump); stall dài nhất trên clip có
  pump: r7 c1 ph kẹt 1007 ms nhưng ct bò 0,167→0,233 + frame tiến 5→6
  giữa chừng → advance bắn ở 5226 (blind 1305 ms). Freeze-path đứng yên
  là đúng trong mọi ca này (đồng hồ đóng băng bị reset khi frame tiến).

### 2.2 Blind memo c2 (entry từ phCross)

14 lượt wk: **13 lượt ≈ 0 ms** (ringFirstAt ≈ entry, sai số ±1 ms) và
**1 lượt 485 ms** (wk-blur-r8: element seeking+paused, ct kẹt 0,133→0,158
tới 8258 mới có snapshot đầu). X5 đo ~0,4–0,5 s (entry nội suy) nay giải
thích được: blind memo = độ trễ khởi động element (seeking+paused ở đầu
clip), watchdog đóng góp 0 ms — memo bỏ chờ 1000 ms trong cả 14 lượt.
Phân phối: median ~0 ms, p~93 ≈ 485 ms. Cần thêm lượt để chốt đuôi phân
phối (n=14, 1 mẫu đuôi).

### 2.3 Guard seeking — bằng chứng đo dẫn tới việc bỏ

| lượt | stall đầu clip (ph kẹt) | seeking trong stall |
|---|---|---|
| wk r6 c1 | 651 ms, ct 0,1→0,191 | True suốt |
| wk r7 c1 | 1007 ms, ct 0,167→0,233 | True suốt |
| wk r8 c1 | 270 + 493 ms (2 đợt) | True rồi False |
| wk r9–r11, freeze r1–r8 | 300–1000 ms | True trong phần lớn cửa sổ |

Seek tới đầu clip trên WebKit không hoàn tất kịp trong lúc decoder stall.
Vì ca r5 kiểu đó (đóng băng cứng) gần như chắc chắn cũng seeking=true,
giữ guard seeking đồng nghĩa freeze-path không bao giờ bắn. Đã bỏ guard
sau r8, kiểm chứng lại (tsc 0, build PASS 13,50 s, previewEngine 25/25,
playheadHold 50/50) rồi chạy 8 lượt tiếp theo với code mới — vẫn 0 lần
bắn (không có ca đóng băng cứng nào xuất hiện).

### 2.4 Không kill oan

- chr-blur-r7 (build cũ, yên, load 1,19): fbAt={} — 0 kill, pump sống cả
  3 clip (caps 27/14/8, active=true).
- chr-blur-r8 + chr-freeze-r1: fb duy nhất `"clip-change"` ở đúng mốc đổi
  clip (3801/6914 ≈ phCross c1/c2) — **không phải do Y5**: luồng khác
  trong đợt 97 thêm kill pump khi đổi clip (hygiene zombie-pump X5 §6).
  Pumps capture bình thường (caps 25–89/clip, pumpN=100–266).
- Stall chuyển clip thường ~300 ms (chr r7: ph đứng 304–305 ms) — dưới
  ngưỡng freeze 1000 ms với biên ~3×.

## 3. Fault-injection pause element — 8 lần thử, freeze không thành hình

Mục tiêu: tái hiện đóng băng cứng kiểu r5 một cách xác định để freeze-kill
bắn thật. `--freeze-el`: pause element clip c1 2500 ms rồi resume. 5 lần
sửa trigger, kết quả:

| lượt | trigger | kết quả |
|---|---|---|
| wk-freeze-r1/r2 | pause khi ph≥3,0 (mọi element đang phát) | **Pause nhầm element clip cũ** (ct ~2,9; element c1 lúc đó còn paused/chưa khởi động). Thực chất là 2 lượt wk thường (blind c1 1154/1282 ms). |
| wk-freeze-r3/r4 | pause element đang phát có ct nhỏ nhất (<1 s) | Pause đúng element c1 (ct 0,067/0,133) nhưng **app resume trong ~300 ms** — pause 2500 ms không giữ được. Blind 1073/1048 ms. |
| wk-freeze-r5/r6 | + stub `play()` cho element mục tiêu | Vẫn resume sau ~395/314 ms. Stub không phải nguyên nhân (xem r7). |
| wk-freeze-r7 | + chẩn đoán (đếm play-block, tag element) | **Quyết định: `playBlocks=0`** — app KHÔNG gọi `play()` lên element bị freeze trong cả 2500 ms mà element vẫn resume sau ~285 ms; ftag=True suốt → cùng element, không swap. |
| wk-freeze-r8 | + chỉ pause khi KHÔNG seeking | Element đã tự pause (tự nhiên) 3817–3967 rồi resume ~74 ms sau pause của probe (`playBlocks=0`). Blind 1018 ms. |
| wk-freeze-r9 | + chỉ pause sau 500 ms phát ổn định | **Lượt mất: probe kẹt** — xem §3.4. |

### 3.1 Cơ chế resume không qua `play()` (phát hiện phụ, cần đợt sau xác nhận)

Bằng chứng r7/r8: element resume trong ~74–400 ms sau pause mà không có
lần gọi `play()` nào lên nó (`playBlocks=0`, flag stub đã set). Giả thuyết
mạnh nhất: **task `play()` mà app queue lúc resume còn chờ ~50–300 ms sẽ
lật lại pause** (theo spec, `play()` queue task lật `paused=false`; `pause()`
gọi sau `play()` nhưng trước khi task chạy thì task vẫn lật lại). Ngoài ra
pause-trong-lúc-seeking có thể bị mất khi seek hoàn tất (pipeline WebKitGTK
khôi phục trạng thái PLAYING). Cả hai đều là hành vi tầng media/app, không
phải lỗi watchdog. Hệ quả: **không thể giữ pause bằng `pause()` + stub
`play()` từ page** — muốn tái hiện decoder kẹt phải chặn ở tầng thấp hơn
(GStreamer) hoặc chặn task queue của app, ngoài phạm vi luồng này.

### 3.2 Vì sao freeze tự nhiên hiếm (đặt lại tỉ lệ)

Đóng băng cứng (frame không tiến >1000 ms trên clip có pump): X5 thấy 1 lần
(r5 c1) trong 4 clip có pump; Y5 thấy 0 lần trong 28 clip có pump (6 lượt
thường + 8 lượt inject, c0+c1 mỗi lượt). Gộp: **~1/32 clip có pump (≈3%)**.
Với tỉ lệ này, cần ~30 lượt wk nữa mới kỳ vọng thêm 1 ca — không khả thi
trong một lượt cron. Ngưỡng 1000 ms cũng góp phần: stall tự nhiên dài nhất
đo được trên clip có pump là ~1007 ms (r7 c1) nhưng frame vẫn tiến giữa
chừng nên advance-path xử lý trước.

### 3.3 Stall tự nhiên: hai vị (đã phân biệt bằng đo)

- **(a) Creeping stall** (phổ biến): ph kẹt 300–1000 ms, ct bò chậm
  (~0,1–0,3× realtime), seeking=true, frame tiến từng nấc → advance-path
  bắn, blind ~1100–1500 ms. Freeze-path đứng yên là đúng.
- **(b) Hard freeze** (hiếm, r5): ct kẹt hẳn (0,033), paused=true, frame
  không tiến >1,6 s → chỉ freeze-path cứu được. Chưa tái hiện trong Y5.

### 3.4 Lượt mất wk-freeze-r9 (probe kẹt, chưa rõ nguyên nhân)

Chạy 12:27:47Z, load lúc phát 1,12 (yên). Sau mốc đó probe không ghi log
thêm; vòng chờ playhead (cap 120 s) không thoát, không có cảnh báo, không
có file kết quả. Node probe idle (CPU ~0), MiniBrowser còn sống — CDP
`page.evaluate` treo (renderer không đáp ứng). Đã kill node (pid 31551),
dọn vite mồ côi :5590 + lock/socket Xvfb :193 mồ côi (holder đã chết;
lock mkdir có cơ chế thu hồi — không ảnh hưởng lượt sau). **Chưa xác định
được nguyên nhân kẹt** (có thể renderer wedge trong lúc freeze — trigger v5
mới chỉ thêm điều kiện chờ, không thêm vòng lặp; nhưng chưa loại trừ được
tương tác stub/pause với pipeline). Không thử lại mù trong lượt này; đợt
sau nếu chạy lại injection cần đặt timeout cho `page.evaluate` trong probe
và ghi log nhịp tim.

## 4. Kiểm chứng

- tsc web **0** (2 lần: trước và sau khi bỏ guard seeking).
- vite build **PASS** (31,11 s rồi 13,50 s).
- Suite kiểu X9b (`node --experimental-strip-types`):
  previewEngine **25/25**, playheadHold90R2 **50/50** (Y4 thêm test — 50
  thay vì 44 đợt 96, xanh trên cây gộp), seek **21/21**,
  playheadPacing54K9 **19/19**, previewLoop50F2 **20/20**,
  seekSkipRender86N3 **9/9**.
- **Ghi chú:** `test-preview-engine.sh` (cũ) FAIL sẵn `MODULE_NOT_FOUND`
  (`require("./previewClipKey62R6.ts")` — import đuôi `.ts` từ đợt 62 R6,
  script không vá require này; KHÔNG do Y5 — Y5 không đụng previewEngine.ts
  hay script đó; X9b đã dùng runner strip-types thay thế).
- O8 **không chạy lại**: Y5 không đụng render (chỉ preview.tsx vùng
  watchdog); thay đổi chỉ có thể rút ngắn cửa sổ mù (preview giống render
  hơn), không thể làm parity tệ hơn. Nếu parent muốn chắc, O8 đợt 97 gộp
  sẽ đo lại trên cây đầy đủ.
- Headed: 17 lượt có kết quả (6 wk thường + 8 wk inject + 3 chr),
  `mtimeChanged=false` tất cả, `pageErrs=0` tất cả.

## 5. Nợ mở cho đợt sau

1. **Freeze-kill chưa chứng minh bằng đo trực tiếp** (0 lần bắn). Cần 1 ca
   đóng băng cứng tự nhiên (tỉ lệ ~3%/clip có pump) hoặc injection giữ
   được pause (chặn ở tầng GStreamer / chặn task queue của app — không
   làm được bằng `pause()` + stub `play()` từ page, đã chứng minh §3.1).
   Kỳ vọng khi bắn: blind c1 ~1000–1400 ms thay vì ~2100 ms (r5) — tiết
   kiệm ~700–1100 ms.
2. **Lượt mất wk-freeze-r9:** điều tra renderer treo trong lúc freeze
   (thêm timeout cho `page.evaluate` + log nhịp tim vào probe trước khi
   chạy lại injection).
3. **Memo c2 blind đuôi phân phối:** n=14 (13× ~0 ms, 1× 485 ms) — cần
   thêm lượt wk để chốt tần suất đuôi ~0,5 s (độ trễ khởi động element).
4. **Harness:** state100 chạm cap 1200 mẫu khi chờ yên 120 s (mẫu cũ bị
   drop — cửa sổ phát vẫn đủ nhờ phCross, nhưng nên tăng cap hoặc bắt đầu
   đếm từ lúc phát); analyzer từng in nhầm mẫu đầu có c2 trong freeze-run
   (đã sửa cách đọc: `ringFirstAt` từ sampler mới là chuẩn).
5. **Phát hiện phụ (không thuộc Y5):** kill `"clip-change"` của luồng khác
   trong đợt 97 (kill pump khi đổi clip — hygiene zombie-pump X5 §6) đã
   xuất hiện trong dữ liệu chr (fbAt = đúng mốc đổi clip); Y5 không đụng
   tới và không đánh giá nó.

## 6. Kiểm chứng + batch đã stage (KHÔNG push)

- 17 lượt headed, 0 collision (mỗi lượt vite port + Xvfb display riêng qua
  lock W8; 1 lần dọn mồ côi sau lượt kẹt r9).
- 1 sự cố probe: lần đầu chạy chr-blur-r7 lỗi `ReferenceError: STATE_MS
  is not defined` (`stateMs` lọt vào object page-side) — play đã chạy
  nhưng không lấy được kết quả; đã sửa (gán node-side) và chạy lại.
- Batch stage: `phase9-round97-y5-watchdog-freeze.txt` — 3 entry, read-back
  OK, 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND97_Y5_WATCHDOG_FREEZE_LIMITS.md` (file này)
  - `apps/web/src/preview.tsx` (fix watchdog/pump, marker "Đợt 97 Y5" ×4)
  - `apps/web/scripts/probe97y5-frame-parity.mjs` (probe Y5: phCross,
    state-ms, els state, freeze-el + play-stub + chẩn đoán)
