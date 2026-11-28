# LIMITS — Đợt 193 P1: telephone bù g = 0,76 + pitch W = 0,08 s
(Editing Core — preview/render parity, đợt thứ 3 theo hướng mới)

- **Luồng:** P1 đợt 193 (Phase 9 VCut). **Ngày:** 25–26/11/2026.
- **Nhiệm vụ (brief):** (1) implement bù scalar telephone g = 0,76 ĐÃ ĐƯỢC
  PARENT DUYỆT (§14.2-192); (2) pitch AM + triệt răng ở sine trầm — thử
  W = 0,08 s hoặc PSOLA (§13-192).
- **Kết quả chung:** cả hai khoản đều implement + đo thật trước/sau bằng số.
  Telephone sai tối đa **54,2% → 18,5%**, max |Δ| **3,76 dB → 1,78 dB** —
  **ĐẠT bar ≤2 dB** (xem §1.3: trái kỳ vọng trong brief — brief dùng số
  2,60 dB đo TRƯỚC bù; sau bù 440 Hz chỉ còn +0,22 dB; P4-193 kiểm lại N1).
  Pitch W = 0,08 s: sai lượng tử hoá tệ nhất **1,51 → 0,40 st** (24/24 điểm
  ≤ 0,40 st); sine trầm 220 Hz triệt răng ĐÃ SỬA (120 → 107,5 Hz) và AM
  0,51–0,67 → 0,16–0,39. **Trade-off trung thực:** AM ở 440 Hz tệ hơn
  (0,10–0,30 → 0,37–0,72) — cơ chế triệt răng xen kẽ, xem §2.4. W = 0,06 đã
  thử và BÁC bằng số đo (§2.5). `SAW_GAIN_COMP` giữ nguyên 50/43.

## 1. Telephone — bù g = 0,76 (parent duyệt §14.2-192)

### 1.1 Thay đổi code (1 hằng số đặt tên + 1 dòng)

`apps/web/src/lib/previewVoiceFx.ts`:

- Thêm `TELEPHONE_WET_GAIN_COMP = 0.76` (comment ghi nguồn: tối ưu minimax
  trên 9 điểm đợt 192; parent duyệt §14.2-192; bar ≤2 dB vẫn đứng).
- `setParams`: `telWet.gain` khi bật = `TELEPHONE_WET_GAIN_COMP` (trước: 1).
- Giữ nguyên Q = 1/√2 và fc 300/3400 đúng render; không đổi gì khác trong
  chain. Test khóa hằng số mới (`W = 0,08 s + telWet gain comp 0,76`).

### 1.2 Số đo sau bù (Chromium 158.0.8127.18, OfflineAudioContext 48 kHz)

Render tham chiếu FFmpeg 8.1.2 đo lại đợt này
(`highpass=f=300,lowpass=f=3400`, tỉ số RMS dB) — khớp từng số đợt 192
(0,110/0,406/0,707/0,906/0,982/0,992/0,947/0,707/0,406). Hai phương pháp đo
Chrome độc lập (`getFrequencyResponse` trên node thật + render RMS sine qua
chain) trùng nhau tới 4 chữ số thập phân, cả trước và sau bù — wiring đúng.

| Tần số | FFmpeg (render) | Chrome sau bù | Sai % | Sai dB |
|---|---|---|---|---|
| 100 Hz | 0,1102 | 0,0898 | −18,5% | −1,78 |
| 200 Hz | 0,4057 | 0,4085 | +0,7% | +0,06 |
| 300 Hz | 0,7065 | 0,8280 | +17,2% | +1,38 |
| 440 Hz | 0,9061 | 0,9293 | +2,6% | +0,22 |
| 700 Hz | 0,9823 | 0,8577 | −12,7% | −1,18 |
| 1000 Hz | 0,9921 | 0,8373 | −15,6% | −1,47 |
| 2000 Hz | 0,9465 | 0,9039 | −4,5% | −0,40 |
| 3400 Hz | 0,7067 | 0,8280 | +17,2% | +1,38 |
| 5000 Hz | 0,4058 | 0,4084 | +0,6% | +0,06 |

