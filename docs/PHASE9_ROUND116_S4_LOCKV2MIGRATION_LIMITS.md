# PHASE9 ROUND116 S4 — Migration lock fairness v2 nguyên tử — LIMITS

- Đợt: 116, luồng S4 (chủ luồng migration lock v2). Ngày: 15/11/2026,
  04:02–04:15 +07 (21:02–21:11Z 14/11). Boot #48 (`0c2a9f2f…`, uptime
  1:19 lúc bắt đầu). Cây `preview.tsx` md5 `03bf029f` trước = sau.
- Nhiệm vụ (quyết parent 15/11, tiếp nối R4 pilot đợt 115): migration
  nguyên tử v2-only cho đợt 116 — đổi mặc định `VITE_LOCK_AGING_S`
  thành 600, hướng dẫn dùng v2, đo waiter sống dưới tải đợt 116, kiểm
  stale detection trên lock R3 sau reboot #48, kết luận v2 đã sẵn sàng
  làm mặc định cho đợt 117+ chưa.
- KHÔNG push/tag/binary. KHÔNG sửa production. KHÔNG sửa/xóa v1 frozen
  (md5 `fd21193c` — kiểm lại cuối đợt, nguyên vẹn).

## 0. Ghi chú chốt chặn round-in-progress.md

File `round-in-progress.md` TỒN TẠI lúc S4 bắt đầu — nhưng nội dung của
nó là "round 115 parent verify (R10 tiếp nối)", tức main chat đang kiểm
chứng độc lập đợt 115, KHÔNG phải một đợt build main-chat đang chạy.
Nhiệm vụ S4 do parent giao trực tiếp trong đợt 116 đã mở (lượt cron
03:35 +07 15/11, 10 luồng S1–S10). S4 tiếp tục làm theo lệnh parent và
ghi rõ điểm này ở đây để khỏi nhầm với luật chốt chặn của lượt cron
(lượt cron thấy file này thì bỏ qua — S4 không phải lượt cron).

## 1. Đổi mặc định VITE_LOCK_AGING_S 1800 → 600 (đã duyệt, làm đầu luồng)

- Đổi 3 chỗ trong `apps/web/scripts/vcut-vite-lock-v2.sh` + ghi chú header
  "ĐỔI MẶC ĐỊNH ĐỢT 116 S4": comment §2, doc biến môi trường, và
  `${VITE_LOCK_AGING_S:-1800}` → `${VITE_LOCK_AGING_S:-600}` trong
  `ticket_sort_key`.
- KHÔNG đổi: timeout acquire mặc định vẫn 1800 s, cooldown
  `VITE_LOCK_REACQUIRE_DELAY_S` vẫn 15 s, `VITE_LOCK_POLL_S` vẫn 2 s.
- Verify sau đổi:
  - Test suite `test-vite-lock-v2.sh`: **3 lần liên tiếp 9/9** (21:05–21:06Z,
    log `hidden_files/round116-s4/test-v2-after-600.log`).
  - Unit check mặc định mới có tác dụng thật (không env override,
    `verify-aging-default.sh`, sandbox /tmp): ticket normal chờ **601 s →
    key `0-…` (được nâng hạng)**, ticket chờ **100 s → key `1-…` (ở lại
    class 1)**; đối chứng `AGING=1800`: ticket 601 s vẫn `1-…` (không
    nâng — đúng, vì 601 < 1800). Test suite đặt `VITE_LOCK_AGING_S=3600`
    nên không bao phủ mặc định mới — unit check này bù đúng chỗ đó.

## 2. Hướng dẫn dùng v2 cho các luồng đợt 116

- `hidden_files/round116-s4/usage-v2.md`: mẫu `run-attempt` + dial ngoài
  lock, `VITE_LOCK_AGING_S=600` explicit, cấm v1, cấm `pkill` pattern
  trần, `--host 127.0.0.1`, cổng riêng, `status`/`queue`, cách xử lý
  lock kẹt / sau reboot, và số liệu đã đo ở §3–§4 để luồng sau đối chiếu.
- Kiểm chứng việc các luồng 116 dùng v2 (grep lúc 21:11Z): **S2, S3, S5,
  S6, S8, S10 đều viết driver/prereg trỏ `vcut-vite-lock-v2.sh`**;
  S8 đã chạy vite thật bằng v2 (§3). **Không luồng 116 nào gọi v1**
  (hit duy nhất của grep v1 là comment trong header bản copy v2 của S10,
  không phải lệnh gọi). Chế độ hỗn hợp v1/v2 KHÔNG xảy ra trong đợt 116
  tính tới thời điểm này.

## 3. Phép đo sống waiter dưới tải đợt 116

- Bối cảnh tải: **NHẸ lúc đo** (load1 0,7–1,3 trong cả 2 phase; các luồng
  S khác mới bắt đầu, chưa vào lượt hog/probe nặng). Mọi số wait dưới
  đây là số đo trên lock thật nhưng KHÔNG đại diện cho tải hog cao.
