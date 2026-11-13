# Phase 9 — Đợt 103: Đóng nợ LIMITS gộp đợt 102 §4 (G1 lần yên quyết định, 2 MiB probe byte, ghost F8, zombie tick, re-arm nested, blur r7, EPERM #22, harness D6 recheck) + kiểm chứng độc lập E9

> Ngày: 13/11/2026. Lượt cron 12:35 +07. 9 luồng E1–E9 spawn song song;
> **8/8 luồng E1–E8 về đủ** (LIMITS + log + batch stage), **E9 kiểm chứng
> độc lập XONG** (poll 05:40–07:08Z, verify 07:09–07:20Z, boot đổi
> 9576eac3 → 8c1c5131 do reboot #28 lúc 06:56:44Z giữa đợt). Đợt thứ hai
> liên tiếp 8/8 về đủ trong một lượt. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### E1 — G1: LẦN YÊN QUYẾT ĐỊNH ĐÃ TỚI — VÀ PASS (nợ §4 mục 1)

- **Lần yên quyết định mà D8 chờ đã tới — và nó PASS dưới cả hai
  metric:** E1 run1 (yên, baseline 23,19 fps): **G5 0,91× PASS, M2
  0,91× PASS**. Khung tích lũy (c) nay là **24–25/30 = 80,0%–83,3%**
  — **kịch bản xấu nhất (I5-1 FAIL) đạt đúng mốc 80,0%** (trước đây
  23–24/29, cắt ngang mốc). Đây là lần đầu tiên khung tích lũy đứng
  ĐÚNG mốc ngay cả trong kịch bản xấu nhất. Caveat: đúng mốc nghĩa là
  không có đệm — 1 lần yên FAIL nữa sẽ kéo kịch bản xấu xuống 24/31 =
  77,4%.
- **Các khung chân yên 30fps dưới M2:** (a) cố định 20 lần đầu tối đa
  **15/20** (trần cứng, KHÔNG đạt); (b) trượt 20 lần mới nhất **19/20**
  (ĐÃ ĐẠT, đệm 4 lần FAIL liên tiếp); (c) tích lũy **24–25/30**
  (kịch bản xấu đúng mốc); (d) chỉ lần tính-lại-được 24/26 (lệch chọn
  mẫu); (e) yên sạch 22/24; (f) trượt 10 lần mới nhất **10/10**; (g)
  kỷ nguyên hậu-A9 **12/12**; (h) nhạy biên phân loại **không kiểm
  được** (0 lần biên 9–10 fps); (i) biên an toàn khung (b): chịu được
  **4 lần yên FAIL liên tiếp** (tăng từ 3 ở D8).
- **0 lần bất đồng mới:** 14/14 lần E1 đều đồng thuận G5/M2. Đồng thuận
  toàn lịch sử nay **126/132 (95,5%)**, vẫn đúng 6 lần bất đồng cũ
  của A9, 0 lần FAIL→PASS. Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ
  RỘNG: nay **66 lần, 0 lần lật** (D8: 58 lần).
- Chân yên 30fps dưới G5: n=30, PASS 26/30 (87%), median 0,945; chân
  yên 60fps: **21/21 PASS (100%)** dưới CẢ HAI metric. Pool v13:
  30fps n=100 (PASS 91), 60fps n=64 (PASS 61).
- **G4 flake lần đầu tiên trong lịch sử G1** (E1 run8, harness 9/10:
  tap deint không áp lên clip progressive ở bước G4, R vẫn thỏa 0,48
  < 0,8) — G5/M2 của run8 vẫn dùng được (FPS đo độc lập với G4).
  Cần theo dõi, nếu lặp lại thì điều tra thời gian áp enhance sau
  toggle dưới tải.
- Cửa sổ yên đợt 103 ngắn nhất trong 4 đợt gần đây (chỉ 1/9 lần E1
  yên, mở đúng phút đầu rồi đóng; load tới 16,73) do 8–10 luồng chạy
  song song.

### E2 — 2 MiB: CHỨNG MINH BẰNG NỘI DUNG BYTE — SPLICE TRONG ADAPTER webkitwebsrc (nợ §4 mục 2)

- **Điểm nối hẹp nhất nay là adapter `webkitwebsrc` ở chế độ pull
  (create() / take_buffer), không còn là "blob→qtdemux" chung
  chung:** mọi pull bị splice của qtdemux đều có một pull của typefind
  trả về byte Y HỆT tại cùng mili-giây (**26/26 pull spliced trùng
  khớp**) — typefind chỉ proxy trung thực cái nó nhận từ upstream.
- **Cấu trúc splice đo được chính xác tới từng byte (mới):** luồng byte
  qtdemux nhận là `[file 0..3179] ++ [file 2.097.152+3179 .. EOF] ++
  [file 42.821..]` — MỘT đoạn sai duy nhất, dài đúng **39.642 byte**,
  là ĐUÔI FILE từ 2 MiB+3179 tới EOF, chèn giữa byte đầu đúng và byte
  tiếp đúng. Điểm nối nằm TRONG buffer thứ hai của sample data, tại
  đúng biên EOF của file (offset 1155 trong buffer).
- **Splice là lệch +2 MiB thuần túy, không phải rác ngẫu nhiên:**
  2.640 mẫu byte đã phân loại (đầu + giữa + cuối buffer, 14 run):
  **0 mẫu OTHER** — mọi mẫu đều khớp đúng file tại offset yêu cầu,
  hoặc khớp đúng file tại offset+2 MiB. Đếm lại độc lập (E9):
  **1.728 pull** (qtdemux0 353, qtdemux1 66, qtdemux2 487, typefind
  822), 0 OTHER.
- **Đường PUSH hoàn toàn sạch (mới):** 2.280 buffer webkitwebsrc→
  typefind→queue đã kiểm: 0 buffer có 16 byte đầu không thấy trong
  file. Byte ĐI VÀO webkitwebsrc luôn đúng — sai chỉ xuất hiện khi
  ĐỌC RA ở chế độ pull.
- **Ức chế bởi logging TRACE được xác nhận lại trên cùng boot, cùng
  lượt, cùng probe+shim:** nhẹ (E2L+E2W) **10/10 run bogus** vs TRACE
  (E2T) **0/4 bogus**, Fisher một phía **p = 0,0010** (E9 tính lại
  khớp). Gộp với D1/C1: nhẹ 26/28 vs TRACE 0/8, **p = 1,5e-06**
  (E9 tính lại 1,487e-06). Bản thân shim byte-probe KHÔNG ức chế
  bogus (10/10 với shim, so với 16/18 của D1 không shim).
- **Vì sao đúng 2.097.152 VẪN MỞ:** 0 stop/restart thật trong cả 14
  run E2 (gộp D1: 0 trong 36 run); 0 seek/Range nào tới 2097152 (25
  base Range khác nhau); đoạn sai bắt đầu đúng tại 2 MiB+3179 nhưng
  chưa có bằng chứng nào nối con số này với LOW threshold ngoài sự
  trùng hợp. Cơ chế tạo ra đoạn sai trong adapter (dataReceived nào,
  refill nào) vẫn chưa quan sát trực tiếp được — cần TRACE
  dataReceived trong một run bogus, mà TRACE lại ức chế bogus
  (catch-22 đã biết từ D1).

### E3 — Ghost F8 relabel: CƠ CHẾ ĐÚNG, ĐỘ PHỦ THIẾU → KHÔNG LAND (nợ §4 mục 3)

- **Cơ chế F8 ĐÚNG và MẠNH khi anchor tươi:** snapshot gắn nhãn từ tap
  tươi đạt **78–92% clean** (B: 85,7%, B2: 78,1%, flip: 91,9%);
  presented tươi [0,50ms) chính xác **80,8–87,8%** (D2 đo 69–78% ở
  cùng dải — gate 50ms siết đúng chỗ).
- **Nhưng headline clean KHÔNG đạt bar:** case B 49,5% (B) / 58,1%
  (B2) so với baseline 41,9% / 42,1% — dưới bar đăng ký trước (≥70%
  và hơn baseline ≥20 điểm). Gộp mọi run F8: 62,9% vs baseline 44,1%
  (+18,8pt) — vẫn trượt cả hai ngưỡng.
- **Nguyên nhân là ĐỘ PHỦ, không phải cơ chế:** anchor tươi (≤50ms)
  chỉ phủ 34% tick ở run B (tải nặng, tuổi anchor trung vị 87,6ms) →
  74% ở B2 → 97% hậu flip ở run C. Clean tăng đơn điệu theo độ phủ:
  49,5% → 58,1% → 89,5%. Snapshot rơi về nhãn frameIdx chỉ 25–27%
  clean (tệ hơn cả baseline — đó là tập tick khó: stall/seek/tải, đã
  chọn lọc âm).
- **Flip-protocol thì ĐẠT bar với biên lớn:** clean hậu flip+2000ms
  **89,5%** (68/76) vs baseline flip cùng cây 47,9% (+41,6pt); gap
  presented−expected |≤3| đạt **100% ở mọi cửa sổ**, seek nào gap
  cũng = 1. Nhưng bar yêu cầu CẢ case B nên không đủ để land.
- **Production đã REVERT hoàn toàn** (0 marker E3; `presentedFrameIndex`
  về đúng bản gốc; `previewEngine.ts` không hề chạm). E9 xác minh độc
  lập trên cây cuối: marker E3 = 0 — biến mất là kỳ vọng, không phải
  va chạm gộp.
- **Phát hiện phương pháp (mới): spread median là artifact** của phân
  bố lưỡng đỉnh (10 nhóm chặt + 11 nhóm lỏng; median lật chỉ vì 1
  nhóm đổi phía) — từ nay báo PHÂN BỐ spread, không báo median đơn
  độc. Hướng mới: **F8b — nhãn bằng frame anchor THÔ khi anchor cũ**
  (CHƯA thử) + F6' pixel-verified skipLatest cho WebKit (chỉ phác).

### E4 — Zombie tick stale-frame: FIX v2 ĐÃ LAND (nợ §4 mục 4)

- **Đường tick vẽ 1 frame stale ở tick đầu sau nhảy ĐÃ FIX (v2):**
  gate mở rộng — skip render ở tick mà element video xuôi lệch target
  mà seek không phát (`!decision.seek && decision.overCount >= 1`),
  bao cả tick xác nhận đầu lẫn tick bị grace giữ. Fix v1 (chỉ tick
  xác nhận đầu) CHƯA ĐỦ: draws stale 2/23 (k=3 +101ms, k=23 +290ms)
  — cơ chế lọt: grace giữ overCount ở confirmTicks−1 → seek bị hoãn
  nhiều tick liền trong khi element vẫn lệch target 2,42 s.
- **Kết quả đo v2 (preview.tsx `4e954101`):** tick stale **0/21**,
  draws stale **0/46** (E9 đếm lại: draws-check y1/y2 đều
  `examined=23 stale=0`); skip-clip-inactive = 0 cả 2 lượt; pixel
  parity đứng (clip lẻ C 91–100%, D = 0, out = 0). Zombie Δ = 0 mọi
  biên.
- **Độ trễ owner-kill trực tiếp ĐÃ ĐO (lần đầu):** production ghi
  `performance.now()` tại điểm kill; e4y1 median **0,20 ms** (max
  2,40, n=12), e4y2 median **0,10 ms** (max 6,20, n=12) — nhanh hơn
  C5 gián tiếp qua check A6 (23–123 ms) ~100–600×. Khe early-return
  đã đóng ở mức đo trực tiếp.
- **Giới hạn còn lại của fix v2:** gate (b) có thể kéo dài tới trần
  grace 5000 ms trong trường hợp xấu nhất — canvas đóng băng (giữ
  frame trước nhảy) thay vì vẽ frame sai; đo thực tế ~300–500 ms và
  1 đợt stall 3,1 s ở e4y1 clip 18 (playhead cũng bị giữ, không lệch
  A/V). Chưa có trần skip.
- Test mới `driftConfirmSkip103E4.test.ts` **12/12 PASS** (đã thêm vào
  tsconfig exclude; E9 chạy lại trên cây gộp cuối: 12/12 xanh).

### E5 — Re-arm fail-open nested: FIX ĐÃ LAND (nợ §4 mục 5)

- **Fail-open nested là rủi ro THẬT, đã đo được:** pre-fix, trên
  project nested thật (clip bóng bọc trong 1 nested clip), drift-gate
  **không chặn lần nào trong 8 lượt (0 lần)**, trong khi đuôi vẫn mở
  + luật burst-rate vẫn chặn (8 lần). **7 lần đuôi đóng ADV2 khi
  drift vượt / 8 lượt, 2 f4-like (1 kèm kẹt seek ~2,5 s)** — đúng
  chuỗi lỗi f4 mà C3 đã đóng trên clip phẳng.
- **FIX ĐÃ LAND (tối thiểu, preview.tsx):** bước đuôi nay dùng **spec
  phẳng của tick trước** (đã kiểm identity với spec gốc hiện tại)
  thay vì spec gốc thô — lá nested chỉ tồn tại ở spec phẳng nên helper
  mới tìm được clip. Không đổi luật gate, không đổi lib
  (`playheadHold90R2.ts` md5 `00cce1ac` không đổi).
- **Sau fix, nested ĐÃ ĐÓNG fail-open:** gate chặn **42 lần / 8
  lượt**, đóng ADV2 khi drift vượt **7 → 0**, f4-like **2 → 0**.
- **Phẳng không hồi quy về luật:** gate vẫn chặn (87 lần / 12 lượt +
  34 lần / 4 lượt xác nhận), **0 lần đóng ADV2 khi drift vượt** sau
  fix. Nhưng **tỉ lệ đóng-trần (CAP) + resync sau trên phẳng load4
  TĂNG MẠNH so với mẫu pre-fix** (20 ca mang nhãn f4-like của
  analyzer / 9 lượt load4 post-fix, so với 0 / 6 lượt load4 pre-fix)
  — TẤT CẢ 20 ca đã kiểm tay đều là **đóng do TRẦN 5000 ms** (tuổi
  5001–5313 ms), không ca nào là đóng ADV2. Đây là **đánh đổi đã ghi
  rõ của C3**, không phải gate thất bại — NHƯNG nguyên nhân khiến
  decoder đóng băng lâu hơn (2,1–3,4 s so với 0,8–1,1 s pre-fix)
  **CHƯA XÁC ĐỊNH ĐƯỢC**. Không được trích "f4-like 0/12" cho phẳng
  mà không kèm phân tích này.
- **Drift-gate C3 còn nguyên trên phẳng:** baseline 12 lượt j1–j12:
  f4-like 0 (theo nhãn analyzer), gate 53 lần, burst 16 lần, 0 seek
  kẹt theo nghĩa ADV2. Tuổi đuôi trung vị (velocityTicks): j 2102 ms
  vs h 1509 ms vs i 2400 ms — khác phiên đo, cùng code gate, không
  kết luận hồi quy (theo đúng D6 §4).
- **D6-A vẫn bị bác, có thêm bằng chứng:** 0/21 đuôi phẳng post-fix +
  0/10 đuôi nested post-fix đạt đủ 3 tiêu chí ổn định-lệch.
  **KHÔNG thử lại D6-A. KHÔNG hạ trần 5000 → 3000 ms.**
- **Reboot #28 giữa đợt:** giết probe confirm s2 đang chạy của E5
  (06:56:44Z); E5 chạy lại s1 sau reboot (vẫn crash do RAM ~1,5 GB —
  lỗi môi trường WebKit "Target crashed", không phải sản phẩm) rồi
  viết LIMITS + stage — vẫn về đủ 8/8.

### E6 — Blur parity: r7 VẪN MỞ, strip-confirm KHÔNG chốt được (nợ §4 mục 6)

- **r7 VẪN MỞ — strip-confirm KHÔNG chốt được nội dung gap 2 cho bất
  kỳ ca nào trong cụm A.** Trên 13 ca A (D4 11 + E6 mới 2): **0/13**
  strip xác nhận nội dung gap 2; **2/13 bác thẳng gap 2** (ghost strip
  khớp pres−6, loại pres−2 với h=24); **3/13 bác cả gap 2 lẫn gap 6**;
  **7/13 mơ hồ hoàn toàn** (strip(pres−6) == strip(pres−2)); 1/13
  ngoài tầm tham chiếu. Đối chứng B-band: 6/7 khớp gap 6 đúng như kỳ
  vọng — phương pháp không hỏng, nó chỉ không phân giải được cụm A.
- **Phát hiện mới (giới hạn cứng của strip 48-bit):** strip hàng giữa
  chỉ có **4 mẫu phân biệt trên 90 frame** (hamming chỉ nhận 0/24/48)
  — nó đo pha cuộn (chu kỳ ~5 frame), không bao giờ pin được 1 frame
  chính xác. Mọi verdict strip trước đây dùng tiêu chí "singleton
  span-3" phải đọc lại theo nghĩa này (C4 §4 đã cảnh báo alias ±5k;
  nay đo được mức suy biến đầy đủ: mỗi strip khớp ~22/90 frame).
