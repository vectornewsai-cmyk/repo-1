# Phase 9 đợt 17 — Luồng N3: nested speed (patchClip + sửa clip con sâu) — LIMITS

Ngày: 2026-10-28. Luồng N3 trong đợt lớn round 17.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop (parent gộp batch — xem §5).

Đóng nợ đợt 16 (xem docs/PHASE9_ROUND16_H2_NESTED_STORE_LIMITS.md §3 và
docs/PHASE9_ROUND16_LIMITS.md §3):
- "Đổi speed của nested clip qua patchClip vẫn là nợ mở";
- "Sửa clip con ở cấp sâu hơn 1 tầng qua store action vẫn chưa có".

## 1. Việc đã làm

### 1a. patchClip đổi speed nested → duration tính lại (đóng nợ H2)

- Hàm thuần mới `applyNestedSpeedDuration(top)` trong nestUtils.ts:
  nhận một nested clip mà speed/trim đã là giá trị mới, trả về bản copy
  với `duration = (trim.out − trim.in) / speed`. Trả null khi speed
  ngoài [0.25, 4] (= NESTED_MIN/MAX_SPEED của spec) hoặc trim không hợp
  lệ — store khi đó giữ nguyên duration cũ, không tự kẹp speed.
- `patchClip` trong store.ts gọi hàm này trong nhánh mới đặt NGAY SAU
  nhánh duration-nested của đợt 16 H2, với thứ tự ưu tiên rõ ràng:
  - Patch kèm duration → nhánh H2 thắng: duration giữ nguyên giá trị
    patch, `trim.out = trim.in + duration × speed` (không bị nhánh N3
    ghi đè — nhánh N3 bỏ qua khi patch có duration).
  - Patch chỉ đổi speed (không kèm duration) → duration tính lại theo
    speed mới, trim giữ nguyên. Patch tự đặt trim kèm speed thì duration
    tính từ trim mới (vì patchOne đã ghi trim mới trước khi nhánh N3
    chạy).
  - Comment cũ của H2 ("đổi speed vẫn là nợ mở") đã sửa thành trỏ
    sang nhánh N3, tránh để comment lỗi thời đánh lừa đợt sau.
- Ví dụ số (test qua store thật, case N1/N2): top trim [0,4),
  speed 1 → 2 thì duration 4 → 2; speed 2 → 0.5 thì duration 2 → 8.
  Patch { speed: 2, duration: 1 } → duration 1, trim [0,2) (nhánh H2).
  Patch speed 5 (ngoài [0.25,4]) → duration giữ nguyên 4.

### 1b. Sửa clip con ở cấp sâu qua store action (đóng nợ H2)

Hai hàm thuần mới trong nestUtils.ts + hai action mới trong store.ts
(mỗi action 1 entry undo, giống updateNestedInnerClip):

- `updateNestedDeepInnerClip(spec, hostTrackId, topId, chainIds,
  innerTrackId, innerClipId, patch)` — sửa 1 clip lá ở cấp sâu:
  trim (start/duration/text như R5), đổi speed hằng, thay speed curve.
  `chainIds` = id các nested clip từ con trực tiếp của top xuống nested
  chứa trực tiếp lá (chain rỗng = lá trực tiếp trong top). Mỗi tầng
  được tìm theo id TRONG CÂY THẬT (clip đầu tiên cùng id thắng, giống
  composeNestedLeafWindow), không tin object caller đưa.
- `splitNestedDeepInnerClip(spec, hostTrackId, topId, chainIds,
  innerTrackId, innerClipId, splitTime, idGen)` — tách 1 clip lá ở cấp
  sâu tại splitTime (khung thời gian của tầng cha trực tiếp). Hai nửa
  vẫn nằm trong track cha nên tổng độ dài và max end không đổi:
  trim/duration của mọi tầng tổ tiên giữ nguyên.
- Chặn vòng lặp + sâu tối đa: Set các subSpec tổ tiên trên đường đi
  (dùng lại cùng subSpec ở clip anh em vẫn hợp lệ vì Set chỉ xét đường
  đi, giống flatten/validate); sâu vượt MAX_NESTED_DEPTH = 8 của spec
  → error. Lá đích không được là nested clip (muốn sửa nested con thì
  nối chain dài hơn). Chain sai id, track/clip không có, track host
  khóa → error, spec không đổi.
- Ngữ nghĩa đổi speed lá sâu (video/audio có in/out, giống SpeedPanel
  cho clip thường): chỉ đổi speed thì duration = (out − in) / speed,
  out giữ nguyên (đoạn nguồn không đổi); speed + duration cùng có thì
  out đi theo thành in + duration × speed. Ví dụ số (test thuần):
  lá [0,4) in 0–4, speed 1 → 2 thì duration 4 → 2, out vẫn 4;
  deepNestedLeafVisibleSpeedCurve sau đó cho effectiveOut = 4
  (in + visible × speed) và cửa sổ tuyệt đối [0,2) khớp flattenNested.
