# PHASE9 ROUND140 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 3/3) + REBOOT GIỮA LƯỢT (af558fb5 → 90392aa5, btime 17:52:56Z) KHÔNG nuốt slot nào + started_at lượt 140 ĐÃ BỊ VIẾT LẠI — bằng chứng trực tiếp thứ tư (btime + 49 s)

- **Luồng:** T7 đợt 140 (lượt cron 00:35 +07 19/11/2026 = 17:35:51Z). Hai boot trong lúc làm việc: boot lúc mở **af558fb5-e964-4116-a69b-ec784f3defab, btime 15:54:37Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 17:37Z, trùng nhau; khớp brief/flag đợt 140 — lần này KHÔNG có sai lệch btime như đợt 139) và boot mới sau reboot giữa lượt **90392aa5-f13b-4048-9c57-e4defc8e74d9, btime 17:52:56Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 17:54Z, 18:35Z và 19:30Z, trùng nhau; T2-140 chưa cập nhật boot-verify.txt với boot này tới kiểm lần 3 — xem §2.5). Reboot 17:52:56Z xảy ra GIỮA lượt 140, lúc run vcut 140 đang chạy.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 16:35:44Z 18/11 (lúc T7 đợt 139 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 139 + cờ `.done` đợt 140 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 139 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 139 đã `succeeded`, đợt 140 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 11 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ TƯ: lượt 140 ĐÃ BỊ VIẾT LẠI tại reboot giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (sau đợt 137, 138 và 139).** Lượt vcut đợt 140 (run `1e775062`) started_at ghi 17:35:51Z ở kiểm lần 1 (jitter 0 s), sau reboot giữa lượt (boot 90392aa5, btime 17:52:56Z) ghi nay **17:53:45Z = btime + 49 s**, jitter **+1.074 s**; KHÔNG bị viết lại lần 2 (không có reboot thứ hai tới kiểm lần 3, 19:30Z). **Đồng thời, run 139 (`24a20fbc`) KHÔNG bị viết lại lần 2** tại cùng reboot vì đã finished 17:04:27Z trước reboot — đúng theo giả thuyết tinh chỉnh. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 11.** Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / **49 s (140-lần-1)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–139): heartbeat **44/230 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/186 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 16:35:44Z → 19:30:06Z 18/11

