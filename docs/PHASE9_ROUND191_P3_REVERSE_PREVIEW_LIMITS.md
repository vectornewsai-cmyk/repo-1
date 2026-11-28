# LIMITS — Đợt 191 P3: reverse preview mượt (Editing Core)

- Luồng: P3 đợt 191 (Phase 9 VCut), chủ đề Editing Core — parity preview/render.
- Ngày đo: 25/11/2026 (UTC). Bundle cuối: `index-FB5F_ZL6.js` (vite build 20,8 s).
- Harness: headed chromium-1248, DISPLAY:93, port 4193, VM chia sẻ 1,5 CPU
  (các luồng khác của đợt 191 chạy song song — tải máy là biến số lớn nhất).
- Fixture: `sparse-gop-ramp191.mp4` (1280×720, 30 fps, 10 s, 300 frame,
  1 keyframe, 52 MB, gray ramp theo giây) và `dense-gop-ramp191.mp4`
  (cùng nội dung, `-g 30`, 10 keyframes, 52,8 MB); `frames-noise.mp4`
  (90 frame, 3 s, 1 keyframe, 1,9 MB) làm đối chứng đường full-file.
- Số đo đầy đủ: `benchmarks/results/v191-p3-reverse-cadence.json`
  (12 lượt headed; scratch + JSON gốc từng lượt ở
  `~/workspace/tmp-round191-p3/{base-wc,base-el,fix-*,fix2-*,fix3-*}/`).
- Verdict trung thực: **playhead ngược nay chờ frame (không chạy trước hình
  nữa) và đường WebCodecs đã mở lại được trên file 32–128 MiB, nhưng reverse
  vẫn CHƯA mượt** — tốt nhất đo được là 8,78 fps theo chùm với frame đầu
  sau 20,2 s (sparse, tải ~10); chưa đạt 30 fps. Nút thắt còn lại là
  decode phần mềm serial theo cửa sổ dưới tải CPU chia sẻ (§2.3), không
  còn là pacing. Audio reverse thật CHƯA nối vào preview (§3).

## 1. Chẩn đoán (đo thật, baseline bundle `index-BMVwYB-q.js`)

### 1.1 Baseline sparse (1 GOP / 300 frame), 12 s
| Engine | Playhead | draw | hold | maxHoldAge | Hình |
|---|---|---|---|---|---|
| WebCodecs | 9,6 → 0 (chạy hết) | 1 | 163 | 7,13 s | gray kẹt ở 4 ~6,5 s rồi 2, 1 |
| Element | 9,6 → 0 (chạy hết) | 1 | 145 | 4,93 s | gray kẹt ở 1 rồi 3 |

rAF khỏe cả hai đường (gapP50 4,4 ms) — vấn đề là decode/draw, không phải rAF.
Nguyên nhân gốc (đọc code + đo trực tiếp): gate giữ playhead R2 (đợt 90)
loại trừ reverse — `shouldSkipRenderWhileSeeking` trả false khi
`reversePlayback`, resume-stall watches không ghi nhánh reverse — nên
**playhead ngược không bao giờ chờ seek/frame**: playhead chạy realtime
trong khi frame đóng băng rồi nhảy. Diag trực tiếp: element ở trạng thái
`currentTime 9.967, paused true, seeking true, readyState 1` suốt 12+ s;
`__vcutReverseWc` hits 0, misses tăng, `gopActive true`, `gopCache misses 1`.

### 1.2 Pre-warm đã điều tra và LOẠI
Nút phát ngược (`toggleReversePlayback` trong `store.ts`) bật cờ + phát ngay
trong cùng 1 lần bấm, không có khoảng pause giữa toggle và play; nhánh pause
của preview đặt `drawTransport = {playing:false, reversePlayback:false}` nên
`frameAt` không được gọi lúc pause. Không có điểm kích pre-warm trong luồng
UX hiện tại. Pre-warm chỉ khả thi nếu tách toggle thành 2 bước (đợt sau).

## 2. Fix đã làm

### 2.1 Giữ playhead ngược chờ frame (fix chính)
Giữ nguyên kiến trúc `resolveReverseEngine`. Chỉ phát ngược TOÀN CỤC (clip
reverse lẻ không đóng băng playhead chung), qua cơ chế giữ R2 sẵn có
(`shouldHoldPlayheadWhileSeeking`, trần 15 s `PLAYHEAD_HOLD_MAX_MS`,
latch nhả):
- Engine element: giữ khi seek stepping còn bay ở tick trước.
- Engine webcodecs: giữ khi tick trước không vẽ frame cho target hiện tại.
- Không có clip video stepping active → không giữ (tránh đóng băng ở
  khoảng trống timeline).
