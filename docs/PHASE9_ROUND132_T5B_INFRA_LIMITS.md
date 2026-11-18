# PHASE9_ROUND132_T5B_INFRA_LIMITS — Boot 07da9c50 replay XONG NHANH 1545/221 + gstreamer1.0-gl CÓ SẴN, KHÔNG repair; PHA 1 XONG (cờ 19:43:36Z t5b + 19:46:27Z gate-visible); PHA 2 (c2) CHƯA CÓ DỮ LIỆU — T4 kẹt gate A, chuyển đợt 133

> Luồng T5b, đợt 132, lượt cron 00:35 +07 18/11/2026 (bắt đầu 19:39:53Z
> trên boot 07da9c50; pha 1 xong 19:46:27Z; KHÔNG reboot trong lúc làm
> pha 1). Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git`
> local — KHÔNG push). T5b làm tiếp T5 đợt 132 sau reboot GIỮA LUỘT
> lần thứ 6 liên tiếp (19:34:15Z): pha 1 postboot cho boot mới
> 07da9c50; pha 2 phân tích log draw (c2) lượt yên #10 SAU KHI T4 đo
> xong. **PHA 1 ĐÃ XONG — xem §1–§7. PHA 2 KHÔNG LÀM ĐƯỢC — T4 chưa
> bao giờ đo được pass nào (kẹt gate A chờ RAM ≥1024 MB; RAM chỉ
> 432–544 MB suốt 19:48–20:08Z); không tồn tại dữ liệu lượt #10 —
> xem §8. Pha 2 chuyển đợt 133.**
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (kể cả
> instrumentation (c2) — preview.tsx md5 805409f0 KHÔNG ĐỔI). KHÔNG
> chạy --repair (không cần — replay đã đủ). CẤM kiểm lại TTS 39;
> birefnet không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot b379ecd7 CHẾT trong khung (19:33:56Z, 19:34:15Z]** (rộng
   19s — khung hẹp NHẤT từng kẹp, hẹp hơn khung 23s của #79? đợt
   131). btime 17:24:08Z, boot_id `b379ecd7-311c-4053-a43f-
   507d21432ecc`. Lần cuối còn sống ghi nhận: T4 gateA poll 5 lúc
   19:33:56Z (load1 0.29, load5 0.23, RAMavail 494 MB, tree md5
   805409f0). Tuổi thọ 2h09m48s–2h10m07s. Reboot GIỮA LUỘT lần thứ
   6 liên tiếp quanh ranh giới đợt (#75? giữa lượt đợt 129, #77?
   giữa lượt đợt 130, #78? giữa đóng 130 / mở 131, f868abad giữa
   lượt đợt 131, ad1327ef giữa đóng 131 / mở 132, b379ecd7 giữa
   lượt đợt 132 — lần này giết T4 lúc đang chờ gate A, 0 attempt).
2. **Boot MỚI 07da9c50 replay CHẠY XONG NHANH — KHÔNG phải dạng
   (A)/(B).** btime 19:34:15Z, boot_id `07da9c50-5836-4481-a4a4-
   7e22c6260325`, sau b379ecd7 2h10m07s. Configure 19:34:46Z (boot
   +31s); cài xong 19:36:48Z (boot +2m33s, gói cuối
   gstreamer1.0-tools). **Baseline replay: 1.545 dòng / 221
   installs** — khác cả 1509/217 (các boot trước) lẫn 1551/222
   (b379ecd7). **gstreamer1.0-gl ĐÃ CÀI BỞI REPLAY** (19:35:28Z,
   1.24.2-1ubuntu0.7) — KHÁC boot b379ecd7 (thiếu gói này, T5 phải
   --repair 1 lần). GST 269 file (đủ baseline), lists 37, partial
   0. 0 apt/dpkg/wrapper lúc T5b mở (19:39:53Z).
3. **Postboot PASS ngay từ lần kiểm đầu (poll0, 19:40Z, exit 0) —
   KHÔNG cần --repair.** Watcher b82 (v5) 2 poll, tự kết thúc
   `done_pass_stable_2polls`, cờ t5b viết 19:43:36Z (boot +9m21s,
   poll 2). Final confirm 19:44Z exit 0.
4. **Cờ gate-visible cho T4 (phát hiện + sửa trong phiên):**
   gate0-wait của T4 chỉ đọc `round132-t5/POSTBOOT_PASS` (cờ cũ
   b379ecd7, STALE), KHÔNG đọc `round132-t5b/` — trong khi T8 đã
   đọc cả hai thư mục. T5b chạy thêm watcher b83 trong
   `round132-t5/`: nhánh archive v5 kích hoạt LIVE lần đầu
   (`STALE_FLAG_ARCHIVED` 19:45:27Z, cờ b379ecd7 →
   `POSTBOOT_PASS.stale-b379ecd7`), cờ mới viết 19:46:27Z (boot
   +12m12s, poll 2). **T4 gate 0 ĐẠT poll #6 19:48:04Z nhờ cờ
   này** (t5flag=PASS). Bài học cho parent: brief T5b giao "copy
   watcher sang thư mục làm việc của bạn" nhưng cờ phải nằm ở
   nơi gate đọc — lần sau ghi rõ thư mục cờ gate-visible.
5. **(c2) instrumentation: KHÔNG ĐỔI.** preview.tsx md5 `805409f0`
   (y hệt T5/T5b đợt 130 + T5 đợt 131); media.ts `2c384ed1`;
   apps/web/vite.config.ts `ee80d093`.
6. **Headroom inotify: 2737 (mở) → 2737 (cuối)** — không đổi trong
   lượt; vẫn ~1,7 lần số watch vite thường cần (~1586); CHƯA tới
   ngưỡng báo user (< ~1.800, còn ~937), chỉ theo dõi.
7. **RAM khả dụng 468–1340 MB trong lượt** (cao nhất 1340 MB lúc
   T4 gate0 poll #1 19:38:03Z — trước khi T5b mở; thấp nhất 468 MB
   gateA poll 1 19:59:19Z; cuối pha 1 ~505–649 MB). Dù lấy số nào
   cũng < 6 GB guard — birefnet không thử. **RAM thấp là lý do T4
   kẹt gate A (cần ≥1024 MB) — xem §8.**
8. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
   Queue cooldown 75 file / 1050 B (khớp đúng số T10 đếm lúc đóng
   đợt 131) — không đổi trong lượt; T5b KHÔNG đụng lock/queue.
9. **R9 (a) vẫn chờ user — nhắc lần 16** (số đếm không tăng so với
   đợt 130/131, theo quyết parent).
10. **PHA 2 (c2) KHÔNG LÀM ĐƯỢC — xem §8:** T4 kẹt gate A từ
    19:48Z tới 20:08Z+ (2 cửa sổ 10 phút đã hết, RAM 468–544 MB
    không bao giờ đạt ≥1024 MB); 0 attempt, 0 JSON, 0 (c2), 0 log
    draw lượt #10. Cắt 20:30Z đã tới — đóng pha 1, pha 2 chuyển
    đợt 133 (T5 đợt 133 làm lại khi T4 đo được lượt yên #10 trên
    boot còn sống).

## 2. Boot b379ecd7 — chết trong khung (19:33:56Z, 19:34:15Z]

- Boot b379ecd7: btime 17:24:08Z, boot_id
  `b379ecd7-311c-4053-a43f-507d21432ecc`. Lần cuối còn sống được ghi
  nhận: T4 gateA poll 5 lúc 19:33:56Z (load1 0.29, load5 0.23,
  RAMavail 494 MB, tree md5 805409f0 — xem poll-t4.log của T4).
  Boot mới btime 19:34:15Z → b379ecd7 chết trong khung (19:33:56Z,
  19:34:15Z] (rộng 19s — khung hẹp NHẤT từng kẹp, hẹp hơn khung
  23s của #79? đợt 131). Tuổi thọ 2h09m48s–2h10m07s.
- Khung này KHÔNG có bản ghi thứ hai mâu thuẫn (không có luồng nào
  đo gì trên b379ecd7 lúc reboot; T6 đợt 132 chốt số boot + mù
  #37) — chỉ một khung, ghi nguyên trạng.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s,
  #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
  1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77?
  2h05m45s–2h06m10s (chết GIỮA LUỘT), #78? 1h12m53s–1h24m00s
  (chết GIỮA ĐÓNG/MỞ), f868abad 33m25s–34m49s (chết GIỮA LUỘT),
  ad1327ef 1h05m30s–2h22m38s (chết GIỮA ĐÓNG/MỞ), **b379ecd7
  2h09m48s–2h10m07s (chết GIỮA LUỘT)**, boot mới chưa biết (sống
  ≥34m tới 20:08Z).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5b mở, nhưng
  là của CHÍNH đợt 132 này (tạo 17:35Z bởi parent vòng lặp, "Đợt
  132 đang chạy, hạn cứng 20:35Z") — KHÔNG phải đợt main-chat. Luật
  chốt chặn (chỉ chặn khi đợt main-chat đang chạy) không áp dụng;
  lượt cron làm việc bình thường.
- **Cờ POSTBOOT_PASS của b379ecd7 đã STALE** (boot_id b379ecd7…,
  PASS 18:35:45Z, tại round132-t5/) — đã được watcher b83 archive
  sang `POSTBOOT_PASS.stale-b379ecd7` lúc 19:45:27Z (xem §5.1);
  T4/T8 đợt 132 gate bằng cờ MỚI của T5b (round132-t5/, PASS
  19:46:27Z; bản sao ghi chép tại round132-t5b/, PASS 19:43:36Z).

## 3. Boot mới — replay CHẠY XONG NHANH, baseline KHÁC (1545/221), gstreamer1.0-gl CÓ SẴN

### 3.1 Boot mới — btime 19:34:15Z, gap 2h10m07s

- Boot mới: 2026-11-17 19:34:15Z (btime kernel; `uptime -s` đồng ý;
  boot_id `07da9c50-5836-4481-a4a4-7e22c6260325`, sau b379ecd7
  2h10m07s). Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 132.
- `journalctl --list-boots` / `last -x`: không đọc (mẫu các đợt trước:
  chỉ còn 1 boot hiện tại) — không suy diễn thêm.

### 3.2 Replay boot mới — chạy xong nhanh, kẹp được bracket (31s, 2m33s]

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 19:34:15 | 0 | btime |
| Configure (dòng dpkg.log đầu) | 19:34:46 | +31s | dpkg.log |
| Install theo sóng (history.log) | 19:35:18–19:36:48 | +1m03s–+2m33s | /var/log/apt/history.log |
| gstreamer1.0-gl cài bởi replay | 19:35:28 | +1m13s | dpkg.log (7 dòng) |
| Install xong — replay (dpkg 1545, 221 installs) | 19:36:48 | +2m33s | dpkg.log (gói cuối gstreamer1.0-tools) |
| T5b mở lượt | 19:39:53 | +5m38s | exec |
| Postboot poll0 PASS (exit 0) | ~19:40 | ~+6m | t5b-postboot-newboot-poll0.log |
| Cờ t5b viết (watcher b82 poll 2) | 19:43:36 | +9m21s | watcher log b82 |
| Cờ gate-visible viết (watcher b83 poll 2) | 19:46:27 | +12m12s | watcher log b83 |
| T4 gate 0 ĐẠT poll #6 (nhờ cờ mới) | 19:48:04 | +13m49s | gate0-wait-t4-07da9c50.log |
| Final confirm PASS | ~19:44 | ~+10m | t5b-postboot-newboot-final.log |

- **Bracket replay: (31s, 2m33s]** — hoạt động apt đầu tiên
  19:34:46Z (configure, boot +31s), cài xong toàn bộ 19:36:48Z
  (boot +2m33s), 0 entry dpkg/apt nào của replay sau đó. Đây là
  bracket kẹp được bằng dpkg.log (cùng phương pháp S8 #48 / T8 #52
  / T7 #54 / T5 đợt 132). Nhanh ngang lớp boot nhanh nhất (#73?
  +38s, #67? +40s, #48 2'44") — install từ cache.
- **Install (~1m30s, theo sóng dày):** history.log ghi các lệnh
  apt-get install nối tiếp 19:35:18 → 19:36:48 (50 entry
  `Install:` trong history.log — đếm theo lệnh, không phải theo
  gói). dpkg.log 1545 dòng / 221 installs lúc T5b mở (19:39:53Z)
  và KHÔNG tăng thêm sau đó (watcher b82/b83: dpkg=1545 frozen
  mọi poll sau poll 1).
- **GST:** 269 file ngay lúc mở (đủ baseline) — thư mục hệ thống
  THẬT (không symlink). **gstreamer1.0-gl 1.24.2-1ubuntu0.7 đã
  cài bởi replay** (dpkg -l: `ii`, 7 dòng trong dpkg.log, cài
  19:35:28Z) — KHÁC boot b379ecd7 (replay không bao giờ thử cài
  gói này, 0 dòng; T5 phải --repair). Đây là bằng chứng trực tiếp
  rằng khoảng trống proxy C4 dạng (A) của T5 (§7.2 LIMITS T5) là
  hình dạng của boot TRƯỚC, không phải của boot này — boot này
  không kích hoạt khoảng trống đó vì không thiếu gói nào.
- **Lists: 37 file** (lúc mở; watcher b82/b83: lists=37 mọi poll)
  — ít hơn boot b379ecd7 sau repair (75 file / 68 noble, 2
  mirror) và khác f868abad (71/68). Postboot PASS đủ 11/11 nên
  chức năng đủ; ghi nhận, không suy diễn (theo dõi ở boot sau).
- 0 apt/dpkg/wrapper đang chạy từ lúc mở trở đi (trừ shell kiểm
  của chính T5b — pgrep -f 'os-intent' bắt cả lệnh exec của T5b,
  false positive đã biết; watcher dùng mẫu `os[-]intent` nên
  wrapper=0 đúng).

### 3.3 Baseline KHÁC — 1545 dòng / 221 installs (replay, không repair)

- Replay tự thân kết thúc ở **1545 dòng / 221 installs** — KHÔNG
  cần can thiệp nào thêm (không repair, không install tay). Số
  này khác cả 1509/217 (baseline cũ nhiều boot) lẫn 1551/222
  (b379ecd7, replay) lẫn 1560/223 (b379ecd7 sau repair).
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
| b379ecd7 (replay) | 1551 | 222 | +11m31s | **CHẠY ĐẦY ĐỦ nhưng THIẾU 1 gói, repair PASS +1h11m37s** |
| **mới 07da9c50 (replay)** | **1545** | **221** | **+31s** | **CHẠY XONG NHANH, PASS +9m21s, KHÔNG repair** |

- Baseline replay KHÔNG còn giá trị tuyệt đối cố định (1509/217
  → 1551/222 → 1545/221 trong 3 boot liên tiếp). Ghi rõ để T5 đợt
  sau không coi 1545/221 là "sai baseline": **chỉ postboot
  exit 0 + GST đủ + apt đủ 11 package mới là tiêu chí PASS**,
  không phải số dòng/installs.

### 3.4 Postboot boot mới — PASS từ lần kiểm đầu, cờ viết poll 2 (cả hai watcher)

- Postboot lúc mở lượt (poll0, ~19:40Z): **PASS exit 0** (wrapper
  PASS, libs đủ 5, GST đủ isomp4 + libav, apt đủ 11 package,
  debroot 269 file) — replay đã xong trước khi T5b mở.
- Sau sửa script (after-edit, ~19:42Z): vẫn PASS exit 0 — logic
  không đổi.
- Watcher b82 poll 1–2 (19:42:36–19:43:36Z): postboot exit 0 cả 2
  poll; dpkg 1545 frozen từ poll 2, 0 proc, GST 269 → **FLAG_WRITTEN
  19:43:36Z (boot +9m21s, poll 2)**; watcher tự kết thúc
  `done_pass_stable_2polls`, exit 0.
- Watcher b83 poll 1–2 (19:45:27–19:46:27Z, trong round132-t5/):
  postboot exit 0 cả 2 poll; dpkg 1545 frozen từ poll 2, 0 proc →
  **FLAG_WRITTEN 19:46:27Z (boot +12m12s, poll 2)**; tự kết thúc
  `done_pass_stable_2polls`, exit 0.
- Final confirm ~19:44Z exit 0. Tổng trên boot mới: postboot PASS
  5/5 (poll0 + after-edit + b82 poll 1–2 + final) và 2/2 ở b83 —
  0 lần FAIL.
- Cờ `POSTBOOT_PASS` hiện tại là của boot mới ở CẢ hai thư mục
  (round132-t5/: pass_at 19:46:27Z — T4/T8 gate bằng cờ này;
  round132-t5b/: pass_at 19:43:36Z — bản ghi T5b). GST là thư mục
  hệ thống THẬT (269 file) — không có symlink → debroot.
- Mốc 20:35Z trong task không bị trễ (cờ viết 19:43:36Z/19:46:27Z,
  trước hạn đóng đợt ~50 phút); pha 1 xong trong ~7 phút làm việc
  (replay đã xong trước khi mở lượt — khác hẳn T5 pha 1 đợt 132
  chờ replay + repair ~58 phút).

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 14:43Z (boot f868abad, ~17' tuổi) | 2846 | mở lượt đợt 131 |
| T5, ~14:51Z (boot f868abad, ~25' tuổi) | 2844 | cuối pha 1 đợt 131 |
| T5, 15:0xZ (boot ad1327ef, mở lại) | 2851 | mở lại lượt đợt 131 |
| T5, ~15:32Z (boot ad1327ef) | 2849 | cuối lượt làm lại đợt 131 |
| T5, 17:41Z (boot b379ecd7, ~17' tuổi) | 2744 | probe nhanh lúc kiểm đầu |
| T5, 17:44Z (boot b379ecd7, ~20' tuổi) | 2735 | mở lượt đợt 132 (headroom-open.txt) |
| T5, ~18:38Z (boot b379ecd7, ~1h14' tuổi) | 2735 | cuối pha 1 đợt 132 (headroom-end.txt) |
| **T5b, 19:41Z (boot mới, ~7' tuổi)** | **2738** | **probe nhanh lúc kiểm đầu** |
| **T5b, 19:42Z (boot mới, ~8' tuổi)** | **2737** | **mở lượt đợt 132 (headroom-open.txt)** |
| **T5b, ~19:44Z (boot mới, ~10' tuổi)** | **2737** | **cuối pha 1 đợt 132 (headroom-end.txt)** |

- Headroom không đổi trong lượt (2737 → 2737) nhưng giảm ~112 so
  với cuối lượt T5 đợt 131 (2849 → 2737 qua 2 reboot; probe nhanh
  19:41Z đọc 2738 — dao động ±1 theo watch của luồng khác, file
  mở/cuối đều ghi 2737). Chuỗi dài hạn: 4438 → 4318 → 3645 →
  3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 → 3089 → 3078 →
  3079 → 2971 → 2957 → 2952 → 2954 → 2846 → 2844 → 2851 → 2849 →
  **2735 → 2735 → 2737 → 2737**. Vẫn gấp ~1,7 lần số watch vite
  thường cần (~1586). **Vite thường chạy được trên boot này. Chưa
  tới ngưỡng báo user (< ~1.800) — chỉ theo dõi** (quyết parent
  §12(h) đợt 127). Còn cao hơn ngưỡng ~937.
- Trần 63747 vẫn đầy ở mức ~61k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 19:38:03Z (T4 gate0 poll #1) | 1340 MB | trước khi T5b mở |
| 19:39:53Z (T5b mở lượt) | 1085 MB | lúc exec đầu |
| 19:40:03Z (T4 gate0 poll #2) | 1070 MB | |
| 19:41Z (kiểm đầu T5b) | 971 MB | probe headroom |
| 19:42:14Z (mở lượt) | 811 MB | ram-open.txt |
| 19:42:36Z (watcher b82 poll 1) | 738 MB | |
| 19:43:36Z (watcher b82 poll 2, ghi cờ) | 700 MB | |
| ~19:44Z (final confirm) | 649 MB | ram-end.txt |
| 19:45:27Z (watcher b83 poll 1) | 503 MB | |
| 19:46:27Z (watcher b83 poll 2, ghi cờ) | 540 MB | |
| 19:48:04Z (T4 gate 0 ĐẠT) | 536 MB | |
| 19:58:12Z (T4 gateA poll 10) | 526 MB | |
| 19:59:19Z (T4 gateA poll 1, cửa sổ 2) | 468 MB | **thấp nhất ghi nhận** |
| 20:06:48Z (T9 poll) | 511 MB | |
| 20:08:20Z (T4 gateA poll 10, cửa sổ 2) | 517 MB | |

- RAM tụt liên tục 1340 → 468 MB trong ~21 phút (19:38–19:59Z)
  khi các luồng đợt 132 chạy lại sau reboot (T4 gate, T9 attempt,
  watcher T5b, các luồng khác); sau đó đứng yên ~500–520 MB.
  Mức thấp nhất 468 MB (19:59:19Z) thấp hơn 500 MB cuối pha 1 T5
  đợt 132 (poll 35) 32 MB — là mức thấp nhất từng ghi trên boot
  này (chưa phá kỷ lục 461 MB cuối lượt làm lại T5 đợt 131).
- Swap đã dùng: 226 MB lúc kiểm đầu (ghi nhận, không phân tích).
- Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
- **Hệ quả trực tiếp (xem §8):** gate A của T4 cần RAMavail
  ≥1024 MB — RAM không bao giờ đạt ngưỡng này trong cửa sổ quan
  sát 19:48–20:08Z (cao nhất 536 MB sau khi gate 0 đạt), nên T4
  không đo được pass nào. T5b không hạ ngưỡng, không can thiệp.

## 5. Watcher — b82 v5 (2 poll, ghi cờ t5b) + b83 v5 (2 poll, ghi cờ gate-visible)

- **b82** chạy 19:42:36–19:43:36Z (2 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script b82 copy từ bản b81 v5
  đợt 132 (T5) — chỉ đổi btime/mốc/log + ghi chú replay boot mới
  đã xong nhanh + gstreamer1.0-gl có sẵn; `bash -n` OK trước khi
  chạy. Không đổi logic EVAL §8.2/luật (C)/ngưỡng poll nào.
- Poll 1 (19:42:36Z): dpkg=1545 installs=221, silent 348s, 0 proc,
  postboot 0, lists=37, partial=0, GST=269, RAM 738 MB. EVAL §8.2B
  TRIGGER=NO (c1=no — postboot đã PASS; đúng — không có gì để
  repair).
- Poll 2 (19:43:36Z): dpkg=1545 frozen=yes, silent 408s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 19:43:36Z (boot +9m21s)**.
- **b83** chạy 19:45:27–19:46:27Z (2 poll) trong `round132-t5/`,
  tự kết thúc `done_pass_stable_2polls`, exit 0 — xem §5.1 (lý do
  chạy thêm + nhánh archive kích hoạt live lần đầu).
- Poll 1 (19:45:27Z): dpkg=1545 installs=221, silent 519s, 0 proc,
  postboot 0, lists=37, partial=0, GST=269, RAM 503 MB.
- Poll 2 (19:46:27Z): dpkg=1545 frozen=yes, silent 579s, 0 proc,
  postboot 0 → **FLAG_WRITTEN 19:46:27Z (boot +12m12s)**.
- KHÔNG reboot trong lúc watcher chạy (19:42–19:46Z); boot_id không
  đổi suốt pha 1 (07da9c50 tới 20:08Z+).
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.
- `wrapper=0` mọi poll b82/b83 (replay đã xong; không còn false
  positive os-intent — khác các đợt trước, khi replay đang chạy).

### 5.1 Cờ gate-visible + nhánh archive v5 kích hoạt LIVE lần đầu (b83)

- **Phát hiện (19:44–19:45Z):** T4 gate0-wait poll #4 (19:44:04Z)
  vẫn `t5flag=cu(mtime-cu)` dù cờ t5b đã viết 19:43:36Z. Đọc
  `gate0-wait-t4-07da9c50.sh`: T4 chỉ đọc
  `$H/round132-t5/POSTBOOT_PASS` (cờ cũ b379ecd7, mtime 18:35Z <
  boot 19:34:15Z → "cu"), KHÔNG đọc `round132-t5b/`. T7 không
  cứu được: round132-t7/ KHÔNG có POSTBOOT_PASS; round132-t7.done
  mtime 17:48:29Z < boot mới → t7flag cũng "cu". Nếu không sửa,
  T4 gate0-wait sẽ chạy hết 60 phút (tới ~20:38Z) mà không bao giờ
  PASS — lượt yên #10 chết vì cờ nằm sai thư mục, không phải vì
  hạ tầng chưa sẵn sàng.
- **Xử lý:** T5b chạy watcher b83 (copy b82, đổi HF sang
  round132-t5/) — KHÔNG copy cờ tay. Watcher b83 tự làm đúng
  thiết kế v5: lúc khởi động thấy `POSTBOOT_PASS` cũ boot_id
  b379ecd7 ≠ boot hiện tại → **`STALE_FLAG_ARCHIVED 19:45:27Z`**
  (cờ cũ → `POSTBOOT_PASS.stale-b379ecd7`, giữ bằng chứng); 2
  poll postboot exit 0 + dpkg đóng băng + 0 proc → ghi cờ mới
  19:46:27Z (ghi đè không điều kiện). **Đây là lần đầu nhánh
  archive của watcher v5 kích hoạt LIVE** (T5 đợt 132 §5.1 ghi rõ
  nhánh này chưa từng kích hoạt live — thư mục round132-t5/ khi
  đó mới nên log `NO_FLAG_AT_START`; lần này có cờ stale thật
  trên đĩa và archive chạy đúng).
- **Kết quả:** T4 gate0-wait poll #5 (19:46:04Z) đọc
  `t5flag=chua-co` (đúng — b83 vừa archive cờ cũ 19:45:27Z, chưa
  viết cờ mới tới 19:46:27Z); poll #6 (19:48:04Z) đọc
  **`t5flag=PASS`** → **GATE 0 ĐẠT** (T5=PASS + check-only riêng
  PASS + apt=0 + cây md5=805409f0). T4 vào gate A ngay sau đó.
- T8 không bị ảnh hưởng: `wait-postboot-132t8.sh` và
  `wait-t4-t5-132t8.sh` đã đọc cả hai thư mục (`for d in
  "$HF/round132-t5" "$HF/round132-t5b"`) — cờ t5b 19:43:36Z đã đủ
  cho T8; cờ gate-visible 19:46:27Z là dự phòng thêm.
- **Bài học cho parent (ghi rõ, không tự sửa quy trình):** brief
  T5b giao "copy watcher sang thư mục làm việc của bạn" nhưng
  gate của T4 hardcode thư mục `round132-t5/` — hai thư mục khác
  nhau thì cờ không tới được gate. Lần sau: brief hạ tầng postboot
  sau reboot giữa lượt nên ghi rõ **thư mục cờ gate-visible**
  (round132-t5/ khi T4 gate0-wait còn hardcode đường đó), hoặc T4
  sửa gate0-wait đọc thêm thư mục T5b (việc của T4/parent, T5b
  không tự sửa script của luồng khác).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt ~19:40Z và cuối pha 1 ~19:44Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **75 file / 1050 B**
  (khớp đúng số T10 đếm lúc đóng đợt 131) — không đổi trong lượt.
  Đều là cooldown cũ, không chặn luồng khác, không tính là ticket.
  Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125) —
  việc prune là của T6, T5b chỉ ghi số.
- T5b KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt (reboot đã xóa sót đợt
  131; T4/T8 đợt 132 tự quản Xvfb của mình).

## 7. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL (b82 + b83, rút gọn)

> Quyết parent đợt 125 §12(b): §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm
> mà không cài"; ngưỡng chờ dạng (B) dpkg im ≥10 phút (thay vì 15);
> luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg đóng băng; hiệu lực
> từ đợt 126. Luật (C) (quyết parent đợt 122 §12.4): đủ 5 điều kiện
> mới kill tiến trình kẹt rồi chạy --repair một lần có giám sát.

| Watcher | Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| b82 | 1 | 19:42:36Z | 348s | no (exit 0) | yes | - (no) | **NO** |
| b82 | 2 | 19:43:36Z | 408s | no (exit 0) | yes | - (no) | **NO** |
| b83 | 1 | 19:45:27Z | 519s | no (exit 0) | yes | - (no) | **NO** |
| b83 | 2 | 19:46:27Z | 579s | no (exit 0) | yes | - (no) | **NO** |

- **TRIGGER=NO ở cả 4 poll — ĐÚNG:** postboot đã PASS từ trước
  poll 1 (điều kiện (1) FAIL tươi không đạt), replay đã xong,
  không có gì để repair. Không có kiểm chứng độc lập pre-repair
  nào — vì không repair (không cần).
- **Luật (C): KHÔNG KÍCH HOẠT** — 0 apt/dpkg đang chạy (không có
  process để nghi kẹt), dpkg đóng băng vì replay đã xong, không
  phải vì kẹt.
- **Khoảng trống proxy C4 dạng (A) (T5 §7.2): KHÔNG kích hoạt
  trên boot này** — replay cài đủ gói (kể cả gstreamer1.0-gl),
  postboot PASS, nên C4 không bao giờ được tính tới. Khoảng trống
  vẫn mở cho boot sau gặp lại hình dạng "replay đầy đủ nhưng
  thiếu 1 gói GST" — đề xuất widen của T5 vẫn chờ parent quyết.

## 8. PHA 2 — Phân tích log draw cho (c2) lượt yên #10 — KHÔNG CÓ DỮ LIỆU, CHUYỂN ĐỢT 133

- **Trạng thái lúc đóng LIMITS này (20:11–20:30Z): CHƯA LÀM —
  không tồn tại dữ liệu lượt #10.** T4 chưa bao giờ đo được pass
  nào trên boot mới (cũng như trên boot b379ecd7 trước đó — 0
  attempt, 0 JSON, 0 (c2), 0 log draw lượt #10 trên cả hai boot).
- **Diễn biến T4 trên boot mới (đọc từ gate0-wait + poll-t4.log
  của T4, không suy diễn):**
  - Gate0-wait: poll #1–#4 (19:38–19:44Z) t5flag=cu → poll #5
    (19:46:04Z) t5flag=chua-co (b83 vừa archive cờ cũ) → poll #6
    (19:48:04Z) **t5flag=PASS → GATE 0 ĐẠT** (check-only riêng
    PASS + apt=0 + cây md5=805409f0; RAMavail 536 MB).
  - Gate A: poll 1–10 cửa sổ 1 (19:48–19:58Z, RAM 468–536 MB) →
    "HET 10 PHUT GATE A KHONG MO" → cửa sổ 2 poll 1 (19:59:19Z,
    RAM 468 MB) → poll 9–10 (20:07–20:08Z, RAM 516–517 MB) →
    cửa sổ 2 sắp hết lúc ~20:09Z. Mọi điều kiện khác đều mở
    (load1 0,16–0,27, load5 0,21–0,26, lock không, blockers 0,
    tree md5 khớp) NHƯNG RAMavail chỉ 468–544 MB suốt thời gian —
    không bao giờ đạt ngưỡng ≥1024 MB.
  - Thư mục round132-t4/ lúc 20:11Z chỉ có b.json + script + log
    gate — không có file JSON attempt nào; cờ round132-t4.done
    chưa xuất hiện (kiểm lần cuối 20:11:45Z; T4 gateA poll 9–10
    cửa sổ 2 lúc 20:07–20:08Z, RAM 516–517 MB; boot 07da9c50 vẫn
    sống, RAM 501 MB lúc 20:11Z).
- **So sánh với boot b379ecd7:** T4 cũng kẹt gate A ~56 phút
  (18:38–19:33Z, RAM 432–552 MB, 4 cửa sổ 10 phút, ngân sách
  gate A 60 phút sắp hết thì reboot tới). Tổng cộng T4 đã chờ
  gate A ~1h36m trên 2 boot mà không đo được pass nào — RAM
  thấp kéo dài là nút thắt, không phải cờ postboot (cờ đã viết
  đúng hạn cả hai lần: 18:35:45Z trên boot cũ, 19:43:36Z/19:46:27Z
  trên boot mới).
- **Phương pháp pha 2 (đã chuẩn bị sẵn, dùng lại đợt 133):**
  script `t5-c2-drawlog-analysis.py` (copy từ T5 đợt 132,
  py_compile OK; COVERED ±500ms của T4 + P3-A1 của T3) nằm tại
  `round132-t5b/` — T5 đợt 133 dùng lại, chỉ cần truyền JSON
  attempt cuối + labellag T4 mới. Thiết kế lượt #10 (prereg T4):
  probe re-arm `window.__vcutC2DrawLog` sau các pass 4,7,9,11,13,
  15,17, tích lũy epoch (dedupe theo khóa
  wallMs|point|frameIdx|loopNo|ct|clipId) vào partial + final
  JSON — phủ 14/15 pass hậu-flip. Phương pháp: (A) cửa sổ log
  draw có phủ cửa sổ đo post-flip không + COVERED từng seq (c2);
  (B) drawSrc có trễ sau ct không, rawUnit khớp drawSrc không;
  (C) tương quan (c2) ↔ curPix run + ghost freeze (P3-A1) + skew
  snap/label; (D) tái kiểm histogram/labellag/tickcost bằng code
  riêng. Verdict sẽ kết luận rõ: desync chứng minh/bị bác hay
  vẫn chưa (P7 của T3); ghost-freeze mạnh lên hay yếu đi.
- Không chạy lượt đo E4 hay TTS nào (theo quyết parent).

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (boot mới, ~19:42Z): md5 `123750ba…` → `0d412c35…` (ghi
  trong `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn boot MỚI THỨ 4 (b379ecd7 chết trong khung
  (19:33:56Z, 19:34:15Z], rộng 19s — khung hẹp nhất từng kẹp;
  reboot giữa lượt lần thứ 6 liên tiếp; replay chạy xong nhanh —
  configure 19:34:46Z, cài xong 19:36:48Z, 1545 dòng / 221
  installs, GST 269 file, gstreamer1.0-gl đã cài bởi replay, KHÔNG
  cần repair) + dòng `say` cập nhật tương ứng. Dòng `say` mới
  không chứa ký tự `"` (dùng `m`/`s` thay dấu phút/giây) — không
  lặp sự cố đợt 120. `bash -n` OK.
