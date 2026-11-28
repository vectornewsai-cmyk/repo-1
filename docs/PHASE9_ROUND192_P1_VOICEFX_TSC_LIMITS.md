# LIMITS — Đợt 192 P1: Sửa 4 lỗi tsc voice effects + telephone + pitch −12
(Editing Core — preview/render parity)

- **Luồng:** P1 đợt 192 (Phase 9 VCut). **Ngày:** 25/11/2026.
- **Nhiệm vụ:** (1) sửa 4 lỗi tsc của P1 đợt 191; (2) đo lại telephone lệch gain
  dải giữa, đề xuất chấp nhận hay bù; (3) điều tra pitch artifact AM + −12 ở
  biên −0,49 st; (4) kiểm chứng lại bằng test + trình duyệt thật.
- **Kết quả chung:** 4/4 lỗi tsc đã sửa, `npm run build` PASS lúc đo;
  telephone đo lại chính xác, có đề xuất bù kèm bằng chứng (CHƯA implement —
  parent quyết §14.2-192); pitch −12 tìm ra nguyên nhân thật (lượng tử hoá
  lược phổ, KHÔNG phải sai hệ số saw) — ứng viên sửa đã thử và BÁC BỎ bằng số
  đo, giữ nguyên hằng số.

## 1. Bốn lỗi tsc — ĐÃ SỬA HẾT

| # | Lỗi | Cách sửa |
|---|---|---|
| 1 | `audioEngine.ts(33,67)` TS5097 (import `./previewVoiceFx.ts`) | `apps/web/tsconfig.json`: thêm `"allowImportingTsExtensions": true` |
| 2 | `audioEngineVoiceFx.test.ts(10,42)` TS5097 (import `./audioEngine.ts`) | cùng flag trên — sửa cả 3 lỗi TS5097 một lần |
| 3 | `audioEngineVoiceFx.test.ts(24,10)` TS6133 (`approx` không dùng) | xoá hàm `approx` (chỉ có đúng 1 chỗ dùng là định nghĩa) |
| 4 | `previewVoiceFx.test.ts(21,8)` TS5097 (import `./previewVoiceFx.ts`) | cùng flag trên |

**Vì sao bật flag thay vì bỏ đuôi `.ts`:** import đuôi `.ts` là quy ước của
repo cho test chạy bằng `node --experimental-strip-types`
(`audioEngine44Z2.test.ts`, `audioEngine52I2.test.ts`, … đều import
`./audioEngine.ts`); bỏ đuôi sẽ làm Node ESM không resolve được module khi
chạy test trực tiếp. Flag hợp lệ vì tsconfig đã có `"noEmit": true`
(TS5096 chỉ cấm khi emit) — cùng cách `scripts/test-audioengine.sh` và
`test-asset-store.sh` đã dùng trong tsconfig kiểm tra riêng của chúng.
**Không đụng** `preview.tsx` / các file khác của P2/P3/P4; `audioEngine.ts`
không sửa (chỉ đọc lại để xác nhận import còn nguyên).

**Kiểm chứng:** `npx tsc --noEmit` (apps/web) → **0 lỗi**; `npm run build`
(`tsc && vite build`) → **PASS** (built in 20,22 s), chạy ~14:48Z 25/11.

**CAVEAT — lỗi tsc MỚI không phải của P1 (ghi để T10/parent khỏi nhầm):**
sau lần build PASS trên, luồng P4 sửa `src/lib/parityHarness192.ts`
(mtime 14:53Z, đang làm dở, chưa có cờ .done) và `reversePlayback.ts`
(P3) — `tsc --noEmit` chạy lại ~15:00Z báo **2 lỗi mới, đều trong
`parityHarness192.ts`**: TS6133
(`ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR` không dùng) và TS6192
(import declaration không dùng). Đây KHÔNG phải 4 lỗi của P1 (đã hết) và
không phải file của P1 nên P1 không sửa — parent/T10 kiểm lại lúc đóng sổ
sau khi P4 xong. `npx vite build` trực tiếp vẫn **PASS** (23,29 s), tức
lỗi mới chỉ là typecheck, không vỡ bundle.

## 2. Telephone — đo lại chính xác + đề xuất (parent quyết)

### 2.1 Số đo mới (Chromium 158.0.8127.18, OfflineAudioContext 48 kHz)

Render tham chiếu đo lại bằng FFmpeg 8.1.2
(`highpass=f=300,lowpass=f=3400`, astats RMS, sine 2 s) — khớp từng số với
đợt 191 ở 4 điểm cũ, bổ sung đường cong đầy đủ 9 điểm:

