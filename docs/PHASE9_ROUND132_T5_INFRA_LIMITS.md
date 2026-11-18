# PHASE9_ROUND132_T5_INFRA_LIMITS — Boot b379ecd7 replay ĐẦY ĐỦ 1551/222 + --repair 1 lần (thiếu đúng 1 gói gstreamer1.0-gl) PASS +72m37s; PHA 1 XONG (cờ 18:35:45Z); PHA 2 (c2) CHỜ T4 (cắt 19:45Z)

> Luồng T5, đợt 132, lượt cron 00:35 +07 18/11/2026 (bắt đầu 17:40:31Z trên
> boot b379ecd7; pha 1 xong 18:38:45Z; KHÔNG reboot trong lúc làm pha 1).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> T5 đợt 132 làm 2 pha theo quyết parent đợt 131 §12.3(a)/(b): pha 1 hạ
> tầng postboot cho boot mới + sửa watcher (xóa cờ STALE); pha 2 phân
> tích log draw (c2) SAU KHI T4 bật log draw PHỦ POST-FLIP ở lượt yên #10
> và có dữ liệu. **PHA 1 ĐÃ XONG — xem §1–§7. PHA 2 CHỜ cờ
> `round132-t4.done` — cắt 19:45Z (nếu T4 chưa xong thì đóng pha 1,
> parent spawn T5b sau).**
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (kể cả instrumentation
> (c2) — preview.tsx md5 805409f0 KHÔNG ĐỔI). KHÔNG tự chạy `--repair`
> khi chưa đủ điều kiện (xem §7.2 — repair lần này đủ 5/5 theo thực chất
> quyết parent, có kiểm chứng độc lập). CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #80? CHẾT trong khung (16:07Z, 17:24:08Z].** btime
   15:01:30Z, boot_id `ad1327ef-e045-4d44-ae14-13c76bab50ec`. Lần cuối
   còn sống ghi nhận: T10 đóng đợt 131 lúc 16:07Z (suite 27/27 + O8
   21/21 + 21/21 đều trên boot này). Tuổi thọ 1h05m30s–2h22m38s.
   Đây là reboot GIỮA ĐỢT ĐÓNG / LƯỢT MỞ lần thứ 5 liên tiếp (#75?
   giữa lượt đợt 129, #77? giữa lượt đợt 130, #78? giữa đóng 130 /
   mở 131, f868abad giữa lượt đợt 131, ad1327ef giữa đóng 131 /
   mở 132).
2. **Boot MỚI replay CHẠY ĐẦY ĐỦ — KHÔNG phải dạng (B).** btime
   17:24:08Z, boot_id `b379ecd7-311c-4053-a43f-507d21432ecc`, sau #80?
   2h22m38s. Configure 17:35:39Z (boot +11m31s); apt-get update
   ~17:35–~17:48Z (~13 phút, partial 28 → 57 → 0, lists 3 → 39);
   install theo sóng 17:49:28–18:19:43Z (~30 phút, dpkg 2 → 1551,
   222 installs, gói cuối gstreamer1.0-tools). **Baseline KHÁC các
   boot trước: 1.551 dòng / 222 installs** (không phải 1509/217 —
   hơn 5 installs, 42 dòng trigger). **Replay xong nhưng postboot
   vẫn FAIL vì thiếu đúng 1 gói `gstreamer1.0-gl`** (replay không bao
   giờ thử cài gói này — 0 dòng trong dpkg.log/history.log).
3. **§8.2(B): TRIGGER=NO ở cả 49 poll của watcher** (xem §7.2 — proxy
   C4 dạng (A) đòi GST<100, trong khi GST=268 file; đây là khoảng
   trống proxy, không phải điều kiện thực chất chưa đủ). **Kiểm
   chứng độc lập 5/5 lúc 18:32:10Z** (postboot FAIL tươi; 0 proc;
   dpkg im 747s; lock rảnh; boot 68,0' tuổi; dạng (A) theo thực
   chất — replay tới nhưng thiếu gói GST) → **--repair 1 lần có
   giám sát 18:32:59Z THÀNH CÔNG** (update OK, cài gstreamer1.0-gl
   1.24.2-1ubuntu0.7, RE-CHECK 4/4 PASS; KHÔNG --launch-test;
   không kill process nào). **Cờ `POSTBOOT_PASS` cho boot mới đã
   viết 18:35:45Z (poll 49, boot +1h11m37s) — do chính watcher v5
   ghi (ghi đè), KHÔNG cần ghi tay** — T4/T8 đợt 132 gate bằng cờ
   này. Final confirm 18:38:45Z exit 0. Lists sau repair: 75 file /
   68 noble (2 mirror).
4. **Watcher v5 (sửa bài học đợt 131 §14.3 FLAG_EXISTS already):**
   lúc khởi động archive cờ STALE (boot_id khác) sang
   `POSTBOOT_PASS.stale-<boot8>`; lúc ghi cờ thì GHI ĐÈ không điều
   kiện (bỏ nhánh FLAG_EXISTS already). Logic đã kiểm chứng khô
   trong /tmp (archive + ghi đè + cùng-boot đều đúng). Trên đĩa
   thật: thư mục round132-t5/ MỚI nên `NO_FLAG_AT_START` — nhánh
   archive chưa được kích hoạt live (ghi rõ, không tuyên bố đã
   chứng minh live); nhánh ghi đè đã chạy thật ở poll 49.
5. **(c2) instrumentation: KHÔNG ĐỔI.** preview.tsx md5 `805409f0…`
   (y hệt T5/T5b đợt 130 + T5 đợt 131); media.ts không đổi
   `2c384ed1`; vite.config.ts `ee80d093`. T5 pha 1 KHÔNG làm lại
   instrumentation. Phân tích log draw là PHA 2 — xem §8 (chờ T4).
6. **Headroom inotify: 2735 (mở) → 2735 (cuối)** — không đổi trong
   lượt; vẫn ~1,7 lần số watch vite thường cần (~1586); CHƯA tới
   ngưỡng báo user (< ~1.800, còn ~935), chỉ theo dõi.
7. **RAM khả dụng 500–3111 MB trong lượt** (thấp nhất 500 MB poll 35
   lúc replay xong; cao nhất 3111 MB poll 5 lúc install; cuối pha 1
   527 MB). Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
   Lưu ý cho T4: RAM cuối pha 1 chỉ ~500–600 MB — gate A cần
   RAMavail ≥1024 MB nên T4 có thể phải chờ cửa sổ RAM mở (tiền lệ
   đợt 130 chờ 34 phút).
8. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
   Queue cooldown 75 file / 1050 B (khớp đúng số T10 đếm lúc đóng
   đợt 131) — không đổi trong lượt pha 1; T5 KHÔNG đụng lock/queue.
9. **R9 (a) vẫn chờ user — nhắc lần 16** (số đếm không tăng so với
   đợt 130/131, theo quyết parent).
