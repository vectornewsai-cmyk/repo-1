# Phase 9 đợt 22 — Luồng A: LIMITS (toast clip-aware + i18n reason cổng hai tầng)

## 1. Đã làm (ngắn gọn)

- Store `notifyNestedSplitTrimRejection` (đường toast đúng thời điểm tách/trim
  nested, cả khi gọi từ Timeline chính) nay dùng dạng clip-aware
  `nestedSpeedRejectionMessageForClip` — toast nêu đúng lý do từng case:
  reverse / curveEmpty / curveShape / curveRange / curveIntegral / curveWindow,
  và ramp hợp lệ vẫn không bị từ chối (không toast).
- Panel `NestedClipPanel`: toast effect + dòng cảnh báo bền vững cũng sang dạng
  clip-aware; 2 điểm toast cổng hai tầng (tạo curve, áp curve) dịch reason
  cổng qua cầu nối i18n trước khi hiển thị.
- Store `patchClip` (nhánh G2) và `patchNestedCurveFixedTrim` (giữ-trim) nay
  dịch reason cổng hai tầng qua `translateTwoLevelReason` — locale en không
  còn lẫn đuôi tiếng Việt (đóng nợ T3 R3); locale vi giữ đúng từng ký tự
  chuỗi cổng cũ (test khóa bằng cách gọi cổng thật).
- Thêm 18 key i18n `nested.twoLevel*` đủ vi/en (10 nhánh cổng ngoài +
  8 nhánh cổng lá). Parity dict: vi-only [] / en-only [], nested 91/91.

## 2. Cách dịch reason cổng hai tầng — và giới hạn của nó

`nestUtils.ts` thuộc luồng B nên đợt này KHÔNG chạm file đó. Cổng
(`checkTwoLevelOuterCurve` / `checkTwoLevelLeafCurve`) vẫn trả reason là
chuỗi tiếng Việt hardcode; luồng A dịch ở tầng hiển thị bằng cầu nối
`translateTwoLevelReason` trong `nestedRejection.ts`: khớp mẫu tiền tố +
trích `{id}`/`{kind}` từ chuỗi, rồi tra key i18n.

Hệ quả trung thực:

- Cầu nối khớp theo wording HIỆN TẠI của cổng. Nếu luồng B đổi wording cổng
  mà không đổi mapper, nhánh đó rơi về fallback (trả nguyên reason gốc):
  không mất thông tin nhưng locale en lại lẫn tiếng Việt. Test đợt 22 A gọi
  cổng thật từng nhánh nên đổi wording sẽ làm test đỏ ngay, không lặng lẽ
  lệch — nhưng đó vẫn chỉ là lưới an toàn, không phải giải pháp bền.
- Giải pháp bền (đề xuất cho luồng B, chưa làm): cổng trả thêm `reasonCode`
  (enum) kèm reason; mapper tra code thay vì khớp chuỗi. Khi đó
  `translateTwoLevelReason` có thể bỏ dần các mẫu chuỗi.
- `nestedCurveCreate.ts` (không thuộc phạm vi luồng A) vẫn trả chuỗi tiếng
  Việt từ `nestedCurveCreateTwoLevelReason` — panel đã dịch tại điểm toast
  tạo curve, nhưng caller tương lai khác của hàm đó mà không qua mapper sẽ
  vẫn thấy tiếng Việt. Nợ này chỉ hết khi cổng có reasonCode hoặc hàm đó
  được chuyển sang trả key.

## 3. Những gì CHƯA xong / chưa nối

- Toast từ Timeline chính: ĐÃ nối gián tiếp qua store notify (Timeline gọi
  action store → notify đã clip-aware), không còn điểm toast tách/trim nào
  trong store dùng dạng fields-only. Điểm duy nhất còn dùng dạng fields-only
  là test hồi quy D15 của T3 (cố tình giữ để khóa hàm cũ).
- Nhánh cổng lá (`checkTwoLevelLeafCurve`): 8 reason đã dịch + test bằng cổng
  thật, nhưng hiện KHÔNG có caller nào toast reason cổng lá (grep: không có
  call site ngoài `nestUtils.ts`). Mapper là phòng trước cho caller tương lai
  (ví dụ đường sửa clip lá sâu), chưa có đường UI sống nào chứng minh
  end-to-end cho 8 nhánh này.
- Case `curveIntegral` ở tầng store toast: KHÔNG chứng minh được qua split
  (duration không hợp lệ phá hình học split trước khi tới notify) nên chỉ
  có bằng chứng ở tầng thuần ForClip (C5) + message dùng chung. Các case
  còn lại (empty/shape/range/window/reverse) đều có bằng chứng store toast
  (S1–S5).
