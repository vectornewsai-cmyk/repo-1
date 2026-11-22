# VCut Studio — Phase 9, đợt 146, T1: kiểm chứng độc lập đợt 145 (verify145)

- Mở: lượt cron 18:35 +07 = 11:35:51Z 19/11/2026, boot **98a7c93f** (btime 09:54:03Z, #109? chặt theo quyết parent (g) đợt 145). Hạn cờ ~14:15Z, hạn cứng đóng đợt 14:30Z.
- **Verdict T1-146: PASS — đợt 145 đứng vững hoàn toàn.** Mọi số đếm khớp 100% với số công bố; 9/9 cờ đủ đúng thứ tự mtime; aggregate + GAP §74 đầy đủ kèm quyết parent §12.3 (a)–(o) đã ghi đúng, đối chiếu khớp MEMORY.md; suite 27/27 + O8 21/21 ×4 JSON ok=True đối chiếu đúng log trên đĩa; lượt yên #20 hậu kiểm đúng artifact gốc (median 58,0 ms n=508, P1 p=0,0529, P3-A1 p=0,0789, P7 0/372); CERT 64/FULL 79 mean tái tính khớp; **started_at run 145 kiểm DB độc lập lần thứ hai: giá trị hiện tại 09:54:43Z = btime(98a7c93f) + 40 s** — xác nhận độc lập kết luận viết lại 1 lần của T7; cây lúc đóng không đổi (preview.tsx 530e10a7).
- KHÔNG PUSH trong phiên này — chỉ stage, để đó; user tự push sau từ main chat khi nhắn "push đi".

## §1. Đếm cuối — dedup toàn cục bằng script MỚI viết từ đầu

- Script `hidden_files/round146-t1/count-final-146-t1.py` (viết mới hoàn toàn cho đợt này, không tái dùng code T10-145 hay T1-145; đọc mọi file `phase9-round*.txt` trong `paths-loop/` — 989 file, tách NUL, dedup toàn cục, regex số đợt từ tên file, KHÔNG cộng dồn tay; kiểm luôn file paths không thuần NUL + đường dẫn stage thiếu trên đĩa). Kết quả lưu `hidden_files/round146-t1/t1-count-final-146.txt`.
- Kết quả (khớp 100% số T10-145 công bố + file `t10-count-final-145.txt` + MEMORY.md):

| Phạm vi | Batch | Entry | File duy nhất |
|---|---|---|---|
| Đợt 145 | **9** | **11** | **11** |
| Lũy kế 111–145 | **341** | **701** | **597** |
| Tái kiểm 111–144 | 332 | 690 | 588 |
| Tái kiểm 111–143 | 323 | 679 | 579 |
| Tái kiểm 111–142 | 314 | 668 | 570 |
| Chờ push 136–145 | **93** | **123** | **99** |

- Tái kiểm 111–144 = 332/690/588, 111–143 = 323/679/579 và 111–142 = 314/668/570 đều khớp số công bố các đợt trước — **lần thứ 27 liên tiếp khớp theo cách đếm của T1** (T1-145 đếm lần thứ 26; theo cách đếm của main chat là lần thứ 25 — xem F-146-T1-5 về lệch số giữa hai cách đếm).
- Chi tiết đợt 145: 9 file paths (t1/t2/t4/t5/t6/t7/t8/t9 + closing); 11 entry = 9 LIMITS mới + aggregate + GAP; 2 file trùng với 111–144 (PHASE9_GAP_ANALYSIS.md + `apps/web/scripts/vcut-webkit-postboot-check.sh` — trùng hợp lệ, cùng mẫu các đợt trước); 0 đường dẫn stage thiếu trên đĩa; 0 file paths không thuần NUL (kiểm toàn bộ 989 file); 0 entry trùng lặp trong một file paths đợt 145.
- Caveat script (ghi rõ, không ảnh hưởng số): file `phase9-round14-parity5.txt` được regex xếp vào đợt 14 (đúng tên file); chỉ ảnh hưởng tổng đợt 14, không chạm các dải 111–145. 989 file paths quét được = 980 file lúc T1-145 đếm + 9 file mới của đợt 145 — nhất quán.

## §2. Cờ — 9/9 đủ, đúng thứ tự mtime

| Cờ | mtime (Z, giây) | Nội dung khớp aggregate? |
|---|---|---|
| round145-t1.done | 08:44:29 | ✓ PASS verify144, 9/11/11, lũy kế 332/690/588 |
| round145-t6.done | 08:50:19 | ✓ lock khỏe (file 0 nội dung ngoài timestamp, thông lệ) |
| round145-t2.done | 08:53:41 | ✓ probe #64, mù #64 không đóng hoàn toàn, INSIDE 4 (xem F-146-T1-4 về timestamp trong nội dung) |
| round145-t4.done | 08:59:31 | ✓ #20 hợp lệ attempt1, median 58,0 ms, cộng dồn 17 lượt |
| round145-t8.done | 09:19:21 | ✓ 0 byte, thông lệ |
| round145-t5.done | 09:25:51 | ✓ timestamp trong nội dung (xem F-146-T1-2 về LIMITS sửa sau cờ 5 s) |
| round145-t7.done | 11:04:33 | ✓ 0 byte, thông lệ |
| round145-t9.done | 11:14:50 | ✓ 0 byte, thông lệ |
| round145-t10.done | 11:29:22 | ✓ CHẤP NHẬN, đếm cuối 9/11/11, lũy kế 341/701/597 |

- Thứ tự mtime khớp hoàn toàn thứ tự aggregate công bố (T1 08:44, T6 08:50, T2 08:53, T4 08:59, T8 09:19, T5 09:25, T7 11:04, T9 11:14, T10 11:29). Đủ trước hạn cờ ~11:15Z (T9 đóng 11:14:50Z, ~10 giây trước hạn); T10 đóng 11:29:22Z, trước hạn cứng 11:30Z.
- Boot lúc T1-146 mở phiên: **98a7c93f** (khớp brief); kiểm lại cuối phiên vẫn 98a7c93f, uptime -s 09:54:03Z — **0 reboot trong phiên T1-146**.
- Chốt chặn `round-in-progress.md` KHÔNG TỒN TẠI lúc T1-146 kiểm (11:39Z).

## §3. Aggregate + GAP §74 + quyết parent §12.3

- Aggregate `docs/PHASE9_ROUND145_LIMITS.md` đầy đủ §1–§12, gồm verdict CHẤP NHẬN, 9 khiếm khuyết §9.6, đếm cuối §9.1, đối chiếu chéo §9.2, verify độc lập §9.3, sai số T10 §9.4, nợ mở §11, 15 câu hỏi §12.1 (a)–(o).
- GAP `PHASE9_GAP_ANALYSIS.md` §74 đầy đủ (mở/đóng, 1 reboot #33, T1–T10 tóm tắt, đếm cuối, verdict, sai số T10, oversize). Nội dung §74 khớp aggregate từng luồng (đã đọc đối chiếu từng dòng). GAP mtime 11:29:27Z — xem F-146-T1-3.
- Quyết parent §12.3 (a)–(o) đã ghi đầy đủ, khớp từng câu hỏi §12.1: (a) CHẤP NHẬN đợt 145; (b) mù #64 không đóng hoàn toàn — chuỗi về 0, CERT 64/FULL 79 không đổi; (c) khung chết #107? (07:55:38Z, 07:56:16Z] CHỐT LÀM CHUẨN; (d) khung chết #106? CHỐT khung thu hẹp (05:53:06Z, 05:53:15Z] thay khung T5 60 s; (e) chuỗi INSIDE lên 4 XÁC NHẬN; (f) gap 7.050 s + 7.381 s ĐỂ SPAN; (g) reboot #33 XÁC NHẬN, 98a7c93f = #109?; (h) CẬP NHẬT quyết (j): history.log cũng reset, bằng chứng thay thế là dpkg.log đóng băng + ps exact-comm; (i) headroom 1.074 VẪN CHỈ THEO DÕI; (j) watchdog GIỮ NGUYÊN bản vá; (k) gate A GIỮ NGUYÊN ≥1024 MB; (l) birefnet GIỮ NGUYÊN quy trình + guard; (m) run 144 TIMEOUT + run 145 muộn +187 s CHỈ GHI NHẬN; (n) tiêu đề §12.3 đợt 144 ĐÃ ĐƯỢC XỬ LÝ TRƯỚC ĐÓ — không cần sửa trong batch closing đợt 145; (o) lượt yên #20 CHẤP NHẬN cộng dồn theo quy ước.
- Đối chiếu MEMORY.md: MEMORY đã cập nhật đợt 145 (9/11/11; lũy kế 341/701/597; CERT 64/FULL 79; INSIDE 4; #20 hợp lệ median 58,0 ms; khung #107? chốt chuẩn; khung #106? thu hẹp; quyết (j) cập nhật; headroom 1.074; run 145 viết lại +40 s; run 144 TIMEOUT) — khớp 100% aggregate + đếm của T1-146.
- **Lưu ý nguồn gốc §12.3 (xem F-146-T1-1):** ghi chú nguồn gốc đã có trong aggregate (parent ghi, 18:3x +07): §12.3 đã có khi parent đọc, parent không phải người viết, parent đã đọc lại từng quyết đối chiếu §12.1 + bằng chứng và CHẤP NHẬN toàn bộ. Nội dung các quyết giữ nguyên — verdict không đổi. Nhưng mtime file hiện tại (11:31:08Z) lệch khỏi mtime ghi trong ghi chú (11:30:03Z) — xem F-146-T1-1.

## §4. Đối chiếu chéo giữa các luồng (T1-146 kiểm độc lập)

### 4.1 Suite + O8 (đọc log + JSON trên đĩa, không chạy lại)

- Suite cây gộp đợt 145: log `round145-t10-suites.log` có **27 dòng `exit=0` trên tổng 27 dòng `exit=`** → **27/27 exit 0** ✓; `=== ALL DONE 2026-11-19T11:23:04Z boot 98a7c93f ===` ✓.
- O8 (JSON là bằng chứng chính): T8 WebKit `o8w-clicktest-report.json` **21 results, ok=True 21/21**; T8 Chromium **21/21**; T10 WebKit **21/21**; T10 Chromium **21/21** — cả 4 report 0 fail. **Chuỗi WebKit FULL PASS 2 → 3 xác nhận đúng** (T8 pass ×2 boot e146ca67 + T10 pass ×1 boot 98a7c93f, hai boot khác nhau, cùng cây).
- Ghi chú: glob của T1-146 liệt kê file WebKit của T8 hai lần (hai pattern chồng nhau) — cùng một file, không phải hai lần chạy; không ảnh hưởng số đếm.

### 4.2 Lượt yên #20 — hậu kiểm attempt1 (bằng chứng gốc, không chỉ đọc LIMITS)

- Đọc trực tiếp artifact T4 `round145-t4/analyze-t4-attempt1-e146ca67-*.txt`:
  - tickCost: **n=508, median 58,0 ms, post-flip 58,0 ms, p90 88,3, max 239, min 31** ✓ khớp LIMITS T4 §3 + aggregate §3.
  - P1 (unsigned): baseline 69/300 = 0,2300; (c2) gắn run-end 2/2 [295, 399]; **p = 0,0529** ✓; P1 signed p = 0,0513778 ≈ 0,0514 ✓.
  - P3-A1: baseline đóng băng 84/299 = 0,2809; 2/2; **p = 0,0789253 ≈ 0,0789** ✓.
  - P7: toàn bộ drawSrc trong cửa sổ post **0/372 trễ ≥+1f** ✓.
  - Cả P1 và P3-A1 đều YẾU theo luật DEF (n=2 < 3, p>0,01) — đúng như aggregate §3/§9.6(9) ghi; cộng dồn 17 lượt theo quy ước đã được quyết parent (o) chấp nhận.

### 4.3 T2 — CERT 64 / FULL 79 (tái tính mean độc lập)

- Tái tính từ các đầu vào T1-145 đã xác minh (CERT63 mean 5.636 s, FULL78 mean 6.011 s, gap chứng nhận 7.220 s): CERT64 = (63×5.636 + 7.220)/64 = **5.660,75 s = 1h34'20,75" → 1h34'20"** ✓; FULL79 = (78×6.011 + 7.220)/79 = **6.026,3 s = 1h40'26,3" → 1h40'27"** (làm tròn) ✓ — khớp số công bố. CERT 64 / FULL 79 giữ nguyên đợt 145 (gap 7.050 s + 7.381 s vẫn SPAN, quyết (f)) — không đổi.
- Mù #64 không đóng hoàn toàn (đoạn B mở, tối đa 2 ẩn) + chuỗi INSIDE lên 4: T1-146 không tính lại merged gap từ log thô (thuộc brief T2; T2-145 + T6-145 đã xác nhận độc lập lẫn nhau, quyết parent (b)/(e) đã chốt) — ghi rõ giới hạn, xem F-146-T1-6.

### 4.4 Kích thước LIMITS các luồng (đối chiếu aggregate footer)

- Kích thước trên đĩa khớp đúng từng byte với aggregate footer: T1 18.320 B, T2 34.008 B, T4 10.345 B, T5 49.928 B, T6 75.891 B, T7 30.018 B, T8 29.435 B, T9 64.066 B ✓. Oversize (>37.768 B): T5, T6, T9 + aggregate — khớp footer.
- Aggregate hiện tại 67.451 B; trừ khối §12.3 (~5.826 B theo cách tính của T1-145) còn ~61.625 B — khớp "~61,6 KB" mà GAP §74 ghi là kích thước aggregate lúc T10 đóng (trước §12.3). Nhất quán.

### 4.5 started_at run 145 — kiểm độc lập bằng DB (lần thứ hai T1 làm được)

- T1-146 đã truy vấn trực tiếp `scheduler.job_runs` (read-only SELECT, job `vcut-build-loop`):
  - Run 145 `fcfdad2e-555e-488d-90c8-4a5463d31120`: scheduled_for **08:35:51Z** (1795077351), started_at hiện tại **09:54:43Z** (1795082083) = btime(98a7c93f, 1795082043) + **40 s** ✓ **khớp độc lập kết luận của T7** (viết lại 1 lần tại reboot #33, offset 40 s, trong dải ~30–50 s). Giá trị ban đầu 08:38:58Z chỉ còn bằng chứng kiểm tại thời điểm của T7 (DB đã ghi đè) — xem F-146-T1-6(d).
  - Run 145 status **`succeeded`**, finished_at **11:30:29Z** (1795087829) — tức run kết thúc 29 s SAU hạn cứng 11:30Z; mọi việc của đợt (cờ T10 11:29:22Z) đã xong trước đó, 67 s chênh là overhead scheduler/resolution, không phải việc của đợt (ghi nhận là dữ kiện).
  - Run 144 `b93ae161-7dfe-46ad-bb2a-52c4c3c9eae2`: status **`timeout`**, finished 08:38:58Z, error "Ran out of its 10800s time budget before finishing" ✓ khớp T7 + T1-145; started_at 07:56:57Z = btime(e146ca67) + 41 s (khớp T1-145).
  - Run 146 `e24b5870-6cfa-4c16-bdb3-00ac86a61696` (lượt này): scheduled_for **11:35:51Z**, started_at **11:35:51Z — jitter 0 s**, status `running` — khởi động đúng giờ (khác run 145 muộn +187 s).
  - Phát hiện phụ (không thuộc brief, ghi để T7-146 đối chiếu): run 143 `b6c4b22d` started_at 03:56:20Z = btime(691a7403, 03:55:45Z) + **35 s** — cũng trong dải ~30–50 s, nhất quán giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy".
- Chuỗi offset boot đúng: …/34/37/32/35/44/41/**40 s** — tự nhất quán; giả thuyết viết lại giữ đúng kiểm thứ 20 (T7 kiểm 19 + DB độc lập lần này).

## §5. Cây lúc đóng

- Kiểm md5 lúc T1-146 mở phiên (11:39Z, boot 98a7c93f — sau khi đóng đợt 145, trước khi luồng đợt 146 khác ghi repo): preview.tsx **530e10a7** ✓, media.ts **2c384ed1** ✓, vite.config.ts **ee80d093** ✓ — khớp cây lúc T10-145 đóng (11:18Z/11:23Z/11:26Z). **Cây không đổi.**
- Lưu ý phương pháp: đường dẫn preview.tsx là `apps/web/src/preview.tsx` (không phải `apps/web/src/components/preview.tsx`); vite.config.ts là `apps/web/vite.config.ts` — lần đầu gõ sai đường dẫn nên md5sum báo lỗi, đã sửa và kiểm lại đúng file (xem F-146-T1-7).

## §6. Khiếm khuyết / nợ mở còn lại (từ đợt 145, không đổi verdict)

- Lượt yên #21: đo ở đợt 146 (sau khi #20 hợp lệ ngay attempt1, median 58,0 ms; cộng dồn 17 lượt; ngân sách retry 3 attempt/đợt giữ nguyên; poller đã vá B4 chạy thật lần đầu và cho kết quả hợp lệ ngay).
- **Mù #65 mới mở — T2-146: probe #65 + chứng nhận gap #108?→#109? (7.067 s) + khung chết #108?/e146ca67 bằng merged mù #65 + số boot 98a7c93f = #109? + dải #109?/#110? chuẩn.**
- Khung chết #106? thu hẹp (05:53:06Z, 05:53:15Z] (9 s) + khung #107? (07:55:38Z, 07:56:16Z] (38 s): **ĐÃ CHỐT LÀM CHUẨN ở quyết parent (c)/(d) đợt 145** — không còn chờ.
- Tiền đề quyết (j) đợt 144: **ĐÃ CẬP NHẬT ở quyết (h) đợt 145** — bằng chứng thay thế là dpkg.log đóng băng + ps exact-comm; T5-146 làm theo thực hành (a)+(b).
- Headroom 1.074 dưới ngưỡng lần 5 (quyết (i): vẫn chỉ theo dõi); balloon đóng băng đợt thứ 8 (quyết (k): giữ gate A ≥1024 MB); watchdog chưa được thử bằng kẹt thật đợt thứ 4 (quyết (j): giữ nguyên bản vá).
- Birefnet 0 lần thử (quyết (l): giữ nguyên quy trình + guard 6.144 MiB; u2net là fallback chính thức).
- Oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; G1 chờ user quyết; R9 (a) vẫn chờ user (số đếm vẫn là 16).
- Run 145 kết thúc `succeeded` 11:30:29Z (29 s sau hạn cứng) — chỉ ghi nhận là dữ kiện theo quyết (m) (không điều tra trừ khi tái diễn).

## §7. Sai số F-146-T1-1..7 (ghi rõ — kể cả sai số của chính T1-146)

- **F-146-T1-1 — Aggregate sửa sau cờ T10 + ghi chú nguồn gốc lệch mtime:** cờ round145-t10.done tạo 11:29:22Z, nhưng aggregate `PHASE9_ROUND145_LIMITS.md` mtime **11:31:08Z** (sau cờ ~106 s); ghi chú nguồn gốc §12.3 ghi "file sửa lần cuối 11:30:03Z" — **lệch 65 s so với mtime thực tế**, và trong file KHÔNG có chuỗi "11:31" nào để truy vết lần sửa cuối. Nội dung §12.3 (a)–(o) đã được parent chấp nhận làm quyết chính thức nên không đổi verdict; nhưng tác giả/nội dung lần sửa 11:31:08Z chưa xác định — cùng mẫu F-145-T1-3 (đợt 144). Đề xuất: lần sau T10 ghi rõ kích thước + md5 aggregate lúc tạo cờ để lần sửa sau cờ nào cũng truy được.
- **F-146-T1-2 — T5 sửa LIMITS sau khi tạo cờ (nhỏ, ~5 s):** LIMITS T5 mtime 09:25:56.9Z, sau cờ round145-t5.done 09:25:51.6Z (+5,3 s). Kích thước hiện tại 49.928 B khớp đúng aggregate footer — chỉ sai lệch hồ sơ (file chưa ghi xong hẳn lúc tạo cờ). Không đổi verdict; cùng họ F-145-T1-2.
- **F-146-T1-3 — Closing stage trước khi GAP + aggregate chốt hẳn:** file `phase9-round145-closing.txt` mtime 11:28, trong khi GAP mtime 11:29:27Z và aggregate sửa lần cuối 11:31:08Z. Danh sách file trong batch closing không đổi (vẫn đúng 2 entry aggregate + GAP) — chỉ nội dung hai file đó còn tiến hóa sau khi stage; push đọc từ đĩa lúc push nên không có nguy cơ blob cũ, nhưng hồ sơ "stage lúc nào" không phản ánh đúng thời điểm nội dung chốt. Không đổi verdict; bài học: T10 nên stage closing SAU khi GAP + aggregate đã chốt hẳn.
- **F-146-T1-4 — Nội dung cờ T2 ghi timestamp sớm ~1 phút so với mtime file cờ:** `round145-t2.done` ghi "DONE 08:52Z" nhưng mtime file là 08:53:41Z. Nội dung còn lại khớp aggregate; chỉ là timestamp trong nội dung được viết trước khi file cờ tạo xong (hoặc làm tròn phút). Không đổi verdict.
- **F-146-T1-5 — T1-145 ghi "lệch 1" giữa hai cách đếm nhưng số của chính nó lệch 2:** T1-145 §1 ghi lần thứ 26 liên tiếp (cách T1) vs lần thứ 24 (cách main chat) rồi kết "lệch 1 đã ghi từ đợt 141" — 26 − 24 = 2, không phải 1. Đợt này: cách T1 lần thứ 27, cách main chat lần thứ 25 — khoảng cách vẫn là 2. Chỉ là lỗi diễn đạt số học trong hồ sơ, không chạm số đếm (mọi dải tái kiểm đều khớp). Ghi rõ để lần sau không lặp lại cách viết này.
- **F-146-T1-6 — Giới hạn của chính T1-146 (ghi rõ, không giấu):** (a) Không chạy lại suite/O8 (chỉ đọc log + JSON trên đĩa — đủ bằng chứng, chạy lại sẽ tốn thời gian và làm bẩn cây đợt 146); (b) không tính lại merged gap mù #64 / chuỗi INSIDE từ log thô (dựa vào xác nhận chéo T2+T6 và quyết parent (b)/(e) đã chốt); (c) không kiểm lại md5 lock script + 3 script harness đã vá (theo aggregate §10.3, không thuộc brief verify); (d) started_at ban đầu của run 145 (08:38:58Z) chỉ còn bằng chứng kiểm tại thời điểm của T7 — DB đã ghi đè bằng giá trị viết lại; (e) không đo lại headroom/RAM/balloon (số đo theo thời điểm, không tái tạo hậu kiểm); (f) không kiểm lại log lock thô 1180 dòng / ACQUIRED−RELEASED = 6 (theo aggregate §10.4, không thuộc brief verify).
- **F-146-T1-7 — T1-146 gõ sai đường dẫn cây lúc kiểm md5 lần đầu:** `apps/web/src/components/preview.tsx` và `vite.config.ts` (gốc repo) không tồn tại — đường dẫn đúng là `apps/web/src/preview.tsx` và `apps/web/vite.config.ts`. Đã sửa và kiểm lại đúng file (preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093 — khớp cây lúc đóng). Không ảnh hưởng kết luận; ghi rõ để lần sau dùng đường dẫn đã xác minh.

## §8. Files + stage

- LIMITS này: `docs/PHASE9_ROUND146_T1_VERIFY145_LIMITS.md`.
- Script đếm: `hidden_files/round146-t1/count-final-146-t1.py` (ngoài repo — KHÔNG stage vào batch push; chỉ LIMITS này được stage).
- Stage: `phase9-round146-t1-verify145.txt` (1 entry NUL-delimited, verify od). KHÔNG PUSH.
- Cờ: `round146-t1.done` khi xong (trước hạn cờ ~14:15Z).
