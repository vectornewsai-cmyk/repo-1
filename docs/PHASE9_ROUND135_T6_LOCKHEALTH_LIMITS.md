# PHASE9 ROUND135 T6 — THỰC HIỆN đổi thứ tự ghi log RELEASED/cooldown (quyết parent đợt 134 §12.3(b), sửa F-134-T6-2) + lock health + prune lần 10 + CHỐT SỐ BOOT #90? — LIMITS

- Đợt: 135, luồng T6 (thực hiện đổi thứ tự ghi log lock v2 + kiểm
  chứng cắt ngang + sức khỏe lock + prune cooldown + chốt số boot).
  Lượt cron 09:35 +07 18/11/2026 (= 02:35Z). Chạy 02:40Z → 02:49Z
  18/11/2026, toàn bộ trên một boot duy nhất #90? (78b55838) — KHÔNG
  có reboot trong phiên T6.
- Nhiệm vụ: THỰC HIỆN quyết parent đợt 134 §12.3(b) — đổi thứ tự
  ghi log RELEASED/cooldown trong `cmd_release` của script lock v2;
  ghi thứ tự mới vào spec; kiểm chứng bằng mô phỏng cắt ngang; lock
  health đợt 135; prune lần 10; chốt lại chuỗi boot với boot mới.
- KHÔNG push/tag/binary. Không đụng TTS 39, birefnet, G1,
  `.github/workflows/*`. Không sửa production.
- Thư mục làm việc: `hidden_files/round135-t6/` (status-open.txt,
  status-close.txt, ps-full-open.txt, ps-full-close.txt, ss-open.txt,
  ss-close.txt, analyze-log-cleaned-open.txt,
  vite-lock-v2-cleaned-886.log, analyze-log-cleaned-close.txt,
  vite-lock-v2-cleaned-886-close.log, cooldown-now.txt,
  prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
  test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg-fixed.sh,
  repro-newmsg.log, cut-sim.sh, cut-sim.log, cut-sim-old.log,
  cut-sim-new.log, cut-sim-new-normal.log).
