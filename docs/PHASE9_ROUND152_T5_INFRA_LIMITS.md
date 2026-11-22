# PHASE9_ROUND152_T5_INFRA_LIMITS — ĐỐI CHIẾU WATCHER-151 (q): pid 15613 KHÔNG PHẢI WATCHER KHỞI ĐỘNG LẠI; BOOT #43 (18e179e0) REPLAY VẮNG → REPAIR SỚM (h) KÍCH HOẠT 05:46:03Z

> Luồng T5, đợt 152, lượt cron 12:35 +07 20/11/2026 (mở 05:35:51Z;
> T5 mở thực tế ~05:37Z). Repo `~/workspace/repo-1` (cây làm việc,
> KHÔNG có `.git` local — KHÔNG push). **BOOT MỚI #43
> 18e179e0-365e-4298-92b8-b61b147f9600** (btime **05:20:57Z** —
> /proc/stat btime 1795152057; `who -b` 05:21; /proc/1 05:21:12Z,
> offset ~15 s). Reboot **#43 xảy ra 05:20:57Z, SAU khi T10-151
> đóng (~05:04Z)** — T10 ghi "không reboot nào sau #42" lúc đóng
> là ĐÚNG tại thời điểm đó; #43 là reboot mới, giao mù cho T2-152
> (theo mẫu #42 → mù #74?).
> **KẾT LUẬN (a) — QUYẾT (q) ĐÃ CÓ ĐÁP ÁN: pid 15613 KHÔNG PHẢI
> watcher khởi động lại.** Bằng chứng ở §2 (đếm bằng script từ
> log gốc: 2 START đều boot 2e430750, 0 NEWBOOT, 0 dòng
> fad2aab9; script không có cơ chế tự khởi động lại; pid gốc
> 49781 chết theo #42, heartbeat cuối 03:25:21Z). 15613 chỉ là
> 1 process khớp tên lúc T10 đóng — danh tính chính xác không
> còn khôi phục được (bảng process của boot fad2aab9 đã mất
> theo #43), nhưng chắc chắn không phải watcher (watcher chạy
> sẽ ghi log mỗi 30 s — 0 dòng trong ~99 phút trên fad2aab9).
> **Boot #43 replay VẮNG:** dpkg.log chỉ 2 dòng startup
> configure 05:35:44–45Z (boot +14m47s), md5 fabf6f20, 0
> apt/dpkg, cache **0 .deb**, lists 5, GST hệ thống 0 — cùng
> chữ ký "2 dòng startup rồi im" như boot #40 (chết). Watcher
> mới **replay-watch-152.sh (pid 17990, từ 05:44:02Z)** đã
> kích **EARLY-REPAIR (h) 05:46:03Z** (boot+25m06s, đóng băng
> 618 s, 2 dòng, 0 proc): verify form-B exit=1 đúng kỳ vọng
> (thiếu 5 lib + GST không tồn tại + thiếu 11 gói), --repair
> **exit=0**, postboot **poll1 exit=0**, **cờ POSTBOOT_PASS cho
> boot 18e179e0 đã ghi 05:58:52Z** (poll=1, repair-som-quyet-h;
> dpkg 795 dòng, cache 110, lists 75, GST 269 — xem §5.5).
> Watcher vẫn đang chạy, giám sát tới hạn cứng 08:30Z.
> **KHÔNG push. KHÔNG release/tag.** KHÔNG sửa production
> ngoài watcher + LIMITS này (không sửa postboot script —
> header comment còn ghi Dot 151, chỉ là chữ stale, xem §5.4).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file
> workflow (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM
> kiểm lại. Kết cục run 151 thuộc T7-152 (xem §6 — T5 chỉ
> ghi nhận, không tranh số liệu).

## 1. Timeline (giờ UTC, 20/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 01:25:51Z | Reboot #41, boot 2e430750 (btime; xem LIMITS T5-151) |
| 02:45:28Z | Watcher-151 START lần 1, pid 39470, boot 2e430750 |
| 02:49:00Z | Watcher-151 STOP (file watcher-stop) |
| 02:49:47Z | Watcher-151 START lần 2, pid 49781, boot 2e430750 |
| 03:25:16Z | **Reboot #42, boot fad2aab9** (btime; T8-151 + T10-151) |
| 03:25:21Z | **Heartbeat CUỐI watcher-151** (poll, boot 2e430750) — log dừng hẳn sau dòng này |
| ~05:04Z | T10-151 đóng (cờ round151-t10.done 0 byte, mtime 05:04); boot lúc đóng fad2aab9; "không reboot nào sau #42"; thấy 1 process khớp tên `replay-watch-151` pid 15613 đang chạy |
| 05:20:57Z | **Reboot #43, boot 18e179e0** (btime /proc/stat; `who -b` 05:21; /proc/1 05:21:12Z) |
| 05:35:44–45Z | dpkg.log boot #43: 2 dòng startup configure đầu tiên (boot +14m47s) — rồi im |
| 05:35:51Z | Hạn ngân sách run 151 (T7-151: run 151 vẫn running lúc đóng cờ 04:54Z) |
| ~05:37Z | T5-152 mở: boot 18e179e0, uptime 16', dpkg 2 dòng, cache 0, lists 5, GST 0; pid 49781 + pid 15613 đều KHÔNG còn tồn tại |
| 05:44:02Z | **Watcher-152 START, pid 17990**, boot 18e179e0, end 08:30Z |
| 05:46:03Z | **EARLY-REPAIR TRIGGER** (boot+25m06s, frozen 618 s, 2 dòng, 0 proc); verify form-B exit=1; --repair bắt đầu (apt-get update, timeout 1500) |
| ~05:58Z | `apt-get update` OK (~12 phút, mirror chậm); `apt-get install` 11 gói xong; RE-CHECK toàn PASS |
| 05:58:52Z | **--repair exit=0; postboot poll1 sau repair exit=0; FLAG-WRITTEN** — cờ POSTBOOT_PASS cho boot 18e179e0 (poll=1, repair-som-quyet-h); dpkg 795 dòng, cache 110, lists 75, GST 269 |

## 2. Đối chiếu watcher-151 (quyết parent (q)) — KẾT LUẬN: pid 15613 KHÔNG phải watcher khởi động lại

### 2.1 Số liệu đếm bằng script từ log gốc (không đếm tay)

File: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round151-t5/replay-watch-151.log`
(mtime cuối 03:25:21.881Z; 9.861 B).

| Đếm | Giá trị |
|---|---|
| Tổng dòng | 85 |
| Dòng `REPLAY-WATCH-151-START` | 2 |
| Dòng `REPLAY-WATCH-151-STOP` | 1 |
| Dòng `NEWBOOT` | **0** |
| Dòng `REPLAY-WATCH-151-END` | 0 |
| Dòng poll (` poll `) | 80 |
| Giá trị `boot=` xuất hiện | **82 lần, TẤT CẢ đều `2e430750`** |
| Dòng chứa `fad2aab9` | **0** |

Hai dòng START (nguyên văn):

- `REPLAY-WATCH-151-START 2026-11-20T02:45:28Z pid=39470 boot=2e430750 btime=2026-11-20 01:25:51Z end=2026-11-20T05:30:00Z ...`
- `REPLAY-WATCH-151-START 2026-11-20T02:49:47Z pid=49781 boot=2e430750 btime=2026-11-20 01:25:51Z end=2026-11-20T05:30:00Z ...`

Dòng cuối log (nguyên văn):

- `2026-11-20T03:25:21Z boot=2e430750 poll dpkg_lines=1545 md5=51d12c3d apt=[] dpkg=[] gst_sys=269 cache=178 lists=37`

### 2.2 Suy luận (3 trụ, độc lập nhau)

1. **Không có dòng log nào của boot fad2aab9.** Một watcher đang chạy
   ghi 1 poll mỗi 30 s vào đúng file log này. Từ 03:25:21Z đến khi
   T10 đóng (~05:04Z) là ~99 phút trên boot fad2aab9 — nếu pid
   15613 là watcher thì phải có ~198 dòng poll + 1 dòng START +
   1 dòng NEWBOOT. Thực tế: **0 dòng**. Không có file log watcher
   nào khác trên đĩa (`find` theo tên `replay-watch-15*` toàn
   hidden_files chỉ thấy bộ 3 file của 151; không có
   `*fad2aab9*`, không có `repaired-*` nào).
2. **Script không có cơ chế tự khởi động lại.** Header
   `replay-watch-151.sh` ghi rõ: "Tien trinh nay KHONG tu khoi
   dong lai sau reboot" + caveat "neu cell reboot giet tien trinh
   thi heartbeat 30 s trong log se dung — phien sau khoi dong
   lai". Không có cron/systemd nào gọi lại script (không tìm
   thấy entry nào — và log cũng không có START mới).
3. **pid gốc 49781 chết đúng theo #42.** Heartbeat cuối 03:25:21Z;
   btime #42 là 03:25:16Z — chênh 5 s, nằm trong chuỗi nghịch lý
   đồng hồ đã ghi nhận (T8-151: 18 s lớn nhất chuỗi 8/14/7/18 s;
   T9-151: btime boot mới sớm hơn 15 s so với mẫu cuối boot cũ
   03:25:31Z). Không phải mâu thuẫn mới — cùng hiện tượng đã
   biết. Sau 03:25:21Z log không còn dòng nào, đúng với "cell
   reboot giết tiến trình".

### 2.3 Vậy pid 15613 là gì? — KHÔNG XÁC ĐỊNH ĐƯỢC CHÍNH XÁC, nhưng KHÔNG phải watcher

- T10-151 chỉ ghi "có 1 process khớp tên đang chạy (pid 15613)"
  — **không ghi lại lệnh phát hiện** (pgrep/ps/grep nào, khớp
  theo tên hay theo cmdline đầy đủ), nên không thể tái hiện
  phép đo. Bảng process của boot fad2aab9 đã mất theo reboot
  #43 (05:20:57Z); `journalctl --list-boots` chỉ còn đúng 1
  boot (18e179e0, 05:21:13Z → nay); `last reboot`/`wtmp` cũng
  chỉ còn boot hiện tại.
- Giả thuyết khả dĩ nhất (không chứng minh được, chỉ ghi nhận):
  một process có cmdline **chứa chuỗi** `replay-watch-151`
  (shell/grep/tail đang tham chiếu đường dẫn log/script) bị
  `pgrep -f`/`ps aux | grep` bắt trúng — kiểu khớp tên theo
  chuỗi con, không phải tiến trình watcher. Kiểu false positive
  này là cổ điển với `grep` tự khớp chính nó.
- **Điều chắc chắn:** dù 15613 là gì, nó không ghi log watcher,
  không tạo cờ, không repair — không có tác dụng nào của watcher
  trên boot fad2aab9. Trên boot fad2aab9, replay "không tới
  (12 poll)" theo T8-151 và T8 đã chạy bằng DEBROOT thay vì chờ
  hệ thống — nhất quán với việc **không có watcher nào sống**
  trên boot đó.
- Bài học ghi nhận (không phải lỗi của ai): lần sau T10 nên ghi
  kèm **lệnh phát hiện + cmdline đầy đủ** của process khớp tên
  (vd `ps -p <pid> -o args` + `cat /proc/<pid>/cmdline`), để
  đợt sau đối chiếu được mà không cần bảng process còn sống.

### 2.4 Hệ quả cho watcher-152

- Watcher-152 khởi động **bằng tay** 05:44:02Z (pid 17990) —
  đúng theo caveat "phiên sau khởi động lại". Không có cơ chế
  tự khởi động lại nào được thêm vào (ngoài phạm vi T5-152;
  nếu parent muốn, giao đợt sau — nhưng lưu ý: tiến trình
  nền trong cell vốn đã chết theo reboot, mọi watcher đều
  phải khởi động lại bằng tay sau mỗi reboot).
- Watcher-151 đã hết hạn cứng 05:30Z từ trước khi T5-152 mở;
  không còn watcher nào chạy lúc T5-152 mở (ps grep
  watch|replay: 0 kết quả lúc ~05:37Z).

## 3. Boot #43 (18e179e0) — replay VẮNG, chữ ký giống boot #40

Trạng thái đo trực tiếp lúc T5-152 mở (~05:37–05:38Z, boot+16–17'):

| Chỉ số | Boot #43 (18e179e0) | Boot #41 (2e430750, tới tự nhiên) | Boot #40 (e9295700, chết) |
|---|---|---|---|
| Hoạt động dpkg đầu | 05:35:44Z (**boot +14m47s**) | 01:26:35Z (boot +44s) | 23:35:42Z (boot +3m33s) |
| Dòng dpkg lúc kiểm | **2** | 1.545 (xong boot +4m22s) | 2 (rồi im 60') |
| md5 dpkg.log | fabf6f20 (đứng yên) | 51d12c3d (đứng yên sau khi xong) | — |
| apt/dpkg proc | **0** | 0 (sau khi xong) | 0 |
| Cache APT | **0 .deb** | 178 .deb/156M | 0 .deb |
| lists | 5 | 37 | 75 (sau repair) |
| GST hệ thống | **0** (thư mục không tồn tại) | 269 (= debroot) | 0 → symlink sau repair |
| RAM lúc mở | avail 2.058 MB / 7.934 MB | — | — |

- 2 dòng dpkg duy nhất (nguyên văn):
  `2026-11-20 05:35:44 startup packages configure`
  `2026-11-20 05:35:45 startup packages configure`
- So sánh chữ ký: boot #43 **khớp hệt mẫu chết của #40** (2 dòng
  startup rồi im, 0 proc) — khác hẳn #41 (hoạt động từ +44s, xong
  trong 4m22s, 1.545 dòng). Tiền lệ khởi động muộn (#47 +22,6',
  #54 +47'14") là hoạt động đầu tiên xuất hiện muộn — nhưng ở
  #43 hoạt động đã xuất hiện lúc +14m47s rồi **đứng yên**, không
  phải "chưa xuất hiện". Vì vậy không áp dụng lý do "chờ thêm"
  cho khởi động muộn: điều kiện (h) đo **đóng băng sau khi đã
  có hoạt động**, và nó đã thỏa (xem §5).
- Cache 0 .deb: lần thứ 3 cache không sống qua reboot trong
  chuỗi gần đây (#40: 0, #41: 178 sống, #43: 0; #42 fad2aab9
  không đo được cache). Chỉ ghi nhận theo quyết đứng — không
  điều tra riêng (cùng họ với quyết (s) 151 về lists).
- Lists 5 (so với 37 ở #41, 75 ở #40 sau repair): chỉ ghi nhận.

## 4. Watcher-152 (replay-watch-152.sh, pid 17990)

- File: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t5/replay-watch-152.sh`
  (dựa trên watcher-151, sửa: DIR round152-t5, END 08:30Z,
  boot hiện tại được đánh giá mới `done=0` thay vì "đã PASS",
  `last_change` khởi tạo **từ mtime dpkg.log** thay vì từ lúc
  khởi động — nếu không trigger repair sớm sẽ trễ ~10 phút vô
  ích; thêm `pgrep -x apt` vào điều kiện 0-proc; cờ cũ lấy từ
  round151-t5 khi ghi cờ mới).
- Khởi động: `nohup bash replay-watch-152.sh` 05:44:02Z, pid
  17990, `bash -n` SYNTAX-OK trước khi chạy. Dòng START:
  `REPLAY-WATCH-152-START 2026-11-20T05:44:02Z pid=17990 boot=18e179e0 btime=2026-11-20 05:20:57Z end=2026-11-20T08:30:00Z interval=30s early_repair_at_boot+900s frozen>=600s init_lines=2 init_md5=fabf6f20 init_mtime=05:35:45Z cache=0 lists=5 gst_sys=0`
- Poll 05:44:02Z / 05:44:33Z / 05:45:03Z / 05:45:33Z / 05:46:03Z:
  **đứng yên hoàn toàn** (2 dòng, md5 fabf6f20, apt=[] apt2=[]
  dpkg=[], gst_sys=0, cache=0, lists=5).
- Hạn cứng watcher: 08:30Z (trùng hạn cứng cờ T5-152). Nếu có
  reboot mới trong phiên, watcher ghi NEWBOOT và đánh giá boot
  mới theo cùng luật (h).

## 5. Repair sớm (h) trên boot #43 — ĐÃ KÍCH HOẠT, ĐANG CHẠY

### 5.1 Điều kiện trigger (đo trực tiếp, đủ cả 5)

Dòng trigger (nguyên văn từ log):
`2026-11-20T05:46:03Z EARLY-REPAIR TRIGGER boot=18e179e0 boot_age=1506s frozen=618s dpkg_lines=2 — verify form-B truoc`

| Điều kiện (h) | Yêu cầu | Đo được lúc trigger |
|---|---|---|
| Tuổi boot ≥ boot+15' (900 s) | ≥ 900 s | **1.506 s (boot+25m06s)** ✓ |
| dpkg.log đóng băng | ≥ 600 s | **618 s** (đổi cuối 05:35:45Z) ✓ |
| 0 tiến trình apt/dpkg/apt | 0 | **0** (apt=[] apt2=[] dpkg=[]) ✓ |
| Dòng dpkg < 100 | < 100 | **2** ✓ |
| Chưa repair boot này | 0 lần | **0** (guard `repaired-18e179e0` vừa tạo lúc trigger) ✓ |

### 5.2 Verify form-B (postboot check-only, TRƯỚC repair) — exit=1 đúng kỳ vọng

File: `round152-t5/t5-postboot-verify-18e179e0.log`. Dòng trigger
ghi: `2026-11-20T05:46:03Z verify form-B postboot check-only exit=1 (cho exit=1)`.

Kết quả kiểm (nguyên văn, rút gọn):

- `FAIL libs: thiếu: libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2`
- `FAIL GST: /usr/lib/x86_64-linux-gnu/gstreamer-1.0 không tồn tại`
- `INFO GST: file plugin hệ thống=0, debroot=269`
- `FAIL GST: thiếu isomp4=1 libav=1 — decode mp4/H.264 qua plugin hệ thống chưa đủ`
- `FAIL apt: chưa cài: libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0 libevdev2`
- `KET LUAN: CHUA DU — chạy lại với --repair, hoặc chờ apt replay xong rồi chạy lại`

Đúng 11 gói thiếu như mọi boot chưa replay (cùng danh sách với
#40/#41 lúc chưa đủ). Verify FAIL nên --repair được phép chạy
theo đúng luật (h) — không repair mù.

### 5.3 --repair đang chạy (bổ sung kết quả cuối ở §5.5 sau khi xong)

- Bắt đầu ~05:46:03Z, guard `repaired-18e179e0` (0 byte, 05:46Z).
- Tiến triển đo được lúc 05:47:13Z: `REPAIRED GST: symlink lại ->
  debroot (269 file)`; `INFO apt: lists có thể trống sau reboot —
  chạy apt-get update trước khi install`; `apt-get update` đang
  chạy dưới `timeout 1500` (pid 22311, từ 05:46Z).
- Đã xong 05:58:52Z — xem kết quả đầy đủ ở §5.5 (không còn
  "đang chạy" nữa).

### 5.4 Ghi chú: header comment của postboot script còn ghi Dot 151

- File `apps/web/scripts/vcut-webkit-postboot-check.sh` — dòng
  `[postboot 2026-11-20 05:20:57] boot=... (DOT 151, boot
  e9295700 -> 2e430750 reboot #41, ...)` là **comment/header
  tĩnh từ Dot 151**, không phải dữ liệu live (timestamp live
  là 05:20:57 = btime boot #43; các kiểm FAIL/PASS đều đo live).
  T5-152 **không sửa** script này: chỉ là chữ stale trong
  comment, không ảnh hưởng kiểm tra; sửa sẽ tạo thêm file
  overlap mà không đổi hành vi. Ghi nhận để T5 đợt sau quyết
  có cập nhật header theo Dot hay không.

### 5.5 KẾT QUẢ REPAIR + CỜ POSTBOOT_PASS — THÀNH CÔNG (xong 05:58:52Z)

- `--repair` **exit=0** (dòng log watcher:
  `2026-11-20T05:46:03Z --repair exit=0`). Toàn bộ repair
  05:46:03Z → 05:58:52Z = **12m49s** (apt-get update ~12 phút
  do mirror chậm + cài 11 gói ~1 phút).
- Log repair (`t5-postboot-repair-18e179e0.log`, 6 dòng
  REPAIRED/RE-CHECK): `REPAIRED GST: symlink lại -> debroot
  (269 file)`; `REPAIRED apt: đã cài: [đủ 11 gói]`;
  `RE-CHECK wrapper: PASS`; `RE-CHECK libs: PASS đủ 5 lib sau
  repair`; `RE-CHECK GST: PASS đủ isomp4 + libav`; `RE-CHECK
  apt: PASS đủ 11 package`; `KET LUAN: DU DIEU KIEN chay
  WebKit (boot 2026-11-20 05:20:57)`.
- Postboot check-only sau repair (**poll1**) **exit=0** (dòng
  log watcher: `2026-11-20T05:46:03Z postboot poll1 sau repair
  exit=0 dpkg_lines=795 cache=110 lists=75`). File
  `t5-postboot-poll1-18e179e0.log`: PASS wrapper/libs/GST/apt
  toàn bộ; `KET LUAN: DU DIEU KIEN chay WebKit`.
- **Cờ POSTBOOT_PASS đã ghi 05:58:52Z** (dòng log watcher:
  `2026-11-20T05:58:52Z FLAG-WRITTEN boot=18e179e0
  mode=repair-som-quyet-h poll=1 (old=2e430750)`). Nội dung cờ
  (nguyên văn):
  `boot 18e179e0-365e-4298-92b8-b61b147f9600 (btime 2026-11-20
  05:20:57Z; watcher-152) — repair-som-quyet-h: dpkg 795 dong;
  cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0
  luc 2026-11-20T05:46:03Z; POSTBOOT_PASS moi ghi
  2026-11-20T05:58:52Z poll=1 (repair-som-quyet-h); co cu
  2e430750 luu POSTBOOT_PASS-2e430750`
  — ghi **full boot_id** đúng định dạng F-151-T5-1 (poller T4
  grep full UUID sẽ PASS); cờ cũ 2e430750 đã copy nguyên văn
  sang `POSTBOOT_PASS-2e430750` trong cùng dir.
- Trạng thái sau repair (đo trực tiếp 06:03:02Z, watcher vẫn
  poll ổn định): dpkg 795 dòng (md5 d964a240, đứng yên 5 poll
  liên tiếp 06:00:23–06:02:24Z), cache **110 .deb**, lists 75,
  GST hệ thống 269 (symlink → debroot, theo repair), 0
  apt/dpkg. **Trùng hệt chữ ký sau repair của boot #40**
  (795/110/75) — cùng 11 gói cài trên cùng nền 2 dòng startup,
  nhất quán, không phải số lạ.
- **Chiến lược (h) kiểm chứng live lần đầu:** trigger sớm ở
  boot+25m06s (thay vì chờ timeout 60' như #40) đã rút ngắn
  thời gian hệ thống đủ điều kiện từ ~60'+ xuống còn ~38'
  (btime 05:20:57Z → cờ 05:58:52Z = 37m55s). Lần đầu (h) kích
  hoạt thật (đợt 151 replay tới tự nhiên nên không kích hoạt).
- Caveat ghi trong cờ (xem §8 F-152-T5-3): timestamp "poll1
  ... luc 2026-11-20T05:46:03Z" trong cờ là **giờ trigger**,
  không phải giờ poll1 chạy thật (~05:58:52Z) — do
  `write_flag` dùng lại `$ts` lúc trigger. Nội dung quan trọng
  (full boot_id, mode, poll=1, exit 0, số liệu) đều đúng; T4
  chỉ grep UUID nên gate không ảnh hưởng. Sửa ở watcher đợt
  sau: truyền timestamp hoàn tất poll1.

## 6. Kết cục run 151 — thuộc T7-152 (T5 chỉ ghi nhận)

- T7-151 đóng cờ 04:54Z, **run 151 vẫn `running`** lúc đó (tuổi
  gốc 8.211 s, còn 2.589 s tới hạn ngân sách 05:35:51Z) —
  LIMITS T7-151 §5.5. Quyết parent 151 (t): kết cục run 151
  thuộc T7-152. T5-152 không đọc DB scheduler, không tranh số
  liệu — chỉ ghi nhận để T7-152 đối chiếu.
- Run 150: **SUCCEEDED** (wall gốc 10.623 s, margin 177 s) —
  đã được parent chấp nhận ở quyết 151 (i); T5-152 không kiểm
  lại.

## 7. Nợ mở chuyển đợt 153 (từ T5-152)

1. **Reboot #43 (btime 05:20:57Z, boot 18e179e0)** — mù mới
   giao T2-152 theo mẫu #42 → mù #74? (T10-151 đã ghi "không
   reboot nào sau #42" lúc đóng ~05:04Z là đúng tại thời điểm
   đó; #43 xảy ra sau khi đóng).
2. **Watcher-152 (pid 17990) vẫn đang chạy** tới hạn cứng 08:30Z
   — T5-153 (hoặc phiên sau) đối chiếu log của nó như T5-152
   đã đối chiếu log 151; nếu có reboot #44 trong phiên, watcher
   sẽ chết theo reboot và cần khởi động lại bằng tay (không có
   cơ chế tự khởi động lại — xem §2.4).
3. **Cache APT 0 .deb lần thứ 3 trong chuỗi gần đây** (#40: 0,
   #41: 178 sống, #43: 0) — chỉ ghi nhận, không điều tra riêng.
4. **Lists 5** (so với 37 ở #41) — chỉ ghi nhận (cùng họ quyết
   (s) 151).
5. **Header comment postboot script còn ghi Dot 151** — T5 đợt
   sau quyết có cập nhật theo Dot hay không (§5.4).
6. **T10 nên ghi kèm lệnh phát hiện + cmdline đầy đủ** khi báo
   process khớp tên (§2.3) — đề xuất ghi vào checklist đứng của
   T10 (parent quyết).
7. Nợ đứng giữ nguyên: G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để
   yên, không nhắc lại). R9 (a) VẪN CHỜ user (số đếm VẪN LÀ 16;
   quyết parent: để yên, không nhắc lại). ci-security.yml vẫn
   403 chờ user. TTS 39 cấm kiểm lại. Mù #22/#28–#31/#35/#37/#38
   G chờ user quyết. Mâu thuẫn full boot_id b47f7932 vẫn mở
   theo quyết (g) đợt 143. u2net là fallback chính thức cho
   birefnet.

## 8. Sai số của chính T5-152

- **F-152-T5-1 — Lệnh `grep -rn 15613` đầu phiên quét cả thư mục
  hidden_files gồm file binary, tràn ~36 MB output rác vào
  context** (đã kill ngay bằng SIGTERM; không ảnh hưởng đĩa
  hay kết quả — mọi số sau đó đều lấy bằng `grep` có đích
  danh file text hoặc `grep -c` trên file log cụ thể). Bài học:
  không bao giờ `grep -r` toàn bộ hidden_files; chỉ grep file
  đã biết tên.
- **F-152-T5-3 — Timestamp poll1 trong cờ POSTBOOT_PASS ghi
  giờ trigger (05:46:03Z) thay vì giờ poll1 chạy thật
  (~05:58:52Z).** Nguyên nhân: `write_flag` trong watcher-152
  (kế thừa từ watcher-151) dùng lại `$ts` lúc bắt đầu khối
  repair. Nội dung quan trọng (full boot_id, mode
  repair-som-quyet-h, poll=1, exit 0, dpkg 795/cache 110/lists
  75) đều đúng và đã đối chiếu với log watcher
  (FLAG-WRITTEN 05:58:52Z, poll1 exit=0). Không viết lại cờ
  (tránh làm lệch mtime/cờ trong lúc T4-152 đang đọc). Sửa ở
  watcher đợt sau: truyền timestamp hoàn tất poll1 vào
  `write_flag`.
- **F-152-T5-4 — Không có sai số số liệu nào khác:** mọi số
  trong LIMITS này đều đọc từ log/file gốc bằng lệnh đếm
  (`wc -l`, `grep -c`, `md5sum`, `stat`) hoặc trích nguyên văn
  từ log watcher/postboot; btime/boot_id đọc từ
  `/proc/sys/kernel/random/boot_id` + `/proc/stat` ở nhiều
  thời điểm và khớp nhau (18e179e0, btime 05:20:57Z).

## 9. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round152-t5-infra.txt`
  — NUL-delimited, **1 entry** (file LIMITS này), text-only, 0
  binary. Verify read-back sau khi ghi (od -c). T5-152 không
  sửa postboot script nên không có entry thứ hai (khác T5-151
  có 2 entry).
- Ghi chú làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t5/`
  (không nằm trong repo nên không stage): `replay-watch-152.sh`,
  `replay-watch-152.log`, `replay-watch-152.nohup.log`,
  `t5-postboot-verify-18e179e0.log`, `t5-postboot-repair-18e179e0.log`,
  `repaired-18e179e0`, (+ `POSTBOOT_PASS` sau khi repair xong
  và watcher ghi cờ).
