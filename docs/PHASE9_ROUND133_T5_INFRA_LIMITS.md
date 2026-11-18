# PHASE9_ROUND133_T5_INFRA_LIMITS — Widen trigger §8.2(B) v6 (A2) XONG + postboot boot 07da9c50 PASS (cờ gate-visible 20:50:22Z) + PHA 2 (c2) XONG: P1/P3 ĐÚNG, P2 ĐÚNG, P7 KHÔNG KIỂM ĐƯỢC (log 0/5) — mô hình freeze/skew ĐƯỢC CỦNG CỐ

> Luồng T5, đợt 133, lượt cron 03:35 +07 18/11/2026 (bắt đầu 20:39:57Z trên
> boot 07da9c50; pha 1 xong 20:50:22Z; pha 2 xong 21:11Z; KHÔNG reboot
> trong lúc làm). Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git`
> local — KHÔNG push). T5 đợt 133 làm 3 phần theo brief: (1) widen trigger
> §8.2(B) theo quyết parent đợt 132 §12.3(b); (2) postboot cho boot hiện tại
> 07da9c50 + cờ gate-visible vào round133-t5/; (3) pha 2 phân tích log draw
> (c2) lượt yên #10 SAU KHI T4 đo xong (cờ round133-t4.done 21:10Z).
> **CẢ 3 PHẦN ĐÃ XONG — xem §1, §5, §8.**
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (kể cả instrumentation
> (c2) — preview.tsx md5 805409f0 KHÔNG ĐỔI). KHÔNG chạy --repair (không cần
> — postboot PASS). CẤM kiểm lại TTS 39; birefnet không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **WIDEN TRIGGER §8.2(B) XONG (quyết parent đợt 132 §12.3(b)).**
   Watcher v6 (b84) thêm dạng **(A2)**: replay đã xong (installs>0, 0 proc)
   + postboot FAIL + log poll ghi thiếu ≥1 gói đích (dòng `FAIL apt: chưa
   cài:` / `FAIL libs: thiếu:` / `FAIL GST: thiếu` của postboot-check).
   "Đầy đủ" = ĐỦ BỘ GÓI ĐÍCH, không chỉ "replay chạy đầy đủ". Kiểm chứng
   khô trong /tmp: 8 ca đều đúng (hình dạng b379ecd7 GST=268 thiếu
   gstreamer1.0-gl → A2/yes; (A) cũ → A/yes; (B) → B/yes; FAIL chỉ do
   wrapper → -/no; PASS → -/no; thiếu lib → A2/yes; thiếu plugin GST →
   A2/yes; replay còn chạy → -/no). Đối chiếu v5 trên ca b379ecd7-shape →
   -/no (đúng khoảng trống proxy). `bash -n` OK. md5 watcher v5 (b81)
   `6a04a364…` → v6 (b84) `1946b2d0…`; diff sau chuẩn hoá chỉ còn header +
   C4 A2 + dòng EVAL + btime cờ — KHÔNG đổi logic khác.
2. **Boot 07da9c50 VẪN SỐNG, KHÔNG reboot trong phiên T5** (boot_id không
   đổi 20:39–21:11Z; btime 19:34:15Z; tuổi boot lúc đóng ~1h37m). Cùng boot
   lúc đóng đợt 132 — đây là lần đầu sau 6 reboot liên tiếp mà một boot
   sống qua cả lượt cron mở + đóng (xem §2).
3. **Postboot PASS ngay từ lần kiểm đầu.** poll0 20:48Z exit 0 (wrapper,
   libs đủ 5, GST đủ isomp4 + libav, apt đủ 11 package, GST 269 file,
   debroot 269). Watcher b84 v6 2 poll (20:49:22–20:50:22Z), postboot exit 0
   cả 2 poll, TRIGGER=NO cả 2 poll (đúng — không có gì để repair),
   **cờ `POSTBOOT_PASS` gate-visible viết 20:50:22Z** (boot +1h16m07s,
   poll 2) vào `round133-t5/` — đúng thư mục T4 đợt 133 gate0-wait đọc.
   Final confirm 21:04Z exit 0. Tổng: postboot PASS 4/4 trong các lần kiểm
   của T5 (poll0 + watcher 2 poll + final), 0 lần FAIL. **KHÔNG --repair.**
4. **Cờ gate-visible ĐÃ TỚI ĐƯỢC GATE — lượt yên #10 ĐO ĐƯỢC LẦN ĐẦU SAU
   2 ĐỢT.** T4 gate0-wait poll #1–#2 (20:49:15–20:50:00Z) đọc
   `t5flag=chua-co` (cờ chưa viết — watcher đang ở poll 1); poll #3
   20:50:45Z đọc `t5flag=PASS` + RAM 1168 MB ≥1024 → **"CUA YEN MO"** —
   attempt1 chạy ngay 20:50:45Z. Cơ chế chờ RAM (quyết parent §12.3(a))
   mở cửa sổ vàng ngay ở poll #3 (chỉ 3 poll × 45 s), khác hẳn đợt 132
   (8 lần timeout 10 phút, 0 attempt).
5. **PHA 2 (c2) XONG — lần đầu có dữ liệu lượt yên #10 để phân tích.**
   T4 attempt1 20/20 pass exit 0 (JSON 3.274.496 B, sha256 e3ca1ac5…);
   cờ round133-t4.done 21:10Z. (c2) skp=0 n=5, đều lag +1f (seq 166, 218,
   293, 323, 394). **P1 ĐÚNG** (5/5 trong ±1 tick run-end, baseline 9,6%,
   p nhị thức ≈ 8,2e-6 < 0,01). **P2 ĐÚNG** (0 (c2) lag âm). **P3 ĐÚNG**
   (bản sửa A1: 5/5 đóng băng-tại-tick, baseline 20,3%, p ≈ 3,4e-4 <
   0,01). **P4 ĐÚNG** (thuần +1f: 5; tổng 5; skp=1: 0; lag ≥+5f: 0).
   **P5: 2/4 trong dải** (snap median 35 ms ✓; raw median 8 ms ✓;
   label-floor +1: 76,5% — ngoài 63–76% sát nút +0,5pp; run ≥3 tick: 12
   — ngoài 13–22 sát nút −1; ghi rõ, không bác mô hình). **P6 trong
   khoảng** (phù hợp 8 lượt trước). **P7 KHÔNG KIỂM ĐƯỢC** (log draw 0/5
   covered — xem mục 6). **Verdict tổng: mô hình ghost-freeze/skew
   ĐƯỢC CỦNG CỐ** (P1 VÀ P3 cùng ĐÚNG, P2 ĐÚNG — theo quy tắc verdict
   prereg T3 §4).
6. **P7 KHÔNG KIỂM ĐƯỢC — nguyên nhân gốc đã xác định (T4 §6, T5 xác
   nhận từ dữ liệu):** log draw n=137, wallMs 9854→16068, flip 26187 ms —
   log dừng **10.119 ms TRƯỚC flip**; 0/5 (c2) covered; 0/376 blendTick
   hậu-flip trong ±500 ms của log; 1 epoch duy nhất (loop 1–2). 7 lần
   re-arm sau pass 4/7/9/11/13/15/17 vet **+0 entry cả 7 lần**. Nguyên
   nhân: loop-gate app-side `preview.tsx:705`
   (`if (c2DrawLogLoopNo < 1 || c2DrawLogLoopNo > 2) return;`) chỉ ghi
   loop 1–2 + re-enable xóa mảng (dòng 700). **KHÔNG attempt2** (quyết
   T4, có căn cứ — xem §8.6). Sửa instrumentation là việc parent + T3
   đợt 134; T5 KHÔNG tự sửa production.
7. **(c2) instrumentation: KHÔNG ĐỔI.** preview.tsx md5 `805409f0`
   (y hệt T5/T5b đợt 130/131/132); media.ts `2c384ed1`; vite.config.ts
   `ee80d093`.
8. **Headroom inotify: 2625 (mở) → 2623 (cuối)** — giảm 112 so với 2737
   lúc T5b mở đợt 132; vẫn ~1,7 lần số watch vite thường cần (~1586);
   CHƯA tới ngưỡng báo user (< ~1.800, còn ~823), chỉ theo dõi.
9. **RAM khả dụng 475–1574 MB trong lượt** (thấp nhất 475 MB lúc mở
   20:41Z; cao nhất 1574 MB 20:59:13Z; cuối 927 MB 21:06:42Z). Dù lấy số
   nào cũng < 6 GB guard — birefnet không thử. RAM ≥1024 MB xuất hiện
   nhiều lần trong lượt (1469 MB lúc watcher poll 1, 1168 MB lúc T4 mở
   cửa, 1574 MB lúc 20:59Z) — cửa sổ vàng KHÔNG hiếm trên boot này, khác
   đợt 132 (RAM kẹt 420–552 MB suốt ~90 phút).
10. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
    Queue cooldown 76 file / 1064 B (tăng 1 file / 14 B so với 75/1050 lúc
    đóng đợt 131) — không đổi trong lượt; T5 KHÔNG đụng lock/queue.
11. **R9 (a) vẫn chờ user — nhắc lần 16** (số đếm không tăng so với
    đợt 130/131/132, theo quyết parent).
12. **Ngưỡng WebKit ≤60 ms: GIỮ** (theo T4 đợt 133: median lượt #10 là
    39,5 ms — thấp nhất trong 9 lượt hợp lệ, biên 20,5 ms). T5 không dùng
    kết quả lượt #10 để đổi ngưỡng/bar/DEF (theo prereg T3 §4).

## 2. Boot 07da9c50 — vẫn sống (không reboot trong phiên T5)

- Boot hiện tại: btime 2026-11-17 19:34:15Z (btime kernel; `uptime -s`
  đồng ý), boot_id `07da9c50-5836-4481-a4a4-7e22c6260325`, sau b379ecd7
  2h10m07s. Số thứ tự TẠM, chờ T6 đếm lại mù #37 đợt 133.
- Boot_id kiểm lúc mở (20:39:57Z), lúc watcher poll 1–2, lúc final
  confirm (21:04:29Z), lúc đóng (21:11:00Z) đều là 07da9c50 — **KHÔNG
  reboot trong phiên T5** (20:39–21:11Z, ~31 phút làm việc + chờ T4).
  Đây là boot đầu tiên sau chuỗi 6 reboot liên tiếp quanh ranh giới đợt
  (#75? giữa lượt đợt 129, #77? giữa lượt đợt 130, #78? giữa đóng 130 /
  mở 131, f868abad giữa lượt đợt 131, ad1327ef giữa đóng 131 / mở 132,
  b379ecd7 giữa lượt đợt 132) sống qua cả lượt cron mở + đóng đợt.
  Tuổi boot lúc T5 đóng: ~1h37m (btime 19:34:15Z → 21:11Z).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5 mở, nhưng là của
  CHÍNH đợt 133 này (tạo 20:35Z bởi parent vòng lặp, "Đợt 133 đang chạy,
  hạn cứng 23:35Z") — KHÔNG phải đợt main-chat. Luật chốt chặn (chỉ chặn
  khi đợt main-chat đang chạy) không áp dụng; lượt cron làm việc bình
  thường. T5 KHÔNG xóa chốt chặn (việc của T10 khi đóng).
- **Cờ POSTBOOT_PASS của đợt 132 vẫn đúng boot** (round132-t5/, PASS
  19:46:27Z, boot_id 07da9c50…) — nhưng T4 đợt 133 gate0-wait chỉ đọc
  `round133-t5/` (theo brief T4 đợt 133 + bài học đợt 132 §5.1), nên T5
  viết cờ MỚI vào round133-t5/ (xem §3.3), không dựa vào cờ cũ.

## 3. Postboot boot hiện tại — PASS từ lần kiểm đầu, cờ gate-visible 20:50:22Z

### 3.1 Trạng thái lúc mở (20:39–20:48Z)

- dpkg.log **1545 dòng / 221 installs** — KHÔNG tăng thêm so với lúc T5b
  đóng đợt 132 (dòng cuối 19:36:48Z, gói cuối gstreamer1.0-tools).
  **Baseline replay của chính boot này là 1545/221** — KHÔNG đối chiếu
  với 1509/217 cũ (baseline trôi theo boot: 1509/217 → 1551/222 →
  1545/221; tiêu chí PASS là postboot exit 0 + GST đủ + apt đủ 11
  package, không phải số dòng/installs).
- **gstreamer1.0-gl `ii` 1.24.2-1ubuntu0.7** (đã cài bởi replay 19:35:28Z,
  7 dòng trong dpkg.log) — khác boot b379ecd7 (thiếu gói này, T5 phải
  --repair 1 lần). GST 269 file (thư mục hệ thống THẬT, không symlink),
  lists 37 file, partial 0.
- 0 apt/dpkg/wrapper/MiniBrowser lúc mở (pgrep -x apt/apt-get/dpkg = 0;
  pgrep -f `os-intent` = 0).
- Postboot poll0 (sau sửa script, ~20:48Z): **PASS exit 0** — wrapper
  PASS (đã vá K1), libs đủ 5, GST đủ isomp4 + libav, apt đủ 11 package
  (kể cả libevdev2), debroot 269 file. **KHÔNG cần --repair.**

### 3.2 Watcher b84 v6 — 2 poll, PASS ổn định, TRIGGER=NO (đúng)

| Poll | Thời gian (Z) | dpkg | installs | frozen | silent | postboot | GST | RAM | TRIGGER |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 20:49:22 | 1545 | 221 | no | 4354 s | 0 | 269 | 1469 MB | **NO** |
| 2 | 20:50:22 | 1545 | 221 | yes | 4414 s | 0 | 269 | 1285 MB | **NO** |

- Poll 1: `frozen=no` (poll đầu chưa có PREV_LINES để so — hành vi đã biết
  của watcher, không phải lỗi); c1=no (postboot PASS) → TRIGGER=NO.
- Poll 2: dpkg đóng băng, silent 4414 s, 0 proc, postboot 0 → PASS streak
  2 → **FLAG_WRITTEN 20:50:22Z (boot +1h16m07s, poll 2)**; watcher tự kết
  thúc `done_pass_stable_2polls`, exit 0.
- EVAL §8.2B cả 2 poll: c1=no → TRIGGER=NO (đúng — không có gì để repair).
  Luật (C) cả 2 poll: a=no, b=no, c=yes (silent ≥900 s), d=no, e=yes —
  KHÔNG KÍCH HOẠT (0 apt/dpkg đang chạy).
- Cờ `POSTBOOT_PASS` (round133-t5/):
  `boot_id=07da9c50-5836-4481-a4a4-7e22c6260325 btime=2026-11-17T19:34:15Z
  pass_at=2026-11-17T20:50:22Z poll=2` — đúng boot hiện tại.

### 3.3 Cờ gate-visible ĐÃ TỚI ĐƯỢC GATE (T4 gate 0 ĐẠT poll #3)

- T4 gate0-wait (poll 45 s, theo cơ chế chờ RAM mới): poll #1 20:49:15Z
  `t5flag=chua-co` (RAM 1549 MB, postboot_exit=0); poll #2 20:50:00Z
  `t5flag=chua-co` (RAM 1398 MB); **poll #3 20:50:45Z `t5flag=PASS`**
  (RAM 1168 MB) → **"CUA YEN MO"** — gate 0 PASS + gate A đủ → attempt1
  chạy ngay 20:50:45Z. Cờ viết 20:50:22Z, T4 đọc PASS 23 s sau — đúng
  thiết kế (cờ nằm ở round133-t5/, thư mục gate0-wait đọc; bài học đợt
  132 §5.1 đã được áp dụng ngay từ brief).
- Final confirm postboot 21:04:29Z exit 0 (wrapper/libs/GST/apt đủ).
  Tổng trên boot này trong phiên T5: postboot PASS 4/4 (poll0 + watcher
  poll 1–2 + final), 0 lần FAIL.
- T4 attempt1 (20/20 pass, exit 0) chạy trên boot này, vite :5187, Xvfb
  :193, WebKit 27.2 — xem §8. Không có lần postboot-check nào FAIL
  trong lượt.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5b, 19:42Z (boot này, ~8' tuổi) | 2737 | mở lượt đợt 132 |
| T5b, ~19:44Z (boot này, ~10' tuổi) | 2737 | cuối pha 1 đợt 132 |
| **T5, 20:48Z (boot này, ~1h14' tuổi)** | **2625** | **mở lượt đợt 133 (headroom-open.txt)** |
| **T5, 21:04Z (boot này, ~1h30' tuổi)** | **2623** | **cuối phiên T5 đợt 133 (headroom-end.txt)** |

- Headroom giảm 112 so với cuối pha 1 T5b đợt 132 (2737 → 2625 qua ~64
  phút, không qua reboot — giảm trong cùng boot, theo watch của luồng
  khác + file mở); giảm thêm 2 trong phiên (2625 → 2623). Chuỗi dài hạn:
  …2846 → 2844 → 2851 → 2849 → **2735 → 2735 → 2737 → 2737 → 2625 →
  2623**. Vẫn gấp ~1,7 lần số watch vite thường cần (~1586).
  **Vite thường chạy được trên boot này. Chưa tới ngưỡng báo user
  (< ~1.800) — chỉ theo dõi** (quyết parent §12(h) đợt 127). Còn cao
  hơn ngưỡng ~823.
- Trần 63747 vẫn đầy ở mức ~61k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 20:41Z (mở lượt) | 475 MB | lúc exec đầu (ram-open.txt) |
| 20:47Z | 1123 MB | lúc sửa script xong |
| 20:49:22Z (watcher poll 1) | 1469 MB | |
| 20:50:22Z (watcher poll 2, ghi cờ) | 1285 MB | |
| 20:50:45Z (T4 gate A mở) | 1168 MB | T4 poll #3 |
| 20:50:57Z | 805 MB | T4 attempt1 đang chạy |
| 20:52:07Z | 622 MB | |
| 20:59:13Z | 1574 MB | **cao nhất lượt** |
| 20:59:48Z | 1493 MB | |
| 21:04:29Z (cuối phiên) | 1218 MB | ram-end.txt |
| 21:06:42Z | 927 MB | lúc chờ cờ T4.done |

- RAM dao động **475–1574 MB** trong lượt (biên độ ~1,1 GB trong ~25
  phút); thấp nhất 475 MB (20:41Z) vẫn cao hơn 468 MB thấp nhất đợt 132
  (T5b) 7 MB và cao hơn kỷ lục thấp 461 MB (T5 đợt 131) 14 MB.
- **RAM ≥1024 MB xuất hiện nhiều lần** (1123 → 1469 → 1285 → 1168 →
  1574 → 1493 → 1218 MB) — cửa sổ vàng KHÔNG hiếm trên boot này. T4
  chớp được ngay poll #3 (20:50:45Z, RAM 1168 MB). Khác hẳn đợt 132
  (RAM kẹt 420–552 MB suốt ~90 phút trên 2 boot, 0 attempt).
- Swap đã dùng: không ghi riêng lượt này (T9 theo dõi RAM ghim — nhiệm vụ
  T9). Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
- T5 không hạ ngưỡng gate A, không can thiệp RAM.

## 5. Watcher — b84 v6 (WIDEN TRIGGER §8.2(B), dạng (A2) mới)

### 5.1 Quyết parent + điều kiện widen chính xác (do T5 viết)

- Quyết parent đợt 132 §12.3(b) (LIMITS gộp §12.3): "PHÊ DUYỆT WIDEN ĐIỀU
  KIỆN TRIGGER §8.2(B). … Widen: tính đầy đủ = đủ bộ gói đích, không chỉ
  'replay chạy đầy đủ' — khi replay đã xong (dpkg đóng băng, lists đủ) mà
  thiếu ít nhất 1 gói trong bộ đích thì trigger --repair 1 lần có giám sát
  (luật once-only giữ nguyên). T5 đợt 133 sửa watcher theo quyết này; điều
  kiện widen chính xác do T5 viết, không được trigger --repair bừa."
- **Điều kiện widen chính xác (v6, dạng (A2)):** C4=yes khi
  `installs>0` + `0 proc` (apt/apt-get/dpkg/wrapper) + `postboot FAIL` +
  **log poll của postboot-check ghi thiếu ≥1 gói đích** — một trong ba
  dòng: `FAIL apt: chưa cài:` (gói trong NEED 11 package của
  postboot-check.sh), `FAIL libs: thiếu:` (lib đích: libevent/libEGL/
  libavif/libdw/libevdev), `FAIL GST: thiếu` (plugin đích isomp4/libav).
  (A) cũ (GST<100 file) và (B) (dpkg ≤5 dòng + 0 install) giữ nguyên.
  TRIGGER=YES vẫn cần đủ C1–C5 (FAIL tươi + 0 proc + dpkg im ≥600 s +
  C4 + không probe) — widen chỉ thay C4, không nới C1/C2/C3/C5.
- **Về mệnh đề "lists đủ" trong quyết parent:** watcher KHÔNG kiểm lists
  riêng cho A2 — tín hiệu thiếu-gói-đích đọc từ log postboot đã đủ để
  phân biệt hình dạng cần bắt (b379ecd7: lists 39, candidate
  gstreamer1.0-gl có trong lists — xem §5.3) với dạng (B) (installs=0,
  lists ~5, không bao giờ tới A2 vì điều kiện installs>0). "Lists đủ"
  được kiểm ở bước kiểm chứng độc lập pre-repair (candidate phải
  resolvable qua `apt-cache policy` / có trong lists) trước khi chạy
  --repair — không giao cho watcher (truy vấn apt-cache mỗi poll vừa
  chậm vừa nhiễu). Ghi rõ để parent thấy mệnh đề này được thực thi ở
  đâu, không bị bỏ qua.
- **Watcher CHỈ ĐÁNH GIÁ và ghi TRIGGER — KHÔNG tự chạy --repair.**
  Repair 1 lần có giám sát chỉ chạy sau kiểm chứng độc lập 5/5 của agent
  (theo mẫu T5 đợt 132 §7.2), luật once-only giữ nguyên. Không có đường
  nào trong watcher tự kích hoạt apt install.
- **(A2) KHÔNG bắt FAIL chỉ do wrapper** (vd `FAIL wrapper: bản gốc` —
  wrapper bị revert không phải gói đích; agent xử lý tay nếu gặp — xem
  ca 4 §5.2). Đây là giới hạn có chủ ý, theo đúng quyết ("thiếu ≥1 gói
  trong bộ đích").

### 5.2 Kiểm chứng khô trong /tmp — 8 ca (trích ĐÚNG block C4 từ file watcher, không copy tay)

Harness `/tmp/t5v6-test/harness.sh`: trích block C4 từ file watcher thật
bằng awk (từ `MISS_TARGET=no` tới `else C4=no; FORM=-; fi`) rồi eval từng
ca với log poll tổng hợp (đúng format dòng FAIL của postboot-check.sh).

| # | Ca | installs | GST | PB | log poll | V6 FORM/C4 | Kỳ vọng |
|---|---|---|---|---|---|---|---|
| 1 | b379ecd7-shape | 222 | 268 | FAIL | `FAIL apt: chưa cài: gstreamer1.0-gl` | **A2/yes** | A2/yes |
| 2 | old-A-shape | 217 | 31 | FAIL | PASS apt (không thiếu) | **A/yes** | A/yes |
| 3 | form-B | 0 | 0 | FAIL | PASS apt | **B/yes** | B/yes |
| 4 | wrapper-only-FAIL | 221 | 269 | FAIL | `FAIL wrapper: bản gốc` | **-/no** | -/no |
| 5 | pass | 221 | 269 | PASS | PASS apt + PASS GST | **-/no** | -/no |
| 6 | missing-lib | 221 | 269 | FAIL | `FAIL libs: thiếu: libavif.so.16` | **A2/yes** | A2/yes |
| 7 | missing-gst-plugin | 221 | 269 | FAIL | `FAIL GST: thiếu isomp4=1 libav=0` | **A2/yes** | A2/yes |
| 8 | replay-alive | 180 | 200 | FAIL | `FAIL apt: chưa cài: gstreamer1.0-gl` | **-/no** | -/no (0 proc chưa đạt) |

- **8/8 ca đúng.** Ca 1 là hình dạng gây kẹt đợt 132 (GST=268, thiếu đúng
  1 gói) — v6 bắt được, v5 không (xem §5.3). Ca 4 chứng minh widen không
  trigger bừa trên FAIL không-phải-gói-đích. Ca 8 chứng minh guard 0 proc
  vẫn đứng (replay còn chạy thì C4=no dù log đã ghi thiếu gói).
- **Đối chiếu v5:** trích block C4 từ `t5-wait-replay-b81.sh` (v5) rồi eval
  ca 1 → **FORM=- C4=no** (đúng khoảng trống proxy đã ghi đợt 132 §7.2:
  GST=268 không <100 nên (A) cũ tính no; (B) cũng no vì installs=222).
  Khoảng trống đã đóng bằng A2.
- `bash -n` watcher b84 v6 OK trước khi chạy thật. Script pha 2
  `t5-c2-drawlog-analysis.py`: `py_compile` OK (copy từ round132-t5b/).

### 5.3 md5 + diff — chỉ đổi widen, không đổi logic khác

- Watcher: v5 (b81, đợt 132) md5 `6a04a3647e3957d644530f90de7f7af5` →
  v6 (b84, đợt 133) md5 `1946b2d05e2e70e468f071171d272c59` (ghi trong
  `watcher.md5.before` / `watcher.md5.after` tại round133-t5/).
- Diff sau chuẩn hoá (sed đổi round133-t5→round132-t5, b84→b81,
  btime 19:34:15Z→17:24:08Z, mốc dpkg cuối 19:36:48→17:35:39): **chỉ còn
  các đổi sau** — header (mô tả v6 + boot 07da9c50) + `WATCHER_START
  watcher=v6` + comment dạng (A2) + 3 dòng grep `MISS_TARGET` + nhánh
  `elif … FORM=A2` + dòng EVAL thêm `miss_target=$MISS_TARGET`. **KHÔNG
  đổi logic EVAL §8.2/luật (C)/ngưỡng poll/thời gian chờ nào khác.**
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn đọc
  "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột — tên gói ở
  $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi động lại watcher
  chỉ vì lỗi hiển thị.
- Nhãn log thẩm mỹ: dòng `FLAG_WRITTEN` trong b84 vẫn in chuỗi
  "(v5: overwrite, stale da archive neu co)" (kế thừa từ b81 — chỉ là
  chuỗi log, logic ghi đè là của v5/v6 như nhau). KHÔNG sửa sau khi chạy
  (md5 phải khớp đúng file đã chạy); sửa nhãn ở bản copy đợt sau.
- Nhánh archive cờ stale của v5 (§5.1 LIMITS T5 đợt 132): thư mục
  round133-t5/ MỚI nên watcher log `NO_FLAG_AT_START 20:49:22Z` — nhánh
  archive không kích hoạt trong lượt này (không có cờ stale trong thư
  mục); nhánh ghi đè chạy thật ở poll 2. Lần kích hoạt live duy nhất của
  nhánh archive vẫn là b83 đợt 132 (19:45:27Z).

### 5.4 Watcher b84 v6 chạy thật — 2 poll, ghi cờ, tự kết thúc

- Chạy 20:49:22–20:50:22Z (2 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. KHÔNG reboot trong lúc watcher chạy;
  boot_id không đổi suốt pha 1.
- **TRIGGER=NO cả 2 poll — ĐÚNG:** postboot đã PASS từ trước poll 1
  (điều kiện (1) FAIL tươi không đạt), replay đã xong, không có gì để
  repair. Widen A2 không kích hoạt trên boot này (không thiếu gói nào) —
  đúng thiết kế: widen chỉ đổi C4 khi FAIL + thiếu gói đích, không đổi
  hành vi khi PASS.
- Không có kiểm chứng độc lập pre-repair nào — vì không repair (không cần).

## 6. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL (b84 v6, rút gọn)

> Quyết parent đợt 125 §12(b): §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm
> mà không cài"; ngưỡng chờ dạng (B) dpkg im ≥10 phút (thay vì 15);
> luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg đóng băng; hiệu lực
> từ đợt 126. Luật (C) (quyết parent đợt 122 §12.4): đủ 5 điều kiện
> mới kill tiến trình kẹt rồi chạy --repair một lần có giám sát.

| Watcher | Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| b84 | 1 | 20:49:22Z | 4354 s | no (exit 0) | yes | - (no) | **NO** |
| b84 | 2 | 20:50:22Z | 4414 s | no (exit 0) | yes | - (no) | **NO** |

- **TRIGGER=NO cả 2 poll — ĐÚNG:** postboot đã PASS, không có gì để
  repair. **--repair: KHÔNG CHẠY (không cần).**
- **Luật (C): KHÔNG KÍCH HOẠT** — 0 apt/dpkg đang chạy (không có process
  để nghi kẹt), dpkg đóng băng vì replay đã xong từ đợt 132, không phải
  vì kẹt.
- **Khoảng trống proxy C4 dạng (A) (T5 đợt 132 §7.2): ĐÃ ĐÓNG bằng widen
  v6 (A2)** — kiểm chứng khô 8/8 ca (§5.2). Trên boot này khoảng trống
  không kích hoạt (không thiếu gói nào) — widen chờ boot sau gặp lại
  hình dạng "replay đầy đủ nhưng thiếu 1 gói GST" để chứng minh live.
  Ghi rõ: **nhánh A2 chưa từng kích hoạt live** (chỉ kiểm chứng khô) —
  không tuyên bố đã chứng minh live.

## 7. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (boot hiện tại, ~20:47Z): md5 `0d412c35…` → `55f6b3df…` (ghi
  trong `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn đợt 133 (cùng boot 07da9c50, chưa reboot lúc mở;
  replay đã xong từ đợt 132 — 1545 dòng / 221 installs, GST 269 file,
  gstreamer1.0-gl đã cài bởi replay; watcher b84 v6 xác nhận lại PASS +
  ghi cờ gate-visible vào round133-t5/; **widen trigger nằm trong WATCHER
  b84, KHÔNG nằm trong script này**) + dòng `say` cập nhật tương ứng.
  Dòng `say` mới không chứa ký tự `"` (dùng `m`/`s` thay dấu phút/giây)
  — không lặp sự cố đợt 120. `bash -n` OK.