- Lưu ý đường dẫn: log lock thật và queue cooldown nằm ở
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/`
  (`vite-lock-v2.log`, `vite.lock.queue/`), KHÔNG phải
  `~/workspace/repo-1/hidden_files/`.

## 0. Trạng thái lúc bắt đầu — BOOT #90? (số tạm, xem §8)

- **Boot lúc mở và lúc đóng: boot_id
  `78b55838-d09e-4cfc-b491-a15935b7a447`, btime 02:27:27Z**
  (`uptime -s` = 02:27:27Z, `who -b` = Nov 18 02:27,
  `/proc/1` 02:27:38Z — chênh +11 s, cùng mẫu các boot trước;
  `journal --list-boots` chỉ 1 dòng 78b55838, first entry
  02:27:38Z). Uptime ~13' lúc T6 bắt đầu (02:40:39Z), ~22'
  lúc đóng (02:49:02Z). Khớp brief mở đợt 135 +
  round-in-progress.md (boot mới sau khi đợt 134 đóng trên
  8ae55060). Đây là **reboot #89?→#90? — sự kiện gộp #14**
  (ranh giới, sau khi đợt 134 đóng 02:02Z, trước khi đợt 135
  mở 02:35Z).
- Script lock v2 lúc mở: md5 `cd0c05c1` (bản từ đợt 120, chưa
  đổi) — v1 frozen `fd21193c`, suite `1c0d7eaa`, khớp baseline.
- Repo local `~/workspace/repo-1` **không có `.git`** (chỉ là
  bản sao làm việc) nên T6 không verify HEAD tại chỗ bằng
  git — việc verify ref thuộc lúc push (parent, public API).
- Các luồng đợt 135 khác đang chạy song song (lúc T6 chạy đã
  có thư mục round135-t1…t10; T9.done lúc 02:46Z — T6 không
  đọc nội dung cờ này, T10 đối chiếu).

## 1. Quét zombie: 0 zombie; 0 vite/node/webkit thật — 0 cổng lạ (lúc mở và lúc đóng)

- `ps -eo pid,ppid,etime,stat,comm,args` đầy đủ lúc 02:40Z
  (mở, `ps-full-open.txt`) và lúc 02:49Z (đóng,
  `ps-full-close.txt`).
- Đếm trạng thái Z bằng `awk '$4 ~ /^Z/'` trên cột STAT:
  **0 zombie** ở cả 2 snapshot.
- `ss -tlnp`: cả 2 lần **không có cổng TCP nào đang lắng
  nghe** (chỉ dòng header).
- **0 tiến trình vite/node/webkit/chromium thật** ở cả 2
  snapshot (2 dòng khớp "vite" trong ps-full-close.txt chỉ
  là chuỗi lệnh shell của T10-135 đang chờ và của chính
  lệnh đo của T6 — không phải process vite).
- **0 tiến trình lock-script nào đang chạy** ở cả 2 snapshot
  (không có acquire/release nào đang chạy) — đủ điều kiện
  sửa script theo freeze spec §4 (xem §3.3).

## 2. Lock lúc mở và lúc đóng: TRỐNG cả hai lần; chưa có chu kỳ lock nào của đợt 135

- Thư mục lock thật `hidden_files/vite.lock` **KHÔNG tồn tại**
  lúc 02:40Z (mở) và lúc 02:49Z (đóng) — không có file owner
  stale nào, không cần dọn lock stale.
- `status` lúc mở và lúc đóng: `TRỐNG (không có lock)`,
  `0 ticket + 80 cooldown`, rc=0 cả hai lần.
- Log thật lúc mở: **892 dòng thô / 886 dòng chính thức** —
  dòng cuối `2026-11-18T01:59:31Z t10-round134 RELEASED
  hold_s=108`. **Không có event lock nào của đợt 135** tới
  lúc T6 đóng (T4-135 lượt yên #12 và T8-135 chưa acquire;
  không có bản frozen lock nào trong `round135-t4/`,
  `round135-t8/`, `round135-t10/` lúc 02:49Z). T10-135
  recount lại lúc đóng đợt như mọi đợt.
- Khoảng yên trước đợt: không có event lock nào từ
  01:59:31Z (t10-round134 release O8) tới lúc T6 đóng
  02:49Z — 49'31" yên; yên lặng này là do đợt 134 đã đóng
  và T4-135 đang chờ gate — không phải do lock kẹt (bằng
  chứng: suite /tmp §6 chạy xanh trên bản script mới +
  T4/T8-135 chưa tới lượt acquire).

## 3. THỰC HIỆN đổi thứ tự ghi log RELEASED/cooldown — quyết parent đợt 134 §12.3(b)

### 3.1 Thứ tự mới + lý do chọn (log TRƯỚC, cooldown SAU — KHÔNG chọn fsync)

- **Quyết parent đợt 134 §12.3(b):** "PHÊ DUYỆT ĐỔI THỨ TỰ ghi
  log RELEASED/cooldown (ghi log trước, cooldown sau — hoặc
  fsync; T6 đợt 135 thực hiện)". T6 chọn **phương án ghi log
  TRƯỚC, cooldown SAU**.
- **Thứ tự cũ** (`cmd_release`, script `cd0c05c1`, dòng
  ~428–437): (1) `rm owner` + `rmdir LOCKDIR`; (2) ghi file
  cooldown; (3) tính hold_s; (4) `echo ĐÃ NHẢ`; (5)
  `log_event RELEASED`. Cửa sổ nhiều bước giữa (2) và (5) là
  nơi reboot đợt 134 cắt ngang → mất dòng RELEASED
  (F-134-T6-2: t4, ACQUIRED 23:50:17Z, dòng 869).
- **Thứ tự mới** (script `520b8baa`, `cmd_release` dòng
  ~439–461): tính hold_s TRƯỚC → (1) `rm owner` + `rmdir
  LOCKDIR` → (2) **`log_event RELEASED` ngay** → (3) ghi
  file cooldown → (4) `echo ĐÃ NHẢ`. `hold_s` tính trước
  `rmdir` để `log_event` chạy ngay sau `rmdir`, không còn
  bước tính toán nào xen giữa hai lần ghi quan trọng.
- **Vì sao KHÔNG chọn fsync:** fsync chỉ bảo đảm độ bền của
  một lần ghi đã hoàn thành, không thu hẹp cửa sổ THỨ TỰ
  giữa hai lần ghi riêng biệt — với thứ tự cũ, fsync sau
  ghi cooldown rồi mới ghi log vẫn để nguyên cửa sổ
  "cooldown đã ghi, log chưa ghi" mà F-134-T6-2 đã rơi vào.
  Đổi thứ tự mới là thứ sửa đúng lỗi: sau đổi, lần ghi nào
  "mất" được thì chỉ còn là file cooldown (xem §3.2).
- **Không đổi gì khác trong logic lock:** guard release
  (phân biệt "BỎ QUA release thừa" / "KHÔNG NHẢ"), rc,
  cooldown 15 s, trap `run-attempt`, acquire, stale-recovery,
  ticket FIFO, aging — giữ nguyên. Diff với bản cũ
  (`round134-t10/vcut-vite-lock-v2.t10.sh`, md5 `cd0c05c1`)
  chỉ gồm: khối comment header mới (11 dòng, ghi quyết +
  thứ tự cũ/mới) + sắp xếp lại trong `cmd_release` (di
  chuyển `log_event RELEASED` lên ngay sau `rmdir`, di
  chuyển ghi cooldown xuống sau log; `bash -n` OK).
- **Ghi vào spec:** `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` thêm
  **§3.1** (thứ tự mới + lý do + vì sao không chọn fsync +
  cách xử lý ca t4 cũ); header script thêm khối "ĐỔI THỨ TỰ
  ... ĐỢT 135 T6". Spec vẫn ghi nguồn chuẩn là header script.
- **md5 sau đổi: `520b8baa1ba034a224140414f0874a8e`**
  (`apps/web/scripts/vcut-vite-lock-v2.sh`). v1 frozen
  `fd21193c` không đổi. Suite test `1c0d7eaa` không đổi.

### 3.2 Tính chất mới được bảo đảm + cửa sổ còn lại (ghi trung thực)

- **Tính chất mới:** một lần cắt ngang giữa hai bước ghi
  (sau `log_event RELEASED`, trước ghi cooldown) chỉ mất
  **file cooldown** — file này chỉ là mục prune, mất không
  hại: thread tự ghi lại ở lần nhả kế; acquire của thread
  khác không bị chặn; acquire lại cùng thread trong trường
  hợp xấu nhất chỉ mất 15 s chờ cooldown. **KHÔNG để lại
  ACQUIRED không cặp** — kiểm chứng ở §6.2.
- **Cửa sổ còn lại (không xóa được nếu không có journal):**
  giữa `rmdir` và `log_event` vẫn còn một lần append duy
  nhất — một lần cắt đúng trong lúc `log_event` đang append
  vẫn có thể làm mất dòng RELEASED về mặt lý thuyết. Đây
  không còn là cửa sổ nhiều bước (như F-134-T6-2) mà là một
  lần ghi đơn; xóa hẳn cần journal/ghi hai pha, vượt phạm vi
  quyết parent — ghi nhận, không giấu.
- **Tác dụng phụ đã cân nhắc — cửa sổ rmdir→cooldown dài
  thêm ~1 lần append log:** một acquirer khác chen vào giữa
  `rmdir` và ghi cooldown có thể bỏ qua 15 s chờ cooldown
  của thread vừa nhả. Cửa sổ này ĐÃ TỒN TẠI ở thứ tự cũ
  (rmdir→cooldown), nay dài thêm đúng một lần `log_event`
  (vài ms, 2 lần fork `date`); cooldown chỉ là cơ chế
  advisory chống holder cũ quay lại ngay, không phải tính
  an toàn của mutex (mutex là mkdir nguyên tử + owner) —
  không đổi verdict.
- **Tuân thủ freeze spec §4 khi sửa:** sửa lúc lock TRỐNG +
  0 acquire đang chạy (§1) + 0 tiến trình lock-script (§1);
  sửa trước khi bất kỳ luồng đợt 135 nào acquire (§2 — chưa
  có bản frozen nào, chưa có event lock đợt 135) nên không
  có tình trạng trộn 2 bản script trong đợt: mọi luồng đóng
  băng từ giờ trở đi đều lấy bản mới `520b8baa`. Quyết parent
  đợt 134 §12.3(b) giao đích danh T6 đợt 135 thực hiện đổi
  này — không phải tự ý sửa giữa đợt.

### 3.3 Xử lý ca ACQUIRED không cặp cũ (t4 đợt 134, dòng 869) — GIỮ NGUYÊN lịch sử

- Ca t4 (ACQUIRED 23:50:17Z, dòng 869 chính thức) **giữ
  nguyên trong log lịch sử, không xóa, không sửa, không
  chèn dòng RELEASED giả**. Mọi lần đếm từ nay (kể cả §4
  dưới đây) đều đếm nó là **"đang giữ GIẢI THÍCH ĐƯỢC
  (F-134-T6-2, holder chết theo reboot)"** — như T6-134 §4
  và T10-134 đã ghi chú. Chỉ các chu kỳ mới từ đợt 135 mới
  được hưởng thứ tự mới; ca cũ không "được sửa ngược" bằng
  cách sửa log.
- Bằng chứng ca cũ còn nguyên: `cooldown-t4` mtime
  23:53:53Z không đổi lúc mở/đóng đợt này (prune không chạm,
  §7); dòng 869 vẫn là ACQUIRED t4 trong bản đã lọc
  `vite-lock-v2-cleaned-886.log`.

## 4. Nhất quán log lock: 886 dòng chính thức lúc mở và lúc đóng, 256/256 cặp, 1 "đang giữ" GIẢI THÍCH ĐƯỢC (t4 F-134-T6-2), 0 mất dấu khác

Log thật `hidden_files/vite-lock-v2.log`, đếm lúc mở (02:40Z)
và lúc đóng (02:49Z) — HAI LẦN ĐẾM GIỐNG HỆT NHAU (bản đã
lọc lúc đóng `vite-lock-v2-cleaned-886-close.log` diff
khớp 100% bản lúc mở). Số chính thức đã loại 6 dòng repro
lỗi của T6-132 (tA/tH 17:43:46Z, dòng 848–853 thô). 847 dòng
đầu của bản đã lọc có md5 `9048174e…` — khớp đúng snapshot
đã lọc của T6-132/T6-133/T6-134 (chuỗi保管 không đứt).

| Sự kiện | Tổng chính thức lúc đóng | Lúc đóng 2 T6-134 (869) | Từ đầu đợt 120 (05:35Z 16/11) | Từ sau snapshot T9 (05:49Z 16/11) |
|---|---|---|---|---|
| TICKET | 271 | 266 | 180 | 174 |
| ACQUIRED | 262 | 257 | 180 | 174 |
| RELEASED | 256 | 251 | 178 | 172 |
| COOLDOWN | 82 | 80 | 74 | 69 |
| TIMEOUT | 8 | 8 | **0** | 0 |
| STALE-LOCK | 6 | 6 | **1** | 1 |
| STALE-TICKET | 1 | 1 | **0** | 0 |
| **Tổng dòng** | **886** | **869** | **613** | **590** |

- So với snapshot T6-134 đóng 2 (869 dòng): **+17 dòng =
  TICKET +5 / ACQUIRED +5 / RELEASED +5 / COOLDOWN +2 /
  TIMEOUT +0 / STALE +0** — đúng bằng 5 chu kỳ sau thời
  điểm đếm của T6-134: T8-round134 ×4 (01:15:24 hold 67 s;
  01:16:46 hold 1105 s; 01:35:58 hold 900 s; 01:51:13 hold
  129 s) + T10-round134 O8 (01:57:43 hold 108 s). Mọi chu
  kỳ đều sạch, ghép cặp đủ — khớp từng con số, không có
  event nào mất dấu hay thêm lạ ngoài ca t4 cũ §3.3.
- Ghép cặp theo thread: **256 cặp ACQUIRED→RELEASED, 1
  "đang giữ" ở cuối log = t4 (23:50:17Z, dòng 869) —
  GIẢI THÍCH ĐƯỢC (F-134-T6-2, §3.3); KHÔNG phải lock kẹt.**
  0 lần RELEASED không có ACQUIRED trước đó. Chênh
  ACQUIRED − RELEASED = 6 = 5 ca double-acquire đã biết +
  1 ca t4 reboot-kill.
- 5 ca "double-acquire" — **cùng đúng 5 ca T6 đợt 131–134
  đã liệt kê** (s3-round116, t3-round117, t4, t3-round119,
  t8-round129 dòng 781), tất cả giải thích được bằng
  STALE-LOCK cướp sau reboot; **không có ca mới nào**.
- 8 TIMEOUT toàn bộ từ trước đợt 120 (lần cuối 12:02:19Z
  15/11) — đợt 120+ có **0 TIMEOUT**; 5 STALE-LOCK + 1
  STALE-TICKET cũ toàn bộ từ trước đợt 120 + **1 STALE-LOCK
  09:04:38Z 17/11 do reboot #75→#76 giữa lượt** (đợt 130).
- Cửa sổ R120: **180 = 180 T/A, RELEASED 178** (chênh 2 =
  1 ca reboot-kill đợt 129 + 1 ca t4 đợt 134), 0 TIMEOUT,
  STALE-LOCK 1 (do reboot).
- Đếm loại event trên toàn log chính thức:
  271+262+256+82+8+6+1 = 886 = tổng dòng — mọi dòng đều
  thuộc 1 trong 7 loại đã biết, **không có dòng lạ nào**.
  **0 dòng chứa DEFER / KILLED / ERROR** trong toàn log
  (grep -i, đếm 0).
- **Đợt 134 khép lại sạch trên lock** (5 chu kỳ sau T6-134
  đóng 2 đều sạch — T6-135 đếm lại khớp đúng recount
  T10-134: 869 + 17 = 886). **Đợt 135 tới lúc T6 đóng có
  0 chu kỳ** (chưa luồng nào acquire — §2).

## 5. "KHÔNG NHẢ" / "BỎ QUA release thừa": 0 sự kiện trên lock thật trong đợt 133 (toàn đợt), đợt 134 (toàn đợt) và đợt 135 (tới 02:49Z)

Phương pháp (như T9 đợt 120 §5): nhánh release thất bại chỉ
`echo` ra stdout, KHÔNG `log_event`, nên số đếm dựa vào
**driver log**, không phải `vite-lock-v2.log`. Phạm vi đếm:
toàn bộ `round133-t*/` + `round134-t*/` + `round135-t*/`
(tới 02:49Z) — theo quy tắc lăn: bỏ round132 (T6-134 đã
đóng toàn đợt 132), thêm round135. Tổng **17 dòng khớp
chuẩn (đã loại 66 dòng echo trong các file
`khong-nha-grep*.txt` của T6-133/134 — chỉ là tiếng vọng
của các lần grep trước), phân loại đủ 17/17 — tất cả đều
là bản sao script / log repro / trích dẫn tài liệu, 0 sự
kiện trên lock thật:**

| Loại | Số dòng | Chi tiết |
|---|---|---|
| Bản sao script (không phải sự kiện) | 4 | 2 file × 2 dòng: `round133-t10/vcut-vite-lock-v2.t10.sh`, `round134-t10/vcut-vite-lock-v2.t10.sh` — mỗi file 2 dòng `echo` (dòng 421 `BỎ QUA release thừa`, dòng 423 `KHÔNG NHẢ`) |
| Tái hiện có kiểm soát trên /tmp | 9 | `round133-t6/repro-newmsg.log` + `round134-t6/repro-newmsg.log` + `round135-t6/repro-newmsg.log`: mỗi file 3 dòng (2 `BỎ QUA` + 1 `KHÔNG NHẢ`) trên /tmp — đã loại khỏi đếm chuẩn như mọi đợt (xem §6.1) |
| Trích dẫn trong tài liệu | 4 | `round133-t10/PHASE9_ROUND133_LIMITS.closing-copy.md` (1) + `round134-t10/aggregate-draft.md` (1) + `round134-t10/PHASE9_ROUND134_LIMITS.closing-copy.md` (1) + `round134-t6.done` (1) — câu trích số liệu T6, không phải sự kiện |
| **Sự kiện trên lock THẬT** | **0** | Không dòng nào trong bất kỳ driver log đợt 133 (toàn đợt) / 134 (toàn đợt) / 135 nào |
| Round135-t* (trừ repro /tmp của T6) | 0 dòng | T4/T8-135 chưa acquire (§2); T1/T3/T9/T10-135 không dùng lock |

- **Tổng trên lock thật: đợt 120 = 0, đợt 121 = 0, đợt 122
  = 0, đợt 123 = 0, đợt 124 = 0 (toàn đợt), đợt 125 = 0
  (toàn đợt), đợt 126 = 0 (toàn đợt), đợt 127 = 0 (toàn
  đợt), đợt 128 = 0 (toàn đợt), đợt 129 = 0 (toàn đợt),
  đợt 130 = 0 (toàn đợt), đợt 131 = 0 (toàn đợt), đợt 132
  = 0 (toàn đợt), đợt 133 = 0 (toàn đợt), đợt 134 = 0
  (toàn đợt), đợt 135 tới 02:49Z = 0.** Khớp với log
  pairing sạch ở §4 (256/256 cặp + 1 ca reboot-kill đã
  giải thích — không liên quan nhánh release).
- Giới hạn phạm vi: T4/T8/T10-135 chưa chạy xong tới
  02:49Z — nếu có sự kiện mới sau thời điểm đếm thì thuộc
  đợt 135, T6 đợt 136 đếm tiếp. T6 không quét toàn cây
  hidden_files (lý do như T9 đợt 120 §8).
- Lưu ý số học lăn: T6-134 đếm 18 dòng thô (8 script-copy +
  9 repro + 1 trích dẫn); đợt này bỏ round132 (−4 dòng
  script-copy) nhưng thêm round135-t6 repro (+3) và 2 dòng
  trích dẫn mới của T10-134 (aggregate-draft + .done, +2)
  → 4 dòng script + 9 dòng repro + 4 dòng trích dẫn = 17
  dòng (chưa tính 66 dòng echo đã loại).

## 6. Kiểm chứng độc lập trên /tmp: suite 9/9 ×2 + mô phỏng cắt ngang + repro message đều xanh — KHÔNG lặp lại F-132-T6-1

Script v2 lúc kiểm: `520b8baa` (bản sau đổi thứ tự, §3).
Suite + repro + cut-sim chạy trên lock dir /tmp riêng,
cổng 599x, không đụng lock thật. Boot ghi trong status
repro: boot #90? (`78b55838…`).

### 6.1 Suite `test-vite-lock-v2.sh`: lần 1 9/9 PASS, lần 2 9/9 PASS, rc=0 cả hai lần

(`round135-t6/test-v2-t6-run1.log` 02:45:37Z,
`test-v2-t6-run2.log` 02:45:58Z):
- **T7 xanh cả hai lần chạy** (lần 1 và lần 2 đều PASS=9
  FAIL=0) — lần thứ mười một liên tiếp không có lần T7
  flaky ở lần chạy đầu. Tính flaky của T7 (T9 đợt 119 §1.2)
  vẫn được ghi nhận là bản chất — mười một lần xanh kép
  không xóa nó; quyết tách T7 khỏi gate 9/9 khi đợt đông
  vẫn thuộc về parent; T6 không tự đổi test.
- Kết luận suite: xanh lần thứ mười bảy liên tiếp (T6 đợt
  120 + T9 đợt 120 + T6 đợt 121 … + T6 đợt 134 + T6 đợt
  135). Đổi thứ tự trong `cmd_release` không làm đỏ test
  nào (T1 vẫn kiểm LA < RA < LB trên bản mới).

### 6.2 Mô phỏng cắt ngang — BẰNG CHỨNG TRỰC TIẾP thứ tự mới sửa đúng F-134-T6-2

Phương pháp (`round135-t6/cut-sim.sh`, log
`cut-sim.log`): copy script sang /tmp, chèn ĐÚNG 1 dòng
`kill -KILL $$` vào giữa hai bước ghi (diff kiểm chứng
chỉ +1 dòng so với bản gốc), rồi acquire + release trên
lock dir /tmp riêng. `kill -KILL` mô phỏng reboot cắt
ngang tiến trình giữa hai bước — tương đương cơ chế
F-134-T6-2 (trap release chạy dở vì SIGTERM/reboot).
Ba ca chạy 02:46:15–16Z:

| Ca | Script + vị trí cắt | Kết quả đo được |
|---|---|---|
| **A. Đối chứng — script CŨ** (`cd0c05c1`), cắt giữa ghi cooldown và ghi log | lock dir: KHÔNG còn; file `cooldown-tCutOld`: CÓ; dòng RELEASED: **0**; dòng ACQUIRED: 1; pairing: **0 cặp, 1 đang giữ** | **TÁI HIỆN ĐÚNG F-134-T6-2** — dir sạch + cooldown có + log thiếu RELEASED, đúng từng dấu hiệu của ca t4 đợt 134 (§3.1 đợt 134) |
| **B. Thứ tự MỚI** (`520b8baa`), cắt giữa ghi log RELEASED và ghi cooldown | lock dir: KHÔNG còn; file `cooldown-tCutNew`: **KHÔNG**; dòng RELEASED: **1**; dòng ACQUIRED: 1; pairing: **1 cặp, 0 đang giữ** | **SỬA ĐÚNG LỖI** — cắt ngang chỉ mất file cooldown, log ghép cặp sạch |
| **C. Đối chứng thuận — script MỚI**, release bình thường (không chèn kill) | release rc=0; lock dir: KHÔNG còn; file `cooldown-tNorm`: CÓ; dòng RELEASED: 1 | Hành vi bình thường không đổi: vừa có log vừa có cooldown |

- Pairing độc lập bằng `analyze-log.py` (script của T6-134)
  trên 2 log cắt: log ca B = 1 cặp / 0 đang giữ / 0
  double-acquire / 0 RELEASED-không-ACQUIRED; log ca A = 0
  cặp / 1 đang giữ (tCutOld, dòng 2) — khớp đúng phân loại
  của §4 cho ca thật đợt 134.
- Giới hạn của mô phỏng: `kill -KILL` cắt đúng điểm đã
  chèn, không phải reboot thật (không mô phỏng được mất
  append do mất điện / page cache chưa flush — nhưng cơ chế
  F-134-T6-2 là tiến trình chết giữa hai bước, đúng thứ mô
  phỏng này bao phủ; cửa sổ còn lại rmdir→log_event, §3.2,
  là một lần append duy nhất, ngoài phạm vi mô phỏng này).

### 6.3 Repro message ĐÚNG (`round135-t6/repro-newmsg.log`, 02:46:32Z)

Copy verbatim script của T6-134, chỉ đổi tên TDIR
(`vcut-t6r134-repro` → `vcut-t6r135-repro`) theo bài học
F-132-T6-1; biến môi trường đúng (`VITE_LOCK_DIR` /
`VITE_LOCK_QUEUE_DIR` / `VITE_LOCK_LOG` trỏ /tmp). Script
chạy là bản MỚI `520b8baa`. Cùng 3 thí nghiệm A/B/C như T9
đợt 120 và T6 đợt 121–134, kết quả giống hệt:
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
- **Bằng chứng đang ở /tmp, không phải lock thật:**
  status trong repro hiện `0 ticket + 1 cooldown` (sau A/B)
  rồi `0 ticket + 2 cooldown` (sau C) — trong khi lock thật
  lúc đó có 80 cooldown; log thật vẫn 892 dòng và queue vẫn
  80 file sau khi repro xong; không có file `cooldown-tA/
  tH/tB` nào xuất hiện trong queue thật. **F-132-T6-1 KHÔNG
  lặp lại.**
- Kết luận: **đổi thứ tự không đổi hành vi guard; thông báo
  phân biệt 2 trường hợp còn nguyên; release bình thường
  vẫn ghi đủ cả log RELEASED lẫn file cooldown (§6.2 ca C).**
- **Kết luận sức khỏe: lock KHỎE.** Trống lúc mở và lúc
  đóng, 0 zombie, 0 stale, queue 0 ticket, log nhất quán
  (256/256 cặp + 1 ca reboot-kill cũ đã giải thích, 0 mất
  dấu khác — số chính thức đã loại 6 dòng repro lỗi của
  T6-132), 0 TIMEOUT mới từ đợt 120, STALE-LOCK mới duy
  nhất do reboot giữa lượt (đợt 130), 0 sự kiện "KHÔNG NHẢ"
  trên lock thật đợt 120–134 (toàn đợt) và đợt 135 (tới
  02:49Z), suite 9/9 độc lập ×2 lần chạy (T7 xanh cả hai
  lần), và thứ tự ghi mới đã kiểm chứng bằng mô phỏng cắt
  ngang (§6.2). **Không còn caveat nào về mất dòng RELEASED
  cho các chu kỳ mới** — caveat cũ chỉ còn là 1 dòng lịch
  sử (t4, §3.3).

## 7. ÁP DỤNG luật prune cooldown đã phê duyệt (quyết parent đợt 125 §12(c)) — ĐÃ CHẠY, XÓA 0 FILE (lần thứ 10 liên tiếp)

Luật đã phê duyệt (đợt 125 §7, parent phê duyệt §12(c);
chú thích ngữ nghĩa `find -mtime` đã ghi vào luật ở đợt 130
theo quyết parent đợt 129 §12.3(e)):
(a) xóa file `cooldown-*` có mtime cũ hơn 7 ngày; (b) trần
mềm 100 file — nếu tổng vượt 100 thì xóa file cũ nhất tới
khi còn 100, nhưng không xóa file <48h; (c) không bao giờ
xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số
file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock
đang trống (`status` TRỐNG). Ngữ nghĩa `find -mtime`:
`-mtime +7` chỉ khớp file **≥192h (8 ngày)**,
`-mtime +2` chỉ khớp file **≥72h** — phương pháp `find`
bảo thủ hơn chữ luật tối đa 24h (xóa muộn, không bao giờ
xóa sớm).

- **Trình tự thực hiện:**
  - 02:47Z: lock TRỐNG (`status` 0 ticket + 80 cooldown,
    rc=0) — đủ điều kiện (e). Quét ứng viên mtime >7 ngày
    (`find -mtime +7`): **0 file** (`prune-candidates.txt`
    rỗng). Tổng 80 file ≤ trần mềm 100 nên điều (b) cũng
    không kích hoạt.
  - **Kết quả prune đợt 135: 0 file đã xóa — không có file
    nào đủ điều kiện.** Danh sách file đã xóa: (không có).
    `prune-deleted.txt` chỉ ghi "(prune deleted: none)".
    Vì tập ứng viên rỗng nên không thực thi thao tác xóa
    nào (không có gì để xóa). Đây là kết quả đúng của luật
    — luật đã chạy, không phải luật chưa chạy. File cooldown
    cũ nhất sẽ đủ 7 ngày theo đồng hồ tường vào khoảng
    **21/11 18:38Z**; theo phương pháp `find -mtime +7`
    (≥192h) sẽ khớp ứng viên vào khoảng **22/11 18:38Z**.
    T6 các đợt sau đếm tiếp. Đây là lần thứ 10 liên tiếp
    prune xóa 0 file (đợt 126–135: 0 mỗi đợt).
  - Lưu ý: file `cooldown-t4` mtime 23:53:53Z là **do trap
    release của run-attempt chạy lúc reboot đợt 134 (§3.3),
    KHÔNG phải do prune** (prune không tạo/cập nhật file,
    chỉ xóa). Số file prune = 0.
- **Đối chiếu số lượng (phương pháp chính thức theo đợt
  126/128):** lúc mở (02:40Z) **80 file / 1120 byte**; lúc
  đóng (02:49Z) **80 file / 1120 byte** (80 × 14 = 1120
  khớp cả hai lần; `ls`/`find`/`status` khớp nhau). Số học
  khớp: 80 + 0 = 80 ✓. Không file nào bị xóa hay thêm giữa
  hai lần đếm (T8-round134 và T10-round134 đã ghi
  `cooldown-t8-round134` / `cooldown-t10-round134` từ trước
  lúc T6 mở — giải thích 78 → 80 so với lúc T6-134 đóng 2).
- Phân tầng tuổi lúc 02:47Z (ngữ nghĩa `find -mtime`):
  **>7 ngày (`-mtime +7`, tức ≥192h): 0 file; ≥72h
  (`-mtime +2`): 14 file** (giữ nguyên 14 như đợt 134);
  **≥48h (`-mtime +1`): 32 file** (tăng 5 → 32 so với đợt
  134 — 5 file mtime đêm 15/11–rạng 16/11 vừa vượt 48h
  trong lúc đợt 134 đóng / đợt 135 mở, đúng theo đồng hồ,
  không phải sai số). File cũ nhất `cooldown-r4-round115`,
  mtime 2026-11-14T18:38:25Z — lúc 02:47Z mới **~80h09'
  tuổi**.

## 8. CHỐT SỐ BOOT — chuỗi tương đối CHỐT #57→#90; số tuyệt đối VẪN TẠM; khung chết #89? MỘT bản ghi + một bản hẹp

### 8.1 Mù #37 — KHÔNG ĐỔI, KHÔNG THỬ ĐÓNG LẠI + NGÀY ĐÚNG 15/11 (F-131-T6-1)

- Trạng thái đông cứng từ T6-119 §2.3 (nhắc lại ở T5-120
  §2.6 và T6-129 §8 / T6-130 §8 / T6-131 §8.1 / T6-132
  §8.1 / T6-133 §8.1 / T6-134 §8.1): khoảng **11:39:50Z →
  23:45:17Z ngày 15/11 (12h05'27")**, **A+D đóng, B+C mở**
  (2 cửa sổ mở, tổng ~9h48'14"), **tối đa 29 reboot ẩn**
  (21 đoạn B + 8 đoạn C). Parent đã **chấp nhận để mở**
  (QUYẾT PARENT 7 đợt 119) — T6 KHÔNG thử đóng lại lượt này.
- Không có quan sát mới nào trong cửa sổ B/C: hai cửa sổ mở
  nằm ngày 15/11, đã đóng băng từ đợt 119; mọi quan sát sau
  đó đều nằm ngoài khoảng mù. Trạng thái mù #37 KHÔNG ĐỔI.
- Khoảng mù #37 là 15/11 11:39:50Z → 23:45:17Z, KHÔNG phải
  16/11 — tài liệu này ghi đúng.

### 8.2 Chuỗi boot quan sát được từ mù #37 tới nay (đếm lại toàn bộ — thêm #90?)

Phương pháp: như T6-131 §8.2 / T6-133 §8.2 / T6-134 §8.2
(mỗi boot liệt kê với boot_id + btime lấy từ ≥1 nguồn độc
lập; btime→btime danh nghĩa = khoảng cách giữa hai btime
liên tiếp). Số thứ tự là số tạm theo thứ tự thời gian (tất
cả đều mang "?") — xem verdict §8.5. **Định nghĩa đếm dùng:
định nghĩa gộp của T10 (LIMITS gộp đợt 133 §10.2) — mọi
reboot quanh đợt, cả giữa lượt lẫn ranh giới — theo quyết
F-133-6.** Bảng dưới chỉ ghi 5 boot cuối (chuỗi đầy đủ
#57→#85 xem T6-131 §8.2 + T6-132 §8.2 + T6-133 §8.2 +
T6-134 §8.2 — không chép lại để khỏi drift; T6 đợt này đã
đối chiếu lại với LIMITS gộp đợt 134: các boot #86?→#89?
dưới đây khớp đúng btime/boot_id T10-134 đã chốt, không có
boot_id lạ nào xuất hiện trong bất kỳ bằng chứng 18/11 nào
ngoài chuỗi này).

| # (tạm) | boot_id (8 ký tự đầu) | btime (UTC) | Tuổi thọ danh nghĩa (btime→btime) | Nguồn |
|---|---|---|---|---|
| #86 | 52ca5d6d | ~00:12:55Z 18/11 | ~19m38s (1.178 s, #85→#86 — SPAN) | T10-134 (LIMITS gộp §đầu) |
| #87 | 1d2e984d | 00:13:50Z 18/11 | <1 phút (boot ngắn nhất — SPAN) | T10-134 |
| #88 | cc1f9de0 | 00:17:36Z 18/11 | ~3m46s (226 s, #87→#88 — SPAN) | T10-134/T5-134/T8-134 |
| #89 | 8ae55060 | 01:31:18Z 18/11 | 1h13m42s (4.422 s, #88→#89 — SPAN); đang sống tới 02:27:27Z | T10-134 (boot lúc đóng đợt 134) |
| #90 | 78b55838 | 02:27:27Z 18/11 | 56m09s (3.369 s, #89→#90 — SPAN, xem §8.3); đang sống | T6 này (brief + uptime/journal//proc/1) |

- **Chuỗi sự kiện reboot theo định nghĩa gộp (§10.2 đợt
  133): #89?→#90? là sự kiện thứ 14** (ranh giới, sau khi
  đợt 134 đóng 02:02Z, trước khi đợt 135 mở 02:35Z — cùng
  loại với sự kiện #8 #83?→#84? đầu đợt 134). Các sự kiện
  trong đợt 134 là #9–#13 (T10-134 §đầu). Không đợt nào từ
  129 tới nay thiếu reboot.
- **F-135-T6-1 — KHÔNG CÓ sai số đếm mới:** nhãn "sự kiện
  gộp #14" cho reboot này khớp định nghĩa gộp (sau #13 của
  đợt 134); T6 không thấy nhãn lệch nào của luồng khác
  trong đợt 135 tới lúc đóng (T5-135 chưa có file đếm lúc
  T6 đóng — T10 đối chiếu khi đóng sổ). F-134-T6-1 (T5 lệch
  1) đã được T10-134 ghi nhận ở LIMITS gộp, không lặp lại
  ở đây.
- Khung chết (quan sát cuối → btime boot sau), nơi có dữ
  liệu:
  - #77–#85: như T6-133 §8.2 + T6-134 §8.2–§8.4 (không chép
    lại).
  - #86–#88: thuộc phiên đóng sổ đợt 134 (T10-134) — T6
    đợt này không đo lại khung chết của chúng (không có dữ
    liệu mới; btime/boot_id đã chốt ở LIMITS gộp đợt 134).
  - #89: MỘT khung + một bản hẹp (xem §8.3).

### 8.3 Khung chết #89? (8ae55060) — MỘT bản ghi + một bản hẹp (không mâu thuẫn)

- **Khung chết #89?: (02:15:29Z, 02:27:27Z] (11m58s) — MỘT
  bản ghi chính, CÓ thể quy trách nhiệm.** Quan sát cuối là
  mtime file `docs/PHASE9_ROUND134_LIMITS.md` 02:15:29Z
  (T10-134 viết LIMITS gộp lúc đóng, quy trách nhiệm được).
  Quét `find -newermt` trên toàn `hidden_files/` + `docs/` +
  `repo-1` (trừ node_modules) + `/tmp` cho khoảng (02:02:00Z,
  02:27:27Z] chỉ trả thêm các mốc ≤02:15:29Z
  (`round134-t10.done` 02:05:00Z;
  `PHASE9_GAP_ANALYSIS.md` 02:04:40Z; closing-copy
  02:03:23Z + .sha256 02:03:15Z) — không có quan sát nào
  khác trong khoảng chết theo mtime. Tuổi thọ #89? theo
  khung này: **1h44'11"–1h56'09"** (btime 01:31:18Z →
  quan sát cuối 02:15:29Z = 44'11"; danh nghĩa 56'09").
  /tmp trống trong cửa sổ.
- **Bản hẹp hơn: (02:16:54Z, 02:27:27Z] (10m33s), KHÔNG quy
  trách nhiệm được** — mtime file session jsonl
  `~/agents/agent-e033d2dd-…/sessions/….jsonl` 02:16:54Z
  (runtime ghi session, không gắn được với luồng cụ thể).
  Theo tiền lệ khung #82? (T6-133 §8.4 / T6-134 §8.3),
  ghi cả hai bản ghi và **khung hẹp nhất làm chuẩn** — hai
  bản ghi này KHÔNG mâu thuẫn nhau (chỉ khác độ quy trách
  nhiệm), khác hẳn trường hợp #84? đợt 134 (khung rỗng do
  dị thường đồng hồ) nên tiền lệ "khung hẹp nhất làm
  chuẩn" áp được ở đây.
- **Gap #89?→#90? danh nghĩa (btime→btime) = 56'09"
  (3.369 s) — SPAN** (chưa chứng nhận; T2-135 kiểm mù
  #54). Không có dải cơ học công bố trước cho #90?; T2-135
  tính dải cho #91?.
- **Không có dị thường đồng hồ mới ở ranh giới này:**
  btime mới 02:27:27Z (uptime -s) khớp /proc/1 02:27:38Z
  (+11 s, cùng mẫu các boot trước) và journal first entry
  02:27:38Z; không có heartbeat/log nội dung nào vượt qua
  btime boot mới (khác §8.4(b) đợt 134). Các quan sát cuối
  trên boot cũ đều ≤02:16:54Z < btime mới — khung chết
  không rỗng, không đảo ngược.

### 8.4 Reboot #89?→#90? — không mất việc của luồng nào; T6 không bị cắt

- Reboot 8ae55060 → 78b55838 (btime 02:27:27Z) xảy ra sau
  khi đợt 134 đóng (02:02Z) và trước khi đợt 135 mở
  (02:35Z) — **không giết attempt hay holder lock nào**
  (lock đã trống từ 01:59:31Z, §2; đợt 134 đã đóng sổ).
- **Không luồng đợt 135 nào mất việc:** T6 mở 02:40Z và
  đóng 02:49Z toàn bộ trên boot mới, không bị reboot cắt
  (uptime liền mạch 13' → 22'); các cờ `.done` đợt 135
  (T9.done 02:46Z) xuất hiện trên boot mới.
- **Replay apt sau boot #90?: THUỘC T5** — T6 không kiểm
  `dpkg.log` (không thuộc nhiệm vụ brief). T5-135 là chủ
  quản verdict replay / cờ POSTBOOT_PASS boot mới.

### 8.5 VERDICT: chuỗi tương đối CHỐT #57→#90 — số tuyệt đối VẪN TẠM (giữ "?")

- **CHỐT ĐƯỢC — chuỗi tương đối:** 30 boot quan sát được
  từ #57 (23:33:34Z 15/11) tới #90 (02:27:27Z 18/11) xếp
  đúng thứ tự thời gian, mỗi boot có boot_id + btime riêng
  biệt, không có boot_id lạ nào trong bất kỳ bằng chứng
  nào ở khoảng giữa; các bước chuyển #74→#75→#76→#77→#78
  →#79→#80→#81→#82→#83→#84→#85→#86→#87→#88→#89→#90 đều
  có ≥2 nguồn độc lập xác nhận (T5 + T2 + T6 + T9 + T10 +
  file mtime + T4/T8).
- **KHÔNG CHỐT ĐƯỢC — số tuyệt đối: mọi số "#NN?" giữ
  nguyên dấu "?", KHÔNG bỏ dấu "?".** Bốn lý do độc lập
  từ T6-133 §8.5 vẫn đứng nguyên, bất kỳ lý do nào cũng đủ
  để giữ "?":
  - (a) **Mù #37: tối đa 29 reboot ẩn** (15/11, B+C mở).
  - (b) **Mù #49 đoạn B MỞ, tối đa 1 ẩn** (không kiểm lại
    thường lệ theo quyết parent).
  - (c) **Mù #51 đoạn B MỞ, tối đa 3 ẩn** (recheck3 không
    đổi — T2-135 kiểm tiếp nếu có bằng chứng mới).
  - (d) **Mù #52 đóng hoàn toàn KHÔNG gỡ được (a)/(b)/(c)**
    (chỉ khóa một bước chuyển sau tất cả các mù đang mở).
  - Thêm: **dị thường đồng hồ ở ranh giới #84?→#85?
    (T6-134 §8.4(b))** cho thấy ngay cả btime cũng có thể
    lệch ~35 s giữa hai boot — số tuyệt đối càng không thể
    chốt từ trong VM. (Ranh giới #89?→#90? lần này KHÔNG
    có dị thường — §8.3 — nhưng một lần sạch không xóa
    tiền lệ.)
- **Kết luận cho parent:** T6-135 đã đếm lại toàn bộ chuỗi
  và **chốt ở mức tối đa mà bằng chứng cho phép**: chuỗi
  tương đối + btime + boot_id + khung chết (bảng §8.2) là
  CHẮC, nay dài thêm 1 boot (#90? ranh giới); số thứ tự
  tuyệt đối **vẫn TẠM** và phải giữ "?" cho tới khi có bằng
  chứng ngoài VM. Không bịa số, không bỏ "?" khi chưa đủ
  bằng chứng — đúng như brief giao.
- Hệ quả thực hành: T9-135 gọi boot lúc mở là "#90?" trong
  LIMITS của mình là đúng quy ước tạm; nhãn "reboot giữa
  lượt lần thứ N" dùng định nghĩa gộp §10.2 đợt 133 (sự
  kiện #14 cho reboot này — là sự kiện RANH GIỚI, không
  phải giữa lượt). Các quyết parent trước vẫn đứng: không
  quyết con số tuyệt đối nào ở đây.

## 9. Đối chiếu started_at (phối hợp T7 — T6 KHÔNG kết luận nguyên nhân)

- Mốc của T6: bắt đầu **02:40:39Z** (boot #90? đã 13'12"
  tuổi); đóng **02:49:02Z** (boot #90? đã ~21'35" tuổi).
  Đợt 135 mở **02:35Z** (round-in-progress.md) — tức
  **453 s sau btime boot #90? (02:27:27Z)**.
- Dị thường các đợt trước (T7-133 §7): started_at lượt
  vcut ghi sau thời điểm đã thấy running — lần thứ 3 liên
  tiếp, +7.135 s (chuỗi đợt 130 +5.251 s → đợt 131 +1.585
  s → đợt 132 +7.135 s); giả thuyết "scheduler ghi lại
  started_at khi hồi phục sau reboot" ĐÃ ĐƯỢC XÁC NHẬN đợt
  134 (lần thứ 5 liên tiếp, +6.967 s, = btime + 40 s).
- **T6 đợt này chỉ ghi mốc, không kết luận:** T7-135 là chủ
  quản kiểm slot/started_at. Ghi nhận để T7/T10 đối chiếu:
  đợt 135 mở 453 s sau btime #90? — nếu dị thường tái diễn
  thì so với mẫu đợt 134 (started_at = btime + 40 s) sẽ
  thấy started_at lượt này rơi vào khoảng 02:28:07Z, tức
  TRƯỚC khi đợt mở 02:35Z — khác mẫu đợt 132 (started_at
  chỉ 31 s sau btime nhưng lượt đã chạy từ trước); nguyên
  nhân vẫn thuộc T7.

## 10. Dọn Xvfb: 0 Xvfb, 0 socket sót — /tmp/.X11-unix/ trống lúc mở và lúc đóng

- **Lúc mở (02:40Z) và lúc đóng (02:49Z):
  `/tmp/.X11-unix/` TRỐNG**, 0 Xvfb đang chạy (`pgrep -x
  Xvfb` rc=1 cả hai lần; quét `/proc/*/cmdline` không có
  process nào tên Xvfb). Không có Xvfb sót nào từ đợt 134
  (reboot đã xóa tmpfs; T4/T8-135 chưa chạy harness WebKit
  tới lúc T6 đóng — không có process vite/webkit sót).
- **Không kill process nào** trong phiên này (không có Xvfb
  sót để kill; T6 không đụng process luồng khác theo nhiệm
  vụ).
- **RAM khả dụng:** T6 không đo RAM (thuộc T9-135; T9.done
  đã có lúc 02:46Z — T6 không đọc nội dung cờ này).

## 11. Tuân thủ lock của luồng đo đợt 135 ĐÃ kiểm được

- **T4-135 / T8-135 chưa acquire** tới lúc T6 đóng (§2) —
  chưa có gì để kiểm tuân thủ. Khi họ acquire, họ sẽ dùng
  bản script MỚI `520b8baa` (đóng băng sau lúc T6 sửa —
  xem §3.2); T6 đợt 136 kiểm tuân thủ + đếm chu kỳ mới
  (lúc đó các chu kỳ sẽ chạy trên thứ tự ghi mới — lần đầu
  tiên log RELEASED được ghi trước cooldown trên lock
  thật).
- **Tuân thủ Xvfb luật đứng của đợt 135: CHƯA CÓ bằng chứng
  mới** (T4/T8-135 chưa chạy harness tới lúc T6 đóng —
  §10).

## 12. Hạn chế trung thực + nợ mở

- **Số hiệu boot mới (#90?) VẪN TẠM (xem §8.5):** chuỗi
  tương đối #57→#90 đã chốt (30 boot); số tuyệt đối giữ
  "?" vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa
  6, mù #29/#30/#31 +4 — T5-120: "#60" tạm có thể tới
  #123); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51
  đoạn B mở, tối đa 3 ẩn; (d) mù #52 đóng hoàn toàn nhưng
  không làm neo được; (e) dị thường đồng hồ #84?→#85?
  (§8.4(b) đợt 134). Journal/wtmp chỉ giữ boot hiện tại
  (journal `--list-boots` chỉ 1 dòng 78b55838; wtmp bắt
  đầu 02:27:xxZ) nên T6 suy ra số hiệu từ thứ tự thời gian
  + hồ sơ các đợt trước, không phải từ log hệ thống.
- **F-135-T6-1 — KHÔNG CÓ sai số mới từ đợt 135.** Không
  lặp lại F-132-T6-1 (repro + cut-sim chạy đúng /tmp, §6);
  không có double-acquire / TIMEOUT / STALE-LOCK mới;
  không có event lock nào mất dấu hay thêm lạ (đếm mở =
  đếm đóng = 886, §4); khung chết #89? ghi cả hai bản ghi
  nhưng KHÔNG mâu thuẫn nhau — ghi rõ lý do chọn khung hẹp
  nhất làm chuẩn theo tiền lệ #82?, không tự chọn chuẩn
  trái với bằng chứng.
- **Ghi chú quy trình (không phải sai số, không đánh số
  F):** lần chạy đầu của `cut-sim.sh` lỗi `set -u`
  (unbound variable: `local dir=… inj="$dir/…"` trên cùng
  một lệnh `local`) — lỗi trong driver kiểm thử của chính
  T6, sửa bằng cách tách thành 2 lệnh `local` TRƯỚC khi
  bất kỳ ca mô phỏng nào chạy; không có dữ liệu hay claim
  nào bị ảnh hưởng (mọi số liệu §6.2 đều từ lần chạy sau
  khi sửa).
- **F-134-T6-2 (cũ, ĐÃ SỬA trong đợt này):** ca mất dòng
  RELEASED do reboot — thứ tự mới §3 + kiểm chứng §6.2
  sửa đúng lỗi cho các chu kỳ mới; ca lịch sử t4 giữ
  nguyên trong log (§3.3). Không còn caveat mất dòng cho
  chu kỳ mới.
- **F-134-T6-1 (cũ, đã ghi nhận):** T5 đợt 134 lệch nhãn
  đếm 1 so với định nghĩa gộp — T10-134 đã ghi nhận ở
  LIMITS gộp; đợt 135 chưa thấy nhãn lệch mới (§8.2).
- **F-133-T6: KHÔNG CÓ sai số mới từ đợt 133.** Không lặp
  lại F-132-T6-1; không có double-acquire / TIMEOUT /
  STALE-LOCK mới.
- **Mù #37 KHÔNG ĐỔI** (A+D đóng, B+C mở, tối đa 29 ẩn;
  parent đã chấp nhận để mở) — không thử đóng lại; ngày
  đúng là **15/11** (F-131-T6-1, nhắc lại ở §8.1). Mù #49
  đoạn B mở + mù #51 đoạn B mở + mù #53 B mở + mù #54 mới
  thuộc T2-135; mù #52 đã đóng hoàn toàn (T2-133).
- **F-131-T6-2 (cũ, nhắc lại):** T10-130 ghi
  "+cooldown-t8b-round130" nhưng file thật là
  `cooldown-t8-round130`; số đếm không đổi.
- **T7 vẫn flaky về bản chất** (T9 đợt 119 §1.2): đợt này
  xanh cả hai lần chạy (9/9, 9/9) — lần xanh kép thứ mười
  một liên tiếp không xóa tính flaky. Quyết tách T7 khỏi
  gate 9/9 khi đợt đông vẫn thuộc về parent; T6 không tự
  đổi test.
- **v1 frozen `vcut-vite-lock.sh:191` vẫn in câu cũ** —
  `vite-lock: KHÔNG NHẢ — owner hiện tại là '...', không
  phải '...'` (T6 đợt 126 đã kiểm dòng 191; đợt này T6
  không đọc lại dòng 191 — md5 v1 khớp baseline
  `fd21193c` nên nội dung frozen không đổi theo định nghĩa).
  T6 đợt 120 đã ghi nợ; đang đóng băng, cần parent quyết
  "mở băng" nếu muốn đồng bộ message. Chỉ ghi nhận, không
  tự mở băng.
- **`queue` in rỗng khi không có ticket:** cosmetic (xem §2);
  không phải bug, không sửa trong đợt này.
- **Số đếm "KHÔNG NHẢ" bao phủ `round133-t*/` (toàn đợt) +
  `round134-t*/` (toàn đợt) + `round135-t*/` tới 02:49Z,
  không quét toàn cây hidden_files** (lý do như T9 đợt 120
  §8). T4/T8/T10-135 chưa chạy xong tới thời điểm đếm; T6
  đợt 136 đếm tiếp.
- **Prune cooldown lần 10 áp dụng: xóa 0 file** (không
  file nào >7 ngày; tổng 80 ≤ trần 100 lúc chạy). File cũ
  nhất đủ 7 ngày theo đồng hồ tường ~21/11 18:38Z, theo
  `find` ~22/11 18:38Z — T6 các đợt sau đếm tiếp.
- **Đợt 134 khép sạch trên lock (§4):** 5 chu kỳ sau T6-134
  đóng 2 (T8 ×4 + T10 O8) đều sạch — T6 mở đợt 135 đếm
  lại khớp đúng recount T10-134; **đợt 135 tới 02:49Z có
  0 chu kỳ** (chưa luồng nào acquire). Không phải bug lock.
- **Kiểm vite.lock.queue + lock trống LÚC ĐÓNG đợt:** T6 kiểm
  lần cuối 02:49Z (trống, 0 ticket + 80 cooldown); đợt
  còn chạy tới ~05:00Z, **T10 đóng đợt sẽ recount lại lúc
  đóng** (như đợt 124–134 T10 đã đếm lúc đóng). T6 không
  chờ tới lúc đóng.
- **Cửa sổ còn lại sau đổi thứ tự (§3.2):** rmdir →
  log_event là một lần append duy nhất — cắt đúng trong
  lúc append vẫn có thể mất dòng RELEASED về mặt lý thuyết;
  xóa hẳn cần journal/ghi hai pha, vượt phạm vi quyết
  parent đợt 134 §12.3(b). Ghi nhận trung thực, không
  claim "không bao giờ mất dòng nữa".
- **Replay apt #90? chưa có verdict** (thuộc T5-135 — xem
  §8.4).
- **Log nội bộ của suite T6 không giữ được:** suite tự dọn
  TDIR `/tmp/vcut-lock-v2-test.*/` khi kết thúc (trap) nên
  file `vite-lock-v2.log` nội bộ không còn để copy; bằng
  chứng suite là stdout đầy đủ trong `test-v2-t6-run1.log`
  và `test-v2-t6-run2.log` (9/9 rồi 9/9). Thư mục repro
  /tmp của T6 đã dọn sạch sau khi xong (bản fixed in "TDIR
  cleaned"). Thư mục cut-sim /tmp (`/tmp/vcut-t6r135-cut-*`)
  vẫn còn trên đĩa lúc T6 đóng (chứa log 3 ca + bản script
  đã chèn kill — chỉ dùng cho kiểm chứng, không phải lock
  thật); T6 đợt sau có thể xóa.
- T6 không sửa production; không chạy tsc/vite build (chỉ
  sửa script lock + spec + LIMITS này — script lock đã
  kiểm bằng `bash -n` + suite 9/9 ×2 + cut-sim + repro;
  không có code production nào đổi nên không có gì để
  build lại).

## 13. File đổi + stage

| File | Đổi gì |
|---|---|
| `apps/web/scripts/vcut-vite-lock-v2.sh` | Đổi thứ tự `cmd_release`: log RELEASED TRƯỚC, ghi file cooldown SAU (md5 `cd0c05c1` → `520b8baa`); thêm khối comment header ghi quyết + thứ tự cũ/mới |
| `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` | Thêm §3.1: thứ tự mới + lý do + vì sao không chọn fsync + cách xử lý ca t4 cũ |
| `docs/PHASE9_ROUND135_T6_LOCKHEALTH_LIMITS.md` | Mới (tài liệu này) |

Không đổi: production code, script lock v1 frozen
(`fd21193c`), suite test (`1c0d7eaa`), log lock thật (chỉ
đọc + đếm; 6 dòng repro lỗi T6-132 vẫn nằm trong log thô
như mọi đợt — số chính thức loại chúng), file cooldown
(prune đã chạy, xóa 0 file; `cooldown-t4` mtime 23:53:53Z
không đổi — xem §3.3), Xvfb (0 process; 0 socket sót).
Stage: `repo-1-push/paths-loop/phase9-round135-t6-lockhealth.txt`
(NUL-delimited, 3 file trên; verify bằng read-back).
Dữ liệu thô: `hidden_files/round135-t6/` (status-open.txt,
status-close.txt, ps-full-open.txt, ps-full-close.txt,
ss-open.txt, ss-close.txt, analyze-log-cleaned-open.txt,
vite-lock-v2-cleaned-886.log, analyze-log-cleaned-close.txt,
vite-lock-v2-cleaned-886-close.log, cooldown-now.txt,
prune-candidates.txt, prune-deleted.txt, khong-nha-grep.txt,
test-v2-t6-run1.log, test-v2-t6-run2.log, repro-newmsg-fixed.sh,
repro-newmsg.log, cut-sim.sh, cut-sim.log, cut-sim-old.log,
cut-sim-new.log, cut-sim-new-normal.log).
