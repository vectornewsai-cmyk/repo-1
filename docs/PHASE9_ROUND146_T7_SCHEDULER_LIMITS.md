# PHASE9 ROUND146 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 3/3) + 1 REBOOT GIỮA LƯỢT (#34) KHÔNG nuốt slot nào + run 146 VIẾT LẠI 1 LẦN, offset 36 s TRONG dải ~30–50 s (bằng chứng trực tiếp thứ mười hai, kiểm thứ 20) + run 145 KẾT THÚC SUCCEEDED (không phải timeout) + run 146 KHỞI ĐỘNG ĐÚNG GIỜ — mẫu quyết (m) đợt 145 KHÔNG tái diễn, KHÔNG mở điều tra

- **Luồng:** T7 đợt 146 (lượt cron 18:35 +07 19/11/2026 = 11:35:51Z 19/11). Hai boot trong lúc làm việc: boot lúc mở **98a7c93f-83d3-40e5-8043-ee6dda19c5f1, btime 09:54:03Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 11:37Z, trùng nhau; khớp T7-145 + khớp độc lập file boot-verify của T2-146), boot sau reboot giữa lượt **6fb582df-455d-47cd-99dc-8bef48018536, btime 12:13:26Z** (ba nguồn trùng nhau lúc 12:14Z + lần 3 + kiểm cuối).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 11:03:00Z 19/11 (lúc T7 đợt 145 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận). Kiểm mẫu quyết (m) đợt 145 (run TIMEOUT + run sau chạy muộn): nếu tái diễn thì mở điều tra, nếu không thì chỉ ghi nhận.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS đợt 146 của T2 để đối chiếu + cờ `.done` đợt 146). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 145 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 145 đã `succeeded`, đợt 146 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 20 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ MƯỜI HAI: lượt 146 ĐÃ BỊ VIẾT LẠI 1 LẦN trong đợt này, T7 tự quan sát được cả TRƯỚC và SAU (sau đợt 137, 138, 139, 140, 141, 142, 143, 144 và 145).** Lượt vcut đợt 146 (run `e24b5870`) started_at ghi 11:35:51Z ở kiểm lần 1 (jitter 0 s — khởi động đúng giờ), sau reboot #34 ghi **12:14:02Z = btime(6fb582df) + 36 s**, jitter **+2.291 s**. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 20.** Chuỗi offset sau btime (chỉ tính theo boot đúng): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính — từng ghi sai 936 s)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)** / **40 s (145-lần-1)** / **36 s (146-lần-1)**.

- **Run 145 KẾT THÚC SUCCEEDED (không phải timeout):** run `fcfdad2e` finished 11:30:29Z, error_text=null — xem §2.4/§2.6. Kết cục ngã ngũ 67 s SAU cờ t10.done đợt 145 (11:29:22Z); T10-145 đóng sổ với run 145 "running" là đúng tại thời điểm đó.
- **Mẫu quyết (m) đợt 145 KHÔNG tái diễn — KHÔNG mở điều tra:** run 145 succeeded (không timeout) + run 146 khởi động đúng giờ (jitter 0 s). Cả hai vế của mẫu đều không xảy ra ở đợt 146.
- Cập nhật lũy kế (cùng phương pháp đợt 125–145): heartbeat **44/267 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/205 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 11:03:00Z → 14:04:xxZ 19/11

