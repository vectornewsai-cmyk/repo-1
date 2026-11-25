# PHASE9 ROUND169 T6 — (A) KIỂM CHỨNG LẠI 120/120 PASS DƯỚI CHURN (LẦN THỨ 19 LIÊN TIẾP) + #76/#77? KHÔNG GIẾT HOLDER + prune lần 44: XÓA 1 FILE — LIMITS

- Đợt: 169, luồng T6 (kiểm sức khỏe lock vite v2 + kiểm lại
  phương án (A) cho test flaky T7 + prune).
  Lượt cron 15:35 +07 22/11/2026 (= 08:35:51Z). Chạy
  08:42Z → 08:53Z 22/11/2026. Lúc mở đã ở trên boot
  `c44cc3ba` (btime 08:23:52Z) — boot này là #77? theo brief
  giao (btime 08:23:52Z, ứng viên); T6 TỰ XÁC MINH btime
  08:23:52Z từ /proc/stat + `uptime -s` (cả hai khớp) nhưng
  KHÔNG tự chứng nhận số hiệu #77 (thuộc T0-169), chỉ chứng
  nhận từ log lock rằng #76/#77? KHÔNG giết holder (xem
  §2/§8); KHÔNG có reboot trong phiên T6.
- Nhiệm vụ (brief giao): (a) kiểm chứng lại (A) 120/120
  PASS dưới churn (lần thứ 19 liên tiếp nếu đạt — tổng
  2280/2280); ghi chuỗi xanh kép + chuỗi suite xanh mới;
  (b) lock: đếm ACQUIRED/RELEASED lúc kiểm cuối, 0 đang
  giữ; double-acquire GIỮ 12, STALE-LOCK GIỮ 12 (0 mới cả
  hai kỳ vọng); (c) reboot #76 CÓ giết holder không (lock
  trống trước btime #76 bao lâu — chuỗi "không giết holder"
  mới từ #69 đang 7 reboot #69–#75; #76 → 8 nếu không giết)
  và #77 (lock trống trước btime #77 ứng viên 08:23:52Z —
  TỰ xác minh btime); #68 GIẾT holder vẫn là phát hiện đợt
  165 — tham chiếu; (d) prune lần 44 theo đúng quy tắc
  prune các đợt trước (điều (b) theo tuổi cooldown, queue
  101 → 100 file); ghi rõ file nào bị xóa, tuổi, điều áp
  dụng; prune KHÔNG phải chờ lock (ghi rõ); (e) trần
  inotify lúc kiểm; F-147-T6-1 nối lại nếu còn đúng;
  (f) ghi sai số của chính mình (F-169-T6-n) trung thực.
- **KẾT QUẢ CHÍNH — ĐỌC TRƯỚC (§5–§7): (A) CÒN NGUYÊN
  (suite md5 `a89c0676` không đổi, live-code khối T7
  `c92f2efff2080fbe6712522343e9e400` khớp đúng đợt 151–168,
  file khối đã trích md5 `dc973443030249a262ff63cbc62231d5`
  giống hệt đợt 151–168); kiểm chứng lại DƯƠNG TÍNH:
  khối T7 trích verbatim chạy 120 lần với churn bơm vào —
  PASS 120/120 (100%), B1=1 B2=0 cả 120 lần; suite đầy đủ 9/9 × 6
  lượt. Lock KHỎE VỀ CƠ CHẾ (562 cặp ACQUIRED→RELEASED lúc
  kiểm cuối, 0 TIMEOUT mới, 0 "KHÔNG NHẢ", 0 đang giữ lúc
  kiểm cuối) — double-acquire GIỮ 12, STALE-LOCK GIỮ 12
  (0 ca mới cả hai). Reboot #76 KHÔNG giết holder (lock
  trống 53m10s trước btime — chuỗi "không giết holder" mới
  từ #69 lên 8 reboot); #77? KHÔNG giết holder (lock trống
  1h44m39s — số hiệu chưa được T6 chứng nhận, thuộc T0-169).
  Prune lần 44: xóa 1 file cũ nhất (điều (b)), queue 101 →
  100 file — KHÔNG PHẢI CHỜ lock (lock TRỐNG lúc mở, lúc
  đóng và ngay trước prune — giống đợt 167/168).**
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1, R9,
  `.github/workflows/*`. Không sửa production, không sửa
  script lock (bản `520b8baa` giữ nguyên), KHÔNG sửa
  `vcut-poll-quiet-v2.sh` (bản `1710e480` giữ nguyên),
  KHÔNG sửa suite đợt này (md5 `a89c0676` giữ nguyên —
  đợt này chỉ kiểm lại). Không sửa preview.tsx (530e10a7 giữ
  vĩnh viễn — chỉ đọc md5 để kiểm, §0/§9).
- Thư mục làm việc: `hidden_files/round169-t6/` (ps-full-open.txt,
  ps-full-close.txt, ss-open.txt, ss-close.txt, x11-open.txt,
  x11-close.txt, boot-verify-open.txt, boot-verify-close.txt,
  boot-verify-final.txt, time-open.txt, time-close.txt, queue-open.txt,
  queue-oldest-open.txt, prune-candidates.txt,
  vite-lock-v2-cleaned-open.log, vite-lock-v2-cleaned-close.log,
  vite-lock-v2-cleaned-final.log, vite-lock-v2-raw-open.log,
  vite-lock-v2-raw-close.log, vite-lock-v2-raw-final.log,
  analyze-log-cleaned-open.txt, analyze-log-cleaned-close.txt,
  analyze-log-cleaned-final.txt, analyze-log.py,
  new-lines-since-t6-168.txt, prune-deleted.txt, prune-time.txt,
  suite-start.txt, suite-end.txt, harness-start.txt,
  harness-end.txt, inotify-open.txt, inotify-close.txt,
  status-open.txt, status-close.txt, status-before-prune.txt,
  status-final.txt,
  test-v2-t6-run1.log … run6.log, t7-control-a169.sh,
  t7-block-a169.sh,
  t7-a169-churn.log, t7-control-a169.stdout.log, md5-open.txt, md5-close.txt, md5-final.txt,
  appendix-numbers.txt).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).

## 0. Trạng thái lúc bắt đầu — BOOT c44cc3ba (btime 08:23:52Z); lock TRỐNG; queue 101 file (khớp T10-168 đóng + 1 file mới)

- **Boot lúc mở và lúc đóng: boot_id
  `c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7`, btime 08:23:52Z
  theo /proc/stat** (epoch 1795335832; `uptime -s` =
  08:23:52; `journal --list-boots` chỉ 1 dòng c44cc3ba,
  first entry 08:24:04Z). Uptime ~18' lúc T6 bắt đầu
  (08:42Z), ~29' lúc snapshot đóng (08:52Z). Boot này là
  #77? theo brief giao (btime 08:23:52Z, ứng viên, ngay
  trước khi đợt mở 08:35:51Z đúng 11m59s) — **T6 TỰ XÁC
  MINH btime 08:23:52Z** (hai nguồn độc lập /proc/stat +
  `uptime -s` khớp nhau) nhưng **KHÔNG tự chứng nhận số
  hiệu #77** (thuộc T0-169/T2-169); T6 chỉ chứng nhận từ
  log lock rằng #76/#77? KHÔNG giết holder (xem §2/§8).
  **KHÔNG có reboot trong phiên T6** (boot_id giống nhau
  lúc mở, lúc đóng và lúc kiểm cuối sau prune).
- Chốt chặn: file `round-in-progress.md` KHÔNG tồn tại lúc
  mở (gate qua — chạy bình thường).
- Đồng hồ: T6 tự kiểm lúc mở — Cloudflare `Date:
  Sun, 22 Nov 2026 08:42:10 GMT` vs local 08:42:09Z
  (**chênh ~1 s — đồng hồ ở giờ thật**, trong đó có độ trễ
  fetch curl ~1–2 s); lúc đóng Cloudflare 08:52:10Z vs
  local 08:52:09Z (chênh ~1 s — cùng họ lúc mở, không phải
  lệch đồng hồ). Các mốc wall đợt 169 đọc trực tiếp được.
