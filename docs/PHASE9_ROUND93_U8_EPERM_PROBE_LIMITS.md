# PHASE9 ROUND93 U8 — EPERM: checklist probe v2 + khoảng mù #11 + quét writeFileSync (nợ LIMITS gộp đợt 92 §4 mục 8)

> Luồng U8, đợt 93 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 12/11/2026; làm việc ~23:40–23:55Z 11/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #11
> (20:38:56Z 11/11) + quét lại writeFileSync với danh sách loại trừ
> chuẩn mới (S7/T8) + ghi RAM hiện tại (birefnet: KHÔNG chạy, theo
> quyết định parent đợt 92 — chỉ thử lại khi có tín hiệu RAM thay
> đổi). KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 23:40:24Z
  báo **DEAD/STALE** (heartbeat age 10.888 s, last #11 20:38:56Z,
  boot 14e10da9, exit 1); `once` ngay sau đó là **probe #12,
  boot 88ebef2e (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 6 s, n=12), exit 0.
- **Khoảng mù #11 (mới): 20:38:56Z → 23:40:34Z (~182 phút)** — dài
  thứ hai trong lịch sử probe (sau khoảng mù #8, ~187'; ngang khoảng
  mù #10, ~180'). Trong đó có **2 lần reboot ĐÃ XÁC NHẬN:
  #11 ~21:35:58Z** (14e10da9 → 09e8d2af, T9 đã ghi trong lượt) và
  **#12 23:33:21Z** (09e8d2af → 88ebef2e, **mới — KHÔNG ai ghi nhận
  trước probe #12**: grep `23:33`/`88ebef` trong build-loop-log +
  memory log 11/11 và 12/11 = 0 hit). **Đính chính brief giao việc:**
  brief nói reboot "~23:36Z, uptime ~2 phút lúc giao việc" — đo thật
  `uptime -s` = **23:33:21Z** (journal first entry 23:33:31Z),
  uptime 6' lúc 23:40Z.
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (T1–T5/T7: 0 lần nhắc EPERM; T6 chỉ nhắc trong
  ngữ cảnh fault-injection tự viết; O8 21/21 cả 2 engine 22:29–
  22:30Z; vite build PASS 8,39 s; tsc 0). Nhưng **~60 phút cuối
  khoảng mù (22:40:42Z → 23:40:34Z) hoàn toàn không có bản ghi
  nào** — không thể kết luận "không có sóng", chỉ kết luận "không
  có bằng chứng trong các bản ghi còn tồn tại". Sóng gần nhất vẫn
  là **~11:55–12:11Z** (R7) — ~11h29' trước probe #12. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 206 dòng / 75 file** (phạm vi
  2.494 file) — source thật **96** (+1 vs T9), mẫu trong docs
  **110** (+8 vs T9). Đối chiếu phương pháp R7 cũ: **236 dòng /
  11.890 file**; đối chiếu chéo 206 + 25 bản copy = 231, chênh +5
  giải thích được hết (2 file probe mới của U3/U7 đợt 93 xuất hiện
  giữa hai lần find — xem §3.3). **Không còn đường ghi production
  nào chưa nối helper.** Async `fs.writeFile(` production ngoài
  helper: **0**.
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).
- **RAM: 3 mẫu MemAvailable 1119 / 978 / 1022 MB (max 1119 MB =
  18,2% ngưỡng guard 6144 MB)** — birefnet KHÔNG chạy, đúng quyết
  định parent (T7 đợt 92 max 1707 MB; không có tín hiệu RAM thay
  đổi — RAM nay còn thấp hơn đợt 92).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 23:40:24Z | **DEAD/STALE**, exit 1 — heartbeat n=11, ts 20:38:56Z, boot 14e10da9, age **10.888 s**; last sample probe #11; last start duy nhất 08:49:50Z; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 23:40:34Z | **probe #12, boot=88ebef2e, ok=2 fail=0**, exit 0; có dòng `boot changed 14e10da9 -> 88ebef2e` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 23:40:34Z | **ALIVE**, age 6 s, n=12, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 28 dòng, trước lượt 25 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=12, ts
23:40:34Z, pid=6470, boot 88ebef2e-b6ba-4cd5-99ca-7edebabe4101).

