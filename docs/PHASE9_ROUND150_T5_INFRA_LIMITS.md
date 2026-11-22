# PHASE9_ROUND150_T5_INFRA_LIMITS — BOOT e9295700 REPLAY KHÔNG TỚI TRONG 60' (TIMEOUT 00:44:15Z) → --REPAIR 1 LẦN 00:50:59–01:04:59Z, CỜ MỚI 01:05:33Z POLL=1; CACHE 0 .deb LẦN THỨ 2 LIÊN TIẾP KHÔNG SỐNG QUA REBOOT; TESTSRC2 QUY ĐƯỢC CHỦ (39/41 GẮN TÊN SCRIPT)

> Luồng T5, đợt 150, lượt cron 06:35 +07 20/11/2026 (mở 23:35:51Z
> 19/11; T5 mở thực tế 23:41:15Z, watcher chạy 23:43:55Z, đóng
> ~01:10Z 20/11). Repo `~/workspace/repo-1` (cây làm việc, KHÔNG
> có `.git` local — KHÔNG push). **BOOT MỚI e9295700**
> (btime **23:32:09Z** — uptime -s + /proc/stat btime 1795131129
> KHỚP nhau; /proc/1 23:32:24Z, offset 15 s). Reboot #40 xảy ra
> 23:32:09Z, **~3,5 phút TRƯỚC khi lượt cron 150 mở**
> (23:35:51Z). Boot cũ 802f358f chết ở 23:32:09Z; **tuổi thọ
> 7.698 s = 2h08m18s** (stat→stat, xem §2.1).
> Replay boot mới **KHÔNG TỚI**: chỉ 2 dòng "startup packages
> configure" 23:35:42Z (boot +3m33s — 9 s TRƯỚC khi run 150
> mở, cùng mẫu đợt 149: replay 13 s trước run mở), sau đó im
> hoàn toàn; watcher 60' **TIMEOUT 00:44:15Z (120 poll)**,
> dpkg.log vẫn 2 dòng, md5 `ba3a7c19…` không đổi, 0 apt/dpkg,
> lists 3, /var/log/apt KHÔNG tồn tại, GST 0, **cache apt
> 0 .deb — LẦN THỨ 2 LIÊN TIẾP cache KHÔNG sống qua reboot**
> (trước #39 là 5 lần sống 178 .deb / 156M; sau repair đợt 149
> chỉ còn 110 .deb — xem §4). **TRIGGER §8.2(B) form B = YES
> (verify 5/5 00:50:38Z)** → **--repair 1 lần 00:50:59–
> 01:04:59Z (14m00s, exit 0)**: GST symlink → debroot 269 file
> + apt-get update + cài đủ 11 gói, RE-CHECK toàn PASS; dpkg
> đóng băng **795 dòng / 113 installs / 230 configure, gói
> cuối libc-bin** — Y HỆT mẫu repair-1-phần đợt 140 boot 2 /
> 142 / 149 boot 2; cache sau repair **110 .deb**, lists **75**
> (cũng y hệt đợt 149 boot 2). Postboot **PASS poll1 độc lập
> 01:05:33Z exit 0** → **cờ mới POSTBOOT_PASS cho boot
> e9295700 ghi 01:05:33Z poll=1** (repair-1-phần, KHÔNG phải
> replay-đầy-đủ).
> **TESTSRC2 QUY ĐƯỢC CHỦ (quyết parent (p) đợt 149 — xem
> §7): 101 HIT, 41 PID ffmpeg testsrc2 riêng biệt, 10 PPID,
> TẤT CẢ ngắn ngủi (elapse 00:00–00:10) và thoát bình thường;
> 39/41 gắn tên script chính xác** (demo_lut.js, demo_effects.js,
> demo_sticker.js, test_pixelate_render.js, bench_pixelate_geq.sh
> — đều là test render/effect của T0, gọi với `--out-dir
> /tmp/itest/...`); 2/41 còn lại: 1 pixelate 4K cùng họ (chưa
> gắn tên file duy nhất) + 1 encode HEVC tổng hợp ngoài repo
> (cwd /home/hatch, /tmp/round76-d8/hevc-a.mp4 — không có
> script repo nào match). **0 process sót/kẹt — KHÔNG cần
> sửa test để dọn.** T9-150 đối chiếu từ phía sampler/spike.
> **Headroom mở 318** (trần 63.747 không đổi) — **DƯỚI
> ngưỡng báo lần thứ 10 liên tiếp, chỉ theo dõi**.
> **KHÔNG push. KHÔNG release/tag. KHÔNG sửa production**
> ngoài postboot script (dòng `say` + khối chú thích Dot 150 —
> dữ kiện boot đã đổi thật, xem §5.2). **KHÔNG tự chạy
> birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT MỚI e9295700 (btime 23:32:09Z, reboot #40): REPLAY
   KHÔNG TỚI.** Hoạt động dpkg đầu tiên 23:35:42Z (boot
   +3m33s, 2 dòng startup configure), sau đó **im 4.113 s**
   tới lúc watcher TIMEOUT 00:44:15Z (120 poll, 60 phút);
   dpkg.log vẫn 2 dòng, md5 `ba3a7c19…`, 0 apt/dpkg mọi poll,
   lists 3, GST 0, cache 0. Đây là **boot thứ 2 liên tiếp
   replay không tới** (boot 802f358f đợt 149 cũng vậy — nhưng
   đợt 149 replay boot 1 (70025d3e) đã chạy tốt trước đó; đợt
   này boot duy nhất của phiên là boot replay-chết).
2. **GIỜ BẮT ĐẦU REPLAY (theo quyết (l) — ghi lại, không
   đoán): hoạt động dpkg đầu tiên 23:35:42Z = boot +3m33s.**
   NHƯNG 2 dòng này **không chứng minh replay đã bắt đầu**
   thật: không có wrapper/apt-get update/install nào theo sau
   trong 60' quan sát (khác boot 70025d3e đợt 149: 2 dòng
   KÈM wrapper pid 839 + apt-get update pid 860 đang chạy).
   **Kết luận trung thực: replay KHÔNG bắt đầu / không tiến
   triển — không có "độ trễ tới lúc xong" để đo** (vì không
   xong); độ trễ quan sát được là **≥ 68m33s im lặng**
   (23:35:42Z → 00:44:15Z) và vẫn tiếp tục im tới lúc repair
   (00:50:59Z). Cơ chế khởi động muộn/chết yểu CHƯA xác định
   — chỉ ghi nhận, không mở điều tra riêng (theo brief).
