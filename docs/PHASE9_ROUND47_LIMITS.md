# Phase 9 đợt 47 — LIMITS tổng hợp (đóng nợ đợt 46, 6 luồng, KHÔNG push)

Lượt cron 14:03 05/11/2026. Chốt chặn: `round-in-progress.md` KHÔNG tồn
tại → chạy bình thường. Trước đợt: 27 file paths / 1090 entry chờ push
(đợt 22–46; đợt 1–21 đã push xong chiều 29/10). Chủ đề lấy từ nợ mở
đợt 46 §4, trừ 2 nợ cần cửa sổ yên từ main chat (phiên solo A/B thật,
phiên quiet khóa cổng CPU) vẫn giữ làm nợ mở, không ép đóng.
KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 0. Sự cố giữa đợt: daemon restart giết cả 6 luồng

Lượt chạy đầu (6 luồng C1–C6) bị daemon restart giết lúc ~07:16 UTC,
không có báo cáo cuối, không có checkpoint. Parent kiểm tra đĩa trước
khi kết luận (bài học đợt 19/38): còn 17 file làm dở trên đĩa, không
có file LIMITS đợt 47 nào, không có file C4 nào. Đã giao lại 6 luồng
tiếp tục từ đĩa (C4 làm lại từ đầu), yêu cầu viết LIMITS sớm. Cả 6
luồng giao lại đều hoàn thành và báo cáo đầy đủ. Số liệu dưới đây là
của 6 luồng giao lại (trừ khi ghi rõ lấy từ lượt đầu).

## 1. Nội dung 6 luồng

- **C1 loadSample** (`PHASE9_ROUND47_C1_LOADSAMPLE_LIMITS.md`): vá race
  `loadSample` ghi đè project vừa mở bằng generation counter trong
  `store.ts` (`projectGeneration` module-level; `loadSample` chụp thế
  hệ trước `await buildSampleProject()`, chỉ `set` khi thế hệ không
  đổi; `newProject`/`replaceProject` và `loadSample` set thành công
  đều tăng thế hệ). Mọi đường thay toàn bộ project đều qua
  `replaceProject`/`newProject` nên đều tăng thế hệ; chỉnh clip qua
  `execCommand` không tăng — đúng. Đỏ-trước 5/7 (C4 FAIL: revert về
  mẫu ở +8,1 s; C5 FAIL: autosave bị ghi đè bằng mẫu), xanh-sau 7/7
  (giữ project mới 20 s, autosave đúng). Hồi quy 60 pass. Lưu ý: lượt
  đỏ chỉ gỡ phần generation counter, không gỡ `sampleLoading` reset ở
  `finally` nên C6 PASS cả lượt đỏ; hai `loadSample` chồng nhau thì
  lần 2 return ngay, không tự retry (nợ).
- **C2 settle** (`PHASE9_ROUND47_C2_SETTLE_LIMITS.md`): SUCCESS đường
  `asset:` vẫn MỞ — 0/9 attempt C2 (6 chạy lại + 3 lượt đầu khôi phục
  từ đĩa), cộng B1 thành 11/11 PARTIAL-immediate-drop, gap
  settle−W2end luôn dương (36–901 ms). Aim KHÔNG còn là chỗ nghẽn:
  4 attempt tắt với remaining = 0 mà settle vẫn trượt 208–901 ms.
  Lever "W2 chậm hơn bằng mốc muộn" bị bác (pha D1 n=4/mốc: mốc 974
  trung bình 2850 ms, mốc 989 trung bình 2096 ms, khoảng chồng nhau
  hoàn toàn — W2 do tải chi phối). Cơ chế trượt (đọc code + khớp số):
  W2 short-circuit khi decoder gặp GOP hỏng, prefetch phải feed hết
  136 chunk + flush mới resolve nên settle luôn sau W2 — chưa có
  timestamp feed/flush trực tiếp, đã ghi rõ. `decoded` trực tiếp của
  W2 vẫn không có. Không sửa production. Test 24/24, hồi quy
  A1/Z1/B1/Y1 xanh.