- Tín hiệu cũ 1 tick (syncMedia chạy sau khi tăng playhead), cùng mẫu
  `prevSkipRenderSeeking`. Khi giữ, `reverseAcc = 0` nên không nhảy bù khi
  nhả. Nhánh reverse của syncMedia không đọc `playheadHeld` (khối pause
  khi giữ chỉ nằm trong nhánh forward) nên giữ không đổi hành vi seek.
- Helper thuần mới `shouldHoldReversePlayhead` trong `reversePlayback.ts`.

### 2.2 Deadlock "đòi frame mới" — phát hiện và sửa trong đợt
Tiêu chí đầu tiên ("vẽ frame MỚI", frameIdx khác frame trước) không tương
thích với playhead đang giữ: playhead đứng yên → target không đổi → frame
đúng vẫn là frame cũ → tracker khử trùng → cờ tick false → giữ tiếp →
deadlock tự duy trì. Bằng chứng dense GOP-30 (bundle trước sửa): **95 draw
(7,92 fps), frame đầu 1.341,7 ms, nhưng playhead 10 → 9,9, gray kẹt ở 9**.
Đã sửa: ngữ nghĩa cờ thành "có vẽ frame nào cho target hiện tại không"
(bất kể frameIdx mới hay lặp) — `reversePlayback.ts` field
`drewNewFramePrevTick` → `drewFramePrevTick`, `preview.tsx`
`reverseDrewNewFrameTick` → `reverseDrewFrameTick`; cờ tick tách khỏi
kết quả dedupe của tracker (tracker vẫn khử trùng cho thống kê).

### 2.3 Đường GOP kẹt 0 hit → rơi về full-file (fix thứ hai, quan trọng nhất)
**Chẩn đoán:** trên file blob 32–128 MiB, controller vào `gop-range`
(`gopActive=true`) nhưng không bao giờ trả frame (hits 0 sau 12 s, 30 s
chỉ 2 frame). Probe cô lập trên đúng Chrome headed (script
`~/workspace/tmp-round191-p3/probe-blob-range.mjs`):
- `fetch(blobUrl)` → 200, đủ 52.089.980 byte.
- `fetch(blobUrl, {Range: bytes=0-1023})` → **206, Content-Range
  `bytes 0-1023/52089980`, len 1024** — Range trên blob: URL HOẠT ĐỘNG.
- `HEAD blobUrl` → `TypeError: Failed to fetch` (không ảnh hưởng: HEAD
  chỉ là best-effort, probe Range mới quyết định).
- Lượt dense lặp lại: `gopCache` có **3 segments / 15.930.913 byte**
  (fetch GOP thành công) nhưng `hits 0`, `gopActive` vẫn true,
  `gopFallbackReasons []` — tức `ensureWindowViaGop` **chưa từng trả về**:
  nó kẹt ở `decodeGop` serial (decode cửa sổ nhiễu 720p phần mềm ~32 fps,
  một cửa sổ 75 frame ≈ 2,3 s không tải, 5–10 s dưới tải 5–10) và không có
  đường thoát nào. Lỗi không ở tầng fetch.
- Đối chứng: file 1,9 MB (đường full-file, không qua GOP) hit **33 frame**
  — đường full-file hoạt động tốt trên blob: URL.
- Hợp đồng "lỗi GOP rơi về full-file" ghi ở `ensureWindowForTime` chỉ
  đúng khi T3 tự trả mode full-file; khi T3 trả `gop-range` mà cửa sổ
  sau đó hỏng thì hàm trả false thẳng về caller, controller kẹt vĩnh viễn.

**Sửa** (`reverseWebcodecs.ts`, `ensureWindowForTime`): khi
`ensureWindowViaGop` trả false thì latch `gopActive=false`, xóa cờ
`unsupported` nếu chính lần gọi này vừa đặt (decode-0 ở đường GOP dùng
byte segment — không chứng minh được đường full-file cũng hỏng; nếu
full-file cũng 0 frame thì nhánh dưới đặt lại `unsupported` như cũ),
ghi lý do `gop-window-failed: cửa sổ GOP fetch/decode hỏng, rơi về
full-file` vào `gopFallbackReasonValue`, rồi rơi xuống nhánh `load()`
cũ thay vì return false. `gopMode` tự thành `"full-file-fallback"`
(getter có sẵn). Đánh đổi: đường full-file fetch lại toàn file mỗi lần
đổi cửa sổ (thiết kế R3) — với blob: URL là copy bộ nhớ, rẻ; cửa sổ
75 frame = 2,5 s phát nên tối đa ~1 fetch/2,5 s.

