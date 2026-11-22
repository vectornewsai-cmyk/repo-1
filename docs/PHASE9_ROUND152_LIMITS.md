# PHASE9 ROUND 152 — LIMITS tổng hợp (đợt 152, lượt cron 12:35 +07 20/11/2026)

Đợt 152: lượt cron 12:35 +07 20/11/2026 (= 05:35:51Z). T10 đóng sổ ~08:1xZ, trong hạn cứng 08:30Z. Verdict đề xuất: **CHẤP NHẬN** (chờ quyết parent §12.3). Hai reboot trong/quanh phiên: **#43 btime 05:20:57Z TRƯỚC phiên** (giữa T10-151 đóng ~05:05Z và lượt cron mở 05:35:51Z) và **#44 btime 07:04:11Z GIỮA phiên** (viết lại started_at run 152 — điểm (m) thứ 5, DƯƠNG). 9/9 cờ `.done` có mặt trên đĩa lúc đóng.

## §1. T0 — Sửa F-151-T10-2: O8 report JSON ghi theo lượt, không ghi đè

- **Lỗi F-151-T10-2 ĐÃ SỬA ở gốc:** 2 script O8 (`clicktest-87o8-mask-track-webkit.mjs` md5 `ecbd1b40` → `4994b4fc`, +23 dòng; `clicktest-87o8-mask-track-headed.mjs` `8911ad3d` → `c8acd72e`, +24 dòng) nay ghi report JSON riêng theo lượt `o8(w)-clicktest-report-<stamp>-<boot8>[-attempt<N>]-pid<PID>.json` (stamp + boot_id + attempt qua env + pid); file tên cố định cũ vẫn ghi thêm làm bản "latest"; JSON mang thêm khối `run`. `node --check` cả 2 OK. Không chạm code TS/app.
- **Kiểm chứng chạy thật trong scratch riêng `round152-t0/`** (cổng/display riêng, không tranh với T8-152): WebKit attempt1 exit 2 (S0 PASS, S1 FAIL, `Target crashed` — chữ ký đợt 142 tái hiện) + attempt2 exit 2 (timeout chờ project mẫu tự load) — **2 file JSON theo lượt khác nhau đều tồn tại, nội dung đúng** (đếm độc lập bằng python); Chromium exit 0, 21/21 pass, JSON riêng + latest byte-identical. Ghi đúng kết quả thực tế, không làm tròn.
- Không retry WebKit thêm để tránh tranh CPU với T8-152 đang chạy; đường ghi success-path WebKit dùng chung hàm writeReport đã chạy thật ở catch-path WebKit + main-path Chromium. Stage `phase9-round152-t0-o8json.txt` (3 entry NUL, read-back khớp).

## §2. T1 — Verify đợt 151: PASS

