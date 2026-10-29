# Phase 9 đợt 20 — Luồng R2: Split/trim nested mang speedKeyframes qua ánh xạ τ — LIMITS

Ngày: 2026-10-29. Luồng R2 trong đợt lớn round 20.
Đóng nợ đợt 19 G2 §1a/§3: `splitNestedClip` / `trimNestedClip` trong
`nestUtils.ts` từng trả null cho mọi nested có curve vì dùng ánh xạ
tuyến tính theo speed hằng.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).
KHÔNG sửa `store.ts`, `nestedPreview.ts`, `nested.js` render, i18n
(chỉ đọc khi cần hiểu interface, theo phân công luồng).

## 1. Việc đã làm (chỉ tầng thuần nestUtils)

### 1a. Công thức — ánh xạ τ (spec đợt 18 §0/§3)

Ký hiệu: nested clip chiếm timeline ngoài `[S, S+D)` (`D` = thời gian
OUTPUT), cửa sổ con `[in, out)`, curve `s(t)` trên `[0, D]`.

- Vị trí con tại thời gian output `t`: `u(t) = in + ∫₀ᵗ s = in +
  sourcePosAt(curve, t)` (tích phân THUẬN của video-spec; "τ" trong tên
  đợt là ánh xạ output→con này — đảo của nó là
  `outputDurationForSource`, chỉ dùng ở chế độ trim-cố-định của G2,
  không dùng ở đây).
- **Split** tại thời gian ngoài `t` (`leftDur = t − S`):
  `cutSub = in + sourcePosAt(curve, leftDur)`; curve mỗi nửa =
  `sliceSpeedKeyframes` trên đoạn output của nửa đó, rebase về 0.
  Nửa trái giữ id/start gốc, nửa phải nhận id mới + start = `t`.
- **Trim trái**, target = start mới, `shift = newStart − S`:
  - Cắt đầu (`shift > 0`): `newIn = in + sourcePosAt(curve, shift)`,
    curve mới = slice `[shift, D)`, `out` giữ nguyên.
  - Mở rộng (`shift < 0`): `newIn = in + s(0)·shift`, curve mới =
    đoạn hằng `s(0)` + keyframe gốc dịch đi `−shift`.
- **Trim phải**, target = duration mới `D'`:
  - Thu ngắn (`D' < D`): curve mới = slice `[0, D')`,
    `newOut = in + sourcePosAt(curve mới, D')`.
  - Kéo dài (`D' > D`): `newOut = in + ∫₀ᴰ s + s(D)·(D' − D)`,
    curve mới = keyframe gốc + điểm cuối `(D', s(D))`.
- Bất biến sau mọi phép: `trim.out = in + ∫₀ᴰ curve mới` trong 1e-4s
  (dung sai render §1.3). Split/trim xây trim.out từ ∫ của curve đã
  cắt nên bất biến giữ theo cấu tạo, không phải kiểm tra hậu kỳ.
- Vì sao dùng `sliceSpeedKeyframes` mà KHÔNG dùng `trimSpeedKeyframes`:
  hàm trim chỉ dịch/cắt điểm mà không chèn điểm biên nội suy, nên trim
  phải của ramp linear 1→2 về 2s sẽ mất đoạn dốc: curve còn lại hằng 1
  cho ∫ = 2 trong khi trim.out mới phải là 2.5 — lệch 0.5s, phá bất biến
  §1.3. Slice chèn điểm biên bằng `speedAt` tại biên (linear/ease nhờ
  bezier nâng bậc đợt 16 H3, bezier nhờ de Casteljau) nên đánh giá đúng
  hệt curve gốc trên đoạn cắt.
- Mở rộng dùng quy ước kẹp biên đã có của speedcurve (tốc độ ngoài
  `[0, D]` kẹp về giá trị biên — cùng quy ước `rampTrimLeftIn` dùng cho
  clip ramp thường khi shift < 0 và `speedAt` clamp). Đây là quy ước
  mượn, không phải ngữ nghĩa mới bịa: test T2/T4 khóa đúng hành vi này
  (đoạn mở rộng hằng + `speedAt` tại điểm tương ứng không đổi).
- Không ghi trim: cửa sổ hiệu dụng là `[in, in + ∫)` theo spec §1.3 câu
  cuối — KHÔNG phải `nestedSourceDuration` (đó là mặc định của tốc độ
  hằng). Split/trim trên clip không trim sẽ ghi trim tường minh cho
  các nửa/đoạn mới với `out` tính từ tích phân (test R3 khóa: out = 6,
  không phải 10 dù nguồn dài 10).
