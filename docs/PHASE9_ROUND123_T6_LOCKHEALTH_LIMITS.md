# PHASE9 ROUND123 T6 — Sức khỏe lock v2 sau boot mới + housekeeping — LIMITS

- Đợt: 123, luồng T6 (sức khỏe lock v2 sau boot mới + housekeeping).
  Lượt cron 21:35 +07 16/11/2026. Chạy 14:41–14:44Z 16/11/2026
  (21:41–21:44 +07).
- Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic, KHÔNG prune,
  KHÔNG xóa file cooldown, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` (không đổi trạng thái).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round123-t6/` (analyze-log.py,
  analyze-log.txt, cooldown-now.txt, ps-full-1441Z.txt,
  ps-full-1444Z.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
  repro-newmsg.sh, repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI (số tạm #66)

- **Reboot mới giữa đợt 122 và đợt 123: boot_id
  `9bbda390-bd64-4679-a1ff-3619899cee7d`, btime
  1794839094 = 14:24:54Z theo `stat /proc/1`
  (1794839083 = 14:24:43Z theo `/proc/stat` — chênh 11 s
  giữa hai nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả
  hai, không tự chọn một). Uptime ~16 phút lúc T6 bắt đầu
  (14:41Z), load 1,73/0,75/0,35.**
- Số hiệu: T6 ghi tạm **#66**. Lý do: T5 đợt 122 đã ghi reboot
  #65 với btime 12:53:25Z, và log lock có event thật lúc
  13:42–14:04Z (sau 12:53Z), nên boot 14:24:54Z này phải là
  một boot SAU #65. Khung nhiệm vụ ghi "boot mới (14:24Z
  16/11, sau reboot #65)" — khớp cách hiểu này (boot này đến
  sau reboot #65). T6 KHÔNG tự xác minh số hiệu (thuộc T5,
  mù #40); `journalctl --list-boots` và wtmp chỉ còn giữ boot
  này (wtmp bắt đầu 14:24:54Z 16/11) — không có lịch sử boot
  độc lập trên máy này.
- md5 khớp baseline đợt 120/121/122: v2 `cd0c05c1` (cả script
  live `apps/web/scripts/vcut-vite-lock-v2.sh` và bản copy
  trong `round122-t1/vcut-vite-lock-v2-copy.sh` — xác nhận
  lại bằng md5 thực tế, không lấy số cũ), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD `a8f26d48` tại chỗ bằng git — HEAD lấy theo khung nhiệm
  vụ; việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 123 khác đang chạy song song (lúc T6 kết thúc
  14:44Z đã có thư mục round123-t2/t3/t4/t5/t7/t8/t9/t10;
  t1 chưa xuất hiện).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 14:41Z và 14:44Z)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 14:41Z và
  14:44Z (2 snapshot `ps-full-1441Z.txt`, `ps-full-1444Z.txt`):
  toàn bộ tiến trình là systemd (PID 1), systemd-journald,
  hatch daemon, hatch-execd, lượt `apt-get update` replay của
  hatch (os-intent replay, PID 813 — hạ tầng host, wrapper
  PID 792, không liên quan vite), và các shell `exec` của
  chính các luồng đợt 123. **Không có tiến trình nào tên
  vite/node/webkit/chromium, không có poller/driver/waiter nào
  sống sót qua reboot.**
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot. Histogram `comm`: bash/sh/ps/
  find/head/systemd/hatch/apt/http/https/gpgv/store — không có
  node/vite/chromium/webkit.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  14:41Z và 14:44Z (vite cũ trên 5189/5590/5554/5555 đều đã
  chết theo reboot, không ai sống sót).
- Lưu ý: `grep -ciE 'vite|node|webkit|chromium'` trên bảng `ps`
  khớp 1 dòng giả — đó là cmdline của chính shell `exec` đang
  chạy lệnh grep (chứa pattern trong câu lệnh), không phải
  tiến trình vite/node thật. Kết luận 0 dựa vào histogram
  `comm`, không dựa vào grep đếm (cùng bẫy như T6 đợt 121/122
  §1 đã ghi).
- Replay apt-get: PID 813, `apt-get update`, etime 07:23 lúc
  14:44Z (bắt đầu ~14:36:41Z, ~12 phút sau boot mới) — lượt
  replay mới sau reboot, vẫn đang chạy lúc T6 kết thúc. Thuộc
  T5 (hạ tầng/postboot), lock không liên quan; mới ~7 phút
  tuổi nên T6 không kết luận gì về dạng kẹt (C) — việc đó
  thuộc luật repair dạng (C) của đợt 123 (đủ 5 điều kiện mới
  can thiệp).

## 2. Lock sau boot mới: TRỐNG, holder cuối đợt 122 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 14:41Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale (T6 không dọn gì vì không có gì
  để dọn).
