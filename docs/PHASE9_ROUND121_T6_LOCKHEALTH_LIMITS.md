# PHASE9 ROUND121 T6 — Sức khỏe lock v2 sau boot #62 + đo housekeeping cooldown — LIMITS

- Đợt: 121, luồng T6 (sức khỏe lock v2 sau boot #62 + đo lường
  housekeeping cooldown). Lượt cron 15:35 +07 16/11/2026.
  Chạy 08:39–08:44Z 16/11/2026 (15:39–15:44 +07).
- Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic, KHÔNG prune,
  KHÔNG xóa file cooldown, KHÔNG sửa script lock, KHÔNG đụng
  production. Mọi thí nghiệm acquire/release dùng lock dir /tmp
  riêng; lock thật chỉ đọc qua `status` (không đổi trạng thái).
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet,
  `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round121-t6/` (analyze-log.py,
  analyze-log.txt, khong-nha-grep.txt, khong-nha-grep-all.txt,
  test-v2-t6-run1.log, repro-newmsg.sh, repro-newmsg.log,
  env-after.log).

## 0. Trạng thái lúc bắt đầu

- Boot #62 (theo khung nhiệm vụ): boot_id
  `9788ce28-c334-40f4-bc21-e93d298b0f9b`,
  btime 1794817547 = 08:25:47Z 16/11; uptime ~14 phút lúc T6 bắt
  đầu (08:39:08Z), load 2,11/1,05/0,46.
- `journalctl --list-boots` và wtmp chỉ còn giữ boot này
  (wtmp bắt đầu 08:25:57Z 16/11) — không có lịch sử boot độc lập
  cho #60/#61 trên máy này; số hiệu #62 T6 không tự xác minh
  (thuộc T5, mù #37/#38), chỉ ghi boot_id + btime làm bằng chứng.
- md5 khớp baseline đợt 120: v2 `cd0c05c1` (= bản sau fix text
  T6 đợt 120), v1 frozen `fd21193c`, poll-quiet `1710e480`,
  suite `1c0d7eaa`. Không script nào đổi từ đợt 120 tới nay.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc, không phải checkout) nên T6 không verify
  HEAD `a8f26d48` tại chỗ bằng git — HEAD lấy theo khung nhiệm
  vụ; việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 121 khác đang chạy song song (thư mục
  round121-t2/t3/t4/t5/t10 đã tồn tại lúc T6 bắt đầu).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 08:39Z)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 08:39Z: toàn
  bộ tiến trình là systemd (PID 1), systemd-journald, hatch
  daemon, hatch-execd, và các shell `exec` của chính các luồng
  đợt 121, cộng một lượt `apt-get update` replay của hatch
  (os-intent replay, PID 815 — hạ tầng host, không liên quan
  vite). **Không có tiến trình nào tên vite/node/webkit/
  chromium, không có poller/driver/waiter nào sống sót qua
  reboot.**
- Đếm trạng thái Z: **0 zombie**. Histogram `comm` lúc 08:39Z:
  bash/sleep/sort/uniq/ps/systemd/hatch/apt — không có
  node/vite/chromium/webkit.
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** lúc
  08:39Z (vite cũ trên 5189/5590/5554/5555 đều đã chết theo
  reboot, không ai sống sót). Lưu ý: lệnh `grep -iE 'vite|...'`
  trên bảng `ps` chỉ khớp cmdline của chính shell exec đang
  chạy lệnh đó — không phải tiến trình thật; kết luận trên dựa
  vào bảng `ps` đầy đủ, không dựa vào grep đếm.
- Sau đó (08:42–08:44Z) tiến trình vite/node/chrome XUẤT HIỆN
  trở lại — nhưng đó là việc live của đợt 121 (xem §3), không
  phải sót từ trước reboot: zombie vẫn 0 lúc 08:43:35Z và lúc
  env-after (~08:44Z).

## 2. Lock sau boot #62: TRỐNG lúc bắt đầu, holder cuối đã nhả sạch trước reboot

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 08:39Z — không có file owner stale nào sau boot #62,
  không cần dọn lock stale (T6 không dọn gì vì không có gì
  để dọn).
