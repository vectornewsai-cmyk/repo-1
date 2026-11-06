# Phase 9 đợt 48 — LIMITS tổng hợp (đóng nợ đợt 47, 6 luồng, KHÔNG push)

Lượt cron 20:03 05/11/2026. Chốt chặn: `round-in-progress.md` KHÔNG tồn
tại → chạy bình thường. Trước đợt: 28 file paths / 1118 entry chờ push
(đợt 22–47; đợt 1–21 đã push xong chiều 29/10). Chủ đề lấy từ nợ mở
đợt 47 §4. KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 1. Nội dung 6 luồng

- **D1 TTS** (`PHASE9_ROUND48_D1_TTS_LIMITS.md`): TtsButton chuyển sang
  helper C4 (1 import + 1 lời gọi, test B3 §4 cập nhật assertion nối
  UI); đỏ-trước 7 pass/1 fail đúng test nối UI, xanh-sau 12/12.
  PHÁT HIỆN: ngưỡng numberDense 5% SAI — 16 mẫu thật mới cho thấy tốc
  độ giảm DẦN theo tỉ lệ chữ số, không có bước nhảy ở 5% (5,08% →
  16,27 ký tự/giây, bình thường). Ngưỡng sửa 0,05 → 0,13; số-dày
  9,0010 → 9,5388 (n=4, gộp X1); medium 17,6835 → 16,0714 (n=17).
  Hiệu ứng số-dày PHỤ THUỘC GIỌNG (cùng text M3: Minh Đức 8,90 vs Hải
  Đăng 11,55). Đo thêm 7 giọng (21/25 đã đo, chênh tới 46% theo
  giọng). Phản ví dụ X2 (Minh Đức, 12,43% → 8,82) chứng minh không có
  ngưỡng tỉ lệ nào đúng cho mọi giọng. Hồi quy C4 10/10, B3 7/7, A3
  10/10, Z3 9/9, relink 12/12. Đính chính: hậu tố B3 "(≈9.6–11.0s)"
  là cho text 184 ký tự, không phải M3 178 ký tự.
- **D2 Settle** (`PHASE9_ROUND48_D2_SETTLE_LIMITS.md`): instrumentation
  tầng harness (bọc `window.VideoDecoder`, ghi timestamp feed/flush/
  output/error/close) tách gap settle−W2end trên 12 attempt / 2 lượt
  headed: **flush chiếm ~96–97% gap** (feed 0,0 ms 12/12, drain
  ~5 ms; gap 80–291 ms; tổng 3 pha = gap, sai số ≤ 0,1 ms).
  **W2 decode trực tiếp = 0 frame (12/12)**: decoder W2 chỉ sống
  0,3–4,0 ms ở cuối W2 (>99% thời gian W2 là load blob 69 MB +
  demux); feed 1 chunk key rồi chunk delta thứ 2 làm `decode()` ném
  đồng bộ `A key frame is required after configure() or flush.` —
  không có error callback nào (0/12), không flush, 0 output. Đính
  chính C2 §4.1: short-circuit không phải qua error callback. Đã sửa
  2 bug của chính harness (đồng hồ tuyệt đối nuốt gap; đếm chunk
  cùng mili-giây) + test khóa, chạy lại live lượt 2. SUCCESS đường
  `asset:` vẫn mở: 0/12 D2 (0/23 cộng C2+B1). Hồi quy A1 20/20, Z1
  19/19, B1 19/19, Y1 14/14, C2 24/24, D2 31/31.
- **D3 Pause** (`PHASE9_ROUND48_D3_PAUSE_LIMITS.md`): kind `"error"`
  qua spec dị dạng — KHÔNG TẠO ĐƯỢC, đã chứng minh vì sao: 11 spec
  qua app thật, 6 bị cổng load từ chối (rơi về project mẫu), 4 qua
  load nhưng không ném, đúng 1 spec ném (audio clip có
  `volumeKeyframes.keyframes: [null]` → TypeError trong
  `interpolateKeyframes`) nhưng nó giết tick ở `syncMedia` TRƯỚC khi
  nhánh pause phát seek request nên Seeker không bao giờ chạy
  (`kindsSeen: []`). Kết luận: kind `"error"` không tạo được qua spec
  dị dạng bằng đường app thật. Mock Z2 `releaseElement` đã sửa cho
  khớp Chrome thật (gọi lại `createMediaElementSource` ném
  `InvalidStateError`); audioEngine44Z2 6/6 (trước sửa 2 test mới đỏ).
  Loại trừ 3 cờ Chrome (v2/v3/v4, FAIL=0 mỗi lần) cho fail-fast
  seek-landing-0; binary Hatch Chromium 155 không dùng được cho probe
  loopback (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, đã thử gỡ
  bằng cờ, không đụng managed policy) — **fail-fast vẫn NOT_MEASURED**,
  chỉ còn biến binary/cờ của phiên Chrome Y2 gốc. Quirk frame khác 0
  vẫn NOT_MEASURED (2 hướng mới đều không đáp sai). BUG MỚI: project
  có `volumeKeyframes` chứa entry null làm vòng lặp preview chết cứng
  (chỉ reload mới hết) — chưa sửa. Hồi quy pause 111/111 +
  audioEngine 6/6 = 117 xanh.
