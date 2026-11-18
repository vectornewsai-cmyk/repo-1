# PHASE9_ROUND123_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 5: KHÔNG CHẠY ĐƯỢC (gate A không mở — RAM host bị ghim ~480 MB, 3 attempt) — ngưỡng GIỮ

> Luồng T9, đợt 123, lượt cron 21:35 +07 16/11/2026 (bắt đầu ~14:41Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — 0 LƯỢT YÊN ĐỢT NÀY (GATE A KHÔNG MỞ, 3 ATTEMPT).**
> 1. **Gate 0 boot #66 KHÔNG BAO GIỜ ĐẠT — 4 poll** (b66 #1–#4,
>    14:45–14:51Z): T5 POSTBOOT_PASS đã có ở poll #4 (14:48:41Z, đủ
>    11/11 gói, GST thật) + check-only riêng PASS, nhưng wrapper
>    closing pass còn chạy (apt_procs=1 theo đếm grep) → (0c) không
>    đạt. Reboot 14:52:19Z cắt trước poll #5.
> 2. **Gate 0 boot #67 ĐẠT (~15:00Z)** — nhưng chỉ khi phán (0c)
>    bằng `pgrep -x` (phụ lục 2 prereg): đếm apt bằng grep-ps của
>    gate0-wait b67 là DƯƠNG TÍNH GIẢ — nó khớp chính cmdline của
>    các phiên kiểm của T9 (chứa chuỗi "apt-get"/"dpkg"). Bằng chứng
>    thật: `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0; watcher T5
>    apt=no, wrapper=no; dpkg.log đóng băng 1509 dòng từ 14:55:31Z;
>    T5 POSTBOOT_PASS cho #67 (kiểm 14:59:19Z, đủ 11/11, GST thật
>    269 file). run-t9.sh (gate 0 vốn dùng pgrep -x) PASS ngay lần
>    thử 1 ở cả 3 attempt.
> 3. **Gate A KHÔNG MỞ ở cả 3 attempt (30 poll, 15:05–15:36Z):**
>    mọi điều kiện khác đều xanh mọi poll (load1/load5 <2 sau poll
>    đầu attempt1, lock TRỐNG, blockers 0, cây md5 đúng) — CHỈ RAM
>    chặn: attempt1 1056→474 MB, attempt2 576→474 MB, attempt3
>    447→499 MB. RAM host bị ghim ~474–576 MB suốt 30+ phút dù máy
>    gần như yên hoàn toàn (load1 0,10–0,75 ở attempt3). T9 DỪNG
>    sau attempt3 theo prereg — KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho
>    có".
> 4. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi).** Không có lượt yên
>    mới nên không áp dụng quy tắc quyết định prereg §1 — 3 lượt yên
>    hợp lệ trước đó vẫn đứng (S5 49,5 / T4-118 40,0 / T3-121 52,0).
>    **Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 124.**
> 5. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…`
>    khớp). Dry-run analyzer PASS (S5 49,5/75,0; A8 40,0/64,7).
>    tsc apps/web exit 0 trên cây cuối. T9 không sửa production.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round123-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (14:44Z), đăng ký: dùng probe đã sửa đợt 121 nguyên
  vẹn, chờ cờ postboot T5 đợt 123 (thư mục `round123-t5`, KHÔNG chờ
  cờ đợt cũ), gate 0 + lớp A + lớp B gồm B5, ngưỡng ≤60 ms, quy tắc
  quyết định, theo dõi stale-ghost.
  **Phụ lục 1 (~14:54Z):** reboot sang boot #67 → khởi động lại
  gate0-wait (tiền lệ đợt 120/121/122). **Phụ lục 2 (~15:05Z):**
  dương tính giả (0c) ở gate0-wait b67 — thích ứng (0c) sang
  `pgrep -x` (đúng như run-t9.sh đã làm). Cả 2 phụ lục đều viết
  TRƯỚC khi chạy phép đo mà chúng điều chỉnh (và đợt này KHÔNG CÓ
  phép đo nào — chỉ có poll gate 0 / gate A).
