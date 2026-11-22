# PHASE9_ROUND165_T5_INFRA_LIMITS — POSTBOOT_PASS #69 ĐÃ CÓ 20:43:50Z (REPLAY-DAY-DU, BOOT+34M19S) + POSTBOOT_PASS #68 CHƯA CÓ (BOOT THỨ 9 KHÔNG CỜ) + PHÁT HIỆN MỚI: POLL CUỐI WATCHER-164 18:06:41Z SAU BTIME #68 11 S — KHUNG GIỜ #67/#68 LỆCH NHAU, (m) #68 CẦN T2-165 ĐỐI CHIẾU LẠI + WATCHER-165 CHẠY PID 28592; MARKER SỐNG QUA 21 REBOOT; X11: 3 SOCKET MỚI X193/X194/X195 LÚC 20:46Z, 0 XVFB THẬT

> Luồng T5, đợt 165, lượt cron 03:35 +07 22/11/2026 (mở
> 20:35:51Z 21/11/2026; T5 mở thực tế ~20:38Z; hạn cờ ~23:00Z, hạn cứng
> đóng 23:30Z). Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có
> `.git` local — KHÔNG push). **BOOT HIỆN TẠI #69 (ĐÃ XÁC NHẬN —
> parent quyết (e) đợt 164 XÁC NHẬN số hiệu; T0-165 xác minh 9 nguồn
> KHỚP, .done 20:44:32Z; T5 xác minh độc lập dưới đây)**
> 9a1a9319-3786-4add-8ffa-c51a1027946e (btime **20:09:31Z** —
> /proc/stat btime 1795291771; **btime LÀ GIỜ THẬT** — xem §4.1:
> uptime khớp btime 0,1–0,3 s, /proc/1 +11 s, journal +11 s,
> Cloudflare +1 s).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (n) đợt 163,
> ghi nhận lại lần thứ mười hai — xem §2).**
> **POSTBOOT_PASS cho #69 ĐÃ GHI 20:43:50Z (boot+34m19s,
> mode replay-day-du, poll=0)** — replay tự nhiên CHẠY ĐẦY ĐỦ trên
> #69, hoạt động dpkg đầu 20:10:06Z (boot+35s), xong 20:12:18Z
> (boot+2m47s, 132 s); kiểm chứng độc lập: postboot exit 0 lúc
> 20:44:17Z, 11/11 gói + 5/5 lib (§3.1). **POSTBOOT_PASS cho #68
> CHƯA CÓ lúc T5 mở VÀ lúc đóng** (không file POSTBOOT_PASS* nào
> chứa 0c8a94aa — xem §3.2; #68 là boot thứ 9 không có cờ).
> **Watcher-164 pid 5451 CHẾT THEO REBOOT #68 — ĐÃ XÁC MINH ĐỘC LẬP
> (poll cuối 18:06:41Z, 52 poll đều; parent quyết (x) đợt 163 đã ghi
> nhận mẫu này ở watcher-163). Watcher-165 KHỞI ĐỘNG TAY 20:43:49Z,
> pid 28592** (§3). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 21 REBOOT LIÊN TIẾP
> #49–#69** (§2.1; +2 so với đợt 164 vì #68 và #69 đã qua; T0-165
> đếm độc lập KHỚP 21).
> **PHÁT HIỆN MỚI — CAVEAT KHUNG GIỜ #68 (§4.2, QUAN TRỌNG NHẤT
> ĐỢT NÀY): poll cuối watcher-164 chạy TREN boot #67 lúc 18:06:41Z,
> SAU btime #68 (18:06:30Z) 11 s — hai khung giờ lệch nhau ít nhất
> 11 s. Thời điểm reboot thật (khung #67) nằm trong (18:06:41Z,
> ~18:07:02Z]; offset requeue thật ∈ [15 s, 36 s] (cửa cứng [6 s,
> 36 s]) — ĐÈ LÊN BIÊN DƯỚI dải dương 33–49,8 s, trong khi offset
> theo btime (+47,131 s) nằm gần biên trên. T5 KHÔNG tự phán (m)
> #68 và KHÔNG lật quyết (e) đợt 164 của parent — giao T2-165 đối
> chiếu độc lập, parent quyết lại nếu cần.**
> **X11: TRỐNG lúc T0 kiểm (~20:40Z); X193 lúc 20:42Z; 3 socket
> X193/X194/X195 mtime 20:46Z, 0 process Xvfb THẬT** — socket mồ
> côi, chủ tạo chưa xác định, dọn thuộc T8-165 (§6).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc
> T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ là giờ thật)

