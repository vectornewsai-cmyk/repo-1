# PHASE9 ROUND143 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 5/5 + DR 3/3) + 1 REBOOT GIỮA LƯỢT (70a5b0fc → 691a7403) KHÔNG nuốt slot nào + run 143 VIẾT LẠI 1 LẦN, offset 35 s TRONG dải ~30–50 s (bằng chứng trực tiếp thứ tám, kiểm thứ 16) + run 142 KHÔNG viết lại lần 3 (đã finished)

- **Luồng:** T7 đợt 143 (lượt cron 09:35 +07 19/11/2026 = 02:35:51Z 19/11). Hai boot trong lúc làm việc: boot lúc mở **70a5b0fc-6aae-4261-a3fe-11226162b5a3, btime 01:55:25Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 02:40Z, trùng nhau; khớp brief/flag đợt 143 + khớp độc lập file boot-verify của T2-143, entry 02:48:41Z — lần này KHÔNG có sai lệch btime như đợt 139), và boot mới sau reboot giữa lượt **691a7403-512b-4055-bb55-de0d7516eeeb, btime 03:55:45Z** (ba nguồn trùng nhau lúc 03:56Z + lần 3 + kiểm cuối).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 02:25:06Z 19/11 (lúc T7 đợt 142 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 142 + cờ `.done` đợt 143 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 142 lành; đợt này lành tiếp): heartbeat 5/5, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 5 | 5 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 142 đã `succeeded`, đợt 143 đang `running`) | — | 0 | — |

**Dị thường started_at — kiểm thứ 16 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ TÁM: lượt 143 ĐÃ BỊ VIẾT LẠI 1 LẦN, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (sau đợt 137, 138, 139, 140, 141 và 142).** Lượt vcut đợt 143 (run `b6c4b22d`) started_at ghi 02:35:51Z ở kiểm lần 1 + lần 2 (jitter 0 s), sau reboot giữa lượt ghi **03:56:20Z = btime(691a7403) + 35 s**, jitter **+4.829 s**; KHÔNG bị viết lại lần 2 (không có reboot thứ hai tới kiểm cuối, 05:03Z). **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 16.** Chuỗi offset sau btime (chỉ tính theo boot đúng): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính — từng ghi sai 936 s)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–142): heartbeat **44/249 slot thiếu** (số thiếu +0, mẫu số +5); deterministic-doctor **49/196 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 02:25:06Z → 05:02:52Z 19/11

Cửa kiểm ~2h38'. Ba lần kiểm chính (lần 1 ~02:43Z, lần 2 ~03:33Z, lần 3 ~04:27Z) + 1 kiểm giữa (~03:56Z sau reboot) + kiểm cuối (~05:03Z) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa hai lần kiểm do reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 5/5 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:50:50 (02:50:50Z) | 114c5cc4 | 02:45:34 | −316 s | CÓ |
| 10:20:50 (03:20:50Z) | 738cfbe0 | 03:15:34 | −316 s | CÓ |
| 10:50:50 (03:50:50Z) | fb5712cb | 03:45:34 | −316 s | CÓ |
| 11:20:50 (04:20:50Z) | 557c329c | 04:15:34 | −316 s | CÓ |
| 11:50:50 (04:50:50Z) | 51f3fea9 | 04:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Mọi lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 03:50:50Z chạy TRÊN boot cũ 70a5b0fc TRƯỚC reboot giữa lượt (start 03:45:34Z < tắt máy ~03:55:45Z); slot 04:20:50Z là slot đầu tiên sau reboot — chạy đúng giờ (jitter chuẩn −316 s) trên boot mới 691a7403; scheduler hồi phục sau reboot, không nuốt slot nào.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:00 (03:00Z) | fbc16f3c | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | 347010cc | 04:00:00 | 0 s | CÓ |
| 12:00 (05:00Z) | 6bde0724 | 05:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 04:00Z là slot đầu tiên tới hạn sau reboot giữa lượt — chạy đúng giờ (0 s) trên boot mới 691a7403; reboot không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 02:50:50Z thuộc cửa 143 (sau mốc 02:25:06Z của T7-142), KHÔNG đếm lại ở đợt 142. Slot HB tiếp theo sau cửa này là 05:20:50Z, DR tiếp theo là 06:00Z (thuộc T7-144).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + lần 2 + kiểm giữa + lần 3 (+ kiểm cuối):

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 21:50:50Z 18/11) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + lần 2 + kiểm giữa (danh sách DR nhảy từ 06:00Z xuống 04:00Z); ở lần 3 + kiểm cuối ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 10:00Z 18/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–142 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 21:50:50Z 18/11) nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 16, BẰNG CHỨNG TRỰC TIẾP THỨ TÁM

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
| **Đợt 143** | **b6c4b22d** | **02:35:51** | **02:35:51Z (T7-143 thấy running ở kiểm lần 1 ~02:43Z và lần 2 ~03:33Z, jitter 0 s)** | **03:56:20** | **+4.829 s** | **03:55:45Z (691a7403)** | **35 s (lần 1)** |

