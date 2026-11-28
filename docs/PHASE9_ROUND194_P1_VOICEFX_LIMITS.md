# LIMITS — Đợt 194 P1: theo dõi N2 + trễ pitch/lip-sync + nghe kiểm khách quan
(Editing Core — preview/render parity, đợt thứ 4 theo hướng mới)

- **Luồng:** P1 đợt 194 (Phase 9 VCut). **Ngày:** 26/11/2026.
- **Nhiệm vụ (brief):** (1) đo lại bảng pitch 24 điểm, xác nhận W = 0,08 giữ;
  (2) đo trễ pitch 40 ms lên lip-sync trên clip thật; (3) nghe kiểm khách
  quan (phổ/RMS/AM) trên clip voice thật qua telephone + pitch;
  (4) kiểm voicefx trên Firefox/Safari nếu có.
- **Kết quả chung:** KHÔNG đổi code sản phẩm (W = 0,08 GIỮ, không PSOLA —
  đúng quyết parent (a1)-193). N2 **không hồi quy**: bảng 24 điểm khớp y
  hệt đợt 193 từng số; AM@440 vẫn 0,37–0,72 (vượt bar 0,35 — trade-off đã
  quyết, N2 vẫn CHƯA ĐẠT theo bar đứng). Trễ pitch đo được: onset
  +20–30 ms, năng lượng (xcorr) +24–47 ms theo n; **không đáng kể theo
  ITU-R BT.1359 (ngưỡng phát hiện tiếng trễ −125 ms) nhưng chạm ngưỡng
  ATSC IS-191 (−45 ms) ở +12 và vượt ngưỡng phim ±22 ms**; preview hiện
  KHÔNG bù trễ. Voice thật: preview khớp render trong ~2 điểm % tách
  dải, RMS trong 1,2 dB tệ nhất; telephone ĐẠT bar (max |Δ| 1,78 dB).
  Firefox 159 khớp Chrome từng số đo; WebKit/Safari **không kiểm được**
  trên VM (MiniBrowser thiếu lib hệ thống — xem §4.2). Script render mẫu
  mới cho user nghe kiểm bằng tai thật (nợ §5 đợt 193 nay có công cụ).

## 1. N2: bảng pitch 24 điểm đo lại — KHÔNG HỒI QUY (khớp y hệt đợt 193)

Phương pháp đúng P1-193 §2.2 (render 4 s, cửa sổ [1,0, 3,5)s, FFT
zero-pad 2^18 + nội suy parabol log-mag; AM = RMS khối 5 ms).
Hạ tầng đo đợt 193 trong /tmp đã mất sau reboot — dựng lại từ đầu
(`/tmp/voicefx194/`, bundle esbuild từ `previewVoiceFx.ts` thật;
JSON đầy đủ ở `hidden_files/round194-p1/chrome-*-02-54-38-*.json`).

| f0 | n | Trội đo | Sai st | AM | f0 | n | Trội đo | Sai st | AM |
|---|---|---|---|---|---|---|---|---|---|
| 220 | −12 | 107,5 | −0,40 | 0,16 | 440 | −12 | 215,0 | −0,40 | 0,72 |
| 220 | −7 | 145,2 | −0,20 | 0,39 | 440 | −7 | 290,3 | −0,20 | 0,61 |
| 220 | −5 | 163,6 | −0,13 | 0,26 | 440 | −5 | 327,1 | −0,13 | 0,49 |
| 220 | −1 | 207,4 | −0,02 | 0,27 | 440 | −1 | 414,7 | −0,02 | 0,71 |
| 220 | +1 | 233,4 | +0,02 | 0,28 | 440 | +1 | 466,8 | +0,02 | 0,70 |
| 220 | +5 | 295,3 | +0,10 | 0,17 | 440 | +5 | 590,7 | +0,10 | 0,44 |
| 220 | +7 | 332,1 | +0,13 | 0,16 | 440 | +7 | 664,2 | +0,13 | 0,42 |
| 220 | +12 | 445,0 | +0,20 | 0,17 | 440 | +12 | 890,0 | +0,20 | 0,37 |
| 880 | −12 | 442,5 | +0,10 | 0,23 | 880 | +12 | 1755,0 | −0,05 | 0,17 |
| 880 | −7 | 589,0 | +0,05 | 0,25 | 880 | +7 | 1316,0 | −0,03 | 0,17 |
| 880 | −5 | 660,5 | +0,03 | 0,19 | 880 | +5 | 1173,0 | −0,02 | 0,23 |
| 880 | −1 | 830,9 | +0,01 | 0,82 | 880 | +1 | 932,0 | −0,01 | 0,81 |

