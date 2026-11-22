# LIMITS — Phase 9 đợt 155, T1: Verify độc lập đợt 154

- **Boot:** `12fc68a3` suốt phiên (btime 13:05:12Z — **reboot #49 ĐÃ XÁC NHẬN** theo quyết parent (k) đợt 154, giữa phiên đợt 154; không có reboot mới trong phiên T1 — kiểm lúc mở 14:40:05Z và lúc đóng ~14:55Z, boot_id + btime không đổi).
- **Verdict: PASS — nội dung đợt 154 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới `count-final-155.py` (**lần thứ 40 liên tiếp**); suite chạy lại **28/28 exit 0 trên boot 12fc68a3** (12m29s, 14:41:54–14:54:23Z); `npm test` **12 pass**; O8 xác nhận độc lập bằng JSON/log gốc (chuỗi FULL PASS 11 GIỮ theo quyết parent (g) đợt 154 — xem §3); RAM đỉnh 51,04% guard + min 405.564 kB + balloon 65 đối chiếu từ log gốc khớp T9/T10. **Đính chính mới F-155-T1-1: bước tự kiểm postboot 13:31:06Z của T8 NAY ĐÃ XÁC MINH ĐỘC LẬP ĐƯỢC** (file `selfcheck-postboot-154t8.txt` nằm trong `smoke/`, T10-154 tìm sai thư mục — xem §3, F-154-T10-3 ĐÓNG).
- **Caveat lớn (đọc trước):** quyết parent §12.3 đợt 154 đã viết trực tiếp (đọc kỹ trước khi verify): (a) đợt 154 CHẤP NHẬN; (b) mù #78?/#79?/#80? GIỮ MỞ chưa chứng nhận; (c) phương pháp mốc merged ÁP DỤNG THÀNH CHUẨN ĐỨNG → **#76? ĐÓNG, #77? VẪN MỞ**; (d) verdict run 152 GỠ provisional; (e) watcher hướng (3) làm chuẩn; (f) n (m) = 9 ứng viên; (g) chuỗi O8 GIỮ 11; (h) balloon 1 episode; (i) headroom chỉ theo dõi; (j) birefnet giữ armed; (k) **#49 XÁC NHẬN**; (l) kết cục run 154 thuộc T7-155; (m) cách đóng sổ T10-154 (không chạy lại suite) được chấp nhận cho đợt 154; (n) quy tắc cờ giữ nguyên; (o) H3 chỉ giám sát thụ động; (p) giữ nguyên điều kiện yên. GAP §83 vẫn ghi nhãn cũ ở vài chỗ (xem F-155-T1-3) — T10-155 cập nhật khi viết §84.

## §1. Đếm cuối — KHỚP TỪNG SỐ (script mới `count-final-155.py`, dedup toàn cục)

- **Đợt 154 = 10 batch / 15 entry / 14 file (gồm closing) — KHỚP.**
- **Lũy kế 111–154 = 428 / 833 / 707 — KHỚP.**
- **Chờ push 136–154 = 180 / 255 / 211 — KHỚP.**
- **Tái kiểm 111–153 = 418/818/695 — KHỚP; 111–152 = 408/805/683 — KHỚP; 111–151 = 398/790/670 — KHỚP — lần thứ 40 liên tiếp** (T10-154 ghi lần thứ 39, nay +1).
- **Đợt 154 (trước closing) = 9 / 13 / 13 — KHỚP.** Đợt 153 = 10 / 13 / 13; đợt 152 = 10 / 15 / 15 — KHỚP.
- **Purity: 0 lỗi** (1.076 file paths rounds ≤ 154 quét, NUL-delimited, không newline, không entry rỗng; **0 file round 155 lúc chạy script** — file `phase9-round155-t5-infra.txt` của T5-155 xuất hiện SAU khi script chạy, T10-155 đếm lại). **0 file thiếu trên đĩa** (14/14 file đợt 154 đều tồn tại dưới `~/workspace/repo-1`).
- **Overlap đợt 154 với 111–153: 2 file — KHỚP** (`PHASE9_GAP_ANALYSIS.md` closing §83 + `docs/DEF_v0.5.md` T4 cập nhật §6.4 — trùng có lý do).
- **Số file quét 1.076 KHỚP ĐÚNG claim của T10-154 §10.4** (1.066 rounds ≤153 + 10 file đợt 154 = 1.076) — mẫu sai lệch mô tả F-154-T1-2 (1.069 vs 1.066) KHÔNG lặp lại ở đợt 154 (xem F-155-T1-7).
- GAP §83 đã có đủ đếm cuối đợt 154 (10/15/14; 428/833/707; 180/255/211; tái kiểm 111–153 = 418/818/695) — header §83 vẫn ghi "verdict CHẤP NHẬN — đề xuất, chờ quyết parent" dù quyết parent (a) đã có trong aggregate §12.3 (xem F-155-T1-3).

## §2. Suite chạy lại: 28/28 exit 0 trên boot 12fc68a3

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (14:41:54–14:54:23Z, 12m29s, boot `12fc68a3`, RAMavail lúc mở 656 MB). Script `round155-t1-verify.sh` (adapt từ T1-154, nhãn echo đã đúng "T1-155"). Log `round155-t1-suites.log` (970 dòng — đúng bằng T1-154).
- **`npm test` đầy đủ: 12 pass, 0 fail** — đúng chuẩn đứng (11 mục cũ + probe V19 34 assert PASS). 12 dòng `✅ PASS` trong mục npm-test-full; 0 dòng `❌ FAIL`.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — khớp hồ sơ T10-154 lúc đóng. Cây đã qua 10 boot với cùng md5 preview.tsx (đợt 154: 9 boot; nay + reboot #49).
- **Caveat:** suite chạy trong lúc các luồng đợt 155 khác làm việc song song (T5-155 đã stage paths trong lúc suite chạy; socket X193/X194/X195 trong `/tmp/.X11-unix/` là của luồng khác — T1 không đụng vào). Suite chậm hơn T1-154 (12m29s vs 7m36s) — tải song song + RAMavail lúc mở chỉ 656 MB (T1-154: 1.232 MB); verdict không đổi (28/28 exit 0, 0 rerun). Không file lõi nào đổi giữa phiên mà suite chạm tới — md5 6 file trên không đổi trước/sau suite. **Script verify chỉ ghi exit code từng mục, không ghi thời gian từng mục** (xem F-155-T1-5(d)).

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng) + F-154-T10-3 ĐÓNG

- File gốc `hidden_files/round154-t8/o8-webkit/o8w-clicktest-report-2026-11-20T13-31-35-12fc68a3-pid13016.json` (attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `234996ed`, khối `run` (stamp 13-31-35, bootId 12fc68a3, pid 13016).
- File gốc `.../o8w-clicktest-report-2026-11-20T13-32-41-12fc68a3-pid13484.json` (attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `f9f21198` — **khác md5 attempt1** (không ghi đè).
- File gốc `hidden_files/round154-t8/o8-chromium/o8-clicktest-report-2026-11-20T13-33-38-12fc68a3-pid13930.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `5db202d0`.
- File `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `f9f21198`; Chromium latest = `5db202d0`) — đúng thiết kế "latest" của T0-152.
- Driver log `o8-154t8.log`: `O8 DONE 2026-11-20T13:34:35Z webkit1=0 webkit2=0 chromium=0`, 3 dòng `21/21 pass, 0 fail`, 13:31:33–13:34:35Z, boot 12fc68a3.
- **Gate (chuẩn đứng (i)):** waiter `wait-t4-t5.log` (round154-t8/smoke): poll 19–23 `GATE-NOT-YET t4=0 postboot=1 t4attempt=no-lock`, rồi `WAIT-DEADLINE 13:30Z 20/11 poll=24 13:30:32Z — GATE NOT MET` — **khớp đúng T10-154 §10.2**. O8 chạy theo thủ tục (i) sau waiter hết hạn, **không có lượt yên hợp lệ nào** (T4 0 attempt, 147 poll thật — xem §6). **Chuỗi WebKit FULL PASS GIỮ 11 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả** (quyết parent (g) đợt 154 đã xác nhận phán của T10; nhãn trích giữ nguyên: "O8 3/3 PASS sau waiter hết hạn, KHÔNG có lượt yên hợp lệ nào trong đợt (chuỗi lượt yên dừng ở #21)"). T1 không chạy O8 riêng.
- **F-154-T10-3 ĐÓNG (F-155-T1-1):** bước tự kiểm postboot 13:31:06Z của T8 **CÓ log riêng — T10-154 tìm sai thư mục**. File `hidden_files/round154-t8/smoke/selfcheck-postboot-154t8.txt` ghi đúng từng số trong LIMITS T8: boot 12fc68a3 btime 13:05:12Z; GST 269 file (không symlink); dpkg 1545 dòng (hoạt động cuối 13:11:06Z gstreamer1.0-tools); cache 178 .deb; lists 37; lib đủ 6/6; RAM avail 485 MB, balloon 6.443.824 kB; cờ T4 chưa có lúc kiểm (đúng — T4 đóng cờ 13:35Z, sau bước kiểm); T4 attempt live 0; gate0wait mới nhất `postboot-t4-154-gate0wait-29.log`; kết luận "DU DIEU KIEN chay WebKit". **T1-155 xác minh độc lập bước này từ file gốc — caveat F-154-T10-3 không còn.**

## §4. T0 — F-154-T0-1/F-154-T0-2 đúng ở gốc; scratch JSON khớp

- Scratch `round154-t0/o8-webkit/`: JSON stamped `o8w-clicktest-report-2026-11-20T11-43-20-2c0a7985-attempt1-pid22422.json` — **2 kết quả, 1 ok**: S0 setup mẫu tự load ok=true; **S1 tắt auto-proxy trước khi import ok=false** — khớp chữ ký F-154-T0-1 (S1 FAIL toggle rect, Target crashed S2-import, EXIT=2). File attempt2 `...T11-43-56-2c0a7985-attempt2-pid23870.json` — **0 kết quả** — khớp F-154-T0-2 (timeout chờ mẫu tự load). File `latest` WebKit = attempt2 (0 kết quả) — đúng thiết kế.
- **Kết luận:** T0 kiểm chứng cơ chế O8 JSON còn đúng và ghi đúng chữ ký kẹt mới; đây KHÔNG phải lượt O8 chính thức (T8 phán chuỗi — xem §3).

## §5. T2 — Probe #73 + mù #78?/#79?/#80? + thí nghiệm mốc merged: đứng theo hồ sơ + quyết parent (b)/(c)

- **Probe EPERM #73: log `eperm-probe-v2.log` (shared) đúng 211 dòng tại lúc T2-154 đóng** (dòng cuối `probe#73 boot=2c0a7985 tmp+ws ok=2 fail=0` 11:38:16Z). **Log nay 214 dòng — KHÔNG phải lệch:** 3 dòng mới là probe #74 của T2-155 (DEAD #73 14:43:07Z + boot-changed 2c0a7985 → 12fc68a3 + `probe#74 boot=12fc68a3 tmp+ws ok=2 fail=0` 14:43:07Z) — đúng mẫu +3, trên boot #49 đã xác nhận. EPERM 0 sóng thật; sóng thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Mù #78?/#79?/#80? ĐÓNG theo luật gap:** đối chiếu `blind78-merged.log` — P max gap **117 s** / Q **1.129 s** / R **482 s** / S **571 s**, floor 1.147 s, max hidden = 0 — khớp từng số aggregate §3. **Quyết parent (b) đợt 154: GIỮ MỞ, chưa chứng nhận** (chứng nhận theo thứ tự — #74?/#75?/#76?/#77? còn mở phía trước); CERT/FULL chính thức GIỮ 73/88; ứng viên CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95 có điều kiện. Chuỗi đóng hoàn toàn GIỮ 9.
- **Thí nghiệm mốc merged — quyết parent (c) đợt 154: ÁP DỤNG THÀNH CHUẨN ĐỨNG.** L+M ĐÓNG (60/81 s), N MỞ (1.308 s) — hệ quả: **#76? ĐÓNG** (đảo đóng riêng, chuỗi đóng hoàn toàn GIỮ 9 vì #74?/#75? còn mở phía trước), **#77? VẪN MỞ**. T1 chỉ đối chiếu hồ sơ T2 (file `blind76-gaps.txt` nằm ở `round153-t2/` — L 1.252 s / M 1.236 s / N 1.319 s, floor 1.147 s, max hidden = 1 — khớp T1-154 §5; không nằm ở `round154-t2/`), không đạo lại merged gap. Giao T2-155 áp dụng chuẩn mới cho mù #81? (đi kèm #49).
- T1 không đạo lại phân tích sessions/hole-recheck/INSIDE/WFS chi tiết (phạm vi T2; file bằng chứng đầy đủ trên đĩa).

## §6. T4 — Lượt yên #23: 147 poll thật, 0 attempt — đếm lại từ log gốc khớp (bẫy đếm mới)

- `poll-t4.log`: **158 dòng** = 1 header run 1 + **117 poll thật boot 2c0a7985 (#1–#117)** + 1 dòng restart + 1 header run 2 + **30 poll thật boot 12fc68a3 (#1–#30)** + 2 dòng footer. **Tổng poll thật 147 — KHỚP** aggregate §4. Dòng cuối: `HET HAN CHO 13:30Z 20/11 — 0 attempt — dong theo brief dot 154 (han co ~14:00Z)`.
- **Bẫy đếm (F-155-T1-2):** `grep -c '^poll #'` thô ra **153**, không phải 147 — 6 dòng thừa là dòng chú thích snapshot blockers (poll #9–#14, `blockers=4`, KHÔNG có trường `boot=`) chèn sau poll tương ứng, không phải poll riêng. Đếm đúng phải lọc dòng có `boot=` (cùng họ bẫy với F-154-T1-5 đếm spike). Claim "147 poll thật" của T4 đứng vững sau khi lọc đúng.
- **Attempt: 0** — 4 lần nhắc "attempt" trong log đều là "ngân sách attempt 0/3" / "0 attempt", không có attempt nào chạy. Chuỗi lượt yên hợp lệ DỪNG Ở #21 — **quyết parent (p) đợt 154: GIỮ NGUYÊN điều kiện yên, chờ lượt sau** (T4-155 thử lại cùng điều kiện).
- P3' 39/41 (39/40 distinct-seq) — đứng theo hồ sơ T4; DEF_v0.5 §6.4 + GAP §82 đã ghi cơ chế "catch-up lag sau đóng băng" theo quyết parent (d)(i) đợt 153.

## §7. T5 — POSTBOOT_PASS #48 có trên đĩa; watcher respawn theo quyết parent (e)

- **POSTBOOT_PASS cho boot #48 CÓ — đã xác minh:** `hidden_files/round154-t5/POSTBOOT_PASS` (324 B, mtime 11:58:26Z, boot 2c0a7985, btime 11:26:05Z, dpkg 795 dòng, cache 110, lists 66, poll1 exit 0) + bản cũ `POSTBOOT_PASS-18e179e0` lưu riêng. Khớp claim T5-154. POSTBOOT_PASS cho boot #49 (12fc68a3) thuộc T5-155 (T8-154 tự kiểm postboot 13:31:06Z đã xác minh ở §3, không phải POSTBOOT_PASS chính thức).
- Watcher respawn: **quyết parent (e) đợt 154: CHẤP NHẬN (3) LÀM HƯỚNG ĐỨNG** — phương án (1) CHẾT, (2) KHÔNG CÓ CRON; quy tắc đứng "T0 kiểm tra watcher lúc mở" là bảo hiểm duy nhất; unit + script tại `round154-t5/` GIỮ LẠI cho cell khác. T1 không kiểm lại apt/dpkg internals (phạm vi T5).

## §8. T6 — Lock khỏe lúc đóng; (A) còn nguyên theo hồ sơ

- **Chạy lại script của chính T6 trên log đóng băng:** `analyze-log.py` trên `vite-lock-v2-cleaned-close.log` (1.498 dòng) cho đúng số T6: **pairs ACQUIRED→RELEASED = 426, still held 0, double-acquire 9 (đều là ca cũ, mới nhất 03:40:03Z đợt 151), RELEASED without prior ACQUIRED 0** — tái hiện chính xác, không cộng tay. TOTAL: ACQUIRED=435, RELEASED=426. Log đóng cuối 11:04:11Z t8-round153 (trước giờ T6 đóng ~11:50Z; không có hoạt động lock nào giữa 11:04–11:50Z — T0/T1/T4 không dùng vite lock).
- **Prune lần 29:** queue 101 → 100 theo claim; lúc T10 đóng 101 do T8 thêm 1 cooldown sau prune — T1 không đếm lại queue lúc đóng (đã qua reboot #49 sau đó; giao T6-155 kiểm lại lúc mở đợt 155, nợ §11.11 aggregate 154).
- (A) còn nguyên + 120/120 PASS dưới churn, chuỗi xanh kép 3 → 4: đứng theo hồ sơ T6 + quyết parent (a) đợt 154 — T1 không chạy lại 120 lần kiểm chứng churn (phạm vi T6).

## §9. T8 — Harness 6/6, 0 kẹt: xác nhận từ log summary gốc

- `smoke/run-webkit-summary.txt`: `=== ALL DONE Fri Nov 20 13:51:00 UTC 2026 ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0 ===` — **harness 6/6 PASS một lần chạy, 0 kẹt**. Khớp aggregate §8. Chuỗi "P3 không kẹt" 0 → 1 — **quyết parent (o) đợt 154: H3 VẪN MỞ, chỉ giám sát thụ động — GIỮ NGUYÊN**.
- Chromium 85m4 P5 "CÓ-RESTART (+2)" do ended-at-duration, KHÔNG FAIL (ok=true) — khớp aggregate §8. T8 đóng cờ 13:57Z (1.918 B, có nội dung), trong hạn cờ ~14:00Z.
- T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — RAM đỉnh/min + balloon 65: đếm lại từ log gốc khớp; headroom 0 + ENOSPC có caveat

- `ram-sampler.log`: **125 dòng** — khớp 125 mẫu. Chạy `awk` trực tiếp trên cột `mem=`: **max avail 3.211.344 kB lúc 11:43:41Z = 51,04% guard 6.291.456 kB; min avail 405.564 kB lúc 12:11:41Z; mean 844.524 kB** (tổng nguyên 105.565.548 / 125) — khớp đúng số T9/T10.
- **Balloon ghim trần 65/125 mẫu:** đếm dòng `bal=6443824` = **65 dòng** — khớp. **0/125 mẫu ≥ guard** — birefnet 0 thử lần thứ 8 liên tiếp ✓ (quyết parent (j) đợt 154: GIỮ NGUYÊN cơ chế (a) armed).
- **B2: 50 spike** — `grep -c '^=== SPIKE' b2-spikes.log` = **50** (đếm đúng neo đầu dòng; `grep -c SPIKE` thô sẽ lệch — cùng bẫy F-154-T1-5). T1 không attribution từng spike (phạm vi T9).
- **Headroom 0 → 0 — ĐỨNG THEO BẢNG, KHÔNG CÓ STDOUT PROBE THÔ (F-152-T1-5 kéo dài):** T9 LIMITS §1.2 ghi mở 0/0 (boot #48) và đóng 0/0/0 (boot #49); bảng watch đầy hẳn 63.747/63.747 cả phiên. Quyết parent (i) đợt 154: GIỮ quyết (g) "chỉ theo dõi". T1 KHÔNG đo lại headroom (số đo cùng thời điểm không tái tạo được).
- **ENOSPC ≥90 dòng — KHÔNG ĐẾM LẠI ĐƯỢC NỮA (cùng mẫu F-154-T1-3):** journal volatile, chỉ giữ 1 boot; sau reboot #49 journal chỉ còn boot 12fc68a3. T9-154 đã đếm ≥74 dòng boot #48 + 16 dòng boot #49 lúc đóng. Số ≥90 dòng đứng trên hồ sơ T9 (đếm lúc đóng, ghi rõ phương pháp + cùng thông điệp service). Không đổi verdict.

## §11. Sai lệch phát hiện (F-155-T1-N — kể cả nhỏ)

- **F-155-T1-1 — F-154-T10-3 ĐÓNG: bước tự kiểm postboot 13:31:06Z của T8 CÓ log riêng, T10-154 tìm sai thư mục.** File `hidden_files/round154-t8/smoke/selfcheck-postboot-154t8.txt` (T10 chỉ tìm trong `round154-t8/` gốc) ghi đúng từng số LIMITS T8: GST 269, dpkg 1545, cache 178, lists 37, lib 6/6, boot 12fc68a3, btime 13:05:12Z, cờ T4 chưa có lúc kiểm, T4 attempt live 0, gate0wait `postboot-t4-154-gate0wait-29.log`, kết luận "DU DIEU KIEN chay WebKit". **T1-155 đã xác minh độc lập từ file gốc — caveat này không còn.** Hệ quả: GAP §83 (dòng T8) vẫn ghi "T10 chưa xác minh độc lập" — nhãn cũ, T10-155 cập nhật khi viết §84 (xem F-155-T1-3).
- **F-155-T1-2 — Bẫy đếm poll T4 (không phải lỗi của T4):** `grep -c '^poll #'` thô trên `poll-t4.log` ra 153, lệch +6 so với claim 147 của T4. 6 dòng thừa là chú thích snapshot blockers (poll #9–#14, `blockers=4`, không có trường `boot=`). Đếm đúng (lọc dòng có `boot=`): 117 poll boot #48 (#1–#117) + 30 poll boot #49 (#1–#30) = **147 — claim T4 đứng**. Cùng họ bẫy với F-154-T1-5 (đếm spike phải neo đầu dòng). Ghi lại để T1 sau không đếm nhầm.
- **F-155-T1-3 — Nhãn cũ trong GAP §83 (T10-155 cập nhật khi viết §84, không phải lỗi đếm):** (a) header §83 vẫn ghi "verdict CHẤP NHẬN — đề xuất, chờ quyết parent §12.3 aggregate 154" dù quyết parent (a) CHẤP NHẬN đã có trong aggregate §12.3 (cùng mẫu §82 mà T1-154 đã nhắc); (b) §83 vẫn gọi reboot #49 là "ỨNG VIÊN" dù quyết parent (k) đã XÁC NHẬN số hiệu #49; (c) §83 (dòng T2) vẫn ghi phương pháp mốc merged "chuẩn đứng KHÔNG đổi" dù quyết parent (c) đã ÁP DỤNG thành chuẩn đứng, hệ quả #76? ĐÓNG; (d) §83 (dòng T8) vẫn ghi postboot T8 "T10 chưa xác minh độc lập" — nay đã xác minh (F-155-T1-1). T1 không sửa GAP (thuộc closing của T10).
- **F-155-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-154-T1-4).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness/waiter (đếm lại từ file gốc). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, INSIDE, WFS), T7 (scheduler DB, HB/DR, run 152/153 chi tiết), T5 (apt/dpkg internals), T9 (attribution từng spike, balloon episode, chuỗi headroom dài hạn), T6 (120 lần kiểm soát churn), T0 (bench chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. Kết cục run 154 thuộc T7-155 (quyết parent (l) đợt 154).
- **F-155-T1-5 — Sai số của chính T1-155 (ghi trung thực):** (a) lần adapt đầu script đếm bằng sed cho số vòng sai (đợt 153/154 lẫn) — đã bỏ, viết mới hoàn toàn `count-final-155.py`; file đếm trên đĩa là từ script mới. (b) script phụ lục bản đầu lỗi format str/int ở dòng đếm B2 — đã sửa, chạy lại; file phụ lục trên đĩa là bản từ script đã sửa. (c) lần đếm poll đầu bằng `awk` dùng ternary trong chỉ số mảng nên tách boot sai (36 thay vì 30 poll boot #49) — đã đếm lại bằng lọc `boot=` tường minh trước khi kết luận (§6). (d) script verify bản đầu bị sed làm lệch comment header (ghi "đợt 154: 2c0a7985") — đã sửa header trước khi chạy suite; chỉ là nhãn, không ảnh hưởng số đo. (e) script verify chỉ ghi exit code từng mục, không ghi thời gian từng mục — brief yêu cầu "exit code + thời gian từng mục"; chỉ có tổng thời gian suite 12m29s + mốc bắt đầu/kết thúc (§2). T1 sau nên thêm timestamp từng mục vào script verify.
- **F-155-T1-6 — Log EPERM probe nay 214 dòng (không phải lệch):** lúc T2-154 đóng là 211 dòng; 3 dòng mới là probe #74 của T2-155 (DEAD #73 + boot-changed 2c0a7985 → 12fc68a3 + `probe#74 boot=12fc68a3 ok=2 fail=0` 14:43:07Z) — đúng mẫu +3. Dòng probe #73 còn nguyên.
- **F-155-T1-7 — Số file quét 1.076 của T10-154 KHỚP ĐÚNG (không lặp mẫu F-154-T1-2):** script T1-155 quét đúng 1.076 file paths rounds ≤154 (1.066 rounds ≤153 + 10 file đợt 154). Con số 1.069 trong aggregate 153 là sai lệch mô tả riêng của T10-153, không phải lỗi hệ thống của phương pháp đếm.

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 154 đứng vững toàn bộ trên boot 12fc68a3: đếm khớp lần thứ 40 liên tiếp; suite đầy đủ 28/28 (12m29s); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 11 xác nhận độc lập (quyết parent (g) đợt 154); RAM đỉnh 51,04% guard + min 405.564 kB + balloon 65 đối chiếu từ log gốc; mù #78?/#79?/#80? vẫn GIỮ MỞ theo quyết parent (b) (chưa chứng nhận); GAP §83 đã đủ đếm cuối; **F-154-T10-3 ĐÓNG** (postboot T8 nay đã xác minh độc lập). Hai bẫy đếm ghi nhận (F-155-T1-2 poll, F-154-T1-5 spike) đều không đổi verdict đợt 154 — claim T4 (147 poll) và T9 (50 spike) đều đứng sau khi đếm đúng.
- **Verdict CHẤP NHẬN đợt 154 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 155 (đã có chủ, T1 chỉ nhắc lại + bổ sung từ F-155-T1-1/3):** mù #74?/#75?/#77? MỞ + mù #81? (đi kèm #49 đã xác nhận) giao T2-155 — áp dụng chuẩn merged mới (quyết (c)); kết cục run 154 thuộc T7-155 (quyết (l)); P3' đã đóng xem xét — T4-155 thử lại cùng điều kiện yên (quyết (p)); watcher respawn theo hướng (3) làm chuẩn (quyết (e)); POSTBOOT_PASS cho boot #49 giao T4/T5-155; H3 chỉ giám sát thụ động T8-155 (quyết (o)); headroom 0 + ENOSPC giao T9-155, giữ quyết (g) "chỉ theo dõi" (quyết (i)); G1/R9/ci-security.yml/TTS 39 giữ nguyên theo quyết đứng; GAP §83 nhãn cũ — T10-155 cập nhật khi viết §84 (F-155-T1-3).
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 154 + verify 155. Boot `12fc68a3` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 14:54:23Z`). `/tmp/.X11-unix/` lúc đóng có X193/X194/X195 — socket của các luồng đợt 155 khác đang chạy song song, T1 KHÔNG đụng vào.
- **File LIMITS này:** `docs/PHASE9_ROUND155_T1_VERIFY154_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round155-t1-verify154.txt` (1 entry NUL, od OK). Cờ `round155-t1.done` viết trước khi báo đóng, CÓ NỘI DUNG (không 0 byte).

**Tổng batch đợt 154 (tái kiểm): 10 batch / 15 entry / 14 file duy nhất.**
**Lũy kế 111–154: 428 batch / 833 entry / 707 file.**
**Tổng batch chờ user push (đợt 136–154): 180 batch / 255 entry / 211 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)

---

## Phụ lục A — Số liệu trích từ log gốc (script `round155-t1/appendix-155t1.py`, không gõ tay)

Xem file `hidden_files/round155-t1/appendix-155t1.txt` (102 dòng): A.1 suite 28/28 + cây md5; A.2 đếm cuối; A.3 O8 JSON + waiter + selfcheck postboot; A.4 RAM/balloon/B2; A.5 EPERM probe #73/#74; A.6 T4 poll (147 poll thật + 6 dòng chú thích); A.7 T6 lock; A.8 T0 scratch F-154-T0-1/F-154-T0-2; A.9 cờ .done đợt 154.
