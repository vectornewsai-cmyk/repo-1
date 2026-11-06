# Phase 9 đợt 35, luồng R2 — Baseline quiet đóng băng bundle — LIMITS

Ngày: 02/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG
binary vào repo, KHÔNG code giả/mock. KHÔNG sửa code sản phẩm
(`apps/web/src`, i18n, bridge), KHÔNG sửa paths-loop, KHÔNG sửa
build-loop-log (parent gộp) — chỉ sửa 2 script đo + file này +
7 JSON kết quả dạng text. Hiện thực hoá cải tiến đã ghi nhưng chưa
làm ở `docs/PHASE9_ROUND34_Q6_MEASURE_PROTOCOL_LIMITS.md` §5.8 và
nợ §3 mục 2 của `docs/PHASE9_ROUND34_LIMITS.md`.

## 0. Kết quả nói trước

1. **Cải tiến probe ĐÃ LÀM XONG và ĐÃ CHỨNG MINH TÁC DỤNG:**
   probe đo chuẩn v2 nay nhận `Q6_DIST` chỉ tới 1 dist đóng băng,
   kiểm tra sha256 đệ quy của dist trước và sau mỗi lượt, và đánh
   dấu INVALID (exit 3) khi dist đổi giữa chừng. Kiểm chứng cố ý
   làm bẩn dist giữa lượt → INVALID thật, fps bị loại thật (§2.3).
2. **Baseline quiet đóng băng CHƯA ĐẠT — báo trung thực, không
   claim baseline mới:** 6 lượt baseline trên cùng 1 dist đóng băng
   chỉ cho 1 lượt quiet (dày, 25,57 fps) và 0 lượt quiet thưa.
   Cần 3 lượt quiet/GOP mới gọi là baseline; hiện chỉ có n=1 dày
   và n=0 thưa. **Baseline quiet mới nhất vẫn là số đợt 33 của P5
   (thưa tv 7,09; dày tv 22,39).**
3. **KHÔNG claim khớp/lệch so với baseline đợt 33:** dist đóng băng
   đợt này là bundle `index-DgObvvhC.js` (build đợt 34), khác bundle
   `index-Cqp7uur1.js` của baseline đợt 33, và lượt quiet duy nhất
   là n=1. Mọi con số dưới đây chỉ là điểm dữ liệu trên bundle
   đóng băng này, không phải hồi quy, không phải baseline mới.

## 1. Dist đóng băng dùng cho đợt này

- Nguồn: bản sao nguyên vẹn `apps/web/dist` lúc bắt đầu đợt
  (bundle của đợt 34, sau bước gộp đợt 34), copy vào scratch
  `~/workspace/tmp-round35-r2/frozen-dist/` (scratch, KHÔNG vào
  batch, KHÔNG vào repo). Dist trên đĩa sau đó có thể bị luồng
  khác build lại — bản sao này không bị ảnh hưởng, đã kiểm tra
  lại sau cùng đợt: manifest không đổi (§2.2).
- Bundle: `index-DgObvvhC.js`, sha256
  `1f4ebcc7ae1ceff7ebcbfa9043ea6e829e89a689587bad9b8ba3b2fa382c3ca7`
  (file 1.023.236 byte). CSS đi kèm `index-CayZMJQu.css`.
- Manifest toàn dist (254 file, mọi file kể cả sticker PNG):
  sha256 `1a413dee23a20bc95cae1b51838f1220ec598e04e0d8be7156e3f7c365b013e0`.
  Đây là hash của các dòng `sha256  đường-dẫn-tương-đối` đã sắp
  xếp — đổi bất kỳ file nào cũng đổi hash này.
- Fixture đo: `sparse-gop-flat.mp4` / `dense-gop-flat.mp4` lấy từ
  `~/workspace/tmp-round34-q2/` (sha256 khớp đúng fixture của P5
  đợt 32: thưa `a4ea20eb…`, dày `c8aa090e…`), tức cùng nội dung
  fixture với baseline đợt 33 của P5 — chỉ khác bundle app.
- Cửa sổ đo: lượt 1–4 chạy lúc máy rảnh thật (load 0,06–1,35,
  chromePre 0); lượt dense-3 trở đi cửa sổ đóng vì luồng R4 đợt 35
  mở browser (14–17 tiến trình Chrome, load lên 2,6–4,4). Đợt này
  KHÔNG đo thêm khi tải cao — các lượt bù sau dense-3 đã dừng,
  chỉ còn lượt kiểm chứng INVALID (fps của nó bị loại theo thiết
  kế nên không phải baseline, §2.3).

