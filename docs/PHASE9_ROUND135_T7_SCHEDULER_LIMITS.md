# PHASE9 ROUND135 T7 — CỬA SẠCH, 0 slot thiếu MỚI (HB 7/7, DR 4/4) + started_at đợt 134 KHÔNG bị viết lại lần 2 + slot HB 23:50:50Z QUYẾT DỨT thuộc cửa 134

- **Luồng:** T7 đợt 135 (lượt cron 09:35 +07 18/11/2026 = 02:35:51Z). Boot lúc làm việc: btime **02:27:27Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 02:40Z, 03:05:47Z và 03:25:29Z, trùng nhau cả 3 lần); boot_id **78b55838-d09e-4cfc-b491-a15935b7a447** TỰ XÁC MINH từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt và khớp độc lập với file `round135-t2/boot-verify.txt` của T2). Reboot xảy ra TRƯỚC khi lượt 135 bắt đầu (02:27:27Z < 02:35:51Z), trong khoảng trống giữa đợt 134 và đợt 135.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 23:53:42Z 17/11 (lúc T7 đợt 134 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 134 + cờ `.done` đợt 135 + file `boot-verify.txt`/`status2.txt` của T2 và `status-close.txt` của T6 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA SẠCH — 0 slot thiếu MỚI (đợt 134 gãy 2 thiếu; đợt này sạch lại): heartbeat 7/7, deterministic-doctor 4/4.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 7 | 7 | 0 | 0 |
| deterministic-doctor | 4 | 4 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 134 đã `succeeded`, đợt 135 đang `running`) | — | 0 | — |

**Dị thường muộn: KHÔNG CÓ dị thường mới — mẫu HB +887 s KHÔNG tái hiện** (slot 02:20:50Z chạy đúng giờ 02:15:34Z, jitter −316 s; mẫu dừng ở 5 lần: đợt 127/129/130/132/134).

**Dị thường started_at: kiểm thứ 6 của giả thuyết đã xác nhận — đợt 134 KHÔNG bị viết lại lần 2.** Lượt vcut đợt 134 (run `19a360f1`) vẫn ghi `started_at_utc` 01:31:58Z (+6.967 s = btime 01:31:18Z + 40 s) đúng như T10-134 đã ghi lúc đóng; boot mới 78b55838 (btime 02:27:27Z) KHÔNG viết lại nữa. Lượt 133 (`6f3eba37`) vẫn 21:42:16Z, không đổi dù đã qua thêm 6 reboot. Lượt 135 (`f2fa4088`) started đúng giờ 02:35:51Z, jitter 0 s, đang `running` — chưa có reboot giữa lượt nên chưa có điều kiện viết lại (xem §2.4).

**Quyết dứt slot tồn đọng F-134-T7-1: slot HB 23:50:50Z thuộc cửa 134.** Lũy kế HB sau quyết định giữ **43/191 làm gốc** (không đổi thành 43/190); cửa 135 bắt đầu sau 23:53:42Z (xem §2.1).

- Cập nhật lũy kế (cùng phương pháp đợt 125–134): heartbeat **43/198 slot thiếu** (số thiếu +0, mẫu số +7); deterministic-doctor **48/170 slot thiếu** (số thiếu +0, mẫu số +4).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 23:53:42Z 17/11 → 03:25:29Z 18/11

Cửa kiểm ~3h32'. Ba lần kiểm (lần 1 ~02:41Z, lần 2 ~03:05Z, lần 3 ~03:25Z) **khớp hoàn toàn nhau** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (không áp dụng được theo chiều ngược: không có slot nào vắng để chờ muộn, mọi slot đều đã CÓ từ lần đầu nó tới hạn).

**Heartbeat (lưới :20:50/:50:50Z): 7/7 có, 0 thiếu, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 07:20:50 (00:20:50Z) | c4f630be | 00:15:34 | −316 s | CÓ |
| 07:50:50 (00:50:50Z) | b90848e3 | 00:45:34 | −316 s | CÓ |
| 08:20:50 (01:20:50Z) | ef2e8453 | 01:15:34 | −316 s | CÓ |
| 08:50:50 (01:50:50Z) | 49cc7b04 | 01:45:34 | −316 s | CÓ |
| 09:20:50 (02:20:50Z) | f1009be6 | 02:15:34 | −316 s | CÓ |
| 09:50:50 (02:50:50Z) | 020d9987 | 02:45:34 | −316 s | CÓ |
| 10:20:50 (03:20:50Z) | 34373fc5 | 03:15:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Tất cả 7 lượt jitter −316 s (mẫu chuẩn).

