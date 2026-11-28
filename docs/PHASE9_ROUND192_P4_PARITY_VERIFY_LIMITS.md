# PHASE 9 ĐỢT 192 — P4: Harness parity độc lập (render-vs-preview) — 39/42 ĐẠT

## 0. Verdict + snapshot

**Verdict: 39/42 ĐẠT.** 33 check cũ (S1–S8): 31/33 ĐẠT (như đợt 191, nhưng 2 CHƯA ĐẠT đã đổi bản chất — xem §1). 9 check mới: 8/9 ĐẠT (chỉ N1 CHƯA ĐẠT — P1 chưa implement sửa telephone). **2/2 check quyết định của đợt này ĐẠT: S6b-headed (seek −1ms đúng frame) và S7c (audio đảo đã nối, có tiếng).**

- Harness: `apps/web/src/lib/parityHarness192.ts` + runner `scripts/parity192-run.mjs`, chạy cuối 15:57:16Z; JSON đầy đủ ở `hidden_files/parity192/parity192-report.json`. Headed đo bằng Chromium 1254 (headless, CDP): voice 15:29:59Z, seek 15:31:27Z (tái sinh 15:49:48Z sau khi sửa chờ trình bày frame — xem F-192-P4-4).
- Snapshot đĩa lúc đo 15:44:07Z (P1+P2+P3 đều đã đóng cờ; không file nào đổi sau đó): `previewVoiceFx.ts` 09:50:28Z (đợt 191 — P1-192 không sửa), `audioEngine.ts` 15:01:42Z (P3: `getContext`/`getMasterNode`), `audioEngineVoiceFx.test.ts` 14:43:03Z (P1: tsc), `enhancePreview.ts` 15:00:52Z (P2), `reverseAudio.ts` 14:59:32Z / `reversePlayback.ts` 14:56:42Z / `reverseAudioWiring.ts` 15:00:19Z (P3), `preview.tsx` 15:05:02Z (P2 bob + P3 wiring), `tsconfig.json` 15:05:15Z (P1 flag + 1 exclude của P4, hợp nhất — xem §3). Attempt T4-192 đã xong trước mọi lần đo nặng (ACQUIRED 15:15:22Z → RELEASED 15:19:23Z, hold 241s); mọi script dài đều kiểm lock trước khi chạy, không chồng cửa sổ attempt.
- Tiêu chí pixel: KHỚP = MAD≤2 & le8≥99%; XẤP XỈ = MAD≤20 & le32≥90%.

## 1. Bảng 33 check cũ (S1–S8) — 31/33 ĐẠT

