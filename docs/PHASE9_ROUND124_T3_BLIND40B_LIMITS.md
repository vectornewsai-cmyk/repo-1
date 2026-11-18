# PHASE9 ROUND124 T3 — Mù #40 B kiểm lại với GÓC MỚI (lần 3) — VẪN MỞ + gap #63→#64 VẪN SPAN

> Luồng T3, đợt 124 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 17/11/2026; làm việc 17:41Z → 17:52Z 16/11/2026).
> Nhiệm vụ: mù #40 B — kiểm lại với GÓC MỚI, và gap #63→#64.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG sửa production code. **KHÔNG kiểm lại mù #39 J** (parent đã
> chấp nhận ĐỂ MỞ — quyết đợt 123 §12.2). Không đụng TTS 39.
> Chốt chặn: round-in-progress.md TỒN TẠI nhưng là của chính đợt 124
> (mở 17:35Z bởi driver lượt này) — T3 là luồng của đợt đó nên làm
> việc theo brief, không phải lượt cron chạy ngoài đợt.

## 0. Kết quả headline

- **Mù #40 đoạn B: VẪN MỞ — lần kiểm tra thứ ba (T7-122, T7-123,
  T3-124) đều cho 0 bằng chứng mới.** Đợt này thử **9 góc CHƯA TỪNG
  thử cho B** (xem §1): birth, atime, ctime, directory-mtime, lịch
  sử cron scheduler cho cửa sổ đuôi, đọc sâu nội dung file JSON
  10:42:19Z, 2 thư mục tool-output chạm đuôi, log probe v2, nhật ký
  memory ngày 16/11, đối chiếu danh sách đông lạnh blind40 đợt 122
  — tất cả đều 0 sau 10:42:19Z.
- **Quét v2 (kế thừa script T3-123, đã sửa hằng số đuôi B):
  606.207 file** — mtime trong đuôi: **1** (file JSON đã biết,
  10:42:19Z, biên trái đuôi); atime: **1** (cùng file); ctime:
  **1** (cùng file); birth: **0**; thư mục có mtime trong đuôi:
  **4** (đều 10:42:19Z, xem §2.2); session chạm đuôi: **0/294**
  (tăng từ 262); session bắc qua cắt B-hi (10:46:11Z): **0**.
- **Chi tiết mới duy nhất (không đổi verdict):** 2 thư mục
  tool-output rỗng của 2 session cũ (21482c1e, b501a4e2) có dirmtime
  **10:42:19.785Z / .788Z** — cùng một đợt gọi exec của phiên
  main-chat của parent lúc ~10:42:19Z (3 lệnh cùng lúc: 1 cho file
  JSON, 2 không để lại file). Quan sát cuối dời 0,37 s lên
  **10:42:19.788Z**; đuôi sau nó còn **1.378,2 s > sàn 1.147 s** —
  verdict không đổi.
