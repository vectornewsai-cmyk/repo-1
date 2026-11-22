# PHASE9_ROUND140_T5_INFRA_LIMITS — 2 BOOT: af558fb5 replay XONG (1545/221/462, boot +16m39s, GAP 805s) + REBOOT GIỮA LƯỢT #22 → boot 90392aa5 replay CHẾT YỂU (dpkg 2 dòng, cache 0 .deb) → TRIGGER §8.2(B) form B → --repair 1 lần PASS (795/113) + balloon kẹt trần 15 mẫu + headroom 1838 (chỉ còn 38 trên ngưỡng báo)

> Luồng T5, đợt 140, lượt cron 00:35 +07 19/11/2026 (mở 17:35:51Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **2 BOOT trong phiên T5.** Boot 1 **af558fb5** (#97?,
> **T2-140 đã chứng nhận gap #96?→#97? = [7.246, 7.266] s → CERT 58 /
> FULL 73**):
> replay XONG HẲN trước khi T5 mở (1545 dòng / 221 installs / 462
> configure, xong 16:11:16Z = boot +16m39s — CHẬM NHẤT wall-clock trong
> 3 replay đầy đủ, do GAP 805s không rõ nguyên nhân giữa startup
> configure và install thật); postboot PASS exit 0 ngay poll0 (17:39Z)
> + poll0b (17:40Z); cờ POSTBOOT_PASS ghi 17:40:19Z, T4 đã đọc ở poll
> #1 (17:41:12Z) và MỞ CỬA YÊN #17 ở poll #10 (17:48:00Z, RAM 1060 MB).
> **REBOOT GIỮA LƯỢT #22** (~17:52:56Z): boot af558fb5 chết, giết
> attempt1 của T4 (PARTIAL 10/20, median 73,0 ms — chỉ quan sát) +
> sampler RAM T5 (dừng ở mẫu 15/40) + session exec/sleep của T5
> (runtime restart, SIGTERM). Boot 2 **90392aa5** (#98?,
> **T2-140: INSIDE cả hai dải #98? FULL72 + FULL73; gap danh nghĩa
> #97?→#98? = 7.099 s CHƯA chứng nhận, T2-141**; btime
> 17:52:56Z): replay **CHẾT YỂU** — dpkg đóng băng 2 dòng từ 17:53:48Z,
> 0 proc apt/dpkg, cache apt TRỐNG (0 .deb — KHÔNG sống qua reboot lần
> này), lists 5; watcher v6 poll 9 (18:04:01Z, silent 614 s)
> **TRIGGER=YES §8.2(B) form B**; T5 verify độc lập 5/5 (18:05:06Z)
> rồi **--repair 1 lần duy nhất** (18:05:45Z): apt-get update OK sau
> ~9 phút (mirror chậm, 181 dòng `Get:`), cài đủ 11 gói, RE-CHECK toàn
> PASS; dpkg đóng băng **795 dòng / 113 installs / 230 configure**
> (y hệt boot #95? 914964c3 — repair 1 phần, KHÔNG phải replay đầy đủ
> 1545/221/462); GST là **SYMLINK → debroot** (269 file), không phải
> thư mục thật; watcher ghi cờ POSTBOOT_PASS mới **18:17:07Z poll 22**
> (PASS ổn định 2 poll); T4 đã khởi động lại poller 17:57:08Z và đọc
> cờ mới từ poll #29. **KHÔNG push. KHÔNG release/tag. KHÔNG sửa
> production** (preview.tsx giữ 530e10a7). **KHÔNG tự chạy birefnet**
> (thuộc T9 — T5 CHỈ quan sát + báo cáo). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 1 af558fb5 REPLAY XONG HẲN TRƯỚC KHI T5 MỞ** (btime
   15:54:37Z — **KHỚP brief**, không lặp lại F-139-T5-1).
   dpkg.log **1545 dòng / 221 installs / 462 configure** (configure-
   action 178 / install-action 169 / gstreamer 98 — y hệt baseline);
   md5 `e666a504…`; mtime 16:11:16Z; 0 proc apt/dpkg; cache apt
   178 .deb / 156M; lists 39 (đầy đủ, lưu listing); GST hệ thống là
   thư mục THẬT (apt) 269/269; term.log 0 dòng `Get:` (cài từ cache);
   **postboot PASS exit 0** ngay poll0 (17:39Z) + poll0b sau sửa
   header (17:40Z). Bracket: **(startup configure 15:55:19Z = boot
   +42s, GAP 805s, cài thật 16:08:44–16:11:16Z (2m32s), xong
   16:11:16Z = boot +16m39s, 1545/221/462)** — cài thật nhanh
   (~2,5 phút, ngang #96?) nhưng wall-clock CHẬM NHẤT trong 3
   replay đầy đủ (#94? +6m05s, #96? +3m52s) vì GAP 805s (xem
   F-140-T5-1).
2. **REBOOT GIỮA LƯỢT #22 — BOOT 2 90392aa5, btime 17:52:56Z.**
   T4 phát hiện 17:54:22Z; cửa chết theo quan sát
   (17:53:26Z, 17:54:22Z] (ghi chép T4). **LỆCH ĐỒNG HỒ
   (F-140-T5-2, T4 ghi độc lập F-140-T4-1):** mốc hoạt động cuối
   của boot cũ theo đồng hồ cũ (sampler T5 17:53:19Z, chain T4
   17:53:26Z) NẰM SAU btime boot mới 17:52:56Z (~30–35 s) — đồng
   hồ cũ có lẽ chạy nhanh ~+35 s so với host; T5 lấy btime kernel
   17:52:56Z làm chuẩn cho boot mới, mọi mốc boot cũ giữ nguyên
   theo đồng hồ cũ và ghi rõ.
3. **BOOT 2 REPLAY CHẾT YỂU — KHÔNG PHẢI KẸT CHẬM MÀ LÀ ĐÃ DỪNG
   HẲN.** `apt-get install libvo-aacenc0` còn thấy chạy lúc ~17:54Z,
   nhưng từ watcher poll 1 (17:55:58Z) tới lúc trigger: **0 proc
   apt/apt-get/dpkg/wrapper trong mọi poll**; dpkg.log đóng băng
   2 dòng từ 17:53:48Z; **cache apt 0 .deb / 0 byte** (F-140-T5-3:
   KHÔNG sống qua reboot lần này — phá giả định đứng);
   lists 5 (chỉ cli.github.com + auxfiles/lock/partial);
   `/var/log/apt/history.log` KHÔNG TỒN TẠI trên boot mới (rootfs
   rebuild); journal 17:52–17:57Z KHÔNG có dòng replay/apt/dpkg
   nào — nguyên nhân replay chết không thấy được trong guest log.
   Postboot FAIL exit 1 lúc 17:55:01Z (thiếu 5 lib + GST + 11 gói).
4. **TRIGGER §8.2(B) FORM B = YES (watcher poll 9, 18:04:01Z,
   silent 614 s) — LUẬT (C) KHÔNG ĐỦ:** (d) form (C) đòi lists ≤3
   nhưng lists = 5; (b) không có apt sống để kẹt; (c) silent
   614 s < 900 s lúc trigger. T5 verify độc lập **5/5**
   (18:05:06Z: postboot FAIL tươi exit 1; 0 proc; silent 678 s;
   form B dpkg 2 dòng / 0 installs / GST dir absent / lists 5;
   MiniBrowser 0) rồi chạy **--repair 1 lần duy nhất**
   (18:05:45Z, once-only): GST symlink lại → debroot (269 file,
   18:05Z); `apt-get update` OK sau ~9 phút (mirror chậm);
   cài đủ 11 gói (181 dòng `Get:` trong /tmp/l8-postboot-apt.log);
   RE-CHECK wrapper/libs/GST/apt toàn PASS ~18:15:30Z.
   **KHÔNG chạy repair lần 2, KHÔNG kill proc nào** (không có proc
   nào để kill — khác đợt 138).
5. **BOOT 2 Ở TRẠNG THÁI REPAIR-1-PHẦN, KHÔNG PHẢI REPLAY ĐẦY ĐỦ:**
   dpkg.log đóng băng **795 dòng / 113 installs / 230 configure**
   từ 18:15:21Z (gói cuối libc-bin), md5 `8300395b…`, 0 proc;
   lists 75; cache 110 .deb; GST là **symlink → debroot** (không
   phải thư mục thật như boot 1). Postboot PASS (WebKit đủ điều
   kiện chạy) — nhưng bracket 795/113 KHÔNG phải bracket đầy đủ
   1545/221/462; số liệu y hệt boot #95? (914964c3, đợt 138–139).
   T2-140 đã chứng nhận #97? (gap [7.246, 7.266] s) và đóng mù #59
   hoàn toàn; còn chờ khung chết #97? + gap #97?→#98? = 7.099 s
   (T2-141) và parent quyết khung chết #96?.
6. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
   **2c384ed1**, vite.config.ts **ee80d093** (mở = cuối, cả 2 boot);
   postboot script sửa 2 lần cho 2 boot (`6b0874ba…` →
   `271fbe03…` → **`5bd00bf7…`**, chỉ header + dòng `say`, KHÔNG
   đổi logic — xem §3.4).
7. **RAM SAMPLER — 2 SERIES (1 BỊ REBOOT CẮT, 1 ĐẦY ĐỦ):**
   Series boot 1: n=15 (17:39:19–17:53:19Z), avail
   737.604–1.181.516 kB (mean 917.845), balloon
   5.136.712–6.166.872 kB (mean 5.715.368), **0 mẫu ≥ guard**,
   gate A 2/15, max chỉ 18,8% guard. Series boot 2: n=40
   (17:55:58–18:34:59Z), avail min **490.928 kB** (18:20:59Z),
   max **2.292.968 kB lúc 17:56:58Z = 36,5% guard** (mean
   856.412); balloon 4.547.464–6.443.824 kB (mean 6.080.413);
   **0 mẫu ≥ 6.144 MiB; gate A 9/40; balloon GHIM ĐÚNG trần kẹt
   6.443.824 kB trong 15 mẫu** (18:11:58–18:31:59Z, xen kẽ xả
   ngắn); RAM lúc đóng **523.020 kB**, balloon **ở đúng trần
   kẹt**. **Không có cửa sổ guard nào trong cả 2 series —
   không ai thử birefnet.** T4 mở được cửa yên #17 trên boot 1
   (poll #10, RAM 1060 MB) nhưng attempt1 chỉ PARTIAL 10/20
   (median 73,0 ms — chỉ quan sát, không tính verdict); trên
   boot 2 gate A đóng suốt từ khi cờ mới được ghi (RAM
   479–779 MB), T4 vẫn đang poll lúc T5 đóng (poll #54,
   18:37:04Z, RAM 511 MB).
8. **HEADROOM inotify: 1840** (mở) → **1838** (cuối) — chỉ còn
   **~38 trên ngưỡng báo user (< ~1.800)**; đà giảm ~100/đợt
   thì đợt 141 gần như chắc chắn chạm ngưỡng — **T10 BÁO
   PARENT rõ điểm này** (xem §6.1). Vite chạy được (vite/6.4.5,
   node v24.22.1). Disk `/` 7,0G trống lúc đóng.
9. **EPERM: probe #59 (T2-140) ok=2 fail=0** (17:40:41Z,
   boot=af558fb5); sweep59 đồng thuận: "vẫn bật: 0",
   "CẢNH BÁO: 0", "Operation not permitted: 0", "đã tắt: 2"
   (dương tính giả đã biết trong round139-t10/t10-o8.log).
   **KHÔNG có probe #60 trên boot mới** (tới lúc T5 đóng 18:37Z:
   eperm-probe-v2.log dừng ở probe #59; once.txt của T2 vẫn ghi
   probe #59; cờ round140-t2.done đã có — T2 đã đóng). **Mù #60
   MỚI MỞ từ probe #59 (T2-140)** — việc T2 đợt 141 hoặc T10 phân
   xử. **WFS scan #46: chênh 0** — NEWSTD 935/261, R7b 960/278,
   copies 25/17; T2 quét độc lập ra số ĐẾM Y HỆT (scope +1 file
   T6-140, 0 hit); delta +11/+3 so với #45 giải thích TRỌN VẸN
   bằng diff file-thô trực tiếp. **Async `.writeFile(`: đúng 2
   helper đã biết, 0 stray.**
10. **dmesg KHÔNG ĐỌC ĐƯỢC** trên cả 2 boot (bị chặn EPERM);
    journalctl -k rỗng — đúng như quyết parent §12.3(h).
11. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 2 boot trong phiên (1 reboot giữa lượt)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | af558fb5 (#97? — T2-140 đã chứng nhận gap #96?→#97? [7.246, 7.266] s, CERT 58/FULL 73) | 15:54:37 (uptime -s; /proc/1 15:54:52) | chết ~17:52:56Z (cửa chết theo quan sát (17:53:26Z, 17:54:22Z]) | Replay XONG HẲN trước khi T5 mở (16:11:16Z, boot +16m39s); postboot PASS poll0 17:39Z; cờ ghi 17:40:19Z; T4 mở cửa yên #17 poll #10 17:48:00Z; attempt1 PARTIAL 10/20 thì reboot giết |
| 2 | 90392aa5 (#98? — T2-140: INSIDE cả hai dải #98? FULL72 + FULL73) | 17:52:56 (uptime -s; /proc/1 17:53:11) | còn sống (lúc T5 đóng ~44' tuổi) | Replay CHẾT YỂU (dpkg 2 dòng); watcher TRIGGER §8.2(B) poll 9 (18:04:01Z); --repair 1 lần PASS ~18:15:30Z (795/113, repair-1-phần); cờ POSTBOOT_PASS mới ghi 18:17:07Z poll 22; T4 đã đọc từ poll #29, đang chờ gate A |

- **Btime boot 1 KHỚP brief** (15:54:37Z, 8 nguồn: /proc/stat,
  uptime -s, stat /proc/1, who -b, journal first entry 15:54:53Z,
  T2-140 boot-verify, probe #59 "uptime since 15:54:37", poller
  T4-140) — không lặp lại F-139-T5-1.
- **Lệch đồng hồ quanh reboot (F-140-T5-2):** btime boot 2
  17:52:56Z TRƯỚC mốc hoạt động cuối boot 1 theo đồng hồ cũ
  (sampler 17:53:19Z, chain T4 17:53:26Z) ~30–35 s; T4 ghi độc
  lập F-140-T4-1 (cùng lệch 30 s, cửa chết (17:53:26Z,
  17:54:22Z]). Hai luồng độc lập cùng kết luận lệch đồng hồ —
  giả thuyết: đồng hồ cũ chạy nhanh ~+35 s so với host, boot
  mới đồng bộ lại về giờ host. **Đính chính từ T2-140 (đọc sau
  khi T5 viết nháp):** T2 đo F98? ≈ −1 s (3 server đồng nhất
  +1 s) và, cho khung chết #96?, caveat "đồng hồ cũ chạy nhanh
  +5 s chắc chắn / +25 s có thể" — tức ước lượng ~+35 s của T5
  chỉ là **cận trên thô** từ hiệu mốc cuối boot cũ trừ btime
  mới, KHÔNG phải số đo chính xác; số chính xác chờ T2-141/T10.
  T5 lấy btime kernel 17:52:56Z làm chuẩn cho boot 2; mọi mốc
  boot 1 giữ nguyên theo đồng hồ cũ và ghi rõ.
- Boot trước 541524e2 (#96?, **T2-140 đã chứng nhận gap
  #96?→#97? = [7.246, 7.266] s → CERT 58 / FULL 73; khung chết
  #96? ứng viên merged (15:54:16Z, 15:54:37Z] (21 s) — T2 đề
  xuất làm chuẩn mới, parent quyết khi đóng sổ; khung T9
  (15:54:02Z, 15:54:37Z] 35 s là biên ngoài, khung T8 là cách
  dựng khác**) chết TRƯỚC khi T5-140 mở. **Mù #59 ĐÃ ĐÓNG HOÀN
  TOÀN (T2-140: 2 đoạn, chuỗi đóng hoàn toàn thứ ba liên tiếp
  #57/#58/#59); mù #60 MỚI MỞ từ probe #59; gap danh nghĩa
  #97?→#98? = 7.099 s CHƯA chứng nhận (T2-141).** T5 KHÔNG kiểm
  lại khung chết #94? (đã xác nhận ở đợt 138 §12.3(e)(ii)).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 140** do
  parent tạo (17:36Z, ghi "Đợt 140 ĐANG CHẠY… 9 luồng
  T1–T9…") — KHÔNG phải đợt main-chat (tiền lệ đợt 130–139).
  T5 tiến hành bình thường.
- journalctl --list-boots trên boot 2 chỉ có **1 boot duy nhất**
  (90392aa5, first entry 17:53:12Z) — không có boot thứ 2 nào
  trong journal; không tìm thấy dòng timesync/chrony/ntp nào
  trong journal boot 2.

## 3. dpkg replay — boot 1 XONG (GAP 805s) + boot 2 CHẾT YỂU → --repair

### 3.1 Boot 1 af558fb5 — replay XONG HẲN, bracket đầy đủ, GAP 805s (F-140-T5-1)

| Hạng mục | Lúc mở (17:38–17:41Z) | Lúc đóng boot 1 |
|---|---|---|
| dpkg.log dòng | 1545 | 1545 |
| `status installed` | 221 | 221 |
| dòng chứa `configure` | 462 | 462 |
| action `configure` (cột 3) | 178 | 178 |
| action `install` (cột 3) | 169 | 169 |
| dòng `gstreamer` | 98 | 98 |
| dpkg.log md5 | `e666a504…` | `e666a504…` |
| dpkg.log mtime | 16:11:16.01Z | 16:11:16.01Z |
| startup configure đầu | 15:55:19Z | như vậy (boot +42s) |
| cài thật | 16:08:44–16:11:16Z | 2m32s, gói cuối gstreamer1.0-tools |
| cache apt | 178 .deb / 156M | 178 / 156M |
| lists / partial | 39 / 0 | 39 / 0 (listing đầy đủ lưu apt-lists.txt) |
| GST hệ thống / debroot | 269 / 269 (thư mục THẬT) | 269 / 269 |
| term.log dòng `Get:` | 0 (980 dòng) | 0 |
| proc apt/dpkg | 0 | 0 |
| postboot check | PASS exit 0 (poll0 17:39Z + poll0b 17:40Z sau sửa header) | — |

- **GAP 805s (F-140-T5-1):** dpkg.log chỉ có 2 dòng startup
  `packages configure` lúc 15:55:19Z rồi im tới 16:08:44Z
  (`startup archives unpack`); apt history.log: Start-Date
  ĐẦU TIÊN 16:08:44Z, **0 lần `apt-get update`**; term.log mọi
  `Log started` đều 16:08:44–16:11:16Z; journal 15:55–16:09Z
  chỉ có housekeeping systemd (hatch-ca-trust 15:55:23–27Z,
  home-assistant-ensure lặp mỗi ~70 s). **Không có bằng chứng
  guest-side nào giải thích 13m25s này** — có thể host-side
  (replay driver chờ trước khi chạy apt install) nhưng T5
  không chứng minh được; ghi rõ để T6/T10 lưu ý, không kết
  luận nguyên nhân. Cài thật chỉ 2m32s — ngang #96? (3m21s cài
  thật) — nên wall-clock +16m39s là chậm do GAP, không phải do
  cài chậm.
- **Lists 39 vs 37 (đợt 139):** +2 = 2 file cli.github.com
  (InRelease + Packages) — đã lưu listing đầy đủ lần này
  (apt-lists.txt, bài học F-139-T5-2 đã áp dụng: lưu file, không
  chỉ số đếm). Đợt này lists boot 1 gồm 4 suite noble/updates/
  security/backports + cli.github.com; apt history KHÔNG ghi
  `apt-get update` nào trên boot 1 — 2 file cli.github.com có
  thể đã nằm trong seed/rootfs của boot này; T5 ghi nhận mà
  không kết luận.
- Cờ `POSTBOOT_PASS` (boot 1) ghi **17:40:19Z**
  (`boot_id=af558fb5-… btime=2026-11-18T15:54:37Z pass_at=
  2026-11-18T17:40:19Z poll=0`) — T4 đã đọc ở **poll #1
  (17:41:12Z**, ~53 s sau khi ghi; t5flag=PASS(t5src=140-t5/
  POSTBOOT_PASS), postboot_exit=0, dpkg_lines=1545). Cờ này sau
  đó được watcher archive thành `POSTBOOT_PASS.stale-af558fb5`
  lúc khởi động trên boot 2 (v5 fix).

### 3.2 Boot 2 90392aa5 — replay CHẾT YỂU, watcher TRIGGER §8.2(B), --repair 1 lần

- **Bằng chứng replay đã dừng hẳn (không phải kẹt chậm):**
  dpkg.log 2 dòng từ 17:53:48Z (`startup packages configure`
  ×2 — `dpkg --configure -a` đầu replay); `apt-get install
  libvo-aacenc0` còn thấy chạy lúc ~17:54Z (ps của T5), nhưng
  từ watcher poll 1 (17:55:58Z) trở đi **mọi poll đều 0 proc**
  (apt=0, apt-get=0, dpkgproc=0, wrapper=0); journal
  17:52–17:57Z không có dòng replay/apt/dpkg nào;
  `/var/log/apt/history.log` KHÔNG TỒN TẠI (rootfs rebuild);
  cache **0 .deb / 0 byte** (F-140-T5-3); lists 5, partial 0.
  Postboot FAIL exit 1 lúc 17:55:01Z (thiếu 5 lib + GST +
  11 gói) — xem log `t5-postboot-boot90392aa5-poll0.log`.
- **Watcher v6** (`t5-wait-replay-boot90392aa5.sh`, copy b92 đợt
  138, đổi HF/boot/btime; poll 60 s, tối đa 60 poll; ghi cờ
  vào round140-t5/; archive cờ stale lúc khởi động):
  poll 1–8: postboot FAIL, dpkg 2 dòng đóng băng, silent tăng
  dần; **poll 9 (18:04:01Z): TRIGGER=YES** — c1 FAIL tươi,
  c2a 0 proc, c2b frozen + silent 614 s ≥600, c3 silent ≥600,
  c4 form B (dpkg ≤5 dòng + 0 installs + FAIL), c5 MiniBrowser
  0. **EVAL_C cùng poll: (C) KHÔNG đủ** — a FAIL ✓ nhưng
  b (apt sống kẹt) KHÔNG (không có apt nào sống), c silent
  614 s < 900 s, **d form (C) KHÔNG (lists 5 > 3)**, e no-probe
  ✓. Nên trigger vận hành là **§8.2(B) form B, không phải
  luật (C)** — T5 ghi rõ để khỏi đọc thành "(C) kích hoạt".
- **Verify độc lập 5/5 (18:05:06Z, log `t5-verify-b-trigger.log`):**
  (1) postboot FAIL tươi exit 1; (2) apt=0 apt-get=0 dpkg=0
  os-intent=0 (kiểm lại live — lần đọc đầu ra 2 do tự khớp mẫu
  của shell kiểm, xem F-140-T5-4; watcher 9 poll đều wrapper=0);
  (3) dpkg im 678 s ≥600 (mtime 17:53:48Z); (4) form B: dpkg
  2 dòng / 0 installs / GST dir không tồn tại / lists 5;
  (5) MiniBrowser 0 (vite-dev=2 là vite của T4/T8, không phải
  probe — không cản repair). **Đủ 5/5 → --repair 1 lần.**
- **--repair (18:05:45Z, log `t5-repair-boot90392aa5.log`,
  cờ `REPAIR_TRIGGERED`):** wrapper PASS (K1 còn nguyên);
  GST symlink lại → debroot (269 file, 18:05Z); apt FAIL 11 gói
  → `apt-get update` (INFO "lists có thể trống…") **OK sau
  ~9 phút** (mirror chậm — update chạy 18:05:45Z→~18:14:xxZ);
  cài đủ 11 gói (`REPAIRED apt: đã cài: libevent-2.1-7t64
  gstreamer1.0-plugins-base … libevdev2`); **RE-CHECK wrapper /
  libs / GST / apt toàn PASS ~18:15:30Z**; KẾT LUẬN: ĐỦ ĐIỀU
  KIỆN chạy WebKit. Tổng thời gian repair ~10 phút. **Chỉ chạy
  1 lần (once-only) — KHÔNG chạy lại, KHÔNG kill proc nào.**
- **Trạng thái sau repair (đóng băng, KHÔNG phải replay đầy
  đủ):** dpkg.log **795 dòng / 113 installs / 230 configure**,
  md5 `8300395b…`, mtime 18:15:21Z (gói cuối libc-bin), 0 proc;
  lists 75; cache 110 .deb; GST vẫn là **symlink → debroot**
  (repair tạo symlink rồi apt install 11 gói — plugin dir hệ
  thống vẫn là symlink, postboot PASS vì đi qua symlink thấy
  đủ isomp4/libav). Số 795/113 **y hệt boot #95? (914964c3)** —
  cùng 11 gói + deps qua repair. T5 nhấn mạnh: postboot PASS =
  WebKit đủ điều kiện chạy, KHÔNG đồng nghĩa replay đầy đủ
  1545/221/462.
- **Watcher kết thúc:** poll 20 (18:15:06Z) đã thấy dpkg tăng
  (frozen=no, silent 0); **poll 22 (18:17:07Z) FLAG_WRITTEN**
  (PASS ổn định 2 poll liên tiếp + dpkg đóng băng + 0 proc) —
  `POSTBOOT_PASS boot_id=90392aa5-… btime=2026-11-18T17:52:56Z
  pass_at=2026-11-18T18:17:07Z poll=22`; WATCHER_END
  `done_pass_stable_2polls poll=22`.
- **T4 trên boot 2:** phát hiện reboot 17:54:22Z; khởi động lại
  poller 17:57:08Z (`poll-wait-t4-140b.sh`), poll #1 RAM
  **2199 MB** nhưng gate0 FAIL (đọc đúng cờ cũ round139-t5/
  là `cu` — không tính); đọc cờ mới round140-t5/ từ poll #29
  (18:18:14Z); gate A đóng suốt sau đó (RAM 479–779 MB);
  vẫn đang poll lúc T5 đóng (poll #54, 18:37:04Z, RAM 511 MB).
  Attempt2/3 chờ gate A mở lại — việc T4, T5 chỉ ghi nhận.

### 3.3 F-140-T5-2 — Lệch đồng hồ ~+30–35 s quanh reboot (T4 xác minh độc lập F-140-T4-1)

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| btime boot 2 (/proc/stat) | 1795024376 = 17:52:56Z | chuẩn kernel |
| uptime -s boot 2 | 2026-11-18 17:52:56 | ✓ khớp btime |
| stat /proc/1 boot 2 | 17:53:11Z (+15 s) | mẫu như mọi boot ✓ |
| journal first entry boot 2 | 17:53:12Z (+16 s) | ✓ |
| sampler T5 mẫu cuối boot 1 | 17:53:19Z (đồng hồ cũ) | SAU btime boot 2 23 s ✗ |
| chain T4 dòng cuối boot 1 | 17:53:26Z (đồng hồ cũ) | SAU btime boot 2 30 s ✗ |
| T4 phát hiện reboot | 17:54:22Z | cửa chết (17:53:26Z, 17:54:22Z] |

- **T4 (F-140-T4-1) ghi độc lập cùng lệch 30 s** và cùng cửa
  chết — hai luồng độc lập đồng thuận. Giả thuyết: đồng hồ
  guest cũ chạy nhanh ~+35 s so với host; boot mới đồng bộ lại
  về giờ host. T5 lấy 17:52:56Z làm chuẩn boot 2; mọi mốc boot
  1 giữ theo đồng hồ cũ. Số chính xác chờ T2-141/T10 (xem đính
  chính T2-140 ở §2); khung chết #97? + gap #97?→#98? chờ T2-141.

### 3.4 Postboot script — sửa 2 lần cho 2 boot (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`6b0874ba…` (cuối đợt 139) → **`271fbe03…`** (boot 1) →
**`5bd00bf7…`** (boot 2):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 17:39–17:40Z | af558fb5 | `6b0874ba…` → `271fbe03…` | header (đoạn Dot 140 boot 1: btime KHỚP brief, replay GAP 805s, boot +16m39s, headroom 1840) + say mô tả trạng thái đã đo (postboot PASS poll0 đã có trước khi viết say) |
| 2 | 18:20–18:21Z | 90392aa5 | `271fbe03…` → `5bd00bf7…` | header (đoạn Dot 140 boot 2: reboot giữa lượt, replay chết yểu, TRIGGER §8.2(B), --repair 1 lần PASS, 795/113, GST symlink, cờ 18:17:07Z) + say mô tả trạng thái đã đo (repair PASS + cờ đã ghi trước khi viết say) |

- `bash -n` OK sau mỗi lần sửa. **KHÔNG đổi logic** (không đổi
  thứ tự apt/GST, không đổi NEED/threshold). Check-only chạy
  lại sau mỗi lần sửa đều **exit 0** (poll0b boot 1 17:40Z;
  poll0b boot 2 18:21Z) — cùng kết quả như trước sửa, chứng
  minh sửa header/say không ảnh hưởng logic.

## 4. Kiểm cây — md5 3 file lúc mở / cuối + postboot script

| File | Lúc mở 17:38Z (boot 1) | Giữa lượt (boot 2, 17:55Z) | Lúc đóng | Kết luận |
|---|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 6b0874ba… | 271fbe03… (sau sửa lần 1) | 5bd00bf7… (sau sửa lần 2) | chỉ header + say, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này. T4-140 cũng độc lập ghi tree=YES:md5=
  530e10a7 ở mọi poll cả 2 boot.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 2 series: boot 1 bị cắt (n=15) + boot 2 đầy đủ (n=40, balloon GHIM TRẦN KẸT 15 mẫu)

### 5.1 Series boot 1 af558fb5 — n=15, 17:39:19–17:53:19Z (BỊ REBOOT CẮT)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 17:39:19 | 953.580 | 5.930.172 | 3,22 |
| 2 | 17:40:19 | 821.564 | 6.044.224 | 2,37 |
| 3 | 17:41:19 | 972.620 | 5.927.660 | 3,03 |
| 4 | 17:42:19 | 1.060.436 | 5.804.688 | 2,67 |
| 5 | 17:43:19 | 906.008 | 5.936.652 | 1,59 |
| 6 | 17:44:19 | 817.060 | 6.058.312 | 0,94 |
| 7 | 17:45:19 | 737.604 | 6.166.872 | 1,43 |
| 8 | 17:46:19 | 882.236 | 6.071.828 | 1,59 |
| 9 | 17:47:19 | **1.181.516** | 5.721.016 | 2,20 |
| 10 | 17:48:19 | 849.180 | 5.356.552 | 3,15 |
| 11 | 17:49:19 | 964.960 | 5.136.712 | 3,62 |
| 12 | 17:50:19 | 1.048.420 | 5.268.784 | 2,93 |
| 13 | 17:51:19 | 879.556 | 5.401.152 | 1,48 |
| 14 | 17:52:19 | 791.588 | 5.518.696 | 1,63 |
| 15 | 17:53:19 | 901.340 | 5.387.196 | 1,36 |

- Thống kê: min **737.604 kB lúc 17:45:19Z**; max **1.181.516
  kB lúc 17:47:19Z = 1.153,8 MiB = 18,8% guard 6.144 MiB**;
  trung bình 917.845 kB; Balloon 5.136.712–6.166.872 kB
  (trung bình 5.715.368 kB). **0 mẫu ≥ 6.144 MiB.** Gate A
  (≥1.048.576 kB): **2/15 mẫu** (mẫu 4: 1.060.436; mẫu 12:
  1.048.420 — mẫu 12 chỉ dưới gate 156 kB, sát nút).
  Load1 0,94–3,62 (cao khi 9 luồng chạy).
- **Tương quan với cửa yên #17:** mẫu 9 (17:47:19Z, avail
  1.181.516) là đỉnh series — T4 poll #10 lúc 17:48:00Z đọc
  RAM 1060 MB và mở cửa; mẫu 10 (17:48:19Z) avail đã rơi về
  849.180 (attempt1 + vite/WebKit tiêu RAM thật). T5 chỉ ghi
  nhận tương quan, kết quả attempt thuộc T4.

### 5.2 Series boot 2 90392aa5 — n=40, 17:55:58–18:34:59Z + DONE 18:35:59Z

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 17:55:58 | 1.393.480 | 5.406.444 | 1,98 |
| 2 | 17:56:58 | **2.292.968** | **4.547.464** | 1,55 |
| 3 | 17:57:58 | 2.158.744 | 4.719.820 | 1,38 |
| 4 | 17:58:58 | 1.839.664 | 4.957.868 | 1,15 |
| 5 | 17:59:58 | 1.628.876 | 5.167.716 | 1,09 |
| 6 | 18:00:58 | 1.530.976 | 5.362.484 | 0,91 |
| 7 | 18:01:58 | 1.378.996 | 5.541.460 | 0,47 |
| 8 | 18:02:58 | 1.188.188 | 5.702.552 | 0,33 |
| 9 | 18:03:58 | 1.093.184 | 5.848.876 | 0,72 |
| 10 | 18:04:58 | 951.792 | 5.983.632 | 0,50 |
| 11 | 18:05:58 | 957.092 | 5.900.328 | 0,62 |
| 12 | 18:06:58 | 898.848 | 5.984.896 | 0,71 |
| 13 | 18:07:58 | 810.172 | 6.106.296 | 0,49 |
| 14 | 18:08:58 | 670.448 | 6.215.148 | 0,48 |
| 15 | 18:09:58 | 616.092 | 6.315.844 | 0,27 |
| 16 | 18:10:58 | 505.560 | 6.403.200 | 0,74 |
| 17 | 18:11:58 | 522.032 | **6.443.824** | 1,16 |
| 18 | 18:12:58 | 509.844 | **6.443.824** | 1,26 |
| 19 | 18:13:59 | 529.172 | **6.443.824** | 1,14 |
| 20 | 18:14:59 | 527.960 | **6.443.824** | 0,80 |
| 21 | 18:15:59 | 822.620 | 6.181.680 | 1,07 |
| 22 | 18:16:59 | 914.816 | 6.060.728 | 1,08 |
| 23 | 18:17:59 | 840.216 | 6.147.960 | 0,96 |
| 24 | 18:18:59 | 641.184 | 6.349.564 | 0,77 |
| 25 | 18:20:59 | **490.928** | 6.440.268 | 1,00 |
| 26 | 18:21:59 | 518.444 | **6.443.824** | 0,77 |
| 27 | 18:22:59 | 521.980 | **6.443.824** | 0,88 |
| 28 | 18:23:59 | 559.144 | **6.443.824** | 0,98 |
| 29 | 18:24:59 | 533.844 | **6.443.824** | 0,41 |
| 30 | 18:25:59 | 514.972 | **6.443.824** | 0,24 |
| 31 | 18:26:59 | 510.560 | **6.443.824** | 0,38 |
| 32 | 18:27:59 | 509.448 | **6.443.824** | 0,41 |
| 33 | 18:28:59 | 515.568 | **6.443.824** | 0,37 |
| 34 | 18:29:59 | 528.420 | **6.443.824** | 0,27 |
| 35 | 18:30:59 | 500.308 | **6.443.824** | 0,19 |
| 36 | 18:31:59 | 571.152 | **6.443.824** | 0,52 |
| 37 | 18:32:59 | 745.784 | 6.247.216 | 1,03 |
| 38 | 18:33:59 | 677.708 | 6.311.456 | 0,60 |
| 39 | 18:34:59 | 583.320 | 6.406.152 | 0,30 |
| 40 | (DONE 18:35:59Z) | — | — | — |

- Thống kê (tính bằng code trên 40 mẫu): min **490.928 kB lúc
  18:20:59Z**; max **2.292.968 kB lúc 17:56:58Z = 2.240,2 MiB
  = 36,5% guard**; trung bình 856.412 kB; Balloon min
  **4.547.464 kB lúc 17:56:58Z**, max **6.443.824 kB** (trần
  kẹt), trung bình 6.080.413 kB. **0 mẫu ≥ 6.144 MiB.**
  Gate A (≥1.048.576 kB): **9/40 mẫu** (tập trung đầu series
  17:55:58–18:04:58Z + mẫu 21–22 sau lần xả 18:15:59Z).
  Load1 0,19–1,98.
- **Hình dạng: phình đơn điệu tới trần rồi GHIM.** Balloon
  phình ~+150–200k kB/phút từ 4,55M (17:56:58Z) lên trần
  6.443.824 kB (18:11:58Z), **ghim đúng trần 15 mẫu**
  (18:11:58–18:14:59Z 4 mẫu + 18:21:59–18:31:59Z 11 mẫu),
  xen 1 lần XẢ ~260k kB lúc 18:15:59Z (balloon −262.144 kB,
  avail +294.660 kB — trùng lúc repair cài xong gói cuối +
  watcher poll 20 thấy dpkg tăng; tương quan, không kết luận
  nhân quả) rồi phình lại lên trần. Lúc đóng (18:36:56Z,
  ngoài series): avail **523.020 kB**, balloon **đúng trần
  6.443.824 kB** — mức phẳng ~500 MB như cuối đợt 138–139.
  Khác đợt 139 (wobble 2 lần xả ~1M kB): đợt này balloon
  **ghim trần chứ không wobble sâu** — xả lớn nhất trong
  series chỉ ~260k kB.
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy
  song song — nếu cửa sổ guard mở sau khi T5 đóng (18:37Z),
  T9 là luồng bắt được theo quyết §12.3(d) đợt 138. Trong
  phiên T5, đỉnh cao nhất chỉ 36,5% guard (boot 2) / 18,8%
  (boot 1) — **không có cửa sổ nào, không ai thử birefnet**.
  u2net vẫn là fallback chính thức.
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f) đợt 137). Birefnet vẫn 0 lần chạy thành công
  trong gói (tính tới lúc T5 đóng).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 136 cuối (T5) | 2276 | boot 1ca1feaa |
| Đợt 137 mở boot 1 / mở boot 2 / cuối (T5) | 2178 / 2168 / 2168 | boot 2104246b / 17db9652 |
| Đợt 138 mở / mở boot 2 / cuối (T5) | 2065 / 2058 / 2056 | boot #94? / 914964c3 |
| Đợt 139 mở (T5) / cuối (T5) | 1950 / 1948 | boot 541524e2 |
| **Đợt 140 mở (T5, 17:39Z, boot 1)** | **1840** | **boot af558fb5, headroom-open.txt** |
| **Đợt 140 cuối (T5, 18:21Z, boot 2)** | **1838** | **headroom-end.txt** |

- Giảm −108 so với cuối đợt 139 (1948 → 1840) rồi −2 trong
  phiên (1840 → 1838); chuỗi dài hạn tiếp tục giảm đều
  (~100–110/đợt, 10 đợt gần nhất). **Chỉ còn ~38 trên ngưỡng
  báo user (< ~1.800) lúc đóng** — theo đà này, đợt 141 gần
  như chắc chắn chạm ngưỡng; **T10 BÁO PARENT RÕ ĐIỂM NÀY**
  để parent quyết có đưa lên user hay không (quyết §12.3(j)
  đợt 137: chỉ theo dõi dưới ngưỡng — nhưng 1838 SẮP chạm,
  không còn là "chỉ theo dõi" ở đợt sau).
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **447 (lúc mở, boot 1)** → **320 (lúc đóng, boot 2)**
  — giảm do reboot + các luồng đã xong; watch giữ ngoài cell
  như các đợt trước (~61k watch ngoài cell theo T9).

### 6.2 Disk

- Overlay `/`: 7,5G tổng, 519M đã dùng, **6,8G trống (7%)** lúc
  mở (boot 1, 17:41Z) → **337M đã dùng, 7,0G trống (5%)** lúc
  đóng (boot 2, 18:37Z) — tăng trống ~200M do rootfs rebuild
  theo boot mới — không phải vấn đề.
  `/tmp` tmpfs 512M, 502M trống lúc mở.
- Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` tồn tại; `vite --version` =
  **vite/6.4.5 linux-x64 node-v24.22.1** (chạy được, kiểm boot 1).
  T5 KHÔNG chạy dev server / build (không sửa production; việc
  của T8).

## 7. EPERM scan + WFS #46 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #59 (T2-140): ok=2 fail=0, boot=af558fb5, 17:40:41Z**
  (`round140-t2/once.txt`, exit 0; status2 ALIVE). Trước probe,
  status1 DEAD/STALE (heartbeat #58 age 10.585 s — đúng,
  heartbeat từ probe #58 trên boot cũ 541524e2; death được ghi
  vào log kèm dòng `boot changed 541524e2 -> af558fb5`, không
  phải im lặng). Probe #59 là probe đầu tiên trên boot af558fb5.
- **KHÔNG có probe #60 trên boot 90392aa5** (tới lúc T5 đóng
  18:37Z: eperm-probe-v2.log dừng ở probe #59; once.txt của T2
  vẫn ghi probe #59; cờ round140-t2.done đã có — T2 đã đóng).
  Mù #59 ĐÃ ĐÓNG HOÀN TOÀN (T2-140); mù #60 MỚI MỞ — việc T2 đợt
  141 hoặc T10 phân xử (T5 chỉ ghi nhận, không tự chạy probe chéo
  để không đếm trùng sóng).
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log + sweep T2)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 đóng).
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #58→#59
  (541524e2→af558fb5, age 10.585 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–139).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** Sweep của
  T2-140 (eperm-sweep59.py, `round140-t2/eperm-sweep-run.log`)
  ĐÃ CHẠY và đồng thuận: "sóng EPERM vẫn bật: 0", "CẢNH BÁO
  (10-phút): 0", "Operation not permitted: 0", "sóng EPERM đã
  tắt: 2" — cả 2 đều trong `round139-t10/t10-o8.log` (dòng
  launcher 16:48:56Z + 16:49:58Z — **dương tính giả đã biết**,
  cùng 2 dòng T2-138/T2-139 đã phân loại); extended raw 'EPERM'
  matches: 8 total / 8 unique (2 dòng "đã tắt" + 6 dòng test-pass
  hasEperm). EPERM vẫn KHÔNG được tuyên bố là đã hết (quy ước
  đứng).

### 7.3 WFS scan #46 (T5 chạy, 17:40:27–17:40:59Z, 32 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round140-t5, **đổi OUT round139-t5 → round140-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round140-t5, không
  còn tham chiếu round cũ nào trong script). Kết quả:
  - NEWSTD: **935 dòng / 261 file** (phạm vi 3.163 file);
  - R7b đối chiếu: **960 dòng / 278 file** (phạm vi 12.556 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43, 44, 45.
  - Đối chiếu chéo: 935+25=960=R7b, **chênh 0**.
- **+11 dòng / +3 file so với lần 45 (T5)** (924/258 → 935/261),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #45
  còn nguyên trong round139-t5/):
  | Phạm vi | #45 (T5, 14:48:52Z) | #46 (T5, 17:40:27Z) | Delta |
  |---|---|---|---|
  | NEWSTD scope | 3.152 | 3.163 | +11 file, 0 file mất |
  | NEWSTD | 924/258 | 935/261 | +11/+3 |
  | R7b | 949/275 | 960/278 | +11/+3 |
  | copies | 25/17 | 25/17 | 0 |
  - 11 file mới trong scope = đúng 11 file `docs/` (9 file LIMITS
    đợt 139: aggregate + T1/T2/T4/T5/T6/T7/T8/T9 — và 2 file đợt
    140 đã có lúc quét: T1-140 + T9-140); 0 file mất. Trong 11 file mới, chỉ 3 file
    có hit: aggregate-139 +1, T2-139 +7, T5-139 +3 (= +11);
    8 file còn lại 0 hit. Diff wfs-newstd.txt #45→#46 chỉ ra
    đúng 3 dòng thêm, không file nào đổi số hit, không file nào
    mất hit.
- **Kết luận: 46 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #59.

### 7.4 Đối chiếu chéo T2 vs T5 (scan #46 — 2 lần quét độc lập)

- T2-140 chạy scan #46 của mình **17:50:03–17:50:33Z** (OUT đã
  sửa đúng `round140-t2` TRƯỚC khi chạy — T5 kiểm lúc 17:42Z
  thấy OUT còn `round139-t2`, T2 đã tự sửa trước khi chạy,
  xem F-140-T5-5): NEWSTD **935 dòng / 261 file** (phạm vi
  3.164), R7b **960/278** (phạm vi 12.557), copies 25/17;
  935+25=960 ✓.
- T5-140 scan #46 **17:40:27–17:40:59Z**: NEWSTD 935/261
  (3.163), R7b 960/278 (12.556), copies 25/17; 935+25=960 ✓.
- Delta T2−T5: **số đếm Y HỆT, scope +1 file** (cả NEWSTD lẫn
  R7b). Diff 2 file files-newstd.bin: **chỉ khác đúng 1 file —
  `./docs/PHASE9_ROUND140_T6_LOCKHEALTH_LIMITS.md`** (tạo
  17:41–17:50Z giữa 2 lần quét, 0 hit); diff wfs-newstd.txt,
  wfs-r7b.txt, wfs-copies.txt: **IDENTICAL cả 3 file**.
  **Hai lần quét độc lập khớp nhau hoàn toàn — chênh 0 được
  củng cố lần thứ hai trong đợt này.**

### 7.5 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Phương pháp: pattern `\.writeFile\(` (có dấu chấm) — như T2-137
  §2.8. **0 stray.** Không có bằng chứng async writeFile bị dùng
  để né EPERM trong mù #59.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg` (cả 2 boot): 1 dòng duy nhất — `dmesg: read kernel
  buffer failed: Operation not permitted` (bị chặn EPERM trong
  cell, như đợt 136–139). `journalctl -k --no-pager`: `-- No
  entries --` (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max 2.292.968 kB = 36,5% guard lúc
   17:56:58Z boot 2; 18,8% boot 1 — xa guard; balloon ghim trần
   6.443.824 kB 15 mẫu, chỉ xả ngắn ~260k kB). T9 sampler dài
   là luồng bắt cửa sổ nếu có sau khi T5 đóng; guard 6.144 MiB
   GIỮ NGUYÊN (quyết §12.3(d) đợt 138). u2net là fallback
   chính thức.
2. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên
   #17 (T4) MỞ trên boot 1 (poll #10, gate0 PASS + gateA đủ RAM
   1060 MB) nhưng attempt1 chỉ PARTIAL 10/20 (median 73,0 ms
   post-flip 69,0 ms, n=89 — CHỈ QUAN SÁT, không tính verdict
   theo DEF v0.5 §1); T4 khởi động lại từ attempt2 trên boot 2
   (tối đa 2 lượt chạy attempt2/3 theo quyết parent đợt 139(h));
   gate A trên boot 2 đóng suốt từ khi cờ mới được ghi (RAM
   479–779 MB) — T4 vẫn đang poll lúc T5 đóng. P1 28/28, P3
   24/28, P7 14/14 (cộng dồn giữ nguyên); DEF v0.5 (P5 34–52 ms
   + P3' stall-based) đã chấp nhận, T3 viết ở đợt 138 — P3'
   vẫn chưa được kiểm lần nào.
3. **F-140-T5-2 (§3.3/§11): lệch đồng hồ ~+30–35 s quanh reboot
   — ĐÃ ĐƯỢC T4 XÁC MINH ĐỘC LẬP (F-140-T4-1) VỀ HƯỚNG LỆCH, NHƯNG
   SỐ CHÍNH XÁC CHỜ T2-141/T10 (T2-140 đo F98? ≈ −1 s; caveat
   khung #96?: đồng hồ cũ nhanh +5 s chắc chắn / +25 s có thể —
   ước lượng ~+35 s của T5 chỉ là cận trên thô).** T5 lấy
   17:52:56Z làm chuẩn boot 2. Còn chờ T6/T10: số boot 90392aa5
   (T2-140: INSIDE cả hai dải #98? FULL72 + FULL73) + khung chết
   #97? (boot af558fb5, cửa chết (17:53:26Z, 17:54:22Z] theo quan
   sát T4) + gap #97?→#98? = 7.099 s chờ chứng nhận (T2-141).
4. **Headroom SẮP CHẠM NGƯỠNG BÁO (1838, chỉ còn ~38):**
   T10 BÁO PARENT RÕ — đợt 141 gần như chắc chắn chạm < ~1.800
   nếu đà ~100/đợt giữ nguyên (chỉ là phép chia đà, không phải
   dự báo). Quyết parent đợt 137 §12.3(j) chỉ nói "theo dõi"
   dưới ngưỡng — nay sắp chạm nên cần parent quyết trước.
5. **Boot 2 ở trạng thái repair-1-phần (795/113), GST symlink:**
   postboot PASS nhưng KHÔNG phải replay đầy đủ; nếu boot sau
   replay đầy đủ 1545/221/462 thì GST sẽ lại là thư mục thật —
   T5 đợt sau đối chiếu lại (không tự kết luận symlink là vấn
   đề: postboot RE-CHECK GST PASS qua symlink, WebKit decode
   đủ isomp4/libav).
6. **Cache apt KHÔNG sống qua reboot lần này (F-140-T5-3):**
   nếu các boot sau cache lại trống thì replay/update sẽ chậm
   (~9 phút như lần này) — T5 đợt sau kiểm cache ngay lúc mở
   boot mới (bài học mới).
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 139 §11: **mù #59
   ĐÃ ĐÓNG HOÀN TOÀN (T2-140, chuỗi đóng hoàn toàn thứ ba liên tiếp
   #57/#58/#59); mù #60 MỚI MỞ từ probe #59; gap #96?→#97? =
   [7.246, 7.266] s ĐÃ CHỨNG NHẬN → CERT 58 / FULL 73; gap
   #97?→#98? = 7.099 s CHƯA chứng nhận (T2-141)**; **probe #60
   CHƯA CHẠY trên boot mới** (T2 đã đóng cờ — việc T2 đợt 141
   hoặc T10 phân xử); G1 chờ user quyết; ci-security.yml vẫn
   403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
   KHÔNG push khi user chưa nhắn "push đi"; R9 (a) vẫn chờ user
   (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng, cả 2 boot). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 2 lần cho 2 boot (`6b0874ba…` →
  `271fbe03…` → `5bd00bf7…`, header + say, KHÔNG đổi logic —
  xem §3.4).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-140 probe #59
  ok=2 fail=0). WFS scan #46 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1); T2 quét độc
  lập khớp hoàn toàn (xem §7.4).
- Postboot boot 1: PASS exit 0 ngay poll0 (17:39Z) + poll0b
  (17:40Z); cờ ghi 17:40:19Z, T4 đã đọc poll #1. Postboot boot 2:
  FAIL exit 1 lúc 17:55:01Z (replay chết yểu) → watcher TRIGGER
  §8.2(B) form B poll 9 → verify 5/5 → **--repair: 1 lần
  (18:05:45Z, PASS ~18:15:30Z)** → watcher ghi cờ mới 18:17:07Z
  poll 22; T4 đã đọc từ poll #29. **Watcher: CÓ lập (boot 2,
  v6, 22 poll). Luật (C): KHÔNG kích hoạt** (xem §3.2).
- Headroom: 1840 (mở) → 1838 (cuối).
- RAM phiên T5: boot 1 (n=15, bị cắt): 737.604–1.181.516 kB
  (Balloon 5.136.712–6.166.872 kB); boot 2 (n=40):
  490.928–2.292.968 kB (Balloon 4.547.464–6.443.824 kB, ghim
  trần 15 mẫu). RAM lúc đóng 523.020 kB (18:36:56Z, balloon ở
  đúng trần kẹt).
- **Reboot GIỮA LƯỢT: 1 lần** (sự kiện #22, af558fb5 →
  90392aa5, btime mới 17:52:56Z).
- **started_at lượt 140:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: CÓ reboot giữa lượt trong phiên T5
  nên giả thuyết viết lại (đã kiểm chứng 8 lần ở các đợt
  trước) DỰ BÁO started_at CÓ THỂ bị viết lại trong phiên T5 —
  T10 kiểm lại lúc đóng (T5 ghi rõ đây là dự báo từ giả thuyết,
  không phải kết quả kiểm).

## 11. Sai số của T5 đợt này (F-140-T5-N)

- **F-140-T5-1 — GAP 805s trong replay boot 1 không rõ nguyên
  nhân (MỚI):** dpkg.log im 15:55:19–16:08:44Z giữa 2 dòng
  startup configure và install thật; apt history Start-Date đầu
  tiên 16:08:44Z, 0 lần apt-get update; term.log mọi hoạt động
  16:08:44–16:11:16Z; journal chỉ có housekeeping systemd.
  T5 ghi nhận mà không kết luận nguyên nhân (có thể host-side).
  **Hậu quả:** không ảnh hưởng số liệu kỹ thuật nào (bracket
  1545/221/462 đầy đủ, postboot PASS) — chỉ ảnh hưởng mốc
  thời gian wall-clock (boot +16m39s là chậm nhất trong 3
  replay đầy đủ, nhưng cài thật chỉ 2m32s). Bài học: bracket
  replay nên tách "cài thật" khỏi "wall-clock" khi có GAP.
- **F-140-T5-2 — Lệch đồng hồ quanh reboot (MỚI,
  ĐÃ ĐƯỢC T4 XÁC MINH ĐỘC LẬP F-140-T4-1 VỀ HƯỚNG LỆCH):** mốc
  hoạt động cuối boot 1 theo đồng hồ cũ (sampler 17:53:19Z,
  chain T4 17:53:26Z) nằm SAU btime boot 2 17:52:56Z (chi tiết
  §3.3). **Đính chính từ T2-140:** T2 đo F98? ≈ −1 s (3 server
  đồng nhất +1 s) và caveat khung #96? "đồng hồ cũ chạy nhanh
  +5 s chắc chắn / +25 s có thể" — nên ước lượng ~+30–35 s của
  T5 chỉ là **cận trên thô** từ hiệu mốc cuối boot cũ trừ btime
  mới, KHÔNG phải số đo chính xác; số chính xác chờ T2-141/T10.
  **Hậu quả:** không ảnh hưởng số liệu kỹ thuật nào (boot_id
  khớp từng boot; replay/postboot/WFS đều đo trên boot đúng) —
  chỉ ảnh hưởng mốc thời gian và cửa chết của boot 1 (T4 ghi cửa
  chết theo quan sát (17:53:26Z, 17:54:22Z]). T5 lấy 17:52:56Z
  làm chuẩn boot 2 và ghi rõ mâu thuẫn thay vì lặp lại một mốc
  duy nhất. **Bài học:** btime kernel sau reboot không được lấy
  làm chuẩn tuyệt đối khi mốc cuối boot cũ mâu thuẫn — luôn đối
  chiếu last-activity của boot cũ + mốc phát hiện reboot của
  T4 + số đo NTP của T2 (cùng lớp lỗi với F-139-T5-1: brief ghi
  btime sai — bài học "đối chiếu, đừng tin một nguồn" vẫn đúng
  ở dạng khác).
- **F-140-T5-3 — Cache apt KHÔNG sống qua reboot lần này
  (MỚI, phá giả định đứng):** boot 1 cache 178 .deb / 156M;
  boot 2 cache **0 .deb / 0 byte** (chỉ còn lock + partial
  trống, mtime partial 13:57Z từ boot cũ). Giả định "cache
  RV-backed sống qua reboot" (ghi trong replay payload + LIMITS
  các đợt trước) SAI trong trường hợp này. **Hậu quả:** replay
  boot 2 không thể cài từ cache (một phần lý do nó chết yểu —
  nhưng T5 không kết luận đây là nguyên nhân duy nhất: replay
  chết sau khi đã chạy được 1 lệnh install, journal không ghi
  lỗi); repair phải tải lại từ network (181 dòng `Get:`,
  update mất ~9 phút). Bài học: T5 đợt sau kiểm cache ngay
  lúc mở boot mới, trước khi kết luận replay "sẽ nhanh vì
  cache".
- **F-140-T5-4 — (ghi chú) pgrep os-intent đọc 2 trong lúc
  verify 5/5:** lần đọc đầu `pgrep -f 'os[-]intent'` trả 2
  trong khi watcher 9 poll đều wrapper=0; kiểm lại live ngay
  sau đó trả 0. Nguyên nhân có lẽ tự khớp mẫu của shell kiểm
  (exec session) — không phải replay sống lại. T5 ghi rõ để
  khỏi đọc thành "replay còn 2 proc lúc verify" (điều kiện (2)
  của 5/5 được xác nhận bằng 2 phương pháp độc lập: watcher
  9 poll + kiểm lại live 0).
- **F-140-T5-5 — (ghi chú) Sampler boot 1 chỉ 15/40 mẫu
  (reboot cắt):** series 17:39:19–17:53:19Z + mẫu cuối trùng
  thời điểm reboot; RAM lúc đóng boot 1 không đo được (T5 bị
  restart theo reboot) — dùng sampler2 của boot 2 làm series
  chính (40/40). (Cùng lưu ý: script quét WFS của T2 lúc T5
  kiểm 17:42Z vẫn trỏ OUT về round139-t2 — T2 đã TỰ SỬA trước
  khi chạy scan #46 của mình 17:50:03Z; T5 không đụng file
  của luồng khác.)
- **F-140-T5-6 — (ghi chú, không phải lỗi T5) Boot 2 ở trạng
  thái repair-1-phần (795/113):** xem §9 mục 5 — T5 ghi rõ để
  khỏi đọc thành "replay boot 2 đã hoàn tất" (như #95? từng bị
  đọc nhầm ở đợt 139 §3.3). Postboot PASS ≠ replay đầy đủ.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND140_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  header + dòng `say` cho 2 boot; md5 cuối `5bd00bf7…`;
  không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round140-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (15 mẫu boot 1,
  bị reboot cắt) + ram-sampler.sh, ram-sampler-boot90392aa5.log
  (40 mẫu boot 2) + ram-sampler-boot90392aa5.sh,
  ram-sampler.nohup.log, ram-sampler-boot90392aa5.nohup.log,
  ram-end.txt, headroom-open.txt (1840), headroom-end.txt (1838),
  apt-lists.txt (boot 1, 39 dòng), apt-lists-boot90392aa5.txt
  (boot 2, 75 dòng), scan-wfs-t5.sh (bản copy — OUT đã sửa
  ĐÚNG round140-t5 TRƯỚC khi chạy, xem §7.3),
  scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
  wfs-r7b.txt, files-copies.txt, wfs-copies.txt — 7 file kết quả
  scan #46, t5-postboot-poll0.log (boot 1 PASS exit 0),
  t5-postboot-poll0b.log (boot 1 PASS exit 0 sau sửa header),
  t5-postboot-boot90392aa5-poll0.log (boot 2 FAIL exit 1),
  t5-postboot-boot90392aa5-poll0b.log (boot 2 PASS exit 0 sau
  sửa header lần 2), t5-wait-replay-boot90392aa5.sh (watcher v6)
  + t5-wait-replay-boot90392aa5.log (22 poll, TRIGGER poll 9,
  FLAG_WRITTEN poll 22) + t5-postboot-boot90392aa5-poll{1..22}.log,
  t5-verify-b-trigger.log (verify 5/5, 18:05:06Z),
  t5-repair-boot90392aa5.log (--repair 1 lần, PASS),
  REPAIR_TRIGGERED, `POSTBOOT_PASS` (cờ gate-visible — boot
  90392aa5, ghi 18:17:07Z poll 22; T4 đã đọc từ poll #29),
  `POSTBOOT_PASS.stale-af558fb5` (cờ boot 1 đã archive)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round140-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round140-t5.done` (ghi rõ: boot 1
  af558fb5 replay XONG (1545/221/462, boot +16m39s, GAP 805s)
  trước khi T5 mở, postboot PASS poll0, cờ 17:40:19Z, T4 mở cửa
  yên #17 poll #10; REBOOT GIỮA LƯỢT #22 → boot 2 90392aa5
  replay CHẾT YỂU (dpkg 2 dòng, cache 0 .deb) → watcher TRIGGER
  §8.2(B) form B poll 9 → verify 5/5 → --repair 1 lần PASS
  (795/113, GST symlink) → cờ mới 18:17:07Z poll 22; lệch đồng
  hồ quanh reboot (F-140-T5-2; T2-140: ~+35s của T5 chỉ là cận
  trên thô, F98? ≈ −1s); mù #59 ĐÃ ĐÓNG HOÀN TOÀN, mù #60 MỚI MỞ;
  cây 530e10a7 không đổi; headroom 1840→1838 (chỉ còn ~38 trên
  ngưỡng báo — T10 BÁO PARENT); WFS #46 chênh 0; probe #59 ok=2
  fail=0, KHÔNG có probe #60 trên boot mới; balloon ghim trần
  15 mẫu).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Quét WFS (ĐỌC OUT TRƯỚC KHI CHẠY — xem F-138-T5-1):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round140-t5/scan-wfs-t5.sh
# Kiểm async .writeFile stray:
grep -rn --include='*.js' --include='*.ts' --include='*.mjs' --include='*.cjs' '\.writeFile(' ~/workspace/repo-1/apps ~/workspace/repo-1/packages | grep -v '/dist/'
```
