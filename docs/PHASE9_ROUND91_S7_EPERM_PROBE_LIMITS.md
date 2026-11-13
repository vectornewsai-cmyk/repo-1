# PHASE9 ROUND91 S7 — EPERM: checklist probe v2 + điều tra khoảng mù sau probe #9 + quét writeFileSync (danh sách loại trừ chuẩn mới)

> Luồng S7, đợt 91 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 12/11/2026; làm việc ~17:38–17:48Z 11/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #9
> (14:51Z 11/11) + quét lại writeFileSync với danh sách loại trừ chuẩn
> mới (parent chốt đợt 90 mục 7: loại `release*/**` + `build/**`).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 17:38:54Z
  báo **DEAD/STALE** (heartbeat age 10.057 s, last #9 14:51:17Z,
  boot 62b088d2, exit 1); `once` ngay sau đó là **probe #10,
  boot 182a689e (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=10), exit 0.
- **Khoảng mù #9 (mới): 14:51:17Z → 17:39:23Z (~168 phút)** — dài
  thứ hai trong lịch sử probe (sau khoảng mù #8, ~187'). Trong đó
  có **2 lần reboot ĐÃ XÁC NHẬN**: ~15:28–15:29Z (boot 62b088d2 →
  0799d357, reboot thứ 8 — R8 đợt 90 ghi nhận) và **17:24:01Z**
  (→ 182a689e, reboot thứ 9, boot hiện tại). Loop probe v2 chắc
  chắn đã chết theo reboot 15:29Z (và chết lần nữa theo reboot
  17:24Z) — đúng như task dự báo.
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (R4/R5/R6 làm việc tới ~15:11–15:15Z đều ghi rõ
  không gặp sóng; R8 làm tới 15:50Z chỉ ghi ENOSPC + reboot, không
  EPERM; R1/R3 khôi phục sau reboot không báo EPERM). Nhưng **~87
  phút cuối khoảng mù (15:57Z → 17:24Z) hoàn toàn không có bản ghi
  nào** — không thể kết luận "không có sóng", chỉ kết luận "không có
  bằng chứng trong các bản ghi còn tồn tại". Reboot trung gian khác
  trong 15:29Z → 17:24Z cũng không loại trừ được (journal/wtmp chỉ
  giữ boot hiện tại).
- **Quét writeFileSync với danh sách loại trừ chuẩn mới
  (loại `release*/**` + `build/**` ở mọi cấp): 169 dòng trong 61
  file** — source thật **88** (+2 so với R7, đều là harness đo
  một lần mới của đợt 90), mẫu trong docs **81** (+13, toàn LIMITS
  đợt 90 mới). **Không còn đường ghi production nào chưa nối
  helper.** Async `fs.writeFile(` production: **0** ngoài helper
  (hit duy nhất là chính `epermRetry.js:116` — lệnh ghi của helper).
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 17:38:54Z | **DEAD/STALE**, exit 1 — heartbeat n=9, ts 14:51:17Z, boot 62b088d2, age **10.057 s**; last sample probe #9; last start duy nhất 08:49:50Z; `=== probe end`: none |
| `bash scripts/probe-eperm-v2.sh once` | 17:39:23Z | **probe #10, boot=182a689e, ok=2 fail=0**, exit 0; có dòng `boot changed 62b088d2 -> 182a689e` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 17:39:23Z | **ALIVE**, age 0 s, n=10, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (nay n=10, ts 17:39:23Z,
boot 182a689e-7ba0-4275-b7de-199c039d4a2f).

## 2. Điều tra khoảng mù kể từ probe #9

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 17:38–17:47Z)

- Boot hiện tại: `uptime -s` = **2026-11-11 17:24:01Z**, uptime
  14 phút lúc 17:38:34Z. boot_id
  `182a689e-7ba0-4275-b7de-199c039d4a2f` — khác boot của probe #9
  (62b088d2).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa từng được
  start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 182a689e…).
  `last -x reboot`: chỉ 1 dòng (17:24Z). wtmp bắt đầu 17:24:10Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `status` 17:38:54Z ghi vào log chỉ ghi
  **62b088d2 → 182a689e** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối). Reboot trung gian
  0799d357 chỉ biết được nhờ bản ghi của R8 đợt 90, không phải nhờ
  log probe.

### 2.2 Hai lần reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận |
|---|---|---|---|
| 8 | ~15:28–15:29Z | 62b088d2 → 0799d357 | `round90-r8.md` §"Sự cố môi trường 15:27–15:29Z" (uptime 1 phút lúc 15:29Z; waiter poller bị giết ở poll 4, 15:27:35Z; R1/R2/R3 vẫn `running` sau reboot nhờ runtime resume) + `build-loop-log.md` + LIMITS gộp đợt 90 §2 |
| 9 | 17:24:01Z | 0799d357 → 182a689e | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 17:24:10Z); `last -x reboot` (17:24, still running) |