- Kiểm chứng: sau khi sửa lần 1, postboot vẫn PASS exit 0 (lần kiểm
  sau sửa ~19:42Z) — logic không đổi đã được xác nhận bằng chạy
  thật; watcher b82/b83 dùng cùng script này PASS exit 0 ở cả 4
  poll + final confirm.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5b không nhận được phê duyệt
  đó trong task — giữ nguyên. (--repair KHÔNG chạy trên boot này.)

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5b KHÔNG tự đổi thân cron.
- Reboot b379ecd7→07da9c50 giữa lượt đợt 132 là ví dụ mới nhất
  (lần thứ 6 liên tiếp reboot rơi vào khoảng giữa đợt đóng / lượt
  mở / giữa lượt) cho thấy R9 (a) vẫn có giá trị: T4 đợt 132 phải
  chờ cờ POSTBOOT_PASS mới (T5b viết 19:43:36Z/19:46:27Z, ~9–12
  phút sau khi lượt mở trên boot mới — nhanh hơn nhiều so với 61
  phút trên boot cũ nhờ replay xong nhanh) mới gate được lượt yên
  #10. Vá §8.4(ii) + cờ gắn boot_id + watcher v5 xóa cờ stale đã
  giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 11. Nợ mở sang đợt sau

1. **Boot 07da9c50 đang sống + PASS (replay xong nhanh 1545/221 +
   gstreamer1.0-gl có sẵn, KHÔNG repair) — các luồng đo đợt 132
   dùng cờ này** (`round132-t5/POSTBOOT_PASS`, boot_id 07da9c50…,
   PASS 19:46:27Z; bản sao ghi chép tại round132-t5b/, PASS
   19:43:36Z). Cờ b379ecd7 (PASS 18:35:45Z) đã STALE + archived
   (`POSTBOOT_PASS.stale-b379ecd7`). Nếu boot mới cũng chết sớm
   như #69? (~19–20') hoặc #72? (54m08s) thì T5 đợt sau phải làm
   lại từ đầu. Tuổi thọ boot gần đây: xem §2.
