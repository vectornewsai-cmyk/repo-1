# Phase 9 đợt 26, luồng J6 — Click-test browser thật: panel tách lá sâu theo mốc ngoài (I2) + panel lá sâu check object / vị trí trung gian sâu (I3) — LIMITS

Ngày: 2026-10-30 (lượt cron 20:03, chạy thực tế buổi tối theo giờ
Asia/Saigon). Luồng J6 trong đợt lớn round 26. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG stage
batch (parent gộp), KHÔNG tự ghi build-loop-log. KHÔNG sửa code sản
phẩm nào (không có fix tối thiểu kiểu I6 §5g trong luồng này — phát
hiện app mới ở §6 được BÁO, không sửa, vì fix đúng cần chuẩn hóa
style mặc định, vượt phạm vi tối thiểu).

Đóng nợ docs/PHASE9_ROUND25_I2_SPLIT_WIRING_LIMITS.md §"Chưa phủ" (1)
và docs/PHASE9_ROUND25_I3_DEEP_CHECK_OBJECT_LIMITS.md §3 (chưa có
click-test browser thật cho 2 panel đợt 25). Chỉ test code đợt 25 đã
có trên đĩa; KHÔNG test tính năng của các luồng J1–J5 (đang song
song làm tính năng mới). Mọi thao tác đo đều diễn ra SAU khi
WelcomeModal đã tắt (localStorage `vcut-welcomed=1` trước reload),
theo bài học đợt 22 C / đợt 25 I6.

## 0. Kết luận ngắn (không vượt số đo)

1. **Panel tách lá sâu theo mốc ngoài (I2) — PASS 17/17 ở run2 trên
   browser thật:** gõ tay mốc ngoài + nút "Tách lá tại mốc ngoài"
   tách đúng vị trí τ ở cả 3 độ sâu (trực tiếp, 2 tầng ramp, 3 tầng
   ramp); nút "Lấy từ playhead" điền đúng playhead thật rồi tách
   đúng; 5 nhánh chặn (ngoài miền, sát mép đầu, sát mép cuối, curve
   v=5, lá reverse+curve) hiện đúng msg + toast, không đổi spec,
   không sinh undo; mỗi lần tách thành công đều hoàn tác đúng 1
   bước Ctrl+Z. Xem §1.
2. **Panel trung gian sâu (I3) — PASS:** `DeepIntermediateEditor`
   hiện thật cho nested trung gian sâu (không còn ghi chú giới hạn
   H6); dời DEEP-TARGET 0→1 lưu đúng vị trí, lá con không đổi,
   Ctrl+Z hoàn tác; cặp vi phạm deep 4× × lá 2× bị chặn với msg
   "vượt khoảng" (combinedRange qua check object), 0 toast, spec
   không đổi, Ctrl+Z no-op. Nút lá sâu sau chuyển check object vẫn
   chặn đúng nhánh ancestorReverse. Xem §2.
3. **Run1 fail 5 case đều là lỗi harness, không phải lỗi app (§4):**
   neo τ gõ tay tính nhầm sqrt (2 case), assert in/out dùng `===`
   trong khi mốc gõ tay làm tròn 4 chữ số thập phân (1 case), thang
   ruler hiệu chuẩn từ text làm tròn 0.1s lệch hệ thống +0.069s
   (1 case), và fail dây chuyền Ctrl+Z-noop do 4 entry tách chưa
   hoàn tác (1 case). Sau khi sửa harness, run2 xanh 17/17 — và các
   số lệch ở run1 khớp đúng đạo hàm chuỗi τ, tức app đã đúng ngay
   từ run1.
4. **Hồi quy harness I6 (chạy lại, §5):** 12/14 ở cả 2 lần chạy, nhưng
   fail đổi chỗ: lần 1 R2 tối / R3 pass, lần 2 R2 pass / R3 tối (cùng
   mean nền 10.492883671078541) — nhiễu thoáng qua kiểu I6 §5h, không
   phải hồi quy hệ thống của ramp (R1 pass cả 2 lần, mỗi lần đều có
   1 trong R2/R3 khớp frame chính xác). **D7 fail xác định ở cả 2
   lần:** 5× `TypeError: Cannot read properties of undefined
   (reading 'animation')` lúc load, khác hẳn D7 gốc của I6 (1×
   resolveNestedRampCurve với curve v=5) — đường v=5 nay đã
   fail-soft bằng toast cảnh báo (không còn ném), nhưng text clip
   không có `style` trong preview nay ném lỗi mới. Đây là PHÁT HIỆN
   APP MỚI, giao lại ở §6 (không sửa trong luồng này).
