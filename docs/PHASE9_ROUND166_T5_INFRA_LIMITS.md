# PHASE9_ROUND166_T5_INFRA_LIMITS — POSTBOOT_PASS #70 ĐÃ CÓ 23:40:45Z (REPLAY-DAY-DU, BOOT+1H35M20S) + WATCHER-166 CHẠY PID 26422; MARKER SỐNG QUA 22 REBOOT; PHÁT HIỆN MỚI: POLL CUỐI WATCHER-165 22:05:31Z SAU BTIME #70 6 S — CAVEAT KHUNG GIỜ #70, (m) #70 CẦN T2-166 ĐỐI CHIẾU LẠI + X11: 3 SOCKET MỚI X193/X194/X195 LÚC 23:44Z, 0 XVFB THẬT

> Luồng T5, đợt 166, lượt cron 06:35 +07 22/11/2026 (mở
> 23:35:51Z 21/11/2026; T5 mở thực tế ~23:38Z; hạn cờ ~02:00Z,
> hạn cứng đóng 02:30Z 22/11). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #70
> (ĐÃ XÁC NHẬN — parent quyết (d) đợt 165 XÁC NHẬN số hiệu;
> T7-165 xác minh 9 nguồn; T0-166 xác minh 9 nguồn KHỚP,
> .done 23:42:20Z; T5 xác minh độc lập dưới đây)**
> d1ddd946-f9f3-4561-86e8-5eb3edceb6cc (btime **22:05:25Z** —
> /proc/stat btime 1795298725; **btime LÀ GIỜ THẬT** — xem §4.1:
> uptime khớp btime trong 0,5 s, `uptime -s` = 22:05:25Z,
> /proc/1 +12,372 s, journal +12 s, Cloudflare +1 s).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (j) đợt
> 165, ghi nhận lại lần thứ mười ba — xem §2).**
> **POSTBOOT_PASS cho #70 ĐÃ GHI 23:40:45Z (boot+1h35m20s,
> mode replay-day-du, poll=0)** — replay tự nhiên CHẠY ĐẦY ĐỦ trên
> #70, hoạt động dpkg đầu 22:06:03Z (boot+38s), xong 22:08:08Z
> (boot+2m43s, 125 s); kiểm chứng độc lập: postboot exit 0 lúc
> 23:43:26Z, 11/11 gói + 5/5 lib (§3.1). **POSTBOOT_PASS cho #68
> VẪN CHƯA CÓ** (không file POSTBOOT_PASS* nào chứa 0c8a94aa —
> xem §3.2; #68 là boot thứ 9 không có cờ).
> **Watcher-165 pid 28592 CHẾT THEO REBOOT #70 — ĐÃ XÁC MINH ĐỘC
> LẬP (poll cuối 22:05:31Z, 164 poll đều; parent quyết (j) đợt
> 165 đã ghi nhận). Watcher-166 KHỞI ĐỘNG TAY 23:40:45Z,
> pid 26422** (§3). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 22 REBOOT LIÊN TIẾP
> #49–#70** (§2.1; +1 so với đợt 165 vì #70 đã qua; T0-166
> đếm độc lập KHỚP 22).
> **PHÁT HIỆN MỚI — CAVEAT KHUNG GIỜ #70 (§4.2, QUAN TRỌNG NHẤT
> ĐỢT NÀY): poll cuối watcher-165 chạy TRÊN boot #69 lúc
> 22:05:31Z, SAU btime #70 (22:05:25Z) 6 s — hai khung giờ lệch
> nhau ít nhất 6 s. Thời điểm reboot thật (khung #69) nằm trong
> (22:05:31Z, ~22:06:01Z]; offset requeue thật ∈ [2,7 s, 32,7 s]
> (cửa cứng [1,7 s, 33,7 s] với jitter poll ±1 s) — HOÀN TOÀN
> DƯỚI biên dưới dải dương 33–49,8 s, trong khi offset theo btime
> (+38,729 s) nằm TRONG dải. T5 KHÔNG tự phán (m) #70 và KHÔNG
> lật quyết (d) đợt 165 của parent — giao T2-166 đối chiếu độc
> lập, parent quyết lại nếu cần. (m) #68: parent quyết (e) đợt
> 165 GIỮ DƯƠNG (CHẤP NHẬN) — T5-166 ghi nhận, không xét lại.**
> **X11: TRỐNG lúc T5 mở (~23:38Z) và lúc T0 kiểm (23:42Z);
> 3 socket X193/X194/X195 mtime 23:44Z, 0 process Xvfb THẬT**
> — socket mồ côi, chủ tạo chưa xác định, dọn thuộc T8-166 (§6).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc
> T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ là giờ thật)

| Thời điểm | Sự kiện |
|---|---|
| 20:09:31Z | **Reboot #69, boot 9a1a9319** (btime — parent quyết (d) đợt 165 XÁC NHẬN) |
| 20:43:49Z | Watcher-165 START bằng tay, pid 28592; **POSTBOOT_PASS #69 ghi 20:43:50Z** (replay-day-du, poll=0) |
| 22:05:25Z | **Reboot #70, boot d1ddd946** — btime theo T7-165 (9 nguồn) + T0-166 (9 nguồn); **XEM CAVEAT §4.2**: poll cuối watcher-165 22:05:31Z vẫn chạy trên #69 |
| 22:05:31Z | **Poll cuối watcher-165** (trên #69, 6 s sau btime #70) — watcher chết theo #70 |
| 22:06:03Z | **Hoạt động dpkg ĐẦU trên #70 (boot+38s)** |
| 22:06:03.729Z | Requeue run 165 lần 1 (scheduler event, host-side) = btime #70 +38,729 s (theo T7-165/T10-165) |
| 22:06:28Z | T9 khởi động lại sampler/probe-loop của T9 bằng tay (gap 35 s — theo T9-165 .done; KHÔNG phải watcher của T5) |
| 22:08:08Z | **Replay #70 xong** (dpkg cuối, gstreamer1.0-tools installed — boot+2m43s) |
| 23:19:29Z | Run 165 SUCCEEDED (theo T0-166 đọc DB — kết cục + (m) #70 thuộc T7-166/T2-166; T5 chỉ ghi lại nguồn) |
| 23:35:51Z | Lượt cron đợt 166 mở (giờ host); run 166 running từ giờ này (theo T0-166) |
| ~23:38:42Z | T5-166 mở: boot d1ddd946, **không watcher nào chạy**; không POSTBOOT_PASS cho #70; replay ĐÃ XONG |
| 23:40:45Z | **Watcher-166 START (bằng tay, setsid nohup), pid 26422, boot d1ddd946** |
| 23:40:45Z | **FLAG-WRITTEN #70 (boot+1h35m20s, replay-day-du, poll=0)** |
| 23:42:20Z | T0-166 đóng cờ (.done; 9 nguồn khớp, marker 22 — KHỚP T5) |
| 23:43:26Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 23:44:08Z | Stats script T5 chạy (Phụ lục A) |
| 23:44Z | 3 socket X193/X194/X195 xuất hiện (mtime 23:44Z), 0 Xvfb thật |
| 23:45:31Z | Kiểm cuối trước khi viết LIMITS này: boot vẫn d1ddd946, watcher-166 poll đều (10 poll), cờ #70 còn, dpkg md5 5f29561e không đổi |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (j) đợt 165 (ghi nhận hướng (3) vẫn đứng lần thứ 12) +
quyết (n) đợt 163 + quyết (e) đợt 154 + các lần ghi nhận (q) đợt 155,
(o) đợt 156–159, (n) đợt 160–164: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra
watcher lúc mở, T5 khởi động lại bằng tay. T5-166 kiểm tra lại nhanh
`systemctl is-active` (§A.8): user@0/logind/dbus vẫn inactive, không
linger, không cron, không /run/user/0 — cell không đổi, kết luận đợt
154–165 giữ nguyên (lần kiểm tra lại thứ mười ba liên tiếp). Unit +
script ở `round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài
ở cell này).

### 2.1 Marker persistence — SỐNG QUA 22 REBOOT LIÊN TIẾP #49–#70

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49–#70; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#70 (22 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (21 reboot ở đợt 165 →
  22 reboot đợt này: +1 vì #70 đã qua). **T0-166 đếm độc
  lập KHỚP 22** (round166-t0.done 23:42:20Z: "70-49+1=22"). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`) PERSISTENT
  qua rebuild — khẳng định lần thứ hai mươi hai liên tiếp.

## 3. Watcher-166 — chạy bằng tay (quy tắc đứng (3)) + POSTBOOT_PASS #70

- **Trạng thái lúc mở (~23:38Z): KHÔNG watcher nào chạy**
  (`pgrep -af replay-watch` chỉ match lệnh exec của chính T5 —
  dương tính giả cùng họ F-165-T5-2; `kill -0 28592`: chết). Ghi
  vào `watcher-status-at-open.txt`. **Watcher-165 chết theo
  reboot #70 — T5-166 xác minh độc lập từ log gốc** (xem §4.2):
  164 poll đều, poll cuối 22:05:31Z, 0 END/0 STOP/0 NEWBOOT.
- **Khởi động bằng tay 23:40:45Z, pid 26422** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-166-START 2026-11-21T23:40:45Z pid=26422
  boot=d1ddd946 btime=2026-11-21 22:05:25Z end=2026-11-22T02:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=5f29561e init_mtime=22:08:08Z cache=178 lists=39 gst_sys=269`
- **Thay đổi so với watcher-165 (3 điểm):**
  1. END = 02:30:00Z 22/11 (hạn cứng đợt 166 theo task); DIR =
     round166-t5, OLD_T5_DIR = round165-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #70 + trạng thái replay ĐÃ XONG
     lúc khởi động (dpkg 1545 dòng, md5 5f29561e, mtime 22:08:08Z,
     /var/log/apt/ TỒN TẠI, GST 269, cache 178, lists 39, 0 proc)
     + caveat khung giờ #70 (poll cuối watcher-165 sau btime #70
     6 s — giao T2-166 đối chiếu; header KHÔNG tự phán (m) #70).
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[56]`/`02:30` + `bash -n` syntax OK
     + assert không có cụm thừa nhận H2 + assert không có
     "NHANH NHAT" — bài học F-163-T5-7) — adapter chạy sạch ngay
     lần đầu, 0 lần sửa. **NHƯNG xem F-166-T5-1: `LOG=` còn tên
     file cũ `replay-watch-165.log` (lowercase, không match
     replacement) — nội dung log đầy đủ, đã vá bằng symlink
     `replay-watch-166.log` (xem §9).**
