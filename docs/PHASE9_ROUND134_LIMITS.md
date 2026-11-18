# VCut Studio — Phase 9, đợt 134: LIMITS gộp (đóng sổ)

- **Đợt:** 134 (lượt cron 06:35 +07 18/11/2026; mở 23:35Z 17/11/2026, đóng 02:02ZZ 18/11/2026)
- **Verdict đóng sổ:** CHẤP NHẬN (9/9 cờ; verify 27/27 + O8 21/21 ×2; T8 2/3 harness — xem §8) — 9/9 cờ `.done` (T8 xong 01:57Z (2/3 harness exit 0)).
- **Boot mở đợt:** d2e66749, btime 23:26:58Z 17/11/2026. **Boot lúc đóng:** 8ae55060-6d10-4d4f-bd2e-35c6856ffe24.
- **Reboot giữa lượt: 5 lần (6 boot)** — nhiều nhất từ trước tới nay trong một đợt (kỷ lục cũ: 4 reboot đợt 133, đợt 132):
  1. d2e66749 → 81335571, btime mới 23:53:17Z (sống ~26m19s) — sự kiện gộp #9.
  2. 81335571 → 52ca5d6d, btime mới ~00:12:55Z (sống ~19m38s) — sự kiện gộp #10.
  3. 52ca5d6d → 1d2e984d, btime mới 00:13:50Z (sống <1 phút, boot ngắn nhất) — sự kiện gộp #11.
  4. 1d2e984d → cc1f9de0, btime mới 00:17:36Z (sống ~3m46s) — sự kiện gộp #12.
  5. cc1f9de0 → 8ae55060, btime mới 01:31:18Z (sống ~1h13m42s) — sự kiện gộp #13.
  Chuỗi gộp duy nhất (LIMITS gộp đợt 133 §10.2): #83?→#84? (ranh giới, trước khi đợt mở) = sự kiện thứ 8; các sự kiện trong đợt là #9–#13.
  **Dị thường đồng hồ** (đã ghi đợt 133, tái diễn đợt này): đồng hồ cell chạy nhanh hơn giờ host vài chục giây tại ranh giới reboot — bằng chứng: heartbeat T4 tới 23:53:50Z trong khi btime boot mới là 23:53:17Z; poll #4 T4 ghi 00:17:53Z trên boot cũ sau btime boot mới 00:17:36Z; T8 retry tính btime từ /proc/1 = 01:31:29Z trong khi /proc/stat btime = 01:31:18Z (lệch 11 s). Khi đối chiếu log qua reboot phải dùng boot_id + thứ tự sự kiện, không chỉ giờ tuyệt đối.
- **Cây lúc đóng:** preview.tsx md5 **530e10a7** (fix T3, KHÔNG revert — xem §12.1(a) chờ quyết parent), media.ts 2c384ed1, vite.config.ts ee80d093. Lệch khỏi brief mở đợt (cây phải về 3 md5 gốc) — chỉ preview.tsx lệch, có lý do ghi rõ ở §12.
- **Đếm cuối (dedup toàn cục mới, script round134-t10/count-final-134.py):** đợt 134 = 10 batch / 12 entry / 12 file duy nhất; lũy kế 111–134 = 238 / 563 / 493. Tái kiểm 111–133 khớp hoàn toàn số công bố đợt 133 (228/551/483) — lần tái kiểm độc lập thứ chín liên tiếp khớp.
- **Verify độc lập T10:** suite cây gộp **27/27 exit 0, 0 rerun** (chạy 01:44:12–01:48:07Z trên boot 8ae55060, cây preview.tsx 530e10a7; caveat: chạy song song với retry 86n2 của T8 lúc đó đang kẹt-im — node 86n2 CPU 0,4% idle, loadavg 0,13; suite là kiểm tra đúng/sai, không đo thời gian); O8 Chromium 21/21 + WebKit 21/21 exit 0 — WebKit FULL PASS lần thứ 12 liên tiếp (đợt 133 là lần thứ 11).
- **Stage:** `phase9-round134-closing.txt` (LIMITS gộp + GAP_ANALYSIS.md), verify read-back. KHÔNG PUSH (chờ lệnh user từ main chat).

## §1. T1 — kiểm chứng độc lập đợt 133: PASS (xong 23:58Z)
- Đếm lại độc lập đợt 133 = 10 batch / 12 entry / 12 file; lũy kế 111–133 = 228/551/483, khớp hoàn toàn số công bố (lần tái kiểm độc lập thứ chín liên tiếp khớp).
- LIMITS gộp 133 lúc đóng 38.006 B, sha `e9cf1773…90316e017`, khớp bản copy lúc đóng; phần dài thêm sau đóng chỉ là §12.1 quyết parent.
- Tính lại từ JSON gốc: median 39,5 ms, (c2)=5 đúng 5 seq, P1 5/5 p=8,046×10⁻⁶, P3 5/5 p=3,419×10⁻⁴ — khớp 100%.
- Sai số mới: **F-134-T1-1** (LIMITS T4-133 viết prereg T3 "17:46Z" hai lần, file ghi 17:45Z); **F-134-T1-2** (harness kiểm chứng khô widen v6 của T5 chỉ nằm trong `/tmp/t5v6-test/`, đã mất sau reboot — T1 đã kiểm lại 8/8 từ code đã ship). Cả hai không đổi verdict.
- LIMITS: `docs/PHASE9_ROUND134_T1_VERIFY133_LIMITS.md`. Stage: `phase9-round134-t1-verify133.txt` (1 entry).

