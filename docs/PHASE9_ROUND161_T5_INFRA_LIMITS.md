# PHASE9_ROUND161_T5_INFRA_LIMITS — WATCHER-160 CHẾT THEO #62 + WATCHER-161 KHỞI ĐỘNG TAY, EARLY-REPAIR KÍCH HOẠT, POSTBOOT_PASS #62 CÓ (REPAIR-1-PHAN, POLL=1); NGHỊCH LÝ ĐỒNG HỒ #62: H1 (T5) BỊ BÁC, H2 (T0) ĐỨNG

> Luồng T5, đợt 161, lượt cron 15:35 +07 21/11/2026 (mở
> 08:35:51Z; T5 mở thực tế ~08:37Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #62
> (ỨNG VIÊN — chờ parent xác nhận số hiệu, theo quy tắc đứng T0 ghi
> ứng viên, parent quyết) 39d46ba0-5724-4e4e-abec-a546d4d98ab2**
> (btime **GHI** 07:59:29Z — /proc/stat btime 1795247969; **btime THẬT
> ~08:13:30Z theo T0-161 §2.4, chờ T10 phán** — xem §4).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156, (o) đợt 157, (o) đợt 158,
> (o) đợt 159, (n) đợt 160): KHÔNG cài unit, KHÔNG thử lại (1)/(2).**
> Watcher-160 pid 4539 CHẾT theo reboot #62 (log dừng 08:13:13Z,
> poll cuối boot 52c957d5, 0 NEWBOOT — xem §4; **đối chiếu T0-161: T0 ghi
> "Watcher-160 CHẾT" + "T0/T5 THỐNG NHẤT về cái chết watcher-160" —
> KHỚP với T5**).
> **Watcher-161 khởi động bằng tay 08:40:01Z, pid 19861** (§3).
> **POSTBOOT_PASS cho #62 ĐÃ GHI 08:59:30Z (giờ ghi; boot+60m01s ghi /
> boot+46m00s thật, mode repair-som-quyet-h, poll=1)** — replay tự
> nhiên KHÔNG BAO GIỜ chạy trên #62 (dạng (B) "chậm mà không cài");
> EARLY-REPAIR (chiến lược (h) đợt 150) kích hoạt 08:46:02Z sau khi
> dpkg đóng băng 621 s; apt-get update ~12 phút + install ~10 giây;
> dpkg 2 → 795 dòng (mẫu repair-1-phan, khớp dots 140-boot2/142/150);
> GST symlink → debroot (269 file); kiểm chứng độc lập: postboot exit 0
> lúc 09:05:28Z, 11/11 gói + 5/5 lib (§3.1). **POSTBOOT_PASS cho #60
> KHÔNG CÓ, không bù được** — #60 là boot thứ 6 không có cờ (#51, #53,
> #54, #55, #57, #60), xem §4. **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 14 REBOOT LIÊN TIẾP
> #49–#62** (§2.1; T0-161 xác minh độc lập và KHỚP). **KHÔNG push.
> KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc T9). KHÔNG
> đụng file workflow (ci-security.yml vẫn 403 chờ user). TTS 39
> CẤM kiểm lại.
>
> **ĐÍNH CHÍNH QUAN TRỌNG — H1 BỊ BÁC (F-161-T5-2):** T5-161 lúc mở
> kết luận (H1) đồng hồ boot cũ nhanh ≥ +824 s, btime ghi là giờ thật.
> **Kết luận này SAI.** Bằng chứng quyết định (T0-161 §2.1–§2.2, T5
> kiểm lại độc lập §4): T7-160 đã neo đồng hồ boot cũ ĐÚNG ±1 s lúc
> **07:47:25Z thật** (Cloudflare), và 304 poll watcher-160 đều cách
> nhau **30/31 s (max 31 s)** — không có slew 2,2× nào trong 12 phút
> cuối đời. Đồng hồ cũ ĐÚNG lúc chết; poll cuối 08:13:13Z là GIỜ
> THẬT; reboot thật ~08:13:30Z; btime ghi CHẬM ~841 s. **T5 chấp
> nhận H2 (đồng hồ mới chậm lúc boot).** Cơ chế sửa đồng hồ mới vẫn
> chưa rõ (chỉ còn dạng slew dần — xem §4.3); giao T2-161. Mọi tuổi
> boot trong LIMITS này trình CẢ HAI khung (ghi/thật) và không trừ
> lẫn lộn hai khung trong một phép tính (bài học F-146/F-147/F-148-T7-1).

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ trong log là đồng hồ GHI của cell; giờ THẬT theo H2 ghi riêng nơi cần)

