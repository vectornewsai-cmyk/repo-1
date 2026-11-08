# Phase 9 đợt 62 R8 — MCP `apply_transition` đủ 81 type + parity preview sharpen/noise

Ngày: 2026-11-08. Luồng R8, đợt 62. **KHÔNG push, KHÔNG release/tag,
KHÔNG binary vào batch.** Đóng nợ đợt 61 §5.10 (xem
`docs/PHASE9_ROUND61_R10_DOCS_INDEX_LIMITS.md` §7.1):
(a) MCP `apply_transition` chưa kiểm tra đủ tập type mới;
(b) effects preview sharpen/noise chưa kiểm chứng parity preview↔render.

## 0. Kết quả tóm tắt

| Hạng mục | Kết quả |
|---|---|
| MCP `apply_transition` đủ type | **ĐÓNG** — schema tool nay liệt kê đủ 82 entry; test MCP thật 19/19 (82/82 apply pass, 8/8 từ chối type lạ, server không crash) |
| Sharpen preview↔render | **XẤP XỈ** (không KHỚP) — công thức sharpen ĐÚNG ở full-res (MAD 0.28); lệch còn lại do resampling viewport, không do công thức — KHÔNG sửa công thức |
| Noise preview↔render | **LỆCH-THỐNG-KÊ** trong pipeline thật (yuv420p) — đo được, giải thích được (xem §3); KHÔNG sửa trong luồng này (cần noise không gian YUV — nợ cho luồng sau) |
| Hồi quy | roundtrip 130/130, migrateMotion 8/8, migrateRender pass, test-new-tools 5, modifyRound51H5 8/8, tsc MCP 0, vite build pass, effectCanvas unit 14/14, previewEngine 14/14, effectCanvas parity Node 15/15 |
| i18n | Không thêm key mới — không có fragment |

## 1. (a) MCP `apply_transition` — nguyên nhân gốc + sửa

**Nguyên nhân gốc (không phải validate thiếu):** `mcp-server/src/validate.ts`
(`validateTransition`, `validateApplyTransitionInput`) đã validate theo
`TRANSITION_TYPES` đầy đủ từ trước. Điểm chặn là **zod schema của tool
trong `mcp-server/src/index.ts`**: `transitionSchema` và schema inline
của `apply_transition` đều khai cứng 13 type (`none`…`radial`). MCP SDK
validate input theo zod schema TRƯỚC khi handler chạy, nên 68 type hợp
lệ còn lại bị từ chối ngay ở cổng, không bao giờ tới `validate.ts`.

**Sửa (2 chỗ, 1 nguồn thật duy nhất):** `mcp-server/src/index.ts` import
`TRANSITION_TYPES` từ `packages/video-spec/src/index.js` và dùng
`z.enum(TRANSITION_TYPES)` cho cả `transitionSchema` (→ `add_clip`
`transitionIn/transitionOut` cũng được sửa theo) lẫn `apply_transition`.
`validate.ts` không đổi. Mô tả schema đổi "13 loại" → "81 loại".

**Đính chính đếm (đo độc lập, 2 nguồn):** `TRANSITION_TYPES` có **82 entry
= 81 type thật + `"none"`** (58 xfade native không tính `"none"` + 23
custom-expr: 9 P5 + 14 V3). "81 type" trong đề bài = 81 type thật.
`server/render/src/transitions.js` cũng có đúng 82 entry, khớp 100% với
spec (0 lệch cả 2 chiều). Các doc cũ ghi "81" đều đang đếm type thật
(không tính `"none"`) nên không sai — chỉ cần nhớ MCP phải chấp nhận cả
`"none"` (duration 0) lẫn 81 type thật.

**Test MCP thật (`mcp-server/test-apply-transition-81.mjs`, SDK client
gọi tool qua stdio JSON-RPC vào server đã build): 19/19 pass.**
- Schema `apply_transition.type` liệt kê đúng 82 enum; schema
  `add_clip clip.transitionIn.type` cũng 82 enum.
- `apply_transition` **82/82 entry pass** (81 type thật + `"none"`,
  duration 0.5 — riêng `"none"` duration 0), gồm cả direction `out`
  (spiral 0.75s); `get_project` xác nhận state lưu thật
  (transitionIn + transitionOut đều là spiral sau lần apply cuối).
