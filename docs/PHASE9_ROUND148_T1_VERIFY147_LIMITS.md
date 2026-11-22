# VCut Studio — Phase 9, đợt 148, T1: kiểm chứng độc lập đợt 147 (verify147)

- Mở: lượt cron 00:35 +07 20/11/2026 = 17:35:51Z 19/11/2026, boot **d8a11644** (btime 17:28:08Z — boot MỚI sau reboot #35, xem §3). Hạn cờ 20:00Z, hạn cứng 20:30Z.
- **Verdict T1-148: PASS — nội dung công việc đợt 147 đứng vững hoàn toàn; NHƯNG hồ sơ đóng sổ sai nghiêm trọng về reboot (F-148-T1-1, F-148-T1-2) — cần parent bổ sung, không đổi verdict CHẤP NHẬN (quyết (a)).** Mọi số đếm khớp 100% với số T10-147 công bố; 9/9 cờ đủ; suite chạy lại 27/27 exit 0; O8 21/21 ×3 + harness 6/6 đối chiếu đúng JSON/log gốc trên đĩa; lượt yên #21 hậu kiểm đúng artifact gốc (median partial 51,0/37,0 ms); mù #66 đóng hoàn toàn + CERT 66 / FULL 81 tái tính khớp (trong sai số làm tròn — xem F-148-T1-7); cây không đổi (preview.tsx 530e10a7).
- **Phát hiện headline — REBOOT #35 TRONG LÚC T10-147 ĐÓNG SỔ:** boot 6fb582df (btime 12:13:26Z) → **d8a11644** (btime **17:28:08Z**), xảy ra sau cờ T8 (17:22:19Z) và trước khi aggregate/GAP/cờ T10 được ghi (17:33–17:34Z). Claim "0 reboot trong phiên" của aggregate §9.2/§10.2, GAP §76 và mọi LIMITS luồng **SAI** (đúng tại thời điểm từng luồng đóng — T7 đóng cuối 16:59:55Z — nhưng sai cho toàn đợt tính tới lúc đóng sổ). **Run 147 BỊ VIẾT LẠI lần 2 tại reboot này: started_at 17:28:34Z = btime + 26 s (NGOÀI dải ~30–50 s), status `timeout`, finished 17:36:53Z; run 148 khởi động 17:36:53Z, jitter +62 s.** Quyết parent (o) "run 147 không viết lại" nay SAI — cần parent bổ sung (xem §4, §11). Mù #67 MỞ — giao T2-148.
- KHÔNG PUSH trong phiên này — chỉ stage, để đó; user tự push sau từ main chat khi nhắn "push đi".

## §1. Đếm cuối — dedup toàn cục bằng script MỚI viết từ đầu

- Script `hidden_files/round148-t1/count-final-148-t1.py` (viết mới hoàn toàn cho đợt này, không tái dùng code T10-147 hay T1-147; đọc mọi file `phase9-round*.txt` trong `paths-loop/` — 1007 file, tách NUL, dedup toàn cục, regex số đợt từ tên file, KHÔNG cộng dồn tay; kiểm luôn file paths không thuần NUL + đường dẫn stage thiếu trên đĩa). Kết quả lưu `hidden_files/round148-t1/t1-count-final-148.txt`.
- Kết quả (khớp 100% số T10-147 công bố + file `t10-count-final-147-postclosing.txt` + aggregate §9.1 + footer §12.3):

| Phạm vi | Batch | Entry | File duy nhất |
|---|---|---|---|
| Đợt 147 | **9** | **10** | **10** |
| Lũy kế 111–147 | **359** | **722** | **615** |
| Tái kiểm 111–146 | 350 | 712 | 606 |
| Tái kiểm 111–145 | 341 | 701 | 597 |
| Chờ push 136–147 | **111** | **144** | **117** |

- Tái kiểm 111–146 = 350/712/606, 111–145 = 341/701/597 đều khớp số công bố các đợt trước — **lần thứ 29 liên tiếp khớp theo cách đếm của T1** (T1-147 đếm lần thứ 28; theo cách đếm của main chat là lần thứ 27 — xem F-148-T1-9 về lệch số giữa hai cách đếm).
- Chi tiết đợt 147: 9 file paths (t1/t2/t4/t5/t6/t7/t8/t9 + closing); 10 entry = 8 LIMITS mới + aggregate + GAP; 1 file trùng với 111–146 (PHASE9_GAP_ANALYSIS.md — trùng hợp lệ, cùng mẫu các đợt trước; T10-147 ghi "trùng đúng 0 file" là đếm TRƯỚC closing — sau closing GAP là file trùng duy nhất, nhất quán); 0 đường dẫn stage thiếu trên đĩa; 0 file paths không thuần NUL (kiểm toàn bộ 1007 file); 0 entry trùng lặp trong một file paths đợt 147.
- Caveat script (ghi rõ, không ảnh hưởng số): file `phase9-round14-parity5.txt` được regex xếp vào đợt 14 (đúng tên file); chỉ ảnh hưởng tổng đợt 14, không chạm các dải 111–147. 1007 file paths quét được = 1006 file lúc T10-147 đếm cuối (pre-closing) + 1 file closing — nhất quán.

## §2. Cờ — 9/9 đủ

| Cờ | mtime (Z, giây) | Nội dung khớp aggregate? |
|---|---|---|
| round147-t6.done | 14:55:13 | ✓ lock khỏe, prune xóa 1 file |
| round147-t2.done | 15:00:49 | ✓ probe #66, mù #66 đóng hoàn toàn, INSIDE 6 |
| round147-t5.done | 15:25:52 | ✓ replay tốt, sampler n=40, headroom 669→661 |
| round147-t1.done | 15:52:35 | ✓ PASS verify146, 9/11/11, lũy kế 350/712/606 |
| round147-t9.done | 16:37:02 | ✓ headroom 668, tự động hóa (a) đã nối, 0 mẫu ≥ guard |
| round147-t4.done | 16:57:13 | ✓ #21 đo lại, median partial 51,0/37,0 ms, 2/2 kẹt |
| round147-t7.done | 16:59:55 | ✓ HB 6/6 + DR 2/2, run 147 đúng giờ, mốc neo 8.363 s |
| round147-t8.done | 17:22:19 | ✓ O8 21/21 ×3, harness 6/6, lỡ hạn mềm |
| round147-t10.done | 17:34:14 | ✓ CHẤP NHẬN (đề xuất), 9/10/10, lũy kế 359/722/615 |

- Thứ tự mtime thực: T6 14:55:13 → T2 15:00:49 → T5 15:25:52 → T1 15:52:35 → T9 16:37:02 → T4 16:57:13 → T7 16:59:55 → T8 17:22:19 → T10 17:34:14. Aggregate §9.2 liệt kê đúng thứ tự này (chỉ sai chi tiết nhỏ ở giờ T1 — xem F-148-T1-6). T8 đóng muộn sau hạn cờ 17:00Z (17:22:19Z) nhưng trong hạn cứng 17:30Z; T10 đóng sau hạn cứng.
- **Ba mốc giờ đóng không khớp nhau (F-148-T1-3):** GAP §76 ghi "đóng 17:32Z"; aggregate §9.5 + nội dung cờ ghi "cờ tạo lúc 17:33:22Z"; cờ mtime thực **17:34:14Z** (+52 s so với 17:33:22Z). Nội dung cờ trích md5 aggregate `49769fc5…` — đó là md5 của aggregate bản 56.247 B lúc 17:34:03Z (T1-148 tự tính 17:39Z: 56.247 B, md5 `49769fc5f7d95a790444140917e0029c` ✓), tức nội dung cờ chỉ có thể viết sau 17:34:03Z — phù hợp mtime 17:34:14Z, không phù hợp giờ 17:33:22Z. Giả thuyết nhất quán nhất: T10 soạn nội dung cờ lúc 17:33:22Z (lúc xong việc đóng sổ) rồi ghi file sau khi aggregate chốt lần cuối (17:34:03Z) — ghi rõ là giả thuyết, cơ chế chênh 52 s chưa chứng minh được chắc chắn. **Quyết parent (a) đã phán: lấy giờ đóng theo cờ t10.done là 17:33:22Z; GAP ghi 17:32Z là ước tính sớm; handoff worker ghi 17:36:35Z là lúc phiên worker kết thúc.** T1-148 ghi theo quyết (a), không tự đổi.
- Closing file `phase9-round147-closing.txt` mtime **17:33:35Z** (54 B, 2 entry NUL-delimited, verify od) — TRƯỚC aggregate/GAP chốt lần cuối 17:34:03Z (xem F-148-T1-5). Nội dung closing (2 entry aggregate + GAP) vẫn đúng vì chỉ liệt kê đường dẫn, không ghi md5.
- Chốt chặn `round-in-progress.md` KHÔNG TỒN TẠI lúc T1-148 kiểm.

## §3. Reboot #35 — CÓ reboot trong lúc T10-147 đóng sổ (claim "0 reboot" SAI)

- **Boot hiện tại lúc T1-148 mở phiên: d8a11644-1f76-4e48-94f6-97b2cf34fff8**, btime **17:28:08Z** (`stat /proc/sys/kernel/random/boot_id` 17:28:08.489; uptime 12 phút lúc 17:39:54Z khớp). Boot cũ 6fb582df, btime 12:13:26Z → **tuổi thọ boot 6fb582df = 18.882 s** (17:28:08Z − 12:13:26Z; khớp số log vòng lặp ghi 18.882 s).
- Bằng chứng 4 nguồn độc lập: (1) boot_id hiện tại là d8a11644, khác 6fb582df mà toàn bộ 9 luồng ghi trong phiên; (2) `journalctl --list-boots` chỉ còn 1 boot d8a11644, first entry 17:28:09Z (journal đã xoay, không còn boot cũ — bằng chứng yếu hơn nhưng nhất quán); (3) DB `scheduler.job_runs`: run 147 started_at bị viết lại thành 17:28:34Z (xem §4); (4) mọi file aggregate/GAP/cờ T10 có mtime 17:33–17:34Z — SAU btime 17:28:08Z, tức được ghi trên boot mới.
- Thời điểm reboot nằm giữa cờ T8 (17:22:19Z) và lúc T10 ghi aggregate/GAP (17:34:03Z): **reboot xảy ra đúng trong lúc T10 đóng sổ**, sau khi 9/9 cờ đã đủ. Phiên T10 sống qua reboot (runtime restart, tiền lệ F-141-T10-1: session sống qua runtime restart, không mất dữ liệu) và tiếp tục ghi aggregate/GAP/cờ sau reboot — nhưng KHÔNG nhận ra boot đã đổi: aggregate §10.1 vẫn ghi "Boot lúc đóng: 6fb582df", §9.2/§10.2 vẫn ghi "0 reboot trong phiên", GAP §76 vẫn ghi "0 reboot trong phiên".
- Hệ quả: (i) mọi phép đo/công việc của 9 luồng đều làm trên boot 6fb582df TRƯỚC reboot — không có phép đo nào bị reboot làm sai; suite/O8 của T10 chạy 17:08–17:13:30Z trên 6fb582df vẫn đứng; (ii) chỉ hồ sơ đóng sổ sai (boot lúc đóng + số reboot + kết cục run 147); (iii) **mù #67 MỞ** (reboot #35) — giao T2-148 (đã giao trong log vòng lặp); (iv) T7-148 kiểm tiếp kết cục run 147/148 (xem §4).
- Lưu ý: claim "0 reboot trong phiên" trong LIMITS của từng luồng (T1/T2/T4/T5/T6/T7/T8/T9) đều ĐÚNG tại thời điểm từng luồng đóng (luồng đóng cuối là T7 16:59:55Z, trước reboot 17:28:08Z). Chỉ các claim ở cấp đợt (aggregate §9.2/§10.2, GAP §76 — viết sau reboot) là sai. Không luồng nào bịa số.

## §4. Run 147/148 — kiểm DB độc lập (scheduler.job_runs, read-only SELECT)

- Run 147 `98cf7700-6829-4217-8ad4-fe24a5a74d75` (scheduled_for 14:35:51Z): started_at hiện tại **17:28:34Z = btime(d8a11644, 17:28:08Z) + 26 s**; status **`timeout`**, finished_at **17:36:53Z**. So với lúc T7-147 đóng (started_at 14:35:51Z, jitter 0 s, status running): **run 147 BỊ VIẾT LẠI lần 2 tại reboot #35** — bằng chứng trực tiếp thứ 13 cho giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy" (T7-147 dừng ở kiểm thứ 20 / bằng chứng trực tiếp thứ 12; nay +1).
- **Offset 26 s NẰM NGOÀI dải ~30–50 s** (thấp hơn 4 s so với biên dưới 30 s). Chuỗi offset boot đúng giữ nguyên .../40 s (run 145) / 36 s (run 146) / **26 s (run 147)** — dải quan sát nay là 26–50 s, không còn là ~30–50 s. Giả thuyết "viết lại tại mỗi reboot" giữ đúng về sự kiện; dải offset cần mở rộng hoặc ghi nhận 26 s là điểm mới (giao T7-148 phán).
- Run 147 kết thúc `timeout` lúc 17:36:53Z (sau hạn 3 giờ tính từ scheduled 14:35:51Z là 17:35:51Z + 62 s). T10-147 đóng sổ với run 147 "running" là đúng tại thời điểm đó (16:55–17:33Z); kết cục timeout thuộc cửa T7-148.
- Run 148 `b33c757c-b8b5-40b0-a1b1-7ff69bb0d599` (scheduled_for 17:35:51Z): started_at **17:36:53Z — jitter +62 s**, status `running` lúc kiểm. Started_at run 148 trùng đúng giây finished_at run 147 (17:36:53Z) — run sau khởi động muộn vì run trước timeout xong mới nhả lượt; đây là lần đầu quan sát được chuỗi timeout→khởi động muộn kiểu này (khác mẫu quyết (m) đợt 145: run timeout + run sau chạy muộn — mẫu (m) là run sau chạy muộn NHIỀU; ở đây muộn 62 s, trong khi run 146/147 trước đó đều jitter 0 s).
- Run 146 `e24b5870`: started_at vẫn 12:14:02Z = btime + 36 s, `succeeded`, finished 14:24:36Z ✓ (không đổi). Run 145: 09:54:43Z = btime + 40 s, `succeeded` ✓ (không đổi).

## §5. Aggregate + GAP §76 + quyết parent §12.3

- Aggregate `docs/PHASE9_ROUND147_LIMITS.md` đầy đủ §1–§12, gồm verdict CHẤP NHẬN (đề xuất), 11 khiếm khuyết §9.6, đếm cuối §9.1, đối chiếu chéo §9.2, verify độc lập §9.3, sai số T10 §9.4, nợ mở §11, 18 câu hỏi §12.1 (a)–(r).
- **Quyết parent §12.3: ĐÃ CÓ — khác giả định trong brief giao T1-148 ("đang trống — ghi rõ CHƯA CÓ").** Parent (main chat) viết trực tiếp lúc ~00:42 +07 20/11/2026 (aggregate mtime 17:42:33Z, tăng 56.247 B → **63.757 B**, md5 hiện tại `8c9bb278f326af8bd93d7163192b228c`); tiêu đề ghi rõ "parent viết trực tiếp; §12.3 trống khi đọc, như đợt 146". 18 quyết (a)–(r) đầy đủ, khớp từng câu hỏi §12.1: (a) CHẤP NHẬN đợt 147 (đã phán luôn lệch giờ đóng — xem §2); (b) mù #66 đóng hoàn toàn, chuỗi lên 2; (c) gap 8.363 s chứng nhận [8.353, 8.373] s → CERT 66 / FULL 81; (d) khung chết #109? chốt làm chuẩn; (e) INSIDE 6 xác nhận; (f) F108? chưa đủ 3 server; (g) boot-specific xác nhận + #21 đo lại đợt 148, không chuyển #22; (h) SỬA PROBE giao T4-148, ưu tiên cao nhất; (i) harness chấp nhận với ghi rõ; (j) chuẩn hóa "O8 sau cờ T4" + giới hạn 16:30Z; (k) headroom 668 chỉ theo dõi; (l) watchdog giữ nguyên bản vá; (m) gate A giữ nguyên; (n) KHÔNG mở điều tra RAM sập đầy đủ; (o) xác nhận cách xử lý T7 (mẫu (m) không tái diễn); (p) mốc neo 8.363 s xác nhận; (q) T8 lỡ hạn mềm ghi nhận; (r) FULL PASS 4 → 5 xác nhận với caveat.
- **Caveat lớn: quyết (o) nay SAI một phần** — (o) viết "run 147 khởi động đúng giờ, không viết lại" dựa trên dữ kiện lúc T7 đóng (16:59:55Z); sau reboot #35 run 147 ĐÃ bị viết lại (17:28:34Z, +26 s) và kết thúc timeout (xem §4). Quyết (o) cần parent bổ sung, không tự sửa. Các quyết khác không bị reboot #35 ảnh hưởng (mọi phép đo đều trước reboot).
- Footer §12.3 đầy đủ: tổng batch chờ push 116 file (110 batch / 142 entry) chưa gồm closing, sau closing 117 file (111/144) ✓ khớp đếm §1; danh sách 9 batch stage ✓; oversize: aggregate (56.247 B), T6 89.322 B, T9 52.516 B; 6 LIMITS còn lại không oversize ✓ khớp kích thước trên đĩa (§8). **Lưu ý tự tham chiếu:** footer ghi "aggregate này (56.247 B)" — đó là kích thước TRƯỚC khi parent viết §12.3; sau khi viết xong aggregate là **63.757 B** (md5 `8c9bb278…`). Cùng mẫu round 146 (GAP ghi ~50,2 KB, aggregate sau §12.3 là 56.431 B) — không phải lỗi, chỉ ghi rõ để lần sau khỏi hỏi lại.
- GAP `PHASE9_GAP_ANALYSIS.md` §76 đầy đủ (mở/đóng, 9 luồng tóm tắt, đếm cuối, verdict, sai số T10, oversize). Nội dung §76 khớp aggregate từng luồng (đã đọc đối chiếu từng dòng) — TRỪ 3 điểm stale sau reboot/quyết parent (xem F-148-T1-4): (i) "0 reboot trong phiên" — sai (reboot #35); (ii) aggregate "(56.072 B)" — sai, thực 56.247 B lúc T10 đóng / 63.757 B sau §12.3; (iii) "T10 đóng 17:32Z, TRỄ hạn cứng ~2 phút" — theo cờ là 17:33:22Z (~3 phút, parent (a) đã phán).
- Đối chiếu MEMORY.md: MEMORY đã cập nhật đợt 147 (9/10/10; lũy kế 359/722/615; CERT 66/FULL 81; INSIDE 6; #21 chưa có lượt hợp lệ; headroom 668; quyết (g)/(h)/(j)/(o)...) — khớp aggregate + đếm của T1-148, TRỪ claim "0 reboot trong phiên" và "run 147 KHÔNG viết lại" (xem F-148-T1-6). T1-148 KHÔNG tự sửa MEMORY.md (luật cứng) — giao main chat sửa.

## §6. Đối chiếu chéo giữa các luồng (T1-148 kiểm độc lập)

### 6.1 Suite + O8 + harness (T1-148 chạy lại suite thật — xem §6.1b; đọc log + JSON gốc đợt 147 — xem §6.1a)

#### 6.1a. Bằng chứng gốc đợt 147 trên đĩa

- Suite cây gộp đợt 147: log `round147-t10-suites.log` có **27 dòng `exit=0` trên tổng 27 dòng `exit=`** → **27/27 exit 0** ✓; `=== ALL DONE 2026-11-19T17:13:30Z boot 6fb582df ===` ✓; `test-preview-engine.sh: 354 assertions pass` ✓. Suite chạy trên boot 6fb582df, TRƯỚC reboot #35 — đứng vững.
- O8 (JSON là bằng chứng chính): T8 WebKit `o8w-clicktest-report.json` **21 results, ok=True 21/21**; T8 Chromium `o8-clicktest-report.json` **21/21 ok=True** — cả 2 report 0 fail. Log `o8-147t8.log` có 10 dòng "21/21 pass" (O8 ×3 + harness), `O8 DONE 2026-11-19T17:00:43Z webkit1=0 webkit2=0 chromium=0`, S1 PASS cả 3 lần. **WebKit ×2 có bằng chứng riêng:** attempt1 start 16:58:16Z + attempt2 start 16:59:06Z, exit=0 16:59:53Z, boot 6fb582df (dòng log 49/85) — JSON chỉ còn 1 file 21 kết quả (attempt2 ghi đè attempt1, cùng cấu trúc dict `{results, logLines}`), nên "WebKit 21/21 ×2" dựa vào JSON attempt2 + log attempt1/attempt2 + dòng O8 DONE — đủ, nhưng ghi rõ JSON chỉ lưu 1 lần chạy (cùng mẫu các đợt trước). **Chuỗi WebKit FULL PASS 4 → 5 xác nhận đúng theo bằng chứng này** (caveat F-147-T10-2 vẫn đứng: không có lần chạy thứ ba của T10; quyết parent (r) đã xác nhận với caveat đó).
- Harness T8: 6 report JSON (`l10/m4/n2 × webkit/chromium` trong `*-scratch` / `*-scratch-chromium`) đều **ok=true** — kiểm độc lập bằng python, khớp LIMITS T8 §2 (6/6 PASS, 0 retry). Lưu ý vị trí: report nằm trong thư mục `*-scratch*`, không phải `smoke/` như aggregate §9.3 viết tắt ("3 report Chromium trong `smoke/`") — chỉ là cách viết tắt, file vẫn đủ trên đĩa.
- T10 lock O8: không kiểm lại (theo aggregate §10.4, không thuộc brief verify; xem F-148-T1-8).

#### 6.1b. T1-148 chạy lại thật (suite 27/27 — O8 KHÔNG chạy lại, xem F-148-T1-8)

- **Suite cây gộp: 27/27 exit 0, 0 rerun** (script `round148-t1-verify.sh`; chạy 17:42:48–17:51:28Z, boot **d8a11644** (boot mới sau reboot #35), cây preview.tsx 530e10a7; test-preview-engine.sh: **354 assertions pass**; log `round148-t1-suites.log`). Suite pass trên cả hai boot (6fb582df đợt 147 + d8a11644 đợt 148) với cùng cây — cây ổn định qua reboot.
- **O8 chạy lại: KHÔNG CHẠY** (quyết định có chủ ý của T1-148, không phải bị chặn): T8-148 đang chạy trong cùng lượt (thứ tự O8 đã đổi theo quyết (j)), chạy O8 chen ngang có thể nhiễm tải/lock của T8-148. Kết luận O8 đợt 147 vẫn đứng trên bằng chứng gốc trên đĩa (§6.1a: 2 JSON 21/21 ok=True + log attempt1/attempt2 + dòng O8 DONE) — theo đúng tiền lệ F-146-T1-6(a) (đọc log + JSON gốc là đủ bằng chứng, không bắt buộc chạy lại). Chuỗi WebKit FULL PASS giữ nguyên **5** (đợt 147) — T1-148 không chạy thêm lần O8 nào nên không cộng chuỗi lên 6.

### 6.2 Lượt yên #21 — hậu kiểm 2 attempt (bằng chứng gốc, không chỉ đọc LIMITS)

- Đọc trực tiếp analyzer T4 `round147-t4/analyze-t4-attempt{1,2}-6fb582df-tickcost.txt`:
  - A1: tickCost **n=472, median 51,0 ms**, p90 78,9, min 28, rAF/pass median 36 ✓ khớp LIMITS T4 + aggregate §3.
  - A2: tickCost **n=351, median 37,0 ms**, p90 60,0, min 27, rAF/pass median 42 ✓.
  - Cả 2 attempt đều partial (A1 17/20, A2 11/20 — kẹt sau writePartial timeout, F-147-T4-1) → **#21 VẪN CHƯA CÓ LƯỢT HỢP LỆ là kết luận chắc chắn**, khớp aggregate §9.6(1). Thí nghiệm (h) đã có đáp án (median về dưới ngưỡng trên boot mới) — khớp quyết parent (g).
- Cộng dồn giữ nguyên 17 lượt — T1-148 không tính lại (c2) từ log thô (thuộc brief T4) — ghi rõ giới hạn, xem F-148-T1-8.

### 6.3 T2 — mù #66 / CERT 66 / FULL 81 (tái tính mean độc lập)

- Merged gap từ log gốc `blind66-merged.log`: đoạn A largest_gap **120 s** (11:59:12Z → 12:01:12Z), floor(120/1147)=0, max_hidden=0 ✓; đoạn B largest_gap **937 s** (13:05:21Z → 13:20:58Z), floor=0, max_hidden=0 ✓ — khớp aggregate §2 (cả hai đoạn đóng theo luật gap, KHÔNG cần uptime).
- Gap 98a7c93f→6fb582df = **8.363 s** (12:13:26Z − 09:54:03Z = 8.363 s, T1-148 tính lại bằng epoch) ✓; chứng nhận [8.353, 8.373] s → CERT 66 / FULL 81 (quyết parent (c) đã chốt).
- Tái tính mean từ các đầu vào đã công bố (CERT65 mean 1h34'42" = 5.682 s; FULL80 mean 1h40'40" = 6.040 s — cả hai đều là số đã làm tròn tới giây):
  - CERT66 = (65×5.682 + 8.363)/66 = **5.722,6 s = 1h35'23"** ✓ khớp số công bố.
  - FULL81 = (80×6.040 + 8.363)/81 = **6.068,7 s = 1h41'09"** — cao hơn số công bố **1h41'08"** đúng ~0,7 s. **Đây là sai số làm tròn của phép tính tay của T1-148, không phải lỗi của T2** (cùng họ F-147-T1-4): mean FULL80 thật (tính từ danh sách gap gốc bằng script T2, không phải từ số đã làm tròn 6.040 s) cho 1h41'08"; script T2 tái tạo chính xác các thống kê gốc (assert cross-check N6/P6/Q6 trong `blind66-gaps.txt`) nên số script là chuẩn. Ghi rõ để lần sau khỏi hỏi lại (xem F-148-T1-7).
- Khung chết #109? ứng viên (12:13:15Z, 12:13:26Z] 11 s: merged log ghi `A latest merged mark: 2026-11-19T12:13:15Z` ✓ — đã được quyết parent (d) chốt làm chuẩn.
- F108? ≈ 0 s: T1-148 không đo lại (thuộc brief T2; quyết parent (f) đã ghi là chưa đủ 3 server).

### 6.4 T5 — replay + sampler (đối chiếu log gốc)

- Sampler T5 `ram-sampler.log`: **n=40 mẫu, max avail 2.724.360 kB = 43,3% guard** ✓ khớp LIMITS T5 + aggregate §4; 0 mẫu ≥ guard (ngưỡng 6.291.456 kB) — kiểm bằng script, không chỉ đọc LIMITS.
- Frozen replay: file `round146-t5/dpkg-frozen-6fb582df.txt` (9 dòng) ghi `dpkg_md5=d2b2e788533bb494d843aed1abd3d5f9`, 1545 dòng / 221 installs / 462 configure, gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2 ✓ khớp LIMITS T5 (md5 `d2b2e788…` là md5 của `/var/log/dpkg.log` lúc đóng băng, ghi TRONG file frozen — không phải md5 của chính file frozen). **dpkg.log live boot 6fb582df không còn trên đĩa** (boot đã đổi sang d8a11644, T5-148 đang replay boot mới) nên T1-148 không đối chiếu lại md5 với log live — ghi rõ giới hạn (xem F-148-T1-8).
- Headroom T5 `headroom-open.txt`/`headroom-end.txt`: 669 → 661 ✓ khớp aggregate §4 (T9 đối chiếu 668/668/658, chênh ≤3 watch — sai số pha lấy mẫu, khớp hướng).

### 6.5 T9 — headroom + sampler (đối chiếu log gốc)

- Sampler T9 `ram-sampler.log`: **n=107 mẫu** (14:44:04–16:30:08Z), max mem **2.572.644 kB = 40,89% guard** ✓ khớp LIMITS T9 + aggregate §8; 0 mẫu `bal=6443824` (0 mẫu đóng băng trong cửa sổ) ✓; balloon max 6.136.248 kB (94,7% trần) về cuối phiên ✓ khớp phán "chuỗi đóng băng 9 đợt đã đứt trong cửa sổ đo nhưng không kết luận hết đóng băng" (quyết parent (m) đã chốt).
- Headroom 668 (LIMITS T9 §1: 668/668 chênh 0, lần 3 658) — T1-148 không đo lại headroom (số đo theo thời điểm, không tái tạo hậu kiểm) — xem F-148-T1-8.

### 6.6 T6 — lock + prune (đối chiếu file gốc)

- Prune lần 22: `prune-deleted.txt` ghi `removed '…/vite.lock.queue/cooldown-s4-staleprobe'` ✓ — xóa file lần thứ hai liên tiếp, khớp aggregate §5.
- Lock queue lúc T1-148 kiểm: không đếm lại (T8-148 đang chạy trong lượt, số đang đổi) — ghi rõ giới hạn, xem F-148-T1-8.

### 6.7 Kích thước LIMITS các luồng (đối chiếu aggregate footer)

- Kích thước trên đĩa khớp đúng từng byte với footer §12.3: T1 26.497 B, T2 37.720 B, T4 19.347 B, T5 37.022 B, T6 89.322 B, T7 32.043 B, T8 37.643 B, T9 52.516 B ✓. Oversize (>37.768 B): T6, T9 + aggregate — khớp footer. Aggregate lúc T10 đóng: **56.247 B** (md5 `49769fc5f7d95a790444140917e0029c` — khớp nội dung cờ t10.done); sau khi parent viết §12.3: **63.757 B** (md5 `8c9bb278f326af8bd93d7163192b228c`, mtime 17:42:33Z) — xem §5.

## §7. Cây lúc đóng

- Kiểm md5 lúc T1-148 mở phiên (17:36Z, boot d8a11644 — sau khi đóng đợt 147 + reboot #35): preview.tsx **530e10a7** ✓, media.ts **2c384ed1** ✓, vite.config.ts **ee80d093** ✓ — khớp cây lúc T10-147 đóng (17:24Z). **Cây không đổi qua reboot #35.**
- Kiểm lại cuối phiên (sau suite chạy lại của T1-148, 17:51Z): preview.tsx vẫn 530e10a7 — suite của T1-148 không sửa cây.
- Lưu ý phương pháp: đường dẫn đúng là `apps/web/src/preview.tsx`, `apps/web/src/media.ts`, `apps/web/vite.config.ts` (đã xác minh từ đợt trước, không lặp lỗi gõ sai đường dẫn).

## §8. Khiếm khuyết / nợ mở còn lại (từ đợt 147, không đổi verdict)

- Lượt yên #21: đo lại ở đợt 148 trên boot mới d8a11644 (quyết (g) — ngân sách attempt mới 3/3, không chuyển sang #22); sửa probe trước (quyết (h) — timeout writePartial + wall-clock, giao T4-148 ưu tiên cao nhất).
- Cửa sổ guard: cơ chế tự động (a) đã nối + dry-run PASS nhưng chưa có lần kích hoạt thật — giữ nguyên sampler + trigger cho đợt 148 (lockfile đợt 147 nằm trong dir round147-t9 nên không chặn đợt 148). Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức.
- Thứ tự O8: chuẩn hóa "O8 sau cờ T4" + giới hạn 16:30Z (quyết (j)) — giao T8-148 áp dụng.
- Harness lệch chuẩn gate F-147-T8-3: chấp nhận với ghi rõ (quyết (i)) — trích là "harness sau khi T4 đóng cờ".
- Headroom 668 dưới ngưỡng lần 7 (quyết (k): vẫn chỉ theo dõi); balloon chuỗi đóng băng đứt trong cửa sổ đo nhưng không kết luận hết đóng băng (quyết (m): giữ gate A ≥1024 MB); watchdog chưa được thử bằng kẹt thật đợt thứ 6 (quyết (l): giữ nguyên bản vá); RAM sập ~6,5 GB + cụm spike C load1 4,80 không rõ nguồn: không mở điều tra đầy đủ, giao T5/T9-148 đối chiếu có mục tiêu (quyết (n)).
- Oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; G1 chờ user quyết; R9 (a) vẫn chờ user (số đếm vẫn là 16).
- Run 147 kết thúc `timeout` 17:36:53Z + run 148 khởi động muộn jitter +62 s — kết cục thuộc cửa T7-148 (xem §4).
- **Mới từ đợt này:** reboot #35 + mù #67 (giao T2-148); quyết parent (o) cần bổ sung (run 147 đã bị viết lại); MEMORY.md đoạn đợt 147 cần sửa claim "0 reboot"/"không viết lại" (giao main chat — T1-148 không tự sửa).

## §9. Sai số F-148-T1-1..9 (ghi rõ — kể cả sai số của chính T1-148)

- **F-148-T1-1 — Claim "0 reboot trong phiên" của đợt 147 SAI (nghiêm trọng nhất đợt này):** reboot #35 (6fb582df → d8a11644, btime 17:28:08Z) xảy ra trong lúc T10-147 đóng sổ, sau cờ T8 17:22:19Z và trước khi aggregate/GAP/cờ T10 được ghi 17:33–17:34Z. Aggregate §9.2/§10.2, GAP §76 đều ghi 0 reboot — sai cho toàn đợt tính tới lúc đóng sổ (đúng tại thời điểm từng luồng đóng, T7 đóng cuối 16:59:55Z). Tuổi thọ boot 6fb582df = **18.882 s**. Không làm sai phép đo nào (mọi phép đo đều trước reboot); chỉ hồ sơ đóng sổ sai + mù #67 mở. Đề xuất: T10 đợt sau kiểm lại boot_id ngay trước khi ghi aggregate cuối (1 lệnh `cat /proc/sys/kernel/random/boot_id`), đừng tin boot đã kiểm lúc mở đợt.
- **F-148-T1-2 — Run 147 BỊ VIẾT LẠI lần 2 tại reboot #35 + kết thúc TIMEOUT (quyết parent (o) nay sai một phần):** started_at hiện tại 17:28:34Z = btime + **26 s (NGOÀI dải ~30–50 s)**; status `timeout`, finished 17:36:53Z; run 148 khởi động 17:36:53Z, jitter **+62 s** (trùng giây finished_at run 147). Bằng chứng trực tiếp thứ 13 cho giả thuyết viết lại; chuỗi offset nay .../40/36/26 s — dải quan sát mở rộng xuống 26 s. Quyết (o) viết "run 147 không viết lại" dựa trên dữ kiện lúc T7 đóng; cần parent bổ sung, không tự sửa quyết đã chốt.
- **F-148-T1-3 — Ba mốc giờ đóng không khớp (GAP 17:32Z / cờ nội dung 17:33:22Z / cờ mtime 17:34:14Z):** nội dung cờ trích md5 aggregate bản 56.247 B lúc 17:34:03Z nên chỉ viết được sau 17:34:03Z — phù hợp mtime 17:34:14Z, không phù hợp giờ 17:33:22Z; giả thuyết nhất quán nhất là T10 soạn nội dung cờ lúc 17:33:22Z rồi ghi file sau khi aggregate chốt lần cuối (ghi rõ là giả thuyết). Quyết parent (a) đã phán lấy 17:33:22Z làm giờ đóng — T1-148 ghi theo, không tự đổi.
- **F-148-T1-4 — GAP §76 stale 3 điểm:** (i) "0 reboot trong phiên" — sai (xem F-148-T1-1); (ii) aggregate "(56.072 B)" — sai, thực 56.247 B lúc T10 đóng / 63.757 B sau §12.3; (iii) "T10 đóng 17:32Z, TRỄ ~2 phút" — theo cờ là 17:33:22Z (~3 phút, parent (a) đã phán). Nguyên nhân: GAP soạn từ bản nháp aggregate (~17:32Z, 56.072 B) rồi ghi lúc 17:34:03Z mà không cập nhật lại; parent cũng không sửa GAP khi viết §12.3. Không đổi verdict; bài học lặp lại: GAP nên ghi sau khi aggregate chốt lần cuối, và đối chiếu lại kích thước/giờ đóng trước khi ghi.
- **F-148-T1-5 — Closing stage TRƯỚC khi aggregate/GAP chốt lần cuối (tái diễn mẫu F-147-T1-2/F-146-T1-3):** file `phase9-round147-closing.txt` mtime 17:33:35Z, trong khi aggregate/GAP mtime 17:34:03Z (+28 s; aggregate còn tăng 56.072 → 56.247 B trong khoảng đó). Danh sách file trong batch closing không đổi (vẫn đúng 2 entry aggregate + GAP) — chỉ nội dung hai file đó còn tiến hóa sau khi stage; push đọc từ đĩa lúc push nên không có nguy cơ blob cũ, nhưng hồ sơ "stage lúc nào" không phản ánh đúng thời điểm nội dung chốt. Không đổi verdict; bài học lặp lại lần thứ ba: T10 nên stage closing SAU khi GAP + aggregate đã chốt hẳn (trừ phần §12.3 parent viết sau).
- **F-148-T1-6 — Aggregate §9.2 liệt kê giờ cờ T1 sai 28 s:** ghi "T1 15:52:07" — đó là mtime file LIMITS T1, cờ mtime thực 15:52:35. Cùng họ F-147-T1-1 (liệt kê theo mtime không nhất quán: các cờ khác ghi theo mtime cờ). Chỉ lỗi liệt kê, không đổi verdict.
- **F-148-T1-7 — Tái tính FULL81 bằng tay lệch 0,7 s so với số script:** (80×6.040 + 8.363)/81 = 6.068,7 s = 1h41'09" vs số công bố 1h41'08". Nguyên nhân là đầu vào FULL80 mean đã làm tròn tới giây; mean thật từ danh sách gap gốc (script T2) cho 1h41'08". Không phải lỗi của T2; ghi rõ để lần sau khỏi hỏi lại (cùng họ F-147-T1-4). CERT66 tái tính khớp đúng 1h35'23".
- **F-148-T1-8 — Giới hạn của chính T1-148 (ghi rõ, không giấu):** (a) không chạy lại O8 (quyết định có chủ ý — T8-148 đang chạy cùng lượt; xác nhận bằng JSON + log gốc theo tiền lệ F-146-T1-6(a)); (b) không tính lại merged gap mù #66 từ log thô ngoài việc đọc `blind66-merged.log` đã tính sẵn (thuộc brief T2); (c) không tính lại (c2) lượt yên #21 từ log thô (dựa vào analyzer T4); (d) không đo lại headroom/RAM/balloon (số đo theo thời điểm, không tái tạo hậu kiểm); (e) không kiểm lại log lock thô / ACQUIRED−RELEASED = 6 và HB/DR lũy kế từ log thô (theo aggregate, không thuộc brief verify; lock queue lúc kiểm đang đổi vì T8-148 chạy); (f) dpkg.log live boot 6fb582df không còn trên đĩa (boot đã đổi) — chỉ đối chiếu file frozen (dpkg_md5 ghi trong file).
- **F-148-T1-9 — Khoảng cách hai cách đếm "lần thứ N liên tiếp" vẫn là 2:** cách T1 lần thứ 29, cách main chat lần thứ 27 (T1-147: 28 vs 26). Khoảng cách 2 giữ nguyên qua ba đợt. Chỉ là lỗi hồ sơ, không chạm số đếm (mọi dải tái kiểm đều khớp).

## §10. Files + stage

- LIMITS này: `docs/PHASE9_ROUND148_T1_VERIFY147_LIMITS.md` — kích thước + md5 lúc tạo cờ được ghi TRONG FILE CỜ `round148-t1.done` (tránh vòng lặp tự tham chiếu: ghi số vào chính file sẽ đổi số đó — bài học F-146-T1-1).
- Script đếm: `hidden_files/round148-t1/count-final-148-t1.py` (ngoài repo — KHÔNG stage vào batch push; chỉ LIMITS này được stage).
- Suite log: `hidden_files/round148-t1/round148-t1-suites.log` (27/27 exit 0, boot d8a11644). Không có report JSON O8 mới — không chạy O8 lần nào (xem F-148-T1-8).
- Stage: `phase9-round148-t1-verify147.txt` (1 entry NUL-delimited, verify od). KHÔNG PUSH.
- Cờ: `round148-t1.done` khi xong (trước hạn cờ 20:00Z).
