# PHASE9_ROUND157_T5_INFRA_LIMITS — WATCHER-157 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #56 QUA REPLAY ĐẦY ĐỦ (KHÔNG CẦN REPAIR); #53/#54/#55 KHÔNG CÓ CỜ, KHÔNG BÙ ĐƯỢC; MARKER SỐNG QUA 8 REBOOT

> Luồng T5, đợt 157, lượt cron 03:35 +07 21/11/2026 (mở 20:35:51Z;
> T5 mở thực tế ~20:42Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #56 ỨNG VIÊN
> 348dab54-90f7-438e-924e-2c839630842b** (btime **19:32:47Z** —
> /proc/stat btime 1795203167; `uptime -s` 19:32:47Z; /proc/1
> 19:32:58Z (+11 s — cùng mẫu lệch, KHÔNG phải btime);
> journal first entry 19:32:59Z (+12 s); **T0-157 xác minh độc lập
> (cờ round157-t0.done 20:52:49Z): REBOOT #56 XÁC NHẬN, btime là
> GIỜ THẬT** — khớp Date header github.com từng giây lúc 20:44:16Z).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155, (o) đợt 156): KHÔNG cài unit, KHÔNG thử
> lại (1)/(2).** Watcher-156 pid 4871 CHẾT theo reboot #53 (log
> dừng 18:26:15Z, poll cuối boot 5353ed19); **watcher-157 khởi động
> bằng tay 20:43:36Z, pid 3428** (§3). **POSTBOOT_PASS cho #56 ĐÃ GHI
> 20:54:39Z (boot+1h21m52s, mode replay-day-du, poll=0)** — replay
> của cell tự chạy đầy đủ, KHÔNG cần repair (§3.1). **POSTBOOT_PASS
> #53/#54/#55: KHÔNG CÓ và KHÔNG BÙ ĐƯỢC** (cả ba boot đều chết
> ngoài phiên T5; journal + dpkg.log đã mất — §4; cùng tiền lệ
> #51 theo quyết (o) đợt 156). **POSTBOOT_PASS #52 VẪN CÒN trên
> đĩa** (round156-t5, 18:00:10Z — đã xác minh; bản sao lưu
> POSTBOOT_PASS-5353ed19 trong round157-t5). **Marker persistence
> `~/.config/vcut-persistence-marker` SỐNG QUA 8 REBOOT LIÊN TIẾP
> #49–#56** (§2.1). **KHÔNG push. KHÔNG release/tag.** KHÔNG tự
> chạy birefnet (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Timeline (giờ UTC, 20/11/2026 — giờ thật theo xác minh T0-157)

| Thời điểm | Sự kiện |
|---|---|
| 18:26:15Z | **Reboot #53, boot 062850d8** (btime; số hiệu CHỐT theo quyết (d) đợt 156) — watcher-156 poll cuối cùng giây này, CHẾT theo #53, không NEWBOOT |
| 18:29:43Z | **Reboot #54, boot 447f0efe** (btime) — #53 chỉ sống 208 s |
| 19:04:44Z | **Reboot #55, boot c99a1045** (btime) — #54 sống 2.101 s |
| 19:32:47Z | **Reboot #56, boot 348dab54** (btime /proc/stat 1795203167 — GIỜ THẬT, T0-157 xác minh) — #55 sống 1.683 s |
| 20:35:40Z | dpkg.log #56: 2 dòng startup đầu tiên (boot +62m53s — MUỘN bất thường, xem §4) |
| 20:35:51Z | Lượt cron đợt 157 mở |
| ~20:42Z | T5-157 mở: boot 348dab54, uptime ~1h10', **không watcher nào chạy**; không POSTBOOT_PASS cho #56; **replay của cell ĐANG CHẠY** — pid 919 `apt-get update` (con pid 898, os-intent replay), elapsed ~7' |
| 20:43:36Z | **Watcher-157 START (bằng tay, bash显式 + setsid nohup), pid 3428, boot 348dab54** |
| 20:43:36–20:49:07Z | Watcher poll đều 30 s (6 poll): dpkg 2 dòng, apt=[919], lists 3 — CHỜ, không repair (apt đang chạy, đúng luật) |
| ~20:49Z | `apt-get update` xong (~13–14 phút — cùng cỡ #52 ~12 phút); replay chuyển sang install từ cache |
| 20:49:37Z | dpkg 2 → 28 dòng; lists 3 → 37 |
| 20:50:07–20:52:08Z | dpkg 345 → 493 → 639 → 1.107 → 1.200 dòng; GST 0 → 32 → 256 → 269 |
| 20:53:47Z | dpkg **1.545 dòng** (md5 facd72cb), ổn định; apt/dpkg idle |
| 20:54:39Z | **REPLAY_DONE → postboot poll0 exit=0 → FLAG-WRITTEN: POSTBOOT_PASS boot 348dab54** (poll=0, replay-day-du) |
| 20:56:13Z | Stats script: 11/11 gói + 5/5 lib, GST 269, cache 178, lists 37, ENOSPC 16 dòng |
| 20:56:38Z | Kiểm cuối: vẫn boot 348dab54, watcher-157 pid 3428 đang poll đều |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155 + (o) đợt 156:
**(3) LÀ HƯỚNG ĐỨNG** — T0 kiểm tra watcher lúc mở, T5 khởi động
lại bằng tay. T5-157 kiểm tra lại nhanh `systemctl is-active`
(§A.8): user@0/logind/dbus vẫn inactive, không linger, không cron
— cell không đổi, kết luận đợt 154/155/156 giữ nguyên. Unit +
script ở `round154-t5/` GIỮ LẠI cho cell khác (không xóa, không
cài ở cell này).

### 2.1 Marker persistence — SỐNG QUA 8 REBOOT LIÊN TIẾP #49–#56

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52, #53, #54, #55, #56; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất (T0-157 xác minh độc lập: "Marker sống qua 8 reboot (#49–#56)") |
| `~/.config/pulse/` | Không kiểm lại đợt này (theo T5-155/156; không thuộc phạm vi T5-157) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49–#56 (8 reboot)** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (4 reboot ở đợt 156 →
  8 reboot đợt này). Home (`/home/hatch`, gồm `~/.config/` và
  `~/workspace/`) PERSISTENT qua rebuild — khẳng định lần thứ
  tám liên tiếp.

## 3. Watcher-157 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (~20:42Z): KHÔNG watcher nào chạy**
  (`pgrep replay-watch` chỉ tự khớp shell exec của chính T5 —
  cùng họ F-156-T5-1; không có tiến trình replay-watch thật).
  Ghi vào `round157-t5/watcher-status-at-open.txt` cho T0-157
  (T0-157 xác minh độc lập: "Watcher: CHẾT lúc mở (0 process
  replay-watch/sampler/poller; watcher-156 poll cuối 18:26:15Z
  boot 5353ed19, chết theo #53, không có NEWBOOT)").
- **Khởi động bằng tay 20:43:36Z, pid 3428** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp script bị
  Permission denied vì thiếu +x):
  `REPLAY-WATCH-157-START 2026-11-20T20:43:36Z pid=3428
  boot=348dab54 btime=2026-11-20 19:32:47Z end=2026-11-20T23:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2
  init_md5=351c1eea init_mtime=20:35:40Z cache=178 lists=3 gst_sys=0`
- **Thay đổi so với watcher-156 (3 điểm):**
  1. END = 23:30:00Z (hạn cứng đợt 157 theo task); DIR =
     round157-t5, OLD_T5_DIR = round156-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #56 + trạng thái replay ĐANG
     CHẠY lúc khởi động (pid 919 `apt-get update`, dpkg 2 dòng)
     — dự kiến REPLAY_DONE, không phải EARLY-REPAIR.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll).
