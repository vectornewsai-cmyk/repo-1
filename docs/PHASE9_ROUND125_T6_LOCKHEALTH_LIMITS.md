# PHASE9 ROUND125 T6 — Sức khỏe lock v2 sau boot mới #69? — LIMITS

- Đợt: 125, luồng T6 (sức khỏe lock v2 sau boot mới + housekeeping).
  Lượt cron 03:35 +07 17/11/2026. Chạy 20:41–20:46Z 16/11/2026
  (03:41–03:46 +07 17/11).
- Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic, KHÔNG prune,
  KHÔNG xóa file cooldown, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` (không đổi trạng thái).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round125-t6/` (analyze-log.py,
  analyze-log.txt, new-lines-since-512.txt, cooldown-now.txt,
  ps-full-2041Z.txt, ps-full-2046Z.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
  repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI (số tạm #69?)

- **Reboot mới giữa đợt 124 đóng và đợt 125: boot_id
  `670c07f6-2299-43f6-951c-0cf1116afd6d`, btime
  1794861311 = 20:35:11Z theo `/proc/stat`
  (20:35:22Z theo `stat /proc/1` — chênh 11 s giữa hai
  nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả hai,
  không tự chọn một). `uptime -s` = 20:35:11Z,
  `who -b` = 20:35. Uptime ~6 phút lúc T6 bắt đầu
  (20:41Z).**
- Số hiệu: T6 ghi tạm **#69?**. Lý do: boot đợt 124 là #68?
  (btime 17:33:51Z, boot_id `69359761…`, T5 đợt 124 ghi tạm
  #68?), và boot 20:35:11Z này đến sau #68?. Gap danh nghĩa
  #68?→#69? = **3h01'20"** (10.880 s). Boot #68? sống
  3h01'20", **không reboot trong đợt 124** (T10 xác nhận lúc
  đóng). T6 KHÔNG tự xác minh số hiệu (thuộc T5, mù #37);
  `journalctl --list-boots` và wtmp chỉ còn giữ boot này
  (wtmp bắt đầu 20:35:22Z 16/11) — không có lịch sử boot độc
  lập trên máy này. Không có bằng chứng boot trung gian giữa
  đợt 124 đóng (18:50Z) và 20:35:11Z, nhưng cũng không có
  nguồn nào trên VM loại trừ được boot trung gian — cùng giới
  hạn như mọi lần đếm mù #37 trước (parent đã chấp nhận #37
  ĐỂ MỞ).
- md5 khớp baseline đợt 120/121/122/123/124: v2 `cd0c05c1`
  (script live `apps/web/scripts/vcut-vite-lock-v2.sh`), v1
  frozen `fd21193c`, suite `1c0d7eaa`. Không script nào đổi
  từ đợt 120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD `a8f26d48` tại chỗ bằng git — HEAD lấy theo khung nhiệm
  vụ; việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 125 khác đang bắt đầu song song (lúc T6 kết
  thúc 20:46Z đã có thư mục round125-t1/t2/t5/t7/t8/t9;
  t3, t4 chưa xuất hiện).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 20:41Z và 20:46Z)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 20:41Z và
  20:46Z (2 snapshot `ps-full-2041Z.txt`, `ps-full-2046Z.txt`):
  toàn bộ tiến trình là systemd (PID 1), systemd-journald,
  hatch daemon, hatch-execd, và các shell `exec` của chính
  các luồng đợt 125. **Không có tiến trình nào tên
  vite/node/webkit/chromium, không có poller/driver/waiter nào
  sống sót qua reboot.**
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot. Histogram `comm`: bash/sleep/
  ps/systemd/hatch/privsep-test-fu — không có node/vite/
  chromium/webkit. (`privsep-test-fu` là tiến trình test helper,
  không liên quan vite.)
- 2 dòng khớp grep "vite" ở snapshot 20:41Z là **cmdline của
  chính các exec khác** (một lệnh tìm file preview.tsx/media.ts
  chứa chữ "vite" trong đường dẫn, một lệnh grep postboot của
  luồng khác) — không phải tiến trình vite. Kiểm bằng histogram
  `comm`, không dùng grep-ps (luật đứng).
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  20:41Z và 20:46Z (vite cũ trên 5189/5590/5554/5555 đều đã
  chết theo reboot, không ai sống sót).
- Replay apt-get sau boot mới: **không còn chạy** — `pgrep -x
  apt-get` = 0, `pgrep -x apt` = 0 lúc 20:41Z và 20:46Z
  (thuộc T5, hạ tầng/postboot; lock không bị ảnh hưởng —
  trống, 0 ticket).

## 2. Lock sau boot mới: TRỐNG, holder cuối đợt 124 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 20:41Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale (T6 không dọn gì vì không có gì
  để dọn).
