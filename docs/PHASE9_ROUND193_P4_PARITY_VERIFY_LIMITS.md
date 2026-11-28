# PHASE 9 ĐỢT 193 — P4: Harness parity độc lập (render-vs-preview) — 42/44 ĐẠT

## 0. Verdict + snapshot

**Verdict: 42/44 ĐẠT + 1 GHI NHẬN (không verdict).** 33 check cũ (S1–S8): 32/33 ĐẠT (S6b-analytic đổi thành GHI NHẬN theo P4-192 §4.2 — không tính vào tổng). 12 check mới: 10/12 ĐẠT (N1 telephone ĐẠT sau bù g=0,76; N2c triệt răng 220 Hz ĐẠT; N6 scrub-ngược-biên ĐẠT; S2-warmup-s0.5 ĐẠT sau warm-up thích nghi của P2; N5 deint ĐẠT với bob-nearest; N7 audio-đảo-clip-dài ĐẠT; CHƯA ĐẠT: N2a-sim + N2-headed-pitch — cùng nguyên nhân AM 440 Hz vượt bar sau W=0,08).

- Harness: `apps/web/src/lib/parityHarness193.ts` + runner `scripts/parity193-run.mjs`, chạy cuối **22:09:21Z** (sau khi cả 3 luồng P1/P2/P3 đóng cờ); JSON đầy đủ ở `hidden_files/parity193/parity193-report.json` (45 entry: 44 verdict + 1 GHI NHẬN). Headed đo bằng Chromium 1254 (headless, CDP): voice 21:08:18Z (đo lại sau khi sửa probe — xem F-193-P4-2), seek 20:56:47Z (chạy lại với offset 1 ms đúng — xem F-193-P4-3), audio clip 70 s 22:07:18Z (chạy lại probe của P3, xem §2.7).
- Snapshot đĩa lúc đo cuối: P1 đóng cờ 21:00Z (`previewVoiceFx.ts` g=0,76 + W=0,08); P2 đóng cờ ~21:44Z (`enhancePreview.ts` 21:31:57Z, `preview.tsx` 21:36:00Z — warm-up thích nghi + bob-nearest + bob-first); P3 đóng cờ 21:56Z (`reverseAudio.ts` 21:24:13Z, `reverseAudioWiring.ts` 21:47:33Z, `reversePlayback.ts` 21:08:03Z, `seek.ts` 21:07:30Z — scrub lùi 1 ms + audio cửa sổ 30 s tới 600 s + crossfade). T4 attempt3 chạy 21:22Z–21:30Z — mọi lần đo nặng của P4 đều chạy ngoài cửa sổ attempt (kiểm lock trước mỗi lần chạy, xem F-193-P4-4).
- Tiêu chí pixel: KHỚP = MAD≤2 & le8≥99%; XẤP XỈ = MAD≤20 & le32≥90%.

## 1. Bảng 33 check cũ (S1–S8) — 32/33 ĐẠT + 1 GHI NHẬN

