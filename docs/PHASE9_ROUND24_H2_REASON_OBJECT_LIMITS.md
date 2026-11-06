# Phase 9 đợt 24 luồng H2 — Xóa mapper khớp chuỗi + hàm sâu trả check object — LIMITS

Ngày: 2026-10-30 (lượt cron 08:03). KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG dist. Parent lo stage batch — luồng này chỉ sửa
file trên đĩa và báo danh sách file (không tự ghi file paths).

## 0. Bối cảnh: đóng 2 nợ của docs/PHASE9_ROUND23_LIMITS.md §4

- (a) Mapper khớp chuỗi chưa xóa được vì đường tạo curve trong panel
  vẫn qua `nestedCurveCreateTwoLevelReason` (chỉ trả chuỗi).
- (b) Hàm thuần sâu `updateNestedDeepInnerClip` vẫn ép check thành
  chuỗi có tiền tố cố định; store G2 tách reason bằng tiền tố (đổi
  wording sẽ làm test G2 đỏ).

Cả hai đã đóng trong đợt này (xem §1). Không đụng i18n (không thêm/
bớt key), không đụng render/preview/spec.

## 1. Việc đã làm

### (a) Đường tạo curve trả check nguyên, panel dịch theo code

- `apps/web/src/components/nested/nestedCurveCreate.ts`:
  - Mới: `nestedCurveCreateTwoLevelCheck(clip)` — trả nguyên
    `TwoLevelCheck` của guard store (`checkTwoLevelOuterCurve` với
    preset hằng 1×), null khi cặp hợp lệ / cây con không có curve.
  - `nestedCurveCreateBlock` nay kiểm tra bằng check (không qua chuỗi).
  - `nestedCurveCreateTwoLevelMessage` nay dịch từ check nguyên qua
    `translateTwoLevelCheck` (theo reasonCode).
  - `nestedCurveCreateTwoLevelReason` giữ lại nhưng đánh dấu
    `@deprecated`, chỉ còn test hồi quy T4 dùng (khóa wording reason).
    KHÔNG caller sống nào dùng nó nữa (grep §3).
- `apps/web/src/components/nested/NestedClipPanel.tsx`: chỉ sửa comment
  (đường tạo curve nay cũng dịch theo reasonCode); logic panel không
  đổi — đường tạo đi qua message helper đã chuyển, đường áp trực tiếp
  vốn đã dùng `translateTwoLevelCheck` từ đợt 23 G1.

### (b) Hàm sâu trả kèm check object, store không tách tiền tố nữa

- `apps/web/src/components/nested/nestUtils.ts`:
  - `updateNestedDeepInnerClip` — nhánh cổng lá nay trả
    `{ error, twoLevelCheck: check }` (kiểu error thêm field optional
    `twoLevelCheck?: TwoLevelCheck`; các nhánh lỗi khác không đổi).
  - Format chuỗi error đổi có chủ đích: cũ
    `Không tạo được trạng thái hai tầng: <reason>`, mới
    `Không tạo được trạng thái hai tầng [<reasonCode>]: <reason>`.
    Chuỗi này nay CHỈ là thông báo hiển thị cho caller trực tiếp;
    caller KHÔNG được tách reason khỏi nó — dùng `twoLevelCheck`.
    Đổi format là cố tình để test G2 thành bằng chứng phân biệt: tiền
    tố cũ `…hai tầng: ` (startsWith) không còn khớp, nên G2 vẫn xanh
    CHỈ khi store đi đường check object (xem §2).
- `apps/web/src/store.ts`:
  - Action `updateNestedDeepInnerClip` bỏ toàn bộ khối tách tiền tố
    (`LEAF_GATE_PREFIX` + `startsWith` + `slice` đã xóa); nhánh cổng
    lá nhận diện bằng `res.twoLevelCheck`, dịch bằng
    `translateTwoLevelCheck`, reasonKey bằng `twoLevelReasonCodeKey`
    (mới, §1c). Không có check (lỗi không phải cổng lá) thì giữ hành
    vi cũ: ok:false, không reason, không toast. Vẫn không qua
    execCommand khi bị chặn → không đổi spec, không sinh undo.
  - Comment interface của action cập nhật theo (hợp đồng tiền tố G2
    ghi rõ là đã chết).

### (c) Xóa mapper khớp chuỗi

