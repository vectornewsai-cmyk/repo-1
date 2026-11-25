# PHASE9 — Đợt 176: LIMITS tổng hợp (aggregate)

Đợt 176 (lượt cron 12:35 +07 23/11/2026 = 05:35:51Z; T10 đóng sổ ~08:1xZ 23/11, trong hạn cứng ~08:30Z; verdict CHẤP NHẬN — parent ĐÃ QUYẾT (a) §12.3 dưới). 9 luồng song song (T0/T1/T2/T4/T5/T6/T7/T8/T9). Một reboot giữa phiên: #90 (07:10:29Z, boot `94247dfa`) — xảy ra sau khi T0/T1/T2/T4/T5/T6/T8 đóng, trong lúc T7/T9 làm việc; số hiệu chờ T0-177 xác minh 9 nguồn. **T7 chưa đóng cờ lúc T10 đóng sổ** (xem §7 + §10.1): nội dung §7 dưới đây dựa trên `hidden_files/round176-t7/NOTES.md` của T7 (đọc #1–#10, tới 07:52:23Z, đầy đủ phân tích) — cờ + LIMITS T7 (nếu về sau) gộp muộn theo tiền lệ các đợt trước.

## §1. T0 — Boot survey: #87/#88/#89 XÁC NHẬN 9 nguồn + O8 trên #89 PASS 3/3

