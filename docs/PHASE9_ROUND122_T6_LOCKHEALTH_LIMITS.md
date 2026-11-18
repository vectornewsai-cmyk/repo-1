# PHASE9 ROUND122 T6 — Sức khỏe lock v2 sau boot #64 + housekeeping — LIMITS

- Đợt: 122, luồng T6 (sức khỏe lock v2 sau boot #64 + housekeeping).
  Lượt cron 18:35 +07 16/11/2026. Chạy 11:37–11:40Z 16/11/2026
  (18:37–18:40 +07).
- Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic, KHÔNG prune,
  KHÔNG xóa file cooldown, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` (không đổi trạng thái).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round122-t6/` (analyze-log.py,
  analyze-log.txt, cooldown-now.txt, ps-full-1137Z.txt,
  ps-full-1140Z.txt / env-after.log, khong-nha-grep.txt,
  khong-nha-grep-clean.txt, test-v2-t6-run1.log,
  repro-newmsg.sh, repro-newmsg.log).

## 0. Trạng thái lúc bắt đầu — BOOT MỚI #64 (số tạm)

- **Reboot mới giữa đợt 121 và đợt 122: boot #64 (số tạm).**
  boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`, btime
  1794827128 = 11:05:28Z theo `stat /proc/1` (T5 đợt 122 ghi
  btime 1794827118 = 11:05:18Z theo `/proc/stat` — chênh 10 s
  giữa hai nguồn, cùng mẫu chênh như các boot trước; T6 ghi cả
  hai, không tự chọn một). Uptime ~32 phút lúc T6 bắt đầu
  (11:37:41Z), load 1,05/0,63/0,25.
- `journalctl --list-boots` và wtmp chỉ còn giữ boot này
  (wtmp bắt đầu 11:05:29Z 16/11) — không có lịch sử boot độc lập
  cho #63 trên máy này; số hiệu #64 T6 không tự xác minh
  (thuộc T5, mù #40), chỉ ghi boot_id + btime làm bằng chứng.
  Gap #63→#64: T5 ghi 2h12'13" (08:53:05Z → 11:05:18Z) — việc
  chứng nhận gap thuộc T4/T5, T6 chỉ ghi khoảng yên lock (§2).
- md5 khớp baseline đợt 120/121: v2 `cd0c05c1` (= bản sau fix
  text T6 đợt 120), v1 frozen `fd21193c`, suite `1c0d7eaa`.
  Không script nào đổi từ đợt 120 tới nay. Bản copy v2 trong
  `round122-t2/vcut-vite-lock-v2-copy.sh` cũng `cd0c05c1` —
  luồng T2 đợt 122 dùng đúng bản hiện hành.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD `a8f26d48` tại chỗ bằng git — HEAD lấy theo khung nhiệm
  vụ; việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 122 khác đang chạy song song (thư mục
  round122-t1/t2/t5/t7 đã tồn tại lúc T6 kiểm tra lúc 11:39Z;
  t3/t4/t8/t9/t10 chưa xuất hiện).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 11:37Z và 11:39Z)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 11:37Z và
  11:39Z (2 snapshot `ps-full-1137Z.txt`, `ps-full-1140Z.txt`):
  toàn bộ tiến trình là systemd (PID 1), systemd-journald,
  hatch daemon, hatch-execd, lượt `apt-get update` replay của
  hatch (os-intent replay, PID 855 — hạ tầng host, wrapper PID
  834, không liên quan vite), và các shell `exec` của chính các
  luồng đợt 122. **Không có tiến trình nào tên vite/node/
  webkit/chromium, không có poller/driver/waiter nào sống sót
  qua reboot.**
- Đếm trạng thái Z (cột STAT, không đếm chữ "Z" trong cmdline):
  **0 zombie** ở cả 2 snapshot. Histogram `comm`: bash/sh/ps/
  find/head/systemd/hatch/apt/http/https/gpgv/store — không có
  node/vite/chromium/webkit.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  11:37Z và 11:39Z (vite cũ trên 5189/5590/5554/5555 đều đã
  chết theo reboot #64, không ai sống sót).
- Lưu ý: lệnh `grep -c ' Z'` trên bảng `ps` ở đợt này khớp 1
  dòng giả (chữ "Z" nằm trong cmdline dài của shell replay) —
  kết luận 0 zombie dựa vào `awk '$4 ~ /^Z/'` trên cột STAT,
  không dựa vào grep đếm (cùng bẫy như T6 đợt 121 §1 đã ghi).

## 2. Lock sau boot #64: TRỐNG, holder cuối đợt 121 đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 11:37Z — không có file owner stale nào sau boot #64,
  không cần dọn lock stale (T6 không dọn gì vì không có gì
  để dọn).
- Lý do không có stale: sự kiện lock cuối cùng của đợt 121,
  `t10-round121` RELEASED hold 107s lúc **10:16:03Z**, tức
  **49'25" TRƯỚC boot #64 (11:05:28Z)**. Lock đã trống sẵn khi
  reboot xảy ra — reboot không phải là thứ dọn lock lần này
  (cùng mẫu như boot #60 ở T9 đợt 120 và boot #62 ở T6
  đợt 121).
- `status` lúc 11:37Z và 11:39Z: `TRỐNG (không có lock)`,
  `0 ticket + 42 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — QUEUEDIR tồn tại nên nhánh "(hàng đợi
  trống)" không chạy; không phải bug).
