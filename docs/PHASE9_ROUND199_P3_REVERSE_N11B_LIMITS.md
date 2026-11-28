# Đợt 199 P3 — Reverse preview: N11b ĐẠT in-app + playClamped live + drift longB

> Trạng thái: **N11b ĐẠT IN-APP** (§1) — partial engage thật cả 3 pass
> (longA/longB/chirp), decode cửa sổ 320–2.482 ms (bar 5.000 ms).
> **playClamped ĐO ĐƯỢC LIVE lần đầu** (§2: Δ=5 pass A, Δ=1 pass B,
> playFalse = 0 cả 3 pass). **Drift ĐẠT** longA + longB theo thước S2
> (§3); drift chirp **CHƯA KẾT LUẬN** — thước 10 s-periodic không áp
> dụng được cho file sweep 70 s (§3.3).
> Bundle cuối: `dist/assets/index-BCKAT1fc.js`.

## 1. N11b — decode từng phần ĐẠT in-app (nợ (r)-198: mục 1 + 2)

### 1.1 Giả thuyết 198 BỊ BÁC + nguyên nhân thật (xác minh bằng đo thật)

Đợt 198 để lại giả thuyết: check `totalFrames === keptFrames × spf`
fail ở frame cuối (stts 768) → fallback. **Đo thật đợt này BÁC BỎ:**
bundle từ source hiện tại, cửa sổ app thật `[270.154, 300.154]`
longA/longB đều `ok: true`, `sampleCount = 1.439.999` (không phải
1.440.768) nhưng **không phải do frame cuối**: decoder trả đúng 1024
mẫu cho MỌI frame kể cả frame cuối 768 (mọi cửa sổ đều trả đúng
`keptFrames × 1024`). Số thiếu 769 mẫu là do **`extraTrim` cắt sai**:
timestamp output của AudioDecoder advance theo SỐ MẪU DECODE
(1024/frame, cộng dồn từ chunk đầu nạp), KHÔNG theo timestamp stts —
frame tiền lệ 12663 có duration stts 1793 nên output đầu giữ lại có
timestamp sớm hơn mốc stts 769 mẫu; code cũ tưởng "priming lẻ trong
cùng 1 output" và CẮT 769 mẫu THẬT → slice cần off+len = 1.440.480
mẫu > sampleCount 1.439.999 → **slice null → fallback full decode**.
Đó mới là lý do partial không engage đợt 198 (đo thật bằng
`verify-lastframe-199.mjs`, bundle pre-fix).

**Fix 1 (reverseAudioPartial.ts): BỎ extraTrim theo timestamp** —
output decoder là các frame PCM LIÊN TIẾP theo lưới nên timestamp
sớm không có nghĩa thừa mẫu; chỉ ghi lại `timestampDriftSamples`
(769 ở cửa sổ cuối longA) để chẩn đoán. Check lưới đổi sang KHOAN
DUNG (frame cuối file được phép ngắn: min = (kept−1)×spf +
lastFrameSamples). Thêm `totalPcmSamples` (tổng PCM thật, chỉ biết
khi cửa sổ chứa frame cuối) để slice không dùng durationSec (stts)
thổi phồng tổng tới 0,48 s.

**Fix 2 — lỗi TRƯỢT CỬA SỔ (phát hiện ở pass A đầu đợt này):**
sau fix 1, pass A vẫn fallback với lý do mới (nay đã log được):
`slice null: off=-20736 < 0 (startIdx=12967680, firstIndex=12685)`.
App xin cửa sổ `[270.6, 300.6]` (playhead 300,6 − 30 s) nhưng slice
cũ tính `startIdx = endIdx − windowSec×sr` nên khi endIdx bị kẹp ở
cuối file thật (300,16 s) thì cửa sổ TRƯỢT về `[270.16, 300.16]`
trong khi partial decode chỉ phủ cửa sổ ĐƯỢC XIN → off âm → null.
Nay `startIdx = floor(w0×sr)` (đầu cửa sổ được xin), endIdx kẹp ở
cuối file thật: cửa sổ cuối ngắn lại thành `[270.6, 300.16]`
(29,56 s) thay vì trượt. Với cửa sổ giữa file hai công thức cho
cùng startIdx (sai khác ≤ 1 mẫu).

