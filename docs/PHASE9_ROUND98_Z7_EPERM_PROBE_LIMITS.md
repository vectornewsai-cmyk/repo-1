# PHASE9 ROUND98 Z7 — EPERM: probe #17 + khoảng mù #16 (1 reboot) + quét writeFileSync (nợ LIMITS gộp đợt 97 §4 mục 7)

> Luồng Z7, đợt 98 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07,
> 12/11/2026; làm việc ~14:38–14:45Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #16
> (11:37:29Z) + quét lại writeFileSync bằng script V6/W7/X7/Y8
> (`hidden_files/round98-z7/scan-wfs.sh`, copy từ `round97-y8`,
> chỉ đổi thư mục OUT — không đổi logic) + ghi RAM hiện tại
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 14:38:16Z
  báo **DEAD/STALE** (heartbeat age 10.847 s, last #16 11:37:29Z,
  boot d8dc09fe, exit 1); `once` ngay sau đó là **probe #17,
  boot 65bc5fb6 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=17), exit 0.
- **Khoảng mù #16: 11:37:29Z → 14:38:22Z (~181')** — chứa **ĐÚNG
  1 reboot ĐÃ XÁC NHẬN: #20 13:24:41Z chính xác từng giây (boot
  d8dc09fe → 65bc5fb6)**, khớp đúng con số parent ghi lúc spawn
  đợt 98 ("reboot #20 lúc 13:24:41Z, boot mới chưa xác minh id")
  — probe #17 xác minh id boot mới là
  `65bc5fb6-6d90-4de1-adba-775675a21086`. Lần này dòng `boot
  changed` KHÔNG gộp boot trung gian (chỉ có 1 reboot trong mù)
  — đứt chuỗi 3 lần gộp liên tiếp (#13, #14, #15).
- **Hoạt động liên tục 11:37Z → 13:03:12Z** (mọi phút đều có file
  chạm đĩa: LIMITS Y1–Y10 11:48–12:54Z, closing đợt 97 12:57Z,
  Y10 O8 12:48–12:50Z, round93-u4/work 13:00:46–13:03:12Z) —
  một reboot trong cửa sổ này sẽ giết tiến trình đang chạy, nên
  không có reboot nào khác trước 13:03:12Z. **Khoảng trống
  không-bản-ghi ~92' (13:03:12Z → ~14:35Z, lúc parent spawn)**,
  chứa reboot #20; reboot thứ hai trong khoảng trống không loại
  trừ tuyệt đối được (journal/wtmp chỉ giữ boot hiện tại), nhưng
  không có bằng chứng nào cho nó và chu kỳ ~2h04' làm 2 reboot
  trong ~92' rất khó xảy ra.
- **Không tìm thấy bằng chứng sóng EPERM thật trong các bản ghi
  còn lại của khoảng mù** — 0 dòng "sóng EPERM vẫn bật", 0 dòng
  "CẢNH BÁO: chờ sóng EPERM 10 phút", 0 lần "Operation not
  permitted" thật (2 hit grep đều là chữ trong chính file LIMITS
  của Y8 trích lại bài học dương tính giả). 10 dòng "sóng EPERM
  đã tắt" trong cây round97 (Y4 d1/d2/d3 11:57–12:02Z, Y10 O8
  12:48–12:50Z) đều là **dương tính giả đã biết** (in mặc định
  khi lần ghi thử đầu tiên thành công). Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~26h27' trước probe #17. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 333 dòng / 109 file** (phạm vi
  2.589 file) — source thật **160** (+26 vs Y8), mẫu trong docs
  **173** (+13 vs Y8). Đối chiếu phương pháp R7 cũ (R7b):
  **358 dòng**; đối chiếu chéo 333 + 25 bản copy = **358,
  khớp tuyệt đối, chênh 0** — lần thứ năm liên tiếp chênh 0 sau
  đối chiếu. **Không còn đường ghi production nào chưa nối
  helper.** Async `fs.writeFile` production ngoài helper: **0**
  (không đổi).
