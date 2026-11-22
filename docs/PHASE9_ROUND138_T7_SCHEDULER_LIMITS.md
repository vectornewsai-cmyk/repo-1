# PHASE9 ROUND138 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 3/3) + REBOOT GIỮA LƯỢT (17db9652 → 914964c3 = #95?, btime 11:52:20Z) KHÔNG nuốt slot nào + started_at lượt 138 ĐÃ BỊ VIẾT LẠI — bằng chứng trực tiếp thứ hai (btime + 50 s, kỷ lục chuỗi offset mới)

- **Luồng:** T7 đợt 138 (lượt cron 18:35 +07 18/11/2026 = 11:35:51Z). Hai boot trong lúc làm việc: boot lúc mở **17db9652-ad06-409f-989c-cdbdba15d0af, btime 09:36:01Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 11:38Z, trùng nhau; khớp độc lập file `boot-verify.txt` của T2-138) và boot mới sau reboot giữa lượt **914964c3-c36a-4893-bf24-d8321e75d299, btime 11:52:20Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 11:53Z, 11:58Z và 13:05Z, trùng nhau; T2-138 đã ghi boot mới vào `boot-verify.txt` và xác nhận cửa sổ reboot (11:51:36Z, 11:52:20Z]). Reboot 11:52:20Z xảy ra GIỮA lượt 138, lúc run vcut 138 đang chạy.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 10:06:03Z 18/11 (lúc T7 đợt 137 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 137 + cờ `.done` đợt 138 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 137 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 137 đã `succeeded`, đợt 138 đang `running`) | — | 0 | — |

**Dị thường started_at: kiểm thứ 9 của giả thuyết đã xác nhận — lượt 138 ĐÃ BỊ VIẾT LẠI tại reboot đầu tiên giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (bằng chứng trực tiếp thứ hai, sau đợt 137).** Lượt vcut đợt 138 (run `4d2272ce`) started_at ghi 11:35:51Z ở kiểm lần 1 (jitter 0 s), sau reboot giữa lượt (boot 914964c3, btime 11:52:20Z) ghi nay **11:53:10Z = btime + 50 s**, jitter **+1.039 s**; KHÔNG bị viết lại lần 2 (boot không đổi tới 13:05Z). Offset **50 s là kỷ lục mới của chuỗi** (vượt 46 s của đợt 131/137). Đợt 137 (`832a52f5`) KHÔNG bị viết lại lần 2 (vẫn 09:36:47Z qua cả 4 lần kiểm đợt này).

- Cập nhật lũy kế (cùng phương pháp đợt 125–137): heartbeat **44/217 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/180 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 10:06:03Z → 13:05:09Z 18/11

Cửa kiểm ~2h59'. Ba lần kiểm chính (lần 1 ~11:38Z, kiểm giữa ~11:53Z sau reboot, lần 3 ~13:05Z) + 1 kiểm bổ sung (~11:58Z theo thông báo parent) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do reboot xen giữa + thông báo parent).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 17:20:50 (10:20:50Z) | a31b9fe9 | 10:15:34 | −316 s | CÓ |
| 17:50:50 (10:50:50Z) | 4db32cf9 | 10:45:34 | −316 s | CÓ |
| 18:20:50 (11:20:50Z) | 2ae6bccd | 11:15:34 | −316 s | CÓ |
| 18:50:50 (11:50:50Z) | b002bc22 | 11:45:34 | −316 s | CÓ |
| 19:20:50 (12:20:50Z) | 9cdac4c7 | 12:15:34 | −316 s | CÓ |
| 19:50:50 (12:50:50Z) | 329ea03e | 12:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 6 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 11:50:50Z chạy TRƯỚC reboot giữa lượt (start 11:45:34Z < btime 11:52:20Z); các slot 12:20:50Z + 12:50:50Z chạy đúng giờ trên boot mới 914964c3 — scheduler hồi phục sau reboot giữa lượt.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:00 (11:00Z) | 6511c9b7 | 11:00:00 | 0 s | CÓ |
| 19:00 (12:00Z) | e5dbf1ea | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | d3378c6e | 13:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 12:00Z chạy đúng giờ trên boot mới 914964c3 (sau reboot 11:52:20Z) — reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 10:20:50Z thuộc cửa 138 (sau mốc 10:06:03Z của T7-137), KHÔNG đếm lại ở đợt 137. Slot HB tiếp theo sau cửa này là 13:20:50Z, DR tiếp theo là 14:00Z (thuộc T7-139).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + giữa + bổ sung:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** (danh sách nhảy từ 05:20:50Z xuống 04:20:50Z); tới kiểm lần 3 slot này đã ngoài cửa sổ limit=15 (cửa sổ nay chỉ xuống tới 05:50:50Z) nên KHÔNG tái xác minh được lần 3 — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi ở lần 3.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở cả 4 lần kiểm (danh sách DR nhảy từ 06:00Z xuống 04:00Z).
- Các kết luận đợt 125–137 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Cả 6 slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 9, BẰNG CHỨNG TRỰC TIẾP THỨ HAI

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| Đợt 135 | f2fa4088 | 02:35:51 | 02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s) | 03:35:56 | +3.605 s | 03:35:20Z | 36 s |
| Đợt 136 | 7283f96f | 05:35:51 | 05:35:51Z (T7-136 thấy running tới 07:07Z, jitter 0 s) | 05:35:51 | 0 s | — (không có reboot giữa lượt) | — |
| Đợt 137 | 832a52f5 | 08:35:51 | 08:35:51Z (T7-137 thấy running ở kiểm lần 1 ~08:40Z và lần 2 ~09:08Z, jitter 0 s) | 09:36:47 | +3.656 s | 09:36:01Z | 46 s |
| **Đợt 138** | **4d2272ce** | **11:35:51** | **11:35:51Z (T7-138 thấy running ở kiểm lần 1 ~11:38Z, jitter 0 s)** | **11:53:10** | **+1.039 s** | **11:52:20Z** | **50 s** |