- Trim lá sâu có curve đi theo đúng luật R5: dời thuần giữ nguyên
  curve; trim một mép thì dịch/cắt bằng trimSpeedKeyframes, trả
  curveDropped cho store chuyển tiếp (test: trim trái 1s trên curve
  [(0,1),(1,1.25),(4,1.25)] → curve [(0,1.25),(3,1.25)],
  curveDropped = 1).
- Split lá sâu theo đúng luật splitClipAt của store cho clip thường:
  video/audio có curve (không reverse) thì điểm cắt nguồn =
  in + ∫speed trên nửa trái và curve chia bằng splitSpeedKeyframes;
  không curve thì dùng splitSourceAt (đúng cả tốc độ hằng lẫn reverse);
  text/sticker/image chỉ chia duration. Ví dụ số kiểu đợt 14: lá
  in=10, curve 1→1.25 trên [0,1], cắt tại 1s → điểm cắt nguồn =
  10 + 1,125 = 11,125 (nửa trái out 11,125, nửa phải in 11,125,
  out 14,875 giữ nguyên). Margin 0.05s áp NGAY TRONG hàm thuần deep
  split (khác splitNestedClip đợt 16 vốn để store giữ margin), vì deep
  split không đi qua splitClipAt — store action gọi thẳng hàm này.
