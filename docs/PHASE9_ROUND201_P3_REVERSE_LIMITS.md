# PHASE9_ROUND201_P3_REVERSE_LIMITS.md — P3 đợt 201: hold-mute (nghe được? do hold?)

**Verdict: hold-mute NGHE ĐƯỢC RÕ RÀNG, và HOLD LÀ NGUYÊN NHÂN (H1 chứng minh).**
Im lặng thật dài nhất 655–690 ms (gấp ~200× ngưỡng phát hiện của tai 2–3 ms);
ngay cả sự kiện ngắn nhất (8–19 ms) cũng gấp 3–6× ngưỡng. Cap longA KHÔNG
phải hồi quy (xem §4 — đính chính so sánh sai ở (a6)-200). Guard clamp có
unit test trực tiếp 10/10 PASS. Đề xuất hướng sửa §7 (quyết thuộc parent).

Đợt 201 mở lượt cron 21:35 +07 27/11/2026; bundle `index-BCKAT1fc.js` (không
đổi từ 199/200 — không có thay đổi code nào giữa 3 đợt, xem §4). T4-201 đã
có `.done` (lượt yên #69 HỢP LỆ; live-check #20 KHÔNG ĐẠT; reboot 15:04:25Z
sang boot 7d642f2a). Probe headed chirp 201 chạy 15:25:54–15:26:18Z, longA
201 chạy 15:38:25–15:39:07Z (port/CDP/profile riêng, nối tiếp qua hàng đợi).

## §1. Hold-mute có nghe được không — CÓ, rõ ràng

### 1.1 Ngưỡng psychoacoustic (trích dẫn, không đoán mò)

- Gap detection trên nhiễu broadband: **~2,0 ms** — Rupp et al. 2002,
  NeuroReport (ngưỡng psychoacoustic 2,0 ms); APA Dictionary of Psychology
  "gap detection" ~**3 ms** vừa phát hiện được; GIN test: GDT75 trung bình
  **3,18 ms** (Balkan ORL-HNS 2026).
- Gap detection trên tone: **0,5–6 ms** (sinusoid 1 kHz) — Moore et al. 1989,
  JASA 85:1266–1275; ngưỡng thay đổi ít ở 400–2000 Hz, tăng mạnh ở 100–200 Hz
  — Moore, Peters & Glasberg 1993, JASA 93:1563–1570; Shailer & Moore 1983/1987.
- Nguồn: psycnet.apa.org/record/2003-04042-005, dictionary.apa.org/gap-detection,
  pubmed.ncbi.nlm.nih.gov/2708669, psycnet.apa.org/record/1993-36121-001.
- Lấy ngưỡng bảo thủ **3 ms**: mọi sự kiện dưới đây đều vượt.

### 1.2 Sự kiện im lặng đo được (headed chirp 201, recorder ~10 ms)

789 records / 14 s (median 10,7 ms, mean 17,8 ms — recorder tự đói main thread;
131 khoảng > 30 ms). Sounding 661; drift peakHz/ph median 0,048 / p90 0,137 /
max 0,344 s (trong bar 0,5 s). 6 sự kiện mute (gộp mẫu kề, p_zcr > 0,05):

| # | t (wall) | độ dài | dHold | dRestart | ghi chú |
|---|----------|--------|-------|----------|---------|
| ev1 | 12816 | ~169 ms | 0 | 0 | transient khởi động (load cửa sổ) — loại |
| ev2 | 14392 | ~40 ms | 0 | 1 | ngắt ngắn sau restart |
| ev3+ev4 | 14994–15936 | **~690 ms** | 12+10 | 0+1 | MỘT lần im lặng dài (xem dump thô §2) |
| ev5 | 20711 | ~31 ms | 0 | 1 | ngắt ngắn sau restart |
| ev6 | 24521 | ~133 ms | 14 | 1 | im lặng trong hold dài |

So với ngưỡng 3 ms: ev2/ev5 (31–40 ms) gấp **10–13×**; ev6 (133 ms) gấp
**44×**; ev3+ev4 (690 ms) gấp **230×**. Tần suất: ~1 sự kiện / 2–3 s trong
pass 14 s; đợt 200: 23/126 mẫu mute, 19–40 ms mỗi ~0,9 s. Ngắt lặp lại có
chu kỳ còn dễ nghe hơn ngắt đơn lẻ (tai nhạy với tính tuần hoàn của dropout).

