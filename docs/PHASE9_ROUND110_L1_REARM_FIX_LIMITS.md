# PHASE9_ROUND110_L1_REARM_FIX_LIMITS — Sửa E4 (tách tín hiệu giữ R2) + A/B xác nhận 2+2 trên cây đã sửa

> Đợt 110, luồng L1. A/B xong 03:31:54Z 14/11/2026 — verdict: KHÔNG ĐÓNG
> (1 CAP, cơ chế mới). Xem §4–§6.
> KHÔNG push. KHÔNG release/tag. Chỉ luồng L1 sửa production đợt này.

## 1. Cơ chế E4 gây CAP — đã xác định bằng code + dữ liệu K1 (trước khi sửa)

### 1.1 Vòng deadlock tự duy trì (5 bước, mỗi bước có dòng code + số đo)

1. **Đuôi Y4 mở + grace giữ overCount**: watch resume-stall hết vì element
   tăng >= 1 frame -> đuôi ân hạn Y4 mở (trần 5000 ms). Trong lúc đuôi mở,
   grace X4/Y4 giữ `overCount` ở `confirmTicks−1` (= 1) -> drift re-seek bị
   chặn, element vẫn lệch target > 0,35 s. (`preview.tsx` ~5400-5440 ghi
   pending khi `!decision.seek && overCount >= 1`; `nextResumeGraceTail97Y4`
   trần 5000 ms.)
2. **E4 case (b) bỏ vẽ MỌI tick trong đuôi**: pending ->
   `shouldSkipRenderWhileDriftConfirmPending` = true -> `syncMedia` trả về
   skip = true mỗi tick. Bằng chứng: k1on skipTicks (bộ đếm skip gộp N3+E4
   trước đợt 110) tăng liên tục trong cả 4 đuôi CAP: 5->29, 31->55, 62->84,
   88->110; nhánh off (E4 tắt) skipTicks đứng yên 6->6 trong span được cứu.
3. **Skip của E4 bị đọc nhầm là "đang seeking"**: `syncMedia` trả về 1
   boolean gộp `shouldSkipRenderWhileSeeking(...) || skipRenderDriftConfirm103E4`
   (`preview.tsx:5605-5612` trước sửa). `tickInner` gán thẳng nó vào
   `prevSkipRenderSeeking` (`preview.tsx:7252`). Tick sau:
   `shouldHoldPlayheadWhileSeeking({ seekingPrevTick: prevSkipRenderSeeking })`
   -> hold = true (`playheadHold90R2.ts`: `seeking = seekingPrevTick ||
   forceSeekEdge`, giữ tới trần 15 s).
4. **Giữ R2 pause element**: `playheadHeld = true` + `playheadHeldResume =
   false` -> nhánh forward của `syncMedia` gọi `a.el.pause()` cho VIDEO
   (`preview.tsx` ~5502-5520). Element bị pause trong khi app vẫn playing.
   Bằng chứng: k1on 4 đuôi CAP có 24/26, 20/21, 21/23, 23/23 mẫu sampler
   ghi `paused=True`; k1off span được cứu có 0/14 mẫu paused.
5. **Detector re-arm mù với element paused**: `nextResumeFreezeRearm` trả
   `{ track: null, arm: null }` ngay khi `paused` (`playheadHold90R2.ts`:
   `if (!playing || seeking || paused)`). Không watch mới nào arm trong
   suốt 5 s -> đuôi chạm trần 5000 ms mà không có rearm ở tick sau -> CAP
   (age >= 4800, rearms không tăng). Bằng chứng: k1on 4 CAP rearms 0->0;
   k1off rearm 0->1 ở tick sau span.

Vòng lặp tự duy trì: E4 skip -> giữ R2 -> pause element -> detector mù ->
element đóng băng -> drift vẫn > 0,35 -> grace giữ overCount -> E4 skip lại.
Chỉ vỡ khi đuôi chạm trần 5000 ms -> drift re-seek bắn (k1on CAP1: ct 1.762
-> 0.867 ở t=10595, resyncsV 1->2).

