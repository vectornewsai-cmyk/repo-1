# Phase 9 đợt 46 — LIMITS tổng hợp (đóng nợ đợt 45, 6 luồng, KHÔNG push)

Lượt cron 08:03 05/11/2026. Chốt chặn: `round-in-progress.md` KHÔNG tồn
tại → chạy bình thường. Trước đợt: 26 file paths / 1047 entry chờ push
(đợt 22–45; đợt 1–21 đã push xong chiều 29/10). Chủ đề lấy từ nợ mở
đợt 45 §4, trừ 2 nợ cần cửa sổ yên từ main chat (phiên solo A/B thật,
phiên quiet khóa cổng CPU) vẫn giữ làm nợ mở, không ép đóng.
KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 1. Nội dung 6 luồng

- **B1 settle** (`PHASE9_ROUND46_B1_SETTLE_LIMITS.md`): giả thuyết
  "tràn GOP lành" của Z1 là SAI cho W2 mốc 32,4667 s — cả hai đường:
  W2 hỏng thật fail (GOP 809,4 ms sau đúng delay 800 ms của range
  hỏng; asset 159,5–180,7 ms, latch failed=true); W2 `ok=true` của
  Z1 được diễn giải lại là nhiễm coalescing (prefetch cửa sổ 412 s
  đang bay, poll inFlight nhìn nhầm). SUCCESS đường `asset:` vẫn
  MỞ — 0/4 attempt (2 attempt không tới được W2, 2 attempt trượt
  sau W2 chỉ ~36–43 ms). Tab ẩn 300 s thật: SUCCESS (n = 1, đường
  GOP; timer 100 ms lúc ẩn 894,3 ms chỉ 1 mẫu, không claim clamp).
  Click-test thật vỏ UI `.vcut.json` qua ProjectMenu: 7/7 PASS.
  Không sửa production. Test mới 19/19, hồi quy A1 20/20, Z1 19/19.
  Phát hiện bug thật MỚI, KHÔNG sửa ở B1: race `loadSample` ghi đè
  project vừa mở (app mount gọi loadSample async ~10 s; mở file
  trong lúc đó thì lệnh `set` cuối revert project về mẫu, không báo
  gì; file trên đĩa không hề hấn). Cần đợt riêng với test cấp
  browser + vá theo hướng đếm thế hệ project (§6.2 LIMITS B1).
  Lưu ý: `decodeFrom=900` là suy ra từ stss + fail + luật GOP-align,
  không đọc trực tiếp được (đường fail không gán lastDecodeRange).
- **B2 pause** (`PHASE9_ROUND46_B2_PAUSE_LIMITS.md`): nối
  `WrongLandingTracker` của A2 vào `seek.ts` thật (marker Z2 giữ
  nguyên, thêm marker ROUND46-B2; đáp 0 có chủ ý reset streak; đáp
  sai frame khác 0 cũng đếm; fail lần sai thứ 3). Quyết định Seeker
  sync-throw: BỌC thành reject → kind `"error"` (đường đầu tiên tới
  error ở tầng Seeker; fixture media thật nào làm collectActives ném
  thì vẫn chưa có). 1 test Y2 khóa hành vi treo cũ đã sửa thành khóa
  hành vi mới. Test mới 11/11 (đỏ-trước 6/11 trên code cũ), hồi quy
  pause tổng 111/111. Lần đầu có bằng chứng vòng lặp preview đầy đủ
  trong app thật (scrub 1,5 cạn cap → phục hồi; scrub về lastDrawn 0
  → ngủ + cap reset). Fail-fast headed vẫn NOT_MEASURED dù fixture
  lần 2 đã byte-identical với Y2 (seek 2,5 trên broken-gap vẫn đáp
  đúng 2,5 — quirk vắng mặt trong điều kiện đó).
- **B3 TTS** (`PHASE9_ROUND46_B3_TTS_LIMITS.md`): 11 mẫu thật mới qua
  `tts.py` (WAV ở /tmp, ngoài repo), n tổng 5/5/3/3 cho 4 tầng
  (veryShort/short/medium/long); hệ số gộp 13,70 / 17,73 / 18,26 /
  19,23 ký tự/giây; cả 4 tầng gắn `calibrated: true` nhưng
  medium/long ghi rõ YẾU (mẫu mới chỉ n = 2, nhờ 1 mẫu Z3 cũ). Phát
  hiện: mẫu S2 (49 ký tự, Trúc Ly, 2,32 s, tỉ lệ 0,871) rơi NGOÀI
  khoảng phòng thủ A3 của tầng short — khoảng B3 mở cận dưới xuống
  0,8395×. `TtsButton` nay gọi helper B3 thật, không hardcode hệ số.
  Bridge sau restart expose đủ `X-TTS-*` (xác minh bằng curl + POST
  thật, chưa bằng trình duyệt ở origin :5173). Test mới 7/7, hồi
  quy A3 10/10 + relink 12/12 + Z3 9/9. Lib A3 cũ không sửa để hồi
  quy còn nguyên; `tsconfig.json` không cần đổi vì tsc sạch cả khi
  gồm test mới.
