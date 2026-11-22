# PHASE9 ROUND139 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 7/7 + DR 3/3) + REBOOT GIỮA LƯỢT (541524e2 → af558fb5 = #97?, btime 15:54:37Z) KHÔNG nuốt slot nào + started_at lượt 139 ĐÃ BỊ VIẾT LẠI — bằng chứng trực tiếp thứ ba (btime + 39 s) + run 138 BỊ VIẾT LẠI LẦN 2 ở reboot trước lượt (btime + 32 s)

- **Luồng:** T7 đợt 139 (lượt cron 21:35 +07 18/11/2026 = 14:35:51Z). Hai boot trong lúc làm việc: boot lúc mở **541524e2-c789-420b-a27b-9287d68c63a3, btime 13:53:41Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 14:39Z, trùng nhau; khớp độc lập file `boot-verify.txt` của T2-139) và boot mới sau reboot giữa lượt **af558fb5-e964-4116-a69b-ec784f3defab, btime 15:54:37Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 15:55Z, 16:02Z và 16:35Z, trùng nhau; T2-139 chưa cập nhật boot-verify.txt với boot này tới kiểm lần 3 — xem §2.5). Reboot 15:54:37Z xảy ra GIỮA lượt 139, lúc run vcut 139 đang chạy.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 13:05:09Z 18/11 (lúc T7 đợt 138 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 138 + cờ `.done` đợt 139 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 138 lành; đợt này lành tiếp): heartbeat 7/7, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 7 | 7 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 138 đã `succeeded`, đợt 139 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 10 của giả thuyết, ĐÃ TINH CHỈNH VÀ ĐƯỢC CỦNG CỐ THÊM: lượt 139 ĐÃ BỊ VIẾT LẠI tại reboot giữa lượt, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (bằng chứng trực tiếp thứ ba, sau đợt 137 và 138).** Lượt vcut đợt 139 (run `24a20fbc`) started_at ghi 14:35:51Z ở kiểm lần 1 + lần 2 (jitter 0 s), sau reboot giữa lượt (boot af558fb5, btime 15:54:37Z) ghi nay **15:55:16Z = btime + 39 s**, jitter **+4.765 s**; KHÔNG bị viết lại lần 2 (boot không đổi tới 16:35Z). **Đồng thời, run đợt 138 (`4d2272ce`) BỊ VIẾT LẠI LẦN 2** ở reboot 914964c3 → 541524e2 (btime 13:53:41Z) xảy ra giữa kiểm lần 3 của T7-138 và kiểm lần 1 đợt này, lúc run 138 vẫn đang chạy (finished 14:08:07Z): started_at từ 11:53:10Z thành **13:54:13Z = btime + 32 s**, jitter +8.302 s; KHÔNG viết lại lần 3 tại reboot giữa lượt 139 vì đã finished. **Giả thuyết tinh chỉnh "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 10.** Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / **39 s (139-lần-1)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–138): heartbeat **44/224 slot thiếu** (số thiếu +0, mẫu số +7); deterministic-doctor **49/183 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 13:05:09Z → 16:35:44Z 18/11

Cửa kiểm ~3h31'. Ba lần kiểm chính (lần 1 ~14:40Z, lần 2 ~15:39Z, lần 3 ~16:35Z) + 1 kiểm giữa (~15:55Z sau reboot) + 1 kiểm bổ sung (~16:02Z theo thông báo parent về reboot của T8) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa hai lần kiểm do reboot xen giữa lượt + thông báo parent).

