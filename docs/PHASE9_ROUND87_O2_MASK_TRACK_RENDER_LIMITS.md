# PHASE9_ROUND87_O2_MASK_TRACK_RENDER_LIMITS.md

Đợt 87 O2 — đường render chính cho mask bám motion track (video mask).
KHÔNG push. Không release/tag. Không đụng TTS 39, không đụng workflow.

## 1. Đã làm gì

Clip video/image có cả `track` + `mask` (mode mask mặc định `png`) nay render
mask bám quỹ đạo thật bằng **video mask grayscale** (ffv1, tái dùng đường
mask-animation D4), thay vì mask tĩnh như trước:

- `server/render/src/mask.js` (marker `Phase 9 đợt 87 O2`):
  - Dùng helper O1 `maskGeometryAtTrack(mask, track, t)` — định nghĩa duy
    nhất của O1, O2 KHÔNG định nghĩa lại (bản tạm của O2 đã xóa khi O1 hạ
    cánh; xem §6 về việc gộp file song song).
  - `trackPointsToMaskKeyframes(mask, track)`: đổi quỹ đạo thành keyframes
    cho `mask_anim.py`, đặt tại HỢP các mốc thời gian (track points ∪ mask
    keyframes), mỗi keyframe = `maskGeometryAtTrack` tại mốc đó. Vì cả track
    lẫn mask keyframes đều nội suy tuyến tính từng đoạn (hold ngoài đoạn),
    keyframe tại mọi mốc gãy tái hiện CHÍNH XÁC hình học O1 tại mọi frame
    (x/y bám track, w/h theo mask keyframes; không keyframes → w/h gốc).
  - `trackedMaskAnimKey(mask, track, W, H, fps, duration)`: dedup theo
    track + mask (gồm keyframes, vì ảnh hưởng w/h) + khung + fps + duration;
    tiền tố `"track"` để không đụng `maskAnimKey` (chung map `ctx.maskAnim`).
  - `hasTrackedMask(clip)`: clip có cả track + mask.
  - Self-test §10 mới (mask.js `--self-test`): keyframes-track nội suy ra
    đúng hình học O1 tại 7 mốc thời gian; keyframes+track (mốc chen giữa,
    w/h theo keyframes); key dedup/không đụng D4; track rỗng throw.
- `server/render/src/render.js` (marker `Phase 9 đợt 87 O2`):
  - `maskChainForSite(..., track)`: nhánh tracked mới (sau nhánh trackgeq
    của O3, trước nhánh keyframes D4): video trong `ctx.maskAnim` →
    `buildMaskAnimChain`; không có → PNG fallback t=0 trong
    `ctx.maskAnimFallback` → `buildMaskPngChain`; cả 2 không có → geq tĩnh
    tại `maskGeometryAtTrack(mask, track, 0)` + `console.error` warn rõ
    (KHÔNG bám track). Không fail job. Nhánh này chỉ áp khi
    `maskMode === "png"` (xem §2 về mode geq).
  - Pre-pass D4 mở rộng: cùng vòng lặp vẽ video tracked mask cho clip
    track+mask (cùng map `maskAnim`/`maskAnimFallback`, cùng cơ chế timeout
    Đợt 74 B4 và dọn file tạm); log phân biệt `mask track` vs `mask anim`;
    fallback PNG tại hình học track t=0.
  - Bước đặt timeline: mở rộng điều kiện bỏ shift D3 của O3 sang đường
    video (png): clip track+mask → track lái mask, clip ĐỨNG YÊN (xem §2).
- `server/render/test_round87_o2_mask_track.js` (mới): test render thật
  25 assertion — xem §4.
- KHÔNG sửa `validate.js`: combo keyframes+track ĐƯỢC hỗ trợ theo helper O1
  (x/y theo track, w/h theo keyframes) nên không cần warn mới; text+mask đã
  có warn sẵn (`MASK_UNSUPPORTED_KIND`, validate.js:717); image+track đã có
  warn sẵn về vị trí (xem §5).

## 2. Thiết kế đã chốt (O1/O3) và quyết định của O2

