# PHASE9_ROUND154_T5_INFRA_LIMITS — PHƯƠNG ÁN (1) SYSTEMD UNIT CHẾT TRONG CELL; WATCHER-154 CHẠY BẰNG TAY, REPAIR SỚM (h) TRÊN BOOT #48

> Luồng T5, đợt 154, lượt cron 18:35 +07 20/11/2026 (mở 11:35:51Z;
> T5 mở thực tế ~11:37Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT MỚI #48
> 2c0a7985-b750-4166-b177-21d2ef7e1dc7** (btime **11:26:05Z** —
> /proc/stat btime 1795173965; `uptime -s` 11:26:05Z; /proc/1
> 11:26:15Z; journal first entry 11:26:15Z — khớp).
> **KẾT LUẬN CHÍNH — PHƯƠNG ÁN (1) USER SYSTEMD UNIT: KHÔNG TRIỂN
> KHAI ĐƯỢC TRONG CELL NÀY** (quyết (e) đợt 153: kiểm tra
> persistence + `systemctl --user` trước khi triển khai).
> Persistence `~/.config/` ĐẠT (chứng minh §2.1); nhưng
> `systemctl --user` KHÔNG CHẠY ĐƯỢC — user manager không khởi
> động nổi ngay cả bằng tay (§2.2). Unit file + script watcher
> đã chuẩn bị sẵn (KHÔNG cài đặt — §2.4); parent chọn giữa
> (2) @reboot cron và (3) quy tắc đứng (bằng chứng cho (2) ở
> §2.3: cell KHÔNG CÓ cron). **KHÔNG push. KHÔNG release/tag.**
> Watcher-154 chạy bằng tay (nohup, như watcher-152) từ
> 11:40:28Z, pid 17168 — xem §3. **KHÔNG tự chạy birefnet**
> (thuộc T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403
> chờ user). TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 20/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 11:06:40Z | Reboot #47, boot cd7dcd88 (btime; T10-153) |
| 11:15:19Z | T10-153 đóng cờ (mtime) — hoạt động cuối ghi nhận trên #47: aggregate 153 mtime 11:17:10Z |
| 11:26:05Z | **btime boot 2c0a7985 (#48)** — sau hoạt động cuối #47 11:17:10Z (KHÔNG chồng lấn như #45; xem §4) |
| 11:35:40–41Z | dpkg.log #48: 2 dòng startup configure đầu tiên (boot +9m35s) |
| 11:35:51Z | Lượt cron đợt 154 mở |
| ~11:37Z | T5-154 mở: boot 2c0a7985, uptime ~11', **không watcher nào chạy** |
| 11:37:41Z | Sampler T9-154 mẫu đầu trên #48 (ram-sampler.log) |
| 11:38:16Z | Poller T4-154 bắt đầu (poll-wait-t4-154.sh; gate0 chưa đạt, t5flag=chưa-có) |
| 11:39:09Z | `systemctl start user@0.service` THẤT BẠI (dependency failed — §2.2) |
| 11:39:40Z | Marker persistence ghi vào `~/.config/vcut-persistence-marker` |
| 11:40:28Z | **Watcher-154 START (bằng tay, nohup), pid 17168, boot 2c0a7985** |
| 11:40:58Z | Stats script lần 1: 0/11 gói, 0/5 lib, dpkg 2 dòng, cache 0, lists 5, GST 0 |
| 11:45:59Z | **EARLY-REPAIR (h) TRIGGER** (boot_age=1.194s, frozen=618s, dpkg 2 dòng, 0 proc) — verify form-B exit=1 (hoàn tất 11:46:00Z) |
| 11:46:00–11:58:26Z | `--repair` chạy (exit=0); postboot poll1 exit=0, hoàn tất 11:58:26Z |
| 11:58:26Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 2c0a7985** (poll=1, repair-som-quyet-h; cờ cũ 18e179e0 lưu POSTBOOT_PASS-18e179e0) — boot+32m21s, nhanh hơn #43 (boot+37'55") ~5,5' |
| 11:58:36Z | Poller T4-154 poll #28: `t5flag=PASS`, gate0=T5 — **phối hợp xong** (poll #29 postboot_exit=0) |
| 11:59:41Z | T5 kiểm cuối: boot vẫn 2c0a7985 (KHÔNG reboot #49 trong phiên); dpkg 795 dòng md5 b5eb43bd ổn định, 11/11 gói + 5/5 lib, GST 269, cache 110, lists 66 |

## 2. Kiểm tra phương án (1) — user systemd unit (quyết (e) đợt 153)

### 2.1 Persistence `~/.config/` — ĐẠT (chứng minh bằng file cũ, không chỉ marker mới)

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/google-chrome-for-testing` | mtime **2026-10-24 05:03Z** — sống qua NHIỀU reboot + rebuild |
| `~/.config/vcut-menu-check` | mtime **2026-11-06 09:04Z** |
| `~/.config/pulse/` | mtime **2026-11-20 10:32:15Z** — TRƯỚC cả btime #47 (11:06:40Z) lẫn #48 (11:26:05Z) → sống qua 2 reboot liên tiếp |
| `~/.config/google-chrome-for-testing-headless/` | mtime 2026-11-11 12:44Z |
| Marker mới `~/.config/vcut-persistence-marker` | ghi 11:39:40Z, boot 2c0a7985 — để đợt sau kiểm tra sau reboot kế tiếp |

- **Kết luận 2.1:** home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rootfs rebuild — cùng kết luận
  với chuỗi bằng chứng trước (workspace + hidden_files sống qua
  #43/#45/#46/#47/#48). Nửa đầu của điều kiện phương án (1) ĐẠT.
  File unit đặt trong `~/.config/systemd/user/` sẽ SỐNG qua
  reboot (về mặt lưu trữ).

### 2.2 `systemctl --user` — KHÔNG LÀM ĐƯỢC (chết ở tầng user manager, không phải linger)

| Kiểm tra | Kết quả (nguyên văn / mã) |
|---|---|
| `systemctl --user status` (XDG_RUNTIME_DIR=/run/user/0) | `Failed to connect to bus: No such file or directory` |
| `loginctl show-user root` | `Failed to connect to bus: No such file or directory` |
| `systemctl status user@0.service` lúc mở | `Active: inactive (dead)` |
| `systemctl start user@0.service` (thử 1 lần, 11:39:09Z) | **`A dependency job for user@0.service failed`** — rc=1; journal: `Dependency failed for user@0.service`, `Job user@0.service/start failed with result 'dependency'` |
| `systemctl status user-runtime-dir@0.service` sau đó | **`Active: failed (Result: exit-code)`** — `ExecStart=/usr/lib/systemd/systemd-user-runtime-dir start 0 (code=exited, status=1/FAILURE)` |
| `systemctl status systemd-logind` | `Active: inactive (dead)` |
| `systemctl status dbus.service / dbus.socket` | Cả hai `inactive (dead)`; socket Listen `/run/dbus/system_bus_socket` — **file không tồn tại** (`ls` báo No such file) |
| `/run/user/` | Chỉ có `.`/`..` — **không có `/run/user/0`**; `XDG_RUNTIME_DIR` trống trong shell |
| `/var/lib/systemd/linger/` | **Không tồn tại** (thư mục chưa từng được tạo) |

- **Nguyên nhân gốc (chuỗi phụ thuộc):** `user@0.service`
  Requires `user-runtime-dir@0.service` + After `dbus.service`
  — `user-runtime-dir@0` exit 1 ngay khi chạy, và không có
  D-Bus system bus nào trong cell (dbus.service/socket chết,
  không có tiến trình dbus). `systemd-logind` cũng chết nên
  `loginctl enable-linger` không thể chạy (không có bus để nói
  chuyện). **User manager không khởi động nổi ngay cả bằng tay
  trong phiên này** — không phải chỉ thiếu linger, mà tầng
  quản lý user hoàn toàn không chạy trong cell.
- **Hệ quả cho phương án (1):** dù file unit + symlink enable
  có đặt đúng trong `~/.config/` (persistent), KHÔNG có gì
  khởi động `user@0.service` ở boot mới — unit sẽ không bao
  giờ chạy. Linger (nếu tạo được) nằm ở `/var/lib/systemd/`
  (rootfs, bị reset mỗi rebuild — §2.1 ngược lại: `/var`
  KHÔNG persistent, bằng chứng dpkg.log/lists/GST reset ở
  #43/#45/#48). **Phương án (1) CHẾT ở cả hai tầng: user
  manager không chạy + linger không persistent.**
- **Không cố lách:** T5-154 KHÔNG thử `systemd-run --user`,
  KHÔNG tự chạy dbus-daemon/logind bằng tay, KHÔNG tạo file
  linger trong `/var` — các bước đó đều là vượt ngoài kiểm
  tra được giao, và không thay đổi được kết luận (cơ chế cần
  TỰ ĐỘNG sau reboot, không phải chạy tay một lần trong phiên).
  Việc duy nhất đã làm là MỘT lần `systemctl start user@0`
  để xác minh (đó là phép kiểm tra, không phải lách).

### 2.3 Bằng chứng cho phương án (2) @reboot cron — cell KHÔNG CÓ cron

| Kiểm tra | Kết quả |
|---|---|
| `which cron crond` | Rỗng (không có binary nào) |
| `systemctl status cron` | `Unit cron.service could not be found.` |
| `ps` toàn cell | Không có tiến trình cron nào |

- Phương án (2) cũng KHÔNG dùng được ngay — cần cài cron
  (apt install cron) mà gói đó không có trong image rootfs;
  và gói cài vào rootfs sẽ MẤT ở rebuild kế tiếp (cùng họ
  với dpkg.log/lists). **Parent chọn giữa (2) và (3) với dữ
  kiện: (2) cần cài thêm daemon không có sẵn + không
  persistent; (3) quy tắc đứng đã áp dụng ngay trong đợt này
  (§5).** T5-154 không đề xuất thay parent.

### 2.4 Unit + script đã chuẩn bị (KHÔNG cài đặt — để parent quyết hướng tiếp)

- `hidden_files/round154-t5/vcut-replay-watch.service` — unit
  file chuẩn (`[Unit] After=network-online.target`,
  `ExecStart=bash .../replay-watch-154.sh`,
  `Restart=on-failure`, `WantedBy=default.target`). Header
  file ghi rõ TRẠNG THÁI: CHƯA CÀI, lý do, và cách cài nếu sau
  này cell có user manager (`cp` vào `~/.config/systemd/user/`
  + `systemctl --user enable` + `loginctl enable-linger`).
- `hidden_files/round154-t5/replay-watch-154.sh` — script
  watcher thích ứng từ watcher-152 (xem §3). Caveat ghi trong
  unit: END cứng trong script theo đợt (14:35:51Z đợt 154);
  bản unit lâu dài cần script tự tính END = boot+3h.
- **Không file nào trong hai file này được chép vào
  `~/.config/systemd/`** — tránh tạo cảm giác giả là "đã triển
  khai" trong khi cơ chế không thể chạy.

## 3. Watcher-154 — chạy bằng tay (quyết (q) + quy tắc đứng (3))

- **Trạng thái lúc mở (11:37:36Z): KHÔNG watcher nào chạy**
  (`pgrep -af 'replay-watch-15[0-9]\.sh'` rỗng; watcher-152
  chết theo #44, không watcher nào từ 07:04:36Z 20/11).
  Ghi vào `round154-t5/watcher-status-at-open.txt` cho T0-154
  (T0-154 chưa xuất hiện lúc 11:39:47Z; thư mục round154-t0
  xuất hiện lúc ~11:40:59Z — T0 tự kiểm tra lại theo quy tắc
  (3); nếu T0 đọc note này thì ghi nhận "chết lúc mở, T5 khởi
  động lại bằng tay 11:40:28Z").
- **Khởi động bằng tay 11:40:28Z, pid 17168** (setsid nohup,
  như watcher-152):
  `REPLAY-WATCH-154-START 2026-11-20T11:40:28Z pid=17168
  boot=2c0a7985 btime=2026-11-20 11:26:05Z end=2026-11-20T14:35:51Z
  interval=30s early_repair_at_boot+900s frozen>=600s
  init_lines=2 init_md5=aa56fb5e init_mtime=11:35:41Z cache=0
  lists=5 gst_sys=0`
- **Thay đổi so với watcher-152 (2 điểm):**
  1. **SỬA F-152-T5-3** (nợ T5-153 §8.4): `write_flag` nay nhận
     timestamp HOÀN TẤT poll1 (lấy mới bằng `date` sau khi
     postboot chạy xong — biến `pbts`/`vts`/`pbts0`), không còn
     dùng giờ trigger `$ts` cho cờ sau repair (ở #43, poll1
     mất ~13' nên cờ cũ ghi sai giờ hoàn tất).
  2. END = 14:35:51Z (hạn cứng đợt 154 = mở +3h); DIR =
     round154-t5, OLD_T5_DIR = round152-t5 (tìm cờ cũ).
  3. Header comment cập nhật boot #48 + kết luận phương án (1).
- **Đường trigger (h) trên #48:** boot+15' = 11:41:05Z (đã qua
  lúc watcher khởi động); frozen ≥600s đạt lúc ~11:45:41Z
  (dpkg mtime 11:35:41Z); poll 30s → **trigger dự kiến
  ~11:45:58Z** nếu vẫn 0 proc + dpkg 2 dòng. [CẬP NHẬT SAU
  KHI WAITER TRẢ VỀ — xem §3.1.]

### 3.1 Kết quả repair sớm (h) + POSTBOOT_PASS trên #48 — HOÀN TẤT

- **Trigger (h) 11:45:59Z** (đúng dự kiến ~11:45:58Z): boot_age
  1.194 s, frozen 618 s, dpkg 2 dòng, 0 apt/dpkg proc.
- **Verify form-B exit=1** (hoàn tất 11:46:00Z — đúng kỳ vọng:
  hệ thống chưa đủ) → `--repair` chạy, **exit=0**.
- **Postboot poll1 sau repair exit=0, hoàn tất 11:58:26Z**
  (repair + poll1 mất 12m27s từ trigger — nhanh hơn #43
  ~13'; mirror nhanh hơn đợt trước).
- **FLAG-WRITTEN 11:58:26Z** (`round154-t5/POSTBOOT_PASS`):
  `boot 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (btime 2026-11-20
  11:26:05Z; watcher-154) — repair-som-quyet-h: dpkg 795 dong;
  cache 110 .deb; lists 66; postboot PASS poll1 doc lap exit 0
  luc 2026-11-20T11:58:26Z; POSTBOOT_PASS moi ghi
  2026-11-20T11:58:26Z poll=1 (repair-som-quyet-h); co cu
  18e179e0 luu POSTBOOT_PASS-18e179e0`.
- **Cờ lúc 11:58:26Z = boot+32m21s** — nhanh hơn đường watcher
  ở #43 (boot+37'55") khoảng 5,5 phút; và nhanh hơn đường
  replay tự nhiên ở #45 (đủ gói boot+76') khoảng 44 phút.
  Đây là lần thứ hai liên tiếp (h) chứng minh giá trị live
  (#43, #48).
- **Kiểm chứng F-152-T5-3 đã sửa:** cờ ghi giờ HOÀN TẤT poll1
  (11:58:26Z), không phải giờ trigger (11:45:59Z) — đúng thiết
  kế mới trong watcher-154 (§3). Đối chiếu log watcher:
  `postboot poll1 sau repair exit=0 ... (hoan tat
  2026-11-20T11:58:26Z)` khớp đúng giờ trong cờ.
- **Trạng thái sau repair (đo lại 11:59:27Z + 11:59:41Z):**
  dpkg **795 dòng, md5 b5eb43bd ỔN ĐỊNH** qua 2 poll liên tiếp
  (11:58:56Z, 11:59:26Z); cache 110; lists 66; GST 269;
  **11/11 gói installed, 5/5 lib CÓ** (script §A lần 3);
  0 apt/dpkg proc. Log repair xác nhận: `RE-CHECK wrapper:
  PASS`, `RE-CHECK libs: PASS đủ 5 lib`, `RE-CHECK GST: PASS
  đủ isomp4 + libav`, `RE-CHECK apt: PASS đủ 11 package`,
  `KET LUAN: DU DIEU KIEN chay WebKit`.
- **Phối hợp T4-154 — gate0 ĐẠT qua cờ T5:** poller T4 poll
  #28 (11:58:36Z) ghi `t5flag=PASS(t5src=154-t5/POSTBOOT_PASS)
  gate0=T5(...)`; poll #29 (11:59:21Z) `postboot_exit=0`.
  T4 không cần check-only dự phòng cho gate0 trên boot này.
- **So sánh #48 với #43 (cùng chữ ký repair):** dpkg sau
  repair **795 dòng cả hai** (trùng đúng); cache 110 cả hai;
  lists 66 (#48) vs 75 (#43) — lệch do mirror lists; GST 269
  cả hai; trigger boot+19m54s (#48) vs boot+25m06s (#43) —
  watcher-154 khởi động sớm hơn trong boot (boot+14m23s so với
  boot+23m05s ở #43) nên trigger sớm hơn.

## 4. Boot #48 (2c0a7985) — replay + đồng hồ

- **Rootfs làm mới (chữ ký như #43/#45):** dpkg.log chỉ 2 dòng
  (`startup packages configure` 11:35:40Z + 11:35:41Z,
  boot +9m35s/+9m36s), lists 5 (skeleton), cache **0 .deb**,
  GST hệ thống 0, 11 gói **0/11 installed**, 5 lib **0/5**
  (đo bằng script §A lúc 11:40:58Z; đối chiếu độc lập: log
  gate0wait của T4-154 cùng kết luận FAIL — thiếu đủ 11 gói +
  5 lib + GST 0).
- **Replay nền tảng:** 2 dòng startup xuất hiện boot+9m35s —
  SỚM hơn #45 (boot+63'02") nhưng cùng mẫu "2 dòng rồi im":
  tới 11:41:13Z vẫn 2 dòng, 0 apt/dpkg proc. Chưa có bằng
  chứng apt-get update đã chạy (journal boot này grep
  os-intent/replay/apt-get = 0 dòng lúc 11:37Z). Watcher-154
  giám sát; nếu replay tự chạy thì điều kiện 0-proc của (h)
  sẽ chặn repair (đúng thiết kế).
- **Đồng hồ — KHÔNG chồng lấn như #45:** hoạt động cuối trên
  #47 là aggregate 153 mtime **11:17:10Z** (cờ T10-153
  11:15:19Z); btime #48 **11:26:05Z** — SAU hoạt động cuối
  #47 tới **535 s (8m55s)**. Cửa sổ chết của cell cũ:
  **(11:17:10Z, 11:26:05Z]** (mốc cuối: btime #48). Không có
  nghịch lý đồng hồ mới nào ở #48 theo mốc này (khác #45:
  overlap ≥45m41s; #46: lùi ≥5s). T2-154 phán chính thức số
  hiệu #48 + mù #78?/#79?/#80? (T5 chỉ ghi mốc; **T2-154 xác
  nhận 11:53Z: reboot #48 đứng; mù #78?/#79?/#80? ĐÓNG theo
  luật gap; gap #48 [1.163, 1.167] s (ứng viên có điều kiện);
  CERT/FULL chính thức GIỮ 73/88; INSIDE 7→8→9 rồi ĐỨT tại #48
  (2c0a7985 OUTSIDE FULL95)**).
- **POSTBOOT_PASS trên đĩa lúc mở:** KHÔNG có cờ nào cho #48
  (round154-t5/POSTBOOT_PASS chưa tồn tại); cờ cũ duy nhất là
  #43 (18e179e0, round152-t5/POSTBOOT_PASS, 05:58:52Z) —
  STALE, T4-154 không dùng làm gate (poller T4 ghi
  t5flag=chưa-có, postboot exit=1, gate0=không-đạt ở poll
  #1–3). Cờ #48 do watcher-154 viết (§3.1); T4-154 phối hợp:
  poller đọc `round154-t5/POSTBOOT_PASS` (chính) + fallback
  `round153-t5/POSTBOOT_PASS` (không tồn tại — fallback rỗng).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 154

- T0-154 kiểm tra watcher lúc mở (quyết (e) đợt 153): T0 chưa
  xuất hiện lúc 11:39:47Z; thư mục round154-t0 có mặt lúc
  ~11:40:59Z. T5 đã ghi trạng thái lúc mở vào
  `watcher-status-at-open.txt` (chết lúc mở → khởi động lại
  bằng tay 11:40:28Z) để T0 đối chiếu.
- **Hạn chế đã biết của (3):** vẫn để hở cửa sổ reboot → phiên
  mở — ở #48 cửa sổ này là (11:26:05Z, 11:35:51Z] ≈ 10 phút
  (ngắn hơn #45: 63 phút) + thêm ~5 phút tới khi watcher-154
  chạy (11:40:28Z). Không có thiệt hại nào đo được trong cửa
  sổ này (dpkg chỉ 2 dòng startup lúc 11:35:40Z, tức là replay
  nền tảng tự bắt đầu trước khi watcher chạy — watcher không
  bỏ lỡ trigger nào: frozen chưa đủ 600s lúc 11:40:28Z).

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-154 là chủ):** MemTotal 8.124.896
  kB; MemAvailable **1.425.420 kB @11:40:58Z** → **1.528.264 kB
  @11:41:13Z** (đang tăng lúc mở phiên); MemFree 184.004 →
  153.948 kB. loadavg 6,42 @11:40:58Z / 5,92 @11:41:13Z (mở
  phiên, nhiều luồng khởi động cùng lúc — T9-154 quy nguồn
  spike B2; sampler T9 ghi load1=7,39 ở mẫu 11:40:41Z).
  Sampler T9-154 ĐANG CHẠY (ram-sampler.log 4 mẫu 11:37:41–
  11:40:41Z, boot 2c0a7985, bal=5.380.140); b2-watcher pid 3419
  đang chạy (b2-spikes.log 4.238 B lúc 11:38Z).
- **ENOSPC journal boot #48:** 7 dòng lúc 11:40:58Z (journal
  117 dòng) — cùng chữ ký `home-assistant-ensure.service:
  Failed to add control inotify watch descriptor ... No space
  left on device` (thấy trong journal tail 11:38:21Z). T9-154
  đếm chính thức; T5 chỉ ghi nhận số lúc mở.
- **Không reboot mới trong phiên T5** (boot vẫn 2c0a7985 lúc
  kiểm cuối 11:59:41Z — KHÔNG có #49; watcher-154 tiếp tục
  giám sát tới hạn cứng 14:35:51Z, tự ghi NEWBOOT nếu có
  reboot sau khi T5 đóng cờ).
- **RAMavail sau repair giảm** (theo poller T4, không phải
  sampler T9): 1.587 MB @11:39:46Z → 859 MB @11:57:51Z →
  738 MB @11:58:36Z → 732 MB @11:59:21Z (apt install + cache);
  load1 về 0,08–0,41 sau khi repair xong (yên). T9-154 đếm
  chính thức bằng sampler.
- **Sai số của chính T5-154:** xem §9.

## 7. Nợ mở chuyển đợt 155 (từ T5-154)

1. **Watcher respawn — chờ quyết parent giữa (2) và (3):**
   (1) CHẾT trong cell (user manager không chạy được + linger
   không persistent); (2) cell không có cron (cần cài + không
   persistent qua rebuild); (3) quy tắc đứng đã áp dụng đợt
   154. Unit file + script chuẩn bị sẵn tại round154-t5/
   (`vcut-replay-watch.service`, `replay-watch-154.sh`) để
   dùng lại nếu cell sau này có user manager.
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z, boot 2c0a7985) — T5-155 kiểm tra còn sau
   reboot kế tiếp không (bằng chứng trực tiếp cho lần sau;
   bằng chứng gián tiếp đã đủ: file Oct 24–Nov 11 còn nguyên).
3. **POSTBOOT_PASS cho #48 — XONG 11:58:26Z** (watcher-154,
   repair-som-quyet-h, poll=1; T4-154 đã nhận cờ, gate0 đạt).
   Watcher-154 tiếp tục giám sát tới 14:35:51Z; nếu có reboot
   #49 trong phiên thì watcher tự ghi NEWBOOT + repair lại
   (1 repair/boot) — T5-155 kiểm tra log.
4. **Mù #78?/#79? + số hiệu #48** — giao T2-154 phán (T5 chỉ
   ghi mốc btime + hoạt động cuối #47).
5. **F-152-T5-3 ĐÃ SỬA** trong watcher-154 (timestamp hoàn tất
   poll1). Còn nợ: header comment postboot script còn ghi Dot
   151 (ghi nhận từ T5-152 §5.4 — chưa ai quyết) — T5 đợt sau
   quyết có cập nhật theo Dot hay không.
6. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 153 thuộc T7-154 (kết cục + #47 có viết lại
   lần 2 không).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(1) CHẾT — không triển khai.** Bằng chứng §2.2 đủ mạnh:
  user manager không khởi động nổi ngay cả bằng tay; D-Bus +
  logind chết; linger không persistent. Thử lại (1) ở đợt sau
  chỉ có ý nghĩa nếu cell thay đổi (VD: image mới có dbus/logind
  chạy) — T5 đợt sau kiểm tra lại nhanh `systemctl is-active
  user@0` trước khi kết luận lại.
- **(2) @reboot cron — cần đầu tư mới dùng được:** cài cron
  (không có sẵn) + cron phải sống qua rebuild (nó không sống —
  gói nằm trên rootfs). Chỉ khả thi nếu platform image có sẵn
  cron hoặc parent chấp nhận cài lại mỗi phiên (không tự động).
- **(3) Quy tắc đứng — đang chạy, đủ cho hiện tại:** T0 kiểm
  tra watcher lúc mở + T5 khởi động lại bằng tay trong phiên.
  Cửa sổ hở còn lại là reboot → phiên mở (~10' ở #48, 63' ở
  #45) — chấp nhận được nếu parent thấy thiệt hại ở #45 là
  trường hợp xấu nhất và hiếm.

## 9. Sai số của chính T5-154

- **F-154-T5-1 — Lệnh `pgrep -af 'replay-watch-154\.sh'` tự khớp
  shell exec của chính T5** (pid 17150) + shell exec của luồng
  khác (T9, pid 3648) — cùng họ F-153-T5-1/F-152-T5-1. Đã nhận
  diện ngay là tự khớp (cmdline là lệnh exec, không phải script
  watcher) và xác nhận watcher thật bằng pid 17168 (cmdline là
  đường dẫn script) + dòng START trong log. Bài học giữ nguyên:
  luôn neo pattern + đối chiếu log START, không tin mù pgrep.
- **F-154-T5-2 — Script stats v1 sai 2 chỗ:** (a) truy vấn
  `dpkg-query -f=${Status}` bị shell nuốt biến → 11 gói in
  rỗng; (b) `pgrep -af` bọc trong quote đơn thành 1 từ lệnh →
  "not found". Đã sửa cả hai (dùng `'${Status}'` + pgrep trần)
  và chạy lại — appendix lần 2 sạch (0/11 gói, 0/5 lib, sampler
  + b2-watcher xác nhận đang chạy). File output nay giữ lần 3
  (sau repair); lần 1/lần 2 chỉ còn trích trong LIMITS §A.
- **F-154-T5-3 — Nội dung marker ghi "11:41Z" trong khi file
  ghi thực tế 11:39:40Z** (T5 gõ giờ ước lượng trước khi chạy
  lệnh). Đã sửa nội dung marker về 11:39:40Z cho khớp stat.
  Bài học: không gõ giờ tay vào file marker — lấy từ `date`.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-154.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (2c0a7985, btime
  11:26:05Z).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round154-t5/t5-stats-154.py`
(output đầy đủ lưu tại `t5-stats-154-output.txt` cùng dir — bản
CUỐI là lần 3, chạy lúc ~11:59:41Z, SAU repair).
Chạy lần 1 lúc 11:40:58Z (trước repair) — sai truy vấn gói/pgrep,
xem F-154-T5-2; chạy lần 2 lúc 11:41:13Z (đã sửa, trước repair:
0/11 gói, 0/5 lib); chạy lần 3 lúc ~11:59:41Z (sau repair:
11/11 gói, 5/5 lib, dpkg 795, cache 110, lists 66, GST 269,
POSTBOOT_PASS tồn tại, watcher log 21 dòng START=1 poll=14
EARLY-REPAIR=1 FLAG-WRITTEN=1). Nguyên văn output lần 2
(phần §5–§7 trích ở đây; toàn văn trong file output):

```
--- 5. Trang thai 11 goi + 5 lib ---
  libevent-2.1-7t64: not-installed
  gstreamer1.0-plugins-base: not-installed
  gstreamer1.0-plugins-good: not-installed
  gstreamer1.0-plugins-bad: not-installed
  gstreamer1.0-plugins-ugly: not-installed
  gstreamer1.0-gl: not-installed
  gstreamer1.0-libav: not-installed
  gstreamer1.0-x: not-installed
  libavif16: not-installed
  libgstreamer1.0-0: not-installed
  libevdev2: not-installed
  libevent-2.1.so.7: THIEU
  libEGL.so.1: THIEU
  libavif.so.16: THIEU
  libdw.so.1: THIEU
  libevdev.so.2: THIEU

--- 7. RAM snapshot ---
MemTotal:        8124896 kB
MemFree:          153948 kB
MemAvailable:    1528264 kB
loadavg=5.92 3.37 1.43 7/480 20584
sampler .../round154-t9/ram-sampler.log: tong_mau=4 dau=2026-11-20T11:37:41 cuoi=2026-11-20T11:40:41Z boot=2c0a7985 mem=1400844 bal=5380140 swapfree=758020 load1=7.39
b2_watcher_proc=3419 bash .../round154-t9/b2-watcher.sh
```

Toàn văn output lần 2: xem `t5-stats-154-output.txt` (round154-t5/).

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round154-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round154-t5/`
  (không nằm trong repo nên không stage): `replay-watch-154.sh`,
  `vcut-replay-watch.service`, `t5-stats-154.py`,
  `t5-stats-154-output.txt`, `replay-watch-154.log`,
  `watcher-status-at-open.txt`, `POSTBOOT_PASS` (khi có).