| Thời điểm (ghi) | Thời điểm (thật, H2) | Sự kiện |
|---|---|---|
| 05:25:49Z | 05:25:49Z | **Reboot #61, boot 52c957d5** (btime — T5-160 xác minh 5 nguồn; đồng hồ #61 đúng, Cloudflare ±1 s) |
| 05:41:26Z | 05:41:26Z | Watcher-160 START bằng tay, pid 4539, boot 52c957d5 |
| 05:52:59Z | 05:52:59Z | POSTBOOT_PASS #61 ghi (watcher-160, replay-day-du, poll=0) |
| 07:47:25Z | 07:47:25Z | **Neo Cloudflare của T7-160: đồng hồ boot cũ ĐÚNG ±1 s** (Cloudflare ts 1795247245 vs local 1795247244 — xem §4.1) |
| 07:59:29Z | **~08:13:30Z** | **Reboot #62 (ứng viên), boot 39d46ba0** — btime GHI 1795247969 = 07:59:29Z; btime THẬT ~08:13:30Z (T0-161 §2.4, khoảng (08:13:13Z, 08:13:43Z], offset +841 s) — #61 sống 9.220 s (ghi) / 10.061 s (thật) |
| 08:02:45Z | 08:02:45Z | T10-160 đóng cờ (round160-t10.done mtime — đồng hồ cũ đúng lúc đó) |
| 08:03:36Z | 08:03:36Z | **Run 160 SUCCEEDED** (DB host-side, eid 9668, attempt 1 — T0-161 §2.2; T7-161 phán verdict đầy đủ) |
| 08:13:13Z | 08:13:13Z | **Poll cuối watcher-160** (đồng hồ cũ = giờ thật; dpkg 1.545 ổn định) — CHẾT theo #62 ngay sau đó |
| 08:35:40Z | ~08:35:40Z | Hoạt động dpkg ĐẦU trên #62: 2 dòng "startup packages configure" (**boot+36m11s ghi / boot+22m10s thật — MUỘN NHẤT từ trước**, xem §3.1) |
| 08:35:51Z | 08:35:51Z | Lượt cron đợt 161 mở (giờ host) |
| ~08:37Z | ~08:37Z | T5-161 mở: boot 39d46ba0, **không watcher nào chạy**; không POSTBOOT_PASS cho #62; replay KHÔNG chạy (dpkg 2 dòng, 0 proc apt/dpkg) |
| 08:37:46Z | 08:37:46Z | T5 kiểm đồng hồ mới vs Cloudflare: local 08:37:46Z vs Cloudflare 08:37:48 GMT (+2 s) — ĐÚNG lúc đo |
| 08:40:01Z | ~08:40:01Z | **Watcher-161 START (bằng tay, bash显式 + setsid nohup), pid 19861, boot 39d46ba0** |
| 08:45:11Z | 08:45:11Z | T0-161 đóng cờ (round161-t0.done — ghi H2, chờ T10 phán) |
| 08:46:02Z | ~08:46:02Z | **EARLY-REPAIR TRIGGER** (boot_age 2.793 s ghi / 1.952 s thật; frozen 621 s; dpkg 2 dòng) → verify form-B postboot exit=1 → `--repair` bắt đầu |
| ~08:58:07Z | ~08:58:07Z | apt-get update xong (partial/ mtime 08:58:07Z; lists 5 → 66) — update mất ~12 phút |
| 08:59:17–08:59:26Z | 08:59:17–08:59:26Z | Installs: dpkg 2 → 795 dòng (106 install, gói cuối plugins-bad 08:59:26Z; dòng cuối libc-bin 08:59:29Z) |
| 08:59:29Z | 08:59:29Z | postboot poll1 sau repair **exit=0** |
| 08:59:30Z | 08:59:30Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 39d46ba0** (poll=1, repair-som-quyet-h) — boot+60m01s ghi / boot+46m00s thật |
| 09:05:28Z | 09:05:28Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 09:05:40Z | 09:05:40Z | Stats script T5: ENOSPC 26 dòng; MemAvailable 437.508 kB; sampler T9-161 29 mẫu, bal=6.443.824 (ghim trần) |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156 +
(o) đợt 157 + (o) đợt 158 + (o) đợt 159 + (n) đợt 160: **(3) LÀ
HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở, T5 khởi động lại bằng
tay. T5-161 kiểm tra lại nhanh `systemctl is-active` (§A.8):
user@0/logind/dbus vẫn inactive, không linger, không cron,
không /run/user/0 — cell không đổi, kết luận đợt 154–160 giữ nguyên
(lần kiểm tra lại thứ tám liên tiếp). Unit + script ở `round154-t5/`
GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 14 REBOOT LIÊN TIẾP #49–#62

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, #62; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156/157/158/159/160; không thuộc phạm vi T5-161) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#62 (14 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (13 reboot ở đợt 160 →
  14 reboot đợt này). Home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rebuild — khẳng định lần thứ
  mười bốn liên tiếp. **T0-161 xác minh độc lập và KHỚP**
  ("marker sống qua 14 reboot #49–#62").

## 3. Watcher-161 — chạy bằng tay (quy tắc đứng (3)) + EARLY-REPAIR

- **Trạng thái lúc mở (~08:37Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `ps -p 4539`: không có tiến trình). Ghi vào
  `round161-t5/watcher-status-at-open.txt`. **T0-161 xác minh
  độc lập và KHỚP** ("Lúc mở (~08:37Z): 0 watcher" — T0 quét
  toàn bộ `/proc/*/cmdline` + `kill -0` pid 4539; xem LIMITS T0-161
  §3). Watcher-160 pid 4539 đã chết theo reboot #62 (log dừng
  08:13:13Z, poll cuối boot 52c957d5, 0 NEWBOOT — xem §4).
- **Khởi động bằng tay 08:40:01Z, pid 19861** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-161-START 2026-11-21T08:40:01Z pid=19861
  boot=39d46ba0 btime=2026-11-21 07:59:29Z end=2026-11-21T11:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2
  init_md5=45c25fe2 init_mtime=08:35:41Z cache=0 lists=5 gst_sys=0`
  (giờ START và btime trong log là đồng hồ GHI; xem §4 về khung giờ.)
- **Thay đổi so với watcher-160 (3 điểm):**
  1. END = 11:30:00Z 21/11 (hạn cứng đợt 161 theo task); DIR =
     round161-t5, OLD_T5_DIR = round160-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #62 + trạng thái replay MỚI BẮT
     ĐẦU / CHƯA RÕ CÓ CHẠY KHÔNG lúc khởi động (dpkg 2 dòng, 0 proc
     apt/dpkg, hoạt động đầu 08:35:40Z = boot+36m11s ghi — MUỘN
     NHẤT từ trước) + dự kiến EARLY-REPAIR sớm nhất ~08:45:41Z
     nếu đóng băng.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[01]`/`08:30` + `bash -n` syntax OK)
     — bắt được 1 lỗi adapter trước khi khởi động (F-161-T5-3:
     sót tên file LOG chữ thường `replay-watch-160.log`).
- **Poll đều đã xác minh (trừ khối repair):** 08:40:01Z,
  08:40:31Z, …, 08:46:02Z (13 poll, đúng chu kỳ 30 s), rồi
  **khoảng trống 838 s trong log (08:46:02Z → 09:00:00Z)** —
  ĐÂY LÀ `--repair` CHẠY ĐỒNG BỘ trong vòng lặp watcher (verify +
  update + install + poll1), KHÔNG phải reboot hay bước nhảy
  đồng hồ (xem F-161-T5-6); sau đó poll lại đều 30 s (09:00:00Z,
  09:00:30Z, …, 09:05:30Z lúc kiểm cuối; 27 poll lúc ~09:07Z).
  Lúc 09:05:40Z log 32 dòng, 25 poll, 1 FLAG-WRITTEN, 1
  EARLY-REPAIR, 0 NEWBOOT, 0 END.
- **EARLY-REPAIR kích hoạt đúng thiết kế (h) đợt 150:**
  poll 08:46:02Z: `EARLY-REPAIR TRIGGER boot=39d46ba0
  boot_age=2793s frozen=621s dpkg_lines=2 — verify form-B truoc`
  (boot_age 2.793 s là khung GHI; khung THẬT ~1.952 s = 32m32s —
  xem §4.4). Verify form-B: postboot check-only **exit=1**
  (08:46:02Z, đúng như kỳ vọng — hệ thống thiếu toàn bộ) →
  `--repair` chạy 08:46:02Z → ~08:59:29Z (~13m27s). Guard file
  `repaired-39d46ba0` đã tạo (1 repair / 1 boot).

### 3.1 POSTBOOT_PASS cho #62 — CÓ QUA REPAIR-1-PHAN (KHÔNG PHẢI REPLAY ĐẦY ĐỦ)

- **Replay tự nhiên trên #62: KHÔNG BAO GIỜ CHẠY (dạng (B)
  "chậm mà không cài").** Bằng chứng: hoạt động dpkg đầu
  08:35:40Z (2 dòng "startup packages configure",
  boot+36m11s ghi / boot+22m10s thật) rồi IM HOÀN TOÀN — 0 tiến
  trình apt/dpkg lúc kiểm 08:37Z, 08:38Z, 08:40Z, 08:43Z;
  `/var/log/apt/` KHÔNG TỒN TẠI; lists 5 (chỉ cli.github.com);
  cache 0 .deb; GST hệ thống 0 file; dpkg.log đóng băng 2 dòng,
  md5 45c25fe2 không đổi suốt 08:35:41Z → 08:46:02Z (621 s).
  Cùng họ với boot #60? (Nov 16: 2 dòng rồi im) và các boot
  repair-1-phan dots 140-boot2/142/150.
