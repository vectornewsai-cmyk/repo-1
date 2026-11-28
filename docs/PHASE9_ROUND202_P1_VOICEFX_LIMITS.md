# LIMITS — Đợt 202 P1: VoiceFX — notch H3 vào code sản phẩm (core + worklet) + publish headed JSON

- Đợt: 202, luồng P1 (Editing Core — preview/render parity, đợt thứ 12 theo hướng mới 25/11).
- Ngày: 28/11/2026 (lượt cron 03:35 +07). Hạn cờ ~06:00 +07, hạn cứng 06:35:51 +07. Đóng ~04:32Z.
- Nhiệm vụ (quyết (a2)/(r)-201): (1) đưa notch triệt H3 vào core (độ sâu thích ứng + Q=4 + bù gain);
  notch worklet cần gate confidence; BỎ Blackman + tách tầng; (2) publish headed JSON 201 để P4-202
  chạy lại N12a-wide; (3) đề xuất flip cờ fallback có bằng chứng (quyết flip thuộc parent).
- **Kết luận ngắn: CORE ĐẠT 5/5 THƯỚC — dH3 med +11,9 → +2,3 dB, H3>H1 52 → 12/243 (4,9%),
  |errSt| med 0,149 → 0,150 st, H2−H1 out −5,1 → −5,9 dB, rmsRatio 0,80 (giữ nguyên — bù gain
  hiệu quả). WORKLET CẢI THIỆN MẠNH NHƯNG CHƯA ĐẠT — dH3 12,0 → 6,0, H3>H1 83 → 47/243 (19%),
  cao độ worklet vẫn lệch 1,21 st (cấu trúc, không phải do notch). ĐỀ XUẤT: GIỮ cờ
  `PSOLA_MINUS12_USE_FALLBACK` (KHÔNG FLIP) — cờ chặn đường PREVIEW, mà preview vẫn chưa đạt;
  xem §6 (còn thiếu gì). Headed JSON đã publish: `chrome-2026-11-27T21-26-29-540Z.json`
  (2 run giống hệt; cao độ −12: 0,02–0,06 st — notch không chạm cao độ).**

## 1. Thay đổi code đợt này (đã sửa, test xanh — xem §7)

- `apps/web/src/lib/psola.ts`:
  - Mới `applyH3Notch(y, xIn, sr, ratio)` — post-filter peaking cut tại 3×f0_out từ track offline
    (fMin 50): **độ sâu thích ứng theo từng khối 128 mẫu** — đo H3−H1 vào/ra trực tiếp bằng
    Goertzel trên cửa sổ 2048 mẫu, chỉ cắt phần VƯỢT (`depth = clamp(H3H1_out − H3H1_in, 0, 15)`),
    đích H3−H1 ra ≈ H3−H1 vào; **Q=4**; **bù gain theo RMS từng khối 512 mẫu** (gain =
    rms(trước)/rms(sau), kẹp [1; 1,8], làm mượt — khôi phục mức, không thổi đoạn lặng);
    **peak guard 0,98** (tránh clip khi encode 16-bit). Khối unvoiced → giữ hệ số cũ.
    Trả `{ out, stats }` (depth med/max, makeup med, peak/rms trước/sau, số khối voiced).
  - `PsolaOptions.h3Notch` (mặc định **true**): `psolaPitchShift` áp notch 1 lần DUY NHẤT ở cuối
    đường twostage −12 (đệ quy dùng mode "none" nên không notch lặp); các tỉ lệ khác và các mode
    integerRatio khác **bit-identical** với khi tắt (test §7). Cap 15 dB + làm mượt k=0,5
    (mặc định — xem §2: cap 12 dB là điểm nghẽn; quyết (a2)-201 không cố định số cap).
  - Không đổi `server/render/src/psolaPitch.js` (bản render-server — port riêng, xem nợ §7).