- **D4 GOP** (`PHASE9_ROUND48_D4_GOP_LIMITS.md`): end-to-end app thật
  với file trailing 37 MiB: import 1,8 s → phát ngược, playhead lùi
  72 → 50 s trong 45 s, canvas 35 frame KHÁC NHAU (0 mẫu đen), 0
  uncaught exception — **13/14 cổng pass**. Cổng FAIL duy nhất:
  `gopActive` không bao giờ true, controller rơi về full-file với lý
  do `gate: moov-unknown`, tải toàn bộ blob 37 MiB vào heap rồi decode
  bình thường. NGUYÊN NHÂN ĐÃ CHỨNG MINH bằng probe đối chứng: HEAD
  trên blob URL ném `TypeError: Failed to fetch`; Range trả 206 +
  đúng byte nhưng `accept-ranges` luôn null; gate
  `acceptsByteRanges` đòi đúng chuỗi `"bytes"` trước tail-scan nên
  đường GOP **không bao giờ bật cho file import local** — mọi lần đo
  GOP trước đây đều qua bridge HTTP nên không lộ lỗi này. i18n toggle
  GOP: 3 key mới `topbar.reverseWebcodecs*`, parity vi = en = 971
  leaf, test D4 3/3. Hồi quy GOP đủ bộ xanh.
- **D5 Probe** (`PHASE9_ROUND48_D5_PROBE_LIMITS.md`): test khóa cơ chế
  "10 lần thử seek 20 timeout, 0 lần gán currentTime" 7/7 xanh
  (đỏ-trước FAIL `10 !== 0` với seek ngây thơ luôn gán; trạng thái
  cuối khớp đúng endIdle C6). Mốc trung gian WEBCODECS → failed ĐÃ
  GHI ĐƯỢC bằng MutationObserver: flip sau **75,0 ms**, không có
  trạng thái trung gian (3 mutation cùng 1 ms). **Trần 1000 ĐÃ CHẠM**
  trên đường sync: episode scrub dài 30 bước / 31,1 s, entry k=1 tích
  lũy 1000 mẫu giữ + 88 dropped trong 35,6 s seeking; bound C6
  (<780) chỉ đúng cho episode MỘT target — trần chạm được khi thời
  gian seeking × tốc độ rAF ≥ ~1000. Hồi quy B5 5/5, A6 12/12, seek
  15/15. B6/Z6 chỉ rớt snapshot đếm key i18n do D4 thêm 3 key —
  parent đã bump lúc gộp (xem §2).
- **D6 LoadSample** (`PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md`):
  hai `loadSample` chồng nhau nay coalesce + retry có điều kiện trong
  `store.ts` (lần chồng ghi nhớ kèm thế hệ project; chỉ retry khi lượt
  vừa xong KHÔNG set được và thế hệ không đổi): xanh-sau 7/7 × 4 lượt
  trên Chromium headed thật (retry ra mẫu sau ~15,1–15,6 s); đỏ-trước
  6/7 × 3 lượt hợp lệ, D4 FAIL cả 3 (sau 45 s vẫn không thấy mẫu).
  Hồi quy race C1 7/7 × 3, Node 60 pass. Compat trình duyệt thứ 2 vẫn
  chưa đo: máy chỉ có `chromium-1248`, không có binary Firefox/
  Safari; không tải, không claim.

## 2. Kiểm chứng gộp của parent (độc lập)

- Đối chiếu đĩa với hợp 6 danh sách LIMITS: đĩa có đúng các file
  trong hợp danh sách (trừ dist/ build output, không stage); 0 file
  lạ; không binary, không dist, không pycache trong batch. File chung
  nguyên vẹn: `store.ts` đủ marker generation C1 + `sampleReloadQueued`
  D6 (15 hit); `TtsButton.tsx` gọi `ttsDoneSuffixRange47C4` thật;
  `TopBar.tsx` đủ marker D4 + dùng 3 key i18n mới; `tsconfig.json`
  đủ 2 dòng exclude D4 + D5; i18n leaf vi = en = 971 (đếm lại bằng
  Python).
- Sửa của parent ở bước gộp: chỉ bump snapshot đếm key i18n
  968→971 ở `reverseBadge46B6.test.ts` + `reverseCompat44Z6.test.ts`
  (kèm sửa comment số học 966+2→971 cho đúng +3 key D4), và
  931→971 ở `saveToast31.test.ts` + `structuredNotes32.test.ts` +
  comment ở `errorDetail34Q4.test.ts` (saveToast31 đã đỏ từ trước đợt
  48 vì dict đã 968 từ đợt 46). Không sửa logic luồng nào.
