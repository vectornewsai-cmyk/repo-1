# PHASE9 ROUND 156 — T0: Boot survey + O8 JSON (REBOOT #52 ỨNG VIÊN lúc mở; watcher chết lúc mở; O8 FAIL 0/2 — WebKit crash khi postboot chưa xong)

Đợt 156 mở lượt cron 00:35:51 +07 21/11/2026 (= 17:35:51Z). T0 mở ~17:38:38Z.
Đợt 155 verdict CHẤP NHẬN (quyết parent (a) §12.3 aggregate 155 — đã đọc §12.3
(a)–(r) + §11 nợ mở + GAP §84 trước khi làm). CERT/FULL chính thức nay là
**76/91** (quyết (c): #74?/#75?/#76? ĐÓNG theo chuẩn mốc merged). Reboot #50 +
#51 đã XÁC NHẬN số hiệu (quyết (d)).

## §1. Reboot mới: CÓ — boot #52 ỨNG VIÊN, 5353ed19, btime 17:19:09Z

**Kết luận: có reboot mới kể từ lúc T10-155 đóng sổ.** Boot lúc T0 bắt đầu khác
hẳn boot #51 c931d371 mà T10-155 đóng sổ trên đó. Số hiệu #52 là ỨNG VIÊN
(theo đếm chặt sau #51 đã xác nhận — giao T2-156 xác nhận).

Bằng chứng — 5 nguồn độc lập, đều khớp:

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| boot_id | `5353ed19-ddcb-46cc-9eca-9c9f86ba9706` | khác c931d371 (#51) |
| btime /proc/stat | `1795195149` = **17:19:09Z** | `uptime -s` đồng ý 17:19 |
| journalctl --list-boots | 1 boot duy nhất `5353ed19…`, first entry 17:19:25Z, last 17:37:35Z | journal volatile chỉ giữ 1 boot |
| journal first entry | 17:19:25Z = btime + 16 s | khớp /proc/1 start (dưới) |
| wtmp / last reboot | `reboot system boot 7.0.0-44-generic Fri Nov 20 17:19 still running`; wtmp begins 17:19:25 | — |

- **Cửa sổ xảy ra:** sau lần phát hiện #51 của T10-155 lúc 17:08:19Z và sau khi
  T10 đóng sổ ~17:14Z trên boot #51 — tức #52 xảy ra trong (17:14Z, 17:19:09Z],
  ~5 phút sau khi T10 đóng sổ. T10-155 đóng sổ trên boot #51 (xem §10.5
  aggregate 155).
- **Run 155:** hạn ngân sách 17:35:51Z; #52 btime 17:19:09Z nằm TRONG hạn — nếu
  run 155 vẫn đang chạy tại btime thì #52 viết lại run 155 lần nữa → ứng viên
  điểm (m) thứ 12 (sau #50 = 10 đã chấp nhận theo quyết (e), #51 = 11 ứng viên).
  **Giao T7-156 xác minh** (T0 không phán điểm (m)).
- **/proc/1 start = btime + 15,67 s** (start ticks 1567, CLK_TCK 100; mtime
  /proc/1 17:19:25.31Z = btime + 16,3 s). Journal first entry 17:19:25Z khớp.
  Userspace khởi động ~16 s sau btime — cùng mẫu #49 (+16–17 s).
- **F-measure = +0,64 s, ỔN ĐỊNH — không phải nghịch lý đồng hồ kiểu #45
  (≥20 s):** ba lần đọc cặp wall − (btime + uptime): 17:40:xx +0,646 s /
  +0,642 s (cách nhau 2 s, chênh −0,004 s), 17:58:27Z +0,641 s (chênh −0,001 s
  so với lần 2). Offset nhỏ, ổn định, dưới 1 s. **Quan sát MỚI trên boot #52**
  (khác +0,78 s đợt 155 trên #49, +0,02 s đợt 154 trên #48). T0 KHÔNG kết luận
  nguyên nhân (cùng lập trường T0-155); chỉ ghi nhận số đo ổn định, không ảnh
  hưởng kết luận "có reboot #52". Giao T2-156 ghi nhận (xem F-156-T0-3 về
  phương pháp).

## §2. Quy tắc đứng (3) — kiểm tra watcher ngay khi mở phiên: CHẾT lúc mở (T5-156 đã khởi động lại bằng tay)

- **Kiểm độc lập của T0 (~17:38Z): 0 process replay-watch nào đang chạy.**
  `ps` không thấy replay-watch/sampler/poller/vite/playwright nào của đợt cũ.
- **Log watcher-155 dừng ở poll cuối 17:05:38Z, boot d849728b (#50), KHÔNG có
  dòng NEWBOOT nào** (256 dòng). Poll cuối 17:05:38Z là **9 s SAU btime #51
  (17:05:29Z)** — xác nhận độc lập cửa sổ migration overlap ~9–20 s sau btime
  mà T10-155 đã ghi cho #51 (cùng mẫu #49: poll cuối 19 s sau btime). Watcher-155
  chết theo #51 (T5-156 xác nhận độc lập cùng kết luận — xem
  `round156-t5/watcher-status-at-open.txt`).
- **T5-156 đã khởi động lại watcher-156 bằng tay trước khi T0 kiểm xong**
  (mẫu y hệt đợt 154/155): watcher-156 **pid 4871, khởi động ~17:41Z**; T0 xác
  minh độc lập đang chạy lúc kiểm (~17:47Z) + log `replay-watch-156.log` ghi
  `EARLY-REPAIR TRIGGER boot=5353ed19 boot_age=1606s frozen=612s dpkg_lines=2`
  lúc 17:45:55Z. **T0 KHÔNG khởi động watcher thứ hai.**
- **POSTBOOT_PASS cho boot #51: KHÔNG CÓ** — T5-156 xác nhận độc lập, và KHÔNG
  thể bù sau (boot #51 đã mất, journal chỉ còn #52). Đây là nợ từ đợt 155
  (giao T5-156) nay đóng lại là "không có, không bù được".
- **POSTBOOT_PASS cho boot #52: CHƯA CÓ lúc T0 đóng cờ (~17:58Z)** — T5-156
  đang sửa: `apt-get update` (timeout 1500 s) chạy từ 17:45Z, vẫn chạy lúc
  17:57Z; cờ `repaired-5353ed19` đã có; GST đã symlink lại → debroot (269 file)
  nhưng **cả 11 gói apt vẫn MISSING lúc 17:58Z** (xem §4): libevent-2.1-7t64,
  gstreamer1.0-plugins-base/good/bad/ugly/gl/libav/x, libavif16,
  libgstreamer1.0-0, libevdev2. Cache 0 .deb, lists 3. T0 KHÔNG làm thay phần
  T5 — chỉ kiểm tra lúc mở + lúc đóng theo task.
- **Marker persistence `~/.config/vcut-persistence-marker`: SỐNG QUA #52**
  (còn, ghi 11:39:40Z trên boot #48) — sống qua **4 reboot liên tiếp**
  #49/#50/#51/#52. T5-156 xác nhận độc lập cùng kết luận.
- Trạng thái postboot lúc T0 mở (theo T5-156, T0 đối chiếu): dpkg 2 dòng đóng
  băng từ 17:35:43Z, cache 0, lists 3, GST 0 — replay chưa tiến triển.

## §3. Cơ chế O8 JSON: CÒN ĐÚNG (JSON cũ md5 không đổi; latest = stamped cuối)

- **JSON cũ md5 KHÔNG ĐỔI** (đối chiếu giá trị T10-155 đã ghi):
  T0-155 attempt1 `2f774e22…` ✓; attempt2 `f6756d04…` ✓;
  T8-155 WebKit pid29377 `a10a1004…` ✓, pid29891 `1b9b09aa…` ✓,
  Chromium pid30295 `f448ffd1…` ✓.
- **Bản `latest` byte-identical với file stamped cuối cùng từng thư mục:**
  round155-t0 `o8w-clicktest-report.json` = `f6756d04` = attempt2 ✓;
  round155-t8 webkit attempt2 = `1b9b09aa` ✓; chromium = `f448ffd1` ✓.
  Đúng thiết kế "latest" của T0-152.
- **Cây md5 lúc mở khớp đúng hồ sơ T10-155 lúc đóng:** preview.tsx `530e10a7`,
  media.ts `2c384ed1`, vite.config.ts `ee80d093`,
  server/render/src/effects.js `fedc0141`, O8 webkit script `4994b4fc`
  (clicktest-87o8-mask-track-webkit.mjs). Không đổi ngoài ý muốn.

## §4. O8 WebKit kiểm chứng trên boot #52: FAIL 0/2 — WebKit crash khi postboot chưa xong

Chạy trong scratch riêng `round156-t0/o8-webkit`, cổng :191/5564/bridge 8861
(tự chọn 8861–8869, như T0-155), script O8w md5 `4994b4fc`. Vite lock TRỐNG
lúc bắt đầu (last: 16:54:37Z t8-round155 RELEASED). KHÔNG chạy Chromium
fallback (theo tiền lệ T0-153/154/155); KHÔNG chạy tsc/vite build/npm test
(không chạm code TS/app).

- **Attempt1 (17:40:36–17:41:06Z, 30 s, EXIT=2): FAIL.**
  S0 PASS (mẫu tự load, 3 clip, 17:41:05Z); **S1 FAIL** — "không đo được rect
  checkbox tự tạo proxy" (toggle mouse, 17:41:05Z); rồi harnessError
  `page.setInputFiles: Target crashed` — waiting for locator
  `.mediabin input[type='file']` (dòng 555, bước S2 import). JSON stamped
  1.581 B, 2 results, md5 `9b412b0e…`. Dọn sạch, leftover-procs 0.
- **Attempt2 (17:41:09–17:56:10Z, 901 s, EXIT=124 timeout 900 s): FAIL.**
  S0 PASS duy nhất (17:41:38Z); rồi KẸT trong S1 `toggleCheckboxTo →
  clickRect` (dòng 550/442/376) — không thêm dòng log nào sau 17:41:38Z trong
  ~14 phút. Trình duyệt đã chết lúc **17:41:39Z**: WebKitWebProcess GLib
  CRITICAL `invalid (NULL) pointer instance` + `g_signal_connect_data`
  assertion failed; `GStreamer element appsink not found. Please install it.`
  + `autoaudiosink not found`; `Unable to acquire session bus: dbus-launch
  (No such file or directory)`; cuối cùng `mouse.click: Target page, context
  or browser has been closed` → process SIGKILL. JSON stamped 2.513 B,
  1 result (chỉ S0), md5 `79ab1323…`. Bản `latest` = attempt2 ✓.
  Dọn sạch, leftover-procs 0; `/tmp/.X11-unix/` lúc đóng chỉ còn X193/X194/X195
  (của các luồng khác, giống lúc T0-155 đóng).
- **Đánh giá nguyên nhân:** cả hai attempt chạy khi postboot CHƯA XONG — 11 gói
  apt thiếu (kể cả gstreamer plugins + libav + libevdev2; GST appsink/
  autoaudiosink không tìm thấy dù thư mục plugin đã symlink đủ 269 file),
  `apt-get update` của T5 vẫn đang chạy lúc đóng cờ. T5 EARLY-REPAIR chỉ kích
  lúc 17:45:55Z — SAU khi cả hai attempt đã bắt đầu (17:40/17:41Z). **Cùng họ
  chữ ký với T0-154 F-154-T0-1** (S1 FAIL + Target crashed khi replay vắng trên
  boot #48) — khác đợt 155 (postboot đầy đủ lúc T0 chạy, PASS 21/21 ×2).
  T0 KHÔNG kết luận nhân quả chắc chắn (chỉ 2 attempt, chưa đối chứng sau
  repair), nhưng tương quan môi trường → kết quả là rõ.
- **T0 KHÔNG chạy lại lần 3:** tiền lệ là 2 attempt (T0-154 FAIL 0/2 cũng
  không chạy lại sau repair); repair vẫn chưa xong lúc đóng cờ (apt-get update
  còn chạy 17:57Z, 11 gói vẫn thiếu 17:58Z) nên chạy lại lúc này nhiều khả năng
  lặp lại cùng chữ ký; O8 chính thức thuộc T8-156 sau postboot (xem §7).
- **Chuỗi WebKit FULL PASS GIỮ 11 — T0 không phán chuỗi** (chỉ T8 phán sau
  lượt yên hợp lệ; hai lượt này chỉ là kiểm chứng cơ chế, không tính vào
  chuỗi — như T0-155 §4).

## §5. Tình trạng hệ thống lúc mở / lúc đóng

- RAM avail: **1.087 MB lúc mở** (17:38Z) → **1.321 MB lúc đóng** (17:58Z);
  load 0,75 → 0,98. RAM avail lúc mở chỉ nhỉnh hơn ngưỡng 1.024 MB của T4.
- ENOSPC: **1 dòng lúc 17:38Z → 18 dòng lúc 17:58Z** trên boot #52 (cùng thông
  điệp `home-assistant-ensure.service: Failed to add control inotify watch
  descriptor ... No space left on device`, 17:38:45Z là dòng đầu). Journal
  volatile — chỉ đếm được boot hiện tại; **T9 sở hữu số chính thức**.
- Inotify: max_user_watches 63.747 (không đổi); watches đang dùng **14 lúc mở**
  (đếm nhanh qua /proc/*/fdinfo — xem F-156-T0-4, KHÔNG phải phương pháp đo
  headroom của T9). Bảng watch KHÔNG đầy ngay sau reboot (các process giữ watch
  đã chết theo #52); T9 đo headroom chính thức trong phiên.
- `/tmp/n2/clips` KHÔNG CÒN (reboot xóa /tmp) — fixture phải rebuild trước
  harness (quy tắc đứng mới quyết (l) đợt 155, cho T8-156).
- Các luồng đợt 156 khác đã chạy lúc T0 mở (T6 thấy đang chạy 17:39Z);
  T0 không va chạm cổng/lock với ai (lock trống, cổng :191/5564 riêng).
- repo-1 KHÔNG CÓ .git (`git status` → `fatal: not a git repository`) — trạng
  thái có sẵn từ đợt 155, không phải do T0 gây ra; vòng lặp làm việc trên file,
  push qua API từ main chat. T0 ghi nhận, không sửa.

## §6. Sai số của chính T0-156

- F-156-T0-1 — T0 bắt đầu O8 attempt1 lúc 17:40:36Z TRƯỚC khi kiểm tra xem
  postboot repair của T5 đã xong chưa (lúc mở dpkg chỉ 2 dòng đóng băng, cache
  0, lists 3, GST 0; EARLY-REPAIR chỉ kích 17:45:55Z). Attempt chạy trên môi
  trường chưa đầy đủ — cùng cái bẫy T0-154. Kết quả FAIL là thật với trạng thái
  lúc mở (không viết lại), nhưng slot kiểm chứng cơ chế đã phí vào boot chưa
  sẵn sàng. Bài học cho T0-157: kiểm postboot (dpkg/cache/lists/GST +
  POSTBOOT_PASS) TRƯỚC khi chạy O8; nếu repair đang chờ thì đợi T5 kích
  EARLY-REPAIR hoặc hoãn kiểm chứng cơ chế.
- F-156-T0-2 — Các lần đọc log 17:45–17:53Z khiến T0 tưởng attempt1 vẫn đang
  chạy: `tail` chỉ thấy dòng cuối S0 17:41:38Z trong khi attempt1 đã EXIT=2 lúc
  17:41:06Z và attempt2 đã bắt đầu 17:41:09Z. Nguyên nhân: T0 chỉ tail 3–6
  dòng cuối, không đọc toàn bộ log / không grep dòng EXIT cho tới 17:55:31Z.
  Đọc toàn bộ log lúc 17:55:31Z đã sửa đúng dòng thời gian. Không có kết luận
  sai nào được viết trước khi sửa.
- F-156-T0-3 — Lần đo F-measure đầu tiên (lệnh `date -u` so với `date`) so hai
  đồng hồ wall với nhau, không phải wall so với monotonic — đã bỏ; ba số liệu
  hợp lệ trong §1 đều dùng wall − (btime + uptime) (+0,646/+0,642/+0,641 s).
- F-156-T0-4 — Số watches inotify "14 lúc mở" (§5) là đếm nhanh của T0 qua
  /proc/*/fdinfo, KHÔNG phải phương pháp đo headroom của T9 — không được trích
  làm số headroom chính thức của đợt.

## §7. Nợ mở chuyển T10-156 / các luồng

1. **Reboot #52 ứng viên — giao T2-156 xác nhận số hiệu** (boot 5353ed19,
   btime 17:19:09Z; mù #84? đi kèm; #82?/#83? vẫn mở từ đợt 155).
2. **Kết cục run 155 + ứng viên điểm (m) thứ 12 — giao T7-156** (run có còn
   chạy tại btime #52 17:19:09Z không; hạn ngân sách 17:35:51Z).
3. **POSTBOOT_PASS #52 + watcher-156 — T5-156 sở hữu** (watcher-156 pid 4871
   đang chạy; repair chưa xong lúc T0 đóng cờ; POSTBOOT_PASS #51 KHÔNG CÓ và
   không bù được — ghi nhận, không mở lại).
4. **O8 chính thức đợt 156 thuộc T8-156** (sau postboot + lượt yên hợp lệ;
   kiểm/rebuild fixture trước harness lần 1 theo quy tắc (l) — /tmp đã bị xóa
   theo #52; hai lượt T0 FAIL 0/2 chỉ là kiểm chứng cơ chế, không tính chuỗi).
5. **Chuỗi WebKit FULL PASS GIỮ 11** (T8-156 phán có lên 12 không; T0 không
   phán).
6. **GAP §84 cần cập nhật nhãn khi T10-156 viết §85:** header §84 vẫn ghi
   "verdict CHẤP NHẬN — đề xuất, chờ quyết parent" trong khi parent đã quyết
   (a) CHẤP NHẬN ở aggregate §12.3 — T10-156 sửa nhãn như mẫu F-155-T1-1.
7. Nợ đứng giữ nguyên: G1 khung (a) M2 hoãn chờ user; R9 (a) chờ user (số đếm
   16); ci-security.yml 403 chờ user; TTS 39 cấm kiểm lại; birefnet 0 thử
   (đợt 156 là lần thứ 10 nếu không thử); headroom + ENOSPC (quyết (g)/(h) giữ
   "chỉ theo dõi"); repo-1 không có .git (ghi nhận §5).

---
*T0-156 đóng cờ ~17:58Z (trong hạn cờ ~20:00Z, hạn cứng 20:30Z). Không sửa code repo nào; không push/tag.*
*Stage: `phase9-round156-t0-boot-o8.txt` (1 entry NUL — LIMITS này).*