- **Hoạt động dpkg đầu MUỘN NHẤT từ trước:** boot+36m11s (ghi)
  / boot+22m10s (thật) — muộn hơn #61 boot+9m50s và #59 boot+35s
  ở CẢ HAI khung. Chuỗi "khởi động muộn dần": #59 +35s → #61
  +9m50s → #62 +22m10s (thật). Xuất hiện 11 s TRƯỚC giờ mở đợt
  (08:35:40Z vs 08:35:51Z) — cùng mẫu #61 (12 s trước giờ mở) —
  có vẻ kích hoạt bởi máy móc mở đợt, không phải theo boot
  (T0-161 đồng ý ghi nhận, không suy đoán cơ chế).
- **Repair diễn ra (08:46:02Z → ~08:59:29Z, ~13m27s):**
  apt-get update ~08:46Z → ~08:58Z (~12 phút; partial/ mtime
  08:58:07Z; mirror khỏe — curl archive.ubuntu.com 200 trong
  0,9–1,4 s lúc 08:57Z; update chạy 0% CPU, chờ mạng — không
  phải kẹt); install 08:59:17Z–08:59:26Z (~10 giây);
  dpkg 2 → **795 dòng** (md5 b035e179; breakdown theo action:
  568 status + 110 configure + 106 install + 4 upgrade +
  4 startup + 3 trigproc — xem §3.2); gói cuối
  gstreamer1.0-plugins-bad 08:59:26Z; dòng cuối libc-bin
  08:59:29Z. Lists 5 → 66; cache 0 → 110 .deb; partial/ trống
  sau update.
- **REPAIR log (`t5-postboot-repair-39d46ba0.log`):** wrapper PASS
  (K1 còn nguyên); libs FAIL (thiếu cả 5 — đúng kỳ vọng);
  GST dir không tồn tại → **REPAIRED GST: symlink lại → debroot
  (269 file)**; apt FAIL (thiếu cả 11 gói) → apt-get update OK
  → **REPAIRED apt: đã cài đủ 11 gói**; RE-CHECK wrapper/libs/
  GST/apt **toàn PASS**; KẾT LUẬN "DU DIEU KIEN chay WebKit".
- **FLAG-WRITTEN 08:59:30Z** (`round161-t5/POSTBOOT_PASS`):
  `boot 39d46ba0-5724-4e4e-abec-a546d4d98ab2 (btime 2026-11-21
  07:59:29Z; watcher-161) — repair-som-quyet-h: dpkg 795 dong;
  cache 110 .deb; lists 66; postboot PASS poll1 doc lap exit 0
  luc 2026-11-21T08:59:29Z; POSTBOOT_PASS moi ghi 2026-11-21T08:59:30Z
  poll=1 (repair-som-quyet-h); co cu 52c957d5 luu POSTBOOT_PASS-52c957d5`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-52c957d5` đã đối chiếu bằng
  `diff` — KHỚP cờ #61 gốc (round160-t5).
- **Cờ lúc 08:59:30Z = boot+60m01s (ghi) / boot+46m00s (thật).**
  Chậm hơn #61 (boot+27m10s, replay tự nhiên) vì #62 phải chờ
  frozen 600 s + update ~12 phút — nhưng vẫn TRƯỚC hạn cờ
  ~11:00Z tới ~2 giờ. Cửa sổ hở của hướng (3) ở #62 dài hơn #61
  (replay không chạy, phải repair) — thiệt hại đo được: KHÔNG có
  (cờ có trước khi T4/T8-161 cần gate0; T4-161 poller chờ gate0
  theo đúng cơ chế).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-39d46ba0.log`, exit 0,
  09:05:28Z): wrapper PASS, libs PASS đủ 5, GST PASS (symlink →
  debroot, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5).
