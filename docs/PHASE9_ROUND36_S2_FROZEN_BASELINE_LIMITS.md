# Phase 9 đợt 36, luồng S2 — Baseline quiet đóng băng (nợ §3.2 đợt 35) — LIMITS

Ngày: 02/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG
binary vào repo, KHÔNG code giả/mock. KHÔNG sửa code sản phẩm
(`apps/web/src`, i18n, bridge), KHÔNG sửa paths-loop, KHÔNG sửa
build-loop-log (parent gộp) — chỉ sửa 1 script đo (có gate env) +
file này + 12 JSON kết quả dạng text. Đọc trước khi làm:
`docs/PHASE9_ROUND35_R2_FROZEN_DIST_LIMITS.md` và
`docs/PHASE9_ROUND34_Q6_MEASURE_PROTOCOL_LIMITS.md`.

## 0. Kết quả nói trước

1. **Baseline quiet đóng băng 3+3: CHƯA ĐẠT — báo trung thực,
   không claim baseline mới.** 8 lượt trên cùng dist đóng băng,
   8/8 frozen VALID, nhưng 0 lượt quiet (0 thưa, 0 dày).
   **Baseline quiet mới nhất vẫn là số đợt 33 của P5
   (thưa tv 7,09; dày tv 22,39, bundle `Cqp7uur1`).**
2. **Điều kiện INVALID (b) bundle lệch và (c) snapshot lệch:
   ĐÃ KÍCH HOẠT THẬT, MỖI ĐIỀU KIỆN ĐỘC LẬP** (§4): mỗi lượt
   chỉ có đúng 1 problem trong danh sách, exit 3, fps bị loại,
   manifest trước = sau, bundle/snapshot còn lại khớp. Đợt 35
   mới chỉ kích hoạt (a); nay cả 3 điều kiện đều đã có lần kích
   hoạt thật.
3. **Phân tích gap xuôi đơn lẻ ở fixture thưa: XÁC NHẬN giả
   thuyết của R2 bằng vị trí gap thật** (§3): gap đơn lẻ (trừ
   tick biên) nằm ngay đầu phase xuôi (frac 0,001–0,047) trong
   cả 6 lượt batch A + dense-b1, sau 1 gap biên ~1,8 s bắc qua
   mark — tức stall khởi động (decode warm-up / frame đầu),
   KHÔNG phải tải sustained. Đối chứng: lượt nhiễm tải thật
   (dense-b1) có gap rải khắp phase (frac 0,16–0,89).
   **Chỉ ĐỀ XUẤT hiệu chuẩn v3 (§5), KHÔNG đổi ngưỡng, KHÔNG
   relabel lại lượt nào.**

## 1. Dist đóng băng và fixture (giữ nguyên của R2 để so sánh được)

- Bản sao `~/workspace/tmp-round35-r2/frozen-dist/` copy sang
  scratch riêng `~/workspace/tmp-round36-s2/frozen-dist/` (scratch,
  KHÔNG vào batch, KHÔNG vào repo). Manifest sao chép khớp tuyệt
  đối: 254 file, sha256
  `1a413dee23a20bc95cae1b51838f1220ec598e04e0d8be7156e3f7c365b013e0`,
  bundle `index-DgObvvhC.js` (sha256
  `1f4ebcc7ae1ceff7ebcbfa9043ea6e829e89a689587bad9b8ba3b2fa382c3ca7`).
- Fixture P5 đợt 32, sha256 khớp đợt 35: thưa
  `sparse-gop-flat.mp4` (`a4ea20eb…`), dày `dense-gop-flat.mp4`
  (`c8aa090e…`). Mọi lượt dưới đây đều frozen VALID trên cùng
  bundle này — khác biệt duy nhất giữa các lượt là tải máy.
- Ngưỡng QUIET v2 của Q6 đợt 34 giữ nguyên, không đụng tới.

## 2. Baseline — batch A: nối tiếp 3+3 (08:12–08:16 +07)

Chạy tuần tự không nghỉ, display :93 / port 4193, `N2_GAP_POS=1`.
Lúc bắt đầu máy rảnh (load 0,69, chromePre=0), nhưng tải tự dâng
lên 3,2–4,8 trong batch — toàn bộ là footprint của chính lượt đo
(xem §2.1), không có luồng browser khác trong batch A (ps kiểm
tra giữa batch: mọi tiến trình Chrome đều thuộc profile
`tmp-round36-s2/*` của chính lượt đang chạy).

