# Phase 9 đợt 23 G2 — Nối 8 nhánh cổng lá ra UI sống — LIMITS

Ngày: 2026-10-30 (lượt cron 02:03). Luồng G2 trong đợt lớn round 23.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG đổi logic chặn/cho
qua của cổng, KHÔNG đụng `packages/video-spec`, KHÔNG đụng `preview.tsx`,
KHÔNG đụng `nestUtils.ts` (cổng lá nằm ở đó, chỉ đọc để đối chiếu).

## 0. Kết luận trước: đếm thực tế đúng 8, không ép

Đối chiếu code `checkTwoLevelLeafCurve` trong
`apps/web/src/components/nested/nestUtils.ts` (hàm cổng lá, đường
`updateNestedDeepInnerClip`): có đúng 8 nhánh từ chối, khớp 1–1 với 8 key
i18n `nested.twoLevel*` mà đợt 22 A đã dịch (mapper
`translateTwoLevelReason` trong `nestedRejection.ts`). Thứ tự cổng kiểm
tra: lá trước (4 nhánh tự thân), rồi vòng lặp các tầng tổ tiên (4 nhánh).
Trường hợp không có tầng tổ tiên nào mang curve thì cổng trả ok ngay —
không phải nhánh từ chối, không đếm.

## 1. Bảng 8 nhánh — caller cũ, đường UI mới

| # | Nhánh (theo thứ tự cổng) | Điều kiện (tóm tắt, xem code cổng) | Key i18n / reasonKey | Caller trước G2 | Đường UI sau G2 |
|---|---|---|---|---|---|
| 1 | leafSelfReverse | lá tự reverse | `nested.twoLevelLeafSelfReverse` | không có (chỉ test thuần) | store action toast + nút panel lá trực tiếp |
| 2 | leafNonMedia | lá không phải video/audio | `nested.twoLevelLeafNonMedia` | không có | store action toast + nút panel lá trực tiếp (cả lá chữ) |
| 3 | leafSelfAttachment | lá mang attachment thời gian | `nested.twoLevelLeafSelfAttachment` | không có | store action toast + nút panel lá trực tiếp |
| 4 | leafSelfCurveInvalid | curve lá vi phạm R1 | `nested.twoLevelLeafSelfCurveInvalid` | không có | store action toast (nút panel không tới được — preset luôn hợp lệ, xem §4) |
| 5 | ancestorReverse | một tầng tổ tiên reverse | `nested.twoLevelAncestorReverse` | không có | store action toast + nút panel lá trực tiếp (khi top vừa reverse vừa mang curve) |
| 6 | ancestorCurveInvalid | curve tổ tiên vi phạm R1 | `nested.twoLevelAncestorCurveInvalid` | không có | store action toast (nút panel không tới được — curve top tạo qua panel luôn hợp lệ) |
| 7 | ancestorKeyframeProduct | tích keyframe tổ tiên × lá vượt [0.25, 4] | `nested.twoLevelAncestorKeyframeProduct` | không có | store action toast, cả chain rỗng và chain sâu |
| 8 | ancestorCombinedRange | tốc độ hợp lấy mẫu vượt [0.25, 4] | `nested.twoLevelAncestorCombinedRange` | không có | store action toast + nút panel chỉ ở trường hợp bezier tổ tiên overshoot (project chế tay) |

Phát hiện đối chiếu (đính chính cách hiểu "caller UI sống"): trước G2,
**không có bất kỳ component `.tsx` nào gọi `updateNestedDeepInnerClip`**
(grep toàn `apps/web/src`: chỉ test + định nghĩa store gọi hàm thuần).
Đường duy nhất tới cổng lá là store action đó, mà action này nuốt mất
error của hàm thuần (`if ("error" in res) return { ok: false }`) nên
không caller nào toast được 8 nhánh — đúng như LIMITS đợt 22 §4 ghi.
G2 không bịa thêm caller: G2 sửa đúng action đó thành đường toast sống,
rồi gắn thêm một nút bấm thật cho trường hợp lá trực tiếp (xem §2).

## 2. Việc đã làm

### 2a. Store action `updateNestedDeepInnerClip` — đường toast sống cho cả 8 nhánh
- Khi hàm thuần trả error cổng lá (tiền tố cố định
  `Không tạo được trạng thái hai tầng: `), action: dịch reason qua
  mapper đợt 22 A (`translateTwoLevelReason`, đủ vi/en), bọc bằng key
  mới `nested.deepLeafTwoLevel` (nêu tên nested clip ngoài — clip-aware),
  bắn 1 toast error, trả thêm `reason` (câu toast đã dịch) +
  `reasonKey` (key i18n của nhánh, qua helper mới `twoLevelReasonKey`
  trong `nestedRejection.ts`).
