# Phase 9 đợt 19 — Luồng G2: Nested curve + store/UI wiring — LIMITS

Ngày: 2026-10-29. Luồng G2 trong đợt lớn round 19.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).

Đóng nợ đợt 18 (xem docs/PHASE9_ROUND18_LIMITS.md §"Chưa đóng" +
§"Nợ mở cho đợt sau"):
- comment trong nestUtils.ts (~dòng 995) vẫn ghi "render cấm
  speedKeyframes ở nested" — đã lỗi thời;
- store/UI chưa cài chế độ trim-cố-định và chưa báo khi patch làm
  out lệch tích phân;
- chưa hợp curve hai tầng (cha + con đều có curve);
- guard nguồn cho updateNestedInnerClip mới chỉ ở tầng store, hàm
  thuần R5 vẫn bypass được.

## 1. Việc đã làm

### 1a. Sửa comment lỗi thời (không đổi hành vi tách/trim)

- Header N3 trong `nestUtils.ts`: viết lại đúng trạng thái từ đợt 18 —
  render worker HỖ TRỢ speedKeyframes ở nested (spec đợt 18),
  duration là thời gian output, trim.out phải khớp in + ∫ trong
  1e-4s; store giữ duration khi patch curve (duration-cố-định) và
  tính lại trim.out theo tích phân; trim-cố-định ở helper riêng.
- Comment của `splitNestedClip` / `trimNestedClip`: lý do từ chối
  nay tách bạch theo field — reverse vẫn bị render cấm hoàn toàn
  (spec §1.4); speedKeyframes thì render ĐÃ hỗ trợ, nhưng phép tách/
  trim ở đây dùng ánh xạ tuyến tính theo speed hằng nên không áp
  được cho ramp (điểm cắt đúng phải qua τ, chưa triển khai) nên vẫn
  trả null — là fail-fast vì thiếu ánh xạ, KHÔNG còn là "render cấm".
  Hành vi tách/trim không đổi, chỉ sửa lời giải thích.
- Comment nhánh speed của `patchClip` trong `store.ts`: bỏ chữ
  "render cấm" — với curve thì render dùng curve, bỏ qua speed hằng
  (spec §1.5), nên nhánh giữ nguyên duration là đúng, lý do cũ sai.

### 1b. Guard nguồn của cha dời xuống hàm thuần R5

`updateNestedInnerClip` trong `nestUtils.ts` nay có guard ngay trong
hàm thuần, copy đúng vị ngữ của guard deep đợt 17 N3 và guard store
đợt 18 (cha là nested ngoài cùng vì R5 chỉ sửa clip con trực tiếp):
độ dài nguồn = clip kết thúc muộn nhất trên MỌI track của subSpec
cha, tính từ giá trị patch CHƯA làm tròn; cha ghi trim thì chỉ cấm
khi trim.out > nguồn mới + 1e-9; cha không ghi trim thì nguồn đổi
hướng nào cũng cấm. Guard chạy sau kiểm tra đè clip, trước khối
cắt curve (thứ tự này giữ nguyên mọi error cũ khi patch vừa đè
vừa lệch nguồn — đè được báo trước, như trước đây).

- Guard ở store action đợt 18 GIỮ NGUYÊN (cùng vị ngữ, chạy trước):
  dư thừa nhưng vô hại, không xóa để tránh đụng hành vi store đã
  kiểm chứng. Hàm thuần nay là tuyến phòng thủ có thẩm quyền; store
  chỉ còn là lớp trùng lặp.
- Test G1 của `store.nestedGuard.test.ts` được cập nhật theo đúng
  thay đổi hành vi có chủ đích này: trước đợt 19 nó chứng minh hàm
  thuần cho qua (bypass); nay nó chứng minh hàm thuần chặn với
  error nói rõ trim.out, spec không đổi, và store vẫn chặn như cũ.
  Đây là sửa test CÓ CHỦ ĐÍCH duy nhất, không phải sửa cho qua.

### 1c. Hợp curve hai tầng: spec CẤM nên implement FAIL-FAST, không hợp sai

