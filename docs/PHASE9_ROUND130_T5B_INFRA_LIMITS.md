# PHASE9_ROUND130_T5B_INFRA_LIMITS — Boot #77? CHẾT giữa lượt (khung (13:02:16Z, 13:02:41Z]); boot #78? replay CHẠY ĐẦY ĐỦ baseline 1509/217, postboot PASS, KHÔNG cần --repair; cờ POSTBOOT_PASS mới 13:39:13Z

> Luồng T5b, đợt 130, lượt cron 18:35 +07 17/11/2026 (bắt đầu 13:13:38Z trên
> boot #78?, kết thúc ~13:40Z, KHÔNG reboot trong lượt T5b).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> T5 gốc đã .done lúc 12:04Z, KHÔNG resume — T5b làm postboot MỚI cho boot
> mới sau reboot giữa lượt lần thứ 2 liên tiếp. Tái dùng ĐÚNG quy trình T5
> đợt 130 (script vcut-webkit-postboot-check.sh, watcher v4, §8.2(B) ngưỡng
> 10 phút + luật (C)).
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (kể cả instrumentation
> (c2) — T5 đã xong, preview.tsx md5 805409f0 KHÔNG ĐỔI). KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet không thử
> (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #77? CHẾT trong khung (13:02:16Z, 13:02:41Z].** btime
   10:56:31Z, boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`. Lần cuối
   còn sống ghi nhận: T8 waiter poll 85 lúc 13:02:16Z. Tuổi thọ
   2h05m45s–2h06m10s. Đây là reboot GIỮA LUỘT lần thứ 2 liên tiếp
   (#75? chết giữa lượt đợt 129, #77? chết giữa lượt đợt 130) và là
   reboot thứ 6 liên tiếp rơi vào khoảng giữa đợt đóng / lượt mở /
   giữa lượt. Lưu ý khung: T4 ghi khung (13:02:42Z, 13:04:14Z] (class B
   attempt3 xong 13:02:42Z, đọc boot lúc đánh giá vẫn #77) — chênh 1s
   ở ranh giới so với btime boot mới 13:02:41Z (làm tròn giây); ghi cả
   hai khung, không kẹp hẹp hơn được.
2. **Boot #78? (MỚI) replay CHẠY ĐẦY ĐỦ — KHÔNG phải dạng (B).**
   btime 13:02:41Z, boot_id `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`,
   sau #77? 2h06m10s. Configure 13:03:24Z (boot +43s); apt-get update
   chạy ~13:03:26Z–~13:16:5xZ (~13,5 phút, partial/ tăng 46 → 62);
   install ~13:17:02–13:37:37Z (~20,5 phút); **đạt đúng baseline
   1.509 dòng / 217 installs lúc 13:37:37Z** (gói cuối
   gstreamer1.0-tools). Postboot PASS lần đầu poll 10 (13:26:08Z,
   boot +23m27s) và PASS 14 poll liên tiếp tới poll 23.
   **KHÔNG cần --repair** — replay tự chạy xong toàn bộ.
   **Cờ `POSTBOOT_PASS` cho #78? đã viết 13:39:13Z (poll 23, boot
   +36m32s, đúng boot_id)** — T8b gate bằng cờ này.
3. **§8.2(B): TRIGGER=NO ở cả 23 poll** (apt luôn chạy trong lúc
   dpkg im <600s; sau PASS thì c1=no). **Luật (C): KHÔNG kích hoạt**
   (partial tăng trong lúc update; apt các sóng install có CPU >0;
   không có trạng thái sống-kẹt).
4. **(c2) instrumentation: KHÔNG ĐỔI.** preview.tsx md5 `805409f0…`
   (y hệt T5); media.ts không đổi `2c384ed1`. T5b KHÔNG làm lại
   instrumentation. (c2) event lag: CHƯA CÓ dữ liệu mới trong lượt
   T5b (T5b không chạy probe) — giữ nguyên kết luận đợt 129 + dữ liệu
   lượt yên #8 của T4 (xem §8).
5. **Headroom inotify: 2952 (mở) → 2954 (cuối)** — tăng 2 trong lượt;
   vẫn ~1,9 lần số watch vite thường cần (~1586); CHƯA tới ngưỡng báo
   user (< ~1.800), chỉ theo dõi.
6. **RAM khả dụng 510–1187 MB trong lượt** (thấp nhất 510 MB poll 20
   lúc 13:36:12Z; cao nhất 1187 MB cuối lượt). Dù lấy số nào cũng
   < 6 GB guard — birefnet không thử.
7. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
   Queue cooldown 71 file / 994 B (khớp đúng số T10 đếm lúc đóng đợt
   129 và T5 lúc mở đợt 130) — không đổi trong lượt. T5b KHÔNG đụng
   lock/queue.
8. **R9 (a) vẫn chờ user — nhắc lần 16.**

## 2. Boot #77? — chết trong khung (13:02:16Z, 13:02:41Z]

- Boot #77?: btime 10:56:31Z, boot_id
  `86538084-410e-41d4-a4bf-e68574dc2d91`. Lần cuối còn sống được ghi
  nhận: T8 waiter poll 85 lúc 13:02:16Z (GATE-NOT-YET, đọc boot_id
  vẫn #77).
- Boot mới btime 13:02:41Z → #77? chết trong khung (13:02:16Z,
  13:02:41Z] (rộng 25s — khung hẹp nhất từ trước tới nay cho một
  boot chết). Tuổi thọ 2h05m45s–2h06m10s.
- Khung T4 ghi (13:02:42Z, 13:04:14Z] (class B attempt3 lượt yên #8
  xong 13:02:42Z, đọc boot lúc đánh giá vẫn #77; session T4 chết
  13:02:42Z theo chain-t4.log) — mâu thuẫn 1s với btime boot mới
  13:02:41Z. Giải thích khả dĩ nhất: làm tròn giây ở mốc btime /
  thời điểm ghi log class B (T4 đọc boot_id TRƯỚC khi ghi dòng "xong"
  13:02:42Z). Không kẹp hẹp hơn được từ trong VM; ghi cả hai khung.
  Verdict lượt yên #8 của T4 KHÔNG đổi (attempt3 hoàn tất trước
  reboot theo tiền lệ đợt 129 — T4 đã đóng lượt yên #8, xem §8).
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s,
  #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
  1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
  2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? chưa biết (sống ≥37m
  tới cuối lượt T5b).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5b mở, nhưng
  là của CHÍNH đợt 130 này (tạo 11:35Z bởi parent vòng lặp, "Đợt
  130 đang chạy, 9 luồng T1–T9 + T10 đóng sổ") — KHÔNG phải đợt
  main-chat. Luật chốt chặn (chỉ chặn khi đợt main-chat đang chạy)
  không áp dụng; lượt cron làm việc bình thường.
- **Cờ POSTBOOT_PASS của T5 cho #77? đã STALE** (boot_id 86538084…,
  PASS 12:01:24Z) — T8b gate bằng cờ MỚI của T5b (round130-t5b/).

## 3. Boot #78? — replay CHẠY ĐẦY ĐỦ, đạt baseline 1509/217, KHÔNG --repair

### 3.1 Boot #78? — btime 13:02:41Z, gap 2h06m10s

- Boot #78?: 2026-11-17 13:02:41Z (btime kernel 1794920561;
  `uptime -s` đồng ý; /proc/1 13:02:56Z, chênh +15s;
  boot_id `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`, sau #77?
  2h06m10s). Số thứ tự TẠM, chờ T6 đếm lại mù #37.
- `journalctl --list-boots` / `last -x`: T5b không đọc lại trong lượt
  này (mẫu các đợt trước: chỉ còn 1 boot hiện tại) — không suy diễn
  thêm.

### 3.2 Replay #78? — chạy đầy đủ, kẹp được bracket (0'43", 34'56"]

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 13:02:41 | 0 | btime |
| Configure (2 dòng dpkg.log) | 13:03:24 | +43s | dpkg.log |
| apt-get update bắt đầu | ~13:03:26 | ~+45s | pid 805 (elapsed 10:57 lúc 13:14:23Z) |
| T5b mở lượt | 13:13:38 | +10m57s | exec |
| apt-get update xong (lists 3 → 37) | ~13:16:5x | ~+14m | watcher poll 1 (dpkg có dòng mới 13:17:02Z) |
| Install bắt đầu (dpkg 2 → 40) | 13:17:02 | +14m21s | watcher poll 1 |
| Postboot PASS lần đầu | 13:26:08 | +23m27s | watcher poll 10 (dpkg 1113, 163 installs, GST 269) |
| Install xong (dpkg 1509, 217 installs) | 13:37:37 | +34m56s | dpkg.log (gói cuối gstreamer1.0-tools) |
| apt/dpkg/wrapper về 0 | 13:38:13 | +35m32s | watcher poll 22 |
| Cờ POSTBOOT_PASS viết (poll 23) | 13:39:13 | +36m32s | watcher log |
| Final confirm PASS | ~13:40:2x | ~+37m | t5b-postboot-b78-final.log |

- **Bracket replay đầy đủ: (0'43", 34'56"]** — hoạt động apt đầu
  tiên 13:03:24Z (configure, boot +43s), cài xong toàn bộ 13:37:37Z
  (boot +34m56s), 0 entry dpkg/apt nào sau đó. Đây là bracket kẹp
  được bằng dpkg.log (cùng phương pháp S8 #48 / T8 #52 / T7 #54).
  Chậm hơn các boot replay nhanh (#48: 2'44", #52: 8'44") nhưng
  cùng họ với #47 (27.7') — update mất ~13,5 phút (mirror chậm) +
  install ~20,5 phút theo sóng.
- **Update (~13,5 phút):** pid 805 chạy xuyên suốt từ ~13:03:26Z,
  0.0% CPU ở các lần đọc tức thời (bình thường với update chờ
  mạng); partial/ TĂNG DẦN 46 (13:13:38Z) → 52 (13:14:23Z) →
  62 (13:15:35Z) — đang tải thật, không kẹt. Lists 3 → 37 file
  (34 noble) khi update xong.
- **Install (~20,5 phút, theo sóng):** dpkg 2 → 90 (poll 2, 11
  installs) → 426 (poll 3, 64) → 435 → 470 → 503 → 503 → 530 →
  530 → 1113 (poll 10, 163 installs, GST 0 → 269 — sóng lớn) →
  1122 → 1131 → 1144 → 1177 → 1238 → 1238 → 1238 → 1293 → 1396
  → 1396 → 1461 → **1509 (poll 22, 217 installs)**. apt-get đổi PID
  mỗi sóng (3907 → 4811 → 5046 → 5376 → 5696 → 6216 → 7579 →
  7756 → 8032 → 8226 → 8527 → 8981 → 9581 → 10758 → 11377) —
  replay chạy nhiều lệnh apt-get install nối tiếp; các sóng có pha
  tải (dpkg đóng băng 60–140s, apt %CPU ~0,6–1,8%) rồi pha cài
  (dpkg tăng, apt %CPU 5–80%).
- **GST:** 0 file tới poll 2 → 32 file poll 3–9 → **269 file từ
  poll 10** (sóng lớn cài đủ plugin WebKit/GST; postboot PASS từ
  đây). Không cần symlink GST → debroot (khác #76?/#77? dạng (B)):
  thư mục plugin hệ thống thật đã đủ 269 file.
- **Lists #78: 37 file / 34 noble** (1 mirror theo số lượng — giống
  mẫu #75: 39 file / 34 noble; khác #77 sau repair: 75 file /
  68 noble, 2 mirror). Postboot PASS đủ 11/11 gói nên chức năng đủ;
  ghi nhận, không suy diễn (T5 đã ghi ở LIMITS đợt 130 §11.8: nếu
  mirror thứ 2 lại vắng ở boot sau thì mới là mẫu — nay vắng thật,
  nhưng là replay tự nhiên, không phải repair).
- 0 apt/dpkg/wrapper đang chạy từ poll 22 (13:38:13Z) trở đi.

### 3.3 Bảng so sánh replay

| Boot | dpkg.log (dòng) | Installs | Khởi động | Kết cục |
|---|---|---|---|---|
| #71? | 1509 | 217 | +9m59s | PASS |
| **#72?** | **350** | **48** | **+25m22s** | **CHẾT dạng (A)** |
| #73? | 1509 | 217 | +38s | PASS +5m51s |
| #74? | 1509 | 217 | +40m39s | PASS +47m52s |
| #75? | 1509 | 217 | +1h22m12s | PASS +1h29m34s |
| #76? (replay) | 2 | 0 | +53s | **dạng (B), repair PASS +30m03s** |
| #77? (replay) | 2 | 0 | +39m08s | **dạng (B), repair PASS +1h04m53s** |
| **#78? (replay)** | **1509** | **217** | **+43s** | **CHẠY ĐẦY ĐỦ, PASS +36m32s, KHÔNG repair** |

- Dạng (B) thuần dừng ở 2 boot liên tiếp (#76?, #77?) — #78? quay
  lại replay đầy đủ baseline. Baseline 1.509 dòng / 217 installs
  giữ nguyên giá trị cho các boot replay chạy xong.
- Khác #77?: #78? configure sớm (+43s so với +39m08s) nhưng update
  chậm (~13,5 phút) nên cờ PASS tới ở boot +36m32s — vẫn nhanh hơn
  #77? (+1h04m53s, cần repair) và #75? (+1h29m34s).

### 3.4 Postboot #78? — FAIL 10 poll, PASS 14 poll liên tiếp, cờ viết poll 23

- Postboot lúc mở lượt (poll0, 13:13:xxZ): FAIL exit 1 (0/11 gói
  apt, GST thiếu isomp4 + libav, debroot 269 file) — replay đang
  update, chưa cài gì.
- Sau sửa script (after-edit, ~13:16Z): vẫn FAIL exit 1 — logic
  không đổi.
- Watcher poll 1–9 (13:17:04–13:25:07Z): postboot exit 1 cả 9 poll;
  dpkg tăng dần 2 → 530, installs 0 → 79, GST 0 → 32; apt-get luôn
  chạy (c2a=no) → **TRIGGER=NO mọi poll** (đúng — replay đang sống,
  không phải dạng (B)).
- Watcher poll 10 (13:26:08Z): postboot exit 0 LẦN ĐẦU (dpkg 1113,
  installs 163, GST 269, apt-get vẫn chạy) — PASS streak bắt đầu.
- Poll 11–21: postboot 0 liên tiếp (installs 164 → 210); apt-get
  vẫn chạy nên cờ CHƯA ghi (điều kiện cần 0 proc + frozen).
- Poll 22 (13:38:13Z): dpkg=1509 installs=217, apt=0 apt-get=0
  dpkgproc=0 wrapper=0, postboot 0 — replay xong; frozen=no (dòng
  vừa tăng 1461 → 1509) nên cờ chưa ghi.
- Poll 23 (13:39:13Z): dpkg=1509 frozen=yes, silent 96s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 13:39:13Z (boot +36m32s)**; watcher
  tự kết thúc `done_pass_stable_2polls`.
- Final confirm ~13:40:2xZ exit 0. Tổng trên #78?: postboot PASS
  15/15 sau poll 10 (poll 10–23 + final) + FAIL ở lần kiểm mở lượt +
  sau sửa script + poll 1–9 (đều exit 1, logic không đổi).
- Cờ POSTBOOT_PASS hiện tại là của #78? (boot_id 57c3e5e2…).
  GST là thư mục hệ thống THẬT (269 file) — không có symlink →
  debroot (khác #76?/#77? sau repair).
- Mốc 14:35Z trong task không bị trễ (cờ viết 13:39:13Z, trước hạn
  đóng đợt gần 1 giờ); toàn bộ xong trong lượt.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 05:42Z (boot #74?, ~47' tuổi) | 3203 | mở lượt đợt 128 (đã lưu) |
| T5, 05:43Z (boot #74?, ~48' tuổi) | 3205 | cuối lượt đợt 128 |
| T5, 08:38Z (boot #75?, ~1h25' tuổi) | 3089 | mở lượt đợt 129 |
| T5, ~08:47Z (boot #75?, ~1h33' tuổi) | 3078 | cuối lượt trên #75? |
| T5, ~09:33Z (boot #76?, ~31' tuổi) | 3079 | cuối lượt trên #76? |
| T5, 11:38Z (boot #77?, ~41' tuổi) | 2971 | mở lượt đợt 130 (headroom-open.txt) |
| T5, ~12:02Z (boot #77?, ~1h06' tuổi) | 2957 | cuối lượt đợt 130 (headroom-end.txt) |
| **T5b, 13:15Z (boot #78?, ~13' tuổi)** | **2952** | **mở lượt đợt 130 (headroom-open.txt)** |
| **T5b, ~13:40Z (boot #78?, ~37' tuổi)** | **2954** | **cuối lượt đợt 130 (headroom-end.txt)** |

- Headroom tăng 2 trong lượt (2952 → 2954) và giảm 3 so với cuối
  lượt T5 (2957 → 2952 qua reboot). Chuỗi dài hạn: 4438 → 4318 →
  3645 → 3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 → 3089 →
  3078 → 3079 → 2971 → 2957 → **2952 → 2954**. Vẫn gấp ~1,9 lần
  số watch vite thường cần (~1586). **Vite thường chạy được trên
  boot này. Chưa tới ngưỡng báo user (< ~1.800) — chỉ theo dõi**
  (quyết parent §12(h) đợt 127).
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 13:13:38Z | 1139 MB | lúc exec đầu (trước khi mở T5b) |
| 13:15:35Z (mở lượt) | 976 MB | ram-open.txt |
| 13:17:04Z (watcher poll 1) | 700 MB | install bắt đầu (dpkg 40, 6 installs) |
| 13:18:05Z (poll 2) | 676 MB | |
| 13:19:05Z (poll 3) | 911 MB | |
| 13:20:05Z (poll 4) | 770 MB | |
| 13:21:06Z (poll 5) | 646 MB | |
| 13:22:06Z (poll 6) | 786 MB | |
| 13:23:07Z (poll 7) | 880 MB | |
| 13:24:07Z (poll 8) | 764 MB | |
| 13:25:07Z (poll 9) | 684 MB | |
| 13:26:08Z (poll 10, PASS đầu) | 805 MB | |
| 13:27:08Z (poll 11) | 724 MB | |
| 13:28:09Z (poll 12) | 595 MB | |
| 13:29:09Z (poll 13) | 514 MB | |
| 13:30:10Z (poll 14) | 570 MB | |
| 13:31:10Z (poll 15) | 544 MB | |
| 13:32:10Z (poll 16) | 539 MB | |
| 13:33:11Z (poll 17) | 515 MB | |
| 13:34:11Z (poll 18) | 544 MB | |
| 13:35:11Z (poll 19) | 517 MB | |
| **13:36:12Z (poll 20)** | **510 MB** | **thấp nhất lượt** |
| 13:37:12Z (poll 21) | 597 MB | |
| 13:38:13Z (poll 22) | 568 MB | |
| 13:39:13Z (poll 23, ghi cờ) | 555 MB | |
| ~13:40Z | **1187 MB** | **cuối lượt (ram-end.txt)** |

- RAM dao động 510–1187 MB trong lượt (hồi mạnh cuối lượt khi
  replay xong + các luồng đợt 130 đã xong). Mức thấp nhất 510 MB
  vẫn > 0 và cao hơn 473 MB cuối lượt T5 (thấp nhất từng ghi).
- Swap đã dùng: không ghi riêng lượt này (T5 ghi 255–426 MB đợt
  130 trên #77?).
- Dù lấy số nào cũng < 6 GB guard — birefnet không thử.

## 5. Watcher — b78 v4 (23 poll, ghi cờ, tự kết thúc)

- Chạy 13:17:04–13:39:13Z (23 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script copy từ bản b77 đợt 130
  (v4) — chỉ đổi btime/mốc/log + ghi chú replay #78 chạy đầy đủ;
  `bash -n` OK trước khi chạy.
- Poll 1 (13:17:04Z): dpkg=40 installs=6, dòng mới 13:17:02Z
  (install bắt đầu), silent 2s, apt-get=1, postboot 1, lists=37,
  GST=0, RAM 700 MB. EVAL §8.2B TRIGGER=NO (c2a no — apt đang chạy).
- Poll 10 (13:26:08Z): dpkg=1113 installs=163, GST 269, postboot 0
  lần đầu sau khi replay cài đủ plugin; apt-get vẫn chạy (pid 7579).
- Poll 22 (13:38:13Z): dpkg=1509 installs=217, apt=0, postboot 0 —
  replay xong.
- Poll 23 (13:39:13Z): dpkg=1509 frozen=yes, silent 96s, apt=0,
  postboot 0 → **FLAG_WRITTEN 13:39:13Z**.
- Cờ `POSTBOOT_PASS` (round130-t5b/): `boot_id=57c3e5e2-c31f-4d85-
  9e0e-28d615c0d061 btime=2026-11-17T13:02:41Z pass_at=
  2026-11-17T13:39:13Z poll=23` — đúng boot mới. T8b gate bằng cờ
  này (T8 đợt 130 đã BLOCKED 0/3 vì cờ #77 STALE — xem build-loop-log).
- KHÔNG reboot trong lúc watcher chạy (13:17–13:39Z); boot_id không
  đổi suốt lượt.
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.
- `wrapper=2` ở poll 1–21 là FALSE POSITIVE đã biết (pgrep -f
  'os-intent' bắt shell của chính lệnh kiểm — như đợt 127/129; poll
  22–23 wrapper=0 sau khi replay xong). Không ảnh hưởng EVAL
  (c2a tính cả wrapper nên TRIGGER luôn NO trong lúc replay chạy —
  đúng ý đồ an toàn).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt ~13:15Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **71 file / 994 B**
  (khớp đúng số T10 đếm lúc đóng đợt 129 và T5 lúc mở đợt 130) —
  không đổi trong lượt. Đều là cooldown cũ, không chặn luồng khác,
  không tính là ticket. Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết
  parent §12(c) đợt 125) — việc prune là của T6, T5b chỉ ghi số.
- T5b KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt (reboot đã xóa sót đợt
  130 trên #77?; T8 ghi 0 process Xvfb/vite/MiniBrowser lúc 13:06Z).

## 7. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

> Quyết parent đợt 125 §12(b): §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm
> mà không cài"; ngưỡng chờ dạng (B) dpkg im ≥10 phút (thay vì 15);
> luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg đóng băng; hiệu lực
> từ đợt 126.
>
> 5 điều kiện §8.2 (quyết parent đợt 120 §12 mục 3): (1) postboot
> FAIL tươi (<10' trước quyết); (2) replay ĐÃ CHẾT — (a) 0 process
> apt-get/dpkg/wrapper, (b) dpkg.log không tăng ≥10', (c) lock dpkg
> rảnh; (3) ngưỡng chờ: boot ≥60' HOẶC dpkg im ≥15' — **với dạng
> (B): dpkg im ≥10'**; (4) dạng lỗi (A) "tới nhưng thiếu GST" HOẶC
> (B) "chạm mà không cài"; (5) không có luồng đo WebKit nào đang chạy
> probe trên boot đó.
>
> Luật (C) (quyết parent đợt 122 §12.4): đủ 5 điều kiện (postboot
> FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không
> probe đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi
> chạy --repair một lần có giám sát.

### 7.1 Đối chiếu §8.2 — boot #78? (watcher b78 v4, poll 1–23; rút gọn)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 13:17:04Z | 2s | yes (exit 1) | no (apt chạy) | no | - (no) | yes | **NO** |
| 9 | 13:25:07Z | 108s | yes | no (apt chạy) | no | - (no) | yes | **NO** |
| 10 | 13:26:08Z | 13s | no (exit 0) | no (apt chạy) | no | - (no) | yes | **NO** |
| 16 | 13:32:10Z | 75s | no (exit 0) | no (apt chạy) | no | - (no) | yes | **NO** |
| 22 | 13:38:13Z | 36s | no (exit 0) | yes | no | - (no) | yes | **NO** |
| 23 | 13:39:13Z | 96s | no (exit 0) | yes | no | - (no) | yes | **NO** |

- **TRIGGER=NO ở cả 23 poll** — replay sống suốt lượt (apt chạy
  liên tục; dpkg im dài nhất chỉ 136s ở poll 17, xa dưới ngưỡng
  600s). Không có thời điểm nào đủ điều kiện --repair, và cũng
  không cần repair vì replay tự chạy xong.
- **§8.2(B) KHÔNG kích hoạt đợt này** (sau 2 lần kích hoạt liên
  tiếp ở #76? và #77?).
- Luật (C) trên #78?: không áp dụng — apt không sống-kẹt: update
  tải thật (partial tăng), các sóng install có %CPU >0 (5–80% lúc
  cài, ~0,6–1,8% lúc tải — tải chờ mạng là bình thường, không phải
  kẹt); dpkg im dài nhất 136s < 900s. EVAL_C ở mọi poll:
  b_stuck_maybe=no.
- Không có kiểm chứng độc lập pre-repair nào — không có repair để
  kiểm chứng (đúng quy trình: chỉ kiểm chứng khi TRIGGER=YES).

## 8. (c2) instrumentation + lượt yên #8 — KHÔNG CÓ dữ liệu mới trong lượt T5b

- **Instrumentation (c2) KHÔNG ĐỔI trong lượt T5b:** preview.tsx
  md5 `805409f0…` (ghi nhận lúc mở 13:15Z và cuối lượt — y hệt T5);
  media.ts không đổi `2c384ed1`. T5b KHÔNG sửa production.
- **Lượt yên WebKit #8 của T4 ĐÃ ĐÓNG** (theo build-loop-log, entry
  T4 13:12Z — trước khi T5b mở): attempt3 20/20, median 40,0 ms
  (p90 66,0, n=630), lớp B 5/5 ĐẠT; 7 lượt yên xác nhận: 49,5/40,0/
  52,0/47,5/44,0/54,0/40,0 (trung bình 46,7 ms); ngưỡng ≤60 ms GIỮ.
  **(c2) +1f tái hiện 6 lần ở attempt3** (skp=0; seq 161, 263, 315,
  341, 441, 484); lag ≥+5f: 0; **F6' ĐÓNG** (nTick skp=1 = 56,
  100%/100%). Dữ liệu này thuộc T4 (trên boot #77?, hoàn tất trước
  reboot) — T5b chỉ ghi nhận lại, không phân tích thêm (phân tích
  (c2) là việc đợt sau, theo LIMITS T5 §8.3).
- T5b KHÔNG chạy lượt yên / probe nào (đó là việc của T4/T8 với cờ
  mới — T8b gate bằng cờ POSTBOOT_PASS #78? này).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (#78?, ~13:16Z): md5 `f5c6a411…` → `0b73b3bc…` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #77? chết trong khung (13:02:16Z, 13:02:41Z],
  tuổi thọ 2h05m45s–2h06m10s; reboot giữa lượt lần thứ 2 liên tiếp
  + đoạn #78? (replay ĐANG CHẠY — configure 13:03:24Z, apt-get
  update đang chạy, partial tăng, KHÔNG phải dạng (B)); dòng `say`
  cập nhật tương ứng. Dòng `say` mới không chứa ký tự `"` (dùng `m`/
  `s` thay dấu phút/giây) — không lặp sự cố đợt 120. `bash -n` OK.
- Kiểm chứng: sau khi sửa, postboot vẫn FAIL exit 1 (lần kiểm
  sau sửa ~13:16Z) — logic không đổi đã được xác nhận bằng chạy
  thật; sau replay xong, cùng script này PASS exit 0 (poll 10–23 +
  final).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5b không nhận được phê duyệt
  đó trong task — giữ nguyên. (Không có --repair nào chạy đợt này.)

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5b KHÔNG tự đổi thân cron.
- Reboot #77?→#78? giữa lượt này là ví dụ mới nhất (lần thứ 2 liên
  tiếp reboot GIỮA LUỘT, lần thứ 6 liên tiếp reboot rơi vào khoảng
  giữa đợt đóng / lượt mở / giữa lượt) cho thấy R9 (a) vẫn có giá
  trị: T8 đã BLOCKED 0/3 vì cờ #77 STALE + T4 chết ở bước cuối, và
  T5b phải làm postboot mới cho #78? trong ~26 phút sau khi lượt mở
  lại (T5b mở 13:13Z, cờ PASS 13:39:13Z). Vá §8.4(ii) + cờ gắn
  boot_id đã giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 11. Nợ mở sang đợt sau

