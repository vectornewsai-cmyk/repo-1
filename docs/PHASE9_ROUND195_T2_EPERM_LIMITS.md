# PHASE9 ROUND195 T2 — EPERM + (m)/INSIDE + mù + sổ vi phạm

- Đợt: 195 (đợt thứ 5 theo hướng mới 25/11 — Editing Core, preview/render parity)
- Luồng: T2 (nền: EPERM probe + phân loại (m)/INSIDE + mù/hole-recheck + sổ vi phạm)
- Thời gian làm: 26/11/2026 ~08:41–09:35Z; B1 mù = 09:02:32Z; cờ hạn ~11:00Z, hạn cứng 11:35:51Z
- Nguồn gốc §14.2-194: **CHƯA NGÃ NGŨ** (không phải "sạch"; tổng điền sẵn GIỮ 18; các đợt sạch vẫn là 179, 183, 191). Mọi số trong tài liệu này đều do T2-195 tự đọc/đếm mới trong đợt này; không dùng DB `result_summary` làm nguồn narrative (F-193-T7-2/F-194-T7-3).
- Boot làm việc: #121 (8c4aa907, btime 08:22:05Z). Marker sống qua 73 boot #49–#121cand.

## §0. Tóm tắt verdict

- **(m) #119 = KHÔNG CÓ ĐIỂM (CUỐI)** — 0 sự kiện trong [02:28:08Z, 02:30:31Z]; 0 requeue trong [02:28:08Z, 02:35:51Z]. n ứng viên GIỮ 53/54.
- **(m) #120 = DƯƠNG (CUỐI)** — requeue eid 11258, run 198, btime +47,008176 s, TRONG [33; 49,8]. n ứng viên → **54/55**. n chính thức GIỮ 14.
- INSIDE đếm B: B-#117 TRUE (kiểm lại); B-#118 FALSE (trễ 5.598 s) → chuỗi B liên tiếp 1 → 0 (ĐỨT); B-#119 TRUE (trong band, biên dưới +5.244 s) → chuỗi B 0 → 1 (khởi động lại); B-#120 FALSE (trễ 4.270 s, tham chiếu cho T2-196). Đếm A: KHÔNG TÍNH ĐƯỢC (thiếu btime #106), chuỗi GIỮ 7.
- EPERM probe #114: ok=2 fail=0. Sweep #114: 351 log, 7 file, 33 lần — **0 sóng thật** (toàn "đã tắt" + tự trích).
- Mù: R/S/T không đổi (R 1.238 s MỞ / S 3.235 s MỞ / T 627 s ĐÓNG; union-B U max 8.372 s MỞ). **Hố mới H-U21 = 6.336 s** (06:50:00Z–08:35:36Z 26/11, bắc qua btime #121): hole-recheck NEW=7, toàn kỹ thuật, **0 hoạt động thật**. Các hố cũ NEW=0 (H-E1-88 lần thứ 37 liên tiếp 0 mới).
- (m) #56: 155 hướng (150 + 5 mới cli–clv, toàn 0 dòng) — lần 37, **VẪN CÓ ĐIỀU KIỆN**.
- Bằng chứng xóa: 41-list 0/41, 349-list 0/349, #100 0/6 — không mất mới trong 2 danh sách cố định; nhưng purge vẫn tiếp tục ăn log mới hơn (proc_ad2556eb9f46 đã mất giữa 194→195).
- Vi phạm: **F-195-T2-8 VI PHẠM NHẸ** (P3 chrome chồng attempt1 T4-195, 0 bằng chứng ảnh hưởng) + **F-195-T2-9 VI PHẠM NHẸ** (T56 chunk2 chồng ~11 s đầu attempt1, monitor kill kịp, 0 bằng chứng ảnh hưởng — T4-195 giao T2 phán, F-195-T4-7). Chuỗi 0 vi phạm GIỮ 0 — đã 0 từ F-194-T2-9. F-194-P3-1 KHÉP: là thành phần của F-194-T2-9, đã tính 1 lần, KHÔNG tính riêng.
- Lượt yên #63: **HỢP LỆ** (attempt3 T4-195 valid, median 53,0 ms) → chuỗi 0 → 1 (khởi động lại; T4-195 LIMITS xác nhận). Live-check #14: ĐỀ XUẤT ĐẠT → chuỗi 9 → 10 (chờ T9-195 LIMITS xác nhận). **POSTBOOT_PASS #120 KHÔNG CÓ** — T56-195 chưa viết (chỉ có #119-muộn + #121).

## §1. Phân loại (m) CUỐI — #119, #120 + runs + boot #121

Đọc DB tươi bằng `muse.db` ~08:45Z 26/11 (không dùng result_summary). Epochs từ `datetime.fromtimestamp`, không gõ tay (F-194-T2-6, F-195-T2-4).

### (m) #119 — KHÔNG CÓ ĐIỂM (CUỐI)

- Boot 55c9e0b7, btime 02:28:08Z (1795660088); gap #118→#119 = 14.773 s (T01-194 khảo 9 nguồn).
- 0 sự kiện mọi loại trong [02:28:08Z, 02:30:31Z] (cửa (m) 143 s).
- 0 `requeued_after_restart` trong [02:28:08Z, 02:35:51Z].
- 5 sự kiện duy nhất trong cửa sổ là burst khôi phục daemon 02:35:41Z (reconciled eid 11227 + dispatched 11228/11229 + succeeded 11230/11231 — job khác, không phải run bị kẹt).
- Không có run nào sống tại btime (run 197 xong 00:10:21Z; run 198 dispatch 02:35:51Z, eid 11233).
- n ứng viên: không đổi, **53/54 GIỮ**.

### (m) #120 — DƯƠNG (CUỐI)

- Boot ac8a88aa, btime 04:23:25Z (1795667005); gap #119→#120 = 6.917 s.
- Requeue **eid 11258, run 198 (8256daf7-8775-4446-8b4a-d2061245ba6b), 04:24:12.008176Z = btime +47,008176 s, TRONG [33; 49,8]**.
- Khoảng thật [46,008; 47,008] s: trên biên dưới 13,008 s; dưới biên trên 2,792 s.
- Cửa (m) [04:23:58Z, 04:24:14.8Z]: đúng 3 sự kiện (requeue 11258 + dispatched 11259 04:24:12.103657Z + reattached 11260 04:24:12.215840Z, "execute turn already complete (model-output evidence)").
- Kiểm rộng: đúng **MỘT** `requeued_after_restart` trong [04:23:25Z, 05:35:51Z] (eid 11258); đúng 3 sự kiện tổng trong [04:23:25Z, 04:25:48Z].
- Run 198 SPANNED btime #120 (dispatch 02:35:51Z, còn sống lúc boot) — requeue đã khôi phục nó. Chi tiết "daemon startup recovery", cùng lớp với #116/#118.
- n ứng viên: **+1/+1 → 54/55** (quy tắc đứng, 7 tiền lệ 184–191; mốc sau #118 = 53/54). n chính thức GIỮ 14.

### Runs 198/199/200

- Run 198 (8256daf7, sched 1795660551 = 02:35:51Z): **SUCCEEDED**, finished 1795669680 = 05:08:00Z; started_at VIẾT LẠI 1795667052 = 04:24:12Z (btime #120 +47 s); claimed 1795669321 = 05:02:01Z; claimed→finished = **359 s (≥60 s — ứng viên CA, T7-195 quyết)**; sớm hơn deadline 05:35:51Z 1.671 s (27p51s); timed_out=false.
- Run 199 (d35bc461, sched 1795671351 = 05:35:51Z, run đóng đợt 194): **SUCCEEDED**, finished 1795672980 = **06:03:00Z** (KHÔNG phải 06:23:00Z — lỗi gõ tay của T2, bắt được bởi assert datetime, xem F-195-T2-4); claimed 1795672973 = 06:02:53Z; claimed→finished = 7 s (**KHÔNG phải CA**); started = sched (jitter 0).
- Run 200 (c8c827d5, sched 1795682151 = 08:35:51Z, lượt hiện tại): RUNNING lúc đọc.
- (m) #120 DUY NHẤT requeue trong cửa sổ rộng — không có requeue nào khác để nhầm.

### Boot #121 (ứng viên) — số thô cho T2-196

- Btime 08:22:05Z (uptime -s, kiểm ~08:41Z); boot id 8c4aa907-1329-4e9a-927e-acb2141baf67. Gap #120→#121 = **14.320 s** (3h58m40s).
- T01-195 khảo 08:41:23Z: journal idx 0 đầu 08:22:18Z = btime +13 s; wtmp bắt đầu 08:22:18Z; /proc/1 start_ticks 1290 = btime +12,90 s; CF-Date local mid 1795682483.
- Boot #120 id đã khôi phục: ac8a88aa-273d-42ef-a100-fc02ad143df4 (từ ram-sampler-194, mẫu đầu trên boot mới 04:25:03Z).
- (m) #121 thô + phân loại CUỐI thuộc T2-196.
- Tốc độ reboot: tới #119: 194 reboot / 366,16 h = 1 lần / 113,2 phút; tới #120: 195 / 368,08 h = 1 / 113,3 phút; tới #121cand: 196 / 372,06 h = 1 / 113,9 phút.

## §2. INSIDE — đếm B tham chiếu + đếm A

Script `m-check195.py` (exit 0; assert chuỗi đã qua; FULL161 p10/p90 khớp số in của T2-193: 1667,00/9064,00). FULL164/165/166 = FULL163 + gap 14.773 s / +6.917 s / +14.320 s.

- FULL164: n=164, mean 1h47'40", median 1h57'08", p10 1671,80 s, p90 9175,90 s.
- FULL165: n=165, mean 1h47'43", median 1h57'05", p10 1673,40 s, p90 9161,20 s.
- FULL166: n=166, mean 1h48'30", median 1h57'08", p10 1675,00 s, p90 10050,50 s.
- B-#117 kiểm lại **TRUE** (khớp T2-194; chuỗi B liên tiếp sau #117 = 1 theo quyết (d)-194).
- **B-#118 FALSE** — 55c9e0b7 vs FULL164, neo 22:21:55Z; band [22:49:46Z, 00:54:50Z]; trễ 5.598 s quá biên trên (chính xác 5.597,1 s). Chuỗi B liên tiếp **1 → 0 (ĐỨT)**.
- **B-#119 TRUE** — ac8a88aa vs FULL165, neo 02:28:08Z; band [02:56:01Z, 05:00:49Z]; biên dưới +5.244 s / biên trên −2.244 s (chính xác biên dưới +5.243,6 s). Chuỗi B **0 → 1 (khởi động lại**, nếu parent chấp nhận từ điểm đứt).
- **B-#120 FALSE** — 8c4aa907 vs FULL166, neo 04:23:25Z; band kết thúc 07:10:55Z; trễ 4.270 s (chính xác 4.269,5 s). Chỉ là THAM CHIẾU cho T2-196.
- Đếm A: INSIDE #113/#114/#115 **KHÔNG TÍNH ĐƯỢC** (btime #106 vẫn chưa biết); chuỗi GIỮ 7. Không có dữ liệu mới đợt 195.
- Marker: 71 reboot #49–#119; 72 với #120; 73 với #121cand.

## §3. Mù (blind walk) + hole-recheck

B0 = 2026-11-21T11:15:18Z (đứng); B1 = 2026-11-26T09:02:32Z (1795683752); cửa sổ 424.034 s. Gen: repo-1 7.375 file / hidden_files 10.784 / outside 30.804 / tmp 2.034 (stderr 1 dòng `.stagged-uploads` Permission denied, như mọi đợt). Merged: 10.199 second-mark (194: 10.088, +111).

### §3.1 R/S/T/U — file gaps

- R: max **1.238 s MỞ** (lần thứ 28, không đổi) — [11:15:18Z, 11:35:56Z].
- S: max **3.235 s MỞ** (không đổi) — [13:01:51Z, 13:55:46Z].
- T: max **627 s ĐÓNG** (không đổi) — [15:22:55Z, 15:33:22Z].
- U file: max **9.316 s MỞ** (không đổi) — [24/11 15:00:33Z, 17:35:49Z]; thứ 2: 8.968 s; thứ 3: 6.807 s; thứ 4: **6.336 s MỚI (H-U21)**; thứ 5: 6.176 s (H-U20, cuối dời 02:35:37Z → 02:35:38Z, xem §3.4); thứ 6: 5.783 s. Đuôi U: mark cuối 09:02:31Z (1 s trước B1).

### §3.2 Union (file + content)

- R union-A 1.222 s MỞ / union-B 1.211 s MỞ (không đổi).
- S union-A 662 s ĐÓNG / union-B 591 s ĐÓNG (không đổi).
- T union-A 38 s ĐÓNG (không đổi).
- U union-A max 9.316 s MỞ (thứ 2: 8.968; thứ 3: 6.807; thứ 4: **6.336 s H-U21**; thứ 5: 6.176 s H-U20; thứ 6: 5.783 s).
- U union-B max **8.372 s MỞ** (không đổi; thứ 2: 7.861; thứ 3: 6.100; thứ 4: 5.745; thứ 5: **5.538 s MỚI** — H-U21 bị SYS8C4A 08:22:18Z chẻ; thứ 6: 4.995 s).
- CERT/FULL **GIỮ 76/91** (quy ước đứng từ đợt 191; không có dữ liệu mới đổi nó).
- Content (boot-agnostic, trong U): watcher-192 173 poll / watcher-193 167 / **watcher-194 185 dòng** (194: 102 lúc B1-194 — tăng vì watcher sống tới 04:23:48Z rồi chết cùng #119) / **watcher-195 23 dòng** (mới, spawn ~08:51Z, pid 44695, đang sống — poll cuối 09:19:00Z lúc kiểm); sampler-192 130 / sampler-193 130 / **sampler-194 123 dòng** (194: 56 lúc B1-194) / **sampler-195 20 dòng** (mới).
- SYS8C4A = 08:22:18Z (T01-195 direct: journal/wtmp +13 s, /proc/1 +12,90 s) đã thêm vào union_b. SYSAC8A (#120) KHÔNG thêm — không có đo head trực tiếp trên hồ sơ (tiền lệ F-187-T2-3); mark ac8a88aa đầu tiên qua sampler-194 content 04:25:03Z.
- Investigate đối chiếu: repo-1 7.375 = gen; hidden_files 10.773 vs gen 10.784 (−11); outside 30.803 vs 30.804 (−1); tmp 1.758 vs 2.034 (−276, churn /tmp).

### §3.3 Sessions + witness

- Sessions-195: exec-log có mtime trong cửa sổ 246 (194: 243, +3); skip marker log của chính luồng 24 (194: 23, +1); #64–#86: **3 mỗi khoảng** (cùng 3 log trích dẫn cũ; 0 hoạt động thật). R-gap in-gap: **0** (194: 0; 193: 1 — log đó đã bị purge). U-gap in-gap: **0** (194: 1 — proc_ad2556eb9f46 đã bị purge, xem §6). Exec-log mtime trong R/S/T: 0/0/0; trong U: 245 (194: 243, +2).
- U-tail [08:43:25–09:02:32Z]: repo-1=30 / hidden_files=130 / outside=54 / tmp=2034 — tmp là node-compile-cache (626) + chrome profile P3/P4 (round195-p3-audio-profile 370, parity195-voice-profile 118, parity195 104…) — kỹ thuật, 0 liên quan hố mù.
- Witness-195: exec-log mtime trong cửa sổ 245; skip quote-marker 24. Các khoảng cũ tăng +1/+2 do **2 log trích dẫn MỚI** (log session T01-195 + log close T9-194 — xem F-195-T2-7): #87–#111: 2→3 (110/111: 3→4); #113: 4→5; #114: 6→7; #115: 6→8; #116: 2→4; #117: 5→7.
- Khoảng mới (thô → thật):
  - #116-B/#117-A: 4 thô → **0 thật** (2 cũ + T9-194 close + T01-195 session, toàn trích dẫn).
  - #117-B/#118-A: 7 thô → **0 thật** (5 cũ + 2 log mới trên).
  - #118-B/#119-A: 2 thô → **0 thật** (MỚI so với 194: 0 — 2 log mới trên).
  - #119-B/#120-A: 5 thô → **0 thật** (MỚI — đã triage tay từng log: T9-194 close; log poll-wait T4-194 (poll #1 trích `boot=02:28:08`, deadline 04:30:00Z); 2 log fe83c0a2 (grep epoch 1795667005 + tail poll T4-194/T4-195); T01-195 session).
  - #120-B/#121-A: 4 thô → **0 thật** (MỚI — cùng 4 log trên, toàn trích dẫn btime #120/#121).
- **0 hoạt động thật tại mọi witness.**

### §3.4 Hole-recheck (lần thứ 38)

- Mọi hố cũ: **NEW=0** (H-E1-88: lần kiểm thứ 37 liên tiếp 0 mới; inside=337, toàn float-trap).
- **H-U21 MỚI** (06:50:00Z–08:35:36Z 26/11, 6.336 s): **NEW=7, 0 hoạt động thật**:
  - 4 file memory-bank lúc 06:50:00Z (archive CURRENT.md + CURRENT.md + reflections.md + world.md — job bảo trì memory, cùng họ với trap H-U20) — mark biên bắt đầu hố.
  - 3 file /var/log lúc 08:22:18Z (wtmp/btmp/lastlog — mark hệ thống của chính boot #121, btime +13 s; đây là lý do SYS8C4A chẻ hố còn 5.538 s trong union-B).
  - Hố là quãng lặng sau khi đợt 194 đóng (T10 ~05:54Z; mark file cuối 06:50:00Z) tới dispatch run 200 08:35:51Z (mark cuối 08:35:36Z = dispatch −15 s), bắc qua btime #121 (08:22:05Z).
- H-U20: cuối dời 02:35:37Z → 02:35:38Z trong merged-195 (gap 6.175 → 6.176 s) — endpoint được viết lại (docs/ideas.md + payments-and-purchases.md lúc 02:35:38Z); giữ nguyên endpoint cũ khi recheck (tiền lệ F-186-T2-9); NEW=0.

## §4. (m) #56 — lần 37, VẪN CÓ ĐIỀU KIỆN

- 5 hướng DB MỚI (cli–clv), đã xác minh chưa dùng bằng grep qua m56-19*.py (0 match) TRƯỚC khi đếm (F-194-T2-2); toàn 0 dòng trong W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217), đọc ~08:55Z 26/11:
  - (cli) agent.agent_compactions created_at (epoch s; sanity MAX=1795672561): 0.
  - (clii) chat.chats created_at (epoch s; sanity MAX=1792404539): 0.
  - (cliii) goals.briefings created_at_ts: 0.
  - (cliv) health.samples start_at: 0.
  - (clv) ideas.feed_snapshots generated_at: 0.
- Tổng **155 hướng** (150 + 5 mới). File: (vii) **333 file**, max mtime **20:15:33.130Z** (round156-t10.done) — KHÔNG ĐỔI so với đợt 194; (viii) **0** exec-log trong D; (vii-b) 0 file 20:16–20:17Z; (vii-c) 0 file 20:19:30–20:19:40Z.
- (ix) wtmp/btmp/lastlog: chỉ có boot hiện tại #121 (wtmp bắt đầu 08:22:18Z) — rỗng về cấu trúc cho 20/11. (x) apt/dpkg: không có bản rotated (chỉ /var/log/dpkg.log + /var/log/apt/history.log, bản hiện tại, mtime 08:37Z 26/11) — rỗng về cấu trúc cho 20/11.
- **(m) #56 VẪN CÓ ĐIỀU KIỆN, lần thứ 37.**

## §5. EPERM probe + sweep sóng

- **Probe #114: 2026-11-26T08:47:12Z, boot 8c4aa907, ok=2 fail=0.** File: `/tmp/eperm-probe-tmp-114.txt` + `hidden_files/eperm-probe-ws-114.txt`; log `eperm-probe-v2.log` (thêm 2 dòng đổi boot: 55c9e0b7 → ac8a88aa, ac8a88aa → 8c4aa907).
- **Sweep #114** (cửa sổ [04:05:03Z, 08:47:12Z]): 351 file `*.log`; 7 file có hit, **33 lần** — **0 "sóng EPERM vẫn bật"**:
  - proc_757f4f7c4ed1.log (log session của chính T2-194 — tự trích output sweep194): CẢNH BÁO 1 + Operation not permitted 1 + đã tắt 7.
  - eperm-sweep194.log: 1 + 1 + 7 (tự trích).
  - o8-195t01.log: đã tắt 3 (probe của chính T01-195).
  - o8-194t8.log / o8-189t8.log / o8-184t8.log (archive) / o8-195t8.log (archive-194): đã tắt 3 mỗi file.
- Kết luận: **0 sóng thật**, như đợt 193/194. (Lần chạy sweep đầu fail assert W0<W1 do sed đổi kép — đã sửa W0 về 04:05:03Z; xem F-195-T2-5.)

## §6. Bằng chứng bị xóa (F-192-T2-3)

- 41-list (đường dẫn exec-log trích trong log đợt 189): hiện diện **0/41, MẤT 41/41**; **mất MỚI từ 194: 0** (cả 41 đã mất từ đợt 194).
- 349-list (blind list đợt 189): hiện diện **0/349, MẤT 349/349**; **mất MỚI từ 194: 0**.
- Bộ #100: **0/6** (proc_34889a901a7e vẫn mất; proc_e606d7b4f921 + proc_e0c4ed13d7cd mất).
- Tổng exec-log còn trên đĩa: **261 file** `proc_*.log` (194: 258 — +3: log mới đợt 195 trừ log bị purge), toàn bộ mtime ≥ B0.
- **Purge VẪN TIẾP TỤC với file ngoài 2 danh sách cố định:** proc_ad2556eb9f46.log (log session main agent, mtime 25/11 08:36:48Z — witness U-gap cuối cùng) **đã mất giữa 194→195** (sessions U-gap 1 → 0; witness U-gap 1 → 0). Hai danh sách cố định đã cạn (0 hiện diện) nên không đo được mất mới nữa; bằng chứng purge nay chỉ còn thấy qua các log mới hơn bị mất.

## §7. Sổ vi phạm

Chuỗi 0 vi phạm GIỮ 0 từ F-194-T2-9 (đã 0). F-194-T56-4 đã quyết VI PHẠM NHẸ (đợt 194).

### F-194-P3-1 — KHÉP (kết luận cho sổ)

- P3-194 build 42,94 s (~02:55–02:57Z) chồng đầu pha (b) attempt1 T4-194.
- T4-194 phán: attempt1 **B2 VI PHẠM → vô hiệu** (load1_max 15,11; tickCost median 220,0 ms); T10-194 ghi 1 lần là **F-194-T2-9**; parent (p)-194 chấp nhận.
- T4 KHÔNG quy vi phạm cho riêng P3 (nhiều luồng nặng cùng chồng: T01 recount + P4 tsc/parity + P1 chrome + P3).
- **Kết luận: F-194-P3-1 là thành phần của F-194-T2-9, đã tính 1 lần, KHÔNG phải vi phạm riêng.** Không thêm mục mới vào sổ.

### F-195-T2-8 — VI PHẠM NHẸ (mới, đợt 195)

- **P3-195 mở chrome headed trong cửa sổ attempt1 T4-195:** burst ghi profile 09:11:15–09:11:50Z (**324 file** trong /tmp/round195-p3-audio-profile; đỉnh 203 file lúc 09:11:29Z), ~35 s trong cửa sổ attempt1 (09:10:07–09:13:53Z, hold 226 s). 0 file profile trong cửa sổ attempt2/attempt3.
- Attempt1: load1 max **2,08** (per-pass mean 1,01–1,34); tickCost median **78,0 ms** — KHÔNG hợp lệ, nhưng đã chậm từ pass 1 (median 66,5 — TRƯỚC khi P3 khởi động 09:11:15Z). 0 bằng chứng P3 gây ra lỗi.
- Phân loại theo tiền lệ F-194-T56-4 (chồng + 0 bằng chứng ảnh hưởng = VI PHẠM NHẸ, ghi sổ): **VI PHẠM NHẸ**. Chuỗi 0 vi phạm **GIỮ 0** (đã 0).
- Nếu T4-195 (LIMITS chưa đóng lúc T2 viết) quy lỗi attempt1 cho tải ngoài, phân loại nâng cấp theo phán của T4. *(Cập nhật sau khi T4 đóng LIMITS: T4 phán attempt1 "0 spike (lạ-tải nhẹ)" — không quy cho tải ngoài; phân loại NHẸ giữ nguyên.)*

### F-195-T2-9 — VI PHẠM NHẸ (mới, đợt 195; T4 giao T2 phán — F-195-T4-7)

- **T56 chunk2 chồng ~11 s đầu pha (b) attempt1:** chunk2 bắt đầu 09:08:36Z (pgid 75510); monitor phát hiện cửa yên mở giữa chunk và kill pgid lúc **09:10:16–18Z** (gate-monitor-195.log: "GATE-MO-GIUA-CHUNK — kill pgid 75510" 09:10:16Z, "KILLED" 09:10:18Z). Cửa sổ attempt1 (W1) mở 09:10:07Z → chồng **~11 s**, trong pass 1, **trước khi partial 1/20 ghi (09:10:29Z)**.
- Đã kiểm chứng độc lập trên gate-monitor log của chính T56 (không chỉ tin LIMITS T4).
- Chunk1 (09:06:33–09:08:24Z) TRƯỚC W1; chunk3 (09:22:27–09:24:17Z) + chunk4 (09:24:24–09:26:24Z) SAU W3; **0 chồng W2/W3**. Monitor 10 s/chu kỳ đã hiệu quả (sửa F-193-T56-3 — khác đợt 194, lần này kill kịp).
- 0 bằng chứng ảnh hưởng: attempt1 load ≤2,08, chậm từ pass 1 (trước khi chunk2 bị kill 09:10:16–18Z — pass 1 bắt đầu 09:10:18Z, median 66,5).
- Phân loại theo tiền lệ F-194-T56-4 (chồng + 0 bằng chứng ảnh hưởng = VI PHẠM NHẸ, ghi sổ): **VI PHẠM NHẸ**. Chuỗi 0 vi phạm **GIỮ 0** (đã 0).

### Tự kiểm của chính T2 (ghi chép trung thực, không phải vi phạm)

- Trong cửa sổ W1 (09:10:07–09:13:53Z), T2-195 chạy: đuôi `blind195-investigate.py` (os.walk, bắt đầu 09:07Z, kết thúc ~09:10:0xZ — chồng W1 vài giây) + `evidence-check195.py` (~09:10:3xZ, ~400 stat + ghi log nhỏ, <1 s). Cả hai đều nhẹ; load attempt1 giữ ≤2,08; T4-195 §3 tự liệt kê chúng là "kiểm chứng nhẹ". 0 bằng chứng ảnh hưởng — ghi lại để luồng sau khỏi nhầm thành vi phạm.

### T4-195 attempts (số thô từ analyze-t4-attempt*-*.txt + poller + lock log; đã đối chiếu với T4 LIMITS `PHASE9_ROUND195_T4_WEBKIT_QUIET63_LIMITS.md`, 44.829 B — khớp từng số)

- Attempt1: 09:10:07–09:13:53Z (hold 226 s), tickCost median **78,0 ms** (n=429, p90 114,0) — KHÔNG hợp lệ (lỗi nội tại, xem trên). Lock: chỉ T4 giữ.
- Attempt2: 09:14:16–09:17:20Z (hold 184 s), tickCost median **49,0 ms** (n=574) — nhưng c2drawlog status=**timeout**; T4-195 LIMITS (đóng sau, đã đối chiếu): **PAGE-WEDGED** (cả 3 writePartial TIMEOUT sau pass 20, probe_exit=2) — **KHÔNG tính verdict**. Tải trong attempt2 là **tự-tải** (84 spike, đỉnh ~105% CPU là probe của chính T4) — KHÔNG phải tải ngoài; P3 ghi 0 file trong cửa sổ này. Không có vi phạm cho attempt2.
- Attempt3: 09:17:53–09:21:32Z (hold 219 s), tickCost median **53,0 ms** (n=607, p90 82,0) — **HỢP LỆ: 20/20 + LOP B ĐẠT 5/5** (poller 09:21:58Z: "LUOT HOP LE, thoat poller"); load 0,56–1,00. COVERAGE-CHECK 4/4. T4-195 LIMITS xác nhận: "#63 CÓ LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 0 → 1"; "Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này".
- Vite-lock: trong 09:10–09:21Z chỉ có 3 cặp ACQUIRED/RELEASED của t4 (port 5187) — **không có luồng nào khác giữ lock trong cửa sổ attempt**. P2 .done 09:11:51Z (trong cửa sổ attempt1 — nhưng vite P2 trên port 5590 đã hết từ poll #36 09:10:06Z blockers=0; chỉ còn viết LIMITS/paths, nhẹ). P3 .done 09:20:25Z (trong cửa sổ attempt3 — attempt3 vẫn HỢP LỆ, load 0,56–1,00).

## §8. Lượt yên #63 + live-check #14 + POSTBOOT_PASS #120

- **Lượt yên #63: HỢP LỆ** (attempt3 valid, median 53,0 ms ≤ 60; attempt1 median 78,0 ms không hợp lệ; attempt2 timeout). Chuỗi lượt yên **0 → 1** (khởi động lại — tiền lệ đợt 179: đợt sạch đầu tiên sau khi đứt thì chuỗi tính lại từ 1). Đợt #62: 0/3 attempt hợp lệ (chuỗi GIỮ 0).
- **Live-check #14: ĐỀ XUẤT ĐẠT** — attempt3 valid; chuỗi live ĐẠT **9 → 10** (chờ T9-195 LIMITS xác nhận; sampler-195 đang sống trên boot #121, mẫu cuối 09:29:48Z lúc kiểm; auto-trigger GIỮ LIVE, 0 FIRE — xem (o)-194: 604 mẫu live).
- **POSTBOOT_PASS #120: KHÔNG CÓ.** T56-195 chỉ viết POSTBOOT_PASS-55c9e0b7 (#119, kiểm muộn) + POSTBOOT_PASS (8c4aa907, #121, 08:51:26Z, poll=0, "replay-day-du": dpkg 1477 dòng; cache 171 .deb; lists 37). Boot #120 (ac8a88aa) chết 08:22:05Z trước khi T56-195 bắt đầu (~08:43Z); không có file postboot nào cho #120. Giao T10/parent quyết có tính là "không cờ" (như #118: tổng boot không cờ 27 → 28) hay được bao bởi file #119-muộn.
- Watcher-195 đang sống (poll cuối 09:19:00Z lúc kiểm, boot 8c4aa907, dpkg_lines 1477). Watcher-194 đã CHẾT (log dừng 04:23:48Z, 193 dòng, 0 dòng nhắc ac8a88aa).

## §9. F-notes đợt 195 (lỗi của chính T2 + phát hiện)

- **F-195-T2-1 (watcher-194 poll artefact, lần thứ 3):** poll cuối của watcher-194 timestamp 04:23:48Z (23 s SAU btime #120) vẫn ghi boot=55c9e0b7 — cùng họ với watcher-193 (+28 s sau btime #118) và F-193-T9-2. Timestamp poll gần reboot không tin được trong ~30 s. Verdict (m) #120 dùng DB only, không bị ảnh hưởng.
- **F-195-T2-2 (loại trừ log của chính mình — marker KHÔNG đủ):** (a) sessions-195 lần chạy 1 gõ tay sai epoch U-gap (1795515633 thay vì 1795532433 — cùng lớp F-193-T2-2(e)); đã chạy lại với epoch đúng. (b) Log exec của chính T2-195 (proc_a41a15c9d839.log) false-witness #64–#86 ở lần chạy 1 vì **exec-log chỉ ghi stdout, không ghi dòng lệnh** — không chứa chuỗi marker "round195-t2"/"m-check195" nên QUOTE_MARKERS không bắt được. Đã sửa: MY_AGENT_DIR_195 = thư mục agent thật của session này (14465612-02f1-4391-8dfd-dbd0bc0258c0) trong cả blind195-sessions.py và witness195.py; lần chạy 2: #64–#86 về 3 (đúng). Bài học: **chỉ loại trừ bằng thư mục agent mới chắc; marker chỉ là lớp phụ.**
- **F-195-T2-3 (LIMITS-194 §3 ghi SAI U-gap):** LIMITS-194 viết "U-gap: 3 hit như đợt 192/193" — SAI; blind194-sessions.log dòng 96 ghi **1 hit** (17:19:50Z, proc_ad2556eb9f46). Hai hit còn lại của đợt 193 đã bị purge (F-194-T2-8). R-gap 194 = 0 (LIMITS-194 không ghi). T2-194 đã chép số đợt 193 mà không kiểm lại. 0 ảnh hưởng verdict (cả hai đều 0 hoạt động thật).
- **F-195-T2-4 (lỗi gõ tay của chính T2, bắt TRƯỚC khi đóng):** tính tay run 199 finished = 06:23:00Z; giá trị datetime-derived là 06:03:00Z. Đã sửa cả 2 literal trong m-check195.py + chạy lại sạch (exit 0, 0 lần xuất hiện giá trị sai). Cùng lớp F-194-T2-6.
- **F-195-T2-5 (sed đổi kép ở eperm-sweep195.py, bắt TRƯỚC khi chạy):** lần chạy đầu fail assert W0<W1 vì sed đổi cả hai timestamp thành 08:47:12Z; đã sửa W0 về 04:05:03Z. Cùng lớp F-193-T2-2(b).
- **F-195-T2-6 (sed đổi quá tay qua các script mù, bắt TRƯỚC khi chạy):** `s/194/195/g` làm hỏng đường dẫn replay-watch-194/ram-sampler-194, QUOTE_MARKERS, MY_AGENT_DIR_194, "T01-195" thay cho "T01-194", trích dẫn F-195 thay cho F-194 — đã khôi phục tay từng chỗ trước khi chạy (xem chú thích trong script).
- **F-195-T2-7 (witness khoảng cũ tăng +1/+2 do 2 log trích dẫn mới):** T01-195 session log (span 11:26:05Z 20/11–08:41:23Z 26/11, trích marker + survey) và T9-194 close log (CLOSE2-194 04:50:58Z, trích btime #116 + ENOSPC) làm mọi khoảng #87–#118 tăng +1/+2. Toàn trích dẫn, 0 hoạt động thật.
- **F-195-T2-8:** xem §7 (P3 chrome chồng attempt1 — VI PHẠM NHẸ).
- **F-195-T2-9:** xem §7 (T56 chunk2 chồng ~11 s đầu attempt1, monitor kill kịp — VI PHẠM NHẸ; T4 giao T2 phán, F-195-T4-7).
- **F-195-T2-9 (SIGPIPE khi pipe qua head):** sessions-195 lần chạy 2 bị cắt ở 60 dòng vì `| head -8` đóng pipe sớm (python chết SIGPIPE). Đã chạy lại không pipe, đủ 108 dòng. Bài học: script dài thì redirect thẳng ra file, không pipe qua head.

## §10. Đề xuất cho parent (§14.2-195)

- (a) (m) #119 = KHÔNG CÓ ĐIỂM (CUỐI); n ứng viên GIỮ 53/54.
- (b) (m) #120 = DƯƠNG (CUỐI); n ứng viên → **54/55** (+1/+1 theo quy tắc đứng).
- (c) n chính thức GIỮ 14.
- (d) INSIDE đếm A: KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7. Đếm B: B-#118 FALSE → chuỗi B 1 → 0 (ĐỨT); B-#119 TRUE → chuỗi B 0 → 1 (khởi động lại); B-#120 FALSE (tham chiếu).
- (e) Boot #121 (8c4aa907, btime 08:22:05Z, gap #120→#121 = 14.320 s) = ứng viên #121; (m) #121 thuộc T2-196.
- (f) EPERM probe #114 ok=2 fail=0; sweep 0 sóng thật.
- (g) Mù: R/S/T/U không đổi trừ hố mới H-U21 (6.336 s, NEW=7 toàn kỹ thuật, 0 hoạt động thật); hole-recheck lần 38: NEW=0 mọi hố cũ.
- (h) (m) #56 VẪN CÓ ĐIỀU KIỆN (155 hướng, lần 37).
- (i) Bằng chứng: 41-list 0/41, 349-list 0/349, #100 0/6; purge vẫn ăn log mới hơn (proc_ad2556eb9f46 mất).
- (j) F-194-P3-1 KHÉP: thành phần của F-194-T2-9, không tính riêng.
- (k) F-195-T2-8 VI PHẠM NHẸ (P3 chồng attempt1); **F-195-T2-9 VI PHẠM NHẸ** (T56 chunk2 chồng ~11 s đầu attempt1, monitor kill kịp); chuỗi 0 vi phạm GIỮ 0.
- (l) Lượt yên #63 HỢP LỆ → chuỗi 0 → 1. Live-check #14 ĐỀ XUẤT ĐẠT → chuỗi 9 → 10 (chờ T9-195).
- (m) POSTBOOT_PASS #120 KHÔNG CÓ — parent/T10 quyết cách tính.
- (n) Run 198 SUCCEEDED, claimed→finished 359 s — ứng viên CA (T7-195 quyết); run 199 SUCCEEDED, 7 s — KHÔNG phải CA; run 200 đang chạy.
- (o) Đính chính LIMITS-194 §3: U-gap đợt 194 là **1 hit** (không phải 3) — xem F-195-T2-3.

## §11. Files (luồng T2 đợt 195)

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND195_T2_EPERM_LIMITS.md`
- Thư mục làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t2/`:
  - `m-check195.py` + `m-check195.txt` ((m) + INSIDE + runs)
  - `eperm-sweep195.py` + `eperm-sweep195.log` (sweep #114)
  - `blind195-gen.py` + `blind195-b1.txt` + `blind195-{repo-1,hidden_files,outside,tmp}.txt` + `blind195-gen.log`
  - `blind195-merged.py` + `blind195-merged.log`
  - `blind195-content.py` + `blind195-content.log`
  - `blind195-sessions.py` + `blind195-sessions.log`
  - `witness195.py` + `blind195-witness.log`
  - `blind195-investigate.py` + `blind195-investigate.log`
  - `hole-recheck195.py` + `hole-recheck195.log`
  - `m56-195.py` + `m56-195.log` ((m) #56)
  - `evidence-check195.py` + `evidence-check195.log`
- EPERM probe: `/tmp/eperm-probe-tmp-114.txt` + `hidden_files/eperm-probe-ws-114.txt`; log `hidden_files/eperm-probe-v2.log`
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round195-t2-eperm.txt`
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-t2.done`
- Nguồn đọc: `docs/PHASE9_ROUND194_T2_EPERM_LIMITS.md`, `docs/PHASE9_ROUND194_LIMITS.md` (§14.2), `hidden_files/round195-t01/boot-survey-195t01.txt`, `hidden_files/round195-t4/{poll-t4.log,chain-t4.log,analyze-t4-attempt*-8c4aa907-*.txt,load-mid-t4-attempt*-8c4aa907.log}`, `hidden_files/vite-lock-v2.log`, `hidden_files/round195-t56/POSTBOOT_PASS*`, `hidden_files/round195-t9/ram-sampler.log`.