**Deterministic-doctor (lưới :00:00Z): 4/4 có, 0 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 07:00 (00:00Z) | 06b50b20 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | eca924c1 | 01:00:00 | 0 s | CÓ |
| 09:00 (02:00Z) | 27ba2872 | 02:00:00 | 0 s | CÓ |
| 10:00 (03:00Z) | 8576774b | 03:00:00 | 0 s | CÓ |

- Cả 4 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

**Quy ước biên (QUYẾT DỨT F-134-T7-1):** slot HB 23:50:50Z 17/11 (run `ebaefbd0`, started 23:45:34Z, jitter −316 s, `succeeded` — đã xác minh lại còn CÓ trong danh sách limit=15 ở cả 3 lần kiểm) **thuộc cửa 134**. Quy ước áp dụng: "đếm slot có `scheduled_for` ≤ thời điểm kiểm lần cuối" — quy ước T7-133 đã mô tả ("tới lúc kiểm") và T7-134 đã áp dụng nhất quán trong toàn bộ đợt 134 (mẫu số +7 → 43/191). 23:50:50Z ≤ 23:53:42Z (lần kiểm cuối đợt 134) nên thuộc cửa 134; KHÔNG đếm lại ở đợt 135. Phương án thay thế ("cửa đóng ở lần kiểm đầu" → 43/190, slot chuyển sang T7-135) bị BÁC vì sẽ sửa ngược mẫu số đã công bố của đợt 134 mà không có dữ liệu mới nào — dữ liệu (run CÓ, jitter −316 s) không đổi theo cả hai cách, chỉ điểm cắt đổi; giữ điểm cắt đã dùng. T10-134 §12.3 không quyết mục này nên quyết định thuộc T7-135 theo brief đợt 135. Cửa 135 bắt đầu sau 23:53:42Z; slot HB đầu tiên là 00:20:50Z 18/11; slot HB tiếp theo sau cửa này là 03:50:50Z (thuộc T7-136), DR tiếp theo là 04:00Z (thuộc T7-136).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả ba lần kiểm:

- HB 22:50:50Z (thiếu mới đợt 134) **vẫn vắng**; DR 23:00Z (thiếu mới đợt 134) **vẫn vắng** (danh sách DR nhảy từ 22:00Z lên 00:00Z).
- Ngoài cửa sổ limit=15 lần này nên KHÔNG tái xác minh được: HB trước 15:20:50Z 17/11 (gồm 16:20:50Z/16:50:50Z thiếu đợt 132, 13:50:50Z thiếu đợt 129); DR trước 03:00Z 17/11. Ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- Các kết luận đợt 125–134 không đổi.

### 2.3 Mẫu muộn HB +887 s — KHÔNG tái hiện đợt 135

- Slot 02:20:50Z (slot :20:50 của giờ vcut 02:35:51Z — đúng vị trí mẫu các đợt 127/129/130/132/134): run `f1009be6`, started 02:15:34Z, jitter −316 s — chạy ĐÚNG GIỜ, không start :35:37Z trước vcut dispatch. Mẫu +887 s dừng ở **5 lần**; kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 6, KHÔNG có lần viết lại thứ hai

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 130 | 9462a1f3 | 11:35:51 | — | 13:03:22 | +5.251 s | (xem T7-130) | — |
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| **Đợt 134** | **19a360f1** | **23:35:51** | **23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s)** | **01:31:58 (vẫn y như T10-134 ghi lúc đóng)** | **+6.967 s** | **01:31:18Z** | **40 s** |
| Đợt 135 | f2fa4088 | 02:35:51 | — | 02:35:51 (đang `running` lúc kiểm lần 3, 03:25Z) | 0 s | 02:27:27Z (TRƯỚC lượt) | — |

