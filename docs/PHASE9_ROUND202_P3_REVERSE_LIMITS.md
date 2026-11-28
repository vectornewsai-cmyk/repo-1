# PHASE9_ROUND202_P3_REVERSE_LIMITS.md — P3 đợt 202: triển khai C3-loop sửa hold-mute

**Verdict: C3-LOOP ĐÃ TRIỂN KHAI VÀO CODE SẢN PHẨM + ĐO LẠI THẬT — IM LẶNG DÀI HẾT.**
Sim replay tick headed 201 qua wiring thật mới cho gap list KHỚP TỪNG SỐ với
bản thí nghiệm C3-201 (tổng im lặng trừ startup 112,5 ms, max 31,5 ms — so
với hành vi cũ A: 768,5 ms / 654,6 ms). Headed chirp 202: 0 record RMS=0
sau tiếng đầu (201: 29 record, lõi im lặng tuyệt đối ~430 ms); headed
longA 202: 1 record RMS=0 (201: 363 record, chuỗi dài nhất 164 record).
holdCapStop 5 → 0 (chirp 1 → 0); loop restart kích 1 lần (chirp) + 10 lần
(longA, đúng nhịp 0,5 s trong 2 hold dài 1,9 s + 3,4 s ctxT). Drift chirp
ĐẠT (median 0,074 / p90 0,189 / max 0,444 s, bar 0,5 s). N11b: partial
engage cả 2 pass; decode cửa sổ đầu chirp 3.974 ms ĐẠT (bar 5.000 ms),
longA 11.902 ms VƯỢT bar dưới tải nặng (load 7–8) — xem §4. Gap nối đoạn
plain-restart (F-201-P3-2) xác nhận bằng headed: ngắn (ước lượng cửa sổ
10–50 ms), kích thước chính xác từ sim WAV 8,3–31,5 ms — vẫn nghe được,
còn nợ hướng sửa.

Đợt 202 mở lượt cron 03:35 +07 28/11/2026. Quyết parent (a6)-201: hướng
sửa hold-mute = C3-LOOP (P3-202 triển khai); lai chỉ là fallback nếu C3
không triển khai được. C3 TRIỂN KHAI ĐƯỢC — không dùng fallback.

## §1. Triển khai C3-loop vào code sản phẩm

### 1.1 Thay đổi code (`apps/web/src/lib/reverseAudioWiring.ts`)

Nhánh hold của `tickInner` trước đây: đoạn hết hạn giữa hold thì return
sớm, không restart (H1 — gây im lặng 655–690 ms đợt 201); giữ quá 0,3 s
thì cap-stop dừng đoạn. Nay (quyết (a6)-201):

- **Loop restart trong tick hold:** với mỗi slot đang phát, nếu đoạn đã
  hết hạn (`currentTime >= segStartCtxSec + segLengthSamples / (sr ×
  segRate)`) thì `playSegment` lại **cùng đoạn** (`startSample` giữ
  nguyên = `segStartSample`, gain cũ `lastGain`, rate cũ) ngay trong
  tick hold đó. Chỉ lặp khi đoạn ĐÃ hết hạn; đoạn còn hạn thì giữ phát
  như cũ (`holdKeep`). `playSegment` xử lý đoạn cũ đã hết (không chồng
  tiếng — xem `reverseAudio.ts` playSegment, đoạn cũ hết tự nhiên).
- **Bỏ cap-stop 0,3 s:** lặp không làm drift tăng (tiếng quay lại đầu
  đoạn 0,5 s) nên trần 0,3 s không còn lý do tồn tại. Counter
  `holdCapStop` giữ lại (luôn 0 từ đợt này — probe đọc tương thích);
  hằng `REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC` giữ lại dạng legacy (= 0,3,
  code không dùng nữa).
- **Counter mới `holdLoopRestart`:** số lần lặp đoạn giữa hold.
- **`PlayerSlot.lastGain`:** gain lần phát đoạn gần nhất — tick hold
  lặp đoạn dùng lại gain này (nhánh hold không có entry/gain mới).
