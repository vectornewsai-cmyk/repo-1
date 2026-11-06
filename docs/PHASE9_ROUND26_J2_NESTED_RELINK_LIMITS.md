# PHASE9_ROUND26_J2_NESTED_RELINK_LIMITS.md — Relink đệ quy qua nested

## Vấn đề gốc (đợt 25 luồng I6 §5b)

`findMissingAssets` (apps/web/src/lib/relink.ts) chỉ quét `spec.tracks` cấp
cao. Clip nested không có `src` nên lá media trong `subSpec` không bao giờ
được tính thiếu → project chỉ thiếu media trong nested không hiện
`RelinkPanel`; đường vòng duy nhất là import lại qua MediaBin.

## Đã làm (đợt 26, luồng J2 — đã kiểm chứng, số thật bên dưới)

- `findMissingAssets` đệ quy qua mọi tầng nested:
  - Dạng canonical: clip `kind: "nested"` + `subSpec.tracks` (chuẩn của
    packages/video-spec/src/nested.ts).
  - Dạng legacy: clip nested mang trực tiếp `tracks` khi không có `subSpec`
    (cùng quy ước ưu tiên subSpec của nestedPreview.ts). Khi cả hai cùng
    tồn tại, quét chỉ dùng `subSpec` để tránh đếm trùng.
  - Gộp theo `src` như cũ: 1 file thiếu ở nhiều clip (cấp cao + nhiều
    nested) vẫn là 1 entry, kèm `topLevelClipCount`, `nestedClipCount`,
    `nestedChains` (chuỗi "outer › inner", dùng `name` nếu có, không thì
    `id`) và `locations[]` (chain, track trong subSpec, clipId, depth).
- `relinkAsset` đệ quy tương tự: đổi đúng `src` của lá sâu, không đổi clip
  dùng src khác, không mutate input (nhánh không đổi giữ nguyên tham chiếu).
  Khi clip vừa có `subSpec` vừa có `tracks` trực tiếp, cả hai đều được cập
  nhật nhưng chỉ đếm một lần (cùng một lá logic biểu diễn hai lần).
- `RelinkPanel` hiển thị mục thiếu trong nested phân biệt với clip cấp cao:
  dòng "📦 Trong nested: <chain>" + breakdown "(X ở cấp cao, Y trong
  nested)" hoặc "(chỉ trong nested)". Panel vẫn gộp theo `src` (1 dòng cho
  1 file, liệt kê mọi chain) — không tách thành 1 dòng mỗi chain.
- Undo: KHÔNG cần sửa store. `store.relinkMedia()` đã bọc kết quả
  `relinkAsset` trong một `execCommand({ label: "Relink media" })` nên
  relink lá trong nested cũng là 1 bước undo duy nhất như relink cấp cao
  (xác nhận bằng đọc code store, không phải test click).
- Test mới `apps/web/src/lib/relinkNested.test.ts`: **13/13 pass** bằng
  `node apps/web/src/lib/relinkNested.test.ts` (harness thuần, theo mẫu
  clipboard.test.ts). Khóa: thiếu tầng 1, thiếu tầng 2, nhiều nested cùng
  thiếu 1 src, lá không thiếu không bị liệt kê (cấp cao + nested + text
  clip), blob: trong nested vẫn thiếu, nested legacy, subSpec dùng lại ở 2
  nhánh anh em được tính cả hai, vòng lặp tự tham chiếu không treo, relink
  lá sâu tầng 2 đổi đúng src, không mutate input, lá trim/speed trong
  nested giữ nguyên field ngoài src, relink legacy, hồi quy relink cũ
  (đổi mọi clip cùng src, old==new → 0 và giữ spec).
- Hồi quy chạy kèm (node trực tiếp, không đụng code của chúng):
  clipboard.test.ts 18/18, nestedDemo.test.ts 8/8, captionFollow.test.ts
  22/22.
- Kiểm chứng build: `npx tsc -p tsconfig.json --noEmit` trong apps/web
  **không còn lỗi nào ở file của luồng này** (xem mục "Nợ / lưu ý" về 2
  lỗi của luồng khác); `npx vite build` pass (182 modules, 9.94s).
- Theo quy ước repo, test mới dùng import đuôi `.ts` để chạy bằng node
  nên đã thêm `src/lib/relinkNested.test.ts` vào `exclude` của
  apps/web/tsconfig.json (cùng cách mọi test `.ts` khác trong repo làm).

## Giới hạn trung thực

