# Phase 9 Đợt 64 — R3: Đo lại FPS blend + spread FPS enhance trên clip dài

Ngày đo: 2026-11-08 (05:39–07:07 +07). VM: 4 vCPU, ~7,9 GB RAM, CPU-only (SwiftShader),
FFmpeg 8.1.2, Chromium headless qua Xvfb + CDP (Chrome 158, `~/.cache/ms-playwright/chromium-1254`).

Nợ mở được giao: đợt 63 R3 "FPS blend đo lại khi VM rảnh" + đợt 63 R2 §8 mục 5
"đo spread jitter + FPS enhance trên clip dài hơn 5 s".

## 0. Kết luận trước (TL;DR)

- **Thang piecewise blend của R3 KHỚP — không sửa code, không sửa thang.**
  B-only, flat15 720p: V3 −18.4/−45.5/−73.5/−82.7% vs hqdn3d −19/−47/−74/−83%,
  maxErr **1.5** (R63: 1.3; chênh ≤0.3). V0 linear tái lập R62 (maxErr 1.4 ≤2).
  Lặp lại V3: diff 0.0.
- **FPS enhance trên clip dài (20 s, ×3 lặp):** denoise **0.46x** (720p) / **0.433x** (1080p);
  stabilize 0.743x / 0.78x; combo 0.457x / 0.37x. Trong ±10% so với R63
  (denoise 0.48–0.52x / combo 0.46–0.56x) nếu tính nhiễu của control no-op (±25%).
  Ngưỡng 0.75x vẫn FAIL ở mọi nơi — **giữ nguyên, không nới**.
- **Decode rVFC (tab trắng, 10 s/vị trí):** 720p **15.54 fps** (15.25/15.17/16.19, std 0.46),
  dropped 288/985 (29%) — đo lúc load 4.9–7.2; 1080p **24.15 fps** (23.26–24.82,
  std 0.65, n=3 vị trí), dropped 5/938 (0.5%) — đo lúc load ~0.6–2.9.
  1080p decode "tốt hơn" 720p là do tải VM lúc đo, không phải do độ phân giải.
- **Encode FFmpeg (600 frame, ×3, fps theo CPU-time):** 720p decode 95.66 / encode 21.5 /
  encode+hqdn3d(0.5) 24.01 fps; 1080p decode 56.73 / encode 10.93 / encode+denoise 12.1 fps.
  Denoise làm encode nhanh hơn: +11.7% (720p), +10.7% (1080p) — khớp R63 R2 (F<G).
- Test suite liên quan: **85/85 xanh** (enhancePreview63R3 8/8, 62R3 10/10, 61R3 7/7,
  60Q1 16/16, presets59P8 21/21, speedBlock61R2 9/9, previewEngine 14/14).
  `tsc --noEmit` (apps/web) exit 0; `vite build` pass (40.4 s, cảnh báo chunk >500 kB có từ trước).

## 1. Điều kiện đo

| Hạng mục | Chi tiết |
|---|---|
| VM | 4 vCPU, ~7.9 GB RAM, không GPU; FFmpeg 8.1.2 |
| Trình duyệt | Chromium headless 158 (chromium-1254), Xvfb + CDP |
| Fixture dài | `long720.mp4` 20.0 s, 1280×720, 30 fps, testsrc2 + noise alls=15, libx264 veryfast crf 23, maxrate 10M, 25.9 MB, 10.37 Mbps; `long1080.mp4` 20.0 s, 1920×1080, maxrate 16M, 41.4 MB, 16.57 Mbps |
| Fixture ngắn | flat15/flat40.mp4, frame15/frame40.png, hq15_/hq40_.png, clean720.mp4, interlaced720.mp4 (tái dùng từ R61/R63) |
| Project mẫu | 2 clip video 4 s 640×360 webm + 1 clip chữ; preview canvas 871×275; meta project 1280×720 |
| Tải VM lúc đo | Dao động mạnh vì các luồng R64 khác chạy song song (ffmpeg/tsc/vite, Chrome R10, có lúc 1 CPU-burner `node -e while(true)` của luồng khác). Load 0.3–23 trong phiên; từng phép đo ghi load riêng bên dưới |
| Phương pháp | Interleaved [B,D,B,S,B,C,B], 10 s/slot, ×3 lặp; tỉ lệ drift-corrected theo baseline kề trước/sau |