| Check | Kết quả | Số đo chính |
|---|---|---|
| S1-sharpen-t0.5 | ĐẠT KHỚP | MAD 0,521, PSNR 48,02, le8 99,38% |
| S1-sharpen-t1 | ĐẠT KHỚP | MAD 0,586, PSNR 47,04, le8 99,38% |
| S2-denoise-s0.3 | ĐẠT XẤP XỈ | MAD 3,16, le32 100%, ΔY +4,97 điểm |
| S2-denoise-s0.5 | ĐẠT XẤP XỈ | MAD 3,91, le32 100%, ΔY +8,03 |
| S2-denoise-s0.8 | ĐẠT XẤP XỈ | MAD 3,29, le32 100%, ΔY +7,29 |
| S2-denoise-s1 | ĐẠT XẤP XỈ | MAD 2,95, le32 100%, ΔY +6,74 |
| S2-warmup-s0.3 | ĐẠT | max \|Δ\| **1,16** (f0 1,16 / f1 0,44 / f2 0,19) — đợt 192: 4,95 |
| S2-warmup-s0.5 | **ĐẠT** | max \|Δ\| **0,93** (f0 0,93 / f1 0,93 / f2 0,52) — đợt 192: **8,82**; σ̂ 9,73–9,81, k 0,80 (xem §2.5 + F-193-P4-6) |
| S2-warmup-s0.8 | ĐẠT | max \|Δ\| **1,18** (f0 −1,18 / f1 −0,94 / f2 −0,58) — đợt 192: 4,03 |
| S2-warmup-s1 | ĐẠT | max \|Δ\| **1,25** (f0 −1,25 / f1 −0,25 / f2 0,06) — đợt 192: 2,95 |
| S2-plan | ĐẠT | alpha 0,486, blurPx 3 (không σ̂ — hành vi cũ) |
| S3-noise-t0.5 | ĐẠT | std ratio 1,011/1,004/1,004; Δkurt 0,061; Δcorr 0,011 |
| S3-noise-t1 | ĐẠT | std ratio 1,015/1,013/1,010; Δkurt 0,129; Δcorr 0,011 |
| S4-voice-pitch+12 | ĐẠT | đỉnh 880 Hz đúng |
| S4-voice-pitch-12 | ĐẠT | đỉnh 220 Hz đúng |
| S4-voice-pitch+7 | ĐẠT | đỉnh 659,48 Hz (sai 0,03%) |
| S4-voice-robot | ĐẠT | sideband/carrier 0,296 |
| S4-voice-telephone | ĐẠT | att 100Hz −19,14 dB; 1000Hz −0,07; 5000Hz −7,83; 8000Hz −16,37 |
| S4-voice-echo | ĐẠT | echo ratio 0,625 |
| S4-voice-chain | ĐẠT | chain dài 129 ký tự, đủ 4 filter |
| S5-voice-preview | ĐẠT | **35/35** tham số khớp (kỳ vọng cập nhật theo hằng mới — xem F-193-P4-1) |
| S6-control-forward | ĐẠT | MAD 0 |
| S6a-reverse-midframe | ĐẠT | MAD 0 (6 mốc) |
| S6b-reverse-boundary | **GHI NHẬN** | MAD 25,5–33,2, lệch +1 ở mọi biên k>0 — mapping gốc, KHÔNG VERDICT (xem §4.2) |
| S6-reverse-speed2 | ĐẠT | MAD 0 |
| S7-areverse-render | ĐẠT | max diff 0 (đảo mẫu chính xác) |
| S7b-reverse-audio-logic | ĐẠT | đảo mẫu + offset + player đoạn; clip 61 s load cửa sổ [31,61] (xem §2.7); clip 601 s vẫn từ chối |
| S7c-reverse-audio-wiring | **ĐẠT** | wiring nhắc 8 lần, `wiring.tick` 1, `loadReversed` 3 (gồm 2 windowed), `playSegment` 2 |
| S7d-reverse-audio-mapping | ĐẠT | sourceTimeAt(0,25s) = 0,75 |
| S8-reverse-steps | ĐẠT | 60 bước đều, sai số 0, chạm 0 đúng bước 60 |
| S8-decode-ahead-gate | ĐẠT | chặn mặc định, chỉ mở khi đủ bằng chứng |
| S8-cadence-tracker | ĐẠT | dụng cụ đo đúng (median 30ms/p90 40ms) — KHÔNG claim mượt |
| S8-proxy-direction | ĐẠT | yes/no đúng điều kiện |

Ghi chú S2: fixture Y-std 11,226 (nhiễu hơn flat15 của P2 là 8,25) nên ΔY +5..+8 điểm — cùng hiện tượng F-191-P4-2 (blend hiệu chuẩn theo mức nhiễu); verdict theo tier MAD nên vẫn ĐẠT.

## 2. Check mới — 10/12 ĐẠT

### 2.1 N1 telephone gain sau bù g=0,76 (headed) — ĐẠT (check quyết định của đợt)

Đo headed qua `createVoiceChain` thật (OfflineAudioContext 48kHz, tín hiệu 5-tone) so với render ffmpeg trên cùng tín hiệu. Preview (dB): 100Hz −20,93; 440Hz −0,64; 1000Hz −1,54; 5000Hz −7,78; 8000Hz −17,93. Δ (preview − render): 100Hz **−1,79**; 440Hz **+0,22**; 1000Hz **−1,48**; 5000Hz **+0,05**; 8000Hz **−1,55** dB. Max |Δ| = **1,79 dB** (bar ≤2 dB) → **ĐẠT**. Khớp bảng 9 điểm của P1-193 §1.2 trong 0,01 dB ở cả 5 điểm đo (P1: −1,78/+0,22/−1,47/+0,06/−1,55) và khớp dự đoán minimax (max ≈1,8 dB @100Hz). Số 2,60 dB @440Hz trong brief là số TRƯỚC bù (P1-193 §1.3 đính chính đúng — sau bù 440Hz chỉ +0,22 dB). Đo lặp 2 lần KHỚP Y HỆT (deterministic, P1 §3 + P4 đo 20:55Z và 21:08Z cho cùng previewDb từng điểm).

