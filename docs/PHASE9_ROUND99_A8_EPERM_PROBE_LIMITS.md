# PHASE9 ROUND99 A8 — EPERM: probe #18 + khoảng mù #17 (2 reboot) + quét writeFileSync (nợ LIMITS gộp đợt 98 §4 mục 9)

> Luồng A8, đợt 99 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 13/11/2026; làm việc ~17:39–17:44Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #17
> (14:38:22Z) + quét lại writeFileSync bằng script V6/W7/X7/Y8/Z7
> (`hidden_files/round99-a8/scan-wfs.sh`, copy từ `round98-z7`,
> chỉ đổi thư mục OUT — không đổi logic) + ghi RAM hiện tại
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 17:40:06Z
  báo **DEAD/STALE** (heartbeat age 10.904 s, last #17 14:38:22Z,
  boot 65bc5fb6, exit 1); `once` ngay sau đó là **probe #18,
  boot 99338d31 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=18), exit 0.
- **Khoảng mù #17: 14:38:22Z → 17:40:14Z (~182')** — chứa **2 REBOOT
  ĐÃ XÁC NHẬN: #21 15:24:27Z (boot 65bc5fb6 →
  0b32ac3a, Z10 quan sát trực tiếp lúc xảy ra) + #22 17:25:39Z
  chính xác từng giây (boot 0b32ac3a → 99338d31, probe #18 xác
  minh id)** — xác minh số thứ tự reboot #22 mà parent ghi lúc
  spawn đợt 99 ("reboot ~17:26Z, tức reboot #22") là ĐÚNG.
  Dòng `boot changed` của probe lại GỘP (65bc5fb6 → 99338d31,
  nuốt boot trung gian 0b32ac3a) — nối lại chuỗi gộp sau 1 lần
  đứt ở mù #16.
- **Hoạt động liên tục 14:38Z → 15:37:40Z** (Z1–Z9 hạ cánh
  15:19:05Z; Z10 verify part 2 trên boot mới 15:26–15:37:40Z) —
  một reboot trong cửa sổ này ngoài #21 sẽ giết tiến trình đang
  chạy, nên không có reboot nào khác trước 15:37:40Z. **Khoảng
  trống không-bản-ghi ~117' (15:37:40Z → ~17:35Z, lúc spawn đợt
  99)**, chứa reboot #22; reboot thứ ba trong khoảng trống không
  loại trừ tuyệt đối được (journal/wtmp chỉ giữ boot hiện tại),
  nhưng không có bằng chứng nào cho nó và 2 reboot trong ~117'
  chưa từng xảy ra (khoảng cách ngắn nhất từng ghi ~1h52').
- **Không tìm thấy bằng chứng sóng EPERM thật trong các bản ghi
  còn lại của khoảng mù** — 0 dòng "sóng EPERM vẫn bật", 0 dòng
  "CẢNH BÁO: chờ sóng EPERM 10 phút", 0 lần "Operation not
  permitted" thật (mọi hit grep đều là chữ trong chính file LIMITS
  của Z7 hoặc tên test `hasEperm`). 2 dòng "sóng EPERM đã tắt"
  trong log thật (Z10 O8 15:30:43Z + 15:31:36Z, trên boot 0b32ac3a
  sau reboot #21) đều là **dương tính giả đã biết**. Sóng gần nhất
  vẫn là **~11:55–12:11Z** (R7) — ~29h29' trước probe #18. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 356 dòng / 115 file** (phạm vi
  2.605 file) — source thật **183** (+23 vs Z7), mẫu trong docs
  **173** (không đổi). Đối chiếu phương pháp R7 cũ (R7b):
  **381 dòng**; đối chiếu chéo 356 + 25 bản copy = **381,
  khớp tuyệt đối, chênh 0** — lần thứ sáu liên tiếp chênh 0 sau
  đối chiếu. **Không còn đường ghi production nào chưa nối
  helper.** Async `fs.writeFile` production ngoài helper: **0**
  (không đổi).
