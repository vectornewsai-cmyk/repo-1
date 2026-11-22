# PHASE9 ROUND 151 — LIMITS tổng hợp (đợt 151, lượt cron 09:35 +07 20/11/2026)

- **Verdict đề xuất: CHẤP NHẬN** (xem §10.6 — đề xuất, chờ quyết parent §12.3). Caveat lớn (đọc trước): reboot #42 giữa harness (mù #74? mở); 2 kẹt thật WebKit trong harness (85m4 3/4 lần chạy gần nhất); headroom 90 / tỉ lệ-vite 0,057 — sâu nhất từ trước tới nay, lần đầu dưới 0,10; T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-151 + kiểm md5/cây/lock lúc đóng — F-151-T10-3); chỉ có JSON báo cáo WebKit cuối cùng trên đĩa (lần chạy WebKit đầu chỉ còn verdict trong log — F-151-T10-2); T4 báo giờ cờ 03:15Z trong khi mtime file là 03:16Z (F-151-T10-1, không ảnh hưởng gate).
- **Điểm mạnh đợt này:** #22 CÓ lượt hợp lệ mới (thứ 19, median 39,0 ms) sau 2 đợt 0 lượt; O8 qua gate đúng chuẩn đứng (i) lần đầu sau 3 đợt lệch chuẩn; mù #72? + #73? ĐÓNG HOÀN TOÀN cùng một đợt (chuỗi 7 → 9); (A) kiểm chứng 120/120 PASS dưới churn; V19 đã nối vào test_integration.sh (đếm 11 → 12); 9/9 cờ `.done` có mặt trên đĩa lúc đóng (khác 6/9 của đợt 150 — quyết (t) đợt 150 có tác dụng); run 150 SUCCEEDED (margin chỉ 177 s); replay tới tự nhiên, cache apt sống lại 178 .deb.

## §1. T0 — V19 nối vào test_integration.sh (quyết (j) đợt 150)

- Thêm §5 vào `server/render/test_integration.sh` — chạy probe V19 (`test_v19_pixelate_probe.js`, 34 assert geq) sau §4, log đầy đủ giữ tại `$OUT/v19-pixelate.log`. Probe và `effects.js` không đụng (md5 probe giữ `fb392111…`); `test_integration.sh` md5 `0fc58438…` → `a6b8cfc0…`.
- Test xanh (số thật): probe V19 độc lập 34/34 KHÓA-ĐẠT, exit 0, 22,3 s; `test_integration.sh` riêng **12 pass, 0 fail, exit 0** (4m07s); `npm test` đầy đủ **exit 0** (5m11s) — unit 7/7 + integration 12 pass.
- **Đếm đổi 11 → 12** (fixture 3 + LUT 1 + demo 6 + pixelate_render 1 + V19 1), ghi rõ trong LIMITS §2. Suite 28/28 của T1 không vỡ (`npm test` vẫn là 1 mục trong 28; script verify của T1 không assert cứng "11 pass" — đã grep kiểm). Chỉ dòng KẾT QUẢ trong log `npm test` đổi "11 pass" → "12 pass" — **T1-151/T10-151 khi đọc log suite phải đọc 12, không phải 11**; mọi văn bản cũ ghi "npm test 11 pass" nay là số cũ.
- Stage: `phase9-round151-t0-v19.txt` (2 entry). LIMITS: `docs/PHASE9_ROUND151_T0_V19_INTEGRATION_LIMITS.md`. Cờ `round151-t0.done` 02:51Z. KHÔNG PUSH.

## §2. T1 — Verify đợt 150: PASS