- Kiểm chứng: sau khi sửa lần 1, postboot vẫn PASS exit 0 (poll0 ~20:48Z)
  — logic không đổi đã được xác nhận bằng chạy thật; watcher b84 dùng
  cùng script này PASS exit 0 ở cả 2 poll + final confirm 21:04Z.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên. (--repair KHÔNG chạy trên boot này.)

## 8. PHA 2 — Phân tích log draw cho (c2) lượt yên #10 — XONG (attempt1 là attempt duy nhất)

### 8.0 Dữ liệu đầu vào (đủ trigger pha 2)

- T4 attempt1: 20/20 pass, exit 0, 20:50:45–20:52:10Z; JSON
  `round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json` (3.274.496 B,
  md5 `338739bf…`, sha256 `e3ca1ac5…` theo cờ T4.done).
- Cờ `round133-t4.done` 21:10Z (dòng đầu: "đo xong, 1 attempt, median
  39,5 ms, ngưỡng GIỮ, log draw 0/5"). T4 KHÔNG chạy attempt2 — theo
  thiết kế `poll-wait-t4-133.sh` (chạy attempt1 rồi exit 0; verdict do
  LIMITS quyết) + quyết T4 có căn cứ (xem §8.6). **Attempt1 là dữ liệu
  cuối cùng của lượt #10 đợt 133 — pha 2 phân tích trên attempt1.**
- Labellag T4: `analyze-t4-attempt1-labellag.txt` (2923 B, 20:54:18Z);
  coverage T4: `analyze-t4-attempt1-c2coverage.txt` +
  `coverage-check-attempt1.txt` (20:54:34Z); c2drawlog T4:
  `analyze-t4-attempt1-c2drawlog.txt` (20:54:11Z); histogram T4:
  `t4-histogram-with9.txt` (20:58:46Z — lưu ý: file này CHỈ chứa
  histogram lượt #9 (T4-131 a1), xem §8.5; histogram #10 của T4 nằm
  trong LIMITS T4 §5.2 + file `t4-histogram-with10.py`).
- Script pha 2: `t5-c2-drawlog-analysis.py` (round133-t5/, copy từ
  round132-t5b/, py_compile OK — KHÔNG sửa). Chạy chính thức:
  `t5-c2-drawlog-analysis.txt` (exit 0) — **byte-identical với bản chạy
  sơ bộ `t5-c2-attempt1-prelim.txt`** (chạy lúc T4 chưa có cờ .done, trên
  cùng JSON + labellag cuối cùng — JSON mtime 20:52:10Z không đổi sau
  đó). Labellag chạy lại độc lập bằng code T4:
  `t5-labellag-rerun.txt` **byte-identical** với file của T4.
- Prereg áp dụng: T3 đợt 132 `prereg-t3.md` (P1/P2/P3/P4/P5/P6/P7 +
  bổ sung A1 sửa P3: chỉ tính đóng băng-tại-tick, bỏ mệnh đề nhảy
  ≥100 ms) + quy tắc verdict §4. T5 KHÔNG tự đổi prereg.
- Không chạy lượt đo E4 hay TTS nào cho pha 2 (theo quyết parent).

### 8.1 Kết quả A — Cửa sổ log draw vs cửa sổ đo + coverage (c2)

- drawlog: n=137, wallMs 9854 → 16068 (span 6214 ms); flip wallMs=26187;
  post window tBlend ≥ 28187 (seq 145→520, tBlend 28235→75672).
- **drawlog max (16068) vs flip (26187): log dừng TRƯỚC flip 10.119 ms;**
  vs post-window start (28187): −12.119 ms.
- Epochs: **1 epoch duy nhất** (n=137, loopNo=[1, 2], wallMs 9854→16068)
  — KHÔNG có epoch nào sau re-arm (7 lần re-arm đều vet +0 entry).
- COVERED (±500 ms của tBlend, định nghĩa T4):
  - seq 166 tBlend=31128, log gần nhất 16068 (delta −15.060 ms) → KHÔNG PHU
  - seq 218 tBlend=37899, log gần nhất 16068 (delta −21.831 ms) → KHÔNG PHU
  - seq 293 tBlend=47380, log gần nhất 16068 (delta −31.312 ms) → KHÔNG PHU
  - seq 323 tBlend=51263, log gần nhất 16068 (delta −35.195 ms) → KHÔNG PHU
  - seq 394 tBlend=60292, log gần nhất 16068 (delta −44.224 ms) → KHÔNG PHU
- **TỔNG: (c2) trong cửa sổ log: 0/5. blendTick hậu-flip trong ±500 ms
  của log: 0/376 (0,0%).** Khớp đúng coverage-check của T4 (0/5, 0/376).

### 8.2 Kết quả B — Phân tích nội bộ log draw (chỉ pre-flip — xem giới hạn §8.6)

- B1. drawSrc+rawUnit: floor(ct×30)−frameIdx ∈ {−1: 90, 0: 47} — **không
  entry nào ≥+1** (không có drawSrc trễ sau ct trong cửa sổ pre-flip).
  Chỉ drawSrc (n=70): {−1: 45, 0: 25}; chỉ rawUnit (n=67): {−1: 45, 0: 22}.
- B2. Cặp drawSrc→rawUnit: rawUnit.frameIdx − drawSrcGầnNhất.frameIdx =
  **0 trong cả 67/67 cặp** (rawUnit luôn vẽ đúng frame với drawSrc gần
  nhất — khớp dự báo P7 về cặp, nhưng ở cửa sổ pre-flip).
- B3. loop 1: drawSrc n=34, frameIdx 0→68, lặp frame=9, nhảy >1 frame=19,
  lui frame=0. loop 2: drawSrc n=36, frameIdx 0→65, lặp frame=12, nhảy
  >1 frame=18, lui frame=0.
- B4. Wrap (frameIdx giảm): **1 lần** — idx 65→66: drawSrc f68 ct=2,267
  wallMs=13000 loop=1 → drawSrc f0 ct=0,000 wallMs=13153 loop=2.
- B5. Khoảng cách drawSrc liên tiếp: n=69, median **75,0 ms**, min 41,0,
  max 458,0; >33 ms: 69/69; >66 ms: 51/69. **Log thưa** (cùng caveat T5
  đợt 131 §8.4 B5): không phân giải được lệch 33 ms = 1 frame — kết luận
  "không trễ" chỉ có giá trị ở độ phân giải ~100 ms (ghi theo prereg T3
  §3 P7).

### 8.3 Kết quả B-P7 — Phép thử desync: KHÔNG KIỂM ĐƯỢC

- **KHÔNG CÓ seq (c2) nào được phủ — P7 KHÔNG KIỂM ĐƯỢC (theo quy tắc
  T3).** Không có cặp (log entry, event c2) nào để đối chiếu drawSrc trễ
  ≥1f hay không. Ghi đúng câu prereg T3 §3 P7: **"KHÔNG KIỂM ĐƯỢC — thiết
  kế log chưa đạt quyết parent §12.3(a)"**, không suy luận thay, không
  tính ĐÚNG/SAI cho P7.
- Dữ liệu B (§8.2: không trễ trong cửa sổ pre-flip) KHÔNG được dùng làm
  bằng chứng P7 — cửa sổ pre-flip không chứa seq (c2) nào (mọi (c2) đều
  ở tBlend ≥31 s, tức loop ~10–26 của video 3 s). Ghi rõ để tránh đọc sai.

### 8.4 Kết quả C — (c2) ↔ curPix run + ghost freeze + skew

- curPix run ≥3 tick: **12 run**, tổng 60 tick trong run / 376 tick post.
  Runs: (160,165,6), (186,190,5), (215,218,4), (236,240,5), (288,293,6),
  (316,323,8), (344,346,3), (364,367,4), (391,394,4), (416,422,7),
  (445,449,5), (473,475,3).
- **P1 — (c2) gắn run-end:** seq 166 dist=1; 218 dist=0; 293 dist=0; 323
  dist=0; 394 dist=0 → **5/5 trong ±1 tick run-end** (kỳ vọng nếu ngẫu
  nhiên: 0,5). Đối chứng: 36/376 tick post (9,6%) nằm trong ±1 tick
  run-end. p nhị thức P(X≥5 | n=5, p=0,096) ≈ **8,2e-6 < 0,01**; ≥2/3
  đạt → **P1 ĐÚNG** (theo prereg §4; hiệu chuẩn lượt #9: 9/9, p ~3e-7).
  Run-end là (c2): 4/12 run-end ([218, 293, 323, 394]); độ dài run kết
  thúc tại (c2): [4, 4, 6, 8]; độ dài run TB 5,0, max 8.
- **P3 (A1 — chỉ đóng băng-tại-tick):** cả 5 seq đều ĐÓNG BANG-tại-tick
  (labelMs occ0 == tick trước: 29781, 36561, 46285, 49766, 59394) →
  **5/5**; tick bắt kịp (nhảy ≥100 ms, ghi riêng theo A1): 0. Đối chứng:
  76/375 tick post (20,3%) có labelMs occ0 đóng băng so với tick trước.
  p nhị thức P(X≥5 | n=5, p=0,203) ≈ **3,4e-4 < 0,01**; ≥2/3 đạt →
  **P3 ĐÚNG** (theo prereg §4 + bổ sung A1; hiệu chuẩn lượt #9: 9/9,
  baseline đóng băng-tại-tick 22,9%).
- Skew: snapMs−labelMs median **35,0 ms** (n=376); rawMs−labelMs median
  **8,0 ms** (n=376).
- label-floor: script pha 2 của T5 in `{}` — **giới hạn của script T5,
  không phải dữ liệu thiếu**: script tìm khóa `label` trong ghostPix,
  nhưng ghostPix chỉ có `labelCt` (float) + `labelMs` + `labelSrc` (đã
  kiểm tra trực tiếp entry ghostPix[200]). Số label-floor đúng lấy từ
  code T3 (§8.5): {1: 575, 0: 177} — xem P5 dưới đây.

### 8.5 Kết quả D — Histogram #10 (tái kiểm bằng code T3) + P2/P4/P5/P6

- Histogram #10 chạy lại bằng `analyze()` của T3
  (`round132-t3/c2-histogram-9runs.py`, import — KHÔNG sửa script T3;
  driver `t5-histogram-10.py`, output `t5-histogram-rerun.txt`):
  nTicks post 376, nGhost **752**, nomatch 0; hist (pixFrame−label):
  {−9: 2, −3: 4, −1: 69, 0: 259, +1: 203, +2: 190, +3: 23, +4: 2};
  bin 0: **34,4%**; +1: 27,0%; +2: 25,3%; **+1/+2: 52,3%**; +3: 3,1%;
  +4: 0,3%; ≥3: 3,3%; <0: 10,0%; snapMs−labelMs median 35 ms (mean 38,8,
  min 26, max 81, p90 54); rawMs−labelMs median 8 ms (mean 11,0, p90 21);
  label−floor(labelCt*30): **{1: 575, 0: 177}**; curPix run ≥3 tick: 12
  run (y hệt §8.4 — chéo kiểm đúng).
- **Khớp đúng histogram #10 của T4** (LIMITS T4 §5.2, tính bằng
  `t4-histogram-with10.py`): cùng hist, cùng snap/raw median, cùng
  label-floor, cùng 12 run. Hai code độc lập (T3 vs T4) cho cùng số trên
  cùng JSON — tái kiểm chéo đạt.
- Lưu ý: file `t4-histogram-with9.txt` của T4 (20:58:46Z) CHỈ chứa
  histogram lượt #9 (RUNS trong `t4-histogram-with9.py` hardcode chỉ
  #9) — không phải histogram #10; đừng đọc nhầm file đó làm số #10.
  So với #9 (bin 0: 33,8%, +1/+2: 43,1%, +3: 13,0%, snap median 44 ms):
  #10 có +1/+2 tăng 9,2 điểm, +3 giảm 9,9 điểm, snap median giảm 9 ms.
- **P2 — Dấu của (c2) luôn dương:** (c2) n=5, **đều lag +1f (33 ms)**,
  0 lag âm → **P2 ĐÚNG** (hiệu chuẩn: 8 lượt trước mọi (c2) đều lag +).
- **P4 — Số lượng (c2):** thuần +1f: **5** (dải 2–8 ✓); tổng (c2) skp=0:
  **5** (dải 2–12 ✓); (c2) skp=1: **0** ✓; occurrence lag ≥+5f: **0** ✓
  → **P4 ĐÚNG**.
- **P5 — Số phụ skew:** snapMs−labelMs median 35 ms (dải 34–48 ✓);
  rawMs−labelMs median 8 ms (dải 8–10 ✓); label−floor +1: 575/752 =
  **76,5%** (dải 63–76% — **ngoài sát nút +0,5pp**); curPix run ≥3 tick:
  **12** (dải 13–22 — **ngoài sát nút −1**). Theo prereg §4: ngoài dải
  thì ghi rõ, không tự bác mô hình → **P5: 2/4 trong dải, 2 ngoài sát
  nút — ghi nhận, không bác mô hình.**
- **P6 — Phân phối histogram (khoảng thực nghiệm, KHÔNG verdict):**
  +1/+2: 52,3% (khoảng 33–53% ✓ — cao nhất từ trước nhưng vẫn trong
  khoảng); +3: 3,1% (khoảng 3–19% ✓ — thấp nhất từ trước); bin 0: 34,4%
  (khoảng 33–39% ✓) → **"phù hợp dữ liệu 8 lượt trước"**. Ghi chú khám
  phá T5 đợt 131 §8.6 (median ≥54 ms thì báo cáo riêng): median lượt #10
  là 39,5 ms < 54 ms → **không kích hoạt báo cáo riêng**.
- **Verdict tổng (prereg T3 §4): P1 ĐÚNG + P3 ĐÚNG + P2 ĐÚNG → mô hình
  ghost-freeze/skew "ĐƯỢC CỦNG CỐ".** Không dùng kết quả lượt #10 để đổi
  ngưỡng ≤60 ms, bar hay DEF — chỉ ghi verdict + nợ mở (T4 đã giữ ngưỡng
  theo LIMITS T4).

### 8.6 Vì sao không có attempt2 — T4 quyết, T5 xác nhận từ dữ liệu

- T4 kiểm cửa sổ log NGAY sau attempt đầu (theo quyết parent đợt 131) và
  kết luận KHÔNG chạy attempt2 (LIMITS T4 §6.4): (a) 7 lần toggle ở 7 mốc
  pass khác nhau đều vet +0 — đổi mốc toggle không làm logger ghi lại khi
  loop-gate chặn mọi loop >2; (b) sửa duy nhất có khả năng hiệu quả là sửa
  `preview.tsx` (nới loop-gate) — thay đổi production giữa lượt đo, cần
  quyết parent + T3; (c) attempt2 chỉ lặp lại 0/N coverage + lặp lại phép
  đo ngưỡng (39,5 ms đã rõ ràng, biên 20,5 ms).
- Nguyên nhân gốc (T4 LIMITS §6.2–6.3, T5 xác nhận từ JSON + code):
  loop-gate `preview.tsx:705`
  (`if (c2DrawLogLoopNo < 1 || c2DrawLogLoopNo > 2) return;`) chỉ ghi
  loop 1–2; các event (c2) ở tBlend 31–79 s (loop ~10–26 của video 3 s)
  **không bao giờ** có thể nằm trong cửa sổ log này. Re-enable xóa mảng
  (dòng 700) + `c2DrawLogLoopNo` reset về 0 — chỉ có vet-trước-toggle của
  probe mới giữ được 137 entry cũ. Sau pass 2 video không wrap thêm lần
  nào trong lúc đo (không entry mới dù đã toggle 7 lần) — draw callback
  ngừng bắn sau wallMs 16068 (ct 2,267 s, giữa loop 2).
- T5 KHÔNG tự sửa instrumentation (đó là thay đổi production, cần quyết
  parent + T3 — xem §10 mục 1). Re-arm của probe đợt 132 giả định "toggle
  cờ sẽ cho log ghi lại 2 pass tiếp theo" — **giả định này bị bác bỏ bởi
  dữ liệu + code**.
- Ghi nhận thêm (T4 LIMITS §7, T5 đã kiểm lại từ đĩa): runner
  `run-attempt-133.sh` có mẫu grep COV sai (`'[0-9]+/[0-9]+ \(c2\) covered'`
  không khớp dòng thực tế `TONG: (c2) trong cua so log: 0/5`) nên biến COV
  rỗng, marker `COVERAGE-0` không được tạo, runner exit 0 theo probe RC.
  **Coverage đã xác minh thủ công từ file** (0/5) — verdict không đổi.
  T4 đã sửa mẫu grep trong script thành
  `TONG: \(c2\) trong cua so log: [0-9]+/[0-9]+` để dùng lại đợt sau
  (việc của T4, T5 chỉ ghi nhận — không sửa script của luồng khác).

## 9. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Đợt 133 là đợt ĐẦU TIÊN sau 6 reboot liên tiếp mà KHÔNG có reboot giữa
  lượt (boot 07da9c50 sống qua cả lượt mở + đóng) — R9 (a) không kích
  hoạt đợt này vì không có reboot để bắt, nhưng giá trị của nó không đổi:
  nếu reboot rơi vào khoảng giữa đợt đóng / lượt mở / giữa lượt thì vẫn
  cần watcher bắt boot mới. Vá §8.4(ii) + cờ gắn boot_id + watcher v5/v6
  xóa cờ stale đã giảm thiệt hại, nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 10. Nợ mở sang đợt sau

1. **Sửa instrumentation log draw (`preview.tsx`, cần quyết parent +
   T3 — việc đợt 134):** nới loop-gate dòng 705 (hoặc thêm cờ runtime
   chọn số loop tối đa) + xem lại reset mảng khi re-enable (dòng 700);
   ghi rõ md5 trước/sau + revert sau khi đo. **Không có sửa này thì mọi
   lượt yên sau vẫn 0/N coverage cho (c2) hậu-flip** (T4 LIMITS §10).
   T5 đợt 133 KHÔNG tự sửa (thay đổi production giữa lượt đo, cần quyết
   parent + T3).
2. **T3 bước 2 (prereg đợt 132 đứng nguyên):** T3 dùng verdict pha 2 này
   (P1/P3 ĐÚNG, P2 ĐÚNG, P7 KHÔNG KIỂM ĐƯỢC, mô hình ĐƯỢC CỦNG CỐ) +
   histogram #10 + dữ liệu attempt1 để chốt bước 2. T5 không làm thay
   bước 2 của T3.
3. **Nhánh A2 của watcher v6 chưa kích hoạt live** (§6): chỉ kiểm chứng
   khô 8/8 ca. Boot sau gặp lại hình dạng "replay đầy đủ nhưng thiếu 1
   gói GST" sẽ là lần chứng minh live đầu tiên — T5 đợt sau ghi rõ
   TRIGGER có YES không + kiểm chứng độc lập 5/5 trước repair.
4. **Boot 07da9c50 đang sống + PASS** (replay 1545/221 + gstreamer1.0-gl
   có sẵn, KHÔNG repair; cờ gate-visible round133-t5/ PASS 20:50:22Z).
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20, #69?
   ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s, #73? 1h24m28s–
   1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–1h48m41s (chết GIỮA
   LUỘT), #76? 59m53s–1h54m19s, #77? 2h05m45s–2h06m10s (chết GIỮA
   LUỘT), #78? 1h12m53s–1h24m00s (chết GIỮA ĐÓNG/MỞ), f868abad
   33m25s–34m49s (chết GIỮA LUỘT), ad1327ef 1h05m30s–2h22m38s (chết
   GIỮA ĐÓNG/MỞ), b379ecd7 2h09m48s–2h10m07s (chết GIỮA LUỘT), **boot
   07da9c50 sống ≥1h37m tới lúc T5 đóng (chưa chết)**. Nếu boot này chết
   sớm như #69? (~19–20') hoặc #72? (54m08s) thì T5 đợt sau phải làm lại
   từ đầu (watcher v6 đã sẵn, chỉ đổi btime/mốc).