Cửa kiểm ~2h54'. Ba lần kiểm chính (lần 1 ~17:38Z, lần 2 ~18:35Z, lần 3 ~19:30Z) + 1 kiểm giữa (~17:54Z sau reboot) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 23:50:50 (16:50:50Z) | b4356bab | 16:45:34 | −316 s | CÓ |
| 00:20:50 (17:20:50Z) | 8ed8e075 | 17:15:34 | −316 s | CÓ |
| 00:50:50 (17:50:50Z) | 51ba76fe | 17:45:34 | −316 s | CÓ |
| 01:20:50 (18:20:50Z) | b5389d52 | 18:15:34 | −316 s | CÓ |
| 01:50:50 (18:50:50Z) | ec07bc5a | 18:45:34 | −316 s | CÓ |
| 02:20:50 (19:20:50Z) | dae76192 | 19:15:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 6 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 16:50:50Z + 17:20:50Z chạy trên boot af558fb5; slot 17:50:50Z chạy TRƯỚC reboot giữa lượt (start 17:45:34Z < btime 17:52:56Z); slot 18:20:50Z + 18:50:50Z + 19:20:50Z chạy đúng giờ trên boot mới 90392aa5 — scheduler hồi phục sau reboot giữa lượt.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:00 (17:00Z) | 304c0fc6 | 17:00:00 | 0 s | CÓ |
| 01:00 (18:00Z) | 2738ff22 | 18:00:00 | 0 s | CÓ |
| 02:00 (19:00Z) | fc0d8717 | 19:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 18:00Z là slot đầu tiên tới hạn sau reboot giữa lượt — chạy đúng giờ (0 s) trên boot mới 90392aa5; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 16:50:50Z thuộc cửa 140 (sau mốc 16:35:44Z của T7-139), KHÔNG đếm lại ở đợt 139. Slot HB tiếp theo sau cửa này là 19:50:50Z, DR tiếp theo là 20:00Z (thuộc T7-141).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + kiểm giữa + lần 2 + lần 3:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 10:50:50Z) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở cả 4 lần kiểm (danh sách DR nhảy từ 06:00Z xuống 04:00Z).
- Các kết luận đợt 125–139 không đổi, trừ củng cố giả thuyết started_at ở §2.4.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Cả 6 slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 10:50:50Z) nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 11, BẰNG CHỨNG TRỰC TIẾP THỨ TƯ

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| Đợt 135 | f2fa4088 | 02:35:51 | 02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s) | 03:35:56 | +3.605 s | 03:35:20Z | 36 s |
| Đợt 136 | 7283f96f | 05:35:51 | 05:35:51Z (T7-136 thấy running tới 07:07Z, jitter 0 s) | 05:35:51 | 0 s | — (không có reboot giữa lượt) | — |
| Đợt 137 | 832a52f5 | 08:35:51 | 08:35:51Z (T7-137 thấy running ở kiểm lần 1 ~08:40Z và lần 2 ~09:08Z, jitter 0 s) | 09:36:47 | +3.656 s | 09:36:01Z | 46 s |
| Đợt 138 | 4d2272ce | 11:35:51 | 11:35:51Z (T7-138 thấy running ở kiểm lần 1 ~11:38Z, jitter 0 s) → 11:53:10Z (kiểm lần 3 đợt 138) | 13:54:13 | +8.302 s | 13:53:41Z | 32 s (lần 2) |
| Đợt 139 | 24a20fbc | 14:35:51 | 14:35:51Z (T7-139 thấy running ở kiểm lần 1 ~14:40Z và lần 2 ~15:39Z, jitter 0 s) | 15:55:16 | +4.765 s | 15:54:37Z | 39 s |
| **Đợt 140** | **1e775062** | **17:35:51** | **17:35:51Z (T7-140 thấy running ở kiểm lần 1 ~17:38Z, jitter 0 s)** | **17:53:45** | **+1.074 s** | **17:52:56Z** | **49 s** |

