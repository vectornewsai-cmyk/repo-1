# PHASE9_ROUND203_P3_LIMITS.md — P3 đợt 203: sửa gap nối đoạn plain-restart (F-201-P3-2) + đo lại N11b-longA dưới tải thường

**Verdict: F-201-P3-2 ĐÃ SỬA XONG + ĐO LẠI THẬT — GAP NỐI ĐOẠN HẾT (dưới tải thường). N11b-longA ĐẠT dưới tải thường.**
Sim replay tick headed 201 qua wiring thật sau sửa: **0 gap ≥ 2 ms ngoài startup** (cả 2 thứ tự tick) — trước sửa 112,5 ms / 48,6 ms (7/5 gap, max 31,5 ms). Headed chirp 203 (tải 1,2): **1 sự kiện mute duy nhất là transient khởi động; 0 record rms<0,1 sau khởi động** (202: 4 sự kiện gồm gap nối đoạn); restartExact Δ=19 (202: 5). Headed longA 203 chạy lại dưới tải thường (1,06→1,11): **decode cửa sổ đầu 2.798 ms ≤ bar 5.000 ms — N11b-longA ĐẠT** (201: 6.401 ms, 202: 11.902 ms, đều dưới tải nặng); decode rebuild 3.119 ms (cũng ≤ bar, lần đầu đo được); **0 record RMS=0 sau tiếng đầu** (202: 1; 201: 363); drift 0,115/0,289/0,470 s ĐẠT cả 3 thước. Test mới 12/12 PASS; suite reverseAudio\* 109 PASS; tsc 0 lỗi (kiểm lần cuối); vite build PASS 11,81 s (bundle index-By2X_OPP.js).

Đợt 203 mở lượt cron 06:35 +07 28/11/2026 (run 213). Quyết parent (a6)-202: "F-201-P3-2: TRIỂN KHAI SỬA, không giữ nợ" + "bar 5.000 ms chỉ áp cho tải thường; P3-203 đo lại N11b-longA dưới tải thường".

## §1. Sửa F-201-P3-2 — nguyên nhân + 2 điểm sửa

### 1.1 Nguyên nhân (xác minh lại trước khi sửa)

Gap nối đoạn 8–32 ms có từ sim B đợt 201 (không hold: 10 gap 6,8–25,1 ms) và
được headed 202 xác nhận (gap còn lại sau C3: 8,3–31,5 ms). Cơ chế, đọc
từ `shouldRestartReverseSegment` (`reverseAudioWiring.ts`):

- Đoạn sắp hết (còn < overlap 0,1 s) mà lệch |pos − expected| ≤
  exact-tol (0,05 s) → "restart-exact": đoạn mới bắt đầu NGAY, chồng
  crossfade lên đuôi đoạn cũ → không gap.
- Nhưng lệch 0,05–0,12 s trong cửa sổ overlap → "keep": đoạn hết rồi
  tick SAU mới "restart" (re-sync) → gap = độ trễ tick sau khi đoạn hết
  (8–32 ms đo thật, ~1 lần/s khi phát ngược).
- Drift thật ở pass headed 201: median 0,048 s — ngay tại biên 0,05 s,
  nên đa số tick trong cửa sổ overlap rơi vào khoảng 0,05–0,12 s:
  headed 201 chỉ có 2 restart-exact / 20 lần nối đoạn; sim 202 chỉ có
  3–4 restart-exact / 21 restart. **Exact-tol 0,05 s là nút thắt.**

### 1.2 Điểm sửa 1 — restart-exact nới lệch lên bằng dung sai drift

`REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC`: 0,05 → **0,12 s**
(= `REVERSED_AUDIO_DRIFT_TOLERANCE_SEC`, định nghĩa bằng hằng đó để
bất biến không trôi — test 203 kiểm tra bằng nhau). Hệ quả: mọi tick
trong cửa sổ overlap 0,1 s trước khi đoạn hết đều khởi đoạn mới NGAY
(restart-exact nếu lệch trong dung sai, restart re-sync nếu lệch quá)
— không còn "keep tới hết rồi restart sau khi đoạn đã hết". Lệch giữ
lại sau nối đoạn bị chặn bởi dung sai 0,12 s (như restart-exact cũ);
muốn re-sync thì đợi drift vượt dung sai ở tick sau (hành vi cũ).

