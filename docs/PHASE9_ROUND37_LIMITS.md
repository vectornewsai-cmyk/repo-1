# Phase 9 đợt 37 — Đóng nợ đợt 36 (đợt lớn, 6 luồng, KHÔNG push) — LIMITS tổng hợp

> Lượt cron 14:03 02/11/2026. KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo. Chủ đề: toàn bộ nợ §3 của
> `docs/PHASE9_ROUND36_LIMITS.md` (khóa A/B <10%, baseline quiet 3+3,
> nối Q3 vào preview + proxy chiều ngược, buffer file, rehydrate,
> snapshot bền).
> Kiểm chứng gộp của parent (chạy lại độc lập, không lấy số của
> luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi (apps/web),
> `vite build` pass (5,32 s), gate v3 13/13, wiring Q3 12/12
> (esbuild bundle từ gốc repo), importAsset 8/8, cancel 6/6
> (esbuild bundle), heap S4 6/6 (esbuild bundle), gate 12/12,
> decodeAhead 12/12, rehydrate 19/19, assetStore 22/22,
> projectRepo 10/10, `node --check` 13 script mới/sửa,
> 9 file JSON v37 parse OK. KHÔNG chạy lại ở bước gộp: mọi phép đo
> browser headed / FPS của các luồng — đó là số đo của luồng,
> tất cả đều under-load do 6 luồng chạy song song, cấm dùng làm
> baseline quiet.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **T1 cổng đo v3 + tách sụp đoạn**
  (`docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md`): cổng v3 mới, giữ
  nguyên mọi ngưỡng v2, thêm load5/load15 < 2,0 vào verdict tải và
  tỉ số GOP2/GOP1 làm bộ tách chẩn đoán (không dùng để nhận/loại
  lượt). Hiệu chuẩn trên dữ liệu cũ (35 lượt + 8 lượt chỉ-tải):
  v3 đổi nhãn đúng 4 lượt "quiet" đợt 36, tập accepted gộp
  8 → 5 (toàn R1); tỉ số < 0,30 bắt 2/5 ca STEADY_SLOW thành
  SEGMENT_COLLAPSE, 0/23 lượt HEALTHY bị gắn cờ sai; retry-b8
  (0,343) rơi vùng INDETERMINATE_MIXED mới. v3 chỉ là đề xuất,
  v2 vẫn là cổng chính thức cho tới khi có phiên đo riêng.
- **T2 paced reverse nhiều GOP + nối Q3 vào controller**
  (`docs/PHASE9_ROUND37_T2_PACED_Q3_LIMITS.md`): paced reverse
  liên tục 3 GOP (185 frame) bằng proxy 480p + cửa sổ Q3: phiên
  nhẹ 6/6 lượt 185/185 frame, 30,14–30,15 fps, late >20 ms chỉ
  0–7 frame; phiên nặng sụp còn 19,39 fps / 66 missed. Kết luận
  gắn điều kiện tải, không claim tuyệt đối. Q3 đã nối vào
  controller NHƯNG chỉ qua cổng opt-in S3, mặc định TẮT (cổng tự
  đóng dưới tải nặng); badge + toast hiện đúng chuỗi cổng.
  Kiểm chứng browser đường nối: bật → prefetch 82 → 157 frame,
  frameAt hit frame giữa đoạn ahead; bị chặn → cache đứng yên.
- **T3 ingest importFiles + rehydrate đường mở file**
  (`docs/PHASE9_ROUND37_T3_IMPORT_ASSET_LIMITS.md`): importFiles
  nay ingest từng item vào AssetStore sau khi tên đã chốt duy
  nhất, await đủ trước khi resolve, best-effort (lỗi ingest không
  hỏng import). Đường mở `.vcut.json` nay chạy đúng thứ tự như
  autosave: replaceProject → rehydrate → checkMissingMedia, dùng
  chung module rehydrate36S5, khớp `asset:` + tên thô + nested.
  Probe trình duyệt thật 6/6: reload không Relink oan, mở file
  `asset:` không Relink, đối chứng âm hiện Relink đúng.
- **T4 snapshot bench live + đóng băng mobile/check-proxy + CPU
  /proc** (`docs/PHASE9_ROUND37_T4_SNAPSHOT_LIMITS.md`): cờ
  `--cdp-hang-probe` cho bench: treo H1 thật qua chính
  `Cdp.send()` của bench, timeout 5000 ms → đúng 1 snapshot mới,
  frozenDist VALID, exit 0. Đóng băng dist nối cho mobile
  (frozen VALID live; nhưng touch FAIL — chỉ claim đóng băng)
  và check-proxy chế độ `--preview-dist` (PROXY 720p OK +
  frozen VALID, exit 0; dist lệch → từ chối exit 2). Module
  `cdp-cpu-sample.mjs` đọc /proc tick-delta: H1 2,7% vs H2
  99,9% (chênh 97,2 điểm), trong khi ps lifetime-average đảo
  ngược — tái xác nhận ps mù trước 2 dạng treo. Probe T4 27/27.
- **T5 blob file lớn + hủy fetch đang bay + click-test fallback**
  (`docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md`): load() chạy
  dưới 1 AbortController riêng; size tới muộn vượt ngưỡng hủy
  được cả lúc HEAD bay lẫn GET bay, dispose hủy tải mồ côi.
  Đo blob 400,5 MiB thật: biết size trước → 0 request; không
  biết size trước → GET blob: vẫn báo content-length nên cổng
  header hủy body trước khi đọc, heap phẳng; đối chứng http
  chunked không length vẫn vọt 401,2 MiB rồi hạ sau ~0,5 s.
  Click-test fallback full-app PARTIAL (không phải PASS): routing
  đúng, wcHits 0, nhưng frame thật đầu tiên tới muộn ~9–12 s do
  đường element cũ đuổi seek trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] — nợ của đường
  element cũ, không phải code T5.