| Thời điểm | Sự kiện |
|---|---|
| 17:33:27Z | **Reboot #67, boot f1d4ce1a** (btime — parent quyết (d) đợt 163 XÁC NHẬN) |
| 17:40:59Z | Watcher-164 START bằng tay, pid 5451; **POSTBOOT_PASS #67 ghi 17:54:38Z** (replay-day-du, poll=0) |
| 18:06:30Z | **Reboot #68, boot 0c8a94aa** — btime theo T7-164 (9 nguồn, khung #68); **XEM CAVEAT §4.2**: poll cuối watcher-164 18:06:41Z vẫn chạy trên #67 |
| 18:06:41Z | **Poll cuối watcher-164** (trên #67, 11 s sau btime #68) — watcher chết theo #68 |
| ~18:07:02Z | T7 sleep #2 chết (ước T7-164 — corroboration khung #67 còn sống sau 18:06:30Z) |
| 18:07:17.131Z | Requeue run 164 lần 1 (scheduler event, host-side) = btime #68 +47,131 s |
| 19:16:46–19:20:59Z | attempt2-0c8a94aa (lượt yên hợp lệ #29, 20/20, B 5/5, tickCost 57,0 ms — theo T4-164/T10-164) |
| 19:29:20Z | GATE-FOUND đường (b); 19:29:54–19:32:56Z O8 3/3 PASS trên #68 (theo aggregate 164) |
| 20:09:29Z | T8-164 đóng cờ |
| 20:09:31Z | **Reboot #69, boot 9a1a9319** — TRONG LÚC T10-164 đóng sổ (2 s sau cờ T8) |
| 20:10:06Z | **Hoạt động dpkg ĐẦU trên #69 (boot+35s)** |
| 20:10:06.432Z | Requeue run 164 lần 2 tại #69 (btime+35,432 s, TRONG dải [33; 49,8] — theo T0-165, DB chỉ đọc; kết cục + (m) #69 thuộc T7-165/T2-165) |
| 20:12:18Z | **Replay #69 xong** (dpkg cuối, gstreamer1.0-tools installed — boot+2m47s) |
| 20:28:17.866Z | Run 164 succeeded (theo T0-165) |
| 20:35:51Z | Lượt cron đợt 165 mở (giờ host) |
| ~20:38Z | T5-165 mở: boot 9a1a9319, **không watcher nào chạy**; không POSTBOOT_PASS cho #68/#69; replay ĐÃ XONG |
| ~20:40Z | T4-165 preflight: X11 TRỐNG; postboot check-only chạy tay exit 0 (replay #69 đã xong) |
| 20:42Z | Socket X193 xuất hiện (1 socket) |
| 20:43:49Z | **Watcher-165 START (bằng tay, setsid nohup), pid 28592, boot 9a1a9319** |
| 20:43:50Z | **FLAG-WRITTEN #69 (boot+34m19s, replay-day-du, poll=0)** |
| 20:44:17Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 20:44:32Z | T0-165 đóng cờ (.done đầu tiên đợt 165; 9 nguồn khớp, marker 21 — KHỚP T5) |
| 20:44:56Z | Stats script T5 chạy (Phụ lục A) |
| 20:46Z | 3 socket X193/X194/X195 (mtime 20:46Z), 0 Xvfb thật |
| 20:48:51Z | Kiểm cuối trước khi viết LIMITS này: boot vẫn 9a1a9319, watcher-165 poll đều (11 poll), cờ #69 còn, dpkg md5 b9d79ebc không đổi |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (n) đợt 163 (ghi nhận hướng (3) vẫn đứng lần thứ 10) +
quyết (e) đợt 154 + các lần ghi nhận (q) đợt 155, (o) đợt 156–159,
(n) đợt 160–164: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở,
T5 khởi động lại bằng tay. T5-165 kiểm tra lại nhanh `systemctl
is-active` (§A.8): user@0/logind/dbus vẫn inactive, không linger,
không cron, không /run/user/0 — cell không đổi, kết luận đợt 154–164
giữ nguyên (lần kiểm tra lại thứ mười hai liên tiếp). Unit + script ở
`round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 21 REBOOT LIÊN TIẾP #49–#69

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49–#69; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#69 (21 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (19 reboot ở đợt 164 →
  21 reboot đợt này: +2 vì #68 và #69 đã qua). **T0-165 đếm độc
  lập KHỚP 21** (round165-t0.done 20:44:32Z). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`) PERSISTENT
  qua rebuild — khẳng định lần thứ hai mươi mốt liên tiếp.

## 3. Watcher-165 — chạy bằng tay (quy tắc đứng (3)) + POSTBOOT_PASS #69

- **Trạng thái lúc mở (~20:38Z): KHÔNG watcher nào chạy**
  (`pgrep -af replay-watch`: chỉ còn lệnh exec của chính T5;
  `kill -0 5451`: chết). Ghi vào
  `watcher-status-at-open.txt`. **Watcher-164 chết theo reboot #68 —
  T5-165 xác minh độc lập từ log gốc** (xem §4.2): 52 poll đều, poll
  cuối 18:06:41Z, 0 END/0 STOP/0 NEWBOOT.
- **Khởi động bằng tay 20:43:49Z, pid 28592** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-165-START 2026-11-21T20:43:49Z pid=28592
  boot=9a1a9319 btime=2026-11-21 20:09:31Z end=2026-11-21T23:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=b9d79ebc init_mtime=20:12:18Z cache=178 lists=37 gst_sys=269`
- **Thay đổi so với watcher-164 (3 điểm):**
  1. END = 23:30:00Z 21/11 (hạn cứng đợt 165 theo task); DIR =
     round165-t5, OLD_T5_DIR = round164-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #69 + trạng thái replay ĐÃ XONG
     lúc khởi động (dpkg 1545 dòng, md5 b9d79ebc, mtime 20:12:18Z,
     /var/log/apt/ TỒN TẠI, GST 269, cache 178, lists 37, 0 proc)
     + caveat khung giờ #68 (poll cuối watcher-164 sau btime #68
     11 s — giao T2-165 đối chiếu; header KHÔNG tự phán (m) #68).
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[45]`/`23:30` + `bash -n` syntax OK
     + assert không có cụm thừa nhận H2 + assert không có
     "NHANH NHAT" — bài học F-163-T5-7) — adapter chạy sạch ngay
     lần đầu, 0 lần sửa.
- **Poll đều đã xác minh:** 11 poll tới 20:48:52Z (20:43:49Z →
  20:48:52Z; khoảng: 30 s ×7, 31 s ×3 — đều, 0 khoảng trống);
  log 16 dòng lúc kiểm cuối 20:49:11Z: START 1, MONITOR 1,
  poll 11, REPLAY_DONE 1, postboot poll0 1, FLAG-WRITTEN 1,
  0 NEWBOOT, 0 END, 0 EARLY-REPAIR.
- **EARLY-REPAIR KHÔNG kích hoạt — ĐÚNG THIẾT KẾ:** replay đã
  xong trước khi watcher khởi động (dpkg 1545 dòng ổn định từ
  20:12:18Z); điều kiện repair (dòng <100) không bao giờ thỏa.
  Guard file `repaired-9a1a9319` KHÔNG tồn tại (chưa repair —
  đúng, vì không cần). Cổng boot+15' (20:24:31Z) đã qua trước khi
  watcher khởi động — không ảnh hưởng (replay đã xong).

### 3.1 POSTBOOT_PASS cho #69 — CÓ QUA REPLAY-DAY-DU (KHÔNG CẦN REPAIR)

- **Replay tự nhiên trên #69: CHẠY ĐẦY ĐỦ, NHANH HƠN #67 VỀ THỜI
  GIAN REPLAY.** Bằng chứng: hoạt động dpkg đầu 20:10:06Z
  (boot+35s); **cài đặt 20:10:06Z → 20:12:18Z (132 s)**; dpkg 2 →
  **1.545 dòng** (md5 b9d79ebc, ổn định từ 20:12:18Z tới kiểm cuối
  20:48:51Z — 0 proc apt/dpkg); lists 37; cache 178 .deb; GST hệ
  thống 269 file (thư mục thật apt, như #64/#65/#67); `/var/log/apt/`
  TỒN TẠI (history Start 20:10:47 → End 20:12:18).
- **Hoạt động dpkg đầu boot+35s (35 s)** — nhanh hơn #67 (+137s),
  #65 (+47s) và #59 (+35s — bằng). **T5 KHÔNG xếp hạng
  "nhanh nhất/nhì" cho #69** (bài học F-163-T5-7 — chỉ ghi số
  liệu thực đo; thứ hạng đầy đủ thuộc T0/T10 khi đối chiếu chuỗi).
  Hoạt động dpkg kéo dài 132 s (2m12s: 20:10:06Z → 20:12:18Z) —
  nhanh hơn hẳn #67 (1.081 s, do apt-get update 649–770 s) và
  #65 (185 s toàn bộ replay). T5 ghi nhận, không suy đoán nguyên
  nhân mạng (không có số đo băng thông).
  Diễn giải theo T0-165 ("nhanh hơn hẳn #67"): **replay #69 nhanh
  hơn #67 về thời gian chạy** (132 s vs 1.081 s; dpkg đầu +35s vs
  +137s) — NHƯNG **cờ #69 có MUỘN hơn theo tuổi boot** (boot+34m19s
  vs #67 boot+21m11s) vì không có phiên T5 nào từ btime tới giờ
  mở đợt (26m20s: btime 20:09:31Z → mở đợt 20:35:51Z); cờ chỉ đợi
  T5 mở + watcher khởi động + 1 poll (1 s). Đây là khoảng hở đã
  biết của hướng (3) — xem §5.
- **dpkg 1.545 dòng — breakdown TRÙNG KHỚP #64/#65/#67 và Dot 151:**
  breakdown theo action field (python, §B.4): 1.040 status +
  178 configure + 169 install + 106 startup + 43 trigproc +
  9 upgrade = 1.545. Các số 169 install / 9 upgrade / 178
  configure TRÙNG KHỚP header postboot Dot 151 ("dpkg 1545 dong
  / 169 install / 9 upgrade / 178 configure, goi cuoi
  gstreamer1.0-tools") và số dòng cuối #64/#65/#67 (1.545 dòng,
  md5 b07e4c5c / aeb0886e / 335dc3f2 / 51d12c3d / b9d79ebc). md5 khác
  nhau vì timestamp trong từng dòng dpkg.log khác nhau — cùng bộ
  gói, khác thời gian chạy. Gói cuối cùng: gstreamer1.0-tools
  20:12:18Z (giống Dot 151/#64/#65/#67). Cache APT 178 .deb —
  trùng số Dot 151 ("cache APT SONG 178 .deb/156M");
  **lists 37 — TRÙNG #64 (37), khác #65/#67 (39)** (ghi nhận,
  không suy đoán nguyên nhân; watcher ghi lists=37 ổn định từ
  khi khởi động).
