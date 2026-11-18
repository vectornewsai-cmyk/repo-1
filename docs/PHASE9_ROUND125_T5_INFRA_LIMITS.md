# PHASE9_ROUND125_T5_INFRA_LIMITS — Boot #69? CHẾT sau ~19', replay KHÔNG TỚI; boot #70? replay CHẠY, PASS +5m02 — luật repair dạng (C) đánh giá lần 3: KHÔNG kích hoạt

> Luồng T5, đợt 125, lượt cron 03:35 +07 17/11/2026 (bắt đầu ~20:41Z trên
> boot #69?, reboot giữa lượt ~20:54:4xZ, kết thúc ~21:03Z trên boot #70?).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 124 §10–§11 (mù #40 B ĐỂ MỞ; E4 lượt 5 trên cây
> BASELINE; luật repair dạng (C) có hiệu lực, đánh giá lần 2 không kích
> hoạt; WebKit lượt yên #5 + đo RAM baseline idle trong T9 đợt 125; R9 (a)
> vẫn chờ user; G1 khung (a) M2 vẫn hoãn) + quyết parent đợt 124 §12
> (DEF v0.2; leg trung gian dò ranh giới chuyển; mù #40/#43 ĐỂ MỞ; RAM ghim
> DỪNG điều tra từ trong VM; birefnet chỉ thử lại khi available ≥ 6 GB).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #69? (TẠM) CHẾT sau ~19–20 phút — replay KHÔNG BAO GIỜ TỚI.**
   btime 20:35:11Z, boot_id `670c07f6-2299-43f6-951c-0cf1116afd6d`, sau
   #68? 3h01m20s. dpkg.log đóng băng 2 dòng configure (20:35:38/39Z,
   boot +27s/+28s) suốt đời boot; 0 apt/dpkg chạy trong 12 poll watcher
   + try1 + after-edit; postboot FAIL 14/14 lần kiểm. Chết ~20:54:4xZ
   (giữa poll 12 watcher b69 20:54:39Z và lần kiểm 20:55:10Z của T5).
   Cờ `POSTBOOT_PASS` cho #69? KHÔNG BAO GIỜ được viết — đúng, vì chưa
   từng PASS. Chế độ lỗi giống #60? ("chạm mà không cài") — lần thứ 2
   xuất hiện (xem §3.3).
2. **Boot #70? (TẠM): replay CHẠY, PASS +5m02 — boot ĐANG SỐNG.**
   btime 20:54:19Z, boot_id `310f07e4-f789-427a-bee8-a9aefd5a1f02`, sau
   #69? 19m08s. Replay: configure 20:55:02Z (boot +43s), installs
   20:55:40–21:01:36Z (boot +1m21s → +7m17s), dpkg 2 → 1509 dòng, gói
   cuối gstreamer1.0-tools 21:01:36Z; postboot PASS exit 0 lúc 20:59:21Z
   (boot +5m02s, watcher b70 poll 3), xác nhận lại exit 0 lúc 21:03:20Z
   (boot +9m01s, final). Cờ `POSTBOOT_PASS` HIỆN TẠI trong `round125-t5/`
   là cho boot này. 2 gói từng thiếu ở #65? (libav 20:57:40Z, plugins-bad
   20:58:15Z) ĐỀU ĐƯỢC CÀI (`dpkg -l` ii cả 2).
