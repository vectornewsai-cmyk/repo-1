# Phase 9 đợt 16, luồng H6 — tách module harness dùng chung + footage phi-lavfi: LIMITS (trung thực)

> Đợt lớn 08:03 28/10/2026, luồng H6 (chỉ luồng này).
> Luật cứng đã giữ: KHÔNG push GitHub, KHÔNG release/tag, KHÔNG code giả,
> KHÔNG đưa binary vào danh sách file đổi, KHÔNG sửa build-loop-log.md,
> KHÔNG sửa file trong `~/workspace/repo-1-push/paths-loop/` (parent stage).
> Chỉ sửa code trong `~/workspace/repo-1`. FFmpeg đo: 8.1.2.
> Thang phân loại V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8.

## 1. Việc đã làm

### 1.1. Tách logic dùng chung → `server/render/src/harnessShared.js` (mới)
- Đợt 15 kết luận 3 harness V11/V12/V14 chứa 3 bản copy của cùng logic
  radial/dissolve. Luồng này tách phần logic ĐÃ trùng nhau ở cả 3 nơi
  thành 1 module duy nhất: `pointInPolygon`, `regionCovers` (gồm kind
  `dissolve-noise` dùng mask frand float32 đúng vf_xfade.c, đánh giá tại
  chỉ số pixel nguyên `floor(x), floor(y)`), `radialWeight` (smoothstep,
  ưu tiên hàm thật `radialGradientWeight` từ module transitionPreview,
  fallback đúng công thức nhiệm vụ giao), `layerPixelAlpha` (bán kính
  tại chỉ số nguyên so với tâm CẮT NGUYÊN và rMax của chính region),
  `layerCovers`, cùng 2 setter `setDissolveFrand`/`setRadialWeight`.
- Cả 3 harness nay import từ module này; 2 dòng gán hàm thật trong mỗi
  harness đổi thành gọi setter, còn lại không đổi.
- Kiểm chứng tương đương TRƯỚC khi refactor (trích đúng hàm gốc từ 3
  file chưa sửa, chạy cùng hàm fake frand/radial cho cả 2 phía):
  **41.577 so sánh, khác: 0** — gồm mọi kind region (rect, rects,
  circle, circle-inverted, polygon, polygon-inverted, radial-gradient
  thường/đảo, dissolve-noise thường/đảo, bars-fade, kind lạ, null),
  nhiều dx/scale, và quét trực tiếp `radialWeight`. Trong lúc viết
  module đã tự bắt 1 lỗi gõ ở case `rects` (ghi nhầm `region.w` thay
  vì `r.w`) và sửa trước khi chạy kiểm chứng — lỗi này KHÔNG có trong
  bản gốc harness, chỉ có trong bản nháp module; kiểm chứng 41.577
  chạy trên bản module ĐÃ sửa.

### 1.2. CỐ TÌNH chưa tách `rasterizeTransitionPreview` — vì H1 đang sửa nó
- Khi H6 bắt đầu, H1 (cùng đợt 16) đang sửa trực tiếp cả 3 file harness:
  file đổi mtime 01:10–01:11 UTC trong lúc H6 chạy baseline, thêm hàm
  `barsFadeIsBar`, nhánh composite bars-fade trong
  `rasterizeTransitionPreview`, case bars-fade và dòng gán loader.
  Dời `rasterizeTransitionPreview` vào module chung lúc đó sẽ xung đột
  và có thể làm mất nhánh bars-fade của H1.
- Quyết định: CHỈ tách 5 hàm thuần túy bên dưới (không chứa logic
  bars-fade), giữ nguyên `rasterizeTransitionPreview` ở từng harness
  (nó chỉ còn là vòng lặp gọi hàm chung + nhánh bars-fade của H1).
  Khi H1 đã xong hẳn, đợt sau có thể dời nốt hàm này về module chung
  mà không đổi số đo. H6 KHÔNG sửa bất kỳ dòng logic bars-fade nào
  của H1: số lần xuất hiện chuỗi `barsFade` giữ nguyên sau refactor
  (đếm theo dòng: V11 9, V12 8, V14 8 — khớp trước/sau), các dòng gán
  `barsFadeIsBarFn` và nhánh composite bars-fade nguyên vẹn.