So với P1-193 §2.2: **Δsai-st = 0,00 và ΔAM = 0,00 ở cả 24/24 điểm**
(khớp y hệt từng số, không làm tròn che lệch). Sai tệ nhất **0,40 st**
(24/24 ≤ 0,40 st, trong tiêu chí ≤0,5 st). AM@440 **0,37–0,72** —
vẫn vượt bar AM ≤ 0,35 (trade-off đã quyết đợt 193: đổi AM@440 lấy
sine trầm; **KHÔNG sửa W, KHÔNG làm PSOLA**). AM tệ nhất 0,82 @880/±1
y hệt baseline (LFO 0,70 Hz — không phải hồi quy). Hằng số đọc từ
code thật: `PITCH_WINDOW_S = 0,08`, `TELEPHONE_WET_GAIN_COMP = 0,76`.

Telephone 9 điểm đo lại: khớp y hệt P1-193 §1.2 (max |Δ| **1,78 dB**
@100 Hz; 440 Hz +0,22 dB) — **ĐẠT bar ≤2 dB**, không hồi quy.

## 2. Trễ pitch vs lip-sync — ĐO BẰNG SỐ, KẾT LUẬN CÓ NGƯỠNG

### 2.1 Burst 440 Hz (onset t = 1000 ms, 200 ms, ramp 5 ms), Chrome 158

Onset = khối RMS 5 ms đầu vượt −34 dBFS (F-194-P1-2: onset theo mẫu
tức thời cho null cả ở bypass vì sine qua zero — đã sửa sang RMS
khối, xem §4.1). Xcorr = lag tương quan chéo trên [1,0, 1,2)s.

| Preset | Onset Δ | Xcorr lag | Preset | Onset Δ | Xcorr lag |
|---|---|---|---|---|---|
| bypass | 0 ms | 0 ms | telephone | 0 ms | −0,3 ms |
| pitch +12 | +25 ms | **+45,0 ms** | robot | 0 ms | +0,5 ms |
| pitch −12 | +30 ms | **+38,6 ms** | echo | 0 ms | 0 ms |
| pitch +1 | +20 ms | +23,5 ms | pitch+12+tel | +25 ms | **+47,1 ms** |

Đo lặp 2 lần **khớp y hệt** từng số. Firefox cho cùng số (xem §4.1).
Lý thuyết W/2 = 40 ms: xcorr ±12 cho 39–45 ms (đúng); +1 chỉ 23,5 ms
vì LFO 0,74 Hz (chu kỳ 1,35 s >> burst 200 ms) nên burst chỉ lấy mẫu
một pha trễ — trễ tức thời dao động **0–80 ms theo pha LFO**, trung
bình 40 ms. Onset (+20–30 ms) nhỏ hơn xcorr vì transient lọt qua lúc
trễ tức thời đang thấp; cái người xem cảm nhận là độ lệch năng lượng
bền (xcorr), không phải transient đầu.

### 2.2 Clip voice thật (ref.wav, xem §3): onset Δ

Telephone 0 ms; pitch +7 **+20 ms**; pitch −7 **+40 ms**;
tel+pitch+7 +20 ms; robot 0 ms (khớp burst +20–30 ms). Render
FFmpeg (rubberband) cho onset Δ −25/−5/−20 ms — tức phương pháp onset
trên voice có nhiễu ±25 ms (khối 5 ms + nội dung); **không dùng onset
voice làm verdict**, chỉ làm đối chứng — verdict lấy burst xcorr §2.1.

