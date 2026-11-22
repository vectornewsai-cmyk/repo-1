# PHASE9_ROUND164_T5_INFRA_LIMITS — POSTBOOT_PASS #66 CHƯA CÓ (BOOT THỨ 8 KHÔNG CỜ) + POSTBOOT_PASS #67 ĐÃ CÓ 17:54:38Z (REPLAY-DAY-DU, BOOT+21M11S) + WATCHER-164 CHẠY PID 5451; MARKER SỐNG QUA 19 REBOOT; X11: 3 SOCKET MỚI X193/X194/X195 LÚC 17:47:27Z, 0 XVFB

> Luồng T5, đợt 164, lượt cron 00:35 +07 22/11/2026 (mở
> 17:35:51Z 21/11/2026; T5 mở thực tế ~17:39Z; hạn cờ ~20:00Z, hạn cứng
> đóng 20:30Z). Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có
> `.git` local — KHÔNG push). **BOOT HIỆN TẠI #67 (ỨNG VIÊN — chờ
> parent xác nhận số hiệu, theo quy tắc đứng T0 ghi ứng viên, parent
> quyết) f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f** (btime **17:33:27Z** —
> /proc/stat btime 1795282407; **btime LÀ GIỜ THẬT** — xem §4: uptime
> khớp btime 0,09 s, /proc/1 +14 s, journal +14 s, Cloudflare +1 s;
> chờ T0-164 xác minh độc lập số hiệu).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (n) đợt 163,
> ghi nhận lại lần thứ mười một — xem §2).**
> **POSTBOOT_PASS cho #66 CHƯA CÓ lúc T5 mở** (không file
> POSTBOOT_PASS* nào chứa edb2acdb — xem §3.2; #66 là boot thứ 8
> không có cờ). **POSTBOOT_PASS cho #67 ĐÃ GHI 17:54:38Z (boot+21m11s,
> mode replay-day-du, poll=0)** — replay tự nhiên CHẠY ĐẦY ĐỦ trên
> #67, khởi động boot+137s (hoạt động dpkg đầu 17:35:44Z); kiểm chứng
> độc lập: postboot exit 0 lúc 17:55:51Z, 11/11 gói + 5/5 lib (§3.1).
> **Watcher-163 pid 25133 CHẾT THEO REBOOT #66 — ĐÃ XÁC MINH ĐỘC LẬP
> (poll cuối 16:06:54Z, 9 s sau btime #66; 164 poll đều; parent quyết
> (x) đợt 163 GHI NHẬN). Watcher-164 KHỞI ĐỘNG TAY 17:40:59Z, pid
> 5451** (§3). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 19 REBOOT LIÊN TIẾP
> #49–#67** (§2.1; +2 so với đợt 163 vì #66 và #67 đã qua).
> **X11: TRỐNG lúc T5 mở (17:39Z); 3 socket MỚI X193/X194/X195 xuất
> hiện lúc 17:47:27Z, 0 process Xvfb** — socket mồ côi, chủ tạo chưa
> xác định, dọn thuộc T8-164 (§6).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc
> T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403 chờ user).
> TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 21/11/2026 — mọi giờ là giờ thật)

| Thời điểm | Sự kiện |
|---|---|
| 11:15:18Z | **Reboot #64, boot d9a8d1ce** (btime — T5-162/T0-162 xác minh) |
| 11:40:00Z | Watcher-162 START bằng tay, pid 18801; **POSTBOOT_PASS #64 ghi** (replay-day-du, poll=0) |
| 14:34:57Z | **Reboot #65, boot 1c1cf10c** (btime — parent quyết (d) đợt 163 XÁC NHẬN) |
| 14:45:03Z | Watcher-163 START bằng tay, pid 25133; **POSTBOOT_PASS #65 ghi 14:45:05Z** (replay-day-du, poll=0) |
| 16:06:45Z | **Reboot #66, boot edb2acdb** (btime — parent quyết (e) đợt 163 XÁC NHẬN; ứng viên DƯƠNG (m), đối chiếu độc lập thuộc T2-164) |
| 16:06:54Z | **Poll cuối watcher-163** (9 s sau btime #66 — poll cuối đua với reboot rồi chết) |
| ~17:14–17:16Z | T10-163 đóng sổ (theo aggregate 163 §10.1/§12.3(a)) |
| 17:33:27Z | **Reboot #67 (ứng viên), boot f1d4ce1a** — btime 1795282407; #66 sống 5.202 s (1h26m42s); reboot xảy ra ~17m27s SAU khi T10-163 đóng sổ (~17:16Z) và 144 s TRƯỚC giờ mở đợt 164 — claim T10-163 ĐỨNG (cùng mẫu #65) |
| 17:33:41Z | Journal first entry (btime+14 s); /proc/1 mtime 17:33:40,9Z (btime+14 s) |
| 17:35:44Z | **Hoạt động dpkg ĐẦU trên #67 (boot+137s)** — 7 s TRƯỚC giờ mở đợt |
| 17:35:51Z | Lượt cron đợt 164 mở (giờ host) |
| ~17:39Z | T5-164 mở: boot f1d4ce1a, **không watcher nào chạy**; không POSTBOOT_PASS cho #66; replay ĐANG CHẠY (apt-get update pid 810) |
| 17:40:59Z | **Watcher-164 START (bằng tay, setsid nohup), pid 5451, boot f1d4ce1a** — poll đầu thấy dpkg 2 dòng, apt=[810] (replay đang chạy) |
| 17:47:27Z | 3 socket X11 mới X193/X194/X195 xuất hiện (0 Xvfb) |
| 17:48:34Z | Poll watcher-164 đầu thấy dpkg tăng: 345 dòng (apt-get update đã xong trong (17:46:33Z, 17:48:34Z]) |
| 17:53:45Z | **Replay xong** (dpkg cuối, gstreamer1.0-tools installed — boot+20m18s) |
| 17:54:37Z | REPLAY_DONE (poll watcher-164) → postboot poll0 exit 0 |
| 17:54:38Z | **FLAG-WRITTEN #67 (boot+21m11s, replay-day-du, poll=0)** |
| 17:55:51Z | Postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib |
| 17:56:30Z | Kiểm cuối trước khi viết LIMITS này: boot vẫn f1d4ce1a, watcher-164 poll đều (30+ poll), cờ #67 còn, dpkg md5 b07e4c5c không đổi |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (n) đợt 163 (ghi nhận hướng (3) vẫn đứng lần thứ 10) +
quyết (e) đợt 154 + các lần ghi nhận (q) đợt 155, (o) đợt 156–159,
(n) đợt 160–162: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở,
T5 khởi động lại bằng tay. T5-164 kiểm tra lại nhanh `systemctl
is-active` (§A.8): user@0/logind/dbus vẫn inactive, không linger,
không cron, không /run/user/0 — cell không đổi, kết luận đợt 154–163
giữ nguyên (lần kiểm tra lại thứ mười một liên tiếp). Unit + script ở
`round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 19 REBOOT LIÊN TIẾP #49–#67

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49–#67; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#67 (19 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (17 reboot ở đợt 163 →
  19 reboot đợt này: +2 vì #66 và #67 đã qua). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`) PERSISTENT
  qua rebuild — khẳng định lần thứ mười chín liên tiếp.

