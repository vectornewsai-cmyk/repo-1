# Phase 9 đợt 18 — Luồng nested speedKeyframes spec + render — LIMITS

Ngày: 2026-10-28. Luồng render của đợt 18.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop (parent gộp batch — xem §5).

Đóng nợ đợt 17 N3 / `PHASE9_ROUND17_LIMITS.md` §"Chưa đóng":
"Nested mang speedKeyframes vẫn chưa có ngữ nghĩa duration (render
worker cấm field này ở nested); patch speed hằng trên nested đã mang
curve giữ nguyên duration."

## 1. Việc đã làm

### 1a. Spec `docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md`

- Ngữ nghĩa chốt: duration của nested có curve là thời gian OUTPUT
  (giống clip ramp thường); cửa sổ con là `[in, in + ∫₀ᴰ s)`;
  `out` (nếu ghi) phải khớp tích phân đó (sai số 1e-4, xem §3).
- Hai chế độ sửa ở tầng store/UI (render chỉ kiểm tra bất biến,
  không đoán): duration-cố-định (giữ `D`, đặt lại `out`) và
  trim-cố-định (giữ `[in, out)`, `D` bằng đảo tích phân theo
  `outputDurationForSource` của đợt 14 R5). Hành vi N3 "patch curve
  không đổi duration" nay là chế độ duration-cố-định hợp lệ, không
  còn là giới hạn treo.
- Patch speed hằng trên nested đã mang curve: render dùng curve, bỏ
  qua speed hằng + warning (khớp validator clip thường); speed hằng
  ngoài `[0.25, 4]` vẫn fail dù bị lấn át.
- Ánh xạ lá qua `τ` (nghịch đảo tích phân): lá media tốc độ hằng
  `c` thành clip ramp tổng hợp — curve = slice của curve lồng nhau
  trên đoạn output của lá (port `sliceSpeedKeyframes` bản H3: linear
  / bezier / ease đúng hệt), nhân `v` với `c`; `in'` theo thời gian
  con, `out'` capped ở `out` gốc. Curve hằng gộp chính xác về tốc
  độ hằng (đẳng thức, kể cả bezier overshoot vì `(b.v − a.v) = 0`).
- Transition trong, adjustment layer, fade audio, fade biên/opacity
  đều đổi sang đo bằng `τ` (công thức trong spec §4).
- Bảng fail fast (§5 của spec): reverse, lá reverse / lá có curve
  riêng / lá có attachment thời gian dưới ramp, curve không hợp lệ,
  `out` không khớp tích phân, tích tốc độ lá × curve vượt khoảng,
  hai tầng đều có curve.

### 1b. Triển khai phía render (`server/render/src/nested.js`)

- Bỏ lệnh cấm `speedKeyframes` ở `nestedWindow`; thêm
  `validateNestedRamp` (mirror đúng luật validator clip ramp thường),
  `mapChildOffset` / `mapChildInterval` (τ bằng chia đôi 80 vòng),
  `sliceNestedRampKeyframes` + `scaleRampKeyframes`.
- `mapClip` viết lại quanh `τ`: đường tốc độ hằng cũ giữ nguyên từng
  dòng (chỉ thay công thức tuyến tính bằng `mapChildInterval`, rút
  gọn đúng về cũ); đường ramp thêm nhánh tổng hợp clip ramp cho lá
  media + fail fast cho lá reverse/curve riêng/attachment.
- Khối transition trong và thu thập adjustment layer trong
  `flattenInner` đổi sang `τ` (cặp nguyên vẹn vẫn kề nhau vì `τ`
  liên tục; transition con `T` thành `τ(X) − τ(X − T)`).
- `nestedWindow` nhận thêm tham số `warnings` (tùy chọn, tương thích
  ngược với `_nestedWindow` 2 tham số); warning "speed bị curve lấn
  át" chỉ ghi khi caller truyền mảng (đường `flattenSpecForRender`
  có truyền).
- Không đụng render.js, validate.js, speedramp.js, store.ts,
  NestedClipPanel.tsx, hay bất kỳ test nào của luồng khác.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `test_round18_nested_speed_render.js` (riêng luồng này) | **68/68 check pass, 0 fail** |