- **RAM: 6 mẫu MemAvailable 645 / 1080 / 1136 / 1220 / 1451 /
  892 MB** (max 1.451 MB = 24% ngưỡng guard 6144 MB) — birefnet
  KHÔNG chạy, đúng quy tắc chỉ thử lại khi RAM đổi theo hướng có
  lợi ĐỦ MỨC (xem §5 mục 6).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 14:38:04–14:38:16Z | boot_id `65bc5fb6-6d90-4de1-adba-775675a21086`; `who -b` Nov 12 13:24; `uptime -s` **2026-11-12 13:24:41Z** (uptime ~1h13'); journal chỉ 1 boot (65bc5fb6, first entry 13:24:52Z); `last -x reboot` 13:24 still running; wtmp bắt đầu 13:24:51Z |
| `bash scripts/probe-eperm-v2.sh status` | 14:38:16Z | **DEAD/STALE**, exit 1 — heartbeat n=16, ts 11:37:29Z, boot d8dc09fe, age **10.847 s**; last sample probe #16; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 14:38:22Z | **probe #17, boot=65bc5fb6, ok=2 fail=0**, exit 0; dòng `boot changed d8dc09fe -> 65bc5fb6` (lần này KHÔNG gộp — chỉ 1 reboot trong mù, xem §2.2) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 14:38:22Z | **ALIVE**, age 0 s, n=17, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 43 dòng, trước lượt 40 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=17, ts
14:38:22Z, pid=5489→mới, boot 65bc5fb6-6d90-4de1-adba-775675a21086).

## 2. Điều tra khoảng mù kể từ probe #16

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 14:38–14:44Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 13:24:41Z**, boot_id
  `65bc5fb6-6d90-4de1-adba-775675a21086` — khác boot của probe #16
  (d8dc09fe).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 65bc5fb6…,
  first entry 13:24:52Z, last 14:37:33Z). `last -x reboot`: chỉ 1
  dòng (13:24, still running). wtmp bắt đầu 13:24:51Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 14:38:22Z ghi vào log chỉ ghi
  **d8dc09fe → 65bc5fb6** — lần này là bước nhảy thật (chỉ 1
  reboot), không gộp boot trung gian.

### 2.2 Một reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 20 | **13:24:41Z (chính xác từng giây)** | d8dc09fe → 65bc5fb6 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 13:24:52Z); `last -x reboot` (13:24, still running); wtmp bắt đầu 13:24:51Z. Parent ĐÃ ghi giờ này lúc spawn đợt 98 (~14:35Z, build-loop-log: "VM reboot #20 lúc 13:24:41Z (boot mới, chưa xác minh id)") — probe #17 xác minh id boot mới là 65bc5fb6, khớp đúng giờ từng giây. |

