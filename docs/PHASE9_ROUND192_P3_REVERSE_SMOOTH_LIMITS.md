# Đợt 192 P3 — Reverse preview: sửa S6b + nối S7c + làm mượt hơn

- **Phạm vi:** Editing Core — preview/render parity (hướng mới user 15:03 25/11).
- **Bundle đo:** `apps/web/dist` build đợt này — `index-l6h0lMWk.js` (1.706.733 B,
  build 14,50 s, `npm run build` = tsc + vite đều PASS).
- **Chromium đo:** headed 1254 (`chromium-1254/chrome-linux64/chrome`), Xvfb :98.
- **Kết luận ngắn:** S6b SỬA XONG (offset 1 ms, chứng minh headed); S7c NỐI XONG
  (audio đảo phát thật, đúng hướng, chứng minh headed bằng chirp); mượt hơn
  CHƯA ĐẠT 30 fps — số đo thật dưới tải nặng, nút thắt còn lại là decode
  cửa sổ phần mềm serial. Không ghi khống số nào.

## §1. S6b — lệch +1 frame ở biên lưới (F-191-P4-1)

### 1.1. Trước / sau

| | Trước (đợt 191) | Sau (đợt 192) |
|---|---|---|
| Seek khi stepping ngược | đúng `sourceTimeAt` | `sourceTimeAt − 1 ms` (`reverseSeekTarget`) |
| Biên lưới t=k/30, k>0 | element hiện N−k, render cần N−1−k → lệch +1 hệ thống (MAD 25,5–33,2) | 0 (probe headed, §1.2) |
| k=0 | khớp | khớp (clamp về 0) |

### 1.2. Vì sao 1 ms, không phải frameDur/2 — probe headed tự làm

Probe riêng (`~/workspace/tmp-round192-p3/headed/`, fixture `rev-src.mp4`
160×90, 30 fps, 60 frame, mỗi frame mã hoá index; MAD tới frame gần nhất
0,3–0,6, tới frame thứ hai 3,2–4,3 — không mơ hồ):

- eps=0 tái hiện đúng bug: k=15/30/45 → +1; k=1 → 0 (artifact float frame cuối).
- eps=1/60 s VÀ eps=1 ms đều sửa mọi biên (offset 0). Chrome báo
  `currentTime` đúng như yêu cầu, không snap về đầu frame.
- Trường hợp phân biệt (target ngoài lưới, 8,3 ms sau đầu frame — nửa đầu
  khoảng frame): eps=1/60 → **−1 (sai, 2/2)**; eps=1 ms → **0 (2/2)**;
  eps=0 cũng 0 ở đây.
- **Quyết: offset = 0,001 s.** Đúng ở biên và ngoài lưới (chỉ sai trong 1 ms
  sau đầu frame, ~3% vị trí, so với 50% của frameDur/2). Với 1 ms,
  `|currentTime − target| ≈ 1 ms << stepEps (0,5/fps = 16,7 ms)` nên các
  guard pacing/draw hiện có (so với target thô) vẫn qua — chỉ đổi phép gán seek.

### 1.3. Thay đổi code

- `lib/reversePlayback.ts`: thêm `REVERSE_SEEK_BACKOFF_SEC = 0.001` +
  `reverseSeekTarget(target)` (≤0/NaN → 0; còn lại `max(0, target − 0,001)`),
  kèm comment ghi bằng chứng probe.
- `lib/preview.tsx`: import `reverseSeekTarget`; cả 2 nhánh stepping ngược
  trong `syncMedia` seek tới `reverseSeekTarget(a.target)` (global reverse +
  `clip.reverse`); `drawVideoClip` WebCodecs truyền
  `reverseSeekTarget(rampSourceTimeAt(clip, t))` (`sampleIndexForPresentationTime`
  dùng `<=` nên s−1 ms trả N−1−k); index cadence VideoFrame dùng target đã
  chỉnh (tracker phải ghi frame thực sự vẽ, N−1−k, không phải N−k). Guard
  draw cố ý vẫn so với target thô (qua với biên 16×).