### 1.3 Đo khách quan trên WAV render (sim §3, đo độc lập bằng python)

WAV A (hold như thật): 6 gap ≥ 2 ms, tổng 976,1 ms, max **654,6 ms**;
RMS lúc có tiếng median 0,6477 (chirp 0,94/√2 = 0,665 — hụt do crossfade);
peak STFT khớp sweep chirp trong mọi cửa sổ có tiếng (sai số do drift hold,
xem §3.3). **Kết luận §1: mọi thước đều vượt ngưỡng 3 ms với biên lớn —
hold-mute nghe được, sự kiện 655–690 ms là dropout nặng.**

## §2. Hold có phải nguyên nhân — CÓ (H1 chứng minh, H2 bị loại)

### 2.1 Giả thuyết

- **H1 (đoạn hết hạn giữa hold):** nhánh hold của `tickInner`
  (`reverseAudioWiring.ts`) return sớm, không restart — đoạn 0,5 s hết hạn
  giữa hold → im lặng tới tick không-hold đầu tiên.
- **H2 (tick trễ / main thread đói):** không tick nào chạy trong lúc im lặng
  nên không ai restart — im lặng do thiếu tick, không do hold.

### 2.2 Bằng chứng quyết định: dump thô pass headed chirp 201 (idx 196–277)

- Đoạn bắt đầu ctxT 6,592 (idx 197, restart + playOk), hết hạn 7,092.
  Playhead đóng băng ở 66,6 từ ctxT 6,954 (idx 215) — hold bắt đầu.
- idx 226–236: RMS rơi 0,6388 → 0,1903, zcrHz 2657 → 237 (cửa sổ analyser
  186 ms trượt qua điểm hết đoạn).
- **idx 237 (ctxT 7,291): RMS 0,0000, zcrHz 0, dholdCapStop=1 — im lặng
  toàn phần bắt đầu; idx 237–265 RMS 0,0000/zcrHz 0 liên tục (ctxT
  7,291→7,721, ~430 ms lõi im lặng tuyệt đối).**
- **Trong suốt lúc im lặng, tick vẫn chạy đều (Δtick=1–2, ΔholdStop=1–2
  mỗi record ~18 ms) → H2 BỊ LOẠI.** Mọi tick đều là hold tick (nhánh hold
  return sớm, không restart).
- Cap-stop kích hoạt giữa lúc im lặng (idx 237, heldSec vượt 0,3 s) nhưng
  không đổi gì về tiếng (đoạn đã hết từ 7,092 — cap là hệ quả của hold dài,
  không phải nguyên nhân im lặng).
- idx 266 (ctxT 7,782): playhead nhúc nhích 66,6→66,533, dplayOk=1, RMS hồi
  0,3420 → 0,6637 — im lặng kết thúc đúng lúc hold hết + tick restart.
- **Im lặng thật: 7,092 → 7,782 ≈ 690 ms** (dài hơn 19–40 ms đợt 200 vì
  hold dài hơn: holdMax 0,752 s vs 0,131 s).

### 2.3 Đối chứng A/B bằng mô phỏng offline (replay mẫu tick thật)

Sim `sim201b.ts` chạy ĐÚNG class `ReverseAudioWiring` + `ReverseAudioPlayer`
thật (fake AudioContext đồng hồ ảo), replay mẫu tick thật từ pass headed 201
(per-record Δtick/ΔholdStop/Δplayhead/ΔctxT, 789 records, span ctxT 10,678 s;
chirp tổng hợp 70 s, 300→3000 Hz, amp 0,94). Kiểm chứng replay: counters A
khớp headed — tick 578=578, holdStop 260=260, holdCapStop 1=1, holdMaxSec
0,753 vs 0,752; restart 20 vs 18, playOk 25 vs 22 (lệch nhỏ do nội suy tick
trong khoảng ghi ~18 ms); gap lớn sim 654,6 ms vs headed ~690 ms (Δ 35 ms,
cùng playhead 66,6). Hai thứ tự tick trong khoảng (advance-trước /
hold-trước) cho cùng gap lớn — kết quả không nhạy với giả định thứ tự.

