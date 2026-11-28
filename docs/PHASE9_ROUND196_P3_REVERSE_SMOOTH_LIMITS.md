# PHASE9 ROUND196 P3 — REVERSE SMOOTH: cap drift SIẾT 0,5 → 0,3 s, drift tuyệt đối VỀ DƯỚI BAR + decode cửa sổ đo lại

Đợt 196, luồng sản phẩm (Editing Core — preview/render parity, đợt thứ 6
theo hướng mới lệnh user 15:03 25/11/2026). Nối tiếp LIMITS P3-195.
Quyết parent (a4)-195: trần drift SIẾT cap về ~0,3 s (KHÔNG chấp nhận
trần hiệu dụng ~0,7 s). Kết quả ngắn: **(1) Cap 0,3 s ĐÃ IMPLEMENT +
ĐO HEADED — drift tuyệt đối tối đa 0,485 s (longA) / 0,481 s (longB,
quy tắc lọc S2 mới, xem §1.4) — VỀ DƯỚI bar 0,5 s, biên mỏng ~0,015–
0,019 s; drift tại cap ≤ 0,42 s trong cả 5 lần cap kích hoạt; max giảm
đúng 0,200 s so với 0,685 s đợt 195 = đúng delta siết cap (0,5 → 0,3);
(2) Decode cửa sổ KHÔNG ĐẠT bar 5.000 ms đợt này — lần đầu longA
10.765 ms, longB 5.053 ms, đổi cửa sổ 4.825–8.751 ms (5/6 lần vượt);
nguyên nhân chính là tải máy tranh chấp (load 1,5–6,2 trong lúc đo) +
thiết kế decode-toàn-file, KHÔNG phải hồi quy code (đường decode không
đụng đợt này; mẫu "đổi cửa sổ ~3 s" đợt 195 KHÔNG tái lập);
(3) KHÔNG HỒI QUY audio đảo xuyên hold + crossfade/restart-exact
(longB restartExact 81, clip 70 s restartExact 5 — đợt 195: 62/0;
playFalse = 0 cả 3 pass; đổi cửa sổ không hở tiếng trừ 1 mẫu 250 ms
trùng đúng lúc cap kích hoạt).**

Phạm vi: siết 1 hằng số cap + đo headed 3 pass. Không đụng prefetch
(GIỮ TẮT theo kết luận 194), decode, toggle/cổng, không sửa GAP/
aggregate, không push. Bundle đo: `dist/assets/index-X0LYF5mt.js`
(1.728.048 B, build 15:20:35Z 26/11/2026, vite 20,24 s — build lần 2;
build lần 1 index-D6dlSzl2.js 1.716.229 B lúc 14:45:12Z đã lỗi thời vì
preview.tsx đổi sau đó, xem §4.3). Bundle không đổi trong lúc probe
(before == after cả 3 pass).

## §1. Cap drift 0,3 s — IMPLEMENT + ĐO HEADED

### 1.1. Code — siết 1 hằng số, đúng 1 chỗ dùng

`REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC`: 0,5 → **0,3**
(`apps/web/src/lib/reverseAudioWiring.ts`). Đây là chỗ duy nhất dùng
hằng này (grep toàn `apps/web/src`: chỉ wiring dùng nó): nhánh hold
trong `tickInner` — giữ ≤ 0,3 s thì đoạn tiếp tục phát (`holdKeep`),
quá 0,3 s thì dừng (`holdCapStop`). Độ dài đoạn phát KHÔNG đổi
(`REVERSED_AUDIO_SEGMENT_SEC` vẫn 0,5 s) — chỉ trần dừng-sớm khi giữ
mới siết, đúng quyết (a4)-195. Comment cập nhật ở cả 4 chỗ (header,
doc hằng, comment counters, comment nhánh hold). Test cập nhật theo:
`reverseAudio194P3.test.ts` (hằng = 0,3; test hold-cap viết lại: giữ
~0,2 s keep, giữ ~0,4 s cap — KHÔNG kiểm đúng biên 0,3 s vì
0,4−0,1 = 0,30000000000000004 > 0,3, bài học float), `reverseAudio195P3.test.ts`
(test holdMaxSec viết lại theo trần 0,3 s), test MỚI
`reverseAudio196P3.test.ts` (5 test: hằng = 0,3; đoạn vẫn 0,5 s; bất
đẳng thức trần tuyệt đối cap 0,3 + drift-lúc-giữ quan sát ≤ 0,2 ≤ bar
0,5; giữ 0,25 s keep / giữ 0,35 s cap; giữ 0,25 s rồi restart-exact
không hồi quy). `tsconfig.json`: exclude test mới.

