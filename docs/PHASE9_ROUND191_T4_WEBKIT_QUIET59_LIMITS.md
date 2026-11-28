# PHASE9_ROUND191_T4_WEBKIT_QUIET59_LIMITS.md

**Đợt:** 191. **Luồng:** T4 — đo lượt yên WebKit #59 trên 1 boot
+ **#59 CÓ LƯỢT HỢP LỆ — attempt1-b0aab705 20/20 + LỚP B ĐẠT
  5/5 + tickCost median 42,0 ms ≤ 60 — LƯỢT HỢP LỆ THỨ 2 LIÊN
  TIẾP (#58 42,0 ms; #59 42,0 ms). CHUỖI LƯỢT YÊN HỢP LỆ 1 → 2
  (ĐỀ XUẤT — parent quyết cuối; (m)-189 đã chấp nhận 0→1).**
+ **BOOT ĐO: MỘT boot — b0aab705 (btime 08:25:43Z; SỐ HIỆU
  #114 ỨNG VIÊN — T0-191/T01 CHƯA ĐÓNG CỜ lúc T4 đóng, parent
  quyết (e) ở §12.3-191). 0 reboot trong phiên đo.**
+ **CỘNG DỒN MỚI (50 lượt hợp lệ): P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 occurrence = 142/145
  distinct-seq, P7 121/121.** Sổ distinct-seq THĂNG CẤP
  as-of-191, md5 `b7ed5791` (seq mới: 146, 464).
**Ngày:** 25/11/2026 (lượt cron 15:35 +07 25/11 = 08:35:51Z 25/11).
**Boot đo:** b0aab705 (23 poll: 2 test + 21 poller).

## 0. Verdict tổng

- **#59 CÓ LƯỢT HỢP LỆ — attempt1-b0aab705.** Cửa yên mở
  poll #21 (09:03:40Z, RAM 1286 MB, gate0=T4-check-only);
  attempt chạy 09:03:40–09:07:10Z, probe 20/20, lớp B ĐẠT 5/5,
  tickCost median **42,0 ms** (n=587, p90 74,0, max 124, min 28)
  — **LUỘT HỢP LỆ, poller thoát 09:07:37Z.** Ngân sách **1/3
  đã dùng (còn 2)**.
- **Chuỗi lượt yên hợp lệ: 1 → 2 (ĐỀ XUẤT — parent quyết cuối
  ở §12.3-191).** #58 hợp lệ (0→1 đã chấp nhận ở (m)-189);
  #59 hợp lệ ngay attempt đầu, median 42,0 ms bằng hệt #58.
- **Chân lượt yên cho chuỗi FULL PASS: CÓ đợt này** (gate
  (a) POSTBOOT check-only PASS trên boot #114 ứng viên + lượt
  yên #59 trên cùng boot b0aab705; O8 T01 21/21 DONE 08:51:44Z
  trên cùng boot — xem §3). FULL PASS lên 2 hay không còn chờ
  chân O8 T8 + harness của T8-191 (chưa đóng cờ lúc T4 đóng)
  — parent quyết cuối.
- **QUYẾT (p) — KIỂM CHỨNG LIVE LẦN 10: ĐẠT** (xem §6,
  F-191-T4-5). 1 cửa sổ attempt: marker 09:03:40.497Z →
  attempt-done 09:07:10.585Z. Mtime sớm nhất của 9 file
  analyzer + classb đều SAU attempt-done: classb +0,099 s,
  c2drawlog +0,241 s; muộn nhất 09:07:37.899Z
  (coverage-check). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Chuỗi live ĐẠT 8 → 9 (đề xuất).
- **0 VI PHẠM PHÍA T4 — đề xuất CHUỖI ĐỢT SẠCH 5 → 6**
  (parent quyết cuối; (p)-189 đã chấp nhận 4 → 5). Phía T4
  giữ sạch: không khởi động script nặng nào trong lúc
  gate0wait; không probe dpkg nào trong cả phiên; 0 chồng
  tải lạ nặng trong cửa sổ attempt (xem §3/F-191-T4-9).
  **B2 CÓ DỮ KIỆN MỚI — DỮ KIỆN THỨ 3 CHO QUYẾT TÁCH**
  (cần ≥3 đợt theo quyết (p) đợt 186 — ĐÃ ĐỦ 3; luật B2
  KHÔNG TÁCH vẫn đứng cho tới khi parent quyết; T4 KHÔNG tự
  quyết tách).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, mọi poll đều tree=YES, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round191-t4.done` viết lúc đóng, CÓ NỘI
  DUNG, trong hạn cờ ~11:00Z. **0 reboot; boot lúc viết cờ
  vẫn b0aab705.**

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (08:44–08:46Z),
ghi vào `hidden_files/round191-t4/preflight-191.txt` — **PASS
PHẦN TĨNH** (1 chuỗi stale bắt được ở lần grep thứ 2 + sửa trước
pre-flight; xem F-191-T4-1). Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–189:** b.json `078938cf…`,
  probe `4291e539…`, vite T4 `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ as-of-189 md5 `8d20238b…` (occ 184/196,
  distinct 140/143, valid_rounds_p3 37, non_dat [260, 364, 498]).
- **10/10 analyzer** có mặt; `bash -n` OK 5 script T4;
  `py_compile` OK 12 file py; Playwright-core có mặt (webkit
  object, import tuyệt đối từ `~/scratch-round63-r4/node_modules/
  playwright-core/index.mjs`); media `stripes-nonperiodic.mp4`
  có mặt (140.828 B); không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-25
  10:30:00 UTC` → **1795602600** = 10:30Z (hạn cờ ~11:00Z =
  1795604400, hạn cứng 11:35Z = 1795606500); grep 0 hit cho
  khi sửa 1 chuỗi sót ở lần 1: docstring `distinct-seq-189.py`
  — xem F-191-T4-1; các hit `round189` còn lại là CỐ Ý:
  fallback T5 `round189-t5/` + glob `round189-*`, vì đợt 190 VOID).
- **Copy-forward 189 → 191 (script python thay thế có neo,
  KHÔNG sed global):** deadline `04:30Z 25/11` → `10:30Z
  25/11`; hạn cờ/cứng → `11:00Z`/`11:35Z`; T5FLAG chính
  `round191-t5/` + fallback `round189-t5/` (đợt 190 VOID —
  không có `round190-t5/`); `T4-189a` → `T4-191a`;
  `default=189` → `default=191`; `WebKit #58` → `#59`;
  glob `round188-*` → `round189-*`; SỬA 1 chuỗi stale trong
  file 189: docstring `distinct-seq-189.py` →
  `distinct-seq-191.py`.
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 189); **`tree-md5.txt` KHÔNG có trong danh
  sách cleanup — còn nguyên, 530e10a7.**
