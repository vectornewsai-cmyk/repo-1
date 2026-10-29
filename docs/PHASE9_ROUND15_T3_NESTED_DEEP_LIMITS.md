# Phase 9 đợt 15 — Luồng T3: nested clip sâu hơn 1 cấp (LIMITS)

Ngày: 2026-10-28. Luồng T3 trong đợt lớn round 15 (chủ đề: nested sâu).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop riêng (parent gộp batch — xem §4).

Đóng nợ đợt 14 R5 đã ghi: "Nested sâu hơn 1 cấp: helper chỉ làm 1 tầng...
Chưa cài đặt hàm đệ quy này, chưa có test cho nó."

## 1. Việc đã làm

### 1a. Helper hợp cửa sổ đệ quy — `composeNestedLeafWindow` (spec)

- File: `packages/video-spec/src/nested.ts` (+ mirror tay
  `packages/video-spec/src/nested.js`, parity đã khóa bằng test).
- Chữ ký: `composeNestedLeafWindow(top, chain, leaf)` — `top` là nested
  ngoài cùng (tầng 1), `chain` là các nested tổ tiên từ con trực tiếp
  của `top` xuống nested chứa trực tiếp lá (rỗng = lá trực tiếp trong
  top), `leaf` là clip lá. Trả `ComposedLeafWindow | null`:
  `visibleStart/visibleEnd` (cửa sổ khả kiến tính từ đầu lá),
  `absoluteStart/absoluteDuration` (cùng khung với `FlatClip` của
  `flattenNested`, đã gồm `top.start`), `path` (id ngoài → trong),
  `depth`, `cumulativeSpeed` (tích speed mọi tầng).
- Công thức y hệt `flattenInto` (không phát minh lại): mỗi tầng giao cửa
  sổ với [M.start, M.start+M.duration), rồi map sang subSpec của M bằng
  τ = M.trim.in + (t − M.start) × M.speed; ánh xạ mới mapP' =
  mapP + (M.start − mapQ) × mapK, mapQ' = M.trim.in, mapK' = mapK / M.speed.
- Trả null khi lá bị trim ngoài cắt hết ở bất kỳ tầng nào (giống flatten
  bỏ lá có giao rỗng). Throw (fail fast, không nuốt lặng) khi: kind/
  speed/trim/start/duration không hợp lệ, độ sâu vượt MAX_NESTED_DEPTH
  (= 8), vòng lặp tham chiếu subSpec theo ĐƯỜNG ĐI, chain/lá không khớp
  cây, hoặc "lá" truyền vào thực ra là nested clip.
- Chain/lá được KHỚP THEO ID với cây thật và mọi số liệu lấy từ bản ghi
  TRONG CÂY (giống flattenNested), không lấy từ object caller truyền vào
  — tránh lệch khi caller cầm bản copy cũ. Trùng id trong cùng tầng →
  clip đầu tiên thắng (đã ghi trong docstring).
- Dùng lại CÙNG subSpec ở các clip anh em là HỢP LỆ (Set tổ tiên chỉ xét
  đường đi, giống flatten/validate) — có test khóa.

### 1b. Nối vào đường flatten cho curve + in/out — `nestUtils.ts`

- `deepNestedLeafVisibleSpeedCurve(top, chain, leaf)` → `DeepLeafMedia`:
  window đã hợp + curve khả kiến (qua `leafVisibleSpeedCurveForWindow`
  với cửa sổ đã hợp, rebase về 0) + `effectiveIn/effectiveOut` trong file
  nguồn cho đúng phần khả kiến.
- Map in/out theo loại lá:
  - có speedKeyframes (không reverse): in + ∫speed trên [0, visibleStart)
    và [0, visibleEnd) — tức đúng công thức rampTrimLeftIn/rampTrimRightOut
    của R5, tính bằng `sourcePosAt`;
  - tốc độ hằng: in + visibleStart × speed, in + visibleEnd × speed;
  - reverse + tốc độ hằng: đoạn nguồn đảo chiều, [out − visibleEnd ×
    speed, out − visibleStart × speed];
  - reverse + speedKeyframes: validator cấm tổ hợp này nên KHÔNG đoán —
    2 field vắng;
  - clip chữ: không có in/out nên 2 field vắng, window vẫn có.
