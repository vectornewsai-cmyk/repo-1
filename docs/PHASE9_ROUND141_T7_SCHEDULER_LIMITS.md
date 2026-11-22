# PHASE9 ROUND141 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 3/3) + REBOOT GIỮA LƯỢT (2c0efe57 → 57a0dd12, btime 21:52:21Z) KHÔNG nuốt slot nào + started_at lượt 141 ĐÃ BỊ VIẾT LẠI — bằng chứng trực tiếp thứ năm (btime + 32 s) + run 140 viết lại LẦN 2 tại reboot #23 (btime + 31 s)

- **Luồng:** T7 đợt 141 (lượt cron 03:35 +07 19/11/2026 = 20:35:51Z). Hai boot trong lúc làm việc: boot lúc mở **2c0efe57-5559-4e92-9f8b-aecf1f9866a3, btime 19:54:12Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 20:39Z, trùng nhau; khớp brief/flag đợt 141 — lần này KHÔNG có sai lệch btime như đợt 139) và boot mới sau reboot giữa lượt **57a0dd12-c76b-4889-8c87-cc068173ffb1, btime 21:52:21Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 21:53Z và 22:25Z, trùng nhau; T2-141 chưa cập nhật boot-verify.txt với boot này tới kiểm lần 3 — xem §2.5). Reboot 21:52:21Z xảy ra GIỮA lượt 141, lúc run vcut 141 đang chạy.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 19:30:06Z 18/11 (lúc T7 đợt 140 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 140 + cờ `.done` đợt 141 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 140 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 140 đã `succeeded`, đợt 141 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 12 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ NĂM: lượt 141 ĐÃ BỊ VIẾT LẠI tại reboot giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (sau đợt 137, 138, 139 và 140).** Lượt vcut đợt 141 (run `85a2b391`) started_at ghi 20:35:51Z ở kiểm lần 1 (jitter 0 s) và lần 2, sau reboot giữa lượt (boot 57a0dd12, btime 21:52:21Z) ghi nay **21:52:53Z = btime + 32 s**, jitter **+4.622 s**; KHÔNG bị viết lại lần 2 (không có reboot thứ hai tới kiểm lần 3, 22:25Z). **Đồng thời, run 140 (`1e775062`) ĐÃ BỊ VIẾT LẠI LẦN 2 tại reboot #23** (btime 19:54:12Z, xảy ra lúc run 140 vẫn chạy, finished 20:02:43Z): started_at từ 17:53:45Z (T7-140 thấy lúc 19:30Z) thành **19:54:43Z = btime + 31 s** — một lần kiểm độc lập nữa của cùng giả thuyết trong đợt này. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 12.** Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / **32 s (141-lần-1)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–140): heartbeat **44/236 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/189 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 19:30:06Z → 22:25:31Z 18/11

Cửa kiểm ~2h55'. Ba lần kiểm chính (lần 1 ~20:41Z, lần 2 ~21:35Z, lần 3 ~22:25Z) + 1 kiểm giữa (~21:53Z sau reboot) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 02:50:50 (19:50:50Z) | 49f7c4dd | 19:45:34 | −316 s | CÓ |
| 03:20:50 (20:20:50Z) | 3d8798e0 | 20:15:34 | −316 s | CÓ |
| 03:50:50 (20:50:50Z) | 0432de30 | 20:45:34 | −316 s | CÓ |
| 04:20:50 (21:20:50Z) | 586bdc4d | 21:15:34 | −316 s | CÓ |
| 04:50:50 (21:50:50Z) | cc09596c | 21:45:34 | −316 s | CÓ |
| 05:20:50 (22:20:50Z) | 81b9fed4 | 22:15:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 6 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 19:50:50Z + 20:20:50Z + 20:50:50Z + 21:20:50Z chạy trên boot 2c0efe57; slot 21:50:50Z chạy TRƯỚC reboot giữa lượt (start 21:45:34Z < btime 21:52:21Z); slot 22:20:50Z chạy đúng giờ trên boot mới 57a0dd12 — scheduler hồi phục sau reboot giữa lượt.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:00 (20:00Z) | 0caee408 | 20:00:00 | 0 s | CÓ |
| 04:00 (21:00Z) | 6e4c0436 | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | fc9033a0 | 22:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 22:00Z là slot đầu tiên tới hạn sau reboot giữa lượt — chạy đúng giờ (0 s) trên boot mới 57a0dd12; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 19:50:50Z thuộc cửa 141 (sau mốc 19:30:06Z của T7-140), KHÔNG đếm lại ở đợt 140. Slot HB tiếp theo sau cửa này là 22:50:50Z, DR tiếp theo là 23:00Z (thuộc T7-142).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + lần 2 + kiểm giữa + lần 3:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 10:50:50Z) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + lần 2 (danh sách DR nhảy từ 06:00Z xuống 04:00Z); ở kiểm giữa + lần 3 ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 07:00Z) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–140 không đổi, trừ củng cố giả thuyết started_at ở §2.4.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Cả 6 slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 10:50:50Z) nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 12, BẰNG CHỨNG TRỰC TIẾP THỨ NĂM (+ run 140 viết lại lần 2)

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
| Đợt 140 | 1e775062 | 17:35:51 | 17:35:51Z (T7-140 thấy running ở kiểm lần 1 ~17:38Z, jitter 0 s) → 17:53:45Z (kiểm giữa đợt 140) | **19:54:43** | **+8.332 s** | **19:54:12Z** | **31 s (lần 2)** |
| **Đợt 141** | **85a2b391** | **20:35:51** | **20:35:51Z (T7-141 thấy running ở kiểm lần 1 ~20:41Z và lần 2 ~21:35Z, jitter 0 s)** | **21:52:53** | **+4.622 s** | **21:52:21Z** | **32 s** |

