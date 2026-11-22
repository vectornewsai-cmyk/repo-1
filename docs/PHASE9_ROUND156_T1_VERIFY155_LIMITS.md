# LIMITS — Phase 9 đợt 156, T1: Verify độc lập đợt 155

- **Boot:** `5353ed19` suốt phiên (btime 17:19:09Z — **reboot #52 ỨNG VIÊN lúc mở** theo T0-156; T1 kiểm lúc mở 17:38:49Z và lúc đóng ~17:58Z, boot_id + btime không đổi, KHÔNG reboot mới trong phiên T1).
- **Verdict: PASS — nội dung đợt 155 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới `count-final-156.py` (**lần thứ 42 liên tiếp**); suite chạy lại **28/28 exit 0 trên boot 5353ed19** (11m31s, 17:40:19–17:51:50Z); `npm test` **12 pass**; O8 xác nhận độc lập bằng JSON/log gốc (chuỗi FULL PASS 11 GIỮ theo quyết parent (f) đợt 155 — xem §3); RAM đỉnh 44,17% guard + min 505.888 kB + balloon 46 đối chiếu từ log gốc khớp T9/T10; **9/9 cờ đợt 155 còn trên đĩa, đều có nội dung** (kích thước khớp đúng §10.1 aggregate 155).
- **Caveat lớn (đọc trước):** quyết parent §12.3 đợt 155 đã viết trực tiếp (đọc kỹ trước khi verify): (a) đợt 155 CHẤP NHẬN; (b) mù #81? GIỮ MỞ chưa chứng nhận; (c) #74?/#75? CHẤP NHẬN ĐÓNG theo chuẩn mốc merged → **CERT76/FULL91 thành số chính thức** (lần đầu tăng kể từ đợt 151), chuỗi đóng hoàn toàn 9 → 12, phạm vi hồi tố áp dụng cho mọi đoạn; (d) **#50 + #51 XÁC NHẬN**; (e) n (m) = 10 ứng viên, dải 33–49,8 s, điều tra (m) vẫn đóng; (f) **chuỗi O8 GIỮ 11** (xác nhận phán T10); (g) balloon 1 episode; (h) headroom chỉ theo dõi, ENOSPC chính thức ≥133; (i) birefnet giữ armed; (j) giữ nguyên điều kiện yên; (k) kết cục run 155 thuộc T7-156; (l) **DUYỆT quy tắc đứng mới cho T8** (kiểm/rebuild fixture trước harness lần 1 khi có reboot giữa phiên); (m) F-154-T10-3 ĐÓNG + GAP §83 đã sửa; (n) cách đóng sổ T10-155 (không chạy lại suite) được chấp nhận cho đợt 155; (o) quy tắc cờ giữ nguyên; (p) H3 chỉ giám sát thụ động; (q) POSTBOOT_PASS #50 + watcher khởi động lại tay — GHI NHẬN; (r) ENOSPC ≥133 làm số chính thức với caveat journal xoay. GAP §84 vẫn ghi nhãn cũ ở vài chỗ (xem F-156-T1-1) — T10-156 cập nhật khi viết §85.

## §1. Đếm cuối — KHỚP TỪNG SỐ (script mới `count-final-156.py`, dedup toàn cục)

- **Đợt 155 = 10 batch / 13 entry / 13 file (gồm closing) — KHỚP.**
- **Lũy kế 111–155 = 438 / 846 / 719 — KHỚP.**
- **Chờ push 136–155 = 190 / 268 / 223 — KHỚP.**
- **Tái kiểm 111–154 = 428/833/707 — KHỚP; 111–153 = 418/818/695 — KHỚP; 111–152 = 408/805/683 — KHỚP — lần thứ 42 liên tiếp** (T10-155 ghi lần thứ 41, nay +1).
- **Đợt 155 (trước closing) = 9 / 11 / 11 — KHỚP.** Đợt 154 = 10 / 15 / 14; đợt 153 = 10 / 13 / 13 — KHỚP.
- **Purity: 0 lỗi** (1.086 file paths rounds ≤ 155 quét, NUL-delimited, không newline, không entry rỗng — 1.085 trước closing + closing = khớp T10-155 §10.4). **0 file thiếu trên đĩa** (13/13 file đợt 155 đều tồn tại dưới `~/workspace/repo-1`).
- **Overlap đợt 155 với 111–154: 1 file — KHỚP** (`PHASE9_GAP_ANALYSIS.md` closing §84 — trùng có lý do, cập nhật hồ sơ chung).
- GAP §84 đã có đủ đếm cuối đợt 155 (10/13/13; 438/846/719; 190/268/223; tái kiểm 111–154 = 428/833/707) — nhưng header §84 vẫn ghi nhãn cũ (xem F-156-T1-1).

## §2. Suite chạy lại: 28/28 exit 0 trên boot 5353ed19

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (17:40:19–17:51:50Z, 11m31s, boot `5353ed19`, RAMavail lúc mở 1.342 MB). Script `round156-t1-verify.sh` (viết mới cho T1-156; `run()` nay ghi thời gian bắt đầu/kết thúc từng mục — khắc phục F-155-T1-5(e)). Log `round156-t1-suites.log` (970 dòng — đúng bằng T1-155).
- **`npm test` đầy đủ: 12 pass, 0 fail** — 12 dòng `✅ PASS` trong mục npm-test-full; 0 dòng `❌ FAIL`.
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — khớp hồ sơ T10-155 lúc đóng. Cây đã qua 11 boot với cùng md5 preview.tsx (đợt 155: 10 boot; nay + reboot #52 ứng viên).
- **Caveat:** suite nhanh hơn T1-155 (11m31s vs 12m29s) — RAMavail lúc mở cao hơn (1.342 MB vs 656 MB) + ít tải song song hơn. Các luồng đợt 156 khác chạy song song (T0-156 đang chạy O8 lúc suite chạy — subtree clicktest pid 4573 của T0, T1 KHÔNG đụng vào; xem F-156-T1-4(d)). Không file lõi nào đổi giữa phiên mà suite chạm tới — md5 6 file trên không đổi trước/sau suite. 0 process suite nào của T1 còn sống lúc đóng (`VERIFY DONE 17:51:50Z`).

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng) + chuỗi GIỮ 11

- File gốc `hidden_files/round155-t8/o8-webkit/o8w-clicktest-report-2026-11-20T16-31-33-d849728b-pid29377.json` (attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `a10a1004`, khối `run` (stamp 16-31-33, bootId d849728b, pid 29377).
- File gốc `.../o8w-clicktest-report-2026-11-20T16-32-37-d849728b-pid29891.json` (attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `1b9b09aa` — **khác md5 attempt1** (không ghi đè).
- File gốc `hidden_files/round155-t8/o8-chromium/o8-clicktest-report-2026-11-20T16-33-32-d849728b-pid30295.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `f448ffd1`.
- File `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `1b9b09aa`; Chromium latest = `f448ffd1`) — đúng thiết kế "latest" của T0-152.
- Driver log `o8-155t8.log`: `O8 DONE 2026-11-20T16:34:28Z webkit1=0 webkit2=0 chromium=0`, 3 dòng `21/21 pass, 0 fail`, 16:31:33–16:34:28Z, boot d849728b.
- **Gate (thủ tục (i)):** waiter `wait-t4-t5.log` (round155-t8/smoke): 84 dòng `GATE-NOT-YET`, rồi `WAIT-DEADLINE 16:30Z 20/11 poll=85 16:30:26Z — GATE NOT MET` — **khớp đúng T10-155 §10.2**. O8 chạy theo thủ tục (i) sau waiter hết hạn, **không có lượt yên hợp lệ nào** (T4 0 attempt hợp lệ, 123 poll thật — xem §6). **Chuỗi WebKit FULL PASS GIỮ 11 — ĐÃ XÁC NHẬN ĐỘC LẬP về mặt kết quả** (quyết parent (f) đợt 155 đã xác nhận phán của T10; nhãn trích giữ nguyên: "O8 3/3 PASS sau waiter hết hạn, KHÔNG có lượt yên hợp lệ nào trong đợt (chuỗi lượt yên dừng ở #21)"). T1 không chạy O8 riêng.
- **Bước tự kiểm postboot của T8 CÓ log riêng — T10-155 xác minh độc lập, T1-156 xác nhận lại từ file gốc:** `hidden_files/round155-t8/smoke/selfcheck-postboot-155t8.txt` ghi đúng từng số LIMITS T8 (boot d849728b btime 15:04:07Z; dpkg 795; cache 110; lists 75; lib đủ 6/6; RAM avail 667 MB; balloon 6.247.216 kB = 97,0% trần; T4 0 attempt; kết luận "DU DIEU KIEN chay O8 + harness theo thu tuc (i)"). Không có F-155-T10-3 mới.

## §4. T0 — Scratch JSON khớp claim kiểm chứng cơ chế

- Scratch `round155-t0/o8-webkit/`: JSON stamped attempt1 `...T14-48-44-12fc68a3-attempt1-pid44197.json` — **21 kết quả, 21 ok**; attempt2 `...T14-50-10-12fc68a3-attempt2-pid46086.json` — **21 kết quả, 21 ok** — khớp claim T0-155 (O8 WebKit kiểm chứng PASS 21/21 ×2, lần đầu T0 tự kiểm PASS). Đây KHÔNG phải lượt O8 chính thức (T8 phán chuỗi — xem §3).

## §5. T2 — Probe #74 đứng + probe #75 (đợt 156) xác nhận độc lập boot #52 ứng viên

- **Probe EPERM #74: log `eperm-probe-v2.log` đúng 214 dòng tại lúc T2-155 đóng** (dòng probe #74 ở dòng 214: `probe#74 boot=12fc68a3 tmp+ws ok=2 fail=0` 14:43:07Z; dòng probe #73 ở dòng 211 còn nguyên). **Log nay 217 dòng — KHÔNG phải lệch:** 3 dòng mới là probe #75 của T2-156 (DEAD #74 17:40:03Z + boot-changed 12fc68a3 → 5353ed19 + `probe#75 boot=5353ed19 tmp+ws ok=2 fail=0` 17:40:03Z) — đúng mẫu +3, trên boot #52 ứng viên. EPERM 0 sóng thật; sóng thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Probe #75 xác nhận độc lập boot lúc mở của T1:** probe tự phát hiện boot-changed sang 5353ed19 (btime 17:19:09Z) — khớp boot_id T1 đọc lúc mở. Heartbeat `eperm-probe-v2.heartbeat`: pid 3849, ts 17:40:03Z, boot 5353ed19, n=75.
- T1 không đạo lại phân tích merged-gap/sessions/hole-recheck/INSIDE/WFS chi tiết của T2 (phạm vi T2; xem F-156-T1-3). Quyết parent (c) đợt 155 đã chấp nhận #74?/#75? ĐÓNG theo chuẩn merged — CERT/FULL chính thức nay là **76/91**.

## §6. T4 — Lượt yên #24: 123 poll thật — đếm lại từ log gốc khớp (bẫy đếm mới)

- `poll-t4.log`: **137 dòng** = 3 header `== poll-wait start` (có `boot=`) + **121 poll thật có `boot=`** (16 boot 12fc68a3 + 105 boot d849728b) + 2 dòng chú thích snapshot blockers (poll #1/#2, KHÔNG có `boot=`) + 8 dòng `==`/footer + 3 dòng trạng thái (CUA YEN MO / RETRY / HET HAN). **Tổng poll thật 123 = 121 trong poll-t4.log + 2 poll test-log** (`poll-test-155.log`: poll #1 14:42:54Z + poll #2 14:48:24Z) — **KHỚP** aggregate §4 (2 test-log + 16 + 6 + 99 = 123).
- **Bẫy đếm mới (F-156-T1-2):** `grep -c '^poll #'` thô ra **123 — trùng đúng tổng thật nhưng SAI LÝ DO** (121 poll thật + 2 dòng chú thích snapshot; 2 poll test-log nằm ở file khác, không được đếm). `grep -c 'boot='` thô ra **124** (121 poll thật + 3 header start). Đếm đúng phải lọc `^poll #` CÓ `boot=` rồi cộng test-log. Claim "123 poll thật" của T4 đứng vững sau khi lọc đúng.
- **Attempt: 0 hợp lệ** — attempt1 20/20 nhưng lớp B vi phạm (nhiễm tải); attempt2 20/20 nhưng bị #50 giết; dòng cuối `HET HAN CHO 16:30Z 20/11 — 0 attempt`. Chuỗi lượt yên hợp lệ DỪNG Ở #21 — **quyết parent (j) đợt 155: GIỮ NGUYÊN điều kiện yên, chờ lượt sau** (T4-156 thử lại cùng điều kiện).
- P3' 39/41 (39/40 distinct-seq) — đứng theo hồ sơ T4; T1 không đạo lại distinct-seq (phạm vi T4).

## §7. T5 — POSTBOOT_PASS #49/#50 có trên đĩa; watcher respawn theo quyết parent (q)

- **POSTBOOT_PASS cho boot #50 CÓ — đã xác minh:** `hidden_files/round155-t5/POSTBOOT_PASS` (324 B, mtime 15:25:50Z, boot d849728b, btime 15:04:07Z, dpkg 795 dòng, cache 110, lists 75, repair-sớm-quyết-h, poll=1 exit 0). Bản cũ `POSTBOOT_PASS-12fc68a3` (315 B, 14:42Z) lưu riêng. Khớp claim T5-155 + quyết parent (q) đợt 155 (GHI NHẬN).
- Watcher respawn: **quyết parent (q) đợt 155: hướng (3) vẫn đứng** — watcher-155 pid 7433 đã chết theo #51; T0-156 kiểm tra lúc mở + T5-156 khởi động lại bằng tay; POSTBOOT_PASS #51 chưa có — giao T5-156. T1 không kiểm lại apt/dpkg internals (phạm vi T5).

## §8. T6 — Lock khỏe lúc đóng; (A) còn nguyên theo hồ sơ

- **Chạy lại script của chính T6 trên log đóng băng:** `analyze-log.py` trên `vite-lock-v2-cleaned-close.log` cho đúng số T6: **pairs ACQUIRED→RELEASED = 434, still held 0, RELEASED without prior ACQUIRED 0** — tái hiện chính xác, không cộng tay. TOTAL: ACQUIRED=443, RELEASED=434. Log đóng cuối 14:47:40Z t4 RELEASED (trước giờ T6 đóng ~15:00Z).
- **Prune lần 30:** queue 101 lúc T10 đóng (100 sau prune + cooldown-t8-round155) — T1 đếm queue lúc mở đợt 156 là **101 file, khớp T10**; lúc ~17:56Z queue còn **100 file** (cooldown-t8-round155 vẫn còn) — thay đổi trong phiên T1, nhiều khả năng do **prune lần 31 của T6-156 đang chạy** (thư mục `round156-t6/` đã xuất hiện) — xem F-156-T1-5. Không phải lệch của đợt 155.
- (A) còn nguyên + 120/120 PASS dưới churn, chuỗi xanh kép 4 → 5: đứng theo hồ sơ T6 + quyết parent (a) đợt 155 — T1 không chạy lại 120 lần kiểm chứng churn (phạm vi T6).

## §9. T8 — Harness 6/6, 0 kẹt: xác nhận từ log summary gốc

- `smoke/run-webkit-summary.txt`: `=== ALL DONE Fri Nov 20 16:54:37 UTC 2026 ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0 ===` — **harness lần 2 6/6 PASS, 0 kẹt**. Khớp aggregate §8. Chuỗi "P3 không kẹt" 1 → 2 — **quyết parent (p) đợt 155: H3 VẪN MỞ, chỉ giám sát thụ động — GIỮ NGUYÊN**.
- Harness lần 1 0/6 do thiếu fixture KHÔNG đếm vào chuỗi (quyết parent (l) đợt 155 đã DUYỆT quy tắc đứng mới cho T8-156: kiểm/rebuild fixture trước harness lần 1 khi có reboot giữa phiên).
- T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — RAM đỉnh/min + balloon 46: đếm lại từ log gốc khớp; headroom 0 + ENOSPC có caveat

- `ram-sampler.log`: **112 dòng** — khớp 112 mẫu. Chạy `awk` trực tiếp trên cột `mem=`: **max avail 2.779.068 kB lúc 15:10:43Z = 44,17% guard; min avail 505.888 kB lúc 15:32:43Z; mean 896.059 kB** — khớp đúng số T9/T10. (Phụ lục tính mean bằng chia nguyên 896.058 — chỉ là làm tròn, xem F-156-T1-4(c).)
- **Balloon ghim trần 46/112 mẫu:** đếm dòng `bal=6443824` = **46 dòng** — khớp. **0/112 mẫu ≥ guard** — birefnet 0 thử lần thứ 9 liên tiếp ✓ (quyết parent (i) đợt 155: GIỮ NGUYÊN cơ chế (a) armed).
- **B2: 20 spike** — `grep -c '^=== SPIKE' b2-spikes.log` = **20** (đếm đúng neo đầu dòng; `grep -c SPIKE` thô sẽ lệch — cùng bẫy F-154-T1-5). T1 không attribution từng spike (phạm vi T9).
- **Headroom 0 → 0 — ĐỨNG THEO BẢNG, KHÔNG ĐO LẠI:** T9 LIMITS §1.2 ghi mở 0/0 (boot #49) và đóng 0/0/0 (boot #50); bảng watch đầy hẳn 63.747/63.747 cả phiên. Quyết parent (h) đợt 155: GIỮ quyết (g) "chỉ theo dõi". T1 KHÔNG đo lại headroom (số đo cùng thời điểm không tái tạo được).
- **ENOSPC ≥133 dòng — KHÔNG ĐẾM LẠI ĐƯỢC NỮA (cùng mẫu F-154-T1-3 / F-155-T10-1):** journal volatile, chỉ giữ 1 boot; sau reboot #51/#52 journal chỉ còn boot hiện tại. Số ≥133 dòng đứng trên hồ sơ T9 (đếm lúc đóng, ghi rõ phương pháp + cùng thông điệp service) + quyết parent (r) đợt 155 đã chấp nhận làm số chính thức. Không đổi verdict.

## §11. Sai lệch phát hiện (F-156-T1-N — kể cả nhỏ)

- **F-156-T1-1 — Nhãn cũ trong GAP §84 (T10-156 cập nhật khi viết §85, không phải lỗi đếm — cùng mẫu F-155-T1-3):** (a) header §84 vẫn ghi "verdict CHẤP NHẬN — đề xuất, chờ quyết parent §12.3 aggregate 155" dù quyết parent (a) CHẤP NHẬN đã có trong aggregate §12.3; (b) §84 (dòng T2) vẫn ghi "CERT/FULL chính thức GIỮ 73/88" dù quyết parent (c) đã chấp nhận #74?/#75? ĐÓNG → CERT/FULL chính thức nay là **76/91**; (c) §84 vẫn gọi reboot #50/#51 là "ỨNG VIÊN" dù quyết parent (d) đã XÁC NHẬN cả hai số hiệu; (d) §84 (dòng T7) vẫn ghi "n chính thức VẪN = 9" dù quyết parent (e) đã chấp nhận n = 10 (ứng viên), dải 33–49,8 s; (e) §84 (dòng T8) vẫn ghi "T10 PHÁN: chuỗi GIỮ 11 — chờ parent xác nhận §12.1 (f)" dù quyết parent (f) đã XÁC NHẬN phán của T10; (f) §84 (dòng T8) vẫn ghi harness lần 1 "cần quy tắc mới T8-156" dù quyết parent (l) đã DUYỆT quy tắc đứng mới; (g) §84 ghi "đếm ... lần thứ 41 liên tiếp" — nay T1-156 đếm lại thành **lần thứ 42**. T1 không sửa GAP (thuộc closing của T10).
- **F-156-T1-2 — Bẫy đếm poll T4, biến thể mới (không phải lỗi của T4):** `grep -c '^poll #'` thô trên `poll-t4.log` ra 123 — **trùng đúng tổng thật nhưng sai lý do**: 121 poll thật + 2 dòng chú thích snapshot blockers (poll #1/#2, không có `boot=`); 2 poll test-log nằm ở `poll-test-155.log`, không nằm trong 123 dòng đó. `grep -c 'boot='` thô ra 124 (121 poll thật + 3 header start). Đếm đúng (lọc `^poll #` CÓ `boot=` rồi cộng test-log): 16 boot #49 + 105 boot #50 + 2 test-log = **123 — claim T4 đứng**. Cùng họ bẫy với F-155-T1-2 (đếm poll) và F-154-T1-5 (đếm spike) — ghi lại để T1 sau không đếm nhầm.
- **F-156-T1-3 — Phạm vi kiểm có giới hạn (cùng mẫu F-155-T1-4).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness/waiter (đếm lại từ file gốc), cờ .done, POSTBOOT_PASS. Các claim T2 (merged gap/sessions/hole-recheck chi tiết, INSIDE, WFS), T7 (scheduler DB, HB/DR, run 154/155 chi tiết), T5 (apt/dpkg internals), T9 (attribution từng spike, balloon episode, chuỗi headroom dài hạn), T6 (120 lần kiểm soát churn), T0 (bench chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. Kết cục run 155 thuộc T7-156 (quyết parent (k) đợt 155).
- **F-156-T1-4 — Sai số của chính T1-156 (ghi trung thực):** (a) lệnh `git log` đầu phiên báo "not a git repository" — working copy `~/workspace/repo-1` không có `.git` (cùng trạng thái các đợt trước; đếm/md5 không cần git) — đã xác minh bằng đường dẫn tuyệt đối, không ảnh hưởng kết luận. (b) lần tìm log EPERM đầu dùng sai đường dẫn (`~/workspace/repo-1/.eperm-probe-v2.log` — đó là thư mục rỗng; log thật ở `hidden_files/eperm-probe-v2.log`) — đã tìm đúng, số liệu §5 là từ file đúng. (c) script phụ lục tính mean RAM bằng chia nguyên (896.058) thay vì 896.059 — chỉ là làm tròn, không phải lệch số liệu. (d) suýt nhận nhầm subtree clicktest pid 4573 (vite port 5564 + MiniBrowser) là process sót của suite mình — đã kiểm PPID (4211 = `round156-t0/run-o8-156t0.sh`, của T0-156 đang chạy song song) TRƯỚC khi đụng vào; KHÔNG kill process nào của luồng khác. (e) lệnh `find ~/workspace` toàn cây chạy 137 s mới xong (cây lớn) — chậm nhưng không ảnh hưởng kết quả.
- **F-156-T1-5 — Lock queue đổi 101 → 100 trong phiên T1 (không phải lệch đợt 155):** T1 đếm 101 file lúc ~17:41Z (khớp T10-155), còn 100 file lúc ~17:56Z; `cooldown-t8-round155` vẫn còn; thư mục `round156-t6/` đã xuất hiện — nhiều khả năng prune lần 31 của T6-156 đã chạy giữa hai lần đếm. T1 không tự suy ra file nào đã prune (không có snapshot đối chiếu); giao T6-156 xác nhận trong LIMITS của mình.

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 155 đứng vững toàn bộ trên boot 5353ed19: đếm khớp lần thứ 42 liên tiếp; suite đầy đủ 28/28 (11m31s); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 11 xác nhận độc lập (quyết parent (f) đợt 155); RAM đỉnh 44,17% guard + min 505.888 kB + balloon 46 đối chiếu từ log gốc; mù #74?/#75? đã ĐÓNG theo quyết parent (c) (CERT/FULL chính thức 76/91); GAP §84 đã đủ đếm cuối; **9/9 cờ đợt 155 còn trên đĩa, đều có nội dung**. Bẫy đếm mới ghi nhận (F-156-T1-2 poll) không đổi verdict đợt 155 — claim T4 (123 poll) đứng sau khi đếm đúng.
- **Verdict CHẤP NHẬN đợt 155 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 156 (đã có chủ, T1 chỉ nhắc lại + bổ sung từ F-156-T1-1/5):** mù #77? VẪN MỞ (chặn CERT77/FULL92) + #78?/#79?/#80? GIỮ MỞ + mù #81? GIỮ MỞ chưa chứng nhận (theo thứ tự) — giao T2-156; mù #82? (đi kèm #50) + mù #83? (đi kèm #51) giao T2-156; reboot #52 ứng viên (boot 5353ed19, btime 17:19:09Z) giao T2-156 xác nhận số hiệu — probe #75 đã xác nhận độc lập boot-changed; kết cục run 155 + ứng viên điểm (m) thứ 11 thuộc T7-156; POSTBOOT_PASS #51 chưa có — giao T5-156; prune lần 31 T6-156 (queue 101 → 100 trong phiên T1, xem F-156-T1-5); checklist (o) + quy tắc fixture mới T8-156 (quyết parent (l) đợt 155); H3 chỉ giám sát thụ động T8-156 (quyết (p)); headroom 0 + ENOSPC giao T9-156, giữ quyết (g) "chỉ theo dõi" (quyết (h)); G1/R9/ci-security.yml/TTS 39 giữ nguyên theo quyết đứng; GAP §84 nhãn cũ — T10-156 cập nhật khi viết §85 (F-156-T1-1).
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 155 + verify 156. Boot `5353ed19` ổn định, không reboot trong phiên T1. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 17:51:50Z`). `/tmp/.X11-unix/` lúc đóng có X191/X193/X194/X195 — socket của các luồng đợt 156 khác đang chạy song song, T1 KHÔNG đụng vào.
- **File LIMITS này:** `docs/PHASE9_ROUND156_T1_VERIFY155_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round156-t1-verify155.txt` (1 entry NUL, od OK). Cờ `round156-t1.done` viết trước khi báo đóng, CÓ NỘI DUNG (không 0 byte).

**Tổng batch đợt 155 (tái kiểm): 10 batch / 13 entry / 13 file duy nhất.**
**Lũy kế 111–155: 438 batch / 846 entry / 719 file.**
**Tổng batch chờ user push (đợt 136–155): 190 batch / 268 entry / 223 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)

---

## Phụ lục A — Số liệu trích từ log gốc (script `round156-t1/appendix-156t1.py`, không gõ tay)

Xem file `hidden_files/round156-t1/appendix-156t1.txt` (74 dòng): A.1 suite 28/28 + cây md5; A.2 đếm cuối; A.3 O8 JSON + waiter + selfcheck postboot; A.4 RAM/balloon/B2; A.5 EPERM probe #74/#75; A.6 T4 poll (123 poll thật + 2 dòng chú thích); A.7 T6 lock; A.8 cờ .done đợt 155; A.9 boot T1-156.
