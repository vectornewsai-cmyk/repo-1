# PHASE9 ROUND96 X7 — EPERM: probe #15 + khoảng mù #14 (2 reboot) + quét writeFileSync (nợ LIMITS gộp đợt 95 §4 mục 7)

> Luồng X7, đợt 96 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 12/11/2026; làm việc ~08:40–08:46Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #14
> (05:39:27Z) + quét lại writeFileSync bằng script V6/W7
> (`hidden_files/round95-w7/scan-wfs.sh`, copy sang `round96-x7`,
> chỉ đổi thư mục OUT — không đổi logic) + ghi RAM hiện tại
> (birefnet: KHÔNG chạy — không có tín hiệu RAM thay đổi theo hướng
> tăng). KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 08:40:51Z
  báo **DEAD/STALE** (heartbeat age 10.884 s, last #14 05:39:27Z,
  boot 06a92916, exit 1); `once` ngay sau đó là **probe #15,
  boot a3a13d5a (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=15), exit 0.
- **Khoảng mù #14: 05:39:27Z → 08:40:51Z (~181')** — dài tương đương
  khoảng mù #13 (~180'). Trong đó có **2 lần reboot ĐÃ XÁC NHẬN**
  — khoảng mù thứ hai liên tiếp chứa 2 reboot (sau #13):
  **#16 ~07:26–07:34Z (boot adcef40a)** và **#17 08:01:15Z
  (boot a3a13d5a)**.
- **Boot đã xác minh độc lập TRƯỚC khi chạy `once`:**
  `/proc/sys/kernel/random/boot_id` =
  `a3a13d5a-928a-42f8-91d7-c8405a28e1d5`; `who -b` = Nov 12 08:01;
  `uptime -s` = **2026-11-12 08:01:15Z** (uptime 39' lúc đọc
  08:40:42Z) — khớp đúng boot-id và giờ reboot mà parent ghi lúc
  spawn đợt 96 (~08:35Z, uptime 35').
- **Dòng `boot changed` của probe LẠI gộp boot trung gian:**
  `06a92916 -> a3a13d5a`, bỏ qua boot adcef40a (reboot #16) —
  lần thứ hai liên tiếp bài học này lặp lại (khoảng mù #13 cũng
  bỏ qua 0597b689). Boot ghi trong LIMITS này lấy từ `who -b` /
  `uptime -s` riêng, không tin dòng gộp.
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (W6: "0 dấu EPERM trong 12 log đo"; W1–W5: 0 lần
  nhắc; W9: chỉ nhắc tên chủ đề; W8: 1 lần nhắc là ghi chú thiết
  kế retry ~60s — không phải sóng). Nhưng **~50' cuối khoảng mù
  (07:50:48Z → 08:40:30Z) hoàn toàn không có bản ghi nào** — đủ dài
  để chứa nhiều sóng ~16 phút mà không để lại dấu vết, và đã chứng
  minh chứa được một reboot (#17, 08:01:15Z) mà giờ chính xác chỉ
  probe mới chốt được. Sóng gần nhất vẫn là **~11:55–12:11Z**
  (R7) — ~20h29' trước probe #15. EPERM vẫn KHÔNG được tuyên bố
  là đã hết.
- **Quét writeFileSync chuẩn mới: 269 dòng / 94 file** (phạm vi
  2.545 file) — source thật **122** (+10 vs W7), mẫu trong docs
  **147** (+14 vs W7). Đối chiếu phương pháp R7 cũ (R7b):
  **294 dòng**; đối chiếu chéo 269 + 25 bản copy =
  **294, khớp tuyệt đối** — lần thứ ba liên tiếp chênh 0.
  **Không còn đường ghi production nào chưa nối helper.**
  Async `fs.writeFile` production ngoài helper: **0** (không đổi).
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).
- **RAM: 4 mẫu MemAvailable 551 / 507 / 537 / 869 MB** (max 869 MB
  = 14% ngưỡng guard 6144 MB) — mẫu 507 MB là **thấp nhất từng
  ghi** (kỷ lục cũ 695 MB của W7); RAM đi xuống, không có tín hiệu
  tăng — birefnet KHÔNG chạy, đúng quy tắc chỉ thử lại khi RAM đổi
  theo hướng có lợi.

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:40:42Z | boot_id `a3a13d5a-928a-42f8-91d7-c8405a28e1d5`; `who -b` Nov 12 08:01; `uptime -s` **2026-11-12 08:01:15Z** (uptime 39'); journal chỉ 1 boot (a3a13d5a, first entry 08:01:25Z); `last -x reboot` 08:01 still running; wtmp bắt đầu 08:01:25Z |
| `bash scripts/probe-eperm-v2.sh status` | 08:40:51Z | **DEAD/STALE**, exit 1 — heartbeat n=14, ts 05:39:27Z, boot 06a92916, age **10.884 s**; last sample probe #14; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 08:40:51Z | **probe #15, boot=a3a13d5a, ok=2 fail=0**, exit 0; có dòng `boot changed 06a92916 -> a3a13d5a` (GỘP — bỏ qua boot trung gian adcef40a, xem §2.2) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:40:51Z | **ALIVE**, age 0 s, n=15, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 37 dòng, trước lượt 34 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=15, ts
08:40:51Z, pid=6145, boot a3a13d5a-928a-42f8-91d7-c8405a28e1d5).

## 2. Điều tra khoảng mù kể từ probe #14

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 08:40–08:45Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 08:01:15Z**, boot_id
  `a3a13d5a-928a-42f8-91d7-c8405a28e1d5` — khác boot của probe #14
  (06a92916).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, a3a13d5a…,
  first entry 08:01:25Z, last 08:40:25Z). `last -x reboot`: chỉ 1
  dòng (08:01, still running). wtmp bắt đầu 08:01:25Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 08:40:51Z ghi vào log chỉ ghi
  **06a92916 → a3a13d5a** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối). Boot trung gian
  adcef40a chỉ còn trong log của W9 và build-loop-log, không trong
  log probe.

### 2.2 Hai reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 16 | ~07:26–07:34Z (giờ từng giây chưa chốt) | 06a92916 → adcef40a | **W9 quan sát trực tiếp lúc xảy ra:** giết lượt verify.sh của W9 giữa bước U4 (chạy lại sau reboot, U4 xanh 141/141; `round95-w9.md` §"Boot / reboot", verify.log addendum "after runtime restart / reboot #16"). **Kẹp giờ bằng mtime (mới, lượt này):** file cuối cùng trên boot cũ `round95-w3.md` 07:26:03.748Z (W3 về muộn, sau hạn poll 07:20:28Z); file đầu tiên trên boot mới `verify-u4.log` (re-run) 07:34:14.776Z. Ước lượng ~07:25–07:28Z của W9 nằm trong nửa dưới của khoảng kẹp 07:26:03 → 07:34:14 (~8'), nhất quán. Giờ từng giây vẫn chưa chốt. |
| 17 | **08:01:15Z (chính xác từng giây)** | adcef40a → a3a13d5a | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 08:01:25Z); `last -x reboot` (08:01, still running); wtmp bắt đầu 08:01:25Z. Parent ĐÃ ghi boot-id ở lúc spawn đợt 96 (~08:35Z, build-loop-log: "VM vừa reboot #17 ~08:01Z (boot a3a13d5a, uptime 35' lúc spawn, RAM khả dụng ~1,15 GB, loadavg 1-phút ~3,55)") — giờ chính xác 08:01:15Z chỉ probe #15 mới chốt. |