- **Đính chính suy luận D4 §1.2:** 11 ca A có ringSize=3, pool=2 →
  **KHÔNG có pad-clone** (pad chỉ khi pool < frames−1 = 2) nên "khớp
  dự đoán pad-triple gap-2 (0,449)" là sai đối tượng. Số 0,449 cũng là
  dự đoán của triple liên tiếp khỏe mạnh {−2,−1,0} — và liệt kê strip+g
  cho thấy **9/13 ca A chỉ khớp triple liên tiếp** (pred 0,449),
  không khớp bất kỳ bộ nào có gap 2 hay gap 6 (với current = pres).
  Giả thuyết "nhãn gap 6 / nội dung gap 2" không còn là suy luận duy
  nhất cho cụm A.
- **D floor post-fix gộp: 0/1640** (C4 0/867 + D4 0/566 + E6 0/207;
  Fisher p=1,43e-09 so với pre-fix 28/1547; 95% CI trên 0,183% — E9
  tính lại khớp từng chữ số).
- **B-band pair-like:** gộp post-fix n=437, pair-like 50/437 (11,4%).
  Tín hiệu ringSize=1 đã chết hẳn (Fisher p=1,0); gợi ý gap>2 đợt
  trước biến mất khi thêm dữ liệu E6 (p=0,177). Mẫu hình duy nhất còn
  đứng sau hiệu chỉnh: **clip c0 giàu pair-like hơn c2** (17,1% vs
  6,1%, Fisher p=0,0042, OR 3,15 — tìm post-hoc, cần kiểm chứng đăng
  ký trước).