## 2. Điều tra khoảng mù kể từ probe #11

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 23:40–23:43Z)

- Boot hiện tại: `uptime -s` = **2026-11-11 23:33:21Z** (lần đọc đầu;
  lần đọc sau qua log probe cũng 23:33:21 — khớp), uptime 6' lúc
  23:40:24Z. boot_id `88ebef2e-b6ba-4cd5-99ca-7edebabe4101` — khác
  boot của probe #11 (14e10da9).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa từng được
  start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 88ebef2e…,
  first entry 23:33:31Z, last 23:39:39Z). `last -x reboot`: chỉ 1
  dòng (23:33, still running). wtmp bắt đầu 23:33:31Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 23:40:34Z ghi vào log chỉ ghi
  **14e10da9 → 88ebef2e** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối).

### 2.2 Hai lần reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 11 | ~21:35:58Z | 14e10da9 → 09e8d2af | T9 đã phát hiện trong lượt (21:41Z, ~5' sau reboot) và ghi trong LIMITS T9 §9.1; giết script chờ đầu tiên của T9, xóa /tmp, giết server scratch T1 + vite 5173 của T2 |
| 12 | 23:33:21Z | 09e8d2af → 88ebef2e | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 23:33:31Z); `last -x reboot` (23:33, still running); wtmp bắt đầu 23:33:31Z. **KHÔNG ai ghi nhận trước probe #12** (grep `23:33`/`88ebef` trong build-loop-log + memory log 11/11, 12/11 = 0 hit; không file `round93-*.md` nào tồn tại lúc 23:40Z) |

Chu kỳ reboot nay là **12 lần trong ~27h** (từ ~20:18Z 10/11 tới
23:33:21Z 11/11) — trung bình ~2h16'/lần. Mọi probe nền đều chết
theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
phục bằng 1 mẫu mới.

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 92