- Guard bất biến tầng cha trực tiếp (phát hiện khi viết test, xem §2):
  sửa lá không được phá duration của cha. Cha ghi trim tường minh thì
  chỉ cấm nguồn mới co dưới trim.out; cha không ghi trim (= "phát toàn
  bộ", duration cha bằng đúng độ dài nguồn / speed) thì nguồn đổi
  hướng nào cũng lệch duration cha nên đều bị từ chối. Test khóa cả
  hai trường hợp (lá cuối thu ngắn phá trim cha; cha không trim mà lá
  duy nhất thu ngắn).

### 1c. Test render MP4 thật (đóng nợ "chưa đo speed khác 1 ở tầng render")

- `server/render/src/test_round17_n3_nested_deep_speed_render.js`
  (file test MỚI, chỉ gọi render.js — không sửa render.js hay harness):
  11/11 check, FFmpeg 8.1.2, 64×64, nguồn màu phẳng đỏ 0–4s / xanh lá
  4–8s (cùng nguồn với test H2), số suy tay từ flattenInto, không lấy
  từ code đang test.
  - Case A (top speed 2 sau patchClip, fixture S): duration ≈ 1s,
    frame t=0.2 đỏ (nguồn 3,4), t=0.8 xanh lá (nguồn 4,6) — đúng ánh xạ
    t → 3+2t suy tay.
  - Case B (lá sâu speed 2 sau deep patch, fixture D): duration ≈ 8s,
    t=0.2 đỏ (lá nguồn 0,4), t=2.1 xanh lá (4,2), t=3.9 xanh lá (7,8),
    t=6 đỏ (anh em S2 nguồn 0–4, chứng tỏ S2 không bị đè/sửa).

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test thuần mới `nestedDeepSpeed.test.ts` | **16 pass, 0 fail** |
| Test store thật `nestedDeepSpeed.store.test.ts` (esbuild bundle) | **8 pass, 0 fail** |
| Test render MP4 thật `test_round17_n3_nested_deep_speed_render.js` | **11/11 check pass** |
| Hồi quy `nestedDeep.test.ts` (đợt 15 T3) | 16 pass, 0 fail |
| Hồi quy `nestedSpeedcurve.test.ts` (đợt 14 R5) | 22 pass, 0 fail |
| Hồi quy `speedcurveTrim.test.ts` (đợt 13 C5) | 18 pass, 0 fail |
| Hồi quy `nestedStore.test.ts` (đợt 16 H2) | 11 pass, 0 fail |
| Hồi quy `nestUtils.test.ts` | 28 pass, 0 fail |
| Hồi quy `nestedStore.store.test.ts` (đợt 16 H2, bundle) | 8 pass, 0 fail |
| Hồi quy `splitPatch.store.test.ts` (đợt 15 T4, bundle) | 12 pass, 0 fail |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (sau khi thêm 2 file test mới vào exclude của tsconfig theo đúng quy ước mọi `*.test.ts` khác) |
| `vite build` (apps/web) | **pass** (built in 14.39s; chỉ warning chunk > 500kB có sẵn từ trước) |

Ghi chú quá trình: test thuần lúc đầu 14/15 — case chain-rỗng rớt
không phải do code sai mà do guard N3 làm việc đúng: fixture đó có cha
ghi trim [0,4) nhưng lá duy nhất thu ngắn 4 → 2 làm nguồn cha co dưới
trim.out. Đợt này đã bổ sung luôn guard cho trường hợp cha KHÔNG ghi
trim (duration cha lệch theo nguồn) và khóa cả hai trường hợp bằng
test — xem §1b. Không sửa hành vi của updateNestedInnerClip (R5) dù
nó có cùng vấn đề tiềm ẩn ở tầng 1, để tránh hồi quy ngoài phạm vi N3.

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **Nested mang speedKeyframes vẫn chưa có ngữ nghĩa duration**: field
  này là duck-typed (NestedClip của spec không có nó) và render worker
  CẤM nó ở nested (server/render/src/nested.js `nestedWindow` fail khi
  gặp speedKeyframes ở clip lồng nhau). Vì vậy patchClip đổi
  speedKeyframes của nested KHÔNG tính lại duration (curve là ánh xạ
  theo thời gian output, giống patchCurve của clip thường vốn cũng
  không đổi duration), và patch đổi speed hằng trên nested đã mang
  curve cũng giữ nguyên duration — tránh ghi duration sai rồi render
  vẫn fail. Đây là giới hạn ghi rõ, không phải tính năng bị bỏ sót lặng
  lẽ; muốn nested có curve thật thì cần spec + render worker hỗ trợ
  trước (ngoài phạm vi luồng này, và bị cấm sửa render trong đợt này).
- **patchClip speed nested ngoài [0.25, 4] không tự kẹp**: duration giữ
  nguyên, speed không hợp lệ vẫn được ghi vào clip (validateNestedClip
  sẽ báo speed). SpeedPanel kẹp trước khi gọi cho clip thường, nhưng
  nested không đi qua SpeedPanel (nó không phải SpeedableClip) nên
  đường patchClip trực tiếp vẫn có thể ghi speed xấu — UI cho nested
  speed (nếu làm sau) phải kẹp như SpeedPanel.
- **patchClip speed nested không kiểm tra đè clip kề**: đổi speed làm
  duration co/giãn nhưng clip sau trên cùng track không dồn theo
  (giống hành vi patchClip duration của H2). SpeedPanel cho clip thường
  có kiểm tra wouldOverlap, nhưng nested không đi qua panel đó.
- **updateNestedInnerClip (R5, tầng 1) không có guard nguồn của cha**
  như hàm deep mới: thu ngắn lá duy nhất của một nested 1 tầng vẫn có
  thể làm lệch duration/trim của cha mà không bị chặn. Cố tình không
  sửa trong đợt này để tránh hồi quy ngoài phạm vi; đợt sau nên áp cùng
  guard cho R5 (hoặc cho deep path với chain rỗng thay thế hẳn R5).
- **Deep split không xử lý reverse + curve** (validator cấm tổ hợp này
  nên trả error, giống store splitClipAt); deep split cho kind khác
  video/audio/text/sticker/image → error.
- **Lá đổi speed hằng trong khi đang có curve → error** (phải thay
  curve trước): đây là chặn chủ động để tránh duration theo speed hằng
  mâu thuẫn với tích phân curve, không phải thiếu sót lặng lẽ — nhưng
  UX chưa có gợi ý "thay curve" trong panel (panel deep chưa thuộc
  phạm vi luồng này; store action chỉ trả ok false).
- Render chỉ đo ở **64×64, 30fps, nguồn màu phẳng tổng hợp**, speed 2 ở
  top và ở lá sâu, sâu tối đa 3 cấp qua render (sâu 4–8 cấp chỉ có ở
  tầng logic thuần, qua test depth vượt 8). Chưa đo 1080p/4K, footage
  máy quay thật, hay speed 0.25/4 ở tầng render.
- Nested có speedKeyframes/reverse vẫn bị split/trim từ chối như đợt 16
  (không có toast riêng — thuộc luồng UI khác, không phải N3).
- `dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage. Thư mục tạm của test render đã tự dọn khi pass (kiểm
  tra sau chạy: không còn `/tmp/vcut-n3deep-*`).

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/components/nested/nestUtils.ts`: `applyNestedSpeedDuration`,
  `NestedDeepPatch`, `updateNestedDeepInnerClip`, `splitNestedDeepInnerClip`
  (+ import `splitSourceAt`, `splitSpeedKeyframes` từ video-spec).
- `apps/web/src/store.ts`: import 3 hàm + type mới; nhánh
  nested-speed trong `patchClip` (apply); 2 action
  `updateNestedDeepInnerClip` / `splitNestedDeepInnerClip` (khai báo +
  triển khai); sửa 1 comment H2 lỗi thời về nợ speed.
- `apps/web/src/components/speed/nestedDeepSpeed.test.ts`: test thuần mới
  (16 case).
- `apps/web/src/components/speed/nestedDeepSpeed.store.test.ts`: test qua
  store thật (8 case, bundle esbuild).
- `apps/web/tsconfig.json`: thêm 2 file test mới vào exclude (đúng quy
  ước mọi `*.test.ts` khác).
- `server/render/src/test_round17_n3_nested_deep_speed_render.js`: test
  render MP4 thật mới (11 check, chỉ gọi render.js).
- `docs/PHASE9_ROUND17_N3_NESTED_SPEED_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình):
- `server/render/src/render.js`, `server/render/src/nested.js` và mọi
  harness (chỉ thêm file test mới gọi render.js).
- Helper 1 tầng cũ `nestedLeafVisibleSpeedCurve`, `updateNestedInnerClip`
  (R5), `splitNestedClip`/`trimNestedClip` (H2), file i18n, panel UI
  toast (luồng khác lo).
- File stage trong `~/workspace/repo-1-push/paths-loop/` và
  `build-loop-log.md` (parent gộp/log).
- Không push, không tag/release, không ghi qua GitHub.