| Check | Kết quả | Số đo chính |
|---|---|---|
| S1-sharpen-t0.5 | ĐẠT KHỚP | MAD 0,521, PSNR 48,02, le8 99,38% |
| S1-sharpen-t1 | ĐẠT KHỚP | MAD 0,586, PSNR 47,04, le8 99,38% |
| S2-denoise-s0.3 | ĐẠT XẤP XỈ | MAD 3,16, le32 100%, ΔY +4,97 điểm |
| S2-denoise-s0.5 | ĐẠT XẤP XỈ | MAD 3,91, le32 100%, ΔY +8,03 |
| S2-denoise-s0.8 | ĐẠT XẤP XỈ | MAD 3,29, le32 100%, ΔY +7,29 |
| S2-denoise-s1 | ĐẠT XẤP XỈ | MAD 2,95, le32 100%, ΔY +6,74 |
| S2-warmup-s0.3 | ĐẠT | max \|Δ\| 4,95 (f0 2,76 / f1 4,81 / f2 4,95) |
| S2-warmup-s0.5 | **CHƯA ĐẠT** | max \|Δ\| **8,82** (f0 3,73 / f1 6,99 / f2 8,82) — xem §4.1 |
| S2-warmup-s0.8 | ĐẠT | max \|Δ\| 4,03 (1,78 / 1,86 / 4,03) |
| S2-warmup-s1 | ĐẠT | max \|Δ\| 2,95 (2,95 / 0,41 / 1,35) |
| S2-plan | ĐẠT | alpha 0,486, blurPx 3 |
| S3-noise-t0.5 | ĐẠT | std ratio 1,011/1,004/1,004; Δkurt 0,061; Δcorr 0,011 |
| S3-noise-t1 | ĐẠT | std ratio 1,015/1,013/1,010; Δkurt 0,129; Δcorr 0,011 |
| S4-voice-pitch+12 | ĐẠT | đỉnh 880 Hz đúng |
| S4-voice-pitch-12 | ĐẠT | đỉnh 220 Hz đúng |
| S4-voice-pitch+7 | ĐẠT | đỉnh 659,48 Hz (sai 0,03%) |
| S4-voice-robot | ĐẠT | sideband/carrier 0,296 |
| S4-voice-telephone | ĐẠT | att 100Hz −19,14 dB; 1000Hz −0,07; 5000Hz −7,83; 8000Hz −16,37 |
| S4-voice-echo | ĐẠT | echo ratio 0,625 |
| S4-voice-chain | ĐẠT | chain dài 129 ký tự, đủ 4 filter |
| S5-voice-preview | ĐẠT | **35/35** tham số khớp (đã sửa kỳ vọng saw gain — xem F-192-P4-2) |
| S6-control-forward | ĐẠT | MAD 0 |
| S6a-reverse-midframe | ĐẠT | MAD 0 (6 mốc) |
| S6b-reverse-boundary | **CHƯA ĐẠT** | MAD 25,5–33,2, lệch +1 ở mọi biên k>0 — **BY DESIGN** (xem §4.2) |
| S6-reverse-speed2 | ĐẠT | MAD 0 |
| S7-areverse-render | ĐẠT | max diff 0 (đảo mẫu chính xác) |
| S7b-reverse-audio-logic | ĐẠT | đảo mẫu + offset + player đoạn (clip 61s bị từ chối đúng) |
| S7c-reverse-audio-wiring | **ĐẠT** | wiring nhắc 8 lần, `wiring.tick` 1, `loadReversed` 1, `playSegment` 2 (xem §2.4) |
| S7d-reverse-audio-mapping | ĐẠT | sourceTimeAt(0,25s) = 0,75 |
| S8-reverse-steps | ĐẠT | 60 bước đều, sai số 0, chạm 0 đúng bước 60 |
| S8-decode-ahead-gate | ĐẠT | chặn mặc định, chỉ mở khi đủ bằng chứng |
| S8-cadence-tracker | ĐẠT | dụng cụ đo đúng (median 30ms/p90 40ms) — KHÔNG claim mượt |
| S8-proxy-direction | ĐẠT | yes/no đúng điều kiện |

Ghi chú S2: fixture Y-std 11,226 (nhiễu hơn flat15 của P2 là 8,25) nên ΔY +5..+8 điểm — cùng hiện tượng F-191-P4-2 (blend hiệu chuẩn theo mức nhiễu); verdict theo tier MAD nên vẫn ĐẠT. S4-telephone att 100Hz **−19,142 dB ≈ −19,1 dB lý thuyết** — xác nhận giả thuyết clip của đợt 191 (đợt 191 đo −21,06 dB do 0,5/tone clip khi ghi pcm_s16le; đợt này đổi 0,2/tone — xem F-192-P4-1).

## 2. Check mới — 8/9 ĐẠT

### 2.1 N1 telephone gain (headed) — CHƯA ĐẠT (P1 chưa implement sửa)