- Lệnh bị chặn KHÔNG qua `execCommand`: spec không đổi, không sinh
  entry undo (quy ước guard đợt 18; test khóa bằng `undoDepth` trước/
  sau + so sánh JSON spec).
- Các lỗi khác (không tìm thấy, track khóa, guard nguồn cha) giữ hành
  vi cũ: `ok:false`, không reason, không toast — panel báo lỗi chung.
  Interface action cập nhật kèm chú thích (tương thích ngược: field mới
  đều optional).

### 2b. Panel — nút đặt curve cho lá trực tiếp (không vẽ UI mới hoành tráng)
- `InnerClipEditor` trong `NestedClipPanel.tsx` (đường "Xem bên trong"
  đã tồn tại) thêm đúng 1 nút `nested.deepLeafCurveButton` ("Đặt curve
  1× cho lá") cho mọi clip con không phải nested: bấm → gọi đúng
  `updateNestedDeepInnerClip(hostTrackId, nestedId, [], ...)` với preset
  hằng 1× của `nestedCurveCreate` (chain rỗng = lá trực tiếp).
  Thành công: dòng msg `nested.deepLeafCurveOk` (1 bước undo). Bị chặn:
  store đã toast nên panel chỉ giữ dòng msg bền vững từ `res.reason`
  (không toast trùng). Lá đã có curve: nút ẩn, hiện ghi chú
  `nested.deepLeafCurveHas` thay vì đặt đè.
- Clip con là nested thì không hiện nút (nó không phải lá; sửa sâu hơn
  cần chain dài hơn — nợ §4).

### 2c. `nestedCurveCreate.ts` — hết rò chuỗi Việt nội bộ ra UI ở locale en
- Trước G2, panel đường tạo curve tự ráp toast từ
  `nestedCurveCreateTwoLevelReason` (chuỗi tiếng Việt hardcode của cổng)
  rồi mới dịch qua mapper — đúng kết quả nhưng panel vẫn cầm chuỗi thô.
- G2 thêm `nestedCurveCreateTwoLevelMessage(translate, clip)` — điểm
  toast duy nhất cho nhánh twoLevel của đường tạo: tự kiểm tra block,
  dịch tại điểm toast qua mapper, fallback câu chung khi reason rỗng
  bất thường; trả null khi không ở nhánh này. Panel chuyển sang dùng
  helper này; hàm cũ giữ nguyên chữ ký (test T4 vẫn dùng) nhưng ghi rõ
  CHỈ DÙNG NỘI BỘ, không toast trực tiếp.
- Không đổi preset, không đổi luật chặn `nestedCurveCreateBlock`.

### 2d. i18n
- 4 key mới đủ vi/en: `nested.deepLeafTwoLevel`,
  `nested.deepLeafCurveButton`, `nested.deepLeafCurveHas`,
  `nested.deepLeafCurveOk`. Parity dict: 809/809, vi-only [],
  en-only [] (tăng từ 805/805 của đợt 22 A).

## 3. Kiểm chứng (lệnh + kết quả thật)

Test mới `apps/web/src/store.nestedLeafGate23G2.test.ts` (chạy bằng
esbuild bundle, mẫu 22A — repo không có DOM test runner nên panel chỉ
kiểm chứng bằng tsc + build):

```
node_modules/.bin/esbuild apps/web/src/store.nestedLeafGate23G2.test.ts \
  --bundle --platform=node --format=cjs \
  --outfile=/tmp/store.nestedLeafGate23G2.test.cjs --log-level=warning
node /tmp/store.nestedLeafGate23G2.test.cjs
→ 24 pass, 0 fail
```

- Nhóm L (8 nhánh × vi+en + 1 nhánh keyframeProduct chain sâu × vi+en
  = 18 test): mỗi nhánh qua store action thật — chặn đúng, đúng 1 toast
  error, toast = reason trả về, reasonKey đúng, spec không đổi, lá
  không nhận curve, `undoDepth` không đổi; en không chứa 8 dấu tiếng
  Việt đã liệt kê trong test.
- Nhóm V (3 test): cặp hợp lệ top 1× × lá 1→1.5 (chain rỗng + chain
  sâu) và trường hợp tổ tiên không mang curve → ok, 0 toast, lá nhận
  đúng curve, có entry undo.
- Nhóm C (3 test): helper tạo-curve ở vi giữ đúng wording cổng cũ,
  ở en hoàn toàn tiếng Anh (không rò dấu Việt, không rò key thô); clip
  không bị chặn / đã có curve → helper null.

Hồi quy (cùng cách chạy esbuild, trừ tsc/build):

```
tsc -p apps/web/tsconfig.json --noEmit   → 0 lỗi
  (1 lỗi trung gian đã sửa: panel import translateTwoLevelReason thừa
  vì luồng G1 đã đổi ModeEditor sang translateTwoLevelCheck — xem §5)
vite build (apps/web)                    → pass, 11.61s, chỉ warning
  chunk-size cũ
store.nestedToast22A.test.ts             → 38 pass, 0 fail
store.nestedCurve21T4.test.ts            → 11 pass, 0 fail
store.nestedRejection21T3.test.ts        → 31 pass, 0 fail
store.nestedReasonCode23G1.test.ts       → 29 pass, 0 fail
components/nested/nestedCurveG2.test.ts  → 18 pass, 0 fail
```

## 4. Nợ còn lại — không mạo nhận

1. **Lá sâu hơn 1 tầng (chain ≥ 1) chưa có nút panel.** Panel hiện chỉ
   liệt kê clip con trực tiếp ("Xem bên trong" không đệ quy), nên lá ở
   sâu chỉ tới được cổng lá qua store action (nay đã toast + reason)
   hoặc qua MCP/CLI tương lai — chưa có đường bấm. Cần đợt riêng nếu
   muốn inner view đệ quy (đó mới là UI mới, ngoài phạm vi surgical
   của G2).
2. **Qua nút panel preset 1×, 3 nhánh không tới được trong use thường:**
   leafSelfCurveInvalid (preset luôn hợp lệ), ancestorCurveInvalid
   (curve top tạo qua panel luôn hợp lệ), ancestorKeyframeProduct
   (top hợp lệ tối đa 4× × preset 1× = 4, vừa trong khoảng). Cả 3 vẫn
   tới được qua store action với patch chế tay — test khóa đủ 8 nhánh
   ở tầng action, không claim nút panel phủ cả 8.
3. **Cầu nối tiền tố chuỗi (fragile, cùng họ với mapper 22 A).** Hàm
   thuần sâu chỉ trả error chuỗi, không có kênh reasonCode — G1 đã thêm
   reasonCode cho đối tượng check ở cổng, nhưng hàm thuần sâu vẫn ép
   check thành chuỗi ở `nestUtils.ts:2882` trước khi trả về. Store G2
   tách reason bằng tiền tố cố định; đổi tiền tố/wording cổng sẽ làm
   test G2 đỏ ngay (reasonKey undefined, toast mất) chứ không lặng lẽ
   lệch. Sửa bền: hàm thuần sâu trả kèm check object (việc của đợt sau,
   đụng `nestUtils.ts` nên ngoài phạm vi G2).
4. **Nút panel chưa có click-test browser thật.** Panel chỉ kiểm chứng
   bằng tsc + build (giới hạn chung của repo, xem test 22A). Hành vi
   nút được khóa gián tiếp: nút gọi đúng hình action mà test L/V khóa
   (chain rỗng, preset hằng 1×).
5. **Không đụng split-trim sâu.** `splitNestedDeepInnerClip` không qua
   cổng lá (tách không đặt curve) nên ngoài phạm vi; split/trim tầng
   ngoài đã clip-aware từ đợt 22 A, không sửa lại.

## 5. Ghi chú phối hợp round 23 (tránh nhầm diff)

Trong lúc G2 chạy, luồng G1 cùng sửa `nestUtils.ts` (thêm reasonCode
cho cổng), `store.ts` (patchClip/fixedTrim dùng
`translateTwoLevelCheck`) và `NestedClipPanel.tsx` (ModeEditor). Diff
của G2 KHÔNG bao gồm các thay đổi đó; G2 chỉ thêm vào các file dưới
đây và đã rebase tay qua trạng thái mới nhất của G1 (bỏ import
`translateTwoLevelReason` thừa ở panel sau khi G1 đổi ModeEditor,
tsc lại 0 lỗi). Nếu gộp batch, cần giữ cả hai phía: G1 (reasonCode ở
cổng) + G2 (toast/reason ở action sâu + nút panel + helper tạo-curve).

## 6. File đã đổi/thêm (luồng G2, chưa push)

Đổi:

- `apps/web/src/store.ts` — action sâu trả reason/reasonKey + toast
  cổng lá; import thêm `translateTwoLevelReason`, `twoLevelReasonKey`.
- `apps/web/src/components/nested/NestedClipPanel.tsx` — đường tạo
  dùng helper dịch-tại-điểm-toast; `InnerClipEditor` thêm nút đặt
  curve 1× cho lá trực tiếp.
- `apps/web/src/components/nested/nestedCurveCreate.ts` — thêm
  `nestedCurveCreateTwoLevelMessage`, ghi rõ hàm reason cũ chỉ dùng
  nội bộ.
- `apps/web/src/components/nested/nestedRejection.ts` — thêm
  `twoLevelReasonKey` (trích key từ reason cổng).
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — 4 key mới
  (parity 809/809).

Thêm:

- `apps/web/src/store.nestedLeafGate23G2.test.ts` — 24 test (18 nhánh
  + 3 hợp lệ + 3 tạo-curve i18n).
- `docs/PHASE9_ROUND23_G2_LEAF_GATE_UI_LIMITS.md` — file này.
