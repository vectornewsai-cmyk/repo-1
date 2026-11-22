# PHASE9_ROUND160_T5_INFRA_LIMITS — WATCHER-160 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #61 CÓ (BOOT+27M10S); #60 KHÔNG CÓ CỜ (BOOT THỨ 6 KHÔNG CỜ); MARKER SỐNG QUA 13 REBOOT

> Luồng T5, đợt 160, lượt cron 12:35 +07 21/11/2026 (mở
> 05:35:51Z; T5 mở thực tế ~05:38Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #61
> (ỨNG VIÊN — chờ parent xác nhận số hiệu, theo quy tắc đứng T0 ghi
> ứng viên, parent quyết) 52c957d5-a8dd-4523-822f-acfcde535d3b**
> (btime **05:25:49Z** — /proc/stat btime 1795238749; `uptime -s`
> 05:25:49Z; /proc/1 05:26:00Z (+11 s — cùng mẫu lệch, KHÔNG phải
> btime); journal first entry 05:26:00Z (+11 s); **T5 tự xác minh độc
> lập 5 nguồn** — T0-160 xác minh độc lập 7 nguồn và KHỚP (xem cờ
> round160-t0.done)).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156, (o) đợt 157, (o) đợt 158,
> (o) đợt 159): KHÔNG cài unit, KHÔNG thử lại (1)/(2).**
> Watcher-159 pid 18158 CHẾT theo reboot #60 (log dừng 03:06:26Z, poll
> cuối boot eec65561, 0 NEWBOOT — xem §4; **đối chiếu T0-160: T0 ghi
> "Watcher lúc mở 0" — KHỚP với T5, và T0 KHÔNG đưa ra suy luận
> nguyên nhân chết nào khác; không còn mâu thuẫn T0 vs T5 ở đợt này**
> — xem F-160-T5-3).
> **Watcher-160 khởi động bằng tay 05:41:26Z, pid 4539** (§3).
> **POSTBOOT_PASS cho #61 ĐÃ GHI 05:52:59Z (boot+27m10s, mode
> replay-day-du, poll=0)** — replay trên #61 CHẠY LẠI TỪ ĐẦU trong
> phiên (không như #59 đã xong lúc mở): hoạt động đầu boot+9m50s,
> xong boot+26m17s (§3.1). **POSTBOOT_PASS cho #60 KHÔNG CÓ, không
> bù được** — #60 là boot thứ 6 không có cờ (#51, #53, #54, #55,
> #57, #60), xem §4. **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 13 REBOOT LIÊN TIẾP
> #49–#61** (§2.1; T0-160 xác minh độc lập và KHỚP). **KHÔNG push.
> KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc T9). KHÔNG
> đụng file workflow (ci-security.yml vẫn 403 chờ user). TTS 39
> CẤM kiểm lại.