Đo headed qua `createVoiceChain` thật (OfflineAudioContext 48kHz, tín hiệu 5-tone) so với render ffmpeg trên cùng tín hiệu. Preview (dB): 100Hz −18,55; 440Hz +1,75; 1000Hz +0,84; 5000Hz −5,39; 8000Hz −15,55. Δ (preview − render): 100Hz **+0,59**; 440Hz **+2,60**; 1000Hz **+0,91**; 5000Hz **+2,44**; 8000Hz **+0,83** dB. Max |Δ| = **2,60 dB** (bar ≤2) → CHƯA ĐẠT. Số đo khớp bảng 9 điểm của P1-192 trong 0,03 dB ở 4/5 điểm (440: +2,60; 1000: +0,91; 5000: +2,44; 100: +0,59) — baseline đúng: Δ 9 điểm = +0,61/+2,43/+3,76/+2,60/+1,21/+0,91/+1,98/+3,76/+2,43 dB, max +3,76 dB tại 2 điểm cắt 300/3400 Hz. Nguyên nhân (P1-192 §2.2, đã xác nhận độc lập): BiquadFilter RBJ của Chrome có gain >1 gần fc (HP 300 cho 1,21 ở 440 Hz) — RBJ ≠ Butterworth analog. Đề xuất bù scalar g=0,76 trên `telWet` của P1 vẫn chờ parent quyết (§14.2-192); với g=0,76 sai tối đa còn ~18,5% (từ 54%).

### 2.2 N2 pitch artifact — ĐẠT (sim + headed khớp nhau)

- **N2a sim @440Hz (ĐẠT):** +12 → 889 Hz (+0,18 st); −12 → 215 Hz (−0,40 st); +7 → 663,5 (+0,11); −7 → 289,6 (−0,24). Lệch tệ nhất 0,40 st; AM tệ nhất 0,127; sideband tệ nhất 0,077.
- **N2b sim @220Hz (ĐẠT, bar không-hồi-quy):** +12 → 419 Hz (−0,85 st), AM 0,311. Hàng phụ −12@220 (sim): 119 Hz (**+1,36 st**, AM 0,52) — kiểm độc lập claim +1,51 st (120 Hz) của P1-192, khớp trong 0,15 st.
- **N2-headed (ĐẠT):** 440Hz: +12 → 890 Hz (+0,20 st), −12 → 215 (−0,40), +7 → 663,5 (+0,11), −7 → 289,6 (−0,24); AM tệ nhất 0,291, sideband tệ nhất 0,044. 220Hz +12 → 420 Hz (−0,81 st), AM 0,299. Sim khớp headed trong ~0,02 st ở 440 Hz (mô hình saw chuẩn hoá 43/50 đã đúng). Pitch −12 ở 220 Hz (+1,5 st) là giới hạn nội tại của thiết kế 2-delay (lược phổ), P1-192 đã chứng minh không sửa được bằng tham số — không phải hồi quy.

### 2.3 N3 denoise frame 3 — ĐẠT (trên đúng fixture của P2)

P2 đếm frame 1-based: "frame 3" = f=2 (warm-up chỉ áp f=0,1,2). Đo trên **đúng fixture flat15seq của P2** (`color=0x808080 + noise=alls=15:allf=t`, gen.sh): f=2: s=0,3 **−0,36**; s=0,5 **+0,26**; s=0,8 **−0,51**; s=1,0 **+0,76** — khớp bảng §1 của P2 (−0,3/+0,2/−0,8/+0,5) trong 0,3 điểm; max |Δ| = 0,76 ≤ 5,5 → **ĐẠT**. Claim "−5,4 → −0,8" của P2 được xác nhận độc lập. (Y-std frame2 đo trên RGB của tôi là 9,68 vs P2 ghi 8,25 — do tôi đo sau scale limited→full range ×1,164: 9,68/1,164 = 8,32 ≈ 8,25, khớp.)
Hàng phụ: fixture flat15-like của P4 (Gauss RGB σ=11, Y-std 8,28) cho f=2: −6,82/−7,97/−0,95/+3,25 và f=3: −6,94/−9,75/+1,37/+12,24 — lệch ở strength thấp là artifact cấu trúc nhiễu (delta % giảm std nhạy với phân phối nhiễu ở strength thấp; xem F-192-P4-3). Hàng noisy σ=15 (Y-std 11,23 ≈ flat20) f=2: +4,95/+8,82/+4,03/+1,35.

### 2.4 N4 sharpen trên nội dung nhiễu — ĐẠT; S7c — ĐẠT

