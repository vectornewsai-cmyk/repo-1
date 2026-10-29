# Phase 9 đợt 6 (cron 20:03 25/10) — Nối thật nested/adjustment vào render — LIMITS tổng hợp của parent

> Đợt này đóng các nợ lớn nhất của đợt 5 (docs/NESTED_ROUND_LIMITS.md):
> adjustment chưa vào render.js, adjustment chưa có type spec thống nhất,
> transition qua biên nested chưa hỗ trợ, opacity trên nested chưa kế thừa,
> preview chưa đúng thứ tự/chuỗi LUT, UI chưa có i18n và chưa kéo/trim được layer.
> Mọi claim dưới đây đều có test/số đo đi kèm trong log vòng lặp; phần chưa
> làm được ghi rõ, không tô hồng. File này là LIMITS của ĐỢT 6 (cron), không
> trùng docs/NESTED_ROUND6_LIMITS.md của luồng R6 (luồng test/demo trong đợt).

## Đã chứng minh thật (kiểm chứng gộp của parent, chạy lại toàn bộ)

- tsc apps/web: 0 lỗi; vite build pass (8.30s, cảnh báo chunk >500kB có sẵn).
- R1 render adjustment: `server/render/test_adjustment_render.js` 39/39.
  Nguồn testsrc2 320x240 30fps, so từng pixel: layer brightness 60 [2,4)
  cho t=1: 0.037, t=3: 76.844, t=5: 0.802 (mean abs diff/kênh); clip giao
  biên tách đúng cả hai clip kề; speed 2 và reverse đều đúng nguồn sau tách.
- R2 spec: TS 13/13, CJS `server/render/test_adjustment_spec.js` 21/21,
  hồi quy N3 46/46.
- R3 transition/opacity qua biên: render `test_nested_r3.js` 43/43
  (fade-in t=1.5 blend (127,0,124); opacity 0.5 trên nested cho (127,0,0);
  fade-out t=1.5 blend (125,0,126); wipeleft qua biên fail fast),
  preview `nestedPreviewR3.test.ts` 17/17.
- R4 preview: `nestedPreview.test.ts` 31/31 (14 cũ + 17 mới),
  preview-engine 337 assertion, tsc 0, vite build pass.
- R5 UI: `nestUtils.test.ts` 17/17, i18n check R6 PASS (vi=en=621 key),
  tsc 0, vite build pass.
- R6 E2E: `nestedDemo.test.ts` 8/8, `test_nested_e2e.js` 28/28
  (MP4 640x360 5s; audio trong project con −24,1 dB trong vùng vs −91 dB
  ngoài vùng), hồi quy nested render 24/24.
- Parent chạy lại: tsc 0, vite build pass, adjustment render 39/39,
  adjustment spec 21/21, nested R3 43/43, nested render 24/24,
  nested E2E 28/28, adjustment N3 46/46, nestedPreview 31/31,
  nestedPreviewR3 17/17, nestUtils 17/17, nestedDemo 8/8,
  preview-engine 337, i18n check PASS.

## Hai shape adjustment vẫn tồn tại song song — ĐỪNG NHẦM

1. **Spec shape (render + R2):** `VideoSpec.adjustmentLayers[]` cấp project,
   áp cho MỌI clip video giao nhau về thời gian, bất kể track; thứ tự mảng
   = thứ tự áp. Đây là shape đã nối vào render.js (R1) và validate (R1+R2).
2. **UI shape (panel N4/R5):** bản ghi `kind: "adjustment"` trong
   `track.clips` (`filterType`/`intensity`), gắn với một track, preview R4
   áp theo ngữ nghĩa "track sau nằm trên clip" (layer cùng track không áp).
   **Chưa có chuyển đổi UI → spec**, nên layer tạo từ panel chưa đi tới
   render.js. Đừng claim panel adjustment đã render được.
3. Hệ quả: render (shape 1, áp mọi track) và preview của UI shape (shape 2,
   theo track) KHÔNG cùng ngữ nghĩa. Thống nhất một ngữ nghĩa duy nhất
   (thêm field track vào spec shape, hoặc chuyển UI sang shape project)
   là việc của đợt sau, cần quyết định thiết kế trước khi code.

## Đã sửa so với đợt 5

- Adjustment vào render.js thật (R1): tách clip theo biên layer, nối adjChain
  cuối chuỗi pixel của đoạn trong layer (sau effects/enhPost/plugin), cả
  đường thường và speed-ramp; validate field trong validate.js.
- Spec adjustment thống nhất (R2): nguồn chuẩn duy nhất là adjustment.ts;
  chỉ 2 bản JS (tsc output của video-spec + mirror CJS của render worker),
  không bản thứ ba; round-trip 2 vòng không mất field; project cũ không bị
  chèn field; `projectDuration` không đổi khi layer vươn xa hơn clip.
- Transition fade qua biên nested + opacity kế thừa (R3): fade bằng cách
  dịch lá biên sớm T giây + keyframes opacity; opacity tĩnh nhân trực tiếp,
  keyframes nhân từng giá trị, lồng nhiều cấp nhân dồn (0.5×0.5=0.25).
- Preview đúng thứ tự + chuỗi LUT thật (R4): lọc scope trước khi cắt clip;
  chuỗi LUT áp lần lượt cả WebGL lẫn CSS fallback; liệt kê 8/16 effect vẽ
  được và 8 bỏ qua có lý do (`SKIPPED_EFFECT_REASONS`).
