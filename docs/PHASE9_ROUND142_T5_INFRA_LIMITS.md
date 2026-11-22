# PHASE9_ROUND142_T5_INFRA_LIMITS — 2 BOOT: bde599df replay CHẾT DẠNG (B) (dpkg 2 dòng, cache 0 .deb, GST dir ABSENT) → §8.2(B) form B TRIGGER=YES → --repair 1 lần PASS (795/113, ~2 phút) → REBOOT GIỮA LƯỢT #26 → boot 9afdaa89 replay XONG ĐẦY ĐỦ (1545/221/462, boot +4m27s) + T4 MỞ CỬA YÊN #18 poll #8

> Luồng T5, đợt 142, lượt cron 06:35 +07 19/11/2026 (mở 23:35:51Z 18/11;
> T5 mở thực tế 23:40:27Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **2 BOOT trong phiên T5 (boot 1 chết giữa lượt; có thể 1 boot
> trung gian b47f7932 chỉ quan sát 1 lần — xem F-142-T5-4).**
> Boot 1 **bde599df** (btime 22:48:05Z — **KHỚP brief**): replay
> **CHẾT DẠNG (B) "chạm mà không cài"** — dpkg.log CHỈ 2 dòng
> "startup packages configure" 22:48:39Z (boot +34s) rồi im hẳn, 0 proc
> apt/dpkg/wrapper, cache apt TRỐNG (0 .deb), lists 5, GST dir KHÔNG TỒN
> TẠI, /var/log/apt KHÔNG TỒN TẠI; postboot FAIL exit 1 poll0 (23:42Z);
> **§8.2(B) form B TRIGGER=YES** (verify độc lập 5/5 23:43:32Z, dpkg im
> 3293 s); **--repair 1 lần duy nhất 23:44:06Z → RE-CHECK toàn PASS**
> (apt-get update OK nhanh ~1 phút, cài đủ 11 gói, 180 dòng `Get:`);
> dpkg đóng băng **795 dòng / 113 installs / 230 configure** (mtime
> 23:46:02Z, gói cuối libc-bin — **Y HỆT boot 90392aa5 đợt 140:
> repair-1-phần, KHÔNG phải replay đầy đủ 1545/221/462**); GST là
> **SYMLINK → debroot** (269 file); cache 110 .deb / 57M; lists 75;
> postboot PASS kiểm độc lập poll1 exit 0 + poll0b sau sửa header exit 0;
> cờ POSTBOOT_PASS ghi **23:48:25Z poll=1**, T4 đã đọc ở **poll #9
> (23:48:39Z)** và đang chờ gate A (RAM chỉ 435–580 MB lúc đó).
> **REBOOT GIỮA LƯỢT #26** trong khung (23:53:55Z, 23:54:20Z]: boot 1
> chết trước khi lượt yên #18 mở; sampler RAM T5 boot 1 dừng ở mẫu
> 12/40 (23:53:40Z) + poller T4 chết theo (T4 đã tự khởi động lại
> poller). Boot 2 **9afdaa89** (btime 23:54:20Z): replay **CHẠY MẠNH
> VÀ XONG ĐẦY ĐỦ** — configure 23:54:56Z (boot +36s), cài xong
> 23:58:47Z (**boot +4m27s**, gói cuối gstreamer1.0-tools),
> **1545 dòng / 221 installs / 462 configure — TRUNG bracket đầy đủ**;
> GST hệ thống là thư mục THẬT (apt) 269/269; cache 178 .deb / 156M;
> lists 71; watcher v6 ghi cờ POSTBOOT_PASS mới **00:00:22Z poll=3**
> (PASS ổn định 2 poll); T4 đọc cờ mới ở poll #8 và **MỞ CỬA YÊN #18
> ở poll #8 (00:00:55Z, RAM 1170 MB) — attempt1 20/20 XONG, exit 0,
> 00:04:48Z** (tickCost median 50,0 ms — kết quả thuộc T4). **Headroom inotify mở 1614** (giảm từ 1720 cuối đợt 141
> — vẫn DƯỚI ngưỡng báo ~1.800, chỉ theo dõi, không báo riêng theo
> quyết parent đợt 141). **Balloon boot 1 SÁT trần kẹt** (max
> 6.443.824 kB = ĐÚNG trần, 1 mẫu; xem §5.1); **balloon boot 2 XẢ**
> (5,32M → 4,78M kB đầu series). RAM max trong phiên T5 tính tới lúc
> viết CHƯA tới guard — **không có cửa sổ birefnet**. **KHÔNG push.
> KHÔNG release/tag. KHÔNG sửa production** (preview.tsx giữ 530e10a7).
> **KHÔNG tự chạy birefnet** (thuộc T9 — T5 CHỈ quan sát + báo cáo).
> KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT bde599df REPLAY CHẾT DẠNG (B) — KHÔNG PHẢI KẸT CHẬM MÀ LÀ
   ĐÃ DỪNG HẲN.** dpkg.log **2 dòng / 0 installs / 0 configure**
   (md5 `05fca917…`, mtime 22:48:39.677Z, đóng băng từ boot +34s);
   0 proc apt/dpkg/wrapper (kiểm sạch, xem F-142-T5-2 về bẫy tự khớp
   mẫu); cache apt **0 .deb / 0 byte** (KHÔNG sống qua reboot lần
   này — lần thứ 2 cache chết, sau đợt 140 boot 2); lists **5**
   (chỉ cli.github.com InRelease + Packages + auxfiles/lock/partial);
   partial/ **0 file**; GST hệ thống **KHÔNG TỒN TẠI** (thư mục);
   /var/log/apt **KHÔNG TỒN TẠI**; term.log/history.log không có.
   Bracket replay: **KHÔNG CÓ** — replay không tới trong 52+ phút
   (từ boot 22:48:05Z tới lúc T5 mở 23:40:27Z).
2. **§8.2(B) FORM B TRIGGER=YES — LUẬT (C) KHÔNG ĐỦ.** Verify độc
   lập **5/5** 23:43:32Z (log `t5-verify-b-trigger.log`): (1) postboot
   FAIL tươi exit 1 (poll0 23:42Z + verify lại); (2) apt=0 apt-get=0
   dpkg=0 os-intent=0 (kiểm sạch) + lock dpkg rảnh; (3) dpkg im
   **3293 s ≥ 600** (mtime 22:48:39Z); (4) form B: dpkg 2 dòng /
   0 installs / GST dir absent / lists 5 / cache 0; (5) MiniBrowser
   0 (pgrep -x, kiểm sạch — lần đọc đầu ra 1–2 do tự khớp mẫu shell,
   xem F-142-T5-2). **Luật (C) KHÔNG đủ:** (d) form (C) đòi lists ≤3
   nhưng lists = 5; (b) không có apt sống để kẹt. Nên trigger vận
   hành là **§8.2(B) form B, không phải luật (C)** — lần thứ 3
   (B) kích hoạt (#76? đợt 129, 90392aa5 đợt 140, bde599df đợt 142).
3. **--REPAIR 1 LẦN DUY NHẤT (23:44:06Z, once-only) → PASS NHANH
   (~2 phút, nhanh nhất trong các lần repair).** GST symlink lại →
   debroot (269 file, 23:44Z); `apt-get update` OK nhanh (mirror
   khoẻ — khác đợt 140 boot 2 mất ~9 phút); cài đủ 11 gói (180 dòng
   `Get:` trong /tmp/l8-postboot-apt.log); **RE-CHECK wrapper/libs/
   GST/apt toàn PASS**; KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. **KHÔNG
   chạy repair lần 2, KHÔNG kill proc nào** (không có proc nào để
   kill). Cờ `REPAIR_TRIGGERED` ghi 23:44:06Z (form=B, verify=5/5,
   silent=3293s).
4. **TRẠNG THÁI SAU REPAIR (đóng băng, repair-1-phần, KHÔNG phải
   replay đầy đủ):** dpkg.log **795 dòng / 113 installs / 230
   configure**, md5 `793d322c…`, mtime 23:46:02Z (gói cuối
   libc-bin), 0 proc; lists **75**; cache **110 .deb / 57M**; GST
   vẫn là **symlink → debroot** (repair tạo symlink rồi apt install
   11 gói — plugin dir hệ thống vẫn là symlink, postboot PASS vì đi
   qua symlink thấy đủ plugin). Số liệu **Y HỆT boot 90392aa5 đợt
   140 (795/113)** và boot #95? (914964c3, đợt 138–139) — repair
   1 phần cho cùng 11 gói + deps cho ra cùng bracket.
5. **CỜ POSTBOOT_PASS ghi 23:48:25Z poll=1**
   (`boot_id=bde599df-… btime=2026-11-18T22:48:05Z pass_at=
   2026-11-18T23:48:25Z poll=1 repair=142-t5/--repair-23:44:06Z
   dpkg=795/113`) — T4 đã đọc ở **poll #9 (23:48:39Z**, ~14 s sau
   khi ghi; t5flag=PASS(t5src=142-t5/POSTBOOT_PASS), postboot_exit=0,
   dpkg_lines=795) và đang chờ gate A (RAM 580 MB poll #9, 435 MB
   poll #11 — DƯỚI gate ≥1024 MB; việc của T4). Lưu ý: poll #8 của
   T4 (23:47:54Z) còn đọc cờ STALE đợt 141 (t5src=141-t5/
   POSTBOOT_PASS, postboot_exit=1) vì cờ mới chưa ghi — đã được thay
   bằng cờ mới từ poll #9, không gây nhầm lẫn kéo dài. **Cờ boot 1 đã
   được watcher boot 2 archive thành `POSTBOOT_PASS.stale-bde599df`
   lúc 23:58:21Z (v5 fix đợt 131) — T4 poller tự validate boot_id
   trong cờ nên cờ stale cũng không gây PASS giả.**
6. **REBOOT GIỮA LƯỢT #26 — BOOT 1 CHẾT TRƯỚC KHI LƯỢT YÊN #18
   MỞ.** Boot bde599df chết trong khung **(23:53:55Z, 23:54:20Z]**
   (T4 poll #16 cuối 23:53:55Z còn sống; btime boot mới 23:54:20Z);
   sampler RAM T5 boot 1 dừng ở mẫu 12/40 (23:53:40Z) + poller T4
   chết theo (T4 đã tự khởi động lại poller — poll #2 mới 23:56:24Z
   trên boot 2); session exec/sleep của T5 bị service restart.
   **Có thể 1 boot trung gian b47f7932** (chỉ quan sát 1 lần lúc
   23:54:27Z theo đồng hồ có thể nhanh — xem F-142-T5-4; số thứ tự
   reboot #26/#27 chờ T6 đếm lại).
7. **BOOT 2 9afdaa89 REPLAY XONG ĐẦY ĐỦ, NHANH.** Bracket:
   **(startup configure 23:54:56Z = boot +36s, cài thật
   ~23:55–23:58:47Z, xong 23:58:47Z = boot +4m27s, 1545/221/462,
   gói cuối gstreamer1.0-tools)** — KHÔNG GAP; cache apt **SỐNG
   QUA REBOOT: 110 .deb lúc mở → 178 .deb / 156M sau replay**
   (replay tải thêm phần còn thiếu); lists **71**; GST hệ thống là
   thư mục **THẬT** (apt) 269/269; **postboot PASS ngay poll 1 của
   watcher (23:58:21Z)** + PASS ổn định 2 poll → cờ POSTBOOT_PASS
   mới ghi **00:00:22Z poll=3**; T4 đọc cờ mới ở **poll #8
   (00:00:55Z)** và **MỞ CỬA YÊN #18 ở poll #8 (RAM 1170 MB) —
   attempt1 20/20 XONG, exit 0, 00:04:48Z** (tickCost median 50,0 ms
   — kết quả thuộc T4). **KHÔNG cần --repair
   trên boot 2; luật (C) KHÔNG kích hoạt.**
8. **HEADROOM inotify MỞ 1614** (23:42:42Z, probe K8 STOP i=1614)
   — giảm −106 so với cuối đợt 141 (1720) và −123 so với mở đợt 141
   (1737); chuỗi dài hạn ~100–110/đợt giữ nguyên (12 đợt gần nhất).
   **Vẫn DƯỚI ngưỡng báo user (< ~1.800)** — theo quyết parent đợt
   141 (đã BÁO USER trong báo cáo đợt 141), đợt này **chỉ theo dõi,
   không báo riêng**. Giảm −21 trong phiên (1614 → 1593) và −127 so
   với cuối đợt 141 (1720). Inotify fd cell-visible 391 (lúc mở).
   Headroom cuối đợt: **1593** (00:38:59Z, boot 2) — xem §6.1.
9. **RAM SAMPLER — 2 SERIES (1 BỊ REBOOT CẮT, 1 ĐẦY ĐỦ n=40, xem
   §5).** Boot 1: n=12 (23:42:40–23:53:40Z), avail 463.096–
   1.151.664 kB (mean 753.768), balloon 5.776.148–6.443.824 kB
   (mean 6.166.946), gate A 1/12, max chỉ 18,3% guard, **balloon
   GHIM ĐÚNG trần kẹt 6.443.824 kB 1 mẫu**. Boot 2: đang chạy
   (mở 1.516.636 kB avail, balloon 5.321.464 kB — XẢ so với boot 1).
   Series boot 2 ĐẦY ĐỦ n=40: avail 859.388–3.043.680 kB (mean
   1.668.453), balloon 3.800.224–5.967.252 kB (mean 4.968.514),
   gate A 33/40, max 48,4% guard, 0 mẫu ở trần kẹt.
   **Không có cửa sổ guard nào trong cả 2 series — không ai thử
   birefnet.**
10. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
   **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng, cả 2 boot);
   postboot script sửa 1 lần (`1ebcb776…` → **`efb83d5d…`**,
   chỉ header + dòng `say`, KHÔNG đổi logic — xem §3.4).
9. **EPERM (T2-142, T5 chỉ đối chiếu): probe #61 ok=2 fail=0,
   boot=bde599df, 23:45:18Z**; mù #61 MỚI MỞ (T2-142 — việc T2/T10);
   **WFS scan #48: chênh 0** — NEWSTD 953/267, R7b 978/284,
   copies 25/17; delta +9/+3 giải thích trọn vẹn bằng 10 file docs
   mới (xem §7.3/§7.4). **Async `.writeFile(`: đúng 2 helper đã
   biết, 0 stray.**
12. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h).
13. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 2 boot (+ 1 boot trung gian có thể), reboot giữa lượt #26

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | bde599df (số thứ tự TAM — chờ T2/T6; boot trước 2c0efe57 #99? đã xác nhận) | 22:48:05 (uptime -s; /proc/1 22:48:16; journal first entry 22:48:17) | CHẾT giữa lượt (khung (23:53:55Z, 23:54:20Z]) | Replay CHẾT dạng (B) (dpkg 2 dòng từ 22:48:39Z); §8.2(B) form B TRIGGER=YES (verify 5/5, 23:43:32Z); --repair 1 lần 23:44:06Z PASS ~23:46:02Z (795/113); cờ POSTBOOT_PASS 23:48:25Z poll=1; T4 đọc poll #9 23:48:39Z, đang chờ gate A thì reboot giết poller + sampler |
| ? | b47f7932 (CHỈ QUAN SÁT 1 LẦN — xem F-142-T5-4) | KHÔNG RÕ (chỉ thấy boot_id lúc 23:54:27Z theo đồng hồ có thể nhanh) | CHẾT trước 23:55:20Z (sống <1 phút, như boot 52ca5d6d đợt 134) | Không kịp quan sát replay; số thứ tự chờ T6 đếm lại |
| 2 | 9afdaa89 (số thứ tự TAM — chờ T2/T6) | 23:54:20 (uptime -s; /proc/1 23:54:31; journal first entry 23:54:31) | còn sống (lúc T5 viết ~10' tuổi) | Replay XONG ĐẦY ĐỦ (1545/221/462, boot +4m27s); watcher v6 ghi cờ POSTBOOT_PASS 00:00:22Z poll=3; T4 MỞ CỬA YÊN #18 poll #8 00:00:55Z, attempt1 20/20 XONG 00:04:48Z |

- **Btime boot 1 KHỚP brief** (22:48:05Z, 5 nguồn: /proc/stat btime
  1795042085, uptime -s, stat /proc/1 22:48:16Z (+11 s, mẫu như
  mọi boot), who -b 22:48, journal first entry 22:48:17Z) — không
  lặp lại F-139-T5-1.
- **Btime boot 2: 23:54:20Z** (5 nguồn: /proc/stat btime
  1795046060, uptime -s, stat /proc/1 23:54:31Z (+11 s), who -b
  23:54, journal first entry 23:54:31Z).
- **LỆCH ĐỒNG HỒ QUANH REBOOT (F-142-T5-4):** mốc hoạt động cuối
  của boot 1 theo đồng hồ cũ (sampler 23:53:40Z, T4 poll #16
  23:53:55Z) và lần đọc boot_id b47f7932 lúc 23:54:27Z KHÔNG khớp
  trơn với btime boot 2 (23:54:20Z) — boot trung gian b47f7932
  được quan sát lúc 23:54:27Z, SAU btime boot 2 23:54:20Z, điều
  không thể xảy ra nếu cùng một đồng hồ. Cùng mẫu như F-140-T5-2
  (đồng hồ cũ chạy nhanh ~+35 s so với host): T5 lấy btime kernel
  23:54:20Z làm chuẩn cho boot 2, mọi mốc boot 1 giữ nguyên theo
  đồng hồ cũ và ghi rõ. Số thứ tự reboot (#26/#27) và khung chết
  chính xác của boot 1 chờ T6/T2 đếm lại.
- Boot trước 2c0efe57 (#99? — T2-141 đã xác nhận theo quy ước +
  merged mù #60 đóng; khung chết #98? XÁC NHẬN chuẩn mới merged
  (17:52:10Z, 17:52:56Z] (46 s); khung chết #97? XÁC NHẬN chuẩn mới
  merged (17:52:10Z, 17:52:56Z] — theo brief đợt 141/T2-141) chết
  TRƯỚC khi T5-142 mở (reboot #25 trong lúc T10-141 đóng sổ).
  **Mù #61 MỚI MỞ** (T2-142 — việc T2/T10 phân xử tiếp; T5 chỉ
  ghi nhận, không tự chạy probe chéo để không đếm trùng sóng).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 142** do
  parent tạo (23:35:51Z) — KHÔNG phải đợt main-chat (tiền lệ đợt
  130–141). T5 tiến hành bình thường.
- journalctl --list-boots trên boot 2 chỉ có **1 boot duy nhất**
  (9afdaa89, first entry 23:54:31Z) — journal boot 1 đã mất theo
  rootfs rebuild (như mọi reboot).

## 3. dpkg replay — boot 1 CHẾT DẠNG (B) → --repair 1 lần PASS; boot 2 XONG ĐẦY ĐỦ (1545/221/462, boot +4m27s)

### 3.1 Replay boot bde599df — chết yểu, không tới trong 52+ phút

| Hạng mục | Lúc mở (23:40–23:43Z) | Sau repair (23:46–23:48Z) |
|---|---|---|
| dpkg.log dòng | 2 | 795 |
| `status installed` | 0 | 113 |
| dòng chứa `configure` | 2 | 230 |
| action `configure` (cột 3) | 0 | — |
| action `install` (cột 3) | 0 | — |
| dòng `gstreamer` | 0 | — |
| dpkg.log md5 | `05fca917…` | `793d322c…` |
| dpkg.log mtime | 22:48:39.677Z | 23:46:02.746Z |
| startup configure đầu | 22:48:39Z (boot +34s) | như vậy |
| cài thật | KHÔNG CÓ | 23:44–23:46:02Z (repair, gói cuối libc-bin) |
| cache apt | 0 .deb / 0 byte | 110 .deb / 57M |
| lists / partial | 5 / 0 | 75 / 0 (listing đầy đủ lưu apt-lists.txt) |
| GST hệ thống / debroot | KHÔNG TỒN TẠI / 269 | SYMLINK → debroot / 269 |
| /var/log/apt | KHÔNG TỒN TẠI | (repair tạo, xem /tmp/l8-postboot-apt.log) |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | FAIL exit 1 (poll0 23:42Z) | PASS exit 0 (poll1 + poll0b) |

- **Dạng (B) thuần:** dpkg.log chỉ 2 dòng "startup packages
  configure" lúc 22:48:39Z rồi im hoàn toàn tới lúc T5 mở
  (23:40:27Z, im 3128 s) và tới lúc verify (23:43:32Z, im 3293 s)
  — giống hệt mẫu #60? (đợt 120), #69? (đợt 125), #76? (đợt 129),
  #77? (đợt 130), 90392aa5 (đợt 140 boot 2). **KHÔNG có GAP**
  kiểu đợt 140 boot 1 (GAP là im giữa configure và install trong
  khi replay còn sống — ở đây replay KHÔNG BAO GIỜ tới install).
- **Cache CHẾT qua reboot lần thứ 2** (sau đợt 140 boot 2: 0 .deb):
  boot này cache 0 .deb / 0 byte lúc mở (F-141-T5-4 giữ nguyên:
  sống/không sống là KHÔNG NHẤT QUÁN — 178 .deb đợt 141 vs 0 .deb
  đợt 142; không rút quy luật, không giả định trước).
- **Lists 5** lúc mở (chỉ cli.github.com InRelease + Packages;
  apt history KHÔNG TỒN TẠI — apt-get update chưa từng chạy trong
  boot này trước repair).
- **KHÔNG có watcher 60-phút** kiểu đợt 120–122: silent đã 3128 s
  lúc T5 mở (vượt xa ngưỡng 600 s), verify 5/5 đủ điều kiện ngay —
  chờ thêm 60 phút nữa chỉ để xác nhận điều đã rõ là lãng phí lượt
  yên của T4 (tiền lệ: đợt 140 boot 2 trigger ở poll 9 khi silent
  614 s; đợt 129/130 cũng trigger khi silent vừa qua 600 s).

### 3.2 Verify độc lập §8.2(B) 5/5 (23:43:32Z, log `t5-verify-b-trigger.log`)

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | postboot FAIL tươi | FAIL exit 1 (poll0 23:42Z + verify lại 23:43:32Z: thiếu 5 lib + GST + 11 gói apt) ✓ |
| 2a | 0 proc apt/dpkg/wrapper | apt-get=0, apt=0, dpkg=0, os-intent=0 (kiểm sạch — lần đọc đầu ra 3 do tự khớp mẫu shell, xem F-142-T5-2); lock dpkg rảnh (fuser exit 1) ✓ |
| 2b/3 | dpkg đóng băng + silent ≥600 s | mtime 22:48:39Z, silent **3293 s** ✓ |
| 4 | form B (dpkg ≤5 dòng + 0 installs + FAIL) | dpkg 2 dòng / 0 installs / GST dir ABSENT / lists 5 / cache 0 ✓ |
| 5 | MiniBrowser 0 (không có probe WebKit đang chạy) | pgrep -x MiniBrowser = 0 (lần đọc đầu ra 1–2 do tự khớp mẫu shell, xem F-142-T5-2); vite-dev không có — không cản repair ✓ |

- **Luật (C) KHÔNG đủ:** (a) FAIL ✓ nhưng (b) không có apt sống
  để kẹt, (c) silent 3293 s ≥ 900 s ✓, **(d) form (C) KHÔNG
  (lists 5 > 3)**, (e) no-probe ✓. Nên trigger vận hành là
  **§8.2(B) form B, không phải luật (C)** — T5 ghi rõ để khỏi đọc
  thành "(C) kích hoạt" (như đợt 140).
- **§8.2(B) kích hoạt lần thứ 3** (lần 1: #76? đợt 129, lần 2:
  90392aa5 đợt 140, lần 3: bde599df đợt 142).

### 3.3 --repair 1 lần duy nhất (23:44:06Z, log `t5-repair-bootbde599df.log`)

- Wrapper PASS (K1 còn nguyên, không cần vá lại).
- GST symlink lại → debroot (269 file, 23:44Z).
- apt FAIL 11 gói → `apt-get update` (INFO "lists có thể trống…")
  **OK nhanh** (mirror khoẻ — repair tổng chỉ ~1m56s từ 23:44:06Z
  tới dpkg mtime 23:46:02Z; khác đợt 140 boot 2 update mất ~9 phút
  do mirror chậm).
- Cài đủ 11 gói (`REPAIRED apt: đã cài: libevent-2.1-7t64
  gstreamer1.0-plugins-base … libevdev2`, 180 dòng `Get:` trong
  /tmp/l8-postboot-apt.log); **RE-CHECK wrapper / libs / GST / apt
  toàn PASS ~23:46Z**; KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit.
- **Chỉ chạy 1 lần (once-only) — KHÔNG chạy lại, KHÔNG kill proc
  nào.** Tổng thời gian repair ~2 phút — **nhanh nhất trong các
  lần repair** (đợt 129: ~15 phút; đợt 130: ~?; đợt 140 boot 2:
  ~10 phút).
- Cờ `REPAIR_TRIGGERED` ghi 23:44:06Z (form=B, verify=5/5,
  silent=3293s).

### 3.4 Postboot script — sửa 1 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`1ebcb776…` (cuối đợt 141) → **`efb83d5d…`**:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 23:47Z | bde599df | `1ebcb776…` → `efb83d5d…` | header (đoạn Dot 142: btime KHỚP brief, replay CHẾT dạng (B), §8.2(B) form B TRIGGER=YES, --repair 1 lần PASS 795/113, cờ 23:48:25Z, headroom mở 1614) + say mô tả trạng thái đã đo (repair đã xong + postboot PASS poll1 trước khi viết say) |

- `bash -n` OK sau khi sửa. **KHÔNG đổi logic** (không đổi
  thứ tự apt/GST, không đổi NEED/threshold). Check-only chạy
  lại sau sửa (poll0b) **exit 0** — cùng kết quả như trước
  sửa, chứng minh sửa header/say không ảnh hưởng logic.
- Lưu ý: lần sửa header đầu ghi sai stat /proc/1 (22:48:15Z
  "ước") — đã sửa lại thành 22:48:16Z (đo thật) TRƯỚC khi chạy
  poll0b (xem F-142-T5-1).

### 3.5 Boot 2 (9afdaa89) — replay XONG ĐẦY ĐỦ, watcher v6 ghi cờ mới

| Hạng mục | Lúc watcher mở (23:58:21Z) | Sau replay xong (23:58:47Z) |
|---|---|---|
| dpkg.log dòng | 1445 | 1545 |
| `status installed` | 206 | 221 |
| dòng chứa `configure` | — | 462 |
| dòng `gstreamer` | — | 98 |
| dpkg.log md5 | — | `92215aeb…` |
| dpkg.log mtime | 23:58:18Z | 23:58:47Z (gói cuối gstreamer1.0-tools) |
| startup configure đầu | 23:54:56Z (boot +36s) | như vậy |
| cài thật | đang chạy (apt-get pid 6992, wrapper 2 proc) | 23:55–23:58:47Z |
| cache apt | 110 .deb | 178 .deb / 156M |
| lists / partial | 71 / 0 | 71 / 0 (listing lưu apt-lists-boot9afdaa89.txt) |
| GST hệ thống / debroot | thư mục THẬT 269 / 269 | thư mục THẬT 269 / 269 |
| proc apt/dpkg/wrapper | apt-get 1, wrapper 2 | 0 |
| postboot check | PASS exit 0 (poll 1, 23:58:21Z) | PASS exit 0 (poll 2, poll 3 + kiểm độc lập T5) |

- **Bracket đầy đủ: (startup configure 23:54:56Z = boot +36s, cài
  thật ~23:55–23:58:47Z, xong 23:58:47Z = boot +4m27s, 1545/221/
  462)** — KHÔNG GAP; nhanh thứ 3 trong các replay đầy đủ
  (#96? +3m52s, 2c0efe57 +3m57s, 9afdaa89 +4m27s; #94? +6m05s,
  140 boot 1 +16m39s do GAP). **Cache SỐNG qua reboot** (110 .deb
  lúc mở — chính cache sau --repair boot 1 — rồi 178 .deb sau
  replay; replay tải thêm phần còn thiếu thay vì cài toàn bộ từ
  cache).
- **Watcher v6** (`t5-wait-replay-boot9afdaa89.sh`, 3 poll):
  poll 1 (23:58:21Z) postboot PASS nhưng replay còn chạy (dpkg
  1445, apt-get 1, wrapper 2) → chưa ghi cờ; poll 2 (23:59:21Z)
  dpkg 1545/221, 0 proc, postboot PASS (streak 1); poll 3
  (00:00:22Z) dpkg đóng băng (frozen=yes, silent 95 s), 0 proc,
  postboot PASS (streak 2) → **FLAG_WRITTEN 00:00:22Z poll=3**,
  `WATCHER_END reason=done_pass_stable_2polls`. EVAL §8.2(B)/(C)
  ở cả 3 poll đều TRIGGER=NO (postboot PASS ngay từ poll 1 —
  c1=no). Cờ cũ boot 1 đã archive stale lúc watcher khởi động
  (`POSTBOOT_PASS.stale-bde599df`, 23:58:21Z — v5 fix đợt 131).
- **KHÔNG cần --repair trên boot 2; luật (C) KHÔNG kích hoạt.**

### 3.6 T4 trên 2 boot (T5 chỉ ghi nhận, kết quả thuộc T4)

- **Boot 1:** Poller `poll-wait-t4-142.sh` bắt đầu trước khi cờ ghi
  (deadline 02:30:00Z, poll 45 s, gateA ≥1024 MB, KHÔNG hạ).
  **CỜ POSTBOOT_PASS ghi 23:48:25Z poll=1** — T4 đã đọc ở **poll
  #9 (23:48:39Z**, ~14 s sau khi ghi; t5flag=PASS(t5src=142-t5/
  POSTBOOT_PASS), postboot_exit=0, dpkg_lines=795) và đang **chờ
  gate A** (RAM 580 MB poll #9, 563 MB poll #10, 435 MB poll #11
  — DƯỚI gate ≥1024 MB) thì **reboot #26 giết poller** (poll #16
  cuối 23:53:55Z). **Lượt yên #18 KHÔNG MỞ trên boot 1.**
- **Boot 2:** T4 tự khởi động lại poller (poll #2 mới 23:56:24Z,
  cùng deadline 02:30:00Z). Poll #7 (00:00:10Z) còn đọc cờ stale
  (t5src=141-t5/POSTBOOT_PASS, mtime-cu — poller validate boot_id
  nên không tính PASS); **poll #8 (00:00:55Z) đọc cờ mới**
  (t5flag=PASS(t5src=142-t5/POSTBOOT_PASS), postboot_exit=0) và
  **MỞ CỬA YÊN #18 ở poll #8 (RAM 1170 MB) — CHẠY attempt1 NGAY**.
  Attempt1 **20/20 XONG, run-attempt exit=0, 00:04:48Z**
  (COVERAGE-CHECK 6/6; tickCost median 50,0 ms, n=608, p90 73,3 —
  theo file analyze-t4-attempt1-tickcost.txt của T4; verdict thuộc
  T4). T4 thoát poller sau attempt1.

## 4. Kiểm cây — md5 3 file lúc mở / lúc đóng + postboot script

| File | Lúc mở 23:40Z | Lúc viết | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 1ebcb776… | efb83d5d… (sau sửa lần 1) | chỉ header + say, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này. T4-142 cũng độc lập ghi tree=YES:md5=
  530e10a7 ở mọi poll.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 2 series (1 BỊ REBOOT CẮT n=12, 1 ĐẦY ĐỦ n=40)

> Sampler boot 1: 23:42:40–23:53:40Z (12 mẫu, bị reboot cắt).
> Sampler boot 2: 23:58:21Z–00:37:22Z (40 mẫu) + DONE 00:38:22Z.

### 5.1 Series boot 1 (bde599df) — BỊ REBOOT CẮT, n=12 (23:42:40–23:53:40Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 23:42:40 | 740.800 | 6.087.484 | 1,22 |
| 2 | 23:43:40 | **1.151.664** | 5.776.148 | 1,81 |
| 3 | 23:44:40 | 958.136 | 5.910.396 | 1,69 |
| 4 | 23:45:40 | 836.584 | 6.031.648 | 1,07 |
| 5 | 23:46:40 | 767.844 | 6.142.968 | 0,75 |
| 6 | 23:47:40 | 682.760 | 6.247.040 | 0,59 |
| 7 | 23:48:40 | 645.012 | 6.344.160 | 0,79 |
| 8 | 23:49:40 | **463.096** | 6.432.576 | 1,06 |
| 9 | 23:50:40 | 528.564 | **6.443.824** | 1,07 |
| 10 | 23:51:40 | 719.472 | 6.248.136 | 1,29 |
| 11 | 23:52:40 | 830.412 | 6.114.564 | 0,90 |
| 12 | 23:53:40 | 720.872 | 6.224.404 | 0,43 |

- Thống kê (tính bằng code trên 12 mẫu, đối chiếu trực tiếp từng
  dòng log): min avail **463.096 kB lúc 23:49:40Z**; max
  **1.151.664 kB lúc 23:43:40Z**; trung bình 753.768 kB; Balloon min
  **5.776.148 kB lúc 23:43:40Z**, max **6.443.824 kB = ĐÚNG trần
  kẹt lúc 23:50:40Z** (1 mẫu), trung bình 6.166.946 kB.
  **0 mẫu ≥ 6.144 MiB.** Gate A (≥1.048.576 kB): **1/12 mẫu**
  (chỉ mẫu 2). Load1 0,43–1,81.
- **Hình dạng: balloon SÁT/GHIM trần suốt series.** Lúc mở đã
  6,05M kB; phình đơn điệu lên 6.432.576 kB (23:49:40Z, chỉ cách
  trần ~11k kB) rồi **GHIM ĐÚNG trần 6.443.824 kB lúc 23:50:40Z**;
  sau đó wobble nhẹ 6,11–6,25M kB (xả ~195–330k kB xen kẽ). Khác đợt
  141 (balloon xả lớn ~1,58M kB rồi mới phình lại) — đợt này balloon
  phình lên sát trần ngay từ đầu series và KHÔNG xả lớn lần nào.
  **RAM avail thấp suốt series** (463k–1.151k kB) — gate A của T4
  bị chặn từ đầu (RAM 435–580 MB ở poll #9–#11 boot 1).
- **Không có cửa sổ guard nào** (max avail 1.151.664 kB = 18,3%
  guard) — không ai thử birefnet trên boot 1.

### 5.2 Series boot 2 (9afdaa89) — ĐẦY ĐỦ, n=40 (23:58:21Z–00:37:22Z + DONE 00:38:22Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 23:58:21Z | 1,516,636 | 5,321,464 | 2.60 |
| 2 | 23:59:21Z | 1,396,292 | 5,502,844 | 1.25 |
| 3 | 00:00:21Z | 1,274,640 | 5,669,412 | 1.17 |
| 4 | 00:01:21Z | 1,227,668 | 4,784,256 | 3.13 |
| 5 | 00:02:21Z | 1,169,448 | 4,880,044 | 5.24 |
| 6 | 00:03:21Z | 1,490,172 | 5,042,836 | 1.92 |
| 7 | 00:04:21Z | 1,680,736 | 5,219,216 | 0.86 |
| 8 | 00:05:21Z | 3,033,964 | 3,842,512 | 0.86 |
| 9 | 00:06:21Z | 2,731,632 | 4,161,892 | 0.31 |
| 10 | 00:07:21Z | 2,480,436 | 4,451,720 | 0.20 |
| 11 | 00:08:21Z | 2,185,556 | 4,711,580 | 0.81 |
| 12 | 00:09:21Z | 1,947,408 | 4,933,524 | 1.22 |
| 13 | 00:10:21Z | 1,408,136 | 4,614,736 | 2.62 |
| 14 | 00:11:21Z | 1,195,644 | 4,719,316 | 4.04 |
| 15 | 00:12:21Z | 2,047,440 | 4,573,500 | 2.21 |
| 16 | 00:13:21Z | 1,836,056 | 4,783,264 | 1.67 |
| 17 | 00:14:21Z | **3,043,680** | 3,800,224 | 1.48 |
| 18 | 00:15:21Z | 2,824,900 | 4,123,304 | 0.84 |
| 19 | 00:16:21Z | 2,496,468 | 4,417,512 | 0.35 |
| 20 | 00:17:22Z | 1,690,716 | 4,485,340 | 1.14 |
| 21 | 00:18:22Z | 1,389,028 | 4,593,972 | 1.70 |
| 22 | 00:19:22Z | 1,746,084 | 4,787,420 | 0.73 |
| 23 | 00:20:22Z | 1,656,132 | 4,983,424 | 1.22 |
| 24 | 00:21:22Z | 2,404,244 | 4,464,412 | 0.79 |
| 25 | 00:22:22Z | 2,098,056 | 4,703,124 | 0.65 |
| 26 | 00:23:22Z | 1,904,448 | 4,941,760 | 0.32 |
| 27 | 00:24:22Z | 1,755,136 | 5,158,472 | 0.85 |
| 28 | 00:25:22Z | 1,535,432 | 5,352,960 | 0.65 |
| 29 | 00:26:22Z | 1,374,436 | 5,529,912 | 0.58 |
| 30 | 00:27:22Z | 1,193,188 | 5,687,880 | 0.31 |
| 31 | 00:28:22Z | 1,091,192 | 5,834,448 | 0.17 |
| 32 | 00:29:22Z | 944,524 | 5,967,252 | 0.22 |
| 33 | 00:30:22Z | 1,336,868 | 5,589,148 | 0.30 |
| 34 | 00:31:22Z | 1,019,668 | 5,213,504 | 0.73 |
| 35 | 00:32:22Z | 905,428 | 5,362,484 | 1.82 |
| 36 | 00:33:22Z | 1,005,048 | 5,245,896 | 2.45 |
| 37 | 00:34:22Z | 1,843,864 | 5,104,392 | 1.88 |
| 38 | 00:35:22Z | 1,014,276 | 5,268,364 | 1.91 |
| 39 | 00:36:22Z | 984,056 | 5,393,860 | 1.72 |
| 40 | 00:37:22Z | 859,388 | 5,519,368 | 1.01 |

- Thống kê (tính bằng code trên 40 mẫu): min avail **859.388 kB lúc
  00:37:22Z**; max **3.043.680 kB lúc 00:14:21Z = 2.972,3 MiB
  = 48,4% guard**; trung bình 1.668.453 kB; Balloon min
  **3.800.224 kB lúc 00:14:21Z**, max **5.967.252 kB lúc 00:29:22Z**
  (chỉ 1 mẫu ở max), trung bình 4.968.514 kB. **0 mẫu ≥ 6.144
  MiB.** Gate A (≥1.048.576 kB): **33/40 mẫu**. Load1 0,17–5,24.
- **Hình dạng: XẢ LỚN đầu series rồi phình lại, wobble, KHÔNG ghim
  trần.** Balloon từ 5,67M (00:00:21Z) **xả ~885k kB** xuống 4,78M
  lúc 00:01:21Z (avail +~1,23M kB) — trùng lúc attempt1 của T4
  đang chạy (mở cửa yên #18 00:00:55Z, WebKit chạy rồi thoát dần)
  — tương quan, không kết luận nhân quả; xả tiếp xuống min
  3,80M lúc 00:14:21Z (avail đỉnh series 3,04M = 48,4% guard —
  CAO NHẤT trong các series T5 gần đây nhưng vẫn xa guard),
  rồi phình lại đơn điệu ~+150–200k kB/phút lên 5,97M (00:29:22Z),
  wobble nhẹ (xả ~377k lúc 00:30:22Z, ~141k lúc 00:34:22Z) rồi
  phình lại; **KHÔNG BAO GIỜ chạm trần kẹt 6.443.824 kB** (max
  5.967.252, còn cách trần ~477k kB). Lúc đóng (00:38:59Z, ngoài
  series): avail **853.008 kB**, balloon **5.475.352 kB**.
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy song
  song — nếu cửa sổ guard mở sau khi T5 đóng (00:38Z), T9 là luồng
  bắt được theo quyết §12.3(d) đợt 138. Trong phiên T5, đỉnh cao
  nhất chỉ 48,4% guard — **không có cửa sổ nào, không ai thử
  birefnet**. u2net vẫn là fallback chính thức.
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f) đợt 137). Birefnet vẫn 0 lần chạy thành công
  trong gói (tính tới lúc T5 đóng).

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
| **Đợt 142 mở (T5, 23:42:42Z)** | **1614** | **boot bde599df, headroom-open.txt** |
| **Đợt 142 cuối (T5, 00:38:59Z)** | **1593** | **boot 9afdaa89, headroom-end.txt** |

- Giảm −106 so với cuối đợt 141 (1720 → 1614); chuỗi dài hạn
  tiếp tục giảm đều (~100–110/đợt, 12 đợt gần nhất). **Vẫn DƯỚI
  ngưỡng báo user (< ~1.800)** — theo quyết parent đợt 141 (đã
  BÁO USER trong báo cáo đợt 141), đợt này **chỉ theo dõi, không
  báo riêng, không tự đổi gì**.
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **391 (lúc mở) → 811 (lúc đóng)** — tăng mạnh trong
  phiên (T4 attempt1 WebKit + vite dev của các luồng khác giữ
  watch; đợt 141 chỉ 399 → 407). Watch giữ ngoài cell như các đợt
  trước (~61k watch ngoài cell theo T9).

### 6.2 Disk

- Overlay `/`: 7,5G tổng, 312M đã dùng, **7,0G trống (5%)** lúc
  mở (23:49Z). `/tmp` tmpfs 512M, 512M trống lúc mở.
- Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại;
  `vite --version` = **vite/6.4.5 linux-x64 node-v24.22.1**
  (chạy được, kiểm 23:43Z). T5 KHÔNG chạy dev server / build
  (không sửa production; việc của T8).

## 7. EPERM scan + WFS #48 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #61 (T2-142): ok=2 fail=0, boot=bde599df, 23:45:18Z**
  (`eperm-probe-v2.log`: dòng `boot changed 2c0efe57 ->
  bde599df` + dòng probe #61; T2 đã mở mù #61 — việc T2/T10).
  Trước probe, status DEAD (heartbeat #60 age 10.803 s — đúng,
  heartbeat từ probe #60 trên boot cũ 2c0efe57; death được ghi
  vào log kèm dòng `boot changed`, không phải im lặng).
  Probe #61 là probe đầu tiên trên boot bde599df.
- **Mù #61 MỚI MỞ (T2-142)** — việc T2/T10 phân xử tiếp; T5 chỉ
  ghi nhận, không tự chạy probe chéo để không đếm trùng sóng.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 23:49Z — log dừng ở probe #61).
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #60→#61
  (2c0efe57→bde599df, age 10.803 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–141).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** Sweep của
  T2-142 (xem LIMITS T2-142) đồng thuận; EPERM vẫn KHÔNG được
  tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #48 (T5 chạy, 23:48:37–23:49:19Z, 42 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round142-t5, **đổi OUT round141-t5 → round142-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round142-t5, không
  còn tham chiếu round cũ nào trong script; grep `round141` sau
  sed = 0). Kết quả:
  - NEWSTD: **953 dòng / 267 file** (phạm vi 3.180 file);
  - R7b đối chiếu: **978 dòng / 284 file** (phạm vi 12.573 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43–47.
  - Đối chiếu chéo: 953+25=978=R7b, **chênh 0**.
- **+9 dòng / +3 file so với lần 47 (T5)** (944/264 → 953/267),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #47
  còn nguyên trong round141-t5/):
  | Phạm vi | #47 (T5, 20:42:11Z) | #48 (T5, 23:48:37Z) | Delta |
  |---|---|---|---|
  | NEWSTD scope | 3.170 | 3.180 | +10 file, 0 file mất |
  | NEWSTD | 944/264 | 953/267 | +9/+3 |
  | R7b | 969/281 | 978/284 | +9/+3 |
  | copies | 25/17 | 25/17 | 0 |
  - 10 file mới trong scope = đúng 9 file `docs/` đợt 141
    (aggregate + T1/T2/T4/T5/T6/T7/T8/T9 LIMITS) + 1 file
    `docs/` đợt 142 (T1 verify141); 0 file mất. Trong 10 file
    mới, chỉ 3 file có hit: T2-141 +7, T5-141 +1,
    aggregate-141 +1 (= +9); 7 file còn lại 0 hit. Diff
    wfs-newstd.txt #47→#48 chỉ ra đúng 3 dòng thêm, không file
    nào đổi số hit, không file nào mất hit.
- **Kết luận: 48 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #61.

### 7.4 Đối chiếu chéo T2 vs T5 (scan #48 — 2 lần quét độc lập)

- T2-142 chạy scan #48 của mình (00:00:32–00:00:57Z): NEWSTD **954
  dòng / 268 file** (phạm vi 3.181), R7b **979/285**, copies 25/17;
  954+25=979 ✓.
- T5-142 scan #48 **23:48:37–23:49:19Z**: NEWSTD 953/267
  (3.180), R7b 978/284 (12.573), copies 25/17; 953+25=978 ✓.
- Delta T2−T5: **+1 dòng / +1 file / +1 scope file, đúng 1 file
  duy nhất: `./docs/PHASE9_ROUND142_T5_INFRA_LIMITS.md:1`** — chính
  file LIMITS này của T5, tạo ra SAU lần quét của T5 (23:48Z) và
  TRƯỚC lần quét của T2 (00:00Z), chứa đúng 1 lần nhắc
  "writeFileSync" trong văn bản §7.3. Diff wfs-newstd.txt và
  wfs-r7b.txt T2−T5 chỉ ra đúng 1 dòng thêm đó; copies Y HỆT.
- **Kết luận: hai lần quét độc lập khớp nhau hoàn toàn sau khi trừ
  file T5 tự tạo giữa 2 lần quét — chênh 0 được củng cố lần thứ
  hai trong đợt này** (như đợt 141).

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
  để né EPERM trong mù #61.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–141). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max avail 2.972,3 MiB = 48,4% guard lúc
   00:14:21Z boot 2; balloon boot 1 GHIM ĐÚNG trần kẹt 1 mẫu, xem
   §5). T9 sampler dài là luồng bắt cửa sổ nếu có sau khi T5 đóng;
   guard 6.144 MiB GIỮ NGUYÊN (quyết §12.3(d) đợt 138). u2net là
   fallback chính thức.
2. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên
   #18 (T4) ĐÃ MỞ poll #8 boot 2 (RAM 1170 MB) và attempt1 **20/20
   XONG, exit 0, 00:04:48Z** (tickCost median 50,0 ms — verdict
   thuộc T4; P1/P3/P7 cộng dồn xem file T4). P1 28/28, P3 24/28,
   P7 14/14 (cộng dồn giữ nguyên tới trước đợt này); DEF v0.5
   (P5 34–52 ms + P3' stall-based) đã chấp nhận, T3 viết ở đợt
   138 — P3' vẫn chưa được kiểm lần nào.
3. **Headroom VẪN DƯỚI NGƯỠNG BÁO (1614 mở → 1593 cuối):**
   chỉ theo dõi, không báo riêng (quyết parent đợt 141 đã báo
   user). Đà ~100–110/đợt giữ nguyên.
4. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4 giữ nguyên):** đợt 141: 178 .deb (sống); đợt 142:
   0 .deb (chết). T5 đợt sau vẫn kiểm cache ngay lúc mở boot mới,
   không giả định trước.
5. **Replay CHẾT dạng (B) lần thứ 3 trong 4 đợt gần nhất** (#76?
   đợt 129, 90392aa5 đợt 140, bde599df đợt 142 — xen giữa là đợt
   141 replay chạy tốt): dạng (B) không còn là ngoại lệ hiếm.
   §8.2(B) form B đã kích hoạt đúng luật cả 3 lần, --repair 1 lần
   đều PASS. Không có thay đổi luật nào được đề xuất — chỉ ghi
   nhận tần suất.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 141 §11: **mù
   #61 MỚI MỞ (T2-142)**; **gap #97?→#98? = [7.089, 7.109] s +
   gap #98?→#99? = [7.266, 7.286] s ĐỀU ĐÃ CHỨNG NHẬN → CERT 60 /
   FULL 75**; **khung chết #97? XÁC NHẬN chuẩn mới merged 46 s +
   khung chết #98? XÁC NHẬN (19:46:47Z, 19:54:12Z] (445 s)** (T2-141
   — chờ parent quyết khung chết #96?/#97?); G1 chờ user quyết;
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
   gate không đổi + KHÔNG push khi user chưa nhắn "push đi";
   R9 (a) vẫn chờ user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  viết, cả 2 boot). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần (`1ebcb776…` → `efb83d5d…`,
  header + say, KHÔNG đổi logic — xem §3.4).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-142 probe #61
  ok=2 fail=0). WFS scan #48 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1); đối chiếu T2
  chờ T2-142 xong (xem §7.4).