- **REPLAY_DONE lúc 20:43:49Z (poll đầu):** watcher poll thấy dpkg
  ổn định 1.545 dòng, 0 proc → postboot poll0 **exit=0** → ghi cờ
  ngay. Đây là đường chuẩn (cùng mẫu #65 poll=0: watcher-163
  START 14:45:03Z → cờ 14:45:05Z; và #67 poll=0), không phải đường
  tắt: dpkg đã đóng băng đủ lâu (ổn định từ 20:12:18Z, 31m31s
  trước poll) + postboot PASS thật.
- **FLAG-WRITTEN 20:43:50Z** (`round165-t5/POSTBOOT_PASS`):
  `boot 9a1a9319-3786-4add-8ffa-c51a1027946e (btime 2026-11-21
  20:09:31Z; watcher-165) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T20:43:50Z; POSTBOOT_PASS moi ghi 2026-11-21T20:43:50Z
  poll=0 (replay-day-du); co cu f1d4ce1a luu POSTBOOT_PASS-f1d4ce1a`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-f1d4ce1a` đã đối chiếu bằng
  `diff` — **KHỚP cờ #67 gốc** (round164-t5).
- **Cờ lúc 20:43:50Z = boot+34m19s (2.059 s).** Muộn hơn #67
  (boot+21m11s) 13m08s — KHÔNG do replay chậm (replay #69 nhanh
  hơn #67) mà do T5 mở muộn (xem trên): từ lúc T5 mở thực tế
  (~20:38:52Z) tới cờ chỉ **298 s (4m58s)**; từ watcher-165 START
  tới cờ chỉ **1 s**. Khoảng KHÔNG-watcher 2h37m08s trước đó (do
  watcher-164 chết theo reboot #68, xem §4.2) là lỗ hổng riêng
  của đợt này. **Không thiệt hại đo được:** cờ có trước khi
  T4/T8-165 cần gate0 (T4-165 đã dùng cờ qua T4-check-only lúc
  preflight ~20:40Z? — KHÔNG: lúc preflight cờ CHƯA có; T4 dùng
  postboot check-only chạy tay làm dự phòng gate0, và đọc cờ T5
  sau 20:43:50Z; T5 đóng cờ trước hạn cờ ~23:00Z hơn 2 giờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-9a1a9319.log`, exit 0,
  20:44:17Z): wrapper PASS, libs PASS đủ 5, GST PASS (thư mục
  thật apt, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5 — chạy SAU replay xong nên
  không còn trạng thái giữa replay như F-164-T5-4).