### 2.2 N2-headed pitch sau W=0,08 — CHƯA ĐẠT (AM 440 Hz vượt bar — trade-off đã ghi của P1)

Đo headed bằng phương pháp P1-193 §2.2 (render 4 s, cửa sổ [1,0, 3,5)s, đỉnh phổ Goertzel 0,25 Hz + nội suy parabol log-mag — xem F-193-P4-2):

| Điểm | Tần trội đo | Sai số | AM | Sideband |
|---|---|---|---|---|
| 440 +12 | 889,91 Hz | +0,19 st | **0,370** | 0,004 |
| 440 −12 | 215,13 Hz | −0,39 st | **0,721** | 0,037 |
| 440 +7 | 664,35 Hz | +0,13 st | 0,419 | 0,031 |
| 440 −7 | 290,44 Hz | −0,19 st | 0,612 | 0,017 |
| 220 +12 | 444,87 Hz | +0,19 st | 0,171 | 0,016 |

Khớp bảng 24 điểm của P1-193 §2.2 trong 0,02 st / 0,01 AM ở mọi điểm đo (chênh lớn nhất: 440/−12 AM 0,721 vs P1 0,72). Tần trội 440 Hz y hệt baseline W=0,04 (215/290,3/327,1/414,7/466,8/590,7/664,2/890) — W=0,08 KHÔNG cải thiện sai lượng tử hoá ở 440 Hz vì răng xen kẽ bị triệt (P1 §2.4: 440×0,08 = 35,2, phần lẻ khiến răng mới vắng mặt). AM 440 Hz 0,37–0,72 (trước 0,10–0,30) **vượt bar AM ≤ 0,35** → CHƯA ĐẠT theo bar đứng. Đây là trade-off có chủ đích của P1 (đổi AM@440 lấy sai số@220 — xem §2.3), KHÔNG phải hồi quy bất ngờ; bar không nới để cho qua. Hướng triệt để vẫn là PSOLA/AudioWorklet + FFT (nợ P1 §5).

### 2.3 N2c triệt răng sine trầm 220 Hz — ĐẠT (claim headline của P1)

| Điểm | Tần trội đo | Sai số | AM | P1-193 §2.2 |
|---|---|---|---|---|
| 220 −12 | **107,63 Hz** | **−0,38 st** | 0,156 | 107,5 Hz / −0,40 st / 0,16 |
| 220 −7 | 145,16 Hz | −0,20 st | 0,389 | 145,2 Hz / −0,20 st / 0,39 |
| 880 +12 | 1754,87 Hz | −0,05 st | 0,169 | 1755 Hz / −0,05 st / 0,17 |
| 880 −12 | 442,38 Hz | +0,09 st | 0,231 | 442,5 Hz / +0,10 st / 0,23 |

Triệt răng ĐÃ SỬA: 220/−12 từ 120 Hz (+1,51 st, đợt 192) về 107,63 Hz (−0,38 st) — đúng răng lược gần mục tiêu nhất với W=0,08 (khoảng răng 6,25 Hz); AM 0,51 → 0,16. 880 Hz cũng tốt lên (sai tệ nhất 0,40 → 0,10 st). Tiêu chí verdict: 220/−12 |err| ≤ 0,5 st + AM ≤ 0,7 (bar không hồi quy như +12@220).

### 2.4 N2a pitch artifact (sim) — CHƯA ĐẠT (AM sim 0,53 > 0,35 — sim nay khớp Chrome)

Sim 2-delay (hằng số từ code thật, W=0,08): +12 → 889 Hz (+0,18 st), AM 0,453; −12 → 215 Hz (−0,40 st), AM 0,525; +7 → 663,5 (+0,11 st); −7 → 289,6 (−0,24 st); sideband tệ nhất 0,160. Sai số cao độ vẫn ≤0,40 st (bar ≤0,5 ✓) nhưng **AM tệ nhất 0,534 > bar 0,35** → CHƯA ĐẠT. Lưu ý quan trọng: sim KHÔNG sai — nó khớp số Chrome đo bằng phương pháp P1 (sim +12 889 vs Chrome 890; −12 215 vs 215; AM sim 0,45–0,53 vs Chrome 0,37–0,72, cùng khoảng). Sim chỉ là mô hình xấp xỉ nên AM lệch ~0,1–0,2 so với Chrome ở từng điểm, nhưng verdict theo cùng bar thì đồng nhất (cả sim lẫn headed đều CHƯA ĐẠT ở AM@440). N2b-sim (220 Hz): ĐẠT — +12 → 445 Hz (+0,20 st, AM 0,127); −12 → 107 Hz (−0,48 st, AM 0,136), khớp headed N2c trong 0,1 st.