Chu kỳ reboot nay là **9 lần trong ~21h** (từ ~20:18Z 10/11 tới
17:24Z 11/11: ~20:18Z, ~23:28Z, ~02:03Z, 08:24:39Z, 09:21:17Z,
11:34:38Z, 13:21:06Z, ~15:29Z, 17:24:01Z) — trung bình ~2h20'/lần.
Mọi probe nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được
ghi nhận + lượt sau hồi phục bằng 1 mẫu mới.

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 90

Khoảng mù 14:51:17Z → 17:39:23Z (~168') được phủ một phần bởi các
luồng sibling đợt 90 (làm việc tới ~15:57Z) và hoàn toàn mù từ
15:57Z → 17:24Z (~87'). Đã đọc lại log thật của các luồng (grep
`eperm|EPERM|reboot` + `find -newermt` để xác định mốc thời gian):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| R4 (`round90-r4.md`) | ~14:50–15:15Z | **Không gặp sóng EPERM trong luồng này** (ghi rõ trong log) |
| R5 (`round90-r5.md`) | tới ~15:11Z | **Không gặp sóng EPERM, không reboot** (ghi rõ); ghi file test OK |
| R6 (`round90-r6.md`) | 15:02–15:11Z (3 lần đo 60fps) | **0 lỗi trang; không dấu EPERM trong log 3 lần đo**; vite log có nội dung 159 byte (không phải 0-byte do EPERM) |
| R8 (`round90-r8.md`) | tới 15:50Z, xuyên reboot 15:29Z | Không có dòng EPERM nào; sự cố ghi nhận là **ENOSPC** (/tmp đầy 97%, do /tmp/q6 stale 410M — đã dọn, chạy lại xanh) + reboot 15:29Z giết P1 lần 1 giữa chừng |
| R1/R3 (log + build-loop-log) | khôi phục sau reboot, tới ~15:42–15:50Z | Khôi phục WebKit (`dpkg-deb -x` + `cp -an`), encode/bundle lại, chạy lại probe — **không báo EPERM** |
| R9 (`round90-r9.md`) | lượt 21:35 | Không nhắc EPERM/reboot (i18n sweep, không đụng ghi file hệ thống) |
| 15:57Z → 17:24Z | — | **Không có bản ghi nào**: `build-loop-log.md` dừng ở 15:57Z (closing đợt 90); chưa có file `round91-*.md` nào lúc 17:38Z; không file nào trong `hidden_files/` hay `docs/` sửa đổi trong cửa sổ này |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". Khác với khoảng mù #8 (R7 đã chứng minh có sóng
  11:55–12:11Z nhờ 2 nhân chứng), khoảng mù #9 chỉ được phủ tới
  15:57Z; **87 phút cuối (15:57Z → 17:24Z) là mù hoàn toàn**, đủ dài
  để chứa một sóng ~16 phút mà không để lại dấu vết nào trong hồ sơ.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~5h45' trước probe
  #10. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- ENOSPC 15:xxZ là chế độ lỗi khác (đĩa đầy, không phải EPERM) —
  không gộp vào hồ sơ sóng; nợ dọn /tmp stale đã có ở LIMITS gộp
  đợt 90 §4 mục 11.

### 2.4 Bảng 9 lần chết / khoảng mù (cập nhật từ bảng 8 lần của R7 §2.3)

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

## 3. Quét writeFileSync — áp dụng danh sách loại trừ chuẩn mới

### 3.1 Phương pháp (chuẩn mới, áp dụng từ đợt 91 theo quyết định parent đợt 90 mục 7)

