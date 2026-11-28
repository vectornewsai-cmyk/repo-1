# PHASE9 ROUND195 P3 — REVERSE SMOOTH: trần drift 0,5 s chứng minh headed + decode cửa sổ clip 300 s

Đợt 195, luồng sản phẩm (Editing Core — preview/render parity, đợt thứ 5
theo hướng mới lệnh user 15:03 25/11/2026). Nối tiếp LIMITS P3-194
(§5 nợ chuyển sang). Kết quả ngắn: **(1) Trần drift 0,5 s CHỨNG MINH
HEADED — nhưng VƯỢT BAR theo nghĩa tuyệt đối: hold dài nhất 2,859 s
(freeze tại biên GOP), cap dừng đúng 0,5 s giữ, 2 lần trong cùng 1
freeze; drift tuyệt đối tối đa đo được 0,685 s (không phải nhiễu stale)
— cap chỉ chặn độ TĂNG drift trong hold, drift tại lúc bắt đầu giữ
(~0,17 s) cộng thêm nên vượt 0,5 s; cần quyết parent (§1.5);
(2) Decode cửa sổ clip 300 s ĐO ĐƯỢC: decode lần đầu ~4,9–5,2 s,
decode lại khi đổi cửa sổ ~3,0–3,1 s (decode toàn file tạm thời mỗi lần);
đổi cửa sổ tại mép KHÔNG hở tiếng (0 mẫu lặng quanh điểm đổi, 2 lần đổi
hoàn tất quan sát được); clip 70 s đo lại: decode cửa sổ đầu 889 ms.**

Phạm vi: chỉ đo + chẩn đoán đo (counters/timing trong wiring, không đổi
hành vi phát). Không đụng prefetch (GIỮ TẮT theo kết luận 194), decode,
toggle/cổng, không sửa GAP/aggregate, không push. Bundle đo:
`dist/assets/index-DXgXJkN_.js` (1.716.190 B, build 08:52:46–08:53:15Z
26/11/2026, vite 7,12 s — nhanh, không chồng cửa T4; xem §4.3).
Bundle không đổi trong lúc probe (before == after cả 3 pass).

## §1. Trần drift 0,5 s — CHỨNG MINH HEADED, nhưng vượt bar tuyệt đối

### 1.1. Thiết kế đo

Nợ §5.1 đợt 194: pass 194 có `holdCapStop 0` (không lần nào giữ chạm
trần) nên trần chỉ chứng minh bằng unit test. Đợt này dùng fixture dài
GOP dài để seek chậm → hold dài: `longA-300s-gop300-720p.mp4` (300,62 s,
1280×720, 30 fps, 30 keyframe — 1 GOP 10 s, testsrc2 + chirp tuần hoàn
10 s; xem §4.1). Probe mới `benchmarks/reverse195/audio-probe-195.mjs`
(chirp tuần hoàn f(t) = 300+270·(t mod 10) Hz; drift wrap về [−5; 5];
ghi thêm `windows` + `holdStats` theo mẫu; parseT sửa để đọc timeText
dạng "MM:SS.t / MM:SS.t" — bản đầu quên dạng này nên summary in drift
"?" , đã sửa và tính lại offline từ JSON đã lưu).
Chẩn đoán mới trong wiring (xem §4.2): counters `holdMaxSec` (giữ dài
nhất từng thấy), `windowRebuilds`, `lastWindowDecodeMs` + snapshot
`windows` (biên cửa sổ + rebuilding + lastDecodeMs từng slot).

### 1.2. Pass A — hold dài + cap kích hoạt (fixture longA)

Probe 08:53:30–08:54:08Z, 200 mẫu × 100 ms, load 1,19–1,85 (máy rảnh
thật; không chồng cửa T4 — cửa mở 09:10:07Z, sau khi pass xong).
Playhead 300,6 → 284,6 trong 20 s: đoạn đều ~1,3–1,4× realtime giữa
các biên GOP; mỗi biên GOP (keyframe mỗi 10 s) giữ ~2–3 s.

- **Hold dài nhất 2,859 s** (`holdMaxSec`): freeze tại playhead 290,5
  (biên GOP 290), mẫu 123–155 (~3,3 s tường).
