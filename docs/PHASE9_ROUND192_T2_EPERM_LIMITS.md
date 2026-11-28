# PHASE9_ROUND192_T2_EPERM_LIMITS.md — T2 đợt 192 (EPERM probe + (m)/INSIDE + mù)

Luồng nền đợt 192. Đợt 191 đã đóng, parent quyết ở §14.2-191 (aggregate docs/PHASE9_ROUND191_LIMITS.md, 81.567 B — NGUỒN ĐÚNG).
Cửa sổ mù: B0 2026-11-21T11:15:18Z → B1 2026-11-25T14:46:17Z (= 358.259 s).
Boot: #114 = b0aab705 (btime 08:25:43Z); #115 = ebc5a3b9 (btime 14:23:56Z, ứng viên — T01-192 xác nhận).
Viết 25/11/2026 ~15:1xZ; hạn cờ ~17:00Z, hạn cứng ~17:35Z. KHÔNG PUSH.
CAVEAT SỐ HIỆU (F-191-T7-2, parent quyết ở (e)-192): boot_gen gợi ý có thể có 1 boot chưa xác minh giữa 05:01:25Z và 05:35:51Z. Nếu T0-192 xác nhận boot phụ thì số hiệu dịch +1 (b0aab705 → #115, ebc5a3b9 → #116). Tài liệu này dùng số hiệu ĐÃ XÁC NHẬN (ebc5a3b9 = #115).

## §0. Tóm tắt verdicts (cấp T2 — parent quyết cuối ở §14.2-192)

- (m) #114: **XÁC MINH = KHÔNG CÓ ĐIỂM** (0 requeue trong cửa rộng [08:25:43Z, 14:42:56Z], khớp quyết (f)-191).
- (m) #115: **KHÔNG CÓ ĐIỂM** (cửa hẹp [14:23:56Z, 14:42:56Z] ĐÓNG: 2 event, 0 requeue; cửa (m) 0 event bất kỳ; 0 run spanning; overlap ZERO). n ứng viên GIỮ 51/52; n chính thức GIỮ 14.
- INSIDE #113/#114 (đếm A): **KHÔNG TÍNH ĐƯỢC** (thiếu btime #106); chuỗi GIỮ 7. Đếm B (tham chiếu): #114 FALSE (muộn 12,429 s vs FULL160); chuỗi B GIỮ 0.
- Mù: R 1.238 s MỞ (lần 25); S 3.235 s MỞ; T 627 s ĐÓNG; U file 9.316 s MỞ (không đổi) + **hố MỚI thứ ba 6.115 s** (12:42:34Z → 14:24:29Z 25/11, chứa btime #115; đầu mút = file live-config viết lại boot+33 s, KHÔNG phải requeue). 0 hoạt động thật mới ở mọi witness. CERT/FULL GIỮ 76/91.
- Hole-recheck lần 35: NEW=0 ở cả 27 hố cũ. H-E1-88 lần thứ 34 liên tiếp 0 mới. Hố mới H-U17 NEW=6 (kỹ thuật — cả 6 đều là float ở giây biên đã đếm trong merged-192, 0 hoạt động thật trong lòng hố); H-U18 NEW=0.
- (m) #56 lần 34: **VẪN CÓ ĐIỀU KIỆN** (DB 5 hướng mới đều 0 dòng; file (vii) 333, max 20:15:33.130Z).
- EPERM: probe #111 ok=2 fail=0; sweep 0 sóng thật (458 file, 4 file hit, 20 lần — tất cả trích dẫn).
- Bằng chứng bị xóa (F-192-T2-3): exec-log cắt ~24 h lăn tiếp tục — 349-list: **161/349 đã mất** (đợt 191: 108), **53 mới mất**; mtime còn nhỏ nhất 17:40:56Z 24/11; bộ chứng cứ #100 còn **1/6** (chỉ proc_34889a901a7e).
- Vi phạm đợt 192: **CHỜ T4-192 attempt** (lúc viết nháp: T4 vẫn polling, poll #38 15:13:06Z, chưa attempt; hạn poller 16:30Z). Trường hợp biên đã xác minh: F-192-T56-3 (harness T56 chồng pha (a) ~59 s khi gate lật xanh giữa chunk 4; 0 pha (b); 0 cửa yên mở; 0 t4-round192 trong lock log) — KHÔNG phải vi phạm theo tiền lệ F-191-T10-2 (vi phạm = chồng pha (b)). Parent quyết cuối sau khi T4 đóng cờ.
- Run 192 FAILED (claimed→finished 103 s — ứng viên CA, T7-192 quyết); run 82d3d1b9 SUCCEEDED (5 s, không phải CA); run 193 RUNNING lúc đọc.

## §1. (m) #114 — XÁC MINH (DB tươi) + (m) #115

### (m) #114 = KHÔNG CÓ ĐIỂM (xác minh độc lập, khớp quyết (f)-191)
- 0 event `requeued_after_restart` trong cửa rộng [08:25:43Z, 14:42:56Z] (đóng bởi btime #115), gồm cửa (m) [08:26:16Z, 08:26:32.8Z]: 0 requeue.
- Khớp quyết (f)-191.

### (m) #115 = KHÔNG CÓ ĐIỂM
- Cửa hẹp [14:23:56Z, 14:42:56Z] ĐÓNG: chỉ 2 event (reconciled 14:35:51.143517Z + dispatched run 193 14:35:51.287130Z), 0 requeue.
- Cửa (m) [14:24:29Z, 14:24:45.8Z]: 0 event bất kỳ.
- Event cuối trước btime: heartbeat succeeded 14:15:34Z (8m22s trước btime).
- 0 run spanning btime (run 192 FAILED 10:56:00Z; 82d3d1b9 SUCCEEDED 11:43:03Z; run 193 started 14:35:51Z = btime +715 s).
- Overlap ZERO: watcher-191 END 11:35:28Z, watcher-192 chưa spawn lúc btime, sampler-191 dừng ~10:50Z, sampler-192 bắt đầu ~14:41Z — không sampler/watcher nào chạy tại btime, không thể có artefact log +2 s.
- **n ứng viên GIỮ 51/52; n chính thức GIỮ 14.**

### Run 192 / 82d3d1b9 / 193 (số liệu cho T7-192, không phán verdict)
- Run 192 (d3d9408b, sched 1795595751 = 08:35:51Z): **FAILED**, finished 1795604160 = 10:56:00Z (failed event 10:56:00.064708Z); started 1795595751 (jitter 0); claimed 1795604057 = 10:54:17Z; **claimed→finished = 103 s (≥60 s — ứng viên CA, T7-192 quyết)**; boot_gen `cron_boot_cdd48e77…`; margin tới hạn 11:35:51Z +2.391 s (xong TRƯỚC hạn — failed, không phải timeout).
- Run 82d3d1b9 (sched 1795606551 = 11:35:51Z, slot 18:35:51 +07 đóng đợt 191): **SUCCEEDED**, finished 1795606983 = 11:43:03Z; claimed 1795606978; claimed→finished = 5 s (KHÔNG phải CA); boot_gen `cron_boot_cdd48e77…` (cùng run 192 — cùng boot #114). Theo cách đếm (a), run này KHÔNG có số hiệu đợt (slot đóng sổ, không phải run mở đợt).
- Run 193 (8c0c386d, sched 1795617351 = 14:35:51Z, đợt 192): RUNNING lúc đọc; started 1795617351 (jitter 0); boot_gen MỚI `cron_boot_30d363b8…`; claimed 1795617351.
- Boot_gen ĐỔI theo boot (cdd48e77 → 30d363b8) — bằng chứng phụ cho caveat F-191-T7-2 (xem đầu file).

## §2. INSIDE #113/#114

- Đếm A (đứng): **KHÔNG TÍNH ĐƯỢC** — btime #106 vẫn chưa biết; đợt 192 không có dữ liệu mới (T01-192 chỉ xác minh boot #115). Chuỗi GIỮ 7 (parent-186 (d): #105 TRUE FULL151 → 7). INSIDE #107–#114 theo A đều CHỜ.
- Đếm B (chỉ tham chiếu, không phải chuỗi đứng):
  - FULL159 (n=159, mean 1h44'15", median 1h55'54", p10 1649.40 s, p90 8900.00 s) — khớp giá trị in của T2-191.
  - FULL160 (n=160, mean 1h45'50", median 1h56'10", p10 1658.20 s, p90 9064.90 s) — ebc5a3b9 (B-#114) vs dải neo 08:25:43Z → **FALSE** (muộn 12,429 s sau cuối dải; exact 12.428,1 s); chuỗi B GIỮ 0 (sau #113 FALSE).
  - Kiểm chéo ebc5a3b9 vs FULL159 → FALSE (muộn 26,352 s).
  - T2-191 (b0aab705 vs FULL159, muộn 4,859 s) — nhắc lại, không tính lại.
- Khoảng cách: #113→#114 = 13.759 s; **#114→#115 = 21.493 s (5h58m13s) — dài nhất chuỗi gần đây** (vượt 13.759 s). Tốc độ reboot: tới #115: 190 reboot / 354,09 h = 1 lần / 111,8 phút.
- Boot #115 (số ứng viên, T01-192 xác nhận): ebc5a3b9-230f-4ea5-926f-c3a62c96fbf5, btime 1795616636 = 14:23:56Z. Khảo sát T01-192 14:40:57Z: /proc/stat btime 1795616636 + uptime -s 14:23:56; /proc/1 14:24:13.88Z (+17,88 s); journal đầu 14:24:14Z (+18 s); wtmp bắt đầu 14:24:14Z; who -b 14:24. Mẫu +18 s khác mẫu +12 s của #111–#114, nhưng nhất quán qua nhiều nguồn (boot chậm tới PID 1/journal, không phải lỗi đồng hồ). Cloudflare: local CHẬM ~1 s (mid 1795617658 vs CF 1795617659 — cùng dấu các đợt trước, không nhanh).

## §3. Mù — blind walk (B1 14:46:17Z 25/11)

### §3.1. Danh sách thô (find -newermt, loại chrome-userdata/dist/node_modules/.git)
- repo-1: **5.451** file (191: 4.918, +533). hidden_files: **9.609** (191: 9.480, +129). outside: **13.866** (191: 9.145, +4.721). /tmp: **685** (191: 1.332, −647 — tmpfs bị xóa bởi reboot #115, chỉ còn file sau 14:23:56Z). fifthscope: **21** (191: 19, +2).
- Outside +4.721: chủ yếu tmp-round191-p3 của P3 (9.871 file, 191: 5.279, +4.592 — P3 trích frame cho reverse preview, hoạt động thật trong cửa sổ) + agents 506 + repo-1-push-snap 683.
- repo-1 +533: chủ yếu hidden_files/round19x-t8 (192-t8: 474, 191-t8: 471, 189-t8: 446, 188-t8: 417, 187-t8: 347 — smoke/o8 logs).
- Merged unique second-marks: **8.315** (191: 8.068, +247). find stderr: 1 dòng (Permission denied /home/hatch/.stagged-uploads, như đợt 191).
- Kiểm chéo investigate (os.walk, loại cùng 4 thư mục): repo-1 5.460 / hidden_files 9.614 / outside 13.867 / tmp 687 — lệch nhỏ (vài file bị xóa giữa 2 lần quét; find 5.451 do vite.lock biến mất giữa chừng). Merged là chuẩn.

### §3.2. Gaps file (merged)
- R [11:15:18Z → 11:38:28Z 21/11]: max **1.238 s MỞ** (lần thứ 25, không đổi). S: max **3.235 s MỞ** (không đổi). T: max **627 s ĐÓNG** (không đổi). U: max **9.316 s MỞ** (15:00:33Z → 17:35:49Z 24/11, không đổi); thứ hai 8.968 s; **MỚI thứ ba 6.115 s** (12:42:34Z → 14:24:29Z 25/11 — khoảng yên sau khi đợt 191 đóng + reboot #115; đầu mút 14:24:29Z = btime #115 +33 s đúng bằng file live-config `cosmos_voice_profiles.json` viết lại lúc boot+33 s — hoạt động file đầu tiên trên boot mới, KHÔNG phải requeue); rồi **2.717 s** (07:50:37Z → 08:35:54Z — MỚI do các mark biên dời về sau: GAP 08:04:46Z + live-config/subscriptions/system_prompt/.pki 08:35:35–43Z bị viết lại ở boot #115; 0 hoạt động mới trong hố), 3.530 / 3.116 / 2.976 / 2.852 s (không đổi).
- U-tail: mark cuối 14:46:13Z (4 s trước B1). R-head: mark đầu 11:35:56Z (+1.238 s).

### §3.3. Union (file + content-ts + SYS marks)
- R union-A 1.222 s MỞ; R union-B 1.211 s MỞ (dispatch 11:35:51Z DB không tính vào union chính).
- S union-A 662 s ĐÓNG; S union-B 591 s ĐÓNG. T union-A 38 s ĐÓNG.
- U union-A **9.316 s MỞ** (thứ hai 8.968 s; thứ ba 6.115 s; rồi 2.717 / 2.632 / 2.504 s).
- U union-B **8.372 s MỞ** (thứ hai 7.861 s; thứ ba 6.100 s — SYS EBC5 14:24:14Z chẻ hố 6.115 s; rồi 2.632 / 2.504 / 2.406 s).
- Hố 2.400 s → 2.504 s do mark AGENTS.md 06:01:50Z dời sang 11:48:07Z (AGENTS.md bị sửa lúc đóng đợt 191); hố 2.032 s vẫn còn nhưng rớt khỏi top-6. **CERT/FULL GIỮ 76/91.**
- SYS marks mới: **SYSB0AA = 08:25:55Z** (T01-191 trực tiếp) + **SYSEBC5 = 14:24:14Z** (T01-192 trực tiếp). **F-192-T2-1:** content.py-191 chỉ nhắc SYSB0AA trong prose, KHÔNG đưa vào union_b — tôi đã đưa vào ở đợt 192; không đổi verdict đợt 191 (hố U max 9.316 s ở chỗ khác).
- Content mới trong U: watcher-189 221 poll (27e6714f, cuối 04:36:20Z = btime #113 −4 s, ZERO overlap); sampler-189 114 dòng 27e6714f (cuối 04:36:26Z = btime #113 +2 s — artefact sampler, cùng mẫu #111) + 14 dòng f7632121 (04:38:13–04:51:14Z); watcher-191 338 poll (b0aab705, END 11:35:28Z theo lịch); sampler-191 125 dòng (08:46:01–10:50:05Z — dừng TRƯỚC #115; khoảng không sampler [10:50:05Z, 14:42:08Z] chứa #115); watcher-192 1 poll (ebc5a3b9, 14:44:45Z, tính tới U1); sampler-192 5 dòng tới U1 (đầu 14:42:08Z = btime #115 +1.092 s).
- Blind #94?/#95?/#96?/#88?/#77? vẫn MỞ.

### §3.4. Witness (exec-log content spans) — 0 hoạt động thật mới
- Sessions #64–#86: **3 thô → 0 thật** mỗi khoảng (cùng 3 file trích dẫn dài như đợt 191).
- Các khoảng cũ (#87–#111) giữ nguyên như đợt 191 (2–8 thô → 0 thật).
- #112-B/#113-A: **8 thô** (191: 7 — thêm proc_05caaff611b6, mtime 14:40:43Z); #113-B/#114-A: **7 thô** (191: 6 — cùng file thêm); **#114-B/#115-A (MỚI): 7 thô → 0 thật** (đã kiểm tay: 0 dòng nào trong 14:20–14:29Z ở cả 7 file; tất cả trích dẫn dài).
- exec-logs có mtime trong cửa sổ: 272 (witness) / 272 (sessions, chỉ U). U-tail [14:27:10Z..14:46:17Z]: repo-1=477 / hidden_files=64 / outside=31 / tmp=685 / fifthscope=0. QUOTE_MARKERS đã thêm "round192-t2" + "m-check192" để log của chính tôi không false-witness.

## §4. Hole-recheck lần 35 — NEW=0 ở cả 27 hố cũ

- H-R1 0, H-R1-old 0, H-S1 0, H-S2 0, H-S3 0 (1 float-trap), H-T1 0, H-U1 0, H-U2 0 (1 trap), H-U2-old 0, H-U3 0 (10 trap), H-U4 0, H-E1-88 0 (337 inside, toàn float-trap), H-U5 0, H-U6 0, H-U7 0, H-U8 0, H-U9 0 (1 trap), H-U10 0, H-U11 0 (1 trap), H-S4 0 (1 trap), H-T2 0 (1 trap), H-U12 0 (1 trap), H-U13 0 (2 trap), H-U14 0 (3 trap), H-U15 0 (1 trap), H-U16 0 (3 hits, 0 mới).
- **H-E1-88 lần thứ 34 liên tiếp 0 mới.** Whole-tree file có mtime trong union range: 42.413. Script đọc list đợt 191 (W=round191-t2) theo đúng thiết kế — known merged marks 8.066 s.
- Hố mới **H-U17** (12:42:34Z → 14:24:29Z, 6.115 s): inside=6, float-trap=0, NEW=6 — NHƯNG cả 6 đều là float ở giây biên đã đếm trong merged-192 (3 file session agent 12:42:34.7xxZ = giây đầu mút hố; /var/log/wtmp, btmp, lastlog 14:24:14.7xxZ = giây SYS EBC5), 0 hoạt động thật trong lòng hố. **H-U18** (07:50:37Z → 08:35:54Z, 2.717 s): inside=1, float-trap=1, NEW=0.
- Log: hidden_files/round192-t2/hole-recheck192.log (ghi holerecheck-all.txt vào round191-t2 theo quy ước đứng).

## §5. (m) #56 lần 34 — VẪN CÓ ĐIỀU KIỆN

- DB (5 hướng mới cxxxvi–cxl, tổng 140), đều **0 dòng** trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217): (cxxxvi) runtime.summaries created_at_ms; (cxxxvii) feed.units created_at_ms; (cxxxviii) ideas.ideas created_at; (cxxxix) media.items uploaded_at; (cxl) runtime.browser_tasks created_at. Tất cả đã xác minh chưa dùng trong m56-191.py (grep 0 kết quả).
- File: (vii) mtime scan ~/workspace trong D: **333 file** (như đợt 189/191), max mtime 20:15:33.130Z (max đã biết 20:19:34Z); (viii) exec-log trong D: **0**; (vii-b) file 20:16:00–20:17:00Z: **0**; (vii-c) file 20:19:30–20:19:40Z: **0**.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s không đổi.
- Log: hidden_files/round192-t2/m56-192.log.

## §6. EPERM — probe #111 + sweep

- Probe #111: **ok=2 fail=0**, 14:42:30Z, boot ebc5a3b9. File tạm /tmp/eperm-probe-tmp-111.txt + workspace hidden_files/eperm-probe-ws-111.txt (nội dung "probe-192"). MemAvailable 4.342.632 kB lúc probe. Log hidden_files/eperm-probe-v2.log đã thêm dòng đổi boot + dòng probe; heartbeat cập nhật (pid 6516 = shell T2, n=111). Probe trước #110 là 08:56:05Z trên boot b0aab705.
- Sweep [08:56:05Z, 14:42:30Z] 25/11: 458 file *.log, **4 file có hit, 20 lần xuất hiện — TẤT CẢ trích dẫn, 0 sóng thật**:
  - `round191-t2/eperm-sweep191.log` (CẢNH BÁO ×2, Operation not permitted ×2, "sóng EPERM đã tắt" ×7).
  - 3 file o8-*.log ("sóng EPERM đã tắt" ×3 mỗi file: o8-191t8, o8-189t8 trong round192-t8, o8-184t8 archive-184).
- Log: hidden_files/round192-t2/eperm-sweep192.log.

## §7. Bằng chứng bị xóa — F-192-T2-3 (theo dõi F-189-T2-2/F-191-T2-2)

Exec-log bị cắt theo chu kỳ **~24 h lăn** (mô hình đã xác minh):

- List merged đợt 189 (blind9797-*.txt): **349 đường dẫn exec-log, 161 đã mất (46%)** lúc kiểm ~15:11Z 25/11 (đợt 191: 108 mất, 31%). **53 mới mất kể từ đợt 191.** Mtime còn nhỏ nhất **17:40:56Z 24/11** (đợt 191: 09:51:07Z) — ngưỡng cắt dời ~8 h trong ~1 ngày, khớp mô hình cắt ~24 h lăn.
- Witness-cited (log đợt 189): 41 đường dẫn, **17 mất** (đợt 191: 8 mất; 9 mới — đều nằm trong 53 trên).
- Bộ chứng cứ #100: **còn 1/6** (không đổi so với đợt 191) — chỉ còn proc_34889a901a7e (session main agent); proc_e606d7b4f921 và proc_e0c4ed13d7cd vẫn mất.
- Hệ quả: các witness tương lai sẽ mất dần nhân chứng cũ; union-B dựa vào SYS marks trực tiếp càng quan trọng. Danh sách 53 file mới mất: hidden_files/round192-t2/evidence-check192-newmissing.txt; log kiểm: evidence-check192.log.

## §8. Vi phạm quy tắc đứng đợt 192 — [CHỜ T4-192 attempt — sẽ bổ sung sau khi T4 đóng cờ]

Tình hình lúc viết nháp (~15:13Z): T4-192 vẫn polling (poll #38 15:13:06Z, gate0=T4-check-only, lock=khong), **chưa có attempt nào**; poller hạn 16:30Z. Cửa sổ attempt #60 (poll #41 15:15:22Z: "CUA YEN MO ... CHAY attempt1 NGAY") vừa mở — T2 KHÔNG chạy việc nặng trong lúc attempt (chỉ ghi file LIMITS này, I/O nhẹ).

Trường hợp biên đã xác minh độc lập (không chờ T4):
- **F-192-T56-3 — harness T56 chồng pha (a) ~59 s, KHÔNG phải vi phạm:** harness T56 14:50:43–14:58:05Z; gate lật xanh giữa chunk 4 (poll #17 T4, 14:57:06Z: gate0 khong-dat → T4-check-only, postboot_exit 1 → 0); chunk 4 chạy tiếp ~59 s sau khi gate xanh (14:57:06Z → 14:58:05Z). **0 chồng pha (b)** (0 cửa yên mở trong lúc harness chạy; 0 t4-round192 trong vite-lock-v2.log — T4 chưa acquire lock lần nào tới lúc T56 đóng 15:06:37Z). T56 kiểm gate 8 lần trước/sau 4 chunk (bài học F-191-T10-2 đã áp dụng — kiểm lại gate trong script dài). Tiền lệ: F-191-T10-2 (vi phạm LIGHT = chồng pha (b) ~2m35s); F-184-T2-8 (violation thật = chồng thật + attempt abort). Ở đây: chỉ chồng pha (a), 0 pha (b), attempt chưa tồn tại → T2 đếm **0 vi phạm cho trường hợp này**, ghi rõ để parent quyết.
- T01 O8 giữ lock port 5560 14:57:20–15:01:09Z (229 s) trong lúc gate xanh — T4 chỉ polling, không có cửa sổ attempt → không vi phạm.
- P4: không tái diễn sinh fixture trong cửa sổ attempt đợt này (sẽ xác minh lại sau khi T4 đóng cờ).
- Chuỗi 0 vi phạm hiện 0 (ĐỨT ở đợt 191); nếu đợt này 0 vi phạm thì chuỗi tính lại từ 1 (tiền lệ đợt 179: đợt sạch đầu tiên sau khi đứt thì chuỗi tính lại từ 1).

## §9. Ghi chú phương pháp — F-192-T2-1 / F-192-T2-2

- **F-192-T2-1 (SYSB0AA thiếu trong union_b đợt 191):** content.py-191 chỉ nhắc SYSB0AA (08:25:55Z) trong prose, không đưa vào union_b. Đã đưa vào ở đợt 192 (cùng SYSEBC5 = 14:24:14Z). Không đổi verdict đợt 191 (hố U max 9.316 s ở chỗ khác).
- **F-192-T2-2 (lần sinh list mù đầu tiên thiếu loại trừ):** blind192-gen.py lần đầu chỉ loại chrome-userdata/dist/node_modules/.git ở scope repo-1, QUÊN ở hidden_files/outside/tmp → list sai (hidden_files 16.410, outside 13.879, tmp 690). Phát hiện nhờ investigate (os.walk, có loại trừ) cho hidden_files 9.614 — lệch 6.796. Nguyên nhân đã xác minh: ~6.793 file dưới `*/o8-chromium/*` và `*/chrome-userdata/*` (mỗi round dir ~187 file) mà find không loại. Đã sửa gen (loại trừ cả 4 scope, B1 giữ nguyên 14:46:17Z) và sinh lại → 5.451/9.609/13.866/685, khớp investigate trong vài file (do xóa giữa 2 lần quét). **Không verdict nào dựa trên list sai:** đã chạy lại merged/content/sessions với list đúng — mọi gap KHÔNG ĐỔI so với bản chưa loại trừ (R 1.238, S 3.235, T 627, U 9.316/8.372; hố mới 6.115/2.717 giữ nguyên); chỉ số đếm đổi (merged marks 8.913 → 8.315). Bài học: loại trừ phải áp dụng đồng nhất mọi scope (như lỗi lần sinh lại thứ hai đợt 191); kiểm chéo investigate NGAY sau lần sinh đầu, trước khi chạy merged.
- Epoch B0/B1 lần này lấy từ python (không gõ tay) — đúng ngay lần đầu (F-191-T2-1 đã tránh được).

## §10. Đề xuất cho parent (§14.2-192)

- (a) Chấp nhận (m) #114 = KHÔNG CÓ ĐIỂM (xác minh độc lập, khớp (f)-191) và (m) #115 = KHÔNG CÓ ĐIỂM → n ứng viên GIỮ 51/52; n chính thức GIỮ 14.
- (b) INSIDE #113/#114 theo A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; B chỉ tham chiếu (#114 FALSE, chuỗi B GIỮ 0).
- (c) Boot #115: ebc5a3b9, btime 14:23:56Z (T01-192 xác nhận, mẫu +18 s). **Caveat F-191-T7-2:** parent quyết ở (e)-192 xem có boot phụ giữa 05:01:25Z và 05:35:51Z không (boot_gen đổi theo boot là bằng chứng phụ); nếu có thì số hiệu dịch +1.
- (d) Vi phạm đợt 192: chờ T4 đóng cờ (bổ sung §8); trường hợp biên F-192-T56-3 đề xuất KHÔNG đếm là vi phạm (chỉ pha (a), 0 pha (b)).
- (e) (m) #56 vẫn có điều kiện, lần 34.
- (f) Mù vẫn MỞ (R/S/U); CERT/FULL GIỮ 76/91; hole-recheck lần 35 NEW=0 (H-E1-88 lần 34).
- (g) Ghi nhận F-192-T2-1 (SYSB0AA), F-192-T2-2 (thiếu loại trừ, đã sửa trước khi phân tích), F-192-T2-3 (cắt exec-log: 161/349 mất, #100 còn 1/6).
- (h) Run 192 FAILED 103 s claimed→finished (ứng viên CA) + run 82d3d1b9 SUCCEEDED 5 s: chuyển T7-192 quyết (số liệu ở §1).

## §11. Files

- LIMITS này: docs/PHASE9_ROUND192_T2_EPERM_LIMITS.md (xem kích thước cuối báo cáo).
- Script + log: hidden_files/round192-t2/m-check192.py/.txt; blind192-{repo-1,hidden_files,outside,tmp,fifthscope}.txt (+ bản -FIND/-OSWALK/-NOPRUNE lưu vết F-192-T2-2); blind192-{merged,content,sessions,witness,investigate}.log; hole-recheck192.log; m56-192.log; eperm-sweep192.log; evidence-check192.log + evidence-check192-{349,missing,newmissing}.txt; t4-watch192.sh/.out.
- Paths stage: ~/workspace/repo-1-push/paths-loop/phase9-round192-t2-eperm.txt (NUL-delimited, chỉ file text, đã kiểm od -c).
- Cờ: hidden_files/round192-t2.done (CÓ NỘI DUNG).
