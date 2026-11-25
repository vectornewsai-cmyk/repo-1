# PHASE9_ROUND180_T4_WEBKIT_QUIET49_LIMITS.md

**Đợt:** 180. **Luồng:** T4 — đo lượt yên WebKit #49 trên 1 boot
+ **#49 CÓ LƯỢT HỢP LỆ — attempt1-95b483a2 (20/20 + lớp B 5/5 +
  tickCost median 44,0 ms ≤60). CHUỖI LƯỢT YÊN HỢP LỆ 42 → 43.**
  Attempt1 thành công ngay lần đầu (ngân sách dùng 1/3) — trên
  boot #95 (ứng viên), sau POSTBOOT_PASS #95 replay-đầy-đủ
  (không caveat repair) và O8 T0 DONE 87 s trước khi cửa mở.
+ **CỘNG DỒN MỚI (43 lượt hợp lệ): P1 184/188, P2 179/179,
  P3-A1 157/188, P3' 148/160 occurrence = 122/126 distinct-seq,
  P7 82/82.** Lượt #49 MẠNH (6 seq (c2), cả 5 trụ ĐÚNG — khác
  #48 mỏng 1 seq). Sổ distinct-seq ĐÃ THĂNG CẤP as-of-180
  (md5 `e8a69047…`; valid_rounds_p3 31;
  non_dat [260, 283, 364, 498] — không đổi).
+ **BOOT ĐO: 95b483a2 (btime 19:10:22Z, ứng viên #95 — số hiệu
  chờ T0-180 xác minh). GATE0 = T5 (POSTBOOT_PASS #95 CÓ —
  xem §4).** 0 reboot TRONG cửa sổ attempt. Reboot #96 (ứng
  viên, boot 8d2a69df) xảy ra SAU khi poller đóng (xem §4 +
  F-180-T4-1): btime danh nghĩa 21:20:56Z, bằng chứng wall-clock
  đặt reboot sau 21:21:23Z (lệch ~27 s theo mẫu F-179-T9-2).
  Gap #95→#96 = 7.834 s (btime danh nghĩa).
**Ngày:** 23/11/2026 (lượt cron 03:35 +07 24/11 = 20:35:51Z).
**Boot đo:** MỘT boot — 95b483a2 (ứng viên #95, btime
19:10:22Z; 18 poll, 1 cửa mở → attempt1 hợp lệ).

## 0. Verdict tổng