- Kiểm chứng số học đợt 143 lần-1: 1795060580 − 1795060545 = 35 s ✓; 1795060580 − 1795055751 = 4.829 s ✓.
- Kiểm chứng số học đợt 142 lần-2 (đợt này, run đã finished): 1795053357 − 1795053325 = 32 s ✓ — KHÔNG viết lại lần 3 (started_at đứng yên ở 01:55:57Z qua cả 5 lần kiểm đợt 143; run đã finished 02:34:13Z trước khi lượt 143 bắt đầu).
- Kiểm chứng số học đợt 141 lần-2 (đính chính đợt 142, nay tái xác nhận): 1795042119 − 1795042085 = 34 s ✓ (btime bde599df); started_at run 141 đứng yên ở 1795042119 qua cả 5 lần kiểm đợt 143 — KHÔNG viết lại lần 3.
- **Viết lại của run 143 xảy ra GIỮA kiểm lần 2 (03:33Z) và kiểm giữa (03:56Z), tại reboot giữa lượt** — T7 tự thấy giá trị trước (02:35:51Z) và sau (03:56:20Z = btime 691a7403 + 35 s) trong cùng một đợt. Đây là lần thứ tám giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137; lần hai: đợt 138; lần ba: đợt 139; lần bốn: đợt 140; lần năm: đợt 141; lần sáu: đợt 142 lần-1; lần bảy: đợt 142 lần-2).
- **KHÔNG có lần viết lại thứ hai cho run 143:** started_at đứng yên ở 03:56:20Z qua kiểm lần 3 (~04:27Z) và kiểm cuối (~05:03Z); boot không đổi (691a7403, btime 03:55:45Z) từ 03:56Z; sleep chờ kiểm lần 3 (1.800 s) và sleep chờ kiểm cuối (2.100 s) đều hoàn thành bình thường.
- **Run 142 KHÔNG bị viết lại lần 3** tại reboot giữa lượt 143 (started_at vẫn 01:55:57Z qua cả 5 lần kiểm) — vì đã finished 02:34:13Z trước reboot. Đợt 141 (`85a2b391`): started vẫn 1795042119 = 22:48:39Z, không đổi; đợt 140 (`1e775062`): started vẫn 1795031683 = 19:54:43Z, không đổi; đợt 139 (`24a20fbc`): started vẫn 1795017316 = 15:55:16Z, không đổi.
- **Giả thuyết sau kiểm thứ 16:** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s (dải quan sát thực tế 31–50 s sau khi loại hai số sai-boot 936 s và 79 s). Các reboot sau khi run đã finished KHÔNG viết lại; không có lần viết lại thứ hai khi không có thêm reboot. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** / **35 s (143-lần-1)** — 35 s nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 143 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 03:56:20Z → finished (chưa có lúc T7 kiểm cuối, run vẫn `running`); thời lượng tường thật là 02:35:51Z → finished. Hệ quả số liệu đợt 142 (chốt ở kiểm lần 1 đợt này): thời lượng tường thật 23:35:51Z → 02:34:13Z = 10.702 s (2h58'22"); theo mốc ghi nay (lần-2) 01:55:57Z → 02:34:13Z = 2.296 s (38'16").

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot 70a5b0fc → 691a7403, btime 03:55:45Z — GIỮA lượt 143** (giữa kiểm lần 2 03:33Z và kiểm giữa 03:56Z), lúc run vcut 143 đang chạy — ứng viên sự kiện tiếp theo sau #29? theo định nghĩa gộp T10-133 §10.2 (70a5b0fc = #104? TẠM theo T10-142; T10-143 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cửa sổ reboot (T7 ước lượng từ sleep chết): tắt máy bắt đầu ~03:55:45–03:55:50Z (sleep của T7 chết SIGTERM sau 1.330 s kể từ ~03:33:40Z) → btime boot mới 03:55:45Z. T2-143 xác nhận hẹp hơn (T7 chỉ ghi mốc).
- **Khoảng im lặng chứa reboot (03:45:34Z, 03:56:20Z] (~10'46", 646 s):** hoạt động cuối trước khoảng: HB 03:50:50Z start 03:45:34Z; hoạt động đầu sau khoảng: started_at vcut 143 bị viết lại 03:56:20Z. Btime 03:55:45Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ hai giữa lượt 143** tới kiểm cuối (boot_id vẫn 691a7403, btime vẫn 03:55:45Z — 03:56Z → 05:03Z; sleep chờ kiểm lần 3 (1.800 s) và sleep chờ kiểm cuối (2.100 s) hoàn thành bình thường). DR 04:00Z + HB 04:20:50Z + DR 05:00Z + HB 04:50:50Z chạy đúng giờ trên boot mới 691a7403 — scheduler hồi phục sau reboot, không nuốt slot nào.
- Lưu ý phương pháp: sleep chờ kiểm lần 3 của T7 bị SIGTERM đúng lúc tắt máy ~03:55:50Z (process chết theo boot cũ, duration 1.330 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot giữa lượt chính nhờ lần kiểm giữa này (giống đợt 137/138/139/140/141/142).
- **Brief/flag đợt 143 KHỚP btime đo được:** `round-in-progress.md` ghi "Bắt đầu: 02:35Z 19/11/2026, boot 70a5b0fc, hạn cứng ~05:30Z" — khớp hoàn toàn boot_id + btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1).
- Đối chiếu T2-143 (file `round143-t2/boot-verify.txt`, đã đọc lúc kiểm giữa ~03:56Z và kiểm cuối ~05:03Z): T2 tự xác minh boot **70a5b0fc-6aae-4261-a3fe-11226162b5a3, btime 1795053325 = 01:55:25Z** lúc 02:48:41Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với boot mới 691a7403 tới kiểm cuối (file vẫn chỉ ghi 70a5b0fc, last entry 02:48:41Z) — dù cờ `round143-t2.done` đã có lúc kiểm cuối (~05:03Z); boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime mỗi boot). T10/T6 đối chiếu lúc đóng.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 23:35:51 (đợt 142) | 06:35:51 | eddb1710 | `succeeded`, finished 02:34:13Z; started_at 01:55:57Z = btime(70a5b0fc) 01:55:25Z + 32 s — KHÔNG viết lại lần 3 tại reboot giữa lượt 143 (đã finished) |
| 02:35:51 (đợt 143) | 09:35:51 | b6c4b22d | `running` lúc kiểm cuối (~05:03Z), started_at đứng yên ở 03:56:20Z — KHÔNG viết lại lần 2; đã bị viết lại 1 LẦN: 02:35:51Z → 03:56:20Z (btime 691a7403 03:55:45Z + 35 s) tại reboot giữa lượt — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 5 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 20:35:51 → 23:35:51 → 02:35:51Z, cách nhau đúng 3h; lượt tiếp theo 05:35:51Z 19/11.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **01:55:25Z** (`/proc/stat` 1795053325 + `uptime -s` + `who -b` 01:55 lúc 02:40Z, trùng nhau); boot_id **70a5b0fc-6aae-4261-a3fe-11226162b5a3** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief/flag đợt 143 + khớp độc lập file boot-verify của T2-143 về cả boot_id + btime).
- Boot hiện hành btime **03:55:45Z** (`/proc/stat` 1795060545 + `uptime -s` + `who -b` 03:55 lúc 03:56Z, 04:27Z và 05:02Z, trùng nhau); boot_id **691a7403-512b-4055-bb55-de0d7516eeeb** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-143 chưa cập nhật boot-verify.txt với boot này tới kiểm cuối — chỉ có T7 xác minh).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, lần 2, kiểm giữa, lần 3 và kiểm cuối) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~05:03Z): **5/9 cờ `.done` đã có** — `round143-t1.done`, `round143-t2.done`, `round143-t5.done`, `round143-t6.done`, `round143-t9.done`. Chưa có: t4, t8, t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×5 lần; DR limit=15 ×5 lần; vcut limit=5 ×5 lần). Lưới kỳ vọng như đợt 125–142.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h38' (02:25:06Z → 05:02:52Z 19/11), đủ 5 slot HB + 3 slot DR. Ba lần kiểm chính + 1 kiểm giữa + kiểm cuối khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 02:50:50Z thuộc cửa 143 theo quy ước đứng — T7-144 bắt đầu cửa sau 05:02:52Z, slot HB tiếp theo là 05:20:50Z, DR tiếp theo là 06:00Z.
6. **Rút cửa kiểm cuối sớm hơn đợt 142 (theo brief):** kiểm cuối ~05:03Z, đóng cờ ~05:05Z — cách hạn cứng ~05:30Z khoảng 25', thay vì T7-142 đóng cờ 02:27Z cách hạn cứng ~02:30Z chỉ ~3'.

