# PHASE9_ROUND182_T4_WEBKIT_QUIET51_LIMITS.md

**Đợt:** 182. **Luồng:** T4 — đo lượt yên WebKit #51 trên 2 boot
+ **#51 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt (ngân sách dùng 0/3).
  CHUỖI LƯỢT YÊN HỢP LỆ GIỮ 44 (không tăng, không đứt — chỉ
  không có lượt mới).** Poller chờ tới hạn cắt 04:30Z rồi thoát
  exit 5 theo thiết kế ("0 attempt").
+ **CỘNG DỒN GIỮ NGUYÊN (44 lượt hợp lệ): P1 192/196, P2 187/187,
  P3-A1 165/196, P3' 156/168 occurrence = 127/131 distinct-seq,
  P7 90/90.** Không có dữ liệu attempt mới — sổ distinct-seq
  as-of-181 KHÔNG đổi (md5 `4ea6802e…` lúc mở và lúc đóng).
+ **BOOT ĐO: HAI boot — 9897d4b4 (#99, btime 01:11:46Z; T0-182
  XÁC NHẬN 9 nguồn) rồi 7a83ab15 (#100 ứng viên, btime 03:09:07Z
  — REBOOT #100 GIỮA PHIÊN giết poller instance 1; số hiệu CHỜ
  T0-183 xác minh 9 nguồn).**
**Ngày:** 24/11/2026 (lượt cron 09:35 +07 24/11 = 02:35:51Z).
**Boot đo:** HAI boot — 9897d4b4 (20 poll) + 7a83ab15 (103 poll).

## 0. Verdict tổng

- **#51 KHÔNG CÓ LƯỢT HỢP LỆ (0 attempt).**
  Poller instance 1 (20 poll trên #99, 02:55:02–03:09:29Z):
  gate0 ĐẠT từ poll #2 (POSTBOOT_PASS #99, 02:55:07Z,
  replay-đầy-đủ, poll=0, KHÔNG caveat) nhưng gate A KHÔNG BAO
  GIỜ mở (load5>2 suốt sau O8 T0; gần nhất poll #11: load1
  1,98 nhưng load5 3,61). Poller instance 2 (103 poll trên
  #100, 03:12:41–04:29:24Z): gate A đủ trên 23 poll nhưng
  gate0 KHÔNG BAO GIỜ đạt (POSTBOOT_PASS #100 CHƯA CÓ;
  postboot check FAIL suốt). Hạn cắt 04:30Z tới → poller thoát
  exit 5, 0 attempt. Ngân sách dùng **0/3**.
- **REBOOT #100 GIỮA PHIÊN (boot 7a83ab15, btime 03:09:07Z,
  gap #99→#100 = 7.041 s — TRỞ LẠI mẫu ~2h; T9-182 xác nhận
  độc lập gap + btime trong baseline notes).** Reboot giết
  poller instance 1 sau poll #20 (không có dòng thoát trong
  log); T4 khởi động lại bằng setsid (instance 2) lúc 03:12:41Z.
  0 attempt bị giết (chưa có attempt nào chạy).
- **Chuỗi lượt yên hợp lệ: GIỮ 44.** Cộng dồn P1/P2/P3-A1/P3'/
  P7 GIỮ NGUYÊN như đợt 181 (xem §7). Chuỗi median tickCost
  vẫn 44 số (mean 47,9, min 39,0, max 60,0; 0 lượt vượt 60).
- **Điều kiện GIỮ NGUYÊN như #50 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **QUYẾT (p) ĐỢT 179 — KIỂM CHỨNG LIVE LẦN 3 KHÔNG THỰC HIỆN
  ĐƯỢC (xem §6, F-182-T4-5):** không có attempt nào → không có
  cửa sổ attempt → `run-analyzers-182.sh` KHÔNG BAO GIỜ chạy.
  Đây KHÔNG phải tái diễn F-179-T4-5 (không có ghi analyzer
  trong cửa sổ attempt vì không có cửa sổ nào) — ghi rõ để
  T10 khỏi nhầm thành "chưa kiểm".
- **0 VI PHẠM THEO T4 — CHUỖI 0 VI PHẠM 3 → 4** (chuỗi tính
  lại từ 1 ở đợt 179 theo quyết (p); đợt này giữ sạch:
  T4 không khởi động script nặng nào trong lúc gate0wait;
  không probe dpkg nào trong cả phiên — chỉ đọc `wc -l`
  dpkg.log + `pgrep -x`; mọi phân tích (stats, B2, LIMITS)
  đều làm SAU khi poller thoát 04:30Z. Pre-flight + 2 test
  poll chạy TRƯỚC khi mở poller / ngoài cửa sổ attempt —
  không có cửa sổ attempt nào tồn tại đợt này).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round182-t4.done` viết lúc đóng,
  CÓ NỘI DUNG, trong hạn cờ ~05:00Z; boot lúc đóng là
  7a83ab15 (#100 ứng viên).

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (02:54:06Z),
ghi vào `hidden_files/round182-t4/preflight-182.txt` — **PASS**
(0 sót; xem F-182-T4-9: 2 dòng echo deadline cũ phát hiện +
sửa trước pre-flight). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–181:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-181 md5
  `4ea6802e…` (occ 156/168, distinct 127/131,
  valid_rounds_p3 32).
- **10/10 analyzer** có mặt (+ `run-analyzers-182.sh` —
  quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 13 file py; Playwright-core
  có mặt (webkit object — import tuyệt đối
  `/home/hatch/scratch-round63-r4/node_modules/playwright-core/
  index.mjs`, cùng đường dẫn probe dùng); media
  `stripes-nonperiodic.mp4` (140.828 B) có mặt; không có
  `vite.lock`, không có `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-24
  04:30:00 UTC` → **1795494600** = 04:30Z (hạn cờ ~05:00Z =
  1795496400, hạn cứng 05:35Z = 1795498500); grep 0 hit cho
  `22:30`/`23:00Z`/`23:35Z`/`round180-t5`/`poll-test-181`/
  `WebKit #50`/`T4-181a`/`default=181`/`01:30` trong script mới;
  `round181` chỉ còn trong fallback T5FLAG + glob chống nhiễu
  (có chủ đích).