3. **CACHE APT KHÔNG SỐNG QUA REBOOT #40: 0 .deb** (đo
   23:41Z, 23:42Z, mọi poll watcher tới 00:44Z). Trước #40:
   **110 .deb** (sau repair đợt 149 trên boot 802f358f);
   sau #40: **0 .deb** — dir tồn tại, trống (chỉ lock +
   partial). **Lần thứ 2 liên tiếp cache = 0 sau reboot**
   (lần 1: #39, 178 → 0). GST symlink từ repair đợt 149 cũng
   mất theo rootfs rebuild (GST hệ thống 0 file lúc mở).
   Debroot `~/workspace/tmp-q6r3-debroot` còn nguyên (269 file
   GST) — nằm trên overlay nên sống qua reboot; ledger
   os-intent còn (ts 22:35:23Z, mtime 23:36 — xem §3.3).
4. **--REPAIR 1 LẦN 00:50:59–01:04:59Z, exit 0 (14m00s —
   dài hơn đợt 149-boot2 ~4'20" vì cache 0 nên phải download
   lại toàn bộ).** RE-CHECK trong lần repair: wrapper PASS,
   libs PASS (đủ 5), GST PASS (isomp4 + libav), apt PASS (đủ
   11) → "ĐỦ ĐIỀU KIỆN chạy WebKit". dpkg **795/113/230,
   gói cuối libc-bin, md5 `198352db…`** — y hệt mẫu
   repair-1-phần đợt 140 boot 2 / 142 / 149 boot 2. Cache
   sau repair **110 .deb**, lists **75** (cũng y hệt đợt
   149 boot 2). GST là **SYMLINK → debroot**
   (`/usr/lib/x86_64-linux-gnu/gstreamer-1.0` → debroot).
5. **CỜ POSTBOOT_PASS ghi 01:05:33Z poll=1**
   (`boot e9295700 ... poll1 độc lập exit 0 ... dpkg 795/113/
   230 ... cache 110 .deb, lists 75`) — cờ **repair-1-phần**,
   KHÔNG phải cờ replay-đầy-đủ (1545/221/462, GST thư mục
   thật). Cờ cũ 802f358f lưu `POSTBOOT_PASS-802f358f`. **T4-150
   đo lượt yên #22 bằng cờ này** (quyết parent đợt 149 (j)
   vẫn đứng: trích là "harness sau khi T4 đóng cờ", KHÔNG
   trích là "sau lượt yên hợp lệ" nếu #22 chưa có lượt hợp
   lệ — xem §9 mục 1). **T8-150: replay đã xong bằng repair
   → chạy lại WebKit bằng system libs để đối chiếu với kết
   quả DEBROOT đợt 149 (F-149-T8-5)** — T5 không nhắn trực
   tiếp được cho T8, ghi ở đây + báo cáo cuối để parent
   chuyển (xem §9 mục 5).
6. **TESTSRC2 QUY ĐƯỢC CHỦ (xem §7): 101 HIT / 41 PID /
   10 PPID, elapse 00:00–00:10, 0 sót/kẹt.** 39/41 gắn tên
   script (T0-150: demo_lut/demo_effects/demo_sticker/
   test_pixelate_render/bench_pixelate_geq.sh, `--out-dir
   /tmp/itest/...`); 1/41 pixelate 4K cùng họ (chưa gắn tên
   file); 1/41 HEVC tổng hợp ngoài repo. Không sửa test.
7. **HEADROOM mở 318** (trần 63.747 không đổi) — dưới ngưỡng
   báo ~1.800 lần thứ 10 liên tiếp; tỉ lệ/vite ~0,20
   (318/1578). Chỉ theo dõi (quyết (k) đợt 144 + (m) đợt
   146). T9 đối chiếu độc lập.
8. **CÂY:** preview.tsx **530e10a7**, media.ts **2c384ed1**,
   vite.config.ts **ee80d093** (mở = lúc đóng, KHÔNG ĐỔI);
   postboot script **c07e6fee… → f5cb6e10…** (SỬA đợt này,
   xem §5.2; `bash -n` OK).
9. **Run 149 SUCCEEDED 23:04:36Z** (started_at vẫn 21:24:31Z
   — không viết lại thêm; reboot #40 xảy ra SAU khi run 149
   finished nên không ảnh hưởng). **Run 150 jitter 0 s**
   (started 23:35:51Z = scheduled, vẫn running lúc T5 đóng).
10. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.
11. **0 reboot trong phiên T5-150** (boot e9295700 sống từ
    23:32:09Z tới lúc đóng ~01:10Z, ~1h38' tuổi — boot sống
    lâu nhất kể từ đợt 146). **1 reboot trong ngày** (#40,
    trước khi đợt mở).