- **Suite chạy lại: 28/28 exit 0** (27 mục + `npm test` đầy đủ, 02:39:29–02:51:43Z, boot `2e430750` — lần đầu suite đầy đủ chạy trên boot sau reboot #41, lấp đúng khoảng trống F-150-T10-2 của T10-150). `npm test`: **12 pass, 0 fail** — 11 mục cũ + probe V19 34 assert PASS (T0-151 nối V19 vào lúc 02:41Z theo quyết (j), giữa phiên T1).
- **Đếm tái kiểm — KHỚP TỪNG SỐ (script mới `count-final-151.py`, dedup toàn cục):** đợt 150 = **10 batch / 18 entry / 18 file**; lũy kế 111–150 = **388/774/658**; chờ push 136–150 = **140/196/161**; tái kiểm 111–149 = **378/756/645** — **lần thứ 32 liên tiếp**. Overlap 5 file, 0 thiếu trên đĩa, 0 lỗi purity.
- Các claim lớn đều đứng: O8 xác nhận độc lập bằng JSON/log gốc (WebKit 21/21 + Chromium 21/21) — chuỗi FULL PASS **7 → 8**; đính chính MAD geq-yuv444 **đã vào** `EFFECTS_LIMITS.md`; probe #69 ok=2 fail=0 (log đúng 199 dòng); mù #71? đóng hoàn toàn đứng (quyết (c)); 2 kẹt thật xác nhận từ log driver gốc (85m4 exit 124; 86n2=124); poller T4 đếm lại 97 poll thật, gate0 0/97; sampler T9 97 mẫu / 28 ghim / 28 spike. Cây md5 không đổi (preview `530e10a7`, effects `fedc0141`).
- Sai lệch phát hiện (nhỏ, không đổi verdict): F-151-T1-1 — GAP §79 vẫn ghi số cũ 659/162 (aggregate đã sửa 658/161; GAP §79 là hồ sơ đã đóng, giao T10-151 đính chính ở §80); F-151-T1-2 — aggregate mô tả sai phép cộng dòng `poll-t4.log` (thực chất không đổi); F-151-T1-3 — npm test 12 pass do V19 nối giữa phiên; F-151-T1-4 — lock delta 8, ca thứ 8 là acquire t8-round150 bị reboot #41 giết, đã phục hồi bằng STALE-LOCK.
- Stage: `phase9-round151-t1-verify150.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND151_T1_VERIFY150_LIMITS.md` (19.325 B). Cờ `round151-t1.done` 02:55Z. 4 socket Xvfb do suite tạo đã dọn. KHÔNG PUSH.

## §3. T2 — EPERM probe #70 + mù #72?/#73? ĐÓNG HOÀN TOÀN

- **Probe EPERM #70: ok=2 fail=0, boot 2e430750, 02:40:07Z.** Probe #69 stale 10.507 s. Log 199 → 202 dòng (+3 đúng mẫu).
- **Mù #72? ĐÓNG HOÀN TOÀN + mù #73? ĐÓNG HOÀN TOÀN** (chờ parent xác nhận): G-full đóng theo luật gap (merged max gap 380 s < sàn 1.147 s, max 0 ẩn; 245 mốc), H đóng (max gap 702 s < sàn, max 0 ẩn; 104 mốc). F'-body đã đóng đợt 150. Gap #40 chứng nhận dạng khoảng **[7.696, 7.700] s (giữa 7.698 s)** → CERT 72 / FULL 87; gap #41 **[6.820, 6.824] s (giữa 6.822 s)** → **CERT 73 / FULL 88**. Cả hai số danh nghĩa đều nằm trong khoảng thật (lần thứ hai liên tiếp sau #39, danh nghĩa đúng trong sai số ±2 s). Chuỗi mù đóng hoàn toàn **7 → 9** (hai mù đóng cùng một đợt — lần đầu tiên).
- **Nghịch lý đồng hồ MẠNH HƠN brief:** đồng hồ boot cũ e9295700 nhanh **≥ +20 s lúc chết** (mẫu cuối ram log T8-150 đóng dấu 01:26:12Z, viết trước khi chết), không chỉ +7 s như dòng P3 PASS 01:25:58Z (cận dưới yếu hơn, ≥ +6 s, nhất quán). Chỉ ghi nhận theo quyết parent 150 (p), không mở điều tra mới. Đã chứng minh nó **không** làm rộng khoảng gap #41 (btime_old đã ghi lúc 23:45Z khi e5 ≈ 0); nó chỉ ảnh hưởng cách đọc khung #116?.
- **Khung chết #116?: (01:25:09Z, 01:25:51Z] = 42 s** danh nghĩa (≈ 42 ± 2 s giờ thực, mốc runtime theo tiền lệ #115?). Bản đọc chỉ-bằng-đồng-hồ-VM cho 74 s — đề xuất không dùng (dấu VM gần lúc chết bị drift phình). **Cần parent chốt 42 s hay 74 s** (§12.1 (c)).
- **INSIDE: chuỗi 2 → 3** — btime 2e430750 INSIDE cả ba dải FULL87/FULL86/FULL85 neo 23:32:09Z ([23:58:21Z, 01:56:58Z] / [23:58:20Z, 01:57:08Z] / [23:58:18Z, 01:57:18Z]). Dải boot kế tiếp FULL88 neo 01:25:51Z: [01:52:05Z, 03:50:31Z].
- **F113? ≈ 0/+1 s, ĐỦ 3 SERVER** (cloudflare 200 lần này). Replay boot mới bắt đầu bình thường (+44 s). /proc/1 lệch 0,51 s.
- **WFS #57 chênh 0** (978/282, 1.003/299, 25/17); delta +2/+2 giải thích đủ bằng diff (2 file LIMITS nhắc chuỗi trong văn bản). **EPERM 0 sóng thật** (24 hit đều trong log quét của T2-150 — tự tham chiếu). **RAM đỉnh 34,41% guard — SAI CỬA SỔ, xem §10.3:** file `ram-max.txt` của T2 đọc log đợt 150 (00:09:35Z, boot e9295700), không phải đợt 151; số đúng đợt 151 là 51,56% của T9 (T10 kiểm lại từ log gốc, §10.3). **Birefnet 0 thử lần thứ 5 liên tiếp**; balloon 28 mẫu ghim ở G (khớp T9-150). Hole-recheck 843.399 file: 0 mốc mới trong cả 6 hố (chỉ bẫy float, lần thứ 6 liên tiếp).
- Kết cục run 150: không phán thay (thuộc T7-151, quyết (q)).
- Sai số của chính T2-151 (đã sửa, ghi đủ trong LIMITS §4.2): F-151-T2-1 (quy ước used sai, đã sửa theo chuẩn đứng, số khớp T9-150); F-151-T2-2 (tên biến hoa/thường); F-151-T2-3 (sai số học trong docstring 3 script — chỉ sai chú thích); F-151-T2-4 (grep mốc sai định dạng giờ, đã chạy lại đúng).
- Stage: `phase9-round151-t2-eperm.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND151_T2_EPERM_LIMITS.md` (44.632 B — OVERSIZE, push cần `ENABLE_PRIVSEP=0`). Cờ `round151-t2.done` 02:58:57Z. KHÔNG PUSH.

## §4. T4 — Lượt yên #22: CÓ lượt hợp lệ mới (thứ 19)

- **#22 có lượt hợp lệ mới: attempt2-2e430750, 02:58:32–03:02:25Z** — probe 20/20, lớp B ĐẠT 5/5, **tickCost median 39,0 ms ≤ 60** (n=648, p90=64,0, max=95, min=27; hậu flip+2000ms n=489 median=39,0); coverage (c2) 10/10, seq [144,164,218,248,275,304,365,365,414,492]. Cộng dồn (c2) 18 → **19 lượt: P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48**; chuỗi median 19 lượt trung bình 48,9 ms.
- **Retry live (nợ đợt 150): CÓ — lần đầu kiểm chứng được quyết (h).** Attempt1 nhiễm tải (median 108,0 ms, B1+B2 vi phạm — T1 suite + T2 blind72 + mask_anim.py U4), poller `wait_gate()` poll lại 11 lần chờ load5 hạ 5,71 → 1,81 rồi mới chạy attempt2 lúc 02:58:32Z. F-150-T4-3 ĐÓNG.
- **p1p3p7 chạy tay sau poller, exit 0** (F-148-T4-1 ĐÓNG cho lượt này): P1 ĐÚNG 10/10 (p=9,26e-11), P2 ĐÚNG 10/10 lag ≥+1f 0 âm, P3-A1 ĐÚNG 8/10 (p=0,00022), P7 ĐÚNG; P3' 8/10 không tròn (seq 365 ×2 stall=1, cùng event lag5 (b) +10f).
- **Test poll ghi log riêng** (F-150-T4-5 ĐÓNG): `poll-t4.log` đúng 18 dòng poll thật, không còn dòng test.
- **Boot mới tốt hơn hẳn đợt 150:** replay tới tự nhiên đầy đủ (dpkg 1545 dòng, xong boot+4m22s), cache apt 178 .deb SỐNG, **không cần repair**; cờ T5-151 POSTBOOT_PASS cho boot 2e430750 lúc 02:48:41Z poll=2. RAM chờ 17/18 poll ≥1024, 0 poll <500 MB (RAM sập đợt 150 không tái diễn). 0 reboot trong phiên; ngân sách dùng 2/3 attempt.
- Lưu ý: P3' 32/34 — lần đầu không tròn trong một lượt hợp lệ (seq 365, stall=1 + lag +10f/+6f); theo dõi đợt sau, chưa đề nghị điều tra. mask_anim.py (U4) nhiễm lượt đo lần thứ ba (đợt 149 A2/A3, đợt 151 attempt1) — hướng dẫn đứng "job nặng tránh cửa đo T4" chưa được tuân triệt để. RAM tụt trong lượt hợp lệ (mở cửa 1411 MB → min 904 MB, 16/100 mẫu <1024) — gate-A chỉ đo lúc mở cửa; ghi nhận, không tự đổi luật. Probe `probe121t3-ghost-k7.webkit.mjs` byte-identical đợt 148/149/150 (md5 `4291e539…`), không stage lại.
- Stage: `phase9-round151-t4-quiet22.txt` (3 entry: LIMITS + `poll-wait-t4-151.sh` md5 `11200f29…` + `run-attempt-151.sh` md5 `2efd1a09…`). LIMITS: `docs/PHASE9_ROUND151_T4_WEBKIT_QUIET22_LIMITS.md` (17.378 B, md5 `eac16728`). Cờ `round151-t4.done` mtime 03:16Z (T4 báo 03:15Z — lệch 1 phút, xem F-151-T10-1). KHÔNG PUSH.

## §5. T5 — Infra: replay tới tự nhiên, cờ postboot sửa lỗi 8 ký tự

- **Replay TỚI TỰ NHIÊN, không cần repair.** Boot hiện tại **2e430750** (reboot #41, btime 01:25:51Z): hoạt động dpkg đầu 01:26:35Z (boot+44s), cài xong 01:30:13Z (boot+4m22s) — bracket **(44s, 4m22s]**, nhanh thứ 2 trong các bracket đã kẹp. 1.545 dòng, gói cuối gstreamer1.0-tools, 0 entry sau đó; gói cài y hệt đợt 146/147 (221 status-installed / 462 configure-substring / 50 history Start-Date). md5 khác (`51d12c3d` vs `d2b2e788`) là điều kiện đúng — timestamp giờ boot gắn trong từng dòng, không phải trôi replay.
- **Cache APT SỐNG 178 .deb/156M** (mtime trước boot) — chuỗi 0 .deb 2 lần (#39, #40) **DỨT**, không kéo dài sang lần 3. Chỉ ghi nhận theo quyết (l) 149 / (r) 150, không điều tra riêng. Lists 37 (1 mirror azure). GST thư mục thật (apt) 269 file = debroot 269 — không cần symlink repair.
- **Postboot PASS poll2 02:40:23Z exit 0** (poll1: T4 manual 02:38Z, cũng PASS). Cờ `POSTBOOT_PASS` ghi 02:43:12Z, cờ cũ e9295700 lưu `POSTBOOT_PASS-e9295700`.
- **Sửa quan trọng F-151-T5-1:** cờ prose kiểu 149/150 chỉ ghi 8 ký tự đầu boot_id nên poller T4 (`grep -q "$BOOTID"` — full UUID) không bao giờ nhận — poll #1–#7 vẫn `t5flag=cu` dù cờ đã ghi. Đã viết lại cờ với **full boot_id 02:48:41Z** → T4 **poll #8 02:51:00Z xác nhận `t5flag=PASS`, `gate0=T5`** (lần đầu từ đợt 147 cờ T5 được nhận làm gate chính; kiểm chứng bằng log gốc T4). Watcher cũng sửa cùng định dạng.
- **Chiến lược (h) đã triển khai:** watcher `replay-watch-151.sh` đang chạy (**pid 49781**, heartbeat 30s, tự giới hạn 05:30Z) — repair sớm ở boot+15' nếu dpkg.log đóng băng ≥600s + 0 apt/dpkg + dòng <100; 1 repair/boot; backstop 60'. Chưa kích hoạt live đợt này (replay tự tới). Caveat: watcher sống qua reboot chưa kiểm chứng — heartbeat trong log sẽ cho biết. (Lúc T10 đóng: pid 49781 đã chết theo reboot #42; có 1 process khớp tên `replay-watch-151` (pid 15613) đang chạy — T5-152 đối chiếu `replay-watch-151.log`, xem §10.5.)
- Headroom: T5 không probe k8 (tránh nhiễu T4 đang đo #22); trần inotify 63.747 không đổi; số headroom đợt 151 do T9-151 đo.
- Nợ mở / lưu ý: F-151-T5-3 (phía T4, không sửa): nhánh `elif` trong poller T4 không `break` nên log poll che trạng thái thật của cờ chính khi ở trạng thái trung gian — nay không còn ảnh hưởng thực tế sau sửa F-151-T5-1. Lists 37 = 1 mirror azure (so với 71/2 mirror đợt 149) — chỉ ghi nhận, chưa rõ nguyên nhân. T4 attempt1 xong 02:51:00Z (20/20 nhưng lớp B vi phạm — nhiễm tải, không tính verdict; retry poll-lại-gate) — việc của T4.
- Stage: `phase9-round151-t5-infra.txt` (2 entry). LIMITS: `docs/PHASE9_ROUND151_T5_INFRA_LIMITS.md` (26.997 B). Cờ `round151-t5.done` 02:53Z. KHÔNG PUSH.

## §6. T6 — (A) triển khai + kiểm chứng 120/120, prune lần 26

- **(A) triển khai xong** (quyết (b) đợt 150): `apps/web/scripts/test-vite-lock-v2.sh` md5 `63a25be3` → `a89c0676`, **chỉ đổi khối T7**: bỏ 3 lần poll + assert `B1−N0=1 VÀ B2−N0=0` của (B), thay bằng `count_fake` đếm CHỈ marker giả `WebProcess-q4test` (`[W]ebProcess-q4test` + `grep -v grep`), assert `B1=1 B2=0`. Code (B) giữ trong comment của suite (kèm md5 bản cũ + tham chiếu LIMITS T6-150 §6) — repo local không có `.git` nên lịch sử là stage + LIMITS.
- **Phạm vi hẹp đã tuân thủ, có bằng chứng:** `vcut-poll-quiet-v2.sh` giữ `1710e480`, `count_blockers` dùng chung cho gate T4 không đổi; lock v2 giữ `520b8baa`; preview.tsx giữ `530e10a7`. T4-151 acquire/release bình thường trong phiên.
- **Kiểm chứng — DƯƠNG TÍNH, vượt mục tiêu: harness 120 lần có churn: PASS 120/120 (100%)**, B1=1 B2=0 cả 120 lần; delay churn thực đo min 513 ms / max 3488 ms / trung bình 2098,97 ms (đúng phân phối thiết kế 500–3500 ms). Khối T7 trích **verbatim** từ suite đã sửa (live-code md5 `c92f2efff…` khớp đúng file suite). Đối chiếu cùng churn: (B) 2/30, bản cũ 13/30. Suite đầy đủ **9/9 × 6 lượt** (rc=0 cả 6), T7 (A) xanh cả 6.
- **Prune lần 26:** **102 → 100 file** (xóa `cooldown-s4-w3` + `cooldown-s4-hold2`, ~125,7h tuổi, điều (b) kích hoạt; điều (a) 0 file). Lần đầu prune phải **chờ** vì T4-151 đang giữ lock 02:45–02:49Z — đã chờ tới khi lock TRỐNG (02:51:25Z) mới chạy, đúng điều (e). Sau prune 100 file / 1400 byte, lúc đóng vẫn 100/1400. (Lúc T10 đóng: thư mục lock queue có 102 file — 100 sau prune + 2 cooldown T8-round151 thêm sau, đúng mẫu đợt 150.)
- **Lock KHỎE:** 399 cặp ACQUIRED→RELEASED (+1 chu kỳ t4-151 hold 259 s), 0 đang giữ, 0 TIMEOUT mới, 0 "KHÔNG NHẢ". Ca double-acquire thứ 8 (t8-round150, reboot #41 giết holder trước phiên) đã phục hồi sạch bằng STALE-LOCK. Không reboot trong phiên T6 (boot duy nhất 2e430750 lúc đó).
- 4 socket Xvfb mồ côi của T1-151 (X193–X196, 0 process sống) — T1 đã dọn lúc đóng.
- Chuỗi: xanh kép T7 0 → 1 (lần đầu xanh kép trở lại sau (A)); suite xanh về bản chất 32 → 33 (theo quy ước đếm theo đợt — T10 xác nhận lại, xem §10.6).
- Stage: `phase9-round151-t6-lockhealth.txt` (2 entry). LIMITS: `docs/PHASE9_ROUND151_T6_LOCKHEALTH_LIMITS.md` (28.463 B, md5 `39ba73ba…`). Cờ `round151-t6.done` 02:54:47Z (đã `ls`+`cat` kiểm chứng trên đĩa trước khi báo đóng). KHÔNG PUSH.

## §7. T7 — Scheduler: run 150 SUCCEEDED, started_at bị viết lại ở cả #41 và #42

- **Kết cục run 150: SUCCEEDED** 02:32:54Z (event 02:32:54.506Z), wall từ started gốc **10.623 s**, margin **chỉ 177 s** (2m57s) tới hạn ngân sách 02:35:51Z — suýt timeout, hẹp nhất chuỗi gần đây. Xác nhận bằng 2 lần đọc DB độc lập khớp nhau + events đối chiếu đầy đủ.
- **started_at bị viết lại — cả hai reboot đều DƯƠNG (mẫu (m) chỉ ghi nhận, điều tra đã đóng):**
  - **#41** (btime 01:25:51Z, trước phiên): run 150 đang chạy, bị viết lại 23:35:51Z → 01:26:36Z, requeue = btime + 44,994 s. Điểm dữ liệu thứ 3, DƯƠNG.
  - **#42 GIỮA PHIÊN** (btime 03:25:16Z, boot mới `fad2aab9`): run 151 (run của chính đợt này) đang chạy, bị viết lại 02:35:51Z → 03:25:49Z, requeue = btime + 33,236 s (nhanh nhất trong 3 lần dương). Điểm dữ liệu thứ 4, DƯƠNG. Sleep của T7 bị #42 giết (SIGTERM sau ~897 s). **n = 4: #38 ÂM, #39/#41/#42 DƯƠNG.**
  - Caveat: kết cục run 150 NHẠY với chứng nhận clock tại #41 (margin 177 s nhỏ hơn mọi bước nhảy đã biết) — T1/T2-151 phán.
- **Slot HB/DR — CỬA LÀNH HOÀN TOÀN, 0 slot thiếu mới, 0 muộn:** HB **7/7** (tất cả jitter −316 s chuẩn), DR **3/3** (tất cả 0 s). Mẫu muộn HB (+889 s đợt 150) không tái hiện; không có khoảng im lặng scheduler bất thường trong phiên. Lũy kế đếm lại từ DB (không cộng tay): HB **44/297** (14,8%), DR **49/219** (22,4%).
- Boot: mở phiên `2e430750` (btime 01:25:51Z, #41 trước phiên) → `fad2aab9` (btime 03:25:16Z, #42 giữa phiên), không reboot nào sau #42. Run 151 vẫn `running` lúc đóng cờ (tuổi gốc 8.211 s, còn 2.589 s tới hạn 05:35:51Z) — kết cục thuộc T7-152.
- Stage: `phase9-round151-t7-scheduler.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND151_T7_SCHEDULER_LIMITS.md` (23.784 B). Cờ `round151-t7.done` 04:54:04Z. KHÔNG PUSH.

## §8. T8 — Vite harness + O8: QUA GATE đúng chuẩn (i), 2 kẹt thật 85m4, reboot #42, H3-D1 BÁC BỎ

- **O8 PASS 3/3 — SAU LƯỢT YÊN HỢP LỆ #19, QUA GATE theo chuẩn đứng (i):** WebKit 21/21 ×2 + Chromium 21/21, exit 0, 03:16:53–03:19:21Z, boot `2e430750`, S1 PASS cả 3 lần. Chuỗi WebKit FULL PASS **8 → 9** (chờ T10 xác nhận độc lập — đã xác nhận, §10.2). Đây là lần đầu sau 3 đợt lệch chuẩn (148/149/150) gate thỏa đúng chuẩn (i): T4 flag 03:15Z → waiter GATE-FOUND 03:16:15Z → O8 03:16:53Z. (T10 kiểm độc lập: GATE-FOUND poll=36 03:16:15Z trong `smoke/wait-t4-t5.log`; cờ T4 mtime 03:16Z — xem F-151-T10-1.)
- **Harness 2 kẹt thật, đều ở 85m4, 2 boot, 2 nguồn lib:**
  - Lần 1 (boot `2e430750`, system libs): 84l10 PASS + **85m4 KẸT P5-phaseB-long** (sampleFor đóng băng n=3/200, ct=2,135; watchdog 03:25:09Z; probe chưa hoàn tất vì **reboot #42** giết driver) + 86n2 chưa chạy.
  - Lần 2 (boot `fad2aab9`, DEBROOT — system libs vắng, replay không tới sau 12 poll): 84l10 PASS + **85m4 KẸT exit 124 P1-waitForPlaySync** (đóng băng ngay từ đầu, ct=0,502; watchdog 03:42:50Z + probe 1+1 TIMEOUT 03:43:20Z) + 86n2 PASS + **Chromium 3/3 PASS** (04:41:42Z/04:43:57Z/04:48:03Z, ok=true). N đối chứng Chromium cộng dồn **N=13 mỗi pha**, 0 kẹt.
  - Chuỗi "P3 không kẹt" 0 → 0 (vẫn đứt). 85m4 đã kẹt **3/4 lần chạy gần nhất** (điểm kẹt khác nhau mỗi lần — không phải một pha cố định).
- **Reboot #42** (btime 03:25:16Z, `2e430750` → `fad2aab9`) giữa harness; nghịch lý đồng hồ **18 s** (lớn nhất chuỗi 8/14/7/18 s); mù #74? giao T2-152.
- **Điều tra H3 có giới hạn (quyết (g)) — H3-D1 BÁC BỎ:** đối chiếu 2 live-diag đợt 150 (01:40:25Z/01:44:25Z) + watchdog diag cho thấy WebKitWebProcess RSS **giảm đơn điệu 353→271→215 MB (−39%)**, CPU TIME chỉ +13 s/393 s (~3,3%), VSZ không đổi, cả 3 process WebKit cùng co lại — RAM tụt trong lúc kẹt là do balloon host phồng + kernel reclaim page của process đang kẹt (nạn nhân), không phải process kẹt gây ra. H3 vẫn mở, thu hẹp thành wedge "chết lặng" (idle, không spin, không leak). H1 bác bỏ, H2 không ủng hộ (đứng nguyên).
- **Vận hành:** checklist (o) đã làm đúng — symlink `t8-diag-stall.sh` cập nhật 02:39Z, chẩn đoán kẹt ghi đúng thư mục đợt 151 ngay lần đầu. Watchdog kích hoạt 2 lần, bắt đúng 2 kẹt, 0 false-positive; (1b) 0 kích hoạt (đúng thiết kế — 85m4 có HB128). RAM avail min **253 MB** (03:55:30Z, trong lúc kẹt 4) — theo sampler T8; T9 đo min 250.840 kB (03:56:18Z) thấp hơn — T10 lấy số T9 làm kỷ lục mới (xem §10.3). Balloon 0 mẫu ghim trần (max 99,0% trần). Kiểm cuối sạch: 0 process sót, /tmp/.X11-unix/ trống, lock vite trống, cây md5 mở = đóng.
- Caveat cho T10/parent: kẹt 1 không có verdict exit (bị reboot giết giữa lúc kẹt — đếm là kẹt thật theo chữ ký playhead + watchdog, không theo exit code); lần 2 chạy DEBROOT, không có postboot T5 cho boot mới; RAM min 253 MB chờ T9 đối chiếu trước khi ghi kỷ lục mới (T9: 250.840 kB — đã đối chiếu, §10.3).
- Stage: `phase9-round151-t8-viteharness.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND151_T8_VITEHARNESS_LIMITS.md` (56.837 B — OVERSIZE, md5 `9e73cff8`, 0 placeholder còn lại). Cờ `round151-t8.done` 04:49Z. KHÔNG PUSH.

## §9. T9 — Headroom 90 (sâu nhất), balloon đợt mới, fix (n) xong, birefnet 0 lần thứ 5

- **Headroom: 194 → 90** (mở 02:40:42Z boot 2e430750 → đóng 04:52:32Z boot fad2aab9, trần 63.747 không đổi). Tỉ lệ/vite **0,123 → 0,057 — sâu nhất từ trước tới nay, lần đầu dưới 0,10**; dưới ngưỡng lần thứ 11 liên tiếp. Chỉ theo dõi theo quyết (l) đợt 150, không đổi ngưỡng, không yêu cầu user hành động.
- **Balloon: ghim trần trở lại, đợt MỚI trên boot fad2aab9 — 31/134 mẫu** (chuỗi 03:38–03:39Z n=2; episode chính 04:09:18–04:36:19Z n=28, 27 phút; chạm lại 04:52:19Z n=1, còn mở lúc đóng). Phán theo quy tắc (e): đợt mới (cách đợt 150 hai reboot #41+#42 + xả sâu tới 3,58M kB + ~2h40m không ghim). Cách đếm trong đợt giao T10 xác nhận.
- **Birefnet: 0 lần thử — lần thứ năm liên tiếp.** RAM đỉnh 3.243.888 kB = 51,56% guard lúc 03:03:31Z; 0/134 mẫu ≥ guard; cơ chế (a) armed cả phiên (trừ gap 46 s tại reboot #42). u2net vẫn là fallback chính thức.
- **Fix (n) — loại `ps` watcher khỏi snapshot: ĐÃ SỬA VÀ KIỂM CHỨNG XONG, F-150-T9-8 ĐÓNG.** Trước sửa ps lọt top-3 ở 23/30 lần thử; sau sửa 0/30; trong phiên thật **0/13 spike** có `ps` trong snapshot. Attribution vẫn đủ 13/13.
- **B2: 13 spike, tất cả quy được nguồn** (02:39:59–02:51:28Z, boot cũ; 0 spike sau đó ~2h00m yên). Đỉnh load1 11,03 (watcher) / 11,26 (sampler); testsrc2 geq gây 8/13 spike; delta max 146 tick/s (ffmpeg vidstab).
- **Reboot #42 giữa phiên** (btime 03:25:16Z): sampler/watcher chết theo, khởi động lại bằng tay 03:26:17Z, gap 46 s. **Dấu hiệu đồng hồ: btime boot mới sớm hơn 15 s so với mẫu cuối boot cũ (03:25:31Z)** — giao T2/T7.
- **#22: có lượt hợp lệ mới #19** (T4: attempt2 02:58:32–03:02:25Z, 20/20, B 5/5, median 39,0 ms). Sampler T9 corroborate độc lập: attempt1 load1 7,96–11,26 (nhiễm tải thật, nguồn chính là suite T1 — WebKit của T4 chỉ 30,8%); attempt2 load1 0,22–1,49 (yên).
- **WFS #57 chênh 0** (trích T2-151, lần thứ 57 liên tiếp).
- **Tự bắt lỗi dữ kiện:** bản nháp đầu của phụ lục A có các giá trị gõ tay bị sai (lặp lại khối 04:09–04:36Z, vài SwapFree/load1 sai, balloon mẫu 04:50:19Z sai). Đã phát hiện khi đối chiếu, **viết lại toàn bộ phụ lục bằng script trích trực tiếp từ `ram-sampler.log`** và verify từng dòng mẫu (93/94/95, 108/109/110, 132/133 khớp log); đồng thời sửa 2 câu SwapFree (§2.1, F-151-T9-6: 598.412 → 548.244 kB) và 2 claim delta (§2.5: 2 spike không ghi được dòng delta của ffmpeg do pid chết trong cửa sổ delta). File cuối không còn số bịa.
- **Lệch số RAM đỉnh với T2-151 §(g)** ("34,41% guard" — trùng đúng đỉnh T9 đợt 150) vs sampler T9 đợt này **51,56%** lúc 03:03:31Z. Giao T10 đối chiếu `ram-max.txt` của T2 trước khi chốt số vào aggregate (F-151-T9-7) — **T10 đã đối chiếu: số T9 đúng, số T2 là dữ kiện đợt 150 (xem §10.3).**
- Sampler 134 mẫu (47 boot cũ + 87 boot mới); RAM min 250.840 kB (03:56:18Z), mean 1.033.515 kB; gate A 46/134; SwapFree 591.472 → 641.420 kB. T5-151: replay tự nhiên/nhanh, cache APT sống 178 .deb, postboot PASS poll2 02:40:23Z, cờ 02:43:12Z; T1-151 suite 28/28; T8-151 O8 PASS 3/3 sau lượt yên #19, gate (i) đạt, WebKit FULL PASS 8 → 9.
- Stage: `phase9-round151-t9-headroom.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND151_T9_HEADROOM_LIMITS.md` (59.786 B — OVERSIZE). Cờ `round151-t9.done` 04:58:33Z. KHÔNG PUSH.

## §10. T10 — Kiểm chứng độc lập lúc đóng

### §10.1 Cờ `.done`: 9/9 CÓ MẶT trên đĩa lúc đóng

`ls` trực tiếp `hidden_files` lúc đóng: round151-t0.done 02:51Z, t1 02:55Z, t2 02:58Z, t4 03:16Z (mtime; T4 báo 03:15Z — F-151-T10-1), t5 02:53Z, t6 02:54Z, t7 04:54Z, t8 04:49Z, t9 04:58Z. **9/9 cờ đủ** — khác 6/9 của đợt 150; quyết (t) đợt 150 (mỗi luồng phải viết cờ, T10 kiểm trên đĩa) có tác dụng. Nội dung 9/9 luồng đủ trên đĩa (LIMITS + paths + thư mục làm việc).

### §10.2 O8 xác nhận độc lập

Đọc JSON gốc: `o8-webkit/o8w-clicktest-report.json` total 21 ok 21 fail 0; `o8-chromium/o8-clicktest-report.json` total 21 ok 21 fail 0. Log driver `o8-151t8.log`: 2 dòng kết quả WebKit 21/21 + 1 dòng Chromium 21/21, exit 0, 03:16:53–03:19:21Z, boot 2e430750, preview.tsx 530e10a7. Gate: `smoke/wait-t4-t5.log` ghi **GATE-FOUND poll=36 03:16:15Z t4=OK postboot=…/round151-t5/POSTBOOT_PASS (đường a)** → O8 bắt đầu 03:16:53Z, sau lượt yên hợp lệ #19 của T4. **Chuỗi WebKit FULL PASS 8 → 9 ĐÃ XÁC NHẬN ĐỘC LẬP.** Caveat (F-151-T10-2): chỉ có JSON báo cáo WebKit cuối cùng trên đĩa (lần chạy WebKit đầu tiên chỉ còn verdict trong log driver — hai lần chạy ghi đè cùng đường dẫn báo cáo); chuỗi 8 → 9 vẫn đứng vì cả hai lần đều 21/21 trong log.

### §10.3 RAM: T9 đúng, T2 sai cửa sổ (F-151-T9-7 đã xử lý)

T10 chạy `awk` trực tiếp trên `round151-t9/ram-sampler.log` (134 dòng): **max avail 3.243.888 kB (51,56% guard), min avail 250.840 kB** — khớp đúng số T9. File `ram-max.txt` của T2 đọc log **đợt 150** (`round150-t9/ram-sampler.log`, đỉnh 00:09:35Z boot e9295700) nên số 34,41% là đỉnh đợt 150, không phải đợt 151. **Chốt số chính thức đợt 151: RAM đỉnh 51,56% guard; RAM min 250.840 kB (245 MB) — kỷ lục thấp mới**, dưới kỷ lục 272 MB đợt 148 (T8 đo min 253 MB trong cùng cửa sổ kẹt, corroborate). Không cần đo lại.

### §10.4 Đếm cuối bằng dedup toàn cục MỚI (script `/tmp/count-final-151t10.py`, không cộng tay)

- Đợt 151 (trước closing): **9 batch / 14 entry / 14 file**.
- **Tái kiểm 111–150 = 388 batch / 774 entry / 658 file — KHỚP đúng số parent đã đính chính đợt 150** — chuỗi tái kiểm giữ nguyên lần thứ 33 liên tiếp.
- Lũy kế 111–151 (trước closing): **397/788/669**. Chờ push 136–151 (trước closing): **149/210/172**.
- Overlap đợt 151 với 111–150: **3 file** — `apps/web/scripts/test-vite-lock-v2.sh` (T6 đổi khối T7), `apps/web/scripts/vcut-webkit-postboot-check.sh` (T5 sửa cờ), `server/render/test_integration.sh` (T0 nối V19) — cả 3 đều trùng có lý do (sửa lại file đã có, không phải stage trùng vô ý).

### §10.5 Cây / lock / process lúc đóng

- Cây md5: preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676` (sau (A)), vcut-poll-quiet-v2.sh `1710e480`, test_integration.sh `a6b8cfc0` (sau nối V19). Không đổi ngoài ý muốn.
- Lock queue: 102 file (100 sau prune T6 + 2 cooldown T8-round151 thêm sau — đúng mẫu đợt 150). 0 process vite/webkit/chromium sót; /tmp/.X11-unix/ trống.
- Boot lúc đóng: `fad2aab9` (btime 03:25:16Z, #42); không reboot nào sau #42.
- Watcher replay-watch-151: pid gốc 49781 đã chết theo reboot #42; có 1 process khớp tên đang chạy (pid 15613) lúc đóng — T5-152 đối chiếu `replay-watch-151.log` (xem §11.8).
- **T10 KHÔNG chạy lại toàn bộ suite** (dựa vào suite 28/28 của T1-151 + kiểm md5/cây/lock lúc đóng — F-151-T10-3, cùng mẫu F-150-T10-2).

### §10.6 T10 đề xuất: CHẤP NHẬN đợt 151

Căn cứ: (1) 9/9 cờ `.done` trên đĩa, nội dung 9/9 luồng đủ; (2) T1 verify 150 PASS + suite 28/28 trên boot mới; (3) T0 xong nợ V19 (quyết (j)) với đếm 11 → 12 ghi rõ; (4) T2 đóng hoàn toàn 2 mù cùng một đợt (chờ parent xác nhận §12.1 (b)); (5) #22 có lượt hợp lệ mới sau 2 đợt 0 lượt + retry live kiểm chứng được; (6) O8 3/3 PASS sau lượt yên hợp lệ, chuỗi FULL PASS 8 → 9 đã xác nhận độc lập; (7) (A) kiểm chứng 120/120 PASS dưới churn; (8) replay tới tự nhiên + cache apt sống lại + cờ postboot sửa lỗi 8 ký tự (F-151-T5-1); (9) H3-D1 bác bỏ bằng dữ kiện (thu hẹp H3); (10) T9 tự bắt và sửa lỗi phụ lục bằng script.

### §10.7 Khiếm khuyết lớn của đợt (caveat — parent cân nhắc khi quyết)

(a) reboot #42 giữa harness (mở mù #74?); (b) 2 kẹt thật WebKit trong một đợt, 85m4 kẹt 3/4 lần chạy gần nhất — H3 vẫn mở dù đã thu hẹp; (c) headroom 90 / tỉ lệ-vite 0,057 — sâu nhất từ trước tới nay, lần đầu dưới 0,10; (d) RAM min 250.840 kB — kỷ lục thấp mới; (e) run 150 SUCCEEDED nhưng margin chỉ 177 s, nhạy với chứng nhận clock tại #41; (f) chỉ có JSON WebKit cuối cùng trên đĩa (F-151-T10-2); (g) T10 không chạy lại toàn bộ suite (F-151-T10-3); (h) P3' 32/34 lần đầu không tròn; (i) mask_anim.py nhiễm cửa đo T4 lần thứ ba; (j) birefnet 0 thử lần thứ năm liên tiếp; (k) T2 báo sai cửa sổ RAM đỉnh (đã xử lý ở §10.3, không ảnh hưởng số chốt).

### §10.8 Sai số của chính T10-151

- F-151-T10-1 — T4 báo cờ viết 03:15Z nhưng mtime file là 03:16Z (lệch 1 phút, không ảnh hưởng gate: cờ có trước GATE-FOUND 03:16:15Z).
- F-151-T10-2 — Chỉ có JSON báo cáo WebKit cuối cùng trên đĩa; lần chạy WebKit đầu chỉ còn verdict trong log driver (hai lần chạy ghi đè cùng đường dẫn). Chuỗi 8 → 9 vẫn đứng (cả hai lần đều 21/21 trong log), nhưng lần sau T8 nên giữ JSON riêng từng lần chạy.
- F-151-T10-3 — T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-151 + kiểm md5/cây/lock lúc đóng — cùng mẫu F-150-T10-2).

## §11. Nợ mở chuyển đợt 152

1. **Mù #74? MỞ (reboot #42, 2e430750 → fad2aab9, btime 03:25:16Z) — giao T2-152 chứng nhận** (nghịch lý đồng hồ 18 s — lớn nhất chuỗi 8/14/7/18 s — ghi nhận, không mở điều tra mới; dấu hiệu đồng hồ của T9: btime boot mới sớm hơn 15 s so với mẫu cuối boot cũ (03:25:31Z) — giao T2/T7 đối chiếu).
2. **Kết cục run 151 thuộc T7-152** (run vẫn `running` lúc T7 đóng cờ, hạn ngân sách 05:35:51Z).
3. **H3 vẫn mở, thu hẹp thành wedge "chết lặng"** (H3-D1 bác bỏ; H1 bác bỏ, H2 không ủng hộ — đứng nguyên). Đợt 152 T8 chỉ giám sát thụ động, không mở giả thuyết phân biệt mới trừ khi kẹt có chữ ký khác.
4. **Headroom 90 / tỉ lệ-vite 0,057 — dưới ngưỡng lần thứ 11 liên tiếp, sâu nhất từ trước tới nay, lần đầu dưới 0,10** (quyết (r) vẫn chỉ theo dõi — chờ quyết §12.1 (g) có đổi không). Trần 63.747 không đổi. Can thiệp host ngoài tầm cell.
5. **Birefnet 0 thử lần thứ năm liên tiếp** (cơ chế (a) armed cả phiên trừ gap 46 s tại #42; u2net là fallback chính thức; lần FIRE thật đầu tiên chưa kiểm chứng end-to-end). Giữ nguyên sampler + trigger cho đợt 152.
6. **P3' 32/34 — lần đầu không tròn trong một lượt hợp lệ** — theo dõi đợt 152, chưa đề nghị điều tra.
7. **mask_anim.py nhiễm cửa đo T4 lần thứ ba** (đợt 149 A2/A3, đợt 151 attempt1) — hướng dẫn đứng "job nặng tránh cửa đo T4" chưa được tuân triệt để; không có cơ chế cưỡng chế — chỉ ghi nhận.
8. **Watcher replay-watch-151: T5-152 đối chiếu `replay-watch-151.log`** (pid gốc 49781 chết theo #42; pid 15613 khớp tên đang chạy lúc T10 đóng — chưa rõ có phải watcher khởi động lại không).
9. **F-151-T5-3: nhánh `elif` trong poller T4 không `break`** — T4-152 sửa nếu chạm poller; hiện không còn ảnh hưởng thực tế sau sửa F-151-T5-1.
10. **Lists 37 = 1 mirror azure** (so với 71/2 mirror đợt 149) — chỉ ghi nhận, chưa rõ nguyên nhân.
11. **Prune lần 27 (T6-152):** tổng lock 100 sau prune 26, lúc T10 đóng đã là 102 (T8 thêm 2 cooldown) — kiểm lại lúc mở đợt 152.
12. **File oversize (cần `ENABLE_PRIVSEP=0` lúc push):** T2 LIMITS 44.632 B, T8 LIMITS 56.837 B, T9 LIMITS 59.786 B (đợt này); aggregate 151 + các LIMITS oversize đợt trước vẫn oversize. File 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
13. **Đếm suite mới: `npm test` nay là 12 pass (V19 đã nối)** — T1/T10 các đợt sau đọc 12, không phải 11; mọi văn bản cũ ghi "11 pass" là số cũ.
14. **T8 giữ JSON O8 riêng từng lần chạy** (F-151-T10-2 — hai lần WebKit ghi đè cùng đường dẫn báo cáo đợt này).
15. **Phụ lục số liệu chỉ viết bằng script trích từ log gốc** (bài học từ T9-151 tự bắt lỗi phụ lục gõ tay).
16. **Nợ đứng giữ nguyên:** G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16; quyết parent: để yên, không nhắc lại). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38 G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở theo quyết (g) đợt 143. u2net là fallback chính thức cho birefnet. Mù #64/#62/#61 đoạn B, #56 A, #55 B, #53 B, #51 B, #49 B — không kiểm lại (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

## §12. Chờ quyết parent

### §12.1 Câu hỏi mở (đánh số theo thứ tự ưu tiên — parent quyết, T10 không tự chốt)

(a) **Verdict đợt 151: CHẤP NHẬN hay không?** T10 đề xuất CHẤP NHẬN (xem §10.6). Caveat: reboot #42 giữa harness; 2 kẹt thật; headroom 90 sâu nhất; RAM min kỷ lục thấp; run 150 margin chỉ 177 s; T10 không chạy lại toàn bộ suite; chỉ có JSON WebKit cuối cùng trên đĩa.

(b) **Mù #72?/#73? đóng hoàn toàn → CERT 73 / FULL 88 + chuỗi đóng hoàn toàn 7 → 9 — xác nhận?** (T2 §4.5 (a).) G-full đóng theo luật gap (max 380 s), H đóng (max 702 s); gap #40 [7.696, 7.700] s, gap #41 [6.820, 6.824] s; cả hai số danh nghĩa nằm trong khoảng thật.

(c) **Khung chết #116? chốt 42 s hay 74 s?** (T2 §4.5 (b).) 42 s danh nghĩa (≈ 42 ± 2 s giờ thực, mốc runtime theo tiền lệ #115?) vs 74 s theo đồng hồ VM (dấu VM gần lúc chết bị drift phình — T2 đề xuất không dùng).

(d) **Nghịch lý đồng hồ ≥ +20 s tại #41 — ghi vào hồ sơ chính thức (GAP/aggregate) hay chỉ trong LIMITS T2?** (T2 §4.5 (c).) Cận mới mạnh hơn hẳn +7 s trong brief; đã chứng minh không làm rộng khoảng gap #41; chỉ ảnh hưởng cách đọc khung #116?.

(e) **Chuỗi ghim trần balloon — đợt mới trên boot fad2aab9 (31/134 mẫu, episode chính 04:09:18–04:36:19Z) có phải đợt ghim mới không?** (T9.) Cách đợt 150 hai reboot #41+#42 + xả sâu tới 3,58M kB + ~2h40m không ghim; còn mở 1 mẫu lúc đóng.

(f) **H3-D1 bác bỏ — chấp nhận? H3 thu hẹp thành wedge "chết lặng", đợt 152 chỉ giám sát thụ động?** (T8 §9.2.) Bằng chứng: RSS WebKitWebProcess giảm đơn điệu 353→271→215 MB, CPU TIME +13 s/393 s, VSZ không đổi — RAM tụt là nạn nhân của balloon + reclaim.

(g) **Headroom 90 / tỉ lệ-vite 0,057 (sâu nhất, lần đầu dưới 0,10) — giữ "chỉ theo dõi" (r) hay đổi?** (T9 §1.3.) Dưới ngưỡng lần thứ 11 liên tiếp; trần 63.747 không đổi; can thiệp host ngoài tầm cell.

(h) **RAM đỉnh đợt 151: chốt 51,56% (T9) hay 34,41% (T2)?** (F-151-T9-7.) T10 đã đối chiếu log gốc: 51,56% là số đợt 151; 34,41% là đỉnh đợt 150 do file `ram-max.txt` của T2 đọc nhầm cửa sổ. Parent xác nhận cách xử lý.

(i) **Run 150 SUCCEEDED margin 177 s — chấp nhận verdict của T7?** Caveat: margin nhỏ hơn mọi bước nhảy clock đã biết, kết cục nhạy với chứng nhận clock tại #41.

(j) **started_at bị viết lại ở cả #41 và #42 (n=4: #38 âm, #39/#41/#42 dương) — ghi nhận, điều tra (m) vẫn đóng?**

(k) **Reboot #42 / mù #74? — xác nhận xử lý theo mẫu T10-148?** (ghi rõ reboot giữa phiên + mù mở giao đợt sau, không sửa hồ sơ đã đóng). Nghịch lý 18 s (lớn nhất chuỗi) ghi nhận, không điều tra mới.

(l) **O8 chuỗi 8 → 9 — xác nhận?** T10 xác nhận độc lập bằng JSON + log gate. Caveat: chỉ có JSON WebKit cuối cùng trên đĩa (F-151-T10-2).

(m) **GAP §79 vẫn ghi số cũ 659/162 — đính chính ở §80 có đủ không (GAP §79 đã đóng không sửa)?** (F-151-T1-1.)

(n) **P3' 32/34 lần đầu không tròn — theo dõi hay điều tra?** (T4.)

(o) **mask_anim.py nhiễm cửa đo T4 lần thứ ba — có biện pháp gì không, hay chỉ ghi nhận?** (T4.)

(p) **T9 tự bắt lỗi phụ lục gõ tay — ghi bài học "phụ lục chỉ viết bằng script" vào checklist đứng?**

(q) **Watcher replay-watch-151 (pid gốc chết theo #42, pid 15613 khớp tên đang chạy) — giao T5-152 đối chiếu log, xác nhận đủ?**

(r) **F-151-T5-3 (poller T4 `elif` không `break`) — giao T4-152 sửa khi chạm poller, xác nhận đủ?**

(s) **Lists 37 = 1 mirror azure — chỉ ghi nhận?**

(t) **Kết cục run 151 thuộc T7-152 — ghi nhận.**

(u) **9/9 cờ `.done` trên đĩa lúc đóng — xác nhận quyết (t) đợt 150 đã có tác dụng, giữ nguyên quy định?**

(v) **(A) 120/120 PASS — chấp nhận (A) là khóa chính thức của khối T7? Chuỗi xanh kép 0 → 1, suite xanh về bản chất 32 → 33 — xác nhận?**

(w) **V19 nối vào suite (đếm 11 → 12) — chấp nhận đếm mới làm chuẩn đứng?**

(x) **T10 không chạy lại toàn bộ suite (F-151-T10-3) — chấp nhận cách đóng sổ này, hay đợt sau T10 phải chạy lại suite?**

### §12.2 (đã quyết ở §12.3 dưới)

### §12.3 QUYẾT PARENT (parent viết trực tiếp, ~12:1x +07 20/11/2026 — §12.3 trống khi đọc, T10 không điền sẵn, như đợt 146/147/148/149/150)

- **(a) Đợt 151: CHẤP NHẬN.** 9/9 luồng đủ nội dung trên đĩa + 9/9 cờ `.done`; T1 verify 150 PASS + suite 28/28 trên boot mới; T0 xong nợ V19; T2 đóng hoàn toàn 2 mù; #22 có lượt hợp lệ mới sau 2 đợt 0 lượt; O8 3/3 PASS sau lượt yên hợp lệ, chuỗi FULL PASS 8 → 9 đã xác nhận độc lập; (A) 120/120 PASS; replay tới tự nhiên + cache sống lại + sửa lỗi cờ 8 ký tự; H3-D1 bác bỏ bằng dữ kiện. Caveat ghi nhận, không cản chấp nhận: reboot #42 giữa harness; 2 kẹt thật; headroom 90 sâu nhất; RAM min kỷ lục thấp; run 150 margin 177 s; T10 không chạy lại suite; chỉ có JSON WebKit cuối cùng trên đĩa.
- **(b) Mù #72?/#73? ĐÓNG HOÀN TOÀN: XÁC NHẬN → CERT 73 / FULL 88, chuỗi đóng hoàn toàn 7 → 9.** Gap #40 [7.696, 7.700] s, gap #41 [6.820, 6.824] s, cả hai số danh nghĩa nằm trong khoảng thật — lần thứ hai liên tiếp sau #39, danh nghĩa đúng trong sai số ±2 s. Hai mù đóng cùng một đợt là lần đầu tiên.
- **(c) Khung #116?: CHỐT 42 s danh nghĩa (≈ 42 ± 2 s giờ thực).** Mốc runtime theo tiền lệ #115? là chuẩn ghi sổ; bản đọc 74 s theo đồng hồ VM không dùng (dấu VM gần lúc chết bị drift phình).
- **(d) Nghịch lý đồng hồ ≥ +20 s tại #41: GHI VÀO HỒ SƠ CHÍNH THỨC (GAP §80 + aggregate này).** Cận mới (mẫu cuối ram log T8-150 đóng dấu 01:26:12Z) mạnh hơn +7 s trong brief và nhất quán với nó (cận dưới yếu hơn ≥ +6 s). Đã chứng minh không làm rộng khoảng gap #41; chỉ ảnh hưởng cách đọc khung #116?. Không mở điều tra mới (theo quyết (p) đợt 150).
- **(e) Chuỗi ghim trần balloon: XÁC NHẬN đợt mới trên boot fad2aab9 (chuỗi mới từ 03:38Z), KHÔNG nối với đợt 150.** Dữ kiện: cách đợt 150 hai reboot #41+#42 + xả sâu tới 3,58M kB + ~2h40m không ghim. Episode chính 04:09:18–04:36:19Z (28 mẫu, 27 phút); mẫu chạm lại 04:52:19Z còn mở lúc đóng — giao T9-152 theo dõi tiếp.
- **(f) H3-D1 BÁC BỎ: XÁC NHẬN. H3 VẪN MỞ, thu hẹp thành wedge "chết lặng".** RAM tụt trong lúc kẹt là nạn nhân của balloon host + kernel reclaim (RSS giảm đơn điệu, CPU TIME gần như đứng yên, VSZ không đổi) — không phải process kẹt gây ra. Đợt 152 T8 chỉ giám sát thụ động; không mở giả thuyết phân biệt mới trừ khi kẹt có chữ ký khác.
- **(g) Headroom 90 / tỉ lệ-vite 0,057: VẪN CHỈ THEO DÕI, không đổi quyết (r).** Dưới ngưỡng lần thứ 11 liên tiếp, sâu nhất từ trước tới nay, lần đầu dưới 0,10. Vẫn không có hành động khả thi (can thiệp host ngoài tầm cell; vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **(h) RAM đỉnh đợt 151: CHỐT 51,56% guard (T9).** T10 đã đối chiếu log gốc: 34,41% của T2 là đỉnh đợt 150 do `ram-max.txt` đọc nhầm cửa sổ — sai cửa sổ, không phải tranh chấp số đo. RAM min đợt 151: **250.840 kB (245 MB) — kỷ lục thấp mới**, dưới kỷ lục 272 MB đợt 148.
- **(i) Run 150 SUCCEEDED: CHẤP NHẬN verdict của T7.** Margin 177 s là hẹp nhất chuỗi gần đây; caveat nhạy với chứng nhận clock tại #41 được ghi nhận, không đổi kết cục (2 lần đọc DB độc lập khớp nhau + events đầy đủ).
- **(j) started_at bị viết lại: GHI NHẬN — n = 4 (#38 âm, #39/#41/#42 dương).** Requeue sau #42 là nhanh nhất (btime +33,236 s). Điều tra (m) VẪN ĐÓNG — chỉ ghi nhận, không mở điều tra mới.
- **(k) Reboot #42 / mù #74?: XÁC NHẬN cách xử lý của T10 theo mẫu T10-148** (ghi rõ reboot giữa phiên + mù mở giao đợt sau, không sửa hồ sơ đã đóng). Nghịch lý đồng hồ 18 s (lớn nhất chuỗi 8/14/7/18 s) ghi nhận, không điều tra mới. Mù #74? giao T2-152.
- **(l) O8 chuỗi 8 → 9: XÁC NHẬN.** T10 xác nhận độc lập bằng JSON gốc (21/21 cả hai engine) + log gate (GATE-FOUND 03:16:15Z → O8 03:16:53Z, sau lượt yên hợp lệ #19). Caveat F-151-T10-2 ghi nhận (chỉ có JSON WebKit cuối cùng trên đĩa) — không ảnh hưởng chuỗi.
- **(m) GAP §79 ghi số cũ 659/162: ĐÍNH CHÍNH Ở §80 LÀ ĐỦ.** GAP §79 là hồ sơ đã đóng, KHÔNG sửa theo quy tắc đứng. Đính chính đã có trong GAP §80 + aggregate 151 §10.4 (tái kiểm 111–150 = 388/774/658 khớp). Không cần thêm.
- **(n) P3' 32/34: THEO DÕI đợt 152, không điều tra.** Lần đầu không tròn trong một lượt hợp lệ; nếu đợt 152 P3' lại không tròn thì mở xem xét.
- **(o) mask_anim.py nhiễm cửa đo T4 lần thứ ba: CHỈ GHI NHẬN.** Hướng dẫn đứng vẫn giữ nguyên; không có cơ chế cưỡng chế nào khả thi từ phía vòng lặp (job thuộc luồng khác) — ghi nhận là nợ vận hành, không mở điều tra.
- **(p) Bài học phụ lục T9: GHI VÀO CHECKLIST ĐỨNG — phụ lục số liệu chỉ viết bằng script trích từ log gốc, không gõ tay.** T9 tự bắt lỗi và sửa bằng script là mẫu tốt; T10-152 kiểm phụ lục các luồng bằng đối chiếu log gốc khi có nghi ngờ.
- **(q) Watcher replay-watch-151: GIAO T5-152 đối chiếu `replay-watch-151.log`.** Pid gốc 49781 chết theo #42 (đúng thiết kế chưa kiểm chứng — watcher sống qua reboot chưa kiểm chứng); pid 15613 khớp tên đang chạy lúc đóng chưa rõ có phải watcher khởi động lại không. T5-152 xác minh và báo rõ.
- **(r) F-151-T5-3: GIAO T4-152 sửa nhánh `elif` không `break` khi chạm poller.** Hiện không còn ảnh hưởng thực tế sau sửa F-151-T5-1 — không gấp.
- **(s) Lists 37 = 1 mirror azure: CHỈ GHI NHẬN.** Chưa rõ nguyên nhân; không điều tra riêng.
- **(t) Kết cục run 151: THUỘC T7-152. GHI NHẬN.**
- **(u) 9/9 cờ `.done`: XÁC NHẬN quyết (t) đợt 150 có tác dụng — GIỮ NGUYÊN quy định.** Từ đợt 152: mỗi luồng PHẢI viết cờ của mình trước khi báo đóng; T10 kiểm cờ trên đĩa và ghi rõ "x/9 cờ" trong §10.
- **(v) (A) là khóa chính thức của khối T7: XÁC NHẬN.** Kiểm chứng 120/120 PASS dưới churn (vượt mục tiêu ≥95%), đối chiếu (B) 2/30. Chuỗi xanh kép T7 0 → 1; suite xanh về bản chất 32 → 33. Quyết (b) đợt 150 đã chốt chuyển sang (A) — đợt này là kiểm chứng hoàn tất.
- **(w) Đếm integration 11 → 12: CHẤP NHẬN làm chuẩn đứng mới.** `npm test` nay đọc 12 pass; mọi văn bản cũ ghi "11 pass" là số cũ. T1/T10 các đợt sau đọc 12.
- **(x) T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 151** (dựa vào suite 28/28 của T1-151 chạy trên boot mới + kiểm md5/cây/lock lúc đóng). Đợt sau: T10 vẫn đóng theo mẫu này, nhưng nếu T1 không chạy được suite đầy đủ thì T10 phải chạy lại trước khi đóng.

- Ghi chú nguồn gốc: §12.3 trống khi đọc (T10 để trống, kèm chú thích HTML "Parent viết quyết trực tiếp vào đây"); nội dung các quyết trên là parent viết trực tiếp — KHÔNG có quyết nào được điền sẵn (như đợt 146/147/148/149/150).

---

## Batch stage / Tổng batch

Batch stage đợt 151 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round151-*.txt`):

- `phase9-round151-t0-v19.txt` — 2 entry (T0: V19 nối integration + LIMITS)
- `phase9-round151-t1-verify150.txt` — 1 entry (T1: LIMITS verify đợt 150)
- `phase9-round151-t2-eperm.txt` — 1 entry (T2: LIMITS EPERM + mù #72?/#73?)
- `phase9-round151-t4-quiet22.txt` — 3 entry (T4: LIMITS #22 + poll-wait + run-attempt scripts)
- `phase9-round151-t5-infra.txt` — 2 entry (T5: LIMITS infra + postboot script)
- `phase9-round151-t6-lockhealth.txt` — 2 entry (T6: LIMITS lock + test-vite-lock-v2.sh (A))
- `phase9-round151-t7-scheduler.txt` — 1 entry (T7: LIMITS scheduler)
- `phase9-round151-t8-viteharness.txt` — 1 entry (T8: LIMITS O8 + harness)
- `phase9-round151-t9-headroom.txt` — 1 entry (T9: LIMITS headroom + RAM + birefnet)
- `phase9-round151-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §80)

**Tổng batch đợt 151: 10 batch / 16 entry / 16 file duy nhất.**
**Lũy kế 111–151: 398 batch / 790 entry / 670 file.**
**Tổng batch chờ user push (đợt 136–151): 150 batch / 212 entry / 173 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)
