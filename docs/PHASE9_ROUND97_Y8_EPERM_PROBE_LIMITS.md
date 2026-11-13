# PHASE9 ROUND97 Y8 — EPERM: probe #16 + khoảng mù #15 (2 reboot) + quét writeFileSync (nợ LIMITS gộp đợt 96 §4 mục 10)

> Luồng Y8, đợt 97 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 12/11/2026; làm việc ~11:37–11:47Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + điều tra khoảng mù kể từ probe #15
> (08:40:51Z) + quét lại writeFileSync bằng script V6/W7/X7
> (`hidden_files/round96-x7/scan-wfs.sh`, copy sang `round97-y8`,
> chỉ đổi thư mục OUT — không đổi logic) + ghi RAM hiện tại
> (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard, xem §5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền** (chờ parent/user quyết — xem §5).

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 11:37:29Z
  báo **DEAD/STALE** (heartbeat age 10.598 s, last #15 08:40:51Z,
  boot a3a13d5a, exit 1); `once` ngay sau đó là **probe #16,
  boot d8dc09fe (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 0 s, n=16), exit 0.
- **Khoảng mù #15: 08:40:51Z → 11:37:29Z (~177')** — dài tương đương
  khoảng mù #14 (~181'). Trong đó có **2 lần reboot ĐÃ XÁC NHẬN**
  — khoảng mù thứ ba liên tiếp chứa 2 reboot (sau #13, #14):
  **#18 09:24:17Z chính xác từng giây (boot 04b83831)** và
  **#19 11:30:25Z chính xác từng giây (boot d8dc09fe)**.
- **Reboot #19 kẹp chính xác bằng `uptime -s` trực tiếp** (đo lúc
  11:37:26Z, trước `once`): **2026-11-12 11:30:25Z** — đính chính
  "~11:31Z" trong entry spawn đợt 97 của parent. `who -b` = Nov 12
  11:30; `boot_id` = `d8dc09fe-3363-436b-842d-a3c33f4319c5`;
  journal chỉ 1 boot (d8dc09fe, first entry 11:30:36Z); `last -x
  reboot` 11:30 still running; wtmp bắt đầu 11:30:36Z.
- **Dòng `boot changed` của probe LẠI gộp boot trung gian:**
  `a3a13d5a -> d8dc09fe`, bỏ qua boot 04b83831 (reboot #18) —
  lần thứ ba liên tiếp bài học này lặp lại (#13 bỏ qua 0597b689,
  #14 bỏ qua adcef40a). Boot ghi trong LIMITS này lấy từ `who -b` /
  `uptime -s` riêng, không tin dòng gộp.
- **Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại
  của khoảng mù** — nhưng đã kiểm chứng một "bằng chứng" tưởng là
  sóng là **dương tính giả**: 33 dòng log "sóng EPERM đã tắt, khởi
  động vite" (17 mốc giờ, 09:03–10:37Z) đều là dòng in khi lần ghi
  thử ĐẦU TIÊN thành công ngay (code `waveOff=true` ở lần write
  đầu tiên) — 0 dòng "sóng EPERM vẫn bật" (dòng chỉ in khi ghi
  thử thật sự bị chặn), 0 dòng "CẢNH BÁO: chờ sóng EPERM 10 phút",
  0 lần "Operation not permitted" trong toàn bộ log round96-x*.
  X6 ghi 0 EPERM trong 8 lần đo. Nhưng **~51' cuối khoảng mù
  (10:46:20Z → 11:37:18Z) hoàn toàn không có bản ghi nào** — đủ dài
  để chứa nhiều sóng ~16 phút mà không để lại dấu vết, và đã chứng
  minh chứa được một reboot (#19, 11:30:25Z) mà giờ chính xác chỉ
  probe mới chốt được. Sóng gần nhất vẫn là **~11:55–12:11Z**
  (R7) — ~23h26' trước probe #16. EPERM vẫn KHÔNG được tuyên bố
  là đã hết.
- **Quét writeFileSync chuẩn mới: 294 dòng / 100 file** (phạm vi
  2.566 file) — source thật **134** (+12 vs X7), mẫu trong docs
  **160** (+13 vs X7). Đối chiếu phương pháp R7 cũ (R7b):
  **324 dòng**; đối chiếu chéo 294 + 25 bản copy = 319, chênh **5**
  — **chênh này giải thích được đầy đủ**: file duy nhất ngoài
  tổng là `apps/web/scripts/probe97y6-frame-parity.mjs` (5 dòng),
  do luồng sibling Y6 tạo ra GIỮA hai lần find của quét (mtime
  11:37:54Z, trong cửa sổ quét 11:37:46–11:38:16Z). 294 + 25 + 5 =
  324, **khớp tuyệt đối sau khi tính file tạo giữa chừng** — lần
  thứ tư liên tiếp chênh 0 sau đối chiếu. **Không còn đường ghi
  production nào chưa nối helper.** Async `fs.writeFile`
  production ngoài helper: **0** (không đổi).
- **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (xem §5).
- **RAM: 6 mẫu MemAvailable 939 / 884 / 865 / 1791 / 2566 / 2610 MB**
  (max 2.610 MB = 42% ngưỡng guard 6144 MB) — max TĂNG gấp ~3× so
  với max 869 MB của X7, nhưng vẫn dưới một nửa ngưỡng guard —
  birefnet KHÔNG chạy, đúng quy tắc chỉ thử lại khi RAM đổi theo
  hướng có lợi ĐỦ MỨC (xem §5 mục 6).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:37:26Z | boot_id `d8dc09fe-3363-436b-842d-a3c33f4319c5`; `who -b` Nov 12 11:30; `uptime -s` **2026-11-12 11:30:25Z** (uptime 6–7'); journal chỉ 1 boot (d8dc09fe, first entry 11:30:36Z); `last -x reboot` 11:30 still running; wtmp bắt đầu 11:30:36Z |
| `bash scripts/probe-eperm-v2.sh status` | 11:37:29Z | **DEAD/STALE**, exit 1 — heartbeat n=15, ts 08:40:51Z, boot a3a13d5a, age **10.598 s**; last sample probe #15; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 11:37:29Z | **probe #16, boot=d8dc09fe, ok=2 fail=0**, exit 0; có dòng `boot changed a3a13d5a -> d8dc09fe` (GỘP — bỏ qua boot trung gian 04b83831, xem §2.2) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:37:29Z | **ALIVE**, age 0 s, n=16, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 40 dòng, trước lượt 37 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=16, ts
11:37:29Z, pid=5489, boot d8dc09fe-3363-436b-842d-a3c33f4319c5).

## 2. Điều tra khoảng mù kể từ probe #15

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 11:37–11:45Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 11:30:25Z**, boot_id
  `d8dc09fe-3363-436b-842d-a3c33f4319c5` — khác boot của probe #15
  (a3a13d5a).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, d8dc09fe…,
  first entry 11:30:36Z, last 11:36:57Z). `last -x reboot`: chỉ 1
  dòng (11:30, still running). wtmp bắt đầu 11:30:36Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 11:37:29Z ghi vào log chỉ ghi
  **a3a13d5a → d8dc09fe** — nó gộp mọi reboot trung gian thành một
  bước nhảy (heartbeat chỉ nhớ boot của mẫu cuối). Boot trung gian
  04b83831 chỉ còn trong log luồng + build-loop-log, không trong
  log probe.

### 2.2 Hai reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 18 | **09:24:17Z (chính xác từng giây)** | a3a13d5a → 04b83831 | LIMITS gộp đợt 96 §0 (parent xác minh; X9b poll log + file probe X5 mtime 09:24:34Z / LIMITS X6 xong 09:24:40Z ngay sau boot mới). Giết X1/X9 sạch; X4/X5/X6 resume ngắn sau reboot rồi mới dừng. |
| 19 | **11:30:25Z (chính xác từng giây)** | 04b83831 → d8dc09fe | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 11:30:36Z); `last -x reboot` (11:30, still running); wtmp bắt đầu 11:30:36Z. Parent ĐÃ ghi boot-id ở lúc spawn đợt 97 (~11:35–11:37Z, build-loop-log: "VM vừa reboot #19 ~11:31Z (boot d8dc09fe, uptime 5' lúc spawn, RAM khả dụng ~1,22 GB)") — giờ chính xác 11:30:25Z chỉ probe #16 mới chốt (đính chính "~11:31Z" → 11:30:25Z). |

Chu kỳ reboot nay là **19 lần trong ~39h12'** (từ ~20:18Z 10/11 tới
11:30:25Z 12/11) — trung bình ~2h04'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; X7: 17 lần / ~35h43' ≈ 2h06'). Mọi
probe nền đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi
nhận + lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #15 là **khoảng mù thứ 8 liên tiếp (#8–#15) chứa reboot**,
và là **khoảng mù thứ ba liên tiếp chứa 2 reboot đã xác nhận**
(sau #13, #14).

### 2.3 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 96 + đính chính dương tính giả

Khoảng mù 08:40:51Z → 11:37:29Z (~177') được phủ bởi các luồng
sibling đợt 96 (làm việc tới ~10:46Z) + closing của parent +
entry spawn đợt 97 (mtime build-loop-log 11:37:18Z), và hoàn toàn
mù từ **10:46:20Z → 11:37:18Z (~51')**. Đã đọc lại log thật của
các luồng (grep `eperm|EPERM` trên `round96-x*.md` + toàn bộ cây
`round96-x1`…`round96-x9b` + grep `Operation not permitted`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| X1/X1b (dir `round96-x1`, `round96-x1b-*`) | 08:41–10:25Z | Không nhắc sóng EPERM; X1b đo lại bogus, không liên quan EPERM |
| X2 (`round96-x2.md` + dir, 0 lần nhắc trong .md) | 08:41–~09:35Z | Không nhắc EPERM trong .md; dir có dòng "sóng EPERM đã tắt" — xem đính chính dưới |
| X3 (`round96-x3.md` + dir, 0 lần nhắc trong .md) | 08:41–10:11Z | Như X2 |
| X4 (`round96-x4*`, dir) | 08:42–09:41Z | Dòng "sóng EPERM đã tắt" 09:03:37Z — xem đính chính dưới |
| X5 (`round96-x5.md` + dir, 0 lần nhắc trong .md) | 08:42–10:35Z | Không nhắc sóng EPERM |
| X6 (`round96-x6*`, X6b-note, 0 lần nhắc) + docs X6 | 08:42–10:11Z | **0 EPERM trong 8 lần đo** (grep `EPERM\|Operation not permitted` trên run log: 0 kết quả); "Không có sóng EPERM hay port-conflict thật nào trong cửa sổ X6" |
| X7 (`round96-x7.md`, 6 lần nhắc) | 08:40–08:46Z | Chính probe #15 + quét writeFileSync — không phải sóng |
| X8 (`round96-x8.md` + dir, 0 lần nhắc trong .md) | 08:41–~09:40Z | Không nhắc sóng EPERM |
| X9/X9b (poll log + status, 0 lần nhắc) | 08:41–10:43Z | Poll đĩa, không nhắc sóng EPERM |
| Parent closing đợt 96 + spawn đợt 97 (build-loop-log) | ~10:43–11:37Z | Ghi reboot #18 trong khoảng mù #15 + reboot #19 lúc spawn — **không ghi nhận sóng EPERM** |
| 10:46:20Z → 11:37:18Z | — | **Không có bản ghi nào**: 0 file nào trong `hidden_files/`, `docs/` hay `repo-1` (loại node_modules/.venv/dist) sửa đổi trong cửa sổ này (find `-newermt` = 0 hit ngoài file biên); build-loop-log dừng ở đính chính parent đợt 96 rồi nhảy thẳng tới entry spawn đợt 97 (mtime 11:37:18Z). File cuối trước khoảng trống là `docs/PHASE9_ROUND96_X1_BLOB_2MIB_LIMITS.md` 10:46:20.322Z (parent sửa doc X1) |

**Đính chính dương tính giả (mới, lượt này — quan trọng cho các
lượt sau):** grep toàn cây `round96-x*` thấy **33 dòng "sóng EPERM
đã tắt, khởi động vite"** ở 17 mốc giờ (09:03:36–10:37:20Z, gồm
X4 09:03:37Z, X2 10:01:53Z/10:05:01Z, X3 10:07:05Z/10:08:01Z).
Đọc code launcher (`apps/web/scripts/probe90r2-playhead-canvas-sync.mjs`
dòng ~196–202, cùng mẫu trong clicktest-87o8-*.mjs,
probe89q5-seek-latency.mjs, probe91s2-playhead-sawtooth.mjs):

```js
let waveOff = false;
for (let w = 1; w <= 60 && !waveOff; w++) {
  try { fs.writeFileSync(waveProbeFile, "x"); waveOff = true; }
  catch { /* log "sóng EPERM vẫn bật" mỗi 6 lần */ await sleep(10000); }
}
if (waveOff) log("sóng EPERM đã tắt, khởi động vite");
```

`waveOff` thành `true` ngay ở **lần ghi thử ĐẦU TIÊN thành công** —
dòng "đã tắt" được in cả khi **không hề có sóng nào** (ghi thử đầu
tiên đã thành công). Bằng chứng phân biệt: **0 dòng "sóng EPERM vẫn
bật sau …s chờ"** (dòng này chỉ in khi ghi thử thật sự bị chặn, mỗi
60 s) trong toàn bộ log round96-x*; **0 dòng "CẢNH BÁO: chờ sóng
EPERM 10 phút không tắt"**; **0 lần "Operation not permitted"**
trong toàn bộ log round96-x*. Vậy 33 dòng "đã tắt" là **in mặc định
khi không có sóng**, không phải bằng chứng sóng đã từng bật rồi tắt.
**Bài học cho các lượt sau: đừng đếm dòng "sóng EPERM đã tắt" làm
bằng chứng sóng — chỉ dòng "vẫn bật" hoặc "Operation not permitted"
mới tính.**

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~51' cuối (10:46:20Z → 11:37:18Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — và đã chứng minh chứa được một reboot (#19,
  11:30:25Z) mà giờ chính xác chỉ probe mới chốt được.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~23h26' trước probe
  #16 (tính từ cuối sóng 12:11Z). EPERM vẫn KHÔNG được tuyên bố
  là đã hết.
- Reboot trung gian khác trong 10:46:20Z → 11:30:25Z không loại trừ
  được (journal/wtmp chỉ giữ boot hiện tại; dòng `boot changed`
  gộp mọi reboot trung gian). Trong 08:40:51Z → ~10:46Z, hoạt động
  liên tục của X1–X9 làm một reboot không-ai-thấy khó xảy ra (một
  reboot sẽ giết phiên đang chạy, như #18 đã giết X1/X9) — nhưng
  không chứng minh tuyệt đối được.

### 2.4 Bảng 15 lần chết / khoảng mù (cập nhật từ bảng 14 lần của X7 §2.4)

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
| 15 | — (đợt 96 X7 → đợt 97 Y8) | #15 08:40:51Z | mù 08:40:51–11:37:29Z (~177') | **2 REBOOT ĐÃ XÁC NHẬN** — **#18 09:24:17Z** (→ 04b83831; giết X1/X9 sạch, X4/X5/X6 resume ngắn) **+ #19 11:30:25Z** (→ d8dc09fe; parent ghi boot-id lúc spawn ~11:35Z, **chỉ probe #16 chốt giờ chính xác**). **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (X1–X9 tới ~10:46Z + closing; X6 ghi 0 EPERM trong 8 lần đo; 33 dòng "sóng EPERM đã tắt" là in mặc định khi ghi thử đầu tiên thành công — **dương tính giả, xem §2.3**); nhưng **~51' cuối (10:46:20Z → 11:37:18Z) hoàn toàn không có bản ghi** — không loại trừ sóng lẫn reboot trung gian trong cửa sổ đó |

## 3. Quét writeFileSync — script V6/W7/X7, không đổi phương pháp

### 3.1 Phương pháp

Chạy đúng script V6/W7/X7 `hidden_files/round97-y8/scan-wfs.sh`
(copy từ `round96-x7/scan-wfs.sh`, chỉ đổi thư mục OUT — không đổi
logic): chuẩn mới (prune mọi cấp `node_modules`, `.venv*`,
`dist`, `chrome-userdata`, `.eperm-probe*`, `assets`,
`bundled-server`, `release*`, `build`) + đối chiếu R7b (giữ base
prune, chỉ loại `release*`/`bundled-server`/`assets` ở gốc) + đối
chiếu chéo bản copy (loại `node_modules`). Đếm theo **dòng**, chỉ
tính file có count > 0.

### 3.2 Kết quả (snapshot 11:37:46–11:38:16Z)

| Nhóm | Chuẩn mới | R7 cũ đúng (R7b, đối chiếu) | X7 (~08:41Z) |
|---|---|---|---|
| File trong phạm vi quét | **2.566** | 11.960 | 2.545 / 11.938 |
| Source code thật | **134** | 164 | 122 |
| Bản copy `apps/desktop/build/bundled-server/` | **loại** | 3 | 3 |
| Bản copy `apps/desktop/release*/linux-unpacked/` | **loại** | 22 | 22 |
| Mẫu trong docs (*.md) | **160** | 160 | 147 |
| **Tổng writeFileSync (dòng)** | **294** | **324** | **269** |

Đối chiếu chéo: chuẩn mới 294 + bản copy 25 (3 build + 22 release)
= **319**; R7b = **324** — chênh **5**, nhưng chênh này **giải
thích được đầy đủ bằng 1 file duy nhất**: diff hai hit list cho
thấy file duy nhất có trong R7b mà không có trong tổng chuẩn mới +
bản copy là **`apps/web/scripts/probe97y6-frame-parity.mjs` (5
dòng)**, mtime **11:37:54Z** — tức được luồng sibling Y6 tạo ra
**GIỮA hai lần find của quét** (find chuẩn mới chạy trước
11:37:54Z, find R7b chạy sau; cửa sổ quét 11:37:46–11:38:16Z).
294 + 25 + 5 = **324, khớp tuyệt đối sau khi tính file tạo giữa
chừng** — lần thứ tư liên tiếp chênh 0 sau đối chiếu (X7 cũng
chênh 0; xem §4 mục 4 về snapshot động). Hit list chuẩn mới có
**0 đường dẫn chứa `release*/` hay `build/`** (verify bằng grep —
0 hit, như X7).

**Giải thích +25 dòng vs X7 (diff trực tiếp hai hit list, không suy
luận từ mtime):** 2 nhóm, 0 file biến mất:

- **+13 docs:**
  - `docs/PHASE9_ROUND96_LIMITS.md` — **2 dòng** (closing đợt 96).
  - `docs/PHASE9_ROUND96_X7_EPERM_PROBE_LIMITS.md` — **10 dòng**
    (chính file LIMITS của X7, viết sau khi X7 quét).
  - `PHASE9_GAP_ANALYSIS.md` 9 → **10** (§25 mới ở closing đợt 96).
- **+12 source — 4 harness đo mới của đợt 96** (đã đọc từng dòng,
  toàn ghi scratch/kết quả đo/vite cfg tạm/file probe sóng, không
  phải đường ghi production):
  - `apps/web/scripts/probe96x4.mjs` — **1 dòng**
    (X4, `fs.writeFileSync(waveProbeFile, "x")` — file probe sóng,
    cùng mẫu với probe94v2 của V2 / probe95w5 của W5).
  - `apps/web/scripts/probe96x4b.mjs` — **1 dòng**
    (X4b, cùng mẫu probe sóng).
  - `apps/web/scripts/probe96x5-frame-parity.mjs` — **5 dòng**
    (X5, 1 dòng ghi vite cfg tạm + 4 dòng ghi
    `frame-parity-results.json` / `frame-parity-log.txt` /
    `frame-parity-error.txt` vào SCRATCH).
  - `apps/web/scripts/probe96x5b-frame-parity.mjs` — **5 dòng**
    (X5b, cùng mẫu X5).

13 + 12 = 25, khớp đúng chênh lệch. File thứ 5 của cùng họ,
`probe97y6-frame-parity.mjs` (Y6, đợt 97 đang chạy), chỉ xuất hiện
trong R7b vì tạo giữa chừng — sẽ vào chuẩn mới ở lượt sau.

**Lưu ý snapshot động:** đợt 97 có 10 luồng Y1–Y10 chạy song song;
lượt này bắt được tận mắt một file mới xuất hiện giữa hai lần find
(probe97y6, 11:37:54Z). Các LIMITS đợt 97 viết sau thời điểm quét
sẽ làm số docs tăng thêm ở lượt sau — đó là tăng do tài liệu,
không phải đường ghi mới.

### 3.3 Async writeFile

`.writeFile(` (async, mọi dạng) trong code production
(`apps/web/src`, `server`, `apps/desktop/src`, `mcp-server/src`,
`cli/src`, `packages`, `apps/web/scripts`), loại `writeFileSync`,
quét bằng find có prune node_modules/.venv* (grep đệ quy trực tiếp
trên `server/` quá chậm do `.venv2`; `git grep` bỏ sót vì 2 file
helper không nằm trong index git — đã kiểm bằng grep trực tiếp):
**2 hit** — chính 2 helper, giống hệt X7/W7/V6/U8 (trừ 2 hit
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
eperm-retry. Số "code" theo chuẩn mới là 134 dòng và sẽ không nhảy
giả mỗi lần build lại desktop nữa.**

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Luôn lọc count > 0 trước khi cộng** (bài học S7/T8 §4.1).
2. **R7-cũ phải giữ nguyên base prune** (node_modules/.venv*/dist/
   chrome-userdata/.eperm-probe*) — chỉ khác chuẩn mới ở chỗ
   release*/build chỉ loại ở gốc thay vì mọi cấp. Script V6/W7/X7
   đã sửa lỗi này của U8 — **lượt sau dùng script V6/W7/X7/Y8
   (`hidden_files/round97-y8/scan-wfs.sh`, giống hệt script V6
   trừ thư mục OUT)**, đừng dùng lại script U8.
3. **Trích bản copy phải loại node_modules**: `mime/src/build.js`
   nằm dưới `node_modules` trong cả `release*/` lẫn `build/` —
   regex `(^|/)build/` bắt nhầm 4 dòng; bản copy đúng phạm vi là 25
   dòng / 17 file (3 build + 22 release), khớp T8/S7/U8/V6/W7/X7.
4. **Quét trong lượt nhiều luồng song song là snapshot động:**
   file mới có thể xuất hiện giữa hai lần find. Lượt này CHỨNG
   MINH trực tiếp: `probe97y6-frame-parity.mjs` (5 dòng) xuất hiện
   11:37:54Z giữa hai lần find, làm R7b hơn tổng chuẩn mới + bản
   copy đúng 5 dòng. Ghi rõ cửa sổ snapshot và đối chiếu chéo số
   chênh, đừng ép hai lần quét phải khớp tuyệt đối khi cây đang
   đổi — **diff hit list để tìm file tạo giữa chừng, đừng kết luận
   sai phương pháp**.
5. Scratch quét để trong
   `hidden_files/round97-y8/` (sống qua reboot), không để /tmp —
   scratch của S7/T8/T9 trong /tmp đều đã mất sau reboot.
6. **Dòng `boot changed` của probe gộp mọi reboot trung gian:**
   khoảng mù #15 chứa 2 reboot nhưng log probe chỉ thấy một bước
   nhảy a3a13d5a → d8dc09fe; boot 04b83831 chỉ còn trong log luồng
   + build-loop-log. Lượt sau khi thấy `boot changed` phải đối
   chiếu log sibling/build-loop-log xem có boot trung gian không,
   đừng tin bước nhảy là 1 reboot duy nhất. **Bài học này nay đã
   lặp lại 3 lần liên tiếp (#13 bỏ qua 0597b689, #14 bỏ qua
   adcef40a, #15 bỏ qua 04b83831) — ghi boot từ `who -b` /
   `uptime -s` RIÊNG là bắt buộc, không phải khuyến nghị.**
7. **Kẹp giờ reboot bằng mtime (X7 §4.7):** khi một reboot được
   luồng đang chạy quan sát trực tiếp nhưng giờ từng giây chưa
   chốt, kẹp bằng file cuối cùng trước reboot và file đầu tiên sau
   reboot. Lượt này KHÔNG cần kẹp mtime cho #19 vì `uptime -s`
   trực tiếp đã cho giờ chính xác từng giây (11:30:25Z); kẹp mtime
   chỉ dùng để xác định khoảng trống không-bản-ghi
   10:46:20Z → 11:37:18Z (~51').
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (MỚI,
   lượt này):** dòng đó in khi lần ghi thử ĐẦU TIÊN thành công
   ngay — tức in mặc định cả khi không có sóng. Chỉ dòng "sóng
   EPERM vẫn bật sau …s chờ" hoặc "Operation not permitted" mới
   tính là bằng chứng sóng. Xem §2.3.
9. **Async writeFile: đừng dùng `git grep`** — 2 file helper
   (`epermRetry.js`, `eperm-retry.mjs`) không nằm trong index git
   nên `git grep` trả về 0 hit sai. Dùng find có prune
   node_modules/.venv* + grep trực tiếp (lượt này), hoặc grep
   đệ quy tránh `server/tts/.venv2`.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #16 OK 2/2) — và ~51' cuối khoảng mù #15 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~23h26' trước
   probe #16.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). Y8 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #15 dài ~177' chứa **2 reboot**, là **khoảng mù thứ
   8 liên tiếp (#8–#15) chứa reboot** và thứ ba liên tiếp chứa 2
   reboot; khoảng mù #8 đã chứng minh có thể chứa cả một sóng đầy
   đủ; khoảng trống không-bản-ghi cuối mù nay là ~51' (đủ chứa
   nhiều sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không thêm
   dòng lạ mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h04'/lần** (19 lần/~39h12'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục.
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 6 mẫu MemAvailable
   **939 / 884 / 865 / 1791 / 2566 / 2610 MB** (max 2.610 MB = 42%
   ngưỡng guard 6144 MB). Max TĂNG gấp ~3× so với max 869 MB của X7
   (và mẫu thấp 865 MB vẫn gần kỷ lục thấp 507 MB của X7) — có tín
   hiệu RAM tăng, nhưng **vẫn dưới một nửa ngưỡng guard 6 GB** nên
   chưa đủ mức thử lại theo quy tắc parent đợt 92 §3 mục 7 (chỉ thử
   lại khi RAM đổi theo hướng có lợi ĐỦ MỨC). Ghi rõ để parent quyết:
   nếu RAM khả dụng chạm ≥ 6 GB thì mới thử lại.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Giờ từng giây reboot #16 vẫn chưa chốt** (kẹp mtime 07:26:03 →
   07:34:14Z; ước lượng W9 ~07:25–07:28Z) — nợ nhỏ cho lượt sau nếu
   ai đó tìm được log có timestamp chặt hơn (verify.sh của W9 đã bị
   giết giữa chừng nên không còn dòng log nào trong khoảng kẹp).
10. **Khoảng mù #16 bắt đầu từ 11:37:29Z** (probe #16) — lượt sau
    (probe #17) đối chiếu từ mốc này.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND97_Y8_EPERM_PROBE_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round97-y8-eperm-probe.txt`
(mỗi dòng 1 đường dẫn tương đối từ repo root; verify bằng cách đọc
lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y8.md`
(log luồng); scratch quét trong `hidden_files/round97-y8/` (`scan-wfs.sh`,
`scan-meta.txt`, `files-newstd.bin`, `wfs-newstd.txt`, `files-r7b.bin`,
`wfs-r7b.txt`, `files-copies.txt`, `wfs-copies.txt`); log probe v2
append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).