- **Cửa sổ mù wk KHÔNG thu hẹp được** (vẫn theo D4, không chạy blind
  probe): ước lượng state100 E6: c1 1861–3129ms, c2 ~303–304ms (≈0 sau
  bias +180ms). Giữ nguyên kết luận A5.
- **ENOSPC vite** (hết inotify watchers khi nhiều luồng cùng chạy vite
  dev — giới hạn 63747, không nâng được): 4/4 lượt driver đầu fail,
  chạy lại sau khi watcher giải phóng thì 4/4 pass. Không phải lỗi
  probe hay production.

### E7 — EPERM probe #22 + khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN (nợ §4 mục 7)

- **Probe #22: ok=2 fail=0** — checklist P8 §2.3 đúng 1 lần: status
  05:40:20Z DEAD/STALE (age 10.848s, exit 1) → once 05:40:24Z probe
  #22, boot 9576eac3, ok=2 fail=0, exit 0 → status lại ALIVE (n=22,
  age 6s). Log probe v2 55 → 58 dòng.
- **Reboot #27: 05:26:18Z (chính xác từng giây)** — 249407b6 →
  9576eac3. Khoảng cách #26 → #27 = **3h14'08" — DÀI NHẤT từng ghi**
  (vượt 3h04'35" của #22 → #23). Chu kỳ nay 27 lần / ~57h08' ≈
  2h07'/lần. **Reboot #28 tiếp theo lúc 06:56:44Z** (giữa đợt 103,
  E9 ghi — xem E9 §4).