- **C3 pause** (`PHASE9_ROUND47_C3_PAUSE_LIMITS.md`): fail-fast
  seek-landing-0 headed VẪN NOT_MEASURED (seek 2,5 trên broken-gap
  vẫn đáp đúng 2,5 dù đã thử tab-mới + server Y2-exact + A/B
  Range; chỉ còn cờ/binary phiên Chrome Y2 gốc chưa loại trừ). Quirk
  đáp sai frame khác 0 headed VẪN NOT_MEASURED (5 fixture zero-packet
  đều error code 3 / kẹt seeking). Kind `"error"` từ fixture media
  thật KHÔNG TÌM THẤY sau 5 fixture (lý giải bằng code:
  `pool.videoFor/audioFor` không ném theo media, `seekAll` bắt lỗi
  từng element). Bù lại: releaseElement headed PASS, khẳng định A2
  §5.7 từng số (`createMediaElementSource` gọi lại ném
  `InvalidStateError`); app-loop broken-gap cap-10-timeout PASS ×2,
  ticks đứng yên PASS ×2. Sửa 3 lỗi harness (Chrome 156 bỏ qua URL
  ở `/json/new`; giả thuyết tab nền đóng băng timer là SAI;
  `raw.html` thiếu `<body>`). Hồi quy pause 111/111. Không đổi file
  production nào.
- **C4 TTS** (`PHASE9_ROUND47_C4_TTS_LIMITS.md`): 8 mẫu thật mới qua
  `tts.py` (WAV ở /tmp, ngoài repo); đã đo 14/25 giọng preset.
  PHÁT HIỆN: text nhiều số đọc chậm GẤP ĐÔI (~8–9 ký tự/giây vs
  ~17–19) xuyên tầng; tên riêng/dấu câu dày đọc bình thường. Bảng C4
  tách 2 chế độ: normal theo tầng (medium 17,6835, long 18,6116 —
  hết hiệu chuẩn yếu, n=5 mỗi tầng) + numberDense chung 9,0010
  (n=3, yếu), phát hiện bằng tỉ lệ chữ số ≥ 5% (tạm thời, khoảng
  trống quan sát 1,0% → 13,5%). Phương sai: câu ngắn 6 lần đo
  0,56s×4/0,64s×2 (spread 13,6%, nhiều khả năng lượng tử hóa 0,08s);
  câu dài spread 1,6–3,1%. Bridge expose X-TTS-* xác minh bằng TRÌNH
  DUYỆT THẬT ở origin :5173: 7/7 PASS (lượt FAIL preflight trước là
  lỗi harness, đã vá). Đính chính B3: `X-TTS-Chunks`/`Cloned` = null
  trên `/api/tts` là đúng (chỉ route clone mới set). Test mới 10/10,
  hồi quy A3/B3/relink/Z3 xanh. **TtsButton CHƯA chuyển sang helper
  C4** (test B3 khóa nối UI vào helper B3; chuyển đổi cần cập nhật
  assertion test B3) — hậu tố toast cho text số-dày vẫn sai xa
  (vd text M3 178 ký tự: B3 "(≈9.6–11.0s)" vs thực tế ~20s).
- **C5 GOP** (`PHASE9_ROUND47_C5_GOP_LIMITS.md`): tail-scan allowlist
  thêm `udta` (chỉ kiểm tra header + size, không kiểm tra payload);
  `mdat`/`moof`/chuỗi vỡ vẫn fallback, có test khóa từng cái. Hậu tố
  ngoài cửa sổ đuôi 16 MiB: QUYẾT GIỮ cửa sổ (free trailer 17 MiB
  đẩy moov bắt đầu trước `tailStart` 1.048.640 byte; cửa sổ cần để
  thấy moov là 17.825.856 byte > 16 MiB; T3 fallback an toàn).
  File trailing 37 MiB ENCODE THẬT (không pad): testsrc2 1280×720,
  30 fps, 72 s, `-g 30`, crf 18 — 38.996.431 byte, 2160 frame, 72
  GOP, moov cuối. Headed vite :5173 → bridge :8787 thật: 15/15 cổng
  pass (76 request, 0 GET toàn file; T3 trực tiếp: 2160 sample =
  ffprobe, 72 GOP). App UI mặc định BẬT GOP + click-test app thật
  4/4 (toggle TopBar `aria-pressed`, localStorage `"0"`/`"1"`).
  Fragmented đo lại: vẫn KHÔNG hỗ trợ (T3 fallback `demux-moov`,
  0 GOP). Test mới 11/11, hồi quy GOP đủ bộ xanh. Lưu ý: lần chạy
  harness đầu NOT-MEASURED vì cổng 5173/8787 đang bị luồng khác giữ
  nên chạy ở chế độ SHARED (dùng server đang chạy, không spawn/kill);
  lần chạy SHARED đầu 12/15 do bridge rate-limit 429 (120/phút, 2
  phase ~152 request/phút) — đã sửa bằng chờ 65 s + siết gate T3 +
  sửa parse ffprobe (csv → JSON), chạy lại 15/15. Trần 128 MiB /
  moov 16 MiB / gate U2 giữ nguyên.
