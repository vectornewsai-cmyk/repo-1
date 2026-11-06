# Phase 9 đợt 22 — Luồng B: cổng lấy mẫu tốc độ hợp hai tầng chặt hơn — LIMITS

Ngày: 2026-10-29. Luồng B trong đợt lớn round 22.
Đóng nợ đợt 21 T2 §3: (a) lấy mẫu 257 điểm đều có thể bỏ sót đỉnh vượt
hẹp của bezier giữa hai mẫu; (b) lá sâu chỉ kiểm tra biên tích keyframe
(điều kiện cần, không đủ cho bezier).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop, KHÔNG sửa build-loop-log.md
(parent gộp batch — theo luật luồng).
KHÔNG sửa `store.ts`, panel, i18n, preview, timeline (phân công luồng:
chỉ chạm `nestUtils.ts` phần kiểm tra tốc độ hợp + test của nó).

## 1. Việc đã làm

### 1a. Lấy mẫu trực tiếp chặt hơn (`combinedRampSpeedInRange`)

Giữ nguyên tập mẫu cũ (257 điểm đều + knot ngoài + knot trong map ngược
qua τ) và cộng thêm hai lớp:

- **Cực trị bezier trong đoạn, giải đúng:** với đoạn bezier
  v(t) = v0 + Δv·B(p), B là cubic-bezier kiểu CSS, B'(p) = 0 ⟺
  y'(u) = 0 (vì x'(u) > 0 trên (0,1) khi x1,x2 ∈ [0,1]) mà y'(u) là đa
  thức bậc 2 (A = 3y1−3y2+1, B = 2y2−4y1, C = y1) nên giải bằng công
  thức nghiệm bậc 2, không lấy mẫu mò. Cực trị ngoài lấy trực tiếp,
  cực trị trong map ngược qua τ thành điểm mẫu ngoài. Linear/ease-in/
  ease-out đơn điệu trong đoạn nên không có cực trị trong — không cần
  xử lý riêng. Đoạn bezier thiếu mảng bezier thì dùng default CSS ease
  như `speedAt`; đoạn có x1/x2 ngoài [0,1] (curve chưa qua validate)
  thì bỏ qua, để chia nhỏ lo phần đó.
- **Chia nhỏ thích ứng:** giữa hai điểm mẫu liên tiếp đều đánh giá
  được, đánh giá thêm điểm giữa + 2 điểm 1/4; nếu lệch khỏi dây cung
  > 1e-4 (đơn vị tốc độ) thì chẻ đôi đệ quy tới sâu tối đa 10 (bề rộng
  tối thiểu ≈ khoảng gốc/1024), ngân sách 100000 lần đánh giá cho một
  lần kiểm tra (vượt thì dừng chẻ thêm, xem §3).

Tập mẫu cũ là tập con của tập mẫu mới nên case cũ cho qua vẫn cho qua,
trừ case cũ vốn đã vi phạm nhưng bị bỏ sót — đó đúng là lỗi cần chặn
(khóa bằng test B1/B9, xem §2).

### 1b. Lá sâu: cặp trong-cùng × lá + lấy mẫu toàn chuỗi

Giữ biên tích keyframe, cộng thêm hai lớp (cả hai đường
`checkTwoLevelOuterCurve` và `checkTwoLevelLeafCurve`):

- **(a) Cặp trong-cùng × lá** bằng đúng bộ lấy mẫu trực tiếp: render
  flatten từ trong ra ngoài nên bước trong-cùng này render kiểm tra
  thật ở bước mã hoá Hermite — chặn ở đây là sound (test B4: ngoài 0.3
  × giữa 3.5 × lá 3.5, tích toàn chuỗi 3.675 qua nhưng cặp trong-cùng
  12.25 bị chặn, đúng vì render bước trong đã fail).
- **(b) Lấy mẫu toàn chuỗi** (`deepComposedSpeedInRange`): tích mọi tầng
  dọc chain tại thời gian output của tầng ngoài, đánh giá theo chiều
  XUỐNG (sourcePosAt, không cần đảo tích phân từng điểm). Hạt giống:
  257 điểm đều + knot/cực trị của tầng ngoài + knot/cực trị/cạnh
  (0, duration) của mọi tầng trong + của lá map NGƯỢC lên trục ngoài
  (τ ngược có chặn biên, bisection 50 vòng), giới hạn 800 hạt giống map
  ngược (ưu tiên lá trước, rồi tầng từ trong ra ngoài) + chia nhỏ thích
  ứng như cổng trực tiếp.