## 1. Timeline (giờ UTC, 21/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 01:33:47Z | **Reboot #59, boot eec65561** (btime — T5-159 xác minh 5 nguồn) |
| 02:41:21Z | Watcher-159 START bằng tay, pid 18158, boot eec65561 |
| 02:41:22Z | POSTBOOT_PASS #59 ghi (watcher-159, replay-day-du, poll=0) |
| 03:05:59Z | **Reboot #60, boot e590ae0a** (btime — theo cờ T10-159 + task đợt 160; journal volatile nên KHÔNG xác minh độc lập được từ #61) — #59 sống 7.932 s (~2h12m12s) |
| 03:06:26Z | Watcher-159 poll cuối (đồng hồ boot cũ) — vẫn boot eec65561, 0 NEWBOOT; CHẾT theo #60 |
| ~05:12Z | T10-159 đóng sổ đợt 159 (round159-t10.done ~05:12Z; boot lúc đóng e590ae0a) |
| 05:25:49Z | **Reboot #61 (ứng viên), boot 52c957d5** (btime /proc/stat 1795238749) — #60 sống 7.910 s (~2h11m50s) |
| 05:35:39Z | Hoạt động dpkg đầu trên #61 (**boot+9m50s — MUỘN hơn #59 boot+35s**, xem §3.1) |
| 05:35:51Z | Lượt cron đợt 160 mở |
| ~05:38Z | T5-160 mở: boot 52c957d5, uptime ~13', **không watcher nào chạy**; không POSTBOOT_PASS cho #61; replay ĐANG CHẠY trên boot này (dpkg 2 dòng, apt-get update pid 818) |
| 05:41:26Z | **Watcher-160 START (bằng tay, bash显式 + setsid nohup), pid 4539, boot 52c957d5** |
| 05:41:55Z | T0-160 đóng cờ (ghi POSTBOOT_PASS #61 "CHUA CO" — đúng lúc đó, vì cờ chỉ ghi 05:52:59Z, xem F-160-T5-3) |
| 05:52:06Z | dpkg.log #61 xong: 1.545 dòng (boot+26m17s) — replay hoàn tất |
| 05:52:59Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 52c957d5** (poll=0, replay-day-du) — boot+27m10s |
| 06:15:52Z | Stats script + postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib, GST 269, cache 178, lists 71, ENOSPC 18 dòng (số riêng T5) |
| 06:16:08Z | Kiểm cuối: vẫn boot 52c957d5, watcher-160 pid 4539 đang poll đều (poll cuối 06:16:02Z, đúng chu kỳ 30 s) |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156 +
(o) đợt 157 + (o) đợt 158 + (o) đợt 159: **(3) LÀ HƯỚNG ĐỨNG** —
T0 kiểm tra watcher lúc mở, T5 khởi động lại bằng tay. T5-160 kiểm
tra lại nhanh `systemctl is-active` (§A.8): user@0/logind/dbus vẫn
inactive, không linger, không cron, không /run/user/0 — cell
không đổi, kết luận đợt 154/155/156/157/158/159 giữ nguyên (lần
kiểm tra lại thứ bảy liên tiếp). Unit + script ở `round154-t5/`
GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 13 REBOOT LIÊN TIẾP #49–#61

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156/157/158/159; không thuộc phạm vi T5-160) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#61 (13 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (11 reboot ở đợt 159 →
  13 reboot đợt này). Home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rebuild — khẳng định lần thứ
  mười ba liên tiếp. **T0-160 xác minh độc lập và KHỚP**
  ("marker persistence CON (song qua 13 reboot #49-#61)").

## 3. Watcher-160 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (~05:38Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `ps -p 18158`: không có tiến trình). Ghi vào
  `round160-t5/watcher-status-at-open.txt`. **T0-160 xác minh
  độc lập và KHỚP** ("Lúc mở (~05:38Z): 0 watcher" — T0 quét
  toàn bộ `/proc/*/cmdline` + `kill -0` các pid watcher đợt 159).
  Watcher-159 pid 18158 đã chết theo reboot #60 (log dừng
  03:06:26Z, poll cuối boot eec65561, 0 NEWBOOT — xem §4).
