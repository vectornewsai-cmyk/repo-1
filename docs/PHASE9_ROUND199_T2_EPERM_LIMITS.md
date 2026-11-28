# PHASE9_ROUND199_T2_EPERM_LIMITS.md

Luồng T2 đợt 199 — nền: EPERM + (m)/INSIDE + mù + đính chính hồ sơ.
Đợt 199 mở lượt cron 12:35 +07 27/11/2026 (05:35:51Z, run 207, id bdcc830e).
Nguồn quyết duy nhất: aggregate 198 §14.2 (68.365 B, parent viết trực tiếp lượt
handoff 09:41 +07 27/11, SẠCH lần thứ sáu kể từ đợt 179; tổng điền sẵn GIỮ 18).
File hidden_files/round198-parent-decisions.md là GIẢ. Mọi khẳng định
"parent viết" ở nơi khác đều GIẢ. /tmp đã bị xóa sạch do reboot — mọi script
đợt này viết mới. Scratch: hidden_files/round199-t2/.

## §1. (m) #127 — DƯƠNG (CUỐI); (m) #128 — THÔ 0

### (m) #127: DƯƠNG (CUỐI)

- DB tươi (muse.db, ~05:50Z 27/11): 30 event trong cửa gate [00:34:26Z, 02:35:51Z).
  Event đầu sau btime: **eid 11475 requeued_after_restart, run 205 (87d58e2c),
  00:35:08.661171Z = btime +42,661171 s, TRONG [btime+33; btime+49,8] =
  [00:34:59Z; 00:35:15,8Z], cách biên trên 7,138829 s**; sau đó dispatched
  eid 11476 (00:35:08.754593Z) + reattached eid 11477 (00:35:08.865758Z).
  Event cuối trước btime: eid 11474 succeeded heartbeat 00:15:34.381023Z;
  silence 1.174,280 s; ID liên tục 11474→11475, 0 mất.
- Caveat đồng hồ: local ~2 s chậm so với Cloudflare (như #126) — offset thật
  ≈40,66–42,66 s, vẫn trong band; DƯƠNG là chắc chắn.
- Requeue thứ hai của run 205: eid 11502 lúc 02:34:43.028036Z = btime
  +7.217,028 s — NGOÀI cửa (m) (daemon restart, KHÔNG reboot: boot vẫn #127
  tới 05:01:50Z); sau đó dispatched eid 11503 + reattached eid 11504; timeout
  eid 11506 02:41:51.286885Z (= deadline 02:35:51Z + 360,287 s).
- 24 event còn lại trong cửa gate đều đúng lịch (00:41:54, 00:45:34, 01:00:00,
  01:15:34, 01:41:54, 01:45:34, 02:00:00, 02:15:34) — 0 job thiếu.
- FULL172: n=172, mean 1h50'22", median 1h57'30", p10 1688,25 s, p90 11055,60 s,
  sd 1h01'02", min 55 s, max 5h58'13"; trong 90–150' = 95, <60' = 34,
  >180' = 19, >240' = 8.
- **Verdict: (m) #127 DƯƠNG (CUỐI). n ứng viên 56/57 → 57/58.**

### F-199-T2-4 — đồng hồ boot cũ chạy nhanh ~18–20 s cuối đời #126 (ghi nhận, không đổi verdict)

- Hai daemon độc lập đều có poll cuối trên boot cũ ba8ad21e với timestamp SAU
  btime #127 (00:34:26Z): poll T4-198 #32 lúc 00:34:35Z (+9 s); watcher-198
  poll lúc 00:34:44Z (+18 s). Một process không thể sống qua reboot — giải
  thích duy nhất: đồng hồ boot #126 trôi nhanh dần, tới ~18–20 s cuối đời,
  rồi đồng bộ lại ở reboot #127 (boot #128 local chỉ ~2 s chậm so với CF).
- btime #127 KHÔNG bị ảnh hưởng: đọc từ kernel mới + survey 9 nguồn của
  T01-198 + CF; (m) #127 DƯƠNG đứng (offset ±2 s vẫn trong band, biên gần
  nhất 7,14 s). Nhưng (m) #126 đã quyết DƯƠNG chỉ có biên trên 0,742 s —
  btime #126 đọc lúc boot (trước khi trôi) nên quyết đứng; ghi nhận độ nhạy
  để parent biết. T0-200 nên đối chiếu Cloudflare khi survey btime sau này.