- `nestedSplitOffset(top, chain, leaf, splitTimeTop)` → điểm cắt qua biên
  nested: mốc thời gian trong khung timeline ngoài của `top` (đã gồm
  top.start) được map xuống `leafLocalTime` (thời gian output của lá)
  và `sourceTime` (vị trí nguồn, qua ramp nếu lá có curve). Trả null khi
  lá bị cắt hết hoặc mốc nằm ngoài phần khả kiến của lá. Mốc đúng bằng
  biên lá vẫn map được (về đầu/cuối phần khả kiến) — caller quyết định
  nửa nào nhận điểm biên.
- Đây là map "phần khả kiến", không phải edit phá hủy: trim ngoài vẫn
  chỉ là cửa sổ, thu hẹp rồi mở lại không mất keyframe (giữ nguyên ngữ
  nghĩa R5).

### 1c. Mâu thuẫn spec đã phát hiện — và cách chọn (tương thích ngược)

- Helper 1 tầng R5 (`nestedLeafVisibleSpeedCurve`) vốn là hàm THUẦN THEO
  TRIM: nó không yêu cầu lá phải nằm trong subSpec của nested (test R5
  dùng subSpec rỗng vẫn phải ra kết quả). Lần nối đầu tiên của luồng này
  đã ép nó đi qua helper đệ quy khớp-cây và làm vỡ đúng 1 test R5
  ("dùng trim của nested clip") — đó là bằng chứng mâu thuẫn, không
  phải suy đoán.
- Quyết định: GIỮ NGUYÊN helper 1 tầng R5 (không đụng hợp đồng cũ), hai
  đường tồn tại song song — 1 tầng thuần-trim ở
  `nestedLeafVisibleSpeedCurve`, đệ quy khớp-cây ở
  `deepNestedLeafVisibleSpeedCurve`. Test hồi quy trong file mới khóa cả
  hai phía: helper cũ vẫn chạy với lá ngoài cây, helper mới fail fast
  khi lá ngoài cây. Ghi chú này đã viết vào docstring của hàm cũ để
  luồng sau không "dọn dẹp" nhầm thành một đường.

### 1d. Bug thật tìm ra trong lúc test (đã sửa)

- Map đoạn nguồn cho lá reverse ban đầu gán `effectiveIn =
  source(visibleStart)`, `effectiveOut = source(visibleEnd)` — với
  reverse thì source giảm dần nên in > out (đoạn ngược). Test bắt được
  (nhận 19/17, muốn 17/19). Đã sửa bằng hàm riêng `leafSourceRange`
  (đảo đầu/cuối cho reverse), còn map điểm đơn cho split
  (`leafSourceTimeAt`) giữ nguyên vì một điểm không có chuyện đảo.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `apps/web/src/components/speed/nestedDeep.test.ts` | **16 pass, 0 fail** |
| Hồi quy `nestedSpeedcurve.test.ts` (R5) | **22 pass, 0 fail** |
| Hồi quy `nestUtils.test.ts` | **28 pass, 0 fail** |
| Hồi quy `speedcurveTrim.test.ts` (đợt 13 C5) | **18 pass, 0 fail** |
| Hồi quy `nested.test.ts` (spec, qua tsc + node --test) | **49 pass, 0 fail** |
| Hồi quy `nestedDemo.test.ts` / `nestedUnify.test.ts` | **8 pass / 12 PROVEN pass** |
| `npx tsc --noEmit` (apps/web) | **4 lỗi, KHÔNG nằm trong file luồng này** (xem §3) |

Số đo thật đáng chú ý (đã tính tay + test khóa, không đoán):
- 2 cấp trim cha+con (fixture A): absoluteStart 11.5, duration 2.5,
  visible [0,5), in/out 100/105, cumulativeSpeed 2; đối chiếu
  flattenNested khớp từng số (start/duration/path/depth).
- 2 cấp trim cha cắt lá (top trim [2,4)): absoluteStart 10 (không phải
  12 — mapP' = 10 + (1−2)×1 = 9 rồi mới cộng (3−1)×0.5; số 12 ban đầu
  của chính luồng này là tính nhầm, đã sửa test sau khi đối chiếu
  flatten), duration 2, visible [1,5), in/out 101/105.
- 3 cấp (fixture B): absoluteStart 20.5, duration 3.5, visible [0,3.5),
  in/out 50/53.5, cumulativeSpeed 1 (= 1×2×0.5), path [top,mid,in].