Giá phải trả (ghi rõ, đã đo ở §2.3): nối đoạn không còn reset drift về
~0 như restart re-sync cũ — drift tồn tại qua các lần nối, nên drift
trung vị đo bằng peakHz tăng (chirp 0,074 → 0,130 s, §3.1) — vẫn trong
bar 0,5 s với biên lớn, và bị chặn bởi dung sai 0,12 s ở mỗi lần nối.

### 1.3 Điểm sửa 2 — C3-loop trong hold lặp SỚM

Nhánh hold của `tickInner` trước đây chỉ lặp khi đoạn ĐÃ hết hạn
(`currentTime >= segEnd`) — chờ hết hạn thì gap nối đoạn trong hold =
độ trễ tick (sim 202: 2 gap 17,8 ms + 13,5 ms @ph 66,6 trong hold dài).
Nay: lặp SỚM khi đoạn còn < overlap 0,1 s (`currentTime >= segEnd −
REVERSED_AUDIO_OVERLAP_SEC`), cùng nguyên tắc "bắt đầu đoạn mới trước
khi đoạn cũ hết" như restart-exact. Lặp cùng đoạn nên drift không tăng;
chu kỳ lặp ngắn lại tối đa 0,1 s (0,4–0,5 s thay vì đúng 0,5 s — chỉ là
nhịp lặp, playhead đang giữ nên không lệch đồng bộ; hết giữ re-sync
như cũ). Đuôi đoạn (tối đa 0,1 s) bị mờ dần/cắt mỗi lần lặp — cùng lớp
artifact "tiếng lặp" của C3 đã được parent chấp nhận, chỉ sớm hơn.

Gap chỉ còn khi KHÔNG có tick nào trong cửa sổ overlap 0,1 s (tick đói
dưới tải nặng) — khi đó đoạn hết rồi tick sau mới restart, gap = độ trễ
tick đói (xem §3.3 + caveat §7.1).

## §2. Kiểm chứng sim: replay tick headed 201 qua wiring thật sau sửa

`sim203.ts` (scratch, `hidden_files/round203-p3/`): replay ĐÚNG 789 record
tick headed chirp 201 qua class `ReverseAudioWiring` THẬT (nay đã sửa),
render WAV, đo gap list bằng cùng code đo của sim201b/sim202 — so với
số wiring thật đợt 202 (trước sửa).

### 2.1 Gap list — hết gap nối đoạn (cả 2 thứ tự tick)

| Biến thể | gap ≥ 2 ms | tổng im lặng* | max gap* | restart | restartExact | holdLoopRestart | playOk |
|---|---|---|---|---|---|---|---|
| C3-real-adv 202 (trước sửa) | 7 | 112,5 ms | 31,5 ms | 21 | 3 | 3 | 28 |
| **C3-real-adv 203 (sau sửa)** | **1** | **0 ms** | **0 ms** | 18 | **9** | **6** | 34 |
| C3-real-hold 202 (trước sửa) | 5 | 48,6 ms | 17,8 ms | 21 | 4 | 2 | 28 |
| **C3-real-hold 203 (sau sửa)** | **1** | **0 ms** | **0 ms** | 20 | **7** | **6** | 34 |

\* Tổng/max trừ gap khởi động (load cửa sổ 207,6 ms @ph 70 — transient
load, có ở mọi biến thể). Gap duy nhất còn lại ở cả 2 biến thể 203 là
gap khởi động này.

- restartExact tăng 3→9 / 4→7: các lần nối đoạn nay qua restart-exact
  (khởi sớm, chồng crossfade) thay vì restart sau khi đoạn hết.
- holdLoopRestart tăng 3→6 / 2→6: chu kỳ lặp trong hold ngắn lại
  (0,4 s thay vì 0,5 s) nên cùng một hold dài có nhiều lần lặp hơn —
  đúng thiết kế §1.3.
- playOk 28→34: nhiều đoạn hơn vì nối sớm + lặp sớm (không phải thêm
  tiếng — tổng thời lượng render không đổi).

### 2.2 RMS tại điểm nối — crossfade không làm sụt mức tiếng

Đo RMS cửa sổ ±40 ms quanh mỗi điểm nối đoạn (t0 của source) trên WAV
sim, so với RMS toàn cục sau startup (0,624):

