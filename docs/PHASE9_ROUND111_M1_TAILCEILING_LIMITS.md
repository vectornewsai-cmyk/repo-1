# PHASE9_ROUND111_M1_TAILCEILING_LIMITS — Đóng E4: cuộc đua tail-ceiling vs restart-ended seek ở biên cuối clip

> Đợt 111, luồng M1. A/B xong 06:21:06Z 14/11/2026 — verdict: **KHÔNG ĐÓNG E4**
> (1 CAP, cơ chế MỚI: freeze 1 frame trước cuối clip, `ended` không bao giờ đúng).
> Fix đóng-đuôi-vì-ended đã sửa + test xanh, nhưng **chưa từng chạy live** trong 2+2 lượt
> (0 ended-close) nên chưa có bằng chứng ngoài đời. Xem §4–§6.
> KHÔNG push. KHÔNG release/tag. Chỉ luồng M1 sửa production đợt này.

## 1. Cơ chế cuộc đua l1f3 — đã xác minh lại từ dữ liệu thô (không tin mù LIMITS)

Velocity ticks l1f3 (đợt 110 L1, clip bóng 6 s, gop250, loadN=4, cây L1-fix), đọc lại trực tiếp
từ `hidden_files/round110-l1/probe-webkit-load4-gop250-l1f3/probe-results.json`:

- Tick 15 (t=4331): ct burst 0,5667 → 1,3211, watch hết → đuôi Y4 mở (endedAtMs=4331).
- Tick 16–37: đuôi mở, advances=0 SUỐT (B3 bursts 0→8 + C3 drift-gate 0→12 reset mọi lần tăng);
  ct giải mã bình thường 1,52 → 6,0; ph 0,73 → 5,23. Detector không arm (element không đóng băng ≥300 ms).
- Tick 37 (t=9108): ct=6,0 = đúng duration; tuổi đuôi = 9108−4331 = **4777 ms** (< 4800, thiếu 23 ms).
- Tick 38 (t=9317): ct 6,0 → 5,5, ph 5,23 → 5,5 — restart-ended seek đã bắn.
- Tick 39 (t=9522): resyncsV 1→2, restartV 0→1 — đường `restartEndedElement` đã đếm, chứng tỏ
  `el.ended && !el.seeking` đã đúng ở tick 38/39. Tuổi đuôi 5191 ms.
- Tick 40 (t=9708): đuôi null — đóng vì chạm trần 5000 ms (9708−4331=5377). rearms 0→0 → **CAP**.

Điểm then chốt: `ended` đã đúng ở tick 37/38 — đuôi ĐÃ CÓ THỂ đóng ở tuổi 4777–4986 ms nếu bước đuôi
biết element đã ended, thay vì đợi trần rồi thành CAP. Nhưng tuổi lúc quan sát được `ended` có thể
≥4800 (tick 38: 4986 ms), nên chỉ sửa production là chưa đủ: phân loại CAP cũng phải ghi nhận
"đuôi đóng vì ended" là kết cục hợp lệ (xem PREREG-M1 §3).

## 2. Fix production (đợt 111 M1)

### 2.1 Thiết kế: đóng đuôi sớm khi element chạm cuối clip THẬT

`nextResumeGraceTail97Y4` (playheadHold90R2.ts, thuần): thêm input tùy chọn `ended?: boolean`,
`duration?: number`; thêm hằng `PLAYHEAD_TAIL_ENDED_EPS_S = 0.1` (pin test); thêm cờ kết quả
`endedClosed?: boolean`. Đuôi đóng khi `ended === true` VÀ `currentCt >= duration − 0,1 s`
(và duration hữu hạn). Thứ tự đóng: `!playing || hasWatch` trước (watch mới tiếp quản thì lý do
là watch), rồi ended (TRƯỚC trần 5000 ms — đuôi đóng vì ended ở tuổi >5000 vẫn ghi đúng lý do),
rồi trần, rồi đếm advance như cũ.

Vì sao cần CẢ `ended` LẪN ct gần duration: `ended` có thể thoáng đúng giữa clip trong lúc seek/reset
(xem M4 đợt 85). Đóng đuôi oan lúc đó sẽ tắt ân hạn drift re-seek giữa lúc decoder chưa ổn định —
đúng ca f4 mà đuôi sinh ra để chặn. Flash giữa clip có ct xa duration nên không lọt; chỉ cuối clip
thật mới thỏa cả hai. Duration NaN/Infinity (live) → không đóng (fail-open, hành vi cũ).

