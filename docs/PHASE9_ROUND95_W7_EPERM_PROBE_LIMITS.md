# PHASE9 ROUND95 W7 — EPERM: probe #14 + khoảng mù #13 (2 reboot) + quét writeFileSync (nợ LIMITS gộp đợt 94 §4 mục 7)

> Luồng W7, đợt 95 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 12/11/2026; làm việc ~05:39–05:45Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #13
> (02:39:01Z) + quét lại writeFileSync bằng script V6
> (`hidden_files/round94-v6/scan-wfs.sh`, đã sửa bug prune base của
> U8) + ghi RAM hiện tại (birefnet: KHÔNG chạy — không nằm trong
> nhiệm vụ W7, và không có tín hiệu RAM thay đổi theo hướng tăng).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 05:39:26Z
  báo **DEAD/STALE** (heartbeat age 10.825 s, last #13 02:39:01Z,
  boot 9968199e, exit 1); `once` ngay sau đó là **probe #14,
  boot 06a92916 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=14), exit 0.
- **Khoảng mù #13: 02:39:01Z → 05:39:27Z (~180')** — dài thứ hai
  trong lịch sử probe (sau khoảng mù #8, ~187'). Trong đó có
  **2 lần reboot ĐÃ XÁC NHẬN** — lần đầu tiên một khoảng mù chứa
  2 reboot: **#14 ~03:25Z (boot 0597b689)** và **#15 05:17:47Z
  (boot 06a92916)**.
- **Đính chính brief giao việc:** brief nói reboot #14 "chưa probe
  nào ghi nhận lúc xảy ra" — đúng với probe, nhưng **V8 đã quan
  sát trực tiếp lúc nó xảy ra** (poll 03:25:38Z thấy uptime 0',
  poll nền bị SIGTERM kill ~03:24Z; log `round94-v8.md` + closing
  parent `build-loop-log.md` dòng 3374/3389/3395). Giờ chính xác
  từng giây của reboot #14 vẫn chưa chốt được (chỉ "~03:25Z":
  matrix3 DONE 03:25:19 ngay trước reboot, V8 thấy uptime 0' lúc
  03:25:38) — và boot-id 0597b689 do V8/V3b/parent ghi, không phải
  do probe. Dòng `boot changed` của probe #14 gộp
  9968199e → 06a92916, **bỏ qua boot trung gian 0597b689**.
- **Reboot #15 thì khác #13 ở một điểm:** parent ĐÃ ghi boot-id
  ngay lúc spawn (~05:35Z, build-loop-log dòng 3404: "VM vừa
  reboot ~05:18Z (boot 06a92916, uptime 18' lúc spawn, RAM khả
  dụng ~1,1 GB, loadavg 1-phút ~2,76)") — chỉ còn giờ chính xác
  05:17:47Z là do probe #14 mới chốt. (Reboot #13 thì parent để ý
  nhưng không ghi cả boot-id lẫn giờ chính xác.)
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** (V5: "0 dấu EPERM trong 8 log đo"; V7: "Không
  EPERM, không process mồ côi"; V2/V3 chỉ nhắc reboot/libevent;
  V8: không nhắc sóng). Nhưng **~78 phút cuối khoảng mù
  (04:00Z → 05:17:47Z) hoàn toàn không có bản ghi nào** — không thể
  kết luận "không có sóng", chỉ kết luận "không có bằng chứng
  trong các bản ghi còn tồn tại". Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~17h28' trước probe #14.
  EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 245 dòng / 86 file** (phạm vi
  2.524 file) — source thật **112** (+10 vs V6), mẫu trong docs
  **133** (+13 vs V6). Đối chiếu phương pháp R7 cũ (R7b):
  **270 dòng / 103 file**; đối chiếu chéo 245 + 25 bản copy =
  **270, khớp tuyệt đối với R7b** — lần thứ hai liên tiếp chênh 0.
  **Không còn đường ghi production nào chưa nối helper.** Async
  `fs.writeFile(` production ngoài helper: **0**.
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).
- **RAM: 3 mẫu MemAvailable 695 / 1682 / 1364 MB** (max ~1,68 GB =
  27% ngưỡng guard 6144 MB) — mẫu 695 MB là thấp nhất từng ghi
  (V6 thấp nhất 992 MB); RAM đi xuống, không có tín hiệu tăng —
  birefnet KHÔNG chạy, đúng quy tắc chỉ thử lại khi RAM đổi theo
  hướng có lợi.

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| `bash scripts/probe-eperm-v2.sh status` | 05:39:26Z | **DEAD/STALE**, exit 1 — heartbeat n=13, ts 02:39:01Z, boot 9968199e, age **10.825 s**; last sample probe #13; last start duy nhất 08:49:50Z; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 05:39:26Z | **probe #14, boot=06a92916, ok=2 fail=0**, exit 0; có dòng `boot changed 9968199e -> 06a92916` |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 05:39:27Z | **ALIVE**, age 0 s, n=14, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 34 dòng, trước lượt 31 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=14, ts
05:39:27Z, pid=3455, boot 06a92916-d915-4220-9e96-f7dc42f916ae).