| Biến thể | RMS global | RMS nối thấp nhất | tỉ lệ min | RMS nối trung vị | tỉ lệ median |
|---|---|---|---|---|---|
| 202 adv | 0,6233 | 0,2005 | 0,32 | 0,5327 | 0,85 |
| 202 hold | 0,6250 | 0,3784 | 0,61 | 0,5432 | 0,87 |
| **203 adv** | 0,6248 | 0,3837 | **0,61** | 0,5472 | **0,88** |
| **203 hold** | 0,6236 | 0,3246 | **0,52** | 0,5451 | **0,87** |

RMS trung vị tại điểm nối KHÔNG ĐỔI (~0,87–0,88× global) — crossfade
không gây sụt mức hệ thống. Min dao động 0,32–0,61 giữa các biến thể
(kể cả trước sửa) — là beat giữa 2 đoạn chồng (tần số chirp lệch
~15–19 Hz giữa đoạn cũ/mới, chu kỳ beat ~50–65 ms, ngang cửa sổ đo),
không phải sụt mức do sửa. Không có gap ≥ 2 ms nào ngoài startup (§2.1)
nên dip RMS không thành im lặng.

### 2.3 Nghe kiểm (khách quan — không nghe trực tiếp được trong môi trường này)

Không có tai người trong vòng lặp này nên "nghe kiểm" được thay bằng 2
thước khách quan đã dùng từ đợt 201 (ngưỡng tai 3 ms — xem LIMITS 201
§1.1): (a) gap list WAV sample-accurate (§2.1): 0 gap ≥ 2 ms ngoài
startup — dưới ngưỡng phát hiện; (b) headed (§3): 0 record RMS=0 sau
tiếng đầu ở cả 2 pass tải thường; rms<0,1 cũng 0 ngoài 2 record
transient khởi động của longA (§3.3). Cả hai thước đều nói gap
nối đoạn đã hết dưới tải thường. Phần còn lại dưới tải nặng xem §3.3 +
caveat §7.1.

## §3. Headed 203: chirp + longA sau sửa

Probe `benchmarks/reverse203/audio-probe-203.mjs` (bản sao probe 202,
chỉ đổi thư mục ra + tên file). 3 pass (chirp + longA × 2 — longA chạy
lại lần 2 vì lần 1 nhiễm tải), port/CDP/profile riêng, nối tiếp. Bundle
cả 3 pass đều là `index-By2X_OPP.js` (build của P3-203, §6) trước→sau —
không bị luồng khác rebuild chen giữa như longA 202.

### 3.1 Chirp 203 — tải thường (load 1,22 → 1,11): gap nối đoạn hết

| | 201 | 202 | **203** |
|---|---|---|---|
| records / sounding | 789 / 661 | 591 / 446 | **1306 / 1278** |
| ph đi | 70→59,5 | 66,83→58,50 | **69,7→56,4** (13,3 s / 14 s wall) |
| drift peakHz/ph med/p90/max | 0,048/0,137/0,344 | 0,074/0,189/0,444 | **0,130/0,259/0,426** (bar 0,5 s — ĐẠT) |
| mute events (p_zcr>0,05) | 6 | 4 | **1** |
| records RMS=0 sau tiếng đầu | 29 | 0 | **0** |
| records rms<0,1 sau tiếng đầu | — | — | **0** |
| restart Δ / restartExact Δ | 18 / 2 | 12 / 5 | **20 / 19** |
| holdLoopRestart Δ / holdCapStop Δ | — / 1 | 1 / 0 | **11 / 0** |
| playOk Δ / playFalse | 22 / 0 | 19 / 0 | **51 / 0** |
| decode cửa sổ đầu (N11b) | 1.840 ms | 3.974 ms | **380 ms** (bar 5.000 ms — ĐẠT) |
| load cửa sổ đầu | 2.055 ms | 4.274 ms | **480 ms** |
| holdMaxSec | 0,752 s | 0,749 s | **0,107 s** |

- Sự kiện mute duy nhất (ev1, t=9726..9905, ph=69,70) là transient
  khởi động (rms<0,1 idx 1..42, trước khi tiếng ổn định) — cùng lớp
  ev1 đợt 201/202, không phải gap nối đoạn. **0 sự kiện mute nào sau
  khởi động** (202 còn ev2/ev3/ev4 là gap nối đoạn).
- Drift trung vị tăng 0,074 → 0,130 s: nối đoạn nay giữ drift qua
  restart-exact thay vì reset về ~0 bằng restart re-sync (§1.2) — vẫn
  trong bar 0,5 s; p90/max cũng trong bar.
