# Phase 9 đợt 45, luồng A1 — Settle-drop sâu: mirror W2 + cửa sổ trọn GOP hỏng — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code, KHÔNG sửa tsconfig.json / preview.tsx /
store.ts / bridge / file của luồng khác, KHÔNG tự stage batch push
(parent gộp). Module mới là thuần + KHÔNG được import bởi production
code nào, nên nó không đổi hành vi app — nó chỉ là công cụ đo cho
lần headed tiếp theo.

Đóng nợ: docs/PHASE9_ROUND44_LIMITS.md §4 nợ 2 +
docs/PHASE9_ROUND44_Z1_SETTLE_LIMITS.md §6.1: nhánh thử lại asset:
vẫn chưa bắt được SUCCESS; cần mirror thêm decodeFrom/decodeTo/key/
decoded của W2 để phân biệt "W2 decode một phần qua GOP lành" với
fast-path, rồi chọn cửa sổ W2 nằm trọn trong GOP hỏng; tab ẩn ≥ 5
phút; click-test thật vỏ UI .vcut.json.

## 0. Kết luận ngắn (không vượt số đo)

1. **Mirror đã xong, test xanh thật (20/20).** Lần headed sau giờ
   phân biệt được fast-path / partial-GOP / fail bằng trường thật
   của W2, thay vì chỉ ok/failed như trace Z1.
2. **Phát hiện đáng chú ý từ MÔ HÌNH (không phải số đo headed —
   đọc kỹ §3 trước khi trích):** với đúng tham số Z1 (mốc 32,7 s,
   fps 30, GOP 90 frame, cửa sổ hiệu dụng 75), mirror cho cửa sổ
   decode [900,981] nằm TRỌN trong GOP hỏng [900,990), KHÔNG vắt
   qua GOP lành. Nếu lần headed sau đo được decodeFrom = 900 thật
   thì giả thuyết "tràn GOP lành" của Z1 là SAI cho attempt đó, và
   câu hỏi chuyển thành "vì sao decoder vẫn nhả frame trong GOP
   hỏng dù IDR đã zero" (mirror đã tách sẵn chẩn đoán này thành
   `partial-inside-corrupt`). Nếu headed đo được decodeFrom < 900
   thì giả thuyết Z1 được xác nhận. Cả hai khả năng đều chưa ngã
   ngũ — mirror chỉ làm cho lần đo sau phân biệt được, không tự
   nó kết luận.
3. **Cửa sổ W2 cho lần headed sau đã chọn xong:** mốc 32,4667 s
   (targetPos 974), decode [900,974] nằm trọn GOP hỏng, tránh
   fast-path bằng cách dịch key khi trùng. Dùng mốc này thay 32,7 s
   để W2 về đường ok=false nếu giả thuyết tràn GOP lành đúng.
4. **SUCCESS trên đường asset: VẪN MỞ.** Luồng này không chạy
   browser headed nên không có bằng chứng headed mới nào về
   SUCCESS; không claim tiến bộ nào ngoài công cụ đo.
5. **Tab ẩn ≥ 5 phút: CHƯA ĐO** (NOT-MEASURED, không bịa số).
   **Click-test thật vỏ UI .vcut.json: CHƯA LÀM** — chỉ validate
   vỏ + fixture trong /tmp (§4).

## 1. Thay đổi code (chỉ file hậu tố 45A1 + file LIMITS này)

- Mới: `apps/web/src/lib/settle45A1.ts` — module thuần, không
  import production code:
  - `mirrorDecodeWindow`: tái tạo công thức production (đường
    full-file): presentFrom = max(0, targetPos − effectiveWindow
    + 1); decodeFrom = keyframe <= presentFrom (GOP-align);
    decodeTo = targetPos; key = "from-to". Hỗ trợ cả keyframes
    lẫn gopFrames đều.
  - `analyzeWindowVsCorrupt`: quan hệ cửa sổ vs GOP hỏng
    (inside / straddles-start / chạm biên / số frame lành trước,
    hỏng, lành sau).
  - `classifyW2`: phân loại diagnostic theo luật production —
    fast-path (key == lastWindowKey + cache > 0 → true không
    decode) trội hơn mọi nhánh; decoded null → unknown (đúng
    trạng thái trace Z1, cấm kết luận từ ok một mình);
    decoded <= 0 → fail (expectedOk=false); decoded == window
    → full; 0 < decoded < window → partial-gop (vắt qua đầu GOP
    hỏng) / partial-inside-corrupt (trọn GOP hỏng mà vẫn ra
    frame) / partial-other. Trả kèm expectedOk + consistent để
    phát hiện harness đọc sai trường (vd ok=true mà decoded=0).
  - `chooseCorruptWindow`: chọn cửa sổ W2 nằm trọn GOP hỏng.
    Chứng minh trong code: present nằm trọn GOP hỏng ⇒ decode
    sau GOP-align rơi đúng đầu GOP hỏng ⇒ decode cũng trọn GOP
    hỏng. Khả thi ⇔ effectiveWindow <= độ dài GOP; chọn targetPos
    nhỏ nhất khả thi, dịch +1 nếu key trùng lastWindowKey (tránh
    fast-path); GOP hỏng quá ngắn hoặc GOP lành xen kẽ thì bỏ qua
    sang GOP hỏng sau; không khả thi thì trả requiredMaxWindow
    (độ dài GOP hỏng dài nhất) để biết phải thu cửa sổ xuống bao
    nhiêu.