5. **Kiểm chứng code:** `tsc --noEmit` còn đúng 1 lỗi, nằm ở file
   test của luồng J5 đang làm dở (`projectRepoRound26J5.test.ts`,
   lỗi TS5097 import `.ts`) — không phải file của luồng này, không
   sửa để khỏi đụng việc của luồng khác. `vite build` ra thư mục
   scratch (không đụng `apps/web/dist/` chung) pass. Harness qua
   `node --check` sau mọi lần sửa.

## 1. Panel tách lá sâu theo mốc ngoài — I2 (phiên main, seed J6-MAIN)

Seed (mỗi top một track riêng, cùng fixture store đợt 25 I2): top
ramp 1→3, start=10, duration=4, trim [0, 8), lá trực tiếp start 0,
duration 4, in 100, out 104; các top 2/3 tầng theo đúng fixture A2
và threeRamp của đợt 24 H1. Gõ input bằng CDP key event thật
(char), chỉ fallback native setter khi giá trị không khớp (run2
không cần fallback lần nào — mọi lần gõ đều `cdp-char`).

| Case | Nội dung | Bằng chứng (run2) |
|---|---|---|
| J0-seed-load | Panel liệt kê đủ 9 item | `TOP-SPLIT-OUT, TOP-SPLIT-EDGE, TOP-SPLIT-OK, TOP-SPLIT-PH, TOP-SPLIT2, TOP-SPLIT3, TOP-DEEP, TOP-DEEP-BLOCK, TOP-LEAFCHK` |
| J1-split-out-of-range | Gõ "9.9" (< absoluteStart 10) | msg + toast: `Mốc ngoài nằm ngoài phần khả kiến của clip lá — không tách.`; lá còn 1; spec không đổi sau 7000ms |
| J2-split-edge-start | Gõ "10" (= absoluteStart) | msg + toast: `Điểm tách quá sát mép clip lá (margin 0.05s) — không tách.`; spec không đổi |
| J3-split-edge-end | Gõ "12.4636" (lá 3.98/4: 10 + τ₁₃(3.98)) | msg + toast TooCloseToEdge đúng; lá còn nguyên 1 clip dài 4 |
| J4-blocked-no-undo | Ctrl+Z sau 3 lần chặn | No-op: spec không đổi, panel vẫn đủ 9 item |
| J5-split-typed-success-undo | Gõ "11.4641" (10 + τ₁₃(2)) | msg `Đã tách lá tại 00:02.0 (thời gian lá) — 1 bước undo.`; 2 nửa 2s/2s, in/out 100/102/104 (dung sai 1e-3, xem §4.1); trim top {0,8} không đổi; 0 toast; Ctrl+Z về 1 lá |
| J6-split-two-level-success-undo | Gõ "1.2600" (τ₁₃(τ₁₂(2)) ≈ 1.25997) | msg 00:02.0; 2 nửa 2s/2s, nửa phải in ≈ 102; trim top {0,8} + mid {0,6} không đổi; Ctrl+Z hoàn tác |
| J7-split-three-level-success-undo | Gõ "1.1040" (τ₁₃(τ₁₂(τ₁₂(2))) ≈ 1.10405) | msg 00:02.0; 2 nửa 2s/2s, nửa phải in ≈ 102; Ctrl+Z hoàn tác (panel truyền đúng chainIds 2 tầng) |
| J8-split-playhead-success-undo | Scrub ruler tới ~11.4641, bấm "Lấy từ playhead", tách | Vạch playhead 11.4667 (text 11.5); input sau nút = 11.466666666666667 (khớp vạch tuyệt đối); msg `Đã tách lá tại 00:02.0`; 2 nửa ~2s/2s (dung sai scrub ±0.1); Ctrl+Z hoàn tác |
| J12-no-crash-main | 0 exception phiên main | 0 `Runtime.exceptionThrown` |

