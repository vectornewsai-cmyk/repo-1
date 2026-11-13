# PHASE9 ROUND92 T8 — EPERM: checklist probe v2 + khoảng mù #10 + quét writeFileSync (nợ LIMITS gộp đợt 91 §4 mục 8)

> Luồng T8, đợt 92 vòng lặp Phase 9 VCut Studio (lượt cron 03:35 +07,
> 12/11/2026; làm việc ~20:38–20:45Z 11/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #10
> (17:39:23Z 11/11) + quét lại writeFileSync với danh sách loại trừ
> chuẩn mới (S7). KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG
> workflow, KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút,
> KHÔNG start loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 20:38:56Z
  báo **DEAD/STALE** (heartbeat age 10.773 s, last #10 17:39:23Z,
  boot 182a689e, exit 1); `once` ngay sau đó là **probe #11,
  boot 14e10da9 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=11), exit 0.
- **Khoảng mù #10 (mới): 17:39:23Z → 20:38:56Z (~180 phút)** — dài
  thứ hai trong lịch sử probe (sau khoảng mù #8, ~187'). Trong đó có
  **1 lần reboot ĐÃ XÁC NHẬN: 19:22:48Z (→ 14e10da9, reboot thứ 10)**.
  Reboot này **không được ai ghi nhận** trong build-loop-log hay
  memory log — nó rơi vào khe ~5 phút giữa lần ghi cuối của S9
  (19:19:57Z) và lần sửa đầu của parent ở closing (19:25:08Z).
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (S6 ghi rõ 0 dấu EPERM trong 5 lần đo; S1–S5/S9
  không nhắc EPERM lần nào; O8 chạy xanh 19:11–19:14Z). Nhưng
  **~62 phút cuối khoảng mù (19:37:20Z → 20:38:56Z) hoàn toàn không
  có bản ghi nào** — không thể kết luận "không có sóng", chỉ kết luận
  "không có bằng chứng trong các bản ghi còn tồn tại". Reboot trung
  gian khác trong 17:39Z → 19:22Z cũng không loại trừ được
  (journal/wtmp chỉ giữ boot hiện tại) — dù hoạt động liên tục của
  S1–S9 tới ~19:20Z làm một reboot không-ai-thấy trong đoạn đó khó
  xảy ra (một reboot sẽ giết phiên đang chạy, như reboot 15:29Z đã
  giết R8).
- **Quét writeFileSync với danh sách loại trừ chuẩn mới: 186 dòng
  trong 68 file** — source thật **92** (+4 so với S7, toàn bộ là 4
  harness đo một lần mới của đợt 91: probe91s1 ×3 + probe91s2 ×1),
  mẫu trong docs **94** (+13: 12 từ 3 file LIMITS mới của đợt 91 +
  1 từ §20 mới của GAP_ANALYSIS ở closing). **Không còn đường ghi
  production nào chưa nối helper.** Async `fs.writeFile(` production:
  **0** ngoài helper (2 hit đều là chính lệnh ghi của helper:
  `epermRetry.js:116` + `eperm-retry.mjs:71`; 2 hit còn lại là asset
  JS vendored của Gradio — API `writeFile` của ffmpeg.wasm FS trong
  bộ nhớ, không phải ghi đĩa Node, như R7/S7 đã ghi).
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 20:38:56Z | **DEAD/STALE**, exit 1 — heartbeat n=10, ts 17:39:23Z, boot 182a689e, age **10.773 s**; last sample probe #10; last start duy nhất 08:49:50Z; `=== probe end`: none |
| `bash scripts/probe-eperm-v2.sh once` | 20:38:56Z | **probe #11, boot=14e10da9, ok=2 fail=0**, exit 0; có dòng `boot changed 182a689e -> 14e10da9` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 20:38:56Z | **ALIVE**, age 0 s, n=11, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (nay n=11, ts 20:38:56Z,
boot 14e10da9-bc05-46ae-9fc4-8b438913fb86).

## 2. Điều tra khoảng mù kể từ probe #10

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 20:38–20:44Z)