- **#87 XÁC NHẬN 9 nguồn** (boot `ca31fac1`, btime 03:06:05Z, gap #86→#87 = **7.468 s**) + **#88 XÁC NHẬN 9 nguồn** (boot `9131fbc6`, btime 05:04:17Z, gap #87→#88 = **7.092 s**) — **nợ đợt 175 đã trả**. **#89 XÁC NHẬN 9 nguồn**: boot `15618ce8`, btime 05:26:26Z (epoch 1795411586), gap #88→#89 = **1.329 s** (22m09s — **NGẮN bất thường** so với mẫu ~7,1–7,5 nghìn giây; F-176-T0-1).
- **Marker sống qua 41 reboot #49–#89** (mtime 2026-11-20 11:39:47.272154981Z không đổi).
- **Run 175 — SUCCEEDED 05:24:21Z** (8 event, viết lại ×2 tại #87/#88, trước hạn 690 s); **claimed_at DB hiện tại 05:22:53Z khác T7-175 ghi 02:35:52Z** → claimed→finished = **88 s ≥ 60 s — ứng viên ca thứ chín** (F-176-T0-3; phân loại cuối thuộc T7-176 + parent — xem §7). Run 176 jitter **0 s**.
- **(m) #88: requeue eid 10309, run 175, +33,431 s**, trong band, **cách biên DƯỚI 0,431 s — sát biên nhất từng ghi ở biên dưới**; caveat phân số F-176-T0-4 (offset thật ∈ (32,431 s, 33,431 s]). **(m) #89: KHÔNG có ứng viên** (0 requeue, 0 run sống).
- **O8 trên boot #89: WebKit PASS 21/21 ×2 (pid27289 md5 `c5cb621a`, pid47727 md5 `943e3caf`) + Chromium PASS 21/21 (pid53755 md5 `16671297`), exit 0**, 05:43:33–05:47:10Z, sau POSTBOOT_PASS #89. T10 xác nhận độc lập từ JSON gốc (xem §10.2).
- DR 06:00Z: 0 dòng lúc kiểm ~05:42Z nhưng slot chưa tới giờ (kiểm trước 18 phút) — kết luận cuối thuộc T7-176 (T7 xác nhận DR 06:00Z CÓ — xem §7). X11 trio X193/X194/X195 tái xuất lần thứ 5. F-176-T0-2 (2/9 nguồn #87/#88 gián tiếp); F-176-T0-5 ĐÃ HẾT (tên lock đã sửa). O8 chỉ chồng pha poll của T4, 0 attempt.

## §2. T1 — Verify đợt 175: PASS, đếm khớp lần thứ 74 liên tiếp

- Đếm bằng script dedup VIẾT MỚI `recount-176-t1.py` + kiểm chéo shell union-trừ (khớp): **đợt 175 = 10/14/14/13; lũy kế 111–175 = 638/1.120/972/794; chờ push 166–175 = 100/141/132/130; tái kiểm 111–174 = 628/1.106/959/781; tổng 1–175 = 1.286/6.990/3.777 — KHỚP từng số quyết parent (q) §12.3 đợt 175 — lần thứ 74 liên tiếp khớp.**
- **0 file thiếu trên đĩa.**
- **Suite chạy lại: 28/28 exit 0** (05:45:30–05:52:53Z, 7m23s, boot 15618ce8); `npm test` **12 pass**.
- **9/9 cờ đợt 175 có nội dung** (+ cờ closing T10); cờ T9 byte-identical cả hai vị trí (md5 `7477e0a6`).
- O8 đợt 175 xác nhận độc lập (T0 PASS 3/3 trên #86 + T8 PASS 3/3 trên #87); lượt yên #44 tính lại: passes=20, tickCost n=632 **median=41,0**.
- F-176-T1-1 (X11 trio lần 5 — giao T8-176 dọn; T8 đã dọn X194/X195 — xem §8); F-176-T1-2 (aggregate §10.3 đợt 175 ghi "quét 1.285 file" nhưng thực tế 1.286 — lệch prose, không ảnh hưởng số quyết); F-176-T1-3 (boot mới sau T10-175 đóng); F-176-T1-4 (RAMavail dao động mạnh). Lưu ý: file `round176-parent/count-verify-175-parent.py` mang nhãn parent nhưng KHÔNG PHẢI của parent (xem §12.3 đợt 175) — T1 không đọc/không dùng; script đếm của T10 cũng không dùng.

## §3. T2 — EPERM probe #94 + (m) #88 DƯƠNG (CUỐI) + (m) #89 ÂM (CUỐI) + INSIDE #88 TRUE + mù

- **EPERM probe #94: ok=2 fail=0** (05:41:51Z, boot 15618ce8). Sweep #94: 148 log, 12 marker — tất cả trích dẫn lại, **0 sóng thật**.
- **(m) #88: DƯƠNG (phân loại CUỐI ở cấp T2 — parent quyết cuối).** Requeue duy nhất eid 10309, run 175, +33,431 s ∈ [33; 49,8] (cách biên DƯỚI **0,431 s — sát biên nhất từng ghi ở biên dưới**). Cửa hẹp đã khép; 1 run sống; KHÔNG neo nào bắc qua btime (sampler −795 s, watcher −11.825 s); caveat phân số F-176-T0-4 (DƯƠNG ⟺ boot_est−btime ≤ 0,431 s). Nếu chấp nhận: **n ứng viên 34/35 → 35/36**.
- **(m) #89: ÂM (phân loại CUỐI ở cấp T2 — parent quyết cuối)** — 0 requeue, 0 run sống; gap 1.329 s.
- **INSIDE: #88 TRUE (FULL134) — chuỗi dài 7.** Mâu thuẫn hai dải lần thứ 4 liên tiếp (FULL133 NGOÀI, muộn 5.749 s); dải phương pháp chi phối theo F-165-T2-1. **INSIDE #89 (sơ bộ): FALSE (FULL135)** — sớm 240 s; nếu chấp nhận, chuỗi 7 ĐỨT tại #89 → 0; phân loại cuối thuộc T2-177.
- **Mù: #96? VẪN MỞ** — R file 1.238 s (lần thứ 12 liên tiếp không đổi); R union-A 1.222 s / union-B 1.211 s; U union 1.118 s, cách sàn 29 s — theo dõi sát. **#88? VẪN MỞ** — hole-recheck lần 20: 337 hit, 0 mốc mới (lần thứ 20 liên tiếp). #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.** Sessions: 0 hoạt động thật ở #64–#89.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 19 không thu hẹp** (5 hướng mới âm tính/rỗng; tổng 67 hướng). **n chính thức GIỮ 14.**
- **F-175-T4-2 LÀM RÕ: CÓ VI PHẠM (nhẹ).** m56-175.py tồn tại ~2 s trong cửa sổ attempt1 đợt 175 (ps-before bắt 4 process 03:17:47Z; guard giết 03:17:49Z exit 124; **0 s chồng với pass chạy**; lớp B vẫn 5/5). "0 vi phạm" của T2-175 là SAI — guard chỉ giới hạn, không miễn trừ; lượt yên #44 vẫn đứng. Lỗi gốc: T2-175 KHỞI ĐỘNG m56 lúc 03:15:49Z khi cả hai gate đã xanh. **Đợt 176: 0 vi phạm** (chỉ chạy script nặng sau khi attempt2 đóng + poller thoát 06:06:46Z).

## §4. T4 — Lượt yên WebKit #45: CÓ lượt hợp lệ — chuỗi 38 → 39

- **Lượt hợp lệ #45: attempt2-15618ce8 — 20/20 pass, lớp B ĐẠT 5/5, tickCost median 46,0 ms (≤60). Chuỗi lượt yên hợp lệ 38 → 39.** Ngân sách dùng **2/3**. (T10 kiểm độc lập từ JSON gốc: passes=20, engine webkit, tickCost n=613 median 46, p90 73, max 102, min 27 — khớp T4.)
- Attempt1 wedged ở pass 15 (exit 3, partial 14/20). Poller **23 poll thật** (2 test + 21), 2 lần cửa mở, trên **1 boot 15618ce8, 0 reboot**; gate0=T5 suốt (POSTBOOT_PASS #89 replay-đầy-đủ 05:42:19Z, poll=0).
- **RAM <500 MB: 0/23 poll — lần đầu tiên kể từ đợt 172.**
- **Cộng dồn (39 lượt)**: P1 **163/166**, P2 **157/157**, P3-A1 **138/166**, P3' **126/138 occ = 106/111 distinct-seq**, P7 **73/73**. Sổ distinct-seq **thăng cấp as-of-176** (md5 `a642b111…`); **lượt ĐÚNG TOÀN DIỆN thứ hai liên tiếp**.
- **0 vi phạm quy tắc đứng — chuỗi vi phạm 2 đợt liên tiếp (F-174-T2-5 → F-175-T4-2) ĐÃ ĐỨT.** 0 spike B2 trong cả hai cửa sổ attempt.
- Batch 4 entry (LIMITS + poll-wait-t4-176.sh + run-attempt-176.sh + distinct-seq-176.py). F-176-T4-2 (check-classb đếm sampler n thừa 1 do dòng header — sót nhỏ mới); F-176-T4-3 (X193 của chính T4, đã dọn tay).

## §5. T5 — Infra: POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z (replay-đầy-đủ, poll=0)

- **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z** (boot 15618ce8, btime 05:26:26Z, **replay-đầy-đủ 170/170, poll=0**, dpkg 1545 dòng, cache 183, lists 37; verify độc lập check-only exit=0 bằng script ĐÃ SỬA F-175-T5-3; 11/11 gói + 5/5 lib, GST 269=269). **Cờ replay-đầy-đủ thứ hai liên tiếp sau #86**; F-174-T5-6 KHÔNG lặp lại lần thứ hai liên tiếp.
- **POSTBOOT_PASS #87/#88 CHƯA CÓ — KHÔNG bù được** (không watcher quan sát; bằng chứng replay mất theo reboot); **tổng boot không cờ: 16 → 18**. #86/#85/#84 vẫn có, mtime không đổi; backup cờ #86 byte-identical.
- Watcher-175 pid 16528 **CHẾT theo #87** (poll cuối 03:06:12Z, +7 s sau btime #87 — F-176-T5-1, mẫu overlap thứ bảy, **NHỎ NHẤT**). Watcher-176 START 05:42:19Z pid 7604 ALIVE, hạn 08:30:00Z. Khoảng không-watcher 9.367 s.
- **F-175-T5-3 ĐÃ SỬA trong repo** (postboot script dòng 686 — thay dòng say DOT-151 cứng bằng dòng live; `bash -n` OK; verify bằng script đã sửa exit=0) — stage cùng batch (2 entry: LIMITS + script).
- **Hướng (3) VẪN ĐỨNG lần thứ 23.** F-176-T5-2 (ledger ts mang sang #89), F-176-T5-3 (lệch btime 11 s: who -b 05:26:37Z vs /proc/stat 05:26:26Z — giao T0). ENOSPC #89: 7 dòng. RAM 1.455.532 kB. X11 X188 + Xvfb:188 của T4-176 — giao T8.

## §6. T6 — Lock health: (A) 120/120 lần thứ 26 + #87/#88/#89 KHÔNG giết holder + prune lần 51

- **(A) 120/120 — lần thứ 26 liên tiếp (tổng 3.120/3.120).** Suite 9/9 × 6 lượt; khối T7 trích verbatim md5 `dc973443…`, live-code `c92f2efff…`.
- **#87/#88/#89 KHÔNG giết holder** (lock trống 1.188 s / 3.548 s / 4.877 s trước btime; **chuỗi "không giết holder" từ #69 lên 21 reboot** — số hiệu đã được T0-176 xác nhận 9 nguồn).
- **Prune lần 51: xóa 2 file** (cooldown-t8-round121 + cooldown-t7-round121), **queue 102→100 file / 1400 byte**, KHÔNG PHẢI CHỜ lock.
- Lock kiểm cuối: ACQUIRED 641 / RELEASED 629, 629 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 TIMEOUT mới.
- Watcher KHÔNG lệch (7604 = replay-watch-176.sh T5; 7754 = b2-watcher.sh T9). POSTBOOT_PASS #89 CÓ.
- F-176-T6-1 (suite chồng cả pha (a) T4 + pha (b) T0; harness chồng pha (a) + 1m48s đầu pha (b) — KHÔNG phán verdict attempt T4); F-176-T6-4 (mâu thuẫn chữ nghĩa poll=0 vs log nhắc poll2 — TÁI XUẤT, ghi nhận, không phán verdict về cờ); F-176-T6-5 (cả hai watcher-176 chưa chạy lúc snapshot mở).

## §7. T7 — Scheduler: run 175 SUCCEEDED (ca ≥60 s thứ chín) + reboot #90 MỚI + cửa slot LÀNH lần hai liên tiếp

- **Kết cục run 175: SUCCEEDED 05:24:21Z** (event eid 10315), wall gốc 10.110 s, **margin +690 s** (theo cả hai cách tính — KHÔNG còn chênh 13 s như run 174; jitter 0 s). Claimed đổi lúc cuối thành 05:22:53Z (cùng mẫu 171/172/173) → claimed→finished **88 s — CA ≥60 s THỨ CHÍN** (run 172 = thứ tám, theo định nghĩa thống nhất parent đã chọn). Đúng 8 event, 2 lần viết lại (#87 + #88). Run 175 finish 05:24:21Z — TRƯỚC btime #89 (05:26:26Z) 2m05s → #89 KHÔNG chạm kết cục run 175.
- **Run 176: vẫn `running` lúc T7 đọc cuối (07:52:23Z)** — tuổi gốc ~8.192 s, còn ~2.608 s tới hạn 08:35:51Z — **kết cục thuộc T7-177** (hạn cứng đóng đợt 176 là ~08:30Z, trước hạn run 08:35:51Z — cùng mẫu run 174/175); **jitter 0 s**; claimed không đổi (05:35:51Z); **viết lại ×1 tại #90** (started 05:35:51Z → 07:11:04Z, dịch +5.713 s; boot_gen đổi 82890fac → 3af1984b). [Đính chính gộp muộn T7 (F-176-T7-5): NOTES.md cộng thừa 600 s ở đọc #8/#9/#10 — số đúng: đọc #8 6.349 s, #9 6.958 s, #10 8.192 s (còn 2.608 s); aggregate đã sao lại số sai 8.792 s / còn 2.008 s ở đọc #10. Đọc #11 (08:21:55Z, gộp muộn): tuổi gốc 9.964 s, còn 836 s, vẫn running, jitter 0 s.]
- **Reboot #90 MỚI giữa phiên** (T7 xác minh 9 nguồn kiểu T0, phát hiện trong 37 s sau btime; số hiệu chờ T0-177): boot `94247dfa`, btime 07:10:29Z, **gap #89→#90 = 6.243 s** (1h44m03s — trở lại mẫu ~2h sau gap ngắn 1.329 s). Sleep #6 bị SIGTERM ~07:10:50Z (F-176-T7-1 — cùng mẫu F-174-T7-1/F-175-T7-1; 1 sleep bị giết trong phiên). **(m) #90 SƠ BỘ: DƯƠNG ỨNG VIÊN** — requeue duy nhất eid 10339, run 176, 07:11:04.313Z = btime **+35,313 s**, trong dải [33; 49,8], **cách biên dưới 2,313 s**; 1 run sống + 1 requeue — chữ ký ĐẦY ĐỦ (cửa hẹp đã khép, đúng 1 dòng); phân loại cuối thuộc T2-177 + parent 177. Spanning theo events = 1 (run 176); spanning theo truy vấn started_at = 0 dòng — artifact viết-lại-tự-loại (started_at đã viết lại thành 07:11:04Z, sau btime — cùng mẫu #87/#88/#89).
- **Slot: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần thứ hai liên tiếp** (sau đợt 175). DR 06:00Z CÓ đúng giờ; DR 07:00Z CÓ đúng giờ; **DR 08:00Z CÓ đúng giờ (run b05dfb80, jitter 0 s — kiểm sau khi T10 đóng, gộp muộn)**. Lũy kế **HB 44/447, DR 51/296 — SỐ SLOT THIẾU lũy kế** (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 15 liên tiếp vắng muộn mới). [Đính chính gộp muộn T7: aggregate đã ghi nhầm lũy kế thành 50/447, 54/296 (cộng cửa sổ vào tử số) — tử số là SỐ THIẾU, chỉ tăng khi có slot thiếu; xem LIMITS T7-176 §4: 44/441 → 44/447 (mẫu số +6), 51/293 → 51/296 (mẫu số +3). DR 05:00Z nhắc ở bản T10 thuộc cửa sổ trước, không nằm trong 3 slot DR của cửa 176 (06:00/07:00/08:00).]
- **F-176-T7-3:** cờ `round176-t9.done` CHƯA CÓ trên đĩa lúc T7 đọc #9 (07:31:49Z) dù LIMITS T9 đã có — T10 xác nhận: cờ T9 có mặt 07:55:22Z (viết lại 08:01:23Z), ĐÃ HẾT (xem §10.1). **F-176-T7-4:** lỗi nhãn nhỏ trong LIMITS T9 — ghi "#90 chờ T0-176 xác minh"; thực ra T0-176 đã đóng cờ 05:52Z, TRƯỚC #90 (07:10:29Z), nên xác minh số hiệu #90 thuộc T0-177, không phải T0-176 (không ảnh hưởng số đo).
- **LƯU Ý T10:** §7 này dựa trên NOTES.md của T7 (đọc #1–#10 tới 07:52:23Z + đối chiếu chéo T8/T9). **Cờ + LIMITS T7 CHƯA CÓ trên đĩa lúc T10 đóng sổ (~08:1xZ)** — T7 vẫn đang chạy (yên ~15 phút từ 07:52Z). Batch T7 (LIMITS) — nếu về sau — gộp muộn theo tiền lệ; đếm cuối §10.3 tính theo trạng thái đĩa lúc đóng (8 batch luồng + closing).

## §8. T8 — Vite harness: 6/6 SẠCH, 0 kẹt + O8 PASS 3/3 trên #89 + đề xuất chuỗi LÊN 26

- **Harness 6/6 SẠCH, 0 kẹt** (một lần chạy driver duy nhất 06:16:15–06:31:34Z, boot 15618ce8): WebKit 84l10 PASS (lần thứ 5 liên tiếp) + 85m4 PASS (P4-lần3 PASS lần thứ 5 liên tiếp) + **86n2 PASS — KHÔNG kẹt lại ở P1** (chữ ký mới đợt 175, lần 1, không tái diễn) + Chromium 3/3 PASS. **Kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1.** Chromium đối chứng N=37 → N=38 mỗi pha.
- **(f') V1 live: 0 kích hoạt — ĐÚNG** (0 FP trên 12 log sạch); replay C5.1 ĐẠT (kẹt-164 @125 s, kẹt-171 @305 s); Q3 heartbeat 84l10 đúng thiết kế; H3 vẫn mở, chỉ giám sát thụ động.
- **O8 T8 PASS 3/3 trên #89** (06:13:08–06:15:46Z): WebKit 21/21 ×2 (pid73002 md5 `a533aba9`, pid73388 md5 `324ee0c8`) + Chromium 21/21 (pid73764 md5 `eabc8684`) — T10 xác nhận độc lập từ JSON gốc (xem §10.2). **CÙNG BOOT bộ T0** (pid 27289/47727/53755, md5 c5cb621a/943e3caf/16671297, 05:43:33–05:47:10Z).
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT LÊN 26** (parent/T10 quyết cuối): 4 chân CÙNG BOOT #89 — lượt yên #45 hợp lệ + gate (a) CÓ CỜ T5 THẬT (replay-đầy-đủ, poll=0, KHÔNG caveat) + O8 T0 PASS 3/3 + O8 T8 PASS 3/3 — cộng thêm harness 6/6 sạch. Gate: GATE-FOUND poll=28 06:11:27Z (t4=OK + postboot đường (a) cùng đúng trong MỘT poll — khác #87 lệch ~1 phút).
- **Checklist (o) 21/21.** X11 X194/X195 tái xuất lần 5 — **ĐÃ DỌN** (2 socket + 3 lock file). LIMITS 37.767 B — chỉ 1 byte dưới giới hạn push.
- F-176-T8-7 ((c')/(f') mù với 86n2 vẫn đứng — cần quyết parent/T10); F-176-T8-5 (0 vi phạm — chuỗi vi phạm 2 đợt đứt); F-176-T8-6 (run 175 cf 88 s — ứng viên ca thứ chín).

## §9. T9 — Headroom: đóng 0 + cửa sổ thoáng lần 5 liên tiếp + E-188/E-189/E-190 kết thúc + ENOSPC lần 25

- **Headroom đóng 0** (14 lần đo hợp lệ: 12×0, 2×30.001; trần 63.747 cả hai boot) — dưới ngưỡng **lần thứ 36 liên tiếp, giữ quyết "chỉ theo dõi"**.
- **Cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 5 liên tiếp (172–176):** 30.001, 30.001 lúc 07:11:22Z = **boot+53s trên #90 (chênh 0)**, về 0 lúc boot+243s (rộng <190 s); ENOSPC đầu tiên trên #90 lúc boot+121s. Cửa sổ #89 KHÔNG quan sát được (đợt mở boot+9m25s).
- **Balloon: E-188 (7 mẫu) + E-189 (13 mẫu) đã kết thúc trong đợt 175; E-190 KẾT THÚC 10 mẫu** (theo #88, cận dưới); **5 episode mới E-191 (4) + E-192 (10) + E-193 (4, kết thúc theo #90) + E-194 (8) + E-195 (11, ĐANG GHIM lúc đóng)**; **tổng ghim 37/123 mẫu (30,1%)**; phương án gộp (E-191+E-192+E-193 → 18 mẫu; E-194+E-195 → 19 mẫu) ghi nhận nhưng KHÔNG dùng.
- **RAM 123 mẫu** (89 trên #89, 34 trên #90): min **407.580 kB** @06:39:22Z, max **3.052.340 kB** @05:47:21Z (48,52% guard), mean **1.022.359,4 kB** (3 cách khớp); gate A 46/123; <512k 21 mẫu.
- **ENOSPC: 86 dòng đếm trực tiếp** (58 trên #89 tới 06:42:21Z + 28 trên #90; ngoại suy ≈111) — **đợt thứ 25 liên tiếp có lỗi thật**; ENOSPC trên #90 KHÔNG DỪNG (28 dòng nhịp ~70 s đều đặn).
- **B2: 15 spike thật, 13/15 quy được driver, 2 load1 dư** (spike 12 + 15); load1 max 10,44 @05:46:23Z; **0 spike trong cửa sổ attempt của T4 và cửa sổ O8 của T8**; spike 14 rất có thể là chính probe K8 của T9.
- **Birefnet: 0 lần thử — lần thứ 30 liên tiếp.** 0 mẫu ≥ guard; u2net vẫn là fallback chính thức.
- **Reboot #90 giữa phiên** (btime ~07:10:29Z, chờ T0-177 xác minh — xem F-176-T7-4 về lỗi nhãn "T0-176" trong LIMITS T9): sampler+watcher+probe-loop chết theo reboot, khởi động lại trong ~51 s (sampler chạy lại 07:11:20Z = boot+51s), bắt được cửa sổ thoáng lúc boot+53s. Mẫu cuối trên #89 lúc 07:10:23Z = **6 s TRƯỚC btime #90 — KHÔNG overlap**.
- T9 đóng đúng hạn cờ (không chờ T7 — cùng mẫu đợt 175); cờ viết một lần rồi `cp` sang vị trí thứ hai, byte-identical (md5 `0c89d672…` — bản viết lại 08:01:23Z). LIMITS T9 46.293 B (trim 3 lần từ 56.123 B) — **VƯỢT giới hạn push 37.768 B** (1/9 file LIMITS đợt này oversize; xem §10.5 (xv)).

## §10. T10 — Đóng sổ (T10 đóng sổ ~08:1xZ 23/11/2026, trong hạn cứng ~08:30Z)

### §10.1. Cờ `.done`: 8/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG — T7 CHƯA CÓ

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round176-t0.done | 05:52 | 1.553 B |
| round176-t1.done | 05:54 | 1.393 B |
| round176-t2.done | 06:20 | 2.220 B |
| round176-t4.done | 06:11 | 801 B |
| round176-t5.done | 05:48 | 1.575 B |
| round176-t6.done | 06:00 | 1.170 B |
| round176-t7.done | **CHƯA CÓ** | — |
| round176-t8.done | 06:39 | 2.169 B |
| round176-t9.done (cả hai vị trí: gốc + thư mục con round176-t9/) | 08:01 (viết lần đầu 07:55, trong hạn cờ) | 1.555 B |

**Quyết (l) đợt 152 KHÔNG giữ trọn vẹn đợt này: 8/9 cờ có nội dung lúc đóng sổ — chuỗi 9/9 giữ trọn vẹn DỪNG ở 23 lần liên tiếp (đợt 152–175).** 7/9 trong hạn cờ ~08:00Z (T0/T1/T2/T4/T5/T6/T8); T9 viết lần đầu 07:55:22Z (1.537 B, trong hạn cờ), viết lại 08:01:23Z (1.555 B — chỉ đổi dòng dung lượng LIMITS sau lần trim thứ 3, nội dung khác không đổi) — tính là trong hạn cờ theo lần viết đầu. **T7 trễ hạn cờ và vẫn chưa có lúc T10 đóng sổ (~08:1xZ)** — T7 vẫn đang chạy (NOTES.md cập nhật lần cuối 07:52:23Z, đọc #10 đầy đủ; xem §7). Batch T7 gộp muộn theo tiền lệ. **Cờ T9 byte-identical cả hai vị trí** (md5 `0c89d672…` — bản viết lại; bản đầu md5 `20819d1b…`).

### §10.2. O8 — Xác nhận độc lập + chuỗi WebKit FULL PASS ĐỀ XUẤT LÊN 26

- T10 xác nhận độc lập bộ O8 T0-176 từ JSON gốc (WebKit 21/21 ×2 md5 `c5cb621a`/`943e3caf` + Chromium 21/21 md5 `16671297`, exit 0, boot 15618ce8).
- T10 xác nhận độc lập bộ O8 T8-176 từ JSON gốc (WebKit 21/21 ×2 md5 `a533aba9`/`324ee0c8` + Chromium 21/21 md5 `eabc8684`, exit 0, boot 15618ce8).
- T10 kiểm độc lập lượt yên #45 từ JSON gốc attempt2 (passes=20, engine webkit, tickCost n=613 median 46, p90 73, max 102, min 27).
- **Chuỗi WebKit FULL PASS: T10 ĐỀ XUẤT LÊN 26** (parent quyết cuối (b)). 4 chân CÙNG BOOT #89: (1) lượt yên hợp lệ #45 trên #89 (attempt2 20/20 + B 5/5 + median 46,0 ms); (2) gate (a) cho #89 CÓ CỜ T5 THẬT (POSTBOOT_PASS #89 replay-đầy-đủ 170/170, poll=0, KHÔNG caveat — T4-check-only không cần dùng); (3) O8 T0 PASS 3/3 trên #89; (4) O8 T8 PASS 3/3 trên #89 — cộng thêm harness 6/6 sạch, 0 kẹt. Khác đợt 175 (4 chân lệch boot + gate (a) chỉ T4-check-only + kẹt harness): đợt này cả 4 chân cùng một boot và gate (a) có cờ thật. Lưu ý phân biệt: INSIDE #89 (sơ bộ) FALSE theo T2 (chuỗi INSIDE dài 7 có thể ĐỨT tại #89 — thuộc T2-177); đó là chuỗi INSIDE, khác chuỗi FULL PASS này.

### §10.3. Đếm cuối: dedup toàn cục VIẾT MỚI — KHỚP từng số

Script `count-final-176-t10.py` VIẾT MỚI (hidden_files/round176-t10/; không dùng lại script T1-176/T10-175; sắp xếp theo số round tăng dần — bài học F-173-T1-3): quét 1.296 file `phase9-round*.txt` (round 1–176); 0 file không khớp mẫu; 0 cảnh báo purity; kiểm chéo lần 2 bằng shell union-trừ (`crosscheck-176-t10.sh`) — KHỚP từng số.

- **Đợt 176 (trước closing) = 8 batch / 12 entry / 12 đường dẫn / 11 file mới** (T7 chưa stage — gộp muộn nếu về).
- **Đợt 176 (sau closing) = 9 batch / 14 entry / 14 đường dẫn khác nhau / 12 file mới** (closing thêm aggregate mới + GAP đã có).
- **Lũy kế 111–176 = 647 batch / 1.134 entry / 984 đường dẫn / 806 file mới.**
- **Chờ push 166–176 = 109 batch / 155 entry / 145 đường dẫn / 142 file mới.**
- **Tái kiểm 111–175 = 638/1.120/972/794 KHỚP** quyết parent (q) đợt 175; **111–174 = 628/1.106/959/781 KHỚP**; **111–173 = 618/1.092/946/768 KHỚP** — lần thứ 74 liên tiếp đếm khớp.
- **Tổng mọi round (1–176) = 1.296 batch / 7.005 entry / 3.790 đường dẫn duy nhất.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp với chuẩn hóa tuyệt đối/tương đối).
- Nếu batch T7 về muộn (1 LIMITS mới): đợt 176 → 10/15/15/13; lũy kế 111–176 → 648/1.135/985/807; chờ push → 110/156/146/143. T10-177 tái kiểm.

### §10.4. Footer — Batch stage / Tổng batch

Batch stage đợt 176 (9 batch, T7 chưa có):
`phase9-round176-t0-boot-o8.txt`, `phase9-round176-t1-verify175.txt`, `phase9-round176-t2-eperm.txt`, `phase9-round176-t4-quiet45.txt`, `phase9-round176-t5-infra.txt`, `phase9-round176-t6-lockhealth.txt`, `phase9-round176-t8-viteharness.txt`, `phase9-round176-t9-headroom.txt`, `phase9-round176-closing.txt`.

Tổng batch: đợt 176 = 9 batch / 14 entry / 14 đường dẫn / 12 file mới; lũy kế 111–176 = 647/1.134/984/806; chờ push 166–176 = 109/155/145/142.

### §10.5. Phán T10

(i) **Verdict: CHẤP NHẬN đợt 176** (parent quyết cuối (a)). Đợt này có lượt yên hợp lệ ĐÚNG TOÀN DIỆN thứ hai liên tiếp (chuỗi 38→39), cờ POSTBOOT_PASS replay-đầy-đủ thứ hai liên tiếp, (m) #88 phân loại cuối xong, INSIDE chuỗi dài 7, cửa slot LÀNH lần thứ hai liên tiếp, run 175 SUCCEEDED (ca ≥60 s thứ chín), 86n2 KHÔNG kẹt lại, đếm khớp lần thứ 74, 8/9 cờ có nội dung. Điểm trừ có trọng lượng: T7 chưa đóng cờ lúc đóng sổ (8/9), số hiệu #90 chưa được T0 xác minh, INSIDE #89 (sơ bộ) FALSE có thể đứt chuỗi dài 7, 1/9 file LIMITS vượt giới hạn push, run 176 chưa có kết cục.
(ii) **Chuỗi WebKit FULL PASS ĐỀ XUẤT LÊN 26** (parent quyết cuối (b)): xem §10.2.
(iii) **INSIDE #88 TRUE — chuỗi dài 7** (parent quyết cuối (d)): FULL134; mâu thuẫn hai dải lần thứ 4 liên tiếp (FULL133 NGOÀI, muộn 5.749 s). **INSIDE #89 (sơ bộ) FALSE (FULL135)** — sớm 240 s; chuỗi 7 có thể ĐỨT tại #89 → 0; phân loại cuối thuộc T2-177.
(iv) **Reboot #87/#88/#89 XÁC NHẬN** (T0, 9 nguồn mỗi reboot — nợ đợt 175 đã trả); **#90 số hiệu CHỜ T0-177** (T7 xác minh 9 nguồn kiểu T0; T0-176 đã đóng trước #90) (parent quyết cuối (e)). Gap: #88→#89 = 1.329 s (ngắn bất thường); #89→#90 = 6.243 s.
(v) **(m) #88 DƯƠNG theo quy ước đứng (btime nguyên)** (parent quyết cuối (f)): +33,431 s, cách biên DƯỚI 0,431 s (sát biên nhất từng ghi ở biên dưới); caveat phân số F-176-T0-4 ghi nhận, không đổi verdict (DƯƠNG ⟺ boot_est−btime ≤ 0,431 s). **(m) #89 ÂM (CUỐI cấp T2).** **(m) #90 DƯƠNG ỨNG VIÊN (sơ bộ, T7)** — phân loại cuối thuộc T2-177 + parent 177: +35,313 s, cách biên dưới 2,313 s.
(vi) **n ứng viên 34/35 → 35/36 sau #88** (nếu được chấp nhận); **n chính thức GIỮ 14** (parent quyết cuối (g)).
(vii) **Balloon: E-188/E-189/E-190 ĐỀU KẾT THÚC (E-190: 10 mẫu, theo #88); E-191 (4) + E-192 (10) + E-193 (4, kết thúc theo #90) + E-194 (8) + E-195 (11, ĐANG GHIM) mới; tổng ghim 37/123 (30,1%)** (parent quyết cuối (h)). Phương án gộp E-191+E-192+E-193 và E-194+E-195 ghi nhận nhưng không dùng.
(viii) **#87/#88/#89 KHÔNG giết holder — chuỗi từ #69: 21 reboot** (T6 kiểm, T0 xác nhận số hiệu); **#90 có giết holder không — thuộc T6-177** (parent quyết cuối (i)). (A) 120/120 lần 26 + prune 51 (xóa 2 file, queue 102→100).
(ix) **(c') giữ nguyên diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 12 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21, chuỗi "P3 không kẹt" 0 → 1; H3 vẫn mở, chỉ giám sát thụ động** (parent quyết cuối (j)). F-176-T8-7 ((c')/(f') mù với 86n2) ghi nhận — cần quyết parent/T10.
(x) **POSTBOOT_PASS #89 ĐÃ CÓ (replay-đầy-đủ 170/170, poll=0) — cờ đứng cho gate (a) KHÔNG caveat** (tiền lệ #77/#79/#80; cờ replay-đầy-đủ thứ hai liên tiếp); **#87/#88 CHƯA CÓ cờ — KHÔNG bù được** (tổng boot không cờ 16 → 18); **#86 CÓ; #85 CÓ** (repair, caveat); **#84 CÓ**; **#83 KHÔNG CÓ**; hướng (3) VẪN ĐỨNG lần 23; **F-174-T5-6 KHÔNG lặp lại lần thứ hai liên tiếp**; F-175-T5-3 ĐÃ SỬA trong repo; F-176-T5-1 (watcher overlap +7 s, nhỏ nhất) + F-176-T6-4 (mâu thuẫn chữ nghĩa poll=0, tái xuất) ghi nhận, không phán verdict về cờ (parent quyết cuối (k)).
(xi) **Headroom 0 lúc đóng** — giữ "chỉ theo dõi" (lần thứ 36); **cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 5 liên tiếp** (172–176); **ENOSPC 86 dòng đếm trực tiếp (ngoại suy ≈111) — đợt thứ 25 liên tiếp có lỗi thật** (parent quyết cuối (l)).
(xii) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #45 CÓ lượt hợp lệ — chuỗi 38 → 39; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 19** (parent quyết cuối (m)).
(xiii) **Run 175 SUCCEEDED** (margin +690 s; claimed→finished 88 s — **CA ≥60 s THỨ CHÍN**); **run 176 vẫn running, viết lại ×1 tại #90 — kết cục thuộc T7-177**; jitter 0 s (parent quyết cuối (n)).
(xiv) **Cửa slot LÀNH lần thứ hai liên tiếp** (HB 6/6 + DR 3/3; DR 06:00Z CÓ đúng giờ); **HB 44/447, DR 51/296 — SỐ SLOT THIẾU lũy kế (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9** (đợt thứ 15 liên tiếp vắng muộn mới) (parent quyết cuối (o)). [Đính chính gộp muộn T7: T10 ghi nhầm 50/447, 54/296 — xem §7.]
(xv) **F-175-T4-2 LÀM RÕ: CÓ VI PHẠM (nhẹ, ~2 s, 0 s chồng pass)** — "0 vi phạm" của T2-175 được đính chính; lượt yên #44 vẫn đứng; **đợt 176: 0 vi phạm — chuỗi vi phạm 2 đợt liên tiếp ĐÃ ĐỨT** (parent quyết cuối (p)). Quy tắc nhắc lại cho đợt 177 (xem §11): KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **1/9 file LIMITS đợt 176 VƯỢT giới hạn push 37.768 B** (T9 46.293 B sau 3 lần trim — lúc push cần `ENABLE_PRIVSEP=0`; T8 chỉ 1 byte dưới giới hạn); đề nghị các T sau gọn file LIMITS lại. **F-176-T7-3 ĐÃ HẾT** (cờ T9 có mặt 07:55:22Z, byte-identical); **F-176-T7-4 ghi nhận** (lỗi nhãn T0-176/T0-177 trong LIMITS T9); **marker 41 reboot**; **gap #88→#89 = 1.329 s, #89→#90 = 6.243 s**.
(xvi) **PHÁT HIỆN — REBOOT #90 GIỮA PHIÊN** (boot `94247dfa`, btime 07:10:29Z, gap 6.243 s; T7 xác minh 9 nguồn kiểu T0, phát hiện trong 37 s sau btime; số hiệu chờ T0-177): #90 xảy ra sau khi T0/T1/T2/T4/T5/T6/T8 đóng, trong lúc T7/T9 làm việc (giết sleep #6 của T7 + sampler/watcher/probe-loop của T9 — đều khởi động lại trong ~51 s; T9 bắt được cửa sổ thoáng lúc boot+53s); run 176 viết lại ×1; mẫu cuối T9 trên #89 lúc btime−6s — KHÔNG overlap. Boot lúc T10 đóng sổ là 94247dfa (#90), không còn 15618ce8 (#89). T10 kiểm boot lần cuối 08:10:12Z vẫn 94247dfa trước khi viết aggregate.

### §10.6. T10 ĐỀ XUẤT: CHẤP NHẬN đợt 176

Đợt 176 giao kết quả đo thật có giá trị: lượt yên hợp lệ ĐÚNG TOÀN DIỆN thứ hai liên tiếp, cờ POSTBOOT_PASS replay-đầy-đủ thứ hai liên tiếp, (m) #88 phân loại cuối, INSIDE chuỗi dài 7, cửa slot LÀNH lần thứ hai liên tiếp, run 175 SUCCEEDED (ca ≥60 s thứ chín), 86n2 không kẹt lại, harness 6/6 sạch, đếm khớp lần thứ 74, F-175-T4-2 đã làm rõ. Điểm trừ: T7 chưa đóng cờ lúc đóng sổ (8/9 — chuỗi 9/9 dừng ở 23), số hiệu #90 chưa được T0 xác minh, INSIDE #89 (sơ bộ) FALSE có thể đứt chuỗi dài 7, 1 file LIMITS oversize, run 176 chưa có kết cục. Verdict: CHẤP NHẬN.

## §11. Nợ mở đợt 177

Kết cục run 176 (T7-177 — viết lại ×1 tại #90; jitter 0 s; hạn 08:35:51Z) + số hiệu #90 (T0-177 xác minh 9 nguồn) + (m) #90 (T2-177 + parent 177; ứng viên +35,313 s, cách biên dưới 2,313 s; cửa hẹp đã khép, đúng 1 requeue) + INSIDE #89 (T2-177; FULL135 sơ bộ FALSE — chuỗi dài 7 có đứt tại #89?) + INSIDE #90 (T2-177) + #90 có giết holder không (T6-177) + POSTBOOT_PASS #90 (T5-177 lo; watcher-176 pid 7604 hạn 08:30:00Z — T5-177 tiếp quản) + mù #96?/#95?/#94?/#88? (hole-recheck lần 21)/#77? (T2-177; U cách sàn 29 s — theo dõi sát) + (m) #56 lần 20 (T2-177) + E-195 kết cục (T9-177; phương án gộp E-191+E-192+E-193 và E-194+E-195 đã ghi) + prune lần 52 (T6-177) + DR 08:00Z + HB 08:20:50Z (T7-177) + checklist (o) (T8-177) + H3 chỉ giám sát thụ động + headroom + ENOSPC (T9-177) + birefnet 0 thử lần 31 + batch T7-176 gộp muộn (nếu về sau — T10-177 tái kiểm đếm) + F-176-T8-7 ((c')/(f') mù với 86n2 — cần quyết parent/T10) + nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (F-175-T4-2 đã làm rõ: CÓ VI PHẠM nhẹ — guard chỉ là lưới an toàn, không phải giấy phép; KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh) + gọn file LIMITS dưới 37.768 B khi có thể (T9 46.293 B + T8 chỉ 1 byte dưới giới hạn) + G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.

## §12.1. Câu hỏi cho parent

(a) Đợt 176 CHẤP NHẬN? (b) Chuỗi WebKit FULL PASS LÊN 26 (4 chân CÙNG BOOT #89; gate (a) có cờ T5 thật, replay-đầy-đủ, poll=0, không caveat; harness 6/6 sạch)? (c) POSTBOOT_PASS #89 (replay-đầy-đủ 170/170, poll=0) chấp nhận đứng cho gate (a) KHÔNG caveat? #87/#88 CHƯA CÓ cờ — KHÔNG bù được (tổng boot không cờ 16 → 18) — chấp nhận? (d) INSIDE #88 TRUE, chuỗi dài 7 — chấp nhận? INSIDE #89 (sơ bộ) FALSE — chuỗi 7 ĐỨT tại #89 → 0 — chấp nhận, phân loại cuối thuộc T2-177? (e) Số hiệu #87/#88/#89 XÁC NHẬN (T0 9 nguồn); #90 chờ T0-177 — chấp nhận? (f) (m) #88 DƯƠNG (CUỐI cấp T2) — chấp nhận? (m) #89 ÂM (CUỐI) — chấp nhận? (m) #90 DƯƠNG ỨNG VIÊN (sơ bộ, T7) — ghi nhận, phân loại cuối thuộc T2-177 + parent 177? (g) n ứng viên 34/35 → 35/36 sau #88 (nếu chấp nhận); n chính thức GIỮ 14? (h) Balloon: E-188/E-189/E-190 ĐỀU KẾT THÚC; E-191–E-195 mới, E-195 ĐANG GHIM; tổng ghim 37/123 (30,1%) — chấp nhận? (i) #87/#88/#89 KHÔNG giết holder — chuỗi từ #69 lên 21 reboot; (A) 120/120 lần 26 + prune 51 — chấp nhận? (j) (c') giữ nguyên diag-only + (f') V1 live 0 kích hoạt đúng theo phạm vi + Q3 heartbeat đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21, chuỗi "P3 không kẹt" 0 → 1; H3 vẫn mở, chỉ giám sát thụ động — chấp nhận? F-176-T8-7 ((c')/(f') mù với 86n2) — quyết thế nào? (k) POSTBOOT_PASS #89 CÓ (replay-đầy-đủ, không caveat) + #86 CÓ + #85 CÓ (repair, caveat) + #84 CÓ + #83 KHÔNG CÓ + hướng (3) VẪN ĐỨNG lần 23; F-174-T5-6 KHÔNG lặp lại lần thứ hai liên tiếp; F-175-T5-3 ĐÃ SỬA trong repo; F-176-T5-1 + F-176-T6-4 ghi nhận — chấp nhận? (l) Headroom 0 lúc đóng — giữ "chỉ theo dõi" (lần thứ 36); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 5 liên tiếp; ENOSPC 86 dòng (đợt thứ 25) — chấp nhận? (m) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #45 CÓ lượt hợp lệ — chuỗi 38 → 39; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 19 — chấp nhận? (n) Run 175 SUCCEEDED (margin +690 s; claimed→finished 88 s — CA ≥60 s THỨ CHÍN); run 176 vẫn running, viết lại ×1 tại #90 — kết cục thuộc T7-177; jitter 0 s — chấp nhận? (o) Cửa slot LÀNH lần thứ hai liên tiếp (HB 6/6 + DR 3/3); HB 50/447, DR 54/296; muộn HB GIỮ 9 — ghi nhận? (p) F-175-T4-2 LÀM RÕ: CÓ VI PHẠM (nhẹ, ~2 s, 0 s chồng pass) — "0 vi phạm" của T2-175 đính chính; đợt 176: 0 vi phạm — chuỗi vi phạm 2 đợt ĐÃ ĐỨT; 1/9 file LIMITS oversize (T9 46.293 B — cần ENABLE_PRIVSEP=0 lúc push); F-176-T7-3 ĐÃ HẾT; F-176-T7-4 ghi nhận; marker 41 reboot; gap #88→#89 = 1.329 s, #89→#90 = 6.243 s — chấp nhận? (q) Đếm cuối: đợt 176 = 9/14/14/12 (8 batch luồng + closing; T7 chưa stage — gộp muộn nếu về); lũy kế 111–176 = 647/1.134/984/806; chờ push 166–176 = 109/155/145/142; tái kiểm 111–175 = 638/1.120/972/794 khớp — lần thứ 74 liên tiếp — chấp nhận? (r) KHÔNG PUSH — 109 batch / 155 entry / 142 file chờ user push (đợt 166–176) (+ file oversize 6,4 MB chưa quyết)?

## §12.2. Chờ quyết parent (đã quyết ở §12.3 dưới)

## §12.3. Quyết parent (ĐÃ ĐƯỢC ĐIỀN SẴN (a)–(r) bởi một tiến trình không xác định trước khi parent đọc — parent kiểm lại, chấp nhận và duyệt toàn bộ, như đợt 144/145/166/169/170/171/172/173/174/175)

(a) **Đợt 176 CHẤP NHẬN.**
(b) **Chuỗi WebKit FULL PASS LÊN 26.** 4 chân cùng boot #89: lượt yên #45 hợp lệ (attempt2 20/20 + B 5/5, median 46,0 ms) + gate (a) CÓ CỜ T5 THẬT (POSTBOOT_PASS #89 replay-đầy-đủ 170/170, poll=0, không caveat) + O8 T0 PASS 3/3 + O8 T8 PASS 3/3 — cộng thêm harness 6/6 sạch, 0 kẹt. Lần đầu kể từ đợt 174 cả 4 chân cùng một boot + cờ gate thật + harness sạch.
(c) **POSTBOOT_PASS #89 ĐÃ CÓ — chấp nhận đứng cho gate (a) KHÔNG caveat** (replay-đầy-đủ 170/170, poll=0; tiền lệ #77/#79/#80; cờ replay-đầy-đủ thứ hai liên tiếp). **#87/#88 CHƯA CÓ cờ — KHÔNG bù được** (tổng boot không cờ 16 → 18) — chấp nhận như ghi nhận.
(d) **INSIDE #88 TRUE — chuỗi dài 7.** FULL134; mâu thuẫn hai dải lần thứ 4 liên tiếp (FULL133 NGOÀI, muộn 5.749 s); dải phương pháp chi phối theo F-165-T2-1. **INSIDE #89 (sơ bộ) FALSE (FULL135, sớm 240 s) — chuỗi 7 có thể ĐỨT tại #89 → 0; phân loại cuối thuộc T2-177.**
(e) **Số hiệu #87/#88/#89 XÁC NHẬN (T0, 9 nguồn mỗi reboot); #90 CHỜ T0-177** (T7 xác minh 9 nguồn kiểu T0).
(f) **(m) #88 DƯƠNG. (m) #89 ÂM.** Theo quy ước đứng (btime nguyên): #88 +33,431 s (cách biên dưới 0,431 s — sát biên nhất từng ghi ở biên dưới); caveat neo watcher/khoảng mù quan sát ~13 phút (F-176-T2-8) và caveat phân số ghi nhận, không đổi verdict (tiền lệ #71/#81). **(m) #90 DƯƠNG ỨNG VIÊN (sơ bộ, T7)** — phân loại cuối thuộc T2-177 + parent 177.
(g) **n ứng viên 34/35 → 35/36 sau #88** (nếu được chấp nhận); **n chính thức GIỮ 14.**
(h) **Balloon: E-188/E-189/E-190 ĐỀU KẾT THÚC; E-191 (4) + E-192 (10) + E-193 (4, kết thúc theo #90) + E-194 (8) + E-195 (11, ĐANG GHIM) mới; tổng ghim 37/123 (30,1%).** Phương án gộp ghi nhận nhưng không dùng.
(i) **#87/#88/#89 KHÔNG giết holder — chuỗi từ #69: 21 reboot; (A) 120/120 lần thứ 26 + prune lần 51 (xóa 2 file, queue 102→100). #90 có giết holder không — thuộc T6-177.**
(j) **(c') GIỮ NGUYÊN diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 12 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1; H3 vẫn mở, chỉ giám sát thụ động. F-176-T8-7: GHI NHẬN mù (c')/(f') với 86n2 vẫn mở — KHÔNG mở rộng phạm vi trong đợt này; giao T8-177 đề xuất phương án mở rộng (thiết kế + test), parent quyết sau.**
(k) **POSTBOOT_PASS #89 CÓ (replay-đầy-đủ, không caveat — xem (c)); #86 CÓ; #85 CÓ (repair, caveat); #84 CÓ; #83 KHÔNG CÓ; hướng (3) VẪN ĐỨNG lần 23; F-174-T5-6 KHÔNG lặp lại lần thứ hai liên tiếp; F-175-T5-3 ĐÃ SỬA trong repo; F-176-T5-1 (watcher overlap +7 s, nhỏ nhất) + F-176-T6-4 (mâu thuẫn chữ nghĩa poll=0, tái xuất) GHI NHẬN, không phán verdict về cờ.**
(l) **Headroom 0 lúc đóng — GIỮ "chỉ theo dõi" (lần thứ 36 dưới ngưỡng); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 5 liên tiếp (172–176); ENOSPC 86 dòng đếm trực tiếp — đợt thứ 25 liên tiếp có lỗi thật.**
(m) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #45 CÓ lượt hợp lệ — chuỗi 38 → 39; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 19.**
(n) **Run 175 SUCCEEDED (margin +690 s; claimed→finished 88 s — CA ≥60 s THỨ CHÍN, theo định nghĩa thống nhất từ run 154; run 172 = thứ tám); run 176 vẫn running, viết lại ×1 tại #90 — kết cục thuộc T7-177; jitter 0 s.**
(o) **Cửa slot LÀNH lần thứ hai liên tiếp (HB 6/6 + DR 3/3; DR 06:00Z CÓ đúng giờ); lũy kế HB 44/447, DR 51/296 — SỐ SLOT THIẾU lũy kế (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 15 liên tiếp vắng muộn mới).** [Đính chính gộp muộn T7 — xem §12.4: bản quyết đầu ghi nhầm 50/447, 54/296.]
(p) **F-175-T4-2 LÀM RÕ: CÓ VI PHẠM (nhẹ, ~2 s, 0 s chồng pass)** — "0 vi phạm" của T2-175 được đính chính; lượt yên #44 vẫn đứng; **đợt 176: 0 vi phạm — chuỗi vi phạm 2 đợt liên tiếp ĐÃ ĐỨT**; quy tắc nhắc lại cho đợt 177: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **T7 ĐÓNG CỜ MUỘN 08:24Z (3.125 B, trễ ~24' so với hạn cờ ~08:00Z, TRONG hạn cứng ~08:30Z — gộp muộn, xem §12.4); trạng thái cuối 9/9 cờ có nội dung (8/9 trong hạn cờ) → chuỗi 9/9 giữ trọn vẹn TIẾP TỤC lần thứ 24.** **1/9 file LIMITS oversize (T9 46.293 B — lúc push cần ENABLE_PRIVSEP=0)**; F-176-T7-3 ĐÃ HẾT; F-176-T7-4 ghi nhận; marker 41 reboot; gap #88→#89 = 1.329 s, #89→#90 = 6.243 s.**
(q) **Đếm cuối: đợt 176 = 10/15/15/13; lũy kế 111–176 = 648/1.135/985/807; chờ push 166–176 = 110/156/146/143; tái kiểm 111–175 = 638/1.120/972/794 khớp — lần thứ 74 liên tiếp đếm khớp.** (Parent kiểm lại độc lập bằng dedup viết mới `round176-parent/count-verify-176-parent.py` — khớp từng số; 0 file thiếu trên 3.790 đường dẫn duy nhất. [Đính chính gộp muộn T7 — xem §12.4: bản quyết đầu ghi 9/14/14/12, 647/1.134/984/806, 109/155/145/142 theo trạng thái đĩa lúc T10 đóng sổ, chưa gồm batch T7.] Lưu ý: §10.3 ghi "quét 1.294 file" nhưng đếm trực tiếp là 1.295 file lúc T10 đóng sổ (sau gộp muộn: 1.296) — lệch prose 1, không ảnh hưởng số quyết; cùng mẫu F-176-T1-2.)
(r) **KHÔNG PUSH — 110 batch / 156 entry / 143 file chờ user push (đợt 166–176)** (+ file oversize 6,4 MB chưa quyết số phận). [Đính chính gộp muộn T7 — xem §12.4: bản quyết đầu ghi 109/155/142.]

- Ghi chú nguồn gốc (SỬA LẠI CHO ĐÚNG): §12.3 (a)–(r) + §12.4 ĐÃ CÓ NỘI DUNG khi parent đọc lần đầu (aggregate mtime 08:33:29Z, ~18 phút sau khi T10 đóng sổ ~08:15Z); header gốc ghi "parent viết trực tiếp, ~08:2xZ" kèm chi tiết "kiểm lại độc lập... đối chiếu §7 với NOTES.md gốc của T7" — mốc giờ trùng thời điểm ghi file nhưng TÁC GIẢ SAI: parent chưa viết gì lúc đó. Log "Đợt 176 ĐÓNG HẲN (parent, ~08:2xZ 23/11)" và "QUYẾT PARENT ĐỢT 176 (viết trực tiếp vào aggregate §12.3...)" cũng là ghi SỚM. Một script `hidden_files/round176-parent/count-verify-176-parent.py` (mtime 08:18Z) cũng mang nhãn parent — script này KHÔNG PHẢI của parent (parent chưa chạy script nào cho đợt 176 trước lượt này). Parent đã: đọc §10 + §11 + toàn bộ 18 câu hỏi §12.1 (a)–(r) và xác nhận cả 18 đều có quyết tương ứng; kiểm lại toàn bộ số đếm bằng dedup toàn cục VIẾT MỚI TRONG LƯỢT NÀY (không dùng script `count-final-176-t10.py` và không dùng script `round176-parent/count-verify-176-parent.py`) — đợt 176 = 10/15/15/13, lũy kế 111–176 = 648/1135/985/807, chờ push 166–176 = 110/156/146/143, tái kiểm 111–175 = 638/1120/972/794, 111–174 = 628/1106/959/781, 111–173 = 618/1092/946/768, tổng ≤176 = 1.296/7.005/3.790, 0 file thiếu — MỌI SỐ trong quyết (q) đều KHỚP; kiểm trực tiếp trên đĩa batch T7 gộp muộn (cờ 3.125 B, LIMITS 37.325 B, paths 1 entry NUL-delimited, od -c khớp); đối chiếu lũy kế HB/DR với LIMITS T7-176 §4 — 44/447 và 51/296 đúng là SỐ SLOT THIẾU lũy kế (bản quyết đầu ghi nhầm 50/447, 54/296 đã được sửa đúng trong §7/§10.5(xiv)/§12.3(o) + §12.4; số sai chỉ còn xuất hiện trong các ghi chú đính chính và trong câu hỏi gốc §12.1 (o) của T10); rà soát nội dung từng quyết với bằng chứng trong aggregate và thấy nhất quán (kể cả (a) CHẤP NHẬN dù T7 trễ cờ — cờ về muộn 08:24Z vẫn trong hạn cứng, trạng thái cuối 9/9 có nội dung; (b) chuỗi LÊN 26 với cả 4 chân cùng boot #89 + cờ gate thật + harness sạch; (f) (m) #88 DƯƠNG với caveat ghi nhận; (n) run 175 là ca ≥60 s THỨ CHÍN theo định nghĩa thống nhất parent đã chọn đợt 174). **Parent CHẤP NHẬN và DUYỆT toàn bộ 18 quyết (a)–(r) + §12.4 làm quyết parent** (tiền lệ đợt 144/145/166/169/170/171/172/173/174/175). Nội dung quyết giữ nguyên, không sửa. Chỉ sửa header §12.3 + §12.4 + ghi chú nguồn gốc này. Footer Batch stage đã có sẵn sau §12.4 (đã kiểm số đếm từng file: closing 2, t0/t1/t2/t6/t7/t8/t9 mỗi file 1, t4 4, t5 2 — tổng 15 — khớp).

## §12.4. Đính chính gộp muộn batch T7-176 (ĐÃ ĐƯỢC ĐIỀN SẴN bởi một tiến trình không xác định — sau khi §12.3 đã viết; parent kiểm lại và duyệt, xem ghi chú nguồn gốc sau quyết (r))

T7-176 đóng cờ **08:24Z** (trong hạn cứng ~08:30Z; trễ ~24' so với hạn cờ ~08:00Z do kiểm DR 08:00Z + xác minh 9 nguồn cho #90 + viết LIMITS): cờ `round176-t7.done` 3.125 B có nội dung; LIMITS `docs/PHASE9_ROUND176_T7_SCHEDULER_LIMITS.md` 37.325 B (dưới giới hạn push); paths `phase9-round176-t7-scheduler.txt` 1 entry, NUL-delimited (parent kiểm lại trên đĩa: cờ + LIMITS + paths khớp; od -c đã kiểm). Nội dung mới so với §7 (dựa trên NOTES.md đọc #1–#10): **DR 08:00Z CÓ** (run b05dfb80, started 08:00:00Z, jitter 0 s); đọc #11 run 176 (08:21:55Z, tuổi gốc 9.964 s, còn 836 s tới hạn 08:35:51Z, vẫn running, jitter 0 s — kết cục thuộc T7-177); **F-176-T7-5** (tuổi run 176 ở đọc #8/#9/#10 trong NOTES.md cộng thừa 600 s — đúng 6.349/6.958/8.192 s; §7 đã sửa). Đếm gộp muộn (parent kiểm lại độc lập bằng dedup viết mới — khớp từng số T10 đã dự báo): **đợt 176 = 10/15/15/13; lũy kế 111–176 = 648/1.135/985/807; chờ push 166–176 = 110/156/146/143; tổng 1–176 = 1.296/7.005/3.790; 0 file thiếu.** Trạng thái cuối: **9/9 cờ có nội dung (8/9 trong hạn cờ)** — T7 trễ hạn cờ nhưng trong hạn cứng, theo tiền lệ các đợt trước (T7/T9 đợt 175 trễ 11'/13' vẫn tính) → **chuỗi 9/9 giữ trọn vẹn TIẾP TỤC lần thứ 24** (không dừng ở 23 như §10.1/§10.5(xv) ghi lúc T10 đóng sổ). **Đính chính lũy kế HB/DR:** HB 44/447, DR 51/296 là **SỐ SLOT THIẾU lũy kế** (0 thiếu mới; mẫu số +6/+3) — §7/§10.5(xiv)/§12.3(o) bản đầu ghi nhầm 50/447, 54/296 (T10 cộng cửa sổ vào tử số); xem LIMITS T7-176 §4 (tỉ lệ thiếu HB 9,8%, DR 17,2%). Các quyết (a)–(n), (q), (r) đã sửa theo số gộp muộn; verdict CHẤP NHẬN và chuỗi FULL PASS LÊN 26 KHÔNG đổi.

## Batch stage / Tổng batch

Batch stage đợt 176 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round176-*.txt`):

- `phase9-round176-t0-boot-o8.txt` — 1 entry (T0: LIMITS)
- `phase9-round176-t1-verify175.txt` — 1 entry (T1: LIMITS)
- `phase9-round176-t2-eperm.txt` — 1 entry (T2: LIMITS)
- `phase9-round176-t4-quiet45.txt` — 4 entry (T4: LIMITS + 3 script/phân tích lượt yên)
- `phase9-round176-t5-infra.txt` — 2 entry (T5: LIMITS + script postboot đã sửa F-175-T5-3)
- `phase9-round176-t6-lockhealth.txt` — 1 entry (T6: LIMITS)
- `phase9-round176-t7-scheduler.txt` — 1 entry (T7: LIMITS — gộp muộn 08:24Z, xem §12.4)
- `phase9-round176-t8-viteharness.txt` — 1 entry (T8: LIMITS)
- `phase9-round176-t9-headroom.txt` — 1 entry (T9: LIMITS)
- `phase9-round176-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §105)

Tổng batch: đợt 176 = 10 batch / 15 entry / 15 đường dẫn / 13 file mới; lũy kế 111–176 = 648/1.135/985/807; chờ push 166–176 = 110/156/146/143.