## 3. Watcher-164 — chạy bằng tay (quy tắc đứng (3)) + POSTBOOT_PASS #67

- **Trạng thái lúc mở (~17:39Z): KHÔNG watcher nào chạy**
  (`pgrep -af watcher|replay-watch`: chỉ còn lệnh exec của chính T5;
  `kill -0 25133`: chết). Ghi vào
  `watcher-status-at-open.txt`. **Watcher-163 chết theo reboot #66 —
  T5-164 xác minh độc lập từ log gốc** (xem §4.2): 164 poll đều, poll
  cuối 16:06:54Z, 0 END/0 STOP.
- **Khởi động bằng tay 17:40:59Z, pid 5451** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-164-START 2026-11-21T17:40:59Z pid=5451
  boot=f1d4ce1a btime=2026-11-21 17:33:27Z end=2026-11-21T20:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2
  init_md5=f7336062 init_mtime=17:35:44Z cache=178 lists=3 gst_sys=0`
- **Thay đổi so với watcher-163 (3 điểm):**
  1. END = 20:30:00Z 21/11 (hạn cứng đợt 164 theo task); DIR =
     round164-t5, OLD_T5_DIR = round163-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #67 + trạng thái replay ĐANG
     CHẠY lúc khởi động (dpkg 2 dòng, apt-get update pid 810 đang
     chạy, /var/log/apt/ chưa tồn tại, GST chưa có, cache 178,
     lists 3) + dự kiến REPLAY_DONE sau khi replay xong.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round16[34]`/`20:30` + `bash -n` syntax OK
     + assert không có cụm thừa nhận H2 + assert không có
     "NHANH NHAT" — bài học F-163-T5-7) — adapter chạy sạch ngay
     lần đầu, 0 lần sửa.
- **Poll đều đã xác minh:** 30 poll tới 17:55:38Z (17:40:59Z →
  17:55:38Z; khoảng: 30 s ×20, 31 s ×9 — đều, 0 khoảng trống);
  poll 17:56:08Z tiếp tục đều. Lúc 17:56:30Z log 36 dòng: START 1,
  MONITOR 1, poll 31, REPLAY_DONE 1, postboot poll0 1,
  FLAG-WRITTEN 1, 0 NEWBOOT, 0 END, 0 EARLY-REPAIR.
- **EARLY-REPAIR KHÔNG kích hoạt — ĐÚNG THIẾT KẾ (2 lý do độc lập):**
  (a) dpkg đóng băng 17:35:44Z → ~17:47Z trong lúc apt-get update
  pid 810 ĐANG CHẠY — điều kiện repair đòi 0 proc nên không bao giờ
  thỏa; (b) tới cổng boot+15' (17:48:27Z) dpkg đã tăng (345 dòng lúc
  poll 17:48:34Z) nên điều kiện dòng <100 cũng không thỏa. Guard file
  `repaired-f1d4ce1a` KHÔNG tồn tại (chưa repair — đúng, vì không cần).

### 3.1 POSTBOOT_PASS cho #67 — CÓ QUA REPLAY-DAY-DU (KHÔNG CẦN REPAIR)

- **Replay tự nhiên trên #67: CHẠY ĐẦY ĐỦ, NHƯNG CHẬM HƠN #65.** Bằng
  chứng: hoạt động dpkg đầu 17:35:44Z (boot+137s); **apt-get update
  chạy 649–770 s** (còn chạy lúc poll 17:46:33Z, đã xong lúc poll
  17:48:34Z — khoảng chặn từ 2 poll liên tiếp, không đo chính xác
  hơn được); cài đặt 17:47Z → 17:53:45Z; dpkg 2 →
  **1.545 dòng** (md5 b07e4c5c, ổn định từ 17:53:45Z tới kiểm cuối
  17:56:30Z — 0 proc apt/dpkg); lists 39; cache 178 .deb; GST hệ
  thống 269 file (thư mục thật apt, như #64/#65); `/var/log/apt/`
  TỒN TẠI (được tạo trong lúc replay — lúc mở chưa có).
- **Hoạt động dpkg đầu boot+137s (2m17s)** — chậm hơn #65 (+47s) và
  #59 (+35s), nhanh hơn #64 (+20m22s) và #62 (+22m10s thật). **T5
  KHÔNG xêp hạng "nhanh nhất/nhì" cho #67** (bài học F-163-T5-7 —
  chỉ ghi số liệu thực đo; thứ hạng đầy đủ thuộc T0/T10 khi đối
  chiếu chuỗi). Hoạt động dpkg kéo dài 1.081 s (18m01s:
  17:35:44Z → 17:53:45Z), phần lớn là apt-get update chậm (649–770 s)
  — khác #65 (toàn bộ replay 185 s). T5 ghi nhận, không suy đoán
  nguyên nhân mạng (không có số đo băng thông).
  Xuất hiện 7 s TRƯỚC giờ mở đợt (17:35:44Z vs 17:35:51Z) —
  cùng mẫu #61 (12 s), #62 (11 s), #64 (11 s), #65 (7 s) — lần thứ
  năm liên tiếp replay khởi động vài giây trước giờ mở đợt (ghi nhận
  theo T5-161/T0-162; T5-164 không suy đoán cơ chế).