- **Ngữ nghĩa (parent + O1):** tâm mask (x, y) = vị trí track tại t (tọa độ
  0..1, thời gian clip-local); w/h theo mask keyframes nếu có; shape /
  feather / invert giữ nguyên; không thêm field spec mới.
- **Double-shift (O3 đã đo, O2 xác nhận bằng baseline):** mask áp ở
  unit-level, sau đó unit lại dịch theo overlay track (D3) — nếu giữ cả hai,
  tâm mask cuối trên canvas = `track + (track − 0.5) = 2·track − 0.5`.
  O3 đã bỏ shift D3 cho mode `trackgeq` (clip đứng yên, track chỉ lái
  mask). O2 áp CÙNG luật cho đường video mặc định (png): clip track+mask
  đứng yên, mask video mang tâm = track trong unit → tâm cuối trên canvas
  = đúng điểm track. Đây là mở rộng của quyết định đã hạ cánh của O3, không
  phải thiết kế mới của O2.
- **Hệ quả đã đo (baseline TRƯỚC thay đổi, 1280×720, track 0.35→0.65):**
  mask tĩnh tâm 0.5 + track (hành vi cũ) đã đưa mask lên đúng điểm track
  (tâm đo được 0.3875 / 0.5 / 0.6125 tại t=0.5/2.0/3.5) nhờ mask cưỡi theo
  shift D3 — nhưng TOÀN BỘ khung hình cũng dịch theo. Sau thay đổi: mask
  vẫn lên đúng điểm track (sai số < 0.0001, xem §4), nhưng clip đứng yên,
  chỉ mask di chuyển. Với nguồn màu trơn, hai frame gần như giống hệt nhau
  (MAD 0.023–0.032, xem §4); với footage thật, khác biệt là nội dung clip
  không còn bị dịch chuyển — đúng ngữ nghĩa "track lái mask" của O3.
- **Mode geq: KHÔNG lấy đường tracked.** `--mask-mode geq` giữ hành vi cũ
  (mask tĩnh geq tại mask.x/y + shift D3; với mask tâm 0.5 thì tâm cuối vẫn
  = điểm track — đã đo §4). Lý do: đường tracked trong mode geq sẽ rơi về
  geq tĩnh tại t=0 trong khi clip vẫn shift → tâm cuối = `track(0) +
  frac − 0.5`, TỆ HƠN hành vi cũ. Mode `trackgeq` (O3) là đường geq động
  chính thức; mode `png` là đường video chính thức.
- **Image clip:** không có shift D3 (overlay 0:0) nên geometry track trong
  unit = đúng tọa độ frame cuối; mask di chuyển trên ảnh tĩnh (xem §5).
- **Text clip:** KHÔNG hỗ trợ (drawtext vẽ trực tiếp, không qua pipeline
  alpha) — validator warn sẵn, render vẫn chạy, chữ hiện bình thường, mask
  không có tác dụng (đã kiểm chứng §4, test 8).
- **Unit đã merge (transition):** không shift D3 (luật cũ) nên mask video
  lên đúng điểm track trong frame cuối — hành vi nhất quán, không cần xử
  lý riêng. Adjustment layer cắt giữa clip có track đã throw sẵn (fail
  fast) nên tracked mask không bị tách lệch thời gian.

## 3. Cách sinh mask video + chi phí

- `trackPointsToMaskKeyframes` → keyframes → `mask_anim.py` (không sửa):
  vẽ mỗi frame bằng `mask_png.render` rồi encode ffv1 gray, `n =
  round(duration×fps)` frame, PTS từ 0; `maskChainForSite` chặn thêm bằng
  `trim=end_frame=n`. Đồng bộ frame với unit (cùng bắt đầu PTS 0 sau
  trim/setpts + fps) — cùng cơ chế D4.
- Chi phí đo được (VM 4 vCPU, 1280×720, 4s, 30fps, 120 frame mask):
  `mask_anim.py` riêng: **5,5 s** (video mask 146.493 byte ffv1);
  render cả job: tracked-video **11,2 s** vs tĩnh **10,5 s** (chênh +0,7 s,
  gồm vẽ mask video + decode movie). Mode geq cùng job: **73,9 s** (geq
  tính từng pixel — lý do đường video là mặc định).