`find` liệt kê file `*.js/*.ts/*.mjs/*.cjs/*.sh/*.py/*.md`, loại:
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server` ở gốc — như R7 — **cộng
thêm loại trừ chuẩn mới: mọi thư mục tên `release*` hoặc `build` ở
MỌI cấp** (`release*/**` + `build/**`). Đếm theo **dòng**
(`grep -c writeFileSync` từng file), như Q8/R7 để so sánh được.

Để đối chiếu, S7 chạy cả hai phạm vi: phương pháp R7 cũ (chỉ loại
`release*`/`bundled-server` ở gốc) và chuẩn mới.

### 3.2 Kết quả (snapshot ~17:40–17:47Z)

| Nhóm | Chuẩn mới | R7 cũ (đối chiếu) | R7 (~15:00Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.457** | 11.847 | 11.831 |
| Source code thật | **88** | 88 | 86 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **81** | 81 | 68 |
| **Tổng writeFileSync (dòng)** | **169** | **194** | **179** |

Đối chiếu phạm vi: 11.847 − 2.457 = **9.390 file** bị loại thêm bởi
chuẩn mới — trong đó 9.224 file dưới `apps/desktop/build/` và 166
file dưới `apps/desktop/release*/` (đếm trực tiếp từ danh sách file
phương pháp R7). Ngoài `apps/desktop/build`, không còn thư mục `build`
thật nào khác (các `build` còn lại đều nằm trong `.venv*`, vốn đã bị
loại). Hit list chuẩn mới có **0 đường dẫn chứa `release*/` hay
`build/`** (verify bằng grep).

**Chi tiết source thật 88 dòng** (R7: 86, **+2**):

| Thư mục | Dòng | So với R7 |
|---|---|---|
| apps/web/scripts | 46 | 44 → 46 (+2) |
| apps/web/src | 5 | = |
| server | 11 | = |
| apps/desktop/src | 25 | = |
| mcp-server/src | 1 | = |

**Giải thích +2 dòng source (đều là harness đo một lần, không phải
đường ghi production):**

- `apps/web/scripts/probe90r1-motionblur-preview.cdp.mjs:1` —
  probe đo motion blur + mask của R1 đợt 90.
- `apps/web/scripts/probe90r2-playhead-canvas-sync.mjs:1` —
  probe đo playhead/canvas sync của R2 đợt 90.

**Docs 81 dòng** (R7: 68, +13): toàn bộ là các file LIMITS mới của
đợt 90 (R1–R9 + LIMITS gộp) trích dẫn `writeFileSync` trong văn
bản — tài liệu, không chạy.

### 3.3 Async writeFile

`fs.writeFile(` (async) trong code production (`apps/web/src`,
`server`, `apps/desktop/src`, `mcp-server/src`, `cli/src`,
`packages`, `apps/web/scripts`): **0 dòng** ngoài helper — khớp
kết luận P8/Q8/R7. Quét rộng `.writeFile(` (mọi dạng) trên 4 thư
mục production chính, loại test/venv/writeFileSync: hit duy nhất là
**`apps/desktop/src/services/epermRetry.js:116`
(`await f.writeFile(file, data)`) — chính lệnh ghi của helper**,
không phải đường ghi mới. Hit asset JS vendored của Gradio mà R7
đã ghi (`server/tts/.venv2/.../gradio/templates/frontend/assets/`)
vẫn là API `writeFile` của ffmpeg.wasm FS trong bộ nhớ (virtual FS),
không phải ghi đĩa Node — không tính là đường ghi production.

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 88 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. Lần quét đầu của S7 đếm **0 dòng** vì lỗi câu lệnh: `grep -c
   writeFileSync <file-danh-sách>` chỉ đếm trong chính file danh
   sách, không phải trong các file được liệt kê. Đã chạy lại đúng
   bằng `xargs -0 grep -c` trên danh sách NUL-delimited và đối
   chiếu hai phạm vi — số cuối là số chạy lại, không phải số lần đầu.
2. Dòng `boot changed` trong log probe gộp mọi reboot trung gian
   thành một bước nhảy (chỉ so boot của heartbeat với boot hiện
   tại). Reboot 0799d357 chỉ khôi phục được nhờ bản ghi của R8 —
   các lượt sau muốn biết số reboot thật trong khoảng mù thì phải
   đọc log sibling, không tin một mình dòng `boot changed`.
3. Helper tests (gốc 22/22, CJS 8/8, desktop 11/11 — R7 chạy xanh
   ~15:00Z) **không chạy lại trong luồng này** (ngoài phạm vi S7;
   không file helper nào bị sửa từ lúc đó).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #10 OK 2/2) — và 87 phút cuối khoảng mù #9 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~5h45' trước
   probe #10.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once` (vài
   giây, không giữ tiến trình nền). S7 KHÔNG tự tạo, KHÔNG start
   loop nền. Bằng chứng mới (khoảng mù #9 dài 168' với 2 reboot +
   87' hoàn toàn không bản ghi) làm đề xuất này mạnh hơn nữa:
   observer 3h/lượt đã để lọt 2 khoảng mù liên tiếp có chứa reboot,
   và khoảng mù #8 đã chứng minh có thể chứa cả một sóng đầy đủ.
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3;
   3 dòng lạ 11:59–12:00Z vẫn còn trong log, không thêm dòng lạ mới
   trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h20'/lần** (9 lần/~21h): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
7. **Không thêm i18n key** (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND91_S7_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round91-s7-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s7.md`
(log luồng); log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
Scratch quét: `/tmp/s7-files-r7method.bin`, `/tmp/s7-wfs-r7method.txt`,
`/tmp/s7-files-newstd.bin`, `/tmp/s7-wfs-newstd.txt`, `/tmp/s7-files.txt`
(lần quét lỗi đầu — không dùng; không stage).