- Curve hằng là trường hợp riêng của đường này, không cần nhánh riêng:
  `sourcePosAt = v·t` và slice giữ hằng nên kết quả trùng đúng phép
  tuyến tính cũ với speed = `v`. Khi field `speed` hằng ghi khác `v`,
  đường curve thắng (render §1.5 dùng curve, bỏ qua speed hằng) —
  test C3 khóa (speed = 1, curve hằng 2 → cắt con theo 2).
- Split/trim vẫn CHỈ đụng trim tầng ngoài cùng, không viết lại lá bên
  trong (ngữ nghĩa H2 giữ nguyên); `subSpec` giữ nguyên tham chiếu;
  field `speed` hằng (nếu có) giữ nguyên trên các nửa (render bỏ qua
  nó khi có curve, §1.5). Cả hai hàm vẫn KHÔNG áp margin 0.05s của
  store (margin là quy ước của `splitClipAt`, như trước).
- Comment lỗi thời đã sửa: header H2 + doc của `splitNestedClip` /
  `trimNestedClip` nay ghi đúng trạng thái mới (đợt 19 G2 chỉ sửa lời
  giải thích; đợt này implement thật nên câu "chưa triển khai" đã bỏ).

### 1b. Vẫn fail-fast (trả null, không đoán)

| Trường hợp | Lý do |
|---|---|
| `reverse = true` (có hay không có curve) | Render cấm hoàn toàn (spec §1.4, luật cũ giữ nguyên). |
| Field `speedKeyframes` có nhưng rỗng / không tính được tích phân hữu hạn | Không có đường cong để ánh xạ; throw của video-spec được bắt thành null, không lan ra store. |
| Clip gốc ghi trim tường minh mà lệch tích phân > 1e-4s | Clip gốc đã không hợp lệ theo render §1.3; tách/trim không đoán chế độ sửa nào đúng (giống render fail fast). Lệch trong 1e-4s thì cho qua (dung sai §1.3). |
| Slice rỗng ở một nửa / đoạn sau cắt | Không còn đường cong cho nửa đó (chỉ xảy ra với curve suy biến). |
| Trim phải vượt nguồn (`newOut > nestedSourceDuration`) | Cùng giới hạn đường tốc độ hằng cũ (không nới). |
| Trim trái mở rộng quá đầu nguồn (`newIn < 0`) | Cùng giới hạn đường cũ (tối đa tới `in = 0`). |
| Duration mới < 0.2s | Floor cũ của `trimNestedClip`, không phải luật mới. |
| Mở rộng mà keyframe gốc nằm ngoài `[0, D]` | Đoạn mở rộng hằng chỉ đúng hệt khi curve gốc trong khoảng (luật validator); ngoài khoảng thì từ chối thay vì ánh xạ sai. Thu ngắn/cắt đầu không cần điều kiện này vì slice tự bỏ điểm ngoài đoạn. |

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test thuần mới `nestedRampSplitTrim20.test.ts` (node trực tiếp) | **18 pass, 0 fail** (S1–S5 split ramp; T1–T5 trim ramp; C1–C4 curve hằng; R1–R4 fail-fast + không-trim + hồi quy không curve) |
| Hồi quy `nestUtils.test.ts` | 28 pass, 0 fail |
| Hồi quy `nestedCurveG2.test.ts` | 17 pass, 0 fail |
| Hồi quy `nestedStore.test.ts` (split/trim thuần đợt 16) | 11 pass, 0 fail |
| Hồi quy `nestedSpeedcurve.test.ts` | 22 pass, 0 fail |
| Hồi quy `nestedDeep.test.ts` | 16 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.test.ts` | 16 pass, 0 fail |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (file test mới thêm vào tsconfig exclude theo quy ước file `.test.ts` dùng import đuôi `.ts`) |
| `npx vite build` (apps/web) | **pass** (12.67s; chỉ warning chunk > 500kB có sẵn từ trước) |

Các số khóa trong test mới đều tính tay (xem header file test):
split giữa ramp 1→2 cho cắt con 2.5 và hai curve 1→1.5 / 1.5→2;
split tại 1s cho 1.125; trim trái cắt 2s cho newIn 2.5; trim phải thu
về 2s cho newOut 2.5 (đúng case `trimSpeedKeyframes` làm sai);
trim phải kéo dài 4→6s cho newOut 10 (đúng cap nguồn 10).
KHÔNG có test cũ nào fail do thay đổi hành vi có chủ đích — đường
không curve giữ nguyên từng số, đường có curve trước đây luôn null
nay mới cho kết quả, nên không tồn tại "sửa test cho qua": không file
test cũ nào bị sửa trong đợt này.

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Tầng store/UI chưa được nối lại trong đợt này (thuộc luồng khác,
  KHÔNG mạo nhận đã xong end-to-end):** `store.ts` vẫn giữ code tính
  đích trim theo speed hằng cho nhánh nested (`maxShift` từ
  `trimIn / speed`, cap `newDur` theo `(sourceDuration − trimIn) /
  speed`) và comment "nested clip không mang speedKeyframes" ở nhánh
  trim — với nested có curve, đích store tính ra có thể chặn/kẹp sai
  trước khi tới hàm thuần mới (hàm thuần đúng nhưng store có thể không
  gọi tới nó với đích đúng). Parent cần chuyển cho luồng sở hữu
  `store.ts`: tính đích trim cho nested có curve bằng ánh xạ τ (hoặc
  bỏ cap speed hằng khi có curve) rồi mới gọi `trimNestedClip`.
- **Detector + câu báo của luồng G3 đợt 19 nay lỗi thời ở phần curve:**
  `nestedRejection.ts` (`nestedSpeedRejectionFields` vẫn liệt kê
  `speedKeyframes` là field khiến split/trim bị từ chối) và key i18n
  `nested.speedRejected` (vẫn viết "render worker cấm speedKeyframes
  và reverse ở nested clip") — theo đợt này thì chỉ `reverse` là còn
  bị từ chối ở tầng thuần; curve đã tách/trim được. Luồng này KHÔNG
  sửa file của G3 (i18n + detector + panel) theo phân công; parent
  cần chuyển ghi chú này cho G3 (nối tiếp ghi chú G2 đợt 19 đã nêu).
  Tương tự, comment ở `NestedClipPanel.tsx` (~dòng 26) vẫn ghi reverse
  sẽ bị split/trim từ chối — phần reverse vẫn đúng, phần curve (nếu
  panel còn nhắc) cần luồng panel rà lại.
- **Validator của video-spec vẫn chưa biết curve-nested** (nợ G2 §3,
  chưa đổi): `validateNestedClip` vẫn áp bất biến tốc độ hằng nên sẽ
  báo nested có curve là lệch dù render chấp nhận theo spec §1.3.
  Chuẩn đúng cho batch này là bất biến render §1.3, đã khóa bằng test
  thuần + `nestedCurveWindow` (từ chối khi gốc lệch > 1e-4s).
- **Không đo ở tầng render:** luồng này không đụng render worker nên
  tính đúng của tích phân/đảo tích phân được khóa bằng số suy tay;
  render MP4 cho nested ramp đã thuộc luồng render đợt 18. Với curve
  bezier, tích phân dùng Simpson 64 khoảng như spec §1.3 (sai số < 1e-4
  cho span vài giây) và slice bezier suy biến fallback về bezier gốc
  (giới hạn thừa hưởng từ `speedcurve.ts`, không phải do đợt này tạo).
- **Split/trim sâu (lá trong nested nhiều tầng) không đổi:** đợt này
  chỉ làm split/trim của chính nested clip ngoài cùng; sửa/tách lá sâu
  vẫn đi đường `updateNestedDeepInnerClip` /
  `splitNestedDeepInnerClip` cũ (đường đó đã xử lý curve của lá từ đợt
  14, không liên quan đường curve của tầng ngoài).
- **Chế độ đổi curve (không phải đổi trim) vẫn ở chỗ cũ:** đổi curve
  mà giữ duration/trim theo hai chế độ duration-cố-định /
  trim-cố-định là `applyNestedCurveFixedDuration` /
  `applyNestedCurveFixedTrim` (G2) — khác với hàm này (đổi trim/
  duration và cắt curve theo). Hai việc không lẫn nhau; doc của
  `trimNestedClip` đã ghi rõ ranh giới này.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/components/nested/nestUtils.ts`: đường curve cho
  `splitNestedClip` / `trimNestedClip` (helper mới
  `withNestedCurve`, `nestedCurveWindow`, `splitNestedWithCurve`,
  `trimNestedWithCurve` + import `sliceSpeedKeyframes`, `speedAt`),
  sửa comment H2 + doc hai hàm cho đúng trạng thái mới.
- `apps/web/src/components/nested/nestedRampSplitTrim20.test.ts`:
  test thuần mới (18 case).
- `apps/web/tsconfig.json`: thêm file test mới vào exclude (quy ước
  file `.test.ts` dùng import đuôi `.ts`).
- `docs/PHASE9_ROUND20_R2_RAMP_SPLIT_TRIM_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `store.ts`, `nestedPreview.ts`, `server/render/src/nested.js`, file
  i18n, `nestedRejection.ts`, `NestedClipPanel.tsx`, validator
  `packages/video-spec/src/nested.ts`, mọi file test cũ.
- Không push, không tag/release, không ghi qua GitHub, không stage,
  không sửa build-loop-log.md.