- **`holdCapStop` 0 → 1 (mẫu 129) → 2 (mẫu 148) — cap kích hoạt 2 lần
  trong cùng 1 freeze dài.** Counters cuối pass (delta trong pass):
  `tick 661, holdStop 362, holdKeep 122, holdCapStop 2, holdMaxSec
  2,859, restart 41, restartExact 1, playOk 45, playFalse 0`.
- **Hành vi tiếng trong freeze (mẫu 123–155):** đoạn phát 0,5 s → lặng
  1,2 s (12 mẫu, 128–139) → phát 0,5 s (mẫu 140–147, sau 1 bước frame)
  → lặng 0,8 s (8 mẫu, 148–155) → tiếp tục khi frame tới. Tổng freeze
  3,3 s, tiếng vang ~1,0 s trong đó. Đây là trải nghiệm thật của phát
  ngược trên GOP dài: tiếng ngắt quãng theo nhịp cap, không lặng hẳn.
- **Drift (chirp tuần hoàn, đã loại 3 mẫu stale-peak):** sounding
  126/146 mẫu in-pass; trung vị |drift| **0,078 s**, p90 0,256 s,
  **tối đa 0,685 s** (mẫu 147, peakHz 2993→2972→2950 di chuyển thật từng
  mẫu — KHÔNG phải nhiễu stale; xem §1.4). Khoảng đã dấu
  [−0,685; +0,400] s. Lúc chưa giữ (đoạn đều), drift nhỏ (trung vị
  0,078 s).
- **RMS sounding 0,2503–0,3898, trung bình 0,3250** — thấp hơn 194
  (0,666) vì fixture này biên độ chirp 0,45 (194: ~0,95), KHÔNG phải hồi
  quy: forward control cùng pass RMS 0,315 — tiếng ngược ≈ tiếng xuôi.
  Waveform không phẳng lần nào (0/126).

### 1.3. Vì sao drift tuyệt đối vượt 0,5 s dù cap đúng 0,5 s

Dãy mẫu 140–148 (freeze thứ hai trong cùng biên GOP, playhead đứng ở
290,5): drift −0,174 → −0,256 → −0,333 → −0,415 → −0,415 → −0,526 →
−0,604 → −0,685 rồi RMS → 0 + `holdCapStop` 1 → 2 ở mẫu 148.
Đọc đúng cơ chế: cap chặn **độ tăng drift trong lúc giữ** ở 0,5 s
(giữ từ lúc bắt đầu giữ; drift tăng đúng ~0,5 s: −0,17 → −0,69), nhưng
**drift tuyệt đối tại cap = drift lúc bắt đầu giữ + 0,5 s**. Drift lúc
bắt đầu giữ ≈ 0,17 s (đoạn (re)start với offset kỳ vọng tại tick đó,
cộng trễ tick + sai số bin 0,087 s) nên đỉnh tuyệt đối ≈ 0,69 s.
Kết luận (a2)-193 "drift tối đa ~0,5 s" **không giữ theo nghĩa tuyệt
đối** — thiết kế cap hiện tại chỉ bảo đảm drift không chạy xa khi giữ
kéo dài (hold 2,86 s mà drift dừng ở ~0,69 s, không tăng tiếp), chứ
không chặn tuyệt đối ở 0,5 s.

### 1.4. Nhiễu đo: analyser stale dưới tải (bài học đo)

`getByteFrequencyData` có thể trả dữ liệu cũ tới ~0,75 s khi máy tải
(load 3–5): peakHz đóng băng y nguyên trong khi playhead chạy 0,6 s
(pass B: 35 mẫu stale-peak; pass A (load ~1,5): 3 mẫu; mẫu 93 pass B
waveform gần phẳng [123,123,123,…] — buffer analyser đóng băng).
Drift max đo thô vì thế bị thổi phồng (pass B: 0,696 thô → **0,389 sau
khi loại stale**, xem §2.3). Mọi số drift trong LIMITS này đều đã loại
mẫu stale (peakHz giống hệt mẫu trước trong khi playhead chạy ≥0,2 s);
pass A max 0,685 s giữ nguyên sau khi loại (peak di chuyển thật).
Bài học đứng: drift max bằng chirp PHẢI loại mẫu stale, nếu không sẽ
báo vượt bar giả.

