# PHASE9 ROUND131 T7 — Slot scheduler MỚI sau 11:38Z 17/11: 0 slot thiếu mới + 0 dị thường muộn (cửa sạch đầu tiên từ đợt 125)

- **Luồng:** T7 đợt 131 (lượt cron 21:35 +07 17/11/2026). Boot lúc làm việc: boot mới, btime 14:26:41Z, boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34` (theo `uptime -s` + `who -b` lúc 14:41:43Z và cờ `round-in-progress.md` của đợt 131) — khác boot #78? của đợt 130 (btime 13:02:41Z); T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 11:38:21Z 17/11 (lúc T7 đợt 130 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**0 slot thiếu MỚI — cửa sạch: heartbeat 6/6 có, deterministic-doctor 3/3 có.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa (lượt 21:35:51+07 đợt 131 đang `running`) | — | 0 | — |

**Dị thường muộn: KHÔNG CÓ dị thường mới nào, và KHÔNG tái hiện kỷ lục +1.252 s.**

- Cả 6 slot heartbeat trong cửa đều giữ mẫu chuẩn **−316 s** (khởi động sớm 5'16" so với giờ hẹn — mẫu đã biết từ các đợt trước). Không slot nào muộn, kể cả muộn nhỏ.
- Kỷ lục muộn HB **+1.252 s KHÔNG tái hiện lần thứ ba**: chuỗi "đúng mức kỷ lục" dừng ở 2 lần liên tiếp (đợt 129 → đợt 130). Kỷ lục vẫn là +1.252 s (đợt 129, tái hiện đợt 130); đợt này không có lượt nào gần mức đó — lượt muộn nhất trong cửa là −316 s (tức sớm, không muộn).
- Dị thường +888 s / +889 s cũng không tái hiện.
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127/128/129/130): heartbeat **40/172 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **46/157 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 11:38Z → 14:43Z 17/11

**Heartbeat (lưới :20:50/:50:50): 6/6 có, 0 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:50:50 | 0683f103 | 11:45:34 | −316 s | CÓ |
| 19:20:50 | 1b3dc9ab | 12:15:34 | −316 s | CÓ |
| 19:50:50 | c4dbf30d | 12:45:34 | −316 s | CÓ |
| 20:20:50 | f4300e8e | 13:15:34 | −316 s | CÓ |
| 20:50:50 | c89f03c4 | 13:45:34 | −316 s | CÓ |
| 21:20:50 | 9ea89caf | 14:15:34 | −316 s | CÓ |

Kiểm lại limit=15 (lần 2, 14:43Z) khớp hoàn toàn lần 1 (14:41Z). Tất cả lượt có đều `succeeded`, attempt=1, error_text=null. Không slot nào trong cửa vắng; không slot nào muộn.

**Deterministic-doctor (lưới :00:00): 3/3 có, 0 thiếu.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 19:00 | c2c7a03d | 12:00:00 | 0 s | CÓ |
| 20:00 | 4bf99ba1 | 13:00:00 | 0 s | CÓ |
| 21:00 | 1edf961f | 14:00:00 | 0 s | CÓ |

Kiểm lại limit=15 (lần 2, 14:43Z) khớp hoàn toàn lần 1 (14:41Z). Các lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

Slot HB 21:50:50+07 (14:50:50Z) và DR 22:00+07 (15:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả hai lần kiểm:

- HB 17:50:50+07 (thiếu mới đợt 130) **vẫn vắng**; HB 13:50:50+07 (thiếu đợt 129) **vẫn vắng**.
- DR 14:00/15:00+07 17/11 (thiếu mới đợt 129) **vẫn vắng**; DR 18:00+07 17/11 (thiếu mới đợt 130) **vẫn vắng**; DR 15:00/18:00+07 16/11 **vẫn vắng**.
- Các kết luận đợt 125/126/127/128/129/130 không đổi.

### 2.3 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 18:35:51 (đợt 130) | 9462a1f3 | `succeeded`, finished 14:12:19Z |
| 21:35:51 (đợt 131) | 8b82d3c1 | `running` lúc kiểm |

- Không có slot 3h nào trong cửa bị thiếu.
- Ghi nhận mốc thời gian (không suy diễn): lượt đợt 130 hiện ghi `started_at_utc` 13:03:22Z — chênh **+5.251 s** so với giờ hẹn 11:35:51Z — và `finished_at_utc` 14:12:19Z. T7 đợt 130 đã thấy lượt này `running` lúc 11:37Z với cùng run_id; con số started_at hiện tại trên `cron.runs` là 13:03:22Z. Chỉ ghi nhận mốc; việc đối chiếu giờ bắt đầu/kết thúc lượt với reboot là của T5/T6.

### 2.4 Ghi nhận thời gian về reboot mới (không suy đoán nguyên nhân)

- Boot mới btime **14:26:41Z**, boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34` (theo `uptime -s` + `who -b` lúc 14:41:43Z; cờ `round-in-progress.md` đợt 131 ghi cùng boot_id/btime). Số thứ tự boot chờ T6 chốt (mù #37).
- Dấu vết trên `cron.runs` thu hẹp khung boot trước chết: HB 21:20:50 started **14:15:34Z** và DR 21:00 started **14:00:00Z** chứng minh boot trước còn sống lúc đó → khung chết **(14:15:34Z, 14:26:41Z]** (11'07"). T5 phân loại ở đợt 131.
- **Không slot HB/DR nào rơi vào khung chết này**: slot gần nhất trước khung là HB 21:20:50 (14:15:34Z, CÓ) và DR 21:00 (14:00:00Z, CÓ); slot kế tiếp HB 21:50:50+07 (14:50:50Z) và DR 22:00+07 (15:00Z) chưa tới hạn kiểm tra lúc làm việc. Chỉ ghi nhận mốc thời gian.
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (14:41Z) — mtime lúc mở đợt 131, nội dung ghi "Đợt 131 đang chạy (cron 21:35 +07 17/11/2026, bắt đầu 14:35Z)". Lượt vcut đợt 131 bắt đầu 14:35:51Z, **sau** boot mới 9'10" — chỉ ghi nhận mốc thời gian.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5). Lưới kỳ vọng như đợt 125/126/127/128/129/130.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ngắn hơn các đợt trước (11:38Z → 14:43Z, ~3h05') vì T7 đợt 130 kiểm muộn (11:38Z) và đợt 131 mở sớm (14:35Z) — vẫn đủ 6 slot HB + 3 slot DR để kết luận "0 thiếu mới" trong cửa.

## 4. Cập nhật lũy kế (nối tiếp đợt 130, cùng phương pháp)

- Heartbeat: 40/166 → **40/172 slot thiếu** (cửa sổ 14/11 07:50:50 → 17/11 21:20:50 +07). Kiểm toán cửa sổ: 14/11 từ 07:50:50 = 33 slot + 15/11 48 + 16/11 48 + 17/11 tới 21:20:50 = 43 → 172 ✓. Số thiếu +0.
- Deterministic-doctor: 46/154 → **46/157 slot thiếu** (cửa sổ 11/11 09:00 → 17/11 21:00 +07). Kiểm toán: 15 + 120 + 22 = 157 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 40/172 = 23,3% (giảm từ 24,1% do mẫu số tăng, số thiếu không đổi); DR 46/157 = 29,3% (giảm từ 29,9%, cùng lý do).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này là cửa sạch đầu tiên kể từ đợt 125 (0 thiếu mới, 0 muộn lớn) — chỉ ghi nhận; không suy diễn nguyên nhân ngoài bằng chứng. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường muộn HB ở mức kỷ lục: KHÔNG tái hiện lần thứ ba.** Chuỗi +1.252 s dừng ở 2 lần liên tiếp (đợt 129, đợt 130). Kỷ lục muộn HB vẫn là +1.252 s. Chỉ ghi nhận — giao luồng hạ tầng nếu muốn đào.
3. **Reboot mới (boot btime 14:26:41Z):** chỉ ghi nhận mốc; T5 phân loại ở đợt 131; T6 chốt số boot (mù #37). Khung boot trước chết (14:15:34Z, 14:26:41Z] theo dấu vết HB/DR trên `cron.runs` — ghi để T5/T6 đối chiếu, không tự kết luận số boot.
4. **Mù #49 B / #50: KHÔNG ĐỔI** (không kiểm lại — việc của T2). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round131-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round131-t7/NOTES.md` (không nằm trong repo nên không stage).
