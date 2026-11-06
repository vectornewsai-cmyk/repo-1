# Phase 9 đợt 34 — Đóng nợ đợt 33 (đợt lớn, 6 luồng, KHÔNG push) — LIMITS tổng hợp

> Lượt cron 20:03 01/11/2026. KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo. Chủ đề: toàn bộ nợ §3 của
> `docs/PHASE9_ROUND33_LIMITS.md` (A/B seekElement, nối WebCodecs
> cache + hook rAF vào preview, decode-ahead footage nhiễu,
> errorDetail bridge có cấu trúc, snapshot harness còn sót, quy tắc
> đo fps ngược + GOP dày).
> Kiểm chứng gộp của parent (chạy lại độc lập, không lấy số của
> luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi (apps/web),
> `vite build` pass (6,38s), seek 15/15, reversePlayback 10/10,
> reversePlaybackRound28L2 17/17, mp4Demux34Q2 8/8,
> reversePlayback34Q2 4/4, reverseDecodeAhead 12/12,
> errorDetail34Q4 35/35, saveToast31 15/15, structuredNotes32 12/12,
> bridge error-detail 64 + structured 150 + ui 52 + cli-proxy 25 +
> cli-caption-tts 27, i18n vi = en = 931 key lá, 0 key mồ côi,
> `node --check` mọi script mới/sửa pass.
> KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS của
> các luồng — đó là số đo của luồng.
> Lưu ý: bước gộp có chạy `vite build` nên dist hiện tại là bundle
> của đợt 34, không phải bundle đợt 33; số browser của các luồng
> gắn với snapshot bundle của từng luồng, không phụ thuộc dist hiện
> tại (cùng caveat như đợt 33 §2).

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **Q1 A/B seekElement** (`docs/PHASE9_ROUND34_Q1_SEEK_AB_LIMITS.md`):
  Dư fps ngược thưa ~20% KHÔNG phải do settle-wait của retry-loop.
  Cặp matched liền nhau: retry-4 = 6,02 fps vs single-4 = 6,18 fps
  (chênh +2,7%, cùng cỡ độ lặp lại của chính retry 5,83 → 6,02);
  A/B 3+3 dưới tải song song: trung vị retry 1,99 vs single 1,80,
  tỉ số từng cặp đổi dấu 2,21× / 0,24× / 3,24×; phương sai lượt-lượt
  0,90–6,18 fps (~6,9×) áp đảo hiệu ứng 20% cần đo. Kết luận: phương
  sai của điểm N2 8,97 (n=1) + trôi cây/bundle từ đợt 31 đến nay.
  KHÔNG revert seekElement. 2 bundle chỉ khác đúng 1 hunk, build từ
  1 cây đóng băng (209 module), sha256 kiểm tra trước/sau 8/8 khớp;
  1 lần build single đầu bị nhiễm do luồng khác ghi giữa chừng đã
  hủy, không dùng số nào của nó. `seek.ts` live đã khôi phục
  byte-identical (sha256 efb0160b…), nên KHÔNG đưa vào batch đợt này.
- **Q2 nối ReverseFrameCache + hook rAF vào preview**
  (`docs/PHASE9_ROUND34_Q2_REVERSE_WIRING_LIMITS.md`): hook rAF nối
  thật vào vòng lặp preview (`window.__vcutPreviewRaf`); đường
  WebCodecs nối thật vào `drawVideoClip` sau cờ opt-in
  `window.__vcutReverseWebcodecs` mặc định TẮT, chỉ khi stepping
  ngược + cờ bật + có VideoDecoder + cache có frame đúng mốc source
  time, vẽ qua đúng pipeline (mask/SR/LUT/chroma/effects/opacity);
  còn lại rơi về nhánh element cũ nguyên vẹn. ctts v0/v1 + elst
  v0/v1 đã parse (`mp4Demux.ts`), `presentReverse` duyệt theo
  presentation giảm dần, `ReversePreviewController` bất biến (xấu
  nhất trả null → fallback element). Bộ nhớ VideoFrame thật ~2,40
  MiB/frame ở 720p → cache mặc định 75 frame / ngân sách 192 MiB.
  KHÔNG claim 30fps ngược: paced từ cache ấm 90/90 frame trong
  2,981s nhưng 47/90 trễ >20ms dưới tải; present unpaced phẳng
  51,3 fps dưới tải đợt 34 (khác chế độ tải với số quiet của P5).
  Nợ lớn phát hiện: controller giữ nguyên ArrayBuffer file trong
  lúc decode/giữ (file noise 420MB → JS heap 401MB); ngân sách
  192MiB chỉ tính frame, chưa tính buffer file.
- **Q3 cửa sổ decode-ahead cho footage nhiễu**
  (`docs/PHASE9_ROUND34_Q3_DECODE_AHEAD_LIMITS.md`): module mới
  `reverseDecodeAhead.ts` (không sửa `reverseWebcodecs.ts`). Bộ nhớ
  VideoFrame thật ~1,50 MiB/frame (3 ước lượng RSS độc lập, cao hơn
  NV12 lý thuyết 1,382 MiB). Cửa sổ chọn: 300 frame (1 GOP) / ahead
  2 / giữ tối đa 900 frame ≈ 1,32 GiB (ngân sách 2 GiB), slack
  +1,19s ở 31,9 fps. Kết luận trung thực: dưới tải song song đợt
  34, decode phần mềm footage nhiễu chỉ 7,7–26 fps nên KHÔNG giữ
  được nhịp ngược 30fps — deficit throughput, không phải deficit
  cửa sổ; cửa sổ 90 của O5 bị loại cho footage nhiễu (ngay ở 31,9
  fps thì 9,4s > 3s). Test mới 12/12. Caveat: bản chạy đầu đo
  `prefetchWallSec` trước khi await prefetch nên sai, đã sửa script
  và chỉ dùng late-count + wall thật từ ladder/runC.
- **Q4 errorDetail bridge có cấu trúc**
  (`docs/PHASE9_ROUND34_Q4_ERROR_DETAIL_LIMITS.md`): contract
  ADDITIVE, không điểm vỡ — bridge phát thêm `summaryKey` +
  `summaryParams` (toàn string, đã redact) bên cạnh field cũ giữ
  nguyên; web dịch khung qua i18n key
  `errorDetail.summary.<summaryKey>`; consumer cũ + payload mới và
  consumer mới + payload cũ đều không vỡ (fallback summary thô).
  13 summaryKey; khung câu đóng (exit code, signal, no-output,
  curve parse được, asset có tên) dịch trọn vẹn; dòng validator /
  ffmpeg đa dạng vẫn giữ làm dữ liệu thô, không claim "đã dịch
  xong". i18n 918 → 931 = 931, 0 mồ côi. Suite mới
  test-error-detail-structured 150 pass; bridge thật qua HTTP và
  CLI/MCP thật qua dist đều kiểm chứng (dist không vào batch).
- **Q5 nối snapshot cho harness còn sót**
  (`docs/PHASE9_ROUND34_Q5_SNAPSHOT_LIMITS.md`): nối
  `seek-p2-underload-probe.mjs` (WS) và
  `probe-round32-p5-webcodecs-pipe.mjs` (pipe), giữ reject gốc
  verbatim; `seek-p2-retry-probe.ts` (mock Node, không CDP) và
  `probe-round32-p5-page.js` (chạy trong trang, không CDP) xác nhận
  không có gì để nối. mobile-touch-check: timeout `send()` = 60000ms
  (bằng mọi harness khác), tham số tùy chọn nên lệnh gọi cũ không
  đổi. `cdp-snapshot.mjs`: `snapshot.bundle` luôn là object, không
  còn null — không bundle → `{status: "not-captured", ...}` kèm note
  đối chiếu `capturedAt`, không có nghĩa là không có bundle chạy.
  Probe treo giả lập 4/4 PASS (P5 pipe, P2 WS, mobile WS, module
  bundle), snapshot vào thư mục bền, không `rm` thư mục bền (đếm
  delta thay vì xóa bằng chứng). Kiểm kê cuối: không còn harness
  CDP nào có timeout handler mà chưa nối snapshot.
- **Q6 GOP dày + probe đo chuẩn**
  (`docs/PHASE9_ROUND34_Q6_MEASURE_PROTOCOL_LIMITS.md`): clip mẫu
  seek trích lại từ `sample.ts` (VP9 640×360) chỉ có ĐÚNG 1 keyframe
  ở 0 (GOP = toàn clip ~4s, thưa hơn cả ~3,4s của P2 — clip Q6 chỉ
  81/89 frame do ghi dưới tải nên chưa tới ngưỡng keyframe; suy
  luận: ngưỡng theo số frame ~100, bác mốc thời gian 3,4s cố
  định). Clip dày re-encode từ đúng blob đã trích (`-g 30
  -keyint_min 30`): keyframe ở frame [0, 30, 60], khoảng đúng
  [30, 30] frame (file .webm chỉ ở scratch, không vào batch).
  Probe đo chuẩn v2 bọc harness N2 nguyên vẹn: ghi loadavg, top
  CPU, số Chrome trước lượt, tốc độ xuôi, gap rAF xuôi, nhãn
  loadLabel + lý do + câu cấm so sánh giữa chế độ tải; hiệu chuẩn
  v1→v2 (lost-rate thay cho "0 gap >100ms tuyệt đối") từ dữ liệu
  đợt 33. Baseline quiet đợt 34 KHÔNG đạt: 7 lượt chỉ 1 quiet
  (dày 16,07 fps, bundle khác đợt 33), 0 lượt quiet thưa — không
  claim hồi quy; baseline quiet mới nhất vẫn là đợt 33 của P5
  (thưa tv 7,09; dày tv 22,39).

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Chỉ viết LIMITS tổng hợp này, file
  paths (§4) và log vòng lặp.
- Đối chiếu file chung: `tsconfig.json` chứa đủ 4 exclude mới của
  Q2 (2) + Q3 (1) + Q4 (1), không entry nào bị ghi đè mất;
  `preview.tsx` chỉ có hunk nối rAF của Q2; `seek.ts` chỉ đổi mtime
  do Q1 khôi phục, nội dung byte-identical nên loại khỏi batch;
  `saveToast31.test.ts` / `structuredNotes32.test.ts` chỉ đổi để
  parity i18n 918 → 931 (Q4), test vẫn xanh khi chạy từ gốc repo
  (chạy từ thư mục con sẽ lỗi đường dẫn i18n tương đối — lỗi cách
  chạy, không phải hồi quy; đợt 33 từng gặp dạng này với
  archiveNested32P4).
- Các lỗi tsc thoáng qua mà Q3/Q4 thấy ở `reverseWebcodecs.ts`
  trong lúc Q2 đang sửa đã hết ở bước gộp (tsc 0); lỗi vite build
  ở `preview.tsx` mà Q4 thấy cũng đã hết (build pass 6,38s).
- 3 test web (errorDetail34Q4, saveToast31, structuredNotes32) ở
  bước gộp phải chạy từ gốc repo mới xanh; parent đã chạy đúng
  cách và ghi rõ ở trên, không lấy số chạy sai thư mục.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **Quiet 3+3 thật cho A/B seekElement (Q1):** cặp matched mới n=1;
   cần parent điều phối tạm dừng probe các luồng khác trong cửa sổ
   đo, kèm probe decode-side (lượt single-3 cho thấy nhiễu decode
   ẩn mà proxy xuôi/rAF không thấy).
2. **Baseline quiet đóng băng bundle (Q6 §5.8):** 4 bundle khác nhau
   trong 7 lượt đã phá điều kiện "cùng bundle"; cải tiến probe nhận
   dist đóng băng (`Q6_DIST`) đã ghi nhưng chưa làm.
3. **Buffer file của ReversePreviewController (Q2 §5):** phải đổi
   sang fetch theo khoảng GOP hoặc nhả buffer sau decode trước khi
   bật cờ cho file lớn (file 420MB → heap 401MB); ngân sách cache
   hiện chỉ tính frame.
4. **Đo quiet đối chứng + đo GPU cho đường WebCodecs (Q2/Q3):**
   nếu hardware decode ≥60 fps thì kết luận decode-ahead đảo ngược;
   nếu software decode vẫn <30 fps thì hướng rẻ nhất là phát ngược
   bằng proxy độ phân giải thấp (hạ tầng Q8) hoặc giữ đường
   hold-frame cũ và báo rõ giới hạn. Nối module Q3 vào preview chỉ
   sau khi Q2 chốt + có ctts/elst + đo GPU.
5. **Lần treo THẬT có snapshot (Q5):** mới chỉ có treo giả lập;
   snapshot bền vẫn chỉ nằm trên đĩa VM, không backup ra ngoài;
   mobile-touch-check: vòng fetch `/json` + chờ `ws.onopen` vẫn chưa
   có timeout, CDP trả `d.error` vẫn resolve với `d.result`
   undefined như trước; harness WS vẫn chỉ ghi "not-captured" chứ
   chưa ghi bundle thật (cần snapshotDist riêng từng harness WS).
6. **Nợ đứng chưa đo:** Safari / máy thật / dpr > 1 / viewport khác
   cho dip/seek/reverse; tọa độ spinner tuyệt đối trên máy user;
   tab ẩn hàng giờ / discard thật; footage dip khác ngoài K→L→J;
   điều kiện (b)(c)(d) của M6 vẫn mở; bar strict tuyệt đối 0 tăng
   vẫn còn 7 ô single gốc + 1 ô cặp thứ ba tăng +0,3333 (nhiễu làm
   tròn 8-bit, tất cả vẫn KHỚP).
7. **Thứ tự push:** batch đợt 34 xây trên nền các batch đợt 22–33
   (đặc biệt Q4 đổi i18n 918 → 931 trên nền đợt 33, Q5 nối trên
   harness đợt 33); user push theo thứ tự cũ → mới, tránh đảo thứ tự
   với batch khôi phục O32 (O32 trước, đợt 33 sau, rồi đợt 34).

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round34-closing-debts33.txt`
  — batch đợt 34 (61 file text, NUL-delimited, không binary,
  không dist; đã verify read-back 61 entry + mọi file tồn tại;
  `seek.ts` loại khỏi batch vì nội dung byte-identical đã khôi phục).
- Tổng batch đang chờ user push sau đợt này: xem log vòng lặp
  (12 file paths đợt 22–33 = 542 file, cộng 1 file mới đợt này).
