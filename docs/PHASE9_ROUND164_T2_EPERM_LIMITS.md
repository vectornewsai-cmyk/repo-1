# PHASE9 ROUND 164 — T2 (mù #96? sơ bộ + EPERM + INSIDE #66/#67 + (m) #66 đối chiếu + (m) #67) — LIMITS

**Đợt 164 mở 17:35:51Z 21/11/2026. Hạn cờ ~20:00Z, hạn cứng đóng 20:30Z. T2 viết 18:05Z.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

## 0. Kết luận trước (headline)

1. **Probe EPERM #83: 17:44:45Z, boot f1d4ce1a, ok=2 fail=0, log 238→241 (+3 đúng mẫu). Cửa sổ 14:41:28Z → 17:44:45Z = 10.997 s. 0 sóng EPERM thật trong cửa sổ** (sweep #83: 149 file `*.log`, 1 file có hit, 3 lần đều là "sóng EPERM đã tắt" trong o8-163t8.log; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted").
2. **Boot #67 (f1d4ce1a, btime 17:33:27Z) XÁC NHẬN độc lập — giờ thật** (T2-164 6+ nguồn + F127? 3 server + drift 0,9958; khớp T0-164 9 nguồn, T7-164, T5-164).
3. **Mù #96? (#64) SƠ BỘ MỞ qua đoạn R** (file 1.238 s / union-A 1.222 s / union-B 1.211 s, đều vượt sàn 1.147 s). S/T đóng (S file 843 s / union-A 632 s / union-B 591 s; T file 307 s / union-A 31 s). **Điều tra đầy đủ giao T2-165.** #95?/#94?/#77? giữ nguyên verdict đợt 163 (không có bằng chứng mới).
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ TÁM: 345 hit, 0 mốc mới.**
5. **INSIDE: #66 INSIDE dải FULL112 → chuỗi 1 (từ #65) LÊN 2; #67 INSIDE dải FULL113 → chuỗi 2 LÊN 3.** Cả hai dải CÓ ĐIỀU KIỆN (gap #65/#66 danh nghĩa, chưa vào CERT/FULL chính thức); biên thoải mái (~3,3–3,9 ks).
6. **(m) #66 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 3 nguồn khớp):** requeue 16:07:30.460Z = btime +45,460 s ∈ [33; 49,8]. **NẾU parent CHẤP NHẬN: n ứng viên 20→21 (nhánh khuyến nghị: 18 dương + 3 âm) hoặc 21→22 (nhánh #56 ÂM: 18 dương + 4 âm). n chính thức GIỮ 14.**
7. **(m) #67 — KHÔNG PHẢI ĐIỂM:** run 163 finished 17:18:13Z (914 s trước btime), 0 requeue, run 164 started 144 s sau btime (chữ ký #52/#61/#64/#65).
8. **(m) #56: KHÔNG thu hẹp được lần thứ BẢY** (5 hướng mới đều âm tính). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN.**
9. **RAM trong cửa sổ probe #83: peak 57,60% guard; 0 mẫu ≥ guard; birefnet 0 lần thử, lần thứ 18 liên tiếp.** WFS #70 chênh 0 (992+25=1.017) lần thứ 70.
10. **Nhãn n: cơ sở hiện tại (chưa cộng #66) là 20/21** (quyết (z) đợt 163 — không lặp lỗi F-163-T1-5). Xem §4.3.
11. **Gap #65 danh nghĩa 11.979 s CHƯA đưa vào CERT/FULL chính thức** (chờ #95?/#96? đóng — quyết (dd) đợt 163); chỉ dùng làm cơ sở DANH NGHĨA cho FULL112/FULL113. Gap #66 danh nghĩa 5.508 s tương tự cho FULL113.

---

## 1. Checklist probe EPERM #83

| Hạng mục | Kết quả |
|---|---|
| Probe #82 (trước, lần trước) | 14:41:28Z, boot 1c1cf10c, n=82 |
| `status` 17:44:40Z | DEAD/STALE, heartbeat n=82, ts 14:41:28Z, boot 1c1cf10c, tuổi 10.992 s, exit 1 |
| Log trước probe | 238 dòng (đã +1 DEAD kể từ đợt 163) |
| **`once` 17:44:45Z — probe #83** | **boot=f1d4ce1a, ok=2 fail=0, exit 0** |
| Log sau probe | 241 dòng (238→241 = +3 đúng mẫu mọi lượt) |
| Heartbeat mới | pid=19390, ts 17:44:45Z, boot f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f, n=83 |
| `status` lại | ALIVE, tuổi 6 s, n=83, exit 0 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #83** | **14:41:28Z → 17:44:45Z = 10.997 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~245,8 h trước probe #83).

## 2. Điều tra mù #96? (#64) — SƠ BỘ

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 17:44:45Z] = 23.367 s** (btime #64 → probe #83). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 17:44:45] | 5.880 s | btime #66 → probe #83 (thuộc #97?, chỉ tham chiếu) |

(F-164-T2-1: docstring script `blind9696-investigate.py` ban đầu ghi đoạn T = 5.537 s — SAI; đúng là 5.117 s. Số script in đúng; đã sửa docstring trước khi viết LIMITS.)

Quét tươi (`blind9696-investigate.py`): repo-1 29 file, hidden_files 821, ngoài cây 588, /tmp 631, fifth 2 → merged **610 mốc giây duy nhất**. Quét cả cây `/home/hatch` + `/var/log` bằng `find` mtime (hole-recheck, §2.6).

### 2.2 Đồng hồ, reboot #67 + #66 (T7-164 + T0-164/T5-164 + T2-164 đối chiếu độc lập)

**Reboot #67 — T2-164 xác minh độc lập (6+ nguồn, ~17:46Z):**
- boot_id f1d4ce1a; `/proc/stat` btime 1795282407 = 17:33:27Z; `uptime -s` = 17:33:27Z; `/proc/uptime` 715,53 s → boot_est 1795282407 = btime chính xác từng giây; `/proc/1` mtime 17:33:40.945Z (+13,9 s); journal idx 0 duy nhất, first entry 17:33:41Z (+14 s); wtmp begins 17:33:41Z (+14 s), `last` reboot 17:33 still running.
- F127? (`f127.py`, 17:45:13Z): example.com +0,344 s; google.com +0,002 s; cloudflare.com −0,360 s → **F127? ≈ −0,36…+0,34 s, đủ 3 server**, trong ±1 s.
- Drift test (`drift-test.py`, xong 17:48:17Z): server elapsed 181,0 s, local elapsed 180,2 s, **tỉ lệ 0,9958 ≈ 1,0**, offset change +0,752 s.
- **Kết luận: btime #67 = 17:33:27Z là GIỜ THẬT.**

**Khớp chéo (3 nguồn độc lập):** T0-164 (9 nguồn: uptime bracket ×3 = 1795282407.32; journal 82 entry, 0 negative step, max gap 69,79 s; /proc/1 start 17:33:40,95Z; Cloudflare ±1 s; dmesg KHÔNG thử — EPERM đứng) + T7-164 read #1 + T5-164 — cùng kết luận, cùng btime từng giây. T0-164: T10-163 .done mtime 17:16:37Z → btime #67 muộn hơn 16m50s (1.010 s) — reboot SAU khi T10-163 đóng sổ; hoạt động file cuối trên #66: build-loop-log.md 17:21:23Z → boot #66 chết trong (17:21:23Z, 17:33:27Z]; overlap (17:33:27Z → 17:35:51Z): 0 file đổi trong hidden_files, 0 trong repo-1.

**Gap chuỗi (btime−btime, quyết (r) đợt 161):** #64→#65 = 11.979 s; #65→#66 = 5.508 s; **#66→#67 = 5.202 s**.

**Run 163 — kết cục (T7-164 read #1 + T0-164 đọc DB trực tiếp, khớp nhau):** **SUCCEEDED 17:18:13Z** (event 17:18:13.605Z, eid 9799), wall từ started gốc 9.742 s, **margin 1.058 s** tới hạn 17:35:51Z (hẹp hơn run 162 đúng 7 s; hẹp nhất 5 đợt gần nhất 159–163), claimed→finished 8 s, attempt 1, **1 lần viết lại duy nhất (tại #66)**, 5 event (9756, 9781, 9782, 9783, 9799), 0 event sau succeeded. T10-163 đóng ~17:16:37Z — run 163 finish 96 s SAU khi T10 đóng (cùng mẫu 161/162). **Finished TRƯỚC btime #67 914 s** — #67 KHÔNG giết run 163. Run 164 (0a5f9bc9-c4f4-4d68-96c7-f0baa5455606, sched 17:35:51Z): running, jitter 0 s (lần thứ 17 liên tiếp), hạn 20:35:51Z; kết cục thuộc T7-165.

**POSTBOOT_PASS / watcher (T5-164, 17:57Z):** #66 **CHƯA CÓ** (boot thứ 8 không có); #67 **ĐÃ CÓ 17:54:38Z** (boot+21m11s, replay đầy đủ, poll=0; postboot độc lập exit 0 17:55:51Z, 11/11 gói + 5/5 lib). #65/#64 CÒN; #63 KHÔNG CÓ. Watcher-163 chết theo #66 (poll cuối 16:06:54Z, 164 poll — T5-164 xác minh độc lập); watcher-164 START 17:40:59Z pid 5451, END 20:30:00Z; khoảng không-watcher 16:06:54Z → 17:40:59Z = 1h34m05s (T0-164).

**Marker:** CÒN — **19 reboot #49–#67** (T0-164 đếm độc lập 19; T5-164 khớp; parent quyết (q) đợt 163 xác nhận 17 tới #65, quyết (e) xác nhận #66 → 18, +#67 → 19).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) |
| S [11:38:28, 14:41:28] | 254 | 482 | Đóng |
| T [14:41:28, 16:06:45] | 238 | 680 | Đóng (sampler-163 45 dòng #66 + watcher-163 163 poll) |
| U [16:06:45, 17:44:45] | 104 | 853 | Đóng (hố U2 tách bởi mốc hệ thống #67) |

**Nội dung trong R (56 file-marks, kiểm tay):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B.

**Nội dung khác (content script, `blind9696-content.py`):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (predicate chặt `^timestamp boot=d9a8d1ce poll ` — bài học F-163-T2-4; loose `grep -c "poll"` = 334, T2-163 ghi 333 — chênh 1, không ảnh hưởng union; file tổng 336 dòng = 331 poll + 1 START + 1 MONITOR + 3 postboot 11:40:00Z, khớp T5-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z — sampler dừng ~16:52Z, KHÔNG có dòng 17:15–17:45Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c — T10-163 §10.5 (ix); kỳ vọng "0" trong docstring script là sai — xem F-164-T2-3).**

**Jump witness (hoạt động) tại #64/#65/#66/#67: đều = 0** (`blind9696-sessions.py`, 84 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 16). Mọi hit regex đều là trích dẫn, đã kiểm tay từng hit:
- #64 (4 hit): proc_d8365be752b7.log, proc_32c9bb12db04.log, proc_9db5c8fba228.log, proc_b70bb0edc372.log (trích btime/dispatch/hợp hole-recheck).
- #65 (3 hit): như trên trừ proc_32c9bb12db04.
- #66 (4 hit): proc_f4d2cc5e81cf.log, proc_471dd8b624d5.log + 2 log trích hợp/btime.
- #67 (4 hit): proc_9db5c8fba228.log, proc_7aedeeb5297e.log (T7-164), proc_6ecb5bcb64ad.log, proc_b70bb0edc372.log.
- Exec-log content-ts trong hố R union (11:15:29–11:35:56): 4 hit, 0 mốc hoạt động: 11:35:51Z (header "== files modified 11:15:18-11:35:51Z (overlap window) ==" — trích biên); 11:35:40Z (mốc dpkg thật, đã tính vào union); 11:16:22Z (trích biên hố H-P1-old); 11:26:05Z (trích btime reboot #48 ngày 20/11).
- Exec-log content-ts trong hố U2 (17:22:25–17:35:37): 2 hit, cả hai đều là 17:33:27Z = chính btime #67 (trích trong log T7-164 + agent c09b0b9e) — 0 mốc hoạt động.
- (F-164-T2-2: lần chạy sessions.py đầu tiên truyền sai epoch đối số (cửa sổ 17:35:29–17:55:56 / 18:42:25–18:55:37); bắt được nhờ nhãn in ra, chạy lại với epoch đúng đã kiểm bằng python. Không ảnh hưởng số liệu.)

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (sơ bộ)** |
| S | 843 s | 632 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | 906 s | 792 s | 676 s | ĐÓNG (thuộc #97?, tham chiếu) |

Union-A = mốc file + mốc hệ thống + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z). **R: mọi cách đếm đều MỞ.** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ. Kiểm chéo với mốc đã mất của T2-162 (11:16:22Z + 11:35:35Z): 11:16:22 → 11:35:40 = 1.158 s, vẫn MỞ đúng 11 s.

S khớp T2-163 (file 843 s; union-B giống hệt 591 s; union-A chênh 16 s — 632 vs 616 — do mốc file 14:35:37Z bị mất từ lúc đó). T đóng chắc (31 s). U: hố U2 17:22:25–17:35:37 tách thành 676 s + 116 s nhờ mốc hệ thống #67 17:33:41Z.

**Kết luận sơ bộ: #96? SƠ BỘ MỞ qua đoạn R. Điều tra đầy đủ giao T2-165.**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 163; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL112** (gap #65 NOMINAL 11.979 s, CÓ ĐIỀU KIỆN): n=112, mean 1h40'38", median 1h53'21", p10 0h26'05" (1.565 s), p90 2h26'59" (8.819 s), sd 0h56'59", min 0h00'55", max 5h43'18"; trong 90–150'=59, <60'=26, >180'=8, >240'=3.
**FULL113** (gap #66 NOMINAL 5.508 s, CÓ ĐIỀU KIỆN): n=113, mean 1h40'33", median 1h53'00", p10 0h26'06" (1.566 s), p90 2h26'51" (8.811 s), sd 0h56'44"; trong 90–150'=60, <60'=26, >180'=8, >240'=3.

Tái tính khớp T2-163 từng giây (FULL110 band [10:56:37Z, 12:56:37Z], #64 INSIDE biên 1.121/6.079 s; FULL111 band [11:41:21Z, 13:41:06Z], #65 NGOÀI muộn 3.231 s).

**INSIDE:**
- **#66 INSIDE dải FULL112 [15:01:01Z, 17:01:56Z] neo 14:34:57Z** (biên dưới 3.944 s, biên trên 3.311 s — thoải mái, không mỏng) → **chuỗi 1 (từ #65) LÊN 2**.
- **#67 INSIDE dải FULL113 [16:32:51Z, 18:33:36Z] neo 16:06:45Z** (biên dưới 3.636 s, biên trên 3.609 s) → **chuỗi 2 LÊN 3**.
- Đối chiếu vs dải còn hiệu lực: #66 NGOÀI FULL111 (muộn 8.739 s); #67 NGOÀI FULL112 (muộn 1.891 s) — chỉ để đối chiếu, không phải dải đúng phương pháp.
- Tốc độ reboot: tới #67: 143 reboot / 261,25 h = 1 lần / 109,6 phút (tới #65: 141/258,28 h = 109,9; tới #66: 142/259,81 h = 109,8).

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 17:44:45Z 21/11]: **6.447 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000).

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:22:25, 17:35:37 — bắc qua btime #67) | 5 inside = 2 trap + **3 MỚI: /var/log/wtmp + btmp + lastlog, mtime 17:33:41Z** — mốc hệ thống đầu boot #67 (+14 s sau btime; khớp journal first entry 17:33:41Z). Không phải mốc hoạt động boot cũ. |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **345 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ TÁM liên tiếp 0 mốc mới** |

Known base: 610 mốc giây đợt này; base #88? T2-157: 557 giây.

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 164 | Cơ sở |
|---|---|---|
| #96? (#64) | **SƠ BỘ MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng) | Điều tra đầy đủ giao T2-165 |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 163) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 8: 345 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? sơ bộ mở — chưa đổi được khi chưa điều tra đầy đủ).

---

## 3. Mù #88? + #77? + #95?/#94? — giữ nguyên

- **#88?:** hole-recheck lần thứ TÁM (§2.6): 345 hit, 0 mốc mới → **VẪN MỞ**.
- **#77?:** không có bằng chứng mới đợt này → **VẪN MỞ**.
- **#95?/#94?:** không có bằng chứng mới đợt này → **MỞ** (giữ nguyên verdict đợt 163). Không đo lại vì không có gì mới để đo (luật gap: chỉ kiểm lại khi có bằng chứng mới).
- **#96?:** SƠ BỘ MỞ (§2.4–2.6); điều tra đầy đủ thuộc T2-165.

---

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp cửa lần thứ BẢY: KHÔNG ĐẠT

Cửa hiện tại (Model 1, quyết (d) đợt 157): **R ∈ [2,56251; 2,66817), J ∈ [2,566; 2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN.** Dải requeue dương: **[33; 49,8] s** (max 49,761 s từ #50).

Năm hướng MỚI đã thử đợt này (không lặp 5 hướng âm tính đợt 163), tất cả âm tính:

1. **git log committer-date trong cửa D [19:04:44Z, 20:22:43Z] 20/11: 0 repo** — không có `.git` nào dưới `~/workspace` (maxdepth 3 rỗng; `~/workspace/repo-1/.git` không tồn tại — repo local chỉ là bản copy, push qua API).
2. **memory log `~/memory/2026-11-20.md`: 2 hit grep "20:1x/20:2x" đều là trích dẫn 19/11 20:16:46Z** (T10 đợt 148 đóng) — 0 neo mới. File mtime 20/11 18:13Z (trước cửa D).
3. **`/var/log`: không có auth.log, không có syslog.** alternatives.log (900 B): chỉ có entry 21/11 (17:50:41Z + 17:53:25Z, boot hiện tại), 0 dòng 20/11. fontconfig.log: không có timestamp. apt history.log: 0 dòng 20/11 (T2-162 đã kiểm apt history/term). eipp.log.xz: 0 dòng 20/11 (xzgrep). dpkg.log: 0 dòng 2026-11-20 (reset theo boot; file hiện tại từ boot #67, mtime 17:53Z).
4. **journalctl --list-boots: chỉ 1 boot (hiện tại #67, idx 0)** — journal xoay theo boot. **dmesg: "read kernel buffer failed: Operation not permitted"** (EPERM, như dự kiến — ghi rõ, không giấu).
5. **Birth-time scan: đã làm toàn cây (4 roots /home/hatch, /var/log, /tmp, /opt/hatch) bởi T2-162** (`round162-t2/birth-scan-d.py`), kết quả **0 file** sinh trong (20:16:36Z, 20:22:43Z] 20/11 (`birth-scan-d.txt` 0 byte) — không chạy lại (birth time bất biến). Hướng Chrome Sessions binary không thử (cùng họ History đã kiểm 760 DB, không trích timestamp tin cậy được từ cell — ghi rõ lý do).

**Cửa GIỮ NGUYÊN. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**

### 4.2 Điểm (m) #66 — ĐỐI CHIẾU ĐỘC LẬP (nhiệm vụ chính): ĐỒNG Ý DƯƠNG

**Bốn nguồn độc lập khớp nhau từng số:**

1. **T2-164 tính lại từ epoch thô** (`m-check9696.py`, script mới viết độc lập — không dùng appendix của T7):
   - requeue 16:07:30.460Z − btime #66 16:06:45Z = **45,460 s ∈ [33; 49,8] ✓**
   - dispatch 16:07:30.540Z − btime = 45,540 s; reattach 16:07:30.708Z − btime = 45,708 s (cùng trong dải)
   - started_at viết lại: 1795271751 → 1795277250 (delta 5.499 s); claimed_at KHÔNG ĐỔI 1795271751
   - spanning = 0 VÌ started_at viết lại thành sau btime (1795277250 > 1795277205) — **artifact viết-lại-tự-loại, không phải bằng chứng vắng mặt**
   - gap #65→#66 = 5.508 s; gap #66→#67 = 5.202 s
2. **T7-164 read #1 (đọc DB tươi, nguồn độc lập thứ hai):** started_at 1795277250, claimed 1795271751, events 9756/9781/9782/9783 + succeeded 9799 — khớp từng số với T7-163.
3. **T0-164 NOTES (đọc DB trực tiếp qua muse.db, chỉ đọc — nguồn độc lập thứ ba):** cùng event IDs và timestamps tới mili-giây; run 163 scheduled 14:35:51Z, started_at 16:07:30Z (viết lại sau #66), finished 17:18:13Z, succeeded, attempt 1, claimed 1795281485 (= 17:18:05Z), timed_out false; 0 event sau succeeded, 0 requeue quanh btime #67.
4. **T7-163 reads #5/#6/#7 nhất quán:** không viết lại lần 2, không requeue thêm; requeue cửa rộng 16:06:45–16:47:00Z (mọi job): đúng 1 dòng (eid 9781).

**Bằng chứng run 163 ĐANG CHẠY tại btime #66 (T7-163 + T7-164 + T0-164):** đọc #4 (15:58:40Z) running, started gốc 14:35:51Z; 0 event finish trước btime; requeue/reattach tại +45 s; sleep #4 của chính T7 bị SIGTERM ~16:07:15Z (30 s sau btime, 466 s sau spawn 15:59:29Z) — F-163-T7-1; T9-163 sampler khởi động lại 16:08:20Z (gap phủ sóng 113 s).

**Kết luận: ĐỒNG Ý #66 là điểm DƯƠNG (m).** Requeue 45,460 s không mở rộng dải (max vẫn 49,761 s từ #50). **NẾU parent CHẤP NHẬN: n ứng viên 20→21 (nhánh khuyến nghị: 18 dương + 3 âm) hoặc 21→22 (nhánh #56 ÂM: 18 dương + 4 âm). n chính thức GIỮ 14.**

### 4.3 Điểm (m) #67 (mới): KHÔNG PHẢI ĐIỂM

Lean ban đầu (prereg): CHƯA BIẾT, chờ T7-164. Bằng chứng (T7-164 read #1 + T0-164 DB read + T2 đối chiếu số học `m-check9696.py`):

- Run 163 finished 17:18:13Z (eid 9799), **914 s TRƯỚC btime #67**; 0 event sau succeeded.
- **0 requeue cửa 17:33:27–17:40:00Z**; spanning btime #67 = 0 dòng.
- Run 164 started 17:35:51Z (eid 9801, dispatch 17:35:51.168Z) — **144 s SAU btime #67**.
- HB 17:20:50Z started 17:15:34Z, finished cùng giây (1.073 s trước btime); DR 17:00Z finished 17:00:00Z (2.007 s trước btime).
- Cửa sổ (17:18:13Z .. 17:35:51Z) chứa btime #67 17:33:27Z với **0 run đang chạy** → chữ ký #52/#61/#64/#65.

**Kết luận: #67 KHÔNG PHẢI điểm (m) — đồng ý T7-164 (phán (m) chính thức của T7). n ứng viên không đổi do #67.**

**Nhãn n (quyết (z) đợt 163 — cập nhật đúng ngay từ đầu, không lặp F-163-T1-5):**
- **Cơ sở hiện tại (chưa cộng #66): n ứng viên = 20 (nhánh khuyến nghị: 17 dương + 3 âm #38/#45/#62) hoặc 21 (nhánh #56 ÂM: 17 dương + 4 âm).**
- **Nếu parent CHẤP NHẬN #66 DƯƠNG (§4.2): n ứng viên = 21 (18 dương + 3 âm) hoặc 22 (18 dương + 4 âm).**
- **n chính thức (ứng viên) GIỮ 14** cho đến khi #56 được quyết.

---

## 5. RAM trong cửa sổ probe #83

Guard 6.144 MiB = 6.291.456 kB; balloon ceiling 6.443.824 kB. Sampler T9-163 (round163-t9/ram-sampler.log, 133 dòng tổng) + T9-164 (round164-t9/ram-sampler.log, 5 dòng — đã có khi T2 chạy).

| Nguồn | Mẫu trong cửa sổ | Boot | Peak | % guard | ≥ guard | Balloon (==ceiling) |
|---|---|---|---|---|---|---|
| T9-163 | 130 | 1c1cf10c (n=85) + edb2acdb (n=45) | 3.623.788 kB | 57,60% | 0 | 49 |
| T9-164 | 5 | f1d4ce1a (17:39:50–17:43:51Z) | 2.478.948 kB | 39,40% | 0 | 0 |
| **Toàn cửa sổ** | **135** | — | **3.623.788 kB** | **57,60%** | **0** | **49** |

- 1c1cf10c: n=85, peak 3.623.788 kB (57,60% guard). edb2acdb: n=45, peak 1.959.248 kB (31,14% guard). f1d4ce1a: n=5, peak 2.478.948 kB (39,40% guard), min 1.043.424 kB.
- Balloon 49 = E-163 (15) + E-164 (34), khớp T9/T10-163 (49/133, 36,8%).
- **birefnet 0 lần thử, lần thứ 18 liên tiếp** (peak toàn cửa sổ 57,60% guard, cách guard 2.667.668 kB).
- Lưu ý cận dưới: sampler T9-163 dừng 16:52:21Z (dòng cuối); không có mẫu 16:52:21Z → 17:39:50Z (2.849 s) — peak trong quãng này là cận dưới (cùng họ F-142-T2-10 / T2-163 §5).

---

## 6. Phương pháp, sai số riêng, câu hỏi cho parent

### 6.1 Phương pháp

- **btime CHỈ từ `/proc/stat btime`** (quyết (e) đợt 156). Đồng hồ boot #67 xác minh 6+ nguồn + F127? 3 server + drift test (T2-164) + đối chiếu T0-164 (9 nguồn) / T7-164 / T5-164.
- **Luật gap (sàn 1.147 s):** file max gap hoặc union max gap (union-A = file + hệ thống + nội dung; union-B = union-A + mốc hệ thống trước btime) vượt sàn ⇒ MỞ.
- **(m):** T2 không tự query scheduler DB (T7 sở hữu) — đối chiếu qua NOTES T7-163/T7-164 + NOTES T0-164 (muse.db chỉ đọc) + tính lại từ epoch thô bằng script riêng.
- **WFS:** đếm theo DÒNG, chỉ file có count > 0; NEWSTD + R7b + copies; kiểm async `.writeFile(` có giới hạn (grep -o/--max-count, không in dòng minified dài — bài học F-163-T2-6).
- **EPERM sweep:** chỉ đếm marker trong `*.log` có mtime trong cửa sổ probe (không grep -r bừa — F-150-T2-2).
- **Prereg:** viết TRƯỚC probe #83 (~17:43Z), lean kiểm lại ở §6.2.

### 6.2 Sai số riêng (F-164-T2-*)

- **F-164-T2-1:** docstring `blind9696-investigate.py` ghi đoạn T = 5.537 s — SAI; đúng là 5.117 s (14:41:28→16:06:45). Số script in đúng; đã sửa docstring trước khi viết LIMITS.
- **F-164-T2-2:** lần chạy `blind9696-sessions.py` đầu tiên truyền sai epoch (cửa sổ 17:35:29–17:55:56 / 18:42:25–18:55:37); bắt được nhờ nhãn in ra, chạy lại với epoch đúng (đã kiểm bằng python trước). Không ảnh hưởng số liệu.
- **F-164-T2-3:** expectation trong docstring `blind9696-content.py` ghi watcher-163 "in U: expect 0" — thực tế có 1 dòng (poll cuối 16:06:54Z đua với reboot #66, đã biết từ T10-163 §10.5 (ix)). Số liệu đúng, chỉ kỳ vọng sai.
- **F-164-T2-4:** loose poll count watcher-162 = 334 (T2-163 ghi 333 — chênh 1, file/regex); strict predicate = 331, khớp T5-163 — không ảnh hưởng union.

**Prereg (§6.1, viết trước probe #83) kiểm lại:** (a) #95?/#94?/#77? giữ MỞ ✓; (b) #88? 345 hit / 0 mới, lần 8 ✓; (c) #96? R MỞ sơ bộ ✓ (prereg ước file ~1.238 s — thực 1.238 s; union 1.227 s — thực union-B 1.211 s, chênh 16 s do mốc dpkg 11:35:40Z mà prereg chưa biết; verdict MỞ không đổi); S ĐÓNG ✓; T chưa đo — thực ĐÓNG (file 307 s / union 31 s); (d) INSIDE #66/#67 ✓ (prereg ước p10/p90 FULL112 ≈ 26'–2h26' — thực 26'05"/2h26'59'; lean INSIDE cả hai ✓; chuỗi 1→2→3 ✓); (e) (m) #56 5 hướng mới đều âm tính ✓ (lần thứ bảy); (f) (m) #66 ĐỒNG Ý DƯƠNG ✓; (g) (m) #67 — prereg "CHƯA BIẾT, chờ T7-164": thực tế T7-164 read #1 + T0-164 DB read → KHÔNG PHẢI ĐIỂM; (h) WFS #70 chênh 0 ✓ (992+25=1.017), EPERM 0 sóng ✓, RAM < guard ✓, birefnet 0 lần ×18 ✓; (i) F127? +0,344/+0,002/−0,360 ✓ đủ 3 server; drift 0,9958 ✓.

**WFS #70** (scan-wfs70.sh, 18:00:40–18:01:50Z): NEWSTD 992 dòng / 296 file (phạm vi 3.434 file); R7B 1.017 / 313 (12.827 file); copies 25 / 17; **992+25=1.017, chênh 0 — lần thứ 70 liên tiếp.** Delta vs #69 (991/295): đúng +1 dòng / +1 file — `docs/PHASE9_ROUND163_T2_EPERM_LIMITS.md:1` (cùng mẫu đợt 163). Async `.writeFile(`: 2 helper đã biết (eperm-retry.mjs:71, epermRetry.js:116) + 2 vendored gradio (out of scope); 0 stray trong source. dist build: 8 mentions (cùng helper).

**Đối chiếu cờ các luồng (lúc T2 viết, ~18:05Z):** T0-164 DONE 17:43Z (boot #67 9 nguồn, marker 19); T1-164 DONE 17:54Z (verify 163 PASS, đếm khớp lần thứ 56, suite 28/28 trên boot f1d4ce1a 12m36s, F-164-T1-7: aggregate 163 §10.4 ghi "(T1-163 ghi lần thứ 54)" sai nhãn, đúng 55); T5-164 DONE 17:57Z (POSTBOOT_PASS #66 CHƯA CÓ, #67 ĐÃ CÓ 17:54:38Z); T6-164 DONE 17:52Z ((A) 120/120 lần thứ 14, tổng 1680/1680; lock 517 cặp; #66/#67 không giết holder; prune 39). T4/T7/T8/T9 chưa đóng lúc T2 viết — T7-164 NOTES read #1 đã đủ cho (m) #66/#67.

### 6.3 Câu hỏi cho parent

(a) **CHẤP NHẬN #66 là điểm DƯƠNG (m)?** (đối chiếu độc lập 3 nguồn, §4.2). Nếu CHẤP NHẬN: n ứng viên 20→21 (nhánh khuyến nghị) hoặc 21→22 (nhánh #56 ÂM); n chính thức GIỮ 14.
(b) **#95? MỞ** (quyết (b) đợt 163) — giữ nguyên? **#94?/#77? MỞ** — giữ nguyên?
(c) **#96? SƠ BỘ MỞ** — đồng ý giao điều tra đầy đủ cho T2-165?
(d) **#88? VẪN MỞ** (lần thứ 8, 345 hit / 0 mới) — tiếp tục hole-recheck lần thứ 9 ở đợt 165?
(e) **Gap #65 danh nghĩa 11.979 s** — giữ CHƯA đưa vào CERT/FULL chính thức (chờ #95?/#96? đóng)? Gap #66 danh nghĩa 5.508 s tương tự (chờ #96?/#97? đóng)?
(f) **#67 KHÔNG PHẢI điểm (m)** — đồng ý phán của T7-164/T2-164?
(g) **Chuỗi INSIDE:** #66 INSIDE FULL112 → chuỗi 1 lên 2; #67 INSIDE FULL113 → chuỗi 2 lên 3 (cả hai có điều kiện, dải danh nghĩa) — ghi nhận?
(h) **#56 VẪN CÓ ĐIỀU KIỆN** (lần thứ bảy không thu hẹp được) — có hướng neo mới nào parent muốn T2-165 thử (đã thử: git log, memory log, /var/log, journal/dmesg, birth-scan toàn cây)?

---

## 7. File + stage

**LIMITS này:** `docs/PHASE9_ROUND164_T2_EPERM_LIMITS.md` (1 entry, stage duy nhất).

**File làm việc (round164-t2):** prereg-t2.md, f127.py, f127.txt, drift-test.py, drift-test.txt, blind9696-gaps.py, blind9696-gaps.log, blind9696-investigate.py, blind9696-investigate.log, blind9696-repo-1.txt, blind9696-hidden_files.txt, blind9696-outside.txt, blind9696-tmp.txt, blind9696-fifthscope.txt, blind9696-merged.py, blind9696-merged.log, blind9696-content.py, blind9696-content.log, blind9696-sessions.py, blind9696-sessions.log, sessions-9696.txt, hole-recheck9696.py, hole-recheck9696.log, holerecheck-all.txt, find-stderr.txt, scan-wfs70.sh, scan-wfs70.log, scan-meta.txt, files-newstd.bin, files-r7b.bin, files-copies.txt, wfs-newstd.txt, wfs-r7b.txt, wfs-copies.txt, eperm-sweep9696.py, eperm-sweep9696.txt, ram-max9696.py, ram-max9696.txt, m-check9696.py, m-check9696.txt.

**Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round164-t2-eperm.txt` (NUL-delimited, 1 entry — LIMITS này). KHÔNG push.

**Nợ mở giao đợt 165 (T2-165):** điều tra đầy đủ #96? (đoạn R — mốc dpkg 11:35:40Z đã xác nhận; cần kiểm thêm nguồn độc lập cho R-head); hole-recheck #88? lần thứ 9; kết cục run 164 (T7-165); POSTBOOT_PASS #67 đã có — #68? theo dõi; (m) #56 thử thu hẹp lần thứ 8 (chờ parent trả lời (h)); (m) #68 nếu có reboot mới; INSIDE #68 (dải FULL114 neo 17:33:27Z nếu #67 đóng).