- **Hết giữ:** playhead bước tiếp → `tickEntry` re-sync bằng restart
  (lệch > dung sai 0,12 s) hoặc restart-exact — không đổi.

Giá phải trả (đã nêu ở LIMITS 201 §7, parent đã chấp nhận khi chọn C3):
tiếng lặp 0,5 s trong hold dài (nghe như vấp/lặp — liên tục, không đứt
quãng). C1-cont chỉ rút 655 → 447 ms nên không chọn; lai không cần dùng.

### 1.2 Cập nhật test cũ (hợp đồng cap-stop đã bị thay thế)

Ba test mã hoá hợp đồng cũ (a2)-193/(a4)-195 "giữ quá 0,3 s thì cap
dừng" được cập nhật sang hợp đồng C3 (quyết (a6)-201 thay thế, ghi rõ
trong từng test): `reverseAudio194P3.test.ts` (hold-cap → hold-loop),
`reverseAudio195P3.test.ts` (holdMaxSec + lặp), `reverseAudio196P3.test.ts`
(cap 0,3 s → loop; test "trần tuyệt đối" → drift trong hold bị chặn bởi
độ dài đoạn lặp 0,5 s, không tăng theo thời gian giữ). Đây là thay đổi
hành vi CÓ CHỦ ĐÍCH theo quyết parent, không phải hồi quy.

## §2. Kiểm chứng port: sim replay tick headed 201 qua wiring thật

`sim202.ts` (scratch, `hidden_files/round202-p3/`): replay ĐÚNG 789 record
tick headed chirp 201 (578 tick, 260 hold) qua class `ReverseAudioWiring`
THẬT (nay đã tích hợp C3-loop), render WAV, đo gap list bằng cùng code
đo của sim201b — so với số C3-loop của bản thí nghiệm 201.

| Biến thể | gap ≥ 2 ms | tổng im lặng* | max gap | holdLoopRestart | holdCapStop |
|---|---|---|---|---|---|
| A-201 (hành vi cũ, đối chiếu) | 6 | 768,5 ms | **654,6 ms** @ph 66,6 | — | 1 |
| C3-exp-201 (bản thí nghiệm) | 7 | 112,5 ms | 31,5 ms | — | 0 |
| **C3-real-adv (wiring thật, adv-first)** | **7** | **112,5 ms** | **31,5 ms** | **3** | **0** |
| **C3-real-hold (wiring thật, hold-first)** | **5** | **48,6 ms** | **17,8 ms** | **2** | **0** |

\* Tổng trừ gap khởi động (load cửa sổ 207,6 ms).

- **C3-real-adv KHỚP TỪNG SỐ với C3-exp-201:** cùng 7 gap, cùng
  startMs/durMs/phAt tới 0,1 ms — (0; 207,6), (1357,7; 31,5),
  (3148,5; 17,8), (3665,9; 13,5), (4841,4; 14,1), (7804,1; 27,3),
  (9519,5; 8,3); counters khớp hết (tick 578=578, holdStop 260=260,
  holdKeep 254, playOk 28, restart 21, restartExact 3, playFalse 0) —
  **port chính xác, không sai khác hành vi so với thí nghiệm.**
- Thứ tự hold-first cho tổng còn thấp hơn (48,6 ms) — gap ngắn nhạy với
  cấu trúc tick dưới 100 ms như 201 đã ghi; gap lớn robust qua cả 2
  thứ tự. Kết luận chung: im lặng dài hết; tổng im lặng −85% so với A.
- Gap còn lại (8,3–31,5 ms) đều là gap nối đoạn plain-restart
  (F-201-P3-2) — xem §5.

## §3. Headed 202: chirp + longA sau C3-loop

Probe `benchmarks/reverse202/audio-probe-202.mjs` (bản sao probe 201, chỉ
đổi thư mục ra + tên file). 2 pass, port/CDP/profile riêng, nối tiếp.