### 2.5 S2-warmup thích nghi (P2-193 §1) — ĐẠT (sửa lớn nhất đợt này)

Harness nay truyền σ̂ ước lượng của fixture (đúng estimator P2 dùng trong preview) làm đối số thứ 6 của `enhancePreviewPlan` — không truyền = đo hành vi cũ k=1 (xem P2-193 §1.4 + F-193-P4-6). Fixture σ=15 của P4 (Y-std 11,23): σ̂ đo được **9,73–9,81** (không phải 11,2 như P2 dự đoán — xem F-193-P4-6), k(0,5) ≈ 0,80, k(0,3) ≈ 0,75, k(0,8) ≈ 0,87, k(1,0) ≈ 0,88.

| s | max \|Δ\| đợt 193 | đợt 192 | σ̂ | k |
|---|---|---|---|---|
| 0,3 | **1,16** | 4,95 | 9,73–9,81 | 0,75 |
| 0,5 | **0,93** | 8,82 | 9,73–9,81 | 0,80 |
| 0,8 | **1,18** | 4,03 | 9,73–9,81 | 0,87 |
| 1,0 | **1,25** | 2,95 | 9,73–9,81 | 0,88 |

Tất cả trong bar 5,5 với biên lớn (tệ nhất 1,25). P2 dự đoán S2-warmup-s0.5 về ~0,6–1,5 — đo được 0,93, khớp. Alpha hiệu dụng f2 s=0,5: 0,388 (trước 0,486×w=1). N3 trên flat15seq của P2 (σ̂ 8,32 → k≈1): f2 −0,72/−0,01/−1,10/+0,74, tệ nhất 1,10 — vẫn ĐẠT (bar |Δ s=0,8| ≤ 2, max ≤ 5,5); s=0,8 tệ hơn đợt 192 một chút (−0,51 → −1,10) do warm-up nay đánh giá tại a·k — trong bar, không phải hồi quy.

### 2.6 N3/N4/N5 — ĐẠT

- **N3 denoise frame 3 — ĐẠT** (xem §2.5; hàng phụ flat15-like Gauss RGB vẫn −7,97 ở s=0,5 — như đợt 192, không phải verdict; fixture này khác cấu trúc nhiễu so với flat15seq của P2, xem F-192-P4-4).
- **N4 sharpen nhiễu — ĐẠT** (tier XẤP XỈ, `applySharpen` KHÔNG ĐỔI theo quyết P2-193 §2): t=0,5 MAD 0,966, PSNR 43,67, le8 99,00%; t=1,0 MAD 1,111, PSNR 42,74, le8 98,80% — y hệt đợt 192.
- **N5 deint bob-nearest — ĐẠT XẤP XỈ, CẢI THIỆN RÕ**: bob MAD vs yadif **2,690** (đợt 192 bilinear: 3,258), PSNR 23,33, le8 **94,57%** (trước 89,77%), le32 96,01%; R: src 4,961 / clean 2,510 / yadif 2,481 / **preview 2,385** (|ΔR|/R = 3,9% ≤ 15%, trước 13,2%). Khớp dự đoán P2-193 §3.1 (MAD ~2,55, le8 ~95% trên fixture của P2). Vẫn tier XẤP XỈ (cần MAD ≤2 & le8 ≥99% mới KHỚP — giới hạn bob, không phải hồi quy). Bob-first (bỏ tap +0,5px) không đo riêng trong sim N5 — P2 đo 12/12 ô thắng (LIMITS §3.2); harness đợt sau nên thêm ô bob-first.

### 2.7 N6 scrub ngược + N7 audio đảo clip dài — ĐẠT

**N6 scrub ngược tại biên — ĐẠT** (hàm thuần + mapping + wiring): 6/6 biên k=0/1/15/30/45/59, worst offset 0; executor preview.tsx dùng `reverseScrubSeekTarget` 1 lần + cờ `reverseScrub: true` 1 lần; seek.ts có cờ per-target + không snap khi cờ bật + so frame bằng floor. P3-193 đo headed đường scrub THẬT (End + ArrowLeft, bundle trước/sau): **0/4 → 4/4** biên đúng, ct lùi đúng 1 ms (1,499/0,999/0,499/0,0323), MAD 0,3–0,5 (LIMITS P3 §1.3) — mạnh hơn N6 của P4 (N6 không lái UI scrub thật). Giới hạn: chưa đo scrub ngược trên clip dense/GOP dài.

