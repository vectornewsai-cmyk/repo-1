# PHASE9_ROUND123_T5_INFRA_LIMITS — Hai boot trong một lượt: #66? PASS rồi CHẾT sau 27p36; #67? replay NHANH NHẤT NHÌ (PASS +7m00) — luật repair dạng (C) đánh giá lần đầu: KHÔNG kích hoạt (cả 2 replay đều tiến triển)

> Luồng T5, đợt 123, lượt cron 21:35 +07 16/11/2026 (bắt đầu ~14:41Z, boot #66? ~17' tuổi).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 122 §10–§12 (E4 lượt 3 rồi 4 trên cây BASELINE; leg B chạy
> lại trên baseline theo DEF PSI v0.1; luật repair dạng (C) có hiệu lực từ đợt 123;
> mù #39 J + probe #42; WebKit lượt yên #5; R9 (a) vẫn chờ user; G1 khung (a) M2
> vẫn hoãn) + quyết parent đợt 122 §12 (xác nhận gỡ H3f; G1 hoãn; chấp nhận đóng
> đợt 9/9 sau reboot #65).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ 5 điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Replay boot #65? KHÔNG tự hoàn thành** (kiểm từ bằng chứng trên đĩa, xem §3).
   T4 att3 14:06:06Z: 0 apt/dpkg chạy, dpkg.log im từ 14:01:09Z, postboot GẦN
   ĐẠT (chỉ thiếu libav + 2 gói apt: gstreamer1.0-plugins-bad,
   gstreamer1.0-libav). Nó tiến triển tới 14:01:09Z rồi DỪNG, không PASS,
   rồi reboot 14:24:43Z cắt đứt mọi cơ hội. Tóm tắt "kẹt ở 599 dòng từ
   ~13:27Z" của T4 MÂU THUẪN với chi tiết att3 có timestamp (cài
   pocketsphinx 13:55:10Z, gstreamer1.0-tools 14:01:09Z) — số 599 là đọc
   giữa chừng đã cũ; chi tiết att3 mới là chuẩn.
2. **Boot #66? (TẠM): PASS rồi CHẾT.** btime 14:24:43Z, boot_id
   `9bbda390-bd64-4679-a1ff-3619899cee7d`, sau #65? 1h31m18s. Replay chạy
   tốt: configure +10m56, update xong ~14:45Z, installs 14:45:33–14:48:19Z,
   dpkg 2 → 1509 dòng, postboot PASS exit 0 lúc 14:48:41Z (boot +23m58).
   NHƯNG boot CHẾT 14:52:19Z — chỉ sống 27p36. PASS đó đã đánh dấu
   SUPERSEDED; các luồng đo KHÔNG được dùng nó. Watcher b66 (7 poll) +
   phiên exec của T5 chết theo reboot.
3. **Boot #67? (TẠM): replay NHANH, PASS +7m00 — boot ĐANG SỐNG.**
   btime 14:52:19Z, boot_id `94e29be5-a52c-4840-9ca9-4e896482e4a2`, sau #66?
   27m36s. Replay khởi động NHANH (configure +40s), installs xong 14:55:31Z
   (boot +3m12), dpkg 2 → 1509 dòng, postboot PASS exit 0 lúc 14:59:19Z
   (boot +7m00), xác nhận lại exit 0 ở poll 10 (15:04:46Z) + cuối
   (15:06:05Z). Cờ `POSTBOOT_PASS` hiện tại trong `round123-t5/` là cho
   boot này. Đây là lần đầu tiên trong đợt 123 các luồng đo có boot PASS
   thật để chạy.
4. **Luật repair dạng (C) — ĐÁNH GIÁ LẦN ĐẦU (hiệu lực từ đợt này):
   KHÔNG KÍCH HOẠT trên cả 2 boot.** Cả 2 replay đều TIẾN TRIỂN (điều
   kiện (b) không bao giờ đạt — xem §7). Không có kill nào được cân nhắc,
   không có `--repair` nào chạy. Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch
   bản mục tiêu của nó (replay kẹt thật).