- **Lịch sử cron scheduler cho cửa sổ đuôi (góc mới, §2.5):** 2
  lượt hẹn rơi vào đuôi sau cắt B-hi đều **THIẾU bản ghi chạy** —
  heartbeat 17:50:50+07 (= 10:50:50Z) và deterministic-doctor
  18:00+07 (= 11:00:00Z); feed-pulse-18 không có lượt nào trong
  đuôi (lượt duy nhất trong ngày 18:41:54+07 = 11:41:54Z, sau
  đuôi). 2 lượt thiếu là **mẫu drop đã biết của scheduler, cũng
  xảy ra trên boot khỏe** (T3-123 đã nêu đúng lượt heartbeat
  17:50:50+07 trong boot #63 làm control) — **không dùng được
  theo chiều nào**, như kết luận 2 chiều của T3-123 §2.5 cho J.
- **Gap #63→#64 = 2h12'13" (7.933 s) VẪN CHỈ LÀ SPAN — KHÔNG chứng
  nhận được.** Còn thiếu đúng **1 quan sát sau 10:46:11Z** trong
  đuôi (10:42:19Z, 11:05:18Z] (xem §2.7). CERT giữ n=37, FULL giữ
  n=52 theo T7-123 (T3 không tính lại phân phối gap vì không có
  gap mới).
- **Boot trong lúc làm việc không đổi:** 69359761 (uptime-s
  17:33:51Z, reboot #68 tạm theo round-in-progress), kiểm lúc
  17:50:29Z. Probe #43 đã có trên đĩa lúc T3 làm việc (17:43:19Z,
  boot 69359761, ok=2 fail=0 — việc của luồng EPERM đợt này, T3
  chỉ ghi nhận từ log probe v2, 121 dòng).

## 1. Định nghĩa lại mục tiêu + phương pháp (góc mới so với T7-122/T7-123)

Mù #40: 08:40:45Z → 11:38:49Z 16/11 (probe #40 → probe #41),
2h58'04". Đoạn B: 08:53:05Z (#63, boot 725453a2) → 11:05:18Z (#64,
boot 3fe7e89e), 2h12'13" = 7.933 s. Đuôi mở: **(10:42:19Z,
11:05:18Z] = 1.379 s (22'59")**, tối đa 1 reboot ẩn danh nghĩa
(⌊1.379/1.147⌋ = 1, sàn 19'07" = 1.147 s). Cắt B-lo 09:12:12Z,
B-hi 10:46:11Z. Quan sát cuối đã biết: file tool-output exec-call
JSON mtime 10:42:19Z + 7 file proactivity mtime 10:41:55Z
(T7-122 §2.3).

T7-122 đã làm (mtime 3 phạm vi + /tmp + session) và T7-123 đã làm
lại (quét tươi đuôi 4 phạm vi + grep nội dung nhắc 725453a2 sau
11:52Z). Cả hai đều chỉ dùng **mtime + session + grep boot-id**.
Đợt này thử các góc CHƯA TỪNG thử cho B — mỗi góc nhắm một kênh
dấu vết mà quét mtime không thấy được (phần lớn đã được chứng minh
hiệu quả/không hiệu quả cho J ở T3-123, nay áp lần đầu cho B):

| # | Góc mới cho B | Vì sao mtime-only bỏ sót | Nguồn |
|---|---|---|---|
| A | mtime tươi, phạm vi RỘNG (606.207 file, 5 root: workspace, /tmp, ~/memory, /var/tmp, /dev/shm) | T7 chỉ quét 2 cây + ngoài cây + /tmp; `~/memory` và temp dir chưa từng được quét cho B | blind40B-t3v2.py |
| B | **birth time** (`stat %W`) trong đuôi | File TẠO trong đuôi rồi sửa SAU đuôi có mtime sau đuôi → vô hình với mọi lần quét mtime | blind40B-t3v2.py |
| C | **atime** trong đuôi | File ĐỌC trong đuôi (không ghi) không đổi mtime | blind40B-t3v2.py |
| D | **ctime** trong đuôi | chmod/rename/link/unlink đổi ctime, không đổi mtime | blind40B-t3v2.py |
| E | **directory mtime** trong đuôi | File tạo rồi XÓA trong đuôi không còn file để quét, nhưng thư mục cha vẫn giữ mtime | blind40B-t3v2.py |
| F | lịch sử chạy cron scheduler cho cửa sổ đuôi (heartbeat, deterministic-doctor, feed-pulse-18, vcut-build-loop) | Chưa luồng nào dùng `cron.runs` cho B (T3-123 chỉ dùng cho J) | cron tools (§2.5) |
| G | session tươi (294 file, tăng từ 262) + session BORN trong đuôi | T7 đếm 262; thêm session mới + kiểm birth | blind40B-t3v2.py |
| H | content grep sau 14:57Z (khi T7-123 xong) cho 725453a2 | T7-123 chỉ grep tới 14:57Z; đợt 123 đóng + đợt 124 mở có thể để lại đọc tươi mới | blind40B-t3v2.py |
| I | đọc sâu NỘI DUNG file JSON 10:42:19Z + 2 thư mục tool-output chạm đuôi | T7 chỉ dùng mtime của JSON; nội dung của nó (build-loop-log) có thể chứa timestamp sau 10:42:19Z; 2 dir rỗng chạm đuôi chưa ai xem | shell + python (§2.3–2.4) |
| J | log probe v2 + nhật ký memory 16/11 + danh sách đông lạnh blind40 đợt 122 | Chưa luồng nào đối chiếu 3 nguồn này cho B | shell (§2.6) |
| K | system log boot #63 (journal/wtmp/dpkg/apt) | Chưa kiểm riêng cho #63 (T3-123 chỉ kiểm cho #61) | shell (§2.6) |

Không viết prereg riêng (thiết kế quét suy ra trực tiếp từ brief +
lịch sử T7-122/T7-123 đã đọc trước khi đo).

## 2. Kết quả điều tra

### 2.1 Quét v2 — 606.207 file, 5 kênh timestamp, chỉ 1 file ở biên đuôi

Chạy `blind40B-t3v2.py` (adapt từ T3-123, đổi hằng số đuôi B),
exit 0, một pass mỗi root cho mtime/atime/ctime + một pass `stat`
riêng cho birth + một pass dirmtime:

| Kênh | Tổng quét | Trong đoạn B | **Trong đuôi B** | Ghi chú |
|---|---|---|---|---|
| A. mtime | 606.207 | 886 | **1** | Chỉ file JSON đã biết, 10:42:19Z (biên trái đuôi, xem §2.2) |
| B. birth (`stat %W`) | 606.269 | 1.016 | **0** | Không file nào ĐƯỢC TẠO trong đuôi, kể cả file sửa sau đó |
| C. atime | 606.207 | 1.016 | **1** | Cùng file JSON (xem caveat relatime §4 mục 4) |
| D. ctime | 606.207 | 1.155 | **0 mới** | 1 hit là cùng file JSON (không chmod/rename nào khác trong đuôi) |
| E. directory mtime | (mọi thư mục 5 root) | — | **4** | Đều 10:42:19Z — 2 dir của chính file JSON + 2 dir rỗng (§2.2) |
| G. session exec-log | 294 file | 31 born trong B | **0** chạm đuôi; **0** bắc qua B-hi; **0** born trong đuôi | Tăng từ 262 (T7-123) lên 294 — vẫn 0 |

Chi tiết theo cây (mtime ≤ B1, kiểm chéo mốc cuối của T7-122):
- repo-1: max mtime ≤ B1 = **10:31:11Z** (docs/PHASE9_ROUND121_LIMITS.md
  — đúng mốc cuối trong hai cây của T7-122); sau 10:30Z chỉ đúng
  1 mốc này.
- hidden_files: max mtime ≤ B1 = **10:20:42Z**; sau 10:30Z: 0 mốc.
- /tmp: chỉ còn **27 file** toàn bộ (đều boot hiện tại) — /tmp dọn
  theo boot, nhất quán các đợt trước; 0 file trong đuôi.
- /var/tmp: 0 file. /dev/shm: 4 file (jack_db-0, boot hiện tại).
- Session born trong B có mtime lớn nhất = **10:20:00Z**
  (proc_a3d140f1d22a.log — 1 trong 2 session bắc qua cắt B-lo,
  đã biết từ T7-122).

### 2.2 Góc E — 4 thư mục chạm đuôi, đều 10:42:19Z: chi tiết mới duy nhất

| Thư mục | dirmtime | Nội dung | Phân loại |
|---|---|---|---|
| `agents/8ec4eefa-…/ ` | 10:42:19.419Z | dir cha của file JSON | Cùng quan sát đã biết |
| `agents/8ec4eefa-…/tool-output/` | 10:42:19.419Z | 1 file JSON (10:42:19.419Z) | Cùng quan sát đã biết |
| `agents/21482c1e-…/tool-output/` | **10:42:19.785Z** | **RỖNG** (0 file) | MỚI — xem dưới |
| `agents/b501a4e2-…/tool-output/` | **10:42:19.788Z** | **RỖNG** (0 file) | MỚI — xem dưới |

- 2 agent dir 21482c1e / b501a4e2 là session CŨ (dir cha từ
  09/11; exec-logs mtime 09/11) — không có exec-log nào sinh
  trong đuôi. Thư mục tool-output của chúng được chạm lúc
  10:42:19.785/.788Z, tức **cùng một đợt gọi exec của phiên
  main-chat của parent**: 3 lệnh chạy gần như đồng thời lúc
  ~10:42:19Z (1 lệnh cho ra file JSON, 2 lệnh không để lại file
  output — dir được tạo/chạm rồi để rỗng).
- Quan sát cuối dời từ 10:42:19.419Z lên **10:42:19.788Z**
  (+0,37 s). Đuôi sau quan sát cuối còn **1.378,2 s**, vẫn
  **> sàn 1.147 s** — verdict không đổi. Ghi nhận vì chính xác,
  không vì nó giúp đóng B.

### 2.3 Góc I — đọc sâu nội dung file JSON 10:42:19Z: 0 timestamp sau đó

File `agents/8ec4eefa-…/tool-output/exec-call_01a1e3f3594a7605b199ba1842f919e3.json`
(49.681 byte) là output của một lệnh `ls` hidden_files của phiên
main-chat parent (stdout = listing thư mục + nội dung
build-loop-log.md tới thời điểm đó, total 41.322 ký tự). Quét nội
dung tìm mọi timestamp sau 10:42:19Z:
- Grep `10:4[3-9]|10:5[0-9]|11:0[0-5]`: 2 dòng chứa — đều là chuỗi
  **"10:45"** (4 lần): tất cả đều là cụm **"hạn cứng 10:45Z"**
  (hạn cứng đóng đợt 121) trích trong build-loop-log — văn bản
  hồi tưởng, không phải quan sát.
- Không có timestamp nào dạng `10:4x/10:5x/11:0x` có giây sau
  10:42:19Z trong nội dung. Timestamp nội dung mới nhất là
  recount T10 lúc **10:22Z**.
- **Kết luận: nội dung JSON không mở rộng phủ sóng quá 10:42:19Z.**

### 2.4 Góc H — content grep sau 14:57Z: 5 file nhắc 725453a2, 0 đọc tươi

| File (mtime) | Số lần | Phân loại |
|---|---|---|
| docs/PHASE9_ROUND123_T7_EPERM_LIMITS.md (14:59:10Z) | 2× | LIMITS của chính T7-123 (trích dẫn hồi tưởng boot #63) |
| hidden_files/round123-t7/checkpoint3.txt (14:59:30Z) | 1× | Checkpoint T7-123 (trích dẫn) |
| hidden_files/round118-t9/e4batch-ledger.md (15:09:12Z) | 2× | Sổ cái E4 (trích dẫn) |
| hidden_files/round124-t3/blind40B-t3v2.py (17:43:59Z) | 5× | Script của CHÍNH T3 (chuỗi trong code/docstring) |
| hidden_files/build-loop-log.md (17:46:27Z) | 5× | Mục log mở đợt 124 (trích dẫn hồi tưởng) |

**0 lần đọc tươi boot #63 trong đuôi.** Mẫu này giống hệt T7-123
(8 file) — số file tăng chỉ vì đợt 123 đóng + đợt 124 mở ghi thêm
trích dẫn, không phải bằng chứng mới.

### 2.5 Góc F — Lịch sử chạy cron scheduler cho cửa sổ đuôi: nguồn MỚI cho B, kết quả ÂM TÍNH 2 chiều

Đuôi B (10:42:19Z–11:05:18Z) = **17:42:19–18:05:18 +07** 16/11.
Các job có thể rơi vào đuôi (theo `cron.list`):

| Job | Lượt hẹn trong đuôi | Bản ghi chạy (`cron.runs`) | Dấu vết trên VM? |
|---|---|---|---|
| heartbeat (30 phút) | 17:50:50+07 = **10:50:50Z** (sau cắt B-hi 10:46:11Z) | **THIẾU — không có bản ghi** (lượt trước 17:20:50+07 có; lượt sau 18:20:50+07 có) | **0** — không session, không file (quét §2.1) |
| deterministic-doctor (hàng giờ) | 18:00+07 = **11:00:00Z** (sau cắt B-hi) | **THIẾU — không có bản ghi** (lượt trước 17:00+07 có; lượt sau 19:00+07 có) | **0** |
| feed-pulse-18 (hàng ngày) | — (lượt trong ngày chạy 18:41:54+07 = 11:41:54Z, SAU đuôi) | Lượt 18:41:54+07 có (`feed pulse run admitted`); **không có lượt nào trong đuôi** | — |
| vcut-build-loop (3 giờ) | — (15:35 / 18:35+07) | Không rơi vào đuôi | — |

**Vì sao 2 lượt thiếu KHÔNG dùng được theo chiều nào — chứng minh
bằng control đã có từ T3-123:**
- Lượt heartbeat thiếu 17:50:50+07 này chính là control mà T3-123
  §2.5 đã nêu: nó rơi vào boot #63 (08:53:05Z→11:05:18Z) mà
  **không có reboot nào** trong boot đó được chứng minh độc lập
  (poller run 2 phủ tới 10:09:31Z + T10 đóng đợt 121 10:28Z +
  hoạt động main-chat 10:42:19Z). Mẫu thiếu lượt xảy ra cả khi VM
  khỏe → thiếu lượt không phải bằng chứng reboot ẩn.
- Lượt deterministic-doctor thiếu 18:00+07 cùng mẫu: T3-123 đã ghi
  doctor thiếu 15:00+07 trong đuôi J và thiếu lượt cũng xảy ra
  trên boot khỏe.
- Ngược lại, cũng không có lượt chạy nào TRONG đuôi để lại dấu vết
  VM (cả 2 lượt hẹn đều thiếu bản ghi; feed-pulse không chạy trong
  đuôi) → không đóng được B.
- **Kết luận §2.5:** lịch sử scheduler cho B là nguồn mới đã kiểm
  xong — bằng chứng âm tính 2 chiều, không phải bằng chứng dương
  tính theo hướng nào. (Cùng kết luận T3-123 §2.5 cho J.)

### 2.6 Góc J + K — probe log, nhật ký memory, danh sách đông lạnh, system log

- **Log probe v2** (`hidden_files/eperm-probe-v2.log`, 121 dòng —
  118 sau T7-123 + 3 dòng probe #43 của luồng EPERM đợt này lúc
  17:43:19Z, boot 69359761, ok=2 fail=0): 3 dòng khớp mẫu giờ đuôi
  nhưng tất cả đều là dòng `=== boot changed … ===` **hồi tưởng**,
  trích giờ uptime cũ (10:53:31 14/11; 10:48:26 15/11;
  **11:05:18 16/11 — chính là giờ boot #64**, trích trong dòng
  viết sau). **0 quan sát sống trong đuôi.**
- **Nhật ký memory ngày 16/11** (`~/memory/2026-11-16.md`): 0 mục
  có timestamp trong 17:42–18:05 +07; 2 hit grep đều là mục cũ
  trích "17:45:02Z"/"17:45" về mù #34 và đợt 117 (dương tính giả).
  Nhật ký memory không phải bằng chứng VM sống — chỉ ghi nhận là
  đã kiểm, không có lead mới.
- **Danh sách đông lạnh blind40 đợt 122** (round122-t7:
  blind40-repo-1.txt, blind40-hidden_files.txt,
  blind40-outside.txt, blind40-tmp.txt): **0 mục** trong
  (10:42:19Z, 11:05:18Z] ở cả 4 phạm vi — đối chiếu độc lập xác
  nhận mốc cuối 10:42:19Z của T7-122. Sessions đông lạnh (218
  file): 2 session bắc qua cắt B-lo (đã biết), 0 chạm đuôi.
- **System log boot #63: đã mất hoàn toàn** — journal chỉ còn 1
  boot (69359761, first entry 17:34:06Z); `last -x reboot` chỉ 1
  dòng (17:34, still running); /var/log chỉ còn log boot hiện tại
  (dpkg.log 111.185 byte, /var/log/apt mới có từ boot #68);
  không có syslog/kern.log/messages/auth.log, không có file xoay
  vòng (*.gz, wtmp.1, dpkg.log.*) cho boot #63. Cùng kết luận
  T3-123 §2.4 cho boot #61.

## 3. Verdict

**Mù #40 đoạn B: VẪN MỞ.** Trạng thái mù #40 giữ nguyên: KHÔNG
ĐÓNG HOÀN TOÀN (A + C đóng, B mở, 2h58'04", 2 reboot đã chốt #63
08:53:05Z + #64 11:05:18Z, tối đa **1 ẩn danh nghĩa**). Gap #63→#64
= 2h12'13" (7.933 s) vẫn CHỈ LÀ SPAN — không vào FULL/CERT (CERT
giữ n=37, FULL giữ n=52 theo T7-123; T3 không tính lại phân phối
gap vì không có gap mới).

**Còn thiếu gì để chứng nhận gap #63→#64 (nhắc lại, không đổi so
với T7-123 §2.6):** đúng **1 quan sát sau 10:46:11Z** (cắt B-hi)
trong đuôi (10:42:19Z, 11:05:18Z] — bất kỳ 1 file nào có mtime
trong đuôi HOẶC 1 session chạm đuôi HOẶC bằng chứng ngoài VM
(ví dụ output `uptime -s` của parent lúc ~10:5xZ). Ngay cả khi B
được đóng, gap #63→#64 vẫn mang caveat F64 chưa kiểm (không có
cận nhảy clock tại #64 — T7-122 §2.2) nên chỉ chứng nhận được dạng
ĐIỂM CÓ CAVEAT hoặc KHOẢNG nếu tìm được cận nhảy; không chứng nhận
điểm sạch.

**Không có bug thật nào được tìm ra — không sửa production code.**
Không có test mới nào để viết (không có hành vi sai để tái hiện).

## 4. Ghi chú phương pháp

1. **Lỗi nhãn in nhỏ trong blind40B-t3v2.py (ghi nhận, không ảnh
   hưởng số liệu):** dòng in "last 5 mtimes in J after 07:30Z"
   giữ nhãn cũ từ script T3-123 trong khi bộ lọc đã đổi thành
   10:30:00Z — giá trị in ra là đúng theo bộ lọc 10:30Z
   (repo-1: 1 mốc 10:31:11Z; hidden_files: 0 mốc sau 10:30Z).
   Cùng họ lỗi nhãn như T7-123 §4 mục 5; mọi số trong LIMITS này
   dùng bộ lọc đúng.
2. **Bản ghi chạy scheduler ≠ bằng chứng VM sống** (nhắc lại bài
   học T3-123 §4 mục 3): chỉ dùng được khi lượt chạy để lại dấu
   vết trên VM (session/file). Với B, cả 2 lượt hẹn trong đuôi
   đều thiếu bản ghi — và mẫu thiếu cũng xảy ra khi VM khỏe — nên
   lịch sử scheduler cho B là âm tính 2 chiều.
3. **Dir rỗng cũng là dấu vết** (mới, §2.2): 2 thư mục tool-output
   rỗng chạm đuôi ở 10:42:19.785/.788Z cho thấy phiên main-chat
   chạy 3 lệnh cùng lúc — dirmtime bắt được cả lệnh không để lại
   file. Nhưng vẫn cùng giây với quan sát cuối đã biết nên không
   đổi verdict; lần sau quét đuôi nên kiểm dirmtime ngay từ đầu
   (đợt này đã làm — góc E).
4. **Birth time phải đo bằng `stat`, không phải `find %B`** (nhắc
   lại T3-123 §4 mục 1): script dùng `stat -c %W` theo lô, đã
   verify qua 606.269 dòng.
5. **Caveat atime (relatime)** (nhắc lại T3-123 §4 mục 4): số 0
   của atime là bằng chứng hỗ trợ, không đứng một mình — nhưng
   mtime + ctime + birth + dirmtime đều 0 sau 10:42:19Z (trừ 1
   file biên) thì kết luận không phụ thuộc vào atime.
6. **Kiểm lại boot trước khi viết LIMITS (17:50:29Z):** boot
   69359761 (#68 tạm, uptime-s 17:33:51Z) — không có reboot nào
   trong lúc T3 làm việc (17:41Z → 17:52Z).
7. **Không kiểm lại mù #39 J** (cấm theo brief — parent đã chấp
   nhận ĐỂ MỞ). **Không kiểm lại TTS 39** (cấm). **Không đụng
   cloud/collab/AI model đóng/nhạc bản quyền.**

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Mù #40 đoạn B: VẪN MỞ (mới, lượt này, xem §2–§3). Cần parent
   quyết: chấp nhận ĐỂ MỞ như mù #35/#37/#39 (T3 khuyến nghị ĐỂ
   MỞ, cùng lý do như T7-123 §5 mục 1 và T3-123 §5 mục 1 cho J)
   hay giữ mở chờ bằng chứng ngoài VM.** Lý do khuyến nghị: 3
   lần kiểm tra (T7-122 mtime-only, T7-123 quét tươi, T3-124 9
   góc mới gồm 5 kênh timestamp + scheduler + nội dung file +
   probe log + memory log + danh sách đông lạnh) đều cho 0 sau
   10:42:19Z. Không còn góc nào trên VM chưa thử cho B — danh
   sách góc của J (T3-123) nay đã áp hết cho B trừ .git (repo-1
   KHÔNG có .git — đã xác nhận đợt 123) và system log (đã mất,
   §2.6). **KHÔNG giao kiểm lại B từ trong VM nữa** trừ khi có
   nguồn mới thật sự. Con đường duy nhất còn lại: parent cung cấp
   bằng chứng ngoài VM (ví dụ output `uptime -s` / boot_id mà
   parent đọc trong phiên main-chat ~10:4x–11:0xZ 16/11, nếu còn
   lưu — phiên đó đã chạy 3 lệnh lúc 10:42:19Z, có thể còn log
   trong lịch sử chat).
2. **Gap #63→#64 VẪN SPAN** (xem §3) — không chứng nhận được cho
   tới khi B đóng; ngay cả khi đó vẫn mang caveat F64.
3. **Lượt chạy scheduler bị thiếu (mới cho B, §2.5):** heartbeat
   thiếu 17:50:50+07 + deterministic-doctor thiếu 18:00+07 trong
   đuôi B. Mẫu thiếu xảy ra cả khi VM khỏe → không phải bằng
   chứng reboot, nhưng nguyên nhân thiếu chưa được giải thích —
   **nợ mở cho luồng hạ tầng/scheduler nếu parent muốn đào**,
   không phải việc của T3 (cùng nợ mở T3-123 §5 mục 2).
4. **Mù #39 J: ĐỂ MỞ theo quyết parent đợt 123 — T3 KHÔNG kiểm
   lại lượt này.** Mù #38 G / #37 / #35 / G1 / mù #22/#28/#29/
   #30/#31: KHÔNG ĐỔI (chờ parent/user quyết như T7-123 §5).
5. **Reboot #68 (17:33:51Z, boot 69359761) — chỉ ghi nhận** (theo
   round-in-progress; probe #43 17:43:19Z ok=2 fail=0 đã có trên
   đĩa) — việc đánh số/chứng nhận thuộc luồng EPERM đợt này.
6. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net
   là fallback chính thức). T3 không đo RAM (ngoài brief).
7. **EPERM không tuyên bố đã hết** (sóng gần nhất ~11:55–12:11Z
   11/11). **Không kiểm lại TTS 39** (cấm). ci-security.yml vẫn
   403 chờ user.

## 6. Stage

- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round124-t3-blind40b.txt`
  — 1 entry (LIMITS này), NUL-delimited, đường dẫn tương đối, đã
  verify read-back, 0 binary.
- Dữ liệu thô: `hidden_files/round124-t3/` (blind40B-t3v2.py,
  blind40B-t3v2.log, sessions-all.txt, cron-runs-blind40b.md).
- Cờ `hidden_files/round124-t3.done` đã tạo.
