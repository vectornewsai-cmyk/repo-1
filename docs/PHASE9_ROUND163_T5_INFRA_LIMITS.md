# PHASE9_ROUND163_T5_INFRA_LIMITS — WATCHER-162 CHẾT SỚM KHÔNG GHI LOG (POLL CUỐI 14:25:20Z, TRƯỚC #65 9M37S — NGUYÊN NHÂN KHÔNG XÁC ĐỊNH) + WATCHER-163 KHỞI ĐỘNG TAY, POSTBOOT_PASS #65 CÓ (REPLAY BOOT+47S, NHANH THỨ HAI TỪNG ĐO); X11: 3 SOCKET MỚI X193/X194/X195 LÚC 14:46:51Z, 0 XVFB

> Luồng T5, đợt 163, lượt cron 21:35 +07 21/11/2026 (mở
> 14:35:51Z; T5 mở thực tế ~14:38Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #65
> (ỨNG VIÊN — chờ parent xác nhận số hiệu, theo quy tắc đứng T0 ghi
> ứng viên, parent quyết) 1c1cf10c-0528-4cb7-ad36-1c11ad005617**
> (btime **14:34:57Z** — /proc/stat btime 1795271697; **btime LÀ GIỜ
> THẬT** — xem §4: uptime khớp btime từng giây, /proc/1 +14 s,
> journal +15 s, Cloudflare ±0–1 s; T0-163 xác minh độc lập 9 nguồn
> và KHỚP).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (n) đợt 162,
> ghi nhận lại lần thứ mười — xem §2).** Lần kiểm tra lại thứ mười
> liên tiếp (§2).
> Watcher-162 pid 18801 CHẾT SỚM không ghi log (poll cuối 14:25:20Z,
> 331 poll đều 30/31 s, 0 NEWBOOT, 0 END — xem §4.2; **T0-163 xác
> minh độc lập và KHỚP, gọi là PHÁT HIỆN MỚI giao T5-163 điều
> tra**). Nguyên nhân chết KHÔNG xác định được từ bằng chứng còn
> lại (không đoán).
> **Watcher-163 khởi động bằng tay 14:45:03Z, pid 25133** (§3).
> **POSTBOOT_PASS cho #65 ĐÃ GHI 14:45:05Z (boot+10m08s, mode
> replay-day-du, poll=0)** — replay tự nhiên CHẠY ĐẦY ĐỦ trên #65,
> khởi động boot+47s (nhanh thứ hai từng đo, chỉ sau #59 +35s —
> PHÁ DỨT chuỗi muộn dần); kiểm chứng độc lập: postboot exit 0
> lúc 14:45:48Z, 11/11 gói + 5/5 lib (§3.1). **POSTBOOT_PASS cho #64
> ĐÃ XÁC MINH LẠI trên đĩa 11:40:00Z** (xem §3.2); **#63 KHÔNG CÓ,
> không bù được** — #63 là boot thứ 7 không có cờ (#51, #53,
> #54, #55, #57, #60, #63). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 17 REBOOT LIÊN TIẾP
> #49–#65** (§2.1; T0-163 đếm độc lập 17 — KHỚP T5; F-162-T5-6
> ĐÓNG). **X11: TRỐNG lúc T5 mở (14:38:41Z); 3 socket MỚI
> X193/X194/X195 xuất hiện lúc 14:46:51Z, 0 process Xvfb** — socket
> mồ côi, chủ tạo chưa xác định, dọn thuộc T8-163 (§6).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc
> T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.
>
> **ĐÍNH CHÍNH HEADER SCRIPT (F-163-T5-7):** header
> `replay-watch-163.sh` ghi replay #65 "NHANH NHAT tung do" — **SAI**
> (#59 là boot+35s, nhanh hơn #65 boot+47s). Đúng: #65 nhanh THỨ
> HAI từng đo. Header không sửa sau khi watcher đã chạy (quy tắc
> đứng từ T5-162); LIMITS này đính chính (xem §3.1, §9).

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ là giờ thật)

| Thời điểm | Sự kiện |
|---|---|
| 11:15:18Z | **Reboot #64, boot d9a8d1ce** (btime — T5-162/T0-162 xác minh) |
| 11:40:00Z | Watcher-162 START bằng tay, pid 18801; **POSTBOOT_PASS #64 ghi** (replay-day-du, poll=0) |
| 14:16:39Z | T10-162 đóng sổ (theo T0-163) |
| 14:18:06Z | **Run 162 SUCCEEDED** (theo T0-163 — T5 không tự truy vấn DB; margin 1.065 s tới hạn 14:35:51Z; 2 event, 0 requeue, 0 lần viết lại) |
| 14:21:23Z | Aggregate 162 mtime lần cuối (sau khi T10 đóng — file đã chứa §12.3 quyết parent) |
| 14:25:20Z | **Poll cuối watcher-162** (dpkg 1.545 ổn định, md5 335dc3f2) |
| 14:25:21Z | mtime cuối `replay-watch-162.log` |
| 14:30:00Z | Hạn END watcher-162 — KHÔNG tới được (không có dòng END) |
| 14:34:57Z | **Reboot #65 (ứng viên), boot 1c1cf10c** — btime 1795271697; #64 sống 11.979 s (3h19m39s); reboot xảy ra 18m18s SAU khi T10-162 đóng sổ |
| 14:35:11Z | /proc/1 mtime (btime+14 s) |
| 14:35:12Z | Journal first entry (btime+15 s) |
| 14:35:44Z | **Hoạt động dpkg ĐẦU trên #65 (boot+47s)** — 7 s TRƯỚC giờ mở đợt |
| 14:35:51Z | Lượt cron đợt 163 mở (giờ host) |
| ~14:38Z | T5-163 mở: boot 1c1cf10c, **không watcher nào chạy**; không POSTBOOT_PASS cho #65; replay ĐANG CHẠY (dpkg đang tăng) |
| 14:38:49Z | **Replay xong** (dpkg cuối, gstreamer1.0-tools installed — boot+3m52s) |
| 14:44:36Z | T0-163 kiểm lại POSTBOOT_PASS #65 lần cuối: CHƯA CÓ (đúng lúc kiểm) |
| 14:45:03Z | **Watcher-163 START (bằng tay, setsid nohup), pid 25133, boot 1c1cf10c** — poll đầu thấy dpkg ổn định 1.545 dòng → postboot poll0 exit 0 → **FLAG-WRITTEN #65 14:45:05Z (boot+10m08s, replay-day-du, poll=0)** |
| 14:45:48Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 14:46:51Z | 3 socket X11 mới X193/X194/X195 xuất hiện (0 Xvfb) |
| 14:46:55Z | T0-163 đóng cờ (ghi "POSTBOOT_PASS #65 CHƯA CÓ" — stale 110 s so với cờ đã ghi 14:45:05Z, xem §4.5) |
| 14:48:38Z | Stats script T5: ENOSPC 11 dòng; MemAvailable 2.193.108 kB |
| 14:58:38Z | Kiểm cuối trước khi viết LIMITS này: boot vẫn 1c1cf10c, watcher-163 poll đều (27 poll), cờ #65 còn, dpkg md5 aeb0886e không đổi |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (n) đợt 162 (ghi nhận hướng (3) vẫn đứng lần thứ 9) +
quyết (e) đợt 154 + các lần ghi nhận (q) đợt 155, (o) đợt 156–159,
(n) đợt 160–161: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở,
T5 khởi động lại bằng tay. T5-163 kiểm tra lại nhanh `systemctl
is-active` (§A.8): user@0/logind/dbus vẫn inactive, không linger,
không cron, không /run/user/0 — cell không đổi, kết luận đợt 154–162
giữ nguyên (lần kiểm tra lại thứ mười liên tiếp). Unit + script ở
`round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 17 REBOOT LIÊN TIẾP #49–#65

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, #62, #63, #64, #65; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#65 (17 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (16 reboot ở đợt 162 →
  17 reboot đợt này: +1 vì #65 đã qua). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`) PERSISTENT
  qua rebuild — khẳng định lần thứ mười bảy liên tiếp.
  **T0-163 đếm độc lập "17 reboot #49–#65" (65−49+1=17) — KHỚP
  với T5** (F-162-T5-6 ĐÓNG: 16 đúng cho #64, 17 đúng cho #65;
  không còn lệch đếm T0 vs T5 ở đợt này).