- Lý do không có stale: sự kiện lock cuối cùng của đợt 124,
  `t10-round124` RELEASED hold 116s lúc **18:38:27Z**, tức
  **1h56'44" TRƯỚC boot mới (20:35:11Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6 đợt
  121, boot #64 ở T6 đợt 122, boot #66 ở T6 đợt 123, boot
  #68 ở T6 đợt 124).
- `status` lúc 20:41Z và 20:45Z: `TRỐNG (không có lock)`,
  `0 ticket + 52 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — QUEUEDIR tồn tại nên nhánh "(hàng đợi
  trống)" không chạy; không phải bug).
- Khoảng yên: **không có event lock nào từ 18:38:27Z tới
  20:46Z (2h07'33", vẫn đang tiếp diễn)**, bao gồm ~6 phút
  đầu sau boot mới. Yên lặng này là do chưa có luồng đợt 125
  nào dùng lock thật trong khoảng đó — không phải do lock kẹt
  (bằng chứng: suite /tmp §6 chạy xanh trên bản script hiện
  hành; và các luồng đợt 125 mới bắt đầu, chưa tới lượt dùng
  lock — xem §3).
- Khoảng yên dài nhất đã khép trong cửa sổ này: **1h54'56"**
  (15:49:08Z → 17:44:04Z, giữa RELEASED cuối đợt 123 và
  snapshot T6 đợt 124). Khoảng yên đang tiếp diễn (từ
  18:38:27Z) đã dài hơn, 2h07'33" lúc T6 kết thúc — vẫn là
  yên do các luồng nghỉ/chưa dùng lock, không phải kẹt (cả
  hai đầu đều là RELEASED sạch, và lock trống đã xác nhận
  bằng `status`).

## 3. Lock dùng sau snapshot T6 đợt 124: 18 cặp mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn — ĐÓNG NỢ T6-124

Từ sau snapshot T6 đợt 124 (512 dòng lúc ~17:44Z) tới nay
(577 dòng, đứng yên từ 18:38:27Z): **+65 dòng = TICKET +18 /
ACQUIRED +18 / RELEASED +18 / COOLDOWN +11 / TIMEOUT +0 /
STALE-LOCK +0 / STALE-TICKET +0.** Khớp từng con số, không có
event nào mất dấu hay thêm lạ. (T10 đóng đợt 124 cũng đếm
577 dòng, gồm 62 dòng `round124` — khớp: 62 dòng có tên
`round124` + 3 dòng thread `t3` không mang hậu tố round.)

- **`t1-round124`: 2 chu kỳ sạch trên cổng 5590**,
  17:44:53–17:45:47Z, hold 54s, wait 1s; và
  17:48:37–17:49:20Z, hold 43s, wait 0s. (Chu kỳ đầu bắt đầu
  17:44:53Z — 49 giây sau snapshot T6 đợt 124.)
- **`t2-round124`: 1 chu kỳ sạch trên cổng 5581**,
  17:53:53–17:54:30Z, hold 37s, wait 0s.
- **`t3` (tên thread trần, không hậu tố round) trên cổng
  5187: 1 chu kỳ sạch**, TICKET 17:59:59Z, ACQUIRED
  18:00:00Z wait 1s, RELEASED 18:04:17Z hold 257s.
- **`t4-round124`: 12 chu kỳ sạch trên cổng 8965**,
  18:01:47–18:21:50Z. Chu kỳ đầu: TICKET 18:01:47Z,
  ACQUIRED 18:04:19Z **wait 152s — xếp hàng sau `t3` đang
  giữ tới 18:04:17Z** (FIFO đúng thiết kế, không TIMEOUT;
  timeout prio normal là 900s). 11 chu kỳ sau đều chờ
  cooldown ~8–10s (COOLDOWN 7999–8708ms), hold 47–55s.
- **`t10-round124`: 2 chu kỳ sạch**,
  18:31:47–18:36:16Z (hold 269s, cổng 5555, wait 0s) và
  18:36:31–18:38:27Z (hold 116s, cổng 5554, wait 15s,
  COOLDOWN 14342ms — chờ cooldown sau lần giữ trước).
- Hold dài nhất đợt 124: **t10 269s**; wait dài nhất:
  **t4 152s** (hàng đợi, không phải kẹt). Cả hai đều nhả
  sạch.
- Đóng nợ mở đợt 124 (§10 mục Lock): T6 đợt 124 để lại
  "tuân thủ lock của luồng đo đợt 124 chưa kiểm được" — nay
  kiểm được cho **t1, t2, t3, t4, t10 đợt 124: cả 18 chu kỳ
  đều sạch**. Các luồng đợt 124 còn lại (t5/t6/t7/t8/t9)
  không có event lock thật nào sau 17:44Z — tức không dùng
  lock thật trong phần còn lại của đợt 124 (không phải vi
  phạm, chỉ là không dùng).
- **Round 124 khép lại sạch trên lock: 18 TICKET = 18
  ACQUIRED = 18 RELEASED sau snapshot T6 đợt 124, 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 18:38:27Z.**
- **Tuân thủ lock của các luồng đo đợt 125: chưa kiểm được
  — chưa có ai dùng lock thật.** Log đứng ở 577 dòng từ
  18:38:27Z tới 20:46Z; các thư mục round125-t1/t2/t5/t7/
  t8/t9 đã tồn tại nhưng `grep -c round125` trên log =
  0. Việc kiểm holder đợt 125 thuộc T6 đợt 126 (hoặc khi
  các luồng bắt đầu dùng lock).
- Không phát hiện luồng nào giữ lock quá hạn hoặc chết không
  nhả trong toàn bộ log từ sau snapshot T6 đợt 124 — không
  có gì để xử lý theo luật lock.

## 4. Nhất quán log lock: 577 dòng, 165/165 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~20:42Z
(14/11 18:01:32Z → 16/11 18:38:27Z; script ghép cặp
`round125-t6/analyze-log.py`, output `analyze-log.txt`):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|
| TICKET | 178 | 87 | 81 |
| ACQUIRED | 169 | 87 | 81 |
| RELEASED | 165 | 87 | 81 |
| COOLDOWN | 51 | 43 | 38 |
| TIMEOUT | 8 | **0** | 0 |
| STALE-LOCK | 5 | **0** | 0 |
| STALE-TICKET | 1 | **0** | 0 |
| **Tổng dòng** | **577** | **304** | **281** |

- So với snapshot T6 đợt 124 (512 dòng lúc ~17:44Z): +65 dòng,
  đúng bằng TICKET +18 / ACQUIRED +18 / RELEASED +18 /
  COOLDOWN +11 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng con
  số, không có event nào mất dấu hay thêm lạ.
- Ghép cặp theo thread: **165 cặp ACQUIRED→RELEASED, 0 lock
  đang giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước
  đó.** Chênh ACQUIRED − RELEASED = 4, đúng bằng 4 ca
  "double-acquire" cũ — không có lock nào mất dấu.
- 4 ca "double-acquire" — **cùng đúng 4 ca T9 đợt 120 đã
  liệt kê** (s3-round116, t3-round117, t4, t3-round119), tất
  cả giải thích được bằng STALE-LOCK cướp sau reboot; **không
  có ca mới nào** từ sau snapshot T9.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũng toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11, dọn holder chết vì reboot #58
  theo luật boot đổi — đã xác nhận ở T9 đợt 120 §4).
- Round 120 khép lại sạch (59 = 59 = 59 trong cửa sổ R120,
  0 TIMEOUT, 0 STALE-LOCK); round 121 khép lại sạch trên
  lock; round 122 cũng khép lại sạch trên lock; round 123
  cũng khép lại sạch trên lock; **round 124 cũng khép lại
  sạch trên lock: 18 TICKET = 18 ACQUIRED = 18 RELEASED sau
  snapshot T6 đợt 124, 0 TIMEOUT, 0 STALE-LOCK, 0 lock nào
  còn giữ sau 18:38:27Z.**
- Đếm loại event trên toàn log: 178+169+165+51+8+5+1 = 577 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log (kiểm bằng đếm loại;
  các dòng TICKET prio=long / TIMEOUT chỉ khác thứ tự trường,
  là định dạng cũ đã biết từ 14/11). **0 dòng chứa DEFER /
  KILLED / ERROR** trong toàn log (grep -i).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 124 (sau 17:44Z) và đợt 125 (tới 20:46Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round124-t*/` + `round125-t*/` (grep ~1 s).
