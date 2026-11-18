# PHASE9 ROUND128 T7 — Slot scheduler MỚI sau 02:45Z 17/11: 1 slot thiếu thêm (DR)

- **Luồng:** T7 đợt 128 (lượt cron 12:35 +07 17/11/2026). Boot lúc làm việc: boot mới, btime 04:55:04Z (theo `uptime -s` + `who -b` lúc 05:40:38Z) — khác boot #73 của đợt 127 (btime 03:04:25Z); T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 02:45Z 17/11 (lúc T7 đợt 127 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**Có 1 slot thiếu MỚI, là deterministic-doctor — heartbeat 0 thiếu mới, mẫu thiếu giữ dạng đợt 127 (chỉ DR thiếu).**

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| deterministic-doctor 12:00+07 17/11 | 05:00:00Z | deterministic-doctor |

- DR 08:00+07 và 09:00+07 (đã xác nhận thiếu đợt 127), DR 03:00+07 (thiếu đợt 125), DR 06:00+07 (thiếu đợt 126) **vẫn thiếu** khi kiểm lại — không đổi.
- **Heartbeat: 0 slot thiếu mới** — 6/6 slot trong cửa đều CÓ. Slot 09:50:50+07 (đợt 127 chưa tới hạn kiểm tra) xác nhận CÓ.
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 09:35:51+07 đợt 127 `succeeded`, lượt 12:35:51+07 đợt 128 đang `running` lúc kiểm).
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127): heartbeat **38/154 slot thiếu** (số thiếu không đổi); deterministic-doctor **43/148 slot thiếu** (từ 42/145 đợt 127 — số thiếu +1, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 02:45Z → 05:40Z 17/11

**Heartbeat (lưới :20:50/:50:50): 6/6 có, 0 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:50:50 | 830d8ad7 | 02:45:34 | −316 s | CÓ |
| 10:20:50 | eddff0c5 | 03:15:34 | −316 s | CÓ |
| 10:50:50 | 150e5eee | 03:45:34 | −316 s | CÓ |
| 11:20:50 | e9ad2111 | 04:15:34 | −316 s | CÓ |
| 11:50:50 | a5a06583 | 04:45:34 | −316 s | CÓ |
| 12:20:50 | acaacb82 | 05:22:18 | +88 s | CÓ |

Kiểm lại limit=15 xác nhận không slot nào trong cửa vắng mặt. Cả 6 lượt đều `succeeded`, attempt=1, error_text=null. HB 12:20:50 muộn +88 s — lệch nhỏ so với mẫu −316 s thường thấy, KHÔNG phải dị thường lớn kiểu +1251 s (đợt 127) hay +887 s; chỉ ghi nhận, không suy đoán nguyên nhân. Không có dị thường thời gian mới ở mức kỷ lục.

**Deterministic-doctor (lưới :00:00): 2/3 có, 1/3 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:00 | f078bbe6 | 03:00:00 | 0 s | CÓ |
| 11:00 | ca26238a | 04:00:00 | 0 s | CÓ |
| 12:00 | — | — | — | **THIẾU** |

DR 12:00 được kết luận thiếu sau ~40' quá giờ hẹn ở lần kiểm đầu (05:39:53Z) và vẫn thiếu ở lần kiểm lại 05:40:38Z; DR jitter lịch sử 0–2 s nên ngưỡng này an toàn theo phương pháp đợt 125/126/127. 2 lượt có đều `succeeded`, attempt=1, error_text=null.

Slot HB 12:50:50+07 (05:50:50Z) và DR 13:00+07 (06:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Không slot thiếu mới nào trùng build-loop đang active

Theo `started_at_utc`/`finished_at_utc` của vcut-build-loop: lượt 09:35:51+07 đợt 127 kết thúc 04:36:53Z, lượt 12:35:51+07 đợt 128 bắt đầu 05:35:51Z. Slot thiếu mới DR 12:00+07 (05:00Z) nằm giữa hai lượt → **không có build-loop nào active** tại giờ thiếu. Cờ `round-in-progress.md` KHÔNG tồn tại trên đĩa lúc kiểm 05:40:38Z. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125/126/127.

### 2.3 Trạng thái VM vẫn không quyết định lượt thiếu — không bằng chứng mới

Trong cùng giờ thiếu, heartbeat vẫn chạy bình thường (12:20:50+07 CÓ trong giờ 12:00) → trong cùng một giờ có job chạy, có job thiếu. Đúng kết luận đợt 125; **không có quan sát mới nào làm đổi kết luận hay hé lộ cơ chế drop**.

### 2.4 Ghi nhận thời gian về reboot mới (không suy đoán nguyên nhân)

Boot mới btime 04:55:04Z (theo `uptime -s` + `who -b` lúc 05:40:38Z). Dấu vết cuối của boot #73: HB 11:50:50 kết thúc 04:45:34Z → #73 chết trong khoảng (04:45:34Z, 04:55:04Z]. Slot thiếu mới DR 12:00+07 (05:00:00Z) nằm 4'56" SAU khi boot mới bắt đầu — tức thiếu xảy ra khi VM đã boot lại xong, không còn trong khoảng VM-down. Chỉ ghi nhận mốc thời gian; phân loại boot/reboot là việc của T5.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5). Lưới kỳ vọng như đợt 125/126/127.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Đối chiếu lịch sử trong cùng lần kiểm: HB 05:20:50/05:50:50+07 17/11 và DR 15:00/18:00+07 16/11 vẫn vắng trong danh sách limit=15 → các kết luận đợt 125/126/127 không đổi. (HB 02:20:50/02:50:50+07 và DR 13:00+07 16/11 đã ngoài phạm vi limit=15, không kiểm lại được đợt này.)

## 4. Cập nhật lũy kế (nối tiếp đợt 127, cùng phương pháp)

- Heartbeat: 38/148 → **38/154 slot thiếu** (cửa sổ 14/11 07:50:50 → 17/11 12:20:50 +07). Kiểm toán cửa sổ: 14/11 từ 07:50:50 = 33 slot + 15/11 48 + 16/11 48 + 17/11 tới 12:20:50 = 25 → 154 ✓. Số thiếu không đổi (0 mới).
- Deterministic-doctor: 42/145 → **43/148 slot thiếu** (cửa sổ 11/11 09:00 → 17/11 12:00 +07). Kiểm toán: 15 + 120 + 13 = 148 ✓. Số thiếu +1 (12:00).
- Tỉ lệ thiếu lũy kế: HB 38/154 = 24,7%; DR 43/148 = 29,1%.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này chỉ đếm thêm 1 slot thiếu mới (DR, HB 0 thiếu — đợt thứ hai liên tiếp chỉ DR thiếu); mọi quan sát đều nhất quán với kết luận đợt 125. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường HB +1251 s (08:20:50+07, đợt 127):** không có dị thường thời gian mới ở mức tương tự đợt này (HB 12:20:50 chỉ muộn +88 s — lệch nhỏ, ghi nhận). Nợ giao luồng hạ tầng nếu muốn đào vẫn đứng như đợt 127.
3. **Reboot mới (boot btime 04:55:04Z):** chỉ ghi nhận mốc; T5 phân loại ở đợt 128.
4. **Mù #40 B / #43: KHÔNG ĐỔI** (không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round128-t7-sched.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round128-t7/NOTES.md` (không nằm trong repo nên không stage).