- Parent chạy lại: `tsc --noEmit` 0 lỗi; `vite build` pass (5,05 s,
  cảnh báo chunk >500 kB có sẵn). Chạy lại bằng esbuild bundle +
  `node --test` (từ repo root): D1 12/12, C4 10/10, B3 7/7, D2 31/31,
  C2 24/24, D5 7/7, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, audioEngine44Z2 6/6 — fail 0. (Lưu ý: script
  chạy test của parent in nhầm "12 SUITES FAILED" do regex đếm `# pass`
  không khớp format `node --test`; mọi suite đều in `0 fail`.)
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của các
  luồng, đo TTS WAV, click-test headed từng panel, phiên solo thật,
  đo IDB thật (chỉ đối chiếu LIMITS + test Node + tsc/build).
- Lưu ý: luồng D1 đã tự ghi một mục log riêng vào build-loop-log.md
  trước mục tổng hợp này.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round48-closing-debts47.txt`
  (35 file text, NUL-delimited, không binary, không dist, đã verify
  read-back 35 entry + mọi file tồn tại) — gộp D1–D6 + LIMITS tổng hợp
  này + 5 file bump snapshot của parent.
- Tổng batch đang chờ user push sau đợt này: 29 file paths / 1153
  entry (1118 đợt 22–47 + 35 đợt này; các đợt 1–21 đã push xong).
  Entry đếm theo batch, file trùng giữa các batch tính nhiều lần
  như tiền lệ.

## 4. Nợ mở cho đợt 49

1. Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat (nợ gốc nhiều đợt).
2. TTS: hiệu chuẩn theo giọng (nợ lớn nhất D1 — chênh tới 46% theo
   giọng, cần bảng hệ số theo giọng + helper nhận thêm tham số voice);
   ngưỡng 13% vẫn tạm thời (X2 chứng minh không có ngưỡng tỉ lệ nào
   đúng cho mọi giọng); 4 giọng chưa đo (Quỳnh Anh, Đức Trí, Kim
   Thanh, Adam bựa); phương sai Mỹ Duyên 11,3% cần đo lặp thêm; tốc
   độ tổng hợp quan sát 0,15–0,59× realtime, chậm hơn nhiều con số
   "~1,5–2,5×" trong memory — cần đo riêng.
3. GOP: **sửa gate để GOP bật trên blob URL** (nợ lớn nhất D4 — hướng:
   coi probe/prefix 206 đã chứng minh Range thật thay vì đòi header,
   hoặc trường hợp riêng blob URL; phải đối chiếu nguyên tắc U2 "không
   giả định" + kèm test khóa); chưa đo đỉnh heap khi fallback tải toàn
   file blob 37 MiB; nút "Phát ngược" K4 vẫn hardcode tiếng Việt.
4. Settle-drop: SUCCESS đường `asset:` vẫn mở (0/23 cộng dồn) — từ số
   D2, cái cần thắng là đuôi flush (71–281 ms): toggle sớm hơn để
   flush chồng lên pha load của W2, hoặc resolve sớm khi đủ frame
   (đổi production, cần test đỏ-trước/xanh-sau); vì sao chunk delta
   thứ 2 ném "key frame required" dù chunk key đã enqueue; vì sao
   prefetch setup không tạo decoder; chỉ 1 fixture 360p GOP 90.
5. Pause: fail-fast seek-landing-0 headed vẫn NOT_MEASURED (chỉ còn
   binary/cờ của phiên Chrome Y2 gốc, không còn bản ghi); quirk đáp
   sai frame khác 0 vẫn NOT_MEASURED (hướng chưa thử: cắt GOP nhưng
   giữ moov/stss hợp lệ, nhiều track video, keyframe lỗi giữa GOP);
   **BUG MỚI: `volumeKeyframes` chứa entry null làm vòng lặp preview
   chết cứng** — đợt sau validate ở cổng load hoặc bọc tick bằng
   try/catch; vòng lặp với footage không decode được quay ~19 tick/s
   trong ~30–40 s trước khi ngủ.
6. Probe: baseline quiet vẫn chờ; trần 1000 trên WebCodecs/Safari/máy
   thật/footage B-frame chưa đo; filmstrip trong lượt sync C6 chưa
   chạy; endPool sau drop chưa có fingerprint elementId trực tiếp.
7. LoadSample: case D (call1 ném lỗi rồi retry) chưa đo riêng trên
   browser thật; chưa có unit test Node cho queue/retry.
8. Compat: Safari/Firefox/máy thật/màn hình vật lý vẫn CHƯA ĐO.
9. Chung: mọi số timing đợt 48 đều under-load (6 luồng song song),
   cấm dùng làm baseline quiet hay claim fps. Các luồng nên viết
   LIMITS + ghi kết quả từng phần sớm để daemon restart không mất
   trắng báo cáo (bài học đợt 47).
