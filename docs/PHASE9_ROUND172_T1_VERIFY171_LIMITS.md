# PHASE9 — Đợt 172, T1: Verify đợt 171 — LIMITS

T1-172 verify đợt 171. Đợt 172 mở 17:35:51Z 22/11/2026. T1 chạy 17:38–17:50Z, boot `4b9db449` (#81, btime 17:02:05Z — T0-172 đang xác minh 9 nguồn; T10-171 đã xác minh 5 nguồn lúc đóng đợt 171). Hạn cờ ~20:00Z, hạn cứng ~20:30Z.

- **Verdict: PASS — nội dung đợt 171 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số quyết parent (a) §12.3 đợt 171 bằng script dedup toàn cục VIẾT MỚI HOÀN TOÀN (`count-final-172-t1.py`, không tái dùng script T1-171/T10-171/`parent-recount-171.py`; sắp xếp theo (số round, tên file); kiểm chéo độc lập lần 2 bằng union-trừ + lần 3 bằng quét lại toàn bảng cho đợt 171) (**lần thứ 68 liên tiếp** theo chuỗi quyết parent — xem §1); đợt 171 = **10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới**; suite chạy lại **28/28 exit 0 trên boot 4b9db449** (7m18s, 17:40:39–17:47:57Z); `npm test` **12 pass**; O8 xác nhận độc lập từ JSON gốc ×2 bộ (chuỗi FULL PASS **LÊN 23 theo quyết parent (b) đợt 171** — xem §3); median tickCost attempt3 T4-171 tính lại độc lập từ JSON gốc **KHỚP 43,0** (xem §4 — đóng khoảng trống F-171-T10-3); **10/10 cờ đợt 171 còn trên đĩa, đều có nội dung** (9 cờ luồng + cờ closing t10).
- **Caveat lớn (đọc trước):** quyết parent §12.3 đợt 171 đã điền đầy (a)–(o) + parent đã chấp nhận/duyệt toàn bộ (ghi chú nguồn gốc §12.3 aggregate 171): (a) đợt 171 CHẤP NHẬN; (b) O8 chuỗi **LÊN 23** (22 → 23); (c) INSIDE: #79 INSIDE FULL125 → chuỗi MỚI từ #73 dài 6, #80 NGOÀI FULL126 → CHUỖI ĐỨT tại #80 (FULL125 cũng NGOÀI — hai dải đồng thuận); FULL123/FULL124 kiểm lại độc lập ĐẠT — nợ F-170-T10-2 ĐÃ TRẢ; (d) reboot #80 XÁC NHẬN + reboot #81 T10 xác minh 5 nguồn, số hiệu CHỜ T0-172 xác minh 9 nguồn; marker sống qua 33 reboot #49–#81; (e) **(m) #80 KHÔNG PHẢI ĐIỂM**; (m) #56 VẪN CÓ ĐIỀU KIỆN (lần 14); lệch khung #79/#80 không overlap; (f) **n 28/29 (ứng viên)**; n chính thức GIỮ 14; (g) **balloon E-174 KẾT THÚC — GIỮ 47 mẫu; E-175 = 1 EPISODE MỚI** (7 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM); E-173 GIỮ 57 mẫu; E-172 GIỮ 3 mẫu; E-171 GIỮ 12 mẫu; E-170 GIỮ 48 mẫu; E-169 GIỮ 20 mẫu; (h) #79/#80 KHÔNG giết holder — chuỗi từ #69: **12 reboot**; (A) 120/120 lần thứ 21 + prune lần 46; **NHẮC T2 (F-171-T2-1)** + **NHẮC T6 (F-171-T6-1)**; B4 GIỮ NGUYÊN; (i) (1c') (c') GIỮ NGUYÊN diag-only, 0 FP nhưng **BỎ LỠ 1 kẹt thật 85m4** (1 false-negative đúng phạm vi); **KHÔNG sửa (f) đợt này** — giao T8-172 trình đề xuất; **MỞ ĐIỀU TRA RIÊNG 84l10** (phạm vi 3 điểm kẹt, KHÔNG gộp 85m4-P4/86n2-P4-lần3); H3 VẪN MỞ, chỉ giám sát thụ động; (j) POSTBOOT_PASS #80 CHẤP NHẬN đứng cho gate (a) KHÔNG caveat mode repair; #78 KHÔNG CÓ (boot lọt thứ 14); hướng (3) VẪN ĐỨNG lần thứ 18; F-171-T5-1 giao T5-172 theo dõi; điều tra #75 ĐÃ ĐÓNG; (k) headroom 0 — GIỮ "chỉ theo dõi" (lần thứ 31 dưới ngưỡng; cửa sổ thoáng KHÔNG QUAN SÁT ĐƯỢC lần thứ tư liên tiếp); (l) ENOSPC 111 dòng — CHẤP NHẬN làm số chính thức (đợt thứ 20); (m) mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (hole-recheck lần 15: 337 hit, 0 mới — giao lần 16 cho T2-172); lượt yên #40 CÓ LƯỢT HỢP LỆ — chuỗi lên 35; CERT/FULL GIỮ 76/91; (n) run 170 SUCCEEDED 14:21:03Z, margin 888 s; run 171 vẫn `running` — kết cục thuộc T7-172; (o) **F-171-T1-1/F-171-T1-2 ĐÓNG** (T10 đã sửa khi viết §100); quyết (l) đợt 152 về hạn cờ — XÁC NHẬN giữ trọn vẹn đợt thứ mười chín liên tiếp; T10 không chạy lại toàn bộ suite — CHẤP NHẬN cách đóng sổ này cho đợt 171; marker sống qua 33 reboot — GHI NHẬN — 33 ĐÚNG; gap #79→#80 = 11.996 s; #80→#81 = 9.064 s.

## §1. Đếm cuối: KHỚP từng số quyết parent (a) §12.3 đợt 171 — lần thứ 68 liên tiếp

Script `count-final-172-t1.py` VIẾT MỚI (hidden_files/round172-t1/; output `count-final-172-t1.txt`). Quét 1.246 file `phase9-round*.txt` (round 1–171); 0 file không khớp mẫu; purity: 0 entry rỗng, 0 entry chứa newline, 0 trùng trong cùng file, 0 file không kết thúc bằng NUL.

- **Đợt 171 = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** (gồm closing: aggregate mới + GAP đã có). File mới: 9 LIMITS (T0/T1/T2/T4/T5/T6/T7/T8/T9) + aggregate 171 + 3 script T4 (`distinct-seq-171.py`, `poll-wait-t4-171.sh`, `run-attempt-171.sh`). Overlap duy nhất: `PHASE9_GAP_ANALYSIS.md`. Kiểm chéo lần 2 (union-trừ) + lần 3 (quét lại toàn bảng, đợt 171): KHỚP.
- **Lũy kế 111–171 = 598 batch / 1.063 entry / 920 đường dẫn khác nhau / 742 file mới** — KHỚP aggregate 171 §10.4/footer/GAP §100 + quyết parent (a).
- **Chờ push 166–171 = 60 batch / 84 entry / 79 đường dẫn khác nhau / 78 file mới** — KHỚP.
- **Tái kiểm 111–170 = 588/1.049/907** (new 729); **111–169 = 578/1.035/894**; 111–168 = 568/1.021/881; 111–167 = 558/1.007/868; 111–166 = 548/993/855; 111–165 = 538/979/842 — KHỚP từng số quyết parent các đợt trước.
- **Tổng mọi round (1–171) = 1.246 batch / 6.933 entry / 3.725 đường dẫn duy nhất** — KHỚP aggregate 171 §10.4. Tổng mọi round (1–170) = **1.236/6.919/3.712** — KHỚP dòng đã sửa của T10-171, **XÁC NHẬN F-171-T1-1 ĐÃ ĐÓNG ĐÚNG** (aggregate 170 §10.4 cũ ghi 1.235/6.917/3.711 là sai).
- **0 file thiếu trên đĩa** (unique 111–171 và toàn bộ mọi round). Kiểm độc lập lần 2 bằng shell (`tr`/`sort -u` trên 10 file đợt 171): 10 batch / 14 entry / 14 unique / 0 trùng trong đợt — KHỚP script.
- Footer "Batch stage / Tổng batch" aggregate 171 CÓ ĐẦY ĐỦ (10 batch liệt kê + 3 dòng tổng).

## §2. Suite chạy lại: 28/28 exit 0 trên boot 4b9db449 (#81)

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (17:40:39–17:47:57Z, 7m18s, boot `4b9db449`, RAMavail lúc mở 1.581 MB). Script `round172-t1-verify.sh` (adapt từ T1-171; `run()` ghi thời gian bắt đầu/kết thúc từng mục). Log `round172-t1-suites.log` (970 dòng — đúng bằng T1-171).
- **`npm test` đầy đủ: 12 pass, 0 fail** — 12 dòng `✅ PASS` chính xác trong mục npm-test-full (đếm bằng chuỗi chính xác, không đếm lỏng — xem F-164-T1-8); 0 dòng `❌ FAIL`; dòng tổng `== KẾT QUẢ: 12 pass, 0 fail ==` khớp.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — khớp hồ sơ T10-171 lúc đóng. Các luồng đợt 172 khác chạy song song nhưng KHÔNG sửa 6 file theo dõi này trong cửa sổ verify.
- **Caveat:** suite chạy trên boot MỚI `4b9db449` (#81, btime 17:02:05Z), KHÔNG phải boot #80 của đợt 171 — xem F-172-T1-4. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8/T4 đợt 171 xác minh từ file gốc đã đóng băng trên #80. Suite NHANH hơn T1-171 52 s (7m18s vs 8m10s) dù cùng 28 mục — RAMavail lúc mở cao hơn (1.581 MB vs 967 MB); mục U4 chiếm ~3m30s (17:42:10–~17:45:30Z); không có mục nào fail hay rerun. 0 process suite nào của T1 còn sống lúc đóng (`VERIFY DONE 17:47:57Z`); 1 process `vcut-webkit-postboot-check.sh --repair` (pid 18186, từ 17:41Z) + 1 sleep-probe của T5 lúc 17:48Z là của luồng khác đợt 172 — không phải của T1.
- **X11:** `/tmp/.X11-unix/` lúc T1-172 mở (17:40:39Z): **TRỐNG** (0 socket); lúc đóng (~17:48Z): **3 socket mồ côi X193/X194/X195 (mtime 17:45:11Z)** — xuất hiện đúng lúc mục xvfb-lock của suite T1 chạy (17:45:11Z) — xem F-172-T1-2 (giao T8-172 dọn lúc đóng theo checklist (o)). Lần này 3 socket, KHÔNG có X196 như đợt 171.

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng) + chuỗi LÊN 23 theo quyết parent (b)

T1 KHÔNG chạy O8 riêng: T4-172 đang hoạt động (poll-t4.log đã có, T5 probe đang chạy lúc 17:48Z) — chạy O8 mới (WebKit + Chromium, nặng tài nguyên) sẽ tranh tài nguyên với lượt yên của T4, trái chỉ đạo task. Thay vào đó, xác minh độc lập từ 6 file JSON gốc của T0-171 + T8-171 (md5 tính lại + đếm lại từng file bằng python) — cùng mẫu T1-171 ("không chạy O8 riêng"):

- File gốc `round171-t0/o8-webkit/o8w-clicktest-report-2026-11-22T14-54-01-2acdd1ab-pid34281.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `dfe9da72…` — KHỚP T10-171 §10.2; boot `2acdd1ab`.
- File gốc `.../o8w-clicktest-report-2026-11-22T14-55-30-2acdd1ab-pid37092.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `c17e5e8d…` — KHỚP; boot `2acdd1ab`.
- File gốc `round171-t0/o8-chromium/o8-clicktest-report-2026-11-22T14-56-28-2acdd1ab-pid38116.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `92d5d73b…` — KHỚP; boot `2acdd1ab`.
- File gốc `round171-t8/o8-webkit/o8w-clicktest-report-2026-11-22T15-33-57-2acdd1ab-pid60049.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `743a05fc…` — KHỚP; boot `2acdd1ab`.
- File gốc `.../o8w-clicktest-report-2026-11-22T15-34-51-2acdd1ab-pid60447.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `74432311…` — KHỚP; boot `2acdd1ab`.
- File gốc `round171-t8/o8-chromium/o8-clicktest-report-2026-11-22T15-35-43-2acdd1ab-pid60834.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `5739d5b5…` — KHỚP; boot `2acdd1ab`.
- **Chuỗi WebKit FULL PASS LÊN 23 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả + quyết parent (b) đợt 171 XÁC NHẬN đề xuất của T8/T10** (lượt yên #40 HỢP LỆ attempt3-2acdd1ab TRÊN BOOT ĐO; O8 sau lượt hợp lệ TRÊN CÙNG BOOT 2acdd1ab; gate (a) FOUND poll 41 lúc 15:29:16Z qua POSTBOOT_PASS #80 replay-đầy-đủ 14:52:09Z). Tiền lệ đợt 157: chuỗi lên dù cùng đợt harness có kẹt 84l10 — kẹt harness không chặn chuỗi O8. Caveat harness WebKit 0/3 đợt 171 (chưa từng có) + phán attempt3 hợp lệ của T10 (F-171-T2-1) đã được parent CHẤP NHẬN ở quyết (b)/(h) — ghi nhận, không chặn. Caveat DEBROOT như mọi đợt vẫn ghi nhận. T1 không chạy O8 riêng.

## §4. T4 attempt3 — median tickCost tính lại độc lập từ JSON gốc: KHỚP 43,0 (đóng F-171-T10-3)

- File gốc `round171-t4/preview-b-f3-flip-webkit-t4-attempt3-2acdd1ab.json`: `passes=20`, `pageErrs=[]`, webkit 27.2.
- **Tính lại độc lập bằng python từ `results.b.y2.tickCost` (trường `total` của từng entry): n=623, median=43, p90=69 (phương pháp phân vị rời rạc), max=167, min=27; hậu flip+2000ms n=458, median=44,0 — KHỚP output analyze của T4 (n=623, median 43,0, p90 68,8, max 167, min 27; hậu flip n=458, median 44,0).** Chênh p90 68,8 vs 69 chỉ là khác cách nội suy phân vị (numpy percentile tuyến tính vs chỉ số rời rạc) trên CÙNG dữ liệu — không phải lệch số liệu. **F-171-T10-3 (T10-171 không tính lại median từ JSON thô): ĐÃ ĐƯỢC TRẢ bởi T1-172 — median 43,0 ĐỨNG.**
- Chân lượt yên #40 (attempt3 hợp lệ, B 5/5, median 43,0 ≤ 60) + chân O8 LÊN 23 đều đứng trên số đo đã tính lại độc lập này.

## §5. Cờ `.done` đợt 171: 10/10 còn trên đĩa, đều có nội dung

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round171-t0.done | 15:01:46 | 760 B |
| round171-t1.done | 15:02:34 | 1.557 B |
| round171-t2.done | 15:35:33 | 1.763 B |
| round171-t4.done | 15:29:08 | 548 B |
| round171-t5.done | 15:13:21 | 4.233 B |
| round171-t6.done | 15:09:31 | 1.697 B |
| round171-t7.done | 16:53:11 | 1.143 B |
| round171-t8.done | 16:40:56 | 2.793 B |
| round171-t9.done | 17:03:53 | 1.336 B |
| round171-t10.done | 17:23:10 | 2.177 B |

Kích thước 9 cờ luồng KHỚP từng số aggregate 171 §10.1. 8/9 trong hạn cờ ~17:00Z (T9 trễ ~3', trong hạn cứng 17:30Z); T10 đóng 17:23Z trong hạn cứng. Lưu ý theo §10.5 (xii) aggregate 171: cờ T9 viết SAU reboot #81 (btime 17:02:05Z) mà không phát hiện — đã được T10-171 ghi nhận (F-171-T10-2), parent ghi nhận ở quyết (d)/(o); T1-172 không sửa file của T9.

## §6. Boot + marker lúc T1 đóng

- Boot lúc T1 mở và lúc đóng: **`4b9db449-7699-4441-a4cf-72983f15dbbd`** — ỔN ĐỊNH suốt phiên T1, không reboot trong phiên (uptime 46 phút lúc 17:48:16Z). Btime 1795366925 = 17:02:05Z (khớp T10-171 §10.5 (xii)); survey của T0-172 lúc 17:38:50Z ghi cùng boot_id/btime/proc1 start 17:02:16Z/journal chỉ còn 1 boot 4b9db449 — T1 đối chiếu KHỚP, số hiệu #81 chờ T0-172 xác minh 9 nguồn (T1 không tự chốt số hiệu).
- Marker `~/.config/vcut-persistence-marker`: CÒN, mtime **2026-11-20 11:39:47.272154981Z không đổi** — sống qua #49–#81 = 33 reboot theo đếm của T10-171 (T1-172 không đếm lại độc lập số reboot — chỉ xác nhận marker còn + mtime không đổi).

## §7. Đính chính / phát hiện của T1-172 (F-172-T1-*)

- **F-172-T1-1 — Nhãn header GAP §100 còn cũ (cùng mẫu F-171-T1-2):** header §100 hiện ghi "verdict CHẤP NHẬN — đề xuất, chờ quyết parent §12.1 aggregate 171", trong khi quyết parent §12.3 aggregate 171 đã điền đầy (a)–(o) và parent đã chấp nhận/duyệt toàn bộ (ghi chú nguồn gốc §12.3). **Giao T10-172 cập nhật khi viết §101** thành "verdict CHẤP NHẬN — parent ĐÃ QUYẾT (a) §12.3 aggregate 171". Đối chiếu: header GAP §99 nay ghi đúng "parent ĐÃ QUYẾT (a) §12.3 aggregate 170" — **XÁC NHẬN F-171-T1-2 ĐÃ ĐÓNG ĐÚNG**; header §98 cũng đúng ("parent ĐÃ QUYẾT (a) §12.3 aggregate 169").
- **F-172-T1-2 — 3 socket X11 mồ côi X193/X194/X195 (mtime 17:45:11Z) xuất hiện trong phiên suite của T1-172 — giao T8-172 dọn lúc đóng.** Lúc T1 mở (17:40:39Z) `/tmp/.X11-unix/` TRỐNG; socket xuất hiện đúng lúc mục xvfb-lock chạy (17:45:11Z) — cùng mẫu F-171-T1-3, nhưng lần này 3 socket (KHÔNG có X196). T1 KHÔNG tự dọn socket (T8 sở hữu dọn socket lúc đóng theo checklist (o)).
- **F-172-T1-3 — ĐÓNG khoảng trống F-171-T10-3:** median tickCost attempt3 T4-171 đã tính lại độc lập từ JSON gốc (xem §4): n=623, median=43 KHỚP 43,0 của T4; p90 68,8/69 chỉ khác cách nội suy; post-flip n=458 median 44,0 KHỚP. **Median 43,0 ĐỨNG.**
- **F-172-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-171-T1-5).** Suite T1-172 chạy trên boot MỚI `4b9db449` (#81, btime 17:02:05Z), KHÔNG phải boot #80 của đợt 171 — cùng mẫu F-171-T1-5 (T1-171 suite trên boot mới 2acdd1ab sau khi T10-170 đóng sổ). Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8/T4 đợt 171 xác minh từ file gốc đã đóng băng trên #80. T1 KHÔNG chạy O8 riêng (T4-172 đang hoạt động — xem §3). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, WFS), T7 (scheduler DB, HB/DR, run 171 chi tiết), T5 (apt/dpkg internals), T9 (attribution từng spike, ranh giới chuỗi E-175, chuỗi headroom dài hạn), T6 (120 lần kiểm soát churn — chỉ đối chiếu log run), T0 (bench chi tiết, đồng hồ boot mới, số hiệu reboot #81) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. **Kết cục run 171 thuộc T7-172** (T1 không phán). **(m) #81 + INSIDE #81 thuộc T2-172.**
- **Không lặp F-169-T1-5 — mọi mốc giờ trong LIMITS này đều đọc từ file gốc hoặc `date -u` lúc chạy** (giờ suite 17:40:39–17:47:57Z đọc từ log suite; giờ cờ `.done` đọc từ `stat`).
- **Không lặp F-165-T1-4 / F-166-T1-4 / F-167-T1-4 / F-168-T1-4 / F-169-T1-4 / F-170-T1-4 / F-171-T1-4 — suite T1-172 chạy 7m18s (NHANH hơn T1-171 52 s)** dù cùng 28 mục — RAMavail lúc mở cao hơn (1.581 MB vs 967 MB); mục U4 chiếm ~3m30s; 0 fail, 0 rerun.

## §8. Verdict: PASS

Nội dung đợt 171 đứng vững toàn bộ trên boot 4b9db449 (suite) + file gốc đóng băng #80 (O8/T4): đếm khớp lần thứ 68 liên tiếp, đợt 171 = 10/14/14 đường dẫn / 13 file mới (khớp aggregate §10.4/footer/GAP §100 + quyết parent (a) §12.3 đợt 171); suite đầy đủ 28/28 (7m18s); O8 21/21 ×6 từ JSON gốc, chuỗi FULL PASS LÊN 23 xác nhận độc lập (quyết parent (b) đợt 171); median tickCost attempt3 43,0 tính lại độc lập — KHỚP (đóng F-171-T10-3); F-171-T1-1 ĐÓNG ĐÚNG (tổng 1–170 = 1.236/6.919/3.712); F-171-T1-2 ĐÓNG ĐÚNG (nhãn GAP §99 đã cập nhật); **10/10 cờ đợt 171 còn trên đĩa, đều có nội dung**. Không có đính chính nào có trọng lượng — chỉ nhãn GAP §100 cũ (F-172-T1-1) + 3 socket X11 (F-172-T1-2) + boot mới sau khi T10 đóng sổ (F-172-T1-4), không đổi verdict.

## §9. Cây lúc đóng verify

preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 171 + verify 172. Boot `4b9db449` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 17:47:57Z`). `/tmp/.X11-unix/` lúc đóng: 3 socket mồ côi X193/X194/X195 (T1 KHÔNG đụng vào — giao T8-172).

## Batch stage

- File stage: `phase9-round172-t1-verify171.txt` — 1 entry (LIMITS này, NUL-delimited).
- KHÔNG PUSH.
