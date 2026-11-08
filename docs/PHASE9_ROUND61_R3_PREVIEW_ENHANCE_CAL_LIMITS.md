# PHASE 9 ĐỢT 61 — R3: Preview Enhance — Đo FPS, Hiệu chuẩn thang blur, Combo, Deinterlace

**Trạng thái: ĐÃ ĐO + ĐÃ HIỆU CHUẨN (code đổi) — KHÔNG push.**
Đóng nợ đợt 60 §5.3 (Q1 preview enhance). Mọi số dưới đây là số đo thật trên VM
này (4 vCPU, ~8GB RAM, CPU-only, headless Chromium qua Xvfb + CDP), không
ước lượng. Fixture video chỉ giữ script gen (không binary trong batch);
media đo nằm ở scratch `/home/hatch/workspace/.scratch-r61r3-1cOf/media/`
(không đưa vào batch).

## 0. Thay đổi code trong đợt này

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | `ENHANCE_PREVIEW_BLUR_MAX_PX` 1.2 → **3.0** (thang denoise 0..1 → blur 0..3.0px); comment ghi rõ bằng chứng + giới hạn còn lại. Hàm `denoiseBlurPx` vẫn tuyến tính, chỉ đổi hằng. |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Cập nhật kỳ vọng khóa thang cũ (0.6 @ 0.5, 1.2 @ 1.0, MAX 1.2) → thang mới (1.5 @ 0.5, 3.0 @ 1.0, MAX 3.0), kèm ghi chú lý do. |
| `apps/web/src/components/enhance/enhancePreview61R3.test.ts` | **Mới**: 7 test khóa hiệu chuẩn (đỏ-trước 1/7 → xanh 7/7 sau khi đổi code). |
| `apps/web/scripts/clicktest-60q1-enhance-preview.mjs` | Hằng blur kỳ vọng 0.6 → 1.5 (giữ harness Q1 nhất quán với thang mới; chạy lại headed 7/7, xem §5). |
| `apps/web/scripts/clicktest-61r3-fps-cal.mjs` | Harness (a)/(b)/(d): kỳ vọng hook + micro-bench theo thang mới (blur 1.5/3.0px), slot warmup 6s, D3 dùng cổng kiểm tra canvas thay cho poll element (xem §4.3). |
| `apps/web/scripts/clicktest-61r3-combo.mjs` | Harness (c): kỳ vọng hook blur 0.6 → 1.5. |
| `apps/web/scripts/clicktest-61r3-fps-cal-run1.mjs` | Giữ nguyên bản run 1 (bằng chứng lịch sử, không sửa). |
| `apps/web/scripts/probe-blur-fine.mjs` | **Mới**: probe lượng tử blur (server HTTP riêng + Chromium headed, không cần vite). |

Không đụng `preview.tsx` (không cần — mọi đo dùng hook có sẵn), không đụng
`i18n/vi.json` / `en.json`, không thêm key i18n mới.

## 1. (a) FPS preview trước/sau enhance — denoise làm tụt FPS vẽ thật

**Phương pháp:** project mẫu (2 clip video 4s, 640×360 webm), canvas preview
backing 871×275, chơi thật 3.0s/slot, đo `Δ__vcutHoldStats.draw / Δwall`
(tốc độ vẽ thật), kèm gap rAF và tốc độ tiến playhead. Thứ tự xen kẽ
`[B,D,B,S,B,I,B,C,B]` (B=baseline, D=denoise, S=stabilize, I=deinterlace,
C=combo), tỉ lệ drift-corrected so với 2 baseline kề. Harness:
`apps/web/scripts/clicktest-61r3-fps-cal.mjs`.

**Run 5 (run cuối, loadavg 1.3–1.9, yên nhất) — kết quả chính:**

