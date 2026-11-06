# Phase 9 đợt 36 — Đóng nợ đợt 35 (đợt lớn, 6 luồng, KHÔNG push) — LIMITS tổng hợp

> Lượt cron 08:03 02/11/2026. KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo. Chủ đề: toàn bộ nợ §3 của
> `docs/PHASE9_ROUND35_LIMITS.md` (khóa hiệu ứng nhỏ A/B, baseline
> quiet đóng băng, nối Q3 vào preview + proxy Q8 chiều ngược,
> buffer file + heap file lớn, rehydrate media sau reload,
> snapshot bền + đóng băng dist WS).
> Kiểm chứng gộp của parent (chạy lại độc lập, không lấy số của
> luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi (apps/web),
> `vite build` pass (6,54 s), reverseFileHeap36S4 6/6 (esbuild
> bundle từ gốc repo), reversePreviewGate 12/12, rehydrate36S5
> 19/19, `node --check` 11 script mới/sửa, 35 file JSON v36 parse
> OK. KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed /
> FPS của các luồng — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **S1 khóa hiệu ứng nhỏ A/B seek**
  (`docs/PHASE9_ROUND36_S1_SEEK_AB_LOCK_LIMITS.md`): cổng decode
  v2 thêm nhãn STEADY_SLOW (8 khoảng draw cuối < 1,5
  frame/khoảng, max ≤ 2); hiệu chuẩn trên 19 lượt cũ giữ nguyên
  nhãn v1 của 18 lượt, chỉ đổi đúng single-a4 HEALTHY →
  STEADY_SLOW, 0 false positive mới. A/B 16 lượt mới trên cùng
  bundle đóng băng R1 chỉ 3/16 accepted (xa mục tiêu 8+8) vì
  không đạt cửa sổ quiesced thật trong buổi nhiều luồng song
  song — **KHÔNG khóa được hiệu ứng <10%, KHÔNG revert
  seekElement**. Phát hiện mới: chậm-đều không phải đặc sản của
  single (retry 3 / single 1, gồm 1 lượt QUIET đầy đủ vẫn
  STEADY_SLOW); mức tuyệt đối trôi ~30% giữa hai phiên cùng
  bundle, đi kèm load5 ~2,1–2,3 ở lượt "quiet" đợt 36 (R1:
  ~1,4–1,9) — nhãn quiet v2 chỉ xét load1 nên mù trước tải nền
  bền. Đoạn cuối chậm gắn với biên GOP 20s (tương quan nghịch
  −0,55…−0,92 với khoảng cách tới keyframe); cơ chế riêng của
  sụp đoạn sâu kiểu single-a4 vẫn chưa rõ.
- **S2 baseline quiet đóng băng**
  (`docs/PHASE9_ROUND36_S2_FROZEN_BASELINE_LIMITS.md`): 8 lượt
  trên dist đóng băng R2, 8/8 frozen VALID nhưng **0 quiet →
  baseline 3+3 CHƯA ĐẠT**; baseline mới nhất vẫn là đợt 33 của
  P5 (thưa tv 7,09; dày tv 22,39). Bài học: chạy nối tiếp tự
  nhiễm qua loadavg 1 phút; gate đầu lượt không bảo vệ được
  giữa lượt (S3 mở probe giữa lượt dense-b1). **Đã kích hoạt
  thật độc lập điều kiện INVALID (b) bundle lệch và (c)
  snapshot lệch**, mỗi điều kiện exit 3, fps bị loại. Phân tích
  gap: gap đơn lẻ ở fixture thưa luôn nằm đầu phase xuôi sau
  gap biên ~1,8s (stall khởi động kéo dài 2 tick), khác với gap
  rải khắp phase khi nhiễm tải thật — đề xuất hiệu chuẩn v3
  (KHÔNG áp dụng, KHÔNG relabel).
- **S3 proxy Q8 chiều ngược + cổng opt-in Q3**
  (`docs/PHASE9_ROUND36_S3_PROXY_Q8_REVERSE_LIMITS.md`): đường
  element cũ + proxy KHÔNG cứu được (nhiễu 720p gốc 0,99/0,67
  fps, proxy 480p 0,67/0,32 fps — đều sụp; nút thắt là độ trễ
  seek, không phải throughput). Đường WebCodecs + proxy vượt
  30 fps cho nhiễu (480p 61,0/69,1 fps; 1080p→720p 64,7/65,3
  fps) nhưng mới đo decode 1 GOP + present unpaced, **chưa đo
  paced reverse liên tục nhiều GOP nên chưa claim 30 fps ngược
  liên tục**. Cổng `reversePreviewGate` (12/12): Q3 chỉ bật như
  thử nghiệm opt-in khi cờ bật VÀ (máy chứng minh có HW decode
  HOẶC footage dễ decode SW ≥ 2× fps phát); nhiễu gốc →
  blocked, proxy → allowed-experiment + 3 cảnh báo, cờ tắt
  (mặc định) → blocked. Cổng không tự nối gì vào preview, không
  đổi mặc định. Tái xác nhận VM không có HW decode. Tự sửa 2 lỗi
  của luồng: fixture 1080p đầu sai (nhiễu tĩnh) đã tạo lại đúng,
  trường `cttsDetected` giả đã bỏ khỏi script + ghi corrections.
- **S4 buffer file + heap file lớn**
  (`docs/PHASE9_ROUND36_S4_FILE_HEAP_LIMITS.md`): đo heap thật
  trên file 419.967.521 byte (400,5 MiB) qua
  ReversePreviewController cờ bật: có Content-Length thì
  fallback ngay (HEAD 1, GET 0, heap phẳng); không header thì
  heap vọt 401,0 MiB lúc `arrayBuffer()` vật chất hóa, controller
  vứt ngay (`retainedFileBytes = 0`) nhưng heap chỉ tự hạ sau
  ~3 s (GC lười V8) — khoảng chao đảo thật trên máy yếu. Cổng
  `File.size` truyền trước: vượt 128 MiB thì khóa fallback ngay
  từ constructor, 0 request, 0 ms; `preview.tsx` chỉ truyền
  `item.file.size` khi không có proxyUrl. Hướng Range-fetch theo
  GOP KHÔNG làm (rào cản moov-trước + hợp đồng Range vẫn đứng
  cho nguồn http/proxy); mini-check blob: chỉ chứng minh Range
  khả thi kỹ thuật cho nguồn local. Test mới 6/6; hồi quy R3
  10/10, Q2 4/4 (theo luồng).
- **S5 rehydrate media sau reload (nợ lớn nhất)**
  (`docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md`): quyết định
  trạng thái phiên — playhead GIỮ (clamp + snap frame), playing
  reset về pause, reverse reset về tắt; autosave thêm field tùy
  chọn `session: { playhead }`, envelope cũ vẫn mở bình thường.
  Hướng đã chọn: AssetStore persistence (không tái sinh mẫu) —
  `buildSampleProject` ingest blob mẫu vào AssetStore; App khởi
  động theo thứ tự mới (replaceProject → khôi phục playhead →
  rehydrate media bin → mới `checkMissingMedia()`). Probe trình
  duyệt thật: reload giữ playhead 00:04.0 sai lệch 0, panel
  Relink VẮNG (đợt 35 còn hiện đủ mau-1/mau-2); đối chứng âm
  (src không tồn tại) vẫn hiện Relink đúng. Unit mới 19/19;
  hồi quy projectRepo 10/10, assetStore 22/22 (theo luồng).
  Media sau rehydrate mang `file` thật nên về lý thuyết render
  được như file gốc — chưa kiểm chứng end-to-end qua bridge.
- **S6 snapshot bền + đóng băng dist WS + bench wiring**
  (`docs/PHASE9_ROUND36_S6_SNAPSHOT_BACKUP_LIMITS.md`): script
  backup/verify/restore + manifest sha256 + index; backup thật
  6 snapshot cũ → goal hidden_files
  `cdp-hang-snapshots-backup/20261102-012334/`, verify 6/6
  (bản sao bền này nằm ngoài repo, không vào batch; nó chống
  dọn/xóa trên cùng đĩa VM, chưa chống thay toàn bộ đĩa VM, và
  không hồi sinh được snapshot treo thật của R5 đã bị probe xóa
  sau khi nhúng vào JSON). Module `cdp-dist-freeze.mjs` nối vào
  bench (vi phạm → INVALID exit 3) và seek-o3 (vi phạm →
  INVALID exit 2); mobile/check-proxy chưa nối vì dist không cố
  định. Bench nay tính `HANG_BUNDLE` từ dist-dir thay vì null
  (chỉ đúng khi PAGE_URL serve đúng distDir đó). Dạng treo thứ
  hai chứng minh thật: page kẹt `while(true){}` (H2) làm
  evaluate `1+1` cũng timeout, khác promise không settle (H1)
  vẫn resolve; %cpu lifetime-average không phân biệt được H1/H2
  nên chỉ ghi dạng đo thông tin. Probe S6 31/31; bench nhánh
  VALID và INVALID đều đúng hành vi (theo luồng).

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Chỉ viết LIMITS tổng hợp này, file
  paths (§4) và log vòng lặp.
- Đối chiếu file chung: `tsconfig.json` chứa đủ cả 3 exclude
  mới của S3 + S4 + S5, không entry nào bị ghi đè mất;
  `preview.tsx` chỉ có hunk S4 ở vùng gọi controller (dòng
  ~1192) ngoài các hunk cũ; `reverseWebcodecs.ts` chỉ có hunk
  S4; `App.tsx`/`store.ts`/`sample.ts`/`projectRepo.ts` chỉ có
  hunk S5; script N2 chỉ có hunk S2 (field `bigGaps` có gate,
  mặc định tắt); bench + seek-o3 chỉ có hunk S6. Lỗi tsc 3 lỗi
  ở test S3 mà S5 báo giữa buổi đã được chính S3 sửa trước khi
  kết thúc (bước gộp tsc 0).
- Live dist đổi giữa buổi do luồng khác build (S1 ghi
  `index-B3uq-AN2.js` lúc cuối; bước gộp build ra
  `index-CayZMJQu.css`/`index-DAS3nyo_.js` cho probe của S5) —
  số đo các luồng gắn với dist đóng băng riêng của từng luồng,
  không gắn với dist live cuối buổi, cùng caveat như đợt 33–35.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Khóa A/B <10%:** cần phiên đo riêng không chạy chung với
   luồng browser khác (ước ~43 lượt mới đủ 8 accepted/phía
   trong điều kiện nhiễm như đợt này) và/hoặc cổng v3 thêm
   load5/load15; tách "sụp đoạn" khỏi "chậm toàn cục" bằng tỉ số
   GOP2/GOP1 (gợi ý < 0,30, chưa hiệu chuẩn trước); cơ chế sụp
   đoạn sâu kiểu single-a4/retry-b8 chưa rõ.
2. **Baseline quiet 3+3:** vẫn mở — cần cửa sổ quiet có điều
   phối giữa các luồng + lượt đo mới sau khi chốt v3; v3 chỉ là
   đề xuất, ngưỡng v2 vẫn chính thức; 2/4 lượt thưa đợt 36 là
   PARTIAL (đợt baseline tương lai nên yêu cầu verdict PASS).
3. **Nối Q3 vào preview:** phép đo duy nhất còn thiếu để claim
   30 fps ngược là paced reverse liên tục nhiều GOP bằng proxy
   + cửa sổ Q3 sau cờ opt-in; sau đó mới nối Q3 window vào
   controller (mặc định tắt, kèm cảnh báo UI bằng đúng chuỗi
   trong module cổng); đo lại trên máy có GPU thật; xác minh
   ctts/present-order cho proxy có B-frame; 4K nguồn → proxy
   720p; đường `asset:`.
4. **Buffer file:** size tới muộn không hủy được fetch đang
   bay; chưa đo blob: với file lớn thật; fallback tầng vẽ
   full-app chưa click-test; Range theo GOP vẫn cần moov-trước
   + hợp đồng Range cho nguồn http/proxy.
5. **Rehydrate:** autosave mẫu cũ và media user import trong
   phiên cũ vẫn hiện Relink (bytes chưa từng ingest — đường
   importFiles chưa ingest là nợ tiếp theo có giá trị nhất);
   mở file `.vcut.json` có src `asset:` chưa nối rehydrate
   (mới nối đường khôi phục autosave); chưa đo discard thật
   hàng giờ / Safari / máy thật / export sau reload qua bridge
   thật.
6. **Snapshot:** đường timeout snapshot của chính bench chưa
   kích hoạt live; đóng băng mobile/check-proxy chưa nối; backup
   chưa ra khỏi máy thật; chưa chứng minh target kẹt/detached,
   deadlock đa tài nguyên thật, Chrome đơ toàn bộ; chữ ký CPU
   cần lấy mẫu /proc tick-delta thay vì ps lifetime-average.
7. **Nợ đứng chưa đo:** Safari / máy thật / discard thật dưới áp
   lực bộ nhớ / tab ẩn hàng giờ / bfcache / footage B-frame /
   độ phân giải khác / đường `asset:` và đường WebCodecs ở
   dpr > 1 bằng trình duyệt thật.
8. **Thứ tự push:** batch đợt 36 xây trên nền các batch đợt
   22–35; user push theo thứ tự cũ → mới.

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round36-closing-debts35.txt`
  — batch đợt 36 (xem log vòng lặp để biết số file; NUL-delimited,
  không binary, không dist; đã verify read-back + mọi file tồn tại).
- Tổng batch đang chờ user push sau đợt này: xem log vòng lặp
  (14 file paths đợt 22–35 = 652 file, cộng batch mới đợt này).
