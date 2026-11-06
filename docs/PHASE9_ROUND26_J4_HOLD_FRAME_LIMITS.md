# Phase 9 đợt 26, luồng J4 — Giữ frame tốt cuối cùng khi phát mà decoder tụt (nợ I6 §5h đợt 25) — LIMITS

Ngày: 30/10/2026. Luồng J4 trong đợt lớn round 26. KHÔNG push, KHÔNG
release/tag, KHÔNG code giả. Parent lo file paths-loop và build-loop-log;
luồng này KHÔNG tự ghi 2 file đó.

## 1. Vấn đề và cách sửa (tóm tắt)

Đợt 25 I6 §5h đo được trên VM yếu: decoder phần mềm không kịp realtime
→ `readyState` của element video tụt xuống 1 trong lúc phát → guard cũ
(`readyState >= 2 && videoWidth > 0`) trong `drawVideoClip` bỏ qua mọi
frame, mà `renderFrame` đã xóa nền đen mỗi tick trước đó, nên canvas đen
kịt trong lúc phát (dừng lại thì fix §5g vẽ lại đúng). Sửa của J4:

- Tách quyết định thành hàm thuần `decideVideoFrame` trong
  `apps/web/src/lib/holdFrame.ts`: `draw` khi `readyState >= 2` và
  `videoWidth > 0`; `hold` khi thiếu frame nhưng đang phát và đã có
  frame tốt cũ; `skip` trong mọi trường hợp còn lại (chưa từng có frame
  tốt, hoặc đang PAUSED — nhánh pause seek rồi mới vẽ, vẽ frame cũ sau
  scrub sẽ là frame SAI vị trí).
- `drawVideoClip` (vùng guard, `apps/web/src/preview.tsx`) giữ cache
  canvas frame tốt cuối cùng theo khóa `clip.id::clip.src` (đổi src/relink
  không vẽ nhầm frame cũ), chỉ lưu ở nhánh `draw`. Nhánh `hold` đưa
  canvas cache đi tiếp qua đúng pipeline thường (letterbox, LUT, chroma,
  effects, mask, SR, opacity tính tại `t` hiện tại) nên geometry/effect
  vẫn theo `t`, chỉ nội dung frame là cũ. Nhánh `skip` giữ nguyên hành
  vi cũ (trả về, không vẽ gì).
- "Đang phát" được suy ra từ `!videoElement.paused` thay vì luồn trạng
  thái playing của store qua `drawVideoClip` — để không đụng vùng vẽ
  transition/dip của luồng khác (xem §4 về hệ quả phát ngược).
- Vì mọi đường vẽ preview (thường, mask, SR, transition wrapper, dip
  của J3) đều funnel qua `drawVideoClip`, hold áp dụng cho tất cả các
  đường đó mà không cần sửa từng wrapper. Chỉ sửa thêm 1 dòng type của
  `chromaKeyedSource` (nhận thêm `HTMLCanvasElement`) vì nhánh hold đưa
  canvas vào đó; `effectCanvasSource`/`maskedUnitSource` vốn đã nhận
  `CanvasImageSource` nên không đổi.

## 2. Câu hỏi "videoWidth > 0 nhưng chưa có frame" — quyết định bằng bằng chứng

Hướng I6 gợi ("nới guard cho trường hợp videoWidth > 0") đã được đo,
không đoán, bằng 2 harness Chromium thật (pipe CDP, headed dưới Xvfb,
trang test tự chứa trong scratch, không sửa code sản phẩm):

- Harness 1 (file local nhỏ, clip h264 1280x720 8 s): ở `loadedmetadata`
  handler, `readyState` đã là 4 (file local load quá nhanh, không bắt
  được khoảnh khắc RS=1); vẽ video paused ở `t=0` chưa có frame hiện
  tại cũng là no-op (canvas đỏ giữ nguyên 100%). Kết luận phụ: màu đen
  trong preview đến từ chính `renderFrame` xóa nền, không phải do
  `drawImage` vẽ đen — và `drawImage` không bao giờ throw trong các
  lần đo (threw = null toàn bộ).