- **Phối hợp T4/T8-165:** poller T4-165 + harness T8-165 đọc
  `round165-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  20:43:50Z, TRƯỚC khi các luồng khác cần gate0. T4-165 preflight
  (~20:40Z) ghi rõ "Co T5-165 CHUA CO (T5-165 so huu)" và dùng
  postboot check-only chạy tay làm dự phòng — đúng quy trình.

### 3.2 POSTBOOT_PASS cho #68 — CHƯA CÓ (XÁC MINH LÚC MỞ + LÚC ĐÓNG, KHÔNG BÙ ĐƯỢC)

- **Không file POSTBOOT_PASS* nào chứa 0c8a94aa** (kiểm lúc mở
  20:43:42Z bằng `grep -rl` toàn bộ `POSTBOOT_PASS*` dưới
  `hidden_files/` + kiểm trực tiếp từng đường dẫn
  `round165-t5/POSTBOOT_PASS-0c8a94aa` và
  `round164-t5/POSTBOOT_PASS-0c8a94aa` — đều KHÔNG CO; kiểm lại
  lúc đóng cờ bằng script `t5-stats-165.py` §2c — vẫn KHÔNG CO;
  xem §A). **#68 là boot thứ 9 không có cờ** (#51, #53, #54, #55,
  #57, #60, #63, #66, #68). T5-165 KHÔNG ghi cờ hồi tố cho #68
  (boot đã chết; cờ chỉ chứng nhận phép đo trực tiếp trên boot
  sống — cùng quy tắc đã áp cho #63/#66, xem LIMITS T5-163 §8 /
  T5-164 §3.2).
- **POSTBOOT_PASS #67 ĐÃ XÁC MINH LẠI trên đĩa** (round164-t5,
  mtime 17:54:38Z, nội dung đọc trực tiếp lúc 20:44:56Z — KHỚP
  từng chữ với LIMITS T5-164 §A.3). **POSTBOOT_PASS #65 CÒN**
  (round163-t5, mtime 14:45:05Z — KHỚP LIMITS T5-163 §3.2).
  **POSTBOOT_PASS #66 KHÔNG CÓ** (không file nào chứa edb2acdb —
  kiểm lại đợt này, §A.2c). **POSTBOOT_PASS #63 KHÔNG CÓ**
  (không file nào chứa 94d22520 — kiểm lại đợt này, §A.2c).

## 4. Boot #68/#69 + đồng hồ — #69 KHÔNG NGHỊCH LÝ (T0+T5 KHỚP); #68 CÓ CAVEAT KHUNG GIỜ (MỚI)

### 4.1 Bằng chứng quyết định cho #69 (bài học F-161-T5-2 đã áp dụng)

1. **Uptime khớp btime trên #69 (T5 đo trực tiếp):** uptime
   1.890,90 s lúc 20:41:02Z ⇒ boot lúc 20:09:31,1Z; btime
   20:09:31Z — **chênh 0,1 s**. `uptime -s` = 20:09:31Z, KHỚP
   btime từng giây (kiểm lại lúc đóng 20:48:51Z: `uptime -s`
   vẫn 20:09:31Z). uptime 2.125,29 s lúc 20:44:56Z ⇒ boot
   20:09:30,7Z — chênh 0,3 s. Đây chính là kiểm đã bác H2 ở #62
   (GAP §90): ở #69 kiểm này ĐẬU, nên **btime #69 LÀ giờ thật,
   không cần khung thứ hai**.
2. **/proc/1 và journal khớp btime +11 s (mẫu bình thường):**
   /proc/1 mtime 20:09:42,4Z; journal first entry 20:09:42Z
   (epoch 1795291782,878); journal_boots chỉ 1 boot (#69).
   (+11 s — hơi nhanh hơn #67 (+14 s) và #68 (+16 s theo T7);
   cùng mẫu, không nghịch lý.)
3. **Đồng hồ mới ĐÚNG lúc đo (T5 đo 2 lần):** 20:41:03Z local
   vs Cloudflare 20:41:04 GMT (+1 s); 20:48:51Z local vs
   Cloudflare 20:48:53 GMT — local sau đó 20:48:52Z, tức offset
   +1 s sau khi trừ ~1 s thời gian request (xem F-165-T5-3:
   stats §1 ghi +2 s vì hai lần đọc không đồng thời trong
   script). Cả hai lần đều ≈ +1 s — ổn định, không drift trong
   phiên.
4. **T0-165 xác minh độc lập số hiệu #69 — ĐÃ CÓ** (round165-t0.done
   20:44:32Z): 9 nguồn khớp, KHÔNG nghịch lý đồng hồ; gap
   #68→#69 = 7.381 s kiểm lại khớp T10-164; reboot #69 TRONG LÚC
   T10-164 đóng sổ, 2 s sau T8 đóng cờ (T8 .done 20:09:29Z) —
   claim T10-164 ĐƯỢC XÁC NHẬN; boot #68 chết trong (20:09:29Z,
   20:09:31Z], 0 overlap dài. **T5 KHỚP T0 ở mọi điểm đối chiếu
   được** (btime, gap, marker 21 — xem §2.1).
5. **Reboot #69 xảy ra TRONG LÚC T10-164 đóng sổ** (sau T8 đóng
   cờ 20:09:29Z 2 s, trước T9 đóng cờ 20:16:30Z 7'01\" — theo
   aggregate 164 §12.3(e)) và 26m20s TRƯỚC giờ mở đợt 165
   (20:35:51Z) — claim "không reboot mới trong lúc T10-164 đóng
   sổ" của aggregate 164 **KHÔNG ĐỨNG ở phần #69** (aggregate đã
   tự ghi nhận #69 trong §10.5(x) và §12.3(e); T0-165 xác nhận
   claim T10-164 ĐƯỢC XÁC NHẬN theo nghĩa T10 đã phát hiện #69
   trong lúc đóng sổ — xem aggregate 164 dòng 154).
   **(m) #69: T5 KHÔNG phán** — thuộc T7-165 (kết cục run 164 +
   requeue lần 2 tại #69) + T2-165 (đối chiếu độc lập); T5 chỉ
   ghi số liệu thô: btime #69 = 20:09:31Z; requeue lần 2 tại #69
   lúc 20:10:06.432Z = btime +35,432 s (theo T0-165, DB chỉ đọc)
   — TRONG dải dương 33–49,8 s; run 164 succeeded 20:28:17.866Z
   (theo T0-165). Số liệu thô cho T7/T2, không kết luận.

### 4.2 Watcher-164 chết theo reboot #68 — ĐÃ XÁC MINH ĐỘC LẬP + CAVEAT KHUNG GIỜ #68 (PHÁT HIỆN MỚI)

- **Sự kiện (đo lại độc lập từ log gốc — Phụ lục B):** 52 poll,
  17:40:59Z → 18:06:41Z, khoảng giữa hai poll liên tiếp: 30 s
  ×39, 31 s ×12 — đều, 0 khoảng trống. Poll cuối 18:06:41Z là
  poll bình thường (dpkg 1.545 ổn định, md5 b07e4c5c, 0 proc).
  Log mtime cuối 18:06:41,93Z. **KHÔNG có dòng END** (hạn
  watcher-164 là 20:30:00Z, chưa tới), **KHÔNG có dòng NEWBOOT**,
  **KHÔNG có file watcher-stop** trong round164-t5/. pid 5451 chết
  (`kill -0`: No such process).
- **Poll cuối 11 s SAU btime #68 (18:06:30Z)** — poll cuối đua
  với reboot rồi chết; watcher KHÔNG sống qua reboot. **Khác
  watcher-162 chết sớm không rõ nguyên nhân** (trước btime #65
  9m37s): watcher-164 chết ĐÚNG theo reboot #68 — nguyên nhân
  xác định được (cùng mẫu watcher-163 chết theo #66: poll cuối
  9 s sau btime).
- **Hậu quả đo được:** KHÔNG có watcher trong 2h37m08s
  (18:06:41Z → 20:43:49Z, 9.428 s), gồm cả thời điểm reboot #69 —
  reboot được phát hiện hậu kiểm qua btime (T0/T5), không có dòng
  NEWBOOT nào trong log watcher; NHƯNG không mất đo nào: replay
  #69 chạy đầy đủ tự nhiên, cờ #69 có 20:43:50Z (trước khi
  T4/T8-165 cần gate0), POSTBOOT_PASS #67/#65 còn nguyên trên đĩa,
  marker còn nguyên. **Khoảng không-watcher này DÀI NHẤT từ trước
  tới nay** (vượt 1h34m05s của đợt 164 — vì reboot #68 rơi vào
  giữa đợt 164 và reboot #69 rơi vào giữa hai đợt; không có phiên
  T5 nào trong khoảng đó theo thiết kế vòng lặp).
- **CAVEAT KHUNG GIỜ #68 — BẰNG CHỨNG THÔ (T5 trình bày, không tự
  kết luận (m)):**
  1. Poll cuối watcher-164 lúc **18:06:41Z chạy TREN boot #67**
     (f1d4ce1a) — script đọc `/proc/sys/kernel/random/boot_id`
     tươi mỗi vòng lặp và ghi NEWBOOT trước dòng poll nếu boot
     đổi; không có dòng NEWBOOT nào, nên lúc ~18:06:41Z kernel
     vẫn báo f1d4ce1a. Đồng hồ #67 đã xác minh ĐÚNG lúc 17:55:51Z
     (T5-164: local 17:55:51Z vs Cloudflare 17:55:52 GMT, +1 s;
     cũng +1 s lúc 17:39:56Z và 17:42:06Z) — không có bằng chứng
     đồng hồ #67 nhảy trong 11 phút cuối.
  2. Corroboration độc lập từ T7-164 (LIMITS T7-164 §2.6/§4, trích
     nguyên): sleep #2 "spawn 18:06:34Z, chết sau 28 s ~18:07:02Z,
     32 s sau btime #68 — killer là reboot #68". Một process spawn
     lúc 18:06:34Z (khung #67) sống tới ~18:07:02Z — #67 còn sống
     sau 18:06:30Z. (T7-164 không tự nối hai mốc này với btime
     #68; T5-165 nối lần đầu.)
  3. Phía #68 (T7-164 §2.5, trích nguyên): btime 1795284390 =
     18:06:30Z; `uptime -s` 18:06:30Z (khớp); /proc/1 mtime
     18:06:46,171Z (+16,171 s); journal first entry 18:06:46Z
     (+16 s); wtmp begins 18:06:46Z; `last` reboot 18:06;
     Cloudflare ±1 s lúc 18:07:45Z và 19:50:24Z.
  4. **Mâu thuẫn:** (1) chứng minh máy còn ở #67 lúc 18:06:41Z
     (khung #67); (3) nói #68 đã boot lúc 18:06:30Z. Cả hai
     không thể cùng đúng trong một khung giờ. Suy ra **hai khung
     giờ lệch nhau ít nhất 11 s** — hoặc đồng hồ #67 chạy nhanh
     ở phút cuối (không bằng chứng), hoặc btime #68 sớm hơn giờ
     thật (VD: RTC cũ lúc boot, NTP sửa lại sau — phù hợp với
     Cloudflare đúng lúc 18:07:45Z CHỈ KHI việc sửa xảy ra giữa
     lần kiểm uptime của T7 và lần kiểm Cloudflare; thứ tự/thời
     điểm chính xác các lần kiểm trong đọc #3 của T7 không được
     ghi lại), hoặc tương đương.
  5. **Giới hạn thời điểm reboot thật (khung #67 ≈ khung thật):**
     (18:06:41Z, 18:07:11Z] — giới hạn cứng từ watcher (poll cuối
     18:06:41Z, poll tiếp ~18:07:11Z không bao giờ tới); thu hẹp
     thành (18:06:41Z, ~18:07:02Z] nhờ cái chết của sleep T7
     (~18:07:02Z là ước của T7, không phải mốc cứng).
  6. **Offset requeue thật:** requeue 18:07:17.131Z (timestamp
     host-side, scheduler DB) trừ thời điểm reboot thật ∈
     **[15 s, 36 s]** (cửa cứng [6 s, 36 s] nếu dùng giới hạn
     watcher). Dải dương là 33–49,8 s — **offset thật ĐÈ LÊN BIÊN
     DƯỚI của dải**: chỉ nằm trong dải khi reboot thật ∈
     (18:06:41Z, 18:06:44,131Z] — cửa sổ 3,1 s ở đầu khoảng có
     thể. Trong khi offset theo btime (+47,131 s) nằm gần BIÊN
     TRÊN của dải. Hai cách tính cho hai vị trí đối nghịch nhau
     trong dải.
  7. **Phạm vi ảnh hưởng (T5 tự giới hạn):** chỉ offset requeue
     (m) #68 là nhạy với lệch khung (biên dải 33 s, cửa sổ offset
     thật 15–36 s). Gap #67→#68 thật ∈ (1.994 s, 2.024 s] (cửa
     cứng) — vẫn NGẮN NHẤT chuỗi gần đây (kế tiếp 2.676 s), nên
     nhận xét "ngắn nhất" của aggregate 164 ĐỨNG, chỉ số tuyệt
     đối 1.983 s là theo khung btime. Gap #68→#69 thật ∈
     [7.340 s, 7.370 s] (vs 7.381 s theo btime) — lệch ≤41 s,
     không đáng kể với dải FULL (rộng ~2h); INSIDE #68/#69
     (dải FULL114 neo 17:33:27Z, thuộc T2-165) không bị ảnh hưởng
     đáng kể. Boot_id #68 (0c8a94aa) không bị nghi ngờ — O8 JSON,
     T7/T8/T10 đều chạy trên #68 sau reboot. Btime #69 không bị
     ảnh hưởng — xác minh sạch (§4.1).
  8. **T5 KHÔNG lật quyết (e) đợt 164 của parent** (XÁC NHẬN #68
     + CHẤP NHẬN (m) #68 DƯƠNG, dựa trên +47,131 s) và **KHÔNG
     tự phán (m) #68**. Đây là bằng chứng mới (T5-164 đã đóng
     17:57Z trước reboot #68; T7-164 không nối mốc poll cuối
     watcher với btime) — **giao T2-165 đối chiếu độc lập (đúng
     nhiệm vụ T2-165 theo brief) và parent quyết lại nếu cần**.
     Nếu parent giữ quyết (e): ghi nhận caveat này cạnh quyết.
     Nếu parent xét lại: n ứng viên 21→22 (nhánh khuyến nghị)
     hoặc 22→23 có thể phải xét lại theo offset thật.

### 4.3 Boot #68 (0c8a94aa, btime 18:06:30Z theo khung btime): #68 SỐNG 7.381 S

- #68 sống **7.381 s (2h03m01s)** theo btime (18:06:30Z →
  20:09:31Z); theo khung thật ∈ [7.340 s, 7.370 s] (xem §4.2.7).
  Dài hơn #67 (1.983 s) nhiều; ngắn hơn #65 (5.508 s)? — KHÔNG:
  7.381 s dài hơn #65 (5.508 s), #66 (5.202 s) và #67 (1.983 s).
  Gap #68→#69 = 7.381 s chưa đưa vào CERT/FULL — chờ #94?/#95?/
  #96?/#97? đóng (giao T2-165 làm cơ sở FULL114/FULL115).

### 4.4 Tuổi boot theo khung thật duy nhất (không trừ lẫn lộn)

| Mốc | Giờ (thật) | Tuổi boot #69 |
|---|---|---|
| btime #69 | 20:09:31Z | — |
| Hoạt động dpkg đầu | 20:10:06Z | boot+35s |
| Replay xong (dpkg cuối) | 20:12:18Z | boot+2m47s |
| Watcher-165 START | 20:43:49Z | boot+34m18s |
| FLAG-WRITTEN #69 | 20:43:50Z | boot+34m19s |
| Postboot độc lập T5 | 20:44:17Z | boot+34m46s |
| Stats script T5 | 20:44:56Z | boot+35m25s |

- Tuổi boot #68: **7.381 s (2h03m01s)** theo btime (18:06:30Z →
  20:09:31Z); theo khung thật ∈ [7.340 s, 7.370 s].
- Reboot #69 xảy ra TRONG LÚC T10-164 đóng sổ (sau T8 đóng cờ
  20:09:29Z 2 s, trước T9 đóng cờ 20:16:30Z 7'01\") — không phá
  lượt đo nào trong đợt 164 (O8 DONE 19:32:56Z, trước #69 36'35\";
  run 164 succeeded 20:28:17Z — kết cục + (m) #69 thuộc T7-165).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 165

- T0-165 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-165 đóng
  cờ 20:44:32Z — lúc đó watcher-165 CHƯA khởi động (T0 ghi rõ
  "Watcher-165 chưa khởi động"); T5 khởi động 20:43:49Z — TRƯỚC
  khi T0 đóng cờ 43 s (T0 kiểm lúc ~20:40Z, trước khi watcher
  khởi động). Không mâu thuẫn — chỉ khác thời điểm kiểm (cùng
  mẫu watcher-164 chết theo reboot #68 mà T5-164 không thấy).
- **Cửa sổ hở hướng (3) ở #69: 34m19s từ boot tới cờ** — NHƯNG
  chỉ **4m58s từ lúc T5 mở tới cờ** (replay nhanh, cờ chỉ đợi T5
  mở + watcher khởi động + 1 poll). Đây là khoảng hở đã biết của
  hướng (3): cờ chỉ có khi có phiên T5 sau reboot + replay/repair
  xong. Khoảng KHÔNG-watcher 2h37m08s (do watcher-164 chết theo
  reboot #68 — §4.2) là lỗ hổng riêng của đợt này: reboot #69
  rơi vào khoảng không có watcher — #69 vẫn BẮT ĐƯỢC cờ nhờ replay
  tự nhiên chạy đầy đủ + T5-165 khởi động kịp (khác #63/#66/#68 —
  không có phiên T5 nào sau reboot trước khi boot kế tới).
- **Watcher-165 tiếp tục giám sát tới 23:30:00Z**; nếu có reboot
  #70 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-166 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-165 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **2.347.572 kB @20:44:56Z** (lúc T4 preflight
  đang chạy, loadavg 6,67); MemFree 491.260 kB @20:44:56Z.
  loadavg 6,67 @20:44:56Z (T4 đang chạy — không phải kẹt).
- **ENOSPC journal boot #69:** **17 dòng** lúc 20:44:56Z
  (journal 167 dòng) và **20 dòng** lúc 20:48:51Z (journal 179
  dòng) — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`; T9-165 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo.
  **Lưu ý: `journalctl --boot` ĐỌC ĐƯỢC trên boot #69** (179 dòng)
  — cùng mẫu #67 (T5-164 đọc được 132 dòng), khác T10-163 (trả
  0 dòng cho cả hai boot #65/#66 lúc đóng); ghi nhận để T10-165
  đối chiếu.