Tổng 25 dòng khớp, phân loại đủ 25/25:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 21 | 7 file `vcut-vite-lock-v2-*.sh` × 3 dòng code `echo` (round124-t1/t2/t4/t9/t10 + round125-t1/t9) |
| Tái hiện có kiểm soát trên /tmp (đợt 124) | 3 | `round124-t6/repro-newmsg.log` ×3 (A/B/C của T6 đợt 124) |
| Comment trong driver (không phải sự kiện) | 1 | `round124-t10/t10-phase1-driver124.sh:42` — "CÓ THỂ BỎ QUA khi chạy lại driver sau reboot" |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 124 (sau 17:44Z) / 125 nào |

- Kiểm sạch độc lập (loại hết script copy, repro và comment):
  `khong-nha-grep.txt` sau khi loại = **0 dòng sự kiện
  thật**.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 tới
  20:46Z = 0.** Khớp với log pairing sạch ở §4 (165/165
  cặp, 0 TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 125 vẫn đang chạy, log của
  chúng có thể tăng sau 20:46Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 125, T6 đợt 126 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của chính T6
  (`khong-nha-grep*.txt`) sẽ bị grep đợt sau khớp lại — phải
  loại `khong-nha-grep` khỏi grep mới đếm đúng (T6 đợt
  123/124/125 đã loại; ghi lại để T6 đợt sau không đếm
  trùng). Bẫy mới đợt này: 1 dòng comment trong driver T10
  chứa cụm "BỎ QUA" — phân loại comment riêng, không tính
  là sự kiện.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 lần chạy + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
(`670c07f6…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9
  PASS, rc=0 cả hai lần**
  (`round125-t6/test-v2-t6-run1.log` 20:44:02–20:44:23Z,
  `test-v2-t6-run2.log` 20:44:23–20:44:44Z):
  - Lần đầu tiên kể từ đợt 120, **không có lần T7 flaky ở
    lần chạy đầu** — T7 xanh cả hai lần chạy (lần 1 và lần 2
    đều PASS=9 FAIL=0). Tính flaky của T7 (T9 đợt 119 §1.2)
    vẫn được ghi nhận là bản chất — một lần xanh kép không
    xóa nó; quyết tách T7 khỏi gate 9/9 khi đợt đông vẫn
    thuộc về parent; T6 không tự đổi test.
  - Kết luận suite: xanh lần thứ bảy liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt 123
    + T6 đợt 124 + T6 đợt 125).
- **Tái hiện message mới (`round125-t6/repro-newmsg.log`,
  20:44:50Z)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123/124, kết quả giống hệt:
  - A. Double-release (acquire tA → release → release lần 2):
    lần 2 in đúng `BỎ QUA release thừa — lock đã trống...`,
    rc=1; status TRỐNG trước và sau; log repro chỉ có đúng
    1 dòng RELEASED cho tA.
  - B. Release khi lock trống từ đầu: cùng câu `BỎ QUA...`,
    rc=1.
  - C. Đối chứng — release sai thread trong lúc tH đang giữ:
    `KHÔNG NHẢ — lock đang do 'tH' giữ, không phải 'tX'...`,
    rc=1; status sau đó vẫn hiện owner tH (guard hoạt động),
    rồi release tH sạch rc=0.
  - Kết luận: **fix text đợt 120 không đổi hành vi; guard còn
    nguyên; thông báo mới phân biệt rõ 2 trường hợp.**
- Bằng chứng lock thật đang chạy tốt trên bản `cd0c05c1`:
  **18 cặp acquire/release thật sau snapshot T6 đợt 124 đều
  sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #68? và
  trống sạch sang boot mới #69?.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #69?,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (165/165
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122/123/124/125 (tới 20:46Z), suite 9/9 độc lập ×2 lần
  chạy (không còn lần T7 flaky ở lần 1), và holder live cuối
  đợt 124 đã nhả sạch trước reboot (hold dài nhất 269s vẫn
  nhả đúng).

## 7. Đo lường housekeeping: cooldown tích lũy 52 file / 728 byte (CHỈ ĐO, KHÔNG prune) + ĐỀ XUẤT LUẬT PRUNE

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 20:41Z:
  **52 file, tổng 728 byte** (mỗi file 14 byte, chứa
  epoch-ms; 52 × 14 = 728 khớp).
- Cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14T18:38Z.
  Mới nhất: `cooldown-t10-round124`, mtime 2026-11-16T18:38Z.
  Khoảng phủ: **đúng 48,0 giờ** (14/11 18:38Z → 16/11
  18:38Z). Phân tầng tuổi lúc 20:47Z: **>48h: 1 file;
  24–48h: 27 file; <24h: 24 file.**
- So với T6 đợt 124 (48 file lúc 17:41Z 16/11): **+4 net**,
  đúng 4 tên file mới sau snapshot đó:
  `cooldown-t1-round124` (17:49Z), `cooldown-t2-round124`
  (17:54Z), `cooldown-t4-round124` (18:21Z),
  `cooldown-t10-round124` (18:38Z). File `cooldown-t3`
  (đã tồn tại từ 10:03Z) bị ghi đè tại chỗ lúc 18:04:17Z
  nên không tăng net (48 + 4 = 52 khớp).
- Script **không có luật prune file cooldown** (chỉ
  `prune_stale_tickets` dọn thư mục ticket; cooldown chỉ được
  ghi đè khi cùng thread release lại) — như T9 đã ghi. Vô hại
  về chức năng: `status` đếm cooldown riêng (không tính là
  ticket — đã vá đợt 115 R4), `acquire` chỉ đọc file cooldown
  của chính thread mình; file cũ hết hạn không chặn ai.
- **T6 KHÔNG prune, KHÔNG xóa file nào** (theo nhiệm vụ —
  chỉ đo, ghi số; quyết prune chờ parent).

### Đề xuất luật prune (chỉ đề xuất — CHƯA áp dụng, chờ quyết parent)

- Cơ sở an toàn (đọc code v2, không sửa): `acquire` chỉ đọc
  file cooldown của chính thread mình (v2 dòng 333–349);
  file chứa epoch-ms lần release cuối, remain = max(0,
  COOLDOWN_MS − đã trôi); file càng cũ thì remain càng về 0
  — file cũ là **inert**. Xóa file cooldown không đổi hành
  vi của bất kỳ thread nào, kể cả thread cùng tên release
  lại sau (file đã xóa = không có cooldown = chờ 0s, giống
  hệt file quá cũ).
- Đề xuất:
  - (a) Mỗi lượt, T6 (luồng housekeeping) xóa file
    `cooldown-*` có mtime cũ hơn **7 ngày** (giữ lại mọi file
    ≤7 ngày bất kể thread).
  - (b) Trần mềm: nếu tổng số file vượt **100** thì xóa file
    cũ nhất cho tới khi còn 100, nhưng không xóa file <48h.
  - (c) Không bao giờ xóa file của đợt hiện tại hoặc đợt ngay
    trước.
  - (d) Ghi số file đã xóa + tên vào log lượt đó.
  - (e) Luật chỉ chạy khi lock đang trống (`status` TRỐNG)
    để tránh chạm vào thread đang giữ.
- Tốc độ tích lũy thực tế: đợt 123→124 là +4 file/đợt
  (nhiều thread trùng tên qua các đợt nên file bị ghi đè,
  không tăng ròng theo số thread). Với nhịp 8 đợt/ngày,
  trần 100 file chỉ chạm sau nhiều ngày nếu không prune —
  luật 7 ngày là đủ dư; **không cần prune gấp**. Chưa có
  quyết thì không có rủi ro chức năng: 52 file / 728 byte
  là không đáng kể.

## 8. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#69?) là số tạm, chưa xác minh độc
  lập:** boot đợt 124 là #68? (T5 ghi tạm); journal/wtmp
  chỉ giữ boot 20:35:11Z nên T6 suy ra đây là boot sau #68?
  (= #69?) từ thứ tự thời gian. Việc chốt số hiệu/thời điểm
  reboot thuộc T5 (mù #37 — parent đã chấp nhận ĐỂ MỞ).
  Không có nguồn nào trên VM loại trừ được boot trung gian
  giữa 18:50Z và 20:35:11Z.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép này không
  xóa tính flaky. Quyết tách T7 khỏi gate 9/9 khi đợt đông
  vẫn thuộc về parent; T6 không tự đổi test. Ghi rõ cả hai
  lần chạy để không giấu lần FAIL (đợt này không có lần FAIL
  nào).
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** —
  `vite-lock: KHÔNG NHẢ — owner hiện tại là '...', không
  phải '...'` (đã kiểm lại dòng 191 trong đợt này). T6 đợt
  120 đã ghi nợ; đang đóng băng, cần parent quyết "mở băng"
  nếu muốn đồng bộ message. Chỉ ghi nhận, không tự mở băng.
- **File cooldown tích lũy (48→52, cũ nhất 14/11, 728 byte
  tổng):** chưa có luật prune; đề xuất luật ở §7 (chờ
  parent). T6 không tự sửa script.
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round124-t*/` (sau 17:44Z)
  + `round125-t*/` tới 20:46Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 125 vẫn đang tăng sau thời điểm đếm; T6 đợt 126 đếm
  tiếp.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 20:45Z (trống, 0 ticket + 52 cooldown); đợt còn
  chạy tới ~23:00Z, **T10 đóng đợt sẽ recount lại lúc đóng**
  (như đợt 124 T10 đã đếm 577 dòng lúc đóng). T6 không chờ
  tới lúc đóng.
- **Tuân thủ lock của luồng đo đợt 125 chưa kiểm được:**
  chưa luồng đợt 125 nào dùng lock thật tới 20:46Z (log
  đứng ở 577 dòng từ 18:38:27Z; `grep -c round125` = 0).
  T6 đợt 126 kiểm tiếp khi các luồng bắt đầu acquire.
- **Replay apt-get sau boot mới đã kết thúc** (pgrep -x = 0
  lúc 20:41Z/20:46Z): T6 không kết luận nó kết thúc ra sao —
  thuộc T5, hạ tầng/postboot; lock không bị ảnh hưởng (trống,
  0 ticket).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 9. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND125_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (không
prune, không xóa).
Stage: `repo-1-push/paths-loop/phase9-round125-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round125-t6/` (analyze-log.py,
analyze-log.txt, new-lines-since-512.txt, cooldown-now.txt,
ps-full-2041Z.txt, ps-full-2046Z.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
repro-newmsg.log).