### 2.4 Tracker cadence + sửa chỉ số frame VideoFrame
`ReverseCadenceTracker` mới (`reverseCadence.ts`): ghi frame MỚI được
vẽ, khử trùng vẽ lại cùng frame; `snapshot()` → presentedFrames /
distinctFrames / firstFrameLatencyMs / wallSec / presentedFps /
intervalMedianMs / p90 / max / stallsOver100ms / stallsOver250ms; phơi
sớm qua `window.__vcutReverseCadence` để harness `start()` được trước
khi có frame đầu. **Bug đo đã sửa trong đợt:** `frameIdx` là chỉ số của
motion-blur (theo held `firstHeldT`) nên SAI khi srcEl là VideoFrame
(đường webcodecs) — lượt frames-noise ghi 3 frame dù cache đã hit 33 lần.
Nay lấy chỉ số từ mốc nguồn thật (`videoFrameIndex(rampSourceTimeAt(clip,
t), projFps)`) khi srcEl là VideoFrame; element/canvas giữ nguyên.

## 3. Audio reverse — KẾT LUẬN: engine xong, CHƯA nối
- Đã xây `reverseAudio.ts`: `reverseFloat32Channel`,
  `reversedSampleOffset`, `reversedSegmentWindow`, `ReverseAudioPlayer`
  (decode + đảo kênh qua interface `AudioContext` tối thiểu, fade vào/ra
  10 ms, `MAX_REVERSED_AUDIO_SECONDS = 60`, mọi lỗi trả false/no-op
  không throw). Test 7/7 PASS (fake AudioContext).
- **CHƯA nối vào preview.** Lý do kỹ thuật: nối thật cần fetch/decode
  theo từng clip active + đồng bộ playhead mỗi tick — chạm vùng
  `audioEngine` của P1 (đợt này). Để đợt sau: P1 (hoặc luồng audio) nối
  `ReverseAudioPlayer` vào điểm mute hiện tại, với điều kiện: clip
  ≤ 60 s (hoặc đảo theo đoạn), decode trước khi phát ngược lần đầu,
  và dừng/đảo lại khi playhead đổi hướng.
- Mute khi phát ngược hiện tại: **sạch click theo code** — `audioEngine.ts`
  dùng `setTargetAtTime`, `GAIN_SMOOTHING_TC = 0.03` (dòng 198, 391),
  mute 1→0 mượt. Đây là claim đọc-code, **chưa đo headed** (không có
  harness đo click/gap âm thanh trong đợt này).

## 4. Số đo sau fix (bundle cuối `index-FB5F_ZL6.js` trừ khi ghi khác)

### 4.1 Sparse (1 GOP / 300 frame) — WebCodecs
| Lượt | Playhead | Cadence | firstFrame | Ghi chú |
|---|---|---|---|---|
| 12 s (tải ~10) | 9,9 → 9,9 (đứng) | 0 frame | — | GOP decode + fallback chưa xong trong 12 s; playhead chờ đúng |
| **30 s (tải ~10)** | **10 → 0** | **43 frame, 8,78 fps, median 103,8 ms, p90 184,3 ms, max 281,3 ms, stall >250 ms: 1** | **20.223 ms** | Fallback mở được cache: chỉ 1 element seek hoàn thành (target 0, 422 ms) + 1 seek 26,0 s không draw — 43 frame còn lại chỉ có thể đến từ cache WebCodecs |
| Trước fallback, 30 s (`index-DZ5dYfL1.js`) | 10 → 8,3 | 2 frame | — | maxHoldAge 1,57 s |

### 4.2 Sparse — Element
| Lượt | Playhead | Cadence | Ghi chú |
|---|---|---|---|
| 12 s (`index-c6_4vdXB.js`) | 10 → 9,9 | 1 frame, firstFrame **10.880 ms** (= 10,88 s — seek từ keyframe 0 qua 300 frame nhiễu) | lag playhead–hình ~0,9 s (baseline ~4,93 s) |
| 12 s (FB5F_ZL6) | 10 → 10 (đứng) | 0 frame | rAF ngược hoàn hảo: 1082 tick/12,9 s, gapP50 2,2 ms, 0 gap >100 ms — vòng lặp khỏe, seek element chỉ chưa xong trong 12 s |