3. **Luật repair dạng (C) — ĐÁNH GIÁ LẦN 3: KHÔNG KÍCH HOẠT.**
   Trên #69?: apt KHÔNG SỐNG (0 tiến trình mọi lần kiểm) nên điều kiện
   (b) "apt còn sống nhưng 0% CPU" không đạt; chế độ lỗi là #60?-like
   ("chạm mà không cài"), không phải dạng (C) "sống nhưng kẹt ở update"
   nên (d) cũng không đạt — xem §7. Không có kill nào được cân nhắc,
   không có `--repair` nào chạy. Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch
   bản mục tiêu. Lưu ý: chính sách repair 15 phút cũ (đợt 117 §13 Quyết 9)
   viết cho chế độ "replay không tới hẳn" (#45/#53); theo tiền lệ T7 đợt
   120, chế độ #60?-like KHÔNG nằm trong chữ của policy — T5 KHÔNG suy
   diễn mở rộng, KHÔNG tự chạy `--repair` trên #69?.
4. **Headroom inotify: 4318 (mở, trên #69?) → 3645 (cuối, trên #70?).**
   Giảm 673 watch giữa hai boot — các luồng đợt 125 đã khởi động lại
   trên #70? (vite/lock...). Vẫn gấp ~2,3 lần số watch vite thường cần
   (~1586). Vite thường chạy được trên boot này.
5. **RAM khả dụng dao động mạnh trong lượt:** 1140 MB (mở #69?, 20:41Z)
   → 987–2139 MB trong watcher b69 → 1398 MB (mở #70?, 20:56:53Z) →
   1159–2378 MB trong watcher b70 → 1788 MB (cuối, 21:03Z). Mức thấp
   nhất 987 MB (poll 11 b69, 20:53:39Z). Dù lấy số nào cũng < 6 GB guard
   — birefnet không thử.
6. **Cập nhật `postboot-check.sh` 2 lần trong lượt** (md5 `457fdec7…` →
   `2418e95e…` (#69?) → `ea7735c2…` (#70?)): chỉ đổi tham chiếu boot
   (header + dòng `say`); `bash -n` OK cả 2 lần; check-only sau sửa
   #69? vẫn FAIL như kỳ vọng; script sau sửa #70? đã được watcher b70
   poll 2/3 + final xác nhận (FAIL giữa replay → PASS). Xem §8.
7. **Stale vite.lock: KHÔNG có lock sót.** Thư mục lock v2 KHÔNG TỒN
   TẠI; queue 52 file cooldown (tăng từ 48 ở #68? — +4, khớp T6 đợt 125
   đếm 20:47Z); v2 log hoạt động cuối là T10-round124 trên #68?
   (18:36–18:38Z); 0 hoạt động nào trên #69?/#70? tới lúc kiểm cuối.
   Xem §6.
8. **Số thứ tự boot #69?/#70? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 125 đã chốt #69? tạm lúc 20:47Z, TRƯỚC reboot ~20:54Z; T6
   đợt 126 đếm tiếp #70?).
9. **Sự cố vận hành:** service exec restart giữa lúc T5 chờ watcher b69
   (2 lệnh sleep bị abort) — trùng thời điểm reboot #69?→#70?; T5 phát
   hiện boot mới ở lần kiểm sau đó (20:55:10Z) và khởi động lại watcher
   cho #70? trong ~2 phút (20:57:20Z). Watcher b69 chết cùng reboot
   theo thiết kế (không có BOOT_CHANGED log — tiến trình chết trước khi
   kịp ghi; xem §5.2).

## 2. Postboot — #69? FAIL 14/14; #70? PASS 2 lần

### 2.1 Boot #69? — FAIL toàn bộ (try1 + after-edit + watcher 12 poll)

- Boot #69?: 2026-11-16 20:35:11Z (btime kernel 1794861311;
  `uptime -s` đồng ý; journal first entry 20:35:22Z, chênh +11 s — cùng
  mẫu #67?/#68?; boot_id `670c07f6-2299-43f6-951c-0cf1116afd6d`, sau #68?
  17:33:51Z (gap 3h01m20s). `journalctl --list-boots` CHỈ CÒN 1 boot
  (hiện tại); `last -x` chỉ còn 1 dòng reboot 20:35Z. Khung giờ chết có
  thể: 18:50Z (đợt 124 đóng) → 20:35:11Z = 1h45m11s (thời điểm #68? chết
  thật không xác định được).
- try1 20:42:24Z (boot +7m13s), exit 1 (`t5-postboot-b69-try1.log`):
  PASS wrapper (K1), FAIL libs thiếu 5, FAIL GST (thư mục hệ thống
  không tồn tại, 0 file, debroot 269), FAIL GST isomp4+libav, FAIL apt
  0/11.
- Sau sửa script 20:44:12Z (boot +9m01s), exit 1
  (`t5-postboot-b69-after-edit.log`) — FAIL y hệt.
- Watcher b69 poll 1–12 (20:43:35–20:54:39Z): postboot exit 1 MỌI poll.
- Tổng: FAIL 14/14 lần kiểm trên #69?. Không có lần PASS nào — cờ
  `POSTBOOT_PASS` cho #69? không bao giờ được viết.

### 2.2 Boot #70? — PASS 2 lần (poll 3 + final), đang sống

- Boot #70?: 2026-11-16 20:54:19Z (btime kernel 1794862459;
  `uptime -s` đồng ý; journal first entry 20:54:30Z, chênh +11 s;
  boot_id `310f07e4-f789-427a-bee8-a9aefd5a1f02`, sau #69? 20:35:11Z
  (gap 19m08s). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại).
- Watcher b70 poll 1 (20:57:20Z, boot +3m01s): exit 1 (replay đang
  cài — dpkg 530 dòng, apt-get đang chạy, GST 32 file); poll 2
  (20:58:21Z, boot +4m02s): exit 1 (dpkg 1070, GST 256); **poll 3
  (20:59:21Z, boot +5m02s): exit 0 — PASS** (dpkg 1238, apt-get 0 lúc
  đó, GST 269, apt 11/11) → cờ `POSTBOOT_PASS` viết ngay 20:59:21Z.
- Final 21:03:20Z (boot +9m01s), exit 0 (`t5-postboot-b70-final.log`):
  PASS wrapper/libs/GST (thư mục thật, 269 file = debroot)/apt 11/11.
- LƯU Ý: PASS lúc poll 3 đến TRƯỚC khi replay xong hẳn — dpkg.log
  tiếp tục tăng sau PASS (1238 → 1361 lúc 20:59:55Z → 1451 lúc 21:01:11Z
  → 1509 lúc 21:03:09Z; apt-get=0 ở poll 3 chỉ là khoảng nghỉ giữa 2
  pha cài). Các gói còn cài sau PASS là gói ledger khác
  (libvidstab-dev, fonts-wqy-zenhei...), KHÔNG thuộc 11 gói postboot
  kiểm. Replay xong thật 21:01:36Z (gói cuối gstreamer1.0-tools).
  Cờ PASS vẫn đúng (11/11 + GST đủ từ 20:59:21Z), nhưng bracket replay
  đầy đủ là (0'43", 7'17"] chứ không phải tới lúc PASS.

## 3. Replay — #69? không tới; #70? chạy nhanh, xong trọn vẹn

### 3.1 Bracket #69? — KHÔNG CÓ (replay không tới)

- Configure 20:35:38/39Z (boot +27s/+28s — KHỞI ĐỘNG SỚM, ngang lớp
  #63? +48s, #67? +40s, #68? +1m51), rồi IM HOÀN TOÀN: dpkg.log đóng
  băng 2 dòng từ 20:35:39Z tới poll 12 (20:54:39Z, boot +19m28s);
  0 apt/dpkg chạy mọi lần kiểm (pgrep -x); lists chỉ 5 entry
  (2 file cli.github.com từ 12/11 — sót lại qua rebuild); partial 0
  file; cache apt 0 file .deb; /var/log/apt KHÔNG TỒN TẠI; GST hệ
  thống 0 file. Không có journal entry nào về apt/dpkg trên boot này.
- Boot chết ~20:54:4xZ khi mới ~19–20 phút tuổi — TRƯỚC CẢ khi T5 kịp
  đánh giá xong luật (C) theo đúng quy trình (cần ≥2 lần kiểm cách
  nhau ≥15' + boot ≥60' hoặc dpkg im ≥15'; xem §7). Boot ngắn nhất
  từ trước tới nay trong chuỗi quan sát (#66? 27p36 là kỷ lục cũ).

### 3.2 Bracket #70? — (0'43", 7'17"], xong trọn vẹn

- Configure 20:55:02Z (boot +43s — khởi động NHANH, cùng nhóm với
  #63? +48s, #67? +40s, #48 +40s).
- Installs 20:55:40–21:01:36Z: dpkg 2 → 1509 dòng trong ~6 phút;
  gói cuối gstreamer1.0-tools 21:01:36Z (boot +7m17s). 0 apt/dpkg chạy
  lúc kiểm 21:03:09Z (pgrep -x: không có); lists 39 file, partial 0
  file (update đã xong).
- Bracket hoàn thành: (FAIL poll 2 20:58:21Z, PASS poll 3 20:59:21Z]
  theo check-only + (20:55:02Z, 21:01:36Z] theo dpkg.log. Nhanh thứ 4
  từ trước tới nay (sau #48 +2m44, #67? +3m12, #68? +4m51; nhanh hơn
  #61 +5m41).
- Cập nhật bảng chế độ lỗi replay (xem §3.3).

### 3.3 Bảng chế độ lỗi replay (cập nhật tới #70?)

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
| #62? | **Chạy xong, chưa kịp PASS** — configure +9'52", update ~12', installs ~5', xong +26'19" (1509 dòng, gói cuối gstreamer1.0-tools); reboot 08:53:05Z trước khi kiểm PASS | dpkg.log + FAIL lúc +15' (T5 đợt 121); bracket nửa trái (FAIL 08:44Z, xong 08:52:06Z] |
| #63? | **Chết dạng (B)** — configure +48s, wrapper chết live (09:07:48Z, 09:08:48Z], không bao giờ chạy apt-get update; luật §8.2 kích hoạt lần đầu → --repair PASS | dpkg.log + FAIL + REPAIR_TRIGGERED + POSTBOOT_PASS 09:27:19Z |
| #64? | **(C) SỐNG NHƯNG KẸT Ở UPDATE** — configure +30'21" (muộn), update chạy 64'+ không tiến triển (partial im từ 11:41:39Z, lists đóng băng 111, dpkg 2 dòng); mirror khỏe (200 trong 0,79 s); luật §8.2 KHÔNG kích hoạt (apt+wrapper sống); postboot FAIL suốt lượt | dpkg.log + watcher 60/60 poll + curl probe 12:25Z + POSTBOOT_FAIL |
| #65? | **Chạy nhưng KHÔNG XONG HẲN** — configure +49s, tiến triển tới 14:01:09Z (GST 0→119 file, tools 14:01:09Z) rồi DỪNG khi còn thiếu libav + 2 gói apt; 0 apt/dpkg lúc 14:06:06Z, postboot GẦN ĐẠT; không watcher nào ghi cờ; reboot 14:24:43Z | build-loop-log (T9/T4 đợt 122) + ledger/cache trên đĩa |
| #66? | **Chạy tốt, PASS, boot chết sớm** — configure +10m56, update ~9–10', installs ~3', xong +23m36 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +23m58; boot CHẾT 14:52:19Z sau chỉ 27p36 | dpkg.log + watcher 7 poll + POSTBOOT_PASS (đã SUPERSEDED) |
| #67? | **Chạy RẤT NHANH** — configure +40s, xong +3m12 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +7m00, xác nhận exit 0 ở poll 10 + cuối; boot vẫn sống | dpkg.log + watcher 10 poll + POSTBOOT_PASS (hiện tại) |
| #68? | **Chạy NHANH, PASS, xong trọn vẹn** — configure +1m51, xong +4m51 (1509 dòng, gói cuối gstreamer1.0-tools); 2 gói từng thiếu ở #65? đều được cài; PASS exit 0 lúc +8m12, xác nhận lại +9m57, poll 10 + cuối; boot vẫn sống | dpkg.log + postboot try1/after-edit/poll10/final + watcher 15 poll |
| **#69?** | **CHẠM MÀ KHÔNG CÀI (lần 2)** — configure SỚM +27s, rồi im hoàn toàn; dpkg đóng băng 2 dòng suốt ~19' đời boot; 0 apt/dpkg mọi lần kiểm; postboot FAIL 14/14; boot CHẾT ~20:54:4xZ khi ~19–20' tuổi, TRƯỚC khi kịp đánh giá luật (C) đầy đủ | dpkg.log + postboot try1/after-edit + watcher b69 12 poll |
| **#70?** | **Chạy NHANH, PASS, xong trọn vẹn** — configure +43s, xong +7m17 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +5m02 (trước khi replay xong hẳn — 11/11 gói đã đủ), xác nhận lại +9m01; 2 gói từng thiếu ở #65? đều được cài (libav 20:57:40Z, plugins-bad 20:58:15Z); boot vẫn sống | dpkg.log + postboot poll3/final + watcher b70 3 poll |

- Mẫu hình mới: chế độ "chạm mà không cài" đã xuất hiện LẦN 2 (#60?,
  #69?) — khác nhau ở thời điểm configure (muộn +49'51" vs sớm +27s)
  nhưng giống nhau ở kết cục (2 dòng rồi im, 0 apt, FAIL toàn bộ).
  Tỉ lệ: 2/16 boot đã quan sát kỹ (#45–#70? trừ #49–#51 thiếu dữ liệu).
  Nguyên nhân vẫn chưa xác định được (wrapper chết ngay sau configure
  mà không để lại log — journal không có entry apt/dpkg nào trên cả 2
  boot). Không điều tra thêm từ trong VM.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 17:41Z (boot #68?, ~7' tuổi) | 4438 | sau replay PASS, postboot PASS |
| T5, 18:00Z (boot #68?, cuối) | 4415 | sau watcher 15 poll, postboot PASS (ổn định) |
| **T5, 20:42Z (boot #69?, ~7' tuổi)** | **4318** | **boot MỚI — replay không tới, postboot FAIL** |
| **T5, 21:03Z (boot #70?, ~9' tuổi)** | **3645** | **sau replay PASS, postboot PASS (cuối lượt)** |

- Headroom giảm 4318 → 3645 (−673) giữa hai boot: các luồng đợt 125
  khởi động lại trên #70? và giữ watch mới (vite/lock...). Vẫn gấp
  ~2,3 lần số watch vite thường cần (~1586). **Vite thường chạy được
  trên boot này.**
- Trần 63747 vẫn đầy ở mức ~59k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 20:41Z | 1140 MB | lúc mở, trên #69? |
| 20:42–20:54Z (watcher b69, 12 poll) | 1863 → 1649 → 1487 → 1256 → 1459 → 1223 → 2139 → 1843 → 1633 → 1462 → 987 → 1703 MB | dao động mạnh theo luồng khác; thấp nhất 987 MB (poll 11) |
| 20:56:53Z | 1398 MB | lúc mở boot #70? |
| 20:57–20:59Z (watcher b70, 3 poll) | 1741 → 1464 → 1159 MB | đang cài replay |
| 21:01:11Z | 2378 MB | sau replay xong |
| 21:03:20Z | 1788 MB | cuối lượt |

- Dao động mạnh theo luồng khác đang chạy (biên độ ~1000–1400 MB
  trong vài phút); KHÔNG còn mức ghim ~474 MB như đợt 123 lúc T5 kiểm.
  T9 điều tra RAM ghim trong 30' đầu lượt — nhiệm vụ của T9, T5 chỉ ghi
  số đo của mình. Dù lấy số nào cũng < 6 GB guard — birefnet không thử
  (đứng theo LIMITS gộp).

## 5. Watcher — b69 chết cùng reboot (12 poll, FAIL toàn bộ); b70 PASS ở poll 3

### 5.1 Watcher b69 (`t5-wait-replay-b69.sh`, PID 4435)

- Chạy 20:43:35Z → chết cùng reboot ~20:54:4xZ (12 poll, 20:43:35–
  20:54:39Z). MỌI poll đều boot_changed=no, dpkg ĐÓNG BĂNG 2, apt=0,
  apt-get=0, dpkgproc=0, lists=5, gst_sys=0, postboot_exit=1.
- KHÔNG có log `BOOT_CHANGED` hay `WATCHER_END` — tiến trình chết
  cùng reboot trước khi kịp ghi (poll 12 lúc 20:54:39Z là lần ghi cuối;
  reboot xảy ra sau đó vài chục giây). Đây là hành vi đúng thiết kế
  (watcher không sống qua reboot); việc phát hiện boot mới do T5 làm
  ở lần kiểm tay sau đó (20:55:10Z).
- Lưu ý đồng hồ: poll 12 ghi 20:54:39Z trong khi btime boot mới là
  20:54:19Z — chênh ~20s, có thể do đồng hồ boot cũ chạy nhanh hơn
  boot mới (hoặc reboot xảy ra ngay sau poll 12). Ghi nhận, không giải
  thích thêm; btime/boot_id mới đã xác nhận độc lập bằng /proc/stat +
  journal (first entry 20:54:30Z, +11s — cùng mẫu các boot trước).

### 5.2 Watcher b70 (`t5-wait-replay-b70.sh`, PID 4286)

- Chạy 20:57:20Z → 20:59:21Z (3 poll, tự kết thúc khi PASS).
  Poll 1 (boot +3m01s): dpkg=530, apt-get=1, lists=39, gst_sys=32,
  postboot_exit=1. Poll 2 (boot +4m02s): dpkg=1070, apt-get=1,
  gst_sys=256, exit 1. Poll 3 (boot +5m02s): dpkg=1238, apt-get=0,
  gst_sys=269, exit 0 → `FLAG_WRITTEN 20:59:21Z` + `WATCHER_END
  reason=pass`. Cờ `POSTBOOT_PASS` trong `round125-t5/` là cho boot
  #70? (boot_id 310f07e4…).
- KHÔNG lặp lỗi vận hành đợt 122/123: không dùng `pkill -f` với mẫu
  chứa tên script watcher — watcher tự kết thúc, không cần kill.
- Sleep mồ côi của watcher b69 (PID 2548, `sleep 60`) còn sống sót
  sau reboot vài chục giây rồi tự chết khi hết 60s — vô hại, không cần
  kill (T5 không kill gì trong lượt này).

### 5.3 Không có reboot sau #70? trong lượt

- Boot #70? sống liên tục từ 20:54:19Z tới cuối lượt T5 (21:03Z,
  boot +9m). Cờ `POSTBOOT_PASS` cho #70? không cần đánh dấu SUPERSEDED;
  cờ cho #69? không bao giờ tồn tại.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc kiểm
  20:44Z (trên #69?) — sạch hoàn toàn (như #64?, #66?, #67?, #68?).
- Thư mục queue `hidden_files/vite.lock.queue` có **52 file cooldown**
  (tăng từ 48 ở #68? — +4 file mỗi boot; khớp số T6 đợt 125 đếm 20:47Z;
  đều là cooldown cũ, không chặn luồng khác, không tính là ticket).
  T5 KHÔNG xóa (không cần; T6 đợt 125 đã đề xuất luật prune chờ quyết
  parent — xem build-loop-log).
- `vite-lock-v2.log`: hoạt động cuối trên #68? là T10-round124
  (18:36:31–18:38:27Z, TICKET/ACQUIRED port 5554 wait_s=15 /
  RELEASED hold_s=116 — bình thường); **0 hoạt động nào trên #69?
  hay #70? tới lúc kiểm cuối** (21:03Z).
- T5 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock tay) —
  đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Luật repair dạng (C) — ĐÁNH GIÁ LẦN 3 (quyết parent đợt 122 §12.4)

> Quyết parent đợt 122 §12 mục 4: PHÊ DUYỆT bổ sung điều kiện repair cho
> chế độ lỗi (C) "sống nhưng kẹt ở apt-get update" — đủ 5 điều kiện
> (postboot FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không probe
> đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi chạy
> --repair một lần có giám sát; hiệu lực từ đợt 123.

### 7.1 Đối chiếu 5 điều kiện trên boot #69? (lúc T5 bắt đầu, 20:41–20:54Z)

| # | Điều kiện (C) | Kết quả trên #69? | Bằng chứng |
|---|---|---|---|
| (a) | Postboot check-only FAIL tươi | **ĐẠT** | try1 20:42:24Z exit 1; after-edit 20:44:12Z exit 1; watcher 12 poll đều exit 1 |
| (b) | apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15' VÀ dpkg.log im ≥15' (2 lần đọc cách nhau ≥15') | **KHÔNG ĐẠT** | 0 apt/dpkg chạy MỌI lần kiểm (pgrep -x) — apt KHÔNG SỐNG, không có tiến trình nào để đo 0% CPU; dpkg.log im từ 20:35:39Z (đã >15' lúc poll 11–12) nhưng vế "apt còn sống" không thỏa |
| (c) | Boot ≥60' tuổi HOẶC dpkg im ≥15' | Đạt vế sau lúc poll 11+ (dpkg im từ 20:35:39Z, >15' lúc ~20:51Z) | Moot vì (b)/(d) không đạt; và boot chết ở ~19–20' tuổi, trước khi T5 kịp hoàn tất đánh giá 2-lần-kiểm |
| (d) | Dạng (C): dpkg.log chỉ ≤2 dòng hoặc 0 dòng install, lists trống | **KHÔNG ĐẠT** | dpkg.log đúng là chỉ 2 dòng + lists gần trống — NHƯNG đây là dạng #60? ("chạm mà không cài": configure đã chạy 2 dòng rồi chết), không phải dạng (C) ("sống nhưng kẹt ở update": apt-get update đang chạy mà không tiến triển). Không có tiến trình update nào đang kẹt để kill |
| (e) | Không có probe WebKit nào đang chạy trên boot đó | Không kiểm chi tiết (moot) | Moot vì (b)/(d) đã không đạt |

- **Kết luận: luật (C) KHÔNG kích hoạt trên boot #69? — KHÔNG có kill
  nào được cân nhắc, KHÔNG có `--repair` nào chạy.** Đây là lần đánh
  giá thứ 3 sau khi luật có hiệu lực (lần 1 ở đợt 123 trên #66?/#67?,
  lần 2 ở đợt 124 trên #68?), và kết quả vẫn là "no-trigger" — đúng
  thiết kế (luật chỉ kích hoạt khi replay kẹt thật ở update). Luật vẫn
  CHƯA ĐƯỢC THỬ trong đúng kịch bản mục tiêu (dạng (C) thật như #64?);
  lần thử đầu vẫn chờ một boot kẹt thật trong tương lai.
- Ghi rõ để đợt sau khỏi hiểu nhầm "luật (C) đã áp dụng ở đợt 125":
  luật đã ĐÁNH GIÁ (lần 3) nhưng KHÔNG ÁP DỤNG (không đủ điều kiện).
- Trên boot #70?: replay chạy khỏe + PASS nên luật (C) không cần đánh
  giá (không có FAIL tươi nào sau poll 3).

### 7.2 Chính sách repair 15 phút cũ — KHÔNG áp dụng cho #69?

- Chính sách đợt 117 §13 Quyết 9 ("replay không tới trong ~15 phút"
  → cân nhắc repair) viết cho chế độ "replay không tới hẳn" (#45/#53).
  Tiền lệ T7 đợt 120 (§9): chế độ #60? ("chạm 1 lần rồi chết") KHÔNG
  nằm trong chữ của policy cũ — T7 KHÔNG suy diễn mở rộng, KHÔNG tự
  chạy `--repair`, chỉ đề xuất chờ parent quyết.
- #69? là chế độ #60?-like lần 2 (configure sớm +27s thay vì muộn
  +49'51", nhưng cùng kết cục 2 dòng rồi im). T5 đợt 125 theo đúng
  tiền lệ: KHÔNG tự chạy `--repair` trên #69?. Boot chết ở ~19–20'
  tuổi trước khi có quyết parent nào — vấn đề tự giải quyết bằng reboot.
- **Đề xuất cho parent (không tự làm):** mở rộng policy repair cho
  chế độ "chạm mà không cài" (2 dòng configure rồi im ≥15', 0 apt)
  HOẶC giữ nguyên chờ quyết từng ca. Tỉ lệ chế độ này đã là 2/16 boot
  quan sát kỹ — đủ lớn để cần một quyết định rõ ràng, thay vì mỗi lần
  lặp lại tiền lệ "không suy diễn".

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (2 lần, không đổi logic)

- Lần 1 (#69?, ~20:43Z): md5 `457fdec79e4bef5c65f2fd27b7be5756` →
  `2418e95ee5302c4c83e7ef23ae18e227` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Lần 2 (#70?, ~20:57Z): md5 `2418e95e…` →
  `ea7735c279d2c69ef24d09da726ce84b` (ghi trong
  `postboot-check.md5.after-b70`).
- Cả 2 lần chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/
  119/120/121/122/123/124, không đổi logic):
  - Header: bổ sung đoạn boot #69? (chết ~19', replay không tới) +
    đoạn boot #70? (replay đang chạy, watcher b70 chờ PASS).
  - Dòng `say`: `#68? = 2026-11-16 17:33:51Z…` → `#69? = 2026-11-16
    20:35:11Z…` → `#70? = 2026-11-16 20:54:19Z…`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự `"`
  (dùng `p`/`s` thay dấu phút/giây, như bài học T7 đợt 120 §9).
  `bash -n` OK ngay lần đầu cả 2 lần.
- Kiểm chứng: sau sửa #69?, check-only vẫn FAIL exit 1 đúng như kỳ
  vọng (20:44:12Z, boot +9m01s) — replay chưa tới; sau sửa #70?,
  script đã chạy trong watcher b70 poll 2 (FAIL giữa replay, đúng) +
  poll 3 (PASS, đúng) + final (PASS, đúng) — logic không đổi đã được
  xác nhận bằng chạy thật.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên để parent quyết. `--repair` code mới đã
  chạy sống 1 lần ở #63? (PASS) — lần chạy sau (nếu luật kích hoạt)
  vẫn chạy đúng thứ tự hiện tại (mục 3 GST symlink trước, mục 4 apt
  install sau) trừ khi phương án A được duyệt kèm.

## 9. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng đợt
  117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #69?→#70? giữa lượt đợt 125 (20:54:19Z, boot #69? sống chỉ
  ~19–20') là ví dụ mới nhất cho thấy R9 (a) vẫn có giá trị: T5 phải
  tự phát hiện boot mới + khởi động lại watcher + ghi cờ mới cho #70?
  trong ~5 phút sau boot. Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt
  hại, nhưng không thay thế R9 (a).

## 10. Nợ mở sang đợt sau

1. **Boot #70? đang sống + PASS — các luồng đo đợt 125 dùng cờ này**
   (`round125-t5/POSTBOOT_PASS`, boot_id 310f07e4…, PASS 20:59:21Z).
   Nếu #70? cũng chết sớm như #69? (~19') hoặc #66? (27p36) thì T5
   đợt sau phải làm lại từ đầu (khởi động lại watcher + cờ mới). Không
   có gì đảm bảo boot sống lâu — tuổi thọ boot gần đây: #66? 27p36,
   #67? 2h41m32, #68? 3h01m20, #69? ~19–20', #70? chưa biết.
2. **Chế độ "chạm mà không cài" đã xuất hiện lần 2 (#60?, #69?)** —
   cần quyết parent về policy repair cho chế độ này (xem §7.2). Không
   điều tra thêm từ trong VM.
3. **Headroom: 4318 → 3645** — giảm giữa hai boot; trần 63747 cần can
   thiệp host (dọn watch ngoài cell / tăng trần) — ngoài tầm luồng này.
4. **Symlink GST → debroot từ repair #63? đã mất theo reboot**
   (ephemeral, như mọi lần) — trên #70? thư mục GST hệ thống là thư
   mục THẬT do apt cài (269 file), không cần symlink. Phương án A/B
   (R9 §6.3) chờ parent duyệt.
5. **Số thứ tự boot #69?/#70? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 125 chốt #69? tạm lúc 20:47Z, trước reboot; #70? chờ T6
   đợt 126. Nếu T6 đếm khác, LIMITS này + script postboot-check cần
   sửa lại số — boot_id + btime không đổi).
6. **R9 (a) vẫn chờ user (nhắc lần 10 ở đợt 124 — do T10 ghi).**
7. **Cooldown file tích lũy (48 → 52 file)** — T6 đợt 125 đã đề xuất
   luật prune chờ quyết parent; nợ nhỏ, không ảnh hưởng lock (T6 quyết).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 124 §10–§11: E4 lượt
   5 (A, gop250, e4a5) trên cây BASELINE đợt 124 (prereg E4 phải ghi rõ
   thư mục cờ của luồng hạ tầng ĐỢT HIỆN TẠI — đợt 125 là
   `round125-t5/`); H3f đã gỡ, không apply lại; leg B theo DEF v0.2;
   G1 chờ user quyết + mù #22/#28–#31/#35/#39/#40 chờ user quyết (mù #39
   J + mù #40 B + mù #43 đã CHẤP NHẬN ĐỂ MỞ); birefnet (chỉ thử lại
   khi RAM đổi, u2net là fallback chính thức); ci-security.yml vẫn 403
   chờ user; TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push
   khi user chưa nhắn "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` / `media.ts`: KHÔNG kiểm md5 trong luồng này (T5 không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS). Baseline
  đợt 124 vẫn đứng theo round-in-progress.md.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #69? và #70?) OK cả 2 lần.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  987–2378 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #69?: FAIL 14/14 (try1 20:42:24Z + after-edit 20:44:12Z +
  watcher b69 12 poll) — 0 lần PASS.
- Postboot #70?: PASS 2 lần (poll 3 20:59:21Z + final 21:03:20Z) —
  0 lần FAIL sau khi replay đủ gói.
- Watcher b69: 12/12 poll FAIL (20:43:35–20:54:39Z), chết cùng reboot.
  Watcher b70: 3 poll (20:57:20–20:59:21Z), PASS ở poll 3, tự kết thúc.
- Replay #69?: KHÔNG TỚI (dpkg đóng băng 2 dòng). Replay #70?: XONG
  +7m17s (1509 dòng, gói cuối gstreamer1.0-tools 21:01:36Z), PASS +5m02.
- **Repair (cả §8.2 lẫn luật (C)): KHÔNG CHẠY** — luật (C) đánh giá
  lần 3, không kích hoạt (điều kiện (b)/(d) không đạt trên #69?:
  apt không sống, chế độ #60?-like không phải dạng (C)).
- Headroom: 4318 (mở, #69?) → 3645 (cuối, #70?).
- Stale vite.lock: không có (lock dir không tồn tại; queue chỉ còn
  cooldown cũ 48 → 52 file).
- Reboot mới: CÓ — 1 lần giữa lượt (#69?→#70? ~20:54:4xZ). Boot #70?
  sống từ 20:54:19Z tới cuối lượt T5 (21:03Z, boot +9m).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND125_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  tham chiếu #69? rồi #70? trong header + dòng `say`; md5
  `457fdec7…` → `2418e95e…` → `ea7735c2…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round125-t5/` (log
  watcher b69 12 poll + watcher b70 3 poll, log postboot
  try1/after-edit (b69) + poll3/final (b70), log headroom, md5
  trước/sau của postboot-check, `POSTBOOT_PASS` (cờ hiện tại — cho
  boot #70?, PASS 20:59:21Z), `t5-initial-state.md`,
  `t5-wait-replay-b69.sh` + `t5-wait-replay-b70.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round125-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round125-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