| Pass | Bundle | Records | Sounding | ph đi | holdMaxSec | holdCapStop Δ | holdLoopRestart Δ | playFalse |
|---|---|---|---|---|---|---|---|---|
| chirp-70s, 14 s, fft 8192 | index-2ABRRWrg.js (build của P3-202) | 591 | 446 | 66,83→58,50 | 0,749 s | **0** (201: 1) | **1** | 0 |
| longA-300s GOP300 720p, 40 s, fft 2048 | index-FqY8HE0R.js (xem caveat §6.1) | 773 | 500 | 298,40→281,20 | 3,750 s | **0** (201: 5) | **10** | 0 |

### 3.1 Im lặng tuyệt đối: hết (thước quyết định)

Đếm record RMS == 0 **sau tiếng đầu** (cùng thước cả 2 đợt):

| Pass | 201 | 202 |
|---|---|---|
| chirp | 29 record, chuỗi dài nhất **29 record liên tiếp** (~430 ms lõi im lặng tuyệt đối, idx 237–265) | **0 record** |
| longA | 363 record, chuỗi dài nhất **164 record liên tiếp** | **1 record** (idx 606, đơn lẻ — xem §3.3) |

### 3.2 Chirp 202 chi tiết

- Drift peakHz/ph: median **0,074** / p90 **0,189** / max **0,444 s**
  (bar 0,5 s — ĐẠT; 201: 0,048 / 0,137 / 0,344). Recorder đói hơn 201
  (138 khoảng > 30 ms, max 209,3 ms; load lúc mở 5,69 vs 3,03).
- Mute events (p_zcr > 0,05, gộp mẫu kề — cùng thước 201): **4** (201: 6).
  ev1 = transient khởi động (load cửa sổ, loại như 201). **ev2 là điểm
  H1 đợt 201** (hold 769 ms ctxT, seg_end 5,893 trong hold): loop restart
  kích ở ctxT 5,982 (ΔholdLoopRestart>0 tại idx 176) — pmax chỉ 0,263
  (~49 ms/window, thước cửa sổ 186 ms nhòe), KHÔNG có record rms<0,1;
  gap thật tại điểm này theo sim = **17,8 ms** (thay vì 690 ms đợt 201).
  ev3/ev4: sự kiện nhỏ ngoài hold (~22/~31 ms/window) — gap nối đoạn,
  xem §5.
- Counters Δ: tick 494, holdStop 224, holdKeep 170, restart 12,
  restartExact 5, playOk 19, playFalse 0, playClamped 0.
  `lastWindowDecodeMs` **3.974 ms** ≤ bar 5.000 ms (201: 1.840 ms —
  chậm hơn do tải cao hơn); load cửa sổ đầu 4.274 ms (201: 2.055 ms).
  Partial engage (Δpartial=1, Δfull=0, ΔpartialFail=0).

### 3.3 LongA 202 chi tiết

- **10 loop restart, đúng nhịp 0,5 s ctxT** (idx 411/438/462/487/521/
  542/574/592/607/628 — ctxT 15,462 → 20,352) trong 2 hold dài:
  hold run ctxT 15,270–17,151 (1.881 s) + 17,220–20,622 (3,402 s).
  Dưới code cũ, hold thứ hai với seg_end 18,211 sẽ im lặng tới
  20,622 = **2,411 s**; với C3, loop kích 5 lần trong hold đó, tiếng
  không đứt (chỉ còn các join gap ngắn, xem §5).
- Drift peakHz/ph: median **0,159** / p90 **0,537** / max **0,696 s**
  (201: 0,119 / 0,437 / 0,678) — median trong bar; p90/max vượt bar
  nhưng cùng lớp artifact như 201 (xem §4.2).
