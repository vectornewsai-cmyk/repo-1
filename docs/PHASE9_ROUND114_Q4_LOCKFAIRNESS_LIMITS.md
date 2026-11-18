# PHASE9 ROUND114 Q4 — Lock fairness protocol (vite lock v2) — LIMITS

- Đợt: 114, luồng Q4 (lock fairness). Ngày: 2026-11-14 (21:43–22:00 +07).
- File mới: `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `apps/web/scripts/vcut-poll-quiet-v2.sh`,
  `apps/web/scripts/test-vite-lock-v2.sh`, tài liệu này.
- KHÔNG sửa file frozen v1, KHÔNG sửa production, KHÔNG push/tag/binary.
  Không chạy tsc/vite build (không đụng file .ts/.tsx/.css nào — chỉ thêm
  script shell + docs; `bash -n` cả 2 script mới đều sạch).

## 1. Protocol cũ (v1, đóng băng đợt 111) — ghi lại chính xác

Nguồn đọc: `hidden_files/round113-p1/vcut-vite-lock-frozen.sh` (md5
`fd21193c`, copy của `apps/web/scripts/vcut-vite-lock.sh`),
`hidden_files/round113-p5/driver113p5.sh`,
`hidden_files/round113-p1/run-p1-locked.sh`, prereg P1 §lock + P5 §lock.

- **Acquire:** `mkdir $LOCKDIR` nguyên tử; thắng mkdir thì ghi owner NGAY
  (tmp+mv) với `thread/pid/port/started/boot`. `owner_pid` là pid driver
  (truyền vào, mặc định `$PPID`), không phải pid helper. Poll mặc định
  10 s (P1/P5 dùng `VITE_LOCK_POLL_S=5`).
- **Chờ:** vòng lặp thăm lock; mỗi 60 s in 1 dòng chờ. Timeout mặc định
  1800 s (P5 dùng 900 s/lượt); hết timeout → exit 1, không giữ gì.
- **Stale detection:** chỉ stale khi ĐỦ 3 điều kiện kiểm tra trực tiếp:
  (a) owner pid chết (`kill -0` fail), (b) không còn vite node trên cổng
  owner, (c) `curl` cổng owner = 000 — VÀ tuổi lock ≥ STALE_MIN (mặc định
  30 phút). Dir trống không owner: stale khi tuổi > 5 phút + không vite
  nào + mọi cổng đã biết đều 000. Khi stale: `rm -rf` lock rồi mkdir lại.
- **Release:** chỉ thread trùng owner mới được nhả (`rm owner` + `rmdir`).
  Không bao giờ `rm -rf` lock của luồng khác khi chưa qua stale-recovery.
- **Kill vite:** theo pid node thật (`.bin/vite`), không kill vỏ npx,
  không `pkill` pattern trần; sau kill kiểm `ps` + `curl` về 000.
- **Công bằng (§6, chỉ là khuyến nghị):** luồng vừa nhả mà định giữ lại
  ngay nên chờ ≥15 s — vì waiter thăm lock mỗi 5–10 s sẽ bỏ lỡ cửa
  nhả-giữ-lại ngắn hơn chu kỳ thăm (M7 đợt 111 làm M8 bỏ lỡ 2 cửa ~8 s).

## 2. Các lỗ hổng đã xác nhận (đợt 113 §10.5)

1. **Giữ lock trong lúc chờ tải:** P1 giữ lock cả chuỗi f1–f3 TRONG LÚC
   `dial_load` chờ tải nền (~35 phút) → P5 mất 2 cửa acquire 900 s
   (s76 DEFERRED ×2, điểm gãy tải vẫn mở). Driver P1 (`run-p1-locked.sh`)
   acquire một lần rồi chạy cả `run-p1.sh` (postboot + A/B 2+2) mới nhả.
   Ngược lại P5 (`driver113p5.sh`) đã làm đúng mẫu: acquire → 1 lượt →
   nhả ngay + `sleep 20` trước khi giữ lại — nhưng đó là kỷ luật tự giác,
   không có cơ chế bắt buộc.
2. **Không FIFO:** acquire là đua `mkdir` thuần — ai thăm đúng lúc lock
   trống thì thắng. P7 thắng race mkdir sau khi P3 được nhả tay; waiter
   chờ lâu không có quyền ưu tiên nào.
3. **Không priority:** lượt dài (s76, 70 clip, 210 s phát) và lượt ngắn
   (dry 3 clip) bình đẳng tuyệt đối — lượt dài có thể đói vô hạn khi các
   lượt ngắn cứ nối nhau tới trước.
4. **Không release-between-attempts:** không có API nào buộc nhả giữa các
   attempt; `acquire`/`release` rời rạc, driver tự quyết.
5. **Không logging tập trung:** log nằm rải rác trong log driver từng
   luồng; không có file nào ghi đủ holder/wait-time/queue-position để
   đối chiếu pattern đói lock sau này.

## 3. Thiết kế mới (v2) — `apps/web/scripts/vcut-vite-lock-v2.sh`

Giữ nguyên mọi semantics an toàn của v1 (mkdir nguyên tử + owner ngay,
stale đủ 3 điều kiện, release chỉ owner, kill vite theo pid node thật).
Thêm 5 cơ chế (chi tiết + mẫu driver trong header script):

- **(a) Hàng đợi FIFO bằng ticket:** waiter lấy ticket
  `<class>-<nanos>-<pid>-<thread>` trong `${LOCKDIR}.queue`
  (nanos 19 chữ số → sort từ điển = sort theo thời gian tới). Chỉ ticket
  đứng đầu mới được `mkdir` lock. Ticket chứa thread/pid/port/prio/
  created/boot. Ticket chết (pid chết hoặc boot đổi hoặc quá già 7200 s)
  được waiter khác dọn — không bao giờ dọn ticket của tiến trình sống.
- **(b) Priority lượt dài + aging:** ticket class 0 = `long`, class 1 =
  `normal`; class 0 luôn trước class 1. Chống đói ngược: ticket normal
  chờ quá `VITE_LOCK_AGING_S` (mặc định 1800 s) được nâng lên class 0.
- **(c) Release-between-attempts bắt buộc qua `run-attempt`:** acquire →
  chạy đúng 1 attempt → nhả trong trap (kể cả attempt fail hay bị
  SIGTERM/SIGINT). Attempt sau phải lấy ticket mới (xếp cuối hàng đợi
  nếu có waiter). `run-attempt` trả đúng exit code của lệnh; exit 3 =
  không lấy được lock. Dial-wait PHẢI ở ngoài wrapper (mẫu trong header
  script): dial trước, rồi `run-attempt` từng lượt probe.
- **(d) Stale-lock detection an toàn, thêm đường tắt boot đổi:** giữ
  nguyên luật đủ-3-điều-kiện + tuổi ≥ STALE_MIN của v1; thêm: nếu owner
  boot khác boot hiện tại VÀ đủ 3 điều kiện thì stale NGAY không cần chờ
  đủ tuổi (reboot đã giết holder cũ — pid có thể đã bị tái sử dụng nên
  vẫn yêu cầu đủ 3 điều kiện, không đoán theo boot một mình).
  Phòng ngừa cướp lock holder sống: (i) không bao giờ cướp khi pid còn
  sống; (ii) không bao giờ cướp khi còn vite node trên cổng owner;
  (iii) không bao giờ cướp khi cổng còn phục vụ (curl ≠ 000); (iv) cướp
  chỉ xảy ra trong `acquire` của waiter, sau khi in lý do + ghi log
  `STALE-LOCK`.
- **(e) Cooldown sau nhả (bắt buộc, thay khuyến nghị v1 §6):** sau
  `release`, cùng thread muốn giữ lại phải chờ đủ
  `VITE_LOCK_REACQUIRE_DELAY_S` (mặc định 15 s); cooldown ghi vào file
  trong QUEUEDIR, không chặn thread khác. FIFO ticket vốn đã ngăn holder
  cũ chen ngang waiter đã xếp hàng; cooldown ngăn holder cũ chiếm lại
  lock trước khi waiter chưa kịp lấy ticket (trường hợp P7/M8).
- **(f) Logging đầy đủ:** mọi sự kiện TICKET/ACQUIRED/RELEASED/TIMEOUT/
  STALE-LOCK/STALE-TICKET/COOLDOWN ghi vào `VITE_LOCK_LOG` (mặc định
  `hidden_files/vite-lock-v2.log`) kèm timestamp UTC, thread, wait time,
  vị trí hàng đợi, hold time. Lệnh `queue` liệt kê hàng đợi hiện tại.

## 4. Kết quả test thật — `apps/web/scripts/test-vite-lock-v2.sh`

Test độc lập, không cần vite thật, không đụng lock thật: mọi test dùng
`VITE_LOCK_DIR`/`VITE_LOCK_QUEUE_DIR`/`VITE_LOCK_LOG` tạm dưới `/tmp`,
cổng 599x (không có gì phục vụ). Chạy 2 lần, kết quả giống hệt:

| Case | Nội dung | Kết quả (lần 1 + lần 2) |
|---|---|---|
| syntax | `bash -n` cả 2 script mới | PASS |
| T1 FIFO | A giữ trước, B chỉ giữ sau khi A nhả (dòng log 2 < 4 < 5) | PASS |
| T2 priority | lượt `long` tới SAU vẫn giữ trước lượt `normal` tới trước (dòng 6 < 8) | PASS |
| T3 stale-lock | holder chết giả lập (pid 999999, cổng 000, tuổi 2400 s) bị dọn + giữ lại sau 171 ms, log có STALE-LOCK | PASS |
| T4 stale-ticket | ticket của pid chết bị dọn, acquire thành công | PASS |
| T5 release-between-attempts | waiter giữ lock giữa 2 attempt của holder (dòng 2 < 6 < 8) | PASS |
| T6 cooldown | giữ lại ngay sau nhả bị chờ 3085 ms (delay=3 s, ngưỡng ≥2500 ms) | PASS |
| T7 poll đã vá | WebProcess giả: blockers 7 → 6 sau khi kill (delta đúng +1, không tự đếm) — 6 còn lại là vite/probe thật của các luồng Q khác đang chạy song song | PASS |
| T8 run-attempt | `false`→exit 1, `true`→exit 0, lock trống sau cả 2 attempt | PASS |

**Tổng: 9/9 PASS, 2/2 lần chạy.** Lệnh chạy lại:
`bash apps/web/scripts/test-vite-lock-v2.sh` (~21 s).

## 5. Nợ nhỏ kèm theo (§10.12c) — poll đã vá

`apps/web/scripts/vcut-poll-quiet-v2.sh`: bản poll cửa yên theo mẫu
M5/L7 đã vá — pattern `[W]ebProcess` (regex khớp "WebProcess" nhưng dòng
lệnh của chính grep chứa "[W]ebProcess" có ngoặc nên không tự khớp),
cộng `grep -v grep` + `grep -v` tên script làm lớp phòng ngừa thứ hai.
Thay cho `poll-p4.sh` (pattern trần `WebProcess`, chỉ được
`grep -v "grep -E"` bảo vệ). Test T7 chứng minh: bắt được +1 blocker
giả `WebProcess-q4test`, và không tự đếm (delta đúng 1 dù có 6 blocker
thật của luồng khác đang chạy). Luồng sau copy mẫu này, đừng copy
`poll-p4.sh`.

## 6. Hạn chế trung thực — CHƯA dùng trong đo thật

- **Helper v2 CHƯA được luồng đo nào dùng trong đợt 114** (chỉ test
  standalone trên /tmp, cổng giả, không vite thật). Mọi claim FIFO/
  priority/stale ở trên là kết quả test shell, chưa phải bằng chứng
  trên lượt đo thật có vite + tải nền.
- **Migration là việc đợt 115** (parent quyết): các luồng đợt 114 vẫn
  dùng bản frozen v1; không tự ý đổi protocol giữa đợt. Cần trước khi
  migrate: (i) 1 driver thí điểm (đề xuất: lượt ngắn, timeout acquire
  ngắn) chạy v2 end-to-end với vite thật; (ii) đối chiếu log
  `vite-lock-v2.log` với log driver để xác nhận wait/hold time khớp;
  (iii) quyết giá trị `VITE_LOCK_AGING_S` (mặc định 1800 s — chưa đo
  thực tế lượt dài chờ bao lâu thì nên được nâng hạng).
- **Rủi ro còn lại:**
  - Race `mkdir` vẫn là mutex cuối cùng: nếu 2 waiter cùng là "front"
    do ticket đầu vừa bị dọn giữa 2 lần check, chỉ 1 thắng `mkdir`,
    người thua quay lại vòng chờ — an toàn nhưng tốn 1 vòng poll.
  - Stale detection sai có thể cướp lock của holder sống NẾU cả 3 điều
    kiện cùng sai cùng lúc (pid chết giả do pid tái sử dụng + vite node
    không tìm thấy do pattern `pgrep` lệch + curl 000 do vite đang
    restart). Cơ chế phòng ngừa: tuổi tối thiểu STALE_MIN (30 phút) cho
    trường hợp cùng boot; chỉ đường tắt boot-đổi mới bỏ tuổi tối thiểu,
    và vẫn yêu cầu đủ 3 điều kiện. Không có trường hợp nào chỉ dựa vào
    tuổi một mình.
  - Ticket timestamp dùng `date +%s%N`: nếu 2 waiter cùng nanos + cùng
    pid (không thể — pid khác nhau) thì `take_ticket` thử lại 1 lần sau
    10 ms; nếu vẫn trùng thì acquire fail (trả 1) thay vì treo.
  - Cooldown file `cooldown-<thread>` không tự dọn: file cũ hơn 1 lần
    giữ lại là vô hại (remain ≤ 0 → bỏ qua), nhưng tích tụ theo thời
    gian trong QUEUEDIR — đợt sau nên dọn file cooldown quá 1 ngày.
  - Log `vite-lock-v2.log` append không khóa: 2 tiến trình ghi cùng lúc
    có thể xen dòng (mỗi dòng < PIPE_BUF nên thực tế là nguyên tử trên
    Linux, nhưng không đảm bảo tuyệt đối).
  - `run-attempt` giữ `owner_pid = $$` của helper: nếu helper bị
    `kill -9` (không trap được), lock thành stale sau STALE_MIN rồi mới
    được dọn — giống hệt v1, không tệ hơn.

## 7. Kế hoạch migration đợt 115 (đề xuất cho parent)

1. 1 driver thí điểm dùng v2 cho lượt ngắn (timeout acquire 900 s,
   prio `normal`), các luồng khác vẫn v1 — v1 và v2 dùng CHUNG lockdir
   mặc định nên tương tác được, NHƯNG: waiter v1 không lấy ticket nên
   không tham gia hàng đợi FIFO (v1 vẫn đua mkdir); fairness đầy đủ chỉ
   đạt khi TẤT CẢ luồng cùng dùng v2 trong cùng đợt.
2. Lượt dài (70 clip như s76) dùng `run-attempt ... long` + dial-wait
   NGOÀI lock; kiểm chứng P5 không còn DEFERRED do đói lock.
3. Sau 1 đợt chạy chung v2, đối chiếu `vite-lock-v2.log`: wait time
   tối đa, có waiter nào chờ > timeout không, có STALE-LOCK nào cướp
   nhầm không; rồi mới coi v2 là protocol chuẩn thay v1.
4. Khi đó mới đổi `VCUT_VITE_LOCK_FREEZE_SPEC` + các driver sang v2;
   giữ bản frozen v1 tới khi migration xong (không xóa).
