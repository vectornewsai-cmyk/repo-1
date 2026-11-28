# PHASE 9 ĐỢT 194 — P4: Harness parity độc lập (render-vs-preview) — 43/46 ĐẠT

## 0. Verdict + snapshot

**Verdict: 43/46 ĐẠT + 1 GHI NHẬN (không verdict).** 33 check cũ (S1–S8): 32/33 ĐẠT (S6b-analytic GHI NHẬN như đợt 193). 13 check mới: 10/13 ĐẠT (N1 telephone ĐẠT; N2c triệt răng 220 Hz ĐẠT; N5 deint ĐẠT; N5c bob luân phiên ĐẠT; N6/N7 ĐẠT; CHƯA ĐẠT: N2a-sim + N2-headed-pitch — cùng nguyên nhân AM 440 Hz vượt bar sau W=0,08, trade-off đã quyết; N5b bob-first CHƯA ĐẠT — mới, xem §2.5).

- Harness: `apps/web/src/lib/parityHarness194.ts` + runner `scripts/parity194-run.mjs`, chạy cuối **03:30:25Z** (lần 3 — lần 1 baseline 02:53–02:56Z, lần 2 03:09–03:10Z; cả 3 lần cho cùng số sim từng chữ số); JSON đầy đủ ở `hidden_files/parity194/parity194-report.json` (47 entry: 46 verdict + 1 GHI NHẬN). Headed đo bằng Chromium 1254 (headless, CDP): voice 03:05:37Z, seek 03:06:02Z.
- Snapshot đĩa lúc đo cuối: P1 đóng cờ 03:18Z (KHÔNG đổi code — `previewVoiceFx.ts` giữ nguyên từ 193); P2 đóng cờ 03:24Z (`enhancePreview.ts` 03:00:42Z, `preview.tsx` 03:05:49Z, `media.ts` + assetStore/rehydrate); P3 đóng cờ 03:32Z (`reverseAudioWiring.ts` 02:49:53Z, LIMITS cập nhật 03:32:40Z). Mọi file sản phẩm đều chốt TRƯỚC lần chạy harness cuối.
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
| S2-warmup-s0.3 | ĐẠT | max \|Δ\| **1,16** (σ̂ 9,73–9,81, k 0,75) |
| S2-warmup-s0.5 | ĐẠT | max \|Δ\| **0,93** (σ̂ 9,73–9,81, k 0,80) |
| S2-warmup-s0.8 | ĐẠT | max \|Δ\| **1,18** (σ̂ 9,73–9,81, k 0,87) |
| S2-warmup-s1 | ĐẠT | max \|Δ\| **1,25** (σ̂ 9,73–9,81, k 0,88) |
| S2-plan | ĐẠT | alpha 0,486, blurPx 3 (plan nay 13 key — thêm `deintBobField`, xem §2.6) |
| S3-noise-t0.5 | ĐẠT | std ratio 1,011/1,004/1,004; Δkurt 0,061; Δcorr 0,011 |
| S3-noise-t1 | ĐẠT | std ratio 1,015/1,013/1,010; Δkurt 0,129; Δcorr 0,011 |
| S4-voice-pitch+12 | ĐẠT | đỉnh 880 Hz đúng |
| S4-voice-pitch-12 | ĐẠT | đỉnh 220 Hz đúng |
| S4-voice-pitch+7 | ĐẠT | đỉnh 659,48 Hz (sai 0,03%) |
| S4-voice-robot | ĐẠT | sideband/carrier 0,296 |
| S4-voice-telephone | ĐẠT | att 100Hz −19,14 dB; 1000Hz −0,07; 5000Hz −7,83; 8000Hz −16,37 |
| S4-voice-echo | ĐẠT | echo ratio 0,625 |
| S4-voice-chain | ĐẠT | chain dài 129 ký tự, đủ 4 filter |
| S5-voice-preview | ĐẠT | **35/35** tham số khớp (kỳ vọng suy ra từ `PITCH_WINDOW_S` + `TELEPHONE_WET_GAIN_COMP` đọc từ code thật — W=0,08, telWet=0,76, không hardcode) |
| S6-control-forward | ĐẠT | MAD 0 |
| S6a-reverse-midframe | ĐẠT | MAD 0 (6 mốc) |
| S6b-reverse-boundary | **GHI NHẬN** | MAD 25,5–33,2, lệch +1 ở mọi biên k>0 — mapping gốc, KHÔNG VERDICT (xem §4.5) |
| S6-reverse-speed2 | ĐẠT | MAD 0 |
| S7-areverse-render | ĐẠT | max diff 0 (đảo mẫu chính xác) |
| S7b-reverse-audio-logic | ĐẠT | đảo mẫu + offset + player đoạn; clip 61 s load cửa sổ [31,61]; clip 601 s vẫn từ chối |
| S7c-reverse-audio-wiring | ĐẠT | wiring nhắc 8 lần, `wiring.tick` 1, `loadReversed` 3, `playSegment` 2 (+ counters holdKeep/holdCapStop mới của P3-194, xem §2.7) |
| S7d-reverse-audio-mapping | ĐẠT | sourceTimeAt(0,25s) = 0,75 |
| S8-reverse-steps | ĐẠT | 60 bước đều, sai số 0, chạm 0 đúng bước 60 |
| S8-decode-ahead-gate | ĐẠT | chặn mặc định, chỉ mở khi đủ bằng chứng |
| S8-cadence-tracker | ĐẠT | dụng cụ đo đúng (median 30ms/p90 40ms) — KHÔNG claim mượt |
| S8-proxy-direction | ĐẠT | yes/no đúng điều kiện |