- Khoảng yên: **không có event lock nào từ 10:16:03Z tới
  11:39:23Z (1h23'20")**, bao gồm 34' đầu sau boot #64.
  Yên lặng này là do chưa có luồng đợt 122 nào dùng lock thật
  trong khoảng đó — không phải do lock kẹt (bằng chứng: suite
  /tmp §6 chạy xanh trên bản script hiện hành; và T5 đợt 122
  đang bận postboot/replay, chưa tới lượt dùng lock — xem §3).

## 3. Lock dùng sau snapshot T6 đợt 121: 16 cặp mới, tất cả nhả sạch, 0 kẹt, 0 quá hạn

Từ sau snapshot T6 đợt 121 (395 dòng lúc ~08:44Z) tới nay
(452 dòng lúc 11:39Z): **+57 dòng = TICKET +16 / ACQUIRED
+16 / RELEASED +17 / COOLDOWN +8 / TIMEOUT +0 / STALE-LOCK +0
/ STALE-TICKET +0.** RELEASED nhiều hơn ACQUIRED đúng 1 =
holder live `t8-round121` mà T6 đợt 121 để lại (xem dưới).

- **`t8-round121` — holder live lúc T6 đợt 121 kết thúc:
  ĐÃ NHẢ SẠCH, không kẹt.** Hold đầu nhả 08:47:47Z (tổng hold
  307s từ 08:42:40Z — bình thường), rồi thêm 3 chu kỳ
  acquire/release sạch: 08:49:56–08:52:18Z (hold 142s),
  08:56:39–08:59:07Z (148s), 09:02:32–09:04:58Z (146s),
  cổng 5590, wait 0–1s. Không có hold nào quá hạn, không có
  acquire nào không kèm release.
- **`t7-round121`: 8 chu kỳ sạch trên cổng 8953**,
  09:28:31–09:35:05Z, hold 35–37s mỗi lần, cooldown ~9,7–9,8s
  giữa các lần (wait 10s ở các lần sau do cooldown — đúng
  thiết kế). Không có chu kỳ nào mất release.
- **`t3` (đợt 121): 3 chu kỳ sạch trên cổng 5187**,
  09:52:50–10:03:06Z, hold 147s/142s/205s, wait 0–1s.
- **`t10-round121`: 2 chu kỳ sạch**, 10:09:31–10:16:03Z,
  hold 269s (cổng 5555, wait 1s) + 107s (cổng 5554, wait 15s).
  Hold dài nhất đợt này (269s) vẫn nhả đúng, không phải giữ
  quá hạn.
- **Tuân thủ lock của các luồng đo đợt 122 (T1–T4/T9): chưa
  kiểm được — chưa có ai dùng lock thật.** Log không tăng
  từ 10:16:03Z tới 11:39:23Z; round122-t1 chỉ có prereg +
  ledger, round122-t2 có bản copy v2 đúng md5 (`cd0c05c1`)
  nhưng chưa chạy acquire nào, round122-t7 chỉ có file
  status/prereg, round122-t5 đang làm postboot (POSTBOOT_FAIL
  try1 lúc 11:37Z — thuộc T5, replay vẫn đang chạy nên luật
  replay-chết §8.2 chưa kích hoạt; lock không liên quan).
  T3/T4/T8/T9/T10 đợt 122 chưa xuất hiện lúc T6 kết thúc.
  Việc kiểm holder đợt 122 thuộc T6 đợt 123 (hoặc khi các
  luồng bắt đầu dùng lock).
- Không phát hiện luồng nào giữ lock quá hạn hoặc chết không
  nhả trong toàn bộ log từ sau snapshot T6 đợt 121 — không
  có gì để xử lý theo luật lock.

## 4. Nhất quán log lock: 452 dòng, 129/129 cặp, 0 đang giữ, 0 mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~11:38Z
(14/11 18:01:32Z → 16/11 10:16:03Z; script ghép cặp
`round122-t6/analyze-log.py`, output `analyze-log.txt`):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) | Từ boot #62 (08:25:47Z) | Từ boot #64 (11:05:28Z) |
|---|---|---|---|---|---|
| TICKET | 142 | 51 | 45 | 17 | 0 |
| ACQUIRED | 133 | 51 | 45 | 17 | 0 |
| RELEASED | 129 | 51 | 45 | 17 | 0 |
| COOLDOWN | 34 | 26 | 21 | 8 | 0 |
| TIMEOUT | 8 | **0** | 0 | 0 | 0 |
| STALE-LOCK | 5 | **0** | 0 | 0 | 0 |
| STALE-TICKET | 1 | **0** | 0 | 0 | 0 |
| **Tổng dòng** | **452** | **179** | **156** | **59** | **0** |

