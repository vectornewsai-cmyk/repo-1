# Phase 9 đợt 21 — T1: Preview nối hợp curve hai tầng — LIMITS

Ngày: 2026-10-29. Luồng T1 trong đợt 21.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG tạo file stage
paths-loop, KHÔNG sửa build-loop-log.md (parent gộp batch — theo luật luồng).
KHÔNG sửa store.ts, nestedRejection.ts, panel UI, MixerMeter, video-spec,
server/render.

Đóng nợ: docs/PHASE9_ROUND20_LIMITS.md §3 ("Preview chưa nối hợp hai
tầng: nestedPreview.ts vẫn throw cho hai tầng") + R1 §4 ("Preview chưa
nối: module web mới chỉ là toán sẵn để nối"). Từ đợt này, preview và
render KHÔNG còn lệch nhau ở case hai tầng: cùng input cho cùng
start/duration/in/out/sourceAt trong sai số mã hoá (xem §2).

## 1. Việc đã làm

### 1a. Thiết kế: chuỗi hợp (postLeaf), không hợp một lần ở đỉnh

Placement (start/duration) của lá vốn đã đúng qua childMap hợp thành
(τ_o ∘ τ_i, tuyến tính hợp thành) nên chuỗi này CHỈ sửa curve/in/out
của lá, không đụng placement. Mỗi tầng nested khi đệ quy vào nested con
tạo một wrapper `childPost` (kiểu `LeafPostFn`, export từ
nestedPreview.ts): wrapper nhận lá đã phẳng ở tầng con + đoạn output
của lá đó (tương đối so với đầu nested con), đổi đoạn đó sang thời
gian timeline của tầng mình (cộng start đã dịch shiftIn của nested
con), rồi:

- tầng mình là ramp + lá media có in hữu hạn → hợp curve lá với curve
  tầng mình qua `composeTwoLevelCurve` (mirror render đợt 20 R1; lá
  không curve thì curve trong = tốc độ hằng của lá, đúng đường slice ×
  c của render đợt 18);
- tầng mình tốc độ hằng ≠ 1 + lá mang curve → rescale curve qua đổi
  biến tuyến tính (mirror render R1 §1c: t' = t/v, v' = v·v; ∫ bảo
  toàn nên in/out giữ nguyên);
- các trường hợp còn lại (lá phi-media, lá thiếu in, tầng hằng
  speed = 1) → giữ nguyên lá, chỉ đổi tọa độ đoạn.

Rồi wrapper chuyển tiếp lên wrapper tầng trên (nếu có). Nhờ đó hợp ba
tầng trở lên vẫn đúng: mỗi wrapper chỉ hợp một tầng, đúng tính kết
hợp của tích phân (render R1 §1d). Điều kiện để chuỗi tồn tại ở một
tầng: tầng đó là ramp, hoặc tầng trên đã có wrapper, hoặc tầng đó tốc
độ hằng ≠ 1 — các trường hợp còn lại là đồng nhất, không cần wrapper.

Bất biến chuỗi yêu cầu (nhánh lá của tầng con đảm bảo): curve của lá
khi tới wrapper LUÔN đã slice/rebase về đầu đoạn khả kiến (slice ramp,
hợp hai tầng rồi slice, hoặc slice + rescale hằng), nên
composeTwoLevelCurve nhận leafStart = đầu đoạn, leftCut = 0,
in' = in của lá (đã là nguồn tại đầu đoạn). Nếu bất biến này vỡ (lá
mang curve nguyên chưa slice lọt vào wrapper), hợp sẽ sai — xem §4
về trường hợp duy nhất còn giữ nguyên curve gốc (lá phi-media, wrapper
bỏ qua nên không ảnh hưởng).

### 1b. Lá mang curve riêng dưới nested ramp (case A, trước đây throw)

Nhánh lá dưới ramp (`isRamp`): `nestedRampLeafRefusal` không còn liệt
kê speedKeyframes riêng; thay vào đó:

- lá reverse / track / karaoke / volumeKeyframes / animations → vẫn
  throw (thứ tự kiểm tra giữ nguyên: reverse, attachment, rồi mới
  phi-media);
- lá phi-media (text/image/sticker) mang curve → throw (không có trục
  nguồn, mirror render R1);
