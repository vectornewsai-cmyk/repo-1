# Phase 9 đợt 16 — Luồng H2: nested đệ quy nối store + render thật (LIMITS)

Ngày: 2026-10-28. Luồng H2 trong đợt lớn round 16.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop (parent gộp batch — xem §5).

Đóng nợ đợt 15 (xem docs/PHASE9_ROUND15_LIMITS.md §1 T3 và
docs/PHASE9_ROUND15_T3_NESTED_DEEP_LIMITS.md §3):
- "chưa nối helper đệ quy vào store.ts (split/trim thật trên timeline)";
- "chưa có test render MP4 thật cho lá sâu đã trim/split".

## 1. Việc đã làm

### 1a. Vì sao trước đợt này split/trim nested trên timeline là sai

- `splitClipAt` trong store.ts không có nhánh `kind === "nested"` nên
  rơi xuống cuối hàm và trả null → splitAtPlayhead / splitClipAtTimes
  không tách được nested clip nào (user bấm tách mà không có gì xảy ra).
- `trimClip` đi đường generic cho nested (vì `isSpeedable` chỉ nhận
  video/audio): mép trái chỉ đổi `{start, duration}` mà không dời
  `trim.in`, mép phải chỉ đổi `duration` mà không dời `trim.out` →
  phá bất biến `duration = (trim.out − trim.in) / speed` của NestedClip,
  và cửa sổ lá sâu tính từ trim cũ sẽ sai (trim đổi mà nội dung không
  đổi theo). Đây là bug thật, không phải thiếu tính năng suông: trim
  trái nested trước đợt này thực chất chỉ rút ngắn từ phía phải.
- `patchClip` đổi duration trực tiếp cũng mắc lỗi tương tự (chỉ đổi
  duration, trim giữ nguyên) — đã sửa cùng đợt (xem §1c).

### 1b. Hàm thuần mới trong nestUtils.ts (đúng hàm store.ts gọi)

- `splitNestedClip(top, t, idGen)`: tách nested clip ngoài cùng tại t.
  Điểm cắt trong subSpec = `trim.in + (t − start) × speed`. Hai nửa
  chia nhau cửa sổ trim, giữ nguyên subSpec (cùng tham chiếu — an toàn
  cho snapshot undo), giữ nguyên name. Trả null khi: t ngoài clip,
  speed/trim không hợp lệ, hoặc clip có speedKeyframes/reverse (render
  worker cấm 2 field này ở nested — xem server/render/src/nested.js
  `nestedWindow` — nên store không tự bịa ngữ nghĩa cho chúng).
  Không áp ngưỡng 0.2s cho nửa tách: nửa tách tuân margin 0.05s của
  splitClipAt (giống mọi kind khác).
- `trimNestedClip(top, edge, target)`: trim theo đích tuyệt đối.
  Mép trái: `trim.in` dời theo `shift × speed` (mở rộng tối đa tới
  `trim.in = 0`); mép phải: `trim.out = trim.in + duration × speed`,
  tối đa tới `nestedSourceDuration(subSpec)`. Trả null khi vượt nguồn,
  duration mới < 0.2s, hoặc speedKeyframes/reverse. Sai số float 1e-9
  được dung nạp ở hai biên nguồn.
- Cả hai hàm đều CHỈ đụng trim của tầng ngoài cùng, KHÔNG viết lại clip
  lá bên trong. Đó là ngữ nghĩa "cửa sổ, không phải edit phá hủy" của
  R5/T3: cửa sổ lá sâu sau edit được SUY RA bằng
  `composeNestedLeafWindow` / `deepNestedLeafVisibleSpeedCurve`, không
  cần (và không được) ghi đè lên lá. Helper 1 tầng cũ
  (`nestedLeafVisibleSpeedCurve`, thuần theo trim, không khớp cây) được
  giữ nguyên 100% — đợt này không đụng tới nó, và test hồi quy cũ vẫn
  chạy (xem §2).

### 1c. Nối vào store.ts (3 đường thật + 1 đường kề)

- `splitClipAt`: nhánh `kind === "nested"` mới, gọi
  `splitNestedClipPure` (id mới bằng `uid("c")`). Nhờ đó
  `splitAtPlayhead` và `splitClipAtTimes` tự động tách được nested mà
  không cần sửa thêm code ở hai action đó; `clampSplitOuterTransitions`
  vẫn chạy sau đó như cũ (nested không có transition nên không bị kẹp).
- `trimClip`: chặn riêng cho nested NGAY SAU kiểm tra track khóa, TRƯỚC
  đường generic. Đích tính theo đúng quy ước generic: snap frame
  (trái snap gần nhất, phải snap floor), chặn nguồn (trái tối đa tới
  `trim.in = 0`, phải tối đa tới hết subSpec), chặn đè clip kề khi
  không ripple, ripple dồn clip sau qua `rippleTrimRight` khi bật ripple.
  Caption/karaoke/curve: nested không phải source/linked caption và
  không mang speedKeyframes nên không có bước follow nào — không phải
  thiếu sót, mà là không áp dụng.