- Recorder khỏe hơn hẳn (median khoảng mẫu 10,0 ms, max 71,9 ms; 202:
  median ~24 ms, max 209 ms) vì tải thấp — ph đi được 13,3 s (202:
  8,3 s) nên nhiều đoạn hơn (playOk 51 vs 19) và nhiều lần lặp hold
  hơn (11 vs 1) dù holdMax chỉ 0,107 s (hold ngắn, lặp sớm kích
  thường xuyên hơn).
- N11b chirp: decode 380 ms ĐẠT (partial engage Δpartial=1,
  Δfull=0, ΔpartialFail=0). Nhanh hơn 202 (3.974 ms) vì tải thấp hơn
  nhiều (1,22 vs 5,69 lúc mở) — decode phụ thuộc tải, xem §4.1.

### 3.2 LongA 203 lần 1 — NHIỄM TẢI, không kết luận N11b (load 4,53 → 9,97)

Pass này chạy đúng lúc T4-203 bắt đầu probe WebKit (00:15, vite +
MiniBrowser, xem `ps`: WebKitWebProcess 19,8% CPU) nên load vọt
4,53 → 9,97 giữa pass. Số đo (ghi lại để đối chiếu, KHÔNG dùng phán
N11b): 895 records, sounding 632, ph 300,17→280,4; drift 0,148/0,496/
0,619; mute events 16 (pmax ≤ 0,188, ~10–35 ms/window); các sự kiện đã
soi (ev1–ev12) đều không có record rms<0,1; min RMS sounding 0,2505
(không có record gần-im-lặng nào trong pass); restart Δ=57,
restartExact Δ=1, holdLoopRestart Δ=15, playOk Δ=74, playClamped Δ=1;
decode cửa sổ đầu **5.791 ms** > bar (nhiễm tải — xem §4.1); load cửa
sổ đầu 8.293 ms. **Lưu ý:** JSON gốc lần 1 đã bị lần chạy lại ghi đè
(cùng tên file `audio-probe-203-longA-*.json` — probe đặt tên theo TAG;
log lần 1 giữ riêng) nên số record RMS=0 sau tiếng đầu của lần 1 không
đối chiếu lại được — số decode 5.791 ms đã trích từ JSON trước khi ghi
đè. Bài học: rerun phải đổi tên file JSON (hoặc copy JSON cũ trước khi
chạy lại).

Bài học: restartExact chỉ Δ=1 dưới tải nặng vì drift trung vị 0,148 s
> dung sai 0,12 s — đa số tick trong cửa sổ overlap có lệch quá dung
sai nên "restart" re-sync thay vì restart-exact (vẫn khởi đoạn ngay
nếu tick trong cửa sổ — không gap; chỉ khi tick đói quá cửa sổ mới hở
— dư này chưa đo trực tiếp ở lần 1 do JSON bị ghi đè; 202 đo được
1 record RMS=0 dưới tải 7–8). Dưới tải thường (rerun §3.3),
restartExact Δ=20.

### 3.3 LongA 203 chạy lại — TẢI THƯỜNG (load 1,06 → 1,11): N11b ĐẠT

| | 201 | 202 | **203 lần 1 (nhiễm tải)** | **203 chạy lại (tải thường)** |
|---|---|---|---|---|
| records / sounding | 1122 / 518 | 773 / 500 | 895 / 632 | **1402 / 1228** |
| ph đi | 300,33→280,33 | 298,40→281,20 | 300,17→280,40 | **300,5→271,4** (29,1 s / 40 s wall) |
| drift med/p90/max | 0,119/0,437/0,678 | 0,159/0,537/0,696 | 0,148/0,496/0,619 | **0,115/0,289/0,470** (bar 0,5 s — ĐẠT) |
| mute events | 12 | 17 | 16 | **25** (xem dưới) |
| records RMS=0 sau tiếng đầu | 363 | 1 | — (JSON bị ghi đè, xem §3.2) | **0** |
| records rms<0,1 sau tiếng đầu* | — | — | — (như trên; min RMS sounding 0,2505) | **0** (*trừ 2 record transient khởi động, xem dưới) |
| restart Δ / restartExact Δ | 37 / 5 | 49 / 0 | 57 / 1 | **50 / 20** |
| holdLoopRestart Δ | — | 10 | 15 | **15** |
| playOk Δ / playFalse | 47 / 0 | 60 / 0 | 74 / 0 | **86 / 0** |
| playClamped Δ | 2 | 0 | 1 | **6** |
| windowRebuilds Δ / partial Δ | 0 / 1 | 0 / 1 | 0 / 1 | **1 / 2** |
| decode cửa sổ đầu (N11b) | 6.401 ms | 11.902 ms | 5.791 ms (nhiễm tải) | **2.798 ms** (bar 5.000 ms — ĐẠT) |
| decode rebuild | — (0 rebuild) | — (0 rebuild) | — (0 rebuild) | **3.119 ms** (cũng ≤ bar) |
| load cửa sổ đầu | 8.215 ms | 14.512 ms | 8.293 ms | **3.567 ms** |
| holdMaxSec | 3,489 s | 3,750 s | 2,801 s | **1,698 s** |