- Boot hiện tại: `uptime -s` = **2026-11-11 19:22:48Z** (lần đọc đầu;
  lần đọc sau 19:22:49Z — chênh 1 s do làm tròn giây; log probe ghi
  19:22:48), uptime 1h16' lúc 20:38:56Z. boot_id
  `14e10da9-bc05-46ae-9fc4-8b438913fb86` — khác boot của probe #10
  (182a689e).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa từng được
  start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 14e10da9…,
  first entry 19:22:58Z, last 20:39:38Z). `last -x reboot`: chỉ 1
  dòng (19:22, still running). wtmp bắt đầu 19:22:58Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 20:38:56Z ghi vào log chỉ ghi
  **182a689e → 14e10da9** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối).

### 2.2 Một lần reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận |
|---|---|---|---|
| 10 | 19:22:48Z | 182a689e → 14e10da9 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 19:22:58Z); `last -x reboot` (19:22, still running); wtmp bắt đầu 19:22:58Z |

**Phát hiện mới của lượt này: reboot #10 KHÔNG được ai ghi nhận.**
Đã grep `19:22`, `reboot thứ 10`, `boot 14e10` trong
`build-loop-log.md` và `~/memory/2026-11-12.md`: **0 hit**.
Build-loop-log dừng ở 19:37:20Z với entry closing đợt 91 (chỉ nhắc
reboot 17:24Z); memory log ngày 12/11 (mtime 19:38Z) cũng không nhắc.
Reboot rơi vào khe giữa lần ghi cuối của S9 (`round91-s9.md`
19:19:57Z) và lần sửa đầu của parent ở closing (LIMITS S3
19:25:08Z) — đúng lúc không có agent nào đang ghi file. Parent
làm closing 19:25–19:37Z (sau reboot) mà không nhận ra VM vừa
reboot — một reboot có thể đi qua không-ai-thấy ngay cả trong lúc
closing đang chạy, nếu nó rơi vào khe yên.

Chu kỳ reboot nay là **10 lần trong ~23h** (từ ~20:18Z 10/11 tới
19:22:48Z 11/11: ~20:18Z, ~23:28Z, ~02:03Z, 08:24:39Z, 09:21:17Z,
11:34:38Z, 13:21:06Z, ~15:29Z, 17:24:01Z, 19:22:48Z) — trung bình
~2h18'/lần. Mọi probe nền đều chết theo reboot; v2 chỉ đảm bảo cái
chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu mới.

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 91