- **Khởi động bằng tay 05:41:26Z, pid 4539** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-160-START 2026-11-21T05:41:26Z pid=4539
  boot=52c957d5 btime=2026-11-21 05:25:49Z end=2026-11-21T08:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2
  init_md5=88334c78 init_mtime=05:35:40Z cache=0 lists=3 gst_sys=0`
- **Thay đổi so với watcher-159 (3 điểm):**
  1. END = 08:30:00Z 21/11 (hạn cứng đợt 160 theo task); DIR =
     round160-t5, OLD_T5_DIR = round159-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #61 + trạng thái replay ĐANG
     CHẠY lúc khởi động (dpkg 2 dòng, apt-get update pid 818,
     hoạt động đầu 05:35:39Z = boot+9m50s) — dự kiến REPLAY_DONE
     sau khi replay xong, không phải EARLY-REPAIR (apt đang chạy
     nên repair bị cấm theo logic).
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Script viết bằng python thay
     sed (tránh họ F-159-T5-2) + đọc lại toàn bộ TRƯỚC khi khởi
     động (grep kiểm `round15[0-9]`/`159`/`158`/`05:30` + `bash -n`
     syntax OK) — KHÔNG để lọt lỗi nào vào script đã chạy.
- **Poll đều đã xác minh:** 05:41:26Z, 05:41:56Z, …, 06:15:32Z,
  06:16:02Z — đúng chu kỳ 30 s, không trượt poll (kiểm cuối
  06:16:08Z, pid 4539 elapsed 34:42, PPID 1). Lúc 06:15:52Z log
  74 dòng, 69 poll, 1 FLAG-WRITTEN, 0 NEWBOOT, 0 END.

### 3.1 POSTBOOT_PASS cho #61 — HOÀN TẤT QUA REPLAY ĐẦY ĐỦ (KHÔNG REPAIR)

- **Replay của cell trên #61: CHẠY LẠI TỪ ĐẦU trong phiên, xong
  boot+26m17s.** Hoạt động dpkg đầu 05:35:39Z (**boot+9m50s** —
  MUỘN hơn nhiều so với #59 boot+35s, #58 boot+42s; nguyên nhân
  chưa rõ — cell lên chậm sau reboot #61, không phải do watcher;
  giao T2/T7 nếu cần); xong 05:52:06Z (**boot+26m17s**); dpkg
  **1.545 dòng** (md5 3411a9cc); breakdown **169 install / 9 upgrade
  / 178 configure — KHỚP CHÍNH XÁC replay đầy đủ của #56/#58/#59**
  (cùng tập gói; md5 khác do thời gian); gói cuối
  gstreamer1.0-tools 05:52:06Z. Cache APT **0 .deb lúc watcher
  start → 178 .deb sau replay** (không mang sang từ #59 — lần
  đầu T5 thấy cache bắt đầu 0 kể từ Dot 151; replay tải lại đủ
  178). Lists **71** (3 lúc start → 71; tăng từ 39 trên #59 —
  +32 entry, apt-get update kéo đủ bộ lists mới). GST hệ thống 269.
- **REPLAY_DONE 05:52:59Z** (dpkg 1.545 ổn định 2 poll, 0 proc)
  → postboot check-only poll0 **exit=0** (hoàn tất 05:52:59Z).
  **KHÔNG repair** — không cần (replay chạy xong tự nhiên;
  EARLY-REPAIR=0 trong log).
- **FLAG-WRITTEN 05:52:59Z** (`round160-t5/POSTBOOT_PASS`):
  `boot 52c957d5-a8dd-4523-822f-acfcde535d3b (btime 2026-11-21
  05:25:49Z; watcher-160) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 71; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T05:52:59Z; POSTBOOT_PASS moi ghi 2026-11-21T05:52:59Z
  poll=0 (replay-day-du); co cu eec65561 luu POSTBOOT_PASS-eec65561`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-eec65561` đã đối chiếu
  bằng `diff` — KHỚP cờ #59 gốc (round159-t5).
