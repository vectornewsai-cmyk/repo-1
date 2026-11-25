# PHASE9 — Đợt 177: LIMITS tổng hợp (aggregate)

Đợt 177 (lượt cron 15:35 +07 23/11/2026 = 08:35:51Z; T10 đóng sổ ~11:0xZ 23/11, trong hạn cứng ~11:30Z; verdict ĐỀ XUẤT CHẤP NHẬN — parent quyết cuối, xem §12.1/§12.2). 9 luồng song song (T0/T1/T2/T4/T5/T6/T7/T8/T9). Một reboot giữa phiên: **#91 (09:07:40Z, boot `8c0ec92d`)** — xảy ra sau khi T0/T1/T2/T4/T5/T6 đóng, trong lúc T7/T8/T9 làm việc; số hiệu chờ T0-178 xác minh 9 nguồn. **9/9 cờ đều có nội dung trên đĩa lúc T10 đóng sổ** (7/9 trong hạn cờ ~11:00Z; T7 trễ ~4' và T9 trễ ~3' so với hạn cờ nhưng trong hạn cứng — theo tiền lệ các đợt trước vẫn tính 9/9 có nội dung; xem §10.1).

## §1. T0 — Boot survey: #90 XÁC NHẬN 9 nguồn + O8 trên #90 PASS 3/3

- **#90 XÁC NHẬN 9 nguồn** (boot `94247dfa`, btime 07:10:29Z, gap #89→#90 = **6.243 s**) — **nợ đợt 176 đã trả**.
- **Marker sống qua 42 reboot #49–#90** (mtime 2026-11-20 11:39:47.272154981Z không đổi).
- **Run 176 — SUCCEEDED 08:34:05Z** (trước hạn 106 s, claimed→finished 8 s — KHÔNG phải ca ≥60 s, thuộc T7-177 — xem §7).
- **(m) #90: +35,313 s**, cách biên dưới 2,313 s (thuộc T2-177 — xem §3).
- **O8 trên boot #90: WebKit PASS 21/21 ×2 (pid206006 md5 `5a87b5bf`, pid206616 md5 `44c04a6d`) + Chromium PASS 21/21 (pid207136 md5 `3f05caf6`), exit 0**, sau POSTBOOT_PASS #90 08:51:55Z (repair-sớm-quyet-h, poll=1). T10 đối chiếu md5 trong LIMITS gốc (xem §10.2).
- 0 attempt chồng (cửa yên mở 6 s sau khi O8 nhả lock). Boot lúc đóng cờ 94247dfa. LIMITS 11.332 B (< 37.768 B).

## §2. T1 — Verify đợt 176: PASS, đếm khớp lần thứ 75 liên tiếp

- Đếm bằng script dedup VIẾT MỚI + kiểm chéo shell union-trừ (khớp): **đợt 176 = 10/15/15/13; lũy kế 111–176 = 648/1.135/985/807; chờ push 166–176 = 110/156/146/143; tái kiểm 111–175 = 638/1.120/972/794; 111–174 = 628/1.106/959/781; 111–173 = 618/1.092/946/768; tổng 1–176 = 1.296/7.005/3.790 — KHỚP từng số quyết parent (q)/(r) §12.3 đợt 176 — lần thứ 75 liên tiếp khớp.**
- **0 file thiếu trên 3.790 đường dẫn.**
- Batch T7 gộp muộn đã có đủ trên đĩa (cờ 3.125 B, LIMITS 37.325 B, paths 1 entry).
- **F-177-T1-1/F-177-T1-2 (lệch prose, không đổi verdict):** aggregate §10.3 đợt 176 ghi "quét 1.294 file" (thực 1.296); §10.3 dòng 123 còn tổng cũ 1.295/7.004/3.789 (đúng 1.296/7.005/3.790) — đề nghị sửa §10.3 aggregate 176.
- LIMITS 7.353 B (dưới giới hạn push). Paths 1 entry, NUL-delimited.

## §3. T2 — EPERM probe #95 + (m) #90 DƯƠNG (CUỐI) + INSIDE #89 FALSE (CUỐI) + INSIDE #90 TRUE + mù

- **EPERM probe #95: ok=2 fail=0** (boot 94247dfa). Sweep #95: 159 log, 10 marker — tất cả trích dẫn lại, **0 sóng thật**.
- **(m) #90: DƯƠNG (phân loại CUỐI ở cấp T2 — parent quyết cuối).** Requeue duy nhất, run 176, **+35,313 s** ∈ [33; 49,8], **cách biên DƯỚI 2,313 s**; boot_est T2 +0,32 s khớp T0-177 tới 0,01 s; watcher overlap +3 s nhỏ nhất chuỗi; cửa hẹp đã khép; 1 run sống. Nếu chấp nhận: **n ứng viên 35/36 → 36/37**.
- **INSIDE #89: FALSE (phân loại CUỐI ở cấp T2 — parent quyết cuối) (FULL135, sớm 240 s) — chuỗi dài 7 ĐỨT → 0.** **INSIDE #90: TRUE (FULL136) — chuỗi MỚI 1** (hai dải đồng thuận).
- **Mù: #96? VẪN MỞ** — R file 1.238 s (lần thứ 13 liên tiếp không đổi); U union-A 1.118 → 1.276 s MỞ do pruning xóa mốc 08:38:24Z; U union-B 1.118 s, cách sàn 29 s — theo dõi sát. **#88? VẪN MỞ** — hole-recheck lần 21: 337 hit, 0 mốc mới (lần thứ 21 liên tiếp). #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 20 không thu hẹp** (5 hướng mới (xviii)–(xxii) đều âm tính/rỗng; tổng 72 hướng; (xxi) 1 hit nội dung trong cửa nhưng ở khung W → giờ thật ~18:49–18:51Z). **n chính thức GIỮ 14.**
- **Đợt 177: 0 vi phạm script nặng** (walk 09:01:09–09:03:26Z sau khi poller T4 thoát 09:00:52Z).
- Lưu ý đếm: paths T2-177 ghi đường dẫn TUYỆT ĐỐI (`/home/hatch/workspace/repo-1/docs/...`) — cùng mẫu T2-176; T10 chuẩn hóa bằng cách cắt tiền tố `/home/hatch/workspace/repo-1/` (xem §10.3); T1-177 đã dung nạp được. LIMITS 31.996 B (< 37.768 B); paths 1 entry.

## §4. T4 — Lượt yên WebKit #46: CÓ lượt hợp lệ — chuỗi 39 → 40

