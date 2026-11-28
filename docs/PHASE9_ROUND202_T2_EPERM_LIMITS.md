# T2 đợt 202 — EPERM + (m)/INSIDE + mù + làm rõ F-201-T10-8

**Luồng:** T2 (nền). **Đợt 202** mở lượt cron 03:35 +07 28/11/2026 (run 211 bắt đầu 20:35:51Z 27/11).
**Hạn cờ:** ~06:00 +07 28/11. **Hạn cứng:** 06:35:51 +07 28/11. **T2 đóng:** ~22:05Z 27/11/2026.
**Boot đo:** `05bda90d-6988-4925-97f7-71317d569aca` (#133, ứng viên, T01-202 xác nhận 9 nguồn) →
**reboot mới #134** `bd22dffd-4949-4ac2-8e57-a6d3fb2868e2`, btime 21:05:15Z, phát hiện giữa lượt (giết poller T4 cũ, T4 restart trên boot mới).

**Verdict tóm tắt:** (m) #131 **DƯƠNG (CUỐI)** (offset hiệu chỉnh 47,38–49,33 s, trong [33; 49,8]);
B-#130 **FALSE** (FULL175 cả hai biến thể); (m) #56 lần 44 **VẪN CÓ ĐIỀU KIỆN** (190 hướng);
probe #121 ok=2 fail=0; sweep #121 **0 sóng thật**; mù **CERT/FULL GIỮ 76/91**;
**F-201-T10-8:** run 208 finished_at_utc KHÔNG đổi thật — một lần đọc sai đơn lẻ của T01-200;
W1 đợt 202: chồng lấn biên ~0–2 s ở đuôi find outside của gen (xem §7 — chờ phán parent ở (p)-202).

Đường dẫn trong file này là tương đối (repo: `docs/…`, `scripts/…`; goal workspace:
`hidden_files/round202-t2/…`). Script/log làm việc ở `hidden_files/round202-t2/`.

---

## §1. (m) #131 — DƯƠNG (CUỐI)

DB tươi qua `muse.db`, đọc ~20:50Z 27/11 (script `hidden_files/round202-t2/m-check202.py`,
log `m-check202.log`, exit 0; chain exec `m-check201.py`, assert FULL173 p10/p90 +
FULL174 p10/p90 + B-#129 TRUE đều khớp):

- 6 event trong [15:00:00Z, 15:10:00Z), eid 11649–11654.
- Event đầu sau btime: eid 11652 `requeued_after_restart`, run 210 (72de8dca),
  15:05:14.894601Z = btime **+49,894601 s**.
- Tiếp: dispatched eid 11653 + reattached eid 11654 ("execute turn already complete
  (model-output evidence)").
- Event cuối trước btime: eid 11651 `succeeded`, 15:00:00.1991Z.
- Silence 11651→11652 = **314,696 s**. ID liên tục 11651→11652.
- **Số thô 49,894601 s nằm NGOÀI biên trên 0,094601 s** (cửa (m) [33; 49,8]).
- **Đo drift tươi (theo yêu cầu handoff T2-201):** 5 mẫu Cloudflare Date + RTT
  (21:12:47–21:12:53Z, boot #134, tuổi ~7 phút): local chậm **0,56–2,51 s**, ước lượng
  tốt nhất ~−1,5 s (mẫu S2 một mình đã chứng minh chậm >0,32 s). NTP UDP bị chặn
  (Operation not permitted); worldtimeapi bị từ chối kết nối; `SELECT now()` bracket
  quá rộng (~10 s) — không dùng được.
- Hiệu chỉnh: offset thật = 49,895 − (0,56..2,51) = **47,38–49,33 s → TRONG [33; 49,8]
  trên TOÀN bộ khoảng đo** (dùng hiệu chỉnh thận trọng nhất 0,56 s: 49,33 s, biên 0,47 s;
  dùng ~2 s chuẩn: ~47,89 s, biên 1,91 s).
- Mẫu vật lý đầy đủ, giống hệt các điểm DƯƠNG đã xác nhận #127/#129 (requeue + dispatch +
  reattach); boot #131 đã XÁC NHẬN ở (e)-201; boot #132 gần giống hệt (+49,208 s, trong
  biên 0,59 s) cho thấy delay khởi động thật sự chạm ~49–50 s; đồng hồ cell đã chứng minh
  không tin cậy (#126 trôi nhanh 18–20 s cuối đời — F-199-T2-4).
- **Giả định còn lại (ghi rõ để parent quyết cuối):** chuỗi giả định DB/host ≈ giờ thật,
  VM chậm ~2 s (mô hình đứng F-199-T2-4). Nếu parent giữ band là số thô thì verdict sẽ
  là 0 — trình bày cả hai, parent quyết cuối. (F-157-T7-1 từng kết luận timestamp DB
  scheduler ở khung wall-nhanh của cell (W), không phải khung host — nhưng chứng cứ neo
  chỉ chính xác tới phút, không loại trừ lệch ~2 s; vẫn dùng mô hình đứng của chuỗi khi
  áp hiệu chỉnh.)
- **n ứng viên: 58/61 → 59/62** nếu parent chấp nhận DƯƠNG. n chính thức GIỮ 14 (parent quyết).

### (m) #132 / #133 / #134 — THÔ (cho T2-203 phân loại CUỐI)

- **#132** (9a30eb2a, btime 17:03:20Z): requeue eid 11679, run 210, 17:04:09.208177Z =
  btime **+49,208 s → THÔ DƯƠNG** (trong biên 0,59 s). Kèm dispatched eid 11680 +
  reattached eid 11681. Run 210 sau đó TIMEOUT 17:39:55Z (eid 11686) — kết cục thuộc T7-202.
- **#133** (05bda90d, btime 20:32:07Z): **0 event trong cửa** [20:32:40Z, 20:32:56.8Z];
  event đầu sau btime eid 11701 reconciled 20:35:40.077Z = +213,077 s → **THÔ 0**
  (không run nào spanning). Event cuối trước btime eid 11700 succeeded 18:15:34.254Z;
  **silence 11700→11701 = 8.405,823 s, BAO TRÙM btime #133** (0 event 18:15:34–20:35:40Z)
  — giao T7-202 (khoảng lặng event 2h20m06s, dài thứ 2 sau OUTAGE #7 8.407 s đợt 199).
- **#134** (bd22dffd, btime 21:05:15Z): requeue eid 11717, run 211 (9f038129 — chính run
  đợt 202), 21:06:02.360053Z = btime **+47,360 s → THÔ DƯƠNG**. Kèm dispatched eid 11718 +
  reattached eid 11719 ("execute turn already complete"). Event cuối trước btime eid 11716
  succeeded 21:00:00.654Z; silence 11716→11717 = 361,706 s; ID liên tục.
- Gaps: #131→#132 7.135 s; #132→#133 12.527 s; #133→#134 1.988 s (33m08s — rất ngắn).
- Marker `/home/hatch/.config/vcut-persistence-marker`: 239 B, md5 cb7102c0cd6ea296759d9a5293159492,
  mtime 2026-11-20 11:39:47.272154981Z **KHÔNG ĐỔI — sống qua #132/#133/#134** (số hiệu
  82→83/84 thuộc parent (e)-202).
- Run 211 (9f038129, sched 1795811751 = 20:35:51Z): RUNNING; dispatched eid 11707
  20:35:51.081001Z (sched +0,081 s); started_at VIẾT LẠI 1795811751 → 1795813562 = 21:06:02Z
  tại #134; boot_gen hiện cron_boot_da522066…; claimed VẪN 1795811751 (= sched) lúc đọc cuối.

## §2. B-#130 — FALSE (FULL175, neo #129)

Chuỗi FULL (chain exec `m-check201.py`): FULL173 = FULL172 + 16.044 s (#127→#128);
FULL174 = FULL173 + 16.965 s (#129→#130): n=174, mean 1h52'16", median 1h57'42",
p10=1698,75 s, p90=11422,80 s, sd 1h03'12", min 55 s, max 5h58'13", 90–150'=95,
<60'=34, >180'=21, >240'=10. B-#129 re-verify TRUE (khớp T2-201).

### Mâu thuẫn chuỗi (phát hiện mới — parent quyết FULL175 chuẩn)

Chuỗi script **BỎ QUA gap #128→#129 (5.826 s)** giữa FULL173 và FULL174
(xác minh: 5826 KHÔNG có trong FULL174; 16965 CÓ). Parent-201 (d) ghi
"FULL174 = FULL173 + gap #128→#129 = 16.044 s" — sai cả nhãn lẫn giá trị
(16.044 s là gap #127→#128; gap #128→#129 thật là 5.826 s). Brief giao việc nói
FULL175 "cần gap #129→#130" nhưng §14.1 (r)-201 (parent chấp nhận) nói
"FULL175 = FULL174 + 13.364 s" (gap #130→#131) — hai hướng mâu thuẫn nhau
CHỈ dưới chuỗi script (FULL174 đã chứa 16965). Tính cả hai biến thể; verdict
FALSE robust dưới cả hai; FULL175 chuẩn để parent quyết:

| Chỉ số | FULL175a (chuỗi + §14.1(r): FULL174 + 13.364 s) | FULL175b (sửa tuần tự: FULL173 + 5.826 + 16.965 s) |
|---|---|---|
| n | 175 | 175 |
| mean | 1h52'54" | 1h52'10" |
| median | 1h57'47" | 1h57'37" |
| p10 | 1704,00 s | 1704,00 s |
| p90 | 11611,20 s | 11378,40 s |
| sd | 1h03'34" | 1h03'01" |
| min / max | 55 s / 5h58'13" | 55 s / 5h58'13" |
| 90–150' / <60' / >180' / >240' | 95 / 34 / 22 / 10 | 96 / 34 / 21 / 10 |
| Band neo #129 (06:38:56Z) | [07:07:20Z, 09:52:27Z] | [07:07:20Z, 09:48:34Z] |
| btime #130 (11:21:41Z) | NGOÀI (vượt biên trên 5.354 s) | NGOÀI (vượt biên trên 5.587 s) |
| **B-#130** | **FALSE** | **FALSE** |

- Offset #129→#130 = 16.965 s, cao hơn p90 (~11,4 ks) khoảng 5,5 ks — FALSE không
  phụ thuộc biến thể. **Chuỗi B GIỮ 1** (B-#129 TRUE, B-#130 FALSE).
- Đếm A KHÔNG TÍNH ĐƯỢC (thiếu btime #106) — chuỗi GIỮ 7. Không có dữ kiện mới
  đợt 202 (T01-202 chỉ survey #132/#133/#134; GAP dòng #106 không đổi).
  INSIDE #107..#115 dưới đếm A vẫn PENDING.
- Tốc độ reboot: tới #131: 206 reboot / 402,77 h = 1 per ~117,3 phút; tới #134:
  209 reboot / 408,79 h = 1 per ~117,4 phút.

---

## §3. (m) #56 lần 44 — VẪN CÓ ĐIỀU KIỆN (190 hướng, không thu hẹp)

D = [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs [1795201484, 1795206163];
W = [19:33:20Z, 19:33:37Z] = [1795203200, 1795203217].
Script file-based `hidden_files/round202-t2/m56-202.py` (log `m56-202.log`, exit 0);
hướng DB mới đo tươi qua `muse.db` (ghi ở đây).

### 3.1. 5 hướng DB mới lần 44 (đã grep xác minh CHƯA DÙNG trong mọi `m56-*.py` TRƯỚC khi query, theo F-194-T2-2)

| # | Hướng | W | D | Tổng bảng |
|---|---|---|---|---|
| (clxxxvi) | `ideas.idea_dedup created_at` | 0 | 0 | 117 |
| (clxxxvii) | `self_improvement.handoff_dedupe emitted_at` | 0 | 0 | 2 |
| (clxxxviii) | `goals.momentum_history created_at` | 0 | 0 | 12 |
| (clxxxix) | `self_improvement.objective_markers set_at` | 0 | 0 | 4 |
| (clxxxx) | `goals.learning_state updated_at_ts` | 0 | 0 | 1 |

Tất cả 0 trong W, 0 trong D; cả 5 bảng đều có dữ liệu thật (không phải hướng rỗng).
**Tổng 190 hướng** (185 + 5). **Không thu hẹp. VẪN CÓ ĐIỀU KIỆN.**

Sai lầm đã sửa trong lượt (ghi làm bài học): 5 hướng đầu tiên tôi chọn
(`runtime.checkout_spend_operations created_at_ms`,
`runtime.stripe_link_spend_requests created_at`,
`runtime.raw_signal_collections created_at`,
`runtime.workflow_phase_runs started_at`, `spaces.proposals created_at`) đều là
BẢNG RỖNG (0 dòng tổng) → hướng rỗng, không tính; đã thay bằng 5 hướng trên.
Bài học: kiểm tra tổng số dòng trước khi chọn hướng mới.

### 3.2. F-202-T2-x — PURGE 7 NGÀY (phát hiện mới, verdict không đổi)

Re-check (clxvi) `agent.message_mailbox accepted_at`: D **19 → 1** (max không đổi
1795205974.929056 = 20:19:34.929056Z), W vẫn 0. (clxx)
`agent.agent_message_token_usage created_at`: D **9 → 0**, W vẫn 0. Hàng ngoài D
còn sống số lượng lớn (message_mailbox 20:22–21:15Z: 37 dòng; 21:15–22:00Z: 8 dòng;
token_usage 20:22–20:30Z: 1 dòng; 20:30–21:20Z: 11 dòng) → phù hợp với một lượt
purge giữ 7 ngày (604.800 s, đã biết từ T7-200) chạy trong tối 27/11 với ngưỡng sắc
gần 20:19:34Z 20/11 (dòng max sống sót vì sau ngưỡng vài giây). **Verdict không đổi**
(0 trong W) nhưng **số D không còn kiểm chứng lại được từ DB** — các lượt sau phải
dựa vào số đã ghi trong LIMITS. Purge chỉ ảnh hưởng hàng DB, KHÔNG ảnh hưởng file:
(vii)/(viii) dưới đây không đổi về bản chất.

### 3.3. File-based (vii)/(viii)/(vii-b)/(vii-c) — chạy tươi đợt này

- (vii) mtime scan `~/workspace` trong D: **331 file** (201: 333 — giảm 2 do churn file),
  max mtime **20:15:33.130Z** không đổi (`hidden_files/round156-t10.done`).
- (viii) exec-log mtimes trong D: **0** (không đổi).
- (vii-b) file 20:16:00–20:17:00Z (R lower-anchor): **0** (không đổi).
- (vii-c) file 20:19:30–20:19:40Z (max-marker neighbourhood): **0** (không đổi).
- (ix)/(x) wtmp/apt: rỗng theo cấu trúc (như mọi đợt — chỉ có boot hiện tại; dpkg
  mtime 01:22Z 23/11).

---

## §4. F-201-T10-8 — run 208 finished_at_utc: KHÔNG PHẢI đổi thật (KẾT LUẬN)

Run 208 = `9cd50793-fdda-40c0-b1f6-09f3109b594f`, sched 1795768551 = 08:35:51Z 27/11,
status succeeded, bootgen cron_boot_7d6a37d287b14cd19cfe0f1d8c25b602,
claimed 1795770898 = 09:14:58Z. (Người giao: F-200-T01-6 → F-201-T01-5 → F-201-T10-8;
T7-201 §8 không giải thích — grep `9cd50793|1795768968|2000` trong T7-201 LIMITS trả rỗng.)

- **Giá trị hiện tại (đọc tươi lượt này): finished_at_utc = 1795770968 = 09:16:08Z**,
  KHỚP event eid 11585 succeeded 09:16:08.660189Z. Đây là **lần đọc đúng thứ 3**
  (T7-200, T10-201, tôi).
- Giá trị T01-200 ghi (1795768968 = 08:42:48Z, lệch đúng 2.000 s) chỉ xuất hiện
  **ĐÚNG MỘT LẦN**, trong `hidden_files/round200-t01/appendix200.py` (mtime 11:44:32Z
  27/11) — và bị bác bởi: T7-200 đọc đúng 1795770968 sớm hơn 4 phút
  (`hidden_files/round200-t7/appendix200.py`, mtime 11:40:29Z, cf 70 tính từ giá trị
  này); không có event nào lúc 08:42:48Z; **không có row nào hiện mang giá trị
  1795768968** (query finished_at_utc HOẶC started_at_utc = 1795768968 trả 0 dòng);
  truy vấn CA của T7-200 (27 dòng, cf 70 cho run 208) cũng dùng giá trị đúng.
- Chuỗi đọc: T7-200 ~11:40Z đúng → T01-200 ~11:44Z sai → T10-201 (đợt 201) đúng →
  tôi đúng. Không có cơ chế ghi đè nào được chứng minh (không cột audit; event
  `reconciled` gần nhất 11:41:54Z không chứng minh được gì; appendix của T01-200
  hardcode hằng số rồi "check" — không phát hiện được lỗi phiên âm).
- **Kết luận: KHÔNG PHẢI đổi thật có chủ đích của daemon; khả năng cao nhất là một
  lần đọc/ghi sai đơn lẻ của T01-200 (phiên âm khi hardcode appendix, hoặc snapshot
  cũ) — giá trị 08:42:48Z chưa từng là giá trị thật của row tại bất kỳ thời điểm nào
  khác được kiểm chứng.** Giá trị hiện tại đúng; CA #30 (cf 70) đứng; không cần hành
  động thêm. F-201-T10-8 ĐÓNG (chờ parent xác nhận ở §14.2-202).
- Chi tiết run 208: dispatched eid 11569 08:39:01.922849Z (sched +190,9 s — chờ run 207
  TIMEOUT xong 08:39:01Z); requeued eid 11570 08:41:43.720918Z + dispatched eid 11571 +
  reattached eid 11572 ("re-keyed waiter on active execute turn") tại daemon restart
  08:41:43Z; succeeded eid 11585 09:16:08.660Z. Tổng 5 event. Run 207 (bdcc830e) TIMEOUT
  finished 1795768741 = 08:39:01Z, claimed viết lại 1795768622 = 08:37:02Z, cf 119.

---

## §5. EPERM — probe #121 + sweep #121: 0 sóng thật

- **Probe #121:** 21:46:59Z, boot=bd22dffd, **ok=2 fail=0** (`bash scripts/probe-eperm-v2.sh
  once`, chạy ngoài W1 — kiểm W1-ACTIVE trước, không tồn tại). Probe #120: 14:59:59Z 27/11.
- **Sweep #121** (script `eperm-sweep202.py`, cửa [probe#120 14:59:59Z, probe#121 21:46:59Z]):
  336 file `*.log` có mtime trong cửa; 6 file có hit; tổng **16 occurrence**; **0 lần
  "sóng EPERM vẫn bật"**.
  - `proc_6e9ecc84e8a1.log` (exec-log T2-201): CẢNH BÁO 1, Operation not permitted 1,
    "sóng EPERM đã tắt" 3 — tự trích (log sweep đợt 201).
  - `eperm-sweep201.log`: CẢNH BÁO 1, Operation not permitted 1, "sóng EPERM đã tắt" 3 —
    tự trích.
  - `proc_e479fcd2881f.log`: "sóng EPERM đã tắt" 1 (trích kết quả probe).
  - `o8-202t01.log`: "sóng EPERM đã tắt" 3 (T01-202: "[20:50:12.210Z] sóng EPERM đã tắt,
    khởi động vite" — trích probe).
  - `o8-probe-202t01.log`: "sóng EPERM đã tắt" 1 (trích probe).
  - `round202-t8/smoke/selfcheck-2-run.log` (mtime 21:08:41Z): "Operation not permitted" 1 —
    dòng `dmesg: read kernel buffer failed: Operation not permitted` — **lỗi quyền dmesg
    của sandbox, KHÔNG phải sóng EPERM** (inotify), không tính.
- **Kết luận: sóng EPERM TẮT trong toàn cửa** (probe ok=2 fail=0; 0 "vẫn bật"; mọi hit
  "đã tắt" đều là trích kết quả probe; hit "Operation not permitted" duy nhất là dmesg).

---

## §6. Mù — B1 21:31:15Z, CERT/FULL GIỮ 76/91

- B1 = **2026-11-27T21:31:15Z** (1795815075), window 555.357 s (B0 đứng
  2026-11-21T11:15:18Z). Counts: repo-1 8.867 (201: 8.728) / hidden_files 17.635
  (201: 16.917) / outside 31.747 (201: 31.662) / tmp 806 (201: 603 — tăng lại sau
  khi reboot #131 xóa /tmp đợt 201) / fifth 23 (không đổi). Merged unique
  second-marks: **13.101** (201: 12.657).
- FILE gaps: R max **1238 s OPEN** (không đổi); S max **3235 s OPEN** (file thô —
  H-S4, content lấp); T max **627 s CLOSED**; U max **9316 s OPEN** (không đổi,
  15:00:33→17:35:49 24/11); U thứ 2: 8968 s; thứ 3: 8572 s (H-U24 — không widen thêm);
  thứ 4: 7788 s (H-U25 widened 03:26:02→05:35:50 — endpoint KEPT (03:34:31, 05:35:38)
  cho hole-recheck, theo tiền lệ F-186-T2-9); thứ 5: **7752 s — H-U26 MỚI (xem dưới)**;
  thứ 6: 6807 s (H-U17 widened); thứ 7: 6799 s (H-U22 widened); thứ 8: 6370 s (H-U21 widened).
- UNION-A: R **1222 s OPEN** / S **662 s CLOSED** / T **38 s CLOSED** / U **9316 s OPEN**
  (22.469 marks; U top: 9316/8968/8572/7788/7752/6807).
- UNION-B (+ SYS heads incl. SYS05BD 20:32:25Z + SYSBD22 21:05:28Z — xem dưới):
  R **1211 s OPEN** / S **591 s CLOSED** / U **8372 s OPEN** (22.528 marks; U top:
  8372/8109/7861/**7536** (H-U26 split bởi SYS05BD)/6469/6100).
- **Mọi max đoạn không đổi vs 201 → CERT/FULL GIỮ 76/91.**
- SYS heads mới: **05bd-head 20:32:25Z** (T01-202 đo trực tiếp survey 20:42:50Z,
  journal first entry +18 s, wtmp begins +18 s, /proc/1 mtime +18,12 s);
  **bd22-head 21:05:28Z** (T2-202 đo trực tiếp, journal first entry +13 s, wtmp
  begins +13 s, /proc/1 mtime +13,062 s). **SYS cho #132-head KHÔNG thêm** — không
  có đo head trực tiếp nào trên hồ sơ (T9-201 không đo #132; journal/wtmp volatile —
  tiền lệ F-187-T2-3).
- Content mới: replay-watch-202 **76 dòng** strict poll trong U; ram-sampler-202
  **50 dòng** trong U; replay-watch-201 266; ram-sampler-201 134.
- **H-U26 MỚI** (lần đầu thấy ở merged-202): file-gap (18:26:49, 20:36:01) 7752 s;
  union-B 7536 s (SYS05BD 20:32:25Z tách); yên sau khi đợt 201 đóng (~18:12Z) tới
  dispatch run 211; **STRADDLES btime #133 (20:32:07Z)**; end mark 20:36:01Z =
  dispatch run 211 20:35:51Z +10 s (mẫu live-config); NO sampler/watcher content
  bên trong (UNION-A gap không đổi 7752 s). Hole-recheck: NEW=2 theo luật float —
  cả 2 đều là **file mốc đầu của chính hole** (session jsonl + prompt-continuity json
  của main agent, mtime 18:26:49.241/.069Z — lần ghi cuối lúc đóng đợt 201), 0 mark
  trong interior (18:26:49.241 → 20:36:01). Hole đứng như đo.
- Sessions (`blind202-sessions.py`, log 63 dòng): **262 exec-logs** trong window
  (201: 303 — giảm do pruning, xem dưới; trong lượt này 264 → 262 giữa 2 lần chạy
  vì 2 log đang chạy có mtime vượt B1), 16 skipped own-marker logs (201: 12 — tăng
  do thêm marker round202-t2/m-check202 của chính phiên này), jump witness #64–#86:
  1 mỗi cái (cùng 1 log proc_ab58b9c7039d.log — main agent, trích btimes, KHÔNG phải
  hoạt động — tiền lệ F-184-T2-3); 0 trong R/S/T mtime, 262 trong U. R union max gap:
  0; U file max gap: 1 — đã phân loại tay: proc_7746096f4032.log trích
  "#106 CHƯA XÁC MINH (ước btime ~15:13:32Z)" — timestamp 15:13:32Z là ƯỚC btime #106
  được trích, KHÔNG phải hoạt động (cùng lớp F-178-T2-10/F-185-T2-5). **U max gap
  vẫn 0 mark thật.**
- Witness (`witness202.py`, log 164 dòng): #87–#115: 2; **#116–#118: 1** (201: 2);
  **#119–#120: 2** (201: 3); **#121–#122: 2** (201: 4); **#123: 3** (201: 6);
  #124–#125: 2; #126: 9; #127: 4; #128: 9; #129: 3; **#130: 5 raw, 0 THẬT**
  (201: 4 — tăng 1 do log dc6248 mtime 17:01:05Z vào window sau B1-201);
  **#131: 3 raw, 0 THẬT; #132: 2 raw, 0 THẬT; #133: 4 raw, 0 THẬT** (triaged tay dưới).
  **Tổng: 0 THẬT cho #64–#133.**
- Triage witness #130–#133 (kiểm tay từng hit):
  - Cặp 5886fe45 (proc_a824909556c8.log, proc_2a227c09d525.log) — log tổng hợp trích
    timestamp cả ngày (span 00:09–22:32Z) — quote, xuất hiện ở mọi boot #130–#133.
  - proc_6178475ad3ed.log — min 11:21:54Z (= SYS head #130) + max 17:35:51Z (= dispatch)
    — quote, xuất hiện ở #130/#131.
  - proc_6f315e49bb43.log — min đúng btime #130 (11:21:41Z) — quote biên.
  - proc_dc6248ee14d3.log (mới vs 201) — summary headroom T9-201 in lúc 17:01:04Z;
    các dòng "open-201 14:50:12Z / postboot-201-late 15:08:48Z / mid-201 15:50:00Z /
    close-201 17:00:03Z" là NHÃN probe lịch sử, không phải hoạt động của session lúc
    đó (driver start 15:07:37Z boot #131 — sau btime) — quote/tổng hợp, KHÔNG THẬT.
  - proc_fb41e631aafc.log — REPLAY-WATCH-202-START 20:42:59Z, trích btime #133
    (20:32:07Z) trong header START; session chạy 20:42:59–20:47:52Z, hoàn toàn SAU
    btime — quote, KHÔNG THẬT.
  - proc_5f7af0e391b6.log — log poller T4-202 (poll #14–16 trên #134); dòng 13 trích
    "boot 05bda90d (btime 20:32:07Z; watcher-202) — repair-som-quyet-h" — quote
    btime #133 trong ghi chú repair + hoạt động riêng sau đó — KHÔNG THẬT.
- **Exec-log pruning tiếp diễn (F-201-T2-2):** #123 giảm 6 → 3 vì 3 log bị XÓA giữa
  đợt 201 và 202 (proc_bdce3989e045.log, proc_1d2568b76330.log — cùng agent 0ee1d9a9;
  proc_8f8ad41d036a.log — agent 9388a6ae); #116–#122 cũng giảm tương tự. Đây là
  xóa/prune, không phải bằng chứng mới.
- Hole-recheck lần 45 (`hole-recheck202.py`, log 80 dòng): whole-tree 75.899 file
  trong union range; known 12.657 (lists 201); base #88? 557. **MỌI hole NEW=0**
  trừ H-U26 (NEW=2 — file mốc đầu, xem trên). H-E1-88 lần 44: inside=324, toàn
  float-trap, NEW=0. H-S3/U2/U3/U9/U11/S4/T2/U12/U13/U14/U15/U16/U17/U19/U18/U20/
  U21/U22/U23: inside>0 nhưng toàn float-trap, NEW=0. H-U24/H-U25: inside=0.
- Evidence-check (`evidence-check202.py`): 41-list **0/41 present, 0 NEW** missing
  kể từ 201; 349-list **0/349 present, 0 NEW**; #100 survivor proc_34889a901a7e
  **vẫn missing — bộ chứng cứ #100 0/6** (mất file cuối giữa đợt 193 và 194);
  proc_e606d7b4f921 + proc_e0c4ed13d7cd: missing.

---

## §7. Sổ vi phạm W1 đợt 202 — chồng lấn biên ~0–2 s (chờ phán parent)

W1 attempt 1 (T4-202): MỞ 21:33:13Z (poll #36, gate0 T5 + gateA đủ) → KẾT THÚC
21:37:13Z, **LUỘT HỢP LỆ** (20/20 + LOP B ĐẠT 5/5 + tickCost median 52,0 ms ≤ 60);
ngân sách 1/3; poller thoát sau lượt hợp lệ. Không có attempt 2 trong đợt này.

Lệnh nặng của tôi theo thời gian (đều kiểm W1-ACTIVE trước khi chạy):
- m-check202.py 21:23Z — trước W1. 0 chồng lấn.
- blind202-gen.py (4 find): khởi chạy 21:31:03Z (W1 chưa tồn tại). repo-1 18 s,
  hidden_files 15 s, outside 86 s → outside kết thúc ~21:33:14Z; W1 mở 21:33:13Z
  → **đuôi find outside chồng lấn W1 khoảng ~0–2 s** (không phân giải được tới
  từng giây từ timestamp có được; find chỉ đọc metadata, không ghi file).
  Sau đó script ngủ 4×60 s theo gate vite-lock (trong W1, không chạy find);
  tmp find 0 s chạy ~21:37:14Z, SAU khi W1 kết thúc 21:37:13Z. 0 chồng lấn ở tmp.
- blind202-merged/content/sessions/witness: 21:39–21:45Z — sau W1. 0 chồng lấn.
- probe #121 21:46:59Z; sweep #121 21:47–21:48Z; hole-recheck 21:49–21:52Z;
  m56-202 21:52–21:56Z — đều sau W1. 0 chồng lấn.
- **Kết luận: 1 chồng lấn biên ~0–2 s ở đuôi find outside (khởi chạy TRƯỚC W1,
  gate vite-lock trong script đã ngủ suốt W1).** Nhẹ hơn nhiều so với vi phạm
  đợt 201 (m-check tail ~38 s + m56 ~111 s + probe #120 trong W1) nhưng vẫn
  ghi rõ để parent phán ở (p)-202: có tính là VI PHẠM (nhẹ) hay KHÔNG VI PHẠM
  (biên mở W1). Tôi KHÔNG tự phán.

## §8. Bài học + nợ T2-203

### Bài học đợt này
- **F-202-T2-x (purge 7 ngày):** số D của (m) #56 có thể bị purge làm thay đổi
  (19→1, 9→0) mà verdict không đổi. Các lượt sau: D counts trong LIMITS là
  bản ghi duy nhất còn kiểm chứng được; đừng re-query để "xác minh lại" số D cũ.
- **Kiểm tổng dòng trước khi chọn hướng DB mới:** hướng trên bảng rỗng không tính.
- **Epoch tính bằng python, không tính nhẩm:** lần chạy sessions đầu tiên tôi
  gõ sai epoch cửa U (1795801233 thay vì 1795532433 — lệch 3 ngày); lần 2 vẫn
  sai 1.200 s. Từ nay mọi epoch cửa đều tính bằng `python3 -c` và in ra kiểm tra
  trước khi chạy.
- **Adapt script bằng replace toàn cục rất dễ phá tuple loại trừ / đường dẫn đọc–ghi
  trùng tên:** sessions/witness (marker "round201-t2" bị blanket replace xóa mất),
  hole-recheck (W202 trỏ nhầm round201-t2; `_read_b1s` trỏ nhầm thư mục),
  evidence-check (đường đọc baseline ↔ đường ghi bị đổi chéo nhau). Mỗi lần adapt:
  assert sau replace + đọc lại đường dẫn đọc/ghi trước khi chạy; lỗi nào cũng bắt
  được nhờ assert/log, không có số nào bị sai vì thế.
- **Kiểm W1-ACTIVE trước mỗi lệnh nặng KHÔNG đủ khi lệnh nặng tự chia scope:**
  gen script khởi chạy trước W1 nhưng scope outside kéo dài tới lúc W1 mở. Bài học:
  với script dài nhiều scope, kiểm tra lại W1 giữa các scope (gate vite-lock đã làm
  việc này cho tmp — cần mở rộng thành kiểm W1-ACTIVE giữa các scope).

### Nợ T2-203
- Phân loại CUỐI (m) **#132** (THÔ DƯƠNG, biên 0,59 s — lưu ý: cửa sổ [33; 49,8] là
  quy ước đứng; requeue là recovery sau reboot theo detail "daemon startup recovery"),
  **#133** (THÔ 0 — silence 8.405,823 s bao trùm btime, giao cả T7-203),
  **#134** (THÔ DƯƠNG, +47,360 s). Cần đo drift tươi lại cho #132/#133/#134 nếu
  parent yêu cầu hiệu chỉnh như #131.
- B-#131: cần FULL176 (FULL175 + gap #131→#132 7.135 s) — **lưu ý mâu thuẫn chuỗi §2:
  FULL175 chuẩn (a hay b) thuộc parent quyết; T2-203 tính theo bản parent chốt**.
- (m) #56 lần 45: 5 hướng DB mới (kiểm tổng dòng + grep chưa dùng TRƯỚC khi query);
  re-check (clxvi)/(clxx) — số D trong LIMITS này là bản ghi cuối (purge đã xóa).
- Hole-recheck lần 46 (H-E1-88 lần 45; H-U26 lần 2 — endpoint KEPT (18:26:49, 20:36:01)).
- Probe #122 + sweep #122 (cửa [probe#121 21:46:59Z 27/11, probe#122]).
- F-201-T10-8: ĐÓNG nếu parent xác nhận §4 (không cần hành động thêm).
- (m) #133 THÔ 0 + silence 8.405,823 s: giao T7-203 theo dõi (khoảng lặng event dài
  thứ 2 sau OUTAGE #7).
- W1 đợt 202 (§7): chờ phán parent ở (p)-202 (chồng lấn biên ~0–2 s).
