# Phase 9 đợt 26, luồng J1 — Fail-soft preview cho nested curve vi phạm — LIMITS

Ngày: 2026-10-30. Đóng phát hiện đợt 25 I6 §5a: project chứa nested
curve vi phạm (keyframe v=5, ngoài [0.25, 4]) làm `buildPreviewSpec` →
`resolveNestedRampCurve` ném uncaught đúng 1 lần lúc load (UI sau đó vẫn
sống). KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG
stage batch (parent lo).

## 1. Đã làm gì

- `apps/web/src/lib/nestedPreview.ts`: thêm `buildPreviewSpecFailsoft`
  (không sửa `flattenForPreview`, `resolveNestedRampCurve`,
  `buildPreviewSpec` — xem §2):
  - Đường nhanh: `buildPreviewSpec` toàn spec thành công → trả nguyên
    spec đó, warnings rỗng.
  - Đường chậm (chỉ khi đường nhanh throw): cô lập từng nested tầng
    ngoài, flatten riêng từng cái. Nested lành giữ nguyên ramp đúng.
    Nested lỗi được thử lại sau khi sanitize curve trong cây con của nó
    về tuyến tính 1× (pass 1: chỉ thay curve mà
    `resolveNestedRampCurve` từ chối; pass 2 "force-all": thay mọi
    curve trong cây con bằng 1×, dùng khi lỗi nằm ở tích hợp hai tầng
    chứ không ở một curve đơn lẻ). Vẫn throw thì nested đó bị bỏ khỏi
    preview, các nested khác vẫn hiện.
  - Mỗi lần fallback/dropped sinh một `PreviewFailsoftWarning`
    `{ nestedId, reason, fallback }`: `nestedId` là nested tầng ngoài
    chứa lỗi; `reason` là thông điệp lỗi gốc (nêu đúng tên nested vi
    phạm ở tầng sâu + luật, ví dụ `nested "MID-CURVINV":
    speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)`).
  - Khi thay curve mà node có `trim`, chuyển `trim.in` thành `in` rồi
    bỏ `trim` (giữ `trim.out` cũ sẽ khiến `normalizeNestedClip` throw
    vì out cũ = in + ∫curve cũ không còn khớp in + duration × 1).
  - Spec gốc không bị sửa: sanitize chạy trên bản clone của nested lỗi.
- `apps/web/src/preview.tsx`: vòng lặp preview dùng
  `buildPreviewSpecFailsoft` thay cho `buildPreviewSpec` thuần.
  Warning tới user bằng HAI kênh thật, không chỉ log console:
  - Badge thường trực góc dưới-trái (`preview-curve-warn-badge`):
    `⚠ Curve: N nested về 1×` (hoặc `N nested lỗi (M bị ẩn)` khi có
    dropped); hover đọc đủ tên nested + lý do + cách xử lý.
  - Toast error 1 lần mỗi khi tập warning đổi (dedupe bằng key
    nestedId|fallback|reason, tránh spam mỗi frame rAF).
  - Guard cuối: lỗi ngoài phạm vi nested-curve (failsoft ném lại lỗi
    gốc) thì hiện spec gốc + toast, vòng lặp vẫn sống.
- `apps/web/tsconfig.json`: thêm file test mới vào exclude list, theo
  đúng quy ước của mọi file `*.test.ts` khác (import đuôi `.ts` cho
  node strip-types gây TS5097 khi không exclude).
- Test mới `apps/web/src/lib/nestedPreviewFailsoft26J1.test.ts` (6 test,
  xem §4).

## 2. Không đổi ngữ nghĩa throw của hàm thuần — cam kết rõ

`flattenForPreview`, `resolveNestedRampCurve`, `buildPreviewSpec` vẫn
throw y như cũ với curve vi phạm (khóa bằng test hồi quy số 6 + các
test flatten throw cũ vẫn xanh). Fail-soft chỉ tồn tại ở tầng preview
(wrapper + caller). Bất kỳ code nào khác gọi hàm thuần (parity test,
render, tool) đều không bị thay đổi hành vi lặng lẽ.

## 3. Giới hạn trung thực — đọc trước khi coi đây là "đã sửa xong"

1. **Fallback làm preview KHÁC render — đây là chủ ý, không phải
   parity.** Preview của nested lỗi chạy ở 1× (hoặc bị ẩn nếu dropped)
   trong khi render vẫn fail-fast theo luật render (đợt 18 §5, đợt 20
   R1) và từ chối export project đó. User PHẢI sửa curve thật mới
   export được; badge + toast đều nói rõ điều này. Đừng claim preview
   1× là "đúng" — nó chỉ là "không chết".
2. **Export KHÔNG được chặn mềm thêm ở đây.** Luồng này chỉ sửa preview
   hot path theo đúng brief. Câu hỏi "render/export có cần chặn ở
   export không" — trả lời: render đã fail-fast sẵn rồi, không cần
   thêm chặn mềm; việc còn lại là UI export nên báo lỗi render rõ ràng
   (nợ ngoài phạm vi luồng này, chưa làm).