- Mute events: **17** (201: 12) nhưng pmax ≤ 0,596, KHÔNG sự kiện nào
  có chuỗi rms<0,1 (201 có 2 sự kiện lớn 109/168 ms trong hold sau cap).
  Record RMS=0 duy nhất (idx 606, ctxT 19,792): đoạn hết hạn ở seg_end
  19,761, loop restart đầu tiên quan sát được ở record idx 607 (ctxT
  19,862) — **dư tối đa ≤ 101 ms ctxT** (cận trên theo timestamp record,
  có độ xê dịch ±1 khoảng record; gap thật theo sim ở nhịp tick thường
  là ~18 ms). Nguyên nhân dư: tick bị đói dưới tải nặng (recorder
  median 24,6 ms, max 1.573,6 ms; load 7,14→8,31) nên tick hold kích
  loop tới muộn. **Dư của C3 = 1 khoảng tick, KHÔNG tăng theo độ dài
  hold** (hold 3,4 s cũng chỉ dư tối đa ~1 tick) — khác hẳn hành vi cũ
  (im lặng dài bằng cả thời gian hold còn lại).
- Counters Δ: tick 572, holdStop 371, holdKeep 177, restart 49,
  restartExact 0, playOk 60, playFalse 0, playClamped 0.
  `lastWindowDecodeMs` **11.902 ms** > bar 5.000 ms (201: 6.401 ms) —
  xem §4.1. Load cửa sổ đầu 14.512 ms (201: 8.215 ms). Partial engage
  (Δpartial=1, Δfull=0, ΔpartialFail=0). Không có rebuild nào trong cả
  2 pass (windowRebuilds Δ=0 — playhead chưa tới ngưỡng preload).

## §4. Harness lại N11a/N11b

### 4.1 N11b (partial decode) — chirp ĐẠT, longA VƯỢT bar dưới tải nặng

- Partial engage: cả 2 pass Δpartial=1, Δfull=0, ΔpartialFail=0 —
  **đường partial hoạt động in-app, không rơi về full decode.**
- Decode cửa sổ đầu (`lastWindowDecodeMs`): chirp **3.974 ms ≤ 5.000 ms
  ĐẠT**; longA **11.902 ms > 5.000 ms**. LongA chạy dưới tải 7,14→8,31
  (gấp ~2–3× tải longA 201: 3,3→2,3; lúc đó đã 6.401 ms) — decode chậm
  theo tải, không phải hồi quy code (cùng đường partial, 0 fail; P1/P2/
  P4/T8 cùng chạy build/headed song song trong lượt). **N11b verdict:
  parent quyết** — P3 báo cáo: chirp ĐẠT, longA CHƯA ĐẠT về thời gian
  dưới tải này; cần đo lại dưới tải thường để kết luận (nợ).
- Không đo được thời gian rebuild (windowRebuilds 0 cả 2 pass).

### 4.2 N11a (drift) — chirp ĐẠT; longA median ĐẠT, p90/max vượt bar (artifact)

- Chirp: median 0,074 / p90 0,189 / max 0,444 s — **ĐẠT cả 3 thước.**
- LongA: median 0,159 s (trong bar); p90 0,537 / max 0,696 s (vượt
  bar). Cùng lớp artifact như 201 §4.3 (peakHz đóng băng sau im lặng,
  bin thô 21,5 Hz ở fftSize 2048, recorder đói — median khoảng mẫu
  24,6 ms, max 1.573,6 ms) **cộng thêm yếu tố mới của C3: trong hold,
  peakHz quay vòng trong đoạn lặp 0,5 s trong khi playhead đứng yên,
  nên drift suy từ peakHz không còn là đồng hồ sạch trong hold dài.**
  (a5)-201 đã cho longA ĐẠT theo ngoại lệ mở rộng; số 202 cùng tầm
  (median 0,159 vs 0,119 — dưới tải gấp 2–3×). **Verdict N11a-longA:
  parent quyết (qua harness P4)** — P3 chỉ cung cấp số đo; muốn verdict
  chặt cần thước drift cấp waveform (không qua peakHz) — nợ.