- **25 sự kiện mute đều là blip p_zcr nhỏ** (pmax 0,051–0,223,
  ~9–41 ms/window, analyser 46 ms nhòe) — KHÔNG sự kiện nào có record
  rms<0,1. Nhiều sự kiện nằm TRONG hold dài (ev7–ev11, ev18, ev20–
  ev22: hold 920–1.190 ms ctxT) mà code cũ sẽ im lặng 141–652 ms
  (cột "im lặng dự đoán" của analyze203.py) — với sửa này, loop restart
  kích đúng nhịp (15 lần, ctxT 6,832–24,573) và không có im lặng.
  Số sự kiện nhiều hơn lần 1 (25 vs 16) vì recorder khỏe hơn (median
  14,6 ms vs 20,3 ms — bắt được nhiều blip nhỏ hơn) + đi xa hơn
  (29,1 s vs 19,8 s, qua biên keyframe 280 + rebuild cửa sổ).
- **2 record rms 0,0014 (idx 175–176, t=15423..15436, ph 300,5→300,43)
  là transient khởi động**, không phải gap nối đoạn: cửa sổ vừa load
  xong ở ctxT 5,393 sau hold khởi động 1,7 s; playhead lúc đó còn ngoài
  cửa sổ thật ([270,6; 300,16] — audio hết ở 300,16 s, stts khai
  300,64 s) nên 3 tick đầu restart liên tiếp qua clamp F-197-P3-1
  (playOk 1→2→3, restart 0→1→2) trước khi tiếng thật lên ở idx 177
  (rms 0,5154). Cùng lớp ev1 đợt 201/202.
- **Rebuild cửa sổ lần đầu đo được:** ph tới 271,4 s (gần mép dưới
  cửa sổ [270,6; 300,16]) nên rebuild kích ở ctxT 31,190 (partial
  1→2, decode 3.119 ms ≤ bar) + playClamped Δ=6 (clamp mép sau rebuild
  — đúng thiết kế F-197-P3-1). 202 không có rebuild nào nên chưa từng
  đo được thời gian rebuild.
- Drift: analyze (rms>0,05, n=1225) cho max 0,470 s — ĐẠT cả 3 thước.
  KET LUAN của probe ghi max 1,611 vì nó tính cả 3 record gần-im-lặng
  (rms≤0,05, peakHz nhiễu) — artifact thước, không phải lag thật
  (LOC-S2 của probe cũng 1,611 vì lag chỉ 2 — cùng 3 record đó).

## §4. Harness lại N11a/N11b

### 4.1 N11b (partial decode) — chirp ĐẠT; longA ĐẠT dưới tải thường

- Partial engage: cả 3 pass Δpartial≥1, Δfull=0, ΔpartialFail=0 —
  **đường partial hoạt động in-app, không rơi về full decode.**
- Decode cửa sổ đầu (`lastWindowDecodeMs` — đọc tại record partial
  0→1, không lấy countersEnd vì rerun có rebuild ghi đè):

| Pass | tải lúc đo (load1) | decode cửa sổ đầu | bar 5.000 ms |
|---|---|---|---|
| chirp 203 | 1,22 → 1,11 | **380 ms** | ĐẠT |
| longA 201 | 3,3 → 2,3 | 6.401 ms | VƯỢT (tải vừa) |
| longA 202 | 7,14 → 8,31 | 11.902 ms | VƯỢT (tải nặng) |
| longA 203 lần 1 | 4,53 → 9,97 | 5.791 ms | VƯỢT (nhiễm tải) |
| **longA 203 chạy lại** | **1,06 → 1,11** | **2.798 ms** | **ĐẠT** |