1. **Boot #78? đang sống + PASS (replay đầy đủ, KHÔNG repair) — các
   luồng đo đợt 130 dùng cờ này** (`round130-t5b/POSTBOOT_PASS`,
   boot_id 57c3e5e2…, PASS 13:39:13Z, xác nhận lại final ~13:40Z).
   Cờ #77? (86538084…, PASS 12:01:24Z) đã STALE. Nếu #78? cũng chết
   sớm như #72? (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải làm
   lại từ đầu. Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32,
   #68? 3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72?
   54m08s, #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75?
   1h45m45s–1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s,
   #77? 2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? chưa biết (sống
   ≥37m tới cuối lượt T5b).
2. **Số thứ tự boot #77?/#78? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 130 đã .done — T10/T6 chốt lại khi đóng đợt). Nếu T6 đếm
   khác, LIMITS này + script postboot-check cần sửa lại số — boot_id
   + btime không đổi.
3. **Khung #77? chết có 2 bản ghi chênh 1s:** task T5b (13:02:16Z,
   13:02:41Z] vs T4 (13:02:42Z, 13:04:14Z] — ghi cả hai, không kẹp
   hẹp hơn được (xem §2).
4. **(c2) chẩn đoán — instrumentation ĐÃ CÓ trong cây (preview.tsx
   805409f0…):** lượt yên #8 đã đóng (T4): (c2) +1f tái hiện 6 lần
   ở attempt3 (seq 161, 263, 315, 341, 441, 484) — chuyển T3/T5 đợt
   sau phân tích; giả thuyết seek-latency desync vẫn CHƯA chứng minh
   (giữ nguyên verdict đợt 129). F6' ĐÃ ĐÓNG (T4).
