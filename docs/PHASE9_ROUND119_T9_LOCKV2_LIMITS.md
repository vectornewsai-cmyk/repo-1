# PHASE9 ROUND119 T9 — Theo dõi lock v2: suite T7 chạy lại 9/9 hai lần + điều tra "KHÔNG NHẢ — owner '?'" — LIMITS

- Đợt: 119, luồng T9 (theo dõi lock v2). Lượt cron 06:35 +07 16/11/2026.
  Chạy 23:41–23:47Z 15/11/2026 (06:41–06:47 +07 16/11).
- Nhiệm vụ (nợ đợt 118 §10 mục 7, xem `docs/PHASE9_ROUND118_LIMITS.md`
  §10 mục 7 + §1, quyết parent §12 mục 9): (1) chạy lại suite
  `test-vite-lock-v2.sh` (T7) — đợt 118 FAIL hai lần (B1=6 B2=6, lần 1
  B1=8 B2=6), T1 kết luận nhiễu môi trường; (2) điều tra thông báo
  "KHÔNG NHẢ — owner '?'" của T3 khi nhả lock sau s79r2 (lock cuối vẫn
  trống đúng).
- KHÔNG push/tag/binary. KHÔNG sửa production, KHÔNG sửa script lock hay
  poll-quiet (PROBE-ONLY — xem §4). Chỉ chạy suite + tái hiện trên lock
  dir /tmp. Không đụng TTS 39, birefnet, `.github/workflows/*`.
- Thư mục làm việc: `hidden_files/round119-t9/` (run-suite.sh,
  test-v2-run1.log, test-v2-run2.log, env-before.log,
  blocker-sampler.log, repro-owner-q.sh, repro-owner-q.log,
  repro-owner-q2.sh, repro-owner-q2.log).

## 0. Trạng thái lúc bắt đầu — boot MỚI #56, lock TRỐNG, cửa yên tương đối