- **Khoảng mù #21: 02:39:32Z → 05:40:24Z (3h00'52") — CHƯA ĐÓNG HOÀN
  TOÀN.** Reboot #27 đã chốt giờ từng giây, nhưng đuôi mù không-bản-
  ghi dài **1h45'25"** (kỷ lục — đuôi mù #20 chỉ 52'05") để lại một
  **lỗ ~17'23" (03:57:19Z–04:14:42Z) mà một reboot trung gian CÓ THỂ
  ẩn** (cả hai khoảng cách đều nằm trong dải quan sát). Tối đa 1
  reboot trung gian có thể ẩn (2 reboot cần tổng ≥2h23'12" >
  1h28'59" của đoạn trước #27). Đây là khoảng mù đầu tiên kể từ #8
  không đóng được hoàn toàn bằng lập luận sàn khoảng cách.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0
  "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật; 19 dòng "đã
  tắt" (D6 ×17 + D7 O8 ×2) đều là **dương tính giả đã biết**. Sóng
  gần nhất vẫn ~11:55–12:11Z (R7), ~41h29' trước probe #22. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 443 dòng / 138 file** (phạm vi
  2676 file); R7b đối chiếu 468 dòng / 155 file; copies 25 dòng / 17
  file; đối chiếu chéo 443+25=468=R7b, **chênh 0 — lần thứ chín liên
  tiếp**. +12 dòng / +6 file so với D5, giải thích đúng hết bằng diff.