Không che freeze thật: freeze ở ct=5,99 (1 frame trước cuối) có ended=false nên đuôi vẫn mở → vẫn
thành CAP nếu chạm trần không rearm (chính là CAP m1f4 §4.2 — chứng minh live luật này không che freeze).

### 2.2 File đổi (md5 mới)

- `apps/web/src/lib/playheadHold90R2.ts` (md5 `6721b9828429e61dc6eff7329d4e7309`):
  hằng `PLAYHEAD_TAIL_ENDED_EPS_S`, input `ended`/`duration`, cờ `endedClosed`, luật đóng M1 + header doc.
- `apps/web/src/lib/playheadHold90R2.test.ts` (md5 `d535e814e5c813913234734dc81020a0`):
  9 test M1 mới (M1-R1..R9), helper `tailStep` nhận thêm `ended`/`duration`.
- `apps/web/src/preview.tsx` (md5 `c4198206cb916c0f1c6d8996330335a1`, trước sửa `9b27abe57975ec5b69ec2e21c3fa281c`):
  bước đuôi truyền `ended: tailElVideo.ended, duration: tailElVideo.duration`; đếm
  `resumeTailEndedClosed111M1++` khi `stepped.endedClosed === true`; công bố hook
  `winHook.__vcutTailEndedClosed111M1` (khai báo kiểu + dọn khi unmount); không đổi gì khác.
- `apps/web/scripts/probe111m1.mjs` (MỚI, md5 `18f4e574246a485c9f84cb9b79edcfce`):
  bản sao probe104f5.mjs — scratch → hidden_files/round111-m1, CFG_DIR → /tmp/round111-m1,
  sampler lấy thêm `ended`/`dur`/`tailEndedClosed` mỗi velocity tick, sampler 100 ms lấy thêm
  `ended` mỗi element; vite tạm dùng `server.watch.ignored ["**/**"]` (0 inotify watch, theo L8).
  probe104f5.mjs KHÔNG sửa.
- Không đổi: luật Y4/B3/C3, trần 5000 ms, detector, restart-ended (H5), E4/N3/R2.

### 2.3 Kiểm chứng trên cây đã sửa (trước A/B)

- Unit test: `node --experimental-strip-types apps/web/src/lib/playheadHold90R2.test.ts` —
  **84 passed** (75 cũ + 9 M1 mới, xem §2.4).
- `npx tsc --noEmit` (apps/web): **exit 0** (~65 s).
- `npx vite build`: **exit 0** (built in 42,01 s; cảnh báo chunk > 500 kB là có sẵn từ trước).
- Analyzer M1 đã kiểm trước khi đo: Fisher tự tính (math.comb) tái hiện đúng p=0,2571 của L1
  (bảng [[1,178],[6,278]]) và Poisson P(0)=0,0228 / P(≤1)=0,1089; dry-run trên JSON l1f3 cũ
  (không có hook M1) cho đúng 1 CAP cả 2 luật, 0 ended-close — tương thích ngược.

### 2.4 Unit test M1 (9 test, đều xanh)

| test | nội dung | kết quả |
|---|---|---|
| M1-R1 | `PLAYHEAD_TAIL_ENDED_EPS_S = 0,1` (pin) | ✓ |
| M1-R2 | replay l1f3: ended + ct=duration ở tuổi 4777 ms → đóng + endedClosed=true | ✓ |
| M1-R3 | ended đúng nhưng ct xa duration (flash giữa clip) → KHÔNG đóng | ✓ |
| M1-R4 | ended đúng + ct cuối clip nhưng duration NaN → KHÔNG đóng (fail-open) | ✓ |
| M1-R5 | ended=false, ct=duration → KHÔNG đóng | ✓ |
| M1-R6 | ended ở tuổi >5000 ms → vẫn ghi endedClosed (lý do ended, không phải trần) | ✓ |
| M1-R7 | ended + watch mới arm cùng tick → đóng nhưng endedClosed=false (lý do watch) | ✓ |
| M1-R8 | không truyền ended/duration → hành vi cũ (tương thích ngược) | ✓ |
| M1-R9 | freeze thật 1 frame trước cuối (ct=5,99, ended=false) → đóng vì trần, endedClosed=false | ✓ |