- **Poll đều đã xác minh:** 10 poll tới 23:45:17Z (23:40:45Z →
  23:45:17Z; khoảng: 30 s ×8, 31 s ×1 — đều, 0 khoảng trống);
  log 15 dòng lúc kiểm cuối 23:45:31Z: START 1, MONITOR 1,
  poll 10, REPLAY_DONE 1, postboot poll0 1, FLAG-WRITTEN 1,
  0 NEWBOOT, 0 END, 0 EARLY-REPAIR.
- **EARLY-REPAIR KHÔNG kích hoạt — ĐÚNG THIẾT KẾ:** replay đã
  xong trước khi watcher khởi động (dpkg 1545 dòng ổn định từ
  22:08:08Z); điều kiện repair (dòng <100) không bao giờ thỏa.
  Guard file `repaired-d1ddd946` KHÔNG tồn tại (chưa repair —
  đúng, vì không cần). Cổng boot+15' (22:20:25Z) đã qua trước khi
  watcher khởi động — không ảnh hưởng (replay đã xong).
- **Spawn lần này SẠCH (khác F-164/F-165-T5-1):** lệnh spawn trả
  về ngay rc=0 pid=26422, không output_drain_timeout; T5 vẫn
  kiểm lại bằng lệnh đọc riêng (log START 23:40:45Z + `kill -0`
  26422 ALIVE + child `sleep 30` quan sát được) thay vì tin
  output của exec spawn.

### 3.1 POSTBOOT_PASS cho #70 — CÓ QUA REPLAY-DAY-DU (KHÔNG CẦN REPAIR)

- **Replay tự nhiên trên #70: CHẠY ĐẦY ĐỦ.** Bằng chứng: hoạt động
  dpkg đầu 22:06:03Z (boot+38s); **cài đặt 22:06:03Z → 22:08:08Z
  (125 s)**; dpkg 2 → **1.545 dòng** (md5 5f29561e, ổn định từ
  22:08:08Z tới kiểm cuối 23:45:31Z — 0 proc apt/dpkg); lists 39;
  cache 178 .deb; GST hệ thống 269 file (thư mục thật apt, như
  #64/#65/#67/#69); `/var/log/apt/` TỒN TẠI (history Start
  22:08:06 → End 22:08:08).
