# PHASE 9 — ROUND 174 — T2 EPERM LIMITS

**T2 đợt 174** — EPERM probe #92, phân loại (m) #84/#85 **CUỐI**,
INSIDE #83/#84/#85, mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 17,
F-174-T2-5 (chồng cửa sổ attempt T4).
Đợt 174 mở 23:35:51Z 22/11/2026 (06:35:51 +07 23/11; lượt cron
06:35 +07; run 174 scheduled 23:35:51Z). Boot lúc viết: 3c704685 (#85, btime
22:59:36Z) — **không có reboot mới trong phiên T2** (kiểm cuối 00:10:06Z
vẫn 3c704685). **Số hiệu #84/#85 ĐÃ ĐƯỢC T0-174 XÁC NHẬN 9 nguồn**
(round174-t0.done 23:53Z) — T2 không còn ghi "chờ T0-174" cho hai số
hiệu này; (m) #84/#85 + INSIDE #83/#84/#85 dưới đây là **phân loại
cuối ở cấp T2 — parent quyết cuối**.

## §0. Headline

- **(m) #84: DƯƠNG — parent quyết cuối.** Requeue duy nhất
  eid 10197, run 173, 21:02:00.482Z = btime +45,482 s ∈ [33; 49,8]
  (cách biên dưới 12,482 s, biên trên 4,318 s). 1 run sống tại btime.
  Đối chiếu độc lập từ DB tươi + neo frame-drift kiểm lại từ file gốc
  (sampler +5 s, watcher +9 s, T4-poller +21 s — khớp T2-173 từng số).
  **Nếu chấp nhận: n ứng viên 30/31 → 31/32.**
- **(m) #85: DƯƠNG — parent quyết cuối.** Requeue duy nhất
  eid 10222, run 173, 23:00:10.397Z = btime +34,397 s ∈ [33; 49,8]
  (cách biên dưới **1,397 s — sát biên thứ hai sau #81 (0,477 s)**,
  biên trên 15,403 s). 1 run sống tại btime. **Nếu #84 và #85 cùng
  được chấp nhận: n ứng viên 30/31 → 32/33.**
  Caveat (F-174-T2-2): verdict KHÔNG bền với neo watcher duy nhất
  (+8 s → counterfactual +26,397 s dưới dải) — cùng dạng #71/#81;
  caveat phân số của T0-174 (F-174-T0-4): boot_est +0,729 s → offset
  ≈ +33,668 s — **vẫn trong dải** (cách biên dưới 0,668 s).
- **INSIDE #83: TRUE (FULL129) — FINAL** (#83 đã được T0-173 chứng
  nhận; chuỗi dài 2). **INSIDE #84: TRUE (FULL130) — chuỗi dài 3.
  INSIDE #85: TRUE (FULL131) — chuỗi dài 4.** Hai dải mâu thuẫn ở
  #83 (FULL128 nói NGOÀI, muộn 3.386 s) và #85 (FULL130 nói NGOÀI,
  muộn 399 s); hai dải ĐỒNG THUẬN ở #84 (FULL129 cũng nói TRONG).
  Dải phương pháp chi phối theo F-165-T2-1.
- **Mù #96? VẪN MỞ** — đoạn R 1.238 s (file) / 1.222 s (union-A) /
  1.211 s (union-B), **lần thứ MƯỜI liên tiếp không đổi một giây**.
  U union-A/B 1.118 s — ĐÓNG theo union, **VẪN cách sàn 1.147 s đúng
  29 s** (không đổi). U file max gap TĂNG 2.335 → 2.701 s (hố mới
  H-U14 — 2 exec-log edging H-U5 bị xóa giữa hai đợt; union vẫn
  đóng). **Mù #88? VẪN MỞ** — hole-recheck lần 18: 337 hit,
  **0 mốc mới** (lần thứ mười tám liên tiếp). Mù #95?/#94?/#77?
  giữ nguyên. **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 17 không thu hẹp** (8 hướng
  MỚI: 6 âm tính theo dữ liệu, 2 rỗng theo cấu trúc; mốc mới duy
  nhất là request của session run 156 lúc 20:19:34.636Z — cùng chuỗi
  kết thúc với mốc max đã biết, KHÔNG thu hẹp). Cửa R [2,56251;
  2,66817) / J [2,566; 2,80753] s GIỮ NGUYÊN. **n chính thức GIỮ 14.**
- **EPERM probe #92: ok=2 fail=0** (23:39:02Z, boot 3c704685).
  Sweep #92: 168 file *.log, 5 file có hit, 15 occurrence — **0 sóng
  thật**. Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Run 173 TIMEOUT** 23:36:04Z (số liệu; kết cục thuộc T7-174):
  wall 10.813 s, finished 13 s SAU hạn, claimed_at = đúng hạn
  23:35:51Z (F-174-T0-3); viết lại 2 lần (#84 + #85). Run 174 bắt
  đầu cùng giây run 173 timeout (23:36:04Z).
- **F-174-T2-5 — chồng cửa sổ attempt T4:** script m56-174.py chạy
  chồng ~75 s đầu attempt #1 của T4 (mở 00:07:44Z, trong lúc script
  đang chạy; đã kiểm T4 lúc 00:06:59Z chưa có attempt). Không chạy
  thêm script nặng nào sau đó. Xem §4.2.

## §1. Điểm (m)

### §1.1 (m) #84 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #84: 21:01:15Z** (epoch 1795381275), boot 4ae2d2ea, gap
  #83→#84 = 2.128 s. **T0-174 XÁC NHẬN 9 nguồn** (round174-t0.done).
  T7-173 xác minh 9 nguồn; T2-173 xác minh 8 nguồn trực tiếp;
  T2-174 kiểm lại độc lập các neo frame-drift từ file gốc (xem §1.4).