- **dpkg 1.545 dòng — breakdown TRÙNG KHỚP #64/#65 và Dot 151:**
  breakdown theo action field (python, §A.4): 1.040 status +
  178 configure + 169 install + 106 startup + 43 trigproc +
  9 upgrade = 1.545. Các số 169 install / 9 upgrade / 178
  configure TRÙNG KHỚP header postboot Dot 151 ("dpkg 1545 dong
  / 169 install / 9 upgrade / 178 configure, goi cuoi
  gstreamer1.0-tools") và số dòng cuối #64/#65 (1.545 dòng,
  md5 335dc3f2 / aeb0886e). md5 khác nhau (b07e4c5c vs aeb0886e vs
  335dc3f2 vs 3411a9cc vs 51d12c3d) vì timestamp trong từng dòng
  dpkg.log khác nhau — cùng bộ gói, khác thời gian chạy. Gói cuối
  cùng: gstreamer1.0-tools 17:53:45Z (giống Dot 151/#64/#65). Cache
  APT 178 .deb — trùng số Dot 151 ("cache APT SONG 178 .deb/156M");
  **lists 39 — TRÙNG #65 (39), khác #64 (37)** (ghi nhận, không suy
  đoán nguyên nhân; watcher ghi lists=39 ổn định từ khi replay tạo
  xong lists).
- **REPLAY_DONE lúc 17:54:37Z:** watcher poll thấy dpkg ổn định
  1.545 dòng, 0 proc → postboot poll0 **exit=0** → ghi cờ ngay.
  Đây là đường chuẩn (cùng mẫu #61/#64/#65 poll=0), không phải đường
  tắt: dpkg đã đóng băng đủ lâu + postboot PASS thật.
- **FLAG-WRITTEN 17:54:38Z** (`round164-t5/POSTBOOT_PASS`):
  `boot f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f (btime 2026-11-21
  17:33:27Z; watcher-164) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T17:54:38Z; POSTBOOT_PASS moi ghi 2026-11-21T17:54:38Z
  poll=0 (replay-day-du); co cu 1c1cf10c luu POSTBOOT_PASS-1c1cf10c`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-1c1cf10c` đã đối chiếu bằng
  `diff` — **KHỚP cờ #65 gốc** (round163-t5).
- **Cờ lúc 17:54:38Z = boot+21m11s (1.271 s).** Chậm hơn #65
  (boot+10m08s) 11m03s — do apt-get update chậm, không do watcher
  (watcher khởi động boot+7m32s, cờ chỉ đợi replay xong + 1 poll).
  Cửa sổ hở của hướng (3) ở #67: cờ có **13m39s sau khi T5 mở thực
  tế (~17:41Z)** và 18m47s sau giờ mở đợt — nhưng khoảng
  KHÔNG-watcher 1h34m05s trước đó (do watcher-163 chết theo reboot
  #66, xem §4.2) là lỗ hổng riêng của đợt này. **Không thiệt hại đo
  được:** cờ có trước khi T4/T8-164 cần gate0 (T5 đóng cờ trước hạn
  cờ ~20:00Z hơn 2 giờ; các luồng khác đọc cờ sau 17:54:38Z đều thấy
  cờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** postboot
  độc lập (`t5-postboot-independent-f1d4ce1a.log`, exit 0,
  17:55:51Z): wrapper PASS, libs PASS đủ 5, GST PASS (thư mục
  thật apt, 269 = debroot 269, đủ isomp4 + libav), apt PASS đủ 11
  package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ** (stats §5 — lưu ý: stats lúc 17:42:06Z
  ghi 11 gói + 5 lib đều KHÔNG-CO vì replay chưa chạy xong lúc đó;
  đó là trạng thái giữa replay, không phải lỗi — đã kiểm lại PASS
  sau khi replay xong, xem §9 F-164-T5-4).
- **Phối hợp T4/T8-164:** poller T4-164 + harness T8-164 đọc
  `round164-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  17:54:38Z, TRƯỚC khi các luồng khác cần gate0.

### 3.2 POSTBOOT_PASS cho #66 — CHƯA CÓ (XÁC MINH LÚC MỞ, KHÔNG BÙ ĐƯỢC)

- **Không file POSTBOOT_PASS* nào chứa edb2acdb** (kiểm lúc 17:42:06Z
  bằng script `t5-stats-164.py` §2c: glob toàn bộ `POSTBOOT_PASS*`
  dưới `hidden_files/` + kiểm trực tiếp từng đường dẫn
  `round164-t5/POSTBOOT_PASS-edb2acdb` và
  `round163-t5/POSTBOOT_PASS-edb2acdb` — đều KHÔNG CO; xem §A).
  **#66 là boot thứ 8 không có cờ** (#51, #53, #54, #55, #57, #60,
  #63, #66). T5-164 KHÔNG ghi cờ hồi tố cho #66 (boot đã chết; cờ
  chỉ chứng nhận phép đo trực tiếp trên boot sống — cùng quy tắc
  đã áp cho #63, xem LIMITS T5-163 §8).
- **POSTBOOT_PASS #65 ĐÃ XÁC MINH LẠI trên đĩa** (round163-t5, mtime
  14:45:05Z, nội dung đọc trực tiếp lúc 17:42Z — KHỚP từng chữ với
  LIMITS T5-163 §A.3). **POSTBOOT_PASS #64 CÒN** (round162-t5, mtime
  11:40:00Z — KHỚP LIMITS T5-163 §3.2). **POSTBOOT_PASS #63 KHÔNG
  CÓ** (không file nào chứa 94d22520 — kiểm lại đợt này, §A.2c).