## 3. Watcher-163 — chạy bằng tay (quy tắc đứng (3)) + POSTBOOT_PASS #65

- **Trạng thái lúc mở (~14:38Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `kill -0 18801`: chết). Ghi vào
  `watcher-status-at-open.txt`. **T0-163 xác minh độc lập và
  KHỚP** ("Watcher-162 CHẾT SỚM không ghi log (poll cuối
  14:25:20Z, trước btime 9m37s, 0 END/0 STOP, không có file
  watcher-stop) — PHÁT HIỆN MỚI, T5-163 điều tra" — T0 kiểm lúc
  mở, trước khi watcher-163 khởi động 14:45:03Z; xem §4.2 về
  điều tra).
- **Khởi động bằng tay 14:45:03Z, pid 25133** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-163-START 2026-11-21T14:45:03Z pid=25133
  boot=1c1cf10c btime=2026-11-21 14:34:57Z end=2026-11-21T17:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=aeb0886e init_mtime=14:38:49Z cache=178 lists=39 gst_sys=269`
- **Thay đổi so với watcher-162 (3 điểm):**
  1. END = 17:30:00Z 21/11 (hạn cứng đợt 163 theo task); DIR =
     round163-t5, OLD_T5_DIR = round162-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #65 + trạng thái replay ĐÃ
     CHẠY XONG lúc khởi động (dpkg 1.545 dòng, 0 proc
     apt/dpkg, hoạt động đầu 14:35:44Z = boot+47s, 7 s TRƯỚC
     giờ mở đợt) + dự kiến REPLAY_DONE ngay poll đầu nếu ổn định.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[23]`/`17:30` + `bash -n` syntax OK
     + assert không có cụm thừa nhận H2) — adapter chạy sạch
     ngay lần đầu sau 1 lần sửa assert (xem F-163-T5-2 là lỗi
     khác, ở script stats). **Ngoại lệ: header ước "~14:43Z"
     nhưng khởi động thực tế 14:45:03Z (lệch ~2 phút) + ghi
     replay "NHANH NHAT" trong khi #59 nhanh hơn — xem
     F-163-T5-1/F-163-T5-7; chỉ là comment, không ảnh hưởng logic.**
- **Poll đều đã xác minh:** 8 poll lúc stats 14:48:38Z
  (14:45:03Z → 14:48:36Z; khoảng: 32 s ×1, 30 s ×5, 31 s ×1 —
  khoảng 32 s là do postboot chạy trong iteration đầu, xem
  F-163-T5-6), thêm 19 poll tới kiểm cuối 14:58:09Z (tổng 27
  poll; khoảng: 32 s ×1, 30 s ×21, 31 s ×4 — đều, 0 khoảng
  trống). Lúc 14:58:38Z log 32 dòng: START 1, MONITOR 1,
  poll 27, FLAG-WRITTEN 1, REPLAY_DONE 1, postboot poll0 1,
  0 NEWBOOT, 0 END, 0 EARLY-REPAIR.
- **EARLY-REPAIR KHÔNG kích hoạt — ĐÚNG THIẾT KẾ:** replay chạy
  đầy đủ tự nhiên nên điều kiện repair (frozen ≥600 s + 0 proc +
  dòng <100) không bao giờ thỏa. Guard file `repaired-1c1cf10c`
  KHÔNG tồn tại (chưa repair — đúng, vì không cần).

### 3.1 POSTBOOT_PASS cho #65 — CÓ QUA REPLAY-DAY-DU (KHÔNG CẦN REPAIR)

