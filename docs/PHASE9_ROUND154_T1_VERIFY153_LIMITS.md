# LIMITS — Phase 9 đợt 154, T1: Verify độc lập đợt 153

- **Boot:** `2c0a7985` suốt phiên (btime 11:26:05Z — **reboot MỚI #48 ứng viên sau khi T10-153 đóng**, xảy ra giữa lúc T10-153 đóng ~11:15Z và lượt cron 154 mở 11:35:51Z; xem F-154-T1-1). Boot lúc T10-153 đóng là `cd7dcd88` (#47, btime 11:06:40Z).
- **Verdict: PASS — nội dung đợt 153 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới `count-final-154.py` (**lần thứ 38 liên tiếp**); suite chạy lại **28/28 exit 0 trên boot mới 2c0a7985** (lấp khoảng trống T10-153 không chạy lại suite — quyết parent (o) đợt 153 đã chấp nhận cách đóng sổ đó cho đợt 153, lần verify này chạy lại đầy đủ); `npm test` **12 pass** theo chuẩn đứng; O8 xác nhận độc lập bằng JSON/log gốc (chuỗi FULL PASS 11 đứng theo quyết parent (j) đợt 153 — xem §3). RAM đỉnh 53,95% guard + min 324.648 kB + balloon 65 đối chiếu từ log gốc khớp T9/T10. Mù #76?/#77? vẫn MỞ theo hồ sơ + quyết parent (b) đợt 153.
- **Caveat lớn (đọc trước):** reboot #48 ứng viên giữa lúc T10-153 đóng và đợt 154 mở — T10-153 ghi "không reboot nào sau #47" (theo nghĩa tại lúc đóng) nay đã sai cho khoảng tới lúc đợt 154 mở (xem F-154-T1-1); ENOSPC ≥102 dòng trên 2 boot cũ không đếm lại được nữa (journal đã xoay sang boot mới — F-154-T1-3, cùng mẫu F-153-T1-3); headroom 0 vẫn chỉ đứng trên bảng T9 (không còn stdout probe thô — F-152-T1-5 kéo dài); T8-153 đóng cờ 11:09Z trên boot #47 mà không ghi nhận #47 (quyết parent (l)/(n) đợt 153 đã ghi nhận + xác nhận).

## §1. Đếm cuối — KHỚP TỪNG SỐ (script mới `count-final-154.py`, dedup toàn cục)

- **Đợt 153 = 10 batch / 13 entry / 13 file (gồm closing) — KHỚP.**
- **Lũy kế 111–153 = 418 / 818 / 695 — KHỚP.**
- **Chờ push 136–153 = 170 / 240 / 199 — KHỚP.**
- **Tái kiểm 111–152 = 408/805/683 — KHỚP; 111–151 = 398/790/670 — KHỚP; 111–150 = 388/774/658 — KHỚP — lần thứ 38 liên tiếp** (T10-153 ghi lần thứ 37, nay +1).
- **Đợt 153 (trước closing) = 9 / 11 / 11 — KHỚP.** Đợt 152 = 10 / 15 / 15; đợt 151 = 10 / 16 / 16 — KHỚP.
- **Purity: 0 lỗi** (1.066 file paths rounds ≤ 153 quét, NUL-delimited, không newline, không entry rỗng; 0 file round 154 lúc chạy script — xem F-154-T1-2 về con số 1.069 của T10). **0 file thiếu trên đĩa** (13/13 file đợt 153 đều tồn tại dưới `~/workspace/repo-1`).
- **Overlap đợt 153 với 111–152: 1 file — KHỚP** (`PHASE9_GAP_ANALYSIS.md` closing §82 — trùng có lý do).
- **GAP §82 đã có đủ đếm cuối đợt 153** (10/13/13; 418/818/695; 170/240/199; tái kiểm 111–152 = 408/805/683 + 111–151 = 398/790/670) — header §82 vẫn ghi "verdict CHẤP NHẬN — đề xuất, chờ quyết parent" dù quyết parent (a) đã có trong aggregate §12.3 (xem §12 — T10-154 cập nhật nhãn khi viết §83).
- Aggregate 153 nay **66.599 B** (khối §12.3 đo được **8.432 B** — quyết parent (a)–(p) viết trực tiếp sau đóng; cùng mẫu F-153-T1-2, không phải lỗi).

## §2. Suite chạy lại: 28/28 exit 0 trên boot mới 2c0a7985 (lấp khoảng trống T10-153 không chạy suite)

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (11:38:51–11:46:27Z, 7m36s, boot `2c0a7985`, RAMavail lúc mở 1.232 MB). Script `round154-t1-verify.sh` (adapt từ T1-153, nhãn echo đã đúng "T1-154"). Log `round154-t1-suites.log` (970 dòng — đúng bằng T1-153).
- **`npm test` đầy đủ: 12 pass, 0 fail** — đúng chuẩn đứng (11 mục cũ + probe V19 34 assert PASS). 12 dòng `✅ PASS` trong mục npm-test-full; 7 self-test unit pass riêng ngoài 12.
- **Hệ quả kiểm chứng thêm:** probe V19 geq 34/34 assert PASS ngay trong suite tích hợp trên boot mới 2c0a7985 — xác nhận độc lập claim T0-151/T0-152 lần thứ tư (T1-151, T1-152, T1-153, nay T1-154).
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676` (sau (A)), test_integration.sh `a6b8cfc0` — khớp hồ sơ T10-152/T1-153 lúc đóng. Cây đã qua 9 boot với cùng md5 preview.tsx (đợt 152: 8 boot; nay + reboot #48).
- **Caveat:** suite chạy trong lúc các luồng đợt 154 khác làm việc song song (T0-154 chạy O8 WebKit attempt2 từ 11:43Z, chồng lấn ~3 phút cuối suite; T4/T6/T7/T8/T9 đã mở thư mục làm việc). Tải song song không đổi verdict (7m36s, nhanh hơn 8m26s của T1-153). Không file lõi nào đổi giữa phiên mà suite chạm tới — md5 6 file trên không đổi trước/sau suite.

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng)

- File gốc `hidden_files/round153-t8/o8-webkit/o8w-clicktest-report-2026-11-20T10-32-02-1450ac80-pid17449.json` (attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `3e95c7fe`, khối `run` (stamp 10-32-02, bootId 1450ac80, pid 17449).
- File gốc `.../o8w-clicktest-report-2026-11-20T10-33-02-1450ac80-pid17793.json` (attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `2dfb2e02` — **khác md5 attempt1** (không còn ghi đè — F-151-T10-2 đóng thật).
- File gốc `hidden_files/round153-t8/o8-chromium/o8-clicktest-report-2026-11-20T10-33-58-1450ac80-pid18102.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `b0745c49`.
- File `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `2dfb2e02`; Chromium latest = `b0745c49`) — đúng thiết kế "latest" của T0-152.
- Driver log `o8-153t8.log`: start 10:32:01Z boot 1450ac80, preview.tsx 530e10a7, script O8 `4994b4fc`; `O8 DONE 10:34:54Z webkit1=0 webkit2=0 chromium=0`.
- **Gate (chuẩn đứng (i)):** waiter `wait-t4-t5.log` (round153-t8/smoke): `polls: 83 | GATE-FOUND: False | WAIT-DEADLINE: True`, `WAIT-DEADLINE 10:30Z 20/11 poll=84 10:30:29Z — GATE NOT MET` — **khớp đúng T10-153 §10.2**. O8 chạy theo thủ tục (i) sau waiter hết hạn, sau lượt yên hợp lệ #21 (attempt2-401fca75 08:59:22–09:02:43Z, cờ T4 09:12:10Z). **Chuỗi WebKit FULL PASS 11 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả** (quyết parent (j) đợt 153 đã xác nhận chuỗi với caveat gate; nhãn trích giữ nguyên: "O8 sau lượt yên hợp lệ #21, theo thủ tục (i) sau waiter hết hạn, gate không đạt tại hạn"). T1 không xác minh độc lập bước tự kiểm postboot #46 lúc 10:31:14Z của T8 (chỉ có trong LIMITS T8 — cùng caveat F-153-T10-5).
- **Caveat (đã biết, không ảnh hưởng):** postboot #46 chỉ tự kiểm bởi T8; T10-153 cũng chưa xác minh độc lập được vì boot #47 đã thay #46.

## §4. T0 — F-153-T0-1 (kẹt S2-timeline-add) đúng ở gốc; scratch JSON khớp

- Scratch `round153-t0/o8-webkit/`: JSON stamped `o8w-clicktest-report-2026-11-20T08-47-58-401fca75-attempt1-pid25315.json` — **4 kết quả, 3 ok**, harnessError `page.setInputFiles: Target page, context or browser has been closed` — khớp chữ ký F-153-T0-1 (S2 thêm clip W lên timeline FAIL sau ~447 s, EXIT=124). File `latest` WebKit = attempt1 (4 kết quả, 3 ok) — đúng thiết kế.
- **Kết luận:** T0 kiểm chứng cơ chế O8 JSON còn đúng và ghi đúng chữ ký kẹt mới; đây KHÔNG phải lượt O8 chính thức (T8 phán chuỗi — xem §3).

## §5. T2 — Probe #72 + mù #76?/#77? MỞ: đứng theo hồ sơ + quyết parent (b)

- **Probe EPERM #72: log `eperm-probe-v2.log` đúng 208 dòng tại lúc T2-153 đóng** (3 dòng cuối: DEAD #71 08:41:06Z + boot-changed 18e179e0 → 401fca75 + `probe#72 boot=401fca75 ok=2 fail=0` 08:41:10Z — đúng mẫu +3). **Log nay 211 dòng — KHÔNG phải lệch:** 3 dòng mới (209–211) là probe #73 của T2-154 (DEAD #72 11:38:16Z + boot-changed 401fca75 → 2c0a7985 + `probe#73 boot=2c0a7985 ok=2 fail=0` 11:38:16Z) — đúng mẫu +3, trên boot mới #48. Dòng boot-changed của probe #73 ghi "uptime since 2026-11-20 11:26:05" — đối chiếu độc lập btime #48 (xem F-154-T1-1).
- **Mù #76?/#77? MỞ:** đối chiếu file `blind76-gaps.txt` — L `max gap 1252s` (hố 1.252 s), M `max gap 1236s` (hố 1.236 s), N `max gap 1319s` (hố 1.319 s), floor 1147 s, max hidden = 1 — khớp claim aggregate §3. Gap #44 [6.192, 6.196] s + gap #45 RỘNG [4.183, 5.917] s là ứng viên — **quyết parent (b) đợt 153: GIỮ MỞ, chưa chứng nhận; CERT/FULL chính thức GIỮ 73/88** — T1 chỉ đối chiếu hồ sơ, không đạo lại merged gap. Chuỗi đóng hoàn toàn giữ 9.
- T1 không đạo lại phân tích sessions/hole-recheck/INSIDE/WFS chi tiết (phạm vi T2; file bằng chứng đầy đủ trên đĩa).

## §6. T4 — Lượt yên #21: đếm lại từ log gốc khớp

- `poll-t4.log`: **43 dòng**. Dòng cuối: `attempt2-401fca75 20/20 + LOP B DAT 5/5 + tickCost median=40.0ms <=60 - LUOT HOP LE, thoat poller`.
- **Attempt2 (lượt hợp lệ #21): 20/20 + LỚP B ĐẠT 5/5 + tickCost median 40,0 ms ≤ 60 (CÓ BIÊN AN TOÀN 20 ms)** — file phân tích `analyze-t4-attempt2-401fca75-tickcost.txt`: `tickCost total n=647 median=40.0 p90=66.0 max=97 min=27 | hau flip+2000ms n=463 median=40.0` — khớp từng số aggregate §4. Cửa mở poll #24 08:59:22Z (gate0 T4-check-only + gateA RAM 2.745 MB); attempt xong 09:03:09Z, dùng 2/3 ngân sách.
- **P3' 39/41 (39/40 distinct-seq) + xem xét kết luận (b)** — đứng theo hồ sơ T4; **quyết parent (d) đợt 153: CHỌN (i) — ĐÓNG XEM XÉT** (ghi cơ chế "catch-up lag sau đóng băng" vào DEF/GAP + đếm thêm cột distinct-seq từ đợt 154 — T4-154 thực hiện). T1 không đạo lại từng pass P1/P2/P3/P7 (phạm vi T4; file analyze attempt2 có đủ trên đĩa).

## §7. T5 — POSTBOOT_PASS stale + watcher respawn: đứng theo file gốc + quyết parent (e)

- **POSTBOOT_PASS cho boot hiện tại CHƯA CÓ — đã xác minh:** trên đĩa chỉ còn `hidden_files/round152-t5/POSTBOOT_PASS` (mtime 05:58:52Z, boot 18e179e0 = #43) + bản cũ `POSTBOOT_PASS-2e430750`; không có cờ nào cho #45/#46/#47/#48. Khớp claim T5-153 + aggregate §11.9. Giao T4/T5-154 viết gate0wait/POSTBOOT_PASS mới cho boot #48 (quyết parent (e) đợt 153: T5-154 kiểm tra persistence `~/.config/` + `systemctl --user` trước khi triển khai unit systemd + quy tắc đứng (3) T0 kiểm tra watcher lúc mở).
- T1 không kiểm lại apt/dpkg internals (phạm vi T5). Dpkg.log boot mới: 2 dòng startup đầu 11:35:40Z (boot+9m35s) — replay bắt đầu trước lượt cron 154 mở 11:35:51Z 11 s (xem F-154-T1-1).

## §8. T6 — Lock khỏe lúc đóng; (A) còn nguyên theo hồ sơ

- **Chạy lại script của chính T6 trên log đóng băng:** `analyze-log.py` trên `vite-lock-v2-cleaned-close.log` (1.466 dòng) cho đúng số T6: **ACQUIRED=426, RELEASED=417, pairs 417, still held 0, double-acquire 9** — tái hiện chính xác, không cộng tay. Log mở và log đóng cleaned giống hệt nhau (CLEANED-UNCHANGED).
- **Prune lần 28:** queue 101 → 100 theo claim; lúc T10 đóng 101 do T8 thêm 1 cooldown sau prune — T1 không đếm lại queue lúc đóng (đã qua 2 reboot sau đó; giao T6-154 kiểm lại lúc mở đợt 154, nợ §11.10 aggregate 153).
- (A) còn nguyên + 120/120 PASS dưới churn, chuỗi xanh kép 2 → 3: đứng theo hồ sơ T6 + quyết parent (a) đợt 153 — T1 không chạy lại 120 lần kiểm chứng churn (phạm vi T6).

## §9. T8 — Harness 5/6, 85m4 kẹt thật: xác nhận từ log summary gốc

- `smoke/run-webkit-summary.txt`: `=== ALL DONE Fri Nov 20 11:04:11 UTC 2026 ec webkit: 84l10=0 85m4=124 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0 ===` — **harness 5/6 PASS một lần chạy, 1 kẹt thật (85m4 WebKit exit 124)**. Khớp aggregate §8. Chuỗi "P3 không kẹt" 1 → 0 (ĐỨT) — **quyết parent (k) đợt 153: H3 VẪN MỞ, chỉ giám sát thụ động — GIỮ NGUYÊN**.
- T8 đóng cờ 11:09:41Z (979 B, có nội dung) — sau reboot #47 (11:06:40Z), trên boot mới cd7dcd88 mà không ghi nhận #47 — **quyết parent (l)/(n) đợt 153: CHỈ GHI NHẬN / XÁC NHẬN #47**; file closing của T8 viết trên boot mới là hợp lệ.
- T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — RAM đỉnh/min + balloon 65: đếm lại từ log gốc khớp; headroom 0 + ENOSPC có caveat mới

- `ram-sampler.log`: **131 dòng** — khớp 131 mẫu. Chạy `awk` trực tiếp trên cột `mem=`: **max avail 3.394.288 kB lúc 09:03:54Z = 53,95% guard 6.291.456 kB; min avail 324.648 kB lúc 10:46:59Z; mean 1.017.318 kB** (tổng nguyên 133.268.660 / 131) — khớp đúng số T9/T10 (đỉnh đợt 153 thấp hơn đỉnh đợt 152: 63,01%).
- **Balloon ghim trần 65/131 mẫu:** đếm dòng `bal=6443824` = **65 dòng** — khớp. **0/131 mẫu ≥ guard** — birefnet 0 thử lần thứ 7 liên tiếp ✓ (quyết parent (m) đợt 153: GIỮ NGUYÊN cơ chế (a) armed).
- **B2: 15 spike** — `grep -c '^=== SPIKE' b2-spikes.log` = **15** (đếm thô `grep -c SPIKE` = 21 — sai số F-153-T9-5 đã sửa, T1 đếm đúng neo đầu dòng). T1 không attribution từng spike (phạm vi T9).
- **Headroom 0 → 0 — ĐỨNG THEO BẢNG, KHÔNG CÓ STDOUT PROBE THÔ (F-152-T1-5 kéo dài):** T9 LIMITS §1.2 ghi mở 0/0 (08:38:02Z + 08:38:06Z, boot 401fca75) và đóng 0/0/0 (10:47:35Z + 10:47:38Z + 10:47:44Z, boot 1450ac80); bảng watch đầy hẳn 63.747/63.747 cả phiên. Quyết parent (h) đợt 153: GIỮ quyết (g) "chỉ theo dõi". T1 KHÔNG đo lại headroom (số đo cùng thời điểm không tái tạo được).
- **ENOSPC ≥102 dòng — KHÔNG ĐẾM LẠI ĐƯỢC NỮA (F-154-T1-3):** T9 đếm ≥21 dòng trên boot 401fca75 + 81 dòng trên boot 1450ac80; journal volatile chỉ giữ 1 boot — sau reboot #47 + #48 journal chỉ còn boot 2c0a7985. Số ≥102 dòng đứng trên hồ sơ T9 (đếm lúc đóng, ghi rõ phương pháp + cadence ~70 s + cùng thông điệp service). Không đổi verdict.

## §11. Sai lệch phát hiện (F-154-T1-N — kể cả nhỏ)

- **F-154-T1-1 — Reboot #48 ỨNG VIÊN MỚI giữa lúc T10-153 đóng và đợt 154 mở.** Boot hiện tại `2c0a7985` (btime 1795173965 = 11:26:05Z; `uptime -s` 11:26:05Z; journal boot mới first entry 11:26:15Z; `last reboot` 11:26 still running; wtmp begins 11:26:15Z); T10-153 đóng ~11:15Z trên boot `cd7dcd88` và ghi "không reboot nào sau #47" (theo nghĩa tại lúc đóng — T10 không sai lúc viết, cùng mẫu F-152-T10-4/F-153-T1-1). **Bằng chứng reboot là thật:** boot_id đổi cd7dcd88 → 2c0a7985; `journalctl --list-boots` chỉ còn boot 2c0a7985; probe #73 của T2-154 (11:38:16Z) tự ghi `boot changed 401fca75 -> 2c0a7985 (uptime since 2026-11-20 11:26:05)`; dpkg.log replay boot mới bắt đầu 11:35:40Z (boot+9m35s). **Cửa sổ reboot:** sau lần ghi cuối trên boot cũ (aggregate 153 mtime 11:17:10Z; cờ T10-153 11:15:19Z) và trước lượt cron 154 mở 11:35:51Z — tức **(11:17:10Z, 11:26:05Z]** theo btime (rộng nhất (11:17:10Z, 11:35:51Z]). **Hệ quả:** (a) kết cục run 153 nay còn liên quan #47 VÀ #48 — giao T7-154 kiểm started_at có viết lại lần 2 tại #47 / lần 3 tại #48 không (quyết parent (n) đợt 153 chỉ giao kiểm #47 — nay thêm #48); (b) mở cửa sổ mù mới sau #48 — giao T2-154 (số hiệu mù do T2-154 quyết; mù #80? ứng viên); (c) "0 process sót" lúc T10 đóng đứng tại thời điểm đóng — #48 đã giết mọi process còn sót sau đó, không phải do dọn dẹp; (d) POSTBOOT_PASS cho #48 chưa có (xem §7). **Cơ chế đồng hồ:** btime #48 (11:26:05Z) KHÔNG mâu thuẫn với lần ghi cuối boot cũ (11:17:10Z) — khác #45 (nghịch lý ≥ +50'26"); không có bằng chứng bước nhảy khung giờ tại #48.
- **F-154-T1-2 — Aggregate §10.4 ghi "1.069 file paths rounds ≤153 quét" — đếm lại được 1.066.** Script dedup mới của T1 (regex `^phase9-round(\d+)-.+\.txt$`) quét đúng 1.066 file; `ls | grep -c '^phase9-round'` cũng = 1.066; script T10-153 dùng cùng glob `phase9-round*.txt` nhưng không in tổng số file quét — con số 1.069 trong aggregate là T10 ghi tay. **Không file paths nào mới hơn 11:15Z** (find `-newermt 11:15Z` = 0) nên tập file T10 quét giống hệt tập T1 quét. **Không ảnh hưởng tổng số nào** — mọi batch/entry/file đều khớp (§1). Ghi nhận là sai lệch mô tả, không phải lỗi đếm.
- **F-154-T1-3 — ENOSPC ≥102 dòng trong journal 2 boot cũ không đếm lại được nữa.** Journal volatile, chỉ giữ 1 boot; sau reboot #47 + #48 chỉ còn journal boot 2c0a7985. T9-153 đã ghi rõ giới hạn này trong LIMITS §4 ("không kiểm được ENOSPC trên boot cũ sau reboot" — tiền lệ F-153-T1-3). Số ≥102 dòng đứng trên hồ sơ T9 (đếm lúc 09:03:27Z/10:49:01Z, ghi rõ phương pháp + cadence ~70 s + khoảng thời gian). Không đổi verdict.
- **F-154-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-153-T1-4).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness/waiter (đếm lại từ file gốc). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, INSIDE, WFS), T7 (scheduler DB, HB/DR, run 152/153 chi tiết), T5 (apt/dpkg internals), T9 (attribution từng spike, balloon episode, chuỗi headroom dài hạn), T6 (120 lần kiểm soát churn), T0 (bench chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. /tmp trước reboot #47/#48 đã mất theo reboot.
- **F-154-T1-5 — Sai số của chính T1-154 (ghi trung thực):** (a) script phụ lục bản đầu trích cây md5 sai (dùng chỉ số ký tự thay cho chỉ số dòng — đã sửa thành tìm theo số dòng và chạy lại; file phụ lục trên đĩa là bản từ script đã sửa). (b) lúc đầu đọc mean RAM bằng `awk` dạng float ra 1.017.320 — thực ra tổng nguyên 133.268.660/131 = 1.017.318,32 → T9 ghi 1.017.318 là đúng; đã kiểm bằng tổng nguyên trước khi kết luận (§10). (c) lúc đầu `grep -c SPIKE` ra 21 và suýt ghi lệch với claim "15 spike" của T9 — thực ra 15 là số neo đầu dòng `^=== SPIKE` (đúng chuẩn F-153-T9-5 đã sửa); đã kiểm neo trước khi kết luận (§10).

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 153 đứng vững toàn bộ trên boot mới 2c0a7985: đếm khớp lần thứ 38 liên tiếp; suite đầy đủ 28/28 (lấp khoảng trống T10-153 không chạy lại suite); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 11 xác nhận độc lập (quyết parent (j) đợt 153); RAM đỉnh 53,95% guard + min 324.648 kB + balloon 65 đối chiếu từ log gốc; mù #76?/#77? vẫn MỞ theo quyết parent (b); GAP §82 đã đủ đếm cuối. Hai sai lệch ghi nhận (F-154-T1-1 reboot #48, F-154-T1-3 ENOSPC không đếm lại được) đều không đổi verdict đợt 153 — F-154-T1-1 thuộc về đợt 154 (mù mới + kết cục run 153), F-154-T1-3 là giới hạn bằng chứng do journal xoay sau #47/#48. F-154-T1-2 chỉ là sai lệch mô tả (1.069 vs 1.066 file quét), không ảnh hưởng tổng số.
- **Verdict CHẤP NHẬN đợt 153 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 154 (đã có chủ, T1 chỉ nhắc lại + bổ sung từ F-154-T1-1):** mù #76?/#77? MỞ + **mù mới sau reboot #48 (mù #80? ứng viên)** giao T2-154 (quyết (b)); kết cục run 153 thuộc T7-154 — nay kiểm thêm #48 (started_at viết lại lần 2 tại #47 / lần 3 tại #48?; quyết (n) chỉ giao kiểm #47); P3' đã đóng xem xét theo quyết (d) — T4-154 đếm thêm cột distinct-seq + ghi cơ chế vào DEF/GAP; watcher respawn giao T5-154 theo quyết (e) (kiểm tra persistence `~/.config/` + `systemctl --user` trước khi triển khai unit + quy tắc đứng (3)); POSTBOOT_PASS cho boot #48 chưa có — giao T4/T5-154; H3 chỉ giám sát thụ động T8-154 (quyết (k)); headroom 0 + ENOSPC giao T9-154, giữ quyết (g) "chỉ theo dõi" (quyết (h)); G1/R9/ci-security.yml/TTS 39 giữ nguyên theo quyết đứng; GAP §82 header vẫn ghi "chờ quyết parent" — T10-154 cập nhật nhãn khi viết §83.
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 153 + verify 154. Boot `2c0a7985` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 11:46:27Z`). `/tmp/.X11-unix/` lúc đóng có X191/X193/X194/X195 (mtime 11:43Z) — X191 là display sống của T0-154 (Xvfb :191 pid 24084, O8 attempt2 đang chạy) — T1 KHÔNG đụng vào socket nào (các luồng đợt 154 khác đang chạy song song).
- **File LIMITS này:** `docs/PHASE9_ROUND154_T1_VERIFY153_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round154-t1-verify153.txt` (1 entry NUL, od OK). Cờ `round154-t1.done` viết trước khi báo đóng, CÓ NỘI DUNG (không 0 byte).

**Tổng batch đợt 153 (tái kiểm): 10 batch / 13 entry / 13 file duy nhất.**
**Lũy kế 111–153: 418 batch / 818 entry / 695 file.**
**Tổng batch chờ user push (đợt 136–153): 170 batch / 240 entry / 199 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)

---

## Phụ lục A — Số liệu trích từ log gốc (script `round154-t1/appendix-154t1.py`, không gõ tay)

Xem file `hidden_files/round154-t1/appendix-154t1.txt` (113 dòng): A.1 suite 28/28 + cây md5 trước/sau; A.2 đếm cuối; A.3 O8 JSON + waiter; A.4 RAM/balloon/B2; A.5 EPERM probe #72/#73 + blind76 gaps; A.6 T4 poll/tickcost; A.7 T6 lock; A.8 T0 scratch F-153-T0-1; A.9 reboot #48 ứng viên.