- **Boot trong đợt: HAI boot — #66 rồi #67.**
  - Boot #66 (`uptime -s` 2026-11-16 14:24:43Z, boot_id
    `9bbda390-bd64-4679-a1ff-3619899cee7d`, số tạm "#66" — chờ T6
    đếm lại): T9 bắt đầu trên boot này (~14:41Z, boot ~17' tuổi).
    Gap sau #65 (12:53:25Z) = 1h31'18".
  - Boot #67 (`uptime -s` 2026-11-16 14:52:19Z, boot_id
    `94e29be5-a52c-4840-9ca9-4e896482e4a2`): reboot giữa đợt, xảy ra
    GIỮA lúc gate0-wait b66 đang chạy (poll #4 lúc 14:51:11Z; poll
    #5 chưa bao giờ chạy). Gap #66→#67 = 27'36".
- **Replay từng boot:**
  - Boot #66: CHẠY TỐT — configure 14:35:39Z (boot +10'56", khởi
    động muộn); `apt-get update` pid 813 chạy 14:35–~14:45Z (xong,
    KHÔNG kẹt — khác dạng (C) của #64); installs 14:45:33–
    14:48:19Z; dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools
    14:48:19Z; T5 POSTBOOT_PASS 14:48:41Z ("PASS NHỜ REPLAY, đủ
    11/11 gói, GST thật 269 file, isomp4 + libav đủ"). Chỉ wrapper
    closing pass (reseed + autoclean) còn chạy lúc poll #4 của T9.
  - Boot #67: CHẠY TỐT, NHANH — configure 14:52:59Z (boot +40s);
    `apt-get update` pid 808 + wrapper pid 782; installs cực nhanh
    (dpkg 2→1104 dòng lúc 14:54:45Z, 1242 lúc 14:55:03Z, 1509 lúc
    14:55:31Z, gói cuối gstreamer1.0-tools 14:55:31Z — boot +3'12",
    nhanh thứ 2 từ trước tới nay sau #48 +2'44" theo T5); apt-get
    chết trước 14:55:46Z; T5 POSTBOOT_PASS 14:59:19Z (boot +7'00",
    cùng nội dung đủ 11/11 + GST thật 269). Luật repair dạng (C)
    KHÔNG cần kích hoạt đợt này — cả 2 replay đều chạy xong tự
    nhiên.
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 14:41Z = sau reboot #67 14:53Z = kiểm
  cuối 15:38Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t9-tickcost.py`
  + `analyze-t9-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 và trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7 (khớp 100% với dry-run đợt 120/121/
  122). Analyzer copy từ đợt 122 hoạt động đúng.
- **RAM host bị ghim thấp (xem §7.1):** boot #66 RAM 1418–4239 MB
  trong lúc replay (cao); boot #67 mở 1797 MB rồi rơi đều
  1797→474 MB trong ~20 phút và GHIM ~447–576 MB suốt 30+ phút dù
  máy yên (load1 0,10–0,75) — áp lực ngoài cell, cùng hiện tượng
  đợt 121 (~440 MB) và đợt 122 (~410 MB). Vite vẫn chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) theo protocol — không
  liên quan đợt này vì không chạy vite.
- **Vite lock v2-ONLY**, cổng T9 **5187**. Lock TRỐNG suốt đợt
  (không có attempt nào giữ lock — không attempt nào tới được probe).
- **Các luồng đợt 123 khác (theo cờ .done):** T1–T8 đã DONE lúc T9
  dừng (~15:38Z); T10 chưa có cờ. T5 done (POSTBOOT_PASS cho #66 +
  #67 đã viết); T7 done (round123-t7.done — dùng cho thích ứng
  VANG-T7-DONE ở gate0-wait b67).

## 1. Gate 0 — boot #66 KHÔNG ĐẠT (4 poll); boot #67 ĐẠT (nhờ thích ứng (0c) pgrep -x)

### 1.1 Boot #66 — gate0-wait b66 4 poll, KHÔNG ĐẠT

- **b66 (14:45:10–14:51:11Z, poll #1–#4):** poll #1 postboot FAIL
  (replay đang chạy, dpkg 133 dòng, apt_procs 3, RAM 1418 MB);
  poll #2 postboot PASS (exit 0) nhưng apt_procs 6, dpkg 1177,
  RAM 2948 MB; poll #3 postboot PASS, apt_procs 2, dpkg 1509,
  RAM 4027 MB; poll #4 t5flag=PASS (T5 POSTBOOT_PASS 14:48:41Z,
  boot_id khớp) + postboot PASS nhưng apt_procs=1 (wrapper closing
  pass) → (0c) không đạt, RAM 4239 MB, md5 03bf029f ổn định.
  Reboot 14:52:19Z cắt trước poll #5 (poll #5–#30 chưa bao giờ
  chạy).
- T5 (chủ hạ tầng) song song: watcher b66 + POSTBOOT_PASS cho #66
  (xem §0). T5 KHÔNG cần repair — replay #66 chạy xong tự nhiên.

### 1.2 Reboot #67 — giết tiến trình nền, khởi động lại gate0-wait

- Reboot 14:52:19Z giết gate0-wait b66 + poller 5 phút + phiên exec
  đang sleep chờ của T9 (runtime restart — xem §7.3). Log
  gate0-wait tới poll #4 còn nguyên trên đĩa; không mất dữ liệu đo
  (0 lượt đo).
- Khởi động lại theo tiền lệ đợt 120/121/122 (prereg phụ lục 1):
  `gate0-wait-t9-b67.sh` (poll #1–#10) + poller, bắt đầu 14:54:10Z.

### 1.3 Boot #67 — gate0-wait b67 6 poll, ĐẠT về thực chất (bị bộ đếm grep chặn)

- **b67 (14:54:11–15:04:13Z, poll #1–#6):** poll #1 postboot FAIL
  (replay đang chạy, dpkg 322, apt_procs 2, RAM 1797 MB; t5flag
  "PASS(mtime-moi-khong-ghi-boot_id)" — cờ #66 cũ, mtime 14:48:41Z
  < boot #67 14:52:19Z nên flag_state đáng lẽ báo "cu" — xem ghi
  chú §7.2); poll #2–#3 postboot PASS (exit 0), dpkg 1509,
  apt_procs 2, RAM 1481→1275 MB; poll #4 t5flag=PASS (T5 đã ghi
  cờ #67 mới) + t7flag=VANG-T7-DONE + postboot PASS, apt_procs 2,
  RAM 1139 MB; poll #5–#6 tương tự (apt_procs 2 rồi 1, RAM
  1112→1236 MB). Gate 0 không bao giờ "ĐẠT" theo script vì (0c)
  đếm grep luôn ≥1.
- **Dương tính giả (0c) — đã kiểm chứng 15:03:57Z (prereg phụ lục
  2):** `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0; watcher T5
  apt=no, wrapper=no (poll 7–9, 15:01–15:03Z); dpkg.log đóng băng
  1509 dòng từ 14:55:31Z (8+ phút). 2 dòng grep đếm được là chính
  các phiên exec kiểm tra của T9 — cmdline chứa chuỗi "apt-get"/
  "dpkg" (lệnh pgrep/grep trong câu lệnh kiểm) nên
  `ps aux | grep -E '[a]pt-get|[d]pkg'` tự khớp. Bằng chứng bổ
  sung: apt_procs rơi 2→1 ở poll #6 đúng lúc một phiên exec của T9
  kết thúc — số đếm biến thiên theo phiên kiểm, không theo apt.
- **Thích ứng (0c) (phụ lục 2, viết TRƯỚC khi chạy attempt):**
  (0c) phán bằng `pgrep -x` + watcher T5 + dpkg đóng băng. Với 4
  điều kiện này, **gate 0 boot #67 ĐẠT từ ~15:00Z** (poll #4).
  Gate0-wait b67 bị DỪNG bằng `pkill -f "gate0-wait-t9-b67[.]sh"`
  (~15:04:52Z, sau khi ghi phụ lục 2) để khỏi để lại kết luận sai
  "KHÔNG ĐẠT" ở poll #10; log tới poll #6 giữ nguyên làm bằng
  chứng. run-t9.sh (gate 0 vốn dùng pgrep -x) PASS ngay lần thử 1
  ở cả 3 attempt (xem §2).

## 2. Gate A — KHÔNG MỞ ở cả 3 attempt (30 poll) — chỉ RAM chặn

- **Attempt1 (15:05:09–15:14:10Z):** gate 0 try 1 PASS ngay
  (postboot_exit=0, aptx=0, dpkgx=0; apt_grep=1 — lại dương tính
  giả grep, không ảnh hưởng vì run-t9.sh phán bằng pgrep -x).
  Gate A poll 1–10: load1 2,50→0,63; load5 1,79→1,41; lock TRỐNG;
  blockers 0 (trừ poll 1 blockers=1 thoáng qua — cùng lúc load1
  2,50, không ảnh hưởng kết luận); tree YES:md5=03bf029f mọi poll;
  **RAM 1056→991→848→753→648→555→481→477→480→474 MB** — chỉ
  poll 1 đạt ≥1024 MB nhưng bị load1 + blockers chặn; poll 2–10
  chỉ RAM chặn. Kết thúc: "HET 10 PHUT GATE A KHONG MO", exit 5,
  KHÔNG chạy probe.
- **Attempt2 (15:16:27–15:25:28Z):** gate 0 try 1 PASS ngay
  (postboot 0, aptx 0, dpkgx 0, apt_grep=0). Gate A poll 1–10:
  load1 0,14–1,52; load5 0,65–1,66; lock TRỐNG; blockers 0; tree
  YES; **RAM 576→536→494→517→486→487→477→504→505→474 MB** — máy
  gần như yên hoàn toàn nhưng RAM ghim ~480–576 MB, không một poll
  nào ≥1024 MB. Kết thúc exit 5, KHÔNG chạy probe.
- **Attempt3 (15:27:11–15:36:12Z, attempt CUỐI theo ngân sách T9):**
  gate 0 try 1 PASS ngay (postboot 0, aptx 0, dpkgx 0). Gate A
  poll 1–10: load1 0,10–0,75; load5 0,30–0,53; lock TRỐNG;
  blockers 0; tree YES; **RAM 447→485→477→472→516→709→557→519→
  499→499 MB** — vẫn không một poll nào ≥1024 MB. Kết thúc exit 5,
  KHÔNG chạy probe.
- **Tổng cộng 30 poll gate A, 0 poll mở cửa.** RAM rơi đều
  1797 MB (14:54Z) → ~474 MB (15:05Z) rồi ghim ~447–576 MB suốt
  30+ phút dù máy yên — áp lực host ngoài cell, không phải bleed
  của trang (không chạy vite/probe nào trong cửa sổ). T9 DỪNG sau
  attempt3 theo prereg — KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho có".
  Ghi nhận: RAM lúc kiểm cuối 15:38Z là 1023 MB (hồi nhẹ sau khi
  các attempt kết thúc — vẫn dưới 1024 MB, và sau ngân sách T9).

## 3. Không có lượt yên — verdict ngưỡng giữ nguyên

- **0 lượt yên đợt 123 (T9).** Không có số tickCost mới, không có
  phân tích (b)/F6'/lag5/stale-ghost mới. Không có probe nào chạy
  (cả 3 attempt đều dừng ở gate A, exit 5).
- **Verdict ngưỡng (theo prereg §1 — không có lượt ĐẠT lớp B nên
  không áp dụng nhánh quyết định): GIỮ ngưỡng WebKit ≤60 ms.**
  3 lượt yên hợp lệ trước đó vẫn đứng: S5 49,5 ms (đợt 116, cây
  03bf029f) / T4-118 40,0 ms (đợt 118, cây 03bf029f) / T3-121
  52,0 ms (đợt 121, cây 5be5a250).
  **Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 124** — đo trên
  cây baseline 03bf029f hiện tại theo cùng prereg (gate 0 + lớp A
  + lớp B gồm B5).
- T9 KHÔNG bịa lượt yên, KHÔNG hạ ngưỡng RAM, KHÔNG đo "cho có".

## 4. Cây đo — baseline, không đổi

- preview.tsx md5 `03bf029f` không đổi: lúc bắt đầu (14:41Z) =
  mọi poll gate0-wait b66/b67 = mọi poll gate A (30 poll) = kiểm
  cuối (15:38Z). `media.ts` md5 `2c384ed1` không đổi.
- T9 không sửa production: không có thay đổi nào do T9; cây giữ
  baseline theo quyết parent đợt 122 (H3f đã gỡ, không apply lại).

## 5. Probe — dùng nguyên bản đã sửa đợt 121, KHÔNG sửa

- Probe làm việc `hidden_files/round123-t9/probe121t3-ghost-k7.webkit.mjs`
  md5 `dccb8f4c…` — KHỚP bản đã sửa đợt 121 (cả bản trong repo
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`). KHÔNG sửa
  probe đợt này (không phát hiện lỗi mới — chưa chạy probe lần nào
  vì gate A không mở).
- **Probe KHÔNG đưa vào batch đợt này** (không đổi; đã stage ở đợt
  121, 57.283 B oversize).
- Dry-run analyzer PASS (§0): S5 49,5/75,0; A8 40,0/64,7.

## 6. Kiểm chứng lớp B — KHÔNG ÁP DỤNG (không có lượt đo)

- Không có attempt nào chạy probe nên không có sampler load-mid,
  không có ps-before/after, không có classb. Ghi rõ để khỏi hiểu
  lầm: file `check-classb-t9.sh` đã chuẩn bị nhưng chưa bao giờ
  chạy (cả 3 attempt đều exit 5 trước khi tới probe).

## 7. Kiểm chứng hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (14:41Z) = mọi poll gate0-wait/gate A = kiểm cuối (15:38Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 15:38Z, ~21 s).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo.

## 8. Sự cố hạ tầng + vận hành trong lúc đo

1. **Reboot #67 14:52:19Z (boot_id `94e29be5…`, gap #66→#67 =
   27'36"):** giết toàn bộ tiến trình nền của T9 (gate0-wait b66 +
   poller 5 phút + phiên exec đang sleep chờ — runtime restart).
   T9 khởi động lại cả 2 trên boot mới theo tiền lệ đợt 120/121/
   122 (prereg phụ lục 1). Không mất dữ liệu (0 lượt đo; log tới
   poll #4 còn nguyên).
2. **Dương tính giả (0c) ở gate0-wait b67 (mới):** đếm apt bằng
   grep-ps khớp chính cmdline của phiên kiểm của T9 (xem §1.3 +
   prereg phụ lục 2). Bài học: mọi bộ đếm (0c) bằng grep-ps đều
   phải dùng `pgrep -x` (khớp tên process chính xác) — run-t9.sh
   đã làm đúng từ đầu; gate0-wait-t9-b66/b67 vẫn dùng grep-ps và
   cần sửa ở đợt sau (đổi APTN sang pgrep -x trong script mới,
   KHÔNG sửa script đang chạy). T9 đã xử lý bằng thích ứng (0c)
   có ghi phụ lục TRƯỚC khi chạy attempt — không sửa âm thầm.
   Ghi chú: ở poll #1 b67, t5flag báo "PASS(mtime-moi-khong-ghi-
   boot_id)" dù cờ #66 cũ có mtime 14:48:41Z < boot #67 14:52:19Z
   — flag_state đáng lẽ báo "cu(mtime-cu)"; khả năng do T5 đã ghi
   đè cờ mới cho #67 trong khoảng 14:54Z (T5 watcher b67 chạy từ
   ~14:53Z) rồi flag_state đọc file mới nhưng grep boot_id chưa
   khớp lúc đó (cờ viết dở / đang ghi). Không ảnh hưởng kết luận
   gate 0 (poll #4 trở đi t5flag=PASS rõ ràng với boot_id khớp).
3. **RAM host bị ghim thấp (~447–576 MB, xem §0 + §2):** áp lực
   ngoài cell, 3 đợt liên tiếp (~440 MB đợt 121, ~410 MB đợt 122,
   ~480 MB đợt 123). Gate A (RAM ≥1024 MB lúc bắt đầu) không mở
   nổi ở 30/30 poll dù máy yên hoàn toàn. Ghi nhận: RAM host là
   yếu tố ngoài tầm kiểm soát của luồng đo (không hạ ngưỡng RAM để
   "cho qua"). Đề xuất giữ nguyên ngưỡng RAM; luồng riêng đo RAM
   baseline của trang preview khi chạy idle (nợ quan sát từ đợt
   120 §9.4, vẫn mở) để tách bleed của trang khỏi áp lực host.
4. **Nhảy clock tại reboot #67 (nghi ngờ, lần 5):** log watcher
   `t5-wait-replay-b66.log` poll #7 ghi 14:52:44Z — muộn hơn giờ
   boot mới 14:52:19Z 25 giây, dù tiến trình đó chết theo reboot
   (cùng mẫu nhảy clock tại reboot như #54/#58/#63/#65; xem prereg
   phụ lục 1). Ghi nhận cho T4 (mù/clock) chẩn đoán nếu cần; không
   ảnh hưởng kết luận gate 0 đợt này.
5. **Runtime restart / exec gián đoạn:** phiên sleep chờ của T9 bị
   gián đoạn do service restart (~14:52Z, trùng reboot #67) — các
   tiến trình detached (gate0-wait, poller) sống qua restart nhưng
   CHẾT theo reboot; T9 kiểm tra lại trạng thái từ đĩa; không mất
   dữ liệu (log tới poll #4 còn nguyên). Bài học `pkill` dùng mẫu
   bracket `[.]` đã áp dụng đúng cả 2 lần dừng tiến trình nền đợt
   này (gate0-wait b67 + poller) — không tự kill phiên exec.
6. **Nhãn file log hậu tố b66 cho attempt trên boot #67 (lỗi đặt
   tên, không phải lỗi dữ liệu):** run-t9.sh ghi
   `postboot-t9-b66-attempt<N>-gate0.log` (hậu tố b66 là di sản
   sed từ script gốc) dù 3 attempt đều chạy trên boot #67
   (14:52:19Z — nội dung log ghi đúng boot). Ghi rõ để khỏi hiểu
   lầm khi đọc log; đợt sau đổi hậu tố theo boot thật.

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND123_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round123-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round123-t9/`
  (prereg-t9.md [viết trước khi đo + phụ lục 1 (reboot #67,
  khởi động lại gate0-wait) + phụ lục 2 (dương tính giả (0c),
  thích ứng pgrep -x)],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 122],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  b.json [copy đợt 122, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 122, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 123: round123-t9, gate 0 kiểm apt bằng
  pgrep -x],
  t9-attempt-inner.sh [adapt: round123-* trong kiểm file mới,
  $2=PASSES, $3=TICKCOST_TIMEOUT_MS — CHƯA BAO GIỜ CHẠY],
  check-classb-t9.sh [lớp B gồm B5 — CHƯA BAO GIỜ CHẠY],
  gate0-wait-t9-b66.sh [boot #66: 4 poll, reboot cắt] +
  gate0-wait-t9-b67.sh [boot #67: 6 poll, DỪNG theo phụ lục 2 vì
  (0c) grep dương tính giả],
  gate0-wait-t9-b66.log [boot #66: 4 poll, GATE 0 KHÔNG ĐẠT] +
  gate0-wait-t9-b67.log [boot #67: 6 poll],
  gate0-wait-t9-b66.nohup.log + gate0-wait-t9-b67.nohup.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA: 30 poll
  gate A] + poll-t9.nohup.log + poll-t9-b67.nohup.log,
  postboot-t9-b66-gate0wait-{1..4}.log [boot #66: FAIL #1, PASS
  #2–#4] + postboot-t9-b67-gate0wait-{1..6}.log [boot #67: FAIL #1,
  PASS #2–#6] + postboot-t9-b66-attempt{1,2,3}-gate0.log [gate 0
  run-t9.sh: PASS cả 3 — hậu tố b66 là nhãn cũ, nội dung là boot
  #67, xem §8.6],
  run-t9-attempt{1,2,3}.nohup.log [attempt1/2/3: exit 5, gate A
  không mở],
  chain-t9.log [attempt1/2/3: HET 10 PHUT GATE A KHONG MO],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round123-t9.done` (kèm verdict 1 dòng).

## 10. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 0 lượt yên đợt 123 (gate A
   không mở, RAM host ghim ~480 MB, 3 attempt / 30 poll). Nợ lượt
   yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 124,** đo trên cây
   baseline 03bf029f hiện tại theo cùng prereg (gate 0 + lớp A +
   lớp B gồm B5). Các lượt yên đã có: S5 49,5 / T4-118 40,0 /
   T3-121 52,0 (chỉ T3-121 trên cây patch).
2. **Sửa bộ đếm (0c) của gate0-wait sang pgrep -x ở đợt sau:**
   đếm apt bằng grep-ps dương tính giả khi chính phiên kiểm gõ
   "apt-get"/"dpkg" (xem §1.3 + §8.2). Đổi APTN trong script
   gate0-wait mới sang `pgrep -x apt-get | wc -l` + `pgrep -x dpkg
   | wc -l` (như run-t9.sh đã làm) — KHÔNG sửa script đang chạy.
3. **RAM host bị ghim thấp 3 đợt liên tiếp (~440 / ~410 / ~480
   MB):** áp lực ngoài cell. Gate A (RAM ≥1024 MB lúc bắt đầu) và
   B5 sẽ khó đạt ở các lượt sau nếu host không hồi RAM. Đề xuất
   giữ nguyên ngưỡng RAM (không hạ để "cho qua"); luồng riêng đo
   RAM baseline của trang preview khi chạy idle (nợ quan sát từ
   đợt 120 §9.4, vẫn mở) để tách bleed của trang khỏi áp lực host.
   Nếu RAM host tiếp tục ghim <600 MB nhiều đợt, parent cân nhắc
   có cho miễn RAM gate A (chỉ khi đo được RAM baseline của trang
   để chứng minh bleed không phải nguyên nhân) hay không — T9
   KHÔNG tự miễn.
4. **Replay 2 boot đợt này đều chạy tốt, KHÔNG cần luật repair
   dạng (C):** #66 xong 14:48:19Z, #67 xong 14:55:31Z (nhanh thứ 2
   từ trước tới nay). Luật repair dạng (C) đã phê duyệt từ đợt 123
   nhưng chưa từng kích hoạt — giữ hiệu lực cho đợt sau.