- **Replay tự nhiên trên #65: CHẠY ĐẦY ĐỦ, NHANH.** Bằng chứng:
  hoạt động dpkg đầu 14:35:44Z (boot+47s), rồi cài đặt liên tục
  14:35:44Z → 14:38:49Z (3m05s hoạt động): apt history 4 lần
  apt-get cuối 14:38:40/42/45/48Z, End-Date 14:38:49Z;
  gstreamer1.0-tools xong 14:38:49Z; dpkg 2 →
  **1.545 dòng** (md5 aeb0886e, ổn định từ 14:38:49Z tới kiểm
  cuối 14:58:38Z — 19m49s không đổi, 0 proc apt/dpkg); lists 39;
  cache 178 .deb; GST hệ thống 269 file (thư mục thật apt, như
  #64); `/var/log/apt/` TỒN TẠI.
- **Hoạt động dpkg đầu boot+47s (47 s)** — **nhanh THỨ HAI từng
  đo, chỉ sau #59 (+35s)**; nhanh hơn #64 (+20m22s) tới 19m35s
  và nhanh hơn #62 (+22m10s thật) tới 21m23s. Chuỗi muộn dần
  #61 +9m50s → #62 +22m10s → #64 +20m22s **BỊ PHÁ DỨT** ở #65
  (+47s). **Đính chính header script (F-163-T5-7):** header ghi
  "NHANH NHAT tung do" là SAI — #59 (+35s) nhanh hơn #65
  (+47s); LIMITS này dùng "nhanh thứ hai từng đo".
  Xuất hiện 7 s TRƯỚC giờ mở đợt (14:35:44Z vs 14:35:51Z) —
  cùng mẫu #61 (12 s), #62 (11 s), #64 (11 s) — lần thứ tư liên
  tiếp replay khởi động vài giây trước giờ mở đợt (ghi nhận theo
  T5-161/T0-162; T5-163 không suy đoán cơ chế).
- **dpkg 1.545 dòng — breakdown TRÙNG KHỚP #64 và Dot 151:**
  breakdown theo action field (python, §A.4): 1.040 status +
  178 configure + 169 install + 106 startup + 43 trigproc +
  9 upgrade = 1.545. Các số 169 install / 9 upgrade / 178
  configure TRÙNG KHỚP header postboot Dot 151 ("dpkg 1545 dong
  / 169 install / 9 upgrade / 178 configure, goi cuoi
  gstreamer1.0-tools") và số dòng cuối #64 (1.545 dòng,
  md5 335dc3f2). md5 khác nhau (aeb0886e vs 335dc3f2 vs 3411a9cc
  vs 51d12c3d) vì timestamp trong từng dòng dpkg.log khác nhau —
  cùng bộ gói, khác thời gian chạy. Gói cuối cùng:
  gstreamer1.0-tools 14:38:49Z (giống Dot 151/#64). Cache APT
  178 .deb — trùng số Dot 151 ("cache APT SONG 178 .deb/156M");
  **lists 39 — KHÁC #64 (37), +2** (ghi nhận, không suy đoán
  nguyên nhân; watcher ghi lists=39 ổn định cả 13 poll).
- **REPLAY_DONE ngay poll đầu (14:45:03Z):** watcher khởi động
  lúc dpkg đã ổn định 374 s (từ 14:38:49Z), 0 proc, dòng = prev
  (1.545) → stable=1 → postboot poll0 **exit=0** → ghi cờ ngay.
  Đây là đường chuẩn (cùng mẫu #61/#64 poll=0), không phải đường
  tắt: dpkg đã đóng băng đủ lâu + postboot PASS thật.
- **FLAG-WRITTEN 14:45:05Z** (`round163-t5/POSTBOOT_PASS`):
  `boot 1c1cf10c-0528-4cb7-ad36-1c11ad005617 (btime 2026-11-21
  14:34:57Z; watcher-163) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T14:45:04Z; POSTBOOT_PASS moi ghi 2026-11-21T14:45:05Z
  poll=0 (replay-day-du); co cu d9a8d1ce luu POSTBOOT_PASS-d9a8d1ce`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-d9a8d1ce` đã đối chiếu bằng
  `diff` — **KHỚP cờ #64 gốc** (round162-t5).
- **Cờ lúc 14:45:05Z = boot+10m08s (608 s).** Nhanh hơn #64
  (boot+24m42s) 14m34s và #62 (boot+60m01s) nhiều. Cửa sổ hở của
  hướng (3) ở #65: cờ có **6m24s sau khi T5 mở thực tế
  (~14:38Z)** và 9m14s sau giờ mở đợt — nhưng khoảng
  KHÔNG-watcher 19m43s trước đó (do watcher-162 chết sớm, xem
  §4.2) là lỗ hổng riêng của đợt này. **Không thiệt hại đo
  được:** cờ có trước khi T4/T8-163 cần gate0 (T0-163 đóng
  14:46:55Z đã ghi nhận cờ CHƯA CÓ — stale 110 s, xem §4.5;
  các luồng khác đọc cờ sau 14:45:05Z đều thấy cờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-1c1cf10c.log`, exit 0,
  14:45:48Z): wrapper PASS, libs PASS đủ 5, GST PASS (thư mục
  thật apt, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5).
- **Phối hợp T4/T8-163:** poller T4-163 + harness T8-163 đọc
  `round163-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  14:45:05Z, TRƯỚC khi các luồng khác cần gate0.

### 3.2 POSTBOOT_PASS cho #64 — XÁC MINH LẠI ĐỘC LẬP (không chỉ tin T5-162)

- File `round162-t5/POSTBOOT_PASS` CÒN trên đĩa, mtime
  11:40:00Z, nội dung đọc trực tiếp lúc 14:41Z:
  `boot d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7 (btime 2026-11-21
  11:15:18Z; watcher-162) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T11:40:00Z; POSTBOOT_PASS moi ghi 2026-11-21T11:40:00Z
  poll=0 (replay-day-du); co cu 39d46ba0 luu POSTBOOT_PASS-39d46ba0`
  — KHỚP từng chữ với LIMITS T5-162 §A.3.
- Log watcher-162 gốc: dòng REPLAY_DONE + FLAG-WRITTEN đều
  11:40:00Z, boot d9a8d1ce (xem §A — 336 dòng, kinds
  START 1 / MONITOR 1 / poll 331 / REPLAY_DONE 1 / postboot 1 /
  FLAG-WRITTEN 1). Backup `POSTBOOT_PASS-39d46ba0` diff KHỚP cờ
  #62 gốc (kiểm lại đợt này).
- **POSTBOOT_PASS #63 KHÔNG CÓ:** không file
  `POSTBOOT_PASS-94d22520` nào trong round161-t5/round162-t5/
  round163-t5/ (kiểm trực tiếp từng đường dẫn); `find` toàn bộ
  file POSTBOOT_PASS* — không file nào chứa 94d22520 (xem §A.2c).
  **#63 vẫn là boot thứ 7 không cờ.**

## 4. Boot #64/#65 + đồng hồ — #65 KHÔNG NGHỊCH LÝ; WATCHER-162 CHẾT SỚM

### 4.1 Bằng chứng quyết định cho #65 (bài học F-161-T5-2 đã áp dụng)

1. **Uptime khớp btime trên #65 (T5 đo trực tiếp):** uptime
   820,93 s lúc 14:48:38Z ⇒ boot lúc 14:34:57,07Z; btime
   14:34:57Z — **chênh 0,07 s**. `uptime -s` = 14:34:57Z, KHỚP
   btime từng giây. Đây chính là kiểm đã bác H2 ở #62 (GAP §90):
   ở #65 kiểm này ĐẬU, nên **btime #65 LÀ giờ thật, không cần
   khung thứ hai**.
2. **/proc/1 và journal khớp btime +14/+15 s (mẫu bình thường):**
   /proc/1 mtime 14:35:11Z; journal first entry 14:35:12Z
   (epoch 1795271712); journal_boots chỉ 1 boot (#65). (Chậm hơn
   #64 (+11 s) vài giây — biến thiên bình thường của trình tự
   khởi động, không phải lệch đồng hồ: uptime khớp btime tới
   0,07 s.)
3. **Đồng hồ mới ĐÚNG lúc đo (T5 đo 2 lần):** 14:40:37Z local
   vs Cloudflare 14:40:38 GMT (+1 s); 14:48:39Z local vs
   Cloudflare 14:48:39 GMT (0 s). GitHub −9 s lúc 14:48:38Z là
   edge lag, không dùng làm chuẩn (bài học F-159-T7-1).
4. **T0-163 xác minh độc lập 9 nguồn và KHỚP:** btime #65
   1795271697 = 14:34:57Z LÀ GIỜ THẬT; uptime bracket 3 lần
   boot_est 1795271697,92; journal first +15 s; /proc/1
   +14,49 s; Cloudflare ±1 s. T5 KHÔNG tự truy vấn scheduler DB
   (số liệu run 162 lấy từ T0-163, đã nêu rõ nguồn); đóng góp
   độc lập của T5 cho kết luận "không nghịch lý" là các mục
   (1)–(3) + tính đều poll watcher-162 (§4.2), không phụ thuộc DB.
5. **T0-163: boot #64 chết trong (14:25:21Z, 14:34:57Z]; 0 file
   đổi trong cửa sổ overlap** — KHÔNG overlap dài (khác #62).
   Reboot #65 xảy ra SAU khi T10-162 đóng sổ 18m18s (đóng
   14:16:39Z → btime 14:34:57Z) — claim "không reboot mới trong
   lúc T10-162 đóng sổ" của aggregate 162 **ĐỨNG**.

### 4.2 Watcher-162 chết sớm — ĐIỀU TRA THEO GIAO CỦA T0-163

- **Sự kiện (đo lại độc lập từ log gốc — Phụ lục B):** 331 poll,
  11:40:00Z → 14:25:20Z, khoảng giữa hai poll liên tiếp: 30 s
  ×310, 31 s ×20, **0 khoảng trống**. Poll cuối 14:25:20Z là
  poll bình thường (dpkg 1.545 ổn định, md5 335dc3f2, 0 proc).
  Log mtime cuối 14:25:21Z. **KHÔNG có dòng END** (hạn
  14:30:00Z chưa tới), **KHÔNG có dòng NEWBOOT**, **KHÔNG có
  file watcher-stop** trong round162-t5/. pid 18801 chết
  (`kill -0`: No such process).
- **Chết 9m37s (577 s) TRƯỚC btime #65** → KHÔNG phải chết theo
  reboot. **Chết 4m40s (280 s) TRƯỚC hạn END** → KHÔNG thoát tự
  nhiên theo logic script (script chỉ thoát ở END, watcher-stop,
  hoặc bị kill từ ngoài — xem code `replay-watch-162.sh`).
- **Nguyên nhân KHÔNG xác định được — hai giả thuyết đều phù
  hợp toàn bộ bằng chứng, không giả thuyết nào được xác nhận:**
  (a) tiến trình bị kill từ ngoài (SIGTERM/SIGKILL — không có
  bản ghi nào còn lại: journal/dmesg/wtmp của boot #64 đã mất
  theo rebuild; `dmesg` không đọc được — EPERM);
  (b) cell đóng băng/tạm dừng ở phía host ~14:25:20Z rồi reboot
  14:34:57Z (không có writer nào khác còn hoạt động trong cửa
  sổ để phân biệt: sampler T9 dừng 13:55:46Z, T7 đóng 14:01:39Z,
  T10 đóng 14:16:39Z, aggregate mtime cuối 14:21:23Z — sau
  14:21:23Z chỉ còn watcher-162 ghi; T0-163 ghi "0 file đổi"
  trong cửa sổ (14:25:21Z, 14:34:57Z] — phù hợp cả hai giả
  thuyết).
- **Run 162 (cron cha) SUCCEEDED 14:18:06Z (theo T0-163) — 7m14s
  TRƯỚC khi watcher dừng** — watcher không chết cùng lúc
  teardown của run cha; không có bằng chứng nối hai sự kiện
  (không suy đoán quan hệ nhân quả).
- **Hậu quả đo được:** KHÔNG có watcher trong 19m43s
  (14:25:20Z → 14:45:03Z), gồm cả thời điểm reboot #65 — reboot
  được phát hiện hậu kiểm qua btime (T0/T5), không có dòng
  NEWBOOT nào trong log watcher; NHƯNG không mất đo nào: replay
  #65 chạy đầy đủ tự nhiên, cờ #65 có 14:45:05Z (trước khi
  T4/T8-163 cần gate0), POSTBOOT_PASS #64 còn nguyên trên đĩa,
  marker còn nguyên.
- **T0-163 gọi đây là PHÁT HIỆN MỚI và giao T5-163 điều tra** —
  T5 đã điều tra tới giới hạn bằng chứng còn lại (log gốc +
  mtime + ps/kill + đối chiếu T0); không còn nguồn nào khác để
  tra (journal/dmesg/wtmp của #64 đã mất theo rebuild — cùng mẫu
  các đợt trước). Nếu watcher-163 cũng chết sớm không ghi log
  trong đợt sau thì đó thành mẫu cần điều tra sâu (xem §7.5).

### 4.3 Boot #64 (d9a8d1ce, btime 11:15:18Z): #64 SỐNG 11.979 S

- #64 sống **11.979 s (3h19m39s)** (11:15:18Z → 14:34:57Z).
  Dài hơn #62 (9.073 s) và #61 (9.220 s) — boot dài nhất trong
  chuỗi gần đây (#61→#62 9.220 s, #62→#63 9.073 s, #63→#64
  2.676 s, #64→#65 11.979 s). Gap #64→#65 = 11.979 s chưa đưa
  vào CERT/FULL — chờ #95?/#96? đóng (giao T2-163 làm cơ sở
  FULL110 theo aggregate 162 §11.2).

### 4.4 Tuổi boot theo khung thật duy nhất (không trừ lẫn lộn)

| Mốc | Giờ (thật) | Tuổi boot #65 |
|---|---|---|
| btime #65 | 14:34:57Z | — |
| Hoạt động dpkg đầu | 14:35:44Z | boot+47s |
| Replay xong (dpkg cuối) | 14:38:49Z | boot+3m52s |
| Watcher-163 START | 14:45:03Z | boot+10m06s |
| FLAG-WRITTEN #65 | 14:45:05Z | boot+10m08s |
| Postboot độc lập T5 | 14:45:48Z | boot+10m51s |
| Stats script T5 | 14:48:38Z | boot+13m41s |

- Tuổi boot #64: **11.979 s (3h19m39s)** (11:15:18Z → 14:34:57Z).
- Reboot #65 xảy ra GIỮA hai đợt theo giờ thật (sau T10-162
  đóng 14:16:39Z 18m18", trước đợt 163 mở 14:35:51Z 54") — không
  phá lượt đo nào trong đợt 162 (run 162 đã SUCCEEDED 14:18:06Z,
  16m51s trước btime — theo T0-163).

### 4.5 Ghi chú mốc thời gian T0-163 vs cờ #65 (không phải mâu thuẫn)

- T0-163 đóng cờ 14:46:55Z ghi "POSTBOOT_PASS #65 CHƯA CÓ (T5-163
  sở hữu)". Nhưng cờ #65 đã ghi **14:45:05Z — 110 s TRƯỚC
  khi T0 đóng**. Giải thích: T0 kiểm lại postboot lần cuối lúc
  14:44:36Z — **29 s TRƯỚC khi cờ xuất hiện** — và viết cờ đóng
  sổ theo trạng thái lúc kiểm, không kiểm lại lúc 14:46:55Z. Đây
  là stale do mốc kiểm, không phải T0 sai về thực tế lúc kiểm, và
  không phải T5 ghi cờ sai giờ (log watcher + mtime file
  POSTBOOT_PASS đều 14:45:05Z; `diff` backup cờ cũ KHỚP).
  Cùng mẫu T0-162 (stale 32 s, xem LIMITS T5-162 §4.5).
  T10 lưu ý khi đọc hai cờ: cờ #65 CÓ, từ 14:45:05Z.
- Tương tự, câu "Watcher-163 CHƯA CÓ lúc đóng" của T0 cũng theo
  mốc kiểm lúc mở (watcher-163 khởi động 14:45:03Z, sau mốc kiểm
  cuối của T0; T0 đóng 14:46:55Z).

### 4.6 OVERLAP #62 — nhắc lại phán đứng (không còn mở)

- GAP §90 + T10-161 §10.5 + parent quyết (q) đợt 161:
  **OVERLAP ĐÚNG (H1/H2 đều BỊ BÁC)**. T5-163 ghi nhận phán này
  làm chuẩn; header watcher-163 viết theo phán này và đã
  grep-verified không chứa câu thừa nhận H2 nào trước khi khởi
  động (F-162-T5-1).
- **Lưu ý kiểm chứng (F-163-T5-8):** grep trên
  `replay-watch-162.sh` lúc mở đợt 163 KHÔNG tìm thấy chuỗi
  "H2" nào trong file — mô tả F-162-T5-1 ("header script còn
  ghi T5 chấp nhận H2") không kiểm chứng được trên đĩa; đính
  chính trong LIMITS T5-162 §4 (OVERLAP đúng, H1/H2 bị bác) thì
  ĐÚNG và giữ nguyên. Chỉ mô tả vị trí câu stale là không khớp
  file thực tế.

## 5. Quy tắc đứng (3) — áp dụng trong đợt 163

- T0-163 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-163
  xác minh độc lập "watcher-162 chết sớm" — KHỚP với T5. T5 tự
  khởi động lại pid 25133 14:45:03Z (ghi trong
  `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #65: 10m08s từ boot tới cờ** — NHƯNG
  chỉ **6m24s từ lúc T5 mở tới cờ** (replay đã chạy xong trước
  khi T5 mở; cờ chỉ đợi watcher khởi động + 1 poll). Đây là
  khoảng hở đã biết của hướng (3): cờ chỉ có khi có phiên T5
  sau reboot + replay/repair xong. Khoảng KHÔNG-watcher 19m43s
  (do watcher-162 chết sớm — §4.2) là lỗ hổng riêng của đợt này:
  reboot #65 rơi vào khoảng không có watcher — #65 vẫn BẮT
  ĐƯỢC cờ nhờ replay tự nhiên chạy đầy đủ + T5-163 khởi động
  kịp (khác #63 lọt hoàn toàn vì không có phiên T5 nào sau
  reboot).
- **Watcher-163 tiếp tục giám sát tới 17:30:00Z**; nếu có reboot
  #66 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-164 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-163 là chủ):** MemTotal 8.125.908
  kB; MemAvailable **2.193.108 kB @14:48:38Z** (CAO hơn #64 lúc
  T5-162 đóng 2.040.312 kB); MemFree 168.060 kB. loadavg 0,69
  @14:48:38Z (yên — các luồng đợt 163 mới mở; không phải kẹt).
- **ENOSPC journal boot #65:** **11 dòng** lúc 14:48:38Z
  (journal 105 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-163 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. So sánh: #64 có 5 dòng lúc T5-162 đo
  (boot+26m34s); #65 đã 11 dòng lúc boot+13m41s — tích lũy
  nhanh hơn (ghi nhận, không kết luận — T9 phán).
- **Không reboot mới trong phiên T5** (boot vẫn 1c1cf10c lúc
  kiểm cuối 14:58:38Z — KHÔNG có #66; watcher-163 tiếp tục
  giám sát tới hạn cứng 17:30:00Z).
- **journal_boots chỉ còn 1 boot (#65):** journal của #64
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).
- **X11 — TRỐNG lúc mở, 3 socket MỚI sau đó:**
  `/tmp/.X11-unix/` TRỐNG lúc T5 mở 14:38:41Z (0 socket, dir
  mtime 14:35 — T0-163 cũng ghi TRỐNG, kiểm trước 14:46:51Z).
  Lúc stats 14:48:38Z: **3 socket X193/X194/X195, mtime
  14:46:51Z** (cả 3 trong 0,1 s: .469/.475/.562); **0 process
  Xvfb** (`ps`/`pgrep` không thấy), `ss -x` không thấy
  listener, `fuser` không thấy holder — socket mồ côi. Cùng 3
  số display như đợt 162 nhưng là file MỚI trên boot #65
  (không phải socket cũ sống qua reboot — /tmp reset theo boot;
  cùng mẫu quyết (bb) đợt 162). Chủ tạo chưa xác định (T5 không
  đoán — có thể T8/T4-163 khởi Xvfb); **dọn thuộc T8-163** theo
  aggregate 162 §11.13. T5 KHÔNG tự dọn (Xvfb thuộc vòng đời
  harness T8; xóa socket trong lúc T8 có thể đang chạy là can
  thiệp ngoài phạm vi T5).

## 7. Nợ mở chuyển đợt 164 (từ T5-163)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 17 reboot
   #49–#65. T5-164 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục). F-162-T5-6 ĐÓNG (T0-163 đếm độc lập 17 —
   KHỚP T5).
3. **POSTBOOT_PASS cho #65 — XONG 14:45:05Z** (watcher-163,
   replay-day-du, poll=0; T4/T8-163 phối hợp qua cờ).
   Watcher-163 tiếp tục giám sát tới 17:30:00Z; nếu có reboot
   #66 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-164 kiểm tra log.