- **Freeze check (F-164-T4-1):** `round189-t4` còn **0 file
  mtime ≥ 08:35:51Z** (giờ mở đợt 191).
- **GATE0 LÚC MỞ: ĐÃ ĐẠT QUA DỰ PHÒNG.** round191-t5/ chưa tồn
  tại (T5-191 chưa khởi động lúc 08:44Z — và vẫn chưa tồn tại
  lúc T4 đóng, xem F-191-T4-8); fallback round189-t5/
  POSTBOOT_PASS mtime 03:11:11Z < btime 08:25:43Z nên poller
  đánh "cu(mtime-cu)", KHÔNG TÍNH — đúng thiết kế chống cờ
  sai boot. **Check-only postboot chạy tay exit=0 PASS**
  (libs đủ, GST thư mục thật 269=269, apt đủ 11 gói — replay
  đã heal xong TRƯỚC khi T4 mở; xem
  `preflight-postboot-191.log`). Gate0 dự phòng T4-check-only
  SẴN TỪ ĐẦU — khác đợt 188/189 phải chờ repair.
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (08:46:02Z): RAM 2941 MB, load1 3,18/load5 2,76;
  lần 2 (08:46:04Z): RAM 3011 MB, load1 3,00/load5 2,73;
  cả 2 gate0=T4-check-only, t5flag=cu(mtime-cu), apt=0,
  dpkg 1468, blockers comm-based=0. Cửa chưa mở vì
  load1/load5 >2 — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật.**
- **RAM lúc mở ~2.500 MB avail; load1 ~3,99 lúc mở** — các luồng
  P1–P4 đợt 191 đang khởi động build/test; cửa chỉ mở khi load
  hạ <2.
- **F-176-T4-2: KHÔNG TÁI DIỄN** — sampler chạy đúng 1 lần
  trong attempt (100 mẫu, dừng sạch, xem §2).
- **F-185-T4-2: KHÔNG TÁI DIỄN** — một luồng T4 duy nhất từ
  đầu đến cuối.

## 1. Poller — 23 poll thật (2 test + 21), 1 lần cửa mở, 0 reboot

- **Test (POLL_TEST=1), 2 poll, boot b0aab705
  (08:46:02Z, 08:46:04Z):** cả 2 đều gate0=T4-check-only,
  load1 3,18/3,00, load5 2,76/2,73, RAM 2941/3011 MB,
  lock=khong, blockers comm-based=0, apt=0, dpkg 1468 → cửa đóng
  → **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần). 2 poll
  này nằm trong `poll-test-191.log`; thống kê §A đã hợp nhất.
