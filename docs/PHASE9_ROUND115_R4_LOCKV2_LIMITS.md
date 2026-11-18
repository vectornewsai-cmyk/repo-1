# PHASE9 ROUND115 R4 — Migration lock fairness v2 (thí điểm) — LIMITS

- Đợt: 115, luồng R4 (lock fairness v2). Ngày: 14/11/2026, 17:43–18:40Z
  (00:43–01:40 +07 ngày 15/11). Boot #47 (`5578af38…`, số thứ tự tạm thời).
- Nhiệm vụ (parent quyết đợt 114, QUYẾT 3 ngày 15/11): migration thí điểm
  helper v2 — chạy 1 driver ngắn thật bằng v2, đối chiếu
  `vite-lock-v2.log`, quyết `VITE_LOCK_AGING_S`, dọn cooldown cũ.
- File đổi: `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `apps/web/scripts/vcut-poll-quiet-v2.sh`, tài liệu này.
- KHÔNG push/tag/binary. KHÔNG sửa production. KHÔNG sửa/xóa v1 frozen
  (md5 `fd21193c` — kiểm lại cuối đợt, nguyên vẹn).

## 0. Reboot #47 xen giữa đợt

Giữa lúc chạy lại test lần đầu (17:44Z) và vòng test 5 lần tiếp theo, máy
reboot (boot `7a0638c4` #46 → `5578af38` #47, uptime về 1 phút lúc
17:47Z). Service exec restart theo, 1 vòng test 5 lần bị cắt giữa chừng
(không rõ đã chạy được mấy lần — bỏ, đo lại từ đầu sau reboot). Mọi số
dưới đây đều đo SAU reboot, trên boot #47, trừ khi ghi rõ.

## 1. Chạy lại test v2 trên cây hiện tại — PHÁT HIỆN T6 FLAKY

Lệnh: `bash apps/web/scripts/test-vite-lock-v2.sh` (~20 s/lần).

| Lần chạy | Kết quả |
|---|---|
| Lần đầu (boot #46, trước reboot) | 8/9 — **T6 FAIL: elapsed 2080 ms (< 2500 ms)** |
| 5 lần sau reboot (chưa vá) | 1× 8/9 (T6 FAIL 2129 ms) + 4× 9/9 |

**T6 flaky 2/6 lần.** Nguyên nhân (đã xác minh bằng đọc code, không đoán):
cooldown ghi `date +%s` (giây nguyên) lúc release; lúc giữ lại,
`remain = delay − (now_s − cd_epoch)` — cả hai mốc đều làm tròn xuống
giây nguyên. Nếu release và acquire lệch nhau qua biên giây, remain hụt
đúng 1 s: delay 3 s chỉ chờ ~2,08 s → dưới ngưỡng test 2500 ms. Khi cùng
giây thì chờ đủ 3 s (3085 ms, như đợt 114 đo được 2/2 lần). Cơ chế vẫn
luôn chờ > 0 (không bao giờ bỏ qua cooldown), chỉ thiếu tối đa ~1 s so
với delay yêu cầu. Với delay production 15 s, hụt tối đa ~1 s vẫn ≥ chu
kỳ thăm lock 5–10 s nên mục đích v1 §6 không bị phá — nhưng test flaky
là thật và cần vá, không được nới ngưỡng test để che.

## 2. Vá A — cooldown epoch mili-giây (vcut-vite-lock-v2.sh)

- `cmd_release`: ghi `date +%s%3N` (13 chữ số) vào
  `QUEUEDIR/cooldown-<thread>`.
- `cmd_acquire`: đọc ms, tính `remain_ms`, `sleep` dạng
  `giây.mili-giây`; file cũ dạng giây (10 chữ số, vd file đợt 114 nếu
  còn) được chuẩn hoá ×1000; file hỏng (không phải số) coi như 0.
- Verify: test 5 lần sau vá → **T6 5/5 PASS, 3048–3110 ms**; sau tất cả
  các vá khác (§5) chạy thêm 7 lần → T6 3300–3530 ms, 7/7 PASS.
  Tổng sau vá: T6 **12/12 PASS**.
- Kiểm chứng điều kiện thật (§4, attempt 3b): sau khi 3a nhả lock,
  acquire ngay phải chờ `14967 ms` (≈ đủ 15 s, chỉ thiếu 33 ms là thời
  gian giữa nhả và acquire) — đúng thiết kế.

## 3. Vá B — poll log vỡ dòng khi có luồng khác giữ lock (vcut-poll-quiet-v2.sh)

- Triệu chứng: T7 fail 3/5 lần trong 1 vòng test (B1/B2 rỗng), rồi 5/5
  lần trong vòng debug tiếp theo — trong khi chạy lẻ T7 10/10 PASS.
- Nguyên nhân (soi log thật trong TDIR được giữ lại): dòng log
  `poll 1 ... lock=co:thread=r2\npid=30205\nport=5590\n...` — `lock=` lấy
  từ file owner nhiều dòng, `head -c 60` giữ nguyên ký tự xuống dòng
  nên `blockers=N` rơi xuống dòng riêng bắt đầu bằng `b blockers=N`;
  test grep `^poll 1` chỉ lấy dòng đầu (không có `blockers=`) → B1/B2
  rỗng. T7 chỉ fail khi có luồng khác đang giữ lock (lúc đó `lock=`
  mới nhiều dòng); lúc lock trống (`lock=khong`) thì 1 dòng, test xanh
  — đúng pattern các lần fail trùng với r9/r2 giữ lock.
- Vá: `tr '\n' ' '` trước `head -c 60` trong `vcut-poll-quiet-v2.sh`
  (cả dòng `poll N` lẫn dòng `KHONG YEN` đều 1 dòng trở lại).
- Verify: test 5 lần sau vá → **T7 5/5 PASS** (6→5, delta đúng 1, có
  5 blocker thật của luồng khác đang chạy song song).
- Lưu ý: T7 nhạy với nhiễu môi trường — xem §5 cuối: 1 lần fail do
  luồng khác khởi động process giữa 2 lần poll (B1=B2=4). Đó là giới
  hạn của test (giả định máy yên trong ~2 s), không phải lỗi poll.

## 4. Pilot thí điểm — driver v2 chạy thật (18:01–18:30Z)

Driver: `hidden_files/round115-r4/driver115r4.sh` (log
`driver115r4.log`), 2 attempt qua `run-attempt`, prio `normal`,
timeout acquire 900 s, port 5560 (ngoài dải pickFreePort 5590–5599
của r2/r3 để khỏi đụng). Các luồng khác vẫn v1. Đối chiếu
`hidden_files/vite-lock-v2.log` (dòng r4-round115) khớp từng mốc với
log driver.

### 4.1 Timeline giữ lock (chuỗi holder v1)

| Holder | Giữ từ | Tới | Giữ bao lâu |
|---|---|---|---|
| r2 (v1) | 17:54:50Z | ~18:03:5xZ | ~9 phút |
| r3 (v1) | 18:03:54Z | 18:18:21Z | ~14,5 phút |
| r2 lần 2 (v1) | 18:18:21Z | ~18:24:41Z | ~6,3 phút |
| r4 (v2, attempt 2) | 18:24:41Z | 18:25:08Z | 27 s |
| r1 (v1) | 18:37:03Z | (sau 18:38) | — |

### 4.2 Attempt 1 — vite dev: TIMEOUT (DEFERRED, kiểu P5 đợt 113)

- Ticket lấy 18:01:32Z, vị trí hàng đợi 1, prio normal.
- **2 lần nhả lock liên tiếp đều thua race mkdir trước waiter v1:**
  r2 nhả (~18:03:5x) → r3 (v1, không ticket) giữ; r3 nhả (18:18:21)
  → r2 lần 2 (v1) giữ. Waiter v2 có ticket từ 18:01:32Z vẫn phải chờ.
- **TIMEOUT lúc ~18:21:36Z, exit 3, attempt không chạy.** Log ghi
  `waited=900s` nhưng thời gian tường thực tế là **1204 s**
  (18:01:32Z → 18:21:36Z) — xem §5 vá C.
- Đây là bằng chứng sống cho giới hạn tương tác v1/v2 mà Q4 §7 đã dự
  báo: hàng đợi FIFO chỉ sắp xếp waiter v2 với nhau; waiter v1 không
  lấy ticket nên không tham gia hàng đợi, vẫn đua `mkdir` trần và có
  thể chen ngang waiter v2 đã xếp hàng từ trước. Trong chế độ hỗn hợp,
  waiter v2 không được bảo vệ — thậm chí bất lợi hơn v1 vì mỗi vòng
  thăm của nó tốn thêm chi phí ticket (front_ticket + prune + sort).

### 4.3 Attempt 2 — `npm run build`: ACQUIRED, PASS

- Ticket mới 18:21:36Z → **ACQUIRED 18:24:41Z, wait_s=185** (tường
  đúng 185 s — lúc này tải đã hạ, giãn không đáng kể).
- `npm run build` (tsc + vite build) chạy trọn dưới lock: **tsc 0 lỗi,
  vite build ✓ 290 modules, built in 6.69 s** (dist/index.html 1,13 kB;
  chunk js 1688,58 kB, cảnh báo >500 kB như thường lệ — không phải lỗi).
- **RELEASED 18:25:08Z, hold_s=27.** Lock trống sau attempt. Exit 0,
  tổng run-attempt 211558 ms.
- Cooldown KHÔNG áp dụng cho attempt 2 (đúng: attempt 1 timeout nên
  chưa từng giữ lock → không có file cooldown; kỳ vọng "phải chờ
  cooldown" trong comment driver là sai cho đường timeout, cơ chế thì
  đúng — ghi lại để khỏi nhầm).

### 4.4 Attempt 3a/3b (driver bổ sung driver115r4b.sh) + 3c

- **3a vite dev: FAIL (exit 3) — lỗi driver, không phải lỗi lock.**
  Vite in `ready in 214 ms` nhưng curl 127.0.0.1/localhost/[::1] đều
  000 trong 30 s. Nguyên nhân khả dĩ nhất: thiếu `--host 127.0.0.1`
  (vite mặc định bind `localhost` → ::1 trên máy này; r2 dùng
  `--host 127.0.0.1` thì curl được). Dị thường chưa lý giải trọn vẹn:
  curl `[::1]` cũng 000 trong lúc vite còn sống — ghi nhận, không kết
  luận vượt bằng chứng. Lỗi phụ của driver 3a: nhánh UP=0 không kill
  vite → vite mồ côi tới khi `timeout 90` hết hạn (đã dọn tay sau đó
  bằng kill-vite, kiểm ps + curl sạch).
- **3b probe cooldown: PASS (exit 0).** Giữ lại ngay sau 3a nhả →
  `COOLDOWN wait 14967ms`, ACQUIRED wait_s=15, giữ 0 s, nhả sạch.
- **3c vite dev bản sửa (r4-attempt1b.sh, thêm `--host 127.0.0.1`,
  curl cả 2 địa chỉ, ss kiểm listener, kill trên mọi đường thoát):
  PASS.** Acquired chờ 1 s; vite lên sau **2 s**, curl 127.0.0.1=200
  và localhost=200, giữ thêm 5 s curl vẫn 200; ss listener
  `127.0.0.1:5560` (pid node thật); **inotify fds của vite node = 0**
  (config watch.ignored `**/**` có tác dụng); hold 10 s, nhả sạch,
  không còn vite, curl 000.
- Sự cố trong 3c (lỗi driver, đã khắc phục): `cleanup` chứa
  `pkill -f "vite.*$PORT"` đã giết cả shell exec gọi nó lẫn helper
  run-attempt (cmdline của chúng chứa chuỗi `vite.*5560`) → exec bị
  SIGTERM giữa chừng. May mắn: lock vẫn được nhả đúng 1 lần
  (RELEASED 18:30:01Z hold_s=10 trong vite-lock-v2.log), không còn
  vite, không còn helper mồ côi — đã kiểm ps + curl sau đó. Đã xóa
  dòng `pkill` khỏi script (chỉ dùng helper kill-vite + kill pid
  timeout). Đây đúng là mẫu lỗi mà helper v2 cấm ("KHÔNG pkill
  pattern trần") — bài học ghi lại cho luồng sau.

### 4.5 Đối chiếu vite-lock-v2.log (dòng r4-round115)

```
18:01:32Z TICKET   ticket=1-1794679292895097618-56286-r4-round115 port=5560 prio=normal
18:21:36Z TIMEOUT  waited=900s port=5560 prio=normal ticket=1-1794679292895097618-…
18:21:36Z TICKET   ticket=1-1794680496776455465-98106-r4-round115 port=5560 prio=normal
18:24:41Z ACQUIRED port=5560 wait_s=185 ticket=1-1794680496776455465-…
18:25:08Z RELEASED hold_s=27
18:27:49Z RELEASED hold_s=31            (3a — vite dev, lock nhả sau khi attempt fail)
18:27:49Z COOLDOWN wait 14967ms port=5560
18:28:04Z TICKET / ACQUIRED wait_s=15 / RELEASED hold_s=0   (3b)
18:29:50Z TICKET / 18:29:51Z ACQUIRED wait_s=1 / 18:30:01Z RELEASED hold_s=10  (3c)
```

- Wait time tối đa: **1204 s tường** (attempt 1, kết thúc TIMEOUT).
- DEFERRED: **1** (attempt 1, timeout 900 s danh nghĩa).
- STALE-LOCK: **0** — không có lần cướp lock nào, đúng (không holder
  nào chết trong lúc pilot; r3/r2 đều còn sống khi nhả).
- Không waiter nào khác bị đói do pilot: các hold của pilot ngắn
  (27 s + 31 s + 0 s + 10 s); r1 lấy lock ngay sau đó (18:37:03Z).

## 5. Vá C+D+E (sau pilot, trước khi stage) + verify lại

Ba lỗi tìm được nhờ pilot, vá trong `vcut-vite-lock-v2.sh`
(KHÔNG sửa khi pilot đang chạy — helper đang thực thi file đó):

- **(C) Timeout tính từ wall-clock, không cộng dồn poll-sleep.**
  Bản cũ (`sleep $poll; waited+=poll`, kế thừa từ v1): dưới tải cao
  mỗi vòng lặp tốn thêm ~0,8–1,1 s chạy `front_ticket` /
  `lock_is_stale` mà không được đếm → timeout 900 s thực tế chờ
  1204 s (**giãn 1,34×**; attempt 2 lúc tải hạ chỉ giãn ~1,0×).
  Vá: `waited = now − t0` đầu mỗi vòng lặp; in trạng thái theo mốc
  60 s tường (`last_print`) thay vì `waited % 60` (wall-clock có thể
  nhảy qua bội số 60); bỏ dòng cộng cooldown vào `waited` (t0 đặt
  trước khối cooldown nên đã bao gồm). Lỗi này CÓ trong v1 frozen
  (dòng tương tự) — v1 đóng băng nên không sửa; v2 sửa tại đây.
  Chưa đo lại giãn dưới tải cao sau vá (tải đã hạ lúc vá xong) —
  ghi rõ, xem §9.
- **(D) `status` đếm chỉ thư mục ticket.** Bản cũ đếm mọi entry
  QUEUEDIR nên file cooldown cũng bị tính là ticket: sau pilot status
  báo `(1 ticket)` trong khi `queue` trống — thực ra chỉ có 1 file
  cooldown. Nay in `(0 ticket + 1 cooldown)`.
- **(E) `vite_node_pid`/`vite_any_running` chỉ nhận tiến trình có
  exe là node.** Trước đây chỉ khớp cmdline chứa "node" +
  ".bin/vite" nên nhầm cả vỏ `timeout` (3c: trả pid timeout 105058
  thay vì pid node 105061) và shell driver (r9: status từng báo
  "vite node: 1771" trong khi 1771 là bash driver) — kill-vite có
  thể TERM nhầm driver. Vá: kiểm `readlink /proc/PID/exe` chứa
  `node`; exe không đọc được thì bỏ qua pid đó (an toàn hơn là đoán).
- Verify sau vá: `bash -n` cả 2 script sạch; test 5 lần →
  **4× 9/9 + 1× 8/9** (lần 5: T7 B1=4 B2=4 — xem dưới), chạy lại
  2 lần → **9/9, 9/9**. T6 ổn định 3300–3530 ms (7/7 lần sau vá).
  T7 fail 1 lần do nhiễu môi trường: giữa 2 lần poll của test, luồng
  khác (r8 webkit blob probe: MiniBrowser + WebKitWebProcess) khởi
  động thêm process → B2 không giảm dù process giả đã kill. Poll đếm
  đúng; test giả định máy yên trong ~2 s nên nhạy với luồng khác —
  giới hạn của test, không phải hồi quy (chạy lại ngay sau đó:
  2→1 và 14→13, đều PASS).
- Verify live vá (E): run-attempt vite + `vite-node-pid` →
  **PASS**: helper trả 124246 = pid node thật theo ss (không phải
  vỏ timeout 124244; exe `/usr/bin/node` vs `/usr/bin/timeout`);
  kill-vite TERM đúng pid node → OK, ps sạch, curl 000, exit 0.
  (Chờ lock sau r1 chỉ 2 s.)

Tổng kết test sau TẤT CẢ các vá: **12 lần chạy, 11× 9/9, 1× 8/9
(T7 nhiễu môi trường, đã giải thích).**

## 6. Quyết VITE_LOCK_AGING_S — đề xuất 600 s (chưa đổi mặc định)

Mặc định hiện tại 1800 s. Đề xuất đổi thành **600 s**, lý do bằng số:

1. **1800 s không bao giờ có tác dụng với waiter chuẩn.** Timeout
   acquire thực tế của các luồng đo là 900 s (P5 đợt 113, R2 đợt
   115, pilot đợt này). Waiter timeout ở 900 s trước khi kịp được
   nâng hạng ở 1800 s → aging 1800 là luật chết. Muốn aging có tác
   dụng thì phải < 900 s.
2. **600 s ≈ một lượt giữ dài.** Hold dài đo được đợt này: r3 14,5
   phút (tối đa), r2 ~9 phút và ~6,3 phút; lượt dài s76/s77 ~5–10
   phút/attempt. Waiter normal được nâng hạng sau 600 s sẽ vượt các
   ticket `long` mới tới, và chỉ phải chờ thêm tối đa ~1 lượt giữ
   dài nữa trước khi tới lượt.
3. **Còn 300 s đệm trước timeout.** Với timeout 900 s, waiter được
   nâng ở 600 s vẫn còn 300 s ở hạng cao trước khi bỏ — đủ cho 1
   lượt giữ kết thúc.
4. **Điều kiện áp dụng:** aging CHỈ có ý nghĩa khi TẤT CẢ luồng
   cùng dùng v2 (xem §7). Trong chế độ hỗn hợp, waiter v1 không
   lấy ticket nên aging không bảo vệ được waiter v2 khỏi v1 (pilot
   §4.2 là bằng chứng).
- **Chưa đổi mặc định trong script** (vẫn 1800) — đây là quyết định
  chính sách, chờ parent duyệt cùng quyết migration §7. Đợt sau có
  thể override bằng env `VITE_LOCK_AGING_S=600` khi chạy v2-only.

## 7. Quyết migration — CHƯA mở rộng v2 cho tất cả luồng đợt 116

- **v2 hoạt động đúng trong điều kiện thật** (khi nó giữ được lock):
  acquire/release/ticket/cooldown/kill-vite/stale-check đều khớp log;
  build thật PASS; vite dev thật PASS; cooldown ms PASS; pid-fix PASS.
- **NHƯNG pilot chứng minh chế độ hỗn hợp làm waiter v2 thiệt thòi:**
  ticket không bảo vệ trước waiter v1 (2/2 lần nhả lock đều thua race
  mkdir; 1204 s chờ → TIMEOUT). Mở rộng dần (một vài luồng v2, còn
  lại v1) sẽ khiến chính các luồng v2 đói lock — tệ hơn là giữ nguyên
  v1 cho tất cả.
- **Đề xuất:** migration phải **nguyên tử theo đợt**: một đợt được
  parent chỉ định là "v2-only" (mọi driver trong đợt dùng v2, cấm v1
  cho đợt đó), bắt đầu từ đợt 116 nếu parent duyệt; các luồng đợt 115
  còn chạy vẫn giữ v1 (không đổi protocol giữa đợt). Trước đợt v2-only:
  áp dụng `VITE_LOCK_AGING_S=600` (§6) + các vá A–E đã xong ở đây.
  Giữ bản frozen v1 tới khi đợt v2-only đầu tiên chạy xong và đối chiếu
  log (wait tối đa, DEFERRED, STALE-LOCK) — chỉ khi đó mới coi v2 là
  protocol chuẩn và đổi `VCUT_VITE_LOCK_FREEZE_SPEC`.
- Không đổi production code. Không đề xuất đổi gì thêm cho v1.

## 8. Dọn cooldown (nợ nhỏ Q4 §6) — đã kiểm, không có gì để xóa

- QUEUEDIR thật (`hidden_files/vite.lock.queue/`) trước pilot:
  **không tồn tại** (v2 chưa từng chạy trên lock thật; test đợt 114
  chỉ dùng /tmp) → không có file cooldown cũ nào.
- Sau pilot: chỉ có **1 file `cooldown-r4-round115`** (epoch ms
  `1794680708303`, ghi 18:25:08Z; sau 3b/3c ghi lại 18:38:25Z) —
  tuổi < 1 giờ, **không quá 1 ngày → giữ lại** (file này còn có tác
  dụng nếu cùng thread giữ lại trong 15 s sau nhả).
- Kết quả: **0 file đã xóa, 0 file quá hạn tồn đọng.** Nợ Q4 §6 đóng.

## 9. Hạn chế trung thực + nợ chuyển tiếp

- **Pilot không chạy được vite dev ở attempt 1** (timeout trước khi
  giữ lock) — bằng chứng vite dev dưới v2 đến từ attempt 3c (sau khi
  sửa driver), không phải attempt 1 như prereg. Ghi rõ, không gộp.
- **Vá (C) chưa đo lại giãn timeout dưới tải cao** (tải hạ trước khi
  vá xong; attempt 2 lúc tải hạ giãn ~1,0×). Tính đúng của wall-clock
  là hiển nhiên theo code + test 9/9, nhưng con số giãn sau vá dưới
  tải load1 > 15 chưa có — đợt v2-only nên đo lại 1 lần (waiter
  timeout 300 s dưới tải hog, so tường/danh nghĩa).
- **Nguyên nhân 3a (curl 000 dù vite ready) chưa lý giải trọn vẹn:**
  thiếu `--host` là nguyên nhân khả dĩ nhất và bản sửa đã PASS, nhưng
  curl `[::1]` cũng 000 trong lúc vite còn sống vẫn chưa giải thích
  được — có thể liên quan proxy env (`http_proxy` + `no_proxy`) hoặc
  vite chưa listen xong. Luồng sau gặp lại thì chẩn đoán bằng
  `curl -v` + `ss` ngay lúc vite sống (mẫu đã có trong
  r4-attempt1b.sh). **Bổ sung sau khi đọc log R9:** R9 độc lập đo được
  vite tạm (không `--host`) chỉ bind `[::1]` và curl qua `localhost`
  = 200 — khớp chẩn đoán thiếu `--host`; riêng curl `[::1]` dạng
  bracket có thể đã đi qua egress proxy (`no_proxy` chứa `[::1]`
  nhưng curl khớp literal IPv6 kém) nên 000 — đó là artifact đo,
  không phải vite hỏng.
- **T7 nhạy nhiễu môi trường** (1/12 lần sau vá fail do luồng khác
  khởi động process giữa 2 poll). Nếu cần test ổn định hơn: khóa
  delta theo process giả cụ thể (đếm pid giả còn sống hay không)
  thay vì delta tổng số blocker — đề xuất, chưa làm.
- **`vite_node_pid` khi exe không đọc được sẽ bỏ qua pid** (fail-safe
  theo hướng không giết nhầm; nhưng kill-vite có thể báo "đã sạch"
  trong khi vite thật còn sống nếu chạy dưới user khác/hidepid —
  chưa gặp trên VM này, ghi nhận).
- Reboot #47 (17:44–17:46Z) xen giữa đợt — mù/reboot bookkeeping
  thuộc luồng khác (r6/r10), không đụng ở đây.
- `status` trước vá (D) từng báo sai số ticket — các log `status`
  cũ có số ticket cần đọc lại với lưu ý này (chỉ ảnh hưởng hiển thị,
  không ảnh hưởng lock).
- TTS 39, birefnet, ci-security.yml 403, G1, mù #22/#28/#31/#33:
  không thuộc luồng này, không đổi.

## 10. File đổi + stage

| File | Đổi gì |
|---|---|
| `apps/web/scripts/vcut-vite-lock-v2.sh` | Vá A (cooldown ms) + C (waited wall-clock) + D (đếm ticket) + E (exe check) + ghi chú header |
| `apps/web/scripts/vcut-poll-quiet-v2.sh` | Vá B (lock= 1 dòng) + ghi chú header |
| `docs/PHASE9_ROUND115_R4_LOCKV2_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock.sh` (frozen, md5
`fd21193c`), `apps/web/scripts/test-vite-lock-v2.sh` (test đã bắt
đúng 2 bug — không cần sửa), production code, `preview.tsx`.
Stage: `repo-1-push/paths-loop/phase9-round115-r4-lockv2.txt`
(NUL-delimited, 3 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round115-r4/` (driver115r4.log,
driver115r4b.log, driver115r4c.log, r4-vite-dev.log,
r4-vite-dev-b.log, r4-vite-pidfix.log, verify-pidfix.log,
driver115r4.sh, driver115r4b.sh, r4-attempt1.sh, r4-attempt1b.sh,
verify-pidfix.sh, r4-vite-tmp.config.mjs) + `vite-lock-v2.log`.
