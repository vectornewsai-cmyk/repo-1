# Phase 9 đợt 24, luồng H6 — Nút panel cho lá sâu > 1 tầng + đo tab ẩn lâu/discard + so pixel trực tiếp sau redraw — LIMITS

Ngày: 2026-10-30 (lượt cron 08:03, chạy thực tế buổi sáng theo giờ
Asia/Saigon). Luồng H6 trong đợt lớn round 24. KHÔNG push, KHÔNG
tag/release, KHÔNG binary, KHÔNG code giả, KHÔNG stage batch (parent
gộp). Chỉ file text, script đo và kết quả JSON.

Đóng 3 nợ của docs/PHASE9_ROUND23_LIMITS.md §4 (trích đúng tên):
(a) lá sâu hơn 1 tầng chưa có nút panel; (b) chưa đo tab ẩn hàng giờ /
discard thật dưới áp lực bộ nhớ, tab ẩn lúc phát tới cuối timeline;
(c) so pixel trực tiếp trước/sau redraw (hash mẫu thưa đợt 23 G4 chưa
đủ kết luận dị thường hash sau redraw khác nhẹ).

## 0. Kết luận ngắn (không vượt số đo)

1. **Panel lá sâu — XONG ở tầng UI + store:** `DeepInnerLevel` duyệt
   đệ quy "Xem bên trong" xuống mọi tầng; lá ở chain ≥ 1 có cùng nút
   "Đặt curve 1× cho lá" qua store action sâu với chainIds đúng
   (trước đây chỉ lá trực tiếp có nút). Bị chặn: store toast đúng
   nhánh + panel giữ dòng msg từ `res.reason` (API hiện có).
   Test store mới 12/12 (chain sâu `["mid", "in"]`).
2. **Nhưng trung thực về 3 nhánh nợ:** với preset 1×, 2 nhánh
   `leafSelfCurveInvalid` và `ancestorKeyframeProduct` VẪN không sinh
   ra được từ trạng thái chỉ tạo bằng panel (chứng minh ở §1.3) —
   test khóa 2 nhánh này ở tầng store action với patch chế tay, và
   khóa nhánh thứ ba `ancestorCurveInvalid` ở chain sâu; nút preset
   tới được 2 nhánh này chỉ khi project đã có sẵn curve vi phạm
   (import/MCP/dựng tay). Không claim "nút preset phủ cả 3 nhánh
   trong use thường sạch" — claim đó sai về mặt toán học của cổng.
3. **Tab ẩn 600 s (10 phút) lúc ngủ — ĐÚNG:** ticks đóng băng ở 11,
   `sleeping = true` suốt ở 5 s / 60 s / 300 s / 600 s, px mẫu thưa
   không đổi, canvas 1351×512 không bị discard; hiện lại vẽ lại 1 lần
   rồi ngủ lại (ticks 14, đóng băng tới 10 s sau hiện). Đây là 10 phút
   đo thật, KHÔNG phải "hàng giờ" — ẩn hàng giờ vẫn chưa đo.
4. **Tab ẩn lúc phát tới cuối — ĐÚNG:** phát 2 s (lastDrawn 2,47) rồi
   ẩn 10 s (đáng lẽ đã tới cuối 8 s nếu phát tiếp): lúc ẩn playhead
   đứng yên ở 2,5; hiện lại phát tiếp từ điểm cũ (không nhảy vọt),
   tới cuối đúng 8,0 ở ~5 s sau hiện rồi ngủ lại (`sleeping = true`,
   lastDrawn 8,0 giữ nguyên).
5. **Discard thật — CHƯA đo được:** tab sống sót dưới áp lực tối đa
   500 MB có trần (MemAvailable thấp nhất 779 MB, không chạm floor
   300 MB); không kết luận "không bao giờ discard" — chỉ kết luận
   "không discard ở mức ép này trên VM này". Ép mạnh hơn bị cấm chủ
   động (xem §2.3) vì VM lúc đầu lượt chỉ còn ~1 GB trống, không
   swap, và các luồng đợt 24 khác đang chạy song song.
