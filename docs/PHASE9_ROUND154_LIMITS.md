# PHASE9 ROUND 154 — LIMITS tổng hợp (đợt 154, lượt cron 18:35 +07 20/11/2026)

Đợt 154: lượt cron 18:35 +07 20/11/2026 (= 11:35:51Z). T10 đóng sổ ~14:13Z, trong hạn cứng 14:30Z. Verdict đề xuất: **CHẤP NHẬN** (chờ quyết parent §12.3). Hai reboot: **#48 btime 11:26:05Z TRƯỚC phiên** (boot mới 2c0a7985 — giữa lúc T10-153 đóng sổ ~11:15Z và đợt 154 mở; T1-154 đính chính F-154-T1-1) và **#49 btime 13:05:12Z GIỮA phiên** (boot mới 12fc68a3 — ứng viên, chờ T2-155 xác nhận số hiệu; viết lại run 154 — điểm (m) thứ 9, DƯƠNG). 9/9 cờ `.done` có mặt trên đĩa lúc đóng, **tất cả đều CÓ NỘI DUNG** (quyết (l) đợt 152 giữ trọn vẹn đợt thứ hai liên tiếp). Điểm khác biệt lớn nhất đợt này: **lượt yên #23 KHÔNG CÓ lượt hợp lệ nào** (T4 0 attempt trong 147 poll) — chuỗi lượt yên hợp lệ dừng ở #21 — nên **O8 3/3 PASS đã xác nhận độc lập nhưng chuỗi WebKit FULL PASS KHÔNG lên 12** (T10 phán ở §10.2, chờ parent xác nhận §12.1 (g)).

## §1. T0 — Boot survey: reboot #48 (ứng viên) + watcher CHẾT lúc mở (quy tắc đứng (3)) + O8 JSON còn đúng + O8 kiểm chứng FAIL 0/2

