# PHASE9 ROUND133 T7 — 0 slot thiếu MỚI, cửa SẠCH; mẫu lạ started_at lượt vcut lặp lại lần 3 (+7.135 s)

- **Luồng:** T7 đợt 133 (lượt cron 03:35 +07 18/11/2026). Boot lúc làm việc: boot 07da9c50-5836-4481-a4a4-7e22c6260325, btime 19:34:15Z (theo `uptime -s` + `who -b` lúc 20:44Z và cờ `round-in-progress.md` của đợt 133) — CÙNG boot lúc mở đợt 133, chưa reboot giữa lượt; T5 là chủ quản phân loại boot, luồng này chỉ ghi nhận mốc thời gian.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 17:48Z 17/11 (lúc T7 đợt 132 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**0 slot thiếu MỚI — cửa SẠCH (đợt 132 gãy với 3 thiếu mới; đợt này sạch lại, như đợt 131): heartbeat 6/6 có, deterministic-doctor 3/3 có.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 6 | 6 | 0 | 0 |
| deterministic-doctor | 3 | 3 | 0 | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 132 đã `succeeded`, đợt 133 đang `running`) | — | 0 | — |

**Dị thường muộn: KHÔNG có dị thường mới** — cả 6 HB đều jitter −316 s (mẫu chuẩn), cả 3 DR đều jitter 0 s.

- Kỷ lục muộn HB **+1.252 s KHÔNG tái hiện**; +887 s đợt 132 cũng không lặp lại. Kỷ lục vẫn là +1.252 s (đợt 129, tái hiện đợt 130).
- **Không có reboot mới giữa lượt:** boot lúc làm việc trùng boot lúc mở đợt 133 — không có khung chết nào trong cửa kiểm này, không có tương quan slot thiếu / khung chết mới để ghi nhận.
- Cập nhật lũy kế (cùng phương pháp đợt 125/126/127/128/129/130/131/132): heartbeat **42/184 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **47/163 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 17:48Z → 20:46Z 17/11

**Heartbeat (lưới :20:50/:50:50): 6/6 có, 0 thiếu MỚI.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:50:50 | 735e7f94 | 17:45:34 | −316 s | CÓ |
| 01:20:50 | 5b8870f6 | 18:15:34 | −316 s | CÓ |
| 01:50:50 | 23e18d3e | 18:45:34 | −316 s | CÓ |
| 02:20:50 | 56a134f9 | 19:15:34 | −316 s | CÓ |
| 02:50:50 | e08050ae | 19:45:34 | −316 s | CÓ |
| 03:20:50 | 19a76acf | 20:15:34 | −316 s | CÓ |

Kiểm lại limit=15 (lần 2, ~20:44Z) khớp hoàn toàn lần 1 (~20:41Z). Các lượt có đều `succeeded`, attempt=1, error_text=null, jitter −316 s (mẫu chuẩn).

**Deterministic-doctor (lưới :00:00): 3/3 có, 0 thiếu MỚI.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 01:00 | eb83482c | 18:00:00 | 0 s | CÓ |
| 02:00 | 4755b06a | 19:00:00 | 0 s | CÓ |
| 03:00 | c48a3a4f | 20:00:00 | 0 s | CÓ |

Kiểm lại limit=15 (lần 2, ~20:44Z) khớp hoàn toàn lần 1 (~20:42Z). Các lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