- **Bài học sed (F-157-T5-3):** sed 156→157 làm sai 3 tham chiếu
  chéo trong stats script (cặp POSTBOOT, fallback sampler, grep
  §9) — đã sửa tay TRƯỚC khi chạy stats (xem §9). Header watcher
  cũng sửa tay sau sed (cùng họ F-156-T5-2). Bài học giữ nguyên:
  sed đổi số đợt không thay được ngữ nghĩa — đọc lại header +
  mọi tham chiếu chéo sau sed.
- **Poll đều đã xác minh:** 20:43:36Z, 20:44:06Z, 20:44:36Z,
  20:45:06Z, … 20:56:09Z — đúng chu kỳ 30 s, không trượt poll.

### 3.1 POSTBOOT_PASS cho #56 — HOÀN TẤT QUA REPLAY ĐẦY ĐỦ (KHÔNG REPAIR)

- **Poll đầu 20:43:36Z: CHƯA PASS** (dpkg 2 dòng, apt=[919],
  cache 178, lists 3, GST 0) → watcher giám sát, last_change neo
  từ mtime dpkg.log (20:35:40Z). **KHÔNG repair** — apt đang
  chạy, đúng luật "tuyệt đối KHÔNG repair khi apt/dpkg chạy".
- **Replay của cell tự tiến triển (không phải repair T5):**
  `apt-get update` pid 919 xong ~20:49Z (~13–14 phút — cùng cỡ
  #52 ~12 phút; lists trống sau reboot nên fetch toàn bộ, mirror
  chậm). Sau đó replay install từ cache (`--no-download`):
  dpkg 2 → 28 (20:49:37Z) → 345 → 493 → 639 → 1.107 → 1.200 →
  1.265 → **1.545 dòng (20:53:47Z, md5 facd72cb)**; GST 0 → 269;
  lists 3 → 37. Apt/dpkg idle từ ~20:54Z.