**N7 audio đảo clip dài — ĐẠT** (fake-ctx + wiring): clip 100 s load cửa sổ **[60,90]** đúng (durationSec vẫn 100; data đầu ≈ 90 s, cuối = 60 s); playSegment offset tuyệt đối 75 s → start 15 s đúng; ngoài cửa sổ (95 s) từ chối; đoạn cũ stop ở **t0+0,08 s** (crossfade); wiring có đủ cơ chế (loadReversedWindow 2, longClips 4, counters 16, restart-exact 7, cổng 600 s 2). S7b cập nhật theo thiết kế mới: clip 61 s load cửa sổ [31,61] (không còn bị từ chối như đợt 192), chỉ clip 601 s mới từ chối — xem F-193-P4-7.

**N7-headed — clip 70 s ĐÃ PHÁT (P4 chạy lại probe headed của P3, 22:07:18Z, load 3,0–3,9):** chirp 70 s, 24/24 mẫu trong pass có tiếng (RMS 0,29–0,61, **0 mẫu lặng**), loaded=1, longClips=["c_vkg2pqz"]; peakHz sau 3 mẫu transient đầu (345/366/366 Hz — dư âm pass xuôi) GIẢM **2950 → 2562 Hz** theo playhead lùi 01:08.2 → 00:58.2 (kỳ vọng chirp đảo ~2977 → 2549 Hz — khớp trong độ phân giải bin 23,4 Hz); đối chứng xuôi peakHz 301–323 Hz, RMS 0,671 hằng. Lần chạy đầu 22:06Z cho cùng mẫu hình (2885 → 2606 Hz, 0 lặng). **Xác nhận độc lập claim "hết mute" của P3** (P3 §2.4C: 53/55 mẫu có tiếng, peakHz 2972 → 2519).

**NHƯNG — F-193-P3-1/2 được P4 xác nhận độc lập từ cùng lần chạy headed:** counters cuối pass: tick=710, **holdStop=358 (~50%)**, playOk=304, **restart=0, restartExact=0** — crossfade + restart-exact KHÔNG BAO GIỜ kích hoạt headed (mọi lần play đều sau hold-stop, segActive=false); badge nhấp nháy "audio đảo"/"không audio" theo hold. Tiếng liền ở độ phân giải probe (RMS 200 ms) là nhờ restart nhanh sau mỗi hold (< 43 ms cửa sổ analyser), KHÔNG phải nhờ crossfade. Kết luận "liền mạch" của audio đảo vẫn CHƯA chứng minh được headed — cần cửa sổ rảnh riêng + ghi waveform (nợ P3 §5.1/5.2, cần quyết parent về gating).

### 2.8 N8 reverse mượt — CHƯA KIỂM ĐƯỢC (ghi rõ, không kết luận)

P3 A/B dense đợt này (fixture dense-gop-ramp191, GOP 30, 1280×720, 10 s; log `ab-dense-193.log` 20:48–20:52Z): fps ngược **0,39 / 0,64 / 0,41 / 0,42**, presentedFps 1,5–2,1, stalls >250 ms 14–17, **không lượt nào giữ load < 3 suốt pass** (load đầu→cuối 3,34→7,06 / 8,34→9,25 / 9,31→7,30 / 6,69→4,13). P4 KHÔNG chạy lại A/B (cùng cell, cùng tải — sẽ thất bại cùng cách; T7/T9 vẫn chạy song song) mà đối chiếu log + S8-cadence-tracker (dụng cụ đo ĐẠT, xem §1). **KHÔNG kết luận gì về prefetch; KHÔNG sửa prefetch** — đúng chỉ đạo §13-192. Nguyên nhân đã rõ (decode cửa sổ phần mềm serial dưới tải — mảng Hiệu suất) vẫn giữ nguyên. Cần cửa sổ rảnh riêng (không chạy song song các luồng đợt) hoặc metric tải khác để đo lại (P3 §3).

## 3. tsc / build / test

