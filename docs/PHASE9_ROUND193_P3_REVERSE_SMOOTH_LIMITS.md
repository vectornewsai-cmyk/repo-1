# PHASE9 ROUND193 P3 — REVERSE SMOOTH: scrub ngược tại biên + audio đảo crossfade + clip dài

Đợt 193, luồng sản phẩm (Editing Core — preview/render parity, đợt thứ 3 theo
hướng mới lệnh user 15:03 25/11/2026). Nối tiếp LIMITS P3-192 (S6b seek lùi
1 ms sửa xong, S7c audio đảo nối xong — nhưng reverse vẫn chưa mượt).
Đoạn này làm 3 khoản theo §13-192. Kết quả ngắn: **(1) scrub ngược tại biên
SỬA XONG, chứng minh headed trước/sau 0/4 → 4/4; (2) audio đảo: crossfade +
restart-exact + clip dài tới 600 s theo cửa sổ — code + unit xong, headed
chứng minh clip 70 s ĐÃ PHÁT (hết mute), tiếng liền ở độ phân giải probe,
nhưng phát hiện mới: crossfade chưa bao giờ kích hoạt headed dưới tải
(F-193-P3-1) và tiếng bị gating bởi hold-stop (F-193-P3-2); (3) đo lại reverse
mượt CHƯA ĐO ĐƯỢC vì tải cao — ghi rõ, không kết luận về prefetch.**

Phạm vi: chỉ sửa reverse preview (scrub ngược + audio đảo). Không đụng
prefetch, không đổi toggle/cổng decode, không sửa GAP/aggregate, không push.
Bundle đo: `dist/assets/index-QQibQhig.js` (1.713.530 B, build 21:5xZ
25/11/2026, vite 6,91 s). Bundle đợt 192 (`index-l6h0lMWk.js`) đã bị build
mới ghi đè nên không còn snapshot TRƯỚC cho khoản 2 — bằng chứng TRƯỚC của
khoản 2 là code cổng 60 s đợt 192 + test 192 + số đo headed 192 (xem §2.1).

## §1. Scrub ngược tại biên — SỬA XONG, chứng minh headed 0/4 → 4/4

### 1.1. Bug (đợt 192 để lại)

Scrub ngược tại biên (playhead đúng biên frame k, bấm End rồi ArrowLeft)
vẫn hiện frame k thay vì k−1. Nguyên nhân đã xác định đợt này: `seekElement`
snap target bằng `snapToFrame` (round) nên nuốt mất backoff 1 ms
(round(k−0,03)=k), và check "đã đúng frame" round-based coi element ở đúng
biên (hiện frame k) là đã đúng. Đường pause/scrub (`Seeker` trong
`lib/seek.ts`) chưa lùi — chỉ đường phát ngược (S6b) đã lùi.

### 1.2. Code

- `lib/seek.ts`: thêm `SeekOpts.reverseScrub?` + `SeekTarget.reverseScrub?`
  (per-target, thắng cờ chung); helper mới `frameIndexFloor(t, fps)`;
  `seekElement` khi reverseScrub thì giữ nguyên target (không snap) và dùng
  floor cho check "đã đúng frame" + tracker đáp sai; `seekAll` truyền cờ
  per-target vào từng `seekElement`. Scrub xuôi không đổi hành vi
  (frameIdx === frameIndexOf khi không reverseScrub).
- `lib/reversePlayback.ts`: helper mới `reverseScrubSeekTarget(target,
  reverse)` = reverse ? `reverseSeekTarget(target)` : target.
- `preview.tsx`: executor của Seeker (nhánh pause) đọc
  `useStore.getState().reversePlayback`; với mỗi active video mà
  `reverseGlobal || a.reverse` thì target =
  `reverseScrubSeekTarget(a.target, true)` + `reverseScrub: true`; audio
  giữ target gốc; target xuôi trong cùng seekAll không đổi.

### 1.3. Kiểm chứng

- Unit mới: `reversePlayback193P3.test.ts` **5/5**;
  `seek193P3.test.ts` **6/6** (gồm: biên ct=0,5 vẫn phải seek tới 0,499
  không snap về 0,5; đã ở 0,499 thì không gán; ngoài lưới không snap;
  không reverseScrub thì hành vi cũ giữ nguyên; đáp 0 liên tiếp fail ở
  lần thứ 3).