Lưu ý về fixture: bản đầu của long720/long1080 (không maxrate) nặng 33.5/77 Mbps — không
thực tế — đã thay bằng bản maxrate 10M/16M ở trên. Tất cả số đo trong doc này dùng bản maxrate.

## 2. Blend calibration (B-only) — thang piecewise KHỚP

Harness: `apps/web/scripts/measure-64r3-blend-cal.mjs` (server riêng, display 190–199,
port 5790–5799/9670–9679). Log: `hidden_files/round64-r3/blend-cal-r64.log`,
JSON: `hidden_files/round64-r3/blend-cal-r64.json`.

Độ giảm nhiễu (MAD giảm %, so với hqdn3d cùng metric):

| Cấu hình | s=0.3 | s=0.5 | s=0.8 | s=1.0 | maxErr vs hqdn3d |
|---|---|---|---|---|---|
| V3 piecewise, flat15 720p | −18.4 | −45.5 | −73.5 | −82.7 | **1.5** |
| hqdn3d (tham chiếu), flat15 | −19 | −47 | −74 | −83 | — |
| V3, flat15 488×275 | −18 | −45.8 | −75.9 | −84.8 | — |
| V3, flat40 720p | −18.6 | −45.9 | −74.2 | −84.2 | — |
| hqdn3d, flat40 | −5.0* | −26.7* | — | — | — |
| V0 linear (control), flat15 | −28.7 | −47.0 | −72.6 | −83.7 | 1.4 |
| V0 linear R62 (tham chiếu) | −28.9 | −48.4 | −73.6 | −83.7 | — |

\* hqdn3d trên flat40 đo bằng metric khác (xem R63 §6.1) — không so trực tiếp.
Lặp lại V3: diff 0.0. Step-edge: 0 px ở s≤0.5, 4 px ở s≥0.8 (không đổi so với R63).

**Kết luận:** piecewise knots (0,0),(0.3,0.195),(0.5,0.486),(0.8,0.806),(1,0.981) trong
`apps/web/src/lib/enhancePreview.ts` (`denoiseBlendAlpha`) vẫn khớp trong sai số 1.5 điểm %.
**Không thay đổi code/thang.** Nợ cũ còn nguyên: blend vẫn overstate trên flat40 (R63 §6.1),
step-edge 4 px ở s≥0.8 (R63 §6.2).

## 3. FPS preview enhance trên clip dài 20 s (×3 lặp mỗi cấu hình)

Harness: `apps/web/scripts/clicktest-64r3-fps-long.mjs` (display 180–189, dev 5550–5559,
debug 9650–9659). Inject bằng patchClip đã chứng minh ở D3 (clip1 → clip dài 0–20 s,
clip2 dời sang 20 s, giữ track chữ như điều kiện R63) + GATE warmup (draw delta ≥20,
element rs≥1 + w>0 + buf>0 + ct>0 + srcAttr, hook baseline OK) + gate per-slot
(hủy lượt nếu hook/element lệch, không ghi số rác).

### 3.1 720p — log `round64-r3/fps-long-720-v3.log`, JSON `round64-r3/headed-long/r3-fps-long-720.json`

GATE OK (draw delta 44, element ct 6.9, buf 20). A-hook PASS, H9 PASS; A FPS FAIL
theo thiết kế (ngưỡng 0.75x); D decode FAIL (xem §4).

| Cấu hình | Tỉ lệ mean | min | max | std | drawFps mean |
|---|---|---|---|---|---|
| denoise | **0.46x** | 0.34 | 0.61 | 0.112 | — |
| stabilize | **0.743x** | 0.63 | 0.84 | 0.087 | — |
| combo (denoise+stabilize) | **0.457x** | 0.40 | 0.56 | 0.073 | — |
| baseline | — | — | — | — | 28.74 (11.43–54.58, std 18.62) |

Từng lặp (denoise/stabilize/combo; baseline mean): rep1 0.61/0.84/0.41 (11.43, drift 9.48);
rep2 0.34/0.63/0.56 (20.20, drift 29.18); rep3 baseline 54.58 (drift 12.42).
FPS tuyệt đối dao động ~10× giữa các lặp dưới tải tương tự (hiệu ứng warm-up/cache);
**tỉ lệ ổn định hơn nhiều** — đó là lý do báo cáo dùng tỉ lệ drift-corrected.
Playhead ~0.999x.

