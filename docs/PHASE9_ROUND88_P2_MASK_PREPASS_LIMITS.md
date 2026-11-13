# PHASE9_ROUND88_P2_MASK_PREPASS_LIMITS.md

Đợt 88 P2 — dọn pre-pass R2 vẽ PNG tĩnh thừa cho clip tracked (nợ O2 §5.5,
LIMITS gộp đợt 87 §4 mục 7).
KHÔNG push. Không release/tag. Không đụng TTS 39, không đụng workflow.

## 1. Chỗ vẽ thừa — xác định chính xác

Pre-pass R2 (`server/render/src/render.js`, vòng lặp ~dòng 1685) vẽ 1 PNG tĩnh
(`mask_png.py`, dedup theo `maskKey`) cho **mọi** clip có mask khi
`--mask-mode png`. Nhưng `maskChainForSite` (render.js:517-550) chỉ đọc
`ctx.maskPng` ở **duy nhất nhánh mask tĩnh** (không track, không keyframes,
dòng 547-548). Clip tracked ở mode png đi nhánh riêng (dòng 525-536):

- video mask trong `ctx.maskAnim` (vẽ ở pre-pass D4), hoặc
- PNG fallback t=0 trong `ctx.maskAnimFallback` (cũng vẽ ở pre-pass D4, tại
  hình học `maskGeometryAtTrack(mask, track, 0)`), hoặc
- geq tĩnh tại t=0 nếu cả 2 đều thất bại.

Cả 3 đường đều không chạm tới PNG R2. PNG R2 cho clip tracked do đó **không
bao giờ xuất hiện trong filter graph** — kiểm chứng bằng dry-run: trước sửa,
dòng lệnh ffmpeg chỉ chứa `movie='/tmp/repo1-maskan-*.mkv'` (video mask), PNG
R2 chỉ xuất hiện ở dòng log pre-pass (`mask PNG "c1" → /tmp/repo1-mask-*.png`),
không có trong filter. File tạm R2 được dọn sau render thành công nên lãng phí
là **thời gian + 1 lần spawn python3**, không phải file rò rỉ.

## 2. Đã làm gì

- `server/render/src/render.js` (marker `Phase 9 đợt 88 P2`, vòng lặp R2):
  thêm `if (clip.track !== undefined) continue;` **trước** `seen.add(key)` —
  clip tracked bỏ qua PNG tĩnh; clip tĩnh có cùng `maskKey` vẫn được vẽ khi
  tới lượt nó (không bị `seen` chặn oan). Không sửa đường D4, không sửa
  `maskChainForSite`, không sửa `mask.js`, không sửa validator.
- `server/render/test_round88_p2_mask_prepass.js` (mới, 18 assertion): render
  thật 720p/30fps/4s + đọc pixel PNG thật bằng PIL — xem §4.

## 3. Chi phí thừa đã đo (render thật, 1280×720, 30fps, 4s)

| Đo | Trước sửa | Sau sửa |
|---|---|---|
| PNG tĩnh R2 cho 1 clip tracked | **1** (thừa) | **0** |
| PNG tĩnh R2 cho 2 clip tracked, mask khác nhau | **2** (thừa) | **0** |
| Video mask track cho 1 / 2 clip tracked | 1 / 2 | 1 / 2 (không đổi) |
| PNG tĩnh R2 cho clip tĩnh | 1 (dùng thật) | 1 (không đổi) |
| 1 lần `mask_png.py` 720p chạy riêng | 497 ms (lượt nhẹ) / 806 ms (lượt test sau sửa) / 2,62–5,79 s (3 lần đo lúc VM tải nặng vì các luồng đợt 88 chạy song song) | — (không còn chạy) |
| Filter graph (dry-run, trừ đường dẫn tạm/PID) | — | **byte-identical** với trước sửa |

Tiết kiệm mỗi job = **1 lần `mask_png.py` + 1 file tạm cho mỗi mask tracked
phân biệt** (~0,5 s lúc máy nhẹ; vài giây lúc máy tải nặng — chi phí python3
+ Pillow khởi động và vẽ 1280×720). Số lượng tỉ lệ với số mask tracked phân
biệt trong job (dedup theo `maskKey` vẫn áp cho clip tĩnh).