| Tần số | FFmpeg (render) | Chrome module | Chrome raw HP+LP | Chrome `getFrequencyResponse` |
|---|---|---|---|---|
| 100 Hz | 0,110 | 0,118 | 0,118 | 0,118 |
| 200 Hz | 0,406 | 0,537 | 0,537 | 0,537 |
| 300 Hz | 0,707 | 1,090 | 1,090 | 1,090 |
| 440 Hz | 0,906 | 1,223 | 1,223 | 1,223 |
| 700 Hz | 0,982 | 1,129 | 1,129 | 1,129 |
| 1000 Hz | 0,992 | 1,102 | 1,102 | 1,102 |
| 2000 Hz | 0,947 | 1,189 | 1,189 | 1,189 |
| 3400 Hz | 0,707 | 1,090 | 1,090 | 1,090 |
| 5000 Hz | 0,406 | 0,537 | 0,537 | 0,537 |

Ba phương pháp đo độc lập trùng nhau tới 4 chữ số thập phân (RMS tín hiệu
qua module = RMS qua HP+LP viết tay = đáp ứng tần số chính xác) → **wiring
đúng, số đợt 191 xác nhận**.

### 2.2 Nguyên nhân gốc (mới, đo bằng `getFrequencyResponse`)
BiquadFilter HP của Chrome (RBJ cookbook) có **gain > 1 gần fc**: HP 300 Hz
cho 1,21 ở 440 Hz và 1,08 ngay tại 300 Hz; LP 3400 Hz cho 1,17 ở 2000 Hz
và 1,08 tại 3400 Hz. Butterworth tương tự (analog, FFmpeg) đơn điệu ≤ 1,
đúng −3 dB (= 0,707) tại fc. Tức **RBJ biquad ≠ Butterworth analog** dưới
phép biến đổi song tuyến tính không pre-warp: đáp ứng Chrome có bướu cộng
hưởng rộng 300–3400 Hz, cao nhất +54% tại chính các điểm cắt. Đây là khác
biệt **hình dạng đáp ứng**, không phải lệch gain đều — nên không có cách
bù nào đưa mọi điểm về khớp.

### 2.3 Đã thử các cách bù (tính bằng `getFrequencyResponse`, chính xác)

- **Peaking EQ** sau LP (lưới fc 400–1000 Hz × gain −1…−3,5 dB × Q 0,4–1,0):
  tốt nhất (fc 1000, −3 dB, Q 0,4) vẫn sai tối đa **23%** — cắt 1000 Hz quá
  tay (0,78 so với 0,992) mà 5000 Hz vẫn thừa (0,50 so với 0,406). **Bác bỏ.**
- **Đổi Q** (lưới Q 0,3–1,0 cho cả HP và LP): Q càng nhỏ càng đỡ bướu
  nhưng không triệt được — tốt nhất Q = 0,3/0,3 + scalar vẫn sai tối đa
  **16%**, trong khi Q rời khỏi 1/√2 thì mất tính "Butterworth" của tham số.
  **Không đáng.**
- **Dời fc** (HP 300→340–470, LP 3400→2100–3000): sai thô tốt nhất 34%
  (so với 54%) nhưng sau scalar lại tệ hơn (24%), và dời fc là sai tham số
  render. **Bác bỏ.**
- **Scalar trên đường wet** (nhân gain telWet): hiệu quả nhất trong các
  cách 1 núm. Hai điểm neo:
  - g = 0,76 (tối ưu minimax trên 9 điểm): sai tối đa **18,5%**
    (100 Hz −18%, 440 Hz +3%, 1000 Hz −16%, 5000 Hz +1%; 300/3400 Hz +17%).
  - g = 0,82 (tối ưu trên 4 điểm chính): sai tối đa 4 điểm **12%**
    (100 Hz −12%, 440 Hz +11%, 1000 Hz −9%, 5000 Hz +9%), nhưng 300/3400
    Hz vẫn +26%.

### 2.4 Đề xuất (parent quyết ở §14.2-192)

**Khuyến nghị: BÙ scalar g = 0,76** (một hằng số đặt tên, nhân vào gain
telWet; giữ nguyên Q = 1/√2 và fc 300/3400 đúng render). Sai số tệ nhất
trên toàn đường cong giảm 54% → 18,5% (+3,8 dB → +1,5 dB); cái giá là
100 Hz xuống −18% (0,090 so với 0,110 — vẫn cắt 91%, giữ nguyên chất
"điện thoại") và 1000 Hz −16% (−1,5 dB). Phương án chấp nhận nguyên trạng
cũng khả thi (hiệu ứng vẫn nghe rõ là điện thoại), nhưng sai tới +54% ở
điểm cắt là lệch lớn so với render. **CHƯA implement** — chờ quyết parent;
nếu duyệt thì chỉ là sửa 1 dòng (telWet gain × 0,76).