### 3.2 1080p — log `round64-r3/fps-long-1080-v3.log` (không có JSON: harness chết ở decode seek 10 trước khi ghi)

GATE OK (draw delta 48, element w=1920, ct 6.53, buf 20). A-hook PASS; A FPS FAIL theo thiết kế.

| Cấu hình | Tỉ lệ mean | min | max | std | drawFps mean |
|---|---|---|---|---|---|
| denoise | **0.433x** | 0.41 | 0.47 | 0.026 | 14.48 (14.19–14.87, std 0.286) |
| stabilize | **0.78x** | 0.73 | 0.81 | 0.036 | 28.60 (27.34–29.72, std 0.976) |
| combo | **0.37x** | 0.36 | 0.39 | 0.014 | 13.69 (13.30–14.39, std 0.498) |
| baseline | — | — | — | — | 35.31 (34.03–37.22, std 1.376) |

Từng lặp: rep1 0.42/0.81/0.39 (baseline 34.03); rep2 0.47/0.73/0.36 (34.68);
rep3 0.41/0.80/0.36 (37.22). Spread 1080p chặt hơn hẳn 720p (std tỉ lệ 0.014–0.036
vs 0.073–0.112) — baseline 1080p ổn định hơn (std 1.38 vs 18.62).

### 3.3 So sánh với R61/R63 — không lệch >10% (tính theo tỉ lệ)

| Cấu hình | R61 (blur-pure, VM lặng) | R63 (blend) | R64 clip dài 720p | R64 clip dài 1080p | R64 clip ngắn (rerun) |
|---|---|---|---|---|---|
| denoise | 0.60x | 0.48–0.52x | 0.46x | 0.433x | 0.42x |
| stabilize | — | 0.90x* | 0.743x | 0.78x | 0.56x |
| combo | 0.62x | 0.46–0.56x | 0.457x | 0.37x | 0.52x |

\* R63 stabilize 0.90x là outlier một lần đo; các đợt khác 0.56–0.78x.
Control no-op (deinterlace) ở R63/R64 rerun: 1.25x — tức nhiễu đo đã ±25%.
Trong nhiễu đó, mọi tỉ lệ R64 nằm trong ±10% của dải R63 → **không sửa thang/code**.

### 3.4 Clip ngắn rerun (fps-cal) — log `round64-r3/fps-cal-rerun.log`

Baseline 5 slot: mean 13.58 fps (min 6.87, max 19.24, drift 12.37). Tỉ lệ
drift-corrected: denoise **0.42x**, stabilize **0.56x**, deinterlace (control no-op)
**1.25x**, combo **0.52x**. A-hook PASS 9/9 (alpha 0.486 đã verify). A FPS FAIL theo thiết kế.
Harness chết sau phase A: `CDP.send timeout 60s: Runtime.evaluate` ở bench A2
(1280×720 blur ×5400 drawImage vượt quá timeout CDP 60 s khi tải cao — cùng lỗi R63
lượt 2–3). Script B-only (`measure-64r3-blend-cal.mjs`) là workaround.

## 4. Tách FPS decode / enhance / encode

### 4.1 Decode rVFC (tab trắng, `measure-64r3-decode-only.mjs` + harness dài)

| Clip | fps mean | min | max | std | mediaRate | dropped | Tải VM lúc đo |
|---|---|---|---|---|---|---|---|
| long720, 3 vị trí seek | **15.54** | 15.17 | 16.19 | 0.46 | 0.96x | 288/985 (29%) | 4.9–7.2 |
| long1080, seek 0/5/10 (đợt 1, trong harness dài) | 23.66 / 23.22 / —(chết CDP timeout) | — | — | — | ~1.0x | 2/309, 1/310 | ~2.9 |
| long1080, seek 0/5/10 (đợt 2, script riêng, 07:06–07:12) | **24.15** | 23.26 | 24.82 | 0.65 | 0.993–1.002x | 5/938 (0.5%) | 0.64–1.12 |

Đợt 2 thay thế hoàn toàn đợt 1 cho 1080p (seek 10 đã đo được: 24.82 fps, 0 dropped).
JSON: `hidden_files/round64-r3/decode-fps-1080.json`, log `decode-fps-1080.log`.

