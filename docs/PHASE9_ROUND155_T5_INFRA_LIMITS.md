# PHASE9_ROUND155_T5_INFRA_LIMITS — WATCHER-154 CHẾT THEO #49; WATCHER-155 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #49 QUA REPLAY (KHÔNG REPAIR); MARKER SỐNG QUA #49

> Luồng T5, đợt 155, lượt cron 21:35 +07 20/11/2026 (mở 14:35:51Z;
> T5 mở thực tế ~14:39:50Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #49
> 12fc68a3-10f4-4459-908f-b0a47615afae** (btime **13:05:12Z** —
> /proc/stat btime 1795179912; `uptime -s` 13:05:12Z; /proc/1
> 13:05:29Z — khớp).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) LÀM HƯỚNG ĐỨNG (quyết (e) đợt 154):
> KHÔNG cài unit, KHÔNG thử lại (1)/(2).** T5-155 kiểm tra lại
> nhanh `systemctl is-active` (§2): user@0/logind/dbus vẫn
> inactive, không linger, không cron — cell không đổi, kết luận
> đợt 154 giữ nguyên. Watcher-154 CHẾT theo reboot #49 (không
> NEWBOOT, poll cuối 13:05:31Z vẫn boot cũ); **watcher-155 khởi
> động bằng tay 14:42:36Z, pid 26066** (§3). **POSTBOOT_PASS cho
> #49 ĐÃ GHI 14:42:38Z (boot+1h37m26s, mode replay-day-du, poll=0)
> — KHÔNG cần repair** (§3.1): replay #49 tự tiến triển đầy đủ
> (dpkg 1545 dòng, 11/11 gói, 5/5 lib, GST 269). **Marker
> persistence `~/.config/vcut-persistence-marker` SỐNG QUA reboot
> #49** — bằng chứng trực tiếp đầu tiên cho persistence (§2.1).
> **KHÔNG push. KHÔNG release/tag.** KHÔNG tự chạy birefnet
> (thuộc T9). KHÔNG đụng file workflow (ci-security.yml vẫn 403
> chờ user). TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 20/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 11:26:05Z | Reboot #48, boot 2c0a7985 (btime; T10-154) |
| 11:58:26Z | POSTBOOT_PASS #48 ghi bởi watcher-154 (repair-som-quyet-h) |
| 13:05:12Z | **btime boot 12fc68a3 (#49)** — GIỮA phiên đợt 154 |
| 13:05:31Z | Poll cuối watcher-154 (vẫn boot 2c0a7985 trong log — xem §4); watcher chết theo #49, KHÔNG dòng NEWBOOT |
| 13:05:56Z | dpkg.log #49: 2 dòng startup configure đầu tiên (boot +44s) |
| 13:06:44Z | dpkg.log #49: bắt đầu unpack (boot +1m32s) |
| 13:11:06Z | dpkg.log #49: gói cuối gstreamer1.0-tools installed — replay xong (boot +5m54s) |
| 13:31:06Z | T8-154 tự kiểm postboot boot #49 (theo MEMORY; T10 chưa xác minh độc lập) — KHÔNG ghi cờ POSTBOOT_PASS |
| 14:35:51Z | Lượt cron đợt 155 mở |
| ~14:39:50Z | T5-155 mở: boot 12fc68a3, uptime ~1h34', **không watcher nào chạy** |
| 14:42:36Z | **Watcher-155 START (bằng tay, nohup), pid 26066, boot 12fc68a3** |
| 14:42:36Z | Watcher poll đầu: REPLAY_DONE (dpkg 1545 dòng ổn định) → postboot poll0 |
| 14:42:38Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 12fc68a3** (poll=0, replay-day-du) |
| 14:43:16Z | Stats script lần 1: 11/11 gói + 5/5 lib, dpkg 1545 md5 19522dc0 ổn định, GST 269, cache 178, lists 37 |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154: **CHẤP NHẬN (3) LÀM HƯỚNG ĐỨNG** —
quy tắc đứng "T0 kiểm tra watcher lúc mở". T5-155 KHÔNG cài unit,
KHÔNG thử lại (1)/(2), KHÔNG theo hướng watcher chạy tay dài hơi
hơn hay cron ngoài cell. Unit + script ở `round154-t5/` GIỮ LẠI
cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA REBOOT #49 (bằng chứng trực tiếp đầu tiên)

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau reboot #49; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | mtime 2026-11-20 10:32:15Z (đợt 154) — vẫn còn |
| `~/.config/google-chrome-for-testing` | mtime 2026-10-24 05:03Z (đợt 154) — vẫn còn |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49** — đây là bằng chứng trực tiếp đầu
  tiên (đợt 154 chỉ có bằng chứng gián tiếp từ file Oct 24–Nov
  11). Home (`/home/hatch`, gồm `~/.config/` và `~/workspace/`)
  PERSISTENT qua rebuild — khẳng định lần thứ hai liên tiếp.
  Nửa đầu của điều kiện phương án (1) vẫn ĐẠT về mặt lưu trữ,
  nhưng nửa sau vẫn CHẾT (§2.2) nên (1) vẫn không triển khai được.

### 2.2 `systemctl --user` / cron — cell KHÔNG đổi (kiểm tra lại nhanh, không thử start)

| Kiểm tra | Kết quả |
|---|---|
| `systemctl is-active user@0.service` | `inactive` |
| `systemctl is-active systemd-logind` | `inactive` |
| `systemctl is-active dbus.service dbus.socket` | `inactive` / `inactive` |
| `systemctl --user status` (XDG_RUNTIME_DIR=/run/user/0) | `Failed to connect to bus: No such file or directory` |
| `loginctl show-user root` | `Failed to connect to bus: No such file or directory` |
| `/var/lib/systemd/linger/` | **Không tồn tại** |
| `systemctl status cron` | `Unit cron.service could not be found.` |
| `which cron crond` | Rỗng |

- **Kết luận 2.2:** cell không thay đổi so với đợt 154 — user
  manager vẫn không chạy, không D-Bus/logind, không linger,
  không cron. **(1) và (2) vẫn CHẾT; (3) vẫn là hướng đứng.**
  T5-155 KHÔNG chạy `systemctl start user@0` lần nữa (đã có kết
  quả đợt 154; task cấm thử lại (1)).

## 3. Watcher-155 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (14:39:50Z): KHÔNG watcher nào chạy**
  (`ps` grep replay-watch/ram-sampler/b2-watcher: rỗng lúc mở;
  watcher-154 chết theo #49; ram-sampler + b2-watcher của T9-155
  chỉ khởi động sau đó — xem §6).
  Ghi vào `round155-t5/watcher-status-at-open.txt` cho T0-155
  (T0-155 chưa xuất hiện lúc T5 mở; thư mục round155-t0 chưa có
  lúc 14:39:50Z — T0 tự kiểm tra lại theo quy tắc (3); nếu T0 đọc
  note này thì ghi nhận "chết lúc mở, T5 khởi động lại bằng tay
  14:42:36Z").
- **Khởi động bằng tay 14:42:36Z, pid 26066** (setsid nohup,
  như watcher-154):
  `REPLAY-WATCH-155-START 2026-11-20T14:42:36Z pid=26066
  boot=12fc68a3 btime=2026-11-20 13:05:12Z end=2026-11-20T17:35:51Z
  interval=30s early_repair_at_boot+900s frozen>=600s
  init_lines=1545 init_md5=19522dc0 init_mtime=13:11:06Z cache=178
  lists=37 gst_sys=269`
- **Thay đổi so với watcher-154 (2 điểm):**
  1. END = 17:35:51Z (hạn cứng đợt 155 = mở +3h); DIR =
     round155-t5, OLD_T5_DIR = round154-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #49 + trạng thái replay đã
     đầy đủ lúc khởi động (dpkg 1545 dòng, không phải "2 dòng
     startup rồi im"); caveat cập nhật quyết (e) đợt 154.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll).

### 3.1 POSTBOOT_PASS cho #49 — HOÀN TẤT QUA REPLAY, KHÔNG REPAIR

- **Poll đầu 14:42:36Z: REPLAY_DONE ngay** (dpkg 1545 dòng =
  prev_lines khởi tạo, ổn định, 0 apt/dpkg proc) → postboot
  check-only poll0 **exit=0 (hoàn tất 14:42:38Z)**.
- **FLAG-WRITTEN 14:42:38Z** (`round155-t5/POSTBOOT_PASS`):
  `boot 12fc68a3-10f4-4459-908f-b0a47615afae (btime 2026-11-20
  13:05:12Z; watcher-155) — replay-day-du: dpkg 1545 dong;
  cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0
  luc 2026-11-20T14:42:38Z; POSTBOOT_PASS moi ghi
  2026-11-20T14:42:38Z poll=0 (replay-day-du); co cu 2c0a7985
  luu POSTBOOT_PASS-2c0a7985`.
- **Cờ lúc 14:42:38Z = boot+1h37m26s** — MUỘN hơn cờ #48
  (boot+32m21s) vì watcher-154 chết theo #49 và không ai ghi cờ
  cho #49 cho tới khi watcher-155 khởi động ở đợt 155. Đây
  chính là cửa sổ hở của hướng (3) mà quyết (e) đợt 154 đã
  chấp nhận là "khoảng hở đã biết": reboot #49 (13:05:12Z) →
  phiên 155 mở (14:35:51Z) ≈ 1h30m + ~7 phút tới khi watcher
  chạy. Không có thiệt hại đo được: replay #49 tự chạy xong
  từ 13:11:06Z (boot+5m54s), dpkg ổn định từ đó; T8-154 đã tự
  kiểm postboot 13:31:06Z.
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script lần 1 (14:43:16Z) + log poll0 (§A): wrapper PASS,
  libs PASS đủ 5, GST PASS (269 = debroot 269, đủ isomp4 +
  libav), apt PASS đủ 11 package, KẾT LUẬN "DU DIEU KIEN chay
  WebKit". **11/11 gói installed, 5/5 lib CÓ** (script §A lần 1).
- **So sánh #49 với #48 (cùng chữ ký dpkg sau đầy đủ):**
  dpkg **1545 dòng (#49) vs 795 dòng (#48)** — khác nhau vì
  replay #49 cài nhiều hơn (169 install / 9 upgrade / 178
  configure theo header log poll0 — xem caveat header Dot 151
  ở §9); cache 178 (#49) vs 110 (#48); lists 37 (#49) vs 66
  (#48) — lệch do mirror lists; GST 269 cả hai. Replay #49
  NHANH: hoạt động đầu boot+44s, cài xong boot+5m54s — nhanh
  nhất trong các boot gần đây (#48: 2 dòng rồi im tới khi
  watcher repair; #45: boot+63').
- **Phối hợp T4-155:** poller T4-155 đọc `round155-t5/
  POSTBOOT_PASS` (chính) — cờ đã có sẵn lúc T4 mở (T4-155 mở
  sau T5; round155-t4 chưa xuất hiện lúc 14:43Z). T4 không cần
  check-only dự phòng cho gate0 trên boot này nếu đọc đúng cờ
  này (T10 xác minh độc lập).

## 4. Boot #49 (12fc68a3) — replay + đồng hồ

- **Rootfs làm mới (chữ ký như #43/#48):** dpkg.log 2 dòng
  startup configure 13:05:56Z (boot +44s) rồi unpack từ
  13:06:44Z; tới 13:11:06Z đạt 1545 dòng rồi ỔN ĐỊNH (md5
  19522dc0 không đổi qua các poll 14:42–14:43Z). Cache 178 .deb
  (mtime trước boot — cùng mẫu "cache APT sống" như các boot
  trước), lists 37, GST 269.
- **Đồng hồ — nghịch lý đã biết, T5 chỉ ghi mốc:** poll cuối
  watcher-154 13:05:31Z vẫn ghi boot 2c0a7985 trong khi btime
  #49 là 13:05:12Z — tức đồng hồ cell cũ chạy NHANH hơn btime
  boot mới ≥19s (cùng chữ ký "nghịch lý đồng hồ ≥ +20 s +
  migration overlap ~20 s" mà MEMORY ghi cho #49 theo T8-154;
  T2-154 phán chính thức số hiệu #49). T5 không phán thêm;
  **mù #81? giao T2-155** (theo nợ đợt 154). T2-155 phán số
  hiệu/mù chính thức.
- **POSTBOOT_PASS trên đĩa lúc mở:** CHỈ có cờ #48
  (round154-t5, 11:58:26Z) — STALE cho #49; cờ #49 do
  watcher-155 viết (§3.1); cờ cũ #48 đã lưu thành
  `POSTBOOT_PASS-2c0a7985` trong round155-t5.

## 5. Quy tắc đứng (3) — áp dụng trong đợt 155

- T0-155 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0 chưa
  xuất hiện lúc 14:39:50Z; thư mục round155-t0 chưa có. T5 đã
  ghi trạng thái lúc mở vào `watcher-status-at-open.txt`
  (chết lúc mở → khởi động lại bằng tay 14:42:36Z) để T0 đối
  chiếu.
- **Hạn chế đã biết của (3) — đo được ở đợt này:** cửa sổ hở
  reboot → phiên mở ở #49 là **~1h30m** (13:05:12Z → 14:35:51Z)
  + ~7 phút tới khi watcher-155 chạy — dài hơn #48 (~10') vì
  reboot xảy ra GIỮA phiên đợt 154 chứ không sát giờ mở đợt.
  Thiệt hại đo được: KHÔNG có (replay tự xong boot+5m54s;
  T8-154 tự kiểm postboot 13:31:06Z; cờ chỉ ghi muộn). Đây là
  lần thứ hai hướng (3) chứng minh cửa sổ hở không gây thiệt
  hại đo được — nhưng là lần đầu cửa sổ dài tới ~1,5h.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-155 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **905.520 kB @14:43:16Z**; MemFree 156.624 kB.
  loadavg 0,96 @14:43:16Z (yên sau khi replay xong từ lâu).
  Sampler T9-155 ĐANG CHẠY (ram-sampler.log 3 mẫu 14:40:38–
  14:42:39Z, boot 12fc68a3, bal=5.631.380); b2-watcher pid 23307
  đang chạy.
- **ENOSPC journal boot #49:** **59 dòng** lúc 14:43:16Z
  (journal 388 dòng) — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`. T9-155 đếm chính thức; T5 chỉ ghi
  nhận số lúc mở. (So sánh: #48 có 7 dòng lúc mở, ≥90 dòng
  cuối phiên — #49 đã 59 dòng ở giữa phiên.)
- **Không reboot mới trong phiên T5** (boot vẫn 12fc68a3 lúc
  kiểm cuối 14:43:18Z — KHÔNG có #50; watcher-155 tiếp tục
  giám sát tới hạn cứng 17:35:51Z, tự ghi NEWBOOT nếu có
  reboot sau khi T5 đóng cờ).
- **journal_boots chỉ còn 1 boot (#49):** journal của #48
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 156 (từ T5-155)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua #49.
   T5-156 kiểm tra lại sau reboot kế tiếp (chuỗi bằng chứng
   tiếp tục).
3. **POSTBOOT_PASS cho #49 — XONG 14:42:38Z** (watcher-155,
   replay-day-du, poll=0; T4-155 phối hợp qua cờ). Watcher-155
   tiếp tục giám sát tới 17:35:51Z; nếu có reboot #50 trong
   phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/boot) —
   T5-156 kiểm tra log.
4. **Mù #81? + số hiệu #49** — giao T2-155 phán (T5 chỉ ghi
   mốc btime + poll cuối watcher-154).
5. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 đợt này — header log ghi
   boot e9295700/2e430750 đợt 151 trong khi checks là của #49):
   T5 đợt sau quyết có cập nhật theo Dot hay không. Đây là nợ
   thẩm mỹ trong log header, không ảnh hưởng kết quả check.
6. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 154 thuộc T7-155 (kết cục + #49 có viết lại
   run 154 không).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — nhưng cửa sổ hở đợt này dài
  ~1,5h (reboot giữa phiên). Nếu parent muốn thu hẹp, lựa chọn
  duy nhất trong cell hiện tại là rút ngắn nhịp kiểm tra của T0
  (T0 mở sớm hơn sau reboot) — T5 không tự chọn; hướng (3) đã
  được chấp nhận với cửa sổ này là "khoảng hở đã biết".
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2.2 đủ mạnh
  và đã kiểm tra lại lần thứ hai liên tiếp.

## 9. Sai số của chính T5-155

- **F-155-T5-1 — Stats script §2 kiểm tra sai thư mục sau sed:**
  `t5-stats-155.py` §2 tìm `replay-watch-154.log` trong
  round155-t5 (không tồn tại) thay vì round154-t5. Nguyên nhân:
  sed đổi 154→155 toàn cục. Đã đối chiếu log 154 trực tiếp
  bằng grep/tail (153 dòng, poll cuối 13:05:31Z, 0 NEWBOOT) nên
  số liệu trong LIMITS này đúng; chỉ output script §2 sai vị
  trí. Bài học: sau sed, kiểm tra lại các tham chiếu chéo thư
  mục cũ trong script.
- **F-155-T5-2 — `pgrep -af ram-sampler` / `b2-watcher` tự khớp
  shell exec của chính T5** (pid 26064 — cùng họ F-154-T5-1/
  F-153-T5-1/F-152-T5-1). Đã nhận diện ngay là tự khớp (cmdline
  là lệnh exec chứa chuỗi tìm kiếm) và xác nhận sampler thật
  bằng file log (3 mẫu, boot 12fc68a3) + b2-watcher pid 23307
  (cmdline là đường dẫn script). Bài học giữ nguyên: luôn neo
  pattern + đối chiếu log/file, không tin mù pgrep.
- **F-155-T5-3 — Header comment watcher-155 bị sed làm sai số
  boot lúc đầu** ("reboot #48, btime 11:26:05Z" cho boot
  12fc68a3). Đã sửa tay trước khi khởi động watcher (boot #49,
  btime 13:05:12Z, dpkg 1545 dòng). Bài học: sed đổi số đợt
  không thay được ngữ nghĩa — đọc lại header sau sed.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-155.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (12fc68a3, btime
  13:05:12Z).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t5/t5-stats-155.py`
(output đầy đủ lưu tại `t5-stats-155-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 14:43:16Z, SAU khi cờ POSTBOOT_PASS #49
đã ghi; F-155-T5-1: §2 của output sai thư mục log 154, xem §9).
Trích nguyên văn các phần chính:

```
--- 1. Boot hien tai ---
boot_id=12fc68a3-10f4-4459-908f-b0a47615afae
btime_epoch=1795179912 = 2026-11-20T13:05:12Z
uptime_s=5883.93 now=2026-11-20T14:43:16Z
/proc/1 mtime=2026-11-20 13:05:29.164213575 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 12fc68a310f44459908fb0a47615afae Fri 2026-11-20 13:05:29 UTC Fri 2026-11-20 14:42:23 UTC

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=19522dc0 mtime=2026-11-20 13:11:06.804028331 +0000
cache_deb=178 lists_entries=37
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
ENOSPC_dong=59
journal_dong=388

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          156624 kB
MemAvailable:     905520 kB
loadavg=0.96 0.84 0.58 2/586 30111
sampler .../round155-t9/ram-sampler.log: tong_mau=3 dau=2026-11-20T14:40:38 cuoi=2026-11-20T14:42:39Z boot=12fc68a3 mem=853344 bal=5631380 swapfree=580852 load1=1.26
b2_watcher_proc=23307 bash .../round155-t9/b2-watcher.sh

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
```

Log postboot poll0 (`t5-postboot-poll0-12fc68a3.log`, 14:42:38Z,
exit 0 — trích phần check; header log còn ghi Dot 151, xem §7.5):

```
[postboot 2026-11-20 13:05:12] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-20 13:05:12] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-20 13:05:12] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-20 13:05:12] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-20 13:05:12] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-20 13:05:12] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-20 13:05:12] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 13:05:12)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round155-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t5/`
  (không nằm trong repo nên không stage): `replay-watch-155.sh`,
  `t5-stats-155.py`, `t5-stats-155-output.txt`,
  `replay-watch-155.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-2c0a7985`,
  `t5-postboot-poll0-12fc68a3.log`.