## §5. F-201-P3-2 — gap nối đoạn plain-restart: XÁC NHẬN bằng headed

- Headed: tại các điểm nối đoạn ngoài hold (chirp ev3/ev4, longA
  ev15–17) chỉ còn sự kiện p_zcr ngắn (~10–50 ms/window, 1–8 record),
  không có im lặng kéo dài, không có record rms<0,1 — **khớp bản chất
  join gap ngắn, không phải hold-mute.**
- Kích thước chính xác (sim WAV, sample-accurate, wiring thật):
  các gap còn lại sau C3 là **8,3–31,5 ms** (C3-real-adv, trừ startup).
  Cập nhật khoảng 201 (sim B: 6,8–25,1 ms) thành **~8–32 ms** — gap
  31,5 ms @ph 68,63 là plain restart (không phải restart-exact), có
  mặt giống hệt ở cả C3-exp và C3-real.
- **Kết luận: F-201-P3-2 ĐÃ XÁC NHẬN — gap nối đoạn 8–32 ms, vẫn nghe
  được (≫ ngưỡng tai 3 ms), ~1 lần/s khi phát ngược.** Hướng sửa vẫn
  mở: cho plain restart bắt đầu sớm như restart-exact (chồng crossfade)
  hoặc rút ngắn khoảng tick — quyết thuộc parent, nợ đợt sau (không
  làm trong đợt này để giữ phạm vi C3-loop).

## §6. Kiểm chứng độc lập + hạn chế

### 6.1 Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (đã sửa 1 lỗi TS6133 tham số
  thừa `t` trong test 202 mới — bẫy như đợt 201 bỏ helper `ok` thừa).
- `npx vite build`: **PASS 11,18 s**, bundle mới `index-2ABRRWrg.js`
  (1.753,77 kB).
- Unit test mới `reverseAudio202P3.test.ts`: **7/7 PASS** (lặp cùng đoạn
  khi hết hạn giữa hold; hold dài 1,6 s lặp 3 lần, không cap-stop; lặp
  dùng lại gain cũ; resume bước nhỏ keep không hở; resume nhảy xa
  re-sync restart; hold không đoạn active không crash; playSegment
  clamp đúng khi đoạn lặp chạm cuối buffer).
- Test cũ đã cập nhật: 194: **6 PASS**, 195: **3 PASS**, 196: **5 PASS**,
  201: **10 PASS**.
- Toàn bộ suite reverse: **215 test PASS** (192: 12, 193: 15, 194: 6,
  195: 3, 196: 5, 197: 6, 198: 14, 199: 11, 201: 10, 202: 7,
  reverseAudio: 7, reversePlayback*: 66, reverseCadence: 9,
  reverseDecodeAhead: 12, reverseRangeGate: 20, reversePreviewGate: 12).
- Không phải hồi quy do P3-202 (ghi rõ để T10 khỏi nhầm): 10 file test
  lỗi khi chạy bằng node thô (`ERR_MODULE_NOT_FOUND` — import tương đối
  không đuôi, cần vitest/bundler; 0 tham chiếu tới wiring) và 2 test
  i18n đạt 2/3 khi chạy từ repo root (test rớt là "vi/en parity toàn
  file" — tập key vi/en giống hệt nhau; P3-202 không chạm file i18n
  nào). Cả hai đều có từ trước, không liên quan wiring.

### 6.2 Hạn chế & caveats (đọc trước khi dùng số liệu)

1. **Pass longA chạy trên bundle của luồng khác:** giữa 2 pass headed,
   một luồng đợt 202 khác đã rebuild vite lúc 20:57Z (bundle
   `index-FqY8HE0R.js`, md5 1991ebec01d263ff26ef040c926b16e6) thay bundle
   của P3 (`index-2ABRRWrg.js`) trong `dist/` — pass longA chạy trên
   bundle đó. Đã xác minh bundle này **có chứa code C3** (chuỗi
   `holdLoopRestart` trong bundle + counters headed `holdLoopRestart
   Δ=10, holdCapStop Δ=0`) nên số đo longA vẫn đo đúng C3; nhưng bundle
   có thể chứa thêm thay đổi của luồng khác (P1 notch / P2 cap — không
   chạm reverse audio). Pass chirp chạy đúng bundle của P3.