- Boot lúc bắt đầu: uptime -s **2026-11-15 23:33:34Z**, boot_id
  `27c8b1d9-33dd-4c63-9989-f9254a66dbc2` — **boot MỚI sau #55**
  (12:51:56Z 15/11), uptime 7–8 phút lúc T9 bắt đầu. Số thứ tự boot
  tạm thời (mù #37 chưa đóng — T6 đợt 119 owns).
- Lock thật lúc 23:41:52Z: **TRỐNG** (0 ticket + 30 cooldown). Không
  có tiến trình vite/probe nào (0 blocker theo mẫu poll-quiet).
  Load 2,39/1,80/0,90 lúc bắt đầu; 1,90 lúc kết thúc 2 lần suite.
- Các luồng round119 khác đã mở thư mục (t4/t5/t6/t7 lúc 23:41Z) nhưng
  CHƯA luồng nào giữ lock hay chạy vite/probe lúc T9 chạy suite —
  cửa yên tương đối, dù không phải yên tuyệt đối (xem §1 sampler).
- md5 TRƯỚC = md5 đợt 118 (không đổi — không ai sửa script lock từ
  đợt 118):
  - v2 `apps/web/scripts/vcut-vite-lock-v2.sh`: `5cac10af3fe948f3986385e6567c3c94`
  - v1 frozen `apps/web/scripts/vcut-vite-lock.sh`: `fd21193c5b4b7ba1769bb16fd5482984`
  - `vcut-poll-quiet-v2.sh`: `1710e4803c479e0c5214ff7b9c96de54`
  - `test-vite-lock-v2.sh`: `1c0d7eaa1eb4ae6bfadbcb6abfe04702`

## 1. Suite T7 chạy lại: 9/9 PASS HAI LẦN — T7 FAIL đợt 118 là nhiễu môi trường, KHÔNG phải hồi quy

### 1.1 Kết quả

| Lần | Thời gian (UTC) | Kết quả | T7 (B1 → B2) | T6 cooldown |
|---|---|---|---|---|
| 1 | 23:42–23:43Z | **9/9 PASS** | **4 → 3 (diff 1)** | 3101 ms |
| 2 | 23:43Z | **9/9 PASS** | **2 → 1 (diff 1)** | 3069 ms |

- Cả 9 case xanh cả 2 lần: syntax, T1 FIFO (2<4<5 / 2<4<5), T2
  priority, T3 stale-lock (129 ms / 230 ms, log có STALE-LOCK), T4
  stale-ticket, T5 release-between-attempts, T6 cooldown, T7 poll,
  T8 run-attempt (false→1, true→0, lock trống sau cả 2 attempt).
- Log: `hidden_files/round119-t9/test-v2-run1.log`,
  `test-v2-run2.log`.

### 1.2 T7: B1/B2 chênh đúng 1 cả hai lần — nhưng nền VẪN churn

- Lần 1: B1=4 (3 blocker nền + 1 WebProcess giả), B2=3 (3 nền, giả
  đã kill) → diff 1. Lần 2: B1=2 (1 nền + 1 giả), B2=1 → diff 1.
- **Nền không yên:** sampler đếm blocker mỗi 2 s trong lúc chạy
  suite (22 mẫu) cho thấy số lượng nhảy liên tục **1 → 4 → 2 → 4 →
  6 → 2 → 3 → 4 → 3 → 2 → 4 → 6 → 5 → 3 → 2** — tức có tiến trình
  khớp mẫu vite/probe/webkit khởi động/dừng suốt cửa sổ đo. T7
  vẫn xanh vì **không có tiến trình nào khởi động/dừng đúng trong
  khoảng ~2 s giữa 2 lần poll của T7** (poll → kill giả → sleep 1 s
  → poll) ở cả hai lần chạy.
- **So sánh đợt 118 (T1):** lần 1 B1=8 B2=6 (diff 2 — một blocker
  nền biến mất cùng lúc), lần 2 B1=6 B2=6 (diff 0 — một blocker nền
  xuất hiện cùng lúc). Cùng cơ chế, khác kết quả tung đồng xu.
  **Kết luận: T7 FAIL đợt 118 là nhiễu môi trường — ĐÃ XÁC NHẬN
  bằng tái hiện 2 lần xanh trên cùng script, cùng máy, chỉ khác
  thời điểm.** Không có hồi quy lock: T1–T6/T8 xanh cả 4 lần chạy
  (2 lần đợt 118 + 2 lần đợt này), và script lock/poll không đổi
  md5 kể từ đợt 118.
- **Caveat (ghi rõ, không giấu):** 2 lần xanh này KHÔNG chứng minh
  T7 hết flaky — chỉ chứng minh nó flaky theo hướng có lợi lần
  này. Bản chất test vẫn là đẳng thức trên số đếm toàn cục
  (B1−B2=1) trong cửa sổ ~2 s; bất kỳ tiến trình nào khớp mẫu
  khởi động/dừng trong cửa sổ đó là vỡ đẳng thức. S4 đợt 116 đã
  ghi đúng tính này ("T7 nhạy nhiễu môi trường… flaky khi luồng
  khác khởi động process giữa 2 poll"). Quyết tách T7 khỏi gate
  9/9 khi đợt đông vẫn thuộc về parent (T1 đợt 118 đã đề xuất,
  T9 không tự đổi test).

### 1.3 Blocker nền gồm những gì (đo trực tiếp, không đoán)

- Lúc 23:44:11Z (ngay sau suite): 2 blocker — (1) shell session của
  luồng T7 round119 chạy `vcut-webkit-postboot-check.sh` (cmdline
  chứa "webkit" → khớp mẫu `[w]ebkit`); (2) probe thật của T2
  `node apps/web/scripts/probe118t2-storeheld-diag.mjs` (H3f diag,
  chạy chồng lên lúc này).
- Lưu ý cho người đọc T7: mẫu đếm `count_blockers` khớp cả **chính
  shell chạy suite** (cmdline chứa "test-vite-lock-v2.sh" → khớp
  `[v]ite`) và **mọi lệnh exec/session nào có chuỗi "vite"/"webkit"
  trong cmdline** — nhưng các số đếm đó là HẰNG SỐ trong cả 2 lần
  poll nên triệt tiêu trong hiệu B1−B2; chỉ tiến trình khởi
  động/dừng GIỮA 2 lần poll mới làm vỡ đẳng thức.
- Sau suite, T1 round119 đã acquire lock thật (thread=t1, port
  5590, từ 23:44:08Z) và load leo lên 10,72 lúc 23:47:20Z — máy
  chuyển sang bận ngay sau cửa yên T9 dùng. Suite chạy đúng lúc.

### 1.4 Tác dụng phụ nhỏ (ghi rõ)

- Một lệnh kiểm tra `vcut-poll-quiet-v2.sh 1 --once` lúc 23:44:11Z
  đã ghi thêm 2 dòng vào log mặc định
  `hidden_files/round114-q4/poll-quiet-v2.log` (POLL_LOG_DIR mặc
  định của script là round114-q4). Chỉ là dòng log append, không
  ảnh hưởng gì; ghi lại để khỏi ai thắc mắc khi thấy dòng lạ trong
  log đợt 114.

## 2. Điều tra "KHÔNG NHẢ — owner '?'" — ĐÃ RÕ NGUYÊN NHÂN, KHÔNG PHẢI BUG

### 2.1 Kết luận ngắn

`'?'` là giá trị mặc định của `${owner_thread:-?}` trong
`cmd_release` (`vcut-vite-lock-v2.sh:414`) khi **không còn file
owner để đọc** — tức lock đã trống rồi mà còn gọi release thêm một
lần nữa. Đây là **release thừa (double-release) vô hại**: rc=1,
không đổi trạng thái nào, không ghi thêm RELEASED, lock vẫn trống
đúng. Không phải bug lock, không phải owner bị mất, không phải
race. **KHÔNG SỬA production** (xem §4 — chỉ đề xuất cải tiến
thông báo, chờ parent quyết).

### 2.2 Chuỗi bằng chứng từ đợt 118 (đọc lại, không tin mù)

- `vite-lock-v2.log` (log lock thật): T3 có đúng **3 RELEASED**
  thành công — dry 11:42:23Z hold 42 s, s79r1 12:02:06Z hold 1055 s,
  **s79r2 12:31:13Z hold 1137 s**. Cả 3 lần nhả thật đều sạch.
- `hidden_files/round118-t3/driver118t3.log` dòng 362 + 364: đúng
  **2 dòng** `vite-lock-v2: KHÔNG NHẢ — owner hiện tại là '?',
  không phải 't3-round118'` lúc **12:31:19Z** — tức SAU lần nhả
  thật 6 giây, xen kẽ 2 dòng "co DIALING da xoa".
- `driver118t3.sh`: `cleanup_all()` (dòng 60) gọi
  `release "$THREAD"`; được gọi tường minh 2 lần ở dòng 354 và 360
  (sau khi s79r2 xong) + trap EXIT/TERM/INT (dòng 62) + gọi cuối
  dòng 388. Hai dòng '?' khớp đúng 2 lần gọi tường minh 354/360:
  mỗi lần `clear_dialing` in "co DIALING da xoa" rồi `release` in
  "KHÔNG NHẢ — owner '?'" vì run-attempt đã nhả lock từ 12:31:13Z.
- `vite-lock-v2.log`: **0 dòng** "KHÔNG NHẢ" — nhánh release thất
  bại chỉ `echo` ra stdout, không `log_event` (đúng thiết kế: chỉ
  sự kiện lock thật mới vào log).
- Cùng thông báo cũng có trong v1 frozen
  (`vcut-vite-lock.sh:191`, cùng cấu trúc `${owner_thread:-?}`) —
  không phải mới ở v2. S3 §8 + T3-117 §8 đã ghi cùng hiện tượng
  (cleanup trap gọi release sau khi run-attempt đã nhả).

### 2.3 Tái hiện có kiểm soát (lock dir /tmp, KHÔNG đụng lock thật)

Script `repro-owner-q.sh` + `repro-owner-q2.sh`, log
`repro-owner-q.log` / `repro-owner-q2.log`:

| Thí nghiệm | Kết quả |
|---|---|
| **A. Double release:** acquire tA → release → release lần 2 | Lần 2 in đúng `KHÔNG NHẢ — owner hiện tại là '?', không phải 'tA'`, rc=1; log chỉ có **1 dòng RELEASED** cho tA; status TRỐNG |
| **B. Release khi lock trống từ đầu** (chưa từng acquire) | Cùng thông báo '?', rc=1 |
| **C. Đối chứng — release sai thread trong lúc người khác đang giữ** | In **tên owner thật** `KHÔNG NHẢ — owner hiện tại là 'tH', không phải 'tX'`, rc=1 — chứng minh '?' KHÔNG có nghĩa "owner không rõ", mà có nghĩa "không có file owner" |
| **D. Dir lock tồn tại nhưng KHÔNG có file owner** (mô phỏng vụ L4) | Cùng thông báo '?', rc=1 |
| **E. run-attempt + cleanup trap gọi release lần 2** (đúng chuỗi T3) | run-attempt nhả sạch (RELEASED hold 1 s, đúng 1 dòng trong log); cleanup gọi release sau đó in '?'; status cuối TRỐNG |

- Cơ chế trong code (`cmd_release`, dòng ~405–414):
  `owner_thread=$(owner_field thread)` → `owner_field` grep
  `^thread=` trong `$LOCKDIR/owner` → rỗng khi lock dir đã bị
  `rmdir` (sau release) hoặc khi owner file không tồn tại → so
  sánh khác thread → in `'${owner_thread:-?}'` → `'?'`.
- **Sự cố nhỏ trong lúc tái hiện (ghi rõ):** script repro đầu bị
  kẹt ở lệnh `wait` trần trong Exp C — `wait` không đối số chờ cả
  job process-substitution `tee` (sống tới khi script kết thúc).
  Đã kill (SIGTERM) và chạy lại Exp D/E riêng với `wait` có PID
  tường minh + không dùng process substitution — xong trong 2,8 s.
  Không ảnh hưởng kết quả (Exp A–C đã ghi đủ log trước khi kẹt).

### 2.4 Đánh giá: có cần sửa gì không?

- **Không có bug để sửa.** Double-release là no-op an toàn theo
  thiết kế (guard `owner_thread != thread` chặn nhả nhầm lock của
  người khác — Exp C chứng minh guard hoạt động).
- **Đề xuất nhỏ (KHÔNG tự làm, chờ parent quyết):** thông báo có
  thể rõ hơn, vd `lock đã trống (không còn owner) — bỏ qua release
  thừa` thay vì `owner hiện tại là '?'`, để luồng sau khỏi mất
  công điều tra lại. Đây là thay đổi cosmetic vào script spec
  đóng băng — cần parent duyệt trước khi sửa, và nếu sửa thì phải
  chạy lại suite + ghi prereg. T9 KHÔNG sửa trong đợt này
  (PROBE-ONLY theo nhiệm vụ).
- **Ghi chú cho driver sau:** `cleanup_all` gọi release thừa là
  bình thường (idempotent-ish, rc=1 được `|| true` nuốt); không
  cần sửa driver118t3 hay driver sau — nhưng nếu driver muốn log
  sạch thì có thể kiểm `status` trước khi release (không bắt buộc).

## 3. Kiểm chứng độc lập

- Suite chạy 2 lần liên tiếp trên cùng script (md5 không đổi),
  kết quả 9/9 + 9/9, log đầy đủ `test-v2-run1.log` /
  `test-v2-run2.log` (grep PASS/FAIL đã đối chiếu — 9 PASS mỗi
  lần, 0 FAIL).
- Sampler blocker (22 mẫu/2 s) đối chiếu độc lập với B1/B2 của T7:
  nền churn suốt cửa sổ suite nhưng ổn định trong từng cặp poll
  T7 — khớp cơ chế nhiễu đã kết luận.
- Tái hiện owner '?' 5 thí nghiệm (A–E) trên lock dir /tmp riêng,
  gồm 1 đối chứng (Exp C) phân biệt '?' với owner thật — kết luận
  không dựa vào 1 mẫu duy nhất.
- Lock thật không bị đụng: mọi acquire/release thí nghiệm dùng
  `VITE_LOCK_DIR=/tmp/vcut-t9-ownerq/...`; lock thật lúc T9 kiểm
  cuối đang do T1 round119 giữ hợp lệ (thread=t1, port 5590,
  vite serving) — T9 không acquire/release lock thật lần nào.
- Không sửa production: md5 4 script trước = sau (xem §0).

## 4. Hạn chế trung thực + nợ mở

- **T7 vẫn flaky về bản chất** (xem §1.2): 2 lần xanh lần này
  không xóa được tính flaky; lần sau chạy giữa đợt đông vẫn có thể
  FAIL nếu một tiến trình khớp mẫu khởi động/dừng đúng cửa sổ ~2 s
  của T7. Nợ nhỏ cho parent: tách T7 khỏi gate 9/9 khi đợt đông,
  hoặc đổi T7 sang đếm chênh lệch có dung sai (vd |B1−B2−1| ≤ 1
  kèm ghi blocker nền) — T9 không tự đổi test (sửa test để "xanh"
  thì là gian lận số đo nếu không đăng ký trước).
- **"KHÔNG NHẢ — owner '?'" ĐÃ ĐÓNG** (không còn nợ): nguyên nhân
  rõ, tái hiện đủ, không phải bug, không sửa. Đề xuất cải tiến
  thông báo (§2.4) chờ parent quyết — nếu parent đồng ý thì là
  việc nhỏ cho luồng hạ tầng sau, kèm chạy lại suite.
- **Boot #56 mới** (23:33:34Z, boot_id 27c8b1d9…): số thứ tự tạm
  thời, mù #37 vẫn mở — T6 đợt 119 owns (probe #38).
- **Không chạy tsc/vite build trong luồng này:** T9 không sửa code
  nào nên không có gì để build lại; cây cuối đợt 118 đã được
  parent chạy lại tsc 0/0 + vite build PASS khi đóng đợt (xem
  `docs/PHASE9_ROUND118_LIMITS.md` §0).

## 5. File đổi + stage

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND119_T9_LOCKV2_LIMITS.md` | Mới (tài liệu này) |

Không đổi: `apps/web/scripts/vcut-vite-lock-v2.sh` (md5 `5cac10af`
trước = sau), `vcut-vite-lock.sh` (frozen `fd21193c`),
`vcut-poll-quiet-v2.sh` (`1710e480`), `test-vite-lock-v2.sh`
(`1c0d7eaa`), production code, `preview.tsx`.
Stage: `repo-1-push/paths-loop/phase9-round119-t9-lockv2.txt`
(NUL-delimited, 1 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round119-t9/` (run-suite.sh,
test-v2-run1.log, test-v2-run2.log, env-before.log,
blocker-sampler.log, repro-owner-q.sh, repro-owner-q.log,
repro-owner-q2.sh, repro-owner-q2.log).