- **Instance duy nhất — boot b0aab705 (#114 ứng viên), 21 poll
  (08:48:34Z–09:03:40Z), 1 lần cửa mở:** RAM ≥1024:
  21/21 (min 1286, max 3564 MB); 500–1023: 0/21;
  **<500: 0/21**; load1<2: 8/21; load5<2: 1/21;
  gate0: **T4-check-only 21/21** (postboot PASS từ trước khi mở
  poller; cờ T5 KHÔNG BAO GIỜ xuất hiện — T5-191 chưa khởi
  động); lock=co 5, khong 16; blockers>0: 5 poll; apt>0: 0 poll;
  dpkg 1468 → 1468 (không đổi cả phiên).
- **Giai đoạn 1 — T01 giữ lock + O8 (poll #1–#5,
  08:48:34–08:51:37Z):** lock=co (thread=t01-round191, pid
  11091, port 5560) + blockers 5/5/5/1/2 (vite :5560 +
  MiniBrowser/WebKit của click-test O8 — xem blockers-list-*.txt);
  load1 3,14–5,28, load5 2,60–3,52. Cửa KHÔNG MỞ. O8 DONE
  08:51:44Z (WebKit 21/21 pass — T01).
- **Giai đoạn 2 — load hạ dần (poll #6–#10,
  08:52:22–08:55:23Z):** lock trống, blockers 0; load1 2,92 →
  1,16, load5 3,26 → 2,44; RAM 3499 → 2808 MB. Cửa KHÔNG MỞ
  (chỉ thiếu load5 <2).
- **Giai đoạn 3 — tải vọt của luồng sản phẩm (poll #11–#13,
  08:56:08–08:57:39Z):** load1 3,56/5,59/5,42, load5 tới 3,77
  (đỉnh phiên) — trùng lúc các luồng P1–P4 build/test.
  Cửa KHÔNG MỞ. X93 xuất hiện 08:56:41Z (socket của luồng
  khác, trong lúc poller — xem F-191-T4-7).
- **Giai đoạn 4 — load hạ về ngưỡng (poll #14–#21,
  08:58:24–09:03:40Z):** load1 2,48 → 0,66, load5 3,23 → 1,75;
  RAM 2444 → 1286 MB (giảm dần theo balloon, vẫn ≥1024).
  #20 load5 = 2,00 (không <2 — cửa chưa mở). **#21 RAM 1286 MB,
  load1 0,66, load5 1,75 → CỬA YÊN MỞ 09:03:40Z** (lock trống,
  blockers 0, apt 0, dpkg 1468, gate0=T4-check-only).
- **0 reboot trong phiên đo.** Poller thoát 09:07:37Z sau
  attempt1 hợp lệ (trong hạn cờ ~11:00Z, còn ~1h52').
- **Phân rã 23 poll thật:** RAM≥1024: 23/23; RAM<500: **0/23**.
  load1<2: 8/23; load5<2: 1/23. **Stats "gan-mo" đếm 1 = đúng
  1 lần mở cửa thật** (xem F-191-T4-4 — lần đầu KHÔNG đếm
  thừa kể từ đợt 186). gate0: T4-check-only 23/23.
  blockers>0: 5 poll (toàn lúc T01 giữ lock). apt>0: 0 poll.

## 2. Attempt — 1 attempt (ngân sách dùng 1/3)

- **attempt1-b0aab705: 20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 42,0 ms — LƯỢT HỢP LỆ.** Cửa sổ attempt: marker
  09:03:40.497Z → attempt-done 09:07:10.585Z (inner-end
  09:07:05Z, probe_exit=0; run-attempt exit=0 09:07:10Z).
  JSON 3.350.599 B; flip wallMs 26.797 ms; lock vite giữ
  210 s, nhả 09:07:10Z; vite :5187 kill sạch (curl 000);
  sampler dừng sạch (alive_after_stop=NO, 101 dòng).
- **tickCost:** tổng n=587 median **42,0** p90 74,0 max 124
  min 28; hậu flip+2000ms n=433 median 41,0. Theo dải
  wallMs: 0–20k median 52,0; 20–32k median 41,0; 32–45k
  median 45,5; 45–62k median 40,5; 62–70k median 39,0;
  70–80k median 46,0 — ổn định, không leo theo thời gian.
- **(c2) attempt: 3/3 seq COVERED** (146, 225, 464; delta log
  −21/−23/−21 ms); **P3' 3/3 DAT** (stall_truoc 4, 7, 6);
  **P1 ĐÚNG 3/3** (cả 3 gần run-end ±1 tick, trong 18 run_end
  seqs; baseline 54/348, p=0,00374); **P2 ĐÚNG 3/3** (cả 3 lag
  +1f); **P3-A1 3/3 occurrence NHƯNG verdict SAI** (đóng
  băng-tại-tick cả 3; baseline 84/347, p=0,0142 > 0,01 — n=3
  quá nhỏ để đạt ngưỡng DEF §5; xem §7); **P7 ĐÚNG** (0 entry
  trễ ≥+1f: c2 drawSrc delta {-1: 11, 0: 24}; đối chứng toàn
  bộ drawSrc post {-1: 255, 0: 177}, 0/432 entry).
- **Labellag (b): 4 occurrence / 1 event** (skippedLatest=0;
  seq 200–202, M=[26], tBlend 39311–39484, 173 ms, lag max
  +8f; presented 21→25, label 18→21). skippedLatest=1:
  0 occ ≥5f (n=142, median 0f, p90 1f, max 3f, âm 2).
  skippedLatest=0: 4 occ ≥5f (n=554, median 1f, p90 3f,
  max 8f, ≥10f 0, âm 40). **Toàn occurrence: n=696, ≥5f: 4,
  ≥10f: 0, âm: 42, max 8f.** Chuỗi 0 occ (185–187) đã DỪNG
  ở đợt 189; đợt này (b) lại có event — không khởi động
  lại chuỗi 0.
- **F6' ĐÓNG — skipLatest pixel-verified trên WebKit**
  (n tick skippedLatest=1 hậu flip+2000ms: 71; nhãn 100,0%;
  pixel-verified 100,0%; 0 tick vi phạm thật).
- **(c2) seqs mới trong sổ: 146, 464** (225 đã thấy);
  non_dat [260, 364, 498] KHÔNG ĐỔI.
- **Không attempt nào bị reboot giết; 2 retry còn lại.**

## 3. B2 spike / đối chiếu sampler T9 + O8 T01

- **KIỂM B2 — CÓ DỮ KIỆN MỚI, DỮ KIỆN THỨ 3 CHO QUYẾT TÁCH
  (xem F-191-T4-6).** Attempt1: load1_max **2,91** (B2 ĐẠT,
  dư 1,09); load1/pass tăng dần 0,98 (pass 1) → 2,72
  (pass 14–15) → 2,55 (pass 20), rồi rơi về 0,84–0,85 ngay
  sau attempt (sampler 09:06:54–09:07:02Z) — **tự-tải là
  nguồn chính** (đường cong tải theo tiến trình attempt;
  tickCost KHÔNG tương quan dương với load1, r=−0,37 theo
  perpass). **Lạ-tải chỉ là script giám sát nhẹ** (T9
  sampler/b2watch/probe-loop + autotrigger watch) — 0 process
  phân tích nặng trong ps-before/after (grep birefnet/ffmpeg/
  rembg = 0 hit).
- **AUTO-TRIGGER LIVE — CHẠY TRONG CỬA SỔ ATTEMPT, 0 FIRE.**
  Live `dry_run=False guard=6291456 consec=2` (T9-191; quyết
  (o) đợt 188: BẬT LIVE từ đợt 189). Live sampler trong cửa
  sổ attempt: 5 mẫu 09:03:01–09:07:01Z, trigger=watch,
  consec=0 ở cả 5 mẫu (avail 1.419.284 → 1.341.748 kB;
  balloon 5.270.604 → 5.103.440 kB) — **0 FIRE /
  0 WOULD-FIRE / 0 MISSED-WINDOW trong cửa sổ attempt.**
  `b2-spikes.log` 0 hit FIRE (T9-191 phán cuối).
- **O8 T01 TRÊN BOOT #114 — DONE 08:51:44Z (WebKit 21/21
  pass, 0 fail — theo o8-191t01.log; T01 chưa đóng cờ lúc
  T4 đóng). 0 attempt T4 chồng** (O8 xong trước khi gate mở
  09:03:40Z; lock đã nhả từ poll #6).
- **O8 T8 TRÊN BOOT #114 — CHƯA CÓ (T8-191 chưa đóng cờ lúc
  T4 đóng).** Chân O8 T8 + harness thuộc T8-191 báo cáo.
- **Ghi trong cửa sổ attempt: KHÔNG CÓ GHI MỚI NGOÀI
  QUY ĐỊNH.** `run-analyzers-191.sh` chạy NGOÀI cửa sổ
  (09:07:10–09:07:37Z, sau attempt-done 09:07:10.585Z —
  xem F-191-T4-5). `round189-*` files modified sau marker:
  0 file. File `hidden_files/round109-k7/
  analyze-k7-skiplatest.txt` mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới.
- **Luồng khác ghi file trong cửa sổ attempt (xem
  F-191-T4-9):** T2-191 ghi 4 file .py 09:04:11–09:04:31Z;
  T56 ghi log đóng harness 09:06:12–09:06:38Z — toàn file
  text/log nhỏ; bằng chứng tải cho thấy KHÔNG nhiễm
  (load1_max 2,91 trong bao tự-tải của 187/189; r=−0,37;
  lớp B 5/5; 0 process nặng). T4 ghi nhận sự kiện, KHÔNG
  tự phán vi phạm — giao T2 phán.

## 4. Replay/postboot — POSTBOOT_PASS #114 CHƯA CÓ (check-only PASS; số hiệu CHƯA QUYẾT)

- **Boot b0aab705 (btime 08:25:43Z, số hiệu #114 ỨNG VIÊN
  — T01-191 XÁC MINH, parent quyết (e) ở §12.3-191).**
- **POSTBOOT_PASS #114 CHƯA CÓ lúc T4 đóng** (round191-t5/
  không tồn tại — T5-191 chưa khởi động/không đóng cờ;
  xem F-191-T4-8). **Check-only của T4 PASS độc lập từ
  trước khi mở poller** (exit 0, 08:45Z — GST thư mục thật
  269=269 + tools + dpkg 1468). **Replay #114: heal xong
  TRƯỚC khi T4 mở** (khác #111 đình trệ, #112 chờ tới poll
  #17) — T5-191 phán cuối khi có cờ. **#113/#112/#111 VẪN
  CÓ** (không kiểm lại mtime/md5 đợt này — giao T5-191).
- **Tổng boot không cờ GIỮ 25** (theo quyết (c)-189; #114
  CÓ cờ thì không đổi, KHÔNG cờ thì 25 → 26 — T5-191/
  parent quyết).
- **0 REBOOT trong cửa sổ attempt; 0 REBOOT trong phiên
  đo.** Số hiệu #114 chưa quyết (T01-191 chưa đóng cờ);
  **(m) #114 + INSIDE #114 thuộc T2-191**; **#114 giết
  holder?** thuộc T6-191 (T56); **run 191 kết cục thuộc
  T7-191** (start TRỄ hay không — T7-191 phán).
- **Scheduler gap / OUTAGE: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  T7-191 phán cuối (T7-194 phán cuối OUTAGE #2 theo quyết
  (n)-188).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-191 báo cáo.

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND191_T4_WEBKIT_QUIET59_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round191-t4/`):**
  `poll-wait-t4-191.sh` (deadline 10:30Z 25/11 + cờ T5
  round191-t5/ + fallback round189-t5/),
  `run-attempt-191.sh` (lượt yên #59),
  `run-analyzers-191.sh` (chạy classb + 9 analyzer NGOÀI cửa
  sổ attempt),
  `distinct-seq-191.py` (helper đọc sổ — DÙNG LIVE đợt này:
  sổ as-of-189 + stall/c2coverage attempt1 → sổ MỚI
  as-of-191, md5 `b7ed5791`).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–189, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round191-t4/` — theo đúng mẫu 149–189: chỉ
  stage 4 script trên). **`b.json` KHÔNG stage** (file spec
  làm việc, md5 `078938cf...`, giống hệt bản đợt 156–189).