- **RAM: 6 mẫu MemAvailable 528 / 1302 / 1241 / 1229 / 1999 /
  1324 MB** (max 1.999 MB = 33% ngưỡng guard 6144 MB) — birefnet
  KHÔNG chạy, đúng quy tắc chỉ thử lại khi RAM đổi theo hướng có
  lợi ĐỦ MỨC (xem §5 mục 6).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 17:39:52–17:40:06Z | boot_id `99338d31-a4bc-4020-b910-301c997a24a2`; `who -b` Nov 12 17:25; `uptime -s` **2026-11-12 17:25:39Z** (uptime ~14'); journal chỉ 1 boot (99338d31, first entry 17:25:50Z); `last -x reboot` 17:25 still running; wtmp bắt đầu 17:25:50Z |
| `bash scripts/probe-eperm-v2.sh status` | 17:40:06Z | **DEAD/STALE**, exit 1 — heartbeat n=17, ts 14:38:22Z, boot 65bc5fb6, age **10.904 s**; last sample probe #17; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 17:40:14Z | **probe #18, boot=99338d31, ok=2 fail=0**, exit 0; dòng `boot changed 65bc5fb6 -> 99338d31` (GỘP — nuốt boot trung gian 0b32ac3a, xem §2.2) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 17:40:14Z | **ALIVE**, age 0 s, n=18, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 46 dòng, trước lượt 43 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=18, ts
17:40:14Z, pid=7689→mới, boot 99338d31-a4bc-4020-b910-301c997a24a2).

## 2. Điều tra khoảng mù kể từ probe #17

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 17:39–17:44Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 17:25:39Z**, boot_id
  `99338d31-a4bc-4020-b910-301c997a24a2` — khác boot của probe #17
  (65bc5fb6).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 99338d31…,
  first entry 17:25:50Z, last 17:38:44Z). `last -x reboot`: chỉ 1
  dòng (17:25, still running). wtmp bắt đầu 17:25:50Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 17:40:14Z ghi vào log chỉ ghi
  **65bc5fb6 → 99338d31** — GỘP 2 reboot (xem §2.2): boot trung
  gian 0b32ac3a chỉ còn trong log luồng Z10 + build-loop-log.

### 2.2 Hai reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 21 | **15:24:27Z** | 65bc5fb6 → 0b32ac3a | Z10 quan sát trực tiếp lúc xảy ra (giết verify part 1 giữa U4); ghi trong `hidden_files/round98-z10.md` + build-loop-log. Probe #18 KHÔNG thấy boot này — dòng `boot changed` nuốt nó. |
| 22 | **17:25:39Z (chính xác từng giây)** | 0b32ac3a → 99338d31 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 17:25:50Z); `last -x reboot` (17:25, still running); wtmp bắt đầu 17:25:50Z. Parent ĐÃ ghi "~17:26Z, tức reboot #22" lúc spawn đợt 99 — probe #18 xác minh giờ chính xác từng giây (17:25:39Z) và id boot mới là 99338d31, khớp đúng số thứ tự. |

