# PHASE9_ROUND158_T5_INFRA_LIMITS — WATCHER-158 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #58 CÓ TRONG 37 PHÚT (REPLAY NHANH NHẤT); #57 KHÔNG CÓ CỜ, KHÔNG BÙ ĐƯỢC; MARKER SỐNG QUA 10 REBOOT

> Luồng T5, đợt 158, lượt cron 06:35 +07 21/11/2026 (mở 23:35:51Z
> 20/11; T5 mở thực tế ~23:39Z). Repo `~/workspace/repo-1` (cây làm
> việc, KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #58
> 28366bd0-d6d6-4a50-a386-666c0aa3c062** (btime **23:06:08Z** —
> /proc/stat btime 1795215968; `uptime -s` 23:06:08Z; /proc/1
> 23:06:19Z (+11 s — cùng mẫu lệch, KHÔNG phải btime); journal
> first entry 23:06:19Z (+11 s); **T5 tự xác minh độc lập 4 nguồn**
> — T0-158 chưa có cờ round158-t0.done lúc T5 đóng (~23:47Z),
> xác minh độc lập của T0 còn chờ).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156, (o) đợt 157): KHÔNG cài unit,
> KHÔNG thử lại (1)/(2).** Watcher-157 pid 3428 CHẾT theo reboot #57
> (log dừng 21:05:40Z, poll cuối boot 348dab54, 0 NEWBOOT);
> **watcher-158 khởi động bằng tay 23:43:21Z, pid 10867** (§3).
> **POSTBOOT_PASS cho #58 ĐÃ GHI 23:43:22Z (boot+37m14s, mode
> replay-day-du, poll=0)** — cờ NHANH NHẤT từ trước tới nay (§3.1).
> **POSTBOOT_PASS #57: KHÔNG CÓ và KHÔNG BÙ ĐƯỢC** (boot chết
> trước phiên T5; journal + dpkg.log đã mất — §4; cùng tiền lệ
> #51/#53/#54/#55). T8-157 ĐÃ tự kiểm postboot đầy đủ trên #57
> (22:31:28Z) + O8 3/3 PASS trên #57 — đó là CHECK, không phải cờ;
> T5 KHÔNG ghi cờ hồi tố. **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 10 REBOOT LIÊN TIẾP
> #49–#58** (§2.1). **KHÔNG push. KHÔNG release/tag.** KHÔNG tự
> chạy birefnet (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 20/11/2026 — giờ thật theo xác minh T7-157 cho #57; btime #58 theo quy tắc đứng /proc/stat)

| Thời điểm | Sự kiện |
|---|---|
| 19:32:47Z | **Reboot #56, boot 348dab54** (btime — GIỜ THẬT, T0-157 xác minh) |
| 20:54:39Z | POSTBOOT_PASS #56 ghi (watcher-157, replay-day-du, poll=0) |
| 21:05:15Z | **Reboot #57, boot bcbaa3ad** (btime — GIỜ THẬT, T7-157 xác minh: F-measure +0,013 s, Date header github.com khớp) — #56 sống 5.548 s |
| 21:05:40Z | Watcher-157 poll cuối (vẫn boot 348dab54) — CHẾT theo #57, 0 NEWBOOT; nghịch lý đồng hồ ≥ +25 s (xem §4) |
| 22:31:28Z | T8-157 tự kiểm postboot boot bcbaa3ad: ĐẦY ĐỦ (lib 6/6, GST 1.624, dpkg 1.545, cache 178, lists 39) — CHECK, không phải cờ T5 |
| 22:31:55–22:34:52Z | O8 3/3 PASS trên boot #57 (WebKit 21/21 ×2 + Chromium 21/21) |
| 23:06:08Z | **Reboot #58, boot 28366bd0** (btime /proc/stat 1795215968) — #57 sống 7.253 s (~2h0m53s); ngay lúc harness T8 kết thúc (F-157-T8-3: đồng hồ boot cũ nhanh ~+28 s so với boot mới) |
| 23:06:50Z | Hoạt động dpkg đầu trên #58 (boot+42s — NHANH NHẤT từng ghi) |
| 23:08:51Z | dpkg.log #58 xong: 1.545 dòng (boot+2m43s) — replay hoàn tất |
| 23:35:51Z | Lượt cron đợt 158 mở |
| ~23:39Z | T5-158 mở: boot 28366bd0, uptime ~33', **không watcher nào chạy**; không POSTBOOT_PASS cho #57/#58; replay ĐÃ XONG trên boot này |
| 23:43:21Z | **Watcher-158 START (bằng tay, bash显式 + setsid nohup), pid 10867, boot 28366bd0** |
| 23:43:21Z | REPLAY_DONE (dpkg 1.545 ổn định, 0 proc) → postboot poll0 exit=0 |
| 23:43:22Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 28366bd0** (poll=0, replay-day-du) — boot+37m14s |
| 23:46:39Z | Stats script: 11/11 gói + 5/5 lib, GST 269, cache 178, lists 37, ENOSPC 34 dòng (số riêng T5) |
| 23:47:10Z | Kiểm cuối: vẫn boot 28366bd0, watcher-158 pid 10867 đang poll đều (poll cuối 23:46:52Z, đúng chu kỳ 30 s) |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156 +
(o) đợt 157: **(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở,
T5 khởi động lại bằng tay. T5-158 kiểm tra lại nhanh `systemctl
is-active` (§A.8): user@0/logind/dbus vẫn inactive, không linger,
không cron, không /run/user/0 — cell không đổi, kết luận đợt
154/155/156/157 giữ nguyên. Unit + script ở `round154-t5/` GIỮ LẠI
cho cell khác (không xóa, không cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 10 REBOOT LIÊN TIẾP #49–#58

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56, #57, #58; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156/157; không thuộc phạm vi T5-158) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#58 (10 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (8 reboot ở đợt 157 →
  10 reboot đợt này). Home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rebuild — khẳng định lần thứ
  mười liên tiếp.

## 3. Watcher-158 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (~23:39Z): KHÔNG watcher nào chạy**
  (`ps aux | grep -i watch`: không có tiến trình replay-watch
  thật; `pgrep -f 'replay-watch-158.sh'` sau khởi động trả thêm
  pid 10864 là shell exec của chính T5 — cùng họ F-156-T5-1,
  xem §9 F-158-T5-1). Ghi vào `round158-t5/
  watcher-status-at-open.txt` cho T0-158 (T0-158 chưa đóng cờ
  lúc T5 kiểm cuối — xác minh độc lập của T0 còn chờ).
  Watcher-157 pid 3428 đã chết theo reboot #57 (log dừng
  21:05:40Z, poll cuối boot 348dab54, 0 NEWBOOT).
- **Khởi động bằng tay 23:43:21Z, pid 10867** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-158-START 2026-11-20T23:43:21Z pid=10867
  boot=28366bd0 btime=2026-11-20 23:06:08Z end=2026-11-21T02:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545
  init_md5=e7b99933 init_mtime=23:08:51Z cache=178 lists=37 gst_sys=269`
- **Thay đổi so với watcher-157 (3 điểm):**
  1. END = 02:30:00Z 21/11 (hạn cứng đợt 158 theo task); DIR =
     round158-t5, OLD_T5_DIR = round157-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #58 + trạng thái replay ĐÃ
     XONG lúc khởi động (dpkg 1.545 dòng, mtime 23:08:51Z =
     boot+2m43s, apt idle) — dự kiến REPLAY_DONE ngay, không
     phải EARLY-REPAIR.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll). Thêm mục 2b trong stats
     script: đếm log watcher-158 hiện tại.
- **Bài học sed (F-157-T5-3, đã áp dụng đúng):** sed 157→158
  để lại 3 tham chiếu cũ cần sửa tay (log watcher-156→157,
  cặp POSTBOOT (158,156)→(158,157), fallback sampler
  (158,156)→(158,157)) + 1 lỗi ngày ở START line
  (end=2026-11-20T02:30:00Z → 2026-11-21T02:30:00Z) — đã sửa
  tay + đọc lại toàn bộ script TRƯỚC khi khởi động watcher
  (grep kiểm + `bash -n` syntax OK). Stats script cũng sửa
  tay tương tự và kiểm lại trước khi chạy — output lần này
  ĐÚNG (§A).
- **Poll đều đã xác minh:** 23:43:21Z, 23:43:52Z, 23:44:22Z,
  … 23:46:52Z — đúng chu kỳ 30 s, không trượt poll (kiểm cuối
  23:47:10Z, pid 10867 elapsed 03:49).

### 3.1 POSTBOOT_PASS cho #58 — HOÀN TẤT QUA REPLAY ĐẦY ĐỦ (KHÔNG REPAIR)

- **Replay của cell trên #58: NHANH NHẤT từng ghi.** Hoạt động
  dpkg đầu 23:06:50Z (**boot+42s** — nhanh nhất: #49 boot+44s,
  #50 boot+~53s, #52 boot+16m34s, #56 boot+62m53s); xong
  23:08:51Z (**boot+2m43s**); dpkg **1.545 dòng** (md5
  e7b99933); breakdown **169 install / 9 upgrade / 178
  configure — KHỚP CHÍNH XÁC replay đầy đủ của #56** (cùng tập
  gói; md5 khác do thời gian). Cache APT 178 .deb SỐNG qua
  reboot (RV-backed). Lists 37. GST hệ thống 269.
- **Poll đầu 23:43:21Z: REPLAY_DONE ngay** (dpkg 1.545 > 100,
  ổn định, 0 proc) → postboot check-only poll0 **exit=0**
  (hoàn tất 23:43:22Z). **KHÔNG repair** — không cần (dpkg
  >100, đã ổn định; EARLY-REPAIR=0 trong log).
- **FLAG-WRITTEN 23:43:22Z** (`round158-t5/POSTBOOT_PASS`):
  `boot 28366bd0-d6d6-4a50-a386-666c0aa3c062 (btime 2026-11-20
  23:06:08Z; watcher-158) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc
  2026-11-20T23:43:22Z; POSTBOOT_PASS moi ghi 2026-11-20T23:43:22Z
  poll=0 (replay-day-du); co cu 348dab54 luu POSTBOOT_PASS-348dab54`.
  Bản sao lưu cờ cũ `POSTBOOT_PASS-348dab54` đã đối chiếu
  bằng `diff` — KHỚP cờ #56 gốc (round157-t5).
- **Cờ lúc 23:43:22Z = boot+37m14s — NHANH NHẤT từ trước tới
  nay** (#52 boot+41m01s, #56 boot+1h21m52s). Cửa sổ hở của
  hướng (3) ở #58: reboot 23:06:08Z → phiên 158 mở 23:35:51Z
  (~30 phút) + ~8 phút tới khi watcher chạy + ~1 phút tới cờ
  — tổng **~37 phút tới khi có cờ**, ngắn nhất từ trước
  (so #56 ~82 phút, #52 ~41 phút). Nguyên nhân chính: replay
  khởi động ngay (boot+42s) + xong nhanh (boot+2m43s) — đối
  lập hoàn toàn #56 (khởi động muộn boot+62m53s).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script (§A, 23:46:39Z) + log poll0: wrapper PASS, libs PASS đủ
  5, GST PASS (269 = debroot 269, đủ isomp4 + libav), apt PASS đủ
  11 package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ.**
- **Phối hợp T4/T8-158:** poller T4-158 + harness T8-158 đọc
  `round158-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  23:43:22Z, TRƯỚC khi các luồng khác cần gate0.

## 4. Boot #57 — KHÔNG CÓ POSTBOOT_PASS, KHÔNG BÙ ĐƯỢC; boot #58 + #56

- **Boot #57 (bcbaa3ad-0180-46e4-bf80-0c51c9eef1ff, btime
  21:05:15Z): KHÔNG CÓ cờ.** Sống **7.253 s** (~2h0m53s,
  21:05:15Z → 23:06:08Z) trong phiên 157, nhưng watcher-157 đã
  chết theo chính reboot này (poll cuối 21:05:40Z, 0 NEWBOOT);
  T5-157 đã đóng cờ ~20:58Z (trước #57); không có phiên T5 nào
  trong cửa sổ đó sau khi watcher chết.
- **Bằng chứng đã mất:** `journalctl --list-boots` chỉ còn
  **1 boot (#58)** — journal của #57 đã mất theo rebuild
  (journal volatile, cùng mẫu các đợt trước); dpkg.log đã bị
  ghi đè bởi #58 (chỉ còn `/var/log/dpkg.log`, không có bản
  xoay). Grep đích danh `bcbaa3ad` trên các tập file liên quan
  (POSTBOOT* / *.done / LIMITS / build-loop-log / log T8 /
  script T2): **không file POSTBOOT* nào nhắc bcbaa3ad** —
  không tồn tại cờ cho #57.
- **T8-157 ĐÃ tự kiểm postboot đầy đủ trên #57** (22:31:28Z:
  lib 6/6, GST registry 1.624 dòng, dpkg.log 1.545, cache 178,
  lists 39) và chạy O8 21/21 ×3 PASS trên #57 (22:31:55–
  22:34:52Z) — nhưng đó là CHECK, không phải cờ POSTBOOT_PASS
  do watcher ghi sau postboot poll trên boot đang sống. **T5
  KHÔNG ghi cờ hồi tố từ log của T8** — cờ chứng nhận một phép
  đo trực tiếp trên boot sống; ghi hồi tố sẽ là tái tạo, không
  phải đo. Cùng tiền lệ #51/#53/#54/#55 theo quyết (o) đợt 156
  (chấp nhận khoảng hở, không bù). Ghi nhận tương tự #55 ở
  đợt 157 (T8-156 cũng tự kiểm đầy đủ trên #55).
- **Nghịch lý đồng hồ #57 ≥ +25 s — T5 xác nhận chéo thêm một
  nguồn:** watcher-157 poll cuối **21:05:40Z vẫn thấy boot
  348dab54** trong khi btime #57 là 21:05:15Z (25 s TRƯỚC poll
  đó). Cùng chiều với T9-157 (mẫu cuối boot #56 21:05:27Z,
  12 s sau btime #57) và T8-157 (waiter poll 22 lúc 21:05:48Z
  theo đồng hồ boot cũ; sleep T7 bị SIGTERM ~21:05:49Z).
  Aggregate đợt 157 §12.1 (q) đã ghi "Nghịch lý đồng hồ #57
  ≥ +25 s (mới)" — poll của watcher-157 là nguồn thứ tư củng
  cố ≥ +25 s. Btime #57 = GIỜ THẬT đã được T7-157 xác minh
  (F-measure +0,013 s, Date header github.com khớp từng giây).
  T5 không phán thêm về mô hình đồng hồ (Model 1 vs Model 2)
  — giao T2-158.