2. Thước p_zcr headed bị nhòe bởi cửa sổ analyser (186 ms chirp /
   46 ms longA) + khoảng mẫu recorder — chỉ dùng để khẳng định "không
   còn im lặng dài"; kích thước gap chính xác lấy từ sim WAV (§2).
3. Sim replay ở độ phân giải record (~18 ms): gap lớn robust qua cả 2
   thứ tự tick; gap ngắn nhạy với cấu trúc tick (adv 112,5 ms vs hold
   48,6 ms tổng trừ startup) — cả hai đều ≪ 768,5 ms của A.
4. Dư của C3 = 1 khoảng tick: dưới tải nặng, tick đói có thể làm dư
   tới ~100 ms (longA ev13, cận trên theo timestamp record) — xem §3.3.
   Muốn siết dư này cần rút ngắn khoảng tick hoặc hẹn loop restart theo
   đồng hồ audio (setTimeout tại segEnd) — nợ thiết kế, chưa làm.
5. LongA 202 chạy dưới tải nặng (load 7–8) — decode/drift/recorder đều
   chậm hơn 201; so sánh 201↔202 ở longA phải tính yếu tố tải.
6. N11a-longA / N11b-longA: verdict thuộc parent (qua harness P4) —
   P3 chỉ báo cáo số đo (§4).

## §7. Nợ còn lại

- (r)-201 giao: triển khai C3-loop → **XONG (§1–§3)**; harness lại
  N11a/N11b trên dữ liệu P3-201 → **XONG (§4 — số đo đã có; verdict
  thuộc parent/P4)**; xác nhận gap nối đoạn plain-restart bằng headed →
  **XONG (§5 — 8–32 ms, vẫn nghe được)**.
- Nợ mới/chuyển tiếp:
  1. N11b longA: đo lại decode cửa sổ đầu dưới tải thường (11.902 ms
     dưới tải 7–8 chưa kết luận được).
  2. F-201-P3-2: sửa gap nối đoạn 8–32 ms (plain restart bắt đầu sớm
     như restart-exact, hoặc rút ngắn khoảng tick) — cần quyết parent.
  3. N11a-longA: thước drift cấp waveform (thay peakHz) nếu muốn verdict
     chặt — peakHz không còn là đồng hồ sạch trong hold dài có lặp.
  4. (Tùy chọn) Siết dư C3 dưới tải nặng: hẹn loop restart theo đồng hồ
     audio thay vì chờ tick hold (dư hiện ~1 khoảng tick, tới ~100 ms
     khi tick đói).

## §8. File & bằng chứng

- LIMITS này: `docs/PHASE9_ROUND202_P3_REVERSE_LIMITS.md`
- Code C3-loop: `apps/web/src/lib/reverseAudioWiring.ts`
- Test mới: `apps/web/src/lib/reverseAudio202P3.test.ts` (7 test)
- Test cũ cập nhật hợp đồng C3: `reverseAudio194P3.test.ts`,
  `reverseAudio195P3.test.ts`, `reverseAudio196P3.test.ts`
- Probe headed 202: `benchmarks/reverse202/audio-probe-202.mjs`
- Scratch (không stage): `hidden_files/round202-p3/` — `sim202.ts` +
  `sim202-summary.json` + `sim201b-C3-real-*.wav` + `*-sources.json`,
  `analyze202.py`, `audio-probe-202-*.json` (chirp 591 records +
  longA 773 records), `audio-probe-202.mjs` (bản chạy), `probe-202-*.log`.
- Dữ liệu gốc đối chiếu: `hidden_files/round201-p3/audio-probe-201-*.json`,
  `hidden_files/round201-p3/sim201b-summary.json`.