- Kiểm chứng số học đợt 140: 1795024425 − 1795024376 = 49 s ✓; 1795024425 − 1795023351 = 1.074 s ✓.
- Kiểm chứng số học đợt 139 (không đổi): started vẫn 1795017316 = 15:55:16Z qua cả 4 lần kiểm đợt này — KHÔNG viết lại lần 2 tại reboot giữa lượt 140 (đã finished 17:04:27Z trước reboot 17:52:56Z). Thời lượng tường thật đợt 139: 14:35:51Z → 17:04:27Z = 8.916 s (2h28'36"); thời lượng theo mốc ghi nay: 15:55:16Z → 17:04:27Z = 4.151 s (1h09'11").
- **Viết lại của run 140 xảy ra GIỮA kiểm lần 1 (17:38Z) và kiểm giữa (17:54Z), tại reboot đầu tiên giữa lượt** — T7 tự thấy giá trị trước (17:35:51Z) và sau (17:53:45Z) trong cùng một đợt. Đây là lần thứ tư giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137; lần hai: đợt 138; lần ba: đợt 139).
- **KHÔNG có lần viết lại thứ hai cho run 140:** started_at lượt 140 đứng yên ở 17:53:45Z qua kiểm lần 2 (18:35Z) và kiểm lần 3 (19:30Z); boot không đổi (90392aa5, btime 17:52:56Z) trong khoảng đó.
- **Run 139 KHÔNG bị viết lại lần 2** tại reboot giữa lượt 140 (started_at vẫn 15:55:16Z qua kiểm giữa + lần 2 + lần 3) — vì đã finished 17:04:27Z trước reboot 17:52:56Z. Đợt 138 (`4d2272ce`): started vẫn 1795010053 = 13:54:13Z, không đổi qua cả 4 lần kiểm đợt này — KHÔNG viết lại lần 3; đợt 137 (`832a52f5`): started vẫn 1794994607 = 09:36:47Z, không đổi; đợt 136 (`7283f96f`): started vẫn 1794980151 = 05:35:51Z, không đổi.
- **Giả thuyết sau kiểm thứ 11 (tinh chỉnh từ đợt 139, nay được củng cố thêm lần nữa):** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s. Các reboot sau khi run đã finished KHÔNG viết lại; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / **49 s (140-lần-1)** — 49 s nằm trong khoảng ~30–50 s đã quan sát (gần biên trên; lớn thứ hai sau 50 s đợt 138-lần-1). Jitter +1.074 s là nhỏ nhất trong các lần viết lại đã ghi (trước đó lớn nhất +8.302 s đợt 138-lần-2) — vì reboot xảy ra sớm trong lượt (chỉ ~17' sau sched), không phải vì cơ chế khác; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi; đợt 140 không có reboot thứ hai trong lượt nên không có số lần-2.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 140 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 17:53:45Z → finished (chưa có lúc T7 kiểm lần 3, run vẫn `running`); thời lượng tường thật là 17:35:51Z → finished.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot af558fb5 → 90392aa5, btime 17:52:56Z — GIỮA lượt 140** (giữa kiểm lần 1 17:38Z và kiểm giữa 17:54Z), lúc run vcut 140 đang chạy — ứng viên sự kiện tiếp theo sau #20? theo định nghĩa gộp T10-133 §10.2 (T8-139 tạm đánh af558fb5 là #97?; T10-140 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cửa sổ reboot (T7 ước lượng từ hoạt động cuối trên boot cũ): **(17:38Z, 17:52:56Z]** — hẹp hơn: sleep của T7 chết sau 839 s kể từ 17:39:01Z tức ~17:53:00Z, nên reboot xảy ra trong (17:38:57Z, 17:53:00Z]; T2-140 xác nhận hẹp hơn (T7 chỉ ghi mốc).
- **Khoảng im lặng chứa reboot (17:45:34Z, 17:53:45Z] (~8'11", 491 s):** hoạt động cuối trước khoảng: HB 17:50:50Z start 17:45:34Z; hoạt động đầu sau khoảng: started_at vcut 140 bị viết lại 17:53:45Z. Btime 17:52:56Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 140** tới kiểm lần 3 (boot_id vẫn 90392aa5, btime vẫn 17:52:56Z — 17:54Z → 19:30Z; cả hai sleep chờ kiểm lần 2 + lần 3 đều hoàn thành bình thường). DR 18:00Z + HB 18:20:50Z + HB 18:50:50Z + DR 19:00Z + HB 19:20:50Z chạy đúng giờ trên boot mới — scheduler hồi phục sau reboot giữa lượt, không nuốt slot nào.
- Lưu ý phương pháp: sleep chờ kiểm lần 2 của T7 bị SIGTERM đúng lúc reboot 17:52:56Z (process chết theo boot cũ, duration 839 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot chính nhờ lần kiểm giữa này (giống đợt 137/138/139). Sleep chờ kiểm lần 2 trên boot mới (2.400 s) và sleep chờ kiểm lần 3 (3.240 s) hoàn thành bình thường.
- **Brief/flag đợt 140 KHỚP btime đo được:** `round-in-progress.md` ghi "af558fb5 (btime 15:54:37Z)" — khớp hoàn toàn btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1).
- Đối chiếu T2-140 (file `round140-t2/boot-verify.txt`, đã đọc): T2 tự xác minh boot **af558fb5-e964-4116-a69b-ec784f3defab, btime 1795017277 = 15:54:37Z** lúc 17:38:57Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới 90392aa5 tới kiểm lần 3 (19:30Z) — dù cờ `round140-t2.done` đã có; boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 2 + lần 3 đều trùng) + chưa có đối chiếu T2. T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 14:35:51 (đợt 139) | 21:35:51 | 24a20fbc | `succeeded`, finished 17:04:27Z; started_at 15:55:16Z = btime 15:54:37Z + 39 s — KHÔNG viết lại lần 2 tại reboot giữa lượt 140 (đã finished) |
| 17:35:51 (đợt 140) | 00:35:51 | 1e775062 | `running` lúc kiểm lần 3 (~19:30Z), started_at đã bị viết lại 17:53:45Z (btime 17:52:56Z + 49 s) — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **15:54:37Z** (`/proc/stat` 1795017277 + `uptime -s` + `who -b` 15:54 lúc 17:37Z, trùng nhau); boot_id **af558fb5-e964-4116-a69b-ec784f3defab** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief/flag đợt 140 + khớp độc lập file boot-verify của T2-140 về cả boot_id + btime).
- Boot sau reboot giữa lượt btime **17:52:56Z** (`/proc/stat` 1795024376 + `uptime -s` + `who -b` 17:53 lúc 17:54Z, 18:35Z và 19:30Z, trùng nhau); boot_id **90392aa5-f13b-4048-9c57-e4defc8e74d9** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-140 chưa cập nhật boot-verify.txt với boot này tới 19:30Z — chỉ có T7 xác minh).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, kiểm giữa, lần 2 và lần 3) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~19:30Z): **5/9 cờ `.done` đã có** — `round140-t1.done`, `round140-t2.done`, `round140-t5.done`, `round140-t6.done`, `round140-t9.done`. Chưa có: t4, t8, t10 + t7 (chính T7). Lúc kiểm lần 2 (~18:35Z) mới có 3/9 (t1, t2, t6); lúc kiểm lần 1 (~17:38Z) chưa liệt kê. Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–139.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h54' (16:35:44Z → 19:30:06Z 18/11), đủ 6 slot HB + 3 slot DR. Ba lần kiểm chính + 1 kiểm giữa khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 16:50:50Z thuộc cửa 140 theo quy ước đứng — T7-141 bắt đầu cửa sau 19:30:06Z, slot HB tiếp theo là 19:50:50Z, DR tiếp theo là 20:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 139, cùng phương pháp)