### 4.3 Dense (GOP 30) — WebCodecs
| Lượt | Playhead | Cadence | Ghi chú |
|---|---|---|---|
| Trước sửa deadlock (`index-c6_4vdXB.js`) | 10 → 9,9 | 2 frame (tracker) / 95 draw | DEADLOCK: vẽ lại cùng frame 95 lần |
| Sau sửa deadlock (`index-DAtiN5A1.js`) | 10 → 6,6 | 6 frame, firstFrame 1.561,9 ms, median 2.339,1 ms | deadlock hết; mỗi cửa sổ chờ element seek ~2,15 s (perSeek median) |
| Sau fallback (FB5F_ZL6) | 9,9 → 8,9 | 15 frame, firstFrame 2.981,7 ms, median 98 ms, p90 3.523,7 ms, max 4.187,9 ms, stall >250 ms: 4 | khi frame chảy thì ~10 fps; 4 stall dài = mỗi lần đổi cửa sổ decode lại |
| Lặp lại (FB5F_ZL6) | 9,9 → 9,6 | 3 frame, firstFrame 4.125,5 ms, median 4.104 ms | wc cuối: hits 0, gopCache 3 seg/15,9 MB, gopActive=true — decode cửa sổ đầu chưa xong trong 12 s dưới tải 5–6 |

### 4.4 Đọc số cho đúng
- **Chưa đạt 30 fps ở bất kỳ lượt nào.** Tốt nhất: 8,78 fps theo chùm
  (sparse 30 s), median interval ~100 ms khi frame đang chảy.
- **Phương sai giữa các lượt lặp rất lớn** (dense: 15 frame vs 3 frame):
  decode phần mềm là nút thắt CPU; tải máy lúc đo 3,4–11,6 (loadavg 1′).
  Mọi con số trên chỉ có giá trị kèm tải máy lúc đo (ghi trong JSON).
- `holdStats.draw` (drawDelta) và cadence khác nhau là đúng: drawDelta đếm
  quyết định draw/tick của holdStats, cadence đếm frame trình bày phân biệt
  (vd sparse 30 s: drawDelta=2 nhưng 43 frame — phần lớn frame đến qua
  đường cache sau khi cửa sổ decode xong, không qua từng tick draw mới).
- First-frame latency 2–20 s là chi phí decode cửa sổ đầu (GOP attempt +
  fallback + full-file fetch/decode), không phải lỗi pacing.

## 5. Test
- `node --experimental-strip-types` (node type-stripping, không cần build):
  - `src/lib/reverseCadence.test.ts` — **9/9 PASS**
  - `src/lib/reversePlayback191P3.test.ts` — **7/7 PASS** (helper giữ playhead)
  - `src/lib/reverseAudio.test.ts` — **7/7 PASS** (fake AudioContext)
  - `src/lib/reversePlayback.test.ts` (cũ) — **10/10 PASS**
- `tsc --noEmit`: **0 lỗi ở file của luồng này**. Còn 19 lỗi thuộc file
  luồng khác đợt 191 (15 `parityHarness191.ts`, 2
  `parityHarness191.test.ts`, 2 `audioEngineVoiceFx.test.ts`, 1
  `previewVoiceFx.test.ts`, 1 `audioEngine.ts`) — `npm run build`
  (`tsc && vite build`) sẽ fail chừng nào các file đó còn lỗi;
  `vite build` trực tiếp vẫn chạy tốt (bundle cuối `index-FB5F_ZL6.js`).
- Headed: 12 lượt (mục 4 + 2 baseline); probe blob-Range riêng 1 lượt.
- Không có test unit cho fallback GOP (controller cần VideoDecoder thật
  của browser) — kiểm chứng bằng đo headed §4.1/§4.3 thay thế.

## 6. Phạm vi file chạm (chỉ vùng reverse-playback)
- `apps/web/src/lib/reverseCadence.ts` (mới) + `reverseCadence.test.ts` (mới)
- `apps/web/src/lib/reverseAudio.ts` (mới) + `reverseAudio.test.ts` (mới)
- `apps/web/src/lib/reversePlayback.ts` — thêm `shouldHoldReversePlayhead`
  + interface `ReversePlayheadHoldInput`; `reversePlayback191P3.test.ts` (mới)
- `apps/web/src/lib/reverseWebcodecs.ts` — fallback GOP→full-file trong
  `ensureWindowForTime` (quanh dòng gọi `ensureWindowViaGop`); không đổi
  gate T3, demux, hay decodeGop.
