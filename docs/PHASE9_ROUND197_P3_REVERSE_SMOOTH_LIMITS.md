# PHASE9 ROUND197 P3 — REVERSE SMOOTH: N11b decode cửa sổ — cache decode-once

Đợt 197, luồng sản phẩm (Editing Core — preview/render parity, đợt thứ 7
theo hướng mới lệnh user 15:03 25/11/2026). Nối tiếp LIMITS P3-196.
Quyết parent (a4)-196: ƯU TIÊN N11b decode cửa sổ xuống DƯỚI bar 5.000 ms
(decode từng phần / streaming / cache); đo lại lần đổi cửa sổ thứ 3 +
theo dõi OOM; KHÔNG tự siết cap drift thêm (cap GIỮ 0,3 s); chirp-70s
KHÔNG dùng làm fixture bar N11a từ đợt 197. Kết quả ngắn: **(1) ĐỔI CỬA
SỔ ĐẠT BAR — 20/24/88/90 ms (longB, 4/4 lần, từ cache decode-once),
thay cho 4.825–8.751 ms đợt 196; (2) CỬA SỔ ĐẦU VẪN VƯỢT BAR — longA
5.414 ms, longB 6.314 ms (decode toàn file 1 lần, nhạy tải — chưa có
decode từng phần thật); (3) Drift tuyệt đối VỀ DƯỚI bar cả hai clip
(longA 0,333 s / longB 0,419 s theo S2, cap GIỮ 0,3 s, KHÔNG siết thêm);
(4) Không OOM/crash: avail cuối pass ≥ 1,0 GB, 480/480 mẫu longB đầy đủ.**

Phạm vi: cache decode-once trong `ReverseAudioPlayer` + 2 counter wiring
+ probe decode tách riêng + probe app 3 pass. Không đụng cap drift,
prefetch (GIỮ TẮT), toggle/cổng, không sửa GAP/aggregate, không push.
Bundle đo: `dist/assets/index-QFlZM0bv.js` (1.729.389 B, build 20:53:35Z
26/11/2026, vite 15,92 s). Bundle không đổi trong lúc probe (before ==
after cả 3 pass).

## §1. Probe decode TÁCH RIÊNG — warmup YẾU, tranh chấp mới là chính

Probe mới `benchmarks/reverse197/decode-probe-197.mjs` (nợ §5.1 đợt 195,
§5.1 LIMITS P3-196): decode cùng file 3 lần liên tiếp trong 1
AudioContext rảnh, không phát ngược; đo thêm chi phí slice+reverse 1
cửa sổ 30 s từ buffer đã decode (đường cache) + bộ nhớ. Chạy 20:43–
20:44Z, load 1,3–2,5 (máy tương đối rảnh so với pass app đợt 196).

| file | decode ×3 (ms) | slice+reverse 30 s (ms) | decoded | fetch |
|---|---|---|---|---|
| longA 300 s, 60 MB | **4.876,5 / 3.908,0 / 5.025,9** | 140,1 / 24,1 / 20,5 | ~101 MB | 3.628,6 ms |
| longB 300 s, 26 MB | **1.666,1 / 1.399,1 / 1.321,9** | 20,2 / 17,5 / 65,2 | ~101 MB | 813,1 ms |
| chirp-70s, 1,2 MB | 181,4 / 148,1 / 144,1 | 17,3 / 12,0 / 7,3 | ~11,8 MB | 30 ms |

- **Giả thuyết warmup YẾU ĐI (dữ kiện mới):** longA lần 2 nhanh nhất
  (3.908 ms) nhưng lần 3 lại chậm nhất (5.026 ms) — KHÔNG có xu hướng
  cải thiện đơn điệu qua 3 lần decode; longB giảm nhẹ 1.666 → 1.322 ms
  (không đủ lớn để gọi là warmup hệ thống). Dao động giữa các lần
  (~±25%) theo tải máy, không theo thứ tự lần decode. Mẫu "đổi cửa sổ
  ~3 s" đợt 195 càng không còn đứng: đổi cửa sổ đợt 196 (4,8–8,8 s)
  nay giải thích bằng tải + decode-lại-toàn-file, không phải warmup.