- Lý do không có stale: holder cuối cùng trước reboot,
  `t3-round120`, đã nhả sạch lúc **07:21:06Z** (RELEASED hold
  55s, dòng 393 của log), tức **1h04'41" TRƯỚC boot #62
  (08:25:47Z)**. Lock đã trống sẵn khi reboot xảy ra — reboot
  không phải là thứ dọn lock lần này (cùng mẫu như boot #60
  ở T9 đợt 120).
- `status` lúc 08:39Z: `TRỐNG (không có lock)`,
  `0 ticket + 38 cooldown`. `queue` in rỗng, rc=0 (cosmetic
  như T9 đợt 120 §3 — QUEUEDIR tồn tại nên nhánh "(hàng đợi
  trống)" không chạy; không phải bug).
- Khoảng yên: **không có event lock nào từ 07:21:06Z tới
  08:42:40Z (1h21'34")**, bao gồm 16'53" đầu sau boot #62.
  Yên lặng này là do chưa có luồng đợt 121 nào dùng lock thật
  trong khoảng đó — không phải do lock kẹt (bằng chứng: ngay
  khi T8 đợt 121 bắt đầu dùng lúc 08:42:40Z, lock hoạt động
  bình thường, xem §3).

## 3. Lock đang được dùng bình thường sau boot #62: holder live t8-round121

- Event đầu tiên sau boot #62: **08:42:40Z, `t8-round121`
  TICKET → ACQUIRED, wait 0s, cổng 5590** (dòng 394–395 của
  log) — 16'53" sau boot. Đây là lần dùng lock thật đầu tiên
  của đợt 121.
- Trạng thái lúc 08:43:35Z (kiểm lại sau repro): lock **ĐANG
  GIỮ hợp lệ bởi `t8-round121`** (started 08:42:40Z, tuổi 55s,
  owner pid 6735 còn sống, vite pid 6912 trên cổng 5590,
  `curl cổng 5590: SERVING`). `status` hiện đầy đủ owner
  (thread/pid/port/ticket/started/boot khớp boot #62).
  `0 ticket` chờ + 38 cooldown.
- Listener duy nhất lúc đó: `127.0.0.1:5590` (vite của holder)
  — đúng cổng holder đang giữ, không có cổng lạ nào.
- Các tiến trình node khác lúc 08:43:35Z đều là việc live của
  đợt 121, có parent sống, không zombie/không mồ côi:
  probe của T8 (`probe121t8-h3fext-ab.mjs`, pid 6849, con của
  owner 6735), vite 6912 + esbuild 6954 (con của probe), ticker
  của T2 (`ticker.mjs`, pid 3810) và 2 vòng lặp hog load của T2
  (pid 7439/7442, con của 3805). Trạng thái Sl/Rl/RNl — đang
  chạy, không phải sót.
- Histogram lúc env-after (~08:44Z) có thêm 9 tiến trình
  `chrome` + `chrome_crashpad` + `Xvfb` — trình duyệt của
  probe Chromium của T8 (đang chạy live); zombie vẫn 0.
  T6 không snapshot parent từng chrome (chỉ histogram) —
  ghi rõ giới hạn này; kết luận zombie dựa vào đếm STAT Z
  toàn bảng (0), không dựa vào histogram.
- T6 kết thúc lúc holder vẫn đang giữ (không chờ nó nhả —
  không phải việc của T6; nếu nó kẹt thì luồng khác hoặc T6
  đợt sau mới thấy).

## 4. Nhất quán log lock: 395 dòng, 112/112 cặp, 1 đang giữ live, 0 còn mất dấu

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~08:44Z
(14/11 18:01:32Z → 16/11 08:42:40Z; script ghép cặp
`round121-t6/analyze-log.py`, output `analyze-log.txt`):

| Sự kiện | Tổng | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) | Từ boot #62 (08:25:47Z) |
|---|---|---|---|---|
| TICKET | 126 | 35 | 29 | 1 |
| ACQUIRED | 117 | 35 | 29 | 1 |
| RELEASED | 112 | 34 | 28 | 0 |
| COOLDOWN | 26 | 18 | 13 | 0 |
| TIMEOUT | 8 | **0** | 0 | 0 |
| STALE-LOCK | 5 | **0** | 0 | 0 |
| STALE-TICKET | 1 | **0** | 0 | 0 |
| **Tổng dòng** | **395** | **122** | **99** | **2** |

- So với snapshot T9 đợt 120 (296 dòng lúc ~05:49Z): +99 dòng,
  đúng bằng TICKET +29 / ACQUIRED +29 / RELEASED +28 /
  COOLDOWN +13 / TIMEOUT +0 / STALE-LOCK +0 — khớp từng con
  số, không có event nào mất dấu hay thêm lạ.
- Ghép cặp theo thread: **112 cặp ACQUIRED→RELEASED, 1 lock
  đang giữ ở cuối log (`t8-round121`, ACQUIRED 08:42:40Z —
  live, xem §3), 0 lần RELEASED không có ACQUIRED trước đó.**
  Chênh ACQUIRED − RELEASED = 5, đúng bằng 4 ca
  "double-acquire" cũ + 1 ca đang giữ live — không có lock
  nào mất dấu.
- 4 ca "double-acquire" — **cùng đúng 4 ca T9 đợt 120 đã
  liệt kê** (s3-round116, t3-round117, t4, t3-round119), tất
  cả giải thích được bằng STALE-LOCK cướp sau reboot; **không
  có ca mới nào** từ sau snapshot T9.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11, t9 chờ 900s cổng 5581) — đợt 120+ có **0 TIMEOUT**;
  5 STALE-LOCK + 1 STALE-TICKET cũng toàn bộ từ trước đợt 120
  (lần cuối 01:04:20–21Z 16/11, dọn holder chết vì reboot #58
  theo luật boot đổi — đã xác nhận ở T9 đợt 120 §4).
