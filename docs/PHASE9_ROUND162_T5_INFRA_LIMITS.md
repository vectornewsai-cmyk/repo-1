# PHASE9_ROUND162_T5_INFRA_LIMITS — WATCHER-161 CHẾT THEO #63 + WATCHER-162 KHỞI ĐỘNG TAY, POSTBOOT_PASS #64 CÓ (REPLAY-DAY-DU, POLL=0); #63 LÀ BOOT THỨ 7 KHÔNG CỜ; KHÔNG NGHỊCH LÝ ĐỒNG HỒ Ở #64

> Luồng T5, đợt 162, lượt cron 18:35 +07 21/11/2026 (mở
> 11:35:51Z; T5 mở thực tế ~11:37Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #64
> (ỨNG VIÊN — chờ parent xác nhận số hiệu, theo quy tắc đứng T0 ghi
> ứng viên, parent quyết) d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7**
> (btime **11:15:18Z** — /proc/stat btime 1795259718; **btime LÀ GIỜ
> THẬT** — xem §4: uptime khớp btime từng giây, /proc/1 +11 s,
> journal +11 s, Cloudflare ±1–2 s; T0-162 xác minh độc lập 9 nguồn
> và KHỚP).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156, (o) đợt 157, (o) đợt 158,
> (o) đợt 159, (n) đợt 160, (n) đợt 161): KHÔNG cài unit, KHÔNG thử
> lại (1)/(2).** Lần kiểm tra lại thứ chín liên tiếp (§2).
> Watcher-161 pid 19861 CHẾT theo reboot #63 (log dừng 10:30:39Z,
> poll cuối boot 39d46ba0, 0 NEWBOOT — xem §4; **đối chiếu T0-162:
> T0 ghi "watcher-161 chết từ #63 (poll cuối 10:30:39Z)" — KHỚP
> với T5**).
> **Watcher-162 khởi động bằng tay 11:40:00Z, pid 18801** (§3).
> **POSTBOOT_PASS cho #64 ĐÃ GHI 11:40:00Z (boot+24m42s, mode
> replay-day-du, poll=0)** — replay tự nhiên CHẠY ĐẦY ĐỦ trên #64
> (khác #62 dạng (B)); hoạt động dpkg đầu 11:35:40Z = boot+20m22s;
> dpkg 1.545 dòng (md5 335dc3f2); kiểm chứng độc lập: postboot exit 0
> lúc 11:41:07Z, 11/11 gói + 5/5 lib (§3.1). **POSTBOOT_PASS cho #63
> KHÔNG CÓ, không bù được** — #63 là boot thứ 7 không có cờ (#51,
> #53, #54, #55, #57, #60, #63), xem §4. **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 16 REBOOT LIÊN TIẾP
> #49–#64** (§2.1; T0-162 ghi "15 reboot #49–#64" — lệch 1 so với
> phép đếm trực tiếp của T5, chờ T10 phán, xem F-162-T5-6).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc
> T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.
>
> **ĐÍNH CHÍNH QUAN TRỌNG — OVERLAP #62 ĐÚNG, H1/H2 ĐỀU BỊ BÁC
> (T10-161 §10.5 aggregate 161, parent quyết (q) đợt 161):**
> Header comment trong `replay-watch-162.sh` (viết trước khi T5 đọc
> GAP §90) còn ghi "T5 chấp nhận H2" — **CÂU NÀY SAI/STALE**
> (F-162-T5-1). Sự thật theo phán T10: btime #62 07:59:29Z LÀ giờ
> thật; hai boot chồng nhau 824 s (boot cũ sống tới ~08:13:13Z thật);
> uptime 2.686 s khớp btime từng giây bác H2; lưới poll 30 s + neo
> Cloudflare −1 s lúc ~07:47Z bác H1. **Mọi tuổi boot / khoảng thời
> gian của #62 trong LIMITS T5-161 trình theo hai khung (ghi/thật)
> nay đọc lại theo KHUNG THẬT DUY NHẤT**: #61 sống 9.220 s
> (05:25:49Z → 07:59:29Z); #62 sống 9.073 s (07:59:29Z →
> 10:30:42Z); hoạt động dpkg đầu #62 là boot+36m11s; cờ #62 là
> boot+60m01s. Các SỐ không đổi, chỉ cơ chế đổi (quyết (v) đợt 160
> không cần sửa về số — theo GAP §90). Bài học F-161-T5-2 giữ
> nguyên và đã áp dụng cho #63/#64 (§4.1): kiểm neo muộn + tính đều
> heartbeat trước khi quy lệch đồng hồ về một phía; mọi suy luận về
> đồng hồ phải đối chiếu uptime + Cloudflare.

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ là giờ thật; không còn hai khung ở #64)