- **Boot #58 (28366bd0):** rootfs làm mới; replay nhanh nhất
  (§3.1). Nghịch lý đồng hồ #58 đã ghi ở F-157-T8-3 (report
  Chromium 86n2 23:06:33Z + ALL DONE 23:06:36Z theo đồng hồ
  boot cũ — nhanh ~+28 s so với boot mới). T5-158 xác minh
  btime #58 bằng 4 nguồn độc lập (boot_id, btime /proc/stat,
  uptime -s, journal first entry 23:06:19Z +11 s — cùng mẫu
  lệch /proc/1, KHÔNG phải btime); xác minh độc lập của T0-158
  còn chờ (chưa có cờ round158-t0.done lúc 23:47Z).
- **Boot #56 (348dab54): POSTBOOT_PASS VẪN CÒN trên đĩa** —
  `round157-t5/POSTBOOT_PASS`, mtime 20:54:39Z; bản sao đã lưu
  `round158-t5/POSTBOOT_PASS-348dab54` (đã đối chiếu bằng
  `diff`, khớp). Cờ #52 (round156-t5, 18:00:10Z) không kiểm
  lại đợt này (đã xác minh ở đợt 157).
- **Boot #53/#54/#55:** vẫn KHÔNG CÓ cờ, không bù được (theo
  T5-157 §4; không có dữ kiện mới đợt này).