- **Decode KHÔNG tỉ lệ với thời lượng:** longA và longB cùng 300,15 s /
  44.100 Hz / stereo / ~101 MB PCM nhưng longA decode chậm gấp ~3 lần
  longB (4,9 s vs 1,4–1,7 s) — chi phí decode tỉ lệ với độ phức tạp /
  bitrate audio nén (file 60 MB vs 26 MB), không phải thời lượng. Hệ
  quả: bar 5.000 ms cho "cửa sổ đầu" vốn đã sát giới hạn với file audio
  nặng ngay cả khi máy rảnh (longA lần 1: 4.877 ms, biên chỉ 123 ms).
- **Đường cache rẻ hơn ~50–250 lần:** slice+reverse 1 cửa sổ 30 s từ
  buffer đã decode = 20–65 ms ở trạng thái ổn định (140,1 ms ở lát
  đầu tiên của longA — JIT/GC lần đầu; các lát sau 17–65 ms). Đây là
  chi phí đổi cửa sổ sau khi cache — khớp số đo app §2 (20–90 ms).
- **Bộ nhớ:** giữ 1 buffer đã decode 101 MB làm jsHeap tăng 58 → 215 MB
  (longA; heap đo bằng `performance.memory`, nhiễu — xem caveat §4.4);
  avail hệ thống trong lúc probe 1,27 → 1,65 GB (không OOM, không
  crash). Fetch longA 3.629 ms qua HTTP (fetch KHÔNG tính vào
  `lastWindowDecodeMs` — chỉ decode mới tính; nhưng `load tới
  loaded=1` ở probe app thì gồm cả fetch, xem §2).

## §2. Code — decode-once cache + đo headed trên app thật

### 2.1. Thay đổi code (đúng 2 file nguồn + 1 test + tsconfig)

`apps/web/src/lib/reverseAudio.ts` — `loadReversedWindow` nay giữ cache
`decodedCache: { data, decoded }`, key = ĐÚNG object ArrayBuffer bytes
nén mà wiring truyền vào (wiring giữ 1 object `compressed` duy nhất /
slot nên mọi lần đổi cửa sổ của cùng 1 clip đều trúng cache; URL đổi →
player mới nên không lẫn clip):
- Trúng cache → bỏ qua `decodeAudioData`, chỉ trích subarray + đảo 30 s.
- Trượt cache → decode toàn file 1 lần rồi cache NẾU PCM vừa trần
  `REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES = 160.000.000` B (300 s stereo
  48 kHz ≈ 101–115 MB vừa; 600 s stereo ≈ 230 MB thì KHÔNG cache, giữ
  hành vi cũ decode lại mỗi lần).
- Getter mới `lastWindowDecodeCached` (lần load gần nhất có dùng cache
  không) + `dispose()` nhả cache.
- `loadReversed` (clip ≤ 60 s, load 1 lần/slot) KHÔNG đổi — không có
  decode lặp để cache.

`apps/web/src/lib/reverseAudioWiring.ts` — 2 counter mới
`windowDecodeCached` / `windowDecodeFull`, tăng ở cả nhánh cửa sổ đầu
(`loadSlot`) lẫn nhánh đổi cửa sổ nền (`.then`/`.catch`); comment
`lastWindowDecodeMs` cập nhật theo thiết kế mới. Không đổi hành vi
phát/tick/hold/cap nào khác.

`apps/web/src/lib/reverseAudio197P3.test.ts` (MỚI, 6 test) +
`apps/web/tsconfig.json` (exclude test mới, theo mẫu 192–196).

### 2.2. Pass A — longA: cửa sổ đầu 5.414 ms (VƯỢT bar 414 ms); drift 0,333 s

Probe 20:53:44–20:54:22Z, 200 mẫu × 100 ms, bundle QFlZM0bv.js, fixture
longA giống hệt đợt 195/196. Load trong pass 0,70 → 2,21 (máy rảnh hơn
đợt 196: 1,49 → 6,15). Playhead 300,6 → 285,6 (15 s timeline / 20 s
tường ≈ 0,75× realtime).