- So với snapshot T6 đợt 121 (395 dòng lúc ~08:44Z): +57 dòng,
  đúng bằng TICKET +16 / ACQUIRED +16 / RELEASED +17 /
  COOLDOWN +8 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng con
  số, không có event nào mất dấu hay thêm lạ. (+17 RELEASED =
  16 cặp mới + 1 lần nhả của holder live t8-round121.)
- Ghép cặp theo thread: **129 cặp ACQUIRED→RELEASED, 0 lock
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
- Round 120 khép lại sạch (51 = 51 = 51, 0 TIMEOUT,
  0 STALE-LOCK); round 121 cũng khép lại sạch trên lock:
  17 TICKET = 17 ACQUIRED = 17 RELEASED từ boot #62, 0
  TIMEOUT, 0 STALE-LOCK, 0 lock nào còn giữ sau 10:16:03Z.
- Đếm loại event trên toàn log: 133+34+129+5+1+142+8 = 452 =
  tổng dòng — mọi dòng đều thuộc 1 trong 7 loại đã biết,
  **không có dòng lạ nào** trong log (kiểm bằng đếm loại;
  các dòng TICKET prio=long / TIMEOUT chỉ khác thứ tự trường,
  là định dạng cũ đã biết từ 14/11).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 121 (sau 08:42Z) và đợt 122 (tới 11:39Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round121-t*/` + `round122-t*/` (grep ~2,3 s).
Tổng 45 dòng khớp, phân loại đủ 45/45:

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao của grep-output đợt trước (lồng nhau) | 23 | `round121-t6/khong-nha-grep-all.txt` (23 dòng — chính nó là output grep của T6 đợt 121, chứa lại các dòng round120) |
| Bản sao của grep-output đợt trước (lồng nhau) | 9 | `round121-t6/khong-nha-grep.txt` (9 dòng — cùng nguồn) |
| Tái hiện có kiểm soát trên /tmp (đợt 120) | 6 | `round120-t6/repro-before.log` ×3 + `repro-after.log` ×3 |
| Nhắc trong skeleton ghi chú | 2 | `round120-t10/t10-limits-skeleton.sh` ×2 |
| Bản sao script (không phải sự kiện) | 5 | round121-t1/t3/t7/t8/t10 copy v2 (dòng code `echo` trong script) |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 121 (sau 08:42Z) / 122 nào |

- Kiểm sạch độc lập (loại hết grep-output lồng nhau, script
  copy, repro, skeleton): `khong-nha-grep-clean.txt` = **0
  dòng**. Riêng các thư mục driver live round121-t7/t8/t3/t10
  và round122-t5: chỉ khớp bản sao script, không có event
  nào.
- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0 (toàn đợt,
  kể cả sau 08:42Z), đợt 122 tới 11:39Z = 0.** Khớp với log
  pairing sạch ở §4 (129/129 cặp, 0 TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 122 vẫn đang chạy, log của
  chúng có thể tăng sau 11:39Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 122, T6 đợt 123 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).
- Bẫy đếm gặp lần này: file grep-output của chính T6 đợt 121
  (`khong-nha-grep*.txt`) bị grep đợt này khớp lại — phải loại
  `khong-nha-grep` khỏi grep mới đếm đúng. Ghi lại để T6 đợt
  sau không đếm trùng.

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 + repro message mới đều xanh (lần thứ tư liên tiếp)

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật. Boot ghi trong status repro: #64
(`3fe7e89e…`).

- **Suite `test-vite-lock-v2.sh`: 9/9 PASS, rc=0**
  (11:39:12Z, `round122-t6/test-v2-t6-run1.log`):
  syntax, T1 FIFO (2<4<5), T2 priority (6<8), T3 stale-lock
  (159 ms, log có STALE-LOCK), T4 stale-ticket, T5
  release-between-attempts (2<6<8), T6 cooldown (3055 ms ≥
  2500 ms), T7 poll (3→2, diff 1), T8 run-attempt (false→1,
  true→0, lock trống sau cả 2 attempt).
- **Tái hiện message mới (`round122-t6/repro-newmsg.log`,
  11:39:15–11:39:16Z)** — cùng 3 thí nghiệm A/B/C như T9
  đợt 120 và T6 đợt 121, kết quả giống hệt:
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
  **16 cặp acquire/release thật sau snapshot T6 đợt 121 đều
  sạch (§3)** — đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng qua 2 boot (#62,
  #63) và trống sạch sang boot #64.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot #64,
  0 zombie, 0 stale, queue 0 ticket, log nhất quán (129/129
  cặp + 0 đang giữ, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ
  đợt 120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/
  122 (tới 11:39Z), suite 9/9 độc lập lần thứ tư liên tiếp
  trên bản mới (T6 đợt 120 + T9 đợt 120 + T6 đợt 121 + T6
  đợt 122), và holder live cuối đợt 121 đã nhả sạch trước
  reboot #64.

## 7. Đo lường housekeeping: cooldown tích lũy 42 file / 588 byte (CHỈ ĐO, KHÔNG prune)

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 11:37Z:
  **42 file, tổng 588 byte** (mỗi file 14 byte, chứa
  epoch-ms).
- Cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14T18:38Z.
  Mới nhất: `cooldown-t10-round121`, mtime 2026-11-16T10:16Z.
  Khoảng phủ: ~2 ngày 15 giờ (14/11 18:38Z → 16/11 10:16Z).
- So với T6 đợt 121 (38 file lúc 08:39Z 16/11): **+4 net**,
  đúng 4 thread mới release sau snapshot đó:
  `cooldown-t8-round121` (09:04:58Z),
  `cooldown-t7-round121` (09:35:05Z),
  `cooldown-t3` (10:03:06Z),
  `cooldown-t10-round121` (10:16:03Z). Không có file nào bị
  ghi đè thêm hay mất đi trong khoảng này (38 + 4 = 42 khớp).
- Script **không có luật prune file cooldown** (chỉ
  `prune_stale_tickets` dọn thư mục ticket; cooldown chỉ được
  ghi đè khi cùng thread release lại) — như T9 đã ghi. Vô hại
  về chức năng: `status` đếm cooldown riêng (không tính là
  ticket — đã vá đợt 115 R4), `acquire` chỉ đọc file cooldown
  của chính thread mình; file cũ hết hạn không chặn ai.
- **T6 KHÔNG prune, KHÔNG xóa file nào** (theo nhiệm vụ —
  chỉ đo, ghi số; quyết prune chờ parent).

## 8. Hạn chế trung thực + nợ mở

- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): lần xanh
  này (3→2, diff 1) không xóa tính flaky — đẳng thức trên số
  đếm toàn cục trong cửa sổ ~2 s, giữa đợt đông. Quyết tách
  T7 khỏi gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không
  tự đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** — T6
  đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết "mở
  băng" nếu muốn đồng bộ message.
- **File cooldown tích lũy (38→42, cũ nhất 14/11, 588 byte
  tổng):** không có luật prune; vô hại nhưng nên dọn file
  cooldown cũ hơn X ngày trong một luồng housekeeping sau —
  T6 chỉ đo, không tự sửa script (chờ parent).
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round121-t*/` +
  `round122-t*/` tới 11:39Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 122 vẫn đang tăng sau thời điểm đếm; T3/T4/T8/T9/T10
  đợt 122 chưa xuất hiện lúc T6 kết thúc.
- **journal/wtmp chỉ giữ boot #64:** T6 không xác minh độc
  lập số hiệu/thời điểm reboot #63/#64 — thuộc T5 (mù #40).
  Boot_id + 2 nguồn btime của #64 đã ghi ở §0 (chênh 10 s
  giữa `/proc/1` và `/proc/stat`).