- **Script làm việc (hidden_files, không stage):**
  5 script T4 (`poll-wait`/`run-attempt`/`run-analyzers`/
  `t4-attempt-inner` — W = round191-t4 + glob chéo round189-* /
  `check-classb-t4`), 10 analyzer `analyze-t4-*.py`,
  `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-191.py` (thống kê §A; footer CỘNG DỒN MỚI 50 lượt),
  `distinct-seq-191.py` (helper đọc sổ — DÙNG LIVE đợt này),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-191: 142/145 distinct, occ 187/199, valid_rounds_p3
  38, non_dat [260, 364, 498], md5 `b7ed5791…`),
  `distinct-seq-ledger-191-proposed.json` (bản đề xuất — giữ
  làm audit trail), `preflight-191.txt` +
  `preflight-postboot-191.log` (pre-flight check),
  `round191-t4-copy.py` (script copy-forward 189 → 191).
- **Log/evidence (hidden_files/round191-t4/, không stage):**
  `poll-t4.log` (21 poll + CỬA MỞ #21 + LUỘT HỢP LỆ),
  `poll-t4.nohup.log` (1 instance), `poll-test-191.log` (2 test
  poll + 2 TEST-POLL-OK exit 7), `chain-t4.log` (start poller +
  CỬA MỞ + attempt + analyzers + LUỘT HỢP LỆ, poller thoát
  09:07:37Z), `postboot-t4-191-gate0wait-*.log` (check-only mỗi
  4 poll), `stats-191-output.txt` (output stats-191.py),
  `preview-b-f3-flip-webkit-t4-attempt1-b0aab705.json`
  (3.350.599 B), `load-mid-t4-attempt1-b0aab705.log`
  (101 dòng: 100 mẫu sampler),
  `analyze-t4-attempt1-b0aab705-*.txt` (10 file: c2drawlog,
  labellag, skiplatest, lag5, tickcost, wallbands, perpass,
  c2coverage, stall, p1p3p7),
  `coverage-check-attempt1-b0aab705.txt` (3/3),
  `classb-t4-attempt1-b0aab705.txt` (LOP-B-TONG: DAT 5/5),
  `ps-before/after-t4-attempt1-b0aab705.txt`,
  `dpkg-lines-before-` + `apt-history-before-attempt1-*.txt`
  (B4 baseline: dpkg 1468, apt Start-Date cuối 08:40:35Z).
  **1 JSON attempt (attempt1 hợp lệ). 0 process T4 sống lúc
  đóng** (poller đã thoát 09:07:37Z; vite :5187 đã kill,
  curl 000; 0 Xvfb T4 sống; 0 MiniBrowser/WebProcess T4;
  pgrep = 1 là tự-trùng pattern của chính lệnh exec).
  **X11 KHÔNG trống lúc đóng — socket X193 (09:03:44Z, CỦA
  CHÍNH PROBE T4 — xem F-191-T4-7) + X93 (08:56:41Z, của
  luồng khác, trong lúc poller).**

## 6. Sai số F-191-T4-1..10 (+ nợ cũ)

- **F-191-T4-1 — COPY-FORWARD: 1 CHUỖI STALE SÓT SAU LẦN SỬA
  ĐẦU (GHI NHẬN — DẠNG F-189-T4-1).** Grep kiểm lần 2 bắt
  thêm 1 chuỗi: docstring `distinct-seq-189.py` trong
  `distinct-seq-191.py`. Sửa TRƯỚC pre-flight; grep lần 2
  sạch (mẫu rộng 20+ chuỗi = 0 hit trong 7 file vận hành,
  trừ các hit `round189` CỐ Ý: fallback T5 `round189-t5/` +
  glob `round189-*` vì đợt 190 VOID). Không ảnh hưởng vận
  hành (docstring).
- **F-191-T4-2 — RAM TỐT NHẤT KỂ TỪ ĐỢT 187 (MỚI — TỐT).**
  RAM ≥1024 trong 23/23 poll (min 1286 MB, max 3564 MB);
  **0 poll <500 MB** (đợt 189: 8/35; đợt 188: 60/138).
  Balloon theo autotrigger sampler 4,78–5,27 GB trong cửa
  sổ attempt, avail 1,01–1,42 GB — KHÔNG ghim 6,44 GB,
  KHÔNG episode. Giao T9-191 phán episode (nếu có).
- **F-191-T4-3 — TẢI VỌT POLL #11–#13 (MỚI — NHẸ).**
  load1 3,56/5,59/5,42, load5 tới 3,77 lúc 08:56:08–
  08:57:39Z — trùng lúc các luồng P1–P4 build/test; cửa
  đóng suốt giai đoạn này nên KHÔNG ảnh hưởng verdict
  (chỉ kéo dài thời gian chờ gate ~9 phút).
- **F-191-T4-4 — STATS "gan-mo" ĐẾM 1 = ĐÚNG 1 LẦN MỞ CỬA
  THẬT (MỚI — ĐÃ HẾT DẠNG F-189-T4-4).** Lần đầu kể từ đợt
  186 script stats không đếm thừa: chỉ poll #21 đủ
  load1<2 + load5<2 + RAM≥1024 đồng thời (vì RAM ≥1024
  mọi poll nhưng load5 <2 chỉ đúng 1 lần).
- **F-191-T4-5 — QUYẾT (p) KIỂM CHỨNG LIVE LẦN 10: ĐẠT
  (MỚI — F-189-T4-5 ĐÃ HẾT).** 1 cửa sổ attempt: marker
  09:03:40.497Z → attempt-done 09:07:10.585Z. Mtime sớm nhất
  của 9 file analyzer + classb đều SAU attempt-done: classb
  +0,099 s, c2drawlog +0,241 s; muộn nhất 09:07:37.899Z
  (coverage-check). **0 file analyzer ghi trong cửa sổ
  attempt.** File skiplatest mặc định mtime vẫn 2026-11-23
  18:13:20Z — 0 ghi mới. Chuỗi live ĐẠT 8 → 9 (đề xuất).
- **F-191-T4-6 — B2 PHÂN BỔ TỰ-TẢI/LẠ-TẢI, DỮ KIỆN THỨ 3
  (MỚI — THEO QUYẾT (p) ĐỢT 186; ĐÃ ĐỦ 3 ĐỢT).** Attempt1:
  load1_max 2,91 (đỉnh 09:05:10–09:05:14Z, 3 mẫu); **tự-tải
  là nguồn chính** (load1/pass tăng dần 0,98 → 2,72 theo
  tiến trình attempt rồi rơi về 0,84–0,85 ngay sau attempt;
  tickCost không tương quan dương với load1, r=−0,37);
  **lạ-tải chỉ là script giám sát nhẹ** (T9 sampler/b2watch/
  probe-loop + autotrigger watch consec=0) — 0 process phân
  tích nặng. **Auto-trigger LIVE chạy trong cửa sổ attempt
  nhưng 0 FIRE** (xem §3). B2 ĐẠT với dư 1,09. Đây là dữ
  kiện thứ 3 cho quyết tách B2 (187: 2,93; 189: 2,94; 191:
  2,91 — cả 3 đều tự-tải là chính, lạ-tải chỉ giám sát nhẹ,
  B2 ĐẠT cả 3); luật B2 KHÔNG TÁCH vẫn đứng cho tới khi
  parent quyết — T4 KHÔNG tự quyết tách.
- **F-191-T4-7 — X193 LÀ XVFB CỦA CHÍNH PROBE T4 — ĐÍNH
  CHÍNH F-189-T4-7 (MỚI — QUAN TRỌNG).** Socket X193 lúc
  đóng (09:03:44Z) là Xvfb do CHÍNH probe T4 spawn
  (`probe121t3-ghost-k7.webkit.mjs` dòng 285–312: chọn
  display trống :193–:197, spawn Xvfb, launch WebKit headed
  qua DISPLAY=:193; log run-webkit ghi "Xvfb :193 đã lên"
  09:03:44Z). Xvfb đã kill lúc hết attempt (0 process Xvfb
  lúc đóng), chỉ còn socket file. **Đính chính:** F-189-T4-7
  ghi "X193 thuộc luồng khác" là SAI — log run-webkit đợt
  189 cũng ghi "Xvfb :193 đã lên" 03:12:52Z (đúng lúc
  attempt1-27e6714f bắt đầu 03:12:48Z); socket đó cũng là
  của probe T4. Lời ghi "T4 chạy 0 Xvfb (probe headless)"
  trong LIMITS 189 là SAI — probe chạy headed qua Xvfb
  :193–:197 từ lâu (mẫu probe93u3-rvfc-webkit). X93
  (08:56:41Z) vẫn là của luồng khác (xuất hiện trong lúc
  poller, trước attempt).
- **F-191-T4-8 — T0-191/T5-191 CHƯA ĐÓNG CỜ LÚC T4 ĐÓNG
  (MỚI — GHI NHẬN).** Lúc T4 đóng (~09:15Z):
  `round191-t5/` không tồn tại, `round191-t0.done` /
  `round191-t5.done` chưa có; số hiệu #114 cho boot b0aab705
  là ỨNG VIÊN (T01-191 xác minh — O8 DONE 08:51:44Z).
  Hệ quả: (e)/(m)/INSIDE/O8 T0 trong LIMITS này đều ghi
  "chờ T01-191/T5-191" — T4 KHÔNG tự quyết số hiệu.
- **F-191-T4-9 — LUỒNG KHÁC GHI FILE TRONG CỬA SỔ ATTEMPT
  (MỚI — GHI NHẬN, GIAO T2 PHÁN).** Trong cửa sổ attempt
  09:03:40–09:07:10Z: T2-191 ghi 4 file .py (witness879394.py
  13.174 B + hole-recheck9797.py 9.794 B lúc 09:04:11Z;
  m56-191.py 10.148 B + eperm-sweep191.py 1.725 B lúc
  09:04:31Z); T56 ghi 12 file log đóng harness 09:06:12–
  09:06:38Z (lớn nhất 229.948 B — log copy). Toàn file
  text/log nhỏ. **Bằng chứng tải: KHÔNG nhiễm** (load1_max
  2,91 trong bao tự-tải 187/189: 2,93/2,94; r=−0,37; lớp B
  5/5; 0 process nặng trong ps-before/after; 0 file
  round189-* sửa sau marker; dpkg delta 0). **Lưu ý công
  bằng:** cửa sổ attempt chỉ được T4 công bố vào LIMITS lúc
  ~09:04:26Z — 2 file của T2 lúc 09:04:11Z ghi TRƯỚC khi
  công bố; các luồng khác không thể biết chính xác cửa sổ
  từ LIMITS trước đó. T4 KHÔNG phán vi phạm — giao T2 phán
  theo quy tắc đứng.
- **F-191-T4-10 — MEMORY.md SỬA NGOÀI LƯỢT 08:45:22Z (MỚI —
  THEO F-189-T4-9; CHỈ GHI NHẬN).** Dòng "Chưa lên" được cập
  nhật (đợt 190 chưa từng chạy — không tồn tại; đợt 191 đang
  chạy) trong lúc T4 đang pre-flight. T4 KHÔNG sửa MEMORY.md
  và KHÔNG phán tác giả; ghi nhận làm bằng chứng, không viết
  lại file nào.
- **F-189-T4-1 — TÁI DIỄN DƯỚI DẠNG F-191-T4-1. F-189-T4-2 —
  KHÔNG TÁI DIỄN** (balloon không ghim). **F-189-T4-3 — KHÔNG
  TÁI DIỄN** (RAM <500 MB: 0/23 poll). **F-189-T4-4 — ĐÃ HẾT
  (xem F-191-T4-4). F-189-T4-5 — ĐÃ HẾT (xem F-191-T4-5).
  F-189-T4-6 — CÓ DỮ KIỆN MỚI (xem F-191-T4-6). F-189-T4-7 —
  ĐÍNH CHÍNH SAI (xem F-191-T4-7). F-189-T4-8 — TÁI DIỄN
  DƯỚI DẠNG F-191-T4-8. F-189-T4-9 — TÁI DIỄN DƯỚI DẠNG
  F-191-T4-10** (MEMORY.md sửa ngoài lượt ~08:47Z).
- **F-188-T4-1 — TÁI DIỄN DƯỚI DẠNG F-191-T4-1. F-188-T4-2 —
  KHÔNG TÁI DIỄN** (RAM <500 MB: 0/23 poll). **F-188-T4-3 —
  ĐÃ HẾT (xem F-191-T4-4). F-188-T4-4 — ĐÃ HẾT (xem
  F-191-T4-5). F-188-T4-5 — CÓ DỮ KIỆN MỚI (xem F-191-T4-6).
  F-188-T4-6 — ĐÍNH CHÍNH MỘT PHẦN (xem F-191-T4-7 — X193
  đợt 189 là của probe T4; X199 đợt 188 lúc 01:31–01:32Z
  SAU khi poller thoát vẫn là của luồng khác — T4 đợt 188
  chạy 0 attempt nên không thể tạo Xvfb nào). F-188-T4-7 —
  KHÔNG TÁI DIỄN** (replay #114 heal xong trước khi mở).
  **F-188-T4-8 — TÁI DIỄN DƯỚI DẠNG F-191-T4-3** (load1
  tăng vọt poll #11–#13 — nhưng cửa đóng, không ảnh hưởng
  verdict). **F-188-T4-9 — KHÔNG ÁP DỤNG** (aggregate 189
  §12.3 CHƯA NGÃ NGŨ theo MEMORY.md — T4 không phán).
- **F-187-T4-4 — KHÔNG ÁP DỤNG** ((b) có event đợt này —
  không tính chuỗi 0). **F-187-T4-5 — CÓ DỮ KIỆN THỨ 3
  (xem F-191-T4-6). F-187-T4-6 — KHÔNG TÁI DIỄN** (median
  42,0 ms ngay attempt đầu, không leo). **F-187-T4-1 —
  TÁI DIỄN DƯỚI DẠNG F-191-T4-1. F-187-T4-2 — KHÔNG TÁI
  DIỄN** (B2 ĐẠT, load1_max 2,91; phân bổ xem F-191-T4-6).
  **F-187-T4-3 — ĐÃ HẾT (xem F-191-T4-4). F-186-T4-2 —
  KHÔNG TÁI DIỄN** (B2 ĐẠT). **F-186-T4-5 — ĐÍNH CHÍNH
  MỘT PHẦN (xem F-191-T4-7). F-186-T4-7 — KHÔNG TÁI DIỄN**
  (B1 ĐẠT, load5 cuối 1,61 — lần sạch tiếp theo của B1 chờ
  T8 phán chuỗi). **F-185-T4-4 — KHÔNG KHỞI ĐỘNG LẠI**
  ((b) 4 occ/1 event — chuỗi 0 vẫn dừng). **F-185-T4-2 —
  KHÔNG TÁI DIỄN** (1 luồng T4 duy nhất). **F-185-T4-3 —
  KHÔNG ÁP DỤNG** (median 42,0 ms, không có attempt thứ 2
  để so). **F-184-T4-2 — KHÔNG TÁI DIỄN** (RAM <500 MB:
  0/23 poll — xem F-191-T4-2). **F-184-T4-4 — KHÔNG TÁI
  DIỄN** (0 reboot trong phiên đo).
- **F-183-T4-4 — TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T01 giữ
  lock polls #1–#5). **F-183-T4-6 — ĐÃ HẾT (xem F-191-T4-4).
  F-182-T4-1 — KHÔNG TÁI DIỄN** (0 reboot). **F-181-T4-3 —
  KHÔNG TÁI DIỄN. F-181-T4-6 — CÓ SỐ MỚI** (chuỗi median 50
  lượt: thêm 42,0 ms). **F-179-T4-5 — ĐÃ HẾT (xem F-191-T4-5).
  F-178-T4-1 — KHÔNG ÁP DỤNG** (1 attempt hợp lệ ngay lần
  đầu). **F-177-T4-4 — KHÔNG TÁI DIỄN. F-177-T4-6 — TÁI DIỄN
  DƯỚI DẠNG F-191-T4-1. F-176-T4-1 — KHÔNG TÁI DIỄN** (0 vi
  phạm theo T4). **F-176-T4-2 — KHÔNG ÁP DỤNG** (sampler dừng
  sạch, 0 sampler thừa). **F-175-T4-1 — KHÔNG TÁI DIỄN**
  (`tree-md5.txt` còn nguyên). **F-175-T4-2 — KHÔNG ÁP DỤNG**
  (0 file analyzer ghi trong cửa sổ attempt). **F-175-T4-3 —
  TÁI DIỄN DƯỚI DẠNG BÌNH THƯỜNG** (T01 giữ lock #1–#5).
  **F-175-T4-5 — KHÔNG TÁI DIỄN** (0 reboot). **F-174-T4-1 —
  KHÔNG ÁP DỤNG** (1 attempt hợp lệ). **F-174-T4-6 — KHÔNG
  TÁI DIỄN** (RAM <500 MB: 0/23 poll).

## 7. P3' cộng dồn (MỚI — 50 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 191 (MỚI): P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 occurrence = 142/145
  distinct-seq, P7 121/121** (50 lượt hợp lệ — #59 CÓ lượt
  hợp lệ nên cộng thêm 3 seq; 0 attempt nhiễm tải). Cơ sở:
  cộng dồn chỉ tính trên các lượt yên HỢP LỆ.
- **Đóng góp lượt #59: 3/3 seq (c2) P1 + P2 ĐẠT; P3-A1 3/3
  occurrence NHƯNG verdict SAI (p=0,0142); P3' 3/3 ĐẠT;
  P7 ĐÚNG** (seq 146, 225, 464; stall 4, 7, 6). Helper
  `distinct-seq-191.py` DÙNG LIVE (quyết (t) đợt 162): sổ
  as-of-189 (140/143 distinct, occ 184/196) + stall/
  c2coverage attempt1-b0aab705 → **142/145 distinct,
  187/199 occ** — khớp tính tay dưới đây.
- **Seq MỚI: 146, 464** (chưa có trong sổ);
  **225 ĐÃ THẤY** (trong sổ, đã ĐẠT trước — không cộng thêm
  distinct). T4 kiểm tay lại sổ as-of-189: seq mới 146/464
  vắng thật (không có trong `seen_dat` lẫn `seen_c2`); 225
  có trong cả hai; non_dat [260, 364, 498] KHÔNG ĐỔI (không
  seq nào trong 3 hố này xuất hiện đợt này). Sổ ĐÃ THĂNG CẤP
  thành as-of-191 (md5 `b7ed5791`; bản đề xuất giữ lại làm
  audit trail).
- **P1 — ĐÚNG 3/3 occ** (cả 3 seq gần run-end ±1 tick; trong
  18 run_end seqs; baseline 54/348, p=0,00374 — verdict
  ĐÚNG theo luật DEF §3 vì n=3 ≥3 VÀ p<0,01). Cộng dồn
  220/224 → **223/227**.
- **P2 — ĐÚNG 3/3 occ** (cả 3 seq lag +1f; DEF §4 chỉ đòi
  lag ≥ +1f). Cộng dồn 215/215 → **218/218**.
- **P3-A1 — 3/3 occ NHƯNG verdict SAI** (cả 3 seq đóng
  băng-tại-tick; baseline 84/347, p=0,0142 > 0,01 — verdict
  SAI theo luật DEF §5 vì p vượt ngưỡng; nguyên nhân là
  n=3 quá nhỏ: với baseline 0,242, p = 0,242³ ≈ 0,0142 —
  dù ĐẠT 3/3 cũng không thể qua ngưỡng 0,01; cần n≥4 với
  baseline này). Cộng dồn 192/224 → **192/227** (tử số
  GIỮ 192 — chỉ cộng occurrence ĐÚNG; mẫu số +3).
- **P3' 3/3 occ ĐẠT** (stall: 146=4, 225=7, 464=6). Cộng dồn
  140/143 → **142/145 distinct** (2 seq ĐẠT MỚI — 146, 464);
  occurrence 184/196 → **187/199**.
- **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 11,
  0: 24}; đối chứng toàn bộ drawSrc post: {-1: 255, 0: 177},
  0/432 entry). Cộng dồn 118/118 → **121/121** (theo mẫu
  đợt 185: P7 cộng +n/n khi ĐÚNG cho n seq của lượt).
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162):**
  sổ as-of-189 + stall/c2coverage attempt1 → sổ MỚI đề xuất
  (`distinct-seq-ledger-191-proposed.json`); T4 kiểm tay rồi
  mới thăng cấp thành as-of-191 (md5 `b7ed5791`). Đợt 192
  copy-forward lấy sổ này làm cơ sở.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** (thêm 1 lượt hợp lệ 3/3 củng cố; P3-A1
  SAI đợt này là do n=3 nhỏ, không phải bằng chứng chống —
  cả 3 seq đều đóng băng-tại-tick).