Ghi chú S2: số đo Y HỆT đợt 193 từng chữ số (harness xác định; P2-194 chỉ thêm field `deintBobField` vào plan, không đổi alpha — xem P2-194 §8.6).

## 2. Check mới — 10/13 ĐẠT

### 2.1 N1 telephone gain sau bù g=0,76 (headed) — ĐẠT

Đo headed qua `createVoiceChain` thật (OfflineAudioContext 48kHz, tín hiệu 5-tone) so với render ffmpeg trên cùng tín hiệu. Preview (dB): 100Hz −20,93; 440Hz −0,64; 1000Hz −1,54; 5000Hz −7,78; 8000Hz −17,93. Δ (preview − render): 100Hz **−1,79**; 440Hz **+0,22**; 1000Hz **−1,48**; 5000Hz **+0,05**; 8000Hz **−1,55** dB. Max |Δ| = **1,79 dB** (bar ≤2 dB) → **ĐẠT**. Y hệt đợt 193 từng chữ số (P1-194 không đổi code; bảng telephone 9 điểm của P1-194 §1 cũng khớp y hệt 193, max |Δ| 1,78 dB — lệch 0,01 dB là làm tròn).

### 2.2 N2-headed pitch sau W=0,08 — CHƯA ĐẠT (AM 440 Hz vượt bar — trade-off đã quyết, W GIỮ)

Đo headed bằng phương pháp P1-193 §2.2 (render 4 s, cửa sổ [1,0, 3,5)s, đỉnh phổ Goertzel 0,25 Hz + nội suy parabol log-mag):

| Điểm | Tần trội đo | Sai số | AM | Sideband |
|---|---|---|---|---|
| 440 +12 | 889,91 Hz | +0,19 st | **0,370** | 0,004 |
| 440 −12 | 215,13 Hz | −0,39 st | **0,721** | 0,037 |
| 440 +7 | 664,35 Hz | +0,13 st | 0,419 | 0,031 |
| 440 −7 | 290,44 Hz | −0,19 st | 0,612 | 0,017 |
| 220 +12 | 444,87 Hz | +0,19 st | 0,171 | 0,016 |

Khớp bảng 24 điểm của P1-194 §1 trong 0,02 st / 0,01 AM ở mọi điểm đối chiếu được (P1-194 đo lại 24/24 khớp y hệt 193 — P4 xác nhận độc lập bằng phương pháp đo riêng, không copy bảng P1). AM 440 Hz 0,37–0,72 **vượt bar AM ≤ 0,35** → CHƯA ĐẠT theo bar đứng. Đây là trade-off có chủ đích (quyết (a1)-193: GIỮ W=0,08, không PSOLA), KHÔNG phải hồi quy mới. P1-194 đo thêm Firefox 159: khớp Chrome trong 0,01 st / 0,06 AM — P4 không chạy lại Firefox (ngoài phạm vi harness; ghi nhận số P1).

### 2.3 N2a pitch artifact (sim) — CHƯA ĐẠT (AM sim 0,53 > 0,35 — sim nay khớp Chrome)

