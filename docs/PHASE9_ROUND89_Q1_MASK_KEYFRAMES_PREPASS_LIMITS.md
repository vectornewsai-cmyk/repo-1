# PHASE9_ROUND89_Q1_MASK_KEYFRAMES_PREPASS_LIMITS.md

Đợt 89 Q1 — dọn pre-pass R2 vẽ PNG tĩnh thừa cho mask có keyframes
(nợ LIMITS gộp đợt 88 §4 mục 7, phát hiện thêm của đợt 88 P2).
KHÔNG push. Không release/tag. Không đụng TTS 39, không đụng workflow.

## 1. Chỗ vẽ thừa — xác định chính xác

Pre-pass R2 (`server/render/src/render.js`, vòng lặp ~dòng 1685) vẽ 1 PNG tĩnh
(`mask_png.py`, dedup theo `maskKey`) cho **mọi** clip có mask khi
`--mask-mode png`. Nhưng nhánh keyframes của `maskChainForSite`
(render.js:537-546) chỉ dùng `ctx.maskAnim` (video mask, vẽ ở pre-pass D4) /
`ctx.maskAnimFallback` (PNG t=0, cũng vẽ ở D4) / geq tĩnh tại t=0 — không bao
giờ đọc `ctx.maskPng`. PNG R2 cho clip mask-keyframes do đó **không bao giờ
xuất hiện trong filter graph** — giống hệt trường hợp clip tracked mà P2 đã
dọn. Đo trước sửa (render thật, xem §3): log có cả `mask PNG "c1"` (R2) lẫn
`mask anim "c1"` (D4) cho cùng 1 clip.

## 2. Đã làm gì

- `server/render/src/render.js` (marker `Phase 9 đợt 89 Q1`, vòng lặp R2):
  thêm `if (hasMaskKeyframes(clip.mask)) continue;` ngay sau điều kiện P2
  (`clip.track`), **trước** `seen.add(key)` — mask keyframes bỏ qua PNG tĩnh;
  clip tĩnh có cùng `maskKey` vẫn được vẽ khi tới lượt nó (không bị `seen`
  chặn oan). `hasMaskKeyframes` đã import sẵn ở render.js (dòng 64).
  Không sửa đường D4, không sửa `maskChainForSite`, không sửa `mask.js`,
  không sửa validator.
- `server/render/test_round89_q1_mask_keyframes_prepass.js` (mới): render
  thật 720p/30fps/4s + đọc pixel PNG thật bằng PIL — xem §4.

## 3. Chi phí thừa đã đo (render thật, 1280×720, 30fps, 4s)

| Đo | Trước sửa | Sau sửa |
|---|---|---|
| PNG tĩnh R2 cho 1 clip mask keyframes w/h | **1** (thừa) | **0** |
| PNG tĩnh R2 cho 1 clip mask keyframes geometry | **1** (thừa) | **0** |
| Video mask anim (D4) cho mỗi clip trên | 1 | 1 (không đổi) |
| PNG tĩnh R2 cho clip tĩnh | 1 (dùng thật) | 1 (không đổi) |
| Clip keyframes TRƯỚC clip tĩnh cùng maskKey | — | R2 vẽ đúng 1 PNG, chỉ cho clip tĩnh |
| 1 lần `mask_png.py` 720p chạy riêng | 497 ms (P2, lượt nhẹ) / 3690 ms (lượt này, VM tải nặng) | — (không còn chạy) |
| Filter graph (dry-run, trừ đường dẫn tạm/PID) | — | **byte-identical** với trước sửa (không còn PNG R2 trong filter) |

Tiết kiệm mỗi job = **1 lần `mask_png.py` + 1 file tạm cho mỗi mask
keyframes phân biệt**. Không đưa số giảm giây cho cả job (nhiễu tải VM lớn
hơn tín hiệu: cùng spec keyframes render 35,2s trước sửa / 32,3s sau sửa
cho case w/h, và 34,9s / 37,8s cho case geometry — chiều ngược nhau).
Điều khẳng định được: filter byte-identical + bớt đúng 1 subprocess mỗi
mask keyframes → render không thể chậm đi vì thay đổi này; phần việc bị
bỏ là công việc thừa thuần túy, không ảnh hưởng output (MAD 0, xem §4).

## 4. Kiểm chứng (render thật, 1280×720, 30fps, 4s, nguồn video đỏ)

Baseline trước sửa lưu tại `/tmp/vcut-q1base-4gpjbt/` (frame t05/t2/t35 +
MP4 cho cả 2 case; **/tmp sẽ mất sau reboot VM** — baseline chỉ còn giá trị
trong lượt này).