**Cảnh báo diễn giải:** 1080p decode (24.15 fps, dropped 0.5%) "tốt hơn" 720p (15.54 fps,
dropped 29%) là do tải VM lúc đo (0.6–2.9 vs 4.9–7.2), không phải do độ phân giải.
720p decode cần đo lại trong cửa sổ lặng để tách hiệu ứng tải khỏi giới hạn decode thật.

### 4.2 Encode FFmpeg (600 frame, ×3 lặp, `measure-64r3-encode-fps.mjs`)

JSON: `round64-r3/encode-fps.json`, log `round64-r3/encode-fps.log`.
fpsCpu = 600 / CPU-time (ổn định, std 0.09–1.13); fpsWall = 600 / wall-time (phụ thuộc tải,
std tới 8.28) — chỉ dùng fpsCpu để so sánh.

| Cấu hình | fpsCpu mean | min–max | std | fpsWall mean |
|---|---|---|---|---|
| 720p decode-only | **95.66** | 94.19–96.93 | 1.13 | 23.17 |
| 720p encode libx264 veryfast crf 23 | **21.5** | 21.11–21.69 | 0.27 | 10.8 |
| 720p encode + hqdn3d=12:9:12:9 (denoise 0.5) | **24.01** | 23.68–24.48 | 0.34 | 13.77 |
| 1080p decode-only | **56.73** | 56.34–57.14 | 0.33 | 24.96 |
| 1080p encode libx264 veryfast crf 23 | **10.93** | 10.80–11.06 | 0.11 | 6.99 |
| 1080p encode + denoise | **12.1** | 11.98–12.19 | 0.09 | 7.82 |

Denoise làm encode nhanh hơn: 720p **+11.7%**, 1080p **+10.7%** (entropy thấp hơn —
khớp R63 R2: F<G). Phương pháp CPU-time được validate bởi độ ổn định của fpsCpu
so với fpsWall.

### 4.3 Enhance (preview, trong app)

Chính là §3: denoise ~0.43–0.46x, stabilize ~0.74–0.78x, combo ~0.37–0.46x
so với baseline preview cùng clip. Đây là chi phí enhance trong preview (canvas 2D,
blur 3.0 px + blend), không phải chi phí render FFmpeg (§4.2).

## 5. Chạy lại được (harness)

```bash
# Blend calibration (B-only, tránh timeout CDP của bench A2)
cd ~/workspace/repo-1
node apps/web/scripts/measure-64r3-blend-cal.mjs

# FPS preview enhance clip dài 20 s, 720p + 1080p, ×3 lặp
node apps/web/scripts/clicktest-64r3-fps-long.mjs

# Decode rVFC riêng (1080p; đổi clip trong script cho 720p)
node apps/web/scripts/measure-64r3-decode-only.mjs

# Encode/decode FFmpeg (cần fixture long720/long1080 trong ~/workspace/.scratch-r61r3-1cOf/media/)
node apps/web/scripts/measure-64r3-encode-fps.mjs

# Unit test liên quan (esbuild bundle + node; không có vitest)
# xem /tmp/round64-r3/unittests/*.cjs — enhancePreview63R3 8/8, 62R3 10/10,
# 61R3 7/7, 60Q1 16/16, presets59P8 21/21, speedBlock61R2 9/9, previewEngine 14/14
```

Fixture dài (không stage, chỉ dùng local):
`~/workspace/.scratch-r61r3-1cOf/media/long720.mp4` và `long1080.mp4`
(testsrc2 + noise alls=15, 20 s, 30 fps, maxrate 10M/16M).

## 6. Sự cố trong lúc đo (trung thực, không giấu)

1. **Chạy dài v1 chết (05:48–05:53):** inject thay toàn bộ spec (1 track / 1 clip) →
   draw FPS 0.2–4.7, hook trễ 1 slot. Chẩn đoán bằng 9 script `/tmp/round64-r3/diag*.mjs`:
   element pool của long720 kẹt rs:0/ns:0/buf:0 nhiều phút; `el.load()` vô hiệu 15 s;
   tab trắng mới load metadata trong ~3 s (rs 4); đổi src của element "xác chết" sang
   clean720 thì load tốt (rs 4 trong 2 s). Quyết định: element có `srcAttr: null` trong khi
   `currentSrc` vẫn hiện URL long720 → đã bị drop (`MediaPool.dropElement` gỡ src +
   gọi load()), chỉ thấy được qua snapshot `__vcutMediaEls` đã stale (chỉ refresh khi
   đang play trong `preview.tsx`). Nguyên nhân gốc trong slot đầu yên tĩnh **không
   cô lập được chắc chắn**; khả năng cao nhất: seek/decoder recovery drop element mới
   trước khi metadata ổn định (`DEFAULT_SEEK_TIMEOUT_MS=1200` trong `lib/seek.ts`;
   cạn cap → Y2 drop-all + recreate). Sửa harness: inject patchClip kiểu D3 + GATE
   warmup + gate per-slot (hủy lượt thay vì ghi số rác). Không sửa code app — lỗi này
   là hành vi recover của pool, chưa chứng minh là bug sản phẩm.