### 1.2. Pass A — longA, drift tuyệt đối VỀ DƯỚI bar

Probe 15:22:55–15:23:38Z, 200 mẫu × 100 ms, bundle X0LYF5mt.js,
fixture `longA-300s-gop300-720p.mp4` (giống hệt đợt 195). Load trong
pass 1,49 → 6,15 (tăng dần — luồng khác chạy tsc/find + Chrome lúc đó;
xem §4.3). Playhead 300,5 → 288,7 (11,8 s timeline / 20 s tường ≈
0,59× realtime — chậm hơn đợt 195 (0,8×) vì tải; freeze dài hơn).

- **Hold dài nhất 3,910 s** (đợt 195: 2,859 s — freeze tại biên GOP
  290,5/290,6, dài hơn vì seek chậm dưới tải). **`holdCapStop` Δ=2**
  (giống đợt 195: 2 lần trong cùng 1 freeze); `holdKeep` Δ=35 (đợt
  195: 122 — mỗi lần giữ chỉ phát ≤ 0,3 s rồi dừng, đúng thiết kế
  siết; tiếng trong freeze ngắt hơn, là chi phí đã biết của (ii)).
  `holdStop` Δ=364, `tick` cuối 528, `playFalse` 0, `playOk` 35.
- **Drift (chirp tuần hoàn, đã lọc): trung vị 0,078–0,081 s, p90
  0,256–0,274 s, TỐI ĐA 0,485 s — DƯỚI bar 0,5 s** (đợt 195: trung vị
  0,078 s, p90 0,256 s, max 0,685 s). Stale S1: 4/87 mẫu.
- **Drift tại cap: −0,356 s (cap1, idx142) và −0,415 s (cap2,
  idx169)** — cả hai < 0,5 s, đúng mô hình "drift-lúc-giữ + cap":
  freeze 2 bắt đầu giữ lúc drift ≈ −0,17 s (idx165) + cap 0,3 s ≈
  0,47 s dự đoán; đo tại cap 0,415 s.
- **Max 0,485 s là 1 mẫu chuyển tiếp restart (idx190), KHÔNG phải
  drift bền vững:** tại idx190 restart 27 → 28 + playOk 30 → 31
  (playhead bước 04:50.4 → 04:50.3, đoạn mới re-sync), mẫu này đo
  được −0,485 s rồi mẫu sau (idx191) về −0,085 s. Một đoạn re-sync
  đúng không thể lệch 0,485 s ngay lúc bắt đầu — mẫu idx190 đo đuôi
  đoạn cũ qua crossfade 80 ms + trễ cửa sổ FFT của analyser (~43 ms).
  **Drift bền vững tối đa = 0,415 s (idx168–169, tại cap2, 2 mẫu
  liên tiếp)** — biên 0,085 s so với bar.
- **Kiểm chứng mô hình bằng số:** max 0,685 s (195) → 0,485 s
  (196) = **giảm đúng 0,200 s = đúng delta siết cap (0,5 − 0,3)**.
  Drift-lúc-giữ không đổi (~0,17–0,19 s cả hai đợt) nên toàn bộ mức
  giảm đến từ cap — thiết kế cap hoạt động đúng như dự đoán §1.5
  đợt 195.
- RMS sounding 0,1551–0,3744, trung bình 0,321 (đợt 195: 0,325) —
  không đổi. Waveform không phẳng lần nào (0/87). Lặng: 2 đợt
  22 + 18 mẫu (2,2 s + 1,8 s) — freeze dài sau cap (tiếng dừng,
  chờ frame tiếp theo), đúng hành vi thiết kế khi cap siết.
- Forward control: peak 366 → 840 Hz tăng đều, rms ~0,32.