Wiring trong `preview.tsx` (truyền ended/duration, đếm, công bố hook) không có unit test trực tiếp —
syncMedia/đường tick là nội bộ module preview, không import được trong node (cùng giới hạn L1 §2.3).
Wiring được kiểm bằng tsc + vite build + hook xuất hiện live với giá trị 0 trong A/B (§4.3:
probe đọc được `tailEndedClosed=0`, không phải null — chứng tỏ hook đã công bố).

## 3. Prereg M1 (viết trước lượt đo đầu — xem PREREG-M1.md đầy đủ)

- Cây đo đóng băng: preview.tsx md5 `c4198206cb916c0f1c6d8996330335a1`; probe111m1.mjs không sửa;
  webkit, loadN=4. Ma trận 2+2: m1f1 gop250, m1f2 gop30, m1f3 gop250, m1f4 gop30.
  Đối chứng: K1-on (6 CAP / 284 ticks), L1-fix (1 CAP / 179 ticks).
- Luật CAP M1 (§3 prereg): CAP = tuổi ≥4800 ms VÀ rearms không tăng ở tick sau span VÀ KHÔNG có
  ended-close ĐÃ XÁC MINH (bộ đếm tailEndedClosed tăng trong [tick cuối, +2] VÀ có tick trong
  [tick cuối −1, +1] với ended=true + ct ≥ dur − 0,1). Báo LUÔN CẢ số CAP theo luật cũ.
- **ĐÓNG** nếu: (a) 0 CAP theo luật M1; VÀ (b) không đuôi nào age ≥4800 thiếu cả rearm lẫn ended-close,
  paused < 20% mọi đuôi age ≥4000 ms; VÀ (c) mọi ended-close được loại đều có bằng chứng ended=true
  + ct ≥ dur − 0,1 ở tick đóng; VÀ (d) ≥1 ended-close có tuổi lúc đóng ≥4800 ms.
- **ĐÓNG CÓ ĐIỀU KIỆN** nếu (a)+(b)+(c) đạt nhưng (d) không (đường fix đã chạy nhưng chưa gặp đuôi ≥4800 ở biên).
- **KHÔNG ĐỦ BẰNG CHỨNG** nếu 0 CAP nhưng 0 ended-close nào.
- **KHÔNG ĐÓNG** nếu ≥1 CAP theo luật M1 (không chạy thêm lượt săn 0 CAP).
- Fisher 2 phía vs K1-on và vs L1-fix; p < 0,05 → đóng theo Fisher; 0 CAP nhưng p ≥ 0,05 →
  "ĐÓNG CÓ ĐIỀU KIỆN" theo điều khoản "0 CAP" + báo Poisson.

## 4. Kết quả A/B 2+2 trên cây đã sửa

Chạy 06:18:52–06:21:06Z 14/11/2026 (driver `run-m1-locked.sh` v2: lấy vite.lock 06:18:52Z sau khi
chuyển sang helper chuẩn `vcut-vite-lock.sh` poll 2 s — runner v1 thăm 60 s đã bỏ lỡ 21 cửa vì M7
nhả-giữ lại chỉ sau ~8 s; xem §7.2; cửa yên mở ngay; không reboot trong lượt đo; boot `73316ed9…`
suốt lượt). Cả 4 lượt exit 0, verdict PASS/PASS, md5 trước/sau = md5 M1-fix, mtime không đổi,
không pageErrs. **Tải nền rất cao**: load1 đầu lượt 37,23 / 22,08 / 12,60 / 8,17 (9 luồng đợt 111
chạy song song, khác hẳn L1: 1,04–2,35) — xem caveat §7.5.