| Lượt | Nhãn v2 | fps ngược | Xuôi | Verdict N2 | Lý do nhãn (tóm tắt) |
|---|---|---|---|---|---|
| sparse-1 | under-load | 3,47 (draw 49/14,12 s) | 0,981 | PARTIAL | load1 2,30/2,69/3,75; P50 0,0163; predRate 0,936 (2 gap) |
| dense-1 | under-load | 11,32 (draw 159/14,04 s) | 0,996 | PASS | load1 4,29/4,56/4,84; predRate 0,954 (3 gap) |
| sparse-2 | under-load | 7,16 (draw 99/13,83 s) | 1,000 | PASS | load1 5,18/4,93/4,43; predRate 0,969 (1 gap) |
| dense-2 | under-load | 23,85 (draw 327/13,71 s) | 1,007 | PASS | load1 4,78/4,35/3,74 (chỉ lý do load1) |
| sparse-3 | under-load | 6,21 (draw 86/13,85 s) | 0,996 | PASS | load1 4,20/3,63/3,22 (chỉ lý do load1) |
| dense-3 | under-load | 19,33 (draw 271/14,02 s) | 1,002 | PASS | load1 2,78/3,04/3,19; predRate 0,970 (1 gap) |

File: `benchmarks/results/v36-s2-reverse-{sparse,dense}-{1,2,3}.json`.

### 2.1 Cơ chế nhiễu 1: tự nhiễm qua loadavg 1 phút khi chạy nối tiếp

loadavg 1 phút là trung bình trượt: lượt trước đốt CPU trong
phase ngược (software decode + canvas) vẫn còn nằm trong cửa sổ
1 phút của lượt sau. sparse-1 bắt đầu ở load 0,69 mà beforeFwd
đã 2,30; các lượt sau beforeFwd 2,78–5,18 dù chromePre=0 và không
có browser lạ. Kết luận: **chạy nối tiếp là sai phương pháp cho
cổng load1** — batch A không chứng minh được máy bận, nó chứng
minh lượt đo tự nhiễm chính nó. Đây là lý do batch B được thiết
kế có giãn cách (§2.2).

### 2.2 Batch B: có gate + giãn cách 90 s (08:18–08:25 +07)

Gate trước mỗi lượt: chờ tới khi load1 < 1,5 và chromePre=0
(tối đa 600 s). Chỉ chạy được 2 lượt rồi DỪNG CHỦ ĐỘNG (lý do §2.3):

| Lượt | Nhãn v2 | fps ngược | Xuôi | Verdict | Lý do nhãn |
|---|---|---|---|---|---|
| sparse-b1 | under-load | 6,45 (draw 89/13,79 s) | 1,003 | PARTIAL | CHỈ load1 2,10/2,17 (probe pre-run 1,43); phase xuôi sạch: P50 0,0072, predRate trừ biên 0,996, 0 gap ngoài biên |
| dense-b1 | under-load | 2,41 (draw 39/16,22 s) | 0,731 | PASS | load1 2,23/2,59/3,78; xuôi ngoài band; P50 0,0303; predRate 0,854 (22 gap); chromePost=14 |

File: `benchmarks/results/v36-s2-reverse-{sparse,dense}-b1.json`.
sparse-b2 / dense-b2 / sparse-b3 / dense-b3 KHÔNG chạy (xem §2.3).

### 2.3 Cơ chế nhiễu 2 và 3 — và vì sao dừng batch B

- **Nhiễu 2 (footprint khởi động của chính lượt đo):** sparse-b1
  bắt đầu sau gate (probe pre-run load1 1,43, chromePre=0) mà
  beforeFwd vẫn 2,10: Chrome khởi động + page boot + parse bundle
  1 MB đẩy loadavg 1 phút lên ~0,7 chỉ trong ~20 s. Tức cổng
  load1-beforeFwd đo cả tải do chính harness tạo ra, không chỉ
  tải môi trường. Đây là lý do duy nhất sparse-b1 rớt nhãn dù
  phase xuôi của nó sạch hoàn toàn.