- **Cửa sổ đầu: `lastWindowDecodeMs` 5.414 ms — VƯỢT bar 5.000 ms
  (+414 ms).** So với 10.765 ms đợt 196 thì giảm ~2 lần (chủ yếu do tải
  thấp hơn, không phải do code — cửa sổ đầu vẫn decode toàn file như
  cũ; decode-probe §1 đo lần 1 longA 4.877 ms khi máy rảnh hơn nữa).
  Load tới loaded=1: 7.210 ms = decode 5.414 ms + fetch ~1,8 ms (fetch
  60 MB, xem §1 — fetch không tính vào bar N11b nhưng người dùng vẫn
  chờ cả hai).
- **Drift (S2): trung vị 0,059 s, p90 0,148 s, TỐI ĐA 0,333 s — DƯỚI
  bar 0,5 s, biên 0,167 s** (đợt 196: max 0,485 s, biên 0,015 s — tốt
  hơn rõ rệt vì hold ngắn hơn dưới tải thấp). Stale S1: 10/119; lag
  S2: 23/119.
- **Cap kích hoạt 2 lần** (`holdCapStop` Δ=2, `holdMaxSec` 2,972 s);
  drift tại cap −0,037 s (idx135) và −0,333 s (idx149) — cả hai < 0,5 s.
  `holdKeep` Δ=132, `holdStop` Δ=382, `playFalse` 0, `playOk` 32.
- **Cache:** Δcached=0, Δfull=1 — đúng thiết kế (cửa sổ đầu phải decode
  thật; pass này không đổi cửa sổ nào vì playhead 285,6 > 270+5).
- Lặng RMS=0: 24 mẫu — 21 mẫu đầu là chờ decode cửa sổ đầu (5,7 s,
  giống đợt 196) + 2 đợt freeze sau cap (12 + 12 mẫu × 100 ms). Không
  lặng mới.
- RMS sounding trung bình 0,3198 (đợt 196: 0,321) — không đổi.
  Waveform không phẳng lần nào (0/119). Avail cuối pass 1.413.308 kB.

### 2.3. Pass B — longB: đổi cửa sổ 20/24/88/90 ms — ĐẠT BAR; drift 0,419 s

Probe 20:55:50–20:58:27Z, 480 mẫu × 250 ms, fixture longB giống hệt
đợt 195/196. Load trong pass 5,68 → 6,63 (tải CAO — luồng khác chạy
mạnh lúc này; đối chứng tốt cho cache dưới tranh chấp). Playhead
300,5 → 188,4 (112,1 s timeline / 120 s tường ≈ 0,93×).

- **Cửa sổ đầu: 6.314 ms — VƯỢT bar** (đợt 196: 5.053 ms — đợt này
  chậm hơn vì load đầu pass 5,68; cửa sổ đầu vẫn decode toàn file,
  nhạy tải như cũ). Load tới loaded=1: 7.094 ms.
- **ĐỔI CỬA SỔ — ĐẠT BAR, cả 4 lần, từ cache: 20 / 24 / 88 / 90 ms**
  (decodeSeq trong probe JSON; Δcached=4, Δfull=1). So với đợt 196
  (5.361 / 7.436 / 8.751 / 4.825 ms): nhanh hơn ~55–400 lần; lần
  chậm nhất 90 ms vẫn chỉ bằng 1,8% bar. Hai lần sau (88/90 ms) chậm
  hơn hai lần đầu (20/24 ms) — dưới load 6,2–6,6 + GC, không phải
  decode lại (counter cached xác nhận cả 4 lần đều từ cache).
  **4/4 lần đổi cửa sổ hoàn tất** (windowRebuilds Δ=4): `[270,2; 300,2]`
  → `[245,1; 275,1]` → `[220,1; 250,1]` → `[195,0; 225,0]` →
  `[170,0; 200,0]`; `rebuilding=true` thấy 0 mẫu (đổi xong trong
  20–90 ms < khoảng lấy mẫu 250 ms — đúng kỳ vọng, không phải thiếu
  dữ kiện: windowRebuilds Δ=4 là bằng chứng đổi đã xảy ra).