- Script lock v2 lúc mở: md5 `520b8baa` (không đổi) — v1
  frozen `fd21193c`, poll `1710e480`, khớp baseline.
  Suite test lúc mở `a89c0676` (bản (A) đợt 151, không
  đổi). preview.tsx md5 `530e10a7` (giữ vĩnh viễn, khớp) —
  đường dẫn đúng là `apps/web/src/preview.tsx`.
  Lưu ý phương pháp: `md5-open.txt`/`md5-close.txt`/
  `md5-final.txt` đều là đo tươi từ đĩa bằng `md5sum`
  trực tiếp (không copy file md5 qua lại — bài học
  F-163-T6-1); cả ba khớp nhau từng hash, xem §9.
- Queue lúc mở: **101 file / 1414 byte** — khớp số học
  từ T10-168 đóng: 100 sau prune 43 + 1 file cooldown mới
  `cooldown-t8-round168`, mtime 06:39:13Z (§2). File
  `cooldown-t4` được ghi đè mtime mới 06:05:38Z (chu kỳ t4
  mới, §2) — ghi đè tại chỗ, không đổi số lượng.

## 1. Quét zombie: 0 zombie lúc mở và lúc đóng; 0 vite thật của T6; X11 trống lúc mở, 3 socket luồng khác lúc đóng

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:42Z
  (mở, `ps-full-open.txt`, chỉ 10 dòng — boot mới 18',
  các luồng khác chưa khởi động process nào lúc đó; xem
  ghi chú dưới) và lúc 08:52Z
  (đóng, `ps-full-close.txt`, 36 dòng).
- **Lúc mở và lúc đóng: 0 zombie** (`awk` trên cột STAT
  của cả hai snapshot = 0).
- **Lúc mở: 0 vite thật đang chạy** — `ss -tlnp` trống
  hoàn toàn; 0 dòng chứa chuỗi "vite" trong snapshot ps
  lúc mở (ngoại trừ lệnh exec của chính T6 — đã lọc
  `grep -v round169-t6`).
  **Lúc đóng: 0 vite thật của T6** — T6 không khởi động
  Xvfb/vite nào, không kill process nào trong phiên này.
  Vite của T4-169 (attempt1, port 5187, xem §2/§4) chạy
  trong phiên nhưng đã RELEASED lock trước snapshot đóng
  (08:48:56Z) — T6 không đụng tới process này.
- **Lúc mở: `/tmp/.X11-unix/` trống** (reboot #77? đã dọn
  sạch 3 socket X193/X194/X195 của đợt 168 — T6-168 đã xác
  nhận 3 socket đó lúc đóng đợt 168).
  **Lúc đóng: 3 socket X193 / X194 / X195, tạo 08:49:19Z** —
  của một luồng khác đợt 169 (khởi động Xvfb trong phiên;
  T6 không khởi động Xvfb/vite nào, không đụng tới các
  process này). Đây là lần thứ mười liên tiếp
  cùng 3 số display X193/X194/X195 — xem quyết (bb) đợt 163.
- **Watcher: lúc mở CHƯA CÓ watcher nào** (ps lúc mở chỉ
  10 dòng: systemd + journald + hatch daemon/execd + các
  shell exec đồng thời — 0 dòng watcher; các luồng đợt 169
  chưa khởi động process nào).
  **Lúc đóng: `b2-watcher.sh` pid 19123 (round169-t9) có
  mặt** — khởi động trong phiên, sau snapshot mở của T6;
  T6 không khởi động watcher nào. Watcher-168 pid 13133
  (aggregate 168) đã chết theo reboot #76 — T6 chỉ ghi
  nhận sự vắng mặt, giao T5-169 xác nhận vòng đời watcher.
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-169).
  Inotify: `max_user_watches` = **63747** lúc mở và lúc
  đóng (~08:42Z và ~08:52Z) — **GIỐNG trần trên #69, #70,
  #71, #73, #74, #75 và #76** (theo T9-168/T6-168); khác
  63756 trên #67 (T6-164 đo) — xem §11, ghi nhận, không
  hành động.
- Tải hệ thống trong phiên: các luồng đợt 169 khởi động
  dần (T4 attempt1 08:44Z, Xvfb 08:49:19Z của luồng khác)
  — harness churn vẫn 120/120 (xem §6).
  Suite đợt này chạy 21–25 s/lượt (tương đương đợt 168:
  22–34 s/lượt; đợt này đều và nhanh hơn chút).

## 2. Lock lúc mở: TRỐNG; +29 dòng kể từ T6-168 đóng — TẤT CẢ SẠCH, 8 CHU KỲ MỚI HOÀN TẤT TRƯỚC PHIÊN + 1 CHU KỲ TRONG PHIÊN; #76/#77? KHÔNG GIẾT HOLDER (PHÁT HIỆN MỚI)

- **Lúc mở (08:42Z): lock TRỐNG** — status
  `TRỐNG (không có lock)`, `0 ticket + 101 cooldown`,
  rc=0.
- **Lúc snapshot đóng (08:52Z): lock vẫn TRỐNG** — status
  `TRỐNG`, `0 ticket + 101 cooldown` (trước prune).
  **Prune KHÔNG PHẢI CHỜ** (xem §7): lock trống lúc mở,
  lúc đóng và ngay trước prune (`status-before-prune.txt`
  08:52Z) — giống đợt 167/168, khác đợt 166 phải chờ T4-166.
- **Log lock +29 dòng kể từ T6-168 đóng** (raw 1972 lúc
  T6-168 đóng → 2001 lúc T6-169 mở → 2004 lúc snapshot
  đóng → 2004 lúc kiểm cuối): 29 dòng trước phiên T6;
  **+3 dòng trong phiên T6-169** (1 chu kỳ t4 hoàn tất —
  xem dưới; suite chạy trên log riêng trong /tmp, harness
  chạy trên /tmp — không dòng nào trong 3 dòng này là
  của T6).
- Đối chiếu 29 dòng trước phiên (khớp đúng từng dòng, file
  `new-lines-since-t6-168.txt`, dòng thô 1973–2001):
  - t4: 3 dòng — 1 chu kỳ (attempt 06:02:10Z → RELEASED
    06:05:38Z, hold 207 s) — t4 đợt 168 tiếp tục sau khi
    T6-168 đóng. File `cooldown-t4` ghi đè mtime mới
    06:05:38Z (không đổi số lượng queue).
  - t8-round168: 26 dòng — 7 chu kỳ bắt đầu (06:20:48Z →
    06:35:23Z); **7 chu kỳ HOÀN TẤT** (holds 156 / 70 /
    131 / 241 / 60 / 121 / 230 s; 5 dòng COOLDOWN kèm theo,
    các lần chờ 14938–14966 ms trên cổng 5490/5390); 0 chu kỳ
    dở dang. Chu kỳ hold 241 s (06:27:35Z → 06:31:36Z) là pha
    dài nhất trong 7 chu kỳ — lock vẫn RELEASED bình thường
    sau đó, không bị giết.
  - Tổng trước phiên: Δ TICKET +8, Δ ACQUIRED +8, Δ RELEASED +8,
    Δ COOLDOWN +5, Δ STALE-LOCK +0, Δ STALE-TICKET +0,
    Δ TIMEOUT +0 (khớp §4). **8/8 chu kỳ mới hoàn
    tất sạch; 0 chu kỳ dở dang.**
- **3 dòng trong phiên T6-169 (dòng thô 2002–2004) — 1 chu
  kỳ t4 của T4-169, HOÀN TẤT SẠCH:** TICKET 08:44:34Z →
  ACQUIRED 08:44:34Z (wait 0 s) → RELEASED 08:48:56Z
  (hold 262 s). T4-169 attempt1 giữ lock trong phiên T6
  nhưng đã nhả xong trước snapshot đóng của T6 (08:52Z)
  — lock TRỐNG lúc đóng, prune không phải chờ (xem §7).
  Tổng trong phiên: Δ TICKET +1, Δ ACQUIRED +1,
  Δ RELEASED +1, Δ COOLDOWN +0 — khớp §4.
