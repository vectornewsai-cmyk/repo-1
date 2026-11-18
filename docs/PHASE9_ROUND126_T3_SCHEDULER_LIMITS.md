# PHASE9 ROUND126 T3 — Slot scheduler MỚI sau 20:51Z 16/11: 3 slot thiếu thêm

- **Luồng:** T3 đợt 126 (lượt cron 06:35 +07 17/11/2026). Boot lúc làm việc: `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69`, btime 23:25:41Z (boot #71 tạm, theo brief; T5 xác nhận số hiệu).
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 20:51Z 16/11 (lúc T3-125 xác nhận lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (cờ `round126-e4a9-done` và `round126-e4b10-done` đều chưa tồn tại lúc làm việc — chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù #40 B / #43, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**Có 3 slot thiếu MỚI, mẫu thiếu tiếp tục — không có bằng chứng mới về cơ chế drop.**

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| heartbeat 05:20:50+07 17/11 | 22:20:50Z | heartbeat |
| heartbeat 05:50:50+07 17/11 | 22:50:50Z | heartbeat |
| deterministic-doctor 06:00+07 17/11 | 23:00:00Z | deterministic-doctor |

- DR 03:00+07 17/11 (đã xác nhận thiếu lúc 20:51Z đợt 125) **vẫn thiếu** khi kiểm lại 23:47Z — không đổi.
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 03:35:51+07 `succeeded`, lượt 06:35:51+07 đang `running` lúc kiểm).
- Cập nhật lũy kế (cùng phương pháp đợt 125): heartbeat **38/142 slot thiếu** (từ 36/136); deterministic-doctor **40/141 slot thiếu** (từ 39/139 sau khi cộng DR 03:00 đợt 125).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 20:51Z 16/11 → 23:42Z 16/11

**Heartbeat (lưới :20:50/:50:50): 3/5 có, 2/5 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 04:20:50 | c6dd9e76 | 21:15:34 | −316 s | CÓ |
| 04:50:50 | dee05b49 | 21:42:14 | −316 s | CÓ |
| 05:20:50 | — | — | — | **THIẾU** |
| 05:50:50 | — | — | — | **THIẾU** |
| 06:20:50 | ab601870 | 23:35:38 | +888 s | CÓ |

Kiểm lại limit=15 xác nhận 05:20:50/05:50:50 vắng mặt trong khi slot kề trước (04:50:50) và sau (06:20:50) đều có → thiếu thật, không phải artifact của limit. Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null. HB 06:20:50 muộn +888 s là dị thường đã biết đợt 125 (slot :20:50, start thực ~:35:38, ~13 s trước khi vcut-build-loop dispatch 23:35:51Z).

**Deterministic-doctor (lưới :00:00): 2/3 có, 1/3 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 04:00 | 14a2ed95 | 21:00:00 | 0 s | CÓ |
| 05:00 | 55ad6466 | 22:00:00 | 0 s | CÓ |
| 06:00 | — | — | — | **THIẾU** |

DR 06:00 được kết luận thiếu sau 42' quá giờ hẹn ở lần kiểm đầu và vẫn thiếu ở lần kiểm lại 23:47Z (~47' quá giờ); DR jitter lịch sử 0–2 s nên ngưỡng này an toàn theo phương pháp đợt 125. Cả 2 lượt có đều `succeeded`, attempt=1, error_text=null.

Slot HB 06:50:50+07 (23:50:50Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Không slot thiếu mới nào trùng build-loop đang active

Theo `started_at_utc`/`finished_at_utc` của vcut-build-loop: lượt 03:35:51 kết thúc 21:57:48Z, lượt 06:35:51 bắt đầu 23:35:51Z. Cả 3 slot thiếu mới (22:20:50Z, 22:50:50Z, 23:00Z) đều nằm giữa hai lượt → **không có build-loop nào active** tại giờ thiếu. Cờ `round-in-progress.md` (đợt 126 mở 23:35Z) cũng mở SAU cả 3 slot thiếu. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125.

### 2.3 Trạng thái VM vẫn không quyết định lượt thiếu — không bằng chứng mới

Cả 3 slot thiếu mới đều nằm trong gap #70→#71 (20:54:19Z→23:25:41Z), NHƯNG trong cùng gap đó HB 04:20:50/04:50:50+07 và DR 04:00/05:00+07 đều chạy bình thường → trong cùng một gap VM-down có slot chạy, có slot thiếu. Đúng kết luận đợt 125; **không có quan sát mới nào làm đổi kết luận hay hé lộ cơ chế drop**.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=10 rồi kiểm lại limit=15; DR limit=10 rồi kiểm lại limit=15 + kiểm lại limit=5 lúc 23:47Z; vcut limit=5). Lưới kỳ vọng như đợt 125.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Đối chiếu lịch sử trong cùng lần kiểm: HB 02:20:50/02:50:50+07 17/11, DR 18:00+07 và 10:00/11:00/12:00/15:00+07 16/11 vẫn vắng trong danh sách limit=15 → các kết luận đợt 125 không đổi.

## 4. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này chỉ đếm thêm 3 slot thiếu mới; mọi quan sát đều nhất quán với kết luận đợt 125. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Mù #40 B / #43: KHÔNG ĐỔI** (không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 5. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round126-t3-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round126-t3/NOTES.md` (không nằm trong repo nên không stage).