Cửa kiểm ~3h01'. Bốn lần kiểm (lần 1 ~11:37Z, kiểm giữa ~12:14Z sau reboot, lần 3 ~13:24Z, kiểm cuối ~14:04Z) **khớp hoàn toàn nhau ở mọi slot trùng** — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do một reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:20:50 (11:20:50Z) | 0448ab56 | 11:15:34 | −316 s | CÓ |
| 18:50:50 (11:50:50Z) | 87672f92 | 11:45:35 | −315 s | CÓ |
| 19:20:50 (12:20:50Z) | 3fe1a20c | 12:15:34 | −316 s | CÓ |
| 19:50:50 (12:50:50Z) | 1a62b46d | 12:45:34 | −316 s | CÓ |
| 20:20:50 (13:20:50Z) | 409aa63e | 13:15:34 | −316 s | CÓ |
| 20:50:50 (13:50:50Z) | 12639aff | 13:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Năm lượt jitter −316 s (mẫu chuẩn); một lượt −315 s (11:50:50Z — lệch 1 s, xem F-146-T7-1); 0 lượt muộn lớn.
- Slot 12:20:50Z là slot đầu tiên sau reboot #34 — chạy đúng giờ (jitter chuẩn −316 s) trên boot mới 6fb582df. Scheduler hồi phục sau reboot, không nuốt slot nào.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 19:00 (12:00Z) | 71398d9e | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | 4ce486dd | 13:00:00 | 0 s | CÓ |
| 21:00 (14:00Z) | cdfe6481 | 14:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 12:00Z chạy trên boot cũ 98a7c93f TRƯỚC reboot #34 (start 12:00:00Z < btime mới 12:13:26Z); slot 13:00Z là slot đầu tiên sau reboot #34 — chạy đúng giờ (0 s) trên boot mới 6fb582df; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 11:20:50Z thuộc cửa 146 (sau mốc 11:03:00Z của T7-145), KHÔNG đếm lại ở đợt 145. Slot DR 15:00Z + HB 14:20:50Z chưa tới hạn lúc kiểm cuối (~14:04Z) nên thuộc cửa T7-147 — T7-147 bắt đầu cửa sau 14:04:xxZ.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + kiểm giữa + lần 3 (+ kiểm cuối):

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ kiểm cuối chỉ xuống tới ~06:50:50Z 19/11) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + kiểm giữa + lần 3 (danh sách DR nhảy từ 06:00Z xuống 04:00Z 18/11 — 05:00Z 18/11 vắng); ở kiểm cuối ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 18:00Z 18/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–145 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn), trừ một lượt −315 s (F-146-T7-1 — lệch 1 s, không phải muộn lớn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 20, BẰNG CHỨNG TRỰC TIẾP THỨ MƯỜI HAI

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| Đợt 135 | f2fa4088 | 02:35:51 | 02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s) | 03:35:56 | +3.605 s | 03:35:20Z | 36 s |
| Đợt 136 | 7283f96f | 05:35:51 | 05:35:51Z (T7-136 thấy running tới 07:07Z, jitter 0 s) | 05:35:51 | 0 s | — (không có reboot giữa lượt) | — |
| Đợt 137 | 832a52f5 | 08:35:51 | 08:35:51Z (T7-137 thấy running ở kiểm lần 1 ~08:40Z và lần 2 ~09:08Z, jitter 0 s) | 09:36:47 | +3.656 s | 09:36:01Z | 46 s |
| Đợt 138 | 4d2272ce | 11:35:51 | 11:35:51Z (T7-138 thấy running ở kiểm lần 1 ~11:38Z, jitter 0 s) → 11:53:10Z (kiểm giữa đợt 138) | 13:54:13 | +8.302 s | 13:53:41Z | 32 s (lần 2) |
| Đợt 139 | 24a20fbc | 14:35:51 | 14:35:51Z (T7-139 thấy running ở kiểm lần 1 ~14:40Z và lần 2 ~15:39Z, jitter 0 s) | 15:55:16 | +4.765 s | 15:54:37Z | 39 s |
| Đợt 140 | 1e775062 | 17:35:51 | 17:35:51Z (T7-140 thấy running ở kiểm lần 1 ~17:38Z, jitter 0 s) → 17:53:45Z (kiểm giữa đợt 140) | **19:54:43** | **+8.332 s** | **19:54:12Z** | **31 s (lần 2)** |
| Đợt 141 | 85a2b391 | 20:35:51 | 20:35:51Z (T7-141 thấy running ở kiểm lần 1 ~20:41Z và lần 2 ~21:35Z, jitter 0 s) → 21:52:53Z (kiểm giữa đợt 141) | **22:48:39** | **+7.968 s** | **22:48:05Z (bde599df — ĐÍNH CHÍNH đợt 142, xem dưới)** | **34 s (lần 2 — ĐÍNH CHÍNH, từng ghi sai 936 s)** |
| Đợt 142 | eddb1710 | 23:35:51 | 23:35:51Z (T7-142 thấy running ở kiểm lần 1 ~23:41Z, jitter 0 s) → 23:54:57Z (kiểm giữa + lần 2 + lần 3) | **01:55:57** | **+8.406 s** | **01:55:25Z (70a5b0fc)** | **32 s (lần 2)** |
| Đợt 143 | b6c4b22d | 02:35:51 | 02:35:51Z (T7-143 thấy running ở kiểm lần 1 ~02:43Z và lần 2 ~03:33Z, jitter 0 s) | **03:56:20** | **+4.829 s** | **03:55:45Z (691a7403)** | **35 s (lần 1)** |
| Đợt 144 | b93ae161 | 05:35:51 | 05:35:51Z (T7-144 thấy running ở kiểm lần 1 ~05:40Z, jitter 0 s) → 05:53:59Z (kiểm giữa #1 ~05:54Z) → 07:56:57Z (kiểm cuối ~07:57Z) | **07:56:57** | **+8.466 s** | **07:56:16Z (e146ca67)** | **41 s (lần 2)** |
| Đợt 145 | fcfdad2e | 08:35:51 | 08:38:58Z (T7-145 thấy running ở kiểm lần 1 ~08:42Z và lần 2 ~09:32Z, jitter +187 s) → 09:54:43Z (kiểm giữa ~09:55Z) | **09:54:43** | **+4.732 s** | **09:54:03Z (98a7c93f)** | **40 s (lần 1)** |
| **Đợt 146** | **e24b5870** | **11:35:51** | **11:35:51Z (T7-146 thấy running ở kiểm lần 1 ~11:37Z, jitter 0 s) → 12:14:02Z (kiểm giữa ~12:14Z)** | **12:14:02** | **+2.291 s** | **12:13:26Z (6fb582df)** | **36 s (lần 1)** |

- Kiểm chứng số học đợt 146: 1795090442 − 1795090406 = 36 s ✓; 1795090442 − 1795088151 = 2.291 s ✓; jitter lúc đầu 1795088151 − 1795088151 = 0 s ✓.
- **Viết lại lần-1 của run 146 xảy ra GIỮA kiểm lần 1 (~11:37Z) và kiểm giữa (~12:14Z), tại reboot #34** — T7 tự thấy giá trị trước (11:35:51Z) và sau (12:14:02Z = btime 6fb582df + 36 s) trong cùng một đợt. Đây là lần thứ mười hai giả thuyết được quan sát trực tiếp cả hai phía.
- **KHÔNG có lần viết lại thứ hai cho run 146 tới kiểm cuối:** started_at mới ghi 12:14:02Z đứng yên qua lần 3 (~13:24Z) và kiểm cuối (~14:04Z); không có reboot thứ hai tới 14:04:xxZ.
- **Run 145 KHÔNG bị viết lại tại reboot #34** (started_at vẫn 1795082083 = 09:54:43Z qua cả 4 lần kiểm) — vì đã finished (succeeded) 11:30:29Z trước reboot. Run 144: started vẫn 1795075017 = 07:56:57Z, không đổi; đợt 143 (`b6c4b22d`): started vẫn 1795060580 = 03:56:20Z, không đổi; đợt 142 (`eddb1710`): started vẫn 1795053357 = 01:55:57Z, không đổi; đợt 141 (`85a2b391`): started vẫn 1795042119 = 22:48:39Z, không đổi.
- **Giả thuyết sau kiểm thứ 20:** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s (dải quan sát thực tế 31–50 s sau khi loại hai số sai-boot 936 s và 79 s). Các reboot sau khi run đã finished KHÔNG viết lại. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)** / **40 s (145-lần-1)** / **36 s (146-lần-1)** — 36 s nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- **Dữ kiện MỚI — run 145 KẾT THÚC SUCCEEDED, run 146 KHỞI ĐỘNG ĐÚNG GIỜ (mẫu quyết (m) đợt 145 KHÔNG tái diễn):** run 145 (`fcfdad2e`) finished 1795087829 = 11:30:29Z, status `succeeded`, error_text=null — thời lượng tường thật theo mốc ghi nay 09:54:43Z → 11:30:29Z = 5.746 s (1h35'46"); theo started_at ban đầu 08:38:58Z → 11:30:29Z = 9.871 s (2h44'31") — cả hai đều dưới ngân sách 10.800 s. Run 146 khởi động jitter 0 s (khác run 145 jitter +187 s). Theo quyết parent (m) đợt 145 ("chỉ ghi nhận là dữ kiện, không điều tra; nếu tái diễn ở đợt sau thì mở điều tra") — mẫu KHÔNG tái diễn ở đợt 146 nên **KHÔNG mở điều tra**. Ghi nhận: finished_at run 145 (11:30:29Z) KHÔNG trùng started_at run 146 (11:35:51Z) — khác mẫu trùng giây của đợt 144/145 (finished run 144 = started ban đầu run 145 = 1795077538); lần này scheduler không ghi timeout run trước đúng lúc khởi động run sau, vì run 145 kết thúc succeeded trước khi run 146 tới hạn 322 s.
- Hệ quả số liệu đợt 145 (chốt ở kiểm lần 1 đợt này): run 145 **SUCCEEDED** — T10-145 đóng sổ với run 145 "running" là đúng tại thời điểm đó (run chưa finished lúc 11:29:22Z); kết cục succeeded chỉ ngã ngũ lúc 11:30:29Z, trong cửa T7-146 — T10-146 lưu ý khi đóng sổ đợt 145/146 (không đổi số đếm đợt 145 — run 145 vẫn đếm là 1 run của đợt; chỉ đổi trạng thái kết cục từ "running lúc đóng" sang "succeeded").

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot #34: 98a7c93f → 6fb582df, btime 12:13:26Z — GIỮA lượt 146** (giữa kiểm lần 1 ~11:37Z và kiểm giữa ~12:14Z), lúc run vcut 146 đang chạy — ứng viên sự kiện tiếp theo sau #33 theo định nghĩa gộp T10-133 §10.2 (98a7c93f = #109? theo quyết chặt (g) đợt 145; 6fb582df = #110? TẠM theo đếm chặt; T10-146 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Boot 98a7c93f sống 09:54:03Z → 12:13:26Z = 7.963 s (2h13'23"). Cửa sổ reboot (T7 ước lượng từ sleep chết): tắt máy bắt đầu ~12:13:5xZ (sleep của T7 chết SIGTERM sau ~2.153 s kể từ ~11:38Z) → btime boot mới 12:13:26Z; T7 phát hiện boot mới lúc 12:14:09Z (chênh ~43 s gồm thời gian runtime khởi động lại phiên sau reboot — ghi rõ, không giấu).
- **Khoảng im lặng chứa reboot #34 (11:45:35Z, 12:14:02Z] (~28'27", 1.707 s):** hoạt động cuối trước khoảng: HB 11:50:50Z start 11:45:35Z; hoạt động đầu sau khoảng: started_at vcut 146 bị viết lại lần-1 12:14:02Z. Btime 12:13:26Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot #34 không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 146** tới kiểm cuối (boot_id vẫn 6fb582df, btime vẫn 12:13:26Z — 14:04Z; T7 đóng cờ ngay sau kiểm cuối nên không có thêm lần kiểm nào sau đó — ghi rõ giới hạn này).
- Lưu ý phương pháp: sleep chờ kiểm lần 2 của T7 bị SIGTERM đúng lúc tắt máy (sau ~2.153 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot giữa lượt chính nhờ lần kiểm giữa này (giống đợt 137–145).
- **Brief đợt 146 KHỚP btime đo được:** brief ghi "Boot lúc mở đợt: 98a7c93f (btime 09:54:03Z)" — khớp hoàn toàn boot_id + btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1). T2-146 boot-verify.txt khớp độc lập (verify 1 lúc 11:38:40Z + verify 2 — cùng boot_id + btime).
- Đối chiếu T2-146 (LIMITS, đã đọc lúc kiểm giữa ~12:14Z): T2 tự xác minh boot **98a7c93f-83d3-40e5-8043-ee6dda19c5f1, btime 1795082043 = 09:54:03Z** lúc 11:38:40Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới 6fb582df tới kiểm cuối (file vẫn chỉ ghi 98a7c93f lúc T2 đóng 11:52:40Z) — dù cờ `round146-t2.done` đã có; boot mới 6fb582df tới nay có xác minh độc lập của T7 (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime) — KHÔNG có đối chiếu qua boot-verify.txt. T2-147 / T10-146 đối chiếu lúc đóng (mẫu lặp lại từ đợt 142/143/144/145: T2 không bổ sung boot mới trước khi đóng).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 08:35:51 (đợt 145) | 15:35:51 | fcfdad2e | **`succeeded`, finished 11:30:29Z**, error_text=null; started_at 09:54:43Z = btime(98a7c93f) 09:54:03Z + 40 s — KHÔNG viết lại tại reboot #34 (đã finished) |
| 11:35:51 (đợt 146) | 18:35:51 | e24b5870 | `running` lúc kiểm cuối (~14:04Z), started_at 12:14:02Z — ĐÃ BỊ VIẾT LẠI 1 LẦN: 11:35:51Z → 12:14:02Z (btime 6fb582df 12:13:26Z + 36 s) tại reboot #34 — xem §2.4; started_at ban đầu 11:35:51Z = scheduled + 0 s (khởi động đúng giờ — dữ kiện mới, xem §2.4) |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 08:35:51 → 11:35:51Z, cách nhau đúng 3h; lượt tiếp theo 14:35:51Z 19/11.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **09:54:03Z** (`/proc/stat` 1795082043 + `uptime -s` + `who -b` 09:54 lúc 11:37Z, trùng nhau); boot_id **98a7c93f-83d3-40e5-8043-ee6dda19c5f1** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief đợt 146 + khớp độc lập file boot-verify của T2-146 về cả boot_id + btime).
- Boot hiện hành btime **12:13:26Z** (`/proc/stat` 1795090406 + `uptime -s` + `who -b` 12:13 lúc 12:14Z, 13:24Z và 14:04Z, trùng nhau); boot_id **6fb582df-455d-47cd-99dc-8bef48018536** tự xác minh từ `/proc/sys/kernel/random/boot_id` (chưa có đối chiếu độc lập — chỉ có T7 xác minh tới kiểm cuối).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~14:04Z): **7/9 cờ `.done` đã có** — `round146-t1.done`, `round146-t2.done`, `round146-t4.done`, `round146-t5.done`, `round146-t6.done`, `round146-t8.done`, `round146-t9.done`. Chưa có: t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