- **Decode tăng theo tải** (cùng đường partial, 0 fail): 2.798 ms ở
  tải ~1 (chạy lại) vs 6.401 ms ở tải ~3 (201) vs 11.902 ms ở tải
  7–8 (202); lần 1 (5.791 ms) đo lúc tải đang vọt 4,5→9,97 nên chỉ
  dùng đối chiếu, không dùng phán. Bar 5.000 ms theo quyết (a6)-202
  chỉ áp cho tải thường — **dưới tải thường, longA ĐẠT (2.798 ms)**.
  Rebuild decode 3.119 ms cũng ≤ bar.
- Không còn nợ đo lại N11b-longA dưới tải thường (nợ §7.1 đợt 202 —
  XONG). Verdict N11b: **parent quyết** (P3 chỉ báo cáo số đo; P4
  harness lại trên dữ liệu này nếu cần).

### 4.2 N11a (drift) — chirp ĐẠT; longA ĐẠT (chạy lại)

- Chirp: 0,130/0,259/0,426 s — **ĐẠT cả 3 thước** (median tăng so với
  202 do §1.2 — vẫn trong bar).
- LongA chạy lại: 0,115/0,289/0,470 s — **ĐẠT cả 3 thước** (lần đầu
  longA đạt cả 3 thước thô; 201/202 p90/max vượt bar do artifact
  peakHz đóng băng sau im lặng + tải nặng). Lần 1 (nhiễm tải):
  0,148/0,496/0,619 — p90/max vượt bar như 201/202.
- (a5)-201 đã cho longA ĐẠT theo ngoại lệ mở rộng; nay số thô chạy lại
  cũng đạt — verdict N11a-longA thuộc parent (qua harness P4).

## §5. Kiểm chứng độc lập + test

### 5.1 tsc + vite build

- `npx tsc --noEmit` (apps/web): **0 lỗi** (kiểm lần cuối của P3).
  Ghi lại để T10 khỏi nhầm nếu thấy số khác ở thời điểm khác: giữa đợt,
  tsc từng báo 3 rồi 11 lỗi — TẤT CẢ trong file `parityHarness203*.ts`
  của P4-203 đang viết dở song song (lỗi TS6133/TS6196/TS2724 quanh
  `sectionReverseAudio`/`HeadedVoiceJson`), 0 lỗi trong file của P3;
  P4 đã sửa xong trước khi P3 đóng nên lần kiểm cuối là 0 lỗi. P3
  KHÔNG sửa file của P4.
- `npx vite build`: **PASS 11,81 s**, bundle mới `index-By2X_OPP.js`
  (1.756,30 kB). Cả 3 pass headed chạy đúng bundle này (trước→sau).

### 5.2 Test mới `reverseAudio203P3.test.ts` — 12/12 PASS

- Bất biến: exact-tol = dung sai drift = 0,12 s (overlap 0,1 s).
- Ma trận quyết định: lệch 0,06/0,11/0,115 s trong cửa sổ overlap →
  restart-exact (kèm đối chiếu: exact-tol cũ 0,05 s cho 0,06 s "keep"
  — chính là hành vi gây gap); lệch 0,13 s → restart re-sync ngay;
  lệch −0,08 s → restart-exact; lệch 0,06 s xa cuối đoạn → keep;
  đoạn đã hết (tick đói) → restart.
- Wiring: nối đoạn lệch 0,08 s → restart-exact TRƯỚC khi đoạn hết,
  không restart sau hết (đoạn 2 bắt đúng mẫu tiếp theo offset 1,0 s).
- Hold: lặp SỚM ở 0,4 s rồi 0,8 s (chu kỳ 0,4 s); tick đói nhảy qua
  điểm hết đoạn → vẫn lặp ngay.
- Không hồi quy: playSegment clamp cuối buffer.
- Bẫy: test biên đúng 0,120 s rớt do floating-point (0,12×1000 =
  119,999…) nên dùng 0,115 s thay vì biên chính xác — ghi lại để đợt
  sau khỏi vấp.

### 5.3 Test cũ cập nhật hợp đồng (thay đổi hành vi CÓ CHỦ ĐÍCH theo quyết (a6)-202)