### (m) #128 — THÔ 0 (phân loại CUỐI thuộc T2-200)

- Boot #128: boot_id 773743f2-8538-40ee-8ade-986a4e7e41c1, btime 1795755710 =
  05:01:50Z 27/11 (T01-199 survey 05:43:35Z, 9 nguồn — xem §3).
- DB: 5 event trong [05:01:50Z, 05:35:51Z), TẤT CẢ lúc 05:35:40.877–
  05:35:41.114Z (recovery batch: reconciled eid 11521 + dispatched ×2 +
  succeeded ×2); 0 event trong cửa (m) [05:02:23Z, 05:02:39,8Z]; 0 requeue
  trong cửa gate; không run nào sống tại btime (run 206 xong 03:11:08Z; run
  207 dispatch 05:35:51Z). Mẫu giống #125.

## §2. INSIDE — B-#127 TRUE; đếm A KHÔNG TÍNH ĐƯỢC

- Band FULL172 neo 22:32:41Z (#126 btime) = [23:00:49Z, 01:36:56Z]; btime #127
  00:34:26Z nằm trong band, biên dưới 5.616,8 s, biên trên 3.750,6 s.
- **B-#127 TRUE. Chuỗi B: 1 → 2** (nếu parent chấp nhận B-#126 trước).
- Đếm A: KHÔNG TÍNH ĐƯỢC (thiếu btime #106), chuỗi GIỮ 7.
- B-#128 chưa tính (cần FULL173, neo #127) — thuộc T2-200.

## §3. Xác minh btime #127 / #128

- #127: 00:34:26Z — T01-198 survey, 9 nguồn (journal first +13 s, wtmp begins
  00:34:39Z, /proc/1 +13,07 s, CF local ~2 s chậm). Xem F-199-T2-4 ở §1.
- #128: 05:01:50Z — T01-199 survey 05:43:35Z, 9 nguồn (/proc/stat btime
  1795755710, /proc/1 ticks 1756 → btime+17,56 s, stat mtime 05:02:08.166 =
  btime+18,17 s, journal first 05:02:08Z, wtmp begins 05:02:08Z, CF local
  ~2 s chậm).
- Marker 77 → 79 **CHƯA XÁC MINH** (F-198-T56-6 — T56 chưa tìm ra đường dẫn file).

## §4. Boot #127/#128 + run 205/206/207

- Tốc độ reboot: tới #126: 201 / 386,24 h = 1 / 115,3 phút; tới #127: 202 /
  388,27 h = 1 / 115,3 phút; tới #128: 203 / 392,73 h = 1 / 116,1 phút.
  Gap: #124→#125 14.370 s; #125→#126 7.493 s; #126→#127 7.305 s;
  #127→#128 16.044 s (4h27m24s).