- Test mới `lib/reversePlayback192P3.test.ts`: **13/13 PASS** (biên k=1/15/30/45,
  ngoài lưới nửa đầu/nửa sau, guard-margin, clamp, không phụ thuộc fps).
- P4 đo lại độc lập bằng phương pháp của họ; probe trên là tự kiểm của P3.

### 1.4. Nợ còn lại (không sửa đợt này)

Đường pause/scrub (`Seeker` trong `lib/seek.ts`, dùng chung với scrub xuôi)
vẫn seek tới đúng target nên scrub tại biên ngược đúng vẫn hiện N−k. Brief
ghi "khi stepping ngược" nên không đụng Seeker đợt này — ghi nợ cho đợt sau
(cần tách backoff riêng cho scrub ngược, không đổi scrub xuôi).

## §2. S7c — nối ReverseAudioPlayer vào preview (F-191-P4-3)

### 2.1. Trước / sau

| | Trước (đợt 191) | Sau (đợt 192) |
|---|---|---|
| `ReverseAudioPlayer` trong preview/audioEngine | 0 lần nhắc; preview mute audio ngược | nối xong, phát thật |
| Audio khi phát ngược | im | có tiếng, đúng hướng (chirp, §2.3) |

### 2.2. Thay đổi code

- `lib/reverseAudio.ts`: (a) constructor nhận `destination` tuỳ chọn (mặc
  định `ctx.destination`) để wiring nối qua master của AudioEngine (volume +
  VU); (b) `playSegment(startSample, seconds, gain = 1, rate = 1)` — gain
  ramp tới gain clip (không phải 1), rate đặt `playbackRate` (guard khi
  property tồn tại, context giả cũ vẫn qua); (c) helper thuần mới
  `reversedSampleOffsetFromSourceTime({sourceTimeSec, sourceDurationSec,
  sampleRate})` = `floor((duration − sourceTime) × sr)`, −1 khi ngoài miền
  (helper cũ theo timeline giữ cho test S7b); (d) header ghi wiring đã có.
- `lib/reverseAudioWiring.ts` (MỚI, ~13 KB): manager `ReverseAudioWiring` +
  thuần `shouldRestartReverseSegment` + hằng `REVERSED_AUDIO_SEGMENT_SEC = 0,5`,
  `REVERSED_AUDIO_DRIFT_TOLERANCE_SEC = 0,12`. Mỗi clip audio đang phát: fetch +
  decode + đảo 1 lần, giữ buffer (chỉ nguồn ≤ 60 s, chặn bằng `el.duration`
  TRƯỚC fetch; dài hơn vẫn mute); phát đoạn 0,5 s từ offset đảo theo thời
  gian nguồn hiện tại; dừng đoạn khi playhead bị giữ (cùng giá trị playhead
  qua các tick — bằng float chính xác); phát lại đoạn khi hết đoạn hoặc lệch
  > 0,12 s so với offset kỳ vọng; prune player của clip hết hoạt động / đổi
  URL; `stopAll()` dọn hết (pause / đổi hướng). Mọi lỗi nuốt thành "vẫn mute",
  không bao giờ ném vào vòng lặp preview. Gain = gain clip clamp 0..1 (như
  `AudioEngine.update`); rate = tốc độ clip (`a.speed`). Phơi `loadedCount`,
  `isPlaying`, `clipKeys`, `debugSnapshot()`.
- `lib/audioEngine.ts`: chỉ thêm 2 getter, không đổi hành vi — `getContext()`,
  `getMasterNode()` (wiring dùng; trả null khi graph chưa mở thì wiring bỏ
  qua, vẫn mute).