- **Phối hợp T4/T8-161:** poller T4-161 + harness T8-161 đọc
  `round161-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  08:59:30Z, TRƯỚC khi các luồng khác cần gate0.

### 3.2 dpkg 795 dòng — khớp mẫu repair-1-phan; làm rõ cách đếm 113/230

Tổng 795 dòng **KHỚP CHÍNH XÁC** mẫu repair-1-phan dots
140-boot2/142/150 (cùng 795 dòng, cùng gói cuối libc-bin).
Breakdown theo action field (awk, §A.4): 568 status + 110
configure + 106 install + 4 upgrade + 4 startup + 3 trigproc
= 795. Các LIMITS cũ ghi "113 installs / 230 configure" cho
cùng mẫu 795 dòng — T5-161 kiểm lại: `grep -c configure`
(không giới hạn từ) = **230**; `grep -c 'status installed'` =
**113**. Vậy 113/230 là cách đếm khác trên CÙNG MỘT file
(đếm cả dòng status), không phải file khác — không có mâu thuẫn
số liệu. T5-161 trình breakdown theo action field làm chuẩn
(106/4/110), kèm số 113/230 để đối chiếu.

## 4. Boot #61/#62 + nghịch lý đồng hồ — H1 (T5) BỊ BÁC, H2 (T0) ĐỨNG

### 4.1 Bằng chứng quyết định (T0-161 §2.1–§2.2; T5 kiểm lại độc lập)

1. **Neo Cloudflare muộn trên boot cũ (T7-160 §2.3, trích nguyên
   văn):** "Cloudflare ts 1795247245 vs local 1795247244 lúc
   ~05:39Z → local chậm 1 s; kiểm lại cuối phiên 07:47Z:
   Cloudflare ts 1795247245 vs local 1795247244 → local chậm
   1 s (trong ±1 s)". Tức lúc **07:47:25Z thật**, đồng hồ boot
   cũ đọc 07:47:24Z — **ĐÚNG ±1 s**, chỉ ~26 phút trước khi
   watcher-160 poll cuối.
2. **Poll watcher-160 đều 30/31 s (T5-161 kiểm lại độc lập từ
   log gốc — Phụ lục B):** 304 poll, 05:41:26Z → 08:13:13Z,
   khoảng giữa hai poll liên tiếp: 30 s ×286, 31 s ×17, **max
   31 s**; riêng 24 poll trong 12 phút cuối đời cũng chỉ 30/31 s.
   Vòng lặp watcher `sleep 30` theo monotonic + timestamp theo
   wall clock — nếu wall clock chạy nhanh 2,2×, các khoảng sẽ
   đọc ~66 s. KHÔNG CÓ khoảng nào như vậy. **Đồng hồ cũ KHÔNG
   slew trong 12 phút cuối đời.**
3. **(1)+(2) ⇒ đồng hồ cũ ĐÚNG lúc chết** (đúng lúc 07:47:25Z
   thật + tốc độ đúng sau đó) ⇒ poll cuối 08:13:13Z là GIỜ THẬT
   ⇒ reboot thật trong **(08:13:13Z, 08:13:43Z]** (sau poll cuối,
   trước poll kế tiếp không bao giờ chạy) ⇒ **btime ghi
   07:59:29Z CHẬM ~841 s** (khoảng +824–+854 s; T0 ước
   ~08:13:30Z, epoch 1795248810).
4. **DB host-side (T0-161 §2.2, T5 KHÔNG tự truy vấn lại — xem
   §9):** run 160 `e331115f-4655-4d69-b184-3da192d7a7e8`,
   scheduled/started 05:35:51Z, **finished_at
   2026-11-21T08:03:36+00:00, status succeeded, attempt 1**;
   chỉ 2 event — dispatched eid 9634 lúc 05:35:51.128Z,
   succeeded eid 9668 lúc 08:03:36.487Z; 0 viết lại, 0
   daemon-restart, 0 failure. Lag T10-160 đóng cờ → succeeded
   = 51,23 s — cùng họ run 159 (~89,7 s). Dưới H1, run 160 đã
   chết trước 08:03:36Z thật (cell chết 07:59:29Z thật) nên
   không thể succeed sạch lúc đó; dưới H2, cell còn sống tới
   ~08:13:30Z thật nên succeed 08:03:36Z là bình thường.
   Tiền đề: timestamp DB = giờ host thật (theo cách xử lý đứng
   T7-160 §3.3 + kiến trúc scheduler + Postgres host-side).
   Bằng chứng (1)–(3) độc lập với DB và cùng kết luận H2 —
   DB chỉ là nguồn thứ hai củng cố.
5. **Đồng hồ mới ĐÚNG lúc đo (T5 đo 2 lần):** 08:37:46Z local
   vs Cloudflare 08:37:48 GMT (+2 s); 09:05:40Z local vs
   Cloudflare 09:05:42 GMT (+2 s). GitHub −6/−7 s là edge lag,
   không dùng làm chuẩn (bài học F-159-T7-1).

### 4.2 Vì sao H1 của T5 sai (F-161-T5-2)

T5-161 lúc mở kết luận H1 (đồng hồ cũ nhanh ≥ +824 s) từ hai
luận cứ: (a) đồng hồ mới đúng vs Cloudflare lúc mở; (b) "không
có NTP trong cell → đồng hồ mới không thể từng chậm rồi tự sửa".
Cả hai đều không đủ:
- (a) chỉ chứng minh đồng hồ mới ĐÚNG LÚC ĐO, không chứng minh
  nó đúng lúc boot (T0-161 §2.3 đã chỉ ra; T5 ghi nhận).
- (b) chỉ loại cơ chế sửa TRONG cell; sửa host-side (ngoài cell)
  không để lại log trong cell nên không loại được bằng cách kiểm
  trong cell. T5 đã không kiểm (i) neo muộn trên boot cũ
  (T7-160 §2.3 có sẵn trong LIMITS) và (ii) tính đều của poll
  watcher-160 — hai kiểm này bác H1 trực tiếp. **Bài học:**
  trước khi quy một lệch đồng hồ về phía boot cũ, phải kiểm neo
  muộn trên boot cũ + tính đều của log heartbeat boot cũ.
- Kiểm đơn điệu timestamp journal (T5 đã chạy: 158 entry,
  07:59:40Z → 08:38:37Z, max gap 70 s — Phụ lục B) **KHÔNG
  phân định được H1/H2**: nó chỉ loại một bước nhảy ĐƠN LỚN sau
  khi journald chạy; không loại slew dần (nhiều bước nhỏ hoặc
  chỉnh tốc độ) — T0-161 §2.3 đã chỉ ra trước khi T5 chạy kiểm
  này. T5 ghi nhận kiểm này là không đủ, không dùng làm bằng
  chứng chính.

### 4.3 Cơ chế sửa đồng hồ mới (H2) — vẫn CHƯA RÕ; chỉ còn dạng slew dần

- Dạng (i) "sửa TRƯỚC entry journal đầu tiên (trong ~11 s đầu
  sau btime)" — **BỊ BÁC bởi /proc/1**: `/proc/1` mtime
  07:59:40Z (giờ ghi, +11 s sau btime ghi). PID 1 khởi động
  TRƯỚC journald; nếu đồng hồ đã sửa trong 11 s đầu thì
  /proc/1 đã đọc giờ đã sửa (~08:13:41Z thật). Nó vẫn đọc
  07:59:40Z (chậm) ⇒ **không có sửa nào trước boot+11s**.
  (T0-161 §2.3 nêu dạng (i) mà chưa đối chiếu /proc/1 — T5 bổ
  sung điểm này.)
- Dạng (ii) "slew dần bằng nhiều bước nhỏ / chỉnh tốc độ" —
  **CÒN LẠI DUY NHẤT, cơ chế chưa rõ.** Nó đòi hỏi một tác nhân
  chỉnh đồng hồ ngoài cell (host-side) vì trong cell không có
  NTP/timesyncd/chrony (T5 kiểm: không unit timesyncd, không
  process NTP, `timedatectl` không nối được bus; clocksource
  là tsc). T5 không suy đoán cơ chế; giao T2-161 (mô hình đồng
  hồ) điều tra thêm; hướng kiểm đầu tiên là host-side (runtime
  đặt giờ VM lúc boot) theo đề xuất T0-161 §2.3.
- Hệ quả thực hành: **mọi tuổi boot / khoảng thời gian tính từ
  btime GHI trong phiên này đều lệch ~841 s so với khung thật**
  (xem §4.4). Watcher chỉ thấy đồng hồ ghi nên mọi logic theo
  boot-age của nó (cổng boot+15m của (h)) cũng chạy trên khung
  ghi — xem §4.4.

### 4.4 Bảng hai khung giờ (ghi / thật) — KHÔNG trừ lẫn lộn

Offset +841 s (T0 ước, khoảng +824–+854 s; chờ T10 chốt số
chính thức). Giả định chuyển đổi: slew xong trước ~08:35:40Z
ghi (gợi ý từ mốc mở đợt: hoạt động dpkg đầu 08:35:40Z ghi =
11 s trước giờ mở đợt theo giờ host 08:35:51Z — khớp mẫu #61;
nếu slew chưa xong lúc đó thì các giờ thật sau mốc này còn lệch
một phần — T10 lưu ý).

| Mốc | Giờ ghi | Giờ thật (H2) | Tuổi boot (ghi) | Tuổi boot (thật) |
|---|---|---|---|---|
| btime #62 | 07:59:29Z | ~08:13:30Z | — | — |
| Hoạt động dpkg đầu | 08:35:40Z | ~08:35:40Z | boot+36m11s | boot+22m10s |
| Watcher-161 START | 08:40:01Z | ~08:40:01Z | boot+40m32s | boot+26m31s |
| EARLY-REPAIR trigger | 08:46:02Z | ~08:46:02Z | boot+46m33s | boot+32m32s |
| apt-get update xong | ~08:58:07Z | ~08:58:07Z | boot+58m38s | boot+44m37s |
| Installs | 08:59:17–26Z | 08:59:17–26Z | boot+59m48s–59m57s | boot+45m47s–45m56s |
| postboot poll1 exit 0 | 08:59:29Z | 08:59:29Z | boot+60m00s | boot+45m59s |
| FLAG-WRITTEN #62 | 08:59:30Z | 08:59:30Z | boot+60m01s | boot+46m00s |

- Tuổi boot #61: **9.220 s (2h33m40s) theo btime ghi /
  10.061 s (2h47m41s) theo btime thật** (05:25:49Z →
  ~08:13:30Z). T5 lúc mở ghi nhầm 8.620 s — sai 600 s
  (F-161-T5-1; đã sửa trong status file + LIMITS này).
- Cổng boot+15m của (h): watcher tính bằng btime GHI
  (1795247969) nên cổng mở lúc 08:14:29Z ghi = boot+~1m thật
  (đã qua từ lâu); ràng buộc thực sự kích hoạt repair là
  frozen ≥600 s (621 s ghi; nếu slew xong trước 08:35:41Z ghi
  thì đây cũng là số thật). Repair vẫn kích hoạt ở poll đầu
  tiên thỏa frozen — không bị chậm thêm vì lệch đồng hồ.
  T10 lưu ý khi đánh giá (h): cổng boot-age không đáng tin khi
  btime chậm; frozen mới là chốt chặn thật.
- Reboot #62 xảy ra GIỮA hai đợt theo giờ thật (sau T10-160
  đóng 08:02:45Z ~10'45", trước đợt 161 mở 08:35:51Z ~22'21")
  — không phá lượt đo nào trong đợt 160. Câu "KHÔNG có reboot
  mới trong lúc T10 đóng sổ" của T10-160 **ĐỨNG** theo giờ thật.
- **Boot #60 (e590ae0a, btime 03:05:59Z): KHÔNG CÓ cờ.**
  Bằng chứng: không file `POSTBOOT_PASS*` nào cho e590ae0a
  trong round159-t5/ lẫn round160-t5/ lẫn round161-t5/ (kiểm
  trực tiếp từng đường dẫn, §A.2c); không watcher nào sống
  trong #60; journal chỉ còn #62 (volatile theo rebuild) nên
  không còn dấu vết replay #60 trên đĩa. **Không bù được**
  (cùng tiền lệ #51/#53/#54/#55/#57 theo quyết (o) đợt 156).
- **#60 là boot thứ 6 không có cờ** (danh sách đầy đủ: #51,
  #53, #54, #55, #57, #60 — #61 ĐÃ CÓ cờ nên chuỗi dừng ở 6).
- **Watcher-160 pid 4539 CHẾT theo reboot #62 — bằng chứng
  log của T5:** `replay-watch-160.log` 309 dòng, 304 poll,
  0 NEWBOOT, 1 FLAG-WRITTEN, 0 END, 0 EARLY-REPAIR; dòng cuối
  **08:13:13Z boot 52c957d5** (poll bình thường, dpkg 1.545 ổn
  định); **KHÔNG có dòng REPLAY-WATCH-160-END** (hạn 08:30:00Z
  chưa tới) và **KHÔNG có dòng watcher-stop** — watcher không
  thoát tự nhiên theo logic script mà dừng giữa chu kỳ poll,
  đúng lúc boot đổi. Cùng mẫu watcher-159/#60 (log dừng
  03:06:26Z, 0 NEWBOOT). Poll đều 30 s suốt phiên (05:41:26Z →
  08:13:13Z; 286 khoảng 30 s + 17 khoảng 31 s — Phụ lục B).
- **Đối chiếu T0-161:** cờ round161-t0.done (~08:45Z) ghi
  "Watcher-160 CHẾT theo reboot #62" + "T0/T5 THỐNG NHẤT về
  cái chết watcher-160" — **KHỚP với T5** và **KHÔNG đưa ra suy
  luận nguyên nhân chết nào khác**. Không còn mâu thuẫn T0 vs T5
  ở đợt này (đợt thứ hai liên tiếp). T0-161 cũng xác minh độc
  lập số hiệu #62 (7 nguồn), marker sống qua 14 reboot — TẤT
  CẢ KHỚP với T5. **Bất đồng duy nhất là H1 vs H2 — T5 đã
  chấp nhận H2 (xem §4.1–§4.2); chờ T10 phán.**

## 5. Quy tắc đứng (3) — áp dụng trong đợt 161

- T0-161 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-161
  xác minh độc lập "Watcher: 0 lúc mở" — KHỚP với T5. T5 tự
  khởi động lại pid 19861 ~08:40Z (ghi trong
  `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #62: ~60 phút (ghi) / ~46 phút
  (thật) tới cờ** — DÀI HƠN #61 (~27 phút) vì replay không chạy
  và phải repair (frozen 600 s + update ~12 phút). Đây là
  khoảng hở đã biết của hướng (3): cờ chỉ có khi có phiên T5
  sau reboot + repair xong. #60 vẫn là boot lọt hoàn toàn
  không cờ gần nhất — #62 ĐÃ BẮT ĐƯỢC nhờ (h) repair.