- `apps/web/src/lib/psolaWorkletSource.ts` — notch H3 TRONG worklet (post-filter trên thành phần
  PSOLA, không chạm dry):
  - `processorOptions.notchH3` (bật) + `notchSigDb` (mức chữ ký, mặc định −0,5 dB — đo trên sine
    thuần P1-201 §5) + `notchDeboost` (chỉ node tầng 2 — trừ chữ ký tầng 1 cộng công suất trước
    khi tính độ sâu) + `notchFixedDb` (thí nghiệm — độ sâu cố định, không phải mặc định).
  - **Gate confidence: chỉ cập nhật/áp notch khi `confidence ≥ confGate` (mặc định 0,5)**; không
    đạt gate → BYPASS hoàn toàn (xóa state biquad, gain bù trôi về 1). Chứng minh gate có tác
    dụng bằng test: confGate=1,0 → output y hệt không notch (xem §7).
  - Độ sâu thích ứng: Goertzel trên 2048 mẫu ring gần nhất tại f0_in / 3×f0_in của node,
    `depth = clamp(C − (H3−H1)_in, 0, 12)`, Q=4, làm mượt k=0,25; fc = 3×ratio×f0_in của node.
  - Bù gain theo RMS từng block 128 mẫu (kẹp [1; 1,8], làm mượt) + **peak guard streaming**
    (gain hiệu dụng = min(gain, 0,98/đỉnh-block) — phát hiện khi đo: notch node 1 đẩy peak
    cascade lên 1,17–1,19 vì node 2 khuếch đại tiếp; sau guard peak = 0,980 đúng ngưỡng).
- `apps/web/src/lib/previewVoiceFx.ts` — `buildPsolaChain`: chuỗi two-stage −12 nay bật notch ở
  **CẢ 2 node** (node 1 thích ứng thường, node 2 thích ứng + deboost); chuỗi 1 node (tỉ lệ khác)
  không notch. `makePsolaNode(ratio, notchH3, notchDeboost)`.
- `psola.test.ts` +3 test (24/24), `psolaWorklet198.test.ts` +2 test (8/8) — xem §7.

## 2. Core notch — ĐẠT 5/5 thước (243 khung giọng thật, y hệt đợt 200/201)

Thước đạt (P1-201 §6, theo quyết (a2)-201): dH3 med ≤ 3 dB + H3>H1 ≤ 15% + |errSt| med ≤ 0,2 st
+ H2−H1 out ≥ −6 dB + rmsRatio ≥ 0,75. Pooled 243 khung (Hải Đăng 56 / Mai Anh 116 / Quang Sơn 71):

| Thước (med) | core50 (không notch) | notch cố định −12/Q=2 (harness 201) | **core202notch (ship)** | Bar |
|---|---|---|---|---|
| dH3 (dB) | +11,9 | +1,7 | **+2,3** | ≤ 3 ✓ |
| H3>H1 | 52/243 (21%) | 7/243 (2,9%) | **12/243 (4,9%)** | ≤ 15% ✓ |
| \|errSt\| (st) | 0,149 | 0,161 | **0,150** | ≤ 0,2 ✓ |
| H2−H1 out (dB) | −5,1 | −7,7 | **−5,9** | ≥ −6 ✓ (sát bar) |
| rmsRatio | 0,80 | 0,55 | **0,80** | ≥ 0,75 ✓ |
| centShift (Hz) | −173 | +21 | −48 | — |
| domK k=1 | 89 | 127 | 109 | — |
| đo được f0 | 134/243 | 136/243 | 137/243 | — |
| AM med | 0,679 | 0,641 | 0,686 | — |

- Theo clip (core202notch): Hải Đăng dH3 1,7 / H3>H1 5/56 / |errSt| 0,191 / H2 −5,6 / rmsRatio 0,80;
  Mai Anh dH3 3,6 / 2/116 / 0,171 / H2 −7,0 / 0,76 (clip khó nhất — H3−H1 vào −19,5 dB, excess
  lớn, hay chạm cap); Quang Sơn dH3 1,1 / 5/71 / 0,122 / H2 −4,1 / 0,83.
