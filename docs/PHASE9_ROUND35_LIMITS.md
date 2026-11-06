# Phase 9 đợt 35 — Đóng nợ đợt 34 (đợt lớn, 6 luồng, KHÔNG push) — LIMITS tổng hợp

> Lượt cron 02:03 02/11/2026. KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo. Chủ đề: toàn bộ nợ §3 của
> `docs/PHASE9_ROUND34_LIMITS.md` (A/B seek quiet, baseline quiet đóng
> băng bundle, buffer file ReversePreviewController, đo quiet/GPU cho
> đường WebCodecs, lần treo thật có snapshot, nợ đứng discard/dpr).
> Kiểm chứng gộp của parent (chạy lại độc lập, không lấy số của
> luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi (apps/web),
> `vite build` pass (5,28s), reverseFileBuffer35R3 10/10 (esbuild
> bundle từ gốc repo), discardRestore35R6 8/8, `node --check` mọi
> script mới/sửa, `bash -n` runner R1, 22 file JSON v35 parse OK,
> summary R1 khớp báo cáo (trung vị single/retry 0,9895), probe R5
> allPass=true. KHÔNG chạy lại ở bước gộp: mọi phép đo browser
> headed / FPS của các luồng — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **R1 A/B seekElement quiet 3+3 thật**
  (`docs/PHASE9_ROUND35_R1_SEEK_AB_QUIET_LIMITS.md`): trên cùng cây
  đóng băng (212 module, chỉ khác 1 hunk seeked), qua 2 cổng nhãn
  quiet v2 + probe decode-side mới: retry trung vị 8,907 fps,
  single 8,813 fps (−1,1%), tỉ số từng cặp 0,99× / 1,09× / 0,78×
  đổi dấu → KHÔNG quy kết được dư thưa ~20% cho settle-wait,
  KHÔNG revert seekElement. Dư cũ giải thích bằng so sánh xuyên
  cây/xuyên phiên (187 → 212 module). Phát hiện quan trọng: probe
  decode-side bắt được lượt retry-a3 đạt nhãn v2 nhưng chỉ 3,03
  fps và STARVED (stall 7, tick 57,9/s) — nhãn quiet v2 chưa đủ
  để chứng nhận "quiet cho decode ngược". Caveat: cổng chưa bắt
  chế độ chậm-đều (single-a4 7,32 fps HEALTHY); n=3 không phân
  giải hiệu ứng <~10%. 5/11 lượt bị loại có lý do ghi đủ.
- **R2 baseline quiet đóng băng bundle**
  (`docs/PHASE9_ROUND35_R2_FROZEN_DIST_LIMITS.md`): probe v2 nay
  nhận `Q6_DIST`/`N2_DIST`, manifest sha256 toàn dist trước/sau,
  vi phạm → INVALID, exit 3, fps bị loại. 6 lượt trên cùng 1 dist
  đóng băng (bundle đợt 34 `index-DgObvvhC.js`) đều frozen VALID
  nhưng chỉ 1 lượt quiet (dày 25,57 fps) → baseline quiet 3+3
  CHƯA ĐẠT, không claim baseline mới; baseline mới nhất vẫn là
  đợt 33 của P5 (thưa tv 7,09; dày tv 22,39). Kiểm chứng INVALID
  thật bằng ghi thêm file giữa lượt (manifest đổi, exit 3); điều
  kiện (b) bundle lệch và (c) snapshot lệch có trong code nhưng
  chưa có lần kích hoạt thật.
- **R3 buffer file ReversePreviewController**
  (`docs/PHASE9_ROUND35_R3_FILE_BUFFER_LIMITS.md`): chọn hướng
  (b) nhả ArrayBuffer sau decode thay vì (a) fetch theo khoảng
  GOP (lý do: cần moov trước, cần hợp đồng Range không có cho
  nguồn preview, phải viết lại demux — xem LIMITS §1). Trạng thái
  ổn định `retainedFileBytes = 0`; ngân sách tổng 320 MiB = 192
  MiB frame + 128 MiB file tối đa, tính cả buffer file; file
  > 128 MiB → fallback đường element ngay (3 cổng: HEAD chặn
  trước body, header GET hủy body trước arrayBuffer, không header
  thì vứt + khóa unsupported). Test mới 10/10. CHƯA đo trên file
  lớn thật — mọi claim chỉ trên fixture nhỏ + fake decoder; đỉnh
  heap thoáng qua khi tải file lớn không header vẫn tồn tại.
- **R4 đo quiet + GPU cho đường WebCodecs**
  (`docs/PHASE9_ROUND35_R4_WEBCODECS_GPU_LIMITS.md`): CHỈ ĐO,
  không sửa code sản phẩm. Xác định được VM này KHÔNG có
  hardware decode (`prefer-hardware: false`, decode 0/300 mọi
  lượt; `/dev/dri` không tồn tại; `chrome://gpu` không lấy được
  nội dung bằng 3 cách — giới hạn phương pháp, không mạo nhận).
  Đo quiet KHÔNG ĐẠT: 20 lượt, 0 quiet (tải song song các luồng
  khác). Số under-load, cấm dùng làm baseline: phẳng software
  trung vị 1069,1 fps; nhiễu software trung vị 36,0 fps (lượt
  nặng tải nhất 21 fps). Verdict: nhánh HW ≥ 60 fps ĐÓNG đối với
  môi trường này; nhánh SW < 30 fps không kích hoạt sạch cũng
  không bị bác sạch (dao động quanh ngưỡng theo tải). Nối Q3 vào
  preview CHƯA ĐỦ ĐIỀU KIỆN cho claim tổng quát; hướng rẻ nhất
  chỉ đề xuất: proxy độ phân giải thấp Q8 (cần đo fps trước) hoặc
  giữ hold-frame cũ + báo rõ giới hạn.
- **R5 lần treo thật có snapshot**
  (`docs/PHASE9_ROUND35_R5_REAL_HANG_SNAPSHOT_LIMITS.md`): probe
  mới chạy Chrome thật, treo thật bằng `Runtime.evaluate`
  `awaitPromise` trên promise không settle — timeout kích hoạt
  sau 5013ms (đặt 5000ms), đúng 1 snapshot bền, reject đúng
  `cdp timeout Runtime.evaluate`, trình duyệt vẫn sống sau treo.
  Module `cdp-bundle.mjs` ghi bundle thật (tên + sha256_16 +
  dist) cho harness WS; timeout fetch `/json` (5000ms/lần) +
  `ws.onopen` (30000ms) cho mobile-touch-check và các harness
  tương tự; CDP `d.error` nay reject verbatim ở cả 5/5 harness WS
  đã nối. Probe 29/29 check, allPass=true. Chưa chứng minh treo
  do page deadlock/target kẹt/Chrome đơ toàn bộ; snapshot vẫn
  chỉ trên đĩa VM; dist không đóng băng cả thư mục như harness
  pipe.
- **R6 discard mô phỏng + smoke dpr/viewport**
  (`docs/PHASE9_ROUND35_R6_DISCARD_DPR_LIMITS.md`): reload mô
  phỏng discard 2/2 PASS cho timeline/clip/text/caption/tên
  project, nhưng media MẤT thật — sau reload app hiện panel
  Relink cho mọi clip video kể cả mẫu (`mau-1.webm`,
  `mau-2.webm` không tự tái sinh); autosave không chứa
  playhead/playing/reverse. Module thuần mới phân loại "bytes
  sống" vs "preview vẽ lại được": bytes `asset:` sống trong
  IndexedDB nhưng App chưa có code nạp lại media bin. Smoke
  ngược đường element cũ, cờ WebCodecs TẮT, ở dpr 2 + 2 viewport:
  2/2 PASS, backing canvas đúng trần `min(dpr,2)`, 0 lỗi trang.
  KHÔNG claim discard thật hàng giờ; Safari/máy thật vẫn chưa đo.

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Chỉ viết LIMITS tổng hợp này, file
  paths (§4) và log vòng lặp.
- Đối chiếu file chung: `tsconfig.json` chứa đủ cả 2 exclude mới
  của R3 và R6, không entry nào bị ghi đè mất; `reverseWebcodecs.ts`
  chỉ có hunk của R3; các script đo/snapshot không chồng chéo
  (R2 sửa N2 + probe Q6, R5 sửa seek-o3/seek-p2/mobile/check-proxy/
  dip-inline + cdp-snapshot — khác file nhau); `seek.ts` live vẫn
  byte-identical sau buổi đo của R1 (sha `efb0160b…` như đợt 34).
- Live dist đã đổi giữa buổi do luồng khác build (`DgObvvhC` →
  `Cwsd35w5`); số đo của R1/R2 gắn với dist đóng băng riêng của
  từng luồng, không gắn với dist live cuối buổi — cùng caveat
  như đợt 33/34.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Khóa hiệu ứng nhỏ A/B (<10%) nếu cần:** n ≥ 6–8 lượt/phía
   trong cửa sổ thật sự quiesced (tạm dừng probe luồng khác) +
   cổng decode v2 phát hiện chế độ chậm-đều; điều tra chế độ
   chậm-đều cuối phase ngược (single-a4).
2. **Baseline quiet đóng băng 3+3:** vẫn chỉ 1 dày / 0 thưa; cần
   cửa sổ các luồng browser khác tạm dừng + phân tích gap xuôi
   đơn lẻ ở fixture thưa trước khi đề xuất hiệu chuẩn v3; kích
   hoạt thật điều kiện INVALID (b) và (c).
3. **Nối Q3 vào preview:** chỉ biện minh được như thử nghiệm
   opt-in cho footage dễ decode hoặc trên máy đã chứng minh có
   HW decode; đo fps proxy Q8 cho chiều ngược trước khi chọn
   proxy làm hướng chính; đo lại trên máy có GPU thật.
4. **Buffer file:** đo heap thật với file 420MB + cờ bật; chặn
   đỉnh heap khi tải bằng `File.size` truyền trước hoặc hướng
   (a) Range nếu muốn phát ngược file > 128 MiB bằng WebCodecs.
5. **Rehydrate media sau reload (nợ lớn nhất của R6):** bytes
   `asset:` đã bền nhưng App không nạp lại media bin; media mẫu
   mất sau reload (đưa mẫu vào AssetStore + rehydrate, hoặc tự
   tái sinh); trạng thái phiên (playhead/playing/reverse) reset
   — cần quyết định sản phẩm trước khi sửa format autosave.
6. **Snapshot:** backup snapshot bền ra ngoài VM; treo do
   deadlock/target kẹt/Chrome đơ toàn bộ; đóng băng cả thư mục
   dist cho harness WS như harness pipe; nối `cdp-bundle.mjs`
   cho `bench-preview-fps.mjs` (cố tình chưa nối ở đợt này).
7. **Nợ đứng chưa đo:** Safari / máy thật / discard thật dưới áp
   lực bộ nhớ / tab ẩn hàng giờ / bfcache / footage B-frame /
   độ phân giải khác / đường `asset:` và đường WebCodecs ở
   dpr > 1 bằng trình duyệt thật; điều kiện (b)(c)(d) của M6 vẫn
   mở.
8. **Thứ tự push:** batch đợt 35 xây trên nền các batch đợt
   22–34; user push theo thứ tự cũ → mới.

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round35-closing-debts34.txt`
  — batch đợt 35 (49 file text, NUL-delimited, không binary,
  không dist; đã verify read-back 49 entry + mọi file tồn tại).
- Tổng batch đang chờ user push sau đợt này: xem log vòng lặp
  (13 file paths đợt 22–34 = 603 file, cộng 49 file mới đợt này
  = 652 file / 14 file paths).