3. **Dropped là đường cuối, không phải đường thường.** Một nested chỉ
   bị dropped khi cả hai pass sanitize vẫn throw — tức lỗi không còn
   nằm ở curve (ví dụ opacity ngoài [0, 1], subSpec layer không hợp lệ
   trong nested đó). Khi đó preview thiếu hẳn nested đó; warning ghi
   `fallback: "dropped"` và badge đếm riêng số bị ẩn.
4. **Fail-soft chỉ bao lỗi của nested tầng ngoài.** Lỗi layer chuẩn cấp
   project hoặc spec không có nested mà vẫn throw thì wrapper ném lại
   lỗi gốc; preview.tsx guard cuối hiện spec gốc (nested có thể không
   hiển thị). Lỗi curve của clip phẳng tầng ngoài (không nằm trong
   nested) không đi qua flatten nên không thuộc phạm vi này.
5. **Track phẳng trong mode failsoft lấy từ spec đã lược nested.**
   Trong mode này, cặp biên (boundary transition) giữa một clip phẳng
   và một nested có thể resolve khác đôi chút so với spec đầy đủ
   (vì nested đã bị lược khỏi track khi tính track phẳng). Trường hợp
   thường gặp (nested nằm riêng track) không ảnh hưởng.
6. **Cặp biên giữa hai nested trên cùng track** cũng tính trên spec cô
   lập (nested còn lại bị lược), nên ctx biên của nested trong mode
   failsoft có thể khác spec đầy đủ trong trường hợp hiếm này.
7. **Chi phí đường chậm:** khi có lỗi, mỗi nested được flatten riêng
   (O(số nested) lần flatten) cộng thêm tối đa 2 lần thử sanitize cho
   nested lỗi. Chỉ xảy ra khi project đã vi phạm; project lành đi đường
   nhanh không tốn thêm gì. Vòng lặp vẫn gọi failsoft mỗi frame nhưng
   đường nhanh trả ngay sau một lần `buildPreviewSpec` như cũ.
8. **Chưa kiểm chứng bằng click-test browser thật.** Badge + toast mới
   chỉ được kiểm chứng ở mức unit (warning có cấu trúc đúng) và build;
   chưa có phiên browser thật nào mở project vi phạm để nhìn badge/toast
   bằng mắt — nợ này thuộc về luồng click-test, không claim đã nhìn thấy.

## 4. Kiểm chứng (số thật, chạy ngày 2026-10-30)

- Test mới `nestedPreviewFailsoft26J1.test.ts`: **6/6 pass**
  (node --experimental-strip-types):
  1. nested v=5 không ném ở failsoft, lá giữ lại ở 1× (start 10,
     duration 4, in 0, out 4), spec gốc vẫn còn v=5;
  2. nested lành giữ ramp 1→2, warnings rỗng, spec bằng đường nhanh;
  3. lỗi tầng sâu MID-CURVINV v=5 trong TOP-CURVINV: warning
     nestedId TOP-CURVINV, reason chứa MID-CURVINV + 0.25..4;
  4. trộn lành + lỗi: chỉ BAD có warning, GOOD giữ ramp;
  5. hợp hai tầng vượt ngưỡng (lá 2× dưới nested hằng 4× → 8):
     force-all về 1×, không dropped, reason chứa "hợp hai tầng";
  6. hồi quy: `resolveNestedRampCurve`, `flattenForPreview`,
     `buildPreviewSpec` thuần đều vẫn throw với v=5; spec không nested
     trả đúng object cũ, warnings rỗng.
- Hồi quy liên quan (cùng lệnh strip-types):
  `nestedPreview.test.ts` 46 pass, `nestedPreviewR3.test.ts` 21 pass,
  `nestedRampPreview.test.ts` 34 pass, `nestedUnify.test.ts` 12 PROVEN
  pass (+ PENDING nợ R6 cũ, không tính), `previewEngine.test.ts`
  14 pass.
- `npx tsc --noEmit` (apps/web): **0 lỗi thuộc luồng J1**. Toàn repo
  còn đúng 1 lỗi `TS5097` ở `src/lib/projectRepoRound26J5.test.ts`
  (file của luồng J5 đang chạy song song, không thuộc J1, không sửa).
- `npx vite build`: **pass** (built in ~12s; cảnh báo chunk > 500 kB
  cũ, không liên quan).

## 5. Nợ còn lại

- Click-test browser thật cho badge + toast trên project vi phạm
  (xem §3.8).
- Thông điệp lỗi export khi render fail-fast với curve vi phạm: hiện
  render đã từ chối, nhưng UI export chưa chắc báo rõ — ngoài phạm vi
  luồng này.
- `projectRepoRound26J5.test.ts` lỗi tsc TS5097: của luồng J5, để
  luồng đó tự xử (ghi nhận để parent khỏi tưởng là nợ của J1).