| Thời điểm | Sự kiện |
|---|---|
| 05:25:49Z | **Reboot #61, boot 52c957d5** (btime — T5-160 xác minh 5 nguồn) |
| 05:41:26Z | Watcher-160 START bằng tay, pid 4539, boot 52c957d5 |
| 05:52:59Z | POSTBOOT_PASS #61 ghi (watcher-160, replay-day-du, poll=0) |
| 07:59:29Z | **Reboot #62 (ứng viên), boot 39d46ba0** — btime LÀ giờ thật (T10 phán OVERLAP ĐÚNG); #61 sống 9.220 s |
| 08:40:01Z | Watcher-161 START bằng tay, pid 19861, boot 39d46ba0 |
| 08:59:30Z | POSTBOOT_PASS #62 ghi (watcher-161, repair-som-quyet-h, poll=1, boot+60m01s) |
| 10:30:39Z | **Poll cuối watcher-161** (dpkg 795 ổn định, md5 b035e179) |
| 10:30:42Z | **Reboot #63 (ứng viên), boot 94d22520** — btime 1795257042 (T10-161 xác minh lúc đóng); #62 sống 9.073 s; watcher-161 chết ngay sau poll cuối 3 s |
| ~11:10:55Z | T10-161 đóng sổ (trên boot #63) — claim "không reboot mới trong lúc đóng" ĐỨNG |
| 11:11:39Z | **Run 161 SUCCEEDED** (theo T0-162 §1 — T5 không tự truy vấn DB; 0 event sau đó; bằng chứng phụ cho "không OVERLAP #64/#63", xem §4.2) |
| 11:15:18Z | **Reboot #64 (ứng viên), boot d9a8d1ce** — btime 1795259718; #63 sống 2.676 s (44m36s); reboot xảy ra 4m23s SAU khi T10-161 đóng sổ |
| 11:15:29Z | /proc/1 mtime + journal first entry (btime+11 s — mẫu bình thường) |
| 11:35:40Z | **Hoạt động dpkg ĐẦU trên #64: 2 dòng "startup packages configure" (boot+20m22s)** — 11 s TRƯỚC giờ mở đợt |
| 11:35:51Z | Lượt cron đợt 162 mở (giờ host) |
| ~11:37Z | T5-162 mở: boot d9a8d1ce, **không watcher nào chạy**; không POSTBOOT_PASS cho #64; replay ĐANG CHẠY (apt-get cài fonts-wqy-zenhei lúc 11:37Z) |
| 11:37:47Z | Hoạt động dpkg CUỐI (gstreamer1.0-tools installed) — replay xong sau 2m07s cài đặt (boot+22m29s) |
| 11:40:00Z | **Watcher-162 START (bằng tay, setsid nohup), pid 18801, boot d9a8d1ce** — poll đầu thấy dpkg ổn định 1.545 dòng → postboot poll0 exit 0 → **FLAG-WRITTEN #64 11:40:00Z (boot+24m42s, replay-day-du, poll=0)** |
| 11:40:32Z | T0-162 đóng cờ (ghi "POSTBOOT_PASS #64 CHƯA CÓ" — stale 32 s so với cờ đã ghi 11:40:00Z, xem §4.5) |
| 11:41:07Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 11:41:52Z | Stats script T5: ENOSPC 5 dòng; MemAvailable 2.040.312 kB; sampler T9-162 5 mẫu, bal=4.571.948 |
| 11:42:31Z | Watcher-162 poll đều (30/31 s), dpkg 1.545 md5 335dc3f2 ổn định — kiểm cuối trước khi viết LIMITS này |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156 +
(o) đợt 157 + (o) đợt 158 + (o) đợt 159 + (n) đợt 160 + (n) đợt
161: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở, T5 khởi
động lại bằng tay. T5-162 kiểm tra lại nhanh `systemctl is-active`
(§A.8): user@0/logind/dbus vẫn inactive, không linger, không cron,
không /run/user/0 — cell không đổi, kết luận đợt 154–161 giữ nguyên
(lần kiểm tra lại thứ chín liên tiếp). Unit + script ở `round154-t5/`
GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 16 REBOOT LIÊN TIẾP #49–#64

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, #62, #63, #64; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156/157/158/159/160/161; không thuộc phạm vi T5-162) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#64 (16 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (14 reboot ở đợt 161 →
  16 reboot đợt này: +2 vì #63 và #64 đều đã qua). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`) PERSISTENT
  qua rebuild — khẳng định lần thứ mười sáu liên tiếp.
  **T0-162 ghi "marker sống qua 15 reboot #49–#64" — lệch 1 so
  với phép đếm trực tiếp của T5** (dãy #49–#64 có 16 số: 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64).
  T5 giữ 16; chờ T10 phán (F-162-T5-6). Không ảnh hưởng kết luận
  persistence (marker CÒN là sự kiện, số đếm chỉ là nhãn).

## 3. Watcher-162 — chạy bằng tay (quy tắc đứng (3)) + POSTBOOT_PASS #64

- **Trạng thái lúc mở (~11:37Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `kill -0 19861`: chết). Ghi vào
  `watcher-status-at-open.txt`. **T0-162 xác minh độc lập và
  KHỚP** ("watcher-161 chết từ #63 (poll cuối 10:30:39Z), chưa có
  watcher-162" — T0 kiểm lúc mở, trước khi watcher-162 khởi động
  11:40:00Z; xem §4.5 về mốc thời gian).
- **Khởi động bằng tay 11:40:00Z, pid 18801** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-162-START 2026-11-21T11:40:00Z pid=18801
  boot=d9a8d1ce btime=2026-11-21 11:15:18Z end=2026-11-21T14:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=335dc3f2 init_mtime=11:37:47Z cache=178 lists=37 gst_sys=269`
- **Thay đổi so với watcher-161 (3 điểm):**
  1. END = 14:30:00Z 21/11 (hạn cứng đợt 162 theo task); DIR =
     round162-t5, OLD_T5_DIR = round161-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #64 + trạng thái replay ĐANG
     CHẠY / VỪA XONG lúc khởi động (dpkg 1.545 dòng, 0 proc
     apt/dpkg, hoạt động đầu 11:35:40Z = boot+20m22s, 11 s TRƯỚC
     giờ mở đợt — cùng mẫu #61/#62) + dự kiến REPLAY_DONE ngay
     poll đầu nếu ổn định.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[12]`/`11:30` + `bash -n` syntax OK)
     — adapter chạy sạch ngay lần đầu, 0 lỗi bắt được (khác đợt
     161 có F-161-T5-3). **Ngoại lệ: header comment còn câu H2
     stale — xem F-162-T5-1; chỉ là comment, không ảnh hưởng logic.**
- **Poll đều đã xác minh:** 11:40:00Z, 11:40:30Z, 11:41:00Z,
  11:41:31Z, 11:42:01Z, 11:42:31Z (đúng chu kỳ 30/31 s, 0
  khoảng trống). Lúc 11:42:31Z log 11 dòng: START 1, poll 6,
  FLAG-WRITTEN 1, REPLAY_DONE 1, MONITOR 1, postboot poll0 1,
  0 NEWBOOT, 0 END, 0 EARLY-REPAIR.
- **EARLY-REPAIR KHÔNG kích hoạt — ĐÚNG THIẾT KẾ:** replay chạy
  đầy đủ tự nhiên nên điều kiện repair (frozen ≥600 s + 0 proc +
  dòng <100) không bao giờ thỏa. Guard file `repaired-d9a8d1ce`
  KHÔNG tồn tại (chưa repair — đúng, vì không cần).

### 3.1 POSTBOOT_PASS cho #64 — CÓ QUA REPLAY-DAY-DU (KHÔNG CẦN REPAIR)

- **Replay tự nhiên trên #64: CHẠY ĐẦY ĐỦ.** Bằng chứng: hoạt
  động dpkg đầu 11:35:40Z (2 dòng "startup packages configure"),
  rồi cài đặt liên tục 11:36:06Z → 11:37:47Z (2m07s): apt-get cài
  fonts-wqy-zenhei (quan sát trực tiếp lúc 11:37Z, pid 6486) +
  gstreamer1.0-tools xong 11:37:47Z (apt history); dpkg 2 →
  **1.545 dòng** (md5 335dc3f2, ổn định từ 11:37:47Z tới kiểm
  cuối 11:42:31Z — 284 s không đổi, 0 proc apt/dpkg); lists 37;
  cache 178 .deb; GST hệ thống 269 file (thư mục thật apt, KHÔNG
  phải symlink như #62 sau repair); `/var/log/apt/` TỒN TẠI.
- **Hoạt động dpkg đầu boot+20m22s (1.222 s)** — muộn thứ hai từ
  trước, chỉ sau #62 boot+22m10s (thật) và hơn #61 boot+9m50s
  nhiều. Chuỗi "khởi động muộn dần": #59 +35s → #61 +9m50s →
  #62 +22m10s (thật) → **#64 +20m22s — NGẮN HƠN #62 ~1m48s,
  PHÁ xu hướng tăng đơn điệu** (không phải 3 boot liên tiếp muộn
  dần — T5-161 §7.6 đã đặt điều kiện này; nay có đáp án: KHÔNG
  thành mẫu tăng đơn điệu). Xuất hiện 11 s TRƯỚC giờ mở đợt
  (11:35:40Z vs 11:35:51Z) — cùng mẫu #61 (12 s) và #62 (11 s) —
  có vẻ kích hoạt bởi máy móc mở đợt, không phải theo boot
  (T0-161 đồng ý ghi nhận, không suy đoán cơ chế; T5-162 giữ
  nguyên ghi nhận này).
- **dpkg 1.545 dòng — KHỚP CHÍNH XÁC bộ cài đặt của #61 và Dot
  151:** breakdown theo action field (python, §A.4): 1.040 status
  + 178 configure + 169 install + 106 startup + 43 trigproc +
  9 upgrade = 1.545. Các số 169 install / 9 upgrade / 178
  configure TRÙNG KHỚP header postboot Dot 151 ("dpkg 1545 dong
  / 169 install / 9 upgrade / 178 configure, goi cuoi
  gstreamer1.0-tools") và số dòng cuối #61 (1.545 dòng,
  md5 3411a9cc). md5 khác nhau (335dc3f2 vs 3411a9cc vs 51d12c3d)
  vì timestamp trong từng dòng dpkg.log khác nhau — cùng bộ gói,
  khác thời gian chạy. Gói cuối cùng: gstreamer1.0-tools
  11:37:47Z (giống Dot 151). Cache APT 178 .deb — trùng số Dot
  151 ("cache APT SONG 178 .deb/156M"); lists 37 — trùng Dot 151
  ("lists 37 (1 mirror azure)").
- **REPLAY_DONE ngay poll đầu (11:40:00Z):** watcher khởi động
  lúc dpkg đã ổn định 133 s (từ 11:37:47Z), 0 proc, dòng = prev
  (1.545) → stable=1 → postboot poll0 **exit=0** → ghi cờ ngay.
  Đây là đường chuẩn (cùng mẫu #61 poll=0), không phải đường
  tắt: dpkg đã đóng băng đủ lâu + postboot PASS thật.
- **FLAG-WRITTEN 11:40:00Z** (`round162-t5/POSTBOOT_PASS`):
  `boot d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7 (btime 2026-11-21
  11:15:18Z; watcher-162) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T11:40:00Z; POSTBOOT_PASS moi ghi 2026-11-21T11:40:00Z
  poll=0 (replay-day-du); co cu 39d46ba0 luu POSTBOOT_PASS-39d46ba0`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-39d46ba0` đã đối chiếu bằng
  `diff` — **KHỚP cờ #62 gốc** (round161-t5).
- **Cờ lúc 11:40:00Z = boot+24m42s (1.482 s).** Nhanh hơn #61
  (boot+27m10s) và #62 (boot+60m01s ghi / boot+46m00s thật theo
  khung cũ — nay đọc lại: boot+60m01s thật theo OVERLAP).
  Cửa sổ hở của hướng (3) ở #64: cờ có **~3 phút sau khi T5 mở
  thực tế (~11:37Z)** và 4m09s sau giờ mở đợt — ngắn nhất kể từ
  #61 vì replay đã chạy xong trước khi T5 mở. **Không thiệt hại
  đo được:** cờ có trước khi T4/T8-162 cần gate0 (T0-162 đóng
  11:40:32Z đã ghi nhận cờ CHƯA CÓ — stale 32 s, xem §4.5;
  các luồng khác đọc cờ sau 11:40:00Z đều thấy cờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-d9a8d1ce.log`, exit 0,
  11:41:07Z): wrapper PASS, libs PASS đủ 5, GST PASS (thư mục
  thật apt, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5).
- **Phối hợp T4/T8-162:** poller T4-162 + harness T8-162 đọc
  `round162-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  11:40:00Z, TRƯỚC khi các luồng khác cần gate0.

## 4. Boot #62/#63/#64 + đồng hồ — OVERLAP #62 ĐÃ PHÁN; #63/#64 KHÔNG NGHỊCH LÝ

### 4.1 Bằng chứng quyết định cho #63/#64 (bài học F-161-T5-2 đã áp dụng)

1. **Tính đều poll watcher-161 (T5-162 kiểm lại độc lập từ log
   gốc — Phụ lục B):** 195 poll, 08:40:01Z → 10:30:39Z, khoảng
   giữa hai poll liên tiếp: 30 s ×183, 31 s ×10, **838 s ×1**
   (khoảng repair 08:46:02Z → 09:00:00Z, đã biết F-161-T5-6);
   riêng 24 poll trong 12 phút cuối đời (sau 10:18:39Z) cũng chỉ
   30/31 s (30 s ×22, 31 s ×1). Vòng lặp watcher `sleep 30` theo
   monotonic + timestamp theo wall clock — nếu wall clock chạy
   nhanh, các khoảng sẽ đọc dài hơn 30/31 s. KHÔNG CÓ khoảng nào
   như vậy (trừ khoảng repair đã giải thích). **Đồng hồ boot #62
   KHÔNG slew trong 12 phút cuối đời.**
2. **Poll cuối → btime #63 chỉ 3 s:** poll cuối watcher-161
   10:30:39Z; btime #63 10:30:42Z (T10-161 xác minh lúc đóng:
   boot 94d22520, /proc/stat 1795257042). Reboot #63 xảy ra trong
   (10:30:39Z, 10:30:42Z + poll kế tiếp không bao giờ chạy] — cửa
   sổ 3 s + 30 s. Không có lệch ~800 s kiểu #62 ở đây.
3. **Uptime khớp btime trên #64 (T5 đo trực tiếp):** uptime
   1.594,26 s lúc 11:41:52Z ⇒ boot lúc 11:15:17,74Z; btime
   11:15:18Z — **chênh 0,26 s**. `uptime -s` = 11:15:18Z, KHỚP
   btime từng giây. Đây chính là kiểm đã bác H2 ở #62 (uptime
   2.686 s khớp btime từng giây — GAP §90): ở #64 kiểm này ĐẬU,
   nên **btime #64 LÀ giờ thật, không cần khung thứ hai**.
4. **/proc/1 và journal khớp btime +11 s (mẫu bình thường):**
   /proc/1 mtime 11:15:29Z; journal first entry 11:15:29Z
   (epoch 1795259729); journal_boots chỉ 1 boot (#64).
5. **Đồng hồ mới ĐÚNG lúc đo (T5 đo 2 lần):** 11:37:36Z local
   vs Cloudflare 11:37:38 GMT (+2 s); 11:42:17Z local vs
   Cloudflare 11:42:18 GMT (+1 s). GitHub −3 s lúc 11:41:52Z là
   edge lag, không dùng làm chuẩn (bài học F-159-T7-1).
6. **T0-162 xác minh độc lập 9 nguồn và KHỚP:** btime #64
   1795259718 = 11:15:18Z LÀ GIỜ THẬT; run 161 succeed 11:11:39Z
   (trước btime 3'39", 0 event sau — KHÔNG nghịch lý, KHÔNG
   OVERLAP #64/#63); reboot 4'23" sau khi T10-161 đóng sổ
   (11:10:55Z). T5 KHÔNG tự truy vấn scheduler DB (số liệu run
   161 lấy từ T0-162, đã nêu rõ nguồn); đóng góp độc lập của T5
   cho kết luận "không nghịch lý" là các mục (1)–(5), không phụ
   thuộc DB.

### 4.2 OVERLAP #62 — T10 phán, parent quyết (q) đợt 161

- GAP §90 (đã đọc): **"OVERLAP ĐÚNG (uptime 2.686 s khớp btime
  từng giây bác H2; lưới poll 30 s + neo Cloudflare −1 s lúc
  ~07:47Z bác H1; btime 07:59:29Z LÀ giờ thật → reboot #62 rơi
  vào lúc T10-160 đóng sổ, F-161-T1-1 được xác nhận, verdict đợt
  160 không đổi)"**. T5-162 ghi nhận phán này làm chuẩn; header
  comment stale trong `replay-watch-162.sh` (ghi H2) được đính
  chính tại đây (F-162-T5-1).
- Hệ quả số liệu (đọc lại LIMITS T5-161 theo khung thật duy
  nhất — SỐ KHÔNG ĐỔI, chỉ cơ chế đổi): #61 sống **9.220 s**
  (05:25:49Z → 07:59:29Z); #62 sống **9.073 s** (07:59:29Z →
  10:30:42Z); hoạt động dpkg đầu #62 boot+36m11s; cờ #62
  boot+60m01s; watcher-160 chết ~08:13:13Z cùng boot cũ (không
  phải tại btime #62) — nhất quán với OVERLAP (boot cũ sống 824 s
  qua btime mới). Quyết (v) đợt 160 không cần sửa về số.
- **Mù #94? (#62) giao T2-162** (GAP §90: đoạn N file/union
  1.422 s, vượt sàn 275 s; hố 08:11:54–08:35:36Z trống hoàn toàn)
  — T5 không đụng; chỉ ghi nhận btime #62 nay là giờ thật nên
  T2-162 không cần trình hai khung cho #62 nữa.

### 4.3 Boot #63 (94d22520, btime 10:30:42Z): KHÔNG CÓ cờ — boot thứ 7

- **Bằng chứng:** không file `POSTBOOT_PASS*` nào cho 94d22520
  trong round161-t5/ lẫn round162-t5/ (kiểm trực tiếp từng đường
  dẫn, §A.2c); `find` toàn bộ hidden_files liệt kê mọi file
  POSTBOOT_PASS* — mới nhất là round161-t5/POSTBOOT_PASS (cho
  #62); grep 94d22520 trong round161-t5/ = 0 match (chỉ xuất hiện
  trong tài liệu T7-161/T10-161/GAP §90, không phải cờ); không
  watcher nào sống trong #63 (watcher-161 chết theo reboot);
  journal chỉ còn #64 (volatile theo rebuild) nên không còn dấu
  vết replay #63 trên đĩa. **Không bù được** (cùng tiền lệ
  #51/#53/#54/#55/#57/#60 theo quyết (o) đợt 156 + (n) đợt 161).
- **#63 là boot thứ 7 không có cờ** (danh sách đầy đủ: #51, #53,
  #54, #55, #57, #60, #63 — #62 và #64 ĐÃ CÓ cờ nên chuỗi lọt
  không liên tiếp; #61 ĐÃ CÓ cờ). Chỉ thiếu cờ watcher (dữ kiện
  #63 chỉ còn cờ T7/T10).
- **#63 sống 2.676 s (44m36s)** — boot ngắn nhất kể từ #60?
  (T5 không so sánh toàn lịch sử; chỉ ghi số.) Trong 44m36s đó:
  T10-161 đóng sổ 11:10:55Z (trên #63), run 161 succeed 11:11:39Z
  (theo T0-162), rồi reboot #64 11:15:18Z. Không có phiên T5 nào
  sống trong #63 để viết cờ — đó là lý do lọt (hướng (3) chỉ bắt
  được cờ khi có phiên T5 sau reboot; #63 rơi vào khoảng trống
  giữa hai đợt).
- **Watcher-161 pid 19861 CHẾT theo reboot #63 — bằng chứng log
  của T5:** `replay-watch-161.log` 202 dòng, 195 poll,
  0 NEWBOOT, 1 FLAG-WRITTEN, 0 END, 0 EARLY-REPAIR sau cờ #62;
  dòng cuối **10:30:39Z boot 39d46ba0** (poll bình thường, dpkg
  795 ổn định, md5 b035e179); **KHÔNG có dòng REPLAY-WATCH-161-END**
  (hạn 11:30:00Z chưa tới) và **KHÔNG có dòng watcher-stop** —
  watcher không thoát tự nhiên theo logic script mà dừng giữa chu
  kỳ poll, đúng lúc boot đổi. Cùng mẫu watcher-160/#62 (log dừng
  08:13:13Z, 0 NEWBOOT) và watcher-159/#60. Poll đều 30/31 s
  suốt phiên (08:40:01Z → 10:30:39Z; 183 khoảng 30 s + 10 khoảng
  31 s + 1 khoảng repair 838 s — Phụ lục B).
- **Đối chiếu T0-162:** cờ round162-t0.done (11:40:32Z) ghi
  "watcher-161 chết từ #63 (poll cuối 10:30:39Z)" — **KHỚP với
  T5** và **KHÔNG đưa ra suy luận nguyên nhân chết nào khác**.
  Không còn mâu thuẫn T0 vs T5 ở đợt này (đợt thứ ba liên tiếp:
  160, 161, 162). T0-162 cũng xác minh độc lập số hiệu #64 (9
  nguồn), marker sống qua #64, đồng hồ lúc mở ≈ Cloudflare ±1 s
  — TẤT CẢ KHỚP với T5 (trừ số đếm marker 15 vs 16, xem §2.1).

### 4.4 Tuổi boot theo khung thật duy nhất (không trừ lẫn lộn)

| Mốc | Giờ (thật) | Tuổi boot #64 |
|---|---|---|
| btime #64 | 11:15:18Z | — |
| Hoạt động dpkg đầu | 11:35:40Z | boot+20m22s |
| Replay xong (dpkg cuối) | 11:37:47Z | boot+22m29s |
| Watcher-162 START | 11:40:00Z | boot+24m42s |
| FLAG-WRITTEN #64 | 11:40:00Z | boot+24m42s |
| Postboot độc lập T5 | 11:41:07Z | boot+25m49s |

- Tuổi boot #63: **2.676 s (44m36s)** (10:30:42Z → 11:15:18Z).
- Tuổi boot #62 (đọc lại theo OVERLAP): **9.073 s (2h31m13s)**
  (07:59:29Z → 10:30:42Z). Tuổi boot #61: **9.220 s (2h33m40s)**.
- Reboot #64 xảy ra GIỮA hai đợt theo giờ thật (sau T10-161
  đóng 11:10:55Z 4m23", trước đợt 162 mở 11:35:51Z 20m33") — không
  phá lượt đo nào trong đợt 161. Câu "KHÔNG có reboot mới trong
  lúc T10 đóng sổ" của T10-161 **ĐỨNG** theo giờ thật (T0-162 xác
  minh độc lập và KHỚP).

### 4.5 Ghi chú mốc thời gian T0-162 vs cờ #64 (không phải mâu thuẫn)

- T0-162 đóng cờ 11:40:32Z ghi "POSTBOOT_PASS #63 + #64 CHƯA
  CÓ (T5-162)". Nhưng cờ #64 đã ghi **11:40:00Z — 32 s TRƯỚC
  khi T0 đóng**. Giải thích: T0 kiểm tra cờ lúc mở (~11:37–
  11:39Z, trước khi watcher-162 khởi động) và viết cờ đóng sổ
  theo trạng thái lúc kiểm, không kiểm lại lúc 11:40:32Z. Đây là
  stale do mốc kiểm, không phải T0 sai về thực tế lúc kiểm, và
  không phải T5 ghi cờ sai giờ (log watcher + mtime file
  POSTBOOT_PASS đều 11:40:00Z; `diff` backup cờ cũ KHỚP).
  T10 lưu ý khi đọc hai cờ: cờ #64 CÓ, từ 11:40:00Z.
- Tương tự, câu "chưa có watcher-162" của T0 cũng theo mốc kiểm
  lúc mở (watcher-162 khởi động 11:40:00Z, sau mốc kiểm của T0).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 162

- T0-162 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-162
  xác minh độc lập "watcher-161 chết từ #63" — KHỚP với T5. T5 tự
  khởi động lại pid 18801 11:40:00Z (ghi trong
  `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #64: 24m42s từ boot tới cờ** — NHƯNG
  chỉ **~3 phút từ lúc T5 mở tới cờ** (replay đã chạy xong trước
  khi T5 mở; cờ chỉ đợi watcher khởi động + 1 poll). Đây là
  khoảng hở đã biết của hướng (3): cờ chỉ có khi có phiên T5
  sau reboot + replay/repair xong. #63 vẫn là boot lọt hoàn toàn
  không cờ gần nhất — #64 ĐÃ BẮT ĐƯỢC nhờ replay tự nhiên chạy
  đầy đủ (không cần repair).
- **Watcher-162 tiếp tục giám sát tới 14:30:00Z**; nếu có reboot
  #65 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-163 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-162 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **2.040.312 kB @11:41:52Z** (CAO — khác hẳn
  #62 lúc 437.508 kB; T9 theo dõi; sampler T9-162 5 mẫu
  11:37:42–11:41:43Z, mem cuối 2.073.092 kB, **bal=4.571.948**);
  MemFree 122.528 kB. loadavg 6,40 @11:41:52Z (cao — các luồng
  đợt 162 đang chạy song song; không phải kẹt). Sampler T9-162
  ĐANG CHẠY (ram-sampler.log 5 mẫu, boot d9a8d1ce); b2-watcher
  pid 6786 đang chạy.
- **ENOSPC journal boot #64:** **5 dòng** lúc 11:41:52Z
  (journal 137 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-162 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. So sánh: #63 có 5 dòng lúc T10-161 đóng
  (F-161-T10-3); #62 có 26 dòng lúc T5-161 đo (09:05:40Z);
  #64 đã 5 dòng lúc 11:41:52Z (boot+26m34s).
- **Không reboot mới trong phiên T5** (boot vẫn d9a8d1ce lúc
  kiểm cuối 11:42:31Z — KHÔNG có #65; watcher-162 tiếp tục
  giám sát tới hạn cứng 14:30:00Z).
- **journal_boots chỉ còn 1 boot (#64):** journal của #63
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 163 (từ T5-162)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 16 reboot
   #49–#64. T5-163 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục). Số đếm T0-162 (15) vs T5-162 (16) chờ T10
   phán (F-162-T5-6).
3. **POSTBOOT_PASS cho #64 — XONG 11:40:00Z** (watcher-162,
   replay-day-du, poll=0; T4/T8-162 phối hợp qua cờ).
   Watcher-162 tiếp tục giám sát tới 14:30:00Z; nếu có reboot
   #65 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-163 kiểm tra log.
4. **POSTBOOT_PASS #63 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 7 không cờ; cùng tiền lệ #51/#53/#54/#55/#57/#60).
   Chỉ thiếu cờ watcher (dữ kiện #63 chỉ còn cờ T7/T10).
5. **Nghịch lý đồng hồ #62 — ĐÃ PHÁN: OVERLAP ĐÚNG, H1/H2 BỊ
   BÁC** (T10-161 §10.5, parent quyết (q) đợt 161). Không còn
   mở. Mù #94? (#62) giao T2-162 — T2 không cần trình hai khung
   cho #62 nữa (btime là giờ thật). Header comment stale trong
   `replay-watch-162.sh` (ghi H2) — T5-163 sửa khi adapt script
   (F-162-T5-1).
6. **Replay khởi động muộn: #59 +35s → #61 +9m50s → #62
   +22m10s → #64 +20m22s.** #64 PHÁ xu hướng tăng đơn điệu —
   không thành mẫu 3 boot liên tiếp muộn dần. Mẫu "11 s trước
   giờ mở đợt" giữ nguyên 3 đợt liên tiếp (#61: 12 s, #62: 11 s,
   #64: 11 s).
7. **Cổng boot+15m của (h) không cần dùng ở #64** (replay chạy
   đầy đủ; frozen không bao giờ thỏa). Ghi nhận để T10 đánh giá
   (h): cổng chỉ có ý nghĩa khi replay vắng — ở #64 nó không
   kích hoạt và không cần kích hoạt.
8. **GST trên #64 là THƯ MỤC THẬT apt (269 file)** — khác #62
   (symlink → debroot sau repair). Boot sau phải làm lại qua
   replay/repair (ephemeral theo rebuild).
9. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #64): T5 đợt sau quyết có cập nhật theo Dot
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

- **(3) vẫn đủ cho hiện tại** — đợt này replay #64 chạy đầy đủ
  tự nhiên, cờ có ở boot+24m42s, chỉ ~3 phút sau khi T5 mở.
  T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ chín liên tiếp.
- **Số hiệu #64 vẫn là ứng viên chờ parent xác nhận** (T0-162
  §1) — T5 dùng "#64 (ứng viên)" trong LIMITS này theo đúng
  quy tắc đứng.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #63 từ log của
  T7/T10-161** (xem §4.3) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #63 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Số đếm marker: T5 giữ 16 reboot (#49–#64)** — T0-162 ghi 15
  cho cùng dãy; T10 phán số nào đúng (F-162-T5-6). Kết luận
  persistence (marker CÒN) không phụ thuộc số đếm này.
- **T0-162 "POSTBOOT_PASS #64 CHƯA CÓ" stale 32 s** (cờ đã ghi
  11:40:00Z, T0 đóng 11:40:32Z) — không phải mâu thuẫn thực tế,
  chỉ là mốc kiểm của T0 trước khi watcher-162 khởi động; T10
  không cần phân xử (xem §4.5).

## 9. Sai số của chính T5-162

- **F-162-T5-1 — Header comment `replay-watch-162.sh` còn ghi
  H2 stale (ĐÃ ĐÍNH CHÍNH TRONG LIMITS NÀY, không sửa file
  script sau khi watcher đã chạy):** header viết "T5 chấp nhận
  H2" cho nghịch lý #62 — câu này được viết TRƯỚC khi T5 đọc
  GAP §90, trong đó T10-161 §10.5 đã phán **OVERLAP ĐÚNG, H1/H2
  đều BỊ BÁC** (parent quyết (q) đợt 161). Header chỉ là comment
  (không ảnh hưởng logic watcher: mọi logic theo boot-age/frozen
  đều chạy trên đồng hồ ghi, và ở #64 đồng hồ ghi = giờ thật nên
  không lệch). T5-163 sửa header khi adapt script. Bài học: đọc
  GAP §90 + quyết parent TRƯỚC khi viết header script (T5-162
  đọc §90 sau khi đã khởi động watcher).
- **F-162-T5-2 — Exec khởi động watcher báo output_drain_timeout
  + `cat replay-watch-162.log: No such file` lúc 11:40:35Z
  (KHÔNG mất dữ liệu):** lệnh spawn watcher + sleep 35 s rồi cat
  log — cat báo không có file dù START đã ghi 11:40:00Z. Lần đọc
  lại ngay sau đó (11:40:42Z) file đã có đầy đủ nội dung (START +
  MONITOR + poll + REPLAY_DONE + FLAG-WRITTEN). Nguyên nhân chưa
  rõ (có thể exec session nhìn thấy filesystem chậm hơn tiến trình
  setsid); không mất dòng log nào — log đầy đủ tới poll 11:42:31Z
  lúc viết LIMITS. Ghi nhận để T10 khỏi nhầm là watcher chết rồi
  sống lại; bài học: sau spawn, kiểm lại bằng lệnh đọc riêng thay
  vì tin cat trong cùng exec.
- **F-162-T5-3 — `pgrep -f replay-watch-162` tự khớp shell exec
  của chính T5** (cùng họ F-161-T5-4/F-160-T5-1): dòng
  watcher162_pid trong stats §4 ghi "18799 18801 24996" — 18799
  là shell cha spawn watcher (chứa tên script trong command line),
  24996 là shell của chính stats script; pid watcher thật duy nhất
  là **18801** (khớp START line + `kill -0 18801` OK + poll đều).
  Bài học giữ nguyên: luôn neo pid trực tiếp + đối chiếu
  log/file, không tin mù pgrep.
- **F-162-T5-4 — grep boot8 trong stats §2c match các file do
  chính T5-162 viết** (cùng họ F-161-T5-5): §A.2c liệt kê
  `watcher-status-at-open.txt`, `make-watcher-162.py`,
  `replay-watch-162.sh`, `t5-stats-162.py` chứa chuỗi d9a8d1ce —
  đó là tham chiếu do T5 viết, KHÔNG phải cờ POSTBOOT_PASS cho
  #64 ngoài cờ chính. Kết luận "#63 KHÔNG CÓ cờ" dựa trên việc
  KHÔNG tồn tại file `POSTBOOT_PASS-94d22520` nào (kiểm trực tiếp
  từng đường dẫn) + `find` liệt kê toàn bộ file POSTBOOT_PASS*,
  không dựa trên grep.
- **F-162-T5-5 — Nợ header postboot script còn ghi Dot 151**
  (ghi nhận từ T5-152 §5.4, thấy lại ở log poll0 + log độc lập
  đợt này — header log ghi boot e9295700/2e430750 đợt 151 trong
  khi checks là của #64): nợ thẩm mỹ trong log header, không ảnh
  hưởng kết quả check. T5 đợt sau quyết có cập nhật theo Dot hay
  không.
- **F-162-T5-6 — Số đếm marker T0 vs T5 (chờ T10 phán):**
  T0-162 ghi "15 reboot #49–#64"; T5-162 đếm trực tiếp dãy
  #49–#64 = **16** số. Một trong hai (số 15 hoặc dãy #49–#64
  của T0) sai 1 đơn vị. T5 giữ 16 (liệt kê đủ 16 số ở §2.1);
  nếu T10 phán 15 đúng thì T5-162 sửa số đếm ở đợt sau (marker
  CÒN là sự kiện không đổi).
- **Giới hạn xác minh (không phải sai số):** T5-162 xác minh
  boot #64 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + wtmp; kiểm tra đồng hồ
  so với Cloudflare 2 lần (+2 s @11:37Z và +1 s @11:42Z — T5 đo
  trực tiếp). T5 KHÔNG tự truy vấn scheduler DB (số liệu run 161
  lấy từ T0-162 §1, đã nêu rõ nguồn); đóng góp độc lập của T5
  cho kết luận "không nghịch lý #64" là neo uptime + tính đều
  poll watcher-161 + đo Cloudflare (§4.1 mục 1–5), không phụ
  thuộc DB. Btime #63 (10:30:42Z) lấy từ T10-161 (đã xác minh lúc
  đóng), không xác minh độc lập được từ #64 (journal volatile).
  Mọi khoảng thời gian trong LIMITS này đều tính lại từ endpoint
  thô bằng script python (Phụ lục B) — không cộng/trừ lũy kế
  bằng tay.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-162.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (d9a8d1ce, btime
  11:15:18Z) — và KHỚP xác minh độc lập 9 nguồn của T0-162.

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t5/t5-stats-162.py`
(output đầy đủ lưu tại `t5-stats-162-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 11:41:52Z, SAU khi cờ POSTBOOT_PASS #64
đã ghi; F-162-T5-3: dòng watcher162_pid trong §4 tự khớp shell
exec của T5 — pid watcher thật là 18801; F-162-T5-4: §2c grep
match file do chính T5 viết — kết luận "#63 KHÔNG CÓ cờ" dựa
trên kiểm đường dẫn trực tiếp + find).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-162 (trich bang script, 2026-11-21T11:41:52Z) ===

