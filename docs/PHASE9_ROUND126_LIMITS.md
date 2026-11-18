# LIMITS — Phase 9 đợt 126 (gộp 9/9, T10 đóng trong phiên)

> Đợt 126, lượt cron 06:35 +07 17/11/2026. T10 đóng trong phiên lúc 00:37:41Z 17/11/2026 (trước hạn cứng 02:35Z).
> 9/9 cờ `round126-t[1-9].done` có trên đĩa lúc kiểm đầu 00:30Z — không thiếu cờ nào.
> Boot duy nhất trong đợt: **#71 (ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69, btime 23:25:41Z 16/11)** — reboot xảy ra giữa đợt 125 đóng (21:48Z) và lượt này (gap danh nghĩa #70→#71 = 2h31'22"). **Không reboot trong lúc đóng** (boot_id ff7afbbb không đổi từ 00:30Z tới 00:37:41Z).
> Cây BASELINE không đổi trong đợt: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`, media.ts md5 `2c384ed13703809d5e999311147745e7` (kiểm trước/sau phase 1 khớp).
> KHÔNG push. KHÔNG release/tag. KHÔNG code giả. KHÔNG đo TTS 39. KHÔNG thử birefnet.

## 0. Tóm tắt (đọc trước)

- **T1+T2 E4BATCH: LÔ KHÉP 10/10 (1 CAUGHT-NO-RESEEK, 9 VOID).** Lượt 9 (A, gop250) là lượt CAUGHT ĐẦU TIÊN của lô — CAUGHT-NO-RESEEK, không có drift re-seek sau steady-close; lượt 10 (B, gop30) VOID, pause-seek 143/193 ms nhanh nhất trên baseline. H1/H3 KHÔNG phân định (chỉ số chính vắng); **E4 giữ ĐÓNG CÓ ĐIỀU KIỆN** — chờ quyết parent (§12(a)). Caveat bắt buộc: drift sau steady-close vẫn vượt 0,35 ở 10 tick (19–33) mà không có re-seek.
- **T3 scheduler: 3 slot thiếu MỚI** (HB 05:20:50 + HB 05:50:50 + DR 06:00 +07 17/11); lũy kế HB **38/142**, DR **40/141**; vcut-build-loop 0 slot thiếu; không bằng chứng mới về cơ chế drop.
- **T4 DEF v0.3 XONG + leg ~45–55% 6/6 VALID:** dải chuyển mới **~46–53%** (vùng trộn quan sát được); tickRate trung gian tái hiện **31,32–33,36 (mean 32,01)**; dial ấm TARGET-HIT warm-up #1 (sai số 0,24 điểm — phương pháp dial ấm ĐÃ ĐƯỢC CHỨNG MINH); T_startup median 1,227 s, chậm 3/6 TRỘN. Caveat: chậm/nhanh xen kẽ hoàn hảo từng run (p ngẫu nhiên ≈3%).
- **T5 hạ tầng: boot #71 PASS +18m17s** (replay khởi động muộn +9m59s nhưng xong nhanh +12m05s, trọn vẹn). Luật §8.2 dạng (B) ngưỡng 10' áp dụng lần đầu: đánh giá 8/8 poll, KHÔNG kích hoạt. Headroom inotify 3451→3434 (xu hướng giảm dài hạn tiếp tục: 4438→4318→3645→3451→3434). RAM thấp nhất mới 834 MB.
- **T6 lock KHỎE; tuân thủ lock đợt 125 sạch — ĐÓNG NỢ.** Luật prune cooldown áp dụng lần đầu: xóa **0 file** (không file nào >7 ngày), còn 57 file/798 B. Mù #37 vẫn mở. Caveat: đếm thô lúc mở "60 file" vs đếm chính xác 56 — chênh 4 chưa giải thích (§12(f)).
- **T7 EPERM: probe #45 ok=2 fail=0; mù #44 D kiểm sâu một lần VẪN MỞ → ĐỂ MỞ** theo quyết parent. **Mù #45: F đóng, G1 mở, G2 đóng. Gap #69→#70 = 1.148 s CHỨNG NHẬN DẠNG ĐIỂM; CERT n=38→39, FULL n=53→54. Gap #70→#71 = 9.082 s VẪN SPAN. Mù #46 MỚI MỞ.** WFS lần 32 chênh 0. RAM max 2.240 MB (37% guard).
- **T8 vite harness webkit 84l10/85m4/86n2: 3/3 exit 0 — ĐÃ ĐÓNG NỢ đợt 125.** Mirror 25/25 còn nguyên sau reboot #71; phủ 201/201; tsc + vite build exit 0.
- **T9 WebKit lượt yên #6 HỢP LỆ (attempt2, 20/20, median 44,0 ms, lớp B 5/5) — lượt yên hợp lệ thứ 5: 49,5 / 40,0 / 52,0 / 47,5 / 44,0.** Ngưỡng ≤60 ms GIỮ. Mới: event lag ≥+5f (1 event, lag tới +10f) → chuyển T5 chẩn đoán (§12(g)); (c2) lệch nhãn +1f tái hiện lần thứ 3 liên tiếp.
- **T10 verify: suite cây gộp 27/27 exit 0; O8 Chromium 21/21 exit 0 + O8 WebKit 21/21 exit 0 — WebKit FULL PASS lần thứ tư liên tiếp.**
- **Đếm cuối đợt 126 = 10 batch / 15 entry / 15 file duy nhất (gồm closing); lũy kế đợt 111–126 = 157 batch / 444 entry / 404 file duy nhất** + 1 oversize 6,4 MB (phương pháp chốt §9.2).

## 1. T1+T2 — E4BATCH lượt 9 + lượt 10: LÔ KHÉP 10/10 (1 CAUGHT-NO-RESEEK, 9 VOID)

- **Lượt 9 (T1, A, gop250, e4a9): CAUGHT-NO-RESEEK — lượt bắt được ĐẦU TIÊN của lô** (lượt 1–8: 0 CAUGHT). Probe 23:45:50–23:46:43Z exit 0 (53 s), WebKit, loadN=0, clip `o8-ball-720p-6s.mp4`. Pause-seek tới t=5 confirmed=true (tElement 1296 ms, tCanvas 1362 ms). velTicks=196, sampler=111, renderTicks=36, raf=68, rvfc=0, pageErrs=0. tailSteadyClosed cuối = 1 (0→1 ở tick 17, t=3078 ms, drift 0,4985; giữ 1 tới tick cuối 195; steadyAdvances 0→1→2→3 qua tick 14/15/16 — đủ 3 điều kiện steady-close prereg §2). **KHÔNG có drift re-seek sau steady-close:** resyncsV không tăng sau tick 2 (giữ 1 tới tick 195), restartV cuối=0, sampler chỉ 1 seeking run (seek ban đầu, relMs 124..228), ct tăng đơn điệu ở tick 34–36. Drift đóng ở tick 35 (0,2667 → 0,0333) vì ph NHẢY LÊN (+0,2667 trong 1 tick 129 ms, ph 5,4→5,6667) trong khi ct gần như đứng yên — playhead đuổi kịp currentTime, không phải seek. Ứng viên "drift re-seek tick 35" của analyzer là dương tính giả của heuristic |ct−ph|; bar H1/H3 không áp được. Chỉ số chính VẮNG — lượt này KHÔNG quyết H1/H3 (prereg §4: CAUGHT-NO-RESEEK → HỖN HỢP / KHÔNG KẾT LUẬN). Lô → 8/10.
- **Caveat bắt buộc lượt 9 (chờ quyết parent, §12(a)):** drift >0,35 sau seek ban đầu = **14 lần** (tick 12, 14, 16, 17, 19, 20, 21, 23, 25, 29, 30, 31, 32, 33; max 0,5 ở tick 16, min −0,3 ở tick 37) — trong đó **10 tick SAU steady-close (19–33)** vẫn vượt 0,35 mà không có re-seek nào. Đây là lần đầu một lượt CAUGHT đi kèm drift sau-đóng vượt ngưỡng ở 10 tick; T1/T2 đều ghi nhận nhưng không có cơ chế giải thích trong prereg.
- **Lượt 10 (T2, B, gop30, e4b10): VOID.** Probe 00:01:06–00:01:40Z exit 0 (34 s). Pause-seek tới t=5 confirmed=true (tElement **143 ms**, tCanvas **193 ms — nhanh nhất trên baseline từ trước tới nay**; lượt 8: 266/315 ms, lượt 9: 1296/1362 ms, lượt 7 att2: 1806/1871 ms chậm nhất). velTicks=441, sampler=128, renderTicks=76, raf=111, rvfc=0, pageErrs=0. tailSteadyClosed = 0 trong toàn bộ 180 s → VOID (đếm được, không retry). Drift >0,35: **0 lần** (max 0,1602 ở tick 26); resyncsV chỉ đổi ở tick 4 (seek ban đầu); restartV cuối=0. **LÔ KHÉP 10/10 (1 CAUGHT-NO-RESEEK, 9 VOID).**
- **Đối chiếu độc lập:** T2 chạy analyze-t2.py trên probe-results.json của T1 — tái hiện đúng CAUGHT-NO-RESEEK (steady-close ticks 17–21, n=179; ứng viên re-seek tick 35 là dương tính giả). Hai luồng độc lập đồng thuận về verdict lượt 9.
- **E4: ĐÓNG CÓ ĐIỀU KIỆN** (giữ nguyên trạng thái đợt 125, nay sau khi lô khép 10/10). H1/H3 không phân định vì chỉ có 1 CAUGHT và đó là CAUGHT-NO-RESEEK (không có cặp CAUGHT-RESEEK nào trong cả lô). Không còn lượt E4 nào trong lô — mọi lượt E4 tiếp theo (nếu có) cần quyết parent mới.
- Cây đo cả hai lượt: baseline 03bf029f / 2c384ed1 trước=sau; boot ff7afbbb (#71) không đổi; H3f đã gỡ đợt 122, không apply lại; không sửa production. Lock v2: T1 hold 53 s, T2 hold 34 s, đều nhả sạch. Cờ postboot T5 #71 đã có trước cả hai lượt (luật STALE).

## 2. T3 — Scheduler: 3 slot thiếu MỚI (HB 05:20:50 + HB 05:50:50 + DR 06:00 +07 17/11)

- **3 slot thiếu mới** trong cửa 20:51Z 16/11 → 23:47Z 16/11: heartbeat 05:20:50+07 (22:20:50Z), heartbeat 05:50:50+07 (22:50:50Z), deterministic-doctor 06:00+07 (23:00:00Z). Kiểm lại limit=15 xác nhận vắng mặt trong khi slot kề trước/sau đều có → thiếu thật, không phải artifact limit. DR 03:00+07 17/11 (đã xác nhận thiếu đợt 125) vẫn thiếu khi kiểm lại.
- **Lũy kế (cùng phương pháp đợt 125): heartbeat 38/142 slot thiếu** (từ 36/136); **deterministic-doctor 40/141** (từ 39/139). **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 03:35:51+07 `succeeded`, lượt 06:35:51+07 đang `running` lúc kiểm).
- **Không bằng chứng mới về cơ chế drop.** Cả 3 slot thiếu mới đều nằm trong gap #70→#71 (20:54:19Z→23:25:41Z), NHƯNG trong cùng gap đó HB 04:20:50/04:50:50+07 và DR 04:00/05:00+07 đều chạy bình thường → trong cùng một gap VM-down có slot chạy, có slot thiếu. Cả 3 slot thiếu đều nằm giữa hai lượt build-loop (không có build-loop nào active tại giờ thiếu); cờ `round-in-progress.md` đợt 126 mở 23:35Z — SAU cả 3 slot thiếu. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125. HB 06:20:50+07 muộn +888 s là dị thường đã biết đợt 125.
- Phạm vi tuân thủ: chỉ đọc `cron.runs` + file mục tiêu nhỏ; không quét toàn workspace; không điều tra lại cơ chế drop. Nợ đứng: cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong VM bằng cùng phương pháp.

## 3. T4 — DEF PSI v0.3 + leg dò ~45–55%: dải chuyển mới ~46–53%, tickRate 3 mức tái hiện

- **DEF v0.3 ĐÃ VIẾT XONG** (`docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md`, 23.465 B): ranh giới chuyển thành **DẢI ~45–60%** (cận dưới ~45% ghi rõ là giả thuyết chờ leg này kiểm chứng); tickRate sửa thành chỉ báo đói **≥3 mức** (nhàn ~71,5 / trung gian ~28,5 / đói ~15–20); dial bằng browser ấm (§4.7, bài học +27 điểm đợt 125). File v0.2 giữ nguyên làm lịch sử (md5 `035b912a…`, 18.176 B), không sửa.
- **Leg 45–55%: 6/6 VALID, 0 VOID, 0 attempt thừa** (đo 00:11–00:18Z, boot #71, cây baseline không đổi). 2 hog, dial ấm **TARGET-HIT ngay warm-up #1 (W = 45,74%)** — chỉ cần 1 warm-up. Run means **39,47–48,00%** (mean 45,98%). T_startup median **1,227 s**, p90 **1,403 s**, **chậm (>1,2 s) 3/6, nhanh 3/6 → TRỘN** → dải chuyển thu hẹp thành **vùng trộn quan sát được ~46–53%** (§7 LIMITS T4). Pha (a) bar (tham khảo): CHƯA ĐẠT (median 1,227 > 1,0; p90 1,403 > 1,2). Pha (b): **ĐẠT** (T_seek max 0,001 s, median 0,0 s).
- **Dial ấm THÀNH CÔNG VƯỢT TIÊU CHÍ:** sai số dial ấm |W − mean run means| = **0,24 điểm** (tiêu chí prereg ≤5; dial lạnh đợt 125 sai ~27 điểm). Phương pháp dial ấm ĐÃ ĐƯỢC CHỨNG MINH — ghi vào DEF v0.3 §4.7 làm protocol chuẩn cho leg dò ranh giới.
- **tickRate mức trung gian TÁI HIỆN + MỞ RỘNG:** ở ~46% tickRate **31,32–33,36 (mean 32,01)** — nằm giữa nhàn ~71,5 và mức ~53% 28,52, đơn điệu giảm theo tải. Đường cong 5 điểm (n=30): 71,5 @ ~7% → 32,0 @ ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%.
- **Caveat bắt buộc — xen kẽ hoàn hảo:** chậm/nhanh xen kẽ đúng từng run (chậm-nhanh-chậm-nhanh-chậm-nhanh; xác suất xen kẽ hoàn hảo do ngẫu nhiên ≈ 3%) — không loại trừ được yếu tố nhiễu xen kẽ. Tỉ lệ 3/6 KHÔNG được đọc là P(chậm)=0,5 chính xác. Chờ quyết parent về kiểm tra xen kẽ + DEF v0.3.1/v0.4 (§12(b)).
- **Tương quan gộp n=30** (caveat khác boot #67?/#68?/#70/#71?): r(avg60,T_startup)=+0,860; r(avg60,tickRate)=−0,944; r(tickRate,T_startup)=−0,809; r(avg60,threadsR)=+0,975; trong leg phẳng (r(avg60,T_startup)=−0,151).
- **Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — leg này không xét lại verdict, không gộp số với bộ verdict (cây H3f, boot đã chết).
- Validate công cụ trước đo: analyzer 126t4 hồi quy đúng trên dữ liệu đợt 124 (MEDIUM 6/6 VALID, median T_startup 1,8425 s khớp LIMITS 124t4; GAP 0 case — không ăn nhầm case cũ). Không chạy tsc/vite build đợt này: không sửa production (chỉ docs + script benchmark; script validate bằng node --check + py_compile + hồi quy analyzer), tránh tranh lock với T1/T2 đang đo song song. Không đụng TTS 39 / birefnet (RAM avail 0,8–1,5 GB < guard 6 GB).

## 4. T5 — Hạ tầng: boot #71 PASS +18m17s; luật §8.2 dạng (B) ngưỡng 10' áp dụng lần đầu, KHÔNG kích hoạt

- **Boot #71? (TẠM) ĐANG SỐNG — replay XONG TRỌN VẸN, PASS.** btime 23:25:41Z, boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, sau #70? 2h31m22s. Replay khởi động MUỘN (configure 23:35:40Z, boot +9m59s) nhưng chạy NHANH: installs 23:36:06–23:37:46Z, xong 23:37:46Z (boot +12m05s), dpkg 2 → 1509 dòng, 217 installs, gói cuối gstreamer1.0-tools. **Postboot PASS 10/10 lần kiểm** (try1 + watcher 8 poll + final), 0 FAIL. Cờ `POSTBOOT_PASS` viết 23:43:58Z (đúng boot_id), xác nhận lại PASS 23:54:29Z (boot +28m48s).
- **Boot #70? chết trong khung (21:48Z, 23:25:41Z]** — sau mốc T10 đóng đợt 125 (21:48Z), trước btime #71?. journal/wtmp chỉ còn boot hiện tại nên không kẹp hẹp hơn. #70? sống ít nhất 53m41s (20:54:19Z → 21:48Z).
- **Luật §8.2 dạng (B) ngưỡng 10' — ÁP DỤNG LẦN ĐẦU: đánh giá 8/8 poll watcher, KHÔNG KÍCH HOẠT.** Điều kiện thời gian (2b)/(3) ĐẠT từ poll 3 (dpkg im ≥600 s lúc 23:47:46Z) — ngưỡng siết mới đã sống thật — nhưng điều kiện (1) postboot FAIL và (4) dạng (B) đều KHÔNG đạt vì replay đã xong trọn vẹn + postboot PASS. Luật KHÔNG bắn nhầm lên replay khỏe đã xong.
- **2 gói từng thiếu ở #65? (libav, plugins-bad) ĐỀU ĐƯỢC CÀI** (`dpkg -l` ii cả 2) — mẫu thiếu 2 gói ở #65? không lặp lại lần thứ 3 liên tiếp (#68?, #70?, #71? đều đủ).
- **Headroom inotify: 3451 (mở) → 3434 (cuối)** — gần như đứng yên (−17), vẫn ~2,2 lần số watch vite thường cần (~1586). Nhưng tiếp tục xu hướng giảm dài hạn qua các boot: **4438 → 4318 → 3645 → 3451 → 3434** (§12(h)). Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell — cần can thiệp host, ngoài tầm luồng này.
- **RAM khả dụng dao động mạnh:** 1247 MB (mở 23:40Z) → 834–2551 MB trong watcher 8 poll (thấp nhất **834 MB** poll 1 — thấp nhất T5 từng ghi, dưới mức 987 MB đợt 125) → 1666 MB (cuối). Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
- **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI lúc mở; T8 acquire port 5490 lúc 23:52:10Z và vẫn giữ lúc kiểm cuối — đang dùng thật, không phải stale. Queue cooldown 56 → 58 file (+2, lúc T5 kiểm).
- **Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` 1 lần trong lượt** (md5 `ea7735c2…` → `e986ec78…`): chỉ đổi tham chiếu boot (header + dòng `say`); `bash -n` OK; try1 sau sửa PASS ngay lần đầu.
- **Số thứ tự boot #71? CHƯA CHẮC** — chờ T6 đếm lại mù #37 (T6 đợt 126 đang chạy song song; xem §5).
- **R9 (a) vẫn mở — nhắc lần 12** (§11, §12(d)).

