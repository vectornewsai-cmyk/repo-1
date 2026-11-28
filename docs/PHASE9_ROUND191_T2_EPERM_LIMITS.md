# PHASE9_ROUND191_T2_EPERM_LIMITS.md — T2 đợt 191 (EPERM probe + (m)/INSIDE + mù)

Luồng nền đợt 191. Đợt 190 VOID (không tồn tại) — các nợ của nó chuyển sang đợt này.
Cửa sổ mù: B0 2026-11-21T11:15:18Z → B1 2026-11-25T09:27:00Z (= 339.102 s).
Boot: #112 = 27e6714f (btime 02:33:19Z); #113 = f7632121 (btime 04:36:24Z); #114 = b0aab705 (btime 08:25:43Z, ứng viên — T01-191 xác nhận).
Viết 25/11/2026 ~10:00Z; hạn cờ ~11:00Z, hạn cứng ~11:35Z. KHÔNG PUSH.

## §0. Tóm tắt verdicts (cấp T2 — parent quyết cuối ở §12.3-191)

- (m) #113: **DƯƠNG (CUỐI ở cấp T2)** — requeue eid 10947, run 190, +35,149752 s, trong [33; 49,8]. n ứng viên 50/51 → **51/52** nếu parent chấp nhận. Rủi ro dư: trường hợp xấu nhất kết hợp (phân số −1 s VÀ log sampler +2 s) = 32,149752 s, DƯỚI biên 0,850248 s — parent quyết.
- INSIDE #112/#113 (đếm A): **KHÔNG TÍNH ĐƯỢC** (thiếu btime #106); chuỗi GIỮ 7. Đếm B (tham chiếu): #112 TRUE (FULL158), #113 FALSE (FULL159).
- Mù: R 1.238 s MỞ (lần 25); S 3.235 s MỞ; T 627 s ĐÓNG; U file 9.316 s MỞ (không đổi). Union-A U 9.316 s MỞ + 3 hố MỚI 25/11 (2.632/2.400/2.032 s, trong khoảng trống đợt 190 VOID). 0 hoạt động thật mới ở mọi witness. CERT/FULL GIỮ 76/91.
- Hole-recheck lần 34: NEW=0 ở cả 27 hố. H-E1-88 lần thứ 33 liên tiếp 0 mới.
- (m) #56 lần 33: **VẪN CÓ ĐIỀU KIỆN** (DB 5 hướng mới đều 0 dòng; file (vii) 333, max 20:15:33.130Z).
- EPERM: probe #110 ok=2 fail=0; sweep 0 sóng thật.
- Bằng chứng bị xóa (F-191-T2-2): exec-log bị cắt ~24 h lăn — 108/349 đường dẫn trong list đợt 189 đã mất (cắt sắc 09:48:23Z mất / 09:51:07Z còn, 24/11); bộ chứng cứ #100 còn 1/6.
- Vi phạm đợt 191: **0 vi phạm**. Trường hợp biên duy nhất: P4 sinh fixture chồng cửa sổ attempt 6 s nhưng NHẸ (load1 không tăng, attempt hợp lệ) — KHÔNG đếm; parent quyết có nâng lên light violation hay không. Đề xuất chuỗi đợt sạch 5 → 6.
- POSTBOOT_PASS #114 ĐẠT poll=0 (T56-191); #112 ĐẠT poll=0; #113 chưa có file (T56-191 quyết).

## §1. (m) #113 — PHÁN CUỐI (cấp T2)

Số thô (T7-189): requeue eid 10947, run 190 (eb18559f-fb4f-4ba5-810a-57dba9af82f4), lúc 04:36:59.149752Z = btime #113 (04:36:24Z) **+35,149752 s**.