- lá media thiếu in hữu hạn → throw (không neo được trục nguồn; render
  còn yêu cầu cả out + src — preview duck-typed nên chỉ yêu cầu in,
  out vắng thì không cap, xem §4);
- lá media đủ điều kiện → `composeTwoLevelCurve` (outer = curve tầng
  này, inner = curve lá, leafStart = effStart đã dịch shift nội bộ,
  leafDuration = duration lá), rồi slice curve hợp về đúng đoạn khả
  kiến của lá (đoạn này có thể hẹp hơn cửa sổ của compose do trim /
  cửa sổ tầng trên — slice dùng τ của tầng này trừ đi startOffset của
  compose), in'/out' lấy từ hàm hợp ĐÚNG `sourceAt` (tích phân) chứ
  không từ curve đã mã hoá; speed của lá bị xóa (render nhánh isRamp +
  leafHasCurve cũng xóa speed khi lá đã có curve).

### 1c. Nested con mang curve dưới nested cha mang curve (case B)

Khối throw "hai tầng" cũ trong nhánh đệ quy nested đã xóa, thay bằng
wrapper chuỗi (§1a). Nested con có curve hằng vẫn đi đường cũ (gộp về
tốc độ hằng, wrapper rescale nếu cần) — không thay đổi hành vi đó.

### 1d. Lá mang curve dưới nested tốc độ hằng (sửa kèm, mirror R1 §1c)

Trước đợt này nhánh phẳng (không ramp) giữ nguyên curve gốc của lá
(trục thời gian con — sai khi tốc độ hằng ≠ 1 hoặc lá bị cắt). Nay:
slice curve trong về đoạn khả kiến rồi đổi biến tuyến tính t' = t/v_o,
v' = v·v_o, in' = in + ∫₀^cut, out' = min(out, in + ∫₀^(cut+seg)),
speed của lá bị xóa (đúng nhánh ngoài hằng của render). Nhánh lá
KHÔNG curve giữ nguyên hành vi cũ, không đụng (kể cả công thức out
cũ của nó — xem §4).

### 1e. Import twoLevelCurve vào nestedPreview: workaround @ts-ignore

Xung đột công cụ đã kiểm chứng thực nghiệm (xem §3): import kèm đuôi
`.ts` thì node strip-types (cách chạy test thuần của repo) resolve
được nhưng tsc (moduleResolution bundler, không bật
allowImportingTsExtensions) báo TS5097; import không đuôi thì tsc/vite
được nhưng strip-types báo ERR_MODULE_NOT_FOUND. Giải pháp: import
`"./twoLevelCurve.ts"` kèm `// @ts-ignore` có ghi chú ngay trên dòng
import (ts-ignore, không phải ts-expect-error, để không tự lỗi khi
config đổi). Vite build vẫn pass (vite resolve được đuôi .ts), tsc 0
lỗi, strip-types chạy được. Không sửa tsconfig (file chung của nhiều
luồng) và không đổi quy ước test.

## 2. Kiểm chứng thật

| Kiểm chứng | Lệnh | Kết quả |
|---|---|---|
| nestedRampPreview (suite của luồng) | `node --experimental-strip-types apps/web/src/lib/nestedRampPreview.test.ts` (từ gốc repo) | **34/34 pass** (24 cũ gồm 2 test sửa hành vi có chủ đích ở §3 + 10 mới: a, a2, a3, b, c, f, f2, g, i, h) |
| nestedPreview | cùng cách chạy | 46/46 |
| nestedPreviewR3 | cùng cách chạy | 17/17 |
| nestedUnify | cùng cách chạy | 12 proven (2 PENDING nợ cũ, không tính) |
| previewEngine | cùng cách chạy | 14/14 |
| nestedDemo | cùng cách chạy | 8/8 |
| transitionPreview | cùng cách chạy | 26/26 |
| twoLevelCurve (R1) | cùng cách chạy | 12/12 |
| `npx tsc --noEmit` (apps/web) | `../../node_modules/.bin/tsc --noEmit` từ apps/web | **0 lỗi** |
| `vite build` (apps/web) | `../../node_modules/.bin/vite build` | pass, 4.83s (chỉ warning chunk > 500kB có sẵn) |
| Test render R1 chạy lại độc lập | `node src/test_round20_two_level_render.js` từ server/render | **42/42, gồm MP4 thật** |

