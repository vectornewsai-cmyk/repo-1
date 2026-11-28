# LIMITS — Đợt 191 P1: Voice effects lên preview (Editing Core)

- **Luồng:** P1 đợt 191 (Phase 9 VCut). **Ngày:** 25/11/2026.
- **Nhiệm vụ:** đưa voice effects (pitch / robot / telephone / echo) hiện chỉ có ở
  RENDER lên PREVIEW bằng Web Audio, cùng tham số với render.
- **Kết quả chung:** 4/4 hiệu ứng đã lên preview và phát được tiếng thật trên
  Chromium 158. **Echo đúng hoàn toàn. Telephone gần đúng (lệch gain dải giữa
  do BiquadFilter Chrome ≠ FFmpeg). Robot xấp xỉ. Pitch xấp xỉ** (tần trội đúng
  ±0,5 semitone, có artifact AM — xem §3.4).

## 1. Render làm gì (đo thật bằng FFmpeg 8.1.2, 25/11/2026)

Chuỗi render (`server/render/src/voicefx.js` + `audioroute.js`): áp **sau reverb,
trước volume**, thứ tự **pitch → robot → telephone → echo**.

| Hiệu ứng | Cơ chế render | Tham số |
|---|---|---|
| pitch | `rubberband=tempo=1:pitch=2^(n/12)` | n semitone (int) |
| robot | `vibrato=f=rate:d=depth` | rate mặc định 25 Hz, depth 0,6 |
| telephone | `highpass=f=300,lowpass=f=3400` (Butterworth bậc 2) | cố định |
| echo | `aecho=in_gain=0.8:out_gain=0.9:delays=D:decays=Y` (1 tap) | delay 200 ms, decay 0,5 |

Số đo render (sine 440 Hz, trừ khi ghi khác):
- pitch +12 → **880,0 Hz đúng**.
- robot: phổ sine 440 Hz — carrier 404; ±50 Hz: 347; ±75 Hz: 386; ±100 Hz: 315
  (tỉ lệ so carrier 0,86 / 0,96 / 0,78). Độ lệch delay suy ra A ≈ 1,6 ms ở
  depth 0,6 → ~2,7 ms ở depth 1 (ước lượng thô, β≈4,5).
- telephone, tỉ lệ RMS so dry: 100 Hz **0,11**; 440 Hz **0,906**; 1000 Hz **0,992**;
  5000 Hz **0,406**.
- echo (impulse): **out = 0,9 × (0,8 × in + decay × in(t−delay))** — dry = **0,72**
  (không phải 0,8), wet = 0,9×decay. Kiểm chứng thêm gains 0,6/0,5/100/0,4 →
  dry 0,30, echo 0,20 đúng công thức.

## 2. Preview làm gì (`apps/web/src/lib/previewVoiceFx.ts`, mới, ~18,5 KB)

Chuỗi Web Audio (cùng thứ tự render): **pitch → robot → telephone → echo**,
mỗi stage có dry/wet riêng → bypass thật khi tắt. Nối vào `audioEngine.ts`:
`comp → voice.input → voice.output → gain` (fail-soft: lỗi tạo chain → null,
preview phát dry bình thường).

| Hiệu ứng | Cơ chế preview | Tham số |
|---|---|---|
| pitch | pitch-shifter 2 delay + sóng saw PeriodicWave + crossfade cos (W = 0,04 s; LFO f = \|r−1\|/W; delayA/B = W/2 + g·saw, g = ∓W/2 khi r>1, ±W/2 khi r<1; crossfade 0,5∓0,5cos θ) | cùng n semitone, r = 2^(n/12) |
| robot | DelayNode + LFO sine (rate Hz, depth → biên độ delay) | excursion 0,0027 s ở depth 1 → 0,00162 s ở depth 0,6 |
| telephone | BiquadFilter highpass 300 Hz + lowpass 3400 Hz, Q = 1/√2 | cố định |
| echo | DelayNode 1 tap, dry 0,72, wet 0,9×decay | delay 200 ms, decay 0,5 |

