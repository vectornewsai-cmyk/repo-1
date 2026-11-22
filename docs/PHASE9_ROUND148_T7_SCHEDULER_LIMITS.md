# PHASE9 ROUND148 T7 — CỬA LÀNH (HB 6/6 + DR 3/3, 0 slot thiếu MỚI) + REBOOT #35 TRƯỚC PHIÊN + REBOOT #36 (19:34:32Z) + REBOOT #37 (19:41:02Z, cách #36 chỉ 390 s) TRONG PHIÊN + RUN 147 TIMEOUT + BỊ VIẾT LẠI (41 s / 26 s) + RUN 148 BỊ VIẾT LẠI 2 LẦN (43 s / 27 s, 35 s / 25 s — BẰNG CHỨNG TRỰC TIẾP THỨ 14 + 15) + RUN 148 KHỞI ĐỘNG MUỘN +62 s — MẪU QUYẾT (m) TÁI DIỄN + MỐC NEO 6fb582df: 18.867 s (stat) vs 18.882 s (proc/1) — CHỜ CHỐT CHUẨN NGUỒN

- **Luồng:** T7 đợt 148 (lượt cron 00:35 +07 20/11/2026 = 17:35:51Z 19/11). Ba boot trong lúc làm việc: **d8a11644-1f76-4e48-94f6-97b2cf34fff8** (sau reboot #35 lúc 17:28:08Z / 17:27:53Z, trong lúc T10-147 đóng sổ) từ lúc mở (~17:39Z) tới 19:34:32Z; **1d610e56-6970-429a-a385-f0ba67dbc191** (sau reboot #36 lúc 19:34:48Z / 19:34:32Z, trong phiên — giết sleep chờ kiểm cuối lần 1) từ 19:34:32Z tới 19:41:02Z (chỉ sống 390 s); **ae8f70bb-9197-4eae-b70f-2988769ac6a9** (sau reboot #37 lúc 19:41:12Z / 19:41:02Z, trong phiên — giết sleep chờ kiểm cuối lần 2 kèm runtime restart lần 2) từ 19:41:02Z tới kiểm cuối (~19:53Z).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 16:55:xxZ 19/11 (lúc T7 đợt 147 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop (quyết parent đợt 136 §12.3(j): cửa gãy — tiếp tục chỉ ghi nhận). Kiểm kết cục run 147 (điểm quan trọng nhất: reboot 17:28:08Z có giết/cắt ngang run 147 không) + run 148 khởi động. Kiểm mẫu quyết (m) đợt 145 (run TIMEOUT + run sau chạy muộn): nếu tái diễn thì mở điều tra. **Đối chiếu mốc neo (giao brief):** tuổi thọ boot 6fb582df = 18.882 s danh nghĩa (12:13:26Z→17:28:08Z) — tính lại chính xác, khớp T2/T5 thì ghi rõ.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` qua muse.db + file LIMITS đợt 148 của T2/T4 để đối chiếu + cờ `.done` đợt 147/148). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA LÀNH — 0 slot thiếu MỚI (đợt 147 lành về slot; đợt này lành tiếp): heartbeat 6/6, deterministic-doctor 3/3.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 147 đã `timeout`, đợt 148 đang `running`) | — | 0 | — |

**Dị thường started_at — CÓ BA QUAN SÁT MỚI LỚN, bằng chứng trực tiếp thứ 13, 14 VÀ 15: run 147 BỊ VIẾT LẠI tại reboot #35, run 148 BỊ VIẾT LẠI tại reboot #36 VÀ VIẾT LẠI LẦN 2 tại reboot #37.** Run 147 (`98cf7700`) started_at đổi từ 14:35:51Z (T7-147 thấy ở cả 4 lần kiểm, jitter 0 s) thành **17:28:34Z** — offset **41 s** sau btime /proc/stat (17:27:53Z), hoặc **26 s** sau btime /proc/1 (17:28:08Z). Run 148 (`b33c757c`) started_at đổi từ 17:36:53Z (T7-148 thấy ở cả 3 lần kiểm đầu) thành **19:35:15Z** tại reboot #36 — offset **43 s** sau btime /proc/stat (19:34:32Z), hoặc **27 s** sau btime /proc/1 (19:34:48Z) — rồi đổi LẦN 2 thành **19:41:37Z** tại reboot #37 — offset **35 s** sau btime /proc/stat (19:41:02Z), hoặc **25 s** sau btime /proc/1 (19:41:12Z). Chuỗi offset sau btime thêm BA số mới: …/40 (145-lần-1) / 36 (146-lần-1) / **41 (147)** / **43 (148-lần-1)** / **35 (148-lần-2)** — theo chuẩn /proc/stat đứng của T7. **Giả thuyết "viết lại tại MỖI reboot trong lúc run đang chạy (chưa finished)" được THÊM BA BẰNG CHỨNG TRỰC TIẾP MỚI TRONG CÙNG MỘT ĐỢT — LẦN ĐẦU một run bị viết lại 2 lần trong một đợt: kiểm đếm lên kiểm thứ 23 / bằng chứng trực tiếp thứ 15 (đợt 148).** Song song 41/26, 43/27, 35/25: offset stat đều trong dải chuỗi 31–50 s, offset proc/1 đều dưới min chuỗi — gợi ý scheduler ghi lại started_at ≈ kernel-boot + ~40 s (xem §2.4.1/§2.4.2(c)).

- **Run 147 KẾT THÚC TIMEOUT (không phải succeeded):** run `98cf7700` finished 17:36:53Z, error_text "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." — xem §2.4/§2.6. Kết cục ngã ngũ 3m31s SAU khi T10-147 đóng (17:33:22Z); T10-147 đóng sổ với run 147 "running" là đúng tại thời điểm đó. **Claim "0 reboot trong phiên" của đợt 147 ĐÃ SAI** (T2-148 §2.1): reboot #35 xảy ra 17:28:08Z, sau cờ t8.done (17:22:19Z), trong lúc T10-147 đóng sổ — xem §2.5.
- **Mẫu quyết (m) đợt 145 TÁI DIỄN — lần đầu kể từ đợt 145 (đợt 146/147 không tái diễn):** run 147 TIMEOUT + run 148 khởi động muộn **+62 s** (started 17:36:53Z vs sched 17:35:51Z). Theo quyết (m) ("nếu tái diễn ở đợt sau thì mở điều tra") — T7 ghi nhận + cờ cho parent/T10; T7 không tự mở điều tra ngoài phạm vi đếm slot. Xem §2.4.1/§5.2.
- **Đối chiếu mốc neo — XONG, nhưng TÁCH ĐÔI THEO NGUỒN (xem §2.4.2):** tuổi thọ boot 6fb582df = **18.867 s = 5h14m27s** theo /proc/stat (17:27:53Z) — chuẩn đứng của T7; hoặc **18.882 s = 5h14m42s** theo /proc/1 (17:28:08Z) — số danh nghĩa trong brief + chuẩn chứng nhận của T2-148 (CERT 67 / FULL 82, [18.872, 18.892] s). Chênh đúng 15 s = độ trễ init PID 1 (1.521 ticks = 15,21 s, T2-148 đã hòa giải — KHÔNG phải nghịch lý đồng hồ). T5/T6-148 dùng 18.867 s; T2-148 dùng 18.882 s. **Chuẩn nguồn nào làm chuẩn series CHỜ PARENT/T10 CHỐT** (T2-148 §4.5 (g)) — T7 ghi cả hai, không tự chốt.
- Cập nhật lũy kế (cùng phương pháp đợt 125–147): heartbeat **44/279 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/210 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 16:55:xxZ → 19:53:xxZ 19/11

Cửa kiểm ~2h58'. Sáu lần kiểm (lần 1 ~17:39Z, lần 2 ~18:35Z, lần 3 ~19:30Z, kiểm giữa bắt buộc ~19:35Z sau reboot #36, kiểm giữa bắt buộc lần 2 ~19:41Z sau reboot #37, kiểm cuối ~19:53Z) **khớp hoàn toàn nhau ở mọi slot trùng** — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (thừa ba lần kiểm; reboot #35 xảy ra TRƯỚC lúc T7 mở phiên, reboot #36/#37 xảy ra TRONG phiên và buộc hai kiểm giữa ngoài kế hoạch).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:20:50 (17:20:50Z) | 2024f041 | 17:15:34 | −316 s | CÓ |
| 00:50:50 (17:50:50Z) | f7740364 | 17:45:34 | −316 s | CÓ |
| 01:20:50 (18:20:50Z) | e122e2fa | 18:15:34 | −316 s | CÓ |
| 01:50:50 (18:50:50Z) | 96c8937b | 18:45:34 | −316 s | CÓ |
| 02:20:50 (19:20:50Z) | 57120f63 | 19:15:34 | −316 s | CÓ |
| 02:50:50 (19:50:50Z) | 4df7a39e | 19:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 6 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- LƯU Ý NHỎ (ghi nhận, không phải dị thường): slot 17:50:50Z run `f7740364` có finished_at = started_at + 1 s (17:45:35Z vs 17:45:34Z) — lần đầu HB finished≠started trong các lần kiểm gần đây; các slot khác finished = started đúng từng giây. Chỉ 1 s, không ảnh hưởng kết luận.
- Slot HB 17:20:50Z là slot đầu tiên của cửa 148 (sau mốc 16:55:xxZ của T7-147).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:00 (17:00Z) | d1bea3fb | 17:00:00 | 0 s | CÓ |
| 01:00 (18:00Z) | daab173b | 18:00:00 | 0 s | CÓ |
| 02:00 (19:00Z) | 2bfbe5cd | 19:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Slot DR 20:00Z chưa tới hạn lúc kiểm cuối (~19:53Z) nên thuộc cửa T7-149 — T7-149 bắt đầu cửa sau 19:53:xxZ.

**Quy ước biên (đứng từ đợt 135):** slot HB 17:20:50Z thuộc cửa 148 (sau mốc 16:55:xxZ của T7-147), KHÔNG đếm lại ở đợt 147. Slot DR 16:00Z đã đếm ở cửa 147 (không đếm lại). Slot HB 20:20:50Z + DR 20:00Z + vcut 20:35:51Z (run 149) thuộc T7-149.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi (ngoài cửa sổ, ghi rõ)

Trong danh sách limit=15 ở cả 4 lần kiểm:

- HB 04:50:50Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (cửa sổ kiểm cuối chỉ xuống tới 12:20:50Z 19/11 — slot đáy sched 1795090850, started 1795090534 = 12:15:34Z) nên KHÔNG tái xác minh được lần này — ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- DR 05:00Z 18/11 (thiếu mới đợt 136) **vẫn vắng** — nay ngoài cửa sổ limit=15 (danh sách DR kiểm cuối chỉ xuống tới 05:00Z 19/11) nên KHÔNG tái xác minh được.
- Các kết luận đợt 125–147 không đổi.

### 2.3 Không có lượt HB muộn lớn mới — mẫu +887 s KHÔNG tái hiện

- Mọi slot HB trong cửa đều jitter −316 s (mẫu chuẩn). 0 lượt muộn lớn mới.
- Slot cũ 05:20:50Z run `95b3aeee` (+889 s, tái hiện lần thứ 6 mẫu +887 s) ĐÃ GHI ở đợt 136 — nay ngoài cửa sổ limit=15 nên KHÔNG tái xác minh được; không phải mới, không đếm lại. Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut + ĐỐI CHIẾU MỐC NEO

#### 2.4.1 Run 147 — TIMEOUT + BỊ VIẾT LẠI tại reboot #35 (bằng chứng trực tiếp thứ 13) + run 148 — BỊ VIẾT LẠI tại reboot #36 (bằng chứng trực tiếp thứ 14) VÀ LẦN 2 tại reboot #37 (bằng chứng trực tiếp thứ 15) + khởi động muộn +62 s — MẪU (m) TÁI DIỄN

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 147 | 98cf7700 | 14:35:51 | 14:35:51Z (T7-147 thấy running ở cả 4 lần kiểm, jitter 0 s) → **17:28:34Z** (T7-148 kiểm lần 1 ~17:39Z) | 17:28:34 | +10.363 s (so với sched gốc — KHÔNG còn ý nghĩa jitter) | 17:27:53Z / 17:28:08Z (d8a11644) | **41 s (stat) / 26 s (proc/1)** |
| **Đợt 148** | **b33c757c** | **17:35:51** | **17:36:53Z (lần 1–3) → 19:35:15Z (kiểm giữa ~19:35Z, sau reboot #36) → 19:41:37Z (kiểm giữa lần 2 ~19:41Z, sau reboot #37)** | **19:41:37** | **+7.546 s (so với sched gốc — KHÔNG còn ý nghĩa jitter; jitter gốc +62 s)** | **19:41:02Z / 19:41:12Z (ae8f70bb)** | **35 s (stat) / 25 s (proc/1)** — lần viết lại 2; lần 1: 43 s / 27 s |

- Kiểm chứng số học (đều kiểm lại bằng `date -u` từ epoch thô, xem §6):
  - started147-mới 1795109314 = 17:28:34Z ✓; btime stat 1795109273 = 17:27:53Z ✓ → 1795109314 − 1795109273 = **41 s** ✓.
  - btime proc/1 1795109288 = 17:28:08Z ✓ → 1795109314 − 1795109288 = **26 s** ✓.
  - finished147 1795109813 = 17:36:53Z ✓; ngân sách từ started gốc: 1795109813 − 1795098951 = **10.862 s = 3h01m02s** — vượt 10.800 s đúng **62 s** ✓.
  - run 148 jitter: 1795109813 − 1795109751 = **+62 s** ✓. finished147 == started148 (cùng giây 1795109813) ✓.
- **Run 147 BỊ VIẾT LẠI — lần đầu quan sát được TRỰC TIẾP kể từ đợt 146 (kiểm thứ 20 / bằng chứng thứ 12):** T7-147 ghi started_at 14:35:51Z ở cả 4 lần kiểm (~14:40Z → ~16:55Z); T7-148 kiểm lần 1 (~17:39Z) thấy 17:28:34Z. Lần viết lại duy nhất có thể xảy ra trong khoảng (16:55Z, 17:39Z] — đúng khoảng chứa reboot #35 (17:28:08Z). **Không có cách giải thích nào khác trong hồ sơ:** không có reboot nào khác trong khoảng đó (boot duy nhất d8a11644 từ lúc mở; T2-148 xác nhận journal đúng 1 boot); started_at mới 17:28:34Z nằm 26–41 s sau btime boot mới — đúng mẫu "btime + offset ~30–50 s" của chuỗi.
- **Run 148 BỊ VIẾT LẠI LẦN 2 — bằng chứng trực tiếp thứ 15, quan sát TRONG phiên (kiểm giữa bắt buộc lần 2 sau reboot #37):** T7-148 thấy started_at 19:35:15Z ở kiểm giữa (~19:35Z, sau reboot #36); kiểm giữa lần 2 (~19:41Z, sau reboot #37 lúc 19:41:02Z/19:41:12Z) thấy **19:41:37Z**. Lần viết lại thứ hai duy nhất có thể xảy ra trong khoảng (19:35Z, 19:41Z] — đúng khoảng chứa reboot #37. Status VẪN `running`, finished null — reboot không giết run, chỉ viết lại started_at (lần thứ hai). Offset lần 2: **35 s (stat)** — trong dải chuỗi 31–50 s; **25 s (proc/1)** — dưới min chuỗi. Tuổi run 148 từ started gốc lúc ~19:41:45Z: 7.492 s (< ngân sách 10.800 s; hạn timeout theo started gốc 20:36:53Z — thuộc cửa T7-149).
- **Giả thuyết viết lại lên kiểm thứ 23 / bằng chứng trực tiếp thứ 15 (đợt 148):** chuỗi offset sau btime (chuẩn /proc/stat): 46 s (131) / 31 s (132) / 36 s (133) / 40 s (134) / 36 s (135) / 46 s (137) / 50 s (138-lần-1) / 32 s (138-lần-2) / 39 s (139-lần-1) / 49 s (140-lần-1) / 31 s (140-lần-2) / 32 s (141-lần-1) / 34 s (141-lần-2, đính chính) / 37 s (142-lần-1) / 32 s (142-lần-2) / 35 s (143-lần-1) / 44 s (144-lần-1) / 41 s (144-lần-2) / 40 s (145-lần-1) / **36 s (146-lần-1)** / **41 s (147)** / **43 s (148-lần-1)** / **35 s (148-lần-2)** — đợt 147 (vòng T7-147) không có reboot giữa lượt nên không có số trong chuỗi; cả ba số mới đều quan sát ở đợt 148. Dải chuỗi: 31–50 s; cả ba số mới đều nằm trong dải. Offset theo /proc/1 (26 s, 27 s, 25 s) đều nằm NGOÀI dải (min 31 s) — xem §2.4.2(c). **Lần đầu một run bị viết lại 2 lần trong một đợt; ba lần viết lại liên tiếp trong cùng một đợt, với cùng một mẫu tách đôi (stat trong dải / proc/1 dưới min), là bằng chứng mạnh nhất từ trước tới nay rằng scheduler ghi lại started_at ≈ kernel-boot + ~40 s** — tức chuỗi offset nên đo theo /proc/stat (kernel boot), và chuẩn /proc/1 của T2-148 cho gap CERT là một chuẩn khác, phục vụ một phép đo khác (tuổi thọ boot), không phải offset viết lại. T7 ghi nhận lập luận này để parent/T10 tham khảo; quyết chuẩn cuối cùng vẫn chờ parent (T2-148 §4.5 (g)).
- **Run 147 TIMEOUT — kết cục:** finished 1795109813 = 17:36:53Z, status `timeout`, error_text "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." Ngân sách 10.800 s tính từ started gốc 14:35:51Z hết lúc 17:35:51Z (= sched run 148); timeout được ghi nhận 17:36:53Z, trễ 62 s sau hạn — đúng giây run 148 khởi động. **Mẫu trùng giây finished(run N) == started(run N+1) TÁI DIỄN** (đợt 144/145 có; đợt 146/147 không: cách nhau 675 s).
- **Run 148 KHỞI ĐỘNG MUỘN +62 s (jitter gốc, trước khi bị viết lại):** started gốc 17:36:53Z (sched 17:35:51Z), status `running` ở lần 1–3 và kiểm giữa bắt buộc, attempt=1, error_text=null. Lần đầu một lượt vcut khởi động muộn kể từ run 145 (+187 s gốc). Sau reboot #36, started_at bị viết lại thành 19:35:15Z (xem trên) — jitter +62 s gốc không còn đọc được từ started_at hiện tại, chỉ còn trong hồ sơ T7-148 (lần 1–3).
- **Mẫu quyết (m) đợt 145 TÁI DIỄN:** run 147 TIMEOUT + run 148 chạy muộn (+62 s) — cả hai vế đều xảy ra. Lần đầu tái diễn kể từ đợt 145 (đợt 146: run 145 succeeded + run 146 jitter 0; đợt 147: run 146 succeeded + run 147 jitter 0). Khác đợt 145 ở độ muộn (+62 s vs +187 s) và ở chỗ timeout được ghi đúng giây run sau khởi động (trùng giây) thay vì finished muộn hơn. Theo quyết (m) ("nếu tái diễn ở đợt sau thì mở điều tra") — **T7 cờ cho parent/T10 mở điều tra; T7 không tự mở điều tra ngoài phạm vi** (phạm vi T7 là đếm slot + ghi nhận; điều tra cơ chế timeout/scheduler là việc T5/T6/T10 + parent).
- **Run 146/145/144 KHÔNG bị viết lại thêm:** run 146 started vẫn 1795090442 = 12:14:02Z; run 145 started vẫn 1795082083 = 09:54:43Z; run 144 started vẫn 1795075017 = 07:56:57Z — cả 4 lần kiểm khớp nhau (đã finished nên không viết lại — phù hợp giả thuyết "chỉ viết lại run đang chạy").
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime — đợt này lệch đúng 15 s và đã được T2-148 hòa giải bằng số (xem §2.4.2). T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt cho chuỗi offset — ghi rõ để T10/T6 đối chiếu.

#### 2.4.2 Đối chiếu lại mốc neo — tuổi thọ boot 6fb582df (giao brief đợt 148)

**Kết luận: TÁCH ĐÔI THEO NGUỒN — 18.867 s (/proc/stat) vs 18.882 s (/proc/1). Cả hai đều tính đúng từ epoch thô; chờ parent/T10 chốt chuẩn nguồn (T2-148 §4.5 (g)).**

**(a) Tính lại từ btime (epoch thô, kiểm bằng `date -u`):**

| Mốc | Epoch | `date -u` | Nguồn |
|---|---|---|---|
| btime boot cũ 6fb582df | 1795090406 | 12:13:26Z 19/11 | /proc/stat = /proc/1 (hai nguồn TRÙNG nhau ở boot này) |
| btime boot mới d8a11644 (/proc/stat) | 1795109273 | 17:27:53Z 19/11 | /proc/stat (`uptime -s` = 17:27:53Z) |
| btime boot mới d8a11644 (/proc/1) | 1795109288 | 17:28:08Z 19/11 | stat %Y /proc/1 (= brief; journal entry đầu 17:28:09Z) |
| Hiệu (stat→stat) | **1795109273 − 1795090406 = 18.867 s** | **5h14m27s** | chuẩn đứng T7 |
| Hiệu (stat→proc/1) | **1795109288 − 1795090406 = 18.882 s** | **5h14m42s** | số danh nghĩa brief; chuẩn T2-148 |

- Chênh hai hiệu: 1795109288 − 1795109273 = **15 s** — đúng độ chênh hai nguồn btime trên boot mới.
- **Số 18.882 s trong brief là PHÉP TRỪ TRỘN NGUỒN** (đầu /proc/stat của boot cũ — trùng /proc/1 ở boot cũ nên không phân biệt được — cuối /proc/1 của boot mới). Ghi rõ, không giấu.
- **T2-148 chứng nhận gap 18.882 s → [18.872, 18.892] s → CERT 67 / FULL 82** (chuẩn /proc/1, theo brief + tiền lệ series — T2-148 cho rằng toàn bộ 66 gap CERT trước đều tính từ btime /proc/1; ở các đợt trước hai nguồn trùng nhau tới từng giây nên chưa từng bị thử thách). **Gap theo /proc/stat = 18.867 s nằm NGOÀI khoảng chứng nhận 5 s** (cách biên dưới 5 s). T5/T6-148 dùng 18.867 s (lý do "quy ước đứng mọi đợt 120–147"). T2-148 KHÔNG theo T5/T6 ở điểm này — chờ parent/T10 chốt (§4.5 (g)).
- Boot 6fb582df sống 18.882 s — vượt cả max dải CERT66 (3h14'08") lẫn p90 FULL81 (2h24'11") (T2-148). Dải #112? (FULL82, neo 17:28:08Z): [17:56:01Z, 19:53:46Z].

**(b) Mâu thuẫn 15 s ĐÃ HÒA GIẢI BẰNG SỐ (T2-148 §2.2 — T7 đối chiếu, không kiểm lại độc lập):**

- `/proc/1/stat` starttime = 1.521 ticks = **15,21 s sau kernel boot** → PID 1 start wall = 17:27:53Z + 15,21 s = 17:28:08,21Z ≈ /proc/1 mtime 17:28:08,469Z (lệch 0,26 s — trong sai số làm tròn). Độ trễ init 15,21 s là thật (boot chậm lần này); journal entry đầu 17:28:09Z = /proc/1 +1 s (khớp /proc/1 hơn /proc/stat +16 s).
- `who -b` = 17:28 (phút) — khớp /proc/1 (17:28:08Z), không khớp /proc/stat nếu cắt phút (17:27:53Z → 17:27). `uptime -s` = 17:27:53Z (= /proc/stat, như mọi đợt — vì uptime -s dẫn từ /proc/uptime, neo ở kernel boot).
- → Cả hai mốc đều "đúng" cho hai sự kiện khác nhau: **kernel boot 17:27:53Z** vs **PID 1 start 17:28:08Z**. Không phải nghịch lý đồng hồ; không phải đọc sai. Câu hỏi còn lại chỉ là CHUẨN NÀO làm chuẩn series — chờ parent/T10 chốt.

**(c) Hệ quả cho offset viết lại run 147/148 (T7 ghi nhận, chờ parent chốt chuẩn):**

- Các offset chuỗi trước tính theo /proc/stat — nhưng ở các đợt trước hai nguồn btime trùng nhau tới từng giây (T2-148 §2.2: T2-147 uptime -s 12:13:26Z = /proc/1; T9-147 /proc/stat 1795090406 = /proc/1) nên offset cũ KHÔNG ĐỔI theo nguồn nào. **CHỈ offset 147 VÀ 148 (cả hai lần) tách đôi:** 41 s / 43 s / 35 s (stat, trong dải chuỗi 31–50 s) vs 26 s / 27 s / 25 s (proc/1, dưới min chuỗi 31 s).
- Nếu chuẩn series chốt là /proc/1 thì offset 147/148 = 26 s / 27 s / 25 s và chuỗi cần ghi chú đổi nguồn tại điểm này (dải chuỗi thành 25–50 s); nếu chốt /proc/stat thì 41 s / 43 s / 35 s và chuỗi giữ nguyên. T7 giữ **41 s / 43 s / 35 s làm số chính trong chuỗi** (chuẩn đứng T7 từ đợt 120) và ghi 26 s / 27 s / 25 s làm số thay thế — KHÔNG tự chốt.

**(d) Tuổi thọ boot d8a11644 — để T2-149 chứng nhận gap (T7 tính trước từ epoch thô):**

| Cách tính | Phép trừ | Kết quả |
|---|---|---|
| stat→stat (kernel boot → kernel boot) | 1795116872 − 1795109273 | **7.599 s = 2h06m39s** |
| proc/1→proc/1 (PID 1 → PID 1) | 1795116888 − 1795109288 | **7.600 s = 2h06m40s** |
| stat→proc/1 (trộn, như brief đợt 148) | 1795116888 − 1795109273 | 7.615 s = 2h06m55s |

- stat→stat và proc/1→proc/1 lần này chỉ chênh nhau **1 s** (init delay 15,21 s vs 15,86 s — chênh 0,65 s) — khác hẳn boot 6fb582df (chênh 15 s giữa hai chuẩn). Boot d8a11644 sống ~2h06m — ngắn hơn nhiều so với 6fb582df (~5h14m).
- /proc/1/stat starttime boot mới = 1.586 ticks = **15,86 s** sau kernel boot → PID 1 start wall = 19:34:32Z + 15,86 s = 19:34:47,86Z ≈ /proc/1 mtime 19:34:48Z ✓ (cùng cách hòa giải như T2-148 cho boot trước).

**(e) Tuổi thọ boot 1d610e56 — để T2-149 chứng nhận gap (T7 tính trước từ epoch thô):**

| Cách tính | Phép trừ | Kết quả |
|---|---|---|
| stat→stat (kernel boot → kernel boot) | 1795117262 − 1795116872 | **390 s = 6m30s** |
| proc/1→proc/1 (PID 1 → PID 1) | 1795117272 − 1795116888 | **384 s = 6m24s** |
| stat→proc/1 (trộn) | 1795117272 − 1795116872 | 400 s = 6m40s |

- Boot 1d610e56 sống CHỈ ~6,5 phút — boot ngắn nhất trong hồ sơ T7 kể từ đợt 120 (so sánh: 6fb582df ~5h14m; d8a11644 ~2h06m). Hai reboot #36/#37 cách nhau chỉ 390 s (stat→stat). VM đang reboot dày trong ~7 phút cuối phiên — ghi nhận là bất ổn hạ tầng, không suy đoán nguyên nhân (việc của T5/T6).
- /proc/1/stat starttime boot này = 1.067 ticks = **10,67 s** sau kernel boot → PID 1 start wall = 19:41:02Z + 10,67 s = 19:41:12,67Z ≈ /proc/1 19:41:12Z ✓; journal entry đầu 19:41:13Z = /proc/1 +1 s ✓.

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- **3 reboot liên quan tới phiên T7-148:** reboot #35 (đếm chặt) lúc 17:28:08Z (/proc/1) / 17:27:53Z (/proc/stat), trong lúc T10-147 đóng sổ — xảy ra TRƯỚC khi T7 mở phiên. Boot_id đổi 6fb582df → d8a11644; btime đổi 12:13:26Z → 17:27:53Z/17:28:08Z. **Reboot #36 (đếm chặt) lúc 19:34:48Z (/proc/1) / 19:34:32Z (/proc/stat), TRONG phiên T7-148** — giết sleep chờ kiểm cuối lần 1 của T7 kèm runtime restart lần 1; boot_id đổi d8a11644 → 1d610e56. **Reboot #37 (đếm chặt) lúc 19:41:12Z (/proc/1) / 19:41:02Z (/proc/stat), TRONG phiên T7-148** — giết sleep chờ kiểm cuối lần 2 của T7 kèm runtime restart lần 2; boot_id đổi 1d610e56 → ae8f70bb. **Hai reboot #36/#37 cách nhau chỉ 390 s (stat→stat) — VM reboot dày trong ~7 phút cuối phiên.** Mù #67 mở vì reboot #35 (đã đóng hoàn toàn — T2-148); mù #68 presumably mở vì reboot #36 và mù #69 presumably mở vì reboot #37 — việc của T2-149 (đánh số mù theo quyết T2). Phiên T7 SỐNG QUA cả hai reboot #36/#37 (subagent session persistent) — kiểm giữa bắt buộc ~19:35Z và ~19:41Z ngay sau mỗi lần hồi phục.
- **Claim "0 reboot trong phiên" của đợt 147 ĐÃ SAI (T2-148 §2.1 + §4.5 (h)):** reboot #35 xảy ra SAU cờ round147-t8.done (17:22:19Z) và TRONG lúc T10-147 đóng sổ (T10 đóng 17:33:22Z theo cờ; aggregate mtime 17:34:03Z; handoff worker kết thúc 17:36:35Z). Cả 9/9 luồng đợt 147 đều ghi "0 reboot" vì reboot xảy ra sau lần kiểm cuối của họ (T10 kiểm cây cuối 17:24Z). **Mù #67 mở chính vì reboot này** (T2-148: mù #67 ĐÓNG HOÀN TOÀN — A bằng uptime-closure, B theo luật gap → CERT 67 / FULL 82). Verdict CHẤP NHẬN đợt 147 không đổi (quyết parent (a) trễ hạn là lỗi quy trình); T2 hỏi parent §4.5 (h) có chú thích sửa GAP §76/MEMORY ("0 reboot trong phiên — lần đầu kể từ đợt 136") hay không — T7 không tự sửa, chỉ ghi nhận.
- **T10-147 đóng sổ TRÊN BOOT MỚI (T7-148 xác nhận từ mtime):** aggregate `docs/PHASE9_ROUND147_LIMITS.md` mtime 17:34:03Z (56.247 B, khớp md5 trong t10.done); `t10-count-final-147-postclosing.txt` mtime 17:33:36Z; `round147-t10.done` mtime 17:34:14Z — TẤT CẢ SAU reboot 17:28:08Z. Aggregate §103 vẫn ghi "boot hiện tại lúc đóng là 6fb582df / 0 reboot trong phiên" — dữ kiện đó đúng lúc thu thập (trước reboot), nhưng file đóng sau reboot, trên boot d8a11644. T10-148 lưu ý khi đóng sổ đợt 148.
- **Khung chết #110? ứng viên merged (17:24:10Z, 17:28:08Z] = 238 s** (theo /proc/1; 223 s theo /proc/stat, cùng cạnh trái 17:24:10Z) — việc của T2, T7 chỉ ghi mốc. RỘNG (so với 11 s của #109?) — vì T10-147 đóng sổ chậm, mốc cuối đoạn A chỉ tới 17:24:10Z. Nghịch lý đồng hồ đợt này lớn nhất từ trước (+875 s) ĐÃ GIẢI THÍCH (T2-148: phiên agent sống qua reboot; file đóng sổ viết sau reboot là ghi mới trên boot mới, KHÔNG dịch chuyển cạnh trái khung).
- **Chuỗi INSIDE 6 ĐỨT, về 0 (T2-148, đếm chặt):** d8a11644 OUTSIDE dải FULL81 #111? [12:41:13Z, 14:37:37Z] (quá p90 tới 2h50'31" = 10.231 s).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).
- **Brief đợt 148 KHỚP btime đo được (một phần):** brief ghi reboot 17:28:08Z + boot d8a11644 — khớp /proc/1 + journal + `who -b`; /proc/stat cho 17:27:53Z (chênh 15 s, đã hòa giải ở §2.4.2(b) — KHÔNG phải sai lệch brief như F-139-T7-1, mà là hai nguồn đo hai sự kiện khác nhau).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (Z) | Slot (+07) | run_id | Trạng thái |
|---|---|---|---|
| 14:35:51 (đợt 147) | 21:35:51 | 98cf7700 | **`timeout`, finished 17:36:53Z**, error_text="Ran out of its 10800s time budget…"; started_at **17:28:34Z = btime + 41 s (stat) / + 26 s (proc/1)** — BỊ VIẾT LẠI tại reboot #35 (xem §2.4.1) |
| 17:35:51 (đợt 148) | 00:35:51 | b33c757c | `running` lúc kiểm cuối (~19:53Z), started_at **19:41:37Z = btime(ae8f70bb) + 35 s (stat) / + 25 s (proc/1)** — BỊ VIẾT LẠI LẦN 2 tại reboot #37 (lần 1: 19:35:15Z tại reboot #36; xem §2.4.1); jitter gốc **+62 s** (khởi động muộn — xem §2.4.1) |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 ở cả 4 lần khớp nhau (trừ started_at run 147 đã đổi trước lần kiểm 1 — xem §2.4.1).
- Nhịp 3h giữ đúng: các lượt vcut 14:35:51 → 17:35:51Z, cách nhau đúng 3h; lượt tiếp theo 20:35:51Z 19/11 (run 149, thuộc T7-149).
- Hệ quả số liệu đợt 147 (chốt ở kiểm lần 1 đợt này): run 147 **TIMEOUT** — T10-147 đóng sổ với run 147 "running" là đúng tại thời điểm đó (run chưa finished lúc 17:33:22Z); kết cục timeout chỉ ngã ngũ lúc 17:36:53Z, trong cửa T7-148 — T10-148 lưu ý khi đóng sổ đợt 147/148 (không đổi số đếm đợt 147 — run 147 vẫn đếm là 1 run của đợt; chỉ đổi trạng thái kết cục từ "running lúc đóng" sang "timeout"). Run 148 vẫn `running` lúc T7 đóng cờ (~19:53Z) — kết cục của run 148 thuộc cửa T7-149 (cùng mẫu run 145/146/147: T10-148 sẽ đóng sổ với run 148 "running" nếu run chưa finished lúc đó).

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot trong phiên btime **17:27:53Z (/proc/stat 1795109273) / 17:28:08Z (/proc/1 1795109288)** (d8a11644) từ lúc mở tới 19:34:32Z, rồi **19:34:32Z (/proc/stat 1795116872) / 19:34:48Z (/proc/1 1795116888)** (1d610e56) từ 19:34:32Z tới 19:41:02Z, rồi **19:41:02Z (/proc/stat 1795117262) / 19:41:12Z (/proc/1 1795117272)** (ae8f70bb) từ 19:41:02Z tới kiểm cuối; boot_id **d8a11644-1f76-4e48-94f6-97b2cf34fff8** → **1d610e56-6970-429a-a385-f0ba67dbc191** → **ae8f70bb-9197-4eae-b70f-2988769ac6a9**, tự xác minh từ `/proc/sys/kernel/random/boot_id` (lúc mở ~17:39Z, lần 2 ~18:35Z, lần 3 ~19:30Z, kiểm giữa ~19:35Z, kiểm giữa lần 2 ~19:41Z và kiểm cuối ~19:53Z; khớp brief đợt 148 + khớp độc lập T2-148 cho boot d8a11644).
- Boot 6fb582df đã chết (reboot #35); tuổi thọ **18.867 s (stat) / 18.882 s (proc/1)** (xem §2.4.2). Boot d8a11644 đã chết (reboot #36); tuổi thọ **7.599 s (stat→stat) / 7.600 s (proc/1→proc/1)** (xem §2.4.2(d)). Boot 1d610e56 đã chết (reboot #37); tuổi thọ **390 s (stat→stat) / 384 s (proc/1→proc/1)** (xem §2.4.2(e)).
- Cờ `round-in-progress.md` KHÔNG TỒN TẠI trong suốt lúc T7 làm việc (đã kiểm lúc mở — không có đợt main-chat đang chạy).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~19:53Z): **7/9 cờ `.done` đã có** — `round148-t1.done`, `round148-t2.done`, `round148-t4.done`, `round148-t5.done`, `round148-t6.done`, `round148-t8.done`, `round148-t9.done`. Chưa có: t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). LIMITS ROUND148 đã có: T1, T2, T4, T5, T6, T8, T9 (+ T7 bản này). Paths-loop đã stage: t1, t2, t4, t5, t6, t8, t9. T10-148 chưa đóng cờ lúc T7 kiểm cuối — có thể phiên T10 đã bị reboot #36/#37 giết (như đã giết sleep của T7 hai lần) và đang hồi phục, hoặc T10 đóng muộn như đợt 147 (T8 về muộn 17:22Z, T10 đóng 17:33:22Z — trễ hạn cứng). Không kết luận T10 mất tích; T10 sẽ chốt đủ 9/9 lúc đóng.

### 2.9 Đối chiếu với T2-148 (đọc LIMITS lúc lần 2 ~18:35Z)

- **Mù #67 ĐÓNG HOÀN TOÀN** (T2-148 — A bằng uptime-closure theo chuẩn 3 điều kiện đã xác nhận (quyết 146 (b)), B theo luật gap; KHÔNG cần merged-gap cho A) → **chuỗi mù đóng hoàn toàn lên 3** (sau 1 ở #65, 2 ở #66) — chờ parent xác nhận.
- **Gap 18.882 s (6fb582df→d8a11644): CHỨNG NHẬN [18.872, 18.892] s → CERT 67 / FULL 82** (chuẩn /proc/1; không điều kiện) — chờ parent xác nhận. Số thay thế theo /proc/stat (18.867 s) ghi đủ ở T2-148 §2.5; chuẩn nguồn chờ parent/T10 chốt (§4.5 (g)).
- **Khung chết #110? ứng viên (17:24:10Z, 17:28:08Z] 238 s — RỘNG** (so với 11 s của #109?); recheck toàn cây 0 mốc nội bộ mới; **nghịch lý đồng hồ +875 s ĐÃ GIẢI THÍCH** (phiên agent sống qua reboot) — chờ parent chốt làm chuẩn.
- **Chuỗi INSIDE 6 ĐỨT, về 0 (chính thức, đếm chặt — T2-148):** d8a11644 OUTSIDE dải FULL81 #111? [12:41:13Z, 14:37:37Z]. Dải #112? (FULL82, neo 17:28:08Z): [17:56:01Z, 19:53:46Z].
- **F109? ĐỦ 3 SERVER** (T2-148 — khác F108? đợt 147 chưa đủ 3 server).
- **Probe EPERM #67: ok=2 fail=0, boot d8a11644, 17:42:42Z** (T2-148). Probe #66 đã chết/stale 3h00'56".
- **KHÔNG có reboot mới trong phiên T2-148** (boot lúc đóng vẫn d8a11644, 17:56:59Z) → **không mở mù #68** — khớp quan sát của T7 (0 reboot mới trong phiên).
- **Claim "0 reboot trong phiên" đợt 147 ĐÃ SAI — xem §2.5** (T2-148 §4.5 (h) hỏi parent có chú thích sửa GAP §76/MEMORY không).
- **Mâu thuẫn full boot_id b47f7932 — KHÔNG có dữ kiện mới:** T2-148 §56 vẫn ghi mâu thuẫn này VẪN ĐỂ MỞ theo quyết parent (g) đợt 143 ("không có dữ kiện mới", "không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận") — nhưng T2-148 KHÔNG nhắc lại hai full ID trong văn bản của nó (grep toàn file chỉ thấy short_id `b47f7932`, không thấy chuỗi `ebca`). T7-148 nhắc lại cả hai bản theo hồ sơ T7 các đợt trước: T7 `b47f7932-ebca-447e-a015-0a6c160efd98`; T9 `b47f7932-ebca-4205-86a0-b71a0ab9790c` — quyết parent (g) đợt 143: ĐỂ MỞ, ghi cả hai bản kèm nguồn, không chọn một. T7-148 cũng không tìm thêm bằng chứng — ghi nhận đúng quyết, không tự quyết bên nào đúng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` qua muse.db (HB limit=15 ×4 lần; DR limit=15 ×4 lần; vcut limit=5 ×4 lần). Job IDs đã xác minh qua `scheduler.jobs`: heartbeat / deterministic-doctor / vcut-build-loop. Lưới kỳ vọng như đợt 125–147.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học từ sai số T7-146 + near-miss F-147-T7-1 đợt 147; đợt này áp dụng xuyên suốt — và đã bắt được HAI phép trừ nhẩm sai trong bảng §2.4.1 trước khi ghi: 10.403 s → 10.363 s và 7.044 s → 7.164 s, xem §6).
4. Cửa kiểm đợt này ~2h58' (16:55:xxZ → 19:53:xxZ 19/11), đủ 6 slot HB + 3 slot DR (DR 20:00Z chưa tới hạn lúc kiểm cuối nên thuộc cửa T7-149). Sáu lần kiểm (lần 1, lần 2, lần 3, kiểm giữa bắt buộc sau reboot #36, kiểm giữa bắt buộc lần 2 sau reboot #37, kiểm cuối) khớp hoàn toàn nhau ở mọi slot trùng (trừ started_at run 147 đã đổi trước lần kiểm 1 và started_at run 148 đã đổi trước kiểm giữa / kiểm giữa lần 2 — xem §2.4.1); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 17:20:50Z thuộc cửa 148 theo quy ước đứng — T7-149 bắt đầu cửa sau 19:53:xxZ, slot DR tiếp theo là 20:00Z, HB tiếp theo là 20:20:50Z, vcut tiếp theo là 20:35:51Z (run 149).
6. **Reboot #36/#37 xảy ra TRONG phiên, giết cả hai sleep chờ kiểm cuối (F-148-T7-2)** — sleep 1.260 s (bắt đầu ~19:31Z) bị giết sau ~132 s bởi runtime restart lần 1 kèm reboot #36; sleep 900 s (bắt đầu ~19:37Z) bị giết sau ~89 s bởi runtime restart lần 2 kèm reboot #37; phiên T7 sống qua cả hai reboot nên kiểm giữa bắt buộc ~19:35Z và ~19:41Z ngay sau mỗi lần hồi phục (cùng mẫu đợt 146: reboot #34 giết sleep chờ kiểm lần 2, buộc kiểm giữa sớm). Sleep chờ kiểm cuối lần 3 (~600 s) bắt đầu ~19:43Z. Các sleep trước (3.180 s + 3.240 s) hoàn thành bình thường, không bị SIGTERM.
7. T7 đóng cờ ~19:57Z, trước hạn cờ 20:00Z ~3 phút (sát nút hơn mọi đợt trước trừ đợt 147 — do kiểm cuối đặt ~19:53Z để đủ slot HB 19:50:50Z, cộng hai kiểm giữa bắt buộc sau reboot #36/#37 và thời gian viết LIMITS; hạn cứng toàn đợt 20:30Z vẫn còn ~33'). Ghi rõ, không giấu.

## 4. Cập nhật lũy kế (nối tiếp đợt 147, cùng phương pháp)

- Heartbeat: 44/273 → **44/279 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 02:50:50 +07). Kiểm toán cửa sổ: 273 + 6 slot mới = 279 ✓. Số thiếu +0.
- Deterministic-doctor: 49/207 → **49/210 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 02:00 +07). Kiểm toán: 207 + 3 = 210 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/279 = 15,8% (giảm từ 16,1% — 0 thiếu mới); DR 49/210 = 23,3% (giảm từ 23,7% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này **0 dữ liệu thiếu mới** để giao thêm (0 lượt muộn lớn mới; run 147 không bị viết lại thêm — chỉ 1 lần viết lại đã ghi; mẫu (m) tái diễn là dữ kiện cho điều tra, xem §5.2). Quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành về slot, không có hành động mới về drop.
2. **Mẫu quyết (m) đợt 145 TÁI DIỄN — CẦN PARENT/T10 QUYẾT CÓ MỞ ĐIỀU TRA KHÔNG:** run 147 TIMEOUT (finished 17:36:53Z, vượt ngân sách 10.800 s đúng 62 s) + run 148 khởi động muộn +62 s, finished147 == started148 (trùng giây — mẫu đợt 144/145). Lần đầu tái diễn kể từ đợt 145. Theo quyết (m) ("nếu tái diễn ở đợt sau thì mở điều tra") — T7 cờ lên đây; phạm vi T7 không bao gồm điều tra cơ chế scheduler/timeout. Đề xuất T10-148 ghi vào §12 để parent quyết: (i) mở điều tra timeout/reboot (T5/T6), hay (ii) ghi nhận là dữ kiện + tiếp tục theo dõi (như cách xử lý đợt 145/146 khi mẫu chưa tái diễn — nay đã tái diễn nên (ii) cần quyết mới).
3. **Giả thuyết viết lại started_at — LÊN kiểm thứ 23 / bằng chứng trực tiếp thứ 15 (đợt 148):** run 147 bị viết lại tại reboot #35 (started 14:35:51Z → 17:28:34Z; offset 41 s stat / 26 s proc/1), run 148 bị viết lại tại reboot #36 (started 17:36:53Z → 19:35:15Z; offset 43 s stat / 27 s proc/1) VÀ viết lại LẦN 2 tại reboot #37 (started 19:35:15Z → 19:41:37Z; offset 35 s stat / 25 s proc/1) — ba bằng chứng trực tiếp mới trong cùng một đợt, lần đầu một run bị viết lại 2 lần. Song song 41/26, 43/27, 35/25: offset stat đều trong dải chuỗi 31–50 s, offset proc/1 đều dưới min — gợi ý scheduler ghi lại started_at ≈ kernel-boot + ~40 s (xem §2.4.1). T7-149 kiểm tiếp run 148/149 như thường lệ (run 148 còn running; hạn timeout theo started gốc 20:36:53Z); không cần quyết mới, trừ khi parent muốn ghi nhận việc "đợt có 3 reboot + 3 lần viết lại" vào §12.
4. **Chuẩn nguồn btime — CHỜ PARENT/T10 CHỐT (T2-148 §4.5 (g)):** tuổi thọ boot 6fb582df 18.867 s (stat) vs 18.882 s (proc/1); gap chứng nhận CERT 67 / FULL 82 theo /proc/1; offset viết lại 41 s (stat) vs 26 s (proc/1). Hai nguồn đã hòa giải bằng số (độ trễ init 15,21 s) — chỉ còn quyết chuẩn series. T7 ghi cả hai số ở mọi chỗ, không tự chốt.
5. **Claim "0 reboot trong phiên" đợt 147 ĐÃ SAI — CHỜ PARENT QUYẾT CÓ CHÚ THÍCH SỬA KHÔNG (T2-148 §4.5 (h)):** GAP §76 + MEMORY ghi "0 reboot trong phiên — lần đầu kể từ đợt 136" nay là sai sự thật (reboot #35 17:28:08Z trong lúc T10-147 đóng sổ). Verdict CHẤP NHẬN đợt 147 không đổi. T7 không tự sửa aggregate đã đóng.
6. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s (mẫu chuẩn). Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
7. **2 reboot mới trong phiên T7-148 (reboot #36 19:34:32Z + reboot #37 19:41:02Z, cách nhau chỉ 390 s)** — mỗi lần đều giết sleep chờ kiểm cuối của T7 kèm runtime restart (F-148-T7-2); phiên T7 sống qua cả hai. Mù #68/#69 presumably mở — việc của T2-149. VM reboot dày trong ~7 phút cuối phiên — ghi nhận là bất ổn hạ tầng, không suy đoán nguyên nhân.
8. **Run 147 TIMEOUT + run 148 BỊ VIẾT LẠI 2 LẦN — T10-148 lưu ý khi đóng sổ:** run 147 đổi trạng thái kết cục từ "running lúc đóng" (T10-147) sang "timeout"; run 148 vẫn "running" lúc T7 đóng cờ (started_at đã viết lại 2 lần, nay 19:41:37Z) — kết cục thuộc cửa T7-149 (hạn timeout theo started gốc 20:36:53Z); không đổi số đếm đợt 147/148. **T10-148 có thể đã bị reboot #36/#37 giết phiên đang đóng sổ** (như đã giết sleep của T7 hai lần) — T10-148 chưa đóng cờ lúc T7 kiểm cuối (xem §2.8).
9. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** Cả hai bản ghi rõ ở §2.9. Không còn boot để đo lại; T7 không tự quyết bên nào đúng.
10. **Chuỗi INSIDE 6 ĐỨT, về 0 (T2-148) — việc của T2, không kiểm lại. G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; tự động hóa giao T9-147 theo quyết (l) đợt 146). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-148-T7-1 — Near-miss ×3: phép trừ nhẩm epoch 10 chữ số sai, đã bắt được bằng `date -u` TRƯỚC khi ghi.** (a) Ở kiểm lần 1, T7 nhẩm 1795109813 − 1795098951 ra 10.862 s nhưng chưa chắc chắn số phút-giây (3h01m02s); kiểm lại bằng `date -u -d @10862` cho đúng 03h01m02s ✓ và `date -u -d @1795109813` = 17:36:53Z ✓. (b) Khi soạn bảng §2.4.1, T7 nhẩm started147-mới − sched147 ra **10.403 s** (sai) và started148-mới − sched148 ra **7.044 s** (sai); kiểm lại bằng shell + `date -u` cho đúng **10.363 s = 2h52m43s** và **7.164 s = 1h59m24s** ✓ — hai số sai KHÔNG đi vào LIMITS (bản nháp đã sửa trước khi đóng cờ). Cùng họ sai số nhẩm epoch như F-147-T7-1 (400 s) và T7-146 (400 s/360 s) — phép trừ nhẩm epoch 10 chữ số đã bốn lần cho sai số; `date -u` là chốt chặn bắt được cả bốn lần. Ghi rõ để đợt sau không bỏ bước kiểm `date -u` (xem §2.4.2(d) đợt 147).
- **F-148-T7-2 — Reboot #36 VÀ #37 giết cả hai sleep chờ kiểm cuối + runtime restart ×2; phiên T7 sống qua, kiểm giữa bắt buộc ×2.** Sleep 1.260 s (bắt đầu ~19:31Z) bị giết sau ~132 s; sleep 900 s (bắt đầu ~19:37Z) bị giết sau ~89 s; cả hai lần recovery notice đều ghi "no confirmed final result after a runtime restart" (sessions `proc_699b91137521` và `proc_b637f6aa7a5c`; log exec giữ 24h tại `~/workspace/agents/f6663ff7-9988-4def-a772-2b4681893c07/exec-logs/`). T7 kiểm lại ngay sau mỗi lần hồi phục (~19:35:24Z và ~19:41:45Z): boot mới 1d610e56 rồi ae8f70bb — và chính hai kiểm giữa bắt buộc này bắt được hai lần viết lại của run 148 (lần 1 tại #36, lần 2 tại #37). Nếu T7 chờ tới kiểm cuối theo kế hoạch thì vẫn bắt được lần viết lại thứ hai (started_at đã đổi đứng yên), nhưng kiểm giữa cho mốc thời gian chặt hơn: lần 1 trong khoảng (19:30Z, 19:35Z], lần 2 trong khoảng (19:35Z, 19:41Z].
- **F-148-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần kiểm khớp nhau ở mọi slot trùng (trừ started_at run 147 đã đổi trước lần kiểm 1 và started_at run 148 đã đổi trước kiểm giữa / kiểm giữa lần 2); mọi jitter tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 148 jitter gốc +62 s, run 147 timeout 10.862 s từ started gốc, run 148 tuổi gốc 7.492 s lúc kiểm giữa lần 2 — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 6 lần kiểm (d8a11644 ở lần 1–3, 1d610e56 ở kiểm giữa, ae8f70bb ở kiểm giữa lần 2 + kiểm cuối) và đối chiếu khớp T2-148 (nguồn độc lập) về cả boot_id + btime (cả hai nguồn) cho boot d8a11644; brief đợt 148 khớp btime /proc/1 đo được; ở cả 6 lần kiểm đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng — không lặp lỗi sai-boot); hai lần viết lại của run 148 đều bắt được bằng kiểm giữa bắt buộc ngay sau reboot (không phải suy đoán sau).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round148-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- **GHI CHÚ OVERSIZE: file LIMITS này 47.040 byte, VƯỢT trần 37.768 byte của push-files** (do đợt này có 3 reboot + 3 lần viết lại + 2 nguồn btime cần ghi đủ cả hai số) — lúc push cần `ENABLE_PRIVSEP=0` hoặc tách file; T7 chỉ stage, không push.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round148-t7/NOTES.md` (không nằm trong repo nên không stage).