- **S8 chạy vite thật bằng v2** (bằng chứng sống migration đang diễn ra):
  attempt 1 port 5599 ACQUIRED 21:07:24Z wait_s=0, RELEASED hold_s=1;
  COOLDOWN wait 2606 ms (giữ lại trong 15 s sau nhả → chờ đủ cooldown);
  attempt 2 port 5598 ACQUIRED 21:07:40Z wait_s=3, vite node pid 36206
  sống, RELEASED 21:08:25Z hold_s=45 (đúng `timeout 45 vite`).
- **Phase A** (`live-waiter.sh`, 21:08:27–21:08:59Z): 3 waiter (W1 normal,
  W2 long +5 s, W3 normal +10 s). S8 vừa nhả **2 s trước** khi W1 tới
  nên W1 không kịp xếp sau holder thật — W1 ACQUIRED ngay wait 72 ms;
  W2 wait 6.328 ms; W3 wait 12.676 ms. Thứ tự giữ W1 → W2 → W3 đúng FIFO
  (W2 không vượt W1 vì W1 đã giữ trước khi W2 tới — ưu tiên chỉ sắp
  xếp giữa các waiter ĐANG CHỜ, không cướp holder; đúng thiết kế).
- **Phase B** (`live-waiter-b.sh`, 21:09:37–21:10:49Z): holder s4-hold2
  giữ đúng 60 s; W-normal tới trước (21:09:38), W-long tới sau 3 s
  (21:09:41), WT timeout 45 s (21:09:41).
  - **Ưu tiên lượt dài xác nhận trên lock thật:** sau khi holder nhả
    21:10:37Z, s4-wL (long, tới sau) ACQUIRED trước — wait_s=56
    (wall 56.222 ms); s4-wN (normal, tới trước) ACQUIRED sau —
    wait_s=66 (wall 65.680 ms). Long vượt normal giữa các waiter đang
    chờ, đúng thiết kế.
  - **Vá C (timeout wall-clock) xác nhận sống:** s4-wT TIMEOUT ở wall
    **45.692 ms** (danh nghĩa 45 s), log `waited=46s` — giãn chỉ ~1 s,
    so với trước vá giãn 1,34× (900 s → 1204 s, pilot R4). Caveat: tải
    lúc đo nhẹ nên đây chưa phải phép đo giãn dưới tải hog — xem §6.
  - Không waiter nào đói: cả 2 waiter còn lại đều giữ lock ngay sau khi
    holder nhả (W-long cùng giây nhả, W-normal +2 s sau khi W-long nhả).
- **Tổng hợp `vite-lock-v2.log` (49 dòng, tới 21:11Z):** TICKET 16,
  ACQUIRED 14, RELEASED 14, TIMEOUT 2 (1 pilot R4 + 1 s4-wT đo này),
  STALE-LOCK 1 (probe S4 §4), STALE-TICKET 0, COOLDOWN 2.
  Riêng đợt 116 (S4+S8): DEFERRED **1** (s4-wT, cố ý), STALE-LOCK **1**
  (probe tái tạo R3, cố ý), wait tối đa **66 s** (s4-wN), không waiter
  nào timeout ngoài ý muốn, không STALE-TICKET.

## 4. Kiểm stale detection v2 trên lock R3 sau reboot #48