- Harness 2 (video testsrc 1280x720 60 s, 11 MB, serve nhỏ giọt
  ~107 KB/s để ép đói dữ liệu một cách xác định): histogram
  `readyState` trong 20 s: `{0: 41, 1: 73, 3: 694, 4: 64}` tick. 12 probe
  tại RS=1, `videoWidth=1280`, đang phát (`paused=false`), `t=0`:
  probe đầu tiên redFrac = 1.000 (no-op — chưa có frame nào), 11 probe
  sau redFrac = 0, mean (124.2, 129.3, 125.5) — tức Chromium VẼ FRAME CŨ
  CUỐI khi đã có frame, dù `readyState` vẫn là 1. Probe sau seek tới
  50 s (`seeked`, RS=3) vẽ frame bình thường, mean (124.2, 129.5, 125.4).

Kết luận: ở RS=1, `drawImage` có HAI hành vi — no-op trước frame đầu,
vẽ frame cũ sau khi đã có frame. Vì vậy nới guard thành `videoWidth > 0`
KHÔNG được chọn: (a) trước frame đầu vẫn đen sau khi `renderFrame` xóa
nền; (b) sau đó thì giữ frame theo cách phụ thuộc trình duyệt, không
khóa được bằng unit test, không phân biệt được "frame cũ tốt" với "chưa
có frame". Nhánh hold (cache do chính mình giữ) là cách xác định, độc
lập trình duyệt, khóa được bằng unit test — và nó cũng là cách duy
nhất giữ được hình trước frame đầu theo nghĩa "không đen thêm" (ở đó
thực ra không có gì để giữ, xem §4).

## 3. Kiểm chứng (số thật)

- Unit test `apps/web/src/lib/holdFrame.test.ts` (Node type-stripping,
  theo quy ước repo): **9/9 pass** — draw khi frame sẵn (cả phát lẫn
  pause), hold đúng case I6 §5h (RS=1 + width>0 + phát + đã có frame),
  hold khi RS=0, skip khi chưa có frame tốt, skip khi paused dù đã có
  frame tốt (chống frame sai vị trí sau scrub), hold khi RS>=2 nhưng
  width=0 + phát, biên RS=2 draw / RS=1 hold không lệch 1.
- `tsc --noEmit`: file của J4 sạch (không lỗi nào nhắc tới
  `holdFrame*` hay `preview.tsx`). Toàn repo lúc kiểm tra cuối còn 1
  lỗi `TS5097` ở `src/lib/projectRepoRound26J5.test.ts` — test mới của
  luồng J5 chưa được thêm vào tsconfig exclude, KHÔNG phải của J4 và
  J4 không đụng vào (tránh xung đột sửa cùng file với J5). Ghi chú
  phương pháp: một lần chạy tsc giữa chừng từng hiện lỗi `relink.ts`
  rồi biến mất ở lần chạy sau — do luồng khác đang sửa file đó cùng
  lúc trong working copy dùng chung; không phải lỗi của J4.
- `vite build` pass (bundle cuối `index-TbcVja5_.js`, 958.42 kB; dist
  là build output, parent quyết có stage hay không — lưu ý dist dùng
  chung nên bundle hash đổi theo cây làm việc tại thời điểm build, xem
  thêm §5).
- Hồi quy mức app (bản sau sửa, vite preview + CDP pipe, CPU throttle
  20x, project mẫu tự load 8 s, bundle phục vụ khớp bundle vừa build):
  idle centerMean 12.7 (frame t=0 của sample vốn tối); phát 16 mẫu
  500 ms, playhead 00:00.0 → 00:03.6, centerMean lên 112.2 rồi fade-out
  75.8 đúng transitionOut cuối clip; **0 tick đen** (centerMean < 5);
  sau dừng frame giữ nguyên (35.0/74.8, playhead đứng 00:03.6) — hành
  vi §5g còn nguyên. Lần chạy app đầu tiên VÔ HIỆU (điều kiện ready
  quá yếu, đo lúc project chưa load: duration 00:00.0) nên đã chạy lại
  với điều kiện ready đúng (duration > 0) — số trên là của lần chạy
  lại. Lần chạy này decode KHÔNG đói (throttle 20x vẫn đủ cho sample
  360p) nên nó chỉ chứng minh KHÔNG HỒI QUY, không chứng minh hold đã
  kích hoạt trong app; hold được khóa ở tầng unit + đường code (§1).
- Hồi quy lân cận: `previewEngine.test.ts` 14/14 pass.

## 4. Giới hạn — đọc kỹ trước khi coi là xong