- Hồi quy: seek 21, reversePlayback 10/10, reversePlayback191P3 7,
  reversePlayback192P3 13 — đều PASS.
- Headed (`~/workspace/tmp-round193-p3/scrub-probe-193.mjs`, Chromium
  headed + CDP, fixture `rev-src.mp4` 160×90/30fps/60 frame, scrub bằng
  phím End + ArrowLeft đúng đường Seeker pause, đọc frame element qua
  drawImage + MAD với `rev-ref.raw`):
  - TRƯỚC (bundle 192, ~21:01–21:03Z): xuôi 4/4 đúng (45/30/15/1,
    MAD 0,4–0,6); ngược **0/4** — hiện frame k (45/30/15/1) thay vì
    k−1, ct đúng biên (1,5/1,0/0,5/0,0333), seeking=false. Bug tái hiện
    đúng. (`scrub-probe-result-before.json`)
  - SAU (bundle mới, ~21:25–21:26Z): xuôi 4/4 đúng; ngược **4/4 đúng** —
    hiện 44/29/14/0, ct lùi đúng 1 ms (1,499/0,999/0,499/0,0323),
    MAD 0,3–0,5. (`scrub-probe-result-after.json`)
- Giới hạn: scrub ngược ngoài lưới 1 ms sau đầu frame vẫn theo quyết S6b
  (lùi về đầu frame trước); chưa đo scrub ngược trên clip dense/GOP dài.

## §2. Audio đảo — crossfade + restart-exact + clip dài (cửa sổ 30 s)

### 2.1. Nợ đợt 192 (trước khi sửa)

- Khoảng lặng tại điểm nối đoạn 0,5 s: run chirp headed 192 có **2/16 mẫu
  RMS=0**, ghi là "tại điểm nối đoạn". Xem lại ở §2.4 (F-193-P3-1): ghi
  nhận này chưa có bằng chứng counter — theo số đợt 193 thì nhiều khả
  năng đó cũng là hold-silence, không phải join-silence.
- Clip > 60 s vẫn mute: cổng `MAX_REVERSED_AUDIO_SECONDS = 60` trong
  wiring chặn fetch; test 192 assert clip 61 s → 0 fetch; headed 192
  không có tiếng trên clip dài.

### 2.2. Code

Hằng số mới (`reverseAudio.ts` / `reverseAudioWiring.ts`):
`MAX_REVERSED_AUDIO_WINDOWED_SECONDS = 600`,
`REVERSED_AUDIO_WINDOW_SEC = 30`, `REVERSED_AUDIO_CROSSFADE_SEC = 0,08`,
`REVERSED_AUDIO_OVERLAP_SEC = 0,1`,
`REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC = 0,05`,
`REVERSED_AUDIO_WINDOW_PRELOAD_SEC = 5`.

- (a) Crossfade (`ReverseAudioPlayer.playSegment`): đoạn cũ đang phát thì
  mờ dần trong 0,08 s (setTargetAtTime 0 với TC fade/3, stop ở t0+0,08,
  disconnect sau bằng setTimeout) trong khi đoạn mới mờ vào cùng 80 ms;
  đoạn đầu tiên vẫn fade vào 10 ms; `stop()` tắt cả đoạn đang mờ dần;
  `crossfadeSec=0` tường minh thì cắt kiểu cũ. Thêm
  `lastSegmentLengthSamples` (độ dài thật đã lên lịch, đã clamp).
- (b) Restart sớm + nối tiếp đúng mẫu (`shouldRestartReverseSegment` thêm
  quyết định thứ ba `"restart-exact"`): đoạn sắp hết (còn <
  `REVERSED_AUDIO_OVERLAP_SEC = 0,1 s`) + lệch nhỏ (≤ 0,05 s) thì đoạn mới
  bắt đúng mẫu tiếp theo (`segStartSample + segLengthSamples`); lệch lớn
  → restart re-sync bằng expected; hết đoạn → restart. Wiring dùng
  `player.lastSegmentLengthSamples` làm `segLengthSamples` (đúng cả khi
  đoạn chạm mép cửa sổ).
