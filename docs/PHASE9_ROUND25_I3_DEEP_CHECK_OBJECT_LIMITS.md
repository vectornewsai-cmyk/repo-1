# Phase 9 đợt 25 luồng I3 — Panel lá sâu sang check object + xóa hàm deprecated + action vị trí nested trung gian sâu — LIMITS

Ngày: 2026-10-30 (lượt cron 14:03). KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG dist, KHÔNG code giả. Parent lo stage batch —
luồng này chỉ sửa file trên đĩa và báo danh sách file (không tự ghi
file paths). Đóng 3 nợ của docs/PHASE9_ROUND24_LIMITS.md §4:
(a) panel lá sâu chuyển từ `res.reason` sang check object/reasonKey
của H2; (b) xóa `nestedCurveCreateTwoLevelReason` deprecated sau khi
sửa T4; (c) sửa vị trí nested trung gian tầng sâu qua panel (cần
action store mới vì deep action cũ từ chối clip đích là nested).

## 0. Xác minh tương thích trước khi sửa (không đoán)

- Store sau H2 vẫn trả `reason` + `reasonKey` ở action
  `updateNestedDeepInnerClip` (store.ts, nhánh cổng lá: reason là câu
  bọc `nested.deepLeafTwoLevel` đã dịch gồm tên top + lý do nhánh,
  reasonKey từ `twoLevelReasonCodeKey(check.reasonCode)`), nhưng
  KHÔNG trả check nguyên — panel trước đợt này chỉ cầm được chuỗi
  reason. Vì vậy I3 thêm `twoLevelCheck` vào kiểu trả về của action
  đó (cộng thêm, không bớt field nào) rồi panel mới chuyển sang
  check object được mà không vỡ caller cũ hay test H6/G2.
- Grep toàn `apps/web/src` trước khi xóa: hàm deprecated chỉ còn
  đúng 1 caller sống là test T4 (definition + T4); không test cũ nào
  khác phụ thuộc nó. Mapper khớp chuỗi đã xóa từ H2 nên không còn
  đường nào tách chuỗi trong luồng này.

## 1. Việc đã làm

### (a) Panel lá sâu dùng check object

- `apps/web/src/store.ts` — action `updateNestedDeepInnerClip`:
  kiểu trả về thêm `twoLevelCheck?: TwoLevelCheck`; nhánh cổng lá
  trả kèm `twoLevelCheck: res.twoLevelCheck` nguyên. `reason` và
  `reasonKey` giữ nguyên từng giá trị (tương thích: test H6 khóa
  cặp này vẫn xanh, xem §2). Không đổi ngữ nghĩa check object của
  H2, không đổi toast, không đổi luật chặn, không đổi undo.
- `apps/web/src/components/nested/NestedClipPanel.tsx` —
  `InnerClipEditor.setLeafCurve` (nút "Đặt curve 1× cho lá", cả lá
  trực tiếp lẫn lá sâu qua `DeepInnerLevel` vì cùng component này):
  khi bị chặn mà có `res.twoLevelCheck` thì panel dịch lại theo
  reasonCode tại thời điểm hiển thị
  (`translateTwoLevelCheck(i18nT, res.twoLevelCheck)`) rồi ráp
  đúng câu bọc `nested.deepLeafTwoLevel` mà store dùng cho toast
  (cùng key, cùng tên top tra từ spec, cùng bản dịch) nên dòng msg
  bền vững giữ nguyên nội dung như trước — chỉ đổi kênh nhận diện
  nhánh từ chuỗi sang check object. `reasonKey` đi kèm check để
  caller cần nhận diện nhánh dùng key; panel KHÔNG render key thô
  ra UI (render key là rò i18n, tệ hơn chuỗi).
- Fallback còn lại (trung thực): lỗi KHÔNG phải cổng lá (không tìm
  thấy, track khóa, guard nguồn cha) thì store không trả check —
  panel giữ `res.reason` trả về làm msg, và KHÔNG tách nhánh nào
  khỏi chuỗi đó (chỉ hiển thị nguyên). Đây là fallback hiển thị,
  không phải kênh nhận diện: mọi nhánh cổng hai tầng đều có check.

### (b) Sửa T4 sang API check, xóa hàm deprecated

- `apps/web/src/store.nestedCurve21T4.test.ts` (P2): bỏ import hàm
  deprecated, dùng `nestedCurveCreateTwoLevelCheck` — cặp hợp lệ →
  check null; lá reverse → check khác null, `reasonCode` đúng
  `"leafReverse"`, reason trong check khác rỗng và nói reverse.
  Số test giữ nguyên 11 (chỉ đổi assertion, không bớt case).
- `apps/web/src/components/nested/nestedCurveCreate.ts`: ĐÃ XÓA
  `nestedCurveCreateTwoLevelReason` (cả docblock `@deprecated`).
  Grep sau xóa trên toàn `apps/web/src`: 0 tham chiếu sống (grep
  exit 1). Tên hàm chỉ còn xuất hiện trong 6 file LIMITS/docs lịch
  sử đợt 22–24 (ghi rõ là nhắc lịch sử, không phải code sống):
  PHASE9_ROUND22_A_TOAST_I18N_LIMITS.md,
  PHASE9_ROUND23_G1_REASONCODE_LIMITS.md,
  PHASE9_ROUND23_G2_LEAF_GATE_UI_LIMITS.md, PHASE9_ROUND23_LIMITS.md,
  PHASE9_ROUND24_H2_REASON_OBJECT_LIMITS.md, PHASE9_ROUND24_LIMITS.md.