### 2.3 Kết luận theo ngưỡng (ITU-R BT.1359-1, 1998)

Tiếng trễ so với hình (audio late): phát hiện +45/−125 ms, chấp nhận
+90/−185 ms (dấu − = tiếng trễ). ATSC IS-191: +15/−45 ms. EBU R37:
+40/−60 ms. Phim: ±22 ms (nửa khung 24 fps).

- **BT.1359: KHÔNG đáng kể** — 47 ms tối đa còn cách ngưỡng phát hiện
  −125 ms gần 3 lần; cách ngưỡng chấp nhận −185 ms gần 4 lần.
- **ATSC IS-191: CHẠM ngưỡng** — +47,1 ms (pitch+12+tel) vượt −45 ms
  2,1 ms; +45,0 ms (+12) đúng ngưỡng. Ai làm việc theo chuẩn ATSC thì
  đây là lỗi cần xử lý, không phải "ổn".
- **Phim ±22 ms: VƯỢT** — gấp đôi ngưỡng nửa khung.
- **EBU R37: trong** (−60 ms).
- **Chưa có bù trễ nào trong preview** (grep `audioEngine.ts`,
  `preview.tsx`: không có compensation cho `PITCH_WINDOW_S`).
  Lưu ý: trễ dao động 0–80 ms theo pha LFO nên **bù một hằng số 40 ms
  chỉ sửa trung bình, còn dư ±40 ms dao động** — bù cố định không triệt
  được; triệt để cần shifter trễ hằng (PSOLA, nợ). Quyết bù hay không
  thuộc parent (xem §7).

## 3. Nghe kiểm khách quan trên clip voice thật (không có tai người)

Clip: `~/workspace/d2-test/ref.wav` — giọng nói thật, 8,32 s, 48 kHz
mono, RMS −18,93 dB, peak 0,785, crest 6,94, centroid 992 Hz,
LTAS-centroid 1905 Hz, f0-trung-vị thô 317 Hz, onset 115 ms
(nguồn ngoài repo — chỉ dùng làm đầu vào đo, KHÔNG stage).
Render tham chiếu: FFmpeg 8.1.2 (rubberband pitch; highpass 300 /
lowpass 3400 telephone; vibrato robot) — cùng hàm metrics với preview
(`hidden_files/round194-p1/ffmpeg-render-voice.json`).

| Preset | RMS prev/render | Centroid* prev/render | LTAS-cent prev/render | Mid-band prev/render | f0-med† prev/render |
|---|---|---|---|---|---|
| bypass | −18,93/−18,93 | 992/992 | 1905/1905 | 79,9/79,9% | 317/317 |
| telephone | −20,70/−20,00 | 751/766 (−2%) | 1378/1359 (+1%) | 90,0/93,0% | 341/362 |
| pitch +7 | −20,20/−20,60 | 1286/1450 (−11%‡) | 2979/2975 (0%) | 94,5/96,4% | 420/455 |
| pitch −7 | −20,08/−21,31 | 612/586 (+4%) | 1465/1213 (+21%§) | 65,0/66,5% | 208/228 |
| tel+pitch+7 | −21,50/−21,16 | 885/913 (−3%) | 1689/1649 (+2%) | 97,6/98,8% | 412/474 |
| robot | −18,95/−18,93 | 974/979 (−1%) | 1758/1753 (0%) | 79,1/79,3% | 303/287 |

\* Centroid có gate (chỉ frame RMS > −50 dBFS). † f0-med = trung vị đỉnh
phổ 80–1000 Hz mỗi 100 ms — tracker THÔ (IQR 192–439 Hz), chỉ tham
khảo, sai ±10% là nhiễu tracker. ‡ −11% ở pitch+7 là **lệch gate,
không phải lệch phổ thật**: LTAS không gate cho 0% (2979/2975).
§ +21% LTAS ở pitch−7 ngược lại: LTAS trung bình |X| nhạy với frame
lặng/nhiễu sau khi hạ cao độ; centroid có gate (+4%) và tách dải
(Δ1,5 điểm %) mới là số chính. **Kết luận: preview khớp render
trong ~2 điểm % tách dải và ≤1,2 dB RMS** (tệ nhất pitch−7: preview
to hơn render 1,23 dB — chênh mức thật, ghi nhận, chưa sửa).