- `reverseAudio193P3.test.ts` (15 PASS): hằng exact-tol 0,05 → 0,12;
  test "lệch vừa 0,06 s → keep tới hết rồi restart" (mã hoá đúng lỗi
  F-201-P3-2) → "0,06 s → restart-exact ngay; 0,13 s → restart".
- `reverseAudio202P3.test.ts` (7 PASS): lặp sớm đổi thời điểm lặp
  0,5→0,4 s (hold 1,6 s nay lặp 4 lần, không phải 3); resume sau hold
  vẫn keep (pha lặp mới: lần lặp thứ 4 bắt đầu ctx 1,6).
- `reverseAudio194P3.test.ts` (7 PASS — **202 chỉ đạt 6/7**): 2 sửa.
  (a) ĐÍNH CHÍNH assertion sai từ đợt 202: `stopWhens.length == 0`
  ("đoạn cũ hết hạn tự nhiên") — crossfade của playSegment LUÔN gọi
  `prevSrc.stop(t0+0,08 s)` khi đoạn mới bắt đầu chồng lên đoạn cũ,
  nên assertion này rớt cả với code 202 (đã kiểm bằng bản sao /tmp:
  stopWhens [0,58] cả 2 code; LIMITS 202 ghi "194: 6 PASS" mà không
  nêu test rớt). Nay assert đúng: stop ở 0,58 (= t0 0,5 + crossfade
  0,08) + holdCapStop == 0 (không phải cap-stop). (b) stopAll: tick
  hold 0,4 s trước stopAll nay lặp sớm nên tổng source 3 (không phải
  2).
- `reverseAudio196P3.test.ts` (5 PASS): lặp sớm kích ở ctx 0,45 (không
  phải 0,5); tick 0,5 assert không lặp thêm.
- Toàn bộ suite reverseAudio\*: **109 test PASS** (reverseAudio 7,
  192: 12, 193: 15, 194: 7, 195: 3, 196: 5, 197: 6, 198: 14, 199: 11,
  201: 10, 202: 7, 203: 12). Toàn bộ suite reverse (kèm
  reversePlayback\*/reverseCadence/reverseDecodeAhead/reverseRangeGate/
  reversePreviewGate): **228 test PASS**. Không hồi quy do P3-203
  (ghi rõ để T10 khỏi nhầm): 10 file test lỗi khi chạy bằng node thô
  (`ERR_MODULE_NOT_FOUND` — import tương đối không đuôi, cần
  vitest/bundler; 0 tham chiếu tới wiring) và 2 test i18n đạt 0/3
  ("E2 i18n nút Phát ngược K4", "D4 i18n toggle GOP" — tập key vi/en
  giống hệt nhau; P3-203 không chạm file i18n nào). Cả hai đều có từ
  trước, không liên quan wiring.

## §6. Hạn chế & caveats (đọc trước khi dùng số liệu)

1. **Gap nối đoạn chỉ còn khi tick đói quá cửa sổ overlap 0,1 s**
   (không tick nào trong 100 ms trước khi đoạn hết): dưới tải nặng,
   đoạn hết rồi tick sau mới restart, gap = độ trễ tick đói. Dư này
   chưa đo trực tiếp ở đợt 203 (lần 1 nhiễm tải không đối chiếu lại
   được từng record do JSON bị ghi đè — xem §3.2); đợt 202 đo được
   1 record RMS=0 dưới tải 7–8. Muốn hết hẳn cần lên lịch trước
   (schedule-ahead: `start(when = segEnd)`) — thay đổi lớn hơn (player
   + bookkeeping pending segment), chưa làm — nợ thiết kế, xem §7.
2. Thước p_zcr headed bị nhòe bởi cửa sổ analyser (186 ms chirp /
   46 ms longA) + khoảng mẫu recorder — chỉ dùng để khẳng định
   "không còn im lặng dài"; kích thước gap chính xác lấy từ sim WAV
   (§2). 25 sự kiện mute longA chạy lại đều là blip cửa sổ, không
   phải im lặng (thước quyết định rms<0,1/RMS=0 = 0 ngoài startup).
3. Drift peakHz/ph sau im lặng dài bị artifact peak đóng băng (§4.2
   đợt 201) — KET LUAN probe ghi max 1,611 ở longA chạy lại là do 3
   record gần-im-lặng (rms≤0,05); số analyze (rms>0,05) max 0,470 s
   mới là số so sánh được.