## §2. T2 — probe #53 + mù #53: xong 00:08Z
- Probe #53 ok=2 fail=0 (23:46:54Z, boot d2e66749 #84?); log v2 148→151 (+3).
- **Mù #53 (20:42:56Z → 23:46:54Z, 3h03'58") KHÔNG ĐÓNG HOÀN TOÀN** — A đóng (merged 120 mốc, lỗ lớn nhất 822 s), B MỞ tối đa 3 ẩn (merged 59 mốc, lỗ lớn nhất 4.227 s = đuôi (22:16:31Z, 23:26:58Z], 0 session chạm đuôi B), C đóng (uptime + luật lỗ, 28 mốc).
- **Gap #82?→#83? = [7.635 s, 7.655 s] (mid 7.645 s) CHỨNG NHẬN DẠNG KHOẢNG** → CERT n=46→47 / FULL n=61→62 (F83? chưa từng đo trực tiếp — caveat cùng lớp các gap trước). Gap #83?→#84? = 6.318 s giữ SPAN. Khung chết #83? (22:16:31Z, 23:26:58Z] (4.227 s).
- **T2 QUYẾT nhận bản hẹp khung chết #82? (21:29:47Z, 21:41:40Z] (713 s) làm chuẩn** (tiền lệ quyết parent 130 §12.3(f)/131 §12.3(c)/132 §12.3(c)); bản chính (21:28:35Z, 21:41:40Z] vẫn ghi đầy đủ; hoạt động 21:29:47Z không quy trách nhiệm được (thư mục exec-logs trống).
- **Reboot #84?→#85? NGOÀI dải cơ học** (sớm hơn cận dưới 412 s) — đứt chuỗi 14 lần INSIDE liên tiếp (lần ngoài dải đầu tiên kể từ #70, đợt 125).
- EPERM 0 sóng thật; WFS lần 40 chênh 0 (891/248; R7b 916/265; copies 25/17 — y hệt lần 39 về copies); RAM max trong mù 1.903 MB (31,0% guard).
- T2 LIMITS 58.271 B (oversize >37.768 B — chỉ stage paths, không push). Prereg T2 có 2 dự báo verdict SAI (B đóng — thực tế B mở; gap #83?→#84? chứng nhận được — thực tế giữ SPAN) + dự báo RAM hẹp sai; các số gap/dải tính bằng code đều đúng.
- **Mù #54 MỚI MỞ** (việc T2 đợt 135). Mù #51 B và #49 B KHÔNG kiểm lại đợt này.
- LIMITS: `docs/PHASE9_ROUND134_T2_EPERM_LIMITS.md`. Stage: `phase9-round134-t2-eperm.txt` (1 entry).

## §3. T3 — sửa instrumentation + bước 2: xong 01:11Z
- Giai đoạn A xong 23:47Z: `preview.tsx` md5 **805409f0 → 530e10a7** (loop-gate nới: ghi mọi loop ≥1, mặc định không giới hạn, `window.__vcutC2DrawLogMaxLoop = N` để giới hạn, `=2` khôi phục hành vi cũ; re-enable KHÔNG xóa mảng/KHÔNG reset loopNo nữa, chỉ reset khi `window.__vcutC2DrawLogReset === true`; log vẫn mặc định tắt); diff 60 dòng theo cờ fix (T4 đếm 36 dòng +/−, T3 đếm lại 34 dòng nội dung +/− — chênh do cách đếm); tsc 0 lỗi; vite build PASS (13,01 s, 290 modules).
- Giai đoạn B: bước 2 **KHÔNG CÓ DỮ LIỆU MỚI** — script gốc crash `TypeError` tại dòng 92 vì `flip.wallMs=None` (không có nhánh xử lý JSON partial — sai số thiết kế, ghi ở §7); phân tích partial bằng script riêng: JSON partial 257.631 B, sha `b402b3f3…76bc6`, passes=2, blendTick n=23, tickCost n=27 median 58 ms (chỉ pre-flip, KHÔNG dùng làm verdict), c2DrawLog n=53 toàn loop 1, 0 wrap — khớp 100% với T4. **P1–P7 đều KHÔNG KIỂM ĐƯỢC.**
- **KHÔNG REVERT trong đợt này** — điều kiện revert theo quyết parent đợt 133 §12.1(a) là "revert SAU KHI ĐO" nhưng đợt này chưa đo được lượt nào nên điều kiện chưa xảy ra; bản gốc 805409f0 còn nguyên tại `round134-t3/preview.tsx.orig-805409f0`. md5 cuối 530e10a7. T3 + T4 + T5 đều đề xuất GIỮ fix cho đợt 135; quyết cuối thuộc parent (§12.1(a)).
- Các sai số T3: F-134-T3-1 (wait-script ghi nhãn cutoff sai: log "22:30:00Z 17/11" nhưng epoch 1794965400 = 01:30:00Z 18/11 — epoch đúng, chỉ nhãn sai; nhãn "T3-133" cũng là copy từ đợt 133), F-134-T3-2 (script bước 2 không chịu được JSON partial), F-134-T3-3 (wait-script chỉ chạy được 1 poll rồi bị reboot #1 giết), F-134-T3-4 (đếm dòng diff 60 vs 36 vs 34), F-134-T3-5 (`passesDone` đọc ở `results.b` được None — trường nằm ở top-level, giá trị 2; T5 §8.1 đã xác nhận độc lập).
- LIMITS: `docs/PHASE9_ROUND134_T3_C2_LIMITS.md`. Stage: `phase9-round134-t3-c2.txt` (1 entry).

## §4. T4 — lượt yên WebKit #11: KHÔNG ĐO ĐƯỢC, 0 attempt hợp lệ (xong 01:04Z)
- Gate 0 + gate A MỞ ĐÚNG 1 LẦN ở poll #1 (23:50:17Z, boot d2e66749, RAM 2037 MB, cờ T5 `POSTBOOT_PASS` pass_at 23:49:21Z poll=2, check-only exit 0) — cửa sổ vàng sau boot. Attempt1 chạy ngay, **bị reboot giết giữa pass 3/20** (passesDone=2, JSON partial 257.631 B, sha `b402b3f3…76bc6`, flip chưa tới, blendTick n=23, heartbeat kẹt elapsed=100s).
- Sau đó 3 reboot nữa (tổng 4 reboot trong cửa sổ 23:50Z–01:00Z); cờ T5 mới KHÔNG BAO GIỜ xuất hiện cho 3 boot sau; postboot check-only exit=1 suốt; RAM kẹt 451–710 MB (poller 2: 1724→451 MB; poller 4 trên cc1f9de0: 1557→494 MB, dao động 494–710 MB, không có đợt hồi RAM giữa lượt như đợt 133). Tổng 82 poll (1+23+4+54), chỉ 1 lần cửa mở. Hết hạn 01:00Z, poller tự dừng exit 5.
- **Ngưỡng ≤60 ms GIỮ NGUYÊN, không có số mới** (9 lượt hợp lệ trước: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms, trung bình 46,9 ms).
- Log draw partial n=53 toàn loop 1, 0 wrap — fix CHƯA ĐƯỢC KIỂM CHỨNG runtime; P7 không kiểm được lần thứ tư liên tiếp. T4 đề xuất GIỮ fix cho đợt 135.
- Dry-run analyzer trên JSON đợt 133 trước khi đo: khớp 100% (median 39,5, (c2) 5 seq, coverage 0/5, histogram). Bảng §7 của T4-134 có dấu "—" ở lượt #6 là ĐÚNG (ghi chú T4-133: trong các lượt #1–#9 có 8 lượt hợp lệ, lượt #6 không có số) — không phải sai số.
- LIMITS: `docs/PHASE9_ROUND134_T4_WEBKIT_QUIET11_LIMITS.md`. Stage: `phase9-round134-t4-quiet11.txt` (1 entry).

## §5. T5 — infra + pha 2: xong ~01:26Z
- **NHÁNH A2 KÍCH HOẠT LIVE LẦN ĐẦU** trên boot cc1f9de0: replay xong (1730 dòng / 252 installs, 0 proc, dpkg im từ 00:59:22Z) nhưng postboot FAIL chỉ vì thiếu đúng **1 gói đích `gstreamer1.0-plugins-bad`** (10/11 package đủ; wrapper/libs/GST đều PASS) → C4=A2(yes) từ poll 39 (00:59:53Z); silent vượt 600 s → **TRIGGER=YES poll 49 (01:09:55Z, silent 633 s) + poll 50 (01:10:55Z, silent 693 s)**; kiểm chứng độc lập **5/5 ĐẠT** 01:11:26Z → **--repair 1 lần (once-only trên boot này) 01:11:39Z: apt-get update OK + cài plugins-bad, RE-CHECK 4/4 PASS, exit 0** (<90 s); watcher poll 52–53 postboot exit 0 → **cờ `POSTBOOT_PASS` viết 01:13:56Z (poll 53)**, GST 120 → **269 file** (plugins-bad thêm đúng 149 file — trùng baseline 269). Nguyên nhân gốc replay bỏ qua gói này chưa xác định được (apt-get 7121 download ~14 phút rồi biến mất, không có entry history.log cho chính gói đó).
- Boot d2e66749: postboot PASS 4/4, cờ 23:49:21Z. Boot 81335571: replay KHÔNG CHẠY (dạng (B), dpkg 2 dòng/0 install) → TRIGGER=YES dạng (B) poll 6 (00:05:07Z) → kiểm chứng 5/5 → --repair bắt đầu 00:06:20Z (symlink GST xong, apt-get update đang chạy, partial 113) thì **reboot giết giữa update** — bị gián đoạn, không phải thất bại; luật once-only: chưa có lần repair HOÀN TẤT nào trên boot đó. Boot 52ca5d6d: không watcher nào chạy. Boot 1d2e984d: replay đang chạy mạnh (dpkg 729 lúc chết), gstreamer1.0-gl đã cài, GST 32 file đang tăng. Boot cc1f9de0: replay chậm (update ~12 phút, kẹt 14 phút ở download plugins-bad, installs tới 1730 dòng/252 installs — NHIỀU HƠN baseline 221/1545; seed list boot này lớn hơn; baseline replay không còn giá trị tuyệt đối).
- Pha 2: **KHÔNG CÓ DỮ LIỆU — P1–P7 đều KHÔNG KIỂM ĐƯỢC**; kiểm tra độc lập JSON partial khớp 100% số của T3 (kể cả tickCost median 58,0 ms pre-flip); cộng dồn P1 14/14, P3 13/14 GIỮ NGUYÊN.
- Script postboot sửa 4 lần (header + say, không đổi logic; md5 cuối `b568049b…`); watcher b85 (`a6b1e6d3…`, 2 poll), b86 (`44eeef7e…`, 14 poll), b87 (`db0d069b…`, 53 poll); nhánh archive cờ stale kích hoạt live lần 2 (b86 00:00:05Z). Luật (C): không kích hoạt lần nào. Headroom T5: 2506/2515 (mở) → 2499 (cuối). RAM toàn phiên T5: 438–2350 MB.
- **R9 (a) nhắc lần 17.**
- Sai số T5 (T10 đối chiếu chéo): **F-134-T5-1** — §2 viết "đợt 133 (07da9c50 sống — chuỗi đứt 1 đợt)": SAI theo định nghĩa gộp, vì đợt 133 CÓ reboot giữa lượt #82?→#83? (sự kiện gộp #7, LIMITS gộp 133 §10.2). Chuỗi reboot liên tiếp không đứt ở đợt 133. Không đổi verdict A2/repair (chỉ là câu về chuỗi).
- T5 LIMITS 49.794 B (oversize). Stage: `phase9-round134-t5-infra.txt` (2 entry: postboot-check.sh + LIMITS).

## §6. T6 — lock + boot: xong 00:07Z
- **Lock KHỎE** (1 caveat): trống lúc mở/đóng1/đóng2 (0 ticket + 78 cooldown); log chính thức **869 dòng / 251 cặp ACQUIRED→RELEASED**, 1 "đang giữ" = t4 reboot-kill đã giải thích (§3.1: trap release ghi cooldown TRƯỚC khi ghi log RELEASED — reboot cắt ngang giữa hai bước → dir sạch + cooldown-t4 mtime 23:53:53Z nhưng log thiếu RELEASED; **ca mất dòng RELEASED do reboot ĐẦU TIÊN**, F-134-T6-2 — log giữ mãi 1 ACQUIRED không cặp; đổi thứ tự ghi hoặc fsync cần quyết parent); 0 TIMEOUT/STALE-LOCK mới; "KHÔNG NHẢ" trên lock thật: 0; suite 9/9 ×2 (T7 xanh cả hai, lần thứ 10 liên tiếp; suite xanh lần thứ 16 liên tiếp); không lặp lại F-132-T6-1.
- **Prune lần 9: xóa 0 file** (lần thứ 9 liên tiếp; queue 78 file / 1092 B). Chu kỳ T4 attempt1: acquire 23:50:17Z, bị reboot giết, không RELEASED.
- **Chuỗi boot tương đối CHỐT #57→#85 (29 boot); số tuyệt đối VẪN TẠM (giữ "?")** vì mù #37 tối đa 29 ẩn + mù #49 B mở tối đa 1 ẩn + mù #51 B mở tối đa 3 ẩn + dị thường đồng hồ #84?→#85?. Gap #83?→#84? 6.318 s SPAN; #84?→#85? 1.579 s SPAN. Khung chết #83?: (22:16:31Z, 23:26:58Z] (1h10'27"), một bản ghi duy nhất. Khung chết #82?: ghi cả hai, khung hẹp nhất làm chuẩn; caveat mốc chính 21:28:35Z nay chỉ còn trong hồ sơ T6 (mtime `build-loop-log.md` hiện 23:52:47Z). Mù #37 KHÔNG ĐỔI.
- **F-134-T6-1** (nhãn đếm): T5 trong file của mình đếm lệch 1 so với định nghĩa gộp — gọi #84?→#85? là "reboot #8" (đúng ra sự kiện gộp #9), và các reboot sau cũng lệch −1 xuyên suốt (§2.1–2.5: "#9"→#10, "#10"→#11, "#11"→#12). Chỉ lệch nhãn; mọi mốc thời gian/boot_id của T5 đều đúng.
- T6 LIMITS 50.224 B (oversize). Stage: `phase9-round134-t6-lockhealth.txt` (1 entry).

## §7. T7 — scheduler: xong ~23:58Z
- **CỬA BẨN — 2 slot thiếu MỚI** (HB 22:50:50Z + DR 23:00Z, cả hai trong khung chết reboot); HB 6/7 có, DR 2/3 có; lũy kế **HB 43/191 (22,5%), DR 48/166 (28,9%)**.
- HB muộn +887 s (slot 23:20:50Z, start 23:35:37Z) — **lần thứ 5 đúng mẫu ":35:37Z, 14 s trước vcut dispatch"** (đợt 127/129/130/132/134).
- **Dị thường started_at lượt vcut đợt 133 BỊ VIẾT LẠI: +3.985 s (lần thứ 4 liên tiếp)** — cùng run_id `6f3eba37`, T7-133 thấy started_at 20:35:51Z lúc ~20:45Z, nay DB ghi 21:42:16Z (= btime 21:41:40Z + 36 s); chuỗi jitter: đợt 130 +5.251 s → 131 +1.585 s → 132 +7.135 s (lớn nhất) → 133 +3.985 s. **T10 kiểm lại lúc đóng (01:44Z): lượt vcut đợt 134 (run `19a360f1`) CŨNG BỊ VIẾT LẠI — started_at nay ghi 01:31:58Z, jitter +6.967 s, = btime boot mới 01:31:18Z + 40 s (lần thứ 5 liên tiếp; T7 lúc 23:53Z thấy started 23:35:51Z, jitter 0 s). Giả thuyết "scheduler ghi lại started_at khi hồi phục sau reboot" ĐƯỢC XÁC NHẬN: reboot #5 xảy ra GIỮA lượt 134 và started_at bị viết lại đúng mẫu 31–46 s sau btime (chuỗi: 46 s, 31 s, 36 s, 40 s). Trạng thái run vẫn `running`, finished_at null lúc kiểm.
- Khung im lặng scheduler (22:15:34Z, 23:35:37Z] (~1h20'03").
- F-134-T7-1: quyết định biên cửa sổ về slot HB 23:50:50Z (đếm vào cửa này vì scheduled_for ≤ lúc kiểm cuối → mẫu số +7 = 191; nếu giữ quy ước "cửa đóng ở lần kiểm đầu" thì 43/190 — verdict 2 thiếu mới không đổi). T7 kiểm 3 lần khớp hoàn toàn.
- LIMITS: `docs/PHASE9_ROUND134_T7_SCHEDULER_LIMITS.md`. Stage: `phase9-round134-t7-scheduler.txt` (1 entry).

## §8. T8 — vite harness: 2/3 exit 0 (84l10 ✓, 85m4 ✓ sau retry; 86n2 TIMEOUT 124) — xong 01:57Z
- **Gate mở 01:14:08Z** (waiter4 poll 55): `round134-t4.done` (T4 xong 01:04Z, 0 attempt hợp lệ) + `POSTBOOT_PASS` boot cc1f9de0 pass_at 01:13:56Z poll=53 (T5 b87 — xuất hiện SAU hạn T4 01:00Z nên T4 không dùng được).
- **84l10 exit 0** (01:15:24–01:16:31Z, boot cc1f9de0, ~67 s): W1×3/W2/E4 PASS.
- **85m4 chạy 1 KẸT P1-phaseA** (01:16:46–01:31:40Z): sampler HB128 176 dòng, TẤT CẢ n=0/100, lastCt=? lastPlayhead=? — 881 s không một mẫu nào; chưa tới timeout 900 s thì **reboot #5 giết** (boot mới 8ae55060, btime 01:31:18Z). RAM avail tụt 1226 → 491 MB trong lúc kẹt.
- **Retry trên boot 8ae55060 (01:35:55–01:53:23Z):** gate thay thế = check-only postboot trực tiếp exit 0 lúc 01:34:51Z (đủ 11 package + GST 269 file + libs; cờ T5 cho boot mới không tồn tại vì watcher b87 chết theo cc1f9de0 — T8 ghi rõ, không giấu; xem §10.1). **86n2 exit 124 TIMEOUT 900 s** (01:35:58–01:50:58Z): P1/P2/P3/P4-lần1 PASS, sau đó im lặng ~13,7 phút, kẹt ở P4-lần2 (bước đồng bộ element sau P4-lần1); dòng cuối: `HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed` → `KẾT QUẢ: CÓ FAIL`. **85m4 retry exit 0** (01:51:14–01:53:23Z, ~2m09s = đúng bằng thời gian đợt 133): P1/P2/P3/P4×3/P5 PASS, seek kẹt 0 mẫu, HB128 19 dòng — **không tái hiện kẹt P1-phaseA**.
- **Tổng hợp:** 2/3 exit 0 (84l10 trên cc1f9de0; 85m4 trên 8ae55060), 1 timeout (86n2 trên 8ae55060). Mỗi boot chỉ chạy xong một phần vì reboot #5 cắt ngang. **P3 không kẹt lần thứ sáu liên tiếp** có chạy tới P3 (đợt 131: lần 4; 132: không chạy — không tính; 133: lần 5; 134: lần 6 — cả 85m4 retry và 86n2 retry đều P3 PASS 0 restart). Hai lần kẹt đều là "treo không trả mẫu", không phải FAIL có verdict — không kết luận hồi quy từ 2 mẫu kẹt ở 2 pha/2 boot khác nhau.
- Fixture rebuild 2 lần (mỗi boot 1 lần, /tmp bị reboot xóa): 6/6 md5 khớp đợt 125–133 cả hai lần.
- Dọn sạch: 0 process Xvfb/vite/MiniBrowser sót, socket X199 + lock đã unlink, không có `vite.lock`. `/tmp/.X11-unix/` lúc T8 kiểm cuối (01:53:43Z) còn X193/X194/X195 (01:47Z) — T8 ghi "của luồng khác, để nguyên"; **T10 xác nhận đó là socket do chính suite verify của T10 tạo (xvfb-lock/test-preview-engine.sh chạy 01:44–01:48Z) và đã dọn lúc đóng** (xem §10.2).
- Sai số T8: **F-134-T8-1** (header `run-webkit-summary.txt` dòng 1 ghi "btime 00:17:46Z", lệch +10 s so với btime thật 00:17:36Z; LIMITS §1 ghi đúng 00:17:36Z — chỉ sai ở header summary); **F-134-T8-2** (§0 viết "preview.tsx 530e10a7 suốt lượt": SAI — lúc T8 mở 23:45Z cây còn 805409f0, fix T3 chỉ áp lúc 23:48:59Z; mọi lần chạy harness đều trên 530e10a7 nên không đổi kết quả). Nhãn đếm: T8 đếm reboot trong đợt 1–5 (tự nhất quán); định nghĩa gộp của aggregate là sự kiện #9–#13 (xem đầu file).
- T8 đồng ý đề xuất GIỮ fix cho đợt 135; nhấn mạnh cờ `round134-t8.done` KHÔNG có nghĩa "đã đo xong, được revert" (lượt yên #11 vẫn chưa đo được).
- LIMITS: `docs/PHASE9_ROUND134_T8_VITEHARNESS_LIMITS.md` (20.711 B). Stage: `phase9-round134-t8-viteharness.txt` (1 entry).

## §9. T9 — headroom/RAM: xong ~23:51Z
- **Headroom 2.505** (2 lần đo: 2.515 lúc 23:45:29Z → 2.505 lúc 23:48:01Z, chênh −10 trong boot; giảm −127 so với 2.632 đợt 133, −4,8%); còn **705 trên ngưỡng báo < ~1.800**; gấp ~1,59 lần nhu cầu vite (~1.578 watch); trần inotify 63.747 không đổi; watch ngoài cell 61.242.
- RAM khả dụng theo sampler T9: **min 460 MB → max 2.438 MB** (đỉnh chớp 23:49:01Z, 28 s sau còn 1.480 MB) — đợt hồi RAM lớn giữa lượt, KHÔNG phải cửa sổ vàng sau boot (boot ~18–22 phút tuổi, replay xong 23:37:47Z).
- **Balloon virtio KHÔNG đứng yên — xả mạnh 6.371.088 → 4.276.284 kB** (ròng −2.094.804 kB ≈ −2,05 GB trong ~4,5 phút); lúc đóng cửa sổ ~52,7% tổng RAM (đợt 133: ~79,3%).
- **Birefnet KHÔNG THỬ** (max 2.438 MB = 39,7% guard 6 GB). 0 ENOSPC ngoài probe K8.
- Các sai số T9: F-134-T9-1 (brief mở ~1.295 MB vs T9 đo 460 MB — ghi cả hai), F-134-T9-2 (đỉnh 2.438 MB là chớp ngắn), F-134-T9-3 (mốc bắt đầu đợt hồi không xác định chính xác).
- LIMITS: `docs/PHASE9_ROUND134_T9_HEADROOM_LIMITS.md`. Stage: `phase9-round134-t9-headroom.txt` (1 entry).

## §10. Đếm cuối + đối chiếu chéo (T10)
- **Đợt 134 = 10 batch / 12 entry / 12 file duy nhất** (dedup toàn cục mới, script `round134-t10/count-final-134.py`, quét toàn bộ `phase9-round*.txt`):
  - 9 batch luồng (T1–T9, mỗi luồng 1 batch; T5 2 entry: LIMITS + postboot-check.sh) + 1 batch closing (LIMITS gộp + GAP).
  - 12 entry = 9 LIMITS luồng + postboot-check.sh + LIMITS gộp + GAP_ANALYSIS.md.
  - 12 file duy nhất = 10 file mới-only đợt 134 (9 LIMITS luồng + LIMITS gộp) + 2 file trùng với 111–133 (GAP_ANALYSIS.md + `apps/web/scripts/vcut-webkit-postboot-check.sh`).
- **Lũy kế 111–134 = 238 batch / 563 entry / 493 file duy nhất** (228+10 / 551+12 / 483+10; đối chiếu 483 + 10 = 493 ✓).
- **Tái kiểm 111–133 = 228/551/483 — khớp hoàn toàn số công bố đợt 133** (lần tái kiểm độc lập thứ chín liên tiếp khớp).
- **File oversize đợt 134:** T2 LIMITS 58.271 B, T6 LIMITS 50.224 B, T5 LIMITS 49.794 B (đều >37.768 B — chỉ stage paths, không push). Oversize cũ chưa lên: 1 file 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`.
- **Tất cả đường dẫn stage đều tồn tại trên đĩa** (script kiểm: "Duong dan thieu tren dia: KHONG"). Tất cả file paths NUL-delimited thuần (0 newline, kết thúc bằng NUL) — đã kiểm từng file.

### §10.1 Đối chiếu chéo các claim lớn
- **T1 vs công bố đợt 133:** tái kiểm độc lập khớp hoàn toàn 228/551/483 (lần thứ chín liên tiếp).
- **T3 vs T5 pha 2:** khớp 100% mọi số partial (log draw n=53 toàn loop 1, 0 wrap; tickCost median 58 ms pre-flip; flip wallMs=None; passes=2). T5 §8.1 xác nhận passes=2 ở top-level — làm rõ F-134-T3-5 (T3 đọc nhầm vị trí trường).
- **T4 vs T5 vs T8 về cờ gate theo từng giây:** cờ T5 d2e66749 23:49:21Z → gate A T4 mở poll #1 23:50:17Z (RAM 2037 MB) → cờ T5 cc1f9de0 01:13:56Z → T8 gate mở, 84l10 chạy 01:15:24Z exit 0 → reboot #5 giết 85m4 ~01:31:18Z → T8 retry: postboot check trực tiếp exit 0 lúc 01:34:51Z trên boot 8ae55060 → 86n2 chạy 01:35:58Z. Chuỗi cờ khớp hoàn toàn, không mâu thuẫn.
- **T2 vs T6 về gap/khung chết:** T2 chứng nhận gap #82?→#83? = [7.635 s, 7.655 s] (mid 7.645 s) — T6 đóng 00:07Z trước khi T2 chứng nhận nên chưa chốt gap này (T6 ghi danh nghĩa 7.645 s SPAN lúc đóng 2, trùng mid của T2 — nhất quán). Khung chết #83? (22:16:31Z, 23:26:58Z] cả hai ghi giống nhau. Khung chết #82?: T2 nhận bản hẹp làm chuẩn, T6 ghi cả hai — nhất quán.
- **T6 vs T7 về started_at:** T7 ghi nhận mốc + bằng chứng viết lại (lần thứ 4); T6 không kết luận nguyên nhân — không mâu thuẫn, vẫn mở.
- **T5 vs T6/T10 về chuỗi reboot:** F-134-T5-1 (xem §5) — T5 viết chuỗi đứt ở đợt 133, sai theo định nghĩa gộp (§10.2 đợt 133: sự kiện #7 có trong đợt 133).
- **T8 btime:** header summary T8 ghi "btime 00:17:46Z" trong khi btime thật là 00:17:36Z (lệch 10 s — đối chiếu với LIMITS T8 lúc đóng; xem §8).

### §10.2 Kiểm đầu lúc đóng (T10)
- Boot lúc mở đóng sổ: cc1f9de0 (btime 00:17:36Z). Boot lúc đóng: 8ae55060-6d10-4d4f-bd2e-35c6856ffe24 (btime 01:31:18Z) — CÓ — 1 reboot trong phiên đóng sổ (cc1f9de0 → 8ae55060, btime 01:31:18Z, sự kiện gộp #13; xảy ra trong lúc T10 chờ cờ T8, làm chết 85m4 chạy 1 của T8 và giết 2 lệnh sleep nền của T10 — cả hai đều khôi phục bằng cách đọc lại đĩa; boot không đổi sau 01:32Z tới lúc đóng).
- md5 cây lúc đóng: preview.tsx 530e10a7 (fix T3, KHÔNG revert — xem §12.1(a)); media.ts 2c384ed1; vite.config.ts ee80d093.
- Lock trống lúc đóng: trống: 0 ticket + 80 cooldown (78 lúc T6 đóng 2 lúc 00:07Z + 2 mới đợt này: cooldown-t8-round134 + cooldown-t10-round134); thư mục vite.lock không tồn tại (= không ai giữ).
- 0 process sót lúc đóng: 0 process sót (Xvfb/vite/MiniBrowser/Chromium/WebKit — kiểm 02:00:33Z).
- /tmp/.X11-unix/ lúc đóng: trống (đã dọn X193/X194/X195 do chính suite verify của T10 tạo lúc 01:47Z; kiểm 02:00:33Z).
- Suite cây gộp: 27/27 exit 0, 0 rerun (chạy 01:44:12–01:48:07Z trên boot 8ae55060, cây preview.tsx 530e10a7; test-preview-engine.sh: 354 assertions pass; log round134-t10-suites.log).
- O8: Chromium 21/21 + WebKit 21/21, exit 0 (chạy 01:57:43–01:59:31Z trên boot 8ae55060, cây preview.tsx 530e10a7, WebKit 27.2; lock t10-round134 giữ 108 s, đã nhả; vite sau release curl 5554/5564 = 000000).

## §11. Nợ mở chuyển đợt 135
- **Giữ fix T3 (preview.tsx 530e10a7) hay revert về 805409f0** — chờ quyết parent §12.1(a). T3 + T4 + T5 đều đề xuất GIỮ cho đợt 135 (điều kiện revert "sau khi đo" chưa xảy ra: 0 attempt hợp lệ lượt #11).
- **Lượt yên WebKit #11 CHƯA ĐO ĐƯỢC** — đo lại đợt 135 với logger đã nới; P7 không kiểm được lần thứ tư liên tiếp.
- **Mù #54 MỚI MỞ** (việc T2 đợt 135); mù #53 B vẫn mở tối đa 3 ẩn; mù #51 B, #49 B chưa kiểm lại.
- **Nhánh A2 watcher v6:** đã kích hoạt live lần đầu + repair thành công 1 lần trên cc1f9de0; còn nợ: nguyên nhân gốc replay bỏ qua `gstreamer1.0-plugins-bad` chưa xác định; watcher chết theo boot (không tự hồi sau reboot — T8 đợt này phải tự check trực tiếp).
- **G1 khung (a) M2 VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời).
- **R9 (a) VẪN CHỜ user** — nhắc lần 17 (KHÔNG tăng số đếm).
- **ci-security.yml vẫn 403** — chờ user (file còn ở `~/workspace/repo-1/.github/workflows/ci-security.yml`, loại khỏi mọi lần gộp).
- **TTS 39 cấm kiểm lại.**
- **Birefnet chỉ thử lại khi quan sát được available ≥ 6 GB** (u2net là fallback chính thức).
- **Reboot #5 trong đợt (boot #89?)** — đợt 134 là đợt nhiều reboot nhất (5 lần); chuỗi boot tương đối #57→#85 (T6 chốt lúc 00:07Z, trước reboot #5) cần T6 đợt 135 chốt lại với boot #89?.
- **File oversize chưa lên:** 1 file 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` + các LIMITS oversize đợt 134 (T2 58.271 B, T6 50.224 B, T5 49.794 B — chỉ stage paths, không push).
- **Release gate đứng:** KHÔNG release/tag cho đến khi ngang hoặc hơn CapCut thật. **Không push khi chưa có lệnh user.**

## §12. Chờ quyết parent (đã quyết ở §12.3 dưới)
Chưa có quyết parent nào trong phiên đóng — parent quyết sau khi đọc aggregate này; các câu hỏi mở liệt kê ở §12.1 dưới.

### §12.1 Câu hỏi mở (chờ quyết — T10 KHÔNG tự quyết)
- **(a) Giữ fix T3 hay revert?** `preview.tsx` hiện ở 530e10a7 (fix T3: loop-gate nới + re-enable không xóa mảng). Quyết parent đợt 133 §12.1(a) nói revert SAU KHI ĐO; đợt 134 đo 0 attempt hợp lệ nên điều kiện chưa xảy ra và T3 đã KHÔNG revert. T3 + T4 + T5 đều đề xuất GIỮ fix cho đợt 135 để đo lượt yên #11 với logger đã nới. Nếu parent quyết GIỮ: cây đợt 135 mở với 530e10a7, T3 đợt 135 không cần sửa lại. Nếu parent quyết REVERT: revert về 805409f0 trước khi đợt 135 mở (bản gốc còn tại `round134-t3/preview.tsx.orig-805409f0`).
- **(b) Đổi thứ tự ghi log RELEASED/cooldown của lock v2?** F-134-T6-2: reboot cắt ngang giữa hai bước ghi → log giữ mãi 1 ACQUIRED không cặp (t4, 23:50:17Z). T6 đề xuất đổi thứ tự hoặc fsync — cần quyết parent (đổi logic lock là thay đổi hạ tầng, T10 không tự quyết).
- **(c) Khung chết #82? bản hẹp hay bản chính?** T2 đã nhận bản hẹp (21:29:47Z, 21:41:40Z] (713 s) làm chuẩn theo tiền lệ quyết parent 130 §12.3(f)/131 §12.3(c)/132 §12.3(c); T10 ghi nhận quyết này vào hồ sơ (không phải câu hỏi mới — chỉ nhắc để parent xác nhận nếu muốn đổi).

### §12.2 (đã quyết ở §12.3 dưới)
_(Parent quyết sau khi T10 đóng — ghi vào §12.3 khi có.)_

### §12.3 QUYẾT PARENT (main chat, 09:1x +07 18/11/2026 — đóng đợt 134)

- **(a) Giữ fix T3 hay revert: GIỮ `preview.tsx` 530e10a7 CHO ĐỢT 135.** Điều kiện revert theo quyết đợt 133 §12.1(a) là "revert SAU KHI ĐO" — đợt 134 đo 0 attempt hợp lệ (attempt1 bị reboot giết giữa pass 3/20) nên điều kiện chưa xảy ra; revert lúc này sẽ vứt bản sửa chẩn đoán đã duyệt và bắt đợt 135 sửa lại trước khi đo lượt yên #11. T3 + T4 + T5 đều đề xuất GIỮ. Điều kiện: fix là chẩn đoán-only (log vẫn mặc định tắt, `=2` khôi phục hành vi cũ); revert sau khi có một lượt đo hợp lệ với logger đã nới (hoặc khi parent quyết khác). Đợt 135 mở với cây preview.tsx 530e10a7, KHÔNG phải 805409f0 — brief đợt 135 ghi rõ để các luồng không "sửa lại" về md5 cũ. Bản gốc 805409f0 còn nguyên tại `round134-t3/preview.tsx.orig-805409f0`.
- **(b) Thứ tự ghi log RELEASED/cooldown của lock v2: PHÊ DUYỆT ĐỔI THỨ TỰ (ghi log RELEASED trước, cooldown sau) — hoặc fsync giữa hai bước.** Lỗi đã chứng minh: reboot cắt giữa hai bước ghi → log giữ mãi 1 ACQUIRED không cặp (t4, 23:50:17Z — ca mất dòng RELEASED do reboot ĐẦU TIÊN, F-134-T6-2). Đổi thứ tự thì reboot cắt ngang chỉ làm mất 1 file cooldown (mục prune, mất không hại) thay vì để lại "khóa đang giữ" giả trong log — tốt hơn hẳn. T6 đợt 135 thực hiện + ghi thứ tự mới vào spec lock + kiểm chứng trong đợt 135.
- **(c) Khung chết #82? bản hẹp hay bản chính: XÁC NHẬN T2 ĐÃ CHỌN ĐÚNG — bản hẹp (21:29:47Z, 21:41:40Z] (713 s) làm chuẩn.** Theo tiền lệ quyết parent đợt 130 §12.3(f)/131 §12.3(c)/132 §12.3(c): ghi cả hai, khung hẹp nhất làm chuẩn. Bản chính (21:28:35Z, 21:41:40Z] vẫn ghi đầy đủ trong hồ sơ.
- **(d) R9 (a): SỐ ĐẾM VẪN LÀ 16 — ĐÍNH CHÍNH T5.** Quyết đứng (đợt 132 §12.3(f), 133 §12.1): "nhắc lần 16 — KHÔNG tăng số đếm". T5 đợt 134 viết "nhắc lần 17" ở §5 và §11 — số 17 này KHÔNG được chấp nhận; số đếm giữ 16. Lần nhắc này vẫn là lần 16 theo sổ.
- **(e) G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
- **(f) Đóng đợt 134 (9/9, T10 đóng 02:02Z, trễ 2' so với hạn cứng 02:00Z do T8 retry + O8): CHẤP NHẬN.** Suite 27/27 exit 0, 0 rerun; O8 Chromium 21/21 + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ mười hai liên tiếp); cây lúc đóng preview.tsx 530e10a7 (fix T3, KHÔNG revert — theo quyết (a) trên), media.ts 2c384ed1, vite.config.ts ee80d093; 1 reboot trong phiên đóng sổ (cc1f9de0 → 8ae55060, đã khôi phục bằng đọc lại đĩa); lock trống lúc đóng (0 ticket + 80 cooldown); 0 process sót; chốt chặn đã xóa khi đóng; cờ t10.done có. Đếm cuối dedup toàn cục 238/563/493 đã tái kiểm đúng (111–133 = 228/551/483 khớp số công bố đợt 133 — lần tái kiểm độc lập thứ chín liên tiếp khớp; file trùng đợt 134: GAP_ANALYSIS.md + vcut-webkit-postboot-check.sh). Ghi nhận: T8 2/3 harness (86n2 TIMEOUT 124) là caveat, không chặn verdict đóng — hai lần kẹt đều là "treo không trả mẫu" ở 2 pha/2 boot khác nhau, không kết luận hồi quy. Nhánh A2 watcher v6 kích hoạt LIVE lần đầu + --repair thành công 1 lần trên cc1f9de0 (widen trigger đợt 132 đã chứng minh ngoài thực tế). Lượt yên #11 chưa đo được (0 attempt hợp lệ) — đo lại đợt 135 với logger đã nới.

## Footer
Batch stage / Tổng batch: 10 batch / 12 entry / 12 file (lũy kế 111–134: 238/563/493)
