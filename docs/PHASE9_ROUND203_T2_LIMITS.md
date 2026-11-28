# PHASE9 ROUND 203 — T2 LIMITS (EPERM + (m)/INSIDE + mù + FULL176)

T2 đợt 203 — luồng NỀN: EPERM + (m)/INSIDE + blind walk + FULL176.
Đợt 203 mở lượt cron 06:35 +07 28/11/2026 (run 213, bắt đầu 23:35:51Z 27/11).
Boot hiện tại #135 (8ea1f5e3, btime 23:06:56Z = 1795820816).
B0 = 2026-11-21T11:15:18Z (1795259718); B1 = 2026-11-28T00:35:53Z (1795826153); cửa sổ 566.435 s.
Hạn cờ ~02:00Z 28/11, hạn cứng 02:35:51Z. KHÔNG PUSH, KHÔNG release.
Scripts/logs: `hidden_files/round203-t2/` (m-check203, m56-203, eperm-sweep203, blind203-*).

## 1. (m) #132 / #133 / #134 — PHÂN LOẠI CUỐI; (m) #135 THÔ

Nguồn: `muse.db`, bảng `scheduler.events` (eid = scheduler_event_id), đọc tươi ~23:56Z 27/11.
Giả định đứng: DB/host ≈ giờ thật, VM chậm ~2 s (F-199-T2-4); hiệu chỉnh drift đo tươi
5 mẫu Cloudflare Date+RTT 23:56:59–23:57:07Z (boot #135): máy chậm 0,41–0,77 s
(S1 +0,407; S2 +0,406; S3 +0,711; S4 +0,773; S5 +0,715; RTT 0,36–0,87 s; Date hạt 1 s).
Hẹp/nhỏ hơn đợt 202 (0,56–2,51 s, boot #134). Survey độc lập T01-203 ~+1 s
(máy 23:52:35 vs server 23:52:36). Mọi offset đã hiệu chỉnh vẫn TRONG [33; 49,8] dưới
cả 3 mô hình (tươi, đợt 202, thô).

- **#132 DƯƠNG (CUỐI)** — requeue eid 11679, run 210 (72de8dca), 17:04:09.208177Z =
  btime +**49,208177 s** (TRONG biên, cách biên trên 0,592 s). Dispatched eid 11680
  +49,283205 s; reattached eid 11681 +49,331208 s. 3 event trong cửa sổ (m).
  Im lặng 11678→11679 = 248,968 s. Thô đã TRONG — DƯƠNG ngay cả KHÔNG hiệu chỉnh drift.
- **#133 0 (CUỐI)** — 0 event trong cửa sổ (m) [20:32:40Z, 20:32:56.8Z); event đầu sau
  btime eid 11701 reconciled 20:35:40.076855Z = +213,077 s; im lặng 11700→11701 =
  8.405,823 s bao btime (OUTAGE #9, S11). Không run nào bao btime.
- **#134 DƯƠNG (CUỐI)** — requeue eid 11717, run 211 (9f038129), 21:06:02.360053Z =
  btime +**47,360053 s** (TRONG biên, cách biên 2,44 s). Dispatched eid 11718
  +47,461510 s; reattached eid 11719 +47,513405 s. 3 event trong cửa sổ.
  Im lặng 11716→11717 = 361,706 s.
- **#135 THÔ DƯƠNG** — requeue eid 11744, run 211 (9f038129), 23:07:35.567879Z =
  btime +**39,567879 s** (TRONG biên, cách biên 6,57/10,23 s). Dispatched eid 11745
  +39,637914 s; reattached eid 11746 +39,762312 s. Im lặng 11743→11744 = 455,416 s.
  Phân loại CUỐI thuộc T2-204.
- **n ứng viên: 59/62 → 61/65** (dương +2, tổng +3).
- Run (chỉ ghi số; phán CA thuộc T7-203): run 211 (9f038129, sched 1795811751 =
  20:35:51Z) FAILED 23:34:50.567339Z (eid 11750, "worker reported work not finished");
  started_at bị viết lại 2 lần (#134 → 1795813562, #135 → 1795820855);
  claimed 1795822387 = 23:33:07Z; cf = 103 s. Run 212 (7b4492a6, sched 1795800951 =
  17:35:51Z) SUCCEEDED 18:04:35Z, cf 6 s. Run 213 (5bebdace, sched 1795822551 =
  23:35:51Z) RUNNING. Boot gen nay `cron_boot_eaecf2acf968`.
- Marker `/home/hatch/.config/vcut-persistence-marker`: 239 B, md5 cb7102c0,
  mtime 2026-11-20 11:39:47Z — KHÔNG ĐỔI, sống sót qua #135.

## 2. FULL176 + B-#131 (chuỗi đã SỬA theo quyết (d)-202)

Quyết (d)-202 (bản THẬT, theo brief — chuỗi tuần tự đã sửa, KHÔNG biến thể (a)):
FULL175 chuẩn = FULL173 + 5.826 s (gap #128→#129) + 16.965 s (gap #129→#130) +
13.364 s (gap #130→#131). Script `m-check203.py` (EXIT=0, mọi assert đậu):
xích `m-check202.py`, FULL174 n=174 (p10 1698,75 / p90 11422,80 — khớp),
FULL173 p10/p90 1693,50/11104,60 — khớp, B-#129 TRUE kiểm lại.
Xác nhận 5826 KHÔNG có trong FULL174, 16965 CÓ (gap bị bỏ qua).

- **FULL175 chuẩn: n=176**, mean 1h52'48", median 1h57'42", **p10=1709,25 s,
  p90=11602,00 s**, sd 1h03'24", min 55 s, max 5h58'13",
  90–150'=96, <60'=34, >180'=22, >240'=10.
- **FULL176** (= FULL175 chuẩn + 7135 s, gap #131→#132): **n=177**,
  mean 1h52'50", median 1h57'47", **p10=1714,50 s, p90=11592,80 s**,
  sd 1h03'13", min/max như trên, 90–150'=97, <60'=34, >180'=22, >240'=10.
- **B-#131 = FALSE** dưới CẢ HAI cách đọc: band neo btime #130 (11:21:41Z) =
  [11:50:15Z, 14:34:53Z]; btime #131 15:04:25Z ngoài band 1772 s (gap #130→#131 =
  13364 s vs p90 11592,80 s). Đọc N-convention (chuỗi = FULL175 chuẩn, n=176):
  band [11:50:10Z, 14:35:03Z], ngoài 1762 s, cũng FALSE.
  **Chuỗi B GIỮ 1** (B-#129 TRUE, B-#130 FALSE, B-#131 FALSE).
- **Cờ đặt tên (không giấu):** số FULL bám theo phép thử B (FULL = B + 45), KHÔNG phải
  số phần tử. Sau khi sửa gap 5826 s, FULL175 chuẩn có n=176 và FULL176 có n=177 —
  nhiều hơn nhãn đúng 1 phần tử = gap đã sửa. Theo N-convention nghiêm, chuỗi cho
  B-#131 là FULL173 + [5826, 16965, 13364] (n=176, tức chính FULL175 chuẩn của parent).
  Phán FALSE vững dưới cả hai cách đọc.
- Đếm A vẫn KHÔNG tính được (btime #106 chưa biết); INSIDE #107..#115 theo đếm A
  vẫn CHỜ; chuỗi GIỮ 7.
- Tỉ lệ reboot tới #135: 210 reboot / 410,81 h = 1 lần / 117,4 phút.
  Gap: #130→#131 13364 s; #131→#132 7135 s; #132→#133 12527 s;
  #133→#134 1988 s; #134→#135 7301 s.

## 3. (m) #56 — lần 45

D = [19:04:44Z, 20:22:43Z] 20/11/2026 = epoch [1795201484, 1795206163];
W = [19:33:20Z, 19:33:37Z] = [1795203200, 1795203217].
Số D theo LIMITS-202 (purge 7 ngày F-202-T2-x: D không kiểm chứng lại được từ DB).
Script `m56-203.py` (EXIT=0). 5 hướng DB MỚI hợp lệ, tất cả **0 trong W**:

- (clxxxxi) `scheduler.scheduled_resume_registrations created_at` — tổng 3 dòng, W 0, D 0.
- (clxxxxii) `runtime.avatar_state updated_at_ms` — tổng 1 dòng, W 0, D 0 (cửa sổ ms).
- (clxxxxiii) `agent.context_items created_at` — tổng 66.842 dòng, W 0, **D 8**
  (cả 8 ngoài W — KHÔNG thu hẹp).
- (clxxxxiv) `activity.activity_monitor_threads created_at` — tổng 170 dòng, W 0, D 0
  (created_at dạng TEXT ISO, so sánh từ điển hợp lệ).
- (clxxxxv) `scheduler.scheduled_resume_state written_at_utc` — tổng 1 dòng (singleton), W 0, D 0.
- **Tổng 195 hướng (190 + 5). Không thu hẹp. VẪN CÓ ĐIỀU KIỆN.**
- Loại TRƯỚC khi đếm (toàn bảng 0 dòng — KHÔNG tính): `device.data_sync_state
  last_full_sync_at`, `device.media_upload_batches claimed_at`,
  `runtime.raw_signal_entries created_at`,
  `runtime.chat_event_derived_write_backlog created_at`,
  `runtime.event_hook_space_owners created_at`. Loại trước khi truy vấn:
  `device.media_upload_events received_at` — đã dùng làm (cxlvii)-194.
  Cả 5 hướng đã grep kiểm chưa dùng trên mọi `round*-t2/m56-*.py` TRƯỚC khi truy vấn
  (F-194-T2-2); tổng dòng kiểm TRƯỚC khi đếm (bài học F-202-T2-2).
- Kiểm lại (chỉ W): (clxvi) `agent.message_mailbox accepted_at` W 0 (D giữ 1, sau purge);
  (clxx) `agent.agent_message_token_usage created_at` (bigint epoch s) W 0 (D giữ 0).
- Theo file: (vii) quét mtime `~/workspace` trong D = **331 file**, mtime lớn nhất
  **20:15:33.130Z** (`hidden_files/round156-t10.done`, không đổi); (viii) mtime exec-log
  trong D = **0**; (vii-b) file 20:16:00–20:17:00Z = **0**; (vii-c) file
  20:19:30–20:19:40Z = **0**.

## 4. EPERM — probe #122 + sweep #122

- Probe #122: 00:11:10Z 28/11, boot 8ea1f5e3, **ok=2 fail=0**; đổi boot
  bd22dffd → 8ea1f5e3 đã ghi trong `hidden_files/eperm-probe-v2.log`.
- Sweep #122 (`eperm-sweep203.py`, EXIT=0), cửa sổ [probe #121 21:46:59Z 27/11,
  probe #122 00:11:10Z 28/11]: 139 file `*.log` có mtime trong cửa sổ; 3 file có hit;
  14 lần xuất hiện; **0 "sóng EPERM vẫn bật"**.
  Phân loại: hit trong `round202-t2/eperm-sweep202.log` là trích dẫn output của sweep-202;
  `round203-t01/o8-203t01.log` 3× "[ts] sóng EPERM đã tắt, khởi động vite" (kết quả probe
  của T01-203); `round203-t8/smoke/selfcheck-1-run.log` dòng 27
  `dmesg: read kernel buffer failed: Operation not permitted` — lỗi quyền dmesg trong
  sandbox, KHÔNG phải sóng (cùng lớp với đợt 202).
- **Kết luận: sóng EPERM TẮT trên toàn cửa sổ.**

## 5. Blind walk — gen / merged / content

- Gen (`blind203-gen.py`, EXIT=0): repo-1 **8.996** file (202: 8.867); hidden_files
  **18.206** (202: 17.635); outside **31.810** (202: 31.747); tmp **2.226** (202: 806);
  fifth scope **24** file (202: 23). Merged unique second-marks: **13.530** (202: 13.101).
  Thời gian find dài hơn đợt 202 (repo 55 s, hidden 60 s, outside 177 s — máy tải nặng).
  1 dòng stderr: `find: '/home/hatch/.stagged-uploads': Permission denied`.
- Merged FILE (raw): R max **1238 s OPEN**; S max **3235 s OPEN** (H-S4);
  T max **627 s CLOSED**; U max **9316 s OPEN** (top: 9316 / 8968 / 8572 /
  **7801 (H-U26, mở rộng từ 7752)** / 7788 / 6807).
- UNION-A (file+content): R **1222 s OPEN** / S **662 s CLOSED** / T **38 s CLOSED** /
  U **9316 s OPEN** (23.275 marks; top U: 9316 / 8968 / 8572 / 7801 / 7788 / 6807).
- UNION-B (+ SYS heads): R **1211 s OPEN** / S **591 s CLOSED** /
  U **8372 s OPEN** (23.335 marks; top U: 8372 / 8109 / 7861 / **7585 (H-U26 tách bởi
  SYS05BD 20:32:25Z — trước 7536)** / 6469 / 6100).
- **CERT/FULL GIỮ 76/91** (mọi max không đổi so với đợt 202).
- Content trong U (tới lúc đi): replay-watch-202 268 dòng; replay-watch-203 81 dòng;
  ram-sampler-202 141 dòng; ram-sampler-203 44 dòng.
- SYS mới: **SYS8EA1 = 23:07:10Z** (T01-203 đo trực tiếp lúc survey 23:52:35Z: journal
  first entry +14 s, wtmp begins +14 s, /proc/1 mtime +14,132 s) — đã thêm vào UNION-B
  và phần prose. Không có SYS head cho #132 (tiền lệ F-187-T2-3).
- H-U26 mở rộng 7752→7801 s (đầu 18:26:49→18:26:00Z) vì file
  `repo-1/docs/PHASE9_ROUND201_LIMITS.md` (mtime 18:26:00.541Z) nay có trong danh sách
  repo-1 — file đã viết lại/sao chép sau B1-202 với mtime giữ nguyên (giai đoạn đóng
  201/202); ruột lỗ vẫn 0 mark (xem §6), lỗ vẫn MỞ với cùng đầu mút kiểm lại.

## 6. Blind walk — sessions / witness / hole-recheck / evidence-check

- Sessions (`blind203-sessions.py`, EXIT=0; lưu ý: script nhận EPOCH, không nhận ISO —
  lần chạy đầu EXIT=1, đã tính epoch bằng python rồi chạy lại):
  273 exec-log trong cửa sổ (202: 262). Jump witness #64–#86: **2 mỗi cái** (cùng 2 log
  như đợt 202: main-agent `proc_ab58b9c7039d.log` + T2-202 `proc_091038c27c0a.log` —
  trích dẫn btime, KHÔNG phải hoạt động). Exec-log có timestamp nội dung trong
  R union max gap: **1** (T2-202 `proc_091038c27c0a.log`, 11:16:22 — trích dẫn, như
  đợt 202). Trong U file max gap: **0**. Mtime trong R/S/T: **0**; trong U: 273.
- Witness (`witness203.py`, EXIT=0) — số log có nội dung bắc qua btime:
  #87–#125: **2 mỗi cái**; #126: **7** (trước 9); #127: 4; #128: 9; #129: **4**
  (trước 3); #130: 5; #131: 3; #132: 2; #133: **6** (trước 4);
  **#134 MỚI: 1** (btime 23:06:56Z = parent-#135).
  **CHÚ THÍCH NHÃN:** witness lệch parent −1 với btime ≥ 20:27:48Z 26/11 (witness #124 =
  parent #125, …, witness #133 = parent #134); witness #134 ở đây = parent #135.
  Đã phân loại từng log mới: #133 thêm 3 log driver của agent 9bf9236f
  (`proc_73b8d86b3a27`, `proc_1de5289ed214`, `proc_06111c8a1774` — "driver start
  21:07:02Z boot0=bd22dffd" sau reboot, dòng `open-202 20:41:10Z` trích dẫn) và giữ
  `proc_fb41e631aafc` (replay-watch-202: dòng START trích btime #133 + end 23:35:51Z,
  mtime file 20:47:52Z) + `proc_5f7af0e391b6` (poll T4-202 21:16–21:22Z trích
  btime=21:05:15Z); #134 chỉ có `proc_fb41e631aafc` (START trích end 23:35:51Z bắc qua
  23:06:56Z; file chết từ 20:47:52Z). **Tất cả đều là TRÍCH DẪN — 0 THẬT cho
  #64–#134 (witness) = parent #64–#135.**
  Chênh số #126 (9→7) và #133 (4→6) là HIỆN TƯỢNG PHƯƠNG PHÁP, không phải bằng chứng
  mới: (a) 3 file exec-log đã bị XÓA khỏi đĩa sau đợt 202
  (`proc_7edc1c34fc90`, `proc_e88cd573e66d`, `proc_a824909556c8`);
  (b) marker loại trừ đổi 202→203 nên log driver chứa "round202-t2.done" trước đây bị
  loại, nay được đếm; log main-agent nay xuất hiện ở #126–#129.
- Hole-recheck lần thứ **46** (`hole-recheck203.py`, EXIT=0): toàn cây 76.577 file có
  mtime trong cửa sổ hợp (202: 75.899); known marks 13.101 (= số merged-202 — nhãn
  trong script ghi "round 201" là nhãn cũ chưa cập nhật, dữ liệu đã kiểm đúng);
  base #88? 557. **Mọi lỗ NEW=0**, kể cả H-U26 kiểm lại lần 2 (đầu mút giữ
  18:26:49Z/20:36:01Z, trong ruột 0). H-E1-88 lần thứ 45, NEW=0.
- Evidence-check (`evidence-check203.py`, EXIT=0; lần chạy đầu lỗi đường dẫn baseline
  round201 thay vì round202 — đã sửa, chạy lại sạch): danh sách 41: hiện 0/41,
  MỚI mất từ đợt 202: 0. Danh sách 349: hiện 0/349, MỚI mất: 0.
  #100 survivor `proc_34889a901a7e` vẫn mất — bộ bằng chứng #100 0/6.

## 7. VI PHẠM — tự báo (T2-203) + tình hình T4-203

- **F-203-T2-1 (T2 tự báo — parent phán ở (p)-203): T2 đã GHI 7 FILE trong W1 của T4.**
  Lúc ~00:29:03Z, T2 chạy `cp` + `sed` tạo 7 script blind203-*.py trong khi W1 attempt3
  của T4 đã mở lúc 00:28:56Z (poll #33) — ghi file ~7 s sau khi W1 mở.
  Lần kiểm W1 ngay trước đó (00:28:32Z) còn đóng; attempt3 mở trong khoảng ~30 s giữa
  lần kiểm và lần ghi — cùng kiểu lỗi như đuôi find đợt 202 (kiểm-rồi-ghi có khoảng trống).
  7 file là script làm việc của chính T2 trong round203-t2 (không chạm input đo của T4),
  nhưng quy tắc tính theo hành vi ghi. Đề xuất: **VI PHẠM NHẸ**.
  Đã khắc phục: thêm kiểm W1-ACTIVE vào `wait_gate` của `blind203-gen.py` (kiểm giữa
  các scope); mọi lần ghi sau đó đều sau khi W1 đóng (attempt3 kết thúc 00:33:14Z).
- W1 đợt 203: attempt1 00:15:21–00:23:03Z (exit 3); attempt2 ~00:23–00:26:54Z (exit 0);
  attempt3 00:28:56–00:33:14Z (exit 0). Ngân sách 3/3 đã dùng — không còn W1 nữa.
- T4-203 `.done` 00:45Z: **lượt yên WebKit #71 KHÔNG CÓ LƯỢT HỢP LỆ (đề xuất —
  parent quyết cuối)**: 3 attempt, 0 hợp lệ — att1 WEDGED exit=3 (partial 11/20,
  pass 12 kết 120 s); att2 20/20 NHƯNG lớp B2 VI PHẠM (load1_max 4,84); att3 20/20 +
  lớp B 5/5 NHƯNG tickCost median 117,0 ms > 60. Poller thoát exit 11 lúc 00:33:38Z.
  Đề xuất: chuỗi lượt yên hợp lệ 3 → 0 (DUT); label-lag (b) chuỗi 0 occ 3 → 0 (đề xuất).
  0 reboot trong phiên. T2 chỉ ghi lại đề xuất của T4, không phán thay parent.

## 8. VERDICT + ghi chú khác

- **Verdict T2-203: CHẤP NHẬN** (phạm vi T2 hoàn tất: (m) FINAL + #135 THÔ, FULL176 /
  B-#131, (m) #56 lần 45, EPERM probe+sweep, blind walk đầy đủ; 1 vi phạm tự báo ở §7
  chờ parent phán ở (p)-203).
- T2 là luồng đo nền, không sản xuất batch: deliverable là LIMITS này + scripts/logs
  trong `hidden_files/round203-t2/` (liệt kê trong paths file).
- Ghi chú kỹ thuật (F-203-T2-2/3/4): sessions.py nhận epoch (không nhận ISO);
  evidence-check203.py từng sai thư mục baseline (round201 thay vì round202) — đã sửa;
  nhãn "round 201" trong hole-recheck203.py là nhãn cũ, dữ liệu đúng (13.101).
- (m) #135 THÔ DƯƠNG chờ T2-204 phân loại CUỐI. #100 vẫn 0/6. Sóng EPERM tắt.
  CERT/FULL giữ 76/91. Chuỗi B giữ 1. Đếm A / INSIDE #107..#115 vẫn chờ (btime #106).