| Slot | Cấu hình | Draw fps | Tick fps | Playhead | gapP50 | Tỉ lệ vs baseline kề |
|---|---|---|---|---|---|---|
| 1/3/5/7/9 | baseline (enhance tắt) | 58.97 / 59.19 / 59.63 / 57.95 / 59.29 (mean **59.01**) | ~59 | ~1.0x | 16.7ms | — |
| 2 | denoise (blur 1.5px) | **35.23** | 35.23 | 1.019x | 33.3ms | **0.60x** |
| 4 | stabilize (zoom 1.023) | 59.63 | 59.96 | 0.999x | 16.7ms | 1.00x |
| 6 | deinterlace (không đổi pixel) | 59.85 | 60.19 | 1.009x | 16.7ms | 1.00x |
| 8 | combo (cả 3) | **36.40** | 36.73 | 1.004x | 33.3ms | **0.62x** |

**Kết luận:** chỉ **blur denoise** tốn FPS vẽ thật: từ ~59 fps xuống ~35–36 fps
(0.60–0.62x) trên VM này. Stabilize (zoom) và deinterlace (no-op) không tốn
gì đo được (1.00x). Combo tốn đúng bằng denoise đơn lẻ — chi phí nằm ở blur,
không phải ở số tính năng bật. Playhead vẫn tiến đúng 1.0x tốc độ wall ở mọi
slot (timeline không lag, chỉ khung vẽ thưa hơn → preview giật hơn, không
sai nhịp).

**Bằng chứng tái lập qua 5 run:** run 1 combo 0.62x (nhưng load tăng đơn điệu
11.5 → 17.8 nên không kết luận được); run 2 combo 0.51x (load tăng, slot
baseline kề cũng tụt); run 3 denoise **0.57x** (33.22 fps) + combo **0.88x**
(52.83 fps — A FPS PASS lần duy nhất); run 4 combo 0.54x trong lúc load GIẢM
2.6 → 1.6 (denoise slot bị nhiễu warmup 23.29 fps); run 5 (có warmup 6s)
denoise 0.60x + combo 0.62x, load phẳng/giảm suốt run. **Lưu ý run 3:**
phase FPS của run 3 (21:24–21:25) chạy với code **cũ** (blur 0.6px — vite
load app trước lúc sửa `enhancePreview.ts` lúc 21:27), nên combo 0.88x là số
của thang cũ. Denoise ổn định qua 2 mức blur (0.57x ở 0.6px, 0.60x ở 1.5px)
→ chi phí nằm ở **đường filter/offscreen** chứ không phụ thuộc bán kính blur;
tỉ lệ combo dao động rộng hơn (0.54–0.88x) nên con số combo kém chắc hơn con
số denoise đơn lẻ — case A FPS (đo combo) PASS ở run 3, FAIL ở run 4–5.

**Micro-benchmark A2 (không tái hiện được chi phí):** blur+zoom trên canvas
tách rời (không hiển thị) chỉ thêm **+0.05ms/frame** ở 488×275 (+0.002ms ở
1280×720). Mâu thuẫn với -40% FPS ở đường preview thật → micro-bench đo thời
gian *ghi lệnh* (record), raster bị hoãn vì canvas không hiển thị; đường
preview thật phải raster + composite mỗi frame nên blur tốn thật (~11ms/frame
thêm trên VM này: gapP50 16.7 → 33.3ms). **Bài học đo:** benchmark canvas
tách rời đánh giá thấp chi phí filter; đừng dùng nó làm bằng chứng "enhance
rẻ".

**Giới hạn — đọc kỹ trước khi trích dẫn số 0.60x:**
- Đây là headless Chromium + SwiftShader (render phần mềm) trên VM CPU-only.
  Trên máy người dùng có GPU thật, chi phí blur có thể nhỏ hơn nhiều — **chưa
  đo trên máy có GPU, chưa kết luận về máy thật**.
- Chỉ đo ở canvas preview 871×275, clip mẫu 640×360. Canvas lớn hơn / clip
  4K có thể tốn hơn.
- Số tuyệt đối (59 fps) là trần vsync 60Hz của Xvfb, không phải năng lực máy.
- Case A FPS trong harness FAIL theo thiết kế (ngưỡng 0.75x, thực tế 0.62x) —
  đó là phát hiện thật, không phải lỗi harness.

## 2. (b) Hiệu chuẩn thang blur denoise — thang cũ SAI, đã đổi sang 0..3.0px

### 2.1 Thang cũ là no-op (bằng chứng)