- **Hoạt động dpkg đầu boot+38s (38 s)** — chậm hơn #69 (+35s)
  3 s, nhanh hơn #67 (+137s) và #65 (+47s). **T5 KHÔNG xếp hạng
  "nhanh nhất/nhì" cho #70** (bài học F-163-T5-7 — chỉ ghi số
  liệu thực đo; thứ hạng đầy đủ thuộc T0/T10 khi đối chiếu chuỗi).
  Hoạt động dpkg kéo dài 125 s (2m05s: 22:06:03Z → 22:08:08Z) —
  ngắn hơn #69 (132 s) 7 s và ngắn hơn hẳn #67 (1.081 s, do
  apt-get update 649–770 s). T5 ghi nhận, không suy đoán nguyên
  nhân mạng (không có số đo băng thông).
  Diễn giải theo T0-166 ("dpkg burst #70 viết lại boot+38s →
  boot+163s — không phải bất thường"): **replay #70 chạy đầy đủ
  tự nhiên** — NHƯNG **cờ #70 có MUỘN hơn theo tuổi boot**
  (boot+1h35m20s vs #69 boot+34m19s) vì không có phiên T5 nào từ
  btime tới giờ mở đợt (1h30m26s: btime 22:05:25Z → mở đợt
  23:35:51Z); cờ chỉ đợi T5 mở + watcher khởi động + 1 poll
  (1 s). Đây là khoảng hở đã biết của hướng (3) — xem §5.
- **dpkg 1.545 dòng — breakdown TRÙNG KHỚP #64/#65/#67/#69:**
  breakdown theo action field (python, §B.4): 1.040 status +
  178 configure + 169 install + 106 startup + 43 trigproc +
  9 upgrade = 1.545. Các số 169 install / 9 upgrade / 178
  configure TRÙNG KHỚP header postboot Dot 151 ("dpkg 1545 dong
  / 169 install / 9 upgrade / 178 configure, goi cuoi
  gstreamer1.0-tools") và số dòng cuối #64/#65/#67/#69 (1.545
  dòng, md5 b07e4c5c / 51d12c3d / b9d79ebc / 5f29561e). md5 khác
  nhau vì timestamp trong từng dòng dpkg.log khác nhau — cùng bộ
  gói, khác thời gian chạy. Gói cuối cùng: gstreamer1.0-tools
  22:08:08Z (giống Dot 151/#64/#65/#67/#69). Cache APT 178 .deb —
  trùng số Dot 151 ("cache APT SONG 178 .deb/156M");
  **lists 39 — TRÙNG #65/#67 (39), khác #69 (37)** (ghi nhận,
  không suy đoán nguyên nhân; watcher ghi lists=39 ổn định từ
  khi khởi động). Lưu ý: mirror lists #70 là azure.archive.
  ubuntu.com (+ cli.github.com), khác #69 (mirror.cogentco.com)
  — mirror thay đổi theo rebuild, ghi nhận không suy đoán.
- **REPLAY_DONE lúc 23:40:45Z (poll đầu):** watcher poll thấy dpkg
  ổn định 1.545 dòng, 0 proc → postboot poll0 **exit=0** → ghi cờ
  ngay. Đây là đường chuẩn (cùng mẫu #65 poll=0, #67 poll=0,
  #69 poll=0), không phải đường tắt: dpkg đã đóng băng đủ lâu
  (ổn định từ 22:08:08Z, 1h32m37s trước poll) + postboot PASS thật.
- **FLAG-WRITTEN 23:40:45Z** (`round166-t5/POSTBOOT_PASS`):
  `boot d1ddd946-f9f3-4561-86e8-5eb3edceb6cc (btime 2026-11-21
  22:05:25Z; watcher-166) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T23:40:45Z; POSTBOOT_PASS moi ghi 2026-11-21T23:40:45Z
  poll=0 (replay-day-du); co cu 9a1a9319 luu POSTBOOT_PASS-9a1a9319`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-9a1a9319` đã đối chiếu bằng
  `diff` — **KHỚP cờ #69 gốc** (round165-t5).
- **Cờ lúc 23:40:45Z = boot+1h35m20s (5.720 s).** Muộn hơn #69
  (boot+34m19s) 1h01m01s — KHÔNG do replay chậm (replay #70
  nhanh hơn #69 7 s) mà do T5 mở muộn (xem trên): từ lúc T5 mở
  thực tế (~23:38:42Z) tới cờ chỉ **123 s (2m03s)**; từ
  watcher-166 START tới cờ chỉ **1 s**. Khoảng KHÔNG-watcher
  1h35m14s trước đó (do watcher-165 chết theo reboot #70, xem
  §4.2) là lỗ hổng riêng của đợt này — ngắn hơn 2h37m08s của
  đợt 165. **Không thiệt hại đo được:** cờ có trước khi
  T4/T8-166 cần gate0 (T4-166 preflight? — T5 đóng cờ trước hạn
  cờ ~02:00Z hơn 2 giờ; phối hợp cụ thể thuộc T4/T8-166).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-d1ddd946.log`, exit 0,
  23:43:26Z): wrapper PASS, libs PASS đủ 5, GST PASS (thư mục
  thật apt, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5 — chạy SAU replay xong nên
  không còn trạng thái giữa replay như F-164-T5-4).
- **Phối hợp T4/T8-166:** poller T4-166 + harness T8-166 đọc
  `round166-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  23:40:45Z, TRƯỚC khi các luồng khác cần gate0.

### 3.2 POSTBOOT_PASS cho #68 — VẪN CHƯA CÓ (XÁC MINH LÚC MỞ + LÚC ĐÓNG, KHÔNG BÙ ĐƯỢC)

- **Không file POSTBOOT_PASS* nào chứa 0c8a94aa** (kiểm lúc mở
  23:38:42Z bằng `grep -rl` toàn bộ `POSTBOOT_PASS*` dưới
  `hidden_files/` + kiểm trực tiếp từng đường dẫn
  `round166-t5/POSTBOOT_PASS-0c8a94aa` và
  `round165-t5/POSTBOOT_PASS-0c8a94aa` — đều KHÔNG CO; kiểm lại
  lúc đóng cờ bằng script `t5-stats-166.py` §2c — vẫn KHÔNG CO;
  xem §A). **#68 là boot thứ 9 không có cờ** (#51, #53, #54, #55,
  #57, #60, #63, #66, #68). T5-166 KHÔNG ghi cờ hồi tố cho #68
  (boot đã chết; cờ chỉ chứng nhận phép đo trực tiếp trên boot
  sống — cùng quy tắc đã áp cho #63/#66, xem LIMITS T5-163 §8 /
  T5-164 §3.2 / T5-165 §3.2).
- **POSTBOOT_PASS #69 ĐÃ XÁC MINH LẠI trên đĩa** (round165-t5,
  mtime 20:43:50Z, nội dung đọc trực tiếp lúc 23:44:08Z — KHỚP
  từng chữ với LIMITS T5-165 §A.3). **POSTBOOT_PASS #67 CÒN**
  (round164-t5, mtime 17:54:38Z — KHỚP LIMITS T5-164 §A.3).
  **POSTBOOT_PASS #66 KHÔNG CÓ** (không file nào chứa edb2acdb —
  kiểm lại đợt này, §A.2c). **POSTBOOT_PASS #63 KHÔNG CÓ**
  (không file nào chứa 94d22520 — kiểm lại đợt này, §A.2c).

## 4. Boot #70 + đồng hồ — #70 KHÔNG NGHỊCH LÝ TRONG KHUNG CỦA NÓ (T0+T5 KHỚP); CÓ CAVEAT KHUNG GIỜ #69/#70 (MỚI)

### 4.1 Bằng chứng quyết định cho #70 (bài học F-161-T5-2 đã áp dụng)

1. **Uptime khớp btime trên #70 (T5 đo trực tiếp):** uptime
   5.880,96 s lúc 23:43:26Z ⇒ boot lúc 22:05:25,04Z; btime
   22:05:25Z — **chênh 0,04 s**. `uptime -s` = 22:05:25Z, KHỚP
   btime từng giây (kiểm lại lúc đóng 23:45:31Z: `uptime -s`
   vẫn 22:05:25Z). Lần đo thứ hai: uptime 5.922,48 s lúc
   23:44:08Z ⇒ boot 22:05:25,52Z — chênh 0,52 s (xem F-166-T5-3:
   hai lần đo cách nhau 42 s nhưng thời điểm đọc `date`/`uptime`
   không đồng thời tuyệt đối — không phải lỗi đồng hồ). Đây
   chính là kiểm đã bác H2 ở #62 (GAP §90): ở #70 kiểm này ĐẬU
   (khớp trong 0,5 s), nên **btime #70 LÀ giờ thật trong khung
   của #70, không cần khung thứ hai** — với caveat §4.2 về
   biên #69/#70.
2. **/proc/1 và journal khớp btime +12 s (mẫu bình thường):**
   /proc/1 mtime 22:05:37,37Z (+12,372 s); journal first entry
   22:05:37Z (epoch 1795298737,77); journal_boots chỉ 1 boot
   (#70). (+12 s — cùng mẫu #68 (+16 s) và #69 (+11 s); không
   nghịch lý.)
3. **Đồng hồ mới ĐÚNG lúc đo (T5 đo đồng thời — sửa F-165-T5-3,
   3 lần):** 23:43:26Z local vs Cloudflare 23:43:27 GMT (+1 s,
   local_truoc 23:43:26.004Z / local_sau 23:43:26.485Z);
   23:44:08Z local vs Cloudflare 23:44:10 GMT (local_truoc
   23:44:08.402Z / local_sau 23:44:09.214Z — offset ≈ +1 s sau
   khi trừ ~0,8 s thời gian request và độ phân giải 1 s của
   header Date); lần 2 lúc 23:44:09Z tương tự. Cả ba lần đều
   ≈ +1 s — ổn định, không drift trong phiên; **KHỚP T0-166**
   (local chậm hơn CF ~0,7 s — cùng họ).
4. **T0-166 xác minh độc lập số hiệu #70 — ĐÃ CÓ**
   (round166-t0.done 23:42:20Z): 9 nguồn khớp (boot_id + btime +
   uptime bracket 1795298725.90 ×3 + journal first 22:05:37Z +12s
   + wtmp/last reboot 22:05 + /proc/1 22:05:36 +11s + mốc file +
   DB requeue +38,729s + Cloudflare ±1s ×2); gap #69→#70 =
   6.954 s kiểm lại khớp; KHÔNG nghịch lý đồng hồ; KHÔNG có
   reboot mới kể từ khi T10-165 đóng sổ. **T5 KHỚP T0 ở mọi điểm
   đối chiếu được** (btime, gap, marker 22 — xem §2.1).
5. **Reboot #70 xảy ra TRONG PHIÊN đợt 165** (sau T8-165 đóng cờ
   21:42Z, trước T9-165 đóng cờ 22:52Z — theo aggregate 165
   §10.5 (vii)) và 1h30m26s TRƯỚC giờ mở đợt 166 (23:35:51Z).
   **(m) #70: T5 KHÔNG phán** — thuộc T7-166 (kết cục run 165,
   SUCCEEDED 23:19:29Z theo T0-166 đọc DB) + T2-166 (đối chiếu
   độc lập); T5 chỉ ghi số liệu thô: btime #70 = 22:05:25Z;
   requeue lần 1 tại #70 lúc 22:06:03.729Z = btime +38,729 s
   (theo T7-165/T10-165) — TRONG dải dương 33–49,8 s; run 165
   SUCCEEDED 23:19:29Z (theo T0-166, DB chỉ đọc). Số liệu thô
   cho T7/T2, không kết luận. **(m) #68: parent quyết (e) đợt
   165 GIỮ DƯƠNG (CHẤP NHẬN)** — T2-165 đối chiếu độc lập ĐỒNG
   Ý; caveat §4.2 T5-165 được ghi nhận cạnh quyết. T5-166
   không xét lại (m) #68.

### 4.2 Watcher-165 chết theo reboot #70 — ĐÃ XÁC MINH ĐỘC LẬP + CAVEAT KHUNG GIỜ #70 (PHÁT HIỆN MỚI)

- **Sự kiện (đo lại độc lập từ log gốc — Phụ lục B):** 164 poll,
  20:43:49Z → 22:05:31Z, khoảng giữa hai poll liên tiếp: 30 s
  ×151, 31 s ×12 — đều, 0 khoảng trống. Poll cuối 22:05:31Z là
  poll bình thường (dpkg 1.545 ổn định, md5 b9d79ebc, 0 proc).
  Log mtime cuối 22:05:31,72Z. **KHÔNG có dòng END** (hạn
  watcher-165 là 23:30:00Z, chưa tới), **KHÔNG có dòng NEWBOOT**,
  **KHÔNG có file watcher-stop** trong round165-t5/. pid 28592
  chết (`kill -0`: No such process).
- **Poll cuối 6 s SAU btime #70 (22:05:25Z)** — poll cuối đua
  với reboot rồi chết; watcher KHÔNG sống qua reboot. **Cùng mẫu
  watcher-164 chết theo #68** (poll cuối sau btime 11 s) và
  watcher-163 chết theo #66 (poll cuối sau btime 9 s): watcher
  chết ĐÚNG theo reboot — nguyên nhân xác định được. T9-165
  khởi động lại sampler/probe-loop của T9 bằng tay 22:06:28Z
  (gap 35 s) — KHÔNG phải watcher của T5 (log watcher-165 dừng
  ở 22:05:31Z, không có poll nào sau đó).
- **Hậu quả đo được:** KHÔNG có watcher trong 1h35m14s
  (22:05:31Z → 23:40:45Z, 5.714 s), gồm cả thời điểm reboot #70
  — reboot được phát hiện hậu kiểm qua btime (T0/T5), không có
  dòng NEWBOOT nào trong log watcher; NHƯNG không mất đo nào:
  replay #70 chạy đầy đủ tự nhiên, cờ #70 có 23:40:45Z (trước
  khi T4/T8-166 cần gate0), POSTBOOT_PASS #69/#67 còn nguyên
  trên đĩa, marker còn nguyên. **Khoảng không-watcher này NGẮN
  HƠN 2h37m08s của đợt 165** (vì reboot #70 rơi vào cuối phiên
  đợt 165 chứ không phải giữa hai đợt như #69).
- **CAVEAT KHUNG GIỜ #70 — BẰNG CHỨNG THÔ (T5 trình bày, không tự
  kết luận (m)):**
  1. Poll cuối watcher-165 lúc **22:05:31Z chạy TRÊN boot #69**
     (9a1a9319) — script đọc `/proc/sys/kernel/random/boot_id`
     tươi mỗi vòng lặp và ghi NEWBOOT trước dòng poll nếu boot
     đổi; không có dòng NEWBOOT nào, nên lúc ~22:05:31Z kernel
     vẫn báo 9a1a9319. Poll đọc dpkg 1.545 dòng md5 b9d79ebc —
     đúng dpkg.log của #69 (nếu poll chạy trên #70 thì dpkg.log
     lúc đó chỉ có ~2 dòng, đang replay). Đồng hồ #69 đã xác
     minh ĐÚNG lúc 20:41:03Z và 20:48:51Z (T5-165: local vs
     Cloudflare +1 s cả hai lần) — nhưng **không có lần kiểm
     đồng hồ nào trên #69 sau 20:48:51Z** (77 phút cuối đời #69
     không được xác minh đồng hồ).
  2. Phía #70 (T7-165 §2.5 + T0-166, trích nguyên): btime
     1795298725 = 22:05:25Z; `uptime -s` 22:05:25Z (khớp);
     /proc/1 mtime 22:05:37,37Z (+12,372 s); journal first entry
     22:05:37Z (+12 s); wtmp begins 22:05:37Z; `last` reboot
     22:05; Cloudflare ±1 s ×2 trong phiên (T7-165); T0-166
     uptime bracket 1795298725.90 ×3 khớp btime.
  3. **Mâu thuẫn:** (1) chứng minh máy còn ở #69 lúc 22:05:31Z
     (khung #69); (2) nói #70 đã boot lúc 22:05:25Z. Cả hai
     không thể cùng đúng trong một khung giờ. Suy ra **hai khung
     giờ lệch nhau ít nhất 6 s** — hoặc đồng hồ #69 chạy nhanh
     ở phút cuối (không bằng chứng — và không có kiểm đồng hồ
     #69 sau 20:48:51Z để bác), hoặc btime #70 sớm hơn giờ thật
     (VD: RTC cũ lúc boot, NTP sửa lại sau — phù hợp với
     Cloudflare đúng trong phiên CHỈ KHI việc sửa xảy ra giữa
     lần kiểm uptime của T7/T0 và lần kiểm Cloudflare; thứ tự/
     thời điểm chính xác các lần kiểm trong đọc #2 của T7 không
     được ghi lại), hoặc tương đương.
  4. **Giới hạn thời điểm reboot thật (khung #69 ≈ khung thật):**
     (22:05:31Z, ~22:06:01Z] — giới hạn cứng từ watcher (poll
     cuối 22:05:31Z, poll tiếp ~22:06:01Z không bao giờ tới;
     jitter poll ±1 s). Nới lỏng bằng hoạt động dpkg đầu trên
     #70 lúc 22:06:03Z (reboot thật phải trước đó) — không nới
     thêm được vì 22:06:01Z đã chặt hơn.
  5. **Offset requeue thật:** requeue 22:06:03.729Z (timestamp
     host-side, scheduler DB) trừ thời điểm reboot thật ∈
     **[2,7 s, 32,7 s]** (cửa cứng [1,7 s, 33,7 s] nếu tính jitter
     poll ±1 s). Dải dương là 33–49,8 s — **offset thật NẰM
     HOÀN TOÀN DƯỚI biên dưới của dải** (max 32,7 s < 33 s;
     chỉ chạm biên nếu tính jitter tối đa). Trong khi offset
     theo btime (+38,729 s) nằm TRONG dải. Hai cách tính cho hai
     vị trí đối nghịch nhau trong dải — **mạnh hơn #68** (ở #68
     offset thật [15 s, 36 s] còn đè lên biên dưới của dải).
  6. **Phạm vi ảnh hưởng (T5 tự giới hạn):** chỉ offset requeue
     (m) #70 là nhạy với lệch khung (biên dải 33 s, cửa sổ offset
     thật 2,7–32,7 s). Gap #69→#70 thật ∈ (6.960 s, 6.990 s]
     (cửa cứng, vì btime #69 đã xác minh sạch §4.1 T5-165) — vẫn
     NGẮN NHẤT chuỗi gần đây (kế tiếp 7.381 s), nên nhận xét
     "ngắn nhất" của aggregate 165 ĐỨNG, chỉ số tuyệt đối
     6.954 s là theo khung btime. Gap #68→#69 thật ∈
     [7.340 s, 7.370 s] (vs 7.381 s theo btime, xem T5-165 §4.2.7)
     — lệch ≤41 s, không đáng kể với dải FULL (rộng ~2h); INSIDE
     #70 (dải FULL116 neo 20:09:31Z, thuộc T2-166) không bị ảnh
     hưởng đáng kể. Boot_id #70 (d1ddd946) không bị nghi ngờ —
     O8 JSON, T7/T8/T10 đều chạy trên #70 sau reboot (theo
     aggregate 165). Btime #69 không bị ảnh hưởng — xác minh
     sạch (T5-165 §4.1).
  7. **T5 KHÔNG lật quyết (d) đợt 165 của parent** (XÁC NHẬN #70
     + CHẤP NHẬN (m) #70 là ỨNG VIÊN DƯƠNG chờ đối chiếu, dựa
     trên +38,729 s) và **KHÔNG tự phán (m) #70**. Đây là bằng
     chứng mới (T5-165 đã đóng 20:53Z trước reboot #70; T9-165
     không nối mốc poll cuối watcher với btime) — **giao T2-166
     đối chiếu độc lập (đúng nhiệm vụ T2-166 theo brief) và
     parent quyết lại nếu cần**. Nếu parent giữ quyết (d): ghi
     nhận caveat này cạnh quyết. Nếu parent xét lại: n ứng viên
     21→24 / 22→25 (nhánh khuyến nghị) có thể phải xét lại theo
     offset thật.

### 4.3 Boot #70 (d1ddd946, btime 22:05:25Z theo khung btime): #70 SỐNG 5.720 S LÚC CỜ GHI (6.006 S LÚC KIỂM CUỐI)

- #70 sống **5.720 s (1h35m20s)** theo btime tới lúc cờ ghi
  23:40:45Z; tới kiểm cuối 23:45:31Z là **6.006 s (1h40m06s)**;
  theo khung thật ∈ [5.684 s, 5.714 s] tới lúc cờ ghi (reboot
  thật ∈ (22:05:31Z, ~22:06:01Z], xem §4.2.4). Ngắn hơn tuổi thọ
  đầy đủ của #69 (7.381 s) và #68 (7.381 s); dài hơn #67
  (1.983 s), #66 (5.202 s) và #65 (5.508 s). Gap #69→#70 = 6.954 s
  chưa đưa vào CERT/FULL — chờ #94?/#95?/#96? đóng (giao T2-166
  làm cơ sở FULL114/FULL115/FULL116).

### 4.4 Tuổi boot theo khung thật duy nhất (không trừ lẫn lộn)

| Mốc | Giờ (thật) | Tuổi boot #70 |
|---|---|---|
| btime #70 | 22:05:25Z | — |
| Hoạt động dpkg đầu | 22:06:03Z | boot+38s |
| Replay xong (dpkg cuối) | 22:08:08Z | boot+2m43s |
| Watcher-166 START | 23:40:45Z | boot+1h35m20s |
| FLAG-WRITTEN #70 | 23:40:45Z | boot+1h35m20s |
| Postboot độc lập T5 | 23:43:26Z | boot+1h38m01s |
| Stats script T5 | 23:44:08Z | boot+1h38m43s |

- Tuổi boot #69: **7.381 s (2h03m01s)** theo btime (20:09:31Z →
  22:05:25Z); theo khung thật ∈ [7.340 s, 7.370 s].
- Reboot #70 xảy ra TRONG PHIÊN đợt 165 (sau T8-165 đóng cờ
  21:42Z, trước T9-165 đóng cờ 22:52Z) — không phá lượt đo nào
  trong đợt 165 (O8 DONE 19:32:56Z trên #68? — KHÔNG: O8 đợt 165
  chạy trên #69, DONE trước #70; run 165 SUCCEEDED 23:19:29Z
  trên #70 sau 1 lần viết lại — kết cục + (m) #70 thuộc T7-166).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 166

- T0-166 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-166 đóng
  cờ 23:42:20Z — lúc đó watcher-166 ĐÃ khởi động (23:40:45Z)
  nhưng T0 kiểm lúc ~23:38Z, trước khi watcher khởi động (T0 ghi
  rõ "Watcher-166 CHƯA khởi động"). Không mâu thuẫn — chỉ khác
  thời điểm kiểm (cùng mẫu watcher-165 chết theo reboot #70 mà
  T5-165 không thấy).
- **Cửa sổ hở hướng (3) ở #70: 1h35m20s từ boot tới cờ** — NHƯNG
  chỉ **2m03s từ lúc T5 mở tới cờ** (replay nhanh, cờ chỉ đợi T5
  mở + watcher khởi động + 1 poll). Đây là khoảng hở đã biết của
  hướng (3): cờ chỉ có khi có phiên T5 sau reboot + replay/repair
  xong. Khoảng KHÔNG-watcher 1h35m14s (do watcher-165 chết theo
  reboot #70 — §4.2) là lỗ hổng riêng của đợt này: reboot #70
  rơi vào cuối phiên đợt 165 — #70 vẫn BẮT ĐƯỢC cờ nhờ replay
  tự nhiên chạy đầy đủ + T5-166 khởi động kịp (khác #63/#66/#68 —
  không có phiên T5 nào sau reboot trước khi boot kế tới).
- **Watcher-166 tiếp tục giám sát tới 02:30:00Z 22/11**; nếu có
  reboot #71 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
  repair/boot) — T5-167 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-166 là chủ):** MemTotal 8.124.896
  kB; MemAvailable **2.833.820 kB @23:44:08Z** (lúc stats đang
  chạy, loadavg 1,99); MemFree 376.844 kB @23:44:08Z.
  loadavg 1,99 @23:44:08Z (không phải kẹt).
- **ENOSPC journal boot #70:** **24 dòng** lúc 23:38:42Z
  (journal 322 dòng), **25 dòng** lúc ~23:39Z, **30 dòng** lúc
  23:44:08Z (journal 346 dòng) và lúc kiểm cuối 23:45:31Z —
  cùng chữ ký `home-assistant-ensure.service: Failed to add
  control inotify watch descriptor ... No space left on device`
  (dòng đầu 22:07:09Z = boot+104s); T9-166 đếm chính thức; T5
  chỉ ghi nhận số lúc đo. Lưu ý: T9-165 ghi "#70 1 dòng duy
  nhất" lúc T9 đóng 22:52Z — KHÔNG mâu thuẫn: dòng đầu
  22:07:09Z là dòng duy nhất tới lúc đó, các dòng sau mọc thêm
  trong phiên (23:12:46Z, 23:13:56Z, 23:37:56Z, 23:39:06Z...).
  **Lưu ý: `journalctl --boot` ĐỌC ĐƯỢC trên boot #70** (346
  dòng) — cùng mẫu #67/#69, khác T10-163 (trả 0 dòng cho cả hai
  boot #65/#66 lúc đóng); ghi nhận để T10-166 đối chiếu.
- **Không reboot mới trong phiên T5** (boot vẫn d1ddd946 lúc
  kiểm cuối 23:45:31Z — KHÔNG có #71; watcher-166 tiếp tục
  giám sát tới hạn cứng 02:30:00Z 22/11).
- **journal_boots chỉ còn 1 boot (#70):** journal của #69
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước). Vì vậy T5 KHÔNG xác
  minh độc lập được boot_id/btime #69 từ #70 — phân tích §4.2
  dựa trên log watcher-165 (đo trực tiếp) + LIMITS T7-165/T0-166
  (trích nguyên, không đo lại được từ #70).
- **X11 — TRỐNG lúc T5 mở và lúc T0 kiểm, 3 socket MỚI sau đó:**
  `/tmp/.X11-unix/` TRỐNG lúc T5-166 mở (~23:38Z) và lúc
  T0-166 kiểm (~23:38Z, "X11 TRỐNG"); lúc stats 23:44:08Z:
  **3 socket X193/X194/X195, mtime 23:44Z** (cả 3 cùng mtime —
  tạo cùng lúc lúc 23:44Z); **0 process Xvfb THẬT**
  (`pgrep -x Xvfb` exit 1 — sửa F-165-T5-2, chỉ dùng `pgrep
  -x`). Cùng 3 số display như đợt 160–165 — **lần thứ bảy liên
  tiếp** cùng 3 số display (T8-165 ghi lần thứ sáu). Chủ tạo chưa
  xác định (T5 không đoán — có thể T8/T4-166 khởi Xvfb); **dọn
  thuộc T8-166** theo aggregate 163 §11.13. T5 KHÔNG tự dọn
  (Xvfb thuộc vòng đời harness T8; xóa socket trong lúc T8 có
  thể đang chạy là can thiệp ngoài phạm vi T5).

## 7. Nợ mở chuyển đợt 167 (từ T5-166)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 22 reboot
   #49–#70. T5-167 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #70 — XONG 23:40:45Z** (watcher-166,
   replay-day-du, poll=0; T4/T8-166 phối hợp qua cờ).
   Watcher-166 tiếp tục giám sát tới 02:30:00Z 22/11; nếu có
   reboot #71 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-167 kiểm tra log.
4. **POSTBOOT_PASS #68 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 9 không cờ; cùng tiền lệ #51/#53/#54/#55/#57/#60/
   #63/#66). Chỉ thiếu cờ watcher (dữ kiện #68 chỉ còn cờ T7/T10).
   **POSTBOOT_PASS #66 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (boot thứ 8
   không cờ; đã kiểm lại đợt này). **POSTBOOT_PASS #63 — KHÔNG
   CÓ, KHÔNG BÙ ĐƯỢC** (boot thứ 7 không cờ; đã kiểm lại đợt này).
5. **CAVEAT KHUNG GIỜ #70 (§4.2) — NỢ LỚN NHẤT ĐỢT NÀY.**
   Watcher-165 poll cuối 22:05:31Z trên #69 vs btime #70
   22:05:25Z: hai khung lệch ≥6 s; offset requeue thật ∈
   [2,7 s, 32,7 s] (cửa cứng [1,7 s, 33,7 s]) HOÀN TOÀN DƯỚI
   biên dưới dải dương 33–49,8 s — mạnh hơn #68 (offset thật
   [15 s, 36 s] còn đè lên biên dưới). Giao T2-166 đối chiếu độc
   lập + parent quyết lại (m) #70 nếu cần (giữ quyết (d) đợt 165
   hoặc xét lại n ứng viên 21→24 / 22→25). T5-167 kiểm tra xem
   T2-166/parent đã kết luận gì — không tự phán.
6. **Watcher-165 chết theo reboot #70 — NGUYÊN NHÂN XÁC ĐỊNH
   ĐƯỢC** (xem §4.2; T5-166 xác minh độc lập, KHỚP mẫu T10-163
   ở watcher-163 + T5-165 ở watcher-164). Khoảng không-watcher
   1h35m14s — ngắn hơn 2h37m08s của đợt 165 — ghi nhận, không
   mở giả thuyết mới (khoảng trống nằm giữa hai đợt theo thiết
   kế vòng lặp, không phải lỗi watcher).
7. **Replay khởi động: #59 +35s → #61 +9m50s → #62 +22m10s →
   #64 +20m22s → #65 +47s → #67 +137s → #69 +35s → #70 +38s
   (hoạt động dpkg đầu).** #70 nhanh hơn #69 về tổng thời gian
   replay (125 s vs 132 s) nhưng chậm hơn 3 s về hoạt động đầu.
   Mẫu "vài giây trước giờ mở đợt" KHÔNG giữ ở #70 (dpkg đầu
   22:06:03Z, trước giờ mở đợt 23:35:51Z tới 1h29m48s — vì
   reboot #70 xảy ra giữa hai đợt, trước giờ mở đợt 1h30m26s;
   mẫu cũ chỉ đúng khi reboot xảy ra sát giờ mở đợt).
8. **Cổng boot+15m của (h) không cần dùng ở #70** (replay chạy
   đầy đủ trước khi watcher khởi động; cổng 22:20:25Z đã qua).
   Ghi nhận để T10 đánh giá (h): cổng chỉ có ý nghĩa khi replay
   vắng — ở #70 nó không kích hoạt và không cần kích hoạt (cùng
   mẫu #67/#69).
9. **GST trên #70 là THƯ MỤC THẬT apt (269 file)** — như #64/#65/
   #67/#69. Boot sau phải làm lại qua replay/repair (ephemeral
   theo rebuild).
10. Nợ header postboot script còn ghi Dot 151 (ghi nhận từ
    T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
    header log ghi boot e9295700/2e430750 đợt 151 trong khi
    checks là của #70): T5 đợt sau quyết có cập nhật theo Dot
    hay không. Đây là nợ thẩm mỹ trong log header, không ảnh
    hưởng kết quả check.
11. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
    của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
    yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
    quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
    403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
    G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
    theo quyết (g) đợt 143. u2net là fallback chính thức cho
    birefnet.

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này replay #70 chạy đầy đủ
  tự nhiên, cờ có ở boot+1h35m20s, chỉ 2m03s sau khi T5 mở.
  T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ mười ba liên tiếp.
- **Số hiệu #70 đã xác nhận** (parent quyết (d) đợt 165 +
  T7-165 9 nguồn + T0-166 9 nguồn + T5 xác minh độc lập khớp) —
  T5 dùng "#70" không gắn "(ứng viên)" trong LIMITS này.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #68 từ log của
  T7/T10-164** — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #68 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **CAVEAT §4.2 cần parent + T2-166 xem trước khi chốt (m) #70
  lại:** bằng chứng watcher-165 là mới và độc lập với
  9 nguồn của T7/T0 (đều nằm trong khung #70); offset requeue
  thật [2,7 s, 32,7 s] nằm HOÀN TOÀN DƯỚI biên dưới dải
  33–49,8 s. T5 đề xuất parent chờ đối chiếu độc lập của T2-166
  rồi mới chốt lại (m) #70 — không vội giữ hay lật quyết (d)
  đợt 165 trong đợt này. (m) #68 đã quyết (e) đợt 165 GIỮ
  DƯƠNG — không xét lại.
- **Số đếm marker: T5 giữ 22 reboot (#49–#70)** — T0-166 đếm
  độc lập KHỚP 22.
- **Khoảng không-watcher 1h35m14s (22:05:31Z–23:40:45Z)** — ngắn
  hơn 2h37m08s của đợt 165; T5 không đề xuất thay đổi thiết kế
  vòng lặp (khoảng trống nằm giữa hai đợt theo lịch cron, không
  phải lỗi watcher).

## 9. Sai số của chính T5-166

- **F-166-T5-1 — `LOG=` trong replay-watch-166.sh còn tên file
  cũ `replay-watch-165.log`:** make-watcher-166.py thay token
  theo danh sách case-sensitive — `REPLAY-WATCH-165` và
  `watcher-165` đều không match chuỗi lowercase
  `replay-watch-165.log` ở dòng `LOG=$DIR/...`. Hậu quả: log
  watcher-166 ghi vào file tên `replay-watch-165.log` trong
  round166-t5/ (nội dung ĐÚNG và ĐẦY ĐỦ: START 23:40:45Z,
  FLAG-WRITTEN, poll đều). T5 vá bằng symlink
  `replay-watch-166.log -> replay-watch-165.log` (cùng dir) —
  đọc qua tên nào cũng ra cùng nội dung, append sau này vẫn
  vào đúng 1 file; đã kiểm bằng `head` qua symlink + đếm dòng
  (15 dòng lúc kiểm cuối). Generator make-watcher-166.py đã vá
  thêm replacement `replay-watch-165.log` → `replay-watch-166.log`
  để lần sau không lặp lại. T10/T2 đọc log watcher-166 qua tên
  nào cũng được — T5 ghi rõ ở đây để không ai tưởng file 165
  trong dir 166 là log của watcher cũ.
- **F-166-T5-4 — §4.3 bản nháp ghi tuổi thọ #70 sai (6.954 s):**
  T5 nhầm gap #69→#70 (6.954 s) với tuổi của #70. Đã tự bắt
  bằng grep đối chiếu trước khi đóng cờ và sửa: #70 sống 5.720 s
  lúc cờ ghi (23:40:45Z), 6.006 s lúc kiểm cuối (23:45:31Z);
  theo khung thật ∈ [5.684 s, 5.714 s] tới lúc cờ ghi. Các số
  gap (6.954 s theo btime; thật ∈ (6.960 s, 6.990 s]) ở §4.1/§4.2
  không bị ảnh hưởng — chỉ §4.3 sai và đã sửa.
- **F-166-T5-2 — Exec `find` toàn cây hidden_files chậm 52 s:**
  lệnh kiểm tra `find ... -name "replay-watch-166*"` quét đệ quy
  toàn bộ `hidden_files/` (cây rất lớn) nên exec bị chuyển nền
  sau 10 s, hoàn tất sau 52 s. Bài học: dùng grep theo đường dẫn
  đích danh thay vì find đệ quy toàn cây; kết quả kiểm tra
  (không có file log nào khác) vẫn đúng.
- **F-166-T5-3 — Hai lần đo uptime suy ra btime lệch nhau 0,5 s:**
  uptime 5.880,96 s lúc 23:43:26Z ⇒ boot 22:05:25,04Z; uptime
  5.922,48 s lúc 23:44:08Z ⇒ boot 22:05:25,52Z. Chênh 0,48 s
  trong 42 s giữa hai lần đo — do thời điểm đọc `date`/`uptime`
  trong hai exec không đồng thời tuyệt đối, không phải lỗi đồng
  hồ; btime #70 khớp trong 0,5 s (xem §4.1 mục 1). T5 không dùng
  số 0,04 s hay 0,52 s nào làm kết luận riêng — chỉ dùng khoảng
  khớp 0,5 s.
- **Giới hạn xác minh (không phải sai số):** T5-166 xác minh
  boot #70 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + Cloudflare 3 lần đồng
  thời (+1 s cả ba); T0-166 xác minh 9 nguồn KHỚP. T5 KHÔNG tự
  truy vấn scheduler DB (số liệu run 165 lấy từ T0-166 .done,
  đã nêu rõ nguồn — chỉ dùng mốc requeue 22:06:03.729Z làm số
  liệu thô, không phán (m)); đóng góp độc lập của T5 cho kết
  luận "không nghịch lý #70 trong khung của nó" là neo uptime +
  tính đều poll watcher-165/166 + đo Cloudflare (§4.1 mục 1–4),
  không phụ thuộc DB. Btime #69 (20:09:31Z) lấy từ parent quyết
  (d) đợt 165 + T5-165 §4.1 (xác minh sạch) — T5 không xác minh
  độc lập được từ #70 (journal volatile); phân tích lệch khung
  §4.2 dựa trên log watcher-165 (đo trực tiếp) + LIMITS
  T7-165/T0-166 (trích nguyên). Mọi khoảng thời gian trong
  LIMITS này đều tính lại từ endpoint thô bằng script python
  (Phụ lục A/B) — không cộng/trừ lũy kế bằng tay.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-166.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (d1ddd946, btime
  22:05:25Z).

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round166-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/`
  (không nằm trong repo nên không stage): `replay-watch-166.sh`,
  `make-watcher-166.py`, `t5-stats-166.py`,
  `t5-stats-166-output.txt`, `replay-watch-166.log` (symlink →
  `replay-watch-165.log` — file log thật),
  `replay-watch-165.log` (file log thật của watcher-166 — xem
  F-166-T5-1), `replay-watch-166.nohup.log`,
  `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-9a1a9319`,
  `t5-postboot-poll0-d1ddd946.log`,
  `t5-postboot-independent-d1ddd946.log`.

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/t5-stats-166.py`
(output đầy đủ lưu tại `t5-stats-166-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 23:44:08Z, SAU khi cờ POSTBOOT_PASS #70
đã ghi — vì vậy §2c/§3c trong output ghi "#70 CO" theo đúng
trạng thái lúc chạy; xem §3.1; F-166-T5-1: log watcher-166 doc
qua symlink replay-watch-166.log -> replay-watch-165.log —
nội dung đầy đủ).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-166 (trich bang script, 2026-11-21T23:44:08Z) ===

--- 1. Boot hien tai ---
boot_id=d1ddd946-f9f3-4561-86e8-5eb3edceb6cc
btime_epoch=1795298725 = 2026-11-21T22:05:25Z
uptime_s=5922.48 now=2026-11-21T23:44:08Z
uptime_-s=2026-11-21 22:05:25
/proc/1 mtime=2026-11-21 22:05:37.371734926 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 d1ddd946f9f3456186e85eb3edceb6cc Sat 2026-11-21 22:05:37 UTC Sat 2026-11-21 23:43:36 UTC
journal_first_entry=1795298737.770200 htch-runtime systemd-journald[17]: Journal started
clock_lan1: local_truoc=23:44:08.402Z CF=Date: Sat, 21 Nov 2026 23:44:10 GMT local_sau=23:44:09.214Z
clock_lan2: local_truoc=23:44:09.214Z CF=Date: Sat, 21 Nov 2026 23:44:10 GMT local_sau=23:44:09.683Z

--- replay-watch-165.log (round165-t5) ---
tong_dong=169
kinds={'REPLAY-WATCH-165-START': 1, 'MONITOR': 1, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=164
first=2026-11-21 20:43:49+00:00
last=2026-11-21 22:05:31+00:00
gaps={31.0: 12, 30.0: 151}
md5_set=['b9d79ebc']
lines_set=['1545']
boot_set=['9a1a9319']
mtime_log=2026-11-21 22:05:31.722049727 +0000
dong_dau=REPLAY-WATCH-165-START 2026-11-21T20:43:49Z pid=28592 boot=9a1a9319 btime=2026-11-21 20:09:31Z end=2026-11-21T23:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=b9d79ebc init_mtime=20:12:18Z cache=178 lists=37 gst_sys=269
dong_cuoi=2026-11-21T22:05:31Z boot=9a1a9319 poll dpkg_lines=1545 md5=b9d79ebc apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37

--- replay-watch-166.log (round166-t5, symlink -> replay-watch-165.log) ---
tong_dong=12
kinds={'REPLAY-WATCH-166-START': 1, 'MONITOR': 1, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=7
first=2026-11-21 23:40:45+00:00
last=2026-11-21 23:43:46+00:00
gaps={30.0: 5, 31.0: 1}
md5_set=['5f29561e']
lines_set=['1545']
boot_set=['d1ddd946']
mtime_log=2026-11-21 23:42:59.842689917 +0000
dong_dau=REPLAY-WATCH-166-START 2026-11-21T23:40:45Z pid=26422 boot=d1ddd946 btime=2026-11-21 22:05:25Z end=2026-11-22T02:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=5f29561e init_mtime=22:08:08Z cache=178 lists=39 gst_sys=269
dong_cuoi=2026-11-21T23:43:46Z boot=d1ddd946 poll dpkg_lines=1545 md5=5f29561e apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39

--- 2c. POSTBOOT_PASS theo boot ---
  #d1ddd946: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS']
  #9a1a9319: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS-9a1a9319', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS']
  #0c8a94aa: (khong co file co nao chua)
  #f1d4ce1a: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS-f1d4ce1a', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t5/POSTBOOT_PASS-9a1a9319']
  #edb2acdb: (khong co file co nao chua)
  round166-t5/POSTBOOT_PASS: CO
  round165-t5/POSTBOOT_PASS: CO
  round164-t5/POSTBOOT_PASS: CO
  round165-t5/POSTBOOT_PASS-0c8a94aa: KHONG CO
  round164-t5/POSTBOOT_PASS-0c8a94aa: KHONG CO
  round164-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-94d22520: KHONG CO

--- 3. round165-t5/POSTBOOT_PASS (#69, xac minh lai) ---
mtime=2026-11-21 20:43:50.771087483 +0000
boot 9a1a9319-3786-4add-8ffa-c51a1027946e (btime 2026-11-21 20:09:31Z; watcher-165) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T20:43:50Z; POSTBOOT_PASS moi ghi 2026-11-21T20:43:50Z poll=0 (replay-day-du); co cu f1d4ce1a luu POSTBOOT_PASS-f1d4ce1a

--- 3b. round164-t5/POSTBOOT_PASS (#67) ---
mtime=2026-11-21 17:54:38.343694319 +0000
boot f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f (btime 2026-11-21 17:33:27Z; watcher-164) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T17:54:38Z; POSTBOOT_PASS moi ghi 2026-11-21T17:54:38Z poll=0 (replay-day-du); co cu 1c1cf10c luu POSTBOOT_PASS-1c1cf10c

--- 3c. POSTBOOT_PASS #70 (round166-t5) ---
mtime=2026-11-21 23:40:45.638116789 +0000
boot d1ddd946-f9f3-4561-86e8-5eb3edceb6cc (btime 2026-11-21 22:05:25Z; watcher-166) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T23:40:45Z; POSTBOOT_PASS moi ghi 2026-11-21T23:40:45Z poll=0 (replay-day-du); co cu 9a1a9319 luu POSTBOOT_PASS-9a1a9319

--- 3d. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20 11:39:47.272154981 +0000

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=5f29561e897ad9af954edc7ea1078924 mtime=2026-11-21 22:08:08.716994431 +0000
dpkg_dong_dau=2026-11-21 22:06:03 startup packages configure
dpkg_dong_cuoi=2026-11-21 22:08:08 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
cache_deb=178
lists_entries=39
lists_files=auxfiles azure.archive.ubuntu.com_ubuntu_dists_noble-backports_InRelease azure.archive.ubuntu.com_ubuntu_dists_noble-backports_main_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-backports_main_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-backports_multiverse_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-backports_multiverse_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-backports_universe_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-backports_universe_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-security_InRelease azure.archive.ubuntu.com_ubuntu_dists_noble-security_main_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-security_main_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-security_multiverse_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-security_multiverse_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-security_restricted_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-security_restricted_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-security_universe_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-security_universe_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-updates_InRelease azure.archive.ubuntu.com_ubuntu_dists_noble-updates_main_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-updates_main_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-updates_multiverse_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-updates_multiverse_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-updates_restricted_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-updates_restricted_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble-updates_universe_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble-updates_universe_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble_InRelease azure.archive.ubuntu.com_ubuntu_dists_noble_main_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble_main_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble_multiverse_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble_multiverse_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble_restricted_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble_restricted_i18n_Translation-en azure.archive.ubuntu.com_ubuntu_dists_noble_universe_binary-amd64_Packages azure.archive.ubuntu.com_ubuntu_dists_noble_universe_i18n_Translation-en cli.github.com_packages_dists_stable_InRelease cli.github.com_packages_dists_stable_main_binary-amd64_Packages lock partial
gst_sys_files=269
apt_procs=
watcher166_ps=26422 bash replay-watch-166.sh
watcher165_kill0=DEAD

--- 5. Trang thai 11 goi + 5 lib (sau replay xong) ---
  libevent-2.1-7t64: installed 2.1.12-stable-9ubuntu2.2
  gstreamer1.0-plugins-base: installed 1.24.2-1ubuntu0.7
  gstreamer1.0-plugins-good: installed 1.24.2-1ubuntu1.8
  gstreamer1.0-plugins-bad: installed 1.24.2-1ubuntu4
  gstreamer1.0-plugins-ugly: installed 1.24.1-1build1
  gstreamer1.0-gl: installed 1.24.2-1ubuntu0.7
  gstreamer1.0-libav: installed 1.24.1-1build1
  gstreamer1.0-x: installed 1.24.2-1ubuntu0.7
  libavif16: installed 1.0.4-1ubuntu3
  libgstreamer1.0-0: installed 1.24.2-1ubuntu0.2
  libevdev2: installed 1.13.1+dfsg-1build1
  libevent-2.1.so.7: CO
  libEGL.so.1: CO
  libavif.so.16: CO
  libdw.so.1: CO
  libevdev.so.2: CO

--- 6. ENOSPC journal boot hien tai ---
ENOSPC_dong=30
ENOSPC_signature_dong=30
journal_dong=346
ENOSPC_dong_dau=Nov 21 22:07:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device

--- 7. RAM snapshot ---
MemTotal:        8124896 kB
MemFree:          376844 kB
MemAvailable:    2833820 kB
loadavg=1.99 2.65 1.36 2/500 35583

--- 8. systemd user manager ---
user_at_0=inactive
logind=inactive
dbus=inactive
linger_dir=KHONG CO
run_user_0=KHONG CO

--- 9. Co round166 .done ---
  round166-t0.done (2026-11-21 23:42:20.793690217 +0000)

--- 10. X11 (chi pgrep -x — sua F-165-T5-2) ---
total 0
drwxrwxrwt  2 root root 100 Nov 21 23:44 .
drwxrwxrwt 17 root root 760 Nov 21 23:44 ..
srwxrwxrwx  1 root root   0 Nov 21 23:44 X193
srwxrwxrwx  1 root root   0 Nov 21 23:44 X194
srwxrwxrwx  1 root root   0 Nov 21 23:44 X195
xvfb_pgrep_x_rc=0-XVFB-THAT
xvfb_pgrep_x=none

--- 11. Watcher-166 + khoang khong-watcher ---
start_line=REPLAY-WATCH-166-START 2026-11-21T23:40:45Z pid=26422 boot=d1ddd946 btime=2026-11-21 22:05:25Z end=2026-11-22T02:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=5f29561e init_mtime=22:08:08Z cache=178 lists=39 gst_sys=269
watcher166_pid=26422 kill0=ALIVE
khong_watcher_giay=5714 (1.59h = 1h35m14s)
khong_watcher_tu=2026-11-21T22:05:31Z den=2026-11-21T23:40:45Z

--- 12. dpkg breakdown + apt history #70 ---
dpkg_breakdown={'startup': 106, 'install': 169, 'status': 1040, 'configure': 178, 'trigproc': 43, 'upgrade': 9} tong=1545
apt_history_cuoi=Start-Date: 2026-11-21  22:08:06;End-Date: 2026-11-21  22:08:07;Start-Date: 2026-11-21  22:08:08;End-Date: 2026-11-21  22:08:08;

=== HET PHU LUC T5-166 2026-11-21T23:44:08Z ===
```
