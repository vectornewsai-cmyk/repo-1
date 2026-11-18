# PHASE9_ROUND131_T5_INFRA_LIMITS — Boot f868abad replay ĐẦY ĐỦ 1509/217 PASS +23m37s; REBOOT giữa lượt 15:01:30Z → boot2 ad1327ef dạng (B) + --repair 1 lần PASS +29m50s; PHA 2 (c2) ĐÃ XONG: đối chiếu trực tiếp KHÔNG THỂ (cửa sổ log không phủ), desync BỊ LÀM YẾU, cơ chế ghost-freeze có bằng chứng mạnh hơn

> Luồng T5, đợt 131, lượt cron 21:35 +07 17/11/2026 (bắt đầu 14:41:47Z trên
> boot f868abad; pha 1 xong 14:51:45Z; REBOOT giữa lượt 15:01:30Z giết
> session lúc chờ pha 2; T5 làm lại pha 1 cho boot2 ad1327ef, cờ mới
> 15:31:20Z; pha 2 xong ~15:35Z, KHÔNG reboot trong lúc làm lại).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> T5 đợt 131 làm 2 pha theo quyết parent đợt 130 §12.3(a)/(b): pha 1 hạ
> tầng postboot cho boot mới; pha 2 phân tích log draw (c2) SAU KHI T4
> bật log draw ở lượt yên #9 và có dữ liệu. Pha 1 làm 2 lần (boot
> f868abad + boot2 ad1327ef sau reboot giữa lượt). Pha 2 ĐÃ XONG —
> xem §8.
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (kể cả instrumentation
> (c2) — preview.tsx md5 805409f0 KHÔNG ĐỔI). KHÔNG tự chạy `--repair`
> khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet không thử
> (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #78? CHẾT trong khung (14:15:34Z, 14:26:41Z].** btime
   13:02:41Z, boot_id `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`. Lần cuối
   còn sống ghi nhận: heartbeat 21:20:50+07 started 14:15:34Z (T7
   đợt 131 thu hẹp khung; khung rộng hơn từ mtime `round130-t10.done`
   14:09:54Z là (14:09:54Z, 14:26:41Z]). Tuổi thọ 1h12m53s–1h24m00s.
   Đây là reboot GIỮA ĐỢT ĐÓNG / LƯỢT MỞ lần thứ 3 liên tiếp (#75?
   chết giữa lượt đợt 129, #77? chết giữa lượt đợt 130, #78? chết
   giữa đóng 130 / mở 131).
2. **Boot MỚI replay CHẠY ĐẦY ĐỦ — KHÔNG phải dạng (B).** btime
   14:26:41Z, boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`, sau #78?
   1h24m00s. Configure 14:35:39Z (boot +8m58s); apt-get update
   ~14:35–~14:47Z (~12 phút, partial 92 → 126, lists 3 → 71);
   install 14:47:17–14:48:40Z (~1,5 phút, từ cache — dpkg 2 → 435 →
   1339 → 1509); **đạt đúng baseline 1.509 dòng / 217 installs lúc
   14:48:40Z** (gói cuối gstreamer1.0-tools). Postboot PASS lần đầu
   poll 4 (14:48:17Z, boot +21m36s) và PASS 3 poll liên tiếp tới
   poll 6. **KHÔNG cần --repair** — replay tự chạy xong toàn bộ.
   **Cờ `POSTBOOT_PASS` cho boot mới đã viết 14:50:18Z (poll 6, boot
   +23m37s, đúng boot_id)** — T4/T8 đợt 131 gate bằng cờ này.
3. **§8.2(B): TRIGGER=NO ở cả 6 poll** (poll 2 đủ c2b/c3/c4 nhưng
   c2a=no — apt-get update vẫn chạy; đúng — replay đang sống).
   **Luật (C): KHÔNG kích hoạt** (partial tăng trong lúc update;
   các sóng install có CPU 20–50%; không có trạng thái sống-kẹt).
4. **(c2) instrumentation: KHÔNG ĐỔI.** preview.tsx md5 `805409f0…`
   (y hệt T5/T5b đợt 130); media.ts không đổi `2c384ed1`. T5 pha 1
   KHÔNG làm lại instrumentation. Phân tích log draw là PHA 2 — xem §8.
5. **Headroom inotify: 2846 (mở) → 2844 (cuối)** — giảm 2 trong lượt;
   vẫn ~1,8 lần số watch vite thường cần (~1586); CHƯA tới ngưỡng báo
   user (< ~1.800, còn 1.044), chỉ theo dõi.
6. **RAM khả dụng 476–1876 MB trong lượt** (thấp nhất 476 MB lúc kiểm
   đầu 14:42Z; cao nhất 1876 MB poll 4 lúc install). Dù lấy số nào
   cũng < 6 GB guard — birefnet không thử.
7. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
   Queue cooldown 73 file / 1022 B (khớp đúng số T10 đếm lúc đóng đợt
   130) — không đổi trong lượt pha 1 boot1; 74 file lúc mở lại boot2
   (+cooldown-t4-round131). T5 KHÔNG đụng lock/queue.
8. **R9 (a) vẫn chờ user — nhắc lần 16.**
9. **Boot f868abad CHẾT trong khung (15:00:06Z, 15:01:30Z]** (lần cuối
   còn sống: mtime round131-t4.done 15:00:06Z); tuổi thọ 33m25s–
   34m49s — reboot GIỮA LUỘT lần thứ 4 liên tiếp. **Boot2 ad1327ef
   dạng (B) thuần** (configure 15:02:19Z rồi im, 0 proc, 2 dòng
   dpkg.log); **§8.2(B) TRIGGER=YES poll 7 (15:13:12Z, dpkg im 654s,
   đủ 5/5; kiểm chứng độc lập 5/5 lúc 15:14:14Z); --repair 1 lần có
   giám sát 15:15:22Z THÀNH CÔNG** (update ~14 phút, install xong
   15:29:55Z, dpkg 2→759 dòng, 109 installs y hệt #76?/#77? sau
   repair; RE-CHECK libs/GST/apt PASS đủ). **Cờ POSTBOOT_PASS boot2
   viết 15:31:20Z (poll 25, boot +29m50s)** — ghi tay do watcher b80
   gặp `FLAG_EXISTS already` (cờ boot1 còn đó, xem §14.3); đã xác
   nhận postboot exit 0 sau khi ghi (15:33:29Z). T8 đợt 131 gate
   bằng cờ này.
10. **PHA 2 (c2) ĐÃ XONG — kết luận chính (xem §8):** (a) đối chiếu
    trực tiếp từng event (c2) với log draw theo T3 §1.6 là **KHÔNG
    THỂ** — cửa sổ log (wallMs 10382–17223, seq ~0–43, tiền-flip)
    không phủ cửa sổ đo (seq 112–439, post-flip); (c2) xảy ra
    19,4–61,6 s sau khi log kết thúc. (b) Trong cửa sổ log,
    drawSrc **KHÔNG BAO GIỜ trễ** so với ct (0/103 entry lag ≥+1);
    rawUnit khớp drawSrc 50/50; wrap sạch → **LÀM YẾU** desync
    dạng đơn giản (giới hạn: log thưa median 104 ms, không phân
    giải lệch 33 ms). (c) DẤU (c2) ngược dự đoán desync (presented
    MỚI HƠN label +1f ×8, +3f ×1). (d) Cơ chế thay thế có bằng
    chứng mạnh hơn: **ghost sampler freeze + skew snap/label** —
    9/9 (c2) trong ±1 tick của run-end (đối chứng 18,6%, kỳ vọng
    1,7; p ~ 3×10⁻⁷); labelMs đóng băng 100–800 ms tại 2 freeze
    lớn; snap−label median 44 ms (≈1,3 frame). Lượt #9 cũng PHÁ
    tính đơn điệu giả thuyết thứ tự theo tick (+1/+2 43,1% ở
    median 56 ms — verdict chính thức là của T3 BƯỚC 2).

## 2. Boot #78? — chết trong khung (14:15:34Z, 14:26:41Z]

- Boot #78?: btime 13:02:41Z, boot_id
  `57c3e5e2-c31f-4d85-9e0e-28d615c0d061`. Lần cuối còn sống được ghi
  nhận: heartbeat 21:20:50+07 started 14:15:34Z (T7 đợt 131 — khung
  hẹp từ dữ liệu scheduler; xem build-loop-log entry T7 đợt 131).
  Khung rộng hơn (14:09:54Z, 14:26:41Z] từ mtime file
  `round130-t10.done` 14:09:54Z (T10 đóng đợt 130 xong 14:10Z, xem
  LIMITS gộp đợt 130 §10.4) vẫn đúng nhưng bị khung T7 bao trong.
- Boot mới btime 14:26:41Z → #78? chết trong khung (14:15:34Z,
  14:26:41Z] (rộng 11m07s — hẹp hơn khung 16m47s từ mtime t10.done;
  vẫn rộng hơn khung hẹp 25s của #77? vì không có waiter poll nào
  chạy trong khoảng đóng đợt / mở lượt). Tuổi thọ 1h12m53s–1h24m00s.
- Khung này KHÔNG có bản ghi thứ hai mâu thuẫn (T4 đợt 131 chưa đo
  gì trên #78? lúc reboot; T8 đợt 131 chưa ghi khung) — chỉ một khung,
  ghi nguyên trạng.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s,
  #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
  1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
  2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? 1h07m13s–1h24m00s
  (chết GIỮA ĐÓNG/MỞ), boot mới chưa biết (sống ≥25m tới cuối pha 1).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5 mở, nhưng
  là của CHÍNH đợt 131 này (tạo 14:35Z bởi parent vòng lặp, "Đợt
  131 đang chạy, hạn cứng 17:35Z") — KHÔNG phải đợt main-chat. Luật
  chốt chặn (chỉ chặn khi đợt main-chat đang chạy) không áp dụng;
  lượt cron làm việc bình thường.
- **Cờ POSTBOOT_PASS của T5b cho #78? đã STALE** (boot_id 57c3e5e2…,
  PASS 13:39:13Z) — T4/T8 đợt 131 gate bằng cờ MỚI của T5
  (round131-t5/).

## 3. Boot mới — replay CHẠY ĐẦY ĐỦ, đạt baseline 1509/217, KHÔNG --repair

### 3.1 Boot mới — btime 14:26:41Z, gap 1h24m00s

- Boot mới: 2026-11-17 14:26:41Z (btime kernel; `uptime -s` đồng ý;
  /proc/1 14:26:52Z, chênh +11s; boot_id
  `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`, sau #78? 1h24m00s).
  Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 131.
- `journalctl --list-boots` / `last -x`: không đọc (mẫu các đợt trước:
  chỉ còn 1 boot hiện tại) — không suy diễn thêm.

### 3.2 Replay boot mới — chạy đầy đủ, kẹp được bracket (8'58", 21'59"]

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 14:26:41 | 0 | btime |
| Configure (2 dòng dpkg.log) | 14:35:39 | +8m58s | dpkg.log |
| apt-get update bắt đầu | ~14:35 | ~+9m | pid 809 (elapsed 09:36 lúc 14:45:16Z) |
| T5 mở lượt | 14:41:47 | +15m06s | exec |
| apt-get update xong (lists 3 → 71) | ~14:47 | ~+20m | watcher poll 3 (dpkg 2 → 435) |
| Install bắt đầu (dpkg 2 → 435) | 14:47:17 | +20m36s | watcher poll 3 |
| Postboot PASS lần đầu | 14:48:17 | +21m36s | watcher poll 4 (dpkg 1339, 190 installs, GST 269) |
| Install xong (dpkg 1509, 217 installs) | 14:48:40 | +21m59s | dpkg.log (gói cuối gstreamer1.0-tools) |
| apt/dpkg/wrapper về 0 | 14:49:18 | +22m37s | watcher poll 5 |
| Cờ POSTBOOT_PASS viết (poll 6) | 14:50:18 | +23m37s | watcher log |
| Final confirm PASS | 14:51:09 | +24m28s | t5-postboot-newboot-final.log |

- **Bracket replay đầy đủ: (8'58", 21'59"]** — hoạt động apt đầu
  tiên 14:35:39Z (configure, boot +8m58s), cài xong toàn bộ 14:48:40Z
  (boot +21m59s), 0 entry dpkg/apt nào sau đó. Đây là bracket kẹp
  được bằng dpkg.log (cùng phương pháp S8 #48 / T8 #52 / T7 #54).
  NHANH NHẤT kể từ #48 (2'44") nếu tính từ lúc cài xong, nhưng
  configure khởi động muộn (+8m58s so với +43s của #78?) — update
  mất ~12 phút (mirror chậm, giống #78?) nhưng install chỉ ~1,5
  phút (từ archive cache — cache RV-backed sống qua reboot, theo
  chú thích replay payload).
- **Update (~12 phút):** pid 809 chạy xuyên suốt từ ~14:35Z,
  0.0% CPU ở các lần đọc tức thời (bình thường với update chờ
  mạng); partial/ TĂNG DẦN 92 (14:42Z) → 124 (poll 1, 14:45:16Z) →
  126 (poll 2, 14:46:17Z) — đang tải thật, không kẹt. Lists 3 → 71
  file (68 noble) khi update xong.
- **Install (~1,5 phút, theo sóng nhanh):** dpkg 2 → 435 (poll 3,
  65 installs) → 1339 (poll 4, 190) → **1509 (poll 5, 217
  installs)**. apt-get đổi PID mỗi sóng (809 → 5157 → 12029) —
  replay chạy nhiều lệnh apt-get install nối tiếp; sóng cài có
  %CPU cao (50,0% poll 3, 20,2% poll 4) — cài thật, không kẹt.
- **GST:** 0 file tới poll 2 → 32 file poll 3 → **269 file từ
  poll 4** (sóng lớn cài đủ plugin WebKit/GST; postboot PASS từ
  đây). Không cần symlink GST → debroot (khác #76?/#77? dạng (B)):
  thư mục plugin hệ thống thật đã đủ 269 file.
- **Lists boot mới: 71 file / 68 noble** (2 mirror — giống mẫu #77
  sau repair: 75 file / 68 noble; khác #78: 37 file / 34 noble, 1
  mirror). Postboot PASS đủ 11/11 gói nên chức năng đủ; ghi nhận,
  không suy diễn (theo dõi ở boot sau: nếu mirror thứ 2 lại vắng
  thì mới là mẫu).
- 0 apt/dpkg/wrapper đang chạy từ poll 5 (14:49:18Z) trở đi.

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
| #78? (replay) | 1509 | 217 | +43s | **CHẠY ĐẦY ĐỦ, PASS +36m32s, KHÔNG repair** |
| **mới (replay)** | **1509** | **217** | **+8m58s** | **CHẠY ĐẦY ĐỦ, PASS +23m37s, KHÔNG repair** |

- Dạng (B) thuần dừng ở 2 boot liên tiếp (#76?, #77?) — boot mới là
  boot thứ 2 liên tiếp replay chạy đầy đủ baseline. Baseline 1.509
  dòng / 217 installs giữ nguyên giá trị cho các boot replay chạy xong.
- Nhanh hơn #78? (+36m32s) nhờ install từ cache (~1,5 phút so với
  ~20,5 phút); update vẫn chậm ~12 phút (mirror).

### 3.4 Postboot boot mới — FAIL 3 poll, PASS 3 poll liên tiếp, cờ viết poll 6

- Postboot lúc mở lượt (poll0, ~14:44Z): FAIL exit 1 (0/11 gói
  apt, GST thiếu isomp4 + libav, debroot 269 file) — replay đang
  update, chưa cài gì.
- Sau sửa script (after-edit, ~14:44Z): vẫn FAIL exit 1 — logic
  không đổi.
- Watcher poll 1–3 (14:45:16–14:47:17Z): postboot exit 1 cả 3 poll;
  dpkg 2 → 435, installs 0 → 65, GST 0 → 32; apt-get luôn chạy
  (c2a=no) → **TRIGGER=NO mọi poll** (đúng — replay đang sống,
  không phải dạng (B)).
- Watcher poll 4 (14:48:17Z): postboot exit 0 LẦN ĐẦU (dpkg 1339,
  installs 190, GST 269, apt-get vẫn chạy pid 12029) — PASS streak
  bắt đầu.
- Poll 5 (14:49:18Z): dpkg=1509 installs=217, apt=0 apt-get=0
  dpkgproc=0 wrapper=0, postboot 0 — replay xong; frozen=no (dòng
  vừa tăng 1339 → 1509) nên cờ chưa ghi.
- Poll 6 (14:50:18Z): dpkg=1509 frozen=yes, silent 98s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 14:50:18Z (boot +23m37s)**; watcher
  tự kết thúc `done_pass_stable_2polls`.
- Final confirm 14:51:09Z exit 0. Tổng trên boot mới: postboot PASS
  4/4 sau poll 4 (poll 4–6 + final) + FAIL ở lần kiểm mở lượt +
  sau sửa script + poll 1–3 (đều exit 1, logic không đổi).
- Cờ POSTBOOT_PASS hiện tại là của boot mới (boot_id f868abad…).
  GST là thư mục hệ thống THẬT (269 file) — không có symlink →
  debroot (khác #76?/#77? sau repair).
- Mốc 17:35Z trong task không bị trễ (cờ viết 14:50:18Z, trước hạn
  đóng đợt gần 3 giờ); pha 1 xong trong ~10 phút làm việc.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 11:38Z (boot #77?, ~41' tuổi) | 2971 | mở lượt đợt 130 (headroom-open.txt) |
| T5, ~12:02Z (boot #77?, ~1h06' tuổi) | 2957 | cuối lượt đợt 130 (headroom-end.txt) |
| **T5b, 13:15Z (boot #78?, ~13' tuổi)** | **2952** | **mở lượt đợt 130 (headroom-open.txt)** |
| **T5b, ~13:40Z (boot #78?, ~37' tuổi)** | **2954** | **cuối lượt đợt 130 (headroom-end.txt)** |
| **T5, 14:43Z (boot mới, ~17' tuổi)** | **2846** | **mở lượt đợt 131 (headroom-open.txt)** |
| **T5, ~14:51Z (boot mới, ~25' tuổi)** | **2844** | **cuối pha 1 đợt 131 (headroom-end.txt)** |

- Headroom giảm 2 trong lượt (2846 → 2844) và giảm 108 so với cuối
  lượt T5b (2954 → 2846 qua reboot). Chuỗi dài hạn: 4438 → 4318 →
  3645 → 3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 → 3089 →
  3078 → 3079 → 2971 → 2957 → 2952 → 2954 → **2846 → 2844**.
  Vẫn gấp ~1,8 lần số watch vite thường cần (~1586). **Vite thường
  chạy được trên boot này. Chưa tới ngưỡng báo user (< ~1.800) —
  chỉ theo dõi** (quyết parent §12(h) đợt 127). Còn cao hơn ngưỡng
  1.044.
- Trần 63747 vẫn đầy ở mức ~60,9k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 14:41:47Z (mở lượt) | ~499 MB | lúc exec đầu (trước khi mở T5) |
| 14:42:09Z | 476 MB | **thấp nhất lượt** (lúc kiểm đầu) |
| 14:43:28Z (mở lượt) | 529 MB | ram-open.txt |
| 14:45:16Z (watcher poll 1) | 682 MB | update đang chạy (dpkg 2, 0 installs) |
| 14:46:17Z (poll 2) | 1841 MB | |
| 14:47:17Z (poll 3) | 1143 MB | install bắt đầu (dpkg 435, 65 installs) |
| 14:48:17Z (poll 4, PASS đầu) | 1876 MB | **cao nhất lượt** |
| 14:49:18Z (poll 5) | 1767 MB | |
| 14:50:18Z (poll 6, ghi cờ) | 1591 MB | |
| ~14:51Z | 1383 MB | cuối pha 1 (ram-end.txt) |

- RAM dao động 476–1876 MB trong lượt (hồi mạnh khi replay xong +
  các luồng đợt 131 đã xong phần nặng / T9 đo balloon đứng yên
  ~6,29 GB — xem LIMITS T9 đợt 131). Mức thấp nhất 476 MB vẫn > 0
  và cao hơn 473 MB cuối lượt T5 đợt 130 (thấp nhất từng ghi) 3 MB.
- Swap đã dùng: 340–364 MB lúc kiểm đầu/cuối (ghi nhận, không phân tích).
- Dù lấy số nào cũng < 6 GB guard — birefnet không thử.

## 5. Watcher — b79 v4 (6 poll, ghi cờ, tự kết thúc)

- Chạy 14:45:16–14:50:18Z (6 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script copy từ bản b78 đợt 130
  (v4) — chỉ đổi btime/mốc/log + ghi chú replay boot mới chạy đầy đủ;
  `bash -n` OK trước khi chạy.
- Poll 1 (14:45:16Z): dpkg=2 installs=0, dòng mới 14:35:40Z
  (configure), silent 576s, apt-get=1 (pid 809, elapsed 09:36,
  0.0% CPU), postboot 1, lists=3, partial=124, GST=0, RAM 682 MB.
  EVAL §8.2B TRIGGER=NO (c2a no — apt đang chạy).
- Poll 2 (14:46:17Z): dpkg=2 frozen=yes silent 637s, c2b/c3=yes,
  c4 form B=yes — NHƯNG c2a=no (apt-get pid 809 vẫn chạy, partial
  124 → 126) → **TRIGGER=NO**. Đúng quy trình: dpkg im >10 phút
  nhưng replay còn sống trong pha update thì không repair.
- Poll 3 (14:47:17Z): dpkg=435 installs=65, apt-get pid mới 5157
  (50,0% CPU), lists=71, GST=32 — install bắt đầu.
- Poll 4 (14:48:17Z): dpkg=1339 installs=190, GST 269, postboot 0
  lần đầu sau khi replay cài đủ plugin; apt-get vẫn chạy (pid 12029,
  20,2% CPU).
- Poll 5 (14:49:18Z): dpkg=1509 installs=217, apt=0, postboot 0 —
  replay xong.
- Poll 6 (14:50:18Z): dpkg=1509 frozen=yes, silent 98s, apt=0,
  postboot 0 → **FLAG_WRITTEN 14:50:18Z**.
- Cờ `POSTBOOT_PASS` (round131-t5/): `boot_id=f868abad-66fb-46e7-
  bbaa-cd3ec0cddf34 btime=2026-11-17T14:26:41Z pass_at=
  2026-11-17T14:50:18Z poll=6` — đúng boot mới. T4/T8 đợt 131 gate
  bằng cờ này.
- KHÔNG reboot trong lúc watcher chạy (14:45–14:50Z); boot_id không
  đổi suốt pha 1.
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.
- `wrapper=1` ở poll 1–2 và `wrapper=2` ở poll 3–4 là FALSE POSITIVE
  đã biết (pgrep -f 'os-intent' bắt shell replay của chính hệ thống
  + shell của lệnh kiểm — như đợt 127/129/130; poll 5–6 wrapper=0
  sau khi replay xong). Không ảnh hưởng EVAL (c2a tính cả wrapper
  nên TRIGGER luôn NO trong lúc replay chạy — đúng ý đồ an toàn).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt ~14:43Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **73 file / 1022 B**
  (khớp đúng số T10 đếm lúc đóng đợt 130) — không đổi trong lượt.
  Đều là cooldown cũ, không chặn luồng khác, không tính là ticket.
  Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125) —
  việc prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt (reboot đã xóa sót đợt
  130; T9 đợt 131 ghi 0 process lúc kiểm).

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

### 7.1 Đối chiếu §8.2 — boot mới (watcher b79 v4, poll 1–6; rút gọn)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 14:45:16Z | 576s | yes (exit 1) | no (apt chạy) | no | B (yes) | yes | **NO** |
| 2 | 14:46:17Z | 637s | yes | no (apt chạy) | yes (≥600s) | B (yes) | yes | **NO** |
| 3 | 14:47:17Z | 0s | yes | no (apt chạy) | no | - (no) | yes | **NO** |
| 4 | 14:48:17Z | 1s | no (exit 0) | no (apt chạy) | no | - (no) | yes | **NO** |
| 5 | 14:49:18Z | 38s | no (exit 0) | yes | no | - (no) | yes | **NO** |
| 6 | 14:50:18Z | 98s | no (exit 0) | yes | no | - (no) | yes | **NO** |

- **TRIGGER=NO ở cả 6 poll** — replay sống suốt lượt (apt chạy
  liên tục; dpkg im dài nhất 637s ở poll 2 NHƯNG apt-get vẫn chạy
  và partial vẫn tăng — c2a=no nên không đủ điều kiện). Không có
  thời điểm nào đủ điều kiện --repair, và cũng không cần repair vì
  replay tự chạy xong.
- **§8.2(B) KHÔNG kích hoạt đợt này** (sau 2 lần kích hoạt liên
  tiếp ở #76? và #77?, và 2 đợt liên tiếp TRIGGER=NO ở #78?/mới).
- Luật (C) trên boot mới: không áp dụng — apt không sống-kẹt:
  update tải thật (partial tăng 92 → 126), các sóng install có
  %CPU >0 (50,0% poll 3, 20,2% poll 4 — cài thật); dpkg im dài
  nhất 637s < 900s. EVAL_C ở mọi poll: b_stuck_maybe=no.
- Không có kiểm chứng độc lập pre-repair nào — không có repair để
  kiểm chứng (đúng quy trình: chỉ kiểm chứng khi TRIGGER=YES).

## 8. PHA 2 — Phân tích log draw cho (c2) (quyết parent §12.3(b) đợt 130) — ĐÃ XONG

- **Trạng thái: ĐÃ LÀM XONG (15:0x–15:3xZ).** Cờ `round131-t4.done`
  xuất hiện 15:00:06Z (TRƯỚC reboot 15:01:30Z — T4 đóng lượt yên #9
  lúc 14:59Z: attempt1 20/20, median 56,0 ms, lớp B 5/5, log draw
  n=103). **NHƯNG LIMITS T4 đợt 131 KHÔNG CÓ trên đĩa** (không có
  file docs/PHASE9_ROUND131_T4_*; trong round131-t4/ cũng không có
  LIMITS — T4 chỉ kịp touch .done trước reboot). Pha 2 làm từ JSON
  gốc attempt1 + analyzer outputs của T4 trên đĩa + LIMITS T3 đợt 131
  (dự báo falsifiable + histogram 8 lượt — T3 đã tính histogram #9).
- **Tái kiểm độc lập (phương pháp T10):** histogram 8 lượt chạy lại
  từ script T3 → **byte-identical** với `c2-histogram-8runs.txt`
  của T3; labellag attempt1 chạy lại từ analyzer T4 →
  **byte-identical** với `analyze-t4-attempt1-labellag.txt` của T4.
  Số liệu dưới đây đã qua 2 lớp xác nhận (T3/T4 + T5 chạy lại).

### 8.1 Dữ liệu lượt yên #9 (attempt1, T4 — đã đóng)

- 20/20 pass, exit 0; tickCost total median **56,0 ms** (n=557, p90
  81,0, max 109); lớp B 5/5 ĐẠT (load1 max 3,08; RAM min 1157 MB;
  không reboot trong cửa sổ đo; apt 0). Ngưỡng ≤60 ms GIỮ.
  **Lượt yên #9 là lượt chậm nhất trong 8 lượt hợp lệ** (các lượt
  trước: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 ms).
- Histogram #9 (n=656 ghost, nomatch 0): bin **0: 222 (33,8%)**,
  +1: 118 (18,0%), +2: 165 (25,2%), **+1/+2: 283 (43,1%)**, **+3: 85
  (13,0%)**, +4: 2 (0,3%), <0: 64 (9,8%). snapMs−labelMs median
  44 ms; rawMs−labelMs median 9 ms; label−floor {1: 447, 0: 209}.
- **(c2) skp=0: 9 occurrence** (tái kiểm byte-identical): 8× lag +1f
  (seq 161, 204, 246, 267, 288, 375, 397, 420) + 1× lag **+3f**
  (seq 421, presented 19, label 16). skp=1: (c2)=0. Lag ≥+5f: 0.
- So với dự báo T3 §1.4 (đăng ký 14:47Z, TRƯỚC khi T4 đo): median
  56,0 ms **NẰM NGOÀI bảng dự báo** (bảng chỉ có tới dải 51–55 ms) —
  dải ngoại suy theo hồi quy: +1/+2 ~28–34% (±3pp), +3 ~13–21%
  (±4pp), bin 0 35–39%. Quan sát: +1/+2 **43,1%** (cao hơn biên
  trên ngoại suy 9,1pp), +3 **13,0%** (đúng biên dưới ngoại suy),
  bin 0 **33,8%** (dưới biên dưới 1,2pp). **Tính đơn điệu BỊ PHÁ
  ở lượt #9:** +1/+2 theo median: 52,7 → 52,4 → 47,3 → 43,5 →
  39,5 → 36,6 → 33,9 → **43,1** (tăng lại ở 56 ms); +3: 3,8 →
  4,6 → 5,7 → 7,4 → 10,5 → 12,5 → 18,3 → **13,0** (giảm lại ở
  56 ms). **Verdict dự báo chính thức là việc của T3 (BƯỚC 2)** —
  T5 chỉ ghi số + lưu ý bảng dự báo không có hàng 56 ms nên quy
  tắc §1.5 cần dải ngoại suy hoặc mở rộng bảng; T3 quyết trong
  BƯỚC 2 của mình. (c2) count 9: ngoài dải kỳ vọng 2–8 đúng 1 —
  theo §1.5 ghi là lệch Poisson, không tự bác giả thuyết.
- Pool 8 lượt hợp lệ: n=5548, 0: 36,9%, +1/+2: 44,0%, +3: 9,2%.

### 8.2 Kết luận pha 2 (4 điểm — xem chi tiết §8.3–§8.6)

1. **Đối chiếu trực tiếp từng event (c2) với log draw theo quy tắc
   T3 §1.6 là KHÔNG THỂ với dữ liệu hiện có** — cửa sổ log draw
   (wallMs 10382–17223, tương đương seq ~0–43, TRƯỚC flip) KHÔNG
   phủ cửa sổ đo (post flip+2000ms, tBlend ≥29639, seq 112–439);
   các event (c2) (seq 161–421) xảy ra 19,4–61,6 GIÂY SAU KHI log
   draw kết thúc. Instrumentation như thiết kế chỉ ghi 2 vòng loop
   sau wrap đầu tiên (tiền-flip) — đây là THIẾU SÓT THIẾT KẾ đối
   với mục đích đối chiếu, không phải thiếu dữ liệu đo. Muốn kiểm
   tra §1.6 đúng nghĩa cần 1 lượt yên BẬT log draw PHỦ cửa sổ
   post-flip (ghi log trong lúc đo, không chỉ 2 loop đầu).
2. **Trong cửa sổ log được (n=103): drawSrc KHÔNG BAO GIỜ trễ so
   với currentTime** (floor(ct*30)−frameIdx: −1 ở 65 entry, 0 ở 38
   entry, KHÔNG có entry nào ≥+1 — tức frameIdx không bao giờ
   chạy sau ct); rawUnit luôn vẽ ĐÚNG frame với drawSrc gần nhất
   (50/50, chênh 0); quanh wrap duy nhất, drawSrc vẽ f0 đúng sau
   wrap (không giữ frame cũ f64). → **LÀM YẾU** giả thuyết
   seek-latency desync dạng đơn giản (drawSrc giữ frame cũ) — với
   2 giới hạn: (a) log lấy mẫu THƯA (khoảng cách drawSrc liên tiếp
   median 104 ms, max 965 ms — không phân giải được lệch 33 ms =
   1 frame); (b) cửa sổ log là regime tiền-flip, khác regime đo.
3. **DẤU của (c2) ngược với dự đoán của desync dạng đơn giản:**
   mọi (c2) đều có presented MỚI HƠN label (+1f ×8, +3f ×1) —
   trong khi drawSrc giữ frame cũ sẽ cho presented CŨ HƠN label
   (lag âm). → **LÀM YẾU thêm** desync như đã diễn đạt.
4. **Cơ chế thay thế CÓ BẰNG CHỨNG MẠNH HƠN — ghost sampler
   freeze + độ lệch lấy mẫu snap/label:** 9/9 event (c2) nằm
   trong ±1 tick của cuối một curPix run đóng băng (đối chứng:
   chỉ 18,6% tick post nằm trong ±1 tick của run-end; kỳ vọng
   ngẫu nhiên 1,7/9 — quan sát 9/9, p ~ 3×10⁻⁷); ghost labelMs
   ĐÓNG BĂNG 100–800 ms tại cả 2 lần freeze lớn (seq 154–161:
   labelMs kẹt 35305 suốt 8 tick rồi nhảy +814 ms; seq 417–420:
   labelMs kẹt 77711 suốt 4 tick rồi nhảy +777 ms); độ lệch hệ
   thống snapMs−labelMs median 44 ms (≈1,3 frame) giải thích
   khối +1/+2. Chi tiết §8.5–§8.6.

### 8.3 Cửa sổ log draw KHÔNG phủ cửa sổ đo (chứng minh)

- Log draw: n=103, wallMs 10382 → 17223 (span 6841 ms), loopNo 1–2,
  frameIdx 0–67, ct 0 → 2,233 s.
- Flip wallMs=27639; cửa sổ post = tBlend ≥ flip+2000 = 29639
  (seq 112 → 439, tBlend 29713 → 80518).
- Draw log max (17223) < flip (27639) — kết thúc 10,4 s TRƯỚC flip;
  < post-window start (29639) — 12,4 s trước. Tick đầu tiên có
  tBlend ≥ drawlog-max là seq 43 (tBlend 18261) — log chỉ phủ
  khoảng seq 0–43 (các pass đầu, tiền-flip).
- (c2) seq 161–421: tBlend 36626–78810 — sau drawlog-max 19,4–
  61,6 giây. **Không có event (c2) nào nằm trong cửa sổ log.**
- Cùng clock: tickCost[0].wallMs=10409 ≈ drawlog đầu 10382;
  ghost labelMs tick0 = 10467 — cùng thang wallMs của probe.
  Không có độ không chắc chắn về clock nào cứu được khoảng
  cách 10+ giây này.

### 8.4 Phân tích nội bộ log draw (n=103, code riêng T5)

- **B1 — frameIdx vs ct:** floor(ct*30)−frameIdx = −1 (65 entry),
  0 (38 entry), KHÔNG có +1 trở lên. Riêng drawSrc (n=53): −1 ở
  33, 0 ở 20. Riêng rawUnit (n=50): −1 ở 32, 0 ở 18. Giá trị −1
  (frame CHẠY TRƯỚC ct 1) là artifact lấy mẫu (ct đọc sau khi
  chọn frame) — không phải trễ. **Không có bằng chứng drawSrc
  trễ trong cửa sổ log.**
- **B2 — cặp drawSrc → rawUnit:** rawUnit.frameIdx −
  drawSrcGầnNhất.frameIdx = 0 ở cả 50/50 cặp. Hai điểm log luôn
  đồng bộ frame trong cửa sổ log.
- **B3 — đơn điệu / lặp / nhảy:** drawSrc loop 1 (n=27): lặp frame
  11 lần, nhảy >1 frame 14 lần; loop 2 (n=26): lặp 5, nhảy 15;
  KHÔNG có lần lui frame nào ngoài wrap. Nhảy frame là hệ quả
  của lấy mẫu thưa (B5), không phải bỏ frame.
- **B4 — wrap duy nhất (idx 52→53):** rawUnit f64 ct=2,133
  wallMs=13751 loop 1 → drawSrc f0 ct=0,000 wallMs=14111 loop 2
  (cách 360 ms) → drawSrc f0 wallMs=14221 → rawUnit f0
  wallMs=14226. Sau wrap, drawSrc vẽ f0 ĐÚNG (không giữ f64 cũ).
- **B5 — khoảng cách drawSrc liên tiếp:** median 104,0 ms, min
  40,0 ms, max 965,0 ms; 52/52 >33 ms, 50/52 >66 ms. Log là mẫu
  THƯA (không phải từng frame) — **không phân giải được lệch
  1 frame (33 ms)**. Mọi kết luận "không trễ" ở §8.2 mục 2 chỉ có
  giá trị ở độ phân giải ~100 ms, không loại trừ trễ 1 frame
  trong cửa sổ log.

### 8.5 (c2) ↔ curPix run đóng băng + ghost sampler freeze (từ JSON gốc)

- CurPix run ≥3 tick (phương pháp md5 giống histogram script,
  tính lại độc lập): **21 run**, 87/328 tick post nằm trong run;
  runs: (129,135,7), (154,160,7), (180,182,3), (202,204,3),
  (207,210,4), (228,230,3), (231,233,3), (234,236,3), (239,245,7),
  (256,258,3), (261,266,6), (285,287,3), (308,312,5), (333,337,5),
  (339,341,3), (343,345,3), (352,354,3), (359,361,3), (371,375,5),
  (393,397,5), (419,421,3). (Khớp danh sách run của T3.)
- **(c2) seq → khoảng cách tới run-end gần nhất:** 161:+1, 204:0,
  246:+1, 267:+1, 288:+1, 375:0, 397:0, 420:−1 (trong run, còn 1
  tick), 421:0. **9/9 trong ±1 tick của run-end.** Đối chứng:
  61/328 tick post (18,6%) nằm trong ±1 tick của run-end → kỳ
  vọng ngẫu nhiên 1,7/9. p(9/9 | p=0,186) ≈ 3×10⁻⁷.
- Chiều ngược KHÔNG đủ: chỉ **4/21 run-end là (c2)**
  (204, 375, 397, 421). Run-end là điều kiện GẦN-CẦN (9/9 (c2)
  ở biên run) nhưng KHÔNG ĐỦ (17/21 run-end không phải (c2)) —
  vì (c2) còn cần strip của frame đóng băng KHÁC pixel thật với
  strip của label (alias chu kỳ 4 frame: lệch +4 sẽ alias về 0,
  không tính (c2)).
- **Ghost sampler freeze (bằng chứng trực tiếp):** ghost labelMs
  ĐÓNG BĂNG y hệt tick trước ở 61/328 tick post (18,6%); chuỗi
  đóng băng dài nhất 7 tick. Hai lần lớn nhất:
  - seq 154–161: labelMs kẹt **35305** suốt 8 tick (cả 2 occurrence
    của mỗi tick), rồi nhảy +814 ms ở occ1 seq 161 (labelMs 36119);
    (c2) seq 161 (+1f) đúng tại tick occ1 vừa tươi lại.
  - seq 417–420: labelMs kẹt **77711** suốt 4 tick, rồi nhảy +777 ms
    ở occ1 seq 420 (labelMs 78488); (c2) seq 420 (+1f) và 421 (+3f)
    ngay sau đó.
  - Tại seq 421: occ1 (label 16, labelMs 78667, snapMs 78719) có
    strip khớp frame 19 = floor(ct 0,637×30); label (16) lấy từ
    labelCt 0,5511 — lệch 86 ms video ≈ 2,6 frame → lag +3f.
    occ0 seq 421 (label 15, labelMs 78488) khớp đúng frame của nó
    → không phải (c2). Mỗi occurrence tự nhất quán (pix khớp label
    của chính nó); (c2) sinh ra khi so pix của occurrence với
    `presented` của TICK (mới hơn label của snapshot).
- **Độ lệch hệ thống snap−label:** snapMs−labelMs median 44 ms
  (≈1,3 frame) ở #9 (so với 34 ms ở #8); rawMs−labelMs median
  9 ms. Pixel (snap) được lấy ~44 ms SAU khi label được tính →
  pixel hiển thị frame mới hơn label ~1 frame — giải thích khối
  +1/+2 trong histogram. Khi sampler đóng băng, độ lệch này phình
  tới ~800 ms (label kẹt) rồi bắt kịp — sinh (c2) +3f ở tick bắt
  kịp.
- **Đọc cơ chế (kết luận T5):** (c2) lag = (thời gian video tại
  lúc lấy pixel) − (thời gian video tại lúc tính label), tính
  bằng frame. Đây là **độ lệch lấy mẫu của ghost sampler**
  (measurement skew + sampler stall), KHÔNG phải bằng chứng
  render pipeline vẽ frame cũ. Draw log không liên quan trực
  tiếp tới cơ chế này (nó log việc tạo/vẽ drawSrc, không log
  việc lấy ghost snapshot) — phù hợp với việc log draw không
  thấy trễ nào.
- Giới hạn trung thực: tương quan freeze↔(c2) rất mạnh (9/9)
  nhưng là quan sát trên 1 lượt, n=9 event nhỏ; cơ chế
  snap/label skew giải thích được DẤU (+) và ĐỘ LỚN (+1f thường,
  +3f khi freeze dài) nhưng chưa có thực nghiệm can thiệp (vd
  sửa probe lấy label và pixel cùng thời điểm) để chứng minh
  nhân quả. Không tuyên bố "đã chứng minh (c2) là artifact đo" —
  chỉ "bằng chứng nghiêng mạnh về phía đó; desync dạng đơn giản
  bị làm yếu".

### 8.6 Hệ quả cho giả thuyết thứ tự theo tick + việc cần làm tiếp

- Giả thuyết thứ tự theo tick (T3 §4.3 đợt 130): dự báo ĐÚNG
  7/7 lượt trước, nhưng lượt #9 PHÁ tính đơn điệu ở cả hai dải
  (xem §8.1) — cần T3 verdict BƯỚC 2 (bảng dự báo không có hàng
  56 ms; hồi quy tuyến tính ngoại suy quá đà: +1/+2 dự báo ~31%
  so với quan sát 43,1%). Hướng giải thích nhất quán với dữ
  liệu mới: tick chậm → sampler stall nhiều hơn → phân phối
  RỘNG RA (cả +1/+2 và +3 cùng cao, bin 0 thấp nhất) thay vì
  chỉ DỊCH PHẢI như hồi quy tuyến tính dự báo. Đây là giả thuyết
  mới, cần lượt #10 kiểm chứng — không kết luận ở đây.
- **Đề xuất cho parent (không tự làm):** (i) sửa instrumentation
  log draw để phủ cửa sổ post-flip (ghi trong lúc đo, vd 2 loop
  sau flip thay vì 2 loop sau wrap đầu) thì mới đối chiếu §1.6
  đúng nghĩa ở lượt sau; (ii) cân nhắc probe lấy label và pixel
  cùng thời điểm (hoặc ghi timestamp lấy mẫu của từng ghost) để
  tách skew đo khỏi lag render thật; (iii) T3 verdict BƯỚC 2 cho
  lượt #9 (bảng dự báo cần hàng 56 ms hoặc ghi rõ ngoại suy).
- Không chạy lượt đo E4 hay TTS nào cho pha 2 (theo quyết parent).
- File phân tích: `round131-t5/t5-c2-drawlog-analysis.py` +
  `t5-c2-drawlog-analysis.txt` (KHÔNG stage — harness nội bộ,
  như các analyzer của T4/T3).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (3 lần, không đổi logic)

- Lần 1 (boot mới, ~14:44Z): md5 `0b73b3bc…` → `a7958cc8…` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Lần 2 (~14:53Z): chỉ sửa khung chết #78? trong header theo T7 đợt
  131 ((14:09:54Z, 14:26:41Z] → (14:15:34Z, 14:26:41Z], tuổi thọ
  1h07m13s → 1h12m53s ở đầu dưới); md5 sau lần 2 ghi trong
  `postboot-check.md5.after2`. Không đổi logic.
- Lần 3 (boot2, ~15:05Z): header bổ sung đoạn f868abad chết trong
  khung (15:00:06Z, 15:01:30Z] + đoạn boot2 (replay MỚI BẮT ĐẦU —
  configure 15:02:19Z, chưa thấy apt-get update chạy lúc 15:04Z);
  dòng `say` cập nhật tương ứng; md5 `066e10ca…` → `66ac9e3d…`
  (ghi trong `postboot-check.md5.before2` / `.after2`). `bash -n`
  OK sau mỗi lần sửa.
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #78? chết trong khung (14:15:34Z, 14:26:41Z],
  tuổi thọ 1h12m53s–1h24m00s; reboot giữa đợt đóng / lượt mở lần
  thứ 3 liên tiếp + đoạn boot mới (replay ĐANG CHẠY — configure
  14:35:39Z, apt-get update đang chạy, partial tăng, KHÔNG phải dạng
  (B)) + đoạn f868abad chết / boot2 (lần 3); dòng `say` cập nhật
  tương ứng. Dòng `say` mới không chứa ký tự `"` (dùng `m`/`s` thay
  dấu phút/giây) — không lặp sự cố đợt 120. `bash -n` OK.