- **Repo local không có `.git`:** HEAD `a8f26d48` không
  verify tại chỗ; việc verify ref thuộc lúc push (parent,
  public API).
- **Tuân thủ lock của luồng đo đợt 122 chưa kiểm được:**
  chưa luồng đợt 122 nào dùng lock thật tới 11:39Z (log
  đứng ở 452 dòng từ 10:16:03Z). T6 đợt 123 kiểm tiếp khi
  các luồng bắt đầu acquire.
- **T5 đợt 122 đang xử lý boot #64** (POSTBOOT_FAIL try1
  11:37Z, replay đang chạy — wrapper PID 834, apt-get PID
  855): thuộc T5, không phải việc T6; lock không bị ảnh
  hưởng (trống, 0 ticket).
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
| `docs/PHASE9_ROUND122_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), suite (`1c0d7eaa`), file cooldown (không
prune, không xóa).
Stage: `repo-1-push/paths-loop/phase9-round122-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round122-t6/` (analyze-log.py,
analyze-log.txt, cooldown-now.txt, ps-full-1137Z.txt,
ps-full-1140Z.txt, env-after.log, khong-nha-grep.txt,
khong-nha-grep-clean.txt, test-v2-t6-run1.log,
repro-newmsg.sh, repro-newmsg.log).
