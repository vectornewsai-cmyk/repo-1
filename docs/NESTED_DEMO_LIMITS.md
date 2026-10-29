# Giới hạn của demo nested + adjustment — ĐỢT 6 (R6, cron 20:03 25/10)

Tài liệu trung thực về demo trong `docs/nested-adjustment-demo.md`.
Bản này THAY THẾ bản đợt 5: những gì đợt 5 chưa làm được mà đợt 6 đã
làm được thì ghi là đã làm được (kèm số đo), phần còn lại vẫn ghi rõ.

## Đã chứng minh được ở đợt 6 (có số đo thật)

- Flatten DÙNG CODE THẬT: `flattenSpecForRender` từ
  `server/render/src/nested.js` cho ra đúng leaf-a 1→3 (in 0→2),
  leaf-b1 3→4, leaf-b2 4→5; stats 2 nested / 3 clip phẳng / 2 track
  mới / 0 warning; spec gốc không bị sửa.
  Kiểm chứng: `node server/render/src/test_nested_e2e.js` phần A.
- Render ĐI QUA render.js THẬT (không tự dựng lệnh FFmpeg tay):
  MP4 640×360, duration 5,000000s, 328668 bytes (phần A).
- Audio LỒNG NHAU trong project con render thật qua render.js:
  MP4 có audio stream AAC, duration 5,000000s; đo volumedetect:
  đoạn 0→0.9s (trước nested) mean −91 dB (câm), đoạn 2→4s (trong
  nested) mean −24,1 dB (có tiếng sine 440Hz). Đây là lần đầu audio
  trong subSpec được đo bằng số, không chỉ test flatten.
  Kiểm chứng: test E2E phần B.
- Fail fast thật cho 9 field trên nested clip (phần C, xem bảng ở
  `docs/NESTED_ROUND6_LIMITS.md`).
- Test web 8/8: spec mẫu hợp lệ + shape sau chuyển đổi sang dạng N2
  đúng từng field (outer trim 0→4, inner trim 0→2, src a/b/c.mp4).
  Lưu ý: test web là test SHAPE, không phải test flatten.

## Chưa chứng minh được (đừng claim ngược lại)

1. **Adjustment layer vẫn chưa render được qua render.js.**
   render.js không đọc adjustment; `adjustment.js` chỉ có hàm riêng
   + điểm nối ghi trong header, chưa nối vào `buildFilterGraph`.
   Demo đợt 6 đã bỏ hẳn phần render adjustment (kể cả bản dựng tay
   hue=s=0 của đợt 5) để không tạo ấn tượng "adjustment đã xong".
   Test render thật của N3 (filter_complex dựng tay, frame trong
   layer đổi pixel / ngoài giữ nguyên) vẫn là bằng chứng duy nhất
   cho adjustment, và nó KHÔNG đi qua render.js.
2. **Chưa kiểm tra pixel của video nested.** Test E2E chỉ kiểm tra
   flatten, kích thước, duration và audio — chưa trích frame ở 1.5s /
   3.5s / 4.5s để đo màu thật. Bước xem bằng mắt trong doc demo vẫn
   là việc thủ công, chưa tự động hóa.
3. **Chưa click-test UI thật.** Không có bước nào tạo compound hay
   adjustment bằng thao tác trên Timeline, không có test Playwright
   cho demo này. Người dùng cuối hiện chưa thể tạo được project mẫu
   này bằng tay trong editor — chỉ tạo được bằng cách chép spec.
4. **Render.js không pad đuôi đen theo spec.duration.** MP4 render
   dài 5s (clip kết thúc muộn nhất), không phải 6s minh họa của spec
   mẫu cũ. Đừng claim duration 6s cho đường render qua render.js.
5. **Phạm vi hẹp, cố tình hẹp.** Chỉ video + 1 audio tone sine trong
   project con, không transition trong compound, không keyframe,
   không mask, không speed curve, không clip chồng nhau. Mọi tổ hợp
   ngoài phạm vi này đều chưa được test — và 9 field trong bảng
   fail fast ở LIMITS đợt 6 là bằng chứng rằng chúng bị từ chối chứ
   không phải được hỗ trợ.
6. **TSC của repo hiện không sạch — nhưng không phải do R6.**
   `npx tsc --noEmit -p apps/web/tsconfig.json` báo 2 lỗi trong file
   của luồng khác (`Timeline.tsx`: `fxDragRef` không dùng;
   `lib/nestedPreview.ts`: `AdjustmentWindow` thiếu `nestedPath`) —
   R6 không sửa các file đó vì thuộc luồng khác / có thể đang được
   luồng song song khác sửa dở. Lỗi này không nằm trong file R6 đổi
   (không có lỗi nào ở `sample-nested.ts`), và không chặn test E2E
   (chạy bằng Node thuần, không qua tsc).

## Việc tiếp theo (cho luồng sau, không phải cam kết của R6)

- Nối adjustment vào render.js thật (theo điểm nối trong header
  `adjustment.js`), rồi mới claim adjustment render được.
- Thêm kiểm tra pixel: frame 1.5s / 3.5s / 4.5s phải có màu đúng
  testsrc / xanh / đỏ.
- Thêm click-test UI khi Timeline hỗ trợ tạo compound/adjustment.
- Hỗ trợ dần các field fail fast (bắt đầu từ opacity nhân vào clip
  lá và filter áp cho cả sequence), mỗi field chỉ claim khi có test
  render thật đi kèm.