- Mới: `apps/web/src/lib/settle45A1.test.ts` (20/20, §5).
- Mới: `apps/web/scripts/settle45A1-probe.mjs` (chỉ đọc/probe,
  §4–§5).
- Mới: `docs/PHASE9_ROUND45_A1_SETTLE_LIMITS.md` (file này).
- KHÔNG sửa: tsconfig.json (cố tình — test import
  `"./settle45A1"` không đuôi `.ts` để tsc bundler-resolution
  qua được mà không cần exclude như các test đợt trước; esbuild
  bundle vẫn resolve bình thường, đã chạy thật), preview.tsx,
  store.ts, reverseWebcodecs.ts, bridge, mọi file luồng khác.
  Không có file nào của luồng này được import bởi production.

## 2. Luật production được mirror (nguồn: code thật, không suy diễn)

- Full-file path, reverseWebcodecs.ts (đường ensureWindowForTime
  qua bytes): decodeGop trả decoded; decoded <= 0 → unsupported
  + return false; decoded > 0 → đi tiếp tới evict + return true
  (kể cả decode một phần — frame thiếu rơi về đường element qua
  frameAt null / missing). Đường GOP-range (ensureWindowViaGop)
  có cùng luật decoded <= 0 → false ở tầng decodeGop.
- Fast-path: key === lastWindowKey && cache.size > 0 → return
  true ngay, không decode (cùng hàm, trước khối decode).
- GOP-align: decodeFrom bắt đầu từ sample decode-nhỏ nhất của
  cửa sổ present rồi đi ngược tới keyframe gần nhất (gopStartFor
  trong đường decode-ahead; cùng nguyên tắc ở đường full-file).

## 3. Số đo mô hình (KHÔNG phải số đo headed — cấm trích làm bằng chứng)

Tham số mô hình: fps 30, GOP 90 frame, GOP hỏng [900,990) (tức
[30,33) giây — fixture Y1/Z1), cửa sổ hiệu dụng 75 (mặc định
REVERSE_CACHE_DEFAULT_WINDOW_FRAMES; với file 69,86 MiB 360p thì
min(75, ngân sách) vẫn là 75 nên 75 là giá trị mirror đúng cho
fixture này, nhưng lần headed sau vẫn phải đọc effectiveWindow
thật từ controller, không tin mù số này).

| Mốc W2 | Present | Decode | Quan hệ GOP hỏng | Chẩn đoán nếu decoded một phần |
|---|---|---|---|---|
| 32,7 s (Z1) | [907,981] | [900,981] | trọn GOP hỏng | partial-inside-corrupt, KHÔNG phải partial-gop |
| 31,0 s (ví dụ tràn) | [856,930] | [810,930] | vắt đầu GOP hỏng: 90 lành + 31 hỏng | partial-gop (đúng giả thuyết Z1) |
| 32,4667 s (chọn cho lần sau) | [900,974] | [900,974] | trọn GOP hỏng | kỳ vọng fail (decoded=0 → ok=false) nếu GOP hỏng thật sự chặn decode |

Giới hạn của mô hình (ghi để lần headed không tin mù):
- Mirror làm việc trong không gian vị trí present và giả định mỗi
  GOP chiếm một đoạn present liên tục (đúng với GOP-align, sai
  lệch có thể xảy ra với open-GOP / B-reorder xuyên GOP). Khi đó
  decodeFrom thật (lastDecodeRange của controller) thắng mirror.
- Mirror không biết cache/evict thật lúc W2 chạy (fast-path cần
  lastWindowKey + cacheSizeBefore thật) và không biết decoded
  thật — 3 trường đó bắt buộc phải đọc từ controller ở lần headed.
- Vì vậy §3 chỉ đủ để CHỌN mốc đo và ĐỊNH NGHĨA chẩn đoán, không
  đủ để kết luận Z1 sai hay đúng.

## 4. Probe settle45A1-probe.mjs — kết quả thật

Chạy: `node apps/web/scripts/settle45A1-probe.mjs` → 6 mục,
0 FAIL, 1 NOT-MEASURED (chi tiết trong output của script):

- Vỏ UI .vcut.json, mẫu ngoài repo: PARTIAL —
  `~/workspace/tmp-round44-z3/relink-small.vcut.json` parse được
  nhưng clip duy nhất có src `clip2.mp4` (file thường), không có
  clip `asset:` nên mẫu này không phủ đường asset:. Đây là giới
  hạn của mẫu, không phải lỗi vỏ.