- **Nhiễu 3 (nhiễm giữa lượt từ luồng khác):** dense-b1 qua gate
  sau 230 s chờ (luồng S3 đợt 36 vừa chạy xong probe), nhưng
  GIỮA lượt S3 lại mở probe mới (chromePost=14, xuôi rơi xuống
  0,731, 22 gap rải khắp phase). **Gate đầu lượt không bảo vệ
  được giữa lượt.** Sau dense-b1, ps còn thấy luồng S1 chạy
  `seek-ab-quiet-run36.sh` + probe và luồng S3 chạy probe tiếp —
  cửa sổ quiet không tồn tại đủ lâu cho 1 lượt ~35 s trong đợt
  đa luồng này. Chạy tiếp 4 lượt batch B chỉ sản xuất thêm nhãn
  under-load, không thêm thông tin mới, nên dừng tại đây thay vì
  cố cho đủ số lượng. Baseline 3+3 cần cửa sổ mà các luồng
  browser khác TẠM DỪNG THẬT (xem đề xuất §5, mục V3-c), không
  phải thêm lượt trong cùng điều kiện.
- **Caveat chất lượng số thưa:** 2/4 lượt thưa là PARTIAL
  (reverseOk=false: sparse-1 chỉ đi ngược 29,5 → 15,4 s, draw 49;
  sparse-b1 draw 89) — fps thưa đo trên traversal ngược chưa hoàn
  tất, yếu hơn fps của lượt PASS. Mọi fps thưa dưới đây chỉ là
  điểm dữ liệu under-load, không phải baseline, nên caveat này
  không đổi kết luận nào, nhưng đợt baseline tương lai nên yêu
  cầu verdict PASS mới tính.

## 3. Phân tích gap xuôi đơn lẻ ở fixture thưa (trước khi đề xuất v3)

### 3.1 Công cụ mới (thay đổi duy nhất vào script chung)

`apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`,
hàm `analyzeRafPhase`: thêm field `bigGaps` CHỈ khi
`N2_GAP_POS=1` (mặc định tắt). Mỗi gap >100 ms ghi index tick,
gapSec, tStart/tEnd theo phase, fracStart/fracEnd. Khi không đặt
env, output không thêm field nào — đã kiểm chứng bằng 1 lượt
chạy không env (§6): key set của `raf.forward` đúng 12 key cũ,
không có `bigGaps`.

Giới hạn dữ liệu cũ (ghi rõ): JSON đợt 35 chỉ có aggregate, tick
thô `rec` đã bị N2 bỏ sau khi tính — KHÔNG khôi phục được vị trí
gap của 3 lượt thưa đợt 35. Phân tích vị trí dưới đây dựa hoàn
toàn trên 8 lượt mới đợt này (có `N2_GAP_POS=1`); số đợt 35 chỉ
dùng để đối chiếu aggregate (3 lượt thưa đều đúng 1 gap trừ biên,
predRate 0,961–0,978).

### 3.2 Vị trí gap xuôi >100 ms (mọi lượt đều có gap biên ~1,8 s)

Gap idx=0 ở mọi lượt: 1,77–1,85 s, tStart ÂM (−1,75…−1,84 s),
fracStart −0,24…−0,30 — tức gap BẮC QUA mark fwd-start (tick
trước mark → tick đầu sau mark). Đây chính là tick biên mà
`exclFirst` đã loại. Gap idx=1 (tick kế tiếp) mới là "gap đơn lẻ"
mà R2 nghi ngờ:

| Lượt | Gap idx=1 (sau biên) | Vị trí trong phase | Gap khác trong phase |
|---|---|---|---|
| sparse-1 | 0,478 s, t=[0,01, 0,49] | frac [0,002, 0,072] | 1 gap cuối phase (frac 0,881, 0,108 s, sát ngưỡng) |
| sparse-2 | 0,281 s, t=[0,01, 0,29] | frac [0,001, 0,047] | không có |
| sparse-3 | 0,177 s, t=[0,01, 0,19] | frac [0,001, 0,030] | không có |
| dense-1 | 0,358 s, t=[0,01, 0,37] | frac [0,002, 0,058] | 2 gap giữa phase (frac 0,67/0,72) |
| dense-2 | 0,201 s, t=[0,01, 0,21] | frac [0,001, 0,034] | không có |
| dense-3 | 0,269 s, t=[0,02, 0,28] | frac [0,002, 0,046] | không có |
| sparse-b1 | (không có idx=1) | — | không có gap nào ngoài biên |
| dense-b1 (nhiễm S3) | 0,307 s, t=[0,04, 0,35] | frac [0,006, 0,048] | 21 gap nữa rải frac 0,16–0,89 |