2. **Số thứ tự boot TẠM — chờ T6 chốt mù #37 đợt 132** (quyết
   parent đợt 130 §12.3(h)). Nếu T6 đếm khác, LIMITS này +
   script postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **Khung b379ecd7 chết (19:33:56Z, 19:34:15Z] rộng 19s** (lần
   cuối còn sống: T4 gateA poll 5 19:33:56Z) — khung hẹp nhất từng
   kẹp; ghi nguyên trạng, không suy diễn thêm.
4. **PHA 2 (c2) CHUYỂN ĐỢT 133** — xem §8: T4 chưa đo được lượt
   yên #10 (kẹt gate A, RAM 468–544 MB < 1024 MB). T5 đợt 133
   dùng lại script `t5-c2-drawlog-analysis.py` tại round132-t5b/
   + prereg T3 (P1/P3/P7, bổ sung A1) + prereg T4.
5. **Cờ gate-visible (mới, §5.1):** T4 gate0-wait hardcode
   `round132-t5/`; brief hạ tầng sau reboot giữa lượt cần ghi rõ
   thư mục cờ gate-visible, hoặc T4 sửa gate đọc thêm thư mục T5b.
   T5b đã xử lý trong phiên bằng watcher b83 (archive live +
   ghi cờ mới) — T4 gate 0 ĐẠT 19:48:04Z.