- **Không reboot mới trong phiên T5** (boot vẫn 9a1a9319 lúc
  kiểm cuối 20:48:51Z — KHÔNG có #70; watcher-165 tiếp tục
  giám sát tới hạn cứng 23:30:00Z).
- **journal_boots chỉ còn 1 boot (#69):** journal của #68
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước). Vì vậy T5 KHÔNG xác
  minh độc lập được boot_id/btime #68 từ #69 — phân tích §4.2
  dựa trên log watcher-164 + LIMITS T7-164 (trích nguyên, không
  đo lại được từ #69).
- **X11 — TRỐNG lúc T0 kiểm, 3 socket MỚI sau đó:**
  `/tmp/.X11-unix/` TRỐNG lúc T0-165 kiểm (~20:40Z) và lúc
  T4-165 preflight (~20:40Z, "X11: /tmp/.X11-unix/ TRONG; 0
  Xvfb"). Lúc stats 20:44:56Z: **1 socket X193, mtime 20:42Z**.
  Lúc kiểm cuối 20:48:51Z: **3 socket X193/X194/X195, mtime
  20:46Z** (cả 3 cùng mtime — tạo lại cùng lúc lúc 20:46Z);
  **0 process Xvfb THẬT** (`pgrep -x Xvfb` exit 1). Cùng 3 số
  display như đợt 160–164 — **lần thứ sáu liên tiếp** cùng 3 số
  display (T8-164 ghi lần thứ năm). Chủ tạo chưa xác định (T5
  không đoán — có thể T8/T4-165 khởi Xvfb); **dọn thuộc T8-165**
  theo aggregate 163 §11.13. T5 KHÔNG tự dọn (Xvfb thuộc vòng đời
  harness T8; xóa socket trong lúc T8 có thể đang chạy là can
  thiệp ngoài phạm vi T5). Lưu ý: `pgrep -af Xvfb` cho kết quả
  dương tính GIẢ (match văn bản lệnh của T4 preflight chứa chữ
  "Xvfb" và lệnh exec của chính T5 — xem F-165-T5-2); chỉ
  `pgrep -x` mới đáng tin cho kiểm này.

## 7. Nợ mở chuyển đợt 166 (từ T5-165)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 21 reboot
   #49–#69. T5-166 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #69 — XONG 20:43:50Z** (watcher-165,
   replay-day-du, poll=0; T4/T8-165 phối hợp qua cờ).
   Watcher-165 tiếp tục giám sát tới 23:30:00Z; nếu có reboot
   #70 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-166 kiểm tra log.
4. **POSTBOOT_PASS #68 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 9 không cờ; cùng tiền lệ #51/#53/#54/#55/#57/#60/
   #63/#66). Chỉ thiếu cờ watcher (dữ kiện #68 chỉ còn cờ T7/T10).
   **POSTBOOT_PASS #66 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (boot thứ 8
   không cờ; đã kiểm lại đợt này). **POSTBOOT_PASS #63 — KHÔNG
   CÓ, KHÔNG BÙ ĐƯỢC** (boot thứ 7 không cờ; đã kiểm lại đợt này).
5. **CAVEAT KHUNG GIỜ #68 (§4.2) — NỢ LỚN NHẤT ĐỢT NÀY.**
   Watcher-164 poll cuối 18:06:41Z trên #67 vs btime #68
   18:06:30Z: hai khung lệch ≥11 s; offset requeue thật ∈
   [15 s, 36 s] (cửa cứng [6 s, 36 s]) đè lên biên dưới dải
   dương 33–49,8 s. Giao T2-165 đối chiếu độc lập + parent
   quyết lại (m) #68 nếu cần (giữ quyết (e) đợt 164 hoặc xét
   lại n ứng viên). T5-166 kiểm tra xem T2-165/parent đã kết
   luận gì — không tự phán.