- Postboot boot 1: FAIL exit 1 poll0 (23:42Z) → §8.2(B) form B
  TRIGGER=YES (verify 5/5, 23:43:32Z) → --repair 1 lần 23:44:06Z
  PASS (RE-CHECK toàn PASS, dpkg 795/113) → postboot PASS kiểm độc
  lập poll1 exit 0 + poll0b exit 0 sau sửa header; cờ ghi 23:48:25Z
  poll=1, T4 đã đọc poll #9, đang chờ gate A thì reboot giết
  poller. **Watcher 60-phút boot 1: KHÔNG lập (silent đã 3128 s
  lúc mở, vượt xa ngưỡng 600 s — xem §3.1). Luật (C): KHÔNG đủ
  (lists 5 > 3, không có apt sống).**
- Postboot boot 2: replay XONG ĐẦY ĐỦ (1545/221/462, boot +4m27s);
  watcher v6 3 poll (PASS ngay poll 1, PASS ổn định 2 poll) →
  cờ mới ghi 00:00:22Z poll=3; T4 đọc poll #8, **MỞ CỬA YÊN #18
  poll #8 00:00:55Z (RAM 1170 MB), attempt1 20/20 XONG, exit 0,
  00:04:48Z**; T5 kiểm độc lập postboot boot 2 exit 0.