Slot HB 03:50:50+07 18/11 (20:50:50Z) và DR 04:00+07 (21:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả hai lần kiểm:

- HB 23:20:50+07 và 23:50:50+07 17/11 (thiếu mới đợt 132) **vẫn vắng**; DR 00:00+07 18/11 (thiếu mới đợt 132) **vẫn vắng**; DR 18:00+07 17/11 (thiếu đợt 130) **vẫn vắng**; DR 14:00/15:00+07 17/11 (thiếu đợt 129) **vẫn vắng**; DR 12:00+07 17/11 (thiếu đợt 128) **vẫn vắng**.
- Ngoài cửa sổ limit=15 lần này nên KHÔNG tái xác minh được: HB 17:50:50+07 và 13:50:50+07 17/11; DR 15:00/18:00+07 16/11. Ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- Các kết luận đợt 125/126/127/128/129/130/131/132 không đổi.

### 2.3 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 00:35:51 (đợt 132) | c6948429 | `succeeded`, finished 20:31:03Z |
| 03:35:51 (đợt 133) | 6f3eba37 | `running` lúc kiểm (~20:45Z), jitter 0 s |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=2 (~20:45Z) khớp lần 1.
- Ghi nhận mốc thời gian (không suy diễn): lượt đợt 132 hiện ghi `started_at_utc` **19:34:46Z** — chênh **+7.135 s** so với giờ hẹn 17:35:51Z — và `finished_at_utc` 20:31:03Z. T7 đợt 132 đã thấy lượt này `running` lúc 17:40Z với cùng run_id. Đây là **lần thứ 3 liên tiếp** mẫu lạ này xuất hiện (đợt 130: +5.251 s; đợt 131: +1.585 s; đợt 132: **+7.135 s — lớn nhất từ trước**). `started_at` ghi 31 s sau btime boot mới 19:34:15Z (đợt 131: 46 s sau btime). Thời lượng theo mốc ghi: 19:34:46Z → 20:31:03Z = 3.377 s. Khoảng cách đợt 132 finished → đợt 133 started: 288 s (4'48"). Chỉ ghi nhận mốc; việc đối chiếu giờ bắt đầu/kết thúc lượt với reboot là của T5/T6.

### 2.4 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc làm việc btime **19:34:15Z**, boot_id `07da9c50-5836-4481-a4a4-7e22c6260325` (theo `uptime -s` + `who -b` lúc 20:44Z; cờ `round-in-progress.md` đợt 133 ghi cùng boot_id/btime, "cùng boot lúc đóng đợt 132 — chưa reboot"). Số thứ tự boot chờ T6 chốt (mù #37).
- **KHÔNG có reboot mới giữa lượt đợt 133** (boot giữ nguyên từ lúc mở 20:35Z). Reboot b379ecd7 → 07da9c50 (btime 19:34:15Z) xảy ra giữa lượt đợt 132, trước cửa kiểm đợt này; 3 slot thiếu đợt 132 vẫn nằm trong khung chết cũ (16:07Z, 17:24:08Z], không đổi.
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (20:44Z) — mở đợt 133 20:35Z, hạn cứng 23:35Z 17/11.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 rồi kiểm lại limit=15; DR limit=15 rồi kiểm lại limit=15; vcut limit=5 rồi kiểm lại limit=2). Lưới kỳ vọng như đợt 125/126/127/128/129/130/131/132.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~2h58' (17:48Z → 20:46Z 17/11), đủ 6 slot HB + 3 slot DR để kết luận "0 thiếu mới" trong cửa. Không có slot nào thiếu nên không cần kiểm lần 3 — quy tắc "kiểm 3 lần trước khi kết luận THIẾU" chỉ áp dụng khi kết luận thiếu.

## 4. Cập nhật lũy kế (nối tiếp đợt 132, cùng phương pháp)

- Heartbeat: 42/178 → **42/184 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 03:20:50 +07). Kiểm toán cửa sổ: 178 + 6 slot mới = 184 ✓. Số thiếu +0.
- Deterministic-doctor: 47/160 → **47/163 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 03:00 +07). Kiểm toán: 160 + 3 slot mới = 163 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 42/184 = 22,8% (giảm từ 23,6%); DR 47/163 = 28,8% (giảm từ 29,4%).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: KHÔNG có bằng chứng mới — nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này 0 slot thiếu mới nên không có thêm dữ liệu về cơ chế. Không giao điều tra tiếp từ trong VM bằng cùng phương pháp.
2. **Mẫu lạ started_at lượt vcut ghi sau thời điểm đã thấy running — LẶP LẠI lần thứ 3 liên tiếp, jitter lớn nhất từ trước (+7.135 s, đợt 132).** Chỉ ghi nhận; T5/T6 đối chiếu — có thể là hành vi ghi log của scheduler sau reboot, không phải lỗi đếm slot. Chuỗi: đợt 130 +5.251 s → đợt 131 +1.585 s → đợt 132 +7.135 s.
3. **Dị thường muộn HB ở mức kỷ lục: KHÔNG tái hiện.** Không có HB muộn nào đợt này (cả 6 đều −316 s). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130).
4. **Reboot quanh ranh giới đợt: KHÔNG có reboot mới giữa lượt đợt 133** (boot 07da9c50 giữ nguyên từ lúc mở). Reboot thứ 6 liên tiếp (b379ecd7 → 07da9c50, btime 19:34:15Z) thuộc về đợt 132; T5 phân loại, T6 chốt số boot #80?/#81? (mù #37).
5. **Mù #49 B / #50 / #51 / #52: KHÔNG ĐỔI** (không kiểm lại — việc của T2; mù #52 mới mở đợt 132, probe thường lệ đợt 133). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round133-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round133-t7/NOTES.md` (không nằm trong repo nên không stage).