AM trên voice: AM-voiced (chỉ khối > −40 dBFS) = **0,94–0,95 ở MỌI
preset kể cả bypass/input** — động tự nhiên của lời nói lấn át AM
của shifter; metric này **không phân biệt được artifact pitch trên
voice thật** (ghi rõ, không dùng làm verdict — AM sine §1 mới là
thước đo artifact). Crest: telephone 8,00 (render 8,06); pitch+7
7,18 (7,77); robot 6,95 (6,88) — khớp.

**Clip mẫu cho user nghe:** script mới
`apps/web/scripts/voicefx194-render-sample.mjs` (xem §6) — chạy với
ref.wav tel+pitch+7 cho đúng số đo page (rms −21,5 dB, centroid 885
Hz, mid 97,6%); chạy lại lần 2: metrics y hệt, mẫu 16-bit lệch tối
đa **1 LSB** (0,000031). File wav mẫu ở scratch
`hidden_files/round194-p1/sample-tel-pitch7-script.wav` (KHÔNG stage
binary — user tự chạy script để gen clip nghe).

## 4. Firefox / Safari

### 4.1 Firefox 159.0 — KHỚP CHROME

Chạy bằng playwright-core 1.55.0 (cài tạm vào /tmp, không vào repo)
với binary cache sẵn. Pitch24: max |ΔerrSt| **0,01 st**,
max |ΔAM| 0,06 (440/−12: AM 0,78 vs Chrome 0,72 — lệch duy nhất
>0,05); sai tệ nhất 0,40 st như Chrome. Telephone9: **y hệt Chrome**
từng số (max |Δ| 1,78 dB). Latency onset + xcorr: **y hệt Chrome**
(bypass 0; +12 onset +25/xcorr +45; −12 +30/+38,6; +1 +20/+23,5;
tel −0,3; robot +0,5; echo 0; +12+tel +25/+47,2 — Δ0,1 ms).
VoiceClip: mọi metric khớp Chrome trong 0,01 dB / 2 Hz / 0,1 điểm %
(trừ pitch−7 LTAS 1468 vs 1465).

**F-194-P1-1 — Firefox detach view getChannelData (lỗi đo của P1,
đã sửa + đo lại).** Lần chạy Firefox đầu cho xcorr = **−10 ms ở MỌI
preset** (đúng biên dưới của cửa sổ tìm) — không phải do chain.
Nguyên nhân: Firefox detach Float32Array trả về bởi
`getChannelData()` khi AudioBuffer đó được gán cho BufferSource ở
OfflineAudioContext khác rồi render (kiểm chứng độc lập: view cũ
length → 0, `getChannelData()` mới vẫn đủ dữ liệu; Chrome không
detach). Trong `latency()`, `ref` lấy trước các lần render nên thành
mảng rỗng → tương quan = NaN → lag rơi về biên dưới. Đã sửa: copy
sang `Float32Array.from(...)` trước khi render → xcorr Firefox khớp
Chrome (xem trên). Pitch24/telephone9/voiceClip không bị vì không giữ
view qua lần render. **Sản phẩm không bị:** app thật tạo buffer và
source trong cùng context, không gán chéo context.

### 4.2 WebKit / Safari — KHÔNG KIỂM ĐƯỢC (ghi rõ, không kết luận khống)

Playwright webkit-2388 (MiniBrowser) không khởi động được trên VM:
`libwebkitgtk-6.0.so.4: cannot open shared object file` (exit 127).
Safari thật không có trên Linux. Không kết luận gì về voicefx trên
Safari/WebKit — hằng số SAW_GAIN_COMP 50/43 + đáp ứng RBJ vẫn chỉ
được đo trên Chrome 158 + Firefox 159. Cần máy macOS hoặc cài
libwebkitgtk-6.0 để kiểm (ngoài phạm vi đợt này).

