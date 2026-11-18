# PHASE9 ROUND129 T7 — Slot scheduler MỚI sau 05:40Z 17/11: 3 slot thiếu thêm (HB 1 + DR 2) + 2 dị thường muộn mức kỷ lục

- **Luồng:** T7 đợt 129 (lượt cron 15:35 +07 17/11/2026). Boot lúc làm việc: boot mới #75, btime 07:13:31Z (theo `uptime -s` + `who -b` lúc 08:38:49Z) — khác boot #74 của đợt 128 (btime 04:55:04Z); T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 05:40:38Z 17/11 (lúc T7 đợt 128 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**Có 3 slot thiếu MỚI — lần đầu sau 2 đợt, heartbeat thiếu trở lại (đợt 127 và 128 đều chỉ DR thiếu).**

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| heartbeat 13:50:50+07 17/11 | 06:50:50Z | heartbeat |
| deterministic-doctor 14:00+07 17/11 | 07:00:00Z | deterministic-doctor |
| deterministic-doctor 15:00+07 17/11 | 08:00:00Z | deterministic-doctor |

**Thêm 2 dị thường muộn mức kỷ lục trên heartbeat (chỉ ghi nhận, không suy đoán nguyên nhân):**

| Slot (+07) | Jitter | Ghi chú |
|---|---|---|
| heartbeat 14:20:50+07 17/11 | **+1.252 s** | Vượt kỷ lục cũ +1.251 s (đợt 127, HB 08:20:50+07) đúng 1 s — kỷ lục muộn mới, biên chỉ 1 s |
| heartbeat 15:20:50+07 17/11 | **+889 s** | Vượt mức +887 s đã biết đúng 2 s |

- DR 12:00+07 (thiếu mới đợt 128) **vẫn thiếu** khi kiểm lại — không đổi. DR 15:00/18:00+07 16/11 vẫn vắng trong danh sách limit=15 → các kết luận đợt 125/126/127/128 không đổi.
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 12:35:51+07 đợt 128 `succeeded`, kết thúc 06:25:09Z; lượt 15:35:51+07 đợt 129 đang `running` lúc kiểm).
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127/128): heartbeat **39/160 slot thiếu** (số thiếu +1, mẫu số +6); deterministic-doctor **45/151 slot thiếu** (số thiếu +2, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 05:40Z → 08:42Z 17/11

**Heartbeat (lưới :20:50/:50:50): 5/6 có, 1/6 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:50:50 | 1cace949 | 05:45:34 | −316 s | CÓ |
| 13:20:50 | 0c8ebced | 06:15:34 | −316 s | CÓ |
| 13:50:50 | — | — | — | **THIẾU (mới)** |
| 14:20:50 | f7aba292 | 07:41:42 | **+1.252 s** | CÓ (muộn kỷ lục) |
| 14:50:50 | e5c639e7 | 07:52:34 | −316 s | CÓ |
| 15:20:50 | 6c362d8d | 08:35:39 | **+889 s** | CÓ (muộn mức kỷ lục) |

Kiểm lại limit=15 (lần 2, 08:40Z) khớp hoàn toàn lần 1 (08:38Z): HB 13:50:50 vẫn vắng. Tất cả lượt có đều `succeeded`, attempt=1, error_text=null. HB 13:50:50 được kết luận thiếu sau ~1h48' quá giờ hẹn ở lần kiểm đầu (06:50:50Z → 08:38:49Z) và vẫn thiếu ở lần kiểm lại 08:40Z — vượt xa mọi jitter từng quan sát (kỷ lục muộn +1.252 s ≈ 21'), nên ngưỡng này an toàn.

- HB 14:20:50+07 muộn +1.252 s: scheduled 07:20:50Z, started 07:41:42Z. Kỷ lục muộn cũ là +1.251 s (HB 08:20:50+07 đợt 127, run a53b7e0a — vẫn còn trong danh sách limit=15 đợt này, đối chiếu được: scheduled 01:20:50Z, started 01:41:41Z). Kỷ lục mới vượt cũ đúng 1 s — chênh lệch ở mức 1 giây, ghi nhận là "tái hiện ở mức kỷ lục + vượt 1 s", không tuyên bố bước nhảy mới.
- HB 15:20:50+07 muộn +889 s: scheduled 08:20:50Z, started 08:35:39Z — vượt mức +887 s đã biết đúng 2 s. Cũng chỉ ghi nhận.
- 3/6 slot trong cửa giữ mẫu chuẩn −316 s; 2 slot muộn lớn; 1 slot thiếu. Không có slot nào khác vắng trong cửa.

**Deterministic-doctor (lưới :00:00): 1/3 có, 2/3 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 13:00 | 307a5446 | 06:00:00 | 0 s | CÓ |
| 14:00 | — | — | — | **THIẾU (mới)** |
| 15:00 | — | — | — | **THIẾU (mới)** |

DR 14:00+07 được kết luận thiếu sau ~1h40' quá giờ hẹn; DR 15:00+07 sau ~40' quá giờ hẹn ở lần kiểm đầu (08:38:49Z) và vẫn thiếu ở lần kiểm lại 08:40:28Z; DR jitter lịch sử 0–2 s nên ngưỡng này an toàn theo phương pháp đợt 125/126/127/128. Lượt có duy nhất `succeeded`, attempt=1, error_text=null, jitter 0 s.