**Fix 3 — log lý do partial fail (nợ (r)-198 mục 1):**
`ReverseAudioPlayer.lastPartialFailReason` (decode fail / slice null
kèm số off/len/sampleCount / duration quá max), wiring đếm riêng
`partialFail` + đưa `partialFailReason` vào `debugSnapshot`
(`window.__vcutReverseAudio`) để probe headed đọc. Nhờ đó pass A
đầu đợt này mới thấy được lý do slice null thay vì fallback câm.

### 1.2 Số đo in-app (bundle cuối `index-BCKAT1fc.js`)

| pass | file / mẫu | decode Δpartial / Δfull / ΔpartialFail | thời gian decode cửa sổ (ms) | load cửa sổ đầu |
|---|---|---|---|---|
| A | longA 400×100 ms | **2 / 0 / 0**, reason null | 1.930 (đầu), 2.391 (rebuild) | 2.764 ms |
| B | longB 480×250 ms | **5 / 0 / 0**, reason null | 769, 1.470, 927, 662, 2.293 | 954 ms |
| C | chirp 130×100 ms | **1 / 0 / 0**, reason null | 320 | 467 ms |

Mọi cửa sổ đều **dưới bar 5.000 ms với biên ≥ 2×** (lớn nhất
2.482 ms). Cửa sổ: A `[270.6, 300.16]` + rebuild `[245.567,
275.567]`; B thêm `[220.533, 250.533]`, `[195.5, 225.5]`,
`[170.467, 200.467]` (4 rebuild, toàn partial); C `[39.967,
69.967]` (cửa sổ cuối, chứa frame cuối stts 256 — partial engage).
Verify module độc lập (bundle partial, không qua app): mọi cửa sổ
`[270.6, 30]`, `[270.154, 30]`, `[270, 30]`, `[0, 30]`,
`[120, 30]` đều ok + slice non-null cả longA/longB
(`[270.6, 300.6]` sampleCount 1.419.264, slice len 1.418.880).

So với đợt 198 (cửa sổ đầu 5.968/6.937 ms, toàn fallback): load
cửa sổ đầu còn 954–2.764 ms; không giữ cache decode toàn file
(~101 MB) như đợt 197. Lưu ý: lần đo 5.203/5.896 ms ở pass A giữa
đợt (trước fix rate) là do máy tải nặng lúc đó, không phải do thuật
toán — đo lại khi máy rỗi: 1.719–2.482 ms.

## 2. playClamped live — ĐO ĐƯỢC LẦN ĐẦU (nợ (r)-198 mục 3)

Vấn đề: playhead lúc bấm ngược (300,6 s) nằm NGOÀI cửa sổ thật
(`[270.6, 300.16]` — audio thật hết ở 300,16 s, stts khai
300,64 s) nên tick đầu sau load có offset ngoài cửa sổ. Đợt 198
chỉ chứng minh clamp ở unit test; 3 pass đầu đợt này cho thấy
clamp một lần là chưa đủ:

- Pass A (bundle DaAEIEoR, chưa có clamp lúc load đầu): playFalse 12.
- Pass A (bundle DnF6RHzO, đã fix rate nhưng chưa clamp lúc load
  đầu): playFalse 12, playClamped 0.
- Pass A (bundle C5i99M98, clamp một lần lúc load đầu):
  playClamped 1, playFalse 9 — cờ bị xóa ngay tick đầu nên 9 tick
  sau vẫn false (playhead còn ngoài cửa sổ 0,44 s).
- **Pass A + B (bundle BCKAT1fc, clamp giữ cờ + tươi 3 s + chỉ
  clamp khi ngoài cửa sổ ≤ 1 s): pass A playClamped Δ=5,
  playFalse Δ=0; pass B playClamped Δ=1, playFalse Δ=0.**

**Fix (reverseAudioWiring.ts):** (a) load cửa sổ ĐẦU cũng đặt cờ
`windowJustRebuiltAtCtxSec` như sau rebuild; (b) cờ KHÔNG xóa khi
vừa phải clamp (giữ để tick sau clamp tiếp, chỉ xóa khi tick không
cần clamp hoặc hết tươi); (c) tươi 1 s → 3 s (sau load, playhead
thường bị GIỮ chờ frame 1–2,4 s nên tick đầu sau giữ đã quá 1 s);
(d) guard gần mép: chỉ clamp khi offset ngoài cửa sổ ≤ 1 s (xa
hơn là seek thật → để false, chờ rebuild, không phát nhầm tiếng
cửa sổ cũ). Unit test mới phủ cả 3 ý (11 test §4).