- **T6 proxy 4K→720p + ctts/B-frame + đường asset:**
  (`docs/PHASE9_ROUND37_T6_PROXY4K_CTTS_LIMITS.md`): 4K nhiễu
  461 MB/6 s → proxy 720p 10,2 MB, decode 63,8/72,0 fps,
  present unpaced 85,4/120,4 fps (biên trên ngưỡng dễ 60 chỉ
  ~6–20%, verdict nhạy tải); nguồn 4K gốc chỉ 2,2–3,0 fps
  (proxy nhanh hơn ~21–30×). Phát hiện chính: proxy 4K→720p
  KHÔNG reorder (ctts offset hằng số 1024) dù ffprobe báo
  `has_b_frames=2` — `has_b_frames` không phải bằng chứng
  B-frame; bằng chứng đúng là độ biến thiên ctts. Trên proxy
  reorder thật: present khớp presentationTimestamp 62/62, test
  Node 6/6. Đường `asset:` không có nhánh riêng trong cổng —
  verdict chỉ phụ thuộc opt-in/số đo decode; controller qua blob
  trúng frame sau 0,203 s (720p) / 0,624 s (reorder 480p).

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Chỉ viết LIMITS tổng hợp này, file
  paths (§4) và log vòng lặp.
- Đối chiếu file chung: `reverseWebcodecs.ts` giữ đủ cả hunk T2
  (nối Q3 sau cổng) và hunk T5 (AbortController); `preview.tsx`
  chỉ có hunk T2 (badge decode-ahead); `store.ts` chỉ có hunk T3
  trong `importFiles`; `ProjectMenu.tsx` chỉ có hunk T3 trong
  `onFile`; `tsconfig.json` chứa đủ cả 3 exclude mới
  (T2 + T3 + T5); các script bench/mobile/check-proxy chỉ có
  hunk T4.
- Hai file paths riêng do T1/T2 tự tạo
  (`phase9-round37-t1-gate-v3.txt`, `phase9-round37-t2-paced-q3.txt`)
  đã được gộp vào batch duy nhất đợt 37 rồi gỡ bỏ, để tránh
  push trùng nội dung.
- Lỗi chạy test thoáng qua ở bước gộp: parent chạy T2/T5 bằng
  `node --test` trực tiếp nên fail do import mp4Demux không đuôi
  — không phải lỗi test; chạy lại đúng runner esbuild bundle theo
  header file thì 12/12 và 6/6. Tương tự, đường dẫn JSON ban đầu
  sai cấp (`apps/benchmarks` thay vì `benchmarks` gốc repo) —
  đã sửa, 9/9 file parse OK.