## 4. Boot #66/#67 + đồng hồ — #67 KHÔNG NGHỊCH LÝ (SƠ BỘ); WATCHER-163 CHẾT THEO #66 (ĐÃ XÁC MINH)

### 4.1 Bằng chứng quyết định cho #67 (bài học F-161-T5-2 đã áp dụng)

1. **Uptime khớp btime trên #67 (T5 đo trực tiếp):** uptime
   518,91 s lúc 17:42:06Z ⇒ boot lúc 17:33:27,09Z; btime
   17:33:27Z — **chênh 0,09 s**. `uptime -s` = 17:33:27Z, KHỚP
   btime từng giây. Đây chính là kiểm đã bác H2 ở #62 (GAP §90):
   ở #67 kiểm này ĐẬU, nên **btime #67 LÀ giờ thật, không cần
   khung thứ hai** (chờ T0-164 xác minh độc lập số hiệu #67).
2. **/proc/1 và journal khớp btime +14 s (mẫu bình thường):**
   /proc/1 mtime 17:33:40,9Z; journal first entry 17:33:41Z
   (epoch 1795282421); journal_boots chỉ 1 boot (#67).
3. **Đồng hồ mới ĐÚNG lúc đo (T5 đo 3 lần):** 17:39:56Z local
   vs Cloudflare 17:39:57 GMT (+1 s); 17:42:06Z local vs
   Cloudflare 17:42:07 GMT (+1 s); 17:55:51Z local vs
   Cloudflare 17:55:52 GMT (+1 s). Cả ba lần đều +1 s — ổn định,
   không drift trong phiên.
4. **T0-164 xác minh độc lập số hiệu #67 — CHƯA CÓ lúc T5 đóng cờ**
   (chưa có round164-t0.done trên đĩa lúc stats 17:42:06Z). T5
   KHÔNG tự truy vấn scheduler DB; đóng góp độc lập của T5 cho kết
   luận "không nghịch lý" là các mục (1)–(3) + tính đều poll
   watcher-163 (§4.2), không phụ thuộc DB.
5. **Reboot #67 xảy ra SAU khi T10-163 đóng sổ** (~17:16Z theo
   aggregate 163 §12.3(a) → btime 17:33:27Z, sau ~17m27s) và 144 s
   TRƯỚC giờ mở đợt 164 (17:35:51Z) — claim "không reboot mới
   trong lúc T10-163 đóng sổ" của aggregate 163 **ĐỨNG** (cùng mẫu
   #65 sau T10-162). **(m) #67: T5 KHÔNG phán** — thuộc T7-164
   (requeue/rewrite) + T2-164 (đối chiếu độc lập); T5 chỉ ghi btime
   và mốc: btime #67 = 17:33:27Z, hạn run 163 là 17:35:51Z (btime
   trước hạn 144 s) — số liệu thô cho T7/T2, không kết luận.

### 4.2 Watcher-163 chết theo reboot #66 — ĐÃ XÁC MINH ĐỘC LẬP (không còn là phát hiện của riêng T10)

- **Sự kiện (đo lại độc lập từ log gốc — Phụ lục B):** 164 poll,
  14:45:03Z → 16:06:54Z, khoảng giữa hai poll liên tiếp: 30 s
  ×143, 31 s ×19, **32 s ×1** (khoảng đầu — postboot trong
  iteration đầu, xem F-163-T5-6) — đều, 0 khoảng trống. Poll cuối
  16:06:54Z là poll bình thường (dpkg 1.545 ổn định, md5 aeb0886e,
  0 proc). Log mtime cuối 16:06:54Z. **KHÔNG có dòng END** (hạn
  watcher-163 là 17:30:00Z, chưa tới), **KHÔNG có dòng NEWBOOT**,
  **KHÔNG có file watcher-stop** trong round163-t5/. pid 25133 chết
  (`kill -0`: No such process).
- **Poll cuối 9 s SAU btime #66 (16:06:45Z)** — poll cuối đua với
  reboot rồi chết; watcher KHÔNG sống qua reboot. **Khác
  watcher-162 chết sớm không rõ nguyên nhân** (trước btime #65
  9m37s): watcher-163 chết ĐÚNG theo reboot #66 — nguyên nhân xác
  định được. T10-163 đã phát hiện, parent quyết (x) đợt 163 GHI
  NHẬN; T5-164 xác minh độc lập từ log gốc và KHỚP.
- **Hậu quả đo được:** KHÔNG có watcher trong 1h34m05s
  (16:06:54Z → 17:40:59Z, 5.645 s), gồm cả thời điểm reboot #67 —
  reboot được phát hiện hậu kiểm qua btime (T0/T5), không có dòng
  NEWBOOT nào trong log watcher; NHƯNG không mất đo nào: replay
  #67 chạy đầy đủ tự nhiên, cờ #67 có 17:54:38Z (trước khi
  T4/T8-164 cần gate0), POSTBOOT_PASS #65/#64 còn nguyên trên đĩa,
  marker còn nguyên. **Khoảng không-watcher này DÀI NHẤT từ trước
  tới nay** (vượt 19m43s của đợt 163 — vì reboot #67 rơi vào giữa
  hai đợt, sau khi T10-163 đóng sổ; không có phiên T5 nào trong
  khoảng đó theo thiết kế vòng lặp).

### 4.3 Boot #66 (edb2acdb, btime 16:06:45Z): #66 SỐNG 5.202 S

- #66 sống **5.202 s (1h26m42s)** (16:06:45Z → 17:33:27Z).
  Ngắn hơn #65 (5.508 s) một chút; dài hơn #63 (2.676 s).
  Gap #66→#67 = 5.202 s chưa đưa vào CERT/FULL — chờ #95?/#96?/#97?
  đóng (giao T2-164 làm cơ sở FULL112/FULL113).

### 4.4 Tuổi boot theo khung thật duy nhất (không trừ lẫn lộn)