Sim 2-delay (hằng số từ code thật, W=0,08): +12 → 889 Hz (+0,18 st), AM 0,453; −12 → 215 Hz (−0,40 st), AM 0,525; +7 → 663,5 (+0,11 st); −7 → 289,6 (−0,24 st); sideband tệ nhất 0,160. Sai số cao độ vẫn ≤0,40 st (bar ≤0,5 ✓) nhưng **AM tệ nhất 0,534 > bar 0,35** → CHƯA ĐẠT. Sim khớp Chrome trong 0,1 st ở mọi điểm (sim +12 889 vs Chrome 890; −12 215 vs 215) — cùng verdict với headed. N2b-sim (220 Hz): ĐẠT — +12 → 445 Hz (+0,20 st, AM 0,127); −12 → 107 Hz (−0,48 st, AM 0,136).

### 2.4 N2c triệt răng sine trầm 220 Hz — ĐẠT

| Điểm | Tần trội đo | Sai số | AM | P1-194 §1 |
|---|---|---|---|---|
| 220 −12 | **107,63 Hz** | **−0,38 st** | 0,156 | 107,5 Hz / −0,40 st / 0,16 |
| 220 −7 | 145,16 Hz | −0,20 st | 0,389 | 145,2 Hz / −0,20 st / 0,39 |
| 880 +12 | 1754,87 Hz | −0,05 st | 0,169 | 1755 Hz / −0,05 st / 0,17 |
| 880 −12 | 442,38 Hz | +0,09 st | 0,231 | 442,5 Hz / +0,10 st / 0,23 |

Tiêu chí verdict: 220/−12 |err| ≤ 0,5 st + AM ≤ 0,7. P1-194 KHÔNG đổi code nên N2c giữ nguyên kết quả đợt 193 — P4 đo lại độc lập, khớp.

### 2.5 N5b bob-first — CHƯA ĐẠT (MỚI — tap cũ thắng 0,13 MAD trên fixture này)

Ô mới theo P4-193 §2.5 note: bob-nearest TRƯỚC rồi blend denoise trên khung đã bob vs truth yadif→hqdn3d (s=0,5), đối chiếu biến thể tap cũ (+0,5px trước denoise). Fixture: testsrc2 + nhiễu Gauss σ=15 rồi interlace (3 frame xen kẽ idx 3/7/11); σ̂ đo trên khung nguồn xen kẽ (xem F-194-P4-2); α = a·k·w với σ̂ ≈ 8,15, k ≈ 1,00, α ≈ 0,485.

| Frame | MAD bob-first | MAD tap | Chênh |
|---|---|---|---|
| idx 3 | 6,967 | 6,820 | +0,147 |
| idx 7 | 6,999 | 6,900 | +0,099 |
| idx 11 | 6,989 | 6,847 | +0,142 |
| **trung bình** | **6,985** | **6,855** | **+0,130** |

Tier bob-first XẤP XỈ (MAD 6,99 ≤ 20, le32 92,2% ≥ 90%; le8 chỉ 70,9%) và |ΔR|/R tệ nhất 0,07 ≤ 15% — nhưng **MAD bob-first > MAD tap ở cả 3/3 frame** nên CHƯA ĐẠT theo tiêu chí đăng ký trước (bob-first < tap). Mâu thuẫn trực tiếp với P2-193 §3.2 (bob-first thắng 12/12 ô, vd inter s=0,5 f=3: tap 4,679 → bob-first 4,261). Phân tích (xem F-194-P4-3): fixture của P4 (testsrc2 chuyển động + nhiễu, MAD tuyệt đối ~7) khác fixture P2 (MAD ~4,3–4,7); trên nội dung chuyển động, dịch +0,5px làm mờ về phía nội suy không gian của yadif nên tap có lợi nhỏ; mô hình tap của P4 là tái tạo lại code đã bỏ (dịch khung đã bob +0,5px — xem §4). **Kết luận đúng mức:** ô này KHÔNG bác bỏ quyết ship bob-first của P2 (quyết dựa trên probe 12 ô của P2 trên fixture của họ + headed), nhưng cho thấy lợi thế bob-first là phụ thuộc fixture — trên nội dung chuyển động + nhiễu, tap cũ không thua (thậm chí hơn 1,9%). Cần probe của P2 trên fixture chuyển động mới kết luận dứt khoát — nợ P2 đợt sau, không đổi code đợt này.