- **Fallback an toàn:** sampler trả null (caller chỉ dùng biên tích) khi
  chain không ánh xạ được: tầng có curve mà trim lệch tích phân
  > 1e-4, tốc độ hằng ≤ 0, duration không hợp lệ, hoặc đánh giá gặp
  giá trị không hữu hạn. Không bao giờ chặn trên ánh xạ hỏng (test B7).

Đường `checkTwoLevelLeafCurve` khi một tầng mang curve là cha trực tiếp
thì giữ nguyên bộ lấy mẫu trực tiếp cũ (không đánh giá trùng toàn
chuỗi); các trường hợp còn lại (nhiều tầng mang curve, hoặc tầng mang
curve duy nhất không phải cha trực tiếp) mới chạy thêm (a)+(b).

### 1c. CỐ TÌNH không lấy mẫu cặp tầng-trung-gian × tầng-ngoài

Render flatten từ trong ra ngoài: bước trong hợp (trung gian × lá)
thành curve mã hoá, bước ngoài hợp (ngoài × curve đã hợp) — render
không bao giờ kiểm tra riêng cặp ngoài × trung gian. Nếu cổng UI chặn
cặp đó sẽ chặn oan trạng thái mà mọi lá dưới trung gian đều kéo tích
về trong khoảng (ví dụ ngoài 5 × trung gian 2 = 10 vượt, nhưng lá
dưới trung gian có tốc độ 0.3 nên tích cuối 3.0 — render qua).
Vì vậy nested con mang curve vẫn chỉ kiểm tra biên tích như T2, không
nâng lên lấy mẫu trực tiếp. Đây là kết luận suy từ code render
(`flattenInner` + `mapClip` + `encodeTwoLevelCurve`), không phải phỏng
đoán.

### 1d. Fast path nội bộ (hiệu năng, không đổi ngữ nghĩa)

`speedAt`/`sourcePosAt` của engine normalize (sắp xếp) lại toàn bộ mảng
keyframes MỖI lần gọi nên cổng cũ đã chậm sẵn, cổng mới lấy mẫu nhiều
hơn sẽ thành hàng chục giây trên curve 128 keyframe (đo thật: test
stress B8 chạy > 120s trước khi có fast path). `FastCurve` normalize
một lần rồi đánh giá theo đoạn bằng ĐÚNG công thức engine (giá trị
đoạn = v0 + Δv·applySpeedEasing; tích phân đoạn = nguyên hàm
linear/ease-in/ease-out hoặc Simpson 64 cho bezier, cùng lưới Simpson
và cùng công thức nguyên hàm; ngoài khoảng keyframe kẹp về giá trị
biên như engine). `fastCurveOf` trả null khi gặp dị thường (t/v không
hữu hạn, t âm, easing lạ, đoạn suy biến) và caller rơi về engine —
không bao giờ đánh giá sai lặng lẽ.

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `nestedGateSampling22.test.ts` (node trực tiếp) | **12 pass, 0 fail** (B1–B9, xem dưới) |
| `nestedCurveG2.test.ts` (node) | **18 pass, 0 fail** |
| `nestedRampSplitTrim20.test.ts` (node) | **18 pass, 0 fail** |
| `nestUtils.test.ts` (node) | **28 pass, 0 fail** |
| `twoLevelCurve.test.ts` (node) | **12 pass, 0 fail** |
| `nestedDeep` / `nestedDeepSpeed` / `nestedSpeedcurve` / `nestedStore` (node) | **16 / 16 / 22 / 11 pass, 0 fail** |
| `speedcurveTrim` / `speedcurveH3` / `splitPatch` (node) | **18 / 11 / 14 pass, 0 fail** |
| `store.nestedCurve19` / `store.nestedCurve20R4` / `store.nestedCurve21T4` (bundle esbuild) | **20 / 12 / 11 pass, 0 fail** |
| `store.nestedGuard` / `store.nestedRejection21T3` / `store.nestedTimelineToast` (bundle) | **9 / 31 / 16 pass, 0 fail** |
| `nestedStore.store` / `nestedDeepSpeed.store` / `splitPatch.store` (bundle) | **8 / 8 / 12 pass, 0 fail** |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (sau khi thêm file test mới vào exclude của tsconfig theo đúng quy ước repo — mọi file test đều nằm trong exclude) |
| `npx vite build` (apps/web) | **pass** (4.34s; chỉ warning chunk > 500kB có sẵn từ trước) |

Test mới B1–B9 (số suy tay, không lấy từ code đang test):