- `patchClip`: đổi duration của nested mà patch không tự đặt trim thì
  `trim.out` đi theo thành `trim.in + duration × speed` (cùng bất biến
  như trên). Patch tự đặt trim thì trim của patch thắng.
- Không sửa: `moveClip`/`moveSelectionBy` (chỉ đổi start, trim không
  đổi là đúng), `updateNestedInnerClip` (sửa clip con trực tiếp 1 tầng
  — việc sửa clip con ở cấp sâu hơn qua store action vẫn là nợ, xem §3).

### 1d. Test mới

- `apps/web/src/components/speed/nestedStore.test.ts` (thuần, chạy bằng
  node trực tiếp): 11 case — fixture 3 cấp (top/mid/inner/lá) và 2 cấp,
  split rồi đối chiếu cửa sổ lá bằng helper đệ quy + flattenNested,
  trim trái/phải/mở rộng, split rồi trim tiếp, speed 2, biên ngoài clip.
- `apps/web/src/components/speed/nestedStore.store.test.ts` (qua store
  thật, bundle esbuild như mẫu T4): 8 case — splitAtPlayhead, trimClip
  trái/phải, splitClipAtTimes, patchClip, tách sát mép, trim phải bị
  chặn khi đè clip kề, trim phải ripple dồn clip sau.
- `server/render/src/test_round16_h2_nested_deep_render.js` (render MP4
  thật qua render.js, FFmpeg 8.1.2): 13 check — top nguyên vẹn (nguồn
  3–5: đỏ → xanh lá), nửa phải sau split (trim [1,2): toàn xanh lá),
  top sau trim trái (trim [0.5,2): đỏ → xanh lá), kèm duration video
  qua ffprobe. Số trim/màu ghi cứng suy tay từ fixture (không lấy từ
  code split/trim — tránh kiểm chứng vòng tròn, cùng triết lý T4).

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test thuần mới `nestedStore.test.ts` | **11 pass, 0 fail** |
| Test store thật `nestedStore.store.test.ts` (esbuild bundle) | **8 pass, 0 fail** |
| Test render MP4 thật `test_round16_h2_nested_deep_render.js` | **13/13 check pass** |
| Hồi quy `nestedDeep.test.ts` (đợt 15 T3) | **16 pass, 0 fail** |
| Hồi quy `nestedSpeedcurve.test.ts` (đợt 14 R5) | **22 pass, 0 fail** |
| Hồi quy `speedcurveTrim.test.ts` (đợt 13 C5) | **18 pass, 0 fail** |
| Hồi quy `nestUtils.test.ts` | **28 pass, 0 fail** |
| Hồi quy `splitPatch.store.test.ts` (đợt 15 T4, bundle) | **12 pass, 0 fail** |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (sau khi thêm 2 file test mới vào exclude của tsconfig theo đúng quy ước mọi `*.test.ts` khác) |
| `vite build` (apps/web) | **pass** (built in 9.69s; chỉ warning chunk > 500kB có sẵn từ trước, không phải lỗi) |

Số đo thật đáng chú ý (fixture 3 cấp: lá [0,8), inner trim [2,6),
mid trim [1,3), top trim [0,2) → lá 3–5):
- Split top tại t=1 qua store: trái trim [0,1) → lá 3–4; phải
  trim [1,2) → lá 4–5; cả hai nửa `validateNestedClip` rỗng.
- Trim trái top +0.5 qua store: start 0.5, trim [0.5,2) → lá 3.5–5.
- Trim phải top −1 qua store: duration 1, trim [0,1) → lá 3–4.
- Split tại [0.5, 1.5] qua store: 3 mảnh trim [0,0.5) / [0.5,1.5) /
  [1.5,2); mảnh giữa → lá 3.5–4.5.
- Render thật 64×64: top nguyên vẹn duration ≈ 2s (frame 0.3 đỏ,
  1.7 xanh lá); nửa phải sau split duration ≈ 1s (frame 0.2 và 0.8 đều
  xanh lá — nếu split không dời trim thì nửa này sẽ ra đỏ, test sẽ
  rớt); top sau trim trái duration ≈ 1.5s (frame 0.2 đỏ, 1.3 xanh lá).
- Clip lá bên trong không bị sửa bởi bất kỳ thao tác nào: test khóa
  `left.subSpec === top.subSpec` và trim gốc không đổi sau split/trim.

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- Render chỉ đo ở **64×64, 30fps, nguồn màu phẳng tổng hợp** (đỏ 0–4s,
  xanh lá 4–8s), chưa đo ở 1080p/4K, chưa đo trên footage máy quay thật,
  chưa đo với speed khác 1 ở tầng render (speed 2 chỉ có ở tầng logic
  thuần). Màu phẳng qua yuv420p vẫn phân biệt rõ đỏ/xanh lá nên kết
  luận màu đứng vững ở cỡ này; không suy ra cho nội dung chi tiết.