### 2.6 N5c bob luân phiên mode 1 @60fps — ĐẠT (MỚI — claim headline P2-194)

Field lấy bằng ĐÚNG hàm P2-194 ship (`deintBobFieldForOutputFrame(frameIdx, 60, 30)`): output 14 → field 0 (top), 15 → field 1 (bottom); truth yadif mode=1 (30 frame nguồn xen kẽ → 30 frame output, xem F-194-P4-5). So với truth trên cùng fixture testsrc2:

| | MAD trung bình | le8 |
|---|---|---|
| bob-nearest top-only | 3,408 | 93,57% |
| bob-nearest **luân phiên** | **2,593** | **94,65%** |

Luân phiên thắng top-only **0,815 MAD** (f14-top 2,689 = đúng số N5 mode 0; f15-bottom 2,496). Khớp hướng claim P2-194 (probe-194-p2a: MAD 2,888 → 2,297, le8 94% → 95% — số tuyệt đối khác do fixture khác: P2 dùng `tinterlace`, P4 dùng `interlace` filter; cả hai đều tier XẤP XỈ). P2-194 còn xác minh headed: F1/F2 bottom-field PASS, A1 luân phiên trên app thật đổi field 10 lần/31 playhead @proj 60/nguồn 30, FPS đường bob TẮT 11,06 / BẬT 11,10 fps (tỉ lệ 1,02× — không đo được chi phí thêm). P4 kiểm lại test của P2: enhance **160/160** + media **4/4** (tự chạy lại, xem §3). Lưu ý F2: lần chạy headed đầu của P2 FAIL giả vì assert theo số Y (214/38) thay vì số RGB sau encode (~230/~26) — đã sửa thành khoảng tách biệt ≥200/≤60 rồi PASS (P2-194 §4); số liệu gốc vẫn cho thấy field tách biệt rõ.

### 2.7 N6 scrub ngược + N7 audio đảo — ĐẠT; N7-headed xác nhận độc lập từ dữ liệu thô của P3

**N6** (hàm thuần + mapping + wiring): 6/6 biên, worst offset 0 — y hệt đợt 193 (P3-194 không đổi seek/scrub).

**N7** (fake-ctx + wiring): cửa sổ [60,90] đúng, offset tuyệt đối 75 s → start 15 s, crossfade stop t0+0,08 s — y hệt đợt 193. Wiring nay có thêm counters `holdKeep`/`holdCapStop` (P3-194, quyết (a2)-193).

**N7-headed — P4 tính lại độc lập từ JSON waveform thô của P3** (`benchmarks/reverse194/audio-waveform-194-chirp-10s.json`, 130 mẫu, probe headed 03:01:28–03:01:56Z, load 1,09–1,31): 85 mẫu in-pass, RMS **min 0,2914 / max 0,7130 / trung bình 0,6658** (≈ xuôi 0,67); **0 mẫu lặng in-pass**; 0 waveform phẳng; drift (trừ 1 transient khởi động, bin 23,4 Hz ≈ 0,087 s) **trung vị 0,063 s / p90 0,100 s / tối đa 0,285 s**, khoảng [−0,285; +0,122] s — **bar ≤0,5 s ĐẠT**; counters delta **tick 377, holdStop 153, holdKeep 145, holdCapStop 0, playFalse 2, playOk 24, restart 17, restartExact 7** — KHỚP TẤT CẢ số P3-194 §1.4/§2 (restart/restartExact lần đầu > 0 headed, 193: 0/0 — crossfade đã kích hoạt). P4 KHÔNG chạy lại probe headed (bundle `index-B6KQoZ-Z.js` của P3 đã bị build sau của P2 ghi đè thành `index-CSX2lHaT.js`; wiring không đổi từ 02:49:53Z). Unit test P3-194 tự chạy lại: **7/7 PASS** (16/16 + 12/12 suite 193 vẫn xanh). Lưu ý nhỏ: P3 §2.2 ghi "stopAll 5 là từ các lần bấm transport trước pass" — mẫu đầu (tick=3) đã có stopAll=0, mẫu cuối stopAll=5, nên 5 lần này xảy ra TRONG/SAU cửa sổ lấy mẫu, không phải trước pass (xem F-194-P4-4; không ảnh hưởng số restart/restartExact).