Khoảng mù 17:39:23Z → 20:38:56Z (~180') được phủ một phần bởi các
luồng sibling đợt 91 (làm việc tới ~19:20Z) + closing của parent
(tới 19:37:20Z) và hoàn toàn mù từ 19:37:20Z → 20:38:56Z (~62').
Đã đọc lại log thật của các luồng (grep `eperm|EPERM|reboot` trên
`round91-s*.md` + `find -newermt` để xác định mốc thời gian):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| S1–S5 (`round91-s1..s6.md`, LIMITS 17:46–18:44Z) | ~17:38–18:44Z | S6 ghi rõ **0 dấu EPERM trong log cả 5 lần đo** (grep 0); S1–S5 không nhắc EPERM lần nào; S3 bắt đầu 17:38Z ngay sau reboot 17:24Z, khôi phục GStreamer + chạy encode bình thường |
| S9 (`round91-s9.md`, O8 logs) | tới ~19:20Z | O8 Chromium + WebKit chạy **21/21 cả 2 engine** 19:11–19:14Z; không nhắc EPERM; `round91-s9.md` mtime cuối 19:19:57Z |
| Parent closing (LIMITS gộp + đính chính css60) | 19:25–19:37:20Z | Sửa literal P7, chạy lại P7 8/8, css60 59/59, tsc 0, vite build PASS — **không ghi nhận EPERM hay reboot nào** (reboot 19:22:48Z đi qua không-ai-thấy, xem §2.2) |
| 19:37:20Z → 20:38:56Z | — | **Không có bản ghi nào**: `build-loop-log.md` dừng ở 19:37:20Z (closing đợt 91); không file `round92-*.md` nào tồn tại lúc 20:38Z; không file nào trong `hidden_files/` (trừ probe #11) hay `docs/` sửa đổi trong cửa sổ này; `/tmp` chỉ còn 2% đã dùng, `/` 7% — không ENOSPC |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". Khác với khoảng mù #8 (R7 đã chứng minh có sóng
  11:55–12:11Z nhờ 2 nhân chứng), khoảng mù #10 chỉ được phủ tới
  19:37Z; **62 phút cuối (19:37:20Z → 20:38:56Z) là mù hoàn toàn**,
  đủ dài để chứa một sóng ~16 phút mà không để lại dấu vết nào trong
  hồ sơ.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~8h27' trước probe
  #11. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- Reboot #10 (19:22:48Z) là reboot đầu tiên **không được bất kỳ ai
  ghi nhận trong lúc nó xảy ra** — chỉ được phát hiện nhờ probe #11
  của lượt này. Đây là bằng chứng trực tiếp rằng khoảng mù không chỉ
  giấu sóng EPERM mà còn giấu cả reboot.

### 2.4 Bảng 10 lần chết / khoảng mù (cập nhật từ bảng 9 lần của S7 §2.4)

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

## 3. Quét writeFileSync — áp dụng danh sách loại trừ chuẩn mới

### 3.1 Phương pháp (chuẩn mới, áp dụng từ đợt 91 theo quyết định parent đợt 90 mục 7)

`find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/*.py/*.md`, loại:
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server` ở gốc — như R7 — **cộng
thêm loại trừ chuẩn mới: mọi thư mục tên `release*` hoặc `build` ở
MỌI cấp** (`release*/**` + `build/**`). Đếm theo **dòng**
(`xargs -0 grep -c writeFileSync` trên danh sách NUL-delimited),
chỉ tính file có count > 0 — như S7 (đã sửa lỗi lần quét đầu của S7).

Để đối chiếu, T8 chạy cả hai phạm vi: chuẩn mới và phương pháp R7 cũ
(chỉ loại `release*`/`bundled-server` ở gốc).

### 3.2 Kết quả (snapshot ~20:40–20:43Z)

| Nhóm | Chuẩn mới | R7 cũ (đối chiếu) | S7 (~17:40Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.477** | 11.869 | 2.457 / 11.847 |
| Source code thật | **92** | 92 | 88 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **94** | 94 | 81 |
| **Tổng writeFileSync (dòng)** | **186** | **211** | **169 / 194** |

Đối chiếu chéo khớp hoàn toàn: chuẩn mới 186 + bản copy 25
(3 build + 22 release) = **211** = tổng phương pháp R7 cũ; S7:
169 + 25 = 194. Delta tổng **+17 dòng** so với S7, toàn bộ giải
thích được (xem §3.3). Hit list chuẩn mới có **0 đường dẫn chứa
`release*/` hay `build/`** (verify bằng grep).

**Chi tiết source thật 92 dòng** (S7: 88, **+4**):

| Thư mục | Dòng | So với S7 |
|---|---|---|
| apps/web/scripts | 50 | 46 → 50 (+4) |
| apps/web/src | 5 | = |
| server | 11 | = |
| apps/desktop/src | 25 | = |
| mcp-server/src | 1 | = |

**Giải thích +4 dòng source (đều là harness đo một lần mới của đợt
91, không phải đường ghi production):**

- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs:1` — probe đo
  rVFC motion blur của S1 đợt 91.
- `apps/web/scripts/probe91s1-motionblur-rvfc-light.cdp.mjs:1` —
  probe đo rVFC bản nhẹ của S1 đợt 91.
- `apps/web/scripts/probe91s1-pause-edge-sweep.cdp.mjs:1` — probe
  sweep mép pause của S1 đợt 91.
- `apps/web/scripts/probe91s2-playhead-sawtooth.mjs:1` — probe đo
  sawtooth playhead của S2 đợt 91.

**Docs 94 dòng** (S7: 81, +13): 12 dòng từ 3 file LIMITS mới của
đợt 91 (`PHASE9_ROUND91_S7_EPERM_PROBE_LIMITS.md:9`,
`PHASE9_ROUND91_S9_VERIFY_LIMITS.md:1`,
`PHASE9_ROUND91_LIMITS.md:2`) + 1 dòng từ `PHASE9_GAP_ANALYSIS.md`
(§20 mới do parent thêm ở closing đợt 91) — toàn là tài liệu trích
dẫn `writeFileSync` trong văn bản, không chạy.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`:
**4 hit** —

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web (S7 chỉ quét 4 thư mục production chính nên không liệt kê
  hit này; nó là helper, không phải đường ghi mới).
- 2 hit asset JS vendored của Gradio trong `server/tts/.venv2/…`
  (`worker-BzdDEeh7.js`, `Video-C27INCFQ.js`) — API `writeFile` của
  ffmpeg.wasm FS trong bộ nhớ (virtual FS), không phải ghi đĩa Node
  — R7/S7 đã ghi, không tính là đường ghi production.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 92 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. Lần quét đầu của T8 đếm **186 dòng trên 2.477 file** vì `awk`
   cộng cả file count=0 (grep -c in ra 0 cho file không match).
   Đã chạy lại đúng bằng cách chỉ cộng file có count > 0 — số cuối
   là số chạy lại (68 file / 186 dòng), không phải số lần đầu. Bài
   học (nối tiếp lỗi grep -c của S7 §4 mục 1): **luôn lọc count > 0
   trước khi cộng**.
2. Phương pháp R7 cũ lần đầu của T8 cũng sai: `grep -z -v
   '^\./apps/desktop/release'` loại cả bản copy dưới
   `apps/desktop/release*/` trong khi phương pháp R7 chỉ loại
   `release*` ở **gốc**. Đã chạy lại đúng (chỉ loại `^\./release`,
   `^\./bundled-server/`, `^\./assets/`): 11.869 file / 211 dòng —
   khớp chéo với chuẩn mới (186 + 25 bản copy).
3. Scratch quét của S7 trong `/tmp` đã mất sau reboot (reboot xóa
   /tmp) — không đối chiếu được per-file với S7; delta được giải
   thích bằng file mới của đợt 91 (4 probe + 3 LIMITS + §20 GAP),
   khớp từng dòng.
4. Helper tests (gốc 22/22, CJS 8/8, desktop 11/11 — R7 chạy xanh
   ~15:00Z) **không chạy lại trong luồng này** (ngoài phạm vi T8;
   không file helper nào bị sửa từ lúc đó).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #11 OK 2/2) — và 62 phút cuối khoảng mù #10 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~8h27' trước
   probe #11.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài
   giây, không giữ tiến trình nền). T8 KHÔNG tự tạo, KHÔNG start
   loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa: khoảng mù
   #10 dài ~180' với **một reboot hoàn toàn không-ai-ghi-nhận** —
   observer 3h/lượt đã để lọt 3 khoảng mù liên tiếp có chứa reboot
   (#8, #9, #10), khoảng mù #8 đã chứng minh có thể chứa cả một
   sóng đầy đủ, và giờ đã chứng minh reboot cũng có thể đi qua
   không-ai-thấy ngay cả trong lúc closing đang chạy.
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không thêm
   dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h18'/lần** (10 lần/~23h): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
7. **Không thêm i18n key** (không đụng UI/chuỗi hiển thị).
8. RAM khả dụng lúc 20:43Z chỉ **962 MB** (tổng 7934 MB) — VM vẫn
   nặng tải sau reboot; birefnet vẫn không đủ điều kiện (xem S8 đợt
   91).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND92_T8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round92-t8-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t8.md`
(log luồng); log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
Scratch quét: `/tmp/t8-scan.sh`, `/tmp/t8-files-newstd.bin`,
`/tmp/t8-wfs-newstd.txt`, `/tmp/t8-files-r7method.bin`,
`/tmp/t8-wfs-r7method.txt`, `/tmp/t8-files-r7b.bin`, `/tmp/t8-wfs-r7b.txt`
(lần quét lỗi đầu `/tmp/t8-wfs-r7method.txt` không dùng; không stage).
