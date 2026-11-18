# PHASE9_ROUND126_T5_INFRA_LIMITS — Boot #71? replay KHỞI ĐỘNG MUỘN (+9m59s) nhưng XONG NHANH (+12m05s), PASS +18m17s — luật §8.2 dạng (B) ngưỡng 10' áp dụng lần đầu: đánh giá 8/8 poll, KHÔNG kích hoạt

> Luồng T5, đợt 126, lượt cron 06:35 +07 17/11/2026 (bắt đầu ~23:40Z trên
> boot #71?, kết thúc ~23:55Z, cùng boot — KHÔNG reboot trong lượt).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 125 §10–§11 + quyết parent đợt 125 §12 (DEF v0.3;
> leg dò ~45–55%; mù #44 D kiểm sâu một lần + #45 probe; E4 lượt 9+10;
> luật prune cooldown ĐÃ PHÊ DUYỆT; 25 file config KHÔNG CẦN LÀM GÌ;
> R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn) + quyết §12(b) MỚI:
> §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm mà không cài"; ngưỡng chờ
> dạng (B) dpkg im ≥10 phút (thay vì 15); luồng hạ tầng đánh giá §8.2
> ở MỖI poll khi dpkg đóng băng; hiệu lực từ đợt 126.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #71? (TẠM) ĐANG SỐNG — replay XONG TRỌN VẸN, PASS.**
   btime 23:25:41Z, boot_id `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, sau
   #70? 2h31m22s. Replay khởi động MUỘN (configure 23:35:40Z, boot
   +9m59s) nhưng chạy NHANH: installs 23:36:06–23:37:46Z, xong
   23:37:46Z (boot +12m05s), dpkg 2 → 1509 dòng, 217 installs, gói
   cuối gstreamer1.0-tools. Postboot PASS 10/10 lần kiểm (try1 +
   watcher 8 poll + final), 0 lần FAIL trên boot này. Cờ
   `POSTBOOT_PASS` cho #71? đã viết 23:43:58Z (đúng boot_id), xác
   nhận lại PASS 23:54:29Z (boot +28m48s).
2. **Boot #70? chết trong khung (21:48Z, 23:25:41Z]** — sau mốc T10
   đóng đợt 125 (21:48Z), trước btime #71?. journal/wtmp chỉ còn
   boot hiện tại nên không kẹp hẹp hơn. #70? sống ít nhất 53m41s
   (20:54:19Z → 21:48Z).
3. **Luật §8.2 dạng (B) ngưỡng 10' — ÁP DỤNG LẦN ĐẦU: đánh giá 8/8
   poll watcher, KHÔNG KÍCH HOẠT.** Điều kiện thời gian (2b)/(3)
   ĐẠT từ poll 3 (dpkg im ≥600s lúc 23:47:46Z) — ngưỡng siết mới
   đã sống thật — nhưng điều kiện (1) postboot FAIL và (4) dạng
   (B) đều KHÔNG đạt vì replay đã xong trọn vẹn + postboot PASS.
   Luật KHÔNG bắn nhầm lên replay khỏe đã xong. Xem §7.
4. **2 gói từng thiếu ở #65? (libav 23:36:52Z, plugins-bad 23:36:58Z)
   ĐỀU ĐƯỢC CÀI** (`dpkg -l` ii cả 2) — mẫu thiếu 2 gói ở #65?
   không lặp lại lần thứ 3 liên tiếp (#68?, #70?, #71? đều đủ).
5. **Headroom inotify: 3451 (mở) → 3434 (cuối)** — gần như đứng
   yên (−17), vẫn ~2,2 lần số watch vite thường cần (~1586). Thấp
   hơn cuối #70? (3645). Vite thường chạy được trên boot này.
6. **RAM khả dụng dao động mạnh:** 1247 MB (mở 23:40Z) → 834–2551
   MB trong watcher 8 poll (thấp nhất 834 MB poll 1 — thấp nhất T5
   từng ghi, dưới mức 987 MB đợt 125) → 1666 MB (cuối). Dù lấy số
   nào cũng < 6 GB guard — birefnet không thử.
7. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI
   lúc mở; T8-round126 acquire port 5490 lúc 23:52:10Z (wait_s=15)
   và vẫn giữ lúc kiểm cuối — đang dùng thật, không phải stale.
   Queue cooldown 56 → 58 file (+2). T5 KHÔNG đụng lock/queue.
8. **Sửa `postboot-check.sh` 1 lần trong lượt** (md5 `ea7735c2…` →
   `e986ec78…`): chỉ đổi tham chiếu boot (header + dòng `say`);
   `bash -n` OK; try1 sau sửa PASS ngay lần đầu.
9. **Số thứ tự boot #71? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 126 đang chạy song song).

## 2. Postboot — #71? PASS 10/10, 0 FAIL

- Boot #71?: 2026-11-16 23:25:41Z (btime kernel 1794871541;
  `uptime -s` đồng ý; journal first entry 23:25:52Z, chênh +11 s —
  cùng mẫu các boot trước; boot_id
  `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, sau #70? 20:54:19Z (gap
  2h31m22s). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 23:25Z.