Spec đợt 18 §5 cấm trường hợp này (lá mang curve riêng dưới nested
có curve sẽ bị render fail vì lá tầng trong sau flatten đã mang
curve) và §6 ghi rõ hợp hai tầng là nợ mở "cần slice + hợp easing".
Luồng này KHÔNG bịa ngữ nghĩa hợp (không nhân easing, không cộng
tốc độ) mà chặn sớm ở đúng hai đường vào duy nhất tạo được trạng
thái đó:

- `patchClip` đặt curve lên nested clip mà cây con đã có lá mang
  curve (`nestedSubtreeHasSpeedCurve`, đệ quy, chống vòng lặp
  subSpec bằng Set) → trả 0 trước exec (không đổi spec, không
  entry undo) + toast error nói rõ "hợp curve hai tầng chưa được hỗ
  trợ" và cách gỡ (gỡ curve của clip con).
- `updateNestedDeepInnerClip` đặt curve lên lá mà một tầng tổ tiên
  trong chain (kể cả top) đã mang curve → `{ error }` nói rõ hai
  tầng, trước khi áp patch.
- Lá text/sticker/image mang field speedKeyframes duck-typed KHÔNG
  tính là xung đột (chúng không có trục nguồn; spec §3 chỉ ánh xạ τ
  cho chúng) — chỉ video/audio và nested con mới tính, đúng các
  kind mà render biến thành clip ramp.
- Chặn thừa có chủ đích, ghi rõ không giấu: tổ tiên mang curve HẰNG
  cũng bị chặn ở tầng này, dù render §2 gộp curve hằng về tốc độ
  hằng và luật cũ cho lá dưới tốc độ hằng có thể cho qua (đặc biệt
  v = 1). Lý do: kiểm tra tổ tiên không phân biệt curve hằng với
  curve thật, và nới lỏng riêng cho trường hợp hằng sẽ tạo thêm một
  nhánh ngữ nghĩa cần test riêng. Cách gỡ cho user: gỡ curve của tổ
  tiên (hoặc thay bằng speed hằng) rồi đặt curve cho lá.

### 1d. Nối trim-cố-định + báo lệch tích phân vào store/UI

Hai helper thuần mới trong `nestUtils.ts` (cùng dùng `sourcePosAt` /
`outputDurationForSource` của video-spec, không tự tính tích phân):

- `applyNestedCurveFixedDuration(top, curve)` — chế độ
  duration-cố-định (spec §2): giữ D, đặt curve mới, trim.out :=
  in + ∫₀ᴰ s.
- `applyNestedCurveFixedTrim(top, curve)` — chế độ trim-cố-định:
  giữ [in, out), đặt curve mới, D := outputDurationForSource(curve,
  out − in). Trả null khi reverse, curve/trim không hợp lệ, hoặc D
  tính ra < 0.2s (floor mượn đúng của trimNestedClip, không phải
  luật mới của render).
- `nestedCurveExpectedOut` / `nestedCurveOutMismatch` — out kỳ vọng
  theo tích phân và chênh lệch so với trim.out thực tế (ngưỡng báo
  1e-4s đúng spec §1.3).

Nối vào `store.ts` — `patchClip` (đường UI thật: SpeedPanel đặt curve
qua patchClip, không loại trừ nested clip):

- Patch đặt curve lên nested (không kèm trim): apply tính lại
  trim.out theo tích phân (duration-cố-định). Trước đợt này patch
  kiểu này để nguyên trim.out cũ nên render fail §1.3 trừ khi tích
  phân tình cờ bằng cũ — đây chính là lỗi "chưa báo / chưa cài" của
  đợt 18, nay sửa bằng tính lại chứ không chỉ báo.
- Patch đổi duration trên nested ĐÃ mang curve: nhánh H2 cũ (trim.out
  theo speed hằng) nay bị chặn cho trường hợp có curve, thay bằng
  trim.out theo tích phân của curve ĐÃ CẮT (luật H3/T4): ví dụ curve
  1→2, duration 4→2 cho trim.out 2.5 (= ∫₀² (1+t/4)), không phải 2.