4. **POSTBOOT_PASS #63 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 7 không cờ; cùng tiền lệ #51/#53/#54/#55/#57/#60).
   Chỉ thiếu cờ watcher (dữ kiện #63 chỉ còn cờ T7/T10).
5. **Watcher-162 chết sớm 14:25:20Z — NGUYÊN NHÂN KHÔNG XÁC
   ĐỊNH** (xem §4.2). Nếu watcher-163 cũng chết sớm không ghi
   log trong đợt sau thì đó thành mẫu cần điều tra sâu (kiểm tra
   OOM/host-freeze); đợt này chỉ ghi nhận 1 lần, không mở giả
   thuyết mới.
6. **Replay khởi động: #59 +35s → #61 +9m50s → #62 +22m10s →
   #64 +20m22s → #65 +47s.** #65 PHÁ DỨT chuỗi muộn dần (nhanh
   thứ hai từng đo, sau #59). Mẫu "vài giây trước giờ mở đợt"
   giữ nguyên 4 đợt liên tiếp (#61: 12 s, #62: 11 s, #64: 11 s,
   #65: 7 s).
7. **Cổng boot+15m của (h) không cần dùng ở #65** (replay chạy
   đầy đủ; frozen không bao giờ thỏa). Ghi nhận để T10 đánh giá
   (h): cổng chỉ có ý nghĩa khi replay vắng — ở #65 nó không
   kích hoạt và không cần kích hoạt.
8. **GST trên #65 là THƯ MỤC THẬT apt (269 file)** — như #64.
   Boot sau phải làm lại qua replay/repair (ephemeral theo rebuild).
9. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #65): T5 đợt sau quyết có cập nhật theo Dot
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

- **(3) vẫn đủ cho hiện tại** — đợt này replay #65 chạy đầy đủ
  tự nhiên, cờ có ở boot+10m08s, chỉ 6m24s sau khi T5 mở.
  T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ mười liên tiếp.
- **Số hiệu #65 vẫn là ứng viên chờ parent xác nhận** (T0-163
  §1) — T5 dùng "#65 (ứng viên)" trong LIMITS này theo đúng
  quy tắc đứng.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #63 từ log của
  T7/T10-161** (xem §4.3) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #63 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Số đếm marker: T5 giữ 17 reboot (#49–#65)** — T0-163 đếm
  độc lập 17, KHỚP (F-162-T5-6 ĐÓNG). Kết luận persistence
  (marker CÒN) không phụ thuộc số đếm này.