### 1.3. Đo parity dissolve/circle trên nguồn phi-lavfi ở 720p
- Script đo mới: `server/render/src/measure_h6_photo_parity.js`.
  Phương pháp khớp quy ước harness: khung 1280×720, xfade duration=1
  offset=1, format rgb24, lấy frame giữa transition (index 45 @30fps,
  t=1.5, p=0.5); preview tính từ `describeTransition(type, 0.5, …)`
  module thật + CHÍNH module chung `harnessShared.js`, chỉ khác ở chỗ
  lấy màu pixel từ frame A/B thật thay vì màu thuần đỏ/xanh — nhờ đó
  phép đo này đồng thời kiểm chứng module chung trên nội dung chi tiết.
- GHI RÕ nguồn (không mạo nhận footage máy quay thật — trong repo
  KHÔNG có file footage máy quay nào; xem §3):
  - P "photo-like": 2 ảnh tĩnh TỔNG HỢP bằng FFmpeg (gradient + nhiễu
    + khối hình chữ nhật) — trừu tượng, giống ảnh chụp ở mức bố cục,
    KHÔNG phải ảnh chụp thật.
  - L "lavfi đối chứng": 2 frame testsrc2/smptebars 720p, cùng phương
    pháp, để so sánh apples-to-apples với P.
  - C "file trong repo": `server/render/examples/media/clip1.mp4` và
    `clip2.mp4` — đã kiểm tra bằng mắt: cả hai đều là test pattern
    tổng hợp (clip1 smptebars/testsrc2, clip2 smptebars + drawtext
    timestamp), KHÔNG phải footage máy quay; cặp này chỉ chứng minh
    đường decode file cho cùng kết quả.
  - S "solid đối chứng": đỏ/xanh thuần 720p, cùng phương pháp.
- Ngữ nghĩa thời gian của xfade đã kiểm chứng TRƯỚC khi đo cặp C:
  frame giữa transition của cặp clip1/clip2 hiện timestamp cháy của
  clip2 là `00:00:00.500` (frame 15) → tại t=1.5 (offset=1, duration=1),
  xfade lấy A(t=1.5) và B(t=0.5). Script dùng đúng cặp frame này cho
  preview của cặp C.

## 2. Kết quả (số đo thật)

### 2.1. Harness sau refactor = trước refactor (trừ 1 case nhiễu — xem §2.2)
- Baseline sau H1 (trước refactor): V11 29 case FAIL 0; V12 37 case
  FAIL 0, PENDING 0; V14 KHỚP 21, XẤP XỈ 1, LỆCH 0, PENDING 0,
  STAT-APPROX 1, STRUCT-OK 0, STAT-LỆCH 1. Trong đó bars-fade KHỚP ở
  cả 3 harness (MAD 0,30/0,30/0,296).
- Sau refactor (diff đã chuẩn hoá thời gian/tmp): V11 GIỐNG HỆT từng
  dòng; V12 GIỐNG HỆT từng dòng; V14 chỉ khác đúng 1 dòng glitch
  (xem §2.2). Các case trong phạm vi refactor (toàn bộ transition,
  gồm circleopen/circleclose 0,33, dissolve 0,00, bars-fade 0,30) đều
  giữ nguyên số MAD. Kết luận: refactor KHÔNG đổi hành vi; KHÔNG có
  harness nào bị vỡ phải revert.

### 2.2. Case glitch V14 lật giữa 2 lần chạy — là nhiễu có sẵn, không phải hồi quy
- Dòng glitch duy nhất khác nhau: trước refactor là STAT-LỆCH
  (max 230, TB 15,35), sau refactor là STRUCT-OK (max 40, TB 8,85).