Chu kỳ reboot nay là **17 lần trong ~35h43'** (từ ~20:18Z 10/11 tới
08:01:15Z 12/11) — trung bình ~2h06'/lần theo cách đếm của W7
(tổng thời gian / số reboot; W7: 15 lần / ~33h ≈ 2h12'). Mọi probe
nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận +
lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #14 là **khoảng mù thứ 7 liên tiếp (#8–#14) chứa reboot**,
và là **khoảng mù thứ hai liên tiếp chứa 2 reboot đã xác nhận**
(sau #13).

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 95

Khoảng mù 05:39:27Z → 08:40:51Z (~181') được phủ bởi các luồng
sibling đợt 95 (làm việc tới ~07:50Z) + closing của parent + entry
spawn đợt 96 (08:40:30Z), và hoàn toàn mù từ **07:50:48Z →
08:40:30Z (~50')**. Đã đọc lại log thật của các luồng (grep
`eperm|EPERM` trên `round95-w*.md` + mtime của `hidden_files/`,
`docs/` và `repo-1`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| W1 (`round95-w1.md`, 0 lần nhắc) | ~05:39–07:2xZ | Không nhắc EPERM/reboot |
| W2 (`round95-w2.md`, 0 lần nhắc) | ~05:39–07:2xZ | Không nhắc EPERM/reboot |
| W3 (`round95-w3.md`, 0 lần nhắc) | ~05:39–07:26Z | Không nhắc EPERM/reboot; log luồng mtime 07:26:03Z — file cuối cùng trên boot cũ (dùng kẹp giờ reboot #16) |
| W4 (`round95-w4.md`, 0 lần nhắc) | ~05:39–07:2xZ | Không nhắc EPERM/reboot |
| W5 (`round95-w5.md`, 0 lần nhắc) | ~05:39–07:2xZ | Không nhắc EPERM/reboot |
| W6 (`round95-w6.md`, 1 lần nhắc) | ~05:40–06:15Z | "0 dấu EPERM trong 12 log đo" (G1 evidence v7) — **không gặp sóng** |
| W7 (`round95-w7.md`, 9 lần nhắc) | 05:39–05:45Z | Chính probe #14 + quét writeFileSync — không phải sóng |
| W8 (`round95-w8.md`, 1 lần nhắc) | ~05:39–07:24Z | Ghi chú thiết kế: Xvfb lock retry ~60s rồi mới ném lỗi rõ khi EPERM — **không phải sóng gặp ngoài đời** |
| W9 (`round95-w9.md`, 1 lần nhắc) | 05:50–07:50Z | Chỉ nhắc tên chủ đề "W7 EPERM probe #14" trong dòng bối cảnh; ghi reboot #16 quan sát trực tiếp + chạy lại U4 xanh 141/141 — **không nhắc sóng EPERM** |
| Parent closing đợt 95 + spawn đợt 96 (build-loop-log) | ~07:37–08:40Z | Gộp 9 luồng, ghi reboot #16 trong khoảng mù #14 + reboot #17 lúc spawn — **không ghi nhận sóng EPERM** |
| 07:50:48Z → 08:40:30Z | — | **Không có bản ghi nào**: 0 file nào trong `hidden_files/`, `docs/` hay `repo-1` (loại node_modules/.venv/dist) sửa đổi trong cửa sổ này (find `-newermt` = 0 hit ngoài 2 file biên 07:50:48Z); build-loop-log dừng ở closing đợt 95 rồi nhảy thẳng tới entry spawn đợt 96 (mtime 08:40:30Z). File cuối trước khoảng trống là `round93-u4/work/measurements.json` 07:50:48.581Z (U4 re-run của W9 sau reboot #16) |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~50' cuối (07:50:48Z → 08:40:30Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#17,
  08:01:15Z) mà giờ chính xác chỉ probe mới chốt được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~20h29' trước probe
  #15 (tính từ cuối sóng 12:11Z). EPERM vẫn KHÔNG được tuyên bố
  là đã hết.
- Reboot #16 là reboot thứ hai trong chuỗi mù được **một luồng
  đang chạy quan sát trực tiếp lúc xảy ra** (W9, sau #14 do V8
  thấy) — khác #15/#17 (chỉ probe + parent phát hiện sau). Nhưng
  giờ từng giây của nó vẫn chưa chốt được: chỉ biết trong khoảng
  kẹp 07:26:03 → 07:34:14Z (ước lượng W9 ~07:25–07:28Z nằm trong
  nửa dưới).
- Reboot trung gian khác trong 07:50:48Z → 08:01:15Z không loại trừ
  được (journal/wtmp chỉ giữ boot hiện tại; dòng `boot changed`
  gộp mọi reboot trung gian). Trong 05:39:27Z → ~07:50Z, hoạt động
  liên tục của W1–W9 làm một reboot không-ai-thấy khó xảy ra (một
  reboot sẽ giết phiên đang chạy, như #16 đã giết verify.sh của
  W9) — nhưng không chứng minh tuyệt đối được.

### 2.4 Bảng 14 lần chết / khoảng mù (cập nhật từ bảng 13 lần của W7 §2.4)

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
| 12 | — (đợt 93 U8 → đợt 94 V6) | #12 23:40:34Z | mù 23:40:34–02:39:01Z (~178') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 02:34:42Z** (→ 9968199e; parent để ý ở spawn ~02:35Z nhưng **không ghi boot-id/giờ chính xác — chỉ probe #13 chốt số**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (U1–U7 tới ~00:52Z + closing tới ~01:36:50Z; U4/U6/U7 đều ghi không gặp sóng); nhưng **~58' cuối (01:37Z → 02:34:42Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 13 | — (đợt 94 V6 → đợt 95 W7) | #13 02:39:01Z | mù 02:39:01–05:39:27Z (~180') | **2 REBOOT ĐÃ XÁC NHẬN** — **#14 ~03:25Z** (→ 0597b689, **V8 quan sát trực tiếp lúc xảy ra**, uptime 0' lúc 03:25:38Z; giờ từng giây chưa chốt) **+ #15 05:17:47Z** (→ 06a92916; parent ghi boot-id lúc spawn ~05:35Z, **chỉ probe #14 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (V1–V8 tới ~03:57Z + closing; V5/V7 ghi không gặp sóng); nhưng **~78' cuối (04:00Z → 05:17:47Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 14 | — (đợt 95 W7 → đợt 96 X7) | #14 05:39:27Z | mù 05:39:27–08:40:51Z (~181') | **2 REBOOT ĐÃ XÁC NHẬN** — **#16 ~07:26–07:34Z** (→ adcef40a, **W9 quan sát trực tiếp lúc xảy ra**, giết verify.sh giữa bước U4; giờ từng giây chưa chốt, kẹp mtime 07:26:03 → 07:34:14Z) **+ #17 08:01:15Z** (→ a3a13d5a; parent ghi boot-id lúc spawn ~08:35Z, **chỉ probe #15 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (W1–W9 tới ~07:50Z + closing; W6 ghi không gặp sóng); nhưng **~50' cuối (07:50:48Z → 08:40:30Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — script V6/W7, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6/W7 `hidden_files/round96-x7/scan-wfs.sh` (copy
từ `round95-w7/scan-wfs.sh`, chỉ đổi thư mục OUT — không đổi
logic): chuẩn mới (prune mọi cấp `node_modules`, `.venv*`,
`dist`, `chrome-userdata`, `.eperm-probe*`, `assets`,
`bundled-server`, `release*`, `build`) + đối chiếu R7b (giữ base
prune, chỉ loại `release*`/`bundled-server`/`assets` ở gốc) + đối
chiếu chéo bản copy (loại `node_modules`). Đếm theo **dòng**, chỉ
tính file có count > 0.

### 3.2 Kết quả (snapshot 08:41:34–08:41:59Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | W7 (~05:41Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.545** | 11.938 | 2.524 / 11.917 |
| Source code thật | **122** | 122 | 112 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **147** | 147 | 133 |
| **Tổng writeFileSync (dòng)** | **269** | **294** | **245** |

Đối chiếu chéo: chuẩn mới 269 + bản copy 25 (3 build + 22 release)
= **294**; R7b = **294** — **khớp tuyệt đối, chênh 0** (lần thứ
ba liên tiếp kể từ khi có đối chiếu chéo; W7 cũng chênh 0). Hit
list chuẩn mới có **0 đường dẫn chứa `release*/` hay `build/`**
(verify bằng grep — 0 hit).

**Giải thích +24 dòng vs W7 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 3 nhóm, 0 file biến mất:

- **+13 docs:**
  - `docs/PHASE9_ROUND95_W7_EPERM_PROBE_LIMITS.md` — **10 dòng**
    (chính file LIMITS của W7, viết sau khi W7 quét).
  - `docs/PHASE9_ROUND95_W9_VERIFY_LIMITS.md` — **1 dòng** (W9).
  - `docs/PHASE9_ROUND95_LIMITS.md` — **2 dòng** (closing đợt 95).
- **+10 source — 5 harness đo mới của đợt 95** (đã đọc từng dòng,
  toàn ghi scratch/kết quả đo/lock, không phải đường ghi production):
  - `apps/web/scripts/probe95w5-velocity.mjs` — **1 dòng**
    (W5, `fs.writeFileSync(waveProbeFile, "x")` — file probe sóng,
    cùng mẫu với probe94v2 của V2).
  - `apps/web/scripts/xvfb-display.mjs` — **1 dòng**
    (W8, `fs.writeFileSync(`${lockDir}/pid`, ...)` — ghi pid vào
    thư mục lock `/tmp/vcut-xvfb-lock/`).
  - `apps/web/scripts/test-xvfb-display-lock.mjs` — **2 dòng**
    (W8, 1 dòng ghi pid giả "999999" vào lock dir khi test + 1 dòng
    ghi `xvfb-lock-test.json` kết quả test).
  - `apps/web/scripts/probe95w3-frame-parity.mjs` — **5 dòng**
    (W3, 1 dòng ghi vite cfg tạm + 4 dòng ghi
    `frame-parity-results.json` / `frame-parity-log.txt` /
    `frame-parity-error.txt` vào SCRATCH).
  - `apps/web/scripts/analyze95w3-frame-parity.mjs` — **1 dòng**
    (W3, ghi JSON kết quả phân tích ra file out).
- **+1 docs:** `PHASE9_GAP_ANALYSIS.md` 8 → **9** (§24 mới ở closing
  đợt 95).

13 + 10 + 1 = 24, khớp đúng chênh lệch.

**Lưu ý snapshot động:** đợt 96 có 9 luồng X1–X9 chạy song song;
lúc quét (08:41–08:42Z) chưa có file LIMITS nào của đợt 96 trong
hit list (diff vs W7 không có file round96 nào). Các LIMITS đợt 96
viết sau thời điểm quét sẽ làm số docs tăng thêm ở lượt sau — đó
là tăng do tài liệu, không phải đường ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`:
**4 hit** — giống hệt W7/V6/U8:

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.
- 2 hit asset JS vendored của Gradio trong `server/tts/.venv2/…`
  (`worker-BzdDEeh7.js`, `Video-C27INCFQ.js`) — API `writeFile` của
  ffmpeg.wasm FS trong bộ nhớ (virtual FS), không phải ghi đĩa Node
  — R7/S7/T8/T9/U8/V6/W7 đã ghi, không tính là đường ghi production.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 122 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6/W7 đã
   sửa lỗi này của U8 — **lượt sau dùng script V6/W7/X7
   (`hidden_files/round96-x7/scan-wfs.sh`, giống hệt script V6
   trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6/W7.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này khớp
   tuyệt đối (chênh 0) vì không file mới nào chứa `writeFileSync`
   xuất hiện giữa hai lần find (08:41:34Z → 08:41:59Z). Ghi rõ cửa
   sổ snapshot và đối chiếu chéo số chênh, đừng ép hai lần quét
   phải khớp tuyệt đối khi cây đang đổi.
5. Scratch quét để trong
   `hidden_files/round96-x7/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #14 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy 06a92916 → a3a13d5a; boot adcef40a chỉ còn trong log luồng
   + build-loop-log. Lượt sau khi thấy `boot changed` phải đối
   chiếu log sibling/build-loop-log xem có boot trung gian không,
   đừng tin bước nhảy là 1 reboot duy nhất. **Bài học này nay đã
   lặp lại 2 lần liên tiếp (#13 bỏ qua 0597b689, #14 bỏ qua
   adcef40a) — ghi boot từ `who -b` / `uptime -s` RIÊNG là bắt
   buộc, không phải khuyến nghị.**
7. **Kẹp giờ reboot bằng mtime (mới, lượt này):** khi một reboot
   được luồng đang chạy quan sát trực tiếp nhưng giờ từng giây chưa
   chốt, kẹp bằng file cuối cùng trước reboot và file đầu tiên sau
   reboot trong `hidden_files/` + `docs/` + `repo-1` (loại
   node_modules/.venv/dist). Reboot #16 kẹp được 07:26:03 →
   07:34:14Z (~8'). Phương pháp này chỉ tin được khi có hoạt động
   ghi file liên tục quanh reboot — không áp dụng được cho khoảng
   trống 07:50:48Z → 08:40:30Z (0 file), nên giờ reboot #17 phải
   nhờ `uptime -s` trực tiếp.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #15 OK 2/2) — và ~50' cuối khoảng mù #14 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~20h29' trước
   probe #15.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). X7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #14 dài ~181' chứa **2 reboot**, là **khoảng mù thứ
   7 liên tiếp (#8–#14) chứa reboot** và thứ hai liên tiếp chứa 2
   reboot; khoảng mù #8 đã chứng minh có thể chứa cả một sóng đầy
   đủ; khoảng trống không-bản-ghi cuối mù nay là ~50' (ngắn hơn
   ~78' của #13 nhưng vẫn đủ chứa nhiều sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3;
   3 dòng lạ 11:59–12:00Z vẫn còn trong log, không thêm dòng lạ mới
   trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h06'/lần** (17 lần/~35h43'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 4 mẫu 551 / 507 /
   537 / 869 MB (max 869 MB = 14% ngưỡng guard 6144 MB), không có
   tín hiệu RAM tăng so với đợt 95 (max ~1,68–2,7 GB; W7: 695/1682/
   1364 MB). Đúng quyết định parent đợt 92 §3 mục 7: chỉ thử lại
   khi có tín hiệu RAM thay đổi theo hướng có lợi. Mẫu 507 MB lúc
   ~08:41Z là **thấp nhất từng ghi** (kỷ lục cũ 695 MB của W7) —
   RAM đi xuống, càng không phải tín hiệu thử lại.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Giờ từng giây reboot #16 vẫn chưa chốt** (kẹp mtime 07:26:03 →
   07:34:14Z; ước lượng W9 ~07:25–07:28Z) — nợ nhỏ cho lượt sau nếu
   ai đó tìm được log có timestamp chặt hơn (verify.sh của W9 đã bị
   giết giữa chừng nên không còn dòng log nào trong khoảng kẹp).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND96_X7_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round96-x7-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x7.md`
(log luồng); scratch quét trong `hidden_files/round96-x7/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