- (c) Clip dài (`ReverseAudioPlayer.loadReversedWindow(data,
  windowStartSec, windowSec=30, maxSeconds=600)`): decode toàn file (tạm
  thời), trích cửa sổ đảo 30 s; `durationSec` vẫn trả duration đầy đủ;
  `playSegment` nhận offset đảo TUYỆT ĐỐI, tự đổi về tương đối trong cửa
  sổ, ngoài cửa sổ → false; `data.slice(0)` trước decode vì
  `decodeAudioData` detach buffer. Wiring: cổng mới ≤ 600 s (clip > 60 s
  → windowed, > 600 s vẫn mute); slot giữ `compressed` (bytes nén gốc) +
  `rebuilding` + cooldown 2 s; đổi cửa sổ nền khi sourceTime <
  `windowStartSec + 5 s`; cửa sổ đầu kết thúc ở source time hiện tại;
  `debugSnapshot` thêm `longClips`.
- (d) Chẩn đoán (`reverseAudioWiring.ts`, thêm đợt này sau khi thấy badge
  nhấp nháy — xem §2.4): bộ đếm `counters` trong `debugSnapshot`
  (`tick / holdStop / gainStop / negExpected / playFalse / playOk /
  keep / restart / restartExact / stopAll`), không đổi hành vi; giữ lại
  cho P4/harness đọc.

### 2.3. Unit test — PASS

`reverseAudio193P3.test.ts` **16/16 PASS** (fake AudioContext +
fake decode), gồm: crossfade (đoạn cũ stop ở t0+0,08 không phải +0,02;
đoạn mới ramp tới t0+0,08), stop() tắt cả đoạn đang mờ, window trích
đúng slice đảo (100 s @1000 Hz: window [60,90], data[0]=89999,
data[29999]=60000), playSegment offset tuyệt đối + clamp mép, clip 700 s
→ false, cửa sổ clamp về đầu file [0,10] khi bắt đầu trước 0, wiring clip
90 s load cửa sổ + phát đúng offset + `longClips=["long1"]`, đổi cửa sổ
nền khi tới gần mép (decodeCalls 1→2, đoạn sau offset 0,5 s), clip 601 s
vẫn mute, restart-exact nối tiếp đúng mẫu 1000.

