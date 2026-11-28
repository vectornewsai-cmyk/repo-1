# T2 đợt 201 — EPERM + (m)/INSIDE + mù + đối chiếu W2/W3 đợt 200

**Luồng:** T2 (nền). **Đợt 201** mở lượt cron 21:35 +07 27/11/2026 (run bắt đầu 14:35:51Z).
**Hạn cờ:** ~17:00Z. **Hạn cứng:** 17:35:51Z. **T2 đóng:** ~15:55Z 27/11/2026.
**Boot đo:** `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8` (#130, XÁC NHẬN ở (e)-200) →
**reboot mới #131** `7d642f2a-da03-44ab-a2a1-f55b8010063f`, btime 15:04:25Z, phát hiện giữa lượt.

**Verdict tóm tắt:** (m) #130 **KHÔNG CÓ ĐIỂM (CUỐI)**; B-#129 **TRUE** (FULL174);
(m) #56 lần 43 **VẪN CÓ ĐIỀU KIỆN**; probe #120 ok=2 fail=0; sweep #120 **0 sóng thật**;
mù **CERT/FULL GIỮ 76/91**; W2/W3 đợt 200 **KHÔNG TỒN TẠI** (đối chiếu vacuous);
**F-201-T2-3:** T2 tự chồng lấn W1 đợt 201 (probe #120 + m56 finds) — chờ phán parent ở (p)-201.
(m) #131 THÔ knife-edge (ngoài biên trên 0,094601 s trên số thô) — handoff T2-202, T2-201 KHÔNG phán.

Đường dẫn trong file này là tương đối (repo: `docs/…`, `scripts/…`; goal workspace:
`hidden_files/round201-t2/…`). Script/log làm việc ở `hidden_files/round201-t2/`.

---

## §1. (m) #130 — KHÔNG CÓ ĐIỂM (CUỐI)

DB tươi qua `muse.db`, đọc ~14:50Z 27/11 (script `hidden_files/round201-t2/m-check201.py`,
log `m-check201.log`, exit 0):

- 44 event trong [11:21:41Z, 14:35:51Z), eid 11597–11640.
- Event đầu sau btime: eid 11597 `reconciled`, 11:35:38.916681Z = btime **+837,916681 s**.
- **0 event trong cửa (m) [11:22:14Z, 11:22:30.8Z]** = [btime+33, btime+49.8].
- 0 event trong [10:45:34Z, 11:35:38Z).
- Event cuối trước btime: eid 11596 `succeeded`, 10:45:34.161682Z.
- Silence 11596→11597 = **3004,755 s** (trước btime 2166,838 s + sau btime 837,917 s —
  trùng S10 stall theo (n)-200). ID liên tục 11596→11597.
- Kết luận bền vững trước lệch btime 13 s (uptime -s 11:21:41Z vs /proc/1 11:21:54Z)
  và caveat đồng hồ F-199-T2-4 (local ~2 s chậm): khoảng cách tới biên gần nhất là
  837,9 s ≫ 13 s + 2 s.
- **n: 58/60 → 58/61.**

## §2. B-#129 — TRUE (FULL174, neo #128)

FULL174 = FULL173 + gap #129→#130 16.965 s:

| Chỉ số | FULL174 |
|---|---|
| n | 174 |
| mean | 1h52'16" |
| median | 1h57'42" |
| p10 | 1698,75 s |
| p90 | 11422,80 s |
| sd | 1h03'12" |
| min / max | 55 s / 5h58'13" |
| trong 90–150' / <60' / >180' / >240' | 95 / 34 / 21 / 10 |

- Band FULL174 neo #128 (btime 05:01:50Z) = **[05:30:08Z, 08:12:12Z]**;
  btime #129 06:38:56Z **INSIDE** (margin lo +4128 s, hi −5596 s).
- **Chuỗi B đề xuất 0 → 1** (parent quyết cuối). Đếm A vẫn **KHÔNG TÍNH ĐƯỢC**
  (thiếu btime #106) — chuỗi GIỮ 7.
- FULL173 p10/p90 tái xác minh khớp T2-200 (1693,50 / 11104,60); B-#128 tái xác minh FALSE.
- Tốc độ reboot tới #130: 205 / 399,06 h = 1 per 116,8 min.

## §3. (m) #56 lần 43 — VẪN CÓ ĐIỀU KIỆN, không thu hẹp

5 hướng mới, đã grep xác minh **CHƯA DÙNG** trong `m56-19*.py` + `m56-200.py`
(0 match mỗi cái, trước khi query — theo F-194-T2-2), tất cả 0 trong W
[19:33:20Z, 19:33:37Z] 20/11 (epoch [1795203200, 1795203217]):

- (clxxxi) `goals.suggestions created_at_ts`
- (clxxxii) `health.sleep_sessions created_at`
- (clxxxiii) `self_improvement.backfill_day_runs created_at`
- (clxxxiv) `goals.threads created_at`
- (clxxxv) `runtime.checkout_spend_checkpoints claimed_at_ms`
  (ms, W = [1795203200000, 1795203217000])

**Tổng 185 hướng** (180 + 5 mới). Re-check:

- (clxvi) `agent.message_mailbox accepted_at`: 19 trong D, 0 trong W,
  max 20:19:34.929056Z — không đổi.
- (clxx) `agent.agent_message_token_usage created_at`: **9 trong D**,
  max 1795205974 (20:19:34Z) — không đổi từ đợt 199.
- File-based (`hidden_files/round201-t2/m56-201.py`, log `m56-201.log`, exit 0):
  333 file có mtime trong D [19:04:44Z, 20:22:43Z] 20/11 — KHÔNG ĐỔI,
  max mtime 20:15:33.130Z (`round156-t10.done`); 0 exec-log trong D;
  (vii-b)/(vii-c) trống.

### F-201-T2-1 — Đính chính T2-200: "(clxx) 11 trong D" là ĐẾM SAI

T2-200 đã query với cận trên 1795207363 (cận trên D dạng ms của (clxxx) dùng nhầm
làm giây = 20:42:43Z) thay vì D1 1795206163 (20:22:43Z). 2 dòng "mới"
(1795206469 agent e033d2dd, 1795207287 agent 02cc32dc) TỒN TẠI nhưng ở
20:27:49Z / 20:41:27Z — SAU D1, NGOÀI D (xác minh tươi: 9 trong D;
2 dòng trong (D1, 1795207363]). Nhãn giờ của T2-200 cũng lệch −20 phút
(20:07:49Z/20:21:27Z vs thật 20:27:49Z/20:41:27Z — kiểm bằng `date -d @epoch`).
Không thu hẹp theo cả hai cách (0 trong W); verdict (m) #56 đứng.

## §4. EPERM — probe #120 + sweep #120

- **Probe #120: ok=2 fail=0, boot=c073c8bb, lúc 14:59:59Z 27/11**
  (`bash scripts/probe-eperm-v2.sh once`; log `hidden_files/eperm-probe-v2.log`,
  tổng 120 dòng probe). Lưu ý: probe chạy TRONG W1 T4-201 — xem F-201-T2-3 (§8).
- **Sweep #120** (`hidden_files/round201-t2/eperm-sweep201.py`, log `eperm-sweep201.log`,
  exit 0): cửa [probe#119 11:45:12Z, probe#120 14:59:59Z]; 157 *.log files có mtime
  trong cửa; 3 file có hit, 15 occurrences — tất cả tự tham chiếu / trích dẫn
  "sóng đã tắt":
  - `hidden_files/round200-t01/o8-200t01.log`: {'sóng EPERM đã tắt': 4}
  - `hidden_files/round200-t2/eperm-sweep200.log`: {'CẢNH BÁO': 2,
    'Operation not permitted': 2, 'sóng EPERM đã tắt': 4} (self-reference)
  - `hidden_files/round201-t01/o8-201t01.log`: {'sóng EPERM đã tắt': 3}
  - 0 "sóng EPERM vẫn bật" → **0 sóng thật**.

## §5. Boot #131 — ghi nhận + (m) #131 THÔ (handoff T2-202)

- Boot `7d642f2a-da03-44ab-a2a1-f55b8010063f`, btime 1795791865 = **15:04:25Z 27/11/2026**
  (uptime -s; /proc/stat btime). Gap #130→#131 = **13.364 s** (3h42m44s).
- T01-201 survey lúc 14:48:24Z vẫn thấy c073c8bb; watcher-201 (start 14:48:33Z trên
  c073c8bb) hiện poll trên 7d642f2a (15:09:19Z/15:09:49Z).
- SYS mark #131-head đo trực tiếp bởi T2-201: **SYS7D64 = 15:04:44Z**
  (journal first entry +19 s, wtmp begins +19 s, /proc/1 mtime 15:04:43.985Z
  = +18,985 s — mẫu +19 s giống #86).
- Marker sống qua #131: md5 cb7102c0, 239 B, mtime không đổi 2026-11-20 11:39:47Z
  → marker 81 đứng (sau #130); 82 nếu #131 xác nhận.
- **(m) #131 THÔ:** event đầu sau btime eid 11652 `requeued_after_restart`,
  run 210 (72de8dca — chính run đợt 201), 15:05:14.894601Z = btime **+49,894601 s**;
  cửa (m) [15:04:58Z, 15:05:14.8Z] → **NGOÀI biên trên 0,094601 s trên số thô
  (DAO ĐỘNG** — caveat đồng hồ F-199-T2-4 ~2 s có thể lật vào trong:
  offset thật ≈ 47,89–49,89 s; **T2-202 phải giải quyết bằng đo drift tươi**).
  Tiếp dispatched eid 11653 + reattached eid 11654 (cùng run 210).
  Event cuối trước btime eid 11651 `succeeded` 15:00:00.1991Z;
  silence 11651→11652 = 314,696 s; ID liên tục.
  eid 11652 detail "daemon startup recovery"; eid 11654 detail
  "execute turn already complete (model-output evidence)" — trùng mẫu các reboot
  đã xác nhận #127/#129 (KHÁC "active execute turn" của daemon restart 08:41:43Z)
  → củng cố (e)-200 rằng 08:41:43Z là daemon-only.
  Run 210 bị reboot giết giữa chừng rồi requeue — kết cục thuộc T7-201.
- Run 209 (8c1d8a33, sched 11:35:51Z) SUCCEEDED, finished 14:35:13Z;
  run 210 (72de8dca, sched 14:35:51Z) RUNNING lúc đọc trước reboot.

## §6. Mù — B1 15:25:39Z, CERT/FULL GIỮ 76/91

- B1 = **2026-11-27T15:25:39Z** (1795793139), window 533.421 s
  (B0 đứng 2026-11-21T11:15:18Z). Counts: repo-1 8.728 / hidden_files 16.917 /
  outside 31.662 / tmp 603 (giảm từ 643 — reboot #131 xóa /tmp) / fifth 23.
  Merged unique second-marks: **12.657** (200: 12.257).
- FILE gaps: R max **1238 s OPEN** (không đổi); S max **3235 s OPEN** (file thô —
  H-S4, content lấp); T max **627 s CLOSED**; U max **9316 s OPEN** (không đổi,
  15:00:33→17:35:49 24/11); U thứ 2: 8968 s; thứ 3: 8572 s (H-U24 widened —
  endpoint dời, giữ theo tiền lệ F-186-T2-9); thứ 4: 7788 s (H-U25 widened
  03:26:02→05:35:50 — endpoint KEPT (03:34:31, 05:35:38) cho hole-recheck).
- UNION-A: R **1222 s OPEN** / S **662 s CLOSED** / T **38 s CLOSED** / U **9316 s OPEN**
  (21.636 marks; U top: 9316/8968/8572/7788/6807/6799).
- UNION-B (+ SYS heads incl. SYS7D64 15:04:44Z): R **1211 s OPEN** / S **591 s CLOSED** /
  U **8372 s OPEN** (21.693 marks; U top: 8372/8109/7861/6469/6100/5766).
- **Mọi max đoạn không đổi vs 200 → CERT/FULL GIỮ 76/91.**
- Content mới: replay-watch-201 70 dòng strict poll trong U; ram-sampler-201 36 dòng
  trong U; replay-watch-200 321; ram-sampler-200 272. Không có H-U26 mới
  (vùng 11:21:54Z→B1-201 có mark dày).
- Sessions (`blind201-sessions.py`, log 60 dòng): 303 exec-logs trong window
  (200: 300), 12 skipped own-marker logs (200: 7 — tăng do thêm marker
  round201-t2/m-check201 của chính phiên này), jump witness #64–#86: 1 mỗi cái
  (proc_ab58b9c7039d.log — T01-199 survey, trích btimes); 0 trong R/S/T mtime,
  303 trong U.
- Witness (`witness201.py`, log 164 dòng): #87–#114: 2; #115: 3; #116–#118: 2;
  #119–#120: 3; #121–#122: 4; **#123: 6 (200: 7 — xem F-201-T2-2)**;
  #124–#125: 2; #126: 9; #127: 4; #128: 9; #129: 3; **#130: 4 raw, 0 THẬT**
  (triaged tay dưới). **Tổng: 0 THẬT cho #64–#130.**
- #130 witness triage (kiểm tay từng hit):
  - (1)(2) cặp 5886fe45 (proc_a824909556c8.log, proc_2a227c09d525.log) —
    trích btime #126 "22:32:41" không ngày.
  - (3) proc_6f315e49bb43.log (ba44418b, mtime 14:57:23Z) = poll-wait T4-201:
    trích btime #130 11:21:41Z trong header mỗi poll + deadline 16:30:00Z
    (thời gian kế hoạch, không phải hoạt động); hoạt động thật 14:53:03–14:57:23Z,
    toàn bộ TRƯỚC reboot.
  - (4) proc_6178475ad3ed.log (7ce4f455, mtime 15:03:11Z) = vite-lock log:
    trích "btime ~11:21:41–11:21:54Z" + "hạn cứng 17:35:51Z" (kế hoạch) +
    lock events thật 14:56:10–15:03:11Z, toàn bộ TRƯỚC reboot.
  - → **0 THẬT.**
- **F-201-T2-2:** #123 7→6 do file bị xóa — proc_c9091c83d696.log
  (agent 0ee1d9a9, mtime 14:42:04 26/11) CÓ trong witness200.log nhưng ĐÃ BIẾN MẤT
  khỏi đĩa trước witness201 (~15:30Z 27/11) — exec-log pruning (mất chứng cứ).
  Giải thích một phần hiện tượng F-200-T2-4 (raw #87–#114/#115/#119–#120 giảm vs 199
  chưa rõ nguyên nhân): ít nhất một trường hợp là file bị xóa giữa hai lần chạy witness.
- Hole-recheck (`hole-recheck201.py`, lần 44; H-E1-88 lần 43, H-U25 lần 3):
  35 holes, **ALL NEW=0**; H-E1-88 inside=337 float-trap=337 NEW=0;
  H-U25 inside=0 NEW=0 (vẫn chưa lấp); whole-tree 74.831 files trong union range.
- Evidence (`evidence-check201.py`): 41-list **0 present / 41 missing, 0 NEW missing
  since 200**; 349-list **0/349, 0 NEW**; #100 survivor proc_34889a901a7e vẫn missing
  — bộ chứng cứ #100 **0/6** (không đổi).

## §7. Đối chiếu T4-200 W2/W3 — KHÔNG TỒN TẠI (vacuous)

- `hidden_files/round200-t4/windows.md`: W2/W3 **KHÔNG CHẠY** — poller thoát 12:05:10Z
  sau lượt hợp lệ (ngân sách 1/3). `chain-t4.log`: COVERAGE-CHECK 2/2 12:05:10Z;
  attempt1 20/20 + lớp B 5/5 → HỢP LỆ; poll #29 12:01:09Z mở gate.
- ps-before W1: **0 Chrome / 0 node tsc-test / 0 vite** (chỉ chuỗi lệnh của waiter T8
  pid 4015 — đã được parent phán KHÔNG VI PHẠM ở (p)-200 (i)).
  ps-after W1: chỉ vite của chính T4 (npm/node/esbuild) + lệnh sleep kiểm chéo của
  T2-200 — **0 Chrome/tsc/test**.
- `b2-spikes.log` (round200-t9, 2268 dòng): T4-200 LIMITS §3: 0 spike trong W1
  (99 spikes, toàn bộ ngoài W1) — sampler T9 đã được parent phán KHÔNG VI PHẠM
  ở (p)-200 (ii).
- Node activity sau poller thoát (12:05:10Z): T8 harness 12:13:13–12:28:21Z
  (GATE-FOUND 12:12:06Z, 67 s sau T4 .done 12:11Z; T8-200 LIMITS: 0 vi phạm,
  gate file-based đúng quy tắc (p1)) — nằm ngoài mọi cửa sổ yên.
- **Kết luận: không có chồng lấn/vi phạm mới nào trong W2/W3 đợt 200 vì các cửa sổ
  đó không tồn tại; mục đối chiếu từ T2-200 §10 giải quyết VACUOUS. W1-200 đã phán
  xong ở (p)-200.**

## §8. Chồng lấn W1 đợt 201 — F-201-T2-3 (tự báo cáo)

T4-201 W1: **14:56:50–15:00:21Z** (poll #6 → inner-end), lượt HỢP LỆ #69
(20/20, lớp B 5/5, tickCost median 50,5 ms), poller thoát 15:00:58Z.
W2/W3-201 KHÔNG CHẠY. T2-201 chạy 3 thứ TRONG W1:

- (a) **m-check201.py tail ~14:56:50–14:57:28Z (~38 s):** DB reads (host-side) +
  ghi log 278,8 KB (một phần trong cửa sổ). Script bắt đầu ~14:50Z, trước khi
  poller T4 mở (14:53Z), nhưng chạy dài quá W1 mở.
- (b) **m56-201.py ~14:57:30–14:59:21Z (~111 s):** 5 DB query hướng mới +
  **4 lần `find /home/hatch/workspace` toàn cây** + ghi log 51,8 KB.
  Bốn lần find là tải nặng nhất trong 3 mục.
- (c) **probe #120 14:59:59Z (~1 s):** ghi 2×5 KB (tmp + ws) + append log +
  heartbeat (tmp+rename) + sync.

Không có Chrome/tsc/test/vite nào của T2 trong W1. Attempt vẫn HỢP LỆ 20/20,
tickCost 50,5 ms.

- B2 dữ kiện #13 (T4-201): W1 **24 SPIKE** load1 ≥ 3,0, **14:57:01–14:59:01Z**,
  max 3,66 — trùng thời gian với (a)+(b). T4-201 ghi "tải chủ yếu do chính
  attempt tạo". T2 **KHÔNG loại trừ được** đóng góp từ các find/DB của mình,
  cũng **KHÔNG chứng minh được** có đóng góp. Probe #120 (14:59:59Z) chạy
  SAU khi cửa sổ spike kết thúc 58 s → không gây spike.
- **Phán cuối thuộc parent ở (p)-201; chuỗi 0 vi phạm (0→1 sau (p)-200) phụ thuộc
  phán này.** Tiền lệ: (p)-200 waiter T8 + sampler T9 = KHÔNG VI PHẠM
  (chỉ đọc file, nhẹ hơn); (p)(iii)-199 tsc/test = VI PHẠM / VI PHẠM NHẸ
  (nặng hơn nhiều). Trường hợp này nằm giữa: ghi file nhẹ + find toàn cây,
  attempt vẫn pass.
- Bài học: T2-202 xếp m-check/m56/probe TRƯỚC khi poller T4 mở gate hoặc SAU khi
  T4 .done — kiểm windows.md + poll-t4.log tail trước khi chạy script dài.

## §9. Sổ vi phạm (phạm vi T2, đợt 201)

- W2/W3-200: không tồn tại → 0 vi phạm.
- W1-201: 1 chồng lấn tự báo cáo (F-201-T2-3) — chờ phán parent (p)-201.
- Không có tsc/test/Chrome nào của T2 trong bất kỳ W1 nào. Không vi phạm mới nào khác.

## §10. Bài học + nợ T2-202

- Bẫy: sed global 200→201 làm sai QUOTE_MARKERS/skip tuples trong blind201-sessions.py
  và witness201.py — đã sửa tay; lần sau sửa theo ngữ cảnh từng dòng.
  `tail -3 $(...)` treo khi grep rỗng (đọc stdin) — tránh tail không có file.
  `find ~/workspace` chậm (~2–5 phút) — tránh lặp lại; và nay thêm:
  **find toàn cây KHÔNG chạy trong W1 của T4** (F-201-T2-3).
- Nợ T2-202:
  1. Phân loại CUỐI (m) #131 (knife-edge +49,894601 s vs biên +49,8 s —
     đo drift tươi, giải quyết caveat F-199-T2-4).
  2. B-#130 (cần FULL175 = FULL174 + gap #130→#131 13.364 s, neo #129 btime 06:38:56Z).
  3. (m) #56 lần 44 (186 hướng — 185 + 5 mới của đợt 202, hoặc 185 nếu không thêm).
  4. Hole-recheck lần 45 (H-E1-88 lần 44, H-U25 lần 4).
  5. Probe #121 — chạy NGOÀI W1 của T4-202 (kiểm windows.md trước).
  6. Witness #131 (thêm B131 vào witness202.py; 4 raw #130 đều 0 thật — mẫu trích
     dẫn đã rõ).
- (m) #131 THÔ + B-#130 + (m) #56 lần 44 đều thuộc T2-202; T2-201 KHÔNG phán.

---

## Phụ lục — Script/log làm việc (hidden_files/round201-t2/)

`m-check201.py/.log`, `m56-201.py/.log`, `blind201-gen.py/.log`,
`blind201-{repo-1,hidden_files,outside,tmp,fifthscope}.txt`, `blind201-b1.txt`,
`blind201-merged.py/.log`, `blind201-content.py/.log`, `blind201-sessions.py/.log`,
`witness201.py/.log`, `hole-recheck201.py/.log` (+ `holerecheck-all.txt`,
`find-stderr.txt`), `evidence-check201.py/.log` (+ `evidence-check201-41missing.txt`,
`evidence-check201-349.txt`, `evidence-check201-missing.txt`,
`evidence-check201-newmissing.txt`), `eperm-sweep201.py/.log`.
Probe log: `hidden_files/eperm-probe-v2.log` (120 dòng probe).