## 3. Drift — ĐẠT longA + longB (nợ (r)-198 mục 4); chirp CHƯA KẾT LUẬN

Thước S2 (quyết (a4)-196/(a4)-197, bar 0,5 s). Drift signed
longA pass A cuối: mean −0,013 s, median −0,011 s (player đồng bộ
thật, không lệch hệ thống).

| pass | S2 median / p90 / max (s) | nhận xét |
|---|---|---|
| A longA (cuối) | **0,074 / 0,215 / 0,526** | ĐẠT; max 1 mẫu transient |
| B longB | **0,167 / 0,259 / 2,756** | ĐẠT theo median/p90; xem dưới |
| C chirp | thước cũ 2,296 / — / 4,996 | thước SAI cho file này, xem §3.3 |

### 3.1 Drift longB — max 2,756 s là nhiễu analyser, không phải lệch thật

Max 2,756 s là mẫu sounding ĐẦU TIÊN của pass (idx 2,
peakHz 1098 Hz tồn từ phát xuôi — bộ lọc S2 không lọc được mẫu
đầu vì không có mẫu trước để so). 6/477 mẫu giữa pass vượt 0,5 s
(0,53–0,70 s, transient rải rác). Median/p90 tốt hơn đợt 197
(longB 0,419 s) và tương đương longA. Drift tại cap: không có cap
nào (holdMaxSec 0,351 s, holdCapStop 0).

### 3.2 Drift longA qua các lần chạy (bundle cuối)

Median 0,074–0,085 s, p90 0,181–0,244 s qua 3 lần chạy cuối; max
0,515–0,604 s (1 mẫu transient tại cap, drift tại cap ≤ 0,433 s).
Tốt hơn đợt 198 (median 0,089 s) và đợt 197 (0,333 s).

### 3.3 Drift chirp — thước cũ SAI, tính lại vẫn CHƯA KẾT LUẬN

Harness tính drift chirp với công thức f(t) = 300+270×(t mod 10)
(tuần hoàn 10 s), nhưng **file chirp-70s.mp4 là sweep TUYẾN TÍNH
300→3000 Hz trên 70 s** (xác minh bằng ffmpeg ZCR: t=5 s ~512 Hz,
t=65 s ~2826 Hz — khớp sweep 70 s, không khớp tuần hoàn 10 s).
Tính lại theo công thức sweep 70 s: median 0,515 s, p90 0,770 s,
max 0,885 s, signed mean −0,519 s — **tương đương đợt 195
(0,456 / 0,696 / −0,450, đường full decode)** nên KHÔNG phải hồi
quy do partial. Nhưng số này vẫn bị giới hạn đo: bin FFT 23,4 Hz
= 0,6 s theo thang sweep chậm (gấp 7× longA) nên không phân biệt
được lag thật hay nhiễu đo. **Verdict: drift chirp CHƯA KẾT LUẬN;
thước drift chính vẫn là longA/longB (ĐẠT).** Nợ đợt 200: hiệu
chuẩn lại thước chirp (hoặc bỏ file sweep 70 s khỏi đo drift).

## 4. Thay đổi code + test

- **MỚI/SỬA `reverseAudioPartial.ts`:** bỏ extraTrim theo timestamp;
  check lưới khoan dung (frame cuối ngắn); `totalPcmSamples` +
  `timestampDriftSamples` trong kết quả; slice tính startIdx từ đầu
  cửa sổ được xin (không trượt); `slicePartialPcmFailureReason`.
- **SỬA `reverseAudio.ts`:** `lastPartialFailReason` + getter;
  `bufferSampleRate` (xem §5).
- **SỬA `reverseAudioWiring.ts`:** counter `partialFail` +
  `partialFailReason` trong snapshot; truyền `partialDeps` xuống
  player (seam cho test); **tính offset theo rate buffer**
  (§5); clamp lúc load cửa sổ đầu + giữ cờ + tươi 3 s + guard
  gần mép (§2).