6. **Watcher-164 chết theo reboot #68 — NGUYÊN NHÂN XÁC ĐỊNH
   ĐƯỢC** (xem §4.2; T5-165 xác minh độc lập, KHỚP mẫu T10-163
   ở watcher-163). Khoảng không-watcher 2h37m08s là DÀI NHẤT
   từ trước tới nay — ghi nhận, không mở giả thuyết mới (khoảng
   trống nằm giữa hai đợt theo thiết kế vòng lặp, không phải lỗi
   watcher).
7. **Replay khởi động: #59 +35s → #61 +9m50s → #62 +22m10s →
   #64 +20m22s → #65 +47s → #67 +137s → #69 +35s (hoạt động
   dpkg đầu).** #69 nhanh hơn #67 do apt-get update không chậm
   (toàn bộ replay 132 s vs #67 1.081 s). Mẫu "vài giây trước
   giờ mở đợt" KHÔNG giữ ở #69 (dpkg đầu 20:10:06Z, trước giờ
   mở đợt 20:35:51Z tới 25m45s — vì reboot #69 xảy ra giữa hai
   đợt, trước giờ mở đợt 26m20s; mẫu cũ chỉ đúng khi reboot
   xảy ra sát giờ mở đợt).
8. **Cổng boot+15m của (h) không cần dùng ở #69** (replay chạy
   đầy đủ trước khi watcher khởi động; cổng 20:24:31Z đã qua).
   Ghi nhận để T10 đánh giá (h): cổng chỉ có ý nghĩa khi replay
   vắng — ở #69 nó không kích hoạt và không cần kích hoạt (cùng
   mẫu #67).
9. **GST trên #69 là THƯ MỤC THẬT apt (269 file)** — như #64/#65/
   #67. Boot sau phải làm lại qua replay/repair (ephemeral theo
   rebuild).