- **REBOOT #76 (btime 07:32:23Z 22/11, boot `f2b97695` —
  số hiệu ĐÃ ĐƯỢC XÁC NHẬN ở quyết (d) đợt 168: T7-168
  xác minh 9 nguồn trong phiên, parent quyết §12.3
  aggregate 168) — KHÔNG giết holder nào (PHÁT HIỆN MỚI
  CỦA T6-169):** dòng lock cuối trước reboot là
  t8-round168 RELEASED 06:39:13Z (hold 230 s, số học khớp);
  dòng đầu sau reboot: KHÔNG CÓ (0 dòng log sau 06:39:13Z
  tới lúc T6-169 mở) — tức lock trống
  **53m10s (3.190 s) trước reboot**. Không có ACQUIRED nào chưa
  release tại thời điểm #76, không có dòng STALE-LOCK mới nào
  sau #76 (STALE-LOCK vẫn 12 — ca mới nhất là ca #68 lúc
  19:16:47Z 21/11, TRƯỚC #76), still held = 0 lúc T6-169 mở, lock
  TRỐNG xác minh độc lập lúc mở 08:42Z.
  **Kết luận: #76 không giết holder nào — verdict sạch
  (khoảng trống 3.190 s). Chuỗi "không giết holder" mới
  bắt đầu từ #69 lên 8 reboot (#69–#76).**
- **REBOOT #77? (btime 08:23:52Z 22/11, boot `c44cc3ba` —
  số hiệu CHƯA được T6 chứng nhận, thuộc T0-169; btime
  TỰ XÁC MINH bởi T6: /proc/stat btime 1795335832 +
  `uptime -s` 08:23:52Z khớp nhau) — KHÔNG giết holder
  nào (PHÁT HIỆN MỚI CỦA T6-169):** dòng lock cuối trước
  reboot là t8-round168 RELEASED 06:39:13Z (hold 230 s) —
  cùng dòng cuối như #76; dòng đầu sau reboot: KHÔNG CÓ
  (0 dòng log sau 06:39:13Z tới lúc T6-169 mở) — tức lock
  trống **1h44m39s (6.279 s) trước reboot**. Không có
  ACQUIRED nào chưa release tại thời điểm #77?, 0 STALE-LOCK
  mới sau #77?.
  **Kết luận: #77? không giết holder nào — verdict sạch
  (khoảng trống 6.279 s — dài thứ hai trong chuỗi mới từ
  #69, sau #74 với 12.359 s; số hiệu #77 chờ T0-169 xác
  nhận.)**
- **Gap #76→#77? = 3.089 s** (51m29s; 07:32:23Z →
  08:23:52Z — số hiệu #77 chờ T0-169 xác nhận).
  **Gap #75→#76 = 7.177 s — T6-169 kiểm lại độc lập từ
  btime, KHỚP quyết (d) đợt 168** (1795332743 −
  1795325566 = 7177).
- **File cooldown mới kể từ T6-168 đóng:
  `cooldown-t8-round168` (mtime 06:39:13Z)** — file duy
  nhất làm tổng queue tăng 100 → 101. Số học khớp:
  100 + 1 = 101 ✓. File mới là file đợt 168 (đợt ngay
  trước) nên được bảo vệ bởi điều (c) — đồng thời là
  file mới nhất nên không nằm trong diện xóa của điều
  (b) trong bất kỳ trường hợp nào.

## 3. Không đổi script lock đợt này — thứ tự mới đợt 135 đã có 296 chu kỳ thật chứng minh

- Script v2 giữ `520b8baa` (đổi thứ tự ghi log RELEASED/
  cooldown đợt 135, quyết parent đợt 134 §12.3(b)). Không
  có đổi nào đợt này, nên không cần kiểm chứng cắt ngang
  lại — cut-sim đợt 135 vẫn là bằng chứng cho cơ chế.
- **Bằng chứng trên lock thật (mới): 9 chu kỳ hoàn tất
  kể từ T6-168 đóng chạy trên thứ tự mới và sạch**
  (đủ TICKET + ACQUIRED + RELEASED — xem §2).
  - Cộng với 287 chu kỳ T6-168 đã đếm = **296 chu kỳ
    hoàn tất liên tiếp sạch trên thứ tự mới** (287 đợt
    168 + 9 đợt này). Chu kỳ bị #68 giết KHÔNG tính
    vào số hoàn tất (nó là bằng chứng reboot giết holder,
    không phải lỗi thứ tự ghi — STALE-LOCK thu hồi đúng).
- **Đợt này KHÔNG đổi file code nào** — suite giữ
  `a89c0676`, poll và script lock giữ nguyên (xem §5).

## 4. Nhất quán log lock: 1998 dòng chính thức lúc kiểm cuối, 562 cặp, 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3
(`analyze-log.py`: `parts[2]` — KHÔNG dùng grep -c chuỗi
con; bài học F-138-T10-1: STALE-TICKET làm grep đếm thừa).
Số chính thức đã loại 6 dòng repro lỗi của T6-132 (tA/tH
17:43:46Z 17/11, dòng thô 848–853 — bản đã lọc
= raw trừ đúng 6 dòng đó, lọc bằng `awk '$2!="tA" &&
$2!="tH"'` — cột owner là $2, bài học F-162-T6-1;
diff bản đã lọc mở/đóng/final giống nhau về nội dung cũ —
29 dòng mới trước phiên + 3 dòng trong phiên, §2; analyzer
chạy trên bản đã lọc).
Bản đã lọc lúc đóng: **1998 dòng** (raw 2004) — **+32 dòng
kể từ T6-168 đóng** (1966 → 1998; 29 trước phiên + 3 trong
phiên, đều đã đối chiếu §2). Kiểm cuối sau
prune (08:52Z 22/11): bản đã lọc **1998 dòng** (raw 2004),
RELEASED 562, cặp 562, đang giữ 0, double-acquire 12 —
prune không đụng log nên số kiểm cuối = số lúc đóng.

| Chỉ số (bản đã lọc) | T6-167 đóng | T6-168 đóng | T6-169 mở | T6-169 đóng (snapshot) | Δ trong phiên T6-169 |
|---|---|---|---|---|---|
| Tổng dòng | 1937 | 1966 | 1995 | 1998 | +3 |
| TICKET | 568 | 576 | 584 | 585 | +1 |
| ACQUIRED | 557 | 565 | 573 | 574 | +1 |
| RELEASED | 545 | 553 | 561 | 562 | +1 |
| COOLDOWN | 244 | 249 | 254 | 254 | +0 |
| STALE-LOCK | 12 | 12 | 12 | 12 | +0 |
| STALE-TICKET | 1 | 1 | 1 | 1 | +0 |
| TIMEOUT | 10 | 10 | 10 | 10 | +0 |
| Cặp ACQUIRED→RELEASED | 545 | 553 | 561 | 562 | +1 |
| Đang giữ cuối log (naive) | 0 | 0 | 0 | 0 | — |
| Double-acquire | 12 | 12 | 12 | 12 | 0 mới trong phiên |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163):
  ACQUIRED 574 / RELEASED 562, 562 cặp.** Các số 565/553
  là kiểm cuối đợt 168 (không phải đợt này); 557/545 là
  kiểm cuối đợt 167. Bảng trên dùng đúng ba số này (đã đối
  chiếu với bảng §4 của LIMITS T6-167 và T6-168 — cả hai tự
  nó đúng).