### 2.9 Đối chiếu với T2-146 (đọc LIMITS lúc kiểm giữa ~12:14Z)

- **Mù #65 ĐÓNG HOÀN TOÀN** (T2-146 — đoạn A đóng theo luật gap, merged gap max 599 s; đoạn B đóng bằng uptime trực tiếp — merged gap 1.295 s > sàn 1.147 s, CAVEAT LỚN) → **CERT 64 / FULL 79 GIỮ NGUYÊN tới khi parent quyết** (gap 7.067 s chứng nhận CÓ ĐIỀU KIỆN [7.057, 7.077] s → CERT 65 / FULL 80 nếu parent xác nhận uptime đóng được đoạn B; nếu không: gap vẫn SPAN, CERT/FULL giữ 64/79). Chuỗi mù đóng hoàn toàn lên 1 (sau khi về 0 ở #64) — chờ parent xác nhận.
- **Chuỗi INSIDE lên 5 (chính thức, đếm chặt — T2-146):** 98a7c93f INSIDE dải FULL79 #109? [08:23:45Z, 10:20:46Z] (btime thực 09:54:03Z) → 5. Dải #110? (FULL79, neo 09:54:03Z): [10:21:32Z, 12:18:33Z] (có điều kiện FULL80: [10:21:41Z, 12:18:23Z]).
- **Khung chết #108? ứng viên (09:44:04Z, 09:54:03Z] 599 s — RỘNG**, recheck 0 mốc mới; không thu hẹp khoảng im lặng (09:45:34Z, 09:54:43Z] 549 s của T7 (hai loại bằng chứng khác nhau) — chờ parent chốt làm chuẩn.
- **F107? ≈ 0 s** (chỉ 2 server — cloudflare 403 cả GET lẫn HEAD; F106? là +1/+1/+1) — chờ parent chấp nhận làm số đo F cho boot #109? hay ghi chưa đủ 3 server.
- **Mù #66 MỚI MỞ** (do reboot #34 xảy ra sau khi T2-146 đóng 11:52:40Z — T2-146 ghi rõ "KHÔNG có reboot mới trong phiên → không mở mù #66", nay đã lỗi thời vì reboot #34 xảy ra sau khi T2 đóng). Gap danh nghĩa 98a7c93f→6fb582df = 7.963 s chờ T2-147 chứng nhận; số boot 6fb582df = #110? TẠM theo đếm chặt.
- **Mâu thuẫn full boot_id b47f7932 — KHÔNG có dữ kiện mới:** T6-145 §8.8(d) vẫn ghi cả hai bản (T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`) — quyết parent (g) đợt 143: ĐỂ MỞ, ghi cả hai bản kèm nguồn, không chọn một. T2-146 không tìm thêm bằng chứng (không còn boot đó để đo lại). T7-146 cũng không tìm thêm bằng chứng — ghi nhận đúng quyết, không tự quyết bên nào đúng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–145.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h01' (11:03:00Z → 14:04:xxZ 19/11), đủ 6 slot HB + 3 slot DR. Bốn lần kiểm (lần 1, kiểm giữa sau reboot, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 11:20:50Z thuộc cửa 146 theo quy ước đứng — T7-147 bắt đầu cửa sau 14:04:xxZ, slot DR tiếp theo là 15:00Z, HB tiếp theo là 14:20:50Z.
6. **Kiểm giữa sớm hơn kế hoạch do reboot #34:** kế hoạch kiểm lần 2 ~12:30Z, nhưng reboot #34 giết sleep chờ kiểm lần 2 (chết SIGTERM sau ~2.153 s, ~12:13–12:14Z) nên kiểm giữa thực hiện ngay lúc phát hiện boot mới (~12:14Z); lần 3 dời tới ~13:24Z. Slot DR 13:00Z + HB 12:50:50Z vì thế vẫn nằm trong cửa T7-146 theo quy ước §3.5 — không phải thiếu sót kiểm. T7 đóng cờ ~14:06Z, cách hạn cờ ~14:15Z ~9', cách hạn cứng của T10 ~24' (theo quyết parent (m) đợt 142).

## 4. Cập nhật lũy kế (nối tiếp đợt 145, cùng phương pháp)

- Heartbeat: 44/261 → **44/267 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 20:50:50 +07). Kiểm toán cửa sổ: 261 + 6 slot mới = 267 ✓. Số thiếu +0.
- Deterministic-doctor: 49/202 → **49/205 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 21:00 +07). Kiểm toán: 202 + 3 = 205 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/267 = 16,5% (giảm từ 16,9% — 0 thiếu mới); DR 49/205 = 23,9% (giảm từ 24,3% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có 1 reboot giữa lượt + viết lại started_at 1 lần — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Giả thuyết viết lại started_at — kiểm thứ 20 GIỮ ĐÚNG (bằng chứng trực tiếp thứ mười hai):** run 146 viết lại 1 lần tại reboot #34 (offset 36 s) — trong dải ~30–50 s. Chuỗi offset boot đúng nay: ... 34 (141-2) / 37 (142-1) / 32 (142-2) / 35 (143-1) / 44 (144-1) / 41 (144-2) / 40 (145-1) / **36 (146-1)**. T7-147 kiểm tiếp run 146/147 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận kiểm thứ 20 vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s, trừ một lượt −315 s (F-146-T7-1 — lệch 1 s, không phải muộn lớn). Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
4. **1 reboot giữa lượt: #34 (98a7c93f → 6fb582df, btime 12:13:26Z)** — ứng viên sự kiện tiếp theo sau #33 theo định nghĩa gộp T10-133 §10.2 (T2-146 đã đóng trước reboot nên chưa gọi tên; giao T10-146 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối; boot 6fb582df = #110? TẠM theo đếm chặt). Reboot KHÔNG nuốt slot nào — khoảng im lặng chứa reboot #34 (11:45:35Z, 12:14:02Z] không chứa slot tới hạn nào; DR 13:00Z + HB 12:20:50Z chạy đúng giờ trên boot mới sau reboot. Gap danh nghĩa #34 = 7.963 s CHƯA chứng nhận — chờ T2-147 (mù #66).
5. **Run 145 KẾT THÚC SUCCEEDED (không phải timeout) + run 146 khởi động đúng giờ (jitter 0 s) — mẫu quyết (m) đợt 145 KHÔNG tái diễn, KHÔNG mở điều tra.** Run 145 finished 11:30:29Z (67 s sau cờ t10.done đợt 145); finished_at run 145 KHÔNG trùng started_at run 146 (cách nhau 322 s) — khác mẫu trùng giây đợt 144/145. T10-146 lưu ý khi đóng sổ: run 145 đổi trạng thái kết cục từ "running lúc đóng" sang "succeeded"; không đổi số đếm đợt 145.
6. **Boot 6fb582df tới nay CHỈ có xác minh của T7** (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime) — T2-146 đã đóng cờ 11:52:40Z trước reboot #34 nên không có đối chiếu độc lập (mẫu lặp lại từ đợt 142/143/144/145: T2 không bổ sung boot mới trước khi đóng). T2-147 / T10-146 đối chiếu lúc đóng. Tương tự, boot 6fb582df không có đối chiếu qua boot-verify.txt của T2 (chỉ có T7 ba nguồn).
7. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** Cả hai bản ghi rõ ở §2.9: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`. Không còn boot để đo lại; T7 không tự quyết bên nào đúng.
8. **Mù #66 mới mở (T2-147: probe #66 + chứng nhận gap #109?→#110? + khung chết #109? bằng merged mù #66 + số boot 6fb582df = #110? + dải #110?/#111? chuẩn).** CERT 64 / FULL 79 (T2-146, chờ parent xác nhận về gap 7.067 s có điều kiện → CERT 65 / FULL 80). Chuỗi INSIDE lên 5 (chính thức, T2-146) chờ parent xác nhận.
9. **Mù #65 ĐÓNG HOÀN TOÀN (T2-146) — việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-146-T7-1 — HB 11:50:50Z jitter −315 s, lệch 1 s so với mẫu chuẩn −316 s:** run `87672f92`, sched 1795089050 = 11:50:50Z, started 1795088735 = 11:45:35Z, chênh đúng 315 s (kiểm lại bằng `date -u` từ epoch thô; mọi slot HB khác trong cửa đều −316 s, gồm cả slot 11:20:50Z đợt này và 6 slot đợt 145). Chỉ là jitter lệch 1 s, KHÔNG phải slot thiếu hay muộn lớn — ghi nhận là dữ kiện, không suy đoán nguyên nhân (có thể là đồng hồ scheduler/VM lệch 1 s tại slot đó; không có bằng chứng phân biệt). Không ảnh hưởng verdict cửa lành.
- **F-146-T7-0 — Không có sai số nào khác trong đợt này:** 4 lần kiểm (lần 1, kiểm giữa sau reboot, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô (36 s = 1795090442 − 1795090406; jitter +2.291 s = 1795090442 − 1795088151; jitter ban đầu 0 s = 1795088151 − 1795088151; jitter HB −316 s và DR 0 s kiểm lại ở từng slot — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (98a7c93f lúc mở, 6fb582df từ kiểm giữa) và đối chiếu khớp T2 (nguồn độc lập) cho boot 98a7c93f (boot-verify.txt); brief đợt 146 khớp btime đo được; ở cả kiểm giữa/lần 3/kiểm cuối đã đọc lại boot_id SAU khi đọc started_at nên offset 36 s tính theo đúng boot hiện hành (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); boot mới 6fb582df chưa có đối chiếu độc lập (T2 đã đóng trước reboot #34) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này; phát hiện reboot #34 lúc 12:14:09Z, chênh btime 12:13:26Z ~43 s do runtime khởi động lại phiên sau reboot — ghi rõ ở §2.5, không giấu; kiểm giữa thực hiện sớm hơn kế hoạch do reboot giết sleep chờ — ghi rõ ở §3.6, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round146-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round146-t7/NOTES.md` (không nằm trong repo nên không stage).