- **N4:** pattern + nhiễu Gauss σ=15 (seed 19200): t=0,5 MAD 0,966, PSNR 43,68, le8 99,00%, le32 99,96%; t=1,0 MAD 1,111, PSNR 42,74, le8 98,80%, le32 99,95% → tier XẤP XỈ (sát KHỚP), ĐẠT. Tốt hơn số P2-191 §5.2 (MAD 1,5–3,0, le8 81–91%) — khác fixture; P2-192 §2 đo lại MAD 1,55/2,46 trên fixture của họ, cũng CHƯA ĐẠT tier KHỚP nhưng không sửa code (kernel đã gần tối ưu).
- **S7c:** preview.tsx import + tạo lười `ReverseAudioWiring`, gọi `wiring.tick(t, entries)` mỗi tick phát ngược; wiring gọi `new ReverseAudioPlayer` + `loadReversed` + `playSegment`; audioEngine.ts thêm `getContext()`/`getMasterNode()` để player dùng chung context/master. Mute element (`playing && reversePlayback` → gain 0) còn 1 chỗ — **BY DESIGN** (element vẫn paused; tiếng ngược đi qua player với gain GỐC, preview.tsx ~5900–5907). Badge "audio đảo" theo `wiring.isPlaying`. P3 tự xác minh headed: chirp peakHz 2778 → 1034 (tiếng đảo thật, không phải tiếng xuôi).

### 2.5 N5 deint bob — ĐẠT (XẤP XỈ, cải thiện rõ so với half-res)

Preview đợt 192 = bob: intermediate draw tắt smoothing (nearest) giữ đúng top field, rồi upscale bilinear (preview.tsx `deintIntermediateSource`; P2-192 §3.3, đã xác minh headed). Sim bob trong harness = đúng hàm `bobField(src,0)+upscaleBilinear` của probe P2. Fixture testsrc2 320×180 interlaced (`interlace=scan=tff:lowpass=0`), frame 8: **bob MAD vs yadif 3,258**, PSNR 24,31, le8 89,77%, le32 93,82%; R: src 4,961 / clean 2,510 / yadif 2,481 / **preview 2,154** (|ΔR|/R = 13,2% ≤ 15%). Half-res cũ làm tham chiếu: MAD 3,828, R 2,101 — bob thắng cả 2 chỉ số. Khớp số P2 trên fixture của họ (bob MAD 3,10, R 1,89 trên inter f8; yadif R đối chứng 2,00–2,21). Tier XẤP XỈ — chưa KHỚP (cần MAD ≤2 & le8 ≥99%). Lưu ý: R_src fixture của P4 (4,961) ≠ của P2 (6,327) — công thức fixture P2-191 không khôi phục được; so tuyệt đối chỉ mang tính tham chiếu, verdict theo tier + ΔR trên cùng fixture.

### 2.6 S6b-headed — ĐẠT (check quyết định của đợt)

Seek tới target đã sửa của P3 (`reverseSeekTarget`: lùi đúng **1ms**, `REVERSE_SEEK_BACKOFF_SEC=0.001`, áp ở preview.tsx 4147/4201/4300): 5/5 biên offset **0** (k=1,15,30,45,59 → frame 0/14/29/44/58), 4/4 giữa-frame offset 0. Hàng đối chứng biên thô (không trừ offset) tái hiện bug 191: offset **+1** (k=1 → frame 1, k=30 → frame 30) — chứng tỏ fix là thứ sửa được lỗi, không phải fixture dễ. P3 chọn 1ms thay vì nửa frame như gợi ý đợt 191 — probe P3: lùi nửa frame sai −1 frame ở 2/2 vị trí lệch lưới nửa đầu khoảng frame (1,475 → 43 thay vì 44); Chrome báo `currentTime` đúng bằng giá trị seek nên 1ms đủ xa biên. Test P3: 13/13 pass.

## 3. tsc / build / test

- `npx tsc --noEmit` (apps/web): **0 lỗi** (26,7s) — 4 lỗi của P1-191 đã sạch (flag `allowImportingTsExtensions` + xoá `approx` thừa).
- `npm run build` (tsc && vite build): **PASS**, vite built in **11,22s**, `dist/assets/index-l6h0lMWk.js` 1.707,29 kB (khớp tên bundle P3 ghi).
- `npx vite build` trực tiếp: **PASS**, built in **9,77s** (đợt 191: 11,20s).
- Test helper harness: **10/10 PASS** (mới: `deintBobSim` giữ đúng top field — hàng chẵn 200/lẻ 50 → mọi hàng 200; half-res → 125). Bundle esbuild OK.
- `tsconfig.json`: hợp nhất đúng — exclude của P3 (`reversePlayback192P3.test.ts`) + của P4 (`parityHarness192.test.ts`) đều còn; không mất code bên nào.

