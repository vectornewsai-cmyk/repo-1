# PHASE9_ROUND25_I2 — Nối nestedSplitOffset vào store action + panel — LIMITS

## Vấn đề gốc

Đợt 24 H1 đã có helper thuần `nestedSplitOffset` đảo ánh xạ τ bằng
bisection 100 vòng (test `nestedSplitTau24` 8/8) nhưng helper chưa có
caller sống ngoài test: `splitNestedDeepInnerClip` trong store nhận
`splitTime` theo timeline của tầng chứa lá, KHÔNG nhận mốc timeline
ngoài. Đợt này nối đúng chỗ đó mà KHÔNG đổi ngữ nghĩa tham số của
action cũ (đổi sẽ phá caller/panel hiện tại — xem LIMITS H1 §"Nợ còn
lại" (1)).

## Việc đã làm

### Store action mới: `splitNestedDeepInnerClipAtOuterOffset`

`apps/web/src/store.ts` — interface (dòng ~603) + implementation
(dòng ~2484), ngay sau `splitNestedDeepInnerClip` cũ. Import thêm
duy nhất `nestedSplitOffset as nestedSplitOffsetPure` vào import
`nestUtils` sẵn có (không đụng helper H1, không đụng
`packages/video-spec`).

Đường đi (đúng lệnh đợt: offset ngoài → leafLocalTime → action cũ):

1. Resolve cây bằng id từ `get().spec` hiện tại (host track → top
   qua `asNestedClipPure` → từng tầng chain qua `subSpec` → track
   chứa lá → lá). Không tin bản copy caller truyền vào — helper
   cũng khớp chain theo id trong cây nên hai phía nhất quán.
2. `nestedSplitOffset(top, chain, leaf, outerTime)`:
   - throw (curve sai hình dạng) → chặn `nested.splitOffsetCurveInvalid`;
   - null (mốc ngoài cửa sổ khả kiến) → chặn
     `nested.splitOffsetOutOfRange`.
3. Kẹp margin 0.05s trên `leafLocalTime` (mirror
   `N3_SPLIT_MARGIN` — private trong `nestUtils`, xem §"Mirror" dưới)
   → chặn `nested.splitOffsetTooCloseToEdge`.
4. Gọi `splitNestedDeepInnerClipPure` với
   `splitTime = leaf.start + leafLocalTime` đúng như lệnh đợt;
   hàm thuần từ chối (kind không hỗ trợ, clip đích là nested, lá
   reverse đang có curve, không có in/out) → chặn
   `nested.splitOffsetInnerFailed`.
5. Thành công → 1 `execCommand` ("Tách clip con sâu theo mốc ngoài
   (đảo τ)"), trả `{ ok: true, leafLocalTime, splitTime }`.

Ngữ nghĩa mốc ngoài: thời gian TUYỆT ĐỐI trên timeline ngoài của
nested cha, đã gồm `top.start` — cùng khung với
`ComposedLeafWindow.absoluteStart` của helper (mốc neo H1: top
start=10, mốc 11.4641s → lá 2.0s). Panel ghi rõ điều này bằng nhãn
"timeline ngoài" + nút "Lấy từ playhead" (playhead cũng ở khung
tuyệt đối đó).

Quy ước chặn (theo các action nested trước đó):
- Mọi nhánh chặn return TRƯỚC `execCommand` → không đổi spec,
  không sinh entry undo (test khóa cả hai).
- Lỗi lookup/khóa (`splitOffsetNotFound`, `splitOffsetLocked`):
  ok:false + reason/reasonKey, KHÔNG toast — theo quy ước lỗi chain
  của đợt 24 H6 (panel vẫn hiện dòng msg từ reason).
- Các nhánh chặn do user gây ra (curve lỗi, ngoài miền, sát mép,
  hàm trong từ chối): 1 toast error + reason để panel giữ dòng msg
  bền vững — cùng mẫu nút curve 1× (store toast + panel onMsg).
- Message gốc của helper (tiếng Việt nội bộ, chứa `speedKeyframes`)
  KHÔNG lộ vào toast: locale en sẽ rò tiếng Việt nếu lộ. Đánh đổi
  trung thực: reason là câu i18n chung, chi tiết lỗi shape nằm ở
  đây và ở LIMITS H1, không nằm trong toast.

Bất biến trim: phép tách chỉ viết lại track chứa lá trong tầng sâu
nhất (`rebuildDeepLevels` của hàm thuần) nên trim/curve của top và
các tầng trung gian giữ nguyên — test khóa trim top/mid không đổi
+ ∫ tính tay khớp `trim.out − trim.in` (ramp 1→3 trên 4s:
∫₀⁴ (1 + t/2) dt = 8 = trim top [0, 8)).

### Panel: ô nhập mốc ngoài trong `InnerClipEditor`

`apps/web/src/components/nested/NestedClipPanel.tsx` — state
`outerOffset` (dòng ~150), handler `usePlayheadOffset` /
`splitAtOuterOffset` (dòng ~216), JSX (dòng ~300). Chỉ hiện cho clip
không phải nested (cùng điều kiện với nút curve 1×), kể cả lá sâu
qua `DeepInnerLevel` vì `InnerClipEditor` đã nhận đúng `chainIds`
từ đợt 24 H6. Thành công → dòng msg `nested.splitOffsetOk` với
`leafLocalTime` format bằng `fmtTime`; bị chặn → dòng msg từ
`res.reason` (store đã toast trừ lỗi lookup/khóa).

### i18n: +10 key, parity sạch

`apps/web/src/i18n/vi.json` + `en.json`, chèn sau
`nested.deepLeafCurveOk`: `splitOffsetLabel`, `splitOffsetButton`,
`splitOffsetUsePlayhead`, `splitOffsetOk`, `splitOffsetNotFound`,
`splitOffsetLocked`, `splitOffsetCurveInvalid`,
`splitOffsetOutOfRange`, `splitOffsetTooCloseToEdge`,
`splitOffsetInnerFailed`. Script parity `r6-i18n-check.cjs`:
vi=821 en=821, PASS (trước đợt: 811/811).

## Test (chạy thật, số thật)

File mới `apps/web/src/store.nestedSplitOffset25I2.test.ts` (bundle
esbuild như mẫu H6, không thêm vào tsconfig exclude vì import không
dùng hậu tố `.ts` — khác mẫu test thuần H1):

- `store.nestedSplitOffset25I2` → **20 pass, 0 fail**:
  - A1: ramp top 1→3, mốc ngoài 11.4641s (10 + τ₁₃(2), khớp làm tròn
    1e-4) → lá 2.0s (1e-9); 2 nửa dài 2s/2s, in/out 100→102→104,
    +1 entry undo, 0 toast, trim top không đổi + ∫ = 8.
  - A2: hai tầng ramp, mốc τ₁₃(τ₁₂(2)) → lá 2.0s; trim top/mid
    không đổi.
  - A3: hỗn hợp hằng+ramp (top speed 2 + mid ramp 1→2), mốc
    τ₁₂(2)/2 → lá 2.0s.
  - E biên (mỗi case chạy cả vi + en): mốc = absoluteStart 10 →
    sát mép; lá 3.98/4 → sát mép; E3 lá 3.9/4 tách thành công
    (2 nửa 3.9s/0.1s) — khóa margin không chặn thừa.
  - O ngoài miền (vi + en): 9.9 và 12.6 (ngoài cửa sổ
    [10, 12.4721]) → ngoài miền; mốc 99 ở chain sâu [mid] →
    ngoài miền. Tất cả: spec không đổi, 0 entry undo, đúng 1 toast
    error bằng đúng reason, toast en không chứa dấu tiếng Việt.
  - C curve top v=5 (vi + en) → curveInvalid, 0 undo, 1 toast.
  - I lá reverse + curve (vi + en) → innerFailed, 0 undo, 1 toast.
  - N chain sai id / track con sai id → notFound, 0 toast, spec
    không đổi, 0 undo.
- Hồi quy chạy lại (khớp số cũ, không đổi):
  - `nestedDeep.test.ts` → **16 pass, 0 fail**.
  - `nestedRampSplitTrim20.test.ts` → **18 pass, 0 fail**.
  - `nestedGateSampling22.test.ts` → **12 pass, 0 fail**.
  - `nestedSplitTau24.test.ts` → **8 pass, 0 fail**.
  - `store.nestedDeepLeaf24H6.test.ts` (bundle esbuild) → **12 pass, 0 fail**.
- `npx tsc --noEmit` trong `apps/web` → **0 lỗi**. (Lúc đầu tsc báo
  1 lỗi kiểu ở test mới do `top?.["subSpec"]?.tracks` suy kiểu `{}` —
  đã sửa bằng cast tường minh về `VideoSpec`, không đổi logic.)
- `npx vite build` trong `apps/web` → **pass** (19.22s, chỉ warning
  chunk > 500kB cũ). `apps/web/dist/` KHÔNG stage (quy ước các đợt).

## File đổi/thêm (KHÔNG push, chỉ để parent stage)

- `apps/web/src/store.ts` — import `nestedSplitOffsetPure` (1 dòng);
  interface action mới (dòng ~603); implementation action mới
  (dòng ~2484, ngay sau `splitNestedDeepInnerClip` cũ).
- `apps/web/src/components/nested/NestedClipPanel.tsx` — state
  `outerOffset` (~150), handler split/playhead (~216), JSX ô nhập +
  2 nút (~300). Không sửa `DeepInnerLevel` hay logic nút curve cũ.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — +10 key
  `nested.splitOffset*` sau `deepLeafCurveOk`.
- `apps/web/src/store.nestedSplitOffset25I2.test.ts` — test mới.
- `docs/PHASE9_ROUND25_I2_SPLIT_WIRING_LIMITS.md` — file này.
- KHÔNG đụng: `nestUtils.ts` (helper H1 giữ nguyên ngữ nghĩa),
  `packages/video-spec`, render worker, preview. Không thêm dòng
  exclude tsconfig (test store dùng import thường, không hậu tố
  `.ts`).

## Chưa phủ / nợ còn lại (không mạo nhận)

1. **Không có click-test browser thật cho panel mới:** repo không có
   Playwright runner (xem nợ chung các đợt) — ô nhập + 2 nút chỉ
   kiểm chứng bằng tsc + vite build; tầng store đã khóa bằng test
   I2, nhưng đường bấm panel → action chưa chạy trên browser thật.
2. **Mốc ngoài miền ở chain 2 tầng trở lên chưa test ở tầng store:**
   test O chỉ phủ chain [] và [mid]; store đi vòng lặp chain chung
   nên chain [mid, in] chạy cùng đường code, nhưng không có case
   store-level nào khóa nó (helper H1 đã khóa map 3 tầng ở tầng
   thuần).
3. **Biên khả kiến sau trim chưa test thành công:** split đúng tại
   `visibleStart > margin` (cửa sổ bị trim cắt đầu) về lý thuyết
   phải thành công vì margin kiểm trên `leafLocalTime`, nhưng chưa
   có case nào khóa — chỉ có E3 (biên trong của lá không trim).
4. **Clip đích là nested chưa có case store-level riêng:** đường
   code sẽ rơi vào `splitOffsetInnerFailed` qua hàm thuần (nó từ
   chối clip đích nested), nhưng test I chỉ khóa nhánh reverse +
   curve; nhánh nested-target chỉ suy ra từ code hàm thuần.
5. **Mirror margin:** hằng 0.05s trong action là mirror của
   `N3_SPLIT_MARGIN` (private trong `nestUtils`), cùng rủi ro lệch
   như mirror shape của H1 — nếu margin hàm thuần đổi, pre-check
   của action có thể lệch nhưng nhánh `innerFailed` vẫn chặn đúng
   (không tách sai), chỉ reasonKey có thể đổi từ `TooCloseToEdge`
   sang `InnerFailed`.
6. **Nợ kế thừa từ H1 (không đụng đợt này):** bezier overshoot có
   thể phá tính đơn điệu của τ (bisection về nghiệm sai mà không
   throw); parity preview↔split dưới ramp tổ tiên vẫn chưa audit;
   attachment thời gian dưới ramp vẫn fail-fast ở nơi khác.
7. **Input rỗng:** ô nhập rỗng → `Number("") = 0` → action chạy với
   mốc 0 và bị chặn (ngoài miền hoặc sát mép) kèm reason, không
   crash — nhưng panel chưa chặn riêng input rỗng bằng thông báo
   "chưa nhập". Đây là hành vi chấp nhận được, không phải bug,
   nhưng UX có thể làm rõ hơn ở đợt sau.