- `lib/preview.tsx`: import wiring; lazy `getReverseAudioWiring(engine)` ở
  mức module (tạo manager khi engine có context; tạo lại nếu context đổi sau
  dispose+ensure) + `exposeReverseAudio()` (định nghĩa getter
  `window.__vcutReverseAudio` trả `debugSnapshot()`); trong `syncMedia` ngay
  sau `engine.update(outSources)`: khi đang phát và (global reverse hoặc có
  `clip.reverse`), dựng entries từ `actives` join với `liveAudioSources` theo
  element (clipKey, `el.currentSrc || el.src`, `el.duration`, `a.target` làm
  thời gian nguồn, gain GỐC của `audioSources` trước khi map mute-ngược,
  `a.speed`) rồi gọi `wiring.tick(t, entries)`; còn lại (phát xuôi hoặc pause
  — syncMedia CÓ gọi với playing=false từ nhánh pause) gọi
  `reverseAudioWiring?.stopAll()`.
- Badge phát ngược: ref `reverseBadgeRef` + `lastReverseAudioBadgeRef` (mẫu
  badge engine A6); cập nhật text/title qua DOM trong tick nhánh phát (sau
  syncMedia) và tick pause đầu tiên (quay về "không audio"), + effect
  `[previewLang]` tính lại khi đổi lang lúc vòng lặp ngủ. Key i18n mới
  `preview.reverseAudioLabel` / `preview.reverseAudioBadge` (vi + en, xem §5).
- Test mới `lib/reverseAudio192P3.test.ts`: **12/12 PASS** (offset helper,
  giữ/phát lại đoạn kể cả rate 2, gain+rate trên node, wiring load-once +
  offset đảo đúng, hold-stop giữ buffer, keep-vs-restart theo drift, gain 0 /
  >60 s / prune / stopAll, đổi URL load lại).

### 2.3. Kiểm chứng headed — chirp 300→3000 Hz (CHỨNG MINH ĐƯỢC)

Fixture `~/workspace/tmp-round192-p3/chirp-10s.mp4` (10 s, 320×180, video màu
đặc + audio sine sweep 300→3000 Hz, `aevalsrc=sin(2*PI*(300*t+135*t*t))`).
Đo trên app thật (harness 191, display :98, bundle `index-l6h0lMWk.js`):
đọc `window.__vcutReverseAudio` + analyser master (`__vcutAudioAnalyser`,
fftSize 2048, peak bin → Hz) mỗi 0,5 s.

- **Xuôi (đối chứng):** peakHz TĂNG 388 → 1852 Hz theo t=0,5→6 s (kỳ vọng
  435→1920 — khớp trong độ phân giải bin 23,4 Hz + thời điểm lấy mẫu);
  RMS 0,67 hằng — audio xuôi qua master bình thường, wiring chưa động
  (`revAudio=None`).
- **Ngược:** peakHz GIẢM **2778 → 1034 Hz** khi playhead 9,2→2,7 s — khớp
  chirp đảo (kỳ vọng 2784→1029 Hz, sai số ~10 Hz); `revAudio.loaded=1,
  playing=True` ở đa số mẫu; RMS 0,29–0,67 ở 14/16 mẫu → **có tiếng, đúng
  hướng**. 2/16 mẫu bắt được RMS=0 tại điểm nối đoạn 0,5 s (khoảng lặng ngắn
  khi restart đoạn — xem nợ §2.4).
- **Badge:** trên fixture thưa (không track audio), badge hiện đúng
  "◀ PHÁT NGƯỢC — không audio" ở mọi mẫu của 6 lượt A/B (§3); trên fixture
  chirp (có audio), badge hiện đúng **"◀ PHÁT NGƯỢC — audio đảo"** ở cả 7
  mẫu có `playing=True` (run-audio-badge: t=9,2→2,4, peakHz 2649→1098,
  RMS 0,33–0,67) — cả hai trạng thái badge đã chứng minh headed.

### 2.4. Nợ còn lại

- Khoảng lặng ngắn tại điểm nối đoạn 0,5 s (2/16 mẫu RMS=0 trong run chirp):
  chấp nhận được cho lần nối đầu, nhưng cần overlap/crossfade đoạn ở đợt sau
  nếu muốn audio đảo liền mạch.
- Clip audio > 60 s vẫn mute (giới hạn thiết kế — tránh giữ buffer đảo lớn);
  chưa có stream đảo từng phần cho clip dài.

## §3. Làm mượt hơn — đo headed A/B prefetch OFF vs ON