## 3. Pitch −12 — nguyên nhân thật, KHÔNG sửa bằng hằng số

### 3.1 Đo chính xác lại (FFT zero-pad 2^18, bin 0,183 Hz, nội suy parabol
### trên log-mag; cửa sổ 1,0–3,5 s; 3 tần nền × 8 n)

| f0 | n | Mục tiêu | Tần trội đo | Sai số |
|---|---|---|---|---|
| 440 | −12 | 220,0 | 215,0 | **−0,40 st** (đợt 191 đo thô: −0,49) |
| 440 | −7 | 293,7 | 290,3 | −0,20 st |
| 440 | −5 | 329,6 | 327,1 | −0,13 st |
| 440 | −1 | 415,3 | 414,7 | −0,02 st |
| 440 | +1 | 466,2 | 466,8 | +0,02 st |
| 440 | +5 | 587,3 | 590,7 | +0,10 st |
| 440 | +7 | 659,3 | 664,2 | +0,13 st |
| 440 | +12 | 880,0 | 890,0 | +0,20 st |
| 880 | −12 | 440,0 | 430,0 | −0,40 st |
| 880 | +12 | 1760,0 | 1780,0 | +0,20 st |
| 220 | −12 | 110,0 | 120,0 | **+1,51 st** (xem §3.3) |
| 220 | −7 | 146,8 | 153,5 | +0,77 st |
| 220 | +12 | 440,0 | 420,0 | −0,81 st |

(Sai số ở 880 Hz giống hệt 440 Hz theo semitone — xem §3.2 vì sao.)

### 3.2 Nguyên nhân gốc: lượng tử hoá lược phổ (comb quantization)

Phổ đầu ra của shifter 2-delay là một **lược (comb)**: các răng cách nhau
đúng f_LFO = |r−1|/W (W = 0,04 s), đặt tại f0 + k·f_LFO. Tần trội đo được
là **răng gần mục tiêu nhất**, không phải tần số dịch liên tục. Mô hình
này dự đoán đúng tần trội ở mọi điểm đo, ví dụ: n = −12, f0 = 440 →
f_LFO = 12,5 Hz, các răng 440 + k·12,5; răng gần 220 nhất là 215
(k = −18) ✓; n = −1, f0 = 440 → f_LFO = 1,40 Hz, răng gần 415,3 nhất là
414,75 ✓. Sai số tối đa bằng nửa khoảng răng (≈ ±0,49 st ở −12/440 Hz)
— đúng biên −0,40 st đo được. Sai số giống hệt ở 440 và 880 Hz vì khi f0
tăng gấp đôi thì chỉ số răng k cũng tăng gấp đôi trong khi khoảng răng
không đổi. **Không phải lỗi độ dốc saw.**

### 3.3 Ứng viên sửa đã thử và BÁC BỎ (bằng số đo)

Từ 8 điểm 440/880 Hz, một mô hình r_eff = 1 + 1,0228·(r−1) khớp rất đẹp —
tưởng là độ dốc saw thừa 2,28%, ứng viên `SAW_GAIN_COMP = 50/43/1,0228
≈ 1,137` (thay cho 50/43 ≈ 1,163). Đã build bundle ứng viên và đo lại
đủ 24 điểm: **tần trội KHÔNG ĐỔI ở f0 = 220 và 440 Hz** (215 vẫn là 215),
vì vị trí răng lược chỉ phụ thuộc f_LFO và f0, không phụ thuộc gain saw
(chỉ biên độ răng đổi); ở f0 = 880 Hz, −12 nhảy sang răng bên kia
(430 → 455, **+0,58 st — tệ hơn**). Kết luận: mô hình độ dốc là trùng hợp
của mẫu lượng tử hoá. **`SAW_GAIN_COMP giữ nguyên 50/43`** — không sửa
gì trong `previewVoiceFx.ts` đợt này.

### 3.4 Artifact AM ở tần nền thấp (giới hạn còn lại)