### 1.2 Vì sao không phải các giả thuyết khác

- **Không phải rAF ngừng chạy**: sampler rAF vẫn tick đều ~200-400 ms trong
  đuôi (velocityTicks dày đặc suốt 5 s); vòng app vẫn chạy (skipTicks tăng
  mỗi tick).
- **Không phải `ceilingSpent`**: watch mở đuôi kết thúc vì element tăng
  (completedAtMs=1515, kết thúc ~4983 < trần 1515+5000), không chạm trần
  nên cờ không set.
- **Không phải element seeking**: samples trong đuôi ghi `seeking=False`
  toàn bộ (seek chỉ xuất hiện SAU khi đuôi đóng, lúc re-seek bắn).
- **Không phải detector không chạy**: detector chạy mỗi tick nhưng gặp
  `paused` nên trả về track null — đúng luật đã viết trong helper.

### 1.3 Ghi chú về bộ đếm skipTicks (đính chính số liệu K1 đọc lại)

`skipTicks` trong samples của probe104f5 đọc `__vcutSeekSkipRenderTicks86N3`
— trước đợt 110, tickInner tăng bộ đếm này mỗi khi giá trị trả về gộp của
`syncMedia` là true, tức đếm GỘP cả tick N3 (seeking) lẫn tick E4. Vì vậy
"skipTicks tăng trong đuôi" ở §1.1 bước 2 chứng minh **skip gộp** đang bật
mỗi tick (đúng điều cần chứng minh cho bước 2), nhưng tên bộ đếm ("N3")
là sai lệch — từ đợt 110, bộ đếm này chỉ đếm tick seeking thật (xem §2).

## 2. Sửa production (đợt 110 L1)

### 2.1 Hướng sửa đã chọn: tách tín hiệu, giữ nguyên hành vi vẽ

`syncMedia` trả về 2 cờ riêng thay vì 1 boolean gộp:

- `skipRender` = N3 || E4 — chỉ quyết định bỏ vẽ tick này (giữ nguyên hành
  vi vẽ, kể cả case (b) chặn frame stale trong lúc grace).
- `skipRenderSeeking` = chỉ N3 — tín hiệu "đang seeking" cho giữ R2 tick
  sau + bộ đếm N3.

Hệ quả kỳ vọng: E4 vẫn chặn frame stale, nhưng không còn kích giữ R2 ->
element không bị pause oan -> detector arm được watch khi element đóng băng
>= 300 ms trong đuôi -> đuôi được cứu bằng re-arm (như nhánh off K1) -> CAP
biến mất, rate hồi về ~0,4 như nhánh off.

KHÔNG chọn "thu hẹp E4 chỉ còn case (a)": làm vậy trả lại frame stale 3-4
tick/đợt grace (đo e4x2) mà không sửa lỗi ghép tín hiệu gốc — mọi skip kéo
dài > 1 tick trong tương lai sẽ deadlock lại.

### 2.2 File đổi (md5 mới `9b27abe57975ec5b69ec2e21c3fa281c`)

- `apps/web/src/lib/driftConfirmSkip103E4.ts` (md5 `ce3a9291b8f05bea0898f0a040fbc9a9`):
  thêm `SkipRenderDecision` + `combineSkipRender(skipWhileSeeking,
  skipWhileDriftConfirm)` thuần, kèm docstring ghi cơ chế deadlock.
- `apps/web/src/lib/driftConfirmSkip103E4.test.ts`: thêm 5 test
  combineSkipRender (trong đó 1 test pin hồi quy: E4-only ->
  `{ skipRender: true, skipRenderSeeking: false }`).