Thang Q1: strength 0..1 → blur 0..1.2px. Đo bằng `ctx.filter = blur(Xpx)` trên
frame phẳng+nhiễu thật (flat15: gray + noise alls=15; flat40: alls=40), metric
std RGB mean trên vùng trung tâm + mean abs diff + step-edge:

- **0.3px và 0.6px: giảm std 0%, meanAbsDiff 0, step-edge rộng 0px** — không đổi
  pixel nào, ở cả 1280×720 và 488×275 (kích thước preview thật). Strength mặc
  định 0.5 (blur 0.6px) và preset Nhẹ 0.3 (0.36px) **không khử nhiễu gì trong
  preview** dù panel bảo "đang xem trước enhance".
- 0.9px nhảy vọt -59.8% và **0.9px == 1.2px output y hệt** (std, meanAbs, edge
  đều bằng nhau). Thang tuyến tính mịn là ảo tưởng.

### 2.2 Lượng tử hóa blur của Chromium (probe mịn — `probe-blur-fine.mjs`)

Đo 22 mức 0 → 3.0px trên frame15 (1280×720, std gốc 14.412), lặp lại 1 lần:

| Mức blur | Giảm std | Step-edge rộng | Ghi chú |
|---|---|---|---|
| 0 – 0.75px | **0%** | 0px (tâm 255) | **vùng chết** — no-op hoàn toàn |
| 0.8 – 1.3px | **-59.8%** | 2px | plateau 1 — mọi giá trị cho output Y HỆT |
| 1.4 – 1.8px | -67.6% | 2px | plateau 2 |
| 2.0 – 2.2px | -77.1% | 4px | plateau 3 |
| 2.4 – 2.8px | -79.8% | 4px | plateau 4 |
| 3.0px | -83.7% | 4px | plateau 5 |
| 4.0px | -87.1% | 6px | (đo ở harness v2) |

Đầu gối chính xác nằm **giữa 0.75 và 0.8px**. Lặp lại nhất quán (0.9px so với
nền 0.8px: 0%; 1.8px: -19.3%; 2.4px: -49.7% — khớp đúng tỉ lệ plateau).
Hình dạng tương tự ở 488×275 (0.6px → 0%; 0.9px → -69%; 1.2px y hệt 0.9px)
và flat40 (0.6px → 0%; 0.9px → -60.3% ở 1280×720 / -70.7% ở 488×275):
**lượng tử hóa là tính chất của blur Chromium, không phụ thuộc kích thước.**

### 2.3 Đối chiếu hqdn3d (render thật, cùng metric)

Frame hqdn3d-filtered trích từ video encode (flat15, std gốc 14.412):

| strength | hqdn3d giảm std | blur tương đương |
|---|---|---|
| 0.3 | **-18.8%** | không có mức blur nào cho -19% (mức hiệu quả nhỏ nhất đã là -60%) |
| 0.5 | **-46.8%** | 0.9px cho -60% (gần nhất) |
| 0.8 | **-73.9%** | 2.0px cho -77% |
| 1.0 | **-83.4%** | 3.0px cho -84% |

Lưu ý: nhiễu mạnh (flat40) hqdn3d gần như không chạm tới (s=0.5 → -5.0%,
s=1.0 → -26.7%) trong khi blur 0.9px đã -60% — thang blur overstate càng
mạnh trên footage nhiễu nặng (xem §2.5).

### 2.4 Thang mới (đã áp vào `enhancePreview.ts`)

**`denoiseBlurPx(s) = s × 3.0px`, `ENHANCE_PREVIEW_BLUR_MAX_PX = 3.0`.**

| strength | blur mới | mức plateau | Giảm std (blur) | hqdn3d (mục tiêu) | Sai số |
|---|---|---|---|---|---|
| 0.3 (Nhẹ) | 0.9px | 1 | -60% | -19% | **+41 (overstate)** |
| 0.5 (Cân bằng, mặc định) | 1.5px | 2 | -68% | -47% | +21 |
| 0.8 (Mạnh) | 2.4px | 4 | -80% | -74% | +6 |
| 1.0 | 3.0px | 5 | -84% | -83% | +1 ✓ |