- Headroom: 1614 (mở) → **1593 (cuối)** — VẪN DƯỚI ngưỡng báo
  ~1.800, chỉ theo dõi.
- RAM phiên T5 (2 series, xem §5): boot 1 n=12 (bị reboot cắt),
  balloon GHIM ĐÚNG trần kẹt 6.443.824 kB 1 mẫu; boot 2 n=40 ĐẦY ĐỦ
  (avail 859.388–3.043.680 kB, balloon 3.800.224–5.967.252 kB, gate A
  33/40, max 48,4% guard, 0 mẫu ở trần). RAM lúc đóng 853.008 kB,
  balloon 5.475.352 kB.
- **Reboot GIỮA LƯỢT: 1 lần (reboot #26, có thể #27 xen giữa —
  xem F-142-T5-4)** — boot bde599df chết trong khung (23:53:55Z,
  23:54:20Z]; T5 đã làm postboot cho boot mới 9afdaa89 (watcher v6).
- **started_at lượt 142:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: CÓ reboot giữa lượt trong phiên T5 nên
  giả thuyết viết lại (đã kiểm chứng 8 lần ở các đợt trước) DỰ BÁO
  started_at CÓ THỂ đã bị viết lại trong lúc reboot — T10 kiểm lại
  lúc đóng (T5 ghi rõ đây là dự báo từ giả thuyết, không phải kết
  quả kiểm).