Slot HB 15:50:50+07 (08:50:50Z) và DR 16:00+07 (09:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Không slot thiếu mới nào trùng build-loop đang active

Theo `started_at_utc`/`finished_at_utc` của vcut-build-loop: lượt 12:35:51+07 đợt 128 kết thúc 06:25:09Z, lượt 15:35:51+07 đợt 129 bắt đầu 08:35:51Z. Cả 3 slot thiếu mới (06:50:50Z, 07:00:00Z, 08:00:00Z) đều nằm giữa hai lượt → **không có build-loop nào active** tại giờ thiếu.

Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (08:40:28Z) — nhưng mtime 08:36:35Z, nội dung ghi "Đợt 129 đang chạy (lượt cron 15:35 +07 17/11/2026, mở 08:36Z)" — tức cờ được tạo CHO đợt 129, SAU tất cả 3 slot thiếu. Tại giờ các slot thiếu, cờ chưa tồn tại. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125/126/127/128.

### 2.3 Trạng thái VM vẫn không quyết định lượt thiếu — không bằng chứng mới về cơ chế

- Trong cùng giờ thiếu, heartbeat vẫn chạy bình thường: giờ 15:00+07 có HB 15:20:50 CÓ trong khi DR 15:00 THIẾU; giờ 14:00+07 có HB 14:20:50 CÓ (dù muộn) trong khi DR 14:00 THIẾU. Trong cùng một giờ có job chạy, có job thiếu — đúng kết luận đợt 125.
- **DR 15:00+07 (08:00:00Z) thiếu khi VM đã boot lại xong 46'29"** (boot #75 btime 07:13:31Z) — cùng mẫu với DR 12:00 đợt 128 (thiếu 4'56" sau boot mới). Không phải quan sát mới về cơ chế, chỉ tái hiện mẫu "thiếu khi VM đang lên".

### 2.4 Ghi nhận thời gian về reboot mới (không suy đoán nguyên nhân)

Boot mới #75 btime 07:13:31Z (theo `uptime -s` + `who -b` lúc 08:38:49Z). Dấu vết cuối của boot #74 trên `cron.runs`: lượt vcut-build-loop đợt 128 kết thúc 06:25:09Z → #74 chết trong khoảng **(06:25:09Z, 07:13:31Z]**. (Ghi chú mở đợt 129 của parent dùng khung (06:20:05Z, 07:13:31Z] theo giờ T10 đóng đợt 128; khung ở đây hẹp hơn 5'04" nhờ dấu vết kết thúc lượt vcut trên cron.runs.)

- 2/3 slot thiếu mới nằm TRONG khung VM-down này: HB 13:50:50 (06:50:50Z) và DR 14:00 (07:00:00Z). Chỉ ghi nhận trùng thời gian; phân loại boot/reboot là việc của T5.
- 1/3 slot thiếu mới nằm NGOÀI khung: DR 15:00 (08:00:00Z), sau khi boot #75 bắt đầu 46'29".
- HB 14:20:50 (scheduled 07:20:50Z, started 07:41:42Z) chạy 28'11" sau khi boot #75 bắt đầu; HB 15:20:50 started 08:35:39Z, 12 s trước khi lượt vcut đợt 129 bắt đầu (08:35:51Z). Chỉ ghi nhận mốc thời gian.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5). Lưới kỳ vọng như đợt 125/126/127/128.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Đối chiếu lịch sử trong cùng lần kiểm: DR 12:00+07 17/11 (thiếu đợt 128) và DR 15:00/18:00+07 16/11 vẫn vắng trong danh sách limit=15 ở cả hai lần kiểm → các kết luận đợt 125/126/127/128 không đổi. (DR 08:00/09:00+07 17/11 thiếu đợt 127 và HB 05:20:50/05:50:50+07 17/11 đã ngoài phạm vi limit=15, không kiểm lại được đợt này — cùng caveat đợt 128.)
4. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.

## 4. Cập nhật lũy kế (nối tiếp đợt 128, cùng phương pháp)

- Heartbeat: 38/154 → **39/160 slot thiếu** (cửa sổ 14/11 07:50:50 → 17/11 15:20:50 +07). Kiểm toán cửa sổ: 14/11 từ 07:50:50 = 33 slot + 15/11 48 + 16/11 48 + 17/11 tới 15:20:50 = 31 → 160 ✓. Số thiếu +1 (13:50:50).
- Deterministic-doctor: 43/148 → **45/151 slot thiếu** (cửa sổ 11/11 09:00 → 17/11 15:00 +07). Kiểm toán: 15 + 120 + 16 = 151 ✓. Số thiếu +2 (14:00, 15:00).
- Tỉ lệ thiếu lũy kế: HB 39/160 = 24,4%; DR 45/151 = 29,8%.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này có quan sát MỚI về hình dạng thiếu (HB thiếu trở lại sau 2 đợt chỉ DR thiếu; 2 dị thường muộn ở mức kỷ lục trong cùng một cửa; DR 15:00 thiếu khi VM đã lên 46') — nhưng mọi quan sát đều nhất quán với kết luận đợt 125, không hé lộ cơ chế drop. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường muộn HB mức kỷ lục: 2 lần trong một cửa** (+1.252 s và +889 s). Kỷ lục muộn HB nay là +1.252 s (vượt +1.251 s đợt 127 đúng 1 s). Chỉ ghi nhận — giao luồng hạ tầng nếu muốn đào, như nợ dị thường +1.251 s đợt 127.
3. **Reboot mới #74→#75 (btime 07:13:31Z):** chỉ ghi nhận mốc; T5 phân loại ở đợt 129. Đây là reboot thứ 4 liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở (theo ghi chú mở đợt 129 của parent).
4. **Mù #40 B / #43: KHÔNG ĐỔI** (không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; RAM khả dụng lúc làm việc ~1.000 MB). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round129-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round129-t7/NOTES.md` (không nằm trong repo nên không stage).