Trước bù (đo baseline đợt này, khớp từng số đợt 192): sai tối đa **54,2%**
(300/3400 Hz), max |Δ| **3,76 dB** (300/3400 Hz; 2,60 dB @440 Hz).
Sau bù: sai tối đa **18,5%** (@100 Hz — đúng dự đoán minimax đợt 192),
max |Δ| **1,78 dB** (@100 Hz). Mọi điểm đều trong ±1,8 dB.

### 1.3 ĐẠT bar ≤2 dB — đính chính kỳ vọng trong brief (quan trọng)

Brief đợt 193 ghi "hiện max |Δ| 2,60 dB @440 Hz nên telephone CHƯA đạt bar
sau bù". **Số 2,60 dB đó là đo TRƯỚC bù** (P4-192 đo chain chưa có bù, vì
P1-192 chưa implement — 20·log10(1,223/0,906) = +2,60 dB @440 Hz).
Sau bù, 440 Hz chỉ còn **+0,22 dB** và điểm tệ nhất toàn đường cong là
**−1,78 dB @100 Hz < 2 dB**. Theo đúng định nghĩa bar của P4 (max |Δ| trên
các điểm đo ≤ 2 dB), **telephone ĐẠT bar sau bù**. Bản thân quyết
§14.2-192 cũng chỉ ghi "chưa đạt bar" dựa trên con số trước bù — parent
không có số sau bù lúc đó. P1 không tự tuyên bố vượt qua kiểm chứng độc
lập: **P4-193 kiểm lại N1 bằng harness của họ**; nếu N1 của P4 cũng ≤2 dB
thì telephone chính thức ĐẠT, nếu không thì số đo đợt này sai ở đâu đó và
P1 nhận lại. Hạ tầng đo đợt này ở `/tmp/voicefx193/` (page.html, cdp.mjs,
spec.mjs, baseline.json, after.json, after2.json) — file tạm, không stage;
bundle đo bằng esbuild từ đúng source đã sửa, Chrome 158 thật.

## 2. Pitch — W = 0,08 s (thử nghiệm theo §13-192)

### 2.1 Thay đổi code

`PITCH_WINDOW_S`: 0,04 → **0,08** (`previewVoiceFx.ts`, comment ghi lý do +
giá trễ). Không đổi gì khác: `createDelay(0,1)` vẫn đủ (delay cần tối đa
W/2 + |sawGain| = 0,04 + 0,04×50/43 ≈ 0,0865 < 0,1); `SAW_GAIN_COMP` giữ
nguyên 50/43 (đợt 192 đã bác bỏ sửa hệ số này bằng số đo); LFO và sawGain
tự tính lại từ hằng số (`f_LFO = |r−1|/W`: −12 còn 6,25 Hz, +12 còn
12,5 Hz). Test cập nhật theo hằng số mới (LFO +12: 25 → 12,5 Hz;
−12: 12,5 → 6,25 Hz; +1: ≈1,49 → ≈0,74 Hz) + test khóa W = 0,08.

### 2.2 Số đo trước/sau (FFT zero-pad 2^18, bin 0,183 Hz, nội suy parabol
### trên log-mag; cửa sổ 1,0–3,5 s; AM = (max−min)/(max+min) của RMS khối 5 ms)

Baseline W = 0,04 đo lại đợt này KHỚP TỪNG SỐ đợt 192 (cả tần trội lẫn AM)
— harness đo đã xác minh. Sau W = 0,08:

| f0 | n | Mục tiêu | Trội trước | Trội sau | Sai st trước → sau | AM trước → sau |
|---|---|---|---|---|---|---|
| 220 | −12 | 110,0 | 120,0 | **107,5** | +1,51 → **−0,40** | 0,51 → **0,16** |
| 220 | −7 | 146,8 | 153,5 | 145,2 | +0,77 → −0,20 | 0,57 → 0,39 |
| 220 | −5 | 164,8 | 169,8 | 163,6 | +0,52 → −0,13 | 0,60 → 0,26 |
| 220 | −1 | 207,7 | 208,8 | 207,4 | +0,09 → −0,02 | 0,62 → 0,27 |
| 220 | +1 | 233,1 | 231,9 | 233,4 | −0,09 → +0,02 | 0,67 → 0,28 |
| 220 | +5 | 293,7 | 287,0 | 295,3 | −0,40 → +0,10 | 0,64 → 0,17 |
| 220 | +7 | 329,6 | 319,7 | 332,1 | −0,53 → +0,13 | 0,51 → 0,16 |
| 220 | +12 | 440,0 | 420,0 | 445,0 | −0,81 → +0,20 | 0,30 → 0,17 |
| 440 | −12 | 220,0 | 215,0 | 215,0 | −0,40 → −0,40 | 0,15 → **0,72** |
| 440 | −7 | 293,7 | 290,3 | 290,3 | −0,20 → −0,20 | 0,30 → 0,61 |
| 440 | −5 | 329,6 | 327,1 | 327,1 | −0,13 → −0,13 | 0,17 → 0,49 |
| 440 | −1 | 415,3 | 414,7 | 414,7 | −0,02 → −0,02 | 0,23 → 0,71 |
| 440 | +1 | 466,2 | 466,8 | 466,8 | +0,02 → +0,02 | 0,23 → 0,70 |
| 440 | +5 | 587,3 | 590,7 | 590,7 | +0,10 → +0,10 | 0,14 → 0,44 |
| 440 | +7 | 659,3 | 664,2 | 664,2 | +0,13 → +0,13 | 0,14 → 0,42 |
| 440 | +12 | 880,0 | 890,0 | 890,0 | +0,20 → +0,20 | 0,10 → 0,37 |
| 880 | −12 | 440,0 | 430,0 | 442,5 | −0,40 → +0,10 | 0,69 → 0,23 |
| 880 | −7 | 587,3 | 580,7 | 589,0 | −0,20 → +0,05 | 0,55 → 0,25 |
| 880 | −5 | 659,3 | 654,2 | 660,5 | −0,13 → +0,03 | 0,46 → 0,19 |
| 880 | −1 | 830,6 | 829,5 | 830,9 | −0,02 → +0,01 | 0,72 → 0,82 |
| 880 | +1 | 932,3 | 933,5 | 932,0 | +0,02 → −0,01 | 0,70 → 0,81 |
| 880 | +5 | 1174,7 | 1181,4 | 1173,0 | +0,10 → −0,02 | 0,42 → 0,23 |
| 880 | +7 | 1318,5 | 1328,5 | 1316,0 | +0,13 → −0,03 | 0,38 → 0,17 |
| 880 | +12 | 1760,0 | 1780,0 | 1755,0 | +0,20 → −0,05 | 0,24 → 0,17 |

Thống kê 24 điểm: sai lượng tử hoá tệ nhất **1,51 → 0,40 st** (24/24 điểm
≤ 0,40 st — trong tiêu chí ≤0,5 st của check N2 P4); AM trung bình
0,42 → 0,38; AM tệ nhất 0,72 → 0,82 (880 Hz ±1 — xem §2.4).

### 2.3 Mục tiêu brief ĐẠT ở sine trầm (220 Hz)

- **Triệt răng ĐÃ SỬA:** 220/−12 đo 120 Hz (+1,51 st, răng trung tâm bị
  triệt — đợt 192 §3.4) nay đo **107,5 Hz (−0,40 st)** — đúng răng lược
  gần mục tiêu nhất với W = 0,08 (khoảng răng 6,25 Hz).