5. **Nhảy clock tại reboot #67 (nghi ngờ, lần 5 sau #54/#58/#63/
   #65):** log watcher T5 poll #7 ghi 14:52:44Z muộn hơn giờ boot
   14:52:19Z 25 giây. Ghi nhận cho T4 (mù/clock) chẩn đoán nếu
   cần; không ảnh hưởng kết luận gate 0 đợt này.
6. **(c2) "dang ngo thật" +1f (đợt 121) + stale-ghost:** không có
   dữ liệu mới đợt này (0 lượt đo) — theo dõi tiếp ở lượt yên sau.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 122 §10–§11 + quyết
   parent §12:** E4 lượt 3 rồi lượt 4 trên cây BASELINE (T1/T2 đợt
   123); leg B chạy lại trên baseline theo PSI v0.1; G1 khung (a)
   M2 HOÃN chờ user; R9 (a) VẪN CHỜ user; birefnet 0 lần; TTS 39
   CẤM kiểm lại; ci-security.yml vẫn 403 chờ user; release gate
   không đổi. Reboot mới nhất: boot #67 14:52:19Z (gap #66→#67 =
   27'36"). 8/10 luồng đợt 123 đã DONE lúc T9 dừng (T1–T8); các
   luồng còn lại xem build-loop-log.