- Kiểm chứng: sau khi sửa lần 1, postboot vẫn FAIL exit 1 (lần kiểm
  sau sửa ~14:44Z) — logic không đổi đã được xác nhận bằng chạy
  thật; sau replay xong, cùng script này PASS exit 0 (poll 4–6 +
  final). Sau sửa lần 3, postboot boot2 vẫn FAIL exit 1 (poll0
  ~15:05Z); sau --repair, cùng script này PASS exit 0 (RE-CHECK +
  final 15:32:55Z + sau ghi cờ 15:33:29Z).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên. (--repair chạy 1 lần cho boot2, xem §14.)

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #78?→mới giữa đóng đợt 130 / mở lượt 131 là ví dụ mới nhất
  (lần thứ 3 liên tiếp reboot rơi vào khoảng giữa đợt đóng / lượt mở
  / giữa lượt) cho thấy R9 (a) vẫn có giá trị: T4 đợt 131 phải chờ cờ
  POSTBOOT_PASS mới (T5 viết 14:50:18Z, ~15 phút sau khi lượt mở)
  mới gate được lượt yên #9. Reboot f868abad→ad1327ef giữa lượt
  15:01:30Z (lần thứ 4 liên tiếp) là ví dụ mới hơn nữa: T5 phải làm
  lại pha 1 từ đầu cho boot2 (cờ mới 15:31:20Z, ~30 phút sau reboot)
  và T8 đợt 131 gate bằng cờ boot2. Vá §8.4(ii) + cờ gắn boot_id đã
  giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 11. Nợ mở sang đợt sau