- try1 23:43:58Z (boot +18m17s), exit 0 (`t5-postboot-b71-try1.log`):
  PASS wrapper (K1), PASS libs, PASS GST (thư mục thật, 269 file =
  debroot), PASS apt 11/11.
- Watcher b71 poll 1–8 (23:46:08–23:53:14Z): postboot exit 0 MỌI
  poll.
- Final 23:54:29Z (boot +28m48s), exit 0 (`t5-postboot-b71-final.log`):
  PASS lại toàn bộ.
- Tổng: PASS 10/10 lần kiểm trên #71?, 0 lần FAIL.
- LƯU Ý: PASS lần đầu (+18m17s) đến MUỘN so với replay xong
  (+12m05s) vì T5 mở lượt lúc boot đã +14m — không phải replay
  chậm. Không có lần FAIL live nào trên #71? (lần kiểm đầu đã PASS).
  Bracket replay đầy đủ là (9m59s, 12m05s] theo dpkg.log, không
  phải tới lúc PASS.

## 3. Replay — #71? khởi động muộn, xong nhanh, trọn vẹn

### 3.1 Bracket #71? — (9m59s, 12m05s], xong trọn vẹn

- Configure 23:35:40Z (boot +9m59s — KHỞI ĐỘNG MUỘN: muộn hơn hẳn
  #70? +43s, #68? +1m51, #67? +40s; cùng nhóm muộn với #54 +47'14"
  và #64? +30'21" nhưng nhẹ hơn nhiều). 0 hoạt động dpkg nào từ
  boot tới 23:35:40Z — khoảng lặng ~10 phút đầu boot không có dấu
  vết trong dpkg.log (không điều tra thêm từ trong VM).
- Archives unpack 23:36:06Z; trigproc libc-bin 23:36:07Z (khớp quan
  sát lúc mở lượt 23:36:28Z "replay đang chạy, không đóng băng").
- Installs 23:36:06–23:37:46Z: dpkg 2 → 1509 dòng trong ~2m06s
  (217 installs); gói cuối gstreamer1.0-tools 23:37:46Z (boot
  +12m05s). 0 apt/dpkg chạy lúc kiểm cuối (pgrep -x: không có);
  lists 37 file, partial 0 file (update đã xong).
- Bracket hoàn thành: (9m59s, 12m05s] theo dpkg.log. Khởi động muộn
  nhưng tổng thời gian xong (+12m05s) vẫn nhanh — nhanh hơn #54
  (+52'30"), #64? (không xong), #47 (+27,7'); chậm hơn #70?
  (+7m17s), #68? (+4m51s), #67? (+3m12s), #48 (+2m44s).
- libav cài 23:36:52Z (boot +11m11s), plugins-bad 23:36:58Z (boot
  +11m17s) — cả 2 gói từng thiếu ở #65? đều có mặt, `dpkg -l` ii.
- Cập nhật bảng chế độ lỗi replay (xem §3.2).

### 3.2 Bảng chế độ lỗi replay (cập nhật tới #71?)

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
| #69? | **CHẠM MÀ KHÔNG CÀI (lần 2)** — configure SỚM +27s, rồi im hoàn toàn; dpkg đóng băng 2 dòng suốt ~19' đời boot; 0 apt/dpkg mọi lần kiểm; postboot FAIL 14/14; boot CHẾT ~20:54:4xZ khi ~19–20' tuổi, TRƯỚC khi kịp đánh giá luật (C) đầy đủ | dpkg.log + postboot try1/after-edit + watcher b69 12 poll |
| #70? | **Chạy NHANH, PASS, xong trọn vẹn** — configure +43s, xong +7m17 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +5m02 (trước khi replay xong hẳn — 11/11 gói đã đủ), xác nhận lại +9m01; 2 gói từng thiếu ở #65? đều được cài (libav 20:57:40Z, plugins-bad 20:58:15Z); boot vẫn sống | dpkg.log + postboot poll3/final + watcher b70 3 poll |
| **#71?** | **Chạy MUỘN nhưng XONG NHANH, PASS** — configure MUỘN +9m59s (lặng ~10' đầu boot), installs chỉ 2m06s, xong +12m05 (1509 dòng, gói cuối gstreamer1.0-tools); PASS exit 0 lúc +18m17 (lần kiểm đầu đã PASS — không có FAIL live); 2 gói từng thiếu ở #65? đều được cài (libav 23:36:52Z, plugins-bad 23:36:58Z); boot vẫn sống | dpkg.log + postboot try1/poll1–8/final + watcher b71 8 poll |

- Mẫu hình mới: configure muộn (+9m59s) nhưng installs nhanh
  (2m06s) — tổng +12m05s vẫn nhanh. Khác #54/#64? (muộn + chậm)
  và khác #62? (muộn + xong muộn +26'19"). Chưa rõ nguyên nhân
  lặng ~10' đầu boot; không điều tra thêm từ trong VM.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 17:41Z (boot #68?, ~7' tuổi) | 4438 | sau replay PASS, postboot PASS |