- `apps/web/src/components/nested/nestedRejection.ts`:
  - ĐÃ XÓA: `TWO_LEVEL_PATTERNS` (18 mẫu regex), `translateTwoLevelReason`,
    `twoLevelReasonKey`. Không còn caller sống nào (grep §3; chỉ còn
    1 câu comment lịch sử trong NestedClipPanel nhắc tên hàm cũ ở thì
    quá khứ đợt 22 A, và comment H2 mới ghi rõ cả hai đường đã chuyển).
  - Mới: `twoLevelReasonCodeKey(code)` — key i18n của một reasonCode
    (dùng chung bảng `TWO_LEVEL_CODE_TO_KEY`), null cho code vắng/lạ/
    "valid". Store dùng nó thay cho `twoLevelReasonKey`.
  - `translateTwoLevelCheck` nay: code trước; check không code / code
    lạ thì fallback TRẢ NGUYÊN reason gốc (không dịch sai, không rò
    key thô). Đây là thay đổi hành vi có chủ đích so với đợt 23 G1:
    trước đây code lạ còn được dịch qua wording bằng mapper; nay mất
    code thì locale en sẽ giữ nguyên chuỗi gốc — đó là tín hiệu để
    caller gắn code, không phải lỗi (mọi caller sống đều đã có code).
    Test G1 C1/C2 và 22A T19 khóa đúng hành vi mới này.

### (d) Test cập nhật có chủ đích + test mới

- `store.nestedToast22A.test.ts` (22A): section T chuyển từ mapper
  sang check object — helper `checkTwoLevelBranch` nay nhận
  `TwoLevelCheckLike` và dịch bằng `translateTwoLevelCheck`; 18 call
  site T1–T18 bỏ `.reason` để truyền check nguyên; T19 thành
  "check không code trả nguyên" (chuỗi khớp mẫu cũ vẫn không dịch).
  Các section C/S/G không đổi.
- `store.nestedReasonCode23G1.test.ts` (G1): bỏ import mapper; B1
  thành "check mất code → fallback nguyên chuỗi"; C1/C2 thành hành
  vi mới (không dịch qua wording nữa); header comment cập nhật.
  Các section A/D/E không đổi.
- Mới: `store.nestedReasonObject24H2.test.ts` — 10 test chứng minh:
  A. tạo curve trả check nguyên (leafReverse + vars), cặp hợp lệ →
  null, message vi/en đúng (en không rò tiếng Việt);
  B. hàm sâu trả kèm `twoLevelCheck` (leafSelfReverse) và chuỗi error
  KHÔNG còn khớp tiền tố cũ;
  C. store qua check object: reasonKey = ánh xạ từ code của check
  thuần cùng fixture, toast = reason, spec không đổi, 0 undo (vi+en);
  D. mapper đã xóa: check không code khớp mẫu cũ vẫn trả nguyên ở
  en; `twoLevelReasonCodeKey` đúng/null đúng chỗ.
- Không đổi: `store.nestedCurve21T4.test.ts` (vẫn dùng hàm reason
  deprecated, 11 pass), `nestedCurveG2.test.ts`, `nestedDeepSpeed*`
  (caller thuần khác của hàm sâu — chỉ dùng nhánh ok/error thường).

## 2. Kiểm chứng thật (chạy trong đợt này)

- tsc apps/web: file H2 sạch lỗi. LƯU Ý: toàn repo còn 1 lỗi tsc
  KHÔNG phải của luồng này — `nestedSplitTau24.test.ts(39,35)
  TS5097` (file test mới của luồng split-tau đợt 24 đang chạy song
  song, import `.ts` khi chưa bật allowImportingTsExtensions). Lần
  chạy tsc đầu đợt còn thấy 1 lỗi thoáng qua ở `nestUtils.ts:995`
  (comment nhắc tên integrateSpeed) rồi tự hết ở lần chạy sau — đó
  là trạng thái file đang được luồng khác sửa dở, không phải lỗi
  của H2. H2 KHÔNG sửa file đó; parent gộp cần chờ luồng split-tau
  xong mới chốt tsc toàn repo.
- vite build (không qua tsc): pass, 4,74 s (chỉ warning chunk cũ).
- Test (esbuild bundle + node, số thật):
  - G1 `store.nestedReasonCode23G1`: 29/29.
  - G2 `store.nestedLeafGate23G2`: 24/24 — gồm 8 nhánh cổng lá qua
    store thật; xanh dù format error đã đổi nên đây là bằng chứng
    store không còn tách tiền tố.
  - 22A `store.nestedToast22A`: 38/38.
  - T3 `store.nestedRejection21T3`: 31/31.
  - T4 `store.nestedCurve21T4`: 11 pass.
  - H2 mới `store.nestedReasonObject24H2`: 10/10.
  - Hồi quy caller hàm sâu: `nestedCurveG2` 18 pass,
    `nestedDeepSpeed` 16 pass, `nestedDeepSpeed.store` 8 pass.