Crosscheck preview-vs-render (cùng input, hai phía chạy độc lập):

- T1(a) linear×linear: preview sourceAt(2) = 3.0208, sourceAt(4) = 9,
  speedAt(2) ≈ 2.125 qua sai phân — đúng số render R1 case (a)
  (3.0208333, 9, 2.125); MP4 render probe t=2.0 cho nguồn ≈ 3.02 khớp.
- T1(c) hai tầng nested: preview duration 2.9282, in 0, out 6,
  speedAt(2) ≈ 2.4375 qua sai phân — đúng số render R1 (d8) và §2.1
  đợt 20 (1.5 × 1.625).
- T1(b) ease-in×linear: curve mã hoá của preview so với hàm hợp ĐÚNG
  của twoLevelCurve lệch < 5e-3 tại 4 điểm (ngưỡng rộng hơn sai số đo
  của R1 ~4.2e-6 để không khóa test vào nhiễu Hermite).
- Tốc độ hợp đo bằng sai phân nguồn (preview không expose speedAt cho
  clip ramp): với linear×linear, Hermite tái tạo đúng hệt nên sai phân
  h=0.01 cho sai số ~5e-7 (c''' hằng, xem test T1(a)) — đủ để khóa số
  render, không phải đo gián tiếp mơ hồ.

## 3. Sửa test cũ có chủ đích (2 test, đã đổi tên + ghi chú trong test)

- "lá reverse / curve riêng / animations dưới ramp đều throw" →
  "lá reverse / animations dưới ramp đều throw (curve riêng nay được
  hợp — xem T1)": bỏ assertion lá mang curve riêng throw; reverse và
  animations giữ nguyên.
- "nested reverse+ramp, trim out lệch ∫, hai tầng ramp, tích v vượt
  khoảng" → bỏ assertion hai tầng throw; reverse, trim lệch, tích vượt
  giữ nguyên.
- Lý do: cả hai assertion cũ khóa hành vi fail-fast mà render đợt 20
  R1 đã thay bằng hợp thành công; preview nay mirror render nên test
  cũ phải đổi theo (tiền lệ: parent cập nhật 2 assertion U6 đợt 18 ở
  đợt 20 §2.1). Không sửa assertion nào khác; 22 test còn lại của suite
  giữ nguyên và vẫn xanh.
- 3 lần sửa số tay trong lúc viết test (ghi rõ để không ai tưởng code
  sửa theo test): (a2) fixture lá [1,7) thực ra bị cắt PHẢI chứ không
  cắt trái (leftCut = 0, in' = 0) nên tách thành (a2) cắt trái thật bằng
  lá bắt đầu âm [−1,5) và (a3) cắt phải; (f) fixture ba tầng 1→2 ban đầu
  cho tốc độ hợp 8 > 4 nên phải đổi biên độ (xem §4) và số sourceAt
  ban đầu dùng τ sai hướng (source đi theo chuỗi ∫, không phải τ).

## 4. Giới hạn trung thực — những gì CHƯA xong / vẫn fail-fast

- **Vẫn fail-fast (đúng render, đã có test T1(h)):** lá reverse dưới
  ramp (kể cả khi mang curve); lá mang attachment thời gian
  (track/karaoke/volumeKeyframes/animations keyframes) dưới ramp; lá
  phi-media mang curve dưới ramp; lá media mang curve nhưng thiếu in
  hữu hạn; curve trong lỗi hình dạng (v ngoài [0.25, 4], > 128
  keyframe, easing/bezier lỗi); tốc độ hợp vượt [0.25, 4] ở bất kỳ tầng
  nào (kể cả tích ba tầng — xem dưới).
- **Ba tầng 1→2 đều nhau KHÔNG hợp được — giới hạn của định dạng, không
  phải bug:** tốc độ hợp cuối = 2×2×2 = 8 > 4 nên cả render lẫn preview
  đều fail-fast (test T1(f2) khóa). Muốn hợp sâu hơn với biên độ lớn
  cần dạng biểu diễn curve hợp riêng ngoài speedKeyframes (nợ kiến
  trúc từ R1 §4, không làm ở đây).
- **Chưa đụng (theo đúng phạm vi brief):** transition cặp biên ở TẦNG
  NGOÀI trong `flattenForPreview` (R3 §3 vẫn mở: chỉ strip trong
  flattenNested); `flattenNested` placement-only của video-spec vẫn
  chưa biết curve; store vẫn chặn tạo trạng thái hai tầng qua UI
  (guard G2) nên tính năng này hiện chỉ tới được qua flatten trực
  tiếp, như render R1 lúc mới xong; detector + câu báo
  `nestedRejection.ts` / `nested.speedRejected` chưa cập nhật theo
  ngữ nghĩa mới (vẫn thuộc luồng store/detector).
- **Chưa kiểm chứng:** click-test browser cho nested ramp (nợ chung từ
  đợt 19); MP4 render từ chính spec đã phẳng bởi preview (crosscheck
  ở §2 là số học + MP4 của render với cùng input, không phải render
  lại đầu ra flatten của preview); lá audio hai tầng chỉ có test
  flatten (T1(i)), chưa có MP4 audio hai tầng (R1 cũng chỉ flatten +
  fade cho audio, xem R1 §4); clip dài > ~30s với nhiều keyframe
  (chỉ đo duration ≤ 6s ở test, như R1).
- **Độ lệch nhỏ còn lại, có chủ đích:** preview yêu cầu lá media chỉ
  cần in hữu hạn (out vắng thì không cap), trong khi render yêu cầu cả
  in/out hữu hạn + src — preview duck-typed nên nới hơn ở điểm này,
  không coi là lệch vì out vắng thì không có gì để cap.
- **Nhánh lá KHÔNG curve dưới nested tốc độ hằng giữ nguyên công thức
  out cũ** (`in + outerDuration × speed`) — T1 không đụng nhánh này
  dù công thức đó chưa được đối chiếu lại với render trong đợt này
  (nằm ngoài phạm vi brief; cần đợt riêng nếu muốn xác minh).
- **Mã hoá Hermite vẫn là xấp xỉ ngoài trường hợp hằng/linear×linear**
  (kế thừa R1 §4): sai số O(h⁴), h ≤ 0.25s; test T1(b) lấy ngưỡng 5e-3
  thay vì khóa chặt để không phụ thuộc nhiễu mã hoá.
- `apps/web/dist/` đã được `vite build` viết lại trong lúc kiểm chứng
  — đó là output build, KHÔNG đưa vào batch stage (theo quy ước các
  đợt trước).

## 5. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/lib/nestedPreview.ts`: import composeTwoLevelCurve
  (kèm @ts-ignore + ghi chú, xem §1e); kiểu `NestedLeafOutSeg` /
  `LeafPostFn` + helper `rescaleConstantCurve` + ghi chú chuỗi hợp T1;
  `flattenNested` thêm tham số `postLeaf`; nhánh đệ quy nested tạo
  wrapper chuỗi (thay khối throw hai tầng); nhánh lá dưới ramp hợp
  hai tầng cho lá mang curve (case A) + throw phi-media/thiếu in;
  nhánh lá dưới tốc độ hằng slice + rescale curve (R1 §1c); lá gọi
  postLeaf trước khi push vào sink; `nestedRampLeafRefusal` bỏ
  speedKeyframes riêng khỏi lý do từ chối.
- `apps/web/src/lib/nestedRampPreview.test.ts`: 2 test cũ sửa hành vi
  có chủ đích (§3); 10 test mới T1(a, a2, a3, b, c, f, f2, g, i, h);
  import composeTwoLevelCurve cho crosscheck T1(b).
- `docs/PHASE9_ROUND21_T1_PREVIEW_TWO_LEVEL_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình, theo phân công luồng):
- `apps/web/src/store.ts`, `apps/web/src/lib/nestedRejection.ts`,
  panel UI, MixerMeter, `packages/video-spec/*`, `server/render/*`,
  file i18n, test của luồng khác, file stage trong
  `~/workspace/repo-1-push/paths-loop/`, `build-loop-log.md` (parent
  gộp/log).
- Không push, không tag/release, không ghi qua GitHub, không binary.