--- 1. Boot hien tai ---
boot_id=d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7
btime_epoch=1795259718 = 2026-11-21T11:15:18Z
uptime_s=1594.26 now=2026-11-21T11:41:52Z
uptime_-s=2026-11-21 11:15:18
/proc/1 mtime=2026-11-21 11:15:29.562514159 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 d9a8d1cece3a46d8bbbc3cae373489a7 Sat 2026-11-21 11:15:29 UTC Sat 2026-11-21 11:41:31 UTC
journal_first_entry=1795259729.958158 htch-runtime systemd-journald[17]: Journal started
clocksource=tsc
local_date=Sat Nov 21 11:41:52 UTC 2026
cloudflare_date=Date: Sat, 21 Nov 2026 11:41:54 GMT
github_date=Date: Sat, 21 Nov 2026 11:41:49 GMT

--- replay-watch-161.log ---
tong_dong=202
START=1 poll=195 NEWBOOT=0 END=0 EARLY-REPAIR=1 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-161-START 2026-11-21T08:40:01Z pid=19861 boot=39d46ba0 btime=2026-11-21 07:59:29Z end=2026-11-21T11:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=45c25fe2 init_mtime=08:35:41Z cache=0 lists=5 gst_sys=0
dong_cuoi: 2026-11-21T10:30:39Z boot=39d46ba0 poll dpkg_lines=795 md5=b035e179 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=66
boot_xuat_hien=['39d46ba0']
mtime_log=2026-11-21T10:30:39Z size=24559

