# PHASE9 ROUND136 T7 — CỬA GÃY: 2 slot thiếu MỚI (HB 04:50:50Z + DR 05:00Z) + mẫu muộn +887 s TÁI HIỆN lần thứ 6 (+889 s) + started_at đợt 135 KHÔNG bị viết lại lần 2

- **Luồng:** T7 đợt 136 (lượt cron 12:35 +07 18/11/2026 = 05:35:51Z). Boot lúc làm việc: btime **05:29:18Z** (theo `/proc/stat` + `uptime -s` + `who -b` lúc 05:40Z, 06:08Z và 07:07Z, trùng nhau cả 3 lần); boot_id **1ca1feaa-af3b-41dc-aaae-34376329b0a3** TỰ XÁC MINH từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt và khớp độc lập với file `round136-t2/boot-verify.txt` của T2). Reboot xảy ra TRƯỚC khi lượt 136 bắt đầu (05:29:18Z < 05:35:51Z), trong khoảng trống giữa đợt 135 (finished 04:15:04Z) và đợt 136.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 03:25:29Z 18/11 (lúc T7 đợt 135 kiểm lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 135 + cờ `.done` đợt 136 + file `boot-verify.txt`/`status2.txt` của T2 để đối chiếu). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA GÃY — 2 slot thiếu MỚI (đợt 135 sạch; đợt này gãy lại): heartbeat 6/7, deterministic-doctor 3/4.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 7 | 6 | 1 (04:50:50Z) | 1 (+889 s, 05:20:50Z) |
| deterministic-doctor | 4 | 3 | 1 (05:00Z) | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 135 đã `succeeded`, đợt 136 đang `running`) | — | 0 | — |

**Dị thường muộn: mẫu HB +887 s TÁI HIỆN lần thứ 6** — slot 05:20:50Z chạy muộn +889 s (started 05:35:39Z, 12 s trước vcut dispatch). Mẫu dừng ở 5 lần KHÔNG còn đúng.

**Dị thường started_at: kiểm thứ 7 của giả thuyết đã xác nhận — đợt 135 ĐÃ bị viết lại 1 lần (sau kiểm lần 3 của T7-135), KHÔNG bị viết lại lần 2.** Lượt vcut đợt 135 (run `f2fa4088`) nay ghi `started_at_utc` 03:35:56Z (+3.605 s = btime boot bcc71e61 03:35:20Z + 36 s — T10-135 đã ghi lúc đóng); boot mới 1ca1feaa (btime 05:29:18Z) KHÔNG viết lại nữa. Lượt 136 (`7283f96f`) started đúng giờ 05:35:51Z, jitter 0 s, đang `running` — chưa có reboot giữa lượt nên chưa có điều kiện viết lại (xem §2.4).

- Cập nhật lũy kế (cùng phương pháp đợt 125–135): heartbeat **44/205 slot thiếu** (số thiếu +1, mẫu số +7); deterministic-doctor **49/174 slot thiếu** (số thiếu +1, mẫu số +4).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 03:25:29Z → 07:07:03Z 18/11

Cửa kiểm ~3h42'. Ba lần kiểm (lần 1 ~05:41Z, lần 2 ~06:08Z, lần 3 ~07:07Z) **khớp hoàn toàn nhau ở mọi slot trùng** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU": cả hai slot thiếu đều VẮNG ở cả 3 lần kiểm.

**Heartbeat (lưới :20:50/:50:50Z): 6/7 có, 1 thiếu mới, 1 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:50:50 (03:50:50Z) | 272da8c2 | 03:45:34 | −316 s | CÓ |
| 11:20:50 (04:20:50Z) | 17a38a97 | 04:15:34 | −316 s | CÓ |
| 11:50:50 (04:50:50Z) | — | — | — | **THIẾU MỚI** (vắng cả 3 lần kiểm) |
| 12:20:50 (05:20:50Z) | 95b3aeee | 05:35:39 | **+889 s** | CÓ — MUỘN LỚN |
| 12:50:50 (05:50:50Z) | ccf213c7 | 05:45:34 | −316 s | CÓ |
| 13:20:50 (06:20:50Z) | 8864567f | 06:15:34 | −316 s | CÓ |
| 13:50:50 (06:50:50Z) | dad70f19 | 06:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. 5/6 lượt có jitter −316 s (mẫu chuẩn); chỉ slot 05:20:50Z muộn.

**Deterministic-doctor (lưới :00:00Z): 3/4 có, 1 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 11:00 (04:00Z) | 5925c1da | 04:00:00 | 0 s | CÓ |
| 12:00 (05:00Z) | — | — | — | **THIẾU MỚI** (vắng cả 3 lần kiểm) |
| 13:00 (06:00Z) | 03b12671 | 06:00:00 | 0 s | CÓ |
| 14:00 (07:00Z) | 908c002e | 07:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