- **Copy-forward 181 → 182:** deadline `01:30Z` → `04:30Z`;
  hạn cờ/cứng `02:00Z`/`02:35Z` → `05:00Z`/`05:35Z`; T5FLAG
  chính `round182-t5/` + fallback `round181-t5/`; W trong 5
  script ĐÃ LÀ `round182-t4`; `T4-181a` → `T4-182a`;
  `default=181` → `default=182`; `WebKit #50` → `#51`;
  glob chống nhiễu `round180-*` → `round181-*`.
  (Grep stale-string lần 1 sót 2 dòng echo deadline cũ
  `T01:30:00Z` — phát hiện + sửa trước pre-flight, xem
  F-182-T4-9; grep lần 2 sạch.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 181; `build-distinct-seq-ledger.py` không
  copy theo mẫu 23-file đợt 181 trừ file này); **`tree-md5.txt`
  KHÔNG có trong danh sách cleanup (F-175-T4-1 đã sửa) — còn
  nguyên, nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round181-t4` còn **0 file
  mtime ≥ 02:35:51Z** (giờ mở đợt 182).
- **GATE0 LÚC MỞ: CHƯA ĐẠT TRÊN BOOT #99 — khác đợt 181 lúc
  mở đã đạt thì đợt này cũng chưa đạt, nhưng postboot
  check-only của T4 PASS ngay (exit 0).** dpkg.log 1468 dòng;
  round182-t5 mới chỉ có verify-formB log (chưa có
  POSTBOOT_PASS lúc 02:54Z — T5-182 viết cờ 02:55:07Z, 1 phút
  sau); postboot check-only chạy tay **exit 0 PASS**
  (replay #99 thực ra đã xong — khác đợt 181 FAIL lúc mở).
  Gate0=T5 chỉ đạt ở poll #2 (02:55:47Z) sau khi T5 viết cờ.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (02:54:18Z): RAM 1187 MB, load1 3,03/load5 1,93,
  gate0=T4-check-only (PB=0), t5flag=cu (#98), apt=0, dpkg 1468.
  Lần 2 (02:54:20Z): RAM 1182 MB, load1 3,03/load5 1,93,
  gate0=T4-check-only, t5flag=cu, apt=0, dpkg 1468. Cửa chưa mở
  vì load1 >2 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 1031–1187 MB; load1 3,03–3,61 lúc mở** — cửa
  chỉ mở khi đủ mọi điều kiện (không bao giờ mở đợt này).
- **F-176-T4-2 (check-classb đếm sampler n chỉ dòng `boot=`):
  KHÔNG CÓ DỮ KIỆN MỚI đợt này (0 attempt → không chạy sampler).**

## 1. Poller — 125 poll thật (2 test + 20 trên #99 + 103 trên #100), 0 lần cửa mở, 1 reboot giữa phiên

- **Test (POLL_TEST=1), 2 poll, boot 9897d4b4
  (02:54:18Z, 02:54:20Z):** cả 2 đều gate0=T4-check-only
  (PB=0), load1 3,03, load5 1,93, RAM 1187/1182 MB,
  lock=khong, blockers=0, apt=0 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-182.log`; thống kê §A đã hợp nhất.