5. **Số thứ tự boot TẠM — chờ T6 chốt mù #37 đợt 133** (quyết parent đợt
   130 §12.3(h)). Ghi nhận thêm: T2 probe #52 đợt 133 gọi boot này là
   **#82?** (log v2 145→148, probe 20:42:56Z) — T6 là đầu mối chốt số
   chính thức; nếu T6 đếm khác, LIMITS này + script postboot-check
   cần sửa lại số — boot_id + btime không đổi.
6. **Baseline replay KHÔNG còn giá trị tuyệt đối** (§3.1): 1509/217 →
   1551/222 → 1545/221 trong 3 boot liên tiếp. Tiêu chí PASS là postboot
   exit 0 + GST đủ + apt đủ 11 package, không phải số dòng/installs.
7. **Lists boot này 37 file** — ít hơn b379ecd7 sau repair (75 file /
   68 noble, 2 mirror) và f868abad (71/68). Postboot PASS đủ 11/11 nên
   chức năng đủ; theo dõi ở boot sau.
8. **Headroom tiếp tục giảm dài hạn:** …2846 → 2844 → 2851 → 2849 →
   **2735 → 2735 → 2737 → 2737 → 2625 → 2623** (boot này). Trần 63747
   cần can thiệp host — ngoài tầm luồng này. Ngưỡng báo user < ~1.800
   chưa tới (còn ~823).