**Trung thực về thời gian render end-to-end:** KHÔNG đưa ra con số giảm
giây cho cả job, vì VM đang tải nặng do các luồng đợt 88 chạy song song —
cùng 1 spec tracked render 5,9 s (lượt nhẹ) / 8,3 s / 31,2 s / 38,5–50,5 s
(lượt tải nặng), còn render tĩnh cùng lúc 2,0 s → 4,9 s → 7,9 s. Độ nhiễu
(±20 s) lớn hơn nhiều so với tín hiệu (~0,5–5 s). Điều khẳng định được:
filter byte-identical + bớt đúng 1 subprocess mỗi mask tracked → render
không thể chậm đi vì thay đổi này; phần việc bị bỏ là công việc thừa thuần
túy, không ảnh hưởng output (MAD 0, xem §4). A/B bật/tắt sửa chữa trên cùng
spec: tắt → `maskPNG=1` quay lại; bật → `maskPNG=0`.

## 4. Kiểm chứng (render thật, 1280×720, 30fps, 4s, track x 0.35→0.65)

Baseline trước sửa lưu tại `/tmp/p2-round88/base/` (frame t05/t20/t35/s20a)
và `/tmp/p2-dryrun.txt` (dry-run trước sửa).

| Kiểm chứng | Kết quả |
|---|---|
| Tracked: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.3875 / 0.5000 / 0.6125** — khớp quỹ đạo (sai số < 0,0001), giống hệt trước sửa |
| Tracked frame trước vs sau sửa (t=0.5/2.0/3.5) | **MAD = 0.0** cả 3 mốc — output không đổi |
| Tĩnh frame trước vs sau sửa (t=2.0) | **MAD = 0.0** — không hồi quy |
| Tĩnh render 2 lần sau sửa | **MAD = 0.0** |
| Dry-run tracked sau sửa | filter KHÔNG chứa `repo1-mask-*.png`; vẫn có `.mkv` + `trim=end_frame=120` |
| `test_round88_p2_mask_prepass.js` (mới) | **18/18 pass** (trước sửa: 15 pass, 3 fail — đúng 3 assert về PNG thừa) |
| `test_d4_mask_keyframes.js` (hồi quy D4) | **13/13 pass** |
| `test_d3_trackfollow.js` (hồi quy D3 shift) | **22/22 pass** |
| `test_round87_o2_mask_track.js` (hồi quy O2) | **25/25 pass** |
| `mask.js --self-test` | **pass hết** |
| `node --check src/render.js` | pass |

## 5. Giới hạn / nợ mở (trung thực)

1. **Mask có keyframes (không track) CŨNG bị vẽ PNG R2 thừa — chưa sửa.**
   Đo bằng dry-run trên spec chỉ có 1 clip mask-keyframes (không track):
   log có cả `mask PNG "c1"` (R2) lẫn `mask anim "c1"` (D4), trong khi nhánh
   keyframes của `maskChainForSite` (dòng 537-546) chỉ dùng
   `maskAnim`/`maskAnimFallback`/geq, không bao giờ đọc `ctx.maskPng`.
   Cùng một dòng `continue` là sửa được (thêm điều kiện
   `hasMaskKeyframes(clip.mask)`), nhưng ngoài phạm vi nhiệm vụ P2 ("bỏ
   bước vẽ thừa cho clip tracked, giữ nguyên cho clip tĩnh" — mask
   keyframes không phải mask tĩnh, và có thể có luồng khác đang đụng mảng
   keyframes). Parent cân nhắc gộp vào đợt sau; tiết kiệm tương tự: 1 lần
   `mask_png.py` mỗi mask keyframes phân biệt.
2. **Mode geq / trackgeq không bị ảnh hưởng:** pre-pass R2 chỉ chạy khi
   `args.maskMode === "png"` nên 2 mode kia vốn đã không vẽ PNG thừa.
   Không có test render riêng cho geq sau sửa (đường này không chạm code
   đổi); O2 test 7 (geq) vẫn xanh trong bộ hồi quy O2 25/25.
3. **Text clip + track + mask:** R2 bỏ qua vì text clip không nằm trong
   vòng lặp video/image — không đổi. O2 test 8 vẫn xanh.
4. **Thời gian render end-to-end không có số giảm khẳng định được** (xem
   §3 — nhiễu tải VM lớn hơn tín hiệu). Tiết kiệm đo được chắc chắn là
   chi phí `mask_png.py` riêng lẻ, không phải delta cả job.
5. **Không đụng:** TTS 39, file workflow, `mask.js`, `mask_anim.py`,
   `mask_png.py`, `validate.js`, `maskChainForSite`. Chỉ 1 dòng điều kiện
   trong vòng lặp R2 + comment + test mới.