### 3.1. Phân tích trước khi đo (đã làm đợt này)

- **Decode-ahead (prefetch) CHƯA BAO GIỜ chạy đợt 191:** toggle mặc định TẮT
  (`decodeAheadWanted = false`) VÀ cổng yêu cầu decode phần mềm ≥ 2× fps
  phát (60 fps; `isEasyDecodeFootage`) trong khi nhiễu 720p decode ~32 fps.
  Phân tích của Q3: ổn định chỉ cần decodeFps ≥ playbackFps (32 ≥ 30, biên
  6%); 2× là biên an toàn cho phương sai tải, và luật no-re-gate của T4 đã
  chống flap. **Giữ nguyên toggle mặc định + cổng đợt này** (đổi sẽ phá
  check S8 của P4 và kỳ vọng đã khóa của luồng khác; lật mặc định/cổng là
  quyết của parent — xem §6).
- **Chuỗi prefetch không cần sửa:** prefetch cửa sổ kế được kick ở cuối mỗi
  lần decode cửa sổ; cửa sổ đã prefetch đủ không trigger bẫy
  `decoded=0 → unsupported` (frameAt chạm cache trước; ensureWindowForTime
  chỉ chạy khi cache miss, và frame đích luôn nằm trong chính cửa sổ của nó).
- **GOP-decode-0 (nợ §7.2 LIMITS P3-191) — ĐÃ ĐIỀU TRA XONG, không phải bug
  byte/decode** (xem §3.2).

### 3.2. Probe GOP-decode-0 (timebox, kết quả dứt khoát)

Probe 1 (`gop-probe-192.ts`, bundle esbuild, Chromium headed, fixture sparse
qua HTTP Range): T3 trả mode `gop-range` (300 sample, `avc1.64001F`,
1280×720, 1 GOP, range 48–52085398, 709 ms); `fetchSingleGopRange` OK
(52.085.350 B); `buildGopSegment` 300 chunk; **VideoDecoder thô decode
300/300, không lỗi** (timestamp đầu 66667, 100000, … µs). Byte segment đúng.

Probe 2 (`controller-probe-192.ts`, chạy controller thật
`ReversePreviewController`, GOP-range, window 60): T3 xong ở 766 ms,
gopMode=`gop-range`, cache tăng đều 6→299 frame, **299/299, decodeFps 31,95
(đo thật), frameAt(9,9) HIT, không failed**. Không timeout nào hủy decode
(`ensureWindowForTime` chia sẻ `decodePromise` khi gọi nối tiếp, không abort).

**Kết luận:** đường GOP hoạt động trên code hiện tại. "DecodeGop trả 0" đợt
191 không tái hiện trong cô lập — khả năng cao là decode cửa sổ 300 frame
quá chậm dưới tải app (cần ~9–10 s ở 32 fps, lâu hơn dưới tải) nên trong cửa
sổ quan sát 12 s của P3-191 chưa có frame đích nào, rồi fallback của P3-191
chuyển sang full-file (frame đầu 20,2 s). Không sửa code GOP đợt này; fallback
giữ nguyên. (Lưu ý: probe chạy qua HTTP Range; app dùng blob: URL — P3-191
đã xác minh Range trên blob trả 206 đúng, nên khác biệt này không đổi kết luận.)

### 3.3. Override đo `__vcutDecodeAheadForce` (MỚI, console-only)

- `lib/reverseWebcodecs.ts` — `enableDecodeAheadFromGate`: khi
  `window.__vcutDecodeAheadForce === true` thì ép verdict thành
  `allowed-experiment` bất chấp cổng (giữ nguyên `reasons`, thêm warning +
  key `reverseGate.force192P3`). Mặc định tắt (không đặt flag = cổng chạy
  như cũ); KHÔNG đổi toggle mặc định, KHÔNG đổi module cổng chung
  `reversePreviewGate.ts`; decision ghi rõ "force192P3" để UI không nhầm là
  cổng mở thật. Key i18n `reverseGate.force192P3` thêm vào vi + en.
