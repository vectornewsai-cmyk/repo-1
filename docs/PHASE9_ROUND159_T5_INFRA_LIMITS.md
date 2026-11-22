# PHASE9_ROUND159_T5_INFRA_LIMITS — WATCHER-159 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #59 CÓ (BOOT+67M35S); REPLAY #59 NHANH NHẤT TỪ TRƯỚC; MARKER SỐNG QUA 11 REBOOT

> Luồng T5, đợt 159, lượt cron 09:35 +07 21/11/2026 (mở
> 02:35:51Z; T5 mở thực tế ~02:38Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #59
> eec65561-8a81-4f1a-99d6-a1ea81606127** (btime **01:33:47Z** —
> /proc/stat btime 1795224827; `uptime -s` 01:33:47Z; /proc/1
> 01:33:58Z (+11 s — cùng mẫu lệch, KHÔNG phải btime); journal
> first entry 01:33:59Z (+12 s); **T5 tự xác minh độc lập 4 nguồn** —
> T0-159 xác minh độc lập 6 nguồn và KHỚP (btime, boot_id, uptime,
> journal idx0 duy nhất, wtmp 1 entry, /proc/1 — xem cờ
> round159-t0.done)).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156, (o) đợt 157, (o) đợt 158):
> KHÔNG cài unit, KHÔNG thử lại (1)/(2).** Watcher-158 pid 10867
> CHẾT theo reboot #59 (log dừng 01:34:06Z, poll cuối boot
> 28366bd0, 0 NEWBOOT — xem §4; **mâu thuẫn ghi nhận với T0-159**:
> T0 ghi "chết tự nhiên, không do reboot" — bằng chứng log của T5
> ủng hộ chết theo reboot; giao T10 phán, xem F-159-T5-3).
> **Watcher-159 khởi động bằng tay 02:41:21Z, pid 18158** (§3).
> **POSTBOOT_PASS cho #59 ĐÃ GHI 02:41:22Z (boot+67m35s, mode
> replay-day-du, poll=0)** — cờ MUỘN hơn #58 (boot+37m14s) KHÔNG
> phải vì replay chậm mà vì phiên 159 mở muộn (replay #59 xong
> từ boot+2m36s — NHANH NHẤT từ trước, §3.1). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 11 REBOOT LIÊN TIẾP
> #49–#59** (§2.1; T0-159 xác minh độc lập và KHỚP). **KHÔNG push.
> KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc T9). KHÔNG
> đụng file workflow (ci-security.yml vẫn 403 chờ user). TTS 39
> CẤM kiểm lại.