**Quy ước biên (đứng từ đợt 135):** slot HB 03:20:50Z thuộc cửa 135 (đã đếm ở 43/198), KHÔNG đếm lại ở đợt 136. Slot HB tiếp theo sau cửa này là 07:20:50Z, DR tiếp theo là 08:00Z (thuộc T7-137).

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả ba lần kiểm:

- HB 22:50:50Z 17/11 (thiếu mới đợt 134) **vẫn vắng**; DR 23:00Z 17/11 (thiếu mới đợt 134) **vẫn vắng** (danh sách DR nhảy từ 22:00Z lên 00:00Z).
- Ngoài cửa sổ limit=15 lần này nên KHÔNG tái xác minh được: HB trước 15:50:50Z 17/11 (gồm 16:20:50Z/16:50:50Z thiếu đợt 132, 13:50:50Z thiếu đợt 129); DR trước 03:00Z 17/11. Ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi. (DR có 1 khoảng trống cũ trong cửa sổ: danh sách nhảy từ 1794938400 xuống 1794931200 — thiếu 1 slot ~15:00Z 17/11 — ngoài cửa kiểm đợt này, không kết luận.)
- Các kết luận đợt 125–135 không đổi.

### 2.3 Mẫu muộn HB +887 s — TÁI HIỆN lần thứ 6 (+889 s)

- Slot 05:20:50Z (slot :20:50 của giờ vcut 05:35:51Z — đúng vị trí mẫu các đợt 127/129/130/132/134): run `95b3aeee`, started 05:35:39Z, jitter **+889 s** — chạy MUỘN, start 12 s TRƯỚC vcut dispatch 05:35:51Z, cùng hình dạng mẫu +887 s (start :35:37Z trước dispatch). Mẫu +887 s dừng ở **5 lần KHÔNG còn đúng — nay là 6 lần** (đợt 127/129/130/132/134/136).
- Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — +889 s chưa phá kỷ lục.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6.

### 2.4 Dị thường started_at lượt vcut — kiểm thứ 7, giả thuyết giữ đúng

| Lượt vcut | run_id | scheduled (Z) | started_at ghi trước | started_at ghi nay | Jitter nay | btime boot liên quan | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| Đợt 133 | 6f3eba37 | 20:35:51 | 20:35:51Z (T7-133 thấy running ~20:45Z) | 21:42:16 | +3.985 s | 21:41:40Z | 36 s |
| Đợt 134 | 19a360f1 | 23:35:51 | 23:35:51Z (T7-134 thấy running ~23:53Z, jitter 0 s) | 01:31:58 | +6.967 s | 01:31:18Z | 40 s |
| **Đợt 135** | **f2fa4088** | **02:35:51** | **02:35:51Z (T7-135 thấy running tới 03:25Z, jitter 0 s)** | **03:35:56** | **+3.605 s** | **03:35:20Z** | **36 s** |
| Đợt 136 | 7283f96f | 05:35:51 | — | 05:35:51 (đang `running` lúc kiểm lần 3, 07:07Z) | 0 s | 05:29:18Z (TRƯỚC lượt) | — |