- Kiểm chứng số học đợt 141: 1795038773 − 1795038741 = 32 s ✓; 1795038773 − 1795034151 = 4.622 s ✓.
- Kiểm chứng số học đợt 140 lần-2: 1795031683 − 1795031652 = 31 s ✓; 1795031683 − 1795023351 = 8.332 s ✓. Run 140 finished 1795032163 = 20:02:43Z — sau reboot #23 (btime 19:54:12Z) nên lần viết lại thứ hai này xảy ra đúng lúc run vẫn chạy.
- **Viết lại của run 141 xảy ra GIỮA kiểm lần 2 (21:35Z) và kiểm giữa (21:53Z), tại reboot đầu tiên giữa lượt** — T7 tự thấy giá trị trước (20:35:51Z) và sau (21:52:53Z) trong cùng một đợt. Đây là lần thứ năm giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137; lần hai: đợt 138; lần ba: đợt 139; lần bốn: đợt 140).
- **KHÔNG có lần viết lại thứ hai cho run 141:** started_at lượt 141 đứng yên ở 21:52:53Z qua kiểm lần 3 (22:25Z); boot không đổi (57a0dd12, btime 21:52:21Z) trong khoảng đó.
- **Run 140 KHÔNG bị viết lại lần 3** tại reboot giữa lượt 141 (started_at vẫn 19:54:43Z qua kiểm giữa + lần 3) — vì đã finished 20:02:43Z trước reboot 21:52:21Z. Đợt 139 (`24a20fbc`): started vẫn 1795017316 = 15:55:16Z, không đổi qua cả 4 lần kiểm đợt này — KHÔNG viết lại lần 2; đợt 138 (`4d2272ce`): started vẫn 1795010053 = 13:54:13Z, không đổi; đợt 137 (`832a52f5`): started vẫn 1794994607 = 09:36:47Z, không đổi.
- **Giả thuyết sau kiểm thứ 12 (tinh chỉnh từ đợt 139, nay được củng cố thêm lần nữa — và thêm một lần kiểm độc lập từ run 140 lần-2):** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s. Các reboot sau khi run đã finished KHÔNG viết lại; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / **32 s (141-lần-1)** — 32 s nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi; đợt 141 không có reboot thứ hai trong lượt nên không có số lần-2.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 141 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 21:52:53Z → finished (chưa có lúc T7 kiểm lần 3, run vẫn `running`); thời lượng tường thật là 20:35:51Z → finished. Hệ quả số liệu đợt 140 (chốt ở kiểm lần 1 đợt này): thời lượng tường thật 17:35:51Z → 20:02:43Z = 8.812 s (2h26'52"); theo mốc ghi nay (lần-2) 19:54:43Z → 20:02:43Z = 480 s (8'00") — T7-140 ghi theo mốc lần-1 (17:53:45Z → finished) nay đã lỗi thời, T10 dùng mốc lần-2 này.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot 2c0efe57 → 57a0dd12, btime 21:52:21Z — GIỮA lượt 141** (giữa kiểm lần 2 21:35Z và kiểm giữa 21:53Z), lúc run vcut 141 đang chạy — ứng viên sự kiện tiếp theo sau #20? theo định nghĩa gộp T10-133 §10.2 (T8-140 tạm đánh boot 90392aa5 là #98?; T10-141 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cửa sổ reboot (T7 ước lượng từ hoạt động cuối trên boot cũ): **(21:35:27Z, 21:52:21Z]** — hẹp hơn: sleep của T7 chết sau 976 s kể từ ~21:36:26Z tức ~21:52:42Z, nên reboot xảy ra trong (21:35:27Z, 21:52:42Z]; T2-141 xác nhận hẹp hơn (T7 chỉ ghi mốc).
- **Khoảng im lặng chứa reboot (21:45:34Z, 21:52:53Z] (~7'19", 439 s):** hoạt động cuối trước khoảng: HB 21:50:50Z start 21:45:34Z; hoạt động đầu sau khoảng: started_at vcut 141 bị viết lại 21:52:53Z. Btime 21:52:21Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 141** tới kiểm lần 3 (boot_id vẫn 57a0dd12, btime vẫn 21:52:21Z — 21:53Z → 22:25Z; sleep chờ kiểm lần 3 hoàn thành bình thường, 1.860 s). DR 22:00Z + HB 22:20:50Z chạy đúng giờ trên boot mới — scheduler hồi phục sau reboot giữa lượt, không nuốt slot nào.
- Lưu ý phương pháp: sleep chờ kiểm lần 3 của T7 bị SIGTERM đúng lúc reboot 21:52:21Z (process chết theo boot cũ, duration 976 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot chính nhờ lần kiểm giữa này (giống đợt 137/138/139/140). Sleep chờ kiểm lần 2 trên boot cũ (3.060 s) và sleep chờ kiểm lần 3 trên boot mới (1.860 s) hoàn thành bình thường.
- **Brief/flag đợt 141 KHỚP btime đo được:** `round-in-progress.md` ghi "đợt 140 đóng trên boot 2c0efe57, btime 19:54:12Z" — khớp hoàn toàn btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1).
- Đối chiếu T2-141 (file `round141-t2/boot-verify.txt`, đã đọc): T2 tự xác minh boot **2c0efe57-5559-4e92-9f8b-aecf1f9866a3, btime 1795031652 = 19:54:12Z** lúc kiểm lần 2 — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới 57a0dd12 tới kiểm lần 3 (file vẫn chỉ ghi 2c0efe57, last entry 20:44:36Z) — dù cờ `round141-t2.done` đã có; boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 3 đều trùng). T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 17:35:51 (đợt 140) | 00:35:51 | 1e775062 | `succeeded`, finished 20:02:43Z; started_at 19:54:43Z = btime 19:54:12Z + 31 s — **ĐÃ viết lại LẦN 2** tại reboot #23 (lúc run vẫn chạy); KHÔNG viết lại lần 3 tại reboot giữa lượt 141 (đã finished) |
| 20:35:51 (đợt 141) | 03:35:51 | 85a2b391 | `running` lúc kiểm lần 3 (~22:25Z), started_at đã bị viết lại 21:52:53Z (btime 21:52:21Z + 32 s) — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **19:54:12Z** (`/proc/stat` 1795031652 + `uptime -s` + `who -b` 19:54 lúc 20:39Z, trùng nhau); boot_id **2c0efe57-5559-4e92-9f8b-aecf1f9866a3** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief/flag đợt 141 + khớp độc lập file boot-verify của T2-141 về cả boot_id + btime).
- Boot sau reboot giữa lượt btime **21:52:21Z** (`/proc/stat` 1795038741 + `uptime -s` + `who -b` 21:52 lúc 21:53Z và 22:25Z, trùng nhau); boot_id **57a0dd12-c76b-4889-8c87-cc068173ffb1** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-141 chưa cập nhật boot-verify.txt với boot này tới 22:25Z — chỉ có T7 xác minh).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, lần 2, kiểm giữa và lần 3) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~22:25Z): **6/9 cờ `.done` đã có** — `round141-t1.done`, `round141-t2.done`, `round141-t4.done`, `round141-t5.done`, `round141-t6.done`, `round141-t8.done`. Chưa có: t9, t10 + t7 (chính T7). Lúc kiểm lần 2 (~21:35Z) cũng đã có 6/9 (cùng danh sách); lúc kiểm lần 1 (~20:41Z) chưa liệt kê. Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–140.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h55' (19:30:06Z → 22:25:31Z 18/11), đủ 6 slot HB + 3 slot DR. Ba lần kiểm chính + 1 kiểm giữa khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 19:50:50Z thuộc cửa 141 theo quy ước đứng — T7-142 bắt đầu cửa sau 22:25:31Z, slot HB tiếp theo là 22:50:50Z, DR tiếp theo là 23:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 140, cùng phương pháp)