- `add_clip` với `transitionIn: { type: "checker-alt", duration: 0.5 }` pass.
- **Từ chối 8/8 type lạ với lỗi rõ ràng, không crash:**
  `"glitch-3d"`, `"FADE"` (phân biệt hoa/thường), `""`, `"fade "`,
  `"circle_open"`, `123`, `null` qua `apply_transition`, và `"nope"` qua
  `add_clip`. Lỗi trả về có mã: `MCP error -32602: Input validation
  error: Invalid arguments for tool apply_transition: Invalid enum value.
  Expected 'none' | 'fade' | ...` (liệt kê đủ 82 giá trị — rõ ràng
  nhưng dài; chấp nhận được vì client đọc được tập hợp lệ ngay trong lỗi).
- Server còn sống sau loạt lỗi: gọi `apply_transition` hợp lệ (fade)
  ngay sau đó vẫn pass. Project test được dọn sau khi chạy.

**Hồi quy MCP (chạy thật 08/11, sau build lại):**
- `roundtrip.test.ts` (qua dist): **130/130**. Lưu ý: trước sửa, suite
  này fail 1 test sẵn — expectation cũ đòi `effects: [{ type: "glitch" }]`
  bị từ chối, nhưng `"glitch"` đã thành effect hợp lệ từ Phase 8 Q4
  (`EFFECT_TYPES`) nên test stale, KHÔNG liên quan transition. Đã sửa
  probe sang type thật sự lạ (`"warp-speed"`), chỉ đổi test, không đổi
  code sản phẩm. Test 2 nay duyệt đủ 82 entry từ `TRANSITION_TYPES`
  (trước đây khóa cứng 13).
- `migrateMotion.test.js`: 8/8. `migrateRender.test.js`: pass (MP4 60
  frame / 2s). `test-new-tools.cjs`: 5 assertions pass.
  `modifyRound51H5.test.js`: 8/8. `npx tsc -p tsconfig.json`: 0 lỗi.

## 2. (b) Parity preview sharpen/noise — harness headed mới

**Harness mới (2 script, stage cùng batch):**
- `apps/web/scripts/parity-62r8-sharpen-noise-headed.mjs` — Chromium
  headed qua Xvfb + CDP, vite dev (mẫu R61 R3: cổng 5560–5569, debug
  9660–9669, display :170–:179). Video test tự sinh bằng ffmpeg
  (`testsrc2` 1280×720 30fps 4s, GOP 15) tại
  `hidden_files/round62-r8/media/test-pattern.mp4` — tái tạo bằng 1 lệnh
  (xem §4). Seed project qua localStorage autosave + import media bằng
  `DOM.setFileInputFiles` (mẫu R29 L1); effects đặt qua
  `store.patchClip` (đúng action panel dùng — mẫu R61 R3; EffectsPanel
  đã click-test riêng ở các đợt trước). Playhead 1.0 (frame 30).
  Env `R8_WIN_W/R8_WIN_H` đổi kích thước cửa sổ (mặc định 1440×900).
- `apps/web/scripts/parity-62r8-compare.mjs` — render cùng spec bằng
  render worker thật (libx264 CRF 18), lấy đúng frame 30 bằng
  `select='eq(n,30)'`, downscale/upscale về đúng kích thước vùng video
  trong canvas preview rồi so trên cùng lưới mẫu step-4.
- Tiêu chí (V6/V14): KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8;
  XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch ≤ 32. Noise: tỉ lệ std
  [0.8, 1.25], |corr| ≤ 0.1, kurtosis [−0.6, 0.6] (tiêu chí parity test
  Node đợt 16 H5). MAD từng pixel của noise KHÔNG phải tiêu chí (2 dãy
  ngẫu nhiên độc lập — kỳ vọng lớn).

**Headed preview: 7/7 pass ở cả 2 cỡ cửa sổ** (1440×900 và 2560×1600;
lượt 2560 chạy 2 lần, số đo lặp lại y hệt): snapshot plain 2 lần lúc
pause pixel-identical (mean 0); sharpen 0.5/1.0 đổi pixel thật và đơn
điệu theo intensity; noise 0.5/1.0 đổi pixel thật và đơn điệu; noise
xác định 2 lần identical (seed theo localT); 0 lỗi trang (H9). Preview
dùng file gốc, **không proxy** (video 720p — proxy skip ≤ 720p, đúng
thiết kế). Ngưỡng C2 sửa 0.5 → 0.1 sau lượt 2560 đầu (delta sharpen ở
cửa sổ lớn chỉ 0.44 nhưng đổi 6.44% channel — hiệu ứng thật, ngưỡng cũ
đặt sai cho trường hợp upscale).