- Dedup: 2 clip cùng track + mask + khung + fps + duration dùng chung 1
  video mask (cùng key). Video/PNG tạm dọn sau render thành công (cơ chế
  D4 có sẵn, `maskAnimPaths`); giữ lại khi lỗi để debug.
- Lãng phí nhỏ (chưa sửa): pre-pass R2 vẫn vẽ 1 PNG tĩnh cho clip
  track+mask (theo `maskKey` tại tâm gốc) dù đường tracked không dùng tới
  — 1 lần gọi `mask_png.py` thừa mỗi mask tracked phân biệt.

## 4. Kiểm chứng (render thật, 1280×720, 30fps, track 0.35→0.65, mask ellipse w=0.3 h=0.5)

Nguồn: video đỏ trơn 4s + ảnh xanh; đo tâm vùng màu bằng centroid pixel
(PIL/numpy). Baseline chạy TRƯỚC khi sửa, lưu tại `/tmp/o2-round87/base/`.

| Kiểm chứng | Kết quả |
|---|---|
| (a) Video tracked: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.3875 / 0.5000 / 0.6125** (kỳ vọng 0.3875 / 0.5 / 0.6125, sai số < 0.0001) |
| (a) Image tracked: tâm mask tại t=0.5 / 2.0 / 3.5 | **0.3875 / 0.5000 / 0.6125** (sai số < 0.0001) |
| Mask video trực tiếp (ffv1, 120 frame): tâm frame 15/60/105 | **0.3875 / 0.5 / 0.6125** (chính xác) |
| (b) Tracked t=2.0 (track=0.5) vs mask tĩnh cùng shape | **MAD 0.023**, max 38 (720p); test 640×360: MAD 0.061 < 1 |
| (c) Mask tĩnh sau thay đổi vs baseline trước thay đổi (3 mốc) | **MAD = 0.0** cả 3 mốc — không hồi quy |
| Tracked sau thay đổi vs baseline trước thay đổi | MAD 0.023–0.032 (mask cùng vị trí; khác biệt chỉ do encode/quantization — xem §2) |
| Dry-run tracked spec | `.mkv` + `trim=end_frame=120`, **0** `geq=lum=` |
| Mode geq, tracked video: tâm tại t=0.5 / 3.5 | **0.3875 / 0.6125** (hành vi cũ giữ nguyên) |
| Text + track + mask | validate `ok=true`, warn `mask chưa hỗ trợ cho clip text`; render ok; frame nền đỏ nguyên (mean R 252.8), chữ trắng 2806 pixel |
| `mask.js --self-test` | **pass hết** (gồm §11 O1, §10b O3) |
| `test_d4_mask_keyframes.js` (hồi quy D4) | **13/13 pass** |
| `test_d3_trackfollow.js` (hồi quy D3 shift) | **22/22 pass** |
| `test_mask_anim.py` | **0 fail** |
| `test_round87_o2_mask_track.js` (mới, 640×360) | **25/25 pass** (video + image + (b) + tĩnh×2 + dry-run + keyframes/track + geq + text) |

## 5. Giới hạn / nợ mở (trung thực)

1. **Image + track + mask:** mask di chuyển theo track nhưng ẢNH ĐỨNG
   YÊN (track bị bỏ qua ở vị trí image clip — luật D3 cũ, validator đã
   warn "track chưa hỗ trợ cho clip image"). Kết quả: mask quét trên ảnh
   tĩnh, không bám vật trong ảnh. Đây là hành vi theo thiết kế hiện tại
   (mask bám track, ảnh không bám), nhưng warn validator hiện nói track
   "sẽ bị bỏ qua" trong khi track vẫn lái mask — câu chữ warn chưa chính
   xác hoàn toàn cho clip image CÓ mask. O2 không sửa câu warn (tránh
   xung đột với luồng khác); parent cân nhắc sửa khi gộp.