- `apps/web/src/preview.tsx`: import `combineSkipRender` +
  `type SkipRenderDecision`; `syncMedia` đổi kiểu trả về `boolean` ->
  `SkipRenderDecision`, return `combineSkipRender(N3, E4)`; nhánh phát của
  tickInner dùng 2 cờ tách riêng (`prevSkipRenderSeeking =
  decision.skipRenderSeeking`; render bỏ qua khi `decision.skipRender`; bộ
  đếm N3 chỉ tăng khi `skipRenderSeeking`); nhánh pause lấy
  `.skipRenderSeeking` (đường pause vốn không ghi pending E4 nên cờ E4
  luôn false ở đó — không đổi hành vi pause).
- Không đổi: vị ngữ E4 (`shouldSkipRenderWhileDriftConfirmPending`),
  N3, R2, S2, detector, đuôi Y4, grace X4/Y4, `__vcut103e4DriftConfirmSkips`.

### 2.3 Kiểm chứng trên cây đã sửa (trước A/B)

- Unit test: `node --experimental-strip-types
  apps/web/src/lib/driftConfirmSkip103E4.test.ts` — **12/12 + 5/5 PASS**.
- `npx tsc --noEmit` (apps/web): **exit 0** (~6,5 phút trên VM tải nặng).
- `npx vite build`: **exit 0** (built in 3m05s; cảnh báo chunk > 500 kB và
  dynamic-import userLut là có sẵn từ trước, không do sửa này).
- Ghi chú giới hạn kiểm chứng tĩnh: wiring trong `preview.tsx` (2 chỗ gọi
  `syncMedia` + nhánh skip) không có unit test trực tiếp — syncMedia là
  hàm nội bộ của module preview, không import được trong node. Wiring được
  kiểm bằng tsc + vite build + lượt A/B live (§4) — ghi rõ, không giả vờ
  đã test wiring bằng unit test.

## 3. Prereg A/B (viết trước lượt đo đầu — xem PREREG-L1.md đầy đủ)

- Cây đo đóng băng: preview.tsx md5 `9b27abe57975ec5b69ec2e21c3fa281c`;
  probe104f5.mjs không sửa; webkit, loadN=4.
- Ma trận 2+2 trên cây đã sửa: l1f1 gop250, l1f2 gop30, l1f3 gop250, l1f4 gop30.
  Đối chứng: K1 on-branch lịch sử (6 CAP / 284 ticks = 0,0211 CAP/tick).
- Chỉ số chính CAP/tick; phụ CAP/40-ticks, CAP/lượt, rate, freeze-max.
- **ĐÓNG** nếu: (a) 0 CAP trong 2+2 lượt; VÀ (b) kiểm cơ chế đạt (không đuôi
  nào age >= 4800 thiếu rearm; paused < 20% trong mọi đuôi age >= 4000 ms);
  VÀ (c) E4 vẫn bỏ vẽ (renderTicks skipped=true trong đuôi dài trong khi
  skipTicks N3 đứng yên và seeking=False).
- Fisher 2 phía (cây đã sửa vs K1-on 6/284): p < 0,05 -> đóng theo Fisher;
  0 CAP nhưng p >= 0,05 -> "ĐÓNG CÓ ĐIỀU KIỆN" theo điều khoản "0 CAP"
  đăng ký trước (cùng điều khoản K1) + báo Poisson P(0 CAP | rate on).
- **KHÔNG ĐÓNG** nếu >= 1 CAP: phân tích CAP đó có phải cùng cơ chế cũ
  (element paused trong đuôi) hay cơ chế mới; không chạy thêm lượt săn 0 CAP.

## 4. Kết quả A/B 2+2 trên cây đã sửa

Chạy 03:29:48–03:31:54Z 14/11/2026 (driver `run-l1-locked.sh`: lấy vite.lock
03:27:47Z sau 19 lần chờ, waiter mở cửa 03:29:47Z với vite=0 + RAM tầng J;
không reboot trong lượt đo; boot `ce518c02…` suốt lượt). Cả 4 lượt exit 0,
verdict PASS/PASS, md5 trước/sau = md5 L1-fix, mtime không đổi, RAM đầu lượt
đều tầng J (1.717–2.094M kB — không có lượt nào tầng L/H, xem caveat §7.6).

