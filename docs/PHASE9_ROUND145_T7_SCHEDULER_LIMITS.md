# PHASE9 ROUND145 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 4/4) + 1 REBOOT GIỮA LƯỢT (#33) KHÔNG nuốt slot nào + run 145 VIẾT LẠI 1 LẦN, offset 40 s TRONG dải ~30–50 s (bằng chứng trực tiếp thứ mười một, kiểm thứ 19) + run 144 KẾT THÚC TIMEOUT (không phải succeeded)

- **Luồng:** T7 đợt 145 (lượt cron 15:35 +07 19/11/2026 = 08:35:51Z 19/11). Hai boot trong lúc làm việc: boot lúc mở **e146ca67-20a5-4452-9112-69155233ab99, btime 07:56:16Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 08:41Z, trùng nhau; khớp brief đợt 145 + khớp độc lập file boot-verify của T2-145), boot sau reboot giữa lượt **98a7c93f-83d3-40e5-8043-ee6dda19c5f1, btime 09:54:03Z** (ba nguồn trùng nhau lúc 09:55Z + lần 3 + kiểm cuối).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 07:57:09Z 19/11 (lúc T7 đợt 144 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS đợt 145 của T2/T6 để đối chiếu + cờ `.done` đợt 145 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 144 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 4/4.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 4 | 4 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 144 đã `timeout`, đợt 145 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 19 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ MƯỜI MỘT: lượt 145 ĐÃ BỊ VIẾT LẠI 1 LẦN trong đợt này, T7 tự quan sát được cả TRƯỚC và SAU (sau đợt 137, 138, 139, 140, 141, 142, 143 và 144).** Lượt vcut đợt 145 (run `fcfdad2e`) started_at ghi 08:38:58Z ở kiểm lần 1 + lần 2 (jitter +187 s — chạy muộn, xem §2.4), sau reboot #33 ghi **09:54:43Z = btime(98a7c93f) + 40 s**, jitter **+4.732 s**. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 19.** Chuỗi offset sau btime (chỉ tính theo boot đúng): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính — từng ghi sai 936 s)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)** / **40 s (145-lần-1)**.

- **Run 144 KẾT THÚC TIMEOUT (không phải succeeded):** run `b93ae161` finished 08:38:58Z với error "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." — xem §2.4/§2.6.
- Cập nhật lũy kế (cùng phương pháp đợt 125–144): heartbeat **44/261 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/202 slot thiếu** (số thiếu +0, mẫu số +4).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 07:57:09Z → 11:03:00Z 19/11

Cửa kiểm ~3h06'. Năm lần kiểm (lần 1 ~08:42Z, lần 2 ~09:32Z, kiểm giữa ~09:55Z sau reboot, lần 3 ~10:46Z, kiểm cuối ~11:03Z) **khớp hoàn toàn nhau ở mọi slot trùng** — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa hai lần kiểm do một reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:20:50 (08:20:50Z) | 73c81a95 | 08:15:34 | −316 s | CÓ |
| 15:50:50 (08:50:50Z) | f0c25dba | 08:45:34 | −316 s | CÓ |
| 16:20:50 (09:20:50Z) | 384bd6c4 | 09:15:34 | −316 s | CÓ |
| 16:50:50 (09:50:50Z) | 44ee498c | 09:45:34 | −316 s | CÓ |
| 17:20:50 (10:20:50Z) | 24c58b1e | 10:15:34 | −316 s | CÓ |
| 17:50:50 (10:50:50Z) | 359be506 | 10:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Mọi lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 09:50:50Z chạy TRÊN boot cũ e146ca67 TRƯỚC reboot #33 (start 09:45:34Z < btime mới 09:54:03Z); slot 10:20:50Z là slot đầu tiên sau reboot #33 — chạy đúng giờ (jitter chuẩn −316 s) trên boot mới 98a7c93f. Scheduler hồi phục sau reboot, không nuốt slot nào.

**Deterministic-doctor (lưới :00:00Z): 4/4 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:00 (08:00Z) | 260fd0ae | 08:00:00 | 0 s | CÓ |
| 16:00 (09:00Z) | 81442953 | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | 87869001 | 10:00:00 | 0 s | CÓ |
| 18:00 (11:00Z) | 09a9d46a | 11:00:00 | 0 s | CÓ |

- Cả 4 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 10:00Z là slot đầu tiên sau reboot #33 — chạy đúng giờ (0 s) trên boot mới 98a7c93f; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 08:20:50Z thuộc cửa 145 (sau mốc 07:57:09Z của T7-144), KHÔNG đếm lại ở đợt 144. Slot DR 12:00Z + HB 11:20:50Z chưa tới hạn lúc kiểm cuối (~11:03Z) nên thuộc cửa T7-146 — T7-146 bắt đầu cửa sau 11:03:00Z.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + lần 2 + kiểm giữa + lần 3 (+ kiểm cuối):

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ kiểm cuối chỉ xuống tới ~03:50:50Z 19/11) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + lần 2 + kiểm giữa + lần 3 (danh sách DR nhảy từ 06:00Z xuống 04:00Z 18/11 — 05:00Z 18/11 vắng); ở kiểm cuối ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 18:00Z 18/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–144 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 19, BẰNG CHỨNG TRỰC TIẾP THỨ MƯỜI MỘT

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
| Đợt 141 | 85a2b391 | 20:35:51 | 20:35:51Z (T7-141 thấy running ở kiểm lần 1 ~20:41Z và lần 2 ~21:35Z, jitter 0 s) → 21:52:53Z (kiểm giữa đợt 141) | **22:48:39** | **+7.968 s** | **22:48:05Z (bde599df — ĐÍNH CHÍNH đợt 142, xem dưới)** | **34 s (lần 2 — ĐÍNH CHÍNH, từng ghi sai 936 s)** |
| Đợt 142 | eddb1710 | 23:35:51 | 23:35:51Z (T7-142 thấy running ở kiểm lần 1 ~23:41Z, jitter 0 s) → 23:54:57Z (kiểm giữa + lần 2 + lần 3) | **01:55:57** | **+8.406 s** | **01:55:25Z (70a5b0fc)** | **32 s (lần 2)** |
| Đợt 143 | b6c4b22d | 02:35:51 | 02:35:51Z (T7-143 thấy running ở kiểm lần 1 ~02:43Z và lần 2 ~03:33Z, jitter 0 s) | **03:56:20** | **+4.829 s** | **03:55:45Z (691a7403)** | **35 s (lần 1)** |
| Đợt 144 | b93ae161 | 05:35:51 | 05:35:51Z (T7-144 thấy running ở kiểm lần 1 ~05:40Z, jitter 0 s) → 05:53:59Z (kiểm giữa #1 ~05:54Z) → 07:56:57Z (kiểm cuối ~07:57Z) | **07:56:57** | **+8.466 s** | **07:56:16Z (e146ca67)** | **41 s (lần 2)** |
| **Đợt 145** | **fcfdad2e** | **08:35:51** | **08:38:58Z (T7-145 thấy running ở kiểm lần 1 ~08:42Z và lần 2 ~09:32Z, jitter +187 s) → 09:54:43Z (kiểm giữa ~09:55Z)** | **09:54:43** | **+4.732 s** | **09:54:03Z (98a7c93f)** | **40 s (lần 1)** |

- Kiểm chứng số học đợt 145: 1795082083 − 1795082043 = 40 s ✓; 1795082083 − 1795077351 = 4.732 s ✓; jitter lúc đầu 1795077538 − 1795077351 = +187 s ✓.
- **Viết lại lần-1 của run 145 xảy ra GIỮA kiểm lần 2 (~09:32Z) và kiểm giữa (~09:55Z), tại reboot #33** — T7 tự thấy giá trị trước (08:38:58Z) và sau (09:54:43Z = btime 98a7c93f + 40 s) trong cùng một đợt. Đây là lần thứ mười một giả thuyết được quan sát trực tiếp cả hai phía.
- **KHÔNG có lần viết lại thứ hai cho run 145 tới kiểm cuối:** started_at mới ghi 09:54:43Z đứng yên qua lần 3 (~10:46Z) và kiểm cuối (~11:03Z); không có reboot thứ hai tới 11:03:00Z.
- **Run 144 KHÔNG bị viết lại lần 3** tại reboot #33 (started_at vẫn 1795075017 = 07:56:57Z qua cả 5 lần kiểm) — vì đã finished (timeout) 08:38:58Z trước reboot. Đợt 143 (`b6c4b22d`): started vẫn 1795060580 = 03:56:20Z, không đổi; đợt 142 (`eddb1710`): started vẫn 1795053357 = 01:55:57Z, không đổi; đợt 141 (`85a2b391`): started vẫn 1795042119 = 22:48:39Z, không đổi.
- **Giả thuyết sau kiểm thứ 19:** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s (dải quan sát thực tế 31–50 s sau khi loại hai số sai-boot 936 s và 79 s). Các reboot sau khi run đã finished KHÔNG viết lại. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)** / **40 s (145-lần-1)** — 40 s nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- **Dữ kiện MỚI — run 145 chạy muộn +187 s lúc khởi động (không phải viết lại):** started_at ban đầu 08:38:58Z = scheduled 08:35:51Z + 187 s — lần đầu tiên một run vcut không khởi động đúng giờ theo quan sát của T7 (các run 143/144 đều jitter 0 s lúc T7 thấy lần đầu). Trùng khớp đáng chú ý: finished_at của run 144 = started_at ban đầu của run 145 = **1795077538 (cùng một giây)** — scheduler ghi timeout run 144 đúng lúc khởi động run 145. Ghi nhận là dữ kiện, không suy đoán nguyên nhân (việc của T5/T6/T10). Sau khi bị viết lại tại reboot #33, jitter của run 145 thành +4.732 s — con số này là hệ quả của viết lại, không phải độ muộn thật.
- Hệ quả số liệu đợt 144 (chốt ở kiểm lần 1 đợt này): run 144 **TIMEOUT** — thời lượng tường thật 05:35:51Z → 08:38:58Z = 10.987 s (3h03'07"); theo mốc ghi nay (lần-2) 07:56:57Z → 08:38:58Z = 2.521 s (42'01"). T7-144 ghi run 144 "running" ở kiểm cuối là đúng tại thời điểm đó (run chưa finished lúc 07:57Z); kết cục timeout chỉ ngã ngũ lúc 08:38:58Z, trong cửa T7-145 — T10-145 lưu ý khi đóng sổ đợt 144/145 (verdict đợt 144 đã CHẤP NHẬN với run 144 được cho là đang chạy; nay đã rõ kết cục).

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot #33: e146ca67 → 98a7c93f, btime 09:54:03Z — GIỮA lượt 145** (giữa kiểm lần 2 ~09:32Z và kiểm giữa ~09:55Z), lúc run vcut 145 đang chạy — ứng viên sự kiện tiếp theo sau #32 theo định nghĩa gộp T10-133 §10.2 (e146ca67 = #108? theo quyết chặt (f) đợt 144; 98a7c93f = #109? TẠM theo quyết chặt; T10-145 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Boot e146ca67 sống 07:56:16Z → 09:54:03Z = 7.067 s (1h57'47"). Cửa sổ reboot (T7 ước lượng từ sleep chết): tắt máy bắt đầu ~09:54:4xZ (sleep của T7 chết SIGTERM sau ~1.303 s kể từ ~09:33Z) → btime boot mới 09:54:03Z; T7 phát hiện boot mới lúc 09:54:58Z (chênh ~55 s gồm thời gian runtime khởi động lại phiên sau reboot — ghi rõ, không giấu).
- **Khoảng im lặng chứa reboot #33 (09:45:34Z, 09:54:43Z] (~9'09", 549 s):** hoạt động cuối trước khoảng: HB 09:50:50Z start 09:45:34Z; hoạt động đầu sau khoảng: started_at vcut 145 bị viết lại lần-1 09:54:43Z. Btime 09:54:03Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot #33 không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 145** tới kiểm cuối (boot_id vẫn 98a7c93f, btime vẫn 09:54:03Z — 11:03Z; T7 đóng cờ ngay sau kiểm cuối nên không có thêm lần kiểm nào sau đó — ghi rõ giới hạn này).
- Lưu ý phương pháp: sleep chờ kiểm lần 3 của T7 bị SIGTERM đúng lúc tắt máy (sau ~1.303 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot giữa lượt chính nhờ lần kiểm giữa này (giống đợt 137–144).
- **Brief đợt 145 KHỚP btime đo được:** brief ghi "Boot lúc mở đợt: e146ca67 (btime 07:56:16Z)" — khớp hoàn toàn boot_id + btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1). T2-145 boot-verify.txt khớp độc lập (verify 1 lúc 08:36:16Z + verify 2).
- Đối chiếu T2-145 (LIMITS, đã đọc lúc kiểm giữa ~09:55Z): T2 tự xác minh boot **e146ca67-20a5-4452-9112-69155233ab99, btime 1795074976 = 07:56:16Z** lúc 08:36:16Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới 98a7c93f tới kiểm cuối (file vẫn chỉ ghi e146ca67) — dù cờ `round145-t2.done` đã có lúc kiểm giữa (~09:55Z); boot mới 98a7c93f tới nay có xác minh độc lập của T7 (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime) — KHÔNG có đối chiếu qua boot-verify.txt. T2-146 / T10-145 đối chiếu lúc đóng (mẫu lặp lại từ đợt 142/143/144: T2 không bổ sung boot mới trước khi đóng).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 05:35:51 (đợt 144) | 12:35:51 | b93ae161 | **`timeout`, finished 08:38:58Z**, error "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run."; started_at 07:56:57Z = btime(e146ca67) 07:56:16Z + 41 s — KHÔNG viết lại lần 3 tại reboot #33 (đã finished) |
| 08:35:51 (đợt 145) | 15:35:51 | fcfdad2e | `running` lúc kiểm cuối (~11:03Z), started_at 09:54:43Z — ĐÃ BỊ VIẾT LẠI 1 LẦN: 08:38:58Z → 09:54:43Z (btime 98a7c93f 09:54:03Z + 40 s) tại reboot #33 — xem §2.4; started_at ban đầu 08:38:58Z = scheduled + 187 s (chạy muộn — dữ kiện mới, xem §2.4) |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 5 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 05:35:51 → 08:35:51Z, cách nhau đúng 3h; lượt tiếp theo 11:35:51Z 19/11.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **07:56:16Z** (`/proc/stat` 1795074976 + `uptime -s` + `who -b` 07:56 lúc 08:41Z, trùng nhau); boot_id **e146ca67-20a5-4452-9112-69155233ab99** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief đợt 145 + khớp độc lập file boot-verify của T2-145 về cả boot_id + btime).
- Boot hiện hành btime **09:54:03Z** (`/proc/stat` 1795082043 + `uptime -s` + `who -b` 09:54 lúc 09:55Z, 10:46Z và 11:03Z, trùng nhau); boot_id **98a7c93f-83d3-40e5-8043-ee6dda19c5f1** tự xác minh từ `/proc/sys/kernel/random/boot_id` (chưa có đối chiếu độc lập — chỉ có T7 xác minh tới kiểm cuối).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~11:03Z): **6/9 cờ `.done` đã có** — `round145-t1.done`, `round145-t2.done`, `round145-t4.done`, `round145-t5.done`, `round145-t6.done`, `round145-t8.done`. Chưa có: t9 (đang làm — có file `headroom-measure-3-postreboot.log` trong thư mục round145-t9), t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