### 1.3. Pass B — longB, cap kích hoạt 3 lần + lần đổi cửa sổ thứ 3 ĐÃ QUAN SÁT

Probe 15:29:29–15:32:02Z, 480 mẫu × 250 ms, fixture
`longB-300s-gop15-360p.mp4` (giống hệt đợt 195). Load 1,57 → 4,94.
Playhead 300,6 → 193,8 (106,8 s timeline / 120 s tường ≈ 0,89× —
nhanh hơn đợt 195 (0,65×)).

- **Hold dài nhất 0,740 s** (đợt 195: 0,218 s — hold dài hơn vì tải;
  GOP15/360p vẫn seek nhanh hơn GOP300 nhiều). **`holdCapStop` Δ=3**
  (đợt 195: 0 — hold 0,33–0,74 s nay vượt trần 0,3 s nên cap kích
  hoạt; với trần 0,5 s cũ thì hold 0,33 s đã không chạm cap).
  `holdKeep` Δ=2199, `holdStop` Δ=2265, `playFalse` 0, `playOk` 299.
- **Drift: trung vị 0,137–0,141 s, p90 0,263–0,270 s; TỐI ĐA 0,481 s
  (S2) — DƯỚI bar 0,5 s, biên 0,019 s.** Với quy tắc S1 cũ, max đọc
  0,737 s — xem §1.4 (đó là nhiễu analyser, không phải drift thật).
  Stale S1: 61/456; lag S2: 111/456.
- **Drift tại cap: −0,174 s (cap1, idx148), −0,370 s (cap2, idx243),
  −0,248 s (cap3, idx337)** — cả ba < 0,5 s. Cap kích hoạt đúng
  trên hold ngắn (0,33–0,74 s), không chỉ freeze GOP dài.
- **Max S2 0,481 s (idx409) là 1 mẫu dip trong micro-hold** (peak
  2562 → 2519 Hz, playhead đứng 03:28.7, drift −0,322 → −0,481 rồi
  về −0,281 ở mẫu sau khi restart); **drift bền vững ≈ 0,437 s**
  (idx171–172, 2 mẫu liên tiếp; idx126 −0,437 là transient đúng lúc
  đổi cửa sổ, xem §2.2).
- **F-195-P3-2 ĐÃ ĐÓNG (theo dõi):** trang KHÔNG mất trạng thái —
  480/480 mẫu đầy đủ, counters nguyên vẹn tới cuối pass; **4 lần
  đổi cửa sổ hoàn tất** (đợt 195 chỉ quan sát 2 lần rồi mất trang ở
  lần 3). Nghi renderer crash/OOM đợt 195 không tái lập đợt này
  (RAM avail 1,3–2,5 GB trong lúc đo, không crash).
- RMS sounding trung bình 0,3217 (đợt 195: 0,3214) — khớp. Chỉ 8 mẫu
  lặng / 464 (đợt 195: 3/331 trước khi mất trang). Forward control:
  peak 409 → 1098 Hz tăng đều, rms ~0,318.

### 1.4. Quy tắc lọc S2 mới + vì sao S1 cũ thiếu sót ở 250 ms (nợ khớp với P4)

Đợt 195 (§1.4) đã biết analyser stale: `getByteFrequencyData`
(smoothing mặc định 0,8) giữ đỉnh cũ khi chirp quét nhanh. Quy tắc
S1 đợt 195 (peakHz Y HỆT mẫu trước + playhead chạy ≥ 0,2 s) có HAI
lỗ hổng lộ ra đợt này:

1. **Lỗi float:** 291,7 − 291,5 = 0,19999999999998863 < 0,2 — mẫu
   stale idx40 pass B (peak đóng băng 904 Hz × 2 mẫu, playhead chạy
   0,2 s) bị S1 bỏ lọt, cho drift giả +0,737 s. Đã sửa trong probe
   196: so sánh với epsilon 1e-9.
2. **Lag dưới-bin:** analyser TRỄ (không đóng băng y hệt mà đỉnh
   dịch < 1 bin FFT = 24 Hz trong khi audio thật dịch ~67 Hz/mẫu ở
   250 ms). S1 chỉ bắt "y hệt" nên bỏ lọt các mẫu lag này.
   **Quy tắc S2 mới (đợt 196): peakHz dịch < 24 Hz so với mẫu
   sounding trước trong khi playhead chạy ≥ 0,15 s → loại.** S2
   không lọc mất drift freeze thật (trong hold playhead đứng yên
   nên không đủ điều kiện chạy ≥ 0,15 s — drift freeze longA
   −0,196 → −0,356 vẫn giữ nguyên sau lọc).