- **Watcher-161 tiếp tục giám sát tới 11:30:00Z**; nếu có reboot
  #63 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-162 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-161 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **437.508 kB @09:05:40Z** (thấp — T9 theo
  dõi; sampler T9-161 29 mẫu 08:37:31–09:05:32Z, mem cuối
  423.592 kB, **bal=6.443.824 (ghim trần)**); MemFree 143.792 kB.
  loadavg 0,74 @09:05:40Z. Sampler T9-161 ĐANG CHẠY
  (ram-sampler.log 29 mẫu, boot 39d46ba0); b2-watcher pid 3972
  đang chạy.
- **ENOSPC journal boot #62:** **26 dòng** lúc 09:05:40Z
  (journal 250 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-161 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. So sánh: #61 có 18 dòng lúc T5-160 đo
  (06:15:52Z); #62 đã 26 dòng lúc 09:05:40Z (boot+~52m thật).
- **Không reboot mới trong phiên T5** (boot vẫn 39d46ba0 lúc
  kiểm cuối ~09:07Z — KHÔNG có #63; watcher-161 tiếp tục
  giám sát tới hạn cứng 11:30:00Z).
- **journal_boots chỉ còn 1 boot (#62):** journal của #61
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 162 (từ T5-161)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 14 reboot
   #49–#62. T5-162 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #62 — XONG 08:59:30Z** (watcher-161,
   repair-som-quyet-h, poll=1; T4/T8-161 phối hợp qua cờ).
   Watcher-161 tiếp tục giám sát tới 11:30:00Z; nếu có reboot
   #63 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-162 kiểm tra log.
4. **POSTBOOT_PASS #60 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 6 không cờ; cùng tiền lệ #51/#53/#54/#55/#57).
   Chỉ thiếu cờ watcher (dữ kiện #60 chỉ còn cờ T7/T10).
5. **Nghịch lý đồng hồ #62 — H2 ĐỨNG (chờ T10 phán):**
   btime thật ~08:13:30Z (offset +841 s, khoảng +824–+854 s);
   cơ chế slew dần chưa rõ — giao T2-161 điều tra. Mù #93?
   đoạn L phụ thuộc btime #62: T2-161 nêu rõ dùng khung nào
   (ghi/thật) và vì sao; KHÔNG trừ lẫn lộn hai khung trong một
   phép tính. T7-161 kiểm điểm (m) #62 theo btime thật.
6. **Replay khởi động muộn dần: #59 boot+35s → #61 boot+9m50s
   → #62 boot+22m10s (thật).** #62 là muộn nhất từ trước ở cả
   hai khung. Nếu #63 cũng khởi động muộn >20' (thật) thì đây
   là mẫu (3 boot liên tiếp muộn dần) — T5-162 ghi nhận.
   Replay #62 KHÔNG BAO GIỜ chạy tự nhiên (dạng (B)) — nếu #63
   cũng vậy thì đây là boot thứ hai liên tiếp cần repair.
7. **Cổng boot+15m của (h) không đáng tin khi btime chậm**
   (xem §4.4): cổng mở theo btime ghi; frozen ≥600 s mới là
   chốt chặn thật. Không đổi logic đợt này — chỉ ghi nhận để
   T10 đánh giá (h).
8. **GST trên #62 là SYMLINK → debroot** (repair tạo 08:46Z,
   ephemeral — mất sau reboot; boot sau phải làm lại qua
   replay/repair). Khác #61 (thư mục thật apt, 269 file).
9. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll1 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #62): T5 đợt sau quyết có cập nhật theo Dot
   hay không. Đây là nợ thẩm mỹ trong log header, không ảnh
   hưởng kết quả check.
10. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
    của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
    yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
    quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
    403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
    G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
    theo quyết (g) đợt 143. u2net là fallback chính thức cho
    birefnet.

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này replay #62 không chạy
  tự nhiên nhưng (h) repair đã bắt được cờ ở boot+46m00s thật,
  trước hạn cờ ~2 giờ. T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ tám liên tiếp.
- **H1 vs H2: T5 ĐỀ XUẤT CHẤP NHẬN H2** (btime thật ~08:13:30Z,
  offset +841 s) — căn cứ §4.1 (neo Cloudflare 07:47:25Z +
  poll đều 30/31 s + DB run 160). T10 phán cuối; nếu parent
  chọn H1 thì mọi tuổi boot trong LIMITS này phải đọc theo
  khung ghi (bảng §4.4 đã trình cả hai khung để đổi được).
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #60 từ log của
  T7/T10-160** (xem §4) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #60 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Số hiệu #62 vẫn là ứng viên chờ parent xác nhận** (T0-161
  §1) — T5 dùng "#62 (ứng viên)" trong LIMITS này theo đúng
  quy tắc đứng.
