# PHASE9_ROUND143_T5_INFRA_LIMITS — BOOT 70a5b0fc REPLAY CHẾT DẠNG (B) LẦN 4 (dpkg 2 dòng, cache 0 .deb, GST dir ABSENT) → §8.2(B) form B TRIGGER=YES (verify 5/5, silent 2825 s) → --repair LẦN 1 FAIL apt update TIMEOUT 1500 s (mirror chậm) → --repair LẦN 2 PASS (~4 phút, 795/113) → postboot PASS poll1+poll2, cờ 03:16:42Z poll=2, T4 đọc poll #47 + O8 WebKit FAIL đợt 142: TRẠNG THÁI BOOT LÚC O8 LÀ KHÔNG KHỎE (postboot FAIL) — NGHI PHẠM HÀNG ĐẦU NHƯNG CHƯA CHỨNG MINH LÀ NGUYÊN NHÂN (chờ T8 chạy lại S1 sau repair)

> Luồng T5, đợt 143, lượt cron 09:35 +07 19/11/2026 (mở 02:35:51Z;
> T5 mở thực tế 02:40:26Z, t5-start 02:42:42Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **1 BOOT trong phiên T5: 70a5b0fc** (btime 01:55:25Z — **KHỚP
> brief**; boot #104? TẠM theo T2-142, chờ T2-143 chứng nhận bằng
> merged mù #62).
> Boot 70a5b0fc: replay **CHẾT DẠNG (B)** — dpkg.log **2 dòng /
> 0 installs** (mtime 01:55:55Z = boot +30s, im 2825 s lúc verify);
> cache apt **0 .deb**, lists **5**, GST dir **ABSENT**,
> /var/log/apt **ABSENT**; postboot FAIL exit 1 poll0 (02:42Z);
> **§8.2(B) form B TRIGGER=YES** (verify độc lập 5/5, 02:43:00Z);
> **--repair lần 1 (02:43:36Z) FAIL** — apt-get update **TIMEOUT
> 1500 s** (mirror chậm, partial 117 file / 457M, 63 dòng `Get:`,
> log đứng ở Get:60 từ ~02:52Z), exit 1 lúc 03:08:37Z, 0 gói được
> cài, dpkg vẫn 2 dòng (chỉ GST symlink đã vá lại → debroot 269
> file); **--repair lần 2 (03:09:59Z, ngoại lệ once-only có lý do —
> xem F-143-T5-1) PASS exit 0 lúc 03:13:53Z (~3m54s)** — update OK
> (tiếp tục từ partial), cài đủ 11 gói, **RE-CHECK toàn PASS,
> dpkg 795/113/230** (gói cuối libc-bin 03:13:52Z — **Y HỆT bracket
> repair đợt 140 boot 2 + đợt 142 boot 1: 795/113**); cache 110 .deb
> / 57M; lists 75; postboot **PASS kiểm độc lập poll1 + poll2
> (exit 0)**; cờ `POSTBOOT_PASS` ghi **03:16:42Z poll=2**; T4 đã
> đọc ở **poll #47 (03:17:08Z)** và đang chờ gate A (RAM ~500 MB).
> **ĐIỀU TRA O8 WebKit FAIL (nhiệm vụ ưu tiên, quyết parent đợt
> 142 (b)): TRẠNG THÁI BOOT LÚC O8 CHẠY (02:02–02:04Z) ĐÃ ĐƯỢC
> CHỨNG MINH LÀ KHÔNG KHỎE** — replay đã chết từ boot +30s, postboot
> FAIL (thiếu 5 lib + GST + 11 gói apt), O8 WebKit chạy trên boot
> chưa từng qua gate. **NHƯNG chưa chứng minh trạng thái boot gây
> FAIL**: WebKit vẫn launch được + S0 pass không cần libs; S1 chết
> dạng evaluate-null rồi Target crashed (phân tích §3.7); RAM lúc O8
> KHÔNG CÓ SỐ ĐO (không sampler nào phủ 02:02Z); Chromium pass
> không phân biệt được (bundle libs riêng). **Phép thử quyết định
> là T8 chạy lại S1/O8 sau repair — T8 CHƯA CHẠY lúc T5 viết
> (03:24:46Z, o8-webkit/ trống).** **Phiên bản gstreamer1.0-tools
> 1.24.2-1.1ubuntu2 (T9-142): KHÔNG TỒN TẠI trong bất kỳ source nào
> đã cấu hình** (madison chỉ có 1ubuntu0.2 / 1ubuntu0.1 / 1) —
> gần như chắc chắn T9 ghi nhầm từ fontconfig 2.15.0-1.1ubuntu2
> (có thật, cùng log replay) — **khác biệt phiên bản KHÔNG CÓ THẬT,
> không liên quan tới O8 FAIL** (xem §3.6). **Headroom mở 1498 →
> cuối 1494** (vẫn DƯỚI ngưỡng báo ~1.800, chỉ theo dõi).
> **Balloon GHIM ĐÚNG trần kẹt 6.443.824 kB 7 mẫu** (6 mẫu liên tiếp
> cuối series) — chuỗi đóng băng tiếp tục. **RAM max trong phiên
> 2.814,7 MiB = 45,8% guard — không có cửa sổ birefnet.**
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production**
> (preview.tsx giữ 530e10a7). **KHÔNG tự chạy birefnet** (thuộc T9).
> KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 70a5b0fc REPLAY CHẾT DẠNG (B) LẦN THỨ 4** (sau #76?
   đợt 129, 90392aa5 đợt 140, bde599df đợt 142 — 4 lần trong 15 đợt
   gần nhất; xen giữa đợt 141 replay chạy tốt). dpkg.log **2 dòng /
   0 installs / 0 configure** (md5 `be665035…`, mtime
   01:55:55.108Z, đóng băng từ boot +30s); 0 proc apt/dpkg/wrapper
   (kiểm sạch); cache apt **0 .deb / 0 byte** (chết qua reboot lần
   thứ 3 — sau đợt 140 boot 2, đợt 142 boot 1); lists **5** (chỉ
   cli.github.com InRelease + Packages + auxfiles/lock/partial);
   partial/ **0 file lúc mở**; GST hệ thống **KHÔNG TỒN TẠI**;
   /var/log/apt **KHÔNG TỒN TẠI**. Bracket replay: **KHÔNG CÓ** —
   replay không tới trong 45+ phút (từ boot 01:55:25Z tới lúc T5 mở
   02:40:26Z).
2. **§8.2(B) FORM B TRIGGER=YES — LUẬT (C) KHÔNG ĐỦ.** Verify độc
   lập **5/5** 02:43:00Z (log `t5-verify-b-trigger.log`): (1)
   postboot FAIL tươi exit 1 (poll0 02:42Z); (2) apt-get=0, apt=0,
   dpkg=0, os-intent=0 (kiểm sạch — lần đọc `pgrep -f os-intent`
   đầu ra 1 do tự khớp mẫu shell, xem F-143-T5-3) + lock dpkg
   KHÔNG TỒN TẠI (file `/var/lib/dpkg/lock-frontend` vắng — fuser
   exit 2, xem F-143-T5-2); (3) dpkg im **2825 s ≥ 600** (mtime
   01:55:55Z); (4) form B: dpkg 2 dòng / 0 installs / GST dir
   absent / lists 5 / cache 0; (5) MiniBrowser 0 (pgrep -x).
   **Luật (C) KHÔNG đủ:** (d) form (C) đòi lists ≤3 nhưng lists =
   5; (b) không có apt sống để kẹt. Trigger vận hành là
   **§8.2(B) form B, không phải luật (C)** — lần thứ 4 (B) kích
   hoạt.
3. **--REPAIR LẦN 1 (02:43:36Z) FAIL — apt-get update TIMEOUT
   1500 s.** GST symlink lại → debroot (269 file, 02:43Z);
   `apt-get update` chạy 25 phút không xong (timeout 1500 s của
   script giết lúc ~03:08:37Z); partial/ 117 file / 457M, log
   `/tmp/l8-postboot-apt.log` 63 dòng `Get:`, **đứng ở Get:60
   (noble-security restricted Packages) từ ~02:52Z** — mirror
   (mirror.cogentco.com + azure.archive.ubuntu.com) tải các file
   lists lớn (universe Packages 73 MB, Translation-en 32 MB)
   quá chậm; script báo `REPAIR-FAIL apt update TIMEOUT 1500s`
   và **KHÔNG install mù** (đúng thiết kế); exit 1; **0 gói được
   cài, dpkg vẫn 2 dòng, cache 0, lists 5**. Đây là lần đầu
   --repair FAIL vì timeout update (các lần trước: đợt 129 ~15p,
   đợt 140 boot 2 ~10p, đợt 142 ~2p — đều PASS).
4. **--REPAIR LẦN 2 (03:09:59Z) PASS exit 0 lúc 03:13:53Z
   (~3m54s) — NGOẠI LỆ ONCE-ONLY CÓ LÝ DO (xem F-143-T5-1).**
   Update OK ngay (tiếp tục từ partial 457M đã tải); cài đủ 11
   gói; **RE-CHECK wrapper / libs / GST / apt toàn PASS**; KẾT
   LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. **KHÔNG chạy repair lần 3**
   (quy tắc tự đặt trong lần 2 — nếu lần 2 cũng FAIL thì báo boot
   không khỏe, không thử tiếp). Cờ `REPAIR_TRIGGERED` ghi cả 2
   lần (attempt=1 FAIL-timeout + attempt=2 PASS).
5. **TRẠNG THÁI SAU REPAIR (đóng băng, repair-1-phần, KHÔNG phải
   replay đầy đủ):** dpkg.log **795 dòng / 113 installs / 230
   configure**, md5 (sau repair2) xem §3.5, mtime 03:13:52Z
   (gói cuối libc-bin), 0 proc; lists **75**; cache **110 .deb /
   57M**; GST vẫn là **symlink → debroot** (269 file — postboot
   PASS vì đi qua symlink thấy đủ plugin). Số liệu **Y HỆT
   repair đợt 140 boot 2 (795/113) và đợt 142 boot 1 (795/113)** —
   repair 1 phần cho cùng 11 gói + deps cho ra cùng bracket (lần
   thứ 3 liên tiếp).
6. **CỜ POSTBOOT_PASS ghi 03:16:42Z poll=2**
   (`boot_id=70a5b0fc-… btime=2026-11-19T01:55:25Z pass_at=
   2026-11-19T03:16:42Z poll=2 repair=143-t5/--repair2-03:09:59Z
   dpkg=795/113`) — T4 đã đọc ở **poll #47 (03:17:08Z**, ~26 s
   sau khi ghi; t5flag=PASS(t5src=143-t5/POSTBOOT_PASS),
   postboot_exit=0, dpkg_lines=795) và đang **chờ gate A** (RAM
   503–565 MB ở poll #47–#57 — DƯỚI gate ≥1024 MB; việc của T4).
   Lưu ý: poll #44–#46 của T4 (03:14:53–03:16:23Z) còn đọc cờ
   STALE đợt 142 (t5src=142-t5/POSTBOOT_PASS, postboot_exit=1
   rồi 0 theo pb_age) vì cờ mới chưa ghi — poller T4 tự validate
   boot_id nên không tính PASS giả; đã được thay bằng cờ mới từ
   poll #47.
7. **ĐIỀU TRA O8 WebKit FAIL — KẾT LUẬN ĐIỀU TRA (§3.7):**
   (a) Boot lúc O8 (02:02–02:04Z) **ĐÃ CHẾT REPLAY từ boot +30s**,
   postboot FAIL — O8 chạy trên boot chưa từng qua gate; đây là
   **nghi phạm hàng đầu, nhưng CHƯA ĐƯỢC CHỨNG MINH là nguyên
   nhân**. (b) Chữ ký lỗi (S1 evaluate-null → "không đo được
   rect" + `page.setInputFiles: Target crashed` ngay sau đó)
   phù hợp với renderer đã chết/sắp chết lúc S1, nhưng WebKit
   vẫn launch + S0 pass không cần libs — thiếu libs không giải
   thích được việc S0 chạy tốt rồi chết đột ngột ở S1. (c) RAM
   lúc O8 **KHÔNG CÓ SỐ ĐO** (sampler T9 dài kết thúc 01:35:32Z,
   trước reboot #29; không sampler nào phủ 02:02Z) — không loại
   trừ được áp lực RAM (avail lúc T5 mở 02:40Z chỉ 463 MB).
   (d) Chromium 21/21 trên cùng boot **không phân biệt được**
   (Chromium bundle libs riêng, không dùng libs replay).
   (e) **Phép thử quyết định: T8 chạy lại S1/O8 sau repair —
   CHƯA CHẠY lúc T5 viết (03:24:46Z).** Nếu pass sau repair →
   trạng thái boot là nguyên nhân khả dĩ; nếu FAIL y hệt với
   đủ libs → lỗi trang/proxy-toggle hoặc renderer, độc lập với
   libs. (f) **Phiên bản gstreamer 1.1ubuntu2 KHÔNG CÓ THẬT**
   (xem §3.6) — loại khỏi danh sách nghi phạm.
8. **HEADROOM inotify MỞ 1498 → CUỐI 1494** (trần 63747) — giảm
   −116 so với mở đợt 142 (1614) và −99 so với cuối đợt 142
   (1593); chuỗi dài hạn ~100–115/đợt giữ nguyên. **Vẫn DƯỚI
   ngưỡng báo user (< ~1.800)** — theo quyết parent đợt 141 (đã
   BÁO USER trong báo cáo đợt 141), đợt này **chỉ theo dõi,
   không báo riêng**. Giảm −4 trong phiên (1498 → 1494).
   Inotify fd cell-visible 391 (lúc mở, như đợt 142 — không đo
   lại lúc đóng).
9. **RAM SAMPLER — 1 SERIES ĐẦY ĐỦ n=40 (02:43:36–03:22:37Z +
   DONE 03:23:37Z), xem §5.** Avail 464.660–2.882.268 kB (mean
   1.061.730), balloon 3.897.504–6.443.824 kB (mean 5.768.854),
   gate A 16/40, max **45,8% guard**, 0 mẫu ≥ 6.144 MiB.
   **Balloon GHIM ĐÚNG trần kẹt 6.443.824 kB 7 mẫu** (03:13:36Z
   + 6 mẫu liên tiếp 03:16:37–03:21:37Z) — chuỗi đóng băng tiếp
   tục (đợt 142: balloon boot 1 cũng ghim trần 1 mẫu; T9 đếm số
   đợt đóng băng trong aggregate). **Không có cửa sổ guard nào
   — không ai thử birefnet.**
10. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
    **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng);
    postboot script sửa 1 lần (`efb83d5d…` → **`9db78cbe…`**,
    chỉ header, KHÔNG đổi logic — xem §3.4).
11. **EPERM (T2-143, T5 chỉ đối chiếu): probe #62 ok=2 fail=0,
    boot=70a5b0fc, 02:49:42Z**; mù #62 MỚI MỞ (T2-142 — việc
    T2/T10); **WFS scan #49: chênh 0** — NEWSTD 963/270, R7b
    988/287, copies 25/17; delta +10/+3 giải thích trọn vẹn
    bằng 3 file docs đợt 142 (xem §7.3). **Async `.writeFile(`:
    đúng 2 helper đã biết, 0 stray.**
12. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
13. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 1 boot, không reboot trong phiên T5

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 70a5b0fc (#104? TẠM — chờ T2-143 chứng nhận bằng merged mù #62) | 01:55:25 (uptime -s; /proc/1 01:55:36; journal first entry — không kiểm, xem §8) | còn sống (lúc T5 viết ~1h29' tuổi) | Replay CHẾT dạng (B) (dpkg 2 dòng từ 01:55:55Z); §8.2(B) form B TRIGGER=YES (verify 5/5, 02:43:00Z); --repair lần 1 02:43:36Z FAIL update TIMEOUT 1500s; --repair lần 2 03:09:59Z PASS 03:13:53Z (795/113); cờ POSTBOOT_PASS 03:16:42Z poll=2; T4 đọc poll #47, đang chờ gate A; T8 chưa chạy lại S1 |

- **Btime boot KHỚP brief** (01:55:25Z, 4 nguồn: /proc/stat btime
  1795053325, uptime -s, stat /proc/1 01:55:36Z (+11 s, mẫu như
  mọi boot), who -b 01:55).
- **KHÔNG có reboot trong phiên T5** (boot_id 70a5b0fc từ lúc mở
  02:40:26Z tới lúc đóng 03:24Z; uptime 1h29' lúc đóng).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 143** do
  parent tạo — KHÔNG phải đợt main-chat (tiền lệ đợt 130–142).
  T5 tiến hành bình thường.
- journalctl --list-boots: T5 KHÔNG kiểm đợt này (không cần cho
  kết luận; journal boot trước đã mất theo rootfs rebuild như
  mọi reboot — tiền lệ).
- Reboot #29 (9afdaa89 → 70a5b0fc, btime 01:55:25Z) xảy ra TRONG
  LÚC T10-142 ĐÓNG SỔ (sau kiểm cuối của T10-142 ~01:56Z — theo
  aggregate đợt 142 §10.1); T5-142 đã đóng trước reboot này nên
  chưa từng kiểm boot 70a5b0fc — chính là khoảng trống mà quyết
  parent (b) giao đợt 143 lấp.

## 3. dpkg replay — boot 70a5b0fc CHẾT DẠNG (B) → repair lần 1 TIMEOUT → repair lần 2 PASS; điều tra O8

### 3.1 Replay boot 70a5b0fc — chết yểu, không tới trong 45+ phút

| Hạng mục | Lúc mở (02:40–02:43Z) | Sau repair lần 1 (03:08Z) | Sau repair lần 2 (03:13–03:16Z) |
|---|---|---|---|
| dpkg.log dòng | 2 | 2 | 795 |
| `status installed` | 0 | 0 | 113 |
| dòng chứa `configure` | 2 | 2 | 230 |
| dpkg.log md5 | `be665035…` | `be665035…` | `04552bbc…` (đo lúc viết LIMITS 03:25Z; mtime vẫn 03:13:52Z nên đây chính là md5 sau repair2) |
| dpkg.log mtime | 01:55:55Z | 01:55:55Z | 03:13:52Z |
| startup configure đầu | 01:55:54Z (boot +29s) | như vậy | như vậy |
| cài thật | KHÔNG CÓ | KHÔNG CÓ | 03:10–03:13:52Z (repair lần 2, gói cuối libc-bin) |
| cache apt | 0 .deb / 0 byte | 0 .deb / 0 byte | 110 .deb / 57M |
| lists / partial | 5 / 0 | 5 / 117 file (457M) | 75 / 0 (listing đầy đủ lưu apt-lists.txt) |
| GST hệ thống / debroot | KHÔNG TỒN TẠI / 269 | SYMLINK → debroot / 269 | SYMLINK → debroot / 269 |
| /var/log/apt | KHÔNG TỒN TẠI | (đã tạo — apt-get update lần 1) | có |
| proc apt/dpkg/wrapper | 0 | 0 (sau timeout) | 0 |
| postboot check | FAIL exit 1 (poll0 02:42Z) | FAIL exit 1 (repair exit 1) | PASS exit 0 (poll1 + poll2 + poll0b) |

- **Dạng (B) thuần:** dpkg.log chỉ 2 dòng "startup packages
  configure" lúc 01:55:54–55Z rồi im hoàn toàn tới lúc T5 mở
  (02:40:26Z, im 2691 s) và tới lúc verify (02:43:00Z, im 2825 s)
  — giống hệt mẫu #60? (đợt 120), #69? (đợt 125), #76? (đợt 129),
  #77? (đợt 130), 90392aa5 (đợt 140 boot 2), bde599df (đợt 142
  boot 1). **KHÔNG có GAP** kiểu đợt 140 boot 1 (GAP là im giữa
  configure và install trong khi replay còn sống — ở đây replay
  KHÔNG BAO GIỜ tới install).
- **Cache CHẾT qua reboot lần thứ 3** (sau đợt 140 boot 2: 0 .deb;
  đợt 142 boot 1: 0 .deb): boot này cache 0 .deb / 0 byte lúc mở
  (F-141-T5-4 giữ nguyên: sống/không sống là KHÔNG NHẤT QUÁN —
  178 .deb đợt 141 vs 0 .deb đợt 142/143; không rút quy luật,
  không giả định trước).
- **Lists 5** lúc mở (chỉ cli.github.com InRelease + Packages;
  apt history KHÔNG TỒN TẠI — apt-get update chưa từng chạy trong
  boot này trước repair lần 1).
- **KHÔNG có watcher 60-phút:** silent đã 2691 s lúc T5 mở (vượt
  xa ngưỡng 600 s), verify 5/5 đủ điều kiện ngay — chờ thêm 60
  phút nữa chỉ để xác nhận điều đã rõ là lãng phí lượt yên của T4
  (tiền lệ: đợt 140 boot 2 trigger ở poll 9 khi silent 614 s;
  đợt 129/130/142 cũng trigger khi silent vừa qua 600 s).

### 3.2 Verify độc lập §8.2(B) 5/5 (02:43:00Z, log `t5-verify-b-trigger.log`)

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | postboot FAIL tươi | FAIL exit 1 (poll0 02:42Z) ✓ |
| 2a | 0 proc apt/dpkg/wrapper | apt-get=0, apt=0, dpkg=0, os-intent=0 (kiểm sạch — lần đọc `pgrep -f os-intent` đầu ra 1 do tự khớp mẫu shell, xem F-143-T5-3); lock dpkg KHÔNG TỒN TẠI (file `/var/lib/dpkg/lock-frontend` vắng — fuser exit 2, xem F-143-T5-2) ✓ |
| 2b/3 | dpkg đóng băng + silent ≥600 s | mtime 01:55:55Z, silent **2825 s** ✓ |
| 4 | form B (dpkg ≤5 dòng + 0 installs + FAIL) | dpkg 2 dòng / 0 installs / GST dir ABSENT / lists 5 / cache 0 ✓ |
| 5 | MiniBrowser 0 (không có probe WebKit đang chạy) | pgrep -x MiniBrowser = 0; vite-dev 3 proc (của các luồng khác — không cản repair, chỉ MiniBrowser mới cản) ✓ |

- **Luật (C) KHÔNG đủ:** (a) FAIL ✓ nhưng (b) không có apt sống
  để kẹt, (c) silent 2825 s ≥ 900 s ✓, **(d) form (C) KHÔNG
  (lists 5 > 3)**, (e) no-probe ✓. Nên trigger vận hành là
  **§8.2(B) form B, không phải luật (C)**.
- **§8.2(B) kích hoạt lần thứ 4** (lần 1: #76? đợt 129, lần 2:
  90392aa5 đợt 140, lần 3: bde599df đợt 142, lần 4: 70a5b0fc đợt
  143).

### 3.3 --repair lần 1 (02:43:36Z) FAIL — apt-get update TIMEOUT 1500 s (log `t5-repair-boot70a5b0fc.log`)

- Wrapper PASS (K1 còn nguyên, không cần vá lại).
- GST symlink lại → debroot (269 file, 02:43Z).
- apt FAIL 11 gói → `apt-get update` (INFO "lists có thể trống…")
  **CHẠY 25 PHÚT KHÔNG XONG** — `timeout 1500` giết lúc
  ~03:08:37Z; script báo `REPAIR-FAIL apt update TIMEOUT 1500s
  (mirror chậm/treo — xem /tmp/l8-postboot-apt.log)` + `KHÔNG
  install mù khi lists chưa về`; exit 1.
- Tiến độ update lúc bị giết: partial/ **117 file / 457M**,
  `/tmp/l8-postboot-apt.log` **63 dòng `Get:`**, **đứng ở Get:60
  (noble-security restricted amd64 Packages [1792 kB]) từ ~02:52Z**
  — không thêm dòng `Get:` nào trong 16 phút cuối. Các file lists
  lớn (noble universe binary-amd64 Packages 73 MB, universe
  Translation-en 32 MB, .xz 15 MB) đã về partial nhưng update
  chưa xong — mirror (cogentco.com + azure.archive.ubuntu.com)
  tải chậm bất thường so với đợt 142 (update OK trong ~1 phút).
  **Đây là lần đầu --repair FAIL vì timeout update** (tiền lệ
  chậm nhất trước đây: đợt 140 boot 2 ~10 phút, đợt 129 ~15 phút
  — đều PASS trong timeout).
- Hậu quả: **0 gói được cài, dpkg vẫn 2 dòng, cache 0, lists 5**;
  chỉ GST symlink đã vá (RE-CHECK GST PASS, còn libs/apt vẫn
  FAIL). Cờ `REPAIR_TRIGGERED` ghi attempt=1 FAIL-timeout.
- **KHÔNG chạy repair lần 2 ngay trong cùng lệnh** — T5 dừng lại,
  kiểm trạng thái (lock rảnh, 0 proc, partial 457M đã tải) rồi mới
  quyết lần 2 (xem §3.4 + F-143-T5-1).

### 3.4 --repair lần 2 (03:09:59Z) PASS — ngoại lệ once-only có lý do (log `t5-repair2-boot70a5b0fc.log`)

- **Lý do chạy lần 2 (ghi rõ để parent xét):** (a) lần 1 FAIL vì
  **TIMEOUT MẠNG** (mirror chậm), không phải vì boot hỏng hay
  repair sai — nguyên nhân ngoài boot; (b) script tự kết luận
  `CHUA DU — chạy lại với --repair, hoặc chờ apt replay xong rồi
  chạy lại` — tức chính script mời chạy lại; (c) partial/ đã có
  **457M lists** nên lần 2 chỉ cần tải phần còn thiếu, dự kiến
  xong nhanh (thực tế ~4 phút); (d) KHÔNG có repair thì boot
  không khỏe → T4 không mở được lượt yên #19, T8 không chạy lại
  được S1/O8 — cả đợt 143 kẹt ở infra. **Quy tắc tự đặt: KHÔNG
  chạy lần 3** — nếu lần 2 cũng FAIL thì báo boot không khỏe và
  giao parent quyết (không thử tiếp).
- Kết quả lần 2: `apt-get update` **OK** (~4 phút tổng từ
  03:09:59Z tới dpkg mtime 03:13:52Z); cài đủ 11 gói
  (`REPAIRED apt: đã cài: libevent-2.1-7t64
  gstreamer1.0-plugins-base … libevdev2`); **RE-CHECK wrapper /
  libs / GST / apt toàn PASS ~03:13Z**; KẾT LUẬN: ĐỦ ĐIỀU KIỆN
  chạy WebKit. Exit 0 lúc 03:13:53Z.
- Cờ `REPAIR_TRIGGERED` ghi thêm attempt=2 PASS (update OK ~4p,
  dpkg 795/113/230, cache 110 .deb/57M, lists 75).

### 3.5 Trạng thái sau repair lần 2 (đóng băng, repair-1-phần, KHÔNG phải replay đầy đủ)

| Hạng mục | Sau repair lần 2 (03:13–03:16Z) |
|---|---|
| dpkg.log dòng | 795 |
| `status installed` | 113 |
| dòng chứa `configure` | 230 |
| dpkg.log mtime | 03:13:52.903Z (gói cuối libc-bin) |
| cache apt | 110 .deb / 57M |
| lists / partial | 75 / 0 (listing lưu apt-lists.txt) |
| GST hệ thống / debroot | SYMLINK → debroot / 269 |
| proc apt/dpkg/wrapper | 0 |
| postboot check | PASS exit 0 (poll1 03:14Z + poll2 03:15:42Z + poll0b 03:18Z sau sửa header) |

- Số liệu **Y HỆT repair đợt 140 boot 2 (795/113) và đợt 142
  boot 1 (795/113)** — repair 1 phần cho cùng 11 gói + deps cho
  ra cùng bracket, lần thứ 3 liên tiếp. (md5 dpkg.log sau repair2
  đã bổ sung lúc viết LIMITS: `04552bbc…`, đo 03:25Z khi mtime vẫn
  03:13:52Z — xem F-143-T5-4.)
- **CỜ POSTBOOT_PASS ghi 03:16:42Z poll=2** (poll1 + poll2 đều
  PASS exit 0, dpkg đóng băng 795/113, 0 proc — ổn định 2 poll
  như tiêu chuẩn watcher v6 đợt 142). T4 đọc cờ mới ở **poll #47
  (03:17:08Z)** và đang chờ gate A (RAM 503–565 MB ở poll
  #47–#57 — DƯỚI gate ≥1024 MB; việc của T4).

### 3.6 Phiên bản gstreamer1.0-tools — "1.24.2-1.1ubuntu2" KHÔNG CÓ THẬT

Nhiệm vụ đối chiếu của brief: log replay boot 9afdaa89 (T9-142)
ghi gói cuối `gstreamer1.0-tools:amd64 1.24.2-1.1ubuntu2`, khác
`1ubuntu0.1` đợt 140/141. T5-143 kiểm:

| Nguồn kiểm | Kết quả |
|---|---|
| `apt-cache madison gstreamer1.0-tools` (cả 2 mirror: azure + cogentco) | Chỉ 3 version: **1.24.2-1ubuntu0.2** (noble-security), **1.24.2-1ubuntu0.1** (noble-updates), **1.24.2-1** (noble/main). **KHÔNG có 1.24.2-1.1ubuntu2 ở bất kỳ pocket nào** |
| `apt-cache policy` (đầy đủ) | Đồng thuận với madison; không dòng nào chứa `1.1ubuntu2` cho gói này |
| `dpkg -l` sau repair2 | gstreamer1.0-tools **KHÔNG được cài** (không nằm trong NEED 11 gói); libgstreamer1.0-0 đã cài **1.24.2-1ubuntu0.2** (noble-security, mới nhất); plugins-base 1.24.2-1ubuntu0.7 |
| debroot changelog (`tmp-q6r3-debroot/usr/share/doc/gstreamer1.0-tools/changelog.Debian.gz`) | Top entry: `gstreamer1.0 (1.24.2-1ubuntu0.1) noble-security` — debroot được build từ **1ubuntu0.1** |
| `apt-cache madison fontconfig` | **fontconfig 2.15.0-1.1ubuntu2 CÓ THẬT** (noble/main, cả 2 mirror) — và T9-142 §187 ghi trong cùng log replay lúc 23:56:39Z: `status installed fontconfig:amd64 2.15.0-1.1ubuntu2` (replay đang chạy) |
| Hồ sơ T9 các đợt trước | Đợt 140 + 141: gói cuối replay đều là gstreamer1.0-tools **1.24.2-1ubuntu0.1** (T9 ghi 2 lần, nhất quán) |

- **Kết luận: "1.1ubuntu2" cho gstreamer1.0-tools gần như chắc
  chắn là T9 ghi nhầm** — hậu tố version của fontconfig
  (2.15.0-**1.1ubuntu2**, xuất hiện trong cùng log replay chỉ
  ~2 phút trước dòng gói cuối) bị gắn nhầm sang gstreamer.
  Version thật trong replay 9afdaa89 là 1ubuntu0.1 (như đợt
  140/141) hoặc 1ubuntu0.2 (nếu mirror security đã lên 0.2 trước
  23:58Z 18/11 — không phân biệt được vì dpkg.log boot đó đã mất
  theo rootfs rebuild; cả hai đều là version hợp lệ của noble).
  **Không có khác biệt phiên bản nào để đối chiếu — thread này
  ĐÓNG, không liên quan tới O8 FAIL.** (T5 không sửa LIMITS T9-142;
  chỉ ghi kết luận đối chiếu ở đây để parent/T10 biết khi đóng sổ.)
- Bổ sung: gstreamer1.0-tools là gói **CLI tools, KHÔNG nằm trong
  NEED 11 gói WebKit** và không phải lib runtime — dù version có
  khác thì cũng không ảnh hưởng WebKit. T4 attempt1 lượt yên #18
  đã chạy **WebKit 20/20 PASS trên boot 9afdaa89** (với bất kỳ
  version nào replay đã cài) — version đó không phá WebKit.

### 3.7 Điều tra O8 WebKit FAIL đợt 142 — boot không khỏe là nghi phạm hàng đầu, CHƯA CHỨNG MINH

**Bằng chứng đã thu thập (toàn bộ từ log trên đĩa + đo trực tiếp):**

| # | Bằng chứng | Nguồn |
|---|---|---|
| 1 | O8 WebKit attempt1 02:02:24–02:02:34Z, attempt2 02:03:16–02:04:14Z, boot 70a5b0fc (~7 phút tuổi), exit=2 cả hai | aggregate đợt 142 §9.3 + `round142-t10/t10-o8-attempt1.log` + `t10-o8-attempt2.log` |
| 2 | S0 PASS cả hai attempt (WebKit 27.2 launch OK, mẫu tự load 3 clip, media image file=true) — browser chạy được, trang load được | cùng log, 02:02:33.392Z / 02:04:13.443Z |
| 3 | S1 FAIL cả hai attempt, giống hệt: `toggle={"ok":false,"method":"mouse","detail":"không đo được rect checkbox tự tạo proxy"}` — 16 ms sau S0 ở attempt1 (02:02:33.392Z → 02:02:33.408Z) | cùng log |
| 4 | Ngay sau S1 FAIL: `page.setInputFiles: Target crashed` khi đang `waiting for locator('.mediabin input[type=\'file\']')`, harness lỗi tại `clicktest-87o8-mask-track-webkit.mjs:534` | cùng log |
| 5 | O8 Chromium 21/21 exit 0 cả hai attempt, cùng boot, cùng cây 530e10a7; S1 Chromium PASS (CDP mouse click lần 2) | cùng log + aggregate §9.3 |
| 6 | **Boot lúc O8: replay đã CHẾT từ boot +30s** (dpkg.log mtime 01:55:55Z, 2 dòng, không đổi tới lúc T5 mở 02:40Z); cache 0, lists 5, GST absent, /var/log/apt absent — **postboot FAIL** (thiếu 5 lib + GST + 11 gói apt, poll0 02:42Z chứng minh trạng thái này vẫn đúng sau O8; không có apt/dpkg proc nào chạy giữa 02:04Z và 02:40Z để thay đổi trạng thái) | đo trực tiếp T5-143 §3.1 + mtime dpkg.log |
| 7 | RAM lúc O8 (02:02–02:04Z): **KHÔNG CÓ SỐ ĐO** — sampler dài T9-142 kết thúc 01:35:32Z (trước reboot #29); không sampler nào phủ 02:02Z | `round142-t9/ram-sampler-long-2.log` (103 dòng, SAMPLER END 01:35:32Z) |
| 8 | Balloon boot TRƯỚC (9afdaa89) GHIM ĐÚNG trần 6.443.824 kB liên tục 01:00:30–01:34:32Z (sampler T9); avail lúc T5 mở boot này (02:40Z) chỉ 463 MB | sampler T9-142 + `free -m` T5-143 |
| 9 | Cơ chế S1 (đọc code harness): `toggleCheckboxTo(false)` → `evalJs(AUTO_UI_FN)`; nếu null → `clickRect(rectFn)` → `evalJs(rectFn).catch(() => null)` → null thì FAIL "không đo được rect". `getBoundingClientRect()` trên checkbox ẩn vẫn trả object (kể cả 0x0) — nên rectFn chỉ trả null khi **label/checkbox vắng khỏi DOM HOẶC `page.evaluate` ném lỗi** (target đã chết). `clickRect` không phân biệt 2 trường hợp này. | `clicktest-87o8-mask-track-webkit.mjs:95–103, 350–356, 410–430, 528–531` |

**Phân tích:**

- **Ủng hộ "trạng thái boot gây FAIL":** O8 WebKit chạy trên boot
  chưa từng qua gate postboot (replay chết, thiếu toàn bộ libs
  hệ thống mà WebKit dùng: libevent, libEGL, libavif, libdw,
  libevdev + GST). Trong 19 đợt FULL PASS liên tiếp (123–141),
  không đợt nào O8 WebKit chạy trên boot postboot-FAIL (các boot
  đó đều có replay xong hoặc repair-passed trước O8). Chữ ký
  "evaluate-null rồi Target crashed ngay sau" phù hợp với renderer
  đã chết/sắp chết lúc S1 — thiếu libEGL/libavif có thể làm mất
  ổn định đường render/media của WebKitGTK.
- **Chống lại / chưa giải thích được:** (a) WebKit launch OK,
  version 27.2 báo đúng, S0 load media xong — nếu thiếu libs là
  nguyên nhân trực tiếp thì S0 (cũng evaluate + load media) phải
  chết trước; S1 chết đột ngột chỉ 16 ms sau S0 là lạ. (b) S1 là
  thao tác DOM (checkbox "Tự tạo proxy") — không liên quan trực
  tiếp tới libs hệ thống; nếu label vắng khỏi DOM vì trang render
  khác trên WebKit thì đó là lỗi trang, không phải lỗi boot.
  (c) RAM lúc O8 không đo được — áp lực RAM (balloon ghim trần
  trên boot trước + avail thấp lúc T5 mở) là giả thuyết cạnh tranh
  chưa loại trừ được. (d) Chromium pass không phân biệt được
  (bundle libs riêng).
- **KẾT LUẬN ĐIỀU TRA (T5): trạng thái boot không khỏe lúc O8 là
  SỰ THẬT ĐÃ CHỨNG MINH và là NGHI PHẠM HÀNG ĐẦU — nhưng KHÔNG
  ĐƯỢC KẾT LUẬN là nguyên nhân gây FAIL.** Phép thử quyết định là
  T8 chạy lại S1/O8 trên boot ĐÃ REPAIR (đủ libs, postboot PASS):
  pass → trạng thái boot là nguyên nhân khả dĩ (mạnh); FAIL y hệt
  với đủ libs → lỗi trang/proxy-toggle hoặc renderer, độc lập với
  libs. **T8 CHƯA CHẠY phép thử này lúc T5 viết (03:24:46Z,
  `round143-t8/o8-webkit/` trống)** — giao T8 tiếp tục, T5 không
  tự chạy O8 (không thuộc brief T5, và vite phải qua lock).
  Parent đã quyết (b) đợt 142: KHÔNG coi là "lỗi môi trường boot
  mới" rồi bỏ qua — T5 đã điều tra thật và ghi rõ ranh giới bằng
  chứng ở trên.

### 3.8 Postboot script — sửa 1 lần (header, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`efb83d5d…` (cuối đợt 142) → **`9db78cbe…`**:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 03:18Z | 70a5b0fc | `efb83d5d…` → `9db78cbe…` | header (đoạn Dot 143: btime KHỚP brief, O8 FAIL đợt 142, replay CHẾT dạng (B) lần 4, §8.2(B) form B TRIGGER=YES, --repair lần 1 FAIL update TIMEOUT 1500s, lần 2 PASS 795/113, cờ 03:16:42Z poll=2, headroom mở 1498) — KHÔNG đổi logic, KHÔNG đổi NEED/threshold |

- `bash -n` OK sau khi sửa. Check-only chạy lại sau sửa (poll0b)
  **exit 0** — cùng kết quả như trước sửa, chứng minh sửa header
  không ảnh hưởng logic.
- Lưu ý: dòng `say` header dài — T5 viết đúng số liệu đã đo
  (silent 2825 s, dpkg 795/113, cờ 03:16:42Z poll=2) trước khi
  chạy poll0b; không lặp lại F-142-T5-1 (ghi "ước" rồi sửa sau).

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng + postboot script

| File | Lúc mở 02:40Z | Lúc viết | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | efb83d5d… | 9db78cbe… (sau sửa lần 1) | chỉ header, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này. T4-143 cũng độc lập ghi tree=YES:md5=
  530e10a7 ở mọi poll (#44–#57).
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 series ĐẦY ĐỦ, n=40 (02:43:36–03:22:37Z + DONE 03:23:37Z)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup, đường
> dẫn tuyệt đối (script copy từ round142-t5, OUT đã sửa
> round143-t5 TRƯỚC khi chạy — kiểm bằng grep, không lặp lại
> F-138-T5-1).

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 02:43:36 | 1.444.800 | 5.291.148 | 4,20 |
| 2 | 02:44:36 | 1.329.464 | 5.455.684 | 3,29 |
| 3 | 02:45:36 | 1.178.884 | 5.605.364 | 2,76 |
| 4 | 02:46:36 | 1.334.732 | 5.307.652 | 3,60 |
| 5 | 02:47:36 | 1.702.024 | 5.020.500 | 2,60 |
| 6 | 02:48:36 | 1.840.844 | 4.683.936 | 2,30 |
| 7 | 02:49:36 | **2.882.268** | **3.897.504** | 2,68 |
| 8 | 02:50:36 | 2.549.156 | 4.198.376 | 1,18 |
| 9 | 02:51:36 | 2.288.756 | 4.471.348 | 0,47 |
| 10 | 02:52:36 | 2.067.908 | 4.722.800 | 0,29 |
| 11 | 02:53:36 | 1.801.792 | 4.952.768 | 0,31 |
| 12 | 02:54:36 | 1.590.364 | 5.159.300 | 0,54 |
| 13 | 02:55:36 | 1.373.952 | 5.345.008 | 0,43 |
| 14 | 02:56:36 | 1.353.080 | 5.522.020 | 0,41 |
| 15 | 02:57:36 | 1.221.284 | 5.673.684 | 0,64 |
| 16 | 02:58:36 | 1.013.676 | 5.823.060 | 0,37 |
| 17 | 02:59:36 | 635.044 | 5.956.532 | 0,87 |
| 18 | 03:00:36 | 813.296 | 6.075.960 | 0,59 |
| 19 | 03:01:36 | 602.568 | 6.184.612 | 0,26 |
| 20 | 03:02:36 | 564.168 | 6.280.420 | 0,46 |
| 21 | 03:03:36 | 748.496 | 6.152.292 | 0,65 |
| 22 | 03:04:36 | 643.740 | 6.252.728 | 0,67 |
| 23 | 03:05:36 | 999.152 | 5.703.780 | 1,30 |
| 24 | 03:06:36 | 1.103.732 | 5.798.872 | 1,43 |
| 25 | 03:07:36 | 957.668 | 5.928.808 | 1,09 |
| 26 | 03:08:36 | 806.216 | 6.050.556 | 0,40 |
| 27 | 03:09:36 | 696.424 | 6.161.400 | 0,28 |
| 28 | 03:10:36 | 636.852 | 6.259.828 | 0,25 |
| 29 | 03:11:36 | 530.548 | 6.350.820 | 0,19 |
| 30 | 03:12:36 | 479.988 | 6.429.388 | 0,54 |
| 31 | 03:13:36 | **464.660** | **6.443.824** | 0,38 |
| 32 | 03:14:37 | 630.548 | 6.279.548 | 0,42 |
| 33 | 03:15:37 | 547.780 | 6.371.872 | 0,22 |
| 34 | 03:16:37 | 504.876 | **6.443.824** | 0,13 |
| 35 | 03:17:37 | 480.752 | **6.443.824** | 0,64 |
| 36 | 03:18:37 | 485.728 | **6.443.824** | 0,47 |
| 37 | 03:19:37 | 498.300 | **6.443.824** | 0,29 |
| 38 | 03:20:37 | 486.092 | **6.443.824** | 0,23 |
| 39 | 03:21:37 | 551.140 | **6.443.824** | 0,78 |
| 40 | 03:22:37 | 628.460 | 6.279.836 | 0,69 |

- Thống kê (tính bằng code trên 40 mẫu, đối chiếu trực tiếp từng
  dòng log — bài học F-142-T5-5 đã áp dụng: bảng trên chép từ
  `ram-sampler.log`, không viết từ trí nhớ): min avail **464.660
  kB lúc 03:13:36Z**; max **2.882.268 kB lúc 02:49:36Z = 2.814,7
  MiB = 45,8% guard**; trung bình 1.061.730 kB; Balloon min
  **3.897.504 kB lúc 02:49:36Z**, max **6.443.824 kB = ĐÚNG trần
  kẹt** (7 mẫu: 03:13:36Z + 6 mẫu liên tiếp 03:16:37–03:21:37Z),
  trung bình 5.768.854 kB. **0 mẫu ≥ 6.144 MiB.** Gate A
  (≥1.048.576 kB): **16/40 mẫu**. Load1 0,13–4,20.
- **Hình dạng: XẢ LỚN đầu series rồi phình đơn điệu lên trần và
  GHIM.** Balloon từ 5,29M (02:43:36Z) **xả ~1,39M kB** xuống min
  3,90M lúc 02:49:36Z (avail đỉnh series 2,88M = 45,8% guard —
  trùng lúc T2-143 chạy probe #62, 02:49:42Z — tương quan, không
  kết luận nhân quả), rồi phình lại đơn điệu ~+150–200k kB/phút
  (xen kẽ 2 lần xả nhỏ ~130–330k kB lúc 03:03:36Z và 03:05:36Z)
  lên sát trần, **GHIM ĐÚNG trần 6.443.824 kB 6 mẫu liên tiếp
  03:16:37–03:21:37Z** (cộng 03:13:36Z = 7 mẫu ghim trần trong
  series), rồi xả nhẹ ~164k kB ở mẫu cuối (03:22:37Z). Lúc đóng
  (03:23:15Z, ngoài series): avail **537.716 kB**, balloon
  **6.343.200 kB**.
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy song
  song — nếu cửa sổ guard mở sau khi T5 đóng (03:23Z), T9 là luồng
  bắt được theo quyết §12.3(d) đợt 138. Trong phiên T5, đỉnh cao
  nhất chỉ 45,8% guard — **không có cửa sổ nào, không ai thử
  birefnet**. u2net vẫn là fallback chính thức.
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f) đợt 137). Birefnet vẫn 0 lần chạy thành công
  trong gói (tính tới lúc T5 đóng).
- **Lưu ý cho điều tra O8:** series này bắt đầu 02:43:36Z — SAU
  O8 (02:02–02:04Z) 41 phút. Không có mẫu nào phủ thời điểm O8;
  avail 463 MB lúc T5 mở (02:40Z, `free -m`) là mốc gần nhất
  nhưng KHÔNG phải lúc O8 — T5 không suy diễn RAM lúc O8 từ số
  này.

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747) — VẪN DƯỚI NGƯỠNG BÁO

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 136 cuối (T5) | 2276 | boot 1ca1feaa |
| Đợt 137 mở boot 1 / mở boot 2 / cuối (T5) | 2178 / 2168 / 2168 | boot 2104246b / 17db9652 |
| Đợt 138 mở / mở boot 2 / cuối (T5) | 2065 / 2058 / 2056 | boot #94? / 914964c3 |
| Đợt 139 mở (T5) / cuối (T5) | 1950 / 1948 | boot 541524e2 |
| Đợt 140 mở (T5) / cuối (T5) | 1840 / 1838 | boot af558fb5 / 90392aa5 |
| Đợt 141 mở (T5, 20:41:59Z) / cuối (T5, 21:22:16Z) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| **Đợt 143 mở (T5, 02:42:42Z)** | **1498** | **boot 70a5b0fc, headroom-open.txt** |
| **Đợt 143 cuối (T5, 03:23:15Z)** | **1494** | **boot 70a5b0fc, headroom-end.txt** |

- Giảm −116 so với mở đợt 142 (1614 → 1498) và −99 so với cuối
  đợt 142 (1593 → 1494); chuỗi dài hạn tiếp tục giảm đều
  (~100–115/đợt, 13 đợt gần nhất). **Vẫn DƯỚI ngưỡng báo user
  (< ~1.800)** — theo quyết parent đợt 141 (đã BÁO USER trong báo
  cáo đợt 141), đợt này **chỉ theo dõi, không báo riêng, không
  tự đổi gì**.
- Giảm −4 trong phiên (1498 → 1494).
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **391 (lúc mở)** — như đợt 142 (391 → 811 lúc đóng);
  T5 không đo lại lúc đóng đợt này (ghi nhận thiếu, xem
  F-143-T5-4 — không ảnh hưởng kết luận headroom vì probe K8 đã
  đo trực tiếp).

### 6.2 Disk

- Overlay `/`: T5 KHÔNG đo lại đợt này (tiền lệ đợt 142: 7,5G
  tổng, 7,0G trống; không có ENOSPC nào trong phiên ngoài ENOSPC
  inotify có chủ đích của probe K8 — errno 28 khi hết watch, đó
  là cách đo headroom, không phải lỗi disk). Ghi nhận thiếu đo
  disk ở F-143-T5-4.
- `/tmp` tmpfs: không đo đợt này (xem F-143-T5-4).
- Partial apt 457M lúc repair lần 1 đã được dọn khi update lần 2
  xong (lists 75, partial 0 sau repair2 — theo bảng §3.1).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock).

## 7. EPERM scan + WFS #49 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #62 (T2-143): ok=2 fail=0, boot=70a5b0fc, 02:49:42Z**
  (`eperm-probe-v2.log`: dòng `boot changed bde599df ->
  70a5b0fc` + dòng probe #62; T2 đã mở mù #62 — việc T2/T10).
  Trước probe, status DEAD (heartbeat #61 age 11.027 s — đúng,
  heartbeat từ probe #61 trên boot cũ bde599df; death được ghi
  vào log kèm dòng `boot changed`, không phải im lặng).
  Probe #62 là probe đầu tiên trên boot 70a5b0fc.
- **Mù #62 MỚI MỞ (T2-142)** — việc T2/T10 phân xử tiếp; T5 chỉ
  ghi nhận, không tự chạy probe chéo để không đếm trùng sóng.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 03:18Z — log dừng ở probe #62).
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #61→#62
  (bde599df→70a5b0fc, age 11.027 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–142).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #49 (T5 chạy, 03:16:48–03:17:18Z, 30 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round143-t5, **đổi OUT round142-t5 → round143-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round143-t5, không
  còn tham chiếu round cũ nào trong script; grep `round142` sau
  sed = 0). Kết quả:
  - NEWSTD: **963 dòng / 270 file** (phạm vi 3.190 file);
  - R7b đối chiếu: **988 dòng / 287 file** (phạm vi 12.583 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43–48.
  - Đối chiếu chéo: 963+25=988=R7b, **chênh 0**.
- **+10 dòng / +3 file so với lần 48 (T5)** (953/267 → 963/270),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #48
  còn nguyên trong round142-t5/):
  | Phạm vi | #48 (T5, 23:48:37Z) | #49 (T5, 03:16:48Z) | Delta |
  |---|---|---|---|
  | NEWSTD scope | 3.180 | 3.190 | +10 file, 0 file mất |
  | NEWSTD | 953/267 | 963/270 | +10/+3 |
  | R7b | 978/284 | 988/287 | +10/+3 |
  | copies | 25/17 | 25/17 | 0 |
  - 10 file mới trong scope = đúng 10 file `docs/` đợt 142
    (aggregate + T1/T2/T4/T5/T6/T7/T8/T9/T10 LIMITS); 0 file mất.
    Trong 10 file mới, chỉ 3 file có hit: T2-142 +7, T5-142 +2,
    aggregate-142 +1 (= +10); 7 file còn lại 0 hit. Diff
    wfs-newstd.txt #48→#49 chỉ ra đúng 3 dòng thêm, không file
    nào đổi số hit, không file nào mất hit.
- **Kết luận: 49 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #62.

### 7.4 Đối chiếu chéo T2 vs T5 (scan #49 — chờ T2-143)

- T2-143 chưa chạy scan đối chiếu lúc T5 viết (T5 viết trước khi
  T2 xong — tiền lệ đợt 142: đối chiếu sau, bổ sung ở aggregate).
  T5-143 scan #49 đứng một mình với chênh 0 nội bộ (963+25=988).

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
  để né EPERM trong mù #62.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–142). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **ĐIỀU TRA O8 WebKit FAIL CHƯA ĐÓNG:** T5 đã chứng minh boot
   lúc O8 không khỏe (replay chết dạng (B), postboot FAIL) và
   loại phiên bản gstreamer khỏi danh sách nghi phạm — nhưng
   **phép thử quyết định (T8 chạy lại S1/O8 sau repair) CHƯA
   CHẠY lúc T5 viết (03:24:46Z)**. Nếu T8 pass sau repair →
   trạng thái boot là nguyên nhân khả dĩ; nếu FAIL y hệt với đủ
   libs → lỗi trang/proxy-toggle hoặc renderer. Chuỗi WebKit FULL
   PASS 19 đợt (123–141) đã đứt ở đợt 142 — đếm lại từ 0 nếu đợt
   143 pass (quyết parent (b) đợt 142).
2. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max avail 2.814,7 MiB = 45,8% guard lúc
   02:49:36Z; balloon GHIM ĐÚNG trần kẹt 7 mẫu, xem §5). T9
   sampler dài là luồng bắt cửa sổ nếu có sau khi T5 đóng;
   guard 6.144 MiB GIỮ NGUYÊN (quyết §12.3(d) đợt 138). u2net là
   fallback chính thức.
3. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên
   #19 (T4) CHƯA MỞ lúc T5 viết (T4 đọc cờ mới poll #47 03:17:08Z,
   đang chờ gate A — RAM 503–565 MB ở poll #47–#57; việc của T4).
   P1 28/28, P3 24/28, P7 14/14 (cộng dồn giữ nguyên tới trước đợt
   này — T4 cập nhật); DEF v0.5 (P5 34–52 ms + P3' stall-based)
   đã chấp nhận, T3 viết ở đợt 138 — P3' vẫn chưa được kiểm lần
   nào.
4. **Headroom VẪN DƯỚI NGƯỠNG BÁO (1498 mở → 1494 cuối):**
   chỉ theo dõi, không báo riêng (quyết parent đợt 141 đã báo
   user). Đà ~100–115/đợt giữ nguyên.
5. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4 giữ nguyên):** đợt 141: 178 .deb (sống); đợt 142:
   0 .deb (chết); đợt 143: 0 .deb (chết). T5 đợt sau vẫn kiểm
   cache ngay lúc mở boot mới, không giả định trước.
6. **Replay CHẾT dạng (B) lần thứ 4 trong 15 đợt gần nhất**
   (#76? đợt 129, 90392aa5 đợt 140, bde599df đợt 142, 70a5b0fc
   đợt 143 — xen giữa đợt 141 replay chạy tốt): dạng (B) không
   còn là ngoại lệ hiếm. §8.2(B) form B đã kích hoạt đúng luật
   cả 4 lần. **MỚI đợt này: --repair lần 1 FAIL vì apt update
   TIMEOUT 1500 s (mirror chậm)** — lần đầu repair fail vì mạng;
   lần 2 PASS nhờ partial đã tải 457M. Không có thay đổi luật nào
   được đề xuất — chỉ ghi nhận tần suất + tiền lệ repair-2-lần
   khi lần 1 fail vì timeout mạng (xem F-143-T5-1).
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 142 §11: **mù
   #62 MỚI MỞ (T2-142)**; **gap #99?→#100? [7.079, 7.099] s +
   gap #101?→#102? [892, 912] s (CERT 62/FULL 77)**; **khung chết
   #99?/#100?/#101? ĐÃ XÁC NHẬN** (29 s / 58 s / 136 s); **boot
   bde599df = #102? TẠM (btime NẰM NGOÀI dải), 9afdaa89 = #103?
   TẠM, 70a5b0fc = #104? TẠM** (chờ T2-143 chứng nhận bằng merged
   mù #62); G1 chờ user quyết; ci-security.yml vẫn 403 chờ user;
   TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push khi
   user chưa nhắn "push đi"; R9 (a) vẫn chờ user (số đếm VẪN LÀ
   16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  viết). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần (`efb83d5d…` → `9db78cbe…`,
  header, KHÔNG đổi logic — xem §3.8).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-143 probe #62
  ok=2 fail=0). WFS scan #49 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1); đối chiếu T2
  chờ T2-143 xong (xem §7.4).