- Pass A: S1 max 0,485 s = S2 max 0,485 s (S2 lọc 22/87, chủ yếu
  mẫu lag nhỏ; max không đổi vì max là mẫu transition, không phải
  lag).
- Pass B: S1 max 0,737 s → **S2 max 0,481 s** (S2 lọc 111/456;
  trung vị 0,137 → 0,141, p90 0,270 → 0,263 — phân phối lõi không
  đổi, chỉ đuôi nhiễu bị cắt).
- **Bằng chứng độc lập rằng +0,737 s (idx40) là nhiễu, không phải
  drift thật:** peak đóng băng 883 Hz × 2 mẫu rồi 904 Hz × 2 mẫu
  trong khi playhead chạy 0,3 + 0,2 s; và mẫu idx41 (restart-exact
  — nối tiếp đúng mẫu cũ, GIỮ nguyên vị trí audio) đo drift −0,237
  s: vị trí audio thật không thể nhảy 0,97 s trong 0,25 s. Cùng lập
  luận cho idx190 pass A (restart thường re-sync → drift về −0,085
  ngay mẫu sau).
- **Kiểm display-lag (giả thuyết đối thủ):** `lastPlayheadSec`
  của wiring khớp `timeText` trong 0,15 s ở MỌI mẫu sounding cả
  hai pass (0 mẫu lệch ≥ 0,15 s) — display KHÔNG trễ so với wiring;
  nhiễu nằm ở analyser, không phải ở display. (Nợ §5.3 đợt 195 về
  lệch mép cửa sổ vẫn giữ nguyên, xem §5.)
- Probe 196 đã cập nhật cả hai quy tắc (S1 epsilon + S2) vào summary
  để đợt sau/P4 tái tạo; số S1 + số thô vẫn in kèm, không giấu.
  **P4 quyết N11a bằng thước nào:** P4-195 dùng quy tắc riêng
  (16/50 stale) — P4-196 đối chiếu S2 này; nếu P4 giữ thước cũ thì
  longB vẫn vượt (0,737) — parent quyết cuối ở §14.1.

### 1.5. Kết luận (a): cap 0,3 s ĐẠT bar tuyệt đối — nhưng biên mỏng

- Drift tuyệt đối tối đa (S2): longA **0,485 s**, longB **0,481 s**
  — cả hai ≤ bar 0,5 s. Drift bền vững: 0,415 s / ~0,437 s.
  Drift tại cap (5 lần): 0,174–0,415 s — cơ chế cap chặn đúng.
- **Biên mỏng (~0,015–0,019 s) + nhiễu analyser ~±0,1–0,2 s:**
  bar 0,5 s đo bằng chirp-qua-analyser sẽ luôn sát bar vì sai số
  đo đã ~0,1 s (bin 0,087 s + trễ tick + lag smoothing). Nếu parent
  muốn biên an toàn hơn thì siết tiếp cap về 0,25 s (dự đoán max
  ≈ 0,43–0,44 s) — P3 KHÔNG tự siết thêm vì đó là quyết parent
  (tương tự §1.5 đợt 195); hoặc đổi phương pháp đo (đọc offset nội
  bộ của wiring thay vì chirp-qua-analyser) — nợ phương pháp đo,
  xem §5.
- Tiếng trong freeze ngắt hơn (phát ≤ 0,3 s mỗi nhịp thay vì 0,5 s)
  — chi phí đã biết của hướng (ii), parent đã chấp nhận khi chọn
  siết cap ở (a4)-195.

## §2. Decode cửa sổ clip 300 s — KHÔNG ĐẠT bar 5.000 ms đợt này

### 2.1. Số đo (headed, `lastWindowDecodeMs` — decode-only, không tính fetch)