- **B1 — đỉnh bezier hẹp:** outer 10s, đoạn [5.02,5.04] v 1→3.5 easing
  bezier [0.42,2,0.58,1.5], lá hằng 1.1. Cực trị: y'(u)/3 =
  2.5u²−5u+2 = 0 → u ≈ 0.55279, t ≈ 5.03092, v ≈ 4.618, hợp ≈ 5.08
  > 4. Bản sao cổng cũ trong test CHO QUA (knot tối đa 3.5×1.1 =
  3.85 < 4, mẫu đều rơi ngoài đoạn), cổng mới CHẶN.
- **B2/B2b — không chặn oan:** cặp 1→2 × 1→1.5 (kiểu C6 đợt 21) và
  bezier nhẹ đơn điệu 1→2 × 1→1.5 đều cho qua.
- **B3/B3b — toàn chuỗi đường ngoài:** ngoài 1.5 × giữa 2 × lá 1.5 =
  4.5 > 4 bị chặn dù biên tích (3 và 2.25) đều qua; đổi ngoài về 1.0
  (tích 3.0) thì cho qua — chứng tỏ (b) chứ không phải (a) chặn ở B3.
- **B4 — cặp trong-cùng:** ngoài 0.3 × giữa 3.5 × lá 3.5, tích toàn
  chuỗi 3.675 qua nhưng cặp trong-cùng 12.25 bị chặn.
- **B5/B5b — đường lá:** tổ tiên 1.2 × giữa 2 × lá 1.8 = 4.32 bị chặn;
  lá 1.5 (tích 3.6) cho qua.
- **B6 — lá sâu hợp lệ đường ngoài:** 1.2 × 1.5 × 1.5 = 2.7 cho qua.
- **B7 — fallback:** tầng giữa trim lệch tích phân (∫=20 nhưng trim
  out=10) → sampler fallback, cổng cho qua theo biên tích, không crash.
- **B9 — đỉnh tương tác tích thuần linear (bằng chứng riêng cho chia
  nhỏ, không dính bezier):** outer 1→3.5 trên [4,4.02] trong khi inner
  3.5→1 trên đoạn map [4,4.045]; hai đầu knot tích đều 3.5 nhưng giữa
  đoạn tích vọt ≈ 5.86 (tính tay tại T=4.01089: s_o≈2.3613,
  x≈4.01830, s_i≈2.4833). Cổng cũ CHO QUA (mẫu đều duy nhất trong đoạn
  rơi vào T≈4.00065, tích ≈ 3.74), cổng mới CHẶN.
- **B8 — stress:** 121-keyframe bezier ngoài × trong, duration 60s:
  **269ms**, verdict ok=true (đúng: bezier y trong [0,1] nên hợp tối
  đa 2×1.5 = 3 < 4). Trước fast path, cùng test này chạy > 120s chưa
  xong (đã kill, không phải vòng lặp vô hạn — chia nhỏ bị chặn bởi
  depth 10 + ngân sách 100000, chỉ là mỗi lần đánh giá qua engine quá
  đắt).

Kiểm chứng chéo fast path vs engine (script dev `/tmp/fastcheck22.ts`,
không commit, chạy một lần rồi bỏ): 200 case linear/ease ngẫu nhiên +
100 case bezier đoạn rộng ≥ 1s — verdict cổng mới và bản sao cổng cũ
**khớp 0 mismatch** (các case này không có đỉnh hẹp nên hai cổng phải
khớp nhau; mismatch duy nhất được phép là case cổng mới chặn đúng mà
cổng cũ bỏ sót như B1/B9).

## 3. Giới hạn trung thực — những gì CHƯA xong / lưu ý gộp đợt

- **Đỉnh tương tác tích cực hẹp vẫn có thể sót:** chia nhỏ có bề rộng
  tối thiểu ≈ khoảng gốc/1024 (khoảng 0.04ms với clip 10s, khoảng
  0.23ms với clip 60s) và dừng ở độ lệch dây cung ≤ 1e-4. Một đỉnh
  tương tác tích hẹp hơn bề rộng đó mà né được mọi điểm 1/4 ở mọi tầng
  vẫn sót. Đỉnh của MỘT thừa số đơn lẻ nay đã bắt đúng bằng cực trị
  bezier (B1) hoặc knot (đã seed từ T2), nên phần sót chỉ còn là đỉnh
  tương tác tích cực hẹp — hẹp hơn nhiều so với lỗ hổng cũ (mọi đỉnh
  bezier giữa hai mẫu thưa). Render vẫn là chốt chặn cuối: cổng này
  chỉ là cổng UI, không mạo nhận kiểm tra tuyệt đối.