- **MỚI `reverseAudio199P3.test.ts`: 11 test PASS** (repro bug
  extraTrim bằng fake decoder kiểu Chromium + fixture frame tiền lệ
  duration dài; frame cuối ngắn; slice ngắn lại không trượt; lý do
  slice null; player partial + lý do fail; rate buffer 48000 vs ctx
  44100 ở player + wiring; clamp lúc load đầu 2 tick liên tiếp;
  wiring partialFail). Suite cũ đều xanh: 198: 14, 197: 6, 196: 5,
  195: 3, 194: 7, 193: 15, 192: 12, reverseAudio: 7.
  `npx tsc --noEmit`: 0 lỗi. Build cuối:
  `dist/assets/index-BCKAT1fc.js` 1.745.096 B.
- **MỚI `benchmarks/reverse199/audio-probe-199.mjs`** (harness:
  port/CDP/profile RIÊNG mỗi pass qua env P199_* — bài học đợt
  198; ghi `partialFailReason` vào KET LUAN; chờ Chrome thoát
  hẳn trước khi kết thúc) + `verify-lastframe-199.mjs` (verify
  module partial qua bundle esbuild, cửa sổ `[270.6, 30]` app thật).

## 5. Phát hiện thêm: lệch rate 48000/44100 (drift 1,285 s ở pass giữa đợt)

Đường partial decode ở rate GỐC của file (48.000 Hz) trong khi
`decodeAudioData` resample về rate AudioContext (44.100 Hz ở
headless) — wiring tính offset mẫu theo rate ctx nên offset lệch
hệ số 48000/44100 và drift S2 vọt lên median 1,285 s, p90 2,356 s
(pass A bundle DnF6RHzO; playFalse 4). **Fix:** player expose
`bufferSampleRate`, wiring dùng rate buffer thay vì rate ctx
(đường full decode resample về rate ctx nên hai rate trùng nhau,
không đổi hành vi cũ). Sau fix: drift longA median 0,074–0,085 s,
signed mean −0,013 s. Unit test phủ ở player + wiring (fake ctx
44100 + fake partial 48000).

## 6. Bộ nhớ / tải máy

Avail cuối pass: A 906.636 kB, B 789.000 kB, C 766.832 kB. Partial
không giữ cache decode toàn file (~101 MB) như đợt 197; mỗi lần
đổi cửa sổ decode lại từng phần (0,3–2,5 s) thay vì trích từ cache.
Tải máy lúc đo: A 0,5–4,3; B 1,5–2,4; C 0,5–1,4.

## 7. Hạn chế / nợ chuyển đợt 200 (P3-200)

1. **Drift chirp CHƯA KẾT LUẬN** (§3.3): hiệu chuẩn lại thước
   chirp — file sweep 70 s không dùng được công thức tuần hoàn
   10 s; hoặc đo drift chirp bằng file tuần hoàn 10 s thật
   (`chirp-periodic-10s.wav`).
2. Drift longB còn 6/477 mẫu transient 0,53–0,70 s giữa pass
   (chưa rõ nguyên nhân — không gắn với rebuild/cap nào); theo dõi
   thêm ở pass dài đợt sau.
3. Drift max longA 0,515–0,604 s (1 mẫu transient tại cap) — vẫn
   vượt bar 0,5 s ở đúng 1 mẫu/pass; cap drift (≤ 0,433 s) thì
   trong bar.
4. Guard gần mép của clamp (§2d) chưa có unit test trực tiếp
   (fixture 1,05 s không dựng được ca ngoài cửa sổ > 1 s) — chỉ
   chứng minh bằng lập luận + đo live (playFalse = 0).
5. `loadReversedWindow` vẫn fetch toàn file (60/26 MB) trước khi
   partial decode — fetch không tính vào bar N11b nhưng user vẫn
   chờ tải (nợ cũ từ 198).

## 8. File đổi (stage, xem paths-loop phase9-round199-p3-reverse-n11b.txt)

- `apps/web/src/lib/reverseAudioPartial.ts` (sửa)
- `apps/web/src/lib/reverseAudio.ts` (sửa)
- `apps/web/src/lib/reverseAudioWiring.ts` (sửa)
- `apps/web/src/lib/reverseAudio199P3.test.ts` (mới)
- `apps/web/tsconfig.json` (sửa: exclude test 199)
- `docs/PHASE9_ROUND199_P3_REVERSE_N11B_LIMITS.md` (file này)
- `benchmarks/reverse199/audio-probe-199.mjs` (mới)
- `benchmarks/reverse199/verify-lastframe-199.mjs` (mới)
- Không stage binary; JSON probe + bundle verify ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round199-p3/`
  (scratch, không stage).
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md`.