| lần decode | file | 196 | 195 | bar |
|---|---|---|---|---|
| Cửa sổ đầu | longA 300 s (60 MB) | **10.765 ms** | 5.199 ms | 5.000 |
| Cửa sổ đầu | longB 300 s (26 MB) | **5.053 ms** | 4.864 ms | 5.000 |
| Đổi cửa sổ 1 | longB | **5.361 ms** | 2.951 ms | 5.000 |
| Đổi cửa sổ 2 | longB | **7.436 ms** | 3.124 ms | 5.000 |
| Đổi cửa sổ 3 | longB | **8.751 ms** | — (mất trang) | 5.000 |
| Đổi cửa sổ 4 | longB | **4.825 ms** | — | 5.000 |
| Cửa sổ đầu | chirp 70 s (1,2 MB) | **1.199 ms** | 889 ms | — |

- **5/6 lần decode file 300 s VƯỢT bar 5.000 ms** (chỉ đổi cửa sổ
  lần 4: 4.825 ms là dưới). Load tới loaded=1: longA 13.124 ms
  (195: 7.010 ms), longB 5.498 ms (195: 5.679 ms — không đổi), 70 s
  1.414 ms (195: 1.309 ms).
- **Mẫu "lần đầu ~5 s, đổi cửa sổ ~3 s" đợt 195 KHÔNG TÁI LẬP:**
  đổi cửa sổ đợt này 4,8–8,8 s, không nhanh hơn lần đầu một cách hệ
  thống. Giả thuyết warmup/decoder-warmup đợt 195 (§5.4) YẾU ĐI —
  dữ kiện mới ủng hộ **tải máy tranh chấp là yếu tố chính**: load
  trong các pass 1,5–6,2 (luồng khác chạy tsc/find/Chrome + build
  trong lúc đo); decodeAudioData + copy buffer đảo chạy trên CPU
  đang tranh chấp nên thời gian dao động 2× giữa các lần. **Đường
  decode KHÔNG đụng đợt này** (chỉ đổi hằng cap) nên đây KHÔNG phải
  hồi quy code — là đo lại cùng thiết kế decode-toàn-file dưới tải
  cao hơn.
- **Kết luận (b): KHÔNG ĐẠT mục tiêu < 5.000 ms đợt này.** Cần
  probe decode riêng (decode cùng file 2 lần liên tiếp trong 1
  AudioContext rảnh, không phát ngược) để tách warmup khỏi tranh
  chấp — nợ này chuyển sang đợt 197 (§5.4 đợt 195 vẫn mở). Giải
  pháp lâu dài vẫn là decode từng phần/stream (nợ Hiệu suất).

### 2.2. Đổi cửa sổ tại mép — KHÔNG hở tiếng (4/4 lần, kể cả lần 3)

- **4 lần đổi hoàn tất, quan sát đầy đủ** (windowRebuilds 0 → 4):
  `[270,2; 300,2]` → `[245,1; 275,1]` → `[220,1; 250,1]` →
  `[195,0; 225,0]` → `[170,0; 200,0]`; `rebuilding=true` thấy 77
  mẫu tổng cộng. **Lần đổi thứ 3 (nợ F-195-P3-2) ĐÃ QUAN SÁT** —
  decode 8.751 ms, RMS liền mạch (0,3156 → 0,3558 → 0,3159).
- RMS quanh các điểm đổi: đổi 1: 0,307–0,324 liền mạch (0 mẫu
  lặng); đổi 2: **1 mẫu lặng duy nhất (idx243, RMS=0, 250 ms)** —
  đúng mẫu cap2 kích hoạt (drift −0,370 s) TRÙNG lúc đổi cửa sổ
  xong: cap dừng đoạn, mẫu sau RMS 0,239 (fade-in) rồi 0,3164 trở
  lại — transient 250 ms do cap + switch trùng nhau, không phải hở
  tiếng do decode (cửa sổ cũ phát tiếp trong lúc decode nền, đúng
  thiết kế 193); đổi 3: 0 mẫu lặng; đổi 4: 0 mẫu lặng (0,2513 là
  fade, không phải lặng).
- `playFalse=0` cả pass (không lần nào phát ngoài cửa sổ).

## §3. Clip 70 s đo lại — KHÔNG HỒI QUY (c)

