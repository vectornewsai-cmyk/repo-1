# PHASE9_ROUND127_T5_INFRA_LIMITS — Hai boot trong một lượt: #72? CHẾT dạng (A) sau khi §8.2 đủ 5/5, repair bị reboot giết; #73? replay KHỎE, PASS +5m51s — chẩn đoán event lag + (c2): lệch nhãn là sai số lấy mẫu của instrumentation, renderer khỏe

> Luồng T5, đợt 127, lượt cron 09:35 +07 17/11/2026 (bắt đầu ~02:40Z trên
> boot #72?, kết thúc ~03:12Z trên boot #73? — cell reboot giữa lượt).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: quyết parent đợt 126 §12 (g) — T5 chẩn đoán event lag ≥+5f mới
> (seq 276–279, frame 27, lag tới +10f) + (c2) lệch nhãn +1f tái hiện
> lần thứ 3; luật §8.2 dạng (B) ngưỡng 10' (đánh giá mỗi poll);
> R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #72? CHẾT dạng (A), KHÔNG có cờ PASS.** btime 02:10:17Z,
   boot_id `81464315-ba1a-460d-b370-92a1673accc1`, sau #71? 2h44'36".
   Replay khởi động MUỘN (+25m22s) rồi CHẾT giữa chừng: update xong
   nhưng lists `noble` gốc KHÔNG VỀ (8 file kẹt ở partial/), chỉ 48
   installs, gói cuối gstreamer1.0-tools 02:48:06Z, wrapper chết,
   0 apt/dpkg sau đó. Luật §8.2 dạng (A) "tới nhưng thiếu GST" ĐỦ
   5/5 lúc 03:03:30Z (dpkg im 924s ≥ 15p theo cách đọc chặt); T5
   kiểm chứng độc lập 5/5 tươi lúc 03:04:31Z rồi chạy `--repair`
   1 lần — repair làm xong bước symlink GST thì CELL REBOOT giết
   cả repair lẫn watcher (boot #72? chết 54m08s). **Cờ
   POSTBOOT_PASS KHÔNG BAO GIỜ được viết cho #72?.**
2. **Boot #73? (MỚI, sau reboot) replay KHỎE, PASS +5m51s.**
   btime 03:04:25Z, boot_id `5e522260-235e-4394-a888-bce604728204`,
   sau #72? ≈54m08s. Configure +38s, installs xong +4m57s (dpkg
   1509 dòng, 217 installs, gói cuối gstreamer1.0-tools 03:09:22Z);
   2 gói từng thiếu ở #65? (libav, plugins-bad) ĐỀU ĐƯỢC CÀI.
   Postboot try1 PASS exit 0 lúc 03:10:16Z (+5m51s); watcher v4
   xác nhận 2 poll PASS liên tiếp, **cờ `POSTBOOT_PASS` cho #73?
   đã viết 03:11:16Z (đúng boot_id)** — T3/T9 gate bằng cờ này;
   cờ đợt 126 (#71?) STALE, không dùng được.
3. **Luật §8.2 dạng (B) ngưỡng 10': đánh giá ở MỖI poll trên cả 2
   boot, KHÔNG kích hoạt sai.** Trên #72?: TRIGGER=NO mọi poll
   trong lúc replay còn sống (c2a=no chặn) và 3 poll đầu sau khi
   replay chết (chưa đủ ngưỡng chờ); TRIGGER=YES từ poll 4 v3
   (02:58:29Z) theo ngưỡng 10p nhưng T5 CHỜ tới 15p (poll 9,
   03:03:30Z) theo cách đọc chặt cho dạng (A) rồi mới repair.
   Trên #73? (replay khỏe + postboot PASS): TRIGGER=NO mọi poll
   (c1=no, c4=no). Luật (C): đánh giá mỗi poll, KHÔNG kích hoạt
   (apt đã chết, không phải kẹt-sống).
4. **Chẩn đoán event lag (seq 276–279, frame 27, lag tới +10f):
   RENDERER KHỎE — lệch nằm ở instrumentation, không phải hồi quy
   sản phẩm.** presented == expected == floor(ct×30) ở mọi tick
   event; currentTime tiến ~real-time; nhãn ghost bám sát ct.
   Pixel strip (curPix + ghostPix) ĐÔNG CỨNG ở đúng pixels frame 27
   (Hamming 0, frame gần nhất sau đó cách 7 bit) trong 6 tick liên
   tiếp (275–280, ~414 ms) trong khi nhãn tiến 17→30. Nguồn strip
   là canvas rawUnit (srcKind="canvas" 740/740 ghost) — ring chỉ
   mang pix cũ đi tiếp, không phải thủ phạm. Chi tiết + dữ liệu cần
   thêm: xem §8.
5. **(c2) lệch nhãn +1f: GIẢI THÍCH ĐƯỢC — sai số lấy mẫu của
   instrumentation, không phải lỗi render.** Nhãn ghost được gán
   lúc đọc currentTime (labelMs); pixels được lấy mẫu ở snapshot
   muộn hơn (snapMs−labelMs: median 38 ms, p90 63 ms ≈ 1,1 frame
   ở 30 fps); nhãn = floor(labelCt×30) hoặc +1 (504/740 là +1).
   Phân phối (pixFrame−label) trên 740 ghost: 0: 265, +1: 175,
   +2: 175, −1: 57 — lệch +1/+2 là TRẠNG THÁI THƯỜNG, không phải
   ngoại lệ. (c) chỉ "bắn" ở frame 12–15 vì presented đứng yên ở
   đó sau loop-seek (stall), để pix +1 trùng presented. Xem §8.
6. **Headroom inotify: 3317 (mở #73?) → 3315 (cuối)** — gần như
   đứng yên; vẫn ~2,1 lần số watch vite thường cần (~1586); CHƯA
   tới ngưỡng báo user (< ~1.800), chỉ theo dõi.
7. **RAM khả dụng dao động mạnh:** #72?: 547–2551 MB (thấp nhất
   547 MB lúc 02:40Z — thấp nhất T5 từng ghi, dưới kỷ lục cũ 834
   MB); #73?: 1098–1551 MB. Dù lấy số nào cũng < 6 GB guard —
   birefnet không thử.
8. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI
   lúc mở (#72?) lẫn lúc cuối (#73?). Queue cooldown 62 → 63 file
   (+1). T5 KHÔNG đụng lock/queue.
9. **R9 (a) vẫn chờ user — nhắc lần 13.**
10. **Sửa `postboot-check.sh` 2 lần trong lượt** (md5
    `e986ec78…` → `bf1ee570…` (#72?) → `c9e2f827…` (#73?)): chỉ
    đổi tham chiếu boot; `bash -n` OK cả 2 lần; try1 sau sửa #73?
    PASS ngay lần đầu.

## 2. Boot #72? — replay muộn, chết dạng (A), repair bị reboot giết

### 2.1 Boot #72? — btime 02:10:17Z, gap 2h44'36"

- Boot #72?: 2026-11-17 02:10:17Z (btime kernel 1794881417;
  `uptime -s` đồng ý; journal first entry 02:10:29Z, chênh +12 s —
  cùng mẫu các boot trước; boot_id
  `81464315-ba1a-460d-b370-92a1673accc1`, sau #71? 23:25:41Z 16/11
  (gap 2h44'36"). `journalctl --list-boots` CHỈ CÒN 1 boot (hiện
  tại); `last -x` chỉ còn 1 dòng reboot 02:10Z.
- Số thứ tự #72? TẠM — chờ T6 đếm lại mù #37 (như mọi boot gần đây).
- Chết ~03:04:2x–03:04:3xZ (tuổi ≈54m08s; btime boot mới ghi
  03:04:25Z — sớm hơn mốc repair 03:04:31Z trên đồng hồ cũ 6 s:
  chênh lệch đồng hồ giữa 2 boot, xem §2.4). Tuổi thọ ngắn, cùng
  nhóm với #66? (27p36) và #69? (~19–20') — boot chết sớm vẫn
  là mẫu hình lặp lại, không phải ngoại lệ.

### 2.2 Replay #72? — khởi động muộn, update chạy, installs dở dang rồi chết

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 02:10:17 | 0 | btime |
| Configure (2 dòng dpkg.log) | 02:35:39 | +25m22s | dpkg.log |
| apt-get update pid 842 + wrapper pid 821 chạy | 02:35–02:47 | +25m–+37m | ps live; partial 26 → 62 file (842 chết trong (02:46:41Z, 02:47:41Z]; apt-get MỚI 11802 chạy installs từ ~02:47Z) |
| Installs (48) | ~02:47–02:48:06 | +37m–+37m49s | dpkg 2 → 350 dòng |
| Gói cuối gstreamer1.0-tools | 02:48:06 | +37m49s | dpkg.log + apt history |
| Wrapper pid 821 chết; 0 apt/dpkg | 02:48:06–02:48:42 | +37m49s–+38m25s | dpkg.log im từ 02:48:06Z; 0 proc quan sát lần đầu poll 4 bản 4801 (02:48:42Z); fuser lock rảnh |
| Postboot try1 FAIL | 02:42:42 | +32m25s | exit 1 (thiếu 5 lib + GST + 11 gói apt) |
| §8.2 đủ 5/5 (cách đọc chặt, 15p) | 03:03:30 | +53m13s | watcher poll 9, silence 924s |
| --repair bắt đầu | 03:04:31 | +54m14s | PID 18652; symlink GST xong |
| Cell reboot giết repair + watcher | ~03:04:3x | ~54m1x | repair PID mất lúc 03:05:16Z |

- Configure MUỘN (+25m22s): muộn hơn #71? (+9m59s), #66?
  (+10m56s), #62? (+9m52s); gần #64? (+30m21s) — nhưng khác #64?:
  update ở đây CHẠY ĐƯỢC (partial tăng 26 → 56 trong ~10 phút),
  không kẹt; installs bắt đầu ~02:47Z.
- Installs chỉ 48/217 rồi dừng: dpkg 350 dòng (trùng số dòng của
  #58 "tới nhưng thiếu GST" — cùng chữ ký lỗi). `term.log` 0 dòng
  lỗi; `history.log` 25 entry install thành công.
- Postboot try1 02:42:42Z (boot +32m25s, lúc update đang chạy):
  exit 1 — FAIL libs (thiếu cả 5), FAIL GST (thư mục không tồn
  tại, 0 file), FAIL apt (thiếu cả 11 gói). Wrapper PASS (bản vá
  K1 còn trong ~/.cache).

### 2.3 Nguyên nhân chết — lists `noble` gốc KHÔNG VỀ (chứng minh được)

- `/var/lib/apt/lists/` lúc 02:52Z: 28 file — CHỈ có
  backports/security/updates; toàn bộ lists `noble` gốc (main/
  universe/multiverse/restricted) VẮNG. `partial/` còn 8 file
  `noble_*` (InRelease + Packages.xz main/multiverse/restricted/
  universe + i18n) — update KHÔNG hoàn thành phần noble.
- `apt-cache policy` (kiểm tay, chỉ đọc):
  - Có candidate: plugins-base (1.24.2-1ubuntu0.7, từ
    noble-updates/main), plugins-good (1.24.2-1ubuntu1.8),
    plugins-gl, plugins-x.
  - KHÔNG candidate: plugins-bad, plugins-ugly, libav, libavif16,
    libevdev2 (chỉ có ở noble main/universe — lists thiếu nên
    không resolve được).
- `apt-get install -s` (dry-run, không đổi gì) cho 9 gói thiếu:
  `E: Package 'gstreamer1.0-plugins-bad' has no installation
  candidate` (+ ugly, libav, libavif16, libevdev2).
- Kể cả gói resolvable cũng FAIL: `apt-get install -s
  gstreamer1.0-plugins-base` một mình báo unmet dependencies
  (`libcdparanoia0`, `libvisual-0.4-0` not installable;
  `libgstreamer-plugins-base1.0-0` not going to be installed) —
  dep closure cần lists noble.
- Kết luận: replay chạy hết ledger (gói cuối tools đã cài) nhưng
  phần lớn install FAIL "no installation candidate" / unmet deps
  → wrapper đếm failures > 0 → exit 1 → chết. Đây là dạng (A)
  "tới nhưng thiếu GST" (giống #58), KHÔNG phải dạng (B) (0
  install) hay dạng (C) (apt sống nhưng kẹt — apt đã chết).
- LƯU Ý trung thực: lỗi install của replay không vào `term.log`
  (0 dòng lỗi) — chúng nằm ở stdout/stderr của wrapper, mà
  wrapper chết cùng boot nên log đó đã mất; chỉ còn bằng chứng
  gián tiếp (lists thiếu + policy + -s). Không khẳng định số lượng
  install FAIL chính xác (chỉ biết 48 thành công / 217 kỳ vọng).

### 2.4 Cell reboot giữa lượt — repair bị giết, boot #72? chết

- ~03:05Z: 2 lệnh exec của T5 bị abort ("service restarted").
  Kiểm tra sau đó: boot_id ĐÃ ĐỔI (`5e522260…`), `uptime -s`
  03:04:25Z, journal/wtmp chỉ còn boot mới (first entry
  03:04:36Z, +11s). Đây là REBOOT thật (boot_id là của kernel,
  chỉ đổi khi boot lại), không phải chỉ restart service agent.
- Repair --repair (PID 18652, bắt đầu 03:04:31Z): đã làm xong bước
  symlink GST → debroot (log `REPAIRED GST`), đang chạy `apt-get
  update` thì bị reboot giết (PID mất lúc kiểm 03:05:16Z;
  `/tmp/l8-postboot-apt.log` trống). **Repair KHÔNG hoàn thành.**
- Symlink GST trên #72? mất theo rootfs rebuild (ephemeral) — trên
  boot mới GST_SYS là thư mục thật, không còn dấu vết symlink.
- Chênh đồng hồ: btime boot mới 03:04:25Z sớm hơn mốc repair
  03:04:31Z (đồng hồ cũ) 6 s — thứ tự thật suy từ journal (first
  entry boot mới 03:04:36Z) + repair PID mất 03:05:16Z: repair
  chạy trước, reboot sau. Tuổi #72? ≈54m08s (±~10s do chênh này).
- Watcher v3 (PID 15469) cũng chết theo reboot. Watcher v3-restart
  (PID 3964, 03:07:06Z) chạy trên boot mới với btime cũ hardcode —
  T5 kill + thay bằng v4 trước khi nó kịp ghi cờ sai btime.

## 3. Boot #73? — replay KHỎE, PASS +5m51s

### 3.1 Boot #73? — btime 03:04:25Z, gap ≈54m08s

- Boot #73?: 2026-11-17 03:04:25Z (btime kernel 1794884665;
  `uptime -s` đồng ý; journal first entry 03:04:36Z, chênh +11 s;
  boot_id `5e522260-235e-4394-a888-bce604728204`, sau #72?
  ≈54m08s). Số thứ tự TẠM, chờ T6 đếm lại mù #37.
- Replay KHỎE, khởi động NHANH — bracket (+38s, +4m57s]:
  configure 03:05:03Z (boot +38s, 2 dòng dpkg.log); unpack
  03:05:42Z; installs 03:05:42–03:09:22Z; xong 03:09:22Z (boot
  +4m57s, dpkg 2 → 1509 dòng, 217 installs, gói cuối
  gstreamer1.0-tools). Nhanh ngang #68? (+4m51s), nhanh hơn #71?
  (+12m05s) và #70? (+7m17s).
- 2 gói từng thiếu ở #65? (libav 03:0x, plugins-bad) ĐỀU ĐƯỢC CÀI
  (`dpkg-query` ii cả 2) — mẫu thiếu 2 gói không lặp lại lần
  thứ 4 liên tiếp (#68?, #70?, #71?, #73? đều đủ; #72? là ngoại
  lệ do lists noble thiếu, không phải do 2 gói này riêng).
- try1 03:10:16Z (boot +5m51s), exit 0 (`t5-postboot-b73-try1.log`):
  PASS wrapper (K1), PASS libs (đủ 5), PASS GST (thư mục thật,
  269 file = debroot), PASS apt 11/11.
- Watcher v4 b73 poll 1–2 (03:10:16–03:11:16Z): postboot exit 0
  cả 2 poll; dpkg 1509 đóng băng; 0 apt/dpkg/wrapper; lists 37;
  GST 269; **cờ `POSTBOOT_PASS` viết 03:11:16Z (poll 2, đúng
  boot_id)**; watcher tự kết thúc `done_pass_stable_2polls`.
- Final 03:12:02Z, exit 0 (`t5-postboot-b73-final.log`): PASS lại
  toàn bộ. Tổng: PASS 4/4 lần kiểm trên #73? (try1 + poll1 +
  poll2 + final), 0 lần FAIL.

### 3.2 Bảng chế độ lỗi replay (cập nhật tới #73?)

| Boot | Chế độ | Bằng chứng |
|---|---|---|
| #71? | Chạy MUỘN nhưng XONG NHANH, PASS | (9m59s, 12m05s], 1509 dòng |
| **#72?** | **CHẾT dạng (A) "tới nhưng thiếu GST"** — update xong nhưng lists `noble` gốc không về (8 file kẹt partial/), chỉ 48 installs, gói cuối tools 02:48:06Z, wrapper chết; §8.2 đủ 5/5 lúc 03:03:30Z; --repair bắt đầu 03:04:31Z thì reboot giết (boot chết 54m08s); KHÔNG có cờ PASS | dpkg.log + apt policy + `-s` + watcher b72 10 poll + repair log |
| **#73?** | **Chạy NHANH, PASS** — configure +38s, xong +4m57s (1509 dòng, 217 installs, gói cuối tools); PASS +5m51s (lần kiểm đầu); 2 gói từng thiếu ở #65? đều được cài; boot vẫn sống | dpkg.log + postboot try1/poll1–2/final + watcher b73 2 poll + POSTBOOT_PASS |

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 23:40Z (boot #71?, ~14' tuổi) | 3451 | mở đợt 126 |
| T5, 23:54Z (boot #71?, ~28' tuổi) | 3434 | cuối đợt 126 |
| **T5, 02:40Z (boot #72?, ~30' tuổi)** | **3334** | **mở đợt 127** |
| **T5, 02:42Z (boot #72?, ~32' tuổi)** | **3324** | **trạng thái ban đầu** |
| **T5, 03:09Z (boot #73?, ~5' tuổi)** | **3317** | **mở trên boot mới** |
| **T5, 03:12Z (boot #73?, ~8' tuổi)** | **3315** | **cuối lượt** |

- Headroom gần như đứng yên trong lượt trên cả 2 boot (−10 trên
  #72?, −2 trên #73?) nhưng tiếp tục xu hướng giảm dài hạn qua
  các boot: 4438 → 4318 → 3645 → 3451 → 3434 → 3334 → 3317 →
  3315. Vẫn gấp ~2,1 lần số watch vite thường cần (~1586).
  **Vite thường chạy được trên boot này. Chưa tới ngưỡng báo
  user (< ~1.800) — chỉ theo dõi** (quyết parent §12(h) đợt 126).
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 02:40Z (#72?) | 547 MB | lúc mở lượt — THẤP NHẤT T5 từng ghi (kỷ lục cũ 834 MB, poll 1 b71 đợt 126) |
| 02:42Z (#72?) | 1538 MB | trạng thái ban đầu |
| 02:43–02:56Z (#72?, watcher) | 1928 → 1818 → 2430 → 2202 → 1953 → 1832 → 1224 → 1170 MB | dao động mạnh theo luồng khác |
| 02:58–03:04Z (#72?) | 1279 → 1146 → 1001 → 944 → 684 → 598 MB | rơi dần về cuối đời boot (luồng khác + repair) |
| 03:07–03:12Z (#73?) | 1452 → 1201 → 1098 → 1102 MB | sau reboot, ổn định hơn |
| Brief lúc mở | ~1059 MB | theo task (không phải số T5 đo trực tiếp) |

- Dao động rất mạnh theo luồng khác (biên độ ~2000 MB trong lượt);
  mức thấp nhất 547 MB (02:40Z) là thấp nhất T5 từng ghi. Dù lấy
  số nào cũng < 6 GB guard — birefnet không thử.
- Không đo RAM baseline idle (nợ đã đóng đợt 125; không thuộc T5).

## 5. Watcher — b72 (3 lần khởi động lại) + b73 v4 (2 poll PASS, ghi cờ)

### 5.1 Watcher b72 — 5 lần chạy (log chung 1 file, poll đánh số lại mỗi lần)

- v2 (PID 4022, 02:43:27Z): poll 1 — phát hiện lỗi INSTALLS
  (xem §7.3 mục 1) → kill, sửa, khởi động lại ngay.
- v2-restart (PID 4235, 02:43:58Z): poll 1–2 — phát hiện false
  positive MiniBrowser (xem §7.3 mục 2) → kill, sửa mẫu pgrep,
  khởi động lại.
- v2-sửa (PID 4801, 02:45:41Z): poll 1–9 (02:45:41–02:53:43Z) —
  quan sát TRỰC TIẾP replay chuyển pha + chết: poll 1–2 update
  chạy (dpkg 2 dòng, apt-get 842 sống, partial 58 → 62); poll 3
  (02:47:41Z) installs bắt đầu (dpkg 186, installs 27, apt-get
  MỚI 11802 ở 56,8% CPU, dpkgproc 1, lists 28, partial 8, GST 2);
  poll 4 (02:48:42Z) replay VỪA CHẾT (dpkg 350, installs 48,
  0 proc); poll 5–9 dpkg 350 đóng băng, postboot exit 1. Các EVAL
  ở bản này SAI 2 chỗ (silent tính từ mốc cố định 02:35:39Z nên
  đọc quá 10 phút; C4 chưa có dạng (A)) → TRIGGER=NO suốt — bị
  v3 thay thế, không dùng để quyết định.
- v3 (PID 15469, 02:55:28Z): poll 1–10 (02:55:28–03:04:30Z) —
  đánh giá §8.2 (B)/(C) ĐÚNG (silent từ dòng cuối dpkg.log live +
  C4 có dạng (A)); chết theo reboot lúc ~03:04:3xZ.
- v3-restart (PID 3964, 03:07:06Z): chạy trên boot MỚI với btime
  cũ hardcode — poll 1 (03:07:06Z, dpkg 603, installs 90,
  postboot 1), poll 2 (03:08:07Z, dpkg 1164, installs 170, GST
  269, postboot 0 — đủ 11 gói TRƯỚC khi replay xong hẳn, như
  #70?), poll 3 (03:09:07Z, dpkg 1448, installs 208, postboot 0).
  T5 kill sau poll 3, thay bằng v4 trước khi nó kịp ghi cờ sai
  btime (nó cần 2 poll PASS liên tiếp + dpkg đóng băng + 0 proc
  mới ghi cờ — chưa đạt lúc bị kill).
- Diễn biến b72 v3 (poll 1–10, mốc quyết định): dpkg 350 dòng
  đóng băng từ poll 1 (baseline) — poll 2 trở đi frozen=yes;
  installs 48; lists 28; partial 8; GST 2. Postboot exit 1 MỌI
  poll. silent (từ dòng cuối dpkg.log 02:48:06Z): 442 → 502 →
  563 → 623 → 683 → 743 → 803 → 863 → 924 → 984 giây.
- Minibrowser: 0 mọi poll sau khi sửa mẫu pgrep (poll 1–2 bản
  4235 báo 1 là false positive, xem §7.3 mục 2).

### 5.2 Watcher b73 v4 — PASS ổn định, ghi cờ, tự kết thúc

- Chạy 03:10:16–03:11:16Z (2 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0.
- Poll 1 (03:10:16Z): dpkg=1509 frozen=no (baseline), postboot 0.
  Poll 2 (03:11:16Z): dpkg=1509 frozen=yes, silent 114s (từ dòng
  cuối 03:09:22Z), apt=0, lists=37, GST=269, postboot 0 →
  **FLAG_WRITTEN 03:11:16Z**.
- Cờ `POSTBOOT_PASS` (round127-t5/): `boot_id=5e522260-235e-4394-
  a888-bce604728204 btime=2026-11-17T03:04:25Z pass_at=
  2026-11-17T03:11:16Z poll=2` — đúng boot mới. Các luồng T3/T9
  gate bằng cờ này. Cờ đợt 126 (#71?, ff7afbbb…) STALE.
- KHÔNG reboot trong lúc watcher b73 chạy (boot #73? sống từ
  03:04:25Z tới cuối lượt T5 03:12:02Z, boot +7m37s).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt 02:42Z (#72?) lẫn lúc kiểm cuối 03:12Z (#73?) —
  sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **62 → 63 file
  cooldown** (+1 trong lượt; đều là cooldown cũ, không chặn luồng
  khác, không tính là ticket). Luật prune cooldown ĐÃ PHÊ DUYỆT
  (quyết parent §12(c) đợt 125) — việc prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Ghi chú: lúc 02:43Z có 1 process shell của luồng khác chạy lệnh
  chẩn đoán chứa chuỗi "MiniBrowser" (ldd MiniBrowser + grep
  libevent) — đó là nguồn false positive pgrep -f ở §7.2, không
  phải probe WebKit thật.

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

### 7.1 Đối chiếu 5 điều kiện §8.2 ở MỖI poll — boot #72? (watcher b72 v3, poll 1–10)

| Poll | Thời gian | silent* | (1) FAIL tươi | (2a) 0 proc | (2b) im ≥10' | (3) chờ | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 02:55:28Z | 442s | yes | yes | no | no | A | yes | **NO** |
| 2 | 02:56:28Z | 502s | yes | yes | no | no | A | yes | **NO** |
| 3 | 02:57:29Z | 563s | yes | yes | no | no | A | yes | **NO** |
| 4 | 02:58:29Z | 623s | yes | yes | yes | 10'§ | A | yes | **YES (10' reading)** |
| 5 | 02:59:29Z | 683s | yes | yes | yes | 10'§ | A | yes | **YES (10' reading)** |
| 6 | 03:00:29Z | 743s | yes | yes | yes | 10'§ | A | yes | **YES (10' reading)** |
| 7 | 03:01:29Z | 803s | yes | yes | yes | 10'§ | A | yes | **YES (10' reading)** |
| 8 | 03:02:30Z | 863s | yes | yes | yes | 10'§ | A | yes | **YES (10' reading)** |
| 9 | 03:03:30Z | 924s | yes | yes | yes | **15' ✓** | A | yes | **YES (cả 2 cách đọc)** |
| 10 | 03:04:30Z | 984s | yes | yes | yes | **15' ✓** | A | yes | **YES (cả 2 cách đọc)** |

\* silent tính từ dòng CUỐI dpkg.log (02:48:06Z) sau khi sửa v3.
(2a) đã đạt từ poll 1 (replay chết từ ~02:48:42Z, quan sát lần đầu
ở poll 4 bản 4801); poll 1–3 TRIGGER=NO chỉ vì (2b)/(3) chưa đạt.
§ (3) ở poll 4–8 chỉ đạt theo ngưỡng 10p (cách đọc dạng (B));
theo cách đọc chặt cho dạng (A) cần 15p (đạt từ poll 9, 03:03:30Z).
Bản 4801 (poll 1–9, 02:45:41–02:53:43Z) cũng đánh giá §8.2 mỗi poll
nhưng EVAL của nó SAI (silent tính từ mốc cố định 02:35:39Z + C4
chưa có dạng (A)) nên TRIGGER=NO suốt — không dùng để quyết định;
chỉ v3 mới là đánh giá đúng.

- **Quyết định của T5: CHỜ tới 03:03:06Z (dpkg im ≥15p) rồi mới
  repair.** Watcher báo TRIGGER=YES từ 02:58:29Z (ngưỡng 10p) nhưng
  quyết parent §12(b) chỉ siết 10p cho dạng (B); dạng (A) giữ 15p
  (hoặc boot ≥60p — boot lúc đó mới ~53p). Chờ thêm ~5 phút không
  tốn gì và loại bỏ mọi mơ hồ về điều kiện (3). Kiểm chứng độc lập
  5/5 tươi lúc 03:04:31Z (postboot exit 1, 0 apt/dpkg, dpkg 350 dòng
  im 985s, lock rảnh, MiniBrowser 0, GST 2 file, thiếu 9/11 gói)
  rồi mới chạy `--repair` 1 lần (PID 18652) — đúng quy trình tiền
  lệ #63?.
- **Kết quả repair:** symlink GST → debroot XONG; `apt-get update`
  vừa bắt đầu thì reboot giết (PID mất lúc 03:05:16Z). Repair
  KHÔNG hoàn thành — không có lần kiểm PASS nào cho #72?.
  Không chạy repair lần 2 (boot đã chết; boot mới replay khỏe).
- **Luật (C) trên #72?: KHÔNG kích hoạt ở mọi poll.** (a) FAIL tươi:
  yes; (b) apt 0% CPU qua ≥2 lần kiểm ≥15' + dpkg im ≥15': NO —
  apt đã CHẾT (không phải sống-kẹt), partial tăng liên tục lúc
  update chạy (26 → 56), dpkg tăng 2 → 350 trong ~2 phút (có tiến
  triển); (d) dạng (C): NO (lists 28 file, không trống; installs
  48 > 0); (e) không probe: yes. Không kill nào được cân nhắc.

### 7.2 Đối chiếu §8.2 — boot #73? (watcher b73 v4, poll 1–2)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 03:10:16Z | 54s | no (exit 0) | no (apt sống lúc đầu? — xem ghi chú) | no | no | yes | **NO** |
| 2 | 03:11:16Z | 114s | no (exit 0) | yes | no | no | yes | **NO** |

- Ghi chú poll 1: lúc 03:10:16Z replay vừa xong 03:09:22Z; apt-get
  cuối có thể còn chạy closing pass (autoclean) lúc poll 1 — (2a)
  không đạt hoặc đạt đều moot vì (1)/(4) đã chặn trigger.
  Postboot PASS cả 2 poll → không có cơ sở repair nào.
- Luật (C) trên #73?: không áp dụng (replay xong + postboot PASS;
  (a) FAIL = no).

### 7.3 Lỗi watcher tìm được trong lượt (đã sửa, ghi trung thực)

1. **INSTALLS đếm sai (v2 poll 1):** `grep -c` exit 1 khi đếm = 0
   nên `|| echo "?"` chèn thêm "?" → INSTALLS="0\n?" → test
   `[ "$INSTALLS" = "0" ]` sai → C4=no sai (đáng lẽ yes lúc
   replay chưa cài gì). Sửa: `|| true`. Phát hiện ngay poll 1,
   kill + sửa + khởi động lại trước khi lỗi ảnh hưởng quyết định
   nào.
2. **False positive MiniBrowser (v2 poll 1–2):** `pgrep -f
   'Mini[B]rowser'` khớp cả shell của luồng khác mà dòng lệnh chứa
   chuỗi "MiniBrowser" (lệnh chẩn đoán `ldd .../MiniBrowser` +
   grep libevent, pid 3949 lúc 02:44Z) → c5=no sai. Sửa:
   `pgrep -x MiniBrowser` (khớp tên process, không khớp chuỗi
   dòng lệnh). Sau sửa: minibrowser=0 mọi poll.
3. **SILENT sai sau khi dpkg tăng (bản 4801):** silent tính từ mốc cấu
   hình cố định 02:35:39Z — sau khi dpkg tăng lên 350 dòng (dòng
   cuối 02:48:06Z), silent đọc 843–1084s trong khi im thật chỉ
   2–4 phút → (2b)/(3) đọc yes sớm ở poll 5–9 bản 4801. Sửa (v3):
   đọc timestamp dòng CUỐI dpkg.log live mỗi poll. Các EVAL bản
   4801 là SAI — quyết định repair KHÔNG dựa vào chúng (chỉ dựa
   vào EVAL v3 + kiểm chứng tay).
4. **C4 chỉ kiểm dạng (B) (v2):** với replay chết giữa chừng
   (48 installs), C4=no → trigger không bao giờ bắn dù đủ điều
   kiện khác. Sửa (v3): C4=yes khi (B) HOẶC (A) (0 proc +
   installs>0 + GST thiếu + FAIL).
5. **`last_install` hiển thị sai (v3, cosmetic):** awk `{print
   $4}` lấy nhầm cột ("installed" thay vì tên gói — tên gói ở
   $5). Không ảnh hưởng EVAL (C4 không dùng trường này). Để
   nguyên, ghi nhận ở đây (không khởi động lại watcher chỉ vì
   lỗi hiển thị).
6. **Cảnh báo chung (bài học):** `pgrep -f` tự khớp chính shell
   gọi nó nếu dòng lệnh chứa chuỗi mẫu — kiểm tay lúc 03:01:17Z
   ghi wrapper=1 và lúc 03:04:31Z ghi wrapper=2 đều là shell của
   chính lệnh exec (false positive); `ps aux | grep apt-get`
   độc lập cho 0. Mọi kết luận (2a) trong LIMITS này dựa vào
   watcher (chạy từ file script, không tự khớp) + kiểm chéo ps.

## 8. Chẩn đoán event lag ≥+5f + (c2) lệch nhãn +1f (dữ liệu T9 đợt 126)

> Nguồn: `hidden_files/round126-t9/preview-b-f3-flip-webkit-t9-attempt2.json`
> (lượt yên hợp lệ attempt2, 20/20 pass, median 44,0 ms) +
> `analyze-t9-attempt2-{lag5,labellag}.txt` + code
> `apps/web/src/preview.tsx` (§1223–1420, §1519–1649, §1961, §3049).
> Phương pháp: đọc lại tick thô (blendTick) quanh event + toàn bộ
> 740 ghost entry hậu flip+2000ms; đối chiếu strip với 90 frame
> ground-truth (`round111-m5/frames-nonperiodic`) bằng cùng hàm
> match của analyzer (thresh ≤2 bit, strip 48px kênh G).

### 8.1 Event seq 276–279 — dữ kiện thô (không suy diễn)

| seq | tBlend | presented | expected | currentTime | skp | curPix (md5) | ghost (label → pixFrame) |
|---|---|---|---|---|---|---|---|
| 271 | 46009 | 16 | 16 | 0.5333 | 0 | frame 16* | 0 → 0, 0 → 0 |
| 272–274 | 46121–46323 | 16 | 16 | 0.5337 | 1 | frame 16* | 0 → 0, 0 → 0 |
| 275 | 46435 | 17 | 17 | 0.5840 | 0 | **frame 27** | 0 → 0, 16 → 16 |
| 276 | 46528 | 19 | 19 | 0.6665 | 0 | **frame 27** | 16 → 16, **17 → 27** |
| 277 | 46618 | 22 | 22 | 0.7566 | 0 | **frame 27** | 17 → 27, **19 → 27** |
| 278 | 46693 | 25 | 25 | 0.8476 | 0 | **frame 27** | 19 → 27, **22 → 27** |
| 279 | 46765 | 27 | 27 | 0.9248 | 0 | **frame 27** | 22 → 27, **25 → 27** |
| 280 | 46849 | 30 | 30 | 1.0085 | 0 | **frame 27** | 25 → 27, 27 → 27 |

\* curPix md5 ở 271–274 = cbe4b0cf6422 = strip frame 16 (khớp GT 16,
Hamming 0).

- Bối cảnh ngay trước event: wrap loop ở seq 270→271 (tBlend gap
  1192 ms; ct 2.1667 → 0.5333, frame 65 → 16) rồi video ĐÓNG BĂNG
  ở frame 16 trong 4 tick (271–274, ct 0.5333→0.5337 trong 314 ms).
  19 gap tBlend >500 ms trong run (max 1476 ms) đều là wrap loop
  (video 90 frame = 3,0 s; ~20 vòng) — gap wrap ~1,2 s là mẫu
  hình chung, không riêng event này.
- Event (276–279, cửa sổ 237 ms): presented == expected ở MỌI
  tick; currentTime tiến 0.6665 → 0.9248 (+0,258 s trong 237 ms
  wall ≈ real-time, +8 frame ≈ presented +8). Nhãn ghost bám sát
  ct (labelCt 0.5840 → frame 17; 0.6665 → 19; 0.7566 → 22;
  0.8476 → 25; 0.9248 → 27 — đúng floor(ct×30)).
- Strip: curPix + ghostPix đều là strip frame 27 (md5
  d48b6e639a91) trong 6 tick liên tiếp (275–280, ~414 ms) trong
  khi presented tiến 17 → 30. Khớp GT frame 27 ở Hamming 0
  (frame gần nhất sau đó: frame 6, cách 7 bit; frame 31 cách 10
  bit) — khớp CHẮC, không phải alias (strip GT các frame kề
  nhau khác 34–39 bit trên 48 bit; frame cách 4 cũng khác 8–26 bit).
- Timing trong-tick ở event: labelMs → snapMs = 30–56 ms (276:
  30 ms; 277: 39 ms; 278: 56 ms; 279: 39 ms) — BÌNH THƯỜNG
  (median toàn run 38 ms, xem §8.3). Không có tick chậm nào trong
  event (gap tBlend 72–112 ms, median run 85 ms). pumpEvents = 0
  toàn run (không có pump nào).

### 8.2 Kết luận chẩn đoán event: renderer khỏe; strip đông cứng ở canvas rawUnit

1. **Renderer / video clock KHỎE trong event.** presented ==
   expected ở mọi tick; ct tiến real-time; nhãn bám ct. Không có
   bằng chứng video decode/render trễ. Event KHÔNG chỉ ra hồi
   quy sản phẩm — verdict WebKit ≤60 ms (median 44,0 ms) không
   bị ảnh hưởng.
2. **Lệch nằm ở pixel strip, không ở nhãn.** Strip (cả curPix lẫn
   ghostPix) đông cứng ở pixels frame 27 trong 6 tick trong khi
   nhãn tiến bình thường. Ring motion-blur chỉ MANG pix cũ đi
   tiếp (nhãn tiến, pix đứng yên) — ring là sứ giả, không phải
   thủ phạm (code `updateMotionBlurSnapshots`: pix đọc live từ
   canvas sau drawImage; canvas tái dùng thì entry bị ghi đè —
   pix đứng yên nghĩa là canvas nguồn đứng yên).
3. **Nguồn strip là canvas, không phải video element sống.**
   srcKind = "canvas" ở 740/740 ghost entry hậu flip (0 entry
   "video"); curPix đọc trực tiếp từ canvas rawUnit
   (`blendCurrentPixStrip`, preview.tsx:4435). Vậy pixels frame 27
   nằm trong canvas rawUnit (hoặc snapSrc) từ ≤46435Z trong khi
   đồng hồ video đọc 0,584 — canvas "đi trước" đồng hồ ~300 ms ở
   đầu cửa sổ, hội tụ về 0 ở cuối (seq 280: nhãn 27 = pix 27).
4. **Chi tiết "frame tương lai" CHƯA giải thích được từ dữ liệu
   trên đĩa.** Gap label→snap ở event là bình thường (30–56 ms)
   nên không giải thích được pix đi trước nhãn tới +10f; các pass
   đều bắt đầu ở frameIdx 0 (không có pass nào seek tới frame 27);
   video chưa từng tới frame 27 trong vòng loop hiện tại lúc
   46435Z (vòng trước tới 27 ở ~43,4 s — cách ~3 s). Giả thuyết
   hàng đầu còn lại: **lệch seek (seek-latency desync)** — nhãn
   đọc currentTime (mục tiêu seek mới nhất) trong khi pixels là
   frame của seek HOÀN THÀNH gần nhất — nhưng dữ liệu trên đĩa
   không ghi lệnh seek/draw vào rawUnit nên KHÔNG chứng minh
   được seek nào đã đưa frame 27 vào rawUnit. Đây là giả thuyết,
   không phải kết luận.
5. **Giữ event làm case theo dõi** (quyết parent §12(g)). Cần dữ
   liệu thêm (xem §8.4). Không kết luận hồi quy từ 1 event.

### 8.3 (c2) lệch nhãn +1f — GIẢI THÍCH ĐƯỢC (sai số lấy mẫu)

- **(c2) là phần nổi của lệch hệ thống, không phải cụm frame
  đặc biệt.** Phân phối (pixFrame − label) trên toàn bộ 740
  ghost entry hậu flip+2000ms (khớp dist ≤2, 0 nomatch):
  **−14: 2, −12: 5, −11: 5, −10: 4, −9: 2, −3: 2, −1: 57, 0: 265,
  +1: 175, +2: 175, +3: 42, +5: 2, +8: 2, +10: 2.**
  Lệch +1/+2 chiếm 350/740 (47%); lệch 0 chỉ 265/740 (36%).
  Nhãn ghost lệch TRỄ hơn pixels 1–2 frame là TRẠNG THÁI THƯỜNG.
- **Cơ chế (đo được):**
  - Nhãn được gán lúc đọc currentTime (labelMs); pixels được lấy
    mẫu ở snapshot muộn hơn: **snapMs − labelMs: median 38 ms,
    mean 43 ms, min 26, max 96, p90 63 ms** (n=740). Ở 30 fps
    (33,3 ms/frame), 38 ms ≈ 1,1 frame — đúng lệch modal +1/+2.
    (rawMs − labelMs median chỉ 10 ms — phần lớn lệch tích lũy
    ở bước copy snapshot, không phải bước vẽ rawUnit.)
  - Nhãn = floor(labelCt×30) hoặc +1: phân phối (label −
    floor(labelCt×30)) = {0: 236, +1: 504} — nhãn tự thân đã
    lượng tử hóa +0/+1 so với timestamp của nó (labelSrc =
    frameIdx ở mọi entry).
  - Tất cả ghost đều srcKind="canvas" — pixels luôn qua canvas
    trung gian, không bao giờ đọc trực tiếp từ video element sống.
- **Vì sao (c) chỉ "bắn" ở frame 12–15?** Định nghĩa (c) đòi strip
  khớp `presented` của tick trong khi nhãn khác — ghost là snapshot
  CŨ (1–2 tick trước) nên pix của nó thường KHÔNG trùng presented
  hiện tại. Chỉ khi presented ĐỨNG YÊN nhiều tick (stall sau
  loop-seek: presented 12–15 trong 3–8 tick liên tiếp — xem các
  run curPix đông cứng ở §8.3) thì pix +1 mới kịp trùng presented
  và (c) mới bắn. 8 occurrence (c2) thuần +1f (seq 150, 175, 195,
  223, 379, 406, 429, 485; cặp 13/12, 14/13, 15/14) đều nằm trong
  các run đứng yên sau wrap. Phân phối +1 theo nhãn ghost trải
  rộng 12–64 (không tập trung 12–15) — xác nhận (c2) là lát cắt
  quan sát của lệch hệ thống, không phải cụm frame đặc biệt.
- **Đuôi âm (−9..−14, 18 entry)** là discontinuity vòng loop:
  snapshot nhãn frame trước wrap mang pixels sau wrap (hoặc
  ngược lại) — ring reset khi seek lùi >1 frame không xóa kịp
  mọi entry. Không phải lỗi render.
- **Kết luận (c2):** lệch +1f tái hiện 3 đợt liên tiếp là cùng một
  hiện tượng đo được — **sai số lấy mẫu nhãn-vs-pixel của
  instrumentation (median ~38 ms ≈ 1 frame)** — không phải lỗi
  của renderer hay của video. Không cần sửa sản phẩm vì (c2);
  nếu muốn giảm (c2) thì sửa instrumentation (gán nhãn lúc lấy
  mẫu pixel thay vì lúc đọc currentTime, hoặc ghi cả hai mốc —
  quyết này thuộc parent, T5 không tự sửa code đo).

### 8.4 curPix đông cứng — mẫu hình hệ thống (24 run ≥3 tick)

- 24 run curPix giống hệt nhau ≥3 tick liên tiếp trong run T9;
  phần lớn ngay sau wrap loop: seq 40–45 (6 tick, frame 13),
  67–74 (8 tick, 13→14), 95–99 (5), 120–124 (5), 147–149 (3),
  172–175 (4), 193–195 (3), 217–223 (7), 275–280 (6, frame 27 —
  event này), 295–298 (4), 319–324 (6), 347–351 (5), 372–379 (8),
  402–406 (5), 424–429 (6), 450–455 (6), 478–484 (7); cộng 4 run
  giữa vòng (185–188: 44→57; 231–234: 32→43; 359–362: 35→45;
  408–410: 19→28; 497–499: 45→55) — các run giữa vòng có
  presented NHẢY VỌT (nhiều frame/tick) trong khi curPix đứng yên.
- Đọc đúng: canvas strip (curPix) cập nhật THƯA HƠN tick blend —
  blend tick chạy ~85 ms nhưng strip chỉ đổi mỗi ~3–8 tick sau
  wrap (stall) và mỗi ~3–4 tick giữa vòng khi video nhảy nhanh.
  Đây là hành vi của ĐƯỜNG ĐO (rawUnit/snapshot), không phải của
  renderer (presented vẫn tiến đúng).
- **Dữ liệu cần thêm để đóng event (đề xuất cho parent):** (1) log
  mỗi lần drawImage vào rawUnit/snapSrc kèm video.currentTime lúc
  vẽ + trạng thái seek đang chờ (1–2 vòng loop quanh wrap là đủ);
  (2) lặp lại histogram (pixFrame−label) trên 1 lượt yên sau để
  xác nhận modal +1/+2 vẫn giữ (dự kiến giữ, vì là cấu trúc).
  Không cần lượt đo E4 hay TTS nào cho việc này.
- **So với event cũ:** P4 (seq 220–223, frame 26), Q5 (seq 282–285,
  frame 68), T4-118 (frame 23) — event mới (frame 27) KHÔNG khớp
  frame nào trong 3 event cũ; nhưng cả 4 event đều có chung chữ ký
  (strip đông cứng nhiều tick + nhãn tiến) — nay đã có cơ chế chung
  (canvas strip cập nhật thưa + lệch lấy mẫu nhãn), không cần giả
  thuyết riêng cho từng frame.

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (2 lần, không đổi logic)

- Lần 1 (#72?, 02:42Z): md5 `e986ec78e979692ba2c2f5ce25cba31` →
  `bf1ee57098160ba489cafb7d16cec14e` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Lần 2 (#73?, 03:09Z): md5 `bf1ee57098160ba489cafb7d16cec14e` →
  `c9e2f827efbd45a3052c8ff3bcad0990` (ghi trong
  `postboot-check.md5.b73-before` / `postboot-check.md5.b73-after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #72? (chết dạng (A), repair bị reboot giết)
  + đoạn #73? (replay khỏe, PASS +5m51s); dòng `say` cập nhật
  tương ứng. **Không lặp sự cố đợt 120:** dòng `say` mới không
  chứa ký tự `"` (dùng `p`/`s` thay dấu phút/giây).
  `bash -n` OK cả 2 lần.
- Kiểm chứng: sau sửa #73?, try1 PASS exit 0 ngay lần đầu
  (03:10:16Z) + watcher 2 poll PASS + final PASS — logic không
  đổi đã được xác nhận bằng chạy thật.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên. Lưu ý từ lần repair này: thứ tự hiện
  tại symlink GST → debroot TRƯỚC khi apt install — nếu apt cài
  được, file plugin sẽ ghi xuyên symlink vào debroot (làm bẩn
  fallback). Lần repair này symlink đã mất theo reboot nên không
  đo được mức bẩn thực tế; phương án A vẫn chờ parent duyệt.

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng đợt
  117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #72?→#73? giữa lượt này là ví dụ mới nhất cho thấy R9 (a)
  vẫn có giá trị: T5 phải tự phát hiện boot mới + cập nhật script +
  ghi cờ mới cho #73? trong ~7 phút sau boot (lượt mở lại 03:07Z,
  cờ PASS 03:11:16Z). Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại,
  nhưng không thay thế R9 (a).
- Nhắc lần 13.

## 11. Nợ mở sang đợt sau

1. **Boot #73? đang sống + PASS — các luồng đo đợt 127 dùng cờ này**
   (`round127-t5/POSTBOOT_PASS`, boot_id 5e522260…, PASS 03:11:16Z,
   xác nhận lại 03:12:02Z). Nếu #73? cũng chết sớm như #72?
   (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải làm lại từ đầu.
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20,
   #69? ~19–20', #70? ≥53m41s, #71? ≥28m48s (chưa biết lúc chết),
   #72? 54m08s, #73? chưa biết (sống ≥7m37s tới cuối lượt T5).
2. **Số thứ tự boot #72?/#73? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 127 đang chạy). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **Event lag seq 276–279 giữ làm case theo dõi** — cần log draw
   rawUnit/snapSrc kèm currentTime lúc vẽ (xem §8.4) để đóng giả
   thuyết seek-latency desync. (c2) đã giải thích được (sai số lấy
   mẫu ~38 ms) — không cần hành động sản phẩm; sửa instrumentation
   (nếu muốn) chờ parent quyết.
4. **Headroom tiếp tục giảm dài hạn:** …3434 → 3334 → 3317 → 3315.
   Trần 63747 cần can thiệp host — ngoài tầm luồng này. Ngưỡng báo
   user < ~1.800 chưa tới.
5. **RAM thấp nhất mới 547 MB (02:40Z, #72?)** — dao động mạnh theo
   luồng khác; T9 theo dõi RAM ghim (nhiệm vụ T9).
6. **Khung giờ #71? chết (00:44:50Z, 02:10:17Z] chưa kẹp hẹp hơn** —
   journal/wtmp chỉ giữ boot hiện tại; không có cách kẹp từ trong VM.
   (Khung #72? chết đã kẹp: repair chạy 03:04:31Z, boot mới btime
   03:04:25Z — chết trong khoảng (03:04:31Z, 03:04:36Z] theo journal
   first entry, modulo chênh đồng hồ 6 s, xem §2.4.)
7. **R9 (a) vẫn chờ user (nhắc lần 13).**
8. **Cooldown file tích lũy (62 → 63 file)** — luật prune ĐÃ PHÊ
   DUYỆT (quyết parent §12(c)); việc prune là của T6.
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 126 §10–§11 + quyết
   parent §12: E4 phân tích bàn giấy lượt 9 (T1 đợt 127); DEF v0.3.1
   + leg kiểm tra xen kẽ (T2/T3); mù #46 probe thường lệ (T4);
   G1 chờ user quyết; birefnet (chỉ thử lại khi RAM đổi, u2net là
   fallback chính thức); ci-security.yml vẫn 403 chờ user; TTS 39
   cấm kiểm lại; release gate không đổi + KHÔNG push khi user chưa
   nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx` / `media.ts`: KHÔNG kiểm md5 trong luồng này (T5 không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS). Baseline
  đợt 127 vẫn đứng theo round-in-progress.md.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  `vite-lock-v2.log` + kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #72? và sau sửa #73?) OK cả 2.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  547–2551 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #72?: FAIL (try1 02:42:42Z + watcher b72 10 poll + pre-repair
  03:04:31Z) — 0 lần PASS; replay chết dạng (A); repair bắt đầu
  03:04:31Z nhưng bị reboot giết, không hoàn thành.
- Postboot #73?: PASS 4/4 (try1 03:10:16Z + watcher b73 poll 1–2
  03:10:16–03:11:16Z + final 03:12:02Z) — 0 lần FAIL.
- Watcher b72: 5 lần chạy (4022: 1 poll; 4235: 2 poll; 4801: 9 poll;
  15469 (v3): 10 poll; 3964: 3 poll trên boot mới với btime cũ —
  đã kill); watcher b73 v4: 2/2 poll PASS, tự kết thúc
  `done_pass_stable_2polls`, exit 0. Reboot trong lượt: CÓ — 1
  lần (~03:04:3xZ, #72? → #73?).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL cả 2 boot, KHÔNG
  KÍCH HOẠT SAI.** Trên #72?: TRIGGER=YES từ poll 4 theo ngưỡng 10p
  nhưng T5 chờ tới 15p (poll 9, 03:03:30Z) theo cách đọc chặt cho
  dạng (A) rồi mới repair; **luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG
  KÍCH HOẠT** (apt chết, không kẹt-sống). **Repair (cả §8.2 lẫn
  luật (C)): CHẠY 1 LẦN (03:04:31Z, --repair, có giám sát, sau khi
  đủ 5/5) — BỊ REBOOT GIẾT GIỮA CHỪNG, không hoàn thành.**
- Headroom: #72? 3334 → 3324; #73? 3317 → 3315.
- Stale vite.lock: không có (lock dir không tồn tại lúc mở lẫn lúc
  cuối; queue cooldown 62 → 63 file).
- Chẩn đoán event lag + (c2): xem §8 — renderer khỏe; (c2) giải thích
  được (lệch lấy mẫu median 38 ms); event giữ làm case theo dõi.

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND127_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  tham chiếu #72? rồi #73? trong header + dòng `say`; md5
  `e986ec78…` → `bf1ee570…` → `c9e2f827…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round127-t5/` (log
  watcher b72 (5 lần chạy: 4022/4235/4801/15469/3964) + b73 v4,
  log postboot try1/poll/final/repair/pre-repair, log headroom
  mở/cuối cả 2 boot, md5 trước/sau của postboot-check (cả 2 lần
  sửa), `POSTBOOT_PASS` (cờ hiện tại — cho boot #73?, PASS
  03:11:16Z), `t5-initial-state.md`, `t5-repair-decision.md`,
  `t5-repair-run.log`, `t5-reboot-note.md`,
  `t5-wait-replay-b72.sh`, `t5-wait-replay-b73.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round127-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round127-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