| lượt | gop | tầng | RAM đầu (kB) | load1 | ticks | tails | CAP (M1) | CAP (luật cũ) | ages (ms) | rate | wall (ms) | frzMax | frzTail | frzPhAdv | ended-close |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m1f1 | 250 | H | 2.245.488 | 37,23 | 42 | 2 | 0 | 0 | — | 0,411 | 11.604 | 3.003 | 468 | 468 | 0 |
| m1f2 | 30 | H | 2.298.452 | 22,08 | 40 | 1 | 0 | 0 | — | 0,461 | 11.498 | 2.772 | 674 | 674 | 0 |
| m1f3 | 250 | J | 1.993.536 | 12,60 | 38 | 1 | 0 | 0 | — | 0,401 | 12.976 | 3.280 | 405 | 405 | 0 |
| m1f4 | 30 | J | 2.061.808 | 8,17 | 37 | 1 | **1** | **1** | **5.197** | 0,501 | 10.907 | 2.516 | 0 | 397 | 0 |
| **gộp** | | | | | **157** | **5** | **1** | **1** | | **0,436*** | | | **436,5*** | **436,5*** | **0** |

\* trung vị 4 lượt.
CAP/tick gộp = **1/157 = 0,0064** (K1-on: 6/284 = 0,0211; L1-fix: 1/179 = 0,0056).
CAP/lượt = 0,25 (K1-on 1,50; L1-fix 0,25).

### 4.1 Kiểm cơ chế (analyze-m1-mechanism.py, đuôi age >= 4000 ms)

| lượt | đuôi ended | age (ms) | rearm tick sau? | ended-close? | mẫu sampler | paused | ended_samples | skipTicks Δ (N3) | seeking? | renderTicks skipped |
|---|---|---|---|---|---|---|---|---|---|---|
| m1f3 | 5486 | 5.204 | **CÓ** (được cứu) | KHÔNG | 10 | 0 | 0 | 0 | không | 1/11 |
| m1f2 | 4775 | 5.104 | **CÓ** (được cứu) | KHÔNG | 14 | 0 | 0 | 0 | không | 7/15 |
| m1f4 | 3807 | 5.197 | **KHÔNG** → CAP | KHÔNG | 10 | 0 | 0 | 0 | không | 0/11 |

- **Cơ chế pause-deadlock vẫn chết**: element KHÔNG bị pause trong bất kỳ đuôi dài nào (0/34 mẫu gộp).
- **Đường cứu re-arm vẫn hoạt động**: 2/3 đuôi dài được cứu bằng rearm (m1f3 5.204 ms, m1f2 5.104 ms).
- **E4 vẫn bỏ vẽ**: m1f2 renderTicks 7/15 skipped trong khi skipTicks N3 đứng yên (Δ=0) và seeking=False;
  m1f4 0/11 skipped là đúng (element đồng bộ ở cuối đuôi, không drift cần E4 chặn).
- **`ended` KHÔNG BAO GIỜ đúng trong cả 4 lượt**: 0 velocity tick + 0 sampler sample nào có ended=true
  (max ct các lượt: 5,6667 / 5,9 / 5,9333 / 5,9667 — không lượt nào chạm 6,0). `restartV` cuối = 0 cả 4 lượt.
  **Fix chưa từng chạy live: ended-close = 0.**

### 4.2 CAP duy nhất (m1f4, age 5.197 ms) — cơ chế MỚI: freeze 1 frame trước cuối clip

Tái hiện từng tick (probe-results.json m1f4, clip duration 6 s, gop30):

- t=3807: ct burst 0,5667 → 1,1167, watch hết → đuôi Y4 mở (endedAtMs=3807).
- t=4195–9004: element **giải mã bình thường suốt đuôi**: ct 1,2 → 5,8667, ph 0,8 → 5,4667;
  mọi lần tăng đều bị C3 drift-gate reset (gate 0→8; 1 burst ở tick 24; 1 lần tăng được đếm ở tick 23
  rồi bị reset ngay tick sau) — cùng hình đuôi giữ-mở-bởi-B3/C3 như l1f3.
- t=9004 (tick 26): ct=5,8667, ph=5,4667, tuổi đuôi 5197 ms, **ended=False, dur=6**.
- t=9401 (tick 27): đuôi null — đóng vì chạm trần 5000 ms (9401−3807=5594). rearms 0→0 → **CAP**.
- t=9613–10910: ct nhích lên **5,9667 rồi ĐÓNG BĂNG tới hết lượt** (duration − 1 frame = 6,0 − 1/30);
  ended=False suốt; restartV=0; ph đóng băng 5,9667 (probe dừng phát khi localPh ≥ 5,0).