- Wording đầu của key `nested.fixedTrimTwoLevel` vẫn nói "hợp curve hai tầng
  chưa được hỗ trợ (spec đợt 18 §5)" — đã lỗi thời dưới luật R1 đợt 21
  (cặp hợp lệ được cho qua). Đây là wording có sẵn từ T3, ngoài phạm vi
  luồng A nên KHÔNG sửa; cần một đợt riêng cập nhật câu đầu này (kèm test
  khóa wording R1/R2/R4 của T3).
- Panel không có DOM test runner: phần nối dây panel chỉ được kiểm chứng
  bằng tsc + vite build, không có test click/render panel. Store + hàm
  thuần thì có test số thật (§4).
- Test T3 S4 vẫn mang tên cũ "1 toast lý do chung" dù assertion của nó
  (chứa "[0.25, 4]" + câu fix) vẫn pass trên message chi tiết mới — tên test
  lỗi thời về mặt mô tả, không đổi để giảm diff; S6 đã được cập nhật tên
  + assertion sang lý do chi tiết (xem §5).

## 4. Số đo thật (không bịa)

- Test mới `store.nestedToast22A.test.ts`: 38 pass, 0 fail
  (C: 8 case clip-aware vi+en; T: 18 nhánh cổng gọi cổng thật + fallback +
  parity key; S: 6 case store split toast; G: 4 case G2/giữ-trim hai locale).
- Test hồi quy `store.nestedRejection21T3.test.ts`: 31 pass, 0 fail
  (sau khi cập nhật S6, xem §5).
- Parity dict vi/en bằng script Python: vi-only [], en-only [],
  key `nested` 91/91 (73 cũ + 18 mới).
- `tsc --noEmit` trên file của luồng A: sạch. Toàn repo vẫn còn 2 lỗi
  TS5097 từ `src/lib/probe22.tmp.ts` và `src/lib/probe22spec.tmp.ts` —
  file tạm của luồng song song khác trong đợt 22, KHÔNG thuộc luồng A và
  không bị chạm/xóa; vì vậy `npm run build` (tsc && vite build) toàn repo
  hiện vẫn đỏ ở bước tsc cho tới khi luồng đó dọn file tạm.
- `vite build` chạy riêng (bỏ qua tsc): pass, built in 4.54s
  (dist chỉ là output kiểm chứng local, KHÔNG đưa vào batch).
- Không push GitHub, không tag/release, không binary trong batch.

## 5. Thay đổi ngoài phạm vi liệt kê — và lý do

- `store.nestedRejection21T3.test.ts` (S6 + dòng mô tả S6 trong header):
  assertion cũ khóa hành vi "toast store nêu lý do chung" — chính hành vi
  mà nhiệm vụ đợt 22 A yêu cầu thay bằng lý do chi tiết, và header T3 đã
  ghi rõ lý do chung chỉ tồn tại "cho tới khi store được nối dây". Nay
  store đã nối dây nên giữ assertion cũ đồng nghĩa với khóa hành vi sai;
  S6 được cập nhật sang "cửa sổ trim lệch" (đúng message mới). Không đổi
  logic sản phẩm nào trong file này.
- Không chạm: `nestUtils.ts` (luồng B), `preview.tsx`/`Timeline.tsx`
  (luồng C), `packages/video-spec` (luồng E), mọi file `dist/`.

## 6. File đã đổi (chính xác)

1. `apps/web/src/store.ts` — import + notify clip-aware + dịch reason G2
   và giữ-trim (3 điểm + 2 comment).
2. `apps/web/src/components/nested/NestedClipPanel.tsx` — import + toast
   effect + dòng cảnh báo + 2 điểm toast hai tầng (create/apply).
3. `apps/web/src/components/nested/nestedRejection.ts` — mapper
   `translateTwoLevelReason` + cập nhật header "HAI DẠNG GỌI".
4. `apps/web/src/i18n/vi.json` — 18 key `nested.twoLevel*`.
5. `apps/web/src/i18n/en.json` — 18 key `nested.twoLevel*`.
6. `apps/web/src/store.nestedToast22A.test.ts` — mới, 38 test.
7. `apps/web/src/store.nestedRejection21T3.test.ts` — chỉ S6 + mô tả S6
   (lý do §5).
8. `docs/PHASE9_ROUND22_A_TOAST_I18N_LIMITS.md` — file này.