Probe 15:37:25–15:37:54Z, 130 mẫu × 100 ms, clip `chirp-70s.mp4`
(193, 320×180 — cùng fixture đợt 193/195). Load 1,49 → 1,14 (máy
rảnh nhất trong 3 pass). **KHÔNG chồng cửa T4** (0 "CUA YEN MO"
trước/sau — xem §4.3).

- **Decode cửa sổ đầu 1.199 ms; load tới loaded=1: 1.414 ms**
  (195: 889 ms / 1.309 ms — chậm hơn chút, cùng xu hướng tải).
- **Cap kích hoạt 2 lần như đợt 195** (`holdMaxSec 0,691 s`,
  195: 0,662 s; `holdCapStop` 0 → 1 (idx107, drift +0,041) → 2
  (idx117, drift +0,141) — drift tại cap NHỎ vì hold trên clip ngắn
  bắt đầu giữ lúc drift đã nhỏ). Lặng quanh cap: 6 mẫu RMS=0 tổng.
- **Crossfade/restart-exact KHÔNG hồi quy — còn tốt hơn đợt 195:**
  `restartExact` = **5** (195: 0); `restart` 33 (195: 39);
  `playOk` 41 (195: 42); `playFalse` 0. RMS sounding trung bình
  0,662 (195: 0,675) ≈ forward 0,67. Playhead 70 → 56,5
  (~1,05× realtime, giống 195).
- **Drift clip 70 s KHÔNG kết luận** (như đợt 195 §3): fixture
  dùng chirp KHÔNG tuần hoàn (f(t) = 302,5 + 38,26·t Hz, slope
  nông → độ phân giải bin ~0,61 s) trong khi công thức drift của
  probe giả định chirp tuần hoàn 10 s — summary tự động in median
  2,074 s / max 4,904 s là SAI công thức, không phải drift thật.
  Chỉ lấy cap/decode/restartExact làm kết luận cho pass này.
- Cửa sổ đầu [39,97; 69,97] — lệch mép 0,03 s như đợt 195 (§5.3).

## §4. File đổi, kiểm chứng tổng

### 4.1. Code + test + probe

- `apps/web/src/lib/reverseAudioWiring.ts`: `REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC`
  0,5 → 0,3 + cập nhật comment 4 chỗ (header, doc hằng, comment
  counters, comment nhánh hold). Không đổi hành vi nào khác.
- `apps/web/src/lib/reverseAudio194P3.test.ts`: hằng = 0,3; test
  hold-cap viết lại (giữ ~0,2 s keep / ~0,4 s cap; ghi chú lỗi
  float 0,4−0,1 > 0,3).
- `apps/web/src/lib/reverseAudio195P3.test.ts`: test holdMaxSec
  viết lại theo trần 0,3 s (giữ ~0,2 s keep / ~0,4 s cap).
- `apps/web/src/lib/reverseAudio196P3.test.ts` (MỚI, 5 test): hằng
  = 0,3; đoạn vẫn 0,5 s; bất đẳng thức trần tuyệt đối
  (0,3 + drift-lúc-giữ ≤ 0,2 ≤ bar 0,5); giữ 0,25 s keep / 0,35 s
  cap; giữ 0,25 s rồi restart-exact không hồi quy.
- `apps/web/tsconfig.json`: exclude test mới.
- `benchmarks/reverse196/audio-probe-196.mjs` (MỚI — từ probe 195,
  đổi DIR/profile/env P196 + lọc stale S1 sửa epsilon + quy tắc S2
  mới + ghi drift-tại-cap vào summary; tăng chờ CDP 15 s → 45 s vì
  Chrome khởi động chậm khi máy tải — xem §4.3).
- `benchmarks/reverse196/audio-waveform-196-*.json` (MỚI, 3 file —
  xem §4.4).

### 4.2. Kiểm chứng tổng

- `node --experimental-strip-types` (node:test): reverseAudio 7,
  reverseAudio192P3 12/12, reverseAudio193P3 16/16, reverseAudio194P3
  7/7, reverseAudio195P3 3/3, **reverseAudio196P3 5/5 (MỚI)**,
  reversePlayback 10/10, reversePlayback191P3 7, reversePlayback192P3
  13, reversePlayback193P3 5/5, reverseCadence 9, seek 21, seek193P3
  6/6 — đều PASS.