- **Reboot #48: CÓ (ứng viên, chờ T2-154 xác nhận số hiệu).** Boot mới **2c0a7985-b750-4166-b177-21d2ef7e1dc7**, btime **1795173965 = 11:26:05Z** (5 nguồn độc lập khớp: boot_id, /proc/stat btime, journal first entry 11:26:15Z, wtmp 11:26, eperm-probe log boot-changed). Gap danh nghĩa #47 → #48 **1.165 s**. Boot cũ cd7dcd88 chết trong **(11:17:10Z, 11:26:05Z]**; **KHÔNG bằng chứng overlap** (khác #45 — migration). F-measure ~0 (btime +0,02/+0,03 s, 2 lần đọc cặp) — không nghịch lý đồng hồ. /proc/1 start = btime +10 s (boot/init chậm ~10 s, không phải bước nhảy đồng hồ).
- **Watcher (quy tắc đứng (3)): CHẾT lúc mở** — 0 process replay-watch (~11:38Z, kiểm độc lập; log cuối replay-watch-152 dừng 07:04:36Z theo #44). T5-154 đã khởi động lại bằng tay 11:40:28Z pid 17168. **POSTBOOT_PASS trên đĩa VẪN STALE #43** (boot 18e179e0); chưa có POSTBOOT_PASS cho 2c0a7985 lúc T0 mở. Replay VẮNG lúc mở (dpkg.log 2 dòng, 783 gói, cache 0, GST 0).
- **Cơ chế O8 JSON: CÒN ĐÚNG.** 2 JSON stamped mới (attempt1 md5 `1a224473`, attempt2 md5 `75dc358e`, khác nhau, không ghi đè; latest == stamped cuối); md5 các JSON cũ (T0/T8-153, T8-152) không đổi; cây md5 khớp T10-153 (preview 530e10a7, media 2c384ed1, vite.config ee80d093).
- **O8 WebKit kiểm chứng: FAIL 0/2 — KHÔNG phải lượt O8 chính thức của đợt 154** (T8-154 phán chuỗi). Attempt1: S0 PASS, **S1 FAIL (toggle rect), Target crashed ở S2-import, EXIT=2, 12 s (F-154-T0-1)**. Attempt2: timeout chờ mẫu tự load, **0 kết quả, EXIT=2, ~4m13s (F-154-T0-2)**. 0 process sót sau mỗi attempt.
- **DIAG137 hoãn có lý do** (xem LIMITS §5): không tìm thấy hằng `DIAG137_SCRIPT` trong script harness sống; cả hai symlink diag đã được T8-154 cập nhật về round154-t8 (checklist (o) xong). Không sửa code repo nào; không push/tag. Stage `phase9-round154-t0-boot-o8.txt` (1 entry NUL).

## §2. T1 — Verify đợt 153: PASS

- **Verdict PASS — nội dung đợt 153 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới `count-final-154.py` (**lần thứ 38 liên tiếp**); **suite chạy lại 28/28 exit 0** trên boot mới `2c0a7985` (7m36s, 11:38:51–11:46:27Z); `npm test` **12 pass**; cây md5 không đổi (preview.tsx 530e10a7).
- **O8 xác nhận độc lập bằng JSON gốc:** WebKit 21/21 ×2 (md5 `3e95c7fe` / `2dfb2e02`) + Chromium 21/21 (`b0745c49`), boot 1450ac80; waiter poll 84 WAIT-DEADLINE 10:30:29Z GATE NOT MET — chuỗi FULL PASS 11 đứng theo quyết parent (j) đợt 153 (caveat gate).
- **Đính chính mới F-154-T1-1: REBOOT #48 ỨNG VIÊN** (boot 2c0a7985, btime 11:26:05Z) giữa lúc T10-153 đóng (~11:15Z) và đợt 154 mở (11:35:51Z) — giao T2-154 (mù #80?) + T7-154 (run 153 có viết lại lần 3 tại #48?). F-154-T1-2: aggregate §10.4 ghi 1.069 file paths quét, đếm lại 1.066 — sai lệch mô tả, không ảnh hưởng tổng số. F-154-T1-3: ENOSPC ≥102 dòng trên 2 boot cũ không đếm lại được (journal xoay sau #47/#48).
- Verdict CHẤP NHẬN đợt 153 (quyết parent (a)) KHÔNG ĐỔI. Stage `phase9-round154-t1-verify153.txt` (1 entry NUL).

## §3. T2 — EPERM probe #73 + mù #78?/#79?/#80? ĐÓNG theo luật gap + thí nghiệm mốc merged: L+M ĐÓNG, N MỞ + T45_thực không ghim được

- **Probe EPERM #73: ok=2 fail=0, boot 2c0a7985, log 208 → 211 dòng.** EPERM 0 sóng thật; sóng thật gần nhất vẫn ~11:55–12:11Z 11/11. EPERM chưa tuyên bố hết.
- **Mù #78?/#79?/#80? ĐÓNG theo luật gap** (P 117 s / Q 1.129 s / R 482 s / S 571 s, max ẩn 0): gap #46 **[5.529, 5.533] s**, gap #47 **[7.309, 7.313] s**, gap #48 **[1.163, 1.167] s** (ứng viên có điều kiện). **CERT/FULL chính thức GIỮ 73/88**; ứng viên có điều kiện: CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95. **Chuỗi đóng hoàn toàn liên tục GIỮ 9** (không tăng — vì #74?/#75?/#76?/#77? còn MỞ phía trước; ba mù mới tạo thành đảo đóng riêng, không nối chuỗi). **Chuỗi INSIDE 7 → 8 → 9 ỨNG VIÊN, rồi ĐỨT tại #48:** btime 1450ac80 INSIDE FULL93/FULL92 → 7→8; btime cd7dcd88 INSIDE FULL94 → 8→9; **btime 2c0a7985 OUTSIDE FULL95** (11:26:05Z < cạnh dưới 11:32:49Z — gap #48 ngắn, dưới p10) → chuỗi dừng ở 9 ứng viên, không lên 10.
- **Thí nghiệm phương pháp mốc merged (theo quyết (c) đợt 153): L+M ĐÓNG (max gap 60/81 s), N MỞ (1.308 s)** — #76? đóng NẾU áp dụng, #77? vẫn mở. **Chuẩn đứng KHÔNG đổi** (chưa có quyết parent áp dụng thành chuẩn); T2 chỉ báo kết quả thí nghiệm.
- **T45_thực KHÔNG ghim được bằng scheduler DB** (0 requeue run 152 tại #45, xác nhận lần 2) — xem §7 (T7 siết bằng cách khác, verdict run 152 đứng vững).
- F117? ~0/+1 s, ĐỦ 3 SERVER. RAM đỉnh 53,95% guard (cửa sổ T9-153, xem §10.3). **Birefnet 0 thử lần thứ 8 liên tiếp. WFS #60: chênh 0 — lần thứ 60 liên tiếp.** LIMITS 74.737 B md5 `6fcbbbb3…` (oversize — push cần `ENABLE_PRIVSEP=0`). Stage `phase9-round154-t2-eperm.txt` (1 entry NUL).

## §4. T4 — Lượt yên #23: KHÔNG CÓ LƯỢT HỢP LỆ (0 attempt, 147 poll) + P3' đã ghi vào DEF/GAP

- **#23 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt trong 147 poll thật trên 2 boot** (poller hết hạn cắt 13:30Z, exit 5). **Chuỗi lượt yên hợp lệ dừng ở #21**; P3' cộng dồn không đổi **39/41 occurrence = 39/40 distinct-seq**.
- Boot #48 (2c0a7985): 117 poll, **RAM sập <1.024 MB từ poll #26 và không hồi** (73/117 poll <500 MB, chuỗi dài nhất 27 poll); 8 poll load+RAM cùng đạt (#18–#25) đều bị chặn bởi apt=1 + gate0 chưa đạt. Cờ T5-154 PASS 11:58:26Z (cờ T5 đầu tiên cho boot mới kể từ #43).
- **Reboot ứng viên #49** (boot 12fc68a3, btime 13:05:12Z) giết poller sau poll #117; T4 khởi động lại poller 13:07:39Z, thêm 30 poll, **0 cửa mở** (load5 không bao giờ <2, min 2,01); gate0 dựa T4-check-only PASS. Overlap migration ~20 s sau btime.
- **DEF/GAP theo quyết parent (d)(i):** cơ chế "catch-up lag sau đóng băng" đã ghi vào DEF_v0.5 §6.4 + GAP §82; helper distinct-seq đã kiểm chứng trên dữ liệu 151 (8/9) và 153 (7/7). Cây preview.tsx 530e10a7 không đổi; 0 process T4 còn sống. Stage `phase9-round154-t4-quiet23.txt` (5 entry NUL — LIMITS + 4 script poll/attempt, đã verify od).

## §5. T5 — Infra: phương án (1) systemd unit CHẾT trong cell + (2) không có cron — watcher chạy tay + POSTBOOT_PASS #48

- **Phương án (1) USER SYSTEMD UNIT: CHẾT trong cell.** Persistence `~/.config/` **ĐẠT** (file Oct 24–Nov 11 còn; marker ghi 11:39:40Z) **NHƯNG `systemctl --user` KHÔNG CHẠY ĐƯỢC:** user@0.service start fail (user-runtime-dir@0 exit 1), không có D-Bus system bus, logind chết, loginctl fail, `/var/lib/systemd/linger` không tồn tại. Unit + script đã chuẩn bị sẵn tại `round154-t5/` (**CHƯA cài**). **Cell KHÔNG CÓ cron nên phương án (2) cũng không dùng được ngay.**
- **Watcher-154 chạy bằng tay (nohup) 11:40:28Z pid 17168; trigger (h) 11:45:59Z, --repair exit 0, poll1 exit 0; POSTBOOT_PASS boot 2c0a7985 ghi 11:58:26Z** (boot+32m21s; 11/11 gói + 5/5 lib + GST 269 + dpkg 795); T4-154 poll #28 nhận cờ, gate0 đạt. Không reboot #49 trong phiên T5. Stage `phase9-round154-t5-infra.txt` (1 entry NUL). LIMITS 25.397 B.

## §6. T6 — (A) còn nguyên + kiểm chứng lại 120/120 lần thứ 4 liên tiếp, prune lần 29

- **(A) CÒN NGUYÊN** (suite md5 không đổi, live-code khối T7 khớp đúng đợt 151/152/153); **kiểm chứng lại DƯƠNG TÍNH: khối T7 trích verbatim chạy 120 lần với churn bơm vào — PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6 lượt.** Chuỗi xanh kép T7 3 → **4** (lần thứ tư xanh kép liên tiếp); chuỗi suite xanh về bản chất 35 → **36**. Tổng cộng **480/480 dưới churn qua 4 đợt**.
- **Lock KHỎE: 426 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"; 0 dòng log mới trong phiên.** Prune lần 29: xóa 1 file cũ nhất (điều (b), `cooldown-s5`), queue **101 → 100 file**. 2 reboot mới kể từ T6-153 đóng (#47 11:06:40Z + mới 11:26:05Z, nghi #48) KHÔNG giết holder nào (chu kỳ cuối hoàn tất 11:04:11Z). Stage `phase9-round154-t6-lockhealth.txt` (1 entry NUL).

## §7. T7 — Scheduler: run 153 SUCCEEDED + #47 viết lại lần 2 (điểm (m) thứ 8) + #49 viết lại run 154 (điểm (m) thứ 9) + siết T45_thực: verdict run 152 ĐỨNG VỮNG

- **Run 153 SUCCEEDED 11:16:00Z** (wall gốc 9.609 s, margin danh nghĩa 1.191 s; 7 lần đọc DB khớp nhau). Hạn ngân sách run 153 là 11:35:51Z — ĐÃ QUA lúc đợt 154 mở; run finished 11:16:00Z, trước hạn 1.191 s — kết cục xác định trước hạn, T7-154 chỉ quan sát/xác nhận sau hạn.
- **#47 viết lại run 153 LẦN 2 (requeue btime + 33,566 s) — ĐIỂM (m) THỨ 8, DƯƠNG** (trong dải 33–48,4 s, không đổi dải). Quyết (n) đợt 153: ĐÃ KIỂM, trả lời CÓ. **#48 trước phiên, KHÔNG phải điểm (m)** (không có run vcut nào đang chạy tại btime #48: run 153 finished 11:16:00Z; run 154 dispatch 11:35:51Z).
- **#49 giữa phiên (btime 13:05:12Z, boot 12fc68a3) viết lại run 154 (requeue btime + 42,981 s) — ĐIỂM (m) THỨ 9, DƯƠNG. n ứng viên 7 → 9; dải 33–48,4 s không đổi.**
- **Siết T45_thực: pin trực tiếp THẤT BẠI** (không requeue run 152 tại #45 — T2 xác nhận độc lập lần 2); **nhưng đối chiếu daemon-epoch vs DB created_at + vị trí T45_thực sau finished 152 ⇒ verdict run 152 SUCCEEDED ĐỨNG VỮNG — đề xuất parent GỠ provisional** (quyết (g) đợt 153).
- **Cửa slot LÀNH HOÀN TOÀN lần 2 liên tiếp: HB 6/6 (−316 s), DR 3/3 (0 s).** Lũy kế HB **44/315**, DR **49/228**. **Run 154 vẫn `running` lúc đóng cờ** (tuổi gốc 7.797 s, còn 3.003 s tới hạn 14:35:51Z) — **kết cục thuộc T7-155**. LIMITS 37.824 B (oversize nhẹ). Stage `phase9-round154-t7-scheduler.txt` (1 entry NUL).

## §8. T8 — Vite harness + O8: PASS 3/3 theo thủ tục (i) sau waiter hết hạn — KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO + harness 6/6, 0 kẹt

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (13:31:33–13:34:35Z, boot `12fc68a3`, cùng cây preview.tsx `530e10a7`). **Chuỗi WebKit FULL PASS 11 → ? CHỜ T10/parent phán (T8 không tự chốt lên 12) — xem §10.2.**
- **Gate: KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN.** T4-154: 0 attempt trong 147 poll, lượt yên #23 không có lượt hợp lệ (chuỗi lượt hợp lệ dừng ở #21). Waiter lần 2 (boot 12fc68a3) poll 19–23 `GATE-NOT-YET t4=0 postboot=1 t4attempt=no-lock`, rồi **WAIT-DEADLINE poll 24 lúc 13:30:32Z — GATE NOT MET**. T8 tự kiểm postboot boot #49 lúc 13:31:06Z: **ĐẦY ĐỦ** (GST 269, dpkg 1545, cache 178, lists 37, lib 6/6) — theo LIMITS T8 (T10 chưa tìm thấy log riêng của bước kiểm này trong `round154-t8/`; xem §10.2). Fixture REBUILD sau gate: 6/6 md5 khớp đợt 125. O8 bắt đầu 13:31:33Z — sau waiter hết hạn, theo thủ tục (i).
- **Harness 6/6 PASS, 0 KẸT** (13:34:48–13:51:00Z, một lần chạy driver, system libs): WebKit 84l10/85m4/86n2 + Chromium 3/3, tất cả exit 0, report ok=true. **Chuỗi "P3 không kẹt" 0 → 1 (bắt đầu lại)**; 10 kẹt cộng dồn giữ nguyên. **Watchdog 0 kích hoạt, 0 live-diag, 0 false-positive.**
- **Reboot #48 trước phiên + ứng viên #49 giữa phiên** (btime 13:05:12Z, boot 12fc68a3; giết waiter lần 1 giữa poll 88 + poller T4 + replay-watch; nghịch lý đồng hồ ≥ +20 s, migration overlap ~20 s sau btime).
- **Checklist (o) ĐÃ XONG CẢ HAI symlink diag → round154-t8/diag-stall-154t8.sh** (trước: hidden → round152, repo → round153; kiểm cuối vẫn trỏ 154). Balloon trong cửa sổ harness: n=33, 0 ghim trần, max 91,9%, avail min 564 MB. Chromium 85m4 P5 "CÓ-RESTART (+2)" do ended-at-duration, KHÔNG FAIL (ok=true). Chromium N=16 mỗi pha, 0 kẹt. Stage `phase9-round154-t8-viteharness.txt` (1 entry NUL). LIMITS 46.929 B (oversize).

## §9. T9 — Headroom 0 → 0 (lần thứ 14 dưới ngưỡng, đợt thứ 3 liên tiếp đóng ở 0) + balloon GHIM TRẦN ĐỢT MỚI 65/125 (52,0% — cao nhất chuỗi) + ENOSPC ≥90 dòng + birefnet 0 lần thứ 8

- **Headroom inotify: mở 0/0 (11:37:41Z + 11:37:46Z, boot #48) → đóng 0/0/0 (13:41:4xZ, boot #49)** — giữ mức **0 cả phiên**, qua reboot #49; **dưới ngưỡng < ~1.800 lần thứ mười bốn liên tiếp**; tỉ lệ/vite **0 → 0** — **đợt thứ ba liên tiếp đóng ở 0** (152: 82 → 0; 153: 0 → 0; 154: 0 → 0). Bảng watch đầy hẳn cả phiên **63.747/63.747**. Quyết parent (h) đợt 153 GIỮ quyết (g) "chỉ theo dõi" — T9 chỉ theo dõi.
- **Balloon GHIM TRẦN ĐỢT MỚI — 65/125 mẫu (52,0%), 4 chuỗi, HAI boot:** chuỗi 1 (12:03:41–12:20:42Z, 18 mẫu, boot #48) + chuỗi 2 (12:24:42–12:42:42Z, 19 mẫu, #48) + chuỗi 3 (12:50:42–13:04:42Z, 15 mẫu, #48 — kết thúc VẪN GHIM, **điểm đứt KHÔNG quan sát được**, reboot cắt ngang) + chuỗi 4 (13:18:18–13:30:18Z, 13 mẫu, boot #49 — đứt quan sát được 13:31:18Z). **Tỉ lệ ghim 52,0% là cao nhất từ trước tới nay trong chuỗi T9** (153: 49,6%; 152: 21,8%). Phán theo quy tắc quyết (e): đợt 154 là đợt ghim MỚI, không nối đợt 153 (giữa lần ghim cuối đợt 153 10:30:58Z và lần chạm đầu đợt 154 12:03:41Z có HAI reboot #47 + #48 + balloon xả sâu tới 3.454.424 kB (53,6% trần) lúc 11:46:41Z + ~1h33m không ghim). Trong đợt: 4 chuỗi, **đề xuất đếm là 1 EPISODE** theo quy tắc (g) đợt 152 — giao T10 xác nhận (đặc biệt chuỗi 4 tách khỏi chuỗi 3 bởi reboot #49).
- **RAM:** sampler **125 mẫu, 11:37:41–13:42:19Z, HAI boot** (88 mẫu boot #48 + 37 mẫu boot #49; gap 95 s tại reboot #49). Min **405.564 kB lúc 12:11:41Z**; max **3.211.344 kB (51,04% guard) lúc 11:43:41Z**; mean 844.524 kB. Gate A ≥1024 MiB: **29/125 mẫu**. **0/125 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ tám liên tiếp** (147–154).
- **B2: 50 spike load1 ≥3,0 — NHIỀU NHẤT TỪ TRƯỚC TỚI NAY trong chuỗi T9** (153: 15; 152: ~28). **28/50 quy được driver process cụ thể** (ffmpeg render/mask_anim/testsrc2, apt-get replay, MiniBrowser/WebKitWebProcess, home-assistant ensure); **22/50 chỉ quy được lớp "load1 dư + tải nền ngắn hạn"** (không process đơn lẻ nào đốt CPU tại snapshot — delta tick ≤23, chủ yếu hatch daemon). Đỉnh **7,07 lúc 11:40:26Z** (ffmpeg render trim); sampler load1 max **7,39 lúc 11:40:41Z**. **ffmpeg testsrc2 geq là driver của 2/50 spike. 0 spike nào sau 13:40:31Z tới lúc đóng** (chỉ ~2 phút yên — sampler dừng 13:42:19Z, không có cửa sổ yên dài như đợt 153).
- **ENOSPC THẬT TRONG JOURNAL: ≥90 dòng trên HAI boot** — boot #48: **≥74 dòng** (đếm 12:58Z; số cuối không kiểm được sau reboot #49 vì journal volatile); boot #49: **16 dòng** (13:07:02–13:45:02Z, vẫn tăng lúc đóng). Tất cả cùng thông điệp `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Đợt thứ ba liên tiếp bảng watch cạn gây lỗi thật thấy được (152: 35 dòng; 153: ≥102 dòng; 154: ≥90 dòng).
- **#23 KHÔNG CÓ lượt hợp lệ (T4: 0 attempt, 147 poll); chuỗi lượt yên hợp lệ DỪNG Ở #21; P3' không đổi 39/41 = 39/40 distinct-seq.** Reboot #49 giữa phiên (btime 13:05:12Z, boot 2c0a7985 → 12fc68a3; số hiệu ứng viên, chờ T2-155); sampler/watcher khởi động lại bằng tay 13:06:17Z. Stage `phase9-round154-t9-headroom.txt` (1 entry NUL). LIMITS 68.103 B (oversize).

## §10. T10 — Kiểm chứng độc lập lúc đóng

### §10.1 Cờ `.done`: 9/9 CÓ MẶT trên đĩa lúc đóng, TẤT CẢ CÓ NỘI DUNG

`ls` trực tiếp `hidden_files` lúc đóng (~14:13Z): round154-t0.done 11:49Z 1.979 B, t1 11:47Z 1.451 B, t2 11:53Z 921 B, t4 13:35Z 1.298 B, t5 12:00Z 886 B, t6 11:50Z 698 B, t7 13:48Z 1.223 B, t8 13:57Z 1.918 B, t9 13:52Z 1.350 B. **9/9 cờ đủ, 9/9 có nội dung** (t3 không có theo thiết kế; quyết (l) đợt 152 giữ trọn vẹn đợt thứ hai liên tiếp — đợt 153 cũng 9/9 có nội dung). Tất cả 9 cờ đều trong hạn cờ ~14:00Z (muộn nhất t8 13:57Z). Nội dung 9/9 luồng đủ trên đĩa (LIMITS + paths + thư mục làm việc).

### §10.2 O8 xác nhận độc lập + PHÁN CHUỖI: KHÔNG LÊN 12 (giữ 11)

Đọc JSON gốc bằng python (không tin mù LIMITS T8): 2 file WebKit stamped riêng biệt — `o8w-clicktest-report-2026-11-20T13-31-35-12fc68a3-pid13016.json` (21 kết quả, 0 fail, md5 `234996ed…`, khối `run` stamp 13-31-35 / bootId `12fc68a3` / pid 13016) và `o8w-clicktest-report-2026-11-20T13-32-41-12fc68a3-pid13484.json` (21 kết quả, 0 fail, md5 `f9f21198…`, pid 13484 — **md5 khác attempt1, không ghi đè**); Chromium `o8-clicktest-report-2026-11-20T13-33-38-12fc68a3-pid13930.json` (21 kết quả, 0 fail, md5 `5db202d0…`, pid 13930). Bản `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `f9f21198`; Chromium latest = `5db202d0`) — đúng thiết kế "latest" của T0-152. Log driver `o8-154t8.log`: `O8 DONE 2026-11-20T13:34:35Z webkit1=0 webkit2=0 chromium=0`, 3 dòng `21/21 pass, 0 fail`, 13:31:33–13:34:35Z, boot 12fc68a3.
**Gate — T10 đối chiếu waiter log gốc:** waiter lần 2 (`smoke/wait-t4-t5.log`, boot 12fc68a3) poll 19–23 `GATE-NOT-YET t4=0 postboot=1 t4attempt=no-lock`, rồi `WAIT-DEADLINE 13:30Z 20/11 poll=24 13:30:32Z — GATE NOT MET`. **Cờ T4 xác nhận: 0 attempt trong 147 poll thật, lượt yên #23 không có lượt hợp lệ.** Bước tự kiểm postboot 13:31:06Z của T8 (GST 269, dpkg 1545, cache 178, lists 37, lib 6/6) chỉ có trong LIMITS T8 — T10 chưa tìm thấy log riêng của bước kiểm này trong `round154-t8/`; ghi theo hồ sơ T8, T10 không xác minh độc lập được (ghi rõ như F-153-T10-5).
**PHÁN CHUỖI — T10 phán: chuỗi WebKit FULL PASS GIỮ 11, KHÔNG LÊN 12.** Căn cứ: (1) kết quả O8 đã xác nhận độc lập (21/21 ×3 trên boot 12fc68a3, JSON stamped riêng biệt, log driver khớp) — kết quả này ĐỨNG, ghi nhận là PASS 3/3; (2) nhưng chuỗi FULL PASS, theo tiền lệ đợt 150 và quyết (j) đợt 153, là chuỗi các lượt O8 chạy **SAU MỘT LƯỢT YÊN HỢP LỆ** — đợt 153 được xác nhận chính vì "chạy sau lượt yên hợp lệ #21"; (3) đợt 154 **không có lượt yên hợp lệ nào** — T4 0 attempt, chuỗi lượt hợp lệ dừng ở #21 (hai reboot trước, trên boot 401fca75 đã chết); lượt yên hợp lệ gần nhất không thuộc phiên này, không thuộc boot này; (4) thủ tục (i) sau waiter hết hạn chỉ bù được **chân postboot** (T8 tự kiểm), không bù được **chân lượt yên** — không có attempt nào để mà "sau lượt yên". Đếm lượt này lên 12 sẽ làm loãng định nghĩa chuỗi (một lượt O8 không qua gate nào cũng được tính như lượt qua gate). Parent quyết cuối ở §12.1 (g) — nếu parent chọn tính, nhãn trích phải là: "O8 3/3 PASS sau waiter hết hạn, KHÔNG có lượt yên hợp lệ nào trong đợt (chuỗi lượt yên dừng ở #21)".

### §10.3 RAM: T9 đúng (không có F-154-T9 mới)

T10 chạy `awk` trực tiếp trên `round154-t9/ram-sampler.log` (125 dòng, trường `mem=`): **max 3.211.344 kB @11:43:41Z (51,04% guard), min 405.564 kB @12:11:41Z, mean 844.524 kB, balloon `bal=6443824` = 65 dòng** — khớp đúng số T9 (max/min/mean/balloon; 88 mẫu boot #48 + 37 mẫu boot #49). T2-154 đối chiếu độc lập: đỉnh cửa sổ mù 53,95% guard (T9-153 sampler — cửa sổ khác, không tranh chấp với đỉnh đợt 154). **Chốt số chính thức đợt 154: RAM đỉnh 51,04% guard; RAM min 405.564 kB (396,1 MiB).** Không cần đo lại.

### §10.4 Đếm cuối bằng dedup toàn cục MỚI (script `count-final-154-t10.py`, không cộng tay)

- Đợt 154 (trước closing): **9 batch / 13 entry / 13 file**.
- **Đợt 154 (gồm closing): 10 batch / 15 entry / 14 file duy nhất.**
- **Lũy kế 111–154: 428 batch / 833 entry / 707 file.**
- **Chờ push 136–154: 180 batch / 255 entry / 211 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
- **Tái kiểm 111–153 = 418/818/695 — KHỚP từng số với T1-154; tái kiểm 111–152 = 408/805/683 — KHỚP; tái kiểm 111–151 = 398/790/670 — KHỚP — lần thứ 39 liên tiếp** (T1-154 ghi lần thứ 38, nay +1).
- Overlap đợt 154 với 111–153: **2 file** — `PHASE9_GAP_ANALYSIS.md` (closing, cập nhật §83) + `docs/DEF_v0.5.md` (T4 cập nhật §6.4 theo quyết parent (d)(i) — trùng có lý do, cập nhật hồ sơ chung).
- Purity: 0 lỗi (1.076 file paths rounds ≤154 quét, NUL-delimited, không newline, không entry rỗng). 0 file thiếu trên đĩa.

### §10.5 Cây / lock / process lúc đóng

- Cây md5 lúc đóng (~14:13Z): preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js (`server/render/src/effects.js`) `fedc0141` — **khớp đúng hồ sơ T10-153 lúc đóng, không đổi ngoài ý muốn**. Script O8 đợt này là file theo đợt (`round154-t8/run-webkit-154t8.sh` md5 `061713d9`, `run-webkit-154t8-debroot.sh` `a1283204`) — khác md5 đợt 153 (`4994b4fc`) vì là script mới theo đợt, không phải cây đổi ngoài ý muốn.
- Lock queue: **101 file** (100 sau prune T6 lần 29 + 1 cooldown `cooldown-t8-round154` T8 thêm sau — đúng mẫu đợt 150/151/152/153). Lock TRỐNG (log cuối RELEASED 13:51:00Z `t8-round154`, hold 230 s, 0 ticket giữ).
- **0 process sót:** `ps` lúc đóng không còn vite/playwright/chromium/webkit/watcher/sampler/poller nào của đợt 154. `/tmp/.X11-unix/` trống.
- **KHÔNG có reboot mới lúc đóng:** boot hiện tại `12fc68a3-10f4-4459-908f-b0a47615afae`, btime 13:05:12Z (kiểm 14:02:44Z) — **không có reboot #50 giữa lúc đóng** (khác đợt 153 có #47 giữa lúc T8 đóng sổ). T10 đóng sổ trên boot #49.

### §10.6 T10 đề xuất: CHẤP NHẬN đợt 154

Căn cứ: (1) 9/9 cờ `.done` trên đĩa, **tất cả có nội dung**, đều trong hạn cờ; (2) T1 verify 153 PASS + suite 28/28 trên boot mới; (3) T0 phát hiện reboot #48 + kiểm chứng cơ chế O8 JSON còn đúng; (4) T2 chứng nhận mù #78?/#79?/#80? ĐÓNG theo luật gap + thí nghiệm mốc merged có kết quả rõ (L+M đóng, N mở); (5) (A) kiểm chứng lại 120/120 PASS dưới churn lần thứ tư liên tiếp, chuỗi xanh kép 3 → 4; (6) O8 3/3 PASS đã xác nhận độc lập bằng JSON gốc (chuỗi giữ 11 — xem §10.2); (7) harness 6/6, 0 kẹt (85m4 hết kẹt, chuỗi "P3 không kẹt" bắt đầu lại 0 → 1); (8) run 153 SUCCEEDED + #47 viết lại lần 2 (điểm (m) thứ 8) + #49 viết lại run 154 (điểm (m) thứ 9) + siết T45_thực xong, verdict run 152 đứng vững (đề xuất gỡ provisional); (9) T5 điều tra xong phương án (1)/(2) (cả hai đều chết trong cell — chờ parent chọn hướng khác); (10) cửa slot HB/DR LÀNH HOÀN TOÀN lần thứ hai liên tiếp; (11) P3' đã ghi "catch-up lag sau đóng băng" vào DEF/GAP theo quyết (d)(i).

### §10.7 Khiếm khuyết lớn của đợt (caveat — parent cân nhắc khi quyết)

(a) 2 reboot: #48 trước phiên (giữa T10-153 đóng và đợt 154 mở) + #49 giữa phiên (viết lại run 154); (b) **lượt yên #23 KHÔNG CÓ lượt hợp lệ nào** (0 attempt, 147 poll) — chuỗi lượt yên hợp lệ dừng ở #21; **O8 không qua gate chuẩn VÀ không có lượt yên nào để mà "sau"** (thủ tục (i) chỉ bù chân postboot); (c) chuỗi WebKit FULL PASS giữ 11, không lên 12 (T10 phán, §10.2); (d) headroom 0 cả phiên (lần thứ 14 dưới ngưỡng, đợt thứ 3 liên tiếp đóng ở 0) + ENOSPC ≥90 dòng trên 2 boot; (e) balloon ghim trần đợt mới 65/125 mẫu (52,0% — cao nhất chuỗi T9), 4 chuỗi, 2 boot, chuỗi 3 điểm đứt KHÔNG quan sát được; (f) B2 50 spike — nhiều nhất chuỗi T9, 22 spike chỉ quy được lớp "load1 dư"; (g) run 154 vẫn `running` lúc đóng, kết cục thuộc T7-155; (h) T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-154 — quyết (o) đợt 153); (i) birefnet 0 thử lần thứ tám liên tiếp; (j) RAM min 405.564 kB (dưới 500 MB); (k) mù #76?/#77? vẫn MỞ, gap #42/#43/#44/#45 chỉ là ứng viên (chưa chứng nhận); CERT/FULL chính thức giữ 73/88; (l) T0 kiểm chứng O8 WebKit FAIL 0/2 với chữ ký mới F-154-T0-1/F-154-T0-2 (không tính vào chuỗi — chỉ T8 phán chuỗi); (m) watcher respawn: phương án (1) chết + (2) không có cron — chưa có hướng triển khai.

### §10.8 Sai số của chính T10-154

- F-154-T10-1 — Lần chạy `awk` đầu tiên trên `ram-sampler.log` dùng sai tên trường (`avail=` thay vì `mem=`) nên trả về rỗng; đã bắt ngay (balloon vẫn đếm đúng 65) và chạy lại đúng trường — số RAM §10.3 là từ lần chạy đúng. Không ảnh hưởng kết luận.
- F-154-T10-2 — T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-154 chạy trên boot mới + kiểm md5/cây/lock lúc đóng — cùng mẫu F-153-T10-4, quyết (o) đợt 153).
- F-154-T10-3 — Bước tự kiểm postboot 13:31:06Z của T8 chỉ được ghi theo LIMITS T8 (T10 chưa tìm thấy log riêng trong `round154-t8/`); T10 không xác minh độc lập được. Ghi rõ trong §10.2, không trình bày như đã xác minh (cùng mẫu F-153-T10-5).
- F-154-T10-4 — T10 viết aggregate + GAP §83 TRƯỚC khi chạy script đếm (tránh mẫu F-152-T10-1/F-153-T10-3 báo thiếu chính aggregate); script đếm chạy sau khi closing đã stage — xem §10.4.

## §11. Nợ mở chuyển đợt 155

1. **Mù #76? MỞ + mù #77? MỞ — giao T2-155** (gap #44 [6.192, 6.196] s + gap #45 RỘNG [4.183, 5.917] s chỉ là ứng viên; CERT/FULL chính thức giữ 73/88; chuỗi đóng hoàn toàn giữ 9). Thí nghiệm mốc merged: L+M ĐÓNG (60/81 s), N MỞ (1.308 s) — chờ quyết §12.1 (c) có áp dụng thành chuẩn đứng không; nếu có thì #76? đóng, #77? vẫn mở.
2. **Mù #78?/#79?/#80? ĐÓNG theo luật gap** (gap #46 [5.529, 5.533] s, #47 [7.309, 7.313] s, #48 [1.163, 1.167] s — ứng viên có điều kiện; CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95 chờ parent chứng nhận §12.1 (b)). Chuỗi INSIDE ứng viên dừng ở 9 (ĐỨT tại #48).
3. **Reboot #49 — số hiệu ứng viên, giao T2-155 xác nhận** (boot 12fc68a3, btime 13:05:12Z; nghịch lý đồng hồ ≥ +20 s + migration overlap ~20 s sau btime theo T8; mù #81? đi kèm).
4. **Kết cục run 154 thuộc T7-155** (run vẫn `running` lúc T7 đóng cờ, hạn ngân sách 14:35:51Z; started_at đã viết lại tại #49 — điểm (m) thứ 9, DƯƠNG; n ứng viên 7 → 9 chờ quyết §12.1 (f)).
5. **Verdict run 152 SUCCEEDED — đề xuất GỠ provisional** (T7-154 siết T45_thực xong: pin trực tiếp thất bại nhưng đối chiếu chéo đứng vững; chờ quyết §12.1 (d)).
6. **Watcher respawn — phương án (1) CHẾT + (2) KHÔNG CÓ CRON — chờ parent chọn hướng khác** (xem §12.1 (e)): quy tắc đứng (3) (T0 kiểm tra watcher lúc mở) vẫn là bảo hiểm duy nhất đang chạy; watcher-154 chạy tay pid 17168 sẽ chết theo reboot tiếp theo; unit + script đã chuẩn bị sẵn tại `round154-t5/` (chưa cài).
7. **H3 vẫn mở, chỉ giám sát thụ động** (quyết (f) đợt 151 + (k) đợt 153 — harness 6/6, 0 kẹt đợt này; chuỗi "P3 không kẹt" bắt đầu lại 0 → 1; 10 kẹt cộng dồn giữ nguyên).
8. **Headroom 0 / tỉ lệ-vite 0 — dưới ngưỡng lần thứ 14 liên tiếp, đợt thứ ba liên tiếp đóng ở 0 + ≥90 dòng ENOSPC thật trong journal trên 2 boot** (quyết (h) đợt 153 GIỮ quyết (g) "chỉ theo dõi" — chờ quyết §12.1 (i)). Trần 63.747 không đổi. Can thiệp host ngoài tầm cell.
9. **Birefnet 0 thử lần thứ tám liên tiếp** (cơ chế (a) armed cả phiên trừ gap 95 s tại #49; u2net là fallback chính thức; lần FIRE thật đầu tiên chưa kiểm chứng end-to-end). Giữ nguyên sampler + trigger cho đợt 155.
10. **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (lượt #23 không có lượt hợp lệ — 0 attempt, 147 poll; RAM sập <1.024 MB không hồi trên boot #48 + load5 không bao giờ <2 trên boot #49). T4-155 cần điều kiện yên mới (xem §12.1 (p)).
11. **Prune lần 30 (T6-155):** tổng lock 100 sau prune 29, lúc T10 đóng đã là 101 (T8 thêm 1 cooldown) — kiểm lại lúc mở đợt 155.
12. **Checklist (o) T8-155: giữ cả hai symlink diag trỏ round155-t8** (đợt này đã xong cả hai; DIAG137 hoãn theo T0-154 — xem LIMITS T0 §5).
13. **File oversize (cần `ENABLE_PRIVSEP=0` lúc push):** T2 LIMITS 74.737 B, T7 LIMITS 37.824 B, T8 LIMITS 46.929 B, T9 LIMITS 68.103 B (đợt này); aggregate 154 + các LIMITS oversize đợt trước vẫn oversize. File 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
14. **Nợ đứng giữ nguyên:** G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16; quyết parent: để yên, không nhắc lại). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38 G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở theo quyết (g) đợt 143. u2net là fallback chính thức cho birefnet. Mù #64/#62/#61 đoạn B, #56 A, #55 B, #53 B, #51 B, #49 B — không kiểm lại (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

## §12. Chờ quyết parent

### §12.1 Câu hỏi mở (đánh số theo thứ tự ưu tiên — parent quyết, T10 không tự chốt)

(a) **Verdict đợt 154: CHẤP NHẬN hay không?** T10 đề xuất CHẤP NHẬN (xem §10.6). Caveat: 2 reboot (#48 trước phiên, #49 giữa phiên); lượt yên #23 không có lượt hợp lệ nào; O8 không qua gate chuẩn và không có lượt yên nào (xem (g)); chuỗi giữ 11; harness 6/6, 0 kẹt; headroom 0 + ENOSPC ≥90 dòng; balloon 52,0% cao nhất chuỗi; run 154 chưa có kết cục; T10 không chạy lại toàn bộ suite; watcher respawn chưa có hướng.

(b) **Mù #78?/#79?/#80? ĐÓNG theo luật gap + gap #46/#47/#48 ứng viên — chứng nhận CERT 73 → 78/79/80 / FULL 88 → 93/94/95, hay giữ mở?** (T2 §2.5.) Gap #46 [5.529, 5.533] s, #47 [7.309, 7.313] s, #48 [1.163, 1.167] s (ứng viên có điều kiện). Chuỗi đóng hoàn toàn liên tục GIỮ 9 vì #74?/#75?/#76?/#77? còn MỞ phía trước — ba mù mới chỉ tạo đảo đóng riêng. Chuỗi INSIDE ứng viên dừng ở 9 (ĐỨT tại #48: btime 2c0a7985 OUTSIDE FULL95).

(c) **Phương pháp mốc merged (sampler/scheduler làm mốc) — áp dụng thành chuẩn đứng không?** (T2 §4.3.) Thí nghiệm: L+M ĐÓNG (max gap 60/81 s), N MỞ (1.308 s) — #76? đóng NẾU áp dụng, #77? vẫn mở. Chuẩn đứng hiện KHÔNG đổi (quyết (c) đợt 153 chỉ cho thử nghiệm). Nếu áp dụng: CERT/FULL có điều kiện thay đổi thế nào, và mốc merged có được dùng cho các gap sau không?

(d) **T45_thực + verdict run 152 SUCCEEDED — GỠ provisional?** (T7 §2.2.) Pin trực tiếp T45_thực THẤT BẠI (0 requeue run 152 tại #45, T2 xác nhận lần 2) nhưng đối chiếu daemon-epoch vs DB created_at + vị trí T45_thực sau finished 152 ⇒ verdict đứng vững. T7 đề xuất gỡ provisional (quyết (g) đợt 153 đặt điều kiện siết xong thì xem lại).

(e) **Watcher respawn — phương án (1) CHẾT + (2) KHÔNG CÓ CRON — chọn hướng nào?** (T5 §7.) (1) user systemd unit: persistence `~/.config/` đạt nhưng `systemctl --user` không chạy được (không D-Bus/logind/linger) — chết trong cell này. (2) @reboot cron: cell không có cron — không dùng được ngay. Còn lại: **(3) quy tắc đứng T0 kiểm tra watcher lúc mở** (đang chạy — đã bắt watcher chết ở đợt 154) — chấp nhận cửa sổ reboot → phiên mở không ai xem? Hay hướng khác (ví dụ: watcher chạy tay dài hơi hơn, cron ngoài cell, hay bỏ yêu cầu respawn)? Unit + script đã chuẩn bị sẵn tại `round154-t5/` (chưa cài) — có giữ lại cho cell khác không?

(f) **n mẫu (m) 7 → 9?** (#47 viết lại run 153 lần 2 — điểm DƯƠNG thứ 8, requeue btime + 33,566 s, trong dải; #49 viết lại run 154 — điểm DƯƠNG thứ 9, requeue btime + 42,981 s; dải 33–48,4 s không đổi; #48 không phải điểm (m). n chính thức vẫn 7 (ứng viên) cho tới khi parent quyết; điều tra (m) vẫn đóng?)

(g) **O8 chuỗi 11 → 12? T10 PHÁN: KHÔNG LÊN — giữ 11. Parent xác nhận?** (§10.2.) O8 3/3 PASS đã xác nhận độc lập (21/21 ×3, JSON stamped riêng biệt, log driver O8 DONE 13:34:35Z) — kết quả đứng. Nhưng chuỗi FULL PASS theo tiền lệ đợt 150 + quyết (j) đợt 153 là chuỗi các lượt O8 chạy SAU MỘT LƯỢT YÊN HỢP LỆ; đợt 154 không có lượt yên hợp lệ nào (T4 0 attempt, 147 poll; chuỗi lượt yên dừng ở #21). Thủ tục (i) chỉ bù chân postboot, không bù chân lượt yên. Nếu parent chọn tính thì nhãn trích: "O8 3/3 PASS sau waiter hết hạn, KHÔNG có lượt yên hợp lệ nào trong đợt (chuỗi lượt yên dừng ở #21)".

(h) **Balloon ghim trần đợt mới — 65/125 mẫu (52,0%), 4 chuỗi, 2 boot: đếm là 1 episode hay nhiều?** (T9 §2.2.) T9 đề xuất 1 EPISODE theo quy tắc (g) đợt 152 (áp dụng lại quyết (i) đợt 153). Caveat mới so với đợt 153: chuỗi 3 kết thúc VẪN GHIM, **điểm đứt KHÔNG quan sát được** (reboot #49 cắt ngang); chuỗi 4 tách khỏi chuỗi 3 bởi reboot #49. Tỉ lệ ghim 52,0% là cao nhất chuỗi T9.

(i) **Headroom 0 lần thứ 14 liên tiếp + ≥90 dòng ENOSPC thật trong journal trên 2 boot — giữ quyết (g) "chỉ theo dõi" hay đổi?** (T9 §1.2/§4/§7.) Đợt thứ ba liên tiếp đóng ở 0; bảng watch đầy hẳn (63.747/63.747) cả phiên. Can thiệp host ngoài tầm cell.

(j) **Birefnet 0 thử lần thứ tám liên tiếp — giữ nguyên cơ chế (a) armed?** (T9 §3.) Guard 6.144 MiB giữ nguyên; u2net là fallback chính thức.

(k) **Reboot #49 (btime 13:05:12Z, boot 12fc68a3) — xác nhận số hiệu #49?** (T8/T4/T7/T9 đều ghi ứng viên; T10 xác minh boot_id + btime lúc đóng, không có reboot #50 sau đó. Nghịch lý đồng hồ ≥ +20 s + migration overlap ~20 s sau btime theo T8; mù #81? giao T2-155.)

(l) **Run 154 kết cục thuộc T7-155 — ghi nhận?** (Run vẫn `running` lúc T7 đóng cờ, hạn ngân sách 14:35:51Z; started_at đã viết lại tại #49.)

(m) **T10 không chạy lại toàn bộ suite — chấp nhận cách đóng sổ này cho đợt 154?** (dựa vào suite 28/28 của T1-154 chạy trên boot mới + kiểm md5/cây/lock lúc đóng — cùng mẫu quyết (o) đợt 153.)

(n) **Cờ 9/9 đều có nội dung, đều trong hạn cờ — quyết (l) đợt 152 giữ trọn vẹn đợt thứ hai liên tiếp; giữ quy tắc đứng?** (Muộn nhất t8 13:57Z, trong hạn cờ ~14:00Z.)

(o) **Harness 6/6, 0 kẹt; chuỗi "P3 không kẹt" 0 → 1 (bắt đầu lại) — H3 vẫn mở, chỉ giám sát thụ động?** (T8.) 10 kẹt cộng dồn giữ nguyên; Chromium đối chứng N=16 mỗi pha, 0 kẹt.

(p) **Lượt yên #23 không có lượt hợp lệ (0 attempt, 147 poll) — có hành động gì cho T4-155 không?** (Nguyên nhân: RAM sập <1.024 MB không hồi trên boot #48 từ poll #26; load5 không bao giờ <2 trên boot #49; 8 poll đủ điều kiện đều bị chặn bởi apt=1 + gate0. Chuỗi lượt yên hợp lệ dừng ở #21. Có cần đổi điều kiện yên / chờ replay xong mới poll không, hay giữ nguyên và chờ lượt sau?)

### §12.2 (đã quyết ở §12.3 dưới)

### §12.3 QUYẾT PARENT (main chat, ~21:2x +07 20/11/2026 — parent viết trực tiếp; §12.3 trống khi đọc, như đợt 146/147/148/149/150/151/152/153)

- **(a) Đợt 154: CHẤP NHẬN.** 9/9 cờ đều có nội dung + T10; T10 đóng ~14:13Z — trong hạn cứng 14:30Z (đóng đúng hạn). T1 verify 153 PASS + suite 28/28; (A) kiểm chứng lại 120/120 lần thứ tư liên tiếp; O8 xác nhận độc lập 21/21 ×3 (chuỗi giữ 11, xem (g)); harness 6/6, 0 kẹt. Caveat ghi nhận, không cản chấp nhận: 2 reboot; lượt yên #23 không có lượt hợp lệ nào; O8 không qua gate chuẩn (xem (g)); headroom 0 + ENOSPC ≥90 dòng; balloon 52,0% cao nhất chuỗi; run 154 chưa có kết cục; T10 không chạy lại toàn bộ suite (xem (m)); watcher respawn chưa có hướng (xem (e)).
- **(b) Mù #78?/#79?/#80? ĐÓNG theo luật gap + gap #46/#47/#48 ứng viên: GIỮ MỞ — chưa chứng nhận.** CERT/FULL chính thức GIỮ 73/88 (ứng viên CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95 có điều kiện chờ chứng nhận theo thứ tự). Lý do: chứng nhận phải theo thứ tự — #74?/#75?/#76?/#77? còn MỞ phía trước; ba mù mới chỉ tạo đảo đóng riêng, chuỗi đóng hoàn toàn liên tục GIỮ 9. Chuỗi INSIDE ứng viên dừng ở 9 (ĐỨT tại #48: btime 2c0a7985 OUTSIDE FULL95) — ghi nhận.
- **(c) Phương pháp mốc merged (sampler/scheduler làm mốc): ÁP DỤNG THÀNH CHUẨN ĐỨNG.** Thí nghiệm đợt 154 chứng minh phương pháp hiệu quả và có tính phân biệt: L+M ĐÓNG (max gap 1.252/1.236 s → 60/81 s, thu hẹp ~20 lần), N VẪN MỞ (1.308 s) — không đóng hết mọi thứ. Mốc merged (dòng log sampler + event scheduler) là hồ sơ độc lập đối chiếu chéo timeline, không phải log-line continuity đơn lẻ (đã bác làm closer ở quyết (e) đợt 143). Phạm vi: mốc merged được dùng thêm vào phân tích luật gap cùng mốc file, áp dụng nhất quán (không chọn lọc theo ca). Hệ quả: **#76? ĐÓNG** (L+M đóng theo phương pháp mới — ghi là đảo đóng riêng, chuỗi đóng hoàn toàn GIỮ 9 vì #74?/#75? còn mở phía trước); **#77? VẪN MỞ** (N mở ngay cả theo phương pháp mới). CERT/FULL GIỮ 73/88 (chứng nhận vẫn theo thứ tự; #74?/#75? còn chặn CERT76/FULL91).
- **(d) T45_thực + verdict run 152 SUCCEEDED: GỠ PROVISIONAL.** Siết T45_thực xong: pin trực tiếp thất bại (0 requeue run 152 tại #45, T2 xác nhận lần 2) nhưng đối chiếu chéo đứng vững (daemon-epoch vs DB created_at + vị trí T45_thực sau finished 152) ⇒ verdict đứng vững. Điều kiện xem lại ở quyết (g) đợt 153 (siết xong khẳng định bước nhảy vượt margin thì xem lại) KHÔNG xảy ra — siết không khẳng định được bước nhảy vượt margin. Verdict run 152 là SUCCEEDED (không điều kiện).
- **(e) Watcher respawn: CHẤP NHẬN (3) LÀM HƯỚNG ĐỨNG — phương án (1) CHẾT, (2) KHÔNG CÓ CRON.** (1) user systemd unit CHẾT trong cell này (persistence `~/.config/` đạt nhưng `systemctl --user` không chạy được — không D-Bus/logind/linger); (2) @reboot cron không dùng được (cell không có cron). Còn lại (3) quy tắc đứng "T0 kiểm tra watcher lúc mở" — đã chạy và đã bắt watcher chết ở đợt 154. Chấp nhận cửa sổ reboot → phiên mở không ai xem là khoảng hở đã biết, với kiểm tra của T0 lúc mở là biện pháp giảm thiểu. Unit + script chuẩn bị sẵn tại `round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài ở cell này). Không theo hướng watcher chạy tay dài hơi hơn hay cron ngoài cell (ngoài phạm vi cell này).
- **(f) n mẫu (m): CHẤP NHẬN n = 9 (ỨNG VIÊN) — điều tra (m) VẪN ĐÓNG.** (#47 viết lại run 153 lần 2 — điểm DƯƠNG thứ 8, requeue btime + 33,566 s; #49 viết lại run 154 — điểm DƯƠNG thứ 9, requeue btime + 42,981 s; dải 33–48,4 s không đổi; #48 không phải điểm (m).) Tổng: 7 dương + 2 âm (#38, #45 ứng viên). Lưu ý đính chính nhỏ: quyết (f) đợt 153 ghi "6 điểm dương" là sai đếm — lúc đó là 5 dương (#39/#41/#42/#44/#46) + 2 âm (#38, #45 ứng viên) = 7 điểm; nay thêm #47 + #49 (2 dương) = 9 điểm. Cơ chế đã xác định; đây chỉ là điểm dữ liệu xác nhận thêm.
- **(g) O8 chuỗi 11 → 12: XÁC NHẬN PHÁN CỦA T10 — GIỮ 11, KHÔNG LÊN 12.** O8 3/3 PASS đã xác nhận độc lập (21/21 ×3, JSON stamped riêng biệt, log driver O8 DONE 13:34:35Z) — kết quả đứng. Nhưng chuỗi FULL PASS theo tiền lệ đợt 150 + quyết (j) đợt 153 là chuỗi các lượt O8 chạy SAU MỘT LƯỢT YÊN HỢP LỆ; đợt 154 không có lượt yên hợp lệ nào (T4 0 attempt, 147 poll; chuỗi lượt yên dừng ở #21). Thủ tục (i) chỉ bù chân postboot, không bù chân lượt yên. Nhãn trích: "O8 3/3 PASS sau waiter hết hạn, KHÔNG có lượt yên hợp lệ nào trong đợt (chuỗi lượt yên dừng ở #21)".
- **(h) Balloon ghim trần đợt mới — 65/125 mẫu (52,0%), 4 chuỗi, 2 boot: ĐẾM LÀ 1 EPISODE (1 đợt ghim mới), chứa 4 chuỗi.** Áp dụng lại quy tắc đợt 152 (g). Caveat ghi nhận: chuỗi 3 kết thúc VẪN GHIM, điểm đứt KHÔNG quan sát được (reboot #49 cắt ngang); chuỗi 4 tách khỏi chuỗi 3 bởi reboot #49. Tỉ lệ ghim 52,0% là cao nhất chuỗi T9 — ghi nhận.
- **(i) Headroom 0 lần thứ 14 liên tiếp + ≥90 dòng ENOSPC thật trong journal trên 2 boot: GIỮ QUYẾT (g) "chỉ theo dõi", không đổi.** Vẫn không có hành động khả thi từ trong cell (can thiệp host ngoài tầm; vòng lặp vẫn chạy vì vite tạm dùng 0 watch). Đợt thứ ba liên tiếp đóng ở 0 — bản tin đợt này ghi một dòng cập nhật theo quy tắc đứng (báo khi < ~1.800).
- **(j) Birefnet 0 thử lần thứ tám liên tiếp: GIỮ NGUYÊN cơ chế (a) armed.** Guard 6.144 MiB giữ nguyên; u2net là fallback chính thức.
- **(k) Reboot #49 (btime 13:05:12Z, boot 12fc68a3): XÁC NHẬN số hiệu #49.** T10 xác minh boot_id + btime lúc đóng, không có reboot #50 sau đó. Nghịch lý đồng hồ ≥ +20 s + migration overlap ~20 s sau btime theo T8 — ghi nhận. Mù #81? giao T2-155.
- **(l) Run 154 kết cục thuộc T7-155: GHI NHẬN.** (Run vẫn `running` lúc T7 đóng cờ, hạn ngân sách 14:35:51Z; started_at đã viết lại tại #49.)
- **(m) T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 154** (dựa vào suite 28/28 của T1-154 chạy trên boot mới + kiểm md5/cây/lock lúc đóng — cùng mẫu quyết (o) đợt 153). Quy tắc đứng giữ nguyên: nếu T1 không chạy được suite đầy đủ thì T10 phải chạy lại trước khi đóng.
- **(n) Cờ 9/9 đều có nội dung, đều trong hạn cờ: XÁC NHẬN quyết (l) đợt 152 giữ trọn vẹn đợt thứ hai liên tiếp — GIỮ NGUYÊN quy tắc đứng.** Muộn nhất t8 13:57Z, trong hạn cờ ~14:00Z. Mỗi luồng PHẢI viết nội dung vào cờ của mình trước khi báo đóng; T10 kiểm cờ trên đĩa và ghi rõ "x/9 cờ" trong §10.
- **(o) Harness 6/6, 0 kẹt; chuỗi "P3 không kẹt" 0 → 1 (bắt đầu lại): H3 VẪN MỞ, chỉ giám sát thụ động — GIỮ NGUYÊN.** 10 kẹt cộng dồn giữ nguyên; Chromium đối chứng N=16 mỗi pha, 0 kẹt. Không mở giả thuyết phân biệt mới trừ khi kẹt có chữ ký khác.
- **(p) Lượt yên #23 không có lượt hợp lệ (0 attempt, 147 poll): GIỮ NGUYÊN điều kiện yên, chờ lượt sau.** Nguyên nhân là nhất thời (RAM sập trên boot #48, load5 không bao giờ <2 trên boot #49, apt=1 + gate0 chặn) — không phải lỗi điều kiện yên. Đổi điều kiện (hạ ngưỡng RAM hay chờ replay xong mới poll) sẽ làm yếu cổng đo. Chuỗi lượt yên hợp lệ dừng ở #21 là tạm dừng, không phải hỏng. T4-155 thử lại với cùng điều kiện.

- Ghi chú nguồn gốc: §12.3 trống khi đọc (T10 để trống, kèm chú thích HTML "Parent viết quyết trực tiếp vào đây"); nội dung các quyết trên là parent viết trực tiếp — KHÔNG có quyết nào được điền sẵn (như đợt 146/147/148/149/150/151/152/153).

---

## Batch stage / Tổng batch

Batch stage đợt 154 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round154-*.txt`):

- `phase9-round154-t0-boot-o8.txt` — 1 entry (T0: LIMITS boot survey + O8 JSON)
- `phase9-round154-t1-verify153.txt` — 1 entry (T1: LIMITS verify đợt 153)
- `phase9-round154-t2-eperm.txt` — 1 entry (T2: LIMITS EPERM + mù #78?/#79?/#80?)
- `phase9-round154-t4-quiet23.txt` — 5 entry (T4: LIMITS #23 + 4 script poll/attempt)
- `phase9-round154-t5-infra.txt` — 1 entry (T5: LIMITS infra)
- `phase9-round154-t6-lockhealth.txt` — 1 entry (T6: LIMITS lock)
- `phase9-round154-t7-scheduler.txt` — 1 entry (T7: LIMITS scheduler)
- `phase9-round154-t8-viteharness.txt` — 1 entry (T8: LIMITS O8 + harness)
- `phase9-round154-t9-headroom.txt` — 1 entry (T9: LIMITS headroom + RAM + birefnet)
- `phase9-round154-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §83)

**Tổng batch đợt 154: 10 batch / 15 entry / 14 file duy nhất.**
**Lũy kế 111–154: 428 batch / 833 entry / 707 file.**
**Tổng batch chờ user push (đợt 136–154): 180 batch / 255 entry / 211 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)