- **Drift (S2): trung vị 0,104 s, p90 0,233 s; TỐI ĐA 0,419 s — DƯỚI
  bar 0,5 s, biên 0,081 s** (đợt 196: 0,481 s, biên 0,019 s). Stale
  S1: 82/455; lag S2: 108/455.
- **Cap kích hoạt 1 lần** (holdMaxSec 0,372 s — hold ngắn hơn nhiều
  so với đợt 196: 0,740 s, vì GOP15 seek nhanh + tải dồn vào đầu
  pass); drift tại cap −0,419 s (idx177) — < 0,5 s.
- **`playFalse` = 2 — F-197-P3-1 (mới, xem §4.1):** 1 tick ở mỗi lần
  đổi cửa sổ thứ 3 (idx318) và thứ 4 (idx429), đúng mẫu cửa sổ mới
  vừa xuất hiện; RMS tại cả hai mẫu vẫn có tiếng (0,2876 / 0,3341)
  — đoạn cũ 0,5 s đang phát chồng lên nên KHÔNG hở tiếng nghe được.
  Đây là race 1 tick ở biên cửa sổ (source time ramp chạy trước
  display ~0,1–0,3 s), không phải hở tiếng do decode.
- Lặng RMS=0: 4 mẫu (idx146/157/227/400, mỗi mẫu 250 ms, rời rạc,
  KHÔNG trùng điểm đổi cửa sổ — micro-hold/analyser; đợt 196: 8/464).
  RMS sounding trung bình 0,3223 (đợt 196: 0,3217) — không đổi.
  `restartExact` 20 (đợt 196: 81 — ít hơn vì hold ngắn hơn, ít restart
  hơn; không phải hồi quy: restart 269, playOk 291, playFalse chỉ 2).
- **OOM: KHÔNG.** Avail cuối pass 1.003.500 kB (thấp nhất trong 3
  pass — cache 101 MB + Chrome + tải máy), hồi lên 1.787.612 kB sau
  khi Chrome đóng. Trang KHÔNG mất trạng thái: 480/480 mẫu đầy đủ,
  counters nguyên vẹn tới cuối pass (lần đổi cửa sổ thứ 3 quan sát
  lần thứ 2 liên tiếp — F-195-P3-2 vẫn đóng).

### 2.4. Pass C — chirp-70s: KHÔNG HỒI QUY (chỉ tham khảo, không verdict N11a)

Probe 21:00:53–21:01:20Z, 130 mẫu × 100 ms, clip `chirp-70s.mp4`
(giống hệt đợt 193/195/196). Load 2,03 → 3,94.

- **Decode cửa sổ đầu 981 ms** (đợt 196: 1.199 ms); load tới loaded=1:
  1.190 ms. `holdMaxSec` 0,290 s — cap KHÔNG kích hoạt lần nào
  (đợt 196: cap 2 lần, holdMax 0,691 s — hold ngắn hơn do tải/GOP
  khác nhau giữa các lần đo, không phải thay đổi code: đường hold
  không đụng đợt này).
- `restart` 46 (đợt 196: 39), `restartExact` 0 (đợt 196: 5 — dao động
  theo thời điểm biên đoạn, không phải hồi quy: restartExact chỉ
  kích hoạt khi đoạn sắp hết + lệch nhỏ), `playOk` 47 (196: 41),
  `playFalse` 0. RMS sounding trung bình 0,6716 (196: 0,662) ≈
  forward 0,67. Lặng RMS=0: 0 mẫu sau khi tiếng lên (196: 6 mẫu
  quanh cap — nay cap không kích hoạt nên không có).
- **Drift clip 70 s KHÔNG kết luận** (như đợt 195/196 §3): fixture
  chirp KHÔNG tuần hoàn, bin 0,611 s > bar 0,5 s — theo quyết
  (a4)-196, chirp-70s KHÔNG dùng làm fixture bar N11a từ đợt 197;
  số drift thô in ra (median 2,174 s / max 4,996 s) là SAI công thức,
  không phải drift thật. Chỉ lấy cap/decode/restartExact làm kết luận.

## §3. Kết luận N11b + drift (đối chiếu quyết (a4)-196)