1. **Boot2 ad1327ef đang sống + PASS (dạng (B) + --repair 1 lần) — các
   luồng đo đợt 131 dùng cờ này** (`round131-t5/POSTBOOT_PASS`,
   boot_id ad1327ef…, PASS 15:31:20Z, xác nhận lại final 15:32:55Z +
   sau ghi cờ 15:33:29Z). Cờ f868abad (PASS 14:50:18Z, bản sao lưu
   tại POSTBOOT_PASS.boot1-f868abad) đã STALE. Nếu boot2 cũng chết
   sớm như #72? (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải
   làm lại từ đầu. Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32,
   #68? 3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72?
   54m08s, #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75?
   1h45m45s–1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
   2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? 1h12m53s–1h24m00s
   (chết GIỮA ĐÓNG/MỞ), f868abad 33m25s–34m49s (chết GIỮA LUỘT),
   boot2 chưa biết (sống ≥32m tới cuối lượt T5).
2. **Số thứ tự boot #78?/mới TẠM — chờ T6 chốt mù #37 đợt 131**
   (quyết parent đợt 130 §12.3(h)). Nếu T6 đếm khác, LIMITS này +
   script postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **Khung #78? chết (14:15:34Z, 14:26:41Z] rộng 11m07s** (T7 đợt 131
   thu hẹp từ dữ liệu scheduler — HB 21:20:50+07 started 14:15:34Z;
   khung rộng hơn (14:09:54Z, 14:26:41Z] từ mtime t10.done vẫn đúng
   nhưng bị bao trong) — không có waiter poll trong khoảng đóng/mở
   nên không kẹp hẹp hơn được từ trong VM; ghi nguyên trạng, không
   suy diễn thêm.