Độ sâu AM (RMS khối 5 ms, cửa sổ đo) dao động mạnh theo f0: ở 440 Hz chỉ
0,10–0,30; ở 220 Hz lên 0,51–0,67; ở 880 Hz 0,10–0,72. Khi pha giao thoa
giữa hai đường delay rơi vào điểm triệt, **răng trung tâm (gần mục tiêu
nhất) bị triệt** và peak-picking đọc răng bên cạnh: f0 = 220, n = −12
đo 120 Hz thay vì răng gần nhất 107,5 Hz → +1,51 st. Đây là giới hạn nội
tại của thiết kế granular 2-delay (LIMITS 191 §3.4 đã ghi) — AM không chỉnh
được bằng tham số: đổi gain saw chỉ đổi pha giao thoa một cách hỗn loạn
(đo ứng viên: AM ở 440 Hz tăng 0,15 → 0,45 ở −12 trong khi ở 220 Hz lại
giảm), không có hướng chỉnh đơn điệu. Trên tiếng nói/nhạc thật (nhiều
thành phần tần số, hài bổ trợ nhau) hiện tượng triệt răng đơn lẻ mờ đi
nhiều so với sine thuần tần thấp — trường hợp xấu nhất là sine trầm đơn.

**Hướng sau (chưa thử, đề xuất cho đợt sau, không làm đợt này):**
W = 0,08 s làm khoảng răng lược nhỏ một nửa (sai số lượng tử hoá giảm
một nửa) với giá trễ trung bình ~40 ms và mẫu AM thay đổi khó đoán — cần
đo lại toàn bộ nếu thử. Giải pháp triệt để vẫn là PSOLA/AudioWorklet +
FFT (ngoài phạm vi).

## 4. Kiểm chứng sau sửa (Chromium 158.0.8127.18, FFmpeg 8.1.2)

- `npx tsc --noEmit` (apps/web) → **0 lỗi** (lúc ~14:47Z, trước khi P4
  sửa file — xem caveat §1); `npm run build` → **PASS**.
- `node --experimental-strip-types apps/web/src/lib/previewVoiceFx.test.ts`
  → **26 pass, 0 fail**.
- `node --experimental-strip-types apps/web/src/lib/audioEngineVoiceFx.test.ts`
  → **8 pass, 0 fail**.
- `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- `node packages/video-spec/scripts/check-video-spec-mirror.mjs`
  → **427 pass, 6 known, 0 fail**.
- Trình duyệt thật (headless Chromium 158, CDP, OfflineAudioContext
  48 kHz, bundle build từ source hiện tại): 4 hiệu ứng đều phát tiếng qua
  module chain — RMS cửa sổ ổn định 1–2 s (sine 440 Hz, amp 0,5):
  pitch +7: **0,319**; robot: **0,354**; telephone: **0,432**; echo:
  **0,414** (dry = 0,354). Dist sau `npm run build` load thật: app mount
  (`#root` 1 child, giao diện VCut Studio hiện đủ), **0 console
  error/warning**.
- Hạ tầng đo đợt này ở `/tmp/voicefx192/` (measure.js, pitch2.js,
  qsweep.js, fcsweep.js, cdp.mjs, *.json) — file tạm, không stage.

**Chưa kiểm chứng:** nghe bằng tai người trên clip voice thật (chỉ đo
sine/impulse); Firefox/Safari (hằng số 50/43 đo trên Chrome 158).

## 5. File đổi (stage trong paths-loop)

- `apps/web/tsconfig.json` — thêm 1 dòng `allowImportingTsExtensions`
  (sửa 3 lỗi TS5097).
- `apps/web/src/lib/audioEngineVoiceFx.test.ts` — xoá hàm `approx` thừa
  (sửa TS6133).
- `docs/PHASE9_ROUND192_P1_VOICEFX_TSC_LIMITS.md` — file này.

**KHÔNG đổi:** `apps/web/src/lib/previewVoiceFx.ts` (ứng viên
SAW_GAIN_COMP bị bác bỏ bằng số đo), `apps/web/src/lib/audioEngine.ts`
(chỉ đọc lại), telephone (chờ quyết parent §14.2-192), `preview.tsx`,
`tsconfig.node.json`, MEMORY.md, build-loop-log.md, PHASE9_GAP_ANALYSIS.md.

## 6. Chưa làm / nợ chuyển đợt sau

- Telephone: chờ parent quyết chấp nhận hay bù scalar g = 0,76 (§2.4).
- Pitch: AM + triệt răng ở sine trầm (§3.4); thử nghiệm W = 0,08 s hoặc
  PSOLA/AudioWorklet nếu parent muốn triệt để.
- Lỗi tsc mới của P4 trong `parityHarness192.ts` (§1 caveat) — P4 tự sửa,
  T10 kiểm lại lúc đóng sổ.
- Robot excursion 0,0027 vẫn giữ theo suy luận đợt 191 (chưa đo lại bằng
  peak-finding); chưa test nghe tai người / Firefox / Safari.