| Biến thể | gap ≥ 2 ms | tổng im lặng* | max gap | kết luận |
|---|---|---|---|---|
| A — hold như thật | 6 | 768,5 ms | **654,6 ms** @ph 66,6 | tái tạo đúng sự kiện headed |
| B — KHÔNG hold (cùng thời điểm tick, playhead lùi đều 1×) | 10 | 137,7 ms | 25,1 ms | KHÔNG có im lặng dài |
| C1 — cont (§7) | 8 | 563,0 ms | 446,7 ms | rút ngắn, chưa hết |
| C3 — loop (§7) | 6 | 112,5 ms | 27,3 ms | hết im lặng dài |

\* Tổng trừ gap khởi động (load cửa sổ: A/C1/C3 207,6 ms; B 108,9 ms —
transient load, không phải hiện tượng; headed ev1 ~169 ms).
Đo độc lập bằng `measure201.py` (đọc lại WAV từ đĩa, code python riêng)
tái tạo đúng từng gap list của sim (sai khác ≤ 0,1 ms do làm tròn).

**A vs B là phép thử tắt/bật hold trong cùng fixture (cùng thời điểm tick,
cùng đồng hồ ctxT): chỉ khác hold mà im lặng dài 655 ms biến mất → hold
LÀ nguyên nhân.** Cơ chế: đoạn hết hạn giữa hold + nhánh hold không restart
(H1). Lưu ý: B vẫn có 10 gap nhỏ 6,8–25,1 ms — đó là chi phí nối đoạn của
plain restart (xem F-201-P3-2, §6), không phải hold-mute.

### 2.4 Đính chính kết luận sim đợt 200

Sim v1 (đợt 200) kết luận "B có 13 plain restart mà 0 gap" — **SAI, rút lại.**
Renderer v1 có bug: `end = min(stopWhens)` mà không kẹp `t0+durSec` — nguồn
BufferSource dừng ở `t0+dur` (tham số duration của `start()`) dù `stop()`
gọi sau đó; khi cap-stop gọi sau khi đoạn hết tự nhiên, renderer vẽ thừa
nội dung nối tiếp tới lúc stop (gap A đo 447 ms thay vì 655 ms thật). Sau
khi sửa (`end = min(t0+dur, stopWhens)`), B hiện 10 gap nối đoạn 6,8–25,1 ms
và A hiện đủ 6 gap (trong đó có 4 gap ngắn 8–47 ms mà v1 bỏ sót). Mọi số
liệu sim trong LIMITS này đều từ bản render ĐÃ SỬA (sim201b, run 3).

## §3. Đo WAV A/B/C chi tiết (sim201b + measure201.py)

### 3.1 Gap list (ngưỡng |x| < 0,0039 = nửa bước byte analyser, ≥ 2 ms)

- **A-adv:** (0; 207,6) startup; (1357,7; 31,5) ph 68,63; **(3148,5; 654,6)
  ph 66,6**; (4841,4; 46,8) ph 65,53; (7804,1; 27,3) ph 61,63; (9519,5; 8,3)
  ph 59,47. Tổng 976,1 ms / 6 gap.
- **B-nohold:** (0; 108,9) startup + 10 gap nối đoạn 6,8–25,1 ms, cách nhau
  ~0,9 s (1023,9; 1933,8; 2888,8; 3821,2; 4739,1; 5653,4; 6563,3; 7493,6;
  8403,5; 10220,5). Tổng 246,7 ms / 11 gap. 10 gap ≈ 11 plain restart
  (restart-exact 12 lần thì không gap — bắt đầu sớm 0,1 s, chồng crossfade).
- **C1-cont:** gap lớn tách đôi (3148,5; 17,7) + (3356,4; 446,7) — đoạn nối
  tiếp phát 3,166→3,356 (~190 ms, gồm fade-out cap-stop) rồi cap-stop dừng
  (heldSec > 0,3 s), im lặng còn 447 ms. Tổng 770,7 ms / 9 gap.