- RAM 5 mẫu 1050/2535/2447/1314/1083 MB (max ~2,48 GB = 41% ngưỡng
  guard) — birefnet KHÔNG chạy. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.

### E8 — Harness: D6 recheck KHỚP + mơ hồ N10 fallback ĐÃ TRIỆT + O8 (nợ §4 mục 8)

- **D6 recheck: KHỚP HOÀN TOÀN.** Chạy lại đúng 2 script quantify của
  D6 trên cùng dữ liệu 24 đuôi → output giống D6 từng byte. Tính lại
  độc lập bằng code viết mới (max−min counter thay vì cộng dồn) →
  khớp D6 trên cả 24 đuôi, từng cột số. **0/24 đuôi đạt tiêu chí ổn
  định-lệch — kết luận D6 đứng; D6-A vẫn bị bác.** E9 chạy lại độc
  lập lần nữa: diff rỗng cả hai script — nợ này nay ĐÃ ĐÓNG hoàn
  toàn.
- **Mơ hồ N10 fallback lần 2 ĐÃ TRIỆT.** Chạy lại fault N10 fallback
  với DELAY=20000: fallback #1 setState lật sau 88ms (05:50:35.833Z);
  redispatch #1 hẹn ≈05:50:44.94 — tức ~9,1 giây SAU lần lật, và đã
  bị cleanup hủy lúc 05:50:35.838Z trước khi tới hẹn. Lần lật này chỉ
  có thể là setState, không thể là redispatch.