Boot hiện tại đã xác minh độc lập TRƯỚC khi chạy `once` (không tin
mù theo brief): `/proc/sys/kernel/random/boot_id` =
`06a92916-d915-4220-9e96-f7dc42f916ae`; `who -b` = 05:18;
`uptime -s` = **2026-11-12 05:17:47Z** (uptime 21' lúc đọc
05:39:17Z) — khớp đúng boot-id và giờ reboot mà parent ghi ở
build-loop-log dòng 3404.

## 2. Điều tra khoảng mù kể từ probe #13

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 05:39–05:41Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 05:17:47Z**, boot_id
  `06a92916-d915-4220-9e96-f7dc42f916ae` — khác boot của probe #13
  (9968199e).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z,
  pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa từng được
  start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 06a92916…,
  first entry 05:18:02Z, last 05:38:24Z). `last -x reboot`: chỉ 1
  dòng (05:18, still running). wtmp bắt đầu 05:18:02Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 05:39:26Z ghi vào log chỉ ghi
  **9968199e → 06a92916** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối). Boot trung gian
  0597b689 chỉ còn trong log của V8/V3b và build-loop-log, không
  trong log probe.

### 2.2 Hai reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 14 | ~03:25Z (giờ từng giây chưa chốt) | 9968199e → 0597b689 | **V8 quan sát trực tiếp lúc xảy ra:** poll 03:25:38Z thấy uptime 0', poll nền bị SIGTERM kill ~03:24Z (`round94-v8.md`); matrix3 DONE 03:25:19 ngay trước reboot; V3 bị giết giữa MATRIX3 (dừng sau Lc6-blobA-run4), resume không tác dụng → parent spawn V3b ~03:32Z, xong 03:44Z (`round94-v3.md` §V3b). Parent closing đã ghi trong build-loop-log (dòng 3374, 3389, 3395). **Không probe nào ghi** — boot-id 0597b689 do V8/V3b/parent ghi, không phải do probe. |
| 15 | 05:17:47Z | 0597b689 → 06a92916 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 05:18:02Z); `last -x reboot` (05:18, still running); wtmp bắt đầu 05:18:02Z. Parent ĐÃ ghi boot-id ở lúc spawn (~05:35Z, build-loop-log dòng 3404: "VM vừa reboot ~05:18Z (boot 06a92916, uptime 18' lúc spawn...)") — giờ chính xác 05:17:47Z chỉ probe #14 mới chốt. |

Chu kỳ reboot nay là **15 lần trong ~32h59'** (từ ~20:18Z 10/11 tới
05:17:47Z 12/11) — trung bình ~2h12'/lần. Mọi probe nền đều chết
theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
phục bằng 1 mẫu mới.

Khoảng mù #13 là **khoảng mù thứ 6 liên tiếp (#8–#13) chứa reboot**,
và là **khoảng mù đầu tiên chứa 2 reboot đã xác nhận**.

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 94