--- replay-watch-162.log ---
tong_dong=9
START=1 poll=4 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-162-START 2026-11-21T11:40:00Z pid=18801 boot=d9a8d1ce btime=2026-11-21 11:15:18Z end=2026-11-21T14:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=335dc3f2 init_mtime=11:37:47Z cache=178 lists=37 gst_sys=269
dong_cuoi: 2026-11-21T11:41:31Z boot=d9a8d1ce poll dpkg_lines=1545 md5=335dc3f2 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37
boot_xuat_hien=['d9a8d1ce']
mtime_log=2026-11-21T11:41:31Z size=1186

--- 2c. POSTBOOT_PASS theo boot ---
  #64 d9a8d1ce: file_chua=(cac file do T5-162 viet — xem F-162-T5-4; co chinh la POSTBOOT_PASS)
  #63 94d22520: file_chua=(chi watcher-status-at-open.txt + t5-stats-162.py — tham chieu do T5 viet; KHONG co co)
  #62 39d46ba0: file_chua=(round161-t5 + round162-t5; co chinh POSTBOOT_PASS + backup POSTBOOT_PASS-39d46ba0)
  round162-t5/POSTBOOT_PASS: CO
  round162-t5/POSTBOOT_PASS-d9a8d1ce: KHONG CO
  round161-t5/POSTBOOT_PASS: CO
  round161-t5/POSTBOOT_PASS-39d46ba0: KHONG CO
  round161-t5/POSTBOOT_PASS-94d22520: KHONG CO
  round162-t5/POSTBOOT_PASS-94d22520: KHONG CO