## 2. Cải tiến probe: Q6_DIST / N2_DIST + kiểm tra sha256

### 2.1 Thay đổi code (chỉ script đo)

- `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  (harness N2, sửa tối thiểu): thêm `N2_DIST` — khi đặt, N2 dùng
  đúng thư mục đó làm dist (snapshot + kiểm tra dấu hiệu bundle)
  thay vì `apps/web/dist`. Không đặt → giữ nguyên hành vi cũ để
  lượt cũ không đổi ngữ nghĩa.
- `apps/web/scripts/probe-round34-q6-measure-protocol.mjs`
  (probe đo chuẩn v2, sửa chính):
  - Nhận `Q6_DIST` (đường dẫn tuyệt đối tới dist đóng băng).
    Từ chối chạy (exit 2, không mở browser) nếu thiếu
    `index.html` hoặc thiếu bundle `.js` trong `assets/`.
    Đã kiểm chứng cả 2 trường hợp từ chối (§2.3).
  - Hàm mới `distManifest(dir)`: liệt kê đệ quy mọi file, sắp xếp
    theo đường dẫn tương đối, sha256 từng file, rồi sha256 của
    toàn bộ danh sách. Chạy TRƯỚC và SAU mỗi lượt.
  - Truyền `N2_DIST=Q6_DIST` cho harness N2 qua env kế thừa của
    `spawnSync`, nên N2 snapshot đúng bản sao đóng băng.
  - SAU lượt, đối chiếu 3 điều kiện, vi phạm 1 → INVALID:
    (a) manifest Q6_DIST sau ≠ trước (dist đổi giữa chừng);
    (b) bundle trong `forward-hold.json` ≠ bundle đóng băng;
    (c) manifest snapshot `dist-snap` của N2 ≠ manifest đóng băng
    (bắt trường hợp N2 không nhận N2_DIST mà snapshot nhầm dist
    trên đĩa). File labeled ghi `frozenDist` (valid/validity/
    problems/manifest trước/sau/snapshot/bundleSha256) và
    `usableAsBaseline` (= true chỉ khi VALID và loadLabel=quiet).
    Lượt INVALID thoát 3, file labeled vẫn ghi đủ làm bằng chứng
    loại lượt, fps KHÔNG được dùng làm baseline kể cả khi
    loadLabel=quiet.
  - Không đặt `Q6_DIST` → giữ đúng hành vi đợt 34, ghi
    `frozenDist: null`, `validity: "UNVERIFIED"`,
    `usableAsBaseline: false` — không claim "cùng bundle".

### 2.2 Kiểm chứng code (không phải claim suông)

- `node --check` cả 2 script sửa: pass.
- Từ chối trước khi chạy: `Q6_DIST` không tồn tại → exit 2;
  thư mục chỉ có `index.html` không có bundle → exit 2; cả 2 đều
  không mở browser.
- 6 lượt baseline: `frozenDist.validity` = VALID cả 6, manifest
  trước = sau = `1a413dee…`, snapshot khớp, bundle khớp
  `index-DgObvvhC.js` — tức cơ chế đóng băng đã giữ đúng 1 bundle
  cho toàn batch, điều mà đợt 34 (4 bundle / 7 lượt) không làm
  được. Đây là phần cải tiến đã chứng minh xong, độc lập với kết
  quả baseline chưa đạt ở §3.

### 2.3 Kiểm chứng INVALID bằng cách làm bẩn dist giữa lượt

- Lượt kiểm chứng riêng (file
  `benchmarks/results/v35-r2-reverse-invalid-test.json`, KHÔNG
  tính vào baseline): chạy trên 1 bản sao dist khác
  (`invalid-test-dist`, cùng manifest ban đầu `1a413dee…`), sau
  12 s ghi thêm 1 dòng vào `stickers/star.png` của bản sao đó.
- Kết quả: probe thoát 3, `frozenDist.validity = "INVALID"`,
  `valid = false`, `problems = ["dist đóng băng đổi giữa chừng:
  manifest trước 1a413dee23a2 ≠ sau 638f84ed9891"]`,
  `usableAsBaseline = false`. fps của lượt này (9,22) bị loại,
  không dùng cho bất kỳ kết luận nào.
- Giới hạn của kiểm chứng này (ghi rõ): lần làm bẩn xảy ra SAU khi
  N2 đã snapshot dist (snapshot lấy lúc bắt đầu lượt), nên điều
  kiện (a) manifest trước/sau là điều kiện bắt được; điều kiện
  (c) snapshot ≠ đóng băng chưa được kích hoạt trong lần này —
  nó chỉ kích hoạt khi N2 snapshot nhầm nguồn (ví dụ N2 cũ không
  nhận `N2_DIST`). Cả 3 điều kiện đều có trong code, nhưng mới
  chỉ có (a) được kích hoạt thật; (b) và (c) mới được kiểm chứng
  bằng logic, chưa có lần kích hoạt thật. Đợt sau không cần làm
  lại kiểm chứng này trừ khi sửa lại code kiểm tra.

## 3. Baseline quiet đóng băng — KẾT QUẢ CUỐI: CHƯA ĐẠT

Tất cả lượt dưới đây chạy trên cùng dist đóng băng §1, cùng
fixture P5, phân loại bằng ngưỡng QUIET v2 của Q6 đợt 34 (load1
< 2,0 ở 3 mốc, xuôi trong [0,98, 1,02], gap rAF P50 xuôi ≤ 0,015 s,
predictedRate xuôi trừ tick biên ≥ 0,98, chromePre = 0). N2 verdict
PASS cả 6 lượt (phát ngược đúng + hold kích hoạt); nhãn tải mới là
thứ quyết định có dùng làm baseline được không.

| Lượt | Nhãn v2 | fps ngược | Xuôi | Lý do nhãn (tóm tắt) | Frozen |
|---|---|---|---|---|---|
| sparse-1 | under-load | 8,56 (draw 118/13,78 s) | 0,991 | predictedRate 0,961 (mất 0,215 s / 1 gap >100 ms trừ tick biên) | VALID |
| dense-1 | under-load | 26,39 (draw 360/13,64 s) | 1,012 | load1 cuối lượt 2,51 ≥ 2 | VALID |
| sparse-2 | under-load | 8,49 (draw 117/13,77 s) | 1,015 | predictedRate 0,972 (mất 0,142 s / 1 gap) | VALID |
| dense-2 | **quiet** | **25,57 (draw 350/13,69 s)** | 0,988 | — (đủ mọi tiêu chí) | VALID |
| sparse-3 | under-load | 6,12 (draw 101/16,50 s) | 1,006 | predictedRate 0,978 (mất 0,102 s / 1 gap) | VALID |
| dense-3 | under-load | 6,09 (draw 90/14,78 s) | 1,002 | load1 3,82/4,40/3,56; predictedRate 0,887; 14 Chrome trước lượt (luồng R4) | VALID |

File kết quả: `benchmarks/results/v35-r2-reverse-{sparse-1,dense-1,sparse-2,dense-2,sparse-3,dense-3}.json`
(+ file kiểm chứng INVALID ở §2.3, không tính vào baseline).

**Kết luận, nói thẳng:**

- **Không có baseline quiet đóng băng đợt 35:** cần 3 lượt
  quiet/GOP; thực tế chỉ có 1 lượt quiet dày (dense-2, n=1) và
  0 lượt quiet thưa. Lượt dense-2 là 1 điểm dữ liệu quiet trên
  bundle đóng băng, KHÔNG được gọi là baseline.
- **Không so sánh với baseline đợt 33 của P5:** bundle khác
  (`DgObvvhC` vs `Cqp7uur1`), n=1 vs n=3, và 5/6 lượt đợt này là
  under-load. Việc dense-2 quiet (25,57) nằm gần dày tv 22,39 của
  đợt 33, hay sparse under-load (8,49–8,56) nằm gần thưa tv 7,09,
  đều KHÔNG đủ điều kiện để claim khớp — và càng không đủ để
  claim lệch. Chỉ được ghi nhận là "cùng bậc độ lớn", không hơn.
- **Mẫu hệ thống cần đợt sau xem xét (không sửa ngưỡng lén
  trong đợt này):** cả 3 lượt thưa đều rớt nhãn quiet vì ĐÚNG 1
  gap rAF >100 ms trong phase xuôi (mất 0,102–0,215 s,
  predictedRate 0,961–0,978, chỉ thiếu 0,002–0,019 so với ngưỡng
  0,98), trong khi load thấp, chromePre = 0, xuôi trong band.
  Ngưỡng v2 được hiệu chuẩn từ cụm quiet đợt 33 của P5 (nơi 2/6
  lượt cũng có 1 gap như vậy nhưng predictedRate vẫn 0,993) — dữ
  liệu đợt này cho thấy gap đơn lẻ ở fixture thưa có thể là stall
  decode/khởi động của chính phase xuôi chứ không hẳn là tải máy.
  Giả thuyết này CHƯA chứng minh: cần phân tích vị trí gap trong
  phase xuôi (đầu phase hay giữa phase) trước khi đụng tới ngưỡng.
  Tuyệt đối không nới ngưỡng 0,98 sau khi đã thấy số rồi gán lại
  nhãn quiet cho 3 lượt thưa — đó sẽ là "rửa" số, vi phạm luật
  trung thực của vòng lặp. Đợt sau hoặc đo thêm lượt thưa tới khi
  đủ 3 quiet tự nhiên, hoặc chứng minh gap đó không phải tải rồi
  mới đề xuất hiệu chuẩn v3 kèm dữ liệu.
- **Dense-3 minh hoạ đúng lý do cần nhãn:** cùng bundle, cùng
  fixture với dense-2 quiet (25,57) mà chỉ vì luồng R4 mở browser
  nên rơi xuống 6,09 — chênh 4,2× chỉ vì tải. Số under-load mà
  đem so hồi quy sẽ cho kết luận sai hoàn toàn.

## 4. File đổi/thêm — CHỈ của R2

- Sửa: `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  — thêm `N2_DIST` (dist đóng băng thắng `apps/web/dist`).
- Sửa: `apps/web/scripts/probe-round34-q6-measure-protocol.mjs`
  — thêm `Q6_DIST` + `distManifest` + kiểm tra trước/sau +
  `frozenDist`/`validity`/`usableAsBaseline` trong output +
  exit 3 cho INVALID.
- Mới: `docs/PHASE9_ROUND35_R2_FROZEN_DIST_LIMITS.md` — file này.
- Mới: `benchmarks/results/v35-r2-reverse-sparse-1.json`,
  `v35-r2-reverse-dense-1.json`, `v35-r2-reverse-sparse-2.json`,
  `v35-r2-reverse-dense-2.json`, `v35-r2-reverse-sparse-3.json`,
  `v35-r2-reverse-dense-3.json` — 6 lượt baseline (chỉ dense-2
  quiet, còn lại under-load — xem §3).
- Mới: `benchmarks/results/v35-r2-reverse-invalid-test.json` —
  lượt kiểm chứng INVALID (§2.3), fps bị loại, không tính vào
  baseline.
- KHÔNG sửa: mọi code sản phẩm, i18n, bridge, script của luồng
  khác, paths-loop, build-loop-log. KHÔNG push, KHÔNG tag. Bản sao
  dist đóng băng và scratch lượt chỉ nằm ở
  `~/workspace/tmp-round35-r2/` (không vào batch). Bằng chứng đo
  của luồng khác (đặc biệt `tmp-round35-r4/`) không bị đụng tới.

## 5. Cái gì CHƯA chứng minh / nợ còn lại (trung thực)

1. **Baseline quiet đóng băng 3+3 lượt: CHƯA ĐẠT** (§3) — 1 quiet
   dày (n=1), 0 quiet thưa, trên bundle `DgObvvhC`. Baseline quiet
   mới nhất vẫn là số đợt 33 của P5 (thưa tv 7,09; dày tv 22,39,
   bundle `Cqp7uur1`). Đợt sau cần cửa sổ mà các luồng browser
   khác tạm dừng + đủ lượt thưa quiet tự nhiên (xem mẫu hệ thống
   ở §3 trước khi đụng ngưỡng).
2. **Điều kiện INVALID (b) bundle lệch và (c) snapshot lệch:**
   có trong code nhưng chưa có lần kích hoạt thật (§2.3).
3. **Gap xuôi đơn lẻ ở fixture thưa:** chưa xác định vị trí/
   nguyên nhân (tải máy hay stall decode/khởi động) — cần phân
   tích tick rAF trong phase xuôi trước khi đề xuất hiệu chuẩn v3.
4. **Safari / máy thật / dpr > 1 / viewport khác:** vẫn chưa đo
   (nợ chung từ Round 33 §3.8).
5. **Dist đóng băng này là bundle đợt 34, không phải code mới
   nhất của đợt 35:** đúng mục đích baseline (đóng băng = không
   trôi), nhưng số này không phản ánh code đợt 35 của các luồng
   khác. Khi đợt 35 gộp xong và có dist mới, baseline quiet phải
   đo lại trên dist mới đó nếu muốn gắn với code hiện tại.