- **C3-loop:** gap lớn còn (3148,5; 17,8) + (3665,9; 13,5) — chỉ còn trễ
  nối đoạn ~1 tick mỗi lần lặp; không còn im lặng dài. Tổng 320,1 ms / 7 gap.
- A-hold (thứ tự hold-trước): cùng gap lớn 654,6 ms @66,6; các gap ngắn
  khác vị trí/độ dài (6,1 ms @5,63 s; 11,2 ms @7,66 s) — **gap ngắn nhạy
  với cấu trúc tick dưới 100 ms, không ghim từng cái; gap lớn là robust.**

### 3.2 RMS / ZCR / STFT (cửa sổ 8192 mẫu = 186 ms, như probe)

- Cửa sổ mute (p_zcr > 0,05): A 13/57, B 12/57, C1 13/57, C3 11/57 — thước
  cửa sổ 186 ms quá thô để phân biệt (nó nhòe cả gap nối đoạn) — gap list
  trên WAV thô mới là thước đúng.
- RMS lúc có tiếng median: A 0,6477; B 0,6533; C1 0,6488; C3 0,6476 — các
  biến thể không đổi mức tiếng (chỉ đổi chỗ im lặng).
- Peak STFT khớp sweep chirp trong mọi cửa sổ có tiếng: B sai số median
  1,7 Hz (gần như tuyệt đối); A/C1/C3 median 12–13 Hz, max 48,4 Hz — đúng
  bằng độ lệch tần số do drift hold (38,6 Hz/s × drift tích lũy của hold;
  không có peak lạ trong lúc im lặng). PeakHz không bị ảnh hưởng bởi mute
  (khớp phát hiện đợt 200).

### 3.3 Drift trong pass headed chirp 201

peakHz/ph median 0,048 / p90 0,137 / max 0,344 s — trong bar 0,5 s. Đồng hồ
audio chạy 0,76× wall (ctxT tăng 10,68 s trên 14,03 s wall) — hiệu chuẩn
sim đã tính đúng (replay theo ΔctxT thật, không theo wall).

## §4. Theo dõi cap + hold dài longA — KHÔNG phải hồi quy

### 4.1 Đính chính so sánh ở (a6)-200

(a6)-200 viết "7 cap longA đợt 200 (đợt 199: 0 cap, holdMax 0,351 s)".
Con số "0 cap / 0,351 s" KHÔNG phải của pass longA 199 — tra countersEnd
trong JSON gốc:

| Pass 199 | holdCapStop | holdMaxSec |
|---|---|---|
| chirp-70s | 0 | 0,110 s |
| longB-300s-gop15-360p | 0 | **0,351 s** |
| **longA-300s-gop300-720p** | **4** | **2,049 s** |

"0 cap" là của pass chirp/longB; "0,351 s" là của pass longB. So sánh đúng
phải là longA-vs-longA (cùng file, cùng fixture):

### 4.2 Cap longA qua 3 đợt (cùng bundle `index-BCKAT1fc.js`)

| Đợt | cap | holdMaxSec | vị trí cap (playhead) | quãng đi | tải máy |
|---|---|---|---|---|---|
| 199 | 4 | 2,049 s | 290,57; 280,57; 280,53; 270,53 | 300,6→262,17 | load 2,6→4,2 |
| 200 (rerun) | 7 | 2,470 s | 300,4; 290,6; 290,53; 280,57; 280,5; 270,53; 270,5 | 300,6→262,17 | load 0,45→2,45 |
| 201 | 5 | 3,489 s | 300,33; 290,6; 290,53; 280,53; 280,33 | 300,33→280,33 | load 3,3→2,3 |

- **Cap tụ tại playhead ≡ 0,5 (mod 10 s)** — đúng biên keyframe của file
  GOP300 (keyframe mỗi 10 s: 300/290/280/270). Mẫu ổn định cả 3 đợt:
  **1 cap lúc khởi động (load cửa sổ đầu chậm) + ~2 cap mỗi lần vượt biên
  keyframe** (vượt biên → decode GOP mới → không có frame → hold → cap).
  Tỉ lệ cap / biên vượt: 199: 4/3 ≈ 1,33; 200: 6/3 = 2,0 (trừ cap khởi
  động); 201: 4/2 = 2,0. Không có bước nhảy.