Vì sao fix không cứu được CAP này: element **không bao giờ chạm `ended`** — nó đóng băng ở 5,9667,
đúng 1 frame trước cuối clip, và không bắn sự kiện `ended`. Đây là quirk WebKit đã biết từ trước
(xem header `webkitLoopRestart80H5.ts`: "đóng băng ở cuối clip không bắn sự kiện `ended`").
Điều kiện kích hoạt của fix (`ended` đúng) không bao giờ thỏa, nên đuôi không thể đóng sớm —
đuôi chạm trần trong lúc element còn đang giải mã (ct vẫn tăng tới tick 26), rồi element mới đóng băng.

Khác l1f3 ở điểm quyết định: l1f3 ct chạm đúng 6,0 + restart seek bắn (restartV 0→1) — ended đã đúng;
m1f4 ct tối đa 5,9667 + restartV=0 — ended không bao giờ đúng. **Cùng hình đuôi (B3/C3 giữ mở tới
biên cuối clip), khác sự kiện cuối: ended-thật vs freeze-1-frame-trước-cuối.** CAP m1f4 KHÔNG phải
cuộc đua tail-ceiling vs restart-ended seek — nó là biến thể biên mới: tail-ceiling vs freeze-sát-cuối.

### 4.3 Wiring đã sống (bằng chứng gián tiếp fix đã vào cây đo)

Hook `__vcutTailEndedClosed111M1` được probe đọc là **0 (không phải null)** ở mọi velocity tick cả 4 lượt —
hook đã công bố, bộ đếm chạy, chỉ chưa có lần tăng nào vì chưa gặp ended. Không có bằng chứng nào cho
thấy wiring sai (nếu preview.tsx chưa nối, hook sẽ là null như trên cây cũ).

## 5. So sánh với K1 + L1 + Fisher

| chỉ số | Cây M1-fix (2+2) | L1-fix (2+2) | K1-on (E4 bật) | K1-off (E4 tắt) |
|---|---|---|---|---|
| CAP/tick (chính, luật M1) | **1/157 = 0,0064** | 1/179 = 0,0056 | 6/284 = 0,0211 | 0/159 = 0,0000 |
| CAP/tick (luật cũ, không loại ended-close) | **1/157 = 0,0064** | 1/179 = 0,0056 | 6/284 = 0,0211 | 0/159 = 0,0000 |
| CAP/lượt | 0,25 | 0,25 | 1,50 | 0,00 |
| CAP/40-ticks đầu | 1 (m1f4, tick 26) | 1 (l1f3, tick 39) | 3 | 0 |
| Fisher 2 phía vs K1-on | **p = 0,4297** (bảng [[1,156],[6,278]]) | p = 0,2571 | | |
| Fisher 2 phía vs L1-fix | **p = 1,0000** (bảng [[1,156],[1,178]]) | | | |
| Poisson P(0 CAP \| rate on) | 0,0363 (kỳ vọng 3,32) | 0,0228 | | |
| Poisson P(≤1 CAP \| rate on) | 0,1566 | 0,1089 | | |
| Poisson P(0 CAP \| rate L1-fix) | 0,4160 (kỳ vọng 0,88) | | | |
| rate trung vị | **0,436** | 0,452 | 0,151 | 0,424 |
| freeze-trong-đuôi-mở trung vị (ms) | **436,5** | 352 | 4.520 | 316 |
| đuôi dài được cứu bằng rearm | 2/3 | 3/4 | 0/4 | 3/3 |
| ended-close (đã xác minh) | **0** | — (chưa có fix) | — | — |
| mẫu paused trong đuôi dài | 0/34 | 0/60 | 88/91 | 0/36 |

- CAP/tick M1 (0,0064) ≈ L1-fix (0,0056); Fisher vs L1-fix p = 1,0000 — cây M1-fix
  **không phân biệt được với cây L1-fix** về CAP/tick. Giảm 3,3× so với K1-on nhưng Fisher
  p = 0,4297 (không < 0,05): n nhỏ + còn 1 CAP → không đủ power.