- Curve 2 cấp và 3 cấp cho CÙNG số: slice (0,1.25)→(2,1.75),
  in/out ramp 11.125/14.125 — chứng tỏ độ sâu không làm lệch curve.
- Split: 2 cấp mốc 12.5 → leafLocalTime 2, source 102; biên lá 11.5/14
  → 0/100 và 5/105; ngoài lá → null. 3 cấp mốc 21.5 → 1/51. Split lá
  có curve mốc 5.5 → leafLocalTime 1.5, source 11.78125 (= 10 +
  ∫[0,1.5) (1+0.25t) dt; số 11.640625 ban đầu là tính nhầm v(1.5)).
- Sâu đúng 8 tầng OK (depth 8, absolute 0/duration 4), sâu 9 tầng throw
  "vượt độ sâu"; vòng lặp subSpec throw "vòng lặp"; chain/lá không khớp
  throw; dùng lại subSpec ở 2 anh em đều OK (absolute 0 và 4).
- Parity .ts ↔ .js: compose qua `nested.ts`, `nested.js` và package cho
  kết quả JSON bằng nhau trên cả fixture A và B.

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- `npx tsc --noEmit` (apps/web) còn 4 lỗi, TẤT CẢ đều ở file ngoài phạm
  vi luồng này nên luồng này không sửa (tránh đụng phần luồng khác):
  `splitPatch.store.test.ts` (TS7016 validate.js, TS2352 cast),
  `splitPatch.test.ts` (TS5097 import đuôi .ts),
  `store.ts:1214` (TS2339 `reverse` không có trên type `Clip`). Không
  có lỗi nào nhắc tới nested.ts / nestUtils.ts / nestedDeep.test.ts
  (file test mới đã thêm vào exclude của tsconfig theo đúng quy ước
  mọi `*.test.ts` khác). Parent cần xác nhận 4 lỗi này thuộc luồng nào
  của đợt 15 trước khi coi tsc là sạch.
- Chưa nối helper đệ quy vào `store.ts` (split/trim thật trên timeline):
  luồng này chỉ làm tầng thuần + helper; `splitClipAt`/`trimClip` vẫn
  đi đường cũ. Việc dùng `nestedSplitOffset` trong store action là việc
  của luồng tích hợp, không thuộc phạm vi luồng này (và task cấm sửa
  ngoài code nested/speedcurve).
- Chưa có test render MP4 thật cho lá sâu đã trim/split (chỉ test logic
  + đối chiếu placement với flattenNested): render lá sâu là việc của
  luồng render.
- `patchClip` đổi duration trực tiếp vẫn chưa cắt/dịch curve (nợ cũ từ
  đợt 13, xem LIMITS R5) — không thuộc phạm vi luồng này.
- `curveDropped` vẫn chưa tới được panel (nợ R5) — không thuộc phạm vi
  luồng này.
- Trùng id clip trong cùng tầng thì helper lấy clip đầu tiên thắng:
  project hợp lệ không có trùng id, nhưng helper không báo lỗi cho
  trường hợp này (chọn im lặng theo flatten, không fail fast).
- `dist/` không được tạo bởi luồng này (không chạy vite build); nếu
  parent chạy build để kiểm chứng thì đó là build artifact, KHÔNG đưa
  vào batch stage.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `packages/video-spec/src/nested.ts`: `ComposedLeafWindow` +
  `composeNestedLeafWindow` (+ `findChildInSubSpec` nội bộ).
- `packages/video-spec/src/nested.js`: mirror tay của hàm trên (giữ đồng
  bộ — render worker require trực tiếp file này).
- `apps/web/src/components/nested/nestUtils.ts`: `DeepLeafMedia`,
  `deepNestedLeafVisibleSpeedCurve`, `NestedSplitPoint`,
  `nestedSplitOffset` (+ `leafSourceFields`/`leafSourceTimeAt`/
  `leafSourceRange` nội bộ); docstring `nestedLeafVisibleSpeedCurve`
  thêm ghi chú tương thích ngược (không đổi logic hàm này).
- `apps/web/src/components/speed/nestedDeep.test.ts`: test mới (16 case).
- `apps/web/tsconfig.json`: thêm file test mới vào exclude (đúng quy ước
  mọi `*.test.ts` khác).
- `docs/PHASE9_ROUND15_T3_NESTED_DEEP_LIMITS.md`: file này.