Trung thực về J13-toast: ở phiên risky, lúc đọc toast sau click
vẫn còn các toast lúc load (cảnh báo khôi phục autosave + cảnh báo
preview fail-soft, xem §5) nên danh sách toast chứa nhiều hơn 1
mục; assert của J13 chỉ yêu cầu "có 1 toast chứa đúng câu
CurveInvalid" — msg panel (`.nested-panel-msg`) mới là tín hiệu
sạch, và nó đúng từng chữ. Không claim "chỉ có đúng 1 toast" ở
phiên risky.

## 2. Panel lá sâu check object + vị trí trung gian sâu — I3

Seed theo đúng fixture I3: top(0,4) > mid(0,4) > in(0,4) > deep(0,2)
> lá dl(0,2); it2 có lá il(0,4), mt2 có lá ml(0,4). Drill tới tầng
chứa deep bằng 2 lần "Xem bên trong" (chain ["MID-ID", "IN-ID"]).

| Case | Nội dung | Bằng chứng (run2) |
|---|---|---|
| J9-intermediate-move-success-undo | Dời DEEP-TARGET 0→1 qua `DeepIntermediateEditor` | Hàng deep hiện đủ input start/duration + nút "Lưu clip con" (không còn ghi chú H6); msg `Đã lưu clip con (1 bước undo).`; autosave deep [1,2], lá dl [0,2] không đổi; Ctrl+Z về [0,2] |
| J10-intermediate-blocked-check | Dời DEEP-BLOCKED 0→1 (deep 4× × lá dl 2×, tích 8 > 4) | msg `Tốc độ hợp của curve ngoài với curve của clip "dl" vượt khoảng [0.25, 4] (tích hai tốc độ tại điểm mẫu).`; 0 toast (đúng thiết kế action này không tự toast); spec không đổi; Ctrl+Z no-op |
| J11-leaf-check-block | Bấm "Đặt curve 1× cho lá" ở lá sâu (TOP curve 1× → MID-CHK reverse → lá) | msg `Không đặt được speed curve lên clip lá trong nested clip “TOP-LEAFCHK”: Nested clip tổ tiên "MID-CHK" đang reverse — render cấm reverse ở tầng mang curve.`; nút còn nguyên; autosave lá không có curve |

**Giới hạn trung thực về check object (J10/J11):** DOM chỉ hiện câu
msg đã dịch — câu này giống hệt nhau dù panel đi đường check
object mới hay đường reason-string cũ, nên click-test KHÔNG phân
biệt được hai đường code từ DOM. Điều click-test chứng minh là:
msg đúng nhánh, đúng tên clip, đúng hành vi chặn/không-toast/
không-undo. Đường check object (panel nhận `twoLevelCheck` thay
vì tách chuỗi) được khóa ở tầng store bởi test I3 (9/9, trong đó
B5 assert `reasonCode === "combinedRange"`), và code panel
`setLeafCurve`/`DeepIntermediateEditor` đã đọc đúng nhánh đó —
không mạo nhận DOM đã hiện reasonKey hay check object.

## 3. Harness và bundle đo

- Harness mới: `apps/web/scripts/clicktest-split-intermediate-pipe.mjs`
  (pipe CDP + snapshot dist + seed qua autosave + ruler scrub bằng
  thang 60 px/s + đọc playhead từ vạch `.tl-playhead-line`; cổng
  4196, display :96, window 1920×1200).
- Bundle đo (cả run1 và run2): `index-D9oonx2v.js`,
  sha256[:16] = `0acbb3102faef02d` (snapshot gate: chứa đồng thời
  "Lấy từ playhead", "deepLevelHead", "curveCreate"). Lưu ý: trong
  đợt 26, các luồng khác build lại dist nhiều lần (trước run1 còn
  thấy bundle `index-DbvBXtm_.js`; lúc hồi quy lần 2 đã là
  `index-TbcVja5_.js`) — snapshot đầu mỗi lần chạy là thứ pin bản
  đo, không đo dist trực tiếp.
- Kết quả JSON run2 (17/17):
  `benchmarks/results/clicktest-split-intermediate-r26j6.json`
  (file này bị run2 ghi đè lên run1 — số run1 giữ trong §4 dưới
  đây và trong log luồng; parent quyết có stage hay không).
- Các lần gõ input ở run2 đều bằng CDP char thật, không fallback.