**Heartbeat (lưới :20:50/:50:50Z): 7/7 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 20:20:50 (13:20:50Z) | 47525eaf | 13:15:34 | −316 s | CÓ |
| 20:50:50 (13:50:50Z) | 5ba2cf14 | 13:45:34 | −316 s | CÓ |
| 21:20:50 (14:20:50Z) | 70f7b8ab | 14:15:34 | −316 s | CÓ |
| 21:50:50 (14:50:50Z) | ca782c31 | 14:45:34 | −316 s | CÓ |
| 22:20:50 (15:20:50Z) | b677e1a2 | 15:15:34 | −316 s | CÓ |
| 22:50:50 (15:50:50Z) | 28a29750 | 15:45:34 | −316 s | CÓ |
| 23:20:50 (16:20:50Z) | 91558a6f | 16:15:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 7 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 13:20:50Z + 13:50:50Z chạy TRƯỚC reboot 914964c3 → 541524e2 (btime 13:53:41Z, giữa hai đợt); slot 14:20:50Z + 14:50:50Z + 15:20:50Z chạy trên boot 541524e2; slot 15:50:50Z chạy TRƯỚC reboot giữa lượt (start 15:45:34Z < btime 15:54:37Z); slot 16:20:50Z chạy đúng giờ trên boot mới af558fb5 — scheduler hồi phục sau reboot giữa lượt.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:00 (14:00Z) | 81b83cbc | 14:00:00 | 0 s | CÓ |
| 22:00 (15:00Z) | 7a1a2073 | 15:00:00 | 0 s | CÓ |
| 23:00 (16:00Z) | 38258a7c | 16:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 16:00Z là slot đầu tiên tới hạn sau reboot giữa lượt — chạy đúng giờ (0 s) trên boot mới af558fb5; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 13:20:50Z thuộc cửa 139 (sau mốc 13:05:09Z của T7-138), KHÔNG đếm lại ở đợt 138. Slot HB tiếp theo sau cửa này là 16:50:50Z, DR tiếp theo là 17:00Z (thuộc T7-140).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + lần 2 + kiểm giữa + bổ sung + lần 3:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 09:20:50Z) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở cả 5 lần kiểm (danh sách DR nhảy từ 06:00Z xuống 04:00Z).
- Các kết luận đợt 125–138 không đổi, trừ tinh chỉnh giả thuyết started_at ở §2.4.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Cả 7 slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 09:20:50Z) nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Slot cũ ngoài cửa hiện trong danh sách limit=15 (không đếm lại): HB 07:50:50Z run `af18a2e0` started 08:00:00Z (+550 s); HB 08:20:50Z run `e58ac5a2` started 08:31:33Z (+643 s) — nằm TRƯỚC cửa T7-139, đã thuộc các đợt trước.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 10, BẰNG CHỨNG TRỰC TIẾP THỨ BA + TINH CHỈNH ĐƯỢC CỦNG CỐ

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| Đợt 135 | f2fa4088 | 02:35:51 | 02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s) | 03:35:56 | +3.605 s | 03:35:20Z | 36 s |
| Đợt 136 | 7283f96f | 05:35:51 | 05:35:51Z (T7-136 thấy running tới 07:07Z, jitter 0 s) | 05:35:51 | 0 s | — (không có reboot giữa lượt) | — |
| Đợt 137 | 832a52f5 | 08:35:51 | 08:35:51Z (T7-137 thấy running ở kiểm lần 1 ~08:40Z và lần 2 ~09:08Z, jitter 0 s) | 09:36:47 | +3.656 s | 09:36:01Z | 46 s |
| Đợt 138 | 4d2272ce | 11:35:51 | 11:35:51Z (T7-138 thấy running ở kiểm lần 1 ~11:38Z, jitter 0 s) → 11:53:10Z (kiểm lần 3 đợt 138) | **13:54:13** | **+8.302 s** | **13:53:41Z** | **32 s (lần 2)** |
| **Đợt 139** | **24a20fbc** | **14:35:51** | **14:35:51Z (T7-139 thấy running ở kiểm lần 1 ~14:40Z và lần 2 ~15:39Z, jitter 0 s)** | **15:55:16** | **+4.765 s** | **15:54:37Z** | **39 s** |

