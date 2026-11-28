# PHASE9 ROUND196 T2 — EPERM + (m)/INSIDE + mù + sổ vi phạm

- Đợt: 196 (đợt thứ 6 theo hướng mới 25/11 — Editing Core, preview/render parity)
- Luồng: T2 (nền: EPERM probe + phân loại (m)/INSIDE + mù/hole-recheck + sổ vi phạm)
- Thời gian làm: 26/11/2026 ~14:36–16:30Z; B1 mù = 15:03:06Z; cờ hạn ~17:00Z, hạn cứng 17:35:51Z
- Nguồn gốc §14.2-195: **SẠCH** (parent viết trực tiếp trong lượt handoff 18:35 +07 26/11/2026 — lần sạch thứ tư kể từ đợt 179: 179, 183, 191, 195; tổng điền sẵn GIỮ 18). Mọi số trong tài liệu này đều do T2-196 tự đọc/đếm mới trong đợt này; không dùng DB `result_summary` làm nguồn narrative (F-193-T7-2/F-194-T7-3).
- Boot làm việc: #123cand (bc09b26e, btime 14:30:16Z). Marker sống qua 73 boot #49–#121; 74 với #122; 75 với #123cand.

## §0. Tóm tắt verdict

- **(m) #121 = KHÔNG CÓ ĐIỂM (CUỐI)** — 0 sự kiện trong [08:22:05Z, 08:24:28Z]; 0 requeue trong [08:22:05Z, 08:35:51Z]. n ứng viên GIỮ 54/55.
- **(m) #122 = KHÔNG CÓ ĐIỂM (CUỐI)** — 0 sự kiện trong [11:17:40Z, 11:20:03Z]; 0 requeue trong [11:17:40Z, 11:35:51Z]. n ứng viên GIỮ 54/55.
- **(m) #123 = RAW 0 requeue** (phân loại CUỐI thuộc T2-197) — 0 sự kiện trong [14:30:16Z, 14:32:39Z]; 0 requeue trong [14:30:16Z, 14:35:51Z].
- INSIDE đếm B: B-#120 FALSE (kiểm lại); **B-#121 TRUE** (trong band, biên trên −138 s) → chuỗi B 1 → 2 (nếu parent chấp nhận); **B-#122 FALSE** (trễ 617 s, tham chiếu cho T2-197). Đếm A: KHÔNG TÍNH ĐƯỢC (thiếu btime #106), chuỗi GIỮ 7.
- EPERM probe #115: ok=2 fail=0. Sweep #115: 483 log, 7 file, 29 lần — **0 sóng thật** (toàn "đã tắt" + tự trích).
- Mù: R/S/T không đổi (R 1.238 s MỞ / S 3.235 s MỞ / T 627 s ĐÓNG; union-B U max 8.372 s MỞ). **Hố mới H-U22 = 6.771 s** (12:42:45Z–14:35:36Z 26/11, bắc qua btime #123) + **H-U23 = 4.861 s** (10:14:39Z–11:35:40Z 26/11, bắc qua btime #122): hole-recheck NEW=6 + NEW=1, toàn kỹ thuật (mark biên + mark hệ thống của chính boot #123), **0 hoạt động thật**. Các hố cũ NEW=0 (H-E1-88 lần thứ 38 liên tiếp 0 mới).
- (m) #56: 160 hướng (155 + 5 mới clvi–clx, toàn 0 dòng) — lần 38, **VẪN CÓ ĐIỀU KIỆN**.
- Bằng chứng xóa: 41-list 0/41, 349-list 0/349, #100 0/6 — không mất mới trong 2 danh sách cố định; nhưng purge vẫn tiếp tục ăn log mới hơn (tổng proc_*.log trên đĩa 261 → 235).
- Vi phạm đợt 195 (kết luận cho sổ, nhiệm vụ parent giao): **F-195-P4-3b VI PHẠM NHẸ** — ffmpeg (P4, không phải P3 như T4 ghi) trong ps-before W3 chồng pha (b) attempt3 ≥14 s (trung tâm ~23 s), 0 bằng chứng ảnh hưởng; attempt3 vẫn HỢP LỆ, verdict đợt 195 không đổi. Chuỗi 0 vi phạm GIỮ 0 (đã 0).
- Vi phạm đợt 196: **0 vi phạm bởi luồng khác** — cả 3 attempt B2 VI PHẠM (load) vì tự-tải vite re-opt ở đầu mỗi attempt (F-196-T2-10, tìm ra — không phải vi phạm). F-196-T4-7 (P3 .done trong W1 + P2 vite chặn gate polls #88/#89 — đều không phải vi phạm, xem §7). Chuỗi 0 vi phạm GIỮ 0 (đã 0).
- Lượt yên #64: **KHÔNG CÓ LƯỢT HỢP LỆ (0/3)** → chuỗi lượt yên 1 → 0 (ĐỨT); **FULL PASS KHÔNG CÓ** → chuỗi 1 → 0; live-check #15 **KHÔNG ĐẠT** → chuỗi 10 → 0; POSTBOOT_PASS #122 **KHÔNG CÓ** (tổng boot không cờ 29 → 30, đề xuất), #123 **CÓ** (poll=0, replay-day-du).

## §1. Phân loại (m) CUỐI — #121, #122 + #123 thô + runs + boot #123

Đọc DB tươi bằng `muse.db` ~15:00Z 26/11 (không dùng result_summary). Epochs từ `datetime.fromtimestamp`, không gõ tay (F-194-T2-6, F-195-T2-4). Đối chiếu độc lập: appendix T01-196 (đọc tươi) khớp từng số — 0 event trong cửa (m) #122/#123, đúng 1 requeue trong ngày (eid 11258 = (m) #120), không run nào spanning btime #122/#123, boot_gen đổi 2 lần (run 200→201→202).

### (m) #121 — KHÔNG CÓ ĐIỂM (CUỐI)

- Boot 8c4aa907, btime 08:22:05Z (1795681325); gap #120→#121 = 14.320 s.
- 0 sự kiện mọi loại trong [08:22:05Z, 08:24:28Z] (cửa (m) 143 s).
- 0 `requeued_after_restart` trong [08:22:05Z, 08:35:51Z].
- Sanity: bảng events còn nguyên (eid 11303 `reconciled` + 11304 `dispatched` run 200 lúc 08:35:51Z).
- Không có run nào sống tại btime (run 199 xong 06:03:00Z; run 200 dispatch 08:35:51Z).
- n ứng viên: không đổi, **54/55 GIỮ**.

### (m) #122 — KHÔNG CÓ ĐIỂM (CUỐI)

- Boot 2f268a28, btime 11:17:40Z (1795691860, parent (e)-195 quan sát trực tiếp trong lượt đóng 195; T01-196 appendix ghi "CHỈ THEO (e)-195 — chưa xác minh độc lập" — T2-196 xác minh độc lập bằng DB dưới đây, không dùng btime làm giả thiết).
- Gap #121→#122 = **10.535 s** (2h55m35s, tính bằng datetime).
- 0 sự kiện mọi loại trong [11:17:40Z, 11:20:03Z] (cửa (m) 143 s).
- 0 `requeued_after_restart` trong [11:17:40Z, 11:35:51Z].
- Kiểm khoảng lặng (10:12:46Z, 11:17:40Z): đúng 1 sự kiện (run 200 `succeeded` eid 11326) — không có restart daemon trong khoảng.
- Không có run nào sống tại btime (run 200 xong 10:12:46Z; run 201 dispatch 11:35:51Z).
- n ứng viên: không đổi, **54/55 GIỮ**.
- Caveat (ghi trung thực): watcher-195 poll cuối 10:14:39Z, sampler-195 dòng cuối 10:13:50Z — cả hai đã dừng TRƯỚC btime #122 63 phút, nên cửa sổ (10:14:39Z, 11:17:40Z) không có nhân chứng process dài hạn nào. Không có bằng chứng dương cho boot phụ trong khoảng; đánh số #122 dựa trên: btime do parent quan sát trực tiếp + 1 lần đổi boot_gen (run 200 5b654332 → run 201 4ececfeb) + T10-195 đóng đợt 195 trên boot #122 (round195-t10.done mtime 11:45:52Z). T01-196 appendix "watcher-195 CHẾT theo reboot #122" là suy luận, không phải quan sát trực tiếp (poll cuối cách btime 63 phút) — T2-196 không dùng làm bằng chứng.

### (m) #123 — RAW 0 requeue (phân loại CUỐI thuộc T2-197)

- Boot bc09b26e, btime 14:30:16Z (1795703416, T01-196 survey 14:40:27Z: /proc/stat btime + uptime -s; journal entry đầu 14:30:34Z = btime +18 s; wtmp bắt đầu 14:30:34Z; /proc/1 start_ticks 1791 = btime +17,91 s).
- Gap #122→#123 = **11.556 s** (3h12m36s, tính bằng datetime).
- 0 sự kiện mọi loại trong [14:30:16Z, 14:32:39Z] (cửa (m) 143 s).
- 0 `requeued_after_restart` trong [14:30:16Z, 14:35:51Z].
- Kiểm khoảng lặng (11:47:31Z, 14:30:16Z): 10 sự kiện, toàn job nhỏ định kỳ (`reconciled`/`dispatched`/`succeeded` cho run 8eb1da75, a01c73e7, f36ec0cc lúc 12:00:00Z, 12:41:41Z, 12:41:54Z) — `reconciled` là bước thường trước dispatch, KHÔNG phải tín hiệu reboot; daemon còn sống lúc 12:00/12:41Z. Không loại trừ hoàn toàn reboot trong (12:41:54Z, 14:30:16Z) chỉ bằng events (không có job nào đặt lịch trong khoảng đó).
- Không có run nào sống tại btime (run 201 xong 11:47:31Z; run 202 dispatch 14:35:51Z).
- Boot_gen: run 202 = 2c4cb8ea (đổi lần 2 so với run 201) — ủng hộ #123 là boot mới sau #122.

### Runs 200/201/202 (số thô; CA thuộc T7-196 quyết)

- Run 200 (c8c827d5, sched 1795682151 = 08:35:51Z): **SUCCEEDED**, started = sched (jitter 0); claimed 1795687957; finished 1795687966 = 10:12:46Z; claimed→finished = **9 s (KHÔNG phải CA)**.
- Run 201 (97ead1f7, sched 1795692951 = 11:35:51Z): **SUCCEEDED**, started = sched (jitter 0); claimed 1795693645; finished 1795693651 = 11:47:31Z; claimed→finished = **6 s (KHÔNG phải CA)**.
- Run 202 (b182d011, sched 1795703751 = 14:35:51Z, lượt hiện tại): RUNNING lúc đọc; started = claimed = sched (jitter 0).
- 0 run nào spanning btime #121/#122/#123 (kiểm: started < btime AND (finished NULL OR finished > btime) = 0 cả ba).

### Boot #123 (ứng viên) — số thô cho T2-197

- Btime 14:30:16Z; boot id bc09b26e-18f4-4c64-acf6-09aefc5946ec. Gap #122→#123 = 11.556 s.
- Tốc độ reboot: tới #121: 196 reboot / 372,06 h = 1 lần / 113,9 phút; tới #122: 197 / 374,99 h = 1 / 114,2 phút; tới #123cand: 198 / 378,20 h = 1 / 114,6 phút.
- Marker: 73 reboot #49–#121; 74 với #122; 75 với #123cand.

## §2. INSIDE — đếm B tham chiếu + đếm A

Script `m-check196.py` (exit 0; assert chuỗi đã qua; FULL166 p10/p90 khớp T2-195: 1675,00/10050,50; B-#120 kiểm lại FALSE). FULL167/168 = FULL166 + gap 10.535 s / +11.556 s.

- FULL167: n=167, mean 1h48'54", median 1h57'11", p10 1676,60 s, p90 10673,40 s.
- FULL168: n=168, mean 1h49'24", median 1h57'16", p10 1678,20 s, p90 10939,20 s.
- B-#120 kiểm lại **FALSE** (khớp T2-195; chuỗi B liên tiếp sau #120 = 1 theo quyết (d)-195).
- **B-#121 TRUE** — boot 2f268a28 (#122) vs FULL167, neo 08:22:05Z; band [08:50:01Z, 11:19:58Z]; trong band, biên trên −138 s (chính xác −138,4 s), biên dưới +8.859 s. Chuỗi B liên tiếp **1 → 2** (nếu parent chấp nhận).
- **B-#122 FALSE** — boot bc09b26e (#123) vs FULL168, neo 11:17:40Z; band [11:45:38Z, 14:19:59Z]; trễ 617 s quá biên trên (chính xác 616,8 s). Chỉ là THAM CHIẾU cho T2-197; chuỗi sẽ 2 → 0 nếu parent chấp nhận B-#121 trước.
- Đếm A: INSIDE #113/#114/#115 **KHÔNG TÍNH ĐƯỢC** (btime #106 vẫn chưa biết); chuỗi GIỮ 7. Không có dữ liệu mới đợt 196.
- Marker: 73 reboot #49–#121; 74 với #122; 75 với #123cand.

## §3. Mù (blind walk) + hole-recheck

B0 = 2026-11-21T11:15:18Z (đứng); B1 = 2026-11-26T15:03:06Z (1795705386); cửa sổ 445.668 s. Gen: repo-1 8.053 file / hidden_files 11.120 / outside 30.948 / tmp 857 (stderr 1 dòng `.stagged-uploads` Permission denied, như mọi đợt). Merged: 10.447 second-mark (195: 10.199, +248). Fifth scope: 22 file.

### §3.1 R/S/T/U — file gaps

- R: max **1.238 s MỞ** (lần thứ 29, không đổi) — [11:15:18Z, 11:35:56Z].
- S: max **3.235 s MỞ** (không đổi) — [13:01:51Z, 13:55:46Z].
- T: max **627 s ĐÓNG** (không đổi) — [15:22:55Z, 15:33:22Z].
- U file: max **9.316 s MỞ** (không đổi) — [24/11 15:00:33Z, 17:35:49Z]; thứ 2: 8.968 s; thứ 3: 6.807 s; thứ 4: **6.771 s MỚI (H-U22)**; thứ 5: 6.370 s (H-U21, cuối dời 08:35:36Z → 08:36:10Z, xem §3.4); thứ 6: 6.176 s (H-U20); thứ 7: **4.861 s MỚI (H-U23)**. Đuôi U: mark cuối 15:03:01Z (5 s trước B1).

### §3.2 Union (file + content)

- R union-A 1.222 s MỞ / union-B 1.211 s MỞ (không đổi).
- S union-A 662 s ĐÓNG / union-B 591 s ĐÓNG (không đổi).
- T union-A 38 s ĐÓNG (không đổi).
- U union-A max 9.316 s MỞ (thứ 2: 8.968; thứ 3: 6.807; thứ 4: **6.771 s H-U22**; thứ 5: 6.370 s H-U21; thứ 6: 6.176 s H-U20).
- U union-B max **8.372 s MỞ** (không đổi; thứ 2: 7.861; thứ 3: **6.469 s MỚI** — H-U22 bị SYSBC09 14:30:34Z chẻ; thứ 4: 6.100; thứ 5: 5.745; thứ 6: **5.538 s** — H-U21 bị SYS8C4A 08:22:18Z chẻ).
- CERT/FULL **GIỮ 76/91** (quy ước đứng từ đợt 191; không có dữ liệu mới đổi nó).
- Content (boot-agnostic, trong U): watcher-192 173 poll / watcher-193 167 / watcher-194 185 / **watcher-195 167 dòng** (195: 23 lúc B1-195; START 08:51:25Z pid 44695, poll cuối 10:14:39Z, không dòng END/STOP/NEWBOOT) / **watcher-196 42 dòng** (mới, spawn ~14:41Z pid 7775, đang sống — poll cuối 15:09:48Z lúc kiểm); sampler-192 130 / sampler-193 130 / sampler-194 123 / **sampler-195 92 dòng** (195: 20 lúc B1-195; dòng cuối 10:13:50Z) / **sampler-196 21 dòng** (mới, tới B1).
- SYSBC09 = 14:30:34Z (T01-196 direct: journal/wtmp +18 s, /proc/1 +17,91 s) đã thêm vào union_b. SYS2F26 (#122) KHÔNG thêm — không có đo head trực tiếp trên hồ sơ (tiền lệ F-187-T2-3; wtmp chỉ còn boot hiện tại, journal volatile).
- Investigate đối chiếu: repo-1 8.043 vs gen 8.053 (−10); hidden_files 11.111 vs 11.120 (−9); outside 30.945 vs 30.948 (−3); tmp 828 vs 857 (−29, churn /tmp). Base known cho hole-recheck: 10.179 second duy nhất (lúc merged-195 là 10.199 — −20 do 288 entry trong list 195 bị xóa khỏi đĩa giữa hai đợt, chủ yếu /tmp).

### §3.3 Sessions + witness

- Sessions-196: exec-log có mtime trong cửa sổ 206 (195: 246, −40 — purge); skip marker log của chính luồng 14 (195: 24); #64–#86: **1 mỗi khoảng** (195: 3 — chỉ còn proc_16be2aad056b.log, agent 7c8f7db3, mtime 08:42:25Z 26/11, content 2026-11-20T11:26:05 → 2026-11-26T08:41:23; 0 hoạt động thật). R-gap in-gap: **0**; U-gap in-gap: **0**. Exec-log mtime trong R/S/T: 0/0/0; trong U: 206.
- U-tail [14:43:59–15:03:06Z]: repo-1=15 / hidden_files=116 / outside=33 / tmp=241 / fifthscope=0 — tmp là chrome profile P3-196 (/tmp/round196-p3-audio-profile ~85 file) + round196-p2 (27) + node-compile-cache (9) — kỹ thuật, 0 liên quan hố mù. repo-1: script parity196 của P4 + audio-probe-196 của P3 + enhance tests.
- Witness-196: exec-log mtime trong cửa sổ 203; skip quote-marker 13. #87–#109: **1 mỗi khoảng** (195: 3 — chỉ còn proc_16be2aad056b); #110–#114: 2; #115: 6 (195: 8); #116: 2 (195: 4); #117: 5 (195: 7); #118: 2; #119: 5; #120: 4; **#121-B/#122-A: 1 (MỚI)**; **#122-B/#123-A: 1 (MỚI)**.
- Khoảng mới (thô → thật): **#121-B/#122-A: 1 thô → 0 thật** và **#122-B/#123-A: 1 thô → 0 thật** — cùng log proc_104769f31bcd.log (agent 7baea620, log close T9-194, mtime 04:51:02Z 26/11, content span 2026-11-25T14:57:20 → 2026-11-26T16:21:33 — trích btime #115 làm ngưỡng phân loại "BY BOOT (ts<16:21:33Z => #115, else #116)"; không chứa timestamp nào 11:17:40Z hay 14:30:16Z; span chỉ do min/max số học). Các khoảng cũ: cùng các log trích dẫn cũ (đã triage đợt 195); số lượng giảm do purge.
- **0 hoạt động thật tại mọi witness.**

### §3.4 Hole-recheck (lần thứ 39)

- Mọi hố cũ: **NEW=0** (H-E1-88: lần kiểm thứ 38 liên tiếp 0 mới; inside=337, toàn float-trap).
- **H-U22 MỚI** (12:42:45Z–14:35:36Z 26/11, 6.771 s): **NEW=6, 0 hoạt động thật**: 3 file session agent 5e3a203c lúc 12:42:45.052–.071Z (chính các file định nghĩa mark biên bắt đầu hố — phần lẻ .052–.071Z rơi vào trong khoảng float); 3 file /var/log lúc 14:30:34.6Z (wtmp/btmp/lastlog — mark hệ thống của chính boot #123, btime +18 s; SYSBC09 chẻ hố còn 6.469 s trong union-B). Hố là quãng lặng sau khi đợt 195 đóng tới dispatch run 202 (mark cuối 14:35:36Z = dispatch −15 s, cùng mẫu H-U20/H-U21), bắc qua btime #123. Không có sampler/watcher nào sống trong hố.
- **H-U23 MỚI** (10:14:39Z–11:35:40Z 26/11, 4.861 s): **NEW=1, 0 hoạt động thật**: 1 file replay-watch-195.log lúc 10:14:39.490Z (chính file định nghĩa mark biên bắt đầu hố — mtime = poll cuối của watcher-195). Hố là quãng lặng sau khi watcher-195/sampler-195 dừng (~10:14Z) tới file đóng đợt 195; bắc qua btime #122; không có sampler/watcher nào sống trong hố; không có SYS head mark cho #122 nên union-B không chẻ.
- H-U21: mark cuối 08:35:36Z đã MẤT khỏi merged-196 (live-config viết lại 14:35:36Z) — file gap nay (06:50:00Z, 08:36:10Z) 6.370 s; giữ nguyên endpoint cũ khi recheck (tiền lệ F-186-T2-9); NEW=0.

## §4. (m) #56 — lần 38, VẪN CÓ ĐIỀU KIỆN

- 5 hướng DB MỚI (clvi–clx), đã xác minh chưa dùng bằng grep qua m56-19*.py (0 match) TRƯỚC khi đếm (F-194-T2-2); toàn 0 dòng trong W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217), đọc ~15:20Z 26/11:
  - (clvi) agent.agents created_at (epoch s; default EXTRACT(epoch FROM now())): 0.
  - (clvii) scheduler.jobs updated_at_utc (bigint; sanity MAX=1795706134 — đúng magnitude epoch giây): 0.
  - (clviii) self_improvement.runs created_at: 0.
  - (clix) goals.goals created_at_ts: 0.
  - (clx) spaces.spaces created_at: 0.
- Tổng **160 hướng** (155 + 5 mới). File: (vii) **333 file**, max mtime **20:15:33.130Z** (round156-t10.done) — KHÔNG ĐỔI so với đợt 194/195; (viii) **0** exec-log trong D; (vii-b) 0 file 20:16–20:17Z; (vii-c) 0 file 20:19:30–20:19:40Z.
- (ix) wtmp/btmp/lastlog: chỉ có boot hiện tại #123 (wtmp bắt đầu 14:30:34Z) — rỗng về cấu trúc cho 20/11. (x) apt/dpkg: không có bản rotated (dpkg.log/history.log/term.log/eipp.log.xz đều mtime 14:38–14:39Z 26/11 — replay #123; 0 dòng nhắc 2026-11-20 trong dpkg.log) — rỗng về cấu trúc cho 20/11.
- **(m) #56 VẪN CÓ ĐIỀU KIỆN, lần thứ 38.**

## §5. EPERM probe + sweep sóng

- **Probe #115: 2026-11-26T14:59:28Z, boot bc09b26e, ok=2 fail=0.** File: `/tmp/eperm-probe-tmp-115.txt` + `hidden_files/eperm-probe-ws-115.txt`; log `eperm-probe-v2.log` (thêm dòng đổi boot 8c4aa907 → bc09b26e; lưu ý: script chỉ so heartbeat boot cuối với boot hiện tại nên boot #122 (2f268a28) không có dòng đổi boot riêng — log probe KHÔNG phải hồ sơ boot đầy đủ).
- **F-196-T2-1 (heartbeat stale — phát hiện mới):** heartbeat đang ở n=112 (mtime 2026-11-25T20:52:52Z, boot 1c0bcaad) trong khi log đã có probe#113 (04:05:03Z, boot 55c9e0b7) và probe#114 (08:47:12Z, boot 8c4aa907) — #113/#114 cập nhật log nhưng KHÔNG cập nhật heartbeat. Nguyên nhân chưa rõ (cơ chế vẫn chạy đúng: test với env override tạo probe#1 + heartbeat n=1 lúc 14:58:54Z). Nếu chạy không sửa, `once` sẽ ghi TRÙNG probe#113. Đã sửa trước khi chạy: viết lại heartbeat thành n=114, ts=2026-11-26T08:47:12Z, boot=8c4aa907-1329-4e9a-927e-acb2141baf67 (theo hồ sơ T2-195), pid=45328 (pid shell thật), bằng printf+mv. Sau đó `once` chạy sạch: probe#115, heartbeat nay n=115, ts=14:59:28Z, boot=bc09b26e-18f4-4c64-acf6-09aefc5946ec.
- **Sweep #115** (cửa sổ [08:47:12Z, 14:59:28Z]): 483 file `*.log`; 7 file có hit, **29 lần** — **0 "sóng EPERM vẫn bật"**: eperm-sweep195.log (CẢNH BÁO 2 + Operation not permitted 2 + đã tắt 7 — tự trích); o8-196t01.log (đã tắt 3, probe T01-196); o8-195t8.log (đã tắt 3); o8-189t8.log / o8-184t8.log (archive) / o8-195t8.log (archive-194) / o8-196t8.log (archive-195) (đã tắt 3 mỗi file).
- Kết luận: **0 sóng thật**, như đợt 193/194/195. (Lần chạy sweep đầu fail assert W0<W1 do sed đổi kép — đã sửa W0 về 08:47:12Z bằng tay; xem F-196-T2-4.)

## §6. Bằng chứng bị xóa (F-192-T2-3)

- 41-list (đường dẫn exec-log trích trong log đợt 189): hiện diện **0/41, MẤT 41/41**; **mất MỚI từ 195: 0** (cả 41 đã mất từ đợt 194).
- 349-list (blind list đợt 189): hiện diện **0/349, MẤT 349/349**; **mất MỚI từ 195: 0**.
- Bộ #100: **0/6** (proc_34889a901a7e vẫn mất; proc_e606d7b4f921 + proc_e0c4ed13d7cd mất).
- Tổng exec-log còn trên đĩa: **235 file** `proc_*.log` (195: 261 — −26; toàn bộ mtime ≥ B0 21/11).
- **Purge VẪN TIẾP TỤC với file ngoài 2 danh sách cố định:** sessions 246 → 206 exec-log trong cửa sổ; witness 245 → 203; jump witness #87–#109: 3 → 1 mỗi khoảng (2 log trích dẫn cũ đã bị purge, chỉ còn proc_16be2aad056b). Hai danh sách cố định đã cạn (0 hiện diện) nên không đo được mất mới nữa; bằng chứng purge nay chỉ còn thấy qua các log mới hơn bị mất.

## §7. Sổ vi phạm

Chuỗi 0 vi phạm GIỮ 0 từ F-194-T2-9 (đã 0). F-194-T56-4 đã quyết VI PHẠM NHẸ (đợt 194).

### F-195-P4-3b — VI PHẠM NHẸ (kết luận cho sổ đợt 195; nhiệm vụ parent (p)-195 giao T2-196 kiểm thời gian)

- **Đính chính quy kết: snippet ffmpeg trong ps-before W3 là của P4, KHÔNG phải P3.** Bảng §N11b LIMITS P4-195 giữ đúng các số full-decode mà snippet 4 lần chạy này tạo ra (longA 25,79 s + windowed 4,40 s; longB 12,42 s + windowed 0,99 s — tổng ≈ 43,6 s + overhead ≈ 44 s); LIMITS P3-195 không hề nhắc snippet ffmpeg CLI nào (số decode của P3 5.199/4.864 ms là từ probe headed `lastWindowDecodeMs`). Nhãn "Snippet decode P3" của T4 / F-195-P3-2 là quy kết sai. Parent (p)-195 gọi "ffmpeg P3" theo T4. Ghi sổ là **F-195-P4-3b** (lần ffmpeg thứ hai của P4 trong đợt 195; T4 ghi F-195-P3-2, parent gọi F-195-T4-8).
- **Bằng chứng thời gian (đọc lại từ nguồn gốc):** ps-before attempt3 (mtime 09:17:53.06Z): PID 82238 bash heredoc chạy python full-decode + windowed decode longA rồi longB; PID 82240 `ffmpeg -v error -y -i /home/hatch/workspace/tmp-round195-p3/longA-300s-gop300-720p.mp4 -f null -` (lần chạy #1, longA FULL decode, đang chạy tại snapshot). ps-after attempt2 (09:17:16.8Z): 0 ffmpeg → snippet bắt đầu sau 09:17:16.8Z; ps-after attempt3 (09:21:27Z): 0 ffmpeg → kết thúc trước 09:21:27Z. Cửa yên W3 mở 09:17:52Z (poll #38); ps-before 09:17:53.06Z là 1 s sau khi cửa mở. Pha (b): C2 draw BAT 09:18:07Z, case (b) 09:18:09Z, seed 09:18:11Z, pause t=0.5 09:18:13Z, t=1 09:18:15Z; pass 1 wall 3180 ms ghi 09:18:20Z → pass 1 chạy ~09:18:17–09:18:20Z; pass 2 kết thúc 09:18:23Z.
  - Tái dựng thời gian: lần #1 (25,79 s) đang chạy lúc 09:17:53.06Z → bắt đầu ∈ (09:17:27Z, 09:17:53Z]; snippet kết thúc = bắt đầu + ~44 s ∈ (09:18:11Z, 09:18:37Z]. Cận dưới chắc: dù lần #1 kết thúc ngay sau snapshot, các lần #2–#4 (17,81 s theo bảng P4) vẫn phải chạy → kết thúc ≥ 09:18:10.87Z. Theo quy ước đã dùng cho F-195-T2-9 (chồng tính từ lúc cửa yên mở): chồng W3 = từ 09:17:52Z tới khi snippet kết thúc ≥09:18:06Z (bảo thủ nhất, tăng tốc 2× trên máy yên cho lần #2–#4) = **≥14 s, trung tâm ~23 s**; chồng với phép đo đầu tiên (09:18:07Z) có thể ~4–19 s (trung tâm); chồng với tick pass 1 (09:18:17Z) có thể nhưng không chắc (0–20 s, trung tâm ~0–8 s).
  - Load (yếu/hỗn hợp, ghi trung thực): load-mid attempt3 (sampler `cat /proc/loadavg` mỗi 2 s — load1 là trung bình 1 phút, chậm) cho load1 0,79 → 0,56 trong 09:17:56–09:18:19Z (đang giảm), 1,00 lúc 09:18:21–25Z; perpass pass 1 load1 mean 0,67 (THẤP HƠN pass 3–5: 0,85–1,00) — phản bác chồng dài lên pass 1, nhưng load1 chậm và dấu vết ffmpeg 1 core (+0,3–0,4 trong 25 s) tương đương nhiễu suy giảm, nên không lật được tái dựng thời gian. Đường load attempt2 bị nhiễu bởi tự-tải của probe (84 spike ~105% CPU) — tái dựng "09:14:50–09:15:50Z" của P4 từ load vì thế yếu; thời gian lần chạy A của P4 dựa chủ yếu vào tự báo cáo của P4.
  - Tác động: **0 quan sát được** — attempt3 HỢP LỆ (median 53,0 ms ≤ 60; 20/20 + B 5/5); pass 1 median 60,0 (không bất thường so với xu hướng pass 41–93; pass 6 là 93,0 mà không có ffmpeg); load1_max W3 1,89 (pass 19–20, lâu sau khi ffmpeg kết thúc); tương quan perpass median~load1 r=−0,07.
- **Phân loại theo tiền lệ đứng (F-194-T56-4 / F-195-P4-3 / F-195-T2-9): chồng thật pha (b) bởi process nặng + 0 bằng chứng ảnh hưởng = VI PHẠM NHẸ.** (F-195-T2-9 chỉ ~11 s đã là VI PHẠM NHẸ.) "Chỉ là caveat" của parent (p)-195 có điều kiện trên việc thiếu bằng chứng; kiểm thời gian nay đã cung cấp bằng chứng đó. **Không đổi verdict đợt 195** (attempt3 hợp lệ, FULL PASS đứng — vi phạm quy trình, không phải dữ liệu; như F-195-P4-3). Chuỗi 0 vi phạm GIỮ 0 (đã 0).
- **Mơ hồ còn lại (ghi trung thực): một lần chạy hay hai lần chạy.** Nếu P4 chạy snippet hai lần (lần A ~09:14:50Z cho bảng + lần B ~09:17:30Z, khớp mẫu đo lặp của P4 — cột audio-only có 3 phép đo), thì F-195-P4-3 (W2) + F-195-P4-3b (W3) là hai vi phạm riêng. Nếu chỉ chạy một lần (lần B), thì thời gian W2 của F-195-P4-3 cần xem lại — nhưng T2-196 không có bằng chứng lật tự báo cáo của P4, và parent đã phán F-195-P4-3. Sổ tính hai instance (thời gian khác nhau; ps-before chứng minh W3 + tự báo cáo của P4 cho W2); parent có thể gộp/tách ở §14.2-196. Lưu ý: cụm "pha đo yên T4-195 attempt2" trong brief là nhầm lẫn — ffmpeg ps-before W3 chồng W3 (attempt3), không phải W2; con số ~44 s thuộc về F-195-P4-3 (attempt2).
- Tìm kiếm âm tính (đã ghi để khỏi lặp lại): không exec-log nào từ 26/11 chứa "full-decode" hay "longA-300s-gop300-720p" (thư mục agent P3-195 chỉ có 2 log, 08:41 + 09:04); exec-log là hồ sơ THƯA. Atime vô dụng: /home/hatch là btrfs `noatime`. Grep nền chỉ thấy "82238|full-decode=" ở các đợt cũ (76/79/94/95/96) và round195-t4 — không có bản sao đợt 195 nào khác.

### F-196 — VI PHẠM ĐỢT 196 (kiểm tới 16:25Z; T4-196 LIMITS đóng 16:19:51Z — số attempt dưới đây đã đối chiếu với `docs/PHASE9_ROUND196_T4_WEBKIT_QUIET64_LIMITS.md`, KHỚP TỪNG SỐ: median 84,0/67,0/67,0; load1_max 6,55/5,06/5,42; chuỗi lượt yên 1 → 0; FULL PASS không có; live #15 không đạt)

**Kết luận chung: 0 vi phạm bởi luồng khác trong đợt 196.** Cả 3 attempt đều B2 VI PHẠM (load) + median > 60, nhưng nguyên nhân là **tự-tải của chính T4** (vite re-optimize deps ở đầu mỗi attempt — xem F-196-T2-10), không có process nặng của luồng khác trong bất kỳ ps-before/after nào. Chuỗi 0 vi phạm **GIỮ 0**.

### F-196-T2-10 — TÌM RA (không phải vi phạm): vite T4 re-optimize deps ở đầu MỖI attempt → tự-tải phá B2 cả 3 attempt

- Bằng chứng trực tiếp (3 dòng log vite, mỗi attempt 1 dòng, 1–2 s sau khi cửa yên mở):
  - Attempt1: `3:40:03 PM [vite] (client) Re-optimizing dependencies because vite config has changed` (cửa mở 15:40:01Z).
  - Attempt2: `3:49:12 PM [vite] (client) Re-optimizing dependencies because vite config has changed` (cửa mở 15:49:10Z).
  - Attempt3: `3:56:37 PM [vite] (client) Re-optimizing dependencies because vite config has changed` (cửa mở 15:56:36Z).
- Load1 theo sau mỗi lần re-opt (load-mid, sampler 2 s): attempt1 0,79 → 6,55 (đỉnh 15:41:17–21Z); attempt2 1,49 → 5,06; attempt3 0,92 → 5,42 (đỉnh 15:57:38–42Z). Vite server là process riêng mỗi attempt (pid attempt1 82055 ≠ pid attempt3 90944) — mỗi lần khởi động lạnh lại re-optimize.
- Không phải do cây thay đổi trong lúc đo: tree md5 GIỮ b2a2860b từ poll #67 (15:31:39Z) suốt các attempt. Config tạm `vite.t4-temp.config.mjs` mtime 2026-11-24 (không viết lại mỗi attempt). Deps cache tồn tại (`apps/web/node_modules/.vite/deps`, _metadata.json) nhưng được viết lại lúc 16:01:28Z (sau attempt3) — trạng thái cache trong lúc đo không tái dựng được từ mtime hiện tại; cơ chế cache-miss chính xác giao T4-197 xác định.
- **Hệ quả:** B2 (load1 giữa lượt ≤ 4) VI PHẠM cả 3 attempt → cả 3 lượt đều không dùng được verdict dù 20/20 pass. Đề xuất: T4-197 warm vite server + xác minh deps cache TRƯỚC khi mở cửa yên (để chi phí re-opt rơi ngoài pha (b)), hoặc giữ một vite server sống xuyên các attempt.
- **Phân biệt quan trọng (ghi trung thực): median cao KHÔNG giải thích hết bằng load ramp.** Pass 1 đã chậm TRƯỚC khi ramp bắt đầu: attempt1 pass 1 median 78,5 (load1 mean 1,96; ramp bắt đầu 15:40:37Z, pass 1 chạy ~15:40:15–19Z); attempt2 pass 1 median 65,0 (load1 mean 1,80; ramp bắt đầu ~15:50:02Z). Như attempt1 đợt 195 (chậm từ pass 1 trước khi P3 khởi động). Có thêm nguyên nhân nội tại (có thể chính chi phí flip F3 / build webkit) — T4-196 phân tích; T2 chỉ ghi số đo + loại trừ tải ngoài.

### T4-196 attempts (số thô từ file gốc T4; đã đối chiếu với T4-196 LIMITS đóng 16:19:51Z — KHỚP TỪNG SỐ)

- Attempt1: [15:40:01Z, 15:43:51Z] (lock hold 230 s), tickCost median **84,0 ms** (n=384, p90 110,0), coverage 1/1, B1 VI PHẠM (load5 cuối 2,89 > 2,5), B2(load) VI PHẠM (load1_max 6,55), B3/B4/B5 ĐẠT → LOP-B **VI PHẠM**. **KHÔNG hợp lệ.**
- Attempt2: [15:49:10Z, 15:52:53Z] (lock hold 223 s), tickCost median **67,0 ms** (n=503, p90 94,0), coverage 1/1, B1 ĐẠT (load5 cuối 2,43), B2(load) VI PHẠM (load1_max 5,06), B3/B4/B5 ĐẠT → LOP-B **VI PHẠM**. **KHÔNG hợp lệ.**
- Attempt3: [15:56:36Z, 16:00:18Z] (lock hold 222 s), tickCost median **67,0 ms** (n=485, p90 93,6), poller ghi "20/20 NHƯNG LỚP B VI PHẠM — lượt nhiễm tải, KHÔNG dùng verdict", B1 ĐẠT (load5 cuối 2,05), B2(load) VI PHẠM (load1_max 5,42), B3/B4/B5 ĐẠT → LOP-B **VI PHẠM**. **KHÔNG hợp lệ.** Lưu ý: file coverage-check attempt3 ghi "(c2)=0 — không có seq để kiểm coverage" (khác poller "20/20" — 20/20 là số pass hoàn thành, còn check coverage không tìm thấy seq c2; T4-196 làm rõ trong LIMITS của mình; không đổi verdict vì median + B2 đã fail).
- Vite-lock: trong các cửa sổ attempt chỉ có 3 cặp ACQUIRED/RELEASED của t4 (port 5187) — **không có luồng nào khác giữ lock trong cửa sổ attempt**.
- **Lượt yên #64: KHÔNG CÓ LƯỢT HỢP LỆ (0/3).** Chuỗi lượt yên 1 → 0 (đề xuất; tiền lệ đợt 179: chuỗi tính lại từ 0 sau khi đứt).

### Kiểm chồng pha (b) từng attempt (ps-before/after + find mtime)

- Attempt1 [15:40:01Z, 15:43:51Z]: ps-before/after chỉ có sampler T9-196 (pid 8193, light, designated) + vite T4 + waiter T8-196 (pid 7532, bash `wait-t4-t5-196t8.sh`, chỉ poll/tail log — nhẹ). Find mtime: **1 file duy nhất** — `hidden_files/round196-p3.done` mtime 15:43:45Z (2.568 B, 6 s trước khi lock nhả) — P3 ghi cờ xong việc trong W1. **Không phải vi phạm** (1 lần ghi file nhỏ, mili-giây; 0 bằng chứng ảnh hưởng — attempt1 đã chậm từ pass 1; T4 ghi là "cờ nhẹ" F-196-T4-7). **0 chồng nặng.** (Đính chính: lần kiểm đầu của T2 chỉ tìm trong round196-p1/p2 + /tmp nên bỏ sót file .done này — xem F-196-T2-11; đã kiểm lại toàn hidden_files/ root.)
- Attempt2 [15:49:10Z, 15:52:53Z]: ps-before/after như trên (waiter T8 + sampler T9). Find mtime: **1 file duy nhất** — `/tmp/round196-p2/headed-196-p2-bob.mjs` mtime 15:49:46.686Z (36 s sau khi cửa mở) — P2 lưu/sửa script (1 lần ghi, mili-giây); KHÔNG có file nào khác của P2 trong cửa sổ (không chrome-userdata, không log mới — headed run của P2 kết thúc 15:14:11Z). **Không phải vi phạm** (ghi lại để luồng sau khỏi nhầm thành chạy headed). **0 chồng ngoài.**
- Attempt3 [15:56:36Z, 16:00:18Z]: ps-before/after chỉ có sampler T9 + vite T4 (classb liệt kê đúng 2 nhóm này). T8: **0 file** trong [15:49:10Z, 16:00:18Z]. P4: không chạy nào sau 15:39:31Z. **0 chồng ngoài.**
- T56-196 chunks (14:56–15:02Z) + suite (14:52–14:53Z): toàn bộ TRƯỚC attempt1 (15:40:01Z) — không thể chồng; P3 probe cuối 15:38:55Z, P1 chrome cuối 15:24:58Z, P4 run cuối 15:39:31Z. **0 chồng.**
- **F-196-T4-7 (T4 giao T2 phán — 2 mục, đều KHÔNG phải vi phạm):** (1) P3 .done trong W1 — xem bullet attempt1 trên (cờ nhẹ, 1 lần ghi 2,5 KB). (2) P2 vite headed (:5690) chặn gate polls #88 (15:55:04Z, blk=1) + #89 (15:55:50Z, blk=1), làm attempt3 chậm ~90 s (cửa mở poll #90 15:56:35Z khi vite đã tắt, blockers=0). Vite này chạy GIỮA attempt2 (kết thúc 15:52:53Z) và attempt3 (bắt đầu 15:56:36Z) — KHÔNG chồng pha (b) nào (không chạy lúc 15:49:10Z theo ps-before W2; 0 file P2 nào ghi trong W2). Trì hoãn cửa yên không phải chồng pha đo — **không phải vi phạm**, ghi sổ làm lưu ý (P2 nên tắt vite headed trước khi T4 poll lại gate).

### Tự kiểm của chính T2 (ghi chép trung thực, không phải vi phạm)

- Trong đợt 196, T2 chạy các find nặng: blind196-gen (15:03–15:07Z, find toàn /home/hatch), hole-recheck196 (find toàn cây + /var/log), m56-196 (find ~/workspace), eperm-sweep196 (quét *.log). Tất cả đều chạy trong lúc T4-196 đang POLL (chưa có attempt nào; gate check trước mỗi scope đều clear, waits=0). Không có pha (b) nào để chồng — 0 vi phạm. (Khác đợt 195, khi đuôi investigate/evidence-check của T2 chồng W1 vài giây.)

## §8. Lượt yên #64 + live-check #15 + POSTBOOT_PASS #122/#123

- **Lượt yên #64: KHÔNG CÓ LƯỢT HỢP LỆ** (0/3 attempt hợp lệ: median 84,0/67,0/67,0 đều > 60; cả 3 đều B2 VI PHẠM vì tự-tải vite re-opt — xem §7). Chuỗi lượt yên hợp lệ **1 → 0** (ĐỨT; đề xuất theo tiền lệ đợt 179). Đợt #63: 1/3 attempt hợp lệ (chuỗi 0 → 1).
- **FULL PASS đợt 196: KHÔNG CÓ** (chân lượt yên thiếu — cần 1 lượt yên hợp lệ). Chuỗi full pass **1 → 0** (đề xuất; parent quyết ở §14.2-196 — (b)).
- **Live-check #15: KHÔNG ĐẠT** (không có attempt hợp lệ để đối chiếu live; T9-196 LIMITS chưa đóng lúc T2 viết — T9 xác nhận). Chuỗi live ĐẠT **10 → 0** (đề xuất). Sampler-196 đang sống (mẫu cuối 16:10:42Z, load1 2,24); auto-trigger GIỮ LIVE, **0 FIRE** (trigger=watch, consec=0); V4 GIỮ LIVE (0 trigger, 0 FP — chờ T8-196 xác nhận replay).
- **POSTBOOT_PASS #122: KHÔNG CÓ.** Không có file postboot nào cho boot 2f268a28 (T56-195 kết thúc ~09:31Z trên #121; T56-196 bắt đầu trên #123). Như #120 đợt 195 (parent (c)-195 tính "không cờ", tổng 28 → 29) — đề xuất tính #122 tương tự: tổng boot không cờ **29 → 30**.
- **POSTBOOT_PASS #123: CÓ** — file `round196-t56/POSTBOOT_PASS` ghi 14:41:58Z, poll=0, "replay-day-du" (dpkg 1477 dòng; cache 171 .deb; lists 37), exit 0. T4-196 poller dùng làm gate0 suốt đợt. (File POSTBOOT_PASS-8c4aa907 (#121) được giữ lại làm chứng cứ cũ.)
- Watcher-196 đang sống (poll cuối 16:11:14Z lúc kiểm, boot bc09b26e, dpkg_lines 1477). Watcher-195 đã CHẾT (poll cuối 10:14:39Z, không dòng END — xem §1 caveat).

## §9. F-notes đợt 196 (lỗi của chính T2 + phát hiện)

- **F-196-T2-1:** xem §5 (heartbeat EPERM stale ở n=112, đã sửa trước khi probe).
- **F-196-T2-2 (gõ sai epoch gap ở sessions-196 lần chạy 1):** lần chạy đầu truyền nhầm epoch của HÔM NAY (14:54:56Z/14:59:20Z/16:34:48Z/16:56:14Z 26/11) thay vì epoch của R/U gap đứng (11:15:29Z/11:35:56Z/17:20:48Z/17:36:14Z 21/11); output lần 1 ghi "4 log trong R-gap" là vô nghĩa. Đã chạy lại với epoch đúng (tính bằng python): R-gap 0, U-gap 0. Cùng lớp F-195-T2-2(a). Bài học: epoch gap đứng phải lấy từ script/docstring, không gõ tay từ đầu.
- **F-196-T2-3 (SIGPIPE lặp lại — cùng bẫy F-195-T2-9):** m56-196.py lần chạy 1 bị cắt giữa chừng vì `| tee m56-196.log | head -8` — head đóng pipe sớm, tee chết SIGPIPE, python chết theo. Đã chạy lại redirect thẳng ra file, đủ 4 mục. Bài học: script dài thì redirect thẳng, KHÔNG pipe qua head — lần thứ hai mắc cùng bẫy.
- **F-196-T2-4 (sed đổi kép ở eperm-sweep196.py — cùng lớp F-195-T2-5):** sed đổi cả W0 lẫn W1 thành 14:59:28Z (lần -e thứ hai thay cả timestamp vừa tạo ở lần -e thứ nhất); script fail assert W0<W1. Đã sửa W0 về 08:47:12Z bằng muse.edit (không chạy lại sed). Bài học: không dùng sed nhiều -e thay cùng chuỗi timestamp; sửa bằng tay.
- **F-196-T2-5 (số đếm known-base hole-recheck lệch 20 giây so với merged-195):** known base 10.179 vs 10.199 lúc merged-195 — do 288 entry trong list 195 bị xóa khỏi đĩa giữa hai đợt (tmp churn + 11 hidden_files + 1 outside). Không ảnh hưởng verdict (mọi NEW đều đã triage tay; các mark NEW đều sau B1-195 nên không thể nằm trong base cũ).
- **F-196-P4-3b:** xem §7 (ffmpeg P4 trong ps-before W3 đợt 195 — VI PHẠM NHẸ; quy kết P3→P4 đã sửa).
- **F-195-P4-3b (mơ hồ một/two lần chạy):** xem §7.
- **F-196-T2-10 (vite T4 re-opt deps đầu mỗi attempt — tìm ra, không phải vi phạm):** xem §7. Vite re-optimize 3 lần (15:40:03Z/15:49:12Z/15:56:37Z), load1 lên 6,55/5,06/5,42, phá B2 cả 3 attempt; không có luồng khác trong ps-before/after; tree md5 giữ nguyên — tự-tải, không phải tải ngoài. **Đối chiếu T4-196 LIMITS (đóng 16:19:51Z, sau khi T2 viết §7):** T4 xác nhận 0/3 hợp lệ, median 84,0/67,0/67,0, load1_max 6,55/5,06/5,42, chuỗi lượt yên 1 → 0, FULL PASS không có, live #15 không đạt — **khớp từng số** với §7/§8 của T2. Phân tích spike của T4 (W1 WebKit 63,2% + MiniBrowser 26,0%; W3 WebKit 70,8% + MiniBrowser 29,6% — "đều tự-tải là chính") củng cố kết luận tự-tải; re-opt vite là cơ chế tự-tải BỔ SUNG do T2 phát hiện từ log vite (T4 không nhắc re-opt trong LIMITS của mình).
- **F-196-T2-11 (find phạm vi hẹp — lỗi của chính T2, bắt được nhờ đối chiếu T4 LIMITS):** lần kiểm chồng pha (b) attempt1 của T2 chỉ tìm trong `round196-p1/`, `round196-p2/`, `/tmp/round196-p3-audio-profile`, `/tmp/round196-p2` nên kết luận "0 file" — SAI: `hidden_files/round196-p3.done` (mtime 15:43:45Z) nằm trong W1 nhưng ở thư mục gốc hidden_files/, ngoài phạm vi find. T4-196 LIMITS (F-196-T4-7) nêu ra; T2 đã kiểm lại toàn hidden_files/ root (W1: chỉ file này; W2/W3: 0 file) và sửa §7. Bài học: kiểm chồng pha phải find cả thư mục gốc hidden_files/ (nơi đặt *.done), không chỉ thư mục round + /tmp.

## §10. Đề xuất cho parent (§14.2-196)

- (a) (m) #121 = KHÔNG CÓ ĐIỂM (CUỐI); n ứng viên GIỮ 54/55.
- (b) (m) #122 = KHÔNG CÓ ĐIỂM (CUỐI); n ứng viên GIỮ 54/55.
- (c) (m) #123 RAW 0 requeue (phân loại CUỐI thuộc T2-197); n ứng viên GIỮ 54/55.
- (d) INSIDE đếm A: KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7. Đếm B: B-#121 TRUE → chuỗi B 1 → 2 (nếu parent chấp nhận); B-#122 FALSE (tham chiếu).
- (e) Boot #123 (bc09b26e, btime 14:30:16Z, gap #122→#123 = 11.556 s) = ứng viên #123; (m) #123 thuộc T2-197.
- (f) EPERM probe #115 ok=2 fail=0; sweep 0 sóng thật. F-196-T2-1: heartbeat stale đã sửa.
- (g) Mù: R/S/T/U không đổi trừ 2 hố mới H-U22 (6.771 s, NEW=6 toàn kỹ thuật) + H-U23 (4.861 s, NEW=1 mark biên); hole-recheck lần 39: NEW=0 mọi hố cũ (H-E1-88 lần thứ 38 liên tiếp 0 mới).
- (h) (m) #56 VẪN CÓ ĐIỀU KIỆN (160 hướng, lần 38).
- (i) Bằng chứng: 41-list 0/41, 349-list 0/349, #100 0/6; purge vẫn ăn log mới hơn (tổng proc_*.log 261 → 235).
- (j) F-195-P4-3b VI PHẠM NHẸ (ffmpeg P4 trong ps-before W3 đợt 195 chồng pha (b) attempt3 ≥14 s; quy kết P3→P4 đã sửa; không đổi verdict đợt 195); chuỗi 0 vi phạm GIỮ 0.
- (k) Vi phạm đợt 196: **0 vi phạm bởi luồng khác**; F-196-T2-10 (vite T4 re-opt deps ở đầu mỗi attempt → tự-tải phá B2 cả 3 attempt — tìm ra, không phải vi phạm); F-196-T4-7 (P3 .done trong W1 + P2 vite chặn gate — đều không phải vi phạm); chuỗi 0 vi phạm GIỮ 0.
- (l) Lượt yên #64 **KHÔNG CÓ LƯỢT HỢP LỆ (0/3)** → chuỗi lượt yên 1 → 0; FULL PASS **KHÔNG CÓ** → chuỗi 1 → 0; live-check #15 **KHÔNG ĐẠT** → chuỗi 10 → 0 (T9-196 xác nhận); POSTBOOT_PASS #122 **KHÔNG CÓ** (tổng boot không cờ 29 → 30, đề xuất), #123 **CÓ** (poll=0).
- (m) Run 200 SUCCEEDED, claimed→finished 9 s — KHÔNG phải CA; run 201 SUCCEEDED, 6 s — KHÔNG phải CA; run 202 đang chạy (T7-196 quyết CA).
- (n) Đính chính T01-196 appendix: "watcher-195 CHẾT theo reboot #122" là suy luận (poll cuối cách btime #122 63 phút), không phải quan sát trực tiếp — xem §1 (m) #122 caveat.
- (o) F-196-T2-10: T4-197 warm vite server + xác minh deps cache TRƯỚC khi mở cửa yên (chi phí re-opt phải rơi ngoài pha (b)); nếu giữ vite server sống xuyên các attempt thì không re-opt mỗi lần. T4-196 LIMITS ĐÃ đóng (16:19:51Z) và đối chiếu KHỚP TỪNG SỐ với §7/§8; T9-196 LIMITS chưa đóng lúc T2 viết — live-check #15 chờ T9 xác nhận.

## §11. Files (luồng T2 đợt 196)

- LIMITS này: `~/workspace/repo-1/docs/PHASE9_ROUND196_T2_EPERM_LIMITS.md`
- Thư mục làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t2/`:
  - `m-check196.py` + `m-check196.txt` ((m) + INSIDE + runs)
  - `eperm-sweep196.py` + `eperm-sweep196.log` (sweep #115)
  - `blind196-gen.py` + `blind196-b1.txt` + `blind196-{repo-1,hidden_files,outside,tmp}.txt` + `blind196-gen.log`
  - `blind196-merged.py` + `blind196-merged.log`
  - `blind196-content.py` + `blind196-content.log`
  - `blind196-sessions.py` + `blind196-sessions.log` + `sessions-9797.txt`
  - `witness196.py` + `blind196-witness.log`
  - `blind196-investigate.py` + `blind196-investigate.log`
  - `hole-recheck196.py` + `hole-recheck196.log` + `holerecheck-all.txt`
  - `m56-196.py` + `m56-196.log` ((m) #56)
  - `evidence-check196.py` + `evidence-check196.log` + `evidence-check196-{349,missing,newmissing,41missing}.txt`
  - `adapt-*.py` (script chuyển 195→196 có đích, tránh sed mù)
- EPERM probe: `/tmp/eperm-probe-tmp-115.txt` + `hidden_files/eperm-probe-ws-115.txt`; log `hidden_files/eperm-probe-v2.log`; heartbeat `hidden_files/eperm-probe-v2.heartbeat`
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round196-t2-eperm.txt`
- **Lưu ý kích thước:** LIMITS này 43.715 B — VƯỢT trần push 37.768 B (như T4-195 44.762 B và T56-195 42.026 B đợt 195); lúc push cần ENABLE_PRIVSEP=0.
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round196-t2.done`
- Nguồn đọc: `docs/PHASE9_ROUND195_T2_EPERM_LIMITS.md`, `docs/PHASE9_ROUND195_LIMITS.md` (§14.2, SẠCH), `hidden_files/round196-t01/{boot-survey-196t01.txt,appendix196.txt}`, `hidden_files/round196-t4/{poll-t4.log,chain-t4.log,analyze-t4-attempt*-bc09b26e-*.txt,classb-t4-attempt*-bc09b26e.txt,load-mid-t4-attempt*-bc09b26e.log,ps-before/after-t4-attempt*-bc09b26e.txt,vite-5187-t4-attempt*-bc09b26e.log}`, `hidden_files/vite-lock-v2.log`, `hidden_files/round196-t56/{POSTBOOT_PASS,gate-monitor-196.log,suite-196.log}`, `hidden_files/round196-t9/ram-sampler.log`, `hidden_files/round195-t4/{ps-before-t4-attempt3-8c4aa907.txt,ps-after-t4-attempt2/3-8c4aa907.txt,load-mid-t4-attempt2/3-8c4aa907.log,poll-t4.log}`, `hidden_files/round195-t56/replay-watch-195.log`, `docs/PHASE9_ROUND195_T4_WEBKIT_QUIET63_LIMITS.md` (§F-195-P3-2), `docs/PHASE9_ROUND195_P4_PARITY_VERIFY_LIMITS.md` (§N11b + F-195-P4-3).