File phân tích: `benchmarks/results/v36-s2-sparse-gap-analysis.json`
(batch A 6 lượt + batch B 2 lượt).

### 3.3 Kết luận phân tích (có bằng chứng, chưa đổi ngưỡng)

1. **Gap đơn lẻ ở fixture thưa là stall khởi động, không phải
   tải sustained.** Bằng chứng: (a) nó luôn nằm trong 0,3 s đầu
   phase (frac ≤ 0,072) ở cả 3 lượt thưa batch A + 3 lượt dày;
   (b) sau nó, phần còn lại của phase sạch (P50 0,006–0,007,
   xuôi trong band 0,996–1,007 ở sparse-2/3, dense-2/3);
   (c) sparse-b1 — lượt "sạch nhất" — không có gap nào ngoài
   biên mà predRate trừ biên vẫn 0,996.
2. **Stall khởi động kéo dài 2 tick, không phải 1.** Gap biên
   (~1,8 s, do main thread bận ngay trước khi bấm phát — đúng
   chú thích N2b) + gap idx=1 (0,18–0,48 s, decode/frame đầu)
   là MỘT stall liên tục bị cắt làm đôi bởi mark fwd-start.
   `exclFirst` hiện tại chỉ loại tick biên, nên gap idx=1 vẫn
   tính vào predRate — đó là lý do 3 lượt thưa đợt 35 + sparse-2
   đợt này rớt ngưỡng 0,98 chỉ vì đúng 1 gap đầu phase.
3. **Đối chứng phân biệt tải thật:** dense-b1 nhiễm S3 có gap
   rải khắp phase (frac 0,16–0,89, 22 gap, xuôi 0,731) — mẫu
   hình hoàn toàn khác với gap đầu phase. Vì vậy "gap ở đầu
   phase" và "gap rải khắp phase" là hai chữ ký khác nhau, và
   cổng phân loại tương lai có thể dựa vào vị trí, không chỉ
   lost-rate.
4. **Chưa đủ bằng chứng để kết luận sâu hơn:** chưa phân biệt
   được idx=1 là chi phí seek-first-frame hay decode warm-up
   (cần thêm probe: timestamp seek/decode đầu phase — ngoài
   phạm vi S2); n=8, trong đó chỉ 3 lượt thưa PASS — chưa đủ để
   khóa ngưỡng mới.

## 4. Kiểm chứng INVALID (b) và (c) — ĐÃ KÍCH HOẠT THẬT, ĐỘC LẬP

Cả 2 lượt đều chạy trên bản sao dist đóng băng, bundle
`index-DgObvvhC.js`, fixture dày; fps của lượt INVALID bị loại
theo thiết kế (không dùng cho bất kỳ kết luận nào).

### 4.1 (c) snapshot lệch — độc lập (exit 3)

- Lượt `v36-s2-reverse-invalid-c.json`: watcher chèn 1 byte vào
  `dist-snap/stickers/arrow-curved.png` của N2 SAU khi N2 copy
  snapshot, TRƯỚC khi probe kiểm tra sau lượt. Frozen dist không
  bị đụng.
- Kết quả: problems CHỈ có 1 mục: `snapshot dist-snap của N2 ≠
  dist đóng băng (snap 9db35d42f17c ≠ frozen 1a413dee23a2)`;
  manifest trước = sau = `1a413dee…`; bundle khớp; exit 3;
  `usableAsBaseline=false`; fps 5,63 bị loại.

### 4.2 (b) bundle lệch — độc lập (exit 3)

- Lượt `v36-s2-reverse-invalid-b2.json`: watcher Python đơn tiến
  trình poll `forward-hold.json` mỗi 1 ms, viết lại trường bundle
  thành `index-FAKEBUNDLE.js` ngay trong cùng tiến trình sau khi
  N2 ghi file, trước khi probe đọc (probe còn chạy post snapshot
  ps/top sau khi N2 exit).
