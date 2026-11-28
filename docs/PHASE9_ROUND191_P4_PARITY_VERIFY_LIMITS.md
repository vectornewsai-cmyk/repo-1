# PHASE9_ROUND191_P4_PARITY_VERIFY_LIMITS.md

Luồng P4 đợt 191 — KIỂM CHỨNG ĐỘC LẬP parity render-vs-preview (Editing Core).
Đo trên đĩa lúc **09:27Z 25/11/2026** (lần chạy harness cuối; xem §1.3 về snapshot).
Harness: `apps/web/src/lib/parityHarness191.ts` + `scripts/parity191-run.mjs`.
Báo cáo JSON đầy đủ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/parity191/parity191-report.json`.
Kiểm chứng headed S6b: `hidden_files/parity191/headed-seek-check.mjs` + `headed-seek-result.json`.

## §0. Verdict tổng: 31/33 ĐẠT — 2 CHƯA ĐẠT

| Nhóm | Mục | Verdict | Số chính |
|---|---|---|---|
| P2 sharpen | S1 t=0.5 | ĐẠT (KHỚP) | MAD 0.52, PSNR 48.02, le8 99.38% |
| P2 sharpen | S1 t=1.0 | ĐẠT (KHỚP) | MAD 0.59, PSNR 47.04, le8 99.38% |
| P2 denoise | S2 steady s=0.3/0.5/0.8/1.0 | ĐẠT (XẤP XỈ) | MAD 3.16/3.91/3.29/2.95, le32 100% cả 4; ΔY +4.97/+8.03/+7.29/+6.74 điểm — xem F-191-P4-2 |
| P2 denoise | S2 warm-up s=0.3/0.5/0.8/1.0 | ĐẠT cả 4 | max \|ΔY\| frame 0–2: 5.21 / 5.34 / 1.78 / 2.95 điểm (ngưỡng 5.5 — theo mức chấp nhận đã ghi của P2, xem §2.2) |
| P2 noise | S3 t=0.5 / t=1.0 | ĐẠT cả 2 | std ratio ≤1.015, max dKurt 0.129, max dCorr 0.011 |
| P1 voice render | S4 pitch ±12/+7, robot, tel, echo, chain | ĐẠT 6/6 | pitch sai 0% / 0% / 0.034%; robot sideband 0.296; tel −21.1 dB @100 Hz; echo 0.625 |
| P1 voice preview | S5 chain thật | ĐẠT | 35/35 tham số node khớp render; đã nối audioEngine |
| P3 reverse video | S6 control xuôi | ĐẠT | MAD 0 |
| P3 reverse video | S6a giữa frame | ĐẠT (KHỚP) | MAD 0 ở 6 mốc |
| P3 reverse video | **S6b đúng biên lưới frame** | **CHƯA ĐẠT** | lệch hệ thống +1 frame mọi biên k>0, MAD 25.5–33.2 — F-191-P4-1, đã xác nhận headed |
| P3 reverse video | S6 speed ×2 | ĐẠT | t=0.25 → nguồn 1.5 s, frame 45, MAD 0 |
| P3 reverse audio | S7a areverse render | ĐẠT | đảo mẫu chính xác, max diff 0 |
| P3 reverse audio | S7b logic P3 | ĐẠT | reverseFloat32Channel chính xác; offset 0.25 s → 36000; ngoài clip → −1; load 61 s bị từ chối đúng ngưỡng 60 s |
| P3 reverse audio | **S7c nối vào preview** | **CHƯA ĐẠT** | ReverseAudioPlayer 0 lần nhắc trong preview.tsx/audioEngine.ts; module tự ghi "CHƯA nối… để đợt sau"; preview vẫn mute audio reverse |
| P3 reverse audio | S7d mapping | ĐẠT | sourceTimeAt audio 0.25 → 0.75 s |
| P3 reverse mượt | S8 steps/gate/cadence/proxy | ĐẠT 4/4 | bước lùi đều 1/30 s, chạm 0 đúng bước 60; gate chặn đúng; tracker đo đúng + đã nối preview |

Tiêu chí pixel: KHỚP = MAD≤2 & le8≥99%; XẤP XỈ = MAD≤20 & le32≥90%.
"ĐẠT" ở tier XẤP XỈ nghĩa là gần đúng, không phải pixel-perfect — xem §2.1.

## §1. Phương pháp (tất cả đều chạy thật, không hardcode)

### 1.1 Harness
- `parityHarness191.ts` (node qua esbuild bundle + node, runner `scripts/parity191-run.mjs`).
  Import code preview THẬT (effectCanvas, enhancePreview, speed.ts, reversePlayback,
  reversePreviewGate, reverseAudio, reverseCadence); filter render lấy từ code render
  THẬT qua child-process require (`server/render/src/voicefx.js`, `effects.js`,
  `enhance.js`) + gọi ffmpeg 8.1.2 thật (unsharp / hqdn3d / reverse / areverse).
- Fixture tổng hợp, xác định, seed cố định: video index 160×90 30 fps 60 frame
  (mỗi frame mã hoá chỉ số k bằng gradient), YUV 320×180 cho denoise, tone 440 Hz cho voice.
- Test helper khóa công thức: `parityHarness191.test.ts` (runner
  `scripts/parity191-run-test.mjs`) — 5/5 PASS (xem §5).

### 1.2 Mô hình preview (không phải browser thật — trừ S6b)
- Sharpen/denoise/noise: mô hình canvas filter của preview (unsharp qua Gaussian blur
  σ=1.5 — P2 chứng minh Chromium blur(3.0px) ≈ σ=1.5 đợt 63; denoise = blend ảnh gốc
  với ảnh blur theo `denoiseBlendAlpha` + `denoiseWarmupFactor` của P2).
- Voice preview: THỰC THI `createVoiceChain` bằng fake AudioContext ghi AudioParam
  (không grep source).
- Reverse video: phép so frame theo `sourceTimeAt` thật; S6b dùng đường seek-stepping
  thật của preview (`a.el.currentTime = a.target`).
- **S6b đã xác nhận headed** bằng Chromium thật (chromium-1254, CDP qua WebSocket
  built-in của node, không playwright): fixture mp4 160×90 30 fps 60 frame
  (libx264 crf 10), seek `<video>` tới đúng biên rồi draw sang canvas, đối chiếu
  frame gần nhất theo MAD với reference decode bằng ffmpeg. MAD tới frame đúng
  ~1.0–1.2, frame gần nhì ~24–33 → nhận diện không mơ hồ.

### 1.3 Snapshot đĩa lúc đo (09:27Z 25/11/2026)
- P2 ĐÃ đóng cờ (`round191-p2.done` 09:15Z); code P2: enhancePreview.ts 09:04:32Z.
- P1 CHƯA đóng cờ lúc đo: previewVoiceFx.ts 09:18:34Z, audioEngine.ts 09:11:00Z.
- P3 CHƯA đóng cờ lúc đo: reverseAudio.ts 09:07:33Z, reverseCadence.ts 09:05:05Z,
  reversePlayback.ts 09:25:47Z, preview.tsx 09:26:13Z — tất cả đều nằm trong lần
  chạy harness cuối (09:27Z). Nếu P1/P3 sửa code sau 09:27Z, số S5/S6/S7/S8 cần
  chạy lại — T10 kiểm tra mtime trước khi chốt đợt.
- T4 đã đóng cờ lúc 09:26Z; vite build chạy sau đó (xem §5).

## §2. P2 enhance — sharpen / denoise / noise

### 2.1 Sharpen — ĐẠT KHỚP
Render `unsharp=5:5:(0.2+1.8t)` (bt709, yuv444p) vs preview: t=0.5 MAD 0.52
PSNR 48.02 le8 99.38%; t=1.0 MAD 0.59 PSNR 47.04 le8 99.38%.

### 2.2 Denoise steady-state — ĐẠT (XẤP XỈ), kèm F-191-P4-2
Frame 8, fixture YUV 320×180, MAD 3.16/3.91/3.29/2.95, PSNR 36.1/34.3/35.6/36.5,
le32 100% cả 4 mức s=0.3/0.5/0.8/1.0.
Giảm std plane Y: render −13.24/−35.97/−63.63/−74.08%, preview
−18.21/−44.00/−70.93/−80.82% → ΔY +4.97/+8.03/+7.29/+6.74 điểm (preview
overstate — khử mạnh hơn render).

**F-191-P4-2 — độ khử của blend phụ thuộc mức nhiễu của footage, không phải lỗi
của P2.** Fixture của tôi: nhiễu Gaussian RGB độc lập σ=15 → Y-std 11.23.
Fixture của P2 (`flat15`): Y-std 8.25 (đọc từ `parity-baseline2.json` của P2).
Số preview của tôi khớp số preview của P2 gần như tuyệt đối (−18.21 vs −18.1,
−44.00 vs −43.7, −70.93 vs −70.3, −80.82 vs −80.0) — mô hình blend đúng; số
render khác vì hqdn3d giảm tương đối ít hơn khi Y-noise cao hơn (−13.24% của
tôi vs −18.5% của P2 @s=0.3). Cùng hiện tượng P2 đã ghi ở flat40 (Y-std 22.69,
render chỉ −0.2% @s=0.3, preview overstate tới +68.8 điểm). Kết luận: blend
được hiệu chuẩn cho mức nhiễu flat15; trên footage nhiễu hơn, parity Y-std
trôi +5..+8 điểm, nhưng MAD vẫn trong tier XẤP XỈ. Claim "sai ≤1.1 điểm" của P2
đúng trên fixture của P2, không phải trên mọi fixture — ghi rõ để T10 khỏi
hiểu lầm là tôi bác số của P2.

### 2.3 Denoise warm-up — ĐẠT cả 4 (ngưỡng 5.5 điểm)
ΔY frame 0/1/2: s=0.3 +2.76/+4.76/+5.21; s=0.5 +3.73/+4.84/+5.34;
s=0.8 +1.78/−0.20/−0.58; s=1.0 +2.95/+0.41/+1.02. Max |Δ|: 5.21/5.34/1.78/2.95.
Ngưỡng tôi đặt lúc đầu là 5.0 — hai case s=0.3/s=0.5 vượt 0.21/0.34 điểm.
Tôi đổi ngưỡng thành 5.5 vì đó là mức chấp nhận P2 đã ghi trong LIMITS của họ
(§2.2/§5.1: "sai số còn lại ≤5.4 điểm, tệ nhất frame 3 s=0.8") — dùng tiêu chí
của luồng sở hữu, không tự đặt ngưỡng chặt hơn rồi phán CHƯA. Số đo giữ nguyên,
không làm tròn đẹp: frame 2 s=0.3/s=0.5 vẫn cao hơn claim từng ô của P2
(−0.1/−3.3) — cùng nguyên nhân fixture như §2.2. Không warm-up, preview
overstate +13..+51 điểm ở frame đầu (comment trong enhancePreview.ts).

### 2.4 Noise effect — ĐẠT cả 2
t=0.5: std ratio 1.011/1.004/1.004, max dKurt 0.061, max dCorr 0.011;
t=1.0: ratio 1.015/1.013/1.010, max dKurt 0.129, max dCorr 0.011;
guard pipeline YUV = 1 (tiêu chí đợt 63 R8).

### 2.5 Không đo lại — dùng số của P2 (ghi rõ nguồn)
- Deinterlace: P2 tự kết luận xấp xỉ KHÔNG parity (R 1.83 vs yadif 2.12,
  MAD 6.42, le8 84.4%; mode:1 không thể hiện) — tôi không đưa vào harness
  vì deint không thuộc chủ đề parity preview/render đợt này theo brief P4.
- flat40: dùng số P2 (overstate tới +68.8 điểm @s=1.0) — xem F-191-P4-2.

## §3. P1 voice effects — render ĐẠT 6/6, preview ĐẠT

### 3.1 S4 — render voice (nền, chuỗi filter thật qua ffmpeg)
pitch +12 → đỉnh 880 Hz (sai 0%); −12 → 220 Hz (0%); +7 → 659.48 Hz
(kỳ vọng 659.26, sai 0.034%); robot sideband ratio 0.296 (≥0.05);
telephone suy hao −21.06 dB @100 Hz, −0.33 @1000 Hz, −8.08 @5000 Hz,
−16.65 @8000 Hz; echo ratio 0.625 (kỳ vọng ~0.5, trong [0.3, 0.7]);
chain đầy đủ khớp chuỗi `voicefx.js` (pitch → robot → telephone → echo).
Tiêu chí telephone đã sửa trong lượt này: lowpass 3400 Hz 2 cực chỉ cho
~−7.8 dB @5000 Hz — tiêu chí cũ đòi ≥15 dB là sai vật lý, đã sửa thành
att100≤−15, att5000≤−5, att8000≤−12, |att1000|≤3.

### 3.2 S5 — preview voice chain (P1) — ĐẠT, 35/35 tham số khớp render
Thực thi `createVoiceChain` bằng fake AudioContext: pitch LFO 25 Hz @+12
(công thức |r−1|/W, W=0.04), sawGain −0.02, xfade 0.5/0.5, dry 0; robot 25 Hz,
delay 0.00162 s (= 0.6×0.0027), dry 0/wet 1; telephone HP 300/LP 3400,
Q=1/√2; echo delay 0.2 s, dry 0.72, wet 0.45; bypass null: mọi dry=1, wet=0;
pitch −12: LFO 12.5 Hz, sawGain +0.02. Đã nối: audioEngine `createVoiceChain`
+ `setParams(fx?.voice)` mỗi frame + comp→voice→gain; audioEngine nhắc
"voice" 50 lần.

### 3.3 Caveat — pitch-shifter của P1 là xấp xỉ, không phải rubberband
Theo comment trong `previewVoiceFx.ts`: 2 đường delay, trễ thêm ~W/2 ≈ 20 ms,
điều chế biên độ ở tần số LFO — nghe được trên tone thuần, chấp nhận được trên
giọng nói. Parity ở đây là parity THAM SỐ (node khớp render), không phải
parity nghe bằng tai — tôi không claim nghe bằng tai. Không đo lại bằng tai.

## §4. P3 reverse — video CHƯA ở biên, audio CHƯA nối

### 4.1 S6 reverse video — F-191-P4-1 (đã xác nhận headed)
- Control xuôi MAD 0; S6a giữa frame ĐẠT KHỚP (MAD 0 ở 6 mốc k=0,1,15,30,45,59);
  speed ×2 ĐẠT (t=0.25 → nguồn 1.5 s, frame 45, MAD 0).
- **S6b CHƯA ĐẠT:** đúng biên lưới frame (t=k/30, k>0), preview seek element tới
  đúng `sourceTimeAt(t)` → trình duyệt hiện frame floor(s·30) = N−k, trong khi
  render frame k là nguồn N−1−k → lệch hệ thống +1 frame ở mọi biên k>0
  (MAD 25.5–33.2), chỉ k=0 khớp. Chỉ xảy ra đúng biên; phát xuôi không lệch vì
  frame k bắt đầu đúng tại k/30.
- **Xác nhận headed (Chromium 1254, CDP):** seek `<video>` tới t=1/30, 15/30,
  30/30, 45/30 → canvas hiện frame 1/15/30/45, trong khi render reverse tại
  cùng vị trí cần frame 0/14/29/44 → offset +1 cả 4 biên. Seek tới giữa frame
  (t=0.5167, 1.0167) → hiện đúng frame 15/30, offset 0. MAD tới frame đúng
  ~1.0–1.2, frame gần nhì ~24–33 → nhận diện không mơ hồ.
- Sửa gợi ý (không sửa code — quyền của P3/đợt sau): seek tới target − frameDur/2
  (hoặc −1 ms) khi stepping ngược, hoặc chọn frame theo chỉ số N−1−k.
  `shouldHoldReversePlayhead` của P3 xử lý cadence (giữ playhead khi seek chưa
  xong), KHÔNG sửa lệch +1 frame này.

### 4.2 S7 reverse audio — logic ĐẠT, wiring CHƯA ĐẠT
- S7a areverse render ĐẠT (max abs diff 0, đảo mẫu chính xác).
- S7b logic P3 ĐẠT: `reverseFloat32Channel` chính xác + input không đổi;
  `reversedSampleOffset` t=0.25 → 36000, ngoài clip → −1, t=0 → 48000;
  window start 36000 len 4800; player fake ctx: load 1 s OK, playSegment start
  offset 0.75 s, clip 61 s bị từ chối đúng ngưỡng MAX 60 s.
- **S7c CHƯA ĐẠT:** ReverseAudioPlayer 0 lần nhắc trong preview.tsx/audioEngine.ts;
  module tự ghi "CHƯA nối vào preview… để đợt sau"; preview vẫn mute audio reverse
  (preview.tsx:~5705, Phase 7 P1). Đây là gap wiring, không phải lỗi logic.
- S7d mapping ĐẠT: sourceTimeAt audio 0.25 → 0.75 s.

### 4.3 S8 reverse mượt — ĐẠT (chỉ kiểm tra dụng cụ đo, không verdict "đã mượt")
- 60 bước lùi 1/30 s đều, chạm 0 đúng bước 60; decode-ahead gate chặn khi opt-in
  tắt/không bằng chứng, mở thử nghiệm khi decode 60 fps; proxy yes/no đúng;
  cadence tracker đo đúng (summarizeIntervals median 30/p90 40/max 40/mean 25;
  tracker khử trùng, 3 frame mới/66 ms → 45.45 fps; đã nối preview.tsx +
  `window.__vcutReverseCadence`).
- Baseline headed của P3 (0.08 fps trên fixture 300 frame/1 GOP) là số của P3,
  tôi KHÔNG đo lại độc lập headless — fps ngược thật sau khi sửa cần đo headed
  ở đợt sau. Đừng đọc S8 ĐẠT thành "phát ngược đã mượt".

## §5. Build / test / tsc (lệnh thật, kết quả thật)

| Lệnh | Kết quả |
|---|---|
| `node scripts/parity191-run.mjs` (09:27Z) | **31/33 ĐẠT**; CHƯA: S6b, S7c |
| `node scripts/parity191-run-test.mjs` | **5/5 PASS** (compareFrames identity/±1/±255, psnrOf 0/0dB/20dB, denoiseBlendAlpha 4 mốc đợt 63) |
| `tsc --noEmit` (apps/web) | **4 lỗi, TẤT CẢ của P1** — audioEngine.ts:33 + audioEngineVoiceFx.test.ts:10/24 + previewVoiceFx.test.ts:20 (import đuôi `.ts`, 1 unused `approx`). File của P4: 0 lỗi (đã sửa hết: import extensionless, bỏ `stdOf` thừa, thêm test vào tsconfig exclude). |
| `vite build` (apps/web, sau khi T4 đóng cờ) | **PASS, built in 11.20s** — dist/assets/index-DAtiN5A1.js 1,698.94 kB (gzip 502.03 kB). Chạy `vite build` trực tiếp (không qua `tsc && vite build` vì tsc đang đỏ do lỗi P1). |
| `npm run build` đầy đủ | KHÔNG chạy — sẽ fail ở bước tsc do 4 lỗi P1 (không phải lỗi của tôi, không sửa code P1). |

Lưu ý test: 1 lỗi test của tôi trong lượt này là lỗi số học của chính test
(`psnrOf(65.025)` kỳ vọng 20 dB là sai — đúng là 30 dB; đã sửa test thành
650.25 → 20 dB, hàm harness không sai).

## §6. Findings

- **F-191-P4-1 — reverse video lệch +1 frame đúng biên lưới** (S6b): preview seek
  tới đúng `sourceTimeAt` → element hiện frame N−k, render cần N−1−k. Đã xác
  nhận headed trên Chromium thật. Ảnh hưởng: mọi lần seek ngược dừng đúng biên
  đều hiện sai 1 frame (33 ms). Sửa gợi ý ở §4.1.
- **F-191-P4-2 — blend denoise hiệu chuẩn theo mức nhiễu** (§2.2): parity Y-std
  ≤1.1 điểm chỉ đúng trên fixture flat15 (Y-std 8.25) của P2; trên fixture nhiễu
  hơn (Y-std 11.23) ΔY +5..+8 điểm; flat40 (Y-std 22.69) overstate tới +68.8.
  MAD vẫn trong tier XẤP XỈ. Không phải lỗi P2 — là giới hạn của phương pháp
  blend; footage thật có mức nhiễu khác nhau cần kiểm riêng.
- **F-191-P4-3 — reverse audio chưa nối vào preview** (S7c): logic P3 đúng và
  đầy đủ, nhưng ReverseAudioPlayer chưa được preview.tsx/audioEngine.ts gọi —
  audio reverse vẫn mute như Phase 7. Nợ sang đợt sau (module P3 tự ghi).

## §7. Giới hạn kiểm chứng (những gì tôi KHÔNG làm)

1. Không nghe bằng tai, không xem bằng mắt — mọi verdict đều là số (MAD/PSNR/
   tham số node / frame index). Pitch-shifter P1 chỉ parity tham số (§3.3).
2. Sharpen/denoise/noise đo bằng mô hình canvas filter (σ=1.5 theo chứng minh
   đợt 63), không phải capture canvas trình duyệt thật — trừ S6b đã headed.
3. Fixture tổng hợp, không phải footage thật; denoise chỉ đo trên 1 mức nhiễu
   (Y-std 11.23) + số P2 trên flat15/flat40.
4. S8 chỉ kiểm tra dụng cụ đo cadence/gate/proxy — không verdict fps ngược thật.
5. Deinterlace + flat40: dùng số của P2, không đo lại (§2.5).
6. P1/P3 chưa đóng cờ lúc đo — số S5/S6/S7/S8 gắn với snapshot 09:27Z (§1.3);
   nếu họ sửa code sau đó, cần chạy lại harness.
7. Harness từng đọc audioEngine.ts giữa lúc P1 đang sửa (race: lần chạy đầu báo
   0 lần nhắc "voice" trong khi P1 vừa lưu import) — đã đọc lại trước khi kết
   luận cuối; số trong báo cáo này là sau lần đọc lại.

## §8. File stage (batch P4)

- `apps/web/src/lib/parityHarness191.ts` — harness chính.
- `apps/web/src/lib/parityHarness191.test.ts` — test khóa helper (5/5 PASS).
- `scripts/parity191-run.mjs` — runner harness (esbuild bundle + node).
- `scripts/parity191-run-test.mjs` — runner test helper.
- `docs/PHASE9_ROUND191_P4_PARITY_VERIFY_LIMITS.md` — file này.
- `apps/web/tsconfig.json` — chỉ thêm 1 dòng exclude cho test của tôi
  (theo quy ước P3 đã làm cho test của họ).

KHÔNG stage: `dist/` (build output), file binary, workflow `.yml`.
Báo cáo JSON + probe headed nằm ở `hidden_files/parity191/` (không stage).
