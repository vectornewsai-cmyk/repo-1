# PHASE9 ROUND120 — LIMITS gộp (đợt 120, lượt cron 12:35 +07 16/11/2026)

> Bản đóng đợt do T10 viết trong cùng phiên (phase 2 ngay sau phase 1 — bài học T10 đợt 119 đã áp dụng).
> Phase 1 xong 07:20:50Z; đóng đợt 07:3xZ. KHÔNG push. HEAD a8f26d48 (không đổi).

## 0. Kiểm chứng gộp — T10 verify độc lập

- **T10 phase 1:** suite cây gộp **27/27 exit 0** (log `round120-t10-suites.log`: tsc-web 0, tsc-desktop 0, vite-build 0 + 24 test còn lại đều 0).
- **O8:** Chromium **21/21 pass, exit 0** (07:14:58Z); WebKit **21/21 pass, exit 0** (07:15:48Z, boot 80a940d7) — lần đầu WebKit O8 xanh trở lại sau các đợt thiếu GST (log `t10-o8.log`).
- **Postboot boot #61:** T10 tự chạy check-only 1 lần (không --repair) lúc 07:14:05Z, **exit 0 — DU DIEU KIEN**: đủ 5 lib, thư mục GST thật (apt), 269 plugin hệ thống, isomp4 + libav đủ, đủ 11 package (log `t10-postboot-80a940d7.log`). Gate chờ bằng chứng tươi chỉ 3 phút (đã rút từ 15' sau reboot #61 — bằng chứng T7/T4 chỉ có cho boot #60, STALE).
- **Recount (trước closing):** đợt 120 = **8 batch / 13 entry / 13 file duy nhất**; lũy kế đợt 111–120 = **95 batch / 178 entry / 150 file duy nhất** (log `recount-push120.log`). **T3 về muộn (07:32Z, sau recount) + closing batch (2 entry: LIMITS gộp + GAP_ANALYSIS) — đếm lại cuối: đợt 120 = 10 batch / 18 entry / 18 file duy nhất; lũy kế = 97 batch / 183 entry / 154 file duy nhất** + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`.
- **Cờ done lúc đóng:** **9/9** (T1, T2, T3, T4, T5, T6, T7, T8, T9 — T3 về muộn 07:32Z, kịp gộp trước khi viết closing batch).
- **Cây trước/sau phase 1:** preview.tsx `5be5a250` (= baseline H3f, parent chấp nhận), media.ts `2c384ed1` — không đổi. Lock v2 production `cd0c05c1` (bản T6 sửa text, xem §6); phase-1 driver đã đồng bộ bản copy từ production lúc chạy.
- **Reboot trong đợt:** **#61 (tạm)** boot `80a940d7-a69b-4b65-8cea-0e173716d8fa`, btime 06:50:58Z, gap #60→#61 = **2h05'09"** (chỉ là SPAN — đoạn G mù #38 mở, chưa chứng nhận). Giết poller T10 (poll cuối #13 06:46:34Z 5/9) + phiên chờ T10 (SIGTERM ~06:51Z). **T10 chạy lại 06:52Z, ghi RESTART**; poller chạy lại (poll #1 06:52:14Z 7/9). Phase 1 chưa chạy lúc reboot nên không có kết quả phase-1 nào cần tái dùng. T3/T4 sống sót theo runtime (subagent.list 06:52Z: cả hai running, last activity 23 s/79 s).
- **Chốt chặn:** `round-in-progress.md` do lượt cron 12:35 tạo lúc mở đợt; T10 xóa khi đóng đợt (sau closing batch + LIMITS gộp này).

## 1. T1 — E4 lượt 3 (A, gop250, e4a3): DEFER-POSTBOOT, 0 lượt đo được

- Cờ `round120-t1.done`: CÓ. LIMITS: `docs/PHASE9_ROUND120_T1_E4BATCH_LIMITS.md`. Batch stage: `phase9-round120-t1-e4batch.txt` (1 entry).
- **Kết quả: lượt 3 KHÔNG ĐẾM ĐƯỢC — DEFER-POSTBOOT.** Driver chờ cờ T7 đủ 60 phút (05:43:56–06:43:58Z) mà replay boot #60 không bao giờ cài GST: postboot FAIL ở đầu và cuối, dpkg.log chỉ 2 dòng suốt 60 phút, 0 apt/dpkg chạy. Không chạy probe, không số đo — và không bịa số liệu. **Lô E4BATCH vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**
- Verify T10: log driver `round120-t1/run-t1.log` + `run-t1-driver.out` có nhắc DEFER; cây đo preview.tsx `5be5a250`/media.ts `2c384ed1` không đổi trước/sau. T1 không sửa production.

## 2. T2 — Điều tra nguồn nhiễu s79: load1 KHÔNG đo tải thật; giả thuyết throttle BỊ BÁC; trục load1 VÔ HIỆU

- Cờ `round120-t2.done`: CÓ. LIMITS: `docs/PHASE9_ROUND120_T2_S79NOISE_LIMITS.md`. Batch stage: `phase9-round120-t2-s79noise.txt` (1 entry).
- **Kết quả lớn nhất:** (a) **load1 trong cell này KHÔNG đo tải** — thí nghiệm trực tiếp (boot #60, 05:51–05:53Z): 6 hog nice-19 chạy 75 s, đốt 1,41 CPU thật, 7–11 thread runnable, nhưng **load1 RƠI 0,45 → 0,30** (kỳ vọng ~4,3); trong khi PSI cpu.some vọt 1% → 83,5% và /proc/stat cho 2,36 CPU nhàn rỗi. (b) Tách rời load1 ↔ threadsR đã có trong **mọi lượt dài cũ (9/9)**: tương quan −0,18…+0,19 (≈0); ~27% mẫu (289/1079) có load1 <5 trong khi ≥30 task runnable; load1 suy giảm hàm mũ exp(−t/60) xuống 0,24 trong khi threadsR giữ ~60. (c) load1 là **sóng ~8,5 phút**, biên độ ≈ số hog; dial "ĐẠT" chỉ là lúc sóng dâng vào [25,40]. (d) **Giả thuyết throttle BỊ BÁC cả hai chiều**: quý load1 thấp nhất cho %±1 TỐT NHẤT; gộp 9 lượt, tỉ lệ trough tương quan DƯƠNG với %±1 (Spearman +0,40), tỉ lệ peak ÂM (−0,42) — ngược hướng giả thuyết.
- **Hệ quả: GIỮ vững 19,63 không đổi, kèm caveat trục gãy.** Không chạy s79 mới đợt này (theo quyết parent: tạm dừng lặp lẻ; nếu chạy thì lô ≥3 lấy trung vị — nhưng trục đo đã vô hiệu nên chạy thêm cũng không trả lời được câu hỏi cũ).
- Verify T10: `round120-t2/hog-response-exp.log` độc lập khớp headline — BASE loadavg 0,54, BURST loadavg 0,52 trong khi PSI some avg10 78,98 (load1 phẳng, PSI vọt). Cây không đổi trước/sau; không sửa production; không probe WebKit.

## 3. T3 — Bar F2 leg B: ĐỦ 6 valid → VERDICT KHÔNG ĐẠT (chế độ chậm); pha (b) ĐẠT; MSB4RB8 không tái hiện 0/3

- Cờ `round120-t3.done`: CÓ (về muộn 07:32Z, sau recount — đã gộp muộn trước khi viết closing batch). LIMITS: `docs/PHASE9_ROUND120_T3_SEEKPRELOAD_LIMITS.md`. Batch stage: `phase9-round120-t3-seekpreload.txt` (3 entry).
- **Bar F2 mới (định nghĩa tách hai pha, parent CHẤP NHẬN định nghĩa, CHƯA ÁP NGƯỠNG): KHÔNG ĐẠT — chế độ chậm.** Bộ 6 run hợp lệ (3 đợt 119 + 3 mới đợt 120): T_startup chia 2 chế độ — nhanh 0,45/0,45/0,49 s (3 run) và chậm 1,42/1,98/2,39 s (3 run). Theo luật đã đăng ký (đợt 119 §1): chế độ chậm báo RIÊNG, không gộp, không chấm; "nếu (a) không đạt vì chế độ chậm thì verdict ghi KHÔNG ĐẠT — chế độ chậm". Pha (a) do đó KHÔNG ĐẠT; pha (b) ĐẠT (xem dưới). **CAVEAT: hai nửa bộ 6 khác boot** (3 run đợt 119 trên boot 27c8b1d9 + 3 run đợt 120 trên boot 80a940d7); T3 báo RIÊNG bộ 3 mới đợt 120 (n=3) để parent tự xét.
- **Pha (a) khởi động pipeline: KHÔNG ĐẠT.** Nhóm nhanh (n=3): median 0,45 s, p90 0,49 s — qua ngưỡng đề xuất (median ≤1,0 s, p90 ≤1,2 s) nhưng n=3 < 6 run yêu cầu cho bar phân phối nên KHÔNG đủ mẫu để chấm ĐẠT riêng. Nhóm chậm (n=3): 1,42/1,98/2,39 s — đều >1,2 s. Gộp cả 6 không tách chế độ: median 0,955 s (≤1,0 ✓) nhưng p90 2,19 s (2,39 s theo nearest-rank) > 1,2 s ✗ — cũng KHÔNG ĐẠT. Cả hai cách đọc đều cho cùng kết luận pha (a).
- **Pha (b) seek thuần: ĐẠT.** T_seek = 0,00 s ở cả 6/6 run hợp lệ (mọi run ≤100 ms, median 0,00 s). Ở độ phân giải evs 10 ms, kết luận đúng mức: seek thuần <10 ms. Gộp với đợt 118 (8 run) + đợt 119 (5 case): nay **16/16 run SEEKFAST có T_seek = 0,00 s**.
- **Leg A — follow-up overshoot MSB4RB8 27,02 s: KHÔNG TÁI HIỆN: 0/3 run** (C = 17,421 cả 3; smoke cũng 17,421). Tần suất gộp (run đăng ký) cập nhật **1/29** (đợt 118: 1/23 + đợt 119: 0/3 + đợt 120: 0/3; smoke không tính). Cơ chế overshoot vẫn chưa rõ.
- **Môi trường đo:** mọi phép đo chạy trên boot MỚI #61 (80a940d7, btime 06:50:58Z), KHÔNG phải boot #60 lúc mở đợt. Boot #60: **0 run** (replay "chạm mà không cài", 0/9 GST trong ~119 phút — không đo chui trên môi trường hỏng, không tự repair/apt). Boot mới: replay CHẠY NHANH, postboot PASS lúc boot ~7' tuổi (06:57:45Z), GST 269 file, dpkg 1509 dòng.
- **Cây:** preview.tsx `5be5a250`, media.ts `2c384ed1` — không đổi trước/sau mọi leg. Không có patch production nào từ T3; mọi leg đều probe-only. Prereg viết trước mọi phép đo (05:44Z); 2 điều chỉnh vận hành (gate-waiter poll 5'/lần sau reboot; leg A chạy BÙ sau driver leg B) KHÔNG đổi định nghĩa đo, ngưỡng, hay tiêu chí hợp lệ.
- Verify T10: thư mục `round120-t3/` có legA r1–r3, legB r1–r3 log + phân tích MSB4RB8 + postboot b60/b61; batch 3 entry khớp file trên đĩa. **Nợ đợt 119 "bar F2 leg B cần ≥6 valid" ĐÃ CÓ VERDICT (KHÔNG ĐẠT — chế độ chậm).** Lưu ý §2: T2 chứng minh trục load1 vô hiệu — bar F2 (dựa trên load1/s79) vẫn cần xem lại định nghĩa; parent quyết ở §12.

## 4. T4 — WebKit ≤60ms lượt yên: 0 lượt yên hợp lệ; 1 lượt DỞ DANG trên boot #61; ngưỡng GIỮ

- Cờ `round120-t4.done`: CÓ (về muộn, trong lúc phase 1 chờ 9/9 — recount đã kịp đếm batch). LIMITS: `docs/PHASE9_ROUND120_T4_WEBKIT60MS_LIMITS.md`. Batch stage: `phase9-round120-t4-webkit60ms.txt` (1 entry).
- **Kết quả: KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO (0/1). Ngưỡng ≤60 ms GIỮ NGUYÊN theo trạng thái đợt 118 (attempt8 median 40,0 ms, lớp B 5/5). Nợ lượt yên theo dõi CHUYỂN TIẾP sang đợt 121.**
- Boot #60: gate 0 KHÔNG BAO GIỜ ĐẠT (30 poll, postboot FAIL 30/30; replay "chạm mà không cài"). **Reboot 06:50:58Z sang boot #61: replay CHẠY và NHANH — bracket (0'40", 5'41"], 1509 dòng, đúng bằng #52/#54/#57; gate 0 ĐẠT ở poll #2 (06:57:14Z, postboot PASS đầy đủ).** T10 xác nhận độc lập: postboot check-only của T10 trên boot #61 exit 0 lúc 07:14:05Z (xem §0).
- Attempt1 trên boot #61: gate A MỞ NGAY poll 1 (load1 0,41 / load5 0,85 / RAM 1142 MB / lock trống / blockers 0 / cây 5be5a250). Probe chạy 17/20 pass rồi **KẸT sau pass 17** (>5 phút không tiến, vượt timeout 120 s/pass mà không thoát); T4 kill probe (SIGTERM ~07:05:44Z) → probe thoát 2 (target-closed).
- **Lớp B VI PHẠM (B5): RAM avail rơi đều 1012→440 MB trong lượt (23/23 mẫu <1024 MB; 3 mẫu <500 MB, min 440 MB).** B1/B3/B4 ĐẠT; B2 có dấu hiệu (probe T3 bắt đầu giữa cửa sổ). Lượt này KHÔNG phải lượt yên hợp lệ.
- Số đo DỞ DANG (16 pass, tickCost n=512): median 40,0 ms, p90 69,0 ms, max 104, min 24; hậu flip+2000ms median 41,0 ms (n=337); wallbands phẳng 39–41 ms. **KHÔNG dùng để chốt/mở lại ngưỡng** (lượt không hoàn chỉnh + lớp B vi phạm — đúng prereg §1). (b)/F6'/lag5: KHÔNG CÓ DỮ LIỆU (blendTick rỗng trong file partial).
- **Phát hiện kỹ thuật (mới): probe kẹt ở `writePartial` — hàm này `await pwEval` lấy tickCost từ trang mà KHÔNG CÓ timeout; khi trang không trả lời evaluate thì lượt kẹt vĩnh viễn ngoài phạm vi timeout 120 s/pass.** Lỗ hổng thiết kế của probe (xem LIMITS T4 §3.3 + §9.2); file partial cuối (17 pass) có tickCost n=0 vì nhánh lỗi ghi với tc=[].
- Verify T10: file partial + script phân tích có trên đĩa (`round120-t4/`); gate 0 ĐẠT trên #61 khớp bằng chứng postboot độc lập của T10; T4 không sửa production.

## 5. T5 — EPERM probe #39 + mù #38 KHÔNG ĐÓNG (G mở) + BƯỚC NHẢY CLOCK tại #58

- Cờ `round120-t5.done`: CÓ. LIMITS: `docs/PHASE9_ROUND120_T5_EPERM_LIMITS.md` (41.544 B, oversize — cần ENABLE_PRIVSEP=0 khi push). Batch stage: `phase9-round120-t5-eperm.txt` (1 entry).
- **Checklist P8 §2.3 chạy ĐÚNG 1 lần (05:44Z):** status DEAD/STALE (heartbeat age 21.553 s, last #38 23:45:17Z, boot 27c8b1d9, exit 1) → once **probe #39, boot 0260101b, ok=2 fail=0**, exit 0, 05:44:31Z → status ALIVE (age 0 s, n=39). Log v2 tăng đúng **3 dòng (106 → 109)** — như R7/S7/T7/T6; prereg §1 đã dự báo đúng +3 trước khi đo.
- **PHÁT HIỆN MỚI — BƯỚC NHẢY CLOCK TẠI REBOOT #58:** poller T10 run 1 poll #14 ghi lúc 00:54:13Z trên boot 27c8b1d9, nhưng btime của boot mới #58 là 00:53:41Z — một tiến trình sống đã ghi log **32 giây SAU giờ boot của boot kế tiếp**. Đồng hồ đã bước LÙI tại #58 một lượng X ∈ **[32, 332] giây** (cận trên: poll #15 due ~00:59:13Z không bao giờ ghi). Hệ quả: **gap #57→#58 trở thành KHOẢNG [1h20'07", 1h25'39"] (mid 1h22'53")**, không còn là điểm. Lần thứ hai chứng minh được nhảy clock tại một reboot trên VM này (lần đầu: #54, bài học "giây nháy").
- **Khoảng mù #38: 23:45:17Z → 05:44:31Z (5h59'14") — KHÔNG ĐÓNG HOÀN TOÀN (mới, lượt này).** Đoạn E ĐÓNG; đoạn F ĐÓNG; đoạn G **KHÔNG ĐÓNG** (lỗ (02:41:59Z, 04:45:49Z] 2h03'49", 0 session, 0 file trong cả 3 phạm vi + /tmp, tối đa 6 ẩn danh nghĩa); đoạn H ĐÓNG. **3 reboot đã chốt trong mù (#58 00:53:41Z, #59 01:47:49Z, #60 04:45:49Z — cả ba đều có giây chính xác trên đĩa) + tối đa 6 ẩn danh nghĩa (đoạn G).**
- **Gap #57→#58 = KHOẢNG [4807, 5139]s ĐƯỢC CHỨNG NHẬN (mới — điểm giữa 4973s dùng cho thống kê). Gap #58→#59 = 54'08" (3.248 s) ĐƯỢC CHỨNG NHẬN (điểm, caveat F59 chưa kiểm). CERT n=31 → n=33; FULL n=46 → n=48.** Dải chứng nhận [19'07", 3h14'08"] không đổi. **Gap #59→#60 = 2h58'00" chỉ là SPAN** (đoạn G mở) — KHÔNG vào FULL/CERT. Gap #60→#61 = 2h05'09" cũng chỉ là SPAN (mù #38 chưa đóng).
- Không tìm thấy bằng chứng sóng EPERM thật — 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong 116 file *.log có mtime trong mù #38. Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP Date 3 server khớp `date -u` trong 0–1 s) → F_now ≈ 0.
- Verify T10: prereg `round120-t5/prereg-t5.md` (viết trước khi đo) đã dự báo đúng probe #39 +3 dòng — khớp LIMITS. Mù #37 KHÔNG thử đóng lại (quyết parent 7 đợt 119 — parent đã chấp nhận để mở).

## 6. T6 — Cải tiến text thông báo lock "KHÔNG NHẢ": CHỈ SỬA TEXT, không sửa logic — XONG

- Cờ `round120-t6.done`: CÓ (05:46Z, luồng xong đầu tiên). LIMITS: `docs/PHASE9_ROUND120_T6_LOCKMSG_LIMITS.md`. Batch stage: `phase9-round120-t6-lockmsg.txt` (2 entry: lock script + LIMITS).
- **Đã làm:** sửa duy nhất `apps/web/scripts/vcut-vite-lock-v2.sh`, hàm `cmd_release` (dòng 413–426): nhánh in tách làm 2 theo owner rỗng hay thật — owner rỗng → `BỎ QUA release thừa` (vô hại, rc=1, không đổi trạng thái); owner thật → `KHÔNG NHẢ — lock đang do 'X' giữ, không phải 'Y' (bảo vệ lock của người khác)`. Guard và `return 1` giữ nguyên từng ký tự; không đổi acquire/release/timeout/stale-check. Lock thật TRỐNG lúc bắt đầu (0 ticket + 34 cooldown); T6 không acquire/release lock thật lần nào (thí nghiệm dùng lock dir riêng dưới /tmp).
- **md5:** v2 trước `5cac10af` → sau `cd0c05c1` (chỉ do sửa text này). preview.tsx `5be5a250`, media.ts `2c384ed1` không đổi.
- Verify T10: script hiện tại chứa đúng câu mới (grep: 1 dòng `BỎ QUA release`, 1 dòng `KHÔNG NHẢ — lock đang do ... giữ`); T9 kiểm chứng độc lập trên CẢ HAI bản (cũ trước 05:42:4xZ, mới sau) — suite + tái hiện double-release chạy trên bản mới (xem §9). **Nợ đợt 119 §10 mục 8 (cải tiến thông báo lock) ĐÃ ĐÓNG.**

## 7. T7 — Hạ tầng boot #60 + đề xuất luật GST thiếu sau reboot: replay CHẠM MÀ KHÔNG CÀI; watcher 60/60 FAIL; headroom 545

- Cờ `round120-t7.done`: CÓ (06:46Z). LIMITS: `docs/PHASE9_ROUND120_T7_INFRA_LIMITS.md` (44.741 B, oversize). Batch stage: `phase9-round120-t7-infra.txt` (2 entry: LIMITS + postboot script).
- **Boot #60? (SỐ TẠM):** 04:45:49Z, boot_id `0260101b`, sau #59 01:47:49Z (gap 2h58'00" — SPAN, xem §5). 4 nguồn đồng ý trong ~1–11 s (btime, uptime -s, journal first entry +11 s, /proc/uptime); `stat` btime của `/` KHÔNG dùng được (trả epoch 1970). `journalctl --list-boots` chỉ còn 1 boot; `last -x` chỉ 1 dòng reboot 04:46Z — log boot trước đã mất cùng rootfs rebuild.
- **CHẾ ĐỘ LỖI MỚI, NẶNG HƠN #58: replay CHẠM MÀ KHÔNG CÀI.** dpkg.log CHỈ CÓ 2 dòng, cả hai `2026-11-16 05:35:40 startup packages configure` (boot +49'51") — 0 entry trước, 0 sau. 0 apt/dpkg/os-intent chạy; lock dpkg rảnh. `/var/log/apt` KHÔNG TỒN TẠI; `/var/lib/apt/lists` TRỐNG (apt-get update chưa từng chạy trong boot này). 0/9 gói GST; thư mục GST không tồn tại; 0 package gstreamer trong dpkg. Khác #58 (replay kết thúc sau 350 dòng mà thiếu GST) và khác #53 (không tới hẳn trong 65+ phút): ở #60 replay đã chạm tới rồi CHẾT/IM trước khi cài bất cứ gì.
- **Postboot #60?: FAIL** — check-only exit 1 lúc boot ~55' (05:41Z, try1) + exit 1 lúc boot ~60' (05:46Z) + T3 kiểm độc lập exit 1 lúc ~05:44Z. Thiếu 5 lib + GST isomp4/libav + 10 gói apt. Cờ `POSTBOOT_FAIL` đã ghi cho các luồng khác dùng.
- **Watcher 60 phút (05:45:04Z → 06:45:09Z): REPLAY KHÔNG QUAY LẠI (chết hẳn).** 60/60 poll: dpkg_lines=2, apt_running=no; postboot check-only exit=1 ở cả 6 lần poll (10/20/30/40/50/60) + lần cuối 06:45:09Z. Tính từ lần chạm duy nhất (05:35:40Z): tới khi watcher kết thúc replay đã im **1h09'29"** liên tục, boot đã ~119' tuổi.
- **Headroom inotify boot #60?: 545 — tiếp tục rơi, reboot KHÔNG hồi (lần 5 liên tiếp có số đo boot-mới chứng minh hướng rơi).** Rơi từ 670 (#57?) → 545 (−125). Vite thường cần ~1586 watch nên vẫn thiếu ~1041 — vite tạm `watch.ignored` vẫn bắt buộc.
- **Đề xuất luật xử lý chế độ "replay tới nhưng thiếu GST"** (nhiệm vụ chính, quyết parent §12 mục 5 đợt 119 — xem LIMITS T7 §9–§10): T7 đề xuất + nhắc lại đề xuất R9 (a) vẫn mở (lần 6): cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9 (thay đổi thân cron, cần user đồng ý; đã hỏi user lúc đóng đợt 117, chưa trả lời). T7 KHÔNG tự đổi thân cron.
- **T7 có sửa 1 file production:** `apps/web/scripts/vcut-webkit-postboot-check.sh` (vá K1 giữ LD_LIBRARY_PATH + cập nhật header; `bash -n` OK; nằm trong batch T7). Không sửa preview.tsx/media.ts/lock script. T10 xác nhận: postboot script bản mới chạy PASS trên boot #61 (exit 0, §0) — vá không phá check.
- **Tương phản boot #61:** reboot 06:50:58Z, replay CHẠY và NHANH — bracket (0'40", 5'41"], 1509 dòng, đúng bằng #52/#54/#57; postboot PASS (T4 gate 0 poll #2 + T10 check-only 07:14Z). Chế độ lỗi #60 không lặp lại ở #61 — replay là không ổn định theo từng boot, không có quy luật boot nào cũng lỗi.
- Verify T10: watcher log `round120-t7/t7-wait-replay.log` poll 60 dpkg_lines=2 (đã đọc trực tiếp); T1 + T3 kiểm postboot độc lập cùng FAIL trên #60; headroom 545 khớp T1 ghi.

## 8. T8 — G1 evidence #11 (chỉ đo, không quyết): chân yên 30fps n=40 PASS 36/40 (90%); chỉ khung (a) là không đạt được

- Cờ `round120-t8.done`: CÓ. LIMITS: `docs/PHASE9_ROUND120_T8_G1_LIMITS.md` (46.844 B, oversize). Batch stage: `phase9-round120-t8-g1.txt` (4 entry: LIMITS + JSON v15 + 2 harness script).
- **Chân yên 30fps — DÀY LÊN ĐÁNG KỂ: 8 mẫu yên mới, cả 8 đều PASS dưới CẢ HAI metric (G5 0,92–0,98; M2 0,92–1,03) → chân yên nay n=40: median 0,950×, mean 0,935, CI 95% [0,900; 0,971], PASS 36/40 (90%)** — từ 28/32 (88%). Cả ba tiêu chí chặt: median ≥ 0,75 ✓, PASS 90% ≥ 80% ✓, CI cận dưới 0,900 ≥ 0,75 ✓. Chuỗi PASS yên liên tiếp hiện tại: **34** (26 cũ + 8 mới) — dài nhất lịch sử G1. Đợt thu hoạch yên lớn nhất từ trước (X6: 6, Z9: 4, A7: 3): cửa sổ yên mở suốt ~16 phút (06:05–06:21Z), baseline 19,94–24,40 fps cả 8 lần, không lần nào rơi vùng xám, không lần nào cần vòng 2.
- **Khung M2 (a)–(i) — CHỈ CÒN KHUNG (a) LÀ KHÔNG ĐẠT ĐƯỢC:** khung (b) trượt-20 M2 nay **20/20 (100%)**; khung (c) tích lũy đầy đủ nay **34–35/40 = 85,0–87,5%** (kịch bản xấu 85,0%, đệm +5,0 điểm, từ 81,2%); khung (f) trượt-10 **10/10**; khung (g) hậu-A9 **22/22 (100%)**; khung (e) yên sạch **32/34 (94%)**; khung (i) vẫn chịu 4 FAIL yên liên tiếp. Khung (a) 20 lần yên đầu cố định vẫn tối đa 15/20 = 75% — bị khóa bởi lịch sử, không bao giờ đạt được. **Câu hỏi "M2 có đạt 16/20 không" nay chỉ còn phụ thuộc vào việc parent có chấp nhận khung (a) là luật chơi hay không** — mọi khung còn lại đều đã đạt.
- Pool 60fps n=69 PASS 66/69 (96%); chân yên 60fps n=26, 26/26 PASS. G5 vẫn là chuẩn chính thức; M2 chạy song song. G1 VẪN MỞ, chờ user quyết — T8 chỉ đưa số + khuyến nghị, không tự đóng, không đổi ngưỡng (0,75×), không đổi metric, không đổi khung.
- **Thay đổi phương pháp duy nhất vòng này (§5 LIMITS T8, BẮT BUỘC ĐỌC TRƯỚC KHI TRÍCH SỐ):** vite của harness E1/N10 chết ENOSPC 8/8 lần thử trước 06:05Z (trần inotify 63.747 đã đầy, headroom chỉ 434–545 watch, vite thường cần ~1.578). T8 đã mirror workaround L8 (`server.watch.ignored ["**/**"]`, vite 0 inotify FD) vào đúng 2 file harness — y hệt tiền lệ O8 đợt 112/113 đã được parent chấp nhận. Bằng chứng đường đo không đổi: pixel G2/G7a/G7b/G8/D1 khớp lịch sử tuyệt đối cả 13/13 lần. **8 lần E1 + 5 lần N10 vòng này đều chạy bằng harness đã mirror L8** (ghi cờ trong JSON v15, trường `notes`).
- Verify T10: file `benchmarks/results/g1-evidence-v15-120t8.json` tồn tại, version `v15-120t8`, có pool30/pool60/t8_e1/t8_60, notes ghi rõ mirror L8; 2 file harness trong batch đúng là file T8 sửa. Số khung (a)–(i) là số T8 báo cáo từ JSON — T10 chưa đếm lại từng khung trong thời gian đóng đợt (ghi rõ để parent kiểm lại trước khi quyết).

## 9. T9 — Sức khỏe lock v2/queue/zombie sau boot #60: KHỎE

- Cờ `round120-t9.done`: CÓ (05:51Z). LIMITS: `docs/PHASE9_ROUND120_T9_LOCKHEALTH_LIMITS.md`. Batch stage: `phase9-round120-t9-lockhealth.txt` (1 entry).
- **Zombie: 0.** Bảng `ps` đầy đủ lúc 05:41Z: toàn systemd + hatch daemon + shell exec các luồng; không có tiến trình vite/node/webkit/chromium; 0 zombie; `ss -tlnp`: không có cổng TCP nào lắng nghe (vite cũ trên 5189/5590/5554/5555 đều chết theo reboot).
- **Lock sau boot #60: TRỐNG, không có stale lock để dọn.** Thư mục lock thật `hidden_files/vite.lock` KHÔNG tồn tại lúc 05:41Z. Holder cuối trước reboot, `t10-round119`, đã nhả sạch lúc 02:15:33Z (RELEASED hold 72s), tức 2h30' TRƯỚC boot #60.
- **Kiểm chứng trên CẢ HAI bản lock script** (vì T6 apply fix text giữa lúc T9 chạy, 05:42:4xZ): quét zombie/queue/log lúc 05:40–05:41 trên bản cũ; suite + tái hiện double-release lúc 05:43–05:45 trên bản mới `cd0c05c1`. T9 không sửa file production nào.
- Verify T10: LIMITS T9 khớp chéo với §6 (T6) về thời điểm đổi md5; wtmp/journal chỉ còn boot #60 — T9 không tự kết luận số hiệu reboot (đúng, xem §5).

## 10. Nợ mở — chuyển đợt 121

1. **Bar F2 sau verdict KHÔNG ĐẠT (chế độ chậm):** pha (a) KHÔNG ĐẠT, pha (b) ĐẠT; MSB4RB8 overshoot không tái hiện 0/3 (tần suất gộp 1/29). **Mới:** T2 chứng minh trục load1 vô hiệu (§2) — bar F2 (dựa trên load1/s79) cần xem lại định nghĩa; parent quyết ở §12 (có chạy tiếp leg B theo định nghĩa cũ không, hay định nghĩa lại trục đo).
2. **E4 lô lượt 4–10:** lượt 3 DEFER-POSTBOOT (0 lượt đo được); lô vẫn 1/10 (1 VOID, 0 CAUGHT). Chạy tiếp khi WebKit sẵn sàng (postboot PASS — boot #61 đã PASS, xem §0).
3. **WebKit lượt yên theo dõi:** 0 lượt yên hợp lệ đợt 120 (1 lượt dở dang trên #61, B5 vi phạm + probe kẹt writePartial). Ngưỡng ≤60 ms GIỮ. **Mới:** sửa probe — `writePartial` cần timeout cho `pwEval` (kẹt vĩnh viễn ngoài timeout 120 s/pass); file partial cuối tickCost n=0 vì nhánh lỗi ghi tc=[].
4. **Mù #38 KHÔNG ĐÓNG (G mở, lỗ 2h03'49")** + tối đa 6 ẩn danh nghĩa (đoạn G); gap #59→#60 và #60→#61 chỉ là SPAN, chưa chứng nhận. Mù #37: parent đã chấp nhận KHÔNG ĐÓNG (quyết 7 đợt 119) — không thử đóng lại.
5. **Luật xử lý "replay tới nhưng thiếu GST":** T7 đã đề xuất (LIMITS T7 §9–§10); chờ parent quyết. R9 (a) VẪN CHỜ user (lần 6 nhắc).
6. **G1:** vẫn mở, chờ user quyết — đặc biệt khung (a) M2 (20 lần yên đầu cố định, tối đa 15/20, không bao giờ đạt được) có còn là luật chơi không.
7. **Nợ đứng chưa có quyết user:** G1 deinterlace; mù #22/#28–#31/#35; birefnet (chỉ thử lại khi RAM đổi); ci-security.yml 403 (chờ user); TTS 39 cấm kiểm lại; R9 (a) VẪN CHỜ user.
8. **Ghost frame 23:** ĐÃ ĐÓNG đợt 119 (họ P4, KHÔNG hồi quy) — không còn là nợ.
9. **H3f:** patch giữ trên cây (5be5a250), caveat chân B n=19 < n≥30 đã được parent chấp nhận đợt 119 — không mở lại.

## 11. Ghi chú vận hành

- **Bài học T10 đợt 119 ĐÃ ÁP DỤNG THÀNH CÔNG:** phase 2 chạy NGAY trong cùng phiên driver (phase 1 xong 07:20:50Z → đóng đợt 07:3xZ, trước hạn cứng 07:45Z và trước timeout cron 08:35Z); LIMITS gộp viết khung ngay sau suite+O8+recount (do phase-1 driver viết tự động); recount chờ 9/9 tối đa 5' (đã rút từ 15' sau reboot #61) — T4 về kịp trong lúc chờ nên recount đã đếm đủ 8 batch; **T3 về muộn 07:32Z, T10 gộp muộn từ đĩa trước khi viết closing batch** (kiểm đĩa trước khi đóng — bài học verify_delegated_work).
- **Reboot #61 (tạm, 06:50:58Z, gap #60→#61 2h05'09" SPAN):** giết poller + phiên chờ T10; T10 chạy lại 06:52Z (ghi RESTART), poller chạy lại, phase 1 chưa chạy nên không cần tái dùng kết quả cũ. T3/T4 sống sót theo runtime. **Khác với #58/#59/#60: replay trên #61 CHẠY và NHANH** (bracket (0'40", 5'41"], 1509 dòng) + postboot PASS — chế độ lỗi replay là không ổn định theo từng boot.
- **Gate postboot O8 đã rút ngắn 15' → 3'** sau reboot #61 (bằng chứng T7/T4 chỉ có cho boot #60 STALE; không luồng nào chạy postboot cho #61) — driver tự chạy check-only 1 lần, exit 0.
- **Chốt chặn `round-in-progress.md` ĐÃ TẠO lúc mở đợt 120; T10 xóa khi đóng đợt** (sau closing batch + LIMITS gộp này).
- **Boot đợt 120:** mở đợt trên #60? (0260101b, btime 04:45:49Z, GST 0 plugin lúc mở); đóng đợt trên #61 (80a940d7, btime 06:50:58Z, GST 269 plugin, postboot PASS).
- **Poller T10:** `round120-t10/poll120-t10.sh` (detached, chạy lại 1 lần sau reboot #61, ghi RESTART trong log). Poll cuối trước reboot #13 06:46:34Z 5/9; poll #1 sau chạy lại 06:52:14Z 7/9; kích hoạt phase 1 lúc 07:02:14Z theo giờ (07:00Z, 7/9).

## 12. Quyết parent (main chat, 14:4x +07 16/11/2026 — đóng đợt 120)

1. **Trục load1 vô hiệu (§2): CHẤP NHẬN.** (a) load1 không đo
   tải thật trong cell này — bằng chứng trực tiếp T2 (6 hog đốt
   1,41 CPU thật mà load1 RƠI 0,45 → 0,30, PSI vọt 1% → 83,5%) +
   9/9 lượt dài cũ (tương quan load1↔threadsR ≈ 0; load1 là sóng
   ~8,5 phút). Giả thuyết throttle BỊ BÁC cả hai chiều. (b) **19,63
   chỉ còn là NHÃN LỊCH SỬ (s77c) kèm caveat trục gãy — KHÔNG
   phải mức tải, KHÔNG dùng làm ngưỡng tải cho công việc sau này.**
   Ngưỡng thời gian của bar F2 giữ nguyên (nó đo thời gian khởi
   động/seek, không đo tải); **trục tải cho công việc đo sau này
   đổi sang PSI cpu.some (chính) + threadsR (phụ)** — quyết này
   thuộc parent/vòng lặp, không phải câu hỏi cho user. (c) **T3
   leg B theo định nghĩa cũ (trục load1) DỪNG;** leg B chạy tiếp
   chỉ sau khi định nghĩa tải bằng PSI được viết ra (nhiệm vụ đợt
   121).
2. **G1 khung (a) M2 (§8): HOÃN — chờ quyết G1 của user.**
   Khung (a) (20 lần yên đầu cố định, tối đa 15/20) không bao giờ
   đạt được về mặt toán học, nhưng nó gắn với quyết đóng G1 mà
   user đang chọn (đã hỏi 13:44 16/11, chưa trả lời). Nếu user
   chọn (1) chốt theo median + khung tích lũy (c) thì khung (a)
   không còn ý nghĩa; nếu chọn (3) đo tiếp thì parent sẽ quyết bỏ
   (a) vì không bao giờ đạt được. Parent KHÔNG tự quyết (a) trước
   khi user trả lời.
3. **Luật "replay-chết" (§7, T7 §8.2): PHÊ DUYỆT, hiệu lực từ đợt
   121.** Luật đủ chặt: đủ 5 điều kiện (postboot FAIL tươi; replay
   chết theo cả 3 dấu hiệu; ngưỡng chờ boot ≥60' HOẶC dpkg im ≥15';
   dạng lỗi (A)/(B); không probe WebKit đang chạy) mới được chạy
   `postboot-check.sh --repair` MỘT LẦN có giám sát, ghi cờ
   `REPAIR_TRIGGERED` TRƯỚC khi chạy; repair FAIL thì DỪNG và ghi
   "boot này không dùng được cho WebKit"; repair PASS thì ghi rõ
   "PASS nhờ repair, không phải replay". Phạm vi chỉ 10 gói script
   đã liệt kê. **Đồng thời PHÊ DUYỆT §8.4(ii) "phát hiện muộn":**
   đầu mỗi lượt, nếu boot hiện tại đã >15' tuổi VÀ postboot FAIL
   VÀ replay đã chết theo điều kiện 2 của §8.2 thì áp dụng luật
   ngay — vá lỗ hổng policy 15' mà không cần đổi thân cron.
   **PHÊ DUYỆT §8.5:** chính thức hóa cờ `POSTBOOT_FAIL` (T7 đã
   viết từ đợt này — ghi thành lệ đứng). Lưu ý: `--repair` code mới
   vẫn CHƯA từng chạy sống — lần chạy đầu phải có giám sát + log
   đầy đủ theo luật.
4. **R9 (a): VẪN CHỜ user** (đã hỏi lúc đóng đợt 117, chưa trả
   lời; T7 nhắc lần 6). Đây là lựa chọn bổ sung cho §8.4(ii) (bắt
   FAIL live sớm, kẹp bracket) — không thay thế (ii), cũng không
   bị (ii) thay thế. Không hỏi lại dồn dập.
5. **Gap #57→#58 thành khoảng (§5): CHẤP NHẬN.** T5 chứng minh
   nhảy clock tại #58 (tiến trình ghi log 32 giây SAU giờ boot của
   boot kế tiếp; nhảy ∈ [32, 332] giây). Ghi khoảng [1h20'07",
   1h25'39"] (mid 1h22'53"), CERT [4807, 5139]s vào FULL/CERT thay
   cho điểm cũ. Đây là lần thứ hai chứng minh được nhảy clock tại
   một reboot trên VM này (lần đầu: #54).
6. **Đóng đợt với 9/9 sau gộp muộn T3: CHẤP NHẬN.** T3 về 07:32Z
   (sau recount) nhưng kịp trước closing batch; kiểm đĩa trước khi
   đóng đã áp dụng đúng; không còn luồng thiếu — đợt đóng đúng
   10/10.