- **C6 probe/compat** (`PHASE9_ROUND47_C6_PROBE_COMPAT_LIMITS.md`):
  seek qua vòng sync preview thật (project có clip + scrub qua
  timeline UI + asset HTTP): tối đa 369 mẫu, dropped 0, trần 1000
  KHÔNG chạm — vòng lặp tự abort sau 10 fail (~13 s/episode) nên
  bound lý thuyết < 780 mẫu; trần 1000 vẫn là lưới an toàn nhưng
  không phải giới hạn vận hành của đường sync. Cảnh báo phương pháp:
  entry k=0 chốt `completed` sau 263,6 ms với 0 mẫu nhưng frame đầu
  chỉ decode sau +24,9 s — artifact rAF-fallback của probe. Số mẫu
  đếm theo tick rAF (~3,7–60/s trong cùng phiên). Nguồn gốc 4 entry
  k=0–3 ĐÃ GHIM: `captureFrame` trong `thumbnails.ts` do filmstrip
  Timeline gọi (target = 0 vì duration webm MediaRecorder không hữu
  hạn). Compat app thật 13/13 PASS: đổi lang qua nút TopBar thật
  (ticks đóng băng 8 → 8), badge failed từ controller.failed thật
  bằng footage hỏng 64 KiB (lật sang `ELEMENT (decode WebCodecs
  lỗi)` trong ≤ ~1 s, nền amber). Bài học: lúc pause controller
  không bao giờ fail (phải PHÁT clip mới fail được). Badge từng
  track giữ nguyên 1 badge toàn cục. Hồi quy B5/B6/A6/Z6 xanh.
  Không đụng file `.ts` nào nên không chạy lại tsc (tiền lệ A5/B5).

## 2. Kiểm chứng gộp của parent (độc lập)