- Stats notch (trực tiếp từ `applyH3Notch`): depth med Hải Đăng 10,62 / Mai Anh 13,71 / Quang Sơn
  6,25 dB (max 15,00 cả 3 — cap chạm trần); makeup med 1,10 / 1,16 / 1,07; peak 0,910→0,912 /
  0,750→0,779 / 0,695→0,691 (guard không kích — peak < 0,98 sẵn); rms giữ nguyên (tỉ số 0,997–1,006).
- Sanity: `psolaPitchShift` mặc định == gọi trực tiếp `applyH3Notch` (max|diff| = 0,00);
  `h3Notch:false` == ab201 core50 (mean|diff| ~1,5e-5 = mức lượng tử WAV) — code core không đổi
  ngoài notch. 0 NaN/Inf mọi đường.
- **Thí nghiệm cap + làm mượt (quyết định mặc định cap 15 / k=0,5):** cap 12 + k=0,25 → dH3 3,8
  (thiếu bar 0,8 dB — depth chạm trần 12,00 ở cả 3 clip); k=0,5 → 3,4; cap 15 → 2,7;
  **k=0,5 + cap 15 → 2,3** (H3>H1 12/243, |errSt| 0,150, H2 −5,9, rmsRatio 0,80 — đủ 5/5).
  Cap 12 là điểm nghẽn thật (excess hay vượt 12 dB: dH3 p90 ~30 dB khi không notch); nâng cap
  không làm tệ H2 (−5,7 → −5,9) hay rmsRatio (0,80 = 0,80) — vì Q=4 hẹp + bù gain theo khối.
  Lưu ý: (a2)-201 chỉ nói "độ sâu thích ứng + Q=4 + bù gain", không cố định cap 12 dB (cap 12 là
  đề xuất của P1-201 §6, kế thừa từ độ sâu CỐ ĐỊNH −12 dB của harness — không còn phù hợp khi
  depth đã thích ứng).
- **Phân tích khung mạnh/yếu (51 khung H3−H1 vào > −5 dB vs 152 khung < −12 dB):** khung mạnh —
  không notch dH3 −2,9 (two-stage không boost H3 ở đây), notch cố định over-cut tới −13,7,
  **notch thích ứng −5,1** (tốt hơn hẳn cố định nhưng vẫn over-cut ~2 dB — đo depth trên cửa sổ
  2048 mẫu lệch với cửa sổ đo khung 100 ms khi f0 glide); khung yếu — không notch +18,0, cố
  định +7,0, **thích ứng +6,8** (dư do cap + glide — đuôi |dH3| p90 vẫn 19,5 dB). Đây là giới
  hạn còn lại của core notch, không phải lỗi thiết kế.

## 3. Fixture tổng hợp — notch làm đúng thiết kế (đo cửa sổ 100 ms như thước khung)

- Core, harmonic 220/330/440 Hz ở −12: H3−H1 vào −9,5 dB → không notch −0,5 dB (đúng chữ ký) →
  **có notch −9,5…−9,7 dB (dH3 +9,0 → 0,0 ± 0,1)** — đưa H3 về ĐÚNG mức vào, cao độ không đổi
  (errSt ≤ 0,4), rms giữ nguyên (tỉ số 0,999–1,000), depth med 9,0–9,1 dB, makeup 1,19.
  (CẢNH BÁO phương pháp: đo Goertzel trên cửa sổ DÀI 2,5 s cho số SAI — H3 của output two-stage
  lệch pha dần nên DFT dài triệt tiêu một phần: đo đoạn cho dH3 off −5,1 thay vì +9,0. Chỉ dùng
  cửa sổ ≤ 100 ms cho H3 — cùng bài học §7 đợt 201.)
- Worklet, harmonic 220/330 ở −12: H3−H1 không notch −0,5/−0,8 dB → **notch ship −12,8/−13,1 dB**
  (over-cut ~3 dB so với vào −9,5 — deboost cộng công suất hơi mạnh tay khi f0 tracking hoàn hảo;
  trên giọng thật nó under-correct nên ròng vẫn là cải thiện — xem §4).