## 4. Run1 fail 5 case — toàn lỗi harness, đã sửa và xanh ở run2

Run1: 12/17 pass, 5 fail (J5, J6, J7, J8, J10). Run2 sau khi sửa
harness: **17/17 pass, 0 fail, 0 seed-rejected, exit=0.**

1. **J5 (harness assert quá chặt):** app cho in/out
   `[[100, 101.9999972025], [101.9999972025, 104]]`, harness cũ
   assert `=== 102`. Mốc gõ "11.4641" làm tròn từ neo đúng
   11.4641016 (lệch −1.6e-6 ngoài) → qua đạo hàm τ
   (d leaf/d outer ≈ 1.73) phải lệch −2.8e-6 ở điểm cắt nguồn —
   đúng số app cho. Sửa: assert in/out với dung sai 1e-3.
2. **J6 (neo harness tính nhầm):** run1 gõ "1.2594", app cho nửa
   phải in = 101.99868183601875. Tính lại: τ₁₃(τ₁₂(2)) = 1.25997
   (sqrt(10.627417) ≈ 3.25997, không phải 3.25936 như harness cũ
   tính) — mốc gõ lệch −5.7e-4 ngoài, qua đạo hàm chuỗi (≈ 2.30)
   phải lệch −1.3e-3 ở lá — đúng số app cho. Sửa: gõ "1.2600".
3. **J7 (neo harness tính nhầm):** run1 gõ "1.1042", app cho in =
   102.00046014381637. Tính lại: τ₁₃(τ₁₂(τ₁₂(2))) ≈ 1.10405 — mốc
   gõ lệch +2e-4 ngoài, qua đạo hàm chuỗi (≈ 2.97) phải lệch
   +5.9e-4 ở lá — đúng số app cho (sai số làm tròn tay còn lại
   ~1e-4). Sửa: gõ "1.1040".
4. **J8 (thang ruler harness lệch hệ thống):** run1 hiệu chuẩn từ
   text playhead làm tròn 0.1s cho pxPerSec = 60.606 (bài học I6
   đã biết: thang thật là 60 px/s), kéo tới x tương ứng playhead
   thật 11.5333 thay vì 11.4641 (lệch +0.069 ngoài) → lá 2.1211
   (lệch +0.12, đúng đạo hàm 1.73). Sửa: kéo bằng thang 60 px/s
   (x = ruler.x + 60 × target) và so input với playhead đọc từ
   vạch (run2: vạch 11.4667 = input 11.4667 tuyệt đối).
5. **J10 (fail dây chuyền):** J5–J8 fail trước bước Ctrl+Z nên 4
   entry tách còn nằm trên undo stack; Ctrl+Z ở J10 đã hoàn tác
   entry tách của J8 (entry mới nhất còn lại) nên spec đổi — đúng
   hành vi undo, không phải "lần chặn sinh undo". Sau khi J5–J8
   xanh (Ctrl+Z của chúng chạy đủ), J10 no-op đúng. Harness đã
   thêm log top đổi (`specDiffTops`) cho các check no-op để lần
   sau phân biệt được fail dây chuyền với lỗi thật.

## 5. Hồi quy: chạy lại harness I6 (deep-leaf + ramp)

Chạy bản copy harness I6 (đổi SCRATCH và tên file JSON kết quả
sang đợt 26, display :97, cổng 4197; bản copy tạm trong
`apps/web/scripts/` đã xóa sau khi chạy xong, không tính vào file
đổi). Kết quả cả 2 lần: **12/14** (I6 run9 là 13/14).

Nhóm deep (8/9 cả 2 lần — D0, D3, D4, D5, D6, D1, D2, D8 đều
PASS): nút lá sâu, 3 nhánh chặn, lá đã có curve, thành công
chain 1/2 + undo, undo thừa no-op đều giữ nguyên hành vi.