- **Requeue duy nhất** trong cửa hẹp [21:01:15Z, 21:20:10Z] VÀ cửa
  mở rộng [21:01:15Z, 22:00:00Z] (mọi job, DB tươi T2-174):
  **eid 10197, run 173 (d95c3e04), 21:02:00.482Z = btime +45,482 s
  ∈ [33; 49,8]** (cách biên dưới 12,482 s, biên trên 4,318 s).
  Kiểm lại cửa mở rộng tới 23:59:00Z: chỉ 2 requeue toàn ngày —
  eid 10197 (#84) và eid 10222 (#85) — 0 requeue nào khác.
- Run 173: 8 event tổng cộng — dispatched 20:35:51.082Z eid 10187;
  requeued 21:02:00.482Z eid 10197; dispatched 21:02:00.779Z eid
  10198; reattached 21:02:00.905Z eid 10199; requeued 23:00:10.397Z
  eid 10222; dispatched 23:00:10.503Z eid 10223; reattached
  23:00:10.632Z eid 10224; timeout 23:36:04.643Z eid 10229.
  Bị viết lại lần 1 tại #84: started_at 1795379751 → 1795381320
  (+1.569 s); boot_gen cron_boot_a6a30a368e814e418d0eb6b8c21dc134
  (#84); attempt 1.
- **Đúng 1 run sống tại btime #84** (event-based): run 173. 6 event
  trong cửa hẹp (3 của run 173 + reconciled 21:15:34Z eid 10200 +
  heartbeat dispatched+succeeded 21:15:34Z eid 10201/10202).
  3 event ngay trước btime [20:50:00Z, 21:01:15Z): reconciled
  21:00:00Z eid 10194 + deterministic-doctor dispatched+succeeded
  21:00:00Z eid 10195/10196 (doctor xong 75 s TRƯỚC btime).
- **Phán: (m) #84 DƯƠNG — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 30/31 → 31/32.**

### §1.2 (m) #85 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #85: 22:59:36Z** (epoch 1795388376), boot 3c704685, gap
  #84→#85 = 7.101 s. **T0-174 XÁC NHẬN 9 nguồn** (round174-t0.done).
  T2-174 tự xác minh 8 nguồn trực tiếp: boot_id + btime (/proc/stat)
  + uptime -s 22:59:36Z + /proc/1 22:59:48.218Z (+12,218 s) +
  journal idx 0 first entry 22:59:48.774Z (+12,774 s) + wtmp begins
  22:59:48.418Z (+12,418 s) + last reboot 22:59 still running +
  who -b 22:59.
- **Requeue duy nhất** trong cửa hẹp [22:59:36Z, 23:18:31Z] VÀ cửa
  mở rộng [22:59:36Z, 23:59:00Z] (mọi job, DB tươi T2-174):
  **eid 10222, run 173 (d95c3e04), 23:00:10.397Z = btime +34,397 s
  ∈ [33; 49,8]** (cách biên dưới **1,397 s**, biên trên 15,403 s).
  **Sát biên thứ hai sau #81** (0,477 s); #82 là 5,438 s, #84 là
  12,482 s.
- 7 event trong cửa hẹp: reconciled 23:00:10.351Z eid 10221 (46 ms
  TRƯỚC requeue — reconciler phát hiện run chết rồi requeue) +
  requeued 23:00:10.397Z eid 10222 + dispatched 23:00:10.503Z eid
  10223 + reattached 23:00:10.632Z eid 10224 + reconciled
  23:15:34.047Z eid 10225 + heartbeat dispatched+succeeded
  23:15:34.087Z/132Z eid 10226/10227.
- Run 173 bị viết lại lần 2 tại #85: started_at 1795381320 →
  1795388410 (+7.090 s); boot_gen cron_boot_4cb68ccd677d4e09b868d3993efa1477
  (#85); attempt 1.
- **Đúng 1 run sống tại btime #85** (event-based): run 173. Các run
  khác đều xong trước btime: heartbeat 22:45:34Z, feed-pulse-05
  22:41:54Z, deterministic-doctor 22:00:00Z.
- **0 event trong [22:48:00Z, 22:59:36Z)** — event cuối trước btime
  là heartbeat succeeded eid 10220 lúc 22:45:34.696Z = btime
  −841,304 s (khoảng lặng 841,3 s không event nào trước btime #85;
  18 event trong [21:20:10Z, 22:59:36Z)). Ghi nhận quan sát
  (F-174-T2-11), không đổi verdict: reconciler vẫn bắn đúng 46 ms
  trước requeue.
- **Phán: (m) #85 DƯƠNG — parent quyết cuối. Nếu #84 và #85 cùng
  được chấp nhận: n ứng viên 30/31 → 32/33.**
  Caveat F-174-T2-2: verdict KHÔNG bền với neo watcher duy nhất
  (+8 s → +26,397 s dưới dải); caveat phân số F-174-T0-4 (+33,668 s,
  vẫn trong dải). Theo quy tắc đứng + tiền lệ #71/#81, offset
  btime-tương đối +34,397 s chi phối.

### §1.3 Run 173 kết cục (số liệu; kết cục thuộc T7-174)

- **status TIMEOUT, finished_at_utc 1795390564 = 23:36:04Z** (timeout
  event eid 10229 lúc 23:36:04.643Z). **claimed_at_utc 1795390551 =
  23:35:51Z — ĐÚNG bằng hạn** (sched 20:35:51Z + 10.800 s);
  claimed→finished = 13 s; finished **13 s SAU hạn**; wall từ sched
  gốc = 10.813 s (3h00m13s); timed_out true; attempt 1; viết lại
  2 lần (#84 + #85); boot_gen cuối cron_boot_4cb68ccd677d4e09b868d3993efa1477
  (#85). T0-174 đọc DB tươi ~23:41Z khớp từng số (round174-t0.done).
- Run 174 (đợt này, 3bcde515): scheduled 23:35:51Z, started
  23:36:04Z (+13 s sau sched — **cùng giây run 173 timeout**),
  status running, boot_gen #85, claimed 23:36:04Z. Ghi nhận cho
  T7-174 (F-174-T2-8; F-173-T0-3 pattern: claimed_at mang ngữ nghĩa
  hạn, không phải thời điểm claim thật — T7-174 đối chiếu).

### §1.4 Frame-drift #84/#85 — OVERLAP thứ 11/12

- **#84 (OVERLAP 11th, ba tiến trình cũ viết qua btime — T2-174
  KIỂM LẠI TỪ FILE GỐC, khớp T2-173 từng số):** sampler-173 dòng
  dd08464a cuối 21:01:20Z = btime +5 s (ram-sampler.log dòng 22);
  watcher-173 poll cuối 21:01:24Z = btime +9 s (replay-watch-173.log);
  T4 poll-wait poll #26 21:01:36Z = btime +21 s (chain-t4.log dòng
  37). Sampler đầu 4ae2d2ea 21:02:32Z = btime +77 s; /proc/1 mới
  21:01:27.309Z = btime +12,309 s. Counterfactual: sampler +5 s →
  +40,482 s (TRONG dải); watcher +9 s → +36,482 s (TRONG dải);
  T4-poller +21 s → +24,482 s (DƯỚI dải). Verdict BỀN với neo
  sampler/watcher, chỉ neo muộn nhất đẩy xuống dưới — cùng dạng #71.
- **#85 (OVERLAP 12th, MỘT tiến trình cũ viết qua btime):**
  watcher-173b poll cuối 22:59:44Z = btime +8 s (replay-watch-173b.log;
  0 poll trên boot mới 3c704685 — watcher chết theo #85).
  Sampler KHÔNG overlap: sampler-173 dòng 4ae2d2ea cuối 22:59:34Z =
  btime −2 s; dòng 3c704685 đầu 23:01:30Z = btime +114 s.
  /proc/1 mới 22:59:48.218Z = +12,218 s; journal first entry
  22:59:48.774Z = +12,774 s; wtmp begins 22:59:48.418Z = +12,418 s.
  Counterfactual: watcher +8 s → +26,397 s (DƯỚI dải). Verdict
  KHÔNG bền với neo duy nhất này — cùng dạng #71/#81 (F-174-T2-2).
- Cơ chế đứng (F-172-T5-1, đã giải thích): container stop/start
  overlap — btime đánh dấu boot mới bắt đầu, không phải boot cũ chết.

### §1.5 (m) #83/#82/#81 — chỉ tham chiếu, KHÔNG mở lại

- #83: parent đã CHẤP NHẬN KHÔNG PHẢI ĐIỂM (quyết (e) đợt 173,
  0 requeue + 0 run sống; T0-173 chứng nhận 9 nguồn). KHÔNG mở lại.
- #82: parent đã CHẤP NHẬN DƯƠNG (quyết (e) đợt 173, +38,438 s).
  KHÔNG mở lại.
- #81: parent đã CHẤP NHẬN DƯƠNG (quyết (e) đợt 172, +33,477 s,
  caveat estimator phân số ≈ +32,85 s). KHÔNG mở lại.

## §2. INSIDE — dải FULL129/130/131

Script: `blind9696-gaps174.py` (exec `blind9696-gaps173.py`, log
`gaps174.log`). Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1). FULL128/129/130 p10/p90 khớp T2-173
bằng assert (1574,20/8836,60; 1575,80/8833,40; 1577,40/8830,20).

- **FULL129**: n=129, mean 1h40'35", median 1h53'42", p10 1575,80 s,
  p90 8833,40 s, sd 0h55'17", in 90–150'=68, <60'=30, >180'=9, >240'=3
  (= FULL128 + [gap #82 = 5.099 s]).
- **INSIDE #83: TRUE — FINAL** — dải FULL129 [19:27:03Z, 21:28:01Z]
  neo 19:00:48Z; btime #83 20:25:47Z TRONG dải, cách biên dưới 3.524 s,
  cách biên trên 3.734,4 s. (#83 đã được T0-173 chứng nhận 9 nguồn.)
  **Chuỗi dài 2.** Đối chiếu vs FULL128 còn hiệu lực: NGOÀI (muộn
  3.386 s) — **hai dải MÂU THUẪN** (như #82); dải phương pháp FULL129
  chi phối theo F-165-T2-1 (F-174-T2-3).
- **FULL130**: n=130, mean 1h40'05", median 1h53'21", p10 1577,40 s,
  p90 8830,20 s, sd 0h55'22", in 90–150'=68, <60'=31, >180'=9, >240'=3
  (= FULL129 + [gap #83 = 2.128 s]).
- **INSIDE #84: TRUE** — dải FULL130 [20:52:04Z, 22:52:57Z] neo
  20:25:47Z; btime #84 21:01:15Z TRONG dải, cách biên dưới 551 s,
  cách biên trên 6.702,2 s. **Chuỗi dài 3.** Đối chiếu vs FULL129:
  TRONG (cách biên dưới 5.652 s, biên trên 1.606,4 s) — **hai dải
  ĐỒNG THUẬN** (lần đầu cả hai dải cùng nói TRONG kể từ #78 —
  #79/#82/#83 đều mâu thuẫn, #80/#81 đồng thuận cùng NGOÀI).
- **FULL131**: n=131, mean 1h40'13", median 1h53'42", p10 1579,00 s,
  p90 8827,00 s, sd 0h55'11", min 0h00'55", max 5h43'18",
  in 90–150'=69, <60'=31, >180'=9, >240'=3
  (= FULL130 + [gap #84 = 7.101 s]).
- **INSIDE #85: TRUE** — dải FULL131 [21:27:34Z, 23:28:22Z] neo
  21:01:15Z; btime #85 22:59:36Z TRONG dải, cách biên dưới 5.522 s,
  cách biên trên 1.726,0 s. **Chuỗi dài 4.** Đối chiếu vs FULL130
  còn hiệu lực: NGOÀI (muộn 399 s) — **hai dải MÂU THUẪN** (như
  #82/#83, nhưng biên muộn chỉ 399 s — gần nhất trong các lần mâu
  thuẫn: #82 muộn 7.348 s, #83 muộn 3.386 s); dải phương pháp FULL131
  chi phối theo F-165-T2-1 (F-174-T2-3).
- Tốc độ reboot: tới #84: 160 reboot / 288,72 h = 1 lần / 108,3 phút;
  tới #85: 161 / 290,69 h = 1 lần / 108,3 phút.

## §3. Mù

### §3.1 Mù #96? (#64) — VẪN MỞ (lần thứ mười không đổi)

B1 quét = 00:00:00Z 23/11 (giờ chạy thực tế, F-172-T2-12; walk chạy
23:56–23:58Z — đuôi U 23:58–00:00Z có thể thiếu vài file tạo muộn,
không ảnh hưởng R/S/T). Walk 23:56:xx–23:57:44Z. Script
`blind9696-investigate.py` / `blind9696-merged.py` /
`blind9696-content.py` / `blind9696-sessions.py` (log tương ứng).

- Đếm file mtime trong cửa sổ [11:15:18Z 21/11, 00:00:00Z 23/11]:
  repo-1 163 (đợt 173: 147), hidden_files 4.939 (4.493), ngoài cây
  2.067 (1.906), /tmp 805 (803 — tmpfs bị #84/#85 xóa rồi tạo lại
  bởi đợt 174), fifth 16. Merged **3.485 mốc giây duy nhất**
  (đợt 173: 3.144).
- **R: file 1.238 s / union-A 1.222 s / union-B 1.211 s — MỞ, Y HỆT
  T2-171/T2-172/T2-173, lần thứ MƯỜI liên tiếp không đổi một giây.**
  S: file 3.235 s / union-A 662 s / union-B 591 s — ĐÓNG theo union.
  T: file 627 s / union-A 38 s — ĐÓNG.
  **U: file 2.701 s (TĂNG từ 2.335 s — hố mới H-U14, xem dưới) /
  union-A 1.118 s / union-B 1.118 s — ĐÓNG theo union, VẪN cách sàn
  1.147 s đúng 29 s (không đổi).** Biến thể +dispatch 11:35:51Z:
  1.211 s — cũng MỞ.
- Hố file U mới trong top 8: **2.701 s (22:06:28→22:51:29Z 21/11)**
  → hố mới **H-U14** (F-174-T2-6): 2 exec-log edging H-U5
  (22:09:05Z `proc_5c237211ba31.log`, 22:32:32Z
  `proc_4ac16e190d3c.log`) đã BỊ XÓA giữa hai đợt (đã kiểm trực
  tiếp: cả hai đường dẫn đều GONE); hố widen tới file nohup
  round165-t9 (22:06:28Z) và ram-sampler.log (22:51:29Z).
  CONTENT-filled bởi sampler-165 d1ddd946 (dòng mỗi 60 s) —
  union-A/B U max vẫn 1.118 s. H-U14 không verdict-bearing (U
  không phải đoạn verdict của #96?).
- R-head 0/0/0/0/0; R-tail repo-1=2 / hidden_files=51 / outside=2 /
  tmp=0 / fifthscope=0 — y hệt đợt 173. Mốc dpkg 11:35:40Z trong hố R
  vẫn là mốc nội dung thật (T0-162 quan sát trực tiếp).
- Nội dung sampler/watcher (content.py đã cập nhật SYS84/SYS85):
  sampler-173 FULL — dd08464a 22 dòng (20:40:19Z→21:01:20Z; dòng
  cuối = btime #84 +5 s, OVERLAP 11th) + 4ae2d2ea 118 dòng
  (21:02:32Z→22:59:34Z; dòng cuối = btime #85 −2 s, KHÔNG overlap
  sampler tại #85) + 3c704685 4 dòng (23:01:30Z→23:04:30Z; sampler
  ngừng viết 23:04:30Z; T9-174 khởi động lại 23:38Z). Sampler-174:
  20 dòng trên 3c704685 (từ 23:38Z). Watcher-173: 38 poll dd08464a
  (poll cuối 21:01:24Z = btime #84 +9 s, OVERLAP 11th).
  Watcher-173b: 210 poll 4ae2d2ea (poll cuối 22:59:44Z = btime #85
  +8 s, OVERLAP 12th; 0 poll trên 3c704685 — chết theo #85).
  Watcher-174: 33 poll 3c704685 (từ 23:41Z). SYS84 = 21:01:27Z
  (T2-173: wtmp +12,868 s, journal +12 s, /proc/1 +12,309 s);
  SYS85 = 22:59:48Z (T2-174: wtmp +12,418 s, journal +12,774 s,
  /proc/1 +12,218 s).
- **Verdict: #96? VẪN MỞ (qua đoạn R). CERT/FULL GIỮ 76/91.**

### §3.2 Sessions / jump witness — 0 hoạt động thật ở mọi reboot

- 336 exec-log trong cửa sổ (đợt 173: 305 — 31 file mới, chủ yếu
  log các luồng đợt 173 muộn + đợt 174). Dir exec-log của chính
  phiên tôi (agent 208d5e57-20b1-41bd-a483-70197298cb71) đã loại
  khỏi walk theo bài học F-172-T2-3.
- Raw jump-witness TĂNG ở mọi boot so với đợt 173 (#64: 4→6, #65:
  5→7, …, #82: 1→5, #83: 0→4; mới #84: 7, #85: 3) — toàn do 7 file
  trích dẫn MỚI tạo sau B1 đợt 173 (F-174-T2-7). Đã kiểm nội dung
  trực tiếp cả 7 file:
  * `proc_87d1108d2f8d.log` + `proc_2be330feb105.log` (agent
    5bdd6efb = T5-173; 263/273 dòng) — output thống kê của T5-173,
    trích timestamp cũ (11:26:05 20/11 … 23:30:00 22/11 — hạn trích).
  * `proc_32ef7e42a529.log` (agent 5bdd6efb; 20 dòng) — trích btime
    #84 (21:01:15Z ×3) + giờ restart poller T4 (21:02:28Z) +
    boot 4ae2d2ea.
  * `proc_bf06af5a174d.log` (agent 7e416a1d; 19 dòng) — trích giờ
    bare 01:25:51Z … 23:45:57Z (log đợt 174).
  * `proc_be50692b8dde.log` (agent 978071ba = T4-173; 17 dòng) —
    trích btime #84 + restart 21:02:28Z; session chạy lúc 22:30:30Z,
    KHÔNG phải tiến trình sống qua #84.
  * `proc_badf15ae992c.log` (agent 950481ff; span 20:25:47..22:30:00)
    — trích btime #83 + hạn 22:30:00.
  * `proc_82c6979af0fd.log` (agent 47795047; 60 dòng) — dòng poll
    watcher-173 21:00:24/21:00:54/21:01:24Z (boot dd08464a); max
    21:01:24Z = btime #84 +9 s — linger OVERLAP 11th, KHÔNG phải
    cầu nối (0 nội dung boot mới trong file).
  Cộng với 2 artifact T2-172 + 1 trích dẫn aggregate-171 (đã trừ
  từ đợt 173): **số thật sau khi trừ: #64: 3, #65: 3, #66: 3,
  #67: 3, #68: 3, #69: 3, #70: 4, #71: 6, #72: 4, #73: 4, #74: 5,
  #75: 4, #76: 2, #77: 2, #78: 2, #79: 0, #80: 0, #81: 0, #82: 0,
  #83: 0, #84: 0, #85: 0.** Tất cả hit còn lại đều là file trích
  dẫn — **0 hoạt động thật ở mọi reboot** (cùng kết luận đợt 173).
  Lưu ý: raw #70 = 7 (dự tính 6 từ cộng file mới — 1 file cũ thay
  đổi span do log được append muộn trong đợt 173; không ảnh hưởng
  verdict vì tất cả đều là trích dẫn).
- Content-ts trong hố R union (11:15:29–11:35:40): 3 hit
  (11:16:22Z ×3, y hệt đợt 173), 0 mốc mới. Content-ts trong hố file
  U max H-U12 (16:09:36–16:48:31): 3 hit tại 16:25:06Z (toàn file
  trích dẫn), 0 mốc mới.

### §3.3 Hole-recheck lần 18 — 0 mốc mới (lần thứ mười tám)

- Find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp
  [19:32:59Z 20/11, 00:00:00Z 23/11]: **14.538 file** (đợt 173:
  13.575). Find stderr: 1 dòng (`/home/hatch/.stagged-uploads:
  Permission denied` — giới hạn đứng).
- **H-E1-88: 337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI —
  lần thứ MƯỜI TÁM liên tiếp 0 mốc mới** (y hệt lần 9–17). Mọi hố
  khác: 0 mới. H-U14 mới: 3 inside = 3 trap (cạnh trái 22:06:28.570/
  .571Z, file nohup round165-t9), 0 mới. H-U13: 2 inside = 2 trap,
  0 mới. H-S3/H-U2/H-U3/H-U6/H-U7/H-U8/H-U9/H-U10/H-U11/H-S4/H-T2/
  H-U12: 1 inside = 1 trap mỗi hố, 0 mới. H-R1/H-R1-old/H-S1/H-S2/
  H-T1/H-U1/H-U2-old/H-U4/H-U5: 0 hit.
- File `round173-t2/holerecheck-all.txt` không bị ghi đè (output lần
  này là file MỚI trong `round174-t2/`; md5 file 173 lúc trước khi
  chạy: 027900ae61c73e363be911bfbdb2c9c5).
- **Mù #88? VẪN MỞ. Mù #95?/#94?/#77? giữ nguyên (không bằng chứng
  mới). CERT/FULL GIỮ 76/91.**

## §4. Mô hình đồng hồ + (m) #56 + F-174-T2-5

### §4.1 (m) #56 — lần thứ 17, KHÔNG THU HẸP (8 hướng MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1): R ≥ 2,562 (từ file session T10-156 mtime wall
20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56
⟺ true-finish > 19:32:47Z).

- **(i) DB `agent.sessions` — updated_at trong D (MỚI; đợt 173 chỉ
  kiểm created_at): 0 session có created HOẶC updated trong D.**
  ÂM TÍNH.
- **(ii) DB `scheduler.terminal_signals` trong D (MỚI): 1 dòng** —
  run 9c7b6986 (run 156), signal `notify_main_agent`,
  created_at_utc 1795205974 (= 20:19:34Z), producer agent 964f2bc4.
  **Cùng mốc max đã biết** (cùng giây 20:19:34Z). ÂM TÍNH — không
  thu hẹp.
- **(iii) DB `scheduler.events` trong D (MỚI — liệt kê đầy đủ):
  19 event**, max **20:19:34.533Z** (succeeded run 156, eid 9500 —
  chính mốc DB đã biết .532Z). Các event khác: requeue run 156
  19:05:18.916Z (eid 9482 — đây là **requeue của #55** (btime #55
  19:04:44Z +34,916 s), đã phân loại từ đợt 156; KHÔNG phải dữ
  liệu của #56 — btime #56 = 19:32:47Z, boot 348dab54, T0-157 xác
  nhận); heartbeat/feed/doctor xen kẽ tới 19:35:34Z; sau đó CHỈ
  CÒN reconciled + heartbeat tới 20:19:34Z. **Cửa ứng viên (m)
  #56 [19:33:20Z, 19:33:37Z] TRỐNG theo giờ DB (T7-157 đã chứng
  minh)** — 19 event này không chứa requeue nào trong cửa đó.
  **ÂM TÍNH — max = mốc đã biết, không thu hẹp.**
- **(iv) DB `runtime.requests` theo session trong D (MỚI — nhóm
  theo root): 167 request = 137 root NULL (max 20:22:35.041Z —
  traffic maintenance e033d2dd, KHẲNG ĐỊNH LẠI hướng (i) đợt 173)
  + 30 root `scheduler:cron:9c7b6986…` (session run 156, max
  **20:19:34.636Z**). Mốc 20:19:34.636Z muộn hơn mốc DB đã biết
  (.532Z) đúng **0,104 s** và muộn hơn sessions.json (.327Z)
  0,309 s — **NHƯNG KHÔNG THU HẸP**: cả ba mốc (.327/.532/.636)
  cùng một giây 20:19:34Z, cùng chuỗi kết thúc của run 156
  (sessions.json ghi trước khi DB succeeded .533Z; request .636Z
  là xử lý terminal-signal/notify SAU khi run đã succeeded) —
  không phải hoạt động mới sau khi run kết thúc; true-finish vẫn
  20:19:34,5Z ± 0,1 s. Cửa R/J GIỮ NGUYÊN.
- **(v) /var/log/apt — CHẠY LẠI (đợt 173 BỊ CHẶN bởi #84):**
  history.log (55.955 B, mtime 23:45:55Z 22/11) 170 dòng
  Start/End-Date, **0 trong D**; term.log 0 trong D; eipp.log.xz
  `xzgrep 2026-11-20` = 0. **ÂM TÍNH** — log apt chỉ còn hoạt động
  22/11 (đúng dự đoán đợt 173: dpkg.log reset theo boot).
- **(vi) Log xoay dpkg/apt (MỚI): RỖNG theo cấu trúc** —
  `dpkg.log.1`, `dpkg.log.1.gz`, `dpkg.log.2.gz`,
  `history.log.1[.gz]`, `term.log.1`, `eipp.log.1.xz` đều KHÔNG
  TỒN TẠI (không có bản xoay nào sống sót).
- **(vii) mtime scan /home/hatch NGOÀI ~/workspace trong D
  (MỚI — đợt 173 (vii) chỉ quét ~/workspace): 18 file** — toàn
  file session của 6 agent (c90387c7 19:56:09Z, ad69c371
  19:59:50Z, a71de8cb 20:04:17Z, 6fc7dd16 20:16:36Z — chính mốc
  neo dưới của R, af13c1c2 20:17:30Z, 964f2bc4 20:19:34Z), **max
  = 20:19:34Z = mốc max đã biết**. **ÂM TÍNH — không thu hẹp.**
- **(viii) Journal (MỚI): RỖNG theo cấu trúc** — chỉ còn 1 boot
  trong journal (idx 0 = #85, first entry 22:59:48Z); không có
  dữ liệu journal nào cho 20/11. `system.journal` mtime
  00:08:40Z 23/11.
- Mốc max đã biết ĐÃ XÁC NHẬN CÒN SỐNG trên đĩa:
  `/home/hatch/agents/agent-964f2bc4-…/sessions/964f2bc4-….jsonl`
  mtime 20:19:34.326Z (ghi nhận lại từ đợt 173; scan (vii) lần này
  không quét `/home/hatch/agents` vì nằm ngoài ~/workspace — xem
  ghi chú (vii): 18 file trên KHÔNG gồm agent 964f2bc4 vì
  `/home/hatch/agents` nằm NGOÀI `/home/hatch/workspace` nhưng
  scan (vii) dùng `! -path /home/hatch/workspace/*` nên agents
  ĐƯỢC bao gồm — 3 file 964f2bc4 lúc 20:19:34Z có trong 18 file).
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
  Tổng 51 hướng âm tính liên tiếp (43 tới đợt 173 + 8 hướng mới
  đợt này: 6 âm tính theo dữ liệu (i)(ii)(iii)(iv)(v)(vii) + 2 rỗng
  theo cấu trúc (vi)(viii)).

### §4.2 F-174-T2-5 — script m56 chồng ~75 s đầu attempt #1 của T4

- Tôi kiểm poll-t4.log lúc 00:06:59Z: poll #35, RAM 901 MB, gate0
  đạt nhưng gateA chưa đạt — **chưa có attempt**. Script m56-174.py
  bắt đầu ~00:07:30Z (find scan (vii) + apt + journal). **T4 mở
  attempt #1 lúc 00:07:44Z** (poll #36: gate0 T5 + gateA đủ,
  RAM=1.068 MB — "CHAY attempt1 NGAY") — đúng lúc script đang chạy
  giữa chừng; script kết thúc 00:08:59Z. **Chồng lấn ≈ 75 s đầu
  cửa sổ attempt** (find toàn cây /home/hatch ngoài workspace +
  đọc apt/journal). Đây là vi phạm chữ của quy tắc đứng (không
  chạy script phân tích nặng trong cửa sổ attempt T4) — dù không
  cố ý (attempt mở sau khi tôi đã kiểm, một poll sau đó) và tải
  thêm chủ yếu là stat-call I/O, không phải CPU nặng.
- Hậu quả: không đo được từ phía T2 (attempt của T4 vẫn đang chạy
  lúc tôi đóng; kết quả attempt thuộc T4-174). Ghi nhận để T4-174
  đối chiếu nếu attempt #1 có dấu hiệu nhiễu tải ở phút đầu.
  **Không chạy thêm script nặng nào sau 00:08:59Z** (mọi việc còn
  lại chỉ là viết file). Bài học: kiểm poll-t4.log NGAY TRƯỚC
  mỗi script nặng (không chỉ đầu phiên) và tránh chạy script dài
  khi RAM đang dao động quanh ngưỡng 1.024 MB (poll #33–#35:
  382→901 MB, đang hồi lên).

### §4.3 T4-174 (theo dõi để tránh cửa sổ attempt)

- T4 gate-polling từ 23:41:17Z (poll #1, gate0 chưa đạt,
  POSTBOOT_PASS cũ); POSTBOOT_PASS #85 về 23:46:57Z (T5-174,
  repair-tay, poll=1) → gate0=T5 từ poll #11 (23:48:55Z). RAM dao
  động mạnh: 1.632 MB (23:48:55Z) → 806 MB (23:55:42Z) → 477 MB
  (00:03:13Z) → 1.068 MB (00:07:44Z, mở attempt #1). **Attempt #1
  mở 00:07:44Z — sau khi mọi script nặng của T2 đã chạy xong
  ngoại trừ m56 (xem §4.2).** T2 đã kiểm chain-t4.log/poll-t4.log
  trước mỗi script nặng (walk, hole-recheck, sessions, gaps,
  content, sweep, m56 — trừ lần m56 chồng như §4.2).

## §5. EPERM probe #92 + sweep

- **Probe #92: chạy 23:39:02Z, boot 3c704685, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 262 → 264 dòng (+1 boot-changed
  dd08464a → 3c704685, +1 probe#92); heartbeat n=92.
  **MemAvailable lúc probe: 450.552 kB** (chụp cùng lệnh probe —
  bài học F-172-T2-7). Cửa sổ probe #92: 20:44:34Z (#91) → 23:39:02Z
  = 10.468 s. Dòng boot-changed nhảy qua #84 (không có probe nào
  chạy trên #84). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #92** (script `eperm-sweep9696.py`, log `eperm-sweep174.log`):
  168 file `*.log` có mtime trong cửa sổ, **5 file có hit, 15
  occurrence** — toàn "sóng EPERM đã tắt" (13×) + 2× "Operation not
  permitted" (cả hai đều là TRÍCH DẪN dòng kết quả sweep #90 trong
  `eperm-sweep172.log`, được trích lại trong `eperm-sweep173.log`
  và exec-log T2-173 `proc_a0403631ccd6.log` — đã kiểm nội dung
  trực tiếp từng dòng) — **0 sóng thật.**
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `agent.sessions` +
  `scheduler.terminal_signals` + `runtime.requests`); `muse.db` từ
  chối `to_timestamp` — dùng literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)`. Mọi số (m) trong LIMITS này đều
  có trong script đối chiếu độc lập `m-check174.py` (log
  `m-check174.txt`) — epoch thô + phép trừ, không qua trung gian.
  Lưu ý: `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ
  (`d95c3e04-a069-432b-a5c6-e615bfe306a1`) — tra bằng short id trả
  0 dòng (bẫy đã gặp, ghi cho T2 sau).
- INSIDE tính bằng `blind9696-gaps174.py` (log `gaps174.log`);
  FULL128/129/130 p10/p90 khớp T2-173 bằng assert trong script.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log của chính phiên (F-172-T2-3); kiểm `grep ^W =` /
  `grep ^hi =` trước khi chạy hole-recheck; output vào thư mục riêng,
  không ghi đè file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d`
  trước khi chạy sessions (F-172-T2-1/F-171-T2-2); chụp meminfo cùng
  lệnh probe (F-172-T2-7). **Bài học mới (F-174-T2-9):** đừng pipe
  output script dài qua `head` — SIGPIPE cắt cả file tee
  (sessions.log lần chạy 1 chỉ còn 161 dòng); chạy lại không pipe,
  log đầy đủ; file `sessions-9696.txt` do script tự ghi thì đầy đủ
  cả hai lần.
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa
  (sessions: 7 file trích dẫn mới đã kiểm nội dung trực tiếp từng
  file trước khi trừ).

### §6.2 Sai số / caveat (F-174-T2-*)

- **F-174-T2-1 — (m) #84/#85 DƯƠNG ở cấp T2, parent quyết cuối.**
  Nếu cả hai được chấp nhận: n ứng viên 30/31 → 32/33 (n chính
  thức vẫn GIỮ 14 — xem §4.1).
- **F-174-T2-2 — (m) #85: hai caveat phải đọc cùng verdict.**
  (a) Neo watcher duy nhất +8 s → counterfactual +26,397 s DƯỚI
  dải (verdict không bền với neo này — cùng dạng #71/#81; theo quy
  tắc đứng, offset btime-tương đối +34,397 s chi phối).
  (b) Caveat phân số F-174-T0-4: boot_est +0,729 s → offset
  ≈ +33,668 s — **vẫn trong dải** (cách biên dưới 0,668 s), nhẹ
  hơn caveat phân số của #81 (+32,85 s, dưới dải). Parent đã chấp
  nhận #81 với caveat nặng hơn — #85 nhẹ hơn ở cả hai chiều
  (margin btime 1,397 s > 0,477 s; estimator phân số vẫn trong dải).
- **F-174-T2-3 — INSIDE: hai dải MÂU THUẪN ở #83 và #85, ĐỒNG THUẬN
  ở #84.** #83: FULL129 TRONG, FULL128 NGOÀI (muộn 3.386 s).
  #85: FULL131 TRONG, FULL130 NGOÀI (muộn 399 s — gần nhất trong
  các lần mâu thuẫn). #84: FULL130 và FULL129 cùng TRONG. T2 áp
  dụng kỷ luật nhãn F-165-T2-1 (dải phương pháp chi phối), như tiền
  lệ #79/#82. Nếu parent không đồng ý kỷ luật này, chuỗi vẫn đứt
  từ #80, dài 0.
- **F-174-T2-4 — (m) #56: mốc mới 20:19:34.636Z KHÔNG thu hẹp.**
  Request của session run 156 lúc .636Z là xử lý terminal-signal
  sau khi run đã succeeded (.533Z) — cùng chuỗi kết thúc, không
  phải hoạt động mới. Nếu parent diễn giải khác (coi .636Z là mốc
  max mới), cửa R/J vẫn không đổi vì mốc max chỉ dùng để chặn
  trên và .636Z nằm trong cùng giây với mốc đã biết.
- **F-174-T2-5 — chồng cửa sổ attempt T4 ~75 s (xem §4.2).** Không
  cố ý; đã dừng mọi script nặng ngay sau đó. T4-174 đối chiếu
  attempt #1 nếu cần.
- **F-174-T2-6 — Mù #96?: U file max gap TĂNG 2.335 → 2.701 s
  (H-U14) do 2 file bị xóa — không phải dữ liệu mới.** Union vẫn
  đóng ở 1.118 s, cách sàn đúng 29 s, lần thứ 10 R không đổi một
  giây. Không có bằng chứng mới nào cho #95?/#94?/#77?/#88?
  (hole-recheck lần 18: 0 mới).
- **F-174-T2-7 — Sessions: raw jump-witness TĂNG ở mọi boot do 7
  file trích dẫn mới.** Đã kiểm nội dung trực tiếp cả 7 file —
  toàn trích dẫn/linger, 0 hoạt động thật. Số thật sau khi trừ
  giữ nguyên như đợt 173 + #84: 0, #85: 0.
- **F-174-T2-8 — Run 173 TIMEOUT (số liệu; kết cục thuộc T7-174).**
  claimed_at = đúng hạn 23:35:51Z (F-174-T0-3); run 174 bắt đầu
  cùng giây run 173 timeout.
- **F-174-T2-9 — Bài học SIGPIPE (xem §6.1).** Sessions.log lần 1
  bị cắt (161 dòng); chạy lại đầy đủ, không ảnh hưởng số liệu.
- **F-174-T2-10 — T4 attempt #1 mở 00:07:44Z (sau khi T2 xong
  script nặng, trừ chồng lấn §4.2); POSTBOOT_PASS #85 ĐÃ CÓ
  23:46:57Z (T5-174, repair-tay, poll=1).** Thuộc T4/T5-174.
- **F-174-T2-11 — (m) #85: khoảng lặng event 841,3 s trước btime.**
  Quan sát, không đổi verdict (reconciler vẫn bắn 46 ms trước
  requeue; doctor 23:00:00Z không thấy event — thuộc T7-174 kiểm
  tra nếu cần).

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 174)

- **(a) (m) #84 DƯƠNG — chấp nhận?** (requeue +45,482 s, 1 run
  sống; verdict bền với neo sampler/watcher, chỉ neo T4-poller
  +21 s đẩy xuống dưới — cùng dạng #71.) Nếu chấp nhận: n ứng viên
  30/31 → 31/32.
- **(b) (m) #85 DƯƠNG — chấp nhận?** (requeue +34,397 s, sát biên
  dưới 1,397 s — sát biên thứ hai sau #81; 1 run sống; verdict
  KHÔNG bền với neo watcher +8 s (counterfactual +26,397 s dưới
  dải); caveat phân số F-174-T0-4 +33,668 s vẫn trong dải.) Nếu
  #84 và #85 cùng được chấp nhận: n ứng viên 30/31 → 32/33.
- **(c) INSIDE #83/#84/#85 TRUE — chấp nhận chuỗi dài 4?** (#83
  FINAL, FULL129; #84 FULL130; #85 FULL131; mâu thuẫn hai dải ở
  #83/#85, đồng thuận ở #84 — dải phương pháp chi phối theo
  F-165-T2-1.)
- **(d) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R không đổi lần thứ
  10; U cách sàn đúng 29 s không đổi; H-U14 mới 2.701 s do file bị
  xóa — 0 mốc mới.)
- **(e) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 18: 337
  hit, 0 mốc mới — lần thứ mười tám liên tiếp.)
- **(f) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 17 không thu hẹp; 8 hướng mới: 6 âm tính theo dữ liệu,
  2 rỗng theo cấu trúc; mốc .636Z cùng chuỗi kết thúc.) n chính
  thức GIỮ 14.
- **(g) F-174-T2-5 (chồng cửa sổ attempt T4 ~75 s) — ghi nhận?**
  (Không cố ý; đã dừng script nặng ngay sau đó; T4-174 đối chiếu
  attempt #1 nếu cần.)
- **(h) EPERM probe #92 + sweep #92 (0 sóng thật) — ghi nhận?**
- **(i) Run 173 TIMEOUT 23:36:04Z (13 s sau hạn, 2 lần viết lại)
  — ghi nhận cho T7-174?** (Không phải verdict của T2.)
- **(j) T0-174: #84/#85 XÁC NHẬN 9 nguồn; marker 37 reboot; O8
  trên #85 WebKit PASS 21/21 ×2 + Chromium PASS 21/21 — chuỗi
  GIỮ 24; POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z (repair-tay, poll=1)
  — ghi nhận?** (Thuộc T0/T5-174.)
