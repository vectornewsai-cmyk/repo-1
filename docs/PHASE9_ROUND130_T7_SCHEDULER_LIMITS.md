# PHASE9 ROUND130 T7 — Slot scheduler MỚI sau 08:42Z 17/11: 2 slot thiếu thêm (HB 1 + DR 1) + 2 dị thường muộn ở đúng mức kỷ lục

- **Luồng:** T7 đợt 130 (lượt cron 18:35 +07 17/11/2026). Boot lúc làm việc: boot #77, btime 10:56:31Z (theo `uptime -s` + `who -b` lúc 11:37:45Z) — khác boot #76 của đợt 129 (btime 09:02:12Z); T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 08:42Z 17/11 (lúc T7 đợt 129 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**Có 2 slot thiếu MỚI — HB và DR mỗi loại 1 slot.**

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| heartbeat 17:50:50+07 17/11 | 10:50:50Z | heartbeat |
| deterministic-doctor 18:00+07 17/11 | 11:00:00Z | deterministic-doctor |

**Thêm 2 dị thường muộn ở đúng mức kỷ lục trên heartbeat (chỉ ghi nhận, không suy đoán nguyên nhân):**

| Slot (+07) | Jitter | Ghi chú |
|---|---|---|
| heartbeat 17:20:50+07 17/11 | **+1.252 s** | BẰNG CHÍNH XÁC kỷ lục đợt 129 (+1.252 s) — lần thứ hai liên tiếp ở đúng mức này, không vượt |
| heartbeat 18:20:50+07 17/11 | **+888 s** | Thấp hơn kỷ lục +889 s (đợt 129) đúng 1 s — không vượt |

