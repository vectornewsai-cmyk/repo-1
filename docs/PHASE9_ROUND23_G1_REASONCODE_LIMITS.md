# Phase 9 đợt 23 — G1: cổng hai tầng trả reasonCode (LIMITS)

## 1. Vấn đề gốc (nợ đợt 22)

Đợt 22 A dịch reason cổng hai tầng bằng mapper khớp chuỗi
(`translateTwoLevelReason` trong
`apps/web/src/components/nested/nestedRejection.ts`): mỗi mẫu regex neo
đầu chuỗi tiếng Việt của cổng. Nếu luồng cổng đổi wording mà không đổi
mapper, nhánh đó rơi về fallback — trả nguyên chuỗi tiếng Việt gốc, nên
locale en lại lẫn tiếng Việt, lặng lẽ (chỉ test khóa wording của 22 A
mới đỏ, không có cơ chế nào bắt buộc hai bên đổi cùng nhau).

## 2. Việc đã làm (đợt 23 G1, cộng thêm, không phá tương thích)

### 2.1. Cổng trả thêm `reasonCode` + `reasonVars`

- `apps/web/src/components/nested/nestUtils.ts`:
  - Thêm kiểu `TwoLevelReasonCode` (18 code từ chối + `"valid"`) và
    `TwoLevelReasonVars` (`{id?, kind?}` + index signature).
  - `TwoLevelCheck` thêm `reasonCode` (luôn có, kể cả khi ok) và
    `reasonVars` (khi nhánh có id/kind). Trường `reason` giữ nguyên
    từng ký tự — không đổi logic chặn/cho qua, không đổi thứ tự kiểm
    tra, không đổi bất kỳ chuỗi reason nào (test 22 A khóa wording vẫn
    xanh nguyên vẹn).
  - Mọi nhánh từ chối của `checkTwoLevelOuterCurve` (10 code riêng biệt,
    `combinedRange` lặp ở 3 điểm lấy mẫu) và `checkTwoLevelLeafCurve`
    (8 code) đều gắn code; mọi đường cho qua đều trả `"valid"`.
  - Bảng code: `topReverse`, `outerInvalid`, `leafReverse`,
    `leafAttachment`, `leafCurveInvalid`, `combinedRange`,
    `keyframeProduct`, `nestedCurveInvalid`, `nestedKeyframeProduct`,
    `noSourceAxis`, `leafSelfReverse`, `leafNonMedia`,
    `leafSelfAttachment`, `leafSelfCurveInvalid`, `ancestorReverse`,
    `ancestorCurveInvalid`, `ancestorKeyframeProduct`,
    `ancestorCombinedRange`.

### 2.2. Dịch theo code trước, fallback về mapper chuỗi

- `apps/web/src/components/nested/nestedRejection.ts`:
  - `translateTwoLevelReasonByCode(translate, code, vars)`: tra bảng
    code → key `nested.twoLevel*`. Trả `null` (không bao giờ trả key
    thô hay chuỗi gốc) khi code vắng, là `"valid"`, lạ, hoặc key thiếu
    trong dict (hàm `t()` trả về chính key khi thiếu nên phải kiểm tra).
    Biến `undefined` được lọc trước khi đưa vào `t()`.
  - `translateTwoLevelCheck(translate, check)`: ưu tiên code, fallback
    về `translateTwoLevelReason` khi code vắng/lạ/key thiếu.
  - Không cần thêm key i18n mới: 18 key `nested.twoLevel*` đã đủ vi/en
    từ đợt 22 A. Kiểm parity dict: vi 805 key, en 805 key, vi-only [],
    en-only [], twoLevel 18/18 mỗi bên.
- Call site đã chuyển sang code trước:
  - `apps/web/src/store.ts`: patchClip G2 (mang nguyên check qua
    `NestedG2Info.conflict`, không còn chỉ giữ chuỗi reason) và
    `patchNestedCurveFixedTrim` (dùng trực tiếp check).
  - `apps/web/src/components/nested/NestedClipPanel.tsx`: đường áp
    curve trực tiếp (có check nguyên) dùng `translateTwoLevelCheck`.

### 2.3. Test mới

`apps/web/src/store.nestedReasonCode23G1.test.ts` — 29 test, xem §4.
Bằng chứng mapper cũ sẽ sai nằm ở nhóm B: cùng một check, đổi
`reason` thành wording hoàn toàn mới nhưng giữ `reasonCode` +
`reasonVars` → dịch theo code vẫn đúng vi+en, trong khi
`translateTwoLevelReason` trên chuỗi mới rơi về fallback nguyên chuỗi.

## 3. Phạm vi và giới hạn còn lại — đọc kỹ trước khi xóa mapper cũ

1. **Mapper khớp chuỗi CHƯA xóa, và chưa nên xóa trong đợt này.**
   - `translateTwoLevelReason` vẫn là fallback duy nhất cho mọi đường
     chỉ có chuỗi reason, không có check nguyên (xem §3.2), và cho
     code lạ từ tương lai. Xóa nó bây giờ sẽ làm các đường đó trả
     nguyên tiếng Việt hoặc rỗng. Chỉ xóa được khi mọi call site đều
     mang check nguyên (điều kiện ở §3.2 đã xong) và có một đợt riêng
     khóa lại bằng test.