6. **KHOẢNG TRỐNG PROXY C4 dạng (A) (T5 §7.2) vẫn mở cho boot
   sau:** watcher tính (A) = GST<100 file — không bao hình dạng
   "replay đầy đủ nhưng thiếu 1 gói plugin GST". Boot này không
   kích hoạt khoảng trống (không thiếu gói nào). Đề xuất parent
   widen C4 vẫn chờ quyết.
7. **Baseline replay KHÔNG còn giá trị tuyệt đối** (§3.3):
   1509/217 → 1551/222 → 1545/221 trong 3 boot liên tiếp. Tiêu
   chí PASS là postboot exit 0 + GST đủ + apt đủ 11 package,
   không phải số dòng/installs.
8. **Lists boot mới 37 file** — ít hơn b379ecd7 sau repair (75
   file / 68 noble, 2 mirror) và f868abad (71/68). Postboot PASS
   đủ 11/11 nên chức năng đủ; theo dõi ở boot sau.
9. **Headroom tiếp tục giảm dài hạn:** …2846 → 2844 → 2851 →
   2849 → **2735 → 2735 → 2737 → 2737** (boot mới). Trần 63747
   cần can thiệp host — ngoài tầm luồng này. Ngưỡng báo user
   < ~1.800 chưa tới (còn ~937).