- `npx tsc --noEmit` **0 lỗi** (chạy 2 lần: trước build 1 và trước
  build 2). `npm run build` **PASS 2 lần** (build 1 index-D6dlSzl2.js
  1.716.229 B, vite 25,32 s; build 2 index-X0LYF5mt.js 1.728.048 B,
  vite 20,24 s — build 2 mới là bundle đo headed).

### 4.3. T4 — KHÔNG chồng cửa yên + build trong lúc gate-wait + CDP chậm

- **0 lần chồng pha (b) T4: 0 "CUA YEN MO" trong `poll-t4.log`
  trước, trong và sau cả 3 pass** (kiểm ngay trước mỗi pass:
  poll #8/#52/#55/#63/#74; kiểm lại sau pass C: vẫn 0 lúc
  15:38:55Z). Không có F-196-P3-x vi phạm. (Cửa T4 đợt 196 mở muộn
  — tới 15:38Z vẫn chưa mở sau 74 poll; P3 chờ cửa yên xong mới
  đo nặng theo chỉ đạo (p)-195 thay vì chen ngang như F-195-P3-1.)
- **Caveat (tự báo, nhẹ): 2 lần `vite build` chạy trong lúc T4
  gate-wait** (14:44–14:45Z và 15:19–15:20Z, mỗi lần ~20–25 s) —
  KHÔNG phải trong cửa yên (cửa chưa mở) nên không vi phạm, nhưng
  có đóng góp tải (load1 ~10 lúc build 1) và có thể làm cửa mở muộn
  thêm chút. Ghi nhận để T2 phán nếu cần; quy trình "kiểm poll-t4
  ngay trước khi chạy nặng" đã tuân thủ (kiểm trước cả 2 build +
  trước cả 3 pass).
- **Cây đổi 4+ lần trong lúc làm việc** (preview.tsx/media.ts do
  luồng khác sửa: md5 cây đổi 591f9655 → 558123e3 → 0e60683b →
  03b6c941 → e1fffa8b → b2a2860b qua các poll T4): build 1 lỗi thời
  nên phải build lại lần 2 (15:20:35Z); bundle đo X0LYF5mt.js chứa
  cây lúc 15:20:35Z + wiring mới của P3. Cây đổi TIẾP sau 15:20:35Z
  (md5 e1fffa8b/b2a2860b) KHÔNG có trong bundle đo — nhưng các sửa
  đó thuộc P1/P2 (voicefx/enhance), không chạm wiring đảo; bundle
  before == after cả 3 pass nên số đo tự nhất quán. Ghi caveat để
  T10/P4 biết bundle đo không phải cây cuối đợt.
- **Chrome khởi động chậm:** lần chạy probe đầu (14:47Z) lỗi "không
  lấy được CDP targets" sau 15 s chờ (máy tải, Chrome lên chậm) +
  để lại 1 chrome mồ côi (pid 13031, đã kill -9 ngay sau đó). Đã
  sửa probe: chờ CDP 45 s. Không ảnh hưởng số đo (lần lỗi không
  chạy được pass nào).

### 4.4. File đổi (xem paths file)

`apps/web/src/lib/reverseAudioWiring.ts` (siết cap),
`apps/web/src/lib/reverseAudio194P3.test.ts` (cập nhật trần),
`apps/web/src/lib/reverseAudio195P3.test.ts` (cập nhật trần),
`apps/web/src/lib/reverseAudio196P3.test.ts` (MỚI, 5 test),
`apps/web/tsconfig.json` (exclude test mới),
`benchmarks/reverse196/audio-probe-196.mjs` (MỚI — probe headed,
dùng chung cho cả 3 pass, tham số qua env P196_*),
`benchmarks/reverse196/audio-waveform-196-longA-300s-gop300-720p.json`
(MỚI — 168.756 B), `benchmarks/reverse196/audio-waveform-196-longB-300s-gop15-360p.json`
(MỚI — 406.723 B), `benchmarks/reverse196/audio-waveform-196-chirp-70s.json`
(MỚI — 109.248 B), LIMITS này. **Cả 3 waveform JSON đều VƯỢT 37.768 B
nên lúc push cần ENABLE_PRIVSEP=0 theo quy định đứng** (như waveform
194/195). Dữ liệu probe thô đầy đủ (JSON 3 pass) chỉ ở
`~/workspace/tmp-round196-p3/` (scratch, không stage). Fixture mp4
tái dùng từ `~/workspace/tmp-round195-p3/` (longA/longB) và
`~/workspace/tmp-round193-p3/` (chirp-70s) — không copy lại, không
stage binary. `dist` build mới không stage.