| hạng mục | 197 | 196 | bar | verdict |
|---|---|---|---|---|
| Đổi cửa sổ longB (cache) | 20 / 24 / 88 / 90 ms | 5.361 / 7.436 / 8.751 / 4.825 ms | < 5.000 ms | **ĐẠT** |
| Cửa sổ đầu longA | 5.414 ms | 10.765 ms | < 5.000 ms | CHƯA ĐẠT (+414 ms) |
| Cửa sổ đầu longB | 6.314 ms | 5.053 ms | < 5.000 ms | CHƯA ĐẠT (+1.314 ms) |
| Drift tuyệt đối longA (S2) | 0,333 s | 0,485 s | ≤ 0,5 s | ĐẠT (biên 0,167 s) |
| Drift tuyệt đối longB (S2) | 0,419 s | 0,481 s | ≤ 0,5 s | ĐẠT (biên 0,081 s) |
| Cap drift | GIỮ 0,3 s, không siết | — | — | theo (a4)-196 |

- **Khoản (1) ĐẠT MỘT NỬA:** đổi cửa sổ đã về dưới bar với biên rất
  lớn (lần chậm nhất 90 ms = 1,8% bar, kể cả dưới load 6,6) — cache
  decode-once giải quyết đúng phần "đổi cửa sổ" của N11b. **Cửa sổ
  đầu vẫn vượt bar cả hai clip** — cache không giúp lần đầu (phải
  decode toàn file 1 lần); muốn cửa sổ đầu < 5.000 ms cần decode
  từng phần thật (demux MP4 + WebCodecs AudioDecoder chỉ decode 30 s
  cần phát) — nợ Hiệu suất chuyển sang đợt 198, KHÔNG tự nhận đã
  xong N11b. Lưu ý: bar cửa sổ đầu vốn sát giới hạn vật lý của
  decode-toàn-file với audio nặng (decode-probe §1: longA lần 1
  4.877 ms khi máy rảnh — biên chỉ 123 ms).
- **Khoản (2) xong:** lần đổi cửa sổ thứ 3 quan sát lần thứ 2 liên
  tiếp (4/4 đổi hoàn tất pass B); theo dõi OOM: avail thấp nhất
  1.003.500 kB trong pass B, không crash, không mất trang, không
  ENOSPC mới.
- **Khoản (3) xong:** cap GIỮ 0,3 s (không sửa hằng nào về drift đợt
  này); drift tuyệt đối max 0,333/0,419 s — dưới bar 0,5 s cả hai
  clip, biên dày hơn đợt 196 (0,081–0,167 s vs 0,015–0,019 s) nhờ tải
  thấp hơn ở pass A + hold ngắn hơn ở pass B. N11a-longB verdict
  cuối vẫn thuộc P4 với thước của P4 (S2 mới: 0,419 s ĐẠT; thước cũ
  S1: max thô 1,344 s — là nhiễu analyser, xem §1.4 đợt 196).
- **Không hồi quy** audio đảo xuyên hold + crossfade/restart-exact
  (pass C: playFalse 0, RMS ~0,67; pass B: restartExact 20, playOk
  291; chỉ F-197-P3-1 là mới — 2 tick playFalse ở biên đổi cửa sổ,
  không hở tiếng).

## §4. File đổi, kiểm chứng tổng, caveat

### 4.1. F-197-P3-1 (mới) — playFalse 1 tick ở biên đổi cửa sổ

2 tick `playFalse` ở pass B (idx318/idx429), mỗi tick đúng mẫu cửa sổ
mới vừa xuất hiện (đổi 3: [195,225], đổi 4: [170,200]). Cơ chế:
`playSegment` trả false khi offset kỳ vọng nằm ngoài cửa sổ hiện tại;
tại tick đổi cửa sổ, source time ramp (dùng tính offset) chạy trước
display timeText ~0,1–0,3 s nên 1 tick offset vừa vượt mép trên cửa sổ
mới. Không hở tiếng: RMS tại cả hai mẫu vẫn có tiếng (đoạn cũ 0,5 s
đang phát chồng), mẫu sau phát lại bình thường. Đợt 196 có 0 playFalse
— race này trước đây bị che vì rebuild 5–9 s (tick đổi cửa sổ hiếm
khi rơi đúng mẫu lấy mẫu); nay rebuild 20–90 ms nên tick biên dễ bị
lấy mẫu hơn. **Đề xuất P3-198:** ở tick đầu sau khi cửa sổ đổi, clamp
offset kỳ vọng vào trong cửa sổ mới (hoặc giữ đoạn cũ thêm 1 tick)
thay vì đếm playFalse — sửa nhỏ, cần test fake trước. Không sửa trong
đợt này (ngoài phạm vi N11b, không ảnh hưởng tiếng nghe được).