- **Cờ lúc 05:52:59Z = boot+27m10s — NHANH NHẤT trong các boot
  gần đây** (#58 boot+37m14s, #59 boot+67m35s): replay xong
  boot+26m17s, cờ ghi ngay sau đó 53 s; #59 muộn (boot+67m35s) vì
  phiên mở muộn (boot+62m04s), còn #61 phiên mở boot+10m02s nên
  cờ bắt kịp replay gần như ngay.
  Cửa sổ hở của hướng (3) ở #61 chỉ còn ~27 phút tới khi có cờ
  (ngắn nhất kể từ #58). Thiệt hại đo được: KHÔNG có — cờ có
  trước khi T4/T8-160 cần gate0 (T8-160 chưa chạy O8 lúc T5
  đóng cờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script (§A, 06:15:52Z) + postboot độc lập
  (`t5-postboot-independent-52c957d5.log`, exit 0, 06:15:52Z):
  wrapper PASS, libs PASS đủ 5, GST PASS (269 = debroot 269,
  đủ isomp4 + libav), apt PASS đủ 11 package, KẾT LUẬN "DU
  DIEU KIEN chay WebKit". **11/11 gói installed, 5/5 lib CÓ.**
- **Phối hợp T4/T8-160:** poller T4-160 + harness T8-160 đọc
  `round160-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  05:52:59Z, TRƯỚC khi các luồng khác cần gate0.

## 4. Boot #60 — KHÔNG CÓ POSTBOOT_PASS; watcher-159 chết theo reboot; nghịch lý đồng hồ +27 s

- **Boot #60 (e590ae0a, btime 03:05:59Z): KHÔNG CÓ cờ.**
  Bằng chứng: không file `POSTBOOT_PASS*` nào cho e590ae0a
  trong round159-t5/ lẫn round160-t5/ (§A.2c — grep chỉ match
  các file do chính T5-160 viết: header script, stats script,
  output giữa kỳ; xem F-160-T5-2); không watcher nào sống
  trong #60 (watcher-159 chết lúc #60 bắt đầu, phiên 160 mở
  sau khi #60 đã chết 05:25:49Z); journal chỉ còn #61 (volatile
  theo rebuild) nên không còn dấu vết replay #60 trên đĩa.
  **Không bù được** (cùng tiền lệ #51/#53/#54/#55/#57 theo
  quyết (o) đợt 156) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống.
- **#60 là boot thứ 6 không có cờ** (danh sách đầy đủ: #51,
  #53, #54, #55, #57, #60 — #57 là thứ 5 theo T5-158 §4; task
  đợt 160 diễn đạt "thứ 6 nếu #61 cũng không có" — T5 ghi rõ
  số đếm theo danh sách này để T10 khỏi nhầm: **#60 = thứ 6,
  #61 ĐÃ CÓ cờ nên chuỗi dừng ở 6**). Các boot #58/#59 ĐÃ CÓ
  cờ nên đây là đếm tích lũy các boot lọt, không phải "liên
  tiếp" theo nghĩa đen.
- **Boot #59 (eec65561): POSTBOOT_PASS VẪN CÒN trên đĩa** —
  `round159-t5/POSTBOOT_PASS`, mtime 02:41:22Z; bản sao đã lưu `round160-t5/POSTBOOT_PASS-
  eec65561` (đã đối chiếu bằng `diff`, khớp).
- **Watcher-159 pid 18158 CHẾT theo reboot #60 — bằng chứng
  log của T5:** `replay-watch-159.log` 56 dòng, 51 poll,
  0 NEWBOOT, 1 FLAG-WRITTEN, 0 END; dòng cuối **03:06:26Z boot
  eec65561** (poll bình thường, dpkg 1.545 ổn định); **KHÔNG
  có dòng REPLAY-WATCH-159-END** (hạn 05:30:00Z chưa tới) và
  **KHÔNG có dòng watcher-stop** — watcher không thoát tự
  nhiên theo logic script mà dừng giữa chu kỳ poll, đúng lúc
  boot đổi. Cùng mẫu watcher-158/#59 (log dừng 01:34:06Z,
  0 NEWBOOT). Poll đều 30 s suốt phiên (02:41:21Z → 03:06:26Z,
  chỉ 1 nhịp 31 s lúc 03:02:56Z).
- **Nghịch lý đồng hồ #60 +27 s — T5 xác nhận:** poll cuối
  watcher-159 **03:06:26Z (đồng hồ boot cũ) vẫn thấy boot
  eec65561** trong khi btime #60 là 03:05:59Z (27 s TRƯỚC poll
  đó). Đồng hồ boot cũ chạy nhanh ≥27 s so với giờ thật
  (cùng chiều #57 ≥ +25 s, #58 ~+28 s, #59 ≥ +19 s; T7-159
  ước ~+20 s cho #60 từ neo khác — chênh 7 s giữa hai ước
  lượng, giao T2-160). Btime #60 = GIỜ THẬT theo cờ T10-159
  (T0-160 xác minh btime #61 bằng 7 nguồn; btime #60 không
  xác minh độc lập được từ #61 — xem §1). T5 không phán thêm
  về mô hình đồng hồ — giao T2-160.
- **Đối chiếu T0-160 (theo task):** cờ round160-t0.done
  (~05:42Z) ghi "Watcher lúc mở 0 (watcher-159 pid18158 + T9
  sampler/watcher 12483/12484 đều chết)" — **KHỚP với T5**
  (0 watcher lúc mở) và **KHÔNG đưa ra suy luận nguyên nhân
  chết nào khác** (không lặp lại suy luận "chết tự nhiên" của
  T0-159 mà T10-159 đã bác). Không còn mâu thuẫn T0 vs T5 ở
  đợt này. T0-160 cũng xác minh độc lập số hiệu #61 (7 nguồn),
  đồng hồ local ≈ Cloudflare ±1 s (05:39Z), marker sống qua
  13 reboot — TẤT CẢ KHỚP với T5.
- **Boot #57:** vẫn KHÔNG CÓ cờ, không bù được (theo T5-158
  §4; không có dữ kiện mới đợt này).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 160

- T0-160 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-160
  xác minh độc lập "Watcher: 0 lúc mở" — KHỚP với T5. T5 tự
  khởi động lại pid 4539 ~05:41Z (ghi trong
  `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #61: ~27 phút tới cờ — NGẮN NHẤT
  kể từ #58** (~37 phút) vì phiên mở sớm (boot+10m02s) và
  replay tuy bắt đầu muộn (boot+9m50s) nhưng xong trong phiên.
  Đây là khoảng hở đã biết của hướng (3): cờ chỉ có khi có
  phiên T5 sau reboot. #60 vẫn là boot lọt hoàn toàn không cờ
  gần nhất — #61 ĐÃ BẮT ĐƯỢC nhờ phiên 160 mở trong lúc #61
  còn sống.
- **Watcher-160 tiếp tục giám sát tới 08:30:00Z**; nếu có reboot
  #62 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-161 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-160 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **2.184.024 kB @06:15:52Z**; MemFree 818.016 kB.
  loadavg 1,95 @06:15:52Z. Sampler T9-160 ĐANG CHẠY
  (ram-sampler.log 37 mẫu 05:39:41–06:15:42Z, boot 52c957d5,
  bal=4.621.156); b2-watcher pid 3458 đang chạy.
- **ENOSPC journal boot #61:** **18 dòng** lúc 06:15:52Z
  (journal 211 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-160 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. Tiến trình trong phiên: 3 dòng @05:38Z →
  5 dòng @05:42Z → 18 dòng @06:15:52Z. So sánh: #59 có 58 dòng
  lúc T5-159 đo (02:42:29Z); #58 có 34 dòng lúc T5-158 đo.
- **Không reboot mới trong phiên T5** (boot vẫn 52c957d5 lúc
  kiểm cuối 06:16:08Z — KHÔNG có #62; watcher-160 tiếp tục
  giám sát tới hạn cứng 08:30:00Z).
- **journal_boots chỉ còn 1 boot (#61):** journal của #60
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 161 (từ T5-160)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 13 reboot
   #49–#61. T5-161 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #61 — XONG 05:52:59Z** (watcher-160,
   replay-day-du, poll=0; T4/T8-160 phối hợp qua cờ).
   Watcher-160 tiếp tục giám sát tới 08:30:00Z; nếu có reboot
   #62 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-161 kiểm tra log.
4. **POSTBOOT_PASS #60 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (boot thứ 6 không cờ; cùng tiền lệ #51/#53/#54/#55/#57).
   T8-159 đã chạy O8 3/3 PASS trên #59, không phải #60 — dữ
   kiện #60 chỉ còn cờ T7/T10 (điểm (m) #60 +46,642 s, run 159
   bị viết lại 1 lần tại #60); chỉ thiếu cờ watcher.
5. **Replay #61 bắt đầu muộn (boot+9m50s)** so với #59
   (boot+35s) / #58 (boot+42s) — nguyên nhân chưa rõ (cell lên
   chậm sau reboot #61?). Nếu #62 cũng bắt đầu muộn >10', T5
   đợt sau ghi nhận xem có thành mẫu không. Không ảnh hưởng cờ
   #61 (replay xong boot+26m17s, cờ boot+27m10s).
6. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #61): T5 đợt sau quyết có cập nhật theo Dot
   hay không. Đây là nợ thẩm mỹ trong log header, không ảnh
   hưởng kết quả check.
7. **Cửa sổ hở hướng (3) ngắn nhất kể từ #58: ~27 phút tới cờ
   #61** (phiên mở sớm boot+10m02s). Nếu phiên sau mở muộn
   hơn nữa sau một reboot, cờ có thể muộn tới boot+90' —
   T4/T8 lưu ý không chạy O8/harness trước khi cờ có (bài học
   F-156-T0-1).
8. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 159 thuộc T7-160 (kết cục + #61 có phải điểm
   (m) mới không — xem LIMITS T7-160; run 159 vẫn RUNNING lúc
   T10-159 đóng, hạn 05:35:51Z).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này replay #61 tuy bắt
  đầu muộn nhưng xong trong phiên và #61 đã bắt được cờ ở
  boot+27m10s, khác #60 lọt hoàn toàn; cửa sổ hở tới cờ ngắn
  nhất kể từ #58 vì phiên mở sớm. T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ bảy liên tiếp.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #60 từ log của
  T7/T10-159** (xem §4) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #60 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Số hiệu #61 vẫn là ứng viên chờ parent xác nhận** (T0-160
  §22 + §95) — T5 dùng "#61 (ứng viên)" trong LIMITS này theo
  đúng quy tắc đứng.
- **Mâu thuẫn T0 vs T5 đợt 159 đã được T10-159 phán (T5 đúng)**
  và đợt này không tái diễn (xem §4, F-160-T5-3) — T5 không
  cần phán thêm.

## 9. Sai số của chính T5-160

- **F-160-T5-1 — `pgrep -af ram-sampler` tự khớp shell exec của
  chính T5** (cùng họ F-156-T5-1/F-157-T5-1/F-158-T5-1/F-159-T5-1).
  Trong stats §7: dòng sampler_proc chứa `/bin/sh -c pgrep -af
  ram-sampler` — bằng chứng thật là file ram-sampler.log
  (37 mẫu, boot 52c957d5) + b2-watcher pid 3458 (cmdline là
  đường dẫn script) + dòng sampler_proc đầu (pid 41621, lệnh
  sleep 2100 của T9). Bài học giữ nguyên: luôn neo pid trực
  tiếp + đối chiếu log/file, không tin mù pgrep.
- **F-160-T5-2 — grep `e590ae0a` match các file do chính T5-160
  viết:** §A.2c liệt kê `replay-watch-160.sh` (header comment),
  `t5-stats-160.py` và `t5-stats-160-mid.txt` chứa chuỗi e590ae0a
  — đó là tham chiếu lịch sử do T5 viết, KHÔNG phải cờ
  POSTBOOT_PASS cho #60. Kết luận "#60 KHÔNG CÓ cờ" dựa trên
  việc KHÔNG tồn tại file `POSTBOOT_PASS*` nào cho e590ae0a
  (kiểm trực tiếp từng đường dẫn), không dựa trên grep.
- **F-160-T5-3 — Đua giờ với cờ T0-160 (cùng họ F-159-T5-4,
  nhưng dài hơn):** T0 đóng cờ 05:41:55Z ghi POSTBOOT_PASS #61
  "CHUA CO" trong khi FLAG-WRITTEN của watcher-160 là
  05:52:59Z (11 phút SAU). T0 kiểm tra cờ trước khi cờ tồn tại
  — không phải mâu thuẫn nội dung, chỉ là thứ tự kiểm tra. Ghi
  nhận để T10 khỏi nhầm là hai cờ vênh nhau. **Đối chiếu
  nguyên nhân chết watcher-159: T0-160 KHÔNG đưa ra suy luận
  nào khác T5** (chỉ ghi "0 watcher lúc mở") — không còn mâu
  thuẫn T0 vs T5 như đợt 159.
- **F-160-T5-4 — Diễn đạt điều kiện thừa về chuỗi marker trong
  `watcher-status-at-open.txt`:** T5 viết "chuỗi 13 reboot
  #49–#61 nếu #61 giữ đến cuối phiên" trong khi marker đã có
  mặt trên #61 lúc mở (đủ điều kiện đếm 13 ngay lúc đó) — T0-160
  xác minh độc lập và KHỚP "sống qua 13 reboot #49–#61". Chỉ
  là diễn đạt thận trọng thừa, không sai số liệu.
- **Giới hạn xác minh (không phải sai số):** T5-160 xác minh
  boot #61 bằng 5 nguồn độc lập (boot_id, btime, uptime -s,
  journal first entry, /proc/1 mtime); kiểm tra đồng hồ so với
  Cloudflare (±1 s @05:39Z) dựa trên đo độc lập của T0-160 —
  T5 không đo lại Cloudflare trong phiên này. Btime #60
  (03:05:59Z) lấy từ cờ T10-159 + task, không xác minh độc lập
  được từ #61 (journal volatile).
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-160.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (52c957d5, btime
  05:25:49Z) — và KHỚP xác minh độc lập 7 nguồn của T0-160.
  Exec khởi động watcher lần này KHÔNG báo output_drain_timeout
  (nhờ nohup redirect ra file; watcher chạy đúng: START
  05:41:26Z pid 4539 + FLAG-WRITTEN 05:52:59Z + poll đều sau đó).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t5/t5-stats-160.py`
(output đầy đủ lưu tại `t5-stats-160-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 06:15:52Z, SAU khi cờ POSTBOOT_PASS #61
đã ghi; F-160-T5-1: dòng sampler_proc trong §7 tự khớp shell
exec của T5 — bằng chứng thật là file ram-sampler.log 37 mẫu
boot 52c957d5 + b2-watcher pid 3458).
Trích nguyên văn các phần chính (xem file output đầy đủ để
đối chiếu):

```
=== PHU LUC SO LIEU T5-160 (trich bang script, 2026-11-21T06:15:52Z) ===

--- 1. Boot hien tai ---
boot_id=52c957d5-a8dd-4523-822f-acfcde535d3b
btime_epoch=1795238749 = 2026-11-21T05:25:49Z
uptime_s=3003.04 now=2026-11-21T06:15:52Z
/proc/1 mtime=2026-11-21 05:26:00.456251927 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 52c957d5a8dd4523822facfcde535d3b Sat 2026-11-21 05:26:00 UTC Sat 2026-11-21 06:15:12 UTC

--- replay-watch-159.log ---
tong_dong=56
START=1 poll=51 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-159-START 2026-11-21T02:41:21Z pid=18158 boot=eec65561 btime=2026-11-21 01:33:47Z end=2026-11-21T05:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=c65f523c init_mtime=01:36:23Z cache=178 lists=39 gst_sys=269
dong_cuoi: 2026-11-21T03:06:26Z boot=eec65561 poll dpkg_lines=1545 md5=c65f523c apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39
boot_xuat_hien=['eec65561']
mtime_log=2026-11-21T03:06:26Z size=6967

--- replay-watch-160.log ---
tong_dong=74
START=1 poll=69 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-160-START 2026-11-21T05:41:26Z pid=4539 boot=52c957d5 btime=2026-11-21 05:25:49Z end=2026-11-21T08:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=88334c78 init_mtime=05:35:40Z cache=0 lists=3 gst_sys=0
dong_cuoi: 2026-11-21T06:15:32Z boot=52c957d5 poll dpkg_lines=1545 md5=3411a9cc apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=71
boot_xuat_hien=['52c957d5']
mtime_log=2026-11-21T06:15:32Z size=9172

--- 2c. POSTBOOT_PASS cho #60 (e590ae0a) ---
file_chua_e590ae0a=replay-watch-160.sh, t5-stats-160.py, t5-stats-160-mid.txt (chi la tham chieu lich su do T5 viet — xem F-160-T5-2)
  round160-t5/POSTBOOT_PASS: CO (la co #61, 05:52:59Z)
  round160-t5/POSTBOOT_PASS-e590ae0a: KHONG CO
  round159-t5/POSTBOOT_PASS: CO (la co #59, 02:41:22Z)
  round159-t5/POSTBOOT_PASS-e590ae0a: KHONG CO

--- 3. round160-t5/POSTBOOT_PASS (mtime 2026-11-21T05:52:59Z) ---
boot 52c957d5-a8dd-4523-822f-acfcde535d3b (btime 2026-11-21 05:25:49Z; watcher-160) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 71; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T05:52:59Z; POSTBOOT_PASS moi ghi 2026-11-21T05:52:59Z poll=0 (replay-day-du); co cu eec65561 luu POSTBOOT_PASS-eec65561

--- 3. round159-t5/POSTBOOT_PASS (mtime 2026-11-21T02:41:22Z) ---
boot eec65561-8a81-4f1a-99d6-a1ea81606127 (btime 2026-11-21 01:33:47Z; watcher-159) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T02:41:22Z; POSTBOOT_PASS moi ghi 2026-11-21T02:41:22Z poll=0 (replay-day-du); co cu 28366bd0 luu POSTBOOT_PASS-28366bd0

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=3411a9cc mtime=2026-11-21 05:52:06.321214277 +0000
cache_deb=178 lists_entries=71
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
ENOSPC_dong=18
journal_dong=211

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          818016 kB
MemAvailable:    2184024 kB
loadavg=1.95 1.47 1.47 1/455 43474
sampler round160-t9/ram-sampler.log: tong_mau=37 dau=2026-11-21T05:39:41 cuoi=2026-11-21T06:15:42Z boot=52c957d5 mem=2258668 bal=4621156 swapfree=605260 load1=2.31
sampler_proc=(co dong tu khop shell exec cua T5 — xem F-160-T5-1; bang chung that: ram-sampler.log 37 mau + b2-watcher pid 3458)
b2_watcher_proc=3458 bash round160-t9/b2-watcher.sh

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

--- 9. Co round160 .done (luc 06:15:52Z) ---
round160-t0.done (05:41:55Z), round160-t1.done (05:50:48Z), round160-t2.done (06:09:58Z), round160-t4.done (06:10:14Z), round160-t6.done (05:55:16Z)

=== HET PHU LUC T5-160 2026-11-21T06:15:52Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-52c957d5.log`,
06:15:52Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.6):

```
[postboot 2026-11-21 05:25:49] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 05:25:49] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 05:25:49] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 05:25:49] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 05:25:49] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 05:25:49] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 05:25:49] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 05:25:49)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round160-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t5/`
  (không nằm trong repo nên không stage): `replay-watch-160.sh`,
  `t5-stats-160.py`, `t5-stats-160-output.txt`,
  `t5-stats-160-mid.txt`, `replay-watch-160.log`,
  `replay-watch-160.nohup.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-eec65561`,
  `t5-postboot-poll0-52c957d5.log`,
  `t5-postboot-independent-52c957d5.log`.