- Harness bật bằng đường user thật: đặt flag + click
  `.preview-decodeahead-toggle` (qua `setReverseDecodeAheadWanted(true)`).
  **Chứng minh override hoạt động:** lượt ON-3 thưa (§3.4) —
  `decodeAheadActive=true` sau khi measurement 12,79 fps về (cổng thường
  chặn vì < 60 fps).

### 3.4. A/B trên fixture THƯA (sparse-gop-ramp191.mp4, 1280×720, 30 fps, 10 s)

Phương pháp: harness 191 (snapshot dist đóng băng, Xvfb :98, import MediaBin
thật, phát xuôi 6 s, End → phát ngược, lấy mẫu 0,5 s, đọc
`__vcutReverseCadence` + `__vcutReverseDecodeAheadStatus`). 3 cặp xen kẽ
OFF/ON, pass ngược 30 s. **Máy đo lúc này bão hòa (load 9–10, các luồng
khác chạy Chrome headed + build song song) so với ~2–3 của đợt 191 — mọi số
dưới đây đều đo dưới tải nặng, không so trực tiếp được với baseline 191.**

| Lượt | Load (đầu→cuối) | Cadence fps | Frame đầu | Frames | p90 interval | Stall >250 ms |
|---|---|---|---|---|---|---|
| OFF-1 | 2,51→8,71 | 1,79 | 16,92 s | 39 | 601,9 ms | 13 |
| ON-1 | 9,62→10,40 | 6,98 | 20,13 s | 36 | 221,1 ms | 3 |
| OFF-2 | 10,29→9,69 | 3,23 | 17,29 s | 52 | 305,9 ms | 8 |
| OFF-3 | 5,87→4,83 | 1,54 | 15,71 s | 29 | 396,4 ms | 5 |
| ON-2 | 9,41→5,77 | 2,92 | 17,78 s | 42 | 385,2 ms | 9 |
| ON-3 | 5,11→3,04 | 2,88 | 14,58 s | 57 | 272,0 ms | 8 |

Median OFF 1,79 fps / ON 2,92 fps; frame đầu 14,6–20,1 s. `reverseOk=false`
ở cả 6 lượt (playhead đi 10→0 nhưng canvas giữ gần như cùng 1 frame:
drawDelta chỉ 1–5, holdDelta 247–494 — xem §3.6). **Prefetch chỉ bật ở
ON-3** (active từ mẫu 48/60, sau khi measurement 12,79 fps về ở ~24 s —
quá muộn, playhead đã về 0); ON-1/ON-2 measurement không về kịp trong 30 s
nên prefetch không kịp bật. **Kết luận thưa: KHÔNG có thắng lợi rõ ràng.**
Cửa sổ đầu là cả GOP 300 frame (~25–30 s decode ở 9–13 fps dưới tải) nên
pass 30 s kết thúc ngay khi prefetch vừa bật — fixture 1 GOP không đo được
tác dụng prefetch.

### 3.5. A/B trên fixture DENSE (dense-gop-ramp191.mp4, GOP 30, 10 keyframe)

Cùng phương pháp, 3 cặp xen kẽ + 1 cặp "rảnh" (load lúc bắt đầu 3,30 nhưng
lại vọt lên 8–11 giữa lượt do luồng khác chạy — xem §3.6). Cửa sổ đầu chỉ
~30 frame nên prefetch kịp bật giữa pass; mục tiêu đo là stall chuyển cửa sổ
(đợt 191: 3,5–4,2 s mỗi lần chuyển).

