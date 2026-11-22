# PHASE9 ROUND147 T7 — CỬA LÀNH: 0 slot thiếu MỚI (HB 6/6 + DR 2/2) + 0 REBOOT trong phiên + run 147 KHỞI ĐỘNG ĐÚNG GIỜ, KHÔNG bị viết lại + run 146 KẾT THÚC SUCCEEDED + ĐỐI CHIẾU MỐC NEO (quyết (q)): CHUẨN 8.363 s XÁC NHẬN, số 7.963 s của T7-146 là SAI

- **Luồng:** T7 đợt 147 (lượt cron 21:35 +07 19/11/2026 = 14:35:51Z 19/11). Boot duy nhất trong lúc làm việc: **6fb582df-455d-47cd-99dc-8bef48018536, btime 12:13:26Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc mở ~14:40Z, lần 2 ~15:35Z, lần 3 ~16:25Z và kiểm cuối ~16:55Z, trùng nhau; khớp T7-146 kiểm cuối + khớp độc lập T2-147 ba lần xác minh).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 14:04:xxZ 19/11 (lúc T7 đợt 146 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận). Kiểm mẫu quyết (m) đợt 145 (run TIMEOUT + run sau chạy muộn): nếu tái diễn thì mở điều tra, nếu không thì chỉ ghi nhận. **Đối chiếu lại mốc neo (quyết parent (q) đợt 146):** tính lại tuổi thọ boot 98a7c93f từ btime, chỉ ra mốc neo nào của T7-146 đã sai, xác nhận số chuẩn 8.363 s.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` qua muse.db + file LIMITS đợt 147 của T2 để đối chiếu + cờ `.done` đợt 147). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 146 lành; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 2/2.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 2 | 2 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 146 đã `succeeded`, đợt 147 đang `running`) | — | 0 | — |

**Dị thường started_at — KHÔNG có quan sát mới đợt này: 0 reboot trong phiên nên run 147 KHÔNG bị viết lại.** Run 147 (`98cf7700`) started_at ghi 14:35:51Z ở cả 4 lần kiểm (jitter 0 s — khởi động đúng giờ), đứng yên từ lần 1 (~14:40Z) tới kiểm cuối (~16:55Z). **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" KHÔNG bị bác và cũng không thêm bằng chứng trực tiếp mới** — kiểm đếm giữ nguyên kiểm thứ 20 / bằng chứng trực tiếp thứ 12 (đợt 146); chuỗi offset sau btime không thêm số mới (vẫn .../40 (145-lần-1) / 36 (146-lần-1)).

- **Run 146 KẾT THÚC SUCCEEDED (không phải timeout):** run `e24b5870` finished 14:24:36Z, error_text=null — xem §2.4/§2.6. Kết cục ngã ngũ 2m56s SAU cờ t10.done đợt 146 (14:21:40Z); T10-146 đóng sổ với run 146 "running" là đúng tại thời điểm đó.
- **Mẫu quyết (m) đợt 145 KHÔNG tái diễn — lần thứ hai liên tiếp — KHÔNG mở điều tra:** run 146 succeeded (không timeout) + run 147 khởi động đúng giờ (jitter 0 s). Cả hai vế của mẫu đều không xảy ra ở đợt 147 (cũng như ở đợt 146).
- **Đối chiếu mốc neo (quyết (q)) — XONG, xem §2.4:** tuổi thọ boot 98a7c93f CHUẨN LÀ **8.363 s = 2h19m23s** (phép trừ btime 09:54:03Z → 12:13:26Z, tính lại bằng `date -u` từ epoch thô; khớp T5/T9/T10 + T2-147 chứng nhận gap [8.353, 8.373] s). Hai số của T7-146 đều SAI và còn mâu thuẫn nhau 40 s: 7.963 s = 2h12'43" (thiếu 400 s) và "2h13'23"" = 8.003 s (thiếu 360 s). Mốc neo như T7-146 VIẾT (09:54:03Z → 12:13:26Z) đều ĐÚNG btime — sai nằm ở bước trừ/viết số tại kiểm giữa (~12:14Z, ngay sau reboot #34 giết sleep chờ), không phải đọc sai btime như ghi.
- Cập nhật lũy kế (cùng phương pháp đợt 125–146): heartbeat **44/273 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/207 slot thiếu** (số thiếu +0, mẫu số +2).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 14:04:xxZ → 16:55:xxZ 19/11

Cửa kiểm ~2h51'. Bốn lần kiểm (lần 1 ~14:40Z, lần 2 ~15:35Z, lần 3 ~16:25Z, kiểm cuối ~16:55Z) **khớp hoàn toàn nhau ở mọi slot trùng** — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa một lần kiểm; không có reboot xen giữa lượt nên không phát sinh kiểm giữa ngoài kế hoạch).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:20:50 (14:20:50Z) | f01449c6 | 14:15:34 | −316 s | CÓ |
| 21:50:50 (14:50:50Z) | e70da263 | 14:45:34 | −316 s | CÓ |
| 22:20:50 (15:20:50Z) | 30f5bf52 | 15:15:34 | −316 s | CÓ |
| 22:50:50 (15:50:50Z) | 758e5ec2 | 15:45:34 | −316 s | CÓ |
| 23:20:50 (16:20:50Z) | 7b5bc11a | 16:15:34 | −316 s | CÓ |
| 23:50:50 (16:50:50Z) | 76b21e22 | 16:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 6 lượt jitter −316 s (mẫu chuẩn, không có lượt −315 s như F-146-T7-1); 0 lượt muộn lớn.
- Slot HB 14:20:50Z là slot đầu tiên của cửa 147 (sau mốc 14:04:xxZ của T7-146).

**Deterministic-doctor (lưới :00:00Z): 2/2 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 22:00 (15:00Z) | 2549d2f2 | 15:00:00 | 0 s | CÓ |
| 23:00 (16:00Z) | 80e4fa90 | 16:00:00 | 0 s | CÓ |

- Cả 2 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot DR 17:00Z chưa tới hạn lúc kiểm cuối (~16:55Z) nên thuộc cửa T7-148 — T7-148 bắt đầu cửa sau 16:55:xxZ.

**Quy ước biên (đứng từ đợt 135):** slot HB 14:20:50Z thuộc cửa 147 (sau mốc 14:04:xxZ của T7-146), KHÔNG đếm lại ở đợt 146. Slot DR 14:00Z đã đếm ở cửa 146 (không đếm lại). Slot HB 17:20:50Z + DR 17:00Z + vcut 17:35:51Z (run 148) thuộc T7-148.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi (ngoài cửa sổ, ghi rõ)

Trong danh sách limit=15 ở cả 4 lần kiểm:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ kiểm cuối chỉ xuống tới 09:50:50Z 19/11) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (danh sách DR kiểm cuối chỉ xuống tới 02:00Z 19/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–146 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut + ĐỐI CHIẾU MỐC NEO (quyết (q))

#### 2.4.1 Run 147 — khởi động đúng giờ, không viết lại (không có reboot để quan sát)

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 146 | e24b5870 | 11:35:51 | 11:35:51Z (T7-146 thấy running ở kiểm lần 1 ~11:37Z, jitter 0 s) → 12:14:02Z (kiểm giữa ~12:14Z) | 12:14:02 | +2.291 s | 12:13:26Z (6fb582df) | 36 s (lần 1) |
| **Đợt 147** | **98cf7700** | **14:35:51** | **14:35:51Z (T7-147 thấy running ở cả 4 lần kiểm, jitter 0 s)** | **14:35:51** | **0 s** | **12:13:26Z (6fb582df — boot duy nhất trong phiên)** | **— (không viết lại; started_at = scheduled, không phải btime + offset)** |

- Kiểm chứng số học đợt 147: 1795098951 − 1795098951 = 0 s ✓ (jitter 0 s ở cả 4 lần kiểm).
- **KHÔNG có lần viết lại nào cho run 147 tới kiểm cuối:** started_at đứng yên 14:35:51Z qua lần 1 (~14:40Z), lần 2 (~15:35Z), lần 3 (~16:25Z) và kiểm cuối (~16:55Z); không có reboot nào trong phiên (boot_id vẫn 6fb582df, btime vẫn 12:13:26Z ở cả 4 lần kiểm).
- **Giả thuyết viết lại tại MỖI reboot trong lúc run đang chạy giữ nguyên ở kiểm thứ 20 / bằng chứng trực tiếp thứ 12 (đợt 146): đợt này KHÔNG thêm kiểm mới** vì không có reboot để quan sát — giả thuyết không bị bác, cũng không thêm bằng chứng. Chuỗi offset sau btime không thêm số mới: 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / 34 s (141-lần-2, đính chính) / 37 s (142-lần-1) / 32 s (142-lần-2) / 35 s (143-lần-1) / 44 s (144-lần-1) / 41 s (144-lần-2) / 40 s (145-lần-1) / **36 s (146-lần-1)** — đợt 136 và đợt 147 không có reboot giữa lượt nên không có số trong chuỗi.
- **Run 146 KHÔNG bị viết lại thêm** (started_at vẫn 1795090442 = 12:14:02Z qua cả 4 lần kiểm) — vì đã finished (succeeded) 14:24:36Z, trước cả khi run 147 khởi động. Run 145: started vẫn 1795082083 = 09:54:43Z, không đổi; đợt 144 (`b93ae161`): started vẫn 1795075017 = 07:56:57Z, không đổi; đợt 143 (`b6c4b22d`): started vẫn 1795060580 = 03:56:20Z, không đổi.
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- **Dữ kiện MỚI — run 146 KẾT THÚC SUCCEEDED, run 147 KHỞI ĐỘNG ĐÚNG GIỜ (mẫu quyết (m) đợt 145 KHÔNG tái diễn lần thứ hai liên tiếp):** run 146 (`e24b5870`) finished 1795098276 = 14:24:36Z, status `succeeded`, error_text=null — thời lượng tường thật theo mốc ghi nay 12:14:02Z → 14:24:36Z = 7.834 s (2h10'34"); theo started_at ban đầu 11:35:51Z → 14:24:36Z = 10.125 s (2h48'45") — cả hai đều dưới ngân sách 10.800 s. Run 147 khởi động jitter 0 s (như run 146; khác run 145 jitter +187 s). Theo quyết parent (m) đợt 145 ("chỉ ghi nhận là dữ kiện, không điều tra; nếu tái diễn ở đợt sau thì mở điều tra") và quyết (p) đợt 146 (XÁC NHẬN cách xử lý của T7) — mẫu KHÔNG tái diễn ở đợt 147 nên **KHÔNG mở điều tra**. Ghi nhận: finished_at run 146 (14:24:36Z) KHÔNG trùng started_at run 147 (14:35:51Z) — cách nhau 675 s (11m15s), khác mẫu trùng giây của đợt 144/145; run 146 kết thúc succeeded trước khi run 147 tới hạn 2m56s sau cờ t10.done đợt 146.
- Hệ quả số liệu đợt 146 (chốt ở kiểm lần 1 đợt này): run 146 **SUCCEEDED** — T10-146 đóng sổ với run 146 "running" là đúng tại thời điểm đó (run chưa finished lúc 14:21:40Z); kết cục succeeded chỉ ngã ngũ lúc 14:24:36Z, trong cửa T7-147 — T10-147 lưu ý khi đóng sổ đợt 146/147 (không đổi số đếm đợt 146 — run 146 vẫn đếm là 1 run của đợt; chỉ đổi trạng thái kết cục từ "running lúc đóng" sang "succeeded"). Run 147 vẫn `running` lúc T7-147 đóng cờ (~16:57Z) — kết cục của run 147 thuộc cửa T7-148 (cùng mẫu run 145/146: T10-147 sẽ đóng sổ với run 147 "running" nếu run chưa finished lúc đó).

#### 2.4.2 Đối chiếu lại mốc neo — tuổi thọ boot 98a7c93f (giao quyết (q) đợt 146)

**Kết luận trước: CHUẨN LÀ 8.363 s = 2h19m23s. Số 7.963 s của T7-146 là SAI.**

**(a) Tính lại từ btime (epoch thô, kiểm bằng `date -u`):**

| Mốc | Epoch | `date -u` |
|---|---|---|
| btime boot cũ 98a7c93f | 1795082043 | 09:54:03Z 19/11 |
| btime boot mới 6fb582df | 1795090406 | 12:13:26Z 19/11 |
| Hiệu | **1795090406 − 1795082043 = 8.363 s** | **2h19m23s** |

- Cả hai btime đều đã được xác minh độc lập nhiều nguồn: T7-146 (ba nguồn `/proc/stat` + `uptime -s` + `who -b` lúc mở đợt 146), T2-146 (boot-verify.txt, 11:38:40Z), T5-146, T9-146, T10-146 (kiểm lại đúng), và T2-147 (xác minh boot 6fb582df + btime 12:13:26Z ba lần 14:41:38Z/14:41:45Z/14:54:51Z; gap danh nghĩa 98a7c93f→6fb582df = 8.363 s, chứng nhận [8.353, 8.373] s → CERT 66 / FULL 81, chờ parent xác nhận).
- **8.363 s khớp hoàn toàn T5 ("2h19m23s = 8.363 s"), T9 ("8.363 s") và T10 ("phép trừ btime, kiểm lại đúng")** — bốn luồng độc lập (T5/T9/T10/T7-147) cùng một số; T2-147 chứng nhận gap 8.363 s bằng merged mù #66 (cả hai đoạn đóng theo luật gap, không điều kiện).

**(b) Hai số của T7-146 — đều sai, và mâu thuẫn nhau:**

| Số T7-146 ghi | Đổi ra | Lệch so với chuẩn 8.363 s |
|---|---|---|
| 7.963 s | 2h12'43" (`date -u -d @7963`) | **thiếu 400 s** (8.363 − 7.963) |
| "2h13'23"" | 8.003 s (`date -u -d @8003`) | **thiếu 360 s** (8.363 − 8.003) |
| Hai số lệch nhau | 8.003 − 7.963 = **40 s** | — |

- 7.963 s = 2h12'43", KHÔNG phải 2h13'23" như T7-146 viết cạnh nhau trong cùng một câu ("sống 09:54:03Z -> 12:13:26Z = 7.963 s (2h13'23")"). Hai số trong cùng một câu đã mâu thuẫn nhau 40 s — nên **ít nhất một trong hai là sai số viết/trình bày độc lập với mốc neo**: không thể có một cặp mốc neo duy nhất nào mà phép trừ đúng cho ra cả hai số.
- Mốc neo như T7-146 VIẾT (09:54:03Z → 12:13:26Z) đều ĐÚNG btime (khớp mọi nguồn độc lập ở (a)) — **sai không nằm ở việc đọc btime như ghi, mà nằm ở bước trừ/viết số** tại kiểm giữa (~12:14Z, ngay sau reboot #34 giết sleep chờ kiểm lần 2 của T7-146 — tính trong lúc vội, không kiểm lại bằng `date`).

**(c) Giả thuyết về cơ chế sai (ghi rõ là GIẢ THUYẾT — working của T7-146 không còn trong hồ sơ):**

- Cả hai số sai đều tái hiện ĐÚNG nếu mốc bắt đầu bị chép nhầm thành 10:00:xxZ:
  - Epoch bắt đầu **1795082403 (= 10:00:03Z)** → 1795090406 − 1795082403 = **8.003 s = 2h13'23""** (đúng số thứ hai của T7-146).
  - Epoch bắt đầu **1795082443 (= 10:00:43Z)** → 1795090406 − 1795082443 = **7.963 s = 2h12'43"** (đúng số thứ nhất của T7-146).
  - Tức epoch bắt đầu thật **1795082043** bị chép nhầm "2043" → "2403"/"2443" (hoán vị/chép sai chữ số giữa epoch).
- **Không có mốc thật nào ở 10:00:03Z hay 10:00:43Z** trong hồ sơ T7/T2/T5/T6 đợt 146 (đã đối chiếu: T2-146/T2-147 không có mốc nào tại hai thời điểm đó; mốc gần nhất là slot DR 10:00Z, sched = started = 1795082400 = 10:00:00Z — một lượt chạy theo lịch, không phải mốc neo boot; dùng giờ chạy DR làm mốc bắt đầu tuổi thọ boot sẽ là lỗi phạm trù, không phải lỗi đọc số — và 10:00:43Z thì hoàn toàn không có mốc nào gần đó). Nên cơ chế khả dĩ nhất là **chép sai/chuyển vị chữ số trong epoch lúc nhẩm trừ**, không phải đọc nhầm một mốc thật.
- Giả thuyết này KHÔNG chứng minh được từ hồ sơ (T7-146 không lưu phép tính trung gian) — ghi là giả thuyết để T10/parent tham khảo, không khẳng định là nguyên nhân duy nhất. Điều CHẮC CHẮN (không phụ thuộc giả thuyết): số chuẩn là 8.363 s; hai số của T7-146 đều sai; hai số đó mâu thuẫn nhau 40 s.

**(d) Bài học áp dụng ngay trong đợt này (F-147-T7-1):** mọi phép đổi epoch ↔ giờ và mọi phép trừ epoch trong đợt 147 đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi — và chính bước kiểm này đã bắt được một sai số nhẩm của T7-147 (xem §6): phép trừ finished_at run 146 nhẩm ra 14:31:16Z, `date -u` cho 14:24:36Z — **lệch đúng 400 s, cùng họ sai số −400 s như số 7.963 s của T7-146**. Phép trừ nhẩm các epoch 10 chữ số đã hai lần cho sai số −400 s; `date -u` là chốt chặn bắt được cả hai lần.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **0 reboot trong phiên T7-147** (boot_id vẫn 6fb582df, btime vẫn 12:13:26Z từ lúc mở ~14:40Z tới kiểm cuối ~16:55Z — 4 lần kiểm đều trùng). Không có khoảng im lặng chứa reboot nào trong cửa; không có slot nào bị nuốt. Phân loại khung chết là việc của T2/T5/T6 — đợt này không có khung mới.
- **Brief đợt 147 KHỚP btime đo được:** brief ghi "Boot hiện tại 6fb582df (btime 12:13:26Z, reboot #34 đã xác nhận)" — khớp hoàn toàn boot_id + btime đo được ba nguồn trùng nhau lúc mở (KHÔNG có sai lệch như F-139-T7-1). T2-147 xác minh độc lập boot 6fb582df + btime 12:13:26Z (14:41:38Z, 14:41:45Z, 14:54:51Z) — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). Mẫu "T2 không bổ sung boot mới trước khi đóng" ở đợt 142–146 nay ĐÃ khác: T2-147 xác minh boot mới ngay trong phiên (boot 6fb582df là boot mới của đợt 146, T2-146 đã đóng trước reboot #34 nên không xác minh được lúc đó).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 11:35:51 (đợt 146) | 18:35:51 | e24b5870 | **`succeeded`, finished 14:24:36Z**, error_text=null; started_at 12:14:02Z = btime(6fb582df) 12:13:26Z + 36 s — KHÔNG viết lại thêm (đã finished trước khi run 147 khởi động) |
| 14:35:51 (đợt 147) | 21:35:51 | 98cf7700 | `running` lúc kiểm cuối (~16:55Z), started_at 14:35:51Z — KHÔNG bị viết lại (0 reboot trong phiên); started_at ban đầu = scheduled + 0 s (khởi động đúng giờ — xem §2.4) |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau.
- Nhịp 3h giữ đúng: các lượt vcut 11:35:51 → 14:35:51Z, cách nhau đúng 3h; lượt tiếp theo 17:35:51Z 19/11 (run 148, thuộc T7-148).

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot duy nhất trong phiên btime **12:13:26Z** (`/proc/stat` 1795090406 + `uptime -s` + `who -b` 12:13 lúc mở ~14:40Z, lần 2 ~15:35Z, lần 3 ~16:25Z và kiểm cuối ~16:55Z, trùng nhau); boot_id **6fb582df-455d-47cd-99dc-8bef48018536** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief đợt 147 + khớp độc lập T2-147 ba lần xác minh về cả boot_id + btime).
- Boot 98a7c93f đã chết (reboot #34 đợt 146); tuổi thọ chuẩn **8.363 s = 2h19m23s** (xem §2.4.2).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~16:55Z): **5/9 cờ `.done` đã có** — `round147-t1.done`, `round147-t2.done`, `round147-t5.done`, `round147-t6.done`, `round147-t9.done`. Chưa có: t4, t8, t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). LIMITS ROUND147 đã có: T1, T2, T5, T6, T9. Paths-loop đã stage: t1, t2, t5, t6, t9. Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

### 2.9 Đối chiếu với T2-147 (đọc LIMITS lúc lần 2 ~15:35Z)

- **Mù #66 ĐÓNG HOÀN TOÀN** (T2-147 — cả hai đoạn đóng theo luật gap, merged gap max 120 s (A) / 937 s (B) < sàn 1.147 s, max 0 ẩn — KHÔNG cần uptime; lần đầu cả hai đoạn của một mù cùng đóng theo luật gap) → **chuỗi mù đóng hoàn toàn lên 2** (sau 1 ở #65) — chờ parent xác nhận.
- **Gap 8.363 s (98a7c93f→6fb582df): CHỨNG NHẬN [8.353, 8.373] s → CERT 66 / FULL 81** (không điều kiện — cả hai đoạn đóng theo luật gap; CERT66 mean 1h35'23", FULL81 mean 1h41'08") — chờ parent xác nhận. Số này KHỚP số chuẩn tuổi thọ boot 98a7c93f mà T7-147 đối chiếu ở §2.4.2 (hai phép đo độc lập cùng 8.363 s).
- **Khung chết #109? ứng viên (12:13:15Z, 12:13:26Z] 11 s — HẸP** (so với 599 s của #108?); khớp chính xác cửa sổ T4 (12:13:15Z, 12:13:26Z]; recheck 0 mốc mới; **nghịch lý đồng hồ ≥23 s ĐÃ GIẢI THÍCH tới từng file** (dấu vết boot cũ sau btime theo đồng-hồ-cũ không dịch chuyển khung theo quy ước đứng) — chờ parent chốt làm chuẩn.
- **Chuỗi INSIDE lên 6 (chính thức, đếm chặt — T2-147):** 6fb582df INSIDE dải FULL80 #110? [10:21:41Z, 12:18:23Z] (btime thực 12:13:26Z) → 6. Dải #111? (FULL81, neo 12:13:26Z): [12:41:13Z, 14:37:37Z].
- **F108? CHƯA ĐỦ 3 SERVER** (example +1, google +1; cloudflare 403 cả GET lẫn HEAD — chỉ 2 server đo được; theo chuẩn quyết 146 (f), không chấp nhận làm số đo F cho boot #110?).
- **KHÔNG có reboot mới trong phiên T2-147** (boot lúc đóng vẫn 6fb582df, 14:54:51Z) → **không mở mù #67** — khớp quan sát của T7 (0 reboot trong phiên).
- **Mâu thuẫn full boot_id b47f7932 — KHÔNG có dữ kiện mới:** T2-147 §2.2 vẫn ghi cả hai bản (T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`) — quyết parent (g) đợt 143: ĐỂ MỞ, ghi cả hai bản kèm nguồn, không chọn một. T7-147 cũng không tìm thêm bằng chứng — ghi nhận đúng quyết, không tự quyết bên nào đúng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` qua muse.db (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Job IDs đã xác minh qua `scheduler.jobs`: heartbeat / deterministic-doctor / vcut-build-loop. Lưới kỳ vọng như đợt 125–146.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học từ sai số T7-146 + near-miss F-147-T7-1 đợt này).
4. Cửa kiểm đợt này ~2h51' (14:04:xxZ → 16:55:xxZ 19/11), đủ 6 slot HB + 2 slot DR (DR 17:00Z chưa tới hạn lúc kiểm cuối nên thuộc cửa T7-148). Bốn lần kiểm (lần 1, lần 2, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 14:20:50Z thuộc cửa 147 theo quy ước đứng — T7-148 bắt đầu cửa sau 16:55:xxZ, slot DR tiếp theo là 17:00Z, HB tiếp theo là 17:20:50Z, vcut tiếp theo là 17:35:51Z (run 148).
6. **Không có reboot trong phiên nên không phát sinh kiểm giữa ngoài kế hoạch** (khác đợt 146: reboot #34 giết sleep chờ kiểm lần 2, buộc kiểm giữa sớm). Cả 3 sleep chờ (2.940 s + 2.940 s + 1.800 s) đều hoàn thành bình thường, không bị SIGTERM.
7. T7 đóng cờ 16:59:55Z, cách hạn cờ 17:00Z chỉ ~4 giây — sát nút hơn mọi đợt trước (thường ~8–9' — do kiểm cuối đặt 16:55Z theo kế hoạch để đủ slot HB 16:50:50Z, cộng thời gian viết LIMITS; hạn cứng toàn đợt 17:30Z vẫn còn ~30'). Ghi rõ, không giấu.

## 4. Cập nhật lũy kế (nối tiếp đợt 146, cùng phương pháp)

- Heartbeat: 44/267 → **44/273 slot thiếu** (cửa sổ 14/11 07:50:50 → 19/11 23:50:50 +07). Kiểm toán cửa sổ: 267 + 6 slot mới = 273 ✓. Số thiếu +0.
- Deterministic-doctor: 49/205 → **49/207 slot thiếu** (cửa sổ 11/11 09:00 → 19/11 23:00 +07). Kiểm toán: 205 + 2 = 207 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/273 = 16,1% (giảm từ 16,5% — 0 thiếu mới); DR 49/207 = 23,7% (giảm từ 23,9% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; 0 reboot; run 147 không bị viết lại — không có quan sát mới cho giả thuyết viết lại). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành, không có hành động mới.
2. **Giả thuyết viết lại started_at — giữ nguyên ở kiểm thứ 20 / bằng chứng trực tiếp thứ 12 (đợt 146):** đợt này 0 reboot nên không thêm kiểm mới; giả thuyết không bị bác, cũng không thêm bằng chứng. T7-148 kiểm tiếp run 147/148 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận việc "đợt không reboot" vào §12.
3. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s (mẫu chuẩn). Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
4. **0 reboot trong phiên T7-147** — lần đầu tiên kể từ đợt 136 không có reboot nào trong lúc T7 làm việc (đợt 136 cũng 0 reboot giữa lượt; các đợt 137–146 đều có ≥1 reboot). Không có mù mới mở; T2-147 xác nhận không mở mù #67.
5. **Run 146 KẾT THÚC SUCCEEDED (không phải timeout) + run 147 khởi động đúng giờ (jitter 0 s) — mẫu quyết (m) đợt 145 KHÔNG tái diễn lần thứ hai liên tiếp → KHÔNG mở điều tra.** Run 146 finished 14:24:36Z (2m56s sau cờ t10.done đợt 146); finished_at run 146 KHÔNG trùng started_at run 147 (cách nhau 675 s) — khác mẫu trùng giây đợt 144/145. T10-147 lưu ý khi đóng sổ: run 146 đổi trạng thái kết cục từ "running lúc đóng" sang "succeeded"; run 147 vẫn "running" lúc T7 đóng cờ — kết cục thuộc cửa T7-148; không đổi số đếm đợt 146/147.
6. **Đối chiếu mốc neo (quyết (q)) — XONG:** chuẩn 8.363 s XÁC NHẬN (T7-147 tính lại + T2-147 chứng nhận gap độc lập cùng số); số 7.963 s của T7-146 là sai; hai số của T7-146 còn mâu thuẫn nhau 40 s; mốc neo như viết đều đúng btime — sai ở bước trừ/viết số (giả thuyết chép sai chữ số epoch, xem §2.4.2(c) — ghi rõ là giả thuyết, không khẳng định). Không còn câu hỏi mở về tuổi thọ boot 98a7c93f — chờ parent ghi nhận vào §12 đợt 147.
7. **Boot 6fb582df nay CÓ đối chiếu độc lập** (T2-147 ba lần xác minh boot_id + btime, khớp T7) — khác các đợt 142–146 (T2 không bổ sung boot mới trước khi đóng). T2-148 / T10-147 đối chiếu lúc đóng như thường lệ.
8. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** Cả hai bản ghi rõ ở §2.9: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c`. Không còn boot để đo lại; T7 không tự quyết bên nào đúng.
9. **Mù #66 ĐÓNG HOÀN TOÀN (T2-147) — việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; tự động hóa giao T9-147 theo quyết (l) đợt 146). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-147-T7-1 — Near-miss: phép trừ nhẩm finished_at run 146 sai đúng 400 s, đã bắt được bằng `date -u` TRƯỚC khi ghi.** Ở kiểm lần 1, T7 nhẩm 1795098951 − 1795098276 ra 275 s (tức finished 14:31:16Z); kiểm lại bằng `date -u -d @<epoch>` cho đúng 675 s = 11m15s (finished 14:24:36Z). Số sai 14:31:16Z KHÔNG đi vào NOTES hay LIMITS (NOTES ghi 14:24:36Z ngay từ đầu). Cùng họ sai số −400 s như số 7.963 s của T7-146 (8.363 − 7.963 = 400) — phép trừ nhẩm epoch 10 chữ số đã hai lần cho sai số −400 s; `date -u` là chốt chặn bắt được cả hai lần. Ghi rõ để đợt sau không bỏ bước kiểm `date -u` (xem §2.4.2(d)).
- **F-147-T7-2 — Hai thao tác thừa, không ảnh hưởng số liệu:** (a) lệnh grep đệ quy toàn `hidden_files/` lúc mở phiên chạy >60 s chưa xong (thư mục quá lớn — vite.lock.queue v.v.) nên đã kill bằng SIGTERM, chuyển sang đọc trực tiếp file cần thiết; (b) một lệnh edit NOTES với old_text trùng new_text (no-op) trước khi append đúng mục kiểm lần 3. Cả hai đều không làm đổi dữ liệu hay file; chỉ ghi để đợt sau tránh (grep có mục tiêu, không quét toàn hidden_files).
- **F-147-T7-0 — Không có sai số nào khác trong đợt này:** 4 lần kiểm (lần 1, lần 2, lần 3, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng; mọi jitter tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×2 slot, run 147 jitter 0 s, run 146 finished 14:24:36Z — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 4 lần kiểm (cùng boot 6fb582df) và đối chiếu khớp T2-147 (nguồn độc lập) về cả boot_id + btime; brief đợt 147 khớp btime đo được; ở cả 4 lần kiểm đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); 0 reboot trong phiên nên không có nguy cơ offset tính sai boot; T7 đóng cờ 16:59:55Z, cách hạn cờ 17:00Z chỉ ~4 giây — sát nút hơn mọi đợt trước, ghi rõ ở §3.7, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round147-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round147-t7/NOTES.md` (không nằm trong repo nên không stage).