Chọn tuyến tính ×3.0 vì 4 điểm hiệu chuẩn rơi vào đúng plateau đã đo, mỗi
điểm nằm giữa plateau (không sát biên 0.8/1.4/2.0/2.4) nên bền với dao động
nhỏ của đầu gối giữa các máy/Chromium; 4 mức strength cho 4 output khác nhau
(thang cũ: 0.3/0.5 đều no-op, 0.75/1.0 đều plateau 1 — không phân biệt được
preset). Test `enhancePreview61R3.test.ts` khóa 4 điểm này + tính đơn điệu
+ mọi preset vượt đầu gối 0.8px.

### 2.5 Những gì thang mới VẪN sai (trung thực — không giấu)

- **Đầu thấp overstate nặng:** s=0.3 hiện -60% trong khi render chỉ -19%.
  Không có cách khác trong cơ chế blur: mức hiệu quả nhỏ nhất của Chromium
  đã là -60%; phương án "giữ 0px" còn sai hơn (hiện khung gốc = 0%).
- **Làm mềm cạnh thật:** step-edge rộng 2px ở mức 1, 4px ở mức 5 (s=1.0),
  trong khi hqdn3d giữ cạnh tốt hơn. Preview ở strength cao sẽ mềm hơn
  render thật.
- **Vùng chết còn lại:** s < ~0.27 → blur < 0.8px → no-op. Trung thực ở mức
  độ: hqdn3d ở strength đó cũng chỉ giảm <15%, gần như không thấy.
- **Chỉ hiệu chuẩn trên vùng phẳng + nhiễu:** metric std không nói gì về
  chi tiết/texture thật; trên footage nhiễu nặng, preview overstate nhiều
  hơn nữa (xem §2.3, flat40).
- Thay blur bằng cơ chế khác (vd downscale-upscale để có mức mịn liên tục)
  là việc riêng, cần đụng `preview.tsx` (file chung, R8) — không làm trong
  đợt này.

## 3. (c) Click-test enhance + mask + speed ramp + motion blur cùng lúc — 9/9

Harness mới `apps/web/scripts/clicktest-61r3-combo.mjs` (headed thật, vite +
Xvfb + CDP). Setup bằng click thật (enhance combo) + `patchClip` (mask rect
0.5,0.5,0.6,0.6 feather 0.2; speed ramp 1→2 tuyến tính trên [0,4]s; motion
blur frames=4 weights 0.25). Run 5 (sau hiệu chuẩn, blur 1.5px):

| Case | Kết quả (run 5) | Ý nghĩa |
|---|---|---|
| C0 setup | PASS | enhance combo + mask + SR + motion blur cùng tồn tại trong store |
| C6 hook | PASS | blur 1.5, zoom 1.023, applied [stabilize,denoise], notApproximated [deinterlace], offscreen true |
| C5 xác định | PASS | snapshot E2 2 lần lúc pause: mean abs diff **0** (n=45126) |
| C4 hình học mask | PASS | góc ngoài mask mean **0** (<5), tâm mean **52.28** (>20) |
| C1 mask tách riêng | PASS | E2 vs no-mask: mean **9.65**, 44.59% channel đổi |
| C2 SR tách riêng | PASS | E2 vs no-SR @playhead 1.0: mean **9.91**, 51.11% đổi (ramp: nguồn 1.125s vs 1.0s) |
| C3 motion blur tách riêng | PASS | đối chứng (blur tắt) immediate-vs-settled **0**; blur bật immediate-vs-tắt **1.39**; washout **0**; blend còn lại sau settle vs tắt **1.39** |
| C7 pipeline sống | PASS | phát 1s với full combo, frame đổi mean 3.21 (24.52% đổi) |
| H9 0 lỗi trang | PASS | 0 window.onerror/unhandledrejection |

**Không vỡ thứ tự pipeline, không lỗi trang, pixel đổi đúng hướng ở mọi lớp.**
Lưu ý trung thực:
- C3 (motion blur) cần phương pháp "cùng playhead, immediate-vs-settled +
  đối chứng blur-tắt": run 2/3 FAIL oan vì so 2 lần phát-dừng ở playhead lệch
  nhau (±0.13s) — sai số căn chỉnh play-vs-seek lúc đó 0.51–1.32 meanAbs;
  run 4/5 đối chứng về 0–1.32 tùy lần chạy, blur bật luôn gấp ~2.5x đối
  chứng. Blend motion blur **còn lại sau khi pause** (settled-vs-tắt 1.39–
  2.77): vòng blur không rửa sạch sau ~1 lần vẽ lại — hành vi thật của
  preview, không phải bug đo.