**Bẫy đo đã bắt được (chẩn đoán /tmp/r62-r8-diag.mjs):** nguồn testsrc2
không tag `color_space` nên ffmpeg `scale` mặc định dùng bt601, trong
khi trình duyệt decode video HD bằng bt709 — chỉ riêng sai ma trận này
đã gây MAD 9.22 ở đối chứng plain. Ép bt709 cả 2 đầu → MAD 1.30.
Frame 30 là frame khớp nhất (MAD 9.22 vs 12–13 ở frame 29/31 với ma
trận sai; sau khi sửa ma trận, frame 30 MAD 1.30) — căn chỉnh frame
đúng, không lệch 1 frame. Compare script đã ép bt709.

## 3. Số đo parity (2 cỡ cửa sổ)

Canvas preview 871×275, vùng video 489×275 @ scale 0.382 (1440×900);
canvas 1991×975, vùng video 1733×975 @ scale 1.354 (2560×1600).
Đối chứng plain = sàn sai số chuỗi đo (decode + CRF 18 + resample).

| Case | 1440×900 (downscale 2.6×) | 2560×1600 (upscale) |
|---|---|---|
| plain preview↔render | MAD **1.304**, ≤8 95.3%, ≤32 98.9% → XẤP XỈ | MAD **1.176**, ≤8 96.0%, ≤32 99.1% → XẤP XỈ |
| sharpen 0.5 tuyệt đối | MAD 1.995 → XẤP XỈ | MAD 1.253 → XẤP XỈ |
| sharpen 1.0 tuyệt đối | MAD 2.193 → XẤP XỈ | MAD 1.380 → XẤP XỈ |
| sharpen 0.5 DELTA (preview−plain vs render−plain) | MAD 0.990, ≤8 94.9% → XẤP XỈ; std preview [5.12, 6.13, 4.68] vs render [1.49, 1.59, 1.72] (**gấp ~3.4×**) | MAD 0.503, ≤8 96.2% → XẤP XỈ; std preview [2.38, 2.75, 3.82] vs render [3.27, 3.49, 4.07] (tỉ lệ 0.73–0.94) |
| sharpen 1.0 DELTA | MAD 1.201, ≤8 93.9% → XẤP XỈ; std preview [6.38, 7.82, 6.37] vs render [2.22, 2.56, 2.47] | MAD 0.732, ≤8 95.2% → XẤP XỈ; std preview [4.19, 4.42, 6.88] vs render [5.22, 5.48, 5.81] (tỉ lệ 0.80–1.18) |
| noise 0.5 MAD từng pixel | 8.692 (kỳ vọng lớn) | 10.248 (kỳ vọng lớn) |
| noise 1.0 MAD từng pixel | 14.906 | 18.528 |
| noise 0.5 thống kê delta | std tỉ lệ [1.54, 1.76, 1.01]; kurt preview [3.77, 1.83, 3.01] render [9.49, −0.09, 5.25]; corr render RG −0.206 → **LỆCH-THỐNG-KÊ** | std tỉ lệ [0.88, 0.81, 0.63]; kurt preview [1.38, 0.28, 1.46] render [8.70, 0.13, 5.15]; corr render RG 0.111, GB 0.203 → **LỆCH-THỐNG-KÊ** |
| noise 1.0 thống kê delta | std tỉ lệ [1.14, 1.60, 0.84]; kurt render [5.08, −0.02, 3.25] → **LỆCH-THỐNG-KÊ** | std tỉ lệ [0.73, 0.79, 0.58]; kurt render [5.09, 0.43, 3.78] → **LỆCH-THỐNG-KÊ** |

### 3.1. Sharpen — công thức ĐÚNG, lệch do resampling viewport

Bằng chứng công thức đúng (chẩn đoán /tmp/r62-r8-diag3.mjs,
/tmp/r62-r8-diag4.mjs, không stage):
- Đáp ứng xung (nền 128, tâm 200, amount 1.0): FFmpeg unsharp và canvas
  `applySharpen` cho output gần như giống hệt (121 vs 121, 127 vs 126).
- Bậc thang (64|192): MAD ff-vs-cv **0.095** (amount 1.1) và **0.000**
  (amount 2.0).