### 2.8 N8 reverse mượt — ĐO ĐƯỢC KHI MÁY RẢNH (không phải verdict harness — ghi nhận từ A/B của P3)

P3 chạy lại A/B dense 03:23–03:27Z (fixture dense-gop-ramp191, GOP 30, 1280×720, bundle `index-CSX2lHaT.js`), sau khi P1 đóng cờ + P2 build xong, load lúc mở script 1,57, không job headed khác xen vào:

| lượt | fps ngược | presentedFps | stalls >250 ms | frame đầu | load1 (đầu→cuối pass) |
|---|---|---|---|---|---|
| OFF-1 | 0,70 | 1,45 | 26 | 1689 ms | 2,73→2,87 |
| ON-1 | 0,55 | 1,21 | 21 | 1594 ms | 2,50→1,49 |
| OFF-2 | 0,70 | 1,63 | 21 | 1812 ms | 2,09→1,45 |
| ON-2 | 0,65 | 1,46 | 19 | 1602 ms | 1,50→0,72 |

Tất cả `reverseOk=false`, holdDelta 317–373, drawDelta 21–26, presented 47–55 / distinct 45–53. **Cả 4 lượt đều giữ load1 < 3 suốt pass (cao nhất 2,87)** — lần đầu tiên tiêu chí này đạt được (193: không lượt nào giữ < 3; P4 KHÔNG chạy lại A/B — P3 vừa chạy xong trong cửa sổ rảnh, chạy thêm chỉ thêm tải). **Kết luận prefetch (theo P3-194 §3, P4 đối chiếu log): KHÔNG cải thiện** — trung vị fps ngược OFF 0,70 vs ON 0,60; presentedFps OFF 1,54 vs ON 1,34; stalls ON ít hơn chút (21/19 vs 26/21), frame đầu ON nhanh hơn chút — không đủ đảo chiều. **Giữ toggle decode-ahead TẮT; KHÔNG xét lại prefetch nữa trừ khi decode thay đổi lớn.** Reverse vẫn xa mức mượt ngay cả khi máy rảnh (0,55–0,70 fps vẽ / 1,2–1,6 fps trình diễn ở 720p GOP30) — nút thắt là decode phần mềm serial (mảng Hiệu suất), không phải prefetch. Lượt bão tải OFF lúc 03:12–03:13Z (fps 0,31, load 4,36→12,73) đã LOẠI khỏi bảng vì vỡ tiêu chí — P3 ghi rõ ở §3.1.

## 3. tsc / build / test

- `npx tsc --noEmit` (apps/web): **0 lỗi** (kiểm lần cuối sau khi cả 3 luồng đóng cờ; build lại `npm run build` **PASS** 14,99 s, bundle `index-CSX2lHaT.js` — trùng hash với build của P2, cây không đổi sau đó).
- Test helper harness: **14/14 PASS** (mới: khóa tap-shift +0,5px, bob-first α=0/1, bob-field top/bottom).
- Test P1 (tự chạy lại): `previewVoiceFx.test.ts` **27 pass**; `audioEngineVoiceFx.test.ts` **8 pass**.
- Test P2 (tự chạy lại bằng esbuild bundle như hướng dẫn trong file test): 11 suite enhance **160/160 pass** (91P2 40/40, +5 test mới field/plan/debug); test media `run-media-tests.mjs` **4/4 file PASS** (fpsProbe94P2 8/8).
- Test P3 (tự chạy lại): `reverseAudio194P3.test.ts` **7/7**; `reverseAudio193P3.test.ts` 16/16; `reverseAudio192P3.test.ts` 12/12.
- `tsconfig.json`: thêm `parityHarness194.test.ts` vào exclude (nối sau entry `parityHarness193.test.ts` — đã hợp nhất, không ghi đè entry của P3).

## 4. Phát hiện (F-194-P4-*)

