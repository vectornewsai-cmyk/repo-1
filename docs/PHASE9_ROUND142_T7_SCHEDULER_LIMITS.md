# PHASE9 ROUND142 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 8/8 + DR 4/4) + 3 REBOOT GIỮA LƯỢT (bde599df → b47f7932 → 9afdaa89 → 70a5b0fc) KHÔNG nuốt slot nào + CÂU HỎI MỞ 936 s ĐÃ GIẢI QUYẾT: 22:48:39Z = btime(bde599df) + 34 s, không phải 936 s + run 142 viết lại 2 LẦN tại 2 reboot (offset 37 s + 32 s, bằng chứng trực tiếp thứ sáu + thứ bảy)

- **Luồng:** T7 đợt 142 (lượt cron 06:35 +07 19/11/2026 = 23:35:51Z 18/11). Bốn boot trong lúc làm việc: boot lúc mở **bde599df-eb81-4205-86a0-b71a0ab9790c, btime 22:48:05Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 23:40Z, trùng nhau; khớp brief/flag đợt 142 + khớp độc lập file boot-verify của T2-142, entry 23:44:12Z — lần này KHÔNG có sai lệch btime như đợt 139), hai boot mới sau reboot đôi giữa lượt **b47f7932-ebca-447e-a015-0a6c160efd98, btime 23:53:38Z** và **9afdaa89-6721-4afa-aade-0358fe38e527, btime 23:54:20Z** (mỗi boot ba nguồn trùng nhau lúc quan sát; xem §2.4/§2.5 về mâu thuẫn btime 13 s giữa hai boot này), và boot mới sau reboot thứ ba giữa lượt **70a5b0fc-6aae-4261-a3fe-11226162b5a3, btime 01:55:25Z** (ba nguồn trùng nhau lúc 01:56Z).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 22:25:31Z 18/11 (lúc T7 đợt 141 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận).
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 141 + cờ `.done` đợt 142 + file `boot-verify.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 141 lành; đợt này lành tiếp): heartbeat 8/8, deterministic-doctor 4/4.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 8 | 8 | 0 | 0 |
| deterministic-doctor | 4 | 4 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 141 đã `succeeded`, đợt 142 đang `running`) | — | 0 | — |

**CÂU HỎI MỞ 936 s — ĐÃ GIẢI QUYẾT, KHÔNG CÒN MỞ: giá trị 22:48:39Z của run 141 KHÔNG phải btime(ed5323a4) + 936 s mà là btime(bde599df) + 34 s.** T10-141 so sánh với sai boot: kiểm boot cuối của T10 (22:48:05Z) vẫn thấy ed5323a4 — cùng giây với btime của boot mới bde599df (22:48:05Z), kiểm đua với reboot nên T10 chưa biết boot mới. T7-142 đo trực tiếp boot bde599df (btime 1795042085 = 22:48:05Z, ba nguồn trùng nhau, lúc mở + kiểm lần 1) và đối chiếu khớp độc lập entry boot-verify của T2-142 (23:44:12Z, cùng boot_id + btime). 1795042119 − 1795042085 = **34 s** — nằm trong dải ~30–50 s đã quan sát. Không có bằng chứng nào cho offset 936 s thật; con số 936 s chỉ là phép trừ đúng số học trên sai boot. Xem §2.4.

**Dị thường started_at — kiểm thứ 14 + 15 của giả thuyết, BẰNG CHỨNG TRỰC TIẾP THỨ SÁU + THỨ BẢY: lượt 142 ĐÃ BỊ VIẾT LẠI 2 LẦN, T7 tự quan sát được cả TRƯỚC và SAU trong cùng một đợt (sau đợt 137, 138, 139, 140 và 141).** Lượt vcut đợt 142 (run `eddb1710`) started_at ghi 23:35:51Z ở kiểm lần 1 (jitter 0 s), sau reboot đôi giữa lượt ghi **23:54:57Z = btime(9afdaa89) + 37 s**, jitter **+1.146 s**, rồi sau reboot thứ ba giữa lượt ghi nay **01:55:57Z = btime(70a5b0fc) + 32 s**, jitter **+8.406 s**; KHÔNG bị viết lại lần 3 (không có reboot thứ tư tới kiểm giữa #2, 01:56Z). **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" giữ đúng lần kiểm thứ 14 và thứ 15.** Chuỗi offset sau btime (chỉ tính theo boot đúng): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính — từng ghi sai 936 s)** / **37 s (142-lần-1)** / **32 s (142-lần-2)**.

- Cập nhật lũy kế (cùng phương pháp đợt 125–141): heartbeat **44/244 slot thiếu** (số thiếu +0, mẫu số +8); deterministic-doctor **49/193 slot thiếu** (số thiếu +0, mẫu số +4).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 22:25:31Z 18/11 → 02:25:06Z 19/11

Cửa kiểm ~4h. Bốn lần kiểm chính (lần 1 ~23:41Z, lần 2 ~00:48Z, lần 3 ~01:42Z, lần cuối ~02:24Z) + 2 kiểm giữa (~23:55Z sau reboot đôi; ~01:56Z sau reboot thứ ba) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa ba lần kiểm do reboot xen giữa lượt).

**Heartbeat (lưới :20:50/:50:50Z): 8/8 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 05:50:50 (22:50:50Z) | f9dd25bc | 22:45:34 | −316 s | CÓ |
| 06:20:50 (23:20:50Z) | 12242a88 | 23:15:34 | −316 s | CÓ |
| 06:50:50 (23:50:50Z) | 8fb219db | 23:45:34 | −316 s | CÓ |
| 07:20:50 (00:20:50Z) | 3c95c1fc | 00:15:34 | −316 s | CÓ |
| 07:50:50 (00:50:50Z) | 25438f9e | 00:45:34 | −316 s | CÓ |
| 08:20:50 (01:20:50Z) | c724a483 | 01:15:34 | −316 s | CÓ |
| 08:50:50 (01:50:50Z) | d8acae46 | 01:45:34 | −316 s | CÓ |
| 09:20:50 (02:20:50Z) | b81367ad | 02:15:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Mọi lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot 23:50:50Z chạy TRÊN boot cũ bde599df TRƯỚC reboot đôi (start 23:45:34Z < tắt máy ~23:50Z); slot 00:20:50Z là slot đầu tiên sau reboot đôi — chạy đúng giờ (jitter chuẩn −316 s) trên boot mới 9afdaa89; slot 01:50:50Z chạy TRÊN boot 9afdaa89 TRƯỚC reboot thứ ba (start 01:45:34Z < tắt máy ~01:53–01:54Z); scheduler hồi phục sau cả reboot đôi lẫn reboot thứ ba, không nuốt slot nào.

**Deterministic-doctor (lưới :00:00Z): 4/4 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:00 (23:00Z) | f7294509 | 23:00:00 | 0 s | CÓ |
| 07:00 (00:00Z) | 69415f4a | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | 9bcd1268 | 01:00:00 | 0 s | CÓ |
| 09:00 (02:00Z) | 53c18644 | 02:00:00 | 0 s | CÓ |

- Cả 4 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot 00:00Z là slot đầu tiên tới hạn sau reboot đôi — chạy đúng giờ (0 s) trên boot mới 9afdaa89; reboot đôi không nuốt slot nào.

**Quy ước biên (đứng từ đợt 135):** slot HB 22:50:50Z thuộc cửa 142 (sau mốc 22:25:31Z của T7-141), KHÔNG đếm lại ở đợt 141. Slot HB tiếp theo sau cửa này là 02:50:50Z, DR tiếp theo là 03:00Z (thuộc T7-143).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở kiểm lần 1 + kiểm giữa + lần 2 + lần 3 + kiểm giữa #2 (+ lần cuối):

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 13:50:50Z) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** ở kiểm lần 1 + kiểm giữa (danh sách DR nhảy từ 06:00Z xuống 04:00Z); ở lần 2 + lần 3 + kiểm giữa #2 (+ lần cuối) ngoài cửa sổ limit=15 (danh sách chỉ xuống tới 10:00Z) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–141 không đổi, trừ giải quyết câu hỏi 936 s ở §2.4.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 (cửa sổ chỉ xuống tới 13:50:50Z) nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 14, BẰNG CHỨNG TRỰC TIẾP THỨ SÁU + GIẢI QUYẾT 936 s

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
| Đợt 141 | 85a2b391 | 20:35:51 | 20:35:51Z (T7-141 thấy running ở kiểm lần 1 ~20:41Z và lần 2 ~21:35Z, jitter 0 s) → 21:52:53Z (kiểm giữa đợt 141) | **22:48:39** | **+7.968 s** | **22:48:05Z (bde599df — ĐÍNH CHÍNH, xem dưới)** | **34 s (lần 2 — ĐÍNH CHÍNH, từng ghi sai 936 s)** |
| **Đợt 142** | **eddb1710** | **23:35:51** | **23:35:51Z (T7-142 thấy running ở kiểm lần 1 ~23:41Z, jitter 0 s) → 23:54:57Z (kiểm giữa + lần 2 + lần 3)** | **01:55:57** | **+8.406 s** | **01:55:25Z (70a5b0fc)** | **32 s (lần 2)** |

- Kiểm chứng số học đợt 142 lần-1: 1795046097 − 1795046060 = 37 s ✓; 1795046097 − 1795044951 = 1.146 s ✓.
- Kiểm chứng số học đợt 142 lần-2: 1795053357 − 1795053325 = 32 s ✓; 1795053357 − 1795044951 = 8.406 s ✓.
- Kiểm chứng số học đợt 141 lần-2 (đính chính): 1795042119 − 1795042085 = 34 s ✓ (btime bde599df); phép trừ cũ của T10 1795042119 − 1795041183 = 936 s ✓ số học nhưng SAI BOOT (btime ed5323a4 22:33:03Z).
- **Giải quyết 936 s (bằng chứng từ trong VM):** (a) T7-142 đo trực tiếp boot lúc mở bde599df, btime 1795042085 = 22:48:05Z, ba nguồn trùng nhau (lúc mở 23:40Z + kiểm lần 1 ~23:41Z); (b) T2-142 xác minh độc lập cùng boot_id + btime trong `boot-verify.txt` (entry 23:44:12Z); (c) run 141 started_at đứng yên ở 1795042119 = 22:48:39Z qua cả 4 lần kiểm đợt 142 (lần 1, kiểm giữa, lần 2, lần 3 — và lần cuối, xem §2.6), tức không có lần viết lại nào sau đó làm thay đổi giá trị này; (d) kiểm boot cuối của T10-141 (22:48:05Z) vẫn thấy ed5323a4 — cùng giây với btime boot mới bde599df, kiểm đua với reboot. Kết luận: **không có offset 936 s thật; 22:48:39Z = btime(bde599df) + 34 s, nằm trong dải quan sát.** Câu hỏi mở của quyết parent đợt 141 §12.3(h) ĐÃ ĐÓNG. Dải offset quan sát thực tế (theo boot đúng): 31–50 s.
- **Đính chính của chính T7 trong đợt này (xem F-142-T7-1):** ở kiểm giữa, T7 tính offset run 142 là 79 s (23:54:57Z − btime b47f7932 23:53:38Z) — SAI BOOT, cùng lỗi như T10. Ở kiểm lần 2, sau khi phát hiện boot mới 9afdaa89 (btime 23:54:20Z), offset đúng là **37 s**. Giá trị 79 s bị hủy, không đưa vào chuỗi. Bài học phương pháp: khi hai reboot xảy ra trong ~1 phút, phải đọc lại boot_id SAU khi đọc started_at, và chỉ tính offset theo boot hiện hành tại thời điểm viết lại.
- **Viết lại lần 1 của run 142 xảy ra GIỮA kiểm lần 1 (23:41Z) và kiểm giữa (23:55Z), tại reboot đôi giữa lượt** — T7 tự thấy giá trị trước (23:35:51Z) và sau (23:54:57Z) trong cùng một đợt. Đây là lần thứ sáu giả thuyết được quan sát trực tiếp cả hai phía (lần đầu: đợt 137; lần hai: đợt 138; lần ba: đợt 139; lần bốn: đợt 140; lần năm: đợt 141).
- **Viết lại lần 2 của run 142 xảy ra GIỮA kiểm lần 3 (01:42Z) và kiểm giữa #2 (01:56Z), tại reboot thứ ba giữa lượt** — T7 tự thấy giá trị trước (23:54:57Z, đứng yên qua kiểm lần 2 ~00:48Z và lần 3 ~01:42Z) và sau (01:55:57Z = btime 70a5b0fc + 32 s) trong cùng một đợt. Đây là lần thứ bảy giả thuyết được quan sát trực tiếp cả hai phía, và là lần thứ ba một run bị viết lại 2 lần trong cùng một đợt được quan sát đầy đủ cả hai lần (sau run 140 đợt 140–141 và run 141 đợt 141–142).
- **KHÔNG có lần viết lại thứ ba cho run 142:** started_at đứng yên ở 01:55:57Z qua kiểm cuối (~02:25Z); boot không đổi (70a5b0fc, btime 01:55:25Z) từ 01:56Z; sleep chờ kiểm cuối hoàn thành bình thường (1.350 s).
- **Không biết b47f7932 có viết lại run 142 không:** không có quan sát `job_runs` nào giữa hai reboot liên tiếp (b47f7932 btime 23:53:38Z → 9afdaa89 btime 23:54:20Z, cách nhau 42 s theo btime) — giá trị nếu có (~23:54:0xZ) đã bị ghi đè bởi lần viết lại tại 9afdaa89. Ghi là KHÔNG BIẾT, không suy đoán. Tương tự, không biết reboot ed5323a4 (btime 22:33:03Z) có viết lại run 141 không (không có quan sát giữa 22:25Z và ~22:49Z) — giá trị nếu có (~22:33:37Z) đã bị ghi đè bởi lần viết lại tại bde599df.
- **Run 141 KHÔNG bị viết lại lần 3** tại reboot đôi đợt 142 (started_at vẫn 22:48:39Z qua cả 4 lần kiểm) — vì đã finished 22:57:07Z trước reboot. Đợt 140 (`1e775062`): started vẫn 1795031683 = 19:54:43Z, không đổi; đợt 139 (`24a20fbc`): started vẫn 1795017316 = 15:55:16Z, không đổi; đợt 138 (`4d2272ce`): started vẫn 1795010053 = 13:54:13Z, không đổi.
- **Giả thuyết sau kiểm thứ 14 + 15:** viết lại xảy ra tại MỖI reboot trong lúc run đang chạy (chưa finished) — không chỉ reboot đầu tiên; mỗi lần viết lại đặt started_at ≈ btime của boot mới + ~30–50 s (dải quan sát thực tế 31–50 s sau khi loại hai số sai-boot 936 s và 79 s). Các reboot sau khi run đã finished KHÔNG viết lại; không có lần viết lại thứ ba khi không có thêm reboot. Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / **34 s (141-lần-2, đính chính)** / **37 s (142-lần-1)** / **32 s (142-lần-2)** — 32 s nằm trong khoảng ~30–50 s đã quan sát; đợt 136 không có reboot giữa lượt nên không có số trong chuỗi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu. Thêm caveat mới đợt này: btime các boot trong reboot đôi mâu thuẫn nhau 13 s (xem §2.5) — mốc đồng hồ VM quanh 23:54Z không ổn định tuyệt đối.
- Hệ quả số liệu đợt 142 (T10 kiểm lại lúc đóng): thời lượng theo mốc ghi nay là 01:55:57Z → finished (chưa có lúc T7 kiểm cuối, run vẫn `running`); thời lượng tường thật là 23:35:51Z → finished. Hệ quả số liệu đợt 141 (chốt ở kiểm lần 1 đợt này): thời lượng tường thật 20:35:51Z → 22:57:07Z = 8.476 s (2h21'16"); theo mốc ghi nay (lần-2, đính chính 34 s) 22:48:39Z → 22:57:07Z = 508 s (8'28") — T7-141 ghi theo mốc lần-1 (21:52:53Z → finished) nay đã lỗi thời, T10 dùng mốc lần-2 này.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **Reboot đôi bde599df → b47f7932 → 9afdaa89 — GIỮA lượt 142** (giữa kiểm lần 1 23:41Z và kiểm giữa 23:55Z), lúc run vcut 142 đang chạy — ứng viên sự kiện tiếp theo sau #25? theo định nghĩa gộp T10-133 §10.2 (T8-140 tạm đánh boot 90392aa5 là #98?; T10-141 chốt ed5323a4 = #101? TẠM; T10-142 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cửa sổ reboot (T7 ước lượng từ hoạt động cuối trên boot cũ): tắt máy bắt đầu ~23:50:09Z (sleep của T7 chết SIGTERM sau 509 s kể từ ~23:41:30Z) → btime boot cuối 23:54:20Z; hai boot trung gian cách nhau 42 s theo btime (23:53:38Z → 23:54:20Z). T2-142 xác nhận hẹp hơn (T7 chỉ ghi mốc).
- **Khoảng im lặng chứa reboot đôi (23:45:34Z, 23:54:57Z] (~9'23", 563 s):** hoạt động cuối trước khoảng: HB 23:50:50Z start 23:45:34Z; hoạt động đầu sau khoảng: started_at vcut 142 bị viết lại 23:54:57Z. Cả hai btime (23:53:38Z, 23:54:20Z) nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot đôi giữa lượt này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Reboot thứ ba 9afdaa89 → 70a5b0fc, btime 01:55:25Z — GIỮA lượt 142** (giữa kiểm lần 3 01:42Z và kiểm giữa #2 01:56Z), lúc run vcut 142 đang chạy — ứng viên sự kiện tiếp theo sau reboot đôi (T10-142 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cửa sổ reboot (T7 ước lượng): tắt máy bắt đầu ~01:53–01:54Z (sleep của T7 chết SIGTERM sau 609 s kể từ ~01:43–01:44Z) → btime boot mới 01:55:25Z. T2-142 xác nhận hẹp hơn (T7 chỉ ghi mốc).
- **Khoảng im lặng chứa reboot thứ ba (01:45:34Z, 01:55:57Z] (~10'23", 623 s):** hoạt động cuối trước khoảng: HB 01:50:50Z start 01:45:34Z; hoạt động đầu sau khoảng: started_at vcut 142 bị viết lại lần 2, 01:55:57Z. Btime 01:55:25Z nằm trong khoảng. Slot tới hạn trong khoảng: KHÔNG có — reboot thứ ba này không nuốt slot nào. Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot thứ tư giữa lượt 142** tới kiểm cuối (boot_id vẫn 70a5b0fc, btime vẫn 01:55:25Z — 01:56Z → 02:25Z; sleep chờ kiểm cuối hoàn thành bình thường, 1.350 s). DR 02:00Z + HB 02:20:50Z chạy đúng giờ trên boot mới 70a5b0fc — scheduler hồi phục sau reboot thứ ba, không nuốt slot nào.
- Lưu ý phương pháp: sleep chờ kiểm lần cuối của T7 bị SIGTERM đúng lúc tắt máy ~01:53–01:54Z (process chết theo boot cũ, duration 609 s) — đó là hệ quả của reboot, không phải lỗi phương pháp; T7 phát hiện reboot thứ ba chính nhờ lần kiểm giữa #2 này (giống đợt 137/138/139/140/141). Sleep chờ kiểm lần 2 trên boot mới (3.000 s) và sleep chờ kiểm lần 3 trên boot mới (3.000 s) hoàn thành bình thường.
- **Mâu thuẫn btime giữa hai boot của reboot đôi (F-142-T7-1(b)):** btime boot 9afdaa89 (23:54:20Z) SỚM HƠN 13 s so với thời điểm T7 đọc được boot b47f7932 (23:54:33Z, ba nguồn trùng nhau lúc đó). Ít nhất một mốc đồng hồ VM quanh 23:54Z bị lệch (tiền lệ: dị thường đồng hồ lock-log T6 17:53:28Z đợt 141). T7 chỉ ghi nhận; T2/T6 phân loại. Hệ quả: phép trừ offset qua hai boot liên tiếp trong cùng một phút không đáng tin tuyệt đối — lý do nữa để hủy số 79 s.
- **Brief/flag đợt 142 KHỚP btime đo được:** `round-in-progress.md` ghi "Boot lúc mở: bde599df (btime ~22:48Z, sau reboot #25 trong lúc đóng sổ đợt 141)" — khớp hoàn toàn btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1). Lưu ý: flag gọi bde599df là "sau reboot #25", nhưng theo T10-141 reboot #25 tạo ra ed5323a4 (btime 22:33:03Z) — bde599df (btime 22:48:05Z) là boot sau MỘT reboot nữa (ed5323a4 → bde599df) mà T10 không phát hiện (kiểm boot cuối 22:48:05Z đua với reboot). Reboot ed5323a4 → bde599df chưa có số — giao T2-142 đánh số cùng với hai boot của reboot đôi.
- Đối chiếu T2-142 (file `round142-t2/boot-verify.txt`, đã đọc lúc kiểm lần 2 ~00:48Z): T2 tự xác minh boot **bde599df-eb81-4205-86a0-b71a0ab9790c, btime 1795042085 = 22:48:05Z** lúc 23:44:12Z — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 CHƯA cập nhật `boot-verify.txt` với ba boot mới b47f7932 / 9afdaa89 / 70a5b0fc tới kiểm giữa #2 (file vẫn chỉ ghi bde599df, last entry 23:44:12Z) — dù cờ `round142-t2.done` đã có lúc kiểm lần 3 (~01:42Z); ba boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 2 + lần 3 + kiểm giữa #2 đều trùng btime mỗi boot). T10/T6 đối chiếu lúc đóng — T2 KHÔNG cập nhật boot-verify trước khi đóng (file vẫn chỉ ghi bde599df, last entry 23:44:12Z lúc kiểm cuối ~02:25Z).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 20:35:51 (đợt 141) | 03:35:51 | 85a2b391 | `succeeded`, finished 22:57:07Z; started_at 22:48:39Z = btime(bde599df) 22:48:05Z + 34 s — **ĐÍNH CHÍNH: không phải 936 s**; KHÔNG viết lại lần 3 tại reboot đôi đợt 142 (đã finished) |
| 23:35:51 (đợt 142) | 06:35:51 | eddb1710 | `running` lúc kiểm cuối (~02:25Z), started_at đứng yên ở 01:55:57Z — KHÔNG viết lại lần 3; đã bị viết lại 2 LẦN: lần 1 → 23:54:57Z (btime 9afdaa89 23:54:20Z + 37 s) tại reboot đôi, lần 2 → 01:55:57Z (btime 70a5b0fc 01:55:25Z + 32 s) tại reboot thứ ba — xem §2.4 |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 6 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 17:35:51 → 20:35:51 → 23:35:51Z, cách nhau đúng 3h; lượt tiếp theo 02:35:51Z 19/11.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc mở btime **22:48:05Z** (`/proc/stat` 1795042085 + `uptime -s` + `who -b` 22:48 lúc 23:40Z, trùng nhau); boot_id **bde599df-eb81-4205-86a0-b71a0ab9790c** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief/flag đợt 142 + khớp độc lập file boot-verify của T2-142 về cả boot_id + btime).
- Boot sau reboot đôi btime **23:53:38Z** (`/proc/stat` 1795046018 + `uptime -s` + `who -b` 23:53 lúc 23:54:33Z, trùng nhau); boot_id **b47f7932-ebca-447e-a015-0a6c160efd98** tự xác minh từ `/proc/sys/kernel/random/boot_id` (chỉ sống ~42 s theo btime trước khi bị reboot tiếp; T2-142 chưa cập nhật boot-verify.txt với boot này tới kiểm giữa #2 — chỉ có T7 xác minh).
- Boot hiện hành btime **23:54:20Z** (`/proc/stat` 1795046060 + `uptime -s` + `who -b` 23:54 lúc 00:46Z, 00:48Z và 01:41Z, trùng nhau); boot_id **9afdaa89-6721-4afa-aade-0358fe38e527** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-142 chưa cập nhật boot-verify.txt với boot này tới kiểm giữa #2 — chỉ có T7 xác minh).
- Boot hiện hành btime **01:55:25Z** (`/proc/stat` 1795053325 + `uptime -s` + `who -b` 01:55 lúc 01:56Z, trùng nhau); boot_id **70a5b0fc-6aae-4261-a3fe-11226162b5a3** tự xác minh từ `/proc/sys/kernel/random/boot_id` (T2-142 chưa cập nhật boot-verify.txt với boot này tới kiểm giữa #2 — chỉ có T7 xác minh).
- Cờ `round-in-progress.md` TỒN TẠI trong suốt lúc T7 làm việc (lúc kiểm lần 1, kiểm giữa, lần 2, lần 3 và kiểm giữa #2) — T7 KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~02:25Z): **7/9 cờ `.done` đã có** — `round142-t1.done`, `round142-t2.done`, `round142-t4.done`, `round142-t5.done`, `round142-t6.done`, `round142-t8.done`, `round142-t9.done`. Chưa có: t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×6 lần; DR limit=15 ×6 lần; vcut limit=5 ×6 lần). Lưới kỳ vọng như đợt 125–141.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~4h (22:25:31Z → 02:25:06Z 19/11), đủ 8 slot HB + 4 slot DR. Bốn lần kiểm chính + 2 kiểm giữa khớp hoàn toàn nhau ở mọi slot trùng (kiểm giữa phát sinh do reboot xen giữa lượt); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 22:50:50Z thuộc cửa 142 theo quy ước đứng — T7-143 bắt đầu cửa sau 02:25:06Z, slot HB tiếp theo là 02:50:50Z, DR tiếp theo là 03:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 141, cùng phương pháp)

- Heartbeat: 44/236 → **44/244 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 09:20:50 +07). Kiểm toán cửa sổ: 236 + 8 slot mới = 244 ✓. Số thiếu +0.
- Deterministic-doctor: 49/189 → **49/193 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 09:00 +07). Kiểm toán: 189 + 4 = 193 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/244 = 18,0% (giảm từ 18,6% — 0 thiếu mới); DR 49/193 = 25,4% (giảm từ 25,9% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; chỉ có reboot đôi giữa lượt + viết lại started_at — giao T2/T5/T6 phân loại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Câu hỏi mở 936 s — ĐÃ ĐÓNG (kiểm thứ 14 + 15 + đính chính):** 22:48:39Z = btime(bde599df) + 34 s, không phải 936 s. Dải offset quan sát thực tế trở lại 31–50 s (sau khi loại hai số sai-boot 936 s và 79 s). Giả thuyết dạng sự kiện ("viết lại tại MỖI reboot trong lúc run đang chạy") giữ đúng lần kiểm thứ 14 (run 142 viết lại lần 1 tại reboot 9afdaa89, offset 37 s — bằng chứng trực tiếp thứ sáu) và lần kiểm thứ 15 (run 142 viết lại lần 2 tại reboot 70a5b0fc, offset 32 s — bằng chứng trực tiếp thứ bảy). T7-143 kiểm tiếp run 142/143 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận việc đóng câu hỏi mở vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: bde599df → b47f7932 → 9afdaa89 (reboot ĐÔI giữa lượt 142) + 9afdaa89 → 70a5b0fc (reboot THỨ BA giữa lượt 142)** — ứng viên sự kiện tiếp theo sau #25? theo định nghĩa gộp T10-133 §10.2 (ed5323a4 = #101? TẠM theo T10-141; reboot ed5323a4 → bde599df chưa có số; T10-142 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối). Cả ba reboot đều KHÔNG nuốt slot nào — khoảng im lặng chứa reboot đôi (23:45:34Z, 23:54:57Z] và khoảng im lặng chứa reboot thứ ba (01:45:34Z, 01:55:57Z] đều không chứa slot tới hạn nào; DR 00:00Z + HB 00:20:50Z chạy đúng giờ trên boot mới sau reboot đôi.
5. **T2-142 chưa cập nhật boot-verify.txt với ba boot mới b47f7932 / 9afdaa89 / 70a5b0fc** tới kiểm giữa #2 (file vẫn chỉ ghi bde599df, last entry 23:44:12Z) — dù cờ `round142-t2.done` đã có. Ba boot mới tới nay chỉ có xác minh của T7 (ba nguồn, kiểm giữa + lần 2 + lần 3 + kiểm giữa #2 đều trùng btime mỗi boot). T2 KHÔNG bổ sung trước khi đóng (xác nhận lúc kiểm cuối ~02:25Z). T10/T6 đối chiếu lúc đóng.
6. **Mù #61: việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-142-T7-1** (sai-boot 79 s + mâu thuẫn btime 13 s — xem §2.4/§2.5): (a) Ở kiểm giữa (~23:55Z), T7 tính offset run 142 là 79 s (23:54:57Z − btime b47f7932 23:53:38Z) — SAI BOOT, cùng lỗi như T10-141 với 936 s: lúc đó boot đã là 9afdaa89 (btime 23:54:20Z) sau reboot đôi liên tiếp cách nhau 42 s theo btime, nhưng T7 chưa đọc lại boot_id sau khi đọc started_at. Đã tự đính chính ở kiểm lần 2 (~00:48Z): offset đúng **37 s** (23:54:57Z − btime 9afdaa89 23:54:20Z). Số 79 s bị hủy, không đưa vào chuỗi offset. (b) Mâu thuẫn btime: btime 9afdaa89 (23:54:20Z) sớm hơn 13 s so với thời điểm T7 đọc được boot b47f7932 (23:54:33Z) — mốc đồng hồ VM quanh 23:54Z không ổn định tuyệt đối (tiền lệ dị thường đồng hồ đợt 141). Ghi nhận, không suy cơ chế; T2/T6 phân loại. Không có sai số số liệu nào khác: 4 lần kiểm chính + 2 kiểm giữa khớp hoàn toàn ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 4 boot trong lượt (bde599df lúc mở, b47f7932 lúc kiểm giữa, 9afdaa89 từ kiểm lần 2, 70a5b0fc từ kiểm giữa #2) và đối chiếu khớp T2 (nguồn độc lập) cho boot bde599df (btime 22:48:05Z); brief/flag đợt 142 khớp btime đo được; ba boot mới chưa có đối chiếu T2 (T2 chưa cập nhật boot-verify.txt tới kiểm giữa #2) — ghi rõ, không khẳng định đối chiếu hai nguồn cho ba boot này.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round142-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round142-t7/NOTES.md` (không nằm trong repo nên không stage).