- Luật M1 và luật cũ cho CÙNG số CAP (1) — vì 0 ended-close nên không có gì để loại; thay đổi
  phân loại không ảnh hưởng kết quả đợt này (ghi rõ để khỏi nghi ngờ nới lỏng).
- Mọi chỉ số phụ vẫn ở phía nhánh off (rate 0,436 ≈ off 0,424; freeze-trong-đuôi 436,5 ms ≈ off 316 ms).

## 6. Verdict — KHÔNG ĐÓNG E4 (theo prereg)

Đối chiếu prereg §6 (đăng ký trước khi đo):

- (a) "0 CAP trong 2+2 lượt theo luật M1": **KHÔNG ĐẠT** — 1 CAP (m1f4, 5.197 ms).
- (b) "không đuôi nào age ≥4800 thiếu cả rearm lẫn ended-close": **KHÔNG ĐẠT** — m1f4 thiếu cả hai.
  "paused < 20% trong mọi đuôi age ≥4000 ms": **ĐẠT** (0% cả 3 đuôi).
- (c) "mọi ended-close được loại đều có bằng chứng": **không áp dụng** — 0 ended-close nào.
- (d) "≥1 ended-close có tuổi lúc đóng ≥4800 ms": **KHÔNG ĐẠT** — 0 ended-close.

**Verdict: KHÔNG ĐÓNG E4.** Prereg đòi 0 CAP; còn 1 CAP thì không được gọi là đóng.

Phải ghi rõ phần đã chứng minh được (đừng để verdict "không đóng" che mất):

1. **Fix đúng về mặt logic và đã vào cây đo**: unit test 9/9 (kể cả replay l1f3: ended + ct=duration
   ở tuổi 4777 ms → đóng + endedClosed=true); wiring đã sống (hook đọc được 0, không phải null);
   luật không che freeze thật — CAP m1f4 chính là bằng chứng live: freeze ở 5,9667 với ended=false
   KHÔNG bị fix đóng oan, đuôi vẫn mở tới trần rồi thành CAP đúng luật.
2. **CAP còn lại là nợ mới, không phải cuộc đua l1f3**: freeze 1 frame trước cuối clip, `ended`
   không bao giờ đúng (quirk WebKit đã biết từ H5). Fix đóng-đuôi-vì-ended không thể cứu ca này
   theo thiết kế — cần luồng riêng (đề xuất: xem đuôi có nên đóng khi ct đóng băng trong ~0,1 s
   cuối của duration mà không cần `ended`, hoặc phân loại CAP có nên miễn đuôi mà element đã tới
   trong 1 frame cuối clip — CHƯA thiết kế, chưa đo, không tự sửa ở đây; cả hai hướng đều có rủi
   ro che freeze thật nên phải đăng ký prereg riêng trước khi làm).
3. **Cuộc đua l1f3 (ended-thật) vẫn chưa được kiểm live**: 0/4 lượt có `ended` đúng — element
   thường đóng băng ở 5,9–5,97 hoặc bị probe dừng phát (localPh ≥ 5,0) trước khi chạm 6,0.
   Tần suất l1f3 (ct chạy trước ph ~0,77 s để chạm 6,0) có vẻ thấp hơn ước tính 1/4.
   Fix vẫn chỉ có bằng chứng unit test + wiring, chưa có bằng chứng A/B.

Bước tiếp (cho parent/đợt sau, không làm trong luồng này): luồng riêng xử lý freeze-sát-cuối
(1 frame trước duration, ended không bắn) + A/B xác nhận lại; hoặc chạy thêm lượt để bắt ca
ended-thật và kiểm fix live (prereg mới phải đăng ký trước: số lượt, tiêu chí ended-close);
hoặc user quyết "đóng có điều kiện" cho phần ended-thật của E4.

## 7. Giới hạn — những gì KHÔNG làm được / chưa chứng minh

1. Wiring trong `preview.tsx` không có unit test trực tiếp (như L1 §2.3 — cùng giới hạn).
2. So sánh Fisher dùng baseline LỊCH SỬ (K1-on, L1-fix — không chạy lại nhánh cũ cùng đợt).
3. **Fix chưa từng chạy live**: 0 ended-close trong 2+2 lượt — đường code `endedClosed` chỉ được
   chứng minh bằng unit test + hook tồn tại, chưa có lần kích hoạt thật nào trên WebKit.
   Không được nói "fix đã hoạt động ngoài đời".