4. **PHA 2 (c2) ĐÃ XONG** — xem §8: đối chiếu trực tiếp KHÔNG THỂ
   (cửa sổ log không phủ cửa sổ đo); desync dạng đơn giản BỊ LÀM YẾU
   (drawSrc không trễ trong log + dấu (c2) ngược dự đoán); cơ chế
   ghost-freeze + skew snap/label có bằng chứng mạnh hơn (9/9 (c2)
   ở biên run, p ~ 3×10⁻⁷). Đề xuất parent: instrumentation log draw
   phủ cửa sổ post-flip ở lượt sau; probe ghi timestamp lấy mẫu
   từng ghost; T3 verdict BƯỚC 2 cho lượt #9.
5. **Lists boot mới 71 file / 68 noble (2 mirror)** — giống mẫu #77
   sau repair, khác #78 (37/34, 1 mirror). Postboot PASS đủ 11/11
   nên chức năng đủ; theo dõi ở boot sau (nếu mirror thứ 2 lại vắng
   thì mới là mẫu).
6. **Headroom tiếp tục giảm dài hạn:** …3334 → 3317 → 3315 →
   3203/3205 → 3089 → 3078 → 3079 → 2971 → 2957 → 2952 → 2954 →
   **2846 → 2844** (boot f868abad) → **2851 → 2849** (boot2 —
   tăng 7 qua reboot, giảm 2 trong lượt làm lại). Trần 63747 cần
   can thiệp host — ngoài tầm luồng này. Ngưỡng báo user < ~1.800
   chưa tới (còn 1.049).