- Chuỗi median tickCost 50 lượt (MỚI — thêm 42,0 ms):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 /
  55,0 / 58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 /
  44,5 / 44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 /
  56,0 / 53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 /
  50,0 / 45,0 / 49,5 / 44,0 / 50,0 / 44,0 / 43,5 / 45,0 /
  39,0 / 42,0 / 42,0 ms (tổng 2361,0; trung bình 47,2 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 192

- **(a) #59 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ 1 → 2
  (ĐỀ XUẤT — parent quyết cuối).** Chân lượt yên cho chuỗi
  FULL PASS **CÓ đợt này** — FULL PASS lên 2 hay không còn
  chờ chân O8 T8 + harness của T8-191 (chưa đóng cờ lúc T4
  đóng — parent quyết cuối).
- **(b) P3' cộng dồn MỚI 50 lượt: P1 223/227, P2 218/218,
  P3-A1 192/227, P3' 187/199 = 142/145, P7 121/121:**
  sổ distinct-seq ĐÃ THĂNG CẤP as-of-191 md5 `b7ed5791`.
  **Chờ parent/T10 quyết:** ghi nhận cộng dồn mới.
- **(c) BOOT b0aab705 (số hiệu #114 ỨNG VIÊN — T01-191 XÁC
  MINH, parent quyết (e) ở §12.3-191).**
  **(m) #114 + INSIDE #114 thuộc T2-191.**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale lần 2 bắt được 1 chuỗi sót
  (F-191-T4-1 — sửa trước pre-flight); gate0 dự phòng ĐÃ ĐẠT
  lúc mở poller qua check-only (replay heal xong trước khi mở).
- **(e) POSTBOOT_PASS #114 CHƯA CÓ lúc T4 đóng — chờ T5-191.**
  Check-only của T4 PASS độc lập từ trước khi mở poller.
  Replay #114 heal xong trước khi mở. Tổng boot không cờ
  GIỮ 25.
- **(f) RAM tốt nhất kể từ đợt 187: 0/23 poll <500 MB, min
  1286 MB.** Balloon không ghim; giao T9-191 phán episode
  (nếu có).
- **(g) (m) #113 phán CUỐI (T2-191 — thô +35,149 s, sát biên
  dưới); INSIDE #112/#113 (T2-191); POSTBOOT_PASS #113
  (T5-191); số hiệu f7632121 = #113? (T01-191 xác minh 9
  nguồn; btime 04:36:24Z); OUTAGE phán cuối T7-194 (T7-193
  kiểm onset khung 25/11); auto-trigger lần FIRE thật đầu
  tiên — VẪN CHƯA XẢY RA (T9-191); B1 điều tra kẹt P5 đợt 188
  (T8-191); B2 dữ kiện thứ 3 cho quyết tách (T4-191 — BẢN
  NÀY); (m) #56 lần 33; mù hole-recheck lần 34; prune lần 65;
  headroom 0 (lần thứ 50?); ENOSPC lần 39?; 84l10 PASS chuỗi
  10?; 86n2-P1 chuỗi 13?; B2 live sạch lần 5?; E-247 (đánh số
  lại từ E-248) kết cục (T9-191).**
