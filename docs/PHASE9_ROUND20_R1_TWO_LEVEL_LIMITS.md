# Phase 9 đợt 20 — R1: Hợp curve hai tầng thật ở render — LIMITS

Ngày: 2026-10-29. Luồng R1 trong đợt lớn round 20.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop, KHÔNG sửa build-loop-log.md (parent gộp batch — theo luật luồng).
KHÔNG sửa store.ts, nestUtils.ts, nestedPreview.ts, i18n.

Đóng nợ: đợt 19 G2 §1c/§3 ("hợp curve hai tầng: spec CẤM nên implement
FAIL-FAST, không hợp sai") + spec đợt 18 §5/§6 ("hợp curve hai tầng là
nợ mở"). Từ đợt này, fail-fast hai tầng ở tầng RENDER không còn áp cho
lá video/audio mang curve riêng (xem §1); fail-fast ở tầng STORE của G2
(patchClip / updateNestedDeepInnerClip chặn tạo trạng thái hai tầng) VẪN
CÒN — xem §4, parent/luồng store quyết định có nới hay không.

## 1. Việc đã làm

### 1a. Ngữ nghĩa hợp — định nghĩa bằng tích phân, không nhân easing

Lá video/audio mang speedKeyframes riêng `s_i(x)` (x = thời gian con
tính từ đầu lá) nằm dưới nested có curve `s_o(T)` (T = thời gian output
tính từ đầu nested). Với đoạn khả kiến `[vs, ve)` của lá trong timeline
con, đặt `T_start = τ_o(vs − in)`, `T_end = τ_o(ve − in)`
(τ_o = nghịch đảo tích phân của curve ngoài, đúng `mapChildOffset`),
`leftCut = vs − s_lá`. Thời gian nguồn của lá tại thời gian output
ngoài `t' ∈ [0, T_end − T_start)` là HỢP của hai ánh xạ:

```
x(t')   = leftCut + ∫_{T_start}^{T_start+t'} s_o
src(t') = lá.in + ∫₀^{x(t')} s_i
c(t')   = s_o(T_start+t') · s_i(x(t'))      (quy tắc dây chuyền)
```

Mọi tích phân/đánh giá dùng đúng engine `speedramp.js`
(`integrateSpeed`/`speedAt`), không viết lại công thức tích phân.
`in' = lá.in + ∫₀^{leftCut} s_i`, `out' = in' + ∫_{leftCut}^{leftCut+(ve−vs)} s_i`
(capped ở `out` gốc như đường ramp đợt 18; render ramp bỏ qua `out`,
dùng `in + ∫` nên cap này chỉ giữ spec nhất quán).
Curve trong được validate đúng luật ramp thường trước khi hợp
(`validateNestedRamp`: t trong `[0, duration lá]`, v trong `[0.25, 4]`,
≤ 128 keyframe, easing hợp lệ, bezier x trong `[0, 1]`).

### 1b. Mã hoá tốc độ hợp thành speedKeyframes cho clip phẳng

Tốc độ hợp `c(t')` nói chung KHÔNG thuộc họ speedKeyframes (tích của
hai easing không còn là một easing), nên mã hoá là XẤP XỈ có kiểm soát,
không claim đúng hệt — trừ hai trường hợp hằng ở §1c:

- Chia đoạn tại mọi điểm gãy: knot ngoài trong `(T_start, T_end)` +
  ảnh ngược τ của knot trong trong `(leftCut, leftCut + (ve−vs))`.
- Mỗi khoảng gãy chia nhỏ tối đa 0.25s; mỗi đoạn con dùng MỘT keyframe
  bezier Hermite với `x1=1/3, x2=2/3` (khi đó `X(t)=t` nên `Y(t)` là đa
  thức Hermite bậc 3 đúng nghĩa: khớp giá trị và đạo hàm hai đầu —
  đạo hàm trái/phải tại điểm gãy được tính riêng, vì đạo hàm có thể
  nhảy tại knot). Đoạn có Δv ≈ 0 nhưng đạo hàm ≠ 0 thì chẻ đôi cho tới
  khi hai đầu khác nhau (tối đa 200 lần, không vượt 128 điểm).
- Hệ quả đo được: linear×linear cho `c` là đa thức bậc 3 nên Hermite
  tái tạo ĐÚNG HỆT (sai số đo ~1e-15); easing khác sai số O(h⁴),
  h ≤ 0.25s (ease-in×bezier đo được: sai tốc độ tối đa 1.5e-5, sai tích
  phân tối đa 4.2e-6 — xem §2).
- Giới hạn validator phẳng được tôn trọng bằng fail-fast, không lặng
  lẽ vượt: điểm gãy đã > 128 → fail; tốc độ hợp tại điểm mẫu vượt
  `[0.25, 4]` → fail với thông báo rõ "tích tốc độ ngoài × tốc độ trong
  vượt khoảng" (tích có thể vượt khoảng dù mỗi tầng đều hợp lệ).
  Khi duration dài, bước chia tự nới (×1.5, tối đa 6 vòng) rồi lấy mẫu
  đều phần còn lại để vừa 128 — độ chính xác giảm theo bước lớn hơn,
  xem §4.

### 1c. Hai trường hợp hằng — ĐÚNG HỆT bằng slice, không qua Hermite

- **Trong hằng `v_i`** (mọi keyframe cùng v, kể cả 1 keyframe): hợp về
  slice curve ngoài trên đoạn output của lá, nhân mọi v với `v_i`
  (đường đợt 18, chỉ đổi hệ số từ speed hằng sang `v_i`).
- **Ngoài hằng `v_o`** (kể cả curve ngoài hằng đã gộp ở `nestedWindow`,
  và cả speed hằng thuần không curve): hợp về slice curve trong trên
  đoạn khả kiến, rồi đổi biến tuyến tính `t' = y / v_o`, `v' = v · v_o`
  (easing giữ nguyên vì `p` không đổi qua đổi biến tuyến tính).
  Trường hợp này cũng sửa một đường cũ: trước đây lá mang curve dưới
  speed hằng ≠ 1 (hoặc bị cắt trái) bị fail; nay hợp đúng hệt thay vì
  fail, và lá mang curve dưới speed = 1 không cắt nay cũng tính
  `in'/out'` bằng tích phân thay vì công thức tốc độ hằng cũ (vốn sai
  cho lá ramp).

### 1d. Hai tầng nested đều có curve nay thành công qua cùng đường

Lá của tầng trong sau flatten đã là clip ramp tổng hợp (đường đợt 18);
khi tầng ngoài là ramp, lá đó chính là "lá mang curve riêng" ở §1a nên
đi đúng đường hợp hai tầng (tính kết hợp của tích phân: hợp của hợp
vẫn là hợp ba ánh xạ, sai số mã hoá cộng dồn theo từng tầng nhưng mỗi
tầng vẫn bị chặn bởi §1b). Đây là trường hợp "hai tầng đều có curve"
trong bảng spec đợt 18 §5 — nay không còn fail.

### 1e. Module web mới `apps/web/src/lib/twoLevelCurve.ts` (preview dùng sau)

Module thuần MỚI, KHÔNG sửa `nestedPreview.ts`. Mirror đúng toán
render bằng engine `@repo-1/video-spec` (`integrateSpeed`/`speedAt`/
`sliceSpeedKeyframes`): `composeTwoLevelCurve` trả về `startOffset`
(tương đối so với start của nested), `duration`, `in`, `out`,
`speedKeyframes` đã mã hoá (Hermite / slice đúng hệt khi một tầng hằng
— cùng thuật toán render), và hàm hợp ĐÚNG `speedAt`/`sourceAt`.
Kèm `twoLevelTauOffset` (mirror `mapChildOffset`) và
`isConstantSpeedCurve`. Test web kiểm chứng cùng input cho cùng output
với render trong 1e-6 ở case linear (số tính tay, xem §2). Parent nối
module này vào `nestedPreview.ts` ở đợt sau; luồng này KHÔNG tự nối
(theo phân công, không sửa `nestedPreview.ts`).

### 1f. Vẫn fail-fast (không đổi, đã có test)

- Lá reverse (có/không curve) dưới ramp; lá curve + reverse dưới tốc
  độ hằng (validator phẳng cũng cấm speedKeyframes + reverse).
- Lá mang attachment thời gian khác dưới ramp: animations keyframes,
  track, karaoke, volumeKeyframes (thời gian attachment qua τ phi tuyến
  vẫn chưa nội suy — nợ mở cũ, không thuộc đợt này).
- Lá phi-media (text/sticker/image) mang speedKeyframes dưới ramp hoặc
  dưới tốc độ hằng ≠ 1 / bị cắt trái (không có trục nguồn để hợp).
- Curve trong không hợp lệ; tốc độ hợp vượt `[0.25, 4]`; > 128 keyframe.
- Fade audio của lá audio có curve: dùng lại công thức rút ngắn theo
  phần cắt đo bằng τ của đợt 18 (không đổi).

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test render mới `server/render/src/test_round20_two_level_render.js` | **42/42 pass** |
| — (a) ngoài linear 1→2 + trong linear 1→2, số tính tay | start 0, duration 4, in 0, out 9; exact sourceAt(2)=3.0208333, speedAt(2)=2.125, sourceAt(4)=9, speedAt(4)=4 — sai số < 1e-6; encoded khớp exact < 1e-6 (cả tốc độ lẫn tích phân) |
| — (a2) cắt trái window [1,7) | start 0, duration 3.4833, in' 1.083333, out' 9 |
| — (b) ngoài ease-in + trong bezier | duration 4, ≤ 128 keyframe; encoded khớp exact: tốc độ tối đa 1.5e-5, tích phân tối đa 4.2e-6 (< 1e-3) |
| — (c) hằng: trong hằng 1.5, trong 1 keyframe, ngoài hằng 2 (curve), ngoài speed hằng 2, ngoài speed 1 | slice đúng hệt: [(0,1.5),(4,3)] out 9; [(0,2),(3,4)] out 9; speed 1 giữ nguyên curve trong |
| — (d) fail-fast reverse/attachment/text/curve lỗi/tích vượt | 8/8 throw đúng thông báo |
| — (d8) hai tầng nested đều có curve | thành công: duration 2.9282, in 0, out 6 |
| — (e2) audio có curve dưới ramp | thành ramp hợp, duration 4, fade 1/1, out 9 (chỉ flatten, chưa render MP4 audio — xem §4) |
| — (e) MP4 render thật case (a) | render ok, duration ≈ 4s; frame t=0.5 đỏ (nguồn ≈ 0.55), t=2.0 đỏ (≈ 3.02), t=3.0 xanh (≈ 5.54), t=3.9 xanh (≈ 8.61) |
| Test web mới `apps/web/src/lib/twoLevelCurve.test.ts` | **12/12 pass** (τ, (a)/(a2)/(b)/(c), hằng, throw vượt khoảng/curve lỗi/ngoài cửa sổ) |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (test mới đã thêm vào exclude theo quy ước) |
| `npx vite build` (apps/web) | pass, 4.09s (chỉ warning chunk > 500kB có sẵn từ trước) |
| Hồi quy render cũ | test_nested_render 24/24, test_nested_r3 43/43, test_nested_e2e 28/28, test_round17_n3 11/11, test_round16_h2 13/13 |
| Hồi quy preview web | nestedRampPreview 13/13, nestedPreview 46/46 |
| Test đợt 18 `test_round18_nested_speed_render.js` | **66/68** — 2 fail là 2 assertion CŨ ĐÃ LỖI THỜI, cố tình bị thay thế (xem §3) |

## 3. Test đợt 18: 2 fail có chủ đích, không phải hồi quy

`test_round18_nested_speed_render.js` còn expect throw ở:

- U6 "lá có curve riêng dưới ramp" — nay hợp thành công (test mới (a)).
- U6 "hai tầng đều có curve" — nay hợp thành công (test mới (d8)).

Mọi check còn lại của test đợt 18 (66 check, gồm cả render MP4 R1/R2
và fail-fast cho anim leaf, out lệch, curve lỗi, tích v·c vượt) vẫn
pass. Luồng này KHÔNG sửa test_round18 (không thuộc file được sửa);
parent muốn test đợt 18 xanh lại thì cập nhật 2 assertion đó ở đợt sau
theo ngữ nghĩa mới, không phải sửa code render cho qua.

## 4. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **Preview chưa nối:** `nestedPreview.ts` vẫn throw cho hai tầng
  (test `nestedRampPreview` vẫn khóa fail-fast đó) — module web mới chỉ
  là toán sẵn để nối, chưa phải parity preview. Tới khi parent nối,
  render và preview sẽ lệch nhau đúng ở trường hợp hai tầng (render
  thành công, preview từ chối).
- **Store vẫn chặn tạo trạng thái hai tầng:** guard G2 ở `patchClip` /
  `updateNestedDeepInnerClip` (chặn đặt curve khi tổ tiên/cây con đã có
  curve) chưa được nới. Vì vậy tính năng render này hiện chỉ tới được
  qua spec viết tay / flatten trực tiếp, chưa tới được qua UI cho tới
  khi luồng store quyết định nới guard (kèm cả trường hợp curve hằng
  mà G2 từng chặn thừa — render nay đã xử lý hằng đúng hệt, xem §1c).
- **Mã hoá là xấp xỉ ngoài trường hợp hằng/linear×linear:** sai số
  Hermite O(h⁴) với h ≤ 0.25s ở duration ngắn là rất nhỏ (đo §2), nhưng
  duration dài + nhiều điểm gãy sẽ nới bước để vừa 128 keyframe nên sai
  số tăng theo bước; trường hợp điểm gãy đã > 128 thì fail thay vì
  render gần đúng. Đây là giới hạn của định dạng speedKeyframes, không
  phải lỗi triển khai — muốn đúng hệt mọi easing cần một dạng biểu diễn
  curve hợp riêng ngoài speedKeyframes (nợ kiến trúc, không làm ở đây).
- **Render ramp theo đoạn 0.2s cộng thêm sai số riêng:** `planSpeedSegments`
  dùng tốc độ giữa đoạn, nên MP4 thực tế lệch thêm so với tích phân
  đúng (cùng bản chất với ramp một tầng). Các probe MP4 trong test đều
  chọn xa biên màu (> 0.9s nguồn) nên không nhạy với sai số này.
- **Chưa kiểm chứng:** transition trong project con giữa hai lá đều
  mang curve (cặp nguyên vẹn vẫn qua đường τ của `flattenInner` nhưng
  chưa có test MP4 riêng); render MP4 cho lá audio hai tầng (chỉ mới
  flatten + fade); lá hai tầng bị cắt phải kèm attachment đã bị chặn
  (không thuộc phạm vi); clip dài > ~30s với nhiều keyframe (chỉ đo
  duration ≤ 6s ở test).
- **Split/trim nested có curve vẫn bị từ chối** (luồng G2/G3, không đổi
  trong đợt này); validator `video-spec` cho nested có curve vẫn là nợ
  cũ phát hiện ở đợt 19 G2 (không thuộc luồng này).
- `apps/web/dist/` đã được `vite build` viết lại trong lúc kiểm chứng
  — đó là output build, KHÔNG đưa vào batch stage.

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `server/render/src/nested.js`: khối đợt 20 R1 (đạo hàm speedAt,
  `twoLevelExact`, `encodeTwoLevelCurve`, tách curve khỏi attachment
  trong `mapClip`, nhánh hợp hai tầng cho ngoài ramp + ngoài hằng,
  export helper cho test), cập nhật comment header fail-fast.
- `server/render/src/test_round20_two_level_render.js`: test render mới
  (42 check, gồm MP4 thật).
- `apps/web/src/lib/twoLevelCurve.ts`: module web mới (hợp hai tầng
  mirror render).
- `apps/web/src/lib/twoLevelCurve.test.ts`: test web mới (12 check).
- `apps/web/tsconfig.json`: thêm `twoLevelCurve.test.ts` vào exclude
  (quy ước file test).
- `docs/PHASE9_ROUND20_R1_TWO_LEVEL_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `apps/web/src/store.ts`, `apps/web/src/components/nested/nestUtils.ts`,
  `apps/web/src/lib/nestedPreview.ts`, file i18n, test của luồng khác
  (kể cả `test_round18_nested_speed_render.js` — xem §3).
- File stage trong `~/workspace/repo-1-push/paths-loop/` và
  `build-loop-log.md` (parent gộp/log).
- Không push, không tag/release, không ghi qua GitHub, không binary.