- i18n parity: H2 không đụng file i18n nào. Quét flatten toàn dict:
  vi 811 / en 811, vi-only [], en-only [], key twoLevel* 18/18 đủ
  hai bên. (811 khác 809 của đợt 23 — tăng 2 key do luồng đợt 24
  khác thêm, không phải H2.)

## 3. Mapper còn hay đã xóa — kết luận

- ĐÃ XÓA HOÀN TOÀN khỏi code sống: `translateTwoLevelReason`,
  `twoLevelReasonKey`, `TWO_LEVEL_PATTERNS` không còn tồn tại
  (grep toàn `apps/web/src` trừ test: chỉ còn `translateTwoLevelReasonByCode`
  — hàm khác, dịch theo code — và 1 câu comment lịch sử trong
  NestedClipPanel).
- Caller nào còn dùng chuỗi: KHÔNG còn caller sống nào dùng chuỗi
  reason làm kênh nhận diện nhánh. Chuỗi reason vẫn tồn tại trong
  field `reason` của check (để hiển thị/fallback), và hàm
  `nestedCurveCreateTwoLevelReason` còn tồn tại ở dạng deprecated
  chỉ phục vụ test T4 — nếu parent muốn xóa nốt thì phải sửa T4
  trước (bỏ 2 assertion dùng hàm đó), H2 cố tình giữ để không vỡ
  hồi quy ngoài phạm vi.
- Fallback còn lại (trung thực): check không code / code lạ →
  `translateTwoLevelCheck` trả nguyên reason gốc. Ở locale en,
  đường nào quên gắn code sẽ lộ tiếng Việt thay vì được mapper cứu
  — đó là thiết kế (fail-visible), không phải bug, nhưng là giới
  hạn cần biết khi thêm nhánh cổng mới: nhánh mới PHẢI có code
  trong `TwoLevelReasonCode` + key trong `TWO_LEVEL_CODE_TO_KEY`,
  nếu không bản dịch en của nhánh đó sẽ là chuỗi Việt gốc.

## 4. Những gì CHƯA xong / nợ còn lại

- Lỗi tsc của luồng split-tau đợt 24 (`nestedSplitTau24.test.ts`
  TS5097) chưa thuộc H2 — parent chờ luồng đó sửa, không gộp đè.
- `nestedCurveCreateTwoLevelReason` deprecated còn tồn tại vì test
  T4; xóa nốt cần sửa T4 (ngoài phạm vi H2, ghi rõ để parent quyết).
- `nestedSplitOffset` tuyến tính-only, lá sâu hơn 1 tầng chưa có nút
  panel, fadeblack parity, quy tắc crf YUV — các nợ đợt 23 §4 còn
  lại, H2 không đụng tới.
- Ba tầng 1→2 đều nhau vẫn không hợp được (giới hạn định dạng từ R1);
  attachment thời gian dưới ramp vẫn fail-fast cả preview lẫn render.

## 5. File đã đổi/thêm (tương đối từ repo root — parent lo stage)

Đổi:
- apps/web/src/components/nested/nestedRejection.ts
- apps/web/src/components/nested/nestedCurveCreate.ts
- apps/web/src/components/nested/nestUtils.ts
- apps/web/src/store.ts
- apps/web/src/components/nested/NestedClipPanel.tsx (chỉ comment)
- apps/web/src/store.nestedToast22A.test.ts
- apps/web/src/store.nestedReasonCode23G1.test.ts
Thêm:
- apps/web/src/store.nestedReasonObject24H2.test.ts
- docs/PHASE9_ROUND24_H2_REASON_OBJECT_LIMITS.md (file này)

Không đổi: i18n (vi/en), render, preview, spec, binary nào.
File chung cũng được luồng khác chạm (đặc biệt nestUtils.ts,
store.ts, NestedClipPanel.tsx đang có luồng đợt 24 khác sửa song
song): parent gộp phải đối chiếu từng hunk H2 dưới đây, tránh ghi đè:
- nestUtils.ts: CHỈ đổi signature trả về + nhánh cổng lá của
  `updateNestedDeepInnerClip` (kèm comment H2); mọi hunk khác của
  file này không phải H2.
- store.ts: CHỈ đổi import nestedRejection (bỏ mapper/key cũ, thêm
  twoLevelReasonCodeKey), comment interface updateNestedDeepInnerClip,
  và khối xử lý error trong action updateNestedDeepInnerClip.
- NestedClipPanel.tsx: CHỈ đổi 1 đoạn comment (đường tạo curve H2);
  mọi hunk khác không phải H2.
- nestedRejection.ts / nestedCurveCreate.ts: toàn bộ diff là H2
  (không luồng nào khác được ghi nhận chạm 2 file này trong đợt).