- **Bất đồng T0 vs T5 về H1/H2 đợt này đã được T5 tự đính
  chính (chấp nhận H2) trước khi đóng cờ** — T10 chỉ cần phán
  xác nhận, không cần phân xử hai bên nữa (khác đợt 159, T10
  phải phán T5 đúng).

## 9. Sai số của chính T5-161

- **F-161-T5-1 — Sai số học tuổi boot #61 trong
  `watcher-status-at-open.txt`:** T5 ghi "#61 sống 8.620 s
  (~2h23m40s, 05:25:49Z→07:59:29Z)" — sai 600 s so với chính
  hai mốc T5 nêu (05:25:49Z → 07:59:29Z = **9.220 s**).
  T0-161 bắt được và đối chiếu trong LIMITS T0-161 §2.4.
  **ĐÃ SỬA** trong status file (9.220 s ghi / 10.061 s thật)
  và LIMITS này (§4.4). Cùng họ bài học rounds 126–127
  (không cộng/trừ lũy kế bằng tay — tính lại từ endpoint thô
  bằng `date -d`).
- **F-161-T5-2 — H1 SAI (xem §4.2):** T5 kết luận đồng hồ cũ
  nhanh ≥ +824 s mà không kiểm neo muộn trên boot cũ (T7-160
  §2.3: Cloudflare 07:47:25Z) và tính đều poll watcher-160.
  Hai kiểm này bác H1 trực tiếp. **T5 chấp nhận H2.** Bài học
  giữ nguyên: luôn kiểm neo muộn + tính đều heartbeat trước khi
  quy lệch đồng hồ về một phía; kiểm đơn điệu journal không đủ
  để phân định.
- **F-161-T5-3 — Adapter sót tên file LOG chữ thường (ĐÃ BẮT
  VÀ SỬA TRƯỚC KHI KHỞI ĐỘNG):** bản adapter đầu tiên thay
  `REPLAY-WATCH-160` → `REPLAY-WATCH-161` (hoa) nhưng sót
  `replay-watch-160.log` (thường) ở dòng `LOG=$DIR/...` — grep
  kiểm + đọc lại toàn bộ script trước khi khởi động đã bắt
  được; đã sửa adapter (thêm thay thế thường) + chạy lại +
  `bash -n` OK. Watcher chưa từng chạy với LOG sai. Cùng họ
  F-159-T5-2 (đọc lại toàn bộ trước khi khởi động).
- **F-161-T5-4 — `pgrep -af ram-sampler` / `b2-watcher` tự khớp
  shell exec của chính T5** (cùng họ F-156-T5-1/F-157-T5-1/
  F-158-T5-1/F-159-T5-1/F-160-T5-1). Trong stats §7: dòng
  sampler_proc/b2_watcher_proc chứa `/bin/sh -c pgrep ...` —
  bằng chứng thật là file ram-sampler.log (29 mẫu, boot
  39d46ba0) + b2-watcher pid 3972 (cmdline là đường dẫn script)
  + dòng sampler_proc đầu (pid 7756, lệnh sleep 1740 của T9).
  Bài học giữ nguyên: luôn neo pid trực tiếp + đối chiếu
  log/file, không tin mù pgrep.
- **F-161-T5-5 — grep boot8 trong stats §2c match các file do
  chính T5-161 viết** (cùng họ F-160-T5-2): §A.2c liệt kê
  `watcher-status-at-open.txt`, `make-watcher-161.py`,
  `replay-watch-161.sh`, `t5-stats-161.py` chứa chuỗi 39d46ba0
  — đó là tham chiếu do T5 viết, KHÔNG phải cờ POSTBOOT_PASS
  cho #62 ngoài cờ chính. Kết luận "#60 KHÔNG CÓ cờ" dựa trên
  việc KHÔNG tồn tại file `POSTBOOT_PASS-e590ae0a` nào (kiểm
  trực tiếp từng đường dẫn), không dựa trên grep.
- **F-161-T5-6 — Khoảng trống 838 s trong log watcher-161
  (08:46:02Z → 09:00:00Z) KHÔNG phải reboot hay bước nhảy đồng
  hồ:** đó là `--repair` chạy đồng bộ trong vòng lặp watcher
  (verify + apt-get update ~12 phút + install + poll1).
  Ghi nhận để T10 khỏi nhầm là watcher chết/sống lại.