- Không test cũ nào khác phụ thuộc hàm này (đã grep toàn src trước
  và sau khi xóa) nên không có xóa bừa ngoài T4.

### (c) Action mới sửa vị trí nested trung gian sâu

- `apps/web/src/components/nested/nestUtils.ts` — hàm thuần mới
  `updateNestedDeepIntermediateClip(spec, hostTrackId, topId,
  parentChainIds, innerTrackId, innerClipId, patch)` +
  `NestedDeepIntermediatePatch { start?, duration? }`:
  - Địa chỉ: `parentChainIds` là chain tới tầng CHỨA TRỰC TIẾP
    đích (cùng quy ước hàm lá sâu, nhưng không bao gồm đích):
    đích trực tiếp trong top → `[]`; đích trong N1 → `["N1"]`;
    đích trong N2 của N1 → `["N1", "N2"]`. Đích không phải nested
    → error (lá dùng action lá sâu, tránh hai đường sửa lá lệch
    nhau).
  - Kiểm tra theo thứ tự: host khóa / top không phải nested /
    chain sai (id sai, vòng lặp subSpec, sâu > 8 qua
    `resolveDeepLevels`) → error thường; hình học (start ≥ 0,
    duration ≥ 0.2, không vượt duration tầng chứa, không đè anh em
    cùng track); curve của chính đích đi theo hình học như lá tầng
    1 (`trimSpeedKeyframes` khi đổi không đều hai mép, dời thuần
    giữ nguyên, keyframe mồ côi bị cắt → `curveDropped`); cổng hai
    tầng `checkTwoLevelOuterCurve` cho cặp đích × cây con (chỉ khi
    đích mang curve VÀ cây con có curve — một tầng luôn cho qua);
    guard nguồn của tầng chứa trực tiếp (giống hàm lá sâu: có trim
    → nguồn mới không co dưới trim.out; không trim → nguồn không
    đổi). Ghi lại cây bằng `rebuildDeepLevels` có sẵn.
  - Trung thực về cổng hai tầng: đổi start/duration không đổi giá
    trị keyframe nên KHÔNG tự tạo ra vi phạm mới — cổng chặn đích
    vốn đã vi phạm sẵn (import/MCP/dựng tay) khỏi bị sửa trong trạng
    thái vi phạm, giống patchClip từ chối đặt curve lên cặp vi phạm.
    Các tầng tổ tiên trên tầng chứa không cần guard riêng vì clip
    của tầng chứa không đổi start/duration nên nguồn của chúng
    không đổi.
- `apps/web/src/store.ts` — action mới
  `updateNestedDeepIntermediateClip` (interface + implementation):
  bị chặn → ok:false TRƯỚC execCommand nên không đổi spec, không
  sinh undo. Cổng hai tầng trả thêm `twoLevelCheck` nguyên + reason
  đã dịch + reasonKey; lỗi khác giữ hành vi cũ (không reason, không
  toast). Cố tình KHÔNG tự toast ở action này để khỏi thêm key i18n
  mới trong đợt có nhiều luồng cùng chạm file i18n — panel hiển thị
  msg từ reason trả về (đủ nhánh, không cần key mới).
- `apps/web/src/components/nested/NestedClipPanel.tsx` — component
  mới `DeepIntermediateEditor` (start/duration + nút lưu, remount
  theo key start/duration như InnerClipEditor); `DeepInnerLevel`
  nay render editor này cho nested trung gian ở tầng sâu
  (chainIds ≥ 1, `parentChainIds = chainIds`) thay cho dòng ghi chú
  giới hạn `deepNestedEditNote` của H6. Key `deepNestedEditNote`
  còn trong i18n vi/en nhưng panel không dùng nữa (giữ key để khỏi
  đụng file i18n của luồng khác; xóa key là việc dọn riêng, không
  làm trong đợt này). Nested trung gian ở tầng trực tiếp của top
  vẫn giữ `InnerClipEditor` tầng 1 như cũ.

## 2. Kiểm chứng thật (chạy trong đợt này)

- tsc `apps/web`: file I3 sạch lỗi. LƯU Ý: toàn repo còn 3 lỗi tsc
  KHÔNG phải của luồng này — đều ở
  `store.nestedSplitOffset25I2.test.ts:313` (file test mới của luồng
  split-offset đợt 25 đang chạy song song: `tracks` không tồn tại
  trên `{}` + 2 tham số any ngầm). I3 KHÔNG sửa file đó; parent gộp
  cần chờ luồng đó sửa mới chốt tsc toàn repo.