- Đối chiếu đĩa với hợp 6 danh sách LIMITS: đĩa có 27 file mới hơn
  mốc round47-baseline; hợp danh sách các luồng = 24 file; 3 file
  thừa đều mang marker đợt 47 C5 và đã xác minh nội dung:
  `gopRangeFetch39T3.ts` (comment đợt 47 C5, LIMITS C5 ghi "không
  đổi code"), `gopTail46B4.test.ts` (comment "Đợt 47 C5 ĐÃ ĐỔI quyết
  cho udta", test khóa đã sửa theo hành vi mới),
  `reverseWebcodecs.ts` (comment "Đợt 47 C5: trạng thái GOP để
  click-test app thật đọc được") — cả 3 đều đưa vào batch. 0 file lạ
  khác; không binary, không dist, không pycache.
- File chung nguyên vẹn: `store.ts` đủ marker generation counter
  (6 hit `projectGeneration`, logic chụp-thế-hệ/bỏ-set-stale/tăng-thế
  -hệ); `TopBar.tsx` đủ toggle GOP C5; `reversePlayback.ts` đủ
  marker mặc định BẬT + key localStorage C5; `tsconfig.json` đủ
  exclude `gopTail47C5.test.ts`. Lưu ý: `settle47C2.test.ts` và
  `ttsEstimate47C4.test.ts` không có dòng exclude trong tsconfig
  nhưng tsc vẫn 0 — hai file này được kiểm chứng bằng esbuild bundle
  + node chạy thật, không chỉ bằng tsc.
- Parent chạy lại: `tsc --noEmit` 0 lỗi; `vite build` pass (5,76 s,
  cảnh báo chunk >500 kB có sẵn). Test chạy lại bằng esbuild bundle
  `--format=esm` + `node --test` (từ repo root): settle47C2 24/24,
  ttsEstimate47C4 10/10, gopTail47C5 11/11, gopTail46B4 13/13,
  gopRangeFetch39T3 pass, gopTail45A4 pass, settle46B1 pass,
  settle45A1 pass, ttsEstimate45A3 pass, ttsEstimate46B3 pass,
  pause46B2/seekCap42X2/seekRecovery43Y2/seek pass,
  reverseBadge46B6/45A6 pass, reverseCompat44Z6 pass, B5 probe
  (`per-seek-probe-pool-cap-46b5.test.mjs`) pass — fail 0. Ba FAIL
  ban đầu (ttsEstimate46B3, reverseBadge46B6, reverseCompat44Z6) là
  lỗi cách chạy: test đọc file tương đối theo CWD (cần chạy từ repo
  root hoặc đặt REPO_ROOT), chạy lại từ repo root thì pass — cùng
  mẫu lỗi CWD như đợt 44 (Z6 8/10 giả), không phải hồi quy.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của các
  luồng, phép đo TTS WAV, click-test headed từng panel, phiên solo
  thật, đo IDB thật (chỉ đối chiếu LIMITS + test Node + tsc/build).
- Sửa của parent ở bước gộp: không sửa logic luồng nào; chỉ viết
  LIMITS tổng hợp này, file paths gộp và mục log. Lưu ý: luồng C4
  (và C3) đã tự ghi một mục log riêng vào build-loop-log.md /
  memory — mục này là mục tổng hợp của parent, không trùng lặp nội
  dung với mục C4.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round47-closing-debts46.txt`
  (28 file text, NUL-delimited, không binary, không dist, không
  pycache, đã verify read-back 28 entry + mọi file tồn tại) — gộp
  C1–C6 + LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 28 file paths / 1118
  entry (1090 đợt 22–46 + 28 đợt này; đợt 1–21 đã push xong).
  Entry đếm theo batch, file trùng giữa các batch tính nhiều lần
  như tiền lệ.

## 4. Nợ mở cho đợt 48

1. Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat (nợ gốc nhiều đợt).
2. Settle-drop: SUCCESS đường `asset:` vẫn mở (0/9 C2, 11/11
   PARTIAL cộng B1) — đợt sau không siết aim hay dời mốc W2 nữa;
   cần instrumentation tầng harness để tách đuôi feed/flush/drain
   của prefetch, và/hoặc một lượt trên máy quiet để xem gap có co
   về ~40 ms như B1 hay giữ nguyên; `decoded` trực tiếp của W2 vẫn
   không có.
3. LoadSample: hai `loadSample` chồng nhau thì lần 2 return ngay,
   không tự retry (chưa gặp trên UI thật); race chỉ đo trên Chromium
   headed dưới Xvfb, n = 1 mỗi chiều.
4. Pause: fail-fast seek-landing-0 headed vẫn thiếu (chỉ còn biến
   cờ/binary phiên Chrome Y2 gốc chưa loại trừ); quirk đáp sai frame
   khác 0 headed vẫn thiếu; kind `"error"` nên đổi hướng sang dữ
   liệu spec dị dạng thay vì săn tiếp fixture media; test mock Z2 về
   releaseElement vẫn ghi sai so với Chrome thật (cần sửa mock).
5. TTS: chuyển TtsButton sang helper C4 (1 import + 1 lời gọi +
   cập nhật assertion nối UI trong test B3) — nếu không, hậu tố
   toast cho text số-dày vẫn sai xa; numberDense yếu (n=3, ngưỡng
   5% tạm thời, chưa có mẫu gần ngưỡng); 11/25 giọng chưa đo
   (Thiền Tâm Đức, Thanh Bình, Ngọc Linh, Đoan Trang, Thục Đoan,
   Minh Triết, Mỹ Duyên, Quỳnh Anh, Đức Trí, Kim Thanh, Adam bựa);
   Safari/Firefox/máy thật chưa đo.
6. GOP: end-to-end trong app thật với file lớn ("mở file 37 MiB →
   phát ngược → thấy frame") vẫn chưa đo; key i18n cho toggle TopBar
   chưa làm; trần 128 MiB / moov 16 MiB / gate U2 giữ nguyên; file
   fragmented vẫn KHÔNG hỗ trợ (cần parser moof mới).
7. Probe: baseline quiet vẫn chờ; trần 1000 trên đường WebCodecs/
   Safari/máy thật chưa đo; mốc trung gian WEBCODECS → failed chưa
   ghi được (flip ≤ ~1 s, nhanh hơn chu kỳ poll); cơ chế "10 lần
   thử seek 20 timeout mà không gán currentTime" mới suy ra từ quan
   sát + code, chưa có test khóa; filmstrip không chạy trong lượt
   sync (artifact của seed).
8. Compat: Safari/Firefox/máy thật/màn hình vật lý vẫn CHƯA ĐO.
9. Chung: mọi số timing đợt 47 đều under-load (6 luồng song song
   + 2 lần chạy do restart), cấm dùng làm baseline quiet hay claim
   fps. Daemon restart giữa đợt là rủi ro vận hành: các luồng sau
   nên viết LIMITS + ghi kết quả từng phần sớm để restart không mất
   trắng báo cáo.