## 2. Timeline — 2 boot (reboot #40 TRƯỚC khi đợt mở)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 802f358f (reboot #39) | 21:23:51 (19/11) | 7.698 s = 2h08m18s (chết 23:32:09Z) | Boot repair-1-phần đợt 149 (cờ 22:35:39Z poll=1, dpkg 795/113/230); run 149 SUCCEEDED 23:04:36Z trên boot này, TRƯỚC reboot #40 |
| 2 | **e9295700 (reboot #40)** | **23:32:09 (19/11)** | còn sống (~2h38' lúc đóng) | dpkg chỉ 2 dòng startup 23:35:42Z (boot +3m33s) rồi im; watcher 60' TIMEOUT 00:44:15Z → TRIGGER form B = YES → --repair 1 lần 00:50:59–01:04:59Z → RE-CHECK PASS → poll1 PASS 01:05:33Z → **cờ mới 01:05:33Z poll=1**; cache 0 .deb lúc mở (lần 2 liên tiếp); headroom mở 318; testsrc2 41 PID quy được chủ |

- **Btime KHỚP 2 nguồn độc lập** (uptime -s 23:32:09Z +
  /proc/stat btime 1795131129 = 23:32:09Z; brief đợt 150 ghi
  btime 23:32:09Z — KHỚP). /proc/1 23:32:24Z (`ps -o lstart
  -p 1`; offset 15 s).
- **Reboot #40 xảy ra TRƯỚC khi đợt mở 3m42s** (23:32:09Z →
  23:35:51Z). T5 mở thực tế 23:41:15Z (boot 9' tuổi) — lúc đó
  dpkg.log đã có 2 dòng (23:35:42Z) nhưng 0 apt/dpkg đang
  chạy, cache 0, lists 3, GST 0.
- **0 reboot trong phiên T5-150** — khác đợt 149 (1 reboot
  trong lúc đóng sổ). Boot e9295700 sống xuyên suốt phiên,
  không bị giết giữa chừng; repair hoàn thành trọn vẹn (khác
  đợt 123/125).

### 2.1 Tuổi thọ boot 802f358f = 7.698 s — xác nhận bằng 2 cách tính độc lập

| Cách tính | Phép tính | Kết quả |
|---|---|---|
| (i) Trừ datetime (btime /proc/stat) | 2026-11-19T23:32:09Z − 2026-11-19T21:23:51Z | **7.698 s = 2h08m18s** |
| (ii) Trừ epoch btime | 1795131129 − 1795123431 | **7.698 s** |
| Đối chiếu | /proc/1 → /proc/1 | 23:32:24Z − 21:24:01Z = 7.703 s (chênh 5 s do offset /proc/1 hai boot khác nhau: 15 s vs 10 s — xem ghi chú) |

- Hai cách tính chính (datetime vs epoch, cùng chuẩn
  /proc/stat) cùng ra 7.698 s. Số /proc/1 chênh 5 s vì offset
  /proc/1 − stat khác nhau giữa hai boot (15 s vs 10 s) —
  đúng như cảnh báo các đợt trước: chỉ dùng /proc/stat cho
  gap, /proc/1 chỉ để đối chiếu.
- Tuổi thọ (stat→stat) chuỗi gần đây: ae8f70bb 1.171 s →
  70025d3e 4.998 s → 802f358f **7.698 s** → e9295700 còn sống
  (~5.870 s lúc đóng, ~1h38'). Boot 802f358f là boot sống lâu
  nhất kể từ d8a11644 (7.599 s).

### 2.2 Mốc neo btime các boot gần đây (cho T7-150 / T2-150)

| Boot | btime /proc/stat (Z) | btime /proc/1 (Z) | Offset /proc/1 − stat | Nguồn |
|---|---|---|---|---|
| ae8f70bb | 19:41:02 | 19:41:12 | 10 s | T10-148 + T7-148 |
| 70025d3e | 20:00:33 (epoch 1795118433) | 20:00:43 | 10,85 s | T5-149 |
| 802f358f | 21:23:51 (epoch 1795123431) | 21:24:01 | 10 s | T5-149 |
| **e9295700** | **23:32:09 (epoch 1795131129)** | **23:32:24** | **15 s** | **T5-150 đo trực tiếp (uptime -s + /proc/stat + ps lstart -p 1)** |

- Chuẩn btime: **/proc/stat (kernel btime)** theo quyết
  parent đợt 148 (b) — T5-150 dùng chuẩn này xuyên suốt.
- Tuổi thọ (stat→stat): ae8f70bb 1.171 s → 70025d3e 4.998 s
  → 802f358f 7.698 s → e9295700 còn sống.

## 3. dpkg replay — KHÔNG TỚI TRONG 60' → --REPAIR 1 LẦN (quyết (l))

### 3.1 Giờ bắt đầu replay — ghi lại, không đoán (quyết (l))

| Hạng mục | Giá trị đo được | Ghi chú |
|---|---|---|
| btime boot e9295700 | 23:32:09Z (epoch 1795131129) | uptime -s + /proc/stat KHỚP |
| Hoạt động dpkg đầu tiên | **23:35:42Z = boot +3m33s** | 2 dòng "startup packages configure", mtime dpkg.log 23:35:42Z, md5 `ba3a7c19…` |
| Run 150 mở (scheduled) | 23:35:51Z | dpkg đầu tiên **9 s TRƯỚC** run mở |
| Wrapper replay / apt-get update lúc mở (23:41Z) | **0 process** | pgrep apt/dpkg = 0; khác boot 70025d3e đợt 149 (wrapper 839 + apt-get 860 đang chạy lúc T5 mở) |
| Tiến triển sau 2 dòng đầu | **KHÔNG — im hoàn toàn** | watcher 120 poll (23:43:55–00:44:15Z): dpkg.log vẫn 2 dòng mọi poll, md5 không đổi, 0 apt/dpkg mọi poll |
| Watcher TIMEOUT | **00:44:15Z (poll 120)** | im lặng từ 23:35:42Z = **4.113 s (68m33s)** tới TIMEOUT; im tiếp tới lúc repair (00:50:59Z, im 4.517 s) |
| Kết luận | **Replay KHÔNG bắt đầu / không tiến triển** | 2 dòng startup không kèm wrapper/apt nào sau đó — cùng dạng boot 802f358f đợt 149 (2 dòng lúc +40s rồi im); KHÁC boot 70025d3e (2 dòng KÈM wrapper + update đang chạy) |

- **Độ trễ replay: KHÔNG đo được "tới lúc xong"** (vì không
  xong). Chỉ có 2 mốc đo được: (a) hoạt động dpkg đầu tiên
  boot +3m33s; (b) im lặng ≥ 68m33s sau đó (tới TIMEOUT) và
  ≥ 74m56s tới lúc repair bắt đầu (dpkg im 4.496 s lúc verify
  form B 00:50:38Z). Ghi rõ để T7/T10 không đọc "boot +3m33s"
  thành "replay khởi động lúc +3m33s" — 2 dòng startup có thể
  là dpkg --configure -a của tiến trình boot image (như T5-149
  đã nghi cho boot 802f358f), không phải os-intent replay.
- **Trùng giờ đáng chú ý (dữ kiện cho T7, không kết luận cơ
  chế):** dpkg đầu tiên 23:35:42Z, chỉ 9 s trước khi run 150
  mở (23:35:51Z). Đợt 149: replay khởi động 20:35:38Z, 13 s
  trước run 149 mở (20:35:51Z). Hai đợt liên tiếp, hoạt động
  dpkg đầu tiên trên boot mới đều rơi vào **~10 s trước giờ
  mở lượt cron** — T7-150 đối chiếu nếu cần (điều tra (m) đã
  ĐÓNG theo quyết parent đợt 149 — T5 chỉ ghi dữ kiện, không
  mở điều tra mới).
- **Ledger os-intent còn** (`/var/lib/hatch/os-intent/
  ledger.jsonl` 1 dòng compacted, ts 1795127723 = 22:35:23Z —
  từ repair đợt 149; `removed: []`; dpkg-state.txt 783 dòng).
  Mtime cả hai file là 23:36 (boot +~4') — khớp với 2 dòng
  dpkg 23:35:42Z (tiến trình boot image chạy dpkg
  --configure -a và cập nhật state). Nội dung ledger KHÔNG
  đổi so với đợt 149 (vẫn ~170 package `added`).
- **Rootfs rebuild — bằng chứng đầy đủ:** /var/log/apt KHÔNG
  tồn tại lúc mở; lists chỉ 3 file (auxfiles/lock/partial,
  0 index Ubuntu); GST hệ thống KHÔNG tồn tại; cache 0 .deb.
  Giống hệt trạng thái boot 802f358f lúc mở đợt 149.

### 3.2 Watcher replay (mới đợt này — sửa điều kiện DONE so với đợt 149)

- Script `hidden_files/round150-t5/replay-watch.sh`, poll 30 s,
  tối đa 120 poll (60 phút), log `replay-watch.log` (122 dòng:
  START + FIRST-DPKG + 120 poll + TIMEOUT).
- **Điểm khác quan trọng so với watcher đợt 149:** điều kiện
  DONE yêu cầu dpkg.log **> 100 dòng** (tiến triển thật) +
  ổn định 2 poll liên tiếp + 0 apt/dpkg — 2 dòng startup +
  im lặng KHÔNG được tính là DONE (watcher đợt 149 sẽ tuyên
  DONE nhầm trong trường hợp này vì chỉ cần ổn định + 0
  proc). Watcher đợt này **KHÔNG tự chạy --repair** (theo
  thiết kế — T5 quyết tay sau form B).
- Kết quả: **TIMEOUT 00:44:15Z, 120/120 poll giống hệt nhau**
  (dpkg_lines=2, md5=ba3a7c19, apt=[], dpkg=[], gst_sys=0,
  cache=0, lists=3, last=[2026-11-19 23:35:42 startup packages
  configure]). Không có poll nào khác biệt — replay im tuyệt
  đối trong toàn bộ 60 phút quan sát.

### 3.3 TRIGGER §8.2(B) form B — verify độc lập 5/5 (00:50:38Z) → --REPAIR

| # | Điều kiện | Kết quả đo |
|---|---|---|
| (1) | postboot FAIL tươi | check-only exit 1, 00:50:38Z (log `t5-postboot-timeout.log` — thiếu GST + 11 gói apt; xem §5.1) |
| (2) | 0 proc apt/dpkg/unattended-upgrade | pgrep -x apt-get/dpkg = 0; `ps -eo comm` grep exact-comm = 0 |
| (3) | dpkg im ≥ 600 s | dòng cuối 23:35:42Z; lúc verify im **4.496 s** |
| (4) | form B: 2 dòng / 0 installs / GST absent / lists 3 / cache 0 | lines=2, installs=0, gst_sys=0, lists=3, cache=0, /var/log/apt KHÔNG tồn tại |
| (5) | MiniBrowser 0 + WebKitWebProcess 0 | cả hai = 0 |
| + | debroot 269 file sẵn làm đích symlink | `~/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` = 269 file |

- **TRIGGER = YES** — y hệt tiền lệ đợt 140 boot 2, đợt 142
  và đợt 149 boot 2 (cùng dạng "chậm mà không cài", cùng 2
  dòng/0 installs/GST absent/cache 0). Khác nhỏ: lists đợt
  này = **3** (đợt 149 boot 2 lists = 5) — thấp hơn, tức
  replay chưa tới rõ hơn; luật (C) không phải đường kích
  hoạt ở đây (repair kích hoạt bằng §8.2(B) form B, như đợt
  149).
- **--repair 1 lần: 00:50:59–01:04:59Z, exit 0 (14m00s)**
  (log `t5-postboot-repair.log`): REPAIRED GST symlink →
  debroot (269 file); apt-get update OK; REPAIRED apt cài đủ
  11 gói; RE-CHECK trong lần repair: wrapper PASS, libs PASS
  (đủ 5), GST PASS (isomp4 + libav), apt PASS → KẾT LUẬN "ĐỦ
  ĐIỀU KIỆN chạy WebKit". **KHÔNG bị reboot giết** (khác đợt
  123/125 — repair hoàn thành trọn vẹn; 0 reboot trong phiên).
- Repair đợt này **dài hơn hẳn đợt 149-boot2 (~4'20")** —
  vì cache 0 .deb nên apt phải download lại toàn bộ 11 gói
  qua mạng (đợt 149-boot2 cũng cache 0 nhưng update + cài
  nhanh hơn — mirror lúc đó khỏe hơn; T5 không đo riêng tốc
  độ mirror, chỉ ghi thời gian).
- **dpkg đóng băng sau repair: 795 dòng / 113 installs / 230
  configure, gói cuối libc-bin** (mtime 01:04:57Z, md5
  `198352db…`, file `dpkg-frozen-e9295700.txt`) — Y HỆT mẫu
  repair-1-phần đợt 140 boot 2 / 142 / 149 boot 2 (795/113/
  230, libc-bin), KHÔNG phải replay đầy đủ (1545/221/462,
  tools 0.2). GST là **SYMLINK → debroot** (readlink
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` →
  `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0`).
  Cache **110 .deb**, lists **75** (cũng y hệt đợt 149 boot 2:
  110 .deb / lists 75).

### 3.4 So sánh replay các đợt gần nhất (bracket đầy đủ / trạng thái)

| Boot | Đợt | Bracket (configure → xong) / Trạng thái | Gói cuối |
|---|---|---|---|
| d8a11644 | 148 | +41s → +3m47s | tools 1ubuntu0.2 |
| 70025d3e | 149 | +35m05s → +44m33s (khởi động muộn, CHẬM NHẤT chuỗi) | tools 1ubuntu0.2 |
| 802f358f | 149 boot 2 | KHÔNG TỚI trong 60' → --repair 1 lần (795/113/230) | libc-bin |
| **e9295700** | **150** | **KHÔNG TỚI trong 60' → --repair 1 lần (795/113/230)** | **libc-bin** |

- **2 boot liên tiếp replay không tới** (802f358f, e9295700)
  — sau 5 boot liên tiếp replay đầy đủ (đợt 144–148 + boot 1
  đợt 149). Mẫu "replay chết" nay là 2/2 boot gần nhất. T10
  lưu ý khi tính thời gian chờ replay boot sau: nếu mẫu này
  tiếp tục, --repair form B sau 60' watcher là đường xử lý
  đứng (đã dùng 3 lần liên tiếp thành công: 142, 149 boot 2,
  150).
- Gstreamer tools **1.24.2-1ubuntu0.2** vẫn là phiên bản
  chuẩn của replay đầy đủ (không kiểm lại madison đợt này —
  không có dữ kiện mới; repair chỉ cài 11 gói, không cài
  tools 0.2).

## 4. Cache APT — KHÔNG SỐNG QUA REBOOT #40 (lần thứ 2 liên tiếp)

| Thời điểm | Cache .deb | Nguồn |
|---|---|---|
| Đợt 145/146/147/148/149 (boot 1) | 178 .deb / 156M — sống qua reboot, 5 lần liên tiếp | T5-145 → T5-149 |
| Sau repair đợt 149 boot 2 (22:35Z) | **110 .deb** (chỉ 11 gói repair download, không phải 178 đầy đủ) | T5-149 §3.8 |
| **Lúc mở đợt 150 (23:41Z, boot e9295700)** | **0 .deb** — dir tồn tại, trống (chỉ lock + partial) | **T5-150 đo trực tiếp (3 lần: 23:41Z, 23:42Z, mọi poll watcher tới 00:44Z)** |
| Sau repair đợt 150 (01:04Z) | **110 .deb** | T5-150 đo sau repair |

- **Câu hỏi của quyết (l) — TRẢ LỜI TRỰC TIẾP: cache KHÔNG
  sống qua reboot #40.** Trước #40 là 110 .deb, sau #40 là
  0 .deb. Đây là **lần thứ 2 liên tiếp cache = 0 sau reboot**
  (lần 1: #39, 178 → 0). Chuỗi "cache sống" 5 lần (đợt
  145–149) đã đứt ở #39 và KHÔNG hồi lại ở #40 — mẫu mới
  là **cache chết theo reboot** (2/2 lần gần nhất), ngược
  với kết luận "sống là mẫu thường xuyên" của T5-149 §3.4
  (F-149-T5-4 nay đảo chiều lần 2 — xem §11).
- Hệ quả thực tế: replay boot mới (khi tới) phải download lại
  toàn bộ ~170 package qua mạng — chậm hơn hẳn pha cài 1m54s
  của boot 70025d3e (cài từ cache 178 .deb). Repair đợt này
  mất 14m00s (so với ~4'20" đợt 149-boot2) — một phần do
  phải download lại.
- **GST cũng không sống qua #40:** symlink GST → debroot từ
  repair đợt 149 mất theo rootfs rebuild (GST hệ thống 0 file
  lúc mở); debroot trên overlay thì còn (269 file) — repair
  symlink lại là đủ, không cần rebuild debroot.
- Lists: 3 lúc mở → **75 sau repair** (y hệt đợt 149 boot 2:
  75). Lists đầy đủ (71 = 2 mirror) chỉ có sau apt-get update
  của replay đầy đủ — repair-1-phần cho lists 75 (khác 71 —
  do update fetch đủ index + 11 gói repair; T5 không phân
  tích sâu chênh 71 vs 75, chỉ ghi số).

## 5. Postboot check + cờ POSTBOOT_PASS + script

### 5.1 Các lần check (check-only, trừ --repair)

| Lần | Thời điểm (Z) | Kết quả | Ghi chú |
|---|---|---|---|
| early (mở) | 23:45:24 | **FAIL exit 1** (log `t5-postboot-early.log`) | Thiếu GST + 11 gói apt; đúng dự kiến — replay chưa tới |
| timeout (verify form B) | 00:50:38 | **FAIL exit 1** (log `t5-postboot-timeout.log`) | Postboot FAIL tươi cho TRIGGER (1) |
| RE-CHECK trong --repair | 00:50:59–01:04:59 | **PASS toàn bộ** (wrapper/libs/GST/apt) | Trong log `t5-postboot-repair.log` |
| **poll1 độc lập** | **01:05:33** | **PASS exit 0** (log `t5-postboot-poll1.log`) | PASS GST (isomp4 + libav) + PASS apt (đủ 11 gói) → "ĐỦ ĐIỀU KIỆN chạy WebKit" |

- Postboot sớm FAIL 23:45:24Z ghi rõ debroot=269 (script tự
  đếm) — debroot sống, chỉ thiếu symlink + gói apt.
- **Cờ POSTBOOT_PASS ghi 01:05:33Z poll=1** cho boot e9295700
  (file `hidden_files/round150-t5/POSTBOOT_PASS`; cờ cũ
  802f358f lưu `POSTBOOT_PASS-802f358f` trước khi ghi đè —
  theo mẫu đợt 149). Nội dung cờ ghi đầy đủ: boot + btime,
  replay không tới trong 60', repair 1 lần, poll1 PASS,
  dpkg 795/113/230, cache 110, lists 75.
- **Caveat (cùng họ F-147-T5-1):** pass_at 01:05:33Z là thời
  điểm *bắt đầu* poll1 (lệnh khởi động 01:05:33Z, kết thúc
  cùng giây) — mẫu các đợt trước cũng ghi pass_at ≈ thời
  điểm poll1.
- **T4-150 lưu ý:** đây là **cờ repair-1-phần** (GST symlink,
  dpkg 795/113/230) — nếu replay đầy đủ tới SAU (cài nốt
  ~170 gói còn lại, GST thành thư mục thật), T5-151 kiểm lại
  + ghi cờ replay-đầy-đủ thay thế. Lượt yên #22 đo bằng cờ
  này (quyết (j) đợt 149 vẫn đứng).

### 5.2 Postboot script — SỬA đợt này (boot đã đổi — dữ kiện thật mới)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
**`c07e6fee…` → `f5cb6e10…`** (mở → sau sửa; `bash -n` OK).

- Đổi dòng `say` + khối chú thích `# Dot 150 — BOOT MOI SAU
  DOT 149` ghi đầy đủ dữ kiện boot mới (btime 23:32:09Z,
  reboot #40, tuổi thọ boot cũ 7.698 s, replay không tới
  trong 60' + TRIGGER form B, repair 1 lần 14m00s, dpkg
  795/113/230, cache 0 → 110, headroom mở 318, testsrc2 quy
  được chủ, run 149 SUCCEEDED + run 150 jitter 0 s). Theo
  tiền lệ T5-149 §3.7: boot ĐÃ ĐỔI nên dữ kiện trong dòng
  `say` cũ (DOT 149 / boot 70025d3e / reboot #38 / +44m33s)
  là SAI cho boot hiện tại — sửa là bắt buộc để log poll
  đọc đúng.
- Hệ quả stage: đợt này T5 stage **2 file** (LIMITS này +
  postboot script) — như đợt 148/149.

### 5.3 B4 thực hành đối chiếu — (a)+(b) (quyết parent (h) đợt 145)

> Đợt 150 KHÔNG có cửa sổ B4 nào được giao cho T5 đối chiếu
> (T4-150 đang đo lượt yên #22; cửa sổ attempt của T4-150
> thuộc T4/T10 đối chiếu lúc đóng). Thực hành đợt này:

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (a) dpkg.log boot e9295700 — file đóng băng MỚI | `dpkg-frozen-e9295700.txt` (frozen 01:05:33Z): 795 dòng / 113 installs / 230 configure, md5 `198352db…`, mtime 01:04:57Z, gói cuối libc-bin — **manifest mới cho boot mới**, thay thế manifest đợt 149 (boot cũ đã chết) cho mọi đối chiếu kiểu B4 trên boot này | **SẴN SÀNG** |
| (b) ps exact-comm lúc verify form B (00:50Z) | `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, exact-comm apt-get/dpkg/unattended-upgrade = 0 trong `ps -eo comm` | **DEMO ĐÚNG PHƯƠNG PHÁP** — cùng phương pháp T4-144 §6.1; không dùng grep chuỗi con (bài học F-146-T5-1) |
| (c) history.log | /var/log/apt KHÔNG tồn tại lúc mở; sau repair có history.log (T5 không đếm Start-Date đợt này — repair log đủ làm bằng chứng; ghi rõ để T10 không đọc thiếu) | **GHI NHẬN, KHÔNG ĐẾM** |

## 6. Headroom inotify + disk + RAM snapshot

### 6.1 Headroom (probe K8, cap 30.000) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 10 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 148 mở (T5) / cuối (T5) | 548 / 455 | boot d8a11644 |
| Đợt 149 mở (T5) | 434 | boot 70025d3e |
| Đợt 149 cuối (T5) | 336 | boot MỚI 802f358f (1m41s tuổi) |
| **Đợt 150 mở (T5, 23:46Z)** | **318** | **boot e9295700** |

- **318 — thấp nhất kể từ khi đo headroom** (dưới 336 đợt
  149). Trần boot này: **63.747 — KHÔNG đổi** (lần thứ 5 đo
  liên tiếp ở 63.747). Số watch đang giữ ngoài cell suy ra:
  63.747 − 318 = **63.429 watch** (mở).
- **Vẫn DƯỚI ngưỡng báo user (< ~1.800), lần thứ 10 liên
  tiếp**; tỉ lệ/vite ~0,20 (318/1578) — lần thứ 8 liên tiếp
  dưới 1,0. Theo quyết parent (k) đợt 144 + (m) đợt 146
  (chỉ theo dõi, không hành động mới, không nhắc lại riêng),
  đợt này **chỉ theo dõi, không báo riêng, không tự đổi gì**.
- **Cap probe 30.000 áp dụng lần 4** (quyết (m) đợt 146):
  script k8 copy từ đợt 149, `CAP = 30000`, verify bằng grep
  trước khi chạy. Headroom ~318 nên cap không ảnh hưởng kết
  quả (dừng ở 318 do ENOSPC, xa cap).
- Caveat: headroom mở 318 đo lúc 23:46Z, boot 14' tuổi, các
  luồng khác đang khởi động lại sau reboot #40 (T0 ffmpeg,
  T4 WebKit, T1 tsc — watcher inotify của chúng đều tính vào
  trần chung 63.747) nên headroom 318 có thể thấp tạm thời so
  với mức nền của boot. T9-150 đo độc lập để đối chiếu.

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 7,5G trống** (đo 23:42Z — gần như
  trống hoàn toàn sau rootfs rebuild; đợt 149: 6,8G trống).
  `/tmp` tmpfs 512M, 512M trống. Không có ENOSPC nào trong
  phiên ngoài ENOSPC inotify có chủ đích của probe K8.

### 6.3 RAM snapshot một điểm (23:45:45Z — chỉ ghi nhận, không phải series sampler)

- MemTotal 8.124.900 kB; MemFree 200.128 kB; **MemAvailable
  1.010.092 kB** (= 16,1% guard 6.144 MiB — KHÔNG mở cửa sổ
  guard); **Balloon 5.795.060 kB** (= 89,9% trần 6.443.824
  kB — cao nhưng KHÔNG ghim); load1 0,63.
- T5-150 **KHÔNG chạy series sampler RAM** (không thuộc brief
  đợt này — brief chỉ giao 5 nhiệm vụ; sampler dài thuộc T9).
  Số snapshot trên chỉ để đối chiếu nhanh, không dùng để phán
  chuỗi balloon/guard (việc T9-150).

## 7. TESTSRC2 — QUY ĐƯỢC CHỦ (quyết parent (p) đợt 149)

> Chia việc với T9-150: T5 kiểm cây process/PID cha/dòng lệnh
> khi testsrc2 xuất hiện; T9 kiểm từ phía sampler/spike. Nếu
> trùng nhau thì một bên ghi chính, bên kia đối chiếu.

### 7.1 Watcher — cách làm

- Script `hidden_files/round150-t5/testsrc2-watch.sh`, poll
  10 s, chạy 23:44:53Z → 01:07:42Z (dừng tay bằng `kill`
  theo PID — xem F-150-T5-2). Log `testsrc2-watch.log`
  (1.053 dòng, 138.146 byte).
- Mỗi lần thấy ffmpeg có `testsrc2` trong cmdline: chụp ngay
  `ps -o pid,ppid,etime,lstart,comm,args`, cmdline đầy đủ từ
  `/proc/PID/cmdline`, exe/cwd symlink, `pstree -ap` (lọc
  testsrc2|ffmpeg), `ps -ef` (lọc ffmpeg). Mỗi PID chỉ chụp
  1 lần (danh sách seen).
- **Kết quả: 101 HIT block, 41 PID riêng biệt, 10 PPID, TẤT
  CẢ elapse 00:00–00:10** (ngắn ngủi), heartbeat mỗi 60 s đều
  `ffmpeg_count=0` giữa các lần chạy (không có ffmpeg nào
  sống dai). **0 process sót/kẹt.**

### 7.2 Bảng quy chủ — theo PPID (cha trực tiếp lúc chụp)

| PPID | Số ffmpeg con | Script / nguồn (xác minh bằng cmdline + output path) | Mẫu cmdline |
|---|---|---|---|
| 35441 | 1 | **demo_lut.js** (`server/render/demo_lut.js`, `--out-dir /tmp/itest/lut`) | `testsrc2=s=640x360:r=30:d=3 … lut3d=cartcut-ocean.cube … /tmp/itest/lut/lut-cartcut-ocean.mp4` |
| 46565 | 1 | **demo_lut.js** (LUT thứ 2) | như trên, LUT khác |
| 35650 | 2 | **demo_effects.js** (`--out-dir /tmp/itest/effects`) | `testsrc2=s=640x360:r=30:d=3 -vf noise=… /tmp/itest/effects/effect-noise.mp4`; `…/effect-pixelate.mp4` (geq pixelate) |
| 46777 | 2 | **demo_effects.js** (noise + old-film) | `…/effect-noise.mp4`, `…/effect-old-film.mp4` |
| 38052 | 9 | **test_pixelate_render.js** (`--out-dir /tmp/itest/pix-test`) | `testsrc2=s=854x480…/1280x720…/1920x1080… -vf geq=…(mod(X,13)) … /tmp/itest/pix-test/pix-<size>-i<k>.mp4` (SIZES trong file: 640x360/854x480/1280x720/360x640/1920x1080 — KHỚP) |
| 49254 | 9 | **test_pixelate_render.js** (chạy lần 2, pix-test) | như trên |
| 43416 | 14 | **bench_pixelate_geq.sh** (cwd `server/render`) | `testsrc2=size=<640x360..3840x2160>:rate=30 -vf <geq> -frames:v <10/60> -f null -` (dòng 31–32 file .sh KHỚP từng ký tự) |
| 47967 | 1 | **demo_sticker.js** (`--out-dir /tmp/itest/sticker`) | `testsrc2=s=640x360:r=30:d=5 + 3 sticker PNG … /tmp/itest/sticker/sticker-demo.mp4` (W/H/D trong file KHỚP) |
| 14125 | 1 | **Chưa gắn tên file duy nhất — cùng họ pixelate** (pid 14585) | `testsrc2=size=3840x2160:rate=30:duration=5 -vf format=yuv420p,geq=<pixelate> -f null -`, cwd repo-1, elapse 00:02 — mẫu test render pixelate 4K, thoát bình thường |
| 65260 | 1 | **Encode HEVC tổng hợp ngoài repo** (pid 65262) | `testsrc2=size=1920x1080:rate=30:duration=2 + sine 440Hz → libx265/aac … /tmp/round76-d8/hevc-a.mp4`, cwd /home/hatch, elapse 00:08 — grep toàn repo KHÔNG có script nào chứa `round76-d8`/`hevc-a` |

- **Tổng: 41 PID = 39 gắn tên script chính xác + 2 chưa gắn
  tên file duy nhất nhưng đều là test encode tổng hợp ngắn
  ngủi, thoát bình thường.** Các script đã gắn tên đều là
  test render/effect của T0 (demo_*.js lấy `--out-dir` từ
  argv, mặc định /tmp/*-demo; T0-150 gọi với
  `--out-dir /tmp/itest/...` nên output rơi vào /tmp/itest).
  Geq pixelate `mod(X,13)` chỉ về đúng 1 file chứa chuỗi đó:
  `src/test_v19_pixelate_probe.js` (builder dùng chung).
- **PPID là gì:** các PPID (14125, 35441, 35650, 38052,
  43416, 46565, 46777, 47967, 49254, 65260) là tiến trình
  node/bash chạy test, đã chết trước lúc T5 đối chiếu (test
  ngắn ngủi) nên T5 không chụp được cmdline của cha — chủ
  được quy bằng **cmdline + cwd + output path của con**
  (đủ mạnh: output path + kích thước + filter khớp từng
  script), không phải bằng PPID. Ghi rõ giới hạn này để
  T10/T9 không đọc quá ("quy được chủ" = quy được tới
  script test, không phải tới PID cha còn sống).
- **Kết luận cho quyết (p): testsrc2 KHÔNG phải sót từ test
  render (không có process nào kẹt lại cần dọn), KHÔNG phải
  process ngoài lạ — toàn bộ là test render/effect đang chạy
  đúng chức năng trong đợt 150. KHÔNG sửa test, KHÔNG mở
  điều tra đầy đủ.** T9-150 đối chiếu từ phía sampler/spike
  (nếu T9 thấy spike nào không khớp với 41 PID này thì ghi
  riêng).

### 7.3 Sai số watcher (F-150-T5-1 — xem §11)

- Bản watcher đầu (23:43:55Z) match nhầm shell/watcher chứa
  chuỗi "testsrc2" (3 capture giả: shell 4315, watcher 4318,
  subshell 4333) — đã sửa trong 1 phút (chỉ match ffmpeg có
  testsrc2 trong cmdline), log giả lưu riêng
  `testsrc2-watch.log.bak-falsepositive`. 3 PID giả KHÔNG
  tính vào 41 PID thật (đã loại trước khi đếm).

## 8. Dữ kiện thời gian reboot cho T7-150 / T2-150 (chỉ ghi nhận — điều tra (m) đã ĐÓNG)

> Điều tra mẫu (m) đã ĐÓNG theo quyết parent đợt 149 (T7-149
> phán xong). T5-150 chỉ cung cấp dữ kiện + mốc neo mới,
> KHÔNG mở điều tra mới.

| Lượt | run_id (8 ký tự đầu) | scheduled (Z) | started_at GỐC (Z) | started_at HIỆN TẠI (Z) | finished (Z) | status | Jitter gốc |
|---|---|---|---|---|---|---|---|
| 148 | b33c757c | 17:35:51 | 17:36:53 | 19:41:37 | 20:19:32 | succeeded | +62 s |
| 149 | 91ee7447 | 20:35:51 | 20:35:51 | **21:24:31** (viết lại tại #39) | **23:04:36** | **succeeded** | 0 s |
| 150 | 1551f2fa | 23:35:51 | **23:35:51** | **23:35:51** (đọc 01:08Z, không đổi) | null | **running** | **0 s** |

- Run 149 **SUCCEEDED 23:04:36Z** (đọc lại 01:08Z) —
  finished TRƯỚC reboot #40 (23:32:09Z) nên started_at vẫn
  21:24:31Z, **không bị viết lại thêm** (đọc 21:41Z đợt 149
  cũng 21:24:31Z — 3 lần đọc一致).
- Run 150 **jitter 0 s** (started 23:35:51Z đúng giây
  scheduled); reboot #40 xảy ra TRƯỚC khi run 150 bắt đầu
  (23:32:09Z < 23:35:51Z) nên không có viết lại nào để quan
  sát trong phiên này. Đọc lại 01:08Z: started_at vẫn
  23:35:51Z, status running, finished null.
- **Mù #72? MỞ (reboot #40) → giao T2-150** (quyết parent
  đợt 148 (f)/(g) + reboot mới; mù #68/#69?/#70?/#71? do
  T2-149/T2-150 phán — T5 không tự phán mù). T5 KHÔNG chạy
  probe EPERM riêng (phối hợp T2 — tiền lệ các đợt).

## 9. Nợ mở sang đợt sau

1. **Lượt yên #22: ĐANG ĐO Ở ĐỢT 150 (việc T4-150).** Cờ
   POSTBOOT_PASS mới cho boot e9295700 đã ghi 01:05:33Z
   poll=1 (**cờ repair-1-phần**, GST symlink, dpkg
   795/113/230 — xem §5.1). Nếu replay đầy đủ tới SAU, T5-151
   kiểm lại + ghi cờ replay-đầy-đủ thay thế. Quyết (j) đợt
   149 vẫn đứng cho cách trích.
2. **Replay chết 2 boot liên tiếp (802f358f, e9295700).**
   Đường xử lý đứng: watcher 60' → TRIGGER form B → --repair
   (đã dùng 3 lần liên tiếp thành công). Nếu boot sau replay
   lại không tới, lặp lại đúng quy trình này; nếu replay đầy
   đủ trở lại thì ghi cờ replay-đầy-đủ (1545/221/462) thay
   cờ repair-1-phần.
3. **Cache APT chết theo reboot 2 lần liên tiếp (#39, #40).**
   Mẫu "cache sống 178 .deb" đã đứt; theo dõi đợt 151 xem
   cache 110 .deb sau repair đợt này có sống qua reboot #41
   không. Nếu vẫn 0 thì mẫu mới là "cache chết theo reboot"
   — T10 lưu ý khi tính thời gian chờ replay/repair boot sau
   (phải download lại toàn bộ).
4. **WebKit system libs — CHỜ T8-150:** repair đã xong,
   postboot PASS → **T8-150 chạy lại WebKit bằng system libs
   để đối chiếu với kết quả DEBROOT đợt 149 (F-149-T8-5)**.
   T5 không nhắn trực tiếp được cho T8 (luồng song song) —
   ghi ở đây + báo cáo cuối để parent chuyển.
5. **Cửa sổ guard: KHÔNG MỞ đợt này** (snapshot 16,1%
   guard lúc 23:45Z — không phải series; T9-150 phán bằng
   series dài của họ). Guard 6.144 MiB GIỮ NGUYÊN; u2net là
   fallback chính thức; birefnet 0 lần thử bởi T5.
6. **Balloon: snapshot 89,9% trần lúc 23:45Z** (5.795.060 kB
   / 6.443.824 kB) — cao nhưng không ghim; T9-150 phán chuỗi
   ghim trần bằng series dài của họ (sampler T5 đợt này
   không có series — xem §6.3).
7. **Headroom VẪN DƯỚI NGƯỠNG BÁO (mở 318):** chỉ theo dõi,
   không báo riêng (quyết (k) đợt 144 + (m) đợt 146). T9 đối
   chiếu độc lập.
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 149 §11:
   G1 chờ user quyết; ci-security.yml vẫn 403 chờ user; file
   oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
   vẫn chưa quyết số phận; TTS 39 cấm kiểm lại; release gate
   không đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a)
   vẫn chờ user (số đếm VẪN LÀ 16); mâu thuẫn full boot_id
   b47f7932 vẫn để mở; mù #68/#69?/#70?/#71? mở giao T2;
   mù #72? (reboot #40) mở giao T2-150.

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7
  lúc đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: **SỬA đợt này** (`c07e6fee…` →
  `f5cb6e10…` — xem §5.2; `bash -n` OK).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử bởi T5 (không
  thuộc brief; snapshot RAM: 16,1% guard — xem §6.3).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-150
  chạy probe; mù #72? giao T2-150). WFS scan: T5 KHÔNG chạy
  đợt này (không thuộc brief; chờ T2-150).
- Postboot boot e9295700: FAIL early (23:45:24Z) + FAIL
  timeout-verify (00:50:38Z) → **--repair 1 lần
  00:50:59–01:04:59Z exit 0** → **poll1 độc lập PASS exit 0
  (01:05:33Z) → cờ mới 01:05:33Z poll=1**. Watcher replay:
  **TIMEOUT 00:44:15Z (120 poll, replay KHÔNG tới)**.
  Luật (C): KHÔNG phải đường kích hoạt; repair kích hoạt
  bằng §8.2(B) form B (verify 5/5).
- B4 thực hành: **(a) file đóng băng MỚI dpkg-frozen-e9295700.txt
  + (b) exact-comm = 0** (xem §5.3) — không có cửa sổ giao
  đối chiếu đợt này.
- Headroom: mở **318** (boot e9295700) — VẪN DƯỚI ngưỡng báo
  ~1.800, lần thứ 10 liên tiếp, chỉ theo dõi.
- **0 reboot trong phiên T5-150** — boot e9295700 sống xuyên
  suốt (~2h38' lúc đóng).
- **started_at lượt 150:** T5 ĐÃ kiểm đợt này (muse.db — xem
  §8): jitter 0 s (23:35:51Z); đọc lại 01:08Z vẫn 23:35:51Z,
  running, finished null — KHÔNG bị viết lại (reboot #40 xảy
  ra trước khi run bắt đầu).

## 11. Sai số F-150-T5-n (mọi sai số của luồng T5 đợt này)

- **F-150-T5-1 — Testsrc2 watcher bản đầu match nham shell/
  watcher chứa chuỗi "testsrc2" (lỗi logic, đã sửa trong 1
  phút).** Bản đầu dùng `pgrep -af testsrc2` — match luôn
  shell exec đang chạy lệnh khởi động (cmdline chứa chuỗi
  "testsrc2-watch.sh") + chính watcher + subshell → 3 capture
  giả lúc 23:43:55Z (pid 4315/4318/4333). Đã sửa: chỉ match
  `pgrep -af ffmpeg | grep -F testsrc2`; log giả lưu riêng
  `testsrc2-watch.log.bak-falsepositive`; 3 PID giả KHÔNG
  tính vào 41 PID thật. Bài học: mọi watcher match theo
  chuỗi con trong cmdline đều phải giới hạn comm (ffmpeg)
  trước khi match nội dung.
- **F-150-T5-2 — pkill testsrc2-watch lần đầu match cả shell
  của T5 (lỗi thao tác, đã khắc phục — cùng họ F-149-T5-7).**
  Lệnh `pkill -f 'bash testsrc2-watch[.]sh'` match shell exec
  vì cmdline chứa dòng restart `nohup bash testsrc2-watch.sh`
  (không có bracket) → shell bị SIGTERM (exitSignal 15).
  Watcher cũ chết theo (đúng ý định) nhưng lệnh restart
  không chạy. T5 dừng watcher cuối phiên bằng `kill <PID>`
  trực tiếp (pid 4734) — sạch, không pkill. Bài học: kill
  theo PID khi biết PID; mọi lệnh pkill -f + restart KHÔNG
  bao giờ đặt chung một shell invocation.
- **F-150-T5-3 — Kết luận "cache sống là mẫu thường xuyên"
  của T5-149 §3.4 nay ĐẢO CHIỀU lần 2 (không phải lỗi đo —
  dữ kiện mới).** T5-149 đã đảo chiều F-141-T5-4 ("cache
  chết" → "cache sống") sau 5 lần sống liên tiếp; đợt này
  cache chết 2 lần liên tiếp (#39, #40) nên mẫu mới là
  "cache chết theo reboot". T5 ghi rõ cả hai chiều để T10
  không trích nhầm kết luận cũ.
- **F-150-T5-4 — Số `configure` trong dpkg đóng băng: 2 cách
  đếm khác nhau (ghi rõ để T10 không đọc nhầm).**
  `grep -c ' configure '` (có khoảng trắng 2 đầu) = 110;
  `grep -c configure` (mọi dòng chứa chuỗi) = **230** — số
  230 mới là số so sánh được với mẫu repair-1-phần đợt 140/
  142/149 (795/113/230). LIMITS dùng 230 xuyên suốt; 110
  chỉ ghi ở đây làm rõ phương pháp.
- **F-150-T5-5 — Headroom mở 318 đo giữa lúc các luồng khác
  khởi động lại sau reboot (caveat, không phải lỗi đo).**
  Lúc probe (23:46Z) T0 chạy ffmpeg + T4 chạy WebKit +
  T1 chạy tsc — watcher inotify của các luồng này đều tính
  vào trần chung 63.747 nên headroom 318 có thể thấp tạm
  thời so với mức nền của boot. T9-150 đo độc lập để đối
  chiếu.
