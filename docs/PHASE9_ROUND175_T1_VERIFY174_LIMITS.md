# PHASE9 — Đợt 175, T1: Verify đợt 174 — LIMITS

T1-175 verify đợt 174. Đợt 175 mở 02:35:51Z 23/11/2026 (09:35:51 +07). T1 chạy 02:38–02:55Z, boot `70b7f7ee` (btime 01:01:37Z — ứng viên #86; số hiệu chờ T0-175 xác minh 9 nguồn; T1 không tự chốt số hiệu). Hạn cờ ~05:00Z, hạn cứng ~05:30Z 23/11.

- **Verdict: PASS — nội dung đợt 174 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số quyết parent (q) §12.3 đợt 174 bằng script dedup toàn cục VIẾT MỚI HOÀN TOÀN (`recount-175-t1.py`, không tái dùng script T1-174/T10-174/`parent-recount-172.py`; sắp xếp theo round tăng dần bằng số — xem F-175-T1-5: bản nháp đầu của script đã mắc đúng lỗi F-173-T1-3, bắt được nhờ kiểm chéo, đã sửa trước khi chốt số) (**lần thứ 73 liên tiếp** theo chuỗi quyết parent — xem §1); đợt 174 = **10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới**; suite chạy lại **28/28 exit 0 trên boot 70b7f7ee** (12m10s, 02:41:43–02:53:53Z); `npm test` **12 pass**; O8 đợt 174 xác nhận độc lập từ JSON gốc (T0 PASS 3/3 + T8 PASS 3/3 trên #85 — chuỗi LÊN 25 theo quyết parent (b) — xem §3); lượt yên #43 của T4-174 tính lại độc lập từ JSON gốc (passes=20, tickCost median=44,5 — xem §4); **bộ O8 MỚI của T0-175 trên boot 70b7f7ee PASS 3/3 — xác nhận độc lập từ JSON gốc** (xem §3); **9/9 cờ đợt 174 còn trên đĩa, đều có nội dung** (+ cờ closing T10 — xem §5).
- **Caveat lớn (đọc trước):** quyết parent §12.3 đợt 174 đã được parent kiểm lại và chấp nhận/duyệt toàn bộ: (a) đợt 174 CHẤP NHẬN; (b) chuỗi WebKit FULL PASS **LÊN 25**; (c) POSTBOOT_PASS #85 (repair-tay-T5, replay một phần 159/170) chấp nhận đứng cho gate (a) VỚI caveat; (d) INSIDE #83/#84/#85 TRUE — chuỗi dài 4; (e) số hiệu #84/#85 XÁC NHẬN (T0 9 nguồn); #86 CHỜ T0-175; (f) **(m) #84/#85 DƯƠNG**; (m) #86 DƯƠNG ỨNG VIÊN (sơ bộ) — phân loại cuối thuộc T2-175 + parent 175; (g) n ứng viên 32/33; n chính thức GIỮ 14; (h) Balloon 6 episode mới E-181..E-186, tổng ghim 55/137 (40,1%); (i) #84/#85 KHÔNG giết holder — chuỗi từ #69: **17 reboot**; (A) 120/120 lần thứ 24 + prune lần 49; #86 có giết holder không — thuộc T6-175; (j) (1c') (c') GIỮ NGUYÊN diag-only; (f') V1 live 0 kích hoạt ĐÚNG (0 FP trên 10 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3; H3 vẫn mở, chỉ giám sát thụ động; (k) POSTBOOT_PASS #84 CÓ + #85 CÓ (repair, caveat) + #83 KHÔNG CÓ (boot thứ 16 không cờ) + hướng (3) VẪN ĐỨNG lần 21; F-173-T5-9 ĐÓNG; F-174-T5-6 (replay một phần — điều tra host-side không bắt buộc); (l) headroom 2 — GIỮ "chỉ theo dõi" (lần thứ 34); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp; ENOSPC ≥72 dòng (đợt thứ 23); (m) mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #43 CÓ lượt hợp lệ — chuỗi 36 → 37; CERT/FULL GIỮ 76/91; (n) run 173 TIMEOUT (margin −13 s; chuỗi succeeded 23 run ĐỨT); run 174 vẫn running — kết cục thuộc T7-175; jitter +13 s (chuỗi jitter 0 s 26 đợt DỨT); (o) DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN (8 lần kiểm); HB 44/435, DR 51/290; cửa đợt 174 HB 6/6 + DR 3/4 — KHÔNG LÀNH; (p) vi phạm quy tắc đứng F-174-T2-5/F-174-T4-2 GHI NHẬN (nhắc lại cho đợt 175); 6/9 file LIMITS oversize (cần ENABLE_PRIVSEP=0 lúc push); F-174-T1-1 ĐÓNG; F-173-T0-3 + F-173-T7-2 ĐÓNG; F-174-T0-5 ĐÓNG; marker 37 reboot (chờ T0-175 xác nhận #86 → 38); gap #83→#84 = 2.128 s, #84→#85 = 7.101 s, #85→#86 = 7.321 s; (q) đếm cuối 10/14/14/13; lũy kế 618→628/1.092→1.106/946→959/768→781; chờ push 90/127/119/117 — **lần thứ 72 liên tiếp đếm khớp**; (r) **KHÔNG PUSH** — 90 batch / 127 entry / 117 file chờ user push (đợt 166–174) (+ file oversize 6,4 MB chưa quyết). Quyết bổ sung của parent: định nghĩa đếm ca claimed→finished ≥60 s — CHỌN định nghĩa thống nhất (cửa sổ từ run 154) — run 172 = ca thứ TÁM.

## §1. Đếm cuối: KHỚP từng số quyết parent (q) §12.3 đợt 174 — lần thứ 73 liên tiếp

Script `recount-175-t1.py` VIẾT MỚI (repo-1 `hidden_files/round175-t1/`; output `count-final-175-t1.txt`). Quét 1.276 file `phase9-round*.txt` khớp mẫu, round 1–174; 0 file không khớp mẫu trong số đã quét; purity: 0 entry rỗng, 0 entry chứa newline, 0 trùng trong cùng file, 0 file không kết thúc bằng NUL; tổng entry 6.976. Sắp xếp theo round tăng dần bằng số (F-173-T1-3 — xem F-175-T1-5); chuẩn hoá đường dẫn (bỏ prefix tuyệt đối `~/workspace/repo-1/`, `./`) TRƯỚC khi kiểm thiếu (bài học §10.5 (xi) aggregate 173).

- **Đợt 174 = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** (gồm closing: aggregate mới + GAP đã có). File mới: 9 LIMITS (T0/T1/T2/T4/T5/T6/T7/T8/T9) + aggregate 174 + 3 script T4 (`distinct-seq-174.py`, `poll-wait-t4-174.sh`, `run-attempt-174.sh`). Overlap duy nhất: `PHASE9_GAP_ANALYSIS.md` (first_seen round 59). Kiểm chéo lần 2 (shell union-trừ: 14 distinct, new 13, overlap đúng 1 file trên): KHỚP.
- **Lũy kế 111–174 = 628 batch / 1.106 entry / 959 đường dẫn khác nhau / 781 file mới** — KHỚP quyết parent (q).
- **Chờ push 166–174 = 90 batch / 127 entry / 119 đường dẫn khác nhau / 117 file mới** — KHỚP quyết parent (q)/(r).
- **Tái kiểm 111–173 = 618/1.092/946/768** (new 768); **111–172 = 608/1.077/933** (new 755); **111–171 = 598/1.063/920** (new 742) — KHỚP từng số quyết parent các đợt trước (kiểm chéo shell union-trừ cho 111–173 và 111–172 cũng khớp từng số: 618/1.092/946/768 và 608/1.077/933/755).
- **Tổng mọi round (1–174) = 1.276 batch / 6.976 entry / 3.764 đường dẫn duy nhất** — KHỚP số parent đính chính trong ghi chú nguồn gốc §12.3 aggregate 174 (1.276/6.976/3.764); **KHÔNG khớp §10.3 của T10-174 (1.275/6.974/3.763 — thiếu 1 batch / 2 entry / 1 đường dẫn)** — xem F-175-T1-3. Các số quyết (q) không bị ảnh hưởng (parent đã kiểm bằng dedup riêng và duyệt theo số đã đính chính).
- **0 file thiếu trên đĩa** (3.764 đường dẫn duy nhất toàn bộ mọi round + riêng đợt 174: 0 thiếu). 4 entry đường dẫn tuyệt đối ở round 143/153 (mẫu §10.5 (xi)) vẫn tồn tại — đã kiểm lại qua dedup chuẩn hoá (0 missing toàn cục).
- Footer "Batch stage / Tổng batch" aggregate 174 CÓ ĐẦY ĐỦ (10 batch liệt kê + lũy kế 628/1.106/959/781 + chờ push 90/127/119/117).

## §2. Suite chạy lại: 28/28 exit 0 trên boot 70b7f7ee

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (02:41:43–02:53:53Z, 12m10s, boot `70b7f7ee`, RAMavail lúc mở 1.039 MB theo log suite). Script `round175-t1-verify.sh` (adapt từ T1-174; `run()` ghi thời gian bắt đầu/kết thúc từng mục). Log `round175-t1-suites.log` (970 dòng — đúng bằng T1-173/T1-174).
- **`npm test` đầy đủ: 12 pass, 0 fail** — 12 dòng `✅ PASS` chính xác trong mục npm-test-full (đếm bằng chuỗi chính xác, không đếm lỏng); 0 dòng `❌ FAIL`; dòng tổng `== KẾT QUẢ: 12 pass, 0 fail ==` khớp.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — khớp hồ sơ T1-174/T1-173 lúc đóng. Các luồng đợt 175 khác chạy song song nhưng KHÔNG sửa 6 file theo dõi này trong cửa sổ verify.
- **Caveat:** suite chạy trên boot `70b7f7ee` (ứng viên #86 — boot lúc T10-174 đóng sổ), KHÔNG phải boot #85 của đợt 174 — xem F-175-T1-4. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8/T4 đợt 174 xác minh từ file gốc đã đóng băng trên #85. Suite CHẬM hơn T1-174 (12m10s vs 8m50s) dù cùng 28 mục — mục U4 chiếm ~4m24s (02:45:14–02:49:38Z) + mục npm-test-full ~3m41s; RAMavail dao động mạnh trong phiên (365 MB lúc 02:40:57Z trước suite, 1.039 MB lúc mở suite 02:41:43Z, 859 MB lúc đóng) — xem F-175-T1-2. 0 fail, 0 rerun. 0 process suite nào của T1 còn sống lúc đóng (`VERIFY DONE 02:53:53Z`).
- **Quy tắc đứng:** suite chạy lúc T4-175 mới ở pha poll-wait (poll #1 02:41:09Z, gateA RAM≥1024 MB CHƯA HẠ, chưa có attempt nào mở) — KHÔNG nằm trong cửa sổ attempt; T1 không probe dpkg, không chạy script nặng nào ngoài suite theo nhiệm vụ. T4 vẫn ở poll #1 lúc T1 đóng suite (02:53Z) — không có chồng chéo attempt.
- **X11:** `/tmp/.X11-unix/` lúc T1 mở (02:41Z): **1 socket X188**; lúc đóng (~02:54Z): **3 socket mồ côi X193/X194/X195 (mtime 02:49:51Z)** — xuất hiện đúng lúc mục xvfb-lock của suite T1 chạy (02:49:50–02:50:00Z) — xem F-175-T1-1 (giao T8-175 dọn lúc đóng theo checklist (o)). X188 đã vắng lúc đóng.

## §3. O8 — Xác nhận độc lập bằng JSON gốc

### §3.1. Bộ O8 đợt 174 (đã đóng băng): T0 PASS 3/3 + T8 PASS 3/3 trên #85 — chuỗi LÊN 25

T1 KHÔNG chạy O8 riêng cho đợt 174: cả 6 file JSON gốc còn đủ trên đĩa; xác minh độc lập bằng cách đếm lại từng file bằng python + tính lại md5 (đường dẫn thực tế dưới `hidden_files/round174-t0/` và `round174-t8/` của goal, không phải `repo-1/hidden_files/`):

- File gốc `round174-t0/o8-webkit/o8w-clicktest-report-2026-11-22T23-43-44-3c704685-pid18668.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `f91f8fe6…` — KHỚP aggregate §10.2.
- File gốc `.../o8w-clicktest-report-2026-11-22T23-45-11-3c704685-pid25983.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `d9f19eb6…` — KHỚP aggregate §10.2.
- File gốc `round174-t0/o8-chromium/o8-clicktest-report-2026-11-22T23-46-37-3c704685-pid32439.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `1e6268af…` — KHỚP aggregate §10.2.
- File gốc `round174-t8/o8-webkit/o8w-clicktest-report-2026-11-23T00-26-57-3c704685-pid52401.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `18340611…` — KHỚP aggregate §8/§10.2.
- File gốc `.../o8w-clicktest-report-2026-11-23T00-27-54-3c704685-pid52799.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `bcc11471…` — KHỚP aggregate §8/§10.2.
- File gốc `round174-t8/o8-chromium/o8-clicktest-report-2026-11-23T00-28-43-3c704685-pid53193.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `97d9308e…` — KHỚP aggregate §8/§10.2.
- **Chuỗi WebKit FULL PASS LÊN 25 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả + quyết parent (b) đợt 174** (cả hai bộ độc lập khác pid/md5, đồng thuận PASS trên cùng boot #85; lượt yên #43 xem §4). T1 không chạy O8 riêng cho đợt 174.

### §3.2. Bộ O8 MỚI của T0-175 trên boot 70b7f7ee: PASS 3/3 — xác nhận độc lập từ JSON gốc

Lúc T1 kiểm (~02:54Z), T0-175 đã có bộ O8 mới trên boot hiện tại `70b7f7ee` (ứng viên #86) — xác minh độc lập từ 3 file JSON gốc (đếm lại bằng python + md5 + log exit):

- File gốc `round175-t0/o8-webkit/o8w-clicktest-report-2026-11-23T02-40-54-70b7f7ee-pid17203.json` (WebKit attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `30e46593…`.
- File gốc `.../o8w-clicktest-report-2026-11-23T02-42-35-70b7f7ee-pid20731.json` (WebKit attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `55c9d481…` — khớp file verify của chính T0-175 (`o8-verify-175t0.txt`: results=21 ok=true=21 fail=0).
- File gốc `round175-t0/o8-chromium/o8-clicktest-report-2026-11-23T02-44-45-70b7f7ee-pid29459.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `67824d3e…` — khớp file verify của T0-175.
- Log T0-175: `O8-WebKit-attempt2 exit=0 02:44:45Z`, `O8-Chromium exit=0 02:46:17Z`, `O8 DONE 02:46:17Z webkit1=0 webkit2=0 chromium=0`; cả 3 lần `== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail ==`.
- **WebKit PASS lại trên boot 70b7f7ee** — cùng cây code (md5 cây khớp §2). **Chuỗi FULL PASS có tăng hay không thuộc T8-175/T10-175 + parent 175** (cần verdict lượt yên của T4-175 trên cùng boot + gate POSTBOOT_PASS #86 — T1 không phán). Caveat: bộ O8 này chạy 02:40–02:46Z, CHỒNG với suite của T1 (02:41–02:53Z) — cả hai đều PASS, không có dấu hiệu tranh tài nguyên làm sai kết quả (xem F-175-T1-6).

### §3.3. Bộ O8 của T8-175: CHƯA CÓ lúc T1 đóng — ngoài phạm vi kiểm

Lúc T1 đóng (~02:54Z): `round175-t8/o8-175t8.log` 0 B (mtime 02:40:35Z), không có file report nào mang boot `70b7f7ee` trong `round175-t8/o8-webkit/` hay `o8-chromium/` (chỉ có bản copy file 174 + fixture setup 02:39Z); không có thư mục `round175-t8` dưới goal `hidden_files/`. T8-175 có thể chưa chạy O8 xong lúc T1 đóng — **T1 KHÔNG xác nhận và KHÔNG bác bộ O8 của T8-175**; việc này thuộc T10-175 khi T8 có kết quả.

## §4. T4-174 — lượt yên #43 tính lại độc lập từ JSON gốc

- Attempt2 `preview-b-f3-flip-webkit-t4-attempt2-3c704685.json` (3.503.322 B): **passes=20, engine webkit, pageErrs=[]**, webkit 27.2 — tính lại từ `results.b.y2.tickCost` bằng python thuần (không dùng script của T4): **tickCost total n=634, median=44,5, p90=68, max=96, min=28; hậu flip+2000 ms n=463, median=44,0** — KHỚP TỪNG SỐ file phân tích `analyze-t4-attempt2-3c704685-tickcost.txt` của T4-174. Lớp B 5/5 và các số P1/P2/P3/P3'/P7 cộng dồn chỉ đối chiếu qua LIMITS T4-174 + aggregate §4 — không đạo lại từ đầu (xem F-175-T1-4).
- Attempt1 `preview-b-f3-flip-webkit-t4-attempt1-3c704685.json` (416.310 B): **passesDone=3, partial=true** — KHỚP chẩn đoán PAGE-WEDGED sau pass 3 của T4-174 (aggregate §4).

## §5. Cờ `.done` đợt 174: 9/9 còn trên đĩa, đều có nội dung (+ cờ closing T10)

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round174-t0.done | 23:53:04 22/11 | 3.069 B |
| round174-t1.done | 23:53:16 22/11 | 1.286 B |
| round174-t2.done | 00:17:10 | 5.517 B |
| round174-t4.done | 00:23:46 | 944 B |
| round174-t5.done | 00:03:39 | 527 B |
| round174-t6.done | 00:03:42 | 1.108 B |
| round174-t7.done | 02:10:09 | 3.487 B |
| round174-t8.done | 00:57:00 | 2.105 B |
| round174-t9.done (*) | 02:14:46 | 4.733 B |
| round174-t10.done | 02:23:06 | 1.586 B |

(*) Cờ T9 nằm ở cả hai vị trí: gốc `hidden_files/round174-t9.done` (4.733 B) + thư mục con `round174-t9/round174-t9.done` (4.694 B) — xem F-175-T1-7. Kích thước 9 cờ luồng KHỚP từng số aggregate 174 §10.1. Nội dung từng cờ đã đọc thử (120 byte đầu) — đều là văn bản DONE có ý nghĩa, không cờ rỗng. 7/9 trong hạn cờ ~02:00Z (T7 trễ ~10', T9 trễ ~15' — cả hai do reboot #86 giữa phiên, trong hạn cứng ~02:30Z); T10 đóng 02:23:06Z.

## §6. Boot + marker lúc T1 đóng

- Boot lúc T1 mở (02:38Z) và lúc đóng (~02:54Z): **`70b7f7ee-2e0b-4565-b019-bdabc2c6e92c`** — ỔN ĐỊNH suốt phiên T1, **không reboot trong phiên** (btime 01:01:37Z; uptime ~1h37m lúc mở, ~1h53m lúc đóng). Số hiệu #86 chờ T0-175 xác minh 9 nguồn (T1 không chốt).
- Marker `~/.config/vcut-persistence-marker`: CÒN, mtime **2026-11-20 11:39:47.272154981Z không đổi**, 239 B — sống qua #49–#85 = 37 reboot theo đếm của T0-174 (T1-175 không đếm lại độc lập số reboot — chỉ xác nhận marker còn + mtime không đổi; việc marker có sống qua boot 70b7f7ee hay không thuộc T0-175 xác minh 9 nguồn).

## §7. Đính chính / phát hiện của T1-175 (F-175-T1-*)

- **F-175-T1-1 — 3 socket X11 mồ côi X193/X194/X195 (mtime 02:49:51Z) xuất hiện trong phiên suite của T1-175 — giao T8-175 dọn lúc đóng.** Lúc T1 mở (02:41Z) `/tmp/.X11-unix/` chỉ có X188; trio xuất hiện đúng lúc mục xvfb-lock chạy (02:49:50–02:50:00Z) — cùng mẫu F-174-T1-1, lần thứ tư liên tiếp cùng 3 số hiệu (X193/X194/X195 đã được T8 dọn ở đợt 172/173/174, nay tạo lại). X188 đã vắng lúc đóng. T1 KHÔNG tự dọn socket (T8 sở hữu dọn socket lúc đóng theo checklist (o)).
- **F-175-T1-2 — RAMavail dao động cực mạnh trong phiên suite.** 365 MB lúc 02:40:57Z (trước suite) → 1.039 MB lúc mở suite 02:41:43Z → 859 MB lúc đóng 02:53:58Z. Suite vẫn 28/28 nhưng chậm hơn T1-174 (12m10s vs 8m50s); mục U4 chiếm ~4m24s. Không có mục nào fail hay rerun — chỉ ghi nhận, không đổi verdict. Nguyên nhân RAM thấp/dạt thuộc T9-175 (balloon/headroom).
- **F-175-T1-3 — Tổng mọi round (1–174) của T10-174 thiếu 1 batch / 2 entry / 1 đường dẫn.** §10.3 aggregate 174 ghi "1.275 batch / 6.974 entry / 3.763 đường dẫn duy nhất"; dedup độc lập của T1-175 (python + shell union-trừ, cả hai khớp nhau) cho **1.276 / 6.976 / 3.764** — khớp số parent đã đính chính trong ghi chú nguồn gốc §12.3 (parent kiểm bằng dedup riêng). Các số quyết (q) (đợt 174, lũy kế 111–174, chờ push, tái kiểm) KHÔNG bị ảnh hưởng — tất cả đều khớp. Chỉ ghi nhận để T10-175 lưu ý khi viết aggregate 175: tổng toàn cục đúng là 1.276/6.976/3.764.
- **F-175-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-174-T1-4).** Suite T1-175 chạy trên boot `70b7f7ee` (ứng viên #86, boot lúc T10-174 đóng sổ), KHÔNG phải boot #85 của đợt 174. Suite kiểm lại code (không phụ thuộc boot) nên 28/28 vẫn là bằng chứng độc lập đứng; các số O8/T4 đợt 174 xác minh từ file gốc đã đóng băng trên #85. T1 KHÔNG chạy O8 riêng cho đợt 174 (6 JSON gốc còn đủ — xem §3.1). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, (m) #84/#85, INSIDE #83/#84/#85), T7 (scheduler DB, HB/DR, run 173 TIMEOUT chi tiết, run 174), T5 (apt/dpkg internals, POSTBOOT_PASS #85), T9 (attribution từng spike, ranh giới chuỗi E-181..E-186), T6 (120 lần kiểm soát churn, #84/#85 có giết holder không), T0 (số hiệu boot 70b7f7ee) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. **Kết cục run 174 thuộc T7-175** (T1 không phán). **(m) #86 + INSIDE #86 thuộc T2-175.** **Số hiệu boot 70b7f7ee thuộc T0-175.** **Bộ O8 của T8-175 thuộc T8-175/T10-175** (chưa có lúc T1 đóng — xem §3.3).
- **F-175-T1-5 — Bản nháp đầu của script đếm T1-175 mắc lỗi sắp xếp F-173-T1-3 — đã bắt được và sửa trước khi chốt số.** Bản nháp sắp xếp tên file theo thứ tự từ điển (`sorted(os.listdir(...))`), khiến round 100+ đứng trước round 99 và gán sai first_seen cho 139 đường dẫn (GAP thành first_seen round 100 thay vì 59; lũy kế 111–174 new=920 thay vì 781). Kiểm chéo shell union-trừ lệch ngay (768 vs 907 ở cửa 111–173) nên đã sửa script sang sắp xếp theo số round tăng dần, chạy lại: mọi số KHỚP (xem §1). Bài học: kiểm chéo độc lập bằng phương pháp thứ hai là bắt buộc, không phải trang trí — lỗi sắp xếp từ điển là lỗi âm thầm, chỉ lộ khi đối chiếu số new.
- **F-175-T1-6 — Bộ O8 mới của T0-175 PASS 3/3 trên boot 70b7f7ee (xem §3.2), chạy CHỒNG với suite của T1 (02:40–02:46Z trong cửa sổ suite 02:41–02:53Z).** Cả hai đều PASS (O8 21/21 ×3, suite 28/28) nên không có bằng chứng tranh tài nguyên làm sai kết quả — chỉ ghi nhận sự chồng chéo để T10-175 lưu ý khi đối chiếu thời gian. Việc chuỗi FULL PASS có tăng không thuộc T8-175/T10-175 + parent (cần verdict lượt yên của T4-175 + gate POSTBOOT_PASS #86).
- **F-175-T1-7 — Hai bản cờ T9-174 KHÔNG giống nhau (aggregate §10.1 nói "nội dung giống nhau" là chưa chính xác).** Bản gốc `hidden_files/round174-t9.done`: 4.733 B, md5 `5910283b…`, dòng đầu "cờ viết 02:14Z … (số đo đóng 01:55:19Z…)". Bản thư mục con `round174-t9/round174-t9.done`: 4.694 B, md5 `3f7c31af…`, dòng đầu "02:0xZ …" (bản nháp sớm hơn, mtime 02:14:46Z cùng giây). Cả hai đều có nội dung thật, cờ T9 vẫn tính là CÓ — chỉ đính chính câu "giống nhau" trong aggregate; không đổi verdict, không đổi đếm cờ (9/9).
- **F-175-T1-8 — Bộ O8 của T8-175 chưa có lúc T1 đóng (02:54Z).** `o8-175t8.log` 0 B (mtime 02:40:35Z), không có report nào mang boot `70b7f7ee`; chỉ có bản copy file 174 + fixture setup 02:39Z. T1 KHÔNG xác nhận và KHÔNG bác bộ O8 của T8-175 — thuộc T8-175/T10-175 (xem §3.3). (RAM thấp lúc mở suite đợt này không còn là 388 MB thấp nhất — 1.039 MB lúc mở, dù dao động mạnh — xem F-175-T1-2). **Không lặp F-169-T1-5** — mọi mốc giờ trong LIMITS này đều đọc từ file gốc hoặc `date -u` lúc chạy.

## §8. Verdict: PASS

Nội dung đợt 174 đứng vững toàn bộ trên boot 70b7f7ee (suite) + file gốc đóng băng #85 (O8/T4): đếm khớp lần thứ 73 liên tiếp, đợt 174 = 10/14/14 đường dẫn / 13 file mới (khớp aggregate §10.3/footer/GAP §103 + quyết parent (q) §12.3 đợt 174); suite đầy đủ 28/28 (12m10s); `npm test` 12 pass; O8 đợt 174 xác nhận độc lập từ JSON gốc (T0 PASS 3/3 + T8 PASS 3/3 trên #85 — chuỗi LÊN 25 theo quyết parent (b)); lượt yên #43 tính lại độc lập (passes=20, tickCost median=44,5, n=634); **bộ O8 MỚI của T0-175 trên boot 70b7f7ee PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21, md5 30e46593/55c9d481/67824d3e, exit 0) — xác nhận độc lập**; F-173-T1-1 ĐÓNG ĐÚNG (nhãn aggregate 172 đã sửa — kiểm lại ở đợt 174); **9/9 cờ đợt 174 còn trên đĩa, đều có nội dung** (+ cờ closing T10). Không có đính chính nào có trọng lượng — chỉ 3 socket X11 (F-175-T1-1) + RAM dao động mạnh (F-175-T1-2) + tổng toàn cục T10 thiếu 1 (F-175-T1-3) + phạm vi kiểm có giới hạn (F-175-T1-4) + lỗi sắp xếp script đã sửa (F-175-T1-5) + O8 mới chồng suite (F-175-T1-6) + hai bản cờ T9 khác nhau (F-175-T1-7) + bộ O8 T8-175 chưa có (F-175-T1-8, xem §3.3), không đổi verdict.

## §9. Cây lúc đóng verify

preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 174 + verify 175. Boot `70b7f7ee` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 02:53:53Z`). `/tmp/.X11-unix/` lúc đóng: 3 socket mồ côi X193/X194/X195 (T1 KHÔNG đụng vào — giao T8-175).

## Batch stage

- File stage: `phase9-round175-t1-verify174.txt` — 1 entry (LIMITS này, NUL-delimited).
- KHÔNG PUSH.
