# PHASE9 ROUND124 T6 — Sức khỏe lock v2 sau boot mới #68 — LIMITS

- Đợt: 124, luồng T6 (sức khỏe lock v2 sau boot mới + housekeeping).
  Lượt cron 00:35 +07 17/11/2026. Chạy 17:41–17:44Z 16/11/2026
  (00:41–00:44 +07 17/11).
- Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic, KHÔNG prune,
  KHÔNG xóa file cooldown, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` (không đổi trạng thái).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round124-t6/` (analyze-log.py,
  analyze-log.txt, cooldown-now.txt, new-lines-since-476.txt,
  ps-full-1741Z.txt, ps-full-1744Z.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
  repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI (số tạm #68)

- **Reboot mới giữa đợt 123 và đợt 124: boot_id
  `69359761-1650-4956-b3cb-481410689a9b`, btime
  1794850431 = 17:33:51Z theo `/proc/stat`
  (17:34:06Z theo `stat /proc/1` — chênh 15 s giữa hai
  nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả hai,
  không tự chọn một). Uptime ~7 phút lúc T6 bắt đầu
  (17:41Z), load 1,64/2,22/1,18.**
- Số hiệu: T6 ghi tạm **#68**. Lý do: khung nhiệm vụ ghi
  boot #67 btime 14:52:19Z (T5 đợt 123 đã ghi), và boot
  17:33:51Z này đến sau #67. T6 KHÔNG tự xác minh số hiệu
  (thuộc T5, mù #40); `journalctl --list-boots` và wtmp chỉ
  còn giữ boot này (wtmp bắt đầu 17:34:06Z 16/11) — không có
  lịch sử boot độc lập trên máy này.
- md5 khớp baseline đợt 120/121/122/123: v2 `cd0c05c1` (script
  live `apps/web/scripts/vcut-vite-lock-v2.sh`), v1 frozen
  `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt
  120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD `a8f26d48` tại chỗ bằng git — HEAD lấy theo khung nhiệm
  vụ; việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 124 khác đang bắt đầu song song (lúc T6 kết
  thúc 17:44Z đã có thư mục round124-t1/t3/t5/t7/t8/t9/t10;
  t2, t4 chưa xuất hiện).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 17:41Z và 17:44Z)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 17:41Z và
  17:44Z (2 snapshot `ps-full-1741Z.txt`, `ps-full-1744Z.txt`):
  toàn bộ tiến trình là systemd (PID 1), systemd-journald,
  hatch daemon, hatch-execd, và các shell `exec` của chính
  các luồng đợt 124. **Không có tiến trình nào tên
  vite/node/webkit/chromium, không có poller/driver/waiter nào
  sống sót qua reboot.**
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot. Histogram `comm`: bash/sh/ps/
  find/python3/systemd/hatch — không có node/vite/chromium/
  webkit.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  17:41Z và 17:44Z (vite cũ trên 5189/5590/5554/5555 đều đã
  chết theo reboot, không ai sống sót).
- Replay apt-get sau boot mới: **không còn chạy** — `pgrep -x
  apt-get` = 0, `pgrep -x apt` = 0 lúc 17:41Z và 17:44Z
  (lượt replay PID 813 của đợt 123 đã kết thúc sau khi T6
  đợt 123 ghi nhận; T6 không kết luận nó kết thúc ra sao —
  thuộc T5). Đếm bằng `pgrep -x`, không dùng grep-ps (luật
  đứng: grep-ps cho dương tính giả).

## 2. Lock sau boot mới: TRỐNG, holder cuối đợt 123 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 17:41Z — không có file owner stale nào sau boot mới,
  không cần dọn lock stale (T6 không dọn gì vì không có gì
  để dọn).
- Lý do không có stale: sự kiện lock cuối cùng của đợt 123,
  `t10-round123` RELEASED hold 104s lúc **15:49:08Z**, tức
  **1h44'43" TRƯỚC boot mới (17:33:51Z)**. Lock đã trống sẵn
  khi reboot xảy ra — reboot không phải là thứ dọn lock lần
  này (cùng mẫu như boot #60 ở T9 đợt 120, boot #62 ở T6 đợt
  121, boot #64 ở T6 đợt 122, boot #66 ở T6 đợt 123).
- Thêm chi tiết: lock cũng đã trống khi reboot #67
  (14:52:19Z) xảy ra — chu kỳ cuối trước reboot đó,
  `t1-round123`, RELEASED lúc 14:50:49Z, tức 1'30" trước
  reboot #67. Cả hai reboot liên tiếp đều gặp lock trống.
- `status` lúc 17:41Z và 17:44Z: `TRỐNG (không có lock)`,
  `0 ticket + 48 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — QUEUEDIR tồn tại nên nhánh "(hàng đợi
  trống)" không chạy; không phải bug).
- Khoảng yên: **không có event lock nào từ 15:49:08Z tới
  17:44:04Z (1h54'56", vẫn đang tiếp diễn)**, bao gồm ~1h10'
  đầu sau boot mới. Yên lặng này là do chưa có luồng đợt 124
  nào dùng lock thật trong khoảng đó — không phải do lock kẹt
  (bằng chứng: suite /tmp §6 chạy xanh trên bản script hiện
  hành; và các luồng đợt 124 mới bắt đầu, chưa tới lượt dùng
  lock — xem §3).
- Khoảng yên dài nhất đã khép trong cửa sổ này: **45'26"**
  (14:04:48Z → 14:50:14Z, giữa RELEASED cuối đợt 122 và
  TICKET đầu đợt 123). Khoảng yên đang tiếp diễn (từ
  15:49:08Z) đã dài hơn, 1h54'56" lúc T6 kết thúc — vẫn là
  yên do các luồng nghỉ/chưa dùng lock, không phải kẹt (cả
  hai đầu đều là RELEASED sạch, và lock trống đã xác nhận
  bằng `status`).

## 3. Lock dùng sau snapshot T6 đợt 123: 10 cặp mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn

Từ sau snapshot T6 đợt 123 (476 dòng lúc ~14:44Z) tới nay
(512 dòng lúc 17:44Z): **+36 dòng = TICKET +10 / ACQUIRED
+10 / RELEASED +10 / COOLDOWN +6 / TIMEOUT +0 / STALE-LOCK
+0 / STALE-TICKET +0.** Khớp từng con số, không có event nào
mất dấu hay thêm lạ.

- **`t1-round123`: 1 chu kỳ sạch trên cổng 5590**,
  14:50:14–14:50:49Z, hold 35s, wait 0s. (Chu kỳ này xảy ra
  trước reboot #67 14:52:19Z; đã nhả xong trước reboot.)
- **`t2-round123`: 1 chu kỳ sạch trên cổng 5581**,
  15:00:27–15:01:03Z, hold 36s, wait 0s.
- **`t4-round123`: 6 chu kỳ sạch trên cổng 8955**,
  15:01:10–15:05:50Z, hold 35s/34s/34s/34s/34s/34s. 5 lần
  acquire sau lần đầu đều chờ cooldown ~10s (wait_s=10,
  COOLDOWN 9685–9733ms) — cooldown hoạt động đúng thiết kế:
  giữ lại ngay sau nhả thì bị chờ, không phải kẹt.
- **`t10-round123`: 2 chu kỳ sạch**,
  15:43:22–15:47:08Z (hold 226s, cổng 5555, wait 0s) và
  15:47:23–15:49:08Z (hold 104s, cổng 5554, wait 15s,
  COOLDOWN 14559ms — chờ cooldown sau lần giữ trước).
- Đóng nợ mở đợt 123 (§8): T6 đợt 123 để lại "tuân thủ lock
  của luồng đo đợt 123 chưa kiểm được" — nay kiểm được cho
  **t1, t2, t4, t10 đợt 123: cả 10 chu kỳ đều sạch**. Các
  luồng đợt 123 còn lại (t3/t5/t6/t7/t8/t9) không có event
  lock thật nào sau 14:44Z — tức không dùng lock thật trong
  phần còn lại của đợt 123 (không phải vi phạm, chỉ là
  không dùng).
- **Tuân thủ lock của các luồng đo đợt 124: chưa kiểm được
  — chưa có ai dùng lock thật.** Log đứng ở 512 dòng từ
  15:49:08Z tới 17:44:04Z; các thư mục round124-t1/t3/t5/t7/
  t8/t9/t10 đã tồn tại nhưng `grep -c round124` trên log =
  0. Việc kiểm holder đợt 124 thuộc T6 đợt 125 (hoặc khi
  các luồng bắt đầu dùng lock).
- Không phát hiện luồng nào giữ lock quá hạn hoặc chết không
  nhả trong toàn bộ log từ sau snapshot T6 đợt 123 — không
  có gì để xử lý theo luật lock.

## 4. Nhất quán log lock: 512 dòng, 147/147 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~17:41Z
(14/11 18:01:32Z → 16/11 15:49:08Z; script ghép cặp
`round124-t6/analyze-log.py`, output `analyze-log.txt`):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) | Từ boot #66 (14:24:54Z) | Từ boot #67 (14:52:19Z) | Từ boot mới #68 (17:33:51Z) |
|---|---|---|---|---|---|---|
| TICKET | 160 | 69 | 63 | 10 | 9 | 0 |
| ACQUIRED | 151 | 69 | 63 | 10 | 9 | 0 |
| RELEASED | 147 | 69 | 63 | 10 | 9 | 0 |
| COOLDOWN | 40 | 32 | 27 | 6 | 6 | 0 |
| TIMEOUT | 8 | **0** | 0 | 0 | 0 | 0 |
| STALE-LOCK | 5 | **0** | 0 | 0 | 0 | 0 |
| STALE-TICKET | 1 | **0** | 0 | 0 | 0 | 0 |
| **Tổng dòng** | **512** | **239** | **216** | **36** | **33** | **0** |

- So với snapshot T6 đợt 123 (476 dòng lúc ~14:44Z): +36 dòng,
  đúng bằng TICKET +10 / ACQUIRED +10 / RELEASED +10 /
  COOLDOWN +6 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng con
  số, không có event nào mất dấu hay thêm lạ.
- Ghép cặp theo thread: **147 cặp ACQUIRED→RELEASED, 0 lock
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
  lock; round 122 cũng khép lại sạch trên lock; **round 123
  cũng khép lại sạch trên lock: 10 TICKET = 10 ACQUIRED =
  10 RELEASED sau snapshot T6 đợt 123, 0 TIMEOUT,
  0 STALE-LOCK, 0 lock nào còn giữ sau 15:49:08Z.**
- Đếm loại event trên toàn log: 160+151+147+40+8+5+1 = 512 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log (kiểm bằng đếm loại;
  các dòng TICKET prio=long / TIMEOUT chỉ khác thứ tự trường,
  là định dạng cũ đã biết từ 14/11).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 123 (sau 14:44Z) và đợt 124 (tới 17:44Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round123-t*/` + `round124-t*/` (grep ~1 s).
Tổng 13 dòng khớp, phân loại đủ 13/13:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 10 | round123-t1/t2/t4/t9/t10 copy v2 (dòng code `echo` trong script, 2 dòng/file × 5 file) |
| Tái hiện có kiểm soát trên /tmp (đợt 123) | 3 | `round123-t6/repro-newmsg.log` ×3 (A/B/C của T6 đợt 123) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 123 (sau 14:44Z) / 124 nào |

- Kiểm sạch độc lập (loại hết script copy và repro):
  `khong-nha-grep.txt` sau khi loại = **0 dòng sự kiện
  thật**. Riêng các thư mục driver live round123-t1/t2/t4/
  t10 và round124-t5/t9: chỉ khớp bản sao script, không có
  event nào.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0 (toàn đợt, kể cả sau 14:44Z), đợt 124
  tới 17:44Z = 0.** Khớp với log pairing sạch ở §4 (147/147
  cặp, 0 TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 124 vẫn đang chạy, log của
  chúng có thể tăng sau 17:44Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 124, T6 đợt 125 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của chính T6 đợt 123
  (`khong-nha-grep*.txt`) và của T6 đợt 124 sẽ bị grep đợt
  sau khớp lại — phải loại `khong-nha-grep` khỏi grep mới đếm
  đúng (T6 đợt 123/124 đã loại; ghi lại để T6 đợt sau không
  đếm trùng).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 (lần chạy 2; lần 1 T7 flaky) + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: boot mới
(`69359761…`).

- **Suite `test-vite-lock-v2.sh`: lần 1 8/9 (T7 FAIL),
  lần 2 9/9 PASS, rc=0**
  (`round124-t6/test-v2-t6-run1.log` 17:43:10–17:43:20Z,
  `test-v2-t6-run2.log` 17:43:2xZ):
  - Lần 1: T1–T6, T8 PASS; **T7 FAIL: B1=2 B2=2 (muốn
    B1−B2=1)** — đúng tính flaky đã biết của T7 (T9 đợt 119
    §1.2, T6 đợt 123 §8): đẳng thức trên số đếm toàn cục
    trong cửa sổ ~2 s, giữa đợt đông. Không phải hồi quy
    hành vi lock — T1/T2/T5/T6 (FIFO, priority, release-
    between-attempts, cooldown) đều xanh trong cùng lần chạy.
  - Lần 2 (chạy lại nguyên suite, không sửa gì): **9/9 PASS**,
    T7 xanh (2 → 1, bắt được +1 WebProcess giả, không tự
    đếm). Kết luận suite: xanh lần thứ sáu liên tiếp (T6 đợt
    120 + T9 đợt 120 + T6 đợt 121 + T6 đợt 122 + T6 đợt 123
    + T6 đợt 124), với 1 lần T7 flaky ở lần chạy đầu — ghi
    rõ cả hai lần chạy, không giấu lần FAIL.
- **Tái hiện message mới (`round124-t6/repro-newmsg.log`,
  17:43:53Z)** — cùng 3 thí nghiệm A/B/C như T9 đợt 120 và
  T6 đợt 121/122/123, kết quả giống hệt:
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
  **10 cặp acquire/release thật sau snapshot T6 đợt 123 đều
  sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua boot #67 và
  trống sạch sang boot mới #68.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot mới #68,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (147/147
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122/123/124 (tới 17:44Z), suite 9/9 độc lập (lần chạy 2,
  sau 1 lần T7 flaky ở lần 1), và holder live cuối đợt 123
  đã nhả sạch trước reboot (hold dài nhất 226s vẫn nhả đúng).

## 7. Đo lường housekeeping: cooldown tích lũy 48 file / 672 byte (CHỈ ĐO, KHÔNG prune)

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 17:41Z:
  **48 file, tổng 672 byte** (mỗi file 14 byte, chứa
  epoch-ms; 48 × 14 = 672 khớp).
- Cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14T18:38Z.
  Mới nhất: `cooldown-t10-round123`, mtime 2026-11-16T15:49Z.
  Khoảng phủ: ~2 ngày 21 giờ (14/11 18:38Z → 16/11 15:49Z).
- So với T6 đợt 123 (44 file lúc 14:41Z 16/11): **+4 net**,
  đúng 4 thread mới release sau snapshot đó:
  `cooldown-t1-round123` (14:50Z), `cooldown-t2-round123`
  (15:01Z), `cooldown-t4-round123` (15:05Z),
  `cooldown-t10-round123` (15:49Z). Không có file nào bị
  ghi đè thêm hay mất đi trong khoảng này (44 + 4 = 48 khớp).
- Script **không có luật prune file cooldown** (chỉ
  `prune_stale_tickets` dọn thư mục ticket; cooldown chỉ được
  ghi đè khi cùng thread release lại) — như T9 đã ghi. Vô hại
  về chức năng: `status` đếm cooldown riêng (không tính là
  ticket — đã vá đợt 115 R4), `acquire` chỉ đọc file cooldown
  của chính thread mình; file cũ hết hạn không chặn ai.
- **T6 KHÔNG prune, KHÔNG xóa file nào** (theo nhiệm vụ —
  chỉ đo, ghi số; quyết prune chờ parent).

## 8. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#68) là số tạm, chưa xác minh độc
  lập:** khung nhiệm vụ ghi #67 btime 14:52:19Z; journal/wtmp
  chỉ giữ boot 17:33:51Z nên T6 suy ra đây là boot sau #67
  (= #68) từ thứ tự thời gian. Việc chốt số hiệu/thời điểm
  reboot thuộc T5 (mù #40).
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): lần chạy 1
  FAIL (B1=2 B2=2), lần chạy 2 PASS (2 → 1) — cùng một suite,
  không sửa gì. Lần xanh này không xóa tính flaky. Quyết
  tách T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về parent; T6
  không tự đổi test. Ghi rõ cả hai lần chạy để không giấu
  lần FAIL.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** — T6
  đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết "mở
  băng" nếu muốn đồng bộ message.
- **File cooldown tích lũy (44→48, cũ nhất 14/11, 672 byte
  tổng):** không có luật prune; vô hại nhưng nên dọn file
  cooldown cũ hơn X ngày trong một luồng housekeeping sau —
  T6 chỉ đo, không tự sửa script (chờ parent).
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round123-t*/` (sau 14:44Z)
  + `round124-t*/` tới 17:44Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 124 vẫn đang tăng sau thời điểm đếm; T6 đợt 125 đếm
  tiếp.
- **journal/wtmp chỉ giữ boot mới:** T6 không xác minh độc
  lập số hiệu/thời điểm reboot #67 — thuộc T5 (mù #40).
  Boot_id + 2 nguồn btime của boot mới đã ghi ở §0 (chênh
  15 s giữa `/proc/1` và `/proc/stat`).
- **Repo local không có `.git`:** HEAD `a8f26d48` không
  verify tại chỗ; việc verify ref thuộc lúc push (parent,
  public API).
- **Tuân thủ lock của luồng đo đợt 124 chưa kiểm được:**
  chưa luồng đợt 124 nào dùng lock thật tới 17:44Z (log
  đứng ở 512 dòng từ 15:49:08Z; `grep -c round124` = 0).
  T6 đợt 125 kiểm tiếp khi các luồng bắt đầu acquire.
- **Replay apt-get sau boot mới đã kết thúc** (pgrep -x = 0
  lúc 17:41Z/17:44Z): T6 không kết luận nó kết thúc ra sao —
  thuộc T5, hạ tầng/postboot; lock không bị ảnh hưởng (trống,
  0 ticket).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` và
  `test-v2-t6-run2.log` (8/9 rồi 9/9). Thư mục repro /tmp
  của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại).

## 9. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND124_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (không
prune, không xóa).
Stage: `repo-1-push/paths-loop/phase9-round124-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round124-t6/` (analyze-log.py,
analyze-log.txt, cooldown-now.txt, new-lines-since-476.txt,
ps-full-1741Z.txt, ps-full-1744Z.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg.sh,
repro-newmsg.log).