- DR 14:00+07 và 15:00+07 (thiếu mới đợt 129) **vẫn thiếu** khi kiểm lại — không đổi. HB 13:50:50+07 (thiếu đợt 129) vẫn vắng. DR 15:00/18:00+07 16/11 vẫn vắng trong danh sách limit=15 → các kết luận đợt 125/126/127/128/129 không đổi.
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 15:35:51+07 đợt 129 `succeeded`, kết thúc 10:03:26Z; lượt 18:35:51+07 đợt 130 đang `running` lúc kiểm).
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127/128/129): heartbeat **40/166 slot thiếu** (số thiếu +1, mẫu số +6); deterministic-doctor **46/154 slot thiếu** (số thiếu +1, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 08:42Z → 11:38Z 17/11

**Heartbeat (lưới :20:50/:50:50): 5/6 có, 1/6 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:50:50 | 4c8621e6 | 08:45:34 | −316 s | CÓ |
| 16:20:50 | 58102ed5 | 09:15:34 | −316 s | CÓ |
| 16:50:50 | 3bb89c09 | 09:45:34 | −316 s | CÓ |
| 17:20:50 | c42fb5e2 | 10:41:42 | **+1.252 s** | CÓ (muộn đúng mức kỷ lục) |
| 17:50:50 | — | — | — | **THIẾU (mới)** |
| 18:20:50 | 7b41146b | 11:35:38 | **+888 s** | CÓ (muộn gần kỷ lục) |

Kiểm lại limit=15 (lần 2, 11:38Z) khớp hoàn toàn lần 1 (11:37Z): HB 17:50:50 vẫn vắng. Tất cả lượt có đều `succeeded`, attempt=1, error_text=null. HB 17:50:50 được kết luận thiếu sau ~47' quá giờ hẹn ở lần kiểm đầu (10:50:50Z → 11:37:45Z) và vẫn thiếu ở lần kiểm lại 11:38:21Z — vượt xa kỷ lục muộn +1.252 s ≈ 21', nên ngưỡng này an toàn.

- HB 17:20:50+07 muộn +1.252 s: scheduled 1794910850 (10:20:50Z), started 1794912102 (10:41:42Z). BẰNG CHÍNH XÁC kỷ lục đợt 129 (HB 14:20:50+07, run f7aba292, scheduled 1794900050, started 1794901302) — cùng 1.252 s tới từng giây. Đây là lần thứ hai liên tiếp xuất hiện đúng mức +1.252 s; không tuyên bố bước nhảy mới, chỉ ghi nhận tái hiện ở đúng mức kỷ lục.
- HB 18:20:50+07 muộn +888 s: scheduled 1794914450 (11:20:50Z), started 1794915338 (11:35:38Z) — thấp hơn kỷ lục +889 s (HB 15:20:50+07 đợt 129, run 6c362d8d) đúng 1 s. Cũng chỉ ghi nhận.
- 3/6 slot trong cửa giữ mẫu chuẩn −316 s; 2 slot muộn lớn ở mức kỷ lục; 1 slot thiếu. Không có slot nào khác vắng trong cửa.

**Deterministic-doctor (lưới :00:00): 2/3 có, 1/3 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 16:00 | 0a88ce30 | 09:00:00 | 0 s | CÓ |
| 17:00 | 8d55a5ba | 10:00:00 | 0 s | CÓ |
| 18:00 | — | — | — | **THIẾU (mới)** |

DR 18:00+07 được kết luận thiếu sau ~38' quá giờ hẹn ở lần kiểm đầu (11:00:00Z → 11:37:45Z) và vẫn thiếu ở lần kiểm lại 11:38:21Z; DR jitter lịch sử 0–2 s nên ngưỡng này an toàn theo phương pháp đợt 125/126/127/128/129. Các lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

Slot HB 18:50:50+07 (11:50:50Z) và DR 19:00+07 (12:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Không slot thiếu mới nào trùng build-loop đang active

Theo `started_at_utc`/`finished_at_utc` của vcut-build-loop: lượt 15:35:51+07 đợt 129 kết thúc 10:03:26Z, lượt 18:35:51+07 đợt 130 bắt đầu 11:35:51Z. Cả 2 slot thiếu mới (10:50:50Z, 11:00:00Z) đều nằm giữa hai lượt → **không có build-loop nào active** tại giờ thiếu.

Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (11:38:21Z) — nhưng mtime 11:36:13Z, nội dung ghi "Đợt 130 đang chạy (lượt cron 18:35 +07 17/11/2026, mở 11:35Z)" — tức cờ được tạo CHO đợt 130, SAU cả 2 slot thiếu. Tại giờ các slot thiếu, cờ chưa tồn tại. Giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác — nhất quán đợt 125/126/127/128/129.

### 2.3 Trạng thái VM vẫn không quyết định lượt thiếu — không bằng chứng mới về cơ chế

- Trong cùng giờ thiếu, heartbeat vẫn chạy bình thường: giờ 17:00+07 có HB 17:20:50 CÓ (dù muộn) và DR 17:00 CÓ trong khi HB 17:50:50 THIẾU; giờ 18:00+07 có HB 18:20:50 CÓ (dù muộn) trong khi DR 18:00 THIẾU. Trong cùng một giờ có job chạy, có job thiếu — đúng kết luận đợt 125.
- **DR 18:00+07 (11:00:00Z) thiếu khi VM đã boot lại xong 3'29"** (boot #77 btime 10:56:31Z) — cùng mẫu với DR 15:00 đợt 129 (thiếu 46'29" sau boot mới) và DR 12:00 đợt 128 (thiếu ~5' sau boot mới). Không phải quan sát mới về cơ chế, chỉ tái hiện mẫu "thiếu khi VM vừa lên".

### 2.4 Ghi nhận thời gian về reboot mới (không suy đoán nguyên nhân)

Boot mới #77 btime 10:56:31Z (theo `uptime -s` + `who -b` lúc 11:37:45Z; build-loop log đợt 130 ghi boot_id 86538084-410e-41d4-a4bf-e68574dc2d91, /proc/1 10:56:42Z — khớp). Dấu vết trên `cron.runs` thu hẹp khung #76 chết: lượt vcut đợt 129 kết thúc 10:03:26Z → khung mở (10:03:26Z, 10:56:31Z]; **HB 17:20:50 started 10:41:42Z chứng minh #76 còn sống lúc đó** → khung hẹp còn **(10:41:42Z, 10:56:31Z]** (14'49"). (Ghi chú mở đợt 130 của parent dùng khung (10:02:05Z, 10:56:31Z] theo giờ T10 đóng đợt 129; khung ở đây hẹp hơn nhờ dấu vết HB trên cron.runs.)

- 1/2 slot thiếu mới nằm TRONG khung VM-down hẹp này: HB 17:50:50 (10:50:50Z). Chỉ ghi nhận trùng thời gian; phân loại boot/reboot là việc của T5.
- 1/2 slot thiếu mới nằm NGOÀI khung: DR 18:00 (11:00:00Z), 3'29" sau khi boot #77 bắt đầu.
- HB 18:20:50 started 11:35:38Z, 13 s trước khi lượt vcut đợt 130 bắt đầu (11:35:51Z). Chỉ ghi nhận mốc thời gian.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5). Lưới kỳ vọng như đợt 125/126/127/128/129.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Đối chiếu lịch sử trong cùng lần kiểm: DR 14:00/15:00+07 17/11 (thiếu đợt 129) và DR 15:00/18:00+07 16/11 vẫn vắng trong danh sách limit=15 ở cả hai lần kiểm → các kết luận đợt 125/126/127/128/129 không đổi. (HB 13:50:50+07 thiếu đợt 129 vẫn vắng; HB 05:20:50/05:50:50+07 17/11 và DR 08:00/09:00+07 17/11 thiếu đợt 127 đã ngoài phạm vi limit=15, không kiểm lại được đợt này — cùng caveat đợt 128/129.)
4. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.

## 4. Cập nhật lũy kế (nối tiếp đợt 129, cùng phương pháp)

- Heartbeat: 39/160 → **40/166 slot thiếu** (cửa sổ 14/11 07:50:50 → 17/11 18:20:50 +07). Kiểm toán cửa sổ: 14/11 từ 07:50:50 = 33 slot + 15/11 48 + 16/11 48 + 17/11 tới 18:20:50 = 37 → 166 ✓. Số thiếu +1 (17:50:50).
- Deterministic-doctor: 45/151 → **46/154 slot thiếu** (cửa sổ 11/11 09:00 → 17/11 18:00 +07). Kiểm toán: 15 + 120 + 19 = 154 ✓. Số thiếu +1 (18:00).
- Tỉ lệ thiếu lũy kế: HB 40/166 = 24,1%; DR 46/154 = 29,9%.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này có quan sát MỚI về hình dạng thiếu (HB thiếu 3 đợt liên tiếp: 13:50:50 đợt 129 → 17:50:50 đợt 130; 2 dị thường muộn ở đúng mức kỷ lục trong cùng một cửa; DR 18:00 thiếu chỉ 3'29" sau boot mới) — nhưng mọi quan sát đều nhất quán với kết luận đợt 125, không hé lộ cơ chế drop. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường muộn HB ở mức kỷ lục: 2 lần trong một cửa, lần thứ hai liên tiếp** (+1.252 s BẰNG kỷ lục đợt 129; +888 s thấp hơn kỷ lục +889 s đúng 1 s). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, nay tái hiện đúng mức đợt 130). Chỉ ghi nhận — giao luồng hạ tầng nếu muốn đào, như nợ dị thường +1.251 s đợt 127.
3. **Reboot mới #76→#77 (btime 10:56:31Z):** chỉ ghi nhận mốc; T5 phân loại ở đợt 130. Đây là reboot thứ 5 liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở (theo ghi chú mở đợt 130 của parent). Khung #76 chết thu hẹp còn (10:41:42Z, 10:56:31Z] nhờ dấu vết HB 17:20:50.
4. **Mù #40 B / #43: KHÔNG ĐỔI** (không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round130-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round130-t7/NOTES.md` (không nằm trong repo nên không stage).