## 5. Quy tắc đứng (3) — áp dụng trong đợt 158

- T0-158 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0-158
  chưa đóng cờ lúc T5 kiểm cuối (~23:47Z) — T5 tự xác minh
  độc lập watcher CHẾT lúc mở + khởi động lại pid 10867
  ~23:43Z (ghi trong `watcher-status-at-open.txt`).
- **Cửa sổ hở hướng (3) ở #58: ~37 phút tới cờ — NGẮN NHẤT
  từ trước** (so #56 ~82 phút, #52 ~41 phút). Nguyên nhân:
  replay khởi động ngay + xong nhanh. Thiệt hại đo được:
  KHÔNG có — cờ có trước khi T4/T8-158 cần gate0.
- **#57 là boot thứ năm liên tiếp lọt hoàn toàn không cờ**
  (#51 đợt 156, #53/#54/#55 đợt 157, #57 đợt 157) — tất cả đều
  chết hoàn toàn ngoài phiên T5; hướng (3) không bắt được boot
  sống và chết hoàn toàn giữa hai đợt. Đây là khoảng hở đã
  biết, đã được parent chấp nhận ở quyết (o) đợt 156 cho #51;
  T5 chỉ ghi nhận, không tự chọn hướng mới (xem §8). Điểm
  khác với #53/#54/#55: #57 sống tới 7.253 s (~2 giờ) và T8
  đã tự kiểm đầy đủ + chạy O8 PASS trên đó — dữ kiện về #57
  đầy đủ hơn, chỉ thiếu cờ watcher.
- **Watcher-158 tiếp tục giám sát tới 02:30:00Z**; nếu có reboot
  #59 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-159 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-158 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **1.433.596 kB @23:46:39Z**; MemFree 154.808 kB.
  loadavg 3,77 @23:46:39Z. Sampler T9-158 ĐANG CHẠY
  (ram-sampler.log 6 mẫu 23:41:02–23:46:02Z, boot 28366bd0,
  bal=5.186.124); b2-watcher pid 9792 đang chạy.
- **ENOSPC journal boot #58:** **34 dòng** lúc 23:46:39Z
  (journal 198 dòng; 27 dòng lúc 23:39Z → 34 dòng lúc 23:46:39Z
  — tăng chậm, cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`). T9-158 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo. So sánh: #57 có 90 dòng lúc T9-157 đóng
  (22:48:34Z); #56 có 16 dòng lúc T5-157 đo.
- **Không reboot mới trong phiên T5** (boot vẫn 28366bd0 lúc
  kiểm cuối 23:47:10Z — KHÔNG có #59; watcher-158 tiếp tục
  giám sát tới hạn cứng 02:30:00Z).
- **journal_boots chỉ còn 1 boot (#58):** journal của #57
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 159 (từ T5-158)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 10 reboot
   #49–#58. T5-159 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #58 — XONG 23:43:22Z** (watcher-158,
   replay-day-du, poll=0; T4/T8-158 phối hợp qua cờ).
   Watcher-158 tiếp tục giám sát tới 02:30:00Z; nếu có reboot
   #59 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-159 kiểm tra log.
4. **POSTBOOT_PASS #57 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (cùng tiền lệ #51/#53/#54/#55 theo quyết (o) đợt 156).
   T8-157 đã tự kiểm đầy đủ + O8 3/3 PASS trên #57 — dữ kiện
   đầy đủ, chỉ thiếu cờ watcher. Mù cho #57/#58 giao T2-158.
   Số hiệu #57/#58 do T7/T8-157 đếm tuần tự, chờ T2-158 phán.
5. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 đợt này — header log ghi
   boot e9295700/2e430750 đợt 151 trong khi checks là của #58):
   T5 đợt sau quyết có cập nhật theo Dot hay không. Đây là nợ
   thẩm mỹ trong log header, không ảnh hưởng kết quả check.
6. **Replay #58 nhanh nhất từng ghi** (boot+42s → boot+2m43s)
   — đối lập #56 (boot+62m53s). Nếu đợt sau replay cũng khởi
   động nhanh, cờ có thể trong ~40 phút; nếu khởi động muộn
   như #56, cờ có thể muộn tới boot+80' — T4/T8 lưu ý không
   chạy O8/harness trước khi cờ có (bài học F-156-T0-1).
7. **Cửa sổ hở hướng (3) ngắn nhất: ~37 phút tới cờ #58.**
   Xem §8 — T5 không tự chọn hướng mới.
8. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 157 thuộc T7-158 (kết cục + #57 có phải điểm
   (m) thứ 15 không — xem LIMITS T7-157 §2.4; #58 có viết lại
   run 157/158 không thuộc T7-158).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — đợt này cửa sổ hở tới cờ ngắn
  nhất (~37 phút) nhờ replay khởi động nhanh; nhưng #57 vẫn là
  boot thứ năm liên tiếp lọt hoàn toàn không cờ (sau #51,
  #53/#54/#55). Cả 5 boot lọt đều chết hoàn toàn ngoài phiên
  T5 — không có cơ chế nào trong cell hiện tại bắt được chúng
  ngoài việc rút ngắn nhịp kiểm tra của T0 (T0 mở sớm hơn sau
  reboot) hoặc kéo dài phiên T5 qua khoảng giữa hai đợt. T5
  không tự chọn; hướng (3) đã được chấp nhận với cửa sổ này
  là "khoảng hở đã biết" (quyết (o) đợt 156).
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ năm liên tiếp.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #57 từ log của
  T8-157** (xem §4) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #57 theo
  cách khác (VD: ghi chú "đã đủ điều kiện theo self-check
  T8-157 + O8 3/3 PASS"), đó là quyết của parent, T5 không
  tự ghi.

## 9. Sai số của chính T5-158

- **F-158-T5-1 — `pgrep -f 'replay-watch-158.sh'` tự khớp shell
  exec của chính T5** (cùng họ F-156-T5-1/F-157-T5-1).
  Sau khởi động watcher, pgrep trả 3 pid (10864/10865/10867)
  — 10864 là shell exec của chính T5 (cmdline chứa chuỗi tìm
  kiếm); watcher thật là pid 10867 (log START + `ps -p 10867`
  elapsed 03:49). Cùng họ trong stats §7: các dòng
  sampler_proc/b2_watcher_proc chứa cmdline shell exec của T5
  + dòng `/bin/sh -c pgrep -af ...` — bằng chứng thật là file
  ram-sampler.log (6 mẫu, boot 28366bd0) + b2-watcher pid 9792
  (cmdline là đường dẫn script). Bài học giữ nguyên: luôn neo
  pattern + đối chiếu log/file, không tin mù pgrep.
- **F-158-T5-2 — Exec khởi động watcher báo
  `output_drain_timeout` (session proc_ba7328600000,
  failureKind subprocess.output_drain_timeout).** Shell đã
  thoát nhưng output không đóng trong 2 s vì tiến trình nền
  watcher còn giữ session — watcher thực tế đã chạy đúng
  (START 23:43:21Z pid 10867 + FLAG-WRITTEN 23:43:22Z + poll
  đều sau đó). Đã KHÔNG khởi động lại (khởi động lại sẽ tạo
  watcher trùng) mà kiểm tra bằng log file + `ps -p`. Bài
  học: khởi động tiến trình nền dài qua exec sẽ báo timeout
  giả này; kết luận bằng log + ps, không lặp lại thao tác
  khởi động.
- **F-158-T5-3 — `grep -r` đệ quy toàn hidden_files tìm
  bcbaa3ad chạy >285 s không xong** (file log lớn trong cây
  hidden_files). Đã kill (SIGTERM) và thay bằng grep đích
  danh trên các tập file liên quan (POSTBOOT* / *.done /
  LIMITS / build-loop-log / log T8 / script T2) — kết quả
  đích danh đầy đủ (§4: không file POSTBOOT* nào nhắc
  bcbaa3ad). Bài học: không grep đệ quy không giới hạn trên
  hidden_files; nhắm tập file.
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-158.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (28366bd0, btime
  23:06:08Z). Sed 157→158 đã được kiểm lại toàn bộ trước khi
  chạy (không để lại header sai boot — tránh được họ
  F-156-T5-2/F-157-T5-3: 3 tham chiếu chéo + 1 lỗi ngày đã sửa
  tay trước khi khởi động).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t5/t5-stats-158.py`
(output đầy đủ lưu tại `t5-stats-158-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 23:46:39Z, SAU khi cờ POSTBOOT_PASS #58
đã ghi; F-158-T5-1: các dòng sampler_proc/b2_watcher_proc trong
§7 tự khớp shell exec của T5 — bằng chứng thật là file
ram-sampler.log 6 mẫu boot 28366bd0 + b2-watcher pid 9792).
Trích nguyên văn các phần chính:

```
=== PHU LUC SO LIEU T5-158 (trich bang script, 2026-11-20T23:46:39Z) ===

--- 1. Boot hien tai ---
boot_id=28366bd0-d6d6-4a50-a386-666c0aa3c062
btime_epoch=1795215968 = 2026-11-20T23:06:08Z
uptime_s=2430.57 now=2026-11-20T23:46:39Z
/proc/1 mtime=2026-11-20 23:06:19.206979269 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 28366bd0d6d64a50a386666c0aa3c062 Fri 2026-11-20 23:06:19 UTC Fri 2026-11-20 23:45:29 UTC

--- 2. replay-watch-157.log ---
tong_dong=50
START=1 poll=45 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-157-START 2026-11-20T20:43:36Z pid=3428 boot=348dab54 btime=2026-11-20 19:32:47Z end=2026-11-20T23:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=351c1eea init_mtime=20:35:40Z cache=178 lists=3 gst_sys=0
dong_cuoi: 2026-11-20T21:05:40Z boot=348dab54 poll dpkg_lines=1545 md5=facd72cb apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37
boot_xuat_hien=['348dab54']
mtime_log=2026-11-20T21:05:40Z size=6254

--- 2b. replay-watch-158.log ---
tong_dong=12
START=1 poll=7 NEWBOOT=0 END=0 EARLY-REPAIR=0 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-158-START 2026-11-20T23:43:21Z pid=10867 boot=28366bd0 btime=2026-11-20 23:06:08Z end=2026-11-21T02:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=1545 init_md5=e7b99933 init_mtime=23:08:51Z cache=178 lists=37 gst_sys=269
dong_cuoi: 2026-11-20T23:46:22Z boot=28366bd0 poll dpkg_lines=1545 md5=e7b99933 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37
boot_xuat_hien=['28366bd0']
mtime_log=2026-11-20T23:46:22Z size=1555

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t5/POSTBOOT_PASS (mtime 2026-11-20T23:43:22Z) ---
boot 28366bd0-d6d6-4a50-a386-666c0aa3c062 (btime 2026-11-20 23:06:08Z; watcher-158) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-20T23:43:22Z; POSTBOOT_PASS moi ghi 2026-11-20T23:43:22Z poll=0 (replay-day-du); co cu 348dab54 luu POSTBOOT_PASS-348dab54

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t5/POSTBOOT_PASS (mtime 2026-11-20T20:54:39Z) ---
boot 348dab54-90f7-438e-924e-2c839630842b (btime 2026-11-20 19:32:47Z; watcher-157) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-20T20:54:39Z; POSTBOOT_PASS moi ghi 2026-11-20T20:54:39Z poll=0 (replay-day-du); co cu 5353ed19 luu POSTBOOT_PASS-5353ed19

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=e7b99933 mtime=2026-11-20 23:08:51.620517694 +0000
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
ENOSPC_dong=34
journal_dong=198

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          154808 kB
MemAvailable:    1433596 kB
loadavg=3.77 3.23 1.71 13/507 27233
sampler /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9/ram-sampler.log: tong_mau=6 dau=2026-11-20T23:41:02 cuoi=2026-11-20T23:46:02Z boot=28366bd0 mem=1577704 bal=5186124 swapfree=687384 load1=4.29
sampler_proc=10979 /bin/bash --norc --noprofile -c umask 0007; sleep 1500; date -u +%Y-%m-%dT%H:%M:%SZ; D=~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9; tail -2 $D/ram-sampler.log; grep btime /proc/stat; cat /proc/sys/kernel/random/boot_id | cut -c1-8; pgrep -af 'round158-t9/(sampler|b2-watcher)' | grep -v pgrep; grep -c '^=== SPIKE' $D/b2-spikes.log 2>/dev/null || echo "b2 log: 0 spike"
21065 /bin/bash --norc --noprofile -c umask 0007; sleep 60; date -u +%Y-%m-%dT%H:%M:%SZ; D=~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9; tail -1 $D/ram-sampler.log; grep -c '^=== SPIKE' $D/b2-spikes.log 2>/dev/null
27234 /bin/sh -c pgrep -af ram-sampler 2>/dev/null
b2_watcher_proc=9792 bash /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9/b2-watcher.sh
10979 /bin/bash --norc --noprofile -c umask 0007; sleep 1500; date -u +%Y-%m-%dT%H:%M:%SZ; D=~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9; tail -2 $D/ram-sampler.log; grep btime /proc/stat; cat /proc/sys/kernel/random/boot_id | cut -c1-8; pgrep -af 'round158-t9/(sampler|b2-watcher)' | grep -v pgrep; grep -c '^=== SPIKE' $D/b2-spikes.log 2>/dev/null || echo "b2 log: 0 spike"
27241 /bin/sh -c pgrep -af b2-watcher 2>/dev/null

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

--- 9. Co round158 .done ---
round158-t1
round158-t2
round158-t4
round158-t5
round158-t6
round158-t7
round158-t8
round158-t9

=== HET PHU LUC T5-158 2026-11-20T23:46:40Z ===
```

Log postboot poll0 (`t5-postboot-poll0-28366bd0.log`, 23:43:22Z,
exit 0 — trích phần check; header log còn ghi Dot 151, xem §7.5):

```
[postboot 2026-11-20 23:06:08] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-20 23:06:08] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-20 23:06:08] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-20 23:06:08] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-20 23:06:08] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-20 23:06:08] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-20 23:06:08] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 23:06:08)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round158-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t5/`
  (không nằm trong repo nên không stage): `replay-watch-158.sh`,
  `t5-stats-158.py`, `t5-stats-158-output.txt`,
  `replay-watch-158.log`, `replay-watch-158.nohup.log`,
  `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-348dab54`,
  `t5-postboot-poll0-28366bd0.log`.
