# PHASE9 ROUND 157 — T0: Boot survey + O8 JSON (REBOOT #56 XÁC NHẬN lúc mở — nhưng đồng hồ đợt 156 NHANH ~50 phút, btime 19:32:47Z là giờ THẬT; watcher chết lúc mở; postboot CHƯA XONG nên O8 kiểm chứng BỎ QUA)

Đợt 157 mở lượt cron 03:35:51 +07 21/11/2026 (= 20:35:51Z 20/11/2026). T0 mở
~20:41:38Z (coordinator ghi ~20:36:12Z: boot 348dab54, btime 19:32:47Z,
uptime ~1:03).
Đợt 156 verdict CHẤP NHẬN (quyết parent (a) §12.3 aggregate 156 — đã đọc
§12.3 (a)–(r) + §11 nợ mở + T0-156 LIMITS trước khi làm). CERT/FULL chính
thức vẫn **76/91** (quyết (b): #82?/#83?/#84? GIỮ MỞ — chưa chứng nhận).
Reboot #52 XÁC NHẬN (quyết (c)); #53/#54/#55 CHỐT theo đếm tuần tự T7/T8
(quyết (d): 062850d8=#53, 447f0efe=#54, c99a1045=#55); btime chuẩn CHỈ từ
`/proc/stat btime` (quy tắc đứng mới, quyết (e)); chuỗi O8 GIỮ 11 (quyết
(f)); điểm (m) n=14 ứng viên (quyết (g)); hướng (3) KHÔNG bổ sung (quyết
(o) — POSTBOOT_PASS #51 lọt là khoảng hở đã biết, chấp nhận).

## §1. Reboot mới: CÓ — boot #56 XÁC NHẬN, 348dab54, btime THẬT 19:32:47Z

**Kết luận: có reboot thật kể từ lúc T10-156 đóng sổ — boot #56, số hiệu
XÁC NHẬN theo đếm tuần tự sau #55 (c99a1045).** Mâu thuẫn bề ngoài ("T10
ghi lúc đóng ~20:17Z vẫn boot c99a1045, KHÔNG reboot mới" trong khi btime
boot mới đọc 19:32:47Z — TRƯỚC giờ T10 đóng) được GIẢI QUYẾT: đồng hồ
wall của cell trong suốt đợt 156 chạy NHANH hơn giờ thật một lượng J
≥ 42'46" (xem §1.1). Btime 19:32:47Z là giờ THẬT (đồng hồ hiện tại đã
đúng — kiểm chứng độc lập bằng Date header của github.com, §1.2). Mọi
mốc wall của đợt 156 (kể cả btime #52/#53/#54/#55 và giờ T10 đóng) đều
bị đội lên J; các khoảng thời gian TƯƠNG ĐỐI (tuổi thọ boot, gap, margin)
không đổi, nên các quyết parent (c)/(d)/(g) đợt 156 vẫn đứng.

Bằng chứng — 7 nguồn độc lập, đều khớp (khung giờ THẬT hiện tại):

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| boot_id | `348dab54-90f7-438e-924e-2c839630842b` | khác c99a1045 (#55) |
| btime /proc/stat | `1795203167` = **19:32:47Z** | `uptime -s` đồng ý 19:32:47 (theo quy tắc đứng (e) — CHỈ dùng nguồn này làm btime) |
| journalctl --list-boots | 1 boot duy nhất `348dab54…`, first entry 19:32:59Z, last 20:41:11Z lúc kiểm | journal volatile chỉ giữ 1 boot |
| journal first entry | 19:32:59Z = btime + 12 s | khớp /proc/1 start (dưới) |
| wtmp / last reboot | `reboot system boot 7.0.0-44-generic Fri Nov 20 19:32 still running`; wtmp begins 19:32:59 | chỉ còn boot hiện tại |
| /proc/1 start | 19:32:58.94Z = btime + 11,94 s (start ticks 1101 → +11,01 s) | userspace ~11–12 s sau btime — cùng mẫu #52/#55 (+11/+12 s), KHÔNG phải btime |
| F-measure | **+0,932/+0,916/+0,921 s, ỔN ĐỊNH** (3 lần đọc, spread 0,016 s) | wall − (btime + uptime); offset nhỏ, ổn định — không có bước nhảy đồng hồ KỂ TỪ boot này (xem §1.2; F mù với offset hằng số — xem §1.1) |

### §1.1 Nghịch lý đồng hồ: khung giờ đợt 156 nhanh hơn giờ thật J ≥ 42'46"

- **Bằng chứng cứng:** sampler T9-156 ghi mẫu trên boot c99a1045 tới
  wall **19:56:47Z** (137 mẫu, 17:39:56–19:56:47Z), và cờ T10-156
  (`round156-t10.done`) có mtime wall **20:15:33Z**, nội dung "DONE
  ~20:17Z" trên boot c99a1045 — TẤT CẢ đều SAU btime boot mới
  19:32:47Z. Một máy không thể chạy hai boot cùng lúc, nên khung giờ
  wall của đợt 156 NHANH hơn giờ thật. Chênh tối thiểu từ cờ T10
  (mốc chắc chắn thuộc c99a1045, trước reboot):
  **J ≥ 20:15:33Z − 19:32:47Z = 42'46" (2.566 s).**
  (Nội dung cờ "~20:17Z" gợi ý J ≥ ~44 phút; mtime aggregate 156
  20:22:43Z — bản sửa §12.3 của parent — gợi ý J > 49'56" NẾU bản sửa
  đó viết trước reboot, nhưng không chắc nó viết trước hay sau reboot
  nên không dùng làm mốc cứng.)
- **Không có bước nhảy TRONG đợt 156:** kiểm toàn bộ 137 mẫu sampler
  bằng python — mọi khoảng liên tiếp đều 60 s, trừ jitter 61 s (4 lần)
  và 3 gap chuyển boot 82/90/54 s (đúng T9). **Không có gap nào
  > 90 s.** Vậy đồng hồ KHÔNG nhảy trong cửa sổ sampler
  17:39:56–19:56:47Z wall; offset J là HẰNG SỐ trong suốt cửa sổ đó
  (nhảy trước 17:39:56Z wall, hoặc đã nhanh từ trước đợt).
- **F-measure MÙ với offset hằng số — bài học phương pháp:** F =
  wall − (btime + uptime). Btime được ghi từ wall clock lúc boot, nên
  wall nhanh đều J thì btime cũng đội J, F ≈ 0 + drift. T0-156 đo
  F = +0,64 s trên #52 và kết luận "không nghịch lý" — đúng trong
  khung của cell mới, nhưng không phát hiện được offset J (cùng mẫu
  T0-153 F = +2/+3 s "không nghịch lý" trong khi T2-153 chứng minh
  nghịch lý ≥ +50'26" tại #45 bằng mốc hoạt động cell cũ).
- **Giả thuyết dẫn đầu (chưa khẳng định cơ chế): J chính là offset
  từ đợt 153, chưa từng được sửa cho tới reboot này.** Tại #45, T2-153
  chứng minh hai khung lệch nhau ≥ +50'26" (3.026 s): cell cũ c741f5e6
  còn viết tới ≥08:23:04Z trong khi btime boot mới đọc 07:32:38Z;
  parent quyết (c) đợt 153 ghi cơ chế ứng viên "RTC cũ lúc boot +
  slew nhanh" là GIẢ THUYẾT, giao T7-154 siết T45_thực (chưa thấy
  kết luận đóng trong các aggregate sau). Kiểm tính nhất quán với
  J = 3.026 s: cờ T10 giờ thật = 20:15:33Z − 50'26" = **19:25:07Z**
  (trước reboot 7'40"); bản sửa §12.3 của parent giờ thật =
  20:22:43Z − 50'26" = **19:32:17Z** (trước reboot 30 s — khít nhưng
  vẫn trước); coordinator mở đợt 20:36:12Z giờ thật (đồng hồ mới đã
  đúng) = uptime 63'25" sau btime ✓. Mọi mốc đều khớp, không mốc nào
  mâu thuẫn. **Giới hạn: J chỉ có cận dưới cứng 42'46" từ dữ kiện
  của riêng T0-157; giá trị 50'26" là ứng viên mạnh (kế thừa đợt 153),
  KHÔNG phải đo trực tiếp của đợt này.** T2-157 / T7-157 có thể siết
  thêm bằng DB scheduler (đồng hồ scheduler là khung host — xem §7).
- **Hệ quả cho các số đợt 156:** mọi btime #52/#53/#54/#55
  (17:19:09Z / 18:26:15Z / 18:29:43Z / 19:04:44Z) và mọi mốc wall
  (O8 19:34–19:36Z, sampler, T10 đóng ~20:17Z) đều là giờ wall-nhanh,
  tức giờ thật = wall − J. Các hiệu số (tuổi thọ boot 208 s / 2.101 s,
  gap, margin run 155 1.162 s, offset điểm (m) 33–49,8 s) KHÔNG ĐỔI
  vì J là hằng số — các quyết parent (c)/(d)/(g)/(h) đợt 156 vẫn
  đứng. Riêng các offset (m) T7 tính từ DB scheduler (khung host,
  giờ thật) đối chiếu btime cell-wall (đội J) — T7-157 kiểm lại
  phương pháp có trộn khung không (xem §7).
- **Cửa sổ mù cho số hiệu #56:** mốc cuối cùng chắc chắn thuộc
  c99a1045 là cờ T10 (giờ thật 20:15:33Z − J). Cửa sổ không quan sát
  được trong giờ thật: (20:15:33Z − J, 19:32:47Z], dài **J − 2.566 s**
  — bằng **460 s (≈7'40") nếu J = 3.026 s**. Một boot ngắn hoàn toàn
  có thể sống-chết trong cửa sổ đó mà không để lại dấu (tiền lệ #53
  sống 208 s; #51 sống 13m40s ngoài phiên). Vì vậy "#56 XÁC NHẬN"
  nghĩa là: boot hiện tại chắc chắn là boot mới sau #55; số hiệu #56
  giả định không có boot ẩn trong cửa sổ mù — giao T2-157 đánh giá
  mù #88? đi kèm (theo mẫu #85?/#86?/#87? của đợt 156).
- **T10-156 KHÔNG sai:** câu "KHÔNG có reboot mới trong lúc T10 đóng
  sổ" đúng trong khung giờ T10 quan sát (cell-wall nhanh): T10 kiểm
  cuối lúc wall ~20:1xZ vẫn thấy c99a1045; reboot xảy ra sau đó trong
  giờ thật (19:32:47Z thật ≈ wall ~20:23Z nếu J = 50'26"). Không có
  mâu thuẫn giữa T10-156 và T0-157 một khi hiệu chỉnh khung giờ.

### §1.2 Đồng hồ HIỆN TẠI đã đúng (kiểm chứng độc lập 2 lớp)

- **Lớp 1 — Date header ngoài:** `curl -s -D - https://github.com`
  trả `Date: Fri, 20 Nov 2026 20:44:16 GMT` đúng lúc `date -u` đọc
  `20:44:16Z` — **khớp từng giây**. (worldtimeapi.org và timeapi.io
  thử cùng lúc đều lỗi 502/trống — chỉ 1 nguồn ngoài thành công; ghi
  rõ giới hạn: xác nhận giờ đúng dựa trên 1 nguồn ngoài + F ổn
  định.)
- **Lớp 2 — F ổn định kể từ boot:** +0,932/+0,916/+0,921 s (3 lần
  lúc mở, cách nhau 2 s) và +0,922/+0,897/+0,928 s lúc đóng (~20:51Z)
  — spread ~0,035 s trong cả phiên T0 (~10 phút), không có bước nhảy
  nào sau boot. Journal monotonic vs realtime (xem §1.3) cũng không
  lệch (drift −0,16 s, trong sai số làm tròn).
- **Kết luận:** btime 19:32:47Z là giờ THẬT (sai số ≤ ~1 s). Đồng hồ
  được sửa về đúng ở chính reboot này (kernel đọc lại RTC lúc boot —
  cơ chế ứng viên, cùng họ giả thuyết đợt 153; không có timesyncd/
  chrony trong cell — `timedatectl` lỗi "No such file or directory",
  `systemd-timesyncd.service could not be found" — nên không có
  daemon nào sửa đồng hồ sau boot; F ổn định loại trừ sửa sau boot).

### §1.3 Journal monotonic vs wall-clock (boot hiện tại)

- Entry đầu journal: monotonic 11,451628 s / wall 19:32:59Z →
  wall − monotonic ≈ btime + 0,55 s. Entry cuối lúc kiểm (20:50:25Z):
  monotonic 4.657,605337 s / wall 20:50:25Z → wall − monotonic ≈
  btime + 0,39 s. **Drift đầu → cuối ≈ −0,16 s (trong sai số làm
  tròn 1 s của short-iso) — KHÔNG có bước nhảy đồng hồ kể từ boot.**
  (Phương pháp: `journalctl -o short-monotonic` đối chiếu
  `-o short-iso`; lệnh `journalctl -o verbose` trả 0 trường
  timestamp trong môi trường này nên không dùng được — xem
  F-157-T0-2. Kết luận này độc lập với F-measure §1 và khớp nó.)

## §2. Quy tắc đứng (3) — kiểm tra watcher ngay khi mở phiên: CHẾT lúc mở

- **Kiểm độc lập của T0 (~20:41Z): 0 process replay-watch / sampler /
  poller / vite / playwright nào đang chạy.** `ps aux | grep -iE
  'replay-watch|sampler|poller|watcher'` — không có gì (chỉ có các
  tiến trình runtime/host: os-intent replay pid 898 + apt-get update
  pid 919, xem §5 — KHÔNG phải watcher VCut).
- **Log watcher-156 dừng ở poll cuối 18:26:15Z, boot 5353ed19, KHÔNG
  có dòng NEWBOOT nào** (69 dòng, poll đều 30 s). Poll cuối 18:26:15Z
  trùng đúng btime #53 (062850d8, 18:26:15Z) — watcher-156 chết theo
  #53 (log mtime 18:26:15.75Z). Các reboot #54/#55/#56 sau đó không
  có watcher nào quan sát.
- **POSTBOOT_PASS lúc mở:**
  - #51: KHÔNG CÓ (đã biết, không bù được — quyết (o) đợt 156).
  - #52: **ĐÃ CÓ** 18:00:10Z, boot 5353ed19 (dpkg 795, cache 110,
    lists 75, poll=1, repair-sớm-quyết-h). Lưu ý tên file
    `POSTBOOT_PASS-d849728b` là SAI NHÃN (d849728b là boot #50 —
    di chứng F-156-T5-2, sed để lại boot cũ); NỘI DUNG ghi đúng boot
    5353ed19 — T0 đối chiếu nội dung, không tin tên file.
  - #53 / #54 / #55: **KHÔNG CÓ file nào** (watcher chết từ #53, T5
    đã đóng) — giao T5-157 (nợ từ §11.5 aggregate 156).
  - #56 (348dab54): **CHƯA CÓ lúc T0 đóng** — T5-157 sở hữu
    (khởi động watcher-157 bằng tay + repair + POSTBOOT_PASS).
- **T0 KHÔNG khởi động watcher** (chỉ kiểm tra theo task; T5-157
  khởi động bằng tay).
- **Marker persistence `~/.config/vcut-persistence-marker`: SỐNG QUA
  #56** (còn, ghi 11:39:47Z trên boot #48) — sống qua **8 reboot liên
  tiếp** #49/#50/#51/#52/#53/#54/#55/#56.

## §3. Cơ chế O8 JSON: CÒN ĐÚNG (JSON cũ md5 không đổi; latest = stamped cuối)

- **JSON T8-156 md5 KHÔNG ĐỔI** (đối chiếu giá trị T10-156 đã ghi):
  WebKit pid10439 `78ac5a61…` ✓; pid10785 `831d4b9b…` ✓; Chromium
  pid11127 `7e4d9dd9…` ✓. Các bản `attempt1/attempt2/chromium` cũng
  khớp đúng md5 stamped tương ứng.
- **Bản `latest` byte-identical với file stamped cuối cùng từng
  loại:** WebKit latest = attempt2 `831d4b9b` ✓; Chromium latest =
  `7e4d9dd9` ✓. Đúng thiết kế "latest" của T0-152.
- **Cây md5 lúc mở khớp đúng hồ sơ T10-156 lúc đóng:** preview.tsx
  `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`,
  server/render/src/effects.js `fedc0141` — không đổi ngoài ý muốn.
- (T0-156 cũng đã đối chiếu JSON T0-155/T8-155 không đổi; T0-157 chỉ
  đối chiếu lại lớp T8-156 mới nhất — đủ cho "cơ chế còn đúng".)

## §4. O8 WebKit kiểm chứng trên boot #56: BỎ QUA — postboot CHƯA XONG (đúng bài học F-156-T0-1)

- **T0 KHÔNG chạy O8 lần nào trong đợt này (0 attempt — có chủ ý).**
  Kiểm trạng thái postboot TRƯỚC (20:47Z), kết quả: **11/11 gói apt
  MISSING** (libevent-2.1-7t64, gstreamer1.0-plugins-base/good/bad/
  ugly/gl/libav, libavif16, libgstreamer1.0-0, libevdev2); dpkg `-l`
  `^ii` 783 dòng; cache 178 .deb (sống qua reboot — overlay RV-backed,
  khớp số T8-156 tự kiểm "cache 178"); lists CHỈ CÒN 3 mục
  (auxfiles/lock/partial — không còn index thật, cần `apt-get update`
  lại); GST system plugins 0 file. **Postboot CHƯA XONG — chạy O8 lúc
  này sẽ lặp lại chữ ký FAIL của T0-156 (S1 FAIL + Target crashed do
  thiếu GStreamer/libav).** Theo đúng task + bài học F-156-T0-1:
  GHI NHẬN và BỎ QUA kiểm chứng cơ chế; O8 chính thức thuộc T8-157
  sau postboot.
- **Lưu ý:** lúc T0 kiểm (20:47Z), runtime/host đang chạy os-intent
  replay (`dpkg --configure -a` 20:35:40Z + `apt-get update` pid 919
  từ 20:35Z) — ĐÓ KHÔNG PHẢI repair của T5, mà là preflight của
  runtime khi session cron mở (xem §5). T5-157 vẫn phải tự kiểm tra
  postboot đầy đủ (dpkg/cache/lists/GST/11 gói) rồi mới viết
  POSTBOOT_PASS — không được coi replay của host là repair xong.
- **Chuỗi WebKit FULL PASS GIỮ 11 — T0 không phán chuỗi** (chỉ T8
  phán sau lượt yên hợp lệ; kiểm chứng cơ chế của T0 không tính vào
  chuỗi — như T0-155/T0-156 §4).

## §5. Tình trạng hệ thống lúc mở / lúc đóng

- RAM avail: **~1.046 MB lúc 20:47Z** (MemAvailable 1.045.856 kB —
  thấp hơn ngưỡng 1.048.576 kB (1 GiB) của T4 đúng 2.720 kB); load
  1,31/1,22/0,72; uptime 1:14 lúc 20:47Z. (T0-156 mở 1.087 MB → đóng
  1.321 MB; đợt này mở thấp hơn — T9 đo chính thức.)
- ENOSPC: **10 dòng lúc 20:47Z** trên boot #56 (`journalctl --boot=0
  | grep -ci 'no space left on device'` = 10) — đã có lỗi thật ngay
  trên boot mới, dù mới boot ~1h15m. Journal volatile — chỉ đếm được
  boot hiện tại; **T9 sở hữu số chính thức**.
- Inotify: trần **63.747** (xác nhận trực tiếp, không đổi). T0 không
  đo headroom (phương pháp của T9).
- Lock queue lúc mở: **101 file** (0 ticket + 101 cooldown, 1.414 B
  — khớp đúng T10-156 lúc đóng); lock **TRỐNG** (`vcut-vite-lock-v2.sh
  status` rc=0); log cuối RELEASED 19:53:25Z t8-round156, hold 231 s
  (mốc wall-nhanh; giờ thật ~19:03Z). Prune lần 32 thuộc T6-157.
- `/tmp/n2/clips`: **KHÔNG còn nội dung đợt 156** — chỉ có 1 clip
  `h_h264_320x180_30s.mp4` (936.628 B), (tái)tạo lúc wall **20:44:32Z**
  (sau khi đợt mở; thư mục cha /tmp/n2 mtime 20:44:19Z). Nguồn gốc
  lần tạo này T0 không quy được cho luồng nào (T1-verify bắt đầu
  20:45:36Z — sau mốc 20:44:32Z). **T8-157 vẫn phải rebuild/kiểm
  fixture trước harness lần 1 theo quy tắc (l)** — sự có mặt của 1
  clip không chứng minh fixture đầy đủ.
- **dpkg.log CHỈ CÒN 2 DÒNG — không dùng được làm nguồn chéo:**
  toàn bộ file là 2 dòng `2026-11-20 20:35:40 startup packages
  configure` (do replay của runtime ghi lúc session mở; xem dưới).
  Log dpkg của đợt 156 (repair T5, 795 dòng) đã mất theo cell restart
  — dpkg.log bị reset/truncate mỗi lần cell restart. T5-157 phải đếm
  postboot bằng `dpkg -l` / cache / lists trực tiếp, KHÔNG dựa vào
  dpkg.log. (Cùng họ mất mát như journal volatile — T0-156 đã ghi
  journal chỉ giữ 1 boot; nay dpkg.log cũng vậy.)
- **Runtime/host chạy os-intent replay lúc session mở (20:35Z):**
  pid 898 `/bin/sh -c ... dpkg --configure -a ...` + pid 919
  `apt-get update` (+ các `apt methods/http/https/gpgv/store`),
  bắt đầu 20:35Z, 11 s TRƯỚC khi cron mở đợt (20:35:51Z). Đây là
  preflight của runtime (khôi phục "os-intent" sau cell restart),
  KHÔNG phải luồng VCut, KHÔNG phải repair của T5. `/var/lib/dpkg/
  status` mtime 20:35:40Z (do replay chạm). T0 không can thiệp.
- Các luồng đợt 157 khác đã chạy lúc T0 đóng (~20:49Z): T1 đang chạy
  suite verify (round157-t1-suites.log 51 KB, đang tăng), T2 đã bắt
  đầu (f120.txt). Chưa có cờ `.done` nào của đợt 157 lúc T0 đóng.
  T0 không va chạm cổng/lock với ai (không chạy O8, không chạm code).
- repo-1 KHÔNG CÓ .git (`git status` → `fatal: not a git repository`
  — trạng thái có sẵn từ đợt 155, không phải do T0 gây ra; vòng lặp
  làm việc trên file, push qua API từ main chat). T0 ghi nhận, không
  sửa.

## §6. Sai số của chính T0-157

- F-157-T0-1 — Lần ước F-measure đầu tiên (~20:41Z) dùng `date -u`
  cắt tới giây nguyên so với `uptime` đọc sau đó, cho +0,08 s — SAI
  LỆCH do cắt giây (sai ~0,84 s so với giá trị thật +0,92 s). Đã bỏ;
  ba số liệu hợp lệ trong §1 đều dùng python `time.time()` (phân số)
  so với btime + uptime (+0,932/+0,916/+0,921 s). Không có kết luận
  nào được viết từ số thô +0,08 s.
- F-157-T0-2 — Lệnh `journalctl --boot=0 -o verbose` (chạy 2 lần +
  1 lần qua python) trả 0 trường `__REALTIME_TIMESTAMP` /
  `__MONOTONIC_TIMESTAMP` trong môi trường này — T0 suýt kết luận
  "journal không có timestamp" trước khi thử `-o short-monotonic` /
  `-o short-iso` và lấy được số liệu đầy đủ (§1.3). Nguyên nhân:
  chưa rõ (có thể do định dạng verbose của journald trong cell); đã
  chuyển phương pháp, không có kết luận sai nào được viết từ lần đọc
  rỗng. Bài học: kiểm tra output rỗng có phải do công cụ không trước
  khi kết luận dữ liệu không có.
- F-157-T0-3 — Lệnh `grep -rl cooldown-t8-round156` đệ quy toàn bộ
  `hidden_files/` + `repo-1/` chạy > 120 s chưa xong (cây file lớn);
  T0 kill tay (SIGTERM) và tìm lại bằng grep hẹp trong thư mục T6 +
  đường dẫn queue từ log T6 (`$HF/vite.lock.queue`) — ra số queue
  101 trong < 1 s. Không có kết luận nào bị ảnh hưởng (queue chỉ là
  số liệu phụ cho T0; T6-157 sở hữu).

## §7. Nợ mở chuyển T10-157 / các luồng

1. **Reboot #56 XÁC NHẬN (boot 348dab54, btime THẬT 19:32:47Z) +
   nghịch lý đồng hồ J ≥ 42'46" — giao T2-157 xác nhận số hiệu +
   mù #88? đi kèm** (cửa sổ mù giờ thật (20:15:33Z − J, 19:32:47Z],
   dài J − 2.566 s ≈ 460 s nếu J = 3.026 s). **Giao parent quyết:**
   (a) có chấp nhận J ≈ 50'26" kế thừa từ đợt 153 làm offset đứng
   cho các btime/mốc wall đợt 153–156 không (chỉ có cận dưới cứng
   42'46" từ dữ kiện đợt này); (b) btime #52/#53/#54/#55 có cần ghi
   lại theo giờ thật (wall − J) trong hồ sơ không, hay giữ nguyên
   wall như đã quyết (c)/(d) đợt 156 (hiệu số không đổi nên quyết
   cũ vẫn đứng).
2. **Kết cục run 156 + ứng viên điểm (m) thứ 15 — giao T7-157.**
   Reboot thật 19:32:47Z (giờ thật); hạn ngân sách run 156
   20:35:51Z theo lịch cron. **CẢNH BÁO KHUNG GIỜ cho T7:** btime
   cell-wall #53/#54/#55/#56 đội J so với giờ thật, trong khi DB
   scheduler chạy khung host (giờ thật — theo T7-153 "đồng hồ cell
   cũ khớp giờ scheduler", hai khung tách biệt). Khi tính offset
   (m) (requeue − btime), PHẢI dùng cùng một khung — nếu DB ghi
   requeue theo giờ thật mà btime lấy theo cell-wall thì offset lệch
   đúng J (~50 phút) và sẽ phá dải 33–49,8 s. T7-157 kiểm lại phương
   pháp tính offset các điểm (m) cũ có trộn khung không; nếu run 156
   còn chạy tại giờ thật 19:32:47Z thì #56 là ứng viên điểm (m) thứ
   15 (DƯƠNG/ÂM do T7 xác minh).
3. **POSTBOOT_PASS #56 + watcher-157 — T5-157 sở hữu** (khởi động
   watcher-157 bằng tay; repair 11 gói + apt-get update lại vì lists
   trống; POSTBOOT_PASS #53/#54/#55 KHÔNG CÓ — đã ghi nhận, không bù
   được; POSTBOOT_PASS #52 đã có từ đợt 156).
4. **O8 chính thức đợt 157 thuộc T8-157** (sau postboot + lượt yên
   hợp lệ; T0-157 chạy 0 attempt — postboot chưa xong; cơ chế JSON
   còn đúng, cây md5 khớp hồ sơ).
5. **Chuỗi WebKit FULL PASS GIỮ 11** (T8-157 phán có lên 12 không;
   T0 không phán).
6. **dpkg.log không còn là nguồn chéo** (chỉ 2 dòng replay 20:35:40Z
   — reset mỗi cell restart): các luồng sau này đừng dùng dpkg.log
   để đối chiếu boot cũ; dùng `dpkg -l` / cache / lists trực tiếp.
7. Nợ đứng giữ nguyên: G1 khung (a) M2 hoãn chờ user; R9 (a) chờ user
   (số đếm 16); ci-security.yml 403 chờ user; TTS 39 cấm kiểm lại;
   birefnet 0 thử (đợt 157 là lần thứ 11 nếu không thử); headroom +
   ENOSPC (quyết (g)/(h) giữ "chỉ theo dõi"); repo-1 không có .git
   (ghi nhận §5); mù #77? vẫn MỞ (chặn chứng nhận #78?–#84?);
   mù #85?/#86?/#87? giao T2-157 (đợt 156); nay thêm #88? cho #56.

---
*T0-157 đóng cờ ~20:52Z (trong hạn cờ ~23:00Z, hạn cứng ~23:30Z — lưu ý:
hạn cờ/hạn cứng của task T0-157 ghi theo giờ UTC 20/11, tức ~03:00/03:30
+07 21/11; T0 đóng sớm, trong hạn). Không sửa code repo nào; không
push/tag.*
*Stage: `phase9-round157-t0-boot-o8.txt` (1 entry NUL — LIMITS này).*