Khoảng mù 20:38:56Z → 23:40:34Z (~182') được phủ bởi các luồng
sibling đợt 92 (làm việc tới ~22:34Z) + closing của parent (tới
22:40:42Z) và hoàn toàn mù từ 22:40:42Z → 23:40:34Z (~60').
Đã đọc lại log thật của các luồng (grep `eperm|EPERM|reboot` trên
`round92-t*.md` + mtime của `hidden_files/` và `docs/`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| T1–T5, T7 (`round92-t1..t5,t7.md`) | ~20:38–22:34Z | **0 lần nhắc EPERM** (grep -c = 0 mỗi file) |
| T6 (`round92-t6.md`, 11 lần nhắc) | ~20:38–22:34Z | Toàn bộ 11 lần đều trong ngữ cảnh **fault-injection LD_PRELOAD shim tự viết** (E1 exit 2, chẩn đoán EPERM đúng — fail có chủ đích); T6 ghi rõ **0 dấu EPERM trong log 5 lần đo thật** |
| T8 (`round92-t8.md`, 7 lần nhắc) | 20:38–20:45Z | Công việc probe của chính T8 (probe #11, khoảng mù #10) — không phải sóng thật |
| T9 (`round92-t9.md`, 1 lần nhắc) | tới ~22:34Z | Chỉ 1 dòng tóm tắt ("EPERM không tuyên bố hết"); O8 Chromium + WebKit chạy **21/21 cả 2 engine** 22:29–22:30Z; vite build PASS 8,39 s; tsc web/desktop 0 — **không ghi nhận EPERM hay sóng nào** |
| Parent closing (LIMITS gộp + build-loop-log) | 22:34–22:40:42Z | Gộp 9 luồng, kiểm chứng tsc 0 / vite build PASS 7,85 s — **không ghi nhận EPERM hay reboot nào** (reboot #11 lúc 21:35:58Z đã được T9 ghi trước đó) |
| 22:40:42Z → 23:40:34Z | — | **Không có bản ghi nào**: `build-loop-log.md` dừng ở 22:40:42Z (closing đợt 92); không file `round93-*.md` nào tồn tại lúc 23:40Z; không file nào trong `hidden_files/` hay `docs/` sửa đổi trong cửa sổ này; `/` dùng 6%, `/tmp` 0% — không ENOSPC |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **60 phút cuối (22:40:42Z → 23:40:34Z) là mù hoàn
  toàn**, đủ dài để chứa một sóng ~16 phút mà không để lại dấu vết
  nào trong hồ sơ — và đã chứng minh chứa được một reboot (#12,
  23:33:21Z) mà không ai ghi nhận.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~11h29' trước probe
  #12. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- Reboot #12 là reboot thứ hai liên tiếp **không được bất kỳ ai ghi
  nhận trong lúc nó xảy ra** (sau #10) — chỉ được phát hiện nhờ
  probe #12 của lượt này. Reboot #11 là ngoại lệ: T9 phát hiện trong
  lượt vì đang chạy lúc đó.
- Reboot trung gian khác trong 22:40:42Z → 23:33:21Z không loại trừ
  được (journal/wtmp chỉ giữ boot hiện tại; dòng `boot changed`
  gộp mọi reboot trung gian). Trong 20:38:56Z → 22:40:42Z, hoạt động
  liên tục của T1–T9 + closing làm một reboot không-ai-thấy khó xảy
  ra (một reboot sẽ giết phiên đang chạy, như #11 đã giết script
  chờ của T9) — nhưng không chứng minh tuyệt đối được.

### 2.4 Bảng 11 lần chết / khoảng mù (cập nhật từ bảng 10 lần của T8 §2.4)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1 | K8 (đợt 83) | #5 18:21Z 10/11 | 18:21–18:31Z | **Chưa rõ** — chết trước reboot kế (~20:18Z) ~2h; giả thuyết mạnh nhất: runtime dọn phiên (GC); không loại trừ reboot trung gian |
| 2 | L6 (đợt 84) | #10 22:18:49Z 10/11 | 22:18–22:28Z | **Chưa rõ** — chết trước reboot kế (~23:28Z) ~60'; cùng giả thuyết GC |
| 3 | M5 (đợt 85) | #11 01:21:56Z 11/11 | 01:22–01:32Z | **Chưa rõ** — chết trước reboot kế (~02:03Z) ~30–40'; cùng giả thuyết GC |
| 4 | N8 (đợt 86) | #5 03:19:38Z | 03:19–03:29Z | **Chưa rõ** — không đủ dữ kiện uptime lúc đó |
| 5 | O10 (đợt 87) | #9 07:13:35Z | 07:13–07:23Z | **Chưa rõ** — chết trước reboot 08:24:39Z ~60'; khoảng mù 07:13–08:49Z không quan sát |
| 6 | v2 loop 13674 (đợt 88) | #5 09:19:52Z | chết ~09:21:17Z | **CHẮC CHẮN: reboot 09:21:17Z** — lần đầu tiên một cái chết có nguyên nhân ghi nhận (boot d473b560 → e10b9199) |
| 7 | — (đợt 89 Q8) | #6 09:41:01Z | mù 09:41:01–11:37:37Z (~116') | **Không có observer** (không loop nào được start sau #6) + **reboot 11:34:38Z** ở cuối khoảng mù (boot e10b9199 → 7439870b); không loại trừ reboot trung gian khác |
| 8 | — (đợt 89, sau Q8) | #7 11:37:37Z | mù 11:37:37–14:44:26Z (~187') | **Không có observer + SÓNG EPERM ~11:55–12:11Z (2 nhân chứng Q1/Q7) + reboot 13:21:06Z** (boot 7439870b → 62b088d2). **Lần đầu tiên một khoảng mù được chứng minh là có chứa sóng** |
| 9 | — (đợt 90 R7 → đợt 91 S7) | #9 14:51:17Z | mù 14:51:17–17:39:23Z (~168') | **Không có observer + 2 REBOOT ĐÃ XÁC NHẬN** (~15:29Z → 0799d357; 17:24:01Z → 182a689e). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (R4/R5/R6/R8/R1/R3 tới ~15:57Z); nhưng **~87' cuối (15:57Z → 17:24Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 10 | — (đợt 91 S7 → đợt 92 T8) | #10 17:39:23Z | mù 17:39:23–20:38:56Z (~180') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 19:22:48Z** (→ 14e10da9, **không ai ghi nhận lúc xảy ra** — chỉ probe #11 phát hiện). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (S1–S9 tới ~19:20Z + closing tới 19:37:20Z); nhưng **~62' cuối (19:37:20Z → 20:38:56Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 11 | — (đợt 92 T8 → đợt 93 U8) | #11 20:38:56Z | mù 20:38:56–23:40:34Z (~182') | **Không có observer + 2 REBOOT ĐÃ XÁC NHẬN** (~21:35:58Z → 09e8d2af, T9 ghi trong lượt; **23:33:21Z → 88ebef2e, không ai ghi nhận lúc xảy ra — chỉ probe #12 phát hiện**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (T1–T9 tới ~22:34Z + closing tới 22:40:42Z; T6 chỉ có EPERM do fault-injection tự viết); nhưng **~60' cuối (22:40:42Z → 23:40:34Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — áp dụng danh sách loại trừ chuẩn mới

### 3.1 Phương pháp (chuẩn mới, áp dụng từ đợt 91 theo quyết định parent đợt 90 mục 7)

`find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/*.py/*.md`, loại:
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server` ở gốc — như R7 — **cộng
thêm loại trừ chuẩn mới: mọi thư mục tên `release*` hoặc `build` ở
MỌI cấp** (`release*/**` + `build/**`). Đếm theo **dòng**
(`xargs -0 grep -c writeFileSync` trên danh sách NUL-delimited),
chỉ tính file có count > 0 — như S7/T8 (đã sửa lỗi lần quét đầu của
S7/T8).

Để đối chiếu, U8 chạy cả hai phạm vi: chuẩn mới và phương pháp R7 cũ
(chỉ loại `release*`/`bundled-server`/`assets` ở **gốc**, giữ nguyên
base prune như chuẩn mới).

**Lỗi phương pháp lúc đầu của U8 (đã sửa, ghi ở đây như T8 §4):**
lần quét R7-cũ đầu tiên của script `scan-wfs.sh` quên base prune
(node_modules/.venv*) nên ra **70.802 file / 441 dòng** — trong đó
205 dòng là vendored deps (node_modules/.venv/dist), không thuộc
phạm vi của cả hai phương pháp. Đã chạy lại đúng (R7b): **11.890
file / 236 dòng**. Số cuối dùng là số chạy lại. Lỗi tương tự ở bước
trích bản copy: regex đầu tiên bắt cả 4 dòng `node_modules` (3 file
`mime/src/build.js` nằm dưới `node_modules` trong `release*/` và
`build/`, + 1 file `node_modules/simple-update-notifier/build/
index.js`) — đã loại khi đối chiếu, bản copy đúng phạm vi là **25
dòng / 17 file**, khớp T8/S7.

### 3.2 Kết quả (snapshot 23:43:13–23:46:49Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | T9 (~22:33Z) | T8 (~20:40Z) |
|---|---|---|---|---|
| File trong phạm vi quét | **2.494** | 11.890 | 2.490 / — | 2.477 / 11.869 |
| Source code thật | **96** | 96 | 95 | 92 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 | 22 |
| Mẫu trong docs (*.md) | **110** | 110 | 102 | 94 |
| **Tổng writeFileSync (dòng)** | **206** | **236** | **197** | **186** |

Đối chiếu chéo: chuẩn mới 206 + bản copy 25 (3 build + 22 release)
= **231**; R7b = **236** — chênh **+5, giải thích được hết** (xem
§3.3). Hit list chuẩn mới có **0 đường dẫn chứa `release*/` hay
`build/`** (verify bằng grep — 0 hit).

**Chi tiết source thật 96 dòng** (T9: 95, **+1**):

| Thư mục | Dòng | So với T9 |
|---|---|---|
| apps/web/scripts | 54 | 53 → 54 (+1) |
| apps/web/src | 5 | = |
| apps/desktop/src | 25 | = |
| server | 11 | = |
| mcp-server/src | 1 | = |

**Docs 110 dòng** (T9: 102, **+8**): +5 từ chính file LIMITS của
T9 (`PHASE9_ROUND92_T9_VERIFY_LIMITS.md`, viết sau khi T9 quét),
+2 từ LIMITS gộp đợt 92 (`PHASE9_ROUND92_LIMITS.md`, closing
22:40:16Z), +1 từ `PHASE9_GAP_ANALYSIS.md` (§21 mới ở closing,
22:39:58Z — nay 6 lần nhắc, T9 quét lúc còn 5) — toàn là tài liệu
trích dẫn `writeFileSync` trong văn bản, không chạy.

### 3.3 Giải thích chênh +5 giữa đối chiếu chéo (231) và R7b (236)

2 file xuất hiện **giữa hai lần find** (chuẩn mới chạy 23:43:13Z,
R7b chạy ~23:47Z) — các luồng đợt 93 đang ghi file song song trong
lúc U8 quét:

- `apps/web/scripts/probe93u3-rvfc-webkit.mjs` — **4 dòng** (luồng
  U3 đợt 93, harness đo rVFC WebKit mới).
- `apps/web/scripts/probe93u7-q5-timing-flake.mjs` — **1 dòng**
  (luồng U7 đợt 93, harness timing Q5 mới).

4 + 1 = 5, khớp đúng chênh lệch. Cả hai đều là harness đo một lần
mới của đợt 93, không phải đường ghi production. (Cảnh báo cho lượt
sau: quét trong lượt nhiều luồng song song là snapshot động — xem
§4 mục 4.)

**Giải thích +1 source vs T9:** `apps/web/scripts` 53 → 54. File
probe mới của U3 đợt 93 (`probe93u3-stall-evidence.mjs`, 1 dòng,
mtime 23:49:55Z) là ứng viên duy nhất — 2 file
`clicktest-87o8-mask-track-*.mjs` (mỗi 1 dòng) chỉ bị chạm mtime
lúc 23:44Z (một luồng sibling chạy lại O8) chứ số dòng không đổi.
Lưu ý trung thực: snapshot per-file của T9 không còn trên đĩa
(scratch T9 trong /tmp đã mất sau reboot #12) nên attribution +1
này là suy luận có căn cứ từ mtime + số dòng theo thư mục, không
phải đếm đối chiếu trực tiếp từng file.

### 3.4 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`:
**4 hit** —

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.
- 2 hit asset JS vendored của Gradio trong `server/tts/.venv2/…`
  (`worker-BzdDEeh7.js`, `Video-C27INCFQ.js`) — API `writeFile` của
  ffmpeg.wasm FS trong bộ nhớ (virtual FS), không phải ghi đĩa Node
  — R7/S7/T8/T9 đã ghi, không tính là đường ghi production.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 96 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. U8 quên base prune
   ở lần đầu → 70.802 file / 441 dòng (205 dòng vendored deps);
   đã chạy lại đúng (R7b 11.890 file / 236 dòng).
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find (U8: 2 file probe
   U3/U7, +5 dòng). Ghi rõ cửa sổ snapshot (23:43:13–23:46:49Z) và
   đối chiếu chéo số chênh, đừng ép hai lần quét phải khớp tuyệt
   đối khi cây đang đổi.
5. Scratch quét để trong
   `hidden_files/round93-u8/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #12 OK 2/2) — và 60 phút cuối khoảng mù #11 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~11h29' trước
   probe #12.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài
   giây, không giữ tiến trình nền). U8 KHÔNG tự tạo, KHÔNG start
   loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa: khoảng mù
   #11 dài ~182' chứa **2 reboot**, trong đó **#12 hoàn toàn
   không-ai-ghi-nhận** — 4 khoảng mù liên tiếp (#8, #9, #10, #11)
   đều chứa reboot; khoảng mù #8 đã chứng minh có thể chứa cả một
   sóng đầy đủ.
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3; 3 dòng lạ 11:59–12:00Z vẫn còn trong
   log, không thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h16'/lần** (12 lần/~27h): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 3 mẫu 1119 / 978 /
   1022 MB (max 1119 MB = 18,2% ngưỡng 6144 MB), thấp hơn cả max
   đợt 92 (1707 MB). Đúng quyết định parent đợt 92 §3 mục 7: chỉ
   thử lại khi có tín hiệu RAM thay đổi. Birefnet-general vẫn 0 lần
   chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND93_U8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round93-u8-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u8.md`
(log luồng); scratch quét trong `hidden_files/round93-u8/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`, `r7b-files.txt`,
`newstd-files.txt`, `copies-files.txt`, `newstd-copies-union.txt` —
lần quét R7-cũ lỗi đầu `files-r7method.bin`/`wfs-r7method.txt`
(70.802 file, nhiễm node_modules) KHÔNG dùng, chỉ giữ để đối chiếu
lỗi phương pháp); log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