- **"Đang giữ = 0" lúc mở, lúc đóng và lúc kiểm cuối (sau
  prune):** ACQUIRED 574 − RELEASED 562 = 12
  ACQUIRED chưa release trong lịch sử log — nhưng cả 12 đều
  đã được xử lý: 11 ca cũ (10 ca double-acquire cũ + 1 ca
  t8-round159 03:12:16Z STALE-LOCK thu hồi holder bị #60 giết
  — §8 đợt 160) + 1 ca t4 19:16:47Z (STALE-LOCK thu hồi holder
  bị #68 giết — §2 đợt 165). Analyzer xác nhận `still held
  at end of log: 0` ở cả ba snapshot mở/đóng/kiểm cuối. Lock
  TRỐNG lúc mở, lúc đóng và lúc kiểm cuối — status
  xác nhận độc lập, §2.
- **DOUBLE-ACQUIRE GIỮ 12 — 0 ca mới kể từ T6-168 đóng,
  0 ca mới trong phiên T6-169.** Ca mới nhất vẫn là
  analyzer dòng 1843 (bản đã lọc — t4 ACQUIRED 19:16:47Z sau
  STALE-LOCK cùng giây, thu hồi holder bị #68 giết — §2 đợt 165).
  **Kết luận: 0 double-acquire THẬT mới.** STALE-LOCK GIỮ 12 —
  0 ca mới (ca mới nhất vẫn 19:16:47Z, thu hồi #68).
  **Hai con số là CÙNG MỘT sự kiện thu hồi #68, không phải hai
  sự kiện riêng** (nhắc lại từ đợt 160/161/162/163/164/165/166/167/168,
  quyết (v) đợt 162, quyết (r) đợt 163).
- **0 double-acquire mới** kể từ T6-168 đóng. 0 RELEASED không có ACQUIRED trước, 0 TIMEOUT
  mới (TIMEOUT cuối cùng vẫn là 19/11 15:50Z, trước đợt
  150), 0 sự kiện "KHÔNG NHẢ" trên toàn bộ log
  (`grep -c "KHÔNG NHẢ"` = 0 — grep toàn log = 0 dòng).
- **Kết luận sức khỏe: lock KHỎE VỀ CƠ CHẾ.** Giữ/nhả
  đúng lúc mở (9 chu kỳ mới sạch kể từ T6-168 đóng,
  0 chu kỳ dở dang ngoài ca bị #68 giết đã thu hồi),
  0 zombie lúc đóng, 0 stale mới trong phiên, queue 0 ticket,
  log nhất quán (562 cặp + 0 đang giữ lúc kiểm cuối, 0 mất dấu
  khác — số chính thức đã loại 6 dòng repro lỗi của T6-132),
  0 TIMEOUT mới, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt
  148–169 (toàn đợt) và đợt 169 (tới ~08:53Z), suite 9/9
  ×6 lần (T7 (A) xanh cả 6 — xem §6), và thứ tự ghi mới
  đã có **296 chu kỳ thật** chứng minh (§3).
  Caveat còn lại: **reboot #68 GIẾT HOLDER t4**
  (xem §2/§8 — chuỗi "không giết holder" đứt tại #68);
  **reboot #69 KHÔNG giết holder** (khoảng trống 451 s);
  **reboot #70 KHÔNG giết holder** (khoảng trống 1.621 s);
  **reboot #71 KHÔNG giết holder** (khoảng trống 399 s);
  **reboot #72 KHÔNG giết holder** (khoảng trống 5.135 s);
  **reboot #73 KHÔNG giết holder** (khoảng trống 6.511 s);
  **reboot #74 KHÔNG giết holder** (khoảng trống 12.359 s —
  dài nhất kể từ #61, xem §2 đợt 168);
  **reboot #75 KHÔNG giết holder** (khoảng trống 2.419 s —
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168);
  **reboot #76 KHÔNG giết holder** (khoảng trống 3.190 s —
  đợt này, số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168);
  **reboot #77? KHÔNG giết holder** (khoảng trống 6.279 s —
  đợt này, số hiệu chưa được T6 chứng nhận);
  reboot #60 ĐÃ giết holder t8-round159 là sự kiện đợt
  160, đã ghi nhận (cơ chế STALE-LOCK đã reclaim đúng —
  nay #68 lặp lại đúng mẫu đó).

## 5. (A) CÒN NGUYÊN — không đổi suite đợt này; poll dùng chung KHÔNG đổi (phạm vi hẹp giữ nguyên)

Quyết parent §12.3(b) đợt 150: **CHUYỂN SANG (A) — bác bỏ
(B)**; quyết parent (v) đợt 151: (A) là khóa chính thức
của khối T7 (kiểm chứng 120/120 PASS dưới churn).
Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển
khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng**
  (bản (A) đợt 151). Live-code khối T7 (bỏ comment/dòng
  trống) md5 **`c92f2efff2080fbe6712522343e9e400`** —
  khớp đúng T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168 §6.2.
  File khối T7 đã trích `t7-block-a169.sh` md5
  **`dc973443030249a262ff63cbc62231d5`** — **giống hệt**
  file khối đã trích đợt 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167 và 168 (cùng md5). Harness đợt này chạy đúng code (A)
  trong suite, không phải bản sao tay (xem §6.2).
- **PHẠM VI HẸP — đã tuân thủ, có bằng chứng:**
  `vcut-poll-quiet-v2.sh` KHÔNG đổi (`1710e480` lúc mở
  = lúc đóng); hàm `count_blockers` dùng chung cho gate
  cửa yên của T4 KHÔNG đổi (grep: `count_blockers` xuất
  hiện 2 lần trong poll script, dòng 32/46 — trong suite
  chỉ có 1 lần xuất hiện duy nhất là dòng comment ở
  khối T7, dòng 151: "PHẠM VI HẸP: (A) CHỈ áp cho khối
  test T7 này; KHÔNG đổi count_blockers", kèm 3 lệnh poll
  cũ của (B) đã comment; không có trong live-code khối T7).
  Script lock v2 KHÔNG đổi (`520b8baa`). T6 không đổi
  gì trong phiên (chỉ xóa 1 file cooldown theo luật
  prune đã phê duyệt — §7; không đụng code).
- `bash -n` harness t7-control-a169.sh: OK (bản sao của
  t7-control-a168.sh, chỉ đổi hậu tố a168 → a169 + sửa
  comment "đợt 168" → "đợt 169").
  Code (B) vẫn giữ trong comment suite + LIMITS T6-150
  như đợt 151–168 (không động tới).

## 6. KIỂM CHỨNG LẠI (A) — DƯƠNG TÍNH: 120/120 PASS dưới churn (100%, lần thứ mười chín liên tiếp) + suite 9/9 × 6

### 6.1 Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6

Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp
(~08:42–08:44Z, `test-v2-t6-run1.log` …
`run6.log`):
**PASS=9 FAIL=0, rc=0 cả 6 lần** (mỗi lượt 21/21/21/21/
24/25 s — tương đương đợt 168: 22/25/34/33/24/24 s/lượt;
đợt này đều và nhanh hơn chút).
Khối T7 (A) PASS 6/6 ("PASS: T7 poll (A)" xuất hiện
1 lần mỗi log). Suite chạy trên log riêng trong /tmp — log lock thật
chỉ tăng 3 dòng do chu kỳ t4 của T4-169 trong phiên (0 dòng
nào là của T6, §2/§4).

### 6.2 Harness 120 lần có churn — khối T7 trích VERBATIM từ suite

Harness `round169-t6/t7-control-a169.sh`: trích khối T7
giữa marker `T7-BLOCK-START` / `T7-BLOCK-END` từ suite
(không viết lại tay), chạy N=120 lần với churn bơm vào.
Churn **giống hệt T6-151/T6-152/T6-153/T6-154/T6-155/T6-156/T6-157/T6-158/T6-159/T6-160/T6-161/T6-162/T6-163/T6-164/T6-165/T6-166/T6-167/T6-168 §6.2** (để so sánh
được): 1 process `WebProcess-churn` (khớp mẫu poll) xuất
hiện sau delay ngẫu nhiên 0,5–3,5 s, sống 1,5 s — mô phỏng
vite/WebKit của luồng khác khởi động/tắt trong cửa sổ giữa
các lần đếm. Chỉ chạy trên /tmp, không đụng lock thật,
không đụng poll chung. Chạy trên boot c44cc3ba (#77? theo
brief, btime 08:23:52Z).
- **Bằng chứng trích verbatim:** file khối đã trích
  `t7-block-a169.sh` md5 `dc973443030249a262ff63cbc62231d5`
  — **giống hệt** file khối đã trích đợt 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167 và 168; live-code (bỏ comment/dòng trống) của khối đã trích md5
  `c92f2efff2080fbe6712522343e9e400` — **khớp đúng**
  live-code khối T7 trong file suite (cùng md5
  `c92f2efff…`). Harness chạy đúng code trong suite,
  không phải bản sao tay.
- **Kết quả: PASS=120 FAIL=0 / 120 (100%).**
  B1=1 B2=0 cả 120 lần (`t7-a169-churn.log`, 120 dòng
  `-> PASS`, 0 dòng `-> FAIL`). Delay churn thực đo:
  min 544 ms, max 3466 ms, trung bình 1937,19 ms —
  đúng phân phối thiết kế (đều 500–3500 ms).
  Thời gian chạy harness ~7'00" (08:44:59–08:51:59Z).
- **Đối chiếu cùng churn (cùng phương pháp bơm churn):**

| Phương án | Có churn | Kết quả |
|---|---|---|
| (B), đợt 150 | 30 lần | **2/30 PASS (7%)** |
| Bản cũ (B1−B2=1), đợt 150 | 30 lần | **13/30 PASS (43%)** |
| **(A), đợt 151** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 152 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 153 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 154 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 155 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 156 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 157 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 158 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 159 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 160 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 161 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 162 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 163 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 164 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 165 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 166 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 167 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 168 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |
| **(A), đợt 169 (kiểm lại)** | **120 lần** | **120/120 PASS (100%)** |

- **Kết luận: (A) VẪN XANH sau mười tám đợt.** (A) miễn nhiễm
  churn nền theo thiết kế (không đếm nền nên nền đổi
  không ảnh hưởng) — đã chứng minh lần thứ mười chín liên
  tiếp bằng 120 lần chạy trên đúng code suite (tổng
  cộng 2280/2280 dưới churn qua 19 đợt). Chú thích tỉ lệ
  (như T6-150–168): 120/120 là tỉ lệ dưới churn bơm
  vào gần như mọi lần chạy (stress), không phải tỉ lệ
  flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI
  dưới cùng điều kiện: (A) 100% vs (B) 7% vs bản cũ 43%.
- **Chuỗi (theo quy ước đếm theo đợt, mỗi đợt +1 —
  T10 xác nhận lại):** chuỗi "xanh kép" T7 (xanh cả
  suite lẫn kiểm chứng churn): 18 (đợt 168) → **19 (đợt
  169 — lần thứ mười chín xanh kép liên tiếp)**. Chuỗi suite
  xanh về bản chất: 50 (đợt 168) → **51 (đợt 169,
  6/6 lượt 9/9)**.

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 1 FILE (ĐIỀU (b) KÍCH HOẠT) — KHÔNG PHẢI CHỜ LOCK

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c);
chú thích ngữ nghĩa `find -mtime` đã ghi vào luật ở đợt 130
theo quyết parent đợt 129 §12.3(e)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG). Ngữ nghĩa `find -mtime`:
`-mtime +7` chỉ khớp file **≥192h (8 ngày)**,
`-mtime +2` chỉ khớp file **≥72h** — phương pháp `find`
bảo thủ hơn chữ luật tối đa 24h (xóa muộn, không bao giờ
xóa sớm).

- **Trình tự thực hiện:**
  - 08:42Z (lúc mở): tổng **101 file / 1414 byte** (vượt
    trần mềm 100 — do T8-168 thêm `cooldown-t8-round168`,
    §2); quét ứng viên mtime >7 ngày (`find -mtime +7`):
    **0 file** (`prune-candidates.txt` — 0 byte, đã ghi lại
    file riêng như T6-166/167/168, khắc phục F-167-T6-4) — điều (a)
    không kích hoạt.
  - Lock TRỐNG lúc mở (08:42Z), TRỐNG lúc snapshot
    đóng (08:52Z) và TRỐNG ngay trước prune
    (`status-before-prune.txt`) — **prune KHÔNG PHẢI CHỜ**
    (giống đợt 167/168 không phải chờ; khác đợt 166 phải chờ
    T4-166 tới 23:51:17Z). Lưu ý: T4-169 attempt1 ĐÃ giữ
    lock trong phiên (08:44:34Z → 08:48:56Z, §2) nhưng đã
    nhả xong trước snapshot đóng — prune chạy sau khi lock
    trống lại, không chờ thêm.
  - 08:52:25Z 22/11 (epoch 1795337545): điều (b) KÍCH HOẠT:
    tổng vẫn 101 > 100 → xóa 1 file cũ nhất tới khi còn 100.
    File cũ nhất: **`cooldown-t5`, mtime
    2026-11-15T12:57:53.6234103820Z, 163,91h tuổi lúc xóa**
    (≥48h — thỏa điều kiện không xóa file <48h; không phải
    file đợt hiện tại hay đợt ngay trước — file cooldown cũ
    từ 15/11, không thuộc đợt 168/169). Xác định "cũ nhất"
    bằng mtime chính xác tới nano-giây: `cooldown-t5`
    12:57:53.6234103820Z, sớm hơn file kế tiếp
    `cooldown-t10-round118` 13:13:10.2244033200Z đúng ~15m17s.
    Tuổi tính từ đúng epoch giờ prune trong `prune-time.txt`
    (bài học F-164-T6-1; `prune-time.txt` ghi SAU `rm` trong
    cùng một lệnh — bài học F-167-T6-3).
  - **Kết quả prune đợt 169 (lần 44): 1 file đã xóa
    (`cooldown-t5`).**
    `prune-deleted.txt` ghi đúng file đã xóa (kèm mtime +
    size 14 byte + tuổi + điều luật + giờ prune).
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (08:42Z) **101 file / 1414 byte**;
  lúc snapshot đóng (08:52Z, trước khi prune) **101 file /
  1414 byte** (log lock +3 dòng trong phiên là chu kỳ t4
  của T4-169, không thêm file cooldown mới);
  **sau prune 100 file / 1400 byte** (100 × 14
  = 1400 khớp; `ls`/`find`/`status` khớp nhau); lúc
  kiểm cuối sau prune (08:52Z) vẫn **100 file / 1400 byte**. Không file nào bị xóa hay
  thêm ngoài 1 file prune giữa hai lần đếm của đợt này.
  Số học từ T6-168 đóng: 100 + 1 file mới
  (`cooldown-t8-round168`) = 101 ✓ — khớp đúng số T10-168 đóng.
- Phân tầng tuổi (ngữ nghĩa `find -mtime`):
  lúc mở: **>7 ngày (`-mtime +7`, tức ≥192h): 0 file;
  ≥72h (`-mtime +2`): 72 file; ≥48h (`-mtime +1`): 84
  file**. Sau prune (08:52Z): **≥192h: 0 file; ≥72h:
  71 file; ≥48h: 83 file** — ≥72h giảm 72 → 71 (xóa
  đúng 1 file ≥72h, 0 file mới đủ 72h trong phiên —
  khớp số học). File cũ nhất còn lại nay là
  `cooldown-t10-round118`, mtime 2026-11-15T13:13:10Z —
  lúc 08:52Z mới **~163,65h tuổi**.
  (Ghi chú: ≥72h lúc mở đợt này là 72, tăng 1 so với lúc
  mở đợt 168 (71) — 1 file vượt mốc 72h trong khoảng ~3h giữa
  hai lần mở; khớp số học, không phải lỗi đếm.)
- **Hệ quả cho F-147-T6-1:** quy luật "điều (b) xóa file
  cũ nhất mỗi đợt TRƯỚC khi nó đủ 7 ngày" **nối lại
  lần thứ hai mươi liên tiếp** (đợt 150 xóa `cooldown-s4-w2`,
  đợt 151 xóa `cooldown-s4-w3` + `cooldown-s4-hold2`,
  đợt 152 xóa `cooldown-s4-wL` + `cooldown-s4-wN`,
  đợt 153 xóa `cooldown-s2`, đợt 154 xóa `cooldown-s5`,
  đợt 155 xóa `cooldown-s6`, đợt 156 xóa
  `cooldown-s3-round116`, đợt 157 xóa
  `cooldown-s10-round116`, đợt 158 xóa `cooldown-t6`,
  đợt 159 xóa `cooldown-t8-round117`, đợt 160 xóa
  `cooldown-t4-hold`, đợt 161 xóa `cooldown-t4-wc`,
  đợt 162 xóa `cooldown-t3-round117`, đợt 163 xóa
  `cooldown-t10-round117`, đợt 164 xóa
  `cooldown-t1-smoke-a`, đợt 165 xóa
  `cooldown-t1-smoke-hold`, đợt 166 xóa
  `cooldown-t1-smoke-wl`, đợt 167 xóa
  `cooldown-t2`, đợt 168 xóa
  `cooldown-t3-round118`, đợt này xóa
  `cooldown-t5` trước khi nó đủ 7 ngày — nó đủ
  7 ngày theo đồng hồ tường vào khoảng
  **22/11 12:57Z** nhưng đã bị xóa ở đợt 169, sớm ~4,09h).
  T6 các đợt sau đếm tiếp.
  Ghi nhận, không đổi luật (luật thuộc parent).
  **Kiểm số lần nối lại cẩn thận (brief giao dặn):** LIMITS
  T6-168 §7 đã đếm "lần thứ mười chín" (đợt 150–168 nối liên
  tiếp); đợt này là **lần thứ hai mươi** — đợt 150–169 =
  20 đợt liên tiếp.
- **Prune lần 45 (T6-170): tổng lock 100 sau prune 44 —
  kiểm lại lúc mở đợt 170** (nếu có luồng thêm file mới
  thì điều (b) lại kích hoạt; file cũ nhất còn lại
  `cooldown-t10-round118` đủ 7 ngày ~22/11 13:13Z).

## 8. CHỐT SỐ BOOT — KHÔNG reboot trong phiên T6-169; #76/#77? KHÔNG GIẾT HOLDER; đồng hồ ở giờ thật

- Boot duy nhất trong phiên: **c44cc3ba** (btime
  08:23:52Z = epoch 1795335832). T6 **TỰ XÁC MINH btime**
  08:23:52Z (hai nguồn /proc/stat + `uptime -s` khớp) nhưng
  **KHÔNG tự chứng nhận** số hiệu reboot #77? (thuộc
  T0-169/T2-169 — lúc T6 mở chưa có cờ `round169-t0.done`
  trên đĩa; T6 chỉ chứng nhận từ log lock).
- Uptime boot lúc đóng ~29'. `journal --list-boots`
  chỉ 1 dòng c44cc3ba (first entry 08:24:04Z) — journal
  đã xoay, chỉ còn boot hiện tại. **KHÔNG có reboot mới
  lúc đóng** (kiểm ~08:52Z, boot_id giống lúc mở; kiểm
  lại sau prune ~08:52Z, §7/§9).
- **ĐỒNG HỒ Ở GIỜ THẬT (T6 tự kiểm):** Cloudflare Date
  08:52:10Z vs local 08:52:09Z — chênh ~1 s (trong đó có
  độ trễ fetch; lúc mở chênh ~1 s). Không còn
  dấu hiệu chạy nhanh như đợt 156. Các mốc wall đợt 169
  đọc trực tiếp được.
- **REBOOT #76 (btime 07:32:23Z, boot `f2b97695` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 168) — KHÔNG giết holder**
  (§2): lock trống 53m10s trước btime
  (RELEASED cuối 06:39:13Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới. **Verdict sạch — chuỗi "không giết
  holder" mới từ #69 lên 8 reboot (#69–#76).**
  **REBOOT #77? (btime 08:23:52Z, boot `c44cc3ba` — số hiệu
  chưa được T6 chứng nhận) — KHÔNG giết holder** (§2):
  lock trống 1h44m39s trước btime (RELEASED cuối 06:39:13Z);
  0 dòng log trong cửa sổ; 0 STALE-LOCK mới.
  **Verdict sạch, chờ T0-169 xác nhận số hiệu.**
  **Chuỗi "không giết holder" MỚI bắt đầu lại từ #69: 8 reboot
  (#69, #70, #71, #72, #73, #74, #75, #76) + #77? chờ xác
  nhận số hiệu (nếu #77 được xác nhận → 9).**
- **REBOOT #75 (btime 05:32:46Z, boot `576ca271`) —
  KHÔNG giết holder** (§2 đợt 168, T6-169 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 40m19s trước btime
  (RELEASED cuối 04:52:27Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #74 (btime 04:05:29Z, boot `194efd93` — số hiệu
  ĐÃ XÁC NHẬN quyết (d) đợt 167) — KHÔNG giết holder**
  (§2 đợt 168, T6-169 đối chiếu lại độc lập từ log gốc —
  khớp): lock trống 3h25m59s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #73 (btime 02:28:01Z, boot `b643911f`) —
  KHÔNG giết holder** (§2 đợt 167, T6-169 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h48m31s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #72 (btime 02:05:05Z 22/11, boot `9e089ef6`) —
  KHÔNG giết holder** (§2 đợt 167, T6-169 đối chiếu lại
  độc lập từ log gốc — khớp): lock trống 1h25m35s trước btime
  (RELEASED cuối 00:39:30Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #71 (btime 00:08:00Z, boot `ea73ac4f`) —
  KHÔNG giết holder** (§2 đợt 167): lock trống 6m39s trước btime
  (RELEASED cuối 00:01:21Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #70 (btime 22:05:25Z 21/11, boot `d1ddd946`) —
  KHÔNG giết holder** (§2 đợt 166): lock trống 27m01s trước btime
  (RELEASED cuối 21:38:24Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #69 (btime 20:09:31Z 21/11, boot `9a1a9319`) —
  KHÔNG giết holder** (§2 đợt 165): lock trống 7m31s trước btime
  (RELEASED cuối 20:02:00Z); 0 dòng log trong cửa sổ;
  0 STALE-LOCK mới.
- **REBOOT #68 (btime 18:06:30Z 21/11, boot `0c8a94aa`) —
  GIẾT HOLDER t4** (§2 đợt 165): ACQUIRED 18:04:38Z, btime 112 s
  sau khi giữ; 0 RELEASED cho ticket đó; STALE-LOCK thu hồi
  19:16:47Z (tuổi 4329 s, "boot đổi") + re-ACQUIRED cùng giây.
  **Chuỗi "không giết holder" 7 reboot liên tiếp (#61–#67)
  ĐỨT TẠI #68 — reboot thứ ba giết holder (#50, #60, #68).**
  T6 không phán mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77? — giao T2-169.
- **Watcher-168 lần 2 (pid 13133 lúc T5-168 đóng) đã chết
  theo reboot #76** (aggregate 168) — T6 chỉ ghi nhận sự
  vắng mặt, không phán vòng đời (T5-169 sở hữu;
  `b2-watcher.sh` pid 19123 mới của round169-t9 đã chạy
  trong phiên T6-169).
  **POSTBOOT_PASS #76 CHƯA CÓ lúc T6 đóng** (giao T5-169);
  POSTBOOT_PASS #75 ĐÃ CÓ (06:01:38Z, mode repair —
  aggregate 168); POSTBOOT_PASS #74 còn hiệu lực.
- **Nhắc lại #60/#61/#62/#63/#64/#65/#66/#67 (để đối chiếu):** #60 ĐÃ
  giết holder t8-round159 (lần thứ 2 reboot giết holder,
  sau #50); cơ chế STALE-LOCK thu hồi đúng. #61 KHÔNG
  giết holder (lock trống 1h57m24s trước btime). #62 KHÔNG
  giết holder (lock trống 1h28m01s trước btime — quyết
  parent (w) đợt 161). #63 KHÔNG giết holder (lock trống
  10m34s trước btime — T6-162 chứng nhận bổ sung). #64
  KHÔNG giết holder (lock trống 55m10s trước btime —
  quyết parent (v) đợt 162). #65 KHÔNG giết holder (lock
  trống 1h56m26s trước btime — quyết parent (r) đợt 163).
  #66 KHÔNG giết holder (lock trống 7m47s trước btime —
  T6-164 kiểm chứng lần đầu). #67 KHÔNG giết holder (lock
  trống 1h34m29s trước btime — T6-164). **#68 GIẾT holder
  t4 (đợt 165 — lần đầu tiên chuỗi đứt kể từ #60). #69 KHÔNG
  giết holder (lock trống 7m31s trước btime — đợt 165).
  #70 KHÔNG giết holder (lock trống 27m01s trước btime — đợt 166).
  #71 KHÔNG giết holder (lock trống 6m39s trước btime — đợt 167).
  #72 KHÔNG giết holder (lock trống 1h25m35s trước btime — đợt 167).
  #73 KHÔNG giết holder (lock trống 1h48m31s trước btime — đợt 167).
  #74 KHÔNG giết holder (lock trống 3h25m59s trước btime — đợt 168,
  DÀI NHẤT kể từ #61).
  #75 KHÔNG giết holder (lock trống 40m19s trước btime — đợt 168,
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168).
  #76 KHÔNG giết holder (lock trống 53m10s trước btime — đợt này,
  số hiệu ĐÃ XÁC NHẬN quyết (d) đợt 168).
  #77? KHÔNG giết holder (lock trống 1h44m39s trước btime — đợt này,
  số hiệu chưa được T6 chứng nhận).**

## 9. ĐỐI CHIẾU CUỐI PHIÊN (md5 / cây / lock)

- md5 lúc đóng: suite (A) `a89c0676`, poll `1710e480`,
  lock v2 `520b8baa`, lock v1 `fd21193c`, preview.tsx
  `530e10a7` — tất cả khớp baseline, không đổi nào đợt
  này. Khối T7 đã trích `dc973443…` (§5).
- Cây repo: chỉ 1 file đổi/thêm trong batch T6-169
  (LIMITS này) — xem §10.
- Lock lúc kiểm cuối sau prune (08:52Z 22/11): TRỐNG,
  0 ticket + 100 cooldown (sau prune), log 2004 dòng thô /
  1998 dòng chính thức, 562 cặp, 0 đang giữ hiệu dụng.
- Cờ `.done`: xem §10 (T6 viết cờ CÓ NỘI DUNG trước khi
  báo đóng — bắt buộc theo brief).

## 10. BATCH STAGE — 1 batch / 1 entry / 1 file (paths NUL-delimited, đã verify read-back + od -c)

- File paths: `~/workspace/repo-1-push/paths-loop/phase9-round169-t6-lockhealth.txt`
  (1 entry, NUL-delimited; đã đọc lại bằng
  `tr '\0' '\n'` để verify — 1 dòng đúng tên file):
  - `docs/PHASE9_ROUND169_T6_LOCKHEALTH_LIMITS.md` (file
    này)
- **Cờ đóng: `hidden_files/round169-t6.done` ĐÃ VIẾT CÓ
  NỘI DUNG trước khi báo đóng** (bắt buộc — rút kinh
  nghiệm đợt 150 T6 thiếu cờ; T6 đã kiểm chứng cờ có
  mặt trên đĩa và không 0 byte bằng `ls -l` trước khi
  kết thúc — xem §11).
- Tổng batch đợt 169 đã stage tới lúc T6 đóng (tạm tính,
  T10 đợt 169 đếm lại bằng dedup toàn cục): **1 batch /
  1 entry** (t6 1 — các luồng khác chưa stage tới lúc
  này; T10 đếm lại). Lũy kế 111–168 (T10-168 đếm dedup toàn cục):
  T6 không tự cộng tay vào lũy kế file (chờ T10-169).

## 11. GHI CHÚ CHO T10-169 / PARENT

- (A) còn nguyên + kiểm chứng lại dương tính (120/120
  dưới churn, lần thứ mười chín liên tiếp, tổng 2280/2280 qua 19
  đợt; 6/6 suite 9/9). Không còn nợ nào về (A)/(B):
  (B) giữ trong comment suite + LIMITS T6-150.
- Chuỗi xanh kép T7: 18 → 19 (lần thứ mười chín xanh kép liên
  tiếp); chuỗi suite xanh về bản chất: 50 → 51 (theo quy
  ước đếm theo đợt — T10 xác nhận lại cách đếm).
- Lock khỏe về cơ chế (562 cặp lúc kiểm cuối, 0 giữ hiệu
  dụng, 0 TIMEOUT mới); **#76 KHÔNG GIẾT HOLDER (lock trống
  53m10s — chuỗi "không giết holder" mới từ #69 lên 8 reboot);
  #77? KHÔNG GIẾT HOLDER (lock trống 1h44m39s — số hiệu chưa
  được T6 chứng nhận, btime 08:23:52Z do T6 tự xác minh)** —
  gap #76→#77? = 3.089 s; gap #75→#76 kiểm lại = 7.177 s (khớp).
  Double-acquire/STALE-LOCK GIỮ 12 — 0 ca mới cả hai (ca mới
  nhất vẫn là thu hồi #68 đợt 165, đừng đếm thành sự kiện mới).
  Prune lần 44 xóa 1 file, queue về đúng trần 100 (**KHÔNG
  PHẢI CHỜ lock** — lock trống lúc mở/lúc đóng/ngay trước
  prune; T4-169 đã giữ lock 08:44:34Z → 08:48:56Z trong phiên
  nhưng nhả xong trước snapshot đóng; +29 dòng kể từ T6-168 đóng
  đều là của t4 + t8-round168, +3 dòng trong phiên là 1 chu kỳ
  t4 của T4-169, sạch).
- **Reboot #76/#77? KHÔNG giết holder** (lock trống
  3.190 s / 6.279 s trước btime — verdict sạch).
  **#68 GIẾT holder** vẫn là phát hiện của đợt 165 (chuỗi #61–#67 đứt).
  **Đồng hồ ở giờ thật** (Cloudflare ~1 s lúc mở, ~1 s lúc
  đóng, gồm độ trễ fetch). Mù cho #68/#69/#70/#71/#72/#73/#74/#75/#76/#77? giao T2-169.
  **Kiểm cuối đợt này: ACQUIRED 574 / RELEASED 562, 562
  cặp** (đừng mang 565/553 — đó là kiểm cuối đợt 168 —
  vào cột đợt này; bài học (r) đợt 163).
- **Double-acquire GIỮ 12, STALE-LOCK GIỮ 12 — 0 ca mới
  cả hai.** Hai con số vẫn là CÙNG MỘT sự kiện thu hồi #68 —
  T10-169 lưu ý khi đối chiếu (§4), đừng đếm thành hai
  sự kiện riêng (quyết (v) đợt 162, quyết (r) đợt 163).
- 0 zombie lúc mở và lúc đóng; X11 trống lúc mở (reboot
  #77? đã dọn 3 socket sót đợt 168), 3 socket X193/X194/
  X195 mới lúc đóng (của luồng khác đợt 169, tạo 08:49:19Z
  — lần thứ mười liên tiếp cùng 3 số display)
  — không phải của T6; T10-169 lưu ý khi đối chiếu log (+29 dòng
  kể từ T6-168 đóng đều là của t4 + t8-round168, +3 dòng trong
  phiên là 1 chu kỳ t4 của T4-169, sạch).
- **Inotify: trần `max_user_watches` nay là 63747** (giống
  trần trên #69/#70/#71/#73/#74/#75/#76). Ghi nhận theo quyết (m) đợt 146 (ghi làm chú thích, không
  hành động); T9-169 sở hữu hệ quả headroom nếu có. T6
  không suy đoán nguyên nhân đổi.
- Tự ghi lỗi thao tác của T6 trong phiên (không ảnh
  hưởng kết quả) — xem §12.
- Nợ đứng giữ nguyên (G1, R9 (16), ci-security.yml 403,
  file oversize 6,4 MB, TTS 39 cấm kiểm lại; mù #77? VẪN
  MỞ; #88? VẪN MỞ; mù #94? MỞ theo quyết (b) đợt 163;
  mù #95? MỞ theo quyết (b) đợt 163; mù #96? MỞ sau điều
  tra đầy đủ đợt 165 — chờ quyết parent §12.1 (m) đợt 165;
  birefnet 0 thử lần 22 (đợt 168); u2net là fallback chính thức;
  POSTBOOT_PASS #75 ĐÃ CÓ (mode repair) — giao T5-169 theo dõi tiếp;
  POSTBOOT_PASS #76 CHƯA CÓ — giao T5-169;
  kết cục run 168 + (m) #76 thuộc T7-169/T2-169).
- Cờ `round169-t6.done`: T6 viết CÓ NỘI DUNG TRƯỚC khi báo
  đóng và đã `ls -l` kiểm chứng trên đĩa (khác đợt 150 —
  lúc đó T6 thiếu cờ, T10-150 ghi nhận F-150-T10-1).

## 12. SAI SỐ RIÊNG CỦA T6-169 (F-169-T6-n)

- **F-169-T6-1 — Lỗi gõ nhãn trong lệnh prune: echo
  "lock TRONG" thay vì "lock TRỐNG" trong một dòng nhãn
  tạm của lệnh shell lúc prune.** Chỉ là lỗi chính tả
  trong stdout tạm thời của lệnh (không ghi vào file nào):
  file `status-before-prune.txt` ghi đúng chữ `TRỐNG`,
  LIMITS này ghi đúng `TRỐNG`. Không ảnh hưởng verdict
  nào (prune chạy sau khi status xác nhận TRỐNG bằng
  script, không phải bằng nhãn gõ tay). Bài học: nhãn
  echo trong lệnh dài nên copy đúng chữ từ output status.
- **F-168-T6-2 ĐÃ SỬA (không phải lỗi mới đợt này):**
  `harness-start.txt` đợt này ghi ĐÚNG giờ bắt đầu harness
  churn (08:44:59Z); cửa sổ chạy suite 6 lượt ghi riêng
  vào `suite-start.txt`/`suite-end.txt` (08:42:39Z →
  08:44:52Z) — tách bạch, không còn nhầm nhãn như đợt 168.

## PHỤ LỤC — SỐ LIỆU TRÍCH BẰNG SCRIPT TỪ LOG GỐC (không gõ tay)

Trích bằng script Python từ log gốc (`t7-a169-churn.log`,
`test-v2-t6-run*.log`, `vite-lock-v2-cleaned-*.log`,
`vite-lock-v2.log`, `vite.lock.queue/`); file
`hidden_files/round169-t6/appendix-numbers.txt` giữ bản
trích gốc (tuổi prune tính từ đúng epoch giờ prune trong
`prune-time.txt` — bài học F-164-T6-1; md5 live-code chỉ
tính bằng pipeline shell đứng sau khi bắt lỗi F-164-T6-2):

```
churn: n_runs=120 pass=120 fail=0 B1=1:120 B2=0:120
churn delay_ms: min=544 max=3466 mean=1937.19
churn summary line: == TỔNG: mode=A churn=1 PASS=120 FAIL=0 / 120 ==
churn harness: 2026-11-22T08:44:59Z -> 2026-11-22T08:51:59Z (~7m00s), boot c44cc3ba
suite window: 2026-11-22T08:42:39Z -> 2026-11-22T08:44:52Z
suite run1: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run2: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run3: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run4: PASS=9 FAIL=0 T7A=1 secs=21 rc=0
suite run5: PASS=9 FAIL=0 T7A=1 secs=24 rc=0
suite run6: PASS=9 FAIL=0 T7A=1 secs=25 rc=0
md5 test-vite-lock-v2.sh=a89c0676
md5 vcut-poll-quiet-v2.sh=1710e480
md5 vcut-vite-lock-v2.sh=520b8baa
md5 vcut-vite-lock.sh=fd21193c
md5 preview.tsx=530e10a7
md5 t7-block-a169.sh=dc973443030249a262ff63cbc62231d5
md5 t7-block live-code=c92f2efff2080fbe6712522343e9e400
cleaned-open counts: TOTAL: ACQUIRED=573, COOLDOWN=254, RELEASED=561, STALE-LOCK=12, STALE-TICKET=1, TICKET=584, TIMEOUT=10, total=1995
cleaned-open pairs ACQUIRED->RELEASED: 561
cleaned-open still held at end of log: 0
cleaned-open double-acquire cases: 12
cleaned-close counts: TOTAL: ACQUIRED=574, COOLDOWN=254, RELEASED=562, STALE-LOCK=12, STALE-TICKET=1, TICKET=585, TIMEOUT=10, total=1998
cleaned-close pairs ACQUIRED->RELEASED: 562
cleaned-close still held at end of log: 0
cleaned-close double-acquire cases: 12
cleaned-final counts: TOTAL: ACQUIRED=574, COOLDOWN=254, RELEASED=562, STALE-LOCK=12, STALE-TICKET=1, TICKET=585, TIMEOUT=10, total=1998
cleaned-final pairs ACQUIRED->RELEASED: 562
cleaned-final still held at end of log: 0
cleaned-final double-acquire cases: 12
raw log lines open: 2001
raw log lines close: 2004
raw log lines final (after prune check): 2004
new lines since T6-168 close: 29 (8 cycles before session: t4 x1 + t8-round168 x7; 0 dangling)
new lines in T6-169 session: 3 (t4 x1 cycle: TICKET 08:44:34Z -> ACQUIRED 08:44:34Z -> RELEASED 08:48:56Z hold_s=262)
queue files now (pre-prune): 101 files bytes=1414; post-prune: 100 files bytes=1400
queue age bands open: >=192h: 0 files; >=72h: 72 files; >=48h: 84 files
queue age bands post-prune: >=192h: 0 files; >=72h: 71 files; >=48h: 83 files
KHONG-NHA lines in raw log: 0
prune-44 deleted: cooldown-t5 mtime=2026-11-15T12:57:53.6234103820Z size=14 age=163.91h rule=(b) at 2026-11-22T08:52:25Z epoch=1795337545 early_by=4.09h
next oldest remaining: cooldown-t10-round118 mtime=2026-11-15T13:13:10.2244033200Z
reboot-76 NO HOLDER KILLED: btime 2026-11-22T07:32:23Z boot f2b97695 epoch=1795332743 (number confirmed by T7-168 9 sources, parent decision pending — NOT certified by T6); last lock line before btime 2026-11-22T06:39:13Z t8-round168 RELEASED hold_s=230 (lock empty 53m10s = 3190s); 0 lines in window 06:39:13Z -> 07:32:23Z; 0 unreleased owners; 0 new STALE-LOCK; NO holder killed
reboot-77? NO HOLDER KILLED: btime 2026-11-22T08:23:52Z boot c44cc3ba epoch=1795335832 (btime verified independently by T6: /proc/stat btime + uptime -s agree; number NOT certified by T6 — belongs to T0-169); last lock line before btime 2026-11-22T06:39:13Z t8-round168 RELEASED hold_s=230 (lock empty 1h44m39s = 6279s); 0 lines in window 06:39:13Z -> 08:23:52Z; 0 unreleased owners; 0 new STALE-LOCK; NO holder killed
gap-75->76 recheck: 7177s (1795332743-1795325566) — matches T7-168
gap-76->77: 3089s = 51m29s (1795335832-1795332743)
inotify max_user_watches open/close/final: 63747
boot open/close/final: c44cc3ba (btime 1795335832 = 08:23:52Z); journal 1 line, first entry 08:24:04Z
clock: open Cloudflare 08:42:10Z vs local 08:42:09Z (~1s); close Cloudflare 08:52:10Z vs local 08:52:09Z (~1s)
zombies open: 0; zombies close: 0
ps lines open: 10 (fresh boot, other threads not yet started); ps lines close: 36
X11 open: empty; X11 close: 3 sockets X193/X194/X195 created 2026-11-22T08:49:19Z (other thread, not T6)
watcher at close: b2-watcher.sh pid 19123 (round169-t9, started during session after open snapshot)
```