## 1. Timeline (giờ UTC, 21/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 23:06:08Z 20/11 | **Reboot #58, boot 28366bd0** (btime — T5-158 xác minh 4 nguồn) |
| 23:43:22Z 20/11 | POSTBOOT_PASS #58 ghi (watcher-158, replay-day-du, poll=0) |
| 01:33:47Z | **Reboot #59, boot eec65561** (btime /proc/stat 1795224827) — #58 sống 8.844 s (~2h27m39s) |
| 01:34:06Z | Watcher-158 poll cuối (đồng hồ boot cũ) — vẫn boot 28366bd0, 0 NEWBOOT; CHẾT theo #59 |
| 01:34:22Z | Hoạt động dpkg đầu trên #59 (**boot+35s — NHANH NHẤT từng ghi**) |
| 01:36:23Z | dpkg.log #59 xong: 1.545 dòng (boot+2m36s) — replay hoàn tất |
| ~02:25Z | T10-158 đóng sổ đợt 158 (round158-t10.done mtime 02:24:48Z — theo T0-159) |
| 02:35:51Z | Lượt cron đợt 159 mở |
| ~02:38Z | T5-159 mở: boot eec65561, uptime ~65', **không watcher nào chạy**; không POSTBOOT_PASS cho #59; replay ĐÃ XONG trên boot này |
| 02:41:21Z | **Watcher-159 START (bằng tay, bash显式 + setsid nohup), pid 18158, boot eec65561** |
| 02:41:21Z | REPLAY_DONE (dpkg 1.545 ổn định, 0 proc) → postboot poll0 exit=0 |
| 02:41:22Z | **FLAG-WRITTEN: POSTBOOT_PASS boot eec65561** (poll=0, replay-day-du) — boot+67m35s |
| 02:41:24Z | T0-159 đóng cờ (ghi POSTBOOT_PASS #59 "chưa có" — đua giờ ~giây với FLAG-WRITTEN 02:41:22Z, xem F-159-T5-4) |
| 02:42:29Z | Stats script + postboot độc lập T5: exit 0, 11/11 gói + 5/5 lib, GST 269, cache 178, lists 39, ENOSPC 58 dòng (số riêng T5) |
| 02:42:48Z | Kiểm cuối: vẫn boot eec65561, watcher-159 pid 18158 đang poll đều (poll cuối 02:42:22Z, đúng chu kỳ 30 s) |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156 +
(o) đợt 157 + (o) đợt 158: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra
watcher lúc mở, T5 khởi động lại bằng tay. T5-159 kiểm tra lại
nhanh `systemctl is-active` (§A.8): user@0/logind/dbus vẫn
inactive, không linger, không cron, không /run/user/0 — cell
không đổi, kết luận đợt 154/155/156/157/158 giữ nguyên (lần
kiểm tra lại thứ sáu liên tiếp). Unit + script ở `round154-t5/`
GIỮ LẠI cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 11 REBOOT LIÊN TIẾP #49–#59

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156/157/158; không thuộc phạm vi T5-159) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#59 (11 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (10 reboot ở đợt 158 →
  11 reboot đợt này). Home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rebuild — khẳng định lần thứ
  mười một liên tiếp. **T0-159 xác minh độc lập và KHỚP**
  ("Marker persistence còn (sống qua 11 reboot #49–#59)").

## 3. Watcher-159 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (~02:38Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `ps -p 10867`: không có tiến trình). Ghi vào
  `round159-t5/watcher-status-at-open.txt`. **T0-159 xác minh
  độc lập và KHỚP** ("Watcher: 0 lúc mở và lúc đóng").
  Watcher-158 pid 10867 đã chết theo reboot #59 (log dừng
  01:34:06Z, poll cuối boot 28366bd0, 0 NEWBOOT — xem §4).