- Dải [33; 49,8]: **TRONG**, cao hơn biên dưới 2,149752 s, thấp hơn biên trên 14,650248 s.
- Trường hợp xấu nhất phân số: offset thật ∈ (34,149752; 35,149752] s — TRONG với biên 1,149752 s, không tự lật được.
- Overlap / caveat đồng hồ:
  - Watcher-189 (replay-watch-189.log) poll cuối **04:36:20Z, boot 27e6714f — 4 s TRƯỚC btime, ZERO overlap** (sạch, khác #111 +10 s).
  - Sampler-189 mẫu cuối #112 **04:36:26Z, boot 27e6714f — log +2 s** (cùng mẫu +2 s như sampler-187 ở #111). Theo nghĩa đen +2 s → 33,149752 s, vẫn TRONG với biên 0,149752 s (KHÔNG tự lật). Kết hợp xấu nhất (phân số −1 s VÀ log +2 s) = 32,149752 s, DƯỚI biên 0,850248 s — rủi ro dư, parent quyết.
  - Mẫu +2 s nhất thiết là artefact thang đồng hồ (process không thể sống qua reboot mà vẫn báo boot_id cũ 2 s sau boot mới) — mẫu mù hướng như #110/#111.
  - Không có xác minh đồng hồ độc lập mới trước #113 (T0-190 VOID). Tham chiếu đứng: T0-188 xác minh đồng hồ NHANH δ > 10 s trước #111; T0-189 (F-189-T0-2) thấy local CHẬM hơn Cloudflare ~1–2 s trước #112; T01-191 kiểm 08:44:33Z: local mid 1795596271 vs CF Date 1795596273 — local chậm ~1–2 s, không nhanh.
  - Các log watcher khác (b2watch2.out, probe-loop.out, autotrigger-live2.out, sampler2.out) không có dòng nào 04:35–04:37Z.
- Cửa hẹp [04:36:24Z, 04:55:24Z] ĐÓNG: 9 event (mọi job), 3 vcut, đúng **1 requeue** (eid 10947; + dispatched eid 10948 + reattached eid 10949, cùng 04:36:59Z). Event cuối trước btime: heartbeat eids 10944–10946 lúc 04:15:34Z (21 phút trước, không có gì ở biên).
- Cửa rộng [04:36:24Z, 08:25:43Z] ĐÓNG bởi btime #114: 6 event vcut (dispatched 2, succeeded 2, reattached 1, requeued 1), đúng **1 requeue** trong toàn cửa sổ (chỉ eid 10947). 0 event trong (08:25:43Z, 08:25:55Z] (vùng mơ hồ btime 12 s); event vcut tiếp theo sau btime #114: run 192 dispatched 08:35:51Z. Mơ hồ không đổi được đếm.
- Run sống tại btime #113: đúng **1** — run 190 (sched 1795574151 = 02:35:51Z, xong 1795582885 = 05:01:25Z, SUCCEEDED).
- Run 191 (814be71a, sched 1795584951 = 05:35:51Z, slot cron của đợt 190 VOID): SUCCEEDED, xong 1795586021 = 05:53:41Z, started = sched (jitter 0).
- Run 192 (d3d9408b, sched 1795595751 = 08:35:51Z, đợt 191): RUNNING lúc T2 đọc, started 1795595751 (jitter 0), boot_gen cron_boot_cdd48e77…. Run 190 boot_gen cron_boot_9a3a6bd6…; run 191 boot_gen cron_boot_d9ab3da6….
- **n ứng viên 50/51 → 51/52 nếu parent chấp nhận #113. n chính thức GIỮ 14.**
- Script: hidden_files/round191-t2/m-check191.py (exit 0), output m-check191.txt. Script nối m-check189.py (FULL157 p10/p90 assert khớp giá trị in của T2-189: 1631.80/8839.80).

## §2. INSIDE #112/#113

- Đếm A (đứng): **KHÔNG TÍNH ĐƯỢC** — btime #106 vẫn chưa biết; đợt 191 không có dữ liệu mới (T01-191 chỉ xác minh boot #114). Chuỗi GIỮ 7 (parent-186 (d): #105 TRUE FULL151 → 7). INSIDE #107–#113 theo A đều CHỜ. Dòng GAP 1917 nhắc boot 691a7403 (btime 03:55:45Z) là ứng viên "#106?" từ thời đợt 144 — chưa từng xác nhận, đã bị parent-186 (e) thay thế. Đếm A (parent-186 (e)): cea79500=#107, 7ea9d047=#108, 6f1d9f87=#109, 912f4a97=#110, 257c1eae=#111; #106 chưa xác minh.
- Đếm B (chỉ tham chiếu, không phải chuỗi đứng):
  - FULL158 (n=158, mean 1h43'27", median 1h55'48", p10 1640.60 s, p90 8836.60 s) — f7632121 (B-#112) vs dải neo 02:33:19Z [03:00:39Z, 05:00:35Z] → **TRUE** (biên 5.745 s / 1.451 s); chuỗi B 0 → 1.
  - FULL159 (n=159, p10 1649.40 s, p90 8900.00 s) — b0aab705 (B-#113) vs dải neo 04:36:24Z [05:03:53Z, 07:04:44Z] → **FALSE** (muộn 4.859 s sau cuối dải); chuỗi B 1 → 0.
  - Kiểm chéo f763 vs FULL158 (dải trước) = FALSE (muộn 10.701 s).
  - INSIDE #112 theo B đã FALSE ở T2-189 (27e6 vs FULL157, muộn 3,316 s) — nhắc lại, không tính lại.
- Khoảng cách: #112→#113 = 7.385 s; #113→#114 = 13.759 s. Tốc độ reboot: tới #112 187 lần / 342,25 h = 1 lần / 109,8 phút; tới #113 188 / 344,30 h = 1 / 109,9 phút; tới #114 189 / 348,12 h = 1 / 110,5 phút.
- Boot #114 (số ứng viên, T01-191 xác nhận): b0aab705-7ef5-47fd-95e0-e97910fbfa88, btime 1795595143 = 08:25:43Z. Khảo sát T01-191 08:44:31Z: /proc/stat btime 1795595143 + uptime -s 08:25:43; /proc/1 08:25:55.38Z (+12,38 s); journal đầu 08:25:55Z (+12 s); wtmp bắt đầu 08:25:55Z — cùng mẫu +12 s như #111/#112/#113. Marker còn sống (mtime 2026-11-20 11:39:47Z).

## §3. Mù — blind walk (B1 09:27:00Z 25/11)

### §3.1. Danh sách thô (find -newermt, loại chrome-userdata/dist/node_modules/.git)
- repo-1: **4.918** file (189: 4.398, +520). hidden_files: **9.480** (189: 9.203, +277). outside: **9.145** (189: 3.471, +5.674). /tmp: **1.332** (189: 631, +701). fifthscope: **19** (189: 20, −1).
- Outside +5.674: chủ yếu tmp-round191-p3 của P3 (5.279 file, khung hình PNG 2.480 + log/mp4/db — P3 trích frame cho reverse preview, hoạt động thật trong cửa sổ) + repo-1-push-snap-166-189 (335 file, snapshot PUSH #9 lúc ~07:36Z) + agents 75. /tmp +701: toàn file sau 03:21Z (tmpfs đã bị xóa bởi reboot #113/#114; file mới từ đóng đợt 189 / đợt 190 / đợt 191).
- Merged unique second-marks: **8.068** (189: 7.549, +519). find stderr: 1 dòng (Permission denied /home/hatch/.stagged-uploads, như đợt 189).
- Kiểm chéo investigate: repo-1 4.901 / hidden_files 9.482 / outside 9.169 / tmp 1.345 (lệch nhỏ do thời điểm/method quét khác; merged là chuẩn).

### §3.2. Gaps file (merged)
- R [11:15:18Z → 11:38:28Z 21/11]: max **1.238 s MỞ** (lần thứ 25, không đổi). S: max **3.235 s MỞ** (không đổi). T: max **627 s ĐÓNG** (không đổi). U: max **9.316 s MỞ** (15:00:33Z → 17:35:49Z 24/11, không đổi); thứ hai 8.968 s; rồi 3.530 / 3.116 / 2.976 / 2.852 / 2.701 / 2.650 s (không đổi so với merged đợt 189).
- U-tail: mark cuối 09:26:59Z (1 s trước B1). R-head: mark đầu 11:35:56Z (+1.238 s).

### §3.3. Union (file + content-ts + SYS marks)
- R union-A 1.222 s MỞ; R union-B 1.211 s MỞ (dispatch 11:35:51Z DB không tính vào union chính).
- S union-A 662 s ĐÓNG; S union-B 591 s ĐÓNG. T union-A 38 s ĐÓNG.
- U union-A **9.316 s MỞ** (thứ hai 8.968 s; **MỚI thứ ba 2.632 s** 06:54:24Z → 07:38:16Z 25/11; **MỚI thứ tư 2.400 s** 06:01:50Z → 06:41:50Z; **MỚI thứ năm 2.032 s** 05:06:13Z → 05:40:05Z; thứ sáu 2.013 s). Ba hố mới đều trong khoảng trống đợt 190 VOID (T10-189 đóng ~05:47Z, đợt 191 mở 08:35Z — không có đợt nào chạy).
- U union-B **8.372 s MỞ** (thứ hai 7.861 s; rồi 2.632 / 2.400 / 2.032 / 2.013 s).
- Hố nhân tạo 1.726 s (01:15:54Z → 01:44:40Z 24/11, F-189-T2-2) **vẫn tồn tại, nay đứng thứ 7** (rớt khỏi top-6 do 3 hố mới chen lên): đã xác minh 0 file-mark trong hố ở cả hai đợt + 0 dòng content-ts nào trong hố (grep replay-watch-*/ram-sampler-*).
- SYS marks mới: SYS257C = 23:10:56Z (T5-188 trực tiếp), SYS27E6 = 02:33:31Z (T0-189 trực tiếp) — từ đợt 189. **SYSF763 KHÔNG thêm** — không có đo đầu trực tiếp nào cho #113 (journal chỉ giữ boot hiện tại; wtmp chỉ bắt đầu 08:25:55Z cho #114). **SYSB0AA = 08:25:55Z** (T01-191 trực tiếp: journal đầu +12 s, wtmp bắt đầu +12 s, /proc/1 +12,38 s).
- Content mới trong U: replay-watch-188 273 dòng, ram-sampler-188-FROZEN 123 dòng (như đợt 189 — danh sách nguồn của content script dừng ở đợt 188; watcher/sampler đợt 189 chưa được đưa vào script).
- Blind #94?/#95?/#96?/#88?/#77? vẫn MỞ. **CERT/FULL GIỮ 76/91.**

### §3.4. Witness (exec-log content spans) — 0 hoạt động thật mới
- Sessions #64–#86: **3 thô → 0 thật** mỗi khoảng (cùng 3 file trích dẫn dài: proc_34889a901a7e session main agent; proc_d3d4ab5f7009 mtime 03:27:47Z — sau B1 đợt 189 nên đợt 189 không đếm; proc_ad2556eb9f46 log session parent hiện tại, mtime 08:36:48Z, span tới 17:51:50Z 25/11 — timestamp tương lai trích dẫn).
- #87–#93: 2 → 0. #94: 3 → 0. #95–#101: 2 → 0. #102: 3 → 0. #103: 10 → 0. #104: 6 → 0. #105: 8 → 0. #106-B/#107-A: 5 → 0. #107-B/#108-A: 7 → 0. #108-B/#109-A: 4 → 0. #109-B/#110-A: 8 → 0. #110-B/#111-A: 3 → 0.
- #111-B/#112-A: 6 → 0 (thêm 1 file so với 5 của đợt 189: proc_e91e180416da — span dài trích dẫn, cùng mẫu).
- #112-B/#113-A (MỚI, span 04:36:24Z): 7 → 0 (6 file span dài trích dẫn + proc_cbf389b52699 của T9-189: 1 dòng 04:37:42Z là dòng sampler trên boot MỚI #113, 0 dòng trong 04:36Z — span cắt #113 nhờ timestamp trích dẫn).
- #113-B/#114-A (MỚI, span 08:25:43Z): 6 → 0 (0 dòng trong 08:20–08:30Z ở cả 6 file).
- Chênh lệch số thô so với đợt 189 (#87: 2 vs 1; #100: 2 vs 4; #103: 10 vs 12…) do file bị xóa (cắt exec-log, xem §7) và file mới (mtime sau B1 đợt 189) — đã kiểm tay từng file, tất cả đều loại trích dẫn.
- exec-logs có mtime trong cửa sổ: 266 (witness) / 284 (sessions, chỉ U). Bỏ qua log có quote-marker: 18.

## §4. Hole-recheck lần 34 — NEW=0 ở cả 27 hố

- H-R1 0, H-R1-old 0, H-S1 0, H-S2 0, H-S3 0 (1 float-trap), H-T1 0, H-U1 0, H-U2 0 (1 trap), H-U2-old 0, H-U3 0 (10 trap), H-U4 0, H-E1-88 0 (337 inside, toàn float-trap), H-U5 0, H-U6 0, H-U7 0, H-U8 0, H-U9 0 (1 trap), H-U10 0, H-U11 0 (1 trap), H-S4 0 (1 trap), H-T2 0 (1 trap), H-U12 0 (1 trap), H-U13 0 (2 trap), H-U14 0 (3 trap), H-U15 0 (1 trap), H-U16 0 (3 hits, 0 mới).
- **H-E1-88 lần thứ 33 liên tiếp 0 mới.** Whole-tree file có mtime trong union range: 27.269. Script đọc list đợt 189 (W=round189-t2) theo đúng thiết kế — known merged marks 7.549 s.
- Log: hidden_files/round191-t2/hole-recheck191.log (ghi holerecheck-all.txt vào round189-t2 theo quy ước đứng).

## §5. (m) #56 lần 33 — VẪN CÓ ĐIỀU KIỆN

- DB (5 hướng mới cxxxi–cxxxv, tổng 135), đều **0 dòng** trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217): (cxxxi) runtime.tool_outputs created_at; (cxxxii) runtime.messages created_at; (cxxxiii) feed.runs created_at_ms (1795203200000–1795203217000); (cxxxiv) goals.updates updated_at_ts; (cxxxv) memory.entries created_at. Tất cả đã xác minh chưa dùng trong m56-189.py (grep 0 kết quả).
- File: (vii) mtime scan ~/workspace trong D: **333 file** (như đợt 189), max mtime 20:15:33.130Z (max đã biết 20:19:34Z); (viii) exec-log trong D: **0**; (vii-b) file 20:16:00–20:17:00Z: **0**; (vii-c) file 20:19:30–20:19:40Z: **0**.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s không đổi.
- Log: hidden_files/round191-t2/m56-191.log.

## §6. EPERM — probe #110 + sweep

- Probe #110: **ok=2 fail=0**, 08:56:05Z, boot b0aab705. File tạm /tmp/eperm-probe-tmp-110.txt + workspace hidden_files/eperm-probe-ws-110.txt (nội dung "probe-191"). MemAvailable 3.138.576 kB lúc probe. Log hidden_files/eperm-probe-v2.log đã thêm dòng đổi boot (27e6714f → b0aab705, uptime từ 2026-11-25 08:25:43) + dòng probe; heartbeat eperm-probe-v2.heartbeat cập nhật (pid 31972 = shell của T2; pid cũ 205198 đã chết cùng reboot). Probe trước #109 là 02:50:06Z trên boot 27e6714f.
- Sweep [02:50:06Z, 08:56:05Z] 25/11: 367 file *.log có mtime trong cửa sổ, **7 file có marker hit, 29 lần xuất hiện — TẤT CẢ đều trích dẫn, 0 sóng thật**:
  - 'sóng EPERM đã tắt' ×3 trong mỗi file o8-189t0.log / o8-191t01.log / o8-189t8.log (×2 vị trí) / o8-184t8.log — dòng trạng thái của chính harness O8.
  - 'CẢNH BÁO' ×1 + 'Operation not permitted' ×1 trong proc_c1f0f6842a20.log và eperm-sweep189.log — trích dẫn từ log sweep các đợt trước (sweep chỉ đếm marker trong *.log, không grep -r bừa — F-150-T2-2).
- Log: hidden_files/round191-t2/eperm-sweep191.log.

## §7. Bằng chứng bị xóa — F-191-T2-2 (theo dõi F-189-T2-2)

Exec-log bị cắt theo chu kỳ **~24 h lăn** (mô hình đã xác minh):

- List merged đợt 189: **349 đường dẫn exec-log, 108 đã mất (31%)** lúc kiểm ~09:47Z 25/11. Cả 108 đều có mtime 24/11 03:xx–09:48:23Z (theo giờ: 03:12, 04:13, 05:22, 06:22, 07:8, 08:15, 09:16). Cắt SẮC: mtime mất lớn nhất **09:48:23Z** (proc_536163a5d341.log), mtime còn nhỏ nhất **09:51:07Z** (proc_461015022e63.log) 24/11 — ngưỡng ≈ giờ kiểm − 24 h. List đợt 189 chỉ còn exec-log từ 24/11 (263) và 25/11 (86) — log 21–23/11 đã bị cắt hết trước đợt 189.
- Witness-cited (log đợt 189): 41 đường dẫn, **8 mất** (tất cả mới; đều nằm trong 108 trên).
- 6 file witness-missing của đợt 189 vẫn mất. Bộ chứng cứ #100: **còn 1/6** (đợt 189 còn 3/6) — chỉ còn proc_34889a901a7e (session main agent); proc_e606d7b4f921 và proc_e0c4ed13d7cd mất thêm từ đợt 189.
- Hệ quả: các witness tương lai sẽ mất dần nhân chứng cũ; union-B dựa vào SYS marks trực tiếp càng quan trọng. Danh sách 108 file mất: hidden_files/round191-t2/evidence-check191-merged.txt; log kiểm: evidence-check191.log.

## §8. Vi phạm quy tắc đứng đợt 191 — 0 vi phạm

Cửa sổ attempt T4 #59: **09:03:40–09:07:10Z** (poller thoát 09:07:37Z; kiểm theo cửa sổ rộng [09:03:40, 09:07:37Z]). Attempt1 **HỢP LỆ**: 20/20 + LOP B 5/5 + tickCost median 42,0 ms ≤ 60, ngân sách 1/3. T8 waiter tuân thủ (GATE-NOT-YET polls, phát hiện t4attempt=LOCK-T4 lúc 09:03:44Z, tiếp tục chờ).

Quét file mtime trong cửa sổ (find toàn cây, loại chrome-userdata/dist/node_modules/.git):
- repo-1: 7 file — chỉ sửa .ts nhẹ của P2/P3 (enhancePreview.ts 09:04:32Z; reverseCadence.ts 09:05:05Z; reverseCadence.test.ts 09:05:33Z; enhancePreview91P2.test.ts 09:06:42Z; enhancePreview62R3/60Q1.test.ts 09:07:24Z; reverseAudio.ts 09:07:33Z). Không build/test/ffmpeg.
- goals hidden_files: 34 file — T4 tự thân (gate log, ps-before, dpkg-lines-before, marker, vite-5187 log, preview json, run-webkit log, load-mid, stop-sampler, ps-after, cooldown, attempt-done) + T2 3 file .py **chỉ ghi** (hole-recheck9797.py 09:04:11Z; m56-191.py + eperm-sweep191.py 09:04:31Z — sửa file, KHÔNG chạy) + T56 12 file log đóng (09:06:12–09:06:38Z, ghi log giám sát nhẹ).
- /tmp: 512 file — 481 node-compile-cache của chính vite T4 + 31 file khác: .X193-lock của T4 (09:03:44Z) + **P4 sinh fixture 09:06:15–09:06:21Z** (harness.mjs 09:06:15Z + 29 file trong /tmp/parity191-jHksyF/: sine440/pitch/robot/tel/echo/aramp .wav/.raw, rev-src.mkv/.raw, rev-out.raw, pcm.raw).
- outside: P3 0 file trong tmp-round191-p3 (không trích frame/ffmpeg trong cửa sổ). Không có process ffmpeg/parity nào trong snapshot ps-after T4 (09:07:05Z) hay ps-close T56 (09:06:38Z). Không probe dpkg nào của luồng khác trong cửa sổ (dpkg-lines-before của T4 lúc 09:03:40Z là snapshot setup của chính attempt).

**Trường hợp biên duy nhất — P4 sinh fixture chồng 6 s (09:06:15–09:06:21Z):** chồng thật với attempt, NHƯNG NHẸ nên KHÔNG đếm là vi phạm (quy tắc cấm *script nặng*):
- load1 trong lúc sinh fixture: 1,33 → 1,23 → 1,21 → 1,11 (GIẢM; log load-mid T4, mẫu 2 s). Max load1 toàn cửa sổ là 2,91 lúc 09:05:10–09:05:14Z — TRƯỚC khi P4 làm việc, do chính vite T4.
- Fixture nhỏ, tổng 6,2 MB (rev-src.raw 2,6 MB; rev-out.raw 1,3 MB; rev-src.mkv 430 KB; còn lại là tone test tổng hợp). Harness P4 chạy cuối lúc 09:27Z (sau cửa sổ) — 09:06Z chỉ là chuẩn bị fixture.
- Attempt HỢP LỆ (20/20, tickCost 42 ms), không bị nhiễu.
- Tiền lệ: F-183-T2-7 (light violation — bắt đầu sweep NẶNG ngay sau gate xanh, 0 overlap vẫn vi phạm vì thời điểm); F-184-T2-8 (violation thật — chồng thật + attempt abort). Ở đây: chồng thật nhưng việc NHẸ + attempt không sao → T2 đếm **0 vi phạm**, ghi rõ trường hợp biên để **parent quyết** có nâng lên light violation hay không.
- **Đề xuất: chuỗi 0 vi phạm 5 → 6** (parent quyết; nếu parent nâng P4 lên light violation thì chuỗi VỀ 0).

## §9. Ghi chú phương pháp — F-191-T2-1 (lỗi epoch gõ tay, đã sửa)

- Lần sinh list mù đầu tiên dùng epoch GÕ TAY sai: B0 1795517718 (= 24/11 10:55:18Z, không phải 21/11 11:15:18Z), B1 1795596420 (= 25/11 08:47:00Z, không phải 09:27:00Z) → list sai (repo-1 3.491 / hidden_files 2.336 / tmp 69 / outside 1.237). Phát hiện nhờ kiểm chéo: list bắt đầu 24/11 11:01Z, file round162-t9/sampler.sh (mtime 21/11 11:37Z, còn trên đĩa) vắng mặt. Đã sinh lại từ chuỗi ngày qua python (B0 1795259718, B1 1795598820 — khớp F-189-T2-4).
- Lần sinh lại thứ hai quên loại trừ chrome-userdata/dist (8.176/16.273/1.332/9.149) — phương pháp đợt 189 loại các thư mục này (theo docstring hole-recheck: node_modules/dist/chrome-userdata/.git). Đã sinh lại lần ba với loại trừ đầy đủ → 4.918/9.480/1.332/9.145.
- Cả hai lỗi đều bị bắt TRƯỚC khi chạy phân tích; không verdict nào dựa trên list sai. Bài học: không bao giờ gõ tay epoch (lấy output python thẳng vào lệnh); kiểm head/tail + 1 file đã biết trước khi chạy merged.

## §10. Đề xuất cho parent (§12.3-191)

- (a) Chấp nhận (m) #113 DƯƠNG (CUỐI ở cấp T2) → n 51/52; ghi rõ rủi ro dư kết hợp 32,150 s (dưới biên 0,85 s).
- (b) INSIDE #112/#113 theo A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; B chỉ tham chiếu (#112 TRUE, #113 FALSE).
- (c) POSTBOOT_PASS #113/#114 thuộc T56-191 (#114 đã ĐẠT poll=0; #113 chưa có file lúc 09:55Z).
- (d) 0 vi phạm đợt 191 → chuỗi 5 → 6 (trừ khi parent nâng trường hợp biên P4 lên light violation → VỀ 0).
- (e) (m) #56 vẫn có điều kiện, lần 33.
- (f) Mù vẫn MỞ (R/S/U); CERT/FULL GIỮ 76/91; hole-recheck lần 34 NEW=0.
- (g) Ghi nhận F-191-T2-1 (lỗi epoch) + F-191-T2-2 (cắt exec-log ~24 h; #100 còn 1/6).

## §11. Files

- LIMITS này: docs/PHASE9_ROUND191_T2_EPERM_LIMITS.md (xem kích thước cuối báo cáo).
- Script + log: hidden_files/round191-t2/m-check191.py/.txt; blind9797-{repo-1,hidden_files,outside,tmp,fifthscope}.txt; blind191-{merged,content,sessions,witness,investigate}.log; hole-recheck191.log; m56-191.log; eperm-sweep191.log; evidence-check191.log + evidence-check191-merged.txt.
- Paths stage: ~/workspace/repo-1-push/paths-loop/phase9-round191-t2-eperm.txt (NUL-delimited, chỉ file text, đã kiểm od -c).
- Cờ: hidden_files/round191-t2.done (CÓ NỘI DUNG).