Chu kỳ reboot nay là **20 lần trong ~41h07'** (từ ~20:18Z 10/11 tới
13:24:41Z 12/11) — trung bình ~2h03'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; Y8: 19 lần / ~39h12' ≈ 2h04').
Reboot tiếp theo dự kiến **~15:28Z** (13:24:41Z + ~2h04'). Mọi
probe nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi
nhận + lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #16 là **khoảng mù thứ 9 liên tiếp (#8–#16) chứa reboot**,
nhưng là **mù đầu tiên sau #12 chỉ chứa 1 reboot** (các mù #13,
#14, #15 mỗi mù chứa 2 reboot).

**Vì sao khẳng định không có reboot nào khác trước 13:03:12Z:**
hoạt động ghi đĩa liên tục từng phút 11:37Z → 13:03:12Z — LIMITS
Y1–Y10 viết 11:48–12:54Z, GAP_ANALYSIS + ROUND97_LIMITS (closing
đợt 97) 12:57Z, Y10 O8 click-test chạy 12:48–12:50Z (report.json
12:50:07Z, 21/21 cả 2 engine — vite khởi động bình thường), Y2
frames-stripes 12:17Z, round93-u4/work chạm 13:00:46–13:03:12Z
(40 file, xem §2.3). Một reboot trong cửa sổ này sẽ giết các
tiến trình đang chạy (như #18 đã giết X1/X9, #19 giết toàn bộ
phiên trước spawn đợt 97) — không tiến trình nào báo chết giữa
chừng. **Sau 13:03:12Z thì không chứng minh được:** khoảng trống
không-bản-ghi ~92' (13:03:12Z → ~14:35Z lúc parent spawn) đủ dài
để chứa thêm một reboot mà không để lại dấu vết — nhưng không có
bằng chứng nào cho reboot thứ hai, và 2 reboot trong ~92' chưa
từng xảy ra trong lịch sử 20 lần reboot (khoảng cách ngắn nhất
từng ghi ~1h52' giữa #16 07:26–07:34Z và #17 08:01:15Z, vẫn dài
hơn nhiều so với ~21' từ 13:03:12Z tới reboot #20).

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 97 + đợt 98 tới lúc này

Khoảng mù 11:37:29Z → 14:38:22Z (~181') được phủ bởi các luồng
sibling đợt 97 (làm việc tới ~12:57Z) + closing của parent +
spawn đợt 98 (~14:35Z) + Z1/Z9 đã bắt đầu chạy, và hoàn toàn mù
từ **13:03:12Z → ~14:35Z (~92')**. Đã đọc lại log thật (grep
`EPERM|Operation not permitted` trên `round97-y*.md` + toàn bộ
cây `round97-y1`…`round97-y10` + `round98-z*` hiện có; grep
`sóng EPERM vẫn bật` / `CẢNH BÁO: chờ sóng` toàn cây):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| Y1 (`round97-y1.md`) | 11:38–11:55Z | 0 lần nhắc EPERM; ghi rõ "không reboot trong lúc đo" |
| Y2 (`round97-y2.md`) | 11:38–~12:17Z | 0 lần nhắc EPERM; boot d8dc09fe suốt lượt |
| Y3 (`round97-y3.md`) | 11:38–~12:00Z | 0 lần nhắc EPERM |
| Y4 (`round97-y4*`, dir) | 11:38–12:08Z | 6 dòng "sóng EPERM đã tắt" (d1/d2/d3, 11:57–12:02Z, mỗi mốc ×2 file) — xem đính chính dưới |
| Y5 (`round97-y5.md`) | 11:38–12:35Z | 0 lần nhắc EPERM |
| Y6 (`round97-y6.md`) | 11:37–11:43Z | 0 lần nhắc EPERM |
| Y7 (`round97-y7.md`) | 11:39–12:13Z | 0 lần nhắc EPERM |
| Y8 (`round97-y8.md` + LIMITS) | 11:37–11:47Z | Chính probe #16 + quét writeFileSync — không phải sóng; 5 lần nhắc EPERM đều là văn bản probe/bài học |
| Y9 (`round97-y9.md`) | 11:40–12:05Z | 0 lần nhắc EPERM |
| Y10 (`round97-y10.md` + dir) | 11:38–12:54Z | 1 lần nhắc EPERM trong .md — chỉ là câu tóm tắt "EPERM probe #16 (Y8)" trong danh sách kết quả, không phải sóng; 2 dòng "sóng EPERM đã tắt" (O8 log 12:48:25Z + 12:50:07Z) — xem đính chính dưới |
| Parent closing đợt 97 + spawn đợt 98 (build-loop-log) | ~12:57–14:35Z | Ghi reboot #20 lúc spawn — **không ghi nhận sóng EPERM** |
| Z1/Z9 (đợt 98, đã chạy) | 14:38–14:44Z | Chưa có file .md log; grep toàn cây `round98-z*`: 0 lần nhắc EPERM |
| 13:03:12Z → ~14:35Z | — | **Không có bản ghi nào**: file cuối trước khoảng trống là `round93-u4/work/u4-dry-mkf60-new.json` 13:03:12Z (trong hidden_files) và `docs/PHASE9_ROUND97_LIMITS.md` 12:57Z (trong repo); file đầu sau khoảng trống là `build-loop-log.md` ~14:38Z (entry spawn đợt 98 của parent). |

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 10 dòng "sóng EPERM đã tắt, khởi động vite"
trong cây round97 — 8 dòng log thật (Y4 d1 11:57:33Z, d2
11:59:59Z, d3 12:02:53Z, mỗi mốc xuất hiện 2 lần do log trùng
probe-log.txt; Y10 O8 12:48:25Z + 12:50:07Z, mỗi mốc ×2 file
log/report) + 2 dòng trong chính file `round97-y8.md` trích lại
bài học. Tất cả đều là dòng in khi lần ghi thử ĐẦU TIÊN thành
công ngay (code launcher `waveOff=true` ở lần write đầu) — in mặc
định cả khi không có sóng. Bằng chứng phân biệt: **0 dòng "sóng
EPERM vẫn bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM
10 phút"** trong toàn bộ cây round97-y* + round98-z*; **0 lần
"Operation not permitted" thật** (2 hit grep đều là chữ trong
`round97-y8.md` trích lại bài học, không phải log chạy thật).

**Lưu ý nhỏ — 40 file `round93-u4/work` chạm 13:00:46–13:03:12Z:**
nội dung là dữ liệu dry-run U4 đợt 93 (`measurements.json`,
`u4-dry-mkf*-new/old.json`, `shim-count.log`, script
`ffmpeg-vidstab-fail.sh`); không có log .md nào của đợt 97/98 ghi
nhận tiến trình nào chạy U4 lúc đó, và lúc 14:44Z không còn tiến
trình nào khớp `u4|round93` đang chạy (`ps aux` = 0 hit). Nguồn
chạm chưa xác định — ghi nhận trung thực, không đoán. Dù nguồn là
gì, 40 file này chứng tỏ vẫn có hoạt động ghi đĩa tới 13:03:12Z,
tức khoảng trống không-bản-ghi bắt đầu lúc 13:03:12Z chứ không
phải 12:57Z.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~92' cuối (13:03:12Z → ~14:35Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#20,
  13:24:41Z) mà giờ chính xác chỉ probe mới chốt được (parent
  spawn chỉ ghi giờ, probe xác minh id boot).
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~26h27' trước probe
  #17 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- Khoảng trống không-bản-ghi ~92' là dài nhất từng ghi ở cuối một
  khoảng mù (vượt ~87' của mù #9, ~78' của mù #13, ~62' của mù
  #10, ~51' của mù #15).

### 2.4 Bảng 16 lần chết / khoảng mù (cập nhật từ bảng 15 lần của Y8 §2.4)

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
| 10 | — (đợt 91 S7 → đợt 92 T8) | #10 17:39:23Z | mù 17:39:23–20:38:56Z (~180') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 19:22:48Z** (→ 14e10da9, **không ai ghi nhận lúc xảy ra** — chỉ probe #11 phát hiện). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (S1–S9 tới ~19:20Z + closing tới 19:37:20Z; S6: 0 dấu EPERM trong 5 lần đo; O8 21/21 cả 2 engine 19:11–19:14Z; closing tới 19:37:20Z không ghi EPERM). **Đuôi mù hoàn toàn 19:37:20Z → 20:38:56Z (~62')** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 11 | — (đợt 92 T8 → đợt 93 U8) | #11 20:38:56Z | mù 20:38:56–23:40:34Z (~182') | **Không có observer + 2 REBOOT ĐÃ XÁC NHẬN** (~21:35:58Z → 09e8d2af, T9 ghi trong lượt; **23:33:21Z → 88ebef2e, không ai ghi nhận lúc xảy ra — chỉ probe #12 phát hiện**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (T1–T9 tới ~22:34Z + closing tới 22:40:42Z; T6 chỉ có EPERM do fault-injection tự viết); nhưng **~60' cuối (22:40:42Z → 23:40:34Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 12 | — (đợt 93 U8 → đợt 94 V6) | #12 23:40:34Z | mù 23:40:34–02:39:01Z (~178') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN 02:34:42Z** (→ 9968199e; parent để ý ở spawn ~02:35Z nhưng **không ghi boot-id/giờ chính xác — chỉ probe #13 chốt số**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (U1–U7 tới ~00:52Z + closing tới ~01:36:50Z; U4/U6/U7 đều ghi không gặp sóng); nhưng **~58' cuối (01:37Z → 02:34:42Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 13 | — (đợt 94 V6 → đợt 95 W7) | #13 02:39:01Z | mù 02:39:01–05:39:27Z (~180') | **2 REBOOT ĐÃ XÁC NHẬN** — **#14 ~03:25Z** (→ 0597b689, **V8 quan sát trực tiếp lúc xảy ra**, uptime 0' lúc 03:25:38Z; giờ từng giây chưa chốt) **+ #15 05:17:47Z** (→ 06a92916; parent ghi boot-id lúc spawn ~05:35Z, **chỉ probe #14 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (V1–V8 tới ~03:57Z + closing; V5/V7 ghi không gặp sóng); nhưng **~78' cuối (04:00Z → 05:17:47Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 14 | — (đợt 95 W7 → đợt 96 X7) | #14 05:39:27Z | mù 05:39:27–08:40:51Z (~181') | **2 REBOOT ĐÃ XÁC NHẬN** — **#16 ~07:26–07:34Z** (→ adcef40a, **W9 quan sát trực tiếp lúc xảy ra**, giết verify.sh giữa bước U4; giờ từng giây chưa chốt, kẹp mtime 07:26:03 → 07:34:14Z) **+ #17 08:01:15Z** (→ a3a13d5a; parent ghi boot-id lúc spawn ~08:35Z, **chỉ probe #15 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (W1–W9 tới ~07:50Z + closing; W6 ghi không gặp sóng); nhưng **~50' cuối (07:50:48Z → 08:40:30Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 15 | — (đợt 96 X7 → đợt 97 Y8) | #15 08:40:51Z | mù 08:40:51–11:37:29Z (~177') | **2 REBOOT ĐÃ XÁC NHẬN** — **#18 09:24:17Z** (→ 04b83831; giết X1/X9 sạch, X4/X5/X6 resume ngắn) **+ #19 11:30:25Z** (→ d8dc09fe; parent ghi boot-id lúc spawn ~11:35Z, **chỉ probe #16 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (X1–X9 tới ~10:46Z + closing; X6 ghi 0 EPERM trong 8 lần đo; 33 dòng "sóng EPERM đã tắt" là in mặc định khi ghi thử đầu tiên thành công — **dương tính giả, xem §2.3**); nhưng **~51' cuối (10:46:20Z → 11:37:18Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |
| 16 | — (đợt 97 Y8 → đợt 98 Z7) | #16 11:37:29Z | mù 11:37:29–14:38:22Z (~181') | **1 REBOOT ĐÃ XÁC NHẬN** — **#20 13:24:41Z** (→ 65bc5fb6; parent ghi giờ lúc spawn ~14:35Z, **chỉ probe #17 xác minh id boot mới**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (Y1–Y10 tới ~12:57Z + closing; Y10 O8 21/21 cả 2 engine 12:48–12:50Z; 10 dòng "sóng EPERM đã tắt" là dương tính giả đã biết — **0 "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật**); nhưng **~92' cuối (13:03:12Z → ~14:35Z) hoàn toàn không có bản ghi** — khoảng trống cuối-mù dài nhất từng ghi, không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — script V6/W7/X7/Y8, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6/W7/X7/Y8 `hidden_files/round98-z7/scan-wfs.sh`
(copy từ `round97-y8/scan-wfs.sh`, chỉ đổi thư mục OUT — đã diff,
giống hệt trừ thư mục OUT): chuẩn mới (prune mọi cấp
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server`, `release*`, `build`)
+ đối chiếu R7b (giữ base prune, chỉ loại `release*`/
`bundled-server`/`assets` ở gốc) + đối chiếu chéo bản copy (loại
`node_modules`). Đếm theo **dòng**, chỉ tính file có count > 0.

### 3.2 Kết quả (snapshot 14:42:21–14:42:46Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | Y8 (~11:38Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.589** | 11.982 | 2.566 / 11.960 |
| Source code thật | **160** | 193 | 134 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **173** | 173 | 160 |
| **Tổng writeFileSync (dòng)** | **333** | **358** | **294** |

Đối chiếu chéo: chuẩn mới 333 + bản copy 25 (3 build + 22 release)
= **358**; R7b = **358** — chênh **0, khớp tuyệt đối, không cần
tính file tạo giữa chừng** — lần thứ năm liên tiếp chênh 0 sau đối
chiếu (X7, Y8, nay Z7; xem §4 mục 4 về snapshot động). Hit list
chuẩn mới có **0 đường dẫn chứa `release*/` hay `build/`** (verify
bằng grep — 0 hit, như Y8). Bản copy 25 dòng / 17 file giống hệt
Y8 (3 build + 11 release/linux-unpacked + 11
release-round55-l4).

**Giải thích +39 dòng vs Y8 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 2 nhóm, 0 file biến mất:

- **+13 docs:**
  - `PHASE9_GAP_ANALYSIS.md` 10 → **11** (§26 mới ở closing đợt 97
    — dòng nhắc probe #16).
  - `docs/PHASE9_ROUND97_LIMITS.md` — **2 dòng** (closing đợt 97).
  - `docs/PHASE9_ROUND97_Y8_EPERM_PROBE_LIMITS.md` — **9 dòng**
    (chính file LIMITS của Y8, viết sau khi Y8 quét).
  - `docs/PHASE9_ROUND97_Y10_VERIFY_LIMITS.md` — **1 dòng**
    (verify đợt 97, viết sau khi Y8 quét).
- **+26 source — 6 harness đo mới** (đã đọc từng dòng writeFileSync,
  toàn ghi file probe sóng / vite cfg tạm / kết quả đo vào SCRATCH,
  không phải đường ghi production):
  - `apps/web/scripts/probe97y4.mjs` — **1 dòng** (Y4, mtime
    11:52:31Z; `fs.writeFileSync(waveProbeFile, "x")` — file probe
    sóng, cùng mẫu với probe96x4 của X4).
  - `apps/web/scripts/probe97y5-frame-parity.mjs` — **5 dòng**
    (Y5, mtime 12:27:38Z; 1 dòng ghi vite cfg tạm + 4 dòng ghi
    `frame-parity-results.json` / `frame-parity-log.txt` /
    `frame-parity-error.txt` vào SCRATCH).
  - `apps/web/scripts/probe97y6-frame-parity.mjs` — **5 dòng**
    (Y6, mtime 11:37:54Z — chính file Y8 bắt gặp tạo giữa chừng
    trong quét đợt 97; nay đã vào chuẩn mới).
  - `apps/web/scripts/probe97y7-frame-parity.mjs` — **5 dòng**
    (Y7, mtime 11:39:57Z; cùng mẫu Y5/Y6).
  - `apps/web/scripts/probe98z5-frame-parity.mjs` — **5 dòng**
    (Z5 sibling đợt 98, mtime 14:40:21Z — tạo giữa probe #17
    14:38:22Z và quét này 14:42:21Z; cùng mẫu).
  - `apps/web/scripts/probe98z5-y5blind.mjs` — **5 dòng**
    (Z5 sibling đợt 98, mtime 14:40:21Z; cùng mẫu).

13 + 26 = 39, khớp đúng chênh lệch. **Lưu ý snapshot động:** Z5
tạo 2 file (10 dòng) lúc 14:40:21Z, tức sau probe #17 nhưng trước
quét 14:42:21Z — lần này cả hai file đều lọt vào cả hai lần find
nên đối chiếu chéo vẫn khớp tuyệt đối; các LIMITS đợt 98 viết sau
thời điểm quét sẽ làm số docs tăng thêm ở lượt sau — đó là tăng do
tài liệu, không phải đường ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`,
quét bằng find có prune node_modules/.venv* (grep đệ quy trực tiếp
trên `server/` quá chậm do `.venv2`; `git grep` bỏ sót vì 2 file
helper không nằm trong index git — đã kiểm bằng grep trực tiếp):
**2 hit** — chính 2 helper, giống hệt Y8/X7/W7/V6/U8 (trừ 2 hit
Gradio vendored dưới `server/tts/.venv2/`, đã loại theo prune như
mọi lần — API `writeFile` của ffmpeg.wasm FS trong bộ nhớ, không
phải ghi đĩa Node):

- `apps/desktop/src/services/epermRetry.js:116`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  desktop.
- `apps/web/scripts/eperm-retry.mjs:71`
  (`await f.writeFile(file, data)`) — **chính lệnh ghi của helper**
  web.

**Async `fs.writeFile(` production ngoài helper: 0.**

**Kết luận quét: KHÔNG còn đường ghi production nào chưa nối helper
eperm-retry. Số "code" theo chuẩn mới là 160 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6/W7/X7/
   Y8 đã sửa lỗi này của U8 — **lượt sau dùng script V6/W7/X7/Y8/
   Z7 (`hidden_files/round98-z7/scan-wfs.sh`, giống hệt script V6
   trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6/W7/X7/Y8.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này Z5 tạo 2
   file lúc 14:40:21Z (giữa probe #17 và quét) nhưng cả hai đều lọt
   vào cả hai lần find nên đối chiếu chéo khớp tuyệt đối không cần
   tính file tạo giữa chừng — khác Y8 (1 file lọt giữa hai lần
   find, chênh 5). Ghi rõ cửa sổ snapshot và đối chiếu chéo số
   chênh, đừng ép hai lần quét phải khớp tuyệt đối khi cây đang
   đổi — **diff hit list để tìm file tạo giữa chừng, đừng kết luận
   sai phương pháp**.
5. Scratch quét để trong
   `hidden_files/round98-z7/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #15 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy a3a13d5a → d8dc09fe; boot 04b83831 chỉ còn trong log luồng
   + build-loop-log. Lượt này mù #16 chỉ có 1 reboot nên bước nhảy
   d8dc09fe → 65bc5fb6 là thật, không gộp — **nhưng bài học vẫn
   đứng: khi thấy `boot changed` phải đối chiếu log sibling/
   build-loop-log xem có boot trung gian không, đừng tin bước nhảy
   là 1 reboot duy nhất.** Ghi boot từ `who -b` / `uptime -s`
   RIÊNG là bắt buộc, không phải khuyến nghị.
7. **Kẹp giờ reboot bằng mtime (X7 §4.7):** khi một reboot được
   luồng đang chạy quan sát trực tiếp nhưng giờ từng giây chưa
   chốt, kẹp bằng file cuối cùng trước reboot và file đầu tiên sau
   reboot. Lượt này KHÔNG cần kẹp mtime cho #20 vì `uptime -s`
   trực tiếp đã cho giờ chính xác từng giây (13:24:41Z); kẹp mtime
   chỉ dùng để xác định khoảng trống không-bản-ghi
   13:03:12Z → ~14:35Z (~92').
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** dòng đó in khi lần ghi thử ĐẦU TIÊN thành công
   ngay — tức in mặc định cả khi không có sóng. Chỉ dòng "sóng
   EPERM vẫn bật sau …s chờ" hoặc "Operation not permitted" mới
   tính là bằng chứng sóng. Lượt này áp dụng lại: 10 dòng "đã
   tắt" trong cây round97 (Y4 11:57–12:02Z, Y10 12:48–12:50Z) đều
   là dương tính giả; 0 dòng "vẫn bật", 0 "Operation not
   permitted" thật.
9. **Async writeFile: đừng dùng `git grep`** — 2 file helper
   (`epermRetry.js`, `eperm-retry.mjs`) không nằm trong index git
   nên `git grep` trả về 0 hit sai. Dùng find có prune
   node_modules/.venv* + grep trực tiếp (lượt này), hoặc grep
   đệ quy tránh `server/tts/.venv2`.
10. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây:** lượt này
    file cuối trước khoảng trống khác nhau giữa hai cây
    (hidden_files: round93-u4/work 13:03:12Z; repo: ROUND97_LIMITS
    12:57Z) — lấy mốc muộn nhất (13:03:12Z) làm đầu khoảng trống,
    đừng chỉ nhìn một cây. 40 file round93-u4/work chạm
    13:00:46–13:03:12Z không rõ nguồn (nội dung dry-run U4 đợt 93,
    không log .md nào ghi nhận, `ps aux` lúc 14:44Z = 0 tiến trình
    khớp) — ghi nhận trung thực, không đoán nguồn.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #17 OK 2/2) — và ~92' cuối khoảng mù #16 hoàn toàn
   không có bản ghi (khoảng trống cuối-mù dài nhất từng ghi).
   Sóng gần nhất: ~11:55–12:11Z, ~26h27' trước probe #17.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). Z7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #16 dài ~181' chứa **reboot #20**, là **khoảng mù
   thứ 9 liên tiếp (#8–#16) chứa reboot**; khoảng mù #8 đã chứng
   minh có thể chứa cả một sóng đầy đủ; khoảng trống không-bản-ghi
   cuối mù nay là ~92' (dài nhất từng ghi — đủ chứa nhiều sóng
   ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3, Y8 §5 mục 3; 3 dòng lạ 11:59–12:00Z vẫn còn trong
   log, không thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h03'/lần** (20 lần/~41h07'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến ~15:28Z.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 6 mẫu MemAvailable
   **645 / 1080 / 1136 / 1220 / 1451 / 892 MB** (max 1.451 MB = 24%
   ngưỡng guard 6144 MB). Max THẤP hơn nhiều so với max 2.610 MB
   của Y8 (RAM dao động mạnh theo tải các luồng song song; mẫu thấp
   645 MB gần kỷ lục thấp 507 MB của X7) — vẫn dưới một phần tư
   ngưỡng guard nên chưa đủ mức thử lại theo quy tắc parent đợt 92
   §3 mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC).
   Ghi rõ để parent quyết: nếu RAM khả dụng chạm ≥ 6 GB thì mới
   thử lại. Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Giờ từng giây reboot #16 vẫn chưa chốt** (kẹp mtime 07:26:03 →
   07:34:14Z; ước lượng W9 ~07:25–07:28Z) — nợ nhỏ cho lượt sau nếu
   ai đó tìm được log có timestamp chặt hơn (verify.sh của W9 đã bị
   giết giữa chừng nên không còn dòng log nào trong khoảng kẹp).
10. **40 file round93-u4/work chạm 13:00:46–13:03:12Z không rõ
    nguồn** (xem §2.3 + §4 mục 10) — nợ nhỏ: nếu luồng nào đợt 98
    nhận là của mình thì ghi chú lại, nếu không thì giữ nguyên là
    "chưa xác định".
11. **Khoảng mù #17 bắt đầu từ 14:38:22Z** (probe #17) — lượt sau
    (probe #18) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~15:28Z.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND98_Z7_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round98-z7-eperm-probe.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z7.md`
(log luồng); scratch quét trong `hidden_files/round98-z7/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