## 11. Sai số của T5 đợt này (F-142-T5-N)

- **F-142-T5-1 — (ghi chú) Header postboot lần đầu ghi sai stat
  /proc/1:** bản nháp header ghi "22:48:15Z stat /proc/1 (ước —
  T5-142 kiểm lại)"; đo thật sau đó là **22:48:16Z** (+11 s sau
  btime, đúng mẫu các boot trước). T5 đã sửa lại thành 22:48:16Z
  TRƯỚC khi chạy poll0b. **Hậu quả:** không ảnh hưởng số liệu nào
  (chỉ là dòng header; poll0b PASS sau khi sửa).
- **F-142-T5-2 — (ghi chú) 2 lần đọc proc đầu bị tự khớp mẫu shell
  (cùng bẫy F-140-T5-4):** (a) `pgrep -c -f MiniBrowser` ra 2 —
  do dòng lệnh exec của chính T5 chứa chuỗi "MiniBrowser"; kiểm
  sạch bằng `pgrep -x MiniBrowser` = 0. (b) `ps aux | grep -c
  '[o]s-intent'` ra 3 — do dòng lệnh exec chứa chuỗi "os-intent"
  trong nhãn echo; kiểm sạch bằng `ps -eo pid,args | grep
  '[o]s-intent'` = 0 dòng thật. **Hậu quả:** không ảnh hưởng quyết
  định nào (verify 5/5 dùng số kiểm sạch). Bài học: mọi đếm proc
  bằng pattern phải kiểm sạch bằng pgrep -x / ps loại trừ dòng lệnh
  của chính mình.