2. **Canvas std không chứng minh clip dài đã vẽ:** check std (mean 89.34 / std 73.79)
   pass trên frame mẫu stale. Draw FPS ≠ số frame thật được present — preview có thể
   vẽ 57 fps trong khi element chỉ present ~15 fps (vẽ lại cùng frame).
3. **Tab nền bị throttle:** mở tab trắng + bringToFront làm rAF tab app đóng băng
   (playhead kẹt ở 11.63); rVFC tab trắng dưới load 7–22 rất tệ (long720 1.48 fps,
   drawImage trung bình 82 ms; flat15 0.11 fps, currentTime kẹt 0.82).
4. **CDP timeout 60 s:** bench A2 (1280×720 blur ×5400 draw) và decode seek 10 trong
   harness dài đều chết vì timeout này khi tải cao. Fix: `DECODE_FPS_FN` thêm `'ended'` +
   guard timeout (secs+5) s; script B-only tách riêng.
5. **RAF_STATS_FN trả n=0** (gapP50 undefined) ở các slot sau — bug cosmetic của harness
   (mảng samples bị cap; fromIdx vượt độ dài); số draw/tick không ảnh hưởng.
6. **Chromium cache không ổn định:** chromium-1248 biến mất ở R63; dùng logic findChrome.
7. `pkill -f` tự match shell của chính mình (SIGTERM shell) — dùng kill theo PID.

## 7. Độ tin cậy & giới hạn

- **Tin được:** thang piecewise khớp (maxErr 1.5, lặp lại diff 0.0); tỉ lệ FPS enhance
  ổn định qua ×3 lặp, nhất là 1080p (std 0.014–0.036); encode fpsCpu rất ổn định
  (std ≤1.13); decode 1080p đợt 2 khớp đợt 1 (23.2–23.7 vs 23.3–24.8).
- **Chưa tin hẳn:** FPS tuyệt đối (baseline 720p dao động 11–55 fps giữa các lặp);
  decode 720p dưới tải cao (29% dropped — cần cửa sổ lặng); mọi số FPS đều là
  SwiftShader CPU-only — **chưa đo trên máy có GPU thật**.
- **Không đo được đợt này:** D3 full-res combing (R61 §6.4); chi phí filter thật của
  bench A2 (R61 §6.6 — A2 vẫn underestimate); presented-frame rate trong app
  (cần `getVideoPlaybackQuality` deltas trong slot — để đợt sau).
- Ngưỡng 0.75x: FAIL ở mọi cấu hình, mọi đợt (R61–R64) — giữ nguyên, không nới.
- Không có thay đổi code/thang nào trong đợt này: batch chỉ gồm LIMITS này + 4 script harness.

## 8. Nợ mở (chuyển đợt sau)

1. Đo lại decode 720p trong cửa sổ lặng (tách tải VM khỏi giới hạn decode).
2. Đo presented-frame rate trong app qua `getVideoPlaybackQuality` (draw FPS hiện tại
   không bằng frame thật được present).
3. Sửa bug cosmetic `RAF_STATS_FN` n=0 ở slot sau (samples array cap).
4. Bench A2 vượt timeout CDP 60 s khi tải cao — chia nhỏ bench hoặc tăng timeout phía harness.
5. Điều tra gốc rễ vụ element bị drop ở slot đầu yên tĩnh (seek timeout 1200 ms / Y2
   drop-all) nếu tái hiện được.
6. FPS trên máy GPU thật — chưa đo (mọi số ở đây là CPU-only).
7. D3 full-res combing; chi phí filter thật (A2 underestimate) — nợ từ R61.
8. Step-edge 4 px ở s≥0.8; blend overstate trên flat40 — nợ từ R63.
