# PHASE 9 ĐỢT 62 — R3: Denoise preview chuyển sang blend + motion blur hết blend lúc pause + chặn stabilize khi có speed ramp

**Trạng thái: ĐÃ LÀM + ĐÃ ĐO (code đổi) — KHÔNG push.**
Đóng nợ đợt 61 R3 §2.5/§6.2 (thang blur overstate đầu thấp + làm mềm cạnh +
vùng chết), §6.5 (stabilize+speedKeyframes mâu thuẫn preview/render) và
§3 (motion blur còn blend sau khi pause). Mọi số dưới đây là số đo thật
trên VM này (4 vCPU, ~8GB RAM, CPU-only, headless Chromium qua Xvfb +
CDP), không ước lượng. Fixture video chỉ giữ script gen (không binary
trong batch); media đo nằm ở scratch `/home/hatch/workspace/.scratch-r61r3-1cOf/media/`
(đợt 61, dùng lại) và log/probe JSON ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round62-r3/`.

## 0. Thay đổi code trong đợt này

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | Cơ chế denoise mới: **blend** `(1-a)·gốc + a·blur(3.0px)`, `a = strength` (`denoiseBlendAlpha`, bán kính cố định `ENHANCE_PREVIEW_BLUR_RADIUS_PX = 3.0`); `denoiseBlurPx(s)` nay trả 3.0 khi s>0, 0 khi s=0. `enhancePreviewPlan` thêm tham số `hasSpeedKeyframes` (mặc định false): clip có speed ramp thì stabilize bị chặn (zoom 1, vào `notApproximated`, cờ `stabilizeBlockedBySpeedRamp`). Plan/debug thêm field `denoiseBlendAlpha`, `stabilizeBlockedBySpeedRamp`. |
| `apps/web/src/preview.tsx` | `enhancePreviewSource` vẽ 2 lần: khung gốc rồi vẽ đè bản `blur(3.0px)` với `globalAlpha = blendAlpha` (cùng hình học zoom) — không cần canvas phụ. `ghostWeights` chỉ tính khi `drawTransport.playing` (motion blur không blend lúc pause/scrub). Call-site truyền `clip.speedKeyframes !== undefined` vào plan. |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Kỳ vọng theo cơ chế mới (blur 3.0 + alpha = strength; plan 9 key). |
| `apps/web/src/components/enhance/enhancePreview61R3.test.ts` | Kỳ vọng theo cơ chế mới; giữ phần lịch sử đợt 61, thêm ghi chú đợt 62 thay cơ chế. |
| `apps/web/src/components/enhance/enhancePreview62R3.test.ts` | **Mới**: 10 test khóa blend (alpha = strength, liên tục không plateau, hết vùng chết, hook đủ field) + speed-block (6 test). |
| `apps/web/scripts/probe-downscale-r62.mjs` | **Mới**: probe downscale-upscale (đã thử và LOẠI — xem §2.1). |
| `apps/web/scripts/probe-blend-r62.mjs` | **Mới**: probe alpha-blend blur (cơ chế được chọn — xem §2.2). |
| `apps/web/scripts/clicktest-60q1-enhance-preview.mjs` | Hook kỳ vọng blur 1.5 → 3.0 + alpha 0.5 (B1/B2/B4/B5). |
| `apps/web/scripts/clicktest-61r3-fps-cal.mjs` | Hook kỳ vọng blur 3.0 + alpha 0.5; `BLUR_CAL_FN` → `BLEND_CAL_FN`, step-edge theo blend; micro-bench đo composite 2 lần vẽ; verdict B đo đường cong blend vs hqdn3d. |
| `apps/web/scripts/clicktest-61r3-combo.mjs` | C6: blur 3.0 + alpha 0.5, zoom 1 (stabilize bị chặn vì clip có SR); C3 viết lại (đo tồn dư lúc pause bằng patch + transient lúc đang phát — xem §3). Thêm helper `playPauseSettled`, `snapWhilePlaying`. |

Không đụng `i18n/vi.json` / `en.json` (không thêm key mới: cảnh báo
speed-block đã có trong panel từ đợt 61 R2; text "xem trước xấp xỉ" vẫn
đúng với cơ chế blend), không đụng spec/render (quyết định (c) là chặn
ở preview — xem §4).

## 1. (a) FPS preview sau khi đổi sang blend — KHÔNG KẾT LUẬN ĐƯỢC (VM nhiễu)

**Phương pháp:** như đợt 61 (9 slot xen kẽ `[B,D,B,S,B,I,B,C,B]`, mẫu
3.0s/slot, tỉ lệ drift-corrected so với 2 baseline kề; warmup 6s).
Chạy 2 lần trong đợt này, cả 2 lần đều nhiễu tải nặng:

| Slot | Lần 1 (load 1.7→10.3) | Lần 2 rerun (load ~1.0–1.4) | Đợt 61 run 5 (load 1.3–1.9) |
|---|---|---|---|
| baseline 5 slot | 12.28 / 10.25 / 9.65 / 25.42 / 58.28 (drift **48.63**) | 55.44 / 29.04 / 28.70 / 20.49 / 59.79 (drift **39.30**) | 58.97 / 59.19 / 59.63 / 57.95 / 59.29 (drift ~1.7) |
| denoise | 5.99 → **0.53x** | 12.54 → **0.30x** | 35.23 → **0.60x** |
| stabilize | 21.07 → 2.12x | 23.90 → 0.83x | 59.63 → 1.00x |
| deinterlace (no-op!) | 11.27 → 0.64x | 20.37 → 0.83x | 59.85 → 1.00x |
| combo | 29.31 → **0.70x** | 21.98 → **0.55x** | 36.40 → **0.62x** |

**Đọc kỹ:** deinterlace là no-op (không đổi pixel, không offscreen)
nhưng đo được 0.64x / 0.83x, còn stabilize (chỉ zoom, rẻ) đo được
2.12x ở lần 1 — 2 con số này tự chứng minh tỉ lệ lúc này là nhiễu
tải, không phải chi phí enhance. Baseline dao động 20→60 fps giữa
các slot trong cùng 1 lần chạy dù load 1-phút chỉ ~1.0–1.4 (load
15-phút duy trì 3.4–3.7 suốt buổi tối vì 8–10 luồng đợt 62 chạy song
song: lúc rerun xong vẫn thấy 1 luồng khác đang `vite build` 105%
CPU). Playhead vẫn tiến đúng ~1.0x ở mọi slot (timeline không lag).

**Kết luận trung thực: chi phí FPS của cơ chế blend CHƯA ĐO ĐƯỢC
trong đợt này.** Số 0.30x/0.55x (rerun) và 0.53x/0.70x (lần 1) KHÔNG
so sánh được với 0.60x/0.62x của đợt 61 vì baseline drift 39–49 fps
(vs ~1.7 fps ở đợt 61). Micro-bench A2 (blend a=0.5 thêm +0.007ms
record time ở 488×275) KHÔNG dùng làm bằng chứng — đợt 61 §1 đã
chứng minh micro-bench canvas tách rời đánh giá thấp chi phí raster
thật. Cần đo lại trong cửa sổ yên (không có luồng khác chạy build/
harness song song) trước khi kết luận blend rẻ/đắt hơn blur thuần.
Case A FPS FAIL theo thiết kế ở cả 2 lần chạy (ngưỡng 0.75x) — giữ
nguyên ngưỡng, không nới.

**Phần còn lại của harness fps-cal rerun (7/8):** A-hook PASS (hook
khớp cả 9 slot: blur 3.0 + alpha 0.5); A2 PASS (chỉ tham khảo, xem
trên); **B PASS** — harness đo lại độc lập đường cong blend: 720p
a=0.3 → -28.7% (probe -28.9%), a=0.5 → -47.0% (-48.4%), a=0.8 →
-72.6% (-73.6%), a=1.0 → -83.7% (-83.7%); hqdn3d cùng metric -18.8% /
-46.8% / -73.9% / -83.4% (khớp số đợt 61); step-edge 0px ở a≤0.5,
4px ở a≥0.8; 488×275: a=0.3 → -29.5%, a=0.5 → -47.9%, a=0.8 →
-74.4%, a=1.0 → -87%. D1 PASS (combing interlaced R=1.12 vs
progressive 0.69, tỉ lệ 1.6x — khớp đợt 61). D2 PASS (render yadif:
idet prog 0 → 0.993, đối chứng 0; render 46.54 fps). D3 PASS (R=0.53
vs 0.50 ở canvas preview — khớp đợt 61). H9 PASS (0 lỗi trang).
Lần chạy đầu tiên lỗi CDP timeout sau case A (exit 2) nên B/D không
chạy được lần đó — rerun đã chạy đủ.

## 2. (a) Thang denoise mới: blend thay blur thuần

### 2.1 Downscale-upscale đã thử và LOẠI (probe-downscale-r62)

Đo 17 hệ số f = 0.95 → 0.15 trên frame15 (1280×720, std gốc 14.412),
lặp lại cho cùng số; cùng đo ở 488×275 và frame40:

| f | Giảm std (720p) | Ghi chú |
|---|---|---|
| 0.95 | **-37.0%** | mức hiệu quả nhỏ nhất đã -37% — không diễn tả được -19% (s=0.3) |
| 0.9 – 0.75 | -37% → -39% | gần như phẳng |
| 0.7 – 0.3 | -43% → -49% | dẹt, dao động không đơn điệu (0.65 -43.2% rồi 0.6 -42.7%) |
| 0.25 | **-66.1%** | nhảy bậc |
| 0.2 | **-33.0%** | DỊ THƯỜNG: giảm ÍT hơn cả f=0.25 — lặp lại nhất quán ở cả 4 dataset (720p/preview × flat15/flat40), là quirk của bộ resample Chromium ở tỉ lệ này, không phải nhiễu đo |
| 0.15 | -48.0% | lại về ~-48% |

Ở 488×275 (base std 8.241): f=0.95 → -43.7%, f=0.5 → -61.5%,
f=0.25 → -56.1%, f=0.2 → -43.8% — cùng hình dạng dẹt + nhảy bậc.
Hybrid downscale+blur (f=0.5+blur0.9 → -65.2%, f=0.5+blur1.5 →
-70.5%) cũng không tới được -83% ở đầu cao mà vẫn nhảy -37% ở đầu
thấp. **Kết luận: downscale-upscale có lượng tử hóa riêng của nó, còn
tệ hơn blur (không có mức nào dưới -37%, đường cong không đơn điệu,
dị thường ở f=0.2) — LOẠI.** Lưu ý: probe vòng 1 đo step-edge SAI
(đo cạnh trên ảnh nhiễu thay vì áp biến đổi lên canvas cạnh — cho
-1px/garbage); số edge ở §2.2 đo lại đúng bằng probe-blend.

### 2.2 Blend alpha — cơ chế được chọn (probe-blend-r62)

Composite = (1-a)·gốc + a·blur(3.0px), a = strength. Đo ở 4 mức
strength thật + lưới mịn a = 0.1 → 1.0, lặp lại cho cùng số:

**flat15 1280×720 (std gốc 14.412), B=3.0px:**

| strength (a) | Giảm std | hqdn3d (mục tiêu) | Sai số | Step-edge |
|---|---|---|---|---|
| 0.1 | -10.1% | — | — | 0px |
| 0.2 | -19.5% | — | — | 0px |
| **0.3** | **-28.9%** | **-19%** | **+9.9** | 0px |
| 0.4 | -38.4% | — | — | 0px |
| **0.5** | **-48.4%** | **-47%** | **+1.4** | 0px |
| 0.6 | -56.7% | — | — | 2px |
| 0.7 | -65.2% | — | — | 2px |
| **0.8** | **-73.6%** | **-74%** | **-0.4** | 4px |
| 0.9 | -80.1% | — | — | 4px |
| **1.0** | **-83.7%** | **-83%** | **+0.7** | 4px |

So với thang blur thuần đợt 61 (sai số +41 / +21 / +6 / +1): blend
tốt hơn hẳn ở mọi mốc, nhất là đầu thấp (+9.9 thay cho +41) và gần
như khớp ở 3 mốc còn lại (≤1.4). Đường cong LIÊN TỤC thật: mọi mức
a cách nhau 0.1 đều cho giảm std khác nhau (không plateau), và a>0
luôn đổi pixel (không còn vùng chết s<~0.27). Step-edge 0px ở a≤0.5
(blur thuần đã 2px ở s=0.3), 2px ở a=0.6–0.7, 4px ở a≥0.8.

**Vì sao không dùng B=1.5px:** a=0.3 → -24.6% (sai +5.6, tốt hơn
B=3 ở mốc này) nhưng a=0.5 → -40.7% (sai -6.3), a=0.8 → -59.8%
(sai -14.2), a=1.0 → -67.6% (sai -15.4) — đầu cao thiếu hẳn. B=3.0
thắng toàn cục (sai trung bình 3.1 vs 10.4).

**Ở kích thước preview 488×275 (B=3):** a=0.3 → -29.5% (sai
+10.5), a=0.5 → -50.4% (+3.4), a=0.8 → -76.1% (+2.1), a=1.0 →
-87.0% (+4.0) — nhỉnh hơn 720p vài điểm vì khung preview đã qua 1
lần downscale (std gốc chỉ 8.241), nhưng cùng thứ tự độ lớn.

**Không dùng đường cong fitted:** a cần để khớp đúng 4 mốc là
0.195 / 0.486 / 0.806 / 0.981 — không theo luật lũy thừa gọn nào
(p fit ra 1.36 / 1.04 / 0.97 ở 3 mốc), và giá trị cần ở 720p khác ở
preview (đặc biệt s=1.0: 0.98 vs 0.90). Piecewise-linear qua 4 mốc
sẽ là overfit theo 1 fixture — giữ `alpha = strength` tuyến tính,
chấp nhận sai +9.9 ở s=0.3 và ghi rõ.

**Những gì blend VẪN sai (trung thực):**
- Đầu thấp vẫn overstate: s=0.3 cho -28.9% trong khi render -19%.
  Đây là giới hạn của mọi xấp xỉ không gian tuyến tính trên nhiễu
  trắng (không có mức alpha nào dưới -10% mà vẫn khác 0 trừ a<0.1).
- Trên footage nhiễu nặng (flat40): blend cho gần như Y HỆT flat15
  (a=0.5 → -47.9%, a=1.0 → -84.7%) trong khi hqdn3d s=0.5 chỉ -5.0%,
  s=1.0 chỉ -26.7% — overstate rất mạnh trên nhiễu nặng, như blur
  thuần trước đây. hqdn3d có thành phần thời gian + thích nghi theo
  mức nhiễu mà không xấp xỉ không gian nào tái tạo được.
- Step-edge vẫn 4px ở a≥0.8 (bằng blur thuần ở s=1.0) — preview ở
  strength cao vẫn mềm hơn render thật.
- Chỉ hiệu chuẩn trên vùng phẳng + nhiễu; metric std không nói gì về
  chi tiết/texture thật.

### 2.3 Bằng chứng headed Q1 (sau khi đổi cơ chế): 7/7

Harness Q1 chạy lại sau khi sửa hằng: B1 (denoise bật, alpha 0.5):
pixel A→B mean abs diff **0.8125**, 31.62% channel đổi (thang cũ blur
1.5px: 0.5659, 14.47% — blend đổi pixel mạnh hơn, đúng vì a=0.5/B=3
khử mạnh hơn blur 1.5px). B3: tắt toggle → pixel A→D mean **0**
(trả đúng khung gốc). B2/B4/B5 như thiết kế (zoom 1.023, deinterlace
0 pixel đổi).

## 3. (b) Motion blur hết blend sau khi pause

### 3.1 Nguyên nhân gốc (điều tra)

`drawVideoClip` blend bất kể trạng thái transport: chỉ cần ring
snapshot còn frame cũ là blend. Vòng lặp pause: cạnh xuống
playing→paused đặt `lastDrawn = null` → seek + vẽ lại ĐÚNG 1 lần rồi
ngủ với canvas đó. Lần vẽ lại duy nhất đó vẫn blend với snapshot cũ
(ring chỉ nhận thêm 1 snapshot khung hiện tại mỗi lần vẽ), nên vệt
mờ không bao giờ rửa sạch. Số đo trước fix (đợt này, combo harness
trên code cũ): C3 FAIL — đối chứng immediate-vs-settled 2.12 (nhiễu
căn chỉnh), blend tồn dư settled-vs-tắt **2.41** (đợt 61 run 5:
1.39–2.77).

### 3.2 Sửa

Gate 1 dòng ở `drawVideoClip` (`preview.tsx`): `ghostWeights` chỉ
tính khi `drawTransport.playing` (vòng lặp đặt `playing: true` trước
`renderFrame` ở nhánh phát, `false` ở mọi nhánh pause/seek — đã kiểm
chứng 3 vị trí gán). Ngữ nghĩa đúng: tmix của 1 khung đứng yên chính
là khung đó. Mọi đường `updateMotionBlurSnapshots` đều đi sau
`ghostWeights.length > 0` nên lúc pause cũng không cập nhật snapshot
— resume phát thì ring vẫn giữ các frame ngay trước điểm pause, đúng
đầu vào tmix lúc resume. Không đụng `previewEngine.ts` (plan blend
không đổi), không đụng ring buffer.

### 3.3 Đo headed sau fix (combo harness, C3 viết lại — 9/9)

Phương pháp cũ (snapshot ngay sau pause) không còn đo được gì sau
fix — transient lúc pause biến mất THEO THIẾT KẾ — nên C3 đo 2 thứ
tách biệt, không seek giữa 2 snapshot của phép so tồn dư (patchClip
kích redraw ở cùng playhead):

| Đo | Kết quả | Ý nghĩa |
|---|---|---|
| 3a sàn patch/redraw (blur tắt) | **0** | patch + redraw ở cùng playhead là xác định tuyệt đối |
| 3b blend tồn dư sau pause (blur bật, phát 2s → pause → settled → tắt blur) | **0** (trước fix 2.41; đợt 61: 1.39–2.77) | **pause hết blend tồn dư** |
| 3c transient lúc đang phát (snapshot trong lúc phát vs tắt-blur settled cùng ph) | **2.3059** (23.88% đổi) | blend vẫn sống lúc phát |
| 3d sàn căn chỉnh (blur tắt, cùng quy trình 3c) | 0.5208 | transient gấp **4.4x** sàn — tín hiệu thật, không phải nhiễu căn chỉnh |

C5 vẫn pixel-identical (mean 0), C7 pipeline sống (mean 3.1966).

## 4. (c) Stabilize + speedKeyframes: QUYẾT ĐỊNH — chặn ở preview (đồng bộ 3 lớp)

### 4.1 Bằng chứng mâu thuẫn (đã có + xác minh lại đợt này)

- Render chặn hẳn 2 lớp: `validate.js` (speedKeyframes + enhance.stabilize
  → lỗi, exit 1) và `render.js`/`buildSpeedRampVideo` (defense in depth).
- Panel đã chặn ở UI từ đợt 61 R2 (hướng (i) trong `presets.ts`):
  preset Cân bằng/Mạnh bị tắt khi clip có speed curve, checkbox chống
  rung không cho bật mới — nhưng trạng thái lỗi CŨ (tạo trước khi chặn,
  qua MCP/CLI/file project) vẫn sửa được bằng cách tắt.
- Preview là lớp duy nhất còn "vẽ được": `enhancePreviewPlan` không
  biết clip có speed ramp hay không nên vẫn cho zoom gợi ý 1.023.

### 4.2 Vì sao KHÔNG mở ở render trong đợt này

`runStabilizeDetect` chạy ĐÚNG 1 pass vidstabdetect trên toàn bộ trim
`[in, in+duration*speed)` → 1 file `.trf` đánh chỉ số theo số frame
của stream đã trim đó. `buildSpeedRampVideo` chia clip thành nhiều
đoạn, mỗi đoạn tự `trim + setpts=PTS-STARTPTS` (đánh số frame lại từ
0) rồi áp `enhPreChain` chứa `vidstabtransform` với cùng 1 file .trf
đó → đoạn 2+ đọc sai hàng .trf (và cả đoạn 1 cũng lệch do
`setpts=PTS/speed` giãn timestamp). Mở ở render đòi: vidstabdetect
riêng từng đoạn ramp (N pass, N file .trf), luồn đường .trf từng đoạn
vào `buildSpeedRampVideo`, sửa key cache .trf (đợt 62 R2) theo đoạn,
và kiểm chứng render thật — là việc của 1 luồng riêng cả đợt, không
phải sửa nhỏ. Ghi lại làm hướng tương lai, không làm nửa vời ở đây.

### 4.3 Quyết định (đã làm)

**Chặn ở preview, đồng bộ 3 lớp** (UI panel + preview plan + render
validator đều chặn; fail-fast ở render vẫn giữ nguyên là thiết kế cố
ý — xem `presets.ts` hướng (i)): `enhancePreviewPlan(enh, enabled,
hasSpeedKeyframes)` — clip có ramp thì stabilize zoom = 1, stabilize
vào `notApproximated`, cờ `stabilizeBlockedBySpeedRamp = true`;
denoise vẫn áp bình thường. Bằng chứng headed (combo C6 — clip có
cả SR + stabilize do setup bật stabilize trước khi patch SR, đúng
trạng thái lỗi cũ): hook `stabilizeZoom 1`,
`stabilizeBlockedBySpeedRamp true`, `applied ["denoise"]`,
`notApproximated ["deinterlace","stabilize"]`, `denoiseBlurPx 3`,
`denoiseBlendAlpha 0.5`, `offscreenApplied true`. Unit test khóa 6
case trong `enhancePreview62R3.test.ts` (chặn / không ramp / không
stabilize / strength 0 / toggle tắt / hook).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Unit mới `enhancePreview62R3.test.ts` | **10/10** |
| Unit hiệu chuẩn `enhancePreview61R3.test.ts` (kỳ vọng mới) | **7/7** |
| Q1 unit `enhancePreview60Q1.test.ts` vi + en | **16/16 + 16/16** |
| P8 unit `enhancePresets59P8.test.ts` vi | **21/21** |
| Speed-block R2 `enhanceSpeedBlock61R2.test.ts` vi | **9/9** |
| previewEngine (`previewEngine.test.ts`) | **14 pass** |
| `tsc --noEmit` (apps/web) | **ĐỎ do luồng R62 khác đang sửa** (xem §6) — không có lỗi nào ở file đợt này |
| `vite build` (chỉ vite, không tsc) | **pass** (cảnh báo chunk >500kB có từ trước) |
| Headed Q1 (sau khi đổi cơ chế) | **7/7** (§2.3) |
| Headed combo (sau fix, C3+C6 mới) | **9/9** (§3.3, §4.3) |
| Headed fps-cal (A/A2/B/D1/D2/D3) | **7/8** (chỉ A FPS FAIL theo thiết kế; xem §1 — FPS blend chưa kết luận được do VM nhiễu) |

## 6. Nợ mở (thêm trong đợt này)

1. **FPS enhance trên máy có GPU thật chưa đo** — mọi số FPS vẫn chỉ
   đúng cho headless Chromium/SwiftShader trên VM CPU-only (nợ cũ từ
   đợt 61, còn nguyên).
2. **Thang blend vẫn overstate ở đầu thấp** (§2.2): s=0.3 sai +9.9
   (tốt hơn +41 của blur thuần nhưng chưa khớp); trên nhiễu nặng
   (flat40) overstate rất mạnh (blend -84.7% vs hqdn3d -26.7% ở
   s=1.0). Muốn đúng hơn nữa cần xấp xỉ có thành phần thời gian /
   thích nghi theo mức nhiễu — việc riêng, chưa có thiết kế.
3. **Step-edge vẫn 4px ở a≥0.8** — preview strength cao mềm hơn render.
4. **`tsc --noEmit` toàn repo đang ĐỎ do các luồng R62 khác chạy song
   song** (lỗi TS5097/TS6133 ở `nestedPreview.ts`,
   `projectAssetRefs62R7.test.ts`, `pauseStall62R6.test.ts` — không
   file nào thuộc đợt này; lỗi đổi giữa các lần chạy vì file đang bị
   sửa). Parent cần chạy lại tsc sau khi gộp các luồng. `vite build`
   (không tsc) pass, chứng tỏ file đợt này bundle được.
5. **Mở stabilize+speedKeyframes ở render** (vidstabdetect từng đoạn
   ramp) là việc riêng — xem §4.2. Tới lúc đó, preview + panel + render
   đều đang chặn nhất quán, không có mâu thuẫn nào còn mở.
6. **Micro-benchmark canvas tách rời vẫn đánh giá thấp chi phí filter**
   (nợ đợt 61 §6.6, còn nguyên): A2 trong fps-cal chỉ để tham khảo,
   không dùng làm bằng chứng chi phí — xem §1.
7. **D3 (combing preview ở full-res) chưa đo** — nợ cũ đợt 61 §6.4,
   còn nguyên (harness fps-cal D3 đo ở kích thước preview).
8. **FPS của cơ chế blend chưa kết luận được** (§1): cần đo lại 1 lần
   fps-cal trong cửa sổ yên (không luồng nào chạy build/harness song
   song) trước khi kết luận blend rẻ/đắt hơn blur thuần; hiện chỉ có
   2 lần chạy đều nhiễu (baseline drift 39–49 fps).