- holdMax 201 (3,489 s) là **stall lúc khởi động** (load cửa sổ đầu 8.215 ms
  dưới tải nặng), không phải hold giữa pass — cap đầu tiên đã ghi holdMax
  3,489 s ngay từ t=20.756 s, ph 300,33.
- Gánh im lặng ổn định: mẫu rms < 0,02: 199: 73/400; 200: 66/400 (201 đo
  bằng thước khác: 124/518 record mute, p_zcr > 0,05 — không so trực tiếp).
- **Kết luận: cap là artifact cấu trúc của biên keyframe (GOP300) + thời
  gian decode cửa sổ, có từ đợt 199, không tăng đột biến — KHÔNG phải hồi
  quy.** Không có thay đổi code nào giữa 3 đợt (cùng bundle). Biến thiên
  4→7→5 cap là do thời gian decode từng lần vượt biên (tải máy, boot) và
  quãng đi được (201 chỉ đi 20 s vì tải nặng, vượt 2 biên thay vì 3).
  Nợ đứng: hướng sửa là §7 (audio tiếp tục trong hold), không phải sửa cap.

### 4.3 Pass longA 201 chi tiết

1122 records / 40 s (mean 36,1 ms/record — recorder đói nặng, 423 khoảng
> 30 ms, max 772,5 ms); sounding 518; ph 300,33→280,33 (chỉ đi 20 s trong
40 s wall — hold chiếm đa số thời gian). Counters: tick 994, holdStop 602,
holdKeep 171, holdCapStop 5, holdMaxSec 3,489 s, restart 37, restartExact 5,
playOk 47, playFalse 0, playClamped 2, partial 1, decode cửa sổ 6.401 ms,
windowRebuilds 0, load cửa sổ đầu 8.215 ms. 12 sự kiện mute; 2 lớn:
(t=32750, ph 290,53, ~109 ms, dHold=16) và (t=45149, ph 280,67, ~168 ms,
dHold=22) — đều trong hold sau cap tại biên keyframe, cùng cơ chế H1.
Drift peakHz/ph median 0,119 / p90 0,437 / max 0,678 s — p90/max vượt bar
0,5 s NHƯNG là artifact thước: peakHz đóng băng trong lúc im lặng (analyser
giữ argmax khi mọi bin decay cùng tỉ lệ) nên sau im lặng dài, playhead đã
đi tiếp trong khi peakHz còn cũ — không phải lag thật của player. Hold run
dài nhất 41 records = 681 ms (theo t); tick stall dài nhất 62 ms (không
phải nguyên nhân — xem §2.2: tick vẫn chạy trong lúc im lặng).

## §5. Unit test trực tiếp cho guard gần mép clamp — 10/10 PASS

File `apps/web/src/lib/reverseAudio201P3.test.ts` (mới). Fixture: decoded giả
40 s @1000 Hz, load ở source 35 s → cửa sổ [5, 35] s, lo=5000, hi=34999 mẫu,
guard sampleRate=1000. Chạy:
`node --experimental-strip-types apps/web/src/lib/reverseAudio201P3.test.ts`
→ **10 test PASS** (27/11/2026). Bao phủ:

1. mép dưới: ngoài 0,5 s → clamp về mép (playClamped=1).
2. mép dưới: ngoài ĐÚNG 1 s (1000 mẫu) → clamp (biên bao hàm).
3. mép dưới: ngoài 1 s + 1 mẫu → KHÔNG clamp (playFalse, cờ xóa).
4. mép trên: ngoài 0,501 s → clamp về mép trên.
5. mép trên: ngoài 1,001 s → KHÔNG clamp.
6. guard hết tươi (> 3 s sau rebuild) → KHÔNG clamp dù gần mép.
7. guard còn tươi đúng 3,0 s → vẫn clamp (biên bao hàm).
8. cờ GIỮ sau khi clamp: đoạn hết hạn rồi tick gần mép vẫn clamp tiếp.
9. tick trong cửa sổ → không clamp + cờ bị xóa.
10. player `clampSampleOffsetToWindow`: kẹp cả hai mép, trong cửa sổ giữ nguyên.