5. **Lists #78 chỉ 37 file / 34 noble (1 mirror)** — giống mẫu #75,
   khác #77 sau repair (75/68, 2 mirror). Postboot PASS đủ 11/11
   nên chức năng đủ; theo dõi ở boot sau (nếu mirror thứ 2 lại vắng
   thì mới là mẫu).
6. **Headroom tiếp tục giảm dài hạn:** …3334 → 3317 → 3315 →
   3203/3205 → 3089 → 3078 → 3079 → 2971 → 2957 → **2952 → 2954**
   (đo lại trên #78? — giảm 3 qua reboot, tăng 2 trong lượt). Trần
   63747 cần can thiệp host — ngoài tầm luồng này. Ngưỡng báo user
   < ~1.800 chưa tới (còn ~1.154).
7. **RAM thấp nhất lượt 510 MB** (poll 20, 13:36:12Z) — cao hơn 473 MB
   cuối lượt T5 (thấp nhất từng ghi) nhưng vẫn thấp; dao động mạnh
   theo luồng khác; T9 theo dõi RAM ghim (nhiệm vụ T9).
8. **Khung giờ #77? chết đã kẹp hẹp (25s)** — hẹp nhất từ trước tới
   nay (nhờ T8 waiter poll 85 lúc 13:02:16Z + btime mới 13:02:41Z).
   Khung #76? chết (10:02:05Z, 10:56:31Z] vẫn mở rộng 54m26s;
   khung #75?/#74?/#73?/#72? đã kẹp đợt 129/128/127; khung #71?
   chết vẫn mở.
9. **R9 (a) vẫn chờ user (nhắc lần 16).**
10. **Cooldown file tích lũy (71 file / 994 B, không đổi)** — luật
    prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
    của T6.
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 129 §11 + quyết
    parent §12.3: mù #49 probe thường lệ (T2); G1 chờ user quyết;
    birefnet (chỉ thử lại khi quan sát được available ≥ 6 GB, u2net
    là fallback chính thức); ci-security.yml vẫn 403 chờ user; TTS 39
    cấm kiểm lại; release gate không đổi + KHÔNG push khi user chưa
    nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI trong lượt T5b (md5 `805409f0`, y hệt
  T5 sau instrumentation (c2)); `media.ts`: KHÔNG đổi (`2c384ed1`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (tham chiếu #77? → #78? trong header + dòng `say`; md5
  `f5c6a411…` → `0b73b3bc…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5b chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #78?) OK; watcher b78 OK.
- `tsc` / `vite build`: KHÔNG chạy trong lượt T5b (không sửa
  production; tsc đã exit 0 trên #78? theo entry T4 13:12Z).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  510–1187 MB < 6 GB).
- O8: KHÔNG thuộc T5b (T8b gate bằng cờ này).
- Postboot #78?: FAIL ở lần kiểm mở lượt + sau sửa script + poll
  1–9; PASS 15/15 sau poll 10 (poll 10–23 + final confirm).
  Watcher b78 v4: 23 poll, tự kết thúc `done_pass_stable_2polls`,
  exit 0. **Reboot GIỮA LUỘT T5b: KHÔNG.**
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=NO cả 23
  poll** (replay sống suốt lượt; dpkg im dài nhất 136s). **KHÔNG
  --repair** (không đủ điều kiện, không cần). **Luật (C): ĐÁNH GIÁ
  MỖI POLL, KHÔNG KÍCH HOẠT** (apt tải/cài thật, không sống-kẹt).
- Headroom: 2952 (mở) → 2954 (cuối).
- RAM thấp nhất lượt: 510 MB (poll 20); cao nhất 1187 MB (cuối lượt).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  71 file / 994 B, không đổi).
- Event lag (c2): CHƯA CÓ dữ liệu mới trong lượt T5b (T5b không chạy
  probe); dữ liệu lượt yên #8 của T4: (c2) +1f ×6 ở attempt3, F6'
  ĐÓNG — chuyển đợt sau phân tích.

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #77? → #78? trong header + dòng `say`; md5
  `f5c6a411…` → `0b73b3bc…`; không đổi logic).
- `docs/PHASE9_ROUND130_T5B_INFRA_LIMITS.md` (file này — mới).
- Harness trong hidden_files (KHÔNG stage): `round130-t5b/` (log
  watcher b78 v4 (23 poll), log postboot mở lượt/after-edit/final
  (#78?), md5 trước/sau của postboot-check, log headroom mở/cuối
  (2952/2954), log RAM mở/cuối (976/1187 MB), `POSTBOOT_PASS` (cờ
  hiện tại — cho boot #78?, PASS 13:39:13Z), `t5b-initial-state.md`,
  `t5b-wait-replay-b78.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round130-t5b-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round130-t5b.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```