- **Khởi động bằng tay 02:41:21Z, pid 18158** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-159-START 2026-11-21T02:41:21Z pid=18158
  boot=eec65561 btime=2026-11-21 01:33:47Z end=2026-11-21T05:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=c65f523c init_mtime=01:36:23Z cache=178 lists=39 gst_sys=269`
- **Thay đổi so với watcher-158 (3 điểm):**
  1. END = 05:30:00Z 21/11 (hạn cứng đợt 159 theo task); DIR =
     round159-t5, OLD_T5_DIR = round158-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #59 + trạng thái replay ĐÃ
     XONG lúc khởi động (dpkg 1.545 dòng, mtime 01:36:23Z =
     boot+2m36s, hoạt động đầu 01:34:22Z = boot+35s — NHANH
     NHẤT từng ghi) — dự kiến REPLAY_DONE ngay, không phải
     EARLY-REPAIR.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Thêm mục 2b trong stats
     script: đếm log watcher-159 hiện tại.
- **Bài học sed (F-157-T5-3, suýt lặp lại — xem F-159-T5-2):**
  sed 158→159 để lại OLD_T5_DIR=round157-t5 (sed chỉ đổi 158,
  tham chiếu cũ là 157) + header comment còn ghi boot #58 —
  đã sửa tay + đọc lại toàn bộ script TRƯỚC khi khởi động
  watcher (grep kiểm + `bash -n` syntax OK). Lần này KHÔNG
  để lọt lỗi nào vào script đã chạy.
- **Poll đều đã xác minh:** 02:41:21Z, 02:41:52Z, 02:42:22Z
  — đúng chu kỳ 30 s, không trượt poll (kiểm cuối 02:42:48Z,
  pid 18158 elapsed 01:27, PPID 1).

### 3.1 POSTBOOT_PASS cho #59 — HOÀN TẤT QUA REPLAY ĐẦY ĐỦ (KHÔNG REPAIR)

- **Replay của cell trên #59: NHANH NHẤT từng ghi.** Hoạt động
  dpkg đầu 01:34:22Z (**boot+35s** — nhanh nhất: #58 boot+42s,
  #49 boot+44s, #50 boot+~53s, #52 boot+16m34s, #56
  boot+62m53s); xong 01:36:23Z (**boot+2m36s** — cũng nhanh hơn
  #58 boot+2m43s); dpkg **1.545 dòng** (md5 c65f523c);
  breakdown **169 install / 9 upgrade / 178 configure — KHỚP
  CHÍNH XÁC replay đầy đủ của #56/#58** (cùng tập gói; md5 khác
  do thời gian); gói cuối gstreamer1.0-tools 01:36:23Z. Cache
  APT 178 .deb SỐNG qua reboot (RV-backed). Lists **39**
  (tăng từ 37 trên #58 — +2 entry). GST hệ thống 269.
- **Poll đầu 02:41:21Z: REPLAY_DONE ngay** (dpkg 1.545 > 100,
  ổn định, 0 proc) → postboot check-only poll0 **exit=0**
  (hoàn tất 02:41:22Z). **KHÔNG repair** — không cần (dpkg
  >100, đã ổn định; EARLY-REPAIR=0 trong log).
- **FLAG-WRITTEN 02:41:22Z** (`round159-t5/POSTBOOT_PASS`):
  `boot eec65561-8a81-4f1a-99d6-a1ea81606127 (btime 2026-11-21
  01:33:47Z; watcher-159) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc
  2026-11-21T02:41:22Z; POSTBOOT_PASS moi ghi 2026-11-21T02:41:22Z
  poll=0 (replay-day-du); co cu 28366bd0 luu POSTBOOT_PASS-28366bd0`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-28366bd0` đã đối chiếu
  bằng `diff` — KHỚP cờ #58 gốc (round158-t5).
- **Cờ lúc 02:41:22Z = boot+67m35s — MUỘN hơn #58
  (boot+37m14s) nhưng KHÔNG phải do replay chậm:** replay xong
  boot+2m36s; phiên 159 mở 02:35:51Z (boot+62m04s) + ~5,5 phút
  tới khi watcher chạy. Cửa sổ hở của hướng (3) ở #59 là
  **~67 phút tới khi có cờ** — dài nhất kể từ #56 (~82 phút),
  nguyên nhân là phiên mở muộn so với reboot, không phải
  replay. Thiệt hại đo được: KHÔNG có — cờ có trước khi
  T4/T8-159 cần gate0 (T8-159 mới đang chuẩn bị O8 lúc
  T0-159 đóng cờ).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script (§A, 02:42:29Z) + postboot độc lập
  (`t5-postboot-independent-eec65561.log`, exit 0, 02:42:29Z):
  wrapper PASS, libs PASS đủ 5, GST PASS (269 = debroot 269,
  đủ isomp4 + libav), apt PASS đủ 11 package, KẾT LUẬN "DU
  DIEU KIEN chay WebKit". **11/11 gói installed, 5/5 lib CÓ.**