- Kiểm chứng số học đợt 135: 1794972956 − 1794969351 = 3.605 ✓; 03:35:56 − 03:35:20 (btime boot bcc71e61) = 36 s ✓ — khớp đúng giá trị T10-135 đã ghi lúc đóng (reboot giữa lượt 135, 78b55838 → bcc71e61, sự kiện gộp #15). **Viết lại xảy ra SAU kiểm lần 3 của T7-135 (03:25:29Z), tại reboot đầu tiên giữa lượt** — đúng giả thuyết.
- **KHÔNG có lần viết lại thứ hai:** started_at đợt 135 đứng yên ở 03:35:56Z qua cả 3 lần kiểm đợt này (05:41Z, 06:08Z, 07:07Z) dù đã qua boot mới 1ca1feaa (btime 05:29:18Z, sau khi run finished 04:15:04Z).
- Lượt 134 (`19a360f1`): started vẫn 1794965518 = 01:31:58Z, không đổi. Lượt 133 (`6f3eba37`): vẫn 1794951736 = 21:42:16Z, không đổi. Lượt 132 (`c6948429`): vẫn 1794944086 = 19:34:46Z, không đổi.
- Lượt 136 (`7283f96f`): sched 1794980151 = started 1794980151 = 05:35:51Z, jitter 0 s, vẫn `running` lúc kiểm lần 3. Boot 05:29:18Z xảy ra TRƯỚC lượt nên chưa có điều kiện viết lại; nếu có reboot GIỮA lượt 136 (sau 07:07Z) thì T10-136 kiểm lại lúc đóng.
- **Giả thuyết sau kiểm thứ 7 (không đổi so với đợt 135):** viết lại chỉ xảy ra MỘT lần cho mỗi run, tại reboot đầu tiên xảy ra GIỮA lượt (trong lúc run đang chạy, chưa finished); các reboot sau khi run đã finished KHÔNG viết lại nữa. Chuỗi offset sau btime: 46 s (đợt 131) / 31 s (đợt 132) / 36 s (đợt 133) / 40 s (đợt 134) / **36 s (đợt 135)** — lớn nhất vẫn +7.135 s (đợt 132).
- Caveat btime (T6-134 §8.4(b), T8-134): `/proc/1`-derived btime có thể lệch so với `/proc/stat` btime; T7 dùng `/proc/stat` btime làm chuẩn xuyên suốt các đợt — ghi rõ để T10/T6 đối chiếu.
- Hệ quả số liệu đợt 135 (không đổi so với T10-135): thời lượng theo mốc ghi nay là 03:35:56Z → 04:15:04Z = 2.348 s; thời lượng tường thật là 02:35:51Z → 04:15:04Z = 5.953 s. Khoảng cách đợt 135 finished (04:15:04Z) → đợt 136 started (05:35:51Z): **4.847 s** (1h20'47").

### 2.5 Tương quan slot thiếu / muộn với reboot và khoảng im lặng (chỉ ghi mốc)

- Reboot **bcc71e61 → 1ca1feaa, btime 05:29:18Z**: xảy ra SAU khi đợt 135 finished (04:15:04Z) và TRƯỚC khi đợt 136 started (05:35:51Z) — tức trong khoảng trống giữa hai đợt, KHÔNG phải giữa lượt 136. Theo định nghĩa gộp của T10-133 §10.2 ("mọi reboot quanh đợt"), đây là ứng viên sự kiện tiếp theo sau #15; việc chốt số là của T10-136 (T2 gắn nhãn boot #91? cho bcc71e61; T6 chốt số boot tuyệt đối).
- **Khoảng im lặng phía scheduler (04:15:34Z, 05:35:39Z] (~1h20m):** hoạt động cuối trước khoảng: HB 04:20:50Z start 04:15:34Z (vcut 135 finished 04:15:04Z); hoạt động đầu sau khoảng: HB 05:20:50Z start 05:35:39Z, vcut 136 start 05:35:51Z. Btime 05:29:18Z nằm trong khoảng. Hai slot tới hạn trong khoảng đều **THIẾU** (HB 04:50:50Z + DR 05:00Z) — khác đợt 135 (khoảng trống bình thường, 0 slot tới hạn) và giống đợt 134 (khung chết nuốt 2 slot + 1 muộn). Phân loại khung chết là việc của T2/T5/T6.
- **Không có reboot mới giữa lượt 136** trong lúc T7 làm việc (btime 05:29:18Z + boot_id 1ca1feaa giữ nguyên 05:40Z → 07:07Z, kiểm ở cả 3 lần).
- **Giải quyết chênh btime brief vs đo trực tiếp:** brief mở đợt ghi btime ~05:29:34Z; `/proc/stat` btime = 1794979758 = 05:29:18Z (chênh 16 s); `uptime -s` = 05:29:18, `who -b` = 05:29 — cùng mốc /proc/stat. T2-136 (`round136-t2/boot-verify.txt`) ghi btime 1794979758 = 05:29:18Z (khớp T7) NHƯNG bảng journal của T2 ghi FIRST ENTRY 05:29:34Z — tức ~05:29:34Z là mốc entry journal đầu tiên của boot, không phải btime /proc/stat. Không còn mâu thuẫn; T7 dùng /proc/stat btime 05:29:18Z làm chuẩn xuyên suốt.
- Đối chiếu T2-136 (file `round136-t2/boot-verify.txt` + `status2.txt`, đã đọc): T2 tự xác minh cùng boot **1ca1feaa-af3b-41dc-aaae-34376329b0a3, btime 1794979758 = 05:29:18Z** — KHỚP hoàn toàn với T7 (cùng boot_id + btime, nguồn độc lập). T2 probe #55 ok=2 fail=0 lúc 05:50:26Z trên boot này. T6 là chủ quản chốt số boot tuyệt đối; T7 không chốt thay.
- Đối chiếu T6-136: chưa đọc file đóng của T6 lúc kiểm lần 3 (T6.done đã có — T6 đã xong; T7 không cần đối chiếu thêm vì boot đã khớp T2).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 09:35:51 18/11 (đợt 135) | f2fa4088 | `succeeded`, finished 04:15:04Z (started_at đã bị viết lại 1 lần — xem §2.4; KHÔNG viết lại lần 2) |
| 12:35:51 (đợt 136) | 7283f96f | `running` lúc kiểm lần 3 (~07:07Z), jitter 0 s |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 lần 2 + lần 3 khớp lần 1.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc làm việc btime **05:29:18Z** (`/proc/stat` + `uptime -s` + `who -b` lúc 05:40Z, 06:08:20Z và 07:07:03Z, trùng nhau); boot_id **1ca1feaa-af3b-41dc-aaae-34376329b0a3** tự xác minh từ `/proc/sys/kernel/random/boot_id` (khớp brief mở đợt + khớp độc lập file boot-verify của T2).
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (mở đợt 136 05:35Z, hạn cứng 08:00Z 18/11) — KHÔNG xóa (chỉ T10 xóa).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~07:07Z): **8/9 cờ `.done` đã có** — `round136-t1.done`, `round136-t2.done`, `round136-t3.done`, `round136-t4.done`, `round136-t5.done`, `round136-t6.done`, `round136-t8.done`, `round136-t9.done`. Chưa có: t10 (T10 đóng sau cùng) + t7 (chính T7). Không luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×3 lần; DR limit=15 ×3 lần; vcut limit=5 ×3 lần). Lưới kỳ vọng như đợt 125–135.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h42' (03:25:29Z → 07:07:03Z 18/11), đủ 7 slot HB + 4 slot DR. Cả hai slot thiếu đều VẮNG ở cả 3 lần kiểm nên quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa; 3 lần kiểm khớp hoàn toàn nhau ở mọi slot trùng.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 03:20:50Z thuộc cửa 135 theo quy ước đứng — T7-137 bắt đầu cửa sau 07:07:03Z, slot HB tiếp theo là 07:20:50Z, DR tiếp theo là 08:00Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 135, cùng phương pháp)