- Patch tự đặt trim tường minh cùng curve mà lệch tích phân > 1e-4s:
  store KHÔNG tự sửa trim của user — giữ nguyên trim, bắn toast
  error sau exec (tính triển vọng trước exec theo mẫu H3, không báo
  lại khi undo/redo) nói rõ trim.out, giá trị tích phân kỳ vọng và
  việc render sẽ từ chối. Cảnh báo tới được UI qua toast, không nuốt
  như curveDropped trước đợt 16.
- Curve mà ∫ vượt độ dài nguồn con: vẫn ghi trim.out theo §1.3 (đó
  là bất biến render kiểm tra), kèm toast info cảnh báo đuôi có thể
  không có hình — không kẹp out về cuối nguồn vì kẹp sẽ phá §1.3.
- Action mới `patchNestedCurveFixedTrim(trackId, clipId, curve)` cho
  chế độ trim-cố-định: trả `{ ok, duration }` khi thành công,
  `{ ok: false, reason }` khi không phải nested / track khóa / xung
  đột hai tầng / không tính được duration. Fail-fast trước exec nên
  lệnh bị từ chối không đổi spec, không sinh entry undo.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test thuần mới `nestedCurveG2.test.ts` (node trực tiếp) | **17 pass, 0 fail** (B1–B5 guard R5; D1–D7 hai chế độ + mismatch; C1–C5 fail-fast hai tầng) |
| Test store mới `store.nestedCurve19.test.ts` (esbuild bundle) | **8 pass, 0 fail** (S1–S8: duration-cố-định, duration trên curve-nested, mismatch toast, xung đột hai tầng, action trim-cố-định + từ chối, hồi quy H2, vượt nguồn) |
| `store.nestedGuard.test.ts` (bundle, G1 đã cập nhật theo §1b) | **9 pass, 0 fail** |
| Hồi quy `nestUtils.test.ts` | 28 pass, 0 fail |
| Hồi quy `nestedSpeedcurve.test.ts` | **22 pass, 0 fail** (sau khi sửa fixture, xem §3) |
| Hồi quy `nestedDeep.test.ts` | 16 pass, 0 fail |
| Hồi quy `nestedStore.test.ts` | 11 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.test.ts` | 16 pass, 0 fail |
| Hồi quy `nestedStore.store.test.ts` (bundle) | 8 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.store.test.ts` (bundle) | 8 pass, 0 fail |
| Hồi quy `splitPatch.store.test.ts` (bundle) | 12 pass, 0 fail |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (file store test mới KHÔNG cần thêm vào exclude — viết sạch kiểu như file guard đợt 18; file thuần mới thêm vào exclude theo quy ước các file `.test.ts` dùng import đuôi `.ts`) |
| `npx vite build` (apps/web) | **pass** (6.00s; chỉ warning chunk > 500kB có sẵn từ trước) |

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Fixture test cũ phải sửa cho guard-consistent (3 case):** dời
  guard xuống hàm thuần làm 3 case của `nestedSpeedcurve.test.ts`
  (trim phải, dời thuần, đổi 2 mép) fail, vì fixture R5 cũ có cha
  KHÔNG trim, duration 10 trong khi nguồn chỉ 6 — cha vốn đã không
  nhất quán nên nhánh no-trim chặn mọi đổi nguồn. Sửa: fixture nay
  có trim tường minh [0,6) + track it2 với lá anh em kết thúc ở 6
  giữ nguồn; MỌI assertion về curve giữ nguyên, không đổi một số
  nào. Đây là hệ quả trực tiếp, có chủ đích của việc bịt bypass —
  không phải "sửa test cho qua": test guard mới (B/G) mới là nơi
  khóa hành vi chặn, còn 3 case này khóa toán cắt curve.