## 4. Worklet notch — cải thiện mạnh nhưng CHƯA ĐẠT bar (243 khung)

| Thước (med) | tsNew (không notch) | node 2-only (C=−2) | cả 2 node (C=−2) | cả 2 node C=−3,6 | cố định −12 cả 2 node | **ts-final (ship: cả 2 + deboost node 2)** | Bar |
|---|---|---|---|---|---|---|---|
| dH3 (dB) | 12,0 | 10,1 | 6,8 | 7,4 | 4,7 | **6,0** | ≤ 3 ✗ |
| H3>H1 | 83/243 | 78/243 | 63/243 | 66/243 | 38/243 | **47/243 (19%)** | ≤ 15% ✗ |
| \|errSt\| (st) | 1,189 | 1,131 | 1,097 | 0,913 | 1,403 | **1,205** | ≤ 0,2 ✗ |
| H2−H1 out (dB) | −4,3 | −4,4 | −5,2 | −5,6 | −5,1 | **−4,7** | ≥ −6 ✓ |
| rmsRatio | 0,82 | 0,83 | 0,83 | 0,82 | 0,82 | **0,83** | ≥ 0,75 ✓ |
| centShift (Hz) | −187 | −125 | +37 | +12 | +122 | **+59** | — |
| domK k=1 | 43 | 53 | 85 | 79 | 99 | **99** | — |
| đo được f0 | 103/243 | 101/243 | 105/243 | 97/243 | 88/243 | 105/243 | — |

- **Vì sao node 2-only gần như không hiệu quả (dH3 10,1)?** Probe engage (`probe202.mjs`): node 2
  engage 38–59% block (gate confidence — conf trung bình node 2 chỉ 0,44–0,56), depth khi active
  3,1–9,9 dB — gate KHÔNG phải nguyên nhân chính (notch có engage, có depth). Nguyên nhân chính:
  **mỗi tầng đều áp đặt chữ ký H3 riêng** — node 1 tạo H3 ở 2,12×f0_gốc, node 2 đo input đã bị
  boost nên luật thích ứng thường đánh giá thấp phần cần cắt. Bằng chứng: node 1-only dH3 11,4
  (cũng yếu), cả 2 node 6,8 (cộng dồn), node 2 deboost (trừ chữ ký tầng 1) 6,0 — tốt nhất trong
  các biến thể thích ứng. C=−0,5/−2/−3,6 trên node 2-only gần như không khác (10,0/10,1/10,2) —
  C không phải điểm nghẽn.
- **Vì sao KHÔNG chọn depth cố định −12 (dH3 4,7 — gần bar nhất)?** Nó **phá cao độ**: |errSt| med
  1,097 → 1,403, đo được f0 105 → 88/243. Đánh đổi xấu (cao độ là bar chính của cờ fallback).
  Luật thích ứng giữ nguyên cao độ (1,189 → 1,097–1,205, dao động trong nhiễu đo).
- **Giới hạn còn lại của worklet (không phải do notch):** cao độ worklet lệch 1,19–1,21 st trên
  giọng chạy (cascade smearing + đặt mark nhân quả — kết luận đợt 201 §3, chưa sửa đợt này);
  f0 sai → notch đặt sai tần một phần; gate chặn 41–62% block node 2. Notch worklet chỉ có thể
  cải thiện timbre trong giới hạn f0 đó — muốn đạt bar dH3 ≤ 3 ở preview phải sửa cao độ
  worklet trước (nợ §6).
- Peak guard: notch node 1 đẩy peak cascade lên 1,17–1,19 (node 2 khuếch đại tiếp) → sau guard
  peak = 0,980 đúng ngưỡng, mọi đường ship peak ≤ 0,98.

## 5. Headed JSON (trả nợ P1-201 — P4-202 chạy lại N12a-wide)