7. **RAM thấp nhất lượt 461 MB** (cuối lượt làm lại boot2, 15:32Z) —
   THẤP NHẤT TỪNG GHI (phá kỷ lục 473 MB cuối lượt T5 đợt 130);
   dao động mạnh theo luồng khác (boot1: 476–1876 MB; boot2:
   1403–3145 MB lúc mở/watcher, 461 MB cuối); T9 theo dõi RAM ghim
   (nhiệm vụ T9). Balloon virtio ~6,29 GB đứng yên (T9 đợt 131).
8. **Khung giờ #78? chết đã kẹp (16m47s)** — rộng hơn khung #77?
   (25s) vì không có waiter trong khoảng đóng/mở; khung #76? chết
   (10:02:05Z, 10:56:31Z] vẫn mở rộng 54m26s; khung #71? chết vẫn mở.
9. **R9 (a) vẫn chờ user (nhắc lần 16).**
10. **Cooldown file tích lũy (73 file / 1022 B, không đổi)** — luật
    prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
    của T6.
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 130 §11 + quyết
    parent §12.3: mù #49 B mở + mù #50 mới mở (T2 đợt 131 probe #50);
    G1 chờ user quyết; birefnet (chỉ thử lại khi quan sát được
    available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml
    vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
    KHÔNG push khi user chưa nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI trong pha 1 (md5 `805409f0`, y hệt
  T5/T5b đợt 130 sau instrumentation (c2)); `media.ts`: KHÔNG đổi
  (`2c384ed1`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (tham chiếu #78? → boot mới trong header + dòng `say`; md5
  `0b73b3bc…` → `a7958cc8…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa boot mới) OK; watcher b79 OK.
- `tsc` / `vite build`: KHÔNG chạy trong pha 1 (không sửa production;
  tsc đã exit 0 trên boot mới theo entry T4 đợt 131 — kiểm sau).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  476–1876 MB < 6 GB).
- O8: KHÔNG thuộc T5 (T8 gate bằng cờ này).
- Postboot boot mới: FAIL ở lần kiểm mở lượt + sau sửa script + poll
  1–3; PASS 4/4 sau poll 4 (poll 4–6 + final confirm).
  Watcher b79 v4: 6 poll, tự kết thúc `done_pass_stable_2polls`,
  exit 0. **Reboot GIỮA LUỘT T5 pha 1: KHÔNG.**
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=NO cả 6
  poll** (replay sống suốt lượt; dpkg im dài nhất 637s ở poll 2
  nhưng apt-get vẫn chạy + partial tăng). **KHÔNG --repair**
  (không đủ điều kiện, không cần). **Luật (C): ĐÁNH GIÁ MỖI POLL,
  KHÔNG KÍCH HOẠT** (apt tải/cài thật, không sống-kẹt).
- Headroom: 2846 (mở) → 2844 (cuối pha 1).
- RAM thấp nhất lượt: 476 MB (lúc kiểm đầu); cao nhất 1876 MB (poll 4).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  73 file / 1022 B, không đổi).
- `preview.tsx`: KHÔNG ĐỔI trong cả đợt (md5 `805409f0`, y hệt
  T5/T5b đợt 130 sau instrumentation (c2)); `media.ts`: KHÔNG đổi
  (`2c384ed1`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 3 lần
  (tham chiếu boot trong header + dòng `say`; md5 `0b73b3bc…` →
  `a7958cc8…` → `066e10ca…` → `66ac9e3d…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau cả 3 lần sửa) OK; watcher b79/b80 OK.
- `tsc` / `vite build`: KHÔNG chạy trong lượt T5 (không sửa production;
  tsc đã exit 0 trên boot f868abad theo entry T4 đợt 131).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  461–3145 MB < 6 GB).
- O8: KHÔNG thuộc T5 (T8 gate bằng cờ này — cờ boot2 đã đúng).
- Postboot boot f868abad: FAIL ở lần kiểm mở lượt + sau sửa script +
  poll 1–3; PASS 4/4 sau poll 4 (poll 4–6 + final confirm).
  Watcher b79 v4: 6 poll, tự kết thúc `done_pass_stable_2polls`,
  exit 0. **Reboot GIỮA LUỘT T5 pha 1 (boot1): KHÔNG** (reboot xảy
  ra SAU khi pha 1 xong, lúc T5 chờ pha 2).
- **§8.2 dạng (B) ngưỡng 10' (boot1): ĐÁNH GIÁ MỖI POLL. TRIGGER=NO
  cả 6 poll** (replay sống suốt lượt; dpkg im dài nhất 637s ở poll 2
  nhưng apt-get vẫn chạy + partial tăng). **KHÔNG --repair** (không
  đủ điều kiện, không cần). **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG
  KÍCH HOẠT** (apt tải/cài thật, không sống-kẹt).
- Headroom boot1: 2846 (mở) → 2844 (cuối pha 1); boot2: 2851 (mở) →
  2849 (cuối lượt làm lại).
- RAM thấp nhất lượt: 461 MB (cuối lượt làm lại boot2 — thấp nhất
  từng ghi); cao nhất 3145 MB (watcher b80 poll 1).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  73 file / 1022 B boot1 → 74 file boot2, +cooldown-t4-round131).