Chu kỳ reboot nay là **22 lần trong ~45h07'** (từ ~20:18Z 10/11 tới
17:25:39Z 12/11) — trung bình ~2h03'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; Z7: 20 lần / ~41h07' ≈ 2h03').
Khoảng cách #21 → #22 là **2h01'12"** — đúng chu kỳ. Reboot tiếp
theo dự kiến **~19:29Z** (17:25:39Z + ~2h03'). Mọi probe nền đều
chết theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau
hồi phục bằng 1 mẫu mới.

Khoảng mù #17 là **khoảng mù thứ 10 liên tiếp (#8–#17) chứa reboot**,
và là **mù thứ 6 chứa 2 reboot** (#9, #11, #13, #14, #15, nay #17).
Dòng `boot changed` gộp trở lại sau đúng 1 lần đứt ở mù #16 —
chuỗi gộp nay là #13, #14, #15, [đứt #16], #17.

**Vì sao khẳng định không có reboot nào khác trước 15:37:40Z:**
hoạt động ghi đĩa liên tục 14:38Z → 15:37:40Z — Z1–Z9 hạ cánh
15:19:05Z (Z10 poll đĩa: ALL LANDED), Z10 verify part 2 chạy
15:26–15:37Z trên boot mới (verify log 15:30, O8 log 15:32, Z10
LIMITS 15:36:58Z, round98-z10.md 15:37:11Z, build-loop-log
15:37:40Z). Một reboot trong cửa sổ này sẽ giết các tiến trình
đang chạy — không tiến trình nào báo chết giữa chừng ngoài #21
lúc 15:24:27Z. **Sau 15:37:40Z thì không chứng minh được:** khoảng
trống không-bản-ghi ~117' (15:37:40Z → ~17:35Z lúc parent spawn
đợt 99) đủ dài để chứa thêm một reboot mà không để lại dấu vết —
nhưng không có bằng chứng nào cho reboot thứ ba, và 2 reboot trong
~117' chưa từng xảy ra trong lịch sử 22 lần reboot (khoảng cách
ngắn nhất từng ghi ~1h52' giữa #16 07:26–07:34Z và #17 08:01:15Z;
một reboot thứ ba trong khoảng trống sẽ đòi 2 khoảng cách cộng
lại chỉ ~2h01', tức trung bình ~1h — thấp hơn nhiều so với mọi
khoảng cách từng quan sát).

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 98 + đợt 99 tới lúc này