Khoảng mù 02:39:01Z → 05:39:27Z (~180') được phủ bởi các luồng
sibling đợt 94 (làm việc tới ~03:57Z) + closing của parent (sau
03:57Z) và hoàn toàn mù từ 04:00Z → 05:17:47Z (~78').
Đã đọc lại log thật của các luồng (grep `eperm|EPERM|reboot` trên
`round94-v*.md` + mtime của `hidden_files/` và `docs/`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| V1 (`round94-v1.md`, 0 lần nhắc) | ~02:39–03:22Z | Không nhắc EPERM/reboot |
| V2 (`round94-v2.md`, 2 lần nhắc) | ~02:39–03:24Z | Chỉ nhắc reboot ~02:35Z + libevent thiếu sau reboot — không phải sóng |
| V3 (`round94-v3.md`, 7 lần nhắc) | ~02:39–03:44Z | Nhắc reboot ~02:35Z + reboot #14 ~03:25Z giết V3 (V3b nối tiếp) — không nhắc sóng EPERM |
| V4 (`round94-v4.md`, 0 lần nhắc) | ~02:39–03:24Z | Không nhắc EPERM/reboot |
| V5 (`round94-v5.md`, 3 lần nhắc) | ~02:39–03:04Z | "0 dấu EPERM trong 8 log đo" (G1 evidence v6) — **không gặp sóng** |
| V6 (`round94-v6.md`, 20 lần nhắc) | 02:38–02:45Z | Chính probe #13 + quét writeFileSync — không phải sóng |
| V7 (`round94-v7.md`, 2 lần nhắc) | ~02:39–02:53Z | "Không EPERM, không process mồ côi" (Xvfb race display :194, chạy lại PASS 6/6) — **không gặp sóng** |
| V8 (`round94-v8.md`, 4 lần nhắc) | ~02:39–03:57Z | Ghi reboot #14 ~03:25Z quan sát trực tiếp + đối chiếu probe #13 — **không nhắc sóng EPERM** |
| Parent closing (LIMITS gộp đợt 94 + build-loop-log) | ~03:57–~04:0xZ | Gộp 8 luồng, V8 kiểm chứng tsc 0 / build PASS / O8 21/21; ghi reboot #14 trong khoảng mù #13 — **không ghi nhận sóng EPERM** |
| 04:00Z → 05:17:47Z | — | **Không có bản ghi nào**: 0 file nào trong `hidden_files/` hay `docs/` sửa đổi trong cửa sổ này (find `-newermt` = 0 hit); build-loop-log dừng ở closing đợt 94 rồi nhảy thẳng tới entry spawn đợt 95 (~05:35Z) |

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **78 phút cuối (04:00Z → 05:17:47Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#15,
  05:17:47Z) mà giờ chính xác chỉ probe mới chốt được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~17h28' trước probe
  #14. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- Reboot #14 là reboot đầu tiên trong chuỗi mù được **một luồng
  đang chạy quan sát trực tiếp lúc xảy ra** (V8, uptime 0' lúc
  03:25:38Z) — khác #10/#12/#13 (chỉ probe phát hiện sau) và #11
  (T9 phát hiện trong lượt). Nhưng giờ từng giây của nó vẫn chưa
  chốt được: chỉ biết trong khoảng 03:25:19 (matrix3 DONE) →
  03:25:38 (V8 thấy uptime 0').
- Reboot trung gian khác trong 04:00Z → 05:17:47Z không loại trừ
  được (journal/wtmp chỉ giữ boot hiện tại; dòng `boot changed`
  gộp mọi reboot trung gian). Trong 02:39:01Z → ~04:00Z, hoạt động
  liên tục của V1–V8 + closing làm một reboot không-ai-thấy khó xảy
  ra (một reboot sẽ giết phiên đang chạy, như #14 đã giết V3 và
  poll của V8) — nhưng không chứng minh tuyệt đối được.

### 2.4 Bảng 13 lần chết / khoảng mù (cập nhật từ bảng 12 lần của V6 §2.4)

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

## 3. Quét writeFileSync — script V6, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6 `hidden_files/round94-v6/scan-wfs.sh` (copy
sang `hidden_files/round95-w7/scan-wfs.sh`, chỉ đổi thư mục OUT —
không đổi logic): chuẩn mới (prune mọi cấp `node_modules`,
`.venv*`, `dist`, `chrome-userdata`, `.eperm-probe*`, `assets`,
`bundled-server`, `release*`, `build`) + đối chiếu R7b (giữ base
prune, chỉ loại `release*`/`bundled-server`/`assets` ở gốc) + đối
chiếu chéo bản copy (loại `node_modules`). Đếm theo **dòng**, chỉ
tính file có count > 0.

### 3.2 Kết quả (snapshot 05:41:48–05:43:17Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | V6 (~02:41Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.524** | 11.917 | 2.509 / 11.902 |
| Source code thật | **112** | 112 | 102 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **133** | 133 | 120 |
| **Tổng writeFileSync (dòng)** | **245** | **270** | **222** |

Đối chiếu chéo: chuẩn mới 245 + bản copy 25 (3 build + 22 release)
= **270**; R7b = **270** — **khớp tuyệt đối, chênh 0** (lần thứ
hai liên tiếp kể từ khi có đối chiếu chéo; V6 cũng chênh 0). Hit
list chuẩn mới có **0 đường dẫn chứa `release*/` hay `build/`**
(verify bằng grep — 0 hit).

**Giải thích +23 dòng vs V6 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 3 file mới trong hit list + 1 file đổi số dòng,
0 file biến mất:

- **+10 source — 3 harness đo mới của đợt 94** (toàn ghi file kết
  quả/scratch, không phải đường ghi production):
  - `apps/web/scripts/probe94v2-stall-evidence.mjs` — **1 dòng**
    (V2, `fs.writeFileSync(waveProbeFile, "x")` — file probe sóng).
  - `apps/web/scripts/probe94v4-rvfc-fallback.mjs` — **5 dòng**
    (V4, ghi `fallback-results.json` / `fallback-log.txt` /
    `fallback-error.txt` vào SCRATCH + 1 dòng ghi vite cfg tạm).
  - `apps/web/scripts/probe94v4-rvfc-webkit.mjs` — **4 dòng**
    (V4, ghi `rvfc-results.json` / `rvfc-log.txt` /
    `rvfc-error.txt` vào SCRATCH).
- **+13 docs:**
  - `docs/PHASE9_ROUND94_LIMITS.md` — **2 dòng** (closing đợt 94).
  - `docs/PHASE9_ROUND94_V6_EPERM_PROBE_LIMITS.md` — **9 dòng**
    (chính file LIMITS của V6, viết sau khi V6 quét).
  - `docs/PHASE9_ROUND94_V8_VERIFY_LIMITS.md` — **1 dòng** (V8).
  - `PHASE9_GAP_ANALYSIS.md` 7 → 8 (**+1**, §23 mới ở closing).
  - Toàn là tài liệu trích dẫn `writeFileSync` trong văn bản, không
    chạy.

1 + 5 + 4 + 2 + 9 + 1 + 1 = 23, khớp đúng chênh lệch.

**Lưu ý snapshot động:** đợt 95 có 9 luồng W1–W9 chạy song song;
lúc quét (05:41–05:43Z) chưa có file LIMITS nào của đợt 95 trong
hit list (diff vs V6 không có file round95 nào). Các LIMITS đợt 95
viết sau thời điểm quét sẽ làm số docs tăng thêm ở lượt sau — đó
là tăng do tài liệu, không phải đường ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`:
**4 hit** — giống hệt V6/U8:

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.
- 2 hit asset JS vendored của Gradio trong `server/tts/.venv2/…`
  (`worker-BzdDEeh7.js`, `Video-C27INCFQ.js`) — API `writeFile` của
  ffmpeg.wasm FS trong bộ nhớ (virtual FS), không phải ghi đĩa Node
  — R7/S7/T8/T9/U8/V6 đã ghi, không tính là đường ghi production.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 112 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6 đã sửa
   lỗi này của U8 — **lượt sau dùng script V6/W7
   (`hidden_files/round95-w7/scan-wfs.sh`, giống hệt script V6
   trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này khớp
   tuyệt đối (chênh 0) vì không file mới nào chứa `writeFileSync`
   xuất hiện giữa hai lần find (05:41:48Z → 05:43:17Z). Ghi rõ cửa
   sổ snapshot và đối chiếu chéo số chênh, đừng ép hai lần quét
   phải khớp tuyệt đối khi cây đang đổi.
5. Scratch quét để trong
   `hidden_files/round95-w7/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #13 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy 9968199e → 06a92916; boot 0597b689 chỉ còn trong log luồng
   + build-loop-log. Lượt sau khi thấy `boot changed` phải đối
   chiếu log sibling/build-loop-log xem có boot trung gian không,
   đừng tin bước nhảy là 1 reboot duy nhất.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #14 OK 2/2) — và 78 phút cuối khoảng mù #13 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~17h28' trước
   probe #14.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). W7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #13 dài ~180' chứa **2 reboot**, và là **khoảng mù
   thứ 6 liên tiếp (#8–#13) chứa reboot**; khoảng mù #8 đã chứng
   minh có thể chứa cả một sóng đầy đủ.
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3; 3 dòng lạ
   11:59–12:00Z vẫn còn trong log, không thêm dòng lạ mới trong
   lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h12'/lần** (15 lần/~32h59'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 3 mẫu 695 / 1682 /
   1364 MB (max ~1,68 GB = 27% ngưỡng guard 6144 MB), không có tín
   hiệu RAM tăng so với đợt 94 (max ~1,9 GB; V6: 992/1221 MB).
   Đúng quyết định parent đợt 92 §3 mục 7: chỉ thử lại khi có tín
   hiệu RAM thay đổi theo hướng có lợi. Mẫu 695 MB lúc 05:39Z là
   thấp nhất từng ghi — RAM đi xuống, càng không phải tín hiệu thử
   lại. Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND95_W7_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round95-w7-eperm-probe.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w7.md`
(log luồng); scratch quét trong `hidden_files/round95-w7/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