6. **So pixel trực tiếp — KẾT LUẬN ĐƯỢC dị thường đợt 23 G4:**
   khác biệt sau redraw là KHÁC THẬT, không phải artifact lấy mẫu
   thưa (67,43% pixel lệch, chỉ trong vùng video), NHƯNG không phải
   bất ổn định redraw: khung trước khi ẩn là khung vẽ đầu chưa giải
   mã xong, khung sau redraw là khung 0 đã giải mã thật, ổn định
   tuyệt đối sau đó; redraw của khung đã giải mã (bfcache) thì
   pixel-identical 0/691712. Xem §3.

## 1. (a) Panel cho lá sâu hơn 1 tầng

### 1.1 Việc đã làm (file chung — parent gộp cẩn thận, xem §6)

- `apps/web/src/components/nested/NestedClipPanel.tsx`:
  - `InnerClipEditor` thêm prop `chainIds: string[]`; nút đặt curve
    1× nay gọi `updateNestedDeepInnerClip(hostTrackId, nestedId,
    chainIds, innerTrackId, clip.id, { speedKeyframes: preset })`
    thay cho chain rỗng hardcode của G2. Hành vi lá trực tiếp không
    đổi (chain `[]`).
  - Component mới `DeepInnerLevel({ hostTrackId, topId, chainIds,
    nestedClip, onMsg })`: liệt kê track/clip của một tầng; clip con
    là nested thì có nút "Xem bên trong"/"Ẩn bên trong" riêng
    (tái dùng key `nested.viewInside`/`hideInside`) mở đệ quy tầng
    con với `chainIds = [...chainIds, clip.id]`. Ngữ nghĩa chain
    khớp `resolveDeepLevels` của hàm thuần sâu: chain là id các
    nested trung gian từ con trực tiếp của top xuống nested chứa
    trực tiếp lá (top: `[]`; con N1 của top: `["N1"]`; N2 trong N1:
    `["N1", "N2"]`).
  - Khối "Xem bên trong" của panel nay render `DeepInnerLevel`
    (chain `[]`) thay cho liệt kê 1 tầng cũ; tiêu đề tầng sâu dùng
    key mới `nested.deepLevelHead`.
  - Nested trung gian ở tầng trực tiếp của top vẫn giữ nguyên
    `InnerClipEditor` cũ (lưu start/duration qua
    `updateNestedInnerClip` tầng 1); ở tầng sâu hơn chỉ hiện dòng
    nhãn + ghi chú `nested.deepNestedEditNote` (xem giới hạn §1.4).
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`: +2 key
  (`nested.deepLevelHead`, `nested.deepNestedEditNote`), parity
  811/811 (tăng từ 809/809 của đợt 23), vi-only [] / en-only [].
- KHÔNG sửa `store.ts`, `nestUtils.ts`, `nestedRejection.ts`,
  `nestedCurveCreate.ts`: đường toast/reason của store action sâu
  giữ nguyên. **Luồng H2 đợt 24 chưa đổi gì trên đĩa này** (không có
  file đợt 24 nào trước khi H6 chạy; grep không thấy API check
  object mới): panel vẫn dùng API hiện có — store trả `reason`
  (câu đã dịch, nêu đúng nhánh) + `reasonKey` (key i18n của nhánh,
  test khóa). Nếu H2 sau đó đổi store sang trả check object thì
  panel nên chuyển sang dùng check object/reasonKey đó thay cho
  `res.reason` — việc này chưa làm, ghi rõ để parent gộp không nhầm
  là H6 đã dùng API mới.
- Test mới `apps/web/src/store.nestedDeepLeaf24H6.test.ts` (12 test,
  mẫu esbuild của G2; panel không có DOM test runner nên component
  chỉ kiểm chứng bằng tsc + build như các đợt trước):
  - Nhóm D (3 nhánh nợ, chain `["mid", "in"]`, vi+en = 6 test):
    `leafSelfCurveInvalid` (lá patch v=5, tổ tiên top 1×),
    `ancestorCurveInvalid` (curve tầng "in" v=5, lá patch 1×),
    `ancestorKeyframeProduct` (top 4× × lá 2×, patch chế tay) —
    mỗi nhánh: chặn đúng, đúng 1 toast error = reason trả về,
    reasonKey đúng, spec không đổi, `undoDepth` không đổi, lá sâu
    không nhận curve, en không rò dấu Việt đã liệt kê.
  - Nhóm P (đúng patch nút panel dùng — `createNestedCurvePreset`,
    vi+en = 4 test + 1 success): preset ở chain sâu bị chặn đúng
    nhánh `ancestorReverse` (tầng "in" reverse) và `leafNonMedia`
    (lá chữ sâu); preset hợp lệ (top 1×) → ok, 0 toast, lá sâu nhận
    đúng preset, +1 entry undo.
  - Nhóm N (1 test): chain sai id (`["mid", "wrong"]`) → ok:false,
    không reason/reasonKey, 0 toast, spec không đổi — lỗi dây chain
    không mạo nhận thành nhánh cổng.

### 1.2 Bị chặn hiển thị đúng nhánh như thế nào

Store action sâu (G2) đã toast câu bọc `nested.deepLeafTwoLevel`
(nêu tên nested ngoài + reason đã dịch theo nhánh) và trả `reason`
+ `reasonKey`; panel chỉ giữ dòng msg bền vững từ `res.reason`
(không toast trùng). Nhờ vậy mọi nhánh cổng tới được qua nút — kể
cả nhánh chỉ tới được khi trạng thái project đã vi phạm — đều hiện
đúng lý do nhánh đó, không rơi về câu chung. Test nhóm D/P khóa
đúng cặp (toast = reason, reasonKey đúng) ở cả vi lẫn en.

### 1.3 Trung thực: vì sao nút preset không tự sinh 2/3 nhánh

Cổng `checkTwoLevelLeafCurve` kiểm tra theo thứ tự: lá trước
(reverse → phi-media → attachment → **leafSelfCurveInvalid**), rồi
mỗi tầng tổ tiên (reverse → **ancestorCurveInvalid** → **product**).
Với nút preset (1 keyframe t=0/v=1):
- `leafSelfCurveInvalid` không thể xảy ra: preset hợp lệ với mọi
  duration (validator chỉ bắt t ∈ [0, duration], v ∈ [0.25, 4],
  easing hợp lệ).
- `ancestorKeyframeProduct` không thể xảy ra khi tổ tiên đã hợp lệ:
  tích với 1× bằng đúng keyframe tổ tiên, mà tổ tiên hợp lệ thì
  keyframe ∈ [0.25, 4]; hơn nữa cổng kiểm tra `ancestorCurveInvalid`
  TRƯỚC product nên tổ tiên vi phạm sẽ rơi vào nhánh invalid chứ
  không rơi vào product.
- `ancestorCurveInvalid` thì nút preset tới được ngay khi tầng tổ
  tiên đã mang curve vi phạm sẵn — curve vi phạm đó không tạo được
  bằng panel (preset/mode editor đều tạo curve hợp lệ), mà chỉ có
  từ project import, MCP/CLI, hoặc dựng tay.
Vì vậy §0.2 nói đúng: H6 mở đường bấm tới cổng lá cho lá sâu (trước
đây là 0 đường bấm), và khóa đủ 3 nhánh ở tầng store action với
chain sâu; nhưng không tuyên bố nút preset tự tạo ra cả 3 nhánh từ
trạng thái panel sạch — tuyên bố đó sẽ sai.

### 1.4 Giới hạn của panel sâu (không giấu)

- Nested trung gian ở tầng sâu (chain ≥ 1) chưa sửa được vị trí của
  chính nó qua panel: action sâu từ chối clip đích là nested
  ("nối chain dài hơn để sửa clip bên trong nó"), và không có action
  nào khác sửa nested trung gian sâu — panel chỉ hiện nhãn + ghi
  chú, không bịa nút lưu (lưu đó sẽ luôn báo lỗi chung).
- Chưa click-test browser thật cho nút panel mới (repo không có
  Playwright runner cho panel; harness pipe đợt này chỉ đo preview,
  không click panel). Hành vi nút được khóa gián tiếp: nút gọi đúng
  hình action mà test nhóm P khóa (chain sâu + preset).
- Đệ quy panel tin cậy cây spec là hữu hạn (như `listNestedClips`);
  hàm thuần sâu vẫn chặn vòng lặp/độ sâu > 8 ở tầng store nếu
  project dị thường, nhưng panel không có chặn đệ quy riêng.

## 2. (b) Đo tab ẩn lâu / phát tới cuối / discard

Harness mới `apps/web/scripts/measure-v24-hidden-discard-pixel-pipe.mjs`
(kế thừa pipe CDP + Xvfb + vite preview + project mẫu của đợt 23 G4:
click modal ở góc 20,20, tab trắng `background: true`; cổng riêng
4191, display :80; bundle đo `/assets/index-C9gJlTsu.js` — dist vừa
rebuild ở bước kiểm chứng panel). 1 run sạch (run1). Sự cố harness:
lần chạy đầu bằng exec nền đã biến mất không dấu vết (không log,
không JSON, không tiến trình còn sống) — lần đó KHÔNG lấy số nào;
chạy lại tách khỏi phiên bằng `setsid nohup` và hoàn thành đủ 4 case.
Mọi số dưới đây chỉ từ run hoàn thành này.

### 2.1 CASE-L — ẩn 600 s (10 phút) lúc ngủ: ĐÚNG

| Mốc | px mẫu thưa | ticks | sleeping | lastDrawn | canvas |
|---|---|---|---|---|---|
| Trước ẩn (playhead 0) | 2388224 | 11 | true | 0 | 1351×512 |
| Lúc ẩn 5 s / 60 s / 300 s / 600 s | 2388224 (không đổi cả 4 mốc) | 11 (đóng băng) | true suốt | 0 | 1351×512, không discard |
| Sau hiện 1 s | 12851050 (đổi — xem §3) | 14 | true | 0 | 1351×512 |
| Sau hiện 4 s / 10 s | 12851050 (không đổi) | 14 (đóng băng) | true | 0 | 1351×512 |

Đọc: 600 s ẩn không làm đổi frame, không discard canvas, vòng
không tick thêm lần nào lúc ẩn; hiện lại tỉnh đúng 1 đợt redraw
(draws 0 → 1, ticks +3) rồi ngủ lại và giữ nguyên tới 10 s sau hiện.
**Thời lượng đo thật là 600 s = 10 phút; KHÔNG mạo nhận "hàng giờ".**

### 2.2 CASE-E — ẩn lúc phát, playback đáng lẽ tới cuối trong lúc ẩn: ĐÚNG

- Trước ẩn (phát 2 s): lastDrawn 2,4667, ticks 136, sleeping=false,
  time 00:02.5 / 00:08.0.
- Lúc ẩn 10 s: lastDrawn 2,5 (+0,033 — khoảng đua trước khi ẩn thật
  sự, cùng mẫu đợt 23 G4), ticks 137 (+1 đua), px không đổi,
  sleeping=false nhưng playhead đứng yên (rAF kẹp khi ẩn).
- Sau hiện: 1 s → 3,8333; 2 s → 5,1; 3 s → 6,3667; 4 s → 7,6667;
  5 s → 8,0 + sleeping=true. Settled sau đó: lastDrawn 8,0 giữ
  nguyên, sleeping=true, ticks 394.
- Kết luận: playhead KHÔNG nhảy vọt bằng thời gian ẩn (nhảy vọt sẽ
  là ~12,5 s rồi clamp về 8 ngay khi hiện; đo được tiếp tục từ 2,5
  với nhịp ~1 s/s), dừng đúng cuối timeline (8,0) rồi ngủ lại.
  Đây là trường hợp "phát tới cuối" qua ẩn: cuối đạt được SAU KHI
  hiện lại, vì rAF đóng băng nên cuối không thể đạt được TRONG lúc
  ẩn — đo này khẳng định hành vi đúng của đường đó, không claim
  playhead tự chạy tới cuối khi tab đang ẩn.

### 2.3 CASE-X — discard dưới áp lực bộ nhớ: CHƯA đo được (tab sống sót)

- Trước ép: ngủ chắc chắn (ticks 408, sleeping=true, lastDrawn 0,
  px 12851050), MemAvailable 1375 MB lúc bắt đầu case.
- Ép: process phụ cấp 100 MB/chunk tới tối đa 500 MB (5 chunk, mỗi
  chunk cách 2 s), giữ tổng 40 s; poll tab mỗi 5 s. MemAvailable đo
  được: 1052 → 851 → 853 → 822 → 831 → 824 → 833 → 779 MB (thấp
  nhất 779 MB, không chạm floor 300 MB nên không dừng sớm).
- Tab: sống suốt (evaluate qua CDP session còn trả lời), ticks
  đóng băng 408, sleeping=true, lastDrawn 0, px không đổi ở mọi
  sample. Sau khi kill process ép + hiện lại: ticks 415 (+7 đợt
  tỉnh), sleeping=true, lastDrawn 0, px không đổi, marker bfcache
  còn sống, không có pageshow mới (không reload).
- Kết luận: **discard KHÔNG xảy ra ở mức ép này** — không phải
  "đã chứng minh Chrome không discard". Không ép mạnh hơn vì:
  (1) đầu lượt VM chỉ còn ~997 MB trống, không swap; (2) các luồng
  đợt 24 khác đang chạy song song — ép tới OOM có thể kill tiến
  trình của luồng khác; (3) trần 500 MB + floor 300 MB là giới hạn
  an toàn đã đặt trước trong script. Discard thật (ép tới ngưỡng
  Chrome tự discard, hoặc discard qua chrome://discards) vẫn là nợ
  mở, cần máy đo riêng không chạy song song luồng khác.

### 2.4 CASE-C — bfcache (làm lại để lấy mốc so pixel §3)

bfcache thật lần 1 (about:blank → history back): marker còn sống,
1 entry pageshow `persisted = true`, cùng bundle/href; sau restore
tỉnh +6 ticks (401 → 407) rồi ngủ lại, lastDrawn 0 không đổi.
So pixel quanh restore xem §3 (0 pixel lệch).

## 3. (c) So pixel trực tiếp trước/sau redraw — kết luận dị thường G4

Phương pháp: chụp `getImageData` đầy đủ (1351×512 = 691712 pixel,
2766848 byte) vào `window.__v24pix` trước khi ẩn/rời trang, sau
redraw chụp lại và so pixel-by-pixel trong trang (chỉ trả về tóm
tắt: số pixel lệch, max/mean lệch kênh, bbox, 10 pixel lệch đầu,
tổng byte + hash mẫu thưa để đối chiếu) — không dùng hash mẫu thưa
để kết luận.

### 3.1 Ẩn/hiện (CASE-L): khác THẬT, 67,43% pixel lệch — nhưng là khung vẽ đầu chưa giải mã

- Trước ẩn: tổng byte 194094592, hash mẫu thưa 2388224, draws = 0.
- Sau hiện 1 s: tổng byte khác, hash mẫu thưa 12851050; diff đầy đủ:
  **diffPixels 466432 / 691712 = 67,4315%**, maxChannelDiff 245,
  sumAbsDiff 76461563, meanAbsDiffPerChannel 27,6349,
  bbox x 220–1130, y 0–511 (chỉ vùng video, toàn chiều cao; hai dải
  bên ngoài vùng video không đổi). 10 pixel lệch đầu đều ở y=0,
  x=220+: pre ≈ [6,7,9,255]/[10,12,16,255] (gần đen) → post ≈
  [22,32,64,255] (xanh đậm).
- Sau hiện 4 s: diff Y HỆT 1 s (cùng 466432 pixel, cùng tổng byte) —
  khung sau redraw ổn định tuyệt đối, không trôi thêm.
- Giải thích (khớp giả thuyết đợt 23 G4 §4.1, nay có bằng chứng
  đầy đủ): khung trước khi ẩn là khung vẽ đầu khi video element
  chưa giải mã xong frame 0 (giá trị gần đen, draws đếm được = 0);
  khung sau redraw là frame 0 đã giải mã thật, và trùng hash mẫu
  thưa ổn định xuyên run 12851050 — đúng giá trị baseline frame 0
  của đợt 23 G4 run1 và mọi trạng thái ổn định sau đó trong run này
  (depart bfcache, case X). Vì vậy dị thường G4 KHÔNG phải artifact
  lấy mẫu thưa (lệch là thật, đo đầy đủ), nhưng cũng KHÔNG phải
  redraw vẽ sai frame: đó là lần vẽ đầu chưa có frame thật so với
  lần vẽ lại đã có frame thật, và sau đó không còn lệch nữa.

### 3.2 bfcache restore (CASE-C): redraw pixel-identical — redraw đã giải mã thì không lệch

- Trước rời trang: tổng byte 270556155, hash mẫu thưa 12851050
  (khung đã ổn định qua các case trước).
- Sau restore 1 s và 4 s: **diffPixels 0 / 691712 = 0%**,
  maxChannelDiff 0, sumAbsDiff 0, tổng byte bằng nhau
  (270556155 = 270556155), hash mẫu thưa bằng nhau, ticks 407
  đóng băng, lastDrawn 0.
- Kết luận chốt cho §4.2 của G4: khi khung đã giải mã ổn định,
  redraw sau hiện tab / restore cho ra đúng từng pixel; lệch chỉ
  xuất hiện ở lần vẽ đầu tiên trước khi frame giải mã xong. Không
  có bằng chứng nào cho bug redraw trong 2 đường này.

### 3.3 Cảnh báo phương pháp (từ cùng run)

Hash mẫu thưa 2388224 xuất hiện cả ở playhead 0 trước khi giải mã
(CASE-L pre) lẫn ở playhead 7,6667 và 8,0 cuối CASE-E — tức cùng một
hash mẫu thưa có thể ứng với nội dung khác nhau ở các playhead
khác nhau. Hash mẫu thưa chỉ dùng so sánh trong-run ở cùng playhead
(như G4 đã cấm so tuyệt đối giữa các run); mọi kết luận frame trong
đợt này đều dựa trên diff đầy đủ, không dựa trên hash.

## 4. Kiểm chứng đã chạy (lệnh + kết quả số)

- `node --check apps/web/scripts/measure-v24-hidden-discard-pixel-pipe.mjs`: pass.
- Test H6 (esbuild bundle, mẫu G2):
  `node_modules/.bin/esbuild apps/web/src/store.nestedDeepLeaf24H6.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/store.nestedDeepLeaf24H6.test.cjs`
  → `node /tmp/store.nestedDeepLeaf24H6.test.cjs` → **12 pass, 0 fail**.
- Hồi quy: `store.nestedLeafGate23G2.test.ts` → **24 pass, 0 fail**
  (chạy lại sau sửa panel; panel không đụng store action nên không
  đổi kết quả, nhưng vẫn chạy lại để khóa).
- `tsc -p apps/web/tsconfig.json --noEmit` → **0 lỗi**.
- `vite build` (apps/web) → pass, 10,77 s, chỉ warning chunk-size cũ;
  bundle mới `index-C9gJlTsu.js` (cũng là bundle harness đo dùng).
- esbuild bundle riêng `NestedClipPanel.tsx` (platform browser) →
  pass (chỉ warning css import, như mẫu cũ).
- Parity i18n (flat JSON, tự kiểm bằng python): **vi 811 / en 811,
  vi-only [] / en-only []** (tăng từ 809/809).
- Đo headed: harness H6 run1, exit 0, `DONE ok=true`, 1 run ghi vào
  `benchmarks/results/v24-hidden-discard-pixel.json` (bundle
  `/assets/index-C9gJlTsu.js`, cổng 4191, Xvfb :80).
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub connector,
  KHÔNG stage (parent gộp batch). `apps/web/dist/` (vite build kiểm
  chứng) không stage.

## 5. Chưa xong — nợ còn lại (không mạo nhận)

- Tab ẩn hàng giờ / qua đêm, và discard thật (ngưỡng Chrome tự
  discard hoặc qua chrome://discards) — cần máy đo riêng, không
  chạy song song luồng khác; trần ép 500 MB của đợt này chưa đủ.
- Máy thật / Safari / touch-pen / dpr > 1 / nhiều tab-màn hình:
  toàn bộ đo đợt này là Chromium 156 headed dưới Xvfb 1920×1080×24,
  raster phần mềm, dpr = 1, project mẫu nhẹ — cấm trích thành hiệu
  năng hay hành vi trên máy user.
- Click-test browser thật cho nút panel lá sâu (xem §1.4).
- Sửa vị trí của nested trung gian tầng sâu qua panel (xem §1.4) —
  cần action store mới (deep action hiện từ chối clip đích nested),
  ngoài phạm vi H6.
- Nếu luồng H2 đổi store sang trả check object: panel nên chuyển
  từ `res.reason` sang check object/reasonKey đó (xem §1.1).
- Các nợ đợt 23 §4 không thuộc H6 vẫn nguyên: mapper khớp chuỗi
  chưa xóa, hàm thuần sâu vẫn ép check thành chuỗi có tiền tố,
  `nestedSplitOffset` tuyến tính-only, fadeblack parity, quy tắc
  crf YUV cặp K→L, kho phát hành dọc mới 2 clip.

## 6. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

Đổi (ghi rõ từng chỗ để parent gộp với luồng khác cùng chạm file chung):

- `apps/web/src/components/nested/NestedClipPanel.tsx` —
  (1) header comment thêm đoạn "Đợt 24 H6";
  (2) `InnerClipEditor` thêm prop `chainIds: string[]`, nút đặt
  curve dùng `chainIds` thay cho `[]` hardcode;
  (3) component mới `DeepInnerLevel` (duyệt đệ quy + nút "Xem bên
  trong" tầng con + tiêu đề tầng sâu + ghi chú giới hạn cho nested
  trung gian sâu);
  (4) khối "Xem bên trong" của `NestedClipPanel` chuyển sang render
  `DeepInnerLevel` (chain `[]`). KHÔNG đổi logic nút cũ, store,
  i18n call site khác.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — mỗi
  file +2 key sau `deepLeafCurveOk` (`deepLevelHead`,
  `deepNestedEditNote`).
- KHÔNG sửa file nào khác trong code sản phẩm. Đặc biệt: không sửa
  `store.ts`, `nestUtils.ts`, `nestedRejection.ts`,
  `nestedCurveCreate.ts`, `preview.tsx`.

Thêm:

- `apps/web/src/store.nestedDeepLeaf24H6.test.ts` — test store mới
  12 test (nhóm D/P/N, xem §1.1).
- `apps/web/scripts/measure-v24-hidden-discard-pixel-pipe.mjs` —
  harness đo mới (ẩn 600 s + phát-tới-cuối + bfcache + so pixel đầy
  đủ + ép RAM có trần; cổng mặc định 4191, display :80–:84, env
  V24_PREVIEW_PORT / V24_XVFB_DISPLAYS / V24_OUT / V24_RUN_LABEL /
  V24_LONG_HIDE_MS / V24_PLAY_HIDE_MS / V24_PRESSURE_MAX_MB /
  V24_PRESSURE_FLOOR_MB).
- `benchmarks/results/v24-hidden-discard-pixel.json` — kết quả 1 run
  sạch (case L/E/C/X đầy đủ ticks/sleeping/lastDrawn/px/diff).
- `docs/PHASE9_ROUND24_H6_DEEP_LEAF_HIDDEN_LIMITS.md` — file này.

Không stage ở đây; log chạy harness (không thuộc repo) nằm tại
`~/workspace/goals/capcut-clone-video-editor/hidden_files/v24h6-run1.log`
(nếu parent cần đối chiếu stdout đầy đủ).
