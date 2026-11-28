# PHASE9_ROUND193_T2_EPERM_LIMITS.md — T2 đợt 193 (EPERM probe + (m)/INSIDE + mù)

Luồng nền đợt 193. Đợt 192 đã đóng, parent quyết ở §14.2-192 (aggregate docs/PHASE9_ROUND192_LIMITS.md, 99.871 B — NGUỒN ĐÚNG; §14.2-192 nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18; các lần sạch vẫn là 179, 183, 191).
Cửa sổ mù: B0 2026-11-21T11:15:18Z → B1 2026-11-25T20:50:30Z (= 380.112 s).
Boot: #115 = ebc5a3b9 (btime 14:23:56Z, parent-192 (e) XÁC NHẬN); #116 = 4dda8234 (btime 16:21:33Z, parent-192 (e) XÁC NHẬN); #117 ứng viên = 1c0bcaad (btime 20:22:37Z, T01-193 khảo sát — (m) #117 thuộc T2-194).
Viết 25/11/2026 ~21:2xZ; hạn cờ ~23:00Z, hạn cứng ~23:35Z. KHÔNG PUSH.

## §0. Tóm tắt verdicts (cấp T2 — parent quyết cuối ở §14.2-193)

- (m) #116: **DƯƠNG (CUỐI)** — requeue eid 11103, run 194 (8c0c386d), +43,986357 s, TRONG [33; 49,8]; dải thật [42,986; 43,986] (trên biên dưới 9,99 s, dưới biên trên 5,81 s); cửa (m) đúng 3 event; duy nhất 1 requeue trong [16:21:33Z, 20:35:51Z]. n ứng viên GIỮ 51/52; n chính thức GIỮ 14.
- INSIDE #113/#114 (đếm A): **KHÔNG TÍNH ĐƯỢC** (thiếu btime #106); chuỗi GIỮ 7. Đếm B (tham chiếu): **#115 TRUE** (4dda8234 vs FULL161 neo 14:23:56Z, trong dải, biên dưới +5.390 s, biên trên −2.007 s); chuỗi B 0 → 1 (lần TRUE đầu sau #113 FALSE, #114 FALSE).
- Mù: R 1.238 s MỞ (lần 26); S 3.235 s MỞ; T 627 s ĐÓNG; U file 9.316 s MỞ (không đổi); thứ ba **6.807 s** (H-U17 RỘNG từ 6.115 s — đầu mút dời 14:24:29Z → 14:36:01Z vì file live-config bị viết lại sau); **hố MỚI thứ tư 5.013 s** (18:59:35Z → 20:23:08Z 25/11, chứa btime #117; đầu mút = file live-config viết lại boot+31 s, cùng mẫu H-U17). 0 hoạt động thật mới ở mọi witness. CERT/FULL GIỮ 76/91.
- Hole-recheck lần 36: NEW=0 ở cả 27 hố cũ. H-E1-88 lần thứ 35 liên tiếp 0 mới. Hố mới H-U19 NEW=5 (kỹ thuật — 2 file self_improvement ở giây đầu mút + 3 file /var/log wtmp/btmp/lastlog ở giây boot mark, 0 hoạt động thật trong lòng hố); H-U17 (rộng 6.807 s) NEW=0 (3 float-trap).
- (m) #56 lần 35: **VẪN CÓ ĐIỀU KIỆN** (DB 5 hướng mới: 1 dòng = ticker bảo trì ĐÃ BIẾT, 4 hướng 0 dòng; file (vii) 333, max 20:15:33.130Z).
- EPERM: probe #112 ok=2 fail=0; sweep 0 sóng thật (636 file, 7 file hit, 27 lần — tất cả trích dẫn).
- Bằng chứng bị xóa: 349-list: **231/349 đã mất** (đợt 192: 161), **70 mới mất**; mtime còn nhỏ nhất 21:46:09Z 24/11; bộ chứng cứ #100 còn **1/6** (chỉ proc_34889a901a7e).
- Vi phạm đợt 193: **0 vi phạm (đề xuất)** — T4-193 chạy đủ 3 attempt, 0 hợp lệ (lượt yên #61: 0/3; chuỗi GIỮ 0 — đã đứt ở đợt 192); lock log 0 mục phi-T4 trong mọi cửa attempt; việc nặng của T2 xong trước attempt1 mở 121 s. Chi tiết §8. Parent quyết cuối.
- Run 194 SUCCEEDED (claimed→finished 106 s — ứng viên CA, T7-193 quyết); run 195 SUCCEEDED (12 s, không phải CA); run 196 RUNNING lúc đọc.

## §1. (m) #116 — DƯƠNG (CUỐI, DB tươi) + run 194/195/196 + boot #117 (thô)

### (m) #116 = DƯƠNG (CUỐI)
- Requeue duy nhất: eid **11103**, 16:22:16.986357Z, run 194 (8c0c386d-6e34-4872-a806-8b084ff8346d) = btime #116 (16:21:33Z) **+43,986357 s — TRONG [33; 49,8]**.
- Dải thật (btime nguyên giây): **[42,986; 43,986] s — TRONG cả hai biên** (trên biên dưới 9,99 s: 42,987 − 33 = 9,987 s; dưới biên trên 5,81 s: 49,8 − 43,986 = 5,814 s).
- Cửa (m) [16:22:06Z, 16:22:22.8Z] có đúng 3 event: requeue 11103 + dispatched 11104 (16:22:17.194518Z) + reattached 11105 (16:22:17.308323Z).
- Kiểm rộng: đúng **1** `requeued_after_restart` trong [16:21:33Z, 20:35:51Z] (eid 11103).
- Overlap: watcher-192 (b0aab705) END 11:35:28Z theo lịch (poll cuối 11:34:58Z), không poll nào gần #116; sampler-192 (b0aab705) dừng 10:50:05Z, TRƯỚC #115; watcher/sampler trên ebc5a3b9 bắt đầu 14:44:45Z / 14:42:08Z. Requeue là dòng DB (scheduler.events) với run_id đầy đủ + dispatched/reattached đi kèm — không phải artefact log.
- **n ứng viên GIỮ 51/52; n chính thức GIỮ 14.**

### Run 194 / 195 / 196 (số liệu cho T7-193, không phán verdict)
- Run 194 (8c0c386d, sched 1795617351 = 14:35:51Z, đợt 192): **SUCCEEDED**, finished 1795627352 = 17:35:52Z (trễ hạn 17:35:51Z 1 s, timed_out=false); started_at VIẾT LẠI 1795623737 = 16:22:17Z (btime #116 +44 s); claimed 1795627246 = 17:34:06Z; **claimed→finished = 106 s (≥60 s — ứng viên CA, T7-193 quyết)**; boot_gen `cron_boot_a080cf74…` (boot 4dda8234).
- Run 195 (e2fad6d2, sched 1795628151 = 17:35:51Z, slot đóng đợt 192): **SUCCEEDED**, finished 1795629272 = 17:54:32Z; claimed 1795629260; claimed→finished = 12 s (KHÔNG phải CA); started 1795628151 (jitter 0).
- Run 196 (32dddfa5, sched 1795638951 = 20:35:51Z, đợt 193): RUNNING lúc đọc; started = claimed = 1795638951 (jitter 0).
- Cách đếm nối tiếp theo quyết (n)-192: 82d3d1b9 = run 193, 8c0c386d = run 194, e2fad6d2 = run 195, 32dddfa5 = run 196.
- **F-193-T01-1 (nhãn run — T2 tự kiểm lại từ DB tươi, KHỚP T01-193):** brief gọi lượt cron hiện tại là "run 195" là SAI — bỏ qua lượt đóng 17:35:51Z (đúng mẫu F-192-T7-1). T2 kiểm độc lập từ DB tươi (muse.db, scheduler.job_runs, job_id vcut-build-loop, ~21:36Z 25/11): 5 run liên tiếp cách nhau đúng 10.800 s — d3d9408b-d37b-47a4-b24d-e99028b3d674 (sched 1795595751 = 08:35:51Z, FAILED, finished 1795604160); 82d3d1b9-39f7-4aa0-812b-47337488fa44 (sched 1795606551 = 11:35:51Z, SUCCEEDED, finished 1795606983); 8c0c386d-6e34-4872-a806-8b084ff8346d (sched 1795617351 = 14:35:51Z, SUCCEEDED, finished 1795627352); **e2fad6d2-827a-4209-b2df-9437c9975c32 (sched 1795628151 = 17:35:51Z, SUCCEEDED, finished 1795629272) = run 195**; **32dddfa5-12e3-4bdd-817d-81f7942adb9a (sched 1795638951 = 20:35:51Z, RUNNING, finished null) = run 196 — lượt hiện tại**. LIMITS này đã dùng run 196 cho lượt hiện tại từ đầu (theo quyết (n)-192) nên KHÔNG phải sửa số hiệu ở đâu — chỉ ghi F-193-T01-1 làm hồ sơ. Kết cục run 194 thuộc T2 (đã phân loại §1); kết cục run 196 thuộc T7-194.

### Boot #117 ứng viên (thô — phân loại thuộc T2-194)
- Boot id `1c0bcaad-1f18-43b1-90f5-fc6319e63b29`, btime **1795638157 = 20:22:37Z** (đọc trực tiếp /proc/stat + uptime -s lúc ~20:41Z). Gap #116→#117 = **14.464 s (4h01m04s)**.
- **0 event** bất kỳ trong [20:22:37Z, 20:25:00Z] (bao cửa (m) [20:23:10Z, 20:23:26.8Z]); không run nào sống tại btime (run 195 đã xong 17:54:32Z; run 196 chưa start tới 20:35:51Z). Thô: (m) #117 trông như KHÔNG CÓ ĐIỂM, nhưng phân loại thuộc T2-194 (T01-193 khảo sát boot).

## §2. INSIDE #113/#114 + #115 (đếm B)

- Đếm A (đứng): **KHÔNG TÍNH ĐƯỢC** — btime #106 vẫn chưa biết; đợt 193 không có dữ liệu mới (T01-193 chỉ khảo sát boot #117). Chuỗi GIỮ 7 (parent-192 (d): #113/#114 KHÔNG TÍNH ĐƯỢC → 7). INSIDE #107–#115 theo A đều CHỜ.
- Đếm B (chỉ tham chiếu, không phải chuỗi đứng):
  - FULL161 (n=161, mean 1h45'54", median 1h56'27", p10 1667.00 s, p90 9064.00 s) = FULL160 + gap 7.057 s (#115→#116). FULL160 khớp giá trị in của T2-192 (p10 1658.20 / p90 9064.90).
  - 4dda8234 (B-#115) vs FULL161 neo 14:23:56Z (ebc5a3b9) → **TRUE** (trong dải [14:51:43Z, 16:55:00Z]; biên dưới +5.390 s, biên trên −2.007 s); chuỗi B 0 → 1.
  - Kiểm chéo 4dda8234 vs FULL160 (neo 08:25:43Z) → FALSE (muộn 19.486 s) — dải cũ, chỉ tham chiếu.
  - INSIDE #114 theo B đã FALSE ở T2-192 (ebc5a3b9 vs FULL160, muộn 12,429 s) — nhắc lại, không tính lại.
- Khoảng cách: #114→#115 = 21.493 s (dài nhất chuỗi gần đây); **#115→#116 = 7.057 s**; #116→#117cand = 14.464 s. Tốc độ reboot: tới #116: 191 reboot / 356,05 h = 1 lần / 111,8 phút; tới #117cand: 192 / 360,07 h = 1 lần / 112,5 phút.

## §3. Mù — blind walk (B1 20:50:30Z 25/11)

### §3.1. Danh sách thô (find -newermt, loại chrome-userdata/dist/node_modules/.git)
- repo-1: **6.096** file (192: 5.451, +645). hidden_files: **9.986** (192: 9.609, +377). outside: **27.021** (192: 13.866, +13.155). /tmp: **810** (192: 685, +125). fifthscope: **22** (192: 21, +1).
- Outside +13.155: chủ yếu tmp-round192-p3 của P3 (10.924 file MỚI = P3-192 trích frame, hoạt động thật) + tmp-round193-p3 2.077 + tmp-round191-p3 9.871 (không đổi) + agents 546.
- repo-1 +645: chủ yếu hidden_files/round19x-t8 + round193-t* mới (đợt 193 đang chạy) + docs LIMITS đợt 192.
- Merged unique second-marks: **9.183** (192: 8.315, +868). find stderr: 1 dòng (Permission denied /home/hatch/.stagged-uploads, như đợt 192).
- Kiểm chéo investigate (os.walk, loại cùng 4 thư mục): repo-1 6.091 / hidden_files 9.977 / outside 27.006 / tmp 745 — lệch nhỏ (vài file bị xóa giữa 2 lần quét; tmp −65 do tmpfs churn). Merged là chuẩn.

### §3.2. Gaps file (merged)
- R [11:15:18Z → 11:38:28Z 21/11]: max **1.238 s MỞ** (lần thứ 26, không đổi). S: max **3.235 s MỞ** (không đổi). T: max **627 s ĐÓNG** (không đổi). U: max **9.316 s MỞ** (15:00:33Z → 17:35:49Z 24/11, không đổi); thứ hai 8.968 s; **thứ ba 6.807 s** (12:42:34Z → 14:36:01Z — RỘNG từ 6.115 s: đầu mút cũ 14:24:29Z là file live-config `cosmos_voice_profiles.json` viết lại lúc boot #115 +33 s, đã bị viết lại SAU ở boot #117 (mtime hiện 20:23:08Z) nên rớt khỏi list 193; đầu mút mới 14:36:01Z là tool-output JSON của agent b5624048); **MỚI thứ tư 5.013 s** (18:59:35Z → 20:23:08Z 25/11 — khoảng yên sau khi đợt 192 đóng (~17:43Z) + dispatch đợt 193 20:35:51Z; chứa btime #117; đầu mút 20:23:08Z = btime #117 +31 s đúng bằng file live-config viết lại — hoạt động file đầu tiên trên boot mới, cùng mẫu H-U17, KHÔNG phải requeue); rồi 3.530 / 3.116 / 2.976 / 2.852 s (không đổi).
- U-tail: mark cuối 20:50:29Z (1 s trước B1). R-head: mark đầu 11:35:56Z (+1.238 s).

### §3.3. Union (file + content-ts + SYS marks)
- R union-A 1.222 s MỞ; R union-B 1.211 s MỞ (dispatch 11:35:51Z DB không tính vào union chính).
- S union-A 662 s ĐÓNG; S union-B 591 s ĐÓNG. T union-A 38 s ĐÓNG.
- U union-A **9.316 s MỞ** (thứ hai 8.968 s; thứ ba 6.807 s; thứ tư 5.013 s; rồi 2.717 / 2.632 s).
- U union-B **8.372 s MỞ** (thứ hai 7.861 s; thứ ba 6.100 s — SYS EBC5 14:24:14Z chẻ hố 6.807 s; thứ tư 5.013 s KHÔNG bị chẻ; rồi 2.632 / 2.510 s).
- **CERT/FULL GIỮ 76/91.**
- SYS marks: SYSB0AA = 08:25:55Z (T01-191 trực tiếp) + SYSEBC5 = 14:24:14Z (T01-192 trực tiếp) — cả hai đã có trong union_b (xem F-193-T2-1). Chưa có SYS mark trực tiếp cho #117 (T01-193 khảo sát, chưa ghi head mark vào union).
- Content mới trong U: watcher-192 (b0aab705) 0 dòng đếm được (poll cuối 11:34:58Z, END 11:35:28Z theo lịch); sampler-192 (b0aab705) 125 dòng 08:46:01–10:50:05Z — dừng TRƯỚC #115; khoảng không sampler [10:50:05Z, 14:42:08Z] chứa #115; watcher-193 (ebc5a3b9) START 14:44:45Z; sampler trên ebc5a3b9 đầu 14:42:08Z = btime #115 +1.092 s. (Số "0 lines" ở watcher/sampler-193 trong content log là artefact đổi tên bằng sed — first/last vẫn đúng; xem F-193-T2-2.)
- Blind #94?/#95?/#96?/#88?/#77? vẫn MỞ.

### §3.4. Witness (exec-log content spans) — 0 hoạt động thật mới
- Sessions #64–#86: **5 thô → 0 thật** mỗi khoảng (192: 3 — thêm 2 file trích dẫn dài mới có mtime sau B1-192: proc_b323409819a5 = output poller T4-192, proc_dea9d8605ff5 = grep dump qua các LIMITS).
- Các khoảng cũ (#87–#114) giữ nguyên như đợt 192 (2–8 thô → 0 thật).
- **#115-B/#116-A (MỚI): 14 thô → 0 thật** (đã kiểm tay 5 file mới ở khoảng này: proc_91c3e08d6e1b = T9-192 headroom check; proc_e29aed3994be / proc_d3a1feeb4716 / proc_d77f7d2aa2d5 = T01-192 poll-wait-t4-192 — header trích btime #115 14:23:56Z + deadline 16:30:00Z nên span #116, toàn trích dẫn; proc_22896f446a89 = trích build-loop-log đợt 186 — tất cả trích dẫn).
- **#116-B/#117-A (MỚI): 9 thô → 0 thật.**
- exec-logs có mtime trong cửa sổ: 277 (witness) / 295 (sessions, chỉ U — tăng vì log mới của đợt 193 + poller T4-193). R-gap in-gap: 1 hit (11:16:22, proc_d3d4ab5f7009, trích dẫn). U-gap: 3 hit (15:15:34Z, 15:13:32Z, 17:19:50Z 24/11 — như đợt 192). QUOTE_MARKERS đã có "round193-t2" + "m-check193" để log của chính tôi không false-witness (sessions skipped_own=0; witness skipped 9 log quote-marker).

## §4. Hole-recheck lần 36 — NEW=0 ở cả 27 hố cũ

- H-R1 0, H-R1-old 0, H-S1 0, H-S2 0, H-S3 0 (1 float-trap), H-T1 0, H-U1 0, H-U2 0 (1 trap), H-U2-old 0, H-U3 0 (10 trap), H-U4 0, H-E1-88 0 (337 inside, toàn float-trap), H-U5 0, H-U6 0, H-U7 0, H-U8 0, H-U9 0 (1 trap), H-U10 0, H-U11 0 (1 trap), H-S4 0 (1 trap), H-T2 0 (1 trap), H-U12 0 (1 trap), H-U13 0 (2 trap), H-U14 0 (3 trap), H-U15 0 (1 trap), H-U16 0 (3 trap).
- **H-E1-88 lần thứ 35 liên tiếp 0 mới.** Whole-tree file có mtime trong union range: 56.922. Script đọc list đợt 192 theo đúng thiết kế — known merged marks 8.315 s. find stderr 2 dòng (vite.lock biến mất giữa chừng + Permission denied /home/hatch/.stagged-uploads).
- Hố mới **H-U17** (12:42:34Z → 14:36:01Z, 6.807 s — đã rộng): inside=3, float-trap=3, NEW=0.
- Hố mới **H-U19** (18:59:35Z → 20:23:08Z, 5.013 s): inside=5, float-trap=0, NEW=5 — NHƯNG cả 5 đều là float ở giây biên đã đếm trong merged-193 (2 file self_improvement CURRENT.md 18:59:35.001Z = giây đầu mút hố; /var/log/wtmp, btmp, lastlog 20:22:50.4xxZ = giây boot mark của #117), 0 hoạt động thật trong lòng hố — cùng mẫu H-U17 đợt 192 (NEW=6 kỹ thuật).
- H-U18 (07:50:37Z → 08:35:54Z, 2.717 s): inside=1, float-trap=1, NEW=0.
- Log: hidden_files/round193-t2/hole-recheck193.log.

## §5. (m) #56 lần 35 — VẪN CÓ ĐIỀU KIỆN

- DB (5 hướng mới cxli–cxlv, tổng 145), trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217):
  - (cxli) runtime.work_items created_at: **1 dòng** — là maintenance ticker ĐÃ BIẾT (agent e033d2dd, context_retention, phase-29920054, created 19:33:35.04086Z; cùng event với hướng (xxxx)/(xxxxi) đợt 183/181 qua runtime.requests) — KHÔNG phải hoạt động run-156, KHÔNG thu hẹp cửa sổ.
  - (cxlii) runtime.widgets created_at_ms: **0** — ÂM TÍNH. (cxliii) runtime.resources created_at: **0** — ÂM TÍNH. (cxliv) goals.actions created_at: **0** — ÂM TÍNH. (cxlv) feed.interactions created_at_ms: **0** — ÂM TÍNH.
  - Tất cả đã xác minh chưa dùng trong m56-191.py và m56-192.py (grep 0 kết quả).
- File: (vii) mtime scan ~/workspace trong D: **333 file** (như đợt 189/191/192), max mtime 20:15:33.130Z (max đã biết 20:19:34Z); (viii) exec-log trong D: **0**; (vii-b) file 20:16:00–20:17:00Z: **0**; (vii-c) file 20:19:30–20:19:40Z: **0**.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s không đổi.
- Log: hidden_files/round193-t2/m56-193.log.

## §6. EPERM — probe #112 + sweep

- Probe #112: **ok=2 fail=0**, 20:52:52Z, boot 1c0bcaad. File tạm /tmp/eperm-probe-tmp-112.txt + workspace hidden_files/eperm-probe-ws-112.txt (nội dung "probe-193"). MemAvailable 1.982.576 kB lúc probe. Log hidden_files/eperm-probe-v2.log đã thêm dòng đổi boot + dòng probe; heartbeat cập nhật (pid 84359, ts 20:52:52Z, boot 1c0bcaad-1f18-43b1-90f5-fc6319e63b29, n=112). Probe trước #111 là 14:42:30Z trên boot ebc5a3b9.
- Sweep [14:42:30Z, 20:52:52Z] 25/11: 636 file *.log, **7 file có hit, 27 lần xuất hiện — TẤT CẢ trích dẫn, 0 sóng thật**:
  - 5 file o8-*.log ("sóng EPERM đã tắt" ×3 mỗi file: o8-192t01 trong round192-t01, o8-192t8 trong round192-t8, o8-189t8 + o8-193t8 trong round193-t8, o8-184t8 archive-184).
  - `round192-t2/eperm-sweep192.log` (CẢNH BÁO ×1, Operation not permitted ×1, "sóng EPERM đã tắt" ×4) + proc_b0763174f53c.log (log T4-192 trích kết quả eperm-sweep191.log — cùng counts 1/1/4).
- Log: hidden_files/round193-t2/eperm-sweep193.log.

## §7. Bằng chứng bị xóa — theo dõi F-189-T2-2/F-192-T2-2

Exec-log bị cắt theo chu kỳ **~24 h lăn** (mô hình đã xác minh) — tốc độ cắt TĂNG:

- List merged đợt 189 (blind9797-*.txt): **349 đường dẫn exec-log, 231 đã mất (66%)** lúc kiểm ~21:19Z 25/11 (đợt 192: 161 mất, 46%). **70 mới mất kể từ đợt 192** (đợt 192: 53 mới kể từ 191). Mtime còn nhỏ nhất **21:46:09Z 24/11** (đợt 192: 17:40:56Z) — ngưỡng cắt dời ~4 h trong ~6 h, khớp mô hình cắt ~24 h lăn.
- Witness-cited (log đợt 189): 41 đường dẫn, **32 mất** (đợt 192: 17 mất; 15 mới — đều nằm trong 70 trên).
- Bộ chứng cứ #100: **còn 1/6** (không đổi so với đợt 192) — chỉ còn proc_34889a901a7e (session main agent); proc_e606d7b4f921 và proc_e0c4ed13d7cd vẫn mất.
- Hệ quả: các witness tương lai sẽ mất dần nhân chứng cũ; union-B dựa vào SYS marks trực tiếp càng quan trọng. Danh sách 70 file mới mất: hidden_files/round193-t2/evidence-check193-newmissing.txt; log kiểm: evidence-check193.log.

## §8. Vi phạm quy tắc đứng đợt 193 — T4 ĐÃ CHẠY XONG 3 ATTEMPT (bổ sung sau khi T4 đóng poller 21:26:07Z)

### T4-193: 3 attempt, 0 hợp lệ (lượt yên #61)
- Attempt1 (mở 21:14:40Z, poll #39; xong ~21:17:17Z): run-attempt exit=2, **partial** (JSON 888819B, wedged/timeout) — KHÔNG tính verdict. LỚP B ĐẠT 5/5 (load1_max 3.04, RAM_min 1510MB).
- Attempt2 (mở 21:18:02Z, poll #41; xong 21:22:04Z): 20/20 + LỚP B ĐẠT 5/5 (load1_max 1.19) NHƯNG **tickCost median=61.0ms >60** (cổng F-146-T4-1) — lượt KHÔNG hợp lệ, KHÔNG dùng verdict.
- Attempt3 (mở 21:22:04Z, poll #42; xong 21:26:07Z): 20/20 NHƯNG **LỚP B VI PHẠM** — B1 load5 cuối 2.55 (>2,5) + B2 load1_max 5.67 (>4); B3/B4/B5 ĐẠT. Lượt nhiễm tải, KHÔNG dùng verdict.
- Poller thoát 21:26:07Z: "DA HET 3 ATTEMPT/DT, khong co luot hop le". **Lượt yên #61: 0/3 attempt hợp lệ — chuỗi GIỮ 0** (đã đứt ở đợt 192). FULL PASS GIỮ 0 (lượt yên 0 hợp lệ). T4 chưa viết .done/LIMITS lúc T2 đóng cờ này (chỉ đọc poll-t4.log + classb + attempt-done, nguồn sơ cấp); T10 đối chiếu với LIMITS T4-193 khi có.

### Kiểm chồng pha (b) — 0 vi phạm (đề xuất, T2 xác minh độc lập)
- **Lock log:** 0 mục phi-T4 trong toàn bộ 3 cửa attempt [21:14:40Z, 21:26:07Z] (chỉ có t4 TICKET/ACQUIRED/RELEASED port 5187; attempt3 RELEASED 21:25:41Z, hold 217 s). Không luồng nào giữ vite lock trong lúc T4 attempt.
- **Việc nặng của T2:** tất cả xong TRƯỚC khi attempt1 mở — m-check 21:05:59Z, hole-recheck find 21:09:07Z, eperm sweep 21:10:33Z, m56 find 21:12:39Z (121 s trước CUA YEN MO 21:14:40Z). Script evidence-check (chỉ 349 stat, ~0,3 s CPU) chạy 21:18:43Z trong cửa attempt2 — I/O nhẹ, không phải việc nặng; T2 biết attempt2 mở từ cùng exec đó (poll #41 21:18:02Z) và không chạy thêm việc nặng nào sau đó.
- **Attempt3 LỚP B vi phạm — không quy được cho luồng nào:** ps-before/after của attempt3 chỉ thấy vite của chính T4 (port 5187) + sampler-autotrigger của T9 (pid 4884, daemon nền thường trực) + 1 shell monitor nhẹ (sleep 540, tail + lock status + ls t4.done) — không có process nặng của luồng khác (không ffmpeg/build/vite lạ); B4 apt/dpkg ĐẠT, B3 không reboot, B5 RAM ĐẠT. Tải cao (load1_max 5.67) là tải nền không xác định được nguồn — KHÔNG đếm là vi phạm của luồng nào (tiền lệ: vi phạm = chồng pha (b) xác định được; F-192-T56-3 chỉ chồng pha (a) đã không đếm).
- **Ghi nhận (không phải vi phạm, chờ T7-193 xác nhận):** ps-before/after của attempt1 có shell điều khiển chunk3 của T7-193 (t7-control-a193.sh + t7-gate-monitor-193.sh, pid 210504) — shell điều khiển nhẹ; LỚP B attempt1 ĐẠT 5/5 (load1_max 3.04) nên không có chồng tải nặng. T7-193 tự xác nhận thời gian chunk3 trong LIMITS của mình; T10 đối chiếu.
- **Đối chiếu LIMITS T4-193 (đã đọc, `docs/PHASE9_ROUND193_T4_WEBKIT_QUIET61_LIMITS.md`, 15.162 B, 21:36Z):** attempt1 partial exit 2, 7/20 pass, B 5/5, tickCost median 75,0 (partial n=135); attempt2 20/20, B 5/5, tickCost 61,0; attempt3 20/20, B1+B2 VI PHẠM, tickCost 69,0 — KHỚP §8. Lượt yên #61 0/3, chuỗi GIỮ 0; live-check #12 KHÔNG THỂ KIỂM, chuỗi live ĐẠT GIỮ 9; **0 VI PHẠM PHÍA T4**. T4 ghi nguồn tải attempt3: "vite build viết lại 263 file dist" nửa sau attempt3 + tsc lạ (F-193-T4-6: B2 dữ kiện thứ 5 LẪN LỘN) — không phải do T4 gây ra, không quy được cho luồng cụ thể nào (lock log sạch, ps-before/after không có process nặng của luồng khác) → giữ kết luận "không đếm là vi phạm". **Lưu ý:** LIMITS T4 ghi "Cờ round193-t4.done viết lúc đóng" nhưng file `.done` CHƯA CÓ lúc T2 kiểm lần cuối (21:38Z) — T10 kiểm lại.
- **Chuỗi 0 vi phạm: 1 → 2 (đề xuất)** — đợt 192 sạch đầu tiên sau đứt (chuỗi tính lại từ 1, tiền lệ đợt 179); đợt 193 sạch tiếp → 2. Parent quyết cuối.

## §9. Ghi chú phương pháp — F-193-T2-1 / F-193-T2-2

- **F-193-T01-1 (nhãn run — T2 tự kiểm từ DB tươi, KHỚP T01-193):** lượt cron hiện tại là run **196** (32dddfa5, sched 1795638951 = 20:35:51Z, RUNNING), không phải 195 — brief bỏ qua lượt đóng e2fad6d2 (sched 1795628151 = 17:35:51Z, SUCCEEDED 17:54:32Z) = run 195. T2 kiểm độc lập 5 run liên tiếp cách nhau đúng 10.800 s từ DB tươi (full run_id + sched + status ở §1). LIMITS này đã dùng 196 từ đầu nên không sửa số hiệu; chỉ ghi hồ sơ.
- **F-193-T2-1 (comment sai trong content193.py, union-B tính ĐÚNG):** comment do sed trong content193.py ghi rằng content.py-192 "mentioned B0AA in prose only, never added to union_b" và ghi EBC5 là "T01-193 direct". Cả hai đều SAI (kiểm trên đĩa): `blind192-content.log` union-B CÓ cả `B0AA-head 08:25:55Z (T01-191 direct)` và `EBC5-head 14:24:14Z (T01-192 direct)` — union-B tính đúng ở cả 192 và 193. Lỗi là do sed đổi 191→192, 192→193 trong nhãn attribution khi chuyển script; thời gian các mark KHÔNG đổi nên không ảnh hưởng verdict. Ghi F-193-T2-1 như vậy.
- **F-193-T2-2 (lỗi sed ở 3 script, đã sửa TRƯỚC khi chạy/phân tích):** (a) evidence-check193.py tham chiếu file không tồn tại `evidence-check192-merged.txt` (file thật là `evidence-check191-merged.txt`) và THIẾU hẳn phần kiểm 349-list — đã sửa tên file + thêm phần 349-list (tái dùng evidence-check192-349.txt). (b) eperm-sweep193.py: sed đổi W0/W1 sai thành cùng 14:42:30Z — assert `W0 < W1` (bài học F-163-T2-3) bắt được ngay, đã sửa thành [14:42:30Z, 20:52:52Z] rồi chạy. (c) m56-193.py: patch header lần đầu IndexError (marker đổi tên do sed) — đã sửa bằng prepend; kết quả file-direction không đổi. (d) blind193-content.py: số "0 lines" ở watcher/sampler-193 là artefact đổi tên bằng sed (first/last vẫn đúng) — đã ghi rõ ở §3.3, không dùng số 0 đó làm verdict. (e) Sessions U-gap lần chạy đầu gõ sai args (1795580433 thay vì 1795532433 → cửa sổ 04:20:33–06:55:49Z 25/11, tìm 2 hit trích dẫn) — đã chạy lại với args đúng (3 hit, như đợt 192); cả hai lần đều 0 hoạt động thật. (f) **Lỗ hổng loại trừ log của chính luồng T2 (không ảnh hưởng verdict đợt này):** witness193.py QUOTE_MARKERS thiếu "round191-t2", "round192-t2", "m-check191" (danh sách nhảy 190 → 192) và blind193-sessions.py MY_AGENT_DIR_* dừng ở đợt 187 (thiếu 188–193) — log poll-wait của T01-192 (a8d6b3ea) lọt vào witness spans #115 (3 file) nhưng đã kiểm tay: toàn trích dẫn. Log của chính T2-193 (3 file exec-log, mtime 20:53:36Z/21:03:38Z/21:09:07Z — đều SAU B1 20:50:30Z) nằm ngoài cửa sổ mù nên không ảnh hưởng đếm. Các đợt sau: bổ sung marker + thư mục agent của chính mình theo session id vào cả hai script.
- Epoch B0/B1 lấy từ python (không gõ tay) — đúng ngay lần đầu.
- Thư mục exec-log của chính tôi: `~/workspace/agents/1cb3060c-08a4-48d5-8b92-6f998cbec3fd/` (session id). Log của tôi trong cửa sổ không chứa marker "round193-t2"/"m-check193" trong nội dung trước B1 (lần exec đầu tiên chứa chuỗi đó chạy sau B1 20:50:30Z) — sessions skipped_own=0 là đúng, không false-witness. Các đợt sau nên loại trừ thư mục agent của chính mình theo session id.

## §10. Đề xuất cho parent (§14.2-193)

- (a) Chấp nhận (m) #116 = DƯƠNG (CUỐI) → n ứng viên GIỮ 51/52; n chính thức GIỮ 14.
- (b) INSIDE #113/#114 theo A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; B chỉ tham chiếu (#115 TRUE, chuỗi B 0 → 1).
- (c) Boot #117: 1c0bcaad, btime 20:22:37Z (T01-193 khảo sát; (m) #117 thuộc T2-194).
- (d) Vi phạm đợt 193: 0 vi phạm (đề xuất) — T4 chạy đủ 3 attempt, 0 hợp lệ (lượt yên #61: 0/3; chuỗi GIỮ 0); lock log 0 mục phi-T4 trong mọi cửa attempt; việc nặng của T2 xong trước attempt1 mở 121 s; attempt3 LỚP B vi phạm tải nền không quy được cho luồng nào. Chuỗi 0 vi phạm 1 → 2 (đề xuất).
- (e) (m) #56 vẫn có điều kiện, lần 35.
- (f) Mù vẫn MỞ (R/S/U); CERT/FULL GIỮ 76/91; hole-recheck lần 36 NEW=0 ở 27 hố cũ (H-E1-88 lần 35); hố mới H-U19 (5.013 s) + H-U17 rộng 6.807 s.
- (g) Ghi nhận F-193-T2-1 (comment sai trong content193.py, union-B đúng), F-193-T2-2 (lỗi sed ở 3 script, đã sửa trước khi phân tích), F-193-T2-3 (cắt exec-log tăng tốc: 231/349 mất, 70 mới, #100 còn 1/6).
- (h) Run 194 SUCCEEDED 106 s claimed→finished (ứng viên CA) + run 195 SUCCEEDED 12 s: chuyển T7-193 quyết (số liệu ở §1).

## §11. Files

- LIMITS này: docs/PHASE9_ROUND193_T2_EPERM_LIMITS.md (xem kích thước cuối báo cáo).
- Script + log: hidden_files/round193-t2/m-check193.py/.txt; blind193-{repo-1,hidden_files,outside,tmp,fifthscope}.txt; blind193-{merged,content,sessions,witness,investigate}.log; hole-recheck193.log; m56-193.log; eperm-sweep193.log; evidence-check193.log + evidence-check193-{349,missing,newmissing}.txt.
- Paths stage: ~/workspace/repo-1-push/paths-loop/phase9-round193-t2-eperm.txt (NUL-delimited, chỉ file text, đã kiểm od -c).
- Cờ: hidden_files/round193-t2.done (CÓ NỘI DUNG).