### 2.9 Đối chiếu với T2-145 / T6-145 (đọc LIMITS lúc kiểm giữa ~09:55Z)

- **Mù #64 KHÔNG ĐÓNG HOÀN TOÀN** (T2-145 — đoạn B mở, tối đa 2 ẩn; đoạn C đóng) → **CERT 64 / FULL 79 KHÔNG ĐỔI** (gap 7.050 s + 7.381 s VẪN LÀ SPAN). Chuỗi mù đóng hoàn toàn bắt đầu lại ở 1 (mù #63) vẫn đứng ở 1 — chưa tăng.
- **Chuỗi INSIDE lên 4 (chính thức, đếm chặt — T2-145):** cc222c8a INSIDE dải FULL79 #107? [04:23:14Z, 06:20:15Z] (chuỗi 3 — xác nhận chính thức kiểm hậu nghiệm đợt 144) + e146ca67 INSIDE dải FULL79 #108? [06:20:44Z, 08:17:45Z] (chuỗi 4). T6-145 (F-145-T6-1) chờ T2-145 xác nhận chính thức — nay T2-145 đã xác nhận.
- **Mù #65 MỚI MỞ** (do reboot #33 xảy ra sau khi T2-145 đóng 08:51:56Z — T2-145 ghi rõ "KHÔNG có reboot mới trong phiên → không mở mù #65"). Gap danh nghĩa e146ca67→98a7c93f = 7.067 s chờ T2-146 chứng nhận; số boot 98a7c93f = #109? + dải #109?/#110? chuẩn giao T2-146/T6-146.
- **Mâu thuẫn full boot_id b47f7932 — KHÔNG có dữ kiện mới:** T6-145 §8.8(d) vẫn ghi cả hai bản (T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`) — quyết parent (g) đợt 143: ĐỂ MỞ, ghi cả hai bản kèm nguồn, không chọn một. T2-145 không tìm thêm bằng chứng (không còn boot đó để đo lại). T7-145 cũng không tìm thêm bằng chứng — ghi nhận đúng quyết, không tự quyết bên nào đúng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×5 lần; DR limit=15 ×5 lần; vcut limit=5 ×5 lần). Lưới kỳ vọng như đợt 125–144.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h06' (07:57:09Z → 11:03:00Z 19/11), đủ 6 slot HB + 4 slot DR. Năm lần kiểm (lần 1, lần 2, kiểm giữa sau reboot, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 08:20:50Z thuộc cửa 145 theo quy ước đứng — T7-146 bắt đầu cửa sau 11:03:00Z, slot DR tiếp theo là 12:00Z, HB tiếp theo là 11:20:50Z.
6. **Kiểm giữa sớm hơn kế hoạch do reboot #33:** kế hoạch kiểm lần 3 ~10:23Z, nhưng reboot #33 giết sleep chờ kiểm lần 3 (chết SIGTERM sau ~1.303 s, ~09:54Z) nên kiểm giữa thực hiện ngay lúc phát hiện boot mới (~09:55Z); lần 3 dời tới ~10:46Z. Slot DR 11:00Z + HB 10:50:50Z vì thế vẫn nằm trong cửa T7-145 theo quy ước §3.5 — không phải thiếu sót kiểm. T7 đóng cờ ~11:05Z, cách hạn cờ ~11:15Z ~10', cách hạn cứng của T10 ~25' (theo quyết parent (m) đợt 142).

## 4. Cập nhật lũy kế (nối tiếp đợt 144, cùng phương pháp)

- Heartbeat: 44/255 → **44/261 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 17:50:50 +07). Kiểm toán cửa sổ: 255 + 6 slot mới = 261 ✓. Số thiếu +0.
- Deterministic-doctor: 49/198 → **49/202 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 18:00 +07). Kiểm toán: 198 + 4 = 202 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/261 = 16,9% (giảm từ 17,3% — 0 thiếu mới); DR 49/202 = 24,3% (giảm từ 24,7% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có 1 reboot giữa lượt + viết lại started_at 1 lần — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Giả thuyết viết lại started_at — kiểm thứ 19 GIỮ ĐÚNG (bằng chứng trực tiếp thứ mười một):** run 145 viết lại 1 lần tại reboot #33 (offset 40 s) — trong dải ~30–50 s. Chuỗi offset boot đúng nay: ... 34 (141-2) / 37 (142-1) / 32 (142-2) / 35 (143-1) / 44 (144-1) / 41 (144-2) / **40 (145-1)**. T7-146 kiểm tiếp run 145/146 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận kiểm thứ 19 vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
4. **1 reboot giữa lượt: #33 (e146ca67 → 98a7c93f, btime 09:54:03Z)** — ứng viên sự kiện tiếp theo sau #32 theo định nghĩa gộp T10-133 §10.2 (T2-145 đã đóng trước reboot nên chưa gọi tên; giao T10-145 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối; boot 98a7c93f = #109? TẠM theo đếm chặt). Reboot KHÔNG nuốt slot nào — khoảng im lặng chứa reboot #33 (09:45:34Z, 09:54:43Z] không chứa slot tới hạn nào; DR 10:00Z + HB 10:20:50Z chạy đúng giờ trên boot mới sau reboot. Gap danh nghĩa #33 = 7.067 s CHƯA chứng nhận — chờ T2-146 (mù #65).
5. **Run 144 KẾT THÚC TIMEOUT (không phải succeeded):** finished 08:38:58Z, error hết ngân sách 10.800 s. Verdict đợt 144 đã CHẤP NHẬN với run 144 được cho là đang chạy lúc đóng — nay kết cục đã rõ; T10-145 lưu ý khi đóng sổ (không đổi số đếm đợt 144 — run 144 vẫn đếm là 1 run của đợt; chỉ đổi trạng thái kết cục). Thời lượng tường thật 10.987 s (3h03'07") vượt ngân sách 10.800 s đúng 187 s — trùng đúng độ muộn khởi động của run 145 (+187 s) và cùng mốc giây 1795077538: scheduler ghi timeout run 144 đúng lúc khởi động run 145. Ghi nhận trùng khớp, không suy đoán cơ chế.
6. **Run 145 chạy muộn +187 s lúc khởi động — DỮ KIỆN MỚI:** lần đầu tiên T7 thấy một run vcut không khởi động đúng giờ (jitter +187 s thay vì 0 s). Chưa rõ có phải hệ quả của việc scheduler phải xử lý timeout run 144 trước hay không — giao T5/T6/T10 xem xét; không phải sai số của T7 (mốc ghi được thấy ở cả kiểm lần 1 và lần 2, trước reboot #33).
7. **Boot 98a7c93f tới nay CHỈ có xác minh của T7** (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime) — T2-145 đã đóng cờ 08:51:56Z trước reboot #33 nên không có đối chiếu độc lập (mẫu lặp lại từ đợt 142/143/144: T2 không bổ sung boot mới trước khi đóng). T2-146 / T10-145 đối chiếu lúc đóng. Tương tự, boot 98a7c93f không có đối chiếu qua boot-verify.txt của T2 (chỉ có T7 ba nguồn).
8. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** Cả hai bản ghi rõ ở §2.9: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`. Không còn boot để đo lại; T7 không tự quyết bên nào đúng.
9. **Mù #65 mới mở (T2-146: probe #65 + chứng nhận gap #108?→#109? + khung chết #108? bằng merged mù #65 + số boot 98a7c93f = #109? + dải #109?/#110? chuẩn).** CERT 64 / FULL 79 (T2-145) chờ parent xác nhận ở đợt 145. Chuỗi INSIDE lên 4 (chính thức, T2-145) chờ parent xác nhận.
10. **Mù #64 KHÔNG ĐÓNG HOÀN TOÀN (T2-145) — việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-145-T7-0 — KHÔNG có sai số nào trong đợt này:** 5 lần kiểm (lần 1, lần 2, kiểm giữa sau reboot, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô (40 s = 1795082083 − 1795082043; jitter +4.732 s = 1795082083 − 1795077351; jitter ban đầu +187 s = 1795077538 − 1795077351; jitter HB −316 s và DR 0 s kiểm lại ở từng slot — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (e146ca67 lúc mở, 98a7c93f từ kiểm giữa) và đối chiếu khớp T2 (nguồn độc lập) cho boot e146ca67 (boot-verify.txt); brief đợt 145 khớp btime đo được; ở cả kiểm giữa/lần 3/kiểm cuối đã đọc lại boot_id SAU khi đọc started_at nên offset 40 s tính theo đúng boot hiện hành (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); boot mới 98a7c93f chưa có đối chiếu độc lập (T2 đã đóng trước reboot #33) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này; phát hiện reboot #33 lúc 09:54:58Z, chênh btime 09:54:03Z ~55 s do runtime khởi động lại phiên sau reboot — ghi rõ ở §2.5, không giấu; kiểm giữa thực hiện sớm hơn kế hoạch do reboot giết sleep chờ — ghi rõ ở §3.6, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round145-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round145-t7/NOTES.md` (không nằm trong repo nên không stage).