- `npx tsc --noEmit` (apps/web): **0 lỗi** lúc 22:05Z (sau khi P3 sửa xong lỗi duplicate identifier — xem F-193-P4-5).
- `npm run build` (tsc && vite build): **PASS** (14,74 s; cảnh báo chunk >500 kB có sẵn, không liên quan; bundle `index-QQibQhig.js` như P3).
- Test helper harness: **11/11 PASS** (mới: khóa AM sim +12@440 theo W=0,08 + khóa bob-nearest line doubling — xem F-193-P4-1/§2.6).
- Test P1: `previewVoiceFx.test.ts` **27 pass**; `audioEngineVoiceFx.test.ts` **8 pass**; `test-audioengine.sh` **56 pass** (P1-193 §3, P4 chạy lại 2 suite đầu 21:02Z: 27/8/56 đều xanh).
- Test P2: 11 suite enhance **155/155 pass** (P2-193 §6.3).
- Test P3: seek 21, seek193P3 6/6, reversePlayback 10/10, reversePlayback191P3 7, reversePlayback192P3 13, reversePlayback193P3 5/5, reverseAudio 7, reverseAudio192P3 12/12, reverseAudio193P3 16/16, reverseCadence 9 — đều PASS (P3-193 §4).
- `tsconfig.json`: thêm `parityHarness193.test.ts` vào exclude (nối sau entry `parityHarness192.test.ts` — đã hợp nhất, không ghi đè). P3 thêm exclude 3 test mới của họ vào cùng file (không đụng entry của P4).

## 4. Phát hiện (F-193-P4-*)

