# PHASE9_ROUND177_T0_BOOT_O8_LIMITS.md

Đợt 177 — T0 (boot survey + xác minh reboot mới + O8). Mở ~08:38Z, đóng ~08:58Z 23/11/2026.
Chỉ đọc + ghi file làm việc; không sửa code sản phẩm, không push, không release/tag.

## Kết quả chính

- **REBOOT #90 — XÁC NHẬN 9 nguồn**: boot_id `94247dfa-0716-4de9-bdc6-080161a73701`
  (khác #89 `15618ce8`); btime **07:10:29Z** (epoch 1795417829; uptime bracket ×3 khớp cùng giây,
  boot_est 1795417829.321/.316/.314 = btime +0,321 s; /proc/1 start_ticks 1146 = btime +11,46 s,
  stat mtime 07:10:40.779Z = btime +11,779 s; journal idx 0 duy nhất, first 07:10:41.172Z =
  btime +12,172 s; wtmp begins 07:10:40Z; last reboot 07:10 still running; Cloudflare ×2
  (CF nhanh hơn local ~1,22 s / ~0,83 s — cùng chiều các đợt trước); DB: run 176 boot_gen MỚI
  3af1984b, 1 requeue duy nhất trong cửa hẹp lẫn cửa rộng #90; marker mtime không đổi).
  Đối chiếu T7-176 (xác minh 9 nguồn kiểu T0, phát hiện 07:11:06Z = btime +37 s): KHỚP T0-177
  từng số, kể cả /proc/1 mtime tới từng ms.
- Gap #89→#90 = **6.243 s (1h44m03s) — TRỞ LẠI mẫu ~2 giờ** sau gap ngắn 1.329 s (#88→#89).
  #90 xảy ra GIỮA PHIÊN đợt 176 (sau khi T0/T1/T2/T4/T5/T6/T8-176 đóng, trong lúc T7/T9-176
  làm việc) và TRƯỚC khi đợt 177 mở (08:35:51Z).