| Lượt | Load (đầu→cuối) | Cadence fps | Frame đầu | Frames | p90 interval | Stall >250 ms | Prefetch bật? |
|---|---|---|---|---|---|---|---|
| OFF-1 | 4,45→8,16 | 2,09 | 1,37 s | 74 | 1713 ms | 21 | không (0/60 mẫu) |
| ON-1 | 9,43→8,47 | 1,59 | 1,43 s | 56 | 1620 ms | 24 | CÓ (mẫu 18→59, 105 frame) |
| OFF-2 | 9,08→9,66 | 1,51 | 1,44 s | 53 | 2048 ms | 20 | không |
| ON-2 | 9,30→5,77 | 1,40 | 1,59 s | 47 | 2080 ms | 21 | CÓ (mẫu 20→59, 103 frame) |
| OFF-3 | 7,74→4,65 | 1,39 | 1,91 s | 50 | 2097 ms | 20 | không |
| ON-3 | 4,61→5,90 | 1,14 | 1,79 s | 43 | 2759 ms | 21 | CÓ (mẫu 25→59, 105 frame) |
| QUIET-OFF | 3,67→8,62 | 1,42 | 1,61 s | 48 | 1983 ms | 21 | không |
| QUIET-ON | 9,54→10,69 | 1,43 | 2,09 s | 49 | 2172 ms | 19 | CÓ (41 mẫu, meas 10,84 fps) |

Median OFF 1,51 fps / ON 1,40 fps (cặp rảnh: 1,42 vs 1,43); stall >250 ms
20–21 ở cả hai phía; p90 1,6–2,8 s không cải thiện. **Prefetch bật đầy đủ
ở cả 4 lượt ON** (active=true từ mẫu 18–25 tới hết pass, ahead range
103–105 frame, measurement 7,9–12,0 fps — cổng thường chặn vì < 60 fps,
chỉ cờ force mới mở) **nhưng fps trình bày và stall KHÔNG cải thiện.**

Giải thích: `prefetchFrames` đếm số frame trong ahead RANGE đã chỉ định,
không chứng minh decode prefetch đã hoàn thành — decode prefetch chạy cùng
lúc với decode cửa sổ chính trên cùng CPU chia sẻ đã bão hòa (load 8–11),
nên nó cũng đói CPU như đường chính; và nhịp trình bày lúc này bị chi phối
bởi hold/pacing dưới tải (drawDelta chỉ 19–36, holdDelta 319–372 trong
mỗi pass) chứ không phải riêng stall chuyển cửa sổ. **Kết luận: prefetch
không cứu được reverse mượt khi máy bão hòa.** Cần đo lại lúc máy thật sự
rảnh (load < 3 suốt pass — đợt này không có cửa sổ rảnh nào: load lại vọt
lên 8–11 giữa mỗi lượt do các luồng khác) trước khi kết luận cuối về
prefetch; nhưng với bằng chứng hiện có, KHÔNG đề xuất lật mặc định/cổng.

### 3.6. Vì sao số đợt này tệ hơn baseline 191 (8,78 fps)

1. **Tải máy:** load 9–10 lúc đo (OFF-1/ON-1/OFF-2) so với ~2–3 của đợt 191.
   Decode phần mềm đo được chỉ 9,2–12,8 fps (OFF) thay vì ~32 fps — cửa sổ
   300 frame cần ~30 s decode, dài bằng cả pass.
2. **Hold chiếm đa số:** playhead vẫn chạy theo pacing (10→0 trong ~34 s
   wall) trong khi frame đích chưa decode xong → tick nào cũng hold (247–494
   hold, chỉ 1–5 draw) → canvas đứng yên, `reverseOk=false`. Đây là hệ quả
   của (1), không phải regression của code mới (so sánh: drawDelta đợt 191
   cũng thấp trong pass thưa; cadence 191 đạt 43 frame/4,9 s vì máy rảnh hơn).
3. **30 fps CHƯA ĐẠT trên footage nặng.** Nút thắt còn lại: decode serial
   phần mềm dưới CPU chia sẻ + nhịp trình bày hold-dominated dưới tải.
   Prefetch đã bật nhưng không cải thiện (§3.5). Đối chứng: cùng app, cùng
   bundle, fixture chirp nhẹ (320×180) đạt **25,68 fps trình bày** (211
   frame, frame đầu 142 ms, median interval 33,6 ms, 0 stall >250 ms) —
   reverse TIỆM CẬN 30 fps khi footage nhẹ; footage 720p nhiễu mới là chỗ
   kẹt. Hướng sửa thuộc mảng Hiệu suất: decoder pool song song, proxy rẻ
   cho preview ngược, hoặc giới hạn cửa sổ decode.