| Mốc | Giờ (thật) | Tuổi boot #67 |
|---|---|---|
| btime #67 | 17:33:27Z | — |
| Hoạt động dpkg đầu | 17:35:44Z | boot+137s |
| Watcher-164 START | 17:40:59Z | boot+7m32s |
| Replay xong (dpkg cuối) | 17:53:45Z | boot+20m18s |
| FLAG-WRITTEN #67 | 17:54:38Z | boot+21m11s |
| Postboot độc lập T5 | 17:55:51Z | boot+22m24s |
| Stats script T5 | 17:42:06Z | boot+8m39s |

- Tuổi boot #66: **5.202 s (1h26m42s)** (16:06:45Z → 17:33:27Z).
- Reboot #67 xảy ra GIỮA hai đợt theo giờ thật (sau T10-163 đóng
  ~17:16Z khoảng 17 phút, trước đợt 164 mở 17:35:51Z 144 s) — không
  phá lượt đo nào trong đợt 163 (run 163 đã hết hạn 17:35:51Z;
  kết cục run 163 thuộc T7-164).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 164

- T0-164 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-164 chưa
  có cờ .done lúc T5 đóng cờ — T0 kiểm sau, T10 đối chiếu.
- **Cửa sổ hở hướng (3) ở #67: 21m11s từ boot tới cờ** — NHƯNG
  chỉ **13m39s từ lúc T5 mở tới cờ** (replay chậm do apt-get update
  649–770 s; cờ chỉ đợi replay xong + 1 poll). Đây là khoảng hở đã
  biết của hướng (3): cờ chỉ có khi có phiên T5 sau reboot +
  replay/repair xong. Khoảng KHÔNG-watcher 1h34m05s (do watcher-163
  chết theo reboot #66 — §4.2) là lỗ hổng riêng của đợt này:
  reboot #67 rơi vào khoảng không có watcher — #67 vẫn BẮT ĐƯỢC cờ
  nhờ replay tự nhiên chạy đầy đủ + T5-164 khởi động kịp (khác #63
  lọt hoàn toàn vì không có phiên T5 nào sau reboot, và khác #66 —
  cũng không có phiên T5 nào sau reboot #66 trước khi #67 tới).
- **Watcher-164 tiếp tục giám sát tới 20:30:00Z**; nếu có reboot
  #68 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-165 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-164 là chủ):** MemTotal 8.125.908
  kB; MemAvailable **2.291.296 kB @17:42:06Z** (lúc replay đang
  chạy, loadavg 5,32) và **2.720.404 kB @17:56:30Z** (sau replay
  xong); MemFree 265.852 kB @17:42:06Z. loadavg 5,32 @17:42:06Z
  (replay đang chạy — không phải kẹt).
- **ENOSPC journal boot #67:** **18 dòng** lúc 17:55:51Z
  (journal 132 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`); 7 dòng lúc 17:42:06Z (journal 86
  dòng). T9-164 đếm chính thức; T5 chỉ ghi nhận số lúc đo.
  **Lưu ý: `journalctl --boot` ĐỌC ĐƯỢC trên boot #67** (132 dòng)
  — khác T10-163 (trả 0 dòng cho cả hai boot #65/#66 lúc đóng;
  xem aggregate 163 §10.3). T5 không suy đoán vì sao khác (có thể
  do boot mới / journal chưa xoay); ghi nhận để T10-164 đối chiếu.
- **Không reboot mới trong phiên T5** (boot vẫn f1d4ce1a lúc
  kiểm cuối 17:56:30Z — KHÔNG có #68; watcher-164 tiếp tục
  giám sát tới hạn cứng 20:30:00Z).
- **journal_boots chỉ còn 1 boot (#67):** journal của #66
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).
- **X11 — TRỐNG lúc mở, 3 socket MỚI sau đó:**
  `/tmp/.X11-unix/` TRỐNG lúc T5 mở 17:39Z (0 socket, dir
  mtime 17:33 — T0-164 cũng sẽ kiểm). Lúc kiểm cuối 17:56:30Z:
  **3 socket X193/X194/X195, mtime 17:47:27Z** (cả 3 trong
  0,014 s: .631/.638/.645); **0 process Xvfb** (`pgrep` không
  thấy), socket mồ côi. Cùng 3 số display như đợt 160–163 nhưng
  là file MỚI trên boot #67 (không phải socket cũ sống qua reboot
  — /tmp reset theo boot; **lần thứ năm liên tiếp** cùng 3 số
  display — T8-163 ghi lần thứ tư). Chủ tạo chưa xác định (T5
  không đoán — có thể T8/T4-164 khởi Xvfb); **dọn thuộc T8-164**
  theo aggregate 163 §11.13. T5 KHÔNG tự dọn (Xvfb thuộc vòng đời
  harness T8; xóa socket trong lúc T8 có thể đang chạy là can
  thiệp ngoài phạm vi T5).

## 7. Nợ mở chuyển đợt 165 (từ T5-164)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 19 reboot
   #49–#67. T5-165 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #67 — XONG 17:54:38Z** (watcher-164,
   replay-day-du, poll=0; T4/T8-164 phối hợp qua cờ).
   Watcher-164 tiếp tục giám sát tới 20:30:00Z; nếu có reboot
   #68 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-165 kiểm tra log.
4. **POSTBOOT_PASS #66 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 8 không cờ; cùng tiền lệ #51/#53/#54/#55/#57/#60/
   #63). Chỉ thiếu cờ watcher (dữ kiện #66 chỉ còn cờ T7/T10).
   **POSTBOOT_PASS #63 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (boot thứ 7
   không cờ; đã kiểm lại đợt này).
5. **Watcher-163 chết theo reboot #66 — NGUYÊN NHÂN XÁC ĐỊNH
   ĐƯỢC** (xem §4.2; T5-164 xác minh độc lập, KHỚP T10-163).
   Khoảng không-watcher 1h34m05s là DÀI NHẤT từ trước tới nay —
   ghi nhận, không mở giả thuyết mới (khoảng trống nằm giữa hai
   đợt theo thiết kế vòng lặp, không phải lỗi watcher).
6. **Replay khởi động: #59 +35s → #61 +9m50s → #62 +22m10s →
   #64 +20m22s → #65 +47s → #67 +137s (hoạt động dpkg đầu).**
   #67 chậm hơn #65 do apt-get update 649–770 s (toàn bộ replay
   18m01s vs #65 3m05s). Mẫu "vài giây trước giờ mở đợt" giữ
   nguyên 5 đợt liên tiếp (#61: 12 s, #62: 11 s, #64: 11 s,
   #65: 7 s, #67: 7 s).
7. **Cổng boot+15m của (h) không cần dùng ở #67** (replay chạy
   đầy đủ; frozen không bao giờ thỏa cả hai điều kiện cùng lúc —
   apt đang chạy lúc đóng băng, dpkg đã tăng lúc tới cổng).
   Ghi nhận để T10 đánh giá (h): cổng chỉ có ý nghĩa khi replay
   vắng — ở #67 nó không kích hoạt và không cần kích hoạt.
8. **GST trên #67 là THƯ MỤC THẬT apt (269 file)** — như #64/#65.
   Boot sau phải làm lại qua replay/repair (ephemeral theo rebuild).
9. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #67): T5 đợt sau quyết có cập nhật theo Dot hay
   không. Đây là nợ thẩm mỹ trong log header, không ảnh hưởng
   kết quả check.
10. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
    của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
    yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
    quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
    403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
    G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
    theo quyết (g) đợt 143. u2net là fallback chính thức cho
    birefnet.

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này replay #67 chạy đầy đủ
  tự nhiên, cờ có ở boot+21m11s, chỉ 13m39s sau khi T5 mở.
  T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ mười một liên tiếp.
- **Số hiệu #67 vẫn là ứng viên chờ parent xác nhận** (T0-164
  chưa có cờ lúc T5 đóng) — T5 dùng "#67 (ứng viên)" trong
  LIMITS này theo đúng quy tắc đứng.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #66 từ log của
  T7/T10-163** — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #66 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Số đếm marker: T5 giữ 19 reboot (#49–#67)** — chờ T0-164
  đếm độc lập đối chiếu (đợt 163 T0 đếm KHỚP T5 ở 17).
- **Khoảng không-watcher 1h34m05s (16:06:54Z–17:40:59Z) là dài
  nhất từ trước tới nay** — nhưng không mất đo nào (replay #67
  đầy đủ, cờ #67 có trước gate0); T5 không đề xuất thay đổi
  thiết kế vòng lặp (khoảng trống nằm giữa hai đợt theo lịch
  cron, không phải lỗi watcher).

## 9. Sai số của chính T5-164

- **F-164-T5-1 — Exec spawn watcher báo output_drain_timeout
  lúc 17:41:01Z (cùng họ F-163-T5-3/F-162-T5-2):** watcher đã
  spawn thành công (child `bash replay-watch-164.sh` pid 5451 +
  `sleep 30` quan sát được trong báo cáo tiến trình con); T5
  kiểm lại bằng lệnh đọc riêng (log START 17:40:59Z + `kill -0`
  5451) thay vì tin output của exec spawn. Không mất dòng log
  nào — log đầy đủ tới poll 17:56:08Z lúc viết LIMITS.
- **F-164-T5-2 — `t5-stats-164.py` bộ đếm kinds BỎ SÓT dòng START
  của cả hai log watcher** (regex đòi timestamp đứng trước tên
  kind, trong khi dòng START có kind đứng trước timestamp):
  `kinds` trong output §2 thiếu START (MONITOR 1 nhưng không có
  START 1) — log gốc vẫn chứa dòng START (dong_dau xác nhận),
  số poll/gap/md5 không ảnh hưởng. Bài học: regex đếm kinds
  phải chấp nhận cả hai dạng dòng; sửa ở script stats đợt sau.
- **F-164-T5-3 — `t5-stats-164.py` chạy ~90 s (backgrounded sau
  60 s):** do curl Cloudflare + journalctl + ldconfig chậm dưới
  tải replay (loadavg 5,32 lúc chạy); output đầy đủ, không mất
  dữ liệu (script chỉ ghi output ở cuối; lần chạy backgrounded
  vẫn ghi file đầy đủ). Không phải lỗi logic — ghi nhận để T5
  đợt sau đặt timeout rộng hơn khi chạy stats giữa replay.
- **F-164-T5-4 — Stats §5 lúc 17:42:06Z ghi 11 gói + 5 lib đều
  KHÔNG-CO (dễ đọc nhầm thành postboot FAIL):** đó là trạng
  thái GIỮA replay (dpkg mới 2 dòng, chưa cài gì) — không phải
  kết quả check; T5 đã kiểm lại PASS sau khi replay xong
  (watcher poll0 exit 0 lúc 17:54:38Z + postboot độc lập exit 0
  lúc 17:55:51Z, 11/11 gói + 5/5 lib). Bài học: stats chạy giữa
  replay phải ghi rõ mốc "giữa replay" cạnh bảng gói/lib (script
  đợt sau thêm chú thích tự động khi dpkg < 100 dòng).
- **F-164-T5-5 — Nợ header postboot script còn ghi Dot 151**
  (ghi nhận từ T5-152 §5.4, thấy lại ở log poll0 + log độc lập
  đợt này — header log ghi boot e9295700/2e430750 đợt 151 trong
  khi checks là của #67): nợ thẩm mỹ trong log header, không ảnh
  hưởng kết quả check. T5 đợt sau quyết có cập nhật theo Dot hay
  không.
- **Giới hạn xác minh (không phải sai số):** T5-164 xác minh
  boot #67 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime) + Cloudflare 3 lần (+1 s
  cả ba); kiểm tra đồng hồ so với Cloudflare 3 lần. T5 KHÔNG tự
  truy vấn scheduler DB (số liệu run 163 lấy từ aggregate 163,
  đã nêu rõ nguồn — chỉ dùng hạn 17:35:51Z làm mốc, không phán
  (m)); đóng góp độc lập của T5 cho kết luận "không nghịch lý
  #67" là neo uptime + tính đều poll watcher-163 + đo Cloudflare
  (§4.1 mục 1–4), không phụ thuộc DB. Btime #66 (16:06:45Z) lấy
  từ parent quyết (e) đợt 163 (đã xác minh lúc đóng), không xác
  minh độc lập được từ #67 (journal volatile). Mọi khoảng thời
  gian trong LIMITS này đều tính lại từ endpoint thô bằng script
  python (Phụ lục B) — không cộng/trừ lũy kế bằng tay.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-164.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (f1d4ce1a, btime
  17:33:27Z).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/t5-stats-164.py`
(output đầy đủ lưu tại `t5-stats-164-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 17:42:06Z, TRƯỚC khi cờ POSTBOOT_PASS #67
đã ghi — vì vậy §2c/§3c trong output ghi "#67 CHƯA CÓ" theo đúng
trạng thái lúc chạy; cờ #67 ghi sau đó 17:54:38Z, xem §3.1;
F-164-T5-4: §5 ghi 11 gói + 5 lib KHÔNG-CO là trạng thái giữa
replay, đã kiểm lại PASS sau replay xong).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-164 (trich bang script, 2026-11-21T17:42:06Z) ===

--- 1. Boot hien tai ---
boot_id=f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f
btime_epoch=1795282407 = 2026-11-21T17:33:27Z
uptime_s=518.91 now=2026-11-21T17:42:06Z
uptime_-s=2026-11-21 17:33:27
/proc/1 mtime=2026-11-21 17:33:40.945694469 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 f1d4ce1a8d2641aea40dbfcc4696f74f Sat 2026-11-21 17:33:41 UTC Sat 2026-11-21 17:41:06 UTC
journal_first_entry=1795282421.680772 htch-runtime systemd-journald[17]: Journal started
clocksource=tsc
local_date=Sat Nov 21 17:42:06 UTC 2026
cloudflare_date=Date: Sat, 21 Nov 2026 17:42:07 GMT

--- replay-watch-163.log ---
tong_dong=169
kinds={'MONITOR': 1, 'REPLAY_DONE': 1, 'postboot': 1, 'FLAG-WRITTEN': 1}
polls=164 first=2026-11-21 14:45:03+00:00 last=2026-11-21 16:06:54+00:00 gaps={32.0: 1, 30.0: 143, 31.0: 19}
md5_set=['aeb0886e']
lines_set=['1545']
boot_set=['1c1cf10c']
dong_dau: REPLAY-WATCH-163-START 2026-11-21T14:45:03Z pid=25133 boot=1c1cf10c btime=2026-11-21 14:34:57Z end=2026-11-21T17:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=aeb0886e init_mtime=14:38:49Z cache=178 lists=39 gst_sys=269
dong_cuoi: 2026-11-21T16:06:54Z boot=1c1cf10c poll dpkg_lines=1545 md5=aeb0886e apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39
mtime_log=2026-11-21T16:06:54.607702868 +0000

--- replay-watch-164.log ---
tong_dong=5
kinds={'MONITOR': 1}
polls=3 first=2026-11-21T17:40:59+00:00 last=2026-11-21T17:42:00+00:00 gaps={31.0: 1, 30.0: 1}
md5_set=['f7336062']
lines_set=['2']
boot_set=['f1d4ce1a']
dong_dau: REPLAY-WATCH-164-START 2026-11-21T17:40:59Z pid=5451 boot=f1d4ce1a btime=2026-11-21 17:33:27Z end=2026-11-21T20:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=f7336062 init_mtime=17:35:44Z cache=178 lists=3 gst_sys=0
dong_cuoi: 2026-11-21T17:42:00Z boot=f1d4ce1a poll dpkg_lines=2 md5=f7336062 apt=[810 ] apt2=[] dpkg=[] gst_sys=0 cache=178 lists=3
mtime_log=2026-11-21T17:42:01.051694409 +0000

--- 2c. POSTBOOT_PASS theo boot ---
  #f1d4ce1a: (khong co file co nao chua)
  #edb2acdb: (khong co file co nao chua)
  #1c1cf10c: ['.../round163-t5/POSTBOOT_PASS']
  #d9a8d1ce: ['.../round162-t5/POSTBOOT_PASS', '.../round163-t5/POSTBOOT_PASS-d9a8d1ce', '.../round163-t5/POSTBOOT_PASS']
  #94d22520: (khong co file co nao chua)
  round164-t5/POSTBOOT_PASS: KHONG CO
  round163-t5/POSTBOOT_PASS: CO
  round162-t5/POSTBOOT_PASS: CO
  round164-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-edb2acdb: KHONG CO
  round163-t5/POSTBOOT_PASS-94d22520: KHONG CO

--- 3. round163-t5/POSTBOOT_PASS (#65, xac minh lai) (mtime 2026-11-21T14:45:05Z) ---
boot 1c1cf10c-0528-4cb7-ad36-1c11ad005617 (btime 2026-11-21 14:34:57Z; watcher-163) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T14:45:04Z; POSTBOOT_PASS moi ghi 2026-11-21T14:45:05Z poll=0 (replay-day-du); co cu d9a8d1ce luu POSTBOOT_PASS-d9a8d1ce

--- 3b. round162-t5/POSTBOOT_PASS (#64) (mtime 2026-11-21T11:40:00Z) ---
boot d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7 (btime 2026-11-21 11:15:18Z; watcher-162) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T11:40:00Z; POSTBOOT_PASS moi ghi 2026-11-21T11:40:00Z poll=0 (replay-day-du); co cu 39d46ba0 luu POSTBOOT_PASS-39d46ba0

--- 3c. POSTBOOT_PASS #67 (round164-t5) ---
CHUA CO (watcher-164 dang giam sat) — trang thai LUC CHAY STATS 17:42:06Z; co #67 ghi sau do 17:54:38Z (xem §3.1)

--- 3d. Marker ---
marker=CO
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20T11:39:47Z

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=2 md5=f73360622263fc9c2f3b2b4077396369 mtime=2026-11-21 17:35:44Z
dpkg_dong_dau=2026-11-21 17:35:44 startup packages configure
dpkg_dong_cuoi=2026-11-21 17:35:44 startup packages configure
cache_deb=178 lists_entries=3
lists_files=auxfiles lock partial
gst_sys_files=0 (thu muc CHUA CO)
apt_procs=789 /bin/sh -c;810 apt-get update;814 /usr/lib/apt/methods/http ;815 /usr/lib/apt/methods/http ;816 /usr/lib/apt/methods/https ;817 /usr/lib/apt/methods/https ;1439 /usr/lib/apt/methods/gpgv ;1552 /usr/lib/apt/methods/store
watcher164_kill0=ALIVE
watcher163_kill0=DEAD

--- 5. Trang thai 11 goi + 5 lib (LUC 17:42:06Z — GIUA REPLAY, xem F-164-T5-4) ---
  11 goi: KHONG-CO (ca 11); 5 lib: KHONG CO (ca 5) — replay chua cai xong luc nay
  (kiem lai PASS sau replay: watcher poll0 exit 0 17:54:38Z + postboot doc lap exit 0 17:55:51Z)

--- 6. ENOSPC journal boot hien tai ---
ENOSPC_dong=7
journal_dong=86

--- 7. RAM snapshot ---
MemTotal:        8125908 kB
MemFree:          265852 kB
MemAvailable:     2291296 kB
loadavg=5.32 4.45 2.10 8/505 18006

--- 8. systemd user manager ---
user_at_0=inactive
logind=inactive
dbus=inactive
linger_dir=KHONG CO
run_user_0=KHONG CO

--- 9. Co round164 .done (luc 17:42:06Z) ---
  (chua co co .done nao)

--- 10. X11 ---
total 0
drwxrwxrwt  2 root root  40 Nov 21 17:33 .
drwxrwxrwt 13 root root 360 Nov 21 17:43 ..
xvfb_procs=none

=== HET PHU LUC T5-164 2026-11-21T17:42:06Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-f1d4ce1a.log`,
17:55:51Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.9):

```
[postboot 2026-11-21 17:33:27] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 17:33:27] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 17:33:27] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 17:33:27] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 17:33:27] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 17:33:27] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 17:33:27] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 17:33:27)
```

Log postboot poll0 của watcher (`t5-postboot-poll0-f1d4ce1a.log`,
17:54:37Z, exit 0 — cùng nội dung check như log độc lập; header
log còn ghi Dot 151, xem §7.9).

## Phụ lục B. Kiểm chứng độc lập thêm của T5-164 (script một lần, không gõ tay)

**B.1 Tính đều poll watcher-163 (xem §4.2):**
164 poll, 14:45:03Z → 16:06:54Z; khoảng giữa hai poll liên tiếp:
30 s ×143, 31 s ×19, 32 s ×1 (khoảng đầu — postboot trong iteration
đầu, xem F-163-T5-6) — đều, 0 khoảng trống. Poll cuối là poll bình
thường (dpkg 1.545 md5 aeb0886e, 0 proc). Không có dấu hiệu slew
đồng hồ hay suy giảm trước khi chết.

**B.2 Tính đều poll watcher-164 (tới kiểm cuối 17:56:30Z):**
31 poll tới 17:56:08Z; khoảng: 30 s ×20, 31 s ×9 (tới 17:55:38Z)
— đều, 0 khoảng trống. Watcher sống và poll đúng cadence (pid 5451,
kill -0 OK).

**B.3 Các khoảng thời gian (tính lại từ endpoint thô bằng script
python — không cộng/trừ lũy kế bằng tay):**
gap #66→#67 (btime−btime) 5.202 s (1h26m42s); #66 sống 5.202 s;
btime #67 → giờ mở đợt 17:35:51Z: 144 s (2m24s); btime #67 →
watcher-164 START 17:40:59Z: 452 s (7m32s); btime #67 → cờ #67
17:54:38Z: 1.271 s (21m11s); dpkg đầu boot+137s; dpkg xong
boot+20m18s (1.218 s); hoạt động dpkg 1.081 s (18m01s); apt-get
update chạy tối thiểu 649 s, tối đa 770 s (khoảng chặn từ 2 poll
liên tiếp 17:46:33Z/17:48:34Z); watcher-163 poll cuối → btime #66:
9 s (poll cuối SAU btime); khoảng không-watcher 16:06:54Z →
17:40:59Z: 5.645 s (1h34m05s); T10-163 đóng ~17:16Z → btime #67:
~1.047 s (17m27s, mốc đóng là số ước theo aggregate — ghi rõ);
marker sống #49–#67 = 19 reboot (67−49+1).

**B.4 Cách đếm dpkg 1.545 dòng (xem §3.1):** theo action field
(python Counter trên cột $3): 1.040 status + 178 configure + 169
install + 106 startup + 43 trigproc + 9 upgrade = 1.545.
`grep -c ' install '` = 169; `grep -c ' upgrade '` = 9;
`grep -c ' configure '` = 178. Các số TRÙNG KHỚP header postboot
Dot 151 (169/9/178, gói cuối gstreamer1.0-tools) và số dòng cuối
#64/#65 (1.545 dòng) — cùng bộ gói, khác timestamp (md5 khác:
b07e4c5c vs aeb0886e vs 335dc3f2 vs 3411a9cc vs 51d12c3d).

**B.5 Uptime khớp btime trên #67 (xem §4.1 mục 1):** uptime
518,91 s lúc 17:42:06Z ⇒ boot lúc 17:33:27,09Z; btime
17:33:27Z — chênh 0,09 s. `uptime -s` = 17:33:27Z, KHỚP btime
từng giây. Đây là kiểm đã bác H2 ở #62 (GAP §90); ở #67 kiểm
này ĐẬU nên btime LÀ giờ thật.

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round164-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t5/`
  (không nằm trong repo nên không stage): `replay-watch-164.sh`,
  `make-watcher-164.py`, `t5-stats-164.py`,
  `t5-stats-164-output.txt`, `replay-watch-164.log`,
  `replay-watch-164.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-1c1cf10c`,
  `t5-postboot-poll0-f1d4ce1a.log`,
  `t5-postboot-independent-f1d4ce1a.log`.