## 5. Kiểm chứng sau đo (không đổi code sản phẩm nên không có sửa để vỡ)

- `npx tsc --noEmit` (apps/web) → **0 lỗi**.
- `previewVoiceFx.test.ts` → **27 pass, 0 fail**;
  `audioEngineVoiceFx.test.ts` → **8 pass, 0 fail**;
  `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- `node --check` script render mẫu OK; chạy 2 lần: metrics y hệt,
  mẫu lệch tối đa 1 LSB (xem §3).
- Đo Chrome lặp 2 lần: pitch24/telephone9/latency/voiceClip **khớp y
  hệt** từng số (deterministic). T4 đợt 194 chưa attempt trong cửa sổ
  đo nặng (poll-t4.log #1–#22 tới 03:11:45Z đều lock=khong); các lần
  đo nặng đều là OfflineAudioContext ngắn (02:54–03:11Z), không chồng
  pha (b) với T4. (Lock co từ 03:12:30Z là của T01-round194, không
  phải attempt T4 — sau khi đo nặng đã xong.)
- Hạ tầng đo: `/tmp/voicefx194/` (measure.mjs dùng chung page+node,
  page-measure.mjs, cdp-driver.mjs, pw-driver.mjs) + JSON kết quả ở
  `hidden_files/round194-p1/` (chrome-*.json ×3, firefox-*.json ×3,
  ffmpeg-render-voice.json, preview-voice-*.wav 6 file, sample wav).
  /tmp sẽ mất khi reboot — JSON trong hidden_files là bản lưu bền.

## 6. File đổi (stage trong paths-loop)

- `apps/web/scripts/voicefx194-render-sample.mjs` (mới — render 1 wav
  qua chain preview thật bằng headless Chrome, ghi wav 48k mono;
  `--in/--out/--preset/--chrome/--sr`; thoát 2 khi thiếu input/chrome/
  preset sai; đã sửa 1 lỗi đường dẫn repo trong lúc verify — REPO cần
  3 cấp `..` từ `apps/web/scripts`).
- `docs/PHASE9_ROUND194_P1_VOICEFX_LIMITS.md` — file này.

**KHÔNG đổi:** `apps/web/src/lib/previewVoiceFx.ts` (W = 0,08 giữ),
test voicefx, `audioEngine.ts`, `preview.tsx`, GAP, aggregate (việc
của T10), MEMORY.md, build-loop-log.md. **Không chạm file chung nào
— không có xung đột để T10 phải kiểm.**

## 7. Chưa làm / nợ chuyển đợt sau

- N2 vẫn CHƯA ĐẠT theo bar đứng (AM@440 0,37–0,72 > 0,35) — trade-off
  đã quyết đợt 193, giữ làm nợ mở; P4-194 theo dõi. Triệt để vẫn là
  PSOLA/AudioWorklet + FFT (ngoài phạm vi đợt này, theo quyết parent).
- Trễ pitch: chưa có quyết parent về việc có bù 40 ms cố định hay
  không (và bù cố định chỉ sửa trung bình vì trễ dao động 0–80 ms).
- Nghe bằng tai người thật: chưa có (script §6 đã sẵn — user chạy để
  nghe clip mẫu; P1 không tự kết luận "nghe hay/dở").
- WebKit/Safari: chưa kiểm được (xem §4.2).
- Chênh mức pitch−7 preview to hơn render 1,23 dB (xem §3) — chưa chẩn
  đoán nguyên nhân (có thể do delay-line interpolation), nợ nhỏ.
- F-194-P1-2 (phương pháp): onset theo mẫu tức thời KHÔNG dùng được
  cho tín hiệu tonal (sine qua zero 2 lần/chu kỳ → hold 5 ms không
  bao giờ đạt → onset null cả ở bypass); đã sửa sang RMS khối 5 ms
  trong đợt này — các đo onset đợt sau dùng phương pháp khối.