1. **Độ sâu tối đa 64 tầng** (`MAX_NESTED_RELINK_DEPTH`). Spec giới hạn
   nested ở 8 tầng nên thực tế không chạm ngưỡng; nhánh sâu hơn 64 bị bỏ
   qua lặng lẽ (quét + relink). Đây là lưới an toàn chống stack overflow
   trên cây lồng nhau bệnh lý, không phải giới hạn nghiệp vụ.
2. **Chống vòng lặp theo nhánh, không theo toàn cục.** Cùng một `subSpec`
   object dùng lại ở hai clip anh em là hợp lệ và được tính cả hai nhánh.
   Chỉ khi `subSpec` xuất hiện lại trong chính chuỗi tổ tiên của nó mới
   cắt nhánh. Vòng lặp qua `tracks` trực tiếp (không qua `subSpec`) không
   có object tổ tiên để nhận diện nên chỉ được chặn bởi ngưỡng độ sâu 64
   (vẫn kết thúc, chỉ tốn đệ quy tới ngưỡng).
3. **Relink lá trong nested đã trim/curve:** relink chỉ đổi field `src`
   (spread giữ nguyên mọi field khác). Test khóa in/out/speed của lá và
   trim của nested clip; `speedKeyframes` trên lá không có test riêng
   (giữ nguyên theo cùng cơ chế spread, nhưng chưa được khóa bằng test
   chuyên biệt). Clip id không đổi nên caption/marker bám theo id không
   bị ảnh hưởng — cũng chưa có test chuyên biệt cho điểm này.
4. **Panel chưa có test click thật trên browser** (nợ chung của dự án,
   giống RELINK_LIMITS.md §6). Hiển thị chain nested chỉ được kiểm chứng
   bằng tsc + vite build, chưa click qua UI thật.
5. **Match vẫn theo tên file chính xác, không theo content hash; vẫn
   không có gợi ý tự động hay relink hàng loạt** — các giới hạn cũ trong
   apps/web/src/lib/RELINK_LIMITS.md vẫn nguyên vẹn, đợt này không sửa.
6. **Trường hợp cả `subSpec` và `tracks` trực tiếp cùng tồn tại nhưng nội
   dung khác nhau:** quét lấy `subSpec` (canonical, đúng normalize của
   nestedPreview.ts); relink cập nhật cả hai. Nếu consumer nào đó vẫn đọc
   `tracks` trực tiếp thì nó nhận src mới, nhưng ngữ nghĩa "bản nào mới là
   thật" vẫn thuộc về tầng normalize/validate, không thuộc relink.
7. **Không xử lý asset thiếu trong `adjustmentLayers` của subSpec:**
   layer không mang `src` media nên ngoài phạm vi; nếu tương lai layer
   mang asset riêng thì cần quét thêm.
8. **Không push, không ghi paths-loop, không ghi build-loop-log** trong
   luồng này theo lệnh (parent lo phần stage/log).

## File đổi/thêm (để parent stage, KHÔNG push)

- `apps/web/src/lib/relink.ts` (sửa: quét + relink đệ quy, cycle guard)
- `apps/web/src/components/RelinkPanel.tsx` (sửa: hiển thị chain nested)
- `apps/web/src/lib/relinkNested.test.ts` (thêm: 13 test)
- `apps/web/tsconfig.json` (sửa: thêm test mới vào exclude)
- `docs/PHASE9_ROUND26_J2_NESTED_RELINK_LIMITS.md` (thêm: file này)

## Nợ / lưu ý cho parent

- Khi chạy tsc toàn app lúc luồng này kết thúc, còn 2 lỗi TS5097 ở
  `src/lib/holdFrame.test.ts` và `src/lib/projectRepoRound26J5.test.ts` —
  đó là file của các luồng song song đợt 26 khác, KHÔNG phải của J2, J2
  không đụng vào. Đừng tính 2 lỗi đó vào luồng này; mỗi luồng tự thêm
  file mình vào tsconfig exclude theo quy ước.
- Trong một lần chạy tsc giữa chừng, `src/lib/projectRepo.ts` từng báo lỗi
  thiếu field `speedCurveWarnings`, nhưng lần chạy sau đã hết — dấu hiệu
  một luồng khác đang sửa file đó cùng lúc; J2 không chạm projectRepo.ts.
- Build output `apps/web/dist/` chỉ là kết quả `vite build` kiểm chứng tại
  chỗ, KHÔNG đưa vào batch stage.