--- 3. round162-t5/POSTBOOT_PASS (mtime 2026-11-21T11:40:00Z) ---
boot d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7 (btime 2026-11-21 11:15:18Z; watcher-162) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T11:40:00Z; POSTBOOT_PASS moi ghi 2026-11-21T11:40:00Z poll=0 (replay-day-du); co cu 39d46ba0 luu POSTBOOT_PASS-39d46ba0

--- 3. round161-t5/POSTBOOT_PASS (mtime 2026-11-21T08:59:30Z) ---
boot 39d46ba0-5724-4e4e-abec-a546d4d98ab2 (btime 2026-11-21 07:59:29Z; watcher-161) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 66; postboot PASS poll1 doc lap exit 0 luc 2026-11-21T08:59:29Z; POSTBOOT_PASS moi ghi 2026-11-21T08:59:30Z poll=1 (repair-som-quyet-h); co cu 52c957d5 luu POSTBOOT_PASS-52c957d5

--- 3a. diff POSTBOOT_PASS-39d46ba0 (backup) vs goc ---
DIFF-KHOP

--- 3b. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20T11:39:47Z

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=335dc3f2 mtime=2026-11-21 11:37:47.403984814 +0000
dpkg_dong_dau=2026-11-21 11:35:40 startup packages configure|2026-11-21 11:35:40 startup packages configure|
dpkg_dong_cuoi=2026-11-21 11:37:47 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
dpkg_breakdown_grep install=169 upgrade=9 configure=178
dpkg_breakdown_awk=configure=178 install=169 startup=106 status=1040 trigproc=43 upgrade=9 total=1545
cache_deb=178 lists_entries=37
gst_sys_files=269
gst_symlink=drwxr-xr-x 1 root root 8902 Nov 21 11:36 /usr/lib/x86_64-linux-gnu/gstreamer-1.0
apt_procs= dpkg_procs=
watcher162_pid=18799 18801 24996 (18799 = shell cha spawn, 24996 = shell stats — xem F-162-T5-3; pid that 18801)

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
ENOSPC_dong=5
journal_dong=137

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          122528 kB
MemAvailable:     2040312 kB
loadavg=6.40 3.96 1.78 14/521 25089
sampler round162-t9/ram-sampler.log: tong_mau=5 dau=2026-11-21T11:37:42 cuoi=2026-11-21T11:41:43Z boot=d9a8d1ce mem=2073092 bal=4571948 swapfree=758288 load1=5.95
sampler_proc=(co dong tu khop shell exec cua T9 — bang chung that: ram-sampler.log 5 mau + b2-watcher pid 6786)
b2_watcher_proc=6786 bash round162-t9/b2-watcher.sh

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