- **AM ở 220 Hz:** 0,51–0,67 → **0,16–0,39** (trung bình 0,55 → 0,23).
- 880 Hz cũng tốt lên: sai tệ nhất 0,40 → 0,10 st; AM trung bình
  0,52 → 0,36.

### 2.4 Trade-off: 440 Hz KHÔNG đổi tần trội, AM tệ hơn — cơ chế đã chẩn đoán

Ở 440 Hz, cả 8 tần trội **y hệt baseline** (215, 290,3, 327,1, 414,7,
466,8, 590,7, 664,2, 890) và AM tăng 0,10–0,30 → 0,37–0,72 (trung bình
0,18 → 0,56). Chẩn đoán phổ (top peak quanh mục tiêu, W = 0,08):

- 440/−12: răng trội 215 Hz (0 dB), răng kề 227,4 Hz chỉ −4,6 dB; răng
  mới 221,25 Hz **không lọt top 8** (bị triệt >19 dB). Khoảng răng hiệu
  dụng vẫn 12,5 Hz — răng xen kẽ bị triệt.
- 220/−12 (đối chứng): răng trội 107,5 Hz (0 dB), răng cũ 120 Hz chỉ
  −16,9 dB — răng mới thắng sạch.
- 440/+12: 890,1 Hz (0 dB), 865 Hz −3,6 dB; răng mới 877,5 Hz vắng mặt.

Cơ chế: hai đường delay lệch nửa chu kỳ giao thoa triệt răng xen kẽ, mức
triệt phụ thuộc phần lẻ của f0·W (220×0,08 = 17,6 → răng mới thắng;
440×0,08 = 35,2 → răng xen kẽ bị triệt, răng cũ vẫn trội). Hai răng mạnh
cách nhau ~12,4 Hz phách nhau → AM sâu (đo AM 0,37–0,72). Đây là giới hạn
nội tại của thiết kế 2-delay: **không có một W nào sửa mọi f0 cùng lúc**
(vì phần lẻ f0·W đổi theo f0). AM 0,82 ở 880/±1 có cả ở baseline (0,72):
LFO lúc đó chỉ 0,70 Hz — gain trôi chậm theo chu kỳ LFO, không phải hồi
quy do W. **Trễ pitch tăng 20 → 40 ms trung bình khi pitch bật** (W/2) —
ghi rõ, chưa đo ảnh hưởng lip-sync (nợ §5).

### 2.5 W = 0,06 đã thử và BÁC bằng số đo (đo đủ 24 điểm)

W = 0,06: tệ nhất **1,08 st** (220/−12 đo 103,3 Hz, −1,08 st — vẫn hơn
W = 0,04 là +1,51 st nhưng tệ hơn W = 0,08 là −0,40 st); AM trung bình
0,39 (≈ W = 0,08 là 0,38) nhưng **220 Hz tệ hẳn** (AM trung bình 0,61 vs
0,23; sai tệ nhất 1,08 vs 0,40) trong khi 440 Hz tốt (AM trung bình 0,19;
sai tệ nhất 0,26). Đúng như cơ
chế §2.4 dự đoán (220×0,06 = 13,2, phần lẻ 0,2 → răng xen kẽ bị triệt).
**Kết luận: W = 0,08 là tốt nhất trong 3 giá trị đã đo** theo tiêu chí tệ
nhất toàn cục (sai 0,40 st; AM trung bình thấp nhất 0,38) và theo đúng
mục tiêu brief (sine trầm). Code đã trả về W = 0,08 sau thí nghiệm; đo
lại toàn bộ sau khi trả về KHỚP Y HỆT lần đo trước (deterministic).

## 3. Kiểm chứng sau sửa

- `npx tsc --noEmit` (apps/web) → **0 lỗi**.
- `node --experimental-strip-types apps/web/src/lib/previewVoiceFx.test.ts`
  → **27 pass, 0 fail** (26 cũ + 1 test khóa hằng số mới).