- Round 120 khép lại sạch: 35 TICKET = 35 ACQUIRED, 34
  RELEASED + 1 đang giữ live (t8-round121, thuộc đợt 121),
  18 COOLDOWN, 0 TIMEOUT, 0 STALE-LOCK.

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 120 và 121 (tới 08:42Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round120-t*/` + `round121-t*/` (109 file `.log` +
mọi file khác; grep ~4,4 s, không grep toàn cây hidden_files
như T9 đã cảnh báo là quá chậm). Tổng 23 dòng khớp, phân loại
đủ 23/23 (file `khong-nha-grep-all.txt`):

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 12 | round120-t1/t3/t8 copy v2, round120-t10 + round121-t3/t10 copy v2 (dòng 421/423, code `echo` trong script) |
| Nhắc trong skeleton ghi chú | 2 | round120-t10/t10-limits-skeleton.sh ×2 |
| Tái hiện có kiểm soát trên /tmp | 9 | round120-t6 repro-before ×3 + repro-after ×3, round120-t9 repro-newmsg ×3 |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 120/121 nào |

- **Tổng trên lock thật từ sau đếm của T9 (đợt 119: 4 sự
  kiện, tất cả vô hại): đợt 120 = 0, đợt 121 tới 08:42Z = 0.**
  Khớp với log pairing sạch ở §4 (34/34 cặp đợt 120, 0
  TIMEOUT, 0 STALE-LOCK).
- Giới hạn phạm vi: các luồng đợt 121 vẫn đang chạy, log của
  chúng có thể tăng sau 08:42Z — nếu có sự kiện mới sau thời
  điểm đếm thì thuộc đợt 121, T6 đợt 122 đếm tiếp. T6 không
  quét toàn cây hidden_files (lý do như T9 đợt 120 §8).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 + repro message mới đều xanh

Script v2 lúc kiểm: `cd0c05c1` (bản sau fix text T6 đợt 120).
Suite + repro chạy trên lock dir /tmp riêng, cổng 599x,
không đụng lock thật.

- **Suite `test-vite-lock-v2.sh`: 9/9 PASS, rc=0**
  (08:42:15–08:42:36Z, `round121-t6/test-v2-t6-run1.log`):
  syntax, T1 FIFO (2<4<5), T2 priority (6<8), T3 stale-lock
  (159 ms, log có STALE-LOCK), T4 stale-ticket, T5
  release-between-attempts (2<6<8), T6 cooldown (3060 ms ≥
  2500 ms), T7 poll (3→2, diff 1), T8 run-attempt (false→1,
  true→0, lock trống sau cả 2 attempt).
- **Tái hiện message mới (`round121-t6/repro-newmsg.log`,
  08:42:53–08:42:56Z)** — cùng 3 thí nghiệm A/B/C như T9
  đợt 120, kết quả giống hệt:
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
  **T8 đợt 121 dùng lock thật ngay trong lúc T6 kiểm tra**
  (TICKET → ACQUIRED wait 0s 08:42:40Z, vite SERVING trên
  5590 — xem §3). Đây là bằng chứng live (không phải chỉ
  suite /tmp) rằng lock v2 hoạt động đúng sau boot #62.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot, 0 zombie,
  0 stale, queue 0 ticket, log nhất quán (112/112 cặp + 1
  đang giữ live, 0 mất dấu), 0 TIMEOUT/STALE-LOCK mới từ đợt
  120, 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121,
  suite 9/9 độc lập lần thứ ba liên tiếp trên bản mới
  (T6 đợt 120 + T9 đợt 120 + T6 đợt 121), và luồng khác đang
  dùng lock thật bình thường.

## 7. Đo lường housekeeping: cooldown tích lũy 38 file / 532 byte (CHỈ ĐO, KHÔNG prune)

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 08:39Z:
  **38 file, tổng 532 byte** (mỗi file 14 byte, chứa
  epoch-ms).
- Cũ nhất: `cooldown-r4-round115`, mtime 2026-11-14T18:38Z.
  Mới nhất: `cooldown-t3-round120`, mtime 2026-11-16T07:21Z.
  Khoảng phủ: ~2 ngày 12 giờ (14/11 18:38Z → 16/11 07:21Z).
- So với T9 đợt 120 (35 file lúc 05:47Z 16/11): **+3 net**.
  Mới: `cooldown-round120-t8-n10` (06:28Z),
  `cooldown-t10-round120` (07:15Z), `cooldown-t3-round120`
  (07:21Z). Ghi đè (cùng tên thread, không tăng số file):
  `cooldown-t4` (07:05Z). Tốc độ tích lũy ≈ 1 file / thread
  khác nhau từng release; dung lượng không đáng kể (532 byte),
  chỉ là rác tên file tăng dần.
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
- **File cooldown tích lũy (35→38, cũ nhất 14/11, 532 byte
  tổng):** không có luật prune; vô hại nhưng nên dọn file
  cooldown cũ hơn X ngày trong một luồng housekeeping sau —
  T6 chỉ đo, không tự sửa script (chờ parent).
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round120-t*/` +
  `round121-t*/` tới 08:42Z, không quét toàn cây
  hidden_files** (lý do như T9 đợt 120 §8). Log các luồng
  đợt 121 vẫn đang tăng sau thời điểm đếm.
- **journal/wtmp chỉ giữ boot #62:** T6 không xác minh độc
  lập số hiệu/thời điểm reboot #61/#62 — thuộc T5 (mù #37/
  #38). Boot_id + btime của #62 đã ghi ở §0.
- **Repo local không có `.git`:** HEAD `a8f26d48` không
  verify tại chỗ; việc verify ref thuộc lúc push (parent,
  public API).
- **Holder t8-round121 vẫn đang giữ lúc T6 kết thúc**
  (08:44Z): T6 không chờ nó nhả. Nếu phiên sau thấy nó còn
  giữ quá lâu thì mới là dấu hiệu cần xem — lúc này là giữ
  live bình thường (vite SERVING, owner pid sống).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng
  suite là stdout đầy đủ trong `test-v2-t6-run1.log` (9 PASS).
  Thư mục repro /tmp của T6 đã dọn sạch sau khi xong.
- T6 không sửa production; không chạy tsc/vite build (không
  sửa code nào nên không có gì để build lại; cây cuối đợt 120
  đã được T10 chạy lại suite 27/27 + O8 21/21 + 21/21 khi đóng
  đợt).

## 9. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND121_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v2 (`cd0c05c1`), v1
frozen (`fd21193c`), poll-quiet (`1710e480`), suite
(`1c0d7eaa`), file cooldown (không prune, không xóa).
Stage: `repo-1-push/paths-loop/phase9-round121-t6-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round121-t6/` (analyze-log.py,
analyze-log.txt, khong-nha-grep.txt, khong-nha-grep-all.txt,
test-v2-t6-run1.log, repro-newmsg.sh, repro-newmsg.log,
env-after.log).