2. **Fallback chưa kích hoạt cưỡng bức end-to-end:** đường video/PNG
   fallback thất bại → geq tĩnh t=0 + warn chỉ được kiểm chứng bằng
   (i) `mask_anim.py` thoát != 0 với keyframes/duration sai (exit 1/2,
   không tạo file) và (ii) code fallback dùng chung cấu trúc đã kiểm
   chứng của D4. O2 KHÔNG đổi tên/giả chết `mask_anim.py` để ép fallback
   (sẽ làm hỏng luồng song song khác đang dùng file này). Nợ: một test
   ép fallback end-to-end khi chạy đơn luồng.
3. **Pre-pass R2 vẽ PNG thừa** cho clip tracked (xem §3).
4. **Video + track + mask tĩnh (không keyframes):** hành vi ĐỔI so với
   trước — trước đây clip dịch theo track (mask cưỡi theo), nay clip đứng
   yên (chỉ mask di chuyển). Tâm mask cuối giống nhau; nội dung clip thì
   khác (không còn dịch chuyển). Đây là hệ quả trực tiếp của quyết định
   O3 "track lái mask, video đứng yên" mở rộng sang đường png — nếu parent
   muốn giữ hành vi cũ cho mask tĩnh, cần tách luật: chỉ bỏ shift khi mask
   thực sự động (video tracked), không bỏ khi mask tĩnh.
5. **Track + transition (unit merge):** mask video vẫn sinh theo thời gian
   clip-local đầy đủ; unit merge không shift nên mask lên đúng điểm track
   — chưa có test render riêng cho combo này (chỉ suy từ luật code).
6. **Chi phí mask video** tăng tuyến tính theo số frame × diện tích khung
   (720p 4s: +5,5 s vẽ riêng). Clip dài/4K sẽ đắt hơn tương ứng; chưa đo
   4K. Dedup theo key giảm chi phí khi nhiều clip trùng quỹ đạo.
7. **Không đụng:** TTS 39, file workflow, `validate.js`, `mask_anim.py`,
   `mask_png.py`. O1/O3 cùng đợt sửa chung `mask.js`/`render.js` (xem §6).

## 6. Ghi chú gộp (quan trọng — file chung bị sửa song song)

- O1 và O3 hạ cánh TRONG LÚC O2 đang code, cùng sửa `mask.js` và
  `render.js`. O2 đã đối chiếu và dùng đúng code đã hạ cánh:
  `maskGeometryAtTrack`/`interpolateTrackPoints` (O1), `buildMaskTrackGeqExpr`/
  `buildMaskTrackGeqChain` + nhánh `trackgeq` trong `maskChainForSite` +
  điều kiện bỏ shift D3 (O3). Bản tạm `maskGeometryAtTrack` của O2 và hàm
  `sampleTrackAt` dư thừa đã XÓA; `trackPointsToMaskKeyframes` đã sửa để
  khớp ngữ nghĩa O1 (w/h theo keyframes, mốc = hợp track ∪ keyframes).
- Khi O2 bắt đầu, `maskGeometryAtTrack` chưa có trên đĩa (grep 0 kết quả);
  lúc O2 viết xong thì O1/O3 đã có mặt — file `mask.js` bị ghi đè xen kẽ
  ít nhất 2 lần trong phiên (1 lần làm mất dòng require của O2 gây
  SyntaxError tạm thời; 1 lần xóa bản tạm `maskGeometryAtTrack` của O2).
  Trạng thái cuối đã kiểm chứng: `node --check` + self-test pass,
  D3/D4 hồi quy xanh, test O2 25/25 xanh.
- Parent gộp cần kiểm tra: `mask.js` chỉ có MỘT `maskGeometryAtTrack`
  (của O1, dòng ~218) và MỘT require `tracking_validate` (dòng ~43, chung
  O2/O3); `render.js` có đủ cả 3 nhánh trong `maskChainForSite`
  (trackgeq O3 → tracked video O2 → keyframes D4 → tĩnh) và điều kiện bỏ
  shift D3 gồm cả `trackgeq` lẫn `png`.
- Không có file LIMITS của O1/O3 trên đĩa lúc O2 viết doc này (chưa hạ
  cánh hoặc chưa viết); O2 chỉ dựa vào code + comment của họ trong file.
