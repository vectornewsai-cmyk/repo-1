# PHASE9_ROUND117_T8_INFRA_LIMITS — Hạ tầng: postboot #52 + replay kẹp bằng dpkg.log + headroom + watcher v2 try#2 + stale vite.lock

> Luồng T8, đợt 117, lượt cron 15:35 +07 15/11/2026 (bắt đầu ~08:38Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 116 §10 mục 8 (postboot + apt replay + headroom +
> watcher v2 + stale lock); tiếp nối S8 đợt 116.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự reboot
> máy để test. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Boot hiện tại là #52, KHÔNG phải #49/#50/#51** — boot 2026-11-15
   08:29:12Z (btime kernel / `uptime -s`; `stat` btime của `/` là
   08:29:22Z, chênh 10 s do rootfs mount sau kernel boot), boot_id
   `22536366-8716-46f0-a999-cd4199080854`, sau #51 ~04:31Z (gap ~3h58').
   T8 bắt đầu lúc boot ~9' tuổi — sớm nhất từ trước tới nay cho một
   luồng infra (S8 đợt 116 bắt đầu lúc boot #48 đã ~79' tuổi).
2. **Postboot #52: PASS** — kiểm check-only lúc boot ~10.1' tuổi
   (08:39:28Z), exit 0; kiểm lại sau khi sửa script (08:41:41Z) vẫn
   PASS. Wrapper PASS, libs đủ 5/5, GST thư mục thật 269 file đủ
   isomp4+libav, apt đủ 11/11. `--repair` KHÔNG chạy (không cần).
   Kết quả ghi sớm vào `postboot-52-result.txt` cho luồng khác dùng.
   Xem §2.
3. **Khoảng replay #52 KẸP ĐƯỢC bằng dpkg.log: (6'28", 8'44"]** —
   hoạt động apt đầu tiên 08:35:40 (boot +6'28"), cài xong toàn bộ
   08:37:56 (boot +8'44"), 0 entry dpkg/apt nào sau đó. Boot thứ 4
   liên tiếp kẹp được (#46, #47, #48, #52). Khác #48: replay #52
   KHỞI ĐỘNG MUỘN (+6'28" mới có hoạt động apt đầu tiên, so với +40s
   của #48); cửa sổ cài đặt 2'16" tương đương #48 (2'04"). Xem §5.
4. **Watcher v2 try#2 KHÔNG kẹp được FAIL live** — dù bắt đầu sớm hơn
   S8 nhiều (boot 10.1' so với 79'), replay đã xong 08:37:56Z, tức
   83 s TRƯỚC khi watcher bắt đầu (08:39:19Z) và 24 s trước lần kiểm
   đầu tiên của T8 (08:38:20Z). Cửa sổ replay chỉ rộng ~2'16" và lượt
   cron bắt đầu đúng giữa cửa sổ đó — độ trễ spawn subagent (~2.5
   phút) đã nuốt trọn cửa sổ. Chỉ đề xuất R9 (a) (cron chạy watcher
   ở đầu mỗi lượt với `--wait-new-boot`) mới bắt được FAIL live một
   cách có hệ thống — vẫn cần parent duyệt. Xem §3.
5. **Postboot + bracket của #49/#50/#51: CHỈ CÒN #49 PASS (nhờ S10),
   còn lại ĐÃ MẤT VĨNH VIỄN cùng log.** #49 postboot PASS do S10 kiểm
   live 22:57–22:59Z (boot +1h10') — bracket #49 chỉ còn cận trên
   (PASS trước +1h10'14"), không kẹp chặt được. #50/#51 chưa từng có
   lần postboot-check nào (chỉ phát hiện qua boot_id đổi ở lượt cron
   09:35/12:35 +07); dpkg.log, apt/history.log, journal đều CHỈ CÒN
   log của boot #52 (reset theo rootfs rebuild mỗi reboot — cùng cơ
   chế mất log như boot #45, S8 §7). Xem §7.
6. **Headroom inotify boot #52 (boot MỚI): 948 — reboot KHÔNG hồi
   headroom (lần 2 liên tiếp có số đo boot-mới chứng minh).** Rơi
   tiếp từ 961 (cuối #48) → 948. Vite thường cần ~1586 watch nên
   vẫn thiếu ~638 — vite tạm `watch.ignored` vẫn bắt buộc. Xem §4.
7. **Stale vite.lock: KHÔNG CÓ.** Lock dir vắng mặt (= không lock
   đang giữ); queue chỉ còn 15 file cooldown cũ (đã hết hạn, vô hại);
   0 vite đang chạy lúc kiểm (08:40Z); v2 log không có STALE mới.
   Xem §6.
8. **Thử vite trên boot #52: CẢ HAI ĐỀU XÁC NHẬN — vite thường ENOSPC,
   vite tạm 200 + 0 inotify.** Attempt đầu bị defer (T6 giữ lock ~13
   phút, T1 xếp trước; ticket T8 chờ 121 s wall rồi TIMEOUT, nhả
   sạch). Thử lại acquire 900 s: vite thường giữ lock sau 634 s chờ,
   ready 892 ms rồi CHẾT vì ENOSPC khi watch `test-relink.sh`;
   vite tạm giữ lock sau 322 s chờ, ready, curl 127.0.0.1/localhost
   đều 200, 0 inotify FD. FIFO + cooldown v2 hoạt động đúng cả hai
   attempt. Xem §4.
9. **Cập nhật `postboot-check.sh` (md5 `f443dc5f…` → `32a214bb…`):**
   chỉ đổi tham chiếu boot #48 → #52 (header + dòng `say`, thêm ghi
   chú #49/#50/#51 đã mất log); `bash -n` OK + chạy kiểm chỉ-đọc
   lại ra PASS. Không đổi logic. Xem §8.
10. **Mù #35 nay chứa 4 reboot (#49, #50, #51, #52)** nếu chưa đóng —
    việc của luồng probe đợt 117 (T7), không phải T8.

## 2. Postboot #52 — PASS (check-only, không --repair)

- Boot #52: 2026-11-14 08:29:12Z (btime kernel; `uptime -s` đồng ý;
  `stat` btime `/` = 08:29:22.412Z — chênh 10 s, lấy 08:29:12Z làm
  chuẩn theo quy ước harness), boot_id
  `22536366-8716-46f0-a999-cd4199080854`, sau #51 ~04:31Z (gap ~3h58',
  #51 chỉ áng chừng ±1' từ uptime lượt cron 12:35).
  `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại); `wtmp` bắt đầu
  08:29:23Z — không còn dấu vết boot cũ nào trong máy.
- Lần kiểm try1: 08:39:28Z (boot ~10.1' tuổi), script bản S8 (md5
  `f443dc5f…`), exit 0. Log: `t8-postboot-b52-try1.log`.
  - PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
  - PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống).
  - INFO GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là thư mục thật
    (apt), 269 file plugin hệ thống = 269 file debroot.
  - PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264).
  - PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114).
  - KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit.
- `--repair` KHÔNG chạy: đã PASS nên không cần; và theo luật R9,
  không repair mù trong lúc replay đang chạy — lúc kiểm đã không còn
  apt/dpkg nào, nhưng repair là không cần thiết khi đã PASS.
- Kết quả ghi sớm vào `hidden_files/round117-t8/postboot-52-result.txt`
  lúc 08:39Z để luồng đo khác (T5 WebKit) không phải chờ T8 xong hẳn.
- Kiểm lại sau khi sửa script (§8): vẫn PASS, exit 0
  (`t8-postboot-b52-after-edit.log`, 08:41:41Z, boot ~12.5' tuổi).

## 3. Watcher v2 try#2 — chạy ngay theo luật đứng, vẫn không kẹp được FAIL live

- Luật đứng (quyết parent 15/11): luồng infra đầu tiên sau mỗi reboot
  chạy watcher v2 ngay. T8 chạy bản sao v2 đổi đường dẫn sang
  `round117-t8` (`t8-postboot-early-watch-v2.sh`, `bash -n` OK),
  launch 08:39:19Z (boot 10.1' tuổi — sớm hơn S8 7.8×: S8 bắt đầu lúc
  boot #48 đã ~79' tuổi).
- Kết quả: try#1 PASS lúc 08:39:19Z (boot 10.1' tuổi), watcher exit 0,
  tự dừng. Log: `t8-early-watch-try1.log`, `t8-early-watch-run.log`,
  state: `t8-early-watch-state.md` (đã đính chính bằng tay, xem dưới).
- **Giới hạn ghi rõ — KHÔNG kẹp được FAIL live:** replay #52 chạy
  08:35:40–08:37:56Z. T8 bắt đầu chạy 08:38:20Z (sau replay xong 24 s);
  watcher bắt đầu 08:39:19Z (sau replay xong 83 s). Watcher do đó chỉ
  chứng minh "PASS tại lần kiểm đầu (boot 10.1')", KHÔNG quan sát được
  giai đoạn replay đang chạy và không có lần FAIL live nào. Dòng
  "khoảng replay kẹp được" trong state file của watcher đã được T8
  đính chính bằng tay: khoảng chặt lấy từ dpkg.log (§5).
- **Phân tích độ trễ (mới):** lượt cron 15:35 +07 = 08:35:51Z bắt đầu
  ĐÚNG GIỮA cửa sổ replay (08:35:40–08:37:56Z) — tức cron đã "đúng
  lúc" theo nghĩa đen. Nhưng subagent T8 chỉ bắt đầu chạy ~08:38:20Z
  (spawn + khởi động ~2.5 phút sau đầu lượt), lúc đó replay vừa xong
  24 s trước. Cửa sổ replay #52 chỉ rộng 2'16" — ngắn hơn độ trễ
  spawn. Kết luận: **dù luồng infra bắt đầu ngay đầu lượt, độ trễ
  spawn subagent vẫn có thể nuốt trọn cửa sổ replay khi replay nhanh
  (~2–3')**. Muốn kẹp FAIL live một cách có hệ thống, watcher phải
  chạy TRONG 2 phút đầu sau boot — chỉ có đề xuất R9 (a) (cron chạy
  watcher v2 ở đầu mỗi lượt với `--wait-new-boot`, watcher tự chờ boot
  mới rồi đo ngay) mới làm được điều đó, vì cron chạy đều 3 h/lượt
  còn watcher thì chờ sẵn. Việc này vẫn cần parent duyệt triển khai
  (R9 chỉ đề xuất, S8 nhắc lại, T8 nhắc lại lần 3, KHÔNG tự gắn cron).
- So sánh các lần watcher: #46 try1 FAIL 1'23" → try2 PASS 7'08"
  (kẹp live, Q7); #47 try#5 FAIL 22.6' → try#6 PASS 27.7' (kẹp live,
  R9); #48 try#1 PASS 83.3' (không FAIL live, S8); **#52 try#1 PASS
  10.1' (không FAIL live, T8 — sớm nhất trong 2 lần không kẹp được,
  nhưng vẫn muộn 83 s)**.

## 4. Headroom inotify + vite (boot #52)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 114 Q7 cuối lượt (boot #46) | 1207 | cuối đợt 114 |
| R9 đầu lượt (boot #46) | 1094 | trước thử vite |
| R9 boot #47 mới (boot ~2' tuổi) | 1092 | reboot KHÔNG hồi headroom |
| R9 boot #47 sau replay PASS | 1073 | cuối R9 |
| S8 đầu lượt, 21:03Z (boot #48, ~79' tuổi) | 969 | trước thử vite |
| S8 cuối lượt, ~21:09Z (boot #48, ~85' tuổi) | 961 | sau thử vite; drift −8 là nhiễu luồng khác |
| **T8 đầu lượt, 08:40Z (boot #52, ~11' tuổi)** | **948** | **boot MỚI — trước thử vite** |
| T8 giữa lượt, 08:47Z (boot #52, ~18' tuổi) | 934 | drift −14 là nhiễu luồng khác |
| **T8 cuối lượt, 09:02Z (boot #52, ~33' tuổi)** | **925** | **sau thử vite; drift −23 từ đầu lượt là nhiễu luồng khác** |

- Xu hướng #42→#52: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot #47 mới)
  → 1073 → 969 → 961 (boot #48) → **948 (boot #52 mới) → 934 → 925
  (cuối lượt #52)**. Rơi liên tiếp, chưa từng hồi.
- **Kết luận mới (đóng câu hỏi mở của S8 §9.2): reboot KHÔNG hồi
  headroom — lần 2 liên tiếp có số đo boot-mới chứng minh.** R9 đã
  đo boot #47 mới 1092 (≈1103 trước reboot, không hồi); nay T8 đo
  boot #52 mới 948, THẤP HƠN cả 961 cuối boot #48. Caveat: T8 đo lúc
  boot ~11' tuổi (không phải ~2' như R9 #47), các luồng T1–T10 đã
  chạy ~5 phút và có thể đã ăn một phần watch — nhưng nếu reboot có
  hồi headroom thì số đo phải NHẢY LÊN gần mức đầu boot (~1300–1500
  như các boot đầu), không thể rơi tiếp xuống 948. Hướng rơi là rõ,
  chỉ biên độ chính xác còn nhiễu ±vài chục watch.
- RAM khả dụng lúc đo: **1143 MB** — vẫn < 6 GB, birefnet không thử
  (đứng theo LIMITS gộp).
- Log: `t8-headroom-b52-now.log` (probe STOP ở i=948, errno 28 ENOSPC).

### 4.2 Thử vite THƯỜNG (config repo, không watch.ignored) — boot #52

- **Attempt đầu BỊ DEFER — lock v2 hoạt động đúng, không phải lỗi:**
  `run-attempt t8-round117 5599 120 30 normal`, ticket
  `1-1794732136817408816-8868-t8-round117` lúc 08:42:16Z, xếp vị trí 2
  sau owner T6 (port 5186, ACQUIRED 08:42:06Z, vite node pid 8568
  đang sống) và sau ticket T1 (tạo 08:42:13Z, acquire 900 s, port
  5580). Sau 120 s vẫn chưa tới lượt → TIMEOUT lúc 08:44:17Z
  (`waited=121s` wall so với danh nghĩa 120 s — vá C giữ đúng, giãn
  chỉ +1 s), nhả ticket sạch, `run-attempt` exit 3, attempt KHÔNG
  chạy. Log: `t8-vite-normal.log`.
- **Thử lại (nền, acquire 900 s) — ĐÃ CHẠY ĐƯỢC, ENOSPC xác nhận:**
  ticket `1-1794732314878262246-19210-t8-round117` lúc 08:45:14Z;
  chờ 634 s trong hàng đợi (T6 giữ lock ~13 phút tới ~08:55:06Z,
  rồi T1 giữ ~44 s tới 08:55:50Z — thứ tự FIFO giữ đúng: vị trí 2 →
  1 → giữ lock); ACQUIRED 08:55:48Z (`wait_s=634`).
  Vite lên **"ready in 892 ms"** rồi **CHẾT vì ENOSPC** khi chokidar
  bắt đầu watch: `Error: ENOSPC: System limit for number of file
  watchers reached, watch '…/apps/web/scripts/test-relink.sh'`,
  exit 1, curl 5599 = 000. Lock nhả sạch sau 1 s giữ
  (`RELEASED hold_s=1`, 08:55:50Z). Log: `t8-vite-normal-retry.log`.
- Kết luận: **vite thường KHÔNG chạy được trên boot #52** (thiếu
  ~638 watch so với ~1586 cần) — khớp số đo headroom 948. Vite chết
  NGAY, không treo máy.
- T8 KHÔNG đụng vào lock của T6/T1 (không kill vite T6, không xóa
  lock tay) — đúng luật: hàng đợi FIFO là hành vi thiết kế, không
  phải kẹt.
- Ghi chú cho T4 (lock v2): attempt đầu là 1 DEFERRED có chủ đích
  (hàng đợi bận, không phải đói lock) — waiter T8 timeout đúng
  wall-clock; waiter T8 thứ hai chờ 634 s rồi giữ lock bình thường
  (không timeout, không đói); T6 giữ ~13 phút là hold dài nhất quan
  sát được trong đợt 117 tới lúc này — dữ liệu cho điều kiện 1 của T4
  (đánh giá waiter sống dưới tải đợt 117).

### 4.3 Vite tạm `watch.ignored` — boot #52

- Config tạm `t8-vite-tmp.config.mjs` (sao từ S8:
  `server.watch.ignored ["**/**"]`, hmr off). Chạy trong retry nền
  (`t8-vite-retry.sh` attempt B, acquire 900 s).
- **Kết quả: CHẠY ĐƯỢC.** Cooldown cùng-thread 14736 ms sau khi nhả
  attempt A (cơ chế tự động, đúng 15 s); ticket
  `1-1794732965021602726-62997-t8-round117` lúc 08:56:05Z; chờ 322 s
  sau owner T2 (port 5590, ACQUIRED 08:55:53Z); ACQUIRED ~09:01:12Z
  (`wait_s=322`).
- Vite pid 89767 sống, `curl 127.0.0.1:5598` = **200**,
  `curl localhost:5598` = **200**, `ss` cho thấy chỉ listen
  `127.0.0.1:5598` (đúng `--host 127.0.0.1` theo usage-v2).
- Inotify FD: **0** trên pid vite 89767 (đếm qua `/proc/89767/fd`,
  tổng 21 FD) — ghi rõ artifact đo: dòng log in ra kèm dấu `?`
  vì `grep -c` trả exit 1 khi đếm được 0 (fallback `|| echo "?"`
  trong script), số đếm thật là 0, khớp kỳ vọng với
  `watch.ignored ["**/**"]` và khớp đo của S8/R9.
- Sau khi kill vite: curl 5598 = 000, cổng đã đóng sạch; lock nhả
  sạch sau 9 s giữ (`RELEASED hold_s=9`, 09:01:21Z). Log:
  `t8-vite-tmp.log` (+ `t8-vite-tmp-server.log`).
- Kết luận: **vite tạm `watch.ignored` vẫn là đường duy nhất chạy
  vite trên boot #52** — ready, localhost 200, 0 inotify FD.

### 4.4 Thử lại vite (chạy nền) — ĐÃ XONG 09:01:21Z

- Retry nền (`t8-vite-retry.sh`, launch 08:45:14Z) chạy xong cả hai
  attempt lúc 09:01:21Z (tổng ~16 phút, phần lớn là chờ lock):
  attempt A vite thường ENOSPC (§4.2), attempt B vite tạm 200 + 0
  inotify (§4.3). Cả hai attempt đều nhả lock sạch; không còn lock
  hay vite nào của T8 sót lại sau retry (v2 log: TICKET → TIMEOUT →
  TICKET → ACQUIRED 634 s → RELEASED 1 s → COOLDOWN → TICKET →
  ACQUIRED 322 s → RELEASED 9 s).
- Log tổng: `t8-vite-retry-run.log`.

## 5. Khoảng replay #52 — kẹp được bằng dpkg.log: (6'28", 8'44"]

### 5.1 Bằng chứng

- Lúc T8 kiểm (08:38–08:40Z, boot ~9–11'): **không còn tiến trình
  apt-get / dpkg / os-intent nào** (`ps aux` grep — trống). Replay đã
  xong.
- `/var/log/dpkg.log` (chỉ còn log của boot hiện tại — xem §7):
  - Entry đầu tiên sau boot: `2026-11-15 08:35:40 startup packages
    configure` (boot +6'28"); entry thứ hai cùng giây.
  - Install đầu tiên: `08:36:20 install libaspell15` (boot +7'08").
  - Entry cuối cùng: `08:37:56 … gstreamer1.0-tools … installed`
    (boot +8'44").
  - **0 entry nào sau 08:37:56** tới lúc kiểm (08:4xZ) — tổng 1509
    entry, toàn bộ trong 08:35:40–08:37:56.
- `/var/log/apt/history.log`: Start-Date đầu tiên sau boot 08:36:20,
  End-Date cuối cùng 08:37:56. Các package cuối: xfonts-…,
  gstreamer1.0-tools (08:37:54–08:37:56).
- `/var/lib/apt/lists/`: 37 file (đầy đủ như #47/#48); mtime thư mục
  08:36:17 — `apt-get update` của replay xong quanh boot +7'05".
- GST: thư mục thật, 269 file; mtime file là ngày build package nên
  KHÔNG dùng để kẹp — chỉ dpkg.log mới có thời gian cài thật.
- Quy ước mốc boot: 08:29:12Z (btime kernel / `uptime -s`); `stat`
  btime của `/` là 08:29:22Z (chênh 10 s, rootfs mount sau kernel
  boot). Nếu lấy 08:29:22Z thì bracket là (6'18", 8'34"] — T8 lấy
  08:29:12Z làm chuẩn, cùng quy ước harness các boot trước (postboot
  log cũng in boot=08:29:12).

### 5.2 Khoảng và cách đọc

- **Khoảng hoàn thành replay #52: (6'28", 8'44"]** — tức replay xong
  (đủ điều kiện chạy WebKit) trong khoảng từ sau boot 6 phút 28 giây
  tới boot 8 phút 44 giây.
- Phía FAIL (6'28"): suy từ vắng mặt — trước 08:35:40 không có hoạt
  động dpkg nào sau boot; rootfs vừa rebuild nên GST/libs chưa tồn
  tại; postboot tại bất kỳ thời điểm nào trong (boot, 08:35:40] chắc
  chắn FAIL. Đây là suy luận hậu kiểm, KHÔNG phải lần kiểm live.
- Phía PASS (8'44"): entry dpkg cuối cùng — sau đó không còn cài gì
  nữa, nên mọi điều kiện postboot đã đủ từ thời điểm này (và thực tế
  T8 đo PASS lúc boot 10.1' + watcher PASS lúc boot 10.1').
- So sánh 4 boot kẹp được:

  | Boot | Khoảng replay | Cách kẹp | Ghi chú |
  |---|---|---|---|
  | #46 | (1'23", 7'08"] | watcher live (Q7) | |
  | #47 | (22.6', 27.7'] | watcher live (R9) | update ~12' vì mirror chậm |
  | #48 | (0'40", 2'44"] | dpkg.log hậu kiểm (S8) | NHANH NHẤT |
  | **#52** | **(6'28", 8'44"]** | **dpkg.log hậu kiểm (T8)** | **khởi động muộn nhất (+6'28")** |

- **Điểm mới của #52: replay KHỞI ĐỘNG MUỘN.** #48 có hoạt động apt
  đầu tiên ở boot +40s; #52 phải tới +6'28" mới có. Cửa sổ cài đặt
  thì tương đương (2'16" vs 2'04"). Tức độ trễ nằm ở khâu KHỞI ĐỘNG
  replay (trigger/os-intent?), không phải tốc độ cài. Không suy ra
  quy luật chung — 4 boot, 4 tốc độ khác nhau; mỗi boot vẫn cần 1
  bracket riêng. Nợ M8 §9.4 ĐÃ ĐÓNG cho boot #52 (boot thứ 4 liên
  tiếp kẹp được, sau #46/#47/#48).
- Caveat như S8: postboot PASS ≠ replay xong toàn bộ ledger — nhưng
  ở #52, dpkg.log cho thấy KHÔNG còn hoạt động apt nào sau 08:37:56,
  nên lần này replay xong HẲN (toàn bộ ledger) lúc boot +8'44", chứ
  không chỉ đủ 11 package WebKit.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG tồn tại** lúc kiểm
  (08:40Z) → không lock nào đang được giữ (lock v2 là thư mục
  `vite.lock` + file `owner` bên trong; vắng mặt = TRỐNG).
- Thư mục queue `hidden_files/vite.lock.queue` có 15 file cooldown
  (r4-round115, s10-round116, s2, s3-round116, s4-hold2,
  s4-staleprobe, s4-w1/w2/w3/wL/wN, s5, s6, s8-round116) — đều là
  cooldown cũ đã hết hạn từ lâu (mặc định 15 s); file cooldown chỉ
  delay cùng-thread reacquire, không chặn luồng khác, không tính là
  ticket (status báo đúng `0 ticket + 15 cooldown` lúc kiểm).
  T8 KHÔNG xóa (không cần; để T4 — chủ mảng lock — quyết có dọn
  cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối trước T8 là 22:59:19Z (S10 đợt
  116 RELEASED, boot #49); không có entry STALE nào mới; các entry
  TICKET/TIMEOUT của T8 (08:42–08:44Z, port 5599) đều nhả sạch.
- 0 tiến trình vite đang chạy lúc kiểm 08:40Z (trước khi T6 khởi động
  vite 08:42:06Z — vite của T6 là hoạt động hợp lệ của luồng khác,
  không phải stale).
- Cơ chế v2 (`lock_is_stale`): boot_id đổi + đủ điều kiện thì stale
  NGAY không cần chờ STALE_MIN — reboot #52 đã vô hiệu mọi lock
  holder boot #51 (nếu có). Không có lock nào cần dọn tay.
- Phối hợp T4: T4 (lock v2, đợt 117) lo stale detection + 3 điều kiện
  đổi spec; T8 chỉ kiểm thực tế trên đĩa như trên, không đụng script
  lock.

## 7. Boot #49/#50/#51 — postboot + bracket: chỉ còn #49 PASS, còn lại đã mất

- **#49 (21:46:46Z 14/11, boot_id 9c6b5543): postboot PASS — nhờ S10.**
  S10 kiểm check-only live 22:57–22:59Z (boot +1h10'–1h12'), O8 21/21
  cả 2 engine sau đó. Bracket replay #49 KHÔNG kẹp được: không watcher
  nào chạy trên boot này (poller + waiter S10 bị chính reboot #49
  giết), và dpkg.log của #49 đã mất khi sang #50. Cận trên duy nhất:
  PASS trước boot +1h10'14" (22:57:00Z − 21:46:46Z). Không bịa
  bracket chặt hơn.
- **#50 (~02:17Z 15/11, boot_id 6c1a704a): chưa từng có lần
  postboot-check nào.** Chỉ phát hiện qua boot_id đổi ở lượt cron
  09:35 +07 (uptime ~20' lúc 02:36Z). Bracket đã mất cùng log.
- **#51 (~04:31Z 15/11, boot_id d2ee7500): chưa từng có lần
  postboot-check nào.** Chỉ phát hiện qua boot_id đổi ở lượt cron
  12:35 +07 (uptime 1:05 lúc 05:36Z). Bracket đã mất cùng log.
- **Cơ chế mất (đã rõ từ S8 §7, nay xác nhận lần 2):** `dpkg.log`
  (1509 dòng, toàn bộ 08:35:40–08:37:56Z boot #52), `apt/history.log`
  (chỉ còn boot #52), `journalctl --list-boots` (chỉ còn 1 boot) —
  tất cả đều bị rebuild cùng rootfs sau mỗi reboot. Không có file
  rotation (`dpkg.log.1` không tồn tại). Sang boot sau là mất nguồn
  — mọi bracket PHẢI kẹp live trong cùng boot (watcher) hoặc hậu kiểm
  ngay trong boot đó (dpkg.log). Đây là lý do luật đứng watcher v2
  (§3) quan trọng, và là lý do đề xuất R9 (a) vẫn mở.
- Khoảng replay #45 VẪN MỞ vĩnh viễn theo nghĩa thực tế (log đã mất
  từ lâu) — không đổi.

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `f443dc5ff468d389b885b0329a73f492` →
  `32a214bb22190438c5b5c4810f1a7b98` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9/S8, không đổi logic):
  - Header: thêm đoạn boot #49/#50/#51 (đã mất log) + boot #52
    (khoảng dpkg.log + caveat watcher).
  - Dòng `say`: `#48 = 2026-11-14 19:43:46Z, boot_id 0c2a9f2f-…` →
    `#52 = 2026-11-15 08:29:12Z, boot_id
    22536366-8716-46f0-a999-cd4199080854, sau #51 ~04:31Z`.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn PASS,
  exit 0 (`t8-postboot-b52-after-edit.log`).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
  A, R9 §6.3): việc này cần parent duyệt (R9 ghi rõ "cần parent
  duyệt") và T8 không nhận được phê duyệt đó trong task — giữ nguyên
  để parent quyết. `--repair` với code mới (timeout + khóa symlink)
  vẫn CHƯA được chạy sống lần nào.

## 9. Nợ mở sang đợt sau

1. **Đề xuất R9 (a) vẫn mở (nhắc lần 3):** cron chạy watcher v2 ở đầu
   mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt — cần parent
   duyệt triển khai. T8 chứng minh: dù bắt đầu ngay đầu lượt, độ trễ
   spawn subagent (~2.5') vẫn nuốt trọn cửa sổ replay nhanh (~2'16").
   Không có (a), mỗi boot nhanh đều có nguy cơ mất FAIL live.
2. **Headroom tiếp tục rơi: 948 trên boot #52 mới.** Vite thường
   KHÔNG chạy được; giữ vite tạm `watch.ignored` cho mọi O8/vite.
   Trần 63747 cần can thiệp host (ngoài VM) mới tăng được — không
   thuộc tầm luồng này.
3. **`--repair` với code mới (timeout + khóa symlink) CHƯA được chạy
   sống** — cần 1 boot mà replay không chạy + postboot FAIL (tình
   huống #45) để kiểm chứng, hoặc parent duyệt chạy sau khi bracket
   đóng. Đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
   A) chờ parent duyệt.
4. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B (R9 §6.3)
   chờ parent duyệt; tới lúc đó `--repair` chỉ symlink khi apt thất
   bại. Trên boot #52 symlink KHÔNG cần (replay cài thư mục thật).
5. **Mù #35 nay chứa 4 reboot (#49, #50, #51, #52)** nếu chưa đóng —
   việc của luồng probe đợt 117 (T7, probe #36). Các mù #22/#24/#26/
   #28/#29/#30/#31 chờ user quyết (không đổi).
6. **Cooldown file tích lũy (15 file)** — chưa có cơ chế dọn cooldown
   > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock (T4 quyết).
7. **Thử vite #52 (thường + tạm) ĐÃ XONG 09:01:21Z** — vite thường
   ENOSPC (ready 892 ms rồi chết), vite tạm 200 + 0 inotify (§4.2–§4.4).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 116 §10: E4 caveat +
   zombie hướng sửa + điểm gãy tải + lock v2 3 điều kiện + ngưỡng
   WebKit ≤60 ms + ghost stale seq 282–285 + birefnet 0 lần + TTS 39
   CẤM kiểm lại + ci-security.yml 403 chờ user + release gate không
   đổi + KHÔNG push khi user chưa nhắn "push đi".

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi T8 (không đụng production).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. Lock v2
  dùng qua `run-attempt`, TIMEOUT 121 s wall (danh nghĩa 120 s) rồi
  nhả ticket sạch; retry nền đang chờ lượt.
- `bash -n`: postboot-check (sau sửa) OK; watcher v2 bản T8 OK;
  retry script OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng 1143 MB
  < 6 GB).
- O8: KHÔNG thuộc T8 (luồng khác làm).
- Postboot #52: PASS lúc boot ~10.1' (try1) + PASS lại sau sửa script.
- Watcher v2 try#2: try#1 PASS boot 10.1', exit 0 — KHÔNG FAIL live
  (replay xong trước 83 s).
- Replay #52: (6'28", 8'44"] bằng dpkg.log (boot thứ 4 liên tiếp).
- Headroom #52 (boot mới): 948 — reboot KHÔNG hồi (lần 2 có số đo
  boot-mới).
- Stale vite.lock: không có (lock dir vắng mặt, queue chỉ còn cooldown
  cũ đã hết hạn, 0 vite đang chạy lúc kiểm, v2 log không STALE mới).
- Vite thường/tạm #52: CẢ HAI ĐÃ XONG — thường ENOSPC (ready 892 ms,
  chết khi watch `test-relink.sh`, chờ lock 634 s); tạm 200 + 0 inotify
  FD (chờ lock 322 s, cooldown 14736 ms đúng cơ chế).

## 11. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND117_T8_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #48 → #52 + ghi chú #49/#50/#51 đã mất log trong header; không đổi
  logic).
- Harness trong hidden_files (KHÔNG stage): `round117-t8/` (log
  headroom ×3, log postboot try1 + after-edit, log watcher v2 + state,
  md5 trước/sau của postboot-check, `postboot-52-result.txt`,
  config vite tạm, log vite thường + vite tạm + server log + retry
  script/log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round117-t8-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round117-t8.done` (tạo sau khi LIMITS + batch
  xong; retry vite đã xong 09:01:21Z, §4.4 đã bổ sung).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Early-watch v2 cho reboot sau (chạy ở đầu đợt sau reboot — luật đứng):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round117-t8/t8-postboot-early-watch-v2.sh
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