- Heartbeat: 43/198 → **44/205 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 13:50:50 +07). Kiểm toán cửa sổ: 198 + 7 slot mới = 205 ✓. Số thiếu +1 (04:50:50Z).
- Deterministic-doctor: 48/170 → **49/174 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 14:00 +07). Kiểm toán: 170 + 4 = 174 ✓. Số thiếu +1 (05:00Z).
- Tỉ lệ thiếu lũy kế: HB 44/205 = 21,5% (giảm từ 21,7% — mẫu số tăng nhanh hơn số thiếu); DR 49/174 = 28,2% (không đổi, làm tròn).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này CÓ dữ liệu thiếu mới để giao thêm: HB 04:50:50Z + DR 05:00Z, cùng nằm trong khoảng im lặng (04:15:34Z, 05:35:39Z] chứa btime reboot 05:29:18Z — tương quan khung chết/reboot là việc của T2/T5/T6.
2. **Mẫu lạ started_at lượt vcut — kiểm thứ 7: đợt 135 ĐÃ bị viết lại 1 lần (btime 03:35:20Z + 36 s), KHÔNG viết lại lần 2 sau boot 1ca1feaa; lượt 136 jitter 0 s (chưa có reboot giữa lượt tới 07:07Z).** Giả thuyết "một lần duy nhất tại reboot đầu tiên giữa lượt" giữ đúng lần thứ 7. Chỉ ghi nhận; T5/T6 đối chiếu; T10-136 kiểm lại lượt 136 lúc đóng nếu có reboot giữa lượt sau 07:07Z.
3. **Dị thường muộn HB +887 s: TÁI HIỆN lần thứ 6 (+889 s, slot 05:20:50Z).** Mẫu dừng ở 5 lần KHÔNG còn đúng. Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: bcc71e61 → 1ca1feaa (btime 05:29:18Z), trong khoảng trống giữa đợt 135 và 136** — ứng viên sự kiện tiếp theo sau #15 theo định nghĩa gộp T10-133 §10.2; T2 gắn nhãn boot #91? cho bcc71e61 (chưa chốt); T10-136 chốt số, T5 phân loại, T6 chốt số boot tuyệt đối.
5. **Mù #55 (mới mở đợt 135): việc của T2, không kiểm lại** (T2 đợt 136: probe #55 ok=2 fail=0 lúc 05:50:26Z trên boot 1ca1feaa). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **Không có sai số mới (F-136-T7: KHÔNG CÓ).** 3 lần kiểm khớp hoàn toàn; mọi jitter tính lại bằng `date -u` từ epoch thô; boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` và đối chiếu khớp T2 (nguồn độc lập); chênh btime brief (~05:29:34Z) vs /proc/stat (05:29:18Z) đã giải quyết ở §2.5 (mốc journal first-entry của T2, không phải mâu thuẫn btime).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round136-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round136-t7/NOTES.md` (không nằm trong repo nên không stage).