- Lý do không có stale: sự kiện lock cuối cùng của đợt 122,
  `t10-round122` RELEASED hold 585s lúc **14:04:48Z**, tức
  **20'06" TRƯỚC boot mới (14:24:54Z)**. Lock đã trống sẵn khi
  reboot xảy ra — reboot không phải là thứ dọn lock lần này
  (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6 đợt 121,
  boot #64 ở T6 đợt 122).
- `status` lúc 14:41Z và 14:44Z: `TRỐNG (không có lock)`,
  `0 ticket + 44 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — QUEUEDIR tồn tại nên nhánh "(hàng đợi
  trống)" không chạy; không phải bug).
- Khoảng yên: **không có event lock nào từ 14:04:48Z tới
  14:44:02Z (39'14", vẫn đang tiếp diễn)**, bao gồm ~19 phút
  đầu sau boot mới. Yên lặng này là do chưa có luồng đợt 123
  nào dùng lock thật trong khoảng đó — không phải do lock kẹt
  (bằng chứng: suite /tmp §6 chạy xanh trên bản script hiện
  hành; và các luồng đợt 123 mới bắt đầu, chưa tới lượt dùng
  lock — xem §3).
- Khoảng yên dài nhất trong cửa sổ này: **1h40'36"**
  (12:01:40Z → 13:42:16Z, giữa chu kỳ cuối của t3-round122 và
  chu kỳ đầu của t10-round122) — dài hơn khoảng yên dài nhất
  đợt 122 (1h23'20"). Đây là yên do các luồng đợt 122 nghỉ
  giữa các lần đo, không phải kẹt (cả hai đầu khoảng yên đều
  là RELEASED sạch).

## 3. Lock dùng sau snapshot T6 đợt 122: 8 cặp mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn

Từ sau snapshot T6 đợt 122 (452 dòng lúc ~11:39Z) tới nay
(476 dòng lúc 14:44Z): **+24 dòng = TICKET +8 / ACQUIRED
+8 / RELEASED +8 / COOLDOWN +0 / TIMEOUT +0 / STALE-LOCK +0
/ STALE-TICKET +0.** Khớp từng con số, không có event nào mất
dấu hay thêm lạ.

- **`t3-round122`: 5 chu kỳ sạch trên cổng 5590**,
  11:41:58–12:01:40Z, hold 174s/174s/217s/138s/236s, wait 0s
  tất cả. Không có chu kỳ nào mất release.
- **`t10-round122`: 3 chu kỳ sạch**, 11:40:21–11:40:57Z
  (hold 36s, cổng 5555, wait 0s), 13:42:16–13:47:00Z
  (284s, cổng 5555, wait 0s), 13:55:03–14:04:48Z (**585s,
  cổng 5554, wait 0s** — hold dài nhất trong cửa sổ này,
  vẫn nhả đúng, không phải giữ quá hạn).
- Đóng nợ mở đợt 122 (§8): T6 đợt 122 để lại "tuân thủ lock
  của luồng đo đợt 122 chưa kiểm được" — nay kiểm được cho
  **t3 và t10 đợt 122: cả 8 chu kỳ đều sạch**. Các luồng đợt
  122 còn lại (t1/t2/t4/t5/t7/t8/t9) không có event lock thật
  nào sau 11:39Z — tức không dùng lock thật trong phần còn
  lại của đợt 122 (không phải vi phạm, chỉ là không dùng).
- **Tuân thủ lock của các luồng đo đợt 123 (T1–T4/T9):
  chưa kiểm được — chưa có ai dùng lock thật.** Log đứng ở
  476 dòng từ 14:04:48Z tới 14:44:02Z; các thư mục
  round123-t2/t3/t4/t5/t7/t8/t9/t10 đã tồn tại nhưng chưa
  luồng nào acquire. Việc kiểm holder đợt 123 thuộc T6 đợt
  124 (hoặc khi các luồng bắt đầu dùng lock).
- Không phát hiện luồng nào giữ lock quá hạn hoặc chết không
  nhả trong toàn bộ log từ sau snapshot T6 đợt 122 — không
  có gì để xử lý theo luật lock.
- COOLDOWN +0 trong cửa sổ này dù có 8 lần release: đúng
  thiết kế — event COOLDOWN chỉ ghi khi một acquire bị chờ
  do cooldown (wait_s=0 ở cả 8 lần nên không ghi); file
  cooldown thì vẫn được ghi/đè mỗi lần release (xem §7:
  +2 file mới cho 2 thread khác nhau).

## 4. Nhất quán log lock: 476 dòng, 137/137 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~14:41Z
(14/11 18:01:32Z → 16/11 14:04:48Z; script ghép cặp
`round123-t6/analyze-log.py`, output `analyze-log.txt`):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) | Từ boot #62 (08:25:47Z) | Từ boot mới (14:24:54Z) |
|---|---|---|---|---|---|
| TICKET | 150 | 59 | 53 | 25 | 0 |
| ACQUIRED | 141 | 59 | 53 | 25 | 0 |
| RELEASED | 137 | 59 | 53 | 25 | 0 |
| COOLDOWN | 34 | 26 | 21 | 8 | 0 |
| TIMEOUT | 8 | **0** | 0 | 0 | 0 |
| STALE-LOCK | 5 | **0** | 0 | 0 | 0 |
| STALE-TICKET | 1 | **0** | 0 | 0 | 0 |
| **Tổng dòng** | **476** | **203** | **180** | **83** | **0** |

- So với snapshot T6 đợt 122 (452 dòng lúc ~11:39Z): +24 dòng,
  đúng bằng TICKET +8 / ACQUIRED +8 / RELEASED +8 /
  COOLDOWN +0 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng con
  số, không có event nào mất dấu hay thêm lạ.
- Ghép cặp theo thread: **137 cặp ACQUIRED→RELEASED, 0 lock
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
  lock; round 122 cũng khép lại sạch trên lock: 8 TICKET =
  8 ACQUIRED = 8 RELEASED sau snapshot T6 đợt 122, 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 14:04:48Z.
- Đếm loại event trên toàn log: 141+34+137+5+1+150+8 = 476 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log (kiểm bằng đếm loại;
  các dòng TICKET prio=long / TIMEOUT chỉ khác thứ tự trường,
  là định dạng cũ đã biết từ 14/11).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 122 (sau 11:39Z) và đợt 123 (tới 14:44Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round122-t*/` + `round123-t*/` (grep ~1 s).
Tổng 13 dòng khớp, phân loại đủ 13/13:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 10 | round122-t10/t3/t4/t9 + round123-t9 copy v2 (dòng code `echo` trong script, 2 dòng/file × 5 file) |
| Tái hiện có kiểm soát trên /tmp (đợt 122) | 3 | `round122-t6/repro-newmsg.log` ×3 (A/B/C của T6 đợt 122) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 122 (sau 11:39Z) / 123 nào |

- Kiểm sạch độc lập (loại hết script copy và repro):
  `khong-nha-grep.txt` sau khi loại = **0 dòng sự kiện
  thật**. Riêng các thư mục driver live round122-t3/t10 và
  round123-t9: chỉ khớp bản sao script, không có event nào.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0 (toàn đợt, kể cả sau 11:39Z), đợt 123 tới 14:44Z = 0.**
  Khớp với log pairing sạch ở §4 (137/137 cặp, 0 TIMEOUT,
  0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 123 vẫn đang chạy, log của
  chúng có thể tăng sau 14:44Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 123, T6 đợt 124 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của chính T6 đợt 122
  (`khong-nha-grep*.txt`) và của T6 đợt 123 sẽ bị grep đợt
  sau khớp lại — phải loại `khong-nha-grep` khỏi grep mới đếm
  đúng (T6 đợt 123 đã loại; ghi lại để T6 đợt sau không đếm
  trùng).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 + repro message mới đều xanh (lần thứ năm liên tiếp)

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
(`9bbda390…`).

- **Suite `test-vite-lock-v2.sh`: 9/9 PASS, rc=0**
  (14:43:29–14:43:51Z, `round123-t6/test-v2-t6-run1.log`):
  syntax, T1 FIFO (2<4<5), T2 priority (6<8), T3 stale-lock
  (tuổi 2400s, log có STALE-LOCK), T4 stale-ticket, T5
  release-between-attempts (2<6<9), T6 cooldown (3068 ms ≥
  2500 ms), T7 poll (2→1, diff 1), T8 run-attempt (false→1,
  true→0, lock trống sau cả 2 attempt).
- **Tái hiện message mới (`round123-t6/repro-newmsg.log`,
  14:43:51Z)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122, kết quả giống hệt:
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
  **8 cặp acquire/release thật sau snapshot T6 đợt 122 đều
  sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #64 và
  trống sạch sang boot mới.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (137/137
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122/123 (tới 14:44Z), suite 9/9 độc lập lần thứ năm liên
  tiếp trên bản mới (T6 đợt 120 + T9 đợt 120 + T6 đợt 121 +
  T6 đợt 122 + T6 đợt 123), và holder live cuối đợt 122 đã
  nhả sạch trước reboot (hold dài nhất 585s vẫn nhả đúng).

## 7. Đo lường housekeeping: cooldown tích lũy 44 file / 616 byte (CHỈ ĐO, KHÔNG prune)

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 14:41Z:
  **44 file, tổng 616 byte** (mỗi file 14 byte, chứa
  epoch-ms; 44 × 14 = 616 khớp).
- Cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14T18:38Z.
  Mới nhất: `cooldown-t10-round122`, mtime 2026-11-16T14:04Z.
  Khoảng phủ: ~2 ngày 19 giờ (14/11 18:38Z → 16/11 14:04Z).
- So với T6 đợt 122 (42 file lúc 11:37Z 16/11): **+2 net**,
  đúng 2 thread mới release sau snapshot đó:
  `cooldown-t3-round122` (12:01:40Z),
  `cooldown-t10-round122` (14:04:48Z). Không có file nào bị
  ghi đè thêm hay mất đi trong khoảng này (42 + 2 = 44 khớp).
- Script **không có luật prune file cooldown** (chỉ
  `prune_stale_tickets` dọn thư mục ticket; cooldown chỉ được
  ghi đè khi cùng thread release lại) — như T9 đã ghi. Vô hại
  về chức năng: `status` đếm cooldown riêng (không tính là
  ticket — đã vá đợt 115 R4), `acquire` chỉ đọc file cooldown
  của chính thread mình; file cũ hết hạn không chặn ai.
- **T6 KHÔNG prune, KHÔNG xóa file nào** (theo nhiệm vụ —
  chỉ đo, ghi số; quyết prune chờ parent).

## 8. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#66) là số tạm, chưa xác minh độc
  lập:** T5 đợt 122 ghi #65 btime 12:53:25Z; journal/wtmp
  chỉ giữ boot 14:24:54Z nên T6 suy ra đây là boot sau #65
  (= #66) từ log lock (event 13:42–14:04Z nằm sau 12:53Z).
  Việc chốt số hiệu/thời điểm reboot thuộc T5 (mù #40).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): lần xanh
  này (2→1, diff 1) không xóa tính flaky — đẳng thức trên số
  đếm toàn cục trong cửa sổ ~2 s, giữa đợt đông. Quyết tách
  T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không
  tự đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** — T6
  đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết "mở
  băng" nếu muốn đồng bộ message.
- **File cooldown tích lũy (42→44, cũ nhất 14/11, 616 byte
  tổng):** không có luật prune; vô hại nhưng nên dọn file
  cooldown cũ hơn X ngày trong một luồng housekeeping sau —
  T6 chỉ đo, không tự sửa script (chờ parent).
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round122-t*/` (sau 11:39Z)
  + `round123-t*/` tới 14:44Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 123 vẫn đang tăng sau thời điểm đếm; T1 đợt 123 chưa
  xuất hiện lúc T6 kết thúc.
- **journal/wtmp chỉ giữ boot mới:** T6 không xác minh độc
  lập số hiệu/thời điểm reboot #65 — thuộc T5 (mù #40).
  Boot_id + 2 nguồn btime của boot mới đã ghi ở §0 (chênh
  11 s giữa `/proc/1` và `/proc/stat`).
- **Repo local không có `.git`:** HEAD `a8f26d48` không
  verify tại chỗ; việc verify ref thuộc lúc push (parent,
  public API).
- **Tuân thủ lock của luồng đo đợt 123 chưa kiểm được:**
  chưa luồng đợt 123 nào dùng lock thật tới 14:44Z (log
  đứng ở 476 dòng từ 14:04:48Z). T6 đợt 124 kiểm tiếp khi
  các luồng bắt đầu acquire.
- **Replay apt-get (PID 813) đang chạy sau boot mới** (bắt
  đầu ~14:36:41Z, vẫn chạy lúc 14:44Z): thuộc T5, không phải
  việc T6; mới ~7 phút tuổi nên không kết luận dạng kẹt (C);
  lock không bị ảnh hưởng (trống, 0 ticket).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` (9 PASS).
  Thư mục repro /tmp của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 9. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND123_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (không
prune, không xóa).
Stage: `repo-1-push/paths-loop/phase9-round123-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round123-t6/` (analyze-log.py,
analyze-log.txt, cooldown-now.txt, ps-full-1441Z.txt,
ps-full-1444Z.txt, khong-nha-grep.txt, test-v2-t6-run1.log,
repro-newmsg.sh, repro-newmsg.log).