## 4. Cập nhật lũy kế (nối tiếp đợt 142, cùng phương pháp)

- Heartbeat: 44/244 → **44/249 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 11:50:50 +07). Kiểm toán cửa sổ: 244 + 5 slot mới = 249 ✓. Số thiếu +0.
- Deterministic-doctor: 49/193 → **49/196 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 12:00 +07). Kiểm toán: 193 + 3 = 196 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/249 = 17,7% (giảm từ 18,0% — 0 thiếu mới); DR 49/196 = 25,0% (giảm từ 25,4% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Giả thuyết viết lại started_at — kiểm thứ 16 GIỮ ĐÚNG (bằng chứng trực tiếp thứ tám):** run 143 viết lại 1 lần tại reboot 691a7403, offset 35 s — trong dải ~30–50 s (sau đính chính đợt 142, dải thực tế là 31–50 s; 35 s nằm trong dải). Chuỗi offset boot đúng nay: ... 34 (141-2) / 37 (142-1) / 32 (142-2) / **35 (143-1)**. T7-144 kiểm tiếp run 143/144 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận kiểm thứ 16 vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 70a5b0fc → 691a7403 (reboot GIỮA lượt 143, btime 03:55:45Z)** — ứng viên sự kiện tiếp theo sau #29? theo định nghĩa gộp T10-133 §10.2 (70a5b0fc = #104? TẠM theo T10-142; T10-143 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Reboot KHÔNG nuốt slot nào — khoảng im lặng chứa reboot (03:45:34Z, 03:56:20Z] không chứa slot tới hạn nào; DR 04:00Z + HB 04:20:50Z chạy đúng giờ trên boot mới sau reboot.
5. **T2-143 chưa cập nhật boot-verify.txt với boot mới 691a7403** tới kiểm cuối (file vẫn chỉ ghi 70a5b0fc, last entry 02:48:41Z) — dù cờ `round143-t2.done` đã có. Boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 3 + kiểm cuối đều trùng btime mỗi boot). T10/T6 đối chiếu lúc đóng (mẫu lặp lại từ đợt 142: T2 không bổ sung boot mới trước khi đóng).
6. **Mù #62: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-143-T7-0 — KHÔNG có sai số nào trong đợt này:** 5 lần kiểm (lần 1, lần 2, kiểm giữa, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô (35 s = 1795060580 − 1795060545; jitter +4.829 s = 1795060580 − 1795055751 — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 2 boot trong lượt (70a5b0fc lúc mở, 691a7403 từ kiểm giữa) và đối chiếu khớp T2 (nguồn độc lập) cho boot 70a5b0fc (btime 01:55:25Z); brief/flag đợt 143 khớp btime đo được; ở kiểm giữa đã đọc lại boot_id SAU khi đọc started_at nên offset 35 s tính theo đúng boot hiện hành (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); boot mới 691a7403 chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm cuối) — ghi rõ, không khẳng định đối chiếu hai nguồn cho boot này.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round143-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round143-t7/NOTES.md` (không nằm trong repo nên không stage).