## 4. Phát hiện (F-192-P4-*)

- **F-192-P4-1 — Giả thuyết clip S4 đợt 191 ĐÚNG.** Đợt 191 đo att 100Hz −21,06 dB (lệch −19,1 dB lý thuyết) vì fixture 0,5/tone clip khi ghi pcm_s16le. Đợt này đổi amp 0,2/tone → att 100Hz **−19,142 dB**, khớp lý thuyết trong 0,04 dB.
- **F-192-P4-2 — Check S5 lỗi thời, không phải code sai.** `setParams` nhân `SAW_GAIN_COMP=50/43` vào saw gain (đúng thiết kế, P1-191 §4.2) — nhưng P1-191 sửa `previewVoiceFx.ts` lúc **09:50:28Z**, sau snapshot 09:27Z của P4-191, nên kỳ vọng ±0,02 của check cũ thành sai. Đã sửa kỳ vọng thành ±0,02×50/43 → S5 **35/35**.
- **F-192-P4-3 — N3: khung frame + fixture.** (a) P2 đếm 1-based ("frame 3" = f=2); bản N3 đầu đo f=3 là sai khung — đã sửa, đo lại trên đúng fixture P2 → ĐẠT. (b) Fixture Gauss RGB của P4 lệch ở strength thấp (−6,8/−8,0) dù Y-std khớp — delta % giảm std nhạy với phân phối nhiễu (ffmpeg `noise` vs Gauss), nhất là khi hqdn3d giảm ít. Bài học: đo denoise phải dùng đúng fixture của người sửa, không chỉ khớp Y-std.
- **F-192-P4-4 — S6b-headed: 2 lỗi đo của P4, đã sửa.** (a) Check đầu tính cả hàng `boundary-raw` vào worst-offset nên không bao giờ ĐẠT được — đã loại raw khỏi verdict (báo riêng +1/+1). (b) Script seek vẽ ngay sau `seeked` lấy frame cũ ở k=59 (hiện 44 thay vì 58); đo lại seek tươi + chờ 500ms → đúng 58 (MAD 1,098); script đã thêm chờ 300ms sau mỗi seek. Phụ: `requestVideoFrameCallback` **không** fire sau seek trên video paused dù frame đã mới — không dùng làm tín hiệu seek xong.
- **F-192-P4-5 — Runner bundle nhầm harness 191.** `parity192-run.mjs` bundle `parityHarness191.ts` (sed `s/parity191/parity192/` không match chuỗi `parityHarness191`); harness 191 kiểm biến `PARITY191_RUN_MAIN` nên main() không chạy → thoát 0 im lặng sau 0,7s. Đã sửa đường dẫn + 2 comment stale. (Cảnh báo chung: lần chạy harness "xong nhanh bất thường" phải kiểm tra output, không tin exit code.)
- **F-192-P4-6 — N5: `buildEnhancePreChain` trả `",yadif=..."`** (dấu phẩy đầu là separator trong chain render) — dùng trực tiếp làm filter ffmpeg sẽ báo filter rỗng. Đã strip dấu phẩy đầu (như S2 đã làm với post-chain).
- **F-192-P4-7 — RBJ sim sai vs Chrome (phương pháp).** Sim RBJ cascade HP300+LP3400 cho 440Hz −0,85 dB, 5000Hz −7,83 dB; Chrome thật cho +1,75 dB / −5,39 dB (khớp số P1-191). N1 bắt buộc đo headed qua chain thật, không sim. P1-192 §2.2 đã giải thích độc lập (bướu cộng hưởng RBJ gần fc).

### 4.1 S2-warmup-s0.5 CHƯA ĐẠT — trade-off đã ghi của P2, không phải hồi quy bất ngờ