- **Ngân sách đánh giá 100000 lần / hạt giống map ngược 800:** vượt
  ngưỡng thì dừng chẻ thêm / bỏ bớt hạt giống (trả kết quả tới lúc
  đó, không fail). Thực tế đo được: stress 121 keyframe chỉ dùng một
  phần nhỏ ngân sách (269ms toàn bộ); ngưỡng này là lưới an toàn chống
  phình trên curve bệnh hoạn, không phải giới hạn thường gặp. Nếu
  tương lai curve dài hơn + nhiều tầng hơn chạm ngưỡng, cần đo lại
  trước khi nới (nới ngân sách tăng thời gian chặn UI theo tuyến tính).
- **Fallback sampler (B7) là lỗ hổng có chủ đích:** tầng có curve mà
  trim lệch tích phân thì sampler bỏ qua hoàn toàn tầng đó — trạng
  thái đó vốn đã render-invalid độc lập (vi phạm §1.3), nhưng cổng này
  không báo lỗi đó (việc của validator trim, không phải của cổng tốc
  độ hợp). Đừng đọc "cổng cho qua" ở B7 thành "trạng thái hợp lệ".
- **Message tái sử dụng, luồng A có thể viết lại:** các ca chặn mới
  của lá sâu dùng lại đúng message lấy mẫu của lá trực tiếp ("Tốc độ
  hợp ... tại điểm mẫu"). Với lá sâu, "tích hai tốc độ" hiểu là tích
  toàn chuỗi tại điểm mẫu — chưa chính xác từng chữ. Luồng A (giữ
  wording) có thể tách message riêng cho lá sâu khi dọn i18n; luồng này
  cố tình không đổi message theo phân công.
- **Không đo ở tầng render:** tính đúng của tích phân/đảo tích phân
  được khóa bằng số suy tay trong test thuần; MP4 cho hai tầng thuộc
  luồng render đợt 20 R1, không thuộc luồng này.
- **Cửa sổ tầng ngoài đường OuterCurve dùng trimOut theo curve mới:**
  `deepStagesForOuter` đặt trimOut = in + ∫₀ᴰ curve mới (cửa sổ sau khi
  patch áp dụng) thay vì trim ghi sẵn — vì check chạy trước khi patch
  ghi trim mới. Nếu trim ghi sẵn lệch với curve mới thì trạng thái vốn
  đã render-invalid (§1.3) độc lập với tốc độ hợp; sampler vẫn chạy
  trên cửa sổ curve-định nghĩa. Đây là lựa chọn có chủ đích, ghi rõ để
  luồng sau không "sửa" thành trim ghi sẵn mà không hiểu hệ quả.
- **Fast path khớp engine trong sai số float, không khớp bit-for-bit:**
  cùng công thức nhưng thứ tự cộng khác nhau ở prefix (cộng dồn từng
  đoạn thay vì tích phân một lần từ 0) nên có thể lệch ~1e-12 — nhỏ hơn
  nhiều so với dung sai cổng 1e-9 và dung sai render 1e-4. Kiểm chứng
  chéo 300 case ngẫu nhiên ở §2 không phát hiện lệch verdict nào.
- **`dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.**

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/components/nested/nestUtils.ts`: helper đợt 22 B
  (`bezierSegmentExtremaTimes`, `sampledSpeedInRange`, `FastCurve` +
  `fastCurveOf`/`fastSpeedAt`/`fastSourcePosAt`/`fastTauInverse`,
  `deepComposedSpeedInRange` + stage helpers), `combinedRampSpeedInRange`
  viết lại (giữ hợp đồng boolean + ngữ nghĩa cửa sổ/biên), `walk` của
  `checkTwoLevelOuterCurve` mang chain thay cho cờ `direct` + nhánh lá
  sâu, `checkTwoLevelLeafCurve` thêm nhánh lá sâu, khối chú thích đợt
  22 B. KHÔNG đổi API export, KHÔNG đổi message, KHÔNG đổi chữ nào
  trong i18n.
- `apps/web/src/components/nested/nestedGateSampling22.test.ts`: test
  mới B1–B9 (chạy trực tiếp bằng node, không qua bundle).
- `apps/web/tsconfig.json`: thêm file test mới vào exclude (đúng quy
  ước repo — mọi file test đều nằm trong exclude; không thêm gì khác).
- `docs/PHASE9_ROUND22_B_GATE_SAMPLING_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `store.ts`, panel UI, i18n, preview/timeline, render worker, validator
  video-spec, `speedcurve.ts` (engine), mọi file test khác.
- Không push, không tag/release, không ghi qua GitHub, không stage,
  không sửa build-loop-log.md.