- **T0-163 "POSTBOOT_PASS #65 CHƯA CÓ" stale 110 s** (cờ đã ghi
  14:45:05Z, T0 đóng 14:46:55Z) — không phải mâu thuẫn thực tế,
  chỉ là mốc kiểm của T0 trước khi watcher-163 khởi động; T10
  không cần phân xử (xem §4.5).
- **Watcher-162 chết sớm: nguyên nhân không xác định** — T5
  không đề xuất giả thuyết; nếu lặp lại ở đợt sau thì điều tra
  sâu (xem §7.5).

## 9. Sai số của chính T5-163

- **F-163-T5-1 — Header `replay-watch-163.sh` ước "~14:43Z,
  boot+~8'" nhưng khởi động thực tế 14:45:03Z (boot+10m06s) —
  lệch ~2 phút (ước viết lúc làm adapter, spawn sau đó 2 phút).
  Không sửa script sau khi watcher đã chạy (quy tắc đứng từ
  T5-162); dòng START trong log là mốc chính xác. Bài học: ước
  thời gian khởi động trong header nên viết sau khi spawn xong
  hoặc bỏ giờ ước khỏi header.**
- **F-163-T5-2 — `t5-stats-163.py` lỗi format `%` lần đầu**
  (`ls --time-style=+%H:%M:%S` trong chuỗi `%` format — Python
  báo `ValueError: unsupported format character 'H'`): bắt được
  ngay, sửa bằng nối chuỗi, chạy lại sạch. Không mất dữ liệu
  (script chỉ ghi output ở cuối; lần chạy lỗi không ghi file).