Warm-up bậc 2 (LSQ) sửa frame 3 s=0,8 trên flat15 (−5,4 → −0,8, đã xác nhận ở N3) nhưng làm tệ hơn trên nội dung nhiễu hơn: trên fixture σ=15 (≈flat20) s=0,5 f=2 là **+8,82** (đợt 191 tuyến tính: 5,34 — tệ hơn ~3,5 điểm). P2-192 §1.4 đã ghi đúng trade-off này trên flat20 của họ: s=0,5 frame 3 +12,9 → **+16,5** (tệ hơn +3,6) — số của P4 khớp hướng và độ lớn. Hướng thật là alpha thích nghi theo mức nhiễu ước lượng (nợ mới của P2, §5.6) — không làm trong đợt này.

### 4.2 S6b-analytic CHƯA ĐẠT — BY DESIGN, không phải lỗi chưa sửa

Check này đo mapping `sourceTimeAt` + floor, mà P3 **không sửa** `sourceTimeAt` — P3 sửa ở tầng seek (`reverseSeekTarget` −1ms). Analytic vẫn +1 ở mọi biên là đúng thiết kế; cái người dùng thấy là seek thật — và **S6b-headed ĐẠT 9/9**. Từ đợt sau, S6b-analytic nên ghi là "mapping gốc (không verdict)" hoặc bỏ khỏi tổng, để S6b-headed làm check quyết định duy nhất.

## 5. Giới hạn + nợ mở (trung thực)

1. Telephone lệch gain dải giữa (max +2,60 dB @440Hz) — P1 chưa implement; đề xuất bù g=0,76 chờ parent quyết (§14.2-192).
2. Pitch −12 @220Hz lệch +1,5 st (sim +1,36) — giới hạn nội tại của shifter 2-delay (lược phổ); AM ở 220Hz 0,30–0,52.
3. Warm-up bậc 2 chỉ đúng trên flat15; trên flat20 s=0,5 frame 3 tới +16,5 (P2 §1.4) — cần alpha thích nghi theo mức nhiễu (nợ P2 §5.6). Steady-state blend cũng lệch theo mức nhiễu (F-191-P4-2; fixture σ=15 ΔY +5..+8).
4. Deint bob đạt XẤP XỈ, chưa KHỚP (MAD 3,26 vs yadif); bob-nearest tốt hơn (MAD 2,55 trên fixture P2) nhưng chưa ship (cần tắt smoothing ở bước upscale cuối — nợ P2 §5.5). Tap kèm denoise/stabilize vẫn là tap +0,5px cũ; `deinterlace: {mode: 1}` không thể hiện trong preview.
5. Sharpen trên nội dung nhiễu chưa KHỚP (MAD ~1,0, le8 ~99% — sát ngưỡng nhưng chưa qua; P2-192 §2: kernel đã gần tối ưu, giới hạn mô hình Y_est).
6. Reverse **chưa mượt**: bước lùi đều (S8 ĐẠT) nhưng fps thật chưa đạt 30 — P3: prefetch bật đầy đủ vẫn không thắng dưới tải 8–11 (median dense ON 1,40 vs OFF 1,51); baseline 0,08 fps trên fixture 300 frame/1 GOP. S8 chỉ kiểm bước đều + dụng cụ đo, không phải verdict "đã mượt".
7. Nợ đo: AM pitch @220Hz −12 chưa đo headed (chỉ sim); flat40 không đo lại đợt này (overstate tới +68,8 điểm ở s=1,0, đợt 191).

## 6. File đổi (stage)

- `apps/web/src/lib/parityHarness192.ts` (mới — harness 42 case + sim bob/deint + N1/N2/N3/N4/N5/S6b-headed)
- `apps/web/src/lib/parityHarness192.test.ts` (mới — 10 test helper)
- `scripts/parity192-run.mjs`, `scripts/parity192-run-test.mjs` (mới — runner)
- `apps/web/tsconfig.json` (thêm 1 exclude test; hợp nhất với P1/P3)
- `docs/PHASE9_ROUND192_P4_PARITY_VERIFY_LIMITS.md` (file này)