5. **Headroom inotify: 4447 (#66? lúc mở) → 2830 (#67? lúc mở) →
   4533 (#67? cuối).** Số 2830 lúc mở #67? là thấp nhất kể từ #63?, nhưng
   HỒI lên 4533 khi replay xong — số đo lúc mở boot bị đè tạm thời (replay
   + luồng khác khởi động), không phải suy giảm bền vững. Vite thường
   (~1586 watch) chạy được trên cả 2 boot.
6. **Cập nhật `postboot-check.sh` 2 lần trong lượt** (md5 `a10b43ea…` →
   `24578b48…` (#66?) → `f684bb6b…` (#67?)): chỉ đổi tham chiếu boot
   (header + dòng `say`); `bash -n` OK cả 2 lần; check-only sau sửa vẫn
   FAIL đúng như kỳ vọng rồi PASS khi replay xong. Xem §8.
7. **Stale vite.lock: KHÔNG có lock sót trên cả 2 boot.** Thư mục lock v2
   KHÔNG TỒN TẠI; queue 44 → 45 file cooldown (cũ, vô hại); v2 log có hoạt
   động bình thường của T1-round123 trên #66? (ACQUIRED/RELEASED port 5590,
   hold 35s). Xem §6.
8. **R9 (a) vẫn mở (nhắc lần 9):** cron chạy watcher v2 ở đầu mỗi lượt với
   `--wait-new-boot` — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9 (thay
   đổi thân cron, cần user đồng ý). Reboot #66?→#67? giữa lượt đợt này là
   ví dụ mới nhất cho thấy R9 (a) vẫn có giá trị — nhưng T5 KHÔNG tự đổi
   thân cron. Xem §9.
9. **Lỗi vận hành của chính T5:** `pkill -f` với mẫu chứa tên script
   watcher đã giết cả phiên exec của T5 (SIGKILL) — lặp lại đúng lỗi T4
   mắc ở đợt 122. Chỉ kill bằng PID chính xác. Xem §5.3.

## 2. Postboot — FAIL lúc mở, PASS lúc replay xong (cả 2 boot)

### 2.1 Boot #66? — FAIL 2 lần, PASS 1 lần, rồi boot chết

- Boot #66?: 2026-11-16 14:24:43Z (btime kernel 1794839083;
  `uptime -s` đồng ý; journal first entry 14:24:54Z, chênh +11 s — cùng
  mẫu +11 s như #62?/#64?; boot_id
  `9bbda390-bd64-4679-a1ff-3619899cee7d`, sau #65? 12:53:25Z (gap
  1h31m18s). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 14:24Z.
- try1 14:44Z (boot +19m), exit 1 (`t5-postboot-b66-try1.log`): FAIL libs
  (5: libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2),
  FAIL GST (thư mục không tồn tại; 0 plugin hệ thống, debroot 269),
  FAIL apt (11 gói).
- Sau sửa script 14:45:27Z, exit 1 (`t5-postboot-b66-after-edit.log`) —
  nội dung FAIL y hệt.
- Sau replay 14:48:41Z (boot +23m58), exit 0
  (`t5-postboot-b66-after-replay.log`): PASS wrapper (K1), PASS libs đủ 5,
  GST thư mục THẬT (apt) 269 file, debroot 269, PASS GST (isomp4 + libav),
  PASS apt đủ 11/11.
- Cờ `POSTBOOT_PASS` cho #66? đã ghi 14:49Z — rồi ĐÁNH DẤU SUPERSEDED
  14:53Z khi phát hiện boot chết (xem §5.2). Cờ `POSTBOOT_FAIL` cho #66?
  cũng đã đánh dấu hết hiệu lực. Cả 2 file giữ lại làm lịch sử trong
  `round123-t5/`.

### 2.2 Boot #67? — FAIL 2 lần, PASS 3 lần (đang sống)

- Boot #67?: 2026-11-16 14:52:19Z (btime kernel 1794840739;
  `uptime -s` đồng ý; journal first entry 14:52:30Z, chênh +11 s;
  boot_id `94e29be5-a52c-4840-9ca9-4e896482e4a2`, sau #66? 14:24:43Z
  (gap 27m36s). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 14:52Z.
- try1 14:53:53Z (boot +1m34), exit 1 (`t5-postboot-b67-try1.log`): FAIL
  y hệt #66? lúc mở (5 lib + GST + 11 gói).
- Sau sửa script 14:54Z, exit 1 (`t5-postboot-b67-after-edit.log`) —
  nội dung FAIL y hệt.
- Sau replay 14:59:19Z (boot +7m00), exit 0
  (`t5-postboot-b67-after-replay.log`): PASS toàn bộ như #66?.
- Xác nhận trong watcher poll 10, 15:04:46Z, exit 0
  (`t5-postboot-b67-poll10.log`); xác nhận cuối 15:06:05Z, exit 0
  (`t5-postboot-b67-final.log`). PASS ỔN ĐỊNH, boot vẫn sống tới cuối
  lượt T5.
- Cờ `POSTBOOT_PASS` HIỆN TẠI trong `round123-t5/` là cho boot #67?
  (boot_id 94e29be5…). Cờ `POSTBOOT_FAIL` cho #67? đã đánh dấu hết hiệu
  lực. Gate-waiters đọc cờ theo boot_id, không đọc PASS cũ của #66?.

## 3. Replay #65? — KHÔNG tự hoàn thành (kiểm từ bằng chứng trên đĩa)

> Nhiệm vụ đợt 123 yêu cầu T5 kiểm: replay #65 "kẹt ở 599 dòng dpkg từ
> ~13:27Z, chưa rõ có tự xong sau đó không". Đáp án: KHÔNG — nó dừng ở
> ~14:01Z khi còn thiếu 2 gói, không bao giờ PASS.

### 3.1 Bằng chứng từ build-loop-log (T9 + T4 đợt 122 — nguồn chính)

- Boot #65?: btime 12:53:25Z, boot_id
  `fbc42445-8967-473e-bab7-d690d49ce13a`, gap #64?→#65? 1h48m07s.
  Replay khởi động lại từ đầu (dpkg configure 12:54:14/15Z).
- T9 gate0-wait (10 poll, 12:56–13:14Z): dpkg 2 → 279 dòng, apt-get pid
  6642 vẫn chạy lúc dừng theo ngân sách (hạn mềm 13:15Z). Chưa xong lúc
  đó — nhưng ĐANG TIẾN TRIỂN.
- T4 att3 (driver 13:04:52–14:04:55Z): replay cài thật trong lúc chờ
  (GST 0 → 3 → 106 → 119 file; pocketsphinx-en-us 13:55:10Z;
  gstreamer1.0-tools 14:01:09Z). Kiểm 14:06:06Z: **0 apt/dpkg chạy,
  dpkg.log im từ 14:01:09Z**, postboot GẦN ĐẠT (wrapper PASS, libs PASS
  đủ 5, GST thư mục thật 119 file, isomp4 đủ; chỉ thiếu libav + apt
  thiếu 2 gói: gstreamer1.0-plugins-bad, gstreamer1.0-libav). Không có
  watcher nào ghi cờ cho boot #65 (T5 đợt 122 đã xong trên #64) → T4
  DEFER-POSTBOOT.
- MÂU THUẪN CẦN GHI RÕ: tóm tắt T4 "dpkg.log 2 → 599 dòng nhưng kẹt ở
  599 từ ~13:27Z" KHÔNG khớp với chi tiết att3 (cài đặt có timestamp
  13:55:10Z và 14:01:09Z — sau 13:27Z). Nếu dpkg.log thật sự kẹt ở 599
  dòng từ 13:27Z thì không thể có entry cài đặt lúc 14:01:09Z. Kết luận:
  số 599 là một lần đọc giữa chừng đã cũ (hoặc đếm sai); chi tiết att3
  có timestamp mới là chuẩn. Replay #65 TIẾN TRIỂN tới 14:01:09Z rồi
  DỪNG (wrapper thoát khi còn thiếu 2 gói), không phải kẹt từ 13:27Z.

### 3.2 Bằng chứng từ đĩa hiện tại (boot #67?)

- `/var/log/dpkg.log` trên boot hiện tại chỉ có 2 dòng của boot #67?
  (rootfs rebuild mỗi boot — log của #65? đã mất cùng rootfs, như mọi
  boot trước). `/var/log/apt` KHÔNG TỒN TẠI (như mọi boot).
- `/var/cache/apt/archives`: file .deb mới nhất theo mtime là
  2026-11-12 (libc6) — KHÔNG có .deb nào tải ngày 16/11. Các gói replay
  #65 cài được lấy từ cache cũ (vd gstreamer .deb ngày 10/11, 01/10) —
  phù hợp với cơ chế cache-first của replay, không phải bằng chứng
  replay không chạy.
- Ledger `/var/lib/hatch/os-intent/ledger.jsonl` (mtime 10:42:05Z
  16/11) CÓ CHỨA cả 2 gói thiếu (`gstreamer1.0-plugins-bad`,
  `gstreamer1.0-libav`) — replay ĐÁNG LẼ phải cài chúng. Cache có
  `gstreamer1.0-plugins-bad_1.24.2-1ubuntu4_amd64.deb` nhưng KHÔNG có
  file .deb `gstreamer1.0-libav` nào — giải thích được một phần cho
  libav (phải tải qua mạng sau `apt-get update`), nhưng KHÔNG giải
  thích được plugins-bad (đã có sẵn trong cache mà vẫn không cài).
- **Kết luận:** nguyên nhân replay #65 dừng khi còn thiếu 2 gói KHÔNG
  xác định được từ đĩa hiện tại (dpkg.log của #65 đã mất; apt
  history.log không bao giờ tồn tại). Không suy đoán thêm. Nếu các
  replay sau cũng dừng ở đúng 2 gói này thì đó là mẫu hình cần điều tra
  (xem §10 mục 1).

### 3.3 Replay #66? — chạy tốt, PASS, boot chết sau 27p36

- Configure 14:35:39Z (boot +10m56); wrapper pid 792 + `apt-get update`
  pid 813 chạy từ 14:35 (methods http/https/gpgv/store sống; store pid
  1739 có 0:03 CPU — có hoạt động).
- `lists/partial`: 33 file, mtime 14:41:35Z — ĐANG FETCH (tiến triển).
  Update xong giữa 14:44:32Z (partial mtime) và 14:45:27Z (pid 813 biến
  mất khỏi `ps`).
- Installs 14:45:33–14:48:19Z: dpkg 2 → 296 (14:45:27Z) → 349
  (14:45:35Z) → 444 (14:45:44Z, watcher start) → 1070 (poll 1)
  → 1370 (poll 2) → 1509 (poll 3, 14:48:44Z). Gói cuối
  gstreamer1.0-tools 14:48:19Z (boot +23m36). apt-get chết sau đó;
  wrapper chết giữa poll 5–6 (14:50:44–14:51:44Z, closing pass xong).
- Bracket hoàn thành: (FAIL 14:45:27Z, PASS 14:48:41Z] theo check-only;
  (14:44Z, 14:48:19Z] theo dpkg.log. Tổng: update ~9–10 phút + installs
  ~3 phút — cùng mẫu với #62? (update ~12', installs ~5', xong +26m19).

### 3.4 Replay #67? — chạy RẤT NHANH, PASS +7m00

- Configure 14:52:59Z (boot +40s — NHANH như #63? +48s); wrapper pid
  782 + `apt-get update` pid 808 chạy từ 14:52; partial 67 file lúc
  +1m34 (đang fetch).
- Installs chạy cực nhanh: dpkg 2 → 1104 (14:54:45Z, watcher start)
  → 1242 (14:55:03Z) → 1509 (poll 1, 14:55:46Z). Gói cuối
  gstreamer1.0-tools 14:55:31Z (boot +3m12). apt-get chết trước poll 1;
  wrapper chết giữa poll 4–5 (14:58:46–14:59:46Z, closing pass xong).
- Bracket hoàn thành: (FAIL 14:53:53Z, PASS 14:59:19Z] theo check-only;
  (14:53:53Z, 14:55:31Z] theo dpkg.log. Nhanh thứ 2 từ trước tới nay
  (sau #48 (0m40, 2m44]); nhanh hơn #61 (0m40, 5m41] và #66? +23m36.
- Chưa rõ vì sao #67? nhanh gấp ~7 lần #66?: cùng ledger, cùng cache,
  cùng mirror. Giả thuyết (chưa kiểm chứng): update của #67? dùng lại
  lists còn nóng từ #66? hoặc mirror/cache ở trạng thái tốt hơn. Ghi
  nhận, không kết luận.

### 3.5 Bảng chế độ lỗi replay (cập nhật tới #67?)

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
| **#65?** | **Chạy nhưng KHÔNG XONG HẲN** — configure +49s, tiến triển tới 14:01:09Z (GST 0→119 file, tools 14:01:09Z) rồi DỪNG khi còn thiếu libav + 2 gói apt; 0 apt/dpkg lúc 14:06:06Z, postboot GẦN ĐẠT; không watcher nào ghi cờ; reboot 14:24:43Z | build-loop-log (T9/T4 đợt 122) + ledger/cache trên đĩa |
| **#66?** | **Chạy tốt, PASS, boot chết sớm** — configure +10m56, update ~9–10', installs ~3', xong +23m36 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +23m58; boot CHẾT 14:52:19Z sau chỉ 27p36 | dpkg.log + watcher 7 poll + POSTBOOT_PASS (đã SUPERSEDED) |
| **#67?** | **Chạy RẤT NHANH** — configure +40s, xong +3m12 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +7m00, xác nhận exit 0 ở poll 10 + cuối; boot vẫn sống | dpkg.log + watcher 10 poll + POSTBOOT_PASS (hiện tại) |

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 09:26Z (boot #63?, ~34' tuổi) | 5436 | sau --repair PASS |
| T5, 09:56Z (boot #63?, ~64' tuổi) | 5435 | sau --repair PASS (ổn định) |
| T5, 11:38Z (boot #64?, ~33' tuổi) | 4440 | boot MỚI — replay đang chạy, postboot FAIL |
| T5, 12:08Z (boot #64?, poll 30) | 4552 | replay kẹt ở update, postboot FAIL |
| T5, 12:38Z (boot #64?, cuối) | 4552 | replay kẹt ở update, postboot FAIL (ổn định) |
| **T5, 14:43Z (boot #66?, ~19' tuổi)** | **4447** | **boot MỚI — replay đang chạy, postboot FAIL** |
| **T5, 14:53:53Z (boot #67?, ~1m34 tuổi)** | **2830** | **boot MỚI — replay đang chạy, postboot FAIL** |
| **T5, 15:06:05Z (boot #67?, cuối)** | **4533** | **sau replay PASS, postboot PASS (ổn định)** |

- Số 2830 lúc mở #67? là thấp nhất kể từ #63? — nhưng HỒI lên 4533
  trong ~12 phút khi replay xong. Số đo lúc mở boot bị đè tạm thời
  (replay + các luồng khác khởi động cùng lúc chiếm watch), không phải
  suy giảm bền vững. Bài học đo: đừng kết luận xu hướng từ một số đo
  lúc mở duy nhất; cần số đo lúc cuối để đối chiếu.
- Xu hướng dài hạn (số đo lúc cuối lượt mỗi boot): … 5435–5436 (#63?)
  → 4552 (#64?) → 4533 (#67?, #66? không có số cuối vì boot chết).
  Ổn định quanh ~4500 sau #63? — vẫn gấp ~2,8 lần số watch vite thường
  cần (~1586). **Vite thường chạy được trên cả 2 boot.**
- Trần 63747 vẫn đầy ở mức ~59k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.
- RAM khả dụng: #66? 1665 MB (lúc mở) → 3912 MB (lúc PASS, các luồng
  khác chưa bận); #67? 1285 MB (lúc mở) → 1153–1499 MB (poll 1–9) →
  804 MB (poll 10) → 971 MB (cuối). Dao động theo luồng khác đang chạy;
  dù lấy số nào cũng < 6 GB guard — birefnet không thử (đứng theo
  LIMITS gộp). RAM tổng 7934 MB, swap 1023 MB.

### 4.2 Vite — KHÔNG thử lại trong lượt này

- Lý do như đợt 119/120/121/122: headroom đủ chạy vite thường, nhưng thử
  vite không thuộc nhiệm vụ T5 đợt này; các luồng đo tự quyết đường chạy
  của họ theo số đo từng boot.

## 5. Watcher — b66 chết theo reboot (7 poll); b67 dừng sớm sau PASS (10 poll)

### 5.1 Watcher b66 (`t5-wait-replay-b66.sh`, PID 8103/8108)

- Chạy 14:45:44Z → chết theo reboot 14:52:19Z (7 poll, 14:46:44–14:52:44Z).
  Log `t5-wait-replay-b66.log` (7 poll + start): poll 1–2 dpkg 1070 →
  1370 (apt=yes, wrapper=yes); poll 3–7 dpkg ĐÓNG BĂNG 1509 (apt=no từ
  poll 3, wrapper=no từ poll 6 — closing pass xong 14:50:44–14:51:44Z).
- Không có postboot trong watcher (poll 10 chưa tới lúc reboot giết) —
  PASS của #66? chỉ có bằng chứng manual 14:48:41Z + polls 3–7 ổn định.
- Không ghi RESTART cho watcher b66 (không cần — boot đã chết, T5 khởi
  động lại watcher mới cho boot mới, xem §5.2).

### 5.2 Reboot #66?→#67? giữa lượt (14:52:19Z) — phát hiện + xử lý

- Phát hiện 14:53:13Z: boot_id đổi (`9bbda390…` → `94e29be5…`) +
  dpkg.log về 2 dòng + phiên exec sleep của T5 bị SIGTERM cùng lúc
  (runtime restart theo reboot — khớp thời điểm reboot).
- Xử lý ngay: (1) đánh dấu SUPERSEDED lên file `POSTBOOT_PASS` cũ của
  #66? (dòng đầu file, ghi rõ boot chết 14:52:19Z, PASS chỉ có giá trị
  cho boot đã chết); (2) ghi `POSTBOOT_FAIL` MỚI cho #67? (14:54Z) với
  cảnh báo rõ "không đọc PASS cũ"; (3) cập nhật script postboot-check
  lên #67?; (4) khởi động watcher b67 14:54:45Z. Các luồng đo chờ cờ
  `round123-t5/` luôn thấy cờ đúng boot đang sống — không có khoảng
  trống nào mà cờ PASS cũ còn hiệu lực cho boot mới.
- Bài học cho các luồng gate-wait: **cờ PASS phải luôn đọc kèm boot_id
  + btime** — PASS không gắn boot là PASS có thể đã chết (tiền lệ:
  #62? PASS chưa kịp kiểm đã reboot; #66? PASS rồi chết sau 27p36).

### 5.3 Watcher b67 (`t5-wait-replay-b67.sh`, PID 5124/5178) — dừng sớm

- Chạy 14:54:45Z → dừng 15:05:53Z (10 poll, 14:55:46–15:04:46Z). Poll 1:
  dpkg 1509 (apt=no, wrapper=yes); poll 2–10: dpkg ĐÓNG BĂNG 1509
  (wrapper=no từ poll 5). Postboot trong watcher poll 10: exit 0
  (`t5-postboot-b67-poll10.log`). Headroom trong watcher: poll 30 chưa
  tới (dừng ở poll 10) — headroom cuối đo tay 15:06:05Z = 4533.
- DỪNG SỚM có chủ ý (không chạy đủ 60 poll như đợt 121/122): replay đã
  xong từ 14:55:31Z, PASS đã xác nhận 3 lần độc lập (14:59:19Z manual,
  15:04:46Z poll 10, 15:06:05Z cuối), boot ổn định, không reboot mới.
  Chạy tiếp 50 poll chỉ để quan sát một hệ thống đã xong là lãng phí
  phiên — các luồng đo đã có cờ PASS để chạy, T5 kết thúc để T10 gộp
  đợt. Ghi rõ để không ai đọc nhầm "watcher chỉ 10 poll" là watcher
  chết: watcher bị T5 dừng tay sau khi nhiệm vụ hoàn thành, log có dòng
  `WATCHER_STOPPED_EARLY`.
- LỖI VẬN HÀNH: lúc dừng watcher, T5 chạy `pkill -9 -f` với mẫu chứa
  tên script watcher — mẫu đó cũng khớp command line của chính phiên
  exec đang chạy lệnh nên phiên bị SIGKILL (exit 9, lệnh dừng giữa
  chừng; watcher thì chết đúng như ý). Đây là đúng lỗi T4 mắc ở đợt 122
  ("pkill -f tự giết phiên mình → kill bằng PID chính xác") — T5 đã
  đọc bài học đó mà vẫn mắc lại vì vội. Phiên mới kiểm lại bằng PID
  chính xác (5124/5178 đều đã chết) rồi chạy nốt các bước cuối bằng
  lệnh không chứa mẫu tự khớp. Ghi lại để đợt sau khỏi lặp lần 3:
  **không bao giờ `pkill/pgrep -f` với chuỗi xuất hiện trong chính
  lệnh đang chạy; luôn kill bằng PID.**

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa, cả 2 boot)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc kiểm
  trên cả #66? (14:49Z) và #67? (14:59Z) — sạch hoàn toàn (như #64?).
  Không có lock sót từ boot cũ.
- Thư mục queue `hidden_files/vite.lock.queue` có **44 file cooldown**
  (#66?) → **45 file** (#67?) — tăng 1 file mỗi boot (cooldown của các
  luồng đợt 123); đều là cooldown cũ đã hết hạn, không chặn luồng khác,
  không tính là ticket. T5 KHÔNG xóa (không cần; để T6 — chủ mảng lock
  — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối trên #65? là T10-round122
  (13:55:03–14:04:48Z, TICKET/ACQUIRED/RELEASED bình thường); trên #66?
  có T1-round123 (14:50:14Z ACQUIRED port 5590 wait_s=0, 14:50:49Z
  RELEASED hold_s=35 — bình thường); **0 hoạt động nào trên #67? tới
  lúc kiểm cuối** (15:06Z).
- T5 KHÔNG đụng vào lock/queue (không kill vite, không xóa lock tay) —
  đúng luật: hàng đợi FIFO là hành vi thiết kế.

## 7. Luật repair dạng (C) — ĐÁNH GIÁ LẦN ĐẦU (quyết parent đợt 122 §12.4)

> Quyết parent đợt 122 §12 mục 4: PHÊ DUYỆT bổ sung điều kiện repair cho
> chế độ lỗi (C) "sống nhưng kẹt ở apt-get update" — đủ 5 điều kiện
> (postboot FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không probe
> đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi chạy
> --repair một lần có giám sát; hiệu lực từ đợt 123.

### 7.1 Đối chiếu 5 điều kiện trên boot #66? (lúc replay đang chạy, 14:41–14:48Z)

| # | Điều kiện (C) | Kết quả trên #66? | Bằng chứng |
|---|---|---|---|
| (a) | Postboot check-only FAIL tươi | ĐẠT lúc đầu | exit 1 lúc 14:44Z + 14:45:27Z |
| (b) | apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15' VÀ dpkg.log im ≥15' (2 lần đọc cách nhau ≥15') | **KHÔNG ĐẠT** | apt-get pid 813 0% CPU nhưng partial mtime 14:41:35Z (đang fetch) rồi dpkg 2 → 1509 dòng trong ~4 phút — CÓ TIẾN TRIỂN liên tục, không có 2 lần đọc nào cách nhau ≥15' mà dpkg im |
| (c) | Boot ≥60' tuổi HOẶC dpkg im ≥15' | Không đạt lúc quyết (boot ~20') | Moot vì (b) đã không đạt |
| (d) | Dạng (C): dpkg.log chỉ ≤2 dòng hoặc 0 dòng install, lists trống | **KHÔNG ĐẠT** | dpkg.log tăng vọt 2 → 1509 dòng; lists 37–39 file — đây là replay KHỎE, không phải dạng (C) |
| (e) | Không có probe WebKit nào đang chạy trên boot đó | Không kiểm chi tiết (moot) | Không có MiniBrowser/WebKit lúc kiểm đầu; moot vì (b)/(d) đã không đạt |

### 7.2 Đối chiếu trên boot #67? (lúc replay đang chạy, 14:53–14:55Z)

| # | Điều kiện (C) | Kết quả trên #67? | Bằng chứng |
|---|---|---|---|
| (a) | Postboot check-only FAIL tươi | ĐẠT lúc đầu | exit 1 lúc 14:53:53Z + sau sửa |
| (b) | apt 0% CPU qua ≥2 lần kiểm ≥15' + dpkg im ≥15' | **KHÔNG ĐẠT** | Replay xong trong ~3 phút (dpkg 2 → 1509); không có khoảng im nào ≥15' để đo |
| (c) | Boot ≥60' HOẶC dpkg im ≥15' | Không đạt (boot ~3') | Moot |
| (d) | Dạng (C) | **KHÔNG ĐẠT** | dpkg 1509 dòng, GST 269 file — replay khỏe |
| (e) | Không probe đang chạy | Moot | — |

- **Kết luận: luật (C) KHÔNG kích hoạt trên cả 2 boot — KHÔNG có kill
  nào được cân nhắc, KHÔNG có `--repair` nào chạy.** Đây là lần đầu
  luật được đánh giá sau khi có hiệu lực, và kết quả là "no-trigger"
  trên cả 2 boot — đúng thiết kế (luật chỉ kích hoạt khi replay kẹt
  thật). Luật vẫn CHƯA ĐƯỢC THỬ trong đúng kịch bản mục tiêu (dạng (C)
  thật như #64?); lần thử đầu vẫn chờ một boot kẹt thật trong tương lai.
- Ghi rõ để đợt sau khỏi hiểu nhầm "luật (C) đã áp dụng ở đợt 123":
  luật đã ĐÁNH GIÁ (2 lần) nhưng KHÔNG ÁP DỤNG (không đủ điều kiện).

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (2 lần, không đổi logic)

- Lần 1 (#66?, 14:44–14:45Z): md5 `a10b43ea6c5969d22ed190795d377115` →
  `24578b48c91e5508b3702e211aab65d2` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Lần 2 (#67?, 14:54Z): md5 `24578b48c91e5508b3702e211aab65d2` →
  `f684bb6b08ad64bd48d64b0f44dc2807` (ghi trong
  `postboot-check.md5.b67-before` / `postboot-check.md5.b67-after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/119/120/121/
  122, không đổi logic):
  - Header: bổ sung kết quả #64? (dạng (C), luật §8.2 không kích hoạt)
    + đoạn boot #65? (chạy nhưng không xong hẳn, thiếu 2 gói) + đoạn
    boot #66? (PASS rồi chết sau 27p36) + đoạn boot #67? (replay nhanh,
    PASS +7m00, headroom 2830 → 4533).
  - Dòng `say`: `#64? = 2026-11-16 11:05:18Z…` → `#66? = 2026-11-16
    14:24:43Z…` → `#67? = 2026-11-16 14:52:19Z, boot_id 94e29be5-…, sau
    #66? 14:24:43Z — số tạm, chờ T6 đếm lại mù #37`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự `"`
  (dùng `p`/`s` thay dấu phút/giây, như bài học T7 đợt 120 §9).
  `bash -n` OK ngay lần đầu ở cả 2 lần sửa.
- Kiểm chứng: `bash -n` OK (2 lần); chạy kiểm chỉ-đọc sau mỗi lần sửa
  vẫn FAIL exit 1 đúng như kỳ vọng (replay đang chạy), rồi PASS exit 0
  khi replay xong (14:48:41Z #66?, 14:59:19Z #67?).
- Vết nhỏ (không sửa): header comment của script watcher b67 ghi
  "replay khoi dong muon +40s" — sai chữ ("muon" phải là "NHANH", vì
  +40s là khởi động nhanh). Không sửa vì script đang chạy (sửa file
  script bash đang chạy là không an toàn); chỉ là chữ trong comment,
  không ảnh hưởng logic. Đợt sau copy mẫu thì sửa chữ này.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên để parent quyết. `--repair` code mới đã
  chạy sống 1 lần ở #63? (PASS) — lần chạy sau (nếu luật kích hoạt)
  vẫn chạy đúng thứ tự hiện tại (mục 3 GST symlink trước, mục 4 apt
  install sau) trừ khi phương án A được duyệt kèm.

## 9. R9 (a) vẫn mở (nhắc lần 9)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng đợt
  117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #66?→#67? giữa lượt đợt này (14:52:19Z, boot #66? chỉ sống
  27p36) là ví dụ mới nhất: nếu không có T5 đang làm việc live thì cờ
  PASS của #66? có thể đã bị các luồng đo đọc nhầm cho boot mới. T5 đã
  xử lý tay kịp thời (đánh dấu SUPERSEDED + ghi cờ mới trong ~2 phút),
  nhưng R9 (a) mới là đường bắt trường hợp này một cách hệ thống.
  Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại, nhưng không thay thế
  R9 (a).

## 10. Nợ mở sang đợt sau

1. **Replay #65? dừng khi còn thiếu 2 gói — nguyên nhân chưa rõ** (xem
   §3.2): ledger có cả 2 gói; cache có plugins-bad nhưng không có
   gstreamer1.0-libav .deb. Nếu replay ở boot sau cũng dừng ở đúng 2
   gói này thì đó là mẫu hình — cần điều tra (ledger order? install
   fail im lặng? `apt-get update` một lần mỗi pass không đủ?). Hiện
   tại chỉ là 1 mẫu (#65?), chưa đủ kết luận.
2. **Boot #67? đang sống + PASS — các luồng đo đợt 123 dùng cờ này.**
   Nếu #67? cũng chết sớm như #66? (27p36) thì T5 đợt sau phải làm lại
   từ đầu (khởi động lại watcher + cờ mới). Không có gì đảm bảo boot
   sống lâu — tuổi thọ boot gần đây: #64? ~1h47, #65? ~1h31, #66? 27p36.
3. **Headroom: 2830 lúc mở #67? → 4533 lúc cuối** — số đo lúc mở bị đè
   tạm thời; đừng kết luận xu hướng từ một số đo lúc mở. Trần 63747 cần
   can thiệp host (dọn watch ngoài cell / tăng trần) — ngoài tầm luồng
   này.
4. **Symlink GST → debroot từ repair #63? đã mất theo reboot**
   (ephemeral, như mọi lần) — trên #66?/#67? thư mục GST hệ thống là
   thư mục THẬT do apt cài (269 file), không cần symlink. Phương án A/B
   (R9 §6.3) chờ parent duyệt.
5. **Số thứ tự boot #65?/#66?/#67? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (gap #64→#65 1h48m07s, #65→#66 1h31m18s, #66→#67 27m36s; nếu T6 đếm
   khác, LIMITS này + script postboot-check cần sửa lại số — boot_id +
   btime không đổi).
6. **R9 (a) vẫn chờ user (nhắc lần 9).**
7. **Cooldown file tích lũy (44 → 45 file)** — chưa có cơ chế dọn
   cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock (T6 quyết).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 122 §10–§12: E4 lô
   lượt 3–4 trên cây BASELINE (prereg E4 phải ghi rõ thư mục cờ của
   luồng hạ tầng ĐỢT HIỆN TẠI — đợt 123 là `round123-t5/`); H3f đã gỡ,
   không apply lại; leg B theo DEF PSI v0.1; G1 chờ user quyết + mù
   #22/#28–#31/#35/#39 chờ user quyết; birefnet (chỉ thử lại khi RAM
   đổi, u2net là fallback chính thức); ci-security.yml vẫn 403 chờ user;
   TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push khi user
   chưa nhắn "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` md5 lúc T5 kiểm (14:49Z):
  `03bf029f09b8890b285eacc10a02172b` — KHỚP baseline của đợt 123
  (round-in-progress.md). **T5 KHÔNG sửa preview.tsx.**
- `media.ts` md5 `2c384ed13703809d5e999311147745e7` khớp baseline,
  không đổi.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau cả 2 lần sửa) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  668–4570 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #66?: FAIL 2 lần (try1 + sau sửa), PASS 1 lần (sau replay)
  — rồi boot chết. Postboot #67?: FAIL 2 lần (try1 + sau sửa), PASS 3
  lần (sau replay + poll 10 + cuối) — boot vẫn sống.
- Watcher b66: 7/60 poll (chết theo reboot 14:52:19Z). Watcher b67:
  10/60 poll (T5 dừng sớm sau PASS xác nhận — xem §5.3).
- Replay #65?: KHÔNG tự xong (dừng ~14:01Z, thiếu 2 gói). Replay #66?:
  XONG +23m36, PASS +23m58, boot chết sau 27p36. Replay #67?: XONG
  +3m12, PASS +7m00 — nhanh thứ 2 từ trước tới nay.
- **Repair (cả §8.2 lẫn luật (C)): KHÔNG CHẠY** — luật (C) đánh giá
  lần đầu, không kích hoạt trên cả 2 boot (điều kiện (b)/(d) không đạt:
  cả 2 replay đều tiến triển).
- Headroom: 4447 (#66? lúc mở) → 2830 (#67? lúc mở) → **4533 (#67?
  cuối)** — hồi sau khi replay xong.
- Stale vite.lock: không có (lock dir không tồn tại cả 2 boot; queue
  chỉ còn cooldown cũ 44 → 45 file).
- Reboot mới: CÓ — 1 lần giữa lượt (#66?→#67? 14:52:19Z). T5 đã xử lý
  (SUPERSEDED + cờ mới + watcher mới trong ~2 phút).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND123_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  tham chiếu #65?/#66?/#67? trong header + dòng `say`; md5
  `a10b43ea…` → `24578b48…` → `f684bb6b…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round123-t5/` (log
  watcher b66 7 poll + b67 10 poll, log postboot try1/after-edit/
  after-replay/poll10/final cho cả 2 boot, log headroom now/final,
  md5 trước/sau của postboot-check (2 lần), `POSTBOOT_PASS` (cờ hiện
  tại — cho boot #67?, PASS 14:59:19Z), `POSTBOOT_FAIL` (đã hết hiệu
  lực — lịch sử FAIL lúc mở #67?), `t5-initial-state.md`
  (gồm cả 2 boot)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round123-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round123-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
