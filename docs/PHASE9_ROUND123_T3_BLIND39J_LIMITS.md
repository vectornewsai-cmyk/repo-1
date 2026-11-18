# PHASE9 ROUND123 T3 — Mù #39 đoạn J: ĐIỀU TRA SÂU (lần 3) — VẪN MỞ, HẾT GÓC MỚI TRÊN VM

> Luồng T3, đợt 123 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 16/11/2026; làm việc ~14:43Z → ~14:55Z 16/11/2026).
> Nhiệm vụ: điều tra sâu mù #39 J — tìm bằng chứng MỚI để ĐÓNG hẳn,
> hoặc chứng minh vì sao chưa đóng được với bằng chứng mới cụ thể.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39, KHÔNG sửa production code (không tìm ra bug thật).
> **KHÔNG thử lại mù #38 G.** Chỉ điều tra, không đụng code sản phẩm.

## 0. Kết quả headline

- **Mù #39 đoạn J: VẪN MỞ — lần kiểm tra sâu thứ ba liên tiếp (T4-121,
  T7-122, T3-123) đều cho 0 bằng chứng mới.** Đợt này thử **10 góc
  chưa từng thử** (xem §1): mtime tươi phạm vi rộng hơn, **birth time,
  atime, ctime, directory-mtime, .git, system log, lịch sử chạy cron
  của scheduler, đối chiếu mù đã đóng** — tất cả đều 0 trong đuôi J.
- **Quét v2 (đã sửa lỗi script v1, xem §4 mục 6): 605.910 file** —
  mtime trong đuôi J: **0**; atime trong đuôi: **0**; ctime trong
  đuôi: **0**; birth trong đuôi: **0**; thư mục có mtime trong đuôi:
  **0**; session chạm đuôi: **0/264** (T7 đếm 218, nay 264); session
  bắc qua cắt J-hi (08:06:40Z): **0**.