- **F-142-T5-3 — (ghi chú, ĐÃ ĐÓNG) Sampler boot 2 / headroom cuối
  đã điền đủ lúc đóng (§5.2 n=40 + §6.1 headroom-end 1593).**
- **F-142-T5-4 — LỆCH ĐỒNG HỒ quanh reboot + boot trung gian b47f7932
  chỉ quan sát 1 lần:** lần đọc boot_id lúc 23:54:27Z ra b47f7932,
  nhưng boot sau đó (9afdaa89) có btime kernel 23:54:20Z — TRƯỚC
  thời điểm quan sát b47f7932, điều không thể nếu cùng một đồng hồ.
  Cùng mẫu F-140-T5-2 (đồng hồ cũ chạy nhanh ~+35 s so với host).
  T5 lấy btime kernel 23:54:20Z làm chuẩn cho boot 2; số thứ tự
  reboot (#26/#27) và khung chết chính xác của boot 1 chờ T6/T2
  đếm lại. **Hậu quả:** không ảnh hưởng số liệu kỹ thuật nào (mọi
  mốc boot 2 đều theo đồng hồ mới, nhất quán nội bộ) — chỉ ảnh
  hưởng việc đếm reboot, thuộc T6.
- **F-142-T5-5 — (LỖI T5, ĐÃ SỬA TRƯỚC KHI ĐÓNG) Bản nháp bảng mẫu
  boot 1 (§5.1) viết từ trí nhớ, sai 8/12 dòng:** T5 viết nháp bảng
  12 mẫu khi chưa đọc lại log, điền sai các mẫu 2/3/4/5/6/7/9/10/11/12
  (dời dòng + bịa 2 cặp "mẫu trùng") — trong khi thống kê code
  (min/max/mean) đã tính đúng từ log và MÂU THUẪN với bảng nháp
  (max avail code 1.151.664 kB vs bảng nháp 958.136 kB). T5 phát
  hiện khi đối chiếu, đã đọc trực tiếp `ram-sampler.log` và viết
  lại toàn bộ §5.1 theo từng dòng log (mẫu 2: 1.151.664 kB lúc
  23:43:40Z; mẫu 9: balloon GHIM ĐÚNG trần 6.443.824 kB lúc
  23:50:40Z — KHÔNG có cặp mẫu trùng nào). **Hậu quả:** không còn
  sai số trong file cuối (bảng §5.1 hiện tại khớp log từng dòng).
  Bài học: KHÔNG BAO GIỜ viết bảng mẫu từ trí nhớ — luôn đọc log
  trước khi viết bảng, và đối chiếu min/max code với bảng trước
  khi đóng.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND142_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header + dòng `say`; md5 cuối `efb83d5d…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round142-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (boot 1, 12 mẫu —
  BỊ REBOOT CẮT) + ram-sampler.sh, ram-sampler.nohup.log,
  ram-sampler-boot9afdaa89.log (boot 2, 40 mẫu ĐẦY ĐỦ + DONE
  00:38:22Z) + ram-sampler-boot9afdaa89.sh,
  ram-sampler-boot9afdaa89.nohup.log, ram-end.txt (avail 853.008 kB
  lúc đóng 00:38:59Z), headroom-open.txt (1614),
  headroom-end.txt (1593),
  k8-headroom-highcap.py (bản copy từ round141-t5),
  apt-lists.txt (75 dòng, boot 1 sau repair),
  apt-lists-boot9afdaa89.txt (71 dòng, boot 2 sau replay),
  scan-wfs-t5.sh (bản copy — OUT đã sửa ĐÚNG round142-t5 TRƯỚC khi
  chạy, xem §7.3), scan-meta.txt, files-newstd.bin, wfs-newstd.txt,
  files-r7b.bin, wfs-r7b.txt, files-copies.txt, wfs-copies.txt —
  7 file kết quả scan #48, scan-wfs-run.log,
  t5-postboot-poll0.log (boot 1, FAIL exit 1),
  t5-postboot-poll0b.log (boot 1, PASS exit 0 sau sửa header),
  t5-postboot-poll1.log (boot 1, PASS exit 0 kiểm độc lập),
  t5-verify-b-trigger.log (verify 5/5 §8.2(B) form B),
  t5-verify-b-trigger-postboot.log (postboot FAIL tươi lúc verify),
  t5-repair-bootbde599df.log (--repair boot 1, 1 lần PASS),
  REPAIR_TRIGGERED (23:44:06Z, form=B, verify=5/5, silent=3293s),
  `POSTBOOT_PASS.stale-bde599df` (cờ boot 1 đã archive, ghi
  23:48:25Z poll=1; T4 đã đọc poll #9 boot 1),
  t5-wait-replay-boot9afdaa89.sh (watcher v6 boot 2) +
  t5-wait-replay-boot9afdaa89.log (3 poll, FLAG_WRITTEN 00:00:22Z
  poll=3) + t5-wait-replay-boot9afdaa89.nohup.log,
  t5-postboot-boot9afdaa89-poll1.log (watcher poll 1, PASS),
  t5-postboot-boot9afdaa89-poll2.log (watcher poll 2, PASS),
  t5-postboot-boot9afdaa89-poll3.log (watcher poll 3, PASS),
  t5-postboot-boot9afdaa89-poll1.log (T5 kiểm độc lập, PASS exit 0)
  — LƯU Ý: tên file poll1 của watcher và của T5 trùng nhau, file
  sau (T5 kiểm độc lập, 00:01Z) đã ghi đè file trước (watcher poll
  1, 23:58:21Z); nội dung cùng PASS exit 0, không mất bằng chứng
  quyết định (watcher log còn ghi đủ 3 poll + exit),
  `POSTBOOT_PASS` (cờ gate-visible — boot 9afdaa89, ghi 00:00:22Z
  poll=3; T4 đã đọc poll #8, MỞ CỬA YÊN #18 poll #8)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round142-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round142-t5.done` (ghi rõ: boot 1
  bde599df replay CHẾT dạng (B) (dpkg 2 dòng, cache 0 .deb, GST dir
  ABSENT), §8.2(B) form B TRIGGER=YES (verify 5/5, silent 3293s),
  --repair 1 lần 23:44:06Z PASS (795/113, RE-CHECK toàn PASS, ~2
  phút); postboot PASS poll1 + poll0b; cờ boot 1 23:48:25Z poll=1,
  T4 đọc poll #9, đang chờ gate A thì REBOOT GIỮA LƯỢT #26 giết
  poller + sampler (mẫu 12/40); boot 2 9afdaa89 replay XONG ĐẦY ĐỦ
  (1545/221/462, boot +4m27s), watcher v6 ghi cờ mới 00:00:22Z
  poll=3, T4 MỞ CỬA YÊN #18 poll #8 00:00:55Z (RAM 1170 MB),
  attempt1 20/20 XONG 00:04:48Z; headroom 1614 → 1593; balloon boot 1 GHIM
  ĐÚNG trần 6.443.824 kB 1 mẫu, boot 2 XẢ (max 48,4% guard, 0 mẫu ở
  trần); WFS #48 chênh 0 (T2 đối chiếu khớp sau khi trừ file T5 tự
  tạo); KHÔNG reboot nữa sau boot 2 (boot 9afdaa89 sống tới lúc
  đóng).