- Vỏ UI .vcut.json, fixture tự tạo: PASS — fixture
  `/tmp/settle45a1-probe/a1-sample.vcut.json` (chỉ nằm ở /tmp,
  KHÔNG vào repo) đọc lại hợp lệ: 1 clip src `asset:a_probe45a1`,
  duration 8 > 0. Đây là kiểm tra VỎ, không phải click-test thật.
- Mô phỏng tab ẩn dọn ở mức logic: PASS — phân loại W2 không phụ
  thuộc hệ số throttle timer (dùng counter/cache, không dùng
  wall-time); replay Z1 cho unknown + cửa sổ trọn GOP hỏng theo
  mô hình (§3).
- Cửa sổ headed tiếp theo: PASS — targetPos 974, t = 32,4667 s,
  decode [900,974].
- Tab ẩn ≥ 5 phút thật: NOT-MEASURED — phiên này Node-only,
  không browser headed, không visibilityState/throttle thật nên
  KHÔNG có số timer/rAF nào được claim. Chrome headed có sẵn ở
  cache Playwright (chromium-1248) nên lần headed sau khả thi.
  Điều kiện chạy headed cho luồng sau: Chromium headed + CDP,
  dwell 300.000 ms (poll visibility mỗi 5 s, phải luôn hidden),
  aim siêu chặt (như Z1), W2 ở mốc 32,4667 s, và mirror thêm
  decodeFrom/decodeTo/key/decoded + lastWindowKey + cacheSize
  trước W2 vào status (harness Z1 hiện chỉ mirror ok/failed —
  cần sửa entry headed, không sửa production).

## 5. Kiểm chứng

- Mới `settle45A1.test.ts`: **20/20 pass** (esbuild bundle
  --format=esm ra /tmp scratch, chạy bằng node — đúng mẫu đợt
  44; đã chạy lại sau khi đổi import không đuôi `.ts`, vẫn
  20/20).
- Probe `settle45A1-probe.mjs`: **0 FAIL / 1 NOT-MEASURED**
  (6 mục, §4).
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi ở file 45A1**
  (grep "45A1" ra 0 dòng). LƯU Ý TRUNG THỰC: lần chạy tsc toàn
  repo này vẫn còn lỗi ở file của luồng đợt 45 khác đang chạy
  song song (`pause45A2.test.ts` TS5097, `relinkEdge45A3.test.ts`
  TS2367) — đó không phải file của luồng A1, luồng A1 không sửa
  thay (quy tắc không đụng file luồng khác); parent cần đối chiếu
  lại ở bước gộp khi các luồng đó xong.
- `vite build` không chạy trong luồng này: lib/test/script mới
  không được import bởi production entry nên không ảnh hưởng
  build app; parent kiểm chứng ở bước gộp.
- Không chạy lại: mọi phép đo browser headed (SUCCESS asset:,
  tab ẩn 5 phút, click-test .vcut.json qua ProjectMenu) — đều là
  nợ mở (§6).

## 6. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **SUCCESS trên đường asset: vẫn chưa bắt được, không có bằng
   chứng headed mới.** Mirror + cửa sổ chọn sẵn chỉ là công cụ
   cho lần headed sau; chưa có attempt headed nào dùng chúng.
2. **Giả thuyết tràn GOP lành của Z1: chưa xác nhận cũng chưa
   bác bỏ.** Mô hình §3 gợi ý cửa sổ Z1 nằm trọn GOP hỏng, nhưng
   đó là mô hình với giả định GOP-align + eff 75 — chỉ headed với
   decodeFrom/decodeTo/decoded thật mới ngã ngũ (2 khả năng ở
   §0.2, và mirror phân biệt được cả hai).
3. **Tab ẩn ≥ 5 phút: chưa đo** (NOT-MEASURED); chưa đo ẩn giữa
   chừng prefetch, Safari/máy thật.
4. **Vỏ UI .vcut.json: chưa click-test thật** (chỉ validate vỏ +
   fixture /tmp); vòng draw/toggle cho clip asset: trên browser
   thật vẫn là nợ mở từ Z1 §4.
5. **Chỉ mô hình trên một fixture:** 360p GOP 90, GOP hỏng
   [900,990); chưa mô hình/đo 720p/1080p, GOP khác, file khác.
6. **Không claim gì thêm:** không đổi luật dọn T2/T4, không đổi
   ngưỡng cổng, không đổi ngưỡng GOP 32/128 MiB, không sửa
   production code, không nới tiêu chí SUCCESS của Y1/Z1.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settle45A1.ts`
- Mới: `apps/web/src/lib/settle45A1.test.ts` (20/20)
- Mới: `apps/web/scripts/settle45A1-probe.mjs`
- Mới: `docs/PHASE9_ROUND45_A1_SETTLE_LIMITS.md` (file này)
- Không sửa: mọi file khác (đặc biệt tsconfig.json, preview.tsx,
  store.ts, reverseWebcodecs.ts, bridge, file luồng khác).
  Scratch đo nằm ngoài repo (`/tmp/settle45a1-probe/`: bundle,
  fixture .vcut.json) — KHÔNG vào batch.