- Postboot boot 70a5b0fc: FAIL exit 1 poll0 (02:42Z) → §8.2(B)
  form B TRIGGER=YES (verify 5/5, 02:43:00Z) → --repair lần 1
  02:43:36Z FAIL update TIMEOUT 1500s (exit 1, 03:08:37Z, 0 gói)
  → --repair lần 2 03:09:59Z PASS (exit 0, 03:13:53Z, RE-CHECK
  toàn PASS, dpkg 795/113) → postboot PASS kiểm độc lập poll1 +
  poll2 (exit 0) + poll0b exit 0 sau sửa header; cờ ghi 03:16:42Z
  poll=2, T4 đã đọc poll #47, đang chờ gate A. **Watcher 60-phút:
  KHÔNG lập (silent đã 2691 s lúc mở, vượt xa ngưỡng 600 s — xem
  §3.1). Luật (C): KHÔNG đủ (lists 5 > 3, không có apt sống).**
- Điều tra O8: boot lúc O8 (02:02–02:04Z) **ĐÃ CHỨNG MINH không
  khỏe** (replay chết từ boot +30s, postboot FAIL); gstreamer
  1.1ubuntu2 **KHÔNG CÓ THẬT** (madison chỉ có 1ubuntu0.2 /
  1ubuntu0.1 / 1; gần như chắc T9 ghi nhầm từ fontconfig
  2.15.0-1.1ubuntu2); **T8 CHƯA chạy lại S1/O8 sau repair lúc
  T5 viết (03:24:46Z)** — phép thử quyết định còn chờ T8.