- File: `hidden_files/round202-p1/chrome-2026-11-27T21-26-29-540Z.json` (list 2 run; bundle
  `harness/voicefx-bundle.mjs` build lại từ cây hiện tại bằng esbuild; Chrome Headless 158;
  spec `pitchCurve,harmonicCurve,twoStageOn`, repeat 2, ~25 s/run).
- **Lưu ý nguồn gốc (trung thực): P1-201 KHÔNG publish headed JSON; file này đo ở lượt 202 trên
  code 202 (gồm notch ship). Nó TRẢ NỢ 201 cho P4-202, không phải dữ liệu đo bằng code 201.**
  Cao độ −12 giống hệt dữ liệu 199 nên không làm sai lệch N12a-wide — xem dưới.
- Số: minus12Fallback False; psolaUpgraded 80/run, psolaFailed 0, psolaTwoStageRenders 10/run
  (5 f0 × 1 n=−12 mỗi curve); **pitchCurve −12: errSt 0,06 / 0,03 / 0,03 / 0,02 / 0,02 st
  (220/330/440/550/660); harmonicCurve −12: 0,02 / 0,03 / 0,01 / −0,02 / 0,04 st** — giống
  hệt file 199 (`verify-fixed/chrome-2026-11-27T06-31-21-469Z.json`: pitchCurve −12 cũng
  0,06/0,04/0,03/0,02/0,02) → **notch không chạm cao độ headed**. Hai run giống hệt từng số.
  max|errSt| toàn lưới 0,06 st. Wide outlier duy nhất: errStWide 12,01 st ở **n=−7** (single-stage,
  notch không áp — peakWide = 2× target, H2 trội), giống hệt file 199 từng số → không phải hồi quy.
- P4-203 chạy lại N12a-wide trên file này (thay fallback 199). **Lưu ý thời gian: P4-202 đã đóng
  21:22Z, TRƯỚC khi file này publish 21:26Z — nên P4-202 vẫn dùng fallback 199 (đúng như log
  P4-202 ghi); nợ headed JSON chuyển sang P4-203, không phải lỗi P4-202.**

## 6. Đề xuất flip cờ — GIỮ `PSOLA_MINUS12_USE_FALLBACK` (KHÔNG FLIP)

- Cờ này chặn đường **PREVIEW** (−12 về shifter 2-delay cũ). Preview (worklet) vẫn CHƯA ĐẠT:
  dH3 med 6,0 (bar ≤ 3), H3>H1 19% (bar ≤ 15%), |errSt| med 1,21 st (bar ≤ 0,2). Flip bây giờ
  sẽ đưa preview −12 về một đường cao độ vẫn lệch > 1 st + H3 vẫn trội — đúng thứ cờ này sinh ra
  để chặn.
- Core (render tham chiếu) ĐẠT 5/5 là bước cần thiết nhưng chưa đủ: (a) `psola.ts` là core tham
  chiếu dùng cho harness parity — **render-server thật (`server/render/src/psolaPitch.js`, port
  riêng) vẫn CHƯA có notch** (nợ §7); (b) cao độ worklet là vấn đề cấu trúc (cascade smearing),
  notch không sửa được.
- **Còn thiếu để flip (cho P1-203+):** (1) sửa cao độ worklet giọng chạy (|errSt| ≤ 0,2 st —
  hướng 201 §6(3): track tầng 2 từ tín hiệu GỐC thay vì tầng 1, hoặc tăng lookahead); (2) khi đó
  đo lại worklet notch — kỳ vọng dH3 ≤ 3 theo được f0 đúng; (3) port notch sang
  `server/render/src/psolaPitch.js` + đo lại render thật; (4) P4 xác nhận N12a-wide trên headed
  JSON §5 + core sim với notch mặc định.
- Không flip cũng không mất gì đợt này: notch đã nằm trong code sản phẩm cả hai đường (mặc định
  bật), chờ cao độ worklet theo kịp thì cờ có thể flip mà không cần sửa thêm notch.