- Nội dung thật ở full-res (frame 30 testsrc2, không downscale):
  canvas-sharpen vs ffmpeg-unsharp MAD **0.278**.
- Tái tạo pipeline preview trong Node (sharpen canvas 1280 → downscale
  bilinear 489): delta std [1.34, 1.22, 1.40] — khớp phía render
  ([1.49, 1.59, 1.72] qua render worker), KHÔNG khớp preview headed
  ([5.12, 6.13, 4.68]).

Cơ chế lệch (đã xác nhận bằng 2 cửa sổ): preview vẽ effect ở 1280×720
rồi `drawImage` xuống viewport. Ở downscale 2.6×, Chrome giữ lại phần
lớn delta tần số cao của sharpen (gần kiểu point-sampling: ffmpeg
`neighbor` cho MAD delta 0.758, gần headed 0.99; trong khi bilinear/
lanczos/bicubic/area đều cho 0.23–0.28). Ở upscale, delta 2 bên về cùng
bậc (tỉ lệ std 0.73–1.18) và delta MAD cải thiện 0.99 → 0.50.
**Kết luận: KHÔNG sửa công thức sharpen** (sửa là sai — công thức đã
khớp render ở full-res). Lệch còn lại là đặc tính resampling của
viewport nhỏ, không phải lỗi effect. Hướng sửa đúng (nếu muốn, luồng
sau): `imageSmoothingQuality = "high"` trên ctx preview hoặc downscale
mipmap trước khi vẽ — cần đo lại toàn bộ parity vì đụng mọi frame,
không làm vội trong luồng này.

**Đính chính test parity Node:** `effectCanvas.parity.test.ts` báo
sharpen "KHỚP" (MAD 0.456) nhưng nguồn `patternFrame` của nó hầu như
là gradient tuyến tính — sharpen gần như không tác dụng trên đó nên
test này yếu, không chứng minh được gì nhiều. Bằng chứng mạnh là
step-edge (0.095/0.000) và full-res nội dung thật (0.278) đo trong
luồng này. Test Node vẫn xanh 15/15 (chạy lại 08/11).

### 3.2. Noise — LỆCH-THỐNG-KÊ trong pipeline thật, có nguyên nhân rõ

- MAD từng pixel lớn (8.7–18.5) là **kỳ vọng**, không phải lỗi: nhiễu
  preview (seed theo localT) và nhiễu render (`allf=t`) là 2 dãy ngẫu
  nhiên độc lập.
- Thống kê delta lệch cả 2 cỡ cửa sổ: tỉ lệ std kênh B 0.58–0.78 (cần
  0.8–1.25); kurtosis render kênh R/B 5–9.5 (cần −0.6–0.6) trong khi
  preview 1.4–3.8; tương quan chéo render RG/GB tới ±0.2 (cần ≤ 0.1).
- Nguyên nhân đã đo (chẩn đoán /tmp/r62-r8-diag2.mjs):
  1. **Không gian màu khác nhau:** test parity Node đo noise trong
     RGB24 (filter áp trực tiếp lên RGB) nên "KHỚP thống kê" — nhưng
     pipeline thật áp noise trong **yuv420p** (theo từng plane Y/U/V)
     rồi mới convert sang RGB. Nhiễu 2 bên khác bản chất nên tỉ lệ std
     từng kênh RGB không thể khớp bằng tiêu chí Node. Đính chính: kết
     luận "KHỚP" của Node test cho noise KHÔNG chuyển được sang
     pipeline thật.
  2. **Clamp ở vùng bão hòa:** testsrc2 có nhiều vùng đen/trắng tuyệt
     đối; noise cộng vào bị kẹp 0/255 làm kurtosis phình. Chỉ tính trên
     vùng mid-tone (plain ∈ [40, 215], n=178) thì kurt render về
     ≈ 0 ([−0.22, −0.23, −0.13]) — tức phần lõi nhiễu vẫn Gauss.
  3. **Codec:** std render qua render worker khác std raw-space không
     encode (vd noise 0.5: [6.1, 6.09, 9.06] vs [6.6, 6.44, 9.61]) —
     x264 phản ứng với nhiễu khi nén.
  4. **Resampling:** dấu tương quan chéo render đổi theo cỡ cửa sổ
     (RG −0.206 downscale → +0.111 upscale) — corr bị chi phối bởi
     resample/codec, không phải bởi bản thân nhiễu.