### 4.2. Kiểm chứng tổng

- `node --experimental-strip-types`: reverseAudio 7, reverseAudio192P3
  12/12, reverseAudio193P3 15, reverseAudio194P3 7/7, reverseAudio195P3
  3/3, reverseAudio196P3 5/5, **reverseAudio197P3 6/6 (MỚI)**,
  reversePlayback 10/10, reversePlayback191P3 7, reversePlayback192P3
  13, reversePlayback193P3 5/5, reverseCadence 9, seek 21, seek193P3
  6/6 — đều PASS (14 suite).
- `npx tsc --noEmit` **0 lỗi** (chạy 2 lần: trước build lần 1 — lỗi do
  file P4 đang sửa dở, xem §4.3 — và sau khi file P4 ổn định).
- `npm run build` **PASS** (build 20:53:35Z, index-QFlZM0bv.js
  1.729.389 B, vite 15,92 s — bundle đo cả 3 pass).

### 4.3. Build lần 1 lỗi do file luồng khác đang sửa dở (không phải code P3)

Build 20:48Z lỗi `parityHarness197.ts(2842,1326): Cannot find name
'contaminated'` — file của P4-197 đang được ghi dở lúc đó (194.127 B
lúc lỗi → 195.543 B sau đó; `grep contaminated` sau đó trả 0 kết quả
trong file; không file app nào import parityHarness197 — nó là harness
node độc lập nên lỗi chỉ chặn bước `tsc` toàn dự án, không chặn
`vite build`). P3 KHÔNG sửa file P4; chờ 45 s rồi chạy lại
`tsc --noEmit` = 0 lỗi, build lại PASS. Ghi nhận để T10 biết build
lần 1 lỗi là do xung đột ghi song song, không phải hồi quy code P3.
Cây đổi trong lúc làm việc: bundle đo QFlZM0bv.js chứa cây lúc
20:53:35Z + wiring/cache mới của P3; các sửa sau 20:53Z của luồng khác
(nếu có) KHÔNG có trong bundle đo — bundle before == after cả 3 pass
nên số đo tự nhất quán.

### 4.4. T4 — 0 chồng cửa yên + caveat bộ nhớ

- **0 lần chồng pha (b) T4: 0 "CUA YEN MO" trong `poll-t4.log` trước,
  trong và sau mọi lần chạy nặng** (decode probe 20:43Z, build
  20:48Z + 20:53Z, pass A 20:53Z, pass B 20:55Z, pass C 21:00Z —
  kiểm ngay trước mỗi lần; T4-197 tới 21:02Z vẫn chỉ poll, gate0
  chưa đạt, chưa mở attempt nào — hạn cắt poll 22:30Z). Không có
  F-197-P3-x vi phạm.
- **Caveat (tự báo, nhẹ): heap `performance.memory` nhiễu** — giữ
  buffer decode 101 MB làm heap báo 58 → 215 MB (longA) nhưng con số
  này gồm cả GC lag (3 buffer `out` 30 s trong vòng slice đã thả vẫn
  chưa GC kịp lúc đo); avail hệ thống mới là tín hiệu OOM đáng tin:
  thấp nhất 1.003.500 kB trong pass B, không crash. Đổi lại: mỗi slot
  clip dài nay giữ thêm ~101 MB RAM thường trú (cache) + 60 MB bytes
  nén + 11,5 MB cửa sổ — chấp nhận được cho 1 clip active, nhưng nếu
  nhiều clip dài cùng mở thì cache cộng dồn (trần 160 MB / player).
  Chưa đo đa-clip — nợ nhỏ cho đợt sau nếu P3-198 đụng tới.

### 4.5. File đổi (xem paths file)