- `apps/web/src/preview.tsx` — CHỈ vùng reverse-playback, không reformat
  dòng không liên quan:
  - import: dòng 146 (`shouldHoldReversePlayhead`), 151 (`ReverseCadenceTracker`)
  - module scope: dòng ~3865–3885 (tracker + cờ `reverseDrewFrameTick` /
    `reverseDrewFramePrevTick` / `lastSyncReversePlayheadHold` + `exposeReverseCadence()`)
  - `drawVideoClip` (dòng 3957+): khai báo `let stepping` / `let drewReverseFrame`
    (3972–3973), đặt cờ ở nhánh wcFrame (4089) và nhánh element `decision ===
    "draw"` (4135), ghi cadence + cờ tick (4206–4222)
  - `renderFrame` (dòng 4961+): reset cờ tick + phơi cadence sớm (~4980–4984)
  - `syncMedia` (dòng 5326+): tính `lastSyncReversePlayheadHold` (~5840–5858)
  - vòng lặp phát: `prevReversePlayheadHold` (~6478–6479),
    `seekingPrevTick` gồm cờ reverse (6802), cập nhật sau syncMedia (7565)
    và sau `renderFrame` (7644), reset ở nhánh pause (7661)
- `apps/web/tsconfig.json` — thêm 3 test file mới vào `exclude` (quy ước repo:
  test file dùng import đuôi `.ts` cho strip-types và bị loại khỏi tsc).
- KHÔNG sửa code audiofx/voice (P1), enhance (P2), file luồng nền,
  MEMORY.md / build-loop-log.md / PHASE9_GAP_ANALYSIS.md / AGENTS.md.
  KHÔNG push, không release/tag. Repo local không phải git repo
  (`git status` → "fatal: not a git repository") nên không có diff git.

## 7. Nợ / việc chưa làm (cho đợt sau)
1. **Decode serial theo cửa sổ là nút thắt còn lại.** Hướng: prefetch
   cửa sổ KẾ trong lúc cửa sổ hiện tại đang phát (decodeAhead đã có khung
   nhưng cửa sổ decode vẫn serial qua `decodePromise`); hoặc decode bằng
   GPU / giảm độ phân giải decode khi phát ngược; hoặc cache cửa sổ đã
   decode qua lần phát ngược trước. Cần đo lại trên máy rỗi để tách tải
   CPU khỏi tốc độ decode thật.
2. **GOP attempt tốn thời gian khi nó sẽ hỏng.** Lần đầu trên blob 52 MiB
   mất ~20 s (GOP decode thử + fallback + full-file). Hướng: nếu
   `decodeGop` của cửa sổ đầu trả 0 thì ghi lại "GOP decode hỏng cho URL
   này" và bỏ qua GOP ngay từ lần sau (hiện đã latch `gopActive=false`
   sau 1 lần hỏng — nhưng lần hỏng đầu vẫn tốn trọn 1 lượt decode).
   Cần xác định thêm: vì sao `decodeGop` trên segment GOP trả 0 frame
   trong khi cùng codec đó decode được ở đường full-file (nghi ngờ
   `buildGopSegment` / offset chunk với moov-cuối — chưa chứng minh).
3. **Double-decode chưa sửa:** element seek và VideoDecoder GOP decode
   chạy song song cùng GOP, tranh CPU. Hướng: khi WebCodecs đang decode
   cửa sổ thì tạm dừng element seek (hoặc ngược lại).
4. **Audio reverse chưa nối** (§3): cần P1 nối `ReverseAudioPlayer` vào
   điểm mute hiện tại; điều kiện: clip ≤ 60 s hoặc đảo theo đoạn, decode
   trước lần phát ngược đầu, dừng/đảo lại khi đổi hướng.
5. **Element seek quá chậm trên GOP thưa** (2,15 s/frame dense,
   10,88 s frame đầu sparse, 26 s worst-case dưới tải 10): đường element
   chỉ còn là fallback, không phải đường chính cho reverse mượt.
6. **Clip reverse lẻ** giữ hành vi cũ (không giữ playhead chung) — chưa
   đo cadence riêng cho trường hợp này.
7. **File > 128 MiB** vẫn fallback element (khóa S4 giữ nguyên) — chưa mở
   đường WebCodecs cho file lớn.
8. Mute sạch click khi vào/ra reverse là claim đọc-code (TC 0,03 s),
   chưa đo headed — cần harness đo click/gap âm thanh nếu muốn khẳng định.