- **Phối hợp T4/T8-159:** poller T4-159 + harness T8-159 đọc
  `round159-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  02:41:22Z, TRƯỚC khi các luồng khác cần gate0.

## 4. Boot #59 — watcher-158 chết theo reboot; nghịch lý đồng hồ ≥ +19 s; mâu thuẫn ghi nhận với T0-159

- **Boot #59 (eec65561-8a81-4f1a-99d6-a1ea81606127, btime
  01:33:47Z): CÓ cờ** (watcher-159, 02:41:22Z, §3.1). Sống
  từ 01:33:47Z tới nay (uptime 4.121,6 s lúc 02:42:29Z).
- **Watcher-158 pid 10867 CHẾT theo reboot #59 — bằng chứng
  log của T5:** `replay-watch-158.log` 227 dòng, 222 poll,
  0 NEWBOOT, 1 FLAG-WRITTEN; dòng cuối **01:34:06Z boot
  28366bd0** (poll bình thường, dpkg 1.545 ổn định); **KHÔNG
  có dòng REPLAY-WATCH-158-END** (hạn 02:30:00Z chưa tới) và
  **KHÔNG có dòng watcher-stop** — watcher không thoát tự
  nhiên theo logic script mà dừng giữa chu kỳ poll, đúng lúc
  boot đổi. Đây là cùng mẫu watcher-157/#57 (log dừng
  21:05:40Z, 0 NEWBOOT).
- **Nghịch lý đồng hồ #59 ≥ +19 s — T5 xác nhận:** poll cuối
  watcher-158 **01:34:06Z (đồng hồ boot cũ) vẫn thấy boot
  28366bd0** trong khi btime #59 là 01:33:47Z (19 s TRƯỚC poll
  đó). Đồng hồ boot cũ chạy nhanh ≥19 s so với giờ thật
  (cùng chiều #57 ≥ +25 s, #58 ~+28 s theo F-157-T8-3).
  Btime #59 = GIỜ THẬT đã được T0-159 xác minh độc lập 6
  nguồn (trong đó Cloudflare ±1 s). T5 không phán thêm về mô
  hình đồng hồ (Model 1 vs Model 2) — giao T2-159.
- **Mâu thuẫn ghi nhận với T0-159 (F-159-T5-3):** cờ
  round159-t0.done ghi "Cả 2 watcher đợt 158 (pid 9792 T9,
  pid 10867 T5) đã chết tự nhiên, không do reboot". Bằng chứng
  log của T5 (dừng giữa poll 01:34:06Z, không dòng END,
  0 NEWBOOT, đúng lúc boot đổi) ủng hộ **chết theo reboot**,
  không phải chết tự nhiên. T5 KHÔNG tự phán T0 sai — có thể
  T0 có căn cứ khác (file làm việc của T0 không nằm trong cờ)
  — **giao T10-159 phán**, ghi nhận cả hai phía. Điểm này
  không ảnh hưởng cờ #59 hay watcher-159.
- **Boot #58 (28366bd0): POSTBOOT_PASS VẪN CÒN trên đĩa** —
  `round158-t5/POSTBOOT_PASS`, mtime 23:43:22Z; bản sao đã lưu
  `round159-t5/POSTBOOT_PASS-28366bd0` (đã đối chiếu bằng
  `diff`, khớp). Cờ #56 (round157-t5, 20:54:39Z) không kiểm
  lại đợt này (đã xác minh ở đợt 158).
- **Boot #57:** vẫn KHÔNG CÓ cờ, không bù được (theo T5-158
  §4; không có dữ kiện mới đợt này).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 159

- T0-159 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-159
  xác minh độc lập "Watcher: 0 lúc mở và lúc đóng" — KHỚP
  với T5. T5 tự khởi động lại pid 18158 ~02:41Z (ghi trong
  `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #59: ~67 phút tới cờ — DÀI hơn #58
  (~37 phút)** vì phiên mở muộn (boot+62m04s), không phải vì
  replay chậm (replay xong boot+2m36s). Đây là khoảng hở đã
  biết của hướng (3): cờ chỉ có khi có phiên T5 sau reboot.
  #57 vẫn là boot lọt hoàn toàn không cờ gần nhất — #59 ĐÃ
  BẮT ĐƯỢC nhờ phiên 159 mở trong lúc #59 còn sống.