- C1/C2 dao động giữa các lần chạy (6.6–9.9) do seek landing lệch dưới tải;
  mọi lần đều vượt xa ngưỡng.
- **Stabilize + speedKeyframes vẫn bị render chặn** (validator Q8 §4, exit 1)
  trong khi preview vẽ cả hai — mâu thuẫn có từ trước, không phải do đợt
  này; combo test chỉ chứng minh preview không vỡ, không chứng minh render
  được combo này.

## 4. (d) Deinterlace trên footage interlaced thật

Fixture (script gen, không binary trong batch): `interlaced720.mp4`
(testsrc2 60fps + `tinterlace=interleave_top`, 5s, 1280×720), `clean720.mp4`
(testsrc2 30fps progressive), `comb720.mp4` (interlaced + noise).

### 4.1 D1 — Decoder KHÔNG tự khử hết răng cưa (full-res)

Tỉ lệ cross-field/same-field (C/S) trên frame giải mã 1280×720, 3 mốc 1/2/3s:
interlaced **R=1.12** (C 1.545–2.025) vs progressive **R=0.69** (C ~0.93),
tỉ lệ 1.6x. Sửa kết luận mơ hồ của run 1 (tỉ lệ thô 1.47x): **răng cưa vẫn
thấy rõ sau decode**. (idet trên testsrc2 không tin cậy tuyệt đối — clean720
cho TFF 70/BFF 42/Prog 38 lẫn lộn — nên D1 dùng metric C/S trực tiếp, không
dựa vào idet.)

### 4.2 D2 — Render yadif làm việc thật

`render.js` với enhance deinterlace trên interlaced720: **idet prog 0 → 0.993**
(TFF 150→1, Prog 0→149); đối chứng không enhance: prog 0 (TFF 150). Tốc độ
render deint: 48.20 fps (run 5), 48.84 (run 4), 41.92 (run 2), 37.34 (run 3),
7.51 (run 1, tải nặng) — số tuyệt đối phụ thuộc tải VM, tỉ lệ prog mới là
bằng chứng.

### 4.3 D3 — Preview: răng cưa không đo được ở kích thước preview (do downscale)

Đo combing trên canvas preview thật sau khi nạp interlaced720 vào project mẫu
qua store + `patchClip` src, playhead 1.0s:
- Canvas interlaced: mean 92.27, **std 76.4** (n=38280) — frame video thật,
  không phải placeholder/màn đen.
- Combing: interlaced **R=0.53** (C=1.147, S=2.179) vs progressive **R=0.50**
  (C=1.074, S=2.128), canvas 871×275 — gần như bằng nhau.

**Giải thích đúng (không phải "decoder đã khử"):** D1 chứng minh răng cưa
VẪN CÒN sau decode ở full-res (R 1.12 vs 0.69). Ở preview, video 720p bị
downscale về ~275px chiều cao (tỉ lệ ~2.6x) nên mỗi dòng ra là trung bình của
nhiều dòng vào thuộc cả 2 field — cấu trúc xen kẽ field bị trung bình mất
trước khi đo. Đây là tác dụng phụ của downscale, không phải khử răng cưa
thật. Hệ quả: giới hạn Q1 "preview không đổi pixel cho deinterlace" ít gây
hại ở kích thước preview hiện tại (răng cưa đã bị downscale giấu), nhưng nếu
preview hiển thị full-res thì răng cưa sẽ lộ — và file xuất vẫn cần yadif
(xem D2).

**Lịch sử D3 (3 lần fail trước khi đo được — ghi để khỏi lặp lại):**
- Run 1: timeout chờ ngủ sau đổi src (không rõ nguyên nhân).
- Run 2/3: poll element trong `__vcutMediaEls` — hook đó **chỉ refresh ở
  nhánh playing** nên lúc pause nó giữ danh sách cũ từ đợt phát trước; cộng
  thêm tab trắng làm tab app bị occluded → **rAF dừng hẳn** (ticks đóng băng
  ở 2361 suốt 30s dù sleeping=false).
