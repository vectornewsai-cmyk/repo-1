# PHASE9 ROUND137 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 3/3) + 2 lượt HB muộn lớn (+550 s / +643 s) + started_at lượt 137 ĐÃ BỊ VIẾT LẠI — bằng chứng trực tiếp đầu tiên (btime 09:36:01Z + 46 s)

- **Luồng:** T7 đợt 137 (lượt cron 15:35 +07 18/11/2026 = 08:35:51Z). Hai boot trong lúc làm việc: boot lúc mở **2104246b-04b2-4252-a642-b1a7cadeefe1, btime 08:07:11Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 08:40Z và 09:08Z, trùng nhau; khớp độc lập file `boot-verify.txt` của T2) và boot mới sau reboot giữa lượt **17db9652-ad06-409f-989c-cdbdba15d0af, btime 09:36:01Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 09:37Z và 10:06Z, trùng nhau; chỉ T7 xác minh — T2 đã đóng trước reboot). Reboot 08:07:11Z xảy ra TRƯỚC khi lượt 137 bắt đầu (trong khoảng trống giữa đợt 136 finished 07:27:37Z và đợt 137 started 08:35:51Z); reboot 09:36:01Z xảy ra GIỮA lượt 137, lúc run vcut 137 đang chạy.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 07:07:03Z 18/11 (lúc T7 đợt 136 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 136 + cờ `.done` đợt 137 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 136 gãy; đợt này lành lại): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 2 (+550 s, 07:50:50Z; +643 s, 08:20:50Z) |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 136 đã `succeeded`, đợt 137 đang `running`) | — | 0 | — |

**Dị thường started_at: kiểm thứ 8 của giả thuyết đã xác nhận — lượt 137 ĐÃ BỊ VIẾT LẠI tại reboot đầu tiên giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (bằng chứng trực tiếp đầu tiên, không còn suy từ đợt khác).** Lượt vcut đợt 137 (run `832a52f5`) started_at ghi 08:35:51Z ở kiểm lần 1 + 2 (jitter 0 s), sau reboot giữa lượt (boot 17db9652, btime 09:36:01Z) ghi nay **09:36:47Z = btime + 46 s**, jitter **+3.656 s**; KHÔNG bị viết lại lần 2 (boot không đổi tới 10:06Z). Đợt 135 (`f2fa4088`) KHÔNG bị viết lại lần 2 (vẫn 03:35:56Z qua cả 4 lần kiểm đợt này).

- Cập nhật lũy kế (cùng phương pháp đợt 125–136): heartbeat **44/211 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/177 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 07:07:03Z → 10:06:03Z 18/11

Cửa kiểm ~2h59'. Bốn lần kiểm (lần 1 ~08:40Z, lần 2 ~09:08Z, kiểm giữa ~09:37Z sau reboot, lần 3 ~10:06Z) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do reboot xen giữa).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 2 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 14:20:50 (07:20:50Z) | 6b57e85a | 07:15:34 | −316 s | CÓ |
| 14:50:50 (07:50:50Z) | af18a2e0 | 08:00:00 | **+550 s** | CÓ — MUỘN LỚN |
| 15:20:50 (08:20:50Z) | e58ac5a2 | 08:31:33 | **+643 s** | CÓ — MUỘN LỚN |
| 15:50:50 (08:50:50Z) | ed9020c0 | 08:45:34 | −316 s | CÓ |
| 16:20:50 (09:20:50Z) | 20f3bdf5 | 09:15:34 | −316 s | CÓ |
| 16:50:50 (09:50:50Z) | 9199da70 | 09:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. 4/6 lượt có jitter −316 s (mẫu chuẩn); chỉ 2 slot đầu cửa muộn.
- Slot 09:50:50Z chạy trên boot mới 17db9652 (btime 09:36:01Z) vẫn đúng giờ −316 s — scheduler hồi phục sau reboot giữa lượt.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:00 (08:00Z) | ae9e27b6 | 08:00:00 | 0 s | CÓ |
| 16:00 (09:00Z) | 3609f841 | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | 25b5a5c0 | 10:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