Đã cập nhật test đợt 192 `reverseAudio192P3.test.ts` (case "clip dài 61 s
không fetch" → 601 s, vì 61 s nay load theo cửa sổ; **12/12 PASS**).
Hồi quy: reverseAudio 7, seek 21, reversePlayback 10/10,
reversePlayback191P3 7, reversePlayback192P3 13, reverseCadence 9 — đều
PASS. `npx tsc --noEmit` **0 lỗi**; `npm run build` **PASS**.

### 2.4. Kiểm chứng headed — chirp 300→3000 Hz

Probe `~/workspace/tmp-round193-p3/audio-probe-193.mjs` (+ biến thể diag
`audio-diag-193.mjs`, lấy mẫu 200 ms kèm `__vcutHoldStats`,
`__vcutMediaState`, counters wiring; analyser master
`__vcutAudioAnalyser`, fftSize 2048, bin 23,4 Hz; RMS tính từ
`getByteTimeDomainData` — time-domain thật, không smoothing; cửa sổ
analyser ~43 ms). Fixture 10 s: `~/workspace/tmp-round192-p3/chirp-10s.mp4`
(320×180, sweep 300→3000 Hz, `aevalsrc=sin(2*PI*(300*t+135*t*t))`).
Fixture 70 s: `~/workspace/tmp-round193-p3/chirp-70s.mp4` (70,0 s,
320×180, h264+aac, 1.223.955 B, sweep 300→3000 Hz,
`aevalsrc=sin(2*PI*(300*t+19.2857*t*t))`).

**(A) Chirp 10 s (video), bundle mới — tiếng liền, đúng hướng.**
Xuôi (đối chứng): peakHz 409→1098, RMS 0,67 hằng. Ngược (60 mẫu × 200 ms):
mẫu 0 là transient khởi động (RMS=0, peakHz 1098 còn vương của pass
xuôi); **49/49 mẫu trong pass (t=9,7→0,1) RMS 0,29–0,60 — 0 mẫu lặng**;
peakHz GIẢM 2907→345 (kỳ vọng chirp đảo tại source time tương ứng
~2892→327, khớp trong độ phân giải bin + thời điểm lấy mẫu). Mẫu
50–59 sau khi playhead về 0: RMS=0 (đã dừng, đúng).
So với 192 (2/16 RMS=0): không còn mẫu lặng nào ở độ phân giải này.
Counters cuối pass (1 wiring, 1 slot): `tick=609, holdStop=309,
gainStop=0, negExpected=0, playFalse=0, playOk=250, keep=48,
restart=0, restartExact=0, stopAll=6` (xem F-193-P3-1/2 dưới).

**(B) Chirp 10 s audio-only** (`chirp-10s-audio.m4a`, tách từ fixture
video; app dùng element AUDIO, vẫn seek từng frame khi phát ngược):
49/49 mẫu trong pass có tiếng (RMS 0,31–0,63), peakHz GIẢM 2778→345 —
cùng mẫu hình như bản video. Chứng tỏ hiện tượng §2.4 không riêng video.

**(C) Chirp 70 s (video) — CLIP DÀI ĐÃ PHÁT, hết mute.**
Mẫu 0–2 đang load cửa sổ (loaded=0, RMS=0, ~0,6 s decode file 70 s +
đảo cửa sổ 30 s). Từ mẫu 3: `loaded=1, longClips=["c_dmi6mvw"]` — clip
dài load theo cửa sổ, được theo dõi đúng. **53/55 mẫu trong pass sau khi
load (t=69,4→58,3) RMS 0,41–0,67**; peakHz GIẢM 2972→2519 (kỳ vọng
chirp đảo 2977→2549 tại source time tương ứng — khớp). 2 mẫu lặng
(18–19, t kẹt ở 01:06.6, ~0,4 s) + 2 mẫu cuối cửa sổ lấy mẫu (58–59,
t kẹt 58,3) là hold-silence (xem F-193-P3-2): playhead bị giữ chờ seek
GOP chậm trên file 70 s, counters cuối: tick=462, holdStop=206 (~45%),
playOk=154. Đổi cửa sổ nền chưa kích hoạt trong 12 s lấy mẫu (cửa sổ
đầu [40,70], playhead mới tới 58,3) — phần này chỉ chứng minh bằng unit
test (decodeCalls 1→2).

**(D) Badge.** Badge "audio đảo" hiện khi `playing=True`; "không audio"
khi hold-stop — badge nhấp nháy theo hold trong khi tiếng vẫn liền ở độ
phân giải 43 ms (xem nợ §5).

**F-193-P3-1 (PHÁT HIỆN MỚI — crossfade chưa kích hoạt headed dưới tải).**
Counters (A) cho thấy đoạn 0,5 s KHÔNG BAO GIỜ phát hết dưới tải này:
`restart=0, restartExact=0` — mọi lần (re)start đoạn (playOk=250) đều là
trường hợp segActive=false sau hold-stop (không qua khối quyết định, không
crossfade — prevSrc null sau stop()). Đoạn sống trung bình ~40 ms
(10 s / 250 lần restart) rồi bị hold-stop dừng. **Crossfade +
restart-exact chỉ được chứng minh bằng unit test (16/16), chưa chứng
minh headed.** 0 mẫu lặng ở (A) là nhờ restart nhanh sau mỗi lần hold
(khoảng trống < 43 ms — cửa sổ analyser), không phải nhờ crossfade.
Hệ quả: ghi nhận "2/16 tại điểm nối" của đợt 192 chưa có bằng chứng
counter — theo số đợt 193, các khoảng lặng đó nhiều khả năng cũng là
hold-silence (seek chậm), không phải join-silence. Crossfade chỉ phát
huy khi đoạn phát trọn 0,5 s (máy rảnh, không hold) — cần đo lại trong
cửa sổ rảnh riêng (xem §5).

**F-193-P3-2 (PHÁT HIỆN MỚI — gating ~25 Hz bởi hold-stop, thiết kế S7c
có sẵn).** Wiring dừng đoạn mỗi khi playhead bị giữ ("tiếng không chạy
trước hình", S7c đợt 192): holdStop=309/609 tick (~50%) ở clip 10 s,
206/462 (~45%) ở clip 70 s. Mỗi đoạn chỉ phát ~40 ms rồi bị dừng
(`silenceSource` ngắt kết nối ngay) → tiếng bị gating ~25 Hz: RMS đo
được 0,29–0,60, thấp hơn xuôi 0,67, phù hợp duty cycle ~50%. Khi hold
kéo dài > ~50 ms (seek GOP chậm, nhất là file 70 s) cửa sổ analyser
43 ms rỗng → RMS=0 thấy được (mẫu 18–19 clip 70 s). Đây KHÔNG phải hồi
quy đợt 193 (thiết kế hold-stop có từ S7c), nhưng probe RMS 200 ms
không đo được độ mượt cảm nhận — cần ghi waveform thật mới kết luận
nghe có mượt không. Quyết thiết kế cho parent/đợt sau: GIỮ gating
(đồng bộ hình, tiếng đứt quãng khi seek chậm) HAY cho audio chạy xuyên
hold (trôi tối đa ~0,5 s so với hình, tiếng liền)? Đợt này KHÔNG đổi
quyết S7c một mình.

## §3. Reverse mượt — CHƯA ĐO LẠI ĐƯỢC VÌ TẢI CAO (không kết luận)

Theo §13-192: chỉ đo lại lúc máy thật sự rảnh (load < 3 suốt pass) trước
khi xét lại prefetch. A/B dense đợt này (fixture
`~/workspace/tmp-round191-p3/dense-gop-ramp191.mp4`, GOP 30, 1280×720,
30 fps, 10 s; harness `~/workspace/tmp-round192-p3/measure192.mjs`;
script `run-ab-dense-193.sh`, log `ab-dense-193.log`; chạy 20:48–20:52Z
25/11/2026 trên bundle đợt 192):

| lượt | fps ngược | presentedFps | stalls >250 ms | frame đầu | load (đầu→cuối pass) |
|---|---|---|---|---|---|
| OFF-1 | 0,39 | 2,1 | 14 | 2918 ms | 3,34→7,06 |
| ON-1 | 0,64 | 1,66 | 17 | 1891 ms | 8,34→9,25 |
| OFF-2 | 0,41 | 1,61 | 17 | 1893 ms | 9,31→7,30 |
| ON-2 | 0,42 | 1,51 | 16 | 2903 ms | 6,69→4,13 |

Tất cả `reverseOk=false`, holdDelta 356–418, drawDelta 13–22. **Không
lượt nào giữ load < 3 suốt pass** (OFF-1 bắt đầu ở load 1,36 nhưng đã
3,34 lúc bắt đầu pass ngược; các lượt khác 6,69–9,31). Nguyên nhân tải:
các luồng đợt 193 khác chạy song song (P4 `parity193-run.mjs` + Chrome,
T01 crosscheck) + chính Chrome headed của harness. Ghi nhận: tiêu chí
"load < 3 suốt pass" không đạt được bằng harness này trên cell này
(cell_shared_cpus=1,5) ngay cả khi bắt đầu lúc máy rảnh — cần cửa sổ rảnh
riêng (không chạy song song các luồng đợt) hoặc metric tải khác.
**KHÔNG kết luận gì về prefetch từ đợt này; KHÔNG sửa prefetch.**
Nguyên nhân đã rõ từ trước (decode cửa sổ phần mềm serial dưới tải —
mảng Hiệu suất) vẫn giữ nguyên.

## §4. File đổi, kiểm chứng tổng

File đổi (11, xem paths file): `lib/seek.ts` (reverseScrub per-target +
frameIndexFloor), `lib/seek193P3.test.ts` (MỚI, 6 test),
`lib/reversePlayback.ts` (helper reverseScrubSeekTarget),
`lib/reversePlayback193P3.test.ts` (MỚI, 5 test),
`lib/reverseAudio.ts` (crossfade + loadReversedWindow + window fields),
`lib/reverseAudio193P3.test.ts` (MỚI, 16 test),
`lib/reverseAudioWiring.ts` (overlap/restart-exact + slot windowed +
longClips snapshot + counters chẩn đoán),
`lib/reverseAudio192P3.test.ts` (sửa 1 case 61 s → 601 s),
`preview.tsx` (Seeker executor: scrub ngược lùi 1 ms cho video),
`tsconfig.json` (exclude 3 test mới — file đã có sẵn entry
`parityHarness193.test.ts` của P4-193, không đụng tới), LIMITS này.
Không đụng file luồng khác. `dist` build mới không stage.

Kiểm chứng tổng: `npx tsc --noEmit` **0 lỗi**; `npm run build` **PASS**
(bundle `index-QQibQhig.js` 1.713.530 B); test node:test:
seek 21, seek193P3 6/6, reversePlayback 10/10, reversePlayback191P3 7,
reversePlayback192P3 13, reversePlayback193P3 5/5, reverseAudio 7,
reverseAudio192P3 12/12, reverseAudio193P3 16/16, reverseCadence 9 —
đều PASS. Headed: scrub trước/sau 0/4 → 4/4 (§1.3); audio chirp 10 s
49/49 mẫu có tiếng, chirp 70 s đã phát (§2.4); A/B mượt chưa đo được
(§3).

## §5. Giới hạn còn lại — nợ chuyển sang đợt 194

1. **Crossfade headed chưa chứng minh** (F-193-P3-1): cần đo lại trong
   cửa sổ rảnh riêng (load < 3, không hold) để đoạn phát trọn 0,5 s và
   crossfade/restart-exact kích hoạt; ghi waveform để đo khoảng lặng
   thật thay vì RMS 200 ms.
2. **Quyết gating/hold-silence** (F-193-P3-2): parent quyết giữ hold-stop
   (đồng bộ hình) hay cho audio chạy xuyên hold; nếu đổi thì sửa wiring
   + đo lại bằng waveform.
3. **Badge nhấp nháy**: badge đọc `segActive` tức thời nên nhấp nháy
   theo hold; nên đọc trạng thái load/segment có độ trễ (~0,5 s) hoặc
   trạng thái "đang phát đảo" theo pass, không theo tick.
4. **Decode cửa sổ file ~600 s có thể > 5 s** (decode toàn file tạm
   thời): có thể lặng ngắn tại mép cửa sổ khi đổi cửa sổ nền không kịp;
   chưa đo — cần fixture ~300–600 s đo thời gian decode + hành vi tại
   mép. (Giải pháp lâu dài: decode từng phần/stream, không decode toàn
   file.)
5. **Clip > 600 s vẫn mute** (cổng thiết kế); clip 70 s lần đầu phát
   sau ~0,6 s load cửa sổ — chấp nhận được, chưa đo trên file 600 s.
6. **Đo lại reverse mượt khi máy rảnh** (load < 3 suốt pass) trước khi
   xét lại prefetch (§3); scrub ngược trên clip dense/GOP dài chưa đo.
7. Nợ cũ còn nguyên: reverse mượt dưới tải (mảng Hiệu suất — decoder
   pool / proxy rẻ / giới hạn cửa sổ decode); scrub ngược ngoài lưới
   1 ms sau đầu frame theo quyết S6b.

## §6. Ghi chú cho parent

- Khoản 1 xong dứt khoát (headed trước/sau). Khoản 2 xong về code +
  unit + clip dài đã phát; nhưng 2 phát hiện mới (F-193-P3-1/2) cho
  thấy phần "liền mạch" của audio đảo chưa chứng minh được headed dưới
  tải — cần quyết thiết kế (gating) + cửa sổ rảnh để đo crossfade.
  Khoản 3 chưa đo được (tải cao) — không kết luận vội, không sửa
  prefetch mù, đúng chỉ đạo §13-192.
- Bộ đếm `counters` trong wiring giữ lại (không đổi hành vi) để P4 và
  các đợt sau đọc trực tiếp lý do segment tắt/mở thay vì đoán từ badge.