- Heartbeat: 44/230 → **44/236 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 05:20:50 +07). Kiểm toán cửa sổ: 230 + 6 slot mới = 236 ✓. Số thiếu +0.
- Deterministic-doctor: 49/186 → **49/189 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 05:00 +07). Kiểm toán: 186 + 3 = 189 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/236 = 18,6% (giảm từ 19,1% — 0 thiếu mới); DR 49/189 = 25,9% (giảm từ 26,3% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 12: ĐÃ CÓ BẰNG CHỨNG TRỰC TIẾP THỨ NĂM + GIẢ THUYẾT GIỮ ĐÚNG.** Lượt 141 bị viết lại tại reboot đầu tiên giữa lượt (btime 21:52:21Z + 32 s → 21:52:53Z), T7 tự thấy cả trước và sau trong cùng một đợt; run 140 KHÔNG viết lại lần 3 tại cùng reboot vì đã finished; KHÔNG có reboot thứ hai trong lượt nên KHÔNG có lần viết lại thứ hai. Đồng thời run 140 viết lại LẦN 2 tại reboot #23 (btime 19:54:12Z + 31 s → 19:54:43Z) là một lần kiểm độc lập nữa của cùng giả thuyết trong đợt này. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / **32 s (141-lần-1)**. Chỉ ghi nhận; T5/T6 đối chiếu; T10-141 kiểm lại lượt 141 lúc đóng nếu có reboot nữa sau 22:25Z.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Cả 6 slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 2c0efe57 → 57a0dd12 (btime 21:52:21Z) GIỮA lượt 141** — ứng viên sự kiện tiếp theo sau #20? theo định nghĩa gộp T10-133 §10.2 (T8-140 tạm đánh boot 90392aa5 là #98?; T10-141 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Reboot này KHÔNG nuốt slot nào — khoảng im lặng chứa reboot (21:45:34Z, 21:52:53Z] không chứa slot tới hạn nào; DR 22:00Z + HB 22:20:50Z chạy đúng giờ trên boot mới.
5. **T2-141 chưa cập nhật boot-verify.txt với boot mới 57a0dd12** tới kiểm lần 3 (file vẫn chỉ ghi 2c0efe57, last entry 20:44:36Z) — dù cờ `round141-t2.done` đã có. Boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 3 đều trùng). T10/T6 đối chiếu lúc đóng.
6. **Mù #60: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **Không có sai số số liệu mới — không có F-141-T7-n nào.** 3 lần kiểm chính + 1 kiểm giữa khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (2c0efe57 lúc mở, 57a0dd12 sau reboot) và đối chiếu khớp T2 (nguồn độc lập) cho boot 2c0efe57 (btime 19:54:12Z); brief/flag đợt 141 khớp btime đo được (không có sai lệch btime như F-139-T7-1); boot 57a0dd12 chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm lần 3) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round141-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round141-t7/NOTES.md` (không nằm trong repo nên không stage).