**Quy ước biên (đứng từ đợt 135):** slot HB 07:20:50Z thuộc cửa 137 (sau mốc 07:07:03Z của T7-136), KHÔNG đếm lại ở đợt 136. Slot HB tiếp theo sau cửa này là 10:20:50Z, DR tiếp theo là 11:00Z (thuộc T7-138).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả bốn lần kiểm:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng**; DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** (danh sách DR nhảy từ 04:00Z lên 06:00Z).
- Ngoài cửa sổ limit=15 lần này nên KHÔNG tái xác minh được: HB trước 01:50:50Z 18/11 (gồm 22:50:50Z 17/11 thiếu đợt 134, 16:20:50Z/16:50:50Z thiếu đợt 132, 13:50:50Z thiếu đợt 129); DR trước 03:00Z 17/11. Ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi. (DR có 1 khoảng trống cũ trong cửa sổ: danh sách nhảy từ 1794938400 xuống 1794931200 — thiếu 1 slot ~15:00Z 17/11 — ngoài cửa kiểm đợt này, không kết luận.)
- Các kết luận đợt 125–136 không đổi.

### 2.3 Hai lượt HB muộn lớn mới — KHÔNG phải tái hiện mẫu +887 s

- Slot 07:50:50Z: run `af18a2e0`, started 08:00:00Z, jitter **+550 s** — start đúng giây 08:00:00Z, trùng chính xác với start của DR 08:00Z (run `ae9e27b6`, started 1794988800). Cả hai job cùng start tại 08:00:00Z — mốc scheduler "tỉnh lại" sau khoảng im lặng (07:15:34Z, 08:00:00Z].
- Slot 08:20:50Z (slot :20:50 của giờ vcut 08:35:51Z — đúng vị trí mẫu +887 s các đợt 127/129/130/132/134/136): run `e58ac5a2`, started 08:31:33Z, jitter **+643 s** — MUỘN nhưng KHÔNG khớp mẫu +887 s (mẫu: start ~:35:37Z, +887–889 s, 12–14 s trước dispatch). Lần này start sớm hơn mẫu 4'04" (08:31:33Z vs ~08:35:37Z) và trước dispatch 4'18". Ghi nhận là muộn lớn dạng khác — **KHÔNG đếm là tái hiện lần thứ 7 của mẫu +887 s**; số lần tái hiện mẫu giữ nguyên 6.
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — +643 s chưa phá kỷ lục.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 8, BẰNG CHỨNG TRỰC TIẾP ĐẦU TIÊN

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| Đợt 135 | f2fa4088 | 02:35:51 | 02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s) | 03:35:56 | +3.605 s | 03:35:20Z | 36 s |
| Đợt 136 | 7283f96f | 05:35:51 | 05:35:51Z (T7-136 thấy running tới 07:07Z, jitter 0 s) | 05:35:51 | 0 s | — (không có reboot giữa lượt) | — |
| **Đợt 137** | **832a52f5** | **08:35:51** | **08:35:51Z (T7-137 thấy running ở kiểm lần 1 ~08:40Z và lần 2 ~09:08Z, jitter 0 s)** | **09:36:47** | **+3.656 s** | **09:36:01Z** | **46 s** |

