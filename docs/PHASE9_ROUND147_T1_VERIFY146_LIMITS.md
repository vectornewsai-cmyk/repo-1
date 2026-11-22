# VCut Studio — Phase 9, đợt 147, T1: kiểm chứng độc lập đợt 146 (verify146)

- Mở: lượt cron 21:35 +07 = 14:35:51Z 19/11/2026, boot **6fb582df** (btime 12:13:26Z, #110? chặt theo quyết parent (g) đợt 146). Hạn cờ ~17:00Z, hạn cứng đóng đợt 17:30Z.
- **Verdict T1-147: PASS — đợt 146 đứng vững hoàn toàn.** Mọi số đếm khớp 100% với số công bố; 9/9 cờ đủ; aggregate + GAP §75 đầy đủ kèm quyết parent §12.3 (a)–(r) đã ghi đúng; suite 27/27 + O8 21/21 ×4 JSON ok=True đối chiếu đúng log trên đĩa; lượt yên #21 hậu kiểm đúng artifact gốc (median 99,0/101,0/97,0 ms, 3/3 attempt 20/20); CERT 65 / FULL 80 mean tái tính khớp (trong sai số làm tròn của đầu vào đã công bố); **started_at run 146 kiểm DB độc lập: 12:14:02Z = btime(6fb582df) + 36 s** — xác nhận độc lập kết luận viết lại 1 lần của T7; cây lúc đóng không đổi (preview.tsx 530e10a7).
- KHÔNG PUSH trong phiên này — chỉ stage, để đó; user tự push sau từ main chat khi nhắn "push đi".

## §1. Đếm cuối — dedup toàn cục bằng script MỚI viết từ đầu

- Script `hidden_files/round147-t1/count-final-147-t1.py` (viết mới hoàn toàn cho đợt này, không tái dùng code T10-146 hay T1-146; đọc mọi file `phase9-round*.txt` trong `paths-loop/` — 998 file, tách NUL, dedup toàn cục, regex số đợt từ tên file, KHÔNG cộng dồn tay; kiểm luôn file paths không thuần NUL + đường dẫn stage thiếu trên đĩa). Kết quả lưu `hidden_files/round147-t1/t1-count-final-147.txt`.
- Kết quả (khớp 100% số T10-146 công bố + file `t10-count-final-146.txt` + aggregate §9.1 + footer §12.3):

| Phạm vi | Batch | Entry | File duy nhất |
|---|---|---|---|
| Đợt 146 | **9** | **11** | **11** |
| Lũy kế 111–146 | **350** | **712** | **606** |
| Tái kiểm 111–145 | 341 | 701 | 597 |
| Tái kiểm 111–144 | 332 | 690 | 588 |
| Chờ push 136–146 | **102** | **134** | **108** |

- Tái kiểm 111–145 = 341/701/597, 111–144 = 332/690/588 đều khớp số công bố các đợt trước — **lần thứ 28 liên tiếp khớp theo cách đếm của T1** (T1-146 đếm lần thứ 27; theo cách đếm của main chat là lần thứ 26 — xem F-147-T1-5 về lệch số giữa hai cách đếm).
- Chi tiết đợt 146: 9 file paths (t1/t2/t4/t5/t6/t7/t8/t9 + closing); 11 entry = 9 LIMITS mới + aggregate + GAP; 2 file trùng với 111–145 (PHASE9_GAP_ANALYSIS.md + `apps/web/scripts/vcut-webkit-postboot-check.sh` — trùng hợp lệ, cùng mẫu các đợt trước; T10-146 ghi "trùng đúng 1 file" là đếm TRƯỚC closing — sau closing GAP là file trùng thứ 2, nhất quán); 0 đường dẫn stage thiếu trên đĩa; 0 file paths không thuần NUL (kiểm toàn bộ 998 file); 0 entry trùng lặp trong một file paths đợt 146.
- Caveat script (ghi rõ, không ảnh hưởng số): file `phase9-round14-parity5.txt` được regex xếp vào đợt 14 (đúng tên file); chỉ ảnh hưởng tổng đợt 14, không chạm các dải 111–146. 998 file paths quét được = 989 file lúc T1-146 đếm + 9 file mới của đợt 146 — nhất quán.

## §2. Cờ — 9/9 đủ

| Cờ | mtime (Z, giây) | Nội dung khớp aggregate? |
|---|---|---|
| round146-t1.done | 11:40:14 | ✓ PASS verify145, 9/11/11, lũy kế 341/701/597 |
| round146-t2.done | 11:54:04 | ✓ probe #65, mù #65 đóng hoàn toàn, INSIDE 5 (xem F-147-T1-6: nội dung ghi "no new reboot, no blind #66" nay đã lỗi thời vì reboot #34 xảy ra sau khi T2 đóng — aggregate §2 đã ghi rõ) |
| round146-t6.done | 11:54:09 | ✓ 0 byte, thông lệ |
| round146-t4.done | 12:18:31 | ✓ #21 không có lượt hợp lệ, median 99,0/101,0/97,0 ms |
| round146-t8.done | 12:37:24 | ✓ 0 byte, thông lệ |
| round146-t5.done | 12:59:07 | ✓ 0 byte, thông lệ |
| round146-t9.done | 13:56:36 | ✓ 0 byte, thông lệ |
| round146-t7.done | 14:06:33 | ✓ HB 6/6 + DR 3/3, run 146 viết lại 1 lần offset 36 s |
| round146-t10.done | 14:21:40 | ✓ CHẤP NHẬN, đếm cuối 9/11/11, lũy kế 350/712/606 |

- Thứ tự mtime thực: T1 11:40:14 → T2 11:54:04 → T6 11:54:09 → T4 12:18:31 → T8 12:37:24 → T5 12:59:07 → T9 13:56:36 → T7 14:06:33 → T10 14:21:40. Đủ trước hạn cờ ~14:15Z (T7 đóng cuối 14:06:33Z); T10 đóng 14:21:40Z, trước hạn cứng 14:30Z.
- **Sai lệch nhỏ trong aggregate §9.2 (F-147-T1-1):** aggregate liệt kê thứ tự cờ là "T1 11:40:14, T6 11:54:09, T2 11:54 (~11:54Z), …" — đặt T6 trước T2, trong khi mtime thực là T2 11:54:04 < T6 11:54:09 (T2 trước T6 đúng 5 giây). Chỉ là lỗi thứ tự liệt kê trong §9.2; các §2/§5 ghi đúng từng cờ (T2 11:54Z, T6 11:54:09Z) và verdict không đổi.
- Boot lúc T1-147 mở phiên: **6fb582df** (khớp brief); kiểm lại cuối phiên vẫn 6fb582df, btime 1795090406 = 12:13:26Z — **0 reboot trong phiên T1-147**.
- Chốt chặn `round-in-progress.md` KHÔNG TỒN TẠI lúc T1-147 kiểm.

## §3. Aggregate + GAP §75 + quyết parent §12.3

- Aggregate `docs/PHASE9_ROUND146_LIMITS.md` đầy đủ §1–§12, gồm verdict CHẤP NHẬN, 10 khiếm khuyết §9.6, đếm cuối §9.1, đối chiếu chéo §9.2, verify độc lập §9.3, sai số T10 §9.4, nợ mở §11, 18 câu hỏi §12.1 (a)–(r).
- GAP `PHASE9_GAP_ANALYSIS.md` §75 đầy đủ (mở/đóng, 1 reboot #34, T1–T10 tóm tắt, đếm cuối, verdict, sai số T10, oversize). Nội dung §75 khớp aggregate từng luồng (đã đọc đối chiếu từng dòng). GAP mtime 14:21:49Z — xem F-147-T1-2.
- Quyết parent §12.3 (a)–(r) đã ghi đầy đủ, khớp từng câu hỏi §12.1: (a) CHẤP NHẬN đợt 146; (b) mù #65 đóng hoàn toàn — chuỗi lên 1, XÁC NHẬN uptime làm closer (chuẩn 3 điều kiện, tiền lệ lần đầu); (c) gap 7.067 s CHỨNG NHẬN [7.057, 7.077] s → CERT 65 / FULL 80; (d) khung chết #108? (09:44:04Z, 09:54:03Z] CHỐT LÀM CHUẨN; (e) chuỗi INSIDE lên 5 XÁC NHẬN; (f) F107? ≈ 0 s GHI LÀ CHƯA ĐỦ 3 SERVER; (g) reboot #34 XÁC NHẬN, 6fb582df = #110?; (h) #21 ĐO LẠI đợt 147 trên boot mới; (i) KHÔNG mở điều tra chậm riêng lúc này; (j) DUYỆT thêm cổng tickCost, giao T4-147; (k) harness CHẤP NHẬN với ghi rõ lệch chuẩn, trích là "harness sau khi T4 đóng cờ"; (l) DUYỆT tự động hóa birefnet phương án (a), giao T9-147; (m) headroom 880 VẪN CHỈ THEO DÕI, DUYỆT cap probe 30.000; (n) watchdog GIỮ NGUYÊN bản vá; (o) gate A GIỮ NGUYÊN ≥1024 MB; (p) mẫu quyết (m) KHÔNG tái diễn — XÁC NHẬN cách xử lý của T7; (q) tuổi thọ boot 98a7c93f CHUẨN LÀ 8.363 s, giao T7-147 đối chiếu mốc neo; (r) ghi chú nguồn gốc §12.3 đợt 145 GIỮ NGUYÊN làm dấu vết lịch sử.
- Đối chiếu MEMORY.md: MEMORY đã cập nhật đợt 146 (9/11/11; lũy kế 350/712/606; CERT 65/FULL 80; INSIDE 5; #21 không có lượt hợp lệ; cửa sổ guard đầu tiên; headroom 880; reboot #34; run 146 viết lại offset 36 s; quyết (b)/(c)/(q)/(l)) — khớp 100% aggregate + đếm của T1-147.
- **Ghi chú nguồn gốc §12.3 đợt 146 (bài học F-146-T1-1, đã áp dụng):** §12.3 do parent viết trực tiếp (tiêu đề ghi rõ "parent VIẾT TRỰC TIẾP; §12.3 trống khi đọc"). Aggregate mtime hiện tại **14:27:40Z** (sau cờ T10 14:21:40Z ~6 phút) — lần sửa sau cờ này chính là thao tác viết §12.3 của parent, khớp mẫu đã giải thích ở quyết (r) đợt 146. Kích thước + md5 aggregate lúc T1-147 đọc: **56.431 B, md5 `7cd14d2e50a1ccf645851a49b7298dff`**. GAP §75 (viết 14:21:49Z) ghi aggregate "(~50,2 KB)" — tức aggregate lúc T10 đóng/GAP viết là ~50,2 KB; phần chênh ~6,2 KB chính là khối §12.3 parent thêm sau. Nhất quán, không có lần sửa sau cờ nào chưa giải thích.

## §4. Đối chiếu chéo giữa các luồng (T1-147 kiểm độc lập)

### 4.1 Suite + O8 (T1-147 chạy lại thật — xem §4.1b; đọc log + JSON gốc đợt 146 — xem §4.1a)

#### 4.1a. Bằng chứng gốc đợt 146 trên đĩa

- Suite cây gộp đợt 146: log `round146-t10-suites.log` có **27 dòng `exit=0` trên tổng 27 dòng `exit=`** → **27/27 exit 0** ✓; `=== ALL DONE 2026-11-19T14:12:17Z boot 6fb582df ===` ✓; `test-preview-engine.sh: 354 assertions pass` ✓.
- O8 (JSON là bằng chứng chính): T8 WebKit `o8w-clicktest-report.json` **21 results, ok=True 21/21**; T8 Chromium **21/21**; T10 WebKit **21/21**; T10 Chromium **21/21** — cả 4 report 0 fail. **Chuỗi WebKit FULL PASS 3 → 4 xác nhận đúng** (T8 pass ×2 boot 98a7c93f + T10 pass ×1 boot 6fb582df, hai boot khác nhau, cùng cây).
- Harness T8: 6 report JSON (`l10/m4/n2 × webkit/chromium`) đều **ok=true** — kiểm độc lập bằng python, khớp LIMITS T8 §2 (6/6 PASS, 0 retry). Log `o8-146t8.log` có 10 dòng "21/21 pass" (O8 ×3 + harness, không tách riêng từng lần trong cùng một file log — số JSON là bằng chứng chính).
- T10 lock O8: log `t10-o8-lock.log` ghi acquire → "ĐÃ NHẢ (… 2026-11-19T14:14:16Z, giữ 101s)" ✓ khớp aggregate §9.2 (hold 101 s, wait 1 s).

#### 4.1b. T1-147 chạy lại thật (suite 27/27 — O8 chạy lại BỊ CHẶN, xem F-147-T1-9)

- **Suite cây gộp: 27/27 exit 0, 0 rerun** (script `round147-t1-verify.sh`, adapt từ script T10-146; chạy 14:42:xx–14:46:34Z, boot 6fb582df, cây preview.tsx 530e10a7; test-preview-engine.sh: **354 assertions pass**; log `round147-t1-suites.log`).
- **O8 chạy lại: KHÔNG CHẠY ĐƯỢC (bị chặn bởi lock vite — F-147-T1-9).** Driver O8 (`t1-147-o8-driver.sh`, lock `t1-147-round147`) thử acquire 2 lần, mỗi lần chờ đủ 1800 s rồi timeout: lần 1 (14:48:20Z → TIMEOUT 15:18:25Z), lần 2 (15:20:27Z → TIMEOUT 15:50:28Z). Nguyên nhân: T4-147 attempt1 giữ lock từ 14:47:43Z (ticket t4, port 5187) — probe WebKit của T4 kẹt ở 17/20 pass từ 14:50:29Z, process còn sống nhưng chỉ dùng 4 s CPU trong hơn 60 phút, log không tiến thêm dòng nào; T1-147 không chen ngang, không kill process của T4, chỉ chờ đúng quy trình lock. **Kết luận O8 đợt 146 vẫn đứng vững trên bằng chứng gốc trên đĩa (§4.1a: 4 report JSON 21/21 ok=True, kiểm độc lập bằng python) — theo đúng tiền lệ F-146-T1-6(a) của T1-146 (đọc log + JSON gốc là đủ bằng chứng, không bắt buộc chạy lại).** Chuỗi WebKit FULL PASS giữ nguyên **4** (đợt 146) — T1-147 không chạy thêm lần O8 nào nên không cộng chuỗi lên 5; số 5 trong bản nháp trước của LIMITS này đã được sửa lại (xem F-147-T1-9).

### 4.2 Lượt yên #21 — hậu kiểm 3 attempt (bằng chứng gốc, không chỉ đọc LIMITS)

- Đọc trực tiếp artifact T4 `round146-t4/analyze-t4-attempt{1,2,3}-98a7c93f-tickcost.txt`:
  - A1: tickCost **n=411, median 99,0 ms**, p90 137,0, min 53, rAF/pass 26 ✓ khớp LIMITS T4 + aggregate §3.
  - A2: tickCost **n=398, median 101,0 ms**, p90 144,3, min 54, rAF/pass 25 ✓.
  - A3: tickCost **n=425, median 97,0 ms**, p90 136,0, min 52, rAF/pass 26 ✓.
  - Cả 3 run log đều ghi "partial JSON đã ghi: 20/20 pass" (A1 12:01:11Z, A2 12:08:25Z, A3 12:13:13Z) — 3/3 attempt đều 20/20 nhưng median 97–101 ms > 60 ms → **KHÔNG CÓ LƯỢT HỢP LỆ là kết luận chắc chắn**, khớp aggregate §9.6(1).
  - A3 finalization bị reboot giết: run log attempt3 dừng ở 12:13:15Z (3 dòng số 0 cuối), không có dòng kết thúc — khớp cửa sổ chết (12:13:15Z, 12:13:26Z] mà T4 ghi.
- Cộng dồn giữ nguyên 17 lượt — T1-147 không tính lại (c2) từ log thô (thuộc brief T4; T4-146 + T9-146 đã đối chiếu chéo load1 attempt2 = 4,67) — ghi rõ giới hạn, xem F-147-T1-8.

### 4.3 T2 — mù #65 / CERT 65 / FULL 80 (tái tính mean độc lập)

- Merged gap từ log gốc `blind65-merged.log`: đoạn A largest_gap **599 s** (09:44:04Z → 09:54:03Z), floor(599/1147)=0, max_hidden=0 ✓; đoạn B largest_gap **1.295 s** (10:20:22Z → 10:41:57Z), floor=1, max_hidden=1 ✓ — khớp aggregate §2 (đoạn A đóng theo luật gap; đoạn B vượt sàn, closure dựa vào uptime — đã được quyết parent (b) xác nhận).
- Gap e146ca67→98a7c93f = **7.067 s CONDITIONAL** trong `blind65-gaps.txt:923` ✓; sau quyết parent (c) → chứng nhận [7.057, 7.077] s, CERT 65 / FULL 80.
- Tái tính mean từ các đầu vào đã công bố (CERT64 mean 5.660,75 s; FULL79 mean 1h40'27" — cả hai đều là số đã làm tròn tới giây):
  - CERT65 = (64×5.660,75 + 7.067)/65 = **5.682,38 s = 1h34'42"** ✓ khớp số công bố.
  - FULL80 = (79×6.026,3 + 7.067)/80 = **6.039,31 s = 1h40'39"** — thấp hơn số công bố **1h40'40"** đúng ~0,7 s. **Đây là sai số làm tròn của phép tính tay của T1-147, không phải lỗi của T2:** mean FULL79 thật (tính từ danh sách gap gốc bằng script T2, không phải từ số đã làm tròn 6.026,3 s) có thể cao hơn tới ~0,5 s × 79/80 ≈ 0,5 s, và FULL80 làm tròn lên 6.040 s khi mean thật ≥ 6.039,5 s. Script T2 tái tạo chính xác các thống kê gốc (assert cross-check N6/P6/Q6 trong `blind65-gaps.txt`) nên số script là chuẩn. Ghi rõ để lần sau khỏi hỏi lại.
- Khung chết #108? ứng viên (09:44:04Z, 09:54:03Z] 599 s: merged log dòng 22 ghi đúng khung này ✓ — đã được quyết parent (d) chốt làm chuẩn.
- F107? ≈ 0 s: T1-147 không đo lại (thuộc brief T2; quyết parent (f) đã ghi là chưa đủ 3 server).

### 4.4 T5 — replay 2 boot + cửa sổ guard (đối chiếu log gốc)

- `/var/log/dpkg.log` hiện tại (boot 6fb582df): **1.545 dòng / 221 `status installed` / 462 dòng chứa `configure`**, gói cuối gstreamer1.0-tools 1.24.2-1ubuntu0.2 lúc 12:16:22Z (= btime +2m56s) ✓ khớp LIMITS T5 (replay boot 2 NHANH NHẤT, +2m56s). File đóng băng `dpkg-frozen-6fb582df.txt` / `dpkg-frozen-98a7c93f.txt` đều 9 dòng, last_pkg khớp, history_startdates=50 ✓.
- Cửa sổ guard — sampler T5 `ram-sampler.log`: **11:51:28Z avail 6.618.252 kB balloon 0** + **11:52:28Z avail 6.596.072 kB balloon 131.072** ✓ khớp aggregate §4 (2 mẫu ≥ guard 6.144 MiB = 6.291.456 kB).
- Cửa sổ guard — sampler T9 `ram-sampler.log` (ngưỡng đúng 6.291.456 kB): đúng **3 mẫu ≥ guard** — 11:51:06Z 6.587.692 kB bal=0, 11:52:06Z 6.752.292 kB bal=0, 11:53:06Z 6.316.928 kB bal=393.144 ✓ khớp aggregate §8 (đỉnh 107,32%). Mẫu 11:50:06Z 6.181.212 kB DƯỚI guard (6.181.212 < 6.291.456) — không tính. **Lưu ý phương pháp (F-147-T1-3):** lần đếm đầu của T1-147 dùng nhầm ngưỡng 6.144.000 kB (nhầm MiB với kB) nên đếm ra 4 mẫu; đã sửa ngưỡng đúng 6.291.456 kB và đếm lại = 3. Ghi rõ để lần sau không lặp.
- Headroom T9 `headroom.log`: **880/880** (11:38:03Z, boot 98a7c93f, ceiling 63756) + lần 3 **>30.000 (CAP)** trên boot 6fb582df (ceiling 63747) ✓ khớp aggregate §8.

### 4.5 T6 — lock + prune (đối chiếu file gốc)

- Prune lần 21: `prune-deleted.txt` ghi `removed '…/vite.lock.queue/cooldown-r4-round115'` ✓ — lần đầu xóa file, khớp aggregate §5.
- Lock queue lúc T1-147 kiểm: **101 file, 0 ticket** ✓ khớp số T10-146 đóng (0 ticket + 101 cooldown).

### 4.6 T7 — run 146 viết lại + tuổi thọ boot (kiểm DB độc lập + số học)

- DB `scheduler.job_runs` (read-only SELECT, job `vcut-build-loop`):
  - Run 146 `e24b5870-6cfa-4c16-bdb3-00ac86a61696`: scheduled_for **11:35:51Z**, started_at hiện tại **12:14:02Z** = btime(6fb582df, 12:13:26Z) + **36 s** ✓ **khớp độc lập kết luận của T7** (viết lại 1 lần tại reboot #34, offset 36 s, trong dải ~30–50 s). Status **`succeeded`**, finished_at **14:24:36Z** (156 s sau cờ t10.done đợt 146 — overhead scheduler/resolution, mọi việc của đợt đã xong lúc cờ T10 14:21:40Z).
  - Run 145 `fcfdad2e`: started_at **09:54:43Z** = btime(98a7c93f) + 40 s, status `succeeded`, finished 11:30:29Z ✓ khớp T1-146.
  - Run 147 (lượt này) `98cf7700-6829-4217-8ad4-fe24a5a74d75`: scheduled_for **14:35:51Z**, started_at **14:35:51Z — jitter 0 s**, status `running` — khởi động đúng giờ.
- Tuổi thọ boot 98a7c93f — số học độc lập: 09:54:03Z → 12:13:26Z = **8.363 s** ✓ (phép trừ btime; T5/T9/T10 đúng). Số 7.963 s của T7 là sai; hai số của chính T7 cũng không khớp nhau (7.963 s = 2h12'43", không phải 2h13'23" = 8.003 s) — khớp phân tích aggregate §9.2. **Quyết parent (q) đã chốt 8.363 s làm chuẩn; T7 LIMITS vẫn ghi "Gap danh nghĩa #34 = 7.963 s" ở 2 chỗ (§2.5 dòng 104, §5 dòng 137/160) — T7-147 đối chiếu lại mốc neo theo quyết (q), T1-147 không tự sửa file đã đóng.**
- Jitter T7 kiểm lại: 36 s = 1795090442 − 1795090406 ✓; btime 6fb582df = 1795090406 = 12:13:26Z ✓.

### 4.7 Kích thước LIMITS các luồng (đối chiếu aggregate footer)

- Kích thước trên đĩa khớp đúng từng byte với aggregate footer: T1 19.151 B, T2 33.635 B, T4 19.770 B, T5 53.664 B, T6 79.210 B, T7 31.783 B, T8 34.563 B, T9 69.252 B ✓. Oversize (>37.768 B): T5, T6, T9 + aggregate — khớp footer.
- Aggregate hiện tại **56.431 B** (lúc T1-147 đọc, md5 `7cd14d2e50a1ccf645851a49b7298dff`); GAP §75 ghi aggregate "(~50,2 KB)" lúc GAP viết (14:21:49Z) — chênh ~6,2 KB là khối §12.3 parent viết sau (xem §3).

## §5. Cây lúc đóng

- Kiểm md5 lúc T1-147 mở phiên (14:39Z, boot 6fb582df — sau khi đóng đợt 146): preview.tsx **530e10a7** ✓, media.ts **2c384ed1** ✓, vite.config.ts **ee80d093** ✓ — khớp cây lúc T10-146 đóng (14:15Z). **Cây không đổi.**
- Kiểm lại cuối phiên (sau suite + O8 chạy lại của T1-147): preview.tsx vẫn 530e10a7 — suite/O8 của T1-147 không sửa cây.
- Lưu ý phương pháp: đường dẫn đúng là `apps/web/src/preview.tsx`, `apps/web/src/media.ts`, `apps/web/vite.config.ts` (đã xác minh từ đợt trước, không lặp lỗi gõ sai đường dẫn).

## §6. Khiếm khuyết / nợ mở còn lại (từ đợt 146, không đổi verdict)

- Lượt yên #21: đo lại ở đợt 147 trên boot mới 6fb582df (quyết (h)) — T4-147 đang chạy lúc T1-147 viết LIMITS này.
- Cửa sổ guard: tự động hóa thử birefnet phương án (a), giao T9-147 (quyết (l)).
- Thêm cổng tickCost ≤60 ms vào poller, giao T4-147 (quyết (j)).
- Mù #66 mới mở — T2-147: probe #66 + chứng nhận gap #109?→#110? (8.363 s) + khung chết #109?/98a7c93f bằng merged mù #66 + số boot 6fb582df = #110? + dải #110?/#111? chuẩn.
- Mâu thuẫn tuổi thọ boot 98a7c93f: quyết (q) đã chốt 8.363 s — giao T7-147 đối chiếu lại mốc neo.
- Headroom 880 dưới ngưỡng lần 6 (quyết (m): vẫn chỉ theo dõi); balloon đóng băng đợt thứ 9 (quyết (o): giữ gate A ≥1024 MB); watchdog chưa được thử bằng kẹt thật đợt thứ 5 (quyết (n): giữ nguyên bản vá); harness lệch chuẩn gate F-146-T8-3 (quyết (k): chấp nhận với ghi rõ).
- Oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; G1 chờ user quyết; R9 (a) vẫn chờ user (số đếm vẫn là 16).
- Run 146 kết thúc `succeeded` 14:24:36Z (156 s sau cờ t10.done đợt 146) — chỉ ghi nhận là dữ kiện (cùng mẫu run 145: finished 29 s sau hạn cứng).

## §7. Sai số F-147-T1-1..9 (ghi rõ — kể cả sai số của chính T1-147)

- **F-147-T1-1 — Aggregate §9.2 liệt kê thứ tự cờ sai (T6 trước T2):** mtime thực T2 11:54:04 < T6 11:54:09, nhưng §9.2 ghi "T1 11:40:14, T6 11:54:09, T2 11:54 (~11:54Z), …". Chỉ lỗi liệt kê, các §2/§5 ghi đúng, không đổi verdict. Đề xuất: T10 đợt sau liệt kê cờ theo đúng mtime giây, không làm tròn phút khi hai cờ cùng phút.
- **F-147-T1-2 — Closing stage trước khi GAP + aggregate chốt hẳn (tái diễn mẫu F-146-T1-3):** file `phase9-round146-closing.txt` mtime 14:21:40Z, trong khi GAP mtime 14:21:49Z (+9 s) và aggregate sửa lần cuối 14:27:40Z (+6 phút — lần sửa này là parent viết §12.3, đã giải thích ở §3). Danh sách file trong batch closing không đổi (vẫn đúng 2 entry aggregate + GAP) — chỉ nội dung hai file đó còn tiến hóa sau khi stage; push đọc từ đĩa lúc push nên không có nguy cơ blob cũ, nhưng hồ sơ "stage lúc nào" không phản ánh đúng thời điểm nội dung chốt. Không đổi verdict; bài học lặp lại: T10 nên stage closing SAU khi GAP + aggregate đã chốt hẳn (trừ phần §12.3 parent viết sau — phần đó vốn nằm ngoài quy trình stage).
- **F-147-T1-3 — T1-147 đếm nhầm ngưỡng guard lần đầu (MiB vs kB):** dùng ngưỡng 6.144.000 kB thay vì 6.144 MiB = 6.291.456 kB nên đếm sampler T9 ra 4 mẫu ≥ guard thay vì 3. Đã sửa ngưỡng và đếm lại = 3 (11:51:06Z, 11:52:06Z, 11:53:06Z) + T5 = 2 — khớp aggregate. Không ảnh hưởng kết luận; ghi rõ để lần sau dùng ngưỡng kB đúng ngay từ đầu.
- **F-147-T1-4 — Tái tính FULL80 bằng tay lệch 0,7 s so với số script:** (79×6.026,3 + 7.067)/80 = 6.039,31 s = 1h40'39" vs số công bố 1h40'40". Nguyên nhân là đầu vào FULL79 mean đã làm tròn tới giây; mean thật từ danh sách gap gốc (script T2) cho 6.039,5–6.039,8 s → làm tròn 6.040 s = 1h40'40". Không phải lỗi của T2; ghi rõ để lần sau khỏi hỏi lại. CERT65 tái tính khớp đúng 1h34'42".
- **F-147-T1-5 — Khoảng cách hai cách đếm "lần thứ N liên tiếp" vẫn là 2:** cách T1 lần thứ 28, cách main chat lần thứ 26 (T1-146: 27 vs 25). Lỗi diễn đạt "lệch 1" của T1-145 đã được F-146-T1-5 ghi rõ; khoảng cách 2 giữ nguyên qua hai đợt. Chỉ là lỗi hồ sơ, không chạm số đếm (mọi dải tái kiểm đều khớp).
- **F-147-T1-6 — Nội dung cờ T2-146 nay đã lỗi thời (không phải sai lúc viết):** cờ ghi "no new reboot, no blind #66" — đúng lúc T2 đóng 11:52:40Z, nhưng reboot #34 xảy ra 12:13:26Z sau đó. Aggregate §2 đã ghi rõ điểm này. Không đổi verdict; ghi để T2-147 khỏi trích lại câu đó.
- **F-147-T1-7 — Driver O8 của T1-147 phải chờ lock sau T4-147 (đã ghi ở §4.1b):** ticket t1-147-round147 xếp hàng sau ticket t4 attempt1 (port 5187, started 14:47:43Z). Lock hoạt động đúng; T1-147 không chen ngang, chỉ chờ — rồi timeout cả 2 lần (xem F-147-T1-9).
- **F-147-T1-8 — Giới hạn của chính T1-147 (ghi rõ, không giấu):** (a) không tính lại merged gap mù #65 từ log thô ngoài việc đọc `blind65-merged.log` đã tính sẵn (thuộc brief T2; T2-146 + quyết parent (b)/(c) đã chốt); (b) không tính lại (c2) lượt yên #21 từ log thô (dựa vào analyzer T4 + đối chiếu chéo T9 load1); (c) không đo lại headroom/RAM/balloon (số đo theo thời điểm, không tái tạo hậu kiểm); (d) không kiểm lại log lock thô 1183 dòng / ACQUIRED−RELEASED = 6 (theo aggregate §10.4, không thuộc brief verify); (e) started_at ban đầu của run 146 (11:35:51Z) chỉ còn bằng chứng kiểm tại thời điểm của T7 — DB đã ghi đè bằng giá trị viết lại 12:14:02Z; (f) không kiểm lại md5 3 script harness đã vá (theo aggregate §10.3, không thuộc brief verify).
- **F-147-T1-9 — O8 chạy lại BỊ CHẶN 2 lần bởi attempt kẹt của T4-147 (phát hiện trong phiên T1-147, không thuộc đợt 146):** driver O8 của T1-147 timeout acquire cả 2 lần (lần 1: 14:48:20Z → 15:18:25Z; lần 2: 15:20:27Z → 15:50:28Z; mỗi lần chờ đủ 1800 s) vì T4-147 attempt1 giữ lock vite từ 14:47:43Z tới ít nhất 15:51Z (>63 phút). Probe WebKit của T4 (pid 33904) kẹt ở 17/20 pass từ 14:50:29Z, process còn sống (Sl) nhưng chỉ dùng 4 s CPU trong hơn 60 phút, log `run-webkit-t4-attempt1-6fb582df.log` không tiến thêm dòng nào sau 14:50:29Z. T1-147 KHÔNG kill process của T4, KHÔNG phá lock, KHÔNG chạy O8 chen ngang — chỉ chờ đúng quy trình rồi dừng sau 2 lần timeout. Hệ quả: (i) O8 đợt 146 được xác nhận bằng bằng chứng gốc trên đĩa (§4.1a — 4 JSON 21/21 ok=True), theo tiền lệ F-146-T1-6(a); verdict PASS không đổi; (ii) chuỗi WebKit FULL PASS giữ nguyên 4 — bản nháp đầu của LIMITS này từng viết "4 → 5" với giả định O8 chạy lại sẽ pass, đã sửa lại trước khi tạo cờ (không được cộng chuỗi cho lần chạy chưa xảy ra); (iii) việc attempt1 của T4-147 kẹt là vấn đề của đợt 147 (giao T4-147/T10-147 xử lý, không thuộc phạm vi verify146).

## §8. Files + stage

- LIMITS này: `docs/PHASE9_ROUND147_T1_VERIFY146_LIMITS.md` — kích thước + md5 lúc tạo cờ được ghi TRONG FILE CỜ `round147-t1.done` (tránh vòng lặp tự tham chiếu: ghi số vào chính file sẽ đổi số đó — bài học F-146-T1-1).
- Script đếm: `hidden_files/round147-t1/count-final-147-t1.py` (ngoài repo — KHÔNG stage vào batch push; chỉ LIMITS này được stage).
- Suite log: `hidden_files/round147-t1/round147-t1-suites.log` (27/27 exit 0). O8 log: `hidden_files/round147-t1/t1-147-o8.log` + `t1-147-o8-lock.log` (2 lần TIMEOUT-ACQUIRE, xem F-147-T1-9). Không có report JSON O8 mới — không chạy được lần nào.
- Stage: `phase9-round147-t1-verify146.txt` (1 entry NUL-delimited, verify od). KHÔNG PUSH.
- Cờ: `round147-t1.done` khi xong (trước hạn cờ 17:00Z).