- **B4 GOP** (`PHASE9_ROUND46_B4_GOP_LIMITS.md`): headed qua vite
  :5173 → bridge :8787 thật + controller wiring 11/11 cổng cho file
  trailing 37 MiB (10 request, 0 GET toàn file; decode thật bằng
  VideoDecoder). Sửa tail-scan: chấp nhận moov + hậu tố
  free/skip/wide parse sạch tới EOF; hậu tố udta/mdat/moof/vỡ vẫn
  fallback. Moov trailing > 16 MiB: GIỮ TRẦN (test khóa 2 tầng).
  Fragmented: kết luận KHÔNG HỖ TRỢ (cần parser moof mới; đường cũ
  cũng không decode được nên là giới hạn preview chung). Gate U2 cho
  file trailing nhỏ: QUYẾT GIỮ NGUYÊN (tỉ lệ sample/file 0,9835 —
  GOP chỉ bớt 1,65%; wiring vẫn below-threshold nên đổi gate không
  cứu đường production nào). Trần 128 MiB giữ nguyên. Test mới 13/13,
  hồi quy GOP đủ bộ (A4 18/18, T3 10/10, Z4 19/19, Y4 10/10, X4 10/10,
  W4 15/15, V2 16/16, U2 20/20, Y6 11/11). Lưu ý harness: ô status
  HEAD 404 trong bảng CDP là artifact ghép responseReceived (đo trực
  tiếp và từ page đều HEAD 200); page/bundle tạm trong public/ đã
  xóa sạch sau chạy.
- **B5 probe** (`PHASE9_ROUND46_B5_PROBE_LIMITS.md`): trần 1000 GIỮ
  ĐÚNG trên element preview thật của MediaPool qua đường asset HTTP
  (entry treo 1000/27 dropped, seeking vẫn true lúc read; entry drip
  780/0 và 532/0 completed sau ~38 s seeking). Nuance: số mẫu đếm
  theo tick rAF trong lúc seeking (~14–21 mẫu/s dưới tải), không
  theo giây wall — "38 s ⇒ 1000 mẫu" KHÔNG phải quy luật; trần là
  lưới an toàn cho seek kẹt/kéo dài. Seek do harness gán trực tiếp
  lên pool element, KHÔNG qua vòng sync preview và KHÔNG qua timeline
  UI — đó vẫn là nợ. Sửa nhãn tại chỗ đủ 19 dòng trong 9 file cũ
  (bảng A5 giữ nguyên vẹn); sau sửa, grep "GOP thưa" chỉ trúng dòng
  mang marker 46-B5. Chain solo→Q6→N2 chạy lại CHAIN-OK (25 entry,
  validate 0; verdict N2 riêng PARTIAL under-load). Test mới 5/5,
  probe liên quan 30/30, Q6 protocol 4/4. Không đụng file `.ts` nào
  nên không chạy lại tsc (như tiền lệ A5).
- **B6 compat** (`PHASE9_ROUND46_B6_COMPAT_LIMITS.md`): thêm 2 key
  i18n `badgeElementFailed`/`titleElementFailed` (vi + en, parity
  968 = 968; Z6 cũ 966 + 2); nhánh element-failed nay dùng key riêng
  (kind thuần + nền amber không đổi). Bằng chứng headed mức HELPER
  trên Chromium thật 7/7 (display thật + dict thật + ghi DOM thật khi
  loop dừng; đổi lang lúc pause không tăng tick) — KHÔNG chứng minh
  wiring React qua nút TopBar trong app đầy đủ, cũng không chứng
  minh controller.failed thật từ footage hỏng. Badge từng track:
  KHÔNG claim tách — module `collectReverseTrackBadges` chứng minh
  render đơn hiện tại chỉ giữ track đầu, track failed vô hình; lý do
  chưa tách gọn: preview là một canvas đã composite, không có làn
  riêng từng track. Test mới 8/8, hồi quy A6 12/12, Z6 10/10. Lưu ý
  parent: số 968 là snapshot lúc B6 — đợt này không luồng nào khác
  thêm key nên số đứng; đợt sau nếu thêm key thì cập nhật đếm.

## 2. Kiểm chứng gộp của parent (độc lập)