- **F-163-T5-3 — Exec spawn watcher báo output_drain_timeout
  lúc 14:45:07Z (cùng họ F-162-T5-2):** watcher đã spawn thành
  công (child `bash replay-watch-163.sh` + `sleep 30` quan sát
  được trong báo cáo tiến trình con); T5 kiểm lại bằng lệnh đọc
  riêng (log + `kill -0` 25133) thay vì tin output của exec
  spawn. Không mất dòng log nào — log đầy đủ tới poll 14:51:07Z
  lúc viết LIMITS.
- **F-163-T5-4 — Stats §2c chỉ đọc file POSTBOOT_PASS\* (glob),
  không grep toàn thư mục** (khác họ F-162-T5-4/F-161-T5-5): mục
  §2c của `t5-stats-163.py` chỉ mở các file khớp
  `POSTBOOT_PASS*` để kiểm chuỗi boot8, nên không có hiện tượng
  tự khớp file do chính T5 viết. Kết luận "#63 KHÔNG CÓ cờ" dựa
  trên việc KHÔNG tồn tại file `POSTBOOT_PASS-94d22520` nào
  (kiểm trực tiếp từng đường dẫn) + glob liệt kê toàn bộ file
  POSTBOOT_PASS*, không dựa trên grep thư mục.
- **F-163-T5-5 — Nợ header postboot script còn ghi Dot 151**
  (ghi nhận từ T5-152 §5.4, thấy lại ở log poll0 + log độc lập
  đợt này — header log ghi boot e9295700/2e430750 đợt 151 trong
  khi checks là của #65): nợ thẩm mỹ trong log header, không ảnh
  hưởng kết quả check. T5 đợt sau quyết có cập nhật theo Dot hay
  không.
- **F-163-T5-6 — Poll đầu watcher-163 cách poll thứ hai 32 s**
  (thay vì 30/31 s): do postboot chạy trong iteration đầu (~2 s)
  trước `sleep 30`; các khoảng sau đều 30/31 s. Không phải slew
  đồng hồ.
- **F-163-T5-7 — Header `replay-watch-163.sh` ghi replay #65
  "NHANH NHAT tung do" — SAI: #59 là boot+35s, nhanh hơn #65
  (boot+47s).** Đúng: #65 nhanh THỨ HAI từng đo, nhanh hơn #64
  tới 19m35s. Header viết trước khi T5 đối chiếu lại chuỗi đầy
  đủ; không sửa script sau khi watcher đã chạy; LIMITS này đính
  chính (xem §3.1). Bài học: đối chiếu chuỗi lịch sử đầy đủ
  TRƯỚC khi viết tính từ nhất ("nhanh nhất", "đầu tiên") vào
  header.
- **F-163-T5-8 — Grep trên `replay-watch-162.sh` KHÔNG tìm thấy
  chuỗi "H2" nào** — mô tả F-162-T5-1 ("header script còn ghi T5
  chấp nhận H2") không kiểm chứng được trên đĩa. LIMITS T5-162
  §4 đính chính OVERLAP thì ĐÚNG và giữ nguyên; chỉ mô tả vị
  trí câu stale là không khớp file thực tế. Header 163 đã
  grep-verified sạch trước khi khởi động (không có cụm thừa
  nhận H2 nào).
- **Giới hạn xác minh (không phải sai số):** T5-163 xác minh
  boot #65 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + wtmp; kiểm tra đồng hồ
  so với Cloudflare 2 lần (+1 s @14:40Z và 0 s @14:48Z — T5 đo
  trực tiếp). T5 KHÔNG tự truy vấn scheduler DB (số liệu run 162
  lấy từ T0-163, đã nêu rõ nguồn); đóng góp độc lập của T5
  cho kết luận "không nghịch lý #65" là neo uptime + tính đều
  poll watcher-162 + đo Cloudflare (§4.1 mục 1–4), không phụ
  thuộc DB. Btime #64 (11:15:18Z) lấy từ T10-162/T0-163 (đã xác
  minh lúc đóng), không xác minh độc lập được từ #65 (journal
  volatile). Mọi khoảng thời gian trong LIMITS này đều tính lại
  từ endpoint thô bằng script python (Phụ lục B) — không cộng/trừ
  lũy kế bằng tay.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-163.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (1c1cf10c, btime
  14:34:57Z) — và KHỚP xác minh độc lập 9 nguồn của T0-163.

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/t5-stats-163.py`
(output đầy đủ lưu tại `t5-stats-163-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 14:48:38Z, SAU khi cờ POSTBOOT_PASS #65
đã ghi; F-163-T5-4: §2c grep match file do chính T5 viết — kết
luận "#63 KHÔNG CÓ cờ" dựa trên kiểm đường dẫn trực tiếp + find).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-163 (trich bang script, 2026-11-21T14:48:38Z) ===