10. Nợ header postboot script còn ghi Dot 151 (ghi nhận từ
    T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
    header log ghi boot e9295700/2e430750 đợt 151 trong khi
    checks là của #69): T5 đợt sau quyết có cập nhật theo Dot
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

- **(3) vẫn đủ cho hiện tại** — đợt này replay #69 chạy đầy đủ
  tự nhiên, cờ có ở boot+34m19s, chỉ 4m58s sau khi T5 mở.
  T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ mười hai liên tiếp.
- **Số hiệu #69 đã xác nhận** (parent quyết (e) đợt 164 +
  T0-165 9 nguồn + T5 xác minh độc lập khớp) — T5 dùng "#69"
  không gắn "(ứng viên)" trong LIMITS này.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #68 từ log của
  T7/T10-164** — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #68 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **CAVEAT §4.2 cần parent + T2-165 xem trước khi chốt (m) #68
  lại:** bằng chứng watcher-164 là mới và độc lập với
  9 nguồn của T7 (đều nằm trong khung #68); offset requeue thật
  [15 s, 36 s] đè lên biên dưới dải 33–49,8 s. T5 đề xuất parent
  chờ đối chiếu độc lập của T2-165 rồi mới chốt lại (m) #68 —
  không vội giữ hay lật quyết (e) đợt 164 trong đợt này.
- **Số đếm marker: T5 giữ 21 reboot (#49–#69)** — T0-165 đếm
  độc lập KHỚP 21.
- **Khoảng không-watcher 2h37m08s (18:06:41Z–20:43:49Z) là dài
  nhất từ trước tới nay** — nhưng không mất đo nào (replay #69
  đầy đủ, cờ #69 có trước gate0); T5 không đề xuất thay đổi
  thiết kế vòng lặp (khoảng trống nằm giữa hai đợt theo lịch
  cron, không phải lỗi watcher).

## 9. Sai số của chính T5-165

- **F-165-T5-1 — Exec spawn watcher báo output_drain_timeout
  lúc 20:43:5xZ (cùng họ F-164-T5-1/F-163-T5-3):** watcher đã
  spawn thành công (child `bash replay-watch-165.sh` pid 28592 +
  `sleep 30` quan sát được trong báo cáo tiến trình con); T5
  kiểm lại bằng lệnh đọc riêng (log START 20:43:49Z + `kill -0`
  28592) thay vì tin output của exec spawn. Không mất dòng log
  nào — log đầy đủ tới poll 20:48:52Z lúc viết LIMITS.
- **F-165-T5-2 — Stats §10 `xvfb_procs` dương tính GIẢ:**
  `pgrep -af Xvfb` match văn bản lệnh của T4 preflight (chứa
  chuỗi "0 Xvfb" trong heredoc) và lệnh exec của chính T5 — KHÔNG
  phải process Xvfb thật. Kiểm sạch bằng `pgrep -x Xvfb` exit 1
  → 0 Xvfb thật (§6). Bài học: kiểm Xvfb chỉ dùng `pgrep -x`;
  script stats đợt sau sửa §10 dùng `pgrep -x`.
- **F-165-T5-3 — Stats §1 ghi Cloudflare +2 s (local 20:44:56Z
  vs CF 20:44:58 GMT):** hai lần đọc không đồng thời trong
  script (curl chạy sau `date` ~1–2 s) — không phải lỗi đồng hồ.
  Kiểm đồng thời trực tiếp: local 20:41:03Z vs CF 20:41:04 GMT
  (+1 s); local 20:48:51Z vs CF 20:48:53 GMT với local sau đó
  20:48:52Z (+1 s sau khi trừ thời gian request). Đồng hồ +1 s
  ổn định như các đợt trước.
- **F-165-T5-4 — Nợ header postboot script còn ghi Dot 151**
  (kế thừa F-164-T5-5, thấy lại ở log poll0 + log độc lập đợt
  này — header log ghi boot e9295700/2e430750 đợt 151 trong khi
  checks là của #69): nợ thẩm mỹ trong log header, không ảnh
  hưởng kết quả check. T5 đợt sau quyết có cập nhật theo Dot hay
  không.
- **Giới hạn xác minh (không phải sai số):** T5-165 xác minh
  boot #69 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + Cloudflare 2 lần (+1 s
  cả hai); T0-165 xác minh 9 nguồn KHỚP. T5 KHÔNG tự truy vấn
  scheduler DB (số liệu run 164 lấy từ T0-165 .done + aggregate
  164, đã nêu rõ nguồn — chỉ dùng mốc requeue 18:07:17.131Z và
  20:10:06.432Z làm số liệu thô, không phán (m)); đóng góp độc
  lập của T5 cho kết luận "không nghịch lý #69" là neo uptime +
  tính đều poll watcher-164/165 + đo Cloudflare (§4.1 mục 1–4),
  không phụ thuộc DB. Btime #68 (18:06:30Z) lấy từ T7-164 (9
  nguồn, trích nguyên trong §4.2) — T5 không xác minh độc lập
  được từ #69 (journal volatile); phân tích lệch khung §4.2 dựa
  trên log watcher-164 (đo trực tiếp) + LIMITS T7-164 (trích
  nguyên). Mọi khoảng thời gian trong LIMITS này đều tính lại từ
  endpoint thô bằng script python (Phụ lục B) — không cộng/trừ
  lũy kế bằng tay.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-165.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (9a1a9319, btime
  20:09:31Z).

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round165-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/`
  (không nằm trong repo nên không stage): `replay-watch-165.sh`,
  `make-watcher-165.py`, `t5-stats-165.py`,
  `t5-stats-165-output.txt`, `replay-watch-165.log`,
  `replay-watch-165.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-f1d4ce1a`,
  `t5-postboot-poll0-9a1a9319.log`,
  `t5-postboot-independent-9a1a9319.log`.

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/t5-stats-165.py`
(output đầy đủ lưu tại `t5-stats-165-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 20:44:56Z, SAU khi cờ POSTBOOT_PASS #69
đã ghi — vì vậy §2c/§3c trong output ghi "#69 CO" theo đúng
trạng thái lúc chạy; xem §3.1; F-165-T5-2: §10 xvfb_procs dương
tính giả do match văn bản lệnh — kiểm sạch bằng pgrep -x ở §6).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-165 (trich bang script, 2026-11-21T20:44:56Z) ===

--- 1. Boot hien tai ---
boot_id=9a1a9319-3786-4add-8ffa-c51a1027946e
btime_epoch=1795291771 = 2026-11-21T20:09:31Z
uptime_s=2125.29 now=2026-11-21T20:44:56Z
uptime_-s=2026-11-21 20:09:31
/proc/1 mtime=2026-11-21 20:09:42.436103264 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 9a1a931937864add8ffac51a1027946e Sat 2026-11-21 20:09:42 UTC Sat 2026-11-21 20:44:52 UTC
journal_first_entry=1795291782.878372 htch-runtime systemd-journald[17]: Journal started
local_date=Sat Nov 21 20:44:56 UTC 2026
cloudflare_date=Date: Sat, 21 Nov 2026 20:44:58 GMT

--- replay-watch-164.log ---
tong_dong=57
kinds={'REPLAY-WATCH-164-START': 1, 'MONITOR': 1, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=52
first=2026-11-21 17:40:59+00:00
last=2026-11-21 18:06:41+00:00
gaps={31.0: 12, 30.0: 39}
md5_set=['15a27d93', '327e8607', '5986e09e', '5bab37e4', '6580e29a', '6bee2880', '91bcc1cb', '9e2f5fe3', 'a5268445', 'ad45aba7', 'b07e4c5c', 'ba79695f', 'e1d35bee', 'f7336062', 'fcbbf759']
lines_set=['1156', '1180', '1220', '1268', '1375', '1498', '1545', '2', '200', '345', '39', '480', '566', '729', '868']
boot_set=['f1d4ce1a']
mtime_log=2026-11-21 18:06:41.931694233 +0000
dong_dau=REPLAY-WATCH-164-START 2026-11-21T17:40:59Z pid=5451 boot=f1d4ce1a btime=2026-11-21 17:33:27Z end=2026-11-21T20:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=f7336062 init_mtime=17:35:44Z cache=178 lists=3 gst_sys=0
dong_cuoi=2026-11-21T18:06:41Z boot=f1d4ce1a poll dpkg_lines=1545 md5=b07e4c5c apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39

--- replay-watch-165.log ---
tong_dong=8
kinds={'REPLAY-WATCH-165-START': 1, 'MONITOR': 1, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=3
first=2026-11-21 20:43:49+00:00
last=2026-11-21 20:44:50+00:00
gaps={31.0: 1, 30.0: 1}
md5_set=['b9d79ebc']
lines_set=['1545']
boot_set=['9a1a9319']
mtime_log=2026-11-21 20:44:50.912087020 +0000
dong_dau=REPLAY-WATCH-165-START 2026-11-21T20:43:49Z pid=28592 boot=9a1a9319 btime=2026-11-21 20:09:31Z end=2026-11-21T23:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=b9d79ebc init_mtime=20:12:18Z cache=178 lists=37 gst_sys=269
dong_cuoi=2026-11-21T20:44:50Z boot=9a1a9319 poll dpkg_lines=1545 md5=b9d79ebc apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37

--- 2c. POSTBOOT_PASS theo boot ---
  #9a1a9319: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS']
  #0c8a94aa: (khong co file co nao chua)
  #f1d4ce1a: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS-f1d4ce1a', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS']
  #edb2acdb: (khong co file co nao chua)
  #1c1cf10c: ['/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/POSTBOOT_PASS-1c1cf10c', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/POSTBOOT_PASS', '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t5/POSTBOOT_PASS-f1d4ce1a']
  round165-t5/POSTBOOT_PASS: CO
  round164-t5/POSTBOOT_PASS: CO
  round163-t5/POSTBOOT_PASS: CO
  round165-t5/POSTBOOT_PASS-0c8a94aa: KHONG CO
  round164-t5/POSTBOOT_PASS-0c8a94aa: KHONG CO
  round164-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-94d22520: KHONG CO

--- 3. round164-t5/POSTBOOT_PASS (#67, xac minh lai) ---
mtime=2026-11-21 17:54:38.343694319 +0000
boot f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f (btime 2026-11-21 17:33:27Z; watcher-164) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T17:54:38Z; POSTBOOT_PASS moi ghi 2026-11-21T17:54:38Z poll=0 (replay-day-du); co cu 1c1cf10c luu POSTBOOT_PASS-1c1cf10c

--- 3b. round163-t5/POSTBOOT_PASS (#65) ---
mtime=2026-11-21 14:45:05.030628216 +0000
boot 1c1cf10c-0528-4cb7-ad36-1c11ad005617 (btime 2026-11-21 14:34:57Z; watcher-163) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T14:45:04Z; POSTBOOT_PASS moi ghi 2026-11-21T14:45:05Z poll=0 (replay-day-du); co cu d9a8d1ce luu POSTBOOT_PASS-d9a8d1ce

--- 3c. POSTBOOT_PASS #69 (round165-t5) ---
mtime=2026-11-21 20:43:50.771087483 +0000
boot 9a1a9319-3786-4add-8ffa-c51a1027946e (btime 2026-11-21 20:09:31Z; watcher-165) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T20:43:50Z; POSTBOOT_PASS moi ghi 2026-11-21T20:43:50Z poll=0 (replay-day-du); co cu f1d4ce1a luu POSTBOOT_PASS-f1d4ce1a

--- 3d. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20 11:39:47.272154981 +0000

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=b9d79ebcef551ff25eea540d79f65dc1 mtime=2026-11-21 20:12:18.768308819 +0000
dpkg_dong_dau=2026-11-21 20:10:06 startup packages configure
dpkg_dong_cuoi=2026-11-21 20:12:18 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
cache_deb=178
lists_entries=37
lists_files=auxfiles lock mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_InRelease mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_main_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_main_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_multiverse_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_multiverse_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_universe_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_universe_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_InRelease mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_main_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_main_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_multiverse_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_multiverse_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_restricted_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_restricted_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_universe_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-security_universe_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_InRelease mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_main_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_main_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_multiverse_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_multiverse_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_restricted_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_restricted_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_universe_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble-updates_universe_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble_InRelease mirror.cogentco.com_pub_linux_ubuntu_dists_noble_main_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble_main_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble_multiverse_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble_multiverse_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble_restricted_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble_restricted_i18n_Translation-en mirror.cogentco.com_pub_linux_ubuntu_dists_noble_universe_binary-amd64_Packages mirror.cogentco.com_pub_linux_ubuntu_dists_noble_universe_i18n_Translation-en partial
gst_sys_files=269
apt_procs=
watcher165=28592 bash replay-watch-165.sh
watcher164_kill0=DEAD

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
ENOSPC_dong=17
journal_dong=167

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          491260 kB
MemAvailable:    2347572 kB
loadavg=6.67 3.09 1.48 8/550 31138

--- 8. systemd user manager ---
user_at_0=inactive
logind=inactive
dbus=inactive
linger_dir=KHONG CO
run_user_0=KHONG CO

--- 9. Co round165 .done ---
  round165-t0.done (2026-11-21 20:44:32.749087160 +0000)

--- 10. X11 ---
total 0
drwxrwxrwt  2 root root  60 Nov 21 20:42 .
drwxrwxrwt 16 root root 600 Nov 21 20:45 ..
srwxrwxrwx  1 root root   0 Nov 21 20:42 X193
xvfb_procs=12972 /bin/bash --norc --noprofile -c umask 0007; HF=~/workspace/goals/capcut-clone-video-editor/hidden_files; W5=$HF/round165-t4 cat > $W5/preflight-165.txt <<'EOF' PRE-FLIGHT T4-165 (quyet (t) dot 158 + bo sung F-164-T4-1) — 2026-11-21T20:40Z Boot mo: 9a1a9319 (#69 ung vien, btime 1795291771 = 20:09:31Z, uptime ~31m luc mo) Han: co ~23:00Z, cung 23:30Z; poller cat 22:30Z (epoch 1795300200 — da kiem) SETUP — PASS: - b.json md5 078938cf (khop 156-164); probe md5 4291e539 (khop 148-164) - vite.t4-temp.config.mjs md5 e3e874e1 (khop); tree-md5.txt 530e10a7 == preview.tsx hien tai - 10/10 analyzer analyze-t4-*.py co mat; vcut-webkit-postboot-check.sh + vcut-vite-lock-v2.sh co mat - bash -n OK 4 script T4; python3 -m py_compile OK 12+ file py - playwright-core .../scratch-round63-r4/node_modules/playwright-core/index.mjs co mat - media stripes-nonperiodic.mp4 co mat (140828 B) - Lock + ngan sach trong: khong vite.lock, khong attempt-done-* trong round165-t4 - X11: /tmp/.X11-unix/ TRONG; 0 Xvfb COPY-FORWARD 164 -> 165 (F-164-T4-1 — BAT BUOC, da kiem TRUOC khi mo poller): - W=round165-t4 o ca 4 script (poll-wait/run-attempt/inner/check-classb) - grep round163/round164 trong t4-attempt-inner.sh + check-classb-t4.sh = 0 hit - grep round16[0-9] trong MOI script lam viec: chi con round165 - glob nhieu cheo inner.sh: round164-* -> round165-* - T5FLAG chinh round165-t5/ + fallback round164-t5/ (da sua tu round163-t5) - Deadline poller 19:30Z -> 22:30Z; han co/cung trong comment 20:00/20:30Z -> 23:00/23:30Z - Freeze check: round164-t4 con 0 file mtime >= 2026-11-21 20:35:51Z (gio mo dot 165)   + round163-t4 cung 0 file mtime >= gio mo - Helper distinct-seq back-test TRUOC LIVE: chay helper 165 tren stall+c2coverage   attempt2-0c8a94aa dot 164 voi so as-of-164 -> 71/74 distinct, 0 seq moi, so goc KHONG doi   (distinct-seq-165-backtest164-proposed.json; occ 78/86 la cong lap lai du lieu cu — nhu du kien) - Snapshot 3 script vao repo apps/web/scripts/ (md5 khop ban lam viec):   poll-wait-t4-165.sh 44bf1afa, run-attempt-165.sh a800d0b4, distinct-seq-165.py e5642337 GATE0 LUC MO — DAT QUA DU PHONG T4-CHECK-ONLY (khong phai loi setup): - Co T5-165 CHUA CO (chua co thu muc round165-t5; T5-165 so huu); co T5-164 chi ghi   boot f1d4ce1a (#67), mtime cu < btime 20:09:31Z — KHONG tinh cho boot moi - postboot check-only chay tay exit 0 (GST 269/269, apt 11/11, dpkg 1545 dong day bo)   — replay tu nhien tren boot #69 DA XONG luc mo (boot+~31m); xem preflight-postboot-165.log - Test poll (POLL_TEST=1): exit 7 dung thiet ke — poll #1 RAM 974 MB (<1024), load1 1.35/load5 0.81,   gate0=T4-check-only(pb_age=0), tree YES, blockers 0, apt 0, dpkg 1545 — cua dong vi RAM - RAM hien tai ~967-974 MB avail: gate A dong; poller se doi cua so RAM>=1024 SO DISTINCT-SEQ as-of 164 (da kiem lai tu ledger goc): 71/74 distinct, occ 76/84, non-DAT [283, 364, 498] CONG DON as-of 164 (29 luot hop le): P1 109/112, P2 103/103, P3-A1 93/112, P3' 76/84 = 71/74, P7 63/63 EOF cat $W5/preflight-165.txt | head -8 echo "== start poller ==" cd $W5 && nohup bash $W5/poll-wait-t4-165.sh > $W5/poll-t4.nohup.log 2>&1 & sleep 50; echo "--- poll log after ~50s ---"; tail -5 $W5/poll-t4.log 2>/dev/null; ps aux | grep poll-wait | grep -v grep | awk '{print $2, $11, $12, $13}'

=== HET PHU LUC T5-165 2026-11-21T20:44:56Z ===
WROTE t5-stats-165-output.txt
```

## Phụ lục B. Kiểm chứng độc lập thêm của T5-165 (script một lần, không gõ tay)

**B.1 Tính đều poll watcher-164 (xem §4.2):**
52 poll, 17:40:59Z → 18:06:41Z; khoảng giữa hai poll liên tiếp:
30 s ×39, 31 s ×12 — đều, 0 khoảng trống. Poll cuối là poll bình
thường (dpkg 1.545 md5 b07e4c5c, 0 proc). Không có dấu hiệu slew
đồng hồ hay suy giảm trước khi chết.

**B.2 Tính đều poll watcher-165 (tới kiểm cuối 20:49:11Z):**
11 poll tới 20:48:52Z; khoảng: 30 s ×7, 31 s ×3 — đều,
0 khoảng trống. Watcher sống và poll đúng cadence (pid 28592,
kill -0 OK).

**B.3 Các khoảng thời gian (tính lại từ endpoint thô bằng script
python — không cộng/trừ lũy kế bằng tay):**
gap #67→#68 (btime−btime) 1.983 s (33m03s); gap #68→#69
(btime−btime) 7.381 s (2h03m01s); #67 sống 1.983 s; #68 sống
7.381 s (theo btime); watcher-164 poll cuối − btime #68: 11 s
(poll cuối SAU btime); reboot #68 thật (khung #67): (18:06:41Z,
18:07:11Z] (cửa cứng, rộng 30 s) / (18:06:41Z, ~18:07:02Z]
(thu hẹp nhờ T7 sleep #2); requeue 18:07:17.131Z − btime #68:
47,131 s (theo btime); requeue − giới hạn reboot thật: offset
thật ∈ [15 s, 36 s] (cửa cứng [6 s, 36 s]); khoảng không-watcher
18:06:41Z → 20:43:49Z: 9.428 s (2h37m08s); btime #69 → giờ mở đợt
20:35:51Z: 1.580 s (26m20s); btime #69 → dpkg đầu 20:10:06Z:
35 s; btime #69 → dpkg xong 20:12:18Z: 167 s (2m47s); hoạt động
dpkg #69: 132 s (2m12s); btime #69 → cờ #69 20:43:50Z: 2.059 s
(34m19s); T5 mở thực tế ~20:38:52Z → cờ #69: 298 s (4m58s);
watcher-165 START 20:43:49Z → cờ #69: 1 s; dpkg xong 20:12:18Z →
cờ #69: 1.892 s (31m32s); marker sống #49–#69 = 21 reboot
(69−49+1); T0-165 đếm độc lập KHỚP 21.

**B.4 Cách đếm dpkg 1.545 dòng (xem §3.1):** theo action field
(python Counter trên cột $3): 1.040 status + 178 configure + 169
install + 106 startup + 43 trigproc + 9 upgrade = 1.545.
`grep -c ' install '` = 169; `grep -c ' upgrade '` = 9;
`grep -c ' configure '` = 178. Các số TRÙNG KHỚP header postboot
Dot 151 (169/9/178, gói cuối gstreamer1.0-tools) và số dòng cuối
#64/#65/#67 (1.545 dòng) — cùng bộ gói, khác timestamp (md5 khác:
b9d79ebc vs b07e4c5c vs aeb0886e vs 335dc3f2 vs 51d12c3d).

**B.5 Uptime khớp btime trên #69 (xem §4.1 mục 1):** uptime
1.890,90 s lúc 20:41:02Z ⇒ boot lúc 20:09:31,1Z; btime
20:09:31Z — chênh 0,1 s. `uptime -s` = 20:09:31Z, KHỚP btime
từng giây. Đây là kiểm đã bác H2 ở #62 (GAP §90); ở #69 kiểm
này ĐẬU nên btime LÀ giờ thật.

Log postboot độc lập của T5 (`t5-postboot-independent-9a1a9319.log`,
20:44:17Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.10):

```
[postboot 2026-11-21 20:09:31] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 20:09:31] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 20:09:31] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 20:09:31] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 20:09:31] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 20:09:31] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 20:09:31] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 20:09:31)
```

Log postboot poll0 của watcher (`t5-postboot-poll0-9a1a9319.log`,
20:43:50Z, exit 0 — cùng nội dung check như log độc lập; header
log còn ghi Dot 151, xem §7.10).
