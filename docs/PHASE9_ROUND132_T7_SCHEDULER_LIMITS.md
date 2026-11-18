# PHASE9 ROUND132 T7 — 3 slot thiếu MỚI trong khung chết boot #80? + HB muộn +887 s (cửa KHÔNG sạch)

- **Luồng:** T7 đợt 132 (lượt cron 00:35 +07 18/11/2026). Boot lúc làm việc: boot mới, btime 17:24:08Z, boot_id `b379ecd7-311c-4053-a43f-507d21432ecc` (theo `uptime -s` + `who -b` lúc 17:40:24Z và cờ `round-in-progress.md` của đợt 132) — khác boot #80? của đợt 131 (btime 15:01:30Z, đã chết); T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 14:43Z 17/11 (lúc T7 đợt 131 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**3 slot thiếu MỚI — cửa KHÔNG sạch (đợt 131 là cửa sạch đầu tiên từ đợt 125; đợt này gãy): heartbeat 4/6 có, deterministic-doctor 2/3 có.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 4 | 2 (23:20:50, 23:50:50) | 1 (+887 s) |
| deterministic-doctor | 3 | 2 | 1 (00:00 18/11) | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (lượt 00:35:51+07 đợt 132 đang `running`) | — | 0 | — |

**Dị thường muộn: CÓ 1 dị thường mới — HB 00:20:50+07 18/11 jitter +887 s** (started 17:35:37Z, sau boot mới 11'29"), cùng họ +888/+889 s đã biết.

- Kỷ lục muộn HB **+1.252 s KHÔNG tái hiện lần thứ ba**: chuỗi "đúng mức kỷ lục" vẫn dừng ở 2 lần liên tiếp (đợt 129 → đợt 130). +887 s < +1.252 s. Kỷ lục vẫn là +1.252 s (đợt 129, tái hiện đợt 130).
- Cả 3 slot thiếu mới đều rơi vào khung chết boot #80? (16:07Z, 17:24:08Z] — chỉ ghi nhận tương quan thời gian, không tự kết luận nguyên nhân (T5/T6 phân loại).
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127/128/129/130/131): heartbeat **42/178 slot thiếu** (số thiếu +2, mẫu số +6); deterministic-doctor **47/160 slot thiếu** (số thiếu +1, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 14:43Z → 17:48Z 17/11

**Heartbeat (lưới :20:50/:50:50): 4/6 có, 2 thiếu MỚI.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:50:50 | b78a3611 | 14:45:34 | −316 s | CÓ |
| 22:20:50 | d3392b6a | 15:15:34 | −316 s | CÓ |
| 22:50:50 | faf50675 | 15:45:34 | −316 s | CÓ |
| 23:20:50 | — | — | — | THIẾU MỚI |
| 23:50:50 | — | — | — | THIẾU MỚI |
| 00:20:50 (18/11) | 81765edc | 17:35:37 | **+887 s** | CÓ (muộn lớn) |

Kiểm lại limit=15 (lần 2, 17:42Z) khớp hoàn toàn lần 1 (17:40Z). Các lượt có đều `succeeded`, attempt=1, error_text=null. 3 lượt đầu giữ mẫu chuẩn −316 s; lượt 00:20:50 dispatch muộn 14'47" sau giờ hẹn.

**Deterministic-doctor (lưới :00:00): 2/3 có, 1 thiếu MỚI.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 22:00 | 46b4194e | 15:00:00 | 0 s | CÓ |
| 23:00 | ce46f28a | 16:00:00 | 0 s | CÓ |
| 00:00 (18/11) | — | — | — | THIẾU MỚI |

Kiểm lại limit=15 (lần 2, 17:43Z) khớp hoàn toàn lần 1 (17:41Z); kiểm lần 3 limit=5 (~17:47Z) vẫn vắng DR 00:00 — 47' sau giờ hẹn và ~12' sau khi scheduler đã phục hồi (HB 00:20:50 dispatched 17:35:37Z, vcut đợt 132 started đúng giờ 17:35:51Z) → kết luận THIẾU, không phải "chưa dispatch". Các lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

Slot HB 00:50:50+07 18/11 (17:50:50Z) và DR 01:00+07 (18:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở các lần kiểm:

- HB 17:50:50+07 (thiếu mới đợt 130) **vẫn vắng**; HB 13:50:50+07 (thiếu đợt 129) **vẫn vắng**.
- DR 18:00+07 17/11 (thiếu mới đợt 130) **vẫn vắng**; DR 14:00/15:00+07 17/11 (thiếu đợt 129) **vẫn vắng**; DR 15:00/18:00+07 16/11 **vẫn vắng**.
- Các kết luận đợt 125/126/127/128/129/130/131 không đổi.

### 2.3 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 21:35:51 (đợt 131) | 8b82d3c1 | `succeeded`, finished 16:08:59Z |
| 00:35:51 18/11 (đợt 132) | c6948429 | `running` lúc kiểm, jitter 0 s |

- Không có slot 3h nào trong cửa bị thiếu.
- Ghi nhận mốc thời gian (không suy diễn): lượt đợt 131 hiện ghi `started_at_utc` 15:02:16Z — chênh **+1.585 s** so với giờ hẹn 14:35:51Z — và `finished_at_utc` 16:08:59Z. T7 đợt 131 đã thấy lượt này `running` lúc 14:41Z với cùng run_id; con số started_at hiện tại trên `cron.runs` là 15:02:16Z (46 s sau btime boot mới 15:01:30Z). Mẫu lạ này lặp lại đợt 130 (started_at 13:03:22Z, +5.251 s, dù đã thấy running lúc 11:37Z). Chỉ ghi nhận mốc; việc đối chiếu giờ bắt đầu/kết thúc lượt với reboot là của T5/T6.

### 2.4 Ghi nhận thời gian về reboot mới (không suy đoán nguyên nhân)

- Boot mới btime **17:24:08Z**, boot_id `b379ecd7-311c-4053-a43f-507d21432ecc` (theo `uptime -s` + `who -b` lúc 17:40:24Z; cờ `round-in-progress.md` đợt 132 ghi cùng boot_id/btime). Số thứ tự boot chờ T6 chốt (mù #37). Đây là **reboot thứ 5 liên tiếp quanh ranh giới đợt** (theo cờ đợt 132).
- Dấu vết trên `cron.runs` thu hẹp khung boot cũ chết: DR 23:00 started **16:00:00Z** chứng minh boot cũ còn sống lúc đó → khung chết theo dữ liệu luồng này là **(16:00:00Z, 17:24:08Z]** (1h24'08"), tương thích khung **(16:07Z, 17:24:08Z]** (1h17'08") trong cờ đợt 132 (mốc 16:07Z chi tiết hơn đến từ bằng chứng ngoài `cron.runs`, luồng này không xác minh lại).
- **Cả 3 slot thiếu mới đều rơi vào khung chết này**: HB 23:20:50 (16:20:50Z), HB 23:50:50 (16:50:50Z), DR 00:00 18/11 (17:00Z). Slot HB 00:20:50 (giờ hẹn 17:20:50Z) cũng nằm trong khung nhưng vẫn chạy nhờ dispatch muộn 17:35:37Z, sau boot mới 11'29". Chỉ ghi nhận mốc thời gian.
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (17:40Z) — mtime lúc mở đợt 132, nội dung ghi "Đợt 132 đang chạy (mở lượt cron 00:35 +07 18/11/2026 = 17:35Z 17/11/2026)". Lượt vcut đợt 132 bắt đầu 17:35:51Z, **sau** boot mới 11'43" — chỉ ghi nhận mốc thời gian.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15, thêm lần 3 limit=5 cho slot DR 00:00; vcut limit=5). Lưới kỳ vọng như đợt 125/126/127/128/129/130/131.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h05' (14:43Z → 17:48Z 17/11), đủ 6 slot HB + 3 slot DR để kết luận "3 thiếu mới" trong cửa.

## 4. Cập nhật lũy kế (nối tiếp đợt 131, cùng phương pháp)

- Heartbeat: 40/172 → **42/178 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 00:20:50 +07). Kiểm toán cửa sổ: 172 + 6 slot mới = 178 ✓. Số thiếu +2.
- Deterministic-doctor: 46/157 → **47/160 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 00:00 +07). Kiểm toán: 157 + 3 slot mới = 160 ✓. Số thiếu +1.
- Tỉ lệ thiếu lũy kế: HB 42/178 = 23,6% (tăng từ 23,3%); DR 47/160 = 29,4% (tăng từ 29,3%).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). 3 slot thiếu mới lần này đều nằm trong khung chết của một lần reboot — khác các đợt thiếu trước, vốn không gắn với reboot nào được ghi nhận — nhưng đây chỉ là tương quan thời gian, không suy diễn cơ chế. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Dị thường muộn HB ở mức kỷ lục: KHÔNG tái hiện lần thứ ba.** +887 s lần này là dị thường muộn lớn thứ tư trong chuỗi (+888 s đợt 130, +889 s, +1.252 s đợt 129/130) nhưng dưới kỷ lục. Kỷ lục muộn HB vẫn là +1.252 s. Chỉ ghi nhận — giao luồng hạ tầng nếu muốn đào.
3. **Mẫu lạ started_at lượt vcut ghi sau thời điểm đã thấy running — LẶP LẠI lần 2** (đợt 130: +5.251 s; đợt 131: +1.585 s). Chỉ ghi nhận; T5/T6 đối chiếu — có thể là hành vi ghi log của scheduler sau reboot, không phải lỗi đếm slot.
4. **Reboot thứ 5 liên tiếp quanh ranh giới đợt (boot btime 17:24:08Z):** chỉ ghi nhận mốc; T5 phân loại ở đợt 132; T6 chốt số boot #79?/#80? (mù #37). Khung boot cũ chết (16:07Z, 17:24:08Z] theo cờ đợt 132; dữ liệu luồng này cho (16:00:00Z, 17:24:08Z].
5. **Mù #49 B / #50 / #51: KHÔNG ĐỔI** (không kiểm lại — việc của T2). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round132-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round132-t7/NOTES.md` (không nằm trong repo nên không stage).