### 1.5. Cần quyết parent — trần hiệu dụng ~0,7 s hay siết cap

Hai hướng, parent chọn một (P3 không tự đổi vì đây là quyết (a2)-193):
- **(i) Chấp nhận trần hiệu dụng ~0,7 s:** giữ cap 0,5 s; sửa ghi chú
  (a2) thành "drift tăng trong hold ≤0,5 s, tuyệt đối ≤~0,7 s". Tiếng
  trong freeze giữ nguyên nhịp hiện tại (phát 0,5 s/lần giữ).
- **(ii) Siết cap về ~0,3 s:** drift tuyệt đối ≈ 0,17 + 0,3 ≈ 0,47 s
  < bar 0,5 s (dựa trên drift-lúc-giữ quan sát ≤0,2 s). Giá: đoạn bị
  cắt sớm hơn 0,2 s mỗi lần giữ — tiếng trong freeze ngắt hơn chút
  (phát 0,3 s thay vì 0,5 s mỗi nhịp).
P3 nghiêng (ii) vì giữ đúng lời hứa bar 0,5 s của (a2), chi phí nghe
nhỏ — nhưng đây là quyết parent, không tự sửa.

## §2. Decode cửa sổ clip 300 s + hành vi tại mép cửa sổ

### 2.1. Thời gian decode (nợ §5.2 đợt 194 / §5.4 đợt 193)

`loadReversedWindow` decode TOÀN FILE tạm thời mỗi lần đổi cửa sổ
(chỉ giữ cửa sổ 30 s + bytes nén gốc). Đo headed bằng timing mới
(`lastWindowDecodeMs`, decode-only, không tính fetch):

| lần decode | file | thời gian |
|---|---|---|
| Cửa sổ đầu, fixture A (60 MB) | 300 s | **5.199 ms** |
| Cửa sổ đầu, fixture B (26 MB) | 300 s | **4.864 ms** |
| Đổi cửa sổ lần 1, fixture B | 300 s | **2.951 ms** |
| Đổi cửa sổ lần 2, fixture B | 300 s | **3.124 ms** |
| Cửa sổ đầu, clip 70 s (1,2 MB) | 70 s | **889 ms** (§3) |