| lượt | gop | tầng | RAM đầu (kB) | load1 | ticks | tails | CAP | ages (ms) | rate | wall (ms) | frzMax | frzTail | frzPhAdv |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| l1f1 | 250 | J | 1.717.056 | 1,04 | 43 | 1 | 0 | — | 0,420 | 11.592 | 2.819 | 508 | 508 |
| l1f2 | 30 | J | 1.917.380 | 2,35 | 44 | 3 | 0 | — | 0,448 | 11.619 | 3.040 | 328 | 328 |
| l1f3 | 250 | J | 1.975.028 | 2,00 | 54 | 1 | **1** | **5.191** | 0,455 | 10.984 | 2.322 | 205 | 186 |
| l1f4 | 30 | J | 2.093.612 | 1,56 | 38 | 1 | 0 | — | 0,501 | 10.508 | 2.429 | 375 | 375 |
| **gộp** | | | | | **179** | **6** | **1** | | **0,452*** | | | **352*** | **352*** |

\* trung vị 4 lượt. CAP/tick gộp = **1/179 = 0,0056** (K1-on: 6/284 = 0,0211;
K1-off: 0/159 = 0,0000). CAP/lượt = 0,25 (K1-on 1,50; K1-off 0,00).

### 4.1 Kiểm cơ chế (analyze-l1-mechanism.py, đuôi age >= 4000 ms)

| lượt | đuôi ended | age (ms) | rearm ở tick sau? | mẫu sampler | paused | paused_frac | skipTicks Δ (N3) | seeking? | renderTicks skipped |
|---|---|---|---|---|---|---|---|---|---|
| l1f1 | 5086 | 4.900 | **CÓ** (được cứu) | 13 | 0 | 0,00 | 0 | không | 10/15 |
| l1f2 | 4677 | 4.114 | **CÓ** (được cứu) | 10 | 0 | 0,00 | 0 | không | 3/10 |
| l1f3 | 4331 | 5.191 | **KHÔNG** -> CAP | 22 | 0 | 0,00 | 1 | có (1 mẫu) | 21/22 |
| l1f4 | 3532 | 5.367 | **CÓ** (được cứu) | 15 | 0 | 0,00 | 0 | không | 0/15 |

- **Cơ chế pause-deadlock của K1 đã biến mất**: element KHÔNG bị pause trong
  bất kỳ đuôi dài nào (0/60 mẫu gộp, so với K1-on 20-24/21-26 mẫu/đuôi).
- **Đường cứu re-arm hoạt động**: 3/4 đuôi dài được cứu bằng rearm ở tick
  sau (l1f1 4.900 ms, l1f2 4.114 ms, l1f4 5.367 ms — đuôi dài hơn cả ngưỡng
  CAP vẫn được cứu). K1-on: 0/4 đuôi được cứu.
- **E4 vẫn bỏ vẽ** (tiêu chí (c) của prereg): l1f1 renderTicks 10/15 skipped
  trong khi skipTicks N3 đứng yên (Δ=0) và seeking=False -> các tick bỏ vẽ
  đó chỉ có thể là E4; l1f3 21/22 skipped với skipTicks Δ=1 -> chủ yếu E4.
  l1f4 0/15 skipped là đúng (element đồng bộ, không drift, không cần E4).

### 4.2 CAP duy nhất (l1f3, age 5.191 ms) — cơ chế MỚI, không phải pause-deadlock

Tái hiện từng tick (probe-results.json l1f3, clip duration 6 s):

- t=3516–4331: element đóng băng ở ct≈0,51–0,57 trong lúc watch giữ ph=0,5
  (rTicks 5->7); t=4331 ct burst 0,57->1,32, watch hết -> đuôi Y4 mở
  (endedAtMs=4331).
