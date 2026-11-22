# PHASE9_ROUND156_T5_INFRA_LIMITS — WATCHER-155 CHẾT THEO #51; WATCHER-156 KHỞI ĐỘNG BẰNG TAY, POSTBOOT_PASS #52 QUA EARLY-REPAIR; #51 KHÔNG CÓ CỜ, KHÔNG BÙ ĐƯỢC; MARKER SỐNG QUA 4 REBOOT

> Luồng T5, đợt 156, lượt cron 00:35 +07 21/11/2026 (mở 17:35:51Z;
> T5 mở thực tế ~17:38Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT HIỆN TẠI #52 ỨNG VIÊN
> 5353ed19-ddcb-46cc-9eca-9c9f86ba9706** (btime **17:19:09Z** —
> /proc/stat btime 1795195149; `uptime -s` 17:19:09Z; /proc/1
> 17:19:25Z — khớp; T0-156 xác minh độc lập bằng 5 nguồn).
> **KẾT LUẬN CHÍNH — HƯỚNG (3) VẪN LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154,
> ghi nhận lại (q) đợt 155): KHÔNG cài unit, KHÔNG thử lại (1)/(2).**
> Watcher-155 CHẾT theo reboot #51 (không NEWBOOT, poll cuối
> 17:05:38Z vẫn boot #50); **watcher-156 khởi động bằng tay
> 17:41:21Z, pid 4871** (§3). **POSTBOOT_PASS cho #52 ĐÃ GHI
> 18:00:10Z (boot+41m01s, mode repair-som-quyet-h, poll=1)** —
> qua EARLY-REPAIR (§3.1): `apt-get update` chậm ~12 phút rồi
> install 11 gói, dpkg 2 → 795 dòng, cache 0 → 110, lists 3 → 75,
> GST 0 → 269. **POSTBOOT_PASS #51 KHÔNG CÓ và KHÔNG BÙ ĐƯỢC**
> (boot #51 chỉ sống 13m40s, journal đã mất — §4). **Marker
> persistence `~/.config/vcut-persistence-marker` SỐNG QUA 4
> REBOOT LIÊN TIẾP #49/#50/#51/#52** (§2.1). **KHÔNG push.
> KHÔNG release/tag.** KHÔNG tự chạy birefnet (thuộc T9). KHÔNG
> đụng file workflow (ci-security.yml vẫn 403 chờ user). TTS 39
> CẤM kiểm lại.

## 1. Timeline (giờ UTC, 20/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 15:04:07Z | Reboot #50, boot d849728b (btime; T10-155) |
| 15:25:50Z | POSTBOOT_PASS #50 ghi bởi watcher-155 (repair-som-quyet-h, poll=1) |
| 17:05:29Z | **btime boot c931d371 (#51 ỨNG VIÊN)** — trong lúc T10-155 đóng sổ |
| 17:05:38Z | Poll cuối watcher-155 (vẫn boot d849728b trong log — xem §4); watcher chết theo #51, KHÔNG dòng NEWBOOT |
| 17:19:09Z | **btime boot 5353ed19 (#52 ỨNG VIÊN)** — boot #51 chỉ sống 13m40s |
| 17:35:43Z | dpkg.log #52: 2 dòng startup configure đầu tiên (boot +16m34s — MUỘN bất thường, xem §4) |
| 17:35:51Z | Lượt cron đợt 156 mở |
| ~17:38Z | T5-156 mở: boot 5353ed19, uptime ~19', **không watcher nào chạy**; không POSTBOOT_PASS cho #51 lẫn #52 |
| 17:41:21Z | **Watcher-156 START (bằng tay, bash显式 + setsid nohup), pid 4871, boot 5353ed19** |
| 17:45:55Z | **EARLY-REPAIR TRIGGER** (boot_age 1606 s, frozen 612 s, dpkg 2 dòng) — verify form-B exit=1 (đúng kỳ vọng) |
| ~17:45:56Z | `--repair` bắt đầu: `apt-get update` (timeout 1500 s) — CHẬM, ~12 phút |
| ~17:58Z | `apt-get update` xong (lists 3 → 75); `apt-get install` 11 gói bắt đầu (timeout 1800 s) |
| 18:00:09Z | dpkg.log đạt 795 dòng (md5 b303899f); postboot poll1 exit 0 |
| 18:00:10Z | **FLAG-WRITTEN: POSTBOOT_PASS boot 5353ed19** (poll=1, repair-som-quyet-h) |
| 18:02:36Z | Stats script lần 1: 11/11 gói + 5/5 lib, GST 269, cache 110, lists 75, ENOSPC 21 dòng |
| 18:03:03Z | Kiểm cuối: vẫn boot 5353ed19, watcher-156 pid 4871 đang poll đều |

## 2. Hướng (3) đứng — kiểm tra lại nhanh, KHÔNG thử lại (1)/(2)

Quyết parent (e) đợt 154 + ghi nhận (q) đợt 155: **(3) LÀ HƯỚNG
ĐỨNG** — T0 kiểm tra watcher lúc mở, T5 khởi động lại bằng tay.
T5-156 kiểm tra lại nhanh `systemctl is-active` (§A.8):
user@0/logind/dbus vẫn inactive, không linger, không cron — cell
không đổi, kết luận đợt 154/155 giữ nguyên. Unit + script ở
`round154-t5/` GIỮ LẠI cho cell khác (không xóa, không cài ở
cell này).

### 2.1 Marker persistence — SỐNG QUA 4 REBOOT LIÊN TIẾP #49/#50/#51/#52

| Bằng chứng | Giá trị |
|---|---|
| `~/.config/vcut-persistence-marker` | **CÒN** sau #49, #50, #51, #52; nội dung ghi 2026-11-20T11:39:40Z, boot 2c0a7985 (#48); stat mtime 11:39:47Z — không bị ghi đè, không mất (T0-156 xác minh độc lập: "sống qua 4 reboot") |
| `~/.config/pulse/` | mtime 2026-11-20 10:32:15Z (đợt 154) — vẫn còn (theo T5-155; T5-156 không kiểm lại thư mục này) |

- **Kết luận 2.1:** marker do T5-154 ghi trên boot #48 đã **sống
  qua rootfs rebuild #49, #50, #51, #52** — chuỗi bằng chứng
  persistence dài nhất từ trước tới nay (4 reboot). Home
  (`/home/hatch`, gồm `~/.config/` và `~/workspace/`)
  PERSISTENT qua rebuild — khẳng định lần thứ tư liên tiếp.

## 3. Watcher-156 — chạy bằng tay (quy tắc đứng (3))

- **Trạng thái lúc mở (~17:38Z): KHÔNG watcher nào chạy**
  (`ps` grep replay-watch/ram-sampler/b2-watcher: rỗng lúc mở
  đối với watcher; ram-sampler + b2-watcher của T9-156 chỉ
  khởi động sau đó — xem §6). Ghi vào `round156-t5/
  watcher-status-at-open.txt` cho T0-156 (T0-156 xác minh độc
  lập: "T5-156 đã khởi động lại watcher-156 pid 4871 ~17:41Z").
- **Khởi động bằng tay 17:41:21Z, pid 4871** (setsid nohup,
  `bash`显式 — bài học đợt 155: chạy trực tiếp
  `replay-watch-155.sh` bị Permission denied vì thiếu +x):
  `REPLAY-WATCH-156-START 2026-11-20T17:41:21Z pid=4871
  boot=5353ed19 btime=2026-11-20 17:19:09Z end=2026-11-20T20:30:00Z
  interval=30s early_repair_at_boot+900s frozen>=600s
  init_lines=2 init_md5=06c15c91 init_mtime=17:35:43Z cache=0
  lists=3 gst_sys=0`
- **Thay đổi so với watcher-155 (3 điểm):**
  1. END = 20:30:00Z (hạn cứng đợt 156 theo task, không phải
     mở +3h = 20:35:51Z); DIR = round156-t5, OLD_T5_DIR =
     round155-t5 (tìm cờ cũ).
  2. Header comment cập nhật boot #52 + trạng thái replay chưa
     tiến triển lúc khởi động (dpkg 2 dòng, đóng băng từ
     17:35:43Z); dự kiến EARLY-REPAIR thay vì REPLAY_DONE.
  3. Logic không đổi (kế thừa F-152-T5-3 đã sửa: `write_flag`
     nhận timestamp HOÀN TẤT poll).
- **Bài học sed (F-156-T5-2):** sed 155→156 để lại header cũ
  sai boot (#49) — đã sửa tay TRƯỚC khi khởi động watcher
  (cùng họ F-155-T5-3). Stats script §2 cũng sửa tay tham
  chiếu chéo round155-t5 (xem §9).

### 3.1 POSTBOOT_PASS cho #52 — HOÀN TẤT QUA EARLY-REPAIR

- **Poll đầu 17:41:21Z: CHƯA PASS** (dpkg 2 dòng, 0 apt/dpkg,
  cache 0, lists 3, GST 0) → watcher giám sát, last_change neo
  từ mtime dpkg.log (17:35:43Z).
- **EARLY-REPAIR TRIGGER 17:45:55Z** (boot_age 1606 s > 900 s;
  frozen 612 s ≥ 600 s; dpkg 2 < 100; 0 proc; chưa repair) →
  verify form-B postboot check-only **exit=1** (hoàn tất
  17:45:56Z, đúng kỳ vọng — hệ thống thiếu đủ 11 gói + 5 lib +
  GST).
- **`--repair` chạy 17:45:56Z → 18:00:10Z (~14 phút — CHẬM
  HƠN HẲN #50: trigger 15:23:24Z → cờ 15:25:50Z, chỉ ~2,5
  phút):**
  - `apt-get update` (timeout 1500 s): **~12 phút**
    (17:45:56Z → ~17:58Z). Lists trống sau reboot (3 entry)
    nên phải fetch toàn bộ; partial tăng chậm 108 → 122 file
    trong 3 phút (17:53Z → 17:56Z) rồi mới commit lists 75.
    Không kẹt cứng — tiến triển thật nhưng mirror chậm.
  - `apt-get install` 11 gói (timeout 1800 s): bắt đầu ~17:58Z,
    dpkg.log 2 → 795 dòng lúc 18:00:09Z.
  - Postboot poll1 sau repair **exit=0** (hoàn tất 18:00:10Z).
- **FLAG-WRITTEN 18:00:10Z** (`round156-t5/POSTBOOT_PASS`):
  `boot 5353ed19-ddcb-46cc-9eca-9c9f86ba9706 (btime 2026-11-20
  17:19:09Z; watcher-156) — repair-som-quyet-h: dpkg 795 dong;
  cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0
  luc 2026-11-20T18:00:10Z; POSTBOOT_PASS moi ghi
  2026-11-20T18:00:10Z poll=1 (repair-som-quyet-h); co cu
  d849728b luu POSTBOOT_PASS-d849728b`.
- **Cờ lúc 18:00:10Z = boot+41m01s** — muộn hơn cờ #50
  (boot+21m43s) vì `apt-get update` chậm ~12 phút. Cửa sổ hở
  của hướng (3) ở #52: reboot 17:19:09Z → phiên 156 mở
  17:35:51Z (~16,7 phút) + ~5,5 phút tới khi watcher chạy +
  repair chậm — tổng ~41 phút tới khi có cờ. Không có thiệt
  hại đo được: T0-156 chạy O8 kiểm chứng TRƯỚC khi postboot
  xong nên FAIL 0/2 (xem §4.1 — đó là sai số của T0, F-156-T0-1,
  không phải thiệt hại của hạ tầng; O8 chính thức thuộc T8-156
  sau postboot).
- **Kiểm chứng độc lập bởi T5 (không chỉ tin watcher):** stats
  script lần 1 (18:02:36Z) + log poll1 (§A): wrapper PASS,
  libs PASS đủ 5, GST PASS (269 = debroot 269, đủ isomp4 +
  libav), apt PASS đủ 11 package, KẾT LUẬN "DU DIEU KIEN chay
  WebKit". **11/11 gói installed, 5/5 lib CÓ** (script §A lần 1).
- **So sánh #52 với #50 (cùng chữ ký dpkg sau repair đầy đủ):**
  dpkg **795 dòng cả hai, md5 khác** (b303899f #52 vs a5200d2e
  #50 — nội dung log khác nhau do thời gian/gói); cache 110
  cả hai; lists 75 cả hai; GST 269 cả hai. Chữ ký hậu-repair
  #52 KHỚP HOÀN TOÀN #50 về số lượng — replay/repair cho cùng
  một trạng thái hệ thống.
- **Phối hợp T4/T8-156:** poller T4-156 + harness T8-156 đọc
  `round156-t5/POSTBOOT_PASS` (chính) — cờ đã có sẵn từ
  18:00:10Z. T0-156 đã xác minh cờ CHƯA CÓ lúc đóng (~18:00Z,
  repair đang chạy) — cờ ghi đúng lúc T0 đóng; T4/T8 dùng cờ
  này, không cần check-only dự phòng cho gate0 trên boot này
  nếu đọc đúng cờ (T10 xác minh độc lập).

## 4. Boot #52 (5353ed19) + boot #51 (c931d371) — cờ #51 KHÔNG CÓ, KHÔNG BÙ ĐƯỢC

- **Boot #52:** rootfs làm mới (chữ ký như #49/#50): dpkg.log
  2 dòng startup configure 17:35:43Z (boot +16m34s) rồi ĐÓNG
  BĂNG tới khi watcher repair 17:45:55Z. **Hoạt động đầu của
  dpkg MUỘN bất thường** (boot+16m34s, so với #49 boot+44s và
  #50 boot+~53s) — nguyên nhân chưa rõ, T5 chỉ ghi mốc; có thể
  replay daemon khởi động muộn trên boot này. Sau repair,
  dpkg ổn định 795 dòng (md5 b303899f không đổi qua các poll
  18:00–18:03Z). Cache 0 → 110 .deb, lists 3 → 75, GST 0 → 269.
- **Boot #51 (c931d371, btime 17:05:29Z): KHÔNG CÓ POSTBOOT_PASS
  trên đĩa** — đã grep toàn bộ `POSTBOOT*` trong hidden_files
  (chỉ có cờ #50 d849728b 15:25:50Z + cờ cũ #49/#48); T0-156
  xác minh độc lập "POSTBOOT_PASS #51 KHÔNG CÓ, không bù được".
  **Không thể bù sau:** boot #51 chỉ sống 13m40s
  (17:05:29Z → 17:19:09Z), journal của #51 đã mất
  (`journalctl --list-boots` chỉ còn #52), dpkg.log đã bị ghi
  đè bởi #52, không ai chạy T5 trong cửa sổ đó (watcher-155
  chết theo #51; đợt 156 mở sau #52). Đây là lần đầu tiên một
  boot KHÔNG CÓ cờ postboot nào — hệ quả trực tiếp của cửa sổ
  hở hướng (3) khi reboot xảy ra ngoài phiên. T5 không tự phán
  số hiệu #51/#52; **mù #82?/#83? + số hiệu #52 giao T2-156**
  (theo nợ đợt 155).
- **Đồng hồ — KHÔNG nghịch lý mới:** poll cuối watcher-155
  17:05:38Z vẫn ghi boot d849728b trong khi btime #51 là
  17:05:29Z — tức đồng hồ cell cũ chạy NHANH hơn btime boot
  mới ≥9s (cùng chữ ký "nghịch lý đồng hồ + migration overlap"
  mà MEMORY ghi cho #49: overlap ~20 s; ở #51 là ~9 s).
  T0-156 đo F-measure +0,64 s ổn định (3 lần đọc) — không phải
  nghịch lý đồng hồ kiểu #45. T5 không phán thêm.
- **POSTBOOT_PASS trên đĩa lúc mở:** CHỈ có cờ #50
  (round155-t5, 15:25:50Z) — STALE cho #52; cờ #52 do
  watcher-156 viết (§3.1); cờ cũ #50 đã lưu thành
  `POSTBOOT_PASS-d849728b` trong round156-t5.

### 4.1 O8 kiểm chứng của T0-156 FAIL 0/2 — vì postboot chưa xong (không phải lỗi hạ tầng)

- T0-156 chạy O8 WebKit kiểm chứng TRƯỚC khi postboot #52 xong:
  attempt1 EXIT=2 (S1 FAIL, Target crashed tại setInputFiles),
  attempt2 EXIT=124 timeout 900 s (kẹt S1 clickRect, WebKitWebProcess
  GLib CRITICAL, GStreamer appsink/autoaudiosink not found).
  Nguyên nhân T0 tự nhận (F-156-T0-1): cả 2 attempt chạy khi
  11 gói apt vẫn thiếu (EARLY-REPAIR chỉ kích 17:45:55Z, sau
  khi attempt đã bắt đầu). **T5 ghi nhận: đây là sai số thứ tự
  của T0, không phải lỗi hạ tầng — postboot #52 đã PASS poll1
  18:00:10Z, đủ điều kiện chạy WebKit từ lúc đó.** O8 chính thức
  thuộc T8-156 sau postboot; chuỗi WebKit FULL PASS giữ 11 —
  T0 không phán chuỗi. Bài học cho T0-157: kiểm tra cờ
  POSTBOOT_PASS trước khi chạy O8 kiểm chứng.

## 5. Quy tắc đứng (3) — áp dụng trong đợt 156

- T0-156 kiểm tra watcher lúc mở (quyết (e) đợt 154): T0 xác
  minh độc lập watcher CHẾT lúc mở + T5 khởi động lại pid 4871
  ~17:41Z. T5 đã ghi trạng thái lúc mở vào
  `watcher-status-at-open.txt` trước khi khởi động.
- **Hạn chế đã biết của (3) — đo được ở đợt này:** cửa sổ hở
  reboot → phiên mở ở #52 là **~16,7 phút** (17:19:09Z →
  17:35:51Z) + ~5,5 phút tới khi watcher-156 chạy + repair chậm
  ~14 phút — tổng **~41 phút tới khi có cờ**. Dài hơn #50
  (~21 phút tới cờ) vì `apt-get update` chậm. Thiệt hại đo
  được: KHÔNG có về hạ tầng (chỉ O8 kiểm chứng của T0 chạy
  sớm — xem §4.1). Nhưng #51 (boot ngoài phiên, sống 13m40s)
  là trường hợp đầu tiên hướng (3) để lọt HOÀN TOÀN một boot
  không cờ — parent đã chấp nhận cửa sổ hở này là "khoảng hở
  đã biết" (quyết (e) đợt 154); T5 chỉ ghi nhận, không tự chọn
  hướng mới.

## 6. Infra thường kỳ

- **RAM/balloon (snapshot, T9-156 là chủ):** MemTotal 8.124.900
  kB; MemAvailable **1.159.860 kB @18:02:36Z**; MemFree 210.072 kB.
  loadavg 1,75 @18:02:36Z (đang install xong, T9 sampler chạy).
  Sampler T9-156 ĐANG CHẠY (ram-sampler.log 23 mẫu 17:39:56–
  18:01:58Z, boot 5353ed19, bal=5.644.600); b2-watcher pid 3709
  đang chạy.
- **ENOSPC journal boot #52:** **21 dòng** lúc 18:02:36Z
  (journal 189 dòng) — cùng chữ ký `home-assistant-ensure.
  service: Failed to add control inotify watch descriptor ...
  No space left on device`. T9-156 đếm chính thức; T5 chỉ ghi
  nhận số lúc đo (T0-156 đo 1 dòng lúc mở → 18 dòng lúc đóng
  ~18:00Z; T5 đo 21 dòng 18:02:36Z — tăng chậm, cùng chiều).
  (So sánh: #49 có 59 dòng lúc mở, ≥133 dòng cuối phiên theo
  quyết (r) đợt 155 — #52 mới 21 dòng ở đầu phiên.)
- **Không reboot mới trong phiên T5** (boot vẫn 5353ed19 lúc
  kiểm cuối 18:03:03Z — KHÔNG có #53; watcher-156 tiếp tục
  giám sát tới hạn cứng 20:30:00Z, tự ghi NEWBOOT nếu có
  reboot sau khi T5 đóng cờ).
- **journal_boots chỉ còn 1 boot (#52):** journal của #51
  không còn trong `journalctl --list-boots` (journal volatile
  theo rebuild — cùng mẫu các đợt trước).

## 7. Nợ mở chuyển đợt 157 (từ T5-156)

1. **Watcher respawn — (3) LÀ HƯỚNG ĐỨNG (quyết (e) đợt 154).**
   Unit file + script ở round154-t5/ GIỮ LẠI cho cell khác
   (không xóa, không cài). T5 đợt sau chỉ kiểm tra lại nhanh
   `systemctl is-active user@0` trước khi kết luận lại — chỉ
   thử lại (1) nếu cell thay đổi (VD: image mới có dbus/logind
   chạy).
2. **Marker persistence** `~/.config/vcut-persistence-marker`
   (ghi 11:39:40Z trên #48) — ĐÃ CHỨNG MINH sống qua 4 reboot
   #49/#50/#51/#52. T5-157 kiểm tra lại sau reboot kế tiếp
   (chuỗi bằng chứng tiếp tục).
3. **POSTBOOT_PASS cho #52 — XONG 18:00:10Z** (watcher-156,
   repair-som-quyet-h, poll=1; T4/T8-156 phối hợp qua cờ).
   Watcher-156 tiếp tục giám sát tới 20:30:00Z; nếu có reboot
   #53 trong phiên thì watcher tự ghi NEWBOOT + xử lý (1
   repair/boot) — T5-157 kiểm tra log.
4. **POSTBOOT_PASS #51 — KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (boot sống
   13m40s ngoài phiên; journal + dpkg.log đã mất). Ghi nhận là
   trường hợp đầu tiên hướng (3) để lọt hoàn toàn một boot.
   Mù #82?/#83? + số hiệu #52 giao T2-156 phán (T5 chỉ ghi
   mốc btime + poll cuối watcher-155).
5. **Nợ header postboot script còn ghi Dot 151** (ghi nhận từ
   T5-152 §5.4, thấy lại ở log poll1/repair đợt này — header
   log ghi boot e9295700/2e430750 đợt 151 trong khi checks là
   của #52): T5 đợt sau quyết có cập nhật theo Dot hay không.
   Đây là nợ thẩm mỹ trong log header, không ảnh hưởng kết quả
   check.
6. **Repair chậm — `apt-get update` ~12 phút ở #52** (lists
   trống sau reboot, mirror chậm; partial tăng 108 → 122 file
   trong 3 phút). So với #50 (~2,5 phút toàn bộ repair): lần
   đầu tiên pha update chiếm ưu thế. Nếu đợt sau lists cũng
   trống, cờ có thể muộn tới boot+40' — T4/T8 lưu ý không chạy
   O8/harness trước khi cờ có (bài học F-156-T0-1).
7. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet. Run 155 thuộc T7-156 (kết cục + #51/#52 có viết
   lại run 155 không; #52 là ứng viên điểm (m) thứ 12 theo T0-156).

## 8. Đề xuất cho parent (T5 không tự chọn)

- **(3) vẫn đủ cho hiện tại** — nhưng #51 là lần đầu một boot
  lọt hoàn toàn không cờ, và #52 cho thấy repair có thể chậm
  tới boot+41' khi lists trống + mirror chậm. Nếu parent muốn
  thu hẹp, lựa chọn duy nhất trong cell hiện tại vẫn là rút
  ngắn nhịp kiểm tra của T0 (T0 mở sớm hơn sau reboot) — T5
  không tự chọn; hướng (3) đã được chấp nhận với cửa sổ này
  là "khoảng hở đã biết".
- **Không thử lại (1)/(2) ở đợt sau** trừ khi cell thay đổi
  (image mới có dbus/logind/cron) — bằng chứng §2 đủ mạnh
  và đã kiểm tra lại lần thứ ba liên tiếp.

## 9. Sai số của chính T5-156

- **F-156-T5-1 — `pgrep -af ram-sampler` / `b2-watcher` tự khớp
  shell exec của chính T5** (pid 34433 — cùng họ F-155-T5-2/
  F-154-T5-1/F-153-T5-1/F-152-T5-1). Đã nhận diện ngay là tự
  khớp (cmdline là lệnh exec chứa chuỗi tìm kiếm) và xác nhận
  sampler thật bằng file log (23 mẫu, boot 5353ed19) +
  b2-watcher pid 3709 (cmdline là đường dẫn script). Bài học
  giữ nguyên: luôn neo pattern + đối chiếu log/file, không tin
  mù pgrep.
- **F-156-T5-2 — Header comment watcher-156 + tham chiếu chéo
  stats script bị sed làm sai trước khi chạy** (header còn ghi
  boot #49; stats §2 còn trỏ `replay-watch-154.log` trong
  round156-t5 — di sản lỗi F-155-T5-1). Đã sửa tay TRƯỚC khi
  khởi động watcher / chạy stats (header sửa thành boot #52;
  §2 sửa thành round155-t5/replay-watch-155.log; §3/§7/§9 sửa
  round154→round155/round156 tương ứng). Output stats §2 lần
  này ĐÚNG (256 dòng log 155, NEWBOOT=0, FLAG-WRITTEN=2).
  Bài học: sed đổi số đợt không thay được ngữ nghĩa — đọc lại
  header + mọi tham chiếu chéo sau sed (đã làm đúng lần này).
- **Không có sai số số liệu nào khác:** mọi số trong LIMITS này
  đều từ script `t5-stats-156.py` (§A) hoặc đọc trực tiếp có ghi
  giờ. Btime/boot_id đọc từ `/proc/sys/kernel/random/boot_id` +
  `/proc/stat` ở nhiều thời điểm và khớp nhau (5353ed19, btime
  17:19:09Z) + khớp độc lập với T0-156 (5 nguồn).

## Phụ lục A. Số liệu trích bằng script (không gõ tay)

Script: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t5/t5-stats-156.py`
(output đầy đủ lưu tại `t5-stats-156-output.txt` cùng dir —
bản DUY NHẤT, chạy lúc 18:02:36Z, SAU khi cờ POSTBOOT_PASS #52
đã ghi; F-156-T5-1: §7 của output tự khớp pgrep, xem §9).
Trích nguyên văn các phần chính:

```
--- 1. Boot hien tai ---
boot_id=5353ed19-ddcb-46cc-9eca-9c9f86ba9706
btime_epoch=1795195149 = 2026-11-20T17:19:09Z
uptime_s=2607.06 now=2026-11-20T18:02:36Z
/proc/1 mtime=2026-11-20 17:19:25.307385498 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 5353ed19ddcb46cc9eca9c9f86ba9706 Fri 2026-11-20 17:19:25 UTC Fri 2026-11-20 18:01:55 UTC

--- 2. replay-watch-155.log ---
tong_dong=256 START=2 poll=244 NEWBOOT=0 END=0 EARLY-REPAIR=1 FLAG-WRITTEN=2
dong_cuoi: 2026-11-20T17:05:38Z boot=d849728b poll dpkg_lines=795 md5=a5200d2e apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75
boot_xuat_hien=['12fc68a3', 'd849728b']
mtime_log=2026-11-20T17:05:38Z size=31359

--- 3. POSTBOOT_PASS #52 (mtime 2026-11-20T18:00:10Z) ---
boot 5353ed19-ddcb-46cc-9eca-9c9f86ba9706 (btime 2026-11-20 17:19:09Z; watcher-156) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-20T18:00:10Z; POSTBOOT_PASS moi ghi 2026-11-20T18:00:10Z poll=1 (repair-som-quyet-h); co cu d849728b luu POSTBOOT_PASS-d849728b

--- 4. dpkg/cache/lists/GST ---
dpkg_lines=795 md5=b303899f mtime=2026-11-20 18:00:09.742377860 +0000
cache_deb=110 lists_entries=75
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
ENOSPC_dong=21
journal_dong=189

--- 7. RAM snapshot ---
MemTotal:        8124900 kB
MemFree:          210072 kB
MemAvailable:     1159860 kB
loadavg=1.75 1.70 2.00 4/463 34432
sampler .../round156-t9/ram-sampler.log: tong_mau=23 dau=2026-11-20T17:39:56 cuoi=2026-11-20T18:01:58Z boot=5353ed19 mem=1194752 bal=5644600 swapfree=727332 load1=1.73
b2_watcher_proc=3709 bash .../round156-t9/b2-watcher.sh

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

Log postboot poll1 (`t5-postboot-poll1-5353ed19.log`, 18:00:10Z,
exit 0 — trích phần check; header log còn ghi Dot 151, xem §7.5):

```
[postboot 2026-11-20 17:19:09] PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH)
[postboot 2026-11-20 17:19:09] PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống)
[postboot 2026-11-20 17:19:09] INFO GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 là symlink -> /home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0 (vá tạm K1, ephemeral)
[postboot 2026-11-20 17:19:09] INFO GST: file plugin hệ thống=269, debroot=269
[postboot 2026-11-20 17:19:09] PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264)
[postboot 2026-11-20 17:19:09] PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114)
[postboot 2026-11-20 17:19:09] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 17:19:09)
```

Log repair (`t5-postboot-repair-5353ed19.log`, trích RE-CHECK cuối):

```
[postboot 2026-11-20 17:19:09] RE-CHECK libs: PASS đủ 5 lib sau repair
[postboot 2026-11-20 17:19:09] RE-CHECK GST: PASS đủ isomp4 + libav
[postboot 2026-11-20 17:19:09] RE-CHECK apt: PASS đủ 11 package
[postboot 2026-11-20 17:19:09] KET LUAN: DU DIEU KIEN chay WebKit (boot 2026-11-20 17:19:09)
```

## 10. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round156-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t5/`
  (không nằm trong repo nên không stage): `replay-watch-156.sh`,
  `t5-stats-156.py`, `t5-stats-156-output.txt`,
  `replay-watch-156.log`, `watcher-status-at-open.txt`,
  `POSTBOOT_PASS`, `POSTBOOT_PASS-d849728b`,
  `repaired-5353ed19`,
  `t5-postboot-poll1-5353ed19.log`,
  `t5-postboot-verify-5353ed19.log`,
  `t5-postboot-repair-5353ed19.log`.