- vite build (apps/web): pass ở lần chạy lại, 13,38 s, chỉ warning
  chunk-size cũ (bundle `index-Bx23Gx7-.js`). Lần chạy đầu chết ở
  bước dọn `dist/` (rmSync) — nhiều khả năng race với luồng song
  song cùng build; chạy lại ngay sau đó pass, không sửa code nào
  giữa hai lần chạy nên đây là race môi trường, không phải lỗi build
  của I3. `dist/` không stage.
- esbuild bundle riêng `NestedClipPanel.tsx` (platform browser):
  pass, exit 0.
- Test (esbuild bundle + node, số thật từng suite, không gộp):
  - T4 (sau sửa) `store.nestedCurve21T4`: 11 pass, 0 fail.
  - G1 `store.nestedReasonCode23G1`: 29 pass, 0 fail.
  - G2 `store.nestedLeafGate23G2`: 24 pass, 0 fail.
  - 22A `store.nestedToast22A`: 38 pass, 0 fail.
  - T3 `store.nestedRejection21T3`: 31 pass, 0 fail.
  - H2 `store.nestedReasonObject24H2`: 10 pass, 0 fail.
  - H6 `store.nestedDeepLeaf24H6`: 12 pass, 0 fail.
  - I3 mới `store.nestedDeepIntermediate25I3`: 9 pass, 0 fail
    (S1/S2/S3 + B1/B2/B3/B4 + B5-vi/B5-en — đếm: S1, S2, S3, B1, B2,
    B3, B4, B5-vi, B5-en = 9 test).
- Không đụng i18n (không thêm/bớt key) nên parity i18n không đổi;
  không đụng render/preview/spec. Không push, không chạy push-files,
  không ghi qua GitHub connector, không stage (parent gộp batch).

## 3. Những gì CHƯA xong / giới hạn (không mạo nhận)

- Chưa click-test browser thật cho `DeepIntermediateEditor` và nút
  lá sâu sau chuyển check object (repo không có DOM test runner
  cho panel; hành vi nút được khóa gián tiếp: nút gọi đúng hình
  action mà test store khóa, và dòng msg sau chuyển check được
  ráp từ cùng key + tên top + bản dịch như toast của store).
- Key i18n `nested.deepNestedEditNote` nay không còn caller UI nào
  (chỉ còn trong dict vi/en) — dọn key là việc riêng, chưa làm.
- Action mới chỉ sửa start/duration của trung gian sâu; đổi text
  (trung gian không phải lá chữ), đổi speed/curve của trung gian
  vẫn qua đường cũ (patchClip / chế độ curve), không thuộc action
  này. Track khóa ở tầng chứa sâu không có khái niệm khóa riêng
  (chỉ host ngoài được kiểm tra) — giống hàm lá sâu.
- Lỗi tsc của luồng split-offset đợt 25 (xem §2) chưa thuộc I3.
- Lần build đầu race dọn `dist/` (xem §2): nếu parent gộp chạy
  build song song với luồng khác thì có thể gặp lại — chạy lại
  đơn lẻ là pass.

## 4. File đổi/thêm (tương đối từ repo root — parent lo stage)

Đổi:
- apps/web/src/components/nested/nestUtils.ts — CHỈ thêm hàm thuần
  `updateNestedDeepIntermediateClip` + interface
  `NestedDeepIntermediatePatch` (đặt ngay sau
  `updateNestedDeepInnerClip`, trước `splitNestedDeepInnerClip`);
  mọi hunk khác của file này không phải I3.
- apps/web/src/store.ts — CHỈ: import hàm thuần + 2 type mới
  (dòng 131/135-136); interface action sâu cũ thêm `twoLevelCheck`
  (dòng 578) + interface action mới (dòng 587); nhánh cổng lá của
  action sâu cũ trả kèm check (dòng ~2346); action mới
  `updateNestedDeepIntermediateClip` (dòng 2367 trở đi). Mọi hunk
  khác của file này không phải I3 (file chung, nhiều luồng chạm).
- apps/web/src/components/nested/NestedClipPanel.tsx — CHỈ:
  `setLeafCurve` chuyển sang check object (dòng ~174); component
  mới `DeepIntermediateEditor` (dòng ~329); `DeepInnerLevel` dùng
  editor cho trung gian sâu thay cho ghi chú H6 (dòng ~409);
  comment header H6 + comment DeepInnerLevel/InnerClipEditor cập
  nhật theo. Mọi hunk khác không phải I3.
- apps/web/src/components/nested/nestedCurveCreate.ts — CHỈ xóa hàm
  `nestedCurveCreateTwoLevelReason` + docblock deprecated; không đổi
  hàm nào khác.
- apps/web/src/store.nestedCurve21T4.test.ts — CHỈ: import chuyển
  sang `nestedCurveCreateTwoLevelCheck`, assertion P2 chuyển sang
  check (reasonCode leafReverse), comment P2/header cập nhật theo.
Thêm:
- apps/web/src/store.nestedDeepIntermediate25I3.test.ts — test store
  mới 9 test (xem §1c/§2).
- docs/PHASE9_ROUND25_I3_DEEP_CHECK_OBJECT_LIMITS.md — file này.

Không đổi: i18n (vi/en), render, preview, spec, binary nào.