--- 1. Boot hien tai ---
boot_id=1c1cf10c-0528-4cb7-ad36-1c11ad005617
btime_epoch=1795271697 = 2026-11-21T14:34:57Z
uptime_s=820.93 now=2026-11-21T14:48:38Z
uptime_-s=2026-11-21 14:34:57
/proc/1 mtime=2026-11-21 14:35:11.495619191 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 1c1cf10c05284cb7ad361c11ad005617 Sat 2026-11-21 14:35:12 UTC Sat 2026-11-21 14:48:02 UTC
journal_first_entry=1795271712.092091 htch-runtime systemd-journald[17]: Journal started
clocksource=tsc
local_date=Sat Nov 21 14:48:39 UTC 2026
cloudflare_date=Date: Sat, 21 Nov 2026 14:48:39 GMT
github_date=Date: Sat, 21 Nov 2026 14:48:30 GMT

--- replay-watch-162.log ---
tong_dong=336
kinds={'START': 1, 'MONITOR': 1, 'poll': 331, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=331 first=11:40:00Z last=14:25:20Z gaps={30.0: 310, 31.0: 20}
md5_set=['335dc3f2']
lines_set=['1545']
boot_set=['d9a8d1ce']
dong_dau: REPLAY-WATCH-162-START 2026-11-21T11:40:00Z pid=18801 boot=d9a8d1ce btime=2026-11-21 11:15:18Z end=2026-11-21T14:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=335dc3f2 init_mtime=11:37:47Z cache=178 lists=37 gst_sys=269
dong_cuoi: 2026-11-21T14:25:20Z boot=d9a8d1ce poll dpkg_lines=1545 md5=335dc3f2 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37
mtime_log=2026-11-21T14:25:21Z

--- replay-watch-163.log ---
tong_dong=13
kinds={'START': 1, 'MONITOR': 1, 'poll': 8, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=8 first=14:45:03Z last=14:48:36Z gaps={32.0: 1, 30.0: 5, 31.0: 1}
md5_set=['aeb0886e']
lines_set=['1545']
boot_set=['1c1cf10c']
dong_dau: REPLAY-WATCH-163-START 2026-11-21T14:45:03Z pid=25133 boot=1c1cf10c btime=2026-11-21 14:34:57Z end=2026-11-21T17:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=aeb0886e init_mtime=14:38:49Z cache=178 lists=39 gst_sys=269
dong_cuoi: 2026-11-21T14:48:36Z boot=1c1cf10c poll dpkg_lines=1545 md5=aeb0886e apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39
mtime_log=2026-11-21T14:48:36Z

--- 2c. POSTBOOT_PASS theo boot ---
  #1c1cf10c: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/POSTBOOT_PASS']
  #d9a8d1ce: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/POSTBOOT_PASS-d9a8d1ce', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t5/POSTBOOT_PASS']
  #94d22520: (khong co file co nao chua)
  #39d46ba0: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t5/POSTBOOT_PASS-39d46ba0', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t5/POSTBOOT_PASS']
  round163-t5/POSTBOOT_PASS: CO
  round163-t5/POSTBOOT_PASS-1c1cf10c: KHONG CO
  round162-t5/POSTBOOT_PASS: CO
  round162-t5/POSTBOOT_PASS-d9a8d1ce: KHONG CO
  round162-t5/POSTBOOT_PASS-94d22520: KHONG CO
  round163-t5/POSTBOOT_PASS-94d22520: KHONG CO
  round162-t5/POSTBOOT_PASS-39d46ba0: CO

--- 3. round163-t5/POSTBOOT_PASS (mtime 2026-11-21T14:45:05Z) ---
boot 1c1cf10c-0528-4cb7-ad36-1c11ad005617 (btime 2026-11-21 14:34:57Z; watcher-163) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T14:45:04Z; POSTBOOT_PASS moi ghi 2026-11-21T14:45:05Z poll=0 (replay-day-du); co cu d9a8d1ce luu POSTBOOT_PASS-d9a8d1ce

--- 3a. diff POSTBOOT_PASS-d9a8d1ce (backup) vs goc ---
DIFF-KHOP

--- 3b. round162-t5/POSTBOOT_PASS (#64, xac minh lai) (mtime 2026-11-21T11:40:00Z) ---
boot d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7 (btime 2026-11-21 11:15:18Z; watcher-162) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T11:40:00Z; POSTBOOT_PASS moi ghi 2026-11-21T11:40:00Z poll=0 (replay-day-du); co cu 39d46ba0 luu POSTBOOT_PASS-39d46ba0

--- 3c. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20T11:39:47Z

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=aeb0886e mtime=2026-11-21 14:38:49Z
dpkg_dong_dau=2026-11-21 14:35:44 startup packages configure
dpkg_dong_cuoi=2026-11-21 14:38:49 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
dpkg_breakdown_grep install=169 upgrade=9 configure=178
dpkg_breakdown_awk={'startup': 106, 'install': 169, 'status': 1040, 'configure': 178, 'trigproc': 43, 'upgrade': 9} total=1545
cache_deb=178 lists_entries=39
gst_sys_files=269
gst_symlink=drwxr-xr-x 1 root root 8902 Nov 21 14:37 /usr/lib/x86_64-linux-gnu/gstreamer-1.0
apt_procs=
watcher163_kill0=ALIVE
watcher162_kill0=DEAD

--- 5. Trang thai 11 goi + 5 lib ---
  libevent-2.1-7t64: install ok installed
  gstreamer1.0-plugins-base: install ok installed
  gstreamer1.0-plugins-good: install ok installed
  gstreamer1.0-plugins-bad: install ok installed
  gstreamer1.0-plugins-ugly: install ok installed
  gstreamer1.0-gl: install ok installed
  gstreamer1.0-libav: install ok installed
  gstreamer1.0-x: install ok installed
  libavif16: install ok installed
  libgstreamer1.0-0: install ok installed
  libevdev2: install ok installed
  libevent-2.1.so.7: CO
  libEGL.so.1: CO
  libavif.so.16: CO
  libdw.so.1: CO
  libevdev.so.2: CO

--- 6. ENOSPC journal boot hien tai ---
ENOSPC_dong=11
journal_dong=105

--- 7. RAM snapshot ---
MemTotal:        8125908 kB
MemFree:          168060 kB
MemAvailable:     2193108 kB
loadavg=0.69 2.82 2.23 10/509 30842

--- 8. systemd user manager ---
user_at_0=inactive
logind=inactive
dbus=inactive
linger_dir=KHONG CO
cron_unit=Unit cron.service could not be found.

--- 9. Co round163 .done (luc 14:48:38Z) ---
round163-t0.done (14:46:55Z)

--- 10. X11 ---
total 0
drwxrwxrwt  2 root root 100 Nov 21 14:46 .
drwxrwxrwt 17 root root 780 Nov 21 14:48 ..
srwxrwxrwx  1 root root   0 Nov 21 14:46 X193
srwxrwxrwx  1 root root   0 Nov 21 14:46 X194
srwxrwxrwx  1 root root   0 Nov 21 14:46 X195
xvfb_procs=none

=== HET PHU LUC T5-163 2026-11-21T14:48:42Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-1c1cf10c.log`,
14:45:48Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.9):

```
[postboot 2026-11-21 14:34:57] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 14:34:57] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 14:34:57] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 14:34:57] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 14:34:57] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 14:34:57] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 14:34:57] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 14:34:57)
```

Log postboot poll0 của watcher (`t5-postboot-poll0-1c1cf10c.log`,
14:45:03Z, exit 0 — cùng nội dung check như log độc lập; header
log còn ghi Dot 151, xem §7.9).

## Phụ lục B. Kiểm chứng độc lập thêm của T5-163 (script một lần, không gõ tay)

**B.1 Tính đều poll watcher-162 (xem §4.2):**
331 poll, 11:40:00Z → 14:25:20Z; khoảng giữa hai poll liên tiếp:
30 s ×310, 31 s ×20 — đều, 0 khoảng trống. Poll cuối là poll bình
thường (dpkg 1.545 md5 335dc3f2, 0 proc). Không có dấu hiệu slew
đồng hồ hay suy giảm trước khi chết.

**B.2 Tính đều poll watcher-163 (tới kiểm cuối 14:58:38Z):**
27 poll tới 14:58:09Z; khoảng: 32 s ×1 (khoảng đầu — postboot
trong iteration đầu, xem F-163-T5-6), 30 s ×21, 31 s ×4 — đều, 0
khoảng trống. Watcher sống và poll đúng cadence (pid 25133,
kill -0 OK).

**B.3 Các khoảng thời gian (tính lại từ endpoint thô bằng script
python — không cộng/trừ lũy kế bằng tay):**
gap #64→#65 (btime−btime) 11.979 s (3h19m39s); #64 sống 11.979 s;
watcher-162 poll cuối → btime #65: 577 s (9m37s); watcher-162
poll cuối → END 14:30:00Z: 280 s (4m40s); replay #65 bắt đầu
boot+47s; replay xong boot+3m52s (232 s); hoạt động replay 185 s
(3m05s); cờ #65 boot+10m08s (608 s); watcher-163 START boot+10m06s
(606 s); giờ mở đợt → cờ #65: 554 s (9m14s); T10-162 đóng →
btime #65: 1.098 s (18m18s); run 162 finish (theo T0-163) → btime
#65: 1.011 s (16m51s); khoảng không-watcher 14:25:20Z → 14:45:03Z:
1.183 s (19m43s); T0 kiểm lại lần cuối 14:44:36Z → cờ 14:45:05Z:
29 s; T0 đóng 14:46:55Z → sau cờ 110 s; dpkg ổn định 14:38:49Z →
stats 14:48:38Z: 589 s (9m49s).

**B.4 Cách đếm dpkg 1.545 dòng (xem §3.1):** theo action field
(python Counter trên cột $3): 1.040 status + 178 configure + 169
install + 106 startup + 43 trigproc + 9 upgrade = 1.545.
`grep -c ' install '` = 169; `grep -c ' upgrade '` = 9;
`grep -c ' configure '` = 178. Các số TRÙNG KHỚP header postboot
Dot 151 (169/9/178, gói cuối gstreamer1.0-tools) và số dòng cuối
#64 (1.545 dòng) — cùng bộ gói, khác timestamp (md5 khác:
aeb0886e vs 335dc3f2 vs 3411a9cc vs 51d12c3d).

**B.5 Uptime khớp btime trên #65 (xem §4.1 mục 1):** uptime
820,93 s lúc 14:48:38Z ⇒ boot lúc 14:34:57,07Z; btime
14:34:57Z — chênh 0,07 s. `uptime -s` = 14:34:57Z, KHỚP btime
từng giây. Đây là kiểm đã bác H2 ở #62 (GAP §90); ở #65 kiểm
này ĐẬU nên btime LÀ giờ thật.

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round163-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/`
  (không nằm trong repo nên không stage): `replay-watch-163.sh`,
  `make-watcher-163.py`, `t5-stats-163.py`,
  `t5-stats-163-output.txt`, `replay-watch-163.log`,
  `replay-watch-163.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-d9a8d1ce`,
  `t5-postboot-poll0-1c1cf10c.log`,
  `t5-postboot-independent-1c1cf10c.log`.