- **Keydown chậm tự nhiên: KHÔNG quan sát được — VẪN MỞ.** E8 chạy
  thêm N10 thường ×2 + E1 thường ×1 (44 slot, 88 toggle, wait chậm
  nhất 583ms — còn thấp hơn timeout 5000ms tới 8,6 lần), 0 retry, 0
  fallback. Gộp toàn bộ quan sát tự nhiên từng có (22 lần chạy, 319
  slot, 638 toggle): wait chậm nhất 804ms, 0 retry, 0 fallback.
- **O8 21/21 cả 2 engine, khớp D7/C9 từng chữ số:** Chromium S5
  Δx=0,112; S7 mask 0,112 / bóng 0,113; WebKit S5 Δx=0,194; S7 mask
  0,194 / bóng 0,197. Fixture md5 khớp đợt 101/102. 0 retry trong đo
  S5/S7. E0 0 lỗi cả 2 engine. (Chromium lần 1 exit=2 do E8 quên copy
  fixture — lỗi setup harness, chạy lại sạch.)
- **0 abort vẫn giữ:** 1 lần fault hoàn thành đợt này (11 slot, 22
  toggle, 1 fallback cứu thật), 0 toggle abort; gộp D7: 5 lần fault,
  55 slot, 110 toggle, 2 retry + 3 fallback cứu thật, 0 abort.
  Harness md5 không đổi một byte so với D7 đã land (E1 `4ba1d86c…`,
  N10 `9ca985cd…`).

### E9 — Kiểm chứng độc lập: XONG (8/8 về đủ, cây gộp xanh)

- Poll đĩa 05:40–07:08Z: 0/8 → 1/8 (E7) → 2/8 (E8) → 3/8 (E2) →
  5/8 (E1, E6) → 5/8 → 7/8 (E3, E4) → **reboot #28 06:56:44Z làm
  gián đoạn poller** → 07:08Z **8/8 ALL LANDED** (E5 về muộn sau
  reboot). Cây gộp đóng băng 07:09:10Z, preview.tsx `c2251e39`.
- Verify cây gộp: tsc web 0, desktop 0; vite build PASS 7,80s;
  **27/27 mục suite exit 0 ngay lần đầu** (Hold 75/75, Pacing 19/19,
  previewEngine 18+27, seek 21/21, seekSkip 9/9, previewLoop 20/20,
  ghostBlend 15/15, rvfcClipWindow102D3 13+21 (mới đếm đúng — D9 ghi
  21 là shorthand), driftConfirmSkip103E4 12/12 (mới), css60/61
  60/60, P7 8/8, orphans 17/17, r6 dict 2767, U4 141/141, media 3/3,
  retry 7/7, watchdog 9/9, deint-verdict 17/17, 100b7 13/13, armHeld
  16/16, vite-regex 9/9, xvfb-lock PASS, test-preview-engine.sh 354
  assertions); O8 **21/21 cả 2 engine ngay lần đầu** (Chromium S5
  Δx=0,112; WebKit S5 Δx=0,194) trên cây gộp cuối đã có fix E4+E5.
- Đối chiếu headline 8/8 KHỚP với dữ liệu thô trên đĩa (đếm lại trực
  tiếp + tính lại Fisher: E2 gộp p=1,5e-06 khớp từng chữ; E6 D floor
  p=1,43e-09 khớp từng chữ; E5 tổng gộp n/j/p/k khớp; E7 log 58 dòng
  + heartbeat n=22 khớp; E8 quantify diff rỗng + O8 khớp; E1 pool
  v13 + khung M2 khớp từ JSON gộp). Chi tiết:
  `docs/PHASE9_ROUND103_E9_VERIFY_LIMITS.md`; log:
  `hidden_files/round103-e9/` (poll.log, round103-e9-suites.log,
  round103-e9-o8.log).

## 2. Ghi chú gộp