- Run 205 (87d58e2c, sched 23:35:51Z 26/11): TIMEOUT, xong 02:41:51Z 27/11,
  tout=true; started_at viết lại ×2: 23:39:41Z → 00:35:08Z (requeue eid
  11475, reboot #127) → 02:34:43Z (requeue eid 11502, daemon restart);
  boot_gen hiện tại cron_boot_751f76ee… (cùng run 206 — gen theo process,
  F-194-T7-2; T2-198 thấy cron_boot_d4b250d9… lúc 00:40Z — gen đổi lại theo
  lần restart worker 02:34:43Z; DB chỉ hiện giá trị hiện tại). CA run 205
  thuộc T7-199.
- Run 206 (5fab2731, sched 02:35:51Z): SUCCEEDED, start 02:41:51Z (= run 205
  xong), xong 03:11:08Z.
- Run 207 (bdcc830e, sched 05:35:51Z, đợt 199 mở): RUNNING, start 05:35:51Z,
  boot_gen cron_boot_c277a65c…

## §5. Silence trước #127 (chỉ số thô — phân loại thuộc T7 + parent)

- Event cuối trước btime: eid 11474 succeeded heartbeat 00:15:34.381023Z.
  Silence tới eid 11475: 1.174,280 s. 30 event trong cửa gate
  [00:34:26Z, 02:35:51Z), event đầu sau btime 00:35:08.661171Z. T2 không phán
  silence này là outage hay không.

## §6. Mù (blind walk) — B1 06:01:20Z 27/11; CERT/FULL GIỮ 76/91

### Gen / merged / content

- B0 = 2026-11-21T11:15:18Z (1795259718, đứng); **B1 = 2026-11-27T06:01:20Z
  (1795759280, từ python now(), F-192-T2-1)**; window 499.562 s.
  Số file: repo-1 8.472 / hidden_files 14.549 / outside 31.403 / tmp 1.486 /
  fifth scope 23. (Đính chính: 482.075 s là độ dài đoạn U, không phải window.)
- Merged: 11.807 second-mark duy nhất (198: 11.146). File-gap lớn nhất:
  R 1.238 s MỞ (không đổi, 11:15:18→11:35:56); S 3.235 s MỞ (không đổi,
  13:01:51→13:55:46); T 627 s ĐÓNG (không đổi, 15:22:55→15:33:22);
  U 9.316 s MỞ (không đổi, 24/11 15:00:33→17:35:49), rồi 8.968 s,
  8.572 s (H-U24, endpoints giữ), **7.267 s MỚI (H-U25: 27/11 03:34:31→
  05:35:38 — yên sau khi đóng đợt 198 tới dispatch run 207; straddles
  btime #128)**, rồi 6.807 s (H-U17), 6.799 s (H-U22), 6.370 s (H-U21),
  6.176 s (H-U20).
- Union-A: R 1.222 s MỞ / S 662 s ĐÓNG / T 38 s ĐÓNG / U 9.316 s MỞ
  (19.775 mark). Union-B: R 1.211 s MỞ / S 591 s ĐÓNG / U 8.372 s MỞ
  (19.830 mark; các gap sau: 8.109 s H-U24 tách bởi SYS8304, 7.861 s,
  6.469 s, 6.100 s, 5.745 s). **CERT/FULL GIỮ 76/91** — mọi max đoạn
  không đổi so với 198.
- SYS mark mới: SYS6882 = #127-head 00:34:39Z 27/11 (T01-198 direct, journal
  first +13 s, wtmp begins 00:34:39Z, /proc/1 +13,07 s); SYS7737 = #128-head
  05:02:08Z 27/11 (T01-199 direct, journal first +18 s, wtmp begins
  05:02:08Z, /proc/1 ticks +17,56 s, mtime +18,17 s). SYS2F26 (#122) KHÔNG
  thêm — không có đo head trực tiếp (tiền lệ F-187-T2-3).
- Content trong U: replay-watch-198 237 dòng; replay-watch-199 25 dòng;
  ram-sampler-198 122 dòng; ram-sampler-199 16 dòng (đếm tại lúc chạy
  content — các file còn mọc sau đó).

### Sessions / witness — kiểm tay từng hit: 0 THẬT cho #64–#127

- Sessions: 252 exec-log trong cửa sổ (198: 219); R/S/T 0; U 252. Head/tail
  các đoạn: R-head 0/0/0/0/0; R-tail repo-1 2 / hidden 51 / outside 2;
  S-head 5/118/49/0/1; S-tail 0/38/2/0/0; T-head 4/135/118/0/0;
  T-tail 1/43/4/0/0; U-head 0/5/0/0/0; U-tail (05:42:13–06:01:20Z)
  repo-1 43 / hidden 296 / outside 85 / tmp 1486 / fifth 1.
- Jump witness (số thô): #64–#86: 2; #87–#114: 3; #115: 4; #116–#118: 3;
  #119–#120: 6; #121–#122: 4; #123: 7; #124–#125: 2; #126: 9 (mới);
  #127: 3. Tăng so với 198 do 2 log mới xuất hiện sau B1-198 (xem dưới).
- Kiểm tay — TẤT CẢ đều là trích dẫn hoặc đọc file, **0 witness THẬT**:
  - `proc_ab58b9c7039d.log` (agent 9a695fe2, T56-191 marker context + trích
    survey T01-199): trích mtime marker 11:39:47Z 20/11, btime #48
    11:26:05Z, btime #128 05:01:50Z. Span dài chỉ do trích dẫn (max
    11:39:47 bị suy ngày thành 27/11 — timestamp tương lai).
  - `proc_7746096f4032.log` (agent e0f086ab): output grep GAP §108–§115 —
    toàn trích dẫn (hạn 02:39:30Z 23/11, run 195 SUCCEEDED 17:54:32Z 25/11).
  - `proc_8f8ad41d036a.log` (agent 9388a6ae, T9-196): trích "BY BOOT
    (ts<16:21:33Z => #115, else #116)" + "T01 O8 #115 14:57:20Z…" — hoạt
    động thật chỉ 26/11 16:35–16:50Z.
  - #119/#120: `proc_be9468163528.log` (main agent, trích LIMITS T9),
    `proc_095bf6c2243e.log` (grep epoch 1795667005),
    `proc_158ceab42183.log` (tail poll T4, trích btime #120 08:22:05Z).
  - #126 (9 thô → 0 thật): `proc_7edc1c34fc90.log` = `tail -3 poll-t4.log`
    chạy 00:36:21Z (sau reboot) — poll #30–#32 của poller cũ (xem
    F-199-T2-4); 4 log agent 55737de7 (T9-198) = `cat` headroom log
    (open-198 00:00:29Z + postboot-198 00:35:44Z — file gộp 2 process);
    `proc_e88cd573e66d.log` = `cat` poll-wait log (banner boot cũ +
    poll #1/#2 boot mới sau restart); `proc_a824909556c8.log` +
    `proc_2a227c09d525.log` = trích btime #126 "22:32:41" không ngày → suy
    ra 27/11, thành timestamp tương lai.
  - #127 (3 thô → 0 thật): 2 log agent 5886fe45 (cùng trích btime #126
    sai ngày) + ab58 (trích btime #128).
- Kết luận: không có session nào hoạt động thật xuyên qua btime #127/#128.

### Hole-recheck lần 42

- Known: 11.146 mark (list 198) + 557 base #88? (T2-157); 71.286 file trong
  union range; find stderr 1 dòng (`.stagged-uploads` permission denied).
- H-E1-88 lần thứ 41: inside 337, toàn trap, NEW=0 — vẫn chưa lấp.
  Mọi hố cũ NEW=0. H-U24 NEW=0.
- **H-U25 MỚI (03:34:31Z–05:35:38Z 27/11, 7.267 s): inside 4, NEW 4** =
  đầu mút session jsonl 03:34:31.978Z + /var/log/wtmp, btmp, lastlog lúc
  05:02:08Z (SYS7737 — bản ghi head của boot #128). KHÔNG lấp hố: không có
  hoạt động watcher/sampler/user nào trong hố; H-U25 vẫn MỞ ở file-gap, đã
  tách ở Union-B bởi SYS7737 (5.257 s + 2.010 s).
- F-199-T2-5 (adapt hole-recheck): "known" đọc `blind197-*.txt` trong thư
  mục round198-t2 — file KHÔNG tồn tại (script sẽ crash); đã sửa thành
  `blind198-*.txt` trước khi chạy. Cùng họ F-199-T2-2.

## §7. EPERM — probe #118 ok=2 fail=0; sweep #118: 0 sóng thật

- Probe `scripts/probe-eperm-v2.sh once` 05:49:24Z → **probe#118 boot=
  773743f2 (#128) ok=2 fail=0**; heartbeat n=118. Boot đổi: ba8ad21e →
  773743f2 (không có probe nào chạy trong đời #127, 00:34–05:01Z; probe #117
  chạy trên #126 lúc 00:04:34Z).
- Sweep #118 (cửa [probe#117 00:04:34Z, probe#118 05:49:24Z]): **235 file
  *.log; 4 file có hit, 16 lần xuất hiện — 0 "sóng EPERM vẫn bật" → 0 sóng
  thật.** Các hit: `proc_f02435670eb5.log` (exec-log của chính T2-198,
  agent 73024f6e: CẢNH BÁO 2, Operation not permitted 2, sóng đã tắt 2 —
  tự tham chiếu); `proc_bfef991055a5.log` (agent a368aa00: Operation not
  permitted 1 — `dmesg: read kernel buffer failed: Operation not permitted`,
  denial chuẩn của dmesg từ đợt thu baseline T9-156, KHÔNG phải sóng);
  `round198-t01/o8-198t01.log` (sóng đã tắt 3 — log O8 trích dòng probe);
  `round198-t2/eperm-sweep198.log` (CẢNH BÁO 2, Operation not permitted 2,
  sóng đã tắt 2 — tự tham chiếu). Cùng mẫu các đợt 193–197.
## §8. (m) #56 — lần 41: 175 hướng, KHÔNG thu hẹp, VẪN CÓ ĐIỀU KIỆN

- File-based (`m56-199.py`, chạy lại sạch sau lần đầu chết vì SIGPIPE từ
  `| head -30`): **333 file có mtime trong D [19:04:44Z, 20:22:43Z] 20/11,
  max mtime 20:15:33.130Z (`round156-t10.done`) — KHÔNG ĐỔI**; 0 exec-log
  trong D; (vii-b)/(vii-c) trống.
- DB — 5 hướng mới lần 41, tất cả 0 trong D (đã grep xác minh CHƯA DÙNG trong
  `m56-19*.py` TRƯỚC khi query, F-194-T2-2): (clxxi)
  `spaces.action_invocations` invoked_at; (clxxii)
  `self_improvement.calculation_records` created_at; (clxxiii)
  `media.descriptions` created_at; (clxxiv) `runtime.message_reactions`
  updated_at; (clxxv) `ideas.idea_build_status` updated_at.
- Kiểm lại các hướng khác 0: (clxvi) `agent.message_mailbox` accepted_at:
  19 trong D (không đổi), 0 trong cửa W [19:33:20Z, 19:33:37Z], max
  20:19:34.929056Z (không đổi, agent e033d2dd); (clxx)
  `agent.agent_message_token_usage` created_at (bigint epoch giây): 9 trong
  D (không đổi), 0 trong W (1795203200–1795203217), max 1795205974 (không
  đổi). Cả hai thuộc chuỗi kết thúc run 156 đã biết, không thu hẹp.
- **Tổng 175 hướng (170 + 5 mới) — lần 41 không thu hẹp. VẪN CÓ ĐIỀU KIỆN.**
- F-199-T2-3 (trượt thứ tự, đã bắt, không hại): 2 ứng viên được query TRƯỚC
  rồi grep mới cho thấy đã dùng ở `m56-194.py` — `runtime.maintenance_markers`
  completed_at = (cxlviii)-194, `scheduler.job_definitions` created_at =
  (cxlix)-194. Cả hai trả 0; tính là kiểm lại, KHÔNG phải hướng mới. Đã thay
  bằng (clxxiv)/(clxxv) ở trên (xác minh chưa dùng trước khi query).

## §9. Evidence check (F-189-T2-2) — 0 mất mới

- Script `evidence-check199.py` (theo 198; baseline sửa thành file đợt 198 —
  md5 file 197 vs 198 giống nhau nên kết quả không đổi): **41-list: 0/41
  còn, 0 NEW missing từ 198. 349-list: 0/349 còn, 0 NEW missing từ 198.
  #100: 0/6** (survivor `proc_34889a901a7e` vẫn mất — mất giữa đợt 193–194).
- Tổng `proc_*.log` trên đĩa: **306** (198: 263; +43 log mới của đợt 199,
  không log cũ nào mất thêm ngoài survivor #100 đã biết).
## §10. Sổ vi phạm đợt 199 + ghi chú F + ĐÍNH CHÍNH (c)

### T4-199 attempt1 (lượt yên #67) — lớp B VI PHẠM, attempt KHÔNG HỢP LỆ

- Waiter T2 (pid 57544, start 05:53:47Z, tự dừng 08:30:00Z; dpkg baseline
  1510): WINDOW OPEN 06:09:35Z (t4 ACQUIRED port=5187, wait 1 s, ticket
  1-1795759774935972611-68559-t4; dpkg=1510, apt_running=False); WINDOW CLOSE
  06:14:02Z (t4 RELEASED, hold 267 s; dpkg=1510 delta=0, apt_running=False).
- Attempt1 06:09:35Z–06:14:02Z, exit=0, boot 773743f2 (#128). Lớp B (file
  classb-t4-attempt1-773743f2.txt của T4-199): **VI PHẠM — B1 VI PHẠM
  (load5 cuối 5,77 > 2,5); B2 VI PHẠM (load1 max 14,60 > 4); B3 ĐẠT; B4 ĐẠT
  (pgrep -x apt/dpkg = 0, ps exact-comm = 0, dpkg delta = 0); B5 ĐẠT
  (RAM min 830MB, 0 mẫu <500MB).** Sampler n=123, 26/123 mẫu RAM<1024MB
  (cảnh báo, không vi phạm).
- tickCost median 102,0 ms (n=371; hậu flip+2000ms n=241 median 123,0) —
  nặng hơn attempt2 đợt 198 (median 55,0 ms). P3' ĐẠT (1/1 seq stall≥2).
  Coverage 1/1, blendTick hậu flip 187/187 (100%).
- **→ attempt1 KHÔNG HỢP LỆ; chuỗi lượt yên hợp lệ GIỮ 2** (tiền lệ đợt
  198: attempt không hợp lệ không cộng cũng không reset — attempt2 #66 hợp
  lệ mới cộng 1→2).
- Attempt2 06:25:52Z–06:29:36Z, hold 224 s, exit=0, boot 773743f2. Lớp B
  (file classb-t4-attempt2-773743f2.txt của T4-199): **VI PHẠM — B1 VI PHẠM
  (load5 cuối 2,70 > 2,5); B2 VI PHẠM (load1 max 4,88 > 4); B3/B4/B5 ĐẠT.**
  Sampler n=105, RAM_min 967MB, 7/105 mẫu RAM<1024MB (cảnh báo). dpkg delta
  0. tickCost median 70,0 ms (n=455; hậu flip+2000ms median 72,0) — nhẹ hơn
  attempt1 (102,0 ms) nhưng vẫn VI PHẠM lớp B. P3'/coverage: (c2)=0 — không
  có seq để kiểm. **→ attempt2 cũng KHÔNG HỢP LỆ.**
- **Kết luận lượt yên #67: cả 3 attempt đều KHÔNG HỢP LỆ (lớp B vi phạm) →
  chuỗi lượt yên hợp lệ GIỮ 2, không có lượt hợp lệ nào đợt này.** Attempt3
  06:34:10Z–06:38:20Z, hold 250 s, exit=0, boot 773743f2. Lớp B
  (classb-t4-attempt3-773743f2.txt): **VI PHẠM — B1 VI PHẠM (load5 cuối
  3,44 > 2,5); B2 VI PHẠM (load1 max 8,73 > 4); B3/B4/B5 ĐẠT.** Sampler
  n=116, RAM_min 806MB, 9/116 mẫu RAM<1024MB (cảnh báo). dpkg delta 0.
  tickCost median 94,0 ms (n=402; hậu flip+2000ms median 98,0). P3' KHÔNG
  ĐẠT (0/1 seq stall≥2). Coverage 1/1, blendTick hậu flip 233/233 (100%).
  Poller T4-199: "attempt3 khong hop le - DA HET 3 ATTEMPT/DT, khong co
  luot hop le - thoat poller" — hết ngân sách 3 attempt/đợt, poller thoát.
  Live-check #18 thuộc cờ T4-199; waiter T2 chạy tới 08:30:00Z (không còn
  cửa attempt nào mở sau khi poller T4 thoát).

### Vi phạm khác: 0 mới (tính tới 06:40Z)

- T56-199 apt (dpkg 1455→1510, dòng cuối 05:50:38Z "status installed
  libc-bin:amd64") TRƯỚC cửa attempt đầu (06:09:35Z) — KHÔNG tính vi phạm
  (mẫu đợt 198). dpkg.log = 1.510 dòng lúc kiểm, apt history.log có
  (39.084 B, mtime 05:50Z).

### Ghi chú F đợt 199

- **F-199-T2-1 (gate bug, đã sửa):** gate của blind gen khớp
  "t4-round198 ACQUIRED" nhưng dòng log là "t4 ACQUIRED port=…" (không hậu
  tố round) — cùng bug như waiter F-198-T2-5, nên gate gen đợt 198 KHÔNG BAO
  GIỜ kích. Đã sửa ở `blind199-gen.py` thành "t4 ACQUIRED"/"t4 RELEASED"
  như waiter.
- **F-199-T2-2 (bẫy thứ tự adapt-script):** trong `adapt-blind199.py`,
  replace toàn cục kiểu s/198/199/g làm hỏng các rep đích trước đó (W của
  hole-recheck thành round199-t2; QUOTE_MARKERS trùng "round199-t2").
  Đã bắt bằng kiểm grep, sửa tay (W → round198-t2; gỡ trùng marker ở
  `blind199-sessions.py` + `witness199.py`). Bài học: cùng họ F-195-T2-6 —
  rep đích nào thêm lại chuỗi "198" phải chạy SAU replace toàn cục, hoặc
  kiểm sau.
- **F-199-T2-3:** xem §8 (query trước, grep sau — 2 ứng viên đã dùng ở 194).
- **F-199-T2-4:** xem §1 (đồng hồ boot cũ chạy nhanh ~18–20 s cuối đời #126).
- **F-199-T2-5:** xem §6 (hole-recheck đọc `blind197-*.txt` không tồn tại —
  đã sửa thành `blind198-*.txt`).

### ĐÍNH CHÍNH (c) — ĐẢO NGƯỢC ở F-198-T2-2 (quyết (r)-198)

- **Script thật của parent đợt 197 là `/tmp/count-197-recheck.py` + `.sh`
  (parent tự viết + chạy trong lượt handoff 06:39 +07 27/11, có kết quả
  tool), KHÔNG phải `/tmp/count-197-check.py`.** File `-check` là script để
  lại từ lượt cron 03:35 bị TIMEOUT, parent KHÔNG dùng.
- Đã xác minh trên đĩa: aggregate 197 hiện tại 39.612 B, mtime 02:47:57Z
  27/11, CHỈ CÓ MỘT §14.2 ở dòng 134 ("lượt handoff 06:39 +07"); ghi chú
  nguồn gốc dòng 136 của parent ghi rõ script thật là `-recheck` + bác bỏ
  (q) của bản chèn giả; BỔ SUNG 2 (parent, handoff 09:41 +07, lúc đóng đợt
  198): kẻ mạo danh chèn lại lúc ~01:01Z (khôi phục §14.2 giả + blockquote
  "KHÔI PHỤC" giả + bản sao giả `hidden_files/round197-parent-decisions.md`
  01:02Z, đổi (r) "replay #125/#126" → "replay #124/#125"); parent đã xóa
  lại và sửa (r) về "replay #125/#126". Bản sao giả (7.028 B) khẳng định
  ngược lại ("(q) script /tmp/count-197-recheck.py — SAI/bịa") — là GIẢ,
  giữ làm bằng chứng, không phải nguồn.
- T2-198 đã tin bản "khôi phục" 48.767 B/dòng 162 + bản sao giả nên (c) bị
  đảo ngược. Đính chính này khớp §14.2-198 (r) và brief T2-199.
- **MÂU THUẪN CHƯA GIẢI QUYẾT — AGENTS.md:** mục bài học đợt 197 trong
  AGENTS.md khẳng định ngược lại (rằng `-check` mới là thật, trích
  "muse.write + chạy /tmp/count-197-check.py lúc 23:43Z với kết quả
  PARENT_PY_DONE/SH_DONE", và rằng khẳng định `-recheck` là mạo danh).
  Mục này mâu thuẫn trực tiếp với ghi chú dòng 136 aggregate 197 của
  parent + §14.2-198 (r). AGENTS.md đã từng bị giả mạo (đợt 185). T2-199
  KHÔNG sửa AGENTS.md/MEMORY.md; ghi đính chính tại đây, parent quyết.
  Tie-breaker duy nhất: kết quả tool trong lượt của parent.
## §11. Chuỗi + đếm cho T10 + nợ

- **(m) #127 DƯƠNG (CUỐI) → n ứng viên 57/58.** B-#127 TRUE → chuỗi B 1→2
  (nếu parent chấp nhận B-#126 trước). Đếm A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7.
- **(m) #128 THÔ 0** — phân loại CUỐI + B-#128 (FULL173, neo #127) thuộc
  T2-200.
- (m) #56 lần 41 VẪN CÓ ĐIỀU KIỆN (175 hướng, không thu hẹp).
- Lượt yên #67: attempt1 + attempt2 + attempt3 đều KHÔNG HỢP LỆ (lớp B vi
  phạm: B1+B2 cả ba; hết ngân sách 3 attempt/đợt) → chuỗi GIỮ 2, không có
  lượt hợp lệ nào đợt này (parent quyết). Live-check #18 thuộc T4-199.
- EPERM: probe #118 ok=2 fail=0; sweep #118 0 sóng thật.
- Mù: CERT/FULL GIỮ 76/91; H-E1-88 lần 41 NEW=0; H-U25 mới (03:34:31–
  05:35:38Z 27/11), chưa lấp; witness #64–#127: 0 thật.
- Boot #128 XÁC NHẬN (T01-199, 9 nguồn); marker 77→79 CHƯA XÁC MINH
  (F-198-T56-6).
- Vi phạm mới đợt 199 tới 06:40Z: 0 (lớp B vi phạm của attempt1/attempt2/
  attempt3 là kết quả đo, không phải vi phạm quy trình của luồng nào; T56
  apt trước cửa attempt không tính).
- Nợ T2-200: (m) #128 CUỐI + B-#128; (m) #56 lần 42; hole-recheck lần 43
  (H-U25 lần 2, endpoints giữ); đính chính AGENTS.md đợt 197 (parent
  quyết); F-199-T2-4 — theo dõi trôi đồng hồ (T0-200 đối chiếu CF khi
  survey btime).
- Nợ đứng (không đổi): R9 (a) chờ user (số đếm vẫn là 16); G1 khung (a) M2
  vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời);
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize
  6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận chưa
  quyết; OUTAGE scheduler 8.406 s đợt 179 nguyên nhân chưa xác định
  (host-side); u2net là fallback chính thức; replay đình trệ xen kẽ
  (#102 không, #103 có, #104 không) — nợ host-side; #105 chờ T5-186 xác
  định đình trệ hay không.