| Kiểm chứng | Kết quả |
|---|---|
| Keyframes w/h (ellipse w 0.2→0.6, h 0.3→0.7): R2 vẽ PNG | **0** (trước: 1) |
| Keyframes w/h: video mask anim D4 | **1** (không đổi) |
| Keyframes w/h: bề rộng vùng đỏ t=0.5 / t=3.5 | **0.2492 / 0.5492** (≈ 0.25 / 0.55 kỳ vọng nội suy) |
| Keyframes geometry (rect x 0.2→0.8): R2 vẽ PNG | **0** (trước: 1) |
| Keyframes geometry: video mask anim D4 | **1** (không đổi) |
| Keyframes geometry: tâm đỏ t=0.5 / 2.0 / 3.5 | **0.275 / 0.500 / 0.725** — khớp quỹ đạo (±0.01) |
| Mix keyframes + tĩnh cùng maskKey | R2 vẽ **1 PNG** (chỉ cho clip tĩnh), 1 video mask anim |
| Tĩnh: R2 vẽ PNG | **1** (giữ nguyên) |
| Tĩnh render 2 lần sau sửa | **MAD = 0.0** |
| Frame trước vs sau sửa, cả 2 case × 3 mốc (t=0.5/2.0/3.5) | **MAD = 0.0 cả 6 cặp** |
| Dry-run keyframes sau sửa | filter KHÔNG chứa `repo1-mask-*.png`; vẫn có `.mkv` + `trim=end_frame=120` |
| `test_round89_q1_mask_keyframes_prepass.js` (mới) | **27/27 pass** (xem ghi chú t=2.0 dưới) |
| `test_round88_p2_mask_prepass.js` (hồi quy P2) | **18/18 pass** |
| `test_d4_mask_keyframes.js` (hồi quy D4) | **13/13 pass** |
| `node --check src/render.js` + test mới | pass |
| tsc web (`npx tsc --noEmit`) | **0 lỗi** |

**Ghi chú về 27/27 và MAD t=2.0:** lần chạy test đầy đủ cho 27 assert pass,
trong đó 2 cặp MAD t=2.0 bị bỏ qua (test tìm file baseline `wh-t20.png`
nhưng script baseline đặt tên `wh-t2.png` do `String(2.0)` = `"2"`).
Đã đo bù trực tiếp từ frame sau sửa trích lại từ MP4 của lượt test đó:
**MAD t=2.0 = 0.0 cho cả 2 case** — tổng cộng 6/6 cặp MAD = 0.0.
Đã sửa tag baseline trong test (`wh-t20` → `wh-t2`, `geo-t20` → `geo-t2`)
sau lần chạy đó. **Chưa chạy lại toàn bộ test sau sửa tag** (chỉ sửa chuỗi
tag + comment, không đổi logic): lần chạy lại ~12:00Z bị sóng EPERM chặn
ngay bước tạo media (ffmpeg không ghi được header MP4 trong /tmp — xem §5).
Lần chạy lại đầy đủ nên cho 29/29; con số này chưa được xác lập trong lượt
này.

## 5. Giới hạn / nợ mở (trung thực)

1. **Sóng EPERM đang hoạt động lúc cuối lượt (~11:56–12:00Z).** `vite build`
   fail 2 lần (npm EPERM khi ghi log của chính nó; vite EPERM khi ghi file
   config tạm lúc load config — chưa chạy tới bước build). Ghi file thường
   (`touch`) trong cùng thư mục vẫn OK. Probe EPERM v2 lúc ~11:57Z báo
   DEAD/STALE (heartbeat age 1153s > 900s, probe cuối #7 lúc 11:37:37Z)
   và lệnh `once` không append được vào `eperm-probe-v2.log` (EPERM).
   Lần chạy lại test Q1 sau sửa tag cũng chết vì ffmpeg EPERM khi ghi
   header MP4 trong /tmp. **Đây là lỗi môi trường, không phải do code sửa:**
   luồng này chỉ đụng `server/render/src/render.js` + test mới (không đụng
   code web), tsc web 0 lỗi, `node --check` pass. Vite build chưa pass
   trong lượt này — cần chạy lại khi sóng EPERM qua.
2. **Mask keyframes + track cùng lúc:** không render riêng trong Q1.
   Đường này đã được P2 khóa (điều kiện `clip.track` đứng trước, track
   thắng x/y theo O1) và test P2 18/18 vẫn xanh trong lượt này; test O2
   25/25 không chạy lại trong Q1.
3. **Image clip + mask keyframes:** không render riêng trong Q1 (chỉ
   video). Vòng lặp R2/D4 duyệt cả `video` lẫn `image` với cùng điều kiện
   nên sửa áp dụng như nhau; test D4 13/13 (gồm case image keyframes)
   vẫn xanh.
4. **Mode geq / trackgeq không bị ảnh hưởng:** pre-pass R2 chỉ chạy khi
   `args.maskMode === "png"`. Không có test render riêng cho geq sau sửa.
5. **Thời gian render end-to-end không có số giảm khẳng định được**
   (xem §3 — nhiễu tải VM lớn hơn tín hiệu). Tiết kiệm đo được chắc chắn
   là chi phí `mask_png.py` riêng lẻ, không phải delta cả job.
6. **Không đụng:** TTS 39, file workflow, `mask.js`, `mask_anim.py`,
   `mask_png.py`, `validate.js`, `maskChainForSite`. Chỉ 1 dòng điều kiện
   trong vòng lặp R2 + comment + test mới.