- **F-193-P4-1 — Kỳ vọng S5 lỗi thời theo 2 hằng mới của P1, không phải code sai.** `pitchOsc*.freq` kỳ vọng 25 Hz và `pitchSawGain` ∓0,02×50/43 là giá trị W=0,04; `telWet` kỳ vọng 1 là giá trị TRƯỚC bù g=0,76. P1-193 đổi cả hai (W=0,08; telWet=0,76) nên baseline đo được 27/35 tham số khớp, 8 lệch đều giải thích được đúng bằng hằng mới (osc 12,5 Hz = 1/0,08; sawGain ±0,0465 = 0,04×50/43; telWet 0,76). Đã sửa harness: kỳ vọng suy ra từ `PITCH_WINDOW_S` + `TELEPHONE_WET_GAIN_COMP` đọc từ code thật (không hardcode W) → S5 **35/35**. Cùng mẫu lỗi F-192-P4-2 (kỳ vọng cứng theo code cũ). Test helper khóa AM sim +12@440 cập nhật <0,2 → <0,5 (sim cho 0,453 với W=0,08 — khóa giá trị mới, không phải bar sản phẩm).
- **F-193-P4-2 — Probe headed voice cũ đo SAI sau khi W → 0,08 (lỗi đo của P4, đã sửa + đo lại).** Bản probe đợt 192: render sine 1 s, đo trên cửa sổ [0,2, 1,0)s, đỉnh phổ Goertzel bước 1 Hz (không nội suy), fLfo cứng `/0,04`. Sau khi W → 0,08, bản đó đo +12@440 = 874 Hz (−0,12 st, AM 0,115) trong khi phương pháp chuẩn của P1 (render 4 s, cửa sổ [1,0, 3,5)s, FFT zero-pad 2^18 + nội suy parabol) cho 890 Hz (+0,20 st, AM 0,37) — lệch 16 Hz ở tần trội và 3× ở AM. Nguyên nhân: cửa sổ ngắn bắt transient khởi động (LFO/delay chưa ổn định) + bước phổ thô + fLfo sai (12,5 Hz thay vì 25 Hz) nên sideband cũng sai. Đã viết lại probe theo đúng phương pháp P1-193 §2.2 (Goertzel 0,25 Hz + nội suy parabol log-mag ≈ FFT của P1; fLfo từ `PITCH_WINDOW_S`; thêm 4 điểm 220/−12, 220/−7, 880/±12) và đo lại 21:08:18Z: khớp bảng 24 điểm của P1 trong 0,02 st / 0,01 AM ở mọi điểm (9/9 điểm đối chiếu được). **Bài học: khi P1 đổi hằng số thời gian (W), probe headed phải đổi theo phương pháp đo của P1 — không dùng lại cửa sổ/phương pháp cũ rồi kết luận.** Số N2-headed bản probe cũ (ĐẠT, AM 0,216) đã HỦY, thay bằng số mới (CHƯA ĐẠT, AM 0,721) — xem §2.2.
- **F-193-P4-3 — Headed-seek script đọc nhầm config (lỗi copy của P4, đã sửa + đo lại).** `headed-seek-check193.mjs` vẫn đọc `headed-seek-targets192.json` (sed `seek192` không match chuỗi `targets192`) nên lần chạy đầu dùng offset mặc định frameDur/2 thay vì 1 ms — vẫn cho offset 0 ở cả 9 target (frameDur/2 cũng lọt vào frame trước ở các biên này) nên không phát hiện được bằng verdict. Đã sửa đường dẫn config + chạy lại: offset 1 ms đúng, 9/9 offset 0, raw +1/+1. (Cảnh báo chung như F-192-P4-5: lần chạy "xong nhanh" hoặc config mặc định phải kiểm tra output, không tin exit code.)
- **F-193-P4-4 — T4 attempt3 chạy trong lúc P4 chờ P2/P3 (21:22Z–21:30Z).** Mọi lần đo nặng của P4 (harness sim, headed Chrome, vite build) đều chạy NGOÀI cửa sổ attempt: kiểm `poll-t4.log` (lock=khong, chưa attempt) trước mỗi lần chạy; lần đo cuối chốt sau khi attempt3 xong (attempt3 không hợp lệ — class B, poller thoát). Không chồng lấn pha (b).
- **F-193-P4-5 — P3 làm vỡ tsc giữa chừng, đã sửa xong trước khi đóng cờ (21:16–21:47Z).** `reverseAudio.ts` duplicate identifier `windowStartSec`/`windowEndSec` (dòng 185/186/221/226) + `reverseAudioWiring.ts(334,34)` truy cập private `windowStartSec` — do P3 đang sửa audio >60 s (getter `windowStartSec`/`windowEndSec` mới trùng tên biến cục bộ). P4 KHÔNG tự sửa code P3; chờ P3 đóng cờ rồi kiểm lại: tsc 22:05Z **0 lỗi** (P3-193 §4 xác nhận). Bài học: tsc giữa đợt của luồng khác không phải tín hiệu lỗi cuối — chỉ verdict tsc sau khi luồng đó đóng cờ mới có giá trị.
- **F-193-P4-6 — σ̂ đo được 9,8, không phải 11,2 như P2 dự đoán (hiệu chuẩn estimator, không phải lỗi P2).** P2-193 §1.4 dự đoán fixture σ=15 của P4 (Y-std 11,23) → σ̂≈11,2 → k(0,5)≈0,63. P4 đo σ̂ = **9,73–9,81** (k≈0,80) bằng đúng estimator của P2 trên frame giải mã. Nguyên nhân: hằng 1,30 (E ≈ 1,30·σ) hiệu chuẩn trên fixture nhiễu YUV của P2 (`noise=alls`, nhiễu cả chroma theo khối 2×2 làm tăng E — E/σ đo 1,30), còn fixture của P4 là nhiễu Gauss RGB độc lập từng kênh → sau YUV round-trip, E/σ_luma = 1,128 (lý thuyết Gauss: √2·√(2/π)) → σ̂ = 11,23×1,128/1,30 = 9,75 ✓ khớp số đo. Hệ quả thực tế: k áp dụng 0,80 thay vì 0,63 — nhưng S2 vẫn ĐẠT với biên lớn (max 0,93 vs bar 5,5) vì warm-up bậc 2 đánh giá tại a·k vẫn đủ gần; trên footage thật (nhiễu YUV từ camera/encode) hiệu chuẩn 1,30 mới là đúng — fixture RGB của P4 là trường hợp biên. Trên flat15seq của P2, σ̂ đo 8,32 (P2: 8,26) — hiệu chuẩn đúng trên fixture YUV. **Bài học: khi P2 hiệu chuẩn estimator trên fixture YUV, harness P4 dùng fixture RGB phải đo σ̂ thật thay vì tin số dự đoán — và ghi rõ loại fixture khi đối chiếu.**
- **F-193-P4-7 — S7b cũ assert "clip 61 s bị từ chối" nay SAI về hành vi người dùng (kỳ vọng lỗi thời, đã sửa).** P3-193 đổi cổng: clip 61–600 s load theo cửa sổ thay vì mute; chỉ > 600 s mới mute. Harness S7b cũ (kế thừa đợt 192) assert `loadReversed(61s) === false` — vẫn đúng ở tầng player không-cửa-sổ, nhưng sẽ khiến người đọc kết luận sai "clip 61 s không phát". Đã cập nhật S7b: `loadReversed` 61 s vẫn false (cổng cũ giữ nguyên) + `loadReversedWindow` 61 s true, cửa sổ [31,61], durationSec 61 + 601 s false; thêm N7 kiểm cửa sổ + offset tuyệt đối + crossfade. Cùng mẫu lỗi F-193-P4-1 (kỳ vọng cứng theo thiết kế cũ): **mỗi đợt, khi luồng sản phẩm đổi cổng/ngưỡng, P4 phải đọc LIMITS của họ trước rồi mới chạy harness — không chạy harness cũ lên code mới rồi tin verdict.**