2. **Đường tạo curve trong panel vẫn dùng mapper chuỗi (fallback).**
   - `NestedClipPanel` nhánh tạo curve dùng
     `nestedCurveCreateTwoLevelReason(clip)` trong
     `apps/web/src/components/nested/nestedCurveCreate.ts`, hàm này chỉ
     trả chuỗi `reason` (hoặc null), không trả check. Đợt này KHÔNG
     sửa file đó vì ngoài phạm vi surgical đã giao (chỉ store/panel
     call site + cổng + mapper). Muốn đường này cũng dịch theo code thì
     đợt sau phải đổi `nestedCurveCreateTwoLevelReason` trả check
     nguyên (hoặc thêm hàm song song trả check) rồi nối panel sang
     `translateTwoLevelCheck` — khi đó panel sẽ không còn call site
     nào dùng mapper chuỗi nữa.
3. **Code lạ từ cổng tương lai vẫn fallback về wording.**
   - Nếu cổng thêm nhánh mới mà chưa thêm code vào bảng
     `TWO_LEVEL_CODE_TO_KEY`, `translateTwoLevelReasonByCode` trả null
     và mapper chuỗi (nếu wording khớp mẫu cũ) hoặc giữ nguyên reason
     (nếu wording mới). Đây là hành vi cố tình: không mất thông tin,
     nhưng locale en có thể lẫn tiếng Việt cho tới khi bảng được cập
     nhật. Test nhóm E khóa đủ 18 code hiện tại, không khóa code tương
     lai — nhánh cổng mới bắt buộc phải thêm code + test nhánh đó.
4. **`reasonVars` chỉ có `id`/`kind`.**
   - 18 key i18n hiện tại chỉ dùng hai biến này nên đủ. Nếu key mới
     cần thêm biến (ví dụ ngưỡng số), phải mở rộng `TwoLevelReasonVars`
     ở cổng và bảng vars ở call site cùng lúc — không tự suy biến từ
     chuỗi reason.
5. **Không đụng render pipeline.**
   - Không sửa `packages/video-spec`, không sửa `preview.tsx`, không
     đổi điều kiện chặn/cho qua của cổng. Mọi thay đổi ở cổng chỉ là
     gắn thêm trường vào kết quả trả về.

## 4. Kết quả kiểm chứng thật (lệnh + số)

Chạy từ `~/workspace/repo-1` (esbuild bundle, mẫu test 22 A/T3):

| Bộ | Lệnh (rút gọn) | Kết quả |
| --- | --- | --- |
| Test mới G1 | `esbuild apps/web/src/store.nestedReasonCode23G1.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/store.nestedReasonCode23G1.test.cjs && node /tmp/...` | **29 pass, 0 fail** (A 19 + B 3 + C 4 + D 2 + E 1) |
| Hồi quy 22 A | `store.nestedToast22A.test.ts` (cùng mẫu) | **38 pass, 0 fail** |
| Hồi quy 21 T3 | `store.nestedRejection21T3.test.ts` (cùng mẫu) | **31 pass, 0 fail** |
| Parity i18n | script Python so dict `src/i18n/vi.json` vs `en.json` | vi 805 / en 805, vi-only [], en-only [] |
| tsc | `cd apps/web && ../../node_modules/.bin/tsc --noEmit` | **Sạch ở mọi file của luồng**; còn 4 lỗi ở `packages/video-spec/src/nested.ts:1086–1091` (`NestedFlattenRate` thiếu property) — file này KHÔNG bị luồng chạm (mtime 2026-10-29, trước phiên này), ngoài phạm vi cấm sửa của luồng, để lại cho luồng sở hữu video-spec |
| vite build | `cd apps/web && ../../node_modules/.bin/vite build` (bỏ qua tsc) | **pass, built in 4.53s** |

Lưu ý tsc: lần chạy đầu sau khi sửa code còn lỗi kiểu ở chính file
của luồng (thiếu index signature ở `TwoLevelReasonVars` và kiểu
`reasonVars` ở `NestedG2Info`); đã sửa đúng kiểu (thêm index signature
+ nới kiểu nhận thành `Record<string, string | undefined>`) thay vì
cast, rồi chạy lại cho tới khi sạch ở file luồng.

## 5. File đổi/thêm (tương đối từ repo root, để parent stage)

- `apps/web/src/components/nested/nestUtils.ts` (sửa: thêm reasonCode/reasonVars)
- `apps/web/src/components/nested/nestedRejection.ts` (sửa: thêm translate theo code)
- `apps/web/src/store.ts` (sửa: 2 call site dùng code trước)
- `apps/web/src/components/nested/NestedClipPanel.tsx` (sửa: 1 call site dùng code trước)
- `apps/web/src/store.nestedReasonCode23G1.test.ts` (thêm)
- `docs/PHASE9_ROUND23_G1_REASONCODE_LIMITS.md` (thêm, file này)

Không đổi: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
(đủ key sẵn), `packages/video-spec/*`, `preview.tsx`,
`apps/web/src/components/nested/nestedCurveCreate.ts` (xem §3.2).
Không push gì cả. Build output `apps/web/dist/` chỉ là kết quả chạy
`vite build` kiểm chứng, không nằm trong danh sách stage.