- Kiểm chứng số học đợt 134: 1794965518 − 1794958551 = 6.967 ✓; 01:31:58 − 01:31:18 = 40 s ✓ — khớp đúng giá trị T10-134 đã ghi lúc đóng (01:44Z). **KHÔNG có lần viết lại thứ hai** sau boot mới 78b55838 (btime 02:27:27Z): giá trị đứng yên qua 3 lần kiểm của đợt này (02:41Z, 03:05Z, 03:25Z).
- Lượt 133 (`6f3eba37`): started vẫn 1794951736 = 21:42:16Z, không đổi — dù đã qua thêm 6 reboot sau lần viết lại đầu (81335571, 52ca5d6d, 1d2e984d, cc1f9de0, 8ae55060, 78b55838).
- Lượt 135 (`f2fa4088`): sched 1794969351 = started 1794969351 = 02:35:51Z, jitter 0 s, vẫn `running` lúc kiểm lần 3. Boot 02:27:27Z xảy ra TRƯỚC lượt nên chưa có điều kiện viết lại; nếu có reboot GIỮA lượt 135 (sau 03:25Z) thì T10-135 kiểm lại lúc đóng.
- **Tinh chỉnh giả thuyết (ghi nhận từ kiểm thứ 6 này):** viết lại chỉ xảy ra MỘT lần cho mỗi run, tại reboot đầu tiên xảy ra GIỮA lượt (trong lúc run đang chạy, chưa finished); các reboot sau khi run đã finished KHÔNG viết lại nữa. Bằng chứng: 6f3eba37 đứng yên qua 6 reboot sau lần viết lại đầu; 19a360f1 đứng yên qua boot 78b55838 sau khi finished 02:11:36Z. Chuỗi offset sau btime: 46 s (đợt 131) / 31 s (đợt 132) / 36 s (đợt 133) / 40 s (đợt 134) — lớn nhất vẫn +7.135 s (đợt 132).
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime của boot 8ae55060 là 01:31:29Z, lệch +11 s so với `/proc/stat` btime 01:31:18Z; nếu dùng mốc đó thì offset đợt 134 chỉ còn 29 s. T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt (31/36/40 s đều theo mốc này) — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 134 (không đổi so với T10-134): thời lượng theo mốc ghi nay là 01:31:58Z → 02:11:36Z = 2.378 s; thời lượng tường thật là 23:35:51Z → 02:11:36Z = 9.345 s. Khoảng cách đợt 134 finished (02:11:36Z) → đợt 135 started (02:35:51Z): **1.455 s** (24'15").

### 2.5 Tương quan slot thiếu / muộn với reboot và khung chết (chỉ ghi mốc)

- Reboot **8ae55060 → 78b55838, btime 02:27:27Z**: xảy ra SAU khi đợt 134 finished (02:11:36Z) và TRƯỚC khi đợt 135 started (02:35:51Z) — tức trong khoảng trống giữa hai đợt, KHÔNG phải giữa lượt 135. Theo định nghĩa gộp của T10-133 §10.2 ("mọi reboot quanh đợt"), đây là ứng viên sự kiện tiếp theo sau #13; việc chốt số là của T10-135 (theo F-133-6, dùng MỘT định nghĩa duy nhất — định nghĩa gộp §10.2 — và ghi rõ định nghĩa khi dùng nhãn "lần thứ N").
- **Khoảng trống scheduler (02:15:34Z, 02:35:51Z] (~20'17"):** hoạt động cuối trước khoảng: HB 02:20:50Z start 02:15:34Z; hoạt động đầu sau khoảng: vcut đợt 135 start 02:35:51Z. Btime 02:27:27Z nằm trong khoảng. Đây là khoảng trống BÌNH THƯỜNG giữa hai đợt — không có slot HB/DR nào tới hạn trong khoảng (HB tiếp 02:50:50Z, DR tiếp 03:00Z, cả hai đều SAU khoảng) nên KHÔNG có slot thiếu nào rơi vào đây — khác đợt 134 (khung chết nuốt 2 slot + 1 muộn). Ghi rõ để T2 đối chiếu: khoảng này KHÔNG phải khung chết theo nghĩa đợt 134.
- **Không có reboot mới giữa lượt 135** trong lúc T7 làm việc (btime 02:27:27Z + boot_id 78b55838 giữ nguyên 02:40Z → 03:25Z, kiểm ở cả 3 lần).
- Đối chiếu T2-135 (file `round135-t2/boot-verify.txt` + `status2.txt`, đã đọc): T2 tự xác minh cùng boot **78b55838-d09e-4cfc-b491-a15935b7a447, btime 1794968847 = 02:27:27Z** — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 probe #54 ok=2 fail=0 trên boot này lúc 02:45:23Z; bảng boot của T2 chỉ có 1 boot (first entry 02:27:38Z, last 02:44:05Z) — khớp "không reboot giữa lượt tới 03:25Z". T2 gắn nhãn ứng viên "boot #90?" cho boot này — T7 KHÔNG chốt số tuyệt đối; T6 chốt số boot, T10-135 chốt số sự kiện gộp.
- Đối chiếu T6-135 (file `round135-t6/status-close.txt`, đã đọc): vite lock trống (0 ticket + 80 cooldown) lúc đóng — T6 đã xong (đổi thứ tự ghi log RELEASED/cooldown theo quyết parent §12.3(b) đợt 134). T6 là chủ quản chốt số boot tuyệt đối; T7 không chốt thay.
- Đối chiếu T6-134 (LIMITS §8): chuỗi boot đợt 134 d2e66749 (23:26:58Z) → 81335571 (23:53:17Z) → 52ca5d6d (~00:12:55Z) → 1d2e984d (00:13:50Z) → cc1f9de0 (00:17:36Z) → 8ae55060 (01:31:18Z); boot 8ae55060 là boot viết lại started_at đợt 134 (01:31:58Z = btime + 40 s) — khớp T10-134 §12.

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 06:35:51 18/11 (đợt 134) | 19a360f1 | `succeeded`, finished 02:11:36Z (started_at đã bị viết lại — xem §2.4; KHÔNG viết lại lần 2) |
| 09:35:51 (đợt 135) | f2fa4088 | `running` lúc kiểm lần 3 (~03:25Z), jitter 0 s |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 lần 2 + lần 3 khớp lần 1.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc làm việc btime **02:27:27Z** (`/proc/stat` + `uptime -s` + `who -b` lúc 02:40Z, 03:05:47Z và 03:25:29Z, trùng nhau); boot_id **78b55838-d09e-4cfc-b491-a15935b7a447** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt + khớp độc lập file boot-verify của T2).
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (mở đợt 135 02:35Z, hạn cứng 05:00Z 18/11) — KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~03:25Z): **6/9 cờ `.done` đã có** — `round135-t1.done`, `round135-t2.done`, `round135-t4.done`, `round135-t5.done`, `round135-t6.done`, `round135-t9.done`. Chưa có: t3, t8, t10 (T3/T8 đang làm việc — bình thường giữa lượt; T10 đóng sau cùng). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×3 lần; DR limit=15 ×3 lần; vcut limit=5 ×3 lần). Lưới kỳ vọng như đợt 125–134.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h32' (23:53:42Z 17/11 → 03:25:29Z 18/11), đủ 7 slot HB + 4 slot DR. Không có slot nào vắng nên quy tắc "kiểm 3 lần trước khi kết luận THIẾU" không phải chờ thêm — mọi slot đều CÓ từ lần đầu nó tới hạn; 3 lần kiểm khớp hoàn toàn nhau.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 23:50:50Z thuộc cửa 134 theo quyết dứt ở §2.1 — T7-136 bắt đầu cửa sau 03:25:29Z, slot HB tiếp theo là 03:50:50Z, DR tiếp theo là 04:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 134, cùng phương pháp)