## §4. Kiểm chứng (test + tsc + build)

- `reverseCadence.test.ts`: **9/9**; `reversePlayback191P3.test.ts`: **7/7**;
  `reverseAudio.test.ts`: **7/7**; `reversePlayback.test.ts` (cũ): **10/10**;
  `reversePlayback192P3.test.ts` (mới): **13/13**;
  `reverseAudio192P3.test.ts` (mới): **12/12** — chạy bằng
  `node --experimental-strip-types`, tất cả PASS.
- `tsc --noEmit` trong `apps/web`: **0 lỗi** (4 lỗi P1 đợt 191 nay đã hết —
  luồng khác đã sửa; không phải của P3).
- `npm run build`: PASS, bundle `index-l6h0lMWk.js` (1.706.733 B, 14,50 s).
- `tsconfig.json`: thêm `reversePlayback192P3.test.ts` +
  `reverseAudio192P3.test.ts` vào `exclude` (nối sau entry
  `parityHarness192.test.ts` của P4-192 — đã hợp nhất, không ghi đè).
- i18n: `preview` 32/32 key (vi/en bằng nhau); `reverseGate` 5/5 bằng nhau.

## §5. File đổi (stage, KHÔNG push)

```
apps/web/src/lib/reversePlayback.ts            (S6b: reverseSeekTarget)
apps/web/src/lib/reversePlayback192P3.test.ts  (MỚI, 13 test S6b)
apps/web/src/lib/reverseAudio.ts               (S7c: destination/gain/rate/offset helper)
apps/web/src/lib/reverseAudioWiring.ts         (MỚI, ~13 KB, manager S7c)
apps/web/src/lib/reverseAudio192P3.test.ts     (MỚI, 12 test S7c)
apps/web/src/lib/audioEngine.ts                (2 getter getContext/getMasterNode)
apps/web/src/preview.tsx                       (S6b seek + S7c wiring + badge audio đảo)
apps/web/src/lib/reverseWebcodecs.ts           (__vcutDecodeAheadForce)
apps/web/src/i18n/vi.json                      (preview.reverseAudioLabel/Badge, reverseGate.force192P3)
apps/web/src/i18n/en.json                      (như trên)
apps/web/tsconfig.json                         (exclude 2 test mới)
docs/PHASE9_ROUND192_P3_REVERSE_SMOOTH_LIMITS.md (file này)
```

Không sửa code sau khi P4 chốt snapshot đo (P4 sẽ báo; nếu còn sửa sẽ báo
P4 đo lại).

## §6. Khuyến nghị cho parent (§14.1)

1. **Giữ nguyên toggle decode-ahead TẮT + cổng 2× đợt này.** Bằng chứng
   nay đủ để KHÔNG lật: prefetch bật đầy đủ ở 4/4 lượt ON dense (ahead range
   103–105 frame) nhưng fps trình bày (median 1,40 vs 1,51) và stall chuyển
   cửa sổ (19–24 vs 20–21) không cải thiện dưới tải 8–11; trên thưa cũng
   không thắng rõ. Cần một lượt đo lúc máy thật sự rảnh (load < 3 suốt pass)
   trước khi xét lại — đợt này không có cửa sổ rảnh nào.
2. **Nút thắt thật là decode cửa sổ + nhịp trình bày dưới tải, không phải
   prefetch.** Muốn reverse mượt trên footage 720p nhiễu cần một trong:
   (a) decode song song nhiều GOP (decoder pool), (b) proxy decode rẻ cho
   preview ngược, (c) giới hạn cửa sổ decode (không decode cả GOP 300 frame
   cho 1 lần present). Đây là việc của các đợt sau (mảng Hiệu suất, theo
   thứ tự user).
3. **S6b/S7c xong, chờ P4 xác nhận độc lập** (S6b bằng phương pháp của P4;
   S7c P4 có thể dùng lại fixture chirp `~/workspace/tmp-round192-p3/chirp-10s.mp4`).