## 7. Kỷ luật đo yên + test + nợ

- **Đo yên: 0 vi phạm.** Kiểm `hidden_files/round202-t4/W1-ACTIVE` TRƯỚC MỖI lệnh nặng (tsc, test,
  vite build, render, đo khung, slim, Chrome headed) — file không tồn tại trong suốt lượt (T4-202
  chưa mở cửa sổ yên lúc tôi chạy; không có `windows.md` của T4-202 trên đĩa để đối chiếu thêm).
  Lệnh nặng làm sớm trong lượt (render/đo xong trước ~21:30Z).
- Test (chạy sau khi kiểm W1-ACTIVE): `psola.test.ts` **24/24** (21 cũ + 3 mới: notch H3 −12 dH3
  về ≈ 0 trên harmonic 220/330/440 + cao độ không đổi; notch không đổi n=−7 bit-identical;
  stats applyH3Notch); `psolaWorklet198.test.ts` **8/8** (6 cũ + 2 mới: notch ship H3−H1 −0,8 →
  −13,1 dB trên harmonic 330 + cao độ không đổi; gate confGate=1,0 → output y hệt không notch);
  `previewVoiceFx.test.ts` **46/46**; `audioEngineVoiceFx.test.ts` **8/8**. Tổng **86/86**.
- `npx tsc --noEmit` (apps/web): **0 lỗi** (lỗi file P3-201 đợt trước đã được sửa — không phải
  bởi tôi). `vite build`: **PASS 7,24 s** (bundle index-fSVOvUNS.js 1.755,66 kB; cảnh báo chunk
  > 500 kB đã có từ trước).
- Nợ đợt 203: (1) cao độ worklet giọng chạy (hướng 201 §6(3)); (2) port notch sang
  `server/render/src/psolaPitch.js` (+ fMin 50 của nó nếu còn 80 Hz); (3) điểm wide 110 Hz core
  0,115 st (201 §6(4) — nội suy mark dưới mẫu); (4) notch thích ứng vẫn over-cut ~2 dB trên khung
  H3 tự nhiên mạnh + dư ~+7 dB trên khung H3 yếu (đuôi glide — xem §2); deboost worklet over-cut
  ~3 dB trên fixture tĩnh khi f0 tracking hoàn hảo (§3).
- BỎ (không làm lại): Blackman + tách tầng (FAIL đợt 201, không thử lại).

## 8. File đổi (stage)

- `apps/web/src/lib/psola.ts` — `applyH3Notch` + hook twostage −12 + option `h3Notch`.
- `apps/web/src/lib/psolaWorkletSource.ts` — notch H3 worklet + gate confidence + bù gain +
  peak guard + options thí nghiệm (`notchFixedDb`, `notchDeboost`).
- `apps/web/src/lib/previewVoiceFx.ts` — `buildPsolaChain` bật notch cả 2 node (node 2 deboost).
- `apps/web/src/lib/psola.test.ts` — +3 test (24/24).
- `apps/web/src/lib/psolaWorklet198.test.ts` — +2 test (8/8).
- `docs/PHASE9_ROUND202_P1_VOICEFX_LIMITS.md` — file này.
- Scratch (không stage): `hidden_files/round202-p1/` — `ab202/` (WAV các đường, binary),
  `scratch/` (`render202.mjs`, `frames202.mjs`, `slim202.mjs`, `exp202.mjs`, `exp2b202.mjs`,
  `probe202.mjs`, `probe-test202.mjs`, `probe-test2-202.mjs`, `probe-test3-202.mjs`,
  `dbg-notch202.mjs`, `*.log`), `frames202.json`, `core-notch-stats202.json`,
  `chrome-2026-11-27T21-26-29-540Z.json` (headed JSON cho P4-202), `harness/` (page đo + bundle
  esbuild từ cây hiện tại + `cdp202.log`).
- KHÔNG PUSH. KHÔNG release/tag. Không code giả. Cờ fallback GIỮ (đề xuất §6, chờ parent quyết).