`apps/web/src/lib/reverseAudio.ts` (cache decode-once + getter +
dispose + trần 160 MB), `apps/web/src/lib/reverseAudioWiring.ts`
(2 counter windowDecodeCached/windowDecodeFull),
`apps/web/src/lib/reverseAudio197P3.test.ts` (MỚI, 6 test),
`apps/web/tsconfig.json` (exclude test mới),
`benchmarks/reverse197/decode-probe-197.mjs` (MỚI — probe decode tách
riêng), `benchmarks/reverse197/audio-probe-197.mjs` (MỚI — probe app,
từ probe 196 + đếm cache + avail),
`benchmarks/reverse197/audio-waveform-197-*.json` (MỚI, 3 file —
xem §4.6), LIMITS này. **Cả 3 waveform JSON đều VƯỢT 37.768 B nên
lúc push cần ENABLE_PRIVSEP=0** (như waveform 194/195/196). Dữ liệu
probe thô đầy đủ (JSON 3 pass + decode-probe) chỉ ở
`~/workspace/tmp-round197-p3/` (scratch, không stage). Fixture mp4
tái dùng từ `~/workspace/tmp-round195-p3/` (longA/longB) và
`~/workspace/tmp-round193-p3/` (chirp-70s) — không copy lại, không
stage binary. `dist` build mới không stage.

### 4.6. Kích thước waveform JSON (vượt trần push)

- `audio-waveform-197-longA-300s-gop300-720p.json`: **178.443 B**
- `audio-waveform-197-longB-300s-gop15-360p.json`: **425.119 B**
- `audio-waveform-197-chirp-70s.json`: **114.054 B**

## §5. Giới hạn còn lại — nợ chuyển sang đợt 198

1. **Cửa sổ đầu > 5 s (§2.2/§2.3):** longA 5.414 ms, longB 6.314 ms —
   vẫn decode toàn file 1 lần. Giải pháp thật: decode từng phần
   (demux MP4 lấy đúng chunk audio của 30 s cần phát + WebCodecs
   AudioDecoder) — cần viết demux (repo chưa có mp4box; hạ tầng demux
   video GOP đã có ở `reverseWebcodecs.ts`/`gop*` nhưng chưa có cho
   audio) hoặc decode nền sớm hơn (prefetch cửa sổ đầu lúc import —
   prefetch GIỮ TẮT theo kết luận 194, không xét lại nếu không có
   quyết mới). Nợ Hiệu suất.
2. **F-197-P3-1:** playFalse 1 tick ở biên đổi cửa sổ (2 tick pass B)
   — đề xuất clamp offset ở tick đầu sau đổi cửa sổ (P3-198).
3. **Cache đa-clip chưa đo:** mỗi slot dài giữ ~101 MB thường trú;
   chưa đo 2+ clip dài cùng mở (cộng dồn cache) — nợ nhỏ.
4. Nợ cũ còn nguyên: lệch mép cửa sổ đầu (§5.3 đợt 195); reverse mượt
   dưới tải (0,55–0,70 fps ở 720p GOP30, §3 đợt 194); scrub ngược trên
   clip dense/GOP dài chưa đo. Prefetch GIỮ TẮT.

## §6. Ghi chú cho parent

- Khoản N11b ĐỔI CỬA SỔ xong: **20/24/88/90 ms — ĐẠT bar 5.000 ms
  với biên lớn**, nhờ cache decode-once (decode 1 lần, các lần sau
  chỉ trích + đảo). Khoản CỬA SỔ ĐẦU chưa xong: **5.414 / 6.314 ms —
  VƯỢT bar** (decode toàn file 1 lần, nhạy tải) — cần decode từng
  phần thật, nợ đợt 198.
- Cap drift GIỮ 0,3 s (không siết thêm theo (a4)-196): drift tuyệt đối
  max **0,333 s (longA) / 0,419 s (longB)** — dưới bar 0,5 s, biên dày
  hơn đợt 196. N11a-longB verdict cuối thuộc P4.
- Không OOM/crash; 0 chồng cửa yên T4; F-197-P3-1 mới (2 tick
  playFalse ở biên đổi cửa sổ, không hở tiếng) giao P3-198.