10. **PHA 2 (c2) KHÔNG LÀM ĐƯỢC TRONG PHIÊN NÀY — xem §14:** T4
    chưa bao giờ xong lượt yên #10 (kẹt gate A chờ RAM ~500 MB
    suốt 18:38–19:33Z, 0 attempt, 0 JSON); boot b379ecd7 CHẾT
    19:34:15Z (reboot giữa lượt lần thứ 6 liên tiếp) GIẾT session
    T4 + service restart giết timer chờ của T5. Cắt 19:45Z đã tới —
    đóng pha 1, parent spawn T5b sau (T5b làm lại postboot cho boot
    MỚI 07da9c50 + chờ T4 đo lại).

## 2. Boot #80? — chết trong khung (16:07Z, 17:24:08Z]

- Boot #80?: btime 15:01:30Z, boot_id
  `ad1327ef-e045-4d44-ae14-13c76bab50ec`. Lần cuối còn sống được ghi
  nhận: T10 đóng đợt 131 lúc 16:07Z (suite 27/27 exit 0 15:52–
  15:57Z + O8 21/21 + 21/21 15:57–15:59Z + dọn Xvfb 16:01Z, đều
  trên boot này — xem build-loop-log entry T10 đợt 131).
  Boot mới btime 17:24:08Z → #80? chết trong khung (16:07Z,
  17:24:08Z] (rộng 1h17m08s — rộng vì không có waiter poll nào chạy
  trong khoảng đóng đợt / mở lượt; khung này là khung hẹp nhất có
  thể kẹp từ dữ liệu trên đĩa). Tuổi thọ 1h05m30s–2h22m38s.
