# PHASE9_ROUND116_S8_INFRA_LIMITS — Hạ tầng: postboot #48 + replay kẹp bằng dpkg.log + headroom + stale vite.lock

> Luồng S8, đợt 116, lượt cron 03:35 +07 15/11/2026 (bắt đầu ~21:02Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 114 §10 mục 8 (postboot + apt replay) + mục 9
> (headroom) + nợ #8 đợt 115 (R9); tiếp nối R9.
> Quyết parent (15/11): phê duyệt đề xuất watcher v2 (b) làm LUẬT ĐỨNG —
> luồng infra đầu tiên sau mỗi reboot chạy watcher v2 ngay. S8 là lần đầu
> luật này được áp dụng.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự reboot
> máy để test. CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Postboot #48: PASS** — kiểm check-only lúc boot ~79' tuổi (21:03:02Z):
   wrapper PASS, libs đủ 5/5, GST thư mục thật 269 file đủ isomp4+libav,
   apt đủ 11/11. `--repair` KHÔNG chạy (không cần — đã PASS). Kết quả đã
   ghi sớm vào `postboot-48-result.txt` cho luồng đo khác (S5) dùng. Xem §2.
2. **Watcher v2 early-run ĐÃ CHẠY ngay đầu lượt (luật đứng mới)** — try#1
   PASS lúc boot 83.3' tuổi, exit 0. Nhưng S8 bắt đầu lúc boot đã ~79'
   tuổi nên watcher KHÔNG có lần FAIL live nào: nó chỉ chứng minh
   "PASS tại lần kiểm đầu (boot 83.3')", KHÔNG kẹp được khoảng chặt.
   Khoảng chặt lấy từ dpkg.log (xem mục 3). Xem §3.
3. **Khoảng replay #48 KẸP ĐƯỢC bằng dpkg.log: (0'40", 2'44"]** — hoạt
   động apt đầu tiên 19:44:26 (boot +40s), cài xong toàn bộ 19:46:30
   (boot +2'44"), 0 entry dpkg/apt nào sau đó tới lúc kiểm (21:0xZ).
   NHANH NHẤT trong 3 boot kẹp được (#46: (1'23", 7'08"]; #47:
   (22.6', 27.7']). Caveat: bracket này là bằng chứng HẬU KIỂM, không
   phải watcher live — phía FAIL suy từ "trước 19:44:26 không có hoạt
   động dpkg nào sau boot" (rootfs rebuild xóa hết, GST chưa tồn tại),
   phía PASS là entry dpkg cuối cùng. Xem §5.
4. **Headroom inotify boot #48: 969 (đầu lượt) → 961 (cuối lượt, drift
   −8 là nhiễu luồng khác).** Tiếp tục rơi so với 1073 cuối #47.
   S8 KHÔNG có số đo "boot mới" cho #48 (bắt đầu lúc boot 79' tuổi)
   nên KHÔNG kết luận được "reboot có hồi headroom không" cho boot
   này — chỉ ghi được xu hướng rơi tiếp. Vite thường ENOSPC (chết khi
   watch `MediaBin.tsx`, exit 1); vite tạm `watch.ignored` vẫn là
   đường duy nhất: ready, localhost 200, 0 inotify FD. Xem §4.
5. **Stale vite.lock: KHÔNG CÓ lock nào sót trên đĩa.** Thư mục lock
   v2 (`hidden_files/vite.lock`) KHÔNG tồn tại (= không lock nào đang
   giữ); queue chỉ còn 1 file cooldown của r4-round115 (18:38:25Z,
   boot #47, cooldown 15 s đã hết từ lâu); 0 tiến trình vite đang
   chạy; log v2 không có STALE nào mới. Cơ chế v2 tự vô hiệu lock cũ
   khi boot_id đổi, nên reboot #48 đã xóa hiệu lực mọi lock boot #47
   (nếu có). S8 không phải dọn gì. Phối hợp S4: S4 đang test v2 trong
   /tmp sandbox (PASS 9/9 ×3 run lúc 21:05–21:06Z), không đụng lock
   thật — không xung đột với kiểm tra của S8. Xem §6.
6. **Khoảng replay #45 VẪN MỞ — và nay đã rõ LÝ DO không còn đóng
   được bằng nguồn hệ thống:** `dpkg.log` và `apt/history.log` đều
   CHỈ CÒN log của boot hiện tại (bắt đầu 19:44:26 / 19:45:01, không
   có rotation, không có entry nào trước boot #48). Log của boot #45
   đã mất theo rootfs rebuild — không còn nguồn nào trong máy để đối
   chiếu. Giữ nguyên "VẪN MỞ", không bịa số. Xem §7.
7. **Cập nhật `postboot-check.sh` (md5 `f56aababe…` → `f443dc5f…`):**
   chỉ đổi tham chiếu boot #47 → #48 (header + dòng `say`); `bash -n`
   OK + chạy kiểm chỉ-đọc lại ra PASS. Không đổi logic. Xem §8.
8. **Reboot #48 = 19:43:46Z, sau #47 = 17:45:50Z, gap #47→#48 =
   1h57'56"** (không phá sàn 19'07"). Mù #34 (mở từ probe #34,
   17:45:02Z) nay chứa 2 reboot (#47 + #48) nếu chưa đóng — việc của
   luồng probe đợt 116, không phải S8.

## 2. Postboot #48 — PASS (check-only, không --repair)

- Boot #48: 2026-11-14 19:43:46Z, boot_id
  `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`, sau #47 = 17:45:50Z.
- Lần kiểm try1: 21:03:02Z (boot ~79.3' tuổi), script bản R9
  (md5 `f56aababe…`), exit 0. Log: `s8-postboot-b48-try1.log`.
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
- Kết quả ghi sớm vào `hidden_files/round116-s8/postboot-48-result.txt`
  lúc 21:03Z để luồng đo khác (S5) không phải chờ S8 xong hẳn.
- Kiểm lại sau khi sửa script (§8): vẫn PASS, exit 0
  (`s8-postboot-b48-after-edit.log`).

## 3. Watcher v2 early-run — chạy ngay theo luật đứng mới

- Luật đứng (quyết parent 15/11): luồng infra đầu tiên sau mỗi reboot
  chạy watcher v2 ngay. S8 chạy bản sao v2 đổi đường dẫn sang
  `round116-s8` (`s8-postboot-early-watch-v2.sh`, `bash -n` OK).
- Kết quả: try#1 PASS lúc 21:07:02Z (boot 83.3' tuổi), watcher exit 0,
  tự dừng. Log: `s8-early-watch-try1.log`, `s8-early-watch-run.log`,
  state: `s8-early-watch-state.md`.
- **Giới hạn ghi rõ:** S8 bắt đầu lúc boot đã ~79' tuổi (lượt cron
  03:35 +07 = 20:35Z, nhưng subagent S8 chỉ bắt đầu chạy ~21:02Z —
  boot #48 xảy ra 19:43:46Z, tức ~1h19' trước khi S8 bắt đầu). Watcher
  do đó KHÔNG quan sát được giai đoạn replay đang chạy và không có
  lần FAIL live nào. Dòng "khoảng replay kẹp được" trong state file
  của watcher đã được S8 đính chính bằng tay: watcher chỉ chứng minh
  PASS tại lần kiểm đầu; khoảng chặt lấy từ dpkg.log (§5).
- Bài học vận hành: luật đứng (b) phụ thuộc luồng infra được spawn
  đúng lúc — reboot xảy ra giữa 2 lượt cron (lượt trước 00:35 +07,
  lượt này 03:35 +07) thì lần đo sớm nhất vẫn muộn ~1–3 h sau boot.
  Đề xuất R9 (a) — cron chạy watcher v2 ở ĐẦU mỗi lượt với cờ
  `--wait-new-boot` — vẫn là phương án tốt hơn cho reboot giữa lượt,
  vì cron chạy đều 3 h/lượt và watcher tự chờ boot mới. Việc này vẫn
  cần parent duyệt triển khai (R9 chỉ đề xuất, S8 nhắc lại, KHÔNG tự
  gắn cron).

## 4. Headroom inotify + vite (boot #48)

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 114 Q7 cuối lượt (boot #46) | 1207 | cuối đợt 114 |
| R9 đầu lượt (boot #46) | 1094 | trước thử vite |
| R9 boot #47 mới (boot ~2' tuổi) | 1092 | reboot KHÔNG hồi headroom |
| R9 boot #47 sau replay PASS | 1073 | cuối R9 |
| **S8 đầu lượt, 21:03Z (boot #48, ~79' tuổi)** | **969** | trước thử vite |
| **S8 cuối lượt, ~21:09Z (boot #48, ~85' tuổi)** | **961** | sau thử vite; drift −8 là nhiễu luồng khác |

- Xu hướng #42→#48: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → 1300 (boot #46 mới) → 1207 → 1094 → 1103 → 1092 (boot #47 mới)
  → 1073 → **969 → 961 (boot #48)**. Rơi liên tiếp, chưa từng hồi.
- **Caveat quan trọng:** S8 KHÔNG đo headroom lúc boot #48 mới
  (không có mặt lúc đó) nên KHÔNG thể tách "reboot không hồi" khỏi
  "các luồng đợt 116 đã ăn watch trong 79 phút đầu boot". Kết luận
  đúng cho #48 chỉ là: headroom tiếp tục rơi (1073 → 969) và vẫn
  thấp hơn nhiều so với ~1586 vite thường cần. Muốn chứng minh
  "reboot không hồi" lần 3 cần số đo boot mới — chỉ watcher/cron đầu
  lượt mới bắt được (xem §3).
- RAM khả dụng lúc đo cuối: **683 MB** — vẫn < 6 GB, birefnet không
  thử (đứng theo LIMITS gộp).
- Log: `s8-headroom-b48-now.log`, `s8-headroom-b48-end.log`.

### 4.2 Thử vite THƯỜNG (config repo, không watch.ignored) — boot #48

- Lock v2: `run-attempt s8-round116 5599 60 30 normal` — acquire 0 s,
  release sạch sau 1 s; status sau thử: TRỐNG. Log:
  `s8-vite-normal.log`.
- Lệnh: `timeout 30 vite --port 5599 --strictPort` (cwd `apps/web`,
  binary `repo-1/node_modules/.bin/vite`).
- Kết quả: vite lên **"ready in 343 ms"** rồi **CHẾT vì ENOSPC** khi
  chokidar bắt đầu watch:
  `Error: ENOSPC: System limit for number of file watchers reached,
  watch '…/apps/web/src/MediaBin.tsx'`, exit 1, curl 5599 = 000.
  Vite chết NGAY, không treo máy.
- Kết luận: **vite thường KHÔNG chạy được trên boot #48** (thiếu
  ~617 watch so với ~1586 cần). Vite tạm `watch.ignored` vẫn bắt buộc.

### 4.3 Vite tạm `watch.ignored` — boot #48

- Config tạm `s8-vite-tmp.config.mjs` (sao từ R9: `server.watch.ignored
  ["**/**"]`, hmr off). Lock v2 `run-attempt s8-round116 5598 60 30
  normal`; vite chạy dưới `timeout 45` nên job exit 124 theo kế
  hoạch; lock release sạch, status TRỐNG sau thử. Log:
  `s8-vite-tmp.log`.
- Kết quả: vite ready, `ss` cho thấy chỉ listen **`[::1]:5598`**
  (IPv6 localhost), `curl localhost:5598` = **200**,
  `curl 127.0.0.1:5598` = 000 — đúng artifact đo đã biết từ R9 §4.2
  (vite bind `localhost` → `::1` trên máy này), không phải vite hỏng.
- Inotify FD: đếm trên pid pgrep được (36126) = 3 FD, 0 inotify —
  ghi rõ caveat: listener thực theo `ss` là pid 36206, S8 không đếm
  kịp FD của đúng pid đó trước khi `timeout 45` giết vite; với
  `watch.ignored ["**/**"]` thì 0 inotify là kết quả kỳ vọng và khớp
  đo của R9 (0 inotify FD). Không kết luận quá mức từ một pid.
- Sau khi vite chết: curl 5598 = 000, cổng đã đóng sạch.

## 5. Khoảng replay #48 — kẹp được bằng dpkg.log: (0'40", 2'44"]

### 5.1 Bằng chứng

- Lúc S8 kiểm (21:03Z, boot ~79'): **không còn tiến trình apt-get /
  dpkg / os-intent nào** (`ps aux` grep — trống). Replay đã xong từ
  lâu.
- `/var/log/dpkg.log` (chỉ còn log của boot hiện tại — xem §7):
  - Entry đầu tiên sau boot: `2026-11-14 19:44:26 startup packages
    configure` (boot +40s); entry thứ hai 19:44:27.
  - Install đầu tiên: `19:45:01 install libaspell15` (boot +1'15").
  - Entry cuối cùng: `19:46:30 … gstreamer1.0-tools … installed`
    (boot +2'44").
  - **0 entry nào sau 19:46:30** tới lúc kiểm (21:0xZ) — tổng 1509
    entry, toàn bộ trong 19:44:26–19:46:30.
- `/var/log/apt/history.log`: Start-Date đầu tiên sau boot 19:45:01,
  End-Date cuối cùng 19:46:30. Các package cuối: libwoff1,
  xfonts-cyrillic, xfonts-scalable (19:46:26–19:46:29),
  gstreamer1.0-tools (19:46:30).
- `/var/lib/apt/lists/`: 37 file (đầy đủ như #47); mtime thư mục
  19:44:58 — `apt-get update` của replay xong quanh boot +1'12"
  (nhanh, khác #47 mất ~12 phút vì mirror chậm).
- GST: thư mục thật, 269 file; mtime file là ngày build package
  (2024/2026-11-04) nên KHÔNG dùng để kẹp — chỉ dpkg.log mới có
  thời gian cài thật.

### 5.2 Khoảng và cách đọc

- **Khoảng hoàn thành replay #48: (0'40", 2'44"]** — tức replay xong
  (đủ điều kiện chạy WebKit) trong khoảng từ sau boot 40 giây tới
  boot 2 phút 44 giây.
- Phía FAIL (0'40"): suy từ vắng mặt — trước 19:44:26 không có hoạt
  động dpkg nào sau boot; rootfs vừa rebuild nên GST/libs chưa tồn
  tại; postboot tại bất kỳ thời điểm nào trong (boot, 19:44:26] chắc
  chắn FAIL. Đây là suy luận hậu kiểm, KHÔNG phải lần kiểm live.
- Phía PASS (2'44"): entry dpkg cuối cùng — sau đó không còn cài gì
  nữa, nên mọi điều kiện postboot đã đủ từ thời điểm này (và thực tế
  S8 đo PASS lúc boot 79' + watcher PASS lúc boot 83.3').
- So sánh 3 boot kẹp được:

  | Boot | Khoảng replay | Ghi chú |
  |---|---|---|
  | #46 | (1'23", 7'08"] | watcher live (Q7) |
  | #47 | (22.6', 27.7'] | watcher live (R9); update ~12' vì mirror chậm |
  | **#48** | **(0'40", 2'44"]** | **dpkg.log hậu kiểm (S8); NHANH NHẤT** |

- Ba boot, ba tốc độ khác nhau (7' → 28' → 3') — không suy ra quy
  luật chung; mỗi boot vẫn cần 1 bracket riêng. Nợ M8 §9.4 ĐÃ ĐÓNG
  cho boot #48 (boot thứ 3 liên tiếp kẹp được, sau #46/#47).
- Caveat như R9: postboot PASS ≠ replay xong toàn bộ ledger — nhưng
  ở #48, dpkg.log cho thấy KHÔNG còn hoạt động apt nào sau 19:46:30,
  nên lần này replay xong HẲN (toàn bộ ledger) lúc boot +2'44", chứ
  không chỉ đủ 11 package WebKit. Đây là điểm khác #47 (lúc PASS,
  apt vẫn đang chạy package ngoài WebKit).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG tồn tại** → không
  lock nào đang được giữ (lock v2 là thư mục `vite.lock` + file
  `owner` bên trong; vắng mặt = TRỐNG). `status` của script v2 sau
  mỗi thử vite của S8 đều báo TRỐNG.
- Thư mục queue `hidden_files/vite.lock.queue` chỉ còn 1 file:
  `cooldown-r4-round115` (nội dung `1794681505329` = 18:38:25Z,
  boot #47). Cooldown v2 mặc định 15 s — đã hết từ lâu; file này là
  dấu vết vô hại, không chặn ai (script v2 chỉ đếm ticket, không đếm
  file cooldown — đã sửa từ đợt 116 S4). S8 KHÔNG xóa (không cần;
  để S4 — chủ mảng lock — quyết có dọn cooldown cũ không).
- `vite-lock-v2.log`: hoạt động cuối 18:38:25Z (r4-round115 RELEASED,
  boot #47); không có entry STALE nào mới; các entry TICKET/ACQUIRED/
  RELEASED của S8 (21:07–21:08Z, port 5599/5598) đều release sạch.
- 0 tiến trình vite đang chạy lúc kiểm (trước và sau thử của S8).
- Cơ chế v2 (`lock_is_stale` trong `vcut-vite-lock-v2.sh`): boot_id
  đổi + đủ điều kiện thì stale NGAY không cần chờ STALE_MIN — reboot
  #48 đã vô hiệu mọi lock holder boot #47 (nếu có). Không có lock
  nào cần dọn tay.
- Phối hợp S4: thư mục `round116-s4` có `test-v2-after-600.log`
  (21:05–21:06Z): S4 test v2 trong /tmp sandbox riêng (PASS 9/9 ×3
  run), không đụng lock thật trong hidden_files. Hai luồng không
  xung đột. S4 lo stale detection của v2 (mảng của S4); S8 chỉ kiểm
  thực tế trên đĩa như trên.

## 7. Khoảng replay #45 — VẪN MỞ (nay đã rõ lý do không đóng được)

- `dpkg.log` hiện tại: 1509 dòng, entry đầu tiên
  `2026-11-14 19:44:26` — tức CHỈ CÒN log của boot #48. Không có
  file rotation (`dpkg.log.1` không tồn tại).
- `apt/history.log` hiện tại: Start-Date đầu tiên `2026-11-14
  19:45:01` — cũng chỉ còn boot #48.
- Kết luận: **cả hai log hệ thống đều bị rebuild cùng rootfs sau mỗi
  reboot** — log của boot #45 đã mất, không còn nguồn nào trong máy
  để đối chiếu (đây là phát hiện mới của S8; R9 chỉ ghi "đã thử hết
  nguồn" mà chưa nêu rõ cơ chế mất log). Khoảng replay #45 giữ nguyên
  VẪN MỞ, không bịa số. Muốn đóng #45 thì cần nguồn ngoài máy (không
  có) — coi như không đóng được nữa, trừ khi user có log khác.
- Hệ quả cho tương lai: mọi bracket replay PHẢI kẹp live trong cùng
  boot (watcher) hoặc hậu kiểm ngay trong boot đó (dpkg.log) — sang
  boot sau là mất nguồn. Đây là lý do luật đứng watcher v2 (§3) quan
  trọng.

## 8. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

- md5 trước/sau: `f56aababeebfd61b8e296c60558aad02` →
  `f443dc5ff468d389b885b0329a73f492` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu Q7/R9, không đổi logic):
  - Header: thêm đoạn boot #48 (khoảng dpkg.log + caveat watcher).
  - Dòng `say`: `#47 = 2026-11-14 17:45:50Z, boot_id 5578af38-…` →
    `#48 = 2026-11-14 19:43:46Z, boot_id
    0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0, sau #47 = 17:45:50Z`.
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc sau sửa vẫn PASS,
  exit 0 (`s8-postboot-b48-after-edit.log`).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
  A, R9 §6.3): việc này cần parent duyệt (R9 ghi rõ "cần parent
  duyệt") và S8 không nhận được phê duyệt đó trong task — giữ nguyên
  để parent quyết. `--repair` với code mới (timeout + khóa symlink)
  vẫn CHƯA được chạy sống lần nào.

## 9. Nợ mở sang đợt sau

1. **Khoảng replay #48 — ĐÃ KẸP ĐƯỢC (0'40", 2'44"] bằng dpkg.log;
   M8 §9.4 ĐÃ ĐÓNG cho boot này (boot thứ 3 liên tiếp).** Khoảng
   replay #45 VẪN MỞ vĩnh viễn theo nghĩa thực tế (§7 — log đã mất).
   Đợt sau sau reboot: vẫn chạy watcher v2 early-run ngay (luật đứng
   đã duyệt); cân nhắc thêm đề xuất R9 (a): cron chạy watcher v2 ở
   đầu mỗi lượt với `--wait-new-boot` để bắt reboot giữa lượt — cần
   parent duyệt triển khai.
2. **Headroom tiếp tục rơi: 969 → 961 trên boot #48.** Vite thường
   KHÔNG chạy được; giữ vite tạm `watch.ignored` cho mọi O8/vite.
   Cần 1 số đo boot-mới ở boot sau để kết luận "reboot có hồi không"
   lần 3 (S8 không có số đó cho #48). Trần 63747 cần can thiệp host
   (ngoài VM) mới tăng được — không thuộc tầm luồng này.
3. **`--repair` với code mới (timeout + khóa symlink) CHƯA được chạy
   sống** — cần 1 boot mà replay không chạy + postboot FAIL (tình
   huống #45) để kiểm chứng, hoặc parent duyệt chạy sau khi bracket
   đóng. Đổi thứ tự mục apt trước mục GST trong `--repair` (phương án
   A) chờ parent duyệt.
4. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B (R9 §6.3)
   chờ parent duyệt; tới lúc đó `--repair` chỉ symlink khi apt thất
   bại. Trên boot #48 symlink KHÔNG cần (replay cài thư mục thật).
5. **Mù #34 nay chứa 2 reboot (#47 + #48)** nếu chưa đóng — việc của
   luồng probe đợt 116 (đối chiếu từ mốc probe #34, 17:45:02Z;
   gap #47→#48 = 1h57'56" là cận trên mới). Các mù #22/#24/#26/#28/
   #29/#30/#31 chờ user quyết (không đổi).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 114 §10: G1 + E4
   caveat + zombie hướng sửa + điểm gãy tải + lock fairness v2
   migration + ngưỡng WebKit ≤60 ms + ghost stale seq 282–285 +
   birefnet 0 lần + TTS 39 CẤM kiểm lại + ci-security.yml 403 chờ
   user + release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi S8 (không đụng production).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. Lock v2
  dùng qua `run-attempt`, acquire/release sạch cả 2 thử vite.
- `bash -n`: postboot-check (sau sửa) OK; watcher v2 bản S8 OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng 683 MB
  < 6 GB).
- O8: KHÔNG thuộc S8 (luồng khác làm).
- Postboot #48: PASS lúc boot ~79' (try1) + PASS lại sau sửa script.
- Vite thường boot #48: ENOSPC, exit 1 (chết ngay, không treo).
  Vite tạm boot #48: ready, localhost 200, 0 inotify FD (caveat pid
  §4.3).
- Stale vite.lock: không có (lock dir vắng mặt, queue chỉ còn
  cooldown cũ đã hết hạn, 0 vite đang chạy).

## 11. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND116_S8_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #47 → #48 + bracket #48 trong header; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round116-s8/` (log
  headroom ×2, log postboot try1 + after-edit, log vite thường/tạm,
  log watcher v2 + state, md5 trước/sau của postboot-check,
  `postboot-48-result.txt`, config vite tạm).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round116-s8-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round116-s8-done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Early-watch v2 cho reboot sau (chạy ở đầu đợt sau reboot — luật đứng):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round116-s8/s8-postboot-early-watch-v2.sh
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```