- **Đợt này không cần parent gộp thay:** E9 tự poll + verify + viết
  LIMITS gộp (vai trò D9 đợt 102; 8/8 về đủ nên không có luồng nào
  thành nợ vì chưa xong — E5 về muộn sau reboot vẫn được gộp đầy
  đủ).
- **Va chạm gộp — preview.tsx:** 3 luồng cùng sửa (E3 thử F8 rồi
  revert + E4 land fix v2 + E5 land nested fix). Trên đĩa lúc đóng
  băng: marker E3 ×0 (revert hoàn toàn, đúng thiết kế — KHÔNG phải
  mất code), E4 29 dòng / 40 lần xuất hiện (đủ 6 điểm), E5 9 dòng,
  D3 14 lần xuất hiện (khớp D9), C4 13 lần xuất hiện (khớp D9), C3 12
  dòng. Thứ tự md5: `ed260e62` → `0209d29c` → `110a51b9` →
  `03fab95d` → `4e954101` → `c2251e39` (ổn định từ 06:38Z).
  Thay đổi production có logic mới đợt này (đúng 2): fix zombie tick
  của E4 và fix fail-open nested của E5.
- **Đính chính đếm test rvfcClipWindow102D3:** file in 2 dòng tổng
  (13 + 21 = 34 test), D9 ghi "21/21" là shorthand lấy dòng cuối —
  số đúng để trích từ nay là **13 + 21**.
- **Đính chính mốc thời gian E5 §7:** "Boot 9576eac3 suốt đợt, không
  reboot" đúng cho cửa sổ đo của E5, nhưng **reboot #28 lúc
  06:56:44Z xảy ra trong đợt 103** (giết probe s2 của E5; E5 chạy
  lại s1 sau reboot rồi mới viết LIMITS).
- **Tham chiếu chéo cũ trong E6 §7.5:** vẫn liệt kê nợ 2 MiB là "chỉ
  còn probe ghi nội dung byte" — bước này đã được E2 làm xong trong
  chính đợt 103 (E6 viết trước khi E2 hạ cánh).
- **Reboot #28 là reboot đầu tiên xảy ra GIỮA một đợt mà poller bị
  gián đoạn theo:** runtime restart đi kèm reboot; poller gốc mất kết
  quả cuối nhưng file stage trên đĩa còn nguyên, E9 khởi động lại
  poller và vẫn đủ 8/8. Bài học: đừng kết luận missing từ việc poller
  chết — kiểm tra đĩa trước.
- **RAM cuối đợt xuống rất thấp (~690 MB lúc 07:08Z):** E5 gặp WebKit
  "Target crashed" ở RAM ~1,5 GB. Verify sau nên ghi RAM lúc đóng
  băng.

## 3. Kiểm chứng (cây đã gộp, E9)