- Heartbeat: 44/224 → **44/230 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 02:20:50 +07). Kiểm toán cửa sổ: 224 + 6 slot mới = 230 ✓. Số thiếu +0.
- Deterministic-doctor: 49/183 → **49/186 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 02:00 +07). Kiểm toán: 183 + 3 = 186 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/230 = 19,1% (giảm từ 19,6% — 0 thiếu mới); DR 49/186 = 26,3% (giảm từ 26,8% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 11: ĐÃ CÓ BẰNG CHỨNG TRỰC TIẾP THỨ TƯ + GIẢ THUYẾT GIỮ ĐÚNG.** Lượt 140 bị viết lại tại reboot đầu tiên giữa lượt (btime 17:52:56Z + 49 s → 17:53:45Z), T7 tự thấy cả trước và sau trong cùng một đợt; run 139 KHÔNG viết lại lần 2 tại cùng reboot vì đã finished; KHÔNG có reboot thứ hai trong lượt nên KHÔNG có lần viết lại thứ hai. Giả thuyết tinh chỉnh "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 11. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / **49 s (140-lần-1)**. Chỉ ghi nhận; T5/T6 đối chiếu; T10-140 kiểm lại lượt 140 lúc đóng nếu có reboot nữa sau 19:30Z.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Cả 6 slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: af558fb5 → 90392aa5 (btime 17:52:56Z) GIỮA lượt 140** — ứng viên sự kiện tiếp theo sau #20? theo định nghĩa gộp T10-133 §10.2 (T8-139 tạm đánh af558fb5 là #97?; T10-140 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Reboot này KHÔNG nuốt slot nào — khoảng im lặng chứa reboot (17:45:34Z, 17:53:45Z] không chứa slot tới hạn nào; DR 18:00Z + HB 18:20:50Z + HB 18:50:50Z + DR 19:00Z + HB 19:20:50Z chạy đúng giờ trên boot mới.
5. **T2-140 chưa cập nhật boot-verify.txt với boot mới 90392aa5** tới kiểm lần 3 (file vẫn chỉ ghi af558fb5, last entry 17:38:28Z) — dù cờ `round140-t2.done` đã có. Boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 2 + lần 3 đều trùng). T10/T6 đối chiếu lúc đóng.
6. **Mù #59: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **Không có sai số số liệu mới — không có F-140-T7-n nào.** 3 lần kiểm chính + 1 kiểm giữa khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (af558fb5 lúc mở, 90392aa5 sau reboot) và đối chiếu khớp T2 (nguồn độc lập) cho boot af558fb5 (btime 15:54:37Z); brief/flag đợt 140 khớp btime đo được (không có sai lệch btime như F-139-T7-1); boot 90392aa5 chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm lần 3) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round140-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round140-t7/NOTES.md` (không nằm trong repo nên không stage).