- **Không sửa trong luồng này:** khớp thật cần implement noise trong
  không gian YUV ở đường canvas (convert YUV → cộng nhiễu từng plane
  → convert về RGB) + khớp mô hình nhiễu từng plane của FFmpeg — việc
  lớn, cần nghiên cứu riêng. Ghi nợ cho luồng sau (xem §5).

## 4. Tái tạo

```bash
# Video test (từ gốc repo):
ffmpeg -v error -y -f lavfi -i testsrc2=size=1280x720:rate=30:duration=4 \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -g 15 \
  -video_track_timescale 30 test-pattern.mp4
# MCP (từ mcp-server, sau npx tsc -p tsconfig.json):
node test-apply-transition-81.mjs            # 19/19
node dist/mcp-server/src/roundtrip.test.js   # 130/130
# Parity headed (từ gốc repo):
node apps/web/scripts/parity-62r8-sharpen-noise-headed.mjs        # 7/7
R8_WIN_W=2560 R8_WIN_H=1600 node apps/web/scripts/parity-62r8-sharpen-noise-headed.mjs  # 7/7
node apps/web/scripts/parity-62r8-compare.mjs  # JSON: hidden_files/round62-r8/headed/r8-compare-report.json
# Unit/parity Node:
node --experimental-strip-types apps/web/src/lib/effectCanvas.parity.test.ts  # 15/15
node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts         # 14/14
node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts        # 14/14
```

## 5. Nợ mở (không phải do luồng này gây ra)

1. **Sound uisfx: 936 file vẫn chưa có trên đĩa** — chỉ là khai báo
   trong `assets/sounds/index.json`, lấy qua
   `assets/sounds/fetch_sounds.sh` khi cần. **Nợ ngoài phạm vi luồng
   này** (luồng này không đụng kho sound).
2. **Noise preview↔render LỆCH-THỐNG-KÊ** (§3.2) — cần luồng riêng
   implement noise không gian YUV ở đường canvas + khớp mô hình từng
   plane của FFmpeg; đồng thời cập nhật tiêu chí test parity Node cho
   noise theo pipeline yuv420p thật (tiêu chí hiện tại đo trong RGB24
   nên cho kết quả "KHỚP" giả).
3. **Sharpen ở viewport downscale mạnh vẫn XẤP XỈ, chưa KHỚP**
   (delta MAD 0.99 @2.6×, 0.50 khi upscale; le8 94–96% < 99%) — hướng
   thử: `imageSmoothingQuality="high"` hoặc downscale mipmap ở ctx
   preview; cần đo lại toàn bộ parity vì đụng mọi frame.
4. **`FEATURE_STATUS.md` hàng Transitions** vẫn ghi "⚠️ apply_transition
   (chưa kiểm tra lại tập type mới 81)" — nay đã kiểm tra xong 82/82
   qua MCP thật (luồng này); cần luồng docs cập nhật ma trận (luồng này
   không sửa `FEATURE_STATUS.md` để tránh xung đột với các luồng song
   song đợt 62).
5. **tsc web hiện fail 1 lỗi ở file của luồng song song khác:**
   `apps/web/src/lib/bridgeErrors62R5.test.ts(15,10): 'existsSync' is
   declared but its value is never read` (file sửa 00:12 08/11 bởi luồng
   R5 đợt 62; luồng R8 không đụng file này, chỉ thêm 2 script `.mjs`
   mà tsc không biên dịch). `vite build` vẫn pass.
6. Nợ cũ từ ROUND61 §7 vẫn nguyên (M3 đỏ 7/13, `ci-security.yml` 403,
   v.v. — xem LIMITS đợt 61 R10).

## 6. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round62-r8-mcp-transition.txt`
(NUL-delimited, verify read-back, 6 entry, text only):
`mcp-server/src/index.ts`, `mcp-server/src/roundtrip.test.ts`,
`mcp-server/test-apply-transition-81.mjs`,
`apps/web/scripts/parity-62r8-sharpen-noise-headed.mjs`,
`apps/web/scripts/parity-62r8-compare.mjs`,
`docs/PHASE9_ROUND62_R8_MCP_TRANSITION_LIMITS.md`.

Không stage: `mcp-server/dist/` (build output, build lại bằng tsc),
video/frame/render trong `hidden_files/round62-r8/` (binary + kết quả
đo — đã có JSON tóm tắt trong LIMITS này), chẩn đoán `/tmp/r62-r8-*.mjs`.