- Kiểm chứng số học đợt 138: 1795002790 − 1795002740 = 50 s ✓; 1795002790 − 1795001751 = 1.039 s ✓; dispatch sau btime boot đầu lượt (17db9652, 09:36:01Z): 1795001751 − 1794994561 = 7.190 s ✓ (1h59'50").
- **Viết lại xảy ra GIỮA kiểm lần 1 (11:38Z) và kiểm giữa (11:53Z), tại reboot đầu tiên giữa lượt** — T7 tự thấy giá trị trước (11:35:51Z) và sau (11:53:10Z) trong cùng một đợt. Đây là lần thứ hai giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137).
- **KHÔNG có lần viết lại thứ hai:** started_at lượt 138 đứng yên ở 11:53:10Z qua kiểm bổ sung (11:58Z) và kiểm lần 3 (13:05Z); boot không đổi (914964c3, btime 11:52:20Z) trong khoảng đó.
- Đợt 137 (`832a52f5`): started vẫn 1794994607 = 09:36:47Z, không đổi qua cả 4 lần kiểm đợt này — KHÔNG viết lại lần 2; nay `succeeded` finished 1794998589 = 10:43:09Z. Thời lượng tường thật đợt 137: 08:35:51Z → 10:43:09Z = 7.638 s (2h07'18"); thời lượng theo mốc ghi nay: 09:36:47Z → 10:43:09Z = 3.982 s. Khoảng cách đợt 136 finished (07:27:37Z) → đợt 137 started tường thật (08:35:51Z): **4.094 s** (1h08'14", không đổi).
- Đợt 136 (`7283f96f`): started vẫn 1794980151 = 05:35:51Z, không đổi. Đợt 135 (`f2fa4088`): started vẫn 1794972956 = 03:35:56Z, không đổi. Đợt 134 (`19a360f1`): started vẫn 1794965518 = 01:31:58Z, không đổi.
- **Giả thuyết sau kiểm thứ 9 (không đổi, nay có bằng chứng trực tiếp thứ hai):** viết lại chỉ xảy ra MỘT lần cho mỗi run, tại reboot đầu tiên xảy ra GIỮA lượt (trong lúc run đang chạy, chưa finished); các reboot sau khi run đã finished KHÔNG viết lại nữa; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (đợt 131) / 31 s (đợt 132) / 36 s (đợt 133) / 40 s (đợt 134) / 36 s (đợt 135) / 46 s (đợt 137) / **50 s (đợt 138)** — 50 s là kỷ lục mới; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi. Jitter lớn nhất vẫn +7.135 s (đợt 132).
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 138 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 11:53:10Z → finished (chưa có lúc T7 kiểm lần 3, run vẫn `running`); thời lượng tường thật là 11:35:51Z → finished.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- Reboot **17db9652 → 914964c3, btime 11:52:20Z, cửa sổ reboot (11:51:36Z, 11:52:20Z] (T2-138 xác nhận), boot #95? (tạm, T6 chốt số tuyệt đối)**: xảy ra GIỮA lượt 138 (giữa kiểm lần 1 11:38Z và kiểm giữa 11:53Z), lúc run vcut 138 đang chạy — ứng viên sự kiện tiếp theo sau #17/#18? theo định nghĩa gộp T10-133 §10.2; T10-138 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối.
- **Không có reboot mới** giữa kiểm lần 3 của T7-137 (10:06Z, boot 17db9652) và kiểm lần 1 đợt này (11:38Z, boot vẫn 17db9652, btime vẫn 09:36:01Z). **Không có reboot thứ hai giữa lượt 138** trong lúc T7 làm việc tới kiểm lần 3 (btime 11:52:20Z + boot_id 914964c3 giữ nguyên 11:53Z → 13:05Z).
- **Khoảng im lặng phía scheduler (11:45:34Z, 11:53:10Z] (~7'36", 456 s):** hoạt động cuối trước khoảng: HB 11:50:50Z start 11:45:34Z; hoạt động đầu sau khoảng: started_at vcut 138 bị viết lại 11:53:10Z. Btime 11:52:20Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Slot HB/DR quanh cửa sổ reboot (11:51:36Z, 11:52:20Z]:** HB 11:50:50Z chạy TRƯỚC cửa sổ (start 11:45:34Z, finished 11:45:34Z) — KHÔNG rơi vào khoảng im lặng chứa reboot; slot tới hạn tiếp theo là DR 12:00Z (SAU cửa sổ), chạy đúng giờ (0 s) trên boot mới. **Tới kiểm lần 3: KHÔNG có slot nào rơi vào khoảng im lặng chứa reboot, KHÔNG có slot nào bị nuốt** — khác hướng đợt 134 (khung chết nuốt slot) ở chỗ đợt này khoảng im lặng không chứa slot tới hạn nào. Phân loại khung chết chi tiết giao T2/T5/T6 (T7 chỉ ghi mốc).
- **Không có khoảng im lặng scheduler mới trong cửa trước reboot:** hoạt động liên tục tới 11:38Z — HB 10:20:50Z start 10:15:34Z, HB 10:50:50Z start 10:45:34Z, DR 11:00Z start 11:00:00Z, HB 11:20:50Z start 11:15:34Z, vcut 138 start 11:35:51Z. Khoảng dài nhất giữa hai lần start liên tiếp: 10:45:34Z → 11:00:00Z = 866 s (14'26", khoảng trống bình thường giữa HB và DR).
- Lưu ý phương pháp: sleep chờ kiểm lần 2 của T7 bị SIGTERM đúng lúc reboot 11:52:20Z (process chết theo boot cũ, duration 834 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot chính nhờ lần kiểm giữa này (giống đợt 137). Sleep chờ kiểm lần 3 trên boot mới (4.260 s) hoàn thành bình thường.
- Đối chiếu T2-138 (file `round138-t2/boot-verify.txt`, đã đọc): T2 tự xác minh cùng boot **17db9652-ad06-409f-989c-cdbdba15d0af, btime 1794994561 = 09:36:01Z** lúc mở (last entry 11:37:49Z) — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). Sau reboot, T2 đã ghi boot mới vào `boot-verify.txt` (dòng cuối "2026-11-18 11:52:20", kiểm bổ sung 11:58Z) và xác nhận cửa sổ reboot (11:51:36Z, 11:52:20Z] — boot mới 914964c3 nay có đối chiếu độc lập T2 + T7; T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 15:35:51 18/11 (đợt 137) | 832a52f5 | `succeeded`, finished 10:43:09Z (started_at 09:36:47Z = btime 09:36:01Z + 46 s — KHÔNG bị viết lại lần 2) |
| 18:35:51 (đợt 138) | 4d2272ce | `running` lúc kiểm lần 3 (~13:05Z), started_at đã bị viết lại 11:53:10Z (btime 11:52:20Z + 50 s) — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **09:36:01Z** (`/proc/stat` 1794994561 + `uptime -s` + `who -b` 09:36 lúc 11:38Z, trùng nhau); boot_id **17db9652-ad06-409f-989c-cdbdba15d0af** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt + khớp độc lập file boot-verify của T2-138).
- Boot sau reboot giữa lượt btime **11:52:20Z** (`/proc/stat` 1795002740 + `uptime -s` + `who -b` 11:52 lúc 11:53Z, 11:58Z và 13:05Z, trùng nhau); boot_id **914964c3-c36a-4893-bf24-d8321e75d299** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-138 đã ghi boot mới vào boot-verify.txt — đối chiếu độc lập).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, kiểm giữa, kiểm bổ sung và kiểm lần 3) — đã có từ lúc T7-137 kiểm lần 3. T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~13:05Z): **5/9 cờ `.done` đã có** — `round138-t1.done`, `round138-t2.done`, `round138-t3.done`, `round138-t5.done`, `round138-t6.done`. Chưa có: t4, t8, t10 + t7 (chính T7). Lúc kiểm giữa (~11:53Z) mới có 3/9 (t1, t3, t6); lúc kiểm lần 1 (~11:38Z) chưa có cờ nào. Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–137.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h59' (10:06:03Z → 13:05:09Z 18/11), đủ 6 slot HB + 3 slot DR. Ba lần kiểm chính + 1 kiểm bổ sung khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt; kiểm bổ sung phát sinh do thông báo parent về reboot); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 10:20:50Z thuộc cửa 138 theo quy ước đứng — T7-139 bắt đầu cửa sau 13:05:09Z, slot HB tiếp theo là 13:20:50Z, DR tiếp theo là 14:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 137, cùng phương pháp)