- **REPLAY_DONE 20:54:39Z** (dpkg 1.545 > 100, ổn định 2 poll,
  0 proc) → postboot check-only poll0 **exit=0** (hoàn tất
  20:54:39Z).
- **FLAG-WRITTEN 20:54:39Z** (`round157-t5/POSTBOOT_PASS`):
  `boot 348dab54-90f7-438e-924e-2c839630842b (btime 2026-11-20
  19:32:47Z; watcher-157) — replay-day-du: dpkg 1545 dong; cache
  178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc
  2026-11-20T20:54:39Z; POSTBOOT_PASS moi ghi 2026-11-20T20:54:39Z
  poll=0 (replay-day-du); co cu 5353ed19 luu POSTBOOT_PASS-5353ed19`.
- **Cờ lúc 20:54:39Z = boot+1h21m52s** — muộn hơn cờ #52
  (boot+41m01s) vì replay khởi động muộn (hoạt động dpkg đầu
  boot+62m53s, xem §4) + `apt-get update` chậm ~13–14 phút.
  Cửa sổ hở của hướng (3) ở #56: reboot 19:32:47Z → phiên 157
  mở 20:35:51Z (~63 phút) + ~8 phút tới khi watcher chạy +
  replay ~11 phút — tổng ~82 phút tới khi có cờ. Không có thiệt
  hại đo được: T0-157 đã BỎ QUA O8 kiểm chứng có chủ ý (đúng bài
  học F-156-T0-1 — postboot chưa xong lúc đó); O8 chính thức
  thuộc T8-157 sau postboot.
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script (§A, 20:56:13Z) + log poll0: wrapper PASS, libs PASS đủ
  5, GST PASS (269 = debroot 269, đủ isomp4 + libav), apt PASS đủ
  11 package, KẾT LUẬN "DU DIEU KIEN chay WebKit". **11/11 gói
  installed, 5/5 lib CÓ.**