- **F-194-P4-1 — Chạy đo nặng chồng pha (b) T4 cả hai attempt (P4 tự báo).** Lần chạy harness baseline bắt đầu 02:53Z (kiểm `poll-t4.log` #7 lúc 02:52Z: lock=khong, chưa attempt) — T4 mở attempt1 lúc **02:54:11Z** (poll #8) giữa lúc chạy (02:53–02:56Z). Lần chạy harness cuối bắt đầu ~03:29Z (kiểm poll #44 lúc 03:28:37Z: lock=khong) — T4 mở attempt2 lúc **03:29:23Z** (poll #45) giữa lúc chạy (tới 03:30:25Z). Cả hai attempt đều class B (20/20 nhưng nhiễm tải, không dùng verdict). Ảnh hưởng lên P4: **không** — số sim xác định (ffmpeg filter), 3 lần chạy cho cùng số từng chữ số ở mọi check sim; JSON headed voice/seek đo 03:05–03:06Z, ngoài cả hai attempt. Ảnh hưởng lên T4: chạy ffmpeg/esbuild của P4 là một phần tải nhiễm trong cả hai attempt (cùng build 42,94 s của P3 lúc 02:55–02:57Z — F-194-P3-1 — và tsc cuối của P3 chồng đầu pha (b) attempt2). Bài học: kiểm lock trước khi chạy chỉ tránh được chồng lấn tại thời điểm bắt đầu — poller có thể mở cửa bất cứ lúc nào trong lúc chạy; đo nặng dài nên chia nhỏ hoặc chấp nhận rủi ro này và ghi rõ. **Đính chính P1-194 §5:** câu "T4 đợt 194 chưa attempt trong cửa sổ đo nặng (poll-t4.log #1–#22 tới 03:11:45Z đều lock=khong)" là **SAI** — attempt1 chạy 02:54:11–03:01:51Z, các đo nặng của P1 (02:54–03:11Z) CÓ chồng attempt1.
- **F-194-P4-2 — σ̂ N5b đo sai chỗ (lỗi mô hình của P4, đã sửa + đo lại).** Bản đầu đo σ̂ trên khung ĐÃ BOB → σ̂=6,0 (k≈1, α≈0,485): line doubling làm các cặp kề dọc tương quan (Δ=0) nên estimator đọc thấp giả. Đúng: `preview.tsx` ước lượng σ̂ trên `drawSrc` TRƯỚC bob (`estimateEnhanceNoiseSigma(drawSrc, ...)`). Đã sửa: σ̂ đo trên khung nguồn xen kẽ → σ̂ ≈ 8,15, k ≈ 1,00, α ≈ 0,485; đồng thời mở rộng N5b từ 1 frame lên 3 frame (idx 3/7/11) để verdict không phụ thuộc 1 frame.
- **F-194-P4-3 — N5b mâu thuẫn P2-193 12/12 (xem §2.5).** Tap cũ thắng bob-first 0,13 MAD (1,9%) ở cả 3/3 frame trên fixture testsrc2+nhiễu của P4, trong khi P2-193 đo bob-first thắng 12/12 ô trên fixture của họ. Chênh lệch nhỏ nhưng nhất quán — không phải nhiễu đo. Giả thuyết: trên nội dung chuyển động, dịch +0,5px làm mờ về phía nội suy không gian của yadif; mô hình tap của P4 là tái tạo lại code đã bỏ (dịch khung đã bob +0,5px — tap gốc áp trong `enhanceCanvas` ở bước vẽ intermediate, chưa chắc cùng không gian tọa độ). Không đổi code đợt này; nợ P2: probe bob-first vs tap trên fixture chuyển động.
- **F-194-P4-4 — Ghi chú stopAll của P3 §2.2 chưa đúng (xem §2.7).** "stopAll 5 là từ các lần bấm transport trước pass" mâu thuẫn dữ liệu thô: mẫu đầu (tick=3) stopAll=0, mẫu cuối stopAll=5. 5 lần này xảy ra trong/sau cửa sổ lấy mẫu (nhiều khả năng lúc pass kết thúc khi playhead về 0). Không ảnh hưởng verdict (a2)/(a3).
- **F-194-P4-5 — Số khung truth mode=1 (kỹ thuật, đã xác minh).** `interlace` filter gộp 2 frame progressive thành 1 frame xen kẽ nên interYuv chỉ có 15 frame (không phải 30) — truth yadif mode=1 ra 30 frame (không phải 60); output 14/15 = top/bottom của frame nguồn 7 là đúng. MAD f14-top = 2,689 trùng Y HỆT số N5 mode 0 là đúng (yadif mode=0 frame 7 = đúng frame top-field của mode=1), không phải lỗi đọc nhầm frame.

### 4.5 S6b-analytic GHI NHẬN — BY DESIGN, không phải lỗi chưa sửa

Như đợt 193: check này đo mapping `sourceTimeAt` + floor, P3 không sửa `sourceTimeAt` — P3 sửa ở tầng seek (lùi 1 ms) và tầng scrub. Analytic vẫn +1 ở mọi biên là đúng thiết kế; cái người dùng thấy là seek thật (S6b-headed ĐẠT 9/9) và scrub thật (N6 ĐẠT 6/6). GHI NHẬN, không tính vào tổng (43/46 + 1 GHI NHẬN).

## 5. Giới hạn + nợ mở (trung thực)

1. Telephone ĐẠT bar sau bù (max |Δ| 1,79 dB @100Hz) — nhưng 100 Hz vẫn −18% và 1000 Hz −16% (bù scalar không triệt được bướu RBJ).
2. Pitch W=0,08: AM 440 Hz 0,37–0,72 vượt bar 0,35 (trade-off đổi lấy sine trầm, đã quyết GIỮ); răng xen kẽ bị triệt ở 440 Hz (f0·W = 35,2); trễ pitch xcorr +24–47 ms (P1-194 đo — P4 chưa kiểm độc lập bằng phương pháp riêng; chạm ngưỡng ATSC −45 ms, vượt ngưỡng phim ±22 ms; chưa có quyết parent về bù trễ).
3. Warm-up thích nghi ĐẠT trên fixture P4 (max 1,25) — σ̂ hiệu chuẩn trên fixture YUV, fixture RGB của P4 đo thấp hơn ~13% (F-193-P4-6); lưới k hiệu chuẩn ở 320×180, chưa kiểm khổ lớn.
4. Deint vẫn tier XẤP XỈ (N5 MAD 2,69 / N5c MAD 2,59, le8 ~95% — cần ≤2 & ≥99% mới KHỚP); bob-first vs tap chưa ngã ngũ trên fixture chuyển động (F-194-P4-3); `MediaItem.fps` là trung bình cửa sổ đầu video — footage VFR mạnh có thể lệch field (P2-194 §8.2).
5. Sharpen trên nội dung nhiễu chưa KHỚP (MAD ~1,0, le8 ~99% — giới hạn Y_est; YUV-native cần pipeline WebCodecs decode xuôi mới — P2-194 §6 quyết không làm đợt này).
6. Audio đảo: trần drift 0,5 s chưa được kiểm headed (`holdCapStop 0` trong pass — không lần nào giữ chạm trần; chỉ chứng minh bằng unit test); decode cửa sổ file ~600 s có thể > 5 s (chưa đo); clip > 600 s vẫn mute; clip 70 s chưa đo lại đợt này.
7. Reverse **chưa mượt**: N8 đo được khi rảnh — fps ngược 0,55–0,70, presentedFps 1,21–1,63, reverseOk=false cả 4 lượt; prefetch KHÔNG cải thiện (giữ toggle TẮT); nút thắt decode phần mềm serial.
8. Nợ đo: nghe bằng tai người trên clip voice thật (script render mẫu của P1-194 đã sẵn — user tự chạy); Firefox/Safari (hằng số 50/43 + RBJ chỉ đo trên Chrome 158 + Firefox 159; WebKit không kiểm được trên VM — P1-194 §4.2); scrub ngược trên clip dense/GOP dài (chưa đo).

## 6. File đổi (stage)

- `apps/web/src/lib/parityHarness194.ts` (mới — harness 47 entry: 46 verdict + 1 GHI NHẬN; S5 kỳ vọng theo hằng code thật; N5b bob-first 3 frame + σ̂ trên khung nguồn; N5c bob luân phiên dùng đúng hàm field của P2-194; N2 theo dõi W=0,08)
- `apps/web/src/lib/parityHarness194.test.ts` (mới — 14 test helper: khóa AM sim theo W=0,08 + khóa bob-nearest line doubling + tap-shift +0,5px + bob-first α=0/1 + bob-field top/bottom)
- `scripts/parity194-run.mjs`, `scripts/parity194-run-test.mjs` (mới — runner)
- `apps/web/tsconfig.json` (thêm 1 exclude test; nối sau entry 193; P3 thêm exclude test của họ vào cùng file)
- `docs/PHASE9_ROUND194_P4_PARITY_VERIFY_LIMITS.md` (file này)