- **Chưa xác nhận trên máy thật / decode phần cứng.** Toàn bộ hiện
  tượng gốc chỉ đo trên VM yếu (I6) và harness đói dữ liệu (J4). Trên
  máy thật có decode phần cứng, 720p 1x nhiều khả năng không gặp hiện
  tượng này — fix này khi đó chỉ là lớp bảo hiểm, không làm hại (nhánh
  `draw` không đổi, cache chỉ đọc khi guard cũ đã bỏ frame).
- **Vẫn đen trong các trường hợp sau:** (a) chưa từng có frame tốt
  (bắt đầu phát khi decoder chưa giao frame đầu — không có gì để giữ);
  (b) nhánh pause: seek xong mà frame chưa sẵn thì vẫn skip như cũ
  (seeked trong thực tế thường đi kèm frame sẵn nên hiếm); (c) element
  vừa bấm play nhưng `play()` chưa chạy xong (`paused` vẫn true) thì
  quyết định là skip trong vài tick đầu; (d) clip ảnh không liên quan
  (guard ảnh không đổi).
- **Phát ngược chưa được sửa.** `syncMedia` giữ element phát ngược ở
  trạng thái paused và seek từng frame, nên `!paused` suy ra "không
  phát" và quyết định là skip như cũ. Muốn sửa cả phát ngược cần luồn
  trạng thái playing thật qua `renderFrame` → wrapper → `drawVideoClip`,
  tức đụng vùng transition/dip — để cho luồng khác quyết, không làm
  lén trong J4.
- **Frame giữ có thể cũ vô hạn trong lúc đói kéo dài.** Nếu decoder đói
  nhiều giây, preview đứng yên ở frame tốt cuối trong khi audio vẫn
  chạy (lệch cảm nhận A/V) — vẫn tốt hơn đen kịt, nhưng không phải là
  "phát mượt". Không có cơ chế hết hạn frame giữ (chủ ý: hết hạn sẽ
  quay lại đen, đúng thứ cần tránh).
- **Nội dung giữ cũ nhưng geometry chạy theo `t`.** Nhánh hold tính
  mask/SR/track/opacity tại `t` hiện tại nên clip có motion/track sẽ
  thấy khung di chuyển mà mặt hình đứng yên trong lúc đói — chấp nhận
  được cho vài tick, có thể trông lạ nếu đói kéo dài.
- **Chi phí:** 1 `drawImage` thêm (kích thước gốc, không filter) mỗi
  tick vẽ thành công cho mỗi clip video; cache tối đa 16 clip (evict
  cũ nhất theo thứ tự chèn), khóa gồm cả `src` nên relink không vẽ
  nhầm. Không có `document` (SSR) thì không cache, rơi về guard cũ.
- **Tương tác với J3 (dip):** nhánh dip của J3 gọi `drawVideoClip` với
  bản sao clip đã strip transition (cùng id/src) nên dùng chung cache
  và cũng được hold — nhất quán, không cần sửa thêm.

## 5. File đổi/thêm (text, không binary — parent gộp batch)

- Sửa: `apps/web/src/preview.tsx` — import helper, type
  `chromaKeyedSource` thêm `HTMLCanvasElement`, cache + hàm
  `storeHeldFrame` ngay trên `drawVideoClip`, thay nhánh video của
  guard bằng `decideVideoFrame` (draw/hold/skip). Không reformat, không
  đụng vùng vẽ transition/dip (các thay đổi khác trong file lúc kiểm
  tra cuối thuộc luồng J3/J khác đang sửa cùng working copy).
- Mới: `apps/web/src/lib/holdFrame.ts` — hàm thuần + doc quyết định.
- Mới: `apps/web/src/lib/holdFrame.test.ts` — 9 test khóa bảng quyết định.
- Sửa: `apps/web/tsconfig.json` — thêm `src/lib/holdFrame.test.ts`
  vào exclude (theo đúng quy ước mọi test lib trong repo).
- Mới: `docs/PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md` — file này.
- Build output `apps/web/dist/` đã build lại tại chỗ để đo (bundle
  `index-TbcVja5_.js`) — parent quyết có stage hay không theo quy ước
  các đợt trước. Harness/scratch của luồng nằm ở
  `~/workspace/tmp-round26-j4/` và được dọn cuối luồng theo lệnh (số
  liệu đã ghi hết trong file này).