--- 9. Co round162 .done (luc 11:41:52Z) ---
round162-t0.done (11:40:32Z)

=== HET PHU LUC T5-162 2026-11-21T11:41:57Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-d9a8d1ce.log`,
11:41:07Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.9):

```
[postboot 2026-11-21 11:15:18] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 11:15:18] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 11:15:18] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 11:15:18] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 11:15:18] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 11:15:18] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 11:15:18] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 11:15:18)
```

Log postboot poll0 của watcher (`t5-postboot-poll0-d9a8d1ce.log`,
11:40:00Z, exit 0 — cùng nội dung check như log độc lập; header
log còn ghi Dot 151, xem §7.9).

## Phụ lục B. Kiểm chứng độc lập thêm của T5-162 (script một lần, không gõ tay)

**B.1 Tính đều poll watcher-161 (xem §4.1 mục 1):**
195 poll, 08:40:01Z → 10:30:39Z; khoảng giữa hai poll liên tiếp:
30 s ×183, 31 s ×10, **838 s ×1** (khoảng repair 08:46:02Z →
09:00:00Z, đã biết F-161-T5-6). Riêng 24 poll trong 12 phút cuối
đời (sau 10:18:39Z): chỉ 30/31 s (30 s ×22, 31 s ×1), max 31 s.
Không có khoảng dài bất thường nào — đồng hồ boot #62 KHÔNG slew
trước khi chết.

**B.2 Tính đều poll watcher-162 (tới kiểm cuối 11:42:31Z):**
6 poll lúc 11:42:31Z; khoảng: 30 s ×4, 31 s ×1 — đều, 0 khoảng
trống. Watcher sống và poll đúng cadence (pid 18801, kill -0 OK).

**B.3 Các khoảng thời gian (tính lại từ endpoint thô bằng script
python — không cộng/trừ lũy kế bằng tay):**
replay #64 bắt đầu boot+20m22s (1.222 s); replay xong
boot+22m29s (1.349 s); cờ #64 boot+24m42s (1.482 s); #63 sống
2.676 s (44m36s); #62 sống 9.073 s (2h31m13s); #61 sống 9.220 s
(2h33m40s); poll cuối watcher-161 → btime #63: 3 s; giờ mở đợt
− hoạt động dpkg đầu #64: 11 s; giờ mở đợt − btime #64: 1.233 s
(20m33s); T10-161 đóng → btime #64: 263 s (4m23s); run 161
succeed (theo T0-162) → btime #64: 219 s (3m39s).

**B.4 Cách đếm dpkg 1.545 dòng (xem §3.1):** theo action field
(python Counter trên cột $3): 1.040 status + 178 configure + 169
install + 106 startup + 43 trigproc + 9 upgrade = 1.545.
`grep -c ' install '` = 169; `grep -c ' upgrade '` = 9;
`grep -c ' configure '` = 178. Các số TRÙNG KHỚP header postboot
Dot 151 (169/9/178, gói cuối gstreamer1.0-tools) và số dòng cuối
#61 (1.545 dòng) — cùng bộ gói, khác timestamp (md5 khác:
335dc3f2 vs 3411a9cc vs 51d12c3d).

**B.5 Uptime khớp btime trên #64 (xem §4.1 mục 3):** uptime
1.594,26 s lúc 11:41:52Z ⇒ boot lúc 11:15:17,74Z; btime
11:15:18Z — chênh 0,26 s. `uptime -s` = 11:15:18Z, KHỚP btime
từng giây. Đây là kiểm đã bác H2 ở #62 (GAP §90); ở #64 kiểm
này ĐẬU nên btime LÀ giờ thật.

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round162-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t5/`
  (không nằm trong repo nên không stage): `replay-watch-162.sh`,
  `make-watcher-162.py`, `t5-stats-162.py`,
  `t5-stats-162-output.txt`, `replay-watch-162.log`,
  `replay-watch-162.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-39d46ba0`,
  `t5-postboot-poll0-d9a8d1ce.log`,
  `t5-postboot-independent-d9a8d1ce.log`.