- Đối chiếu baseline đầu đợt (`find -newer` so với
  round46-baseline.txt): đúng 42 file đổi/mới, khớp hợp 6 danh sách
  LIMITS (0 file lạ; không binary, không pycache; thư mục dist chỉ là
  output build, không stage). File chung nguyên vẹn: `seek.ts` đủ
  marker B2 (5) + Z2 (4); `gopTail45A4.ts` đủ hunk B4
  (`trailingSuffixValid`); `TtsButton.tsx` gọi helper B3 thật;
  `tsconfig.json` đủ 3 dòng exclude mới (B2, B4, B6); i18n leaf
  vi = en = 968 (top-level 40 = 40).
- Parent chạy lại: `tsc --noEmit` 0 lỗi, 0 dòng; `vite build` pass
  (5,08 s, chạy từ apps/web; lần đầu chạy từ repo root fail vì thiếu
  index.html — lỗi CWD của parent, không phải code). Test mới chạy
  lại bằng esbuild bundle `--format=esm`: B1 19/19, B2 11/11, B3 7/7,
  B4 13/13, B6 8/8, B5 5/5 — fail 0. Hồi quy chạy lại: A1 20/20, A2
  14/14, A3 10/10, A4 18/18, A6 12/12, Z6 10/10 — fail 0.
  KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của các
  luồng, phiên solo thật, đo IDB thật, click-test headed từng panel
  (chỉ đối chiếu LIMITS + test Node).
- Sửa của parent ở bước gộp: không sửa logic luồng nào; chỉ viết
  LIMITS tổng hợp này, file paths gộp và mục log.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round46-closing-debts45.txt`
  (43 file text, NUL-delimited, không binary, không dist, không
  pycache, đã verify read-back 43 entry + mọi file tồn tại) — gộp
  B1–B6 + LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 27 file paths / 1090
  entry (1047 đợt 22–45 + 43 đợt này; đợt 1–21 đã push xong).
  Entry đếm theo batch, file trùng giữa các batch tính nhiều lần
  như tiền lệ.

## 4. Nợ mở cho đợt 47

1. Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat (nợ gốc nhiều đợt).
2. Settle-drop: SUCCESS đường `asset:` vẫn mở (0/4; trượt sau W2
   ~40 ms) — đợt sau quyết định aim chặt hơn hay W2 chậm hơn, ghi rõ
   khi đổi biến đo; `decoded` trực tiếp của W2 vẫn không có.
3. Bug race `loadSample` ghi đè project vừa mở (B1 §6.2) — cần đợt
   riêng với test cấp browser + vá theo hướng đếm thế hệ project;
   click-test B1 đã phải chờ sample load xong để tránh cửa sổ race.
4. Pause: fail-fast seek-landing-0 headed vẫn thiếu (fixture Y2
   byte-identical vẫn đáp đúng — cần harness tab-mới kiểu probe243
   hoặc fixture đáp sai ổn định khác); quirk đáp sai frame khác 0
   headed cũng thiếu; kind `"error"` từ fixture media thật vẫn chưa
   có; chênh lệch mock vs Chrome thật về releaseElement vẫn đứng.
5. TTS: medium/long hiệu chuẩn YẾU (mẫu mới n = 2); 19/25 giọng preset
   chưa đo; text nhiều số/tên riêng/dấu câu dày chưa đo; phương sai
   giữa các lần chạy mới quan sát 1 cặp (~14% câu ngắn); bridge
   expose chưa xác minh bằng trình duyệt ở origin :5173.
6. GOP: moov + hậu tố udta sau moov; hậu tố ngoài cửa sổ đuôi 16 MiB;
   file fragmented (cần parser moof mới); file trailing 37 MiB encode
   thật (không pad); app UI mặc định bật GOP + click-test app thật;
   3 điều kiện đợt 42 cho trần 128 MiB vẫn chưa có bằng chứng mới.
7. Probe: seek chậm do vòng sync preview tự lái (project có clip +
   scrub qua timeline UI với asset HTTP) vẫn chưa đo; baseline quiet
   vẫn chờ; Safari/máy thật/footage B-frame/đường WebCodecs cho trần
   1000 chưa đo; nguồn gốc 4 entry k=0–3 của app chưa ghim.
8. Compat: wiring effect qua nút đổi lang TopBar trong app thật;
   badge failed từ controller failed thật (footage hỏng) trong app
   thật; badge từng track vẫn là 1 badge toàn cục; Safari/Firefox/
   máy thật/màn hình vật lý vẫn CHƯA ĐO.
9. Chung: mọi số timing đợt 46 đều under-load (6 luồng song song),
   cấm dùng làm baseline quiet hay claim fps.