- t=4528–9108: element **GIẢI MÃ BÌNH THƯỜNG suốt đuôi**: ct tăng 1,52 ->
  1,67 -> 1,77 -> … -> 5,82 -> **6,0** (chạm cuối clip ở t=9108), ph tăng
  0,73 -> 5,23. Đuôi vẫn mở vì mọi lần tăng đều là burst / đáp xa nên luật
  B3 (burst-rate) và C3 (drift-gate) từ chối đếm (`advances` giữ 0 cả đuôi;
  tailBursts 0->8, tailDriftGate 0->13) — đúng mẫu span được cứu của k1off.
- t=9317: ct 6,0 -> 5,5, ph 5,23 -> 5,5 (element chạm `ended`); mẫu sampler
  relMs=9023 ghi `seeking=True`, skipTicks 5->6: **restart-ended seek**
  đang bay (resyncsV 1->2, restartV 0->1 ở tick 39, t=9522).
- t=9522 (tick 39, tick cuối của đuôi): age = 9522−4331 = 5.191 ms;
  t=9708 (tick 40): đuôi đóng vì chạm trần 5000 ms (9708−4331 = 5.377),
  rearms 0->0 -> **CAP theo đúng luật phân loại F5/K1**.

Vì sao detector không arm: trong 95% đuôi element đang giải mã (không đóng
băng >= 300 ms nên không có gì để arm — đúng luật); trong ~200 ms cuối
element đang **seeking** (restart seek) nên detector trả về track null theo
luật (`seeking` -> không arm). Đuôi chạm trần đúng lúc restart seek đang bay.

Đây là **cuộc đua ở biên cuối clip (tail-ceiling vs restart-ended seek)**,
độc lập với E4: đuôi được giữ mở bởi luật B3/C3 (đã có từ trước), và CAP xảy
ra vì clip kết thúc đúng lúc đuôi sắp hết trần. Bằng chứng độc lập với E4:
paused=0/22 mẫu (cơ chế cũ đòi paused ~100%), element giải mã suốt đuôi
(cơ chế cũ đòi ct đóng băng), và mẫu tương tự trên nhánh off K1 (đuôi 5.209 ms,
burst advances, được cứu khi element đóng băng ở 5,97 rồi rearm arm) cho thấy
cùng hình đuôi này có thể được cứu hay thành CAP tùy element chạm cuối clip
hay đóng băng trước — một cuộc đua ở biên, không phải lỗi E4.

## 5. So sánh với K1 + Fisher

| chỉ số | Cây đã sửa (L1, 2+2) | K1-on (E4 bật) | K1-off (E4 tắt) |
|---|---|---|---|
| CAP/tick (chính) | **1/179 = 0,0056** | 6/284 = 0,0211 | 0/159 = 0,0000 |
| CAP/lượt | 0,25 | 1,50 | 0,00 |
| CAP/40-ticks đầu | 1 (l1f3, tick 39) | 3 | 0 |
| Fisher 2 phía (CAP/tick) | **p = 0,2571** vs K1-on (bảng [[1, 178], [6, 278]]) | | p = 1,0000 vs K1-off (bảng [[1, 178], [0, 159]]) |
| Poisson P(<=1 CAP \| rate on) | 0,1089 (kỳ vọng 3,78 CAP; P(0) = 0,0228) | | |
| rate trung vị | **0,452** | 0,151 | 0,424 |
| freeze-trong-đuôi-mở trung vị (ms) | **352** | 4.520 | 316 |
| freeze-max (ms) | 2.322–3.040 | 4.993–20.115 | 2.599–3.594 |
| đuôi dài được cứu bằng rearm | 3/4 | 0/4 | 2/2 |
| mẫu paused trong đuôi dài | 0/60 | ~90/94 | 0/14 |

- Giảm CAP/tick 3,8× so với K1-on (0,0211 -> 0,0056), nhưng Fisher 2 phía
  **không đạt < 0,05** (p = 0,2571): với n nhỏ và còn 1 CAP, không đủ power
  để kết luận khác biệt có ý nghĩa thống kê. Poisson P(<=1 CAP | rate on)
  = 0,1089 — quan sát "1 CAP" vẫn nằm trong dao động lấy mẫu của rate on
  với xác suất ~11% (so với P(0 CAP) = 0,0228 nếu là 0 CAP).