- **D7 FAIL xác định (khác D7 gốc):** cả 2 lần đều đúng 5
  exception, exception đầu tiên luôn RƠI VÀO LÚC LOAD (lần 1:
  13:27:44, trước khi panel mở 13:27:47; lần 2: 13:32:57, cũng
  trước panel) — không exception nào do click gây ra, UI sau đó
  sống hoàn toàn (mọi case D còn lại pass). Nội dung:
  `TypeError: Cannot read properties of undefined (reading
  'animation')`, stack về hàm vẽ text clip của preview
  (`drawTextClip`, `apps/web/src/preview.tsx` — đọc
  `clip.style.animation` khi `clip.style` undefined; vị trí tương
  ứng trong bundle đã kiểm tra bằng trích xuất trực tiếp). Nội
  dung seed kích hoạt: text leaf không có `style` của I6
  (`TEXT-BLOCKED-LEAF`, start 0, duration 4, không trường style)
  nằm trong nested — các seed J6 (toàn lá video, không có text
  leaf) cho 0 exception ở cả 2 phiên, khớp giả thuyết này. Đồng
  thời, đường v=5 của D7 gốc KHÔNG còn ném nữa: log D3 lần hồi
  quy cho thấy preview nay cảnh báo fail-soft bằng toast
  (`Preview: nested "TOP-CURVINV" có speed curve không hợp lệ …
  đã tạm về 1×`) thay vì exception resolveNestedRampCurve. Tức
  D7 cũ đã hết, D7 mới (text không style) xuất hiện — xem §6.
- **R2/R3 tối canvas là nhiễu thoáng qua, đổi chỗ giữa 2 lần
  chạy:** lần 1 R2 FAIL tối (mean 10.492883671078541) / R3 PASS
  (khớp neo 6.2579, meanAbs 0.812); lần 2 R2 PASS (khớp neo
  5.5430, meanAbs 0.825) / R3 FAIL tối (cùng mean nền
  10.492883671078541). R1 pass cả 2 lần (khớp neo 3.0208,
  meanAbs 4.993). Mẫu này khớp đúng nhiễu quá tải decode VM của
  I6 §5h (canvas nền đen kịt, không phải frame sai), không phải
  hồi quy hệ thống của ramp — mỗi lần chạy đều có 1 trong R2/R3
  khớp frame chính xác. Không chạy thêm lần 3 chỉ để săn nhiễu
  này (tốn kém, không đổi kết luận).
- Kết quả JSON hồi quy (lần 2, lần 1 bị ghi đè):
  `benchmarks/results/clicktest-deep-leaf-ramp-r26j6.json`.

## 6. Phát hiện app mới — BÁO, không sửa (giao luồng riêng)

**Text clip không có `style` làm preview ném exception lúc load
(xác định, 5 lần/phiên, bundle hiện tại).** Đường đi: preview
flatten đưa text leaf trong nested lên timeline preview → vòng
vẽ text clip gọi `drawTextClip` → đọc `clip.style.animation`
trong khi `clip.style` là undefined → TypeError uncaught (ghi
qua `Runtime.exceptionThrown`, không crash UI — mọi thao tác sau
đó vẫn pass). Chỉ cần text clip thiếu `style` là đủ kích hoạt
(không cần curve vi phạm hay nested sâu đặc biệt — seed J6 không
có text leaf nên không gặp).

Vì sao KHÔNG sửa tối thiểu ở đây (khác tiền lệ I6 §5g): guard
một dòng `clip.style?.animation` không đủ — ngay sau đó code còn
đọc `clip.style.fontSize`, `clip.style.color`,
`textFont(clip)`… trên cùng object undefined, nên fix đúng phải
là chuẩn hóa style mặc định cho text clip (ở tầng load/flatten
hoặc đầu `drawTextClip`) kèm test hồi quy — đó là một sửa chữa
có ngữ nghĩa, không còn tối thiểu, và có thể đụng code textfx
của luồng khác đang làm trong đợt 26. Giao luồng riêng: (a) xác
nhận text clip top-level không style có ném tương tự không
(nếu có thì đây là bug text clip tổng quát, không riêng
nested); (b) chọn nơi chuẩn hóa style mặc định; (c) thêm test
store + click-test hồi quy với text leaf không style.

Không kết luận về nguyên nhân thay đổi so với I6 run9 (bundle
đó không còn trên đĩa để diff): chỉ ghi nhận bundle hiện tại
nào cũng tái hiện (2 bundle khác nhau của đợt 26,
`index-D9oonx2v.js` và `index-TbcVja5_.js`, cùng vị trí code
123:53978), còn bundle I6 run9 (`index-CIPyYKhc.js`) chỉ có 1
exception v=5.

## 7. Kiểm chứng code và file đổi/thêm