### 4.2 S6b-analytic GHI NHẬN — BY DESIGN, không phải lỗi chưa sửa

Check này đo mapping `sourceTimeAt` + floor, mà P3 **không sửa** `sourceTimeAt` — P3 sửa ở tầng seek (`reverseSeekTarget` −1ms, đợt 192) và tầng scrub (`reverseScrubSeekTarget`, đợt 193). Analytic vẫn +1 ở mọi biên là đúng thiết kế; cái người dùng thấy là seek thật (S6b-headed ĐẠT 9/9) và scrub thật (N6 ĐẠT 6/6 + P3 headed 4/4). Từ đợt này, S6b-analytic ghi là "mapping gốc (không verdict)" và KHÔNG tính vào tổng (42/44 + 1 GHI NHẬN) — đúng đề xuất P4-192 §4.2.

## 5. Giới hạn + nợ mở (trung thực)

1. Telephone ĐẠT bar sau bù (max |Δ| 1,79 dB @100Hz) — nhưng 100 Hz vẫn −18% và 1000 Hz −16% (bù scalar không triệt được bướu RBJ — P1-192 §2.3).
2. Pitch W=0,08: AM 440 Hz 0,37–0,72 vượt bar 0,35 (trade-off đổi lấy sine trầm); răng xen kẽ bị triệt ở 440 Hz (f0·W = 35,2); trễ pitch 20 → 40 ms chưa đo lip-sync; AM 880/±1 tới 0,82 (cả baseline — LFO 0,70 Hz, không phải hồi quy do W).
3. Warm-up thích nghi ĐẠT trên fixture P4 (max 1,25) — nhưng σ̂ hiệu chuẩn trên fixture YUV, fixture RGB của P4 đo thấp hơn 13% (F-193-P4-6); lưới k hiệu chuẩn ở 320×180, chưa kiểm khổ lớn (P2 §5.4).
4. Deint bob-nearest vẫn tier XẤP XỈ (MAD 2,69, le8 94,6% — cần ≤2 & ≥99% mới KHỚP); `mode: 1` @60fps vẫn gap (MAD 3,31 top-only / 2,80 luân phiên vs yadif mode=1 — cần fps nguồn, nợ thêm fps vào `MediaItem`, P2 §3.3); bob-first chưa đo riêng trong sim N5.
5. Sharpen trên nội dung nhiễu chưa KHỚP (MAD ~1,0, le8 ~99% — sát ngưỡng nhưng chưa qua; giới hạn Y_est, cần YUV native — nợ lớn, P2 §2.2).
6. Audio đảo: crossfade + restart-exact chỉ chứng minh ở unit/fake-ctx — headed restart=0 (F-193-P3-1, P4 xác nhận độc lập); tiếng bị gating ~25 Hz bởi hold-stop (F-193-P3-2); cần quyết parent (giữ gating hay cho audio chạy xuyên hold) + cửa sổ rảnh đo waveform. Badge nhấp nháy theo hold. Decode cửa sổ file ~600 s có thể > 5 s (chưa đo). Clip > 600 s vẫn mute.
7. Reverse **chưa mượt**: N8 CHƯA KIỂM ĐƯỢC (fps ngược 0,39–0,64 dưới tải; không lượt nào giữ load < 3 — xem §2.8).
8. Nợ đo: nghe bằng tai người trên clip voice thật (chưa làm); Firefox/Safari (hằng số 50/43 + RBJ đo trên Chrome 158); scrub ngược trên clip dense/GOP dài (chưa đo).

## 6. File đổi (stage)

- `apps/web/src/lib/parityHarness193.ts` (mới — harness 45 entry: 44 verdict + 1 GHI NHẬN; S5 kỳ vọng theo hằng code thật; S2/N3 truyền σ̂ thích nghi; N5 bob-nearest; S7b cập nhật cổng clip dài; N2c + N6 + N7 mới; S6b-analytic thành GHI NHẬN)
- `apps/web/src/lib/parityHarness193.test.ts` (mới — 11 test helper: khóa AM sim theo W=0,08 + khóa bob-nearest line doubling)
- `scripts/parity193-run.mjs`, `scripts/parity193-run-test.mjs` (mới — runner)
- `apps/web/tsconfig.json` (thêm 1 exclude test; nối sau entry 192; P3 thêm exclude 3 test mới của họ vào cùng file)
- `docs/PHASE9_ROUND193_P4_PARITY_VERIFY_LIMITS.md` (file này)