- **Marker sống qua 42 reboot (#49–#90)** — mtime 2026-11-20 11:39:47.272154981Z không đổi
  (41 qua #89 + #90).
- **Run 176 SUCCEEDED (DB đọc tươi ~08:43Z — kết cục thuộc T7-177)**: finished 08:34:05Z,
  status `succeeded`, timed_out false, attempt 1, boot_gen 3af1984b (#90); wall sched→finished
  10.694 s (hạn ngân sách 08:35:51Z — finished TRƯỚC hạn 106 s); succeeded event eid 10357
  08:34:05.489Z; đúng 5 event, đúng 1 lần viết lại (#90), không timeout.
  **Claimed_at DB hiện tại 08:33:57Z — KHÁC T7-176 ghi 05:35:51Z** (không đổi qua 11 lần đọc
  tới 08:21:55Z) → claimed→finished = **8 s < 60 s** (xem F-177-T0-3 — cùng mẫu run 175;
  phân loại cuối thuộc T7-177 + parent 177).
  Run 177 2e0ce3f4: sched = started 08:35:51Z — **jitter 0 s** (chuỗi jitter 0 s tiếp tục từ
  run 175/176); claimed 08:35:51Z, boot_gen 3af1984b (#90) — RUNNING lúc T0 đọc.
- **(m) #90 — ĐẾM CUỐI CỬA HẸP (phân loại cuối thuộc T2-177 + parent 177)**:
  requeue eid 10339 `requeued_after_restart` **btime90 +35,313 s**, NẰM TRONG band [33; 49,8] —
  **cách biên DƯỚI 2,313 s**, cách biên trên 14,487 s; run 176 SỐNG tại btime90; 1 requeue duy
  nhất cửa hẹp lẫn cửa rộng (truy vấn mọi job trong cửa rộng [07:10:29Z, 07:25:29Z]: đúng
  3 event của run 176 — 1 requeue + dispatch + reattached; cửa hẹp đã khép hẳn lúc T0 đọc —
  KHỚP T7-176 đọc #9 sau khi cửa khép). Caveat phân số: offset thật ∈ (34,313 s, 35,313 s] —
  margin 2,313 s > 1 s nên verdict DƯƠNG BỀN với neo phân số (KHÁC #88 margin 0,431 s, nhạy
  với neo phân số — xem F-177-T0-4).
- **O8 trên boot #90 — WebKit PASS 21/21 ×2 + Chromium PASS 21/21 (08:53:54–08:56:34Z):**
  WebKit attempt1 pid206006 exit=0, **21/21 PASS** (S1 PASS 08:54:08.660Z, Playwright mouse click
  lần 2), JSON 21 results, 21 ok=true, md5 `5a87b5bf…`, bản stamped theo lượt khớp md5.
  WebKit attempt2 pid206616 exit=0, **21/21 PASS** (S1 PASS 08:55:02.033Z), JSON 21 results,
  21 ok=true, md5 `44c04a6d…`, bản stamped theo lượt khớp md5.
  Chromium pid207136 exit=0, **21/21 PASS** (S1 PASS 08:56:04.519Z, CDP mouse click lần 2),
  JSON 21 results, 21 ok=true, md5 `3f05caf6…`, bản stamped theo lượt khớp md5.
  Đếm lại từ JSON gốc bằng python. **Cả ba bộ đều chạy SAU POSTBOOT_PASS #90 (08:51:55Z)**
  — O8 bắt đầu 119 s sau cờ (cùng mẫu #86/#89).
- **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z** (T5-177, mode **repair-sớm-quyết-h, poll=1**, dpkg 795
  dòng, cache 110, lists 75 — KHÁC #89 replay-đầy-đủ poll=0, dpkg 1545; xem F-177-T0-1).
  Chi tiết thuộc T5-177.
- **0 attempt chồng:** T4 poll #17/#18/#19 trong cửa sổ O8 đều ghi lock=co thread=t0-round177 +
  blockers 5/5/1 (+ RAM #17/#18 dưới 1024 MB) → cửa yên KHÔNG mở; poll #20 (08:56:40Z,
  6 s SAU khi O8 nhả lock) lock=không, postboot_exit=0, RAM 1785 MB → "CUA YEN MO ... CHAY
  attempt1 NGAY". O8 chỉ chồng pha poll của T4, 0 attempt (xem F-177-T0-5).
- X11: chỉ socket X193 + 1 Xvfb `:193` lúc O8 đóng — CỦA T4 attempt1 (bắt đầu 08:56:40Z);
  display O8 (:188/:197) đã dọn sạch, 0 process sót của T0. Giao T8-177 theo dõi
  (mẫu F-175-T1-1; đợt 176 trio X193/X194/X195 tái xuất lần 5 — đợt này mới chỉ thấy X193).
  Boot lúc T0 đóng vẫn 94247dfa (kiểm cuối 08:57:25Z). Không có reboot mới trong phiên T0.

## Giới hạn / sai số ghi nhận (F-177-T0-*)

- **F-177-T0-1 — POSTBOOT_PASS #90 CHƯA CÓ lúc T0 mở (~08:41Z) — O8 CHỜ cờ (mẫu #86/#89).**
  Lúc T0 mở: T5-177 replay-watch-177 START 08:41:39Z pid 114543, EARLY-REPAIR trigger
  boot+5470s, verify form-B check-only exit=1 (CHƯA ĐỦ — thiếu libevent/libEGL/libavif/libdw/
  libevdev + apt packages; GST đã repair symlink 269 file); `apt-get update` đang chạy.
  Cờ về 08:51:55Z (mode repair-sớm-quyết-h, poll=1, dpkg 795, cache 110, lists 75) — T5-177
  đã cài đủ libs (T4 check-only poll #17 08:54:24Z: "PASS libs ... (hệ thống)", "PASS apt:
  đủ 11 package", "KET LUAN: DU DIEU KIEN chay WebKit"). T0 chờ 9 phút (08:43Z–08:52Z) rồi
  mới chạy O8 — không chạy O8 trước cờ. Mode repair (không phải replay-đầy-đủ) + dpkg 795
  (thấp hơn #89: 1545) có ảnh hưởng gì tới gate (a) hay không — thuộc T5-177 + parent 177;
  T0 chỉ ghi mode + số liệu, KHÔNG phán verdict về cờ.
- **F-177-T0-2 — Cloudflare nhanh hơn local ~1,2 s / ~0,8 s (cùng chiều, trong ~2 s).**
  Try1 CF − local ≈ +1,22 s; try2 ≈ +0,83 s (CF Date chỉ chính xác tới giây). Cùng mẫu các
  đợt trước (CF nhanh hơn ~1 s); đồng hồ boot mới vẫn giờ thật. T0 ghi số đo thô, không
  hiệu chỉnh. (Đợt 176: +1,95 s / +1,51 s — đợt này nhỏ hơn.)
- **F-177-T0-3 — claimed_at run 176 DB hiện tại khác ghi nhận của T7-176.** DB đọc tươi lúc
  ~08:43Z: worker_claimed_at_utc = 1795422837 (08:33:57Z) → claimed→finished 8 s.
  T7-176 ghi claimed_at = 1795412151 (05:35:51Z, KHÔNG đổi qua 11 lần đọc tới ~08:21:55Z).
  Có thể claimed_at được cập nhật khi worker claim pha cuối / khi finish
  (08:21:55Z–08:34:05Z); T0 chỉ ghi giá trị đọc tươi + thời điểm đọc, KHÔNG suy đoán cơ chế.
  Giao T7-177 đối chiếu. Hệ quả nếu 8 s là số đúng: run 176 KHÔNG phải ca claimed→finished
  ≥60 s (khác run 175: 88 s — ca thứ chín); T0 không phán số thứ tự ca. Cùng mẫu run
  171/172/173/174/175 (claimed đổi lúc cuối).
- **F-177-T0-4 — Caveat phân số cho (m) #90 (cùng họ caveat #71/#81/#85/#86/#88).** Btime #90 là
  số nguyên từ /proc/stat (quy ước đứng). Boot thật ∈ [btime, btime+1 s) → offset requeue
  thật ∈ (34,313 s, 35,313 s]. Margin 2,313 s > 1 s nên offset thật VẪN TRÊN 33 s dù boot_est
  lệch tới +1 s — verdict DƯƠNG BỀN với neo phân số (ngược #88 margin 0,431 s, nhạy với
  neo phân số). Caveat này KHÔNG lật verdict theo quy ước đứng (btime nguyên). Phân loại
  cuối thuộc T2-177 + parent 177.
- **F-177-T0-5 — O8 bắt đầu khi GATE_OPEN=0 (PB=1), lock giữ cửa đóng suốt O8 — 0 attempt
  chồng (cùng cơ chế F-176-T0-6).** Lúc O8 acquire lock (08:53:54Z): T4 poll #16
  (08:53:39Z) gate0=T5 nhưng postboot_exit=1 (check-only FAIL libs, poll #13) → GATE_OPEN=0
  (điều kiện mở cửa đòi PB=0); T4 chưa vào attempt. Lock t0-round177 là blocker trong
  poll #17–#19 (lock=co, blockers 5/5/1) + RAM #17/#18 <1024 MB → cửa KHÔNG mở suốt O8;
  poll #20 (08:56:40Z, 6 s sau khi O8 nhả lock) mới mở cửa → T4 attempt1 bắt đầu.
  T0 KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (T4 chưa vào attempt
  suốt O8; quy tắc đứng sau vi phạm F-174-T2-5/F-175-T4-2 được tuân thủ). Load1 trong cửa
  sổ O8 theo poll log T4: 0,92–1,76 (poll #17–#19) — thuộc T9-177 quy B2, T0 chỉ ghi nhận.
- **F-177-T0-6 — X193 tái xuất lúc đóng (chỉ 1 socket, chưa đủ trio).** Lúc O8 đóng (08:57Z):
  /tmp/.X11-unix chỉ có X193 + 1 Xvfb `:193` — CỦA T4 attempt1 (bắt đầu 08:56:40Z), không
  phải của T0 (display O8 :188/:197 đã dọn, 0 process sót). Đợt 176 trio X193/X194/X195 tái
  xuất lần 5 (T8 đã dọn X194/X195); đợt này mới chỉ thấy X193 — X194/X195 có tái xuất sau
  nữa không thuộc T8-177 theo dõi.
- **F-177-T0-7 — T0 không chạy lại suite T1, không kiểm lại dải FULL/INSIDE, không đếm lại
  ENOSPC/RAM/balloon.** Chỉ O8 + boot survey + DB đọc tươi. POSTBOOT_PASS #90 thuộc T5-177
  (T0 chỉ đọc trạng thái + mốc thời gian + mode); (m) #90 + INSIDE #89/#90 phân loại cuối
  thuộc T2-177 + parent; kết cục run 176 thuộc T7-177; lượt yên #46 (T4-177, attempt1 đang
  chạy lúc T0 đóng); harness + O8 bộ thứ hai (T8-177); #90 có giết holder không + prune
  lần 52 (T6-177); headroom + ENOSPC + balloon (T9-177).

## Phạm vi chưa kiểm (không thuộc T0)

- (m) #90 phân loại cuối (T2-177 + parent); INSIDE #89 (FULL135 sơ bộ FALSE — chuỗi dài 7 có
  đứt tại #89?) + INSIDE #90 (T2-177); kết cục run 176 (T7-177; F-177-T0-3 claimed_at);
  DR 09:00Z + HB 08:20:50Z kết luận cuối (T7-177); POSTBOOT_PASS #90 chi tiết + mode repair
  (T5-177); lượt yên #46 (T4-177, attempt1 đang chạy); harness + O8 bộ thứ hai (T8-177);
  #90 có giết holder không + prune lần 52 (T6-177); headroom + ENOSPC + balloon + E-195
  (T9-177); X194/X195 có tái xuất (T8-177).
- Không kiểm lại dải FULL125–FULL135; không chạy lại suite T1 (chỉ O8); không xác minh actor
  của repair #90; không kiểm lại nguyên nhân gap 6.243 s (đã trở lại mẫu ~2 giờ, không bất
  thường như gap 1.329 s đợt 176).

## File làm việc

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t0/NOTES.md` (số liệu thô)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t0/appendix177.py` + `appendix177.txt`
  (mọi số tính từ epoch thô bằng script, không tính tay)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t0/boot-survey-177t0.txt`
  (output thô 9 nguồn)
- `~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t0/o8-driver-177t0.sh` +
  `o8-177t0.log` + `o8-lock.log` + `o8-webkit/` + `o8-chromium/` (JSON stamped theo lượt +
  bản copy attempt khớp md5) + `o8-s1-probe-177t0.mjs` + `eperm-retry.mjs`
  (probe KHÔNG chạy đợt này — attempt1 PASS nên bỏ qua theo driver)