- Mọi chỉ số phụ đều về phía nhánh off: rate 0,452 ≈ off 0,424 (gấp ~3×
  on 0,151); freeze-trong-đuôi 352 ms ≈ off 316 ms (on 4.520 ms);
  Fisher vs off p = 1,0000 — cây đã sửa **không phân biệt được với nhánh
  E4-tắt** về CAP/tick.

## 6. Verdict — KHÔNG ĐÓNG (theo prereg), nhưng cơ chế E4 đã sửa đúng

Đối chiếu prereg §4 (đăng ký trước khi đo):

- (a) "0 CAP trong 2+2 lượt": **KHÔNG ĐẠT** — 1 CAP (l1f3, 5.191 ms).
- (b) "không đuôi nào age >= 4800 thiếu rearm": **KHÔNG ĐẠT** — l1f3 thiếu
  rearm. "paused < 20% trong mọi đuôi age >= 4000 ms": **ĐẠT** (0% cả 4 đuôi).
- (c) "E4 vẫn bỏ vẽ": **ĐẠT** (l1f1 10/15, l1f3 21/22 renderTicks skipped
  trong khi skipTicks N3 đứng yên / Δ=1 và seeking=False ở hầu hết mẫu).
- Fisher p = 0,2571 (không < 0,05) — không có cửa "đóng theo Fisher".

**Verdict: KHÔNG ĐÓNG E4.** Prereg đòi 0 CAP; còn 1 CAP thì không được gọi
là đóng, dù CAP đó là cơ chế mới.

Nhưng phải ghi rõ phần đã chứng minh được (đừng để verdict "không đóng"
che mất):

1. **Cơ chế pause-deadlock của K1 đã bị diệt tận gốc**: 0/60 mẫu paused
   trong đuôi dài (K1-on ~90/94), 3/4 đuôi dài được cứu bằng rearm (K1-on
   0/4), rate và freeze-trong-đuôi về đúng mức nhánh off. Fix tách tín hiệu
   làm đúng việc nó được sinh ra để làm.
2. **CAP còn lại là nợ mới, không phải nợ E4**: cuộc đua tail-ceiling vs
   restart-ended seek ở biên cuối clip (đuôi giữ mở bởi B3/C3, clip kết thúc
   đúng lúc đuôi sắp hết trần, restart seek làm detector mù ~200 ms).
   Nợ này cần luồng riêng (đề xuất: xem đuôi có nên đóng sớm khi element
   chạm `ended`, hoặc detector có nên arm ngay khi seek kết thúc thay vì
   chờ tick sau — CHƯA thiết kế, chưa đo, không tự sửa ở đây).
3. **Cây đã sửa không phân biệt được với nhánh E4-tắt** (Fisher p = 1,0 về
   CAP/tick; rate/freeze tương đương) — tức fix đã khôi phục hành vi của
   nhánh off trong khi vẫn giữ E4 chặn frame stale (tiêu chí (c) đạt).

Bước tiếp (cho parent/đợt sau, không làm trong luồng này): luồng riêng xử lý
cuộc đua tail-ceiling/restart ở biên cuối clip + A/B xác nhận lại 2+2 trên
cây đó; hoặc user quyết "đóng có điều kiện" cho E4 vì cơ chế E4 đã xong và
CAP còn lại thuộc hệ khác.

## 7. Giới hạn — những gì KHÔNG làm được / chưa chứng minh

1. Wiring trong `preview.tsx` không có unit test trực tiếp (xem §2.3).
2. So sánh Fisher dùng baseline K1-on LỊCH SỬ (không chạy lại nhánh on trên
   cây cũ cùng đợt) — ghi rõ khi báo cáo.
3. Probe KHÔNG đọc trực tiếp `__vcut103e4DriftConfirmSkips`; bằng chứng
   "E4 vẫn bỏ vẽ" là gián tiếp (renderTicks skipped + skipTicks N3 đứng yên
   + seeking=False) — xem PREREG-L1.md §5.
