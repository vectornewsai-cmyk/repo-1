# PHASE9 — Đợt 158: LIMITS tổng hợp (aggregate)

Đợt 158 (lượt cron 06:35 +07 21/11/2026 = 23:35:51Z 20/11/2026; hạn cứng đóng 02:30Z 21/11; T10 đóng sổ ~02:1xZ, trong hạn cứng). Verdict đề xuất: **CHẤP NHẬN** (chờ quyết parent §12.3).

**Tóm tắt một dòng:** không reboot mới lúc mở (boot #58 giữ nguyên); run 157 SUCCEEDED (margin 345 s); điểm (m) DƯƠNG MỚI #58 +42,529 s và #59 +35,173 s (n ứng viên 17 hoặc 18); lượt yên #27 CÓ lượt hợp lệ #23; O8 PASS 3/3 trên CÙNG boot đo (#58, gate FOUND chuẩn lần đầu kể từ đợt 153) — T10 đề xuất chuỗi LÊN 13 (chờ parent); harness 4/6 + 2 KẸT THẬT WebKit mới (85m4, 86n2; kẹt cộng dồn 11 → 13); (A) 120/120 lần thứ 8 (tổng 960/960); prune 33: queue 101 → 100; POSTBOOT_PASS #58 ĐÃ CÓ (nhanh nhất từ trước); #57 KHÔNG CÓ, không bù được; mù #89?/#90? ĐÓNG theo luật gap, #88? VẪN MỞ; CERT/FULL chính thức GIỮ 76/91; INSIDE chuỗi 4; headroom 0 → 0 (dưới ngưỡng lần thứ 18); balloon 2 episode mới 38/136; birefnet 0 thử lần thứ 12; ENOSPC ≥50 dòng; reboot #59 (eec65561, btime 01:33:47Z) giữa phiên, viết lại run 158 lần 1 — kết cục thuộc T7-159.

## §1. T0 — Boot survey: KHÔNG reboot mới lúc mở + đồng hồ về giờ thật + POSTBOOT #58 thực tế đã xong + O8 live BỎ QUA có chủ ý

- **KHÔNG reboot mới kể từ T10-157 đóng (23:28:45Z). Boot #58 giữ nguyên: `28366bd0`, btime /proc/stat 1795215968 = 23:06:08Z** — 6 nguồn khớp (btime, boot_id, uptime ×2, journal first entry 23:06:19Z, wtmp 1 entry, Date header ngoài).
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s** — không còn dấu hiệu chạy nhanh ~42–50' như đợt 156 (T2-158 giao xác minh; T2 xác nhận btime #58 = 23:06:08Z GIỜ THẬT, drift test tỉ lệ 0,9973). GitHub Date dao động ~9 s, không dùng làm chuẩn (F-158-T0-2).
- **Watcher lúc mở: 0** (quy tắc đứng (3)) — T5-158 khởi động lại bằng tay watcher-158 pid 10867 (23:43:21Z) + T9 b2-watcher pid 9792 (23:41Z). T0 không khởi động watcher.
- **POSTBOOT_PASS #57/#58: CHƯA CÓ cờ lúc T0 đóng** (T5-158 sở hữu). Trạng thái postboot thực tế trên #58 ĐÃ XONG: check-only exit 0, 11/11 gói đủ, GST 269, cache 178 .deb, lists 34; replay bracket (0'42", 2'43"] từ dpkg.log.
- **O8 live: BỎ QUA có chủ ý, 0 attempt** — T8-158 đang chuẩn bị O8 chính thức (mở 23:41Z, waiter deadline 01:30Z); tránh tranh vite lock/CPU. Không phải lỗi F-156-T0-1.
- Cơ chế O8 JSON CÒN ĐÚNG: md5 JSON T8-156 khớp (78ac5a61/831d4b9b/7e4d9dd9, đều 21/21 ok), latest = stamped cuối; cây md5 khớp (preview 530e10a7, media 2c384ed1, vite.config ee80d093, effects.js fedc0141 — `server/render/src/effects.js`; xem §10.5).
- Sai số riêng: F-158-T0-1 (md5 sai đường dẫn lúc đầu), F-158-T0-2 (kết luận vội từ 1 lần đo GitHub Date), F-158-T0-3 (kiểm gói sai tên plugins-gl).
- Stage: `phase9-round158-t0-boot-o8.txt` (1 entry NUL). LIMITS: `docs/PHASE9_ROUND158_T0_BOOT_O8_LIMITS.md` (13.978 B). Không sửa code repo; không push/tag.

## §2. T1 — Verify đợt 157: PASS

- **Đếm (script count-final-158-t1.py VIẾT MỚI HOÀN TOÀN, dedup toàn cục): đợt 157 = 10 batch / 13 entry / 13 file** (gồm closing); lũy kế 111–157 = 458/872/743; chờ push 136–157 = 210/294/247; tái kiểm 111–156 = 448/859/731, 111–155 = 438/846/719, 111–154 = 428/833/707, 111–153 = 418/818/695 — **KHỚP từng số, lần thứ 46 liên tiếp**. Purity 0 lỗi, 0 file thiếu, overlap 1 (GAP closing §86). Oversize 6,4 MB là file đợt 96, không nằm trong chờ push 136–157.
- **Suite chạy lại 28/28 exit 0** (23:43:17–23:50:21Z, 7m04s, boot 28366bd0, RAMavail 1.209 MB); `npm test` 12 pass; cây md5 không đổi trước/sau suite (preview 530e10a7, media 2c384ed1, vite.config ee80d093, effects fedc0141).
- O8 xác nhận độc lập: WebKit 21/21 ×2 (pid17522 md5 3e3adde0 + pid17877 md5 a15652fe) + Chromium 21/21 (pid18288 md5 37ab741b), boot bcbaa3ad, O8 DONE 22:34:52Z; latest == stamped cuối từng loại; waiter WAIT-DEADLINE 22:30Z poll=84 GATE NOT MET. Chuỗi FULL PASS LÊN 12 (quyết parent (h) đợt 157).
- T4 poll đếm lại: 24 poll thật + 1 test-log = 25 — KHỚP; attempt1 20/20, tickCost median 41,0 ms (n=664, JSON gốc) — KHỚP. T6 lock chạy lại: 457 cặp (ACQUIRED 467 / RELEASED 457) — KHỚP T6; **ĐÍNH CHÍNH T1-157 §8 trích sai cột** (447 là số T6-156) — F-158-T1-6. T9 RAM/balloon/B2 đếm lại khớp (max 2.612.316 / min 357.616 / mean 1.054.818 / gate A 53; balloon 33; B2 13 spike). Harness 5/6 + kẹt thật 84l10 exit 124 (summary gốc). POSTBOOT_PASS #56 CÓ; #53/#54/#55 KHÔNG CÓ. 9/9 cờ đợt 157 còn trên đĩa, đều có nội dung (kích thước khớp §10.1 aggregate 157).
- **GAP §86 CÒN NHÃN CŨ so với quyết parent đợt 157** (header verdict; chuỗi LÊN 12; mô hình đồng hồ Model 1; điểm (m) #57 đã chấp nhận; F-157-T1-1 chưa ghi ĐÓNG — F-157-T1-3 ĐÃ ĐÓNG) — T10-158 cập nhật khi viết §87 (F-158-T1-4; xem §10.5/GAP §86).
- Sai số riêng: F-158-T1-1..7 (xem LIMITS §11; gồm 2 lần chạy python lỗi giả định cấu trúc JSON đã sửa, lệnh khởi động suite báo failed giả do output-drain-timeout, đính chính T1-157 §8).
- Stage: `phase9-round158-t1-verify157.txt` (1 entry NUL, od -c OK). LIMITS: `docs/PHASE9_ROUND158_T1_VERIFY157_LIMITS.md` (26.269 B, dưới trần 37.768 B). KHÔNG PUSH.

## §3. T2 — EPERM probe #77 + mù #89?/#90? ĐÓNG theo luật gap + #88? VẪN MỞ + INSIDE chuỗi 4

- **Probe EPERM #77: 23:45:15Z, boot 28366bd0 (#58), ok=2 fail=0, log 220 → 223 (+3).** Cửa sổ 20:42:50Z → 23:45:15Z = 10.945 s. F121? ≈ +1 s (3 server); drift test tỉ lệ 0,9973 → btime #58 = 23:06:08Z GIỜ THẬT. EPERM 0 sóng thật (sóng gần nhất ~11:55–12:11Z 11/11).
- **Mù #89? (#57): ĐÓNG** — E2 max gap 86 s (file) / 60 s (union); F max gap file 1.279 s VƯỢT sàn nhưng union file+nội dung 103 s (sampler 21 dòng + waiter 21 poll trong hố, cadence 60 s, boot=bcbaa3ad) → ĐÓNG theo tiền lệ "mốc file là cận trên bảo thủ"; **trình rõ cả hai số để parent bác nếu không chấp nhận mốc nội dung (F-158-T2-5)**.
- **Mù #90? (#58): ĐÓNG** — F như trên + G max gap 416 s (file) / 404 s (union), head +38 s sau CLOCK RULE. Nhãn #90? ↔ #58 theo quy tắc +32; KHÔNG có reboot mới sau 23:28Z nên không có #59/#91? (lúc T2 đóng — #59 xảy ra sau, giao T2-159).
- **Mù #88? (#56): VẪN MỞ** — hole-recheck hố đầu E: 345 hit, 0 mốc mới.
- **Reboot #58 XÁC NHẬN độc lập 6 nguồn** (28366bd0, btime 23:06:08Z giờ thật). **INSIDE: #57 INSIDE FULL103 → chuỗi 3 (xác nhận); #58 INSIDE FULL104 → chuỗi 4 (mới).** Dải boot sau: [23:31:24Z 20/11, 01:26:22Z 21/11].
- **CERT/FULL chính thức GIỮ 76/91.** Ứng viên: CERT89/FULL104 + CERT90/FULL105 (chỉ trình, không chứng nhận).
- **Mô hình đồng hồ + (m) #56: KHÔNG thu hẹp được cửa** (R 2,56251–2,66817; J 2.566–2,80753 s) — đã thử 4 hướng, không neo mới; **n GIỮ 14**. Kết quả phụ: timestamp session runtime = khung wall cell (củng cố quy gán D + cận dưới R).
- **(m) #57 DƯƠNG +47,698 s đã chấp nhận** (ghi nhận). **(m) #58 MỚI +42,529 s** (T7-158 NOTES #1) — ghi nhận, T7 sở hữu phán.
- **WFS #64 chênh 0** (985/289, R7b 1.010/306, copies 25/17) — lần thứ 64. RAM peak 41,52% guard; birefnet 0 thử lần thứ 12. Async `.writeFile(` 0 stray.
- **Run 157 SUCCEEDED 23:30:06Z, margin 345 s** (T7-158 NOTES #1). POSTBOOT_PASS #58 ĐÃ GHI 23:43:22Z; #57 KHÔNG CÓ (T5-158).
- Nghịch lý mới: **#58 đồng hồ cũ nhanh ~+28 s lúc chết.** Khung chết #133?/#134? KHÔNG xác định.
- Sai số riêng: F-158-T2-1..7 (xem LIMITS §6.2).
- Stage: `phase9-round158-t2-eperm.txt` (1 entry NUL, od -c OK). LIMITS: `docs/PHASE9_ROUND158_T2_EPERM_LIMITS.md` (42.716 B, oversize — cần ENABLE_PRIVSEP=0 lúc push). KHÔNG PUSH.

## §4. T4 — Lượt yên #27: CÓ LƯỢT HỢP LỆ (#23) — chuỗi nối dài #22 → #23

- **#27 CÓ LƯỢT HỢP LỆ — attempt3 20/20, lớp B 5/5, tickCost median 41,0 ms ≤ 60** (23:53:09–23:57:16Z, boot 28366bd0 #58; per-pass 36,0–52,0 ms, 20/20 pass ≤ 60). Poller: 18 poll thật (1 test + 17), 1 boot, 1 instance duy nhất; 3 lần cửa mở (#12/#16/#17); RAM ≥1024: 17/18, 0 poll <500 MB; gate0 T5 15 poll / T4-check-only 3 poll; apt>0: 0.
- **Attempt1 (23:50:36Z) + attempt2 (23:53:00Z): lỗi setup exit 2, KHÔNG CÓ JSON — thiếu b.json do copy-forward của chính T4 (F-158-T4-1/2); KHÔNG PHẢI PAGE-WEDGED.** Đề xuất pre-flight check bắt buộc (§7(d) LIMITS T4 — chờ parent phán, xem §12.1 (t)).
- **(c2)=7 occ / 7 distinct-seq [153, 234, 289, 318, 378, 436, 463], COVERED 7/7; P1 ĐÚNG 7/7, P2 ĐÚNG 7/7 (lag +1f), P3-A1 ĐÚNG 7/7, P3' 7/7 ĐẠT, P7 ĐÚNG; lag≥+5f = 0.**
- **KHÔNG PAGE-WEDGED (0 wedge đợt thứ hai liên tiếp).**
- **Cộng dồn MỚI (23 lượt hợp lệ): P1 86/87, P2 78/78, P3-A1 72/87, P3' 51/59 occ = 51/54 distinct-seq, P7 57/57.**
- Cờ T5-158 CÓ (POSTBOOT_PASS 23:43:22Z, replay đầy đủ). Cây preview.tsx md5 530e10a7 không đổi.
- **GATE cho chuỗi FULL PASS ĐẠT từ phía T4** (lượt yên hợp lệ #27 trên boot 28366bd0) — T8/T10 quyết.
- Stage: `phase9-round158-t4-quiet27.txt` (3 entry NUL, od OK). LIMITS: `docs/PHASE9_ROUND158_T4_WEBKIT_QUIET27_LIMITS.md` (28.970 B). KHÔNG PUSH.

## §5. T5 — Infra: watcher-158 + POSTBOOT_PASS #58 ĐÃ CÓ (nhanh nhất từ trước) + #57 KHÔNG CÓ, không bù được

- **Watcher-158 khởi động bằng tay 23:43:21Z pid 10867**, boot 28366bd0 (#58, btime 23:06:08Z), poll đều 30 s (kiểm cuối 23:47:10Z).
- **POSTBOOT_PASS #58 ĐÃ GHI 23:43:22Z (boot+37m14s, replay đầy đủ, poll=0, dpkg 1545, cache 178, lists 37, GST 269, 11/11 gói + 5/5 lib) — cờ NHANH NHẤT từ trước; replay #58 nhanh nhất (boot+42s → boot+2m43s).**
- **POSTBOOT_PASS #57 KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (journal + dpkg.log đã mất; T8-157 đã tự kiểm đầy đủ + O8 3/3 PASS trên #57 — CHECK, không phải cờ; T5 KHÔNG ghi cờ hộ). **Boot thứ 5 liên tiếp lọt** (#51, #53, #54, #55, #57).
- Marker sống qua 10 reboot #49–#58. Hướng (3) vẫn đúng.
- **ENOSPC #58: 34 dòng lúc 23:46:39Z** (số riêng T5).
- Sai số: F-158-T5-1 (pgrep tự khớp); F-158-T5-2 (exec khởi động watcher báo output_drain_timeout giả — watcher vẫn chạy đúng, không khởi động lại); F-158-T5-3 (grep đệ quy >285 s đã kill, thay bằng grep đích danh).
- Stage: `phase9-round158-t5-infra.txt` (1 entry). LIMITS: `docs/PHASE9_ROUND158_T5_INFRA_LIMITS.md` (30.595 B). KHÔNG PUSH.

## §6. T6 — Lock health: (A) 120/120 lần thứ 8 liên tiếp (tổng 960/960) + prune lần 33

- **(A) CÒN NGUYÊN + kiểm chứng lại DƯƠNG TÍNH: 120/120 PASS dưới churn (lần thứ 8 liên tiếp, tổng 960/960); suite 9/9 ×6 (23/26/31/23/23/26 s, rc=0); block md5 dc973443 / live-code c92f2efff khớp đợt 151–157. Chuỗi xanh kép 7 → 8; suite xanh 39 → 40.**
- **Lock KHỎE: 468 cặp lúc kiểm cuối, 0 đang giữ, 0 TIMEOUT mới, 0 KHÔNG NHẢ, double-acquire giữ 10 (0 ca mới); 202 chu kỳ sạch trên thứ tự mới đợt 135.**
- **Reboot #57/#58 KHÔNG giết holder** (lock trống ≥80 s trước #57; release cuối t8-round157 ≈ btime #58 theo đồng hồ boot cũ nhanh ~+28 s; 0 STALE-LOCK, 0 orphan). KHÔNG reboot trong phiên T6. Đồng hồ đã về giờ thật (T0-158).
- **Prune lần 33: xóa cooldown-t6 (15/11 08:55:05Z, 135,12h) lúc 00:02:31Z 21/11 sau khi chờ t4-158 nhả lock (RELEASED 23:56:51Z hold 207 s); queue 101/1414 → 100/1400.** F-147-T6-1 nối lại lần thứ 9 liên tiếp.
- Sai số riêng: F-158-T6-1 (/usr/bin/time không tồn tại, rc=127 ×6 lần đầu), F-158-T6-2 (header harness sót "đợt 157"), F-158-T6-3 (waiter ghi nhầm "TRONG" thay vì "TRỐNG").
- Stage: `phase9-round158-t6-lockhealth.txt` (1 entry NUL). LIMITS: `docs/PHASE9_ROUND158_T6_LOCKHEALTH_LIMITS.md` (42.150 B, oversize — cần ENABLE_PRIVSEP=0 lúc push). KHÔNG PUSH.

## §7. T7 — Scheduler: run 157 SUCCEEDED + điểm (m) DƯƠNG MỚI #58 +42,529 s và #59 +35,173 s + n ứng viên 17/18

- **Run 157: SUCCEEDED 23:30:06Z** (event 23:30:06.022Z, eid 9545), wall gốc 10.455 s, **margin 345 s** tới hạn 23:35:51Z (hẹp thứ hai từ đợt 150, chỉ sau run 150: 177 s). Claimed 23:29:55Z (finished − 11 s, trở lại họ 7–8 s). 2 lần đọc DB khớp nhau.
- **Reboot #58 lúc mở (28366bd0, btime thật 23:06:08Z, quyết (s) đợt 157): VIẾT LẠI run 157 lần 2 — ĐIỂM (m) DƯƠNG MỚI +42,529 s** (requeue 23:06:50.529Z, eid 9539), trong dải 33–49,8 s, tính CÙNG KHUNG giờ thật (điểm dương thứ hai tính hoàn toàn bằng giờ thật).
- **Reboot #59 giữa phiên (eec65561, btime thật 01:33:47Z — T7 xác minh 6 nguồn + github Date khớp; sleep 1.500 s bị SIGTERM giết ~5 s sau btime, cùng mẫu đợt 156/157): VIẾT LẠI run 158 lần 1 — ĐIỂM (m) DƯƠNG MỚI +35,173 s** (requeue 01:34:22.173Z, eid 9572), trong dải 33–49,8 s, tính CÙNG KHUNG giờ thật (điểm dương thứ ba tính hoàn toàn bằng giờ thật). Run 157 không bị #59 viết lại (finished trước #59 7.421 s).
- **n (m): chính thức (ứng viên) GIỮ 14 theo quyết (g) đợt 156; ứng viên mới (ghi nhận, chờ parent) 17 (15 dương + 2 âm, nhánh khuyến nghị) hoặc 18 (15 dương + 3 âm, nhánh #56 ÂM) nếu tính cả #58 + #59.** #56 VẪN CÓ ĐIỀU KIỆN (T2-158 không thu hẹp được cửa: R 2,56251–2,66817 / J 2,566–2,80753 s). Dải dương GIỮ 33–49,8 s. Điều tra (m) VẪN ĐÓNG.
- **Slot: HB 7/7 (−316 s ×7, 0 muộn), DR 3/3 (0 s ×3) — CỬA LÀNH HOÀN TOÀN lần thứ 6 liên tiếp.** Lũy kế: HB 44/339, DR 49/240 (số thiếu +0).
- **Run 158 vẫn running lúc đóng cờ** (tuổi gốc 8.416 s, còn 2.384 s tới hạn 02:35:51Z) — kết cục thuộc T7-159. Jitter 0 s (lần thứ 11 liên tiếp).
- Sai số riêng: F-158-T7-1 (NOTES đọc #2 ước tuổi run 158 sai 18 s — ĐÃ SỬA, phụ lục script khớp).
- Stage: `phase9-round158-t7-scheduler.txt` (1 entry NUL, od -c OK). LIMITS: `docs/PHASE9_ROUND158_T7_SCHEDULER_LIMITS.md` (35.601 B — dưới trần 37.768 B). KHÔNG PUSH. KHÔNG release/tag. Không sửa code repo.

## §8. T8 — Vite harness + O8: O8 PASS 3/3 CÙNG BOOT (gate FOUND chuẩn) + harness 4/6 + 2 KẸT THẬT WebKit mới

- **O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT: WebKit 21/21 ×2 (00:07:35 pid42749 md5 7bd1df7a + 00:08:27 pid43157 md5 4fe2c39a) + Chromium 21/21 (00:09:14 pid43575 md5 ddba361d), O8 DONE 00:10:07Z, 2'32".** GATE-FOUND poll 25 lúc 00:06:28Z (t4=OK + POSTBOOT_PASS dương (a) T5 23:43:22Z — T10 xác minh độc lập từ waiter log gốc, xem §10.2); lượt yên #27 CÓ lượt hợp lệ #23 (attempt3 20/20, B 5/5, tickCost 41,0 ms, boot #58 — ĐÚNG boot đo). **Chuỗi WebKit FULL PASS 12 → ? — T10 đề xuất LÊN 13 (xem §10.2/§12.1 (h)); T8 không tự chốt.**
- **HARNESS 4/6 PASS + 2 KẸT THẬT WebKit** (một lần chạy driver duy nhất 00:10:25–00:49:48Z, 39'23"): 84l10 PASS (E4 ended=true — KHÔNG tái kẹt E4-setup đợt 157) + **85m4 KẸT exit 124 (P4-lần3 waitForPlaySync, playhead đóng băng 0.267, 00:11:53–00:26:54Z)** + **86n2 KẸT exit 124 (P2-entry runEngine:439 sau P1 PASS, 00:27:10–00:42:11Z)** + 3 pha Chromium PASS. **Kẹt cộng dồn 11 → 13; chuỗi "P3 không kẹt" VẪN 0; 85m4 HẾT KẸT giữ 4 đợt DUT.**
- **WATCHDOG: 2 kích hoạt ĐÚNG (1 mỗi kẹt) + probe TIMEOUT cả hai, 0 false-positive. LIVE-DIAG: 2/2 ở 86n2, 0/2 ở 85m4 — ĐIỂM MÙ MỚI: HB128 heartbeat in snapshot cứ mỗi 5 s làm tươi log mtime (F-158-T8-4; watchdog vẫn bắt được).** Đề xuất bổ sung kiểm "nội dung tươi" hoặc ghi nhận làm giới hạn đứng (xem §12.1 (u)). H3 VẪN MỞ, chỉ giám sát thụ động.
- FIXTURE: rebuild 1 lần lúc mở (quy tắc (l)), md5 khớp đợt 125 (h fbaa3d1a); kiểm lại trước harness còn nguyên, không cần rebuild lần 2 (0 reboot).
- DEADLINE WAITER: ĐÃ KIỂM date -d ra epoch 1795224600 (01:30Z 21/11) TRƯỚC khi start — waiter thoát sớm nhờ GATE-FOUND 00:06:28Z, không chờ tới deadline.
- SAMPLER: n=79, balloon max 97,9% trần, pinned=0; avail min 168 MB @00:39:56Z (trong lúc 86n2 kẹt — thấp nhất các đợt gần đây).
- CHECKLIST (o): cả hai symlink diag → round158-t8, giữ cả phiên.
- Cờ trong hạn cờ ~02:00Z (đóng ~01:00Z, dư ~1 giờ).
- Stage: `phase9-round158-t8-viteharness.txt` (1 entry, NUL-delimited, od OK). LIMITS: `docs/PHASE9_ROUND158_T8_VITEHARNESS_LIMITS.md` (44.109 B, oversize — cần ENABLE_PRIVSEP=0 lúc push). KHÔNG push. KHÔNG release/tag.

## §9. T9 — Headroom + RAM + balloon: headroom 0 lần thứ 18 + balloon 2 EPISODE MỚI 38/136 + RAM min thấp nhất kể từ đợt 151

- **Headroom 0 → 0** (6 lần đo, trần 63.747 không đổi; dưới ngưỡng lần thứ 18 liên tiếp).
- **RAM sampler 136 mẫu 23:41:02Z–01:56:25Z, 2 boot (114 #58 28366bd0 + 22 #59 eec65561); min 199.248 kB (194,6 MiB) lúc 00:40:04Z — thấp nhất kể từ đợt 151; max 2.250.420 kB (35,77% guard) lúc 00:01:03Z; mean 851.120 kB; gate A 39/136; 0 mẫu ≥ guard.**
- **Balloon GHIM TRẦN 2 EPISODE MỚI, 38/136 mẫu (27,9%), 4 chuỗi, 2 boot: A = chuỗi 1+2+3 trên #58 (30 mẫu, dip nông 94,5%/97,4%, chuỗi 3 bị reboot cắt — không quan sát được điểm đứt) + B = chuỗi 4 trên #59 (8 mẫu, đứt quan sát được 01:55:25Z).** T10 xác minh độc lập cách đếm bằng ngưỡng đúng bal == 6.443.824 (xem §10.3).
- **B2: 12 spike, 11 quy được driver (T2 grep ×3, T1 tsc ×3, ffmpeg/mask_anim ×3, O8 clicktest ×2) + 1 load1 dư (23:55:01Z, trong cửa sổ attempt3 T4); 0 spike trong cửa sổ balloon ghim.**
- **ENOSPC ≥50 dòng trên 2 boot (#58 ≥34 — số quan sát cuối của T5 23:46:39Z, phần tăng sau mất theo reboot; #59: 16 dòng lúc đóng). Cận dưới.**
- **Birefnet 0 lần thử — lần thứ 12 liên tiếp;** cơ chế (a) armed cả phiên (trừ gap 80 s tại reboot #59).
- **Reboot #59 eec65561 btime 01:33:47Z** (T9 tự xác nhận theo đếm tuần tự — T7 xác minh 6 nguồn, T10 đối chiếu, xem §10.5); **mẫu cuối boot #58 01:34:05Z nằm 18 s SAU btime #59 — clock #58 nhanh ≥18 s cuối phiên** (T0-158 đã xác minh đúng ±1 s lúc mở); gap sampler 80 s theo timestamp (≥98 s giờ thật).
- Lượt yên #27 CÓ lượt hợp lệ #23 (T4 attempt3 23:53:09–23:57:16Z; sampler T9: gate A MỞ 2/5 mẫu trong cửa sổ, mẫu 23:53:03Z thiếu gate chỉ 688 kB). T8-158: O8 PASS 3/3 cùng boot; harness 4/6 + 2 kẹt thật WebKit (85m4, 86n2), kẹt cộng dồn 11 → 13. T7-158 ĐÃ đóng ~02:02Z: run 157 SUCCEEDED 23:30:06Z, margin 345 s; #58 viết lại run 157 lần 2 — điểm (m) DƯƠNG MỚI +42,529 s; #59 viết lại run 158 lần 1 — điểm (m) DƯƠNG MỚI +35,173 s; n (m) ứng viên mới 17 hoặc 18 — chờ parent quyết; #56 VẪN CÓ ĐIỀU KIỆN.
- Stage: `phase9-round158-t9-headroom.txt` (1 entry NUL, od -c OK). LIMITS: `docs/PHASE9_ROUND158_T9_HEADROOM_LIMITS.md` (68.441 B, 136 mẫu phụ lục A). KHÔNG PUSH.

## §10. T10 — Kiểm chứng độc lập lúc đóng

### §10.1 Cờ `.done`: 9/9 CÓ MẶT trên đĩa lúc đóng, TẤT CẢ CÓ NỘI DUNG

`ls -la` + `stat` trực tiếp `hidden_files` lúc đóng (~02:1xZ): round158-t0.done 23:51:03Z 1.598 B, t1 23:57:17Z 2.671 B, t2 00:31:14Z 2.476 B, t4 00:06:12Z 1.568 B, t5 23:51:05Z 960 B, t6 00:06:50Z 1.341 B, t7 02:02:24Z 2.457 B, t8 01:01:22Z 2.039 B, t9 02:09:38Z 2.016 B. **9/9 cờ đủ, 9/9 có nội dung** (t3 không có theo thiết kế; quyết (l) đợt 152 giữ trọn vẹn đợt thứ sáu liên tiếp — đợt 153, 154, 155, 156, 157 cũng 9/9 có nội dung). 7/9 cờ trong hạn cờ ~02:00Z; **t7 02:02Z trễ ~2 phút và t9 02:09Z trễ ~9 phút so với hạn cờ, cả hai trong hạn cứng 02:30Z** (t7 trễ do viết LIMITS + stage sau đọc cuối #6 lúc 01:56Z; t9 trễ do sampler chạy tới 01:56:25Z + viết LIMITS 68.441 B — xem F-158-T10-5; trễ giờ, không thiếu nội dung). Nội dung 9/9 luồng đủ trên đĩa (LIMITS + paths + thư mục làm việc).

### §10.2 O8 xác nhận độc lập + ĐỀ XUẤT CHUỖI: LÊN 13 (parent quyết)

Đọc JSON gốc bằng python (không tin mù LIMITS T8): 2 file WebKit stamped riêng biệt — `o8w-clicktest-report-2026-11-21T00-07-35-28366bd0-pid42749.json` (21 kết quả, 21 ok=true, 0 fail, md5 `7bd1df7a…`, pid 42749) và `o8w-clicktest-report-2026-11-21T00-08-27-28366bd0-pid43157.json` (21 kết quả, 21 ok=true, 0 fail, md5 `4fe2c39a…`, pid 43157 — **md5 khác attempt1, không ghi đè**); Chromium `o8-clicktest-report-2026-11-21T00-09-14-28366bd0-pid43575.json` (21 kết quả, 21 ok=true, 0 fail, md5 `ddba361d…`, pid 43575). Bản `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `4fe2c39a`; Chromium latest = `ddba361d`) — đúng thiết kế "latest" của T0-152. Log driver `o8-158t8.log`: `O8 DONE 2026-11-21T00:10:07Z webkit1=0 webkit2=0 chromium=0`, 3 dòng `21/21 pass, 0 fail`, 00:07:35–00:10:07Z, boot 28366bd0.
**Gate — T10 đối chiếu waiter log gốc:** waiter (`smoke/wait-t4-t5.log`) 24 dòng `GATE-NOT-YET` rồi **`GATE-FOUND poll=25 00:06:28Z t4=OK postboot=…/round158-t5/POSTBOOT_PASS (duong a) t4attempt=no-lock`** — waiter THOÁT SỚM nhờ gate tìm thấy, không chờ tới deadline 01:30Z (deadline đã kiểm epoch 1795224600 trước khi start — khắc phục F-156-T8-3 giữ vững). **Đây là lần đầu tiên kể từ đợt 153 gate được tìm thấy theo đường chuẩn (t4=OK + POSTBOOT_PASS có sẵn), không phải bằng thủ tục (i) sau khi waiter hết hạn** — chân postboot lần này là cờ thật, không phải tự kiểm bù.
**Harness — T10 xác nhận độc lập từ 6 report JSON gốc:** 4× `ok=true` (WebKit 84l10 finishedAt 00:11:33.141Z; Chromium 84l10 00:43:27.016Z; Chromium 85m4 00:45:41.196Z; Chromium 86n2 00:49:40.277Z) + 2× `ok=false` (WebKit 85m4 `m4-webkit-w7-report.json` finishedAt 00:26:54.085Z; WebKit 86n2 `n2-webkit-w7-report.json` finishedAt 00:42:10.935Z — cả hai ghi lúc timeout kill). **Harness 4/6 + 2 kẹt thật đứng.**
**ĐỀ XUẤT CHUỖI — T10 đề xuất: chuỗi WebKit FULL PASS LÊN 13 (parent quyết cuối ở §12.1 (h)).** Căn cứ: (1) kết quả O8 đã xác nhận độc lập (21/21 ×3 trên boot 28366bd0, JSON stamped riêng biệt, log driver khớp) — kết quả này ĐỨNG, ghi nhận là PASS 3/3; (2) đợt này **CÓ lượt yên hợp lệ trong đợt** — attempt3 T4 20/20, lớp B 5/5, tickCost median 41,0 ms ≤ 60, 23:53:09–23:57:16Z; O8 chạy 00:07:35Z, **SAU lượt yên về mặt thời gian, TRÊN CÙNG BOOT #58** — điều kiện chữ của tiền lệ đợt 150 + quyết (j) đợt 153 + quyết (g) đợt 154 + quyết (f) đợt 155 + quyết (f) đợt 156 + quyết (h) đợt 157 ("chuỗi các lượt O8 chạy SAU MỘT LƯỢT YÊN HỢP LỆ") được thỏa theo cách sạch nhất kể từ đợt 153: **cùng boot đo, gate FOUND chuẩn, không cần thủ tục (i)**; (3) điểm khác duy nhất so với đợt 157 (LÊN 12 theo tiền lệ mới "O8 sau lượt yên về thời gian dù reboot xen giữa") là đợt này KHÔNG có reboot xen giữa lượt yên và O8 — trường hợp sạch hơn cả tiền lệ 157, nên không có lý do gì để không tính; (4) KHÔNG tính sẽ mâu thuẫn với tiền lệ (h) đợt 157 vừa quyết. **Caveat ghi rõ trong nhãn trích (không giấu):** "O8 3/3 PASS sau lượt yên hợp lệ #23 (attempt3 20/20, tickCost 41,0 ms, boot #58) + sau GATE-FOUND 00:06:28Z, chạy trên CÙNG boot #58". T10 chỉ ĐỀ XUẤT — parent quyết cuối ở §12.1 (h); nếu parent chọn KHÔNG tính, chuỗi giữ 12 và nhãn trích giữ nguyên như trên (chỉ đổi số chuỗi).

### §10.3 RAM + balloon: T9 đúng (xác minh độc lập bằng ngưỡng trần đúng)

T10 chạy python trực tiếp trên `round158-t9/ram-sampler-FROZEN.log` (136 dòng, trường `mem=`/`bal=`): **samples 136 (114 #58 + 22 #59); mem min 199.248 kB @00:40:04Z, max 2.250.420 kB @00:01:03Z, mean 851.119 kB (T9 ghi 851.120 — chênh 1 kB do T10 chia nguyên làm tròn xuống, xem F-158-T10-3; số chính thức giữ 851.120 của T9), gate A (≥1.048.576 kB) 39/136, 0 mẫu ≥ guard** — khớp T9.
**Balloon — T10 đếm lại độc lập từ trường `bal=` với ngưỡng "chạm trần" `bal == 6.443.824`:** **đúng 38 mẫu (27,9%), 4 chuỗi (4+13+13+8), 2 boot** — khớp T9. Ngưỡng lỏng `bal ≥ 6.443.824` cho cùng 38 mẫu (không có mẫu nào vượt trần mà không chạm trần — trần là max quan sát). **T10 XÁC NHẬN cách đếm 2 EPISODE của T9** theo quy tắc (g) đợt 152 + quyết (k) đợt 156/157: episode A (chuỗi 1+2+3 trên #58, n=4+13+13=30) và episode B (chuỗi 4 trên #59, n=8). **Kiểm chứng dip giữa chuỗi 1–2 và 2–3 bằng log gốc:** chuỗi 1 (00:59:05–01:02:05Z) và chuỗi 2 (01:07:05–01:19:05Z) cách nhau 4 mẫu (01:03:05–01:06:05Z), bal thấp nhất trong khoảng 6.085.264 ≈ 94,4% trần — dip nông; chuỗi 2–3 cách nhau 2 mẫu (01:20:05–01:21:05Z), dip tới 97,4% — dip nông; **gate A KHÔNG mở lần nào trong các dip** (mem trong dip đều < 1.048.576 kB) — dip nông, không xả sâu, không mở gate: không đủ tiêu chuẩn tách episode theo tiền lệ (đợt 157: dip 94,4% không tách). **Caveat duy nhất: nếu parent tách dip thành ranh giới thì thành 4 episode** (3 chuỗi #58 + 1 chuỗi #59) — T10 trình cả hai cách đếm, parent quyết cuối ở §12.1 (k). Chuỗi 3 bị reboot #59 cắt — không quan sát được điểm đứt (khác đợt 157, cả 3 chuỗi đều đứt quan sát được); chuỗi 4 đứt quan sát được 01:55:25Z.
**Mẫu cuối boot #58 01:34:05Z nằm 18 s SAU btime #59 (01:33:47Z) — T10 xác minh độc lập từ log gốc: drift ≥18 s trong phiên** (khớp T9; T0-158 đã xác minh đồng hồ đúng ±1 s lúc mở — drift phát sinh cuối phiên, cùng họ nghịch lý #58 ≥ +28 s của T2).
B2 spike: T10 không đếm lại độc lập từ `b2-spikes.log` (giới hạn phạm vi — cùng mẫu F-157-T10-5; T9 ghi 12 spike, 11 quy được driver + 1 load1 dư; ghi nhận, không xác minh lại). ENOSPC: T9 ghi ≥50 dòng / 2 boot (cận dưới); T5 ghi 34 dòng #58 lúc 23:46:39Z — T10 không đếm lại độc lập (journal mất theo reboot #59).

### §10.4 Đếm cuối bằng dedup toàn cục MỚI (script `count-final-158-t10.py`, VIẾT MỚI SẠCH — không sed từ script cũ)

- Đợt 158 (trước closing): **9 batch / 11 entry / 11 file**.
- **Đợt 158 (gồm closing): 10 batch / 13 entry / 13 file duy nhất.**
- **Lũy kế 111–158: 468 batch / 885 entry / 755 file.**
- **Chờ push 136–158: 220 batch / 307 entry / 259 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
- **Tái kiểm 111–157 = 458/872/743 — KHỚP từng số với T1-158; tái kiểm 111–156 = 448/859/731 — KHỚP; 111–155 = 438/846/719 — KHỚP — lần thứ 47 liên tiếp** (T1-158 ghi lần thứ 46, nay +1).
- Overlap đợt 158 với 111–157: **1 file** — `PHASE9_GAP_ANALYSIS.md` (closing, cập nhật §87 — trùng có lý do, cập nhật hồ sơ chung; aggregate là file mới). Trước closing overlap = 0 (9 LIMITS + 2 script T4 đều mới).
- Purity: 0 lỗi (467 file paths rounds ≤158 quét trước closing, NUL-delimited, không newline, không entry rỗng; 468 gồm closing). 0 file thiếu trên đĩa.

### §10.5 Cây / lock / process / boot lúc đóng + CHUẨN BTIME + #59 đối chiếu

- Cây md5 lúc đóng (kiểm trên boot eec65561, trước khi viết aggregate): preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js (`server/render/src/effects.js`) `fedc0141` — **khớp đúng hồ sơ T10-157 lúc đóng, không đổi ngoài ý muốn**. (Đường dẫn thật là `apps/web/src/preview.tsx`, `apps/web/src/media.ts`, `apps/web/vite.config.ts`, `server/render/src/effects.js` — xem F-158-T10-2. Lưu ý: `packages/video-spec/src/effects.js` là file KHÁC, md5 `c7a36b14` — không thuộc hồ sơ, T0-158 đã ghi rõ trong work-notes.)
- Lock queue: **101 mục trong thư mục `vite.lock.queue/` (0 ticket + 101 cooldown)** — 100 sau prune T6 lần 33 + cooldown-t8-round158 T8 thêm — đúng mẫu đợt 150–157. Lock TRỐNG (0 ticket). (F-158-T10-4: `wc -l` trên thư mục queue cho 0 dòng — sai phương pháp; đếm đúng là `ls | wc -l` = 101.)
- **0 process sót của đợt:** `ps` lúc đóng chỉ còn systemd/journald/hatch daemon + chính lệnh kiểm tra của T10 — không còn vite/playwright/chromium/webkit/sampler/poller/watcher nào của đợt 158 (watcher-158 pid 10867 đã chết theo reboot #59; không còn process watcher nào sống lúc đóng). `/tmp/.X11-unix/` trống (thư mục rỗng, 0 socket). Trần inotify 63.747.
- **Boot lúc đóng: eec65561 (btime /proc/stat 1795224827 = 01:33:47Z).** T10 kiểm cuối lúc ~02:1xZ vẫn boot này — **KHÔNG có reboot mới trong lúc T10 đóng sổ** (giống đợt 156/157; khác đợt 155). **Reboot #59: T10 đối chiếu — btime /proc/stat hiện tại 1795224827 = 01:33:47Z khớp đúng btime T7-158 ghi (xác minh 6 nguồn + github Date khớp) và boot_id eec65561 khớp T7/T9; số hiệu #59 theo đếm tuần tự (sau #58 28366bd0) — chờ T2-159 phán chính thức.** Mù #91? (#59) giao T2-159; POSTBOOT_PASS #59 giao T5-159.
- **CHUẨN BTIME — nhắc lại quy tắc đứng (quyết (e) đợt 156): btime CHỈ từ `/proc/stat btime`.** Kiểm trên boot hiện tại eec65561: `/proc/stat btime = 1795224827 = 01:33:47Z`. Mọi btime trong aggregate này đều từ nguồn này.
- **POSTBOOT_PASS #58 đã có trên đĩa** (ghi 23:43:22Z, poll=0, replay đầy đủ; dpkg 1.545, cache 178, lists 37) — T10 xác minh độc lập từ file gốc `round158-t5/POSTBOOT_PASS`. POSTBOOT_PASS #57 KHÔNG CÓ trên đĩa (xác minh độc lập — không có file, không bù được). POSTBOOT_PASS #59 giao T5-159.

### §10.6 T10 đề xuất: CHẤP NHẬN đợt 158

Căn cứ: (1) 9/9 cờ `.done` trên đĩa, **tất cả có nội dung** (quyết (l) đợt 152 giữ trọn vẹn đợt thứ sáu liên tiếp); (2) T1 verify 157 PASS + suite 28/28 trên boot #58; (3) T2 xác nhận số hiệu reboot #58 + chứng nhận mù #89?/#90? ĐÓNG theo luật gap (chờ parent quyết CERT89/90 + FULL104/105 — lưu ý F-158-T2-5 về mốc nội dung ở #89?); (4) (A) kiểm chứng lại 120/120 PASS dưới churn lần thứ tám liên tiếp, chuỗi xanh kép 7 → 8, tổng 960/960; (5) O8 3/3 PASS đã xác nhận độc lập bằng JSON gốc + lượt yên #27 CÓ lượt hợp lệ #23 trên CÙNG boot #58, gate FOUND chuẩn (chuỗi FULL PASS đề xuất LÊN 13 — xem §10.2); (6) harness 4/6 một lần chạy duy nhất, 2 kẹt thật đã chẩn đoán đúng bằng watchdog + live-diag (không phải lỗi môi trường; 84l10 KHÔNG tái kẹt); (7) run 157 SUCCEEDED + 2 điểm (m) DƯƠNG mới #58/#59 trong dải, tính cùng khung giờ thật; (8) POSTBOOT_PASS #58 đã có (23:43:22Z, nhanh nhất từ trước, replay đầy đủ); (9) F-157-T1-1 đã đóng một phần bằng cập nhật GAP §86 (phần (c)/(d) ĐÓNG, phần (e) (m) #56 vẫn mở — xem GAP §86); F-158-T1-4 đóng bằng cập nhật GAP §86 khi viết §87 (xem §10.5/GAP); (10) T8 gate FOUND chuẩn lần đầu kể từ đợt 153 (không cần thủ tục (i)); (11) RAM/balloon đã đối chiếu độc lập từ log gốc (khớp T9 — balloon 38 mẫu, 4 chuỗi, 2 episode); (12) INSIDE chuỗi 3 → 4.

### §10.7 Khiếm khuyết lớn của đợt (caveat — parent cân nhắc khi quyết)

(a) **2 reboot liên quan đợt** (#58 lúc mở, đã xác nhận theo quyết (s) đợt 157 + #59 giữa phiên, viết lại run 158 lần 1); số hiệu #59 theo đếm tuần tự, chờ T2-159 phán; (b) **harness 4/6 + 2 KẸT THẬT WebKit mới** (85m4 P4-lần3 waitForPlaySync; 86n2 P2-entry runEngine:439; kẹt cộng dồn 11 → 13; chuỗi "P3 không kẹt" VẪN 0; 85m4 hết kẹt giữ 4 đợt DUT); (c) O8 trên CÙNG boot đo lượt yên (điểm mạnh — xem §10.2) nhưng harness sau đó kẹt 2/6 — chuỗi phán LÊN 13, chờ parent quyết (xem (h)); (d) headroom 0 → 0 (dưới ngưỡng lần thứ 18; chuỗi "đóng ở 0" kéo dài); (e) balloon 2 episode mới 38/136 mẫu (27,9%), dip giữa các chuỗi nông 94,5%/97,4% (nếu tách thì 4 episode); (f) ENOSPC ≥50 dòng trên 2 boot (cận dưới); (g) birefnet 0 thử lần thứ 12 liên tiếp; (h) **POSTBOOT_PASS #57 KHÔNG CÓ, không bù được** (boot thứ 5 liên tiếp lọt); POSTBOOT_PASS #59 giao T5-159; (i) run 158 vẫn `running` lúc đóng, kết cục thuộc T7-159 (đã viết lại 1 lần tại #59); (j) điểm (m) #56 VẪN CÓ ĐIỀU KIỆN theo J vs 2.807 s / R vs 2,668 — n ứng viên 14, ứng viên mới 17 hoặc 18 (chờ parent chốt); (k) mù #88? VẪN MỞ (đầu E trống 2.683 s / 2.996 s); #89? ĐÓNG nhưng F dùng mốc nội dung (F-158-T2-5 — parent có thể bác); (l) T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-158 — quyết (q) đợt 157 / (q) đợt 156); (m) t7 đóng cờ 02:02Z trễ ~2 phút, t9 02:09Z trễ ~9 phút so với hạn cờ ~02:00Z (cả hai trong hạn cứng 02:30Z); (n) RAM min 199.248 kB (194,6 MiB — thấp nhất kể từ đợt 151); (o) mù #77? vẫn MỞ (chặn chứng nhận #78?–#90?); (p) watcher-158 đã chết theo reboot #59 — không còn watcher sống lúc đóng (giao T5-159 khởi động lại + POSTBOOT_PASS #59); (q) nghịch lý đồng hồ mới: #58 đồng hồ cũ nhanh ~+28 s lúc chết; mẫu cuối #58 nằm 18 s SAU btime #59 (drift ≥18 s cuối phiên); (r) điểm mù live-diag mới F-158-T8-4 (HB128 heartbeat làm tươi log mtime — live-diag 0/2 ở 85m4); (s) attempt1/2 của T4 lỗi setup do quên copy b.json (F-158-T4-1/2) — đề xuất pre-flight check bắt buộc.

### §10.8 Sai số của chính T10-158

- F-158-T10-1 — T10 không chạy lại toàn bộ suite (dựa vào suite 28/28 của T1-158 chạy trên boot #58 + kiểm md5/cây/lock lúc đóng — cùng mẫu F-157-T10-1, quyết (q) đợt 157).
- F-158-T10-2 — Lần chạy `md5sum` đầu tiên của T10 dùng sai đường dẫn (`apps/web/src/components/timeline/preview.tsx`, `apps/web/src/lib/media.ts` — không tồn tại; layout thật là `apps/web/src/preview.tsx`, `apps/web/src/media.ts`, `server/render/src/effects.js`); đã chạy lại đúng đường dẫn — số cây §10.5 là từ lần chạy đúng. (Cùng mẫu F-157-T10-2 — lỗi lặp lại lần thứ tư; ghi rõ để T10-159 tránh.)
- F-158-T10-3 — T10 đếm lại mean RAM bằng phép chia nguyên (`sum//n`) cho 851.119 kB, thấp hơn số T9 1 kB (851.120 — làm tròn đúng); số chính thức giữ 851.120 của T9. Không phải sai số của T9.
- F-158-T10-4 — T10 đếm lock queue bằng `wc -l` trên `vite.lock.queue` (là THƯ MỤC, không phải file) cho 0 dòng — sai phương pháp; đếm đúng là `ls | wc -l` = 101 mục, 0 ticket. Số cuối §10.5 là từ lần đếm đúng.
- F-158-T10-5 — T10 không đếm lại độc lập B2 spike và ENOSPC từ log gốc (giới hạn phạm vi — cùng mẫu F-157-T10-5; T9 ghi B2 12 spike, ENOSPC ≥50 dòng — ghi nhận, không xác minh lại). T7 đóng cờ 02:02Z trễ ~2 phút, T9 đóng cờ 02:09Z trễ ~9 phút so với hạn cờ ~02:00Z (cả hai trong hạn cứng 02:30Z) — CHỈ GHI NHẬN, không nhắc (cùng mẫu quyết (r) đợt 157).

## §11. Nợ mở chuyển đợt 159

1. **Mù #89?/#90? ĐÓNG theo luật gap — chờ quyết §12.1 (b)** (CERT89/90 + FULL104/105 ứng viên có điều kiện; CERT/FULL chính thức GIỮ 76/91). **Mù #77? VẪN MỞ** (N 1.308 s — chặn chứng nhận theo thứ tự; #78?–#90? GIỮ MỞ chờ chứng nhận). **Mù #88? VẪN MỞ** (đầu E trống 2.683 s Model 1 / 2.996 s Model 2). **Mù #91? (#59) giao T2-159** (reboot #59 eec65561, btime 01:33:47Z giữa phiên).
2. **Mô hình đồng hồ + điểm (m) #56 — chờ quyết §12.1 (d)/(e)** (Model 1 đã chọn theo quyết (d) đợt 157, KHÔNG đặt J làm offset đứng; cửa R 2,56251–2,66817 / J 2.566–2,80753 s VẪN MỞ — T2-158 không thu hẹp được). **Điểm (m) #58 DƯƠNG mới +42,529 s và #59 DƯƠNG mới +35,173 s — chờ quyết §12.1 (f)** (n ứng viên 17 nhánh khuyến nghị hoặc 18; dải 33–49,8 s giữ nguyên). **Kết cục run 158 thuộc T7-159** (run vẫn `running` lúc T7 đóng cờ, đã viết lại 1 lần tại #59, hạn 02:35:51Z).
3. **Reboot #59 (eec65561, btime 01:33:47Z) giữa phiên — chờ quyết §12.1 (s)** (số hiệu #59 theo đếm tuần tự; T7 xác minh 6 nguồn, T9 xác nhận theo đếm tuần tự, T10 đối chiếu btime/boot_id lúc đóng; mù #91? giao T2-159; POSTBOOT_PASS #59 giao T5-159; watcher-158 đã chết theo #59 — T5-159 khởi động lại bằng tay).
4. **O8 chuỗi 12 → 13? T10 ĐỀ XUẤT: LÊN 13 — chờ quyết §12.1 (h)** (lượt yên #27 CÓ lượt hợp lệ #23 trong đợt; O8 chạy sau về thời gian TRÊN CÙNG boot #58, gate FOUND chuẩn lần đầu kể từ đợt 153; nhãn trích ghi rõ cùng boot — xem §10.2).
5. **Harness 4/6 + 2 KẸT THẬT WebKit mới — chờ quyết §12.1 (i)** (85m4 P4-lần3 waitForPlaySync; 86n2 P2-entry runEngine:439; 84l10 KHÔNG tái kẹt; kẹt cộng dồn 11 → 13; chuỗi "P3 không kẹt" VẪN 0; H3 vẫn mở, chỉ giám sát thụ động; watchdog 2 kích hoạt ĐÚNG, 0 false-positive; live-diag điểm mù mới F-158-T8-4).
6. **Lượt yên #27 CÓ lượt hợp lệ #23 — chờ quyết §12.1 (j)** (chuỗi lượt yên hợp lệ nối dài #22 → #23; P3' mới 51/59 occ = 51/54 distinct-seq; (c2) 7/7 COVERED; 0 PAGE-WEDGED đợt thứ 2 liên tiếp; attempt1/2 lỗi setup do quên copy b.json — đề xuất pre-flight check, xem §12.1 (t)).
7. **POSTBOOT_PASS #57 KHÔNG CÓ, không bù được — ghi nhận §12.1 (o)** (boot thứ 5 liên tiếp lọt; POSTBOOT_PASS #59 giao T5-159; watcher-158 đã chết theo #59 — T5-159 khởi động lại bằng tay + kiểm tra lúc mở theo quy tắc đứng (3)).
8. **Balloon 2 episode mới — chờ quyết §12.1 (k)** (38/136 mẫu, 4 chuỗi, 2 boot; dip giữa các chuỗi nông 94,5%/97,4%, gate A không mở trong dip — T10 xác nhận đếm 2 episode; nếu tách thì 4 episode; chuỗi 3 bị reboot cắt, không quan sát được điểm đứt).
9. **Headroom 0 → 0 — vẫn dưới ngưỡng lần thứ 18 liên tiếp** (quyết (l) "chỉ theo dõi" — chờ quyết §12.1 (l)). Trần 63.747 không đổi.
10. **Birefnet 0 thử lần thứ 12 liên tiếp** (cơ chế (a) armed cả phiên trừ gap 80 s tại #59; u2net là fallback chính thức). Giữ nguyên sampler + trigger cho đợt 159.
11. **ENOSPC ≥50 dòng trên 2 boot (cận dưới) — chờ quyết §12.1 (m)** (đợt thứ 7 liên tiếp có lỗi thật; #58 ≥34 dòng, #59 16 dòng; journal mất theo reboot).
12. **Prune lần 34 (T6-159):** tổng lock 101 lúc T10 đóng (100 sau prune 33 + cooldown-t8-round158) — kiểm lại lúc mở đợt 159.
13. **Checklist (o) T8-159: giữ cả hai symlink diag trỏ round159-t8** (đợt này đã xong cả hai; DIAG137 hoãn theo T0-154).
14. **File oversize (cần `ENABLE_PRIVSEP=0` lúc push):** T2 LIMITS 42.716 B, T6 LIMITS 42.150 B, T8 LIMITS 44.109 B, T9 LIMITS 68.441 B, aggregate 158 oversize. File 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
15. **Nợ đứng giữ nguyên:** G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16; quyết parent: để yên, không nhắc lại). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38 G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở theo quyết (g) đợt 143. u2net là fallback chính thức cho birefnet. Mù #64/#62/#61 đoạn B, #56 A, #55 B, #53 B, #51 B, #49 B — không kiểm lại (tiền lệ + không có bằng chứng mới; quyết 145 (f)).

## §12. Chờ quyết parent

### §12.1 Câu hỏi mở (đánh số theo thứ tự ưu tiên — parent quyết, T10 không tự chốt)

(a) **Verdict đợt 158: CHẤP NHẬN hay không?** T10 đề xuất CHẤP NHẬN (xem §10.6). Caveat: 2 reboot liên quan đợt (#58 lúc mở + #59 giữa phiên, viết lại run 158 lần 1); harness 4/6 + 2 kẹt thật WebKit mới (85m4, 86n2; kẹt cộng dồn 11 → 13); headroom 0 → 0 (dưới ngưỡng lần thứ 18); balloon 2 episode mới 38/136; ENOSPC ≥50 dòng; birefnet 0 thử lần thứ 12; POSTBOOT_PASS #57 không có; run 158 chưa có kết cục; điểm (m) #56 có điều kiện theo J/R; mù #88? VẪN MỞ, #89? F dùng mốc nội dung; T10 không chạy lại toàn bộ suite; t7 đóng cờ trễ ~2 phút, t9 trễ ~9 phút so với hạn cờ.

(b) **Mù #89?/#90? ĐÓNG theo luật gap — chứng nhận CERT89/90 + FULL104/105 hay giữ mở?** (T2 §3.) #89?: E2 max gap 86 s (file) / 60 s (union); F max gap file 1.279 s VƯỢT sàn nhưng union file+nội dung 103 s — ĐÓNG theo tiền lệ "mốc file là cận trên bảo thủ"; **T2 trình rõ cả hai số để parent bác nếu không chấp nhận mốc nội dung (F-158-T2-5)**. #90?: F như trên + G max gap 416 s (file) / 404 s (union), head +38 s sau CLOCK RULE. CERT/FULL chính thức GIỮ 76/91 (chờ chứng nhận theo thứ tự — #77? còn mở phía trước). #88? VẪN MỞ nên chưa chứng nhận được.

(c) **Reboot #58 (btime 23:06:08Z giờ thật, boot 28366bd0) — đã xác nhận theo quyết (s) đợt 157; ghi nhận lại?** (T0 xác minh 6 nguồn; T2 xác minh độc lập 6 nguồn; drift test 0,9973.)

(d) **Mô hình đồng hồ đợt 156 — Model 1 đã chọn theo quyết (d) đợt 157 (KHÔNG đặt J làm offset đứng); T2-158 KHÔNG thu hẹp được cửa (R 2,56251–2,66817; J 2.566–2,80753 s) — ghi nhận? Có hướng đo R chính xác hơn cho T2-159 không?** (T2 §3.) Verdict mù không phụ thuộc mô hình; chỉ số gap #56 / CERT88 / FULL103 / đầu E phụ thuộc mô hình.

(e) **Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN theo J vs 2.807 s / R vs 2,668: J ≥ 2.807 s (R < 2,668) → KHÔNG phải điểm dữ liệu (n giữ 14, nhánh khuyến nghị) hay J < 2.807 s (R ≥ 2,668) → điểm ÂM ứng viên thứ 15?** (T7 §7; T2 §3.) Cửa vẫn mở cả hai mô hình (cận dưới R ≥ 2,56251 không phân định — cửa 2,56251–2,66817 còn mở; cận dưới cứng J ≥ 2,566 s thiếu 241 s). T2-158 KHÔNG chốt n=15.

(f) **Điểm (m) #58 DƯƠNG mới +42,529 s và #59 DƯƠNG mới +35,173 s — n ứng viên 17 (15 dương + 2 âm, nhánh khuyến nghị nếu #56 không phải điểm) hay 18 (15 dương + 3 âm nếu #56 là điểm ÂM)? Dải 33–49,8 s giữ nguyên? Điều tra (m) vẫn đóng?** (#58 viết lại run 157 lần 2; #59 viết lại run 158 lần 1 — cả hai tính CÙNG KHUNG giờ thật, trong dải, không phá min/max.) n chính thức (ứng viên) là 17 theo nhánh khuyến nghị; 18 là phương án thay thế nếu #56 được chốt là điểm ÂM (xem (e)).

(g) **Run 157 SUCCEEDED 23:30:06Z, wall gốc 10.455 s, margin 345 s — ghi nhận?** (Margin hẹp thứ hai từ đợt 150, chỉ sau run 150: 177 s; 2 lần đọc DB khớp nhau; claimed 23:29:55Z = finished − 11 s, trở lại họ 7–8 s — T7 chỉ ghi nhận, không suy luận cơ chế.)

(h) **O8 chuỗi 12 → 13? T10 ĐỀ XUẤT: LÊN 13. Parent xác nhận?** (§10.2.) O8 3/3 PASS đã xác nhận độc lập (21/21 ×3, JSON stamped riêng biệt, log driver O8 DONE 00:10:07Z) — kết quả đứng. Đợt này CÓ lượt yên hợp lệ #27 trong đợt (attempt3 20/20, B 5/5, tickCost median 41,0 ms, 23:53:09–23:57:16Z); O8 chạy 00:07:35Z, SAU lượt yên về thời gian, TRÊN CÙNG BOOT #58 — thỏa điều kiện chữ của tiền lệ đợt 150 + quyết (j) đợt 153 + quyết (g) đợt 154 + quyết (f) đợt 155 + quyết (f) đợt 156 + quyết (h) đợt 157, theo cách sạch nhất kể từ đợt 153 (cùng boot đo, gate FOUND chuẩn, không cần thủ tục (i)). Nếu parent chọn KHÔNG tính thì chuỗi giữ 12, nhãn trích giữ nguyên như §10.2 (chỉ đổi số chuỗi).

(i) **Harness 4/6 + 2 KẸT THẬT WebKit mới (85m4 P4-lần3 waitForPlaySync, playhead đóng băng 0.267; 86n2 P2-entry runEngine:439) — chuỗi "P3 không kẹt" VẪN 0; kẹt cộng dồn 11 → 13; 84l10 KHÔNG tái kẹt; H3 vẫn mở, chỉ giám sát thụ động? Có mở điều tra riêng cho 85m4/86n2 không?** (T8 §8.) Watchdog 2 kích hoạt ĐÚNG, 0 false-positive — watchdog làm đúng việc lần thứ hai liên tiếp. Chromium cùng pha PASS cả 3 — kẹt chỉ ở WebKit, không phải lỗi môi trường launch. 85m4 HẾT KẸT giữ 4 đợt DUT.

(j) **Lượt yên #27 CÓ lượt hợp lệ #23 (chuỗi nối dài #22 → #23) — ghi nhận? T4-159 giữ nguyên điều kiện yên?** (T4.) P3' mới 51/59 occ = 51/54 distinct-seq; (c2) 7/7 COVERED; DAT seq 153, 234, 289, 318, 378, 436, 463. 0 PAGE-WEDGED đợt thứ 2 liên tiếp. Attempt1/2 lỗi setup do quên copy b.json (F-158-T4-1/2) — xem (t).

(k) **Balloon 2 episode mới — 38/136 mẫu (27,9%), 4 chuỗi, 2 boot: đếm là 2 episode?** (T9 §9; T10 xác nhận §10.3.) Episode A chuỗi 1+2+3 trên #58 (n=4+13+13=30) + episode B chuỗi 4 trên #59 (n=8). **Dip giữa các chuỗi nông tới 94,5%/97,4%, gate A KHÔNG mở lần nào trong dip** — T10 xác minh độc lập từ log gốc, đếm là 1 episode mỗi boot theo quy tắc (g) đợt 152 + quyết (k) đợt 156/157. Nếu parent tách dip thành ranh giới thì thành 4 episode. Chuỗi 3 bị reboot #59 cắt — không quan sát được điểm đứt (khác đợt 157).

(l) **Headroom 0 → 0 (dưới ngưỡng lần thứ 18 liên tiếp) — giữ quyết (l) "chỉ theo dõi" hay đổi?** (T9 §9.) Trần 63.747 không đổi; 6 lần đo đều 0. Vẫn không có hành động khả thi từ trong cell (can thiệp host ngoài tầm; vòng lặp vẫn chạy vì vite tạm dùng 0 watch).

(m) **ENOSPC ≥50 dòng trên 2 boot (cận dưới, mỗi boot journal mất theo reboot) — chấp nhận làm số chính thức?** (T9 §9. Đợt thứ 7 liên tiếp có lỗi thật; đợt 157: ≥106 dòng.)

(n) **Birefnet 0 thử lần thứ 12 liên tiếp — giữ nguyên cơ chế (a) armed?** (T9 §9.) Guard 6.144 MiB giữ nguyên; u2net là fallback chính thức. Dữ kiện mới: gap sampler 80 s tại #59 (≥98 s giờ thật) — khởi động lại bằng tay kịp thời.

(o) **POSTBOOT_PASS #58 ĐÃ CÓ (23:43:22Z, nhanh nhất từ trước, replay đầy đủ) + #57 KHÔNG CÓ, không bù được — ghi nhận? Hướng (3) có cần bổ sung?** (T5 §5.) #57 là boot thứ 5 liên tiếp lọt (#51, #53, #54, #55, #57) — cả 5 chết ngoài phiên T5; journal + dpkg.log đã mất, không bù được (cùng tiền lệ #51 theo quyết (o) đợt 156/157). POSTBOOT_PASS #59 giao T5-159. Watcher-158 pid 10867 đã chết theo reboot #59 — T5-159 khởi động lại bằng tay.

(p) **Mù #88? VẪN MỞ (đầu E trống 2.683 s Model 1 / 2.996 s Model 2) + #89?/#90? ĐÓNG theo luật gap (chờ quyết (b)) — ghi nhận?** (T2 §3.) #88? là hố MỞ đầu tiên kể từ mù #77? (N 1.308 s). #89?: E2 ĐÓNG, F ĐÓNG bằng union file+nội dung (F-158-T2-5 — parent có thể bác mốc nội dung). Nghịch lý #58 đồng hồ cũ nhanh ~+28 s lúc chết (mới). Khung chết #133?/#134? KHÔNG xác định. Mù #91? (#59) giao T2-159.

(q) **T10 không chạy lại toàn bộ suite — chấp nhận cách đóng sổ này cho đợt 158?** (dựa vào suite 28/28 của T1-158 chạy trên boot #58 + kiểm md5/cây/lock lúc đóng — cùng mẫu quyết (q) đợt 157 / (q) đợt 156 / (o) đợt 153 / (m) đợt 154 / (n) đợt 155.)

(r) **Cờ 9/9 đều có nội dung — quyết (l) đợt 152 giữ trọn vẹn đợt thứ sáu liên tiếp; giữ quy tắc đứng?** (Muộn nhất t9 02:09Z — trễ ~9 phút so với hạn cờ ~02:00Z nhưng trong hạn cứng 02:30Z → **CHỈ GHI NHẬN, không nhắc**; t7 02:02Z trễ ~2 phút — CHỈ GHI NHẬN. Cùng mẫu quyết (r) đợt 157.)

(s) **Reboot #59 (eec65561, btime 01:33:47Z) giữa phiên — xác nhận số hiệu #59?** (T7 xác minh 6 nguồn + github Date khớp; T9 xác nhận theo đếm tuần tự; T10 đối chiếu btime/boot_id lúc đóng. Mù #91? giao T2-159; POSTBOOT_PASS #59 giao T5-159.)

(t) **Pre-flight check bắt buộc cho T4 (đề xuất §7(d) LIMITS T4-158) — parent phán?** (Attempt1/2 lượt yên #27 lỗi setup exit 2 do quên copy b.json — F-158-T4-1/2; không phải PAGE-WEDGED; attempt3 sau đó hợp lệ. Đề xuất: kiểm tra bắt buộc file b.json trước mỗi attempt.)

(u) **Điểm mù live-diag mới F-158-T8-4 (HB128 heartbeat làm tươi log mtime — live-diag 0/2 ở 85m4) — bổ sung kiểm "nội dung tươi" hay ghi nhận làm giới hạn đứng?** (T8 §8.) Watchdog vẫn bắt được cả hai kẹt (2 kích hoạt ĐÚNG, 0 false-positive) nên điểm mù chỉ ảnh hưởng bước chẩn đoán (1b), không ảnh hưởng phát hiện kẹt.

### §12.2 (đã quyết ở §12.3 dưới)

### §12.3 QUYẾT PARENT (main chat — parent viết trực tiếp; header §12.3 đã đóng dấu sẵn khi đọc, nội dung trống, như đợt 146/147/148/149/150/151/152/153/154/155/156/157)

- **(a) Đợt 158: CHẤP NHẬN.** 9/9 cờ đều có nội dung + T10; T10 đóng ~02:25Z — trong hạn cứng 02:30Z (đóng đúng hạn). T1 verify 157 PASS + suite 28/28; (A) kiểm chứng lại 120/120 lần thứ tám liên tiếp (tổng 960/960); lượt yên #27 CÓ lượt hợp lệ #23 (chuỗi nối dài #22 → #23); O8 xác nhận độc lập 21/21 ×3, gate FOUND chuẩn cùng boot (chuỗi LÊN 13, xem (h)); harness 4/6 + 2 kẹt thật (xem (i)). Caveat ghi nhận, không cản chấp nhận: 2 reboot liên quan đợt (#58 lúc mở + #59 giữa phiên, viết lại run 158 lần 1); 2 kẹt thật WebKit mới (85m4, 86n2; kẹt cộng dồn 11 → 13); headroom 0 → 0 (dưới ngưỡng lần thứ 18); balloon 2 episode mới 38/136; ENOSPC ≥50 dòng; birefnet 0 thử lần thứ 12; POSTBOOT_PASS #57 không có; run 158 chưa có kết cục; điểm (m) #56 có điều kiện theo J/R; mù #88? VẪN MỞ, #89? F dùng mốc nội dung (xem (b)); T10 không chạy lại toàn bộ suite (xem (q)); t7 đóng cờ trễ ~2 phút, t9 trễ ~9 phút so với hạn cờ (xem (r)).
- **(b) Mù #89?/#90? ĐÓNG theo luật gap — CHẤP NHẬN ĐÓNG (mốc nội dung được chấp nhận cho đoạn F) — GIỮ MỞ cho chứng nhận.** #89? (#57): E2 max gap 86 s (file) / 60 s (union); F max gap file 1.279 s VƯỢT sàn nhưng union file+nội dung 103 s — ĐÓNG theo chuẩn mốc merged đứng (quyết (c) đợt 154 + quyết (c) đợt 155: sampler log + scheduler event là mốc hợp lệ cho MỌI đoạn; tiền lệ "mốc file là cận trên bảo thủ"). T2 đã trình rõ cả hai số (F-158-T2-5) — parent CHẤP NHẬN mốc nội dung cho đoạn F (union 103 s < sàn 1.147 s). #90? (#58): F như trên + G max gap 416 s (file) / 404 s (union), head +38 s sau CLOCK RULE — ĐÓNG. CERT/FULL chính thức GIỮ 76/91 (chờ chứng nhận theo thứ tự — #77? và #88? còn mở phía trước). Hai mù mới chỉ tạo đảo đóng riêng.
- **(c) Reboot #58 (btime 23:06:08Z giờ thật, boot 28366bd0): ĐÃ XÁC NHẬN theo quyết (s) đợt 157 — GHI NHẬN LẠI.** T0 xác minh 6 nguồn; T2 xác minh độc lập 6 nguồn; drift test 0,9973. Số hiệu #58 ĐÃ XÁC NHẬN, không cần xác nhận lại.
- **(d) Mô hình đồng hồ đợt 156 — Model 1 đã chọn theo quyết (d) đợt 157 (KHÔNG đặt J làm offset đứng); T2-158 KHÔNG thu hẹp được cửa (R 2,56251–2,66817; J 2.566–2,80753 s): GHI NHẬN.** T2-158 đã thử 4 hướng, không neo mới. Cửa vẫn mở. Verdict mù không phụ thuộc mô hình; chỉ số gap #56 / CERT88 / FULL103 / đầu E phụ thuộc mô hình. T2-159 tiếp tục thu hẹp cửa (tìm neo mới — timestamp ghim R hoặc J chính xác hơn).
- **(e) Điểm (m) #56: VẪN CÓ ĐIỀU KIỆN — CHƯA CHỐT.** Cửa vẫn mở cả hai mô hình (cận dưới R ≥ 2,56251 không phân định — cửa 2,56251–2,66817 còn mở; cận dưới cứng J ≥ 2,566 s thiếu 241 s). T2-158 KHÔNG chốt n=15. n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt. T2-159 thu hẹp cửa (xem (d)).
- **(f) Điểm (m) #58 DƯƠNG mới +42,529 s và #59 DƯƠNG mới +35,173 s: CHẤP NHẬN — n ứng viên 17 (15 dương + 2 âm, nhánh khuyến nghị nếu #56 không phải điểm) hoặc 18 (15 dương + 3 âm nếu #56 là điểm ÂM). Dải 33–49,8 s GIỮ NGUYÊN — điều tra (m) VẪN ĐÓNG.** (#58 viết lại run 157 lần 2; #59 viết lại run 158 lần 1 — cả hai tính CÙNG KHUNG giờ thật, trong dải, không phá min/max; điểm dương thứ hai và thứ ba tính hoàn toàn bằng giờ thật.) n chính thức (ứng viên) là 17 theo nhánh khuyến nghị; 18 là phương án thay thế nếu #56 được chốt là điểm ÂM (xem (e)).
- **(g) Run 157 SUCCEEDED 23:30:06Z, wall gốc 10.455 s, margin 345 s: GHI NHẬN.** Margin hẹp thứ hai từ đợt 150, chỉ sau run 150: 177 s; 2 lần đọc DB khớp nhau; claimed 23:29:55Z = finished − 11 s, trở lại họ 7–8 s — T7 chỉ ghi nhận, không suy luận cơ chế.
- **(h) O8 chuỗi 12 → 13: XÁC NHẬN ĐỀ XUẤT CỦA T10 — LÊN 13.** Đợt này CÓ lượt yên hợp lệ #27 trong đợt (attempt3 20/20, B 5/5, tickCost median 41,0 ms, 23:53:09–23:57:16Z); O8 chạy 00:07:35Z, SAU lượt yên về thời gian, TRÊN CÙNG BOOT #58 — thỏa điều kiện chữ của tiền lệ đợt 150 + quyết (j) đợt 153 + quyết (g) đợt 154 + quyết (f) đợt 155 + quyết (f) đợt 156 + quyết (h) đợt 157, theo cách sạch nhất kể từ đợt 153 (cùng boot đo, gate FOUND chuẩn lần đầu kể từ đợt 153, không cần thủ tục (i)). Nhãn trích: "O8 3/3 PASS sau lượt yên hợp lệ #23, trên cùng boot #58, gate FOUND chuẩn".
- **(i) Harness 4/6 + 2 KẸT THẬT WebKit mới (85m4 P4-lần3 waitForPlaySync, playhead đóng băng 0.267; 86n2 P2-entry runEngine:439): chuỗi "P3 không kẹt" VẪN 0; kẹt cộng dồn 11 → 13; 84l10 KHÔNG tái kẹt; H3 VẪN MỞ, chỉ giám sát thụ động — CHƯA mở điều tra riêng cho 85m4/86n2.** Kẹt thật (cả hai exit 124); Chromium cùng pha PASS cả 3 — kẹt chỉ ở WebKit, không phải lỗi môi trường launch. Watchdog 2 kích hoạt ĐÚNG, 0 false-positive — watchdog làm đúng việc lần thứ hai liên tiếp (ghi nhận). 84l10 KHÔNG tái kẹt (kẹt đợt 157 chỉ 1 lần — tốt). 85m4 đã kẹt lần 2 (đợt 153 P1-phaseA, đợt 158 P4 waitForPlaySync — khác pha) — T8-159 theo dõi, ghi nhận nếu tái diễn lần 3 thì mở điều tra. 85m4 HẾT KẸT giữ 4 đợt DUT (ghi nhận).
- **(j) Lượt yên #27 CÓ lượt hợp lệ #23 (chuỗi nối dài #22 → #23): GHI NHẬN — T4-159 GIỮ NGUYÊN điều kiện yên.** P3' mới 51/59 occ = 51/54 distinct-seq; (c2) 7/7 COVERED; DAT seq 153, 234, 289, 318, 378, 436, 463. 0 PAGE-WEDGED đợt thứ 2 liên tiếp (chữ ký đợt 156 không tái diễn). Attempt1/2 lỗi setup do quên copy b.json (F-158-T4-1/2) — xem (t).
- **(k) Balloon 2 episode mới — 38/136 mẫu (27,9%), 4 chuỗi, 2 boot: ĐẾM LÀ 2 EPISODE (2 đợt ghim mới).** Episode A chuỗi 1+2+3 trên #58 (n=4+13+13=30) + episode B chuỗi 4 trên #59 (n=8). Dip giữa các chuỗi nông tới 94,5%/97,4%, gate A KHÔNG mở lần nào trong dip — T10 xác minh độc lập từ log gốc, đếm là 1 episode mỗi boot theo quy tắc (g) đợt 152 + quyết (k) đợt 156/157 (nếu tách thì 4 episode — KHÔNG tách). Caveat ghi nhận: chuỗi 3 bị reboot #59 cắt — không quan sát được điểm đứt (khác đợt 157).
- **(l) Headroom 0 → 0 (dưới ngưỡng lần thứ 18 liên tiếp): GIỮ QUYẾT (l) "chỉ theo dõi", không đổi.** 6 lần đo đều 0. Vẫn không có hành động khả thi từ trong cell (can thiệp host ngoài tầm; vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **(m) ENOSPC ≥50 dòng trên 2 boot: CHẤP NHẬN làm số chính thức (cận dưới).** Mỗi boot journal mất theo reboot nên số thật cao hơn. Đợt thứ 7 liên tiếp có lỗi thật. Cùng mẫu F-155-T10-1 / F-154-T1-3 (journal xoay/mất làm số đếm lại thấp hơn số thật).
- **(n) Birefnet 0 thử lần thứ 12 liên tiếp: GIỮ NGUYÊN cơ chế (a) armed.** Guard 6.144 MiB giữ nguyên; u2net là fallback chính thức. Dữ kiện mới: gap sampler 80 s tại #59 (≥98 s giờ thật) — khởi động lại bằng tay kịp thời.
- **(o) POSTBOOT_PASS #58 ĐÃ CÓ (23:43:22Z, nhanh nhất từ trước, replay đầy đủ) + #57 KHÔNG CÓ, không bù được: GHI NHẬN — hướng (3) KHÔNG cần bổ sung lúc này.** #57 là boot thứ 5 liên tiếp lọt (#51, #53, #54, #55, #57) — cả 5 chết ngoài phiên T5; journal + dpkg.log đã mất, không bù được (cùng tiền lệ #51 theo quyết (o) đợt 156/157). Hướng (3) (T0 kiểm tra watcher lúc mở) không bắt được boot sống và chết hoàn toàn giữa hai đợt — đây là khoảng hở đã biết của hướng (3), chấp nhận. POSTBOOT_PASS #59 giao T5-159. Watcher-158 pid 10867 đã chết theo reboot #59 — T5-159 khởi động lại bằng tay.
- **(p) Mù #88? VẪN MỞ + #89?/#90? ĐÓNG theo luật gap (chờ quyết (b)): GHI NHẬN.** #88? là hố MỞ đầu tiên kể từ mù #77? (N 1.308 s) — đầu E trống 2.683 s Model 1 / 2.996 s Model 2; hole-recheck 0 mốc E thật. #89?/#90? ĐÓNG theo luật gap (xem (b) — mốc nội dung được chấp nhận cho đoạn F). Nghịch lý mới: #58 đồng hồ cũ nhanh ~+28 s lúc chết. Khung chết #133?/#134? KHÔNG xác định. Mù #91? (#59) giao T2-159.
- **(q) T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 158** (dựa vào suite 28/28 của T1-158 chạy trên boot #58 + kiểm md5/cây/lock lúc đóng — cùng mẫu quyết (q) đợt 157 / (q) đợt 156 / (o) đợt 153 / (m) đợt 154 / (n) đợt 155). Quy tắc đứng giữ nguyên: nếu T1 không chạy được suite đầy đủ thì T10 phải chạy lại trước khi đóng.
- **(r) Cờ 9/9 đều có nội dung: XÁC NHẬN quyết (l) đợt 152 giữ trọn vẹn đợt thứ sáu liên tiếp — GIỮ NGUYÊN quy tắc đứng.** Muộn nhất t9 02:09Z — trễ ~9 phút so với hạn cờ ~02:00Z nhưng trong hạn cứng 02:30Z → **CHỈ GHI NHẬN, không nhắc** (cùng mẫu quyết (r) đợt 157). t7 02:02Z trễ ~2 phút — CHỈ GHI NHẬN.
- **(s) Reboot #59 (eec65561, btime 01:33:47Z) giữa phiên: XÁC NHẬN số hiệu #59.** T7 xác minh 6 nguồn + github Date khớp; T9 xác nhận theo đếm tuần tự; T10 đối chiếu btime/boot_id lúc đóng. Mù #91? giao T2-159; POSTBOOT_PASS #59 giao T5-159.
- **(t) Pre-flight check bắt buộc cho T4: DUYỆT — T4-159 triển khai làm quy tắc đứng.** Attempt1/2 lượt yên #27 lỗi setup exit 2 do quên copy b.json (F-158-T4-1/2) — lỗi quy trình, KHÔNG PHẢI PAGE-WEDGED; attempt3 sau đó hợp lệ. Đề xuất (§7(d) LIMITS T4-158): kiểm tra bắt buộc file b.json trước mỗi attempt — sửa quy trình đơn giản, tránh lãng phí attempt. T4-159 triển khai.
- **(u) Điểm mù live-diag mới F-158-T8-4 (HB128 heartbeat làm tươi log mtime — live-diag 0/2 ở 85m4): GHI NHẬN làm giới hạn đứng — CHƯA bổ sung kiểm "nội dung tươi".** Watchdog vẫn bắt được cả hai kẹt (2 kích hoạt ĐÚNG, 0 false-positive) nên điểm mù chỉ ảnh hưởng bước chẩn đoán (1b), không ảnh hưởng phát hiện kẹt. Ghi nhận làm giới hạn đứng của live-diag; nếu điểm mù gây bỏ sót chẩn đoán trong đợt sau thì xem lại.

- Ghi chú nguồn gốc: header §12.3 đã đóng dấu sẵn khi đọc (T10 viết sẵn dòng tiêu đề, nội dung trống kèm chú thích HTML "Parent viết quyết trực tiếp vào đây"); các quyết trên là parent viết trực tiếp — KHÔNG có quyết nào được điền sẵn (như đợt 146/147/148/149/150/151/152/153/154/155/156/157).

---

## Batch stage / Tổng batch

Batch stage đợt 158 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round158-*.txt`):

- `phase9-round158-t0-boot-o8.txt` — 1 entry (T0: LIMITS boot survey + O8 JSON)
- `phase9-round158-t1-verify157.txt` — 1 entry (T1: LIMITS verify đợt 157)
- `phase9-round158-t2-eperm.txt` — 1 entry (T2: LIMITS EPERM + mù #89?/#90?/#88?)
- `phase9-round158-t4-quiet27.txt` — 3 entry (T4: LIMITS #27 + 2 script poll/attempt)
- `phase9-round158-t5-infra.txt` — 1 entry (T5: LIMITS infra)
- `phase9-round158-t6-lockhealth.txt` — 1 entry (T6: LIMITS lock)
- `phase9-round158-t7-scheduler.txt` — 1 entry (T7: LIMITS scheduler)
- `phase9-round158-t8-viteharness.txt` — 1 entry (T8: LIMITS O8 + harness)
- `phase9-round158-t9-headroom.txt` — 1 entry (T9: LIMITS headroom + RAM + birefnet)
- `phase9-round158-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §87)

**Tổng batch đợt 158: 10 batch / 13 entry / 13 file duy nhất.**
**Lũy kế 111–158: 468 batch / 885 entry / 755 file.**
**Tổng batch chờ user push (đợt 136–158): 220 batch / 307 entry / 259 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