- `playbackRate` KHÔNG phải giải pháp (đổi cả tempo → lệch sync).
- Trễ thêm trung bình W/2 ≈ 20 ms khi pitch bật.
- Hằng số: `PITCH_WINDOW_S = 0,04`; `ROBOT_DELAY_EXCURSION_S = 0,0027`;
  `TELEPHONE_HP_HZ = 300`; `TELEPHONE_LP_HZ = 3400`; `BUTTERWORTH_Q = 1/√2`;
  `SAW_GAIN_COMP = 50/43 ≈ 1,163` (xem §4.2); `VOICE_FX_SMOOTHING_TC = 0,01`.

## 3. Parity từng hiệu ứng (đo thật, Chromium 158, OfflineAudioContext 48 kHz)

### 3.1 Echo — ĐÚNG HOÀN TOÀN ✓
Impulse đặt ở t = 100 ms (sau khi params settle): tap dry **0,72**, tap +200 ms
**0,45** (= 0,9×0,5) — khớp render từng số. (Đo tap ở t = 0 cho 1,0 là artifact
của setTargetAtTime ramp, không phải bug.)

### 3.2 Telephone — GẦN ĐÚNG (lệch gain dải giữa, đã xác minh là hành vi Chrome)
Tỉ lệ RMS đo được (module = cascade HP+LP viết tay, giống nhau từng số →
wiring đúng; khác FFmpeg):

| Tần số | Render (FFmpeg) | Preview (Chrome) |
|---|---|---|
| 100 Hz | 0,11 | 0,118 ✓ |
| 440 Hz | 0,906 | **1,223** (+35%) |
| 1000 Hz | 0,992 | **1,102** (+11%) |
| 5000 Hz | 0,406 | **0,537** (+32%) |

Q đã xác minh đọc lại sau render = 0,7071 đúng. Kết luận: BiquadFilterNode
của Chrome cho gain dải giữa cao hơn FFmpeg ~1,5–2 dB với cùng Q/fc. Hiệu ứng
vẫn nghe rõ là "điện thoại" (100 Hz cắt mạnh, 5000 Hz cắt ~một nửa) nhưng
**không sample-exact với render**. Không có cách sửa bằng tham số Q/fc mà
không phá đáp ứng ở 100/5000 Hz — để nguyên, ghi nhận là parity gap.

### 3.3 Robot — XẤP XỈ
Cùng cấu trúc vibrato (delay + LFO sine 25 Hz). Phổ preview ở 440 Hz, depth 0,6
(đo bằng peak-finding): sideband so carrier ±25: 0,66; ±50: 0,68; ±75: **1,30**;
±100: 1,02 — render: 0,86 / 0,96 / 0,78 (carrier trội). Preview **over-modulated
nhẹ** (sideband ±75 vượt carrier). Excursion 0,0027 s được suy từ chính số đo
render (A ≈ 1,6 ms ở depth 0,6) nên giữ nguyên làm neo — không chỉnh theo cảm
tính. Một phép đo so sánh excursion 0,0020/0,0015 bằng bin-magnitude cho kết
quả không đơn điệu (nhiễu spectral leakage) nên **không đủ tin để đổi hằng số**;
ghi lại để đợt sau đo lại bằng peak-finding nếu cần.

### 3.4 Pitch — XẤP XỈ (tần trội đúng, có artifact AM)
Sweep sine 440 Hz, nguồn 4 s, cửa sổ đo 1,0–1,34 s (module đầy đủ, sau bù):

| n | Mục tiêu | Tần trội đo | Sai số |
|---|---|---|---|
| +12 | 880,0 | 890,6 | +0,21 st |
| +7 | 659,3 | 665,0 | +0,15 st |
| +5 | 587,3 | 591,8 | +0,13 st |
| +1 | 466,2 | 465,8 | −0,01 st |
| −1 | 415,3 | 416,0 | +0,03 st |
| −5 | 329,6 | 328,1 | −0,08 st |
| −7 | 293,7 | 290,0 | −0,22 st |
| −12 | 220,0 | 213,9 | −0,49 st |