- **#49 CÓ LƯỢT HỢP LỆ (attempt1-95b483a2).**
  Cửa mở duy nhất ở poll #18 (21:17:29Z):
  gate0=T5 (POSTBOOT_PASS #95, 20:59:47Z) + PB=0 + RAM 1280 MB +
  load1 0,96/load5 1,49 + lock khong + blockers 0 + apt 0 →
  attempt1 chạy 21:17:29–21:20:58Z:
  **20/20 pass, lớp B DAT 5/5, tickCost median 44,0 ms ≤60**
  → LUOT HOP LE, poller thoát 0 lúc 21:21:23Z. Ngân sách dùng
  **1/3**.
- **Một boot đo, không reboot trong phiên đo:** instance 2
  (18 poll) chạy trọn trên boot 95b483a2; 0 lần poller chết;
  0 attempt bị giết. Reboot #96 (ứng viên) xảy ra SAU khi
  poller thoát (xem §4, F-180-T4-1) — không ảnh hưởng verdict.
- **Chuỗi lượt yên hợp lệ: 42 → 43.** Median tickCost attempt1 =
  44,0 ms (chuỗi 43 lượt: mean 47,8, min 39,0, max 60,0;
  0 lượt vượt ngưỡng 60 — chuỗi ĐÃ KIỂM ĐẦY ĐỦ 43 số: xem
  F-180-T4-6, §7; median #48 (49,5) + #49 (44,0) đều có mặt).
- **Điều kiện GIỮ NGUYÊN như #48 (quyết (m) đợt 167):**
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi.
- **QUYẾT (p) ĐỢT 179 ĐÃ TRIỂN KHAI + KIỂM CHỨNG LIVE (xem
  §6, F-180-T4-2):** check-classb + toàn bộ analyzer chuyển
  RA NGOÀI cửa sổ attempt — poller gọi script MỚI
  `run-analyzers-180.sh` SAU khi run-attempt thoát
  (attempt-done ghi 21:20:58Z), trước eval_attempt; 3 analyzer
  ghi-file (skiplatest/labellag/lag5) được truyền argv[2]
  tường minh nên KHÔNG còn ghi outpath mặc định.
  **KIỂM CHỨNG: file `round109-k7/analyze-k7-skiplatest.txt`
  mtime VẪN 18:13:20Z (đợt 179) — 0 ghi mới; 0 file
  round179-* nào bị sửa sau marker attempt (find ở
  inner-end trả rỗng).**
- **0 VI PHẠM THEO T4 — CHUỖI 0 VI PHẠM 1 → 2** (chuỗi tính
  lại từ 1 ở đợt 179 theo quyết (p); đợt này giữ sạch:
  ps-before/after attempt1: 0 dòng m56; không script nặng nào
  của luồng khác trong cửa sổ attempt; T4 không probe dpkg
  nào trong cả phiên — chỉ đọc `wc -l` dpkg.log + `pgrep -x`).
  Mọi phân tích của chính T4 đều làm SAU khi poller thoát
  (từ ~21:21Z; p1p3p7 + distinct-seq + stats chạy tay sau đó).
  Pre-flight + 2 test poll chạy TRƯỚC khi mở poller / ngoài
  cửa sổ attempt. **KHÔNG khởi động script nặng nào trong lúc
  gate0wait với cả hai gate xanh** (chỉ poller + check-only
  nhẹ theo thiết kế).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc attempt1, lúc đóng — không đổi;
  mọi poll đều tree=YES).
- **Cờ:** `hidden_files/round180-t4.done` viết lúc đóng trên
  boot MỚI 8d2a69df (ứng viên #96 — xem F-180-T4-1), CÓ NỘI
  DUNG, trong hạn cờ ~23:00Z; boot lúc attempt1 là 95b483a2
  — không đổi trong suốt phiên đo.

## 0b. Pre-flight check — QUY TẮC ĐỨNG (quyết (t) đợt 158 + bổ sung tới F-178-T4-2)

Chạy **trước mọi attempt, trước khi mở poller** (21:04:13Z),
ghi vào `hidden_files/round180-t4/preflight-180.txt` — **PASS**
(0 sót; grep stale-string sạch ngay lần đầu — như đợt 179).
Tóm tắt các mục kiểm:

- **md5 khớp hệt bản đợt 156–179:** b.json `078938cf…`,
  probe `4291e539…`, vite config `e3e874e1…`, tree `530e10a7`
  == preview.tsx; sổ distinct-seq as-of-179 md5
  `9f13bc95…` (occ 142/154, distinct 118/122,
  valid_rounds_p3 30).
- **10/10 analyzer** có mặt (+ script MỚI
  `run-analyzers-180.sh` — quyết (p)); `bash -n` OK 5 script
  T4 (poll-wait, run-attempt, run-analyzers, inner,
  check-classb); `py_compile` OK 13 file py; Playwright-core
  có mặt (webkit object); media `stripes-nonperiodic.mp4`
  (140.828 B) có mặt; không có `vite.lock`, không có
  `attempt-done-*`.
- **Deadline epoch KIỂM TRƯỚC KHI KHỞI ĐỘNG:** `2026-11-23
  22:30:00 UTC` → **1795473000** = 22:30Z (hạn cờ ~23:00Z =
  1795474800, hạn cứng 23:35Z = 1795476900); grep 0 hit cho
  `13:30`/`14:00`/`14:35`/`round177`/`poll-test-179`/
  `WebKit #48`/`T4-179a`/`default=179` trong script mới;
  `round179` chỉ còn fallback `round179-t5/` + glob
  `round179-*` (có chủ đích).
- **Copy-forward 179 → 180:** deadline `19:30Z` → `22:30Z`;
  hạn cờ/cứng `20:00Z`/`20:35Z` → `23:00Z`/`23:35Z`; T5FLAG
  chính `round180-t5/` + fallback `round179-t5/`; W trong 5
  script ĐÃ LÀ `round180-t4`; `T4-179a` → `T4-180a`;
  `default=179` → `default=180`; `WebKit #48` → `#49`;
  glob chống nhiễu `round178-*` → `round179-*`.
  (Grep stale-string sau copy-forward sạch ngay lần đầu —
  F-177-T4-6 không tái diễn.)
- **`cp -r` (KHÔNG dùng `cp -a` — tránh EPERM ownership
  F-170-T4-1):** chỉ copy 22 file làm việc (không copy log/
  JSON kết quả đợt 179); **`tree-md5.txt` KHÔNG có trong
  danh sách cleanup (F-175-T4-1 đã sửa) — còn nguyên,
  nội dung 530e10a7.**
- **Freeze check (F-164-T4-1):** `round179-t4` còn **0 file
  mtime ≥ 20:35:51Z** (giờ mở đợt 180).
- **GATE0 LÚC MỞ: ĐÃ ĐẠT TRÊN BOOT #95 (ứng viên) — khác
  đợt 179 (lúc mở chưa đạt).** dpkg.log 1545 dòng (replay
  xong 19:15:05Z, đóng băng từ đó); T5-180 ĐÃ viết
  POSTBOOT_PASS #95 lúc 20:59:47Z (replay-đầy-đủ, poll=0 —
  xem §4); postboot check-only chạy tay **exit 0 PASS**
  (wrapper PASS K1, GST PASS 269 plugin, libs PASS đủ 5,
  apt PASS đủ 11 gói — xem `preflight-postboot-180.log`).
- **Test poll (POLL_TEST=1): 2 lần, đều TEST-POLL-OK (exit 7).**
  Lần 1 (21:04:28Z): RAM 536 MB, load1 0,77/load5 0,74,
  gate0=T5, apt=0, dpkg 1545.
  Lần 2 (21:04:32Z): RAM 561 MB, load1 0,95/load5 0,78,
  gate0=T5, apt=0, dpkg 1545. Chỉ RAM <1024 nên cửa chưa mở
  — đúng thiết kế.
- **X11 lúc mở: `/tmp/.X11-unix/` TRỐNG; 0 Xvfb thật**
  (kiểm bằng `ps` + `ls` socket — KHÔNG dùng `pgrep -f`).
- **RAM lúc mở 536–623 MB; load1 0,77–0,99 lúc mở** — cửa chỉ
  mở khi đủ mọi điều kiện (poll #18, 21:17:29Z).
- **F-176-T4-2 ĐÃ SỬA + KIỂM CHỨNG LIVE đợt này (lần 4):**
  `check-classb-t4.sh` đếm sampler n chỉ trên dòng `boot=`
  — attempt1 ghi n=100 = đúng 100 dòng mẫu thật (xem
  F-180-T4-7; attempt dài ~209 s nên 100 mẫu, không phải 101
  như đợt 179 — sampler dừng đúng lúc probe thoát).

## 1. Poller — 20 poll thật (2 test + 18 trên #95), 1 lần cửa mở, 0 reboot trong phiên đo

- **Instance 1 — TEST (POLL_TEST=1), 2 poll, boot 95b483a2
  (21:04:28Z, 21:04:32Z):** cả 2 đều RAM <1024 (536/561 MB),
  load1 0,77/0,95, load5 0,74/0,78, gate0=T5, lock=khong,
  blockers=0, apt=0 → cửa đóng →
  **TEST-POLL-OK exit 7 đúng thiết kế** (cả 2 lần).
  2 poll này nằm trong `poll-test-180.log`; thống kê §A đã hợp nhất.
- **Instance 2 — boot 95b483a2, 18 poll (21:04:40–21:17:29Z),
  1 lần cửa mở:** RAM ≥1024: 3/18 (min 441, max 1490 MB);
  500–1023: 9/18; **<500: 6/18**; load1<2: 14/18;
  load5<2: 18/18; gate0: **T5 18/18** (có từ poll #1);
  lock=khong 14, co 4 (T0 giữ, poll #13–#16); blockers>0:
  4 poll; apt>0: 0 poll; dpkg 1545 → 1545 (đóng băng).
- **Giai đoạn 1 — RAM ghìm, gate0 đã đạt (poll #1–#12,
  21:04:40–21:12:56Z):** gate0=T5 suốt, PB=0 suốt, apt=0,
  load yên (load1 0,36–1,33, load5 0,67–0,96) — đủ mọi điều
  kiện TRỪ RAM (441–840 MB). Cửa KHÔNG MỞ ĐƯỢC vì thiếu RAM.
  Chuỗi RAM<500 dài nhất 4 poll (#9–#12, 21:10:41–21:12:56Z:
  465/441/469/442 MB — cùng độ dài chuỗi với đợt 179).
- **Giai đoạn 2 — T0 giữ lock + blockers (poll #13–#16,
  21:13:41–21:15:59Z):** T0-round180 giữ vite.lock
  (pid 146550, port 5560) + blockers 5/5/1/1 (clicktest
  WebKit + vite O8 + MiniBrowser); load1 leo 0,32 → 3,56
  (pha Chromium O8); RAM 581 → 1254 MB. Cửa KHÔNG MỞ ĐƯỢC
  vì thiếu lock + blockers + load (tái diễn dạng F-179-T4-4
  — xem §6, F-180-T4-4). T0 chạy O8 trên #95 trong lúc này
  (xem §3).
- **Giai đoạn 3 — load vừa quá ngưỡng (poll #17,
  21:16:44Z):** T0 nhả lock sau O8 (O8 DONE 21:16:02Z —
  42 s trước); RAM 1490 MB; load1 2,03/load5 1,74. Cửa
  KHÔNG MỞ ĐƯỢC vì load1 vừa quá 2 (chỉ thiếu 0,03).
- **Giai đoạn 4 — cửa mở (poll #18, 21:17:29Z):**
  load1 0,96/load5 1,49, RAM 1280 MB, gate0=T5, PB=0,
  apt=0, lock=khong, blockers=0, tree=YES →
  **CỬA MỞ, attempt1 chạy ngay** (87 s SAU khi O8 nhả lock).
  Poller thoát 0 sau attempt1 hợp lệ (21:21:23Z), trước hạn
  cắt 22:30Z tới 69 phút.
- **Phân rã 20 poll thật:** RAM≥1024: 3/20; RAM 500–1023:
  11/20; RAM<500: **6/20**. load1<2: 16/20; load5<2: 20/20.
  **Stats "gan-mo" đếm 1 = đúng 1 mở cửa thật (xem
  F-180-T4-8): poll duy nhất đủ load+RAM là #18 — KHÔNG có
  mâu thuẫn stats/cửa như F-179-T4-1.** gate0: T5 20/20.
  blockers>0: 4 poll (toàn lúc T0 giữ lock). apt>0: 0 poll.
  **RAM <500 MB: 6/20 poll** (chuỗi dài nhất 4, như đợt 179:
  7/36, chuỗi 4). Ghi nhận để T9-180 đối chiếu
  headroom/balloon trên #95.

## 2. Attempt — 1 attempt (hợp lệ ngay lần đầu), ngân sách dùng 1/3

- **Attempt1 — attempt1-95b483a2, 21:17:29–21:20:58Z,
  LUOT HOP LE (20/20 + lớp B 5/5 + tickCost median 44,0 ms).**
  - Vite lock v2: lấy ticket ngay (chờ 0s, giữ 209 s).
    Xvfb :193 lên 21:17:33Z. WebKit 27.2, app boot OK.
    Pass 20 xong ~21:20:53Z (37 khung rAF/pass; rAF/pass
    median 37); partial JSON 20/20 ghi ~21:20:53Z (tickCost
    n=599 lúc cuối; blendTick n=487, c2DrawLog n=1166).
  - Probe exit 0; JSON 3.375.979 B; flip afterPass=5,
    wallMs=26291; tickCost total n=599 median=**44,0**
    p90=75,0 max=110 min=29; hậu flip+2000ms n=437
    median=44,0. BlendTick/pass=24,4; rAF/pass median=37
    (min 32, max 44). pageErrs=[].
  - Lớp B attempt1: **DAT 5/5** (sampler n=100 — đúng 100 mẫu
    thật sau fix F-176-T4-2; load1 max 1,37, RAM min 625 MB
    max 1197 MB, 0 mẫu <500 MB, **76/100 mẫu <1024 MB**
    (cảnh báo, không vi phạm — RAM trong attempt đang hồi);
    load5 cuối 1,10; boot không đổi; dpkg delta 0;
    apt/dpkg = 0). Ps-before/after: **0 dòng m56**.
  - Per-pass (20 pass): tick median 38,0–54,5 ms; wall
    2861–3604 ms; load1 mean 0,98–1,37; RAM mean 629–912 MB.
    Tương quan Pearson: median~load1_mean r=-0,20;
    median~RAM_mean r=0,19 (chỉ mô tả, không kết luận nhân quả).
  - Kiểm chứng độc lập từ JSON gốc (T4 tự tính, không dùng
    analyzer): passes=20, engine=webkit, webkitVersion 27.2,
    pageErrs=[]; tickCost (trường `total`) n=599 median=44,0
    p90=75 max=110 min=29 — KHỚP analyzer từng số; hậu
    flip+2000ms n=437 median=44,0 — KHỚP; c2DrawLog n=1166
    (results/b/y2/c2DrawLog).
- **Ngân sách dùng 1/3.** Không attempt nào bị reboot giết
  (0 reboot trong phiên đo); 2 attempt còn lại chưa dùng.
  Reboot #96 xảy ra SAU khi poller thoát — xem §4.

## 3. B2 spike / đối chiếu sampler T9 + O8 T0 (theo nhiệm vụ đợt 177–180)

- **KIỂM B2 TRONG CỬA SỔ ATTEMPT HỢP LỆ (attempt1,
  21:17:29–21:20:58Z): 0 SPIKE.** Sampler T4 (2 s, n=100):
  load1 max 1,37 (≤4 nên lớp B DAT); poller poll #18
  load1 0,96; poll #17 (trước cửa sổ) load1 2,03 —
  không spike. **Attempt1 chạy trong cửa sổ hoàn toàn
  sạch B2.**
- **T9-180 CHƯA CÓ `b2-spikes.log` lúc T4 đóng** (thư mục
  `round180-t9/` chưa tồn tại lúc 21:26Z — F-180-T4-5):
  đối chiếu B2 độc lập từ phía T9 KHÔNG CÓ đợt này (khác
  đợt 179: T9-179 ĐÃ CÓ file lúc T4 đóng). Kết luận 0 spike
  đợt này dựa trên sampler T4 + poller — đủ cho verdict
  lớp B (B2 dùng sampler chính T4), nhưng T10/T9 đối chiếu
  lại khi T9-180 có file.
- **O8 T0 TRÊN CÙNG BOOT — BÀN GIAO SẠCH, 0 CHỒNG:**
  T0-round180 chạy O8 trên #95, DONE 21:16:02Z (WebKit 21/21
  ×2 + Chromium 21/21 — xem NOTES T0); T4 poll #13–#16
  trong cửa sổ O8 đều ghi lock=co thread=t0-round180 +
  blockers → cửa yên KHÔNG mở; poll #17 (21:16:44Z, **42 s
  SAU khi O8 nhả lock**) vẫn load1 2,03; poll #18
  (21:17:29Z, **87 s SAU khi O8 nhả lock**) "CUA YEN MO"
  (RAM=1280MB) → T4 chạy attempt1 NGAY sau O8.
  **0 giây chồng lấn giữa O8 và attempt1.** T0 kiểm cuối
  21:17:00Z: 0 process sót của T0.
- **Ghi trong cửa sổ (quyết (p) — xem F-180-T4-2):** 0 file
  ngoài thư mục round180-t4 bị ghi trong cửa sổ attempt
  (find round179-* sau marker trả rỗng; file
  round109-k7/analyze-k7-skiplatest.txt mtime vẫn 18:13:20Z
  đợt 179). Analyzer + classb chạy 21:20:58–21:21:23Z,
  SAU khi run-attempt thoát — NGOÀI cửa sổ attempt.

## 4. Replay/postboot — POSTBOOT_PASS #95 ĐÃ CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat)

- **Boot 95b483a2 (btime 19:10:22Z, ứng viên #95 — CHƯA xác
  minh số hiệu; T0-180 xác minh 9 nguồn): replay HỆ THỐNG
  tới (os-intent replay: dpkg.log 1545 dòng từ 19:15:05Z,
  đóng băng suốt phiên đo; T5-180 không cần repair).**
- **POSTBOOT_PASS #95 ĐÃ CÓ 20:59:47Z** (boot+109m;
  watcher-180, **mode replay-day-du, poll=0**, dpkg 1545
  dòng, cache 178 .deb, lists 71; postboot PASS poll0 độc lập
  exit 0 lúc 20:59:47Z; cờ cũ ae2a9a47 lưu
  POSTBOOT_PASS-ae2a9a47). **Cờ REPLAY-ĐẦY-ĐỦ — KHÔNG
  caveat repair** (khác #94 repair-sớm, poll=1; giống #92
  replay-đầy-đủ). Gate0=T5 từ poll #1 instance 2.
  **T4-check-only KHÔNG cần dùng làm gate0 chính trên #95**
  (chỉ dùng kèm điều kiện PB=0; check-only của T4 PASS độc
  lập từ test poll #1, exit 0).
- **REBOOT #96 (ứng viên) — SAU PHIÊN ĐO (xem F-180-T4-1).**
  Boot mới 8d2a69df, btime danh nghĩa 21:20:56Z
  (1795468856); `who -b` 21:21; dpkg.log reset về 2 dòng
  ("startup packages configure" ×2) lúc 21:21:36–37Z.
  Bằng chứng wall-clock đặt reboot SAU 21:21:23Z (poller
  viết "LUOT HOP LE" + thoát lúc 21:21:23Z; attempt-done
  mtime 21:20:58Z; chain-t4.log mtime 21:21:23Z — mọi file
  đều ghi xong TRƯỚC reboot): btime đọc sớm ~27 s, đúng
  mẫu F-179-T9-2 (sampler cuối #94 đọc 23 s sau btime #95)
  mà T0-180 đã điều tra (đồng hồ cell nhanh). Gap
  #95→#96 = 7.834 s (btime danh nghĩa; gap thật có thể
  dài hơn ~27 s do lệch — T0-180 xác minh). **0 reboot
  trong cửa sổ attempt (21:17:29–21:20:58Z); 0 reboot trong
  phiên đo.** Số hiệu #96 chờ T0-180 xác minh 9 nguồn;
  (m) #95 + INSIDE #95 thuộc T2-180; #95 có giết holder
  không thuộc T6-180. POSTBOOT_PASS #96 CHƯA CÓ — thuộc
  T5-180 (watcher-180 nhiều khả năng đã chết theo #96).
- **84l10 / 85m4 / 86n2: KHÔNG CÓ DỮ KIỆN TRONG PHIÊN T4.**
  Verdict của harness T8 — giao T8-180 báo cáo (driver
  hb128 làm chuẩn từ đợt 180 theo quyết (j) đợt 179).
  (T4 chỉ ghi: attempt1 chạy sạch 20/20 ngay lần đầu —
  không wedged.)

## 5. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND180_T4_WEBKIT_QUIET49_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round180-t4/`):**
  `poll-wait-t4-180.sh` (deadline 22:30Z 23/11 + cờ T5
  round180-t5/ + fallback round179-t5/),
  `run-attempt-180.sh` (lượt yên #49 — KHÔNG còn gọi
  classb/analyzer, xem quyết (p)),
  `run-analyzers-180.sh` (**MỚI** — chạy classb + 9 analyzer
  NGOÀI cửa sổ attempt; argv[2] tường minh cho 3 analyzer
  ghi-file),
  `distinct-seq-180.py` (ĐÃ DÙNG LIVE trên dữ liệu attempt1 —
  xem §7; khi chạy từ `apps/web/scripts/` phải truyền `--ledger`
  trỏ tới sổ, nếu không helper lỗi FileNotFoundError).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–179, md5
  `4291e539...`) và **KHÔNG stage lại `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round180-t4/` — theo đúng mẫu 149–179: chỉ
  stage 4 script trên; run-analyzers là script thứ 4 vì
  quyết (p) tách nó khỏi run-attempt). **`b.json` KHÔNG
  stage** (file spec làm việc, theo mẫu các đợt trước — chỉ có
  trong `hidden_files/round180-t4/`, md5 `078938cf...`,
  giống hệt bản đợt 156–179).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-180.sh`, `run-attempt-180.sh`,
  `run-analyzers-180.sh` (MỚI — quyết (p)),
  `t4-attempt-inner.sh` (W = round180-t4 + glob check nhiễu
  chéo round179-*), `check-classb-t4.sh` (W = round180-t4 +
  đếm sampler n chỉ dòng `boot=` — fix F-176-T4-2),
  10 analyzer `analyze-t4-*.py`, `vite.t4-temp.config.mjs`,
  `b.json`, `probe121t3-ghost-k7.webkit.mjs`,
  `tree-md5.txt` (530e10a7), `stats-180.py` (thống kê §A;
  footer ĐÃ CẬP NHẬT cộng dồn 43 lượt),
  `distinct-seq-180.py` (helper đọc sổ, xem §7),
  `distinct-seq-ledger.json` (SỔ distinct-seq, ĐÃ THĂNG CẤP
  as-of-180: 122/126 distinct, occ 148/160, valid_rounds_p3 31,
  non_dat [260, 283, 364, 498];
  md5 `e8a69047…`),
  `distinct-seq-ledger-180-proposed.json` (bản helper ghi ra
  trong live run — ĐÃ DÙNG để thăng cấp sổ; audit trail),
  `preflight-180.txt` + `preflight-postboot-180.log`
  (pre-flight check, quyết (t) đợt 158 + bổ sung tới F-178-T4-2).
- **Log/evidence (hidden_files/round180-t4/, không stage):**
  `poll-t4.log` (18 poll instance 2 trên #95 + 0 REBOOT PHAT
  HIEN trong phiên đo), `poll-test-180.log` (2 test poll +
  2 TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log` (start poller + 1 CUA YEN MO +
  attempt1 LUOT HOP LE),
  `postboot-t4-180-gate0wait-*.log` (check-only mỗi 4 poll:
  #1/#5/#9/#13/#17 exit 0 — PB=0 suốt phiên),
  `stats-180-output.txt` (output stats-180.py),
  `blockers-ps-*.txt` + `blockers-list-*.txt` (poll có
  blockers: #13–#16 T0 giữ lock),
  `preview-b-f3-flip-webkit-t4-attempt1-95b483a2.json`
  (3.375.979 B, 20/20, probe exit 0),
  `classb-t4-attempt1-95b483a2.txt` (DAT 5/5),
  `analyze-t4-attempt1-95b483a2-*.txt` (10 analyzer attempt1,
  gồm p1p3p7 chạy TAY — xem F-174-T4-5, không tái diễn),
  `coverage-check-attempt1-95b483a2.txt` (6/6),
  `load-mid-t4-attempt1-95b483a2.log` (n=100 mẫu thật),
  `run-webkit-t4-attempt1-95b483a2.log` (20/20),
  `ps-before/after-t4-attempt1-95b483a2.txt` (0 dòng m56),
  `dpkg-lines-before-attempt1-95b483a2.txt` (1545) +
  `apt-history-before-attempt1-95b483a2.txt`,
  `attempt-done-attempt1-95b483a2` (exit=0).
  **KHÔNG còn process T4 nào sống lúc đóng** (poller đã thoát
  21:21:23Z exit 0; vite :5187 trống, curl 000;
  `/tmp/.X11-unix/` TRỐNG trên boot mới #96 sau reboot —
  xem F-180-T4-3).

## 6. Sai số F-180-T4-1..8 (+ nợ cũ)

- **F-180-T4-1 — REBOOT #96 (ỨNG VIÊN) XẢY RA SAU KHI
  POLLER THOÁT — BTIME DANH NGHĨA ĐỌC SỚM ~27 S (GHI NHẬN
  — CHỜ T0-180 XÁC MINH 9 NGUỒN).** Boot mới 8d2a69df,
  btime 21:20:56Z — chỉ 2 s sau khi run-attempt thoát
  (21:20:58Z) và 27 s TRƯỚC khi poller viết "LUOT HOP LE"
  (21:21:23Z). Nếu btime đúng nghĩa đen thì poller không
  thể viết lúc 21:21:23Z (process đã chết theo reboot) —
  nên btime phải đọc sớm, đúng mẫu F-179-T9-2 mà T0-180
  đã điều tra (đồng hồ cell nhanh; sampler cuối #94 đọc
  23 s sau btime #95). Bằng chứng wall-clock: attempt-done
  mtime 21:20:58Z, chain-t4.log mtime 21:21:23Z, dpkg.log
  reset 21:21:36Z — reboot thật sau 21:21:23Z. **0 reboot
  trong cửa sổ attempt; verdict attempt1 không bị ảnh
  hưởng.** Số hiệu #96 + POSTBOOT_PASS #96 thuộc T0/T5-180.
  (Phiên exec kiểm tra của T4 cũng bị gián đoạn đúng lúc
  reboot — service restart ~21:21:44Z — không mất dữ liệu,
  mọi artifact đã nằm trên đĩa.)
- **F-180-T4-2 — QUYẾT (p) ĐÃ TRIỂN KHAI + KIỂM CHỨNG LIVE
  (ĐÃ SỬA — F-179-T4-5 KHÔNG TÁI DIỄN).** (i) Analyzer +
  classb tách khỏi run-attempt thành `run-analyzers-180.sh`,
  poller gọi SAU khi run-attempt thoát (21:20:58Z) —
  analyzer chạy 21:20:58–21:21:23Z, NGOÀI cửa sổ attempt.
  (ii) 3 analyzer ghi-file được truyền argv[2] tường minh
  → không còn ghi outpath mặc định. **Kiểm chứng: file
  round109-k7/analyze-k7-skiplatest.txt mtime VẪN
  18:13:20Z (đợt 179); analyze-l7-labellag.txt (18:13:09Z)
  + lag5-detail.txt (18:13:26Z) trong round179-t4 cũng
  không đổi; find round179-* sau marker trả rỗng.**
- **F-180-T4-3 — X193 SOCKET LÚC ĐÓNG KHÔNG KIỂM CHỨNG
  ĐƯỢC BẰNG TAY (ghi nhận — khác F-179-T4-3).** Xvfb :193
  của attempt1 lên 21:17:33Z; lúc đóng `/tmp/.X11-unix/`
  TRỐNG — NHƯNG đó là trên boot mới #96 sau reboot
  (`/tmp` bị wipe theo reboot — tiền lệ T0-180 ghi cho
  #95). T4 KHÔNG dọn tay X193 trước reboot (poller thoát
  21:21:23Z, reboot xảy ra ngay sau đó) — trạng thái socket
  ngay trước reboot không còn kiểm được. Ghi rõ để T10
  khỏi nhầm thành "T4 đã dọn tay" như các đợt trước.
- **F-180-T4-4 — T0-ROUND180 GIỮ VITE.LOCK + BLOCKERS TRONG
  LÚC POLLER CHỜ GATE (tái diễn dạng F-179-T4-4/F-178-T4-4).**
  Poll #13–#16: lock=co (thread=t0-round180, pid 146550,
  port 5560) + blockers 5/5/1/1; load1 leo tới 3,56. Vì chưa
  có attempt nào nên không ảnh hưởng verdict; O8 T0 DONE
  21:16:02Z và nhả lock trước khi cửa mở 87 s — bàn giao
  sạch (xem §3). Giao T0/T10 đối chiếu lịch các luồng trong
  cửa sổ 21:13–21:17Z.
- **F-180-T4-5 — T9-180 CHƯA CÓ `b2-spikes.log` LÚC T4 ĐÓNG
  (GHI NHẬN — KHÁC ĐỢT 179).** Thư mục `round180-t9/` chưa
  tồn tại lúc 21:26Z — đối chiếu B2 độc lập từ phía T9
  KHÔNG CÓ đợt này (F-177-T4-4 tái diễn dưới dạng vắng file).
  Kết luận 0 spike dựa trên sampler T4 (n=100, max 1,37) +
  poller — đủ cho verdict lớp B, nhưng T10/T9 đối chiếu lại
  khi T9-180 có file.
- **F-180-T4-6 — CHUỖI MEDIAN §7 ĐÃ KIỂM ĐẦY ĐỦ TRƯỚC KHI
  NỘP (theo nhiệm vụ đợt 180).** Chuỗi 43 số: tổng 2055,5;
  mean 47,8; min 39,0; max 60,0; 0 vượt 60 — median #48
  (49,5) + #49 (44,0) đều có mặt (xem §7). F-179-T4-6
  không tái diễn.
- **F-180-T4-7 — SAMPLER n=100, KHÔNG PHẢI 101 (GHI NHẬN —
  KHÔNG PHẢI LỖI ĐẾM).** Attempt1 dài ~209 s (21:17:33–
  21:20:53Z sampler) → 100 mẫu thật 2 s/lần (đếm chỉ dòng
  `boot=` — fix F-176-T4-2 vẫn đứng; header `sampler-start`
  không tính). Khác đợt 179 (n=101, attempt ~209 s —
  sampler đợt 179 chạy thêm ~2 s sau probe thoát).
- **F-180-T4-8 — STATS "GAN-MO" ĐẾM 1 = ĐÚNG 1 MỞ CỬA THẬT
  (GHI NHẬN — SẠCH HƠN F-179-T4-1).** Stats đếm poll đủ
  load1<2 + load5<2 + RAM≥1024 (1 poll: #18); poll đó mở
  cửa thật — stats và cửa thật KHỚP hoàn toàn, không cần
  đọc kèm điều kiện gate0 như đợt 179.
- **F-179-T4-1 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (xem
  F-180-T4-8).**
- **F-179-T4-2 — KHÔNG TÁI DIỄN (xem F-180-T4-7).**
- **F-179-T4-3 — TÁI DIỄN DƯỚI DẠNG F-180-T4-3** (X193 —
  `/tmp` bị wipe bởi reboot #96, không dọn tay được).
- **F-179-T4-4 — TÁI DIỄN DƯỚI DẠNG F-180-T4-4.**
- **F-179-T4-5 — ĐÃ SỬA + KIỂM CHỨNG LIVE (xem F-180-T4-2).**
- **F-179-T4-6 — KHÔNG TÁI DIỄN (xem F-180-T4-6).**
- **F-178-T4-1 — KHÔNG TÁI DIỄN.** 0 tick probe-mo của T9
  trong cửa sổ attempt.
- **F-178-T4-2 — ĐÃ SỬA + KIỂM LẠI (xem F-180-T4-6).**
- **F-177-T4-4 — TÁI DIỄN DƯỚI DẠNG F-180-T4-5** (T9-180
  chưa có `b2-spikes.log` lúc T4 đóng).
- **F-177-T4-6 — KHÔNG TÁI DIỄN.** Grep stale-string sau
  copy-forward sạch ngay lần đầu (0 sót).
- **F-176-T4-1 — KHÔNG TÁI DIỄN.** 0 vi phạm quy tắc đứng theo
  T4 — chuỗi 0 vi phạm 1 → 2 ở đợt 180.
- **F-176-T4-2 — ĐÃ SỬA + KIỂM CHỨNG LIVE LẦN 4 (xem §0b,
  F-180-T4-7).**
- **F-175-T4-1 — KHÔNG TÁI DIỄN.** `tree-md5.txt` không còn
  trong danh sách cleanup copy-forward; test poll lần 1
  tree=YES ngay.
- **F-175-T4-2 — KHÔNG TÁI DIỄN THEO T4 (xem §0 + F-180-T4-2).**
- **F-175-T4-3 — TÁI DIỄN DƯỚI DẠNG F-180-T4-4.**
- **F-175-T4-5 — KHÔNG TÁI DIỄN TRONG PHIÊN ĐO.** 0 reboot
  trong cửa sổ attempt / phiên đo (reboot #96 sau khi
  poller thoát — xem F-180-T4-1).
- **F-174-T4-1 — KHÔNG TÁI DIỄN.** Attempt1 chạy sạch 20/20
  ngay lần đầu (không wedged như attempt1 đợt 176).
- **F-174-T4-3 — KHÔNG TÁI DIỄN.** Kiểm process lúc đóng dùng
  `ps` trực tiếp (0 process T4, 0 Xvfb) — không dùng `pgrep -f`.
- **F-174-T4-4 — KHÔNG TÁI DIỄN.** `p1p3p7` chạy tay đúng dạng
  `<json> "<seqs>"` ngay lần đầu, exit 0.
- **F-174-T4-6 — KHÔNG TÁI DIỄN THEO DẠNG CŨ (RAM <500:
  6/20 poll — nhưng TOÀN trong lúc CHỜ gate;
  RAM min trong attempt1 625 MB, 0 mẫu <500).**

## 7. P3' cộng dồn (MỚI — 43 lượt hợp lệ) + helper đọc sổ + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 180 (MỚI): P1 184/188, P2 179/179,
  P3-A1 157/188, P3' 148/160 occurrence = 122/126 distinct-seq,
  P7 82/82** (43 lượt hợp lệ — #49 CÓ lượt hợp lệ).
  Cơ sở: cộng dồn chỉ tính trên các lượt yên HỢP LỆ
  (LIMITS 179 §6: "42 lượt hợp lệ" — nay 43).
- **Đóng góp lượt #49 (attempt1-95b483a2, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=6 occurrence / 6 distinct-seq [154, 178, 298, 324, 371,
  442], stall 7/4/3/5/7/3 — TẤT CẢ ĐẠT.
  **154, 178, 298, 371 MỚI** (chưa có trong sổ);
  324 ĐÃ THẤY (mới ở đợt 178), 442 ĐÃ THẤY (mới ở đợt 175)
  — helper xác nhận; T4 kiểm tay lại sổ as-of-179: cả 4 seq
  mới vắng thật.
  - **P1 — ĐÚNG 6/6 occ** (cả 6 seq gần run-end ±1 tick; trong
    16 run_end seqs; baseline 48/357, p=5,9e-06 — verdict
    ĐÚNG theo luật DEF §3 vì n=6 ≥3 VÀ p<0,01). Cộng dồn
    178/182 → **184/188**.
  - **P2 ĐÚNG — 6/6 occ** (cả 6 seq lag +1f; DEF §4 chỉ đòi
    lag ≥ +1f). Cộng dồn 173/173 → **179/179**.
  - **P3-A1 — ĐÚNG 6/6 occ** (cả 6 seq đóng băng-tại-tick;
    baseline 83/356, p=0,00016 — verdict ĐÚNG theo luật DEF
    §5 vì p<0,01 và n≥3). Cộng dồn 151/182 → **157/188**.
  - **P3' 6/6 occ ĐẠT** (stall: 154=7, 178=4, 298=3, 324=5,
    371=7, 442=3). Cộng dồn 118/122 → **122/126 distinct**
    (4 seq ĐẠT MỚI — 154, 178, 298, 371);
    occurrence 142/154 → **148/160**.
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta {-1: 31,
    0: 33}; đối chứng toàn bộ drawSrc post: {-1: 281, 0: 154},
    0/435 entry). Cộng dồn 76/76 → **82/82**.
- **HELPER distinct-seq ĐÃ DÙNG LIVE (quyết (t) đợt 162).**
  Helper `distinct-seq-180.py` đọc sổ (as-of 179: 118/122
  distinct, occ 142/154), tính seq MỚI = tập hiệu với sổ,
  in cộng dồn mới, ghi sổ MỚI ra file riêng
  (`distinct-seq-ledger-180-proposed.json`) — KHÔNG sửa sổ
  gốc tại chỗ; T4 kiểm tra rồi mới thăng cấp thành sổ.
  **Live đợt 180:** sổ + stall/c2coverage attempt1-95b483a2 →
  **122/126 distinct, 148/160 occ** — khớp tính tay dưới đây.
  Sổ ĐÃ THĂNG CẤP: as-of 180, 122/126 distinct, occ 148/160,
  valid_rounds_p3 31, non_dat [260, 283, 364, 498] (không đổi;
  md5 sổ mới `e8a69047…`). Helper KHÔNG cần back-test riêng
  đợt này (đã back-test khớp live 172 ở đợt 173, live
  174–180 đều khớp tính tay).
- **Kiểm chứng seq mới đợt 180:**
  helper xác nhận **154, 178, 298, 371 MỚI**; **324, 442 ĐÃ
  THẤY**. Tính tay: distinct DAT 118 + 4 = **122**; distinct
  tổng 121 + 4 = **126**; occurrence DAT 142 + 6 = **148**,
  tổng 154 + 6 = **160**. Khớp helper.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên — có thêm 6 mẫu (c2) mới đợt này:**
  P1 ĐÚNG 6/6 (p=5,9e-06) + P2 ĐÚNG 6/6 + P3-A1 ĐÚNG 6/6
  (p=0,00016) + P3' ĐẠT 6/6 + P7 ĐÚNG — **lượt MẠNH (6 seq
  (c2), 5/5 trụ ĐÚNG — lượt ĐÚNG cả 5 trụ đầu tiên kể từ
  đợt 177)**. Cộng dồn vẫn tăng đều (P2 179/179, P7 82/82).
- Chuỗi median tickCost 43 lượt (mới — ĐÃ KIỂM ĐẦY ĐỦ, xem
  F-180-T4-6):
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 /
  39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 /
  58,0 / 60,0 / 39,0 / 60,0 / 40,0 / 41,0 / 41,0 / 44,5 /
  44,0 / 44,0 / 42,0 / 53,0 / 57,0 / 43,0 / 59,0 / 56,0 /
  53,5 / 40,0 / 43,0 / 46,0 / 44,5 / 41,0 / 46,0 / 50,0 /
  45,0 / 49,5 / **44,0 ms** (tổng 2055,5; trung bình 47,8 ms;
  min 39,0, max 60,0; 0 lượt vượt ngưỡng 60).

## 8. Chờ quyết parent / nợ đợt 181

- **(a) #49 CÓ lượt hợp lệ — CHUỖI LƯỢT YÊN HỢP LỆ 42 → 43.**
  Từ phía T4, **chân lượt yên cho chuỗi FULL PASS (O8) ĐẠT**
  (attempt1 hợp lệ trên boot 95b483a2, gate0=T5 với
  POSTBOOT_PASS #95 replay-đầy-đủ, poll=0, KHÔNG caveat
  repair — T8/T10 quyết; tiền lệ: #92 cũng replay-đầy-đủ).
- **(b) P3' cộng dồn MỚI 43 lượt: P1 184/188, P2 179/179,
  P3-A1 157/188, P3' 148/160 = 122/126, P7 82/82:**
  helper đã dùng live khớp tính tay; sổ distinct-seq ĐÃ THĂNG
  CẤP as-of-180. **Chờ parent/T10 quyết:** ghi nhận cộng dồn
  mới. Lượt #49 MẠNH (6 seq (c2)): P1 + P2 + P3-A1 + P3' +
  P7 đều ĐÚNG — lượt ĐÚNG 5 trụ đầu tiên kể từ đợt 177.
- **(c) BOOT 95b483a2 (ứng viên #95) — CHƯA xác minh số hiệu;
  giao T0-180 xác minh 9 nguồn + (m) #95 (T2-180 + parent
  180); INSIDE #95 (T2-180).** Dữ kiện T4: btime #95
  19:10:22Z, gap #94→#95 = 6.793 s; 0 reboot trong phiên đo.
  **Reboot #96 (ứng viên, 8d2a69df, btime danh nghĩa
  21:20:56Z) xảy ra SAU khi poller thoát — chờ T0-180 xác
  minh 9 nguồn + POSTBOOT_PASS #96 (T5-180); gap #95→#96
  = 7.834 s (btime danh nghĩa, có thể lệch ~27 s — xem
  F-180-T4-1).**
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158 + bổ sung tới
  F-178-T4-2) TIẾP TỤC CHỨNG MINH HIỆU QUẢ — giữ làm quy tắc
  đứng.** Đợt này grep stale-string sạch ngay lần đầu
  (F-177-T4-6 không tái diễn); gate0 ĐÃ ĐẠT ngay lúc mở
  (khác đợt 179).
- **(e) POSTBOOT_PASS #95 ĐÃ CÓ (20:59:47Z, boot+109m,
  mode replay-đầy-đủ, poll=0, dpkg 1545): GHI NHẬN — cờ
  REPLAY-ĐẦY-ĐỦ, KHÔNG caveat (khác cờ repair-sớm của #94).
  Giá trị cho gate (a) thuộc T8/T10 quyết.**
  Hướng (3) VẪN ĐỨNG hay không — thuộc T5-180.
- **(f) RAM <500 MB: 6/20 poll (chuỗi dài nhất 4 poll #9–#12)
  — NHẸ HƠN đợt 179 (7/36, chuỗi 4).** Nhưng RAM trong
  attempt1 min 625 MB (100 mẫu, 0 mẫu <500, 76 mẫu <1024)
  — attempt hợp lệ chạy trên RAM đang hồi.
  Giao T9-180 đối chiếu balloon/E-205 trên #95.
- **(g) (m) #95 (T2-180 + parent 180; ứng viên DƯƠNG sơ bộ
  +38,743 s); (m) #56 lần 23 (T2-180); mù #96?/#95?/#94?/#88?
  (hole-recheck lần 24)/#77? (T2-180); (c')/(f') — đợt này
  0 kích hoạt mới (chờ T8-180); 84l10 + Q3 heartbeat
  (T8-180, driver hb128 làm chuẩn); E-205 kết cục (T9-180);
  #95 có giết holder không (T6-180); prune lần 55 (T6-180);
  checklist (o) (T8-180); H3 chỉ giám sát thụ động;
  birefnet 0 thử lần 34; nhắc mọi luồng: KHÔNG chạy script
  nặng / KHÔNG probe dpkg trong cửa sổ attempt (đợt này T4
  giữ 0 vi phạm — chuỗi 1 → 2);
  u2net là fallback chính thức; ci-security.yml vẫn 403 chờ
  user; TTS 39 cấm kiểm lại; G1 chờ user quyết.**
- **(h) B4 KHÔNG CÓ REPLAY TRONG CỬA SỔ ATTEMPT (attempt1,
  dpkg delta 0).** dpkg ổn định 1545 suốt phiên đo (replay
  xong 19:15:05Z, trước khi T4 mở poller); reset về 2 dòng
  lúc 21:21:36Z là replay của boot MỚI #96 — sau cửa sổ.
- **(i) Đối chiếu waiter/O8 (T8):** T4 gate MỞ 1 lần đợt này
  (poll #18) → **CÓ lượt yên hợp lệ #49 cho chuỗi FULL PASS**
  (attempt1, boot 95b483a2, gate0=T5). T8 tự quyết O8 đợt này
  (cùng boot đo; O8 T0 trên #95 DONE 21:16:02Z — 87 s trước
  attempt1, 0 chồng).
- **(j) F-180-T4-1 (reboot #96 sau poller thoát — btime đọc
  sớm ~27 s, chờ T0-180 xác minh); F-180-T4-2 (quyết (p) đã
  triển khai + kiểm chứng live — F-179-T4-5 KHÔNG tái diễn);
  F-180-T4-5 (T9-180 chưa có `b2-spikes.log` lúc T4 đóng).**

## A. Phụ lục số liệu (script trích từ log gốc — stats-180.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-180.py) ==
-- instance 1-test(POLL_TEST=1): 2 poll, 2026-11-23T21:04:28Z - 2026-11-23T21:04:32Z, boot=95b483a2
   RAM min=536 max=561 >=1024: 0/2 500-1023: 2/2 <500: 0/2
   load1<2: 2/2 load5<2: 2/2 blockers>0: 0 apt>0: 0
   gate0: T5=2
   lock: khong=2
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 18 poll, 2026-11-23T21:04:40Z - 2026-11-23T21:17:29Z, boot=95b483a2
   RAM min=441 max=1490 >=1024: 3/18 500-1023: 9/18 <500: 6/18
   load1<2: 14/18 load5<2: 18/18 blockers>0: 4 apt>0: 0
   gate0: T5=18
   lock: co=4, khong=14
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 4 poll
-- TONG poll that: 20
-- RAM toan phien: min=441 max=1490 >=1024: 3/20 <500: 6/20
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/20
   gan-mo? #18 2026-11-23T21:17:29Z boot=95b483a2 RAM=1280 L1=0.96 L5=1.49 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t5/POSTBOOT_PASS) lock=khong t5=PASS
-- boot 95b483a2: 20 poll; RAM>=1024 lan cuoi: 2026-11-23T21:17:29Z #18; RAM<1024 lan dau: 2026-11-23T21:04:28Z #1 RAM=536
-- cong don P3' (MOI, 43 luot hop le): P1 184/188 P2 179/179 P3-A1 157/188 P3' 148/160 occ = 122/126 distinct-seq P7 82/82
-- chuoi median 43 luot: n=43 mean=47,8 min=39,0 max=60,0 vuot-60: 0
```