4. Sim replay ở độ phân giải record (~18 ms): gap lớn robust qua cả 2
   thứ tự tick; số restartExact tuyệt đối nhạy nhẹ với thứ tự (9 vs
   7) — kết luận chung (0 gap ngoài startup) robust qua cả 2.
5. Pass longA lần 1 nhiễm tải T4-203 (probe WebKit bắt đầu 00:15) —
   số 5.791 ms KHÔNG phải số tải thường; số tải thường là 2.798 ms
   (chạy lại, load 1,06→1,11). JSON lần 1 đã bị chạy lại ghi đè (cùng
   tên file) — rerun sau này phải đổi tên file hoặc copy JSON cũ trước.
6. Chu kỳ lặp C3 trong hold nay 0,4–0,5 s (thay vì đúng 0,5 s): đuôi
   đoạn (tối đa 0,1 s) bị mờ dần/cắt mỗi lần lặp — nhịp lặp nhanh hơn,
   cùng lớp artifact "tiếng lặp" của C3.
7. "Nghe kiểm" là thước khách quan (§2.3), không phải tai người trực
   tiếp — môi trường này không nghe được; 2 thước (gap WAV + record
   RMS headed) đều dưới ngưỡng tai 3 ms dưới tải thường.

## §7. Nợ còn lại

- (r)-203 giao: sửa nối đoạn plain-restart (F-201-P3-2) → **XONG
  (§1–§3)**; đo lại N11b-longA dưới tải thường → **XONG (§4.1 —
  2.798 ms ĐẠT; rebuild 3.119 ms)**; đo lại N11b chirp sau sửa →
  **XONG (§3.1 — 380 ms ĐẠT, không thoái hóa)**.
- **F-201-P3-2: ĐÓNG** (sửa + sim + headed đều xác nhận; chỉ còn dư
  tick-đói §6.1 — nợ thiết kế riêng, không còn là F-201-P3-2).
- Nợ mới/chuyển tiếp:
  1. (Tùy chọn) Schedule-ahead cho nối đoạn: hết gap cả khi tick đói
     (cần player hỗ trợ start tương lai + bookkeeping pending
     segment) — chỉ cần nếu parent thấy dư tick-đói dưới tải nặng
     là vấn đề (202: 1 record RMS=0/pass tải nặng; 203 lần 1 không
     đối chiếu lại được do JSON bị ghi đè).
  2. N11a-longA: thước drift cấp waveform (thay peakHz) nếu muốn
     verdict chặt — peakHz không còn là đồng hồ sạch trong hold dài
     có lặp (nợ từ 202 §7.3, chưa làm).
  3. Giả thuyết beat crossfade (201 §6) vẫn chưa chứng minh — các blip
     p_zcr quanh điểm nối có thể một phần do beat; không ảnh hưởng
     verdict (thước RMS=0 = 0).

## §8. File & bằng chứng

- LIMITS này: `docs/PHASE9_ROUND203_P3_LIMITS.md`
- Code sửa: `apps/web/src/lib/reverseAudioWiring.ts`
  (exact-tol 0,05 → 0,12; C3-loop lặp sớm trong hold)
- Test mới: `apps/web/src/lib/reverseAudio203P3.test.ts` (12 test)
- Test cũ cập nhật hợp đồng: `reverseAudio193P3.test.ts`,
  `reverseAudio194P3.test.ts`, `reverseAudio196P3.test.ts`,
  `reverseAudio202P3.test.ts`
- Probe headed 203: `benchmarks/reverse203/audio-probe-203.mjs`
- Scratch (không stage): `hidden_files/round203-p3/` — `sim203.ts` +
  `sim203-summary.json` + `sim201b-C3-real-*.wav` +
  `sim201b-C3-real-*-sources.json`, `analyze203.py`,
  `audio-probe-203-*.json` (chirp 1306 records + longA 1402 records
  chạy lại; JSON longA lần 1 (895 records) đã bị chạy lại ghi đè —
  chỉ còn `probe-203-longA-300s-gop300-720p.log` + số đã trích §3.2),
  `probe-203-*.log`.
- Dữ liệu gốc đối chiếu: `hidden_files/round201-p3/audio-probe-201-*.json`
  (tick replay sim), `hidden_files/round202-p3/sim202-summary.json`
  (wiring thật trước sửa).