- **Decode lần đầu file 300 s ≈ 5 s — xác nhận lo ngại đợt 193 ("có
  thể > 5 s").** Hệ quả thấy được: phát ngược clip 300 s bắt đầu
  LẶNG ~7 s (load tới loaded=1: 7.010 ms (A) / 5.679 ms (B) tính từ lúc
  bấm ngược — gồm fetch + decode 5 s + overhead; mẫu có tiếng đầu tiên
  ở mẫu 54 pass A, ~1,4 s sau loaded=1 do playhead còn giữ chờ seek
  GOP đầu, không phải lỗi cửa sổ).
- **Decode lại khi đổi cửa sổ ~3,0 s — nhanh hơn lần đầu ~2 s** (2/2
  lần đổi đều ~3,0–3,1 s; 2 lần đầu đều ~4,9–5,2 s). Nguyên nhân chưa
  rõ (warmup decoder / lần đầu tranh chấp với seek video đầu / khác
  biệt fetch) — nợ đo riêng, không đoán (xem §5.4).
- Clip 70 s: decode 889 ms + overhead → loaded sau 1.309 ms (xem §3).
  Tỉ lệ decode/không tuyến tính theo độ dài (70 s → 0,9 s; 300 s →
  5 s): decode toàn file là nút thắt thật cho clip dài — giải pháp lâu
  dài vẫn là decode từng phần/stream (nợ Hiệu suất, như §5.4 đợt 193).

### 2.2. Đổi cửa sổ tại mép — KHÔNG hở tiếng (fixture B)

Pass B 09:00:28–09:03:07Z, 480 mẫu × 250 ms, load 2,35–5,09 (cao hơn
pass A do luồng khác đang chạy; không chồng cửa T4 — cửa mở 09:10:07Z).
Fixture `longB-300s-gop15-360p.mp4` (300,62 s, 640×360, GOP 15 —
seek nhanh để playhead chạy đủ 25 s/timeline qua mép cửa sổ trong 1
pass). Playhead 300,6 → 222,2 (78,4 s timeline / 120 s tường ≈ 0,65×
realtime).

- **2 lần đổi cửa sổ hoàn tất, quan sát được đầy đủ:**
  `[270,15; 300,15]` (decode 4.864 ms) → `[245,13; 275,13]` (decode
  2.951 ms; `rebuilding=true` thấy 9 mẫu ≈ 2,25 s) → `[220,10; 250,10]`
  (decode 3.124 ms; rebuilding 9 mẫu). `windowRebuilds` 0 → 2.
- **RMS KHÔNG lặng tại điểm đổi:** quanh switch 1 (mẫu 119):
  0,3582/0,3213/0,3196/0,3178 → **0,3177** → 0,3196/0,3207/0,3618;
  quanh switch 2 (mẫu 223): 0,3179/0,3182/0,4806/0,3213 → **0,3184**
  → 0,3179/0,3411 — 0 mẫu lặng trong ±4 mẫu mỗi lần. Cửa sổ cũ phát
  tiếp trong lúc decode nền, đúng thiết kế đợt 193.
- `playFalse=0` cả pass (không lần nào phát ngoài cửa sổ);
  `holdMaxSec` chỉ 0,218 s, `holdCapStop 0` (GOP15/360p seek nhanh nên
  hold ngắn — cap không kích hoạt, đúng kỳ vọng; xem §1).
- Counters tới mẫu 331 (trước khi trang mất trạng thái, xem §2.4):
  `tick 3858, holdStop 1850, holdKeep 1792 (97%), restart 130,
  restartExact 62, playOk 193`.
- Drift (đã loại 35 mẫu stale): trung vị 0,126 s, p90 0,237 s, **tối
  đa 0,389 s** (mẫu 110, trong lúc rebuilding lần 1) — **trong bar
  0,5 s**. RMS sounding trung bình 0,3214 (fixture biên độ 0,45 như
  pass A); 3 mẫu lặng đơn lẻ (58, 277, 288 — transient nối đoạn, mỗi
  mẫu 250 ms, không phải freeze).

### 2.3. Ghi chú số drift thô pass B (để không nhầm)

Summary tự động của probe in drift max 0,696 s cho pass B — SAI do
nhiễu stale (§1.4): 3 mẫu đỉnh (92–94) peakHz đóng băng ở 2864 trong
khi playhead chạy 279,4 → 278,8. Số đúng sau khi loại stale: **max
0,389 s** (§2.2). Probe đã sửa parseT nhưng chưa lọc stale trong
summary — dữ liệu thô đã stage đủ để tính lại offline (xem §4.1).

### 2.4. F-195-P3-2 (tự báo): trang mất trạng thái giữa lần đổi cửa sổ thứ 3

Từ mẫu 332 pass B (~09:02:31Z, đang `rebuilding=true` lần 3, mẫu
318–331), mọi lần đọc DOM đều null (timeText/badge/`__vcutReverseAudio`
/`__vcutAudioAnalyser` đều null) tới hết pass (148 mẫu null, ~37 s).
Probe vẫn chạy hết (exit 0, đóng Chrome sạch) — trang còn evaluate
được nhưng không còn app: khớp với tab rơi vào trang lỗi renderer
(sad-tab) hơn là navigate (không có lệnh navigate nào trong probe/app).
Nghi renderer crash (OOM) trong lúc decode cửa sổ lần 3 (decode file
300 s lần thứ 3 trong 2 phút, VM 6 GB chia sẻ + luồng khác đang build)
— **chưa xác minh dump** (không thấy file crash trong
`/tmp/round195-p3-audio-profile/`). Kết quả đổi cửa sổ lần 3 KHÔNG quan
sát được (`windowRebuilds` dừng ở 2). T10/P4 xem xét: có thể cần đo
lại lần đổi thứ 3 riêng + theo dõi OOM khi decode lặp file dài. 2 lần
đổi đã quan sát (§2.2) vẫn đứng vững, không bị ảnh hưởng.

## §3. Clip 70 s đo lại (cửa sổ rảnh thứ hai)

Probe 09:11:23–09:11:52Z, 130 mẫu × 100 ms, clip `chirp-70s.mp4`
(193, 320×180). Load 0,96–0,97 trong pass (máy rảnh) — **nhưng CHỒNG pha (b)
attempt1 T4 (mở 09:10:07Z)** — xem F-195-P3-1 (§4.3).

- **Decode cửa sổ đầu 889 ms; load tới loaded=1: 1.309 ms.** Khớp ước
  đợt 193 ("~0,6 s load cửa sổ", nay đo chính xác 0,89 s decode).
- **Cap kích hoạt 2 lần ngay cả trên clip nhỏ:** `holdMaxSec 0,662 s`,
  `holdCapStop` 0 → 1 (mẫu 45, ph 66,5) → 2 (mẫu 113, ph 58,3);
  lặng quanh cap: 2 mẫu (44–45) + 5 mẫu (111–115). Hold dài nhất
  0,662 s xảy ra lúc không có đoạn active nên không đếm cap lần 3 —
  đúng logic (chỉ dừng đoạn khi có đoạn đang phát).
- Drift với chirp fit f(t) = 302,5 + 38,26·t Hz (hồi quy n=115, resid
  std 8,1 Hz): trung vị 0,140 s, p90 0,311 s, max 0,669 s — **không kết
  luận độc lập**: độ phân giải bin ở slope này ≈ 0,61 s/mẫu bin + đỉnh
  drift là 3 mẫu peak đóng băng (−0,669 × 3) nên max này nhiều khả năng
  là nhiễu, không phải drift thật. Chỉ lấy làm củng cố cap kích hoạt.
- RMS sounding trung bình 0,6752 ≈ forward 0,67 (fixture biên độ ~0,95
  như 194). Playhead 70 → 56,3 (~1,05× realtime).
  Counters: `tick 433, holdStop 166, holdKeep 137, holdCapStop 2,
  restart 39, restartExact 0, playOk 42, playFalse 0`.
- Lệch mép trên cửa sổ: cửa sổ đầu [39,97; 69,97] trong khi playhead
  End 70,0 — lệch 0,03 s (pass A/B lệch 0,45 s, xem §5.3).

## §4. File đổi, kiểm chứng tổng

### 4.1. Fixture (scratch, KHÔNG stage — binary)

Tạo trong `~/workspace/tmp-round195-p3/` (tái tạo được từ công thức
dưới; file lớn 26–60 MB nên chỉ để scratch, không đưa vào batch):
- Chirp tuần hoàn 10 s: python (không numpy) — `f(t)=300+270·(t mod
  10)` Hz, phase `2π(300u+135u²)`, u = t mod 10 (phase liên tục qua
  biên 10 s vì 300·10+135·100 = 16500 chu kỳ nguyên), biên độ 0,45,
  stereo 48 kHz → `chirp-periodic-10s.wav`.
- Base 10 s: `ffmpeg -f lavfi -i testsrc2=size=WxH:rate=30:duration=10
  -i chirp-periodic-10s.wav -c:v libx264 -preset veryfast -crf 28
  -g {300|15} -sc_threshold 0 -bf 0 -pix_fmt yuv420p -c:a aac -b:a 128k`
  (A: 1280×720 GOP300; B: 640×360 GOP15).
- Loop: `ffmpeg -stream_loop 29 -i baseX-10s.mp4 -c copy longX-300s.mp4`
  → 300,619 s, 9000 frame; A 60.176.543 B / 30 keyframe; B 25.762.854 B
  / 600 keyframe (ffprobe xác minh). Duration 300,62 s (không phải
  300,00 — do AAC priming mỗi vòng loop) vẫn ≤ cổng 600 s.
- Dữ liệu probe thô (không stage, ở tmp): `audio-probe-195-*.json`
  (A 508.420 B, B 868.249 B, 70s 330.084 B). Waveform JSON đã stage kèm
  (xem §4.4).

### 4.2. Code — chẩn đoán đo (không đổi hành vi phát)

- `apps/web/src/lib/reverseAudioWiring.ts`: counters mới `holdMaxSec`
  (cập nhật mỗi tick hold, kể cả lúc chưa có đoạn active — hold là của
  playhead), `windowRebuilds` (đếm khi `loadReversedWindow` đổi cửa sổ
  xong OK), `lastWindowDecodeMs` (ms decode cửa sổ gần nhất); slot thêm
  `lastDecodeMs`; timing `Date.now()` quanh `loadReversedWindow` ở cả
  `loadSlot` (cửa sổ đầu) và nhánh rebuild trong `tickEntry`;
  `debugSnapshot()` thêm `windows` (clip, windowStartSec, windowEndSec,
  rebuilding, lastDecodeMs) — probe headed đọc qua
  `window.__vcutReverseAudio` như counters cũ. Header comment cập nhật.
- `apps/web/src/lib/reverseAudio195P3.test.ts` (MỚI, 3 test):
  holdMaxSec ghi giữ dài nhất + cap ở 0,5 s (giữ 0,4 → 0,4, không cap;
  giữ 0,6 → 0,6, cap=1); cửa sổ đầu clip 70 s [39,5; 69,5] +
  lastDecodeMs là số; rebuild tại mép (source 44 < 39,5+5 → cửa sổ mới
  [14; 44], `windowRebuilds` 1, đoạn vẫn phát từ cửa sổ mới).
- `apps/web/tsconfig.json`: exclude test mới (theo quy ước đứng).
- Không đụng file luồng khác; không đụng `preview.tsx`.

### 4.3. Kiểm chứng tổng + F-195-P3-1 (tự báo chồng T4)

- `node --experimental-strip-types` (node:test): reverseAudio 7,
  reverseAudio192P3 12/12, reverseAudio193P3 16/16, reverseAudio194P3
  7/7, **reverseAudio195P3 3/3 (MỚI)**, seek 21, seek193P3 6/6,
  reversePlayback 10/10, reversePlayback191P3 7, reversePlayback192P3
  13, reversePlayback193P3 5/5, reverseCadence 9 — đều PASS.
  `npx tsc --noEmit` **0 lỗi**; `npm run build` **PASS** (bundle
  `index-DXgXJkN_.js` 1.716.190 B, vite 7,12 s).
- **F-195-P3-1 (tự báo): probe clip 70 s chồng pha (b) attempt1 T4.**
  P3 kiểm `poll-t4.log` lúc ~09:10:05 (poll #35, chưa có "CUA YEN
  MO"), cửa T4 mở 09:10:07Z (poll #36) — 2 giây sau lần kiểm; probe
  70 s chạy 09:11:23–09:11:52Z mà không kiểm lại. Load trong pass
  ~1,0 (máy rảnh; Chrome + decode 889 ms nhẹ) nên ảnh hưởng nhỏ, nhưng
  vẫn báo để T4/T10 phán attempt1. Probe A (08:53–08:54) và B
  (09:00–09:03) KHÔNG chồng (cửa mở sau khi xong). Build P3
  08:52:46–08:53:15Z cũng không chồng. Bài học: kiểm `poll-t4.log`
  NGAY trước khi bấm chạy (tính bằng giây, không phải bằng phút) —
  quy trình đợt 194 ("kiểm trước MỌI lần đo/build nặng") vẫn chưa đủ
  chặt vì có khe đua 2 s; từ đợt sau kiểm lại ngay sát lúc chạy.

### 4.4. File đổi (xem paths file)

`apps/web/src/lib/reverseAudioWiring.ts` (chẩn đoán đo),
`apps/web/src/lib/reverseAudio195P3.test.ts` (MỚI, 3 test),
`apps/web/tsconfig.json` (exclude test mới),
`benchmarks/reverse195/audio-probe-195.mjs` (MỚI — probe headed,
dùng chung cho cả 3 pass, tham số qua env P195_*),
`benchmarks/reverse195/audio-waveform-195-longA-300s-gop300-720p.json`
(MỚI — 169.260 B), `benchmarks/reverse195/audio-waveform-195-longB-300s-gop15-360p.json`
(MỚI — 306.221 B), `benchmarks/reverse195/audio-waveform-195-chirp-70s.json`
(MỚI — 107.335 B), LIMITS này. **Cả 3 waveform JSON đều VƯỢT 37.768 B
nên lúc push cần ENABLE_PRIVSEP=0 theo quy định đứng** (như waveform
194). Fixture mp4/wav + JSON probe đầy đủ chỉ ở
`~/workspace/tmp-round195-p3/` (scratch, không stage). `dist` build mới
không stage.

## §5. Giới hạn còn lại — nợ chuyển sang đợt 196

1. **Quyết trần drift (§1.5):** (i) chấp nhận trần hiệu dụng ~0,7 s hay
   (ii) siết cap về ~0,3 s để drift tuyệt đối ≤0,5 s. Chờ quyết parent
   (P3 nghiêng (ii), xem §1.5). Tới khi có quyết, code giữ cap 0,5 s.
2. **Decode cửa sổ lần đầu (~5 s) vs lần sau (~3 s):** chênh lệch ~2 s
   chưa rõ nguyên nhân (warmup / tranh chấp lúc decode đầu). Cần probe
   decode riêng (decode cùng file 2 lần liên tiếp trong 1 AudioContext
   rảnh, không phát ngược) để tách warmup khỏi tranh chấp. Giải pháp
   lâu dài vẫn là decode từng phần/stream (nợ Hiệu suất).
3. **Lệch mép trên cửa sổ đầu:** cửa sổ đầu kết thúc ở 300,15 trong
   khi playhead End hiển thị 300,6 (lệch 0,45 s; clip 70 s lệch 0,03 s).
   Chưa rõ do display cập nhật theo frame đã vẽ (chưa vẽ frame ngược
   đầu nên hiển thị vị trí End cũ) hay sourceTime tại tick đầu thật sự
   là 300,15. Không ảnh hưởng kết luận (playFalse=0 cả 3 pass) — ghi
   mở, cần probe đọc thêm sourceTimeSec nếu muốn làm rõ.
4. **F-195-P3-2 (§2.4):** trang mất trạng thái giữa lần đổi cửa sổ thứ
   3 (nghi renderer crash/OOM khi decode lặp file 300 s) — kết quả đổi
   thứ 3 chưa quan sát; cần đo lại lần đổi thứ 3 riêng + theo dõi OOM.
5. **F-195-P3-1 (§4.3):** probe 70 s chồng pha (b) attempt1 T4 — T4
   phán ảnh hưởng (nếu có); quy trình kiểm poll-t4.log siết chặt từ
   đợt sau (kiểm sát lúc chạy).
6. Nợ cũ còn nguyên: reverse mượt dưới tải (mảng Hiệu suất —
   0,55–0,70 fps ở 720p GOP30 ngay cả khi máy rảnh, §3 đợt 194);
   scrub ngược trên clip dense/GOP dài chưa đo. Prefetch GIỮ TẮT
   (đã kết luận đợt 194, không xét lại).

## §6. Ghi chú cho parent

- Khoản (1) xong về chứng minh, nhưng phát hiện đính chính: **trần
  drift 0,5 s không giữ theo nghĩa tuyệt đối** — cap dừng đúng 0,5 s
  giữ (2 lần trong 1 freeze 2,86 s), nhưng drift tuyệt đối đỉnh 0,685 s
  vì drift lúc bắt đầu giữ đã ~0,17 s. Cần quyết: chấp nhận ~0,7 s hay
  siết cap về ~0,3 s (P3 nghiêng siết — xem §1.5).
- Khoản (2) xong về đo: **decode cửa sổ đầu file 300 s ≈ 5 s** (lần
  đầu phát ngược lặng ~7 s), **đổi cửa sổ ~3 s và không hở tiếng**
  (2 lần đổi quan sát đầy đủ, RMS liền mạch). Clip 70 s: decode 889 ms.
  Đây là chi phí thật của thiết kế decode-toàn-file — giải pháp lâu dài
  thuộc mảng Hiệu suất (decode từng phần).
- Tự báo 1 chồng lấn với T4 (F-195-P3-1, probe 70 s) + 1 sự cố chưa rõ
  (F-195-P3-2, trang mất trạng thái giữa lần đổi cửa sổ thứ 3) — T4/T10
  phán.