- **So sánh #56 với #52/#50 và Dot 151:** dpkg **1.545 dòng**
  (khác #50/#52: 795 dòng — vì replay lần này khôi phục TOÀN BỘ
  intent đã ghi, không chỉ 11 gói WebKit; xem breakdown dưới);
  cache 178 cả ba (#56) vs 110 (#52); lists 37 (#56) vs 75 (#52)
  — replay dùng cache-first `--no-download` nên lists ít hơn
  nhưng postboot vẫn PASS; GST 269 cả ba. **Breakdown dpkg #56:
  169 install / 9 upgrade / 178 configure — KHỚP CHÍNH XÁC con
  số Dot 151 ghi trong header postboot script** (169/9/178,
  dpkg 1.545 dòng, cache 178) — replay khôi phục cùng một tập
  gói; md5 khác (facd72cb vs 51d12c3d — nội dung log khác nhau
  do thời gian).
- **Phối hợp T4/T8-157:** poller T4-157 + harness T8-157 đọc
  `round157-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  20:54:39Z. T0-157 ghi lúc đóng cờ (~20:52Z) là "POSTBOOT_PASS
  #56 CHƯA CÓ" — đúng tại thời điểm đó (cờ ghi 20:54:39Z, sau
  khi T0 đóng ~2 phút); T4/T8 dùng cờ này, không cần check-only
  dự phòng cho gate0 trên boot này nếu đọc đúng cờ.

## 4. Boot #53/#54/#55 — KHÔNG CÓ POSTBOOT_PASS, KHÔNG BÙ ĐƯỢC; boot #56 + #52

- **Boot #53 (062850d8, btime 18:26:15Z): KHÔNG CÓ cờ.** Sống
  chỉ **208 s** (18:26:15Z → 18:29:43Z), chết trước khi đợt 157
  mở; watcher-156 chết CÙNG giây với btime #53 (poll cuối
  18:26:15Z vẫn boot 5353ed19) nên không quan sát được #53;
  không có phiên T5 nào trong cửa sổ 208 s đó.
- **Boot #54 (447f0efe, btime 18:29:43Z): KHÔNG CÓ cờ.** Sống
  **2.101 s** (~35 phút) trong phiên 156, nhưng watcher-156 đã
  chết theo #53; T5-156 đã đóng cờ ~18:03Z (trước #54); không
  ai chạy T5 trong cửa sổ đó.
- **Boot #55 (c99a1045, btime 19:04:44Z): KHÔNG CÓ cờ.** Sống
  **1.683 s** (~28 phút) cuối phiên 156 / trước phiên 157;
  watcher chết; không có phiên T5 trong cửa sổ đó. Lưu ý: T8-156
  ĐÃ tự kiểm postboot đầy đủ trên #55 (lib 6/6, GST 269, dpkg
  1.545, cache 178, lists 39 — theo LIMITS T8-156) và chạy O8
  21/21 ×3 trên #55 — nhưng đó là CHECK, không phải cờ
  POSTBOOT_PASS do watcher ghi sau postboot poll trên boot đang
  sống. **T5 KHÔNG ghi cờ hồi tố từ log của T8** — cờ chứng
  nhận một phép đo trực tiếp trên boot sống; ghi hồi tố sẽ là
  tái tạo, không phải đo. Cùng tiền lệ #51 theo quyết (o) đợt
  156 (chấp nhận khoảng hở, không bù).
- **Bằng chứng đã mất:** `journalctl --list-boots` chỉ còn
  **1 boot (#56)** — journal của #53/#54/#55 đã mất theo
  rebuild (journal volatile, cùng mẫu các đợt trước); dpkg.log
  đã bị ghi đè bởi #56. Đã grep toàn bộ `POSTBOOT*` trong
  hidden_files — không file nào nhắc 062850d8/447f0efe/c99a1045.
  T0-157 xác minh độc lập: "#53/#54/#55 KHÔNG CÓ".
- **Boot #56 (348dab54):** rootfs làm mới; dpkg.log 2 dòng
  startup 20:35:40Z (**boot +62m53s — hoạt động đầu MUỘN nhất
  từng ghi**: #49 boot+44s, #50 boot+~53s, #52 boot+16m34s, #56
  boot+62m53s). Nguyên nhân: replay của cell (os-intent) khởi
  động muộn trên boot này — `apt-get update` pid 919 chỉ bắt
  đầu ~20:35:41Z. Sau đó replay chạy đầy đủ (§3.1). Cache APT
  178 .deb SỐNG qua reboot (RV-backed). Lists 3 → 37.
- **Boot #52 (5353ed19): POSTBOOT_PASS VẪN CÒN trên đĩa** —
  `round156-t5/POSTBOOT_PASS`, mtime 18:00:10Z, nội dung khớp
  LIMITS T5-156; bản sao đã lưu `round157-t5/
  POSTBOOT_PASS-5353ed19` (nội dung đã đối chiếu, khớp).
- **Đồng hồ — ghi nhận phát hiện của T0-157 (T5 không phán
  thêm):** đồng hồ wall của cell trong đợt 156 chạy NHANH hơn
  giờ thật J ≥ 42'46"; btime #56 (19:32:47Z) là GIỜ THẬT
  (Date header github.com khớp từng giây với đồng hồ local lúc
  20:44:16Z; F-measure +0,92/+0,93 s ổn định). Cửa sổ mù giờ
  thật (20:15:33Z − J, 19:32:47Z] — số hiệu #56 giả định không
  có boot ẩn trong đó; mù #88? giao T2-157. Mọi btime trong
  LIMITS này đều lấy từ `/proc/stat btime` theo quy tắc đứng
  (quyết (e) đợt 156); mọi timestamp phiên đều cùng đồng hồ
  local đã được T0 xác minh khớp giờ thật lúc 20:44:16Z.
  **Cảnh báo T0-157 cho T7-157 (ghi lại):** btime cell-wall đội
  J so với giờ thật, DB scheduler chạy khung host (giờ thật);
  tính offset (m) phải cùng một khung, nếu không offset lệch
  ~50 phút và phá dải 33–49,8 s. Nếu run 156 còn chạy tại giờ
  thật 19:32:47Z thì #56 là ứng viên điểm (m) thứ 15.

## 5. Quy tắc đứng (3) — áp dụng trong đợt 157

- T0-157 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0 xác
  minh độc lập watcher CHẾT lúc mở + T5 khởi động lại pid 3428
  ~20:43Z (cờ T0 ghi "T5-157 khởi động watcher-157 bằng tay +
  repair" — thực tế KHÔNG cần repair vì replay chạy đầy đủ;
  xem §3.1).
- **Hạn chế đã biết của (3) — đo được ở đợt này:** cửa sổ hở
  reboot → phiên mở ở #56 là **~63 phút** (19:32:47Z →
  20:35:51Z) + ~8 phút tới khi watcher-157 chạy + replay ~11
  phút — tổng **~82 phút tới khi có cờ**, dài nhất từ trước
  tới nay (so #52 ~41 phút, #50 ~21 phút). Nguyên nhân chính:
  replay khởi động muộn (boot+63') + `apt-get update` chậm.
  Thiệt hại đo được: KHÔNG có về hạ tầng (T0 đã bỏ qua O8
  kiểm chứng đúng lúc). Nhưng #53/#54/#55 là **ba boot liên
  tiếp lọt hoàn toàn không cờ** (sau #51 đợt 156) — cả ba đều
  chết ngoài phiên T5; hướng (3) không bắt được boot sống và
  chết hoàn toàn giữa hai đợt. Đây là khoảng hở đã biết, đã
  được parent chấp nhận ở quyết (o) đợt 156 cho #51; T5 chỉ
  ghi nhận, không tự chọn hướng mới (xem §8).
- **Watcher-157 tiếp tục giám sát tới 23:30:00Z**; nếu có reboot
  #57 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1 repair/
  boot) — T5-158 kiểm tra log.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-157 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **1.171.972 kB @20:56:13Z**; MemFree 156.352 kB.
  loadavg 1,34 @20:56:13Z. Sampler T9-157 ĐANG CHẠY
  (ram-sampler.log 13 mẫu 20:43:26–20:55:26Z, boot 348dab54,
  bal=5.478.676); b2-watcher pid 3550 đang chạy.
- **ENOSPC journal boot #56:** **16 dòng** lúc 20:56:13Z
  (journal 290 dòng) — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`. T9-157 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo (T0-157 đo 10 dòng lúc 20:47Z → 16 dòng lúc
  20:56:13Z — tăng chậm, cùng chiều).
- **Không reboot mới trong phiên T5** (boot vẫn 348dab54 lúc
  kiểm cuối 20:56:38Z — KHÔNG có #57; watcher-157 tiếp tục
  giám sát tới hạn cứng 23:30:00Z).
- **journal_boots chỉ còn 1 boot (#56):** journal của
  #53/#54/#55 không còn trong `journalctl --list-boots`
  (journal volatile theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 158 (từ T5-157)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 8 reboot
   #49–#56. T5-158 kiểm tra lại sau reboot kế tiếp (chuỗi bằng
   chứng tiếp tục).
3. **POSTBOOT_PASS cho #56 — XONG 20:54:39Z** (watcher-157,
   replay-day-du, poll=0; T4/T8-157 phối hợp qua cờ).
   Watcher-157 tiếp tục giám sát tới 23:30:00Z; nếu có reboot
   #57 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-158 kiểm tra log.
4. **POSTBOOT_PASS #53/#54/#55 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC**
   (cùng tiền lệ #51 theo quyết (o) đợt 156). Ba boot lọt hoàn
   toàn — khoảng hở đã biết của hướng (3), đã chấp nhận.
   Mù #85?/#86?/#87? giao T2-157; mù #88? (cửa sổ J) giao
   T2-157. Số hiệu #56 do T0-157 xác nhận.
5. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll0 đợt này — header log ghi
   boot e9295700/2e430750 đợt 151 trong khi checks là của #56):
   T5 đợt sau quyết có cập nhật theo Dot hay không. Đây là nợ
   thẩm mỹ trong log header, không ảnh hưởng kết quả check.
6. **Replay khởi động muộn + chậm — hoạt động dpkg đầu ở #56
   là boot+62m53s** (muộn nhất từng ghi), `apt-get update`
   ~13–14 phút. Nếu đợt sau replay cũng khởi động muộn, cờ có
   thể muộn tới boot+80' — T4/T8 lưu ý không chạy O8/harness
   trước khi cờ có (bài học F-156-T0-1; T0-157 đã làm đúng).
7. **Cửa sổ hở hướng (3) dài nhất: ~82 phút tới cờ #56.**
   Xem §8 — T5 không tự chọn hướng mới.
8. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 156 thuộc T7-157 (kết cục + #56 có phải điểm
   (m) thứ 15 không — xem cảnh báo T0-157 §4).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — nhưng đợt này có thêm 3 boot
  lọt hoàn toàn (#53/#54/#55, sau #51 đợt 156) và cửa sổ hở
  tới cờ dài nhất (~82 phút). Cả 4 boot lọt đều chết hoàn toàn
  ngoài phiên T5 — không có cơ chế nào trong cell hiện tại bắt
  được chúng ngoài việc rút ngắn nhịp kiểm tra của T0 (T0 mở
  sớm hơn sau reboot) hoặc kéo dài phiên T5 qua khoảng giữa
  hai đợt. T5 không tự chọn; hướng (3) đã được chấp nhận với
  cửa sổ này là "khoảng hở đã biết" (quyết (o) đợt 156).
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ tư liên tiếp.
- **Không ghi cờ POSTBOOT_PASS hồi tố cho #53/#54/#55 từ log
  của T8-156** (xem §4) — cờ chỉ chứng nhận phép đo trực tiếp
  trên boot sống. Nếu parent muốn ghi nhận trạng thái #55 theo
  cách khác (VD: ghi chú "đã đủ điều kiện theo self-check
  T8-156"), đó là quyết của parent, T5 không tự ghi.

## 9. Sai số của chính T5-157

- **F-157-T5-1 — `pgrep -af replay-watch` / `ram-sampler` /
  `b2-watcher` tự khớp shell exec của chính T5** (cùng họ
  F-156-T5-1/F-155-T5-2/F-154-T5-1). Đã nhận diện ngay là tự
  khớp (cmdline là lệnh exec chứa chuỗi tìm kiếm) và xác nhận
  watcher thật bằng log (START 20:43:36Z pid 3428) + pgrep -f
  có lọc; sampler thật bằng file log (13 mẫu, boot 348dab54)
  + b2-watcher pid 3550 (cmdline là đường dẫn script). Bài học
  giữ nguyên: luôn neo pattern + đối chiếu log/file, không tin
  mù pgrep. (Các dòng sampler_proc/b2_watcher_proc trong §A
  bị nhiễm tự khớp — xem ghi chú ở đó.)
- **F-157-T5-2 — Lệnh kiểm tra watcher sau khởi động dùng grep
  loại trừ sai + đọc log quá sớm.** `grep -v 'replay-watch-157\.'`
  đã loại luôn chính watcher (`bash replay-watch-157.sh` chứa
  chuỗi đó) nên ps_rc=1 giả; `cat` log 3 s sau khi khởi động
  báo "No such file" trong khi watcher thực tế đã chạy (START
  20:43:36Z — cat chạy trước khi file được tạo/flush trong
  cùng giây). Đã sửa bằng `pgrep -f 'replay-watch-157.sh'` +
  đọc lại log: watcher pid 3428 đang chạy, poll đều. Bài học:
  không loại trừ bằng hậu tố trùng tên file; chờ ít nhất 1
  poll (30 s) rồi mới kết luận watcher có chạy không.
- **F-157-T5-3 — Sed 156→157 làm sai 3 tham chiếu chéo trong
  stats script** (cặp POSTBOOT thành (157,157); fallback sampler
  thành (157,157); grep §9 thành round156) — cùng họ F-156-T5-2.
  Đã sửa tay TRƯỚC khi chạy stats (cặp POSTBOOT (157,156);
  fallback (157,156); grep round157). Output stats lần này
  ĐÚNG (§A). Bài học giữ nguyên: sed đổi số đợt không thay
  được ngữ nghĩa — đọc lại header + mọi tham chiếu chéo sau sed
  (đã làm đúng lần này, cả watcher script lẫn stats script).
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-157.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (348dab54, btime
  19:32:47Z) + khớp độc lập với T0-157 (cờ round157-t0.done
  20:52:49Z).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t5/t5-stats-157.py`
(output đầy đủ lưu tại `t5-stats-157-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 20:56:13Z, SAU khi cờ POSTBOOT_PASS #56
đã ghi; F-157-T5-1: các dòng sampler_proc/b2_watcher_proc trong
§7 tự khớp shell exec của T5 — bằng chứng thật là file
ram-sampler.log 13 mẫu boot 348dab54 + b2-watcher pid 3550).
Trích nguyên văn các phần chính:

```
=== PHU LUC SO LIEU T5-157 (trich bang script, 2026-11-20T20:56:13Z) ===

--- 1. Boot hien tai ---
boot_id=348dab54-90f7-438e-924e-2c839630842b
btime_epoch=1795203167 = 2026-11-20T19:32:47Z
uptime_s=5005.97 now=2026-11-20T20:56:13Z
/proc/1 mtime=2026-11-20 19:32:58.940812353 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 348dab5490f7438e924e2c839630842b Fri 2026-11-20 19:32:59 UTC Fri 2026-11-20 20:55:51 UTC

--- 2. replay-watch-156.log ---
tong_dong=69
START=1 poll=62 NEWBOOT=0 END=0 EARLY-REPAIR=1 FLAG-WRITTEN=1
dong_dau: REPLAY-WATCH-156-START 2026-11-20T17:41:21Z pid=4871 boot=5353ed19 btime=2026-11-20 17:19:09Z end=2026-11-20T20:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=06c15c91 init_mtime=17:35:43Z cache=0 lists=3 gst_sys=0
dong_cuoi: 2026-11-20T18:26:15Z boot=5353ed19 poll dpkg_lines=795 md5=b303899f apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75
boot_xuat_hien=['5353ed19']
mtime_log=2026-11-20T18:26:15Z size=8353

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t5/POSTBOOT_PASS (mtime 2026-11-20T20:54:39Z) ---
boot 348dab54-90f7-438e-924e-2c839630842b (btime 2026-11-20 19:32:47Z; watcher-157) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-20T20:54:39Z; POSTBOOT_PASS moi ghi 2026-11-20T20:54:39Z poll=0 (replay-day-du); co cu 5353ed19 luu POSTBOOT_PASS-5353ed19

--- 3. /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t5/POSTBOOT_PASS (mtime 2026-11-20T18:00:10Z) ---
boot 5353ed19-ddcb-46cc-9eca-9c9f86ba9706 (btime 2026-11-20 17:19:09Z; watcher-156) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-20T18:00:10Z; POSTBOOT_PASS moi ghi 2026-11-20T18:00:10Z poll=1 (repair-som-quyet-h); co cu d849728b luu POSTBOOT_PASS-d849728b

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=facd72cb mtime=2026-11-20 20:53:47.460800879 +0000
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
ENOSPC_dong=16
journal_dong=290

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          156352 kB
MemAvailable:    1171972 kB
loadavg=1.34 2.95 1.93 1/473 33764
sampler /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ram-sampler.log: tong_mau=13 dau=2026-11-20T20:43:26 cuoi=2026-11-20T20:55:26Z boot=348dab54 mem=1319644 bal=5478676 swapfree=731040 load1=1.75
sampler_proc=3377 /bin/bash --norc --noprofile -c umask 0007; D=~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9; cd $D && nohup bash sampler.sh > sampler-nohup.out 2>&1 & echo "sampler pid $!"; nohup bash b2-watcher.sh > b2-nohup.out 2>&1 & echo "watcher pid $!"; sleep 3; cat $D/ram-sampler.log 2>/dev/null; ps -eo pid,etime,args | grep -E 'sampler.sh|b2-watcher' | grep -v grep
4162 /bin/bash --norc --noprofile -c umask 0007; sleep 1500; date -u '+WAKE %FT%TZ'; cat /proc/sys/kernel/random/boot_id | cut -c1-8; grep -E '^btime' /proc/stat; tail -2 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ram-sampler.log; wc -l ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ram-sampler.log ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/b2-spikes.log 2>/dev/null; ps -eo pid,etime,args | grep -E 'sampler\.sh|b2-watcher' | grep -v grep; ls ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ | grep -E 'guard|trigger|fired' || echo "no-guard-files"
33765 /bin/sh -c pgrep -af ram-sampler 2>/dev/null
b2_watcher_proc=3377 /bin/bash --norc --noprofile -c umask 0007; D=~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9; cd $D && nohup bash sampler.sh > sampler-nohup.out 2>&1 & echo "sampler pid $!"; nohup bash b2-watcher.sh > b2-nohup.out 2>&1 & echo "watcher pid $!"; sleep 3; cat $D/ram-sampler.log 2>/dev/null; ps -eo pid,etime,args | grep -E 'sampler.sh|b2-watcher' | grep -v grep
3550 bash b2-watcher.sh
4162 /bin/bash --norc --noprofile -c umask 0007; sleep 1500; date -u '+WAKE %FT%TZ'; cat /proc/sys/kernel/random/boot_id | cut -c1-8; grep -E '^btime' /proc/stat; tail -2 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ram-sampler.log; wc -l ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ram-sampler.log ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/b2-spikes.log 2>/dev/null; ps -eo pid,etime,args | grep -E 'sampler\.sh|b2-watcher' | grep -v grep; ls ~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t9/ | grep -E 'guard|trigger|fired' || echo "no-guard-files"
33767 /bin/sh -c pgrep -af b2-watcher 2>/dev/null

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

--- 9. Co round157 .done ---
-rw-rw---- 1 root nogroup 3552 2026-11-20T20:52:49Z /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t0.done
round157-t0
round157-t0.done
round157-t1
round157-t2
round157-t4
round157-t5
round157-t6
round157-t7
round157-t8
round157-t9

=== HET PHU LUC T5-157 2026-11-20T20:56:14Z ===
```

Log postboot poll0 (`t5-postboot-poll0-348dab54.log`, 20:54:39Z,
exit 0 — trích phần check; header log còn ghi Dot 151, xem §7.5):

```
[postboot 2026-11-20 19:32:47] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-20 19:32:47] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-20 19:32:47] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là thư mục thật (apt)
[postboot 2026-11-20 19:32:47] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-20 19:32:47] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-20 19:32:47] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-20 19:32:47] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 19:32:47)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round157-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t5/`
  (không nằm trong repo nên không stage): `replay-watch-157.sh`,
  `t5-stats-157.py`, `t5-stats-157-output.txt`,
  `replay-watch-157.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-5353ed19`,
  `t5-postboot-poll0-348dab54.log`.