- Kết quả: problems CHỈ có 1 mục: `bundle đo index-FAKEBUNDLE.js
  ≠ bundle đóng băng index-DgObvvhC.js`; manifest trước = sau;
  snapshot khớp; exit 3; `usableAsBaseline=false`; fps 16,69 bị loại.
- Thử lần 1 (`v36-s2-reverse-invalid-b1.json`) THẤT BẠI và được
  ghi lại trung thực: watcher bash + spawn python mỗi vòng phản
  ứng sau ~680 ms, chậm hơn cửa sổ N2-ghi → probe-đọc, nên probe
  đọc được bundle gốc (validity VALID). Bài học: race này chỉ
  thắng được bằng watcher đơn tiến trình, không dùng bash loop.
- Ghi chú cấu trúc (tìm hiểu khi thiết kế test): kích hoạt (b)
  ĐỘC LẬP bằng cách đổi tên bundle trong frozen dist là không
  thể — N2 đọc tên bundle và copy snapshot từ cùng 1 thư mục
  trong 1 khối đồng bộ, nên đổi tên luôn kéo theo (c) (và (a)).
  Đường duy nhất để (b) đứng một mình là viết lại
  `forward-hold.json` như trên. Sau đợt này, cả 3 điều kiện
  (a)/(b)/(c) đều đã có lần kích hoạt thật; không cần làm lại
  trừ khi sửa lại code kiểm tra.

## 5. Đề xuất hiệu chuẩn v3 — CHỈ ĐỀ XUẤT, KHÔNG ÁP DỤNG

Dựa trên §3, đề xuất 3 hướng cho đợt sau kiểm chứng bằng lượt
đo MỚI (tuyệt đối không relabel lại 8 lượt đợt này, không nới
ngưỡng 0,98 sau khi đã thấy số):

- **V3-a (cửa sổ khởi động):** loại trừ N tick đầu phase xuôi
  (hoặc 0,5 s đầu phase) khỏi predictedRate, thay vì chỉ 1 tick
  biên như `exclFirst` hiện tại — vì stall khởi động kéo dài 2
  tick (§3.3 mục 2). Cần kiểm chứng: trên lượt mới, so sánh
  predRate với N=1/2/3 và xem cụm quiet có tách khỏi cụm tải
  không; nếu gap đầu phase vẫn xuất hiện cả ở lượt nhiễm tải
  thật thì phải kết hợp với tiêu chí vị trí (mục V3-d dưới đây),
  không loại trừ mù.
- **V3-b (tải môi trường đo trước khi mở Chrome):** dùng load1
  pre-run của probe (trước khi spawn N2/Chrome) làm tín hiệu tải
  môi trường chính, thay vì chỉ dựa vào load1-beforeFwd của N2 —
  vì beforeFwd nhiễm footprint khởi động của chính lượt đo
  (sparse-b1: pre 1,43 → beforeFwd 2,10). Giữ load1-beforeRev/
  atEnd làm tín hiệu phụ để bắt nhiễm giữa lượt.
- **V3-c (điều phối cửa sổ quiet giữa các luồng):** baseline
  quiet chỉ đo được khi các luồng browser khác tạm dừng CẢ lượt
  (~35 s), không chỉ lúc bắt đầu — cần cơ chế phối hợp (ví dụ
  file cờ/lock mà các probe browser tôn trọng), vì gate đầu lượt
  đã chứng minh là không đủ (§2.3). Đây là điều kiện tiên quyết
  cho mọi nỗ lực baseline 3+3 trong đợt đa luồng, quan trọng hơn
  cả hiệu chuẩn ngưỡng.
- **V3-d (chỉ ghi nhận, chưa đề xuất thành ngưỡng):** dùng vị
  trí gap (đầu phase vs rải khắp phase) làm tín hiệu phụ phân
  biệt stall khởi động với tải sustained (§3.3 mục 3). Chưa đủ
  dữ liệu để đặt ngưỡng vị trí — cần thêm lượt nhiễm tải thật
  có ghi vị trí gap để xem phân bố.

## 6. Kiểm chứng code của đợt này

