# PHASE9_ROUND121_T5_INFRA_LIMITS — Hạ tầng boot #62?/#63?: replay #62? chạy xong rồi reboot; replay #63? chết dạng (B) → luật replay-chết kích hoạt lần đầu, --repair chạy sống lần đầu: PASS, headroom hồi 0 → 5436

> Luồng T5, đợt 121, lượt cron 15:35 +07 16/11/2026 (bắt đầu ~08:35Z, boot ~10' tuổi).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 120 §10 + quyết parent §12 mục 3 (luật "replay-chết" §8.2
> HIỆU LỰC TỪ ĐỢT 121 — nhiệm vụ chính của luồng: đánh giá + áp dụng luật lần
> đầu nếu đủ điều kiện) + mục 4 (R9 (a) vẫn chờ user).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ 5 điều kiện §8.2. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot hiện tại là #62? (SỐ TẠM)** — boot 2026-11-16 08:25:47Z
   (btime kernel 1794817547 / `uptime -s`; journal first entry
   08:25:58Z, chênh +11 s; `/proc/uptime` 862,33 s lúc 08:40:09Z →
   suy ra boot ~08:25:47Z; `stat` btime của `/` 08:25:56Z — DÙNG
   ĐƯỢC trên boot này, khác #60? trả về epoch 1970),
   boot_id `9788ce28-c334-40f4-bc21-e93d298b0f9b`, sau #61 06:50:58Z
   (gap 1h34'49"). Số thứ tự CHƯA CHẮC (chờ T6 đếm lại mù #37);
   trong file này gọi tạm "#62?" và luôn kèm boot_id + btime.
   `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại); `last -x`
   chỉ còn 1 dòng reboot 08:25Z — log các boot trước đã mất cùng
   rootfs rebuild (cùng cơ chế mất log như mọi boot trước).
2. **Postboot #62?: FAIL lúc boot ~15'** — check-only exit 1
   (try1 + try1b + sau khi sửa script, cùng kết quả y hệt).
   Thiếu 5 lib + GST isomp4/libav + 11 gói apt. Cờ `POSTBOOT_FAIL`
   đã ghi theo §8.5 (ghi rõ replay ĐANG CHẠY để luồng khác không
   đọc nhầm FAIL thành replay chết). Xem §2.
3. **Replay ĐANG CHẠY — KHÔNG PHẢI CHẾT.** dpkg configure lúc
   08:35:39Z (boot +9'52"), rồi `apt-get update` (pid 815) +
   wrapper os-intent (pid 794) chạy liên tục; update mất ~12 phút
   (mirror chậm, giống #47); installs bắt đầu 08:48:08Z, dpkg.log
   2 → 40 dòng trong 2 phút đầu. Xem §3.
4. **Luật replay-chết §8.2 (HIỆU LỰC TỪ ĐỢT 121) — ĐÁNH GIÁ LẦN
   ĐẦU: KHÔNG KÍCH HOẠT.** Điều kiện 2(a) KHÔNG đạt (apt-get +
   wrapper đang chạy); điều kiện 3 cũng chưa đạt (boot ~15–20'
   tuổi, dpkg mới im ~5'); dạng lỗi (A)/(B) chưa xác định được
   (replay còn chạy). → **KHÔNG chạy `--repair`.** Đây là kết quả
   đúng thiết kế của luật (luật chỉ kích hoạt khi replay chết,
   còn replay sống thì chờ). `--repair` code mới VẪN chưa từng
   chạy sống lần nào. Xem §7.
5. **Headroom inotify hiệu dụng: 0 — THẤP NHẤT TỪNG ĐO.**
   K8 probe STOP ở i=0 (errno 28) hai lần liên tiếp; kiểm chéo
   trên 3 thư mục (/tmp, $HOME, ~/workspace) đều ENOSPC; số watch
   nhìn thấy trong cell chỉ 14/63747 — watch đang bị giữ NGOÀI
   cell (theo ghi nhận đợt 120: ~61k watch ngoài cell). Vite
   thường KHÔNG chạy được; vite tạm `watch.ignored` là đường duy
   nhất; mọi file-watcher khác cũng sẽ ENOSPC. Xem §4.
6. **Cập nhật `postboot-check.sh` (md5 `d7d643b0…` →
   `e549326b…`):** chỉ đổi tham chiếu boot (thêm #61/#62? trong
   header + dòng `say`); `bash -n` OK + chạy kiểm chỉ-đọc lại
   vẫn FAIL exit 1 như kỳ vọng. Xem §8.
7. **Stale vite.lock: KHÔNG có lock sót.** Thư mục lock v2 KHÔNG
   TỒN TẠI trên boot #62 (sạch); queue 38 file cooldown (tăng từ
   34 ở #60? — đều cũ, vô hại; T5 không xóa); v2 log không có
   hoạt động nào trên boot #62 tới lúc kiểm (hoạt động cuối
   07:21:06Z, T3 đợt 120, boot #61). Xem §6.
8. **R9 (a) vẫn mở (nhắc lần 7):** cron chạy watcher v2 ở đầu mỗi
   lượt với `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt 117
   §13 Quyết 9 (thay đổi thân cron, cần user đồng ý); T5 KHÔNG
   tự đổi thân cron. Xem §9.
9. **Watcher đợt 1 quan sát replay #62? 7 poll rồi BỊ GIẾT THEO
   REBOOT (xem §5):** replay #62? ĐÃ XONG — dpkg.log 2 → 1509
   dòng, gói cuối gstreamer1.0-tools 08:52:06Z (boot +26'19"),
   apt hết chạy ở poll 7 (08:52:47Z). NHƯNG boot reboot
   08:53:05Z trước khi watcher kịp kiểm postboot PASS (poll 10)
   — bracket #62? chỉ kẹp được nửa trái (FAIL cuối 08:44Z,
   replay-xong 08:52:06Z), PASS không quan sát được. Watcher
   (nohup setsid PID 9480) chết theo reboot; T5 khởi động lại
   watcher cho boot mới (đợt 2).
10. **Boot #63? (btime 08:53:05Z, boot_id 725453a2-…)** — sau #62?
    27'18"; replay bắt đầu NHANH (configure +48") rồi CHẾT dạng
    (B); luật §8.2 kích hoạt lần đầu → `--repair` PASS (xem
    §7.3/§13.6); watcher đợt 2 (PID 4663) ĐÃ XONG 60/60 poll
    (08:56:45Z → 09:56:56Z), PASS xác nhận 4 lần độc lập. Xem §13.
11. **Không reboot mới kể từ #63?** — boot vẫn 725453a2 tới
    09:57:51Z (cuối lượt T5).
12. **REPAIR THÀNH CÔNG — LẦN ĐẦU LUẬT §8.2 KÍCH HOẠT + LẦN ĐẦU
    `--repair` CHẠY SỐNG (xem §7.3 + §13.6):** đủ 5/5 điều kiện
    trên boot #63? (verify sạch 09:12:22Z); cờ REPAIR_TRIGGERED
    ghi trước; `--repair` chạy 1 lần có giám sát 09:14:14Z →
    09:26:57Z (~12'43"), exit 0, "DU DIEU KIEN"; kiểm lại độc
    lập check-only exit 0 lúc 09:27:19Z. Cờ `POSTBOOT_PASS` đã
    ghi ("PASS nhờ repair, không phải replay") + caveat symlink
    (thư mục GST là symlink → debroot, file apt ghi qua symlink,
    số file debroot vẫn 269). Headroom hồi 0 → 5436 (poll 30).

## 2. Postboot #62? — FAIL lúc +15' (check-only, replay đang chạy)

- Boot #62?: 2026-11-16 08:25:47Z (btime kernel 1794817547;
  `uptime -s` đồng ý; journal first entry 08:25:58Z, chênh +11 s
  — cùng mẫu +11 s như #60?; `/proc/uptime` 862,33 s lúc
  08:40:09Z → boot ~08:25:47Z; `stat` btime của `/` 08:25:56Z —
  DÙNG ĐƯỢC trên boot này, khác #60? trả về epoch 1970;
  5 nguồn đồng ý trong ~11 s, KHÔNG có dấu hiệu giây nháy như
  #54). boot_id `9788ce28-c334-40f4-bc21-e93d298b0f9b`, sau #61
  06:50:58Z (gap 1h34'49"). `journalctl --list-boots` CHỈ CÒN 1
  boot (hiện tại); `last -x` chỉ còn 1 dòng reboot 08:25Z (wtmp
  begins 08:25:57Z).
- Lần kiểm T7 try1: 08:41Z (boot ~15' tuổi), script bản T7 đợt 120
  (md5 `d7d643b0…`), exit 1. Log: `t5-postboot-b62-try1.log`.
  (Lưu ý: `EXIT=0` in trong log try1 là exit của `tee` qua pipe,
  không phải của script — đã kiểm lại exit thật ở try1b.)
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - FAIL libs: thiếu: libevent-2.1.so.7 libEGL.so.1 libavif.so.16
    libdw.so.1 libevdev.so.2.
  - FAIL GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn
    tại; file plugin hệ thống = 0 (debroot vẫn 269).
  - FAIL GST: thiếu isomp4=1 libav=1.
  - FAIL apt: chưa cài: libevent-2.1-7t64
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good
    gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
    gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16
    libgstreamer1.0-0 libevdev2 (11 gói — script ghi "10 gói" ở
    vài chỗ cũ nhưng danh sách NEED thực tế là 11 gói kể cả
    libevdev2, Q7 đợt 114).
  - KẾT LUẬN: CHƯA ĐỦ — chạy lại với --repair, hoặc chờ apt
    replay xong rồi chạy lại.
- Lần kiểm try1b (exit thật, không qua pipe): 08:41Z,
  `SCRIPT_EXIT=1` (`t5-postboot-b62-try1b.log`) — nội dung FAIL y
  hệt try1. Bài học nhỏ: khi cần exit thật thì ghi script ra file
  tạm rồi đọc, không dựa vào `$?` sau pipe (pipe trả exit của
  `tee`).
- Lần kiểm sau khi sửa script (§8): 08:44–08:45Z (boot ~19'),
  exit 1 (`t5-postboot-b62-after-edit.log`) — nội dung FAIL y hệt,
  chỉ khác dòng `say` đã cập nhật boot #62?.
- **`--repair` KHÔNG chạy: luật §8.2 không kích hoạt (xem §7).**
  Replay đang chạy (apt-get update pid 815 + wrapper pid 794)
  nên chữ của script "chạy lại với --repair" KHÔNG được làm theo
  mù — phải đối chiếu 5 điều kiện §8.2 trước (điều kiện 2 đã
  không đạt).
- Cờ `POSTBOOT_FAIL` đã ghi cho các luồng khác dùng (T4/T3 đang
  gate-wait) lúc 08:44Z — theo §8.5 đã chính thức hóa từ đợt 121.
  Nội dung cờ ghi RÕ: "REPLAY ĐANG CHẠY — KHÔNG PHẢI REPLAY
  CHẾT: FAIL này = 'chưa đủ, replay đang chạy'". Gate0-wait đọc
  cờ FAIL này thì TIẾP TỤC CHỜ, không kết luận gate 0 chết.
  Cờ sẽ được cập nhật thành `POSTBOOT_PASS` khi replay xong (ghi
  rõ "PASS nhờ replay" — hoặc "PASS nhờ repair" nếu có repair
  sau này).

## 3. Replay boot #62? — ĐANG CHẠY (bằng chứng)

### 3.1 Bằng chứng tại thời điểm T5 kiểm đầu (08:40–08:45Z, boot ~14–20')

- `/var/log/dpkg.log`: **chỉ 2 dòng, cả hai cùng giây**
  `2026-11-16 08:35:39 startup packages configure` (boot +9'52");
  file mtime 08:35; 0 entry nào trước 08:35:39, 0 entry nào sau
  tới lúc kiểm 08:45Z (nhưng xem §3.2: installs bắt đầu 08:48Z).
  So sánh: #60? cũng 2 dòng configure nhưng lúc +49'51" rồi chết;
  #62? configure lúc +9'52" rồi update chạy tiếp — cùng chữ ký
  mở đầu, khác diễn biến sau đó.
- **Replay ĐANG CHẠY:** wrapper os-intent pid 794 (start 08:35,
  `sh -c` payload `HATCH_OS_INTENT_SEED_BASELINE`, kèm hook
  reseed + `dpkg --configure -a` + vòng install theo ledger) +
  `apt-get update` pid 815 (start 08:35) + methods http (819,
  820) / https (821, 822) + gpgv (1722) + store (1863). `pgrep -x
  apt-get` = 815; `pgrep -f HATCH_OS_INTENT_SEED_BASELINE` = 794,
  2769, 2771 (wrapper + con). Tiến trình duy nhất đáng chú ý
  khác: `hatch daemon` + `hatch-execd` (daemon thi hành lệnh của
  agent, KHÔNG phải replay).
- `/var/log/apt`: **KHÔNG TỒN TẠI** (giống #60? — apt-get update
  không tạo thư mục này; chỉ install/remove mới ghi history.log
  — không dùng sự vắng mặt của nó để kết luận replay chết).
- `/var/lib/apt/lists/`: lúc 08:40Z chỉ `auxfiles/`, `lock`,
  `partial/` (0 file lists hoàn chỉnh); `partial/` mtime 08:39,
  đang nhận file — apt-get update ĐANG FETCH. Số file dưới
  lists: 90 (08:40Z) → 123 (watcher poll 1, 08:46:45Z) → 69
  (poll 2, 08:47:46Z) — dao động do partial files được đổi tên/
  dọn khi update hoàn tất (không phải lists đã về đủ).
- Lock dpkg: `/var/lib/dpkg/lock`, `/var/lib/dpkg/lock-frontend`,
  `/var/lib/apt/lists/lock` đều size 0, mtime 08:35; `fuser`
  không thấy ai giữ (rc=1) — NHƯNG `fuser` chạy non-root không
  thấy được process root giữ lock (apt-get pid 815 chạy root) nên
  kết quả này KHÔNG đáng tin; bằng chứng sống/chết lấy từ
  `pgrep`/`ps` làm chuẩn (ghi nhận hạn chế này để các luồng sau
  khỏi dùng `fuser` làm bằng chứng duy nhất).
- GST: thư mục plugin không tồn tại; `dpkg -l | grep -i
  gstreamer` — 0 package; 11 gói kiểm từng gói đều MISSING.
- Libs: 5 lib đều MISSING theo script (ldconfig -p không thấy).

### 3.2 Diễn biến sau đó — installs đã bắt đầu (quan sát tới 08:48Z)

- 08:48:08Z: dpkg.log bắt đầu tăng — installs chạy
  (`dictionaries-common:all 1.29.7` half-configured 08:48:08 →
  installed 08:48:10Z); dpkg.log 2 → 40 dòng trong ~2 phút.
  Tức update mất ~12 phút (08:35 → ~08:47) — mirror chậm, cùng
  mẫu #47 (update ~12' vì mirror chậm); installs bắt đầu muộn
  nhưng đang tiến triển bình thường.
- Chuỗi thời gian khởi động replay: #48 +40s → #52 +6'28" →
  #47 +22.6' → #53 không tới (65+') → #54 +47'14" → #57? +2'05"
  → #58 +0'53" → #60? +49'51" (chỉ configure, rồi chết) →
  **#61 +0'40" (xong +5'41") → #62? +9'52" (configure), update
  ~12', installs từ ~+22'**. Độ trễ khởi động tiếp tục dao động
  mạnh; #62? nằm giữa dải "muộn nhưng sống" (#47/#54), không
  phải dải chết (#53/#60?).
- **Replay #62? ĐÃ XONG (quan sát qua watcher đợt 1, §5):**
  dpkg.log 2 → 457 dòng (poll 3, 08:48:46Z) → 1383 (poll 4) →
  1474 → 1487 → **1509 dòng (poll 7, 08:52:47Z)**, dòng cuối
  `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.1`
  lúc 08:52:06Z (boot +26'19") — cùng gói cuối + cùng tổng 1509
  dòng như #57?/#61 (boot replay khỏe). apt-get hết chạy ở poll 7
  (apt=no, wrapper vẫn yes — wrapper đang làm closing pass/
  reseed/autoclean). Tức: update ~12' (08:35 → ~08:47) + installs
  ~5' (08:48 → 08:52) — tổng ~17' từ configure tới xong, chậm
  hơn #61 (~5') vì update chậm (mirror), nhưng installs chạy
  nhanh và đủ gói (1509 dòng = đủ bộ).
- Bracket replay #62?: mở đầu 08:35:39Z (boot +9'52"); replay
  xong 08:52:06Z (boot +26'19"). **Bracket chỉ kẹp được nửa
  trái:** (FAIL cuối 08:44Z, replay-xong 08:52:06Z] — postboot
  PASS đầu tiên KHÔNG quan sát được (boot reboot 08:53:05Z
  trước poll 10). Đây là bracket "replay-complete" chứ không phải
  bracket "PASS" như #46/#47/#48/#52/#54/#57?/#61 — ghi rõ để
  không ai đọc nhầm thành PASS đã kẹp.

### 3.3 Bảng chế độ lỗi replay (cập nhật tới #63?)

| Boot | Chế độ | Bằng chứng |
|---|---|---|
| #45 | Không tới (43 phút quan sát) | 0 apt/dpkg; --repair vá symlink, apt FAIL (lists trống) |
| #46 | Chạy, kẹp được (1'23", 7'08"] | watcher live |
| #47 | Chạy chậm (22.6', 27.7'] | watcher live; update ~12' vì mirror chậm |
| #48 | Chạy nhanh (0'40", 2'44"] | dpkg.log |
| #52 | Chạy (6'28", 8'44"] | dpkg.log |
| #53 | Đình trệ, không tới (65+') | 0 hoạt động apt |
| #54 | Chạy muộn (47'14", 52'30"] | dpkg.log; configure→xong 5'16" |
| #57? | Chạy nhanh (2'05", 7'34"] | dpkg.log + PASS live |
| #58 | **Tới nhưng thiếu GST** (0'53", 30'02"], 350 dòng, kết thúc mà 0/9 GST | dpkg.log + FAIL 25/25 |
| #59 | Tới, còn sớm lúc +28' (698 dòng, vẫn libc-bin), kết thúc không quan sát | FAIL 15/15 |
| #60? | **Chạm mà không cài** — 2 dòng configure lúc +49'51", rồi im; 0/9 GST | dpkg.log + FAIL (T7 + T3 độc lập) |
| #61 | **Chạy nhanh** (0'40", 5'41"], 1509 dòng, PASS live lúc +6' | dpkg.log + PASS (T4 đợt 120) |
| **#62?** | **Chạy xong, chưa kịp PASS** — configure +9'52", update ~12', installs ~5', xong +26'19" (1509 dòng, gói cuối gstreamer1.0-tools); reboot 08:53:05Z trước khi kiểm PASS | dpkg.log + FAIL lúc +15' (T5 đợt 121); bracket nửa trái (FAIL 08:44Z, xong 08:52:06Z] |
| **#63?** | **Đang chạy** — configure +48s (nhanh, ngang #61/#48); FAIL lúc +2'39"; kết luận sau watcher đợt 2 §13 | dpkg.log + FAIL lúc +2'39" (T5 đợt 121) |

## 4. Headroom inotify + RAM (boot #62?)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T8, 08:40Z (boot #52, ~11' tuổi) | 948 | boot MỚI — trước thử vite |
| T8, 09:02Z (boot #52, ~33' tuổi) | 925 | sau thử vite |
| T7, 11:41Z (boot #54, ~53' tuổi) | 804 | boot MỚI — sau replay + postboot PASS |
| T7, 23:44Z (boot #57?, ~10'43" tuổi) | 670 | boot MỚI — sau replay + postboot PASS |
| T7, 05:44Z (boot #60?, ~58' tuổi) | 545 | boot MỚI — sau postboot FAIL |
| **T5, 08:41Z (boot #62?, ~15' tuổi)** | **0** | **boot MỚI — replay đang chạy, postboot FAIL** |

- Xu hướng #42→#62?: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 →
  1298 → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot
  #47 mới) → 1073 → 969 → 961 (boot #48) → 948 → 934 → 925 (boot
  #52) → 804 (boot #54) → 670 (boot #57?) → 545 (boot #60?) →
  **0 (boot #62?)**. Rơi liên tiếp, chưa từng hồi — và lần này
  chạm đáy 0.
- **Bằng chứng headroom = 0 là thật, không phải lỗi probe:**
  probe K8 chạy 2 lần (08:41Z + chạy lại) đều STOP ở i=0,
  errno 28 ENOSPC; kiểm chéo bằng đoạn python tối thiểu trên 3
  thư mục khác nhau (/tmp, $HOME, ~/workspace) đều
  `inotify_add_watch → wd=-1 errno=28` — không phải quirk của
  /tmp; `df` cho thấy /tmp còn trống 512M, /home còn trống 70G
  (không phải hết đĩa). Số watch nhìn thấy trong cell chỉ 14
  (systemd pid 1 giữ 14 wd; tổng wd toàn cell = 14/63747) —
  nghĩa là ~63.733 watch đang bị giữ NGOÀI cell (cùng cơ chế
  đợt 120 đã ghi: "~61k watch giữ ngoài cell, tăng trần cần can
  thiệp host"). Probe đo headroom HIỆU DỤNG từ góc cell: 0.
- **Hệ quả:** vite thường KHÔNG chạy được (thiếu toàn bộ ~1586
  watch cần); vite tạm `watch.ignored` vẫn là đường duy nhất
  (0 inotify). Mọi file-watcher khác trong lượt này (chokidar,
  vite, editor watch) cũng sẽ ENOSPC — các luồng T1–T10 đợt 121
  cần biết: nếu vite dev server của họ ENOSPC thì đó là headroom
  0, không phải lỗi config của họ. Watcher sẽ đo lại headroom ở
  poll 30 + cuối (§5) để xem watch ngoài cell có được nhả không.
- RAM khả dụng lúc đo: **500 MB** (08:40Z) → 868 MB (08:41Z) →
  715 MB (watcher poll 1, 08:46:45Z) → 2254 MB (poll 2,
  08:47:46Z) — dao động mạnh theo luồng khác đang chạy (T8 chạy
  probe Chromium từ 08:42Z). Dù lấy số nào cũng < 6 GB guard —
  birefnet không thử (đứng theo LIMITS gộp). RAM tổng 7934 MB,
  swap 1023 MB (đã dùng 321–324 MB).

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do như đợt 119/120: headroom 0 < 545 của #60? (nơi vite
  thường đã ENOSPC); thử lại vite thường trên #62? chỉ lặp lại
  kết quả đã biết, còn tốn watch (0 có để tốn). Vite tạm
  `watch.ignored` đã được T8 chứng minh 200 + 0 inotify trên #52
  và không có gì thay đổi về cơ chế.

## 5. Watcher đợt 1 — quan sát replay #62? 7 poll rồi BỊ GIẾT THEO REBOOT

- Watcher `t5-wait-replay.sh` (nohup setsid, PID 9480) chạy
  08:45:45Z, dự kiến 60 poll tới ~09:46Z — **chỉ chạy được 7 poll
  thì cell reboot 08:53:05Z, watcher chết theo** (PID 9480 không
  còn; T5 phát hiện lúc 08:54:12Z khi lệnh `sleep 540` chờ cũng
  bị SIGTERM ~08:52Z do runtime restart — cùng mẫu T7 đợt 120
  §5, watcher nohup lẽ ra sống qua runtime restart nhưng KHÔNG
  sống qua reboot cell, vì reboot giết toàn bộ process).
- Kết quả 7 poll (log `t5-wait-replay.log`):
  - poll 1 (08:46:45Z): dpkg=2, apt=yes, wrapper=yes, lists=123,
    RAM 715 MB.
  - poll 2 (08:47:46Z): dpkg=2, apt=yes, wrapper=yes, lists=69,
    RAM 2254 MB.
  - poll 3 (08:48:46Z): dpkg=**457**, apt=yes, wrapper=yes,
    lists=69, RAM 2349 MB; dòng cuối `installed libc-bin:amd64
    2.39-0ubuntu8.9` (08:48:45Z) — installs đã chạy.
  - poll 4 (08:49:46Z): dpkg=**1383**, apt=yes, wrapper=yes,
    RAM 2606 MB; dòng cuối `installed libc-bin:amd64
    2.39-0ubuntu8.12` (08:49:45Z).
  - poll 5 (08:50:46Z): dpkg=1474, apt=yes, wrapper=yes, RAM
    1622 MB; dòng cuối 08:49:59Z (libc-bin 8.12).
  - poll 6 (08:51:46Z): dpkg=1487, apt=yes, wrapper=yes, RAM
    1261 MB; dòng cuối `installed fontconfig:amd64
    2.15.0-1.1ubuntu2` (08:51:14Z).
  - poll 7 (08:52:47Z): dpkg=**1509**, **apt=no**, wrapper=yes,
    RAM 2449 MB; dòng cuối `installed gstreamer1.0-tools:amd64
    1.24.2-1ubuntu0.1` (08:52:06Z) — **replay XONG** (cùng tổng
    1509 dòng + cùng gói cuối như #57?/#61).
- Postboot check-only trong watcher: **0 lần** — poll 10 đầu
  tiên (~08:55:45Z) không bao giờ chạy vì boot đã reboot
  08:53:05Z. Đây là mất mát duy nhất của đợt 1: không kẹp được
  PASS đầu tiên của #62?.
- RAM khả dụng trong 7 poll: 715–2606 MB (dao động theo luồng
  khác) — vẫn < 6 GB guard.
- Bài học vận hành: watcher nohup sống qua runtime restart
  (đã chứng minh đợt 120) nhưng không sống qua reboot cell —
  đó là giới hạn vật lý, không phải lỗi watcher. Mẫu xử lý đã
  có tiền lệ: T10 đợt 120 chạy lại sau reboot #61 (ghi RESTART);
  T5 làm theo: khởi động lại watcher cho boot mới (đợt 2, §13).
  Đề xuất §8.6 (watcher tự khởi động lại theo boot_id) vẫn chờ
  parent quyết — trường hợp này là ví dụ sống cho đề xuất đó.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm (08:41Z) — sạch hoàn toàn trên boot #62 (khác #57? lúc đó
  lock đang được T1 giữ sống). Không có lock sót từ boot cũ.
- Thư mục queue `hidden_files/vite.lock.queue` có **38 file
  cooldown** (tăng từ 34 ở #60? — thêm cooldown của các luồng đợt
  120/121) — đều là cooldown cũ đã hết hạn; file cooldown chỉ
  delay cùng-thread reacquire, không chặn luồng khác, không tính
  là ticket. T5 KHÔNG xóa (không cần; để T4 — chủ mảng lock —
  quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối 07:19:56–07:21:06Z ngày 16/11
  (T3 đợt 120, boot #61 — TICKET/ACQUIRED/RELEASED bình thường);
  **0 hoạt động nào trên boot #62 tới lúc kiểm** (08:41Z) — các
  luồng đợt 121 chưa ai acquire lock (hoặc chưa ghi log). Không có
  entry STALE nào mới.
- T5 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock
  tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Luật replay-chết §8.2 — ĐÁNH GIÁ LẦN ĐẦU (hiệu lực từ đợt 121)

> Quyết parent đợt 120 §12 mục 3: PHÊ DUYỆT luật "replay-chết"
> (§8.2 T7 đợt 120) + vá "phát hiện muộn" §8.4(ii) + chính thức
> hóa cờ POSTBOOT_FAIL (§8.5), hiệu lực từ đợt 121; `--repair`
> code mới vẫn chưa từng chạy sống — lần đầu phải có giám sát.

### 7.1 Đối chiếu 5 điều kiện trên boot #62? (lúc 08:41–08:45Z)

| # | Điều kiện §8.2 | Kết quả trên #62? | Bằng chứng |
|---|---|---|---|
| 1 | Postboot check-only FAIL (kiểm lại ngay trước khi quyết, không dùng kết quả cũ quá 10 phút) | **ĐẠT** | exit 1 lúc 08:41Z (try1b, `SCRIPT_EXIT=1`) + exit 1 lúc 08:44Z (sau sửa script); < 10 phút trước quyết |
| 2 | Replay ĐÃ CHẾT — cả 3 dấu hiệu: (a) 0 process apt-get/dpkg/wrapper; (b) dpkg.log không tăng ≥10' (2 lần đọc cách nhau ≥10'); (c) lock dpkg rảnh | **KHÔNG ĐẠT** | (a) FAIL: apt-get pid 815 + wrapper os-intent pid 794 (+ con 2769/2771) ĐANG CHẠY; (b) FAIL: dpkg.log tăng 2 → 40 dòng từ 08:48Z; (c) không kết luận được: `fuser` non-root không thấy lock của process root (xem §3.1) — nhưng (a) đã đủ bác điều kiện 2 |
| 3 | Ngưỡng chờ: boot ≥60' tuổi HOẶC dpkg im ≥15' | **KHÔNG ĐẠT** | Boot ~15–20' tuổi lúc quyết (< 60'); dpkg im ~5' sau configure 08:35:39Z (< 15') — và sau đó dpkg đã tăng nên (ii) càng không đạt |
| 4 | Dạng lỗi (A) "tới nhưng thiếu GST" HOẶC (B) "chạm mà không cài" | **CHƯA XÁC ĐỊNH** | Replay còn chạy, chưa kết thúc — không thể phân loại khi installs đang diễn ra; nếu replay xong mà vẫn thiếu GST thì mới là (A) |
| 5 | Không có luồng đo WebKit nào đang chạy probe trên boot đó | **ĐẠT** (moot) | 0 process MiniBrowser/WebKit lúc kiểm; chỉ có probe Chromium của T8 đợt 121 (pid 6849, start 08:42Z — Chromium không dùng GST hệ thống, không chặn repair về mặt kỹ thuật); nhưng moot vì điều kiện 2 đã không đạt |

- **Kết luận: 1/5 đạt chắc (đk 1), 1/5 đạt-moot (đk 5), 2/5 không
  đạt (đk 2, 3), 1/5 chưa xác định (đk 4) → KHÔNG đủ 5 điều kiện
  → KHÔNG chạy `--repair`.** T5 chạy watcher 60 phút thay vào
  đó (theo đúng lệnh task: chưa đủ điều kiện thì watcher, không
  tự repair).
- Đây là **lần đầu luật §8.2 được đánh giá sau khi có hiệu lực**
  — kết quả "không kích hoạt" là đúng thiết kế: luật chỉ kích
  hoạt khi replay chết; replay sống (dù khởi động muộn) thì chờ.
  Không có gì phải sửa trong luật sau lần đánh giá này; nếu
  watcher kết thúc mà replay vẫn chưa xong hoặc xong mà thiếu GST
  thì đợt 122 sẽ đánh giá lại 5 điều kiện trên bằng chứng mới.
- **`--repair` code mới (timeout + khóa symlink) VẪN CHƯA TỪNG
  CHẠY SỐNG** — lần chạy đầu tiên vẫn đang chờ một boot đủ 5
  điều kiện (tình huống #58/#60? đã qua nhưng luật chưa có hiệu
  lực lúc đó; #62? thì replay sống nên không đủ điều kiện).
  Ghi rõ để parent khỏi tưởng luật đã được kiểm chứng ở nhánh
  kích hoạt — mới chỉ kiểm chứng ở nhánh "không kích hoạt".

### 7.2 Vá "phát hiện muộn" §8.4(ii) — không cần viện tới lần này

- Boot #62 phát hiện lúc +10' tuổi (lượt mở 08:35Z, T5 bắt đầu
  ~08:40Z) — không muộn như #60? (+55'). Vá (ii) chỉ có ý nghĩa
  khi boot đã >15' tuổi lúc phát hiện; lần này không cần. Nhưng
  vá vẫn có giá trị cho các boot phát hiện muộn sau này (vd boot
  xảy ra giữa các lượt như #60?) — giữ nguyên, không đề xuất bỏ.
- R9 (a) (watcher v2 đầu lượt) vẫn là đường bắt FAIL live sớm;
  xem §9.

### 7.3 Kết quả: luật kích hoạt lần đầu + `--repair` chạy sống lần đầu — PASS

> Cập nhật 09:27Z (sau khi repair xong + kiểm lại độc lập). Chi
> tiết đầy đủ ở §13.6; đây là tóm tắt để đối chiếu với đánh giá
> §7.1.

- **Đánh giá lại 5 điều kiện trên boot #63? (verify sạch lúc
  09:12:22Z, `t5-verify-dead.sh` + `t5-verify-dead.log`): ĐỦ
  5/5.** (1) postboot FAIL tươi exit 1 (09:12:22Z). (2) replay
  chết đủ 3 dấu hiệu: 0 apt-get/dpkg/wrapper (pgrep từ file
  script, không tự-match — xem ghi chú dưới), dpkg.log không
  tăng qua mọi lần đọc 08:55:21Z → 09:12:23Z (>17'), lock rảnh
  (fuser rc=1 cả hai lock, kèm caveat non-root). (3) dpkg im
  1110 giây = 18'30" ≥15' (nhánh (ii); boot mới ~19' tuổi nên
  nhánh (i) không đạt). (4) dạng (B) "chạm mà không cài" (dpkg
  chỉ 2 dòng configure, 0 GST, lists trống). (5) 0 probe WebKit
  đang chạy (ps minibrowser|webkit trống; probe Chromium của T8
  không tính).
- **Lịch sử wrapper #63? (quan sát live, lần đầu):** configure
  08:53:53Z (boot +48s) → reseed dpkg-state.txt ~08:54Z → wrapper
  SỐNG qua watcher poll 1–11 (tới 09:07:48Z) → CHẾT trong khoảng
  (09:07:48Z, 09:08:48Z] (poll 12 wrapper=no) — không bao giờ
  chạy apt-get update hay cài gì. Cùng chế độ lỗi #60? nhưng lần
  này kẹp được cửa sổ chết ~1 phút (quan sát live, không hậu
  kiểm). Nguyên nhân wrapper chết: CHƯA RÕ (không có log trigger
  trong máy — cùng nợ đứng như #60? §3.3).
- **Ghi chú phương pháp (quan trọng):** các lần đọc "wrapper
  RUNNING" lúc 08:55–08:56Z (lệnh exec gõ pattern trực tiếp) là
  **TỰ-MATCH của shell** (pgrep -f match chính cmdline của lệnh
  exec chứa pattern) — ĐÃ LOẠI khỏi bằng chứng. Bằng chứng thật
  là watcher poll (chạy từ file script, cmdline không chứa
  pattern) + `t5-verify-dead.sh` (chạy từ file script). Bài học:
  mọi lệnh `pgrep -f` với pattern dài phải chạy từ file script
  hoặc dùng mẹo bracket mà KHÔNG để chuỗi trần trong cùng lệnh
  (kể cả trong heredoc) — nếu không sẽ đọc nhầm shell của mình
  thành wrapper replay.
- **Cờ REPAIR_TRIGGERED ghi TRƯỚC khi chạy** (09:12–09:14Z, đủ
  5 điều kiện + bằng chứng + caveat thứ tự script).
- **`--repair` chạy 1 lần có giám sát 09:14:14Z → 09:26:57Z
  (~12'43"), exit 0:** symlink GST → debroot (09:14Z, 269 file);
  apt-get update OK; install OK đủ 11 gói; RE-CHECK trong script:
  wrapper PASS, libs PASS, GST PASS, apt PASS. Kiểm lại độc lập
  check-only exit 0 lúc 09:27:19Z. **Đây là lần đầu code
  `--repair` mới (timeout + khóa symlink) chạy sống — và nó PASS
  ngay lần đầu.** Cờ `POSTBOOT_PASS` đã ghi ("PASS nhờ repair").
- **Caveat (ghi rõ, không giấu):** symlink GST được tạo TRƯỚC
  apt install (thứ tự hiện tại của script; phương án A chưa
  duyệt) nên file plugin của apt đã ghi QUA symlink vào debroot
  — số file debroot vẫn 269 (ghi đè cùng tên, tiền lệ #45).
  dpkg ghi nhận 11 gói đã cài; decode mp4/H.264 đủ qua symlink
  (cùng cơ chế O8 21/21 PASS ở #45). Nhưng thư mục plugin hệ
  thống KHÔNG phải thư mục thật — nếu debroot bị xóa/dời thì
  decode gãy dù dpkg vẫn báo đã cài. PASS này phải đọc kèm caveat
  (đã ghi trong cờ POSTBOOT_PASS + §13.6).
- **Luật §8.2 sau lần kích hoạt đầu:** luật hoạt động đúng thiết
  kế (chờ tới khi replay chết thật rồi mới repair; không giết oan
  replay sống như #62?). Không sửa luật sau lần này. Nợ còn lại:
  phương án A (đổi thứ tự apt trước GST) vẫn chờ parent duyệt —
  nếu duyệt thì lần repair sau sẽ chạy theo thứ tự mới; nếu
  không, symlink-trước-apt vẫn là hành vi mặc định của script.

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `d7d643b0454c57dbb85fa5b57a8b1fba` →
  `e549326b0eb06a55abc22dd1c35ea255` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/119/120,
  không đổi logic):
  - Header: thêm đoạn boot #61 (replay nhanh, bracket (0p40,
    5p41], PASS live + O8 WebKit 21/21 — theo LIMITS T4 đợt 120)
    + đoạn boot #62? (replay đang chạy, configure +9p52,
    headroom 0, luật §8.2 không kích hoạt).
  - Dòng `say`: `#60? = 2026-11-16 04:45:49Z, boot_id 0260101b-…`
    → `#62? = 2026-11-16 08:25:47Z, boot_id 9788ce28-…,
    sau #61 06:50:58Z — số tạm, chờ T6 đếm lại mù #37`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự
  `"` (dùng `p` thay dấu phút: `+9p52`, như bài học T7 đợt 120
  §9). `bash -n` OK ngay lần đầu.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn FAIL
  exit 1 (đúng — replay chưa cài xong lúc đó).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair`
  (phương án A, R9 §6.3): việc này cần parent duyệt và T5 không
  nhận được phê duyệt đó trong task — giữ nguyên để parent quyết.
  `--repair` với code mới (timeout + khóa symlink) vẫn CHƯA được
  chạy sống lần nào — **ghi rõ: nếu luật §8 được kích hoạt ở đợt
  sau thì lần chạy --repair đầu tiên sẽ chạy đúng thứ tự hiện tại
  (mục 3 GST symlink trước, mục 4 apt install sau) trừ khi phương
  án A được duyệt kèm**.

## 9. R9 (a) vẫn mở (nhắc lần 7)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc
  đóng đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Boot #62 là ví dụ ngược với #60?: lượt mở lúc boot +10' nên
  FAIL live đã kẹp được mà không cần R9 (a) — nhưng boot xảy ra
  giữa các lượt vẫn có thể lọt (như #60? lúc +55' mới có người
  kiểm). Vá §8.4(ii) đã giảm thiệt hại của trường hợp muộn, nhưng
  không thay thế R9 (a) trong việc bắt FAIL live sớm + kẹp bracket
  đầy đủ.

## 10. Nợ mở sang đợt sau

1. **Watcher đợt 1 (§5) CHỈ CHẠY ĐƯỢC 7/60 poll + watcher đợt 2
   (§13.5) ĐÃ XONG 60/60 poll:** replay #62? xong 08:52:06Z
   (1509 dòng); postboot #63? PASS sau repair xác nhận 4 lần độc
   lập bởi watcher đợt 2 (poll 40/50/60 + cuối) + 1 lần bởi T5;
   headroom cuối 5435; không reboot trong watcher đợt 2.
2. **Luật §8.2: ĐÃ KÍCH HOẠT lần đầu trên #63? + --repair chạy
   sống lần đầu PASS (xem §7.3/§13.6).** Không sửa luật sau lần
   này. Phương án A (đổi thứ tự apt trước GST) vẫn chờ parent
   duyệt — lần repair sau sẽ chạy theo thứ tự mới nếu duyệt.
3. **Headroom hiệu dụng: 0 (#62?) → 5436 (#63?, poll 30).**
   Vite thường chạy được trở lại trên #63?; giữ vite tạm
   `watch.ignored` cho các boot headroom thấp (quyết theo số đo
   từng boot, không theo thói quen). Trần 63747 cần can thiệp
   host (dọn watch ngoài cell / tăng trần) — ngoài tầm luồng này.
4. **Symlink GST → debroot đã được tạo bởi repair trên #63?**
   (09:14Z) — PASS sau repair đọc kèm caveat (thư mục GST là
   symlink, file apt ghi qua symlink vào debroot, số file vẫn
   269; nếu debroot bị xóa/dời thì decode gãy dù dpkg báo đã
   cài). Phương án A/B (R9 §6.3) chờ parent duyệt.
5. **Số thứ tự boot #62?/#63? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (gap #61→#62 1h34'49", #62→#63 27'18"; nếu T6 đếm khác,
   LIMITS này + script postboot-check cần sửa lại số — boot_id +
   btime không đổi).
6. **R9 (a) vẫn chờ user (nhắc lần 7).**
7. **Cooldown file tích lũy (38 file, tăng từ 34)** — chưa có cơ
   chế dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock
   (T4 quyết).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 120 §10: E4 lô
   đo lớn (T2 — load1 vô hiệu, trục mới PSI + threadsR, leg B
   DỪNG chờ định nghĩa tải bằng PSI) + WebKit lượt yên + sửa
   probe writePartial kẹt (T4) + mù #38 + probe #40 (T5/T6) +
   G1 chờ user quyết + mù #22/#28–#31/#35 chờ user quyết;
   birefnet chỉ thử lại khi RAM đổi, u2net là fallback chính
   thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi T5 (không đụng production) — md5
  `5be5a250a552357c50cc189de9a9c08a` khớp baseline lúc mở đợt (kiểm
  sau khi các luồng khác đã chạy ~10 phút; đường dẫn đúng là
  `apps/web/src/preview.tsx`, không phải `src/components/`).
- `media.ts` md5 `2c384ed13703809d5e999311147745e7` khớp baseline,
  không đổi (đường dẫn đúng `apps/web/src/media.ts`).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ
  đọc `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  278–2606 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #62?: FAIL lúc boot ~15' (try1 + try1b exit 1) + FAIL
  lúc boot ~19' (sau sửa script, exit 1).
- Postboot #63?: FAIL lúc boot ~2'39" (try1 exit 1) + FAIL lúc
  boot ~3'24" (sau sửa script lần 2, exit 1) + FAIL lúc boot
  ~13'42" (watcher poll 10, exit 1) + FAIL verify lúc ~19'18"
  (exit 1) → **PASS sau repair: exit 0 lúc boot ~34'14"
  (09:27:19Z, kiểm độc lập) + exit 0 trong RE-CHECK của script
  repair (09:26:57Z)**.
- Watcher đợt 1: 7/60 poll rồi chết theo reboot (replay #62?
  xong 08:52:06Z, 1509 dòng; 0 lần postboot poll — §5).
- Watcher đợt 2: ĐÃ XONG 60/60 poll cho boot #63? (08:56:45Z →
  09:56:56Z; wrapper chết live poll 12 + repair live poll 27–30;
  postboot poll 10/20/30 exit 1, poll 40/50/60 + cuối exit 0;
  headroom poll 30 = 5436, cuối = 5435 — §13.5).
- Replay #62?: chạy xong — configure +9'52", update ~12',
  installs ~5', xong +26'19" (dpkg 2 → 1509 dòng tới 08:52:06Z).
- Replay #63?: CHẾT dạng (B) — configure +48s, wrapper chết
  (09:07:48Z, 09:08:48Z], không bao giờ chạy apt-get update
  (xem §7.3/§13.3/§13.5).
- **Repair: CHẠY 1 LẦN CÓ GIÁM SÁT, PASS** — 09:14:14Z →
  09:26:57Z (~12'43"), exit 0, đủ 11 gói + symlink GST (xem
  §7.3/§13.6). Lần đầu code --repair mới chạy sống.
- Headroom: 0 trên #62? (thấp nhất từng đo) → **5435–5436 trên
  #63? (poll 30 + cuối)** — hồi sau reboot, xác nhận 2 lần cách
  nhau 30 phút; vite thường chạy được trở lại.
- Stale vite.lock: không có (lock dir không tồn tại; queue chỉ còn
  cooldown cũ, v2 log không STALE mới).
- Reboot mới: CÓ — boot #62? reboot 08:53:05Z thành boot #63?
  (gap 27'18") giữa watcher đợt 1; T5 khởi động lại watcher cho
  boot mới (đợt 2). Không reboot nào khác trong lúc T5 làm (boot
  vẫn 725453a2 tới 09:57:51Z, cuối lượt).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND121_T5_INFRA_LIMITS.md` (file này — mới;
  **49.190 byte — VƯỢT ngưỡng 37.768 byte của push-files, lúc
  push cần `ENABLE_PRIVSEP=0`**).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  tham chiếu #61/#62?/#63? trong header + dòng `say`; md5
  `d7d643b0…` → `e549326b…` → `4d7c07be…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round121-t5/` (log
  watcher đợt 1 + đợt 2, log postboot try1/try1b/after-edit +
  poll + verify + after-repair (b62/b63), log headroom
  now/retry/xcheck/poll30/final, md5 trước/sau của postboot-check
  (2 lần sửa), `POSTBOOT_FAIL_b62` +
  `POSTBOOT_FAIL_b63-prerepair` (lưu trữ), `POSTBOOT_PASS` (cờ hiện
  tại — "PASS nhờ repair"; file POSTBOOT_FAIL đã gỡ sau khi lưu
  trữ để đúng 1 cờ tại 1 thời điểm theo §8.5),
  `REPAIR_TRIGGERED`, `t5-repair-b63.log`,
  `t5-verify-dead.sh` + `t5-verify-dead.log`,
  `t5-wrapper-investigation.md`, `t5-initial-state.md`,
  `t5-newboot-state.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round121-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 87 byte, 0 binary
  (xem `t5-stage-verify.log`).
- Cờ done: `hidden_files/round121-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

## 13. Boot #63? — reboot giữa chừng (08:53:05Z) + watcher đợt 2

### 13.1 Reboot #62? → #63? (phát hiện 08:54:12Z)

- Boot #62? chỉ sống 27'18" (08:25:47Z → 08:53:05Z) rồi reboot —
  nhịp reboot nhanh trở lại sau gap #61→#62 dài 1h34'49" (so
  sánh: gap #59→#60? 2h58'00", #60?→#61 2h05'09", #61→#62
  1h34'49"). Reboot xảy ra ngay sau khi replay #62? xong
  (08:52:06Z) + wrapper đang closing pass — thời điểm reboot
  (~08:53:05Z) trùng với lúc T5 đang chờ `sleep 540` (bị SIGTERM
  ~08:52Z do runtime restart, xem §5).
- Boot #63?: btime 2026-11-16 08:53:05Z (uptime -s; btime kernel
  1794819185; `/proc/uptime` 135,86 s lúc 08:55:21Z → boot
  ~08:53:05Z; journal first entry 08:53:20Z, chênh +15 s; `stat`
  btime của `/` 08:53:17Z — 5 nguồn đồng ý trong ~15 s),
  boot_id `725453a2-c8cb-44ba-a6f3-7222d0b2d00b`, sau #62?
  08:25:47Z (gap 27'18"). Số thứ tự CHƯA CHẮC (chờ T6 đếm lại
  mù #37). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 08:53Z — log #62? đã mất cùng
  rootfs rebuild (cùng cơ chế mất log như mọi boot trước; bằng
  chứng #62? chỉ còn trong log watcher + LIMITS này).

### 13.2 Postboot #63? — FAIL lúc +2'39" (check-only, replay mới bắt đầu)

- Lần kiểm try1: 08:55:44Z (boot ~2'39" tuổi), script bản T5
  (md5 `e549326b…`, tham chiếu #62?), exit 1
  (`t5-postboot-b63-try1.log`): wrapper PASS (K1); libs thiếu 5;
  GST thư mục không tồn tại, isomp4/libav thiếu, file hệ thống 0
  (debroot 269); apt thiếu 11 gói — y hệt FAIL của #62? lúc +15'
  (đúng kỳ vọng: replay mới bắt đầu, chưa cài gì).
- Lần kiểm sau khi sửa script lần 2 (§13.4): 08:56:29Z (boot
  ~3'24'), exit 1 (`t5-postboot-b63-after-edit.log`) — FAIL y hệt.
- Cờ `POSTBOOT_FAIL` đã viết lại cho boot #63? (cờ cũ của #62?
  lưu trữ thành `POSTBOOT_FAIL_b62` — không ghi đè mất bằng
  chứng #62?). Nội dung cờ ghi rõ replay mới bắt đầu + apt-get
  update chưa thấy chạy lúc +2'39".

### 13.3 Replay boot #63? — bắt đầu NHANH, đang theo dõi

- dpkg.log: 2 dòng `2026-11-16 08:53:53 startup packages
  configure` (boot +48") — khởi động NHANH, ngang lớp #48
  (+40s) / #61 (+40") / #58 (+53"), nhanh hơn hẳn #62? (+9'52").
- Wrapper os-intent (pid 3668/3673) đang chạy từ 08:53Z; NHƯNG
  `apt-get update` CHƯA thấy chạy lúc +2'39" (08:55:44Z) và cả
  lúc +3'24" (08:56:29Z) — khác #62? (update chạy ngay cùng phút
  với configure). Có thể wrapper đang ở bước reseed/dpkg-state
  trước khi update, hoặc update khởi động chậm. Watcher đợt 2 sẽ
  ghi lại lúc apt-get xuất hiện lần đầu — nếu quá ~10' mà update
  vẫn chưa chạy thì đó là dấu hiệu bất thường mới (ghi nhận để
  đợt sau theo dõi, không kết luận vội).
- `/var/log/apt` KHÔNG TỒN TẠI; `/var/lib/apt/lists` chỉ
  auxfiles/lock/partial (1 file lúc 08:55:21Z).
- RAM khả dụng lúc kiểm #63?: 2318 MB (08:55Z) — cao hơn các số
  đo trên #62? (500–2606 MB), vẫn < 6 GB guard; birefnet không thử.
- Luật §8.2 trên #63?: KHÔNG kích hoạt — điều kiện 2(a) không
  đạt (wrapper đang chạy), điều kiện 3 chưa đạt (boot ~2–3'
  tuổi). KHÔNG chạy `--repair`.

### 13.4 Sửa `postboot-check.sh` lần 2 (cho boot #63?)

- md5 trước/sau lần 2: `e549326b0eb06a55abc22dd1c35ea255` →
  `4d7c07bec5e1af978760a60cbc67a273` (ghi trong
  `postboot-check.md5.before2` / `postboot-check.md5.after2`).
- Header: bổ sung kết quả #62? (replay xong 1509 dòng, reboot
  trước khi kiểm PASS) + đoạn boot #63? (bắt đầu nhanh +48s,
  watcher đợt 2). Dòng `say`: `#62? = 2026-11-16 08:25:47Z…` →
  `#63? = 2026-11-16 08:53:05Z, boot_id 725453a2-…, sau #62?
  08:25:47Z — số tạm, chờ T6 đếm lại mù #37`. Không chứa ký tự
  `"` (dùng `p`/`s` thay dấu phút/giây). `bash -n` OK; kiểm
  chỉ-đọc sau sửa vẫn FAIL exit 1 như kỳ vọng.
- Không đổi logic, không đổi thứ tự mục apt/GST (phương án A vẫn
  chờ parent duyệt).

### 13.5 Watcher đợt 2 — ĐÃ XONG 60/60 poll (08:56:45Z → 09:56:56Z)

- Watcher `t5-wait-replay-b63.sh` (nohup setsid, PID 4663) chạy
  trọn 60 poll, không reboot giữa chừng (boot vẫn 725453a2 từ
  đầu tới cuối). Log `t5-wait-replay-b63.log` (67 dòng: 60 poll +
  6 lần postboot + start/end).
- Poll 1–11 (08:57:45Z–09:07:48Z): dpkg=2, apt=no, wrapper=yes
  (lists=1; RAM 715–2606 MB) — wrapper sống nhưng không chạy apt
  lần nào. Poll 10 postboot exit=1 (09:06:47Z).
- Poll 12 (09:08:48Z): wrapper=no — WRAPPER CHẾT (cửa sổ chết
  (09:07:48Z, 09:08:48Z]); poll 13 cũng wrapper=no. Lần đầu quan
  sát được wrapper chết LIVE (kẹp cửa sổ ~1 phút).
- Poll 14–26: dpkg=2, apt=no, wrapper=no — replay chết hẳn, dpkg
  im từ 08:53:53Z. Poll 20 postboot exit=1 (09:16:52Z — trong lúc
  repair update, chưa xong).
- Poll 27–29 (09:23:49Z–09:25:50Z): apt=yes (apt-get của REPAIR
  đang chạy — wrapper vẫn no), dpkg vẫn 2 dòng (install chưa ghi
  dpkg.log), lists 131 → 73 (update đã về).
- Poll 30 (09:26:50Z): dpkg=272, apt=yes, wrapper=no; dòng cuối
  `status unpacked libopenexr-3-1-30` (09:26:50Z) — installs của
  REPAIR đang chạy; postboot poll 30 exit=1 (đúng — cài chưa xong
  lúc đó). Headroom poll 30: STOP ở i=5436.
- Poll 31 (09:27:52Z): dpkg đã 759 (repair xong 09:26:57Z),
  apt=no, wrapper=no. Poll 31–60: dpkg ổn định 759 dòng (2 dòng
  replay + 757 dòng repair), apt=no, wrapper=no, lists=73.
- Poll 40 (09:36:52Z): postboot exit=0 — PASS đầu tiên sau
  repair (độc lập với RE-CHECK trong script repair). Poll 50
  (09:46:53Z): exit=0. Poll 60 (09:56:54Z): exit=0. Final
  postboot (09:56:55Z): exit=0. → PASS sau repair được xác nhận
  4 lần độc lập bởi watcher (poll 40/50/60 + cuối) + 1 lần bởi
  T5 (09:27:19Z) + RE-CHECK trong script repair.
- RAM khả dụng trong watcher: 278–2606 MB (thấp nhất 278 MB poll
  56 — các luồng khác đang chạy; vẫn >0, không OOM; cuối 931 MB).
- Headroom cuối: STOP ở i=5435 (09:56:56Z) — ổn định so với poll
  30 (5436): headroom hồi 0 → ~5435–5436 sau reboot #63? được
  xác nhận ở 2 lần đo cách nhau 30 phút.
- Không reboot mới trong lúc watcher đợt 2 chạy (boot vẫn
  725453a2 tới 09:57:51Z).

### 13.6 --repair chạy sống lần đầu: PASS (09:14:14Z → 09:26:57Z)

- Cờ REPAIR_TRIGGERED ghi trước (09:12–09:14Z). Lệnh chạy 1 lần
  có giám sát: `bash vcut-webkit-postboot-check.sh --repair`,
  log `t5-repair-b63.log` + `/tmp/l8-postboot-apt.log` (đánh dấu
  đầu run trong apt log).
- Diễn biến (theo log repair): wrapper PASS sẵn (K1, không cần
  vá); GST symlink → debroot tạo 09:14Z (269 file); apt FAIL 11
  gói → update OK → install OK đủ 11 gói; RE-CHECK: wrapper
  PASS, libs PASS, GST PASS, apt PASS. SCRIPT_EXIT=0, "KET LUAN:
  DU DIEU KIEN chay WebKit". Tổng thời gian ~12'43" (update +
  install gộp — tương đương update ~12' của #62?).
- Kiểm lại độc lập check-only ngay sau repair (09:27:19Z):
  exit 0, đủ 4 cửa (wrapper/libs/GST/apt PASS). Cờ POSTBOOT_PASS
  đã ghi ("PASS nhờ repair"); cờ FAIL trước repair lưu trữ
  `POSTBOOT_FAIL_b63-prerepair`.
- Caveat symlink (xem §7.3 + cờ POSTBOOT_PASS): file apt ghi qua
  symlink vào debroot (số file debroot vẫn 269 — ghi đè cùng
  tên); thư mục GST hệ thống là symlink, không phải thư mục thật.
- dpkg.log sau repair: 759 dòng (2 dòng replay + 757 dòng apt
  repair 09:14–09:26Z). Người đọc bracket sau này phải phân biệt
  dòng replay (≤08:53:53Z) với dòng repair (≥09:14Z).
- Headroom: 5436 lúc poll 30 (09:26:50Z) — HỒI từ 0. Vite thường
  (~1586 watch) chạy được trở lại trên #63?; các luồng T1–T10
  đợt 121 cần biết: ENOSPC lúc đầu lượt là do headroom 0 trên
  #62?, nay đã hồi sau reboot #63? (nguyên nhân hồi: chưa rõ —
  có thể reboot reset accounting ngoài cell, hoặc tenant khác
  nhả watch; ghi nhận là quan sát, không kết luận nhân quả).
  Đo lại ở cuối watcher (§13.5).
- RAM quanh repair: 878–1465 MB (poll 27–30) — < 6 GB guard.