- **Validator của video-spec chưa biết curve-nested:** test store
  KHÔNG assert `validateNestedClip` rỗng cho nested mang curve, vì
  validator vẫn áp bất biến duration = (trim.out − trim.in) / speed
  nên sẽ báo nested có curve (D=4, trim 6) là lệch dù render chấp
  nhận theo spec §1.3. Đây là nợ validator phát hiện trong đợt này,
  thuộc luồng sở hữu video-spec — luồng này KHÔNG sửa validator để
  tránh đụng file của luồng khác. Chuẩn đúng cho batch này là bất
  biến render §1.3, đã khóa bằng test.
- **Toast G2 hardcode tiếng Việt:** 3 câu toast mới (xung đột hai
  tầng, lệch tích phân, vượt nguồn) viết hardcode vì luồng này không
  được sửa file i18n. Cần luồng i18n chuyển thành key sau, theo mẫu
  `nested.speedRejected` mà luồng G3 đợt 19 đã làm cho câu tách/trim.
- **Câu tách/trim của G3 vẫn mang chữ lỗi thời:** key
  `nested.speedRejected` (i18n, do luồng G3 đợt 19 sở hữu) vẫn viết
  "render worker cấm speedKeyframes và reverse ở nested clip" — theo
  §1a thì chỉ reverse là render cấm, còn curve là split/trim từ chối
  vì thiếu ánh xạ τ. Luồng này KHÔNG sửa file của G3 (i18n +
  nestedRejection + panel); parent cần chuyển ghi chú này cho G3.
- **Chưa có nút panel cho trim-cố-định:** action store
  `patchNestedCurveFixedTrim` đã có + test qua store thật, nhưng
  chưa panel nào gọi nó (SpeedPanel dùng patchClip =
  duration-cố-định; NestedClipPanel không có editor curve cho
  nested). Vì vậy "nối trim-cố-định vào store" đã xong, "vào UI"
  mới xong ở mức: patchClip (đường UI hiện có) + toast cảnh báo.
  Nút chọn chế độ trong panel là follow-up, KHÔNG mạo nhận đã có.
- **Không đo ở tầng render:** luồng này không đụng render worker
  (cấm theo phân công) nên tính đúng của tích phân/đảo tích phân
  được khóa bằng số suy tay trong test thuần + test store, còn
  render MP4 cho nested ramp thuộc luồng render đợt 18 (đã có).
- **Split/trim nested có curve vẫn bị từ chối:** chỉ sửa lời giải
  thích (§1a), không implement ánh xạ τ cho tách/trim — vẫn là nợ
  mở, giống preview parity cho nested ramp (thuộc luồng khác).
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/components/nested/nestUtils.ts`: guard R5 (§1b),
  helper G2 + fail-fast deep (§1c/§1d), sửa comment (§1a).
- `apps/web/src/store.ts`: import helper G2, action
  `patchNestedCurveFixedTrim` (interface + implementation), nhánh
  patchClip G2 (xung đột hai tầng, duration-cố-định, toast lệch /
  vượt nguồn), chặn nhánh H2 cho nested có curve, sửa comment N3.
- `apps/web/src/components/nested/nestedCurveG2.test.ts`: test
  thuần mới (17 case).
- `apps/web/src/store.nestedCurve19.test.ts`: test store mới
  (8 case, bundle esbuild).
- `apps/web/src/store.nestedGuard.test.ts`: cập nhật G1 + header
  theo hành vi guard mới (§1b).
- `apps/web/src/components/speed/nestedSpeedcurve.test.ts`: fixture
  guard-consistent (§3), assertion không đổi.
- `apps/web/tsconfig.json`: thêm `nestedCurveG2.test.ts` vào
  exclude (quy ước file test dùng import đuôi `.ts`).
- `docs/PHASE9_ROUND19_G2_NESTED_CURVE_STORE_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- Preview engine, render worker, `Timeline.tsx`, file i18n,
  script benchmark/harness/footage.
- `NestedClipPanel.tsx`, `nestedRejection.ts` (luồng G3 đợt 19),
  validator `packages/video-spec/src/nested.ts` (xem nợ ở §3).
- Không push, không tag/release, không ghi qua GitHub, không
  stage, không sửa build-loop-log.md.