10. **RAM thấp kéo dài là nút thắt lượt yên #10:** T4 kẹt gate A
    ~56 phút trên boot cũ + ~20+ phút trên boot mới (tới 20:08Z),
    RAM không bao giờ đạt ≥1024 MB (cao nhất sau gate 0 đạt:
    536 MB). T9 theo dõi RAM ghim (nhiệm vụ T9). T5b không hạ
    ngưỡng gate A, không can thiệp.
11. **R9 (a) vẫn chờ user (nhắc lần 16).**
12. **Cooldown file tích lũy (75 file / 1050 B, không đổi)** — luật
    prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
    của T6.
13. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 131 §11 + quyết
    parent §12.3: mù #51 MỚI MỞ (probe #51 đợt 132 — việc T2);
    G1 chờ user quyết; birefnet (chỉ thử lại khi quan sát được
    available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml
    vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
    KHÔNG push khi user chưa nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI trong pha 1 (md5 `805409f0`, y hệt
  T5/T5b đợt 130 + T5 đợt 131 sau instrumentation (c2));
  `media.ts`: KHÔNG đổi (`2c384ed1`); `apps/web/vite.config.ts`:
  KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (tham chiếu boot trong header + dòng `say`; md5 `123750ba…` →
  `0d412c35…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5b chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK; watcher b82 + b83 OK.
- `tsc` / `vite build`: KHÔNG chạy trong pha 1 (không sửa production;
  tsc đã exit 0 trên boot mới theo entry T4 đợt 132 — kiểm sau).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  468–1340 MB < 6 GB).
- O8: KHÔNG thuộc T5b (T8 gate bằng cờ này — cờ boot mới đã đúng
  ở cả hai thư mục).
- Postboot boot mới: PASS 5/5 (poll0 + after-edit + b82 poll 1–2 +
  final) và 2/2 ở b83 — 0 lần FAIL. Watcher b82: 2 poll, tự kết
  thúc `done_pass_stable_2polls`, exit 0. Watcher b83: 2 poll, tự
  kết thúc `done_pass_stable_2polls`, exit 0 (archive stale live).
  **Reboot GIỮA LUỘT T5b pha 1: KHÔNG** (boot_id không đổi suốt
  19:39–20:08Z+).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=NO cả 4
  poll (b82 + b83)** — postboot đã PASS, không có gì để repair.
  **--repair: KHÔNG CHẠY (không cần).** **Luật (C): ĐÁNH GIÁ MỖI
  POLL, KHÔNG KÍCH HOẠT** (0 apt/dpkg đang chạy).
- Headroom: 2737 (mở) → 2737 (cuối pha 1).
- RAM thấp nhất lượt: 468 MB (T4 gateA poll 1 cửa sổ 2, 19:59:19Z);
  cao nhất 1340 MB (T4 gate0 poll #1, 19:38:03Z, trước khi T5b mở).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  75 file / 1050 B, không đổi).
- Event lag (c2): pha 2 CHƯA CÓ DỮ LIỆU — chuyển đợt 133, xem §8.
- **Watcher v5 nhánh archive: KÍCH HOẠT LIVE LẦN ĐẦU (b83,
  19:45:27Z)** — xem §5.1. Nhánh ghi đè chạy thật ở b82 poll 2
  (19:43:36Z) + b83 poll 2 (19:46:27Z).

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu boot trong header + dòng `say`; md5 `123750ba…` →
  `0d412c35…`; không đổi logic).
- `docs/PHASE9_ROUND132_T5B_INFRA_LIMITS.md` (file này — mới;
  pha 1 xong, pha 2 chuyển đợt 133).
- Harness trong hidden_files (KHÔNG stage): `round132-t5b/` (log
  watcher b82 v5 (2 poll) + b83 v5 (2 poll, trong round132-t5/),
  log postboot mở lượt/after-edit/final (boot mới), md5 trước/sau
  của postboot-check, log headroom mở/cuối (2737/2737), log RAM
  mở/cuối (811/649 MB), `POSTBOOT_PASS` (cờ t5b — boot mới, PASS
  19:43:36Z), `t5b-initial-state.md`, `t5-wait-replay-b82.sh` +
  `t5-wait-replay-b82.log` + `.nohup.log`,
  `t5-c2-drawlog-analysis.py` (py_compile OK — dùng lại đợt 133),
  `t5-postboot-b82-poll*.log` (2 file)); `round132-t5/` thêm:
  `t5-wait-replay-b83.sh` + `t5-wait-replay-b83.log` + `.nohup.log`,
  `POSTBOOT_PASS` (cờ gate-visible — boot mới, PASS 19:46:27Z),
  `POSTBOOT_PASS.stale-b379ecd7` (cờ cũ đã archive),
  `t5-postboot-b83-poll*.log` (2 file).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round132-t5b-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round132-t5b.done` (ghi rõ CHỈ XONG PHA 1,
  pha 2 chuyển đợt 133 vì T4 chưa đo được lượt yên #10).

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
