# PHASE9_ROUND120_T7_INFRA_LIMITS — Hạ tầng boot #60?: replay CHẠM MÀ KHÔNG CÀI (dpkg 2 dòng, 0/9 GST), postboot FAIL, headroom 545 + ĐỀ XUẤT LUẬT XỬ LÝ chế độ "replay tới nhưng thiếu GST"

> Luồng T7, đợt 120, lượt cron 12:35 +07 16/11/2026 (bắt đầu ~05:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 119 §10 (8 mục) + quyết parent §12 mục 5 (đề xuất luật
> xử lý chế độ "replay tới nhưng thiếu GST" — nhiệm vụ chính của luồng
> này); tiếp nối T7 đợt 119 + T4 đợt 119 (chế độ lỗi mới #58/#59).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair`, KHÔNG tự cài package. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Boot hiện tại là #60? (SỐ TẠM)** — boot 2026-11-16 04:45:49Z
   (btime kernel 1794804349 / `uptime -s`; journal first entry
   04:46:00Z, chênh +11 s; `/proc/uptime` 3315,69 s lúc 05:41:05Z →
   suy ra boot ~04:45:50Z, chênh 1 s — 4 nguồn đồng ý; `stat` btime
   của `/` KHÔNG dùng được trên boot này: trả về epoch 1970),
   boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d`, sau #59 01:47:49Z
   (gap 2h58'00"). Số thứ tự CHƯA CHẮC (chờ T6 đợt 120 đếm lại mù
   #37); trong file này gọi tạm "#60?" và luôn kèm boot_id + btime.
   `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại); `last -x`
   chỉ còn 1 dòng reboot 04:46Z — log các boot trước đã mất cùng
   rootfs rebuild (cùng cơ chế mất log như mọi boot trước).
2. **CHẾ ĐỘ LỖI MỚI, NẶNG HƠN #58: replay CHẠM MÀ KHÔNG CÀI.**
   dpkg.log CHỈ CÓ 2 dòng, cả hai đều `2026-11-16 05:35:40 startup
   packages configure` (boot +49'51") — 0 entry nào trước đó, 0
   entry nào sau đó (kiểm 05:41Z, 05:42Z, 05:45Z + watcher poll
   mỗi phút, xem §3 + §5). 0 tiến trình apt/dpkg/os-intent nào
   đang chạy; lock dpkg rảnh. `/var/log/apt` KHÔNG TỒN TẠI;
   `/var/lib/apt/lists` TRỐNG (chỉ auxfiles/lock/partial — apt-get
   update chưa từng chạy trong boot này). 0/9 gói GST; thư mục GST
   không tồn tại; 0 package gstreamer nào trong dpkg.
   Khác #58 (replay kết thúc sau 350 dòng mà thiếu GST) và khác
   #53 (không tới hẳn trong 65+ phút): ở #60 replay đã chạm tới
   (dpkg configure chạy) rồi CHẾT/IM trước khi cài bất cứ gì.
3. **Postboot #60?: FAIL** — check-only exit 1 lúc boot ~55'
   (05:41Z, T7 try1) + exit 1 lúc boot ~60' (05:46Z, sau khi sửa
   script) + T3 đợt 120 kiểm độc lập exit 1 lúc ~05:44Z (cùng kết
   quả y hệt). Thiếu 5 lib + GST isomp4/libav + 10 gói apt. Cờ
   `POSTBOOT_FAIL` đã ghi cho các luồng khác dùng (T4/T3 đang
   gate-wait). Xem §2.
4. **Watcher T7 quan sát 60 phút (05:45Z → 06:45Z): REPLAY KHÔNG
   QUAY LẠI — chết hẳn.** 60/60 poll dpkg_lines=2, apt_running=no;
   postboot FAIL exit=1 ở cả 6 lần poll (10/20/30/40/50/60) + lần
   cuối 06:45:09Z; dpkg.log im 1h09'29" liên tục từ lần chạm duy
   nhất (05:35:40Z); boot ~119' tuổi lúc watcher kết. Nếu luật §8
   được duyệt thì boot #60? đã đủ điều kiện chạy --repair từ
   ~05:51Z — nhưng T7 KHÔNG chạy vì luật chưa duyệt. Xem §5.
5. **Headroom inotify boot #60?: 545 — tiếp tục rơi, reboot KHÔNG
   hồi (lần 5 liên tiếp có số đo boot-mới chứng minh hướng rơi).**
   Rơi từ 670 (#57?) → 545 (−125). Vite thường cần ~1586 watch
   nên vẫn thiếu ~1041 — vite tạm `watch.ignored` vẫn bắt buộc.
   Xem §4.
6. **Chính sách repair 15 phút: KHÔNG THỂ KÍCH HOẠT ĐÚNG HẠN trên
   boot này — và đó chính là lỗ hổng của policy.** Policy duyệt
   đợt 117: boot mới mà replay không tới trong ~15 phút thì chạy
   `--repair`. Ở #60, tới boot +15' (05:00:49Z) vẫn 0 hoạt động
   apt — điều kiện kích hoạt ĐÃ ĐỦ từ lúc đó — nhưng KHÔNG CÓ
   luồng infra nào đang chạy trong khoảng đó (lượt cron mở
   05:35Z, T7 bắt đầu ~05:40Z, boot đã 55' tuổi). Policy chỉ hành
   động được khi có thread live trong 15 phút đầu của boot; boot
   xảy ra giữa các lượt thì policy ngủ qua hạn. Xem §7 + đề xuất
   luật mới §8 (đây là nhiệm vụ chính của luồng, quyết parent).
7. **ĐỀ XUẤT LUẬT XỬ LÝ chế độ "replay tới nhưng thiếu GST" — xem
   §8 đầy đủ (điều kiện kích hoạt, phạm vi, rủi ro, ai quyết).**
   Tóm tắt: khi postboot FAIL + replay ĐÃ CHẾT (không process apt/
   dpkg/replay + dpkg.log im ≥10 phút sau hoạt động cuối + lock
   rảnh) + boot đã qua ngưỡng chờ (≥60' tuổi HOẶC dpkg im ≥15')
   thì ĐƯỢC PHÉP chạy `postboot-check.sh --repair` có kiểm soát
   (apt-get update trước rồi install 10 gói còn thiếu; symlink GST
   → debroot chỉ làm fallback khi apt thất bại) — NHƯNG chỉ sau
   khi parent duyệt luật này, vì `--repair` với code mới (timeout +
   khóa symlink) CHƯA TỪNG chạy sống lần nào. T7 KHÔNG tự chạy
   trong lượt này.
8. **Cập nhật `postboot-check.sh` (md5 `804be792…` → `d7d643b0…`):**
   chỉ đổi tham chiếu boot (thêm #58/#59/#60? trong header + dòng
   `say`); `bash -n` OK + chạy kiểm chỉ-đọc lại vẫn FAIL exit 1
   như kỳ vọng. Lưu ý: lần sửa đầu đã làm vỡ cú pháp vì ký tự `"`
   trong chuỗi say — đã sửa ngay, ghi lại ở §9 để khỏi lặp.
   KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair`
   (phương án A vẫn chờ parent duyệt).
9. **Stale vite.lock: KHÔNG có lock sót.** Thư mục lock v2 KHÔNG
   TỒN TẠI trên boot #60 (sạch); queue 34 file cooldown (tăng từ
   30 ở #57? — đều cũ, vô hại; T7 không xóa); v2 log không có
   hoạt động nào trên boot #60 tới lúc kiểm (hoạt động cuối
   02:15:33Z, T10 đợt 119, boot C). Xem §6.
10. **R9 (a) vẫn mở (nhắc lần 6):** cron chạy watcher v2 ở đầu mỗi
    lượt với `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt 117
    §13 Quyết 9 (thay đổi thân cron, cần user đồng ý); T7 KHÔNG
    tự đổi thân cron. Xem §10.1.
11. **Không reboot mới trong lúc T7 làm** — boot vẫn 0260101b từ
    đầu tới cuối lượt (kiểm lại 06:45Z, boot ~119' tuổi).

## 2. Postboot #60? — FAIL (check-only, không --repair)

- Boot #60?: 2026-11-16 04:45:49Z (btime kernel 1794804349;
  `uptime -s` đồng ý; journal first entry 04:46:00Z; `/proc/uptime`
  3315,69 s lúc 05:41:05Z → boot ~04:45:50Z, chênh 1 s — 4 nguồn
  đồng ý trong ~11 s, KHÔNG có dấu hiệu giây nháy như #54).
  `stat` btime của `/` trả về `1970-01-01 00:00:00` trên boot này
  (overlay/tmpfs — KHÔNG dùng được; ghi nhận để các luồng sau
  khỏi lấy nhầm mốc epoch). boot_id
  `0260101b-acd3-43f4-91d2-670c1960fb7d`, sau #59 01:47:49Z (gap
  2h58'00"). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 04:46Z (wtmp begins 04:46:00Z).
- Lần kiểm T7 try1: 05:41Z (boot ~55' tuổi), script bản T7 đợt 119
  (md5 `804be792…`), exit 1. Log: `t7-postboot-b60-try1.log`.
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - FAIL libs: thiếu: libevent-2.1.so.7 libEGL.so.1 libavif.so.16
    libdw.so.1 libevdev.so.2 (lưu ý: `ldconfig -p` thấy *một*
    libevent nào đó — nhưng file `libevent-2.1.so.7` cụ thể mà
    script kiểm tra thì THIẾU; lấy kết quả script làm chuẩn).
  - FAIL GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn
    tại; file plugin hệ thống = 0 (debroot vẫn 269).
  - FAIL GST: thiếu isomp4=1 libav=1.
  - FAIL apt: chưa cài: libevent-2.1-7t64
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good
    gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
    gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16
    libgstreamer1.0-0 libevdev2 (10 gói).
  - KẾT LUẬN: CHƯA ĐỦ — chạy lại với --repair, hoặc chờ apt
    replay xong rồi chạy lại.
- Lần kiểm sau khi sửa script (§9): 05:46Z (boot ~60'), exit 1
  (`t7-postboot-b60-after-edit.log`) — nội dung FAIL y hệt, chỉ
  khác dòng `say` đã cập nhật boot #60?.
- **Kiểm độc lập bởi T3 đợt 120** (~05:44Z,
  `round120-t3/t3-postboot-b60-try1.log`): exit 1 FAIL, nội dung
  y hệt (thiếu 5 lib, GST 0 file, thư mục plugin không tồn tại,
  0 tiến trình apt, dpkg.log chỉ 2 dòng 05:35:40Z). Hai luồng độc
  lập đồng ý — FAIL là chắc chắn, không phải lỗi đo của T7.
  T3 ghi "cổng môi trường CHƯA MỞ" và chạy gate-waiter detached
  poll 10 phút/lần tới 07:30Z (xem `round120-t3/t3-progress.md`).
- **`--repair` KHÔNG chạy: không được phép tự chạy.** Đối chiếu
  chính sách repair 15 phút (đợt 117 §13 Quyết 9): điều kiện kích
  hoạt ("replay không tới trong ~15 phút") ĐÃ ĐỦ từ boot +15'
  (05:00:49Z — 0 hoạt động apt tới thời điểm đó), nhưng T7 chỉ
  bắt đầu lúc boot ~55' tuổi nên không thể kích hoạt đúng hạn;
  và chế độ lỗi mới này (replay đã chạm 1 lần lúc +49'51" rồi
  chết) không nằm trong chữ của policy cũ — policy cũ viết cho
  chế độ "replay không tới hẳn" (#45/#53). T7 KHÔNG suy diễn mở
  rộng policy để tự chạy `--repair`; luật mới chỉ đề xuất ở §8,
  chờ parent quyết. Đây là điểm khác biệt cốt lõi với đợt 119
  (ở #57? policy "không kích hoạt" vì replay tới trong hạn;
  ở #60 policy "không thể kích hoạt đúng hạn" vì boot xảy ra
  giữa các lượt + chế độ lỗi nằm ngoài chữ policy).
- Kết quả ghi vào `hidden_files/round120-t7/POSTBOOT_FAIL` lúc
  05:46Z (boot_id + thời gian FAIL + dpkg state + headroom) cho
  luồng khác dùng (T4/T3 đang gate-wait; T4 đợt 119 đã phải thích
  ứng vì T7 DONE sớm — lần này T7 ghi cờ FAIL rõ ràng ngay từ
  đầu để gate0-wait không phải đoán từ sự vắng mặt của
  POSTBOOT_PASS; xem đề xuất formalize cờ FAIL ở §8.5).

## 3. Replay boot #60? — CHẠM MÀ KHÔNG CÀI (bằng chứng)

### 3.1 Bằng chứng tại thời điểm T7 kiểm đầu (05:41–05:45Z, boot ~55–60')

- `/var/log/dpkg.log`: **chỉ 2 dòng, cả hai cùng giây**
  `2026-11-16 05:35:40 startup packages configure` (boot +49'51");
  file mtime 05:35; 0 entry nào trước 05:35:40 (kiểm bằng head —
  log bắt đầu đúng 05:35:40), 0 entry nào sau 05:35:40 tới lúc
  kiểm lại (05:42Z, 05:45Z, watcher poll mỗi phút — xem §5).
  So sánh: #57? có 1509 dòng trong 5'29"; #58 có 350 dòng trong
  ~29'; #60 có 2 dòng trong 0 giây.
- **0 tiến trình apt/dpkg/os-intent** lúc 05:41Z, 05:42Z, 05:45Z
  (`ps aux | grep apt|dpkg|os-intent|replay` — trống; `pgrep -x
  apt-get/dpkg` trống; `pgrep -f HATCH_OS_INTENT_SEED_BASELINE`
  trống; `pgrep -f 'os-intent replay'` trống). Tiến trình duy
  nhất đáng chú ý: `hatch daemon` (RSS ~347 MB) +
  `hatch-execd` (pid 856, start 05:35 — cùng phút với dpkg
  configure; đây là daemon thi hành lệnh của agent, KHÔNG phải
  replay — ghi nhận trùng thời gian, không kết luận nhân quả).
- `/var/log/apt`: **KHÔNG TỒN TẠI** (thư mục chưa từng được tạo
  trong boot này — `ls: cannot access '/var/log/apt'`). Không có
  `history.log`, không có `term.log` để đối chiếu.
- `/var/lib/apt/lists/`: TRỐNG — chỉ `auxfiles/`, `lock`,
  `partial/` (0 file lists); mtime thư mục 05:35:41 (cùng phút
  với dpkg configure). apt-get update CHƯA TỪNG chạy trong boot
  này (trên #57?, update xong quanh boot +2'42", 39 file lists).
- Lock dpkg rảnh: `/var/lib/dpkg/lock`,
  `/var/lib/dpkg/lock-frontend`, `/var/lib/apt/lists/lock` đều
  size 0, mtime 05:35; `fuser` không thấy ai giữ.
- GST: thư mục plugin không tồn tại; `dpkg -l | grep -i
  gstreamer` — 0 package; 9 gói GST kiểm từng gói đều MISSING;
  `grep -c` 9 gói trong dpkg.log = 0.
- Libs: chỉ libevent có mặt theo `ldconfig -p` (nhưng thiếu file
  `.so.7` cụ thể); libEGL/libavif/libdw/libevdev MISSING.

### 3.2 So sánh với #54 — KHÔNG phải "muộn như #54"

- #54: hoạt động apt đầu tiên boot +47'14" (dpkg configure),
  cài xong toàn bộ boot +52'30" — từ configure tới xong chỉ
  5'16". #60: configure lúc +49'51" (cùng dải muộn như #54),
  nhưng tới +60' (hơn 10 phút sau configure) vẫn 0 dòng cài đặt
  mới, 0 apt đang chạy. Nếu #60 đi theo mẫu #54 thì lúc +55'
  đã phải xong (hoặc ít nhất đang cài giữa chừng với apt đang
  chạy + dpkg.log tăng). Không có dấu hiệu nào trong hai hướng
  đó → **giai đoạn cài đặt chưa bao giờ bắt đầu**, không phải
  "đang cài chậm".
- Chuỗi thời gian khởi động replay: #48 +40s → #52 +6'28" →
  #47 +22.6' → #53 không tới (65+') → #54 +47'14" → #57? +2'05"
  → #58 +0'53" → **#60 +49'51" (chỉ configure, không cài)**.
  Độ trễ khởi động tiếp tục dao động mạnh, không theo hướng xấu
  dần; nhưng #60 bổ sung một chiều mới: khởi động MUỘN + CHẾT
  SAU BƯỚC ĐẦU (trước đây muộn vẫn cài xong, vd #54).

### 3.3 Giả thuyết (chưa chứng minh được — không có log trigger)

- (a) Wrapper replay chết sau bước `dpkg --configure -a` đầu
  tiên (crash/timeout/bị giết) trước khi tới `apt-get update` +
  install. Ủng hộ: configure là bước đầu tiên trong ledger của
  #57? (apt history đầu tiên cũng là `dpkg --configure -a`);
  sau bước đó không còn process/log nào.
- (b) Ledger replay bị cắt/trống sau bước configure (receipt
  withheld? — cùng câu hỏi T4 đặt cho #58: replay kết thúc sau
  350 dòng mà không tới 9 gói GST).
- (c) Dòng configure lúc 05:35:40 KHÔNG phải replay mà do một
  tác nhân khác (vd hatch-execd start cùng phút) — không loại
  trừ được, nhưng cũng không có bằng chứng ủng hộ: không có
  process nào khác chạy dpkg lúc đó trong log còn lại.
- Không có log trigger/os-intent trong máy để phân biệt (a)/(b)/
  (c): journal chỉ còn boot hiện tại và không có entry nào về
  replay/apt/dpkg; `/var/log/apt` không tồn tại. Ghi nhận là
  **nguyên nhân khâu khởi động replay vẫn chưa rõ** (nợ đứng từ
  các đợt trước).

### 3.4 Bảng chế độ lỗi replay (cập nhật tới #60?)

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
| **#60?** | **Chạm mà không cài** — 2 dòng configure lúc +49'51", rồi im; 0/9 GST | dpkg.log + FAIL (T7 + T3 độc lập) |

## 4. Headroom inotify + vite (boot #60?)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T8, 08:40Z (boot #52, ~11' tuổi) | 948 | boot MỚI — trước thử vite |
| T8, 09:02Z (boot #52, ~33' tuổi) | 925 | sau thử vite |
| T7, 11:41Z (boot #54, ~53' tuổi) | 804 | boot MỚI — sau replay + postboot PASS |
| T7, 23:44Z (boot #57?, ~10'43" tuổi) | 670 | boot MỚI — sau replay + postboot PASS |
| **T7, 05:44Z (boot #60?, ~58' tuổi)** | **545** | **boot MỚI — sau postboot FAIL** |

- Xu hướng #42→#60?: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 →
  1298 → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot
  #47 mới) → 1073 → 969 → 961 (boot #48) → 948 → 934 → 925 (boot
  #52) → 804 (boot #54) → 670 (boot #57?) → **545 (boot #60?)**.
  Rơi liên tiếp, chưa từng hồi.
- **Kết luận: reboot KHÔNG hồi headroom — lần 5 liên tiếp có số đo
  boot-mới chứng minh hướng rơi.** Lần này đo lúc boot ~58' tuổi
  (muộn hơn #57? lúc ~10'43"), các luồng T1–T10 đợt 120 đã chạy
  ~10 phút — có nhiễu giữ watch từ luồng khác — nhưng biên độ rơi
  −125 so với #57? vẫn cùng hướng và cùng độ lớn với các lần rơi
  trước (−134 ở #57?). Nếu reboot có hồi headroom thì số đo phải
  NHẢY LÊN gần mức đầu boot (~1300–1500), không thể rơi tiếp
  xuống 545.
- Vite thường cần ~1586 watch → trên boot #60? vẫn thiếu ~1041 —
  vite thường KHÔNG chạy được; vite tạm `watch.ignored` vẫn là
  đường duy nhất (không thử lại vite trong lượt này — T8 đã chứng
  minh cả hai trên #52, và headroom #60? còn thấp hơn; thử lại
  không thêm thông tin mới).
- RAM khả dụng lúc đo: **1315 MB** (dao động 728–1477 MB trong
  lượt theo luồng khác đang chạy — đo 05:41Z: 728 MB; 05:42Z:
  1477 MB; 05:44Z: 1315 MB) — vẫn < 6 GB, birefnet không thử
  (đứng theo LIMITS gộp).
- Log: `t7-headroom-b60-now.log` (probe STOP ở i=545, errno 28
  ENOSPC).

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do như đợt 119: headroom 545 < 670 của #57? (nơi vite thường
  đã ENOSPC); thử lại vite thường trên #60? chỉ lặp lại kết quả
  đã biết. Vite tạm `watch.ignored` đã được T8 chứng minh 200 +
  0 inotify trên #52 và không có gì thay đổi về cơ chế.

## 5. Watcher — quan sát replay boot #60? 60 phút: REPLAY KHÔNG QUAY LẠI (chết hẳn)

- Watcher `t7-wait-replay.sh` chạy 05:45:04Z → 06:45:09Z (60 poll,
  mỗi phút 1 poll; postboot check-only mỗi 10 poll). Kết quả:
  **60/60 poll: dpkg_lines=2, apt_running=no** — dpkg.log KHÔNG
  tăng 1 dòng nào trong suốt 60 phút; 0 tiến trình apt/dpkg/
  os-intent nào xuất hiện lúc nào. Postboot check-only:
  **exit=1 ở cả 6 lần poll (10/20/30/40/50/60) + lần cuối
  06:45:09Z** (`t7-postboot-b60-poll{10,20,30,40,50,60}.log` +
  `t7-postboot-b60-final.log`) — FAIL y hệt từ đầu tới cuối
  (thiếu 5 lib + GST isomp4/libav + 10 gói apt).
- Tính từ lần chạm duy nhất (05:35:40Z): tới khi watcher kết thúc
  (06:45:09Z) replay đã im **1h09'29"** liên tục, boot đã ~119'
  tuổi. Đối chiếu ngưỡng đề xuất §8.2: điều kiện 2 (chết: 0
  process + dpkg im ≥10' + lock rảnh) ĐÃ ĐỦ từ ~05:46Z; điều kiện
  3 (boot ≥60' HOẶC dpkg im ≥15') ĐÃ ĐỦ từ ~05:51Z (dpkg im 15')
  và chắc chắn đủ từ 06:45Z (boot 119'). **Nếu luật §8 được duyệt
  thì boot #60? đã đủ điều kiện chạy --repair từ lúc ~05:51Z —
  nhưng T7 KHÔNG chạy vì luật chưa duyệt.**
- So sánh với #58: ở #58 T4 chờ 48 phút (25 poll FAIL) rồi kết
  luận gate 0 không thể ĐẠT; ở #60? T7 quan sát 60 phút (60 poll
  + 7 lần postboot FAIL) với kết luận tương tự nhưng bằng chứng
  còn mạnh hơn (dpkg.log hoàn toàn đứng im, không chỉ "không có
  gói GST" — mà là không có hoạt động nào).
- So sánh với #54 (mẫu "muộn nhưng vẫn xong"): #54 configure lúc
  +47'14" rồi cài xong +52'30" (5'16" sau). #60? configure lúc
  +49'51" rồi im tới +119' (69 phút sau configure, 0 dòng mới) —
  **không còn khả năng #60? đi theo mẫu #54**. Giả thuyết (a)/(b)
  ở §3.3 (wrapper chết sau bước configure / ledger bị cắt) là
  giải thích hợp lý nhất còn lại; giả thuyết (c) (configure do
  tác nhân khác) vẫn không loại trừ được nhưng cũng không có bằng
  chứng ủng hộ.
- **Không reboot mới trong lúc watcher chạy** — boot vẫn
  0260101b từ đầu tới cuối lượt (kiểm lại 06:45Z). Nhịp reboot
  ~1h/lần của đợt 119 (A→B 1h20', B→C 54') đã dừng: gap #59→#60?
  là 2h58'00" và boot #60? đã sống 119' mà chưa reboot tiếp.
- State: `t7-replay-done.md` (ghi 06:45:09Z); log đầy đủ
  `t7-wait-replay.log` (60 poll + 6 lần postboot poll + 1 lần
  cuối). RAM khả dụng lúc watcher kết: 1177 MB.
- Lưu ý vận hành: trong lúc watcher chạy có 1 lần runtime restart
  (lệnh sleep 25 phút của T7 bị SIGTERM ~06:06Z — cùng mẫu T4
  đợt 119 §6.3) — watcher (nohup, pid riêng) SỐNG QUA restart và
  chạy trọn 60 poll; không mất dữ liệu nào. Các luồng sau nên
  chạy watcher dạng nohup/detached thay vì sleep trong phiên
  (bài học vận hành, ghi để áp dụng).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm (05:42Z) — sạch hoàn toàn trên boot #60 (khác #57? lúc đó
  lock đang được T1 giữ sống). Không có lock sót từ boot cũ.
- Thư mục queue `hidden_files/vite.lock.queue` có **34 file
  cooldown** (tăng từ 30 ở #57? — thêm cooldown của các luồng đợt
  119/120) — đều là cooldown cũ đã hết hạn; file cooldown chỉ
  delay cùng-thread reacquire, không chặn luồng khác, không tính
  là ticket. T7 KHÔNG xóa (không cần; để T4 — chủ mảng lock —
  quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối 02:14:21–02:15:33Z ngày 16/11
  (T10 đợt 119, boot C — TICKET/ACQUIRED/RELEASED bình thường);
  **0 hoạt động nào trên boot #60 tới lúc kiểm** (05:42Z) — các
  luồng đợt 120 chưa ai acquire lock (hoặc chưa ghi log). Không có
  entry STALE nào mới.
- T7 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock
  tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Chính sách repair 15 phút — KHÔNG THỂ KÍCH HOẠT ĐÚNG HẠN trên boot #60?

- Policy duyệt đợt 117, áp dụng từ đợt 119: boot mới mà replay
  không tới trong ~15 phút thì chạy `--repair` có kiểm soát.
- Lượt đầu tiên policy có hiệu lực (#57?, đợt 119): replay tới
  lúc boot +2'05" — trong hạn 15 phút — nên `--repair` KHÔNG
  chạy, không cần chạy. Kết quả "không kích hoạt" đúng thiết kế.
- Boot #60?: tới boot +15' (05:00:49Z) vẫn 0 hoạt động apt — điều
  kiện kích hoạt ĐÃ ĐỦ từ lúc đó. Nhưng KHÔNG CÓ luồng infra nào
  đang chạy trong khoảng 04:45–05:35Z (lượt cron mở 05:35Z, T7
  bắt đầu ~05:40Z, boot đã 55' tuổi). Policy chỉ hành động được
  khi có thread live trong 15 phút đầu của boot; boot xảy ra giữa
  các lượt thì policy ngủ qua hạn — **lỗ hổng về mặt thời gian
  của policy, không phải lỗi của luồng nào**.
- Thêm nữa, chế độ lỗi của #60 (replay chạm 1 lần lúc +49'51"
  rồi chết) không nằm trong chữ của policy cũ — policy cũ viết
  cho chế độ "replay không tới hẳn" (#45/#53). Ngay cả khi T7
  có mặt đúng hạn +15', chữ policy cũng không nói rõ có chạy
  `--repair` khi replay đã chạm rồi chết hay không — cần luật mới
  (§8) bao cả hai chế độ: "không tới" VÀ "tới nhưng thiếu GST /
  chạm mà không cài".
- `--repair` với code mới (timeout + khóa symlink) vẫn CHƯA được
  chạy sống lần nào — policy vẫn chưa được kiểm chứng ở nhánh
  kích hoạt (2 lượt có hiệu lực: 1 lần "không kích hoạt" đúng,
  1 lần "không thể kích hoạt đúng hạn").

## 8. ĐỀ XUẤT LUẬT XỬ LÝ chế độ "replay tới nhưng thiếu GST" (quyết parent §12 mục 5)

> Đề xuất này CHƯA được duyệt — T7 chỉ viết ra có căn cứ, KHÔNG tự
> áp dụng trong lượt này (không chạy --repair, không cài package).
> Parent quyết; nếu parent duyệt, luật có hiệu lực từ đợt sau (hoặc
> đợt 121, theo quyết).

### 8.1 Căn cứ (dữ liệu 3 boot #58/#59/#60?)

- #58 (T4 đợt 119): replay KẾT THÚC sau 350 dòng (bracket (0'53",
  30'02"]) mà 0 dòng về 9 gói GST; wrapper chết; dpkg im 16+ phút;
  postboot FAIL 25/25 trong 48 phút — chờ đủ 60 phút cũng không
  PASS được (bằng chứng đã đủ kết luận gate 0 không thể ĐẠT).
- #59 (T4 đợt 119): replay còn ở giai đoạn đầu lúc +28' (698 dòng,
  vẫn cài libc-bin, thư mục GST chưa tồn tại, thiếu 5 lib); postboot
  FAIL 15/15; kết thúc không quan sát được (T4 dừng 02:20Z theo
  ngân sách) — mẫu chậm giống #58, chưa kết luận được là "thiếu
  GST" hay chỉ "chưa tới GST".
- #60? (T7 đợt 120, file này): replay CHẠM (2 dòng configure lúc
  +49'51") rồi CHẾT — 0 apt/dpkg đang chạy, /var/log/apt không tồn
  tại, lists trống, 0/9 GST; postboot FAIL (T7 + T3 độc lập); watcher
  60 phút quan sát (kết quả §5).
- Mẫu chung: **postboot FAIL kéo dài + replay không còn dấu hiệu
  sống = boot đó không bao giờ tự đủ điều kiện chạy WebKit** — chờ
  thêm chỉ đốt ngân sách lượt (T4 đợt 119 đã mất cả lượt yên vì
  chờ #58/#59; T3 đợt 120 đang gate-wait trên #60? tới 07:30Z).
  Ngược lại, các boot replay còn sống (#54: configure→xong 5'16";
  #47: update ~12' vì mirror chậm) cho thấy ngưỡng chờ phải đủ
  dài để không giết oan replay chậm.

### 8.2 Luật đề xuất — "quy tắc replay-chết" (dead-replay rule)

**Điều kiện kích hoạt (PHẢI đủ cả 5):**

1. Postboot check-only FAIL (exit 1) — kiểm lại ngay trước khi
   quyết (không dùng kết quả cũ quá 10 phút).
2. Replay ĐÃ CHẾT, chứng minh bằng cả ba dấu hiệu cùng lúc:
   (a) 0 tiến trình apt-get/dpkg/wrapper replay
   (`pgrep -x apt-get`, `pgrep -x dpkg`, `pgrep -f
   HATCH_OS_INTENT_SEED_BASELINE`, `pgrep -f 'os-intent replay'`
   đều trống); (b) dpkg.log KHÔNG tăng dòng trong ≥10 phút liên
   tục sau hoạt động apt cuối cùng (đo bằng 2 lần đọc cách nhau
   ≥10 phút, không suy từ 1 lần đọc); (c) lock dpkg rảnh
   (`fuser /var/lib/dpkg/lock` trống).
3. Ngưỡng chờ đã qua — một trong hai: (i) boot ≥60' tuổi, HOẶC
   (ii) dpkg.log im ≥15' sau hoạt động apt cuối cùng. (60' để
   bao cả boot phát hiện muộn như #60?; 15' im để bao boot phát
   hiện sớm như #58 — ở #58 dpkg im từ 01:23:43Z, tới 01:39Z đã
   im 16 phút, đủ điều kiện (ii) dù boot mới ~46' tuổi.)
4. Chế độ lỗi thuộc một trong hai dạng: (A) "tới nhưng thiếu GST"
   — replay đã kết thúc (đủ điều kiện 2) mà 0/9 gói GST trong
   dpkg.log / dpkg -l; HOẶC (B) "chạm mà không cài" — dpkg.log
   chỉ có bước configure, 0 dòng install, lists trống.
   (Dạng "không tới hẳn" #45/#53 đã có policy 15' cũ — luật mới
   bao thêm (A) và (B), không thay chữ policy cũ.)
5. Không có luồng đo WebKit nào đang chạy probe trên boot đó
   (chỉ gate-wait — repair không phá probe đang chạy; nếu có
   probe đang chạy thì hoãn tới khi probe xong hoặc luồng đó
   đồng ý).

**Hành động khi kích hoạt (theo đúng thứ tự):**

1. Ghi log + cờ `REPAIR_TRIGGERED` (boot_id, thời điểm, đủ 5 điều
   kiện kèm bằng chứng) TRƯỚC khi chạy — để parent kiểm lại sau.
2. Chạy `postboot-check.sh --repair` MỘT LẦN, có giám sát (log
   đầy đủ, không chạy nền rồi bỏ): script đã có sẵn — (i) vá
   wrapper nếu bị revert; (ii) `apt-get update` trước (Q7 đợt
   114 — lists trống sau reboot nên install thẳng luôn FAIL);
   (iii) install 10 gói còn thiếu (danh sách script đã liệt kê);
   (iv) symlink GST → debroot CHỈ khi apt thất bại (nhánh này đã
   có khóa không cướp thư mục thật khi replay đang chạy — nhưng
   ở đây replay đã chết nên khóa không cản); timeout riêng
   update 1500 s + install 1800 s (R9 đợt 115).
3. Chạy lại postboot check-only ngay sau repair; ghi PASS/FAIL +
   gói nào còn thiếu.
4. Nếu repair FAIL (apt vẫn lỗi / network không tới archive):
   DỪNG — không thử cách khác, không cài tay từng gói ngoài
   script; ghi rõ "repair thất bại, boot này không dùng được
   cho WebKit" + chuyển các luồng đo sang chờ boot sau (hoặc
   chạy phần không cần WebKit). Symlink fallback trong script
   vẫn cho WebKit launch (tiền lệ #45: O8 21/21 PASS nhờ
   debroot) nhưng phải ghi rõ decode mp4/H.264 qua plugin hệ
   thống vẫn thiếu — không tuyên bố "đủ điều kiện" khi chỉ có
   symlink.
5. Nếu repair PASS: ghi cờ `POSTBOOT_PASS` (như thường lệ) +
   ghi rõ "PASS nhờ repair, không phải replay" để các luồng sau
   không hiểu lầm replay đã chạy tốt.

**Phạm vi:** chỉ 10 gói mà postboot script đã liệt kê
(libevent-2.1-7t64 + 9 gói GST/lib); không cài thêm gói ngoài
danh sách; không sửa ledger replay; không reboot máy; không
đụng vite.lock / code production / dữ liệu luồng khác.

### 8.3 Rủi ro + cách giảm (đã nêu trong luật)

| Rủi ro | Giảm |
|---|---|
| `--repair` code mới (timeout + khóa symlink) CHƯA TỪNG chạy sống | Lần chạy đầu phải có giám sát + log đầy đủ; parent duyệt luật = chấp nhận rủi ro này có kiểm soát; nếu repair lỗi thì dừng, không thử tiếp |
| Apt install tranh lock với replay BỖNG quay lại giữa chừng | Kiểm lại pgrep + lock NGAY trước bước install (script đã bỏ qua bước apt khi bị khóa); điều kiện 2(b) im ≥10' làm xác suất này thấp |
| Giết oan replay chậm (vd #47 update ~12', #54 configure→xong 5'16") | Điều kiện 2 yêu cầu cả 3 dấu hiệu chết + ngưỡng chờ 60'/15' im — dài hơn mọi khoảng chậm đã quan sát (chậm nhất #54: 5'16" từ configure tới xong; #47: ~12' update nhưng process VẪN CHẠY nên không đủ điều kiện 2(a)) |
| Symlink GST→debroot che giấu việc apt thiếu (K1) | Ghi rõ "PASS nhờ repair" + liệt kê gói apt còn thiếu (nếu có); không tuyên bố replay đã chạy tốt |
| Repair chạy trong lúc luồng khác gate-wait / giữ vite | Repair chỉ chạm apt + wrapper + symlink GST; không chạm vite.lock hay code; các luồng khác chỉ đọc cờ POSTBOOT_* |
| Boot phát hiện muộn (như #60?: T7 tới lúc boot đã 55') | Ngưỡng chờ dùng "boot ≥60' tuổi HOẶC dpkg im ≥15'" — boot muộn vẫn đủ điều kiện ngay khi phát hiện, miễn đủ 5 điều kiện |

### 8.4 Lỗ hổng policy 15' cũ + cách vá (đề xuất kèm)

- Vấn đề: policy 15' chỉ hành động được khi có thread live trong
  15 phút đầu của boot. Boot xảy ra giữa các lượt (vd #60? lúc
  04:45:49Z, lượt mở 05:35Z) thì policy ngủ qua hạn — T7 tới nơi
  đã 55' tuổi. Đây là lỗ hổng về mặt thời gian, không phải lỗi
  của luồng nào.
- Vá đề xuất (chọn 1 trong 2, quyết parent):
  - (i) **R9 (a)** — cron chạy watcher v2 ở đầu mỗi lượt với
    `--wait-new-boot` để bắt reboot giữa lượt (vẫn chờ user, xem
    §10.1); HOẶC
  - (ii) **Luật "phát hiện muộn"**: ở đầu mỗi lượt, nếu boot hiện
    tại đã >15' tuổi VÀ postboot FAIL VÀ replay đã chết theo điều
    kiện 2 của §8.2 thì được áp dụng luật §8.2 ngay (không cần
    chờ thêm) — tức luật mới tự nó đã vá lỗ hổng này, không cần
    đợi R9 (a). T7 khuyến nghị (ii) vì nó không đòi đổi thân cron
    (không cần user duyệt thay đổi cron) và bao được cả boot phát
    hiện muộn.
- Lưu ý: (ii) không thay thế R9 (a) hoàn toàn — R9 (a) còn bắt
  được FAIL live sớm (kẹp bracket), còn (ii) chỉ xử lý hậu quả
  khi đã muộn. Cả hai đều có giá trị riêng.

### 8.5 Formalize cờ POSTBOOT_FAIL (đề xuất kèm)

- Hiện tại: T7 chỉ viết `POSTBOOT_PASS` khi PASS; khi FAIL thì
  không có cờ — T4 phải đoán từ sự vắng mặt (và đã phải thích
  ứng ở đợt 119 khi T7 DONE sớm: "T7FLAG=VANG-T7-DONE"). Lần này
  T7 đã viết `POSTBOOT_FAIL` (05:46Z) ngay từ đầu để gate0-wait
  không phải đoán.
- Đề xuất: chuẩn hóa — T7 luôn viết đúng 1 trong 2 cờ
  (`POSTBOOT_PASS` / `POSTBOOT_FAIL`, kèm boot_id + thời gian +
  dpkg state) cho boot hiện tại, mtime ≥ boot; gate0-wait của T4
  đọc cờ FAIL như "gate 0 đã kiểm, kết quả FAIL" thay vì "chưa
  có cờ". Quyết parent (thay đổi nhỏ, không đổi thân cron).

### 8.6 T7 ở lại hết đợt hay DONE sau boot đầu? (đề xuất kèm, theo T4 §8.3)

- T4 đợt 119 đề xuất: "T7 ở lại hết đợt (watcher chạy qua reboot),
  hoặc formalize check-only làm gate 0 chính thức khi T7 vắng".
- Lần này T7 ở lại qua watcher 60 phút (§5) và ghi cờ FAIL ngay —
  nhưng nếu reboot mới xảy ra SAU khi T7 DONE (vd sau 06:45Z),
  các boot sau vẫn không có T7 coverage trong phần còn lại của
  lượt (tới 08:35Z). Đề xuất: watcher T7 tự khởi động lại khi
  phát hiện boot_id đổi (poll boot_id mỗi phút trong lúc chờ),
  tối đa tới hạn mềm của lượt (07:30Z) — quyết parent (tăng tải
  nhẹ cho luồng T7, đổi cách watcher vận hành nhưng không đổi
  thân cron).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `804be792ab9ae64aabac0f76e975b04a` →
  `d7d643b0454c57dbb85fa5b57a8b1fba` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/119,
  không đổi logic):
  - Header: thêm đoạn boot #58/#59 (chế độ "tới nhưng thiếu GST",
    theo T4 đợt 119) + đoạn boot #60? (chế độ "chạm mà không cài",
    watcher + luật xử lý chỉ đề xuất, không tự repair).
  - Dòng `say`: `#57? = 2026-11-15 23:33:34Z, boot_id 27c8b1d9-…`
    → `#60? = 2026-11-16 04:45:49Z, boot_id 0260101b-…,
    sau #59 01:47:49Z — số tạm, chờ T6 đếm lại mù #37`.
- **Sự cố lúc sửa (ghi để khỏi lặp):** lần sửa đầu dòng `say` chứa
  ký tự `"` trong `+49'51"` làm vỡ chuỗi shell — `bash -n` báo
  `syntax error near unexpected token ')'` ở dòng 136, script
  exit 2 khi chạy. Đã sửa ngay bằng cách bỏ dấu `"` (viết
  `+49p51`); sau đó `bash -n` OK + chạy kiểm chỉ-đọc lại ra FAIL
  exit 1 như kỳ vọng (`t7-postboot-b60-after-edit.log`, 05:46Z,
  boot ~60' tuổi). Bài học: không để ký tự `"` trong chuỗi `say`
  (dùng `p` thay dấu phút hoặc viết đầy đủ "phút").
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn FAIL
  exit 1 (đúng — replay chưa cài gì).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương
  án A, R9 §6.3): việc này cần parent duyệt và T7 không nhận được
  phê duyệt đó trong task — giữ nguyên để parent quyết.
  `--repair` với code mới (timeout + khóa symlink) vẫn CHƯA được
  chạy sống lần nào — **ghi rõ: nếu luật §8 được duyệt thì lần
  chạy --repair đầu tiên sẽ chạy đúng thứ tự hiện tại (mục 3 GST
  symlink trước, mục 4 apt install sau) trừ khi phương án A được
  duyệt kèm**.

## 10. Nợ mở sang đợt sau

1. **Đề xuất R9 (a) vẫn mở (nhắc lần 6):** cron chạy watcher v2 ở
   đầu mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt —
   parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9 (thay đổi thân
   cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng đợt 117,
   chưa trả lời). T7 KHÔNG tự đổi thân cron. Boot #60? là ví dụ
   sống: boot xảy ra 04:45:49Z, lượt mở 05:35Z — không có watcher
   v2 đầu lượt thì FAIL live trong 50 phút đầu của boot không ai
   kẹp được (chỉ còn suy luận hậu kiểm từ dpkg.log). Đề xuất
   §8.4(ii) ("phát hiện muộn") là đường vá không cần đổi cron.
2. **Luật xử lý "replay tới nhưng thiếu GST" (§8) CHỜ PARENT
   QUYẾT** — nhiệm vụ chính của luồng này; T7 đã viết đầy đủ căn
   cứ + điều kiện + phạm vi + rủi ro. Nếu parent duyệt, luật có
   hiệu lực từ đợt sau; nếu không duyệt, các boot dạng #58/#60?
   tiếp tục chặn mọi luồng đo WebKit ở gate 0 (T4 đợt 119 đã mất
   cả lượt yên vì #58/#59; T3 đợt 120 đang gate-wait trên #60?
   tới 07:30Z).
3. **Headroom tiếp tục rơi: 545 trên boot #60?.** Vite thường KHÔNG
   chạy được (thiếu ~1041 so với ~1586 cần); giữ vite tạm
   `watch.ignored` cho mọi O8/vite. Trần 63747 cần can thiệp host
   (ngoài VM) mới tăng được — không thuộc tầm luồng này.
4. **`--repair` với code mới (timeout + khóa symlink) CHƯA được
   chạy sống** — cần 1 boot mà replay chết + postboot FAIL (tình
   huống #58/#60?) để kiểm chứng, hoặc parent duyệt luật §8 rồi
   chạy sau khi đủ điều kiện. Chính sách repair 15 phút đã có
   hiệu lực từ đợt 119 nhưng sau 2 lượt vẫn chưa được kiểm chứng
   ở nhánh kích hoạt (lượt 1: không kích hoạt đúng; lượt 2: không
   thể kích hoạt đúng hạn — xem §7).
5. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B (R9
   §6.3) chờ parent duyệt; tới lúc đó `--repair` chỉ symlink khi
   apt thất bại. Trên boot #60? symlink CHƯA được tạo (T7 không
   chạy --repair) — thư mục GST vẫn không tồn tại.
6. **Số thứ tự boot #60? CHƯA CHẮC** — chờ T6 đợt 120 đếm lại mù
   #37 (boot #59 kết thúc không quan sát được: T4 dừng 02:20Z,
   gap 02:20Z→04:45:49Z dài 2h25'49" mù hoàn toàn — có thể chứa
   boot chưa ghi nhận). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số (boot_id + btime không đổi).
7. **Độ trễ khởi động replay dao động mạnh, không theo hướng xấu
   dần** (+40s → +6'28" → +22.6' → không tới → +47'14" →
   +2'05" → +0'53" → +49'51" chỉ configure) — mẫu #53/#54 muộn
   dần đã đảo ngược từ #57?; nguyên nhân khâu khởi động replay
   vẫn chưa rõ (không có log trigger trong máy). **Mới:** khởi
   động muộn nay đi kèm CHẾT SAU BƯỚC ĐẦU (#60?) — chiều lỗi mới
   cần theo dõi ở các boot sau.
8. **Cooldown file tích lũy (34 file, tăng từ 30)** — chưa có cơ
   chế dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock
   (T4 quyết).
9. **Mù #37 nay chứa #58 + #59 + #60?** nếu chưa đóng — việc của
   luồng probe đợt 120 (T6). Các mù #22/#24/#28/#29/#30/#31/#35/
   #36 chờ user quyết (không đổi).
10. **T7 DONE sau boot đầu — các boot sau trong lượt không có T7
    coverage** (xem §8.6): nếu reboot mới xảy ra sau khi watcher
    60 phút kết thúc (~06:45Z), boot mới không có cờ POSTBOOT_*
    mới cho tới lượt sau. Đề xuất watcher tự khởi động lại theo
    boot_id — quyết parent.
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 119 §10: E4 lô
    đo lớn lượt 3–10 (T2) + điều tra nguồn nhiễu s79 + bar F2 leg
    B ≥6 + follow-up MSB4RB8 (T3) + WebKit lượt yên + luật GST
    sau reboot (T4 — nay có đề xuất §8) + mù #37 + probe #39
    (T6) + G1 + mù #22/#28–#31/#35 chờ user quyết; birefnet chỉ
    thử lại khi RAM đổi, u2net là fallback chính thức;
    ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
    gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi T7 (không đụng production) — md5
  `5be5a250…` khớp baseline lúc mở đợt (kiểm đầu + kiểm cuối, xem
  dưới).
- `media.ts` md5 `2c384ed1…` khớp baseline, không đổi.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T7 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  728–1477 MB < 6 GB).
- O8: KHÔNG thuộc T7 (luồng khác làm).
- Postboot #60?: FAIL lúc boot ~55' (try1) + FAIL lúc boot ~60'
  (sau sửa script) + T3 kiểm độc lập FAIL ~05:44Z (cùng kết quả).
- Watcher: quan sát 60 phút 05:45Z→06:45Z — replay KHÔNG quay lại
  (60/60 poll dpkg 2 dòng, 0 apt; postboot FAIL 6 lần poll + lần
  cuối; xem §5).
- Replay #60?: chạm mà không cài — 2 dòng configure lúc +49'51",
  rồi im 1h09'29" tới khi watcher kết (xem §3 + §5).
- Headroom #60?: 545 — reboot KHÔNG hồi (lần 5 có số đo boot-mới
  chứng minh hướng rơi).
- Stale vite.lock: không có (lock dir không tồn tại; queue chỉ còn
  cooldown cũ, v2 log không STALE mới).
- Repair 15 phút: không thể kích hoạt đúng hạn (boot xảy ra giữa
  các lượt; xem §7) — `--repair` chưa chạy sống lần nào.
- Không reboot mới trong lúc T7 làm (boot vẫn 0260101b tới 06:45Z,
  boot ~119' tuổi; nhịp reboot ~1h/lần của đợt 119 đã dừng).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND120_T7_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #57? → #58/#59/#60? trong header + dòng `say`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round120-t7/` (log
  watcher chờ replay, log postboot try1 + after-edit, log headroom,
  md5 trước/sau của postboot-check, `POSTBOOT_FAIL`,
  `t7-initial-state.md`, `t7-replay-done.md`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round120-t7-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round120-t7.done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