- **Watcher-159 tiếp tục giám sát tới 05:30:00Z**; nếu có reboot
  #60 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-160 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-159 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **1.502.824 kB @02:42:29Z**; MemFree 304.556 kB.
  loadavg 4,27 @02:42:29Z. Sampler T9-159 ĐANG CHẠY
  (ram-sampler.log 3 mẫu 02:39:46–02:41:46Z, boot eec65561,
  bal=5.516.256); b2-watcher pid 12484 đang chạy.
- **ENOSPC journal boot #59:** **58 dòng** lúc 02:42:29Z
  (journal 294 dòng — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-159 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. So sánh: #58 có 34 dòng lúc T5-158 đo
  (23:46:39Z); #57 có 90 dòng lúc T9-157 đóng (22:48:34Z).
- **Không reboot mới trong phiên T5** (boot vẫn eec65561 lúc
  kiểm cuối 02:42:48Z — KHÔNG có #60; watcher-159 tiếp tục
  giám sát tới hạn cứng 05:30:00Z).
- **journal_boots chỉ còn 1 boot (#59):** journal của #58
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 160 (từ T5-159)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 11 reboot
   #49–#59. T5-160 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #59 — XONG 02:41:22Z** (watcher-159,
   replay-day-du, poll=0; T4/T8-159 phối hợp qua cờ).
   Watcher-159 tiếp tục giám sát tới 05:30:00Z; nếu có reboot
   #60 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-160 kiểm tra log.
4. **POSTBOOT_PASS #57 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (cùng tiền lệ #51/#53/#54/#55 theo quyết (o) đợt 156).
   T8-157 đã tự kiểm đầy đủ + O8 3/3 PASS trên #57 — dữ kiện
   đầy đủ, chỉ thiếu cờ watcher.
5. **Mâu thuẫn ghi nhận watcher-158 chết tự nhiên vs chết theo
   reboot (F-159-T5-3)** — giao T10-159 phán (xem §4).
6. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 + log độc lập đợt này —
   header log ghi boot e9295700/2e430750 đợt 151 trong khi
   checks là của #59): T5 đợt sau quyết có cập nhật theo Dot
   hay không. Đây là nợ thẩm mỹ trong log header, không ảnh
   hưởng kết quả check.
7. **Cửa sổ hở hướng (3) dài nhất kể từ #56: ~67 phút tới cờ
   #59** (phiên mở muộn boot+62m04s). Nếu phiên sau mở muộn
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
   birefnet. Run 158 thuộc T7-159 (kết cục + #59 có phải điểm
   (m) thứ 17/18 không — xem LIMITS T7-158/T10-158; #59 có
   viết lại run 158 không thuộc T7-159).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này replay nhanh nhất
  từng ghi (boot+35s → boot+2m36s) và #59 đã bắt được cờ,
  khác #57 lọt hoàn toàn; nhưng cửa sổ hở tới cờ dài ~67 phút
  vì phiên mở muộn — đó là giới hạn cấu trúc của hướng (3),
  không phải lỗi replay. T5 không tự chọn hướng mới.
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ sáu liên tiếp.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #57 từ log của
  T8-157** (xem §4) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #57 theo
  cách khác, đó là quyết của parent, T5 không tự ghi.
- **Mâu thuẫn F-159-T5-3 giao T10-159 phán** (xem §4) — T5
  giữ bằng chứng log, không tự kết luận T0 sai.

## 9. Sai số của chính T5-159

- **F-159-T5-1 — `pgrep -f 'replay-watch-159.sh'` tự khớp shell
  exec của chính T5** (cùng họ F-156-T5-1/F-157-T5-1/F-158-T5-1).
  Sau khởi động watcher, pgrep trả pid 18157 là shell exec của
  chính T5 (cmdline chứa chuỗi tìm kiếm); watcher thật là pid
  18158 (log START + `ps -p 18158` elapsed 01:27, PPID 1). Cùng
  họ trong stats §7: dòng sampler_proc chỉ chứa `/bin/sh -c
  pgrep -af ram-sampler` — bằng chứng thật là file
  ram-sampler.log (3 mẫu, boot eec65561) + b2-watcher pid 12484
  (cmdline là đường dẫn script). Bài học giữ nguyên: luôn neo
  pid trực tiếp + đối chiếu log/file, không tin mù pgrep.
- **F-159-T5-2 — sed 158→159 để lại OLD_T5_DIR=round157-t5 +
  header comment còn ghi boot #58** (sed chỉ đổi 158; tham
  chiếu cũ là 157; header là văn bản tự do). Đã sửa tay +
  đọc lại toàn bộ script TRƯỚC khi khởi động watcher (grep
  kiểm + `bash -n` syntax OK) — lần này KHÔNG để lọt lỗi nào
  vào script đã chạy (tránh được họ F-157-T5-3). Bài học bổ
  sung: sau sed đổi số đợt, grep riêng `round15[0-9]` và đọc
  lại header comment — sed không sửa được văn bản tự do.