4. CAP m1f4 là cơ chế mới (freeze 1 frame trước cuối clip) — chưa có thiết kế sửa; không tự sửa ở đây.
5. **Tải nền rất cao trong lượt đo**: load1 đầu lượt 37,23 / 22,08 / 12,60 / 8,17 (L1: 1,04–2,35)
   vì 9 luồng đợt 111 chạy song song (load test + probe). rAF gap max 588–696 ms (L1: ~200–400 ms).
   Tải cao có thể làm tăng burst (B3/C3 reset) và kéo dài đuôi — không tách được ảnh hưởng của tải
   khỏi số CAP với n=2+2. RAM vẫn trong tầng hợp lệ (H/H/J/J), không có lượt ngoài tầng.
6. n = 2+2 nhỏ; Fisher vs baseline lịch sử — p = 0,4297 / 1,0000 không có ý nghĩa thống kê;
   verdict "không đóng" dựa trên điều khoản "0 CAP" đã đăng ký trước, không dựa trên Fisher.
7. Probe111m1 lấy mẫu `ended`/`dur` mới — trên cây cũ các trường này là null (đã kiểm bằng dry-run
   trên l1f3: analyzer vẫn cho đúng 1 CAP cả 2 luật). Không dùng ct=6,0 để suy diễn ended.
8. Không đo TTS/birefnet; không đụng workflows/cloud/collab; không push; không release/tag.
   Chỉ M1 sửa production đợt này.

## 8. Hạ tầng trong đợt

- Reboot #40 05:16:36Z (boot `73316ed9-3823-4512-a52d-3cc5d455a6fd`), gap #39→#40 ≈ 2h25'48" —
  **không phá sàn 19'07"** (sàn vẫn [19'07", 3h14'08"]). Postboot-check PASS 05:44Z (apt đủ
  10 package WebKit/GST, plugin hệ thống 269 file, wrapper đã vá K1) — WebKit chạy được ngay,
  không cần vá tay sau reboot này (đường bền vững của L8 đã có tác dụng).
- Vite lock: runner v1 (thăm 60 s) bỏ lỡ 21 cửa vì M7 nhả-giữ lại chỉ sau ~8 s (đúng mẫu M8 đã
  ghi trong `vcut-vite-lock.sh` spec §6); đã dừng runner v1, chuyển sang helper chuẩn
  `vcut-vite-lock.sh` (poll 2 s, owner pid=$$ của driver) và lấy được lock 06:18:52Z.
  Lock nhả sạch sau lượt đo (release m1 06:21:06Z); m5 giữ tiếp 06:21:07Z. Vite tạm của probe
  dùng `watch.ignored ["**/**"]` (0 watch) — không ENOSPC trong lượt đo.
- Không có vite mồ côi sau lượt đo (probe tự kill vite/bridge/Xvfb khi xong — cleanup trong probe).
- Không đo TTS/birefnet; không đụng workflows/cloud/collab; không push; không release/tag.

## 9. File / stage

- LIMITS này: `docs/PHASE9_ROUND111_M1_TAILCEILING_LIMITS.md`
- Prereg: `hidden_files/round111-m1/PREREG-M1.md` (viết trước lượt đo đầu).
- Trạng thái: `hidden_files/round111-m1/round111-m1-status.md`.
- Dữ liệu đợt này: `hidden_files/round111-m1/` (run-m1.log, wait-quiet-m1.log,
  run-m1-locked.sh (v2), run-m1.sh, wait-quiet-m1.sh, postboot-check.log, tsc.log,
  vite-build.log, md5-fixed.txt, analyze-m1-cap-pattern.py + cap-pattern.out +
  cap-pattern-rows.json, analyze-m1-mechanism.py + mechanism.out + mechanism-rows.json,
  probe-webkit-load4-gop*-m1f*/probe-results.json + probe-log.txt) — ngoài repo, không stage qua paths-loop.
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round111-m1-tailceiling.txt`
  — 5 file (preview.tsx + playheadHold90R2.ts + playheadHold90R2.test.ts +
  probe111m1.mjs + LIMITS này), NUL-delimited, đã verify read-back.