- **Trên đĩa lúc S4 bắt đầu: vite.lock KHÔNG còn.** Lock stale của R3
  (boot #47, pid 105555) đã được R6 reclaim đúng cơ chế lúc ~19:46Z
  14/11 — `chain-r6.log`: "lock R3 (pid 105555, boot cũ 5578af38) đã
  chết — xác minh 3 điều kiện stale (pid chết + không vite trên 5590 +
  curl 000) rồi reclaim theo đúng cơ chế stale-recovery". R3 dùng v1
  nên lần dọn đó là cơ chế v1, không phải v2 — v2 chưa từng được thử
  trên lock stale thật trước đợt này.
- **Kiểm v2 bằng tái tạo đúng bản ghi R3** (`stale-probe-r3recreate.sh`,
  21:07:26Z): tạo lock giả trên đường lock thật với owner
  `thread=r3-round115 pid=105555 port=5590 boot=5578af38-911d-4f3b-93b0-383a1664f225`
  (boot #47 đầy đủ, lấy từ log R1), tuổi dir 70 phút, sau khi xác minh
  lock thật đang trống + pid 105555 chết + curl 5590 = 000 + mkdir
  nguyên tử (thua race → abort, không xóa lock người khác).
- **Kết quả PASS:** v2 acquire (thread s4-staleprobe) ghi `STALE-LOCK
  stale: owner pid 105555 chết + không vite trên cổng 5590 + curl 000 +
  boot đổi (tuổi 4200s)`, xóa lock và ACQUIRED trong **211 ms**
  (wait_s=0) — đường tắt boot-change có tác dụng, KHÔNG chờ đủ 30 phút
  tuổi stale_min. Nhả sạch sau đó, lock trống.
- Cooldown: 9 file trong `vite.lock.queue/` lúc cuối (r4-round115 +
  s8-round116 + 7 file probe s4 các thread) — đều < 1 ngày, giữ lại theo
  luật R4 §8; file cooldown chỉ delay cùng-thread reacquire, không chặn
  luồng khác, không tính là ticket (status báo đúng `0 ticket + 9
  cooldown`).

## 5. Verdict: v2 đã sẵn sàng làm mặc định cho đợt 117+ chưa?

- **CHƯA ĐỦ ĐIỀU KIỆN ĐỂ QUYẾT NGAY — nhưng không còn lỗi chặn nào.**
  Bằng số: test 9/9 ×3 sau đổi default; aging 600 chứng minh unit;
  FIFO + long-priority + cooldown + stale boot-change đều PASS trên lock
  thật; TIMEOUT wall-clock đúng (±1 s); v2-only đã là thực tế (6/10
  luồng viết driver v2, S8 chạy vite thật, 0 luồng gọi v1); v1 frozen
  nguyên vẹn.
- **Còn thiếu 2 điều kiện (cả 2 đều cần dữ liệu đợt 116, không phải sửa
  code):**
  1. **Mẫu waiter thật còn mỏng:** tới 21:11Z mới có S8 chạy vite thật
     bằng v2 + probe S4. Các luồng S1/S2/S3/S5/S6/S7/S9/S10 chưa tới
     lượt dùng lock nhiều. Cần hết đợt 116 không có DEFERRED ngoài ý
     muốn / waiter đói / STALE-LOCK bất ngờ thì mới coi migration đã
     qua lửa thật.
  2. **Vá C chưa đo dưới tải hog:** TIMEOUT 45 s nổ đúng wall lúc tải
     nhẹ (load1 ~1,3). R4 §9 đã ghi nợ "đo lại giãn dưới tải cao" —
     vẫn mở: cần 1 waiter timeout (vd 300 s) dưới load1 > 15 rồi so
     tường/danh nghĩa.
  3. **Aging 600 chưa quan sát trực tiếp:** chưa có waiter thật nào chờ
     > 600 s trong đợt 116 — hiệu ứng chống đói của 600 so với 1800
     mới chứng minh ở mức unit (ticket 601 s được nâng), chưa có mẫu
     sống. Cần ít nhất 1 waiter chờ > 600 s trong đợt 116/117.
- **Nếu 3 điều trên đạt trong đợt 116:** đổi `VCUT_VITE_LOCK_FREEZE_SPEC`
  sang v2 ở đợt 117, giữ v1 frozen làm bản sao lưu (không xóa). Nếu đợt
  116 xuất hiện DEFERRED ngoài ý muốn do hàng đợi v2, parent quyết lại
  trước khi đổi spec.

## 6. Hạn chế trung thực + nợ chuyển tiếp

- Phase A suýt đo được waiter xếp sau holder vite thật (S8 nhả đúng 2 s
  trước khi W1 tới) — không có số wait sau holder vite thật, chỉ có
  wait sau holder `sleep` của S4.
- Tải lúc đo nhẹ (load1 ≤ 1,3) — mọi số wait/timeout KHÔNG đại diện
  cho tải hog cao; đặc biệt vá C còn nợ 1 phép đo dưới load1 > 15.
- T7 nhạy nhiễu môi trường (R4 §5): 3/3 lần 9/9 lần này, nhưng vẫn có
  thể flaky khi luồng khác khởi động process giữa 2 poll của test.
- Cooldown file tích lũy theo thread (9 file sau 2 đợt) — chưa có cơ
  chế dọn cooldown > 1 ngày tự động; nợ nhỏ, không ảnh hưởng lock.
- `vite_node_pid` khi exe không đọc được sẽ bỏ qua pid (fail-safe R4
  vá E) — kill-vite có thể báo "đã sạch" trong khi vite thật còn sống
  nếu chạy dưới user khác/hidepid; chưa gặp trên VM này.
- Không đụng: TTS 39, birefnet, `.github/workflows/*`, production code,
  `preview.tsx`, `vcut-poll-quiet-v2.sh`, `test-vite-lock-v2.sh`.

## 7. File đổi + stage

| File | Đổi gì |
|---|---|
| `apps/web/scripts/vcut-vite-lock-v2.sh` | Mặc định `VITE_LOCK_AGING_S` 1800 → 600 (3 chỗ) + ghi chú header đợt 116 S4 |
| `docs/PHASE9_ROUND116_S4_LOCKV2MIGRATION_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock.sh` (frozen, md5
`fd21193c`), `apps/web/scripts/vcut-poll-quiet-v2.sh`,
`apps/web/scripts/test-vite-lock-v2.sh`, production code, `preview.tsx`
(md5 `03bf029f`).
Stage: `repo-1-push/paths-loop/phase9-round116-s4-lockv2migration.txt`
(NUL-delimited, 2 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round116-s4/` (usage-v2.md,
test-v2-after-600.log, verify-aging-default.sh,
stale-probe-r3recreate.sh + stale-probe.log, live-waiter.sh +
live-waiter.log + live-waiter-run.log, live-waiter-b.sh +
live-waiter-b.log + live-waiter-b-run.log, live-s4-w*.out,
live-s4-hold2.out).
