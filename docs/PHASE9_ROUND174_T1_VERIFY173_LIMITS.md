# PHASE9 — Đợt 174, T1: Verify đợt 173 — LIMITS

T1-174 verify đợt 173. Đợt 174 mở 23:35:51Z 22/11/2026 (06:35:51 +07 23/11). T1 chạy 23:38–23:52Z, boot `3c704685` (btime 1795388376 = 22:59:36Z — ứng viên #85; số hiệu chờ T0-174 xác minh 9 nguồn; T1 không tự chốt số hiệu). Hạn cờ ~02:00Z 23/11, hạn cứng ~02:30Z 23/11.

- **Verdict: PASS — nội dung đợt 173 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số quyết parent (p) §12.3 đợt 173 bằng script dedup toàn cục VIẾT MỚI HOÀN TOÀN (`count-final-174-t1.py`, không tái dùng script T1-173/T10-173/`parent-recount-172.py`; sắp xếp theo round tăng dần — bài học F-173-T1-3) (**lần thứ 72 liên tiếp** theo chuỗi quyết parent — xem §1); đợt 173 = **10 batch / 15 entry / 15 đường dẫn khác nhau / 13 file mới**; suite chạy lại **28/28 exit 0 trên boot 3c704685** (8m50s, 23:40:11–23:49:01Z); `npm test` **12 pass**; O8 đợt 173 xác nhận độc lập từ JSON gốc (T0 FAIL WebKit ×2 + Chromium PASS trên #83; T8 PASS 3/3 trên #84 — chuỗi GIỮ 24 theo quyết parent (c) — xem §3); **bộ O8 MỚI của T0-174 trên boot 3c704685: WebKit 21/21 ×2 + Chromium 21/21, xác nhận độc lập từ JSON gốc** (xem §3); **9/9 cờ đợt 173 còn trên đĩa, đều có nội dung** (+ cờ closing T10 — xem §5).
- **Caveat lớn (đọc trước):** quyết parent §12.3 đợt 173 đã được parent kiểm lại và chấp nhận/duyệt toàn bộ: (a) đợt 173 CHẤP NHẬN; (b) POSTBOOT_PASS #83 chọn (b2) — #83 thành boot thứ 16 không cờ, (b1) bị bác; (c) O8 chuỗi **GIỮ 24, KHÔNG TĂNG**; (d) INSIDE #82 TRUE (FULL128) — chuỗi MỚI dài 1; (e) **(m) #82 DƯƠNG**; (m) #83 KHÔNG PHẢI ĐIỂM; (m) #84/#85 DƯƠNG ỨNG VIÊN (sơ bộ) — phân loại cuối thuộc T2-174 + parent 174; (f) **n ứng viên 30/31**; n chính thức GIỮ 14; (g) Balloon E-177 KẾT THÚC GIỮ 27 mẫu + E-178 7 + E-179 56 + E-180 2 — đếm 3 episode theo quy tắc cơ học; (h) #82/#83 KHÔNG giết holder — chuỗi từ #69: **15 reboot**; (A) 120/120 lần thứ 23 + prune lần 48; #85 có giết holder không — thuộc T6-174; (i) (1c') (c') GIỮ NGUYÊN diag-only; (f') V1 ĐÃ TRIỂN KHAI; Q3 heartbeat 84l10 ĐÃ TRIỂN KHAI; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 1 → 2; H3 vẫn mở, chỉ giám sát thụ động; (j) POSTBOOT_PASS #84 CÓ (repair-sớm-quyết-h, poll=1) đứng cho gate (a) VỚI caveat mode repair; #82 KHÔNG CÓ (boot thứ 15 không cờ); hướng (3) VẪN ĐỨNG lần 20; F-172-T6-5 ĐÓNG; F-172-T5-1 ĐÃ GIẢI THÍCH; (k) headroom 0 — GIỮ "chỉ theo dõi" (lần thứ 33); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 2 liên tiếp; ENOSPC ≥84 dòng (đợt thứ 22); (l) mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #42 0 attempt — chuỗi giữ 36; CERT/FULL GIỮ 76/91; (m) run 172 SUCCEEDED 20:16:59Z, margin 1.132 s; run 173 vẫn running — kết cục thuộc T7-174; (n) DR 23:00Z THIẾU — chuỗi cửa lành hoàn toàn 11 đợt (162–172) DỨT; HB 44/429, DR 50/286; (o) **F-173-T1-1 ĐÓNG** (xem §6); F-173-T0-3 + F-173-T7-2 CHƯA CHỐT (giao T7-174); marker 37 reboot (chờ T0-174 xác nhận #85); gap #82→#83 = 5.099 s, #83→#84 = 2.128 s, #84→#85 = 7.101 s; (p) đếm cuối 10/15/15/13; lũy kế 618/1.092/946/768; chờ push 80/113/106/104 — **lần thứ 71 liên tiếp đếm khớp**; (q) **KHÔNG PUSH** — 80 batch / 113 entry / 104 file chờ user push (đợt 166–173) (+ file oversize 6,4 MB chưa quyết).

## §1. Đếm cuối: KHỚP từng số quyết parent (p) §12.3 đợt 173 — lần thứ 72 liên tiếp

Script `count-final-174-t1.py` VIẾT MỚI (hidden_files/round174-t1/; output `count-final-174-t1.txt`). Quét 1.266 file `phase9-round*.txt` khớp mẫu, round 1–173; 0 file không khớp mẫu trong số đã quét; purity: 0 entry rỗng, 0 entry chứa newline, 0 trùng trong cùng file, 0 file không kết thúc bằng NUL; tổng entry 6.962. Sắp xếp theo round tăng dần bằng số (F-173-T1-3); chuẩn hoá đường dẫn (bỏ prefix tuyệt đối `~/workspace/repo-1/`, `./`) TRƯỚC khi kiểm thiếu (bài học §10.5 (xi) aggregate 173).

- **Đợt 173 = 10 batch / 15 entry / 15 đường dẫn khác nhau / 13 file mới** (gồm closing: aggregate mới + GAP đã có). File mới: 9 LIMITS (T0/T1/T2/T4/T5/T6/T7/T8/T9) + aggregate 173 + 3 script T4 (`distinct-seq-173.py`, `poll-wait-t4-173.sh`, `run-attempt-173.sh`). Overlap duy nhất: `PHASE9_GAP_ANALYSIS.md` (first_seen round 59) + `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` (T8 sửa Q3, first_seen round 84). Kiểm chéo lần 2 (shell union-trừ: 15 distinct, new 13, overlap đúng 2 file trên): KHỚP.
- **Lũy kế 111–173 = 618 batch / 1.092 entry / 946 đường dẫn khác nhau / 768 file mới** — KHỚP quyết parent (p).
- **Chờ push 166–173 = 80 batch / 113 entry / 106 đường dẫn khác nhau / 104 file mới** — KHỚP quyết parent (p)/(q).
- **Tái kiểm 111–172 = 608/1.077/933** (new 755); **111–171 = 598/1.063/920** (new 742); **111–170 = 588/1.049/907** (new 729) — KHỚP từng số quyết parent các đợt trước.
- **Tổng mọi round (1–173) = 1.266 batch / 6.962 entry / 3.751 đường dẫn duy nhất** — KHỚP aggregate 173 §10.3.
- **0 file thiếu trên đĩa** (3.751 đường dẫn duy nhất toàn bộ mọi round + riêng đợt 173: 0 thiếu). 4 entry đường dẫn tuyệt đối ở round 143/153 (mẫu §10.5 (xi)) kiểm trực tiếp bằng `ls` — cả 4 đều tồn tại (`docs/PHASE9_ROUND143_T8_VITEHARNESS_LIMITS.md`, `docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md`, `apps/web/scripts/poll-wait-t4-153.sh`, `apps/web/scripts/run-attempt-153.sh`).
- Footer "Batch stage / Tổng batch" aggregate 173 CÓ ĐẦY ĐỦ (10 batch liệt kê + lũy kế 618/1.092/946/768 + chờ push 80/113/106/104).

## §2. Suite chạy lại: 28/28 exit 0 trên boot 3c704685

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (23:40:11–23:49:01Z, 8m50s, boot `3c704685`, RAMavail lúc mở 388 MB). Script `round174-t1-verify.sh` (adapt từ T1-173; `run()` ghi thời gian bắt đầu/kết thúc từng mục). Log `round174-t1-suites.log` (970 dòng — đúng bằng T1-173).
- **`npm test` đầy đủ: 12 pass, 0 fail** — 12 dòng `✅ PASS` chính xác trong mục npm-test-full (đếm bằng chuỗi chính xác, không đếm lỏng); 0 dòng `❌ FAIL`; dòng tổng `== KẾT QUẢ: 12 pass, 0 fail ==` khớp.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — khớp hồ sơ T10-171/T1-172/T1-173 lúc đóng. Các luồng đợt 174 khác chạy song song nhưng KHÔNG sửa 6 file theo dõi này trong cửa sổ verify.
- **Caveat:** suite chạy trên boot `3c704685` (btime 22:59:36Z, ứng viên #85 — boot lúc T10-173 đóng sổ), KHÔNG phải boot #83/#84 của đợt 173 — xem F-174-T1-4. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8/T4 đợt 173 xác minh từ file gốc đã đóng băng trên #83/#84. Suite CHẬM hơn T1-173 59 s (8m50s vs 7m51s) dù cùng 28 mục — RAMavail lúc mở thấp hơn nhiều (388 MB vs 855 MB — xem F-174-T1-2); mục npm-test-full chiếm ~3m41s (23:45:19–23:49:00Z); 0 fail, 0 rerun. 0 process suite nào của T1 còn sống lúc đóng (`VERIFY DONE 23:49:01Z`).
- **X11:** `/tmp/.X11-unix/` lúc T1 mở (23:40Z): **TRỐNG** (0 socket); lúc đóng (~23:50Z): **3 socket mồ côi X193/X194/X195 (mtime 23:45Z)** — xuất hiện đúng lúc mục xvfb-lock của suite T1 chạy (23:45:10Z) — xem F-174-T1-1 (giao T8-174 dọn lúc đóng theo checklist (o)). Cùng 3 số hiệu socket như đợt 172/173 (đã được T8 dọn, nay tạo lại).

## §3. O8 — Xác nhận độc lập bằng JSON gốc

### §3.1. Bộ O8 đợt 173 (đã đóng băng): T0 FAIL WebKit ×2 + Chromium PASS; T8 PASS 3/3 — chuỗi GIỮ 24

T1 KHÔNG chạy O8 riêng cho đợt 173: cả 6 file JSON gốc còn đủ trên đĩa; xác minh độc lập bằng cách đếm lại từng file bằng python + tính lại md5:

- File gốc `round173-t0/o8-webkit/o8w-clicktest-report-2026-11-22T20-44-27-dd08464a-pid19714.json` (WebKit attempt1): **n=2 kết quả, ok=1, fail=1** (S1 FAIL toggle rect + PAGE-CRASH), md5 `c87e14e6…` — KHỚP chẩn đoán renderer chết của T0-173 (aggregate §1, exit=2). Boot `dd08464a` (#83).
- File gốc `.../o8w-clicktest-report-2026-11-22T20-45-00-dd08464a-pid20320.json` (WebKit attempt2): **n=0 kết quả** (timeout chờ project mẫu tự load, không ghi được kết quả nào) — KHỚP FAIL exit=2 của T0-173, md5 `b389bf6b…`.
- File gốc `round173-t0/o8-chromium/o8-clicktest-report-2026-11-22T20-49-12-dd08464a-pid28601.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `58c9a64e…` — KHỚP Chromium PASS 21/21 của T0-173.
- File gốc `round173-t8/o8-webkit/o8w-clicktest-report-2026-11-22T22-32-07-4ae2d2ea-pid28907.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `03561009…` — KHỚP aggregate §10.2.
- File gốc `.../o8w-clicktest-report-2026-11-22T22-33-08-4ae2d2ea-pid29392.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `073ce61c…` — KHỚP aggregate §10.2.
- File gốc `round173-t8/o8-chromium/o8-clicktest-report-2026-11-22T22-33-57-4ae2d2ea-pid29774.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `428e80d4…` — KHỚP aggregate §10.2.
- **Chuỗi WebKit FULL PASS GIỮ 24 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả + quyết parent (c) đợt 173** (T4-173 0 attempt nên không có lượt yên hợp lệ trên boot đo; T0 FAIL WebKit ×2 trên #83 là renderer chết tiền-postboot, không phải hồi quy code; T8 PASS 3/3 trên #84). T1 không chạy O8 riêng cho đợt 173.

### §3.2. Bộ O8 MỚI của T0-174 trên boot 3c704685: PASS 3/3 — xác nhận độc lập từ JSON gốc

Lúc T1 kiểm (~23:52Z), T0-174 đã có bộ O8 mới trên boot hiện tại `3c704685` (ứng viên #85) — xác minh độc lập từ 3 file JSON gốc (đếm lại bằng python + md5):

- File gốc `round174-t0/o8-webkit/o8w-clicktest-report-2026-11-22T23-43-44-3c704685-pid18668.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `f91f8fe6…`.
- File gốc `.../o8w-clicktest-report-2026-11-22T23-45-11-3c704685-pid25983.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `d9f19eb6…`.
- File gốc `round174-t0/o8-chromium/o8-clicktest-report-2026-11-22T23-46-37-3c704685-pid32439.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `1e6268af…`; log ghi `O8-Chromium exit=0 2026-11-22T23:47:50Z`.
- **WebKit PASS lại trên boot 3c704685 sau 2 lần FAIL của T0-173 trên #83** — cùng cây code (md5 cây khớp §2), củng cố chẩn đoán FAIL đợt 173 là renderer chết tiền-postboot, không phải hồi quy code. **Chuỗi FULL PASS có tăng hay không thuộc T8-174/T10-174 + parent 174** (cần verdict lượt yên #43 của T4-174 trên cùng boot + gate — T1 không phán). Caveat: bộ O8 này chạy 23:43–23:47Z, CHỒNG với suite của T1 (23:40–23:49Z) — cả hai đều PASS, không có dấu hiệu tranh tài nguyên làm sai kết quả (xem F-174-T1-3).

## §4. T4-173 — không có attempt JSON để tính lại (0 attempt đã xác nhận)

T4-173 có 0 attempt (lượt yên #42 không có lượt hợp lệ) — kiểm thư mục `round173-t4/`: **không có file JSON attempt nào** (chỉ có script `run-attempt-173.sh`, `t4-attempt-inner.sh` và các script analyze) — nhất quán với aggregate §4. Vì vậy không có median tickCost nào để tính lại độc lập đợt này (khác đợt 172, T1-173 đã tính lại median 46,0). Các số P1/P2/P3/P3'/P7 cộng dồn của T4 chỉ đối chiếu qua LIMITS T4-173 + aggregate §4 — không đạo lại từ đầu (xem F-174-T1-4).

## §5. Cờ `.done` đợt 173: 9/9 còn trên đĩa, đều có nội dung (+ cờ closing T10)

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round173-t0.done | 20:54:44 | 1.616 B |
| round173-t1.done | 20:53:27 | 2.627 B |
| round173-t2.done | 21:21:13 | 1.527 B |
| round173-t4.done | 22:38:03 | 1.810 B |
| round173-t5.done | 21:41:07 | 2.522 B |
| round173-t6.done | 20:55:52 | 1.280 B |
| round173-t7.done | 23:20:11 | 3.054 B |
| round173-t8.done | 23:13:17 | 2.028 B |
| round173-t9.done (*) | 23:26:27 | 4.735 B |
| round173-t10.done | 23:35:34 | 883 B |

(*) Cờ T9 nằm ở `hidden_files/round173-t9/round173-t9.done` (thư mục con), không phải `hidden_files/round173-t9.done` như quy ước — T1 kiểm nội dung trực tiếp tại đường dẫn thực tế (đọc 120 byte đầu: "T9-173 DONE ~23:26Z 22/11/2026..."), vẫn tính là có cờ (tiền lệ đợt 172/173). Kích thước 9 cờ luồng KHỚP từng số aggregate 173 §10.1. Nội dung từng cờ đã đọc thử (120 byte đầu) — đều là văn bản DONE có ý nghĩa, không cờ rỗng. 6/9 cờ luồng trong hạn cờ ~23:00Z (T7 trễ ~19', T8 trễ ~13', T9 trễ ~26' — cả ba do reboot #85 sát hạn cờ, trong hạn cứng ~23:30Z); T10 đóng 23:35:34Z (parent viết trực tiếp, quá hạn cứng ~5' do reboot #85 — đã ghi trong GAP §102).

## §6. Boot + marker lúc T1 đóng

- Boot lúc T1 mở (23:38Z) và lúc đóng (~23:52Z): **`3c704685-a16c-4b61-8573-af6eb7cb48c6`** — ỔN ĐỊNH suốt phiên T1, **không reboot trong phiên** (btime 1795388376 = 22:59:36Z; uptime 38 phút lúc 23:38Z, ~52 phút lúc đóng). Số hiệu #85 chờ T0-174 xác minh 9 nguồn (T1 không chốt).
- Marker `~/.config/vcut-persistence-marker`: CÒN, mtime **2026-11-20 11:39:47.272154981Z không đổi**, 239 B — sống qua #49–#84 = 36 reboot theo đếm của T5-173 (T1-174 không đếm lại độc lập số reboot — chỉ xác nhận marker còn + mtime không đổi; việc marker có sống qua boot 3c704685 hay không thuộc T0-174 xác minh 9 nguồn).
- **F-173-T1-1 ĐÓNG ĐÚNG — đã kiểm:** H1 aggregate 172 nay ghi "# PHASE9 — Đợt 172: LIMITS tổng hợp (aggregate)" (đã sửa); header GAP §102 ghi đúng "Đợt 173 ... verdict CHẤP NHẬN — parent ĐÃ QUYẾT (a) §12.3 aggregate 173"; header GAP §101 ghi đúng đợt 172.

## §7. Đính chính / phát hiện của T1-174 (F-174-T1-*)

- **F-174-T1-1 — 3 socket X11 mồ côi X193/X194/X195 (mtime 23:45Z) xuất hiện trong phiên suite của T1-174 — giao T8-174 dọn lúc đóng.** Lúc T1 mở (23:40Z) `/tmp/.X11-unix/` TRỐNG; socket xuất hiện đúng lúc mục xvfb-lock chạy (23:45:10Z) — cùng mẫu F-173-T1-2, lần thứ ba liên tiếp cùng 3 số hiệu (X193/X194/X195 đã được T8 dọn ở đợt 172/173, nay tạo lại). T1 KHÔNG tự dọn socket (T8 sở hữu dọn socket lúc đóng theo checklist (o)).
- **F-174-T1-2 — RAMavail lúc mở suite chỉ 388 MB (thấp nhất trong các đợt T1 gần đây: T1-173 là 855 MB).** Suite vẫn 28/28 nhưng chậm hơn 59 s (8m50s vs 7m51s); mục npm-test-full chiếm ~3m41s. Không có mục nào fail hay rerun — chỉ ghi nhận, không đổi verdict. Nguyên nhân RAM thấp thuộc T9-174 (balloon/headroom).
- **F-174-T1-3 — Bộ O8 mới của T0-174 PASS 3/3 trên boot 3c704685 (xem §3.2), chạy CHỒNG với suite của T1 (23:43–23:47Z trong cửa sổ suite 23:40–23:49Z).** Cả hai đều PASS (O8 21/21 ×3, suite 28/28) nên không có bằng chứng tranh tài nguyên làm sai kết quả — chỉ ghi nhận sự chồng chéo để T10-174 lưu ý khi đối chiếu thời gian. Việc chuỗi FULL PASS có tăng không thuộc T8-174/T10-174 + parent (cần verdict lượt yên #43 của T4-174).
- **F-174-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-173-T1-4).** Suite T1-174 chạy trên boot `3c704685` (ứng viên #85, boot lúc T10-173 đóng sổ), KHÔNG phải boot #83/#84 của đợt 173. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8 đợt 173 xác minh từ file gốc đã đóng băng trên #83/#84. T1 KHÔNG chạy O8 riêng cho đợt 173 (6 JSON gốc còn đủ — xem §3.1). T4-173 0 attempt nên không có tickCost để tính lại (xem §4). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, (m) #84/#85, INSIDE #83/#84), T7 (scheduler DB, HB/DR, run 173 chi tiết, F-173-T0-3/F-173-T7-2), T5 (apt/dpkg internals, POSTBOOT_PASS #85), T9 (attribution từng spike, ranh giới chuỗi E-178/179/180), T6 (120 lần kiểm soát churn, #85 có giết holder không), T0 (số hiệu boot 3c704685) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. **Kết cục run 173 thuộc T7-174** (T1 không phán). **(m) #84/#85 + INSIDE #83/#84/#85 thuộc T2-174.** **Số hiệu boot 3c704685 thuộc T0-174.**
- **F-174-T1-5 — Không lặp F-173-T1-3:** script đếm lần này viết mới hoàn toàn, sắp xếp theo round tăng dần bằng số ngay từ đầu; kiểm chéo lần 2 (shell union-trừ) khớp từng số, không cần sửa script giữa chừng. Purity 0 cảnh báo.
- **Không lặp F-169-T1-5 — mọi mốc giờ trong LIMITS này đều đọc từ file gốc hoặc `date -u` lúc chạy** (giờ suite 23:40:11–23:49:01Z đọc từ log suite; giờ cờ `.done` đọc từ `stat`).

## §8. Verdict: PASS

Nội dung đợt 173 đứng vững toàn bộ trên boot 3c704685 (suite) + file gốc đóng băng #83/#84 (O8): đếm khớp lần thứ 72 liên tiếp, đợt 173 = 10/15/15 đường dẫn / 13 file mới (khớp aggregate §10.3/footer/GAP §102 + quyết parent (p) §12.3 đợt 173); suite đầy đủ 28/28 (8m50s); `npm test` 12 pass; O8 đợt 173 xác nhận độc lập từ JSON gốc (T0 FAIL WebKit ×2 + Chromium PASS trên #83; T8 PASS 3/3 trên #84 — chuỗi GIỮ 24 theo quyết parent (c)); **bộ O8 MỚI của T0-174 trên boot 3c704685 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21, md5 f91f8fe6/d9f19eb6/1e6268af) — xác nhận độc lập**; F-173-T1-1 ĐÓNG ĐÚNG (nhãn aggregate 172 đã sửa); **9/9 cờ đợt 173 còn trên đĩa, đều có nội dung** (+ cờ closing T10). Không có đính chính nào có trọng lượng — chỉ 3 socket X11 (F-174-T1-1) + RAM thấp lúc mở suite (F-174-T1-2) + O8 mới chồng suite (F-174-T1-3) + phạm vi kiểm có giới hạn (F-174-T1-4), không đổi verdict.

## §9. Cây lúc đóng verify

preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 173 + verify 174. Boot `3c704685` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 23:49:01Z`). `/tmp/.X11-unix/` lúc đóng: 3 socket mồ côi X193/X194/X195 (T1 KHÔNG đụng vào — giao T8-174).

## Batch stage

- File stage: `phase9-round174-t1-verify173.txt` — 1 entry (LIMITS này, NUL-delimited).
- KHÔNG PUSH.