- `node --check` script N2 sửa: pass.
- Lượt chạy N2 KHÔNG đặt `N2_GAP_POS`: `raf.forward` có đúng 12
  key cũ, không có `bigGaps` ở cả phase xuôi lẫn ngược — hành vi
  mặc định không đổi (file kiểm chứng nằm ở scratch
  `tmp-round36-s2/noenv-check/`, không stage vì không phải lượt
  baseline).
- `npx tsc --noEmit` (apps/web): exit 0, không lỗi.
- Mọi JSON mới parse OK (12 file, §7). Không chạy `vite build`
  vì đợt này không sửa code sản phẩm hay code build — chỉ script
  đo; parent gộp vẫn chạy lại theo quy trình chung nếu cần.

## 7. File đổi/thêm — CHỈ của S2

- Sửa: `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs`
  — thêm field `bigGaps` có gate `N2_GAP_POS=1` trong
  `analyzeRafPhase` (không đổi hành vi mặc định).
- Mới: `docs/PHASE9_ROUND36_S2_FROZEN_BASELINE_LIMITS.md` — file này.
- Mới: `benchmarks/results/v36-s2-reverse-sparse-1.json`,
  `v36-s2-reverse-dense-1.json`, `v36-s2-reverse-sparse-2.json`,
  `v36-s2-reverse-dense-2.json`, `v36-s2-reverse-sparse-3.json`,
  `v36-s2-reverse-dense-3.json` — batch A (0 quiet, §2).
- Mới: `benchmarks/results/v36-s2-reverse-sparse-b1.json`,
  `v36-s2-reverse-dense-b1.json` — batch B (0 quiet, §2.2).
- Mới: `benchmarks/results/v36-s2-reverse-invalid-c.json` —
  kích hoạt (c) độc lập, exit 3 (§4.1).
- Mới: `benchmarks/results/v36-s2-reverse-invalid-b2.json` —
  kích hoạt (b) độc lập, exit 3 (§4.2).
- Mới: `benchmarks/results/v36-s2-reverse-invalid-b1.json` —
  thử (b) lần 1 thất bại (race thua, VALID) — giữ lại làm bằng
  chứng phương pháp, không dùng cho kết luận nào.
- Mới: `benchmarks/results/v36-s2-sparse-gap-analysis.json` —
  vị trí gap xuôi của 8 lượt baseline (§3).
- KHÔNG sửa: mọi code sản phẩm, i18n, bridge, script của luồng
  khác, paths-loop, build-loop-log. KHÔNG push, KHÔNG tag.
  Scratch đo + bản sao dist chỉ nằm ở `~/workspace/tmp-round36-s2/`
  (không vào batch). File của luồng khác (đặc biệt
  `tmp-round36-s3/`, `tmp-round36-s1/`) không bị đụng tới.

## 8. Cái gì CHƯA chứng minh / nợ còn lại (trung thực)

1. **Baseline quiet đóng băng 3+3: CHƯA ĐẠT** — 8 lượt VALID, 0
   quiet. Baseline mới nhất vẫn là đợt 33 của P5 (thưa tv 7,09;
   dày tv 22,39, bundle `Cqp7uur1`). Cần cửa sổ quiet có điều
   phối giữa các luồng (V3-c) + lượt đo mới sau khi chốt v3.
2. **Hiệu chuẩn v3: CHỈ LÀ ĐỀ XUẤT (§5)** — chưa áp dụng, chưa
   kiểm chứng bằng lượt mới; ngưỡng v2 vẫn là ngưỡng chính thức.
3. **Bản chất gap idx=1** (seek-first-frame hay decode warm-up):
   chưa phân biệt được — cần probe timestamp sâu hơn.
4. **Số fps thưa PARTIAL** (sparse-1, sparse-b1): traversal ngược
   chưa hoàn tất — đợt baseline tương lai nên yêu cầu verdict
   PASS mới tính vào baseline.
5. **Safari / máy thật / dpr > 1 / viewport khác:** vẫn chưa đo
   (nợ chung từ Round 33 §3.8).
6. **Dist đóng băng này là bundle đợt 34, không phải code mới
   nhất:** đúng mục đích baseline (đóng băng = không trôi), nhưng
   số này không phản ánh code đợt 35/36 của các luồng khác.