- Event lag (c2): pha 2 ĐÃ XONG — xem §8 (histogram + labellag tái
  kiểm byte-identical; (c2) #9 = 9, 8× +1f + 1× +3f seq 421).
- **Làm lại pha 1 boot2: xem §14** (§8.2(B) TRIGGER=YES poll 7;
  --repair 1 lần thành công; cờ ghi tay do `FLAG_EXISTS already`).

## 14. LÀM LẠI PHA 1 CHO BOOT2 ad1327ef (sau reboot giữa lượt 15:01:30Z)

### 14.1 Boot f868abad — chết trong khung (15:00:06Z, 15:01:30Z]

- Boot f868abad: btime 14:26:41Z, boot_id
  `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`. Lần cuối còn sống ghi nhận:
  mtime file `round131-t4.done` 15:00:06Z (T4 đóng lượt yên #9 lúc
  14:59Z, .done 15:00:06Z). Boot2 btime 15:01:30Z → f868abad chết
  trong khung (15:00:06Z, 15:01:30Z] (rộng 84s — khung hẹp thứ hai
  từ trước tới nay sau khung 25s của #77?). Tuổi thọ 33m25s–34m49s.
- Reboot GIỮA LUỘT lần thứ 4 liên tiếp (#75? giữa lượt đợt 129,
  #77? giữa lượt đợt 130, #78? giữa đóng 130 / mở 131, f868abad
  giữa lượt đợt 131). Session T5 bị giết trong lúc chờ pha 2
  (runtime restart + reboot cell cùng cửa sổ ~15:00–15:02Z); T5
  kiểm đĩa trước rồi tiếp tục theo brief (không kết luận luồng nào
  chết khi chưa kiểm đĩa — T4 .done + JSON + analyzer đều có đủ
  trên đĩa, chỉ thiếu LIMITS T4 — xem §8).
- **Chốt chặn:** `round-in-progress.md` vẫn là của CHÍNH đợt 131 —
  làm lại pha 1 được phép như thường.
- **Cờ POSTBOOT_PASS của f868abad đã STALE** (boot_id f868abad…,
  PASS 14:50:18Z) — bản sao lưu tại
  `POSTBOOT_PASS.boot1-f868abad`. T8 đợt 131 gate bằng cờ MỚI
  (boot2).

### 14.2 Boot2 — replay dạng (B) thuần + --repair 1 lần thành công

- Boot2: btime 2026-11-17 15:01:30Z (btime kernel; `uptime -s`
  đồng ý; /proc/1 15:01:44Z, chênh +14s; boot_id
  `ad1327ef-e045-4d44-ae14-13c76bab50ec`, sau f868abad 34m49s).
  Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 131.
- Replay boot2: configure 15:02:19Z (boot +49s), dpkg.log 2 dòng,
  0 install, lists 5 file, partial 0 file — rồi IM HOÀN TOÀN, 0
  process apt/dpkg/wrapper từ poll 1 (15:07:10Z) trở đi. Khác
  f868abad (update chạy ngay cùng phút với configure) và #78?
  (configure +43s rồi update ngay). Đây là **dạng (B) thuần lần
  thứ 3** (#76?, #77?, boot2) — "chạm mà không cài".
- **§8.2(B) boot2 — TRIGGER=YES poll 7 (15:13:12Z):** c1 FAIL tươi
  (postboot exit 1); c2a 0 proc (apt=0 apt-get=0 dpkg=0 wrapper=0);
  c2b dpkg im 654s ≥600s; c3 chờ ≥600s; c4 dạng (B) (2 dòng, 0
  install); c5 không probe (MiniBrowser=0, 0 webkit/chromium).
  Poll 1–6 TRIGGER=NO (silent 291→592s, chưa đủ 600s). Luật (C):
  KHÔNG kích hoạt (không có apt sống-kẹt để kill — 0 proc; dạng
  (B) thuần, không phải (C); EVAL_C b_stuck_maybe=no mọi poll).
- **Kiểm chứng độc lập 5/5 lúc 15:14:14Z (TRƯỚC repair):** postboot
  FAIL exit 1 tươi; apt=0 apt-get=0 dpkg=0 wrapper=0; dpkg im
  715s; lock dpkg rảnh (fuser trống); dạng (B) 2 dòng/0 install;
  MiniBrowser=0, 0 process webkit/chromium, /tmp/.X11-unix/ trống.
  Boot vẫn ad1327ef. (File `t5-repair-boot2-decision.md`.)
- **--repair 1 lần có giám sát, bắt đầu 15:15:22Z (pid 5805),
  KHÔNG --launch-test:** GST symlink → debroot (269 file) ngay
  đầu; `apt-get update` ~14 phút (timeout 1500s, partial 0 → 110,
  lists 5 → 68); `apt-get install` 11 package NEED xong 15:29:55Z
  (dpkg 2 → 759 dòng, **109 installs** — y hệt #76?/#77? sau
  repair: 759/109); gói cuối libc-bin. **RE-CHECK: libs PASS đủ 5
  lib + GST PASS đủ isomp4/libav + apt PASS đủ 11 package;
  KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit** (t5-repair-boot2.log).
  Không kill process nào (không có process để kill — khác luật (C)).
- **Cờ POSTBOOT_PASS boot2:** watcher b80 poll 24 (15:30:19Z)
  postboot exit 0 LẦN ĐẦU sau repair (dpkg 759, installs 109, 0
  proc); poll 25 (15:31:20Z) postboot 0 lần 2 liên tiếp, frozen=yes,
  silent 85s, 0 proc → đủ điều kiện ổn định 2 poll; watcher tự kết
  thúc `done_pass_stable_2polls` poll 25. Final confirm 15:32:55Z
  exit 0. Lists boot2 sau repair: **68 file / 61 noble** (1 mirror
  Ubuntu + cli.github.com + nodesource — giống mẫu #78: 37/34,
  1 mirror; khác #77 sau repair: 75/68, 2 mirror). Postboot PASS
  đủ 11/11 nên chức năng đủ; theo dõi ở boot sau.
- Bracket replay boot2 (hậu kiểm từ dpkg.log + repair log):
  configure 15:02:19Z (boot +49s) → cài xong 15:29:55Z (boot
  +28m25s) NHỜ --repair (replay hệ thống tự thân KHÔNG cài gì
  thêm sau configure). Không phải bracket replay tự chạy như
  f868abad (8'58", 21'59"].

### 14.3 Sự cố `FLAG_EXISTS already` — cờ ghi tay (bài học vận hành)

- Watcher b80 v4 kết thúc đúng luật nhưng **KHÔNG ghi đè cờ**:
  logic watcher chỉ ghi khi file CHƯA tồn tại (`if [ ! -f
  POSTBOOT_PASS ]`, else in `FLAG_EXISTS already` và thoát 0).
  File lúc đó vẫn là cờ boot1 f868abad (PASS 14:50:18Z). T5 phát
  hiện khi kiểm cờ sau khi watcher kết thúc (15:32:45Z): nội dung
  cờ vẫn là boot1 trong khi boot hiện tại là boot2.
- **Khắc phục:** T5 ghi tay cờ boot2 lúc 15:33Z với đúng giá trị
  watcher đã xác nhận (boot_id ad1327ef…, btime 15:01:30Z,
  pass_at 15:31:20Z = poll 25 lúc đủ điều kiện ổn định 2 poll,
  poll=25) — bằng chứng ghi trong
  `t5-flag-boot2-manual-write.md` (RE-CHECK PASS + poll 24–25
  postboot 0 + final confirm 15:32:55Z exit 0). Sau khi ghi, chạy
  lại postboot 15:33:29Z exit 0 trên đúng boot2. Cờ boot1 giữ
  nguyên tại `POSTBOOT_PASS.boot1-f868abad`.
- **Bài học (cho watcher các đợt sau):** watcher làm lại pha 1
  trong CÙNG thư mục phải XÓA cờ cũ STALE trước khi chạy, hoặc
  logic ghi cờ phải ghi đè khi boot_id khác với cờ hiện có.
  Trường hợp T5b đợt 130 không gặp vì dùng thư mục riêng
  (round130-t5b/); b79 đợt này không gặp vì thư mục mới. Ghi vào
  đây để T5 đợt sau khỏi lặp lại — cờ STALE trên boot mới là lỗi
  gate nghiêm trọng (T8 sẽ chạy harness trên boot chưa kiểm chứng
  nếu đọc nhầm cờ cũ).
- Headroom boot2: 2851 (mở) → 2849 (cuối); RAM boot2: 1403 MB
  (mở) → 461 MB (cuối — thấp nhất từng ghi, xem §11 mục 7).
  Stale vite.lock: không có; queue cooldown 74 file lúc mở lại
  (không đổi trong lúc làm lại).

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 3 lần:
  tham chiếu boot trong header + dòng `say`; md5 `0b73b3bc…` →
  `a7958cc8…` → `066e10ca…` → `66ac9e3d…`; không đổi logic).
- `docs/PHASE9_ROUND131_T5_INFRA_LIMITS.md` (file này — mới).
- Harness trong hidden_files (KHÔNG stage): `round131-t5/` (log
  watcher b79 v4 (6 poll, boot1) + b80 v4 (25 poll, boot2), log
  postboot mở lượt/after-edit/final (boot1 + boot2), md5 trước/sau
  của postboot-check (cả 3 lần sửa), log headroom mở/cuối
  (2846/2844 boot1, 2851/2849 boot2), log RAM mở/cuối (529/1383 MB
  boot1, 1403/461 MB boot2), `POSTBOOT_PASS` (cờ hiện tại — cho
  boot2, PASS 15:31:20Z) + `POSTBOOT_PASS.boot1-f868abad` (bản sao
  cờ boot1), `t5-initial-state.md` + `t5-initial-state-boot2.md`,
  `t5-wait-replay-b79.sh` + `t5-wait-replay-b80.sh`,
  `t5-repair-boot2.log` + `t5-repair-boot2-decision.md` +
  `t5-flag-boot2-manual-write.md`, `t5-c2-drawlog-analysis.py` +
  `t5-c2-drawlog-analysis.txt` (pha 2), rerun histogram/labellag
  byte-identical).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round131-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary (kiểm lại sau khi
  LIMITS cập nhật xong pha 2 + boot2).
- Cờ done: `hidden_files/round131-t5.done` (tạo sau khi LIMITS +
  batch xong — cập nhật nội dung sau pha 2 + làm lại pha 1 boot2).

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
