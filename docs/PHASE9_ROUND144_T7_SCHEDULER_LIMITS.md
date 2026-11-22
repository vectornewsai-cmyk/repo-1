# PHASE9 ROUND144 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 2/2) + 2 REBOOT GIỮA LƯỢT (#31, #32) KHÔNG nuốt slot nào + run 144 VIẾT LẠI 2 LẦN, offset 44 s + 41 s TRONG dải ~30–50 s (bằng chứng trực tiếp thứ chín + mười, kiểm thứ 17 + 18) + run 143 KHÔNG viết lại lần 2 (đã finished)

- **Luồng:** T7 đợt 144 (lượt cron 12:35 +07 19/11/2026 = 05:35:51Z 19/11). Ba boot trong lúc làm việc: boot lúc mở **691a7403-512b-4055-bb55-de0d7516eeeb, btime 03:55:45Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 05:39Z, trùng nhau; khớp brief/flag đợt 144), boot sau reboot giữa lượt thứ nhất **cc222c8a-d8e2-4244-bcbc-1997b4099864, btime 05:53:15Z** (ba nguồn trùng nhau lúc 05:54Z + lần 3), và boot sau reboot giữa lượt thứ hai **e146ca67-20a5-4452-9112-69155233ab99, btime 07:56:16Z** (ba nguồn trùng nhau lúc 07:57Z, kiểm cuối).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 05:02:52Z 19/11 (lúc T7 đợt 143 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS đợt 144 của T2/T6 để đối chiếu + cờ `.done` đợt 144 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 143 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 2/2.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 2 | 2 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 143 đã `succeeded`, đợt 144 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 17 + 18 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ CHÍN + MƯỜI: lượt 144 ĐÃ BỊ VIẾT LẠI 2 LẦN trong cùng một đợt, T7 tự quan sát được cả TRƯỚC và SAU ở cả hai lần (sau đợt 137, 138, 139, 140, 141, 142 và 143).** Lượt vcut đợt 144 (run `b93ae161`) started_at ghi 05:35:51Z ở kiểm lần 1 (jitter 0 s), sau reboot #31 ghi **05:53:59Z = btime(cc222c8a) + 44 s**, jitter **+1.088 s**; sau reboot #32 ghi **07:56:57Z = btime(e146ca67) + 41 s**, jitter **+8.466 s**. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 17 và 18.** Chuỗi offset sau btime (chỉ tính theo boot đúng): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính — từng ghi sai 936 s)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–143): heartbeat **44/255 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/198 slot thiếu** (số thiếu +0, mẫu số +2).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 05:02:52Z → 07:57:09Z 19/11

Cửa kiểm ~2h54'. Bốn lần kiểm (lần 1 ~05:40Z, kiểm giữa #1 ~05:54Z, lần 3 ~06:45Z, kiểm cuối ~07:57Z) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm do hai reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:20:50 (05:20:50Z) | e73256c1 | 05:15:34 | −316 s | CÓ |
| 12:50:50 (05:50:50Z) | b2c34afe | 05:45:34 | −316 s | CÓ |
| 13:20:50 (06:20:50Z) | 632904b9 | 06:15:34 | −316 s | CÓ |
| 13:50:50 (06:50:50Z) | 15ffd498 | 06:45:34 | −316 s | CÓ |
| 14:20:50 (07:20:50Z) | 4c2fa8c0 | 07:15:34 | −316 s | CÓ |
| 14:50:50 (07:50:50Z) | 0465ae05 | 07:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Mọi lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 05:50:50Z chạy TRÊN boot cũ 691a7403 TRƯỚC reboot #31 (start 05:45:34Z < btime mới 05:53:15Z); slot 06:20:50Z là slot đầu tiên sau reboot #31 — chạy đúng giờ (jitter chuẩn −316 s) trên boot mới cc222c8a. Slot 07:50:50Z chạy TRÊN boot cc222c8a TRƯỚC reboot #32 (start 07:45:34Z < btime mới 07:56:16Z); scheduler hồi phục sau cả hai reboot, không nuốt slot nào.

**Deterministic-doctor (lưới :00:00Z): 2/2 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 13:00 (06:00Z) | 29552dd4 | 06:00:00 | 0 s | CÓ |
| 14:00 (07:00Z) | 80d9a6ea | 07:00:00 | 0 s | CÓ |

- Cả 2 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 06:00Z là slot đầu tiên sau reboot #31 — chạy đúng giờ (0 s) trên boot mới cc222c8a; slot 07:00Z chạy đúng giờ trên cùng boot trước reboot #32; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 05:20:50Z thuộc cửa 144 (sau mốc 05:02:52Z của T7-143), KHÔNG đếm lại ở đợt 143. Slot DR 08:00Z + HB 08:20:50Z chưa tới hạn lúc kiểm cuối (~07:57Z) nên thuộc cửa T7-145 — T7-145 bắt đầu cửa sau 07:57:09Z.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + kiểm giữa #1 + lần 3 (+ kiểm cuối):

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ kiểm cuối chỉ xuống tới 00:50:50Z 19/11) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + kiểm giữa #1 + lần 3 (danh sách DR nhảy từ 06:00Z xuống 04:00Z 18/11 — 05:00Z 18/11 vắng); ở kiểm cuối ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 17:00Z 18/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–143 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 17 + 18, BẰNG CHỨNG TRỰC TIẾP THỨ CHÍN + MƯỜI

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
| **Đợt 144** | **b93ae161** | **05:35:51** | **05:35:51Z (T7-144 thấy running ở kiểm lần 1 ~05:40Z, jitter 0 s) → 05:53:59Z (kiểm giữa #1 ~05:54Z) → 07:56:57Z (kiểm cuối ~07:57Z)** | **07:56:57** | **+8.466 s** | **07:56:16Z (e146ca67)** | **41 s (lần 2)** |

- Kiểm chứng số học đợt 144 lần-1: 1795067639 − 1795067595 = 44 s ✓; 1795067639 − 1795066551 = 1.088 s ✓.
- Kiểm chứng số học đợt 144 lần-2: 1795075017 − 1795074976 = 41 s ✓; 1795075017 − 1795066551 = 8.466 s ✓.
- Kiểm chứng số học đợt 143 (run đã finished): started_at đứng yên ở 1795060580 = 03:56:20Z qua cả 4 lần kiểm đợt 144 — KHÔNG viết lại lần 2 (không có reboot mới sau khi run đã finished 05:35:02Z; hai reboot đợt 144 đều xảy ra sau thời điểm này — reboot #31 lúc 05:53:15Z và #32 lúc 07:56:16Z).
- **Viết lại lần-1 của run 144 xảy ra GIỮA kiểm lần 1 (~05:40Z) và kiểm giữa #1 (~05:54Z), tại reboot #31** — T7 tự thấy giá trị trước (05:35:51Z) và sau (05:53:59Z = btime cc222c8a + 44 s) trong cùng một đợt. Đây là lần thứ chín giả thuyết được quan sát trực tiếp cả hai phía.
- **Viết lại lần-2 của run 144 xảy ra GIỮA lần 3 (~06:45Z) và kiểm cuối (~07:57Z), tại reboot #32** — T7 tự thấy giá trị trước (05:53:59Z) và sau (07:56:57Z = btime e146ca67 + 41 s) trong cùng một đợt. Đây là lần thứ mười giả thuyết được quan sát trực tiếp cả hai phía — và là lần đầu tiên kể từ đợt 142 một run bị viết lại 2 lần mà T7 quan sát được cả hai lần viết lại trong cùng một đợt (đợt 138/140/141/142 cũng có 2 lần viết lại; đợt 144 nối tiếp mẫu đó).
- **KHÔNG có lần viết lại thứ ba cho run 144 tới kiểm cuối:** started_at mới ghi 07:56:57Z là giá trị tại kiểm cuối; không có reboot thứ ba tới 07:57:09Z.
- **Run 143 KHÔNG bị viết lại lần 2** tại cả hai reboot đợt 144 (started_at vẫn 03:56:20Z qua cả 4 lần kiểm) — vì đã finished 05:35:02Z trước cả hai reboot. Đợt 142 (`eddb1710`): started vẫn 1795053357 = 01:55:57Z, không đổi; đợt 141 (`85a2b391`): started vẫn 1795042119 = 22:48:39Z, không đổi; đợt 140 (`1e775062`): started vẫn 1795031683 = 19:54:43Z, không đổi.
- **Giả thuyết sau kiểm thứ 18:** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s (dải quan sát thực tế 31–50 s sau khi loại hai số sai-boot 936 s và 79 s). Các reboot sau khi run đã finished KHÔNG viết lại. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** / **44 s (144-lần-1)** / **41 s (144-lần-2)** — 44 s và 41 s đều nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 144 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay (lần-2) là 07:56:57Z → finished (chưa có lúc T7 kiểm cuối, run vẫn `running`); thời lượng tường thật là 05:35:51Z → finished. Hệ quả số liệu đợt 143 (chốt ở kiểm lần 1 đợt này): thời lượng tường thật 02:35:51Z → 05:35:02Z = 10.751 s (2h59'11"); theo mốc ghi nay (lần-1) 03:56:20Z → 05:35:02Z = 5.922 s (1h38'42").

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot #31: 691a7403 → cc222c8a, btime 05:53:15Z — GIỮA lượt 144** (giữa kiểm lần 1 ~05:40Z và kiểm giữa #1 ~05:54Z), lúc run vcut 144 đang chạy — ứng viên sự kiện tiếp theo sau #30 theo định nghĩa gộp T10-133 §10.2 (691a7403 = #106? theo quyết chặt (c) đợt 143; T2-144 đã gọi reboot này là #31 trong LIMITS của nó, chờ parent xác nhận; T10-144 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Boot 691a7403 sống 03:55:45Z → 05:53:15Z = 7.050 s (1h57'30"). Cửa sổ reboot (T7 ước lượng từ sleep chết): tắt máy bắt đầu ~05:53:15–05:53:27Z (sleep của T7 chết SIGTERM sau 835 s kể từ ~05:39:40Z) → btime boot mới 05:53:15Z. T2-144 xác nhận độc lập reboot này (phát hiện 05:56:55Z; xem §2.8).
- **Khoảng im lặng chứa reboot #31 (05:45:34Z, 05:53:59Z] (~8'25", 505 s):** hoạt động cuối trước khoảng: HB 05:50:50Z start 05:45:34Z; hoạt động đầu sau khoảng: started_at vcut 144 bị viết lại lần-1 05:53:59Z. Btime 05:53:15Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot #31 không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Reboot #32: cc222c8a → e146ca67, btime 07:56:16Z — GIỮA lượt 144** (giữa lần 3 ~06:45Z và kiểm cuối ~07:57Z), lúc run vcut 144 đang chạy — ứng viên sự kiện tiếp theo sau #31 theo cùng định nghĩa (cc222c8a = #107? TẠM theo quyết chặt (c) đợt 143; T10-144 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Boot cc222c8a sống 05:53:15Z → 07:56:16Z = 7.381 s (2h03'01"). Cửa sổ reboot (T7 ước lượng từ sleep chết): sleep chờ kiểm cuối (4.500 s, bắt đầu ~06:47Z) chết SIGTERM sau 4.238 s (~07:57Z) → btime boot mới 07:56:16Z; T7 phát hiện boot mới lúc 07:57:09Z (chênh ~53 s gồm thời gian runtime khởi động lại phiên sau reboot — ghi rõ, không giấu).
- **Khoảng im lặng chứa reboot #32 (07:45:34Z, 07:56:57Z] (~11'23", 683 s):** hoạt động cuối trước khoảng: HB 07:50:50Z start 07:45:34Z; hoạt động đầu sau khoảng: started_at vcut 144 bị viết lại lần-2 07:56:57Z. Btime 07:56:16Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot #32 không nuốt slot nào.
- **Không có reboot thứ ba giữa lượt 144** tới kiểm cuối (boot_id vẫn e146ca67, btime vẫn 07:56:16Z — 07:57Z; T7 đóng cờ ngay sau kiểm cuối nên không có thêm lần kiểm nào sau đó — ghi rõ giới hạn này).
- Lưu ý phương pháp: cả hai sleep chờ kiểm của T7 đều bị SIGTERM đúng lúc tắt máy (lần 1 sau 835 s, lần 2 sau 4.238 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện cả hai reboot giữa lượt chính nhờ hai lần kiểm giữa/kiểm cuối này (giống đợt 137–143).
- **Brief/flag đợt 144 KHỚP btime đo được:** `round-in-progress.md` ghi "Mở: 05:35:51Z 19/11/2026, boot 691a7403, hạn cứng 08:30Z" — khớp hoàn toàn boot_id + btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1).
- Đối chiếu T2-144 (file `round144-t2/boot-verify.txt` + LIMITS, đã đọc lúc lần 3 ~06:46Z): T2 tự xác minh boot **691a7403-512b-4055-bb55-de0d7516eeeb, btime 1795060545 = 03:55:45Z** lúc 05:43:42Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới cc222c8a tới kiểm cuối (file vẫn chỉ ghi 691a7403, last entry 05:43:42Z) — dù cờ `round144-t2.done` đã có lúc lần 3 (~06:45Z); boot mới cc222c8a tới nay có xác minh độc lập của T7 (ba nguồn, kiểm giữa #1 + lần 3 đều trùng btime) + T2 LIMITS §2.11 (boot_id + btime + journal, phát hiện 05:56:55Z) — KHÔNG có đối chiếu qua boot-verify.txt. Boot e146ca67 tới nay CHỈ có xác minh của T7 (ba nguồn, một lần kiểm lúc ~07:57Z) — T2-144 đã đóng cờ 06:02Z trước reboot #32 nên không có đối chiếu độc lập; T2-145 / T10-144 đối chiếu lúc đóng (mẫu lặp lại từ đợt 142/143: T2 không bổ sung boot mới trước khi đóng).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 02:35:51 (đợt 143) | 09:35:51 | b6c4b22d | `succeeded`, finished 05:35:02Z; started_at 03:56:20Z = btime(691a7403) 03:55:45Z + 35 s — KHÔNG viết lại lần 2 tại cả hai reboot đợt 144 (đã finished) |
| 05:35:51 (đợt 144) | 12:35:51 | b93ae161 | `running` lúc kiểm cuối (~07:57Z), started_at 07:56:57Z — ĐÃ BỊ VIẾT LẠI 2 LẦN: 05:35:51Z → 05:53:59Z (btime cc222c8a 05:53:15Z + 44 s) tại reboot #31 → 07:56:57Z (btime e146ca67 07:56:16Z + 41 s) tại reboot #32 — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 02:35:51 → 05:35:51Z, cách nhau đúng 3h; lượt tiếp theo 08:35:51Z 19/11.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **03:55:45Z** (`/proc/stat` 1795060545 + `uptime -s` + `who -b` 03:55 lúc 05:39Z, trùng nhau); boot_id **691a7403-512b-4055-bb55-de0d7516eeeb** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief/flag đợt 144 + khớp độc lập file boot-verify của T2-144 về cả boot_id + btime).
- Boot sau reboot #31 btime **05:53:15Z** (`/proc/stat` 1795067595 + `uptime -s` + `who -b` 05:53 lúc 05:54Z và 06:44Z, trùng nhau); boot_id **cc222c8a-d8e2-4244-bcbc-1997b4099864** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp độc lập T2-144 LIMITS §2.11 về cả boot_id + btime; T2 chưa cập nhật boot-verify.txt với boot này tới kiểm cuối).
- Boot hiện hành btime **07:56:16Z** (`/proc/stat` 1795074976 + `uptime -s` + `who -b` 07:56 lúc 07:57Z, trùng nhau); boot_id **e146ca67-20a5-4452-9112-69155233ab99** tự xác minh từ `/proc/sys/kernel/random/boot_id` (chưa có đối chiếu độc lập — chỉ có T7 xác minh tới kiểm cuối).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, kiểm giữa #1, lần 3 và kiểm cuối) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~07:58Z): **6/9 cờ `.done` đã có** — `round144-t1.done`, `round144-t2.done`, `round144-t4.done`, `round144-t5.done`, `round144-t6.done`, `round144-t8.done`. Chưa có: t9, t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

### 2.9 Đối chiếu với T2-144 / T6-144 (đọc LIMITS lúc lần 3 ~06:46Z)

- **Reboot #31 — T2 xác minh độc lập, KHỚP T7:** T2-144 LIMITS §2.11: 691a7403 → cc222c8a-d8e2-4244-bcbc-1997b4099864, btime 05:53:15Z, phát hiện 05:56:55Z; journal 1 boot, entry đầu 05:53:31Z = btime +16 s. Gap danh nghĩa 7.050 s (1h57'30") CHƯA chứng nhận — chờ T2-145 (mù #64).
- **Mù #63 ĐÓNG HOÀN TOÀN** (T2-144 — mù đầu tiên đóng hoàn toàn kể từ #60; chuỗi mù đóng hoàn toàn #61/#62 đứt, nay bắt đầu lại ở 1). Gap 70a5b0fc→691a7403 chứng nhận [7.210, 7.230] s, giữa 7.220 s → **CERT 64 / FULL 79** (đếm chặt — chuẩn parent từ đợt 144; chờ parent xác nhận ở đợt 144). Gap 42 s (b47f7932→9afdaa89) và gap 7.265 s (9afdaa89→70a5b0fc) VẪN LÀ SPAN.
- **cc222c8a INSIDE dải (kiểm hậu nghiệm):** T2-144 FULL79 #107? [04:23:14Z, 06:20:15Z] — btime 05:53:15Z INSIDE; T6-144 dải #107? chuẩn (FULL78) [04:23:05Z, 06:20:25Z] (p10=1.640 s) / [04:23:06Z, 06:20:25Z] (p10=1.641 s) — btime 05:53:15Z INSIDE cả hai biến thể.
- **Đính chính chuỗi INSIDE 4 → 2 (F-144-T2-8; T6-144 F-144-T6-1 xác nhận độc lập):** chuỗi 4 công bố ở T2-143 / LIMITS gộp đợt 143 §2 neo dải 9afdaa89 tại bde599df (nhãn (d) cũ — bỏ qua boot trung gian b47f7932). Theo đếm chặt (chuẩn parent từ đợt 144), dải mỗi boot neo tại boot tiền nhiệm trực tiếp: 9afdaa89 neo b47f7932 23:53:38Z → FULL77 [00:20:49Z, 02:18:27Z], btime 23:54:20Z OUTSIDE (gap 42 s < cận dưới p10 1.632 s). Chuỗi đúng: b47f7932 INSIDE (1) → 9afdaa89 OUTSIDE (đứt, về 0) → 70a5b0fc INSIDE (1) → 691a7403 INSIDE (2) → cc222c8a INSIDE hậu nghiệm (3). T2-144 dùng chuỗi 2 làm số làm việc; aggregate đợt 143 §2 và MEMORY.md vẫn ghi chuỗi 4 theo cách tính cũ — parent hòa giải ở T2-144 §4.5(6). T7 ghi nhận đính chính này, không tự tính lại dải (việc của T2/T6).
- **Mâu thuẫn full boot_id b47f7932 — KHÔNG có dữ kiện mới:** T6-144 §8.8(d) ghi rõ cả hai bản: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c` (F-143-T6-1) — quyết parent (g) đợt 143: ĐỂ MỞ, ghi cả hai bản kèm nguồn, không chọn một. T2-144 không tìm thêm bằng chứng (không còn boot đó để đo lại). T7-144 cũng không tìm thêm bằng chứng — ghi nhận đúng quyết, không tự quyết bên nào đúng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Lưới kỳ vọng như đợt 125–143.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h54' (05:02:52Z → 07:57:09Z 19/11), đủ 6 slot HB + 2 slot DR. Bốn lần kiểm (lần 1, kiểm giữa #1, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng (hai lần kiểm giữa/kiểm cuối phát sinh do hai reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 05:20:50Z thuộc cửa 144 theo quy ước đứng — T7-145 bắt đầu cửa sau 07:57:09Z, slot DR tiếp theo là 08:00Z, HB tiếp theo là 08:20:50Z.
6. **Kiểm cuối sớm hơn kế hoạch ~6 phút:** kế hoạch kiểm cuối ~08:03Z, nhưng reboot #32 giết sleep chờ kiểm cuối (chết SIGTERM sau 4.238 s, ~07:57Z) nên kiểm cuối thực hiện ngay lúc phát hiện boot mới (~07:57Z). Slot DR 08:00Z + HB 08:20:50Z vì thế thuộc cửa T7-145 theo quy ước §3.5 — không phải thiếu sót kiểm. T7 đóng cờ ~08:00Z, cách hạn cứng 08:30Z ~30', cách hạn cờ 08:15Z ~15'.

## 4. Cập nhật lũy kế (nối tiếp đợt 143, cùng phương pháp)

- Heartbeat: 44/249 → **44/255 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 14:50:50 +07). Kiểm toán cửa sổ: 249 + 6 slot mới = 255 ✓. Số thiếu +0.
- Deterministic-doctor: 49/196 → **49/198 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 14:00 +07). Kiểm toán: 196 + 2 = 198 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/255 = 17,3% (giảm từ 17,7% — 0 thiếu mới); DR 49/198 = 24,7% (giảm từ 25,0% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có 2 reboot giữa lượt + viết lại started_at 2 lần — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Giả thuyết viết lại started_at — kiểm thứ 17 + 18 GIỮ ĐÚNG (bằng chứng trực tiếp thứ chín + mười):** run 144 viết lại 2 lần tại reboot #31 (offset 44 s) và reboot #32 (offset 41 s) — cả hai trong dải ~30–50 s. Chuỗi offset boot đúng nay: ... 34 (141-2) / 37 (142-1) / 32 (142-2) / 35 (143-1) / **44 (144-1)** / **41 (144-2)**. T7-145 kiểm tiếp run 144/145 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận kiểm thứ 17 + 18 vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
4. **2 reboot giữa lượt: #31 (691a7403 → cc222c8a, btime 05:53:15Z) + #32 (cc222c8a → e146ca67, btime 07:56:16Z)** — ứng viên sự kiện tiếp theo sau #30 theo định nghĩa gộp T10-133 §10.2 (T2-144 đã gọi #31 là sự kiện trong LIMITS của nó, chờ parent xác nhận; #32 giao T10-144 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cả hai reboot KHÔNG nuốt slot nào — khoảng im lặng chứa reboot #31 (05:45:34Z, 05:53:59Z] và #32 (07:45:34Z, 07:56:57Z] đều không chứa slot tới hạn nào; DR 06:00Z + HB 06:20:50Z chạy đúng giờ trên boot mới sau reboot #31. Gap danh nghĩa #31 = 7.050 s và #32 = 7.381 s đều CHƯA chứng nhận — chờ T2-145 (mù #64).
5. **Boot e146ca67 tới nay CHỈ có xác minh của T7** (ba nguồn, một lần kiểm lúc ~07:57Z) — T2-144 đã đóng cờ 06:02Z trước reboot #32 nên không có đối chiếu độc lập (mẫu lặp lại từ đợt 142/143: T2 không bổ sung boot mới trước khi đóng). T2-145 / T10-144 đối chiếu lúc đóng. Tương tự, boot cc222c8a không có đối chiếu qua boot-verify.txt của T2 (chỉ có T2 LIMITS §2.11 + T7 ba nguồn).
6. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** Cả hai bản ghi rõ ở §2.9: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`. Không còn boot để đo lại; T7 không tự quyết bên nào đúng.
7. **Chuỗi INSIDE 4 → 2 (F-144-T2-8):** T2-144/T6-144 đính chính chuỗi công bố đợt 143 — T7 ghi nhận, không tự tính lại (việc của T2/T6); parent hòa giải ở T2-144 §4.5(6). Số làm việc hiện tại: chuỗi 2 (không tính cc222c8a), 3 nếu tính cc222c8a hậu nghiệm INSIDE.
8. **Mù #64 mới mở (T2-145: probe #64 + chứng nhận gap #106?→#107? / #107?→#108? + khung chết #106?/#107? bằng merged mù #64 + số boot e146ca67 = #108? + dải #108?/#109? chuẩn).** CERT 64 / FULL 79 (T2-144) chờ parent xác nhận ở đợt 144.
9. **Mù #63 ĐÓNG HOÀN TOÀN (T2-144) — việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-144-T7-0 — KHÔNG có sai số nào trong đợt này:** 4 lần kiểm (lần 1, kiểm giữa #1, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô (44 s = 1795067639 − 1795067595; 41 s = 1795075017 − 1795074976; jitter +1.088 s = 1795067639 − 1795066551; jitter +8.466 s = 1795075017 − 1795066551 — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 3 boot trong lượt (691a7403 lúc mở, cc222c8a từ kiểm giữa #1, e146ca67 lúc kiểm cuối) và đối chiếu khớp T2 (nguồn độc lập) cho boot 691a7403 (boot-verify.txt) và boot cc222c8a (T2 LIMITS §2.11); brief/flag đợt 144 khớp btime đo được; ở cả hai lần kiểm giữa/kiểm cuối đã đọc lại boot_id SAU khi đọc started_at nên offset 44 s và 41 s tính theo đúng boot hiện hành (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); boot mới e146ca67 chưa có đối chiếu độc lập (T2 đã đóng trước reboot #32) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này; kiểm cuối thực hiện sớm ~6 phút so với kế hoạch do reboot #32 giết sleep chờ — ghi rõ ở §3.6, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round144-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round144-t7/NOTES.md` (không nằm trong repo nên không stage).