Khoảng mù 14:38:22Z → 17:40:14Z (~182') được phủ bởi các luồng
sibling đợt 98 (Z1–Z10, làm việc tới ~15:37Z) + khoảng trống
~117' + spawn đợt 99 (~17:35Z) + A7 đã bắt đầu chạy. Đã đọc lại
log thật (grep `EPERM|Operation not permitted` trên
`docs/PHASE9_ROUND98_*.md` + toàn bộ cây `hidden_files/round98-*`;
grep `sóng EPERM vẫn bật` / `CẢNH BÁO: chờ sóng` toàn cây; grep
`eperm|operation not permitted` trên `hidden_files/round99-a7/`
tới 17:44Z):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| Z1–Z9 (`docs/PHASE9_ROUND98_Z*.md`) | 14:38–15:17Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật; các hit grep đều là chữ trong chính file LIMITS của Z7 trích lại bài học |
| Z10 (`round98-z10.md` + verify log + O8 log) | 14:39–15:37Z | 2 dòng "sóng EPERM đã tắt" (O8 log 15:30:43Z + 15:31:36Z) — xem đính chính dưới; verify log chỉ có 6 dòng tên test `hasEperm` (assert phân biệt EPERM với port conflict), không phải sự kiện thật |
| Z9 base JSON (A7 copy lại) | 14:38–15:08Z | `eperm_in_measurement_logs: "0 occurrences in all 11 run logs (E1 x6 + N10 x5)"` — 0 dấu EPERM trong 11 lần đo |
| A7 (đợt 99, đã chạy) | ~17:40Z– | Chưa có log .md; grep toàn cây `round99-a7/` (trừ chrome-userdata): 0 lần nhắc EPERM ngoài chính file base JSON của Z9 nêu trên; e1-run1 đang chạy trên boot mới 99338d31 |
| 15:37:40Z → ~17:35Z | — | **Không có bản ghi nào**: file cuối trước khoảng trống là `build-loop-log.md` 15:37:40Z (hidden_files) và `docs/PHASE9_ROUND98_Z10_VERIFY_LIMITS.md` 15:36:58Z (repo); file đầu sau khoảng trống là các file `round99-a7/` từ 17:40:08Z (sibling A7). Trong repo-1, `find -newermt` 15:37Z–17:35Z trả về **0 file**. |

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 2 dòng "sóng EPERM đã tắt, khởi động vite"
trong `round98-z10-o8.log` (15:30:43Z, 15:31:36Z) đều là dòng in
khi lần ghi thử ĐẦU TIÊN thành công ngay (code launcher
`waveOff=true` ở lần write đầu) — in mặc định cả khi không có
sóng. Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s
chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn
bộ cây round98 + round99-a7 tới lúc này; **0 lần "Operation not
permitted" thật** (mọi hit grep đều là chữ trong LIMITS của Z7
hoặc tên test `hasEperm`).

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~117' cuối (15:37:40Z → ~17:35Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#22,
  17:25:39Z) mà giờ chính xác chỉ probe mới chốt được (parent
  spawn chỉ ghi "~17:26Z", probe xác minh id boot + giờ từng giây).
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~29h29' trước probe
  #18 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- Khoảng trống không-bản-ghi ~117' là dài nhất từng ghi ở cuối một
  khoảng mù (vượt ~92' của mù #16, ~87' của mù #9, ~78' của mù
  #13, ~62' của mù #10, ~51' của mù #15).

### 2.4 Bảng 17 lần chết / khoảng mù (cập nhật từ bảng 16 lần của Z7 §2.4)

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
| 17 | — (đợt 98 Z7 → đợt 99 A8) | #17 14:38:22Z | mù 14:38:22–17:40:14Z (~182') | **2 REBOOT ĐÃ XÁC NHẬN** — **#21 15:24:27Z** (→ 0b32ac3a, **Z10 quan sát trực tiếp lúc xảy ra**, giết verify part 1 giữa U4) **+ #22 17:25:39Z chính xác từng giây** (→ 99338d31; parent ghi "~17:26Z, reboot #22" lúc spawn, **chỉ probe #18 xác minh id boot + giờ chính xác**; dòng `boot changed` GỘP cả hai, nuốt boot 0b32ac3a). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (Z1–Z10 tới ~15:37:40Z; Z9: 0 dấu EPERM trong 11 lần đo; 2 dòng "sóng EPERM đã tắt" của Z10 O8 là dương tính giả đã biết — **0 "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật**); nhưng **~117' cuối (15:37:40Z → ~17:35Z) hoàn toàn không có bản ghi** — khoảng trống cuối-mù dài nhất từng ghi, không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — script V6/W7/X7/Y8/Z7, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6/W7/X7/Y8/Z7 `hidden_files/round99-a8/scan-wfs.sh`
(copy từ `round98-z7/scan-wfs.sh`, chỉ đổi thư mục OUT — đã diff,
giống hệt trừ thư mục OUT): chuẩn mới (prune mọi cấp
`node_modules`, `.venv*`, `dist`, `chrome-userdata`,
`.eperm-probe*`, `assets`, `bundled-server`, `release*`, `build`)
+ đối chiếu R7b (giữ base prune, chỉ loại `release*`/
`bundled-server`/`assets` ở gốc) + đối chiếu chéo bản copy (loại
`node_modules`). Đếm theo **dòng**, chỉ tính file có count > 0.

### 3.2 Kết quả (snapshot 17:42:32–17:42:57Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | Z7 (~14:42Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.605** | 11.998 | 2.589 / 11.982 |
| Source code thật | **183** | 216 | 160 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **173** | 173 | 173 |
| **Tổng writeFileSync (dòng)** | **356** | **381** | **333** |

Đối chiếu chéo: chuẩn mới 356 + bản copy 25 (3 build + 22 release)
= **381**; R7b = **381** — chênh **0, khớp tuyệt đối, không cần
tính file tạo giữa chừng** — lần thứ sáu liên tiếp chênh 0 sau đối
chiếu (X7, Y8, Z7, nay A8; xem §4 mục 4 về snapshot động). Hit list
chuẩn mới có **0 đường dẫn chứa `release*/` hay `build/`** (verify
bằng grep — 0 hit, như Z7). Bản copy 25 dòng / 17 file giống hệt
Z7 (3 build + 11 release/linux-unpacked + 11
release-round55-l4) — diff `wfs-copies.txt` Z7 → A8 trống.

**Giải thích +23 dòng vs Z7 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 2 nhóm, 0 file biến mất:

- **+12 docs:**
  - `docs/PHASE9_ROUND98_Z7_EPERM_PROBE_LIMITS.md` — **9 dòng**
    (chính file LIMITS của Z7, viết sau khi Z7 quét).
  - `docs/PHASE9_ROUND98_LIMITS.md` — **1 dòng** (closing đợt 98).
  - `docs/PHASE9_ROUND98_Z10_VERIFY_LIMITS.md` — **1 dòng**
    (verify đợt 98, viết sau khi Z7 quét).
  - `PHASE9_GAP_ANALYSIS.md` 11 → **12** (§27 mới ở closing đợt 98
    — dòng nhắc probe #17).
- **+11 source — 3 harness đo mới của đợt 98** (đã đọc từng dòng
  writeFileSync, toàn ghi file probe sóng / vite cfg tạm / kết quả
  đo vào SCRATCH, không phải đường ghi production):
  - `apps/web/scripts/probe98z4-frame-parity.mjs` — **5 dòng**
    (Z4, mtime 14:58:03Z; 1 dòng ghi vite cfg tạm + 4 dòng ghi
    `frame-parity-results.json` / `frame-parity-log.txt` /
    `frame-parity-error.txt` vào SCRATCH).
  - `apps/web/scripts/probe98z6-frame-parity.mjs` — **5 dòng**
    (Z6, mtime 14:52:25Z; cùng mẫu).
  - `apps/web/scripts/probe98z3.mjs` — **1 dòng** (Z3, mtime
    14:57:27Z; `fs.writeFileSync(waveProbeFile, "x")` — file probe
    sóng, cùng mẫu với probe97y4 của Y4).

12 + 11 = 23, khớp đúng chênh lệch. **Lưu ý snapshot động:** A7
(sibling đợt 99) đang chạy e1-run1 lúc quét (file đầu 17:40:08Z)
nhưng không tạo file `.mjs`/`.md` mới trong cửa sổ quét
17:42:32–17:42:57Z nên đối chiếu chéo khớp tuyệt đối không cần
tính file tạo giữa chừng — khác Y8 (1 file lọt giữa hai lần find,
chênh 5). Các LIMITS đợt 99 viết sau thời điểm quét sẽ làm số docs
tăng thêm ở lượt sau — đó là tăng do tài liệu, không phải đường
ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`,
quét bằng find có prune node_modules/.venv* (grep đệ quy trực tiếp
trên `server/` quá chậm do `.venv2`; `git grep` bỏ sót vì 2 file
helper không nằm trong index git — đã kiểm bằng grep trực tiếp):
**2 hit** — chính 2 helper, giống hệt Z7/Y8/X7/W7/V6/U8 (trừ 2 hit
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
eperm-retry. Số "code" theo chuẩn mới là 183 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6/W7/X7/
   Y8/Z7 đã sửa lỗi này của U8 — **lượt sau dùng script V6/W7/X7/Y8/
   Z7/A8 (`hidden_files/round99-a8/scan-wfs.sh`, giống hệt script V6
   trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6/W7/X7/Y8/Z7.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này A7 đang
   chạy nhưng không tạo file đo mới trong cửa sổ quét nên đối chiếu
   chéo khớp tuyệt đối không cần tính file tạo giữa chừng — khác Y8
   (1 file lọt giữa hai lần find, chênh 5). Ghi rõ cửa sổ snapshot
   và đối chiếu chéo số chênh, đừng ép hai lần quét phải khớp tuyệt
   đối khi cây đang đổi — **diff hit list để tìm file tạo giữa
   chừng, đừng kết luận sai phương pháp**.
5. Scratch quét để trong
   `hidden_files/round99-a8/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #17 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy 65bc5fb6 → 99338d31; boot 0b32ac3a chỉ còn trong log luồng
   Z10 + build-loop-log. Lượt này mù #17 gộp trở lại sau 1 lần đứt
   ở mù #16 — **bài học vẫn đứng: khi thấy `boot changed` phải đối
   chiếu log sibling / build-loop-log xem có boot trung gian không,
   đừng tin bước nhảy là 1 reboot duy nhất.** Ghi boot từ `who -b` /
   `uptime -s` RIÊNG là bắt buộc, không phải khuyến nghị.
7. **Kẹp giờ reboot bằng mtime (X7 §4.7):** khi một reboot được
   luồng đang chạy quan sát trực tiếp nhưng giờ từng giây chưa
   chốt, kẹp bằng file cuối cùng trước reboot và file đầu tiên sau
   reboot. Lượt này KHÔNG cần kẹp mtime cho #22 vì `uptime -s`
   trực tiếp đã cho giờ chính xác từng giây (17:25:39Z); kẹp mtime
   chỉ dùng để xác định khoảng trống không-bản-ghi
   15:37:40Z → ~17:35Z (~117').
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** dòng đó in khi lần ghi thử ĐẦU TIÊN thành công
   ngay — tức in mặc định cả khi không có sóng. Chỉ dòng "sóng
   EPERM vẫn bật sau …s chờ" hoặc "Operation not permitted" mới
   tính là bằng chứng sóng. Lượt này áp dụng lại: 2 dòng "đã
   tắt" trong log O8 của Z10 (15:30:43Z, 15:31:36Z, trên boot
   0b32ac3a sau reboot #21) đều là dương tính giả; 0 dòng "vẫn
   bật", 0 "Operation not permitted" thật.
9. **Async writeFile: đừng dùng `git grep`** — 2 file helper
   (`epermRetry.js`, `eperm-retry.mjs`) không nằm trong index git
   nên `git grep` trả về 0 hit sai. Dùng find có prune
   node_modules/.venv* + grep trực tiếp (lượt này), hoặc grep
   đệ quy tránh `server/tts/.venv2`.
10. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây:** lượt này
    file cuối trước khoảng trống khác nhau giữa hai cây
    (hidden_files: build-loop-log.md 15:37:40Z; repo:
    Z10_VERIFY_LIMITS 15:36:58Z) — lấy mốc muộn nhất (15:37:40Z)
    làm đầu khoảng trống, đừng chỉ nhìn một cây. Trong repo-1,
    `find -newermt` 15:37Z–17:35Z trả về 0 file — khoảng trống
    được xác nhận độc lập trên cả hai cây.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #18 OK 2/2) — và ~117' cuối khoảng mù #17 hoàn toàn
   không có bản ghi (khoảng trống cuối-mù dài nhất từng ghi).
   Sóng gần nhất: ~11:55–12:11Z, ~29h29' trước probe #18.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2): lệnh
   cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). A8 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #17 dài ~182' chứa **2 reboot (#21, #22)**, là
   **khoảng mù thứ 10 liên tiếp (#8–#17) chứa reboot**; khoảng mù
   #8 đã chứng minh có thể chứa cả một sóng đầy đủ; khoảng trống
   không-bản-ghi cuối mù nay là ~117' (dài nhất từng ghi — đủ chứa
   nhiều sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3, Y8 §5 mục 3, Z7 §5 mục 3; 3 dòng lạ 11:59–12:00Z
   vẫn còn trong log, không thêm dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h03'/lần** (22 lần/~45h07'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến ~19:29Z.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 6 mẫu MemAvailable
   **528 / 1302 / 1241 / 1229 / 1999 / 1324 MB** (max 1.999 MB = 33%
   ngưỡng guard 6144 MB). Max vẫn dưới một phần ba ngưỡng guard nên
   chưa đủ mức thử lại theo quy tắc parent đợt 92 §3 mục 7 (chỉ thử
   lại khi RAM đổi theo hướng có lợi ĐỦ MỨC). Mẫu thấp 528 MB gần
   kỷ lục thấp 507 MB của X7 (RAM dao động mạnh theo tải các luồng
   song song). Ghi rõ để parent quyết: nếu RAM khả dụng chạm ≥ 6 GB
   thì mới thử lại. Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Giờ từng giây reboot #16 vẫn chưa chốt** (kẹp mtime 07:26:03 →
   07:34:14Z; ước lượng W9 ~07:25–07:28Z) — nợ nhỏ cho lượt sau nếu
   ai đó tìm được log có timestamp chặt hơn (verify.sh của W9 đã bị
   giết giữa chừng nên không còn dòng log nào trong khoảng kẹp).
10. **Khoảng mù #18 bắt đầu từ 17:40:14Z** (probe #18) — lượt sau
    (probe #19) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~19:29Z.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND99_A8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round99-a8-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a8.md`
(log luồng); scratch quét trong `hidden_files/round99-a8/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