- Đính chính chéo: báo cáo T6 ghi "paced reverse nhiều GOP vẫn
  mở từ S3 §7.1" — đã lỗi thời so với cùng đợt: T2 đã đo paced
  3 GOP trong đợt này (đạt ở phiên nhẹ, sụp ở phiên nặng), nên
  nợ đó nay là "cần phiên quiet có điều phối để claim", không
  còn là "chưa đo".

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Khóa A/B <10%:** vẫn chưa khóa — cần phiên đo riêng không
   chạy chung luồng browser khác (protocol đã viết ở LIMITS T1
   §4, mục tiêu 8 accepted/phía, kế hoạch 40 lượt, trần 48),
   chốt ngưỡng v3 trước rồi mới chạy; ngưỡng load5 mong manh
   (cụm cách nhau chỉ 0,22); cơ chế sụp đoạn sâu vẫn chưa rõ.
2. **Baseline quiet 3+3:** vẫn mở — cần cửa sổ quiet có điều
   phối giữa các luồng + lượt đo mới sau khi chốt v3; mọi số
   đợt 37 đều under-load, cấm dùng làm baseline.
3. **Q3 trong preview:** chưa có toggle UI để bật decode-ahead;
   badge chưa click-test trên app thật; bật giữa chừng chỉ có
   tác dụng từ lần decode cửa sổ mới; cần đo lại phiên quiet +
   máy có GPU thật; ctts cho proxy khác, 4K→proxy displayed
   element, dpr > 1 vẫn chưa đo.
4. **Buffer file:** Range theo GOP + moov-trước + hợp đồng Range
   cho nguồn http/proxy vẫn đứng; nguồn http/proxy thật chưa đo
   (khi có proxyUrl, preview không truyền `item.file.size` nên
   cổng S4 không áp dụng); size muộn sau HEAD đã trả size nhỏ
   thì first-wins bỏ qua (thiết kế có chủ ý).
5. **Rehydrate:** dedup cùng bytes khác tên vẫn Relink đúng sau
   reload (sửa triệt để cần chuyển src clip sang `asset:` lúc
   tạo clip — chạm addMediaToTrack/export/render, ngoài phạm
   vi); đường relink tay chưa ingest; chưa chứng minh export
   sau reload qua bridge thật, discard hàng giờ, Safari/máy
   thật, thời gian ingest file lớn, quota IDB bị evict.
6. **Snapshot:** nhánh INVALID của mobile/check-proxy chưa kích
   hoạt live bằng dist thật; bench hang-probe mới chứng minh H1,
   chưa chứng minh H2 qua chính bench; nguyên nhân mobile touch
   FAIL trên dist đợt 37 cần xác định riêng; backup vẫn chưa ra
   khỏi máy; chưa chứng minh target kẹt/detached, deadlock đa
   tài nguyên, Chrome đơ toàn bộ; ngưỡng CPU mới hiệu chuẩn
   trên 1 lần CDP + 1 lần Node, cần lặp lại trước khi làm cổng
   tự động.
7. **Nợ đứng chưa đo:** Safari / máy thật / discard thật dưới áp
   lực bộ nhớ / tab ẩn hàng giờ / bfcache / footage B-frame ở
   dpr > 1 / đường WebCodecs ở dpr > 1 bằng trình duyệt thật;
   click-test fallback PARTIAL (frame đầu muộn ~9–12 s trên file
   GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB) thuộc về luồng sở hữu preview.

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round37-closing-debts36.txt`
  — batch đợt 37 (xem log vòng lặp để biết số file; NUL-delimited,
  không binary, không dist; đã verify read-back + mọi file tồn tại).
- Tổng batch đang chờ user push sau đợt này: xem log vòng lặp
  (15 file paths đợt 22–36 = 719 file, cộng batch mới đợt này;
  các đợt 1–21 đã push xong).
- Thứ tự push: batch đợt 37 xây trên nền các batch đợt 22–36;
  user push theo thứ tự cũ → mới.