- UI (R5): 62 key i18n mới (nested/adjustment/timeline), parity 621/621;
  layer kéo/trim/box-select trên hàng FX (logic + wiring, xem giới hạn
  click-test); sửa được clip con trong compound clip qua InnerClipEditor.
- E2E/demo (R6): bỏ flatten tự viết, dùng `flattenSpecForRender` thật;
  audio trong subSpec lần đầu được đo bằng số (không chỉ test flatten).

## Chưa làm được / chưa nối (trung thực)

1. **UI adjustment chưa tới render** (xem "Hai shape" ở trên) — nợ lớn nhất
   còn lại của đợt này.
2. **Chỉ transition "fade" qua biên nested** (R3); wipe/slide/dissolve throw
   fail fast. Chỉ lá video/text ở biên mới fade được; lá image/sticker ở
   biên + transition → throw. Audio không crossfade qua biên.
3. **UI chưa đặt được transition/opacity lên nested clip** — R3 hiện chỉ tới
   qua project JSON.
4. **Layer trong subSpec của nested clip bị flatten của N2 bỏ qua lặng lẽ**
   (không áp, không cảnh báo) — R1 ghi rõ, chưa có ngữ nghĩa qua flatten.
5. **`splitClipByLayers` mới chỉ có ở bản CJS render worker**, chưa có ở
   mirror TS `adjustment.ts` (R2 chưa port).
6. **Preview và render dùng 2 shape nested khác nhau** (`tracks` trực tiếp
   vs `subSpec`) — R3 chỉ mirror logic, chưa thống nhất shape.
7. **Tương tác UI mới của R5 chưa click-test browser thật** (kéo/trim layer,
   box-select qua FX, editor clip con, đổi ngôn ngữ panel): mới qua tsc +
   vite build + test logic thuần. Parent chưa coi là xong về mặt UX cho
   tới khi click-test thật.
8. **"Giữ nguyên" ngoài layer không phải tuyệt đối từng byte:** chuỗi filter
   của đoạn ngoài layer giữ nguyên 100%, nhưng frame sau encode x264 mặc
   định lệch baseline ≤0,92/kênh do nhiễu dự đoán liên frame (trong layer
   lệch tới ~77). Biên tách không trùng khung hình có thể lệch pha lấy mẫu
   `fps` dưới 1 frame ở đầu đoạn.
9. **Fail fast của R1 (chưa hỗ trợ, throw thay vì render sai):** layer giao
   clip dính transition; layer cắt giữa clip có speedKeyframes / animations /
   motion track / mask keyframes / enhance.stabilize. Layer bao trọn các
   trường hợp đó thì render bình thường.
10. **Fail fast của R3:** nested 2 đầu (in+out), clip phẳng bị dịch còn dính
    cặp khác, lá biên có keyframes opacity sẵn / có transition trong /
    kind image-sticker / bị cắt trái (fade-in) / ngắn hơn T, opacity ngoài
    [0,1], 2 đầu khai không khớp duration/type.
11. **Giới hạn preview R4 còn lại:** WebGL chuỗi theo nguyên tắc "tất cả
    hoặc không" (1 mắt xích chưa load xong thì cả chuỗi rơi về CSS xấp xỉ);
    fallback CSS không vẽ được LUT user (`user-*`) nên mắt xích đó thiếu
    lặng lẽ trong CSS; badge LUT không báo số mắt xích; cảnh báo effect bỏ
    qua chỉ tới clip video.
12. **Giới hạn R5 còn lại:** 1 chuỗi Việt hardcode sót ("chữ" cho clip text
    không nội dung trong dòng liệt kê clip con); rủi ro selection hỗn hợp
    (layer + clip thường) khi kéo bằng action generic — R5 tránh bằng action
    riêng cho layer nhưng không sửa hành vi generic; không nest lồng ở UI
    (giữ nguyên là giới hạn có chủ đích dù spec cho phép sâu 8 tầng).
13. **Giới hạn R6 còn lại:** chưa có kiểm tra pixel tự động cho video nested;
    chưa click-test UI thật cho compound/adjustment; ducking vào project con
    vẫn chưa hỗ trợ; `opacity` và `src` kèm subSpec fail fast theo code
    nested.js nhưng R6 chưa có test riêng cho 2 field này.
14. **Dọn dẹp riêng chưa làm:** `packages/video-spec/src/index.js` (output
    tsc cũ) vẫn thiếu export adjustment (cùng các export mask/enhance/audio/
    markers/timebase/tracking thiếu từ trước) — R2 cố tình không sửa tay
    file output và không regen toàn bộ package để tránh diff lớn + xung
    đột; editor không bị ảnh hưởng vì package exports trỏ thẳng tới index.ts.
    Key i18n đề xuất ở NESTED_PREVIEW_LIMITS §4 vẫn cần đối chiếu với key
    R5 đã merge trước khi claim i18n nested xong hẳn.

## Không làm (đúng chủ trương)

- Không push GitHub, không tag/release, không binary trong batch.
- Không đụng cloud/collab, model đóng, nhạc có bản quyền.
- Ghi chú cũ "preview layer trên thắng khi chồng 2 LUT" của R1 đã lỗi thời
  sau R4 (preview nay nối chuỗi thật) — không dùng ghi chú đó nữa.