- Kiểm chứng số học đợt 137: 1794994607 − 1794990951 = 3.656 ✓; 1794994607 − 1794994561 (btime boot 17db9652) = 46 s ✓; dispatch sau btime boot đầu lượt: 1794990951 − 1794989231 = 1.720 s ✓ (28'40").
- **Viết lại xảy ra GIỮA kiểm lần 2 (09:08Z) và kiểm giữa (09:37Z), tại reboot đầu tiên giữa lượt** — T7 tự thấy giá trị trước (08:35:51Z) và sau (09:36:47Z) trong cùng một đợt. Đây là lần đầu tiên giả thuyết được quan sát trực tiếp cả hai phía, không còn suy từ giá trị của đợt khác.
- **KHÔNG có lần viết lại thứ hai:** started_at lượt 137 đứng yên ở 09:36:47Z qua kiểm giữa (09:37Z) và kiểm lần 3 (10:06Z); boot không đổi (17db9652, btime 09:36:01Z) trong khoảng đó.
- Đợt 135 (`f2fa4088`): started vẫn 1794972956 = 03:35:56Z, không đổi qua cả 4 lần kiểm đợt này — KHÔNG viết lại lần 2 (boot 2104246b btime 08:07:11Z và boot 17db9652 btime 09:36:01Z đều sau khi run finished 04:15:04Z). Lượt 134 (`19a360f1`): started vẫn 1794965518 = 01:31:58Z, không đổi. Lượt 133 (`6f3eba37`): vẫn 1794951736 = 21:42:16Z, không đổi.
- Đợt 136 (`7283f96f`): sched 1794980151 = started 1794980151 = 05:35:51Z, jitter 0 s, nay `succeeded` finished 07:27:37Z — KHÔNG bị viết lại (boot 08:07:11Z xảy ra SAU khi run finished 07:27:37Z; đúng điều kiện "reboot sau finished KHÔNG viết lại").
- **Giả thuyết sau kiểm thứ 8 (không đổi, nay có bằng chứng trực tiếp):** viết lại chỉ xảy ra MỘT lần cho mỗi run, tại reboot đầu tiên xảy ra GIỮA lượt (trong lúc run đang chạy, chưa finished); các reboot sau khi run đã finished KHÔNG viết lại nữa; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (đợt 131) / 31 s (đợt 132) / 36 s (đợt 133) / 40 s (đợt 134) / 36 s (đợt 135) / **46 s (đợt 137)** — 46 s bằng kỷ lục đợt 131; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi. Jitter lớn nhất vẫn +7.135 s (đợt 132).
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 137 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 09:36:47Z → finished (chưa có lúc T7 kiểm lần 3, run vẫn `running`); thời lượng tường thật là 08:35:51Z → finished. Khoảng cách đợt 136 finished (07:27:37Z) → đợt 137 started tường thật (08:35:51Z): **4.094 s** (1h08'14").

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- Reboot **1ca1feaa → 2104246b, btime 08:07:11Z**: xảy ra SAU khi đợt 136 finished (07:27:37Z) và TRƯỚC khi đợt 137 started (08:35:51Z) — tức trong khoảng trống giữa hai đợt, KHÔNG phải giữa lượt 137. Theo định nghĩa gộp của T10-133 §10.2, đây là ứng viên sự kiện tiếp theo sau #15/#16?; việc chốt số là của T10-137 (T6 chốt số boot tuyệt đối).
- Reboot **2104246b → 17db9652, btime 09:36:01Z**: xảy ra GIỮA lượt 137 (giữa kiểm lần 2 09:08Z và kiểm giữa 09:37Z), lúc run vcut 137 đang chạy — ứng viên sự kiện tiếp theo; T10-137 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối.
- **Khoảng im lặng phía scheduler (07:15:34Z, 08:00:00Z] (~44'26"):** hoạt động cuối trước khoảng: HB 07:20:50Z start 07:15:34Z; hoạt động đầu sau khoảng: HB 07:50:50Z + DR 08:00Z cùng start 08:00:00Z, rồi HB 08:20:50Z start 08:31:33Z, vcut 137 start 08:35:51Z. Btime 08:07:11Z nằm trong khoảng. Slot tới hạn trong khoảng: HB 07:50:50Z — KHÔNG thiếu (chạy muộn +550 s), khác đợt 136 (khung chết nuốt 2 slot). Phân loại khung chết là việc của T2/T5/T6.
- **Khoảng im lặng thứ hai (09:15:34Z, 09:36:47Z] (~21'13", 1.273 s):** hoạt động cuối trước khoảng: HB 09:20:50Z start 09:15:34Z; hoạt động đầu sau khoảng: started_at vcut 137 bị viết lại 09:36:47Z, rồi HB 09:50:50Z start 09:45:34Z, DR 10:00Z start 10:00:00Z. Btime 09:36:01Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 137** trong lúc T7 làm việc tới kiểm lần 3 (btime 09:36:01Z + boot_id 17db9652 giữ nguyên 09:37Z → 10:06Z).
- Lưu ý phương pháp: sleep chờ kiểm lần 3 của T7 bị SIGTERM đúng lúc reboot 09:36:01Z (process chết theo boot cũ, duration 1.662 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot chính nhờ lần kiểm giữa này. Sleep chờ kiểm lần 3 trên boot mới (1.620 s) hoàn thành bình thường.
- Đối chiếu T2-137 (file `round137-t2/boot-verify.txt`, đã đọc): T2 tự xác minh cùng boot **2104246b-04b2-4252-a642-b1a7cadeefe1, btime 1794989231 = 08:07:11Z** ở 3 lần (08:45Z, 08:46Z, 09:05:48Z) — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 đã đóng (round137-t2.done) lúc ~09:05Z trên boot 2104246b — TRƯỚC reboot 09:36:01Z nên T2 KHÔNG thấy boot mới 17db9652; boot mới chỉ do T7 xác minh (btime + boot_id + uptime -s + who -b lúc 09:37Z và 10:06Z), T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 12:35:51 18/11 (đợt 136) | 7283f96f | `succeeded`, finished 07:27:37Z (started_at 05:35:51Z, jitter 0 s — KHÔNG bị viết lại) |
| 15:35:51 (đợt 137) | 832a52f5 | `running` lúc kiểm lần 3 (~10:06Z), started_at đã bị viết lại 09:36:47Z (btime 09:36:01Z + 46 s) — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **08:07:11Z** (`/proc/stat` 1794989231 + `uptime -s` + `who -b` 08:07 lúc 08:40Z và 09:08Z, trùng nhau); boot_id **2104246b-04b2-4252-a642-b1a7cadeefe1** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt + khớp độc lập file boot-verify của T2).
- Boot sau reboot giữa lượt btime **09:36:01Z** (`/proc/stat` 1794994561 + `uptime -s` + `who -b` 09:36 lúc 09:37Z và 10:06Z, trùng nhau); boot_id **17db9652-ad06-409f-989c-cdbdba15d0af** tự xác minh từ `/proc/sys/kernel/random/boot_id`.
- Cờ `round-in-progress.md` KHÔNG tồn tại lúc kiểm lần 1 (~08:43Z), nhưng **TỒN TẠI lúc kiểm lần 3 (~10:06Z)** — xuất hiện trong lúc T7 làm việc (không rõ luồng nào tạo — có thể T10 bắt đầu đóng sổ, hoặc main chat mở đợt). T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~10:06Z): **7/9 cờ `.done` đã có** — `round137-t1.done`, `round137-t2.done`, `round137-t3.done`, `round137-t4.done`, `round137-t5.done`, `round137-t6.done`, `round137-t9.done`. Chưa có: t8 + t10 (T10 đóng sau cùng) + t7 (chính T7). Lúc kiểm giữa (~09:37Z) mới có 4/9 (t1, t2, t6, t9). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–136.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h59' (07:07:03Z → 10:06:03Z 18/11), đủ 6 slot HB + 3 slot DR. Bốn lần kiểm khớp hoàn toàn nhau ở mọi slot trùng (lần kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 07:20:50Z thuộc cửa 137 theo quy ước đứng — T7-138 bắt đầu cửa sau 10:06:03Z, slot HB tiếp theo là 10:20:50Z, DR tiếp theo là 11:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 136, cùng phương pháp)

- Heartbeat: 44/205 → **44/211 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 16:50:50 +07). Kiểm toán cửa sổ: 205 + 6 slot mới = 211 ✓. Số thiếu +0.
- Deterministic-doctor: 49/174 → **49/177 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 17:00 +07). Kiểm toán: 174 + 3 = 177 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/211 = 20,9% (giảm từ 21,5% — 0 thiếu mới); DR 49/177 = 27,7% (giảm từ 28,2% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (chỉ 2 lượt muộn lớn +550 s / +643 s — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 8: ĐÃ CÓ BẰNG CHỨNG TRỰC TIẾP.** Lượt 137 bị viết lại tại reboot đầu tiên giữa lượt (btime 09:36:01Z + 46 s → 09:36:47Z), T7 tự thấy cả trước và sau trong cùng một đợt; KHÔNG viết lại lần 2. Giả thuyết "một lần duy nhất tại reboot đầu tiên giữa lượt" giữ đúng lần thứ 8 và nay được quan sát trực tiếp. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / **46 s (137)**. Chỉ ghi nhận; T5/T6 đối chiếu; T10-137 kiểm lại lượt 137 lúc đóng nếu có reboot nữa sau 10:06Z.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Slot 08:20:50Z muộn +643 s (start 08:31:33Z, sớm hơn mẫu ~4 phút) — không đếm là lần thứ 7. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 1ca1feaa → 2104246b (btime 08:07:11Z, trước lượt) và 2104246b → 17db9652 (btime 09:36:01Z, giữa lượt)** — cả hai đều là ứng viên sự kiện tiếp theo sau #15/#16? theo định nghĩa gộp T10-133 §10.2; T10-137 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối.
5. **Mù #56 (mới mở đợt 136): việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-137-T7-1 — Đoạn reboot ghi nhầm section trong NOTES (đã sửa):** lúc cập nhật kiểm giữa, đoạn văn về reboot giữa lượt + viết lại started_at bị ghi nhầm vào §2a (Heartbeat) thay vì §2c (vcut) do edit khớp nhầm dòng "Kiểm lần 3 (TBD)" đầu tiên. Đã phát hiện khi rà lại file và chuyển đúng sang §2c; nội dung số liệu không đổi, không ảnh hưởng kết luận. Ghi nhận để các đợt sau dùng anchor dài hơn khi edit.
- Ngoài F-137-T7-1: **không có sai số số liệu mới.** 4 lần kiểm khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot và đối chiếu khớp T2 (nguồn độc lập) cho boot 2104246b; boot mới 17db9652 chỉ do T7 xác minh (T2 đã đóng trước reboot) — ghi rõ để T10/T6 đối chiếu, không tự chốt thay.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round137-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round137-t7/NOTES.md` (không nằm trong repo nên không stage).