- **Lịch sử chạy cron của scheduler (nguồn MỚI, chưa luồng nào kiểm):**
  có 2 lượt chạy rơi vào đuôi J — feed-pulse-14 lúc **07:41:54Z** và
  heartbeat lúc **08:20:50Z** — nhưng cả hai đều là **skip phía
  scheduler, không để lại dấu vết nào trên VM** (chứng minh bằng
  control: feed-pulse-15 lúc 08:41:54Z cũng không để lại session nào;
  session duy nhất sinh phút đó là waiter T10 đợt 121). **Không dùng
  được để đóng J.** Hai lượt chạy bị thiếu trong đuôi (heartbeat
  14:50:50+07, deterministic-doctor 15:00+07) cũng **không dùng được
  làm bằng chứng reboot ẩn** — cùng mẫu thiếu lượt xảy ra trên boot
  khỏe đã biết (09:50:50+07 trong boot #59, 17:50:50+07 trong boot
  #63). Xem §2.5.
- **repo-1 KHÔNG có .git** — khảo cổ git (log/reflog/fsck) là không
  thể, không phải chưa thử. **System log của boot #61 đã mất hoàn
  toàn** (journal/wtmp/dpkg chỉ còn boot hiện tại) — cùng lý do
  reboot #16 không chốt được giờ.
- **Đối chiếu mù đã đóng (§2.6):** #34 B đóng nhờ poller cadence
  300 s sống xuyên đoạn + session bắc qua cắt + số học sàn; #34 C /
  #40 C đóng nhờ đo uptime trực tiếp tại probe. Đoạn J thiếu đúng
  thành phần đó — **không có observer sống nào trong đuôi** — và đợt
  này chứng minh không còn kênh timestamp nào trên VM chưa quét mà
  observer đó có thể để lại dấu.
- **Kết luận + khuyến nghị (xem §5 mục 1): ĐỂ MỞ như mù #35/#37,
  KHÔNG giao kiểm lại J từ trong VM nữa** — 3 lần điều tra sâu với
  phạm vi mở rộng dần đều cho 0; con đường duy nhất còn lại là bằng
  chứng NGOÀI VM do parent cung cấp (ví dụ output `uptime -s` của
  chính parent trong phiên main-chat ~07:3x–08:2xZ 16/11).
- **Boot mới trong lúc làm việc:** uptime-s **14:24:43Z**, boot_id
  **9bbda390-…** (sau #65 12:53:25Z) lúc mở đầu; **ĐÍNH CHÍNH —
  reboot nữa xảy ra trong lúc T3 kết thúc: uptime-s 14:52:19Z,
  boot_id 94e29be5-…, phát hiện lúc verify stage 14:54:32Z**
  (lần kiểm 14:52:08Z vẫn là boot 9bbda390). Chỉ ghi nhận, KHÔNG tự
  đánh số thứ tự (việc của luồng EPERM/T5 đợt sau). File LIMITS này
  + batch stage đã verify read-back NGUYÊN VẸN SAU reboot đó.
- Clock VM hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` 3 server
  khớp `date -u` trong 1–3 s) → **F_now ≈ 0**.

## 1. Định nghĩa lại mục tiêu + phương pháp (góc mới so với T4/T7)

Mù #39: 05:44:31Z → 08:40:45Z 16/11 (probe #39 → probe #40), 2h56'14".
Đoạn J: 06:50:58Z (#61, boot 80a940d7) → 08:25:47Z (#62, boot 9788ce28),
1h34'49" = 5.689 s. Đuôi mở: **(07:37:47Z, 08:25:47Z] = 2.880 s
(48'00")**, tối đa 2 reboot ẩn danh nghĩa (⌊2.880/1.147⌋ = 2, sàn
19'07" = 1.147 s). Cắt J-lo 07:10:05Z, J-hi 08:06:40Z.

T4-121 đã làm (mtime 2 cây + ngoài cây + /tmp + session) và T7-122 đã
làm lại (quét tươi đuôi, 0 file / 0 session; 3 file nhắc 80a940d7 sau
09:05Z đều hồi tưởng/code). Cả hai đều chỉ dùng **mtime**.
Đợt này thiết kế 10 góc CHƯA TỪNG THỬ — mỗi góc nhắm một kênh dấu vết
mà quét mtime không thấy được:

| # | Góc mới | Vì sao mtime-only bỏ sót | Script |
|---|---|---|---|
| A | mtime tươi, phạm vi RỘNG HƠN (thêm `~/memory`, `goals/` ngoài hidden_files, `workspace/user`, `repo-1-push`, `agents/`, dotfile `$HOME`) | T4 chỉ quét 2 cây + ngoài-cây-trừ-goals + /tmp; `~/memory` nằm ngoài `~/workspace` nên chưa từng được quét | blind39J-t3v2.py |
| B | **birth time** (`stat %W`) trong đuôi | File TẠO trong đuôi rồi sửa SAU đuôi có mtime sau đuôi → vô hình với mọi lần quét mtime | blind39J-t3v2.py |
| C | **atime** trong đuôi | File ĐỌC trong đuôi (không ghi) không đổi mtime | blind39J-t3v2.py |
| D | **ctime** trong đuôi | chmod/rename/link/unlink đổi ctime, không đổi mtime | blind39J-t3v2.py |
| E | **directory mtime** trong đuôi | File tạo rồi XÓA trong đuôi không còn file để quét, nhưng thư mục cha vẫn giữ mtime | blind39J-t3v2.py |
| F | `repo-1/.git` | T4 skip `.git` trong mọi lần quét — chưa ai kiểm nó có tồn tại không | shell |
| G | session tươi (264 file, tăng từ 218) + session BORN trong đuôi | T7 đếm 218; thêm session mới + kiểm birth | blind39J-t3v2.py |
| H | content grep sau 11:52Z (khi T7 xong) cho 80a940d7 | T7 chỉ grep tới 11:52Z; đợt 122 đóng + đợt 123 mở có thể để lại đọc tươi mới | blind39J-t3v2.py |
| I | system log boot #61 (journal archive, wtmp.1, dpkg/apt xoay vòng) | Chưa luồng nào kiểm kho lưu trữ log hệ thống cho boot #61 | shell |
| J | lịch sử chạy cron scheduler + đối chiếu cơ chế đóng của mù #32/#33/#34/#40 A/C | Chưa luồng nào dùng `cron.runs` làm nguồn chứng cứ; chưa đối chiếu mẫu đóng | cron tools + đọc LIMITS cũ |

Không viết prereg riêng (brief T3 không yêu cầu; thiết kế quét suy ra
trực tiếp từ brief + lịch sử T4/T7 đã đọc trước khi đo).

## 2. Kết quả điều tra

### 2.1 Quét v2 — 605.910 file, 5 kênh timestamp đều 0 trong đuôi

Chạy `blind39J-t3v2.py` (đã sửa lỗi v1, xem §4 mục 6), một pass duy
nhất mỗi cây cho mtime/atime/ctime + một pass `stat` riêng cho birth
(`find %B` trả -1 trên FS này — đã verify, xem §4 mục 5):

| Kênh | Tổng quét | Trong đoạn J | **Trong đuôi J** | Ghi chú |
|---|---|---|---|---|
| A. mtime | 605.910 | 147 | **0** | Mọi phạm vi §1-A, gồm `~/memory` (39 file), goals-rest, user, repo-1-push, agents |
| B. birth (`stat %W`) | 605.912 | 138 | **0** | Không file nào ĐƯỢC TẠO trong đuôi, kể cả file sửa sau đó |
| C. atime | 605.910 | 138 | **0** | Xem caveat relatime §4 mục 4 — kênh hỗ trợ, không đứng một mình |
| D. ctime | 605.910 | 147 | **0** | Không chmod/rename/link/unlink nào trong đuôi |
| E. directory mtime | (mọi thư mục 3 cây) | — | **0** | Không file nào tạo-rồi-xóa trong đuôi |
| G. session exec-log | 264 file | 10 born trong J | **0** chạm đuôi; **0** bắc qua J-hi; **0** born trong đuôi | Tăng từ 218 (T7) lên 264 — vẫn 0 |

Chi tiết theo cây (mtime ≤ J1, kiểm chéo mốc cuối của T4):
- repo-1: max mtime ≤ J1 = **07:37:34Z** (T4 ghi mốc cuối chung
  07:37:47Z là của `build-loop-log.md` thuộc hidden_files, không phải
  repo-1); 5 mốc cuối trong J sau 07:30Z: 07:30:00Z, 07:37:34Z.
- hidden_files: max mtime ≤ J1 (tính theo mtime HIỆN TẠI) =
  **07:33:53Z** — thấp hơn 07:37:47Z của T4 vì `build-loop-log.md` đã
  được ghi thêm nhiều lần sau đó (mtime hiện tại 14:45:35Z); mốc
  07:37:47Z vẫn được bảo toàn trong file đông lạnh của T4
  (`round121-t4/blind39-hidden_files.txt` dòng 386:
  `2026-11-16T07:37:47 .../build-loop-log.md`). **Định nghĩa đuôi J
  không đổi** — đây chỉ là lưu ý đọc số, không phải đính chính.
- /tmp: chỉ còn **1 file** toàn bộ (`t5-check122.sh`, sau J) —
  /tmp dọn theo boot, nhất quán các đợt trước.
- 10 session born trong J (06:53:22Z → 07:17:54Z, đều là luồng đợt
  120; mtime cuối 07:27:44Z) — không session nào sống tới đuôi.

### 2.2 H — content grep sau 11:52Z: 6 file nhắc 80a940d7, 0 đọc tươi

| File (mtime) | Số lần | Phân loại |
|---|---|---|
| docs/PHASE9_ROUND122_T7_EPERM_LIMITS.md (11:52:31Z) | 2× | LIMITS của chính T7-122 (trích dẫn hồi tưởng boot #61 trong bảng §2.6) |
| docs/PHASE9_ROUND122_LIMITS.md (14:15:45Z) | 1× | LIMITS đóng đợt 122 (trích dẫn hồi tưởng) |
| hidden_files/round123-t7/blind40-sessions.py (14:42:42Z) | 5× | Script của sibling T7 đợt 123 (chuỗi trong code/docstring, mẫu như script T7-122) |
| hidden_files/round123-t3/blind39J-t3.py (14:44:25Z) | 7× | Script v1 của CHÍNH T3 (chuỗi trong code) |
| hidden_files/build-loop-log.md (14:45:35Z) | 5× | Mục log đóng đợt 122 + mở đợt 123 (trích dẫn hồi tưởng) |
| hidden_files/round123-t3/blind39J-t3v2.py (14:49:00Z) | 5× | Script v2 của CHÍNH T3 (chuỗi trong code) |

**0 lần đọc tươi boot #61 trong đuôi.** Mẫu này giống hệt T7-122
(3 file) — số file tăng chỉ vì đợt 122 đóng + đợt 123 mở ghi thêm
trích dẫn, không phải bằng chứng mới.

### 2.3 F — repo-1 KHÔNG có .git (khảo cổ git là không thể)

`ls ~/workspace/repo-1/.git` → không tồn tại; `git log` → "fatal:
not a git repository". Không có commit/reflog/fsck/stash để đối
chiếu cửa sổ đuôi. Đây là giới hạn kiến trúc (push đi qua API
push-files, không qua git local) — đã được T6-121 ghi nhận ("repo
local không có .git nên HEAD a8f26d48 không verify tại chỗ").
**Góc khảo cổ git đóng lại vĩnh viễn: không phải chưa thử, mà là
không có gì để thử.**

### 2.4 I — system log boot #61 đã mất hoàn toàn

- `/var/log/`: chỉ còn `dpkg.log` (2 dòng, 14:35:39Z — boot hiện
  tại, mẫu driver-mở-đợt như #64), `btmp`/`wtmp`/`lastlog` 0–384
  byte (chỉ boot hiện tại), `README.logs`; **không có** syslog,
  kern.log, messages, auth.log, `/var/log/apt/`.
- `journalctl --list-boots`: chỉ **1 boot** (9bbda390, first entry
  14:24:54Z); `last -x reboot`: chỉ 1 dòng (14:24, still running).
- Không có file xoay vòng (`*.gz`, `wtmp.1`, `dpkg.log.*`) cho boot
  #61. Journal là volatile, reset mỗi reboot — cùng lý do reboot
  #16 không chốt được giờ từng giây (kẹp ~4' từ 2026-11-11).
- **Kết luận: không còn nguồn log hệ thống nào cho boot #61.**

### 2.5 J1 — Lịch sử chạy cron của scheduler: nguồn MỚI, kết quả ÂM TÍNH 2 chiều

Danh sách job (`cron.list`): chỉ 4 loại có thể rơi vào đuôi J
(07:37:47Z–08:25:47Z = 14:37:47–15:25:47 +07): `vcut-build-loop`
(3h: 12:35/15:35+07 — KHÔNG rơi vào đuôi), `feed-pulse-*` (hàng
giờ), `heartbeat` (30 phút), `deterministic-doctor` (hàng giờ).

**Lượt chạy rơi VÀO đuôi J (theo `cron.runs`):**

| Job | Lượt trong đuôi | Kết quả ghi nhận | Dấu vết trên VM? |
|---|---|---|---|
| feed-pulse-14 | 14:41:54+07 = **07:41:54Z**, succeeded, started==finished==scheduled, `tier_offslot: 1 ... slot unconsumed` | **0** — không session, không file (quét §2.1) |
| heartbeat | 15:20:50+07 = **08:20:50Z**, succeeded, started 08:20:37Z, `Skipped heartbeat ... no heartbeat inference was started` | **0** — không session, không file |

**Vì sao 2 lượt này KHÔNG đóng được J — chứng minh bằng control:**
- Feed-pulse-15 lúc 08:41:54Z (sau J, trên boot #62 — máy chắc chắn
  đang chạy, đợt 121 đang mở) cũng **không để lại session exec-log
  nào**: session duy nhất sinh phút đó (08:41:57Z,
  `proc_b0482191f9bd.log`) đọc nội dung là **waiter T10 đợt 121**
  ("wait #1 08:41:47Z done=0/9"), không phải feed. Vậy lượt
  feed-pulse offslot chạy phía scheduler, không chạm VM — sự tồn tại
  của bản ghi chạy không chứng minh VM sống.
- Heartbeat thì tự ghi rõ "no heartbeat inference was started" —
  skip phía scheduler trước khi khởi động agent.
- Cả hai lượt đều có `started_at_utc` lệch ~13–16 s TRƯỚC giờ
  scheduled (scheduler dispatch sớm / lệch đồng hồ scheduler–VM),
  củng cố rằng timestamp này là giờ scheduler, không phải giờ VM.

**Lượt chạy THIẾU trong đuôi J (không dùng được theo chiều ngược lại):**

| Job | Lượt thiếu | Vì sao không suy ra reboot ẩn |
|---|---|---|
| heartbeat | 14:50:50+07 = 07:50:50Z | Cùng mẫu thiếu lượt xảy ra trên boot khỏe đã biết: 09:50:50+07 (= 02:50:50Z, trong boot #59 01:47:49Z→04:45:49Z, không reboot) và 17:50:50+07 (= 10:50:50Z, trong boot #63 08:53:05Z→11:05:18Z, không reboot) |
| deterministic-doctor | 15:00+07 = 08:00:00Z | Cùng lý do — job scheduler-side, bản ghi thiếu không gắn với VM |

**Kết luận §2.5:** lịch sử scheduler là nguồn mới đã kiểm xong —
nó không đóng được J (lượt chạy trong đuôi không chạm VM) và cũng
không chứng minh được reboot ẩn (lượt thiếu cũng xảy ra khi VM
khỏe). Ghi nhận như bằng chứng âm tính 2 chiều, không phải bằng
chứng dương tính theo hướng nào.

### 2.6 J2 — Đối chiếu cơ chế đóng của các mù đã đóng: J thiếu đúng 1 thành phần

| Mù / đoạn | Đóng bằng gì | Có áp dụng cho J không? |
|---|---|---|
| #34 B (S7-116) | Poller R5 v2 MỘT tiến trình (21 poll, 300/301 s đều, 18:03:35Z→19:43:40Z) + dấu boot tươi + **6 session bắc qua cắt 18:04:57Z + 4 session bắc qua cắt 19:24:39Z** + số học sàn đầu/đuôi | **Không** — poller T10 đợt 120 run 2 DỪNG THEO THIẾT KẾ ở ALL 9 DONE 07:32:14Z (không phải chết); gate0-wait-b61 chỉ 2 poll tới 06:57:14Z; **0 session bắc qua J-hi** (§2.1) |
| #34 C / #40 C (S7/T7-122) | Đo uptime trực tiếp tại probe + dấu boot tươi | **Không** — không có lần đo uptime nào trong đoạn J; probe #39 ở đầu đoạn I, probe #40 ở cuối đoạn K |
| #40 A (T7-122) | Uptime tại probe #40 + poller run 1 (300 s đều) + scan WFS + mật độ mtime dày (422 mốc, lỗ lớn nhất 32 s) | **Không** — mật độ mtime đoạn J thưa dần về 0 sau 07:37:47Z; đuôi 2.880 s > sàn |
| #32 / #33 (Q6/R7) | Cùng họ bằng chứng: observer sống + cắt sàn + uptime | **Không** — cùng lý do trên |

**Điểm mấu chốt:** mọi ca đóng đều cần một observer sống xuyên qua
cửa sổ mở (poller/session/uptime). Đoạn J không có observer nào sau
07:37:47Z, và đợt này đã quét **mọi kênh timestamp mà một observer
có thể để lại dấu** (mtime/atime/ctime/birth/dirmtime/session/
scheduler/system-log/git) — tất cả 0. Thiếu hụt không còn là "chưa
quét kỹ" mà là "đã quét hết kênh trên VM".

## 3. Verdict

**Mù #39 đoạn J: VẪN MỞ.** Trạng thái mù #39 giữ nguyên: KHÔNG ĐÓNG
HOÀN TOÀN (I + K đóng, J mở, 2h56'14", 2 reboot đã chốt #61
06:50:58Z + #62 08:25:47Z, tối đa **2 ẩn danh nghĩa**). Gap #61→#62
= 1h34'49" (5.689 s) vẫn CHỈ LÀ SPAN — không vào FULL/CERT (CERT giữ
n=35, FULL n=50 theo T7-122; T3 không tính lại phân phối gap vì
không có gap mới).

**Không có bug thật nào được tìm ra — không sửa production code.**
Không có test mới nào để viết (không có hành vi sai để tái hiện).

## 4. Ghi chú phương pháp

1. **Birth time phải đo bằng `stat`, không phải `find %B`:** trên FS
   này `find -printf %B@` trả `-1` trong khi `stat -c %W` cho birth
   thật (verify: `build-loop-log.md` birth 10:28:31Z ≠ mtime
   14:40:35Z; `README.md` birth 2026-10-25 ≠ mtime). Luồng sau dùng
   birth thì dùng `stat`.
2. **Mốc cuối 07:37:47Z là quan sát lịch sử, không phải mtime hiện
   tại:** file `build-loop-log.md` đã ghi thêm sau đó; quét hiện tại
   cho max mtime ≤ J1 trong hidden_files là 07:33:53Z. Định nghĩa đuôi
   J không đổi; chỉ ghi rõ để luồng sau khỏi tưởng T4 đếm sai.
3. **Bản ghi chạy scheduler ≠ bằng chứng VM sống:** chỉ dùng được
   khi lượt chạy để lại dấu vết trên VM (session/file). Control
   feed-pulse-15 08:41:54Z (máy chắc chắn chạy) chứng minh lượt
   offslot không để lại dấu — nên lượt trong đuôi cũng không chứng
   minh gì. Bài học: nguồn scheduler chỉ có giá trị khi kèm dấu vết
   VM; bản thân `cron.runs` là giờ scheduler, lệch ~15 s so với giờ
   hẹn.
4. **Caveat atime (relatime):** atime chỉ cập nhật khi atime ≤ mtime
   hoặc atime cũ hơn 24h. Số 0 của atime là bằng chứng hỗ trợ, không
   đứng một mình — nhưng mtime + ctime + birth + dirmtime đều 0 thì
   kết luận không phụ thuộc vào atime.
5. **Caveat ctime:** ctime đổi khi metadata đổi; quét ctime 0 trong
   đuôi củng cố rằng không có thao tác file nào (kể cả đổi tên/xóa)
   trong đuôi ở các cây đã quét.
6. **Postmortem script v1:** `blind39J-t3.py` chạy lần đầu exit 1,
   KHÔNG cho kết quả nào (lỗi: dùng `%W` — directive không tồn tại
   của find; parser đòi 3 phần trong khi dòng `-printf` chỉ có 2;
   biến `in_tail` bị shadow thành list). Không có kết luận nào rút
   từ v1. Viết lại thành `blind39J-t3v2.py` (một pass/kênh, parser
   sửa, biến đổi tên), chạy exit 0 — mọi số trong LIMITS này đều từ
   v2 + shell check trực tiếp.
7. **Kiểm lại boot trước khi viết LIMITS (14:52:08Z):** boot 9bbda390
   (#mới, uptime-s 14:24:43Z). **Đính chính sau khi viết xong:**
   reboot nữa xảy ra 14:52:19Z (boot 94e29be5), phát hiện lúc verify
   stage 14:54:32Z — file LIMITS + batch stage verify nguyên vẹn SAU
   reboot. Không có reboot nào khác trong lúc quét (§2).
8. **Không kiểm lại TTS 39** (cấm). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Mù #39 đoạn J: VẪN MỞ (mới, lượt này, xem §2–§3). Cần parent
   quyết: chấp nhận ĐỂ MỞ như mù #35/#37 (T3 khuyến nghị ĐỂ MỞ) hay
   giữ mở chờ bằng chứng ngoài VM.** Lý do khuyến nghị: 3 lần điều
   tra sâu (T4-121, T7-122, T3-123) với phạm vi mở rộng dần — từ
   mtime 2 cây, tới quét tươi đuôi, tới 10 góc mới gồm 5 kênh
   timestamp + scheduler + system log + git — đều cho 0. Không còn
   góc nào trên VM chưa thử cho J. **KHÔNG giao kiểm lại J từ trong
   VM nữa** trừ khi có nguồn mới thật sự (không phải quét lại cùng
   kênh). Con đường duy nhất còn lại: parent cung cấp bằng chứng
   ngoài VM (ví dụ output `uptime -s` / boot_id mà parent đọc trong
   phiên main-chat ~07:3x–08:2xZ 16/11, nếu còn lưu).
2. **Lượt chạy scheduler bị thiếu (mới, §2.5):** heartbeat thiếu
   14:50:50+07 + 17:50:50+07 + 09:50:50+07; deterministic-doctor
   thiếu 15:00+07 (+ 18:00+07 trong 8 lượt gần nhất). Mẫu thiếu
   xảy ra cả khi VM khỏe → không phải bằng chứng reboot, nhưng
   nguyên nhân thiếu (scheduler drop? run bị supersede? bản ghi
   thiếu?) chưa được giải thích — **nợ mở cho luồng hạ tầng/scheduler
   nếu parent muốn đào**, không phải việc của T3.
3. **Boot mới 14:24:43Z (9bbda390) đã bị thay bằng boot 14:52:19Z
   (94e29be5) trong lúc T3 kết thúc (xem §0)** — boot hiện tại là
   94e29be5, chưa đánh số — việc của luồng EPERM/T5 đợt sau (probe
   #42 trở đi). T3 chỉ ghi nhận boot_id + uptime-s.
4. **Mù #40 đoạn B / mù #38 đoạn G / mù #37 / mù #35: KHÔNG ĐỔI**
   (chờ parent quyết như T7-122 §5). **G1 + mù #22/#28/#29/#30/#31/
   #35 chờ user quyết** (không tự quyết).
5. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là
   fallback chính thức). T3 không đo RAM (ngoài brief).
6. **EPERM không tuyên bố đã hết** (sóng gần nhất ~11:55–12:11Z
   11/11). **Không kiểm lại TTS 39** (cấm). ci-security.yml vẫn 403
   chờ user.