- **F-159-T5-3 — Mâu thuẫn ghi nhận với T0-159 về cái chết
  của watcher-158** (xem §4): T0 ghi "chết tự nhiên, không do
  reboot"; log của T5 (dừng giữa poll 01:34:06Z, không dòng
  END, 0 NEWBOOT, đúng lúc boot đổi) ủng hộ chết theo reboot
  #59. T5 ghi nhận cả hai phía, giao T10-159 phán — không tự
  kết luận T0 sai (file làm việc của T0 không nằm trong cờ).
- **F-159-T5-4 — Đua giờ ~giây với cờ T0-159:** T0 đóng cờ
  02:41:24Z ghi POSTBOOT_PASS #59 "chưa có" trong khi
  FLAG-WRITTEN của watcher-159 là 02:41:22Z (2 giây trước).
  T0 kiểm tra cờ trước 02:41:22Z — không phải mâu thuẫn nội
  dung, chỉ là thứ tự kiểm tra. Ghi nhận để T10 khỏi nhầm là
  hai cờ vênh nhau.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-159.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (eec65561, btime
  01:33:47Z) — và KHỚP xác minh độc lập 6 nguồn của T0-159.
  Exec khởi động watcher lần này KHÔNG báo output_drain_timeout
  (khác F-158-T5-2 — nhờ nohup redirect ra file; watcher chạy
  đúng: START 02:41:21Z pid 18158 + FLAG-WRITTEN 02:41:22Z +
  poll đều sau đó).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t5/t5-stats-159.py`
(output đầy đủ lưu tại `t5-stats-159-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 02:42:29Z, SAU khi cờ POSTBOOT_PASS #59
đã ghi; F-159-T5-1: dòng sampler_proc trong §7 tự khớp shell
exec của T5 — bằng chứng thật là file ram-sampler.log 3 mẫu
boot eec65561 + b2-watcher pid 12484).
Trích nguyên văn các phần chính:

```
=== PHU LUC SO LIEU T5-159 (trich bang script, 2026-11-21T02:42:29Z) ===

--- 1. Boot hien tai ---
boot_id=eec65561-8a81-4f1a-99d6-a1ea81606127
btime_epoch=1795224827 = 2026-11-21T01:33:47Z
uptime_s=4121.6 now=2026-11-21T02:42:29Z
/proc/1 mtime=2026-11-21 01:33:58.779028776 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 eec655618a814f1a99d6a1ea81606127 Sat 2026-11-21 01:33:59 UTC Sat 2026-11-21 02:41:58 UTC

--- 2. replay-watch-158.log ---
tong_dong=227
START=1 poll=222 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-158-START 2026-11-20T23:43:21Z pid=10867 boot=28366bd0 btime=2026-11-20 23:06:08Z end=2026-11-21T02:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=e7b99933 init_mtime=23:08:51Z cache=178 lists=37 gst_sys=269
dong_cuoi: 2026-11-21T01:34:06Z boot=28366bd0 poll dpkg_lines=1545 md5=e7b99933 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37
boot_xuat_hien=['28366bd0']
mtime_log=2026-11-21T01:34:06Z size=28000

--- 2b. replay-watch-159.log ---
tong_dong=8
START=1 poll=3 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-159-START 2026-11-21T02:41:21Z pid=18158 boot=eec65561 btime=2026-11-21 01:33:47Z end=2026-11-21T05:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=c65f523c init_mtime=01:36:23Z cache=178 lists=39 gst_sys=269
dong_cuoi: 2026-11-21T02:42:22Z boot=eec65561 poll dpkg_lines=1545 md5=c65f523c apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=39
boot_xuat_hien=['eec65561']
mtime_log=2026-11-21T02:42:22Z size=1063

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t5/POSTBOOT_PASS (mtime 2026-11-21T02:41:22Z) ---
boot eec65561-8a81-4f1a-99d6-a1ea81606127 (btime 2026-11-21 01:33:47Z; watcher-159) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T02:41:22Z; POSTBOOT_PASS moi ghi 2026-11-21T02:41:22Z poll=0 (replay-day-du); co cu 28366bd0 luu POSTBOOT_PASS-28366bd0

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t5/POSTBOOT_PASS (mtime 2026-11-20T23:43:22Z) ---
boot 28366bd0-d6d6-4a50-a386-666c0aa3c062 (btime 2026-11-20 23:06:08Z; watcher-158) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-20T23:43:22Z; POSTBOOT_PASS moi ghi 2026-11-20T23:43:22Z poll=0 (replay-day-du); co cu 348dab54 luu POSTBOOT_PASS-348dab54

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=c65f523c mtime=2026-11-21 01:36:23.850898210 +0000
cache_deb=178 lists_entries=39
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
ENOSPC_dong=58
journal_dong=294

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          304556 kB
MemAvailable:    1502824 kB
loadavg=4.27 2.31 1.04 3/481 25469
sampler /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t9/ram-sampler.log: tong_mau=3 dau=2026-11-21T02:39:46 cuoi=2026-11-21T02:41:46Z boot=eec65561 mem=1243732 bal=5516256 swapfree=716056 load1=4.75
sampler_proc=25470 /bin/sh -c pgrep -af ram-sampler 2>/dev/null
b2_watcher_proc=12484 bash /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t9/b2-watcher.sh
25472 /bin/sh -c pgrep -af b2-watcher 2>/dev/null

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

--- 9. Co round159 .done ---
-rw-rw---- 1 root nogroup 1550 2026-11-21T02:41:24Z /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t0.done
round159-t0.done
round159-t1
round159-t2
round159-t4
round159-t5
round159-t6
round159-t7
round159-t8
round159-t9

=== HET PHU LUC T5-159 2026-11-21T02:42:29Z ===
```

Log postboot độc lập của T5 (`t5-postboot-independent-eec65561.log`,
02:42:29Z, exit 0 — trích phần check; header log còn ghi Dot 151,
xem §7.6):

```
[postboot 2026-11-21 01:33:47] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-21 01:33:47] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-21 01:33:47] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-21 01:33:47] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-21 01:33:47] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-21 01:33:47] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-21 01:33:47] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-21 01:33:47)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round159-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t5/`
  (không nằm trong repo nên không stage): `replay-watch-159.sh`,
  `t5-stats-159.py`, `t5-stats-159-output.txt`,
  `replay-watch-159.log`, `replay-watch-159.nohup.log`,
  `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-28366bd0`,
  `t5-postboot-poll0-eec65561.log`,
  `t5-postboot-independent-eec65561.log`.