- `node --experimental-strip-types apps/web/src/lib/audioEngineVoiceFx.test.ts`
  → **8 pass, 0 fail** (LFO +12 cập nhật 25 → 12,5 Hz).
- `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- `node packages/video-spec/scripts/check-video-spec-mirror.mjs`
  → **427 pass, 6 known, 0 fail**.
- `npm run build` (apps/web) → **PASS** (vite 7,82 s,
  `index-D7yXhUhC.js` 1.707,30 kB).
- Đo trình duyệt thật lặp lại 2 lần sau sửa cuối: **KHỚP Y HỆT** từng số
  (telephone 9 điểm + pitch 24 điểm) — OfflineAudioContext deterministic.
- Hạ tầng đo đợt này ở `/tmp/voicefx193/` (measure page + CDP driver +
  baseline.json / after.json / after2.json / w006.json) — file tạm,
  không stage.

**Chưa kiểm chứng:** nghe bằng tai người trên clip voice thật (chỉ đo
sine); Firefox/Safari (hằng số 50/43 + đáp ứng RBJ đo trên Chrome 158);
ảnh hưởng trễ pitch 40 ms lên lip-sync.

## 4. File đổi (stage trong paths-loop)

- `apps/web/src/lib/previewVoiceFx.ts` — `TELEPHONE_WET_GAIN_COMP = 0,76`
  + nhân vào gain telWet; `PITCH_WINDOW_S` 0,04 → 0,08; comment cập nhật.
- `apps/web/src/lib/previewVoiceFx.test.ts` — LFO +12/−12/+1 theo W mới;
  telephone wet kỳ vọng 0,76 (2 chỗ); +1 test khóa 2 hằng số mới.
- `apps/web/src/lib/audioEngineVoiceFx.test.ts` — LFO pitch +12: 25 → 12,5 Hz.
- `docs/PHASE9_ROUND193_P1_VOICEFX_LIMITS.md` — file này.

**KHÔNG đổi:** `apps/web/src/lib/audioEngine.ts`, `preview.tsx`,
`tsconfig.json`, `SAW_GAIN_COMP` (giữ 50/43), robot/echo, GAP, aggregate
(việc của T10), MEMORY.md, build-loop-log.md.

**Xung đột / việc cho luồng khác (báo rõ, không tự sửa file người khác):**
`apps/web/src/lib/parityHarness192.ts` của P4 kỳ vọng `telWet = 1` (dòng
~962) và check N2 dùng tiêu chí AM ≤ 0,35 ở 440 Hz (AM sau W = 0,08 là
0,37–0,72 — xem §2.4) — **P4-193 CẦN cập nhật kỳ vọng harness** (telWet
→ 0,76; N2: sim đọc `PITCH_WINDOW_S`/`TELEPHONE_WET_GAIN_COMP` từ code
thật nên tự khớp tham số, nhưng tiêu chí AM ở 440 Hz sẽ CHƯA ĐẠT nếu giữ
nguyên — P4 quyết cách ghi). P1 không đụng file harness.

## 5. Chưa làm / nợ chuyển đợt sau

- Telephone: chờ P4-193 kiểm độc lập N1 (xem §1.3 — P1 đo ĐẠT bar ≤2 dB,
  trái kỳ vọng brief; cần xác nhận độc lập trước khi ghi ĐẠT chính thức).
- Pitch: AM ở 440 Hz (0,37–0,72) + răng xen kẽ bị triệt là giới hạn nội
  tại của 2-delay — giải pháp triệt để vẫn là PSOLA/AudioWorklet + FFT
  (ngoài phạm vi đợt này); W = 0,08 là tốt nhất trong các giá trị đã đo.
- Trễ pitch 40 ms: chưa đo ảnh hưởng lip-sync khi pitch bật trên clip thật.
- Nghe bằng tai người trên clip voice thật; Firefox/Safari.
- Robot excursion 0,0027 vẫn giữ theo suy luận đợt 191 (chưa đo lại bằng
  peak-finding).