- Heartbeat: 43/191 → **43/198 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 10:20:50 +07). Kiểm toán cửa sổ: 191 + 7 slot mới = 198 ✓. Số thiếu +0.
- Deterministic-doctor: 48/166 → **48/170 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 10:00 +07). Kiểm toán: 166 + 4 = 170 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 43/198 = 21,7% (giảm từ 22,5% — mẫu số tăng, số thiếu đứng yên); DR 48/170 = 28,2% (giảm từ 28,9%).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này sạch nên không có dữ liệu thiếu mới để giao thêm; tương quan khung chết/reboot là việc của T2/T5/T6.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 6: đợt 134 KHÔNG bị viết lại lần 2; lượt 133 đứng yên qua 6 reboot sau; lượt 135 jitter 0 s (chưa có reboot giữa lượt).** Tinh chỉnh giả thuyết: viết lại một lần duy nhất tại reboot đầu tiên giữa lượt (xem §2.4). Chỉ ghi nhận; T5/T6 đối chiếu; T10-135 kiểm lại lượt 135 lúc đóng nếu có reboot giữa lượt sau 03:25Z.
3. **Dị thường muộn HB +887 s: KHÔNG tái hiện đợt 135 (dừng ở 5 lần).** Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 8ae55060 → 78b55838 (btime 02:27:27Z), trong khoảng trống giữa đợt 134 và 135** — ứng viên sự kiện tiếp theo sau #13 theo định nghĩa gộp T10-133 §10.2; T2 gắn nhãn ứng viên "boot #90?" (chưa chốt); T10-135 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối.
5. **Mù #54 (mới mở đợt 134) + mù #53 B mở: việc của T2, không kiểm lại** (T2 đợt 135: probe #54 ok=2 fail=0). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **Không có sai số mới (F-135-T7: KHÔNG CÓ).** 3 lần kiểm khớp hoàn toàn; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` và đối chiếu khớp T2 (nguồn độc lập).
- **F-134-T7-1 ĐÃ ĐÓNG ở đợt này:** slot HB 23:50:50Z quyết dứt thuộc cửa 134 (xem §2.1); lũy kế HB giữ 43/191 làm gốc cho đợt này — không phải sai số mới, là quyết định biên theo quy ước đứng.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round135-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round135-t7/NOTES.md` (không nằm trong repo nên không stage).