**Tất cả trong ±0,5 semitone** (tốt nhất ±0,25); −12 ở biên (−0,49 st).
**Artifact (trung thực):** shifter 2-delay crossfade có AM nội tại — hai đường
delay luôn lệch pha nhau Δd ≈ W/2×0,86 ≈ 0,017 s, tức f₀×Δd chu kỳ; ở giữa
crossfade hai đường giao thoa phá nhau một phần → biên độ nhấp nhô theo LFO.
Đo trước bù: envelope 5 ms trong 1 chu kỳ LFO 0,15 → 0,32 (nhấp ~2:1), phổ
tách 2 đỉnh 791/841 Hz quanh 816 Hz (carrier bị triệt). Sau bù, ở 440 Hz pha
lệch rơi vào điểm thuận (0,8 chu kỳ) nên đỉnh trội gọn, sideband nhỏ; **với tần
số nền khác, độ sâu nhấp có thể lớn hơn** — đây là giới hạn của thiết kế
granular 2-delay, không sửa được bằng tham số. Trên tiếng nói/nhạc thật
(nhiều thành phần tần số) artifact nghe như chorus nhẹ, không như tremolo
sạch của sine thuần. Giải pháp triệt để (PSOLA/AudioWorklet + FFT) ngoài phạm
vi đợt này. Bypass trong suốt: domFreq 439,5 Hz, rmsRatio 1,0.

## 4. Bug đã tìm và sửa trong đợt

### 4.1 Hệ số Fourier sóng saw SAI (bug gốc, đã sửa)
Module dùng `imag[k] = (2/π)(−1)^k/k` — sai ở sóng hài chẵn. Chuỗi đúng của
sawtooth tăng f(θ)=θ/π−1 là **`imag[k] = −2/(πk)`** (tất cả âm, không xen dấu);
sóng lệch pha đúng: `imag[k] = −2·(−1)^k/(πk)`. Kiểm chứng cũ bằng Python chỉ
check θ=π/2, π, 3π/2 (nơi sóng hài chẵn triệt tiêu) nên đã lọt. Hệ số đúng đã
kiểm chứng số học tại θ=π/4 (−0,738 vs −0,75; +0,248 vs +0,25), π/2, π, 3π/2.
Triệu chứng trước sửa: pitch +12 cho domFreq 90,8 Hz, spread 74% (nhiễu).
Phát hiện phụ: sóng sawtooth có sẵn của Chrome bắt đầu ở giữa ramp (giá trị 0
tại t=0, nhảy ở T/2), đỉnh ±0,938 — không dùng được cho shifter; sóng
PeriodicWave tự làm là saw tăng chuẩn.

### 4.2 Bù biên độ saw (`SAW_GAIN_COMP = 50/43 ≈ 1,163`)
Chrome chuẩn hoá PeriodicWave → độ dốc hiệu dụng của saw đo được **43/s**
thay vì 50/s lý tưởng → tỉ lệ dịch thiếu ~14% (đơn delay cho 814,5 Hz thay vì
880 ở +12). Nhân saw gains với 50/43 → tần trội về đúng ±0,5 semitone (bảng
§3.4). Hằng số đo trên Chrome 158; trình duyệt khác có thể lệch nhẹ.

### 4.3 Lệch mirror `video-spec` (có sẵn từ Phase 8 Q5, đã sửa)
`audio.js` (twin viết tay) thiếu check voice trong `hasAudioEffects` và thiếu
toàn bộ block validate voice trong `validateAudioEffects` — validate web bỏ qua
voice sai. Đã bổ sung; mirror checker vẫn pass 427/6/0.

## 5. Test đã chạy (lệnh từ gốc repo, 25/11/2026)