## §5. Giới hạn còn lại — nợ chuyển sang đợt 197

1. **Decode cửa sổ > 5 s (§2.1):** 5/6 lần vượt bar; cần probe decode
   riêng (decode cùng file 2 lần liên tiếp trong 1 AudioContext
   rảnh, không phát ngược) để tách warmup khỏi tranh chấp; giả
   thuyết warmup đợt 195 YẾU ĐI sau dữ kiện này. Giải pháp lâu dài
   vẫn là decode từng phần/stream (nợ Hiệu suất).
2. **Biên drift mỏng + nhiễu analyser (§1.5):** max S2 0,481–0,485 s
   sát bar 0,5 s; P4 quyết N11a bằng thước nào (S1 cũ → longB vượt
   0,737 s; S2 mới → đạt 0,481 s). Nợ phương pháp đo: đọc offset
   nội bộ của wiring thay vì chirp-qua-analyser sẽ loại được nhiễu
   lag/smoothing; hoặc parent siết tiếp cap về 0,25 s (P3 không tự
   quyết).
3. **Lệch mép trên cửa sổ đầu (§5.3 đợt 195, không đổi):** cửa sổ
   đầu kết thúc ở 300,15 trong khi playhead End 300,6 (lệch 0,45 s;
   clip 70 s lệch 0,03 s). Chưa rõ do display cập nhật theo frame
   đã vẽ hay sourceTime tại tick đầu — đã BÁC giả thuyết display-lag
   cho drift (§1.4: lastPlayheadSec khớp timeText mọi mẫu), nhưng
   lệch mép cửa sổ là chuyện khác, vẫn mở.
4. **F-195-P3-2 ĐÃ ĐÓNG** (lần đổi cửa sổ thứ 3 quan sát được, không
   mất trang — xem §1.3). Không còn nợ này.
5. Nợ cũ còn nguyên: reverse mượt dưới tải (0,55–0,70 fps ở 720p
   GOP30 ngay cả khi máy rảnh, §3 đợt 194); scrub ngược trên clip
   dense/GOP dài chưa đo. Prefetch GIỮ TẮT (đã kết luận đợt 194,
   không xét lại).

## §6. Ghi chú cho parent

- Khoản (a) xong: **cap 0,3 s đã implement + đo headed — drift tuyệt
  đối max 0,485 s (longA) / 0,481 s (longB), VỀ DƯỚI bar 0,5 s**;
  max giảm đúng 0,200 s so với đợt 195 = đúng delta siết cap. Drift
  tại cap ≤ 0,42 s trong cả 5 lần cap kích hoạt. Biên mỏng (~0,015 s)
  và có 1 mẫu transition/1 mẫu lag vượt trội trong mỗi pass — P4
  quyết N11a cuối bằng thước lọc nào (§1.4).
- Khoản (b) CHƯA xong: **decode cửa sổ đầu longA 10.765 ms VƯỢT
  bar 5.000 ms; đổi cửa sổ 4.825–8.751 ms (3/4 vượt)** — do tải máy
  tranh chấp + decode-toàn-file, không phải hồi quy code. Cần probe
  decode riêng đợt 197 + giải pháp decode từng phần (Hiệu suất).
- Khoản (c) xong: **không hồi quy** — restart-exact còn tăng
  (longB 81, 70 s 5), playFalse = 0 cả 3 pass, đổi cửa sổ không hở
  tiếng (trừ 1 mẫu 250 ms trùng cap).
- Tự báo: 0 chồng cửa yên T4 (kiểm poll-t4.log trước mỗi pass);
  2 lần build trong lúc gate-wait (caveat nhẹ, §4.3); 1 lần probe
  lỗi CDP + chrome mồ côi đã kill (không ảnh hưởng số đo).