- Kiểm chứng số học đợt 139: 1795017316 − 1795017277 = 39 s ✓; 1795017316 − 1795012551 = 4.765 s ✓.
- Kiểm chứng số học đợt 138 lần 2: 1795010053 − 1795010021 = 32 s ✓; 1795010053 − 1795001751 = 8.302 s ✓; thời lượng tường thật đợt 138: 11:35:51Z → 14:08:07Z = 9.136 s (2h32'16"); thời lượng theo mốc ghi nay: 13:54:13Z → 14:08:07Z = 834 s (13'54").
- **Viết lại lần 2 của run 138 xảy ra GIỮA kiểm lần 3 của T7-138 (13:05:09Z) và kiểm lần 1 đợt này (14:40Z), tại reboot 914964c3 → 541524e2 (btime 13:53:41Z), lúc run 138 VẪN ĐANG CHẠY** (finished 14:08:07Z > btime 13:53:41Z). Reboot này xảy ra GIỮA HAI ĐỢT, TRƯỚC khi đợt 139 mở (14:35:51Z).
- **Viết lại của run 139 xảy ra GIỮA kiểm lần 2 (15:39Z) và kiểm giữa (15:55Z), tại reboot đầu tiên giữa lượt** — T7 tự thấy giá trị trước (14:35:51Z) và sau (15:55:16Z) trong cùng một đợt. Đây là lần thứ ba giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137; lần hai: đợt 138).
- **KHÔNG có lần viết lại thứ hai cho run 139:** started_at lượt 139 đứng yên ở 15:55:16Z qua kiểm bổ sung (16:02Z) và kiểm lần 3 (16:35Z); boot không đổi (af558fb5, btime 15:54:37Z) trong khoảng đó.
- **Run 138 KHÔNG bị viết lại lần 3** tại reboot giữa lượt 139 (started_at vẫn 13:54:13Z qua kiểm giữa + bổ sung + lần 3) — vì đã finished 14:08:07Z trước reboot 15:54:37Z. Đợt 137 (`832a52f5`): started vẫn 1794994607 = 09:36:47Z, không đổi qua cả 5 lần kiểm đợt này — KHÔNG viết lại lần 2; đợt 136 (`7283f96f`): started vẫn 1794980151 = 05:35:51Z, không đổi; đợt 135 (`f2fa4088`): started vẫn 1794972956 = 03:35:56Z, không đổi.
- **Giả thuyết sau kiểm thứ 10 (tinh chỉnh từ đợt 139, nay được củng cố thêm):** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s. Các reboot sau khi run đã finished KHÔNG viết lại; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / **39 s (139-lần-1)** — 39 s KHÔNG phải +50 s như câu hỏi gợi ý của parent khi chuyển tin T8 (giá trị đo được là 39 s); đợt 136 không có reboot giữa lượt nên không có số trong chuỗi; đợt 139 không có reboot thứ hai trong lượt nên không có số lần-2. Jitter lớn nhất vẫn +7.135 s (đợt 132).
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 139 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 15:55:16Z → finished (chưa có lúc T7 kiểm lần 3, run vẫn `running`); thời lượng tường thật là 14:35:51Z → finished.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot 914964c3 → 541524e2, btime 13:53:41Z — GIỮA HAI ĐỢT** (giữa kiểm lần 3 của T7-138 13:05:09Z và kiểm lần 1 đợt này 14:40Z; cách kiểm lần 3 T7-138 6.512 s = 1h48'32"), TRƯỚC khi đợt 139 mở (14:35:51Z). Boot này là boot lúc mở đợt 139.
- **Sai lệch btime trong brief/flag (ghi rõ, không tự sửa nguồn):** brief mở đợt + file `round-in-progress.md` đều ghi boot lúc mở đợt 139 là "541524e2 (btime 14:03:07Z)". Đo trực tiếp lúc 14:39–14:40Z: boot_id **541524e2-c789-420b-a27b-9287d68c63a3** KHỚP, nhưng btime = **1795010021 = 13:53:41Z** theo cả ba nguồn (`/proc/stat`, `uptime -s` 13:53:41, `who -b` 13:53 — trùng nhau). 14:03:07Z muộn hơn btime đo được 546 s (9'06") — nhiều khả năng 14:03:07Z là thời điểm QUAN SÁT thấy boot mới (lần đầu ghi nhận), không phải btime. T2-139 độc lập ghi cùng btime 1795010021 = 13:53:41Z trong `boot-verify.txt` — củng cố btime đo được. Mọi offset trong file này tính theo btime đo được 13:53:41Z; nếu dùng 14:03:07Z thì offset lần-2 của run 138 sẽ âm (−534 s), vô lý. T10/T6 đối chiếu và sửa hồ sơ boot nếu cần.
- **Reboot 541524e2 → af558fb5, btime 15:54:37Z — GIỮA lượt 139** (giữa kiểm lần 2 15:39Z và kiểm giữa 15:55Z), lúc run vcut 139 đang chạy — ứng viên sự kiện tiếp theo sau #19? theo định nghĩa gộp T10-133 §10.2; T10-139 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối. Cửa sổ reboot (T7 ước lượng từ hoạt động cuối trên boot cũ): **(15:40Z, 15:54:37Z]**; T2-139 xác nhận hẹp hơn. Số boot tạm (T8-139 đọc, T6 chốt): 541524e2 là #96?, boot mới af558fb5 là #97?.
- **Dị thường đồng hồ btime (F-139-T8-3, do T8 báo — T7 ghi nhận, không tự đo):** btime boot mới af558fb5 là 15:54:37Z, SỚM hơn mốc cuối trên boot cũ 5 s (harness T8 xong 15:54:41Z trên boot cũ). T7 tự đo btime boot mới bằng ba nguồn trùng nhau (`/proc/stat` 1795017277 + `uptime -s` 15:54:37 + `who -b` 15:54 — kiểm giữa 15:55Z, kiểm bổ sung 16:02Z và kiểm lần 3 16:35Z đều trùng) nên giá trị 15:54:37Z là chắc chắn theo chuẩn đo của T7; phần lệch 4–5 s so với mốc cuối boot cũ là dị thường đồng hồ/btime cùng lớp với caveat T6-134 §8.4(b). T2/T6 đối chiếu cửa sổ reboot hẹp; T7 dùng btime `/proc/stat` 15:54:37Z cho mọi offset (run 139: +39 s).
- **Khoảng im lặng chứa reboot giữa lượt (15:45:34Z, 15:55:16Z] (~9'42", 582 s):** hoạt động cuối trước khoảng: HB 15:50:50Z start 15:45:34Z; hoạt động đầu sau khoảng: started_at vcut 139 bị viết lại 15:55:16Z. Btime 15:54:37Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Khoảng im lặng chứa reboot trước lượt (13:45:34Z, 13:54:13Z] (~8'39", 519 s):** hoạt động cuối trước khoảng: HB 13:50:50Z start 13:45:34Z; hoạt động đầu sau khoảng: started_at vcut 138 bị viết lại 13:54:13Z. Btime 13:53:41Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có (HB tiếp theo 14:20:50Z, DR tiếp theo 14:00Z — cả hai đều sau khoảng, chạy đúng giờ trên boot mới). **Reboot này KHÔNG nuốt slot nào.**
- **Không có reboot thứ hai giữa lượt 139** tới kiểm lần 3 (boot_id vẫn af558fb5, btime vẫn 15:54:37Z — 15:55Z → 16:35Z). DR 16:00Z chạy đúng giờ (0 s) và HB 16:20:50Z chạy đúng giờ (−316 s) trên boot mới — scheduler hồi phục sau reboot giữa lượt, không nuốt slot nào.
- Lưu ý phương pháp: sleep chờ kiểm lần 3 của T7 bị SIGTERM đúng lúc reboot 15:54:37Z (process chết theo boot cũ, duration 905 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot chính nhờ lần kiểm giữa này (giống đợt 137/138). Sleep chờ kiểm lần 3 trên boot mới (2.340 s) hoàn thành bình thường.
- Đối chiếu T2-139 (file `round139-t2/boot-verify.txt`, đã đọc): T2 tự xác minh cùng boot **541524e2-c789-420b-a27b-9287d68c63a3, btime 1795010021 = 13:53:41Z** lúc mở (last entry 14:43:23Z) — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới af558fb5 tới kiểm lần 3 (16:35Z) — boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + bổ sung + lần 3 đều trùng) + báo cáo của T8-139 (T8 xong 16:00Z, ghi nhận reboot sau khi harness xong 15:54:41Z). T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 18:35:51 18/11 (đợt 138) | 4d2272ce | `succeeded`, finished 14:08:07Z; started_at 13:54:13Z = btime 13:53:41Z + 32 s — **BỊ VIẾT LẠI LẦN 2** (trước đó 11:53:10Z ở kiểm lần 3 đợt 138); KHÔNG viết lại lần 3 tại reboot giữa lượt 139 (đã finished) |
| 21:35:51 (đợt 139) | 24a20fbc | `running` lúc kiểm lần 3 (~16:35Z), started_at đã bị viết lại 15:55:16Z (btime 15:54:37Z + 39 s) — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 5 lần khớp nhau.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **13:53:41Z** (`/proc/stat` 1795010021 + `uptime -s` + `who -b` 13:53 lúc 14:39Z, trùng nhau); boot_id **541524e2-c789-420b-a27b-9287d68c63a3** tự xác minh từ `/proc/sys/kernel/random/boot_id` (KHÔNG khớp btime 14:03:07Z trong brief/flag — xem §2.5; khớp độc lập file boot-verify của T2-139 về cả boot_id + btime).
- Boot sau reboot giữa lượt btime **15:54:37Z** (`/proc/stat` 1795017277 + `uptime -s` + `who -b` 15:54 lúc 15:55Z, 16:02Z và 16:35Z, trùng nhau); boot_id **af558fb5-e964-4116-a69b-ec784f3defab** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-139 chưa cập nhật boot-verify.txt với boot này tới 16:35Z — chỉ có T7 + T8 xác minh).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, lần 2, kiểm giữa, kiểm bổ sung và kiểm lần 3) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~16:35Z): **6/9 cờ `.done` đã có** — `round139-t1.done`, `round139-t2.done`, `round139-t4.done`, `round139-t5.done`, `round139-t6.done`, `round139-t8.done`. Chưa có: t9, t10 + t7 (chính T7). Lúc kiểm lần 2 (~15:39Z) mới có 5/9 (chưa có t8); lúc kiểm lần 1 (~14:40Z) chưa có cờ nào. Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×5 lần; DR limit=15 ×5 lần; vcut limit=5 ×5 lần). Lưới kỳ vọng như đợt 125–138.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h31' (13:05:09Z → 16:35:44Z 18/11), đủ 7 slot HB + 3 slot DR. Ba lần kiểm chính + 1 kiểm giữa + 1 kiểm bổ sung khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt; kiểm bổ sung phát sinh do thông báo parent về reboot của T8); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 13:20:50Z thuộc cửa 139 theo quy ước đứng — T7-140 bắt đầu cửa sau 16:35:44Z, slot HB tiếp theo là 16:50:50Z, DR tiếp theo là 17:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 138, cùng phương pháp)