- `node --experimental-strip-types apps/web/src/lib/previewVoiceFx.test.ts`
  → **26 pass, 0 fail** (resolve defaults, pitchRatio, graph/wiring, setParams
  từng hiệu ứng incl. echo dry 0,72/wet 0,45, dispose, fail-soft không rò node).
- `node --experimental-strip-types apps/web/src/lib/audioEngineVoiceFx.test.ts`
  → **8 pass, 0 fail** (toPreviewFx passthrough/drop, engine update áp voice
  params, releaseElement stop osc, mock cũ fail-soft).
- `node --experimental-strip-types apps/web/src/lib/audioEngine44Z2.test.ts`
  → **6/6**; `audioEngine52I2.test.ts` → **15/15** (test cũ không vỡ).
- `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- `node packages/video-spec/scripts/check-video-spec-mirror.mjs`
  → **427 pass, 6 known, 0 fail**.
- Trình duyệt thật (Chromium 158 headless, CDP, OfflineAudioContext 48 kHz):
  bypass/echo/telephone/pitch-sweep/robot như §3. Hạ tầng test ở
  `/tmp/voicefx-browser/` (không stage — file tạm).

## 6. File đổi (stage trong paths-loop)

- `packages/video-spec/src/audio.ts` — hằng số voice + `hasVoiceEffect()` +
  `resolveVoiceEffect()` + interface `ResolvedVoiceEffect` (chỉ phần voice).
- `packages/video-spec/src/audio.js` — cùng exports + sửa lệch mirror §4.3.
- `apps/web/src/lib/previewVoiceFx.ts` — **mới**, module chain voice.
- `apps/web/src/lib/previewVoiceFx.test.ts` — **mới**, 26 test.
- `apps/web/src/lib/audioEngineVoiceFx.test.ts` — **mới**, 8 test.
- `apps/web/src/lib/audioEngine.ts` — **file chung**: import previewVoiceFx;
  `PreviewAudioFx` thêm `voice?`; `toPreviewFx` truyền voice qua khi
  `hasVoiceEffect`; node record thêm `voice`; `nodeFor` chèn chain sau comp;
  `update()` gọi `setParams`; `releaseElement` dispose. (Parent xử lý xung đột
  lúc đóng nếu luồng khác cũng sửa.)
- `apps/web/scripts/test-audioengine.sh` — **file chung**: tách typecheck
  (`tsc --noEmit`, allowImportingTsExtensions) và bundle esbuild vì tsc 5.6.3
  cấm `allowImportingTsExtensions` khi emit (TS5097/TS5096).
- `docs/PHASE9_ROUND191_P1_VOICEFX_PREVIEW_LIMITS.md` — file này.

**KHÔNG đổi:** `apps/web/src/preview.tsx` (đã truyền `fx` qua `toPreviewFx`
từ trước, dòng 5057/5069 — không cần sửa), `components/audiofx/AudioFxPanel.tsx`
(UI đã có sẵn voice controls), code enhance/speed/reverse, MEMORY.md,
build-loop-log.md, PHASE9_GAP_ANALYSIS.md, AGENTS.md.

## 7. Chưa làm / nợ

- Pitch: artifact AM nội tại (§3.4); −12 ở biên −0,49 st; trễ ~20 ms khi pitch
  bật. Chưa có PSOLA/AudioWorklet.
- Telephone: lệch gain dải giữa so FFmpeg (§3.2) — cần quyết có chấp nhận hay
  bù gain thủ công theo bảng đo (bù sẽ làm sai 100/5000 Hz nếu chỉ nhân hệ số).
- Robot: excursion 0,0027 giữ theo suy luận từ render; chưa đo lại bằng
  peak-finding để chốt có giảm xuống ~0,0020 hay không.
- Chưa test nghe bằng tai người trên clip voice thật (chỉ sine/impulse);
  chưa đo trên Firefox/Safari (hằng số bù 50/43 đo trên Chrome 158).