- `node --check apps/web/scripts/clicktest-split-intermediate-pipe.mjs`: pass (sau mọi lần sửa).
- `tsc --noEmit` trong `apps/web`: exit 2, đúng 1 lỗi — ở file
  của luồng J5 đang làm dở, không thuộc luồng này, không sửa:
  `src/lib/projectRepoRound26J5.test.ts(23,8): error TS5097`
  (import path kết thúc bằng `.ts` khi chưa bật
  `allowImportingTsExtensions`). File đổi của luồng này là
  `.mjs` + `.md`, không nằm trong diện tsc kiểm tra.
- `vite build --outDir <scratch>/dist-check`: pass (4.61s, chỉ
  warning chunk > 500kB cũ; bundle `index-TbcVja5_.js`, khớp
  bundle snapshot lúc hồi quy lần 2). Cố tình KHÔNG build vào
  `apps/web/dist/` chung để khỏi đua với snapshot của các luồng
  J1–J5 đang chạy song song.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch).

File đổi/thêm (text, không binary — parent gộp batch, không stage
ở đây):

- Mới: `apps/web/scripts/clicktest-split-intermediate-pipe.mjs` —
  harness click-test J6 (pipe CDP + snapshot dist + seed J6-MAIN /
  J6-RISKY qua autosave + drill DeepInnerLevel + gõ input thật +
  scrub ruler 60 px/s + đọc playhead từ vạch + đọc autosave sau
  mỗi thao tác; cổng 4196, display :96).
- Mới: `docs/PHASE9_ROUND26_J6_CLICKTEST_LIMITS.md` — file này.
- Mới: `benchmarks/results/clicktest-split-intermediate-r26j6.json`
  — kết quả run2 (17/17) + log đầy đủ (parent quyết có stage hay
  không; run1 bị ghi đè, số run1 giữ trong §4).
- Mới: `benchmarks/results/clicktest-deep-leaf-ramp-r26j6.json` —
  kết quả hồi quy I6 lần 2 (12/14) + log (lần 1 bị ghi đè, số lần
  1 giữ trong §5; parent quyết có stage hay không).
- `apps/web/dist/` KHÔNG stage (build output; snapshot đo nằm ở
  scratch và đã dọn, xem §8).

## 8. Chưa xong / giới hạn (không mạo nhận)

- Chưa click-test ô nhập rỗng (nợ I2 (7)): ô rỗng → `Number("")`
  = 0 → bị chặn ngoài miền/sát mép kèm reason, không crash (suy
  từ code), nhưng chưa bấm thật để khóa hành vi này trên UI.
- Chưa click-test mốc ngoài miền ở chain 2 tầng trở lên (nợ I2
  (2) phần panel): J7 khóa thành công ở chain 2 tầng, nhưng nhánh
  ngoài miền ở chain sâu mới chỉ khóa ở tầng store (I2 test O,
  chain [mid]) — panel với chain [A, B] + mốc 99 chưa bấm.
- Chưa click-test locale en trên panel (reasonKey/mang tiếng
  Việt): toàn bộ đo ở locale vi mặc định; đường en được khóa ở
  tầng store bởi test I2/I3 (vi+en từng nhánh), không mạo nhận
  đã bấm en trên UI.
- `DeepIntermediateEditor` chỉ sửa start/duration (đúng phạm vi
  I3): đổi text/speed/curve của trung gian sâu vẫn qua đường cũ,
  không thuộc luồng này. Key i18n `nested.deepNestedEditNote`
  vẫn còn trong dict nhưng panel không dùng nữa (nợ dọn riêng
  của I3, không đụng).
- Máy thật / Safari / touch / dpr > 1 / viewport khác: toàn bộ đo
  là Chromium headed dưới Xvfb, raster phần mềm, dpr = 1 — cấm
  trích thành hành vi trên máy user.
- Scrub bằng kéo thật chỉ đo ở J8 (playhead ~11.47); kéo scrub cho
  các case tách khác dùng gõ tay, không kéo.
- Scratch `~/workspace/tmp-round26-j6/` (snapshot dist, log run1/
  run2, log hồi quy, video ramp, dist-check) được dọn cuối luồng,
  xác nhận bằng `ls` trước khi báo cáo (xem báo cáo cuối của
  luồng).