- Sâu tối đa vẫn là **MAX_NESTED_DEPTH = 8** của helper đợt 15 T3;
  test đợt này chỉ phủ **2–3 cấp** (và speed 2 ở 1 cấp ngoài). Sâu 4–8
  cấp qua store chưa có test riêng — công thức đệ quy là một, nhưng
  chưa đo thì chưa claim.
- Lá bị trim ngoài cắt hết ở tầng nào → helper đệ quy trả null (kế
  thừa từ T3): store split/trim không bao giờ tạo ra trường hợp đó cho
  chính top vừa edit (trim mới luôn nằm trong trim cũ), nhưng một top
  đã bị trim sẵn từ trước vẫn có thể chứa lá bị cắt hết — render
  worker bỏ lá đó (flatten), không báo lỗi riêng.
- **Đổi speed của nested clip qua patchClip vẫn là nợ mở**: patchClip
  đợt này chỉ đi theo duration, không tính lại duration theo speed
  mới (`duration = (trim.out − trim.in) / speed`). Đổi speed nested mà
  không đổi duration sẽ phá bất biến cho tới khi user sửa duration.
- **Sửa clip con ở cấp sâu hơn 1 tầng qua store action vẫn chưa có**:
  `updateNestedInnerClip` chỉ sửa clip con trực tiếp của một nested
  clip; muốn trim/split một lá ở cấp 2–3 mà không rã nested thì vẫn
  phải đi qua helper thuần rồi tự ghi lại cây (chưa có action).
- Trim trái nested **không kiểm tra đè clip trước** (giữ đúng hành vi
  đường generic cho clip thường) — kéo mép trái qua clip kề trước vẫn
  tạo overlap mà store không chặn.
- Hai nửa sau split **giữ nguyên name** (cùng tên): unnest và hiển thị
  không phân biệt được hai nửa bằng tên, chỉ bằng id/start.
- Nested clip có **speedKeyframes/reverse** bị split/trim từ chối
  (trả null / giữ nguyên, không báo lỗi riêng cho user): render worker
  cấm 2 field này ở nested nên store không bịa ngữ nghĩa; nhưng user
  bấm tách mà không thấy gì xảy ra cũng không thấy thông báo — UX này
  chưa tốt, để đợt sau thêm toast (không thuộc phạm vi đợt này).
- `dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage. Thư mục tạm của test render đã tự dọn khi pass.
- Trong lúc chạy test render, `/tmp` (tmpfs 512MB) đã đầy do file tạm
  của luồng khác (`/tmp/h6-photo-*` ~347MB + `/tmp/h6` ~162MB) khiến
  lần chạy đầu lỗi "No space left on device". Luồng này KHÔNG xóa file
  của luồng khác; lần chạy sau dùng `TMPDIR` trỏ sang scratch trong
  workspace (đã dọn sau khi pass) và đạt 13/13. Nợ chung: các luồng nên
  dọn `/tmp` của mình sau khi chạy, hoặc test render nên dùng scratch
  workspace thay vì `/tmp` mặc định.

## 4. Kiểm chứng build

- `npx tsc --noEmit` (apps/web): 0 lỗi (chạy lại sau khi thêm 2 file
  test mới vào tsconfig exclude — lần chạy giữa chừng có hiện lỗi của
  luồng khác đang sửa store.ts cùng lúc, chạy lại sau đó chỉ còn lỗi
  exclude của chính luồng này, đã sửa xong; xem §3 về edit đồng thời).
- `vite build` (apps/web): **pass, built in 9.69s**. Cảnh báo chunk >
  500kB sau minify là cảnh báo có sẵn của repo, không phải lỗi mới.

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/components/nested/nestUtils.ts`: `splitNestedClip`,
  `trimNestedClip` (+ import `nestedEffectiveSpeed`,
  `nestedSourceDuration`).
- `apps/web/src/store.ts`: import 3 hàm nested mới; nhánh split nested
  trong `splitClipAt`; chặn trim nested trong `trimClip`; nhánh
  duration-nested trong `patchClip` (apply).
- `apps/web/src/components/speed/nestedStore.test.ts`: test thuần mới
  (11 case).
- `apps/web/src/components/speed/nestedStore.store.test.ts`: test qua
  store thật (8 case, bundle esbuild).
- `apps/web/tsconfig.json`: thêm 2 file test mới vào exclude (đúng quy
  ước mọi `*.test.ts` khác).
- `server/render/src/test_round16_h2_nested_deep_render.js`: test render
  MP4 thật mới (13 check).
- `docs/PHASE9_ROUND16_H2_NESTED_STORE_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, để tránh đụng phần luồng khác đang sửa cùng cây):
- Helper 1 tầng cũ `nestedLeafVisibleSpeedCurve` và toàn bộ file
  `nested.ts`/`nested.js` của spec.
- File stage trong `~/workspace/repo-1-push/paths-loop/` và
  `build-loop-log.md` (parent gộp/log).
- File tạm của luồng khác trong `/tmp` (xem §3).