Kiểm chứng: `npx tsc --noEmit` (apps/web) **0 lỗi** (sau khi bỏ helper `ok`
thừa — tsc bắt TS6133, đã sửa); suite reverse liên quan xanh toàn bộ:
reverseAudio 7 + 192: 12 + 193: 15 + 194: 7 + 195: 3 + 196: 5 + 197: 6 +
198: 14 + 199: 11 + 201: 10 = **90 test PASS**.

Hai bẫy khi viết test (ghi lại để đợt sau khỏi vấp):
- (a) tick liên tiếp cùng playhead rơi vào nhánh hold — phải dùng playhead
  khác nhau (35,4 / 34,9) cho các tick setup.
- (b) tick mép trên kích rebuild, đường rebuild qua **cache-hit đổi cửa sổ
  ĐỒNG BỘ trong cùng tick** (nhánh cache của `loadReversedWindow` không có
  await) nên guard không kịp thấy cửa sổ cũ — test trực tiếp guard bằng
  cách giả lập rebuild đang bay (`players.get("clip1").rebuilding = true`).

**F-201-P3-1 (không phải bug sản phẩm):** cache-hit swap đồng bộ là đúng
(cửa sổ mới đã phủ playhead nên không cần guard); đường partial thật async
(~2 s) nên guard vẫn có khoảng trống để cứu như thiết kế.

## §6. Phát hiện phụ

**F-201-P3-2 — plain-restart nối đoạn có gap 10–25 ms (nghe được, có từ
trước, không do hold).** Sim B (không hold): 10 gap 6,8–25,1 ms, mỗi ~0,9 s,
khớp 11 plain restart (restart-exact 12 lần thì không gap vì bắt đầu sớm
0,1 s). Cơ chế cấu trúc: đoạn hết → tick sau (tới 1 khoảng tick, ~18–24 ms)
mới restart → khoảng lặng bằng độ trễ tick. Vượt ngưỡng 3 ms nên nghe được
(tiếng "tạch"/đứt quãng nhẹ mỗi ~1 s khi phát ngược). Cần headed xác nhận
kích thước chính xác; hướng sửa: cho plain restart cũng bắt đầu sớm như
restart-exact, hoặc rút ngắn khoảng tick — quyết thuộc parent, nợ đợt sau.

**Giả thuyết chưa chứng minh (không đưa vào verdict):** dip RMS 0,588 (so
với 0,664) + zcrHz ~2270 (so với ~2875) kéo dài ~160 ms sau restart ở
idx 196–209 pass headed — có thể là beat giữa 2 đoạn chồng crossfade khi
đoạn cũ ahead ~0,13 s do hold (Δf ≈ 5 Hz → chu kỳ beat ~200 ms). Chưa kiểm
chứng bằng waveform — chỉ ghi nhận, không kết luận.

## §7. Hướng sửa đề xuất (quyết thuộc parent — P3 chỉ đo)

Bản vá thí nghiệm trên BẢN SAO wiring (`sim-hold-mute-201-wiring-exp.ts`,
scratch, không ship): khi đoạn hết hạn GIỮA HOLD, restart ngay trong tick
hold (không chờ tick không-hold). Hai phương án đã đo:

- **C1 "cont" (nối tiếp, giữ cap 0,3 s):** restart ở mẫu tiếp theo
  (segStart+segLength); drift tăng theo hold như hold-through cũ; cap-stop
  vẫn dừng ở heldSec > 0,3 s. Kết quả: im lặng dài 655 → 447 ms (−32%);
  tổng im lặng (trừ startup) 768,5 → 563,0 ms (−27%). Thay đổi tối thiểu,
  giữ nguyên trần drift — nhưng im lặng dài vẫn còn (447 ms vẫn gấp ~150×
  ngưỡng). Chỉ sửa triệt để các hold ngắn (holdMax ≤ ~0,3 s, như mutes
  19–40 ms đợt 200).
- **C3 "loop" (lặp đoạn, bỏ cap-stop):** phát lại cùng đoạn 0,5 s trong
  hold; drift không tăng nên không cần cap. Kết quả: hết im lặng dài;
  tổng im lặng (trừ startup) 768,5 → 112,5 ms — **ngang baseline không-hold
  (B: 137,7 ms)**; phần còn lại chỉ là gap nối đoạn ~10–25 ms (F-201-P3-2,
  có sẵn cả khi không hold). Giá phải trả: tiếng lặp 0,5 s trong hold dài
  (nghe như vấp/lặp — rõ ràng nhưng liên tục, không đứt quãng).