## 5. T6 — Lock health: KHỎE; tuân thủ lock đợt 125 sạch (ĐÓNG NỢ); prune cooldown lần đầu — xóa 0 file

- **Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót sau khi holder nhả, 0 cổng lắng nghe.** Lock sau boot mới: TRỐNG, holder cuối đợt 125 đã nhả sạch trước reboot.
- **Tuân thủ lock đợt 125: ĐÓNG NỢ.** 12 chu kỳ mới sau snapshot T6 đợt 125, tất cả nhả sạch, 0 kẹt, 0 quá hạn. Log lock: 621 dòng, **178/178 cặp ACQUIRED→RELEASED**, 0 đang giữ, 0 mất dấu. 0 sự kiện "KHÔNG NHẢ" / "BỎ QUA release thừa" trên lock thật đợt 125 (sau 20:46Z) và đợt 126 (tới 23:47Z). Suite /tmp 9/9 ×2 lần chạy — lần xanh kép thứ hai liên tiếp (tính flaky T7 vẫn giữ nguyên, xem LIMITS T6 §9).
- **ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE.** Trình tự đúng luật (e): 23:40Z lock TRỐNG, 56 cooldown, ứng viên mtime >7 ngày = 0; 23:45:50Z lock bị T1 giữ giữa chừng → T6 DỪNG, không prune khi lock đang giữ; 23:46:43Z T1 nhả, 23:46:51Z lock TRỐNG trở lại (57 cooldown — tăng 1 do `cooldown-t1-round126` mới); 23:47Z chạy prune khi lock TRỐNG → **xóa 0 file**. File cũ nhất `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z — lúc 23:45:59Z mới **2 ngày 5 giờ tuổi**, còn xa ngưỡng 7 ngày. Tổng 57 file ≤ trần mềm 100 nên điều (b) cũng không kích hoạt. Đếm lại sau prune: **57 file / 798 byte** (57 × 14 = 798 khớp). File cũ nhất đủ 7 ngày vào khoảng 21/11 — T6 các đợt sau đếm tiếp.
- **Caveat — chênh đếm cooldown (§12(f)):** khung nhiệm vụ ghi lúc mở đợt "queue 60 file cooldown (đếm thô)". Đếm chính xác của T6 lúc 23:40Z: **56 file** — khớp cả ba cách đếm độc lập (`find` 56, `ls` 56 dòng, `status` "56 cooldown") và khớp chuỗi 52 (đợt 125) + 4 file mới đợt 125. **Chênh 4 file so với con số thô 60 trong khung — T6 không giải thích được** (không có thao tác xóa nào chạy trước 23:40Z; file cooldown chỉ bị ghi đè cùng tên, không bị xóa); ghi nhận trung thực để parent đối chiếu.
- **Mù #37 VẪN MỞ (như parent đã chấp nhận).** Gap #70?→#71 = 2h31'22" danh nghĩa (20:54:19Z → 23:25:41Z). Quan sát cuối trên boot #70?: `round125-t10.done` mtime 21:55:51Z. Đuôi mù (21:55:51Z, 23:25:41Z] = 1h29'50" không có quan sát nào trên VM; không có bằng chứng boot trung gian — nhưng cũng không có nguồn nào trên VM loại trừ được boot trung gian. Gap #70?→#71 do đó **VẪN SPAN, không chứng nhận được**. Số hiệu boot mới (#71) là số tạm, chưa xác minh độc lập. T6 không tự đổi CERT/FULL (thuộc T7).
- Nợ: v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ (đã kiểm lại dòng 191 trong đợt này — cần parent quyết "mở băng" nếu muốn đồng bộ message); `queue` in rỗng khi không có ticket (cosmetic, không sửa). Tuân thủ lock của các luồng đo đợt 126 chưa kiểm hết lúc 23:47Z (mới chỉ có T1) — T6 đợt 127 kiểm tiếp. Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt: T10 recount lại lúc đóng (xem §9.1).

## 6. T7 — EPERM probe #45 + mù #45 (F ĐÓNG, G1 MỞ, G2 ĐÓNG) + mù #44 D kiểm sâu 1 lần VẪN MỞ → ĐỂ MỞ + gap #69→#70 CHỨNG NHẬN DẠNG ĐIỂM

- **Checklist P8 §2.3 chạy ĐÚNG 1 lần (23:42:06Z):** `status` báo **DEAD/STALE** (heartbeat age 10.623 s, last #44 20:45:03Z, boot 670c07f6, exit 1); `once` ngay sau đó là **probe #45, boot ff7afbbb, ok=2 fail=0**, exit 0, 23:42:06Z; `status` chạy lại **ALIVE** (age 2 s, n=45), exit 0. Log v2 tăng đúng **3 dòng** (124 → 127) — như mọi lượt trước; prereg đã dự báo đúng +3 trước khi đo. Heartbeat nay n=45, ts 23:42:06Z, boot ff7afbbb.
- **Boot #71 (tạm) lúc 23:25:41Z** — xác minh bằng `uptime -s` + btime 1794871541 + `who -b` + journal 1 boot. Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server độc lập khớp `date -u` trong 0–2 s) → **F71 ≈ 0**.
- **Khoảng mù #45 (MỚI): 20:45:03Z → 23:42:06Z (2h57'03") — KHÔNG ĐÓNG HOÀN TOÀN (F đóng, G1 mở, G2 đóng; tối đa 4 ẩn).** Đoạn F **ĐÓNG** (556 s < sàn 1.147 s — đóng bằng độ dài, 104 mốc, tail 3 s); đoạn G1 **MỞ** (đuôi 4.710 s sau mốc cuối 22:07:10Z, 0 session bắc qua cắt G1-hi, 0 file trong đuôi ở cả 4 phạm vi); đoạn G2 **ĐÓNG** (uptime trực tiếp lúc probe #45 + dấu boot tươi). **2 reboot đã chốt trong mù (#70 20:54:19Z — đã biết từ đợt 125; #71 23:25:41Z — mới, chính xác từng giây trên đĩa) + tối đa 4 ẩn danh nghĩa trong đuôi đoạn G1.**
- **Gap #69→#70 = 1.148 s (19'08") CHỨNG NHẬN DẠNG ĐIỂM — MỚI.** Đoạn F đóng bằng độ dài < sàn + F69 ≈ 0 + F70 ≈ 0 + cận nhảy tại #70 |X| ≲ 6 s. **CERT n=38 → 39, FULL n=53 → 54** (tái hiện 100% bằng blind42-gaps.py verbatim + thêm gap mới). Đây là gap chứng nhận ngắn nhất từ trước tới nay (chỉ hơn sàn 1 s).
- **Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN — KHÔNG chứng nhận được** (mới, mù #45, đoạn G1 mở). Còn thiếu gì để chứng nhận: đúng 1 quan sát trong đuôi sau cắt G1-hi 23:06:34Z.
- **Mù #44 đoạn D: VẪN MỞ sau kiểm sâu MỘT LẦN DUY NHẤT với 5 góc mới — 0 quan sát mới thật.** Góc mới: (a) birth time trong đuôi D: 0 file (2 cây + /tmp + TOÀN HOME); (b) mtime đuôi D trên TOÀN HOME: 1 file = chính file mốc cuối (không phải quan sát mới); (c) ctime đuôi D: cùng 1 file mốc cuối, 0 nơi khác; (d) .git trong home: 0 thư mục (repo-1 không có .git); (e) nội dung log: 11 hit, TẤT CẢ đều tự tham chiếu (output điều tra đợt 125 nhắc lại giờ đuôi + 1 dòng nhắc btime #69), 0 quan sát mới thật. **→ ĐỂ MỞ theo quyết parent đợt 125 §12(h). KHÔNG kiểm lại nữa, KHÔNG giao kiểm lại vòng sau.** Gap #68→#69 giữ SPAN.
- **#71 tới TRONG dải cơ học:** dải từ #70 là [21:30:24Z, 23:48:49Z] (p10–p90 FULL53); #71 thật 23:25:41Z nằm trong dải — lần đầu sau 2 lần ngoài dải liên tiếp (#69 muộn hơn p90, #70 sớm hơn p10), reboot trở lại trong dải p10–p90. Ghi nhận, không đổi dải chứng nhận (gap #70→#71 là SPAN, không vào FULL).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 158 file *.log có mtime trong mù #45 (0 file repo-1, 158 file hidden_files); 4 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã biết** (T1 + T2 + 2× T10-O8 đợt 125). Quét mở rộng: 19 match / 14 dòng duy nhất — phân loại hết. Sóng gần nhất vẫn là **~11:55–12:11Z 11/11** (R7) — **~131h47'** trước probe #45. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 32: 844 dòng / 236 file** (phạm vi 3.013 file); R7b đối chiếu 869 dòng / 253 file; copies 25 dòng / 17 file — y hệt lần 31. Đối chiếu chéo 844+25=869=R7b, **chênh 0 — lần thứ ba mươi hai liên tiếp**. +6 dòng / +1 file so với lần 31, giải thích đúng hết bằng diff. Async `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray; mtime không đổi từ đợt 125.
- **RAM trong mù #45 — max 2.240 MB (37% guard), birefnet KHÔNG chạy.**
- **Mù #46 MỚI MỞ** (§12(c)). Mù #40 B / #43 / #42 B KHÔNG KIỂM LẠI (quyết parent). G1 + mù #22/#28/#29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.