| — trong đó: flatten U1–U9 (lá đơn, 2 lá slice, cắt trái, lá speed 2, curve hằng, 11 fail fast, slice parity 20 curve×khoảng, transition trong, fade audio) | pass |
| — trong đó: render MP4 thật R1/R2/R3 (FFmpeg 8.1.2, 64×64, 30fps, nguồn màu phẳng đỏ 0–4s / xanh lá 4–8s) | pass |
| R1 lá đơn ramp 1→2, D=4: duration ≈ 4s; t=0.5 đỏ (nguồn ≈ 0.53), t=2.0 đỏ (≈ 2.50), t=3.0 xanh lá (≈ 4.13), t=3.9 xanh lá (≈ 5.80) | đúng `u(t) = t + t²/8` suy tay |
| R2 hai lá, biên tại outer τ(3) = 2.3246: t=1.0 đỏ (lá A ≈ 1.13), t=2.5 đỏ (lá B ≈ 3.28), t=3.5 xanh lá (lá B ≈ 5.03) | đúng slice suy tay |
| R3 spec out=5 (đúng 6) | render fail exit ≠ 0, stderr nhắc nested/out |
| Slice parity U7: 5 curve (linear, ease-in, ease-out, bezier overshoot, đa đoạn) × 4 khoảng, 21 điểm mẫu mỗi khoảng | sai số tối đa < 1e-3 mọi trường hợp |
| Hồi quy `test_nested_render.js` | 24/24 |
| Hồi quy `test_nested_r3.js` | 43/43 |
| Hồi quy `test_round17_n3_nested_deep_speed_render.js` | 11/11 |
| Hồi quy `test_round16_h2_nested_deep_render.js` | 13/13 |
| Hồi quy `test_round15_t4_split_ramp.js` | 22 pass |
| Hồi quy `test_p3.js` (parity speedramp) | 73 pass, 0 skip |
| `node --check nested.js` | pass |

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **XUNG ĐỘT CÓ CHỦ Ý với 1 case trong test cũ — cần parent quyết,
  luồng này KHÔNG tự sửa test của luồng khác:** `test_nested_e2e.js`
  chạy lại cho **27 pass, 1 fail**: case "[C] nested clip mang
  speedKeyframes → flatten throw fail fast" dùng fixture curve sai
  shape (`{ t: 0, speed: 1 }`, không có `v`/`easing`) và assert message
  khớp `/chưa được hỗ trợ|chưa hỗ trợ/`. Theo spec đợt 18 thì
  speedKeyframes trên nested nay ĐƯỢC hỗ trợ nên case này không còn
  đúng nữa; fixture đó vẫn throw (validator mới báo "v phải trong
  0.25..4") nhưng message không khớp regex cũ. Parent cần cập nhật
  case đó (bỏ speedKeyframes khỏi danh sách fail-fast, hoặc đổi
  thành field vẫn cấm thật như `mask`). Luồng này cố tình không sửa
  file đó theo luật "không sửa test của luồng khác".
- **Preview web chưa có parity:** `previewEngine` vẫn ánh xạ nested
  theo đường cũ; preview của nested ramp sẽ lệch với render. Không
  claim parity — thuộc luồng preview/UI sau.
- **Store/UI chưa theo spec §2:** patch đổi curve của nested ở tầng
  store vẫn giữ hành vi N3 (không tính lại duration/out) — hành vi
  đó nay khớp chế độ duration-cố-định, nhưng store chưa cài đặt chế
  độ trim-cố-định (`D` theo đảo tích phân) và chưa báo khi patch
  làm `out` lệch tích phân (render sẽ fail thay vì tự sửa). Comment
  trong `nestUtils.ts` (~dòng 995) vẫn ghi "render worker CẤM
  speedKeyframes ở nested" — đã lỗi thời sau đợt này; luồng này cố
  tình không sửa `nestUtils.ts`/`store.ts` để tránh xung đột với
  luồng store/UI, parent/luồng đó nên cập nhật comment + hành vi.
- **Hai tầng đều có curve vẫn bị từ chối:** lá tầng trong sau flatten
  đã mang curve tổng hợp nên tầng ngoài ramp fail theo bảng §5 (đã
  khóa bằng test U6). Muốn hỗ trợ cần hợp curve hai tầng — nợ mở.
- **Lá có attachment thời gian / lá reverse dưới ramp vẫn bị từ
  chối:** cần nội suy lại keyframe qua `τ` (attachment) và curve đảo
  thời gian (reverse) — nợ mở, đã khóa bằng test U6.
- **Transition trong dưới ramp chỉ kiểm chứng ở tầng flatten (U8),
  chưa render MP4:** thời lượng `T'` suy tay 0.6677 đã khớp ở spec
  phẳng, nhưng xfade thật giữa hai lá ramp chưa đo màu/duration.
- **Phạm vi đo MP4:** 64×64, 30fps, nguồn màu phẳng tổng hợp, curve
  linear 1→2 duy nhất, tốc độ lá 1 (U4 chỉ ở tầng flatten). Chưa đo
  MP4 cho curve bezier/ease, tốc độ lá ≠ 1, tốc độ biên 0.25/4,
  1080p, footage thật, hay tổ hợp ramp + opacity/boundary fade
  (đường code đó không đổi nhưng chưa có case MP4 riêng).
- **Sai số out cho ramp là 1e-4** (không phải 1e-6 như tốc độ hằng)
  vì tích phân bezier tính bằng Simpson số; 1e-4s vẫn ≪ 1 frame.
- **Render ramp theo đoạn 0.2s là hành vi có sẵn của speedramp.js:**
  frame MP4 kiểm chứng ở điểm cách biên đủ xa; độ chính xác từng
  frame sát biên ramp vẫn chịu sai số đoạn như clip ramp thường.
- Thư mục tạm của lần chạy fail giữa chừng đã dọn tay; lần chạy
  pass cuối tự dọn tmp của nó (đã kiểm tra: không còn
  `/tmp/vcut-n18speed-*` của lần pass).

## 4. Ghi chú triển khai (để đợt sau không đọc sai code)

- `win.speed` của clip lồng nhau có curve vẫn mang `clip.speed`
  (hoặc 1) nhưng KHÔNG được dùng cho ánh xạ — mọi đường dùng `win`
  đều rẽ nhánh `win.isRamp` trước khi chạm `win.speed` (mapClip,
  pair block, layer block đều đã rà soát; còn lại chỉ là comment
  mô tả trường hợp tốc độ hằng). Curve hằng gộp về tốc độ hằng thì
  `isRamp` không được đặt, `win.speed = v`.
- Slice trong `nested.js` là port của `sliceSpeedKeyframes` bên
  `speedcurve.js` (bản H3, có bezier nâng bậc cho ease). Nếu đổi
  thuật toán một bên thì chạy lại U7 (đánh giá slice theo điểm mẫu)
  để đối chiếu — U7 không import ESM bên kia mà kiểm chứng trực
  tiếp tính chất "slice đánh giá bằng curve gốc".

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `server/render/src/nested.js`: bỏ cấm curve ở nested; helper ramp
  + slice port; `mapClip` qua `τ` + tổng hợp ramp cho lá media;
  transition trong + adjustment layer qua `τ`; export thêm
  `_mapChildOffset`, `_mapChildInterval`,
  `_sliceNestedRampKeyframes` (test-only, như `_mapClip` sẵn có).
- `server/render/src/test_round18_nested_speed_render.js`: test mới
  của riêng luồng này (68 check: flatten + slice + MP4 thật).
- `docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md`: spec ngữ nghĩa.
- `docs/PHASE9_ROUND18_NESTED_SPEED_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình):
- `server/render/src/render.js`, `validate.js`, `speedramp.js` và
  mọi test/harness của luồng khác (kể cả `test_nested_e2e.js` dù nó
  có 1 case xung đột — xem §3).
- `apps/web/src/store.ts`,
  `apps/web/src/components/nested/NestedClipPanel.tsx`,
  `apps/web/src/components/nested/nestUtils.ts` (comment lỗi thời
  trong nestUtils để luồng store/UI cập nhật).
- File stage trong `~/workspace/repo-1-push/paths-loop/` và
  `build-loop-log.md` (parent gộp/log).
- Không push, không tag/release, không ghi qua GitHub.