- Heartbeat: 44/211 → **44/217 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 19:50:50 +07). Kiểm toán cửa sổ: 211 + 6 slot mới = 217 ✓. Số thiếu +0.
- Deterministic-doctor: 49/177 → **49/180 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 20:00 +07). Kiểm toán: 177 + 3 = 180 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/217 = 20,3% (giảm từ 20,9% — 0 thiếu mới); DR 49/180 = 27,2% (giảm từ 27,7% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 9: ĐÃ CÓ BẰNG CHỨNG TRỰC TIẾP THỨ HAI.** Lượt 138 bị viết lại tại reboot đầu tiên giữa lượt (btime 11:52:20Z + 50 s → 11:53:10Z), T7 tự thấy cả trước và sau trong cùng một đợt; KHÔNG viết lại lần 2. Giả thuyết "một lần duy nhất tại reboot đầu tiên giữa lượt" giữ đúng lần thứ 9 và nay được quan sát trực tiếp lần thứ hai. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / **50 s (138)** — 50 s là kỷ lục mới. Chỉ ghi nhận; T5/T6 đối chiếu; T10-138 kiểm lại lượt 138 lúc đóng nếu có reboot nữa sau 13:05Z.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Cả 6 slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 17db9652 → 914964c3 (btime 11:52:20Z, cửa sổ (11:51:36Z, 11:52:20Z], boot #95? tạm) GIỮA lượt 138** — ứng viên sự kiện tiếp theo sau #17/#18? theo định nghĩa gộp T10-133 §10.2; T10-138 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối. Reboot này KHÔNG nuốt slot nào (khác hướng đợt 134) — khoảng im lặng chứa reboot không chứa slot tới hạn nào; DR 12:00Z chạy đúng giờ trên boot mới.
5. **Mù #56/#57: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-138-T7-1 — Dòng chốt vcut rơi nhầm section trong NOTES (đã sửa):** lúc thêm kiểm bổ sung theo thông báo parent, edit khớp nhầm dòng "Kiểm lần 3 (TBD)" đầu tiên (ở §2a) nên dòng "Chốt cửa 138: vcut TBD." bị đưa nhầm vào §2a (Heartbeat) thay vì §2c (vcut). Đã phát hiện khi rà lại bằng grep và chuyển đúng về §2c; nội dung số liệu không đổi, không ảnh hưởng kết luận. Cùng lớp lỗi với F-137-T7-1 — các đợt sau dùng anchor dài hơn khi edit (bao gồm tên section).
- **F-138-T7-2 — Câu về T2 boot-verify bị lỗi thời trong NOTES (đã sửa):** §6 từng ghi "T2-138 chưa cập nhật boot-verify.txt" sau khi T2 đã ghi boot mới (kiểm bổ sung 11:58Z thấy dòng cuối "2026-11-18 11:52:20"). Đã sửa thành "T2 ĐÃ cập nhật", giữ lại trạng thái lúc kiểm giữa làm lịch sử. Nội dung số liệu không đổi.
- Ngoài F-138-T7-1/F-138-T7-2: **không có sai số số liệu mới.** 3 lần kiểm chính + 1 kiểm bổ sung khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot và đối chiếu khớp T2 (nguồn độc lập) cho cả boot 17db9652 (lúc mở) và boot 914964c3 (sau reboot — T2 ghi btime 11:52:20Z vào boot-verify.txt, cửa sổ reboot (11:51:36Z, 11:52:20Z] do T2 xác nhận).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round138-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round138-t7/NOTES.md` (không nằm trong repo nên không stage).