## 7. T8 — Vite harness: 84l10/85m4/86n2 nhánh webkit 3/3 exit 0 — ĐÃ ĐÓNG NỢ đợt 125

- **84l10/85m4/86n2 nhánh WEBKIT — 3/3 exit 0, KHÔNG FAIL (nợ đợt 125 §9 mục 2 — ĐÃ ĐÓNG):** chạy dưới Xvfb mới `:196` + `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH` = `/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, mỗi harness acquire lock v2 riêng rồi nhả ngay (run-attempt). 84l10: W1×3 PASS + W2 PASS + E4 PASS (76 s giữ lock, 23:48:03–23:49:19Z). 85m4: P1–P5 PASS (140 s, 23:49:35–23:51:55Z). 86n2: P1–P5 PASS + P6 KHÔNG-KẸT (250 s, 23:52:10–23:56:20Z; lần 2 element đồng bộ sau 16,1 s — chậm nhưng vẫn PASS). Không gặp lại vụ kẹt W2 trên display cũ như đợt 125 (§4.2 lần 3) — display mới `:196` chạy sạch cả 3. Không gặp crash "Target crashed" (đợt 125 gặp 2/2 khi thiếu GST env).
- **Fixture `/tmp` tạo lại — md5 khớp đợt 125** (cả 4 file, đúng 8 ký tự đầu trong doc đợt 125 — khớp 8 ký tự, không phải khớp md5 đầy đủ vì doc đợt 125 chỉ ghi 8 ký tự đầu): hevc-a `ba0c7c62…`, i7-clip `f05daed8…`, h-30s `fbaa3d1a…`, g-4s `a1fb8549…`; m4/n2 là copy byte-identical của h-30s. ffprobe xác nhận đúng spec. **KHÔNG stage binary:** các clip `/tmp` mất sau reboot — tạo lại bằng script đã ghi; blend media trong `hidden_files/*/media/` không stage (ngoài repo). Blend media bền qua reboot: `blend-tp-ocean-a50.mp4` 881.516 B (md5 `f1e277f0…`), `blend-tp-slov-a085.mp4` md5 `f4c35a6a…` — khớp số đợt 125.
- **Mirror còn nguyên sau reboot #71: 25/25 file mirror L8 đợt 122 khớp `md5_after` trong `round122-t8/edit-log.json`, 0 đổi 0 mất. Kiểm kê toàn repo: 237 file ứng viên, 0 mới, 0 mất** (giống hệt đợt 124). **201/201 harness vite dev đã phủ mirror** (199 tự ghi + 2 thừa hưởng 65r8/82j3; `has_ignored`=200 gồm 199 harness + 1 file config `vite.n3.config.mjs`). Chỉ 2 file đổi size so với đợt 124 — 68v2 (30.551 → 31.685 B) và 82j3 (7.736 → 8.146 B) — cả hai đều là sửa đợt 125 đã biết, md5 khớp số đợt 125 (`12b9b7a2…`, `edb86968…`).
- **tsc-web exit 0** (51,2 s), **vite build exit 0** (built 9,27 s) sau mọi việc.
- 25 file config mặc định: **KHÔNG LÀM GÌ** theo quyết parent đợt 125 §12(d) (nợ đã cũ, đã mirror đợt 122, verify còn nguyên đợt 124 — và đợt này verify lại 25/25). Không sửa production (`preview.tsx` 03bf029f, `media.ts` 2c384ed1, `vite.config.ts` ee80d093 — khớp đúng số đợt 124/125, không động trước/sau), không sửa harness nào (không cần — cả 3 pass ngay lần đầu). Không push, không release/tag, không đụng TTS 39 / birefnet.

## 8. T9 — WebKit lượt yên #6: HỢP LỆ — median 44,0 ms; ngưỡng ≤60 ms GIỮ

- **Lượt yên #6 — 1 LƯỢT YÊN HỢP LỆ, attempt2: 20/20 pass, lớp B 5/5 ĐẠT.** tickCost total median **44,0 ms** (p90 71,6; n=615) — lượt yên hợp lệ thứ 5 sau khi chốt (S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / **T9-126 44,0**). **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi)** theo quy tắc quyết định prereg §1 (median 44,0 ≤ 60). Không siết tiếp chỉ từ 1 lượt — siết cần thêm lượt yên độc lập.
- Attempt1 gate A KHÔNG MỞ sau 10 poll (T8 giữ lock vite harness + load5 2,19–3,83) — không chạy probe, không mất số đo.
- **Cờ mở leg tải T4 đã touch 00:09:01Z** ngay khi attempt2 xong (trước LIMITS/batch); T4 spawn 2 hog, warm-up #1 00:11:13Z — phối hợp đúng hẹn, cửa yên sạch.
- **(c2) lệch nhãn +1f TÁI HIỆN lần thứ 3 liên tiếp** (8 occurrence skp=0, cùng cặp presented/label như đợt 125) — ghi nhận chuyển T5 chẩn đoán. **Event lag ≥+5f MỚI: 1 event duy nhất** (seq 276–279, frame 27, lag tới +10f) — KHÔNG khớp event cũ P4/Q5/T4-118 (§12(g)).
- Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…` khớp). Sampler đã sửa đợt 125 dùng nguyên — verify không mẫu hậu đo. tsc apps/web exit 0. T9 không sửa production.
- **Nợ gate0-wait 60 phút (LIMITS T9-125 §9.3): ĐÃ SỬA** trong bản copy đợt 126 (30 poll × 2 phút); thực tế gate 0 đạt ở poll #2 nên chưa cần tới giới hạn mới.
- Boot trong đợt: MỘT boot — #71 (uptime -s 2026-11-16 23:25:41Z; gap #70→#71 = 2h31'22"). Reboot xảy ra giữa đợt 125 đóng (21:48Z) và lượt này; T9 bắt đầu trên boot mới (~23:40Z, boot ~15' tuổi). Không có reboot trong lúc đo. Cây đo baseline 03bf029f / 2c384ed1 — KHÔNG ĐỔI suốt đợt. Không đo lại RAM baseline idle (nợ đợt 120 §9.4 ĐÃ ĐÓNG đợt 125). Không đụng TTS 39 / birefnet.

## 9. T10 verify + đếm cuối (phương pháp đếm — chốt một con số)

### 9.1 Phase 1 (chạy NGAY trong phiên, boot #71 ff7afbbb vẫn sống suốt)

- **Suite cây gộp 27/27 exit 0** (00:31:11–00:35:03Z, RAMavail 459 MB lúc bắt đầu; tsc-web 0, tsc-desktop 0, vite build 0 + 24 test; log: hidden_files/round126-t10/round126-t10-suites.log).
- **O8 Chromium 21/21 pass exit 0** (00:36:41Z) + **O8 WebKit 21/21 pass exit 0** (00:37:34Z) — **WebKit FULL PASS lần thứ tư liên tiếp**. Log: hidden_files/round126-t10/t10-o8.log.
- md5 trước/sau khớp (preview.tsx 03bf029f, media.ts 2c384ed1). Cây KHÔNG đổi trong đợt. **Không reboot trong lúc đóng** (boot #71 duy nhất từ 23:25:41Z; uptime 1:04 lúc 00:30Z).
- **Ghi chú trung thực về log suite:** script verify copy từ đợt 125 còn trỏ LOG về `round125-t10/round125-t10-suites.log` — kết quả suite đợt 126 (dòng 905+, 00:31:11–00:35:03Z) ban đầu ghi nhầm vào file log đợt 125. T10 đã trích đúng đoạn đó sang `round126-t10/round126-t10-suites.log` (904 dòng) và sửa đường dẫn LOG trong script copy đợt 126. Số đo không bị ảnh hưởng (27 exit=0, 0 exit≠0 trong đoạn trích); chỉ vị trí file log ban đầu là sai. Không chạy lại suite chỉ để sửa vị trí log.
- Lock vite lúc đóng: suite + O8 đều acquire/nhả sạch qua lock v2 (ticket t10-round126); kiểm cuối lúc đóng: lock TRỐNG (theo log release của driver O8; T6 kiểm lần cuối 23:47Z cũng TRỐNG, 0 ticket + 57 cooldown).

### 9.2 Đếm cuối — PHƯƠNG PHÁP CHỐT (đợt sau dùng lại y hệt)

Phương pháp chốt từ đợt 125 §9.2, giữ nguyên: **entry NUL trong file paths theo đợt + dedup theo đường dẫn tương đối**; batch = số file paths; file duy nhất = số đường dẫn khác nhau sau dedup (gồm closing). Mọi con số khác trong đợt (đếm file trong thư mục, đếm thô toàn paths-loop) đều KHÔNG phải số chính thức.

- Đợt 126 (trước closing): 9 batch / 13 entry / 13 file duy nhất — T1 1, T2 1, T3 1, T4 4, T5 2, T6 1, T7 1, T8 1, T9 1.
- **Đợt 126 (gồm closing): 10 batch / 15 entry / 15 file duy nhất.**
- **Lũy kế đợt 111–126 = 157 batch / 444 entry / 404 file duy nhất** (147/429/389 đợt 111–125 + 10/15/15 đợt 126) + 1 oversize 6,4 MB (`benchmarks/results/webkit-blob-flaky-96x3.json`, chưa lên).
- Verify: tất cả 15 đường dẫn đều tồn tại trên đĩa trong repo (chỉ thiếu LIMITS gộp lúc recount — file này viết ngay sau đó; đã kiểm lại sau khi viết, xem §9.3).

### 9.3 File oversize trong batch đợt này (>37.768 B, lúc push cần ENABLE_PRIVSEP=0)

| File | Kích thước | Batch |
|---|---|---|
| `benchmarks/render/f2_startup_probe_126t4.mjs` | 85.991 B | T4 leg4555 |
| `docs/PHASE9_ROUND126_T7_EPERM_LIMITS.md` | 49.605 B | T7 eperm |
| `docs/PHASE9_ROUND126_LIMITS.md` (LIMITS gộp này) | 40.165 B | closing |
| `PHASE9_GAP_ANALYSIS.md` | 250.998 B (sau khi thêm §55) | closing |

## 10. Nợ mở chuyển đợt 127

1. **E4 lô đã khép 10/10** — không còn lượt E4 nào trong lô; mọi lượt E4 tiếp theo (nếu có) cần quyết parent mới (§12(a)). Caveat drift sau steady-close 10 tick (lượt 9) chưa có cơ chế giải thích.
2. **DEF v0.3.1/v0.4 + kiểm tra xen kẽ** (T4): dải chuyển ~46–53% cần thu hẹp/xác nhận thêm; xen kẽ chậm/nhanh hoàn hảo từng run (p ≈3%) chưa loại trừ nhiễu (§12(b)).
3. **Mù #46 MỚI MỞ** (T7) — mô tả ban đầu ở đợt 127 (§12(c)).
4. **Event lag ≥+5f mới của T9** (seq 276–279, frame 27, lag tới +10f) → chuyển T5 chẩn đoán (§12(g)); (c2) lệch nhãn +1f tái hiện lần thứ 3 liên tiếp — cũng chuyển T5.
5. **R9 (a) vẫn chờ user (nhắc lần 12)** (§12(d)).
6. **G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời) (§12(e)).
7. **Headroom giảm dài hạn 4438→3434** — trần 63747 cần can thiệp host (dọn watch ngoài cell / tăng trần), ngoài tầm luồng này (§12(h)).
8. **Prune cooldown:** file cũ nhất đủ 7 ngày vào khoảng 21/11 — T6 các đợt sau đếm tiếp; chênh đếm 60 vs 56 chờ parent đối chiếu (§12(f)).
9. **Scheduler:** cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong VM bằng cùng phương pháp.
10. **Boot #71? đang sống + PASS** — các luồng đo đợt 126 dùng cờ này. Nếu #71? cũng chết sớm như #69? (~19–20') hoặc #66? (27p36) thì T5 đợt sau phải làm lại từ đầu. Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20, #69? ~19–20', #70? ≥53m41s (chết trong khung 1h37m41s), #71? chưa biết (sống ≥1h12m tới lúc T10 đóng đợt).
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 125 §10–§11: G1 chờ user quyết + mù #22/#28–#31/#35/#39/#40 chờ user quyết (mù #39 J + mù #40 B + mù #43 đã CHẤP NHẬN ĐỂ MỞ; mù #44 D đã ĐỂ MỞ sau kiểm sâu 1 lần đợt 126); birefnet (chỉ thử lại khi quan sát được available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 11. Bài học vận hành (đợt 126)

1. **Kiểm đĩa trước khi kết luận thiếu cờ — 9/9 đủ ngay lần đầu.** Cả 9 cờ `round126-t[1-9].done` có trên đĩa lúc kiểm đầu 00:30Z (T1 00:00:16Z, T2 00:06:06Z, T3 23:44:35Z, T4 00:27:42Z, T5 23:58:04Z, T6 23:49:38Z, T7 00:04:53Z, T8 23:58:44Z, T9 00:14:33Z). Không lặp lại bài học các đợt trước — nhưng vẫn kiểm đĩa trước, không tin handoff mù.
2. **Copy script verify giữa các đợt phải sửa cả đường dẫn LOG bên trong** — script đợt 125 copy sang đợt 126 còn trỏ LOG về `round125-t10/` (xem §9.1). Số đo không sai, nhưng log đợt sau ghi nhầm file đợt trước. Đợt sau: kiểm `grep LOG=` trong script copy trước khi chạy.
3. **Reboot giữa đợt đóng và lượt mở là mẫu lặp lại** (#70 chết trong khung (21:48Z, 23:25:41Z], #71 lên 23:25:41Z). Các luồng đã quen: chờ cờ POSTBOOT_PASS của boot mới theo luật STALE, không dùng cờ boot cũ. R9 (a) vẫn là vá gốc cho vấn đề này (nhắc lần 12).
4. **Dial ấm chứng minh vượt tiêu chí ngay warm-up #1** (sai số 0,24 điểm vs tiêu chí ≤5; dial lạnh đợt 125 sai ~27 điểm). Bài học: mọi leg dò ranh giới sau này dùng dial ấm theo DEF v0.3 §4.7 — không dial lạnh nữa.
5. **Prune cooldown chạy đúng luật khi lock bị giữ giữa chừng** (T6 dừng, chờ nhả, chạy lại khi trống — xóa 0 file là kết quả đúng, không phải luật chưa chạy). Luật (e) "chỉ chạy khi lock trống" đã sống thật.
6. **WebKit O8 FULL PASS lần thứ tư liên tiếp** — chuỗi xanh ổn định từ đợt 123 (lần đầu) qua 124, 125, 126. Không còn là may mắn 1 lần; hạ tầng WebKit sau replay PASS đã ổn định.
7. **RAM khả dụng 459 MB lúc T10 chạy suite** (thấp nhất trong các lần đóng gần đây: đợt 125 là 616 MB) — suite vẫn 27/27 exit 0. RAM thấp không làm suite fail, nhưng là biên mỏng; birefnet vẫn xa guard 6 GB.

## 12. Quyết parent (main chat, 07:4x +07 17/11/2026 — đóng đợt 126)

- **(a) E4: CHẤP NHẬN ĐÓNG CÓ ĐIỀU KIỆN với caveat, không mở thêm
  lượt đo.** Lô đã chạy đủ thiết kế đăng ký trước (10 lượt, 5A+5B)
  và chỉ cho 1 CAUGHT — lại là CAUGHT-NO-RESEEK (không có cặp
  CAUGHT-RESEEK nào) — nên chỉ số chính vắng, H1/H3 không phân
  định. Mở thêm lượt để đuổi theo cơ chế drift sau-đóng sẽ là một
  điều tra MỚI, không phải nối dài lô đã khép. Thay vào đó, giao
  **một phân tích bàn giấy ở đợt 127 trên dữ liệu probe lượt 9 đã
  có trên đĩa** (không đo mới): 10 tick sau-đóng vượt 0,35
  (19–33) có phải cùng kiểu playhead tụt-rồi-đuổi-kịp như ứng viên
  tick 35 (đã xác định là dương tính giả của heuristic |ct−ph|)
  hay là hành vi thật. Nếu phân tích không giải thích được thì
  mới quyết lượt đo mới với đăng ký trước mới. Không mở lượt E4
  đo mới khi chưa có quyết đó.
- **(b) DEF v0.3.1 + leg kiểm tra xen kẽ: PHÊ DUYỆT.** (i) Viết
  **DEF v0.3.1** (không phải v0.4 — thu hẹp dải ~46–53% + mức
  tickRate trung gian 32,01 là tinh chỉnh, không phải thay đổi
  cấu trúc; v0.4 dành cho thay đổi cấu trúc như trục tải mới hay
  định nghĩa lại bar). (ii) Giao **một leg kiểm tra xen kẽ ở đợt
  127**: 6 run ở dial vùng chuyển + 6 run ở Yên, xen kẽ theo
  thứ tự ngẫu nhiên đã đăng ký trước — nếu chậm/nhanh đi theo chỉ
  số run bất kể mức tải thì là nhiễu của trình tự đo, còn nếu đi
  theo mức tải thì dải chuyển là thật. (iii) **Không leg dò ranh
  giới thêm sau leg này** trừ khi kiểm tra xen kẽ cho thấy dải là
  thật mà vẫn cần thu hẹp — dải ~46–53% đã đủ hẹp cho mục đích
  của bar F2, dò thêm lợi ích giảm dần.
- **(c) Mù #46: GIỮ LỊCH PROBE THƯỜNG LỆ ở đợt 127.** Probe #46
  + mô tả ban đầu (công việc đứng của T7); không chỉ đạo khác.
  Gap #70→#71 giữ SPAN.
- **(d) R9 (a): VẪN CHỜ user** (nhắc lần 12). Không thay đổi.
- **(e) G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã
  hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
- **(f) Chênh đếm cooldown 60 vs 56: CHẤP NHẬN LÀ SỐ ĐẾM THÔ
  SAI, không điều tra thêm.** Số chính xác của T6 là 56 file lúc
  23:40Z (khớp 3 cách đếm + chuỗi 52+4 từ đợt 125), sau prune còn
  57 file/798 B — lấy 56/57 làm số chính thức. Truy nguồn con số
  60 trong khung nhiệm vụ tốn một luồng mà không thêm thông tin
  gì (số đếm thô trong brief vốn không phải số đo).
- **(g) Event lag ≥+5f mới: GIAO T5 CHẨN ĐOÁN Ở ĐỢT 127, trong
  luồng hạ tầng** (không cần luồng riêng — chẩn đoán nhỏ). **Giữ
  event làm case theo dõi** (seq 276–279, frame 27, lag tới
  +10f). T5 đồng thời xem (c2) lệch nhãn +1f tái hiện lần thứ 3
  liên tiếp (lệch hệ thống, không phải ngẫu nhiên).
- **(h) Headroom giảm dài hạn: TIẾP TỤC THEO DÕI, chưa đưa lên
  user.** Headroom còn ~2,2 lần số watch vite thường cần (~1586)
  nên chưa chặn việc gì; tốc độ giảm chậm (−17 đợt này). **Ngưỡng
  báo user: headroom < ~1.800** (sát mức vite cần) — lúc đó mới
  đưa lên như vấn đề chặn. T5 tiếp tục báo headroom mỗi đợt.
- **(i) Đóng đợt 126 9/9: CHẤP NHẬN.** Suite 27/27 exit 0; O8
  Chromium 21/21 + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ
  tư liên tiếp); cây không đổi; chốt chặn đã xóa; cờ t10.done có.

---

- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round126-closing.txt` — 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §55), NUL-delimited, verify read-back, 0 binary. Hồ sơ: hidden_files/round126-t10/ (suite log, O8 log, driver, lock log). Cờ `round126-t10.done` đã tạo khi đóng đợt.
- **Tổng batch đang chờ user push (lũy kế đợt 111–126): 157 batch / 444 entry / 404 file duy nhất** + 1 oversize 6,4 MB. KHÔNG push khi user chưa nhắn "push đi" từ main chat.