- tsc web 0, desktop 0; vite build PASS (7,80s); r6-i18n-check PASS
  (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61
  60/60; playheadPacing 19/19; playheadHold 75/75; previewEngine
  18+27; rvfcClipWindow102D3 13+21; driftConfirmSkip103E4 12/12 (mới);
  test-preview-engine.sh **354 assertions pass**; U4 failfast 141/141;
  O8 21/21 cả 2 engine ngay lần đầu (S5 Δx chr 0,112 / wk 0,194; S7
  chr 0,112/0,113, wk 0,194/0,197); E0 0 lỗi cả 2 engine.
- Verify trên boot `8c1c5131` (sau reboot #28); không reboot trong lúc
  verify (suites 07:09:59–07:14:46Z, O8 07:18:32–07:20:32Z).

## 4. Nợ mở cho đợt 104

1. G1 đóng hay chưa — user quyết (metric G5 hay M2; E1 thêm Q5 mới:
   mốc 80,0% đúng chóc của khung (c) có đủ không, hay cần đệm — 1 lần
   yên FAIL nữa kéo kịch bản xấu xuống 24/31 = 77,4%; đợt 104 nên đo
   E1 đầu lượt để bắt cửa sổ yên).
2. 2 MiB — điểm nối hẹp nhất nay là adapter `webkitwebsrc` pull
   (E2); bước còn lại: probe ghi `dataReceived`/refill nào tạo đoạn
   sai (cần shim LD_PRELOAD như E2 đã chặn pull_range — TRACE ghi
   được thì ức chế bogus, catch-22). Vì sao đúng 2.097.152 vẫn mở
   (trùng LOW threshold nhưng 0 stop/restart trong 36 run gộp).
3. Ghost residual — F8 không land; hướng còn đứng: F8b nhãn bằng frame
   anchor THÔ khi anchor cũ (CHƯA thử) + siết ngưỡng tươi anchor
   500ms → ~50ms (đã đo: gate 50ms giữ anchor đúng 81–88%) + F6'
   pixel-verified skipLatest cho WebKit (chỉ phác). Quy ước mới: báo
   PHÂN BỐ spread, không báo median. Mọi kết luận nhân quả chỉ đo
   trên Chromium.
4. Zombie pump — khe early-return (D3) + đường tick vẽ (E4) ĐÃ ĐÓNG;
   nợ mới: gate (b) có thể giữ canvas đóng băng tới trần grace 5000
   ms nếu playhead không bị giữ (chưa quan sát được); chưa có trần
   skip. Độ trễ owner-kill trực tiếp đã đo (trung vị 0,10–0,20 ms).
5. Re-arm — fail-open nested ĐÃ ĐÓNG (E5); D6-A vẫn bị bác (0/24 D6 +
   0/21 phẳng + 0/10 nested post-fix); hạ trần 5000 → 3000 ms không
   làm; **NỢ MỚI: tỉ lệ đóng-trần phẳng load4 tăng post-fix** (20 ca
   / 9 lượt, tuổi đuôi trung vị 2102 → 5013 ms; nguyên nhân chưa xác
   định — đợt 104 chạy lại ma trận phẳng load4 trên máy yên, RAM ≥
   2,5 GB, không luồng khác chạy probe song song; nếu vẫn cao thì A/B
   có kiểm soát). Gate bỏ qua khi không tìm được clip (fail-open,
   nested) nay ĐÃ ĐÓNG — không còn là nợ mở.
6. Blur parity — r7 VẪN MỞ (cần strip dài hơn — 96 mẫu / 2 hàng — hoặc
   đo trực tiếp presented/ghost; cả hai đều cần thay đổi
   instrumentation production); D floor post-fix gộp 0/1640 (CI trên
   0,183%); B-band chỉ còn đuôi c0 (p=0,0042, post-hoc — cần kiểm
   chứng đăng ký trước); cửa sổ mù wk không thu hẹp được (cần lượt
   blind yên — đang bị cấm trong nhiệm vụ này; đuôi tải đã đo tới
   8124/6120ms, c2 biến thiên không tương quan tốc độ phát).
7. EPERM: probe #23 + khoảng mù #22 (bắt đầu 05:40:24Z); khoảng mù #21
   CHƯA ĐÓNG HOÀN TOÀN (lỗ 17'23" có thể chứa 1 reboot trung gian —
   parent/user quyết xem có chấp nhận làm mức đóng hay để mở như
   reboot #16); giờ từng giây reboot #16 KHÔNG chốt được (kẹp ~4',
   chờ parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
   **Reboot #28 lúc 06:56:44Z** (giữa đợt 103) — E9 đã ghi giờ từng
   giây; reboot tiếp theo dự kiến ~09:03Z.
8. Harness — mọi đường retry/fallback Space-toggle (E1 + N10, cả 2
   chiều, cả vòng lặp fallback thứ 2) nay ĐÃ bắn thật; D6 recheck ĐÃ
   ĐÓNG (E8 + E9); còn mở: keydown chậm tự nhiên lọt đúng cửa sổ 2s
   của fallback #1 chưa quan sát được ngoài đời; G4 flake lần đầu
   (E1 run8, 9/10 — theo dõi, nếu lặp lại thì điều tra thời gian áp
   enhance sau toggle dưới tải); ENOSPC vite khi nhiều luồng cùng
   chạy vite dev (chạy lại sau khi watcher giải phóng).
9. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định
   parent đợt 92) — vẫn 0 lần chạy thành công.
10. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
11. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web
    GitHub hoặc cấp quyền workflows cho App).
12. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 103 (8 luồng): **21 entry / 8 file** (E1 2, E2 4, E3 1, E4 6,
  E5 4, E6 2, E7 1, E8 1) / 20 file duy nhất (trùng duy nhất:
  `preview.tsx` trong 2 batch E4+E5). E9: 1 entry (LIMITS kiểm
  chứng). Closing đợt 103: 2 entry (LIMITS gộp này + gap analysis
  §32).
- **Tổng chờ push sau đợt 103 (đếm lại trực tiếp từ đĩa, đợt 67–103):
  371 file batch / 2460 entry / 1494 file duy nhất** (trước đợt 103:
  361/2436/1474 — khớp đúng số D9 đợt 102; đợt 103 thêm 10 file batch
  / 24 entry / 20 file duy nhất mới — gap analysis đã có trong 31
  batch trước nên không thêm file duy nhất). HEAD vẫn 5f548ef8.
  KHÔNG push.