| T5, 18:00Z (boot #68?, cuối) | 4415 | sau watcher 15 poll, postboot PASS (ổn định) |
| T5, 20:42Z (boot #69?, ~7' tuổi) | 4318 | boot MỚI — replay không tới, postboot FAIL |
| T5, 21:03Z (boot #70?, ~9' tuổi) | 3645 | sau replay PASS, postboot PASS (cuối lượt) |
| **T5, 23:40Z (boot #71?, ~14' tuổi)** | **3451** | **mở lượt — replay vừa xong, postboot chưa kiểm** |
| **T5, 23:54Z (boot #71?, ~28' tuổi)** | **3434** | **cuối lượt — sau watcher 8 poll, postboot PASS** |

- Headroom gần như đứng yên trong lượt (−17) nhưng tiếp tục xu
  hướng giảm dài hạn qua các boot: 4438 → 4318 → 3645 → 3451 →
  3434. Vẫn gấp ~2,2 lần số watch vite thường cần (~1586).
  **Vite thường chạy được trên boot này.**
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 23:40Z | 1247 MB | lúc mở, trên #71? (theo brief: ~1443 MB lúc 23:36Z) |
| 23:42:39Z | 1669 MB | trạng thái ban đầu (t5-initial-state.md) |
| 23:46–23:53Z (watcher b71, 8 poll) | 834 → 2551 → 1678 → 1423 → 1540 → 1422 → 1708 → 1513 MB | dao động mạnh theo luồng khác; thấp nhất 834 MB (poll 1), cao nhất 2551 MB (poll 2) |
| 23:54:29Z | 1666 MB | cuối lượt (final) |

- Dao động rất mạnh theo luồng khác đang chạy (biên độ ~1700 MB
  trong 8 phút); mức thấp nhất 834 MB (poll 1) là thấp nhất T5 từng
  ghi (kỷ lục cũ 987 MB, poll 11 b69 đợt 125). T9 điều tra RAM ghim
  trong 30' đầu lượt — nhiệm vụ của T9, T5 chỉ ghi số đo của mình.
  Dù lấy số nào cũng < 6 GB guard — birefnet không thử (đứng theo
  LIMITS gộp).

## 5. Watcher — b71 8/8 poll PASS, ổn định, không reboot trong lượt

### 5.1 Watcher b71 (`t5-wait-replay-b71.sh`, PID 14437)

- Chạy 23:46:07Z → 23:54:15Z (8 poll, 23:46:08–23:53:14Z + sleep
  cuối), tự kết thúc `reason=done_stable_8polls`, exit 0. Khác
  watcher b70 (dừng ngay khi PASS): b71 chạy đủ 8 poll để xác nhận
  ổn định + đánh giá §8.2 (B) ở MỖI poll theo quyết parent mới.
- MỌI poll: dpkg=1509 (không đổi từ poll 2 trở đi — frozen=yes;
  poll 1 frozen=no chỉ vì là lần đọc baseline đầu tiên), apt=0,
  apt-get=0, dpkgproc=0, wrapper=0, lists=37, gst_sys=269,
  postboot_exit=0.
- silent_s (từ dòng cuối dpkg.log 23:37:46Z): 502 → 563 → 624 →
  684 → 745 → 806 → 867 → 928 giây. Ngưỡng 600s (10') vượt qua
  giữa poll 2 (563s) và poll 3 (624s), tức lúc 23:47:46Z.
- minibrowser: 1, 0, 1, 1, 1, 1, 2, 1 — có probe WebKit của luồng
  khác đang chạy trong hầu hết các poll (T9 lượt yên / luồng đo
  khác dùng cờ PASS; T5 không đụng tới, chỉ ghi nhận cho điều
  kiện (5) §8.2).
- Cờ `POSTBOOT_PASS` đã có từ try1 nên watcher chỉ ghi
  `FLAG_EXISTS already` mỗi poll — không ghi đè, không ghi cờ
  trùng.
- KHÔNG lặp lỗi vận hành đợt 122/123: không dùng `pkill -f` với mẫu
  chứa tên script watcher — watcher tự kết thúc, không cần kill.
  T5 không kill gì trong lượt này.

### 5.2 Không có reboot trong lượt T5

- Boot #71? sống liên tục từ 23:25:41Z tới cuối lượt T5 (23:54:29Z,
  boot +28m48s). Cờ `POSTBOOT_PASS` cho #71? không cần đánh dấu
  SUPERSEDED; cờ cho #70? ở `round125-t5/` vẫn là của boot cũ
  (không dùng cho đợt này — các luồng đo đợt 126 gate bằng cờ
  `round126-t5/`).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt 23:40Z/23:42Z — sạch hoàn toàn (như #64?, #66?,
  #67?, #68?, #69?, #70?).
- Lúc kiểm cuối 23:54Z, thư mục lock ĐÃ CÓ (chứa `owner`): T8
  đợt 126 acquire port 5490 lúc 23:52:10Z (`t8-round126 TICKET` +
  `ACQUIRED port=5490 wait_s=15`) và vẫn giữ lúc kiểm cuối — đang
  dùng thật, KHÔNG phải stale. T5 KHÔNG đụng vào lock (không kill
  vite, không xóa lock tay).
- Thư mục queue `hidden_files/vite.lock.queue` có **58 file
  cooldown** (tăng từ 56 lúc mở — +2 trong lượt; đều là cooldown
  cũ, không chặn luồng khác, không tính là ticket). Luật prune
  cooldown ĐÃ ĐƯỢC PHÊ DUYỆT (quyết parent §12(c)) — việc prune
  là của T6, T5 chỉ ghi số.
- `vite-lock-v2.log`: hoạt động cuối là T8-round126 trên boot này
  (23:52:10Z); 0 hoạt động nào trên boot #70? sau khi T5 đợt 125
  đóng (log chỉ giữ tới boot hiện tại — hoạt động cũ đã mất theo
  rebuild, như mọi lần).

## 7. Luật §8.2 dạng (B) ngưỡng 10' — ĐÁNH GIÁ Ở MỖI POLL (lần đầu áp dụng)

> Quyết parent đợt 125 §12(b): LÀM RÕ + SIẾT policy repair "chạm mà
> không cài" — §8.2 dạng (B) VỐN ĐÃ bao chế độ này (T5 đợt 125 chỉ
> đánh giá luật (C) nên bỏ sót); dạng (B) ngưỡng chờ dpkg im ≥10
> phút (thay vì 15); luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg
> đóng băng; hiệu lực từ đợt 126.
>
> 5 điều kiện §8.2 (quyết parent đợt 120 §12 mục 3; chi tiết ở
> LIMITS T5 đợt 121 §7): (1) postboot check-only FAIL tươi (<10'
> trước quyết); (2) replay ĐÃ CHẾT — cả 3 dấu hiệu: (a) 0 process
> apt-get/dpkg/wrapper; (b) dpkg.log không tăng ≥10' (2 lần đọc
> cách nhau ≥10'); (c) lock dpkg rảnh; (3) ngưỡng chờ: boot ≥60'
> tuổi HOẶC dpkg im ≥15' — **với dạng (B) từ đợt 126: dpkg im ≥10'**;
> (4) dạng lỗi (A) "tới nhưng thiếu GST" HOẶC (B) "chạm mà không
> cài"; (5) không có luồng đo WebKit nào đang chạy probe trên boot đó.

### 7.1 Đối chiếu 5 điều kiện ở MỖI poll watcher b71 (dpkg đóng băng)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b) im ≥10' | (3) chờ ≥10' | (4) dạng (B) | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 23:46:08Z | 502s | no (exit 0) | yes | no | no | no | no (mini=1) | **NO** |
| 2 | 23:47:09Z | 563s | no | yes | no | no | no | yes (mini=0) | **NO** |
| 3 | 23:48:09Z | 624s | no | yes | **yes** | **yes** | no | no (mini=1) | **NO** |
| 4 | 23:49:10Z | 684s | no | yes | **yes** | **yes** | no | no (mini=1) | **NO** |
| 5 | 23:50:11Z | 745s | no | yes | **yes** | **yes** | no | no (mini=1) | **NO** |
| 6 | 23:51:12Z | 806s | no | yes | **yes** | **yes** | no | no (mini=1) | **NO** |
| 7 | 23:52:13Z | 867s | no | yes | **yes** | **yes** | no | no (mini=2) | **NO** |
| 8 | 23:53:14Z | 928s | no | yes | **yes** | **yes** | no | no (mini=1) | **NO** |

- **Kết luận: 8/8 lần đánh giá, 0 lần kích hoạt.** Điều kiện thời
  gian (2b)/(3) ĐẠT từ poll 3 trở đi (dpkg im vượt 600s lúc
  23:47:46Z — ngưỡng siết 10' đã sống thật trong lần áp dụng đầu
  tiên) nhưng điều kiện (1) và (4) KHÔNG BAO GIỜ đạt: postboot
  PASS mọi lần kiểm (exit 0) và replay đã xong trọn vẹn (1509
  dòng, 217 installs, gói cuối gstreamer1.0-tools, đủ 11 gói,
  GST 269 file) — KHÔNG phải dạng (B) "chạm mà không cài" (2
  dòng configure rồi im, 0 install, postboot FAIL).
- **Luật mới KHÔNG bắn nhầm:** trên replay khỏe đã xong, dù dpkg
  im >10' và 0 process, luật vẫn đứng yên vì thiếu (1)+(4). Đây
  chính là điểm khác biệt giữa "đóng băng vì đã xong" và "đóng
  băng vì đã chết" — watcher phân biệt bằng postboot + số dòng
  dpkg, không chỉ bằng thời gian im.
- **Ghi chú phương pháp (trung thực):**
  - (2b) được đánh giá bằng mốc thời gian dòng cuối của chính
    dpkg.log (23:37:46Z) + số dòng đọc live mỗi poll (đều 1509):
    log không tăng trong ≥10' tính từ dòng cuối. Không dựa vào 2
    lần đọc tay cách nhau đúng 10' — nhưng bản chất điều kiện
    ("log không tăng ≥10'") được chứng minh bằng chính timestamp
    của log.
  - (2c) lock dpkg rảnh: KHÔNG kiểm bằng `fuser` trong lượt này
    (moot — (1)/(4) đã chặn trigger; và 0 apt/dpkg/wrapper chạy
    thì lock không thể bị giữ bởi replay).
  - (5) KHÔNG đạt ở 7/8 poll vì MiniBrowser của luồng khác đang
    chạy (1–2 process) — kể cả trong kịch bản giả định postboot
    FAIL, điều kiện (5) cũng sẽ chặn trigger khi probe khác đang
    chạy. Đây là hành vi đúng thiết kế, không phải lỗi.
  - Poll 1 ghi frozen=no chỉ vì là lần đọc baseline đầu tiên
    (chưa có lần đọc trước để so); dòng EVAL vẫn được ghi đầy đủ
    — không poll nào bị bỏ sót đánh giá.
- **Luật (C) ("sống nhưng kẹt ở update"):** không đánh giá riêng
  trong lượt này — không áp dụng vì replay đã xong (không có tiến
  trình update nào kẹt). Quyết parent §12(b) đã làm rõ dạng (B)
  là dạng cần đánh giá cho chế độ "chạm mà không cài"; luật (C)
  vẫn đứng cho chế độ kẹt update nếu xuất hiện ở boot sau.
- **Không có kill nào được cân nhắc, không có `--repair` nào chạy.**
  Đây là lần đầu luật §8.2 dạng (B) với ngưỡng 10' được đánh giá
  theo đúng quy trình mới (mỗi poll khi dpkg đóng băng) — kết quả
  "không kích hoạt" là đúng thiết kế.

### 7.2 Chính sách repair 15 phút cũ — không cần viện tới

- Chính sách đợt 117 §13 Quyết 9 viết cho chế độ "replay không tới
  hẳn" (#45/#53). Trên #71? replay đã tới và xong nên chính sách
  này không áp dụng. Quyết parent §12(b) đã thay thế nhu cầu mở
  rộng policy cho chế độ "chạm mà không cài" — §8.2 dạng (B) vốn
  đã bao chế độ này, chỉ cần siết ngưỡng + đánh giá mỗi poll (đã
  làm ở §7.1).

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Md5 `ea7735c279d2c69ef24d09da726ce84b` →
  `e986ec78e979692ba2c2f5ce25cba31` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8/T8/T7-đợt-118/
  119/120/121/122/123/124/125, không đổi logic):
  - Header: bổ sung đoạn boot #71? (khởi động muộn +9m59s, xong
    +12m05s, 2 gói từng thiếu đều được cài, luật §8.2 (B) ngưỡng
    10' đánh giá mỗi poll).
  - Dòng `say`: `#70? = 2026-11-16 20:54:19Z…` → `#71? =
    2026-11-16 23:25:41Z…`.
- **Không lặp sự cố đợt 120:** dòng `say` mới không chứa ký tự `"`
  (dùng `p`/`s` thay dấu phút/giây, như bài học T7 đợt 120 §9).
  `bash -n` OK ngay lần đầu.
- Kiểm chứng: sau sửa, try1 PASS exit 0 ngay lần đầu (23:43:58Z)
  + watcher 8 poll PASS + final PASS — logic không đổi đã được
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
- Reboot #70?→#71? giữa đợt 125 đóng (21:48Z) và lượt này (23:25:41Z)
  là ví dụ mới nhất cho thấy R9 (a) vẫn có giá trị: T5 phải tự phát
  hiện boot mới + cập nhật script + ghi cờ mới cho #71? trong ~18
  phút sau boot (lượt mở 23:35:51Z, cờ PASS 23:43:58Z). Vá §8.4(ii)
  + cờ gắn boot_id đã giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 12.

## 10. Nợ mở sang đợt sau

1. **Boot #71? đang sống + PASS — các luồng đo đợt 126 dùng cờ này**
   (`round126-t5/POSTBOOT_PASS`, boot_id ff7afbbb…, PASS 23:43:58Z,
   xác nhận lại 23:54:29Z). Nếu #71? cũng chết sớm như #69?
   (~19–20') hoặc #66? (27p36) thì T5 đợt sau phải làm lại từ đầu
   (khởi động lại watcher + cờ mới). Không có gì đảm bảo boot sống
   lâu — tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68?
   3h01m20, #69? ~19–20', #70? ≥53m41s (chết trong khung 1h37m41s),
   #71? chưa biết (sống ≥28m48s tới cuối lượt T5).
2. **Khung giờ #70? chết (21:48Z, 23:25:41Z] chưa kẹp hẹp hơn** —
   journal/wtmp chỉ giữ boot hiện tại; không có cách kẹp từ trong VM.
3. **Headroom tiếp tục giảm dài hạn:** 4438 → 4318 → 3645 → 3451 →
   3434. Trần 63747 cần can thiệp host (dọn watch ngoài cell / tăng
   trần) — ngoài tầm luồng này.
4. **RAM thấp nhất mới 834 MB (poll 1)** — dao động mạnh theo luồng
   khác; T9 theo dõi RAM ghim (nhiệm vụ T9).
5. **Symlink GST → debroot từ repair #63? đã mất theo reboot**
   (ephemeral, như mọi lần) — trên #71? thư mục GST hệ thống là thư
   mục THẬT do apt cài (269 file), không cần symlink. Phương án A/B
   (R9 §6.3) chờ parent duyệt.
6. **Số thứ tự boot #71? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 126 đang chạy). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi.
7. **R9 (a) vẫn chờ user (nhắc lần 12).**
8. **Cooldown file tích lũy (56 → 58 file)** — luật prune ĐÃ PHÊ
   DUYỆT (quyết parent §12(c)); việc prune là của T6.
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 125 §10–§11: E4
   lượt 9+10 trên cây BASELINE đợt 126; leg B theo DEF v0.3 (sau
   khi T4 viết); G1 chờ user quyết + mù #22/#28–#31/#35/#39/#40 chờ
   user quyết (mù #39 J + mù #40 B + mù #43 đã CHẤP NHẬN ĐỂ MỞ;
   mù #44 D kiểm sâu một lần + #45 probe ở đợt 126); birefnet (chỉ
   thử lại khi RAM đổi, u2net là fallback chính thức);
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
   gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx` / `media.ts`: KHÔNG kiểm md5 trong luồng này (T5 không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS). Baseline
  đợt 126 vẫn đứng theo round-in-progress.md.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #71?) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  834–2551 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #71?: PASS 10/10 (try1 23:43:58Z + watcher b71 8 poll
  23:46:08–23:53:14Z + final 23:54:29Z) — 0 lần FAIL.
- Watcher b71: 8/8 poll PASS (23:46:07–23:54:15Z), tự kết thúc
  `done_stable_8polls`, exit 0. Không reboot trong lượt.
- Replay #71?: XONG +12m05s (1509 dòng, gói cuối gstreamer1.0-tools
  23:37:46Z), PASS +18m17s (lần kiểm đầu).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ 8/8 poll, KHÔNG KÍCH HOẠT**
  ((2b)/(3) đạt từ poll 3; (1)/(4) không bao giờ đạt — replay xong
  + postboot PASS). **Repair (cả §8.2 lẫn luật (C)): KHÔNG CHẠY.**
- Headroom: 3451 (mở) → 3434 (cuối).
- Stale vite.lock: không có (lock dir không tồn tại lúc mở; T8
  acquire port 5490 lúc 23:52:10Z, vẫn giữ lúc cuối — đang dùng
  thật; queue cooldown 56 → 58 file).
- Reboot mới: CÓ — 1 lần giữa đợt 125 đóng và lượt này (#70?→#71?
  23:25:41Z, gap danh nghĩa 2h31m22s). Boot #71? sống từ 23:25:41Z
  tới cuối lượt T5 (23:54:29Z, boot +28m48s).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND126_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #71? trong header + dòng `say`; md5 `ea7735c2…` →
  `e986ec78…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round126-t5/` (log
  watcher b71 8 poll, log postboot try1/poll1–8/final, log headroom,
  md5 trước/sau của postboot-check, `POSTBOOT_PASS` (cờ hiện tại —
  cho boot #71?, PASS 23:43:58Z), `t5-initial-state.md`,
  `t5-wait-replay-b71.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round126-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round126-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