- Heartbeat: 44/217 → **44/224 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 23:20:50 +07). Kiểm toán cửa sổ: 217 + 7 slot mới = 224 ✓. Số thiếu +0.
- Deterministic-doctor: 49/180 → **49/183 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 23:00 +07). Kiểm toán: 180 + 3 = 183 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/224 = 19,6% (giảm từ 20,3% — 0 thiếu mới); DR 49/183 = 26,8% (giảm từ 27,2% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 10: ĐÃ CÓ BẰNG CHỨNG TRỰC TIẾP THỨ BA + TINH CHỈNH ĐƯỢC CỦNG CỐ.** Lượt 139 bị viết lại tại reboot đầu tiên giữa lượt (btime 15:54:37Z + 39 s → 15:55:16Z), T7 tự thấy cả trước và sau trong cùng một đợt; run 138 bị viết lại LẦN 2 ở reboot trước lượt (btime 13:53:41Z + 32 s) và KHÔNG viết lại lần 3 tại reboot giữa lượt 139 vì đã finished. Giả thuyết tinh chỉnh "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 10. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / **39 s (139-lần-1)**. Chỉ ghi nhận; T5/T6 đối chiếu; T10-139 kiểm lại lượt 139 lúc đóng nếu có reboot nữa sau 16:35Z.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Cả 7 slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 914964c3 → 541524e2 (btime 13:53:41Z) GIỮA HAI ĐỢT + reboot 541524e2 → af558fb5 (btime 15:54:37Z, #97? tạm theo T8) GIỮA lượt 139** — ứng viên sự kiện tiếp theo sau #19? theo định nghĩa gộp T10-133 §10.2; T10-139 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối. Cả hai reboot đều KHÔNG nuốt slot nào — khoảng im lặng chứa reboot không chứa slot tới hạn nào; DR 16:00Z + HB 16:20:50Z chạy đúng giờ trên boot mới.
5. **Sai lệch btime 14:03:07Z trong brief/flag (F-139-T7-1):** brief + `round-in-progress.md` ghi boot lúc mở đợt 139 là "541524e2 (btime 14:03:07Z)"; T7 đo ba nguồn trùng nhau btime 13:53:41Z (chênh 546 s), T2-139 độc lập ghi cùng btime 1795010021 = 13:53:41Z. Nhiều khả năng 14:03:07Z là thời điểm quan sát thấy boot mới, không phải btime. T10/T6 đối chiếu và sửa hồ sơ boot nếu cần.
6. **Mù #58: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-139-T7-1 — Btime 14:03:07Z trong brief/flag KHÔNG khớp btime đo được (chưa sửa nguồn, chỉ ghi nhận):** brief mở đợt + `round-in-progress.md` ghi boot lúc mở đợt 139 là "541524e2 (btime 14:03:07Z)"; đo trực tiếp ba nguồn trùng nhau cho btime 13:53:41Z (chênh 546 s). Đây là sai lệch của nguồn (brief/flag), KHÔNG phải sai số đo của T7 — T7 ghi rõ cả hai giá trị và dùng btime đo được cho mọi tính toán offset. T2-139 độc lập ghi cùng btime 1795010021 = 13:53:41Z trong `boot-verify.txt` — củng cố btime đo được. T10/T6 đối chiếu và sửa hồ sơ boot nếu cần.
- **F-139-T7-2 — Dòng "Kiểm lần 3 (TBD)" thừa trong NOTES §2c (đã sửa):** lúc thêm kiểm giữa + kiểm bổ sung, một dòng placeholder "Kiểm lần 3 (~16:35Z): TBD" còn sót giữa hai bullet đã điền (cùng lớp lỗi với F-138-T7-1). Đã phát hiện khi rà lại bằng grep trước khi chốt và xóa dòng thừa; nội dung số liệu không đổi, không ảnh hưởng kết luận. File LIMITS này không bị lỗi tương tự (viết mới toàn bộ sau khi chốt).
- Ngoài F-139-T7-1/F-139-T7-2: **không có sai số số liệu mới.** 3 lần kiểm chính + 1 kiểm giữa + 1 kiểm bổ sung khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (541524e2 lúc mở, af558fb5 sau reboot) và đối chiếu khớp T2 (nguồn độc lập) cho boot 541524e2 (btime 13:53:41Z); boot af558fb5 chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm lần 3) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round139-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round139-t7/NOTES.md` (không nằm trong repo nên không stage).