- Bằng chứng không phải do refactor: (a) H6 không đụng bất kỳ dòng
  effect nào của V14; (b) chạy lại V14 lần nữa KHÔNG sửa code cho
  đúng kết quả STRUCT-OK như lần sau refactor (2 lần sau refactor
  giống hệt nhau); (c) lịch sử case này đã từng lật: đợt 15 parent
  verify V14 là STRUCT-OK 1, baseline sau H1 là STAT-LỆCH 1.
  Nguyên nhân: kiểm tra cấu trúc glitch dùng nhiễu theo thời gian
  (`noise=alls=20:allf=t`) nên mỗi lần chạy nhiễu khác nhau. Nợ mở:
  case glitch V14 vốn không ổn định, không nên dùng làm cổng chặn.

### 2.3. Parity nguồn phi-lavfi ở 720p, mức mô hình rgb24
| Nguồn | dissolve MAD / ≤8 | circleopen MAD / ≤8 | Hạng |
|---|---|---|---|
| P photo-like (tổng hợp) | 0,0012 / 100,00% | 0,2817 / 100,00% | KHỚP, KHỚP |
| L lavfi đối chứng | 0,0049 / 100,00% | 0,3919 / 100,00% | KHỚP, KHỚP |
| C file repo clip1/clip2 | 1,2424 / 97,48% | 1,5943 / 96,47% | XẤP XỈ, XẤP XỈ |
| S solid 720p đối chứng | 0,0066 / 100,00% | 0,3337 / 100,00% | KHỚP, KHỚP |
| P photo-like, yuv420p e2e | 50,6058 / 33,95% | 49,3351 / 37,55% | LỆCH, LỆCH |
- Chẩn đoán circleopen trên cặp P theo vành rho: MAD từng vành đều
  thấp và đều (0,124–0,351, không có vành nào vọt) → không có lỗi mô
  hình cục bộ nào; số này khớp sàn lượng tử hoá của circle (0,33 ở
  màu thuần) chứ không phải sai đường cong.
- KẾT LUẬN VỀ BADGE: **nội dung phi-lavfi KHÔNG làm đổi hạng badge
  ở mức mô hình rgb24** — dissolve/circleopen vẫn KHỚP trên cả nguồn
  photo-like lẫn lavfi, với cùng phương pháp. Badge matched giữ nguyên
  phạm vi đã chốt đợt 15: "matched ở mức mô hình xfade rgb24".
- Cặp C chỉ XẤP XỈ: giải thích khả dĩ nhất là căn thời gian frame trên
  nguồn chuyển động (test pattern chuyển động nhanh + timestamp mp4),
  không phải lỗi mô hình — vì cùng phương pháp đó trên nguồn tĩnh
  (P, L, S) đều KHỚP, và bản thân cặp C cũng là test pattern tổng hợp
  chứ không phải footage thật nên không dùng nó để kết luận về footage.
- Ô yuv420p e2e trên cặp P vẫn LỆCH nặng (MAD ~50), khớp đúng phát
  hiện đợt 15 (MAD 47–71): tổn thất nằm ở bước 444→420 sau xfade,
  không phải ở mô hình. Phạm vi badge KHÔNG mở rộng sang đầu ra yuv420p.

### 2.4. Lần đo đầu bị HỦY (ghi rõ để không ai dùng nhầm số)
- Lần chạy đầu của script đo: dissolve P 0,6823 / 99,10% KHỚP, nhưng
  circleopen P 2,4768 / 89,25% LỆCH — rồi script chết giữa chừng vì
  `/tmp` đầy (mỗi lần render 60 frame 720p rgb24 là 165MB, `/tmp` VM
  chỉ 512MB). Nguyên nhân số lệch: lần đó đầu vào ảnh tĩnh không ép
  framerate 30 nên bước chuyển fps của đầu ra làm frame 45 lệch khỏi
  đúng p=0.5 (dissolve nhạy ít hơn nên vẫn KHỚP sát nút, circleopen
  nhạy với p qua mid=3p−1 nên lệch rõ). Đã sửa script: ép đầu vào
  framerate 30 + chỉ select đúng 1 frame giữa (không ghi 60 frame),
  chạy lại toàn bộ → số §2.3. Các số của lần chạy đầu KHÔNG được dùng
  làm kết quả; chỉ ghi lại đây để giải thích vì sao có 2 bộ số.