- **C1+C3 lai (đề xuất cân nhắc):** cont khi heldSec ≤ 0,3 s (tiếng tiến
  tiếp, drift ≤ 0,3 s), chuyển sang loop khi vượt cap (không tăng drift,
  không im lặng). Chưa đo — nợ nếu parent chọn hướng này.

Khuyến nghị của P3: **C3 (hoặc lai) là hướng đúng** — vì cap 0,3 s được đặt
ra để chặn drift, mà loop không sinh drift nên cap không còn lý do tồn tại
trên đường loop; C1 giữ cap thì vẫn để lại im lặng 447 ms trong hold dài
(vốn là trường hợp thường gặp ở longA: hold tới 3,5 s). Quyết định thuộc
parent (§14.2).

## §8. Hạn chế & caveats (đọc trước khi dùng số liệu)

1. Replay sim ở độ phân giải record (~18 ms): nội suy tick trong khoảng —
   gap lớn (655 ms @66,6) robust qua cả 2 thứ tự, nhưng gap ngắn 8–47 ms
   không ghim từng cái (A-adv vs A-hold khác nhau); cơ chế H1 thì đã chứng
   minh bằng dump thô headed, không phụ thuộc sim.
2. Pass headed chirp 201 chạy dưới tải (loadavg ~3,03 lúc mở); pass longA
   201 dưới tải nặng (3,3–4,4) — cap/holdMax nhạy với tải; so sánh 3 đợt
   ở §4 đã tính tới yếu tố này (cùng bundle, mẫu vị trí cap ổn định).
3. Sim dùng chirp tổng hợp (không phải audio longA thật); window buffer là
   cửa sổ đảo [40, 70] s; không có rebuild cửa sổ giữa pass (ph không tới
   ngưỡng preload 5 s).
4. Thước drift peakHz/ph sau im lặng dài bị artifact peak đóng băng (§4.3)
   — chỉ dùng median/p90 trong lúc có tiếng.
5. F-201-P3-2 (gap nối đoạn) mới đo bằng sim — cần headed xác nhận kích
   thước trước khi sửa.
6. Dip crossfade-beat (§6) chỉ là giả thuyết, chưa chứng minh.

## §9. Nợ từ (r)-200 — đối chiếu

- (1) hold-mute nghe được không → **CÓ (§1)** — mọi sự kiện vượt ngưỡng
  3 ms với biên 3–230×.
- (2) hold có phải nguyên nhân → **CÓ (§2)** — H1 chứng minh bằng dump thô
  + đối chứng A/B; H2 bị loại.
- (3) theo dõi cap/hold longA → **XONG (§4)** — không phải hồi quy; đính
  chính so sánh (a6)-200 (0 cap là của pass chirp/longB 199, longA 199 có
  4 cap).
- (4) unit test guard clamp → **XONG (§5)** — 10/10 PASS + tsc 0 lỗi +
  90 test reverse xanh.

## §10. File & bằng chứng

- LIMITS này: `docs/PHASE9_ROUND201_P3_REVERSE_LIMITS.md`
- Test guard: `apps/web/src/lib/reverseAudio201P3.test.ts`
- Probe headed 201: `benchmarks/reverse201/audio-probe-201.mjs` (mới)
- Scratch (không stage): `hidden_files/round201-p3/` — `audio-probe-201-*.json`
  (chirp 789 records + longA 1122 records), `analyze201{,b,c,d}.py`,
  `sim201b.ts` + `sim201b-*.wav` + `sim201b-summary.json`,
  `sim201b-*-sources.json`, `measure201.py`, `sim-hold-mute-201-wiring-exp.ts`,
  `build-exp-wiring.py`, `sim-hold-mute-201.ts` (v1, kết luận B-0-gap đã rút
  lại — xem §2.4), `probe-201-*.log`.
- Dữ liệu gốc đối chiếu: `hidden_files/round199-p3/audio-probe-199-*.json`,
  `hidden_files/round200-p3/audio-probe-200-*.json`.