- **Instance 1 — boot 9897d4b4 (#99), 20 poll (02:55:02–
  03:09:29Z), 0 lần cửa mở:** RAM ≥1024: 20/20 (min 1185,
  max 4912 MB); load1<2: 3/20; load5<2: 2/20;
  gate0: **T5 19/20** (từ poll #2) + T4-check-only 1/20
  (poll #1); lock=co 5, khong 15 (T0 giữ, poll #4–#8);
  blockers>0: 5 poll; apt>0: 0; dpkg 1468 → 1468.
- **Giai đoạn 1 — gate0 đạt nhưng load chưa đủ (poll #1–#3,
  02:55:02–02:56:32Z):** poll #1 gate0=T4-check-only (PB=0),
  load1 2,61; poll #2 gate0=T5 (POSTBOOT_PASS #99 viết
  02:55:07Z — xem §4), load1 2,03, RAM 2287 MB; poll #3
  load1 3,17/load5 2,29, RAM 4351 MB. Cửa KHÔNG MỞ vì
  load1/load5 >2.
- **Giai đoạn 2 — T0 giữ lock + blockers (poll #4–#8,
  02:57:18–03:00:24Z):** T0-round182 giữ vite.lock
  (pid 241634, port 5560, ticket 1-17954889960) + blockers
  5/5/5/5/1; load1 leo tới 7,67. Cửa KHÔNG MỞ ĐƯỢC vì thiếu
  lock + blockers + load (tái diễn dạng F-181-T4-4 — xem §6,
  F-182-T4-3). T0 chạy O8 trên #99 trong lúc này (xem §3).
- **Giai đoạn 3 — lock đã nhả nhưng load5 chưa hạ (poll
  #9–#20, 03:01:09–03:09:29Z):** lock=khong từ poll #9;
  load1<2 chỉ 3 poll (#11: 1,98; #18: 1,48; #19: 0,91);
  load5<2 chỉ 2 poll (#1: 1,97; #2: 1,91 — đều trước khi
  T0 giữ lock); **không poll nào đủ đồng thời load1<2 +
  load5<2 + RAM≥1024 trên #99** (gan-mo = 0 — xem §A).
  Gần nhất poll #11 (03:02:41Z: load1 1,98, RAM 4533 MB —
  nhưng load5 3,61). Cửa KHÔNG MỞ.
- **REBOOT #100 GIẾT POLLER INSTANCE 1 (xem §6, F-182-T4-1):
  poll #20 (03:09:29Z) là poll cuối trên #99; không có dòng
  thoát nào trong log; pid 236013 chết theo reboot.**
- **Instance 2 — boot 7a83ab15 (#100 ứng viên), 103 poll
  (03:12:41–04:29:24Z), 0 lần cửa mở:** RAM ≥1024: 23/103
  (min 431, max 2385 MB); 500–1023: 48/103; **<500: 32/103**;
  load1<2: **103/103**; load5<2: **103/103**; gate0:
  **khong-dat 103/103**; lock=khong 103; blockers>0: 0;
  apt>0: 11 poll; dpkg 2 → 309.
- **Giai đoạn 4 — replay host-side rồi dừng (poll #1–#12,
  03:12:41–03:20:58Z):** postboot exit=1 suốt, t5flag=cu
  (cờ round182-t5 là của boot #99, mtime < btime #100);
  apt=1 (apt-get host os-intent replay), dpkg 2 dòng tới
  poll #10 rồi 309 ở #12 (host cài gstreamer1.0-tools
  03:20:44Z — xem §4). RAM tụt dần 1223 → 689 MB.
  Cửa KHÔNG MỞ ĐƯỢC vì thiếu gate0 + thiếu RAM.
- **Giai đoạn 5 — gate0 thiếu, RAM dao động (poll #13–#103,
  03:21:43–04:29:24Z):** postboot exit=1 suốt 91 poll còn
  lại (check-only mỗi 4 poll đều FAIL — thiếu 3 lib + 9 gói
  GST, xem §4); apt=0 từ poll #12; dpkg ĐỨNG YÊN 309;
  RAM dao động 431–2385 MB (≥1024 chỉ 23 poll). Chuỗi
  RAM<500 dài nhất **8 poll (#16–#23, 03:23:58–03:29:14Z:
  480/493/496/496/484/… MB)**. **23 poll đủ đồng thời
  load1<2 + load5<2 + RAM≥1024 (#1–#7, #27–#28, #35–#48)
  nhưng TẤT CẢ đều thiếu gate0** — gate0 là chặn duy nhất
  trên #100 (xem §6, F-182-T4-6).
- **Hạn cắt 04:30Z:** poll #103 (04:29:24Z) là poll cuối;
  poll #104 chạm hạn → `HET HAN CHO 04:30Z 24/11 — GATE DO
  LUC HET HAN (poll cuoi #103): gate0(co-T5=cu(mtime-cu),
  postboot_exit=1) gateA-RAM(516MB<1024)` → `0 attempt —
  dong theo brief dot 182` → poller thoát exit 5 lúc
  ~04:30Z, trước hạn cờ ~05:00Z 30 phút.
- **Phân rã 125 poll thật:** RAM≥1024: 45/125; RAM 500–1023:
  48/125; RAM<500: **32/125**. load1<2: 106/125; load5<2:
  105/125. **Stats "gan-mo" đếm 23 = 23 poll #100 đủ load+
  RAM nhưng thiếu gate0 — CẦN đọc kèm điều kiện gate0 như
  F-179-T4-1/F-181-T4-1 (xem F-182-T4-6).** gate0: T5 19/125
  (toàn instance 1 trên #99); T4-check-only 3/125 (2 test +
  poll #1 instance 1); khong-dat 103/125 (toàn instance 2
  trên #100). blockers>0: 5 poll (toàn lúc T0 giữ lock
  trên #99). apt>0: 11 poll (toàn lúc host replay trên #100).
  **RAM <500 MB: 32/125 poll** (chuỗi dài nhất 8, xem trên).
  Ghi nhận để T9-182 đối chiếu balloon trên #100 (sampler T9
  lúc 04:29–04:31Z vẫn ghi balloon 6.443.824 kB = ĐÚNG TRẦN).

## 2. Attempt — 0 attempt (ngân sách dùng 0/3)

- **Không attempt nào chạy.** Cửa yên không mở lần nào
  trong cả phiên (20 poll #99 + 103 poll #100 + 2 test).
  Ngân sách **0/3** — cả 3 attempt còn nguyên.
- **Không JSON probe, không lớp B, không analyzer nào chạy:**
  `run-attempt-182.sh` không bao giờ được gọi;
  `run-analyzers-182.sh` không bao giờ được gọi;
  0 file `attempt-done-*`; 0 file `preview-b-*-t4-attempt*`,
  `classb-t4-*`, `analyze-t4-attempt*` mới trong phiên.
- **Không attempt nào bị reboot giết** (chưa có attempt nào
  tồn tại lúc reboot #100; chỉ poller instance 1 bị giết).

## 3. B2 spike / đối chiếu sampler T9 + O8 T0 (theo nhiệm vụ đợt 177–182)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT: KHÔNG ÁP DỤNG — không có
  cửa sổ attempt nào đợt này.** Không thể kết luận 0 spike
  hay có spike "trong cửa sổ attempt" vì cửa sổ không tồn tại.
- **T9-182 CÓ `b2-spikes.log` Ở ĐÚNG ĐƯỜNG DẪN (F-181-T9-5
  KHÔNG tái diễn — xem §6, F-182-T4-8):** T4 kiểm trực tiếp
  `~/workspace/repo-1/round182-t9/b2-spikes.log` — CÓ, 1750
  dòng lúc đóng. Theo baseline notes T9-182: **125 spike
  trên #99 (02:53:15–03:06:46Z)** — tất cả TRƯỚC reboot
  #100; spike đầu 02:53:15Z load1 3,94; spike cuối #99
  03:06:46Z load1 3,01. Phân tích chi tiết thuộc T9-182
  lúc đóng (T9 chưa đóng lúc T4 đóng cờ).
- **O8 T0 TRÊN BOOT #99 — PASS 3/3 (theo T0-182.done 03:05Z):
  WebKit 21/21 ×2 (md5 `3b01e872`/`2902fd98`; S1 02:56:57Z /
  02:58:30Z) + Chromium 21/21 (md5 `6603aa27`; S1 03:00:18Z),
  chạy SAU POSTBOOT_PASS #99 (02:55:07Z) 89 s.** T4 poll
  #4–#8 trong cửa sổ O8 đều ghi lock=co thread=t0-round182 +
  blockers → cửa yên KHÔNG mở; poll #9 (03:01:09Z, sau khi
  O8 xong ~51 s) lock=khong. **0 giây chồng lấn giữa O8 và
  attempt T4** (không có attempt nào). T0 giữ lock 260 s;
  0 attempt chồng (T0-182.done).
- **Ghi trong cửa sổ attempt: KHÔNG ÁP DỤNG** (không có cửa
  sổ attempt). `run-analyzers-182.sh` không chạy nên không
  có file analyzer nào bị ghi trong phiên T4 ngoài thư mục
  round182-t4; file `round109-k7/analyze-k7-skiplatest.txt`
  mtime vẫn 18:13:20Z (đợt 179) — 0 ghi mới (kiểm lúc đóng).

## 4. Replay/postboot — POSTBOOT_PASS #99 ĐÃ CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat); #100 CHƯA CÓ

- **Boot 9897d4b4 (btime 01:11:46Z, số hiệu #99 — T0-182 XÁC
  NHẬN 9 nguồn; gap #98→#99 = 7.163 s).**
- **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z** (boot+1h43m21s;
  watcher-182, **mode replay-đầy-đủ, poll=0, KHÔNG caveat**;
  dpkg 1468 dòng, cache 174 .deb, lists 37; postboot PASS
  poll0 độc lập exit=0 lúc 02:55:07Z; 11/11 gói NEED + 5/5
  lib; GST 269=269 thư mục thật; **tools ĐÃ CÀI**; libc-bin
  8.12; cờ cũ e62eef3f lưu POSTBOOT_PASS-e62eef3f).
  **Cờ REPLAY-ĐẦY-ĐỦ — KHÔNG caveat** (khác #98/#96/#94
  repair-sớm, poll=1). Gate0=T5 từ poll #2 instance 1.
  **T4-check-only cũng PASS độc lập từ pre-flight (02:54Z)
  và poll #1 (02:55:02Z)** — replay #99 thực ra đã xong
  trước khi T5 viết cờ 1 phút.
- **Boot 7a83ab15 (btime 03:09:07Z, số hiệu #100 ứng viên —
  CHỜ T0-183 xác minh 9 nguồn; gap #99→#100 = 7.041 s).**
- **POSTBOOT_PASS #100 CHƯA CÓ — KHÔNG AI LÀM (xem §6,
  F-182-T4-4):** T5-182 đã đóng cờ 03:01Z (TRƯỚC reboot);
  watcher-182 pid 236906 START 02:55:07Z, hạn 05:35:00Z —
  **CHẾT theo #100** (poll cuối 03:09:13Z, +6 s biểu kiến
  — lệch đồng hồ, xem F-182-T4-1); replay-watch-182.log
  dừng ở 03:09:13Z; **không có file T5 nào nhắc 7a83ab15**;
  không có watcher nào sống trên #100 trong phiên T4.
- **Replay host-side (os-intent) trên #100 — CHỈ MỘT GÓI
  RỒI DỪNG:** apt history 03:20:44Z ghi `apt-get ...
  Install: gstreamer1.0-tools` (lệnh host
  `HATCH_OS_INTENT_SEED_BASELINE` / dpkg-state replay-reset);
  dpkg 2 → 309 dòng rồi ĐỨNG YÊN từ ~03:21Z tới lúc đóng
  (70+ phút, 0 process apt/dpkg). Postboot check FAIL suốt
  103 poll: **thiếu libEGL.so.1, libavif.so.16, libevdev.so.2;
  GST system plugin 2/269; thiếu 9 gói apt
  (gstreamer1.0-plugins-base/good/bad/ugly/gl/libav/x,
  libavif16, libevdev2)** — xem
  `postboot-t4-182-gate0wait-33.log`. **Đây là nguyên nhân
  gốc khiến gate0 không bao giờ đạt trên #100 → 0 attempt.**
  T4 KHÔNG tự chạy repair (đó là việc của luồng T5; T5-182
  đã đóng — giao parent/T10 quyết, xem §8).
- **0 REBOOT trong cửa sổ attempt** (không có cửa sổ nào);
  **1 REBOOT trong phiên đo** (#100, giết poller instance 1).
  Số hiệu #100 chờ T0-183; (m) #100 + INSIDE #100 thuộc
  T2-183; #100 có giết holder không thuộc T6-183.
  POSTBOOT_PASS #100 CHƯA CÓ — giá trị chân gate (a) cho
  chuỗi FULL PASS: **lượt yên #51 KHÔNG có lượt hợp lệ →
  chân lượt yên THIẾU trên cả #99 lẫn #100 → chuỗi FULL
  PASS KHÔNG lên được đợt này (giữ 1 — parent quyết cuối)**.
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-182 báo cáo (T8-182 có
  waiter `wait-t4-t5-182t8.sh` đang chờ gate T4/T5 — cùng
  bị chặn bởi gate0 #100 như T4).

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND182_T4_WEBKIT_QUIET51_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round182-t4/`):**
  `poll-wait-t4-182.sh` (deadline 04:30Z 24/11 + cờ T5
  round182-t5/ + fallback round181-t5/),
  `run-attempt-182.sh` (lượt yên #51 — KHÔNG còn gọi
  classb/analyzer, xem quyết (p); đợt này KHÔNG ĐƯỢC GỌI
  vì cửa không mở),
  `run-analyzers-182.sh` (chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; đợt này KHÔNG ĐƯỢC GỌI),
  `distinct-seq-182.py` (helper đọc sổ; đợt này KHÔNG DÙNG
  LIVE — không có dữ liệu attempt mới; sổ as-of-181 KHÔNG đổi).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–181, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round182-t4/` — theo đúng mẫu 149–181: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, theo mẫu các đợt trước — chỉ có trong
  `hidden_files/round182-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–181).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-182.sh`, `run-attempt-182.sh`,
  `run-analyzers-182.sh`,
  `t4-attempt-inner.sh` (W = round182-t4 + glob check nhiễu
  chéo round181-*), `check-classb-t4.sh` (W = round182-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-182.py` (thống kê §A;
  footer GIỮ NGUYÊN cộng dồn 44 lượt — không có lượt mới),
  `distinct-seq-182.py` (helper đọc sổ),
  `distinct-seq-ledger.json` (SỔ distinct-seq, as-of-181
  KHÔNG ĐỔI: 127/131 distinct, occ 156/168,
  valid_rounds_p3 32, non_dat [260, 283, 364, 498];
  md5 `4ea6802e…` lúc mở và lúc đóng),
  `preflight-182.txt` + `preflight-postboot-182.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round182-t4/, không stage):**
  `poll-t4.log` (20 poll instance 1 trên #99 + 103 poll
  instance 2 trên #100 + dòng HET HAN 04:30Z),
  `poll-t4.nohup.log` + `poll-t4.nohup2.log` (2 instance),
  `poll-test-182.log` (2 test poll + 2 TEST-POLL-OK exit 7),
  `chain-t4.log` (start poller ×2 + HET HAN 0 attempt),
  `postboot-t4-182-gate0wait-*.log` (check-only mỗi 4 poll;
  instance 1: PB=0; instance 2: PB=1 suốt),
  `stats-182-output.txt` (output stats-182.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: instance 1 #4–#8 T0 giữ lock).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller instance 2
  đã thoát 04:30Z exit 5; 0 vite; 0 Xvfb; `/tmp/.X11-unix/`
  TRỐNG — reboot #100 đã xóa socket X193 mồ côi đợt 181,
  xem F-182-T4-7).

## 6. Sai số F-182-T4-1..9 (+ nợ cũ)

- **F-182-T4-1 — REBOOT #100 GIỮA PHIÊN GIẾT POLLER INSTANCE 1
  (MỚI — NGUYÊN NHÂN GỐC CỦA MỌI DIỄN BIẾN SAU).** Boot
  7a83ab15, btime 03:09:07Z, gap #99→#100 = 7.041 s (T9-182
  xác nhận độc lập gap + btime trong baseline notes).
  Poller instance 1 (pid 236013) chết sau poll #20, KHÔNG có
  dòng thoát nào trong log (chết cứng theo reboot, không
  phải exit có chủ đích). **Bằng chứng lệch đồng hồ trước
  #100 (cùng mẫu F-181-T0-2/F-180-T9-3):** poll #20 của T4
  ghi 03:09:29Z trên boot cũ — MUỘN HƠN btime #100 (03:09:07Z)
  **22 s**; watcher-182 poll cuối 03:09:13Z (+6 s biểu kiến);
  T9 sampler cuối #99 03:09:03Z (−4 s — trong khoảng bình
  thường). Ba mốc không mâu thuẫn nhau: đồng hồ cell chạy
  nhanh ≥22 s ngay trước reboot (T0-182 đã xác nhận delta
  ≥22 s trước #99; F-182-T5-1: watcher-181 poll cuối #99
  +22 s) — poll #20 (+22 s) là mốc muộn nhất, T9 sampler
  (−4 s) là mốc sớm nhất trong cùng cửa sổ chết. Số hiệu
  #100 CHỜ T0-183 xác minh 9 nguồn.
- **F-182-T4-2 — POLLER INSTANCE 1 CHẾT KHÔNG DÒNG THOÁT;
  KHỞI ĐỘNG LẠI BẰNG setsid (ĐÃ XỬ LÝ TRONG PHIÊN).** T4 phát
  hiện poller chết lúc ~03:12Z (log dừng ở poll #20, pid
  236013 DEAD, không còn process poll-wait); khởi động lại
  lúc 03:12:41Z bằng `setsid nohup ... &` + `disown`
  (instance 2, pid 2356) — instance 2 chạy trọn 103 poll
  tới hạn cắt 04:30Z, không chết nữa. Attempt budget bảo
  toàn 0/3 (không attempt nào chạy trước reboot). Bài học:
  nohup thường KHÔNG sống qua reboot VM (đương nhiên) —
  instance 2 dùng setsid để tách session, nhưng reboot vẫn
  giết mọi process; cơ chế phục hồi là T4 phát hiện + khởi
  động lại bằng tay (như các đợt 179/180). Ghi rõ để T10
  khỏi nhầm instance 1 "tự thoát".
- **F-182-T4-3 — T0-ROUND182 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-181-T4-4/F-180-T4-4).**
  Poll #4–#8 instance 1: lock=co (thread=t0-round182,
  pid 241634, port 5560, ticket 1-17954889960) + blockers
  5/5/5/5/1; load1 leo tới 7,67. Vì chưa có attempt nào nên
  không ảnh hưởng verdict; O8 T0 PASS 3/3 trên #99
  (02:56:57–03:00:18Z) và nhả lock trước poll #9 (03:01:09Z)
  — bàn giao sạch (xem §3). Giao T0/T10 đối chiếu lịch các
  luồng trong cửa sổ 02:57–03:01Z.
- **F-182-T4-4 — BOOT #100 KHÔNG CÓ POSTBOOT_PASS, KHÔNG AI
  LÀM REPAIR (MỚI — NGUYÊN NHÂN GỐC CỦA 0 ATTEMPT).**
  T5-182 đóng cờ 03:01Z (TRƯỚC reboot #100 8 phút);
  watcher-182 chết theo #100 (poll cuối 03:09:13Z);
  replay-watch-182.log dừng ở 03:09:13Z; không có file T5
  nào nhắc 7a83ab15; host os-intent replay chỉ cài
  gstreamer1.0-tools 03:20:44Z rồi dừng (dpkg 309, đứng yên
  70+ phút). Postboot check FAIL suốt 103 poll (thiếu 3 lib
  + 9 gói GST; GST system plugin 2/269). **T4 KHÔNG tự chạy
  repair** (việc của luồng T5; chạy apt install sẽ là script
  nặng + chạm dpkg ngoài nhiệm vụ T4). Giao parent/T10 quyết:
  có giao T5-183 viết cờ #100 (repair lại) hay chấp nhận
  0 attempt đợt này và chờ boot sau.
- **F-182-T4-5 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 3 KHÔNG THỰC
  HIỆN ĐƯỢC (GHI NHẬN — KHÔNG PHẢI TÁI DIỄN F-179-T4-5).**
  Không có attempt → không có cửa sổ attempt →
  run-analyzers-182.sh không chạy → không có output analyzer
  nào để kiểm mtime. Lần kiểm chứng live thứ 3 PHẢI DỜI sang
  đợt có attempt đầu tiên (đợt 183 nếu có attempt). Không
  được ghi "kiểm chứng lần 3 ĐẠT" khi không có dữ kiện.
- **F-182-T4-6 — STATS "GAN-MO" ĐẾM 23, 0 MỞ CỬA THẬT
  (GHI NHẬN — TÁI DIỄN DẠNG F-181-T4-1/F-179-T4-1, MỨC NẶNG
  HƠN).** Stats đếm poll đủ load1<2 + load5<2 + RAM≥1024:
  23 poll (toàn instance 2 trên #100: #1–#7, #27–#28,
  #35–#48). Cả 23 đều KHÔNG mở cửa vì gate0 chưa đạt
  (postboot exit=1, t5flag=cu) — lần này gate0 là chặn DUY
  NHẤT (khác đợt 181 chỉ 1 poll gan-mo giả; đợt này 23).
  Stats và cửa thật KHÔNG khớp nếu đọc stats một mình; phải
  đọc kèm điều kiện gate0.
- **F-182-T4-7 — SOCKET X193 MỒ CÔI ĐỢT 181 ĐÃ HẾT (ĐÃ XONG —
  F-181-T4-3 KHÔNG TÁI DIỄN).** Lúc đóng đợt này,
  `/tmp/.X11-unix/` TRỐNG hoàn toàn, 0 process Xvfb — reboot
  #100 đã xóa socket X193 mồ côi (mtime 00:20Z đợt 181)
  cùng toàn bộ /tmp. T4 không dọn tay (không có gì để dọn).
- **F-182-T4-8 — B2: KHÔNG CÓ CỬA SỔ ATTEMPT ĐỂ ĐỐI CHIẾU;
  NHƯNG T4 KIỂM ĐÚNG ĐƯỜNG DẪN NGAY TỪ ĐẦU (F-181-T9-5 KHÔNG
  TÁI DIỄN).** `b2-spikes.log` CÓ tại
  `~/workspace/repo-1/round182-t9/` (1750 dòng lúc đóng);
  T9 baseline: 125 spike trên #99 (02:53:15–03:06:46Z).
  Không có verdict "0 spike trong cửa sổ attempt" đợt này
  (không có cửa sổ). Giao T9-182/T10 đối chiếu spike trên
  #100 với poller T4 nếu cần.
- **F-182-T4-9 — COPY-FORWARD: GREP STALE-STRING LẦN 1 SÓT 2
  DÒNG ECHO DEADLINE CŨ (GHI NHẬN — DẠNG NHẸ F-177-T4-6).**
  Sau copy-forward, grep mẫu `01:30` lần 1 báo sạch nhưng
  2 dòng echo trong poll-wait-t4-182.sh vẫn còn
  `deadline=2026-11-24T01:30:00Z` (định dạng `T01:30:00Z`
  không khớp mẫu `01:30Z`/`01:30:00 UTC` đã sed). Phát hiện
  khi đọc lại file + sửa bằng `s/T01:30:00Z/T04:30:00Z/g`
  TRƯỚC pre-flight; grep lần 2 (mẫu `01:30`) sạch; deadline
  epoch 1795494600 đã kiểm đúng. Không ảnh hưởng vận hành
  (poller chạy với deadline 04:30Z đúng).
- **F-181-T4-1 — TÁI DIỄN DƯỚI DẠNG F-182-T4-6** (gan-mo 23,
  cửa thật 0).
- **F-181-T4-2 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem
  F-182-T4-5 — kiểm chứng lần 3 dời sang đợt có attempt).**
- **F-181-T4-3 — ĐÃ HẾT (xem F-182-T4-7).**
- **F-181-T4-4 — TÁI DIỄN DƯỚI DẠNG F-182-T4-3.**
- **F-181-T4-5 — KHÔNG TÁI DIỄN (xem F-182-T4-8).**
- **F-181-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (chuỗi median
  vẫn 44 số, không có số mới để kiểm — xem §7).**
- **F-181-T4-7 — KHÔNG ÁP DỤNG (0 attempt → không có sampler
  n để đếm).**
- **F-181-T4-8 — KHÔNG ÁP DỤNG (0 attempt → không có p90
  tickCost để đối chiếu).**
- **F-179-T4-5 — KHÔNG TÁI DIỄN (xem F-182-T4-5 — không có
  ghi analyzer trong cửa sổ attempt vì không có cửa sổ).**
- **F-178-T4-1 — KHÔNG TÁI DIỄN.** 0 tick probe-mo của T9
  trong cửa sổ attempt (không có cửa sổ attempt).
- **F-177-T4-4 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem
  F-182-T4-8).**
- **F-177-T4-6 — TÁI DIỄN DƯỚI DẠNG NHẸ F-182-T4-9.**
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng theo
  T4 — chuỗi 0 vi phạm 3 → 4 ở đợt 182.
- **F-176-T4-2 — KHÔNG CÓ DỮ KIỆN MỚI (0 attempt).**
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN.** 0 ghi analyzer trong cửa
  sổ attempt (không có cửa sổ attempt).
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-182-T4-3.**
- **F-175-T4-5 — TÁI DIỄN DƯỚI DẠNG MỚI F-182-T4-1** (reboot
  giữa phiên — nhưng lần này giết POLLER, không giết attempt).
- **F-174-T4-1 — KHÔNG ÁP DỤNG (0 attempt).**
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG ÁP DỤNG (p1p3p7 không chạy — 0 attempt).**
- **F-174-T4-6 — TÁI DIỄN DƯỚI DẠNG F-182-T4-7** (RAM <500:
  32/125 poll — nhưng TOÀN trong lúc CHỜ gate, do replay
  chưa xong + balloon ở trần; không có attempt nào chạy
  trên RAM thấp).

## 7. P3' cộng dồn (GIỮ NGUYÊN — 44 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 182 (GIỮ NGUYÊN — KHÔNG CÓ LƯỢT MỚI):
  P1 192/196, P2 187/187, P3-A1 165/196, P3' 156/168
  occurrence = 127/131 distinct-seq, P7 90/90** (44 lượt hợp
  lệ — #51 KHÔNG có lượt hợp lệ nên không cộng thêm).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 181 §7: "44 lượt hợp lệ" — nay vẫn 44).
- **Đóng góp lượt #51: KHÔNG CÓ** (0 attempt — không có seq
  (c2) mới, không có stall mới, không có dữ liệu P1/P2/P3-A1/
  P3'/P7 mới). Helper `distinct-seq-182.py` KHÔNG DÙNG LIVE
  đợt này (không có đầu vào); sổ distinct-seq as-of-181
  KHÔNG ĐỔI (md5 `4ea6802e…` lúc mở và lúc đóng).
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (không có mẫu mới đợt này để thay đổi).
- Chuỗi median tickCost 44 lượt (GIỮ NGUYÊN như đợt 181 §7):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / 44,0 / 50,0 ms (tổng 2105,5; trung bình
  47,9 ms; min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 183

- **(a) #51 KHÔNG có lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ GIỮ
  44.** Từ phía T4, **chân lượt yên cho chuỗi FULL PASS
  THIẾU đợt này** (0 attempt; trên #99 gate A không mở,
  trên #100 gate0 không đạt). Chuỗi FULL PASS GIỮ 1
  (parent quyết cuối) — không lên được vì thiếu chân lượt yên.
- **(b) P3' cộng dồn GIỮ NGUYÊN 44 lượt: P1 192/196, P2
  187/187, P3-A1 165/196, P3' 156/168 = 127/131, P7 90/90:**
  sổ distinct-seq as-of-181 KHÔNG ĐỔI (md5 `4ea6802e…`).
  **Chờ parent/T10 quyết:** ghi nhận cộng dồn giữ nguyên.
- **(c) BOOT 9897d4b4 (số hiệu #99) — T0-182 ĐÃ XÁC NHẬN 9
  nguồn (gap #98→#99 = 7.163 s). BOOT 7a83ab15 (số hiệu #100
  ứng viên, btime 03:09:07Z, gap #99→#100 = 7.041 s) —
  CHỜ T0-183 xác minh 9 nguồn.**
  **(m) #99 (T2-182 + parent 182; số liệu thô eid 10580
  +40,109 s từ T0-182); (m) #100 (T2-183 + parent 183);
  INSIDE #99 (T2-182; FULL145); INSIDE #100 (T2-183; FULL146);
  #100 có giết holder không (T6-183).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string lần 1 sót 2 dòng echo
  deadline cũ (F-182-T4-9 — dạng nhẹ, sửa trước pre-flight);
  gate0 CHƯA ĐẠT lúc mở nhưng postboot check-only của T4
  PASS ngay (replay #99 đã xong — khác đợt 181).
- **(e) POSTBOOT_PASS #99 ĐÃ CÓ (02:55:07Z, boot+1h43m21s,
  replay-đầy-đủ, poll=0, KHÔNG caveat): GHI NHẬN — cờ
  REPLAY-ĐẦY-ĐỦ, KHÔNG caveat (mạnh hơn #98/#96/#94
  repair-sớm, poll=1). Giá trị cho gate (a) thuộc T8/T10
  quyết. POSTBOOT_PASS #100 CHƯA CÓ — T5-182 đã đóng trước
  reboot, watcher-182 chết theo #100, host replay dừng ở
  dpkg 309 — giao parent quyết có giao T5-183 làm lại cờ
  #100 hay không.** Hướng (3) VẪN ĐỨNG hay không — thuộc
  T5-182 (đã đóng 03:01Z, ghi hướng (3) VẪN ĐỨNG lần 29).
- **(f) RAM <500 MB: 32/125 poll (chuỗi dài nhất 8 poll #16–
  #23 instance 2, trong lúc chờ gate0 trên #100).** Nhưng
  0 attempt chạy trên RAM thấp (không có attempt nào).
  Giao T9-182 đối chiếu balloon trên #100 (sampler T9 lúc
  04:29–04:31Z vẫn ghi balloon 6.443.824 kB = ĐÚNG TRẦN).
- **(g) (m) #99 (T2-182 + parent 182); (m) #56 lần 25
  (T2-182); mù #96?/#95?/#94?/#88? (hole-recheck lần 26)/#77?
  (T2-182); (c')/(f') — đợt này 0 kích hoạt mới (chờ T8-182);
  Plan B B1 (T8-182); 84l10 + Q3 heartbeat (T8-182, driver
  hb128 làm chuẩn); E-213 kết cục (T9-182 — baseline: KẾT
  THÚC bởi sag, mẫu đầu 02:52:01Z); E-214 nếu ghim tiếp trên
  #100 (T9-182); #99/#100 có giết holder không (T6-182/
  T6-183); prune lần 57 (T6-182); checklist (o) (T8-182);
  H3 chỉ giám sát thụ động; birefnet 0 thử lần 36; nhắc mọi
  luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong
  cửa sổ attempt (đợt này T4 giữ 0 vi phạm — chuỗi 3 → 4);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT** (không có
  cửa sổ attempt). Trên #100, host os-intent replay cài
  gstreamer1.0-tools 03:20:44Z (dpkg 2 → 309) — KHÔNG phải
  replay của luồng T4.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 0 lần đợt này
  (0 attempt) → **KHÔNG có lượt yên hợp lệ #51 cho chuỗi
  FULL PASS**. T8 tự quyết O8 đợt này (O8 T0 trên #99 PASS
  3/3 — 02:56:57–03:00:18Z; O8 T8-182 thuộc T8-182 báo cáo;
  waiter T8 `wait-t4-t5-182t8.sh` đang chờ gate T4/T5).
- **(j) F-182-T4-1 (reboot #100 giết poller instance 1, lệch
  đồng hồ +22 s); F-182-T4-4 (#100 không có POSTBOOT_PASS —
  nguyên nhân gốc 0 attempt); F-182-T4-5 (quyết (p) kiểm
  chứng live lần 3 dời sang đợt có attempt); F-182-T4-6
  (stats gan-mo 23, cửa thật 0 — đọc kèm gate0); F-182-T4-9
  (grep stale-string lần 1 sót 2 dòng echo deadline cũ).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-182.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-182.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-24T02:54:18Z - 2026-11-24T02:54:20Z, boot=9897d4b4
   RAM min=1182 max=1187 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 2/2 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=2
   lock: khong=2
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 20 poll, 2026-11-24T02:55:02Z - 2026-11-24T03:09:29Z, boot=9897d4b4
   RAM min=1185 max=4912 >=1024: 20/20 500-1023: 0/20 <500: 0/20
   load1<2: 3/20 load5<2: 2/20 blockers>0: 5 apt>0: 0
   gate0: T4-check-only=1, T5=19
   lock: co=5, khong=15
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- instance 3: 103 poll, 2026-11-24T03:12:41Z - 2026-11-24T04:29:24Z, boot=7a83ab15
   RAM min=431 max=2385 >=1024: 23/103 500-1023: 48/103 <500: 32/103
   load1<2: 103/103 load5<2: 103/103 blockers>0: 0 apt>0: 11
   gate0: khong-dat=103
   lock: khong=103
   dpkg 2->309
   chuoi RAM<500 dai nhat: 8 poll
-- TONG poll that: 125
-- RAM toan phien: min=431 max=4912 >=1024: 45/125 <500: 32/125
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 23/125
   gan-mo? 23 poll (toan instance 3 tren #100, deu gate0=khong-dat, lock=khong, blk=0, t5=cu):
   #1-#7 03:12:41-03:17:12Z (RAM 1161-1455, L1 0.30-1.24, L5 0.61-0.88, apt=1);
   #27-#28 03:32:15-03:33:00Z (RAM 1048-1176, L1 0.76-1.41, L5 0.74-0.83, apt=0);
   #35-#48 03:38:16-03:48:02Z (RAM 1093-2385, L1 0.27-1.98, L5 0.65-1.25, apt=0).
   (Danh sach day du 23 dong trong hidden_files/round182-t4/stats-182-output.txt.)
-- boot 7a83ab15: 103 poll; RAM>=1024 lan cuoi: 2026-11-24T03:48:02Z #48; RAM<1024 lan dau: 2026-11-24T03:17:57Z #8 RAM=1010
-- boot 9897d4b4: 22 poll; RAM>=1024 lan cuoi: 2026-11-24T03:09:29Z #20; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 44 luot hop le): P1 192/196 P2 187/187 P3-A1 165/196 P3' 156/168 occ = 127/131 distinct-seq P7 90/90
-- chuoi median 44 luot: n=44 mean=47,9 min=39,0 max=60,0 vuot-60: 0
```