## 3. Kiểm chứng đã chạy
- `node --check` cho cả 5 file: harnessShared.js, 3 harness, script đo.
- Kiểm chứng tương đương module chung: 41.577 so sánh, khác 0 (§1.1).
- Harness: baseline sau H1 (V11 29 / V12 37 / V14 như §2.1), sau
  refactor (V11/V12 giống hệt, V14 chỉ khác dòng glitch §2.2), chạy
  lại V14 lần nữa (STRUCT-OK lặp lại, khớp lần sau refactor).
- Script đo photo parity chạy trọn vẹn exit 0 (lần 2, sau khi sửa lỗi
  đĩa/fps — xem §2.4).
- `tsc --noEmit -p tsconfig.json` trong `apps/web`: exit 0, không lỗi.
  (Không chạy `vite build` toàn dự án: luồng này không sửa code TS
  nguồn web, chỉ sửa file harness .js + thêm script đo .js; tsc đã đủ
  chứng minh nguồn web không bị ảnh hưởng. File
  `transitionPreview.test.ts` có trong repo nhưng `apps/web` không
  cấu hình runner vitest nên không có lệnh test đơn vị chạy được cho
  nó — không mạo nhận đã chạy test đó; module này đã được kiểm chứng
  qua đường transpile + chạy harness.)
- KHÔNG chạy click-test browser thật (nợ mở chung của repo).

## 4. Giới hạn chưa làm được / nợ còn lại (trung thực)
- `rasterizeTransitionPreview` vẫn còn 3 bản (lý do §1.2) — đợi H1
  xong hẳn rồi đợt sau dời nốt; từ nay sửa mô hình radial/dissolve
  chỉ cần sửa 1 nơi (harnessShared.js), nhưng sửa composite thì vẫn
  phải sửa 3 nơi.
- Footage máy quay THẬT vẫn chưa đo: repo không có file nào như vậy
  (mp4 duy nhất trong `examples/media` là test pattern). Nguồn
  "photo-like" ở đây là ảnh tĩnh tổng hợp (gradient + nhiễu + khối),
  không có chuyển động, không có chi tiết quang học thật (lá cây, da
  người, nhiễu cảm biến). Kết luận "không đổi hạng badge" chỉ đúng
  trong phạm vi: nội dung tĩnh có chi tiết + nhiễu ở mức mô hình
  rgb24, chưa bao quát footage chuyển động thật.
- Cặp C XẤP XỈ chưa được truy nguyên tới cùng (giả thuyết căn frame
  thời gian, chưa chứng minh bằng thực nghiệm đối chứng từng frame).
- Case glitch V14 không ổn định giữa các lần chạy (§2.2) — không
  dùng làm cổng chặn cho tới khi có seed cố định hoặc ngưỡng thống kê.
- `/tmp` VM chỉ 512MB: script đo mới đã sửa để chỉ giữ 1 frame/lần
  render, nhưng bất kỳ script 720p nào khác còn ghi full raw 60 frame
  vẫn sẽ đầy ổ — bài học chung cho các luồng đo sau.
- Log đo chi tiết nằm ở `/tmp` (không đưa vào batch stage theo quy
  ước): `photo-parity2.log` là lần chạy chuẩn; script đo trong repo
  chạy lại được để tái tạo số §2.3.

## 5. File đổi/thêm (text, không binary — parent stage)
- `server/render/src/harnessShared.js` (MỚI)
- `server/render/src/test_v11_parity.js` (SỬA: import module chung,
  xoá 5 hàm trùng, 2 dòng gán → setter, dọn comment mồ côi)
- `server/render/src/test_v12_parity.js` (SỬA: như trên)
- `server/render/src/test_v14_parity.js` (SỬA: như trên; giữ nguyên
  SUPPORTED_REGION_KINDS, regionKinds và toàn bộ phần effect)
- `server/render/src/measure_h6_photo_parity.js` (MỚI)
- `docs/PHASE9_ROUND16_H6_SHARED_FOOTAGE_LIMITS.md` (MỚI — file này)