- **(h) B2 CÓ DỮ KIỆN MỚI — DỮ KIỆN THỨ 3 CHO QUYẾT TÁCH
  (F-191-T4-6; ĐÃ ĐỦ 3 đợt: 187: 2,93; 189: 2,94; 191: 2,91
  — cả 3 đều tự-tải là chính, lạ-tải chỉ giám sát nhẹ, B2
  ĐẠT cả 3). Luật B2 KHÔNG TÁCH vẫn đứng cho tới khi parent
  quyết — T4 KHÔNG tự quyết tách. Auto-trigger LIVE chạy
  trong cửa sổ attempt, 0 FIRE** — lần FIRE thật đầu tiên
  vẫn chưa xảy ra; T9-191 verify end-to-end khi có FIRE.- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (attempt1 hợp lệ #59) → **CÓ lượt yên hợp lệ #59 cho
  chuỗi FULL PASS.** O8 T01 trên #114 DONE 08:51:44Z
  (WebKit 21/21). T8 tự quyết O8 đợt này (O8 T8 + harness
  thuộc T8-191 báo cáo).
- **(j) F-191-T4-1 (1 chuỗi stale — sửa trước pre-flight);
  F-191-T4-2 (RAM tốt nhất kể từ đợt 187 — 0/23 poll <500);
  F-191-T4-3 (tải vọt poll #11–#13 — cửa đóng, không ảnh
  hưởng verdict); F-191-T4-4 (stats "gan-mo" đếm 1 = đúng 1
  lần mở cửa thật — đã hết đếm thừa); F-191-T4-5 ((p) kiểm
  chứng live lần 10 ĐẠT); F-191-T4-6 (B2 dữ kiện thứ 3 cho
  quyết tách — đã đủ 3 đợt); F-191-T4-7 (X193 là Xvfb của
  chính probe T4 — đính chính F-189-T4-7); F-191-T4-8
  (T0-191/T5-191 chưa đóng cờ — số hiệu #114 chưa quyết);
  F-191-T4-9 (luồng khác ghi file trong cửa sổ attempt —
  giao T2 phán); F-191-T4-10 (MEMORY.md sửa ngoài lượt).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-191.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-191.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-25T08:46:02Z - 2026-11-25T08:46:04Z, boot=b0aab705
   RAM min=2941 max=3011 >=1024: 2/2 500-1023: 0/2 <500: 0/2
   load1<2: 0/2 load5<2: 0/2 blockers>0: 0 apt>0: 0
   gate0: T4-check-only=2
   lock: khong=2
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 21 poll, 2026-11-25T08:48:34Z - 2026-11-25T09:03:40Z, boot=b0aab705
   RAM min=1286 max=3564 >=1024: 21/21 500-1023: 0/21 <500: 0/21
   load1<2: 8/21 load5<2: 1/21 blockers>0: 5 apt>0: 0
   gate0: T4-check-only=21
   lock: co=5, khong=16
   dpkg 1468->1468
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 23
-- RAM toan phien: min=1286 max=3564 >=1024: 23/23 <500: 0/23
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/23
   gan-mo? #21 2026-11-25T09:03:40Z boot=b0aab705 RAM=1286 L1=0.66 L5=1.75 blk=0 apt=0 gate0=T4-check-only(pb_age=0) lock=khong t5=cu(mtime-cu)
-- boot b0aab705: 23 poll; RAM>=1024 lan cuoi: 2026-11-25T09:03:40Z #21; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 50 luot hop le): P1 223/227 P2 218/218 P3-A1 192/227 P3' 187/199 occ = 142/145 distinct-seq P7 121/121
-- chuoi median 50 luot: n=50 mean=47,2 min=39,0 max=60,0 vuot-60: 0
```