9. **RAM thấp kéo dài KHÔNG còn là nút thắt đợt này** (cửa sổ vàng
   ≥1024 MB xuất hiện nhiều lần; T4 chớp được ngay poll #3) — nhưng RAM
   vẫn dao động mạnh 475–1574 MB; T9 theo dõi RAM ghim (nhiệm vụ T9).
   Ngưỡng gate A ≥1024 MB GIỮ theo quyết parent §12.3(a).
10. **R9 (a) vẫn chờ user (nhắc lần 16).**
11. **Cooldown file tích lũy (76 file / 1064 B, không đổi trong lượt)**
    — luật prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune
    là của T6.
12. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 132 §11 + quyết
    parent §12.3: mù #51 B mở + mù #52 mới (việc T2 — đã bỏ kiểm lại mù
    #49 B thường lệ theo quyết parent); G1 chờ user quyết; birefnet
    (chỉ thử lại khi quan sát được available ≥ 6 GB, u2net là fallback
    chính thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại;
    release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 11. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI (md5 `805409f0`, y hệt T5/T5b đợt 130/131/132
  sau instrumentation (c2)); `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần (tham chiếu
  boot trong header + dòng `say`; md5 `0d412c35…` → `55f6b3df…`; không
  đổi logic).
- Watcher `t5-wait-replay-b84.sh` (v6, trong hidden_files — KHÔNG stage):
  widen C4 dạng (A2); md5 v5 (b81) `6a04a364…` → v6 (b84) `1946b2d0…`;
  `bash -n` OK; kiểm chứng khô /tmp 8/8 ca + đối chiếu v5.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa) OK; watcher b84 v6 OK.
- `tsc` / `vite build`: KHÔNG chạy (không sửa production; tsc đã exit 0
  trên boot này theo entry T4 đợt 132 — kiểm sau).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng 475–1574
  MB < 6 GB).
- O8: KHÔNG thuộc T5 (T8 gate bằng cờ này — cờ boot hiện tại đã đúng ở
  round133-t5/).
- Postboot boot hiện tại: PASS 4/4 (poll0 + watcher poll 1–2 + final
  confirm) — 0 lần FAIL. Watcher b84: 2 poll, tự kết thúc
  `done_pass_stable_2polls`, exit 0. **Reboot GIỮA LUỘT T5: KHÔNG**
  (boot_id không đổi suốt 20:39–21:11Z).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=NO cả 2 poll
  (b84)** — postboot đã PASS, không có gì để repair. **--repair: KHÔNG
  CHẠY (không cần).** **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT**
  (0 apt/dpkg đang chạy).
- **Widen trigger: KIỂM CHỨNG KHÔ 8/8 ca + đối chiếu v5** (xem §5.2);
  nhánh A2 chưa kích hoạt live (xem §6).
- Headroom: 2625 (mở) → 2623 (cuối phiên).
- RAM thấp nhất lượt: 475 MB (20:41Z); cao nhất 1574 MB (20:59:13Z).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  76 file / 1064 B, không đổi trong lượt).
- **Pha 2 (c2): XONG — P1 ĐÚNG (5/5, p≈8,2e-6), P2 ĐÚNG (0 lag âm),
  P3 ĐÚNG (A1, 5/5, p≈3,4e-4), P4 ĐÚNG, P5 2/4 trong dải (2 ngoài sát
  nút), P6 trong khoảng, P7 KHÔNG KIỂM ĐƯỢC (0/5 covered). Verdict tổng:
  mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ.** Labellag chạy lại độc lập
  byte-identical; histogram #10 chạy lại bằng code T3 khớp đúng số của
  T4; script pha 2 chạy chính thức byte-identical với bản sơ bộ.
- **Watcher v6 nhánh archive: KHÔNG kích hoạt trong lượt này**
  (thư mục mới, `NO_FLAG_AT_START`); nhánh ghi đè chạy thật ở poll 2
  (20:50:22Z). Lần kích hoạt live duy nhất của nhánh archive vẫn là b83
  đợt 132 (19:45:27Z).

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần: tham chiếu
  boot trong header + dòng `say`; md5 `0d412c35…` → `55f6b3df…`; không
  đổi logic).
- `docs/PHASE9_ROUND133_T5_INFRA_LIMITS.md` (file này — mới; pha 1 +
  pha 2 xong).
- Harness trong hidden_files (KHÔNG stage): `round133-t5/` (log watcher
  b84 v6 (2 poll) + log postboot poll0/final (boot hiện tại), md5
  trước/sau của postboot-check + watcher, log headroom mở/cuối
  (2625/2623), log RAM mở/cuối (475/1218 MB), `POSTBOOT_PASS` (cờ
  gate-visible — boot hiện tại, PASS 20:50:22Z), `t5-initial-state.md`,
  `t5-wait-replay-b84.sh` (v6) + `t5-wait-replay-b84.log` + `.nohup.log`,
  `t5-postboot-b84-poll*.log` (2 file), `t5-c2-drawlog-analysis.py`
  (py_compile OK), `t5-c2-drawlog-analysis.txt` (pha 2 chính thức,
  byte-identical với `t5-c2-attempt1-prelim.txt`),
  `t5-labellag-rerun.txt` (byte-identical với labellag T4),
  `t5-histogram-10.py` + `t5-histogram-rerun.txt` (histogram #10 bằng
  code T3, khớp số T4)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round133-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round133-t5.done` (ghi rõ CẢ 3 PHẦN XONG:
  widen v6 + postboot PASS + pha 2 verdict).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Pha 2 (c2) — chạy lại phân tích log draw (JSON + labellag của T4):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round133-t5/t5-c2-drawlog-analysis.py <json-t4> <labellag-t4.txt> <out.txt>
# Histogram #10 bằng code T3 (không sửa script T3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round133-t5/t5-histogram-10.py
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```