4. Nit comment: khối chú thích N3 phía trên nhánh skip trong tickInner vẫn
   viết theo nghĩa "seeking thì bỏ vẽ" mà chưa nhắc case E4 cũng đi qua
   nhánh này; lý do E4 được ghi ở return của syncMedia + docstring
   `combineSkipRender`. Không sửa để khỏi đổi md5 giữa chừng (driver A/B
   đã khóa md5) — sửa ở đợt sau nếu parent đồng ý.
5. (Điền thêm sau A/B.)
6. **Cả 4 lượt A/B đều tầng RAM J** (1,72–2,09M kB) — không có lượt tầng L
   hay H. Không kết luận gì riêng theo tầng; tính so sánh được với K1-on
   dựa trên gộp, không phân tầng (K1-on có H×1/L×1/J×2).
7. **n = 2+2 nhỏ; Fisher vs baseline lịch sử** (K1-on, không chạy lại nhánh
   on cùng đợt) — p = 0,2571 không có ý nghĩa thống kê; verdict "không đóng"
   dựa trên điều khoản "0 CAP" đã đăng ký trước, không dựa trên Fisher.
8. **Nợ mới phát hiện (không thuộc E4)**: cuộc đua tail-ceiling 5000 ms vs
   restart-ended seek ở biên cuối clip (l1f3). Đuôi giữ mở bởi luật B3/C3
   (burst advances không đếm) là hành vi có từ trước; CAP xảy ra khi clip
   kết thúc đúng lúc đuôi sắp hết trần. Chưa có thiết kế sửa; cần luồng riêng.
9. Không đo TTS/birefnet; không đụng workflows/cloud/collab; không push;
   không release/tag. Chỉ L1 sửa production đợt này.

## 8. Hạ tầng trong đợt

- Reboot #39 02:50:48Z (boot `ce518c02-0368-46f4-8416-d61e7d042d84`), cắt
  1 exec giữa chừng lúc bắt đầu; scratch + cờ production-edit sống qua reboot.
  (Đính chính: lúc đầu ghi #38 — luồng L8 xác nhận là #39.)
- Wrapper MiniBrowser K1 còn (LD_LIBRARY_PATH đã vá). Symlink GStreamer
  ĐÃ MẤT sau reboot #39 (như K1 dự báo) — vá lại tay 02:57Z:
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` -> debroot plugin 1.24.2 (269 file).
  Lưu ý: luồng L8 sau đó ghi apt replay đã cài lại đủ 10 package WebKit/GST
  bền vững sau reboot (đường bền vững) — symlink tay nay chỉ là dự phòng,
  không còn là đường duy nhất.
- Không đo TTS/birefnet; không đụng workflows/cloud/collab; không push;
  không release/tag. Chỉ L1 sửa production đợt này.

## 9. File / stage

- LIMITS này: `docs/PHASE9_ROUND110_L1_REARM_FIX_LIMITS.md`
- Prereg: `hidden_files/round110-l1/PREREG-L1.md` (viết trước lượt đo đầu).
- Cơ chế: `hidden_files/round110-l1/MECHANISM.md`.
- Trạng thái: `hidden_files/round110-l1/round110-l1-status.md`.
- Dữ liệu đợt này: `hidden_files/round110-l1/` (run log `run-l1.log`,
  waiter log `wait-quiet-l1.log`, driver `run-l1.sh`, waiter
  `wait-quiet-l1.sh`, wrapper `run-l1-locked.sh`, analyzer
  `analyze-l1-cap-pattern.py` + `analyze-l1-mechanism.py`, probe JSON từng
  lượt) — ngoài repo, không stage qua paths-loop.
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round110-l1-rearm.txt`
  — 4 file (preview.tsx + driftConfirmSkip103E4.ts + .test.ts + LIMITS này),
  NUL-delimited, đã verify read-back.
