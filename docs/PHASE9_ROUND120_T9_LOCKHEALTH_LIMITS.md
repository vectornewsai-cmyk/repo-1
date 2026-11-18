# PHASE9 ROUND120 T9 — Sức khỏe lock v2 / queue / zombie sau boot #60 — LIMITS

- Đợt: 120, luồng T9 (sức khỏe lock v2 / queue / zombie sau boot #60).
  Lượt cron 12:35 +07 16/11/2026. Chạy 05:40–05:50Z 16/11/2026
  (12:40–12:50 +07). Nhiệm vụ: kiểm chứng độc lập, KHÔNG sửa logic.
- KHÔNG push/tag/binary. T9 không sửa file production nào (script lock
  đổi md5 giữa lúc T9 chạy là do T6 đợt 120 sửa text — xem §6).
  Không đụng TTS 39, birefnet, `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round120-t9/` (test-v2-t9-run1.log,
  repro-newmsg.log, env-after.log).

## 0. Trạng thái lúc bắt đầu

- Boot #60 (tạm): boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d`,
  btime 1794804349 = 04:45:49Z 16/11; uptime 55 phút lúc T9 bắt đầu
  (05:40:58Z), load 1,19/0,75/0,37.
- Baseline: `preview.tsx` md5 `5be5a250` (= baseline đợt 120, patch
  H3f), `media.ts` `2c384ed1` — không đổi trước/sau việc của T9.
- Script lock lúc T9 bắt đầu (05:40:58Z): v2 `5cac10af` (= bản đợt
  119), v1 frozen `fd21193c`, poll-quiet `1710e480`, suite
  `1c0d7eaa` — đều khớp md5 T9 đợt 119 ghi. **Giữa lúc T9 chạy,
  T6 đợt 120 apply fix text thông báo (05:42:4xZ) → v2 thành
  `cd0c05c1`** (xem §6). Vì vậy T9 kiểm chứng trên CẢ HAI bản:
  quét zombie/queue/log lúc 05:40–05:41 chạy trên bản cũ (nhưng
  các lệnh đó không đụng đoạn code T6 sửa), suite + tái hiện
  double-release lúc 05:43–05:45 chạy trên bản mới.
- wtmp + `journalctl --list-boots` chỉ còn giữ boot #60 (wtmp bắt
  đầu 04:46:00Z 16/11) — không có lịch sử boot độc lập cho #57–#59
  trên máy này; số thứ tự reboot thuộc T6 (mù #37), T9 không tự
  kết luận số hiệu (xem §4 cuối).

## 1. Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit, 0 cổng lắng nghe

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 05:41Z: toàn bộ
  tiến trình là systemd (PID 1), systemd-journald, hatch daemon,
  hatch-execd, và các shell `exec` của chính các luồng đợt 120
  (trong đó có 1 shell của luồng khác đang grep mã khác). **Không
  có tiến trình nào tên vite/node/webkit/chromium, không có
  poller/driver/waiter nào sống sót qua reboot.**
- Đếm trạng thái Z: **0 zombie**. Histogram `comm` lúc 05:47Z:
  bash/sleep/sort/uniq/ps/systemd/hatch — không có node/vite/
  chromium/webkit (8 tiến trình `sleep` là sleep của suite các
  luồng khác, không phải vite).
- `ss -tlnp`: **không có cổng TCP nào đang lắng nghe** (vite cũ
  trên 5189/5590/5554/5555 đều đã chết theo reboot, không ai sống
  sót). Lưu ý: lệnh `ps aux | grep -icE 'vite|...'` cho ra 4 là
  do chính cmdline của shell exec chứa chuỗi đó — không phải
  tiến trình thật; kết luận trên dựa vào bảng `ps` đầy đủ, không
  dựa vào grep đếm.
- Kết luận: **không còn zombie nào sau boot #60; không cần dọn
  tiến trình nào.**

## 2. Lock sau boot #60: TRỐNG, không có stale lock để dọn

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại** lúc
  05:41Z — không có file owner stale nào sau boot #60, không cần
  dọn lock stale (T9 không dọn gì vì không có gì để dọn).
- Lý do không có stale: holder cuối cùng trước reboot,
  `t10-round119`, đã nhả sạch lúc **02:15:33Z** (RELEASED hold 72s),
  tức 2h30' TRƯỚC boot #60 (04:45:49Z). Lock đã trống sẵn khi
  reboot xảy ra — reboot không phải là thứ dọn lock lần này.
- `status` lúc 05:41Z: `TRỐNG (không có lock)`, `0 ticket +
  34 cooldown`. `status` lúc 05:47Z và 05:49Z: vẫn TRỐNG,
  `0 ticket + 35 cooldown` — file cooldown thứ 35 là
  `cooldown-round120-t8-e1` tạo 05:47:31Z (xem §3, §5).
- Khoảng yên: **không có event lock nào từ 02:15:33Z tới 05:46:32Z**
  (3h31'), bao gồm 1h01' đầu sau boot #60. Yên lặng này là do
  chưa có luồng đợt 120 nào dùng lock thật trong khoảng đó —
  không phải do lock kẹt (bằng chứng: ngay khi T8-e1 bắt đầu dùng
  lúc 05:46:32Z, lock hoạt động bình thường, xem §5).

## 3. Queue v2: 0 ticket sống, 34→35 file cooldown (tích lũy, vô hại)

- Thư mục queue `hidden_files/vite.lock.queue/`: **0 thư mục
  ticket**, chỉ còn file `cooldown-*`. Đếm lúc 05:41Z: 34 file;
  lúc 05:47Z: 35 file (thêm `cooldown-round120-t8-e1`).
- File cooldown chứa epoch-ms (vd `cooldown-t10-round119` =
  1794795333452); cũ nhất 2026-11-14T18:38Z (`cooldown-r4-round115`),
  mới nhất 2026-11-16T05:47:31Z. Script **không có luật prune
  file cooldown** (chỉ `prune_stale_tickets` dọn thư mục ticket;
  cooldown chỉ được ghi đè khi cùng thread release lại) nên số
  file tăng theo số thread khác nhau từng release — tích lũy từ
  14/11 tới nay. **Vô hại về chức năng:** `status` đếm cooldown
  riêng (không tính là ticket — đã vá đợt 115 R4), `acquire` chỉ
  đọc file cooldown của chính thread mình; file cũ hết hạn không
  chặn ai. Ghi nhận làm housekeeping, không phải bug (xem §8).
- Lệnh `queue` in **rỗng, rc=0** khi không có ticket (không in
  `(hàng đợi trống)` vì QUEUEDIR tồn tại nên nhánh đó không chạy;
  vòng lặp chỉ duyệt thư mục ticket, file cooldown bị bỏ qua).
  Cosmetic, không phải bug — ghi lại để khỏi ai thắc mắc.

## 4. Nhất quán log lock: 296 dòng, 84/84 cặp ACQUIRED→RELEASED, 0 còn giữ

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc ~05:49Z
(14/11 18:01:32Z → 16/11 05:48:07Z, đang tăng do T8-e1 chạy):

| Sự kiện | Tổng | Từ đầu đợt 119 (23:41Z 15/11) |
|---|---|---|
| TICKET | 97 | 27 |
| ACQUIRED | 88 | 26 |
| RELEASED | 84 | 25 |
| COOLDOWN | 13 | 8 |
| TIMEOUT | 8 | **0** |
| STALE-LOCK | 5 | 1 |
| STALE-TICKET | 1 | 1 |
| **Tổng dòng** | **296** | **88** |

- Ghép cặp theo thread: **84 cặp ACQUIRED→RELEASED, 0 lock còn
  giữ ở cuối log, 0 lần RELEASED không có ACQUIRED trước đó.**
  Chênh ACQUIRED − RELEASED = 4, đúng bằng 4 ca "double-acquire"
  dưới đây — không có lock nào mất dấu.
- 4 ca "double-acquire" (cùng thread ACQUIRED 2 lần không có
  RELEASED ở giữa) — **tất cả đều giải thích được bằng STALE-LOCK
  cướp sau reboot**, không phải double-hold:
  - `s3-round116` 21:40:51Z → cướp lại 21:49:20Z, đúng giây dòng
    STALE-LOCK cùng thread (owner pid 58855 chết + boot đổi).
  - `t3-round117` 09:44:50Z → cướp lại 10:06:45Z; lần cướp là
    STALE-LOCK 09:48:50Z do **t2** ghi (owner pid 245244 = pid
    owner của t3-round117).
  - `t4` 12:51:18Z → cướp lại 13:03:46Z; lần cướp là STALE-LOCK
    12:56:32Z do **t5** ghi (owner pid 76972 = pid owner của t4).
  - `t3-round119` 00:36:50Z → cướp lại 01:04:22Z, đúng sau dòng
    STALE-LOCK 01:04:21Z (owner pid 54295 chết + boot đổi,
    tuổi 1650s).
  Mẫu chung: holder chết vì reboot → luồng khác (hoặc chính
  thread đó) dọn stale theo luật boot đổi → giữ lại hợp lệ.
  Không có ca nào hai holder cùng giữ một lúc.
- STALE-LOCK + STALE-TICKET lúc 01:04:20–21Z đúng luật boot đổi:
  `queue STALE-TICKET ... boot đổi (27c8b1d9-... != hiện tại)` rồi
  `t3-round119 STALE-LOCK ... boot đổi (tuổi 1650s)` — dọn đúng
  ticket + lock của holder đã chết vì reboot #58, rồi ACQUIRED
  lại 01:04:22Z wait 3s, RELEASED 01:23:30Z hold 1148s.
- 8 TIMEOUT toàn bộ từ trước đợt 119 (lần cuối 12:02:19Z 15/11,
  t9 chờ 900s cổng 5581) — đợt 119+ có **0 TIMEOUT**.
- Ghi chú (không phải kết luận của T9): `driver119t3.log` ghi
  boot `27c8b1d9-...` lúc start 23:47:15Z nhưng boot `622b3a92-...`
  lúc done 01:23:36Z — tức boot đã đổi giữa chừng (khớp reboot
  #58), lock xử lý đúng như trên. Số thứ tự/timestamps các reboot
  #58/#59 thuộc T6 (mù #37); T9 chỉ xác nhận lock, không tự
  kết luận số hiệu reboot.

## 5. Double-release "KHÔNG NHẢ": đếm từ đầu đợt 119 — 4 lần trên lock thật, tất cả vô hại

Phương pháp: nhánh release thất bại chỉ `echo` ra stdout, KHÔNG
`log_event` (đúng thiết kế — T9 đợt 119 §2.2), nên số đếm dựa
vào **driver log**, không phải `vite-lock-v2.log`. T9 đếm có mục
tiêu trong `hidden_files/round119-*`: tổng 18 dòng khớp
"KHÔNG NHẢ", phân loại đầy đủ như sau (lệnh grep toàn cây
hidden_files quá chậm — >163 s chưa xong do cây quá lớn — nên T9
đã kill lệnh đó; số đếm dưới đây bao phủ toàn bộ `round119-*`,
không bao phủ mọi file log lẻ ngoài đó — xem §8):

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 5 | round119-t1/t2/t3/t8/t10 copy của `vcut-vite-lock-v2.sh` |
| Nhắc trong ghi chú/skeleton | 3 | t10 skeleton ×2, t4 prereg ×1 |
| Dòng comment trong script repro | 1 | round119-t9/repro-owner-q.sh |
| Tái hiện có kiểm soát trên /tmp | 5 | round119-t9 repro-owner-q.log ×3, repro-owner-q2.log ×2 |
| **Sự kiện trên lock THẬT** | **4** | `round119-t3/driver119t3.log` (xem dưới) |

4 sự kiện trên lock thật (đều của T3 đợt 119, `driver119t3.log`):

1. **2× guard từ chối đúng** (dòng 33, 35, ~23:47Z):
   `KHÔNG NHẢ — owner hiện tại là 't1', không phải 't3-round119'`
   — cleanup của T3 gọi release trong lúc **T1 đang giữ lock hợp
   lệ**; guard chặn đúng, lock của T1 không bị nhả nhầm.
2. **2× double-release '?'** (dòng 596, 598, 01:23:36–37Z):
   `KHÔNG NHẢ — owner hiện tại là '?', không phải 't3-round119'`
   — ngay sau khi s79r4 nhả thật 01:23:30Z (RELEASED hold 1148s),
   `cleanup_all` gọi release lại 2 lần, xen kẽ 2 dòng "co DIALING
   da xoa". Đúng mẫu đợt 118 (T9 đợt 119 §2.2) — release thừa
   vô hại, rc=1, không đổi trạng thái, lock vẫn trống đúng.
   Trong `vite-lock-v2.log`: **0 dòng RELEASED thừa** cho
   t3-round119 sau 01:23:30Z — bằng chứng log khớp.

**Tổng trên lock thật từ đầu đợt 119: 2 lần '?' + 2 lần
guard-refusal = 4, tất cả vô hại, không ca nào đổi trạng thái
lock hay nhả nhầm lock của người khác.** Không tính vào số này:
5 lần tái hiện /tmp của T9 đợt 119, 4 lần repro /tmp của T6 đợt
120 (before 3 + after 1, xem §6).

## 6. Kiểm chứng sau fix text của T6 (bản mới `cd0c05c1`): suite 9/9 + repro message mới đều xanh

T6 đợt 120 (quyết parent đóng đợt 119 §12 mục 8) sửa duy nhất
`cmd_release` trong `vcut-vite-lock-v2.sh` (dòng ~413–426):
owner rỗng → `BỎ QUA release thừa — lock đã trống (không còn
owner; '<thread>' đã nhả rồi hoặc chưa từng giữ). KHÔNG phải lỗi,
KHÔNG phải lock kẹt, không cần can thiệp`; owner thật khác →
`KHÔNG NHẢ — lock đang do '<owner>' giữ, không phải '<thread>'
(bảo vệ lock của người khác)`. Guard `owner_thread != thread` +
`return 1` + nhánh release thành công giữ nguyên; acquire/timeout/
stale-check/queue/cooldown không đụng dòng nào. md5 v2
`5cac10af` → `cd0c05c1` lúc 05:42:4xZ (v1 frozen `fd21193c`,
poll-quiet `1710e480`, suite `1c0d7eaa` không đổi).

- **Suite của T6 trên bản mới: 9/9 PASS** (05:43:18Z,
  `round120-t6/test-v2-run1.log`; T7 B1=3 → B2=2, diff 1).
- **Suite độc lập của T9 trên bản mới: 9/9 PASS, rc=0**
  (05:45:04Z, `round120-t9/test-v2-t9-run1.log`; 9 PASS, 0 FAIL;
  T7 B1=2 → B2=1, diff 1; T6 cooldown 3058 ms ≥ 2500 ms).
  Suite chạy trên lock dir /tmp riêng, không đụng lock thật.
- **Tái hiện message mới của T9 trên lock dir /tmp**
  (`round120-t9/repro-newmsg.log`, 05:45:21Z):
  - A. Double-release (acquire tA → release → release lần 2):
    lần 2 in đúng `BỎ QUA release thừa — lock đã trống...`,
    rc=1; status TRỐNG trước và sau; log repro chỉ có đúng
    1 dòng RELEASED cho tA.
  - B. Release khi lock trống từ đầu: cùng câu `BỎ QUA...`, rc=1.
  - C. Đối chứng — release sai thread trong lúc tH đang giữ:
    `KHÔNG NHẢ — lock đang do 'tH' giữ, không phải 'tX'...`,
    rc=1; status sau đó vẫn hiện owner tH (guard hoạt động),
    rồi release tH sạch.
  - Kết luận: **fix text không đổi hành vi; guard còn nguyên;
    thông báo mới phân biệt rõ 2 trường hợp** (trước đây chung
    một câu `'?'` gây hiểu lầm — T9 đợt 119 §2).
- Bằng chứng lock thật đang chạy tốt trên bản mới: **T8 đợt 120
  (thread `round120-t8-e1`) dùng lock thật ngay trong lúc T9
  kiểm tra** — 4 chu kỳ liên tiếp 05:46:32–05:47:31Z, mỗi chu kỳ
  TICKET → ACQUIRED (wait 0/10/10/10s) → RELEASED (hold 3–4s) →
  COOLDOWN (~9950–9963 ms), cổng 5582; log tăng 273 → 296 dòng
  trong lúc T9 làm việc. Lock TRỐNG giữa các chu kỳ. Đây là
  bằng chứng live (không phải chỉ suite /tmp) rằng lock v2 hoạt
  động đúng sau boot #60 trên bản mới.
- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot, 0 zombie,
  0 stale, queue 0 ticket, log nhất quán (84/84 cặp, 0 còn giữ),
  stale-cleanup đúng luật boot đổi, double-release toàn vô hại,
  suite 9/9 hai lần độc lập (T6 + T9) trên bản mới, và luồng
  khác đang dùng lock thật bình thường.

## 7. Kiểm chứng độc lập (tóm tắt)

- Quét zombie: bảng `ps` đầy đủ + histogram `comm` + `ss`
  (0 listener) — không dựa vào grep đếm.
- Nhất quán log: script Python ghép cặp toàn bộ 296 dòng
  (ACQUIRED/RELEASED theo thread) + đếm theo loại sự kiện;
  4 ca double-acquire đối chiếu từng dòng STALE-LOCK.
- Đếm "KHÔNG NHẢ": grep có mục tiêu toàn bộ `round119-*`
  (18 dòng, phân loại đủ 18/18) + đọc context dòng 33/35/596/598
  trong driver119t3.log.
- Fix text T6: đọc lại `cmd_release` dòng 413–426 + md5 trước/sau
  + suite độc lập 9/9 + tái hiện A/B/C trên /tmp (lock thật
  không bị acquire/release lần nào bởi T9).
- Lock thật không bị đụng bởi T9: mọi acquire/release thí nghiệm
  dùng `VITE_LOCK_DIR=/tmp/vcut-t9r120-lock`; lock thật chỉ được
  đọc qua `status` (không đổi trạng thái).

## 8. Hạn chế trung thực + nợ mở

- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): 2 lần xanh
  đợt này (T6 3→2, T9 2→1) không xóa tính flaky — đẳng thức
  trên số đếm toàn cục trong cửa sổ ~2 s. Quyết tách T7 khỏi
  gate 9/9 khi đợt đông vẫn thuộc về parent; T9 không tự đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** — T6 đã
  ghi nợ; đang đóng băng, cần parent quyết "mở băng" nếu muốn
  đồng bộ message.
- **File cooldown tích lũy (34→35, cũ nhất 14/11):** không có
  luật prune; vô hại nhưng nên dọn file cooldown cũ hơn X ngày
  trong một luồng housekeeping sau — T9 không tự sửa script
  (chờ parent).
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §3);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round119-*`, không quét toàn
  cây hidden_files** (lệnh grep toàn cây >163 s chưa xong, đã
  kill). Nếu có driver log đợt 119 nằm ngoài `round119-*` thì
  chưa được đếm — T9 cho là không có (mọi luồng đợt 119 đều có
  thư mục `round119-*`), nhưng ghi rõ giới hạn này.
- **wtmp/journal chỉ giữ boot #60:** T9 không xác minh độc lập
  số hiệu/thời điểm reboot #58/#59 — thuộc T6 (mù #37).
- **Log nội bộ của suite T9 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên file
  `vite-lock-v2.log` nội bộ không còn để copy; bằng chứng suite
  là stdout đầy đủ trong `test-v2-t9-run1.log` (9 PASS). Thư mục
  repro /tmp của T9 đã dọn sạch sau khi xong.
- T9 không sửa production; không chạy tsc/vite build (không sửa
  code nào nên không có gì để build lại; cây cuối đợt 119 đã
  được parent chạy lại tsc 0/0 + vite build PASS khi đóng đợt).

## 9. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND120_T9_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, `preview.tsx` (`5be5a250`),
`media.ts` (`2c384ed1`), v1 frozen (`fd21193c`), poll-quiet
(`1710e480`), suite (`1c0d7eaa`). Script v2 đổi bởi T6 đợt 120
(`5cac10af` → `cd0c05c1`, chỉ text thông báo); T9 không sửa thêm.
Stage: `repo-1-push/paths-loop/phase9-round120-t9-lockhealth.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round120-t9/` (test-v2-t9-run1.log,
repro-newmsg.log, env-after.log).