- Run 4: `Page.bringToFront` + đóng tab trắng làm rAF chạy lại (ticks
  2016→2041, vẽ xong lastDrawn=1) nhưng poll element vẫn stale.
- Run 5: bỏ poll element, dùng **cổng kiểm tra canvas thật** (std luma ≥ 8
  = frame video thật) → PASS. Bài học: đừng đo element qua hook chỉ refresh
  khi playing; đo pixel canvas trực tiếp.

## 5. Kiểm chứng (tất cả xanh trừ 2 case FAIL theo thiết kế — xem §1, §2.1)

| Kiểm chứng | Kết quả |
|---|---|
| Unit test hiệu chuẩn mới `enhancePreview61R3.test.ts` | **7/7** (đỏ-trước 1/7: kỳ vọng 0.9/1.5/2.4/3.0px, thực tế 0.36/0.6/0.96/1.2) |
| Q1 unit `enhancePreview60Q1.test.ts` vi + en | **16/16 + 16/16** |
| P8 unit `enhancePresets59P8.test.ts` vi + en | **21/21 + 21/21** |
| previewEngine (`previewEngine` 14 + `previewEngine51H6` 15 + `previewLoop50F2` 20) | **49 pass** |
| `tsc --noEmit` (apps/web) | **0 lỗi** toàn repo |
| `vite build` (tsc + vite) | **pass** (5.58s; cảnh báo chunk >500kB có từ trước) |
| Headed fps/cal v2 run 5 | **6/8** — A-hook PASS, A2 PASS, D1 PASS, D2 PASS, D3 PASS, H9 PASS; **A FPS FAIL (0.62x < 0.75x — phát hiện thật, §1)**; **B FAIL theo thiết kế (0.6px giảm 0% — bằng chứng thang cũ no-op, §2.1)** |
| Headed combo run 5 | **9/9** |
| Headed Q1 (chạy lại sau khi sửa hằng blur) | **7/7** (B1: mean abs diff 0.5659, 14.47% đổi với blur 1.5px; B5: deinterlace vẫn 0 pixel đổi) |

## 6. Nợ mở (thêm trong đợt này)

1. **FPS enhance trên máy có GPU thật chưa đo** — 0.60x chỉ đúng cho headless
   Chromium/SwiftShader trên VM CPU-only. Cần đo lại trên máy có GPU trước
   khi kết luận chi phí blur với người dùng thật (và trước khi quyết có tối
   ưu đường blur preview không, vd cache blur / giảm tần suất).
2. **Thang blur vẫn overstate khử nhiễu yếu** (§2.5) — không sửa được trong
   cơ chế blur hiện tại; muốn đúng hơn cần cơ chế khác (downscale-upscale
   hoặc filter khác), đụng `preview.tsx`.
3. **Vùng chết s < 0.27** — blur < 0.8px là no-op; slider denoise ở mức rất
   thấp không thấy gì trong preview (render cũng gần như không thấy — trung
   thực nhưng UX hơi khó hiểu).
4. **D3 chỉ đo ở kích thước preview letterbox** — chưa đo combing preview ở
   full-res (cần canvas lớn / fullscreen preview); dự đoán răng cưa sẽ lộ
   theo D1.
5. **Stabilize + speedKeyframes: preview vẽ được, render chặn** — mâu thuẫn
   có từ trước (Q8 §4), combo test không đóng được; cần quyết định thống nhất
   ngữ nghĩa (cho render hoặc chặn preview).
6. **Micro-benchmark canvas tách rời đánh giá thấp chi phí filter** (§1) —
   các benchmark tương tự trong repo (nếu có) cần xem lại phương pháp.
7. **A FPS case ngưỡng 0.75x** hiện FAIL với thang mới — giữ nguyên ngưỡng
   (nó đang làm đúng việc: báo chi phí thật), đừng nới ngưỡng để "cho xanh"
   khi chưa có số GPU thật.
8. **Harness Q1 headed** đã cập nhật hằng blur (0.6→1.5) và chạy lại 7/7 —
   không còn stale. (Đóng nợ ghi ở §5.3 đợt 60.)