- **Giới hạn xác minh (không phải sai số):** T5-161 xác minh
  boot #62 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + wtmp; kiểm tra đồng hồ
  so với Cloudflare 2 lần (±2 s @08:37Z và @09:05Z — T5 đo
  trực tiếp). T5 KHÔNG tự truy vấn scheduler DB (số liệu run
  160 lấy từ T0-161 §2.2, đã nêu rõ nguồn); đóng góp độc lập
  của T5 cho phán H1/H2 là neo Cloudflare T7-160 + kiểm poll
  đều (§4.1 mục 1–3), không phụ thuộc DB. Btime #61
  (05:25:49Z) lấy từ T5-160 (đã xác minh 5 nguồn đợt trước);
  btime #60 (03:05:59Z) lấy từ cờ T10-159 + task, không xác
  minh độc lập được từ #62 (journal volatile).
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-161.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (39d46ba0, btime
  ghi 07:59:29Z) — và KHỚP xác minh độc lập 7 nguồn của T0-161
  (về btime GHI; giờ THẬT theo §4). Exec khởi động watcher lần
  này KHÔNG báo output_drain_timeout (nhờ nohup redirect ra
  file; watcher chạy đúng: START 08:40:01Z pid 19861 +
  EARLY-REPAIR 08:46:02Z + FLAG-WRITTEN 08:59:30Z + poll đều
  sau đó).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t5/t5-stats-161.py`
(output đầy đủ lưu tại `t5-stats-161-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 09:05:40Z, SAU khi cờ POSTBOOT_PASS #62
đã ghi; F-161-T5-4: dòng sampler_proc/b2_watcher_proc trong §7
tự khớp shell exec của T5 — bằng chứng thật là file
ram-sampler.log 29 mẫu boot 39d46ba0 + b2-watcher pid 3972;
F-161-T5-5: §2c grep match file do chính T5 viết — kết luận
"#60 KHÔNG CÓ cờ" dựa trên kiểm đường dẫn trực tiếp).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-161 (trich bang script, 2026-11-21T09:05:40Z) ===

--- 1. Boot hien tai ---
boot_id=39d46ba0-5724-4e4e-abec-a546d4d98ab2
btime_epoch=1795247969 = 2026-11-21T07:59:29Z
uptime_s=3971.14 now=2026-11-21T09:05:40Z
/proc/1 mtime=2026-11-21 07:59:40.373751357 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 39d46ba057244e4eabeca546d4d98ab2 Sat 2026-11-21 07:59:40 UTC Sat 2026-11-21 09:04:57 UTC
clocksource=tsc
local_date=Sat Nov 21 09:05:40 UTC 2026
cloudflare_date=Date: Sat, 21 Nov 2026 09:05:42 GMT
github_date=Date: Sat, 21 Nov 2026 09:05:33 GMT

--- replay-watch-160.log ---
tong_dong=309
START=1 poll=304 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-160-START 2026-11-21T05:41:26Z pid=4539 boot=52c957d5 btime=2026-11-21 05:25:49Z end=2026-11-21T08:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=88334c78 init_mtime=05:35:40Z cache=0 lists=3 gst_sys=0
dong_cuoi: 2026-11-21T08:13:13Z boot=52c957d5 poll dpkg_lines=1545 md5=3411a9cc apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=71
boot_xuat_hien=['52c957d5']
mtime_log=2026-11-21T08:13:14Z size=38077

--- replay-watch-161.log ---
tong_dong=32
START=1 poll=25 NEWBOOT=0 END=0 EARLY-REPAIR=1 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-161-START 2026-11-21T08:40:01Z pid=19861 boot=39d46ba0 btime=2026-11-21 07:59:29Z end=2026-11-21T11:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=45c25fe2 init_mtime=08:35:41Z cache=0 lists=5 gst_sys=0
dong_cuoi: 2026-11-21T09:05:30Z boot=39d46ba0 poll dpkg_lines=795 md5=b035e179 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=66
boot_xuat_hien=['39d46ba0']
mtime_log=2026-11-21T09:05:30Z size=3819

--- 2c. POSTBOOT_PASS theo boot ---
  #62 39d46ba0: file_chua=round161-t5/watcher-status-at-open.txt, make-watcher-161.py, replay-watch-161.sh, replay-watch-161.log, t5-stats-161.py, POSTBOOT_PASS (chi la tham chieu do T5 viet — xem F-161-T5-5; co chinh la POSTBOOT_PASS)
  #61 52c957d5: file_chua=round160-t5/watcher-status-at-open.txt, replay-watch-160.sh, replay-watch-160.log, t5-stats-160-mid.txt, POSTBOOT_PASS, t5-stats-160-output.txt + round161-t5/watcher-status-at-open.txt, make-watcher-161.py, replay-watch-161.sh, replay-watch-161.log, t5-stats-161.py, POSTBOOT_PASS-52c957d5, POSTBOOT_PASS
  #60 e590ae0a: file_chua=round160-t5/replay-watch-160.sh, t5-stats-160.py, t5-stats-160-mid.txt, t5-stats-160-output.txt + round161-t5/t5-stats-161.py (chi la tham chieu lich su do T5 viet — xem F-161-T5-5)
  round161-t5/POSTBOOT_PASS: CO
  round161-t5/POSTBOOT_PASS-39d46ba0: KHONG CO
  round160-t5/POSTBOOT_PASS: CO
  round160-t5/POSTBOOT_PASS-52c957d5: KHONG CO
  round159-t5/POSTBOOT_PASS-e590ae0a: KHONG CO

--- 3. round161-t5/POSTBOOT_PASS (mtime 2026-11-21T08:59:30Z) ---
boot 39d46ba0-5724-4e4e-abec-a546d4d98ab2 (btime 2026-11-21 07:59:29Z; watcher-161) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 66; postboot PASS poll1 doc lap exit 0 luc 2026-11-21T08:59:29Z; POSTBOOT_PASS moi ghi 2026-11-21T08:59:30Z poll=1 (repair-som-quyet-h); co cu 52c957d5 luu POSTBOOT_PASS-52c957d5

--- 3. round160-t5/POSTBOOT_PASS (mtime 2026-11-21T05:52:59Z) ---
boot 52c957d5-a8dd-4523-822f-acfcde535d3b (btime 2026-11-21 05:25:49Z; watcher-160) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 71; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T05:52:59Z; POSTBOOT_PASS moi ghi 2026-11-21T05:52:59Z poll=0 (replay-day-du); co cu eec65561 luu POSTBOOT_PASS-eec65561

--- 3b. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20T11:39:47Z

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=795 md5=b035e179 mtime=2026-11-21 08:59:29.339616541 +0000
dpkg_breakdown install=106 upgrade=4 configure=110
cache_deb=110 lists_entries=66
gst_sys_files=269
apt_procs= dpkg_procs=

--- 5. Trang thai 11 goi + 5 lib ---
  libevent-2.1-7t64: installed
  gstreamer1.0-plugins-base: installed
  gstreamer1.0-plugins-good: installed
  gstreamer1.0-plugins-bad: installed
  gstreamer1.0-plugins-ugly: installed
  gstreamer1.0-gl: installed
  gstreamer1.0-libav: installed
  gstreamer1.0-x: installed
  libavif16: installed
  libgstreamer1.0-0: installed
  libevdev2: installed
  libevent-2.1.so.7: CO
  libEGL.so.1: CO
  libavif.so.16: CO
  libdw.so.1: CO
  libevdev.so.2: CO