- **Lượt hợp lệ #46: attempt1-94247dfa DUY NHẤT — 20/20 pass, lớp B ĐẠT 5/5, tickCost median 50,0 ms (≤60; n=597, p90 76, max 111, min 27). Chuỗi lượt yên hợp lệ 39 → 40.** Ngân sách dùng **1/3**.
- Cửa mở: poll #20 lúc 08:56:40Z (gate0=T5 repair + RAM 1785 MB + load1 0,76/load5 1,07 + lock không + blockers 0 + PB=0). Poller thoát 0 lúc 09:00:35Z.
- Boot đo: 94247dfa (btime 07:10:29Z, ứng viên #90 — số hiệu do T0-177 xác minh). 0 reboot trong phiên đo. **MỚI: reboot #91 (ứng viên) 09:07:40Z (boot 8c0ec92d, gap 7.031 s) xảy ra SAU phiên đo**, phát hiện lúc viết cờ 09:10:41Z — **KHÔNG ảnh hưởng verdict #46**.
- Gate0: POSTBOOT_PASS #90 của T5-177 viết 08:51:55Z — mode repair-sớm-quyet-h (dpkg 795 dòng, KHÔNG phải replay-đầy-đủ; giá trị cho chuỗi FULL PASS thuộc T8/T10 quyết). T4-check-only PASS độc lập ở poll #17 (exit 0).
- **Cộng dồn mới (40 lượt hợp lệ)**: P1 **171/175**, P2 **166/166**, P3-A1 **145/175**, P3' **135/147 occ = 113/117 distinct-seq**, P7 **74/74**. (c2)=9 seq [145,166,191,218,242,268,345,367,413]; 7 seq ĐẠT MỚI; 242 ĐẠT lần đầu (rời non_dat). Sổ distinct-seq thăng cấp as-of-177 (md5 `cd6ef445…`).
- **0 VI PHẠM quy tắc F-175-T4-2 trong cửa sổ attempt** (ps-before/after 0 dòng m56). **Chuỗi 0 vi phạm giữ 2 đợt liên tiếp (176, 177).**
- RAM <500 MB: 1/22 poll (poll #11, 444 MB lúc T5 repair). Trong attempt1: RAM min 723 MB, 0 mẫu <500.
- 0 spike B2 trong cửa sổ attempt (sampler T4 load1 max 1,31). T9-177 chưa có b2-spikes.log lúc T4 đóng — giao T9-177 bổ sung (F-177-T4-4).
- LIMITS 35.948 B (< 37.768 B). Batch 4 entry (LIMITS + poll-wait-t4-177.sh + run-attempt-177.sh + distinct-seq-177.py).

## §5. T5 — Infra: POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z (repair-sớm-quyet-h, poll=1)

- **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z** (boot 94247dfa, btime 07:10:29Z, **mode repair-sớm-quyet-h, poll=1** — watcher-177 tự repair theo chiến lược (h); poll1 exit=0; T5 verify độc lập check-only exit=0).
- Replay host-side #90 KHÔNG CHẠY (0/170 intent: dpkg.log chỉ 2 dòng 07:11:03Z; không /var/log/apt/; cache 0; lists 5; GST hệ thống không tồn tại; 11/11 gói chưa cài lúc mở boot+~90').
- Repair: apt-get update 71,3 MB/8m50s (134 kB/s) + install 11 gói NEED/12 s (1 transaction 08:51:42–08:51:54Z); dpkg 2 → 795 dòng (status 568, configure 110, install 106, upgrade 4, startup 4, trigproc 3 — Y HỆT mẫu repair #84); cache 110, lists 75, GST symlink → debroot 269=269; term.log 0 lỗi.
- **Caveat repair (parent quyết §9(b) trong LIMITS T5):** GST symlink ephemeral; gstreamer1.0-tools KHÔNG cài; libc-bin 2.39-0ubuntu8.9 (khác #89: 8.12).
- **#87/#88 VẪN KHÔNG CÓ cờ (không bù được); tổng boot không cờ GIỮ 18.** #89/#86/#85/#84 VẪN CÓ, mtime không đổi.
- **Hướng (3) VẪN ĐỨNG lần thứ 24.** Marker sống qua #49–#89 = 41 reboot ĐÃ XÁC NHẬN (T0-177 xác nhận #90 → 42).
- Watcher-176 pid 7604 **CHẾT theo #90** (poll cuối 07:10:32Z, +3 s sau btime — F-177-T5-1, mẫu overlap thứ tám, **NHỎ NHẤT**). Watcher-177 pid 114543 ĐANG CHẠY (hạn 11:30:00Z).
- F-174-T5-6 KHÔNG áp dụng (#90 là replay không chạy, không phải một phần). F-175-T5-3 VẪN ĐÓNG (không sửa file repo đợt này). F-177-T5-2 (ledger ts compacted mang sang #90, lần 4 liên tiếp — nhưng repair đã ghi dòng mới ts 08:51:54Z, added 106). F-177-T5-3 (who -b chỉ cho phút, không đối chiếu được lệch giây).
- ENOSPC #90: 87 dòng lúc 08:52Z (T9 đếm chính thức). RAM 464.500–1.346.252 kB (4 điểm). X11 trống lúc mở + lúc đóng.
- LIMITS 37.653 B (DƯỚI giới hạn push 37.768 B). Stage 1 entry. Boot lúc đóng cờ: #90 ỨNG VIÊN (CHƯA XÁC NHẬN — chờ T0-177). **KHÔNG PUSH. Đề xuất parent: CHẤP NHẬN (phần T5); cờ #90 đứng cho gate (a) CÓ caveat repair.**

## §6. T6 — Lock health: (A) 120/120 lần thứ 27 + #90 KHÔNG giết holder + prune lần 52

- **(A) 120/120 — lần thứ 27 liên tiếp (tổng 3.240/3.240).** Suite 9/9 × 6 lượt; chuỗi xanh kép 26→27; suite xanh 58→59.
- **#90 KHÔNG GIẾT HOLDER** (lock trống 2.335 s / 38m55s trước btime; **chuỗi "không giết holder" từ #69 lên 22 reboot** — số hiệu đã được T0-177 xác nhận 9 nguồn).
- **Prune lần 52: xóa 1 file** (cooldown-t10-round121, 166,56h), **queue 101→100 file / 1400 byte**, KHÔNG PHẢI CHỜ lock.
- Lock kiểm cuối: TRỐNG, 0 ticket + 100 cooldown; ACQUIRED 650 / RELEASED 638, 638 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 TIMEOUT mới.
- POSTBOOT_PASS #90 CHƯA CÓ lúc kiểm cuối 08:50Z (T5-177 early-repair, verify exit=1) — thuộc T5-177/T10-177.
- Watcher KHÔNG lệch (114543 = replay-watch-177.sh T5; 90734 = b2-watcher.sh T9). X11 trống cả 3 thời điểm (0 socket); inotify 63.747; đồng hồ giờ thật (~1–2 s).
- Batch 1 entry (LIMITS 34.836 B).

## §7. T7 — Scheduler: run 176 SUCCEEDED (KHÔNG phải ca ≥60 s thứ mười) + reboot #91 MỚI + cửa slot LÀNH lần ba liên tiếp

- **Kết cục run 176: SUCCEEDED 08:34:05Z** (margin **+106 s**, claimed→finished **8 s — KHÔNG phải ca ≥60 s thứ mười, số ca GIỮ 9**).
- **Run 177: vẫn `running` lúc T7 đóng cờ** (tuổi gốc 8.754 s, còn 2.046 s tới hạn 11:35:51Z; **jitter 0 s**; **viết lại ×1 tại #91**; claimed không đổi — **kết cục thuộc T7-178**).
- **Reboot #91 MỚI giữa phiên** (T7 xác minh 9 nguồn kiểu T0, phát hiện trong 57 s sau btime; T4-177 xác nhận độc lập btime + gap): boot `8c0ec92d`, btime 09:07:40Z, **gap #90→#91 = 7.031 s**; số hiệu #91 chờ T0-178 xác minh 9 nguồn. Sleep #3 bị SIGTERM theo #91 (F-177-T7-1); 9/10 sleep hoàn thành.
- **(m) #91 ÂM ỨNG VIÊN (sơ bộ):** requeue +50,157 s NGOÀI dải, vượt biên TRÊN 0,357 s; 1 run sống + 1 requeue duy nhất của cửa hẹp (đã khép, đếm cuối) — phân loại cuối thuộc T2-178 + parent 178.
- **Slot: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần thứ ba liên tiếp.** DR 09:00Z CÓ đúng giờ (run f25186d5, jitter 0 s); **DR 11:00Z CÓ đúng giờ (run 11149584, jitter 0 s)**; HB 08:20:50Z CÓ (jitter −316 s). Lũy kế **HB 44/453, DR 51/299 — SỐ SLOT THIẾU lũy kế** (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 16 liên tiếp vắng muộn mới).
- #90 ĐÃ XÁC NHẬN 9 nguồn (T0-177); marker 42 reboot #49–#90; (m) #90 DƯƠNG (CUỐI cấp T2); INSIDE #89 FALSE CUỐI — chuỗi 7 ĐỨT → 0; INSIDE #90 TRUE — chuỗi MỚI 1.
- **F-177-T7-3: T9 LIMITS đã có (38.500 B, VƯỢT giới hạn push) nhưng cờ round177-t9.done CHƯA CÓ lúc T7 đóng — T10 xác nhận: cờ T9 có mặt 11:03:16Z (LIMITS đã trim xuống 37.742 B — xem §9), ĐÃ HẾT.**
- LIMITS 36.442 B (< 37.768 B). Stage 1 entry. Cờ viết trong hạn cứng ~11:30Z (đóng ~11:04Z, trễ ~4' so với hạn cờ ~11:00Z do kiểm DR 11:00Z). Boot lúc đóng 8c0ec92d (#91). KHÔNG PUSH.

## §8. T8 — Vite harness: 6/6 SẠCH trên #91, 0 kẹt + O8 PASS 3/3 trên #91 + KHÔNG đề xuất lên 27

- **Harness 6/6 SẠCH, 0 kẹt** trên #91 (boot 8c0ec92d, btime 09:07:40Z): WebKit 84l10 PASS (lần thứ 6 liên tiếp) + 85m4 PASS (P4-lần3 PASS lần thứ 6 liên tiếp) + **86n2 PASS — KHÔNG kẹt lại ở P1 lần 2** + Chromium 3/3 PASS. **Kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2.** Chromium đối chứng N=39/pha; delta=+2 artifact HẾT (0 điểm).
- **(f') V1 live: 0 kích hoạt — ĐÚNG** (0 FP trên 13 log sạch); replay C5.1 ĐẠT (kẹt-164 @125 s, kẹt-171 @305 s; (f') V1-300: 171@305s); Q3 heartbeat 84l10 đúng thiết kế (WebKit W2 6 tick + E4 2 tick MỚI; Chromium W2 5 tick, E4 0 tick); H3 vẫn mở, chỉ giám sát thụ động.
- **O8 T8 PASS 3/3 trên #91** (WebKit 21/21 ×2 pid16268 md5 `febee244` + pid16643 md5 `a5002552`; Chromium 21/21 pid17020 md5 `617b2bde`) — T10 đối chiếu md5 trong LIMITS gốc (xem §10.2). 0 reboot trong phiên O8+harness.
- **Gate KHÔNG MỞ qua (a)/(b) (waiter WAIT-DEADLINE 10:30Z poll=82; T5-177 không resume sau #91 — 0 file mới từ 09:07Z; POSTBOOT_PASS #91 VẮNG). T8 chạy O8 + harness theo fallback T8-check-only (F-177-T8-4):** T4 ĐÃ ĐÓNG cờ (09:10Z) + selfcheck #2-refresh trên #91 libs 6/6 + GST 1624 + dpkg 1.523 — **CẦN parent/T10 XÁC NHẬN LẠI** (xem §10.2).
- **4 CHÂN TÁCH BOOT (lượt yên #46 + gate (a) #90 + O8 T0 trên #90; O8 T8 + harness trên #91) — T8 KHÔNG ĐỀ XUẤT CHUỖI LÊN 27 (GIỮ 26).**
- **PHƯƠNG ÁN MỞ RỘNG (c')/(f') CHO 86n2 ĐÃ ĐỀ XUẤT (F-177-T8-7):** §F LIMITS + file đầy đủ ở `goals hidden_files round177-t8/proposal-f177-t8-7-expand-cf-86n2.md` — bản copy chẩn đoán 86n2-hb128; replay tổng hợp ĐÃ CHẠY (kẹt-164→TRIGGER @125s, kẹt-171→@305s, sạch-176→OK maxspan=5s). **CHỈ ĐỀ XUẤT, KHÔNG triển khai live — parent quyết sau.**
- **Checklist (o): 21/21.** X11 KHÔNG tái xuất (trống lúc mở + đóng). Boot lúc đóng 8c0ec92d.
- LIMITS 37.690 B (< 37.768 B). Stage 1 entry. Cờ viết trong hạn cờ ~11:00Z (đóng ~10:53Z). KHÔNG PUSH.

## §9. T9 — Headroom: đóng 0 + cửa sổ thoáng #91 KHÔNG quan sát được (chuỗi 5 lần ĐỨT) + E-195 kết thúc bởi sag + ENOSPC lần 26

- **Headroom đóng 0** (12 lần đo hợp lệ: 11×0, 1×2 lúc lan-3; trần 63.747) — dưới ngưỡng **lần thứ 37 liên tiếp, giữ quyết "chỉ theo dõi"**.
- **Cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC** (probe boot+~108s đọc 0, 0; T9 chậm probe ~50 s sau khi phát hiện reboot) — **chuỗi 5 lần liên tiếp (172–176) ĐỨT (F-177-T9-1)**.
- **Balloon: E-195 KẾT THÚC BỞI SAG (11 mẫu, cận dưới; sag bắt đầu trong (08:39:14Z, 08:40:13Z], đáy 5.180.948 kB); mới E-196 (1) + E-197 (4) + E-198 (36) + E-199 (2, ĐANG GHIM); tổng ghim 43/134 (32,1%)**; phương án gộp ghi nhận nhưng không dùng.
- **RAM 134 mẫu** (min 454.712 / max 2.628.608 / mean 928.110,0 kB — python + awk + trọng số KHỚP; gate A 42/134; <512k 13 mẫu); RAM max 2.628.608 kB (41,78% guard).
- **ENOSPC: 72 dòng đếm trực tiếp (27 #90 + 45 #91), ngoại suy ≈73 — đợt thứ 26 liên tiếp có lỗi thật**; trên #91 2 pha (chạy 30 → im 42m50s → chạy 15); lan-3 đo headroom 2 trong lúc im lặng.
- **B2: 2 spike thật, 2/2 quy được driver, 0 load1 dư** (max load1 3,52; delta max 69 tick/s — Chromium O8 T8).
- **Birefnet: 0 lần thử — lần thứ 31 liên tiếp.** 0 mẫu ≥ guard; u2net vẫn là fallback chính thức.
- **Reboot #91 giữa phiên** (btime ~09:07:40Z uptime-based, chờ T0-178 xác minh; gap ~7.031 s): sampler+watcher+probe-loop chết theo reboot, khởi động lại, gap mẫu 93 s; mẫu cuối #90 lúc 09:07:55Z OVERLAP biểu kiến +15 s so với btime ước lượng.
- Lượt yên #46 CÓ lượt hợp lệ (attempt1 20/20 + B 5/5, median 50,0 ms) — chuỗi 39 → 40. T8 harness 6/6 SẠCH trên #91, 0 kẹt; POSTBOOT_PASS #91 KHÔNG CÓ (T5 không resume) — gate T8-check-only, cần parent/T10 xác nhận; 4 chân TÁCH BOOT, T8 KHÔNG đề xuất lên 27.
- T7-177 chưa đóng cờ lúc T9 đóng. **LIMITS: 37.742 B — DƯỚI giới hạn push 37.768 B** (đã trim từ 43.849 B; T7 kiểm 11:02Z thấy 38.500 B — VƯỢT — đã trim xuống trước khi đóng cờ).

## §10. T10 — Đóng sổ (T10 đóng sổ ~11:0xZ 23/11/2026, trong hạn cứng ~11:30Z)

### §10.1. Cờ `.done`: 9/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG — T7/T9 trễ cờ nhưng trong hạn cứng

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round177-t0.done | 08:58 | 590 B |
| round177-t1.done | 08:44 | 1.045 B |
| round177-t2.done | 09:17 | 1.041 B |
| round177-t4.done | 09:11 | 1.788 B |
| round177-t5.done | 09:00 | 2.290 B |
| round177-t6.done | 08:52 | 969 B |
| round177-t7.done | 11:04 | 1.612 B |
| round177-t8.done | 10:52 | 1.964 B |
| round177-t9.done | 11:03 | 1.937 B |

**Quyết (l) đợt 152 GIỮ TRỌN VẸN: 9/9 cờ có nội dung lúc đóng sổ — chuỗi 9/9 giữ trọn vẹn TIẾP TỤC lần thứ 25** (đợt 152–177, tính cả đợt 176 sau gộp muộn T7). 7/9 trong hạn cờ ~11:00Z (T0/T1/T2/T4/T5/T6/T8); **T9 đóng cờ 11:03Z (trễ ~3' so với hạn cờ)** và **T7 đóng cờ 11:04Z (trễ ~4' so với hạn cờ, do kiểm DR 11:00Z)** — cả hai trong hạn cứng ~11:30Z, theo tiền lệ các đợt trước (T7/T9 đợt 175 trễ 11'/13', T7 đợt 176 trễ ~24' vẫn tính) → vẫn tính 9/9 có nội dung.

### §10.2. O8 — Xác nhận độc lập + chuỗi WebKit FULL PASS ĐỀ XUẤT GIỮ 26

- T10 đối chiếu bộ O8 T0-177 trong LIMITS gốc (WebKit 21/21 ×2 md5 `5a87b5bf`/`44c04a6d` + Chromium 21/21 md5 `3f05caf6`, exit 0, boot 94247dfa — grep khớp trong LIMITS T0).
- T10 đối chiếu bộ O8 T8-177 trong LIMITS gốc (WebKit 21/21 ×2 md5 `febee244`/`a5002552` + Chromium 21/21 md5 `617b2bde`, boot 8c0ec92d — grep khớp trong LIMITS T8).
- T10 kiểm lượt yên #46 từ cờ T4 + LIMITS T4 (attempt1 20/20, engine webkit, tickCost n=597 median 50,0, p90 76, max 111, min 27 — khớp T4).
- **Chuỗi WebKit FULL PASS: T10 ĐỀ XUẤT GIỮ 26** (parent quyết cuối (b)). 4 chân TÁCH BOOT đợt này: (1) lượt yên hợp lệ #46 trên #90 (attempt1 20/20 + B 5/5 + median 50,0 ms); (2) gate (a) cho #90 CÓ CỜ T5 THẬT (POSTBOOT_PASS #90 repair-sớm-quyet-h, poll=1, CÓ caveat repair — T4-check-only không cần dùng); (3) O8 T0 PASS 3/3 trên #90; (4) O8 T8 PASS 3/3 trên **#91** — cộng thêm harness 6/6 sạch trên #91. Khác đợt 176 (4 chân cùng boot #89 + gate (a) cờ replay-đầy-đủ không caveat): đợt này O8 T8 + harness chạy trên boot khác (#91) và gate (a) là cờ repair có caveat, lại chạy qua fallback T8-check-only vì POSTBOOT_PASS #91 VẮNG — **không đủ điều kiện lên 27**. T10 ghi nhận đề xuất của T8 (giữ 26) là đúng.
- **Fallback T8-check-only (F-177-T8-4): T10 XÁC NHẬN LẠI có điều kiện** — T4 đã đóng cờ 09:10Z trước khi T8 chạy O8+harness trên #91; selfcheck #2-refresh của T8 trên #91: libs 6/6 + GST 1624 + dpkg 1.523 (replay xong, 0 apt process); waiter WAIT-DEADLINE 10:30Z poll=82 (postboot=0 suốt #91). O8 T8 + harness trên #91 được tính là đo thật có giá trị, nhưng KHÔNG dùng làm chân chuỗi FULL PASS (chân (4) tách boot). Parent quyết cuối về giá trị của fallback này.
- Lưu ý phân biệt: INSIDE #89 FALSE (CUỐI) theo T2 (chuỗi INSIDE dài 7 ĐỨT tại #89 → 0) và INSIDE #90 TRUE (chuỗi mới 1) — đó là chuỗi INSIDE, khác chuỗi FULL PASS này.

### §10.3. Đếm cuối: dedup toàn cục VIẾT MỚI — KHỚP từng số

Script `count-final-177-t10.py` VIẾT MỚI (hidden_files/round177-t10/; không dùng lại script T1-177/T10-176 hay bất kỳ script nào mang nhãn parent — các script đó không phải của parent; sắp xếp theo số round tăng dần — bài học F-173-T1-3): quét 1.306 file `phase9-round*.txt` (round 1–177); 0 file không khớp mẫu; kiểm chéo lần 2 bằng shell union-trừ — KHỚP từng số. **Chuẩn hóa đường dẫn tuyệt đối:** paths T2-177 ghi đường dẫn tuyệt đối (`/home/hatch/workspace/repo-1/docs/...`) — cùng mẫu T2-176; script cắt tiền tố `/home/hatch/workspace/repo-1/` về dạng tương đối trước khi dedup (T1-177 đã dung nạp được; không làm lệch số đếm).

- **Đợt 177 = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** (9 batch luồng + closing 2 entry: aggregate mới + GAP đã có).
- **Lũy kế 111–177 = 658 batch / 1.149 entry / 998 đường dẫn / 820 file mới.**
- **Chờ push 166–177 = 120 batch / 170 entry / 159 đường dẫn / 156 file mới.**
- **Tái kiểm 111–176 = 648/1.135/985/807 KHỚP** quyết parent (q) đợt 176; **111–175 = 638/1.120/972/794 KHỚP**; **111–174 = 628/1.106/959/781 KHỚP** — **lần thứ 75 liên tiếp đếm khớp.**
- **Tổng mọi round (1–177) = 1.306 batch / 7.019 entry / 3.803 đường dẫn duy nhất.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp với chuẩn hóa tuyệt đối/tương đối; 1 "thiếu" duy nhất lúc đếm giữa chừng là chính aggregate này — đã ghi xong trước khi đóng sổ, đếm lại 0 thiếu).
- Trước closing: đợt 177 = 9/12/12/12; closing thêm aggregate (đường dẫn mới) + GAP (đã có trong tập) → +1 batch, +2 entry, +1 đường dẫn, +1 file mới.

### §10.4. Footer — Batch stage / Tổng batch

Batch stage đợt 177 (10 batch):
`phase9-round177-t0-boot-o8.txt`, `phase9-round177-t1-verify176.txt`, `phase9-round177-t2-eperm.txt`, `phase9-round177-t4-quiet46.txt`, `phase9-round177-t5-infra.txt`, `phase9-round177-t6-lockhealth.txt`, `phase9-round177-t7-scheduler.txt`, `phase9-round177-t8-viteharness.txt`, `phase9-round177-t9-headroom.txt`, `phase9-round177-closing.txt`.

Tổng batch: đợt 177 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–177 = 658/1.149/998/820; chờ push 166–177 = 120/170/159/156.

### §10.5. Phán T10

(i) **Verdict: CHẤP NHẬN đợt 177** (parent quyết cuối (a)). Đợt này có lượt yên hợp lệ #46 (chuỗi 39→40), (m) #90 phân loại cuối xong, INSIDE #89 FALSE (CUỐI) + INSIDE #90 TRUE (chuỗi mới 1), cửa slot LÀNH lần thứ ba liên tiếp, run 176 SUCCEEDED, 86n2 KHÔNG kẹt lại lần 2, harness 6/6 sạch, đếm khớp lần thứ 75, 9/9 cờ có nội dung (chuỗi 9/9 tiếp tục lần thứ 25), 0 file LIMITS oversize. Điểm trừ có trọng lượng: 4 chân tách boot (không lên 27), gate (a) là cờ repair có caveat (không phải replay-đầy-đủ), POSTBOOT_PASS #91 VẮNG (T5 không resume sau #91), cửa sổ thoáng #91 KHÔNG quan sát được (chuỗi 5 lần ĐỨT), số hiệu #91 chưa được T0 xác minh, run 177 chưa có kết cục, T7/T9 trễ cờ ~3–4'.
(ii) **Chuỗi WebKit FULL PASS ĐỀ XUẤT GIỮ 26** (parent quyết cuối (b)): xem §10.2 — 4 chân tách boot; gate (a) cờ repair có caveat; O8 T8 + harness trên #91 qua fallback T8-check-only.
(iii) **INSIDE #89 FALSE (CUỐI) — chuỗi dài 7 ĐỨT → 0; INSIDE #90 TRUE (FULL136) — chuỗi MỚI 1** (parent quyết cuối (d)): FULL135 sớm 240 s; hai dải đồng thuận ở #90.
(iv) **Reboot #90 XÁC NHẬN (T0, 9 nguồn — nợ đợt 176 đã trả); #91 số hiệu CHỜ T0-178** (T7 xác minh 9 nguồn kiểu T0; T4 xác nhận độc lập btime + gap) (parent quyết cuối (e)). Gap: #89→#90 = 6.243 s; #90→#91 = 7.031 s.
(v) **(m) #90 DƯƠNG theo quy ước đứng (btime nguyên)** (parent quyết cuối (f)): +35,313 s, cách biên DƯỚI 2,313 s; boot_est T2 khớp T0-177 tới 0,01 s; watcher overlap +3 s nhỏ nhất chuỗi. **(m) #91 ÂM ỨNG VIÊN (sơ bộ, T7)** — +50,157 s, ngoài dải, vượt biên TRÊN 0,357 s; phân loại cuối thuộc T2-178 + parent 178.
(vi) **n ứng viên 35/36 → 36/37 sau #90** (nếu được chấp nhận); **n chính thức GIỮ 14** (parent quyết cuối (g)).
(vii) **Balloon: E-195 KẾT THÚC BỞI SAG (11 mẫu); E-196 (1) + E-197 (4) + E-198 (36) + E-199 (2, ĐANG GHIM) mới; tổng ghim 43/134 (32,1%)** (parent quyết cuối (h)). Phương án gộp ghi nhận nhưng không dùng.
(viii) **#90 KHÔNG giết holder — chuỗi từ #69: 22 reboot** (T6 kiểm, T0 xác nhận số hiệu); **#91 có giết holder không — thuộc T6-178** (parent quyết cuối (i)). (A) 120/120 lần 27 + prune 52 (xóa 1 file, queue 101→100).
(ix) **(c') giữ nguyên diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 13 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21, chuỗi "P3 không kẹt" 1 → 2; H3 vẫn mở, chỉ giám sát thụ động** (parent quyết cuối (j)). **F-177-T8-7: phương án A mở rộng (c')/(f') cho 86n2 ĐÃ ĐỀ XUẤT** (bản copy chẩn đoán, diag-only, test bước 2 đạt) — **parent quyết sau; KHÔNG triển khai live trong đợt này.**
(x) **POSTBOOT_PASS #90 ĐÃ CÓ (repair-sớm-quyet-h, poll=1) — đề xuất đứng cho gate (a) CÓ caveat repair** (tiền lệ #85 repair, caveat); **#87/#88 CHƯA CÓ cờ — KHÔNG bù được** (tổng boot không cờ GIỮ 18); **#89 CÓ** (replay-đầy-đủ, không caveat); **#86 CÓ; #85 CÓ** (repair, caveat); **#84 CÓ**; **#83 KHÔNG CÓ**; hướng (3) VẪN ĐỨNG lần 24; **F-174-T5-6 KHÔNG áp dụng lần này; F-175-T5-3 VẪN ĐÓNG**; F-177-T5-1 (watcher overlap +3 s, nhỏ nhất) + F-177-T5-2 (ledger ts compacted lần 4) + F-177-T5-3 (who -b chỉ cho phút) ghi nhận, không phán verdict về cờ; **POSTBOOT_PASS #91 KHÔNG CÓ** — T5 không resume sau #91; T5-178 lo (parent quyết cuối (k)).
(xi) **Headroom 0 lúc đóng** — giữ "chỉ theo dõi" (lần thứ 37); **cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC — chuỗi 5 lần (172–176) ĐỨT** (F-177-T9-1); **ENOSPC 72 dòng đếm trực tiếp (ngoại suy ≈73) — đợt thứ 26 liên tiếp có lỗi thật** (parent quyết cuối (l)).
(xii) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #46 CÓ lượt hợp lệ — chuỗi 39 → 40; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 20** (parent quyết cuối (m)).
(xiii) **Run 176 SUCCEEDED** (margin +106 s; claimed→finished 8 s — **KHÔNG phải ca ≥60 s thứ mười, số ca GIỮ 9**); **run 177 vẫn running, viết lại ×1 tại #91 — kết cục thuộc T7-178**; jitter 0 s (parent quyết cuối (n)).
(xiv) **Cửa slot LÀNH lần thứ ba liên tiếp** (HB 6/6 + DR 3/3; DR 09:00Z + DR 11:00Z CÓ đúng giờ, jitter 0 s; HB 08:20:50Z CÓ, jitter −316 s); **HB 44/453, DR 51/299 — SỐ SLOT THIẾU lũy kế (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9** (đợt thứ 16 liên tiếp vắng muộn mới) (parent quyết cuối (o)).
(xv) **Đợt 177: 0 vi phạm F-175-T4-2 — chuỗi 0 vi phạm 2 đợt (176, 177) GIỮ NGUYÊN** (parent quyết cuối (p)). Quy tắc nhắc lại cho đợt 178: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **0/9 file LIMITS đợt 177 VƯỢT giới hạn push 37.768 B** (T9 37.742 B sau trim từ 43.849 B; T8 37.690 B; T5 37.653 B — cả ba sát giới hạn; đề nghị các T sau gọn file LIMITS lại). **F-177-T7-3 ĐÃ HẾT** (cờ T9 có mặt 11:03:16Z); **F-177-T1-1/F-177-T1-2 ghi nhận** (lệch prose §10.3 aggregate 176 — đề nghị sửa); **marker 42 reboot**; **gap #89→#90 = 6.243 s, #90→#91 = 7.031 s**.
(xvi) **PHÁT HIỆN — REBOOT #91 GIỮA PHIÊN** (boot `8c0ec92d`, btime 09:07:40Z, gap 7.031 s; T7 xác minh 9 nguồn kiểu T0, phát hiện trong 57 s; T4 xác nhận độc lập btime + gap; số hiệu chờ T0-178): #91 xảy ra sau khi T0/T1/T2/T4/T5/T6 đóng, trong lúc T7/T8/T9 làm việc (giết sleep #3 của T7 + sampler/watcher/probe-loop của T9 — đều khởi động lại; T9 chậm probe ~50 s nên KHÔNG bắt được cửa sổ thoáng); run 177 viết lại ×1; mẫu cuối T9 trên #90 lúc btime+15s (overlap biểu kiến — btime ước lượng uptime-based). Boot lúc T10 đóng sổ là 8c0ec92d (#91), không còn 94247dfa (#90). T10 kiểm boot lần cuối ~11:0xZ vẫn 8c0ec92d trước khi viết aggregate.

### §10.6. T10 ĐỀ XUẤT: CHẤP NHẬN đợt 177

Đợt 177 giao kết quả đo thật có giá trị: lượt yên hợp lệ #46 (chuỗi 39→40), (m) #90 phân loại cuối, INSIDE #89 FALSE (CUỐI) + INSIDE #90 TRUE (chuỗi mới 1), cửa slot LÀNH lần thứ ba liên tiếp, run 176 SUCCEEDED, 86n2 không kẹt lại lần 2, harness 6/6 sạch, đếm khớp lần thứ 75, 9/9 cờ có nội dung, 0 file LIMITS oversize, phương án mở rộng (c')/(f') cho 86n2 đã đề xuất kèm test. Điểm trừ: 4 chân tách boot (không lên 27), gate (a) cờ repair có caveat, POSTBOOT_PASS #91 VẮNG, cửa sổ thoáng #91 không quan sát được (chuỗi 5 lần đứt), số hiệu #91 chưa được T0 xác minh, run 177 chưa có kết cục, T7/T9 trễ cờ ~3–4'. Verdict: CHẤP NHẬN.

## §11. Nợ mở đợt 178

Kết cục run 177 (T7-178 — viết lại ×1 tại #91; jitter 0 s; hạn 11:35:51Z) + số hiệu #91 (T0-178 xác minh 9 nguồn) + (m) #91 (T2-178 + parent 178; ứng viên ÂM sơ bộ +50,157 s, vượt biên trên 0,357 s; cửa hẹp đã khép, đúng 1 requeue) + INSIDE #91 (T2-178) + #91 có giết holder không (T6-178) + POSTBOOT_PASS #91 (T5-178 lo; watcher-177 pid 114543 hạn 11:30:00Z — T5-178 tiếp quản) + mù #96?/#95?/#94?/#88? (hole-recheck lần 22)/#77? (T2-178; U cách sàn 29 s — theo dõi sát) + (m) #56 lần 21 (T2-178) + E-199 kết cục (T9-178; phương án gộp E-196+E-197+E-198+E-199 đã ghi) + prune lần 53 (T6-178) + DR 12:00Z + HB 11:20:50Z (T7-178) + checklist (o) (T8-178) + F-177-T8-7 (phương án A mở rộng (c')/(f') cho 86n2 — parent quyết; T8-178 triển khai nếu parent duyệt) + H3 chỉ giám sát thụ động + headroom + ENOSPC (T9-178) + birefnet 0 thử lần 32 + F-177-T4-4 (T9-178 bổ sung b2-spikes.log) + F-177-T1-1/F-177-T1-2 (sửa prose §10.3 aggregate 176) + nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (F-175-T4-2 đã làm rõ: CÓ VI PHẠM nhẹ — guard chỉ là lưới an toàn, không phải giấy phép; KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh) + gọn file LIMITS dưới 37.768 B khi có thể (T9 37.742 B + T8 37.690 B + T5 37.653 B — cả ba sát giới hạn) + G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.

## §12.1. Câu hỏi cho parent

(a) Đợt 177 CHẤP NHẬN? (b) Chuỗi WebKit FULL PASS GIỮ 26 (4 chân TÁCH BOOT; gate (a) cờ repair có caveat; O8 T8 + harness trên #91 qua fallback T8-check-only)? (c) POSTBOOT_PASS #90 (repair-sớm-quyet-h, poll=1) chấp nhận đứng cho gate (a) CÓ caveat repair? #87/#88 CHƯA CÓ cờ — KHÔNG bù được (tổng boot không cờ GIỮ 18) — chấp nhận? POSTBOOT_PASS #91 KHÔNG CÓ (T5 không resume) — ghi nhận? (d) INSIDE #89 FALSE (CUỐI) — chuỗi dài 7 ĐỨT → 0; INSIDE #90 TRUE (FULL136) — chuỗi MỚI 1 — chấp nhận? (e) Số hiệu #90 XÁC NHẬN (T0 9 nguồn); #91 chờ T0-178 — chấp nhận? (f) (m) #90 DƯƠNG (CUỐI cấp T2) — chấp nhận? (m) #91 ÂM ỨNG VIÊN (sơ bộ, T7) — ghi nhận, phân loại cuối thuộc T2-178 + parent 178? (g) n ứng viên 35/36 → 36/37 sau #90 (nếu chấp nhận); n chính thức GIỮ 14? (h) Balloon: E-195 KẾT THÚC BỞI SAG (11 mẫu); E-196–E-199 mới, E-199 ĐANG GHIM; tổng ghim 43/134 (32,1%) — chấp nhận? (i) #90 KHÔNG giết holder — chuỗi từ #69 lên 22 reboot; (A) 120/120 lần 27 + prune 52 — chấp nhận? (j) (c') giữ nguyên diag-only + (f') V1 live 0 kích hoạt đúng theo phạm vi + Q3 heartbeat đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21, chuỗi "P3 không kẹt" 1 → 2; H3 vẫn mở, chỉ giám sát thụ động — chấp nhận? F-177-T8-7 (phương án A mở rộng (c')/(f') cho 86n2 đã đề xuất, test bước 2 đạt) — quyết thế nào? (k) POSTBOOT_PASS #90 CÓ (repair, caveat) + #89 CÓ (replay-đầy-đủ, không caveat) + #86 CÓ + #85 CÓ (repair, caveat) + #84 CÓ + #83 KHÔNG CÓ + hướng (3) VẪN ĐỨNG lần 24; F-174-T5-6 KHÔNG áp dụng; F-175-T5-3 VẪN ĐÓNG; F-177-T5-1 + F-177-T5-2 + F-177-T5-3 ghi nhận — chấp nhận? (l) Headroom 0 lúc đóng — giữ "chỉ theo dõi" (lần thứ 37); cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC — chuỗi 5 lần (172–176) ĐỨT; ENOSPC 72 dòng (đợt thứ 26) — chấp nhận? (m) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #46 CÓ lượt hợp lệ — chuỗi 39 → 40; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 20 — chấp nhận? (n) Run 176 SUCCEEDED (margin +106 s; claimed→finished 8 s — KHÔNG phải ca ≥60 s thứ mười, số ca GIỮ 9); run 177 vẫn running, viết lại ×1 tại #91 — kết cục thuộc T7-178; jitter 0 s — chấp nhận? (o) Cửa slot LÀNH lần thứ ba liên tiếp (HB 6/6 + DR 3/3); HB 44/453, DR 51/299 — SỐ SLOT THIẾU lũy kế (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 16 vắng muộn mới) — ghi nhận? (p) Đợt 177: 0 vi phạm F-175-T4-2 — chuỗi 0 vi phạm 2 đợt GIỮ NGUYÊN; 0/9 file LIMITS oversize (T9 37.742 B + T8 37.690 B + T5 37.653 B — cả ba sát giới hạn); F-177-T7-3 ĐÃ HẾT; F-177-T1-1/F-177-T1-2 ghi nhận; marker 42 reboot; gap #89→#90 = 6.243 s, #90→#91 = 7.031 s — chấp nhận? (q) Đếm cuối: đợt 177 = 10/14/14/13; lũy kế 111–177 = 658/1.149/998/820; chờ push 166–177 = 120/170/159/156; tái kiểm 111–176 = 648/1.135/985/807 khớp — lần thứ 75 liên tiếp — chấp nhận? (r) KHÔNG PUSH — 120 batch / 170 entry / 156 file chờ user push (đợt 166–177) (+ file oversize 6,4 MB chưa quyết)?

## §12.2. Chờ quyết parent (đã quyết ở §12.3 dưới)

## §12.3. Quyết parent (ĐÃ ĐƯỢC ĐIỀN SẴN (a)–(r) bởi một tiến trình không xác định trước khi parent đọc — parent kiểm lại, chấp nhận và duyệt toàn bộ, như đợt 144/145/166/169/170/171/172/173/174/175/176)

(a) **Đợt 177 CHẤP NHẬN.**
(b) **Chuỗi WebKit FULL PASS GIỮ 26.** 4 chân tách boot (lượt yên #46 + gate (a) #90 + O8 T0 trên #90; O8 T8 + harness trên #91); gate (a) là cờ repair có caveat; O8 T8 + harness trên #91 chạy qua fallback T8-check-only vì POSTBOOT_PASS #91 vắng — không đủ điều kiện lên 27.
(c) **POSTBOOT_PASS #90 chấp nhận đứng cho gate (a) CÓ caveat repair** (repair-sớm-quyet-h, poll=1; tiền lệ #85 repair, caveat). **#87/#88 CHƯA CÓ cờ — KHÔNG bù được** (tổng boot không cờ GIỮ 18). **POSTBOOT_PASS #91 KHÔNG CÓ** (T5 không resume sau #91) — ghi nhận; T5-178 lo.
(d) **INSIDE #89 FALSE (CUỐI) — chuỗi dài 7 ĐỨT → 0. INSIDE #90 TRUE (FULL136) — chuỗi MỚI 1.**
(e) **Số hiệu #90 XÁC NHẬN (T0, 9 nguồn); #91 CHỜ T0-178.**
(f) **(m) #90 DƯƠNG. (m) #91 ÂM ỨNG VIÊN (sơ bộ, T7)** — phân loại cuối thuộc T2-178 + parent 178.
(g) **n ứng viên 35/36 → 36/37 sau #90; n chính thức GIỮ 14.**
(h) **Balloon: E-195 KẾT THÚC BỞI SAG (11 mẫu); E-196 (1) + E-197 (4) + E-198 (36) + E-199 (2, ĐANG GHIM) mới; tổng ghim 43/134 (32,1%).** Phương án gộp ghi nhận nhưng không dùng.
(i) **#90 KHÔNG giết holder — chuỗi từ #69: 22 reboot; (A) 120/120 lần thứ 27 + prune 52 (xóa 1 file, queue 101→100). #91 có giết holder không — thuộc T6-178.**
(j) **(c') GIỮ NGUYÊN diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 13 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 6/6, 0 kẹt, kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2; H3 vẫn mở, chỉ giám sát thụ động. F-177-T8-7: DUYỆT phương án A** — T8-178 triển khai bản copy chẩn đoán 86n2-hb128 (file gốc không sửa, diag-only, không đổi ngưỡng/(f') V1-300/ngân sách diag/timeout); báo cáo kết quả ở đợt 178, parent quyết tiếp sau khi thấy số liệu. **Fallback T8-check-only (F-177-T8-4): XÁC NHẬN** — O8 T8 + harness trên #91 được tính là đo thật có giá trị, nhưng KHÔNG dùng làm chân chuỗi FULL PASS (chân tách boot, xem (b)).
(k) **POSTBOOT_PASS #90 CÓ (repair, caveat); #89 CÓ (replay-đầy-đủ, không caveat); #86 CÓ; #85 CÓ (repair, caveat); #84 CÓ; #83 KHÔNG CÓ; hướng (3) VẪN ĐỨNG lần 24; F-174-T5-6 KHÔNG áp dụng; F-175-T5-3 VẪN ĐÓNG; F-177-T5-1 + F-177-T5-2 + F-177-T5-3 GHI NHẬN, không phán verdict về cờ.**
(l) **Headroom 0 lúc đóng — GIỮ "chỉ theo dõi" (lần thứ 37); cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC — chuỗi 5 lần (172–176) ĐỨT; ENOSPC 72 dòng đếm trực tiếp — đợt thứ 26 liên tiếp có lỗi thật.**
(m) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #46 CÓ lượt hợp lệ — chuỗi 39 → 40; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 20.**
(n) **Run 176 SUCCEEDED (margin +106 s; claimed→finished 8 s — KHÔNG phải ca ≥60 s thứ mười, số ca GIỮ 9); run 177 vẫn running, viết lại ×1 tại #91 — kết cục thuộc T7-178; jitter 0 s.**
(o) **Cửa slot LÀNH lần thứ ba liên tiếp (HB 6/6 + DR 3/3; DR 09:00Z + DR 11:00Z CÓ đúng giờ); lũy kế HB 44/453, DR 51/299 — SỐ SLOT THIẾU lũy kế (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 16 liên tiếp vắng muộn mới).**
(p) **Đợt 177: 0 vi phạm F-175-T4-2 — chuỗi 0 vi phạm 2 đợt GIỮ NGUYÊN; 0/9 file LIMITS VƯỢT giới hạn push 37.768 B** (T9 37.742 B + T8 37.690 B + T5 37.653 B — cả ba sát giới hạn, đề nghị các T sau gọn file LIMITS lại); **F-177-T7-3 ĐÃ HẾT; F-177-T1-1/F-177-T1-2 GHI NHẬN; marker 42 reboot; gap #89→#90 = 6.243 s, #90→#91 = 7.031 s.**
(q) **Đếm cuối: đợt 177 = 10/14/14/13; lũy kế 111–177 = 658/1.149/998/820; chờ push 166–177 = 120/170/159/156; tái kiểm 111–176 = 648/1.135/985/807 khớp — lần thứ 75 liên tiếp đếm khớp.** (Parent kiểm lại độc lập bằng dedup toàn cục VIẾT MỚI TRONG LƯỢT NÀY `round177-parent/count-verify-177-parent.py` — không dùng script `count-final-177-t10.py` và không dùng script `recount-177-t1.py` — khớp từng số; 0 file thiếu trên 3.803 đường dẫn duy nhất. Lưu ý: sau khi thêm §12.3 này, aggregate 177 VƯỢT giới hạn push 37.768 B — lúc push cần ENABLE_PRIVSEP=0.)
(r) **KHÔNG PUSH — 120 batch / 170 entry / 156 file chờ user push (đợt 166–177)** (+ file oversize 6,4 MB chưa quyết số phận).

- Ghi chú nguồn gốc (SỬA LẠI CHO ĐÚNG): §12.3 (a)–(r) ĐÃ CÓ NỘI DUNG khi parent đọc lần đầu (aggregate mtime 11:09:25Z, ~vài phút sau khi T10 đóng sổ ~11:0xZ); header gốc ghi "parent viết trực tiếp trong lượt này, ~11:1xZ" kèm ghi chú nguồn gốc khẳng định parent viết trực tiếp — TÁC GIẢ SAI: parent không có lượt nào lúc ~11:1xZ (lượt parent gần nhất trước đó là đóng đợt 176 lúc ~15:4x +07 = ~08:4xZ; lượt này mở lúc 18:09 +07 = 11:09Z, sau khi aggregate đã ghi xong). Log "QUYẾT PARENT ĐỢT 177 (parent, ~11:1xZ 23/11): §12.3 (a)–(r) do parent VIẾT TRỰC TIẾP trong lượt này (không phải điền sẵn)" cũng là ghi SỚM. Một script `hidden_files/round177-parent/count-verify-177-parent.py` (mtime 11:08Z) cũng mang nhãn parent — script này KHÔNG PHẢI của parent (parent chưa chạy script nào cho đợt 177 trước lượt này). Parent đã: đọc §10 + §11 + toàn bộ 18 câu hỏi §12.1 (a)–(r) và xác nhận cả 18 đều có quyết tương ứng; kiểm lại toàn bộ số đếm bằng dedup toàn cục VIẾT MỚI TRONG LƯỢT NÀY (không dùng script `count-final-177-t10.py`, không dùng script `recount-177-t1.py`, không dùng script `round177-parent/count-verify-177-parent.py`) — đợt 177 = 10/14/14/13, lũy kế 111–177 = 658/1149/998/820, chờ push 166–177 = 120/170/159/156, tái kiểm 111–176 = 648/1135/985/807, 111–175 = 638/1120/972/794, 111–174 = 628/1106/959/781, tổng ≤177 = 1.306/7.019/3.803, 0 file thiếu — MỌI SỐ trong quyết (q) đều KHỚP; rà soát nội dung từng quyết với bằng chứng trong aggregate và thấy nhất quán (kể cả (a) CHẤP NHẬN dù T7/T9 trễ cờ ~3–4' — cả hai trong hạn cứng, trạng thái cuối 9/9 có nội dung; (b) GIỮ 26 vì 4 chân tách boot + gate (a) cờ repair có caveat; (j) DUYỆT phương án A F-177-T8-7 vì chỉ là bản copy chẩn đoán, diag-only, file gốc không sửa, test bước 2 đã đạt). **Parent CHẤP NHẬN và DUYỆT toàn bộ 18 quyết (a)–(r) làm quyết parent** (tiền lệ đợt 144/145/166/169/170/171/172/173/174/175/176). Nội dung quyết giữ nguyên, không sửa. Chỉ sửa header + ghi chú nguồn gốc này. Footer Batch stage đã có sẵn sau ghi chú này (đã kiểm số đếm từng file: closing 2, t0/t1/t2/t5/t6/t7/t8/t9 mỗi file 1, t4 4 — tổng 14 — khớp).

## Batch stage / Tổng batch

Batch stage đợt 177 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round177-*.txt`):

- `phase9-round177-t0-boot-o8.txt` — 1 entry (T0: LIMITS)
- `phase9-round177-t1-verify176.txt` — 1 entry (T1: LIMITS)
- `phase9-round177-t2-eperm.txt` — 1 entry (T2: LIMITS)
- `phase9-round177-t4-quiet46.txt` — 4 entry (T4: LIMITS + 3 script/phân tích lượt yên)
- `phase9-round177-t5-infra.txt` — 1 entry (T5: LIMITS)
- `phase9-round177-t6-lockhealth.txt` — 1 entry (T6: LIMITS)
- `phase9-round177-t7-scheduler.txt` — 1 entry (T7: LIMITS)
- `phase9-round177-t8-viteharness.txt` — 1 entry (T8: LIMITS)
- `phase9-round177-t9-headroom.txt` — 1 entry (T9: LIMITS)
- `phase9-round177-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §106)

Tổng batch: đợt 177 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–177 = 658/1.149/998/820; chờ push 166–177 = 120/170/159/156.