- **Verdict PASS — nội dung đợt 151 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới `count-final-152.py` (trừ 1 sai lệch đếm overlap trong aggregate — F-152-T1-2, không đổi tổng số); **suite chạy lại 28/28 exit 0** trên boot mới `18e179e0` (05:39:17–05:50:36Z, 11m19s — lần đầu suite đầy đủ chạy trên boot sau #43, lấp khoảng trống F-151-T10-3 theo đúng tinh thần quyết (x) đợt 151); `npm test` **12 pass** theo chuẩn đứng mới (w) (11 mục cũ + V19 34 assert PASS); probe V19 geq 34/34 assert PASS ngay trong suite tích hợp — xác nhận độc lập claim T0-151 lần thứ hai.
- **O8 xác nhận độc lập:** WebKit 21/21 + Chromium 21/21 (JSON gốc), chuỗi FULL PASS 8 → 9; gate T4-flag 03:16:05Z → GATE-FOUND 03:16:15Z → O8 03:16:53Z.
- **RAM đỉnh 51,56% (quyết (h)) đối chiếu từ log gốc** (max 3.243.888 kB @03:03:31Z); T2's 34,41% là đỉnh đợt 150, đúng cửa sổ mù. RAM min 250.840 kB kỷ lục thấp; balloon 31/134 mẫu; headroom 90 đứng theo bảng T9 (không còn stdout probe thô — F-152-T1-5).
- Sai lệch: F-152-T1-1 (reboot #43 mới giữa T10-151 đóng và đợt 152 mở — mù mới + run 151 lại bị đánh trúng, giao T2/T7-152); **F-152-T1-2 (overlap THẬT 4 file, không phải 3 — thêm `PHASE9_GAP_ANALYSIS.md` trong file closing)**; F-152-T1-4 (JSON O8 không có trường total/ok/fail); F-152-T1-5 (headroom thiếu stdout probe); F-152-T1-6 (watcher poll 03:25:21Z muộn hơn btime #42 5 s). Stage `phase9-round152-t1-verify151.txt` (1 entry NUL).

## §3. T2 — EPERM probe #71 + mù #74?/#75? đều MỞ (gap #42/#43 ứng viên, chờ parent)

- **Probe EPERM #71: ok=2 fail=0, boot `18e179e0`, 05:41:18Z.** Probe trước (#70) đã chết/stale 10.866 s (3h01'06", n=70, ts 02:40:07Z, boot 2e430750). Log `eperm-probe-v2.log` 202 → **205 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Đối chiếu probe #71 với T1-152 KHỚP (T1 đếm log 205 dòng, 3 dòng 203–205 là probe #71). EPERM 0 sóng thật; sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~210 h trước probe #71). EPERM chưa tuyên bố hết.
- **⚠️ PHÁT HIỆN MỚI — REBOOT #43 (không có trong brief):** boot `fad2aab9` → `18e179e0`, btime 05:20:57Z, xảy ra giữa T10-151 đóng (~05:05Z) và lượt cron 152 (05:35:51Z). Cửa sổ probe #70 → #71 nay chứa **HAI reboot (#42 + #43)**.
- **Mù #74? MỞ theo luật gap — J-full KHÔNG ĐÓNG** (max gap 1.589 s > sàn 1.147 s, max 1 ẩn): đoạn I đóng (max 475 s), đoạn K đóng (max 880 s), nhưng đoạn J-full có **1 hố 1.589 s (04:00:55Z → 04:27:24Z)** đứng nguyên sau recheck toàn cây 843.905 file + /var/log (chỉ trúng bẫy float cùng giây cạnh trái — lần thứ bảy liên tiếp). **Bằng chứng hỗ trợ mạnh (KHÔNG phải closer theo luật đứng):** 26 dòng sampler T9-151 mỗi 60 s trong hố (04:01:18–04:26:19Z, đều boot=fad2aab9) + 3 session sống xuyên hố + HB scheduler dispatch 04:15:34Z — hố có lời giải thích vận hành đầy đủ. **Chuỗi mù đóng hoàn toàn GIỮ 9** (không tăng).
- **Mù #75? MỞ** (cùng hố J, K đóng max 880 s — CHỨNG NHẬN BỔ SUNG XONG §2.13 theo F-152-T1-1: số hiệu #75? ĐÃ XÁC NHẬN).
- **Gap #42 / #43 — KHOẢNG ỨNG VIÊN (chưa chứng nhận):** #42 **[7.163, 7.167] s, giữa 7.165 s**; #43 **[6.939, 6.943] s, giữa 6.941 s**. Cả hai số danh nghĩa NẰM TRONG khoảng. Lưu ý: không có đo F trực tiếp nào trên boot fad2aab9 — khoảng dựa trên giả định đồng hồ fad2aab9 chính xác lúc đầu boot (mẫu đứng F111?/F112?/F113? + tính nhất quán nội bộ); độ nhạy đã tính. **CERT/FULL chính thức GIỮ 73/88**; ứng viên 75/90 nếu parent chấp nhận bằng chứng hỗ trợ — xem §12.1 (a).
- **Nghịch lý đồng hồ tại #42 — ĐÃ ĐỐI CHIẾU, 18 s ĐƯỢC XÁC NHẬN LÀ CẬN MẠNH NHẤT:** dòng log cuối của boot cũ đóng dấu **03:25:34.073Z** − btime 03:25:16Z = **18,073 s** → e_cũ(lúc chết) ≥ **+18 s**. Nhất quán với dấu hiệu T9 (≥ +15 s) và T7 (≥ +10 s) — cả ba đều là cận dưới, không mâu thuẫn. Ghi nhận, KHÔNG mở điều tra mới.
- **Khung chết:** #117? (2e430750): **6 s danh nghĩa** ([6, 24] s giờ thực ước lượng); #118? (fad2aab9): **934 s danh nghĩa** (05:05:23Z, 05:20:57Z] — dài vì máy yên sau khi T10 đóng sổ đợt 151.
- **INSIDE chuỗi 3 → 4 THEO CHUẨN ĐỨNG:** btime fad2aab9 03:25:16Z **INSIDE** dải FULL88 neo 2e430750 [01:52:05Z, 03:50:31Z]; **18e179e0 INSIDE dải FULL89 ỨNG VIÊN** → chuỗi 4 → 5 chờ gap #42. **F114? ≈ 0/+1 s, ĐỦ 3 SERVER** (example +1, google +1, cloudflare +1 — cloudflare 200). **WFS #58 chênh 0 — lần thứ 58 liên tiếp.** NEWSTD 979 dòng / 283 file; R7b 1.004 / 300; copies 25 / 17.
- **RAM đỉnh cửa sổ mù ĐÚNG: 3.964.468 kB = 63,01% guard (T9-152 sampler, 05:40:17Z, đoạn K)** — 0/202 mẫu ≥ guard. Birefnet **0 thử lần thứ sáu liên tiếp**. LIMITS `PHASE9_ROUND152_T2_EPERM_LIMITS.md` 60.360 B md5 `f7ffec29…` (oversize >37.768 — push cần `ENABLE_PRIVSEP=0`). Stage `phase9-round152-t2-eperm.txt` (1 entry NUL).

## §4. T4 — Lượt yên #22: CÓ lượt hợp lệ mới (thứ 20), median ĐÚNG ngưỡng 60,0 ms

- **#22 CÓ LƯỢT HỢP LỆ MỚI (thứ 20): attempt1-18e179e0, 05:59:46–06:04:10Z — 20/20 + lớp B ĐẠT 5/5 + tickCost median 60,0 ms ≤ 60 (ĐÚNG NGƯỠNG, n=489, p90=89,0, max=172, min=31; hậu flip+2000ms n=362 median=59,5).** Ngân sách dùng 1/3 attempt (không cần retry). p1p3p7 chạy tay exit 0 (F-148-T4-1 ĐÓNG cho lượt này; seq rỗng). Test poll log riêng (F-150-T4-5 ĐÓNG).
- **(c2)=0 occurrence — lượt này KHÔNG đóng góp bằng chứng mới cho điều tra ghost-freeze; cộng dồn P-counts KHÔNG ĐỔI: P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48.** Median chain 20 lượt, tb ~49,5 ms. **P3' 32/34 vẫn không tròn lần thứ hai liên tiếp** — quyết (n) đợt 151 nói nếu đợt 152 P3' lại không tròn thì mở xem xét — xem §12.1 (c).
- Boot `18e179e0` (btime 05:20:57Z), 0 reboot trong phiên T4; replay KHÔNG tới tự nhiên — T5 repair sớm 05:46:03Z (dpkg 2→795, cache 110 .deb); có T5-152 POSTBOOT_PASS 05:58:52Z poll=1; cửa mở poll #25 05:59:46Z; mask_anim KHÔNG nhiễm đợt này. Stage `phase9-round152-t4-quiet22.txt` (3 entry NUL). LIMITS 20.005 B md5 `60d457b9…`.

## §5. T5 — Infra: quyết (q) CÓ ĐÁP ÁN + repair sớm (h) kiểm chứng live lần đầu

- **(q) pid 15613 KHÔNG PHẢI watcher khởi động lại:** log151: 2 START đều boot 2e430750, 0 NEWBOOT, 0 dòng fad2aab9, heartbeat cuối 03:25:21Z (chết theo #42); boot #43 `18e179e0` (btime 05:20:57Z) replay VẮNG (dpkg 2 dòng startup 05:35:44–45Z, cache 0, lists 5, GST 0).
- **Repair sớm (h) kiểm chứng live LẦN ĐẦU:** watcher-152 pid 17990 từ 05:44:02Z kích EARLY-REPAIR 05:46:03Z (boot+25m06s, frozen 618s, 2 dòng, 0 proc); verify form-B exit=1 (thiếu 5 lib + GST + 11 gói); `--repair` exit=0 (update ~12p + cài 11 gói); postboot poll1 exit=0; **cờ POSTBOOT_PASS mới ghi 05:58:52Z poll=1** (repair-sớm-quyết-h; dpkg 795, cache 110, lists 75, GST 269); cờ cũ 2e430750 lưu POSTBOOT_PASS-2e430750.
- Watcher T5-152 chết theo reboot #44 (log cuối 07:04:36Z; không còn process lúc T10 đóng — xem §10.5, F-152-T10-4). Run 151 thuộc T7-152 (T7-151 đóng lúc run vẫn running). Stage `phase9-round152-t5-infra.txt` (1 entry NUL).

## §6. T6 — (A) còn nguyên + kiểm chứng lại 120/120, prune lần 27

- **(A) CÒN NGUYÊN** (suite md5 `a89c0676` không đổi, live-code khối T7 `c92f2efff…` khớp đúng đợt 151, file khối đã trích md5 `dc973443…` giống hệt đợt 151); **kiểm chứng lại DƯƠNG TÍNH: khối T7 trích verbatim chạy 120 lần với churn bơm vào — PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6 lượt.** Chuỗi xanh kép T7 1 → 2.
- **Lock KHỎE: 409 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 TIMEOUT mới, 0 "KHÔNG NHẢ".** Prune lần 27: xóa 2 file cũ nhất (cooldown-s4-wL, cooldown-s4-wN — 14/11), queue **102 → 100 file**. Reboot mới trước phiên (05:20:57Z) không giết holder. Stage `phase9-round152-t6-lockhealth.txt` (1 entry NUL).

## §7. T7 — Scheduler: run 151 SUCCEEDED (margin 1.828 s) + #43 không-test + #44 viết lại run 152 (điểm (m) thứ 5)

- **Run 151 SUCCEEDED 05:05:23Z** (event 05:05:23.319Z), wall từ started gốc **8.972 s**, margin **1.828 s** (30m28s) tới hạn ngân sách 05:35:51Z — thoải mái, khác hẳn margin 177 s của run 150. 3 lần đọc DB độc lập khớp nhau + events đầy đủ (dispatched 02:35:51 → requeued_after_restart 03:25:49 (#42) → dispatched → reattached → succeeded 05:05:23).
- **Reboot #43 KHÔNG giết/timeout run 151:** run đã finished 05:05:23Z, TRƯỚC btime #43 (05:20:57Z) tới **934 s**. **started_at KHÔNG bị viết lại lần nữa** (vẫn 1795145149, giá trị viết lại tại #42); 0 event `requeued_after_restart` toàn bảng trong cửa 05:20:00–06:00:00Z — tại btime #43 KHÔNG có run nào đang chạy → **điều kiện test KHÔNG THỎA, n VẪN = 4** (không-test, cùng loại như #40).
- **Reboot #44 GIỮA PHIÊN (btime 07:04:11Z, boot c741f5e6): run 152 (run của chính đợt này) ĐANG CHẠY và BỊ VIẾT LẠI — ĐIỂM DỮ LIỆU THỨ 5, DƯƠNG:** started_at 1795152951 → 1795158291 = 07:04:51Z (offset 5.340 s); requeue event 07:04:51.640Z = **btime + 40,640 s** (trong dải 33–45 s của 3 lần dương trước: #39 +40,799 s; #41 +44,994 s; #42 +33,236 s); claimed_at VẪN 1795152951 (gốc, không viết lại). **n nay = 5: #38 ÂM, #39/#41/#42/#44 DƯƠNG.** Điều tra (m) VẪN ĐÓNG — chỉ ghi nhận.
- **HB muộn +891 s LẦN THỨ 8** (slot 05:20:50Z, sched 1795152050, started=finished 05:35:41Z; mẫu muộn: +887 s ×6, +889 s đợt 150, nay +891 s; kỷ lục vẫn +1.252 s đợt 129). **Khoảng im lặng scheduler 05:05:23Z → 05:35:41Z = 1.818 s** (30m18s) — 0 event toàn bảng trong khoảng; daemon đã im TRƯỚC #43 tới 934 s nên #43 một mình không giải thích được toàn bộ; event đầu tiên sau #43 là `reconciled` btime + 884 s (chậm hơn hẳn mốc recovery #39/#41/#42 +33–45 s và #40 +210 s). Cùng họ hiện tượng với đợt 150 (1.863 s), lần thứ hai liên tiếp ở đợt chẵn (150, 152) sau một đợt lẻ lành (151).
- **Cửa T7-152: HB 6/6 (1 muộn +891 s, 5 chuẩn −316 s), DR 3/3 (tất cả 0 s), 0 thiếu mới, 1 muộn — CỬA KHÔNG LÀNH HOÀN TOÀN.** Lũy kế: HB 44/303 (tỉ lệ thiếu 14,5%, giảm từ 14,8%), DR 49/222 (22,1%, giảm từ 22,4%).
- **Run 152 vẫn `running` lúc T7 đóng cờ (~07:57Z)**, tuổi gốc 8.495 s, còn 2.305 s tới hạn ngân sách 08:35:51Z. **Kết cục thuộc T7-153.** DR 08:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-153. Stage `phase9-round152-t7-scheduler.txt` (1 entry NUL). Lưu ý: cờ `round152-t7.done` 0 byte — nội dung T7 nằm trong `round152-t7/NOTES.md` + LIMITS (xem §10.1, F-152-T10-5).

## §8. T8 — Vite harness + O8: PASS 3/3 qua gate chuẩn (i) lần 2 liên tiếp, chuỗi FULL PASS 9 → 10, harness 6/6, 0 kẹt

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (06:14:27–06:17:18Z, 2'51", boot `18e179e0`, cùng cây preview.tsx `530e10a7` + script O8 ĐÃ SỬA bởi T0-152 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 06:14:43 + 06:15:42, Playwright mouse click lần 2; Chromium: 06:16:xx, CDP mouse click lần 2). **Chuỗi WebKit FULL PASS 9 → 10 — T10 XÁC NHẬN ĐỘC LẬP ở §10.2.**
- **Gate: QUA GATE THEO CHUẨN ĐỨNG QUYẾT (i) — LẦN THỨ HAI LIÊN TIẾP (151, 152).** T4-152 có lượt yên hợp lệ mới #20; cờ `round152-t4.done` viết 06:13:53Z; waiter T8 GATE-FOUND poll 34 lúc 06:13:24Z (t4=OK + postboot đường (a) `round152-t5/POSTBOOT_PASS` 05:58:52Z poll=1 sau repair sớm 05:46:03Z của T5); O8 bắt đầu 06:14:27Z, harness bắt đầu 06:17:33Z — CẢ HAI SAU CỜ T4 VÀ SAU LƯỢT YÊN HỢP LỆ.
- **Harness 6/6 PASS TRONG MỘT LẦN CHẠY, 0 KẸT** (06:17:33–06:33:45Z, system libs sau repair T5): WebKit 84l10 PASS + 85m4 PASS + 86n2 PASS + Chromium 3/3 PASS (exit 0, report ok=true). **85m4 HẾT KẸT** (đứt chuỗi kẹt 3/4 lần chạy gần nhất); **chuỗi "P3 không kẹt" 0 → 1 (bắt đầu lại).**
- **F-151-T10-2 ĐÓNG LIVE:** 2 file JSON stamped riêng biệt cho 2 attempt WebKit (pid39105/pid39569, 21/21 cả 2) + Chromium pid39921 21/21.
- **H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết (f))** — 0 kẹt nên không có chữ ký mới, không mở giả thuyết mới; **H3 VẪN MỞ.** Watchdog 0 kích hoạt, 0 false-positive; (1b) 0 kích hoạt (đúng thiết kế). 0 reboot trong phiên T8 (reboot #43 trước phiên); replay không tới tự nhiên (T5 repair sớm) — lần thứ 3 liên tiếp. RAM avail min 677 MB (06:29:04Z, cửa sổ harness); balloon 0 mẫu ghim trần (max 87,9% trần, n=33). Stage `phase9-round152-t8-viteharness.txt` (1 entry NUL). LIMITS 38.561 B md5 `5405d5ff…` (oversize).

## §9. T9 — Headroom 82 → 0 LẦN ĐẦU BẰNG 0 + ENOSPC thật trong journal + balloon ghim mới + birefnet 0 lần thứ 6

- **Headroom inotify: mở 82/82 (05:39:00Z, boot `18e179e0`) → đóng 0/0/0 (07:42:43Z ×2 + 07:43:11Z xác nhận, boot `c741f5e6`)** — giảm −82 trong phiên, qua reboot #44; **dưới ngưỡng < ~1.800 lần thứ mười hai liên tiếp**; tỉ lệ/vite **0,052 → 0** — **LẦN ĐẦU BẰNG 0 từ trước tới nay** (151: 0,057 lúc đóng; 150: 0,20). Số watch giữ ngoài cell suy ra: 63.665 lúc mở → **63.747/63.747 lúc đóng (bảng watch đầy hẳn)**. Quyết parent (g) đợt 151 "vẫn chỉ theo dõi" đứng — T9 chỉ theo dõi, không báo riêng, NHƯNG ghi rõ dữ kiện mới: **journal boot c741f5e6 có 35 dòng lỗi ENOSPC thật** của systemd (07:05:59–07:45:00Z, cadence ~70 s — `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`) — lần đầu bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9 (đợt 151: 0 dòng). **Quyết (g) "chỉ theo dõi" có thể cần xem lại — ĐƯA VÀO §12.1 (b), T10 không tự đổi.**
- **Balloon GHIM TRẦN ĐỢT MỚI — 27/124 mẫu, 5 chuỗi, HAI boot:** boot 18e179e0 chuỗi 1 (06:43:21–06:46:21Z, 4 mẫu) + chuỗi 2 (06:50:21–07:01:21Z, 12 mẫu, 11 phút); boot c741f5e6 (sau #44) chuỗi 3 (07:21:33–07:24:33Z, 4 mẫu) + chuỗi 4 (07:32:33Z, 1 mẫu) + chuỗi 5 (07:36:33–07:41:33Z, 6 mẫu). **Cả 5 chuỗi đều quan sát được điểm đứt** (khác đợt 151: chạm cuối còn mở lúc đóng). Phán theo quy tắc quyết (e): đợt 152 là đợt ghim MỚI, không nối đợt 151 (cách đợt 151 một reboot #43 + xả sâu tới 2,61M kB + ~1h22m không ghim). T10 xác nhận cách đếm trong đợt: 1 episode hay 5 chuỗi — xem §12.1 (g). Chuỗi ghim đợt 151 trên fad2aab9 ĐÃ KẾT THÚC theo reboot #43.
- **RAM:** sampler **124 mẫu, 05:39:17–07:42:34Z, HAI boot** (86 mẫu boot 18e179e0 + 38 mẫu boot c741f5e6; gap 71 s tại reboot #44). Min **474.688 kB (463,6 MiB) lúc 06:45:21Z** (trong lúc ghim); max **3.964.468 kB (3.871,6 MiB = 63,01% guard) lúc 05:40:17Z** — **cao nhất kể từ đợt 146**; mean 1.297.996 kB. Gate A ≥1024 MiB: **60/124 mẫu**. **0/124 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ sáu liên tiếp.**
- **B2: 24 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN**, 20 spike trong 05:39–05:51Z (suite T1-152) + 1 spike O8 WebKit của T8 lúc 06:15:10Z + 3 spike bão sau reboot #44 (07:05:32Z, 07:10:38Z, 07:11:13Z); **0 spike sau 07:11:13Z (~31 phút yên)**. Đỉnh **11,08 lúc 05:48:34Z** (watcher); sampler load1 max **11,15 lúc 05:48:18Z**. **ffmpeg testsrc2 geq là driver của 5/24 spike.**
- **Reboot #44 giữa phiên (btime 07:04:11Z):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 07:05:32Z, gap phủ sóng 71 s. **Dấu hiệu đồng hồ: btime boot mới (07:04:11Z) SỚM HƠN 10 s so với mẫu cuối boot cũ (07:04:21Z)** — đồng hồ lùi ≥10 s tại #44 (cùng họ #41 ≥+20 s, #42 15 s). Stage `phase9-round152-t9-headroom.txt` (1 entry NUL). LIMITS 62.144 B (oversize).

## §10. T10 — Kiểm chứng độc lập lúc đóng

### §10.1 Cờ `.done`: 9/9 CÓ MẶT trên đĩa lúc đóng

`ls` trực tiếp `hidden_files` lúc đóng (~08:06Z): round152-t0.done 05:52:33Z, t1 05:51:37Z, t2 06:18:31Z, t4 06:13:53Z, t5 06:04:27Z, t6 05:54:54Z, t7 08:02:00Z, t8 06:38:34Z, t9 07:54:47Z. **9/9 cờ đủ** (t3 không có theo thiết kế). Nội dung 9/9 luồng đủ trên đĩa (LIMITS + paths + thư mục làm việc). Caveat: cờ T7 0 byte (F-152-T10-5) — nội dung T7 nằm trong `round152-t7/NOTES.md` (16.838 B, đầy đủ 7 lần kiểm) + LIMITS T7 (27.760 B, 08:01Z); cờ T7 vẫn tính là có mặt vì file tồn tại và nội dung đầy đủ trên đĩa.

### §10.2 O8 xác nhận độc lập

Đọc JSON gốc bằng python (không tin mù LIMITS T8): 2 file WebKit stamped riêng biệt — `o8w-clicktest-report-2026-11-20T06-14-28-18e179e0-pid39105.json` (21 kết quả, 0 fail, md5 `25318b62…`) và `o8w-clicktest-report-2026-11-20T06-15-29-18e179e0-pid39569.json` (21 kết quả, 0 fail, md5 `86fbf704…`, bằng file `o8w-clicktest-report.json` latest — đúng vì attempt2 là lần cuối); Chromium `o8-clicktest-report-2026-11-20T06-16-26-18e179e0-pid39921.json` (21 kết quả, 0 fail, md5 `5af121e3…`). Cả 3 JSON mang khối `run` (stamp + bootId `18e179e0` + pid). Log driver `o8-152t8.log`: 2 dòng kết quả WebKit 21/21 + 1 dòng Chromium 21/21, exit 0/0/0, 06:14:27–06:17:18Z, boot 18e179e0, preview.tsx 530e10a7, script O8 `4994b4fc`. Gate: `smoke/waiter-nohup.log` ghi **GATE-FOUND poll=34 06:13:24Z t4=OK postboot=…/round152-t5/POSTBOOT_PASS (đường a)**; O8 bắt đầu 06:14:27Z — SAU cờ T4 (mtime 06:13:53Z) và SAU lượt yên hợp lệ #20. **Chuỗi WebKit FULL PASS 9 → 10 ĐÃ XÁC NHẬN ĐỘC LẬP.** F-151-T10-2 ĐÓNG: 2 attempt WebKit nay có JSON riêng, md5 khác nhau (không còn ghi đè). Caveat nhỏ: GATE-FOUND poll 34 lúc 06:13:24Z sớm hơn mtime cờ T4 29 s (gate đọc t4=OK từ file attempt-done 06:04Z, không phải cờ .done) — không ảnh hưởng kết luận vì O8 bắt đầu sau cờ.

### §10.3 RAM: T9 đúng, T2 đối chiếu khớp (không có F-152-T9-7 mới)

T10 chạy `awk` trực tiếp trên `round152-t9/ram-sampler.log` (124 dòng): **max avail 3.964.468 kB @05:40:17Z (63,01% guard), min avail 474.688 kB @06:45:21Z** — khớp đúng số T9. T2-152 đối chiếu độc lập: đỉnh 3.964.468 kB = 63,01% guard khớp từng số (đoạn K). **Chốt số chính thức đợt 152: RAM đỉnh 63,01% guard (cao nhất kể từ đợt 146); RAM min 474.688 kB (463,6 MiB).** Không cần đo lại.

### §10.4 Đếm cuối bằng dedup toàn cục MỚI (script `count-final-152-t10.py`, không cộng tay)

- Đợt 152 (trước closing): **9 batch / 13 entry**.
- **Đợt 152 (gồm closing): 10 batch / 15 entry / 15 file duy nhất.**
- **Lũy kế 111–152: 408 batch / 805 entry / 683 file.**
- **Chờ push 136–152: 160 batch / 227 entry / 187 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
- **Tái kiểm 111–151 = 398/790/670 — KHỚP từng số với T1-152; tái kiểm 111–150 = 388/774/658 — KHỚP; tái kiểm 111–149 = 378/756/645 — KHỚP — lần thứ 35 liên tiếp** (T1-152 ghi lần thứ 34, nay +1).
- Overlap đợt 152 với 111–151: **2 file** — `PHASE9_GAP_ANALYSIS.md` (closing, cập nhật §81) + `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` (T0 sửa lại script đã có) — cả 2 đều trùng có lý do (sửa lại file đã có / cập nhật hồ sơ chung, không phải stage trùng vô ý). Đính chính overlap đợt 151 (F-152-T1-2): overlap thật là **4 file** (thêm `PHASE9_GAP_ANALYSIS.md` trong file closing), không phải 3 như aggregate §10.4 đợt 151 — tổng số không đổi.
- Purity: 0 lỗi (1.056 file paths rounds ≤152 quét, NUL-delimited, không newline, không entry rỗng). 0 file thiếu trên đĩa sau khi T10 viết xong aggregate (lúc chạy script lần đầu, aggregate chưa viết nên báo thiếu 1 — đã viết xong và chạy lại, 0 thiếu).

### §10.5 Cây / lock / process lúc đóng

- Cây md5 lúc đóng (~08:06Z): preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141` — **khớp đúng hồ sơ T10-151 lúc đóng, không đổi ngoài ý muốn**. test-vite-lock-v2.sh `a89c0676` (sau (A)), test_integration.sh `a6b8cfc0` (sau nối V19) — khớp T1-152.
- Lock queue: **101 file** (100 sau prune T6 lần 27 + 1 cooldown `cooldown-t8-round152` T8 thêm sau — đúng mẫu đợt 150/151; T8 KHÔNG thêm cooldown thứ hai). Lock TRỐNG (log cuối RELEASED 06:33:45Z, 0 ticket giữ).
- **0 process sót:** `ps` lúc đóng chỉ còn systemd/hatch + lệnh kiểm của T10; không còn vite/playwright/chromium/webkit/watcher/sampler/poller nào của đợt 152. `/tmp/.X11-unix/` trống.
- Boot lúc đóng: `c741f5e6` (btime 07:04:11Z, #44); không reboot nào sau #44.
- Watcher replay-watch-152: pid 17990 chết theo reboot #44 (log cuối 07:04:36Z); T5 viết "watcher vẫn chạy tới 08:30Z" TRƯỚC #44 — xem F-152-T10-4.
- **T10 KHÔNG chạy lại toàn bộ suite** (dựa vào suite 28/28 của T1-152 chạy trên boot mới `18e179e0` + kiểm md5/cây/lock lúc đóng — F-152-T10-3, cùng mẫu F-151-T10-3).

### §10.6 T10 đề xuất: CHẤP NHẬN đợt 152

Căn cứ: (1) 9/9 cờ `.done` trên đĩa, nội dung 9/9 luồng đủ; (2) T1 verify 151 PASS + suite 28/28 trên boot mới; (3) T0 sửa xong F-151-T10-2 ở gốc và kiểm chứng bằng chạy thật (2 JSON WebKit riêng biệt); (4) T2 chứng nhận mù #74?/#75? theo luật gap + gap #42/#43 dạng khoảng ứng viên (chờ parent xác nhận §12.1 (a)); (5) #22 có lượt hợp lệ mới #20 (thứ hai liên tiếp); (6) O8 3/3 PASS sau lượt yên hợp lệ, chuỗi FULL PASS 9 → 10 đã xác nhận độc lập; (7) (A) kiểm chứng lại 120/120 PASS dưới churn, chuỗi xanh kép 1 → 2; (8) quyết (q) có đáp án (pid 15613 không phải watcher) + repair sớm (h) kiểm chứng live lần đầu; (9) harness 6/6, 0 kẹt, 85m4 hết kẹt; (10) run 151 SUCCEEDED với margin thoải mái 1.828 s.

### §10.7 Khiếm khuyết lớn của đợt (caveat — parent cân nhắc khi quyết)

(a) reboot #43 TRƯỚC phiên (mở mù #75?) + reboot #44 GIỮA phiên (viết lại run 152, điểm (m) thứ 5); (b) headroom chạm đúng **0 lần đầu** + 35 dòng ENOSPC thật trong journal — quyết (g) "chỉ theo dõi" có thể cần xem lại; (c) #22 lượt hợp lệ #20 median ĐÚNG ngưỡng 60,0 ms (không có biên an toàn), P3' 32/34 vẫn không tròn lần thứ hai liên tiếp; (d) HB muộn +891 s lần thứ 8 + khoảng im lặng scheduler 1.818 s bao trùm #43 (nguyên nhân chưa xác định); (e) run 152 vẫn `running` lúc đóng, kết cục thuộc T7-153; (f) T10 không chạy lại toàn bộ suite (F-152-T10-3); (g) birefnet 0 thử lần thứ sáu liên tiếp; (h) RAM min 474.688 kB trong lúc ghim (dưới 500 MB); (i) mù #74?/#75? đều MỞ, gap #42/#43 chỉ là ứng viên (chưa chứng nhận); (j) T5 watcher chết theo #44, không khởi động lại sau (F-152-T10-4); (k) cờ T7 0 byte (F-152-T10-5).

### §10.8 Sai số của chính T10-152

- F-152-T10-1 — Script đếm lần đầu chạy TRƯỚC khi aggregate được viết nên báo thiếu 1 file (`docs/PHASE9_ROUND152_LIMITS.md` — chính aggregate này); đã viết xong aggregate và chạy lại script, 0 thiếu. Không ảnh hưởng tổng số.
- F-152-T10-2 — Trong script đếm, dòng `pre` dùng biểu thức set phức tạp để tính unique pre-closing; T10 chỉ dùng số batch/entry pre-closing từ đó (9/13) và lấy unique từ kết quả chính của script (15 file gồm closing) — không cộng tay.
- F-152-T10-3 — T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-152 + kiểm md5/cây/lock lúc đóng — cùng mẫu F-151-T10-3).
- F-152-T10-4 — T5-152 viết "watcher vẫn chạy tới 08:30Z" lúc 06:04Z, TRƯỚC reboot #44 (07:04:11Z); watcher thực tế chết theo #44 (log cuối 07:04:36Z) và không còn process lúc T10 đóng. T10 ghi nhận, không sửa LIMITS T5 (hồ sơ đã đóng — đúng tại thời điểm viết).
- F-152-T10-5 — Cờ `round152-t7.done` 0 byte (T7 viết cờ rỗng, nội dung trong NOTES.md + LIMITS). T10 vẫn tính 9/9 cờ có mặt vì file tồn tại + nội dung T7 đầy đủ trên đĩa; nhắc T7 các đợt sau viết nội dung vào cờ như các luồng khác (quyết (u) đợt 151).

## §11. Nợ mở chuyển đợt 153

1. **Mù #74? MỞ + mù #75? MỞ — giao T2-153** (gap #42 [7.163, 7.167] s + gap #43 [6.939, 6.943] s chỉ là ứng viên; CERT/FULL chính thức giữ 73/88; chuỗi đóng hoàn toàn giữ 9; ứng viên 75/90 chờ parent quyết §12.1 (a)). Khung #117? 6 s danh nghĩa + khung #118? 934 s danh nghĩa.
2. **Mù #76? — giao T2-153** (reboot #44 giữa phiên, btime 07:04:11Z; run 152 bị viết lại started_at, n = 5).
3. **Kết cục run 152 thuộc T7-153** (run vẫn `running` lúc T7 đóng cờ, hạn ngân sách 08:35:51Z; started_at viết lại tại #44, claimed giữ gốc).
4. **H3 vẫn mở, chỉ giám sát thụ động** (quyết (f) đợt 151 — 0 kẹt đợt này nên không có chữ ký mới; đợt 153 T8 tiếp tục chỉ giám sát thụ động, không mở giả thuyết phân biệt mới trừ khi kẹt có chữ ký khác).
5. **Headroom 0 / tỉ lệ-vite 0 — dưới ngưỡng lần thứ 12 liên tiếp, lần đầu bằng 0 + 35 dòng ENOSPC thật trong journal** (quyết (g) "chỉ theo dõi" có thể cần xem lại — chờ quyết §12.1 (b)). Trần 63.747 không đổi. Can thiệp host ngoài tầm cell.
6. **Birefnet 0 thử lần thứ sáu liên tiếp** (cơ chế (a) armed cả phiên; u2net là fallback chính thức; lần FIRE thật đầu tiên chưa kiểm chứng end-to-end). Giữ nguyên sampler + trigger cho đợt 153.
7. **P3' 32/34 — lần thứ hai liên tiếp không tròn trong một lượt hợp lệ** (quyết (n) đợt 151: nếu đợt 152 P3' lại không tròn thì mở xem xét — nay đã xảy ra; chờ quyết §12.1 (c)).
8. **Watcher replay-watch-152 chết theo #44, không khởi động lại sau** — giao T5-153 xem có cần cơ chế watcher sống qua reboot không (quyết (q) đã có đáp án cho pid 15613; đây là vấn đề mới: watcher đợt này cũng chết theo reboot).
9. **Prune lần 28 (T6-153):** tổng lock 100 sau prune 27, lúc T10 đóng đã là 101 (T8 thêm 1 cooldown) — kiểm lại lúc mở đợt 153.
10. **File oversize (cần `ENABLE_PRIVSEP=0` lúc push):** T2 LIMITS 60.360 B, T8 LIMITS 38.561 B, T9 LIMITS 62.144 B (đợt này); aggregate 152 + các LIMITS oversize đợt trước vẫn oversize. File 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
11. **Đếm suite mới: `npm test` nay là 12 pass (V19 đã nối)** — T1/T10 các đợt sau đọc 12, không phải 11; mọi văn bản cũ ghi "11 pass" là số cũ.
12. **Phụ lục số liệu chỉ viết bằng script trích từ log gốc** (bài học từ T9-151 tự bắt lỗi phụ lục gõ tay; T10-152 đã đối chiếu log gốc khi nghi ngờ).
13. **Nợ đứng giữ nguyên:** G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16; quyết parent: để yên, không nhắc lại). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38 G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở theo quyết (g) đợt 143. u2net là fallback chính thức cho birefnet. Mù #64/#62/#61 đoạn B, #56 A, #55 B, #53 B, #51 B, #49 B — không kiểm lại (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

## §12. Chờ quyết parent

### §12.1 Câu hỏi mở (đánh số theo thứ tự ưu tiên — parent quyết, T10 không tự chốt)

(a) **Verdict đợt 152: CHẤP NHẬN hay không?** T10 đề xuất CHẤP NHẬN (xem §10.6). Caveat: 2 reboot (#43 trước phiên, #44 giữa phiên); headroom 0 lần đầu + ENOSPC thật trong journal; HB muộn +891 s + im lặng 1.818 s; run 152 chưa có kết cục; T10 không chạy lại toàn bộ suite.

(b) **Mù #74?/#75? + gap #42/#43 ứng viên — chấp nhận bằng chứng hỗ trợ để CERT 73 → 75 / FULL 88 → 90, hay giữ mở?** (T2 §4.5 (a)/(b).) Gap #42 [7.163, 7.167] s (giữa 7.165 s), gap #43 [6.939, 6.943] s (giữa 6.941 s); cả hai số danh nghĩa nằm trong khoảng; nhưng không có đo F trực tiếp nào trên boot fad2aab9 (khoảng dựa trên giả định đồng hồ fad2aab9 chính xác lúc đầu boot). Mù #74? J-full có hố 1.589 s không đóng theo luật gap dù bằng chứng hỗ trợ mạnh (26 dòng sampler + 3 session xuyên hố + HB dispatch 04:15:34Z).

(c) **Headroom 0 + 35 dòng ENOSPC thật trong journal — giữ quyết (g) "chỉ theo dõi" hay đổi?** (T9 §1.3.) Lần đầu bảng watch đầy hẳn (63.747/63.747) + lỗi thật thấy được trong journal của một phiên (đợt 151: 0 dòng). Dưới ngưỡng lần thứ 12 liên tiếp; can thiệp host ngoài tầm cell.

(d) **P3' 32/34 lần thứ hai liên tiếp không tròn — mở xem xét hay tiếp tục theo dõi?** (T4; quyết (n) đợt 151 nói nếu đợt 152 P3' lại không tròn thì mở xem xét — nay đã xảy ra.) (c2)=0 occurrence đợt này; cộng dồn P-counts không đổi.

(e) **n mẫu (m) = 5 (#38 âm, #39/#41/#42/#44 dương) — ghi nhận, điều tra (m) vẫn đóng?** Requeue sau #44 là btime + 40,640 s (trong dải 33–45 s). #43 là không-test (không có run đang chạy), không tính vào n.

(f) **Run 151 SUCCEEDED margin 1.828 s — chấp nhận verdict của T7?** #43 không giết/timeout run 151 (finished 05:05:23Z, trước btime #43 934 s); started_at không bị viết lại lần nữa. 3 lần đọc DB độc lập khớp nhau.

(g) **Balloon ghim trần đợt mới — 27/124 mẫu, 5 chuỗi, 2 boot: đếm là 1 episode hay 5 chuỗi?** (T9 §2.2.) T9 phán đợt ghim MỚI theo quyết (e) (cách đợt 151 một reboot #43 + xả sâu tới 2,61M kB + ~1h22m không ghim); cả 5 chuỗi đều quan sát được điểm đứt (khác đợt 151: chạm cuối còn mở lúc đóng).

(h) **H3 vẫn mở, chỉ giám sát thụ động — giữ nguyên?** (T8.) 0 kẹt đợt này nên không có chữ ký mới; watchdog 0 kích hoạt, 0 false-positive.

(i) **Watcher replay-watch-152 chết theo #44, không khởi động lại sau — giao T5-153 xem cơ chế watcher sống qua reboot?** (T5; F-152-T10-4.) Quyết (q) đợt 151 đã có đáp án cho pid 15613 (không phải watcher khởi động lại); đây là vấn đề mới.

(j) **O8 chuỗi 9 → 10 — xác nhận?** T10 xác nhận độc lập bằng JSON gốc (2 file WebKit stamped riêng biệt, md5 khác nhau + Chromium) + log gate (GATE-FOUND 06:13:24Z → O8 06:14:27Z, sau lượt yên hợp lệ #20). F-151-T10-2 đã đóng live.

(k) **T10 không chạy lại toàn bộ suite — chấp nhận cách đóng sổ này cho đợt 152?** (dựa vào suite 28/28 của T1-152 chạy trên boot mới + kiểm md5/cây/lock lúc đóng — cùng mẫu F-151-T10-3, quyết (x) đợt 151).

(l) **Cờ T7 0 byte — nhắc T7 các đợt sau viết nội dung vào cờ như các luồng khác?** (F-152-T10-5.) Nội dung T7 đợt này đầy đủ trong NOTES.md + LIMITS, không ảnh hưởng verdict.

### §12.2 (đã quyết ở §12.3 dưới)

### §12.3 QUYẾT PARENT (main chat, ~15:2x +07 20/11/2026 — parent viết trực tiếp; §12.3 trống khi đọc, như đợt 146/147/148/149/150/151)

- **(a) Đợt 152: CHẤP NHẬN.** 9/9 cờ + T10 đủ; T10 đóng ~08:15Z — trong hạn cứng 08:30Z (đóng đúng hạn). O8 JSON ghi đè đã sửa xong ở gốc và kiểm chứng live; (A) kiểm chứng lại 120/120 PASS; lượt yên hợp lệ #20 mới (median đúng 60,0 ms). Caveat ghi nhận, không cản chấp nhận: 2 reboot; headroom 0 + ENOSPC thật; HB muộn +891 s + im lặng 1.818 s; run 152 chưa có kết cục; T10 không chạy lại toàn bộ suite (xem (k)).
- **(b) Mù #74?/#75? + gap #42/#43 ứng viên: GIỮ MỞ — chưa chứng nhận.** CERT/FULL chính thức GIỮ 73/88 (ứng viên 75/90 chờ bằng chứng mạnh hơn). Lý do: không có đo F trực tiếp nào trên boot fad2aab9 (khoảng dựa trên giả định đồng hồ fad2aab9 chính xác lúc đầu boot — mà nghịch lý đồng hồ ≥ +18 s tại #42 đã đối chiếu lại làm lung lay giả định này); hố J-full 1.589 s của mù #74? không đóng theo luật gap (bằng chứng hỗ trợ — 26 dòng sampler + 3 session xuyên hố + HB dispatch — cùng họ với log-line continuity, đã bác làm closer ở quyết (e) đợt 143). Giao T2-153 tìm đo F trực tiếp hoặc bằng chứng mạnh hơn.
- **(c) Headroom 0 + 35 dòng ENOSPC thật trong journal: GIỮ QUYẾT (g) "chỉ theo dõi", không đổi.** Vẫn không có hành động khả thi từ trong cell (can thiệp host ngoài tầm; vòng lặp vẫn chạy vì vite tạm dùng 0 watch). Dưới ngưỡng lần thứ 12 liên tiếp; lần đầu bằng 0 và lần đầu cạn watch gây lỗi thấy được — bản tin đợt này ghi một dòng cập nhật theo quy tắc đứng (báo khi < ~1.800).
- **(d) P3' 32/34 lần thứ hai liên tiếp không tròn: MỞ XEM XÉT** (theo quyết (n) đợt 151 — đã tái diễn thì mở xem xét). Phạm vi: T4-153 xem xét 2 tick P3' không đạt (chuyện gì xảy ra — đóng băng nhãn thật hay artifact đo?). Hạn một đợt; nếu giải thích được thì ghi nhận và đóng; nếu chỉ ra vấn đề thật với mô hình nhãn thì báo cáo.
- **(e) n mẫu (m) = 5: GHI NHẬN — điều tra (m) VẪN ĐÓNG.** (#38 âm, #39/#41/#42/#44 dương; requeue sau #44 là btime + 40,640 s, trong dải 33–45 s.) #43 là không-test (không có run đang chạy), không tính vào n. Cơ chế đã xác định; đây chỉ là điểm dữ liệu xác nhận thêm.
- **(f) Run 151 SUCCEEDED margin 1.828 s: CHẤP NHẬN verdict của T7.** #43 không giết/timeout run 151 (finished 05:05:23Z, trước btime #43 934 s); started_at không bị viết lại lần nữa. 3 lần đọc DB độc lập khớp nhau.
- **(g) Balloon ghim trần đợt mới — 27/124 mẫu, 5 chuỗi, 2 boot: ĐẾM LÀ 1 EPISODE (1 đợt ghim mới), chứa 5 chuỗi.** XÁC NHẬN phán của T9 theo quyết (e) (cách đợt 151 một reboot #43 + xả sâu tới 2,61M kB + ~1h22m không ghim); cả 5 chuỗi đều quan sát được điểm đứt. Chuỗi ghim tính theo đợt (= 1), không tính 5 chuỗi riêng.
- **(h) H3 vẫn mở, chỉ giám sát thụ động: GIỮ NGUYÊN.** 0 kẹt đợt này nên không có chữ ký mới; watchdog 0 kích hoạt, 0 false-positive.
- **(i) Watcher replay-watch-152 chết theo #44, không khởi động lại sau: GIAO T5-153 KIỂM TRA CÓ GIỚI HẠN** (không phải xây cơ chế ngay). Kiểm tra: watcher có cần sống qua reboot không (chết theo reboot có gây vấn đề thật cho công việc replay/postboot của đợt không?). Nếu có thì đề xuất cơ chế; nếu không thì ghi nhận. Lưu ý: quyết (q) đợt 149 đã chốt không cần cơ chế tự hồi phục cho sampler (khởi động lại bằng tay 87 s là đủ) — kiểm tra này chỉ về watcher, vốn chết mà không ai khởi động lại.
- **(j) O8 chuỗi 9 → 10: XÁC NHẬN.** T10 xác nhận độc lập bằng JSON gốc (2 file WebKit stamped riêng biệt, md5 khác nhau + Chromium) + log gate (GATE-FOUND 06:13:24Z → O8 06:14:27Z, sau lượt yên hợp lệ #20). F-151-T10-2 (bug O8 JSON ghi đè) ĐÓNG LIVE.
- **(k) T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 152** (dựa vào suite 28/28 của T1-152 chạy trên boot mới + kiểm md5/cây/lock lúc đóng — cùng mẫu quyết (x) đợt 151). Quy tắc đứng giữ nguyên: nếu T1 không chạy được suite đầy đủ thì T10 phải chạy lại trước khi đóng.
- **(l) Cờ T7 0 byte: NHẮC T7 các đợt sau viết nội dung vào cờ như các luồng khác** (ghi vào brief đợt 153). Nội dung T7 đợt này đầy đủ trong NOTES.md + LIMITS, không ảnh hưởng verdict — chỉ là sửa quy trình ghi chép.

- Ghi chú nguồn gốc: §12.3 trống khi đọc (T10 để trống, kèm chú thích HTML "Parent viết quyết trực tiếp vào đây"); nội dung các quyết trên là parent viết trực tiếp — KHÔNG có quyết nào được điền sẵn (như đợt 146/147/148/149/150/151).

---

## Batch stage / Tổng batch

Batch stage đợt 152 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round152-*.txt`):

- `phase9-round152-t0-o8json.txt` — 3 entry (T0: sửa lỗi JSON O8 ghi đè + LIMITS)
- `phase9-round152-t1-verify151.txt` — 1 entry (T1: LIMITS verify đợt 151)
- `phase9-round152-t2-eperm.txt` — 1 entry (T2: LIMITS EPERM + mù #74?/#75?)
- `phase9-round152-t4-quiet22.txt` — 3 entry (T4: LIMITS #22 + poll-wait + run-attempt scripts)
- `phase9-round152-t5-infra.txt` — 1 entry (T5: LIMITS infra)
- `phase9-round152-t6-lockhealth.txt` — 1 entry (T6: LIMITS lock)
- `phase9-round152-t7-scheduler.txt` — 1 entry (T7: LIMITS scheduler)
- `phase9-round152-t8-viteharness.txt` — 1 entry (T8: LIMITS O8 + harness)
- `phase9-round152-t9-headroom.txt` — 1 entry (T9: LIMITS headroom + RAM + birefnet)
- `phase9-round152-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §81)

**Tổng batch đợt 152: 10 batch / 15 entry / 15 file duy nhất.**
**Lũy kế 111–152: 408 batch / 805 entry / 683 file.**
**Tổng batch chờ user push (đợt 136–152): 160 batch / 227 entry / 187 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)