--- 6. ENOSPC journal boot hien tai ---
ENOSPC_dong=26
journal_dong=250

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          143792 kB
MemAvailable:     437508 kB
loadavg=0.74 0.56 0.74 1/453 36096
sampler round161-t9/ram-sampler.log: tong_mau=29 dau=2026-11-21T08:37:31 cuoi=2026-11-21T09:05:32Z boot=39d46ba0 mem=423592 bal=6443824 swapfree=659252 load1=0.21
sampler_proc=(co dong tu khop shell exec cua T5 — xem F-161-T5-4; bang chung that: ram-sampler.log 29 mau + b2-watcher pid 3972)
b2_watcher_proc=3972 bash round161-t9/b2-watcher.sh

--- 8. systemd user manager ---
user_at_0=inactive
logind=inactive
dbus=inactive
inactive
user_runtime_dir_0=inactive
systemctl_--user=Failed to connect to bus: No such file or directory
loginctl=Failed to connect to bus: No such file or directory
linger_dir=KHONG CO
config_marker=CO
cron_unit=Unit cron.service could not be found. which_cron=

--- 9. Co round161 .done (luc 09:05:40Z) ---
round161-t0.done (08:45:11Z), round161-t1.done (08:51:38Z), round161-t2.done (09:01:20Z), round161-t6.done (08:50:04Z)

=== HET PHU LUC T5-161 2026-11-21T09:05:42Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-39d46ba0.log`,
09:05:28Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.9):

```
[postboot 2026-11-21 07:59:29] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 07:59:29] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 07:59:29] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là symlink -> /home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0 (vá tạm K1, ephemeral)
[postboot 2026-11-21 07:59:29] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 07:59:29] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 07:59:29] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 07:59:29] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 07:59:29)
```

Log repair của watcher (`t5-postboot-repair-39d46ba0.log`, 08:46:02Z →
~08:59:29Z — trích phần REPAIR/RE-CHECK; header log còn ghi Dot 151):

```
[postboot 2026-11-21 07:59:29] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 07:59:29] FAIL libs: thiếu: libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2
[postboot 2026-11-21 07:59:29] FAIL GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 không tồn tại
[postboot 2026-11-21 07:59:29] INFO GST: file plugin hệ thống=0, debroot=269
[postboot 2026-11-21 07:59:29] FAIL GST: thiếu isomp4=1 libav=1 — decode mp4/H.264 qua plugin hệ thống chưa đủ
[postboot 2026-11-21 07:59:29] REPAIRED GST: symlink lại -> debroot (269 file)
[postboot 2026-11-21 07:59:29] FAIL apt: chưa cài: libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0 libevdev2 (replay hệ thống có thể đang cài dần — kiểm tra ps apt/dpkg)
[postboot 2026-11-21 07:59:29] INFO apt: lists có thể trống sau reboot — chạy apt-get update trước khi install
[postboot 2026-11-21 07:59:29] INFO apt: apt-get update OK (xem /tmp/l8-postboot-apt.log)
[postboot 2026-11-21 07:59:29] REPAIRED apt: đã cài: libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0 libevdev2
[postboot 2026-11-21 07:59:29] RE-CHECK wrapper: PASS (đã vá K1)
[postboot 2026-11-21 07:59:29] RE-CHECK libs: PASS đủ 5 lib sau repair
[postboot 2026-11-21 07:59:29] RE-CHECK GST: PASS đủ isomp4 + libav
[postboot 2026-11-21 07:59:29] RE-CHECK apt: PASS đủ 11 package
[postboot 2026-11-21 07:59:29] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 07:59:29)
```

## Phụ lục B. Kiểm chứng độc lập thêm của T5-161 (script một lần, không gõ tay)

**B.1 Tính đều poll watcher-160 (bác H1 — xem §4.1 mục 2):**
304 poll, 05:41:26Z → 08:13:13Z; khoảng giữa hai poll liên tiếp:
30 s ×286, 31 s ×17, max 31 s, min 30 s. Riêng 24 poll trong 12
phút cuối đời (sau 08:01:13Z đồng hồ cũ): chỉ 30/31 s, max 31 s.
Không có khoảng ~66 s nào (dấu hiệu wall clock chạy 2,2×).
Neo Cloudflare T7-160: epoch 1795247245 = 2026-11-21T07:47:25Z.

**B.2 Tính đều poll watcher-161:**
27 poll lúc ~09:07Z; khoảng: 30 s ×24, 31 s ×1, **838 s ×1** —
khoảng 838 s là `--repair` chạy đồng bộ trong vòng lặp watcher
(08:46:02Z → 09:00:00Z), KHÔNG phải reboot hay bước nhảy đồng hồ
(xem F-161-T5-6).

**B.3 Kiểm đơn điệu timestamp journal boot #62 (KHÔNG phân định
H1/H2 — xem §4.2):** 158 entry, 1795247980 (07:59:40Z) →
1795250317 (~08:38:37Z); jumps >60 s: 32, tất cả đều đúng 70 s
(cadence đều đặn của một timer, không phải bước nhảy đồng hồ);
max gap 70 s; min delta 0 s. Không có bước nhảy ~841 s nào —
chỉ loại được bước nhảy ĐƠN LỚN sau khi journald chạy, không
loại được slew dần.

**B.4 Cách đếm dpkg 795 dòng (xem §3.2):** theo action field
(awk): 568 status + 110 configure + 106 install + 4 upgrade +
4 startup + 3 trigproc = 795. `grep -c install` (không giới hạn
từ) = 329; `grep -c configure` = 230; `grep -c 'status
installed'` = 113; `grep -c 'status half-configured'` = 117.
Vậy "113 installs / 230 configure" trong các LIMITS cũ là cách
đếm khác trên cùng một file 795 dòng — không mâu thuẫn.

**B.5 apt-get update trong repair (tiến triển, không kẹt):**
pid 25789 chạy 08:46Z → ~08:58Z (~12 phút), 0% CPU (chờ mạng);
partial/ 334 MB lúc 08:56Z (azure + cogentco), dir mtime
08:58:07Z; curl archive.ubuntu.com 200 trong 0,9–1,4 s lúc
08:57Z (mirror khỏe); sau update: partial/ trống, lists 66.

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round161-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t5/`
  (không nằm trong repo nên không stage): `replay-watch-161.sh`,
  `make-watcher-161.py`, `t5-stats-161.py`,
  `t5-stats-161-output.txt`, `replay-watch-161.log`,
  `replay-watch-161.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-52c957d5`,
  `t5-postboot-poll1-39d46ba0.log`,
  `t5-postboot-verify-39d46ba0.log`,
  `t5-postboot-repair-39d46ba0.log`,
  `t5-postboot-independent-39d46ba0.log`, `repaired-39d46ba0`.