- Khung này KHÔNG có bản ghi thứ hai mâu thuẫn (không có luồng nào
  đo gì trên #80? lúc reboot; T6 đợt 132 chốt số boot + mù #37) —
  chỉ một khung, ghi nguyên trạng.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s,
  #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
  1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
  2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? 1h12m53s–1h24m00s
  (chết GIỮA ĐÓNG/MỞ), f868abad 33m25s–34m49s (chết GIỮA LUỘT),
  ad1327ef 1h05m30s–2h22m38s (chết GIỮA ĐÓNG/MỞ), boot mới chưa
  biết (sống ≥1h14m tới cuối pha 1).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5 mở, nhưng
  là của CHÍNH đợt 132 này (tạo 17:35Z bởi parent vòng lặp, "Đợt
  132 đang chạy, hạn cứng 20:35Z") — KHÔNG phải đợt main-chat. Luật
  chốt chặn (chỉ chặn khi đợt main-chat đang chạy) không áp dụng;
  lượt cron làm việc bình thường.
- **Cờ POSTBOOT_PASS của ad1327ef đã STALE** (boot_id ad1327ef…,
  PASS 15:31:20Z, tại round131-t5/) — T4/T8 đợt 132 gate bằng cờ
  MỚI của T5 (round132-t5/).

## 3. Boot mới — replay CHẠY ĐẦY ĐỦ, baseline KHÁC (1551/222), thiếu 1 gói

### 3.1 Boot mới — btime 17:24:08Z, gap 2h22m38s

- Boot mới: 2026-11-17 17:24:08Z (btime kernel; `uptime -s` đồng ý;
  /proc/1 chưa kiểm — không suy diễn thêm; boot_id
  `b379ecd7-311c-4053-a43f-507d21432ecc`, sau #80? 2h22m38s).
  Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 132.
- `journalctl --list-boots` / `last -x`: không đọc (mẫu các đợt trước:
  chỉ còn 1 boot hiện tại) — không suy diễn thêm.

### 3.2 Replay boot mới — chạy đầy đủ, kẹp được bracket (11'31", 55'35"]

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 17:24:08 | 0 | btime |
| Configure (2 dòng dpkg.log) | 17:35:39 | +11m31s | dpkg.log |
| apt-get update bắt đầu | ~17:35:40 | ~+11m32s | pid 814 (elapsed 07:20 lúc 17:43Z) |
| T5 mở lượt | 17:40:31 | +16m23s | exec |
| apt-get update xong (lists 3 → 39) | ~17:48 | ~+24m | watcher poll 2 (partial 57 → 0) |
| Install bắt đầu (dpkg 2 → 40) | 17:49:28 | +25m20s | watcher poll 3 (dpkg 40, 6 installs) |
| Install xong — replay (dpkg 1551, 222 installs) | 18:19:43 | +55m35s | dpkg.log (gói cuối gstreamer1.0-tools) |
| apt/dpkg/wrapper về 0 | 18:20:42 | +56m34s | watcher poll 34 |
| --repair 1 lần (thiếu gstreamer1.0-gl) | 18:32:59–~18:34:27 | +1h08m51s–+1h10m19s | t5-repair.log |
| Postboot PASS lần đầu (poll 48) | 18:34:45 | +1h10m37s | watcher poll 48 (dpkg 1560, 223 installs, GST 269) |
| Cờ POSTBOOT_PASS viết (poll 49) | 18:35:45 | +1h11m37s | watcher log |
| Final confirm PASS | 18:38:45 | +1h14m37s | t5-postboot-newboot-final.log |

- **Bracket replay đầy đủ: (11'31", 55'35"]** — hoạt động apt đầu
  tiên 17:35:39Z (configure, boot +11m31s), cài xong toàn bộ
  18:19:43Z (boot +55m35s), 0 entry dpkg/apt nào của replay sau đó
  (các dòng dpkg.log sau 18:19:43Z là của --repair T5, không phải
  replay — xem §3.3). Đây là bracket kẹp được bằng dpkg.log (cùng
  phương pháp S8 #48 / T8 #52 / T7 #54).
- **Update (~13 phút):** pid 814 chạy xuyên suốt từ ~17:35Z,
  0.0% CPU ở các lần đọc tức thời (bình thường với update chờ
  mạng); partial/ TĂNG DẦN 28 (17:41Z) → 34 (17:43Z) → 57 (poll 1,
  17:47:34Z) → 0 (poll 2, update xong) — đang tải thật, không kẹt.
  Lists 3 → 39 file khi update xong (34 noble, 1 mirror cogentco
  + cli.github.com + nodesource — xem §3.4).
- **Install (~30 phút, theo sóng + khoảng tải chậm):** dpkg 2 → 40
  (poll 3, 6 installs) → 53 → 133 → 195 → 473 (poll 9, 70
  installs, sóng lớn) → 491 → 577 (poll 14, 85) → **đứng 577**
  (poll 15–16, im 17:59:39–~18:05Z, apt-get pid 14335 sống,
  0,4–1,2% CPU — đang tải gói lớn, KHÔNG kẹt: xem §7.1 luật (C))
  → 1186 (poll 19, 172 installs, GST 31 → 268) → 1219 → **đứng
  1219** (poll 21, im ~4m, apt-get pid 17000 sống 0,7% CPU) →
  1335 (poll 24, 193) → **đứng 1335** (poll 25–26, im ~3m,
  apt-get pid 18274 sống 0,5% CPU) → 1464 → 1477 → 1503 → 1516
  (217 installs, 18:18:27Z) → **1551 (poll 34, 222 installs)**.
  apt-get đổi PID mỗi sóng (814 → 9739 → 10063 → … → 21080) —
  replay chạy nhiều lệnh apt-get install nối tiếp. Các khoảng đứng
  giữa sóng (3–6 phút, apt sống, CPU thấp) là tải gói qua mirror
  chậm — khác dạng (C) kẹt update của #64? (apt 0% CPU 64 phút +
  partial im 58 phút): ở đây mỗi khoảng đứng <6 phút rồi sóng tiếp
  theo tới ngay.
- **GST:** 0 file tới poll 7 → 31 file poll 8 → **268 file từ
  poll 19** (sóng lớn cài đủ plugin WebKit/GST — chỉ thiếu 1 file
  so với baseline 269, chính là file của gói gstreamer1.0-gl chưa
  cài). Sau --repair: **269 file** (đúng baseline).
- **Lists boot mới trước repair: 39 file / 34 noble** (1 mirror
  cogentco). Sau repair (apt-get update của --repair): **75 file /
  68 noble (2 mirror)** — giống mẫu f868abad (71/68, 2 mirror).
  Postboot PASS đủ 11/11 nên chức năng đủ; ghi nhận, không suy
  diễn (theo dõi ở boot sau: nếu mirror thứ 2 lại vắng thì mới
  là mẫu).
- 0 apt/dpkg/wrapper đang chạy từ poll 34 (18:20:42Z) trở đi
  (trừ --repair của T5 18:32:59–~18:34:27Z).

### 3.3 Baseline KHÁC — 1551 dòng / 222 installs (replay), 1560/223 (sau repair)

- Replay tự thân kết thúc ở **1551 dòng / 222 installs** — hơn
  baseline các boot replay chạy xong trước đây (1509/217) đúng
  5 installs / 42 dòng. 5 installs thêm + dòng trigger (vd
  libc-bin trigger cuối 18:18:18Z) giải thích chênh lệch dòng.
  Gói cuối vẫn là gstreamer1.0-tools (18:19:43Z) như mọi boot
  baseline — replay KHÔNG thiếu gói cuối, chỉ thiếu
  gstreamer1.0-gl (gói này không nằm trong đợt cài của replay:
  0 dòng trong dpkg.log + 0 dòng trong /var/log/apt/history.log).
- Sau --repair: **1560 dòng / 223 installs** (9 dòng + 1 install
  của gstreamer1.0-gl). **Phân biệt rõ:** 1551/222 là số của
  REPLAY; 1560/223 là số sau can thiệp T5. Không dùng 1560/223
  làm baseline replay cho boot sau.
- Bảng so sánh replay (bổ sung boot mới):

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
| f868abad (replay) | 1509 | 217 | +8m58s | **CHẠY ĐẦY ĐỦ, PASS +23m37s, KHÔNG repair** |
| ad1327ef (replay) | 2 | 0 | +49s | **dạng (B), repair PASS +29m50s** |
| **mới b379ecd7 (replay)** | **1551** | **222** | **+11m31s** | **CHẠY ĐẦY ĐỦ nhưng THIẾU 1 gói, repair PASS +1h11m37s** |

- Dạng (B) thuần dừng ở 2 boot liên tiếp (#76?, #77?) + ad1327ef;
  boot mới là boot thứ 3 liên tiếp replay chạy đầy đủ (f868abad,
  b379ecd7) nếu tính cả ad1327ef dạng (B) ở giữa. Baseline 1509/217
  KHÔNG còn giữ nguyên giá trị tuyệt đối — boot này chứng minh
  replay có thể cài 222 gói (ledger thay đổi theo thời gian).
  Ghi rõ để T5 đợt sau không coi 1551/222 là "sai baseline".

### 3.4 Postboot boot mới — FAIL 47 poll, PASS từ poll 48, cờ viết poll 49

- Postboot lúc mở lượt (poll0, ~17:43Z): FAIL exit 1 (0/11 gói
  apt, GST thiếu isomp4 + libav, debroot 269 file) — replay đang
  update, chưa cài gì.
- Sau sửa script (after-edit, ~17:45Z): vẫn FAIL exit 1 — logic
  không đổi.
- Watcher poll 1–47 (17:47:34–18:33:45Z): postboot exit 1 cả 47
  poll; dpkg 2 → 1551, installs 0 → 222, GST 0 → 268; apt-get
  luôn chạy tới poll 33 (c2a=no) → **TRIGGER=NO** (đúng — replay
  đang sống); poll 34–47: 0 proc nhưng C4=no (xem §7.2) →
  **TRIGGER=NO** (ghi rõ lý do ở §7.2).
- Watcher poll 48 (18:34:45Z): postboot exit 0 LẦN ĐẦU (dpkg 1560,
  installs 223, GST 269, lists 75, apt-get=0) — sau --repair;
  PASS streak bắt đầu.
- Poll 49 (18:35:45Z): dpkg=1560 frozen=yes, silent 78s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 18:35:45Z (boot +1h11m37s)**; watcher
  tự kết thúc `done_pass_stable_2polls`.
- Final confirm 18:38:45Z exit 0. Tổng trên boot mới: postboot PASS
  3/3 sau repair (poll 48–49 + final) + FAIL ở lần kiểm mở lượt +
  sau sửa script + poll 1–47 (đều exit 1, logic không đổi; poll 47
  lúc 18:33:45Z vẫn exit 1 vì repair đang chạy dở).
- Cờ `POSTBOOT_PASS` hiện tại là của boot mới (boot_id b379ecd7…).
  GST là thư mục hệ thống THẬT (269 file) — không có symlink →
  debroot (khác #76?/#77?/ad1327ef sau repair).
- Mốc 20:35Z trong task không bị trễ (cờ viết 18:35:45Z, trước hạn
  đóng đợt 2 giờ); pha 1 xong trong ~58 phút làm việc (chủ yếu chờ
  replay + repair).

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 14:43Z (boot f868abad, ~17' tuổi) | 2846 | mở lượt đợt 131 |
| T5, ~14:51Z (boot f868abad, ~25' tuổi) | 2844 | cuối pha 1 đợt 131 |
| T5, 15:0xZ (boot ad1327ef, mở lại) | 2851 | mở lại lượt đợt 131 |
| T5, ~15:32Z (boot ad1327ef) | 2849 | cuối lượt làm lại đợt 131 |
| **T5, 17:41Z (boot mới, ~17' tuổi)** | **2744** | **probe nhanh lúc kiểm đầu** |
| **T5, 17:44Z (boot mới, ~20' tuổi)** | **2735** | **mở lượt đợt 132 (headroom-open.txt)** |
| **T5, ~18:38Z (boot mới, ~1h14' tuổi)** | **2735** | **cuối pha 1 đợt 132 (headroom-end.txt)** |

- Headroom không đổi trong lượt (2735 → 2735) nhưng giảm ~114 so
  với cuối lượt T5 đợt 131 (2849 → 2735 qua reboot; probe nhanh
  17:41Z đọc 2744 — dao động ±9 theo watch của luồng khác, file
  mở/cuối đều ghi 2735). Chuỗi dài hạn: 4438 → 4318 → 3645 →
  3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 → 3089 → 3078 →
  3079 → 2971 → 2957 → 2952 → 2954 → 2846 → 2844 → 2851 → 2849 →
  **2735 → 2735**. Vẫn gấp ~1,7 lần số watch vite thường cần
  (~1586). **Vite thường chạy được trên boot này. Chưa tới ngưỡng
  báo user (< ~1.800) — chỉ theo dõi** (quyết parent §12(h) đợt
  127). Còn cao hơn ngưỡng ~935.
- Trần 63747 vẫn đầy ở mức ~61k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 17:41:47Z (kiểm đầu) | 991 MB | lúc exec đầu |
| 17:44Z (mở lượt) | 673 MB | ram-open.txt |
| 17:47:34Z (watcher poll 1) | 1196 MB | update đang chạy |
| 17:48:34Z (poll 2) | 1714 MB | update xong |
| 17:51:35Z (poll 5) | 3111 MB | **cao nhất lượt** (install sóng đầu) |
| 18:20:42Z (poll 34) | 561 MB | replay xong |
| 18:21:42Z (poll 35) | 500 MB | **thấp nhất lượt** |
| 18:35:45Z (poll 49, ghi cờ) | 592 MB | |
| ~18:38Z | 527 MB | cuối pha 1 (ram-end.txt) |

- RAM dao động 500–3111 MB trong lượt (hồi mạnh lúc install sóng
  đầu, tụt dần về ~500 MB khi replay xong + các luồng đợt 132 chạy
  nặng; T9 theo dõi RAM ghim). Mức thấp nhất 500 MB vẫn > 0 và
  cao hơn 461 MB cuối lượt làm lại T5 đợt 131 (thấp nhất từng ghi)
  39 MB.
- Swap đã dùng: 364 MB lúc kiểm đầu (ghi nhận, không phân tích).
- Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
- **Lưu ý cho T4:** RAM cuối pha 1 chỉ 500–600 MB — gate A cần
  RAMavail ≥1024 MB nên T4 có thể phải chờ cửa sổ RAM mở (tiền lệ
  đợt 130 chờ 34 phút). T5 không hạ ngưỡng, không can thiệp.

## 5. Watcher — b81 v5 (49 poll, ghi cờ, tự kết thúc)

- Chạy 17:47:34–18:35:45Z (49 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script v5 copy từ bản b80 đợt
  131 (v4) — chỉ đổi btime/mốc/log + ghi chú replay boot mới chạy
  đầy đủ + **SỬA LOGIC CỜ (v5, xem §5.1)**; `bash -n` OK trước
  khi chạy.
- Poll 1 (17:47:34Z): dpkg=2 installs=0, dòng mới 17:35:39Z
  (configure), silent 715s, apt-get=1 (pid 814, elapsed 11:54,
  0.0% CPU), postboot 1, lists=3, partial=57, GST=0, RAM 1196 MB.
  EVAL §8.2B TRIGGER=NO (c2a no — apt đang chạy).
- Poll 2 (17:48:34Z): dpkg=2 frozen=yes silent 775s, c2b/c3=yes —
  NHƯNG c2a=no (apt-get pid mới 9739, 56,6% CPU; partial 57 → 0,
  lists 3 → 39 — update xong, install bắt đầu) → **TRIGGER=NO**.
  Đúng quy trình: dpkg im nhưng replay còn sống thì không repair.
- Poll 3–13 (17:49:34–17:59:39Z): install theo sóng, dpkg 40 →
  577, installs 6 → 85, GST 0 → 31; apt-get luôn chạy (đổi PID mỗi
  sóng) → TRIGGER=NO mọi poll.
- Poll 14–16 (18:00:37–18:02:37Z): dpkg đứng 577, installs 85,
  silent tới 178s, apt-get pid 14335 sống (0,4–1,2% CPU) — đang
  tải gói lớn; TRIGGER=NO (c2a=no; luật (C) không đủ — xem §7.1).
- Poll 17–20 (18:03:38–18:06:38Z): sóng lớn, dpkg 577 → 1219,
  installs 85 → 177, GST 31 → 268.
- Poll 21–23 (18:07:38–18:09:39Z): dpkg đứng 1219, apt-get pid
  17000 sống (0,7% CPU) — tải gói; TRIGGER=NO.
- Poll 24–28 (18:10:39–18:14:40Z): dpkg 1335 → ~1412, installs
  193 → ~201; khoảng đứng 1335 ở poll 25–26 (apt-get pid 18274
  sống 0,5% CPU).
- Poll 29–33 (18:15:41–18:19:41Z): dpkg 1464 → 1551, installs 209
  → 222, gói cuối gstreamer1.0-tools 18:19:43Z.
- Poll 34 (18:20:42Z): dpkg=1551 installs=222, apt=0 apt-get=0
  dpkgproc=0 wrapper=0, postboot 1 (chỉ thiếu gstreamer1.0-gl) —
  replay xong; TRIGGER=NO (C4=no — xem §7.2).
- Poll 35–47 (18:21:42–18:33:45Z): dpkg đóng băng 1551, silent
  119 → 842s, 0 proc, postboot 1 — TRIGGER=NO mọi poll (C4=no);
  poll 47 (18:33:45Z) vẫn exit 1 (repair đang chạy dở).
- Poll 48 (18:34:45Z): dpkg=1560 installs=223, GST 269, lists 75,
  postboot 0 lần đầu sau repair — PASS streak bắt đầu.
- Poll 49 (18:35:45Z): dpkg=1560 frozen=yes, silent 78s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 18:35:45Z**.
- Cờ `POSTBOOT_PASS` (round132-t5/): `boot_id=b379ecd7-311c-4053-
  a43f-507d21432ecc btime=2026-11-17T17:24:08Z pass_at=
  2026-11-17T18:35:45Z poll=49` — đúng boot mới. T4/T8 đợt 132 gate
  bằng cờ này.
- KHÔNG reboot trong lúc watcher chạy (17:47–18:35Z); boot_id không
  đổi suốt pha 1.
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.
- `wrapper=1` ở poll 1 và `wrapper=2` ở poll 2–33 là FALSE POSITIVE
  đã biết (pgrep -f 'os-intent' bắt shell replay của chính hệ thống
  + shell của lệnh kiểm — như đợt 127/129/130/131; poll 34–49
  wrapper=0 sau khi replay xong). Không ảnh hưởng EVAL (c2a tính
  cả wrapper nên TRIGGER luôn NO trong lúc replay chạy — đúng ý đồ
  an toàn).

### 5.1 Sửa watcher v5 — xóa cờ STALE trước khi ghi cờ mới (bài học đợt 131 §14.3)

- **Thay đổi duy nhất so với v4:** (a) lúc khởi động, nếu
  `POSTBOOT_PASS` đã tồn tại với boot_id KHÁC boot hiện tại thì
  ARCHIVE nó sang `POSTBOOT_PASS.stale-<boot8>` (ghi log
  `STALE_FLAG_ARCHIVED`) rồi mới poll — gate không bao giờ đọc
  nhầm cờ cũ; nếu cùng boot_id thì giữ nguyên (log
  `FLAG_EXISTS_SAME_BOOT`); nếu chưa có cờ thì log
  `NO_FLAG_AT_START`. (b) Lúc ghi cờ thì GHI ĐÈ không điều kiện
  (bỏ nhánh `if [ ! -f ... ]` / `FLAG_EXISTS already` của v4).
- **Kiểm chứng khô trong /tmp trước khi chạy thật:** cờ stale
  ad1327ef → archive đúng thành `POSTBOOT_PASS.stale-ad1327ef`,
  đường dẫn gate sạch, ghi cờ mới đúng; nhánh cùng-boot nhận đúng.
- **Trên đĩa thật:** thư mục round132-t5/ MỚI nên watcher log
  `NO_FLAG_AT_START 17:47:34Z` — nhánh archive CHƯA được kích hoạt
  live trong lượt này (ghi rõ, không tuyên bố đã chứng minh live);
  nhánh ghi đè đã chạy thật ở poll 49 (`FLAG_WRITTEN ...
  (v5: overwrite, stale da archive neu co)`). Cờ STALE của
  ad1327ef vẫn nằm tại round131-t5/ (không thuộc thư mục này —
  T4/T8 đợt 132 không đọc nó).
- `bash -n` OK trước khi chạy. Không đổi logic EVAL §8.2/luật (C)/
  ngưỡng poll nào khác.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt ~17:44Z và cuối pha 1 ~18:38Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **75 file / 1050 B**
  (khớp đúng số T10 đếm lúc đóng đợt 131) — không đổi trong lượt.
  Đều là cooldown cũ, không chặn luồng khác, không tính là ticket.
  Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125) —
  việc prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt (reboot đã xóa sót đợt
  131; T4/T8 đợt 132 tự quản Xvfb của mình).

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

### 7.1 Đối chiếu §8.2 — boot mới (watcher b81 v5, poll 1–49; rút gọn)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 17:47:34Z | 715s | yes (exit 1) | no (apt chạy) | no | B (yes) | yes | **NO** |
| 2 | 17:48:34Z | 775s | yes | no (apt chạy) | yes (≥600s) | B (yes) | yes | **NO** |
| 3–13 | 17:49–17:59Z | 6–59s | yes | no (apt chạy) | no | - (no) | yes | **NO** |
| 14–16 | 18:00–18:02Z | 58–178s | yes | no (apt chạy) | no | - (no) | yes | **NO** |
| 17–33 | 18:03–18:19Z | 7–134s | yes | no (apt chạy) | no | - (no) | yes | **NO** |
| 34 | 18:20:42Z | 59s | yes | yes | no | - (no) | yes | **NO** |
| 35–43 | 18:21–18:29Z | 119–601s | yes | yes | c3 từ poll ~43 | - (no) | yes | **NO** |
| 44–45 | 18:30–18:31Z | 661–721s | yes | yes | yes (≥600s) | - (no) | yes | **NO** |
| 46–47 | 18:32–18:33Z | 782–842s | yes | yes | yes | - (no) | yes | **NO** |
| 48–49 | 18:34–18:35Z | 18–78s | no (exit 0) | yes | no | - (no) | yes | **NO** |

- **TRIGGER=NO ở cả 49 poll** — replay sống suốt poll 1–33 (apt
  chạy liên tục; dpkg im dài nhất 775s ở poll 2 NHƯNG apt-get vẫn
  chạy và partial tăng — c2a=no nên không đủ điều kiện); poll
  34–47 replay đã chết nhưng C4=no (xem §7.2) nên TRIGGER vẫn NO.
- **Luật (C) trên boot mới: KHÔNG KÍCH HOẠT** — các khoảng apt
  sống 0,4–1,2% CPU chỉ kéo dài 3–6 phút mỗi lần (poll 14–16:
  17:59:39–~18:05Z; poll 21: ~4 phút; poll 25–26: ~3 phút) rồi
  sóng install tiếp theo tới ngay; dpkg im dài nhất trong lúc apt
  sống là 178s < 900s; partial không đóng băng kiểu (C) (partial
  về 0 khi update xong là bình thường, không phải đóng băng tải).
  EVAL_C b_stuck_maybe=no mọi poll.
- Không có kiểm chứng độc lập pre-repair nào theo mẫu TRIGGER=YES
  — vì TRIGGER của watcher không bao giờ YES (xem §7.2); thay vào
  đó là kiểm chứng độc lập 5/5 theo thực chất quyết parent trước
  khi repair (file `t5-repair-decision.md`).

### 7.2 --repair 1 lần: TRIGGER watcher = NO nhưng đủ 5/5 theo thực chất — KHOẢNG TRỐNG PROXY C4

- **Kiểm chứng độc lập 5/5 lúc 18:32:10Z (TRƯỚC repair):**
  (1) postboot FAIL tươi (check-only riêng exit 1, chỉ thiếu
  gstreamer1.0-gl); (2a) 0 proc (apt=0 apt-get=0 dpkg=0 wrapper=0);
  (2b) dpkg im 747s ≥600s (dòng cuối 18:19:43Z); (2c) lock dpkg
  rảnh (fuser trống); (3) boot 68,0' tuổi ≥60' (nhánh boot-age;
  dpkg im 747s cũng ≥600s); (4) dạng (A) theo thực chất — replay
  tới (222 installs, gói cuối gstreamer1.0-tools đã cài) nhưng
  thiếu gói GST (gstreamer1.0-gl); candidate 1.24.2-1ubuntu0.7 có
  trong lists (cogentco); replay không bao giờ thử cài gói này
  (0 dòng dpkg.log/history.log); (5) không probe (MiniBrowser=0,
  0 webkit/chromium). (File `t5-repair-decision.md` +
  `t5-postboot-prerepair-check.log`.)
- **--repair 1 lần có giám sát, bắt đầu 18:32:59Z (pid 24881),
  KHÔNG --launch-test:** GST symlink KHÔNG chạy (isomp4+libav đã
  đủ, thư mục plugin thật — đúng nhánh R9 đợt 115); `apt-get
  update` OK (lists đã có — nhanh); `apt-get install` cài đúng
  **gstreamer1.0-gl 1.24.2-1ubuntu0.7** xong ~18:34:27Z (dpkg
  1551 → 1560 dòng, 222 → 223 installs; GST 268 → 269 file;
  lists 39 → 75). **RE-CHECK: wrapper PASS + libs PASS đủ 5 lib +
  GST PASS đủ isomp4/libav + apt PASS đủ 11 package; KẾT LUẬN:
  ĐỦ ĐIỀU KIỆN chạy WebKit** (t5-repair.log). Không kill process
  nào (không có process để kill — khác luật (C)).
- **KHOẢNG TRỐNG PROXY (ghi rõ để parent quyết):** watcher b81 v5
  tính C4 dạng (A) = installs>0 + 0 proc + **GST<100 file** +
  FAIL. Proxy này được viết cho hình dạng #72? (GST 0 file) và
  không bao được hình dạng mới: "replay chạy đầy đủ, GST gần đủ
  (268/269 file) nhưng thiếu đúng 1 gói plugin GST". Quyết parent
  gốc chỉ viết "(A) 'tới nhưng thiếu GST'" — không gắn ngưỡng
  file. T5 đánh giá điều kiện (4) ĐẠT THEO THỰC CHẤT quyết parent
  và chạy repair 1 lần (có kiểm chứng độc lập 5/5 + log đầy đủ),
  nhưng **KHÔNG tự sửa logic trigger của watcher giữa lượt** —
  đề xuất parent: widen C4 dạng (A) thành "replay kết thúc (0
  proc, dpkg đóng băng, gói cuối đã cài) + postboot FAIL" (bỏ
  ngưỡng GST<100) HOẶC "… + gói thiếu là gói GST/apt trong NEED".
  Nếu parent không duyệt, T5 đợt sau gặp lại hình dạng này sẽ
  lại kẹt TRIGGER=NO (watcher chạy hết 60 poll, không cờ, T4/T8
  chặn cả đợt).
- Tiền lệ gần nhất cho hình dạng "replay xong nhưng thiếu ít gói":
  boot #65? (thiếu libav + 2 gói apt) — khi đó KHÔNG có watcher
  nào hoạt động trên boot đó nên không có repair, T4 defer; đây
  KHÔNG phải tiền lệ chống repair, mà là trường hợp không có luồng
  hạ tầng. Đợt này T5 chủ động xử lý theo §8.2 thực chất.

## 8. PHA 2 — Phân tích log draw cho (c2) lượt yên #10 (quyết parent §12.3(b) đợt 131) — CHỜ T4

- **Trạng thái lúc viết LIMITS này (18:40Z): CHƯA LÀM — chờ cờ
  `round132-t4.done`.** Cắt 19:45Z: nếu T4 chưa xong thì đóng pha 1,
  parent spawn T5b sau (theo brief T5 đợt 132).
- **Thiết kế lượt #10 (theo prereg T4, đã đọc):** probe re-arm
  `window.__vcutC2DrawLog` sau các pass 4,7,9,11,13,15,17, tích lũy
  các epoch (dedupe theo khóa wallMs|point|frameIdx|loopNo|ct|
  clipId) vào partial + final JSON — phủ 14/15 pass hậu-flip (chỉ
  pass 8 là pass reset không ghi; pass 5 tiền-flip không cần).
  T4 kiểm coverage ngay sau attempt đầu bằng
  `analyze-t4-c2coverage.py`; nếu attempt1 đã phủ tốt (log max >>
  flip, đa số (c2) covered) thì verdict chốt ở attempt1.
- **Phương pháp pha 2 (đã chuẩn bị):** adapt script
  `t5-c2-drawlog-analysis.py` đợt 131 (194 dòng) sang JSON lượt
  #10 + labellag T4: (A) chứng minh cửa sổ log draw có phủ cửa sổ
  đo post-flip không (wallMs log vs flip vs tBlend post flip+2000)
  và phủ bao nhiêu seq (c2); (B) phân tích nội bộ log draw ở các
  seq (c2) được phủ: drawSrc có trễ sau ct không
  (frameIdx vs floor(ct×30) — quy tắc T3 §1.6 / P7), rawUnit có khớp
  drawSrc không, hành vi quanh wrap; (C) tương quan (c2) ↔ curPix
  run đóng băng + ghost sampler freeze (labelMs đóng băng-tại-tick
  theo P3 sửa đổi A1 của T3) + skew snap/label; (D) tái kiểm
  histogram/labellag/tickcost bằng code riêng, byte-identical hay
  không ghi rõ.
- **Verdict sẽ kết luận rõ:** desync chứng minh/bị bác hay vẫn
  chưa (theo P7 của T3: ủng hộ desync nếu ≥1 seq (c2) được phủ cho
  thấy drawSrc trễ ≥1f; làm yếu desync nếu 0 seq (c2) cho thấy trễ;
  không kiểm được nếu log không phủ seq (c2) nào); ghost-freeze
  mạnh lên hay yếu đi (P1/P3 của T3).
- Không chạy lượt đo E4 hay TTS nào cho pha 2 (theo quyết parent).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (boot mới, ~17:44Z): md5 `66ac9e3d…` → `123750ba…` (ghi
  trong `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #80? chết trong khung (16:07Z, 17:24:08Z],
  tuổi thọ 1h05m30s–2h22m38s; reboot giữa đợt đóng / lượt mở lần
  thứ 5 liên tiếp + đoạn boot mới (replay ĐANG CHẠY — configure
  17:35:39Z, apt-get update đang chạy pid 814, partial tăng
  28→34, KHÔNG phải dạng (B)) + đoạn watcher v5 xóa cờ STALE;
  dòng `say` cập nhật tương ứng. Dòng `say` mới không chứa ký tự
  `"` (dùng `m`/`s` thay dấu phút/giây) — không lặp sự cố đợt 120.
  `bash -n` OK.
- Kiểm chứng: sau khi sửa lần 1, postboot vẫn FAIL exit 1 (lần kiểm
  sau sửa ~17:45Z) — logic không đổi đã được xác nhận bằng chạy
  thật; sau --repair, cùng script này PASS exit 0 (poll 48–49 +
  final 18:38:45Z).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên. (--repair chạy 1 lần cho boot mới, xem §7.2.)

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #80?→mới giữa đóng đợt 131 / mở lượt 132 là ví dụ mới nhất
  (lần thứ 5 liên tiếp reboot rơi vào khoảng giữa đợt đóng / lượt mở
  / giữa lượt) cho thấy R9 (a) vẫn có giá trị: T4 đợt 132 phải chờ cờ
  POSTBOOT_PASS mới (T5 viết 18:35:45Z, ~61 phút sau khi lượt mở)
  mới gate được lượt yên #10. Vá §8.4(ii) + cờ gắn boot_id + watcher
  v5 xóa cờ stale đã giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 11. Nợ mở sang đợt sau

1. **Boot b379ecd7 đang sống + PASS (replay đầy đủ 1551/222 +
   --repair 1 lần thiếu gstreamer1.0-gl) — các luồng đo đợt 132 dùng
   cờ này** (`round132-t5/POSTBOOT_PASS`, boot_id b379ecd7…,
   PASS 18:35:45Z, xác nhận lại final 18:38:45Z). Cờ ad1327ef
   (PASS 15:31:20Z) đã STALE. Nếu boot mới cũng chết sớm như #69?
   (~19–20') hoặc #72? (54m08s) thì T5 đợt sau phải làm lại từ đầu.
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20,
   #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s, #73?
   1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
   1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
   2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? 1h12m53s–1h24m00s
   (chết GIỮA ĐÓNG/MỞ), f868abad 33m25s–34m49s (chết GIỮA LUỘT),
   ad1327ef 1h05m30s–2h22m38s (chết GIỮA ĐÓNG/MỞ), boot mới chưa
   biết (sống ≥1h14m tới cuối pha 1).
2. **Số thứ tự boot #80?/mới TẠM — chờ T6 chốt mù #37 đợt 132**
   (quyết parent đợt 130 §12.3(h)). Nếu T6 đếm khác, LIMITS này +
   script postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **Khung #80? chết (16:07Z, 17:24:08Z] rộng 1h17m08s** (lần cuối
   còn sống: T10 đóng đợt 131 16:07Z; không có waiter trong khoảng
   đóng/mở nên không kẹp hẹp hơn được từ trong VM); ghi nguyên
   trạng, không suy diễn thêm.
4. **PHA 2 (c2) CHỜ T4** — xem §8: cắt 19:45Z; nếu T4 chưa xong thì
   parent spawn T5b. T5b đọc LIMITS này + prereg T3 (P1/P3/P7, bổ
   sung A1 sửa P3 chỉ tính đóng băng-tại-tick) + prereg T4 (thiết
   kế re-arm log draw) + script phân tích đợt 131.
5. **KHOẢNG TRỐNG PROXY C4 dạng (A) (mới, §7.2):** watcher tính
   (A) = GST<100 file — không bao hình dạng "replay đầy đủ nhưng
   thiếu 1 gói plugin GST". Đề xuất parent widen C4 (bỏ ngưỡng
   GST<100 hoặc thêm nhánh "gói thiếu là gói GST/apt trong NEED").
   T5 đợt này đã xử lý theo thực chất quyết parent (kiểm chứng độc
   lập 5/5 + repair 1 lần); nếu parent không duyệt widen, hình dạng
   này sẽ lặp lại kẹt TRIGGER=NO ở đợt sau.
6. **Baseline replay KHÔNG còn 1509/217 tuyệt đối** (§3.3): boot
   này replay tự thân 1551/222 (hơn 5 gói). T5 đợt sau không coi
   1551/222 là "sai baseline"; phân biệt số replay (1551/222) với
   số sau repair (1560/223).
7. **Lists boot mới sau repair 75 file / 68 noble (2 mirror)** —
   giống mẫu f868abad, khác #75? (39/34, 1 mirror) và ad1327ef sau
   repair (68/61, 1 mirror). Postboot PASS đủ 11/11 nên chức năng
   đủ; theo dõi ở boot sau.
8. **Headroom tiếp tục giảm dài hạn:** …2971 → 2957 → 2952 → 2954 →
   2846 → 2844 → 2851 → 2849 → **2735 → 2735** (boot mới).
   Trần 63747 cần can thiệp host — ngoài tầm luồng này. Ngưỡng báo
   user < ~1.800 chưa tới (còn ~935).
9. **RAM thấp nhất lượt 500 MB** (poll 35, 18:21:42Z); cuối pha 1
   527 MB; cao nhất 3111 MB (poll 5). T9 theo dõi RAM ghim
   (nhiệm vụ T9). Balloon virtio ~6,29 GB đứng yên (T9 đợt 131).
10. **R9 (a) vẫn chờ user (nhắc lần 16).**
11. **Cooldown file tích lũy (75 file / 1050 B, không đổi)** — luật
    prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
    của T6.
12. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 131 §11 + quyết
    parent §12.3: mù #51 MỚI MỞ (probe #51 đợt 132 — việc T2);
    G1 chờ user quyết; birefnet (chỉ thử lại khi quan sát được
    available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml
    vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
    KHÔNG push khi user chưa nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI trong pha 1 (md5 `805409f0`, y hệt
  T5/T5b đợt 130 + T5 đợt 131 sau instrumentation (c2));
  `media.ts`: KHÔNG đổi (`2c384ed1`); `vite.config.ts`: KHÔNG đổi
  (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (tham chiếu boot trong header + dòng `say`; md5 `66ac9e3d…` →
  `123750ba…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK; watcher b81 v5 OK.
- `tsc` / `vite build`: KHÔNG chạy trong pha 1 (không sửa production;
  tsc đã exit 0 trên boot mới theo entry T4 đợt 132 — kiểm sau).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  500–3111 MB < 6 GB).
- O8: KHÔNG thuộc T5 (T8 gate bằng cờ này — cờ boot mới đã đúng).
- Postboot boot mới: FAIL ở lần kiểm mở lượt + sau sửa script +
  poll 1–47; PASS 3/3 sau repair (poll 48–49 + final confirm).
  Watcher b81 v5: 49 poll, tự kết thúc `done_pass_stable_2polls`,
  exit 0. **Reboot GIỮA LUỘT T5 pha 1: KHÔNG** (boot_id không đổi
  suốt 17:40–18:38Z).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=NO cả 49
  poll** (replay sống poll 1–33; poll 34–47 replay chết nhưng C4=no
  do proxy GST<100 — xem §7.2). **--repair 1 lần theo thực chất
  §8.2 (kiểm chứng độc lập 5/5, 18:32:10Z)** — update OK + cài
  gstreamer1.0-gl + RE-CHECK 4/4 PASS (t5-repair.log). **Luật (C):
  ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT** (các khoảng apt sống CPU
  thấp chỉ 3–6 phút, dpkg im dài nhất lúc apt sống 178s < 900s).
- Headroom: 2735 (mở) → 2735 (cuối pha 1).
- RAM thấp nhất lượt: 500 MB (poll 35); cao nhất 3111 MB (poll 5).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  75 file / 1050 B, không đổi).
- Event lag (c2): pha 2 CHỜ T4 — xem §8 (cắt 19:45Z).
- **Watcher v5 sửa logic cờ (xóa cờ STALE + ghi đè): xem §5.1**
  (kiểm chứng khô /tmp OK; nhánh archive chưa kích hoạt live;
  nhánh ghi đè chạy thật poll 49).

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu boot trong header + dòng `say`; md5 `66ac9e3d…` →
  `123750ba…`; không đổi logic).
- `docs/PHASE9_ROUND132_T5_INFRA_LIMITS.md` (file này — mới;
  pha 1 xong, pha 2 chờ T4 — sẽ cập nhật sau pha 2 hoặc T5b).
- Harness trong hidden_files (KHÔNG stage): `round132-t5/` (log
  watcher b81 v5 (49 poll), log postboot mở lượt/after-edit/final
  (boot mới), md5 trước/sau của postboot-check, log headroom mở/
  cuối (2735/2735), log RAM mở/cuối (673/527 MB),
  `POSTBOOT_PASS` (cờ hiện tại — cho boot mới, PASS 18:35:45Z),
  `t5-initial-state.md`, `t5-wait-replay-b81.sh` (v5) +
  `t5-wait-replay-b81.log` + `.nohup.log`,
  `t5-repair-decision.md` + `t5-repair.log` +
  `t5-postboot-prerepair-check.log`, `t5-postboot-b81-poll*.log`
  (49 file)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round132-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary (cập nhật lại sau
  khi LIMITS cập nhật xong pha 2).
- Cờ done: `hidden_files/round132-t5.done` (tạo sau pha 1 — nội dung
  ghi rõ CHỈ XONG PHA 1, pha 2 chờ T4, cắt 19:45Z; cập nhật lại sau
  pha 2).

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

## 14. REBOOT GIỮA LUỘT 19:34:15Z — BOOT b379ecd7 CHẾT, PHA 2 KHÔNG LÀM ĐƯỢC (bổ sung 19:36–19:44Z)

### 14.1 Boot b379ecd7 — chết trong khung (19:33:56Z, 19:34:15Z]

- Boot b379ecd7: btime 17:24:08Z, boot_id
  `b379ecd7-311c-4053-a43f-507d21432ecc`. Lần cuối còn sống ghi nhận:
  T4 gateA poll 5 lúc 19:33:56Z (load1 0.29, load5 0.23, RAMavail
  494 MB, tree md5 805409f0 — xem poll-t4.log). Boot mới btime
  19:34:15Z → b379ecd7 chết trong khung (19:33:56Z, 19:34:15Z]
  (rộng 19s — khung hẹp NHẤT từng kẹp, hẹp hơn khung 23s của #79?
  đợt 131). Tuổi thọ 2h09m48s–2h10m07s.
- Reboot GIỮA LUỘT lần thứ 6 liên tiếp quanh ranh giới đợt (#75?
  giữa lượt đợt 129, #77? giữa lượt đợt 130, #78? giữa đóng 130 /
  mở 131, f868abad giữa lượt đợt 131, ad1327ef giữa đóng 131 /
  mở 132, b379ecd7 giữa lượt đợt 132 — lần này giết T4 lúc đang
  chờ gate A, chưa đo được pass nào).
- Session T5 bị giết cùng lúc: service restart giết timer chờ
  (sleep 540 của T5 bị SIGTERM lúc ~19:34Z, 497s sau khi chạy);
  T5 kiểm đĩa trước rồi tiếp tục theo brief (không kết luận luồng
  nào chết khi chưa kiểm đĩa — T4 poll log dừng 19:33:56Z, 0 JSON
  attempt, 0 cờ round132-t4.done).
- **Chốt chặn:** `round-in-progress.md` vẫn là của CHÍNH đợt 132 —
  việc T5b làm lại pha 1 cho boot mới được phép như thường.
- **Cờ POSTBOOT_PASS của b379ecd7 đã STALE** (boot_id b379ecd7…,
  PASS 18:35:45Z, tại round132-t5/) — T4/T8 đợt 132 KHÔNG được
  gate bằng cờ này trên boot mới. T5b phải viết cờ MỚI cho boot
  07da9c50 (watcher v5 đã có sẵn logic xóa cờ stale — xem §5.1).

### 14.2 T4 chưa bao giờ xong lượt yên #10 — pha 2 không có dữ liệu

- T4 gate 0 ĐẠT poll #23 (18:35:08Z, qua nhánh VANG-T7-DONE +
  check-only riêng PASS — cờ T5 viết 18:35:45Z, sau poll #23 37s).
- T4 kẹt gate A từ ~18:38Z tới 19:33:56Z (gần 56 phút): mọi điều
  kiện khác đều mở (load1 0,05–0,49, load5 0,10–0,25, lock không,
  blockers 0, tree md5 khớp) NHƯNG RAMavail chỉ 432–552 MB suốt
  thời gian — không bao giờ đạt ngưỡng ≥1024 MB. Chuỗi chờ ghi
  trong chain-t4.log: "HET 10 PHUT GATE A KHONG MO" ×4 cửa sổ
  10 phút (18:58Z, ~19:08Z, ~19:19Z, ~19:26Z — poll counter
  restart mỗi cửa sổ). Ngân sách gate A 60 phút từ poll đầu
  (~18:38Z) hết hạn ~19:38Z — T4 cũng sắp tự dừng khi reboot tới.
- **0 attempt, 0 JSON lượt yên, 0 (c2), 0 log draw lượt #10.**
  Thư mục round132-t4/ chỉ có b.json + script + log gate — không
  có file JSON attempt nào. T3 đã đăng ký prereg + bổ sung A1
  (P1/P3/P7) nhưng BƯỚC 2 chưa có dữ liệu để kiểm.
- **PHA 2 (c2) KHÔNG LÀM ĐƯỢC trong phiên T5 này — không phải do
  thiếu cố gắng mà do không tồn tại dữ liệu lượt #10.** Cắt
  19:45Z theo brief: T5 đóng pha 1 tại đây. Parent spawn T5b sau
  (khi T4 đo lại lượt #10 trên boot mới + có cờ round132-t4.done
  mới). Script phân tích pha 2 đã chuẩn bị sẵn tại
  `round132-t5/t5-c2-drawlog-analysis.py` (py_compile OK — T5b
  dùng lại, chỉ cần truyền JSON + labellag T4 mới).

### 14.3 Boot MỚI 07da9c50 — replay ĐANG CHẠY NHANH (ghi nhận cho T5b)

- Boot mới: btime 2026-11-17 19:34:15Z (btime kernel; `uptime -s`
  đồng ý; /proc/1 19:34:26Z, chênh +11s; boot_id
  `07da9c50-5836-4481-a4a4-7e22c6260325`, sau b379ecd7 2h10m07s).
  Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 132.
- Replay boot mới ĐANG CHẠY NHANH lúc T5 kiểm 19:35:42Z (boot
  +1m27s): dpkg.log đã 462 dòng (dòng cuối libc-bin 19:35:41Z),
  apt-get + wrapper đang chạy, RAMavail 1972 MB (balloon reset sau
  reboot). Tốc độ này ngang lớp boot nhanh nhất (#73? +38s,
  #67? +40s) — có thể là install từ cache. T5b kẹp bracket từ
  dpkg.log + watcher b82 (copy b81 v5, đổi btime/mốc).
- T5 KHÔNG khởi động watcher cho boot mới trong phiên này (vượt
  cắt 19:45Z + vượt phạm vi brief — brief giao boot b379ecd7;
  parent quyết spawn T5b hay đóng đợt).
- Cờ .done các luồng lúc 19:35Z: t1, t2, t5, t6, t7, t9 ĐÃ CÓ;
  thiếu t3, t4, t8, t10. T10 chưa đóng đợt 132.