- Headroom: 1498 (mở) → **1494 (cuối)** — VẪN DƯỚI ngưỡng báo
  ~1.800, chỉ theo dõi.
- RAM phiên T5 (1 series ĐẦY ĐỦ n=40, xem §5): avail
  464.660–2.882.268 kB (mean 1.061.730), balloon
  3.897.504–6.443.824 kB (mean 5.768.854), gate A 16/40, max
  45,8% guard, 0 mẫu ở trần guard; **balloon GHIM ĐÚNG trần kẹt
  6.443.824 kB 7 mẫu** (6 mẫu liên tiếp cuối series). RAM lúc
  đóng 537.716 kB, balloon 6.343.200 kB.
- **KHÔNG có reboot trong phiên T5.**
- **started_at lượt 143:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: KHÔNG có reboot trong phiên T5 nên
  giả thuyết viết lại started_at KHÔNG áp dụng cho phiên này
  (không có sự kiện reboot nào để viết lại).

## 11. Sai số của T5 đợt này (F-143-T5-N)

- **F-143-T5-1 — (QUYẾT ĐỊNH CÓ GHI RÕ, KHÔNG PHẢI LỖI VÔ Ý)
  --repair lần 2 (ngoại lệ once-only):** brief + tiền lệ T5-142
  nói "chạy --repair 1 lần". Lần 1 (02:43:36Z) FAIL vì apt-get
  update TIMEOUT 1500 s (mirror chậm) — không phải vì boot hỏng.
  T5 chạy lần 2 (03:09:59Z) với 4 lý do ghi ở §3.4 (timeout mạng
  ngoài boot; script tự mời chạy lại; partial đã có 457M; không
  repair thì T4/T8 kẹt) + quy tắc tự đặt KHÔNG chạy lần 3. Lần 2
  PASS (~4 phút). **Hậu quả:** không có — boot khỏe, cờ đã ghi,
  T4 đã đọc. Parent xét xem ngoại lệ này có thành tiền lệ cho
  lần sau (repair fail vì timeout mạng → được chạy lại 1 lần)
  hay vẫn giữ once-only tuyệt đối.
- **F-143-T5-2 — (ghi chú) fuser exit=2 trong verify §8.2(B):**
  T5 ghi trong log verify "fuser exit=$? (1 = lock rảnh)" nhưng
  thực tế exit=2 vì **file `/var/lib/dpkg/lock-frontend` KHÔNG
  TỒN TẠI** (ls trước đó không in ra gì). Lock vắng còn mạnh hơn
  lock rảnh (không có lock để giữ) — điều kiện 2a vẫn đạt. **Hậu
  quả:** không ảnh hưởng quyết định nào (verify 5/5 dùng số kiểm
  sạch); chỉ là chú thích sai trong file log verify.
- **F-143-T5-3 — (ghi chú) 1 lần đọc proc đầu bị tự khớp mẫu shell
  (cùng bẫy F-140-T5-4 / F-142-T5-2):** `pgrep -f os-intent` ra 1
  — do dòng lệnh exec của chính T5 chứa chuỗi "os-intent"; kiểm
  sạch bằng `pgrep -x` / `ps` loại trừ = 0. **Hậu quả:** không
  ảnh hưởng quyết định nào (verify 5/5 dùng số kiểm sạch).
- **F-143-T5-4 — (ghi chú, ĐÃ KHẮC PHỤC PHẦN (a)) Thiếu 3 số đo
  nhỏ lúc đóng:** (a) T5 KHÔNG ghi md5 đầy đủ của dpkg.log ngay
  sau repair2 — **đã đo bù lúc viết LIMITS: `04552bbc…`
  (03:25Z, mtime vẫn 03:13:52Z nên chính là md5 sau repair2)**;
  (b) KHÔNG đo lại inotify fd cell-visible lúc đóng (chỉ có 391
  lúc mở); (c) KHÔNG đo disk `/` và `/tmp` đợt này. **Hậu quả:**
  không ảnh hưởng kết luận nào (headroom đo trực tiếp bằng probe
  K8; bracket định danh bằng counts+mtime+gói cuối+md5 bù; không
  có ENOSPC trong phiên). Bài học: checklist đóng (md5 dpkg + fd
  cell + disk) viết ra trước khi đóng, không dựa vào trí nhớ.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND143_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header; md5 cuối `9db78cbe…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round143-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (40 mẫu ĐẦY ĐỦ +
  DONE 03:23:37Z) + ram-sampler.sh, ram-sampler.nohup.log,
  ram-end.txt (avail 537.716 kB lúc đóng 03:23:15Z),
  headroom-open.txt (1498), headroom-end.txt (1494),
  k8-headroom-highcap.py (bản copy từ round142-t5),
  apt-lists.txt (75 dòng, sau repair2),
  scan-wfs-t5.sh (bản copy — OUT đã sửa ĐÚNG round143-t5 TRƯỚC khi
  chạy, xem §7.3), scan-meta.txt, files-newstd.bin, wfs-newstd.txt,
  files-r7b.bin, wfs-r7b.txt, files-copies.txt, wfs-copies.txt —
  7 file kết quả scan #49, scan-wfs-run.log,
  t5-postboot-poll0.log (FAIL exit 1, 02:42Z),
  t5-verify-b-trigger.log (verify 5/5 §8.2(B) form B, 02:43:00Z),
  t5-repair-boot70a5b0fc.log (--repair lần 1, FAIL update TIMEOUT
  1500s, exit 1, 03:08:37Z),
  t5-repair2-boot70a5b0fc.log (--repair lần 2, PASS exit 0,
  03:13:53Z, RE-CHECK toàn PASS),
  REPAIR_TRIGGERED (attempt=1 FAIL-timeout + attempt=2 PASS),
  t5-postboot-poll1.log (PASS exit 0, kiểm độc lập),
  t5-postboot-poll2.log (PASS exit 0, kiểm độc lập lần 2),
  t5-postboot-poll0b.log (PASS exit 0 sau sửa header),
  `POSTBOOT_PASS` (cờ gate-visible — boot 70a5b0fc, ghi 03:16:42Z
  poll=2; T4 đã đọc poll #47, đang chờ gate A)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round143-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round143-t5.done` (ghi rõ: boot 70a5b0fc
  replay CHẾT dạng (B) lần 4 (dpkg 2 dòng, cache 0, GST ABSENT),
  §8.2(B) form B TRIGGER=YES (verify 5/5, silent 2825s), --repair
  lần 1 FAIL update TIMEOUT 1500s (mirror chậm, partial 457M),
  lần 2 PASS ~4p (795/113, RE-CHECK toàn PASS); postboot PASS
  poll1+poll2+poll0b; cờ 03:16:42Z poll=2, T4 đọc poll #47 chờ
  gate A; ĐIỀU TRA O8: boot lúc O8 ĐÃ CHỨNG MINH không khỏe
  (postboot FAIL) nhưng CHƯA CHỨNG MINH gây FAIL — chờ T8 chạy
  lại S1 sau repair; gstreamer 1.1ubuntu2 KHÔNG CÓ THẬT (ghi nhầm
  từ fontconfig); headroom 1498→1494; balloon ghim trần 7 mẫu;
  RAM max 45,8% guard, 0 cửa sổ birefnet; WFS #49 chênh 0.
